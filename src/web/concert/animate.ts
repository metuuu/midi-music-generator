/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The animation runtime — the thing that turns the Performance IR into limbs.
 *
 * Everything above this file is data. `Choreography` says a stick hits the
 * high tom on beat 14.75 and starts moving 0.31 beats earlier; the drum-kit
 * model says where the high tom is; the rig says "put a hand there". This file
 * is the only place all three meet, and it is the only place that knows what
 * time it is.
 *
 * ## Five rules, and the reason each exists
 *
 *  1. **Read ahead, never react.** A limb that starts moving on the beat
 *     arrives after it, and a band that arrives after the beat looks like it is
 *     miming to a recording. Every frame asks "which gestures' windows contain
 *     now" and places the effector along an arc that is *at the target exactly
 *     on `Gesture.beat`*. The clock is never sampled here — `beat` is handed in,
 *     once per frame, by the caller.
 *
 *  2. **Three layers, in priority order: play, groove, idle.** A note gesture
 *     wins over a groove behaviour, which wins over idle. Groove is additive on
 *     the channels the rig separates for us (`setSway`, `setHeadNod`) and
 *     yields on the channels it shares with play (a tapping foot stops tapping
 *     when it is on a pedal). Idle is mostly the *absence* of a command.
 *
 *  3. **`react` fires once, on the beat.** Not every frame in the window, and
 *     not twice when a frame runs long. The fire cursor only ever moves
 *     forward, so a 250 ms frame fires four gestures in beat order rather than
 *     dropping three of them.
 *
 *  4. **Nothing is allocated per frame.** `InstrumentModel.resolve` is pure and
 *     time-invariant by contract, so every contact is resolved once, on the
 *     frame its gesture first becomes active, and cached in the model's own
 *     local frame — which is also the frame `Contact.position` is expressed in.
 *     Per frame the runtime does a matrix multiply per contact and nothing else.
 *
 *  5. **No `Math.random`.** The two places that want a little human scatter —
 *     the groove's drift and the idle separation of two hands sharing one rest
 *     contact — draw from `new Rng(performer.id + tag)`, so two shows from one
 *     seed animate identically down to the frame.
 *
 * ## The seam this file does *not* cross
 *
 * It makes no decision the IR could have made. Which limb plays a note, when it
 * starts moving, how hard, how long the follow-through is and what the body is
 * feeling all arrive as data. What is decided here is exactly the set of things
 * the IR deliberately refuses to carry: the *shape* of the arc, the easing, the
 * lerp between two stepped groove spans, and the bow's stroke direction — which
 * the contract hands over by name, because the renderer has to hold that state
 * either way and a second source of truth would be worse.
 */

import { Matrix4, Quaternion, Vector3 } from 'three';

import { ARCHETYPES } from '../../concert/instruments.js';
import type {
  ConcertNumber, Effector, Gesture, GestureKind, GrooveBehaviour, PlayPoint,
  Span, Viseme,
} from '../../concert/types.js';
import { Rng } from '../../core/rng.js';

import type { InstrumentModel } from './instruments/types.js';
import { DEFAULT_HAND_POSES, type BodySide, type PerformerRig } from './performer.js';

// ---------------------------------------------------------------------------
// The public surface
// ---------------------------------------------------------------------------

export interface Animator {
  /**
   * Bind to a number that is about to play. Idempotent: calling it again
   * replaces everything, so a struck number leaves nothing behind.
   *
   * `rigs` and `models` are keyed by `Performer.id`. A performer with no rig is
   * skipped entirely; a performer with a rig but no model still grooves, still
   * breathes and still idles — they simply have nowhere to put their hands.
   */
  begin(
    number: ConcertNumber,
    rigs: Map<string, PerformerRig>,
    models: Map<string, InstrumentModel>,
  ): void;

  /**
   * One call per frame, and the only one.
   *
   * `beat` is the song position from the one clock, sampled once by the caller
   * and passed to every system. `dt` is the frame delta in **seconds** and is
   * clamped internally, so a backgrounded tab cannot teleport a limb.
   *
   * By default this also calls `InstrumentModel.update` and `PerformerRig.update`
   * for every bound performer — see `AnimatorOptions.driveRigs`.
   */
  update(beat: number, dt: number): void;

  /**
   * Whether this player is still playing. A tomato stops them: no note
   * gestures, the groove drops toward nothing over about a second, and the
   * hands go idle where they are. `PerformerRig.setPlaying` is driven from
   * here too, so effort and breathing follow.
   *
   * Unknown ids are ignored, so the tomato system does not have to know who is
   * bound.
   */
  setPlaying(performerId: string, playing: boolean): void;

  /** Struck. Drops every reference; safe to call twice. */
  end(): void;
}

export interface AnimatorOptions {
  /**
   * Whether `update` also drives `PerformerRig.update` and
   * `InstrumentModel.update`. Default `true`.
   *
   * The rig has to be updated *after* the frame's `setEffector` calls, and this
   * file is the thing making them, so owning the call is the arrangement with
   * the fewest ways to go wrong. Turn it off only if the show runner wants to
   * drive the rigs itself in states where no number is playing — and then it
   * must drive them in *every* state, because calling `rig.update` twice in one
   * frame advances breath and blink at double rate and eases every idle limb
   * home twice as fast.
   *
   * `PerformerRig.update` wants monotonic **seconds**; this accumulates them
   * from `dt` rather than deriving them from `beat`, because the transport
   * wraps `beat` at the end of a number and a rig whose clock goes backwards
   * stops blinking.
   */
  driveRigs?: boolean;
}

export function createAnimator(options: AnimatorOptions = {}): Animator {
  return new Runtime(options.driveRigs !== false);
}

// ---------------------------------------------------------------------------
// Tuning. Everything the IR refuses to carry, in one table each.
// ---------------------------------------------------------------------------

/**
 * How far an effector lifts off the surface during its windup, in metres:
 * `base + byForce × force + byTravel × travel`, along `Contact.normal`.
 *
 * Along the normal is the whole trick. The prep of a snare stroke is a stick
 * going *up*; the prep of a fretting hand is a finger coming in from the side;
 * the prep of a trombone slide is nothing at all. One formula serves all three
 * because the model already said which way "away from the instrument" is.
 *
 * The ratios are what matter. A crash lifts about four times as far as a ghost
 * note, which is the difference the plan asks the prep numbers to preserve.
 */
const LIFT: Record<GestureKind, readonly [base: number, byForce: number, byTravel: number]> = {
  strike: [0.035, 0.075, 0.150],
  pluck: [0.010, 0.018, 0.050],
  press: [0.009, 0.014, 0.040],
  // A bow does not leave the string, and a stroke that hopped would be a
  // spiccato nobody wrote.
  bow: [0.003, 0.004, 0.000],
  blow: [0, 0, 0],
  squeeze: [0, 0, 0],
  hold: [0.004, 0.000, 0.020],
  breathe: [0, 0, 0],
  sway: [0, 0, 0],
};

/** Follow-through height, as a fraction of the windup's lift. */
const REBOUND: Record<GestureKind, number> = {
  strike: 0.62, // a stick bounces, and it bounces higher off a hard hit
  pluck: 0.45,
  press: 0.16, // a finger leaves a key; it does not leap off it
  bow: 0.25,
  blow: 0,
  squeeze: 0,
  hold: 0.20,
  breathe: 0,
  sway: 0,
};

/**
 * Kinds where the effector stays engaged for the length of the note.
 *
 * The same set `choreograph.ts` calls `SUSTAINS`, and it has to be the same
 * set: over there it decides that `release` carries the note's duration, and
 * here it decides that the release is a *hold* rather than a bounce. A finger
 * on a key does not rebound for four beats.
 */
const SUSTAINS: ReadonlySet<GestureKind> = new Set<GestureKind>([
  'press', 'bow', 'blow', 'hold', 'squeeze',
]);

/** How much of a sustained release is spent still on the note. */
const SUSTAIN_HOLD = 0.65;

/** Ceiling on the travel term, in metres. Nothing crosses more than this. */
const MAX_TRAVEL = 0.6;

/**
 * How far the bow hand runs along the stroke, in metres.
 *
 * Small, and deliberately so: the violin and cello models own a bow of their
 * own and slide it themselves, and a hand racing that bow at a different phase
 * is worse than a hand that merely leans into the stroke. What this buys is the
 * one thing the model cannot do — the *hand* reversing on a `bow` and carrying
 * straight on through a `hold`, which is what makes a slur look like a slur.
 */
const BOW_TRAVEL = 0.055;

/**
 * How far a tapping foot lifts, in metres, at full amplitude.
 *
 * A tap is a small thing. At two centimetres it reads from the tenth row and
 * does not look like a march.
 */
const TAP_LIFT = 0.022;

/** How far a `lean` pushes the chest toward the phrase. The rig clamps at 0.22. */
const LEAN_REACH = 0.16;

/** Seconds an idle hand holds the last thing it played before drifting off. */
const IDLE_HOLD_SECONDS = 0.7;
/** Seconds it then takes to reach the instrument's own rest position. */
const IDLE_EASE_SECONDS = 0.9;

/** Seconds the groove takes to die away under a player who has stopped. */
const STOP_FADE_SECONDS = 0.9;

/**
 * How far apart two hands are pushed when a model gives them one rest contact.
 *
 * Several models — the kit, every horn — have a single `rest` answer, because
 * from their side there is only one place a hand goes. Two hands at one point
 * interpenetrate, which is the sort of thing that is invisible in a screenshot
 * and obvious in motion. Idle only: a *gesture's* contact is the model's word
 * and is never nudged.
 */
const IDLE_SPLIT = 0.055;

/** How long the mouth takes to shut after a syllable. Matches `visemes.ts`. */
const MOUTH_CLOSE_SECONDS = 0.06;

// ---------------------------------------------------------------------------
// Effector bookkeeping
// ---------------------------------------------------------------------------

const EFFECTORS: readonly Effector[] = [
  'left-hand', 'right-hand', 'left-foot', 'right-foot', 'mouth', 'bow', 'body', 'head', 'eyes',
];
const N_EFF = EFFECTORS.length;

const SLOT_OF: Record<Effector, number> = {
  'left-hand': 0, 'right-hand': 1, 'left-foot': 2, 'right-foot': 3,
  mouth: 4, bow: 5, body: 6, head: 7, eyes: 8,
};

/**
 * Which physical part an effector moves.
 *
 * `bow` *is* the right hand and `mouth` *is* the head — the rig says so — so
 * "is this limb already busy" has to be asked of the part rather than of the
 * effector, or the idle layer quietly commands a right hand that is in the
 * middle of a bow stroke and the two fight at 60 Hz.
 */
const PART_OF: Record<Effector, number> = {
  'left-hand': 0, 'right-hand': 1, bow: 1,
  'left-foot': 2, 'right-foot': 3,
  mouth: 4, head: 4, eyes: 4,
  body: 5,
};
const N_PART = 6;

/** The order effectors are committed in. Later wins where two share a part. */
const COMMIT_ORDER: readonly Effector[] = [
  'left-hand', 'right-hand', 'bow', 'left-foot', 'right-foot', 'body', 'head', 'mouth',
];

const REST_POINT: PlayPoint = { kind: 'rest' };

// ---------------------------------------------------------------------------
// Scratch. Six players at 60 Hz is not the place to allocate a vector.
// ---------------------------------------------------------------------------

const V1 = new Vector3();
const V2 = new Vector3();
const V3 = new Vector3();
const V4 = new Vector3();
const V5 = new Vector3();

/** Points fired this beat, for the `react` de-duplication. */
const FIRED: (PlayPoint | undefined)[] = new Array<PlayPoint | undefined>(24).fill(undefined);

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Smooth at both ends. The lateral reach of every arc. */
function smooth(s: number): number {
  return s * s * (3 - 2 * s);
}

/**
 * The windup, as height above the surface: up fast, hang, then a descent that
 * is *still accelerating when it arrives*.
 *
 * That last clause is the whole point, and it is why this is not a lerp.
 * `sin(π·s^0.7)` peaks at s ≈ 0.37 and its slope at s = 1 is −2.2 — the limb is
 * moving at its fastest at the instant of contact, which is what reads as force
 * rather than as an interpolation finishing.
 */
function windup(s: number): number {
  return Math.sin(Math.PI * Math.pow(s, 0.7));
}

/**
 * The follow-through: away fast, decelerating, settling back.
 *
 * A limb that stops dead on the beat reads as a puppet, and one that eases away
 * symmetrically reads as a machine playing an animation. This leaves at speed
 * and slows down, and the small asymmetry means it does not land back exactly
 * where it started, which is where the next windup then anchors.
 */
function followThrough(u: number): number {
  return Math.sin(Math.PI * u) * (1 - 0.35 * u);
}

// ---------------------------------------------------------------------------
// Per-effector state
// ---------------------------------------------------------------------------

interface Slot {
  /** This frame's weighted accumulation, in world space. */
  px: number; py: number; pz: number;
  nx: number; ny: number; nz: number;
  weight: number;
  /** Whether the play layer put anything here this frame. */
  played: boolean;

  /** Where this effector was last commanded. The next windup's anchor. */
  last: Vector3;
  hasLast: boolean;

  /** Where the idle drift started, and when — in beats, from the one clock. */
  idleFrom: Vector3;
  idleSince: number;
  idling: boolean;

  /** The point the cached idle contact was resolved from, by identity. */
  idlePoint: PlayPoint | undefined;
  idleLocal: Float64Array;
  /** 0 unresolved, 1 resolved, 2 the model does not know. */
  idleState: number;
}

function makeSlot(): Slot {
  return {
    px: 0, py: 0, pz: 0, nx: 0, ny: 0, nz: 0, weight: 0, played: false,
    last: new Vector3(), hasLast: false,
    idleFrom: new Vector3(), idleSince: 0, idling: false,
    idlePoint: undefined, idleLocal: new Float64Array(6), idleState: 0,
  };
}

// ---------------------------------------------------------------------------
// Per-performer state
// ---------------------------------------------------------------------------

class Player {
  readonly id: string;
  readonly rig: PerformerRig;
  readonly model: InstrumentModel | undefined;
  readonly gestures: readonly Gesture[];
  readonly blown: boolean;
  readonly singer: boolean;
  /** Whether this part is bowed, which decides how the right hand idles. */
  readonly usesBow: boolean;
  /**
   * Whether the instrument occupies any hands at all.
   *
   * `ArchetypeSpec.hands` is 0 for a singer, and a microphone stand that is
   * asked where a hand goes answers with the capsule, because from its side
   * there is only one interesting place. Idling a singer's hands there puts
   * both of them on the microphone; a singer's hands are free, and the frozen
   * table already says so.
   */
  readonly occupiesHands: boolean;
  /**
   * Whether each hand's archetype default is a *holding* pose rather than a
   * playing one. Only those are worth overriding from a gesture — see `poses`.
   */
  readonly holding: [boolean, boolean];

  /** Contacts, in the model's own local frame: 6 floats per gesture. */
  readonly contact: Float64Array;
  /** 0 unresolved, 1 resolved, 2 the model does not know this point. */
  readonly resolved: Uint8Array;
  /** Where each gesture's windup started from. 3 floats per gesture. */
  readonly anchor: Float64Array;
  readonly anchored: Uint8Array;

  /** Cursors into `gestures`: the active window, and the next `react`. */
  lo = 0;
  hi = 0;
  fire = 0;

  readonly slots: Slot[] = [];
  readonly busy: boolean[] = new Array<boolean>(N_PART).fill(false);

  // Groove.
  readonly behaviours: readonly GrooveBehaviour[];
  readonly spanCursor: Int32Array;
  phase = 0;
  looseness = 0;
  drift = 0;

  // Visemes.
  readonly visemes: readonly Viseme[];
  readonly breaths: readonly Span[];
  vCursor = 0;
  bCursor = 0;

  /** The bow's stroke: +1 or −1, reversed by every `bow`, held through `hold`. */
  stroke = 1;

  /** The fingering an active mouth gesture implies, for idle hands. */
  fingering: PlayPoint | undefined;

  stopped = false;
  /** Eases 1 → 0 when this player is stopped. Scales every groove amplitude. */
  gain = 1;
  sounding = false;
  soundingSent = false;

  /** Held, because `lookAt` keeps the reference and reads it during `update`. */
  readonly look = new Vector3();

  /** How much of a plucking shape each hand is being asked for, this frame. */
  readonly pluck: [number, number] = [0, 0];
  /** Quantised hand-pose weights, so `setHandPose` is called only on change. */
  readonly poseWeight: [number, number] = [0, 0];

  /** The model's world transform, refreshed once a frame. */
  readonly world = new Matrix4();
  readonly worldQuat = new Quaternion();
  readonly rigQuat = new Quaternion();

  constructor(
    id: string, rig: PerformerRig, model: InstrumentModel | undefined,
    gestures: readonly Gesture[], behaviours: readonly GrooveBehaviour[],
    phase: number, looseness: number,
    visemes: readonly Viseme[], breaths: readonly Span[],
  ) {
    this.id = id;
    this.rig = rig;
    this.model = model;
    this.gestures = gestures;
    this.behaviours = behaviours;
    this.phase = phase;
    this.looseness = looseness;
    this.visemes = visemes;
    this.breaths = breaths;

    const archetype = rig.performer.archetype;
    const spec = ARCHETYPES[archetype];
    this.blown = spec.blown === true;
    this.singer = archetype === 'singer';
    this.usesBow = gestures.some((g) => g.effector === 'bow');
    this.occupiesHands = spec.hands > 0;
    const defaults = DEFAULT_HAND_POSES[archetype];
    this.holding = [defaults.left === 'grip', defaults.right === 'grip'];

    const n = gestures.length;
    this.contact = new Float64Array(n * 6);
    this.resolved = new Uint8Array(n);
    this.anchor = new Float64Array(n * 3);
    this.anchored = new Uint8Array(n);
    this.spanCursor = new Int32Array(behaviours.length);

    for (let i = 0; i < N_EFF; i++) this.slots.push(makeSlot());

    // A few percent of drift, so no two players are exactly on the beat with
    // each other. `GroovePart.looseness` says how much; the id says which way.
    this.drift = new Rng(`${id}#drift`).float(0, Math.PI * 2);
  }

  /**
   * Seek every cursor to `beat`. Used on the first frame and after a wrap.
   *
   * The fire cursor is placed by the gesture's *window* rather than by its
   * beat, and that is not a detail: the first frame after `begin` lands a few
   * milliseconds after zero, and seeking by beat alone would silently swallow
   * the downbeat of every number — the one hit an audience is certainly
   * watching for. Anything whose window still contains `now` fires on this
   * frame; anything genuinely finished is skipped, which is what keeps a show
   * started mid-number from dumping a bar of reactions in one frame.
   */
  seek(beat: number): void {
    const gs = this.gestures;
    let i = 0;
    while (i < gs.length && (gs[i]!.beat - gs[i]!.prep) <= beat) i++;
    this.hi = i;
    let lo = 0;
    while (lo < this.hi && (gs[lo]!.beat + gs[lo]!.release) < beat) lo++;
    this.lo = lo;
    let fire = 0;
    while (fire < gs.length && (gs[fire]!.beat + gs[fire]!.release) < beat) fire++;
    this.fire = fire;
    this.anchored.fill(0);
    for (let s = 0; s < N_EFF; s++) {
      const slot = this.slots[s]!;
      slot.hasLast = false;
      slot.idling = false;
    }
  }
}

// ---------------------------------------------------------------------------
// The runtime
// ---------------------------------------------------------------------------

class Runtime implements Animator {
  private readonly driveRigs: boolean;
  private players: Player[] = [];
  private byId = new Map<string, Player>();

  /** Beats per second, for every seconds-shaped constant in this file. */
  private beatsPerSecond = 2;
  private idleHold = 1;
  private idleEase = 1;
  private closeBeats = 0.1;

  /** Monotonic show seconds, accumulated from `dt`. The rigs read this. */
  private seconds = 0;
  private lastBeat = Number.NaN;
  private started = false;

  constructor(driveRigs: boolean) {
    this.driveRigs = driveRigs;
  }

  begin(
    number: ConcertNumber,
    rigs: Map<string, PerformerRig>,
    models: Map<string, InstrumentModel>,
  ): void {
    const bpm = number.song.meta.bpm > 0 ? number.song.meta.bpm : 120;
    this.beatsPerSecond = bpm / 60;
    this.idleHold = IDLE_HOLD_SECONDS * this.beatsPerSecond;
    this.idleEase = IDLE_EASE_SECONDS * this.beatsPerSecond;
    this.closeBeats = MOUTH_CLOSE_SECONDS * this.beatsPerSecond;

    this.players = [];
    this.byId = new Map();
    this.lastBeat = Number.NaN;
    this.started = false;

    for (const performer of number.cast.performers) {
      const rig = rigs.get(performer.id);
      if (!rig) continue;
      const part = number.choreography.parts[performer.id];
      const groove = number.groove.parts[performer.id];
      const track = number.visemes?.performerId === performer.id ? number.visemes : undefined;
      const player = new Player(
        performer.id, rig, models.get(performer.id),
        part?.gestures ?? [],
        groove?.behaviours ?? [],
        groove?.phase ?? 0,
        groove?.looseness ?? 0,
        track?.visemes ?? [],
        track?.breaths ?? [],
      );
      this.players.push(player);
      this.byId.set(performer.id, player);
    }
  }

  setPlaying(performerId: string, playing: boolean): void {
    const player = this.byId.get(performerId);
    if (player) player.stopped = !playing;
  }

  end(): void {
    this.players = [];
    this.byId = new Map();
    this.lastBeat = Number.NaN;
    this.started = false;
  }

  update(beat: number, dt: number): void {
    if (!this.players.length) return;
    if (!Number.isFinite(beat)) return;
    const step = Number.isFinite(dt) ? (dt < 0 ? 0 : dt > 0.1 ? 0.1 : dt) : 0;
    this.seconds += step;

    // The transport wraps `beat` at the end of a number, and a show that is
    // scrubbed goes backwards on purpose. Either way the cursors have to be
    // re-seeked rather than left pointing into the future — but a fraction of a
    // beat of clock jitter must not do it, or every cursor is rebuilt on frames
    // where nothing happened.
    const wrapped = this.started && beat < this.lastBeat - 0.5;
    const fresh = !this.started;

    for (const player of this.players) {
      if (fresh || wrapped) player.seek(beat);
      this.frame(player, beat, step);
    }

    this.started = true;
    this.lastBeat = beat;
  }

  // -- one performer, one frame -------------------------------------------

  private frame(p: Player, beat: number, step: number): void {
    const { rig, model } = p;

    // World transforms, once. `Contact.position` is in the model's own local
    // frame, so every contact is one matrix multiply away from world space.
    if (model) {
      model.root.updateWorldMatrix(true, false);
      p.world.copy(model.root.matrixWorld);
      model.root.getWorldQuaternion(p.worldQuat);
    }
    rig.root.updateWorldMatrix(true, false);
    rig.root.getWorldQuaternion(p.rigQuat);

    this.advance(p, beat);
    this.fireReacts(p, beat);

    for (let s = 0; s < N_EFF; s++) {
      const slot = p.slots[s]!;
      slot.px = 0; slot.py = 0; slot.pz = 0;
      slot.nx = 0; slot.ny = 0; slot.nz = 0;
      slot.weight = 0; slot.played = false;
    }
    for (let i = 0; i < N_PART; i++) p.busy[i] = false;
    p.pluck[0] = 0;
    p.pluck[1] = 0;
    p.fingering = undefined;

    let blowWeight = 0;
    let breathWeight = 0;
    let visemeForce = 0;

    if (!p.stopped) {
      const gs = p.gestures;
      for (let i = p.lo; i < p.hi; i++) {
        const g = gs[i]!;
        const tau = beat - g.beat;
        if (tau < -g.prep || tau > g.release) continue;
        const w = weightOf(g, tau);
        if (w <= 0) continue;

        if (g.effector === 'mouth') {
          if (g.kind === 'breathe' || g.target.kind === 'rest') breathWeight = Math.max(breathWeight, w);
          else {
            blowWeight = Math.max(blowWeight, w);
            if (g.target.kind === 'viseme') visemeForce = Math.max(visemeForce, g.force);
          }
        }

        if (g.kind === 'pluck') {
          if (g.effector === 'left-hand') p.pluck[0] = Math.max(p.pluck[0], w);
          else if (g.effector === 'right-hand') p.pluck[1] = Math.max(p.pluck[1], w);
        }

        /**
         * The `mouth` effector is *placed* only for a `viseme`, and that is a
         * real seam mismatch being caught rather than a stylistic choice.
         *
         * `choreograph.ts` puts a wind player's note on the mouth — correctly,
         * because the sound comes out of their mouth — but the target is a
         * `valve` or a `hole`, and every wind and brass model answers those
         * with **where the fingering hand goes**. Placing a mouth there drags
         * the head down onto the valves.
         *
         * `viseme` is the only `PlayPoint` that describes a mouth, so it is the
         * only one that moves one. Everything else on this effector drives
         * `react`, drives the embouchure, and becomes the target the idle hands
         * follow — which is how a trumpeter's fingers track the pitch without
         * the choreographer having invented a hand gesture for them. A distance
         * test was the first version and it cannot work: a tall singer's
         * capsule is 18 cm from their lips and a trumpet's valves are 13.5 cm,
         * so the two classes overlap and the routing flipped mid-phrase.
         */
        if (g.effector === 'mouth' && g.target.kind !== 'viseme') {
          if (w > 0.5) p.fingering = g.target;
          continue;
        }

        const target: Effector = g.effector;
        // `contactOf` leaves the position in V1 and the normal in V2.
        if (!this.contactOf(p, i, g)) continue;
        this.arcOf(p, i, g, tau, target);
        const slot = p.slots[SLOT_OF[target]]!;
        slot.px += V4.x * w; slot.py += V4.y * w; slot.pz += V4.z * w;
        slot.nx += V2.x * w; slot.ny += V2.y * w; slot.nz += V2.z * w;
        slot.weight += w;
        slot.played = true;
        p.busy[PART_OF[target]] = true;
      }
    }

    this.commitPlay(p, beat);
    this.groove(p, beat, step);
    this.idle(p, beat);
    this.face(p, beat, blowWeight, breathWeight, visemeForce);
    this.poses(p);

    const sounding = !p.stopped && (blowWeight > 0 || p.slots[0]!.played || p.slots[1]!.played
      || p.slots[5]!.played || p.slots[2]!.played || p.slots[3]!.played);
    if (sounding !== p.soundingSent) {
      rig.setPlaying(sounding);
      p.soundingSent = sounding;
    }

    if (model) model.update(beat);
    if (this.driveRigs) rig.update(this.seconds, step);
  }

  // -- cursors -------------------------------------------------------------

  /**
   * Advance the active window and nothing else.
   *
   * A cursor rather than a scan because this runs every frame for six players,
   * and because the window is bounded: a gesture's release is capped at four
   * beats by the choreographer, so the live set is a handful of entries however
   * long the number is.
   */
  private advance(p: Player, beat: number): void {
    const gs = p.gestures;
    while (p.hi < gs.length && (gs[p.hi]!.beat - gs[p.hi]!.prep) <= beat) p.hi++;
    // Only from the front, and only past gestures that are genuinely finished:
    // a four-beat pad note holds the window open over the sixteenths inside it.
    while (p.lo < p.hi && (gs[p.lo]!.beat + gs[p.lo]!.release) < beat) p.lo++;
  }

  /**
   * `react`, once per gesture, on the frame its beat is crossed.
   *
   * The cursor only moves forward, so a long frame fires everything it stepped
   * over, in beat order, and a short one fires nothing twice.
   *
   * De-duplicated by point within a beat, which is not a nicety. A guitar note
   * is two gestures — the left hand stops the string and the right hand sounds
   * it — carrying the *same* `{string, fret}`, and reacting twice blurs the
   * string twice as hard as it was played. Comparing points rather than
   * consulting `soundingEffectors` keeps the accordion's bellows, which are on
   * the body and sound nothing, and needs no archetype knowledge at all.
   */
  private fireReacts(p: Player, beat: number): void {
    const model = p.model;
    const gs = p.gestures;
    let fired = 0;
    let batch = Number.NaN;

    while (p.fire < gs.length && gs[p.fire]!.beat <= beat) {
      const g = gs[p.fire]!;
      p.fire++;

      if (g.beat !== batch) { batch = g.beat; fired = 0; }

      // The bow's stroke is the runtime's to hold: `bow` reverses it and `hold`
      // continues under it, which is exactly what a slur is. The contract hands
      // this over by name rather than carrying a direction field, because the
      // renderer needs the state either way.
      if (g.effector === 'bow' && g.kind === 'bow') p.stroke = -p.stroke;

      if (p.stopped || !model) continue;

      let seen = false;
      for (let k = 0; k < fired; k++) {
        if (samePoint(FIRED[k], g.target)) { seen = true; break; }
      }
      if (seen) continue;
      if (fired < FIRED.length) FIRED[fired++] = g.target;

      model.react(g.target, g.force, beat, g.kind);
    }
  }

  // -- geometry ------------------------------------------------------------

  /**
   * This gesture's contact, in world space: position into `V1`, normal into
   * `V2`. `false` when the model does not know the point.
   *
   * Resolved once, on the frame the gesture first becomes live, and cached in
   * the model's local frame. The contract makes that legal — `resolve` is pure
   * and must answer the same regardless of what has been played — and it is
   * what keeps the per-frame allocation at zero, since every model returns
   * freshly built vectors.
   */
  private contactOf(p: Player, i: number, g: Gesture): boolean {
    const state = p.resolved[i]!;
    if (state === 2) return false;
    if (state === 0) {
      const model = p.model;
      const c = model?.resolve(g.target, g.effector);
      if (!c) { p.resolved[i] = 2; return false; }
      const at = i * 6;
      p.contact[at] = c.position.x;
      p.contact[at + 1] = c.position.y;
      p.contact[at + 2] = c.position.z;
      const n = V1.copy(c.normal);
      if (n.lengthSq() < 1e-10) n.set(0, 1, 0); else n.normalize();
      p.contact[at + 3] = n.x;
      p.contact[at + 4] = n.y;
      p.contact[at + 5] = n.z;
      p.resolved[i] = 1;
    }
    const at = i * 6;
    V1.set(p.contact[at]!, p.contact[at + 1]!, p.contact[at + 2]!).applyMatrix4(p.world);
    V2.set(p.contact[at + 3]!, p.contact[at + 4]!, p.contact[at + 5]!)
      .applyQuaternion(p.worldQuat).normalize();
    return true;
  }

  /**
   * Where this gesture wants its effector *now*, into `V4`.
   *
   * Reads the contact from `V1` and the normal from `V2`, which `contactOf`
   * has just filled in.
   */
  private arcOf(p: Player, i: number, g: Gesture, tau: number, target: Effector): void {
    const slot = p.slots[SLOT_OF[target]]!;

    // The windup's anchor: wherever the limb actually was when the windup
    // began, captured once. Re-reading it every frame would feed the arc back
    // into itself and the hand would crawl.
    if (!p.anchored[i]) {
      const at = i * 3;
      if (slot.hasLast) {
        p.anchor[at] = slot.last.x;
        p.anchor[at + 1] = slot.last.y;
        p.anchor[at + 2] = slot.last.z;
      } else if (this.idleContact(p, target, V3)) {
        p.anchor[at] = V3.x; p.anchor[at + 1] = V3.y; p.anchor[at + 2] = V3.z;
      } else {
        p.rig.restPosition(target, V3);
        p.anchor[at] = V3.x; p.anchor[at + 1] = V3.y; p.anchor[at + 2] = V3.z;
      }
      p.anchored[i] = 1;
    }
    const at = i * 3;
    V3.set(p.anchor[at]!, p.anchor[at + 1]!, p.anchor[at + 2]!);

    const [base, byForce, byTravel] = LIFT[g.kind];
    const travel = Math.min(V3.distanceTo(V1), MAX_TRAVEL);
    const lift = base + byForce * g.force + byTravel * travel;

    if (tau < 0) {
      // The windup. Lateral travel eases in and out; the height along the
      // normal is what accelerates into the surface.
      const s = g.prep > 0 ? clamp01(1 + tau / g.prep) : 1;
      V4.lerpVectors(V3, V1, smooth(s));
      if (lift > 0) V4.addScaledVector(V2, lift * windup(s));
      return;
    }

    // On the beat and after it. `tau === 0` puts the effector exactly on the
    // contact, which is the invariant this whole file exists to hold.
    const u = g.release > 0 ? clamp01(tau / g.release) : 1;
    V4.copy(V1);

    const rebound = lift * REBOUND[g.kind];
    if (SUSTAINS.has(g.kind)) {
      // Still on the note. Only the last of the release is a departure.
      const tail = (u - SUSTAIN_HOLD) / (1 - SUSTAIN_HOLD);
      if (tail > 0 && rebound > 0) V4.addScaledVector(V2, rebound * followThrough(clamp01(tail)));
    } else if (rebound > 0) {
      V4.addScaledVector(V2, rebound * followThrough(u));
    }

    if (target === 'bow') {
      // The stroke. Zero on the beat, so the contact is exact, and running in
      // the direction the stroke is currently going — which reverses on a `bow`
      // and carries straight on through a `hold`.
      V5.set(1, 0, 0).applyQuaternion(p.rigQuat);
      V4.addScaledVector(V5, p.stroke * BOW_TRAVEL * smooth(u) * (0.4 + 0.6 * g.force));
    }
  }

  // -- the three layers ----------------------------------------------------

  /** Play: whatever the gestures accumulated, blended and committed. */
  private commitPlay(p: Player, beat: number): void {
    for (const e of COMMIT_ORDER) {
      const slot = p.slots[SLOT_OF[e]]!;
      if (!slot.played || slot.weight <= 0) continue;

      const w = slot.weight;
      V1.set(slot.px / w, slot.py / w, slot.pz / w);
      V2.set(slot.nx, slot.ny, slot.nz);

      // Below full weight the gesture is arriving or leaving, and a limb with a
      // home to go to blends toward it. That crossfade *is* the handover to the
      // idle layer, so there is no frame where anything snaps.
      if (w < 1 && isLimb(e) && this.idleContact(p, e, V3)) {
        V1.lerp(V3, 1 - w);
      }

      const hasNormal = V2.lengthSq() > 1e-8;
      p.rig.setEffector(e, V1, hasNormal ? V2.normalize() : undefined);
      slot.last.copy(V1);
      slot.hasLast = true;
      slot.idling = false;
      slot.idleSince = beat;
    }
  }

  /**
   * Groove: what the body does whether or not it is playing.
   *
   * Additive where the rig separates the channels for us — `setSway` and
   * `setHeadNod` move the torso and everything resting, and a hand placed on a
   * snare stays on the snare because the snare did not sway — and yielding
   * where it shares a part with play. A drummer's tapping foot is not a
   * behaviour the groove score emits, but a keyboard player's `lean` and an
   * accordion's `squeeze` do share the torso, and play wins.
   */
  private groove(p: Player, beat: number, step: number): void {
    const want = p.stopped ? 0 : 1;
    p.gain += (want - p.gain) * (1 - Math.exp(-step / STOP_FADE_SECONDS));
    if (p.gain < 0.001) p.gain = 0;

    let nod = 0; let nodPhase = 0;
    let sway = 0; let swayPhase = 0;
    let eyes = 0;
    let watch: GrooveBehaviour | undefined;
    let watchAmp = 0;

    for (let b = 0; b < p.behaviours.length; b++) {
      const behaviour = p.behaviours[b]!;
      const amp = this.amplitude(p, b, beat) * p.gain;
      if (amp <= 0.0005 && behaviour.kind !== 'watch') continue;

      const phase = this.phaseOf(p, behaviour, beat);
      switch (behaviour.kind) {
        case 'head-nod':
          if (amp > nod) { nod = amp; nodPhase = phase; }
          break;
        case 'body-sway':
          if (amp > sway) { sway = amp; swayPhase = phase; }
          break;
        case 'eyes-shut':
          if (amp > eyes) eyes = amp;
          break;
        case 'foot-tap': {
          const part = PART_OF[behaviour.effector];
          if (p.busy[part]) break;
          const slot = p.slots[SLOT_OF[behaviour.effector]]!;
          p.rig.restPosition(behaviour.effector, V1);
          // Down on the beat, up between: the foot is on the floor when the
          // pulse lands, which is the whole gesture.
          V1.y += TAP_LIFT * amp * (0.5 - 0.5 * Math.cos(phase));
          p.rig.setEffector(behaviour.effector, V1);
          slot.last.copy(V1);
          slot.hasLast = true;
          slot.idling = false;
          slot.idleSince = beat;
          p.busy[part] = true;
          break;
        }
        case 'lean': {
          if (p.busy[PART_OF.body]) break;
          p.rig.restPosition('body', V1);
          V2.set(0, 0, 1).applyQuaternion(p.rigQuat);
          V1.addScaledVector(V2, LEAN_REACH * amp * (0.5 + 0.5 * Math.sin(phase)));
          p.rig.setEffector('body', V1);
          p.busy[PART_OF.body] = true;
          break;
        }
        case 'watch':
          if (amp > watchAmp) { watchAmp = amp; watch = behaviour; }
          break;
      }
    }

    p.rig.setSway(sway, swayPhase);
    p.rig.setHeadNod(nod, nodPhase);
    p.rig.setEyesClosed(eyes);

    // A head can only be turned toward one person, so the score emits one
    // `watch` per soloist with non-overlapping spans and the loudest wins.
    const target = watch && watchAmp > 0.02 ? this.byId.get(watch.targetPerformerId ?? '') : undefined;
    if (target && target !== p) {
      target.rig.restPosition('head', p.look);
      p.rig.lookAt(p.look);
    } else {
      p.rig.lookAt(undefined);
    }
  }

  /**
   * Idle: mostly the absence of a command, and occasionally the instrument's
   * own idea of where a hand belongs.
   *
   * A hand holds the last thing it played for about two thirds of a second —
   * long enough that a hand does not run home between two crotchets — and then
   * drifts to `resolve({kind:'rest'})`, because a guitarist's hands belong on
   * the guitar and only the guitar knows where that is. Where the model has no
   * answer the command simply stops and the rig eases the limb home on its own,
   * which is positionally continuous because the rig eases from wherever the
   * limb actually is.
   *
   * Feet are exempt from the drift. Several models answer `rest` with one
   * contact meant for a hand, and a foot that wandered up to a hi-hat would be
   * worse than a foot that stayed on its pedal.
   */
  private idle(p: Player, beat: number): void {
    for (let k = 0; k < 4; k++) {
      const e = EFFECTORS[k]!;
      const part = PART_OF[e];
      if (p.busy[part]) continue;

      const slot = p.slots[SLOT_OF[e]]!;
      // A bowed player's right hand idles where the bow lives, not where a
      // pizzicato finger would.
      const ask: Effector = e === 'right-hand' && p.usesBow ? 'bow' : e;
      const foot = k >= 2;

      if (!slot.idling) {
        if (!slot.hasLast) {
          if (!this.idleContact(p, ask, slot.idleFrom)) continue;
        } else {
          slot.idleFrom.copy(slot.last);
        }
        slot.idling = true;
      }

      V1.copy(slot.idleFrom);
      if (!foot && this.idleContact(p, ask, V2)) {
        const held = beat - slot.idleSince;
        const t = smooth(clamp01((held - this.idleHold) / this.idleEase));
        if (t > 0) V1.lerp(V2, t);
      } else if (foot && !slot.hasLast) {
        continue;
      }

      // Two hands, one rest contact — the kit and every horn answer that way.
      // Push them apart along the player's own lateral axis rather than leaving
      // them interpenetrating, which is invisible in a screenshot and obvious
      // in motion.
      if (!foot) {
        const other = p.slots[SLOT_OF[k === 0 ? 'right-hand' : 'left-hand']]!;
        if (!other.played && other.hasLast && other.last.distanceToSquared(V1) < IDLE_SPLIT * IDLE_SPLIT) {
          V2.set(1, 0, 0).applyQuaternion(p.rigQuat);
          V1.addScaledVector(V2, k === 0 ? IDLE_SPLIT * 0.5 : -IDLE_SPLIT * 0.5);
        }
      }

      p.rig.setEffector(e, V1);
      slot.last.copy(V1);
      slot.hasLast = true;
    }
  }

  /**
   * The instrument's idea of where this effector idles, into `out`.
   *
   * `fingering` first, so a wind player's hands follow the pitch — the trumpet
   * model builds a contact per fingering precisely so the runtime has something
   * pitch-dependent rather than a constant — then `rest`. Cached by point
   * identity, because the `PlayPoint` objects in the IR are stable and
   * comparing references is free.
   */
  private idleContact(p: Player, e: Effector, out: Vector3): boolean {
    const model = p.model;
    if (!model) return false;
    if (!p.occupiesHands && e !== 'left-foot' && e !== 'right-foot') return false;
    const slot = p.slots[SLOT_OF[e]]!;
    const point = p.fingering ?? REST_POINT;

    if (slot.idlePoint !== point || slot.idleState === 0) {
      const c = model.resolve(point, e);
      slot.idlePoint = point;
      if (!c) {
        slot.idleState = 2;
      } else {
        slot.idleState = 1;
        slot.idleLocal[0] = c.position.x;
        slot.idleLocal[1] = c.position.y;
        slot.idleLocal[2] = c.position.z;
        slot.idleLocal[3] = c.normal.x;
        slot.idleLocal[4] = c.normal.y;
        slot.idleLocal[5] = c.normal.z;
      }
    }
    if (slot.idleState !== 1) return false;
    out.set(slot.idleLocal[0]!, slot.idleLocal[1]!, slot.idleLocal[2]!).applyMatrix4(p.world);
    return true;
  }

  // -- the face ------------------------------------------------------------

  /**
   * The singing mouth is two systems and they are blended, not chosen between.
   *
   * `choreograph.ts` emits one gesture per sung note carrying the vowel, the
   * consonant and a force — that is **timing and loudness**. `visemes.ts` owns
   * **shape**, as three continuous parameters and an onset measured in seconds
   * because articulation is physical and does not scale with tempo. Drive the
   * shape from the track, the amplitude from the gesture, and the mouth cannot
   * drift out of agreement with the voice, because both are readings of the
   * same notes.
   *
   * The mouth arrives at the shape *on the beat*, like every other effector,
   * having taken `onsetSeconds` to get there — so a 3 ms stop pops it open and
   * a 70 ms nasal eases into it. Between syllables it shuts, because
   * `blipBeats` says it does, and that gap is what makes a face read as singing
   * rather than as a hinge.
   */
  private face(p: Player, beat: number, blow: number, breath: number, force: number): void {
    if (!p.singer && !p.blown) return;

    let open = 0;
    let round = 0;
    let spread = 0;

    if (p.visemes.length) {
      const v = this.visemeAt(p, beat);
      if (v) {
        const onset = Math.max(1e-4, v.onsetSeconds * this.beatsPerSecond);
        const tau = beat - v.beat;
        let e: number;
        if (tau < 0) e = smooth(clamp01(1 + tau / onset));
        else if (tau <= v.holdBeats) e = 1;
        else e = 1 - smooth(clamp01((tau - v.holdBeats) / Math.max(this.closeBeats, 1e-4)));
        // Loudness opens the jaw; it does not change which vowel is being sung,
        // so the lips keep their shape.
        const loud = 0.6 + 0.4 * (force > 0 ? force : 0.6);
        open = v.open * e * loud;
        round = v.round * e;
        spread = v.spread * e;
      }
    } else if (p.blown && blow > 0) {
      // An embouchure: a small, tight, round aperture that firms up as the note
      // starts. Nothing here is a viseme — a trumpeter is not singing a vowel.
      open = 0.08 * blow;
      round = 0.30 + 0.35 * blow;
      spread = 0.06 * blow;
    }

    // The inhale. A singer who never breathes is the most uncanny thing that
    // can be put on a stage, and both sources of "there is a breath here" — the
    // choreographer's `breathe` gestures and the viseme track's spans — are
    // taken at their maximum rather than one being picked over the other.
    const depth = Math.max(breath, this.breathAt(p, beat));
    if (depth > 0) {
      open = Math.max(open, 0.34 * depth);
      round = Math.max(round, 0.42 * depth);
    }

    p.rig.setMouth(clamp01(open), clamp01(round), clamp01(spread));
  }

  /** The viseme whose window contains `beat`, or `undefined`. Cursored. */
  private visemeAt(p: Player, beat: number): Viseme | undefined {
    const vs = p.visemes;
    if (!vs.length) return undefined;
    let i = p.vCursor;
    if (i >= vs.length || vs[i]!.beat > beat + 2) i = 0;
    while (i + 1 < vs.length && vs[i + 1]!.beat <= beat) i++;
    p.vCursor = i;
    const v = vs[i]!;
    const onset = Math.max(1e-4, v.onsetSeconds * this.beatsPerSecond);
    if (beat < v.beat - onset) {
      // Before the first onset of all, or in the gap the cursor has not
      // reached: look one back rather than opening the mouth early.
      return undefined;
    }
    return beat <= v.beat + v.holdBeats + this.closeBeats ? v : undefined;
  }

  /** How deep the inhale is at `beat`, 0 when there is none. Cursored. */
  private breathAt(p: Player, beat: number): number {
    const bs = p.breaths;
    if (!bs.length) return 0;
    let i = p.bCursor;
    if (i >= bs.length || bs[i]!.fromBeat > beat + 2) i = 0;
    while (i + 1 < bs.length && bs[i + 1]!.fromBeat <= beat) i++;
    p.bCursor = i;
    const span = bs[i]!;
    if (beat < span.fromBeat || beat > span.toBeat) return 0;
    const width = Math.max(span.toBeat - span.fromBeat, 1e-4);
    const t = (beat - span.fromBeat) / width;
    // In and out over the span, so the chest is fullest as the phrase starts.
    return span.value * Math.sin(Math.PI * clamp01(t));
  }

  // -- hands ---------------------------------------------------------------

  /**
   * Hand shape, changed only where a gesture genuinely calls for it.
   *
   * `DEFAULT_HAND_POSES` is applied per archetype at build and is right almost
   * everywhere: a drummer's fists, a pianist's key hands, a guitarist's spread
   * left and picking right are all already what the gestures are about to ask
   * for, and overriding them from the gesture kind would *replace* a correct
   * pose with a generic one — a guitarist's fretting hand is `spread`, not
   * `keys`, however much `press` sounds like a keyboard.
   *
   * The case that is genuinely not covered is a bowed instrument playing
   * pizzicato: the right hand's default is `grip`, because it is holding a bow,
   * and for a whole pizzicato section it is not. That one is worth blending,
   * and it is blended rather than snapped — the rig eases over about 85 ms on
   * top of this.
   */
  private poses(p: Player): void {
    for (let side = 0; side < 2; side++) {
      // Only a hand whose default is `grip` — a hand that is *holding*
      // something — has anything to learn from the gesture kind. Every other
      // default already describes the action about to happen.
      const want = p.holding[side] ? Math.min(1, p.pluck[side]!) : 0;
      // Quantised, because `setHandPose` builds a fresh blended pose below full
      // weight and this runs twice a frame per player.
      const q = Math.round(want * 8) / 8;
      if (q === p.poseWeight[side]) continue;
      p.poseWeight[side] = q;
      const hand: BodySide = side === 0 ? 'left' : 'right';
      p.rig.setHandPose(hand, 'pluck', q);
    }
  }

  // -- groove maths --------------------------------------------------------

  /**
   * A behaviour's amplitude at `beat`, interpolated.
   *
   * `Span[]` is stepped on purpose — the section energy it comes from is
   * piecewise, and a chorus is simply bigger than an intro — and the IR carries
   * no easing hint because easing is a rendering decision. This is that
   * decision: each span's value is taken to hold at the span's *centre* and the
   * runtime lerps between centres, so the curve passes through every value the
   * score wrote and no body changes gear on a bar line.
   */
  private amplitude(p: Player, index: number, beat: number): number {
    const spans = p.behaviours[index]!.amplitude;
    if (!spans.length) return 0;
    let i = p.spanCursor[index]!;
    if (i >= spans.length || centreOf(spans[i]!) > beat + 8) i = 0;
    while (i + 1 < spans.length && centreOf(spans[i + 1]!) <= beat) i++;
    p.spanCursor[index] = i;

    const here = spans[i]!;
    const c0 = centreOf(here);
    if (beat <= c0) {
      if (i === 0) return here.value;
      const before = spans[i - 1]!;
      const c = centreOf(before);
      const t = clamp01((beat - c) / Math.max(c0 - c, 1e-6));
      return before.value + (here.value - before.value) * t;
    }
    const next = spans[i + 1];
    if (!next) return here.value;
    const c1 = centreOf(next);
    const t = clamp01((beat - c0) / Math.max(c1 - c0, 1e-6));
    return here.value + (next.value - here.value) * t;
  }

  /**
   * Where a behaviour is in its cycle, in radians.
   *
   * `GroovePart.phase` is a fixed offset in beats and is what stops the band
   * nodding in unison. `looseness` is added on top as a slow drift — a player
   * who keeps time loosely does not sit a constant distance off the beat, they
   * wander — and the wander is drawn from the performer's id, so two shows from
   * one seed nod identically.
   */
  private phaseOf(p: Player, behaviour: GrooveBehaviour, beat: number): number {
    const period = behaviour.periodBeats > 0 ? behaviour.periodBeats : 1;
    const wander = p.looseness * 0.06 * Math.sin(beat * 0.21 + p.drift);
    return ((beat + p.phase + wander) / period) * Math.PI * 2;
  }
}

// ---------------------------------------------------------------------------
// Small shared parts
// ---------------------------------------------------------------------------

/**
 * How much authority a gesture has right now, 0..1.
 *
 * Ramping in over the windup is what makes overlapping gestures crossfade
 * instead of stutter: the last frame of one release is already blending into
 * the next windup. Full at the beat, always. A sustaining kind holds its
 * authority for most of its release, because a finger stays on the key; a
 * ballistic one lets go across the whole bounce.
 */
function weightOf(g: Gesture, tau: number): number {
  if (tau < 0) {
    if (g.prep <= 0) return 0;
    return smooth(clamp01(1 + tau / g.prep));
  }
  if (g.release <= 0) return tau === 0 ? 1 : 0;
  const u = clamp01(tau / g.release);
  const hold = SUSTAINS.has(g.kind) ? SUSTAIN_HOLD : 0;
  if (u <= hold) return 1;
  return 1 - smooth(clamp01((u - hold) / (1 - hold)));
}

function centreOf(span: Span): number {
  return (span.fromBeat + span.toBeat) * 0.5;
}

/** Effectors that are parts you can leave somewhere. */
function isLimb(e: Effector): boolean {
  return e === 'left-hand' || e === 'right-hand' || e === 'bow'
    || e === 'left-foot' || e === 'right-foot';
}

/**
 * Whether two play points are the same place on the same instrument.
 *
 * Field-wise over the union rather than a switch, so a new `PlayPoint` variant
 * cannot silently compare equal by having no case: every field any member
 * carries is compared, and `undefined === undefined` covers the ones this
 * variant does not have.
 */
function samePoint(a: PlayPoint | undefined, b: PlayPoint): boolean {
  if (!a || a.kind !== b.kind) return false;
  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  return x['midi'] === y['midi']
    && x['string'] === y['string'] && x['fret'] === y['fret']
    && x['voice'] === y['voice'] && x['which'] === y['which']
    && x['open'] === y['open']
    && x['vowel'] === y['vowel'] && x['consonant'] === y['consonant'];
}
