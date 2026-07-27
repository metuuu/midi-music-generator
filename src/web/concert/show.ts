/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The show runner — the state machine, and the only thing that owns wiring.
 *
 * Every other module on this stage does one thing and knows nothing about the
 * rest: the animator moves limbs, the rig lights them, the tomatoes report that
 * one was hit. This file is where they meet, and it is deliberately the only
 * place with permission to know about all of them.
 *
 *     BILL ──click──▸ CURTAIN ──▸ COUNT-IN ──▸ PLAYING ──▸ APPLAUSE ──▸ next
 *                                                 ▲  │                   │
 *                                        programme │  │ P / button       ▾
 *                                                  └──▾ PROGRAMME       BOW
 *
 * Three things here are load-bearing and easy to get wrong:
 *
 * **The scheduler is stopped between numbers, not swapped.** Strudel's cycle
 * counter is global and `<a b c>` indexes it with `floor(cycle) mod n`, so
 * evaluating a 32-bar song while the clock sits at cycle 137.4 starts it at bar
 * 9. There is applause between numbers anyway, so a full stop costs nothing and
 * buys a correct transport. See `transport.ts`.
 *
 * **The clock is sampled once per frame, at the top, and passed to everyone.**
 * Two systems sampling independently disagree by a fraction of a millisecond
 * forever, in a way that is impossible to debug and looks like jitter.
 *
 * **The first click does three jobs at once** — it drops the bill, it starts
 * the show, and it is the gesture `initAudioOnFirstClick` has been waiting for
 * since page load. That is a coincidence worth keeping rather than designing
 * around: a concert that needs a click to begin is exactly what a browser
 * autoplay policy needs too.
 *
 * **Between numbers, most of the stage must be told to stop.** This is the one
 * that has bitten hardest. `transport.end()` drops the song and `beat()` then
 * reports 0 — honestly, because there is no position. Everything downstream
 * reads 0 as a *position*: the camera director decided its current shot began a
 * hundred and fifty beats in the future, drove its push term hard negative, and
 * reversed — measured — **200 metres** out through the back wall of the house
 * over the following five seconds. That is what the show used to do instead of
 * ending. (Not under `prefers-reduced-motion`, which sets the push to zero, so
 * it did not reproduce for everybody.) The animator has the mirror-image
 * problem — `end()`
 * empties its player list and it then stops driving the bodies at all, so the
 * band freezes mid-pose. So the runner tracks both explicitly (`clockLive`,
 * `animatorHasRigs`) and takes the bodies over when the animator lets go.
 */

import type { Camera, Object3D } from 'three';
import { Group, Vector3 } from 'three';

import type { LayerId, Song } from '../../core/types.js';
import { songDurationSeconds } from '../../core/types.js';
import { buildConcert, revoiceNumber } from '../../concert/index.js';
import type { Concert, ConcertNumber, ConcertOptions } from '../../concert/types.js';
import { instrumentIdForTrack, specFor } from '../../concert/instruments.js';
import { renderStrudel } from '../../render/strudel.js';
import { playCode, stopPlayback } from '../audio.js';

import { createAnimator, type Animator } from './animate.js';
import { createDirector, type CameraDirector } from './camera.js';
import { buildInstrumentFor } from './instruments/index.js';
import type { InstrumentModel } from './instruments/types.js';
import { buildLightRig, type LightRig } from './lights.js';
import { buildPerformer, type PerformerRig } from './performer.js';
import { renderBill, type BillView } from './showbill.js';
import { buildStage, type StageRig } from './stage.js';
import { createTomatoes, type Tomatoes } from './tomatoes.js';
import { createTransport, type ConcertTransport } from './transport.js';

export type ShowState =
  | 'bill' | 'curtain' | 'count-in' | 'playing' | 'applause' | 'bow';

export type Quality = 'low' | 'medium' | 'high';

export interface ShowOptions {
  concert?: ConcertOptions;
  quality?: Quality;
  reducedMotion?: boolean;
  /** Called whenever the state changes, for the page's status line. */
  onState?: (state: ShowState, show: Show) => void;
}

export interface Show {
  /** Everything the show owns. Add to the scene. */
  readonly root: Group;
  readonly camera: Camera;
  readonly concert: Concert;
  state(): ShowState;
  /** The number playing, 0-based. */
  index(): number;
  /** One call per frame. Samples the clock itself — nobody else may. */
  frame(dt: number): void;
  /** A click on the stage: advance the bill, or throw a tomato. */
  click(ndcX: number, ndcY: number): void;
  drag(dx: number, dy: number): void;
  aim(ndcX: number, ndcY: number): void;
  toggleProgramme(): void;
  setQuality(q: Quality): void;
  dispose(): void;
}

/** How long the audience claps before the next number is struck and staged. */
const APPLAUSE_SECONDS = 4.5;
/** Beats a tomatoed player sits out before returning with a new part. */
const SULK_BEATS = 8;

/**
 * How far the curtain has to have travelled before the band is in the room.
 *
 * The tabs hang at the plaster line and clear the front line by 0.58 m (see
 * `CURTAIN_FROM_LIP` in `stage.ts`), which covers a body and everything most
 * players hold. It does not cover everything: a trombone slide at full stretch
 * reaches 0.93 m downstage of its own station, and a grand piano's tail reaches
 * further still. Rather than hang the curtain out over the audience to cover an
 * extended slide, the band simply is not there until there is a gap to see it
 * through — which is also the older and better staging note, because a reveal
 * is a reveal.
 *
 * Small, not zero: at 0.02 the cloth still spans 98% of its own width, so the
 * frame the band appears on is a frame where the opening is a hairline.
 */
const CURTAIN_REVEALS = 0.02;

// --- The ending ------------------------------------------------------------
//
// The show used to end by drifting the camera backwards, which was not an
// ending anybody wrote — see the note at the top of the file for the mechanism
// and the 200 metres it covers. It read as a bug because it was one.
//
// A theatre ends with the curtain. So: the band acknowledges the house, the
// tabs come in over their own three-second traverse, and the picture goes under
// them. The camera does not move — `clockLive` sees to that.

/** Seconds into the bow before the tabs are brought in. Let them take a bow. */
const BOW_CURTAIN_AT = 1.6;
/** When the black starts, and how long it takes. Under the curtain, not before. */
const BOW_FADE_AT = 3.4;
const BOW_FADE_SECONDS = 2.6;
/** One deliberate dip of the head, in seconds. `setHeadNod` takes the sine. */
const BOW_NOD_SECONDS = 1.4;

export function createShow(opts: ShowOptions = {}): Show {
  const concert = buildConcert(opts.concert ?? {});
  let quality: Quality = opts.quality ?? 'high';
  const reducedMotion = opts.reducedMotion ?? prefersReducedMotion();

  const root = new Group();
  root.name = 'show';

  // --- The room, which outlives every number ----------------------------
  const stage = buildStage(concert.venue, { quality, reducedMotion });
  root.add(stage.root);
  const lights = buildLightRig(concert.venue, stage, { quality, reducedMotion });
  root.add(lights.root);

  const director = createDirector(reducedMotion);
  const transport = createTransport();
  const animator = createAnimator();
  const tomatoes = createTomatoes(root, { seed: concert.seed });

  const bill: BillView = renderBill(concert.bill, concert.venue, {
    ...(opts.concert ?? {}), seed: concert.seed, genre: concert.genre, era: concert.era,
  });
  document.body.append(bill.el);

  // --- Per-number state --------------------------------------------------
  /** The cast on stage, which is rebuilt whenever the instrumentation changes. */
  const rigs = new Map<string, PerformerRig>();
  const models = new Map<string, InstrumentModel>();
  const subjects = new Map<string, Object3D>();
  let band = new Group();
  band.name = 'band';
  root.add(band);

  let index = 0;
  let current: ConcertNumber = concert.numbers[0]!;
  let state: ShowState = 'bill';
  let stateSeconds = 0;
  /** Monotonic wall seconds. `PerformerRig.update` insists on them; `beat` wraps. */
  let seconds = 0;
  /**
   * Whether the beat the director is reading means anything.
   *
   * `transport.end()` drops the song and `beat()` then honestly reports 0 — but
   * the camera director takes 0 as a *position*, not as "no position", and the
   * result is the reverse-through-the-wall described above. There is no clock
   * between numbers, so there is nothing for the director to decide: hold the
   * frame it is on.
   */
  let clockLive = false;
  /**
   * Whether the animator is still driving the bodies.
   *
   * `Animator.update` owns `PerformerRig.update` for every player, and
   * `animator.end()` empties its player list — after which it returns before
   * touching anything and the whole band freezes mid-pose. That is invisible
   * during four seconds of applause behind a closing curtain, and very visible
   * during a bow, where the point is that they move. So the runner takes the
   * bodies over when the animator lets go. The flag exists so there is never a
   * frame where both drive them: `animate.ts` is explicit that two `rig.update`
   * calls in one frame run breath and blink at double rate.
   */
  let animatorHasRigs = false;
  /** 0..1 of black over the picture. Only the bow moves it. */
  let fade = 0;
  const blackout = buildBlackout();
  /** Layers currently silenced by a tomato, and the beat each may return on. */
  const sulking = new Map<LayerId, { until: number; attempt: number }>();

  const setState = (next: ShowState): void => {
    state = next;
    stateSeconds = 0;
    opts.onState?.(next, api);
  };

  // --- Staging -----------------------------------------------------------

  /**
   * Build the band for a number.
   *
   * Torn down and rebuilt per number rather than diffed. A set changes
   * instrumentation between numbers often enough that the diff would be most of
   * the code, and it happens behind a closed curtain during applause, where
   * nobody is looking and a frame of jank costs nothing.
   */
  function stageBand(number: ConcertNumber): void {
    strikeBand();

    for (const performer of number.cast.performers) {
      const rig = buildPerformer(performer);
      /**
       * `position` is already where the feet are. `riser` only explains why.
       *
       * The two look like they should be added and they must not be: casting
       * emits `y === riser` for anyone on a platform, so summing them stands
       * the drummer half a metre above their own riser with the kit hanging in
       * the air underneath the sticks. The casting system flagged this as
       * double-owned when it was built; adding them is the mistake it
       * predicted.
       */
      const [x, y, z] = performer.station.position;
      rig.root.position.set(x, y, z);
      rig.root.rotation.y = performer.station.facing;
      band.add(rig.root);
      rigs.set(performer.id, rig);
      subjects.set(performer.id, rig.root);

      const track = number.song.tracks.find((t) => t.layer === performer.layer);
      const model = buildInstrumentFor(
        performer,
        track ? instrumentIdForTrack(track) : undefined,
        concert.venue.palette.proscenium,
      );

      /**
       * Carried instruments hang off the player; standing ones do not.
       *
       * This is the whole of the distinction and it is worth spelling out,
       * because treating every instrument as furniture is the obvious thing to
       * do and it is visibly wrong: the front-line saxophonist swayed into a
       * phrase and went straight through their own horn. A sax is attached to a
       * person. A piano is attached to the floor, and the pianist leans over it.
       *
       * The animator re-reads `model.root.matrixWorld` every frame, so a
       * carried instrument's contacts follow the body for free — the hands stay
       * on the keys while the keys move.
       */
      if (specFor(performer.archetype).held) {
        rig.carry(model.root);
        // Torso-local: the rig's own origin is the hip, not the feet.
        model.root.position.copy(model.station.offset)
          .negate()
          .setY(-model.station.offset.y - rig.proportions.hipY);
        model.root.rotation.y = -model.station.facing;
      } else {
        /**
         * A floor instrument is not always square to the player who stands at
         * it, and `PlayerStation.facing` is how a model says so.
         *
         * It is the *player's* yaw expressed in the instrument's frame — so
         * the instrument's own yaw is the player's less that angle, and the
         * offset, which is also in the instrument's frame, has to be rotated
         * by the instrument's yaw rather than the player's. The two are the
         * same thing for the twenty-odd instruments that declare zero and
         * different for the one that does not: a harp asks for 0.585 rad
         * because you sit behind it and turn into it, and this branch used to
         * drop that on the floor, stand the harp square, and leave the
         * harpist reaching across their own shoulder for the top of the fan.
         *
         * The held branch has always applied it — `rotation.y =
         * -model.station.facing`, in torso-local space, which is the same
         * subtraction — so the two agree now instead of disagreeing quietly.
         */
        const yaw = performer.station.facing - model.station.facing;
        model.root.rotation.y = yaw;
        model.root.position.set(x, y, z).sub(
          new Vector3().copy(model.station.offset).applyAxisAngle(UP, yaw),
        );
        band.add(model.root);
      }
      models.set(performer.id, model);
    }

    director.setSubjects(subjects);
    lights.setSubjects(subjects);
    tomatoes.begin(number.cast, rigs, stage, {
      instruments: [...models].map(([id, m]) => [id, m.root] as const),
    });
  }

  function strikeBand(): void {
    for (const rig of rigs.values()) rig.dispose();
    for (const model of models.values()) model.dispose();
    rigs.clear();
    models.clear();
    subjects.clear();
    root.remove(band);
    band = new Group();
    band.name = 'band';
    root.add(band);
  }

  // --- Audio -------------------------------------------------------------

  /**
   * What the band is actually playing, with any silenced layers removed.
   *
   * The same mechanism the radio page's layer chips use, and it is already
   * proven live: re-render the pattern without those tracks and re-evaluate.
   * Strudel swaps patterns at the cycle boundary — one bar — so a player
   * dropping out lands musically instead of cutting.
   */
  function audible(song: Song): Song {
    if (!sulking.size) return song;
    return {
      ...song,
      tracks: song.tracks.filter((t) => !sulking.has(t.layer)),
      ...(sulking.has('drums') ? { drums: { ...song.drums, events: [] } } : {}),
    };
  }

  /**
   * Re-render the pattern, but not on this frame.
   *
   * `sound` is `async` and looks deferred and is not: `renderStrudel` runs
   * synchronously, before the first `await`, on whatever frame called it. That
   * is fine at the top of a number, where the picture is behind a curtain and
   * nothing is moving, and it is exactly wrong on the frame a tomato lands —
   * which is already the busiest frame of the show and the one the thrower is
   * watching for a response. A whole song's worth of pattern text is built
   * between the impact and the picture of it.
   *
   * So the impact frame gets the splat and the flinch, and the pattern is
   * rebuilt on the next task. Coalesced, because a burst of hits would
   * otherwise queue a full render each, and they would all produce the same
   * answer — the *last* state of `sulking` is the only one that matters.
   */
  let soundPending = false;
  function scheduleSound(): void {
    if (soundPending) return;
    soundPending = true;
    setTimeout(() => {
      soundPending = false;
      void sound(current.song);
    }, 0);
  }

  async function sound(song: Song): Promise<void> {
    try {
      await playCode(renderStrudel(audible(song)));
    } catch (err) {
      // A pattern that will not evaluate is a bug worth seeing, but it must not
      // take the stage down with it — the visuals are driven by the IR and will
      // carry on perfectly well in silence.
      console.error('concert: Strudel could not evaluate the pattern', err);
    }
  }

  // --- Numbers -----------------------------------------------------------

  async function beginNumber(n: number): Promise<void> {
    index = n;
    current = concert.numbers[n]!;
    sulking.clear();

    stageBand(current);
    animator.begin(current, rigs, models);
    animatorHasRigs = true;
    lights.begin(current.lighting);
    director.begin(current.song, current.cast, current.solos, concert.venue, `${concert.seed}/${n}`);
    // No `tomatoes.strike()` here: `begin` is a strike plus a new cast, says so
    // in its own contract, and a second strike would throw away the pool
    // warm-up that `begin` just paid for behind this closed curtain.

    // Stop before evaluating. See the module note: a running cycle counter
    // would start this song somewhere in its middle.
    await stopPlayback();
    transport.begin(current.song);
    clockLive = true;
    await sound(current.song);

    stage.setCurtain(1);
    lights.setHouse(0);
    setState('count-in');
  }

  function endNumber(): void {
    void stopPlayback();
    transport.end();
    clockLive = false;
    animator.end();
    animatorHasRigs = false;
    lights.setHouse(0.45);
    stage.applaud(1);
    setState(index + 1 < concert.numbers.length ? 'applause' : 'bow');
  }

  /**
   * The band turns out and takes it.
   *
   * Everything a bow needs is already on `PerformerRig` — a face, a gaze and a
   * head nod — so this is three calls and no new API. The nod is driven from
   * the bow's own clock rather than the song's, because there is no song.
   */
  function acknowledge(t: number): void {
    HOUSE.set(0, 1.55, stage.metrics.lipZ + 3.5);
    const dip = t < BOW_NOD_SECONDS ? Math.sin((t / BOW_NOD_SECONDS) * Math.PI) : 0;
    for (const rig of rigs.values()) {
      rig.lookAt(HOUSE);
      rig.setHeadNod(dip, Math.PI / 2);
      rig.setSway(0.25 * (1 - dip), t * 1.6);
    }
  }

  // --- Tomato consequences ----------------------------------------------
  //
  // The tomatoes module reports; this decides what it means. That split is why
  // it could be built without ever importing the generator.

  tomatoes.onHit((hit) => {
    const performer = current.cast.performers.find((p) => p.id === hit.performerId);
    if (!performer || state !== 'playing') return;

    const layer = performer.layer;
    const prior = sulking.get(layer);
    const attempt = (prior?.attempt ?? 0) + 1;
    sulking.set(layer, { until: transport.beat() + SULK_BEATS, attempt });

    animator.setPlaying(hit.performerId, false);
    // Off this frame. See `scheduleSound`.
    scheduleSound();
  });

  tomatoes.onPatienceLost(() => {
    if (state !== 'playing') return;
    // The band stops together, properly, rather than the audio being cut. They
    // finish the bar they are in — anything else reads as a crash, not a walk-off.
    endNumber();
  });

  /** Bring a sulking player back with a freshly generated part. */
  function returnToPlaying(layer: LayerId, attempt: number): void {
    current = revoiceNumber(current, layer, attempt);
    concert.numbers[index] = current;
    sulking.delete(layer);
    animator.begin(current, rigs, models);
    for (const p of current.cast.performers) {
      if (p.layer === layer) animator.setPlaying(p.id, true);
    }
    // Also off this frame, and for the same reason: this one already ran
    // `revoiceNumber` here, so it is the last thing that should also render a
    // pattern before the picture gets a look in.
    scheduleSound();
  }

  // --- Input -------------------------------------------------------------

  bill.onStart(() => {
    if (state !== 'bill') return;
    bill.hide();
    setState('curtain');
    void beginNumber(0);
  });

  // --- The frame ---------------------------------------------------------

  function frame(dt: number): void {
    stateSeconds += dt;
    seconds += dt;

    /**
     * One sample, at the top, passed to everyone. Nothing below may ask the
     * transport again this frame.
     */
    const beat = transport.beat();

    switch (state) {
      case 'bill':
        stage.snapCurtain(0);
        lights.setHouse(0.7);
        break;

      case 'curtain':
        // `beginNumber` has already asked the curtain to open; wait for the
        // cloth rather than for a timer, because the gather takes as long as it
        // takes and a timer would either cut it off or leave a gap.
        if (stage.curtainOpen() > 0.98) setState('count-in');
        break;

      case 'count-in':
        // The transport reports zero until the first cycle actually arrives.
        // That gap *is* the count-in: the band comes up, the lights are on,
        // and nothing has happened yet.
        //
        // "Comes up" is literal now, and this is where it is asked for. The
        // animator holds the band at ease from `begin` — which happens behind
        // a closed curtain, in the middle of two awaited promises — until it
        // is called, so that the one moment worth watching lands while the
        // tabs are travelling rather than before anybody can see the stage.
        // `cue` is idempotent, so calling it per frame is a boolean write and
        // both routes into this state are covered without a second flag.
        animator.cue();
        if (transport.state() === 'playing' && beat > 0) setState('playing');
        break;

      case 'playing': {
        for (const [layer, sulk] of sulking) {
          if (beat >= sulk.until) returnToPlaying(layer, sulk.attempt);
        }
        const total = songDurationSeconds(current.song) * current.song.meta.bpm / 60;
        if (transport.elapsed() >= total) endNumber();
        bill.mark(index, total > 0 ? Math.min(transport.elapsed() / total, 1) : 0);
        break;
      }

      case 'applause':
        if (stateSeconds > APPLAUSE_SECONDS) {
          stage.setCurtain(0);
          setState('curtain');
          void beginNumber(index + 1);
        }
        break;

      case 'bow':
        // The house up, the band out, the tabs in, and then the black. No
        // camera move anywhere in it — see the note by `BOW_CURTAIN_AT`.
        lights.setHouse(0.7);
        acknowledge(stateSeconds);
        if (stateSeconds > BOW_CURTAIN_AT) stage.setCurtain(0);
        fade = Math.min(1, Math.max(0, (stateSeconds - BOW_FADE_AT) / BOW_FADE_SECONDS));
        break;
    }

    /**
     * The band is behind the cloth until there is a gap to see it through.
     * The bow is the exception, because a bow wants the curtain coming in over
     * a band that is visibly still there.
     */
    band.visible = state === 'bow' || stage.curtainOpen() > CURTAIN_REVEALS;
    blackout.style.opacity = fade > 0 ? String(fade) : '0';

    if (animatorHasRigs) animator.update(beat, dt);
    else for (const rig of rigs.values()) rig.update(seconds, dt);
    lights.update(beat, dt);
    // Only while the beat means something. `transport.end()` reports 0, and the
    // director reads 0 as a position rather than as an absence — which is the
    // whole of the zoom-out this show used to end on.
    if (clockLive) director.update(beat, dt);
    tomatoes.update(beat, dt);
    stage.update(beat, dt);
    for (const model of models.values()) model.update(beat);
  }

  const api: Show = {
    root,
    camera: director.camera,
    concert,
    state: () => state,
    index: () => index,
    frame,

    click(ndcX, ndcY) {
      // Three things a click can mean, and the state decides which. Getting
      // this wrong is what makes tomatoes feel broken.
      if (state === 'bill') return;
      if (state === 'playing' || state === 'count-in') {
        tomatoes.aim(ndcX, ndcY, director.camera);
        tomatoes.throwNow(director.camera);
      }
    },

    aim(ndcX, ndcY) { tomatoes.aim(ndcX, ndcY, director.camera); },
    drag(dx, dy) { director.orbit(dx, dy); },
    toggleProgramme() { bill.toggleProgramme(); },

    setQuality(q) {
      quality = q;
      stage.setQuality(q);
      lights.setQuality(q);
    },

    dispose() {
      void stopPlayback();
      animator.end();
      strikeBand();
      tomatoes.dispose();
      lights.dispose();
      stage.dispose();
      blackout.remove();
      bill.destroy?.();
    },
  };

  bill.show('opening');
  opts.onState?.(state, api);
  return api;
}

const UP = new Vector3(0, 1, 0);
/** Where the band looks when they take a bow. Rewritten each frame. */
const HOUSE = new Vector3(0, 1.55, 8);

/**
 * A sheet of black over the picture, for the end of the show.
 *
 * Not a light cue, because there is no such cue to call: `LightRig.setHouse`
 * only ever *adds* — the rig is explicit that the house is a probe that must
 * not be able to fight the score — and nothing else in the lighting API goes to
 * black. Which is fine, because a fade-out is not a lighting state anyway. It
 * is a sheet of black, exactly as it is in a theatre.
 *
 * It goes immediately after the canvas rather than at the end of the body, so
 * the picture goes and whatever the page is captioning with — "Thank you.
 * Goodnight." — is still legible on the black.
 */
function buildBlackout(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'show-blackout';
  el.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;'
    + 'pointer-events:none;z-index:0';
  const canvas = document.querySelector('canvas');
  if (canvas?.parentNode) canvas.parentNode.insertBefore(el, canvas.nextSibling);
  else document.body.append(el);
  return el;
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
