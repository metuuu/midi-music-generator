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
import { Box3, Group, Quaternion, Raycaster, Vector2, Vector3 } from 'three';

import { Rng } from '../../core/rng.js';
import type { DrumVoice, LayerId, Song } from '../../core/types.js';
import { sliceSong, songDurationBeats } from '../../core/types.js';
import { buildConcert } from '../../concert/index.js';
import { asMetu } from '../../concert/cast.js';
import { trackForPart } from '../../concert/choreograph.js';
import type {
  Concert, ConcertNumber, ConcertOptions, PartRef, Performer, StageMachine,
} from '../../concert/types.js';
import { drumEventsFor, instrumentIdForTrack, specFor } from '../../concert/instruments.js';
import { countsItselfIn } from '../../generate/song.js';
import { readBankName } from '../../render/drum-banks.js';
import { renderStrudelParts } from '../../render/strudel.js';
import {
  bandLoaded, clearBand, isPlaying, loadBand, mutePlayer, preloadSounds, setOutputLevel,
  startLoaded, stopPlayback, swapPlayer,
} from '../audio.js';
import { revoiceNumberAsync } from '../generator.js';
import { createSungVoice, withoutSungVoice } from '../sung-voice.js';

import { createAnimator, type Animator } from './animate.js';
import { createDirector, type CameraDirector } from './camera.js';
import {
  anchorTail, buildCabling, buildTail, cableBounds, cableExit, DECK,
  type Cabling, type CableRun, type Obstacle, type Tail,
} from './cables.js';
import { buildDebugTag, type DebugTag } from './debug-tags.js';
import { riserFootprint } from '../../concert/venue.js';
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
  /**
   * Put the same man on stage nineteen times over — `?metu` or `?poppodi`
   * on the page (both mean the same thing).
   *
   * The whole band in one face and one dark suit. See `asMetu`, which is where
   * the look is and where the argument for it is; this flag only says whether
   * the cast goes through it.
   */
  metu?: boolean;
  /** Called whenever the state changes, for the page's status line. */
  onState?: (state: ShowState, show: Show) => void;
  /**
   * A `?debug` label was clicked. Only fires when `debug` is on, because
   * without it there are no labels to click.
   *
   * The show does not know what a console is and must not: this reports which
   * layer was picked and stops there. See `pickTagAt`.
   */
  onPick?: (layer: LayerId) => void;
}

/**
 * A trim over what the tables already say, per layer and per drum voice.
 *
 * Trims rather than levels, and that is the same decision `web/mix-lab.ts` made
 * and for the same reason: unity is the centre of every fader, so "I have not
 * touched this" is visible at a glance across two dozen of them. It also means
 * this object stays meaningful across a number change, where the absolute
 * levels do not — a new number deals different instruments, and a stored 0.44
 * would be a statement about whatever happened to be playing when it was set.
 *
 * `muted` and `solo` are keyed `l:<layer>` and `d:<voice>`, the same namespace
 * the mix lab uses, so a session can be moved between the two pages by hand.
 */
export interface ShowMix {
  layers: ReadonlyMap<LayerId, number>;
  voices: ReadonlyMap<DrumVoice, number>;
  muted: ReadonlySet<string>;
  solo: ReadonlySet<string>;
}

/** Where the number that is sounding has got to. All figures in the *piece*. */
export interface Position {
  /** Bar being heard, 0-based, fractional. */
  bar: number;
  /** Bars in the whole number, whatever the pattern was cut to. */
  bars: number;
  /** The bar the pattern was cut at, 0 unless jumped. */
  fromBar: number;
  beatsPerBar: number;
  paused: boolean;
}

export interface Show {
  /** Everything the show owns. Add to the scene. */
  readonly root: Group;
  readonly camera: Camera;
  readonly concert: Concert;
  state(): ShowState;
  /** The number playing, 0-based. */
  index(): number;
  /** The number playing, whole and uncut. What a console reads to draw itself. */
  number(): ConcertNumber;
  /** Where it has got to, or undefined when nothing is sounding. */
  position(): Position | undefined;
  /**
   * Ride the faders. The band changes on the next bar; nothing restarts.
   *
   * Only the layers whose emitted text actually moved are handed to Strudel —
   * see `loadLayers` — so a fader drag costs one layer's transpile per frame
   * rather than a song's.
   */
  setMix(next: ShowMix): void;
  /**
   * Begin this number again from `bar`, by *cutting the piece there* rather
   * than by seeking. See `sliceSong`, which is where the argument lives.
   */
  jumpToBar(bar: number): void;
  /** Hold the clock where it is, or let it go on. The stage holds with it. */
  setPaused(paused: boolean): void;
  /** Strike this number and stage another. The curtain runs as it always does. */
  goToNumber(n: number): void;
  /** One call per frame. Samples the clock itself — nobody else may. */
  frame(dt: number): void;
  /** A click on the stage: advance the bill, or throw a tomato. */
  click(ndcX: number, ndcY: number): void;
  drag(dx: number, dy: number): void;
  /** Wheel or pinch. Above 1 backs the camera off, below 1 moves it in. */
  zoom(factor: number): void;
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
/**
 * How thin a piece of dressing may be and still stop a tomato, in metres.
 *
 * A hand. Below it the object is a sheet — bunting, a projection screen, a rug —
 * and its bounding box is a plane with nothing behind it. See `hittableProps`.
 */
const PROP_MIN_THICKNESS = 0.08;
/**
 * And how long. A person's height, so a cabinet or a riser is furniture and a
 * ten-metre merged row of flowers is scenery painted on the room.
 */
const PROP_MAX_SPAN = 3.0;

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
  /**
   * Before a single rig is built, and that is the whole of the plumbing.
   *
   * Every model, tag and light downstream reads `Performer.look` out of this
   * object when its number is staged, so redressing the cast here is redressing
   * it everywhere — including the numbers that will not be staged for another
   * twenty minutes, and including a player who gets a tomato and comes back
   * (`revoiceNumber` keeps the cast, because it is the same band).
   */
  if (opts.metu) {
    for (const number of concert.numbers) {
      for (const performer of number.cast.performers) performer.look = asMetu(performer.look);
    }
  }
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
   * The leads, and the tails hanging off carried gear.
   *
   * Kept here rather than under the objects they join because a lead belongs to
   * neither end of itself — see `cables.ts`. The tails are the exception and are
   * parented to their instruments; they are listed only so they get disposed
   * with everything else rather than riding a model that is about to be thrown
   * away.
   */
  let cabling: Cabling | undefined;
  const tails: { dispose(): void }[] = [];
  /**
   * …and the ones hanging off a *player*, which need a frame each.
   *
   * Only these. A lead off a keyboard or a rhythm box hangs in a frame that does
   * not move all evening, so there is nothing to correct and nothing to pay for.
   * A guitarist's does — see `anchorTail`, which is what this list exists to
   * feed, and which is the whole of the per-frame cost of the cabling: at most
   * three of these on any stage this stages.
   */
  const carried: {
    tail: Tail; model: Object3D; jack: Vector3; anchor: Vector3;
  }[] = [];
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
  /** Which bar that load was cut at, so a jump's reload is not mistaken for it. */
  let loadedFromBar = 0;
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
  /** The same, un-wrapped — what "are we done yet" reads while the clock is held. */
  let heldElapsed = 0;
  /**
   * Which bar of `current.song` the scheduler is calling bar zero. 0 unless jumped.
   *
   * A jump does not seek. It hands the scheduler the piece *cut* at this bar
   * (see `sliceSong`) and tells the transport to add the offset back, so nothing
   * downstream ever learns that the pattern is not the whole number. This is the
   * one variable that knows.
   */
  let fromBar = 0;
  /**
   * The clock is stopped on purpose, and the number is not over.
   *
   * True while paused, and across the reload a jump costs. It exists because
   * `clockLive` answers a different question — *is there a number at all* — and
   * the frame loop's two absences want opposite treatment: no number is the
   * pre-roll pose, a held clock is the pose the band was last in. Without it,
   * pressing pause snapped the whole band to the first downbeat.
   */
  let paused = false;
  let jumping = false;
  /** 0..1 of black over the picture. Only the bow moves it. */
  let fade = 0;
  const blackout = buildBlackout();
  /** Layers currently silenced by a tomato, and the beat each may return on. */
  /**
   * Who is sitting out, until when, and whether their new part is on its way.
   *
   * `returning` exists because the part is written on a worker now: the frame
   * loop passes `until` once and then keeps passing it, so without a flag every
   * frame of the wait would ask for another one. See `returnToPlaying`.
   */
  const sulking = new Map<LayerId, { until: number; attempt: number; returning?: boolean }>();

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

    const m = stage.metrics;
    const riser = riserFootprint(m);
    /**
     * Where a piece of gear standing here sends its lead: off the nearest edge
     * of the boards it can get to.
     *
     * Asked per instrument rather than decided once for the stage, which is the
     * whole of the change from the stage box this replaced — one destination
     * for the whole band meant every run was a diagonal to the same upstage
     * corner. See `cableExit`, and §8.4 of `docs/backline-plan.md` for the hub
     * argument it supersedes.
     *
     * Declared here and given `obstacles` below, which is filled in before any
     * gear is placed and read only when this is called.
     */
    const exitFor = (x: number, z: number): Vector3 => cableExit({ x, z }, m, obstacles);
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

    /**
     * And the ground-stacked PA only stands where nobody's gear is in it.
     *
     * The same sentence as the riser with the sign flipped — that platform goes
     * when it is empty and these boxes go when they are *occupied* — and the
     * one case is a wall of modular synthesiser, which `cast.ts` puts at the
     * back corners as far outboard as it fits. A body gets 0.35 m, which is the
     * radius the cable router already gives one; a modular gets 1.15, being
     * 0.78 m of wing offset plus half a 0.6 m cabinet plus the toe-in. See
     * `StageRig.showPa`.
     */
    stage.showPa(number.cast.performers.map((p) => ({
      x: p.station.position[0],
      z: p.station.position[2],
      r: p.rig === 'modular' ? 1.15 : 0.35,
    })));

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
          ? [...new Set(drumEventsFor(
            number.song.drums.events, performer.archetype, number.song.drums.bank,
          ).map((e) => e.voice))]
          : undefined,
        // …and which drum it is, where this is the percussionist. One archetype
        // covers a goblet drum, a set of congas and a mridangam, and only the
        // bank knows which of them the band brought. See `Shape` in
        // `instruments/hand-drum.ts`.
        performer.archetype === 'handdrum'
          ? readBankName(number.song.drums.bank).rack
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
         * rubber. The run along the boards then carries on from where it lands.
         *
         * Which is what a guitar lead does. There is always a loop of it on the
         * deck, and the loop is the reason the player can move at all.
         *
         * ## Both halves of the join were wrong, and measurably
         *
         * The drop was a **constant 0.55 m** from a jack this file never asked
         * the height of, and the run started at a **fixed point 0.38 m upstage
         * of the player** that had nothing to do with where the drop landed. On
         * the guitar that is a jack at 0.815 m ending its cable at 0.265 —
         * a quarter of a metre of air under it — and a deck run beginning 0.365 m
         * away from that end. Two cables, not one, and the gap between them the
         * width of a shoe.
         *
         * The drop is now the jack's own height, so it reaches the boards, and
         * the run starts at the foot rather than near it.
         */
        if (model.outlet) {
          /**
           * Falling *away* from the player, in the guitar's own frame.
           *
           * A carried instrument's frame cannot say which way the wings are —
           * it is torso-local and turns with the player — so this gets a fixed
           * lean rather than an aim at the exit. But `(0, 0, -1)` was the wrong
           * fixed lean: -z in a carried model's frame points back at the body
           * it is hanging on, and the lead was drawn from a jack 0.190 m out
           * from the player's own axis to a foot 0.171 m from it — 30 cm of
           * cable travelling *into* somebody's legs and coming out the other
           * side.
           *
           * Out from that axis is the one direction that cannot do that, on any
           * instrument, at any yaw, and it is what a cable hanging on a person
           * actually does. The torso's origin sits at `-position` in this frame,
           * turned by the instrument's own yaw — the placement above, run
           * backwards.
           */
          const axis = new Vector3(-model.root.position.x, 0, -model.root.position.z)
            .applyAxisAngle(UP, model.station.facing);
          const away = new Vector3(model.outlet.x - axis.x, 0, model.outlet.z - axis.z)
            .normalize();

          /**
           * …and turned toward the wing it is heading for, as far as it can be.
           *
           * The lead now lies flat for its last 18 cm — see `RUN_ON` — and that
           * stretch is what the deck run has to continue. Pointing it purely
           * outward would hand the run a cable lying across its path, and where
           * the exit happens to be behind the player it would hand it one
           * pointing the opposite way: a hairpin at the foot.
           *
           * Weighted rather than averaged, so `away` always wins the tie: with
           * the exit exactly opposite, the sum still leaves 0.3 of outward lean
           * and the cable falls clear of the legs. That is the invariant, and it
           * is not negotiable against tidiness.
           *
           * ## Which point the wall is chosen from
           *
           * Not the foot, which cannot be known until the tail is built, and the
           * tail cannot be aimed until the wall is known. Not the station
           * either: that is the centre of this player's own 0.3 m obstacle
           * circle, and `cableExit` routes to decide — asking it to start inside
           * a solid would have it fail all three edges and fall back to the
           * nearest whether or not anything can be threaded to it.
           *
           * So: half a metre out along the unturned lean, which is within a few
           * centimetres of where the foot actually lands, outside the circle, and
           * far coarser than the thing it is deciding. Half a metre does not
           * change which of three walls is closest. The run below is then given
           * this same answer rather than asking a second time, so the drop and
           * the run cannot be aimed at different walls.
           */
          const toBand = performer.station.facing - model.station.facing;
          const lean = away.clone().applyAxisAngle(UP, toBand);
          const exit = exitFor(x + lean.x * 0.5, z + lean.z * 0.5);
          const bearing = new Vector3(exit.x - x, 0, exit.z - z);
          if (bearing.lengthSq() > 1e-9) {
            away.addScaledVector(
              bearing.normalize().applyAxisAngle(UP, -toBand), 1 / 1.3,
            ).normalize();
          }

          const tail = buildTail(model.outlet, model.outlet.y - DECK, away);
          model.root.add(tail.root);
          model.root.add(tail.plug);
          tails.push(tail);

          /**
           * …and the run starts where that lands, in band space.
           *
           * Read off the matrices rather than reconstructed from the station,
           * because the chain from the boards to a guitar's jack is the rig's
           * placement, the torso's rest pose, the carry offset and the model's
           * own yaw, and a second copy of it here would be four chances to
           * disagree with the one in the renderer.
           *
           * The pose it is read from is the rest one, and that no longer matters
           * to the join: this point becomes the tail's **anchor**, and
           * `anchorTail` solves the cable back onto it every frame from whatever
           * pose the player is actually in. Where the last version read a foot
           * that then moved, this one names a foot that is then held.
           */
          model.root.updateWorldMatrix(true, false);
          const foot = band.worldToLocal(model.root.localToWorld(
            tail.foot.clone().add(model.outlet),
          )).setY(DECK);
          runs.push({ from: foot.clone(), to: exit });
          carried.push({
            tail, model: model.root, jack: model.outlet.clone(), anchor: foot,
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
         * the run off the edge starts where that lands.
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
           * One end, claimed once and used twice: the drop off the case is
           * aimed at the same point the run along the boards lands on, or the
           * two meet at a corner in the one place a cable is close enough to
           * the camera to read.
           *
           * From where the instrument was *stood* rather than from the socket
           * on the back of it, so a keyboard 30 cm from the wall does not send
           * its lead the other way because its jack happens to be on the
           * inboard side of the case.
           */
          const target = exitFor(model.root.position.x, model.root.position.z);
          if (drop > 0.05) {
            const along = new Vector3(
              target.x - model.root.position.x, 0, target.z - model.root.position.z,
            ).applyAxisAngle(UP, -yaw);
            const tail = buildTail(start, drop, along);
            model.root.add(tail.root);
            model.root.add(tail.plug);
            tails.push(tail);
            start.add(tail.foot);
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
       * The machine's lead goes to its owner's rig, not off the edge.
       *
       * Electrically that is a small lie — the real object goes to the mixer
       * with everything else — and it is the right lie, because it is the one
       * thing on this stage that says *this box and that keyboard are one
       * person's corner*. §8.0 has been making that argument in prose for three
       * revisions and paying for it with a purpose-built stand; a short lead
       * into the rig beside it says the same thing in something an audience can
       * actually see, which a stand cannot.
       *
       * With no tender there is nothing to belong to, and it goes off the
       * nearest edge like everything else.
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
      const lands = host ? host.root.position.clone().setY(DECK) : exitFor(mx, mz);
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
        machine.root.add(tail.plug);
        tails.push(tail);
        jack.add(tail.foot);
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
     * Nothing electric, nothing built — which used to matter because the hub
     * these runs went to was an object that would otherwise stand on an
     * acoustic trio's stage plugged into nothing. There is no object now, so
     * this is only the empty merge it would have done anyway.
     */
    if (runs.length) {
      cabling = buildCabling({ runs, obstacles, bounds: cableBounds(m) });
      band.add(cabling.root);
    }

    director.setSubjects(subjects);
    lights.setSubjects(subjects);
    tomatoes.begin(number.cast, rigs, stage, {
      instruments: [...models].map(([id, m]) => [id, m.root] as const),
      scenery: hittableProps(),
    });
  }

  /**
   * The furniture a tomato is allowed to hit, which is not all of it.
   *
   * `Staging.scenery` has been in the tomato module's contract since it was
   * written and has never once been passed, so the collision world was the
   * boards, the backdrop and two walls and nothing else: a throw at a PA stack
   * or a riser went straight through it and marked whatever was behind.
   *
   * **Filtered, and the filter is the whole of why this is a function.** A
   * collision proxy is a world-axis-aligned box round the object, which is only
   * honest for something compact. Measured over six venues, 100 pieces of
   * dressing: 28 of them span more than three quarters of the room, because a
   * builder that places a row of things places it as one mesh — the bunting is
   * 10.6 m wide, the beams 19.8 × 15.7, the projection screens 9.3 × 5.2 — and
   * several are flat, with a dimension of *exactly zero*: carpets, rugs, the
   * dance floor. Handing those over would hang invisible room-sized planes in
   * the air for tomatoes to stop dead against, which is a far worse bug than
   * the one it fixes and is the same complaint arriving by a different door.
   *
   * So: nothing thinner than a hand, nothing longer than a person is tall. That
   * admits the PA stacks and their poles, the risers, the chandeliers — the
   * things that read as solid objects standing in a room — and leaves the
   * cloth, the floor coverings and the merged rows alone. Anything rejected is
   * exactly as hittable as it was before, which is not at all.
   *
   * The real fix, here and for the instruments, is an authored collision volume
   * per prop rather than a bounding box and a rule of thumb. This is the part of
   * it that can be had for a size test.
   */
  function hittableProps(): Object3D[] {
    const box = new Box3();
    const size = new Vector3();
    const out: Object3D[] = [];
    for (const { node } of stage.dressing.solids) {
      box.setFromObject(node);
      if (box.isEmpty()) continue;
      box.getSize(size);
      const thinnest = Math.min(size.x, size.y, size.z);
      const longest = Math.max(size.x, size.y, size.z);
      if (thinnest < PROP_MIN_THICKNESS || longest > PROP_MAX_SPAN) continue;
      out.push(node);
    }
    return out;
  }

  function strikeBand(): void {
    for (const tag of tags.values()) tag.dispose();
    for (const { tag } of machineTags.values()) tag.dispose();
    for (const rig of rigs.values()) rig.dispose();
    for (const model of models.values()) model.dispose();
    for (const machine of machines) machine.dispose();
    for (const tail of tails) tail.dispose();
    carried.length = 0;
    cabling?.dispose();
    cabling = undefined;
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
   * The faders, as the console last left them. Empty is "as the tables have it".
   *
   * Held by the show rather than by the console, and it outlives a number on
   * purpose: what a fader session is *for* is deciding whether a genre's pad
   * sits right, and the answer is not visible in one number. The trims are
   * relative (see `ShowMix`), so carrying them across a change of instrument
   * carries the judgement rather than the level.
   */
  let mix: ShowMix = { layers: new Map(), voices: new Map(), muted: new Set(), solo: new Set() };

  /** Solo wins over mute; an empty solo set means everything sounds. */
  function audibleAt(key: string): boolean {
    if (mix.solo.size > 0) return mix.solo.has(key);
    return !mix.muted.has(key);
  }

  /**
   * The song as the console's faders would have it.
   *
   * A copy every time rather than an edit, because the trims are a *view* of a
   * mix and not a change to the arrangement: `current.song` has to still be the
   * song its seed produces, or a re-voice would compound every fader that had
   * moved since the number started.
   *
   * Mute is a gain of zero rather than a removed track, and that distinction is
   * load-bearing here in a way it is not on the mix lab. `loadBand` snapshots
   * the layer ids at load time and builds one `ref` per layer, so the *shape* of
   * the stack is fixed for the number — a layer whose tracks all vanished would
   * emit no part at all, never be swapped, and go on sounding whatever the `ref`
   * was last given. Silencing a whole layer therefore goes through
   * `mutePlayer`, and this only ever scales.
   */
  function mixed(song: Song): Song {
    if (!mix.layers.size && !mix.voices.size) return song;
    const tracks = song.tracks.map((t) => {
      const trim = mix.layers.get(t.layer) ?? 1;
      return trim === 1 ? t : { ...t, gain: t.gain * trim };
    });
    if (!mix.voices.size) return { ...song, tracks };

    const voiceGains = { ...song.drums.voiceGains };
    for (const [voice, trim] of mix.voices) {
      voiceGains[voice] = (voiceGains[voice] ?? 1) * trim;
    }
    return { ...song, tracks, drums: { ...song.drums, voiceGains } };
  }

  /**
   * Push the console's mute and solo state onto the loaded band.
   *
   * Cheap in one direction and not the other: silencing is a map write inside
   * `mutePlayer` and costs nothing, while bringing a player back has to hand
   * Strudel that layer's text again, because the `ref` is holding `silence` and
   * nothing else remembers the pattern. A few KB, on a button press.
   *
   * `sulking` is checked first and wins, and the precedence is not arbitrary: a
   * player who has been hit by a tomato is *out*, and un-soloing a fader must
   * not put them back on stage in the middle of their sulk.
   */
  async function applyMutes(): Promise<void> {
    for (const [layer, code] of onStage) {
      if (sulking.has(layer)) continue;
      if (audibleAt(`l:${layer}`)) await swapPlayer(layer, code);
      else mutePlayer(layer);
    }
  }

  /**
   * What each layer of the loaded band was last given, by layer.
   *
   * Kept so a re-voice can evaluate the parts that actually moved and leave the
   * rest alone. The splice in `revoiceNumber` means that is normally one layer
   * out of six, and the five it skips are the expensive ones to have been wrong
   * about — see `loadBand`.
   */
  let onStage = new Map<LayerId, string>();

  /**
   * Take a player out of the band, for the price of a map write.
   *
   * This used to re-render the whole song without that track and hand Strudel
   * the result: a 60–124 KB transpile and a fresh pattern graph, on the frame
   * after a tomato landed, to remove one part. The stack the scheduler holds now
   * reads each layer through a `ref`, so silencing one is a value change that
   * costs no evaluation at all and lands at the top of the next bar — which is
   * where a musician would have stopped anyway.
   *
   * The singer is not in that stack: `withoutSungVoice` takes her out of the
   * pattern and `web/sung-voice.ts` sings her instead, so she is silenced by
   * ending that rather than by muting a layer nobody is reading.
   */
  function silencePlayer(layer: LayerId): void {
    mutePlayer(layer);
    if (layer === 'vocal') voice.end();
  }

  /**
   * Put the band's music on, or bring the parts of it that changed up to date.
   *
   * The first call for a number loads every layer; later ones evaluate only what
   * moved. Building the text is 2–8 ms for a whole song and was never the
   * problem — what cost was handing all of it to Strudel, which this now does one
   * layer at a time and only when that layer is different.
   *
   * The faders go on here rather than at any of the call sites, so that every
   * route to the scheduler — a number opening, a tomato, a jump — carries the
   * console's trims without having to remember to. It is also what makes riding
   * a fader cheap: the emitted text of the five layers that did not move is
   * byte-identical, so the loop below skips them and one layer is handed over.
   */
  async function loadLayers(song: Song, autostart: boolean): Promise<void> {
    const parts = renderStrudelParts(withoutSungVoice(mixed(song)));
    if (!bandLoaded()) {
      onStage = new Map(parts.layers.map((l) => [l.layer, l.code]));
      await loadBand(parts, autostart);
      // After the load, never before: `mutePlayer` writes into the map the
      // stack reads, and `loadBand` clears it.
      await applyMutes();
      return;
    }
    for (const { layer, code } of parts.layers) {
      // `sulking` rather than the code alone: a player whose part came back
      // identical is still a player who has to be un-muted, and a re-voice that
      // changed nothing is not rare — see the note in `concert-check.ts`.
      if (onStage.get(layer) === code && !sulking.has(layer)) continue;
      onStage.set(layer, code);
      // A muted player is not brought back by a re-render. `onStage` is updated
      // either way, so the code is there for `applyMutes` to restore from when
      // the fader is un-muted.
      if (audibleAt(`l:${layer}`)) await swapPlayer(layer, code);
      else mutePlayer(layer);
    }
    /**
     * And start the clock if the caller wanted one and there is none.
     *
     * The old path could not forget this: it went through `playCode`, which
     * evaluates *and* starts, so a re-render always carried a start with it.
     * Swapping a layer touches no scheduler at all, so the one caller that
     * relies on this — `startMusic`, where the loaded song is not the one now
     * on stage because a tomato replaced it while the curtain was travelling —
     * would otherwise stage a band that never plays.
     *
     * Guarded, because `start` rewinds to cycle 0 and a number in its second
     * chorus must not go back to the top.
     */
    if (autostart && !await isPlaying()) await startLoaded();
  }

  /**
   * Rebuild the band, but not on this frame.
   *
   * `loadLayers` runs its render synchronously, before the first `await`, on whatever
   * frame called it. That is fine at the top of a number, where the picture is
   * behind a curtain and nothing is moving, and it is wrong on the frame a
   * tomato lands — which is already the busiest frame of the show and the one
   * the thrower is watching for a response.
   *
   * So the impact frame gets the splat and the flinch, and the sound catches up
   * on the next task. Coalesced, because a burst of hits would otherwise queue a
   * render each and they would all produce the same answer.
   */
  /**
   * The piece as the scheduler has it — the number, cut where a jump left it.
   *
   * Derived rather than stored, and that is what keeps a jump and a tomato from
   * fighting. `returnToPlaying` replaces `current` with a re-voiced number while
   * the band is playing; a stored slice would then be the *old* number's, and
   * the player coming back would come back on music nobody else was reading.
   * Recomputing costs one pass over the notes on the two occasions anything asks
   * during a jump, and returns `current.song` itself when there has been none.
   */
  const playing = (): Song => sliceSong(current.song, fromBar);

  let soundPending = false;
  function scheduleSound(): void {
    if (soundPending) return;
    soundPending = true;
    setTimeout(() => {
      soundPending = false;
      void sound(playing());
    }, 0);
  }

  async function sound(song: Song): Promise<void> {
    try {
      await loadLayers(song, true);
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
    heldElapsed = 0;
    // A jump belongs to the number it was made in. The faders do not — see `mix`.
    fromBar = 0;
    paused = false;
    jumping = false;

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
    loading = load(current.song, 0);
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
  async function load(song: Song, bar: number): Promise<void> {
    try {
      // Stop before loading. See the module note: a running cycle counter
      // would start this song somewhere in its middle.
      await stopPlayback();
      voice.end();
      // A fresh band rather than an updated one: this is a different song, and
      // a layer left over from the last number would be read by the new stack.
      clearBand();
      await loadLayers(sliceSong(song, bar), false);
      /**
       * The *uncut* number is what gets recorded as loaded, and the bar beside
       * it.
       *
       * `startMusic` compares by identity to answer "is what the scheduler is
       * holding still the number on stage", and a slice is a fresh object on
       * every call — comparing against one would answer no every time and pay
       * for a second render of a band that was already correct.
       */
      loaded = song;
      loadedFromBar = bar;
    } catch (err) {
      console.error('concert: Strudel could not evaluate the pattern', err);
    }
    // After the compile rather than beside it: the pattern is what the downbeat
    // cannot do without, and a slow CDN must not delay handing it over.
    await preloadSounds(song);
  }

  /** The downbeat. Everything is already compiled; this is one clock start. */
  async function startMusic(): Promise<void> {
    transport.begin(current.song, fromBar);
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
      if (loaded === current.song && loadedFromBar === fromBar) {
        await startLoaded();
        // After the scheduler, never before: every phrase is placed by the
        // scheduler's own clock and there is no clock until it starts.
        voice.begin(audible(playing()));
      } else await sound(playing());
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

  // --- The console's transport -------------------------------------------
  //
  // Three operations a debugging overlay needs and an audience does not: hold
  // the clock, begin this number somewhere else, and go to another number. All
  // three are gated on `?debug` at the page — see `main.ts` — and none of them
  // is reachable from the stage itself.
  //
  // What they share is that they are all expressed in the vocabulary the show
  // already had. A jump is `load` plus `startLoaded`, which is exactly what the
  // top of every number does; a pause is Strudel's own, which keeps the phase;
  // and going to another number is `stageNumber`, curtain and all. Nothing here
  // reaches past `web/audio.ts`, and nothing downstream of the transport knows
  // any of it happened.

  /**
   * Begin this number again from `bar`, by cutting the piece there.
   *
   * The clock has no cursor to move — see `sliceSong` for why, at length — so
   * this stops it, hands the scheduler a piece whose bar `bar` is its first, and
   * starts it again from zero. `transport.begin` is told the offset, and from
   * that point every system on the stage reads a position in the *piece* and
   * none of them can tell.
   *
   * The stop costs a few tens of milliseconds of silence and lets whatever was
   * ringing ring out over the cut, which is the same behaviour — and the same
   * argument — as `endNumber`'s. `jumping` holds the band's pose across it, so
   * the picture does not flick to the pre-roll and back.
   */
  function jumpToBar(bar: number): void {
    if (!clockLive || (state !== 'playing' && state !== 'count-in')) return;
    const to = Math.max(0, Math.min(Math.round(bar), current.song.meta.totalBars - 1));
    jumping = true;
    // Here rather than only in `setPaused`, so that scrubbing while paused is
    // also a way to start again — the fader is down and nothing else raises it.
    if (paused) setOutputLevel(1);
    paused = false;
    fromBar = to;
    // The held position moves *now* rather than when the audio lands, so the
    // frame that follows this call already shows the band where they are going.
    // Otherwise the stage holds the old bar for the length of the reload, which
    // reads as the scrub having missed.
    heldBeat = to * current.song.meta.beatsPerBar;
    heldElapsed = heldBeat;
    const wanted = current;
    loading = (async () => {
      await load(current.song, to);
      // The number moved on while the pattern was being built — the end of the
      // piece, the next number staged. Starting now would start the wrong band.
      // Same guard, same reason, as `returnToPlaying`.
      if (current !== wanted || fromBar !== to) return;
      transport.begin(current.song, to);
      await startLoaded();
      voice.begin(audible(playing()));
      jumping = false;
    })();
    void loading.catch((err) => {
      jumping = false;
      console.error('concert: the jump could not be made', err);
    });
  }

  /**
   * Stop dead, or pick it up again from the bar it stopped on.
   *
   * ## Why this is a stop and a jump rather than Strudel's own pause
   *
   * `Cyclist.pause` only clears the callback timer. Two things follow from that
   * and both are wrong here.
   *
   * **The sound does not stop.** Every voice already handed to Web Audio has its
   * whole envelope scheduled on the audio clock, and nothing in the scheduler
   * can recall it — so a paused transport went on sounding for as long as the
   * longest note had left, which on a pad is several seconds of band over a
   * stage that has visibly stopped. `setOutputLevel(0)` is the only thing that
   * reaches those voices, because everything goes through the master.
   *
   * **And the position does not hold.** The clock keeps its `phase`, which is a
   * point on the audio clock rather than an offset, and the audio clock runs
   * through the pause. So the resume tick finds `phase` far in the past and
   * loops to catch up — measured, a five-second pause came back three bars late,
   * with the bars in between fired at once into the past. A pause that quietly
   * skips music is worse than one that costs a reload.
   *
   * So: down, stop, and resume by starting the piece again from the bar it
   * stopped on — which is `jumpToBar`, already written, already the same shape
   * as the top of any number. The cost is up to one bar of rewind at the join,
   * which is the same bar-snapping a jump has, and one reload.
   */
  function setPaused(next: boolean): void {
    if (!clockLive || next === paused) return;
    if (next) {
      paused = true;
      voice.end();
      // The fader before the scheduler: stopping first would leave the tail to
      // ring for the twelve milliseconds it takes the master to travel, which
      // is nothing, but the order is the one that reads correctly.
      setOutputLevel(0);
      void stopPlayback();
      return;
    }
    // `jumpToBar` raises the fader and clears `paused` itself, and lands on the
    // bar rather than between two — see the note there on why the unit is a bar.
    jumpToBar(Math.floor(heldBeat / current.song.meta.beatsPerBar));
  }

  /**
   * Strike this number and stage another, without waiting for the applause.
   *
   * Deliberately goes the long way round — `stageNumber`, curtain, count and
   * all — rather than dropping the band on stage mid-air. Three seconds is a
   * long time when you are hunting a level and it is still the right call: the
   * reveal is what builds the cast, the cue timeline and the camera plan, and a
   * shortcut past it would be a second staging path to keep correct.
   *
   * The room is put back by hand because the applause that normally does it is
   * being skipped, and the cloth is snapped rather than travelled: this number
   * is not ending, it is being abandoned.
   */
  function goToNumber(n: number): void {
    if (state === 'bill' || n < 0 || n >= concert.numbers.length) return;
    voice.end();
    // A number left behind while the transport was paused would otherwise stage
    // the next one behind a master fader nobody can see is down.
    if (paused) setOutputLevel(1);
    void stopPlayback();
    transport.end();
    clockLive = false;
    animator.end();
    animatorHasRigs = false;
    lights.setHouse(HOUSE_FLOOR);
    stage.snapCurtain(0);
    fade = 0;
    stageNumber(n);
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
   * The written answer rather than `leadInBeats() > 0`, and the difference is
   * the number with no kit on it: there is nothing to click, so the song
   * carries no lead-in bar, and the leader's cue is then the *only* count
   * there is. Ambient is the other way round — it is not counted in by
   * anybody, with or without a drummer.
   *
   * **And that is exactly the case a style is now allowed to answer for
   * itself.** `countsItselfIn` is the style's word over the genre's, shared with
   * `withCountIn` rather than restated here, because the two decisions have to
   * come out the same: a number whose kit is silent gets no clicks, so this
   * function is the only count it will ever have, and finnfolk's four archaic
   * styles are precisely the numbers that should not have one. A runo singer
   * starts and the seconder joins on the second line; nobody beats four at them
   * first.
   */
  function counted(): boolean {
    return countsItselfIn(current.song.meta);
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
    /**
     * On this frame, and that is the change worth noticing.
     *
     * Silencing a player used to be a whole-song re-render deferred to the next
     * task, so the tomato landed and the part it hit went on playing for a frame
     * and then everything stalled. It is now a map write against the `ref` the
     * stack is reading, which costs nothing measurable and lands at the top of
     * the next bar — so it can happen where it belongs, beside the flinch.
     */
    silencePlayer(layer);
  });

  // There used to be a walk-off here: a fifth hit fired `onPatienceLost` and
  // this called `endNumber` so the band finished the bar and stopped. The event
  // is gone from `tomatoes.ts` — the reason is in its module docs — and a number
  // now ends only when it runs out or somebody asks for the next one.

  /**
   * Bring a sulking player back with a freshly generated part.
   *
   * Asked for on the worker and applied whenever it answers, which is the one
   * place in this file where a wait is the feature rather than the cost. The
   * part is a whole `generateSong` and a choreography rebuild — 21–144 ms — and
   * it used to run here, on the frame the eighth beat came round, in the middle
   * of a number. Now the player simply goes on sulking until it lands, and a sulk
   * that runs three frames long is a sulk.
   *
   * `sulking` keeps the entry until the answer arrives, which is what stops the
   * frame loop asking again on every one of those frames — the `until` is a beat
   * that has already passed. `returning` is what says the asking has been done.
   */
  async function returnToPlaying(layer: LayerId, attempt: number): Promise<void> {
    const sulk = sulking.get(layer);
    if (!sulk || sulk.returning) return;
    sulk.returning = true;

    const wanted = current;
    const revoiced = await revoiceNumberAsync(current, layer, attempt);
    /**
     * The number moved on while the part was being written.
     *
     * The end of the piece, or the next number staged behind the curtain — in
     * either of those the part that just arrived belongs to a song nobody is
     * playing, and splicing it in would put one player on yesterday's music.
     * The sulk goes with the number, so there is nothing to clean up.
     */
    if (current !== wanted || state !== 'playing') return;

    current = revoiced;
    concert.numbers[index] = current;
    sulking.delete(layer);
    animator.begin(current, rigs, models);
    for (const p of current.cast.performers) {
      if (p.layer === layer) animator.setPlaying(p.id, true);
    }
    // Also off this frame, and for the same reason: this one already ran
    // `revoiceNumber` here, so it is the last thing that should also render a
    // pattern before the picture gets a look in. What it evaluates now is the
    // layer that came back and nothing else — see `band`.
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
  // both read straight off `current.song`, so a tomatoed player's line goes on
  // reading correctly through the sulk and the return.
  //
  // The instrument named here does not move when one lands, and that is a
  // guarantee rather than an accident: `spliceLayers` takes the notes and
  // leaves the timbre, because the person holding the thing has not changed.

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
      // The *player's* object rather than the song's bank, which is not the same
      // string once a bank names a sampled rack: `RolandTR808+darbuka` is two
      // objects with two people behind them, and printing it whole put the same
      // label over the drummer and the percussionist. Casting has already split
      // it — "RolandTR808 kit" and "darbuka" — so this prints what it decided.
      return `${mark(hit, sulking.has('drums'))} drums   ${ref.instrument} (${kit.source ?? 'kit'})`;
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
  /**
   * A click on a player's label picks that player out on the desk.
   *
   * It used to copy the label's text to the clipboard, which was the most this
   * could do when there was nowhere for a selection to *go*. There is now: the
   * strip carrying that layer's fader, and the lane under the scrub bar showing
   * where in the piece the part actually sounds. A name in a paste buffer
   * answered no question; "this player, this fader, these bars" answers three.
   *
   * The layer is what travels rather than the performer, because the layer is
   * what everything downstream is keyed by — the mix tables, the strips, the
   * `ref` stack. A performer is one person holding one of them.
   */
  function pickTagAt(ndcX: number, ndcY: number): boolean {
    if (!tags.size && !machineTags.size) return false;
    const all = [...tags.values(), ...[...machineTags.values()].map((m) => m.tag)];
    const shown = all.filter((t) => t.root.visible);
    if (!shown.length) return false;

    tagRay.setFromCamera(tagNdc.set(ndcX, ndcY), director.camera);
    const hit = tagRay.intersectObjects(shown.map((t) => t.root), false)[0];
    const tag = hit && shown.find((t) => t.root === hit.object);
    if (!tag) return false;

    const performerId = [...tags].find(([, t]) => t === tag)?.[0];
    const layer = performerId
      ? current.cast.performers.find((p) => p.id === performerId)?.layer
      // A machine with no layer of its own is running the kit. See `StageMachine`.
      : [...machineTags.values()].find((m) => m.tag === tag)?.spec.layer ?? 'drums';
    if (!layer) return false;

    tag.flash();
    opts.onPick?.(layer);
    return true;
  }

  // --- The frame ---------------------------------------------------------

  function frame(dt: number): void {
    stateSeconds += dt;
    seconds += dt;

    /**
     * The clock is stopped and the number is not over — paused, or mid-jump.
     *
     * A third thing the transport cannot say. It answers *what is sounding*, and
     * the honest answer while the scheduler is held is "nothing, at cycle zero" —
     * which every system below would read as the top of the piece. So the held
     * position stands in, and it stands in for `elapsed` as well as for `beat`:
     * without that, `endNumber` would compare a zeroed elapsed against the
     * number's length and a pause near the finish would silently un-finish it.
     */
    const held = clockLive && (paused || jumping);
    /**
     * One sample, at the top, passed to everyone. Nothing below may ask the
     * transport again this frame.
     */
    const beat = held ? heldBeat : transport.beat();
    /** The same sample, un-wrapped: how far into the number we are. */
    const elapsed = held ? heldElapsed : transport.elapsed();
    /**
     * Whether that number is a position in a piece of music that is actually
     * sounding. Before the downbeat the transport honestly reports 0, and 0 is
     * a place *in* the music — see `PRE_ROLL_BEAT`.
     */
    const live = !held && clockLive && transport.state() === 'playing' && elapsed > 0;

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
          if (beat >= sulk.until) void returnToPlaying(layer, sulk.attempt);
        }
        /**
         * The number's length in **beats**, asked for directly.
         *
         * This was `songDurationSeconds(song) * bpm / 60` — beats converted to
         * seconds and multiplied straight back — which was a correct if
         * roundabout way to write `songDurationBeats` while there was one tempo,
         * and became wrong the moment there was not. `songDurationSeconds` now
         * runs the tempo map, so on a song that ramps the round trip would come
         * back short by the whole of the ramp and the number would end early —
         * about an eighth of the way from the finish on a piece rising from 90
         * to 120. `elapsed` is in beats, so beats is what it wants comparing to.
         */
        const total = songDurationBeats(current.song);
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
    const shown = live ? beat : held ? heldBeat : PRE_ROLL_BEAT;
    if (live) { heldBeat = beat; heldElapsed = elapsed; }
    if (animatorHasRigs) animator.update(shown, dt);
    else for (const rig of rigs.values()) rig.update(seconds, dt);

    /**
     * …and then put the guitar leads back on the end of their own deck runs.
     *
     * After the bodies and before anything reads the scene, because this is a
     * correction *to* the pose that was just struck — see `anchorTail`. The
     * world matrices are forced rather than waited for: three.js updates them at
     * render, and by then the tube has already been drawn tilted through the
     * boards. `updateWorldMatrix(true, false)` walks the ancestors this
     * instrument hangs off — rig, torso — and stops there rather than descending
     * into a guitar's whole tree.
     *
     * Everything is put in the band's frame rather than the world's, because
     * that is the frame the anchor was measured in and the frame the deck run is
     * drawn in. `band` carries no rotation today, so the quaternion below is the
     * world one; taking it out anyway costs a multiply and stops this being a
     * line that quietly breaks if the band is ever tipped or spun.
     */
    if (carried.length) {
      band.updateWorldMatrix(true, false);
      band.getWorldQuaternion(SPIN).invert();
      for (const lead of carried) {
        lead.model.updateWorldMatrix(true, false);
        lead.model.getWorldQuaternion(TURN).premultiply(SPIN);
        anchorTail(
          lead.tail,
          band.worldToLocal(lead.model.localToWorld(V.copy(lead.jack))),
          lead.anchor,
          TURN,
        );
      }
    }
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
    number: () => current,
    frame,

    position() {
      if (!clockLive) return undefined;
      const { beatsPerBar, totalBars } = current.song.meta;
      // `heldBeat` rather than the transport, for the console's own sake: it is
      // repainted off the frame loop and would otherwise flicker to the top of
      // the piece for the tens of milliseconds a jump's reload takes.
      const beat = paused || jumping ? heldBeat : transport.beat();
      return { bar: beat / beatsPerBar, bars: totalBars, fromBar, beatsPerBar, paused };
    },

    setMix(next) {
      mix = next;
      // Two paths because they cost differently: the trims go through a render
      // of only the layers whose text moved, and mute/solo touches no text at
      // all. Both land at the top of the next bar.
      scheduleSound();
      void applyMutes().catch((err) => console.error('concert: the mix would not apply', err));
    },

    jumpToBar,
    setPaused,
    goToNumber,

    click(ndcX, ndcY) {
      // Three things a click can mean, and the state decides which. Getting
      // this wrong is what makes tomatoes feel broken.
      if (state === 'bill') return;
      // Four, under `?debug`: a label picks its player out on the desk and eats
      // the click, so selecting one does not also pelt them.
      if (pickTagAt(ndcX, ndcY)) return;
      if (state === 'playing' || state === 'count-in') {
        tomatoes.aim(ndcX, ndcY, director.camera);
        tomatoes.throwNow(director.camera);
      }
    },

    aim(ndcX, ndcY) { tomatoes.aim(ndcX, ndcY, director.camera); },
    drag(dx, dy) { director.orbit(dx, dy); },
    zoom(factor) { director.zoom(factor); },
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
/** Scratch for the per-frame lead correction. Never holds anything between frames. */
const V = new Vector3();
const SPIN = new Quaternion();
const TURN = new Quaternion();

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
