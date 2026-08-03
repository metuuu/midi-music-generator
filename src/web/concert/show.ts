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
 * The two edges either side of PLAYING carry most of the staging, and both of
 * them are about *order*. CURTAIN is: tabs open, stage look up under them,
 * whoever opens the number picks up their instrument — and no sound at all,
 * because the pattern is compiled behind the cloth and started later. COUNT-IN
 * is the leader beating time and then the first bar of the music, which for
 * anything with a kit is the drummer's four clicks, and the drummer is then
 * also the leader (`withCountIn`, in the generator — the count is music, not an
 * effect). APPLAUSE runs the other way: the last
 * chord is still ringing, the house comes up, the tabs come in *over* the band
 * while they take it, and the next number is not staged until the cloth is
 * shut. Nobody watches six people turn into six other people.
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
import { Group, Raycaster, Vector2, Vector3 } from 'three';

import { Rng } from '../../core/rng.js';
import type { LayerId, Song } from '../../core/types.js';
import { songDurationSeconds } from '../../core/types.js';
import { buildConcert, revoiceNumber } from '../../concert/index.js';
import { trackForPart } from '../../concert/choreograph.js';
import type {
  Concert, ConcertNumber, ConcertOptions, PartRef, Performer, StageMachine,
} from '../../concert/types.js';
import { drumEventsFor, instrumentIdForTrack, specFor } from '../../concert/instruments.js';
import { getGenre } from '../../genre/index.js';
import { renderStrudel } from '../../render/strudel.js';
import { loadCode, playCode, preloadSounds, startLoaded, stopPlayback } from '../audio.js';
import { createSungVoice, withoutSungVoice } from '../sung-voice.js';

import { createAnimator, type Animator } from './animate.js';
import { createDirector, type CameraDirector } from './camera.js';
import {
  buildCabling, buildStageBox, buildTail, cableBounds, DECK, stageBoxAt, stageBoxSocket,
  type Cabling, type CableRun, type Obstacle, type StageBox,
} from './cables.js';
import { buildDebugTag, type DebugTag } from './debug-tags.js';
import { riserFootprint } from './stage-props.js';
import { buildDrumMachine, type DrumMachine } from './instruments/drum-machine.js';
import { aimMachineControls, buildInstrumentFor } from './instruments/index.js';
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
  /**
   * Label every player with the part they are playing — `?debug` on the page.
   *
   * A diagnostic and nothing else: it changes no staging, no timing and no
   * sound, it only prints what the Song IR already says over the head of the
   * person the casting gave that track to. See `debug-tags.ts`.
   */
  debug?: boolean;
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
  /**
   * Show the programme mid-concert, or put it away again. The music never
   * stops for it. Ignored while the opening bill is still up — that bill *is*
   * the programme, and there is no show behind it to go back to.
   */
  toggleProgramme(): void;
  /** Put the programme away if it is up. Never touches the opening bill. */
  closeProgramme(): void;
  setQuality(q: Quality): void;
  dispose(): void;
}

/** How long the audience claps before the next number is struck and staged. */
const APPLAUSE_SECONDS = 4.5;
/** Beats a tomatoed player sits out before returning with a new part. */
const SULK_BEATS = 8;

// --- The beginning ---------------------------------------------------------
//
// A number used to start on the frame the curtain did: `beginNumber` evaluated
// the pattern and then opened the tabs, and Strudel starts a pattern about a
// tenth of a second after it is handed one. So the first bar of music and the
// first millimetre of cloth happened together, which is not a thing that has
// ever happened in a theatre and read exactly as wrong as it was — no reveal,
// no beginning, just an edit.
//
// What a room actually does, in order, is: the tabs open onto a stage that is
// coming up under them; the band takes up its instruments while they travel;
// somebody counts; and *then* the music. Each of those is a step below, and the
// ones with a fixed length have a number here rather than being folded into one
// another — the curtain's own three seconds are the curtain's, and the count's
// are the count's.
//
// There used to be a house dim in front of all that, because that is the order
// a real room does it in and a real room is right. A page is not a room. The
// audience arrives *at the interval* — the programme is already up, the tabs
// are already in, and the click is not the moment they sat down, it is the
// moment they asked for the show. Taking a lit room away from them first meant
// the first second of the evening was a subtraction, and then a curtain opened
// on the dark it had just made. So the room is at its show level before the
// programme is ever read: nothing dims when the click lands, because there is
// nothing left to dim.

/** Seconds a house move takes. Slow: everybody is looking at it. */
const HOUSE_DIM_SECONDS = 1.0;
/**
 * The house level the show runs at, and therefore the level it is found at.
 *
 * Not zero. The house is a second probe and only ever adds (see `setHouse`), so
 * a floor under it cannot fight the score — what it buys is a room that is
 * *dark* rather than *absent*: a curtain you can see is red before it moves, a
 * proscenium with an edge, and a band that has a floor of visibility under
 * whatever the cue sheet is doing to it.
 *
 * Small, and this is the number to move if it is wrong in either direction. At
 * `GAIN.house` it lands around a quarter of a hemisphere, which is under a
 * third of a jazz intro's wash — a fill, not a light. Any higher and the
 * cellar stops being a cellar.
 */
const HOUSE_FLOOR = 0.10;
/**
 * How long after the click the tabs start to travel.
 *
 * Short, and not zero: the click frame is the one that tears down six bodies
 * and builds six more (`stageNumber`), and a curtain that starts moving on it
 * stutters in its first centimetres. This is that frame, not a dramatic pause.
 */
const CURTAIN_AT = 0.2;
/** Seconds the score's own opening state takes to come up behind the cloth. */
const STAGE_UP_SECONDS = 1.9;
/** House level for the applause, and further up again for the curtain call. */
const HOUSE_APPLAUSE = 0.45;
const HOUSE_CALL = 0.7;
/** Seconds the house takes to come back up at the end of a number. */
const HOUSE_UP_SECONDS = 0.9;
/**
 * Seconds the stage look takes to go out under the incoming curtain.
 *
 * A little under the cloth's own full traverse — 0.9 + 2.4 s of easing, in
 * `stage-curtain.ts` — so the last thing the house sees is the band dimming
 * behind it rather than a lit stage being covered up.
 */
const CURTAIN_IN_SECONDS = 2.6;

/**
 * Seconds between the reveal landing and the music starting.
 *
 * The count-in proper is *inside the music* — see `withCountIn` — so this is
 * only the beat before it: the band settled, the leader looking round, the
 * moment where a real band checks that everybody is actually ready. Long
 * enough to read as deliberate, short enough that nobody wonders whether the
 * page has hung.
 */
const CUE_SECONDS = 1.1;

/**
 * The beat handed to the animator before the transport has started.
 *
 * Negative, and any negative will do: the cursors are all `beat`-indexed, so a
 * position before the first gesture is exactly "nothing has happened yet",
 * which is the truth. It matters that it is not **zero** — zero is a real
 * position in the music, and the band held there was standing at the first
 * downbeat's pose for as long as the reveal took. That was the whole of "some
 * of them are already playing before the music starts".
 */
const PRE_ROLL_BEAT = -1;

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
//
// The *number's* ending is a different thing and is not decided here at all.
// `landEnding` in `generate/song.ts` writes the last bar as a held chord, so
// by the time the transport runs out there is a whole bar of it ringing and
// stopping the scheduler does not cut it — Strudel's stop halts the clock and
// leaves the voices already handed to the audio graph to finish. What happens
// here is only what a room does over that ringing chord: the house comes up,
// the audience claps, and the tabs come in over the band while they take it.

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
  director.room(stage.metrics);
  const transport = createTransport();
  /**
   * The singer, taken out of the pattern and given her own voice.
   *
   * One per show rather than one per number: she owns a reverb impulse and a
   * noise buffer, and rebuilding those between numbers would be a lot of
   * garbage for a stage that changes song every few minutes.
   */
  const voice = createSungVoice();
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
  /**
   * Gear that plays without hands. Almost always empty; see `Cast.machines`.
   *
   * Kept beside `models` rather than inside it because the two are driven
   * differently and only one of them has a performer: a model is placed from a
   * `Performer.station` and ticked with that performer's shown beat, and a
   * machine is placed from its own `StageMachine` and ticked with the clock.
   */
  const machines: DrumMachine[] = [];
  /** Empty unless `opts.debug`. Keyed like `rigs`, and struck with them. */
  const tags = new Map<string, DebugTag>();
  /**
   * The same, for the things with no performer to key on.
   *
   * A separate map rather than a shared one because a machine's line is written
   * from a `StageMachine` and not from a `Performer`, and the spec is carried
   * along here so the label does not have to go looking for it every frame.
   */
  const machineTags = new Map<string, { tag: DebugTag; spec: StageMachine }>();
  /**
   * The leads, the box they run to, and the tails hanging off carried gear.
   *
   * Kept here rather than under the objects they join because a lead belongs to
   * neither end of itself — see `cables.ts`. The tails are the exception and are
   * parented to their instruments; they are listed only so they get disposed
   * with everything else rather than riding a model that is about to be thrown
   * away.
   */
  let cabling: Cabling | undefined;
  let stageBox: StageBox | undefined;
  const tails: { root: Object3D; dispose(): void }[] = [];
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
  /**
   * Whether the tabs have been sent out for this number, and whether the band
   * has been cued. Both are one-shots inside a state that lasts several
   * seconds, and both drive things that must not be re-asked every frame: a
   * fade re-issued per frame never finishes, and a curtain re-issued per frame
   * restarts its own easing.
   */
  let revealed = false;
  let cueGiven = false;
  /**
   * The song whose pattern is compiled and sitting in the scheduler, stopped.
   *
   * Identity rather than a boolean, because a tomato can replace `current.song`
   * between the load and the downbeat — `revoiceNumber` builds a new object —
   * and starting a stale pattern would put the stage a bar out of step with
   * what is sounding.
   */
  let loaded: Song | undefined;
  /** The load in flight, so the downbeat can wait for it rather than race it. */
  let loading: Promise<void> | undefined;
  /**
   * The last beat the clock actually reported, held while it is stopped.
   *
   * The lighting rig is indexed by beat, and `transport.end()` reports 0 —
   * which is a real position in the cue timeline, and specifically the
   * *opening* one. So the moment a number finished, the stage snapped back to
   * the state it had started in and held it through the applause. Reset by
   * `stageNumber`, because a held beat from the previous number would index
   * the new timeline at its ending.
   */
  let heldBeat = 0;
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

    /**
     * Where every lead on this stage is heading, decided before anything is
     * placed, because each piece of gear hands over its run as it goes down.
     *
     * Beside the riser rather than behind it: a hub the drummer's platform
     * hides is a hub nobody can see leads converging on, and the converging is
     * the entire point — see §8.4 of `docs/backline-plan.md`. Clamped inside
     * the boards so a narrow room does not put it in the wings.
     */
    const m = stage.metrics;
    const riser = riserFootprint(m);
    const boxAt = stageBoxAt(m);
    /**
     * The next free jack on the box, handed out as gear goes down.
     *
     * A function rather than the one point it used to be: every lead landed on
     * the centre of the face, so the last half-metre of all of them was one
     * line drawn eight times over. They arrive at their own sockets now, in the
     * order the band is dressed, which is also the order the row is drawn in —
     * see `stageBoxSocket`. Counted separately from `runs` because a machine's
     * lead usually goes to its tender's rig instead and must not eat a jack it
     * never arrives at.
     */
    let sockets = 0;
    const boxSocket = (): Vector3 => stageBoxSocket(boxAt, 0, sockets++);
    const runs: CableRun[] = [];
    /**
     * What a lead may not cross, which is a shorter list than it looks.
     *
     * The riser, because a cable does not climb a 40 cm platform, and it is the
     * one obstacle whose failure would be unmistakable. And feet, because a
     * lead at 8 mm and a shoe occupy the same air — but only barely, so the
     * circle is a shoe pair and not a personal space. Nothing else: a lead
     * passing under a keyboard stand or between a piano's legs is not a defect,
     * it is what the floor of a stage looks like.
     */
    const obstacles: Obstacle[] = [];
    if (number.cast.performers.some((p) => p.station.riser > 0)) {
      obstacles.push({
        kind: 'box', x: 0, z: riser.z, halfX: riser.w / 2 + 0.05, halfZ: riser.d / 2 + 0.05,
      });
    }
    for (const p of number.cast.performers) {
      obstacles.push({ kind: 'circle', x: p.station.position[0], z: p.station.position[2], r: 0.3 });
    }

    /**
     * The platform only stands when somebody is standing on it.
     *
     * The riser belongs to the room and the drummer belongs to the number, and
     * this is the only place both are in hand. Numbers whose percussion is a
     * machine have no `riser` in the cast at all, and `cast.ts` then hands the
     * back centre to whoever needs it — so the platform has to go, or it comes
     * up through their legs. See `StageRig.showRiser`.
     */
    stage.showRiser(number.cast.performers.some((p) => p.station.riser > 0));

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

      /**
       * Parented to the rig rather than to the band, so the label rides the
       * player: a hair over the crown, from the head the posture actually gave
       * them rather than from a standing height a seated player does not have.
       */
      if (opts.debug) {
        const tag = buildDebugTag();
        tag.root.position.set(0, rig.proportions.head.y + rig.proportions.headR + 0.12, 0);
        rig.root.add(tag.root);
        tags.set(performer.id, tag);
      }

      const track = number.song.tracks.find((t) => t.layer === performer.layer);
      /**
       * Everything this player is minding, in the order the choreographer
       * counted them.
       *
       * `PlayPoint.control` names a machine by its index in this list, so it has
       * to be the same list `choreograph` built — which it is, because both take
       * `cast.machines` in order and filter on `tendedBy`. Getting this out of
       * step would send a hand to the wrong box, silently.
       */
      const minded = (number.cast.machines ?? [])
        .filter((m) => m.tendedBy === performer.id);
      /**
       * A machine mounted *inside* this performer's rig, if the cast said so.
       *
       * Only a modular has a bay for one, and only its tender gets it — see
       * `StageMachine.mount`. The instrument then draws the machine as a module
       * and no separate object is built for it below.
       */
      const bay = minded.find((m) => m.mount === 'bay');
      const model = buildInstrumentFor(
        performer,
        track ? instrumentIdForTrack(track) : undefined,
        concert.venue.palette.proscenium,
        concert.year,
        number.song.drums.source,
        bay
          ? {
            kind: bay.kind,
            events: notesOf(number, bay),
            beatsPerBar: number.song.meta.beatsPerBar,
            ...startedAt(number, bay),
          }
          : undefined,
        /**
         * The percussion this player is actually carrying, from the part they
         * are actually playing — their *share* of it, so a drummer standing
         * beside a hand percussionist does not grow a tambourine the other
         * player is holding. Every model but the two percussion ones ignores it.
         */
        performer.layer === 'drums'
          ? [...new Set(drumEventsFor(number.song.drums.events, performer.archetype)
            .map((e) => e.voice))]
          : undefined,
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

        /**
         * A guitar's lead is two objects, and that is not a compromise.
         *
         * The tail hangs off the jack and is built in the *instrument's* frame,
         * so it moves with the guitar for free — anything in band space would
         * detach the first time the player swayed into a phrase, and rebuilding
         * a tube every frame to avoid that is a lot of geometry for 60 cm of
         * rubber. The run along the boards then starts from the slack behind
         * their feet rather than from the socket.
         *
         * Which is what a guitar lead does. There is always a loop of it on the
         * deck, and the loop is the reason the player can move at all.
         */
        if (model.outlet) {
          /**
           * Leaning back and down, in the guitar's own frame.
           *
           * A carried instrument's frame cannot say where the stage box is —
           * it is torso-local and turns with the player — so this one gets a
           * fixed lean rather than an aim. It costs nothing: the tail is the
           * only lead on the stage that is not required to meet anything, and
           * a loop of slack at a guitarist's feet has no direction to be wrong
           * about.
           */
          const tail = buildTail(model.outlet, 0.55, new Vector3(0, 0, -1));
          model.root.add(tail.root);
          tails.push(tail);
          const back = new Vector3(0, 0, -0.38).applyAxisAngle(UP, performer.station.facing);
          runs.push({
            from: new Vector3(x + back.x, DECK, z + back.z),
            to: boxSocket(),
          });
        }
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

        /**
         * Gear that stands on the floor drops its own lead to the boards, and
         * the run to the box starts where that lands.
         *
         * The drop used to be two points inside `leadCurve`, in band space, and
         * it showed: the whole descent from a socket 80 cm up was squeezed into
         * one bend, so the cable left the case like a diving board and met the
         * deck at a corner — at the one point along its length where it is
         * nearest the camera. Building it in the model's own frame and handing
         * the run its *foot* makes the drop and the run one cable, and lets the
         * drop flatten over its last quarter the way a real one does.
         *
         * Aimed along the way the run leaves, so the two do not meet at an
         * angle. Skipped where the socket is already on the boards: the
         * singer's mic lead gets itself down there under its own steam.
         */
        if (model.outlet) {
          const start = model.outlet.clone();
          const drop = start.y - DECK;
          /**
           * One socket, claimed once and used twice.
           *
           * `boxSocket()` hands out the *next* one each time it is called, so
           * asking it for the direction to aim the drop and then asking it
           * again for where the run lands gives one instrument two sockets and
           * aims its lead at the wrong one — burning a slot on the box for
           * every piece of gear on the stage, and pointing the only part of the
           * cable anybody is close enough to read at a socket it does not go
           * to.
           */
          const target = boxSocket();
          if (drop > 0.05) {
            const along = new Vector3(
              target.x - model.root.position.x, 0, target.z - model.root.position.z,
            ).applyAxisAngle(UP, -yaw);
            const tail = buildTail(start, drop, along);
            model.root.add(tail.root);
            tails.push(tail);
            start.copy(tail.foot);
          }
          runs.push({
            from: start.applyAxisAngle(UP, yaw).add(model.root.position).setY(DECK),
            to: target,
          });
        }

        /**
         * …and now this player's instrument can answer for the boxes beside it.
         *
         * Only here, and only in this branch, because this is the first moment
         * anything knows where the instrument was finally stood — and only a
         * player standing at something can be minding a machine anyway, since
         * casting will not hand one to a pair of hands holding a horn.
         *
         * The stand's own position is in stage coordinates and the contact has
         * to be in the model's, so it is the placement above run backwards: out
         * of the model's origin and out of its yaw. See `aimMachineControls`.
         */
        if (minded.length) {
          const cos = Math.cos(-yaw);
          const sin = Math.sin(-yaw);
          aimMachineControls(model, minded.map((m) => {
            // A bay is on this player's own rig, so the model's own panel is
            // the right answer and this must not override it.
            if (m.mount === 'bay') return undefined;
            const dx = m.position[0] - model.root.position.x;
            const dz = m.position[2] - model.root.position.z;
            return {
              // Which object it is, because a programmable machine is half as
              // wide again as a preset one and its row sits deeper on the case.
              kind: m.kind,
              x: dx * cos + dz * sin,
              y: m.position[1] - model.root.position.y,
              z: -dx * sin + dz * cos,
              yaw: m.facing - yaw,
            };
          }));
        }
      }
      models.set(performer.id, model);
    }

    /**
     * The machines, which have no performer to hang off.
     *
     * They are handed the number's own drum events because that is what the
     * object holds — a rhythm box has its pattern in memory — and it is what
     * lets the step lamp run from nothing but the beat. See `drum-machine.ts`.
     */
    for (const spec of number.cast.machines ?? []) {
      // A bay is drawn by the instrument that contains it, above.
      if (spec.mount === 'bay') continue;
      const machine = buildDrumMachine({
        kind: spec.kind,
        seed: new Rng(`machine:${concert.seed}:${spec.id}`).int(0, 0xffff),
        finish: concert.venue.palette.proscenium,
        events: notesOf(number, spec),
        beatsPerBar: number.song.meta.beatsPerBar,
        stand: spec.stand ?? 0.9,
        ...startedAt(number, spec),
      });
      const [mx, my, mz] = spec.position;
      machine.root.position.set(mx, my, mz);
      machine.root.rotation.y = spec.facing;
      band.add(machine.root);
      machines.push(machine);

      /**
       * The machine's lead goes to its owner's rig, not to the stage box.
       *
       * Electrically that is a small lie — the real object goes to the mixer
       * with everything else — and it is the right lie, because it is the one
       * thing on this stage that says *this box and that keyboard are one
       * person's corner*. §8.0 has been making that argument in prose for three
       * revisions and paying for it with a purpose-built stand; a short lead
       * into the rig beside it says the same thing in something an audience can
       * actually see, which a stand cannot.
       *
       * With no tender there is nothing to belong to, and it takes the long run
       * to the box like everything else.
       */
      /**
       * …and only where the host's own frame is the band's.
       *
       * Casting never gives a machine to somebody carrying their instrument —
       * `placeMachines` excludes `held` archetypes, because a machine needs a
       * free hand — so this is presently always true. It is checked rather than
       * assumed because a carried model's root is *torso-local*, so the day
       * that rule is relaxed the lead would be drawn to a point measured from
       * somebody's hip in a frame where that means the middle of the stage.
       * Silent, and wrong by metres.
       */
      const tender = spec.tendedBy
        ? number.cast.performers.find((p) => p.id === spec.tendedBy)
        : undefined;
      const host = tender && !specFor(tender.archetype).held
        ? models.get(tender.id)
        : undefined;
      const lands = host ? host.root.position.clone().setY(DECK) : boxSocket();
      /**
       * …and it climbs down the stand first, in the machine's own frame.
       *
       * The longest drop on the stage: this socket is on the back of a case
       * held most of a metre up on four tubes, so a lead that fell from it in
       * band space was a straight rod from the box to the boards standing
       * beside the stand it is supposed to be running down. Its own frame is
       * also the right one on the merits — the stand and the case are one
       * object, and what hangs off the back of them belongs to it.
       *
       * Local `y` is measured from the top of the stand, so the drop to the
       * boards is the stand's own height plus however far the socket sits above
       * it.
       */
      const jack = machine.outlet.clone();
      const fall = machine.root.position.y + jack.y - DECK;
      if (fall > 0.05) {
        const along = new Vector3(lands.x - mx, 0, lands.z - mz)
          .applyAxisAngle(UP, -spec.facing);
        const tail = buildTail(jack, fall, along);
        machine.root.add(tail.root);
        tails.push(tail);
        jack.copy(tail.foot);
      }
      runs.push({
        from: jack.applyAxisAngle(UP, spec.facing).add(machine.root.position).setY(DECK),
        to: lands,
      });

      /**
       * A machine gets a label too, and it is the only part of the evening
       * that had none.
       *
       * Casting makes no performer for a machine-played track, so the debug
       * pass over `cast.performers` could never reach one: the drum part of a
       * `box` number was floating over nobody's head, which is the same
       * complaint as the one §8.3 is about, in the one view whose whole job is
       * to say where a part went.
       *
       * A hand's height over the case, which is where a head would be if this
       * object had one.
       */
      if (opts.debug) {
        const tag = buildDebugTag();
        tag.root.position.set(0, 0.24, 0);
        machine.root.add(tag.root);
        machineTags.set(spec.id, { tag, spec });
      }
    }

    /**
     * The leads, once everything they join has been placed.
     *
     * Built last because a lead is the only thing on this stage that is a fact
     * about two objects rather than about one, so it cannot be built until both
     * of them have stopped moving.
     *
     * **No electric gear, no box.** An acoustic jazz trio with a stage box and
     * nothing plugged into it is a prop, and this whole section exists to stop
     * objects standing about unexplained.
     */
    if (runs.length) {
      /**
       * …and one cable out of the back of it, under the masking.
       *
       * Everything on this stage runs *to* the box and nothing ran out of it,
       * which made a hub that swallows leads — and §8.4's case for a hub over
       * cables disappearing into the wings only holds if the hub is a
       * break-out. One multicore going where the desk is says that, and it is
       * the one run allowed to leave: it is what the other eight are for.
       *
       * It ends *on* the last two centimetres of the boards rather than past
       * them: the wall stands 25 cm behind that edge and the drape 10 cm, so
       * from every seat in the house the end is against whichever this room
       * has and the cable reads as going under it. Two centimetres further and
       * it would be a tube hanging over the void behind the deck.
       *
       * Angled toward the wing rather than straight back, because that is where
       * a multicore goes, and clamped inside the boards because a narrow room
       * puts the box within half a metre of the edge already.
       */
      const box = buildStageBox(boxAt, 0, new Vector3(
        Math.max(boxAt.x - 0.62, -m.width / 2 + 0.12), 0, m.backZ + 0.02,
      ));
      band.add(box.root);
      stageBox = box;
      cabling = buildCabling({ runs, obstacles, bounds: cableBounds(m) });
      band.add(cabling.root);
    }

    director.setSubjects(subjects);
    lights.setSubjects(subjects);
    tomatoes.begin(number.cast, rigs, stage, {
      instruments: [...models].map(([id, m]) => [id, m.root] as const),
    });
  }

  function strikeBand(): void {
    for (const tag of tags.values()) tag.dispose();
    for (const { tag } of machineTags.values()) tag.dispose();
    for (const rig of rigs.values()) rig.dispose();
    for (const model of models.values()) model.dispose();
    for (const machine of machines) machine.dispose();
    for (const tail of tails) tail.dispose();
    cabling?.dispose();
    stageBox?.dispose();
    cabling = undefined;
    stageBox = undefined;
    tails.length = 0;
    tags.clear();
    machineTags.clear();
    rigs.clear();
    models.clear();
    machines.length = 0;
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
      await playCode(renderStrudel(withoutSungVoice(audible(song))));
      voice.begin(audible(song));
    } catch (err) {
      // A pattern that will not evaluate is a bug worth seeing, but it must not
      // take the stage down with it — the visuals are driven by the IR and will
      // carry on perfectly well in silence.
      console.error('concert: Strudel could not evaluate the pattern', err);
    }
  }

  // --- Numbers -----------------------------------------------------------

  /**
   * Put a number on the stage. Behind a closed curtain, in silence.
   *
   * Everything expensive happens here — six bodies and their instruments torn
   * down and rebuilt, a cue timeline, a camera plan, and the pattern text
   * compiled — and all of it while the cloth is shut and the stage look is
   * held at zero. That is not only for the jank: it is what the curtain is
   * *for*. The audience should meet a band that is already standing there.
   */
  function stageNumber(n: number): void {
    index = n;
    current = concert.numbers[n]!;
    sulking.clear();
    revealed = false;
    cueGiven = false;
    heldBeat = 0;

    // The programme can be opened at any moment, including this one, so the
    // number being staged is marked the instant it is staged rather than at the
    // downbeat — behind a closed curtain the next number is already the one the
    // evening is on, and a programme that still points at the last one is
    // simply out of date.
    bill.mark(n, 0);

    stageBand(current);
    animator.begin(current, rigs, models);
    animatorHasRigs = true;
    lights.begin(current.lighting);
    // The score is loaded but held down: `begin` evaluates the timeline at beat
    // 0, so without this the whole opening state lands on the front of a closed
    // curtain with the house still up. See `LightRig.setMaster`.
    lights.setMaster(0);
    director.begin(current.song, current.cast, current.solos, concert.venue, `${concert.seed}/${n}`);
    // No `tomatoes.strike()` here: `begin` is a strike plus a new cast, says so
    // in its own contract, and a second strike would throw away the pool
    // warm-up that `begin` just paid for behind this closed curtain.

    setState('curtain');
    loading = load(current.song);
  }

  /**
   * Compile the pattern, hand it to the scheduler stopped, and get the band's
   * instruments onto the machine.
   *
   * Split from starting it because the two want to happen at different
   * moments: this one wants to be over before anybody is looking, and the
   * start wants to be exactly on the cue. Evaluating in one call put a
   * transpile on the frame the count-in began, which is a stutter in the one
   * second of the show that is nothing but timing.
   *
   * The preload is the same argument carried one step further. Compiling the
   * pattern loads no audio whatever — Strudel fetches an instrument on the beat
   * it is first played — so a number used to open with its own band still
   * arriving over the wire: soundfont notes landing late and out of place, and
   * drum hits that missed their deadline dropped outright. The curtain is
   * several seconds long and the stage is silent behind it, which is precisely
   * the room that fetch wanted. See `preloadSounds`.
   */
  async function load(song: Song): Promise<void> {
    try {
      // Stop before loading. See the module note: a running cycle counter
      // would start this song somewhere in its middle.
      await stopPlayback();
      voice.end();
      await loadCode(renderStrudel(withoutSungVoice(audible(song))));
      loaded = song;
    } catch (err) {
      console.error('concert: Strudel could not evaluate the pattern', err);
    }
    // After the compile rather than beside it: the pattern is what the downbeat
    // cannot do without, and a slow CDN must not delay handing it over.
    await preloadSounds(song);
  }

  /** The downbeat. Everything is already compiled; this is one clock start. */
  async function startMusic(): Promise<void> {
    transport.begin(current.song);
    clockLive = true;
    try {
      /**
       * Wait for the load rather than racing it.
       *
       * It has had the whole reveal to finish and normally has, but on the
       * first number it is also waiting for the soundfonts, and two
       * evaluations in flight against one scheduler is the sort of race that
       * shows up once in fifty page loads as a number that never starts.
       */
      await loading;
      // A pattern that failed to load — or one a tomato replaced while the
      // curtain was travelling — is compiled here instead, late but audible.
      if (loaded === current.song) {
        await startLoaded();
        // After the scheduler, never before: every phrase is placed by the
        // scheduler's own clock and there is no clock until it starts.
        voice.begin(audible(current.song));
      } else await sound(current.song);
    } catch (err) {
      console.error('concert: the number could not be started', err);
    }
  }

  function endNumber(): void {
    // The clock stops; the sound does not. The last bar is a held chord and
    // Strudel's stop only halts the scheduler, so it rings out over the first
    // seconds of the applause exactly as it would in a room. The singer is the
    // exception and has to be told: her phrases are scheduled ahead of the
    // playhead, so anything already handed over would sing on into the
    // applause over a band that has stopped.
    voice.end();
    void stopPlayback();
    transport.end();
    clockLive = false;
    animator.end();
    animatorHasRigs = false;
    lights.setHouse(HOUSE_APPLAUSE, HOUSE_UP_SECONDS);
    stage.applaud(1);

    // Nothing is playing during the applause. Marking nothing is what settles
    // the number that just finished into the struck-through half of the list.
    bill.mark(-1, 0);

    const last = index + 1 >= concert.numbers.length;
    if (last) {
      // A curtain call: the house comes up further, and the stage stays lit
      // until the black takes it. See `BOW_CURTAIN_AT`.
      lights.setHouse(HOUSE_CALL, HOUSE_UP_SECONDS);
    } else {
      // The tabs come in *now*, over the band still standing in the applause,
      // rather than four seconds later at the moment the next band appears.
      // Which is the whole fix: the change happens behind them.
      stage.setCurtain(0);
      // And the stage look goes out under the closing cloth, so that by the
      // time the next number is struck and staged there is nothing lit to snap
      // — `lights.begin` puts every fixture at its new opening level the
      // instant it is called, and that would otherwise land on the front of a
      // closed curtain that the house is still washing.
      lights.setMaster(0, CURTAIN_IN_SECONDS);
    }
    setState(last ? 'bow' : 'applause');
  }

  /**
   * Beats of count-in at the front of this number, or 0.
   *
   * Read from the song rather than assumed, because whether there is one at
   * all depends on the genre and on whether anybody is holding sticks — see
   * `withCountIn`. An ambient number has none and simply begins.
   */
  function leadInBeats(): number {
    const { leadInBars, beatsPerBar } = current.song.meta;
    return (leadInBars ?? 0) * beatsPerBar;
  }

  /**
   * Whether this music is counted in at all.
   *
   * The genre's answer rather than `leadInBeats() > 0`, and the difference is
   * the number with no kit on it: there is nothing to click, so the song
   * carries no lead-in bar, and the leader's cue is then the *only* count
   * there is. Ambient is the other way round — it is not counted in by
   * anybody, with or without a drummer.
   */
  function counted(): boolean {
    return getGenre(current.song.meta.genre).countIn;
  }

  /**
   * Who gives the count.
   *
   * **The drummer, when there is a drummer counting.** A lead-in bar means
   * `withCountIn` put four clicks at the front of the number, and those clicks
   * *are* the count — so it comes from the person playing them, and the band
   * takes it from there. The singer nodding four over the top of a count the
   * drummer is already giving is two counts, and the second one reads as a tic:
   * a head keeping time to a rhythm somebody else is stating.
   *
   * Otherwise the person out front. With no kit there is nothing to click, the
   * song carries no lead-in, and the leader's own count is the only one there
   * is — so it goes to whoever the band would take it from anyway.
   */
  function leaderId(): string | undefined {
    const players = current.cast.performers;
    const order: LayerId[] = leadInBeats() > 0
      ? ['drums', 'vocal', 'melody', 'comp']
      : ['vocal', 'melody', 'comp', 'drums'];
    for (const layer of order) {
      const found = players.find((p) => p.layer === layer);
      if (found) return found.id;
    }
    return players[0]?.id;
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
    // No house move: the room has been at `HOUSE_FLOOR` the whole time the
    // programme was up, which is where the show runs. The click asks for the
    // tabs and nothing else. See the note by `HOUSE_FLOOR`.
    stageNumber(0);
  });

  // --- Debug labels ------------------------------------------------------
  //
  // `?debug`, and nothing here runs without it. What the labels answer is
  // "which track did casting give this person, and is it sounding *now*" —
  // both read straight off `current.song`, so a revoiced number (a tomato
  // lands, `revoiceNumber` writes a new instrument) shows the new instrument
  // for the same reason the audience hears it.

  /** Scratch for the camera-space test below. One vector, not one per frame. */
  const tagAt = new Vector3();
  /** …and for picking one. Both only ever touched under `?debug`. */
  const tagRay = new Raycaster();
  const tagNdc = new Vector2();

  /**
   * The marker in column one. `debug-tags.ts` lights the line that starts
   * with `>`, so this is also which line is worth looking at.
   */
  const mark = (sounding: boolean, silenced: boolean): string =>
    silenced ? 'x' : sounding ? '>' : '·';

  /**
   * One line per part this player is minding — the primary, then any doubles,
   * in the order `Performer.doubles` lists them. A keyboard player covering a
   * bass line in their left hand is two lines, and which of them is sounding
   * changes bar by bar.
   */
  function tagLines(performer: Performer, beat: number): string[] {
    const parts: PartRef[] = [performer, ...(performer.doubles ?? [])];
    return parts.map((ref) => partLine(ref, beat));
  }

  function partLine(ref: PartRef, beat: number): string {
    if (ref.layer === 'drums') {
      const kit = current.song.drums;
      // A drum event has no duration — it is a hit. So the lamp is a flash of
      // its own, rather than a note length there is none of.
      const hit = kit.events.some((e) => beat >= e.beat && beat < e.beat + 0.2);
      return `${mark(hit, sulking.has('drums'))} drums   ${kit.bank} (${kit.source ?? 'kit'})`;
    }
    // The same lookup casting used, so the label cannot disagree with the
    // player about which of a layer's tracks is theirs. See `trackForPart`.
    const track = trackForPart(current.song, ref);
    if (!track) return `· ${ref.layer.padEnd(7)} — no track`;
    const on = track.notes.some((n) => beat >= n.beat && beat < n.beat + n.duration);
    // Name and program only. `strudelSound` was here too and is the same fact
    // said twice — it is `gm_` and the name — and it made every label half as
    // wide again, which on six players is most of the picture.
    return `${mark(on, sulking.has(track.layer))} ${track.layer.padEnd(7)} `
      + `${track.instrument} gm${track.gmProgram}`;
  }

  /**
   * What a machine is running, in the same shape as a player's line.
   *
   * `StageMachine.bank` is already the renderer's answer to "what is this
   * playing" — a drum bank for the two percussion kinds, an instrument name for
   * a sequencer — so the label prints it rather than re-deriving one. The
   * marker is the same lamp for the same reason: the question being asked of a
   * machine is exactly the question asked of a player, and a machine is not
   * more trustworthy for having no face.
   */
  function machineLine(spec: StageMachine, beat: number): string {
    if (!spec.layer) {
      const kit = current.song.drums;
      const hit = kit.events.some((e) => beat >= e.beat && beat < e.beat + 0.2);
      return `${mark(hit, sulking.has('drums'))} ${spec.kind.padEnd(7)} ${spec.bank}`;
    }
    const track = current.song.tracks.find((t) => t.layer === spec.layer);
    if (!track) return `· ${spec.layer.padEnd(7)} — no track`;
    const on = track.notes.some((n) => beat >= n.beat && beat < n.beat + n.duration);
    return `${mark(on, sulking.has(track.layer))} ${track.layer.padEnd(7)} `
      + `${track.instrument} gm${track.gmProgram}`;
  }

  function updateTags(beat: number): void {
    for (const [, { tag, spec }] of machineTags) {
      tag.set([machineLine(spec, beat), `  (machine, ${spec.tendedBy ?? 'untended'})`]);
      tag.root.getWorldPosition(tagAt).applyMatrix4(director.camera.matrixWorldInverse);
      tag.setVisible(tagAt.z < -0.2);
    }
    for (const performer of current.cast.performers) {
      const tag = tags.get(performer.id);
      if (!tag) continue;
      tag.set(tagLines(performer, beat));
      /**
       * A label is screen-sized (`sizeAttenuation: false`), and three.js gets
       * that by scaling the sprite by its own view-space depth. Behind the
       * lens that depth is positive, the scale flips, and the label is drawn
       * mirrored back into the picture over a player who is not there. The
       * camera can end up inside the band on a close orbit, so this is worth
       * a test rather than an assumption.
       */
      tag.root.getWorldPosition(tagAt).applyMatrix4(director.camera.matrixWorldInverse);
      tag.setVisible(tagAt.z < -0.2);
    }
  }

  /**
   * A click on a label copies what it says, and throws nothing.
   *
   * Reading an instrument name off the screen and typing it into a bug report
   * is the one thing anybody does with these, so the label is the button. It
   * takes the click ahead of the tomatoes because a hit on a label is
   * unambiguous — it is a small rectangle over somebody's head that is only
   * there at all because the flag is set.
   *
   * `Sprite.raycast` does the awkward half of this: it knows about `center`
   * and, unlike most of three.js, it knows that an unattenuated sprite's
   * on-screen size is its scale times its own view depth. Only visible labels
   * are offered, so one behind the camera cannot be clicked through the back
   * of the lens.
   */
  function copyTagAt(ndcX: number, ndcY: number): boolean {
    if (!tags.size && !machineTags.size) return false;
    const all = [...tags.values(), ...[...machineTags.values()].map((m) => m.tag)];
    const shown = all.filter((t) => t.root.visible);
    if (!shown.length) return false;

    tagRay.setFromCamera(tagNdc.set(ndcX, ndcY), director.camera);
    const hit = tagRay.intersectObjects(shown.map((t) => t.root), false)[0];
    const tag = hit && shown.find((t) => t.root === hit.object);
    if (!tag) return false;

    const text = tag.text();
    // `navigator.clipboard` is absent on an insecure origin, which a stage
    // served over plain http on a LAN is. The label is still on the screen and
    // the console still has it, so this stays a diagnostic rather than an
    // error the show has to report.
    const copy = navigator.clipboard?.writeText(text);
    if (copy) copy.then(() => tag.flash(), (err) => console.warn('concert: copy failed', err));
    else console.warn('concert: no clipboard here. The label says:\n' + text);
    return true;
  }

  // --- The frame ---------------------------------------------------------

  function frame(dt: number): void {
    stateSeconds += dt;
    seconds += dt;

    /**
     * One sample, at the top, passed to everyone. Nothing below may ask the
     * transport again this frame.
     */
    const beat = transport.beat();
    /** The same sample, un-wrapped: how far into the number we are. */
    const elapsed = transport.elapsed();
    /**
     * Whether that number is a position in a piece of music that is actually
     * sounding. Before the downbeat the transport honestly reports 0, and 0 is
     * a place *in* the music — see `PRE_ROLL_BEAT`.
     */
    const live = clockLive && transport.state() === 'playing' && elapsed > 0;

    switch (state) {
      case 'bill':
        stage.snapCurtain(0);
        lights.setHouse(HOUSE_FLOOR);
        lights.setMaster(0);
        break;

      case 'curtain':
        /**
         * The reveal: the tabs, and the stage coming up under them while they
         * travel — and the players who open the number picking their
         * instruments up in the same gap, which is the one moment of the
         * evening worth spending a whole curtain on. The rest of the band is
         * standing there at ease waiting for its entry, which is the other half
         * of the same picture. The house does not move at all; it was already
         * where the show runs before the programme came down. See `HOUSE_FLOOR`.
         */
        if (!revealed && stateSeconds >= CURTAIN_AT) {
          revealed = true;
          stage.setCurtain(1);
          lights.setMaster(1, STAGE_UP_SECONDS);
          // Named only where the music is counted in at all. An ambient piece
          // has no pulse to give and nobody to give it — the band simply takes
          // up its instruments and the piece is found already happening.
          animator.cue(counted() ? leaderId() : undefined);
        }
        // Wait for the cloth rather than for a timer: the gather takes as long
        // as it takes and a timer would either cut it off or leave a gap.
        if (revealed && stage.curtainOpen() > 0.98) setState('count-in');
        break;

      case 'count-in':
        /**
         * Nothing is sounding yet, deliberately.
         *
         * The players who open the number are up, the leader is beating time —
         * `animator.cue` named them, and the animator runs that off its own
         * clock precisely because there is no beat here to run it off — and
         * after a moment the music starts. Whether the audience then *hears* a
         * count depends on whether there is a kit to count on: `withCountIn`
         * puts four clicks at the front of the pattern when there is, so from
         * here on the count is simply the first bar of the song and the drummer
         * plays it like any other bar — and the head that was beating time is
         * the same drummer's, which is why it stops the moment the sticks do
         * the talking. See `leaderId` and `Runtime.counting`.
         */
        if (!cueGiven && stateSeconds >= CUE_SECONDS) {
          cueGiven = true;
          void startMusic();
        }
        // The piece proper begins after the lead-in. With no lead-in that is
        // the downbeat, so the smallest positive elapsed will do.
        if (live && elapsed >= Math.max(leadInBeats(), 1e-6)) {
          // The band is in: the count stops and the gesture list takes the
          // band's hands back. See `Animator.downbeat`.
          animator.downbeat();
          setState('playing');
        }
        break;

      case 'playing': {
        for (const [layer, sulk] of sulking) {
          if (beat >= sulk.until) returnToPlaying(layer, sulk.attempt);
        }
        const total = songDurationSeconds(current.song) * current.song.meta.bpm / 60;
        if (elapsed >= total) endNumber();
        // Against the music rather than the pattern: a progress bar that
        // starts a bar before the piece does is wrong by exactly the count-in.
        const lead = leadInBeats();
        const played = elapsed - lead;
        bill.mark(index, total > lead ? Math.min(Math.max(played, 0) / (total - lead), 1) : 0);
        break;
      }

      case 'applause':
        /**
         * The last chord is still ringing, the house is coming up, and the
         * tabs are already travelling — `endNumber` sent them. The band stays
         * in the light taking it until the cloth covers them, and only *then*
         * is the stage struck and the next number staged, which is the whole
         * of why nobody sees six people change into six other people.
         */
        acknowledge(stateSeconds);
        // Held rather than struck once: the house's own applause decays over
        // about two seconds, and a room does not stop clapping before the
        // curtain has closed.
        if (stateSeconds < APPLAUSE_SECONDS * 0.6) stage.applaud(1);
        if (stateSeconds > APPLAUSE_SECONDS && stage.curtainOpen() <= CURTAIN_REVEALS) {
          // Back to the floor rather than out. The applause lifted the house
          // above where the show runs; this puts it back, and the next reveal
          // then changes nothing about the room either.
          lights.setHouse(HOUSE_FLOOR, HOUSE_DIM_SECONDS);
          stageNumber(index + 1);
        }
        break;

      case 'bow':
        // The house came up with the applause in `endNumber`; the tabs come in
        // over the band, and then the black. No camera move anywhere in it —
        // see the note by `BOW_CURTAIN_AT`.
        acknowledge(stateSeconds);
        if (stateSeconds < BOW_FADE_AT) stage.applaud(1);
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

    /**
     * The animator is given a position *before* the music when there is no
     * music. The lights are not.
     *
     * Two different meanings for the same absence, and they have to differ. A
     * gesture list indexed at 0 is a band caught at the first downbeat — hands
     * on the snare, fingers on the keys, before a note has sounded — where a
     * cue timeline indexed before its first cue is simply black, and a stage
     * that goes dark for the length of its own reveal is not a reveal. So the
     * animator reads the pre-roll and everything else reads the opening state.
     */
    const shown = live ? beat : PRE_ROLL_BEAT;
    if (live) heldBeat = beat;
    if (animatorHasRigs) animator.update(shown, dt);
    else for (const rig of rigs.values()) rig.update(seconds, dt);
    lights.update(heldBeat, dt);
    // Only while the beat means something. `transport.end()` reports 0, and the
    // director reads 0 as a position rather than as an absence — which is the
    // whole of the zoom-out this show used to end on.
    if (clockLive) director.update(beat, dt);
    tomatoes.update(beat, dt);
    stage.update(live ? beat : Number.NaN, dt);
    for (const model of models.values()) model.update(shown);
    // The clock, not a performer's shown beat: nobody is playing this.
    for (const machine of machines) machine.update(beat);
    // The same beat the bodies were driven with, so a lit label and a hand
    // that has arrived are the same moment. Empty unless `?debug`.
    if (tags.size || machineTags.size) updateTags(shown);
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
      // Four, under `?debug`: a label copies itself and eats the click, so
      // reading one does not also pelt the player wearing it.
      if (copyTagAt(ndcX, ndcY)) return;
      if (state === 'playing' || state === 'count-in') {
        tomatoes.aim(ndcX, ndcY, director.camera);
        tomatoes.throwNow(director.camera);
      }
    },

    aim(ndcX, ndcY) { tomatoes.aim(ndcX, ndcY, director.camera); },
    drag(dx, dy) { director.orbit(dx, dy); },
    toggleProgramme() { bill.toggleProgramme(); },
    closeProgramme() { if (bill.mode() === 'programme') bill.hide(); },

    setQuality(q) {
      quality = q;
      stage.setQuality(q);
      lights.setQuality(q);
    },

    dispose() {
      voice.end();
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
 * What a machine is running: a sequencer plays its own layer, a box plays the
 * kit's. `StageMachine.layer` says which, so nothing here re-derives a mapping
 * the cast already made.
 */
function notesOf(
  number: ConcertNumber, spec: StageMachine,
): readonly { beat: number; velocity: number; voice?: string }[] {
  return spec.layer
    ? number.song.tracks.find((t) => t.layer === spec.layer)?.notes ?? []
    : number.song.drums.events;
}

/**
 * The beat somebody's hand starts this machine, if anybody's does.
 *
 * Read out of the choreography rather than guessed from the pattern, because
 * the two do not agree and the choreographer is right: nobody starts a
 * sequencer on the beat they want to hear it, they start it in the bar before
 * and it comes round, so `operatePart` walks the start backwards to wherever
 * the player has a hand free. The panel lighting up has to be that beat and not
 * the first note, or the machine is running before it was started — which is
 * the whole failure the start gesture exists to prevent, restated as a lamp.
 *
 * **Only a touch at or before the first note counts**, and that clause is the
 * whole of the care needed here. A start is not always placeable — a player
 * whose own part begins on the same downbeat has no hand free and there is no
 * earlier beat to walk back to, which is the documented residue in §8.1 — and
 * the earliest panel touch is then a *pattern change* twenty-eight bars in.
 * Taking that as the start blanks a machine that has been audibly playing since
 * bar one, which is a worse lie than the one this is fixing. So an unstarted
 * machine runs from its own first event: the honest reading of a box with no
 * hand on it at bar one is that it was already going when the lights came up.
 *
 * Absent for an untended machine on an empty stage, for the same reason.
 */
function startedAt(number: ConcertNumber, spec: StageMachine): { startedAt?: number } {
  const tender = spec.tendedBy;
  if (!tender) return {};
  // The same index the choreographer counted with — see `PlayPoint.control`.
  const which = (number.cast.machines ?? [])
    .filter((m) => m.tendedBy === tender).indexOf(spec);
  const sounds = notesOf(number, spec).reduce((m, e) => Math.min(m, e.beat), Infinity);
  let start: number | undefined;
  for (const g of number.choreography.parts[tender]?.gestures ?? []) {
    if (g.target.kind !== 'control' || g.target.machine !== which) continue;
    if (g.beat > sounds) continue;
    if (start === undefined || g.beat < start) start = g.beat;
  }
  return start === undefined ? {} : { startedAt: start };
}

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
