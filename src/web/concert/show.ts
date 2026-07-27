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
 */

import type { Camera, Object3D } from 'three';
import { Group, Vector3 } from 'three';

import type { LayerId, Song } from '../../core/types.js';
import { songDurationSeconds } from '../../core/types.js';
import { buildConcert, revoiceNumber } from '../../concert/index.js';
import type { Concert, ConcertNumber, ConcertOptions } from '../../concert/types.js';
import { instrumentIdForTrack } from '../../concert/instruments.js';
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
      const [x, y, z] = performer.station.position;
      rig.root.position.set(x, y + performer.station.riser, z);
      rig.root.rotation.y = performer.station.facing;
      band.add(rig.root);
      rigs.set(performer.id, rig);
      subjects.set(performer.id, rig.root);

      // The instrument goes where the performer is, offset by where the model
      // says a player stands relative to it.
      const track = number.song.tracks.find((t) => t.layer === performer.layer);
      const model = buildInstrumentFor(
        performer,
        track ? instrumentIdForTrack(track) : undefined,
        concert.venue.palette.proscenium,
      );
      model.root.position.set(x, y + performer.station.riser, z);
      model.root.rotation.y = performer.station.facing;
      model.root.position.sub(
        new Vector3().copy(model.station.offset).applyAxisAngle(UP, performer.station.facing),
      );
      band.add(model.root);
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
    lights.begin(current.lighting);
    director.begin(current.song, current.cast, current.solos, concert.venue, `${concert.seed}/${n}`);
    tomatoes.strike();

    // Stop before evaluating. See the module note: a running cycle counter
    // would start this song somewhere in its middle.
    await stopPlayback();
    transport.begin(current.song);
    await sound(current.song);

    stage.setCurtain(1);
    lights.setHouse(0);
    setState('count-in');
  }

  function endNumber(): void {
    void stopPlayback();
    transport.end();
    animator.end();
    lights.setHouse(0.45);
    stage.applaud(1);
    setState(index + 1 < concert.numbers.length ? 'applause' : 'bow');
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
    void sound(current.song);
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
    void sound(current.song);
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
        // That gap *is* the count-in: the band is up, the lights are on, and
        // nothing has happened yet.
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
        if (stateSeconds > APPLAUSE_SECONDS) stage.setCurtain(0);
        break;
    }

    animator.update(beat, dt);
    lights.update(beat, dt);
    director.update(beat, dt);
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
      bill.destroy?.();
    },
  };

  bill.show('opening');
  opts.onState?.(state, api);
  return api;
}

const UP = new Vector3(0, 1, 0);

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
