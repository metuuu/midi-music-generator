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
 * ## Six rules, and the reason each exists
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
 *     dropping three of them. Once per *place struck*, rather than once per
 *     gesture — a note on a string instrument is two gestures at one point —
 *     and the one that survives is the gesture that made the sound.
 *
 *  4. **Nothing is allocated per frame.** `InstrumentModel.resolve` is pure and
 *     time-invariant by contract, so every contact is resolved once, on the
 *     frame its gesture first becomes active, and cached in the model's own
 *     local frame — which is also the frame `Contact.position` is expressed in.
 *     Per frame the runtime does a matrix multiply per contact and nothing else.
 *
 *  5. **No position is ever remembered in world space.** Not the contacts, and
 *     — the part that was wrong — not the *bookkeeping* either: where a limb was
 *     last put, where an idle drift started, where a windup is anchored. All of
 *     it lives in the model's local frame and is transformed on read.
 *
 *     This is the bug the bassist made visible. A carried instrument is
 *     parented to the player's torso, so it sways with them; the contacts rode
 *     that correctly, but `last` and `idleFrom` were world points frozen at the
 *     moment they were captured. Between two bass notes the hands sat where the
 *     bass *had been* while the bass and the player swayed out from under them.
 *     Anything cached across a frame boundary now goes through `toLocal` on the
 *     way in and `toWorld` on the way out, and for a floor-standing instrument
 *     both are the identity, so nothing pays for it.
 *
 *  6. **No `Math.random`.** Everything that wants a little human scatter — the
 *     groove's drift, the per-limb arc jitter that stops two hands moving in
 *     lockstep, the stroke-to-stroke variation that stops one hand playing the
 *     same arc twice — draws from `new Rng(performer.id + tag)`, so two shows
 *     from one seed animate identically down to the frame.
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

import { soundingEffectors } from '../../concert/choreograph.js';
import { ARCHETYPES } from '../../concert/instruments.js';
import type {
  ConcertNumber, Effector, Gesture, GestureKind, GrooveBehaviour, PlayPoint,
  Span, Viseme,
} from '../../concert/types.js';
import { Rng } from '../../core/rng.js';

import {
  apexOf, bounce, clamp01, coverOf, hop, liftCeiling, reach, smooth, snapOf,
} from './animate-arc.js';
import type { InstrumentModel } from './instruments/types.js';
import {
  DEFAULT_HAND_POSES, type BodySide, type HandPoseId, type PerformerRig,
} from './performer.js';

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
 *
 * What this table cannot say is how much *time* there is, and that turns out to
 * matter more than any of these numbers: a sixteenth-note hat pattern and a
 * crash both want a lift and only one of them can have it. `liftCeiling` caps
 * every result by what the limb could actually fall back down in the beats the
 * gesture has, so the ceiling — not the table — is what keeps the sticks low in
 * a fast passage.
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
 * How close two idle answers have to be before the runtime decides the model
 * gave it one answer twice rather than two answers that happen to be near.
 *
 * Deliberately tiny. The condition being detected is not "these hands are
 * close", it is "this model ignored the `effector` parameter and built the same
 * contact twice", which comes back as the identical floats and a distance of
 * exactly zero. Four millimetres is slack for two separately constructed
 * vectors and nothing else.
 *
 * A larger threshold would be the more *helpful*-looking number and would be
 * wrong: an instrument whose two hands genuinely sit two centimetres apart has
 * an opinion, and overriding it puts a flautist's hands on the wrong sides of
 * the tube. Every string model has answered per hand since `withSoundingContact`
 * and every wind, brass and free-reed model now does too, so the set this
 * catches is exactly the models that never needed to choose — a drum is struck
 * where it is struck.
 */
const COINCIDENT = 0.004;

/**
 * How far a hand is pulled from the model's rest toward the part of the
 * instrument that hand actually plays, when the model gave one answer for both.
 *
 * This is the other half of "the drummer's hands are on top of each other", and
 * the half that makes the result look deliberate rather than merely
 * non-overlapping. A drum kit's `rest` is one point in front of the drummer;
 * pushing two hands apart from it puts them somewhere neither of them plays. But
 * the runtime already knows where each hand plays — it has been resolving that
 * hand's contacts all number — so the mean of them is available for free, and it
 * is exactly "over the part of it that hand plays": the left stick hovers over
 * the snare and hats, the right over the ride and toms.
 */
const ZONE_PULL = 0.75;

/** Contacts a hand must have resolved before its play zone is trusted. */
const ZONE_MIN = 3;

/**
 * How many contacts the zone mean is taken over before it starts forgetting.
 *
 * A running mean over everything would freeze on the intro; capping the count
 * turns it into an exponential mean, so a hand that moves to the ride for the
 * solo idles over the ride within a few bars.
 */
const ZONE_MEMORY = 48;

/** How far a hand hovers off a surface it plays but is not playing now, metres. */
const IDLE_HOVER = 0.05;

/**
 * Seconds an idle hand takes to follow a step in its target.
 *
 * The drift home is already smooth; the *target* is not. A wind player's
 * fingering changes discretely from one note to the next — the trumpet model
 * builds a contact per fingering precisely so the hands can track the pitch —
 * and a hand that teleported between valve positions made a trumpeter look like
 * a slideshow. Short enough not to lag the drift measurably, long enough to
 * read as a finger moving.
 */
const IDLE_FOLLOW_SECONDS = 0.05;

/**
 * Seconds a wrist takes to turn from what the last stroke left it at to the
 * idle attitude.
 *
 * The play layer hands `Contact.normal` to the rig and the rig turns the palm
 * into the surface; idle used to hand it nothing at all, so the wrist snapped
 * back to its resting attitude on the frame the release ended. The position
 * crossfaded and the rotation did not, which is a tell nobody could name and
 * everybody could see.
 */
const NORMAL_EASE_SECONDS = 0.18;

/**
 * How much of the body's sway an idle hand rides, and over how long the
 * reference it is measured against forgets.
 *
 * A *commanded* limb goes exactly where it is put — the rig adds no sway to it,
 * deliberately, or a hand on a snare would slide off the snare. That is right
 * for a floor-standing instrument being played and wrong for the same
 * instrument's hands doing nothing: a drummer swaying with two perfectly
 * motionless hands is uncanny in a way a still frame will not show you.
 *
 * So an idle hand takes a share of the *difference* between the rig's live rest
 * and a slow average of it, which is the sway with the posture subtracted out.
 * Only for instruments the player does not carry: a saxophone already takes its
 * player's hands with it, and adding this on top would sway them twice.
 */
const IDLE_SWAY_FOLLOW = 0.45;
const SWAY_REFERENCE_SECONDS = 1.1;

/** How long the mouth takes to shut after a syllable. Matches `visemes.ts`. */
const MOUTH_CLOSE_SECONDS = 0.06;

/**
 * Default hand poses that mean "this hand is *holding* something".
 *
 * Named here rather than tested for by comparing against `'grip'`, which is
 * what this used to do and which was a trap: `DEFAULT_HAND_POSES` is the rig's
 * table and it grew four entries — `stick`, `bowhold`, `strap`, `press` — the
 * moment somebody improved the hands. A drummer moved from `grip` to `stick`
 * and the equality test silently started answering "no". The rig agent noticed
 * and deliberately left the violin and cello right hands on `grip` rather than
 * moving them to the more accurate `bowhold` so as not to break this file;
 * naming the whole category removes the reason for that favour, and a pose id
 * that stops existing is now a compile error rather than a shrug.
 *
 * What the category is *for* is `poses()`: only a hand that is holding
 * something has anything to learn from a gesture kind, because every other
 * default already describes the action about to happen.
 */
const HOLDING_POSES: ReadonlySet<HandPoseId> = new Set<HandPoseId>([
  'grip', 'stick', 'bowhold', 'strap', 'fist',
]);

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

/** Floats cached per gesture: position, surface normal, knuckle axis. */
const CONTACT_STRIDE = 9;

/** Distinct idle points cached per effector. Comfortably a wind fingering set. */
const IDLE_CACHE = 32;

/**
 * Floats per cached idle contact: position, normal, knuckle axis.
 *
 * The same nine as `CONTACT_STRIDE`, and it has to be the same nine. This
 * cached six for a while and dropped `Contact.along` on the floor, which for
 * the whole wind and brass family meant it was never used at all: a blown
 * instrument's sounding gestures are all on the `mouth`, so the hands have no
 * gestures and are placed *exclusively* through this path. Every saxophone in
 * every show had its fingers across the keys instead of along them, and no
 * amount of the model getting the axis right could have fixed it.
 */
const IDLE_STRIDE = 9;

// ---------------------------------------------------------------------------
// Scratch. Six players at 60 Hz is not the place to allocate a vector.
// ---------------------------------------------------------------------------

const V1 = new Vector3();
const V2 = new Vector3();
const V3 = new Vector3();
const V4 = new Vector3();
const V5 = new Vector3();
const V6 = new Vector3();
const V7 = new Vector3();
const V8 = new Vector3();

/** Points fired this beat, for the `react` de-duplication. */
const FIRED: (PlayPoint | undefined)[] = new Array<PlayPoint | undefined>(24).fill(undefined);

// ---------------------------------------------------------------------------
// Per-effector state
// ---------------------------------------------------------------------------

interface Slot {
  /** This frame's weighted accumulation, in world space. */
  px: number; py: number; pz: number;
  nx: number; ny: number; nz: number;
  ax: number; ay: number; az: number;
  weight: number;
  /**
   * The loudest single gesture's weight, as distinct from their sum.
   *
   * A chord is one motion and several gestures — `choreograph.ts` emits one per
   * target — so the sum reaches three on a triad and the "is this gesture
   * arriving or leaving" test never fired. Authority is the maximum; the sum is
   * only ever a divisor for the weighted mean of the positions.
   */
  top: number;
  /** Whether the play layer put anything here this frame. */
  played: boolean;

  /** Where this effector was last commanded, in the model's local frame. */
  last: Vector3;
  hasLast: boolean;
  /**
   * The attitude it was last commanded with, eased toward the idle attitude.
   * Local, unit, or unset. `norm` is the surface normal and `along` the
   * knuckle axis — both, because a normal alone leaves the roll free and the
   * roll is exactly what puts a wind player's fingers across the keys instead
   * of on them.
   */
  norm: Vector3;
  hasNorm: boolean;
  along: Vector3;
  hasAlong: boolean;

  /** Where the idle drift started — local — and when, in beats. */
  idleFrom: Vector3;
  idleSince: number;
  idling: boolean;

  /** The slow average of the rig's own rest for this limb. World; see below. */
  swayRef: Vector3;
  hasSwayRef: boolean;

  /**
   * Idle contacts, cached by point *value*: the points, six floats each, and a
   * flag of 1 resolved or 2 the model does not know.
   *
   * More than one entry because of the wind players. A trumpet's idle target is
   * its *fingering*, which changes with every note, so a single-entry cache
   * missed on every note and called `resolve` — which by contract returns
   * freshly built vectors — twice a note for the whole number. That is a slow
   * drip of garbage in the one path that promises not to produce any.
   *
   * By value and not by reference, which is the part that took a measurement to
   * find. The `PlayPoint` objects in the IR are stable but they are not
   * *shared*: `choreograph.ts` builds a fresh `{kind:'hole', midi}` for every
   * note, so a saxophone playing the same F♯ three hundred times presents three
   * hundred distinct objects for one fingering. Identity alone thrashed a
   * thirty-two entry cache down to a permanent miss. `samePoint` is the same
   * comparison `react` de-duplicates with, and `idleHint` keeps the common
   * case — the fingering did not change since last frame — a single reference
   * check.
   */
  idlePoints: (PlayPoint | undefined)[];
  idleLocal: Float64Array;
  idleFlags: Uint8Array;
  idleCount: number;
  idleNext: number;
  idleHint: number;

  /**
   * The mean of every contact this effector has resolved, with its mean normal
   * and knuckle axis, in the model's local frame — "the part of the instrument
   * this hand plays".
   */
  zone: Vector3;
  zoneN: Vector3;
  zoneA: Vector3;
  zoneCount: number;

  /** Per-limb arc scatter, so two hands never move in lockstep. */
  varyLift: number;
  varyApex: number;
  varyBounce: number;
}

function makeSlot(): Slot {
  return {
    px: 0, py: 0, pz: 0, nx: 0, ny: 0, nz: 0, ax: 0, ay: 0, az: 0,
    weight: 0, top: 0, played: false,
    last: new Vector3(), hasLast: false,
    norm: new Vector3(), hasNorm: false,
    along: new Vector3(), hasAlong: false,
    idleFrom: new Vector3(), idleSince: 0, idling: false,
    swayRef: new Vector3(), hasSwayRef: false,
    idlePoints: new Array<PlayPoint | undefined>(IDLE_CACHE).fill(undefined),
    idleLocal: new Float64Array(IDLE_STRIDE * IDLE_CACHE),
    idleFlags: new Uint8Array(IDLE_CACHE),
    idleCount: 0, idleNext: 0, idleHint: 0,
    zone: new Vector3(), zoneN: new Vector3(), zoneA: new Vector3(), zoneCount: 0,
    varyLift: 1, varyApex: 0, varyBounce: 1,
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
   * Which of this archetype's effectors actually make the sound.
   *
   * Used only to break the tie in `fireReacts`. It is the choreographer's own
   * answer rather than a second one invented here, because a second answer is
   * how a guitarist's fretting hand ends up counting as the note.
   */
  readonly sounds: ReadonlySet<Effector>;
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
  /**
   * Whether an idle hand should ride a share of the body's sway.
   *
   * The inverse of `ArchetypeSpec.held`, and the reason that field exists: a
   * carried instrument takes the hands with it, a floor-standing one does not.
   */
  readonly ridesSway: boolean;

  /** Contacts, in the model's own local frame: 9 floats per gesture. */
  readonly contact: Float64Array;
  /** 0 unresolved, 1 resolved, 2 the model does not know this point. */
  readonly resolved: Uint8Array;
  /** Where each gesture's windup started from, local. 3 floats per gesture. */
  readonly anchor: Float64Array;
  readonly anchored: Uint8Array;
  /**
   * A −1..1 wobble per gesture, so no hand plays the same arc twice.
   *
   * Per *gesture* rather than per limb, because the thing being cured is two
   * consecutive strokes of one hand being identical, and because two hands that
   * happen to hit the same beat land on different indices and therefore
   * different numbers. Drawn once at `begin` from the performer's id.
   */
  readonly vary: Float32Array;

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

  /**
   * The fingering an active mouth gesture implies, for idle hands.
   *
   * **Sticky.** It used to be cleared every frame and re-derived, so between two
   * notes of a trumpet phrase — where there is no live mouth gesture at all —
   * both hands fell back to the instrument's `rest` and then jumped to the next
   * fingering. A player between two notes keeps their fingers on the valves;
   * the last fingering stands until another one replaces it.
   */
  fingering: PlayPoint | undefined;

  /**
   * Where each hand idles this frame, in world space, already separated.
   *
   * Computed once for both hands together rather than per limb inside the idle
   * loop, because separating two points is a decision about the *pair* and
   * doing it one hand at a time made the answer depend on which hand was
   * processed first — the left pushed off the right's previous-frame position
   * and the right then pushed off the left's new one, so the gap converged over
   * several frames instead of being right on the first.
   */
  readonly goal: [Vector3, Vector3] = [new Vector3(), new Vector3()];
  /** Both in the model's local frame; zero length means the model said nothing. */
  readonly goalNormal: [Vector3, Vector3] = [new Vector3(), new Vector3()];
  readonly goalAlong: [Vector3, Vector3] = [new Vector3(), new Vector3()];
  readonly goalOk: [boolean, boolean] = [false, false];

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

  /**
   * The model's world transform and its inverse, refreshed once a frame.
   *
   * The inverse is what makes rule 5 cheap: every position the runtime
   * remembers is pushed through it on the way into storage, so a cache entry is
   * a fact about the *instrument* rather than about where the instrument
   * happened to be standing on the frame it was written.
   */
  readonly world = new Matrix4();
  readonly worldInv = new Matrix4();
  readonly worldQuat = new Quaternion();
  readonly worldQuatInv = new Quaternion();
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
    this.sounds = new Set<Effector>(soundingEffectors(archetype));
    this.occupiesHands = spec.hands > 0;
    this.ridesSway = !spec.held;
    const defaults = DEFAULT_HAND_POSES[archetype];
    this.holding = [HOLDING_POSES.has(defaults.left), HOLDING_POSES.has(defaults.right)];

    const n = gestures.length;
    this.contact = new Float64Array(n * CONTACT_STRIDE);
    this.resolved = new Uint8Array(n);
    this.anchor = new Float64Array(n * 3);
    this.anchored = new Uint8Array(n);
    this.vary = new Float32Array(n);
    this.spanCursor = new Int32Array(behaviours.length);

    for (let i = 0; i < N_EFF; i++) this.slots.push(makeSlot());

    // A few percent of drift, so no two players are exactly on the beat with
    // each other. `GroovePart.looseness` says how much; the id says which way.
    this.drift = new Rng(`${id}#drift`).float(0, Math.PI * 2);

    const strokes = new Rng(`${id}#stroke`);
    for (let i = 0; i < n; i++) this.vary[i] = strokes.float(-1, 1);

    // Per-limb scatter. Two hands with identical arcs are the tell that this is
    // one animation played twice, and the drummer is where it shows: both
    // sticks rising and falling as one object. A few percent on the lift, the
    // apex and the bounce is enough to break the read without any limb becoming
    // the odd one out.
    for (let s = 0; s < N_EFF; s++) {
      const rng = new Rng(`${id}#${EFFECTORS[s]!}`);
      const slot = this.slots[s]!;
      slot.varyLift = rng.float(0.88, 1.12);
      slot.varyApex = rng.float(-1, 1);
      slot.varyBounce = rng.float(0.84, 1.16);
    }
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
    this.fingering = undefined;
    for (let s = 0; s < N_EFF; s++) {
      const slot = this.slots[s]!;
      slot.hasLast = false;
      slot.hasNorm = false;
      slot.hasAlong = false;
      slot.idling = false;
      slot.hasSwayRef = false;
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

    // Indexed rather than `for…of`, here and in `commitPlay`, and that is a
    // measurement rather than a style: V8 does not always elide the iterator
    // object, and at six players times two loops times sixty hertz the ones it
    // misses were the whole of this file's residual garbage — a few bytes a
    // frame, which is nothing until it is a collection mid-number.
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i]!;
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
    // frame, so every contact is one matrix multiply away from world space —
    // and so is every position the runtime remembers between frames. With no
    // model both matrices stay the identity and the conversions are free.
    if (model) {
      model.root.updateWorldMatrix(true, false);
      p.world.copy(model.root.matrixWorld);
      p.worldInv.copy(p.world).invert();
      model.root.getWorldQuaternion(p.worldQuat);
      p.worldQuatInv.copy(p.worldQuat).invert();
    }
    rig.root.updateWorldMatrix(true, false);
    rig.root.getWorldQuaternion(p.rigQuat);

    this.advance(p, beat);
    this.fireReacts(p, beat);

    // Where the hands would idle, before anything is known about what is being
    // played. Ahead of the gesture loop on purpose: `commitPlay` crossfades a
    // departing limb toward its idle home and `arcOf` anchors a first windup
    // there, so both want the answer already computed. It costs the fingering
    // hands one frame of lag — 16 ms against a finger movement of 120 — and
    // saves an ordering constraint that was easy to break silently.
    this.idleGoals(p);

    for (let s = 0; s < N_EFF; s++) {
      const slot = p.slots[s]!;
      slot.px = 0; slot.py = 0; slot.pz = 0;
      slot.nx = 0; slot.ny = 0; slot.nz = 0;
      slot.ax = 0; slot.ay = 0; slot.az = 0;
      slot.weight = 0; slot.top = 0; slot.played = false;
    }
    for (let i = 0; i < N_PART; i++) p.busy[i] = false;
    p.pluck[0] = 0;
    p.pluck[1] = 0;

    let blowWeight = 0;
    let breathWeight = 0;
    let visemeForce = 0;
    let fingerWeight = 0;

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
          // The loudest live one wins, rather than the last one in index order,
          // and it *replaces* rather than being cleared each frame — see
          // `Player.fingering`.
          if (w > fingerWeight) { fingerWeight = w; p.fingering = g.target; }
          continue;
        }

        const target: Effector = g.effector;
        // `contactOf` leaves the position in V1, the normal in V2 and the
        // knuckle axis, when the model pinned one, in V5.
        if (!this.contactOf(p, i, g)) continue;
        this.arcOf(p, i, g, tau, target);
        const slot = p.slots[SLOT_OF[target]]!;
        slot.px += V4.x * w; slot.py += V4.y * w; slot.pz += V4.z * w;
        slot.nx += V2.x * w; slot.ny += V2.y * w; slot.nz += V2.z * w;
        slot.ax += V5.x * w; slot.ay += V5.y * w; slot.az += V5.z * w;
        slot.weight += w;
        if (w > slot.top) slot.top = w;
        slot.played = true;
        p.busy[PART_OF[target]] = true;
      }
    }

    this.commitPlay(p, beat);
    this.groove(p, beat, step);
    this.idle(p, beat, step);
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
   * string twice as hard as it was played.
   *
   * **The surviving gesture is the one that makes the sound, not the one that
   * was placed first**, and getting that backwards was a real bug rather than a
   * refinement. `stringPart` places the stopping hand first, so the kind that
   * reached the model was always the left hand's `press` — and on a bowed part
   * the whole of the stroke language is in the kind the *bow* carries. `bow`
   * means reverse, `hold` means carry on under the stroke already running,
   * which is what a slur is; the models implement that and were never being
   * told. A guitar had the milder version of the same fault, being told a note
   * was pressed when it was plucked.
   *
   * The scan is over the batch, which is a handful of gestures, and only ever
   * looks at gestures that are about to fire on this same frame anyway.
   */
  private fireReacts(p: Player, beat: number): void {
    const model = p.model;
    const gs = p.gestures;
    let fired = 0;
    let batch = Number.NaN;

    while (p.fire < gs.length && gs[p.fire]!.beat <= beat) {
      const at = p.fire;
      const g = gs[at]!;
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

      // Who else at this beat is playing this same point, and does one of them
      // sound it? If so that one's kind is what happened to the instrument.
      let voice = g;
      if (!p.sounds.has(g.effector)) {
        for (let j = at + 1; j < gs.length && gs[j]!.beat === g.beat; j++) {
          const o = gs[j]!;
          if (p.sounds.has(o.effector) && samePoint(o.target, g.target)) { voice = o; break; }
        }
      }

      model.react(g.target, voice.force, beat, voice.kind);
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
      const at = i * CONTACT_STRIDE;
      p.contact[at] = c.position.x;
      p.contact[at + 1] = c.position.y;
      p.contact[at + 2] = c.position.z;
      const n = V1.copy(c.normal);
      if (n.lengthSq() < 1e-10) n.set(0, 1, 0); else n.normalize();
      p.contact[at + 3] = n.x;
      p.contact[at + 4] = n.y;
      p.contact[at + 5] = n.z;
      // The knuckle axis, when the model pins it. Zero means "you choose".
      const a = c.along;
      p.contact[at + 6] = a ? a.x : 0;
      p.contact[at + 7] = a ? a.y : 0;
      p.contact[at + 8] = a ? a.z : 0;
      p.resolved[i] = 1;
      this.learnZone(p, g.effector, at);
    }
    const at = i * CONTACT_STRIDE;
    V1.set(p.contact[at]!, p.contact[at + 1]!, p.contact[at + 2]!).applyMatrix4(p.world);
    V2.set(p.contact[at + 3]!, p.contact[at + 4]!, p.contact[at + 5]!)
      .applyQuaternion(p.worldQuat).normalize();
    V5.set(p.contact[at + 6]!, p.contact[at + 7]!, p.contact[at + 8]!);
    if (V5.lengthSq() > 1e-10) V5.applyQuaternion(p.worldQuat).normalize();
    return true;
  }

  /**
   * Remember that this effector plays *there*, in the model's local frame.
   *
   * A running mean, capped at `ZONE_MEMORY` so it becomes an exponential one
   * and a hand that moves to the ride for a solo eventually idles over the
   * ride. The normal is averaged alongside the position, because a hand
   * hovering over a hi-hat wants the hat's attitude and not the snare's.
   *
   * Called exactly once per gesture, on the frame it first resolves, so this
   * costs nothing per frame and nothing at all for a gesture never reached.
   */
  private learnZone(p: Player, e: Effector, at: number): void {
    const s = SLOT_OF[e];
    if (s !== 0 && s !== 1 && s !== 5) return;  // hands and the bow hand only
    const slot = p.slots[s]!;
    const n = slot.zoneCount < ZONE_MEMORY ? slot.zoneCount : ZONE_MEMORY;
    const k = 1 / (n + 1);
    slot.zone.x += (p.contact[at]! - slot.zone.x) * k;
    slot.zone.y += (p.contact[at + 1]! - slot.zone.y) * k;
    slot.zone.z += (p.contact[at + 2]! - slot.zone.z) * k;
    slot.zoneN.x += (p.contact[at + 3]! - slot.zoneN.x) * k;
    slot.zoneN.y += (p.contact[at + 4]! - slot.zoneN.y) * k;
    slot.zoneN.z += (p.contact[at + 5]! - slot.zoneN.z) * k;
    slot.zoneA.x += (p.contact[at + 6]! - slot.zoneA.x) * k;
    slot.zoneA.y += (p.contact[at + 7]! - slot.zoneA.y) * k;
    slot.zoneA.z += (p.contact[at + 8]! - slot.zoneA.z) * k;
    slot.zoneCount++;
  }

  /**
   * Where this gesture wants its effector *now*, into `V4`.
   *
   * Reads the contact from `V1` and the normal from `V2`, which `contactOf`
   * has just filled in. The curves themselves are in `animate-arc.ts`; what is
   * decided here is how much of each a given gesture gets.
   */
  private arcOf(p: Player, i: number, g: Gesture, tau: number, target: Effector): void {
    const slot = p.slots[SLOT_OF[target]]!;

    // The windup's anchor: wherever the limb actually was when the windup
    // began, captured once. Re-reading it every frame would feed the arc back
    // into itself and the hand would crawl. Stored in the model's local frame,
    // so a windup that starts on one side of a sway and lands on the other
    // still anchors to a point on the *instrument* — see rule 5.
    if (!p.anchored[i]) {
      const at3 = i * 3;
      if (slot.hasLast) {
        V3.copy(slot.last);
      } else {
        const side: number = handSideOf(target);
        if (side >= 0 && p.goalOk[side]!) this.toLocal(p, p.goal[side]!, V3);
        else this.toLocal(p, p.rig.restPosition(target, V6), V3);
      }
      p.anchor[at3] = V3.x; p.anchor[at3 + 1] = V3.y; p.anchor[at3 + 2] = V3.z;
      p.anchored[i] = 1;
    }
    const at = i * 3;
    V3.set(p.anchor[at]!, p.anchor[at + 1]!, p.anchor[at + 2]!).applyMatrix4(p.world);

    const vary = p.vary[i]!;
    const lifts = LIFT[g.kind];
    // Two sources of scatter, and they answer different complaints: `vary` is
    // per gesture, so one hand never plays two identical strokes, and
    // `varyApex` is per limb, so the two hands are at different phases of their
    // own arcs even when the score puts them on the same beat.
    const apex = apexOf(g.kind, g.force, 0.6 * vary + 0.8 * slot.varyApex);
    const travel = Math.min(V3.distanceTo(V1), MAX_TRAVEL);
    // Read by index rather than destructured: array destructuring goes through
    // the iterator protocol, which is one more thing V8 has to prove it can
    // skip in a function that runs for every live gesture of every player.
    let lift = (lifts[0] + lifts[1] * g.force + lifts[2] * travel)
      * slot.varyLift * (1 + 0.10 * vary);
    // Gravity, which is the only reason a fast passage looks like a fast
    // passage. Everything after the apex is a fall, so that is the time the
    // limb has to get back down from wherever it went.
    const ceiling = liftCeiling(((1 - apex) * g.prep) / this.beatsPerSecond);
    if (lift > ceiling) lift = ceiling;

    if (tau < 0) {
      // The windup: out and up while the limb is high, a hang at the apex, then
      // a fall that is still accelerating when it arrives.
      const s = g.prep > 0 ? clamp01(1 + tau / g.prep) : 1;
      V4.lerpVectors(V3, V1, reach(s, apex, coverOf(g.kind), snapOf(g.kind, g.force)));
      if (lift > 0) V4.addScaledVector(V2, lift * hop(s, apex));
      return;
    }

    // On the beat and after it. `tau === 0` puts the effector exactly on the
    // contact, which is the invariant this whole file exists to hold.
    const u = g.release > 0 ? clamp01(tau / g.release) : 1;
    V4.copy(V1);

    const rebound = lift * REBOUND[g.kind] * slot.varyBounce;
    if (SUSTAINS.has(g.kind)) {
      // Still on the note. Only the last of the release is a departure, and it
      // is a lift rather than a bounce — a finger leaves a key, it is not
      // thrown off it.
      const tail = (u - SUSTAIN_HOLD) / (1 - SUSTAIN_HOLD);
      if (tail > 0 && rebound > 0) V4.addScaledVector(V2, rebound * smooth(clamp01(tail)));
    } else if (rebound > 0) {
      V4.addScaledVector(V2, rebound * bounce(u));
    }

    if (target === 'bow') {
      // The stroke. Zero on the beat, so the contact is exact, and running in
      // the direction the stroke is currently going — which reverses on a `bow`
      // and carries straight on through a `hold`. `V6` rather than `V5`: `V5` is
      // the model's knuckle axis and the caller is about to read it, which the
      // first version quietly overwrote here.
      V6.set(1, 0, 0).applyQuaternion(p.rigQuat);
      V4.addScaledVector(V6, p.stroke * BOW_TRAVEL * smooth(u) * (0.4 + 0.6 * g.force));
    }
  }

  // -- frames --------------------------------------------------------------

  /** A point in the model's frame, into world space. Identity with no model. */
  private toWorld(p: Player, local: Vector3, out: Vector3): Vector3 {
    return out.copy(local).applyMatrix4(p.world);
  }

  /** The way back. See rule 5 for why every cache goes through this. */
  private toLocal(p: Player, world: Vector3, out: Vector3): Vector3 {
    return out.copy(world).applyMatrix4(p.worldInv);
  }

  // -- the three layers ----------------------------------------------------

  /** Play: whatever the gestures accumulated, blended and committed. */
  private commitPlay(p: Player, beat: number): void {
    for (let c = 0; c < COMMIT_ORDER.length; c++) {
      const e = COMMIT_ORDER[c]!;
      const slot = p.slots[SLOT_OF[e]]!;
      if (!slot.played || slot.weight <= 0) continue;

      const w = slot.weight;
      V1.set(slot.px / w, slot.py / w, slot.pz / w);
      V2.set(slot.nx, slot.ny, slot.nz);

      // Below full authority the gesture is arriving or leaving, and a limb
      // with a home to go to blends toward it. That crossfade *is* the handover
      // to the idle layer, so there is no frame where anything snaps. Measured
      // on `top` rather than on the sum: a triad is three gestures and one
      // motion, and summing them meant a chord never crossfaded at all.
      const side: number = handSideOf(e);
      if (slot.top < 1 && side >= 0 && p.goalOk[side]!) {
        V1.lerp(p.goal[side]!, 1 - slot.top);
      }

      const hasNormal = V2.lengthSq() > 1e-8;
      if (hasNormal) V2.normalize();
      V4.set(slot.ax, slot.ay, slot.az);
      const hasAlong = V4.lengthSq() > 1e-8;
      if (hasAlong) V4.normalize();
      p.rig.setEffector(e, V1, hasNormal ? V2 : undefined, hasAlong ? V4 : undefined);
      this.toLocal(p, V1, slot.last);
      slot.hasLast = true;
      // Where the wrist actually ended up, so the idle layer can turn it home
      // rather than dropping it. Stored in the model's frame like everything
      // else, so a carried instrument turns the hand with it.
      if (hasNormal) {
        slot.norm.copy(V2).applyQuaternion(p.worldQuatInv).normalize();
        slot.hasNorm = true;
      }
      if (hasAlong) {
        slot.along.copy(V4).applyQuaternion(p.worldQuatInv).normalize();
        slot.hasAlong = true;
      }
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
          this.toLocal(p, V1, slot.last);
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
  private idle(p: Player, beat: number, step: number): void {
    for (let k = 0; k < 4; k++) {
      const e = EFFECTORS[k]!;
      if (p.busy[PART_OF[e]]) continue;
      const slot = p.slots[SLOT_OF[e]]!;

      if (k >= 2) {
        // A foot stays on its pedal. It is never drifted to the model's `rest`,
        // which on a kit is a contact meant for a hand — a foot that wandered
        // up to a hi-hat would be worse than one that stayed put — and a foot
        // that has never been placed is left entirely alone, so the rig rests
        // it under the body where it belongs.
        if (!slot.hasLast) continue;
        p.rig.setEffector(e, this.toWorld(p, slot.last, V1));
        continue;
      }

      if (!p.goalOk[k]) {
        // The instrument has nothing to say about this hand. Stop commanding
        // it: the rig eases the limb to its own rest, which is live, rides the
        // groove and is separated left from right on its side of the seam. The
        // previous version kept commanding the last position forever, so a hand
        // whose model had no answer froze in mid-air for the whole number.
        slot.idling = false;
        slot.hasLast = false;
        slot.hasNorm = false;
        slot.hasAlong = false;
        continue;
      }

      if (!slot.idling) {
        if (slot.hasLast) slot.idleFrom.copy(slot.last);
        else this.toLocal(p, p.goal[k]!, slot.idleFrom);
        slot.idling = true;
      }

      // Hold what was last played, then drift home. Both ends are in the
      // model's frame, so the whole drift rides a carried instrument.
      this.toWorld(p, slot.idleFrom, V1);
      const held = beat - slot.idleSince;
      const t = smooth(clamp01((held - this.idleHold) / this.idleEase));
      if (t > 0) V1.lerp(p.goal[k]!, t);

      // A share of the body's sway, for a hand the instrument is not already
      // carrying. `restPosition` is live; subtracting a slow average of it
      // leaves the sway with the posture taken out.
      if (p.ridesSway) {
        p.rig.restPosition(e, V2);
        if (!slot.hasSwayRef) { slot.swayRef.copy(V2); slot.hasSwayRef = true; }
        else slot.swayRef.lerp(V2, 1 - Math.exp(-step / SWAY_REFERENCE_SECONDS));
        V1.addScaledVector(V2.sub(slot.swayRef), IDLE_SWAY_FOLLOW);
      }

      // Nothing may step. The drift above is smooth but the *goal* is not — a
      // fingering changes from one note to the next — so a short follow turns a
      // jump into a finger moving. It costs the drift no measurable lag.
      if (slot.hasLast) {
        V1.lerp(this.toWorld(p, slot.last, V6), Math.exp(-step / IDLE_FOLLOW_SECONDS));
      }

      // And the wrist turns home rather than snapping there on the frame the
      // release ends — both axes of it. Passing only the normal leaves the roll
      // to whatever the rig's fallback produces, and for a wind player, whose
      // hands are placed through this path and no other, that is the difference
      // between fingers on the keys and fingers across them.
      const ease = 1 - Math.exp(-step / NORMAL_EASE_SECONDS);
      slot.hasNorm = settleAxis(slot.norm, p.goalNormal[k]!, slot.hasNorm, ease);
      slot.hasAlong = settleAxis(slot.along, p.goalAlong[k]!, slot.hasAlong, ease);

      p.rig.setEffector(
        e, V1,
        slot.hasNorm ? V3.copy(slot.norm).applyQuaternion(p.worldQuat).normalize() : undefined,
        slot.hasAlong ? V7.copy(slot.along).applyQuaternion(p.worldQuat).normalize() : undefined,
      );
      this.toLocal(p, V1, slot.last);
      slot.hasLast = true;
    }
  }

  /**
   * Where both hands idle this frame, into `Player.goal` — separated.
   *
   * The complaint this answers is "the drummer's hands are on top of each
   * other", and there are two things wrong when that happens. The first is that
   * fourteen of the twenty-two models take no notice of `resolve`'s `effector`
   * parameter at all — a drum is struck where it is struck, so they never
   * needed to — and answer `{kind:'rest'}` with one point for both hands. The
   * second is subtler: even pushed apart, one point in front of a drum kit is
   * not where either hand belongs.
   *
   * So: ask per hand, which is the model's chance to be specific and is what
   * `withSoundingContact` already exploits for the whole string family. If the
   * two answers really are one answer, pull each hand toward the part of the
   * instrument *that hand plays* — the runtime has been resolving that hand's
   * contacts all number and their mean is already sitting there — and then
   * guarantee a gap. A model that separated its own hands is left alone
   * entirely; this only ever fires where the model declined to choose.
   */
  private idleGoals(p: Player): void {
    for (let k = 0; k < 2; k++) {
      const e: Effector = k === 0 ? 'left-hand' : 'right-hand';
      // A bowed player's right hand idles where the bow lives, not where a
      // pizzicato finger would.
      //
      // Asked once per hand, which is what `resolve`'s `effector` parameter is
      // for and is now load-bearing: every wind and brass model answers the two
      // hands differently — one supports the instrument, the other fingers it —
      // where they all used to return one contact and leave both palms in the
      // same place.
      const ask: Effector = k === 1 && p.usesBow ? 'bow' : e;
      p.goalOk[k] = this.idleContact(p, ask, p.goal[k]!, p.goalNormal[k]!, p.goalAlong[k]!);
    }
    if (!p.goalOk[0] || !p.goalOk[1]) return;

    const left = p.goal[0]!;
    const right = p.goal[1]!;

    // **A model that answered the two hands differently has already decided,
    // and nothing below runs.** That test is the whole safety of this method.
    // Every string model has answered per hand since `withSoundingContact`, and
    // all seven wind and brass models now do too; a runtime that "improved" on
    // them would put a flautist's hands on the wrong sides of the tube, because
    // separating a pair by the performer's lateral axis assumes nobody had a
    // better idea and on those instruments somebody did.
    if (left.distanceTo(right) >= COINCIDENT) return;

    // One answer, twice. Each hand goes to the surface it actually plays,
    // hovering off it rather than resting on it — a hand at a drum head's
    // contact point is half inside the drum.
    for (let k = 0; k < 2; k++) {
      const slot = p.slots[SLOT_OF[k === 0 ? 'left-hand' : (p.usesBow ? 'bow' : 'right-hand')]]!;
      if (slot.zoneCount < ZONE_MIN) continue;
      this.toWorld(p, slot.zone, V6);
      // A mean of normals can cancel — a hand that plays a hat and a snare
      // pointing opposite ways — so a short one is no answer rather than a
      // direction to normalise into noise.
      V7.copy(slot.zoneN);
      const aimed = V7.lengthSq() > 0.04;
      if (aimed) {
        V7.applyQuaternion(p.worldQuat).normalize();
        V6.addScaledVector(V7, IDLE_HOVER);
      }
      p.goal[k]!.lerp(V6, ZONE_PULL);
      // The attitude follows the position: a hand moved to hover over the
      // snare wants the snare's normal, not the rest contact's, and the same
      // argument applies to the knuckle axis one line down.
      if (aimed) p.goalNormal[k]!.copy(slot.zoneN).normalize();
      if (slot.zoneA.lengthSq() > 0.04) p.goalAlong[k]!.copy(slot.zoneA).normalize();
    }

    // Whatever the zones did or did not manage, two hands may not occupy one
    // point — and how far apart "not one point" is depends on how big this
    // performer's hands are, which is the rig's business and not this file's.
    // `separateRest` puts a shared point onto a given hand's side of the body
    // and guarantees the pair a hand's width and a bit; asking it for both
    // hands from the *midpoint* gives the gap it considers acceptable, and if
    // the zones have already opened a wider one than that they stand.
    V6.addVectors(left, right).multiplyScalar(0.5);
    p.rig.separateRest('left-hand', V6, V7);
    p.rig.separateRest(p.usesBow ? 'bow' : 'right-hand', V6, V8);
    if (left.distanceTo(right) < V7.distanceTo(V8)) {
      left.copy(V7);
      right.copy(V8);
    }
  }

  /**
   * The instrument's idea of where this effector idles, into `out`, with its
   * surface normal into `outNormal`.
   *
   * `fingering` first, so a wind player's hands follow the pitch — the trumpet
   * model builds a contact per fingering precisely so the runtime has something
   * pitch-dependent rather than a constant — then `rest`. Cached by point
   * identity, because the `PlayPoint` objects in the IR are stable and
   * comparing references is free, and cached *per effector*, because that is
   * the whole point of passing one.
   */
  private idleContact(
    p: Player, e: Effector, out: Vector3, outNormal?: Vector3, outAlong?: Vector3,
  ): boolean {
    const model = p.model;
    if (!model) return false;
    if (!p.occupiesHands && e !== 'left-foot' && e !== 'right-foot') return false;
    const slot = p.slots[SLOT_OF[e]]!;
    const point = p.fingering ?? REST_POINT;

    let hit = -1;
    if (slot.idleHint < slot.idleCount && slot.idlePoints[slot.idleHint] === point) {
      hit = slot.idleHint;
    } else {
      for (let j = 0; j < slot.idleCount; j++) {
        if (samePoint(slot.idlePoints[j], point)) { hit = j; break; }
      }
      if (hit >= 0) slot.idleHint = hit;
    }
    if (hit < 0) {
      // A miss is the only place this method is allowed to be expensive, and
      // there are at most a few dozen of them per instrument for the life of a
      // number. Full is not an error: the oldest entry is overwritten and the
      // point behind it will simply resolve again if it comes back.
      hit = slot.idleNext;
      slot.idleNext = (slot.idleNext + 1) % IDLE_CACHE;
      if (slot.idleCount < IDLE_CACHE) slot.idleCount++;
      slot.idleHint = hit;
      slot.idlePoints[hit] = point;
      const c = model.resolve(point, e);
      const at = hit * IDLE_STRIDE;
      if (!c) {
        slot.idleFlags[hit] = 2;
      } else {
        slot.idleFlags[hit] = 1;
        slot.idleLocal[at] = c.position.x;
        slot.idleLocal[at + 1] = c.position.y;
        slot.idleLocal[at + 2] = c.position.z;
        slot.idleLocal[at + 3] = c.normal.x;
        slot.idleLocal[at + 4] = c.normal.y;
        slot.idleLocal[at + 5] = c.normal.z;
        // Zero means "you choose", exactly as in `contactOf`.
        const a = c.along;
        slot.idleLocal[at + 6] = a ? a.x : 0;
        slot.idleLocal[at + 7] = a ? a.y : 0;
        slot.idleLocal[at + 8] = a ? a.z : 0;
      }
    }
    if (slot.idleFlags[hit] !== 1) return false;
    const at = hit * IDLE_STRIDE;
    out.set(slot.idleLocal[at]!, slot.idleLocal[at + 1]!, slot.idleLocal[at + 2]!)
      .applyMatrix4(p.world);
    if (outNormal) {
      outNormal.set(slot.idleLocal[at + 3]!, slot.idleLocal[at + 4]!, slot.idleLocal[at + 5]!);
      if (outNormal.lengthSq() > 1e-10) outNormal.normalize(); else outNormal.set(0, 0, 0);
    }
    if (outAlong) {
      outAlong.set(slot.idleLocal[at + 6]!, slot.idleLocal[at + 7]!, slot.idleLocal[at + 8]!);
      if (outAlong.lengthSq() > 1e-10) outAlong.normalize(); else outAlong.set(0, 0, 0);
    }
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
   * pizzicato: the right hand's default is a bow hold, because it is holding a
   * bow, and for a whole pizzicato section it is not. That one is worth
   * blending, and it is blended rather than snapped — the rig eases over about
   * 85 ms on top of this. `HOLDING_POSES` is the test, for the reasons given
   * there.
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

/**
 * Ease a stored local axis toward the one the idle target wants, in place.
 *
 * Returns whether there is an axis at all, which is not the same question as
 * whether the ease did anything: a model that supplies no `along` should leave
 * the rig's own fallback in charge rather than be handed a zero vector, and the
 * two are told apart here rather than by every caller.
 */
function settleAxis(cur: Vector3, goal: Vector3, had: boolean, ease: number): boolean {
  if (goal.lengthSq() <= 1e-8) return false;
  if (!had) {
    cur.copy(goal);
  } else {
    cur.lerp(goal, ease);
    if (cur.lengthSq() > 1e-8) cur.normalize(); else cur.copy(goal);
  }
  return true;
}

/**
 * Which hand an effector is, or −1 for something that is not one.
 *
 * `bow` is the right hand — the rig says so — and the idle goals are indexed by
 * hand rather than by effector precisely so that a bow stroke crossfading out
 * lands on the same home a pizzicato right hand would.
 */
function handSideOf(e: Effector): number {
  if (e === 'left-hand') return 0;
  if (e === 'right-hand' || e === 'bow') return 1;
  return -1;
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
