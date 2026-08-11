/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * A performer: a head, a torso, two arms, two hands, two legs, two feet, and a
 * face.
 *
 * Rayman hands are why this feature is achievable at all, and it is worth being
 * precise about what they delete. A conventional rig is a skeleton, a skinned
 * mesh and an IK solver with elbow pole targets, and IK on a drummer is
 * genuinely hard — the solution that puts the hand on the snare puts the elbow
 * through the ribs, and the fix is per-instrument hinting that never quite
 * generalises. **A placed hand has no elbow to solve.** The instrument model
 * says where the contact is, the runtime says when to be there, and this file
 * puts the hand at that point. There is no chain, so there is nothing to
 * unsolve.
 *
 * What that leaves is the part that actually reads from the tenth row: shape.
 * A hand in the right place with the wrong shape is worse than no hand, so the
 * poses in `performer-hands.ts` carry the weight the skeleton would have.
 *
 * ## The limbs are drawn. They are still not solved
 *
 * Floating hands and floating feet were one decision, and only half of it
 * survived a screenshot. A gap under a torso reads as a bust on a plinth rather
 * than as a style — which is what the drummer was — and a torso with legs and
 * no arms reads as an injury rather than as Rayman. So `performer-legs.ts` and
 * `performer-arms.ts` draw four limbs, and the thing that keeps them from
 * re-introducing the problem Rayman hands solved is that **they are downstream
 * of the effectors**. The hands and feet are still placed, the animator still
 * puts them on snares and pedals, and the limbs are re-fitted every frame to
 * wherever the shoulders, hips, wrists and ankles ended up. Nothing solves for
 * a hand position; nothing can disagree about one. The elbow through the ribs
 * cannot happen, because no elbow is ever asked to reach anything.
 *
 * ## What this file promises the runtime
 *
 * - **You place; the rig holds.** `setEffector` is absolute and immediate. The
 *   arc, the easing and the timing are the runtime's, because only the runtime
 *   can see `Gesture.prep` and know that the hand must arrive *on* the beat.
 * - **An effector you stop commanding goes home.** Miss a frame and nothing
 *   snaps; the limb eases back to its rest position. That is the third layer of
 *   §8.11's priority stack — play, groove, idle — implemented as "the absence
 *   of a command".
 * - **Groove moves the body, never the placement.** `setSway` and `setHeadNod`
 *   move the torso, the head and everything resting. A hand you placed on a
 *   snare stays on the snare, because the snare did not sway.
 * - **The face reads the same numbers the voice does.** `setMouth` takes the
 *   three continuous parameters `Viseme` carries and applies them unfiltered.
 *
 * ## Determinism
 *
 * Every choice this file makes that `Look` does not already make — iris colour,
 * blink schedule, breath phase, the arrangement of a head of curls, which way a
 * bored player glances — comes from `new Rng(performer.id + tag)`. Not one call
 * to `Math.random`, so two shows from one seed have the same faces down to the
 * blink.
 */

import {
  Group, Matrix4, Mesh, Object3D, Quaternion, Vector3,
} from 'three';

import { ARCHETYPES } from '../../concert/instruments.js';
import type { Effector, Performer } from '../../concert/types.js';
import { Rng } from '../../core/rng.js';

import {
  Leases, ball, pill, quad, shade, skinSurface, splatSurface, surface,
} from './performer-assets.js';
import { buildAccessories } from './performer-accessories.js';
import { buildArms, type ArmsRig } from './performer-arms.js';
import { buildFace, type FaceRig } from './performer-face.js';
import { buildHair } from './performer-hair.js';
import {
  DEFAULT_HAND_POSES, HAND_POSES, IMPLEMENT_OF, blendPoses, buildHand,
  type HandBias, type HandPose, type HandPoseId, type HandRig,
} from './performer-hands.js';
import { buildLegs, type LegsRig } from './performer-legs.js';
import {
  MIN_HAND_GAP, SIDE, dressTorso, proportions,
  restLocals, type BodySide, type Proportions,
} from './performer-look.js';

// The runtime should be able to import everything it needs from one module.
export { DEFAULT_HAND_POSES, HAND_POSES, blendPoses } from './performer-hands.js';
export type { HandPose, HandPoseId } from './performer-hands.js';
export type { BodySide, Proportions } from './performer-look.js';

/**
 * Things a face does that are not singing and not groove.
 *
 * `glare` earns its place from §8.9: the band's patience has to be *legible*,
 * and the bandleader looking at whoever threw the tomato is the first tell.
 */
export type PerformerReaction = 'hit' | 'wince' | 'grin' | 'glare' | 'surprise';

export interface PerformerStats {
  /** Every `Object3D` under `root`, inclusive. Draw-call upper bound. */
  objects: number;
  /** Triangles drawn per frame, shared geometry counted once per mesh. */
  triangles: number;
  /** Meshes that cast into the shadow map — the second pass over the scene. */
  shadowCasters: number;
}

export interface PerformerRig {
  readonly performer: Performer;
  /**
   * Everything the rig owns. The caller positions this at the `Station`:
   * `root.position.set(x, y + riser, z)` and `root.rotation.y = facing`, which
   * makes local `+z` the performer's forward exactly as the contract defines
   * it. The rig never moves `root` itself.
   */
  readonly root: Group;
  /** Metres, derived from `Look` and the posture. Useful for camera framing. */
  readonly proportions: Proportions;

  /**
   * Put an effector at a world-space point, now.
   *
   * Absolute and unsmoothed: whatever you pass is where the part is this frame.
   * The arc into a strike and the follow-through out of it are yours, because
   * only you know `Gesture.prep`.
   *
   * `normal` is the instrument's surface normal — `Contact.normal`, pointing
   * *away* from the instrument. Given one, a hand turns so its palm faces into
   * the surface and its fingers lie along the body's forward, which is what
   * lets one code path serve a snare struck from above and a fretboard
   * approached from the side. Given none, the part keeps its resting attitude.
   *
   * The point is the **contact**, not the centre of the part: the rig backs the
   * palm off along the normal by its own thickness, so a hand sent to a drum
   * head sits on the head rather than inside it.
   *
   * Effectors that are not limbs:
   *   - `bow` is the right hand. A bow hold is a hand pose, not a seventh limb.
   *   - `head` places the head centre, clamped to 1.3 head radii of its rest —
   *     `a head's radius` here until the clamp was widened.
   *   - `mouth` moves the head so the *mouth* lands on the point — a singer
   *     leaning into a microphone. Mouth *shape* is `setMouth`.
   *   - `body` leans the whole torso toward the point, clamped to 0.22 m. This
   *     is `GrooveKind.lean`.
   */
  setEffector(e: Effector, position: Vector3, normal?: Vector3, along?: Vector3): void;

  /**
   * Where an effector goes when nothing is asking it to be anywhere: the
   * runtime's idle target, in **world space**.
   *
   * This is the body's own idle, and deliberately not the instrument's. Ask the
   * instrument model for `resolve({ kind: 'rest' })` first — a guitarist's
   * hands belong on the guitar and only the guitar knows where that is — and
   * fall back to this when the model returns `undefined` or there is no
   * instrument at all. What it gives is a person standing there plausibly:
   * hands by the hips, feet under the body, head level, and for a seated player
   * the hands out over the lap instead.
   *
   * It is **live**: the sway, the nod and the breath from the last `update` are
   * already in it, so an idle limb rides the groove for free. Feet ride it only
   * slightly, because feet are on the floor.
   *
   * Pass `out` to avoid an allocation; the same vector is returned.
   */
  restPosition(e: Effector, out?: Vector3): Vector3;

  /**
   * Move a contact meant for *both* hands onto this hand's own side.
   *
   * Several models — the kit, every horn, a microphone stand — answer
   * `resolve({ kind: 'rest' })` with a single point, because from their side
   * there is only one interesting place for a hand to be. Sending both hands
   * there puts one inside the other: the fingers of the left hand come out of
   * the back of the right, which is invisible in a still and unmissable the
   * moment anything moves. It is what the drummer was doing.
   *
   * Given a world point and a hand — `left-hand`, `right-hand` or `bow` — this
   * returns that point moved along the **performer's own lateral axis** onto
   * that hand's side, and staggered slightly in depth so the pair does not read
   * as two hands abreast. The offsets are half of `MIN_HAND_GAP × handR` each
   * way, so two hands given the same input come back at least a hand's width
   * and a bit apart, guaranteed rather than hoped for. Any other effector is
   * copied through untouched.
   *
   * Idle only. A *gesture's* contact is the model's word and must never be
   * nudged — a stick moved five centimetres off the snare is a stick that
   * misses it.
   *
   * Pass `out` to avoid an allocation; the same vector is returned.
   */
  separateRest(e: Effector, shared: Vector3, out?: Vector3): Vector3;

  /**
   * Carry something. The object is parented to the torso and moves with it.
   *
   * A saxophone is not furniture. It hangs off the player, so when they sway,
   * nod or lean into a phrase, it goes with them — and if it does not, the
   * player slides through their own instrument, which is what happened before
   * this existed. Floor-standing instruments (a kit, a piano, an upright bass)
   * must NOT use this: they stay where they were put and the player moves
   * against them, which is equally true and the opposite behaviour.
   *
   * Local `(0, 0, 0)` is the hip, not the feet — the torso's own origin. The
   * caller positions the instrument from there.
   */
  carry(object: Object3D): void;

  /**
   * Shape one hand. `weight` blends from the archetype's default pose toward
   * the named one, so `setHandPose('left', 'fist', 0.5)` is a real request and
   * not a rounding error. The hand eases over about 85 ms rather than snapping.
   *
   * The defaults are already applied at build time from `Performer.archetype` —
   * a guitarist starts with a spread left hand and a picking right — so a
   * runtime that never calls this still gets hands with character.
   */
  setHandPose(side: BodySide, pose: HandPoseId, weight?: number): void;

  /**
   * Finger one hand: how far each finger is down, index to little, 0..1.
   * `undefined` — and the middle of the range, per finger — means the pose
   * decides, which is what every hand that is not on a wind instrument says.
   *
   * A second call rather than a wider `setHandPose`, because it is a second
   * fact on a second clock. A saxophonist's hand keeps one shape all night and
   * changes its fingering on every note; folding the two together would put a
   * vocabulary of named shapes in the position of having to name every
   * fingering of every instrument. The numbers come from `Contact.fingers`, so
   * the instrument that closes the pads is the same one that moves the fingers.
   */
  setHandFingers(side: BodySide, close: ArrayLike<number> | undefined): void;

  /** Jaw opening, lip rounding, lip spreading, each 0..1, straight off `Viseme`. */
  setMouth(open: number, round: number, spread: number): void;

  /**
   * Body sway. `amount` 0..1 scales it; `phase` is in radians and the rig only
   * ever takes its sine, so the period belongs entirely to the caller — a
   * humppa felt in fast two and a ballad felt in slow half-notes are the same
   * call with a different phase rate.
   */
  setSway(amount: number, phase: number): void;

  /** As `setSway`, for the head. Omit `phase` to nod on the sway's phase. */
  setHeadNod(amount: number, phase?: number): void;

  /** `GrooveKind.eyes-shut`. 0 open, 1 shut. Blinks still land on top. */
  setEyesClosed(amount: number): void;

  /**
   * Look at a world point — the soloist, the audience, this player's own hands.
   * `undefined` returns the gaze to level and lets it wander on a seeded idle
   * schedule. The head turns late and the eyes lead it, because a head that
   * tracks exactly reads as a servo.
   */
  lookAt(target: Vector3 | undefined): void;

  /** A face, briefly. See `PerformerReaction`. `strength` is 0..1, default 1. */
  react(kind: PerformerReaction, strength?: number): void;

  /**
   * A tomato landed here. Leaves a mark on the nearest body part that persists
   * until `clearSplats`, and flinches. Capped per performer; the oldest mark is
   * recycled rather than a new quad allocated.
   *
   * `markRadius` is how far the pulp spread, in metres — the thrower's side
   * knows the closing speed and this side does not, and a mark that is the
   * same size however hard the thing arrived is the flattest part of a hit.
   * Omit it and the mark is sized from the part it landed on, as before. It is
   * clamped against that part either way.
   */
  splat(worldPosition: Vector3, markRadius?: number): void;

  /** Struck between numbers. The stage keeps its scars only for the number. */
  clearSplats(): void;

  /** Whether this player is currently sounding. Drives effort and breath. */
  setPlaying(playing: boolean): void;

  /**
   * `now` is **seconds** on the show clock and must be monotonic; `dt` is the
   * frame delta in seconds and is clamped internally, so a backgrounded tab
   * does not teleport a limb. The rig keeps no clock of its own — blink and
   * breath schedules are functions of `now`.
   *
   * Call it once per frame, after the frame's `setEffector` calls.
   */
  update(now: number, dt: number): void;

  /** Object and triangle counts, live. For budgets and tests. */
  measure(): PerformerStats;

  /** Detach from the scene and give every shared geometry and material back. */
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Scratch. Allocating vectors in a per-frame, per-performer path is the
// cheapest way to hand the garbage collector a stutter every few seconds.
// ---------------------------------------------------------------------------

const V1 = new Vector3();
const V2 = new Vector3();
const V3 = new Vector3();
const V4 = new Vector3();
const V5 = new Vector3();
const V6 = new Vector3();
const Q1 = new Quaternion();
const M1 = new Matrix4();
const UP = new Vector3(0, 1, 0);
const FWD = new Vector3(0, 0, 1);

/** Effectors that are actually parts you can move. */
type Limb = 'left-hand' | 'right-hand' | 'left-foot' | 'right-foot' | 'head';

interface Placed {
  node: Object3D;
  /** Posture rest, in the local frame, before sway. */
  rest: Vector3;
  restQuat: Quaternion;
  /** Distance from the contact point back to the node's origin, along the normal. */
  standoff: number;
  /** How much of the body's sway this part rides. Feet are on the floor. */
  follow: number;
  /**
   * The part's own swing about that share, and how fast it is moving.
   *
   * A hanging limb is a pendulum on a moving pivot, not a bracket welded to one.
   * See `liveRest`, which owns the spring these two hold the state for.
   */
  swing: Vector3;
  swingRate: Vector3;
  /**
   * Whether this part is bolted to the torso rather than merely near it.
   *
   * The head is, and nothing else is. A head does not *follow* a body, it is
   * *carried* by one: when the torso pitches into a reaction or folds under a
   * settle, the neck goes with it in the same frame, at the same angle. Parts
   * that are only *near* the torso — a hand by the hip, a foot on the boards —
   * take a share of the sway offset instead and none of the rotation.
   *
   * See `liveRest`. The failure this names is specific: with the head merely
   * chasing a moving rest it lagged the body by its own time constant, which
   * read as a head on a rubber band, and on a wind player — whose horn is
   * parented to the torso and therefore moves with it exactly — it slid the
   * mouthpiece around the lips for the whole number.
   */
  onTorso: boolean;
  /**
   * Where this part is relative to its live rest, decayed rather than chased.
   *
   * The distinction is the whole of the rubber-band fix. Easing a part's
   * *absolute* position toward its rest means that whenever the rest itself
   * moves — every frame, for a body that sways and breathes — the part is
   * permanently one time constant behind it. Easing the *offset* to zero
   * instead leaves rest changes to arrive immediately and decays only the
   * residue of the last command, which is the thing that actually wanted
   * easing. The handover is still continuous: the offset is written every
   * commanded frame, so releasing a limb starts the decay from exactly where
   * that limb was.
   */
  offset: Vector3;
  /**
   * Whether placing this part also sets its rotation.
   *
   * False for the head, whose attitude belongs to `lookAt` and the nod. Without
   * this the two write the same quaternion in the same frame and the gaze is
   * quietly damped back to centre — a bug that looks exactly like "the head
   * tracking is too weak" and is nothing of the sort.
   */
  orientable: boolean;
  /** Seconds to fall back to rest once the runtime stops commanding it. */
  tau: number;
  commanded: boolean;
  pos: Vector3;
  quat: Quaternion;
}

/** A place a tomato can land on a body, in that part's own frame. */
interface TargetPart {
  node: Object3D;
  centre: Vector3;
  radius: number;
}

interface Splat {
  mesh: Mesh;
  /** Where the mark started and which way it runs, in the host node's frame. */
  from: Vector3;
  down: Vector3;
  born: number;
}

const MAX_SPLATS = 8;

/** How long each reaction runs, in seconds. */
const REACTION_SECONDS: Record<PerformerReaction, number> = {
  hit: 1.6, wince: 0.6, grin: 1.2, glare: 2.6, surprise: 0.9,
};

/**
 * How far a player with a mouthpiece on their lips turns, and where the turn
 * comes from.
 *
 * A horn is carried by the torso and its mouthpiece is placed at *this*
 * player's mouth — see `instruments/mouth.ts`, which derives the height from
 * the same arithmetic `proportions()` uses. That agreement holds only while the
 * head is square to the chest. A neck turn of 1.2 rad swings the lips about
 * 12 cm sideways off a mouthpiece that stayed where it was, and a trumpeter
 * watching the soloist ends up blowing past their own horn.
 *
 * So the turn comes from the waist instead. The torso carries the instrument
 * and the contacts the hands are placed on, and the head rides the torso, so
 * everything that has to stay together does: the lips travel with the
 * mouthpiece and the fingers travel with the keys, all from one angle.
 *
 * A waist is not a neck, though, and 69° of it is a dance move. `TURN` is what
 * a player will actually swivel to watch someone; the rest of the angle is done
 * with the eyes, which `trackGaze` already hands whatever the head did not
 * cover. `IDLE_TURN` is the same limit for the aimless glances between
 * targets, and it is much smaller — a head that wanders 17° costs a neck
 * nothing and would have the whole front line rotating on the spot.
 */
const MOUTHPIECE_TURN = 0.55;
const MOUTHPIECE_IDLE_TURN = 0.10;

/** The idle wander for anyone else: a neck, doing what a neck does. */
const IDLE_TURN = 0.30;

/**
 * How hard a player's *part* makes them concentrate, as opposed to how hard it
 * makes them work.
 *
 * `effort` is exertion, and the face has spent it on one thing: the cheeks of
 * somebody blowing. A cellist has no cheeks to puff and got 0.16 of a furrow
 * out of it, which is a person thinking about nothing in particular — while
 * carrying the tune on a fretless fingerboard, where every note is an intonation
 * decision and the bow arm is a second one. That is the most visibly
 * concentrated job on the stage and it had the blankest face on the stage.
 *
 * So the brow takes a share of the effort, and how big a share is a property of
 * the part: `FOCUS_BROW` for a bowed player on a line of their own, `IDLE_BROW`
 * for everybody else, including the same cellist when they are sitting under
 * the arrangement holding whole notes. A furrow that never lifts is a scowl,
 * not concentration — it has to be the difference between two passages for an
 * audience to read it as either.
 *
 * The squint is small on purpose. Eyes are the one part of this face with no
 * detail to lose, and past about a fifth shut a focused player looks tired.
 */
const IDLE_BROW = 0.22;
const FOCUS_BROW = 0.85;
const FOCUS_SQUINT = 0.18;

/**
 * The parts that count as a line of one's own.
 *
 * `melody` is the tune and `counter` is the other tune; both are single lines
 * with somewhere to go, which is what makes a player follow them. A bowed part
 * on `bass` or `pad` is sustain underneath somebody else's phrase and wants the
 * ordinary face.
 */
const LEAD_LAYERS: ReadonlySet<string> = new Set(['melody', 'counter']);

/**
 * How far a player turns their chest toward their own hands, and how fast.
 *
 * `TWIST_SHARE` is the fraction of the angle to the hands that the waist takes;
 * `TWIST_LIMIT` caps it at about 17°, which is a stance rather than a swivel.
 * A drummer working two voices on their left is the case that asked for it, and
 * the reason it is a *body* number rather than a drummer's is that it is true of
 * everyone: nobody plays square-on to something off to one side. See
 * `twistToHands`, which owns the argument and the stability of it.
 */
/**
 * The spring an idle limb hangs on: stiffness and drag, per second.
 *
 * Tuned as a pendulum rather than as a filter. `sqrt(SPRING)` is the natural
 * frequency — 6.6 rad/s, a shade over one swing a second, which is what half a
 * metre of arm does — and the drag is a little under half of critical, so a limb
 * arrives after the body that moved it and goes a little past it. Both of those
 * are the point: a limb that tracked the body exactly is the rigid version, and
 * the whole reason this exists is that the rigid version does not bend an elbow.
 *
 * Measured on a standing player at a strong sway: the hips travel 73 mm and the
 * idle hand 82 mm, 100 mm of which is *relative* to the hips — so the elbow
 * opens and closes by three centimetres over the bar rather than not at all.
 * Damped much less than this and a groove at the arm's own frequency, which a
 * groove usually is, swings the hands like a rag doll's.
 */
const SWING_SPRING = 44;
const SWING_DRAG = 5.6;

const TWIST_SHARE = 0.38;
const TWIST_LIMIT = 0.30;
const TWIST_TAU = 0.28;

/**
 * What a reaction adds to the frame.
 *
 * Additive rather than authoritative, so a reaction never *replaces* the
 * groove or the viseme track — the two are composed in `update`, which is the
 * only place that has both. A singer hit by a tomato mid-word grimaces over
 * the word and then goes back to it.
 */
interface Bias {
  torsoPitch: number;
  headPush: number;
  headPitch: number;
  eyesClosed: number;
  browRaise: number;
  browFurrow: number;
  mouthOpen: number;
  mouthRound: number;
  mouthSpread: number;
}

// ---------------------------------------------------------------------------

export function buildPerformer(performer: Performer): PerformerRig {
  return new Rig(performer);
}

class Rig implements PerformerRig {
  readonly performer: Performer;
  readonly root = new Group();
  readonly proportions: Proportions;

  private readonly leases = new Leases();
  private readonly rng: Rng;
  private readonly face: FaceRig;
  private readonly hands: Record<BodySide, HandRig>;
  private readonly handDefaults: Record<BodySide, HandPose>;
  private readonly torso = new Group();
  private readonly torsoBody: Mesh;
  private readonly torsoBase = new Vector3();
  /**
   * The inverse of the torso's *resting* attitude — the posture's own lean.
   *
   * Half of `ride`. A part measured in the root's frame at the resting lean is
   * turned back into a torso-local point by this, and then forward again by
   * whatever the torso is doing now. Held inverted because that is the
   * direction it is always used in.
   */
  private readonly torsoRestInv = new Quaternion();
  private readonly head = new Group();
  private readonly legs: LegsRig;
  private readonly arms: ArmsRig;
  private readonly placed = new Map<Limb, Placed>();
  private readonly restLocal: Record<string, Vector3>;
  private readonly blown: boolean;
  /**
   * Whether this player has an instrument against their lips.
   *
   * Not the same as `blown`, and the difference is the singer: they are blown —
   * they breathe, they run out of air — and they hold nothing, so their head is
   * free to turn wherever the song wants it. Every other blown archetype in the
   * table carries the thing it blows into. See `MOUTHPIECE_TURN`.
   */
  private readonly mouthpiece: boolean;
  /**
   * How much of this player's work shows on their face. See `FOCUS_BROW`.
   *
   * A constant for the life of the rig, because a performer plays one part.
   */
  private readonly browShare: number;
  private readonly squint: number;
  /**
   * How much of the groove's sway this player's *hips* are allowed to take.
   *
   * One for a player on their feet, who shifts their weight from one to the
   * other and whose hips go with it. A quarter of that for anyone on a bench or
   * a throne, because the part of them in contact with it is the part that
   * cannot go anywhere: a seated player swaying by translation slides across the
   * seat, and a drummer sliding around their throne in time with their own hi-hat
   * is the most distracting thing on the stage. What the hips give up the spine
   * takes back as roll — see `update`.
   */
  private readonly shift: number;
  /** The minimum distance between two resting hands, in metres. */
  private readonly handGap: number;
  /**
   * Whether each hand is being placed on something this frame.
   *
   * Written where `handHeld` is and read by the arms, which use it to decide how
   * much of a hand's technique its elbow owes — see `ArmAnchors.working`. A
   * live object handed over once rather than a call per arm per frame.
   */
  private readonly handWorking: Record<BodySide, boolean> = { left: false, right: false };

  // Groove and pose state.
  private swayAmount = 0;
  private swayPhase = 0;
  private nodAmount = 0;
  private nodPhase = 0;
  private eyesClosed = 0;
  private mouthOpen = 0;
  private mouthRound = 0;
  private mouthSpread = 0;
  private playing = false;
  private effort = 0;
  /** The waist's turn toward the hands, radians. See `twistToHands`. */
  private twist = 0;
  private readonly bodyOffset = new Vector3();
  private readonly bodyCommand = new Vector3();
  private bodyCommanded = false;
  private readonly breathPhase: number;
  private readonly swayBias: number;

  // Gaze.
  private target: Vector3 | undefined;
  private headYaw = 0;
  private headPitch = 0;
  private idleYaw = 0;
  private idlePitch = 0;
  private nextGlance: number;

  // Reactions.
  private reaction: PerformerReaction | undefined;
  private reactionStrength = 1;
  private reactionStart = 0;

  // Splats.
  private readonly splats: Splat[] = [];
  private splatNext = 0;
  /** What a tomato can land on. Fixed for the life of the rig; see `nearestPart`. */
  private readonly parts: TargetPart[];

  // Weight. See `settleUnder`.
  private settle = 0;
  private readonly handY: [number, number] = [0, 0];
  private readonly handRate: [number, number] = [0, 0];
  private readonly handHeld: [boolean, boolean] = [false, false];

  // World transform cache.
  private readonly world = new Matrix4();
  private readonly worldInv = new Matrix4();
  private readonly worldQuat = new Quaternion();
  private readonly worldQuatInv = new Quaternion();

  constructor(performer: Performer) {
    this.performer = performer;
    const look = performer.look;
    const posture = performer.station.posture;
    const spec = ARCHETYPES[performer.archetype];
    this.blown = spec.blown === true;
    this.mouthpiece = this.blown && spec.held;
    const focused = spec.family === 'bowed' && LEAD_LAYERS.has(performer.layer);
    this.browShare = focused ? FOCUS_BROW : IDLE_BROW;
    this.squint = focused ? FOCUS_SQUINT : 0;

    this.rng = new Rng(`${performer.id}#rig`);
    const faceRng = new Rng(`${performer.id}#face`);
    const hairRng = new Rng(`${performer.id}#hair`);
    // Its own stream. Drawing the rest asymmetries from `this.rng` would shift
    // every draw after them and silently re-roll the breath phase, the glance
    // schedule and the sway bias of every performer already on stage.
    const restRng = new Rng(`${performer.id}#rest`);
    const handRng = new Rng(`${performer.id}#hands`);

    const p = proportions(look, posture);
    this.proportions = p;
    this.handGap = p.handR * MIN_HAND_GAP;
    // A body that is off its feet cannot shift its weight, whether the seat is a
    // bench or the boards. `p.seated` rather than `p.seatY > 0`, which called a
    // cross-legged player a standing one — see `Proportions.seatY`.
    this.shift = p.seated ? 0.25 : 1;
    this.restLocal = restLocals(p, posture, restRng);

    this.breathPhase = this.rng.float(0, Math.PI * 2);
    this.swayBias = this.rng.float(-0.12, 0.12);
    this.nextGlance = this.rng.float(0.5, 3);
    this.idleYaw = this.rng.float(-0.12, 0.12);

    this.root.name = `performer:${performer.id}`;

    // --- torso ------------------------------------------------------------
    this.torsoBase.set(0, p.hipY, 0);
    this.torso.position.copy(this.torsoBase);
    this.torso.rotation.x = p.lean;
    // Captured here, while the torso is at exactly its resting attitude and
    // nothing has moved it yet. Everything `liveRest` does is measured against
    // this, so it has to be the posture's lean and nothing else.
    this.torsoRestInv.copy(this.torso.quaternion).invert();
    this.root.add(this.torso);
    this.torsoBody = dressTorso(this.torso, look, p, this.leases);

    // --- head -------------------------------------------------------------
    this.head.name = 'head';
    this.head.position.copy(p.head);
    this.root.add(this.head);
    const skin = skinSurface(this.leases, look.skin);
    const skull = new Mesh(ball(this.leases), skin);
    skull.scale.set(p.headR * 2, p.headR * 2.10, p.headR * 1.90);
    skull.castShadow = true;
    this.head.add(skull);

    this.face = buildFace(this.head, p.headR, look.skin, this.blown, this.leases, faceRng);
    // Hair first, and the order is now load-bearing rather than incidental: a
    // hat has to be told what it is going on top of, and the only thing that
    // knows is the hair that was just built. See `HairProfile`.
    const hair = buildHair(this.head, look, p, this.leases, hairRng);
    buildAccessories(
      { head: this.head, torso: this.torso, neckY: p.torsoH * 0.99 },
      look, p, this.leases, hair,
    );

    // --- hands ------------------------------------------------------------
    const cuff = shade(look.outfit.jacket, -0.04);
    // A drummer and a vibraphonist arrive holding something, and the thing they
    // hold is what meets the instrument — see `HeldImplement`. Nothing else in
    // the rig has to know: the hand reports its own contact point and the stick
    // is simply further out than a fingertip.
    const held = IMPLEMENT_OF[performer.archetype];
    this.hands = {
      left: buildHand('left', p, skin, cuff, this.leases, handBias(handRng), held),
      right: buildHand('right', p, skin, cuff, this.leases, handBias(handRng), held),
    };
    const defaults = DEFAULT_HAND_POSES[performer.archetype];
    this.handDefaults = {
      left: HAND_POSES[defaults.left],
      right: HAND_POSES[defaults.right],
    };
    this.hands.left.snapPose(this.handDefaults.left);
    this.hands.right.snapPose(this.handDefaults.right);
    this.root.add(this.hands.left.group, this.hands.right.group);

    // --- feet -------------------------------------------------------------
    const shoe = surface(this.leases, shade(look.outfit.trousers, -0.24), { roughness: 0.65 });
    const feet: Record<BodySide, Group> = { left: new Group(), right: new Group() };
    for (const side of ['left', 'right'] as const) {
      feet[side].name = `${side}-foot`;
      const mesh = new Mesh(pill(this.leases), shoe);
      mesh.rotation.x = Math.PI / 2;
      mesh.scale.set(p.footW, p.footL * 0.5, p.footH);
      mesh.position.z = p.footL * 0.12;
      mesh.castShadow = true;
      feet[side].add(mesh);
      this.root.add(feet[side]);
    }

    // --- legs -------------------------------------------------------------
    // After the feet, and reading them: the legs have no state of their own and
    // exist entirely as a function of where the hips and the ankles are.
    this.legs = buildLegs(this.root, { torso: this.torso, feet }, p, look, this.leases);

    // --- arms ---------------------------------------------------------------
    // Downstream of the hands exactly as the legs are downstream of the feet:
    // nothing in here places a hand, and an arm is whatever is left between a
    // shoulder and wherever the hand went. It owns the shoulder, because that
    // point is now a joint on a drawn limb rather than a landmark this file
    // measures an imaginary forearm from.
    this.arms = buildArms(
      this.root,
      { torso: this.torso, hands: this.hands, working: this.handWorking },
      p, look, this.leases,
    );

    // --- effectors --------------------------------------------------------
    // `standoff` is what stops a hand sinking into a drum head: the point the
    // instrument returned is the surface, and the palm's centre is half a palm
    // back along the normal from it.
    //
    // The hands' standoff is zero, and that is not an omission: a hand knows
    // where it touches better than this table does, and says so through
    // `HandRig.touchPoint` — which already carries the half-palm this used to
    // add, plus the finger length it never did. See `setEffector`.
    this.register('left-hand', this.hands.left.group, 0, 1, 0.16, true);
    this.register('right-hand', this.hands.right.group, 0, 1, 0.16, true);
    this.register('left-foot', feet.left, p.footH * 0.5, 0.15, 0.22, true);
    this.register('right-foot', feet.right, p.footH * 0.5, 0.15, 0.22, true);
    // The one part carried by the torso rather than merely near it.
    this.register('head', this.head, p.headR * 0.5, 1, 0.20, false, true);

    // `register` is what actually puts the feet and the hands at their rest
    // positions, so the fit both limb rigs did on parts still at the origin is
    // stale by one step. Re-fit before anyone can measure or draw this rig.
    this.legs.update();
    this.arms.update(0);
    this.handY[0] = this.hands.left.group.position.y;
    this.handY[1] = this.hands.right.group.position.y;

    // What a tomato can land on. See `nearestPart` for why the legs are not in
    // it, and for why this is built here rather than per hit.
    this.parts = [
      { node: this.head, centre: new Vector3(0, 0, 0), radius: p.headR * 1.06 },
      {
        node: this.torso,
        centre: new Vector3(0, p.torsoH * 0.58, 0),
        radius: Math.max(p.torsoW, p.torsoH) * 0.46,
      },
      { node: this.hands.left.group, centre: new Vector3(), radius: p.handR * 1.2 },
      { node: this.hands.right.group, centre: new Vector3(), radius: p.handR * 1.2 },
    ];

    this.syncWorld();
  }

  private register(
    limb: Limb, node: Object3D, standoff: number, follow: number,
    tau: number, orientable: boolean, onTorso = false,
  ): void {
    const rest = (this.restLocal[limb] ?? new Vector3()).clone();
    node.position.copy(rest);
    this.placed.set(limb, {
      node, rest, restQuat: node.quaternion.clone(), standoff, follow, tau, orientable,
      onTorso, offset: new Vector3(), swing: new Vector3(), swingRate: new Vector3(),
      commanded: false, pos: rest.clone(), quat: node.quaternion.clone(),
    });
  }

  /**
   * Where a part's rest is *this frame*, in the root's frame.
   *
   * Two kinds of part and two answers. Something merely near the torso takes a
   * share of the sway offset and none of the rotation — a hand by the hip does
   * not tip when the chest folds. The head is *carried*: it is taken back into
   * the torso's own frame through the resting lean, and brought out again
   * through whatever the torso is doing now, so a pitch, a roll and a sway all
   * reach it in the same frame they reach the shoulders. `follow` is not
   * consulted for a carried part, because "how much of it do you ride" is not
   * a question a neck gets to answer.
   *
   * ## An idle hand does not ride the body. It hangs off it
   *
   * The share used to be applied straight, and straight is rigid: a resting hand
   * moved exactly as far as the chest did, exactly when the chest did, so the
   * whole arm translated as one piece and nothing in it ever bent. A band
   * grooving that way reads as a rank of statues on a moving floor — and it
   * reads *worse* now than it did before there were arms, because an arm is what
   * the eye expects to see swing.
   *
   * So the share is a target and the part chases it on a spring. An arm is a
   * pendulum about half a metre long, which is a shade under one swing a second;
   * a body's groove is one or two. Below its own resonance a pendulum follows
   * late and a little further than its pivot went, which is exactly what a
   * hanging hand does and exactly what `SWING_*` is tuned to: the hand arrives
   * after the hip and overshoots it, the elbow bends because the two ends
   * disagree, and the arm is doing something rather than being carried.
   *
   * The spring is per part and lives in `Placed`, so it costs two vectors a limb
   * and runs whether the part is commanded or not — a hand that was placed and
   * then let go finds its rest already in motion instead of stepping into it.
   */
  private liveRest(st: Placed, out: Vector3, step: number): Vector3 {
    if (st.onTorso) {
      return out.copy(st.rest).sub(this.torsoBase)
        .applyQuaternion(this.torsoRestInv)
        .applyQuaternion(this.torso.quaternion)
        .add(this.torso.position);
    }
    // Target, then one semi-implicit Euler step of a damped spring toward it.
    // Semi-implicit rather than explicit because it is unconditionally stable at
    // the frame rates a backgrounded tab hands back, and this runs on a limb
    // that must not be able to fling itself off stage.
    V6.copy(this.bodyOffset).multiplyScalar(st.follow);
    V6.sub(st.swing).multiplyScalar(SWING_SPRING * step);
    st.swingRate.addScaledVector(V6, 1).multiplyScalar(Math.max(0, 1 - SWING_DRAG * step));
    st.swing.addScaledVector(st.swingRate, step);
    return out.copy(st.rest).add(st.swing);
  }

  // -- transforms ---------------------------------------------------------

  private syncWorld(): void {
    this.root.updateWorldMatrix(true, false);
    if (!this.world.equals(this.root.matrixWorld)) {
      this.world.copy(this.root.matrixWorld);
      this.worldInv.copy(this.world).invert();
      this.root.getWorldQuaternion(this.worldQuat);
      this.worldQuatInv.copy(this.worldQuat).invert();
    }
  }

  private toLocal(v: Vector3, out: Vector3): Vector3 {
    this.syncWorld();
    return out.copy(v).applyMatrix4(this.worldInv);
  }

  private dirToLocal(v: Vector3, out: Vector3): Vector3 {
    this.syncWorld();
    return out.copy(v).applyQuaternion(this.worldQuatInv).normalize();
  }

  // -- placement ----------------------------------------------------------

  setEffector(e: Effector, position: Vector3, normal?: Vector3, along?: Vector3): void {
    if (!finite(position)) return;
    const local = this.toLocal(position, V1);

    if (e === 'body') {
      const chest = this.restLocal['body'];
      if (!chest) return;
      this.bodyCommand.copy(local).sub(chest).clampLength(0, 0.22);
      this.bodyCommanded = true;
      return;
    }
    if (e === 'mouth' || e === 'head') {
      const st = this.placed.get('head');
      if (!st) return;
      if (e === 'mouth') {
        // Move the head so the mouth, not its centre, reaches the point.
        const mouth = this.restLocal['mouth'];
        const head = this.restLocal['head'];
        if (mouth && head) local.add(V2.copy(head).sub(mouth));
      }
      st.pos.copy(local).sub(st.rest).clampLength(0, this.proportions.headR * 1.3).add(st.rest);
      st.commanded = true;
      return;
    }

    const limb: Limb | undefined =
      e === 'bow' ? 'right-hand'
        : e === 'left-hand' || e === 'right-hand'
          || e === 'left-foot' || e === 'right-foot' ? e : undefined;
    if (!limb) return;
    const st = this.placed.get(limb);
    if (!st) return;

    st.commanded = true;
    st.pos.copy(local);
    if (normal && finite(normal) && normal.lengthSq() > 1e-8) {
      const n = this.dirToLocal(normal, V2);
      st.pos.addScaledVector(n, st.standoff);
      st.quat.copy(orientTo(n, along ? this.dirToLocal(along, V3) : undefined));
    } else {
      st.quat.copy(st.restQuat);
    }

    /**
     * A hand is placed by the part of it that touches, not by its origin.
     *
     * `standoff` can only back a part off along the surface normal, which is
     * the whole answer for a foot on a pedal and half an answer for a hand:
     * the other half is *along the fingers*, and it is the bigger half. The
     * hand knows where its own contact is for the shape it is in — see
     * `HandPose.touch` — so the placement is the contact less that point,
     * turned into the root's frame by the attitude just chosen. A closed hand
     * reports the same half-palm the old `standoff` did, so nothing holding an
     * implement moves; an open one reports a fingertip, and a pianist's
     * fingers land on the keys their palm used to be lying across.
     */
    const hand: BodySide | undefined =
      limb === 'left-hand' ? 'left' : limb === 'right-hand' ? 'right' : undefined;
    if (hand) st.pos.sub(V4.copy(this.hands[hand].touchPoint).applyQuaternion(st.quat));
  }

  carry(object: Object3D): void {
    this.torso.add(object);
  }

  restPosition(e: Effector, out?: Vector3): Vector3 {
    const v = out ?? new Vector3();
    /**
     * Two aliases, and they are the same idea twice: an effector that drives a
     * body part the table already has a rest for, in a different way.
     *
     * `bow` is the right hand holding something. `eyes` is **gaze only** — the
     * type doc says it exists so that "eyes closed while the head still nods"
     * is sayable, after `eyes-shut` and `watch` had to claim `head` and fought
     * `head-nod` for it — so where a pair of eyes rests is where the head
     * rests. Routing it onto `head` also puts it in the torso-carried branch
     * below, which is what it wants for the reason stated there: a bandmate
     * watching this player should look at where the head *is*.
     *
     * `eyes` reached the fallback until this line, and the fallback hands back
     * the hip. It was found by a sweep rather than by a wrong-looking frame,
     * because **nothing declares an `eyes` behaviour yet** — the member is in
     * `EFFECTORS` and `SLOT_OF` in `animate.ts` and in no score. So this is the
     * quietest possible kind of fault: correct today, wrong on the first day
     * somebody writes the gesture the union member was added for.
     */
    const limb: string = e === 'bow' ? 'right-hand' : e === 'eyes' ? 'head' : e;
    const rest = this.restLocal[limb];
    if (!rest) {
      // Unreachable, and now genuinely so: `restLocals` answers seven keys and
      // the two aliases above cover the other two members of `Effector`. This
      // is the branch that catches a contract change rather than guessing at
      // one — a tenth effector lands here rather than anywhere surprising.
      v.set(0, this.proportions.hipY, 0);
    } else if (limb === 'head' || limb === 'mouth') {
      // Carried by the torso, exactly as `liveRest` carries the head node, so
      // that a bandmate watching this player looks at where the head *is* and
      // not at where it would have been if the chest had never moved.
      //
      // `body` is deliberately not in here — see below.
      v.copy(rest).sub(this.torsoBase)
        .applyQuaternion(this.torsoRestInv)
        .applyQuaternion(this.torso.quaternion)
        .add(this.torso.position);
    } else {
      /**
       * How much of the chest's own movement this answer carries, and for the
       * chest the answer is **none of it**.
       *
       * `setEffector('body')` measures its command as the distance from the
       * chest's *rest* to the point it is given, so a caller that asks where
       * the chest rests, pushes the answer a little and hands it back — which
       * is what a lean is, and the only way anything leans — must be given an
       * answer that does not already contain the last lean. The branch above
       * says this about the rotation and it is just as true of the offset: at
       * a share of 1 the command was `bodyOffset + lean` and the offset it
       * produced was fed back in on the next frame, so a lean of a centimetre
       * grew to the 0.22 m clamp within a few frames and stayed there. Every
       * `lean` in the groove score was pinned to the stop, and an accordion's
       * `squeeze` — the same channel — threw the player's whole torso, and the
       * instrument strapped to it, to one side.
       */
      const share = limb === 'body' ? 0
        : limb === 'left-foot' || limb === 'right-foot' ? 0.15 : 1;
      v.copy(rest).addScaledVector(this.bodyOffset, share);
    }
    this.syncWorld();
    return v.applyMatrix4(this.world);
  }

  separateRest(e: Effector, shared: Vector3, out?: Vector3): Vector3 {
    const v = (out ?? new Vector3()).copy(shared);
    const side: number | undefined =
      e === 'left-hand' ? SIDE.left
        : e === 'right-hand' || e === 'bow' ? SIDE.right
          : undefined;
    if (side === undefined || !finite(shared)) return v;
    this.syncWorld();
    // Half the gap each, so two hands handed the same point come back the full
    // gap apart and neither has moved further than it had to.
    V1.set(side, 0, 0).applyQuaternion(this.worldQuat);
    v.addScaledVector(V1, this.handGap * 0.5);
    // And a little depth, because two hands at matched depth on a kit read as
    // one wide hand. The right leads, arbitrarily but consistently — the point
    // is that they differ, and the alternative is another seeded draw whose
    // only job is to be non-zero.
    V2.set(0, 0, 1).applyQuaternion(this.worldQuat);
    v.addScaledVector(V2, side === SIDE.right ? this.handGap * 0.22 : -this.handGap * 0.22);
    return v;
  }

  // -- pose, groove, face -------------------------------------------------

  setHandPose(side: BodySide, pose: HandPoseId, weight = 1): void {
    const base = this.handDefaults[side];
    const wanted = HAND_POSES[pose];
    this.hands[side].setPose(weight >= 1 ? wanted : blendPoses(base, wanted, weight));
  }

  setHandFingers(side: BodySide, close: ArrayLike<number> | undefined): void {
    this.hands[side].setFingers(close);
  }

  /**
   * Held rather than forwarded, because a reaction has to be able to argue
   * with a viseme. A singer who takes a tomato mid-syllable should grimace and
   * then go back to the word, and that is a `max` in `update` rather than two
   * systems writing to the same three numbers in whichever order they ran.
   */
  setMouth(open: number, round: number, spread: number): void {
    this.mouthOpen = clamp01(open);
    this.mouthRound = clamp01(round);
    this.mouthSpread = clamp01(spread);
  }

  setSway(amount: number, phase: number): void {
    this.swayAmount = clamp01(amount);
    this.swayPhase = phase;
  }

  setHeadNod(amount: number, phase?: number): void {
    this.nodAmount = clamp01(amount);
    this.nodPhase = phase ?? this.swayPhase;
  }

  setEyesClosed(amount: number): void {
    this.eyesClosed = clamp01(amount);
  }

  lookAt(target: Vector3 | undefined): void {
    this.target = target && finite(target) ? target : undefined;
  }

  react(kind: PerformerReaction, strength = 1): void {
    this.reaction = kind;
    this.reactionStrength = clamp01(strength);
    this.reactionStart = Number.NaN; // stamped on the next update, from the clock
  }

  setPlaying(playing: boolean): void {
    this.playing = playing;
  }

  // -- tomatoes -----------------------------------------------------------

  splat(worldPosition: Vector3, markRadius?: number): void {
    if (!finite(worldPosition)) return;
    const host = this.nearestPart(worldPosition);
    if (!host) return;

    host.node.updateWorldMatrix(true, false);
    const local = V1.copy(worldPosition).applyMatrix4(M1.copy(host.node.matrixWorld).invert());
    const dir = V2.copy(local).sub(host.centre);
    if (dir.lengthSq() < 1e-9) dir.copy(FWD);
    dir.normalize();

    const slot = this.takeSplat(host.node);
    const mesh = slot.mesh;
    /**
     * How big the mark is.
     *
     * The caller's number when there is one, because only the thrower's side
     * knows how hard the thing arrived and a fast flat hit really does spread
     * further than a slow steep one. Falling back to the part's own radius
     * keeps the old behaviour for any caller that has nothing to say, and the
     * seeded jitter survives either way — two marks the same size is the tell
     * that a decal is a decal.
     *
     * Clamped against the part so a mark cannot swallow the head it is on: a
     * quad wider than a face reads as a paint job rather than as a tomato.
     */
    const wanted = markRadius !== undefined && Number.isFinite(markRadius) && markRadius > 0
      ? markRadius : host.radius;
    const size = Math.min(wanted, host.radius * 1.6) * this.rng.float(0.85, 1.35);
    mesh.scale.set(size, size, 1);
    mesh.position.copy(host.centre).addScaledVector(dir, host.radius * 1.01);
    mesh.quaternion.setFromUnitVectors(FWD, dir);
    mesh.rotateZ(this.rng.float(0, Math.PI * 2));

    slot.from.copy(mesh.position);
    // Which way is down in the host's own frame, so the mark creeps downward
    // however the part is turned. Sampled once: a hand that flips over later
    // has bigger problems than a drip pointing the wrong way.
    host.node.getWorldQuaternion(Q1);
    slot.down.set(0, -1, 0).applyQuaternion(Q1.invert());
    slot.born = Number.NaN;

    this.react('hit');
  }

  private takeSplat(host: Object3D): Splat {
    if (this.splats.length < MAX_SPLATS) {
      const mesh = new Mesh(quad(this.leases), splatSurface(this.leases));
      mesh.renderOrder = 3;
      host.add(mesh);
      const slot: Splat = { mesh, from: new Vector3(), down: new Vector3(), born: 0 };
      this.splats.push(slot);
      return slot;
    }
    // Recycle the oldest, so a very determined audience cannot grow the scene.
    const slot = this.splats[this.splatNext % MAX_SPLATS]!;
    this.splatNext++;
    if (slot.mesh.parent !== host) host.add(slot.mesh);
    return slot;
  }

  /**
   * Which body part a tomato hit.
   *
   * Head, torso and hands, and deliberately not the legs, even though there are
   * now legs to hit. A splat is a quad parented to the part it landed on, and a
   * leg segment is scaled non-uniformly — its `scale.y` is its length in metres
   * and its `scale.x` is its thickness — so a decal hung off one would be
   * stretched by whatever the leg's length happened to be that frame. A tomato
   * at shin height picks the torso, which is one part up and close enough.
   */
  private nearestPart(world: Vector3): TargetPart | undefined {
    // Built once, in the constructor. It used to be built here — four objects
    // and four vectors on every hit, on the one frame of the show that is
    // already doing the most work and the one the player is watching hardest.
    const parts = this.parts;
    let best: TargetPart | undefined;
    let bestD = Infinity;
    for (const part of parts) {
      part.node.getWorldPosition(V3);
      // Compare against the part's surface rather than its origin, so a torso
      // does not win every hit simply by being large.
      const d = V3.distanceTo(world) - part.radius;
      if (d < bestD) { bestD = d; best = part; }
    }
    return best;
  }

  clearSplats(): void {
    for (const s of this.splats) s.mesh.parent?.remove(s.mesh);
    this.splats.length = 0;
    this.splatNext = 0;
  }

  // -- the frame ----------------------------------------------------------

  update(now: number, dt: number): void {
    // A backgrounded tab hands back a delta of several seconds, and a clock
    // that has not started yet hands back `NaN`. Neither should teleport a limb
    // or poison every transform downstream of one.
    const step = Number.isFinite(dt) ? Math.min(Math.max(dt, 0), 0.1) : 0;
    if (!Number.isFinite(now)) return;
    const p = this.proportions;
    this.syncWorld();

    // Reactions are stamped here rather than in `react`, so nothing in the rig
    // has to know what time it is until the clock tells it.
    if (this.reaction && !Number.isFinite(this.reactionStart)) this.reactionStart = now;
    const bias = this.reactionBias(now);

    // Read last frame's hands before anything moves them.
    this.settleUnder(step);

    // Ahead of the body, because for a player holding a mouthpiece the gaze is
    // what the torso turns by — see `MOUTHPIECE_TURN`. It reads the head's world
    // position, which is last frame's either way.
    this.trackGaze(now, step);

    // --- body: lean, sway, breath -----------------------------------------
    const swayK = 1 - Math.exp(-step / 0.18);
    if (!this.bodyCommanded) this.bodyCommand.multiplyScalar(1 - swayK);
    this.bodyCommanded = false;

    const swing = Math.sin(this.swayPhase + this.swayBias) * this.swayAmount;
    this.bodyOffset.set(
      this.bodyCommand.x + swing * p.height * 0.026 * this.shift,
      this.bodyCommand.y - Math.abs(swing) * p.height * 0.006 - this.settle * p.height * 0.007,
      this.bodyCommand.z
        + Math.cos(this.swayPhase * 0.5 + this.swayBias) * this.swayAmount * p.height * 0.006 * this.shift,
    );

    // Breathing. Faster and deeper for a player who is blowing into something;
    // a wind player who never runs out of air is the tell that nobody thought
    // about it.
    const rate = (this.blown ? 0.42 : 0.26) * (this.playing ? 1.5 : 1);
    const breath = Math.sin(now * Math.PI * 2 * rate + this.breathPhase);
    const depth = (this.blown && this.playing ? 0.030 : 0.014);

    this.effort += ((this.playing ? 0.72 : 0.12) - this.effort) * (1 - Math.exp(-step / 0.35));

    this.twistToHands(step);

    this.torso.position.copy(this.torsoBase).add(this.bodyOffset);
    this.torso.rotation.set(
      // The settle folds the player very slightly over the hit as well as
      // dropping them. Weight goes somewhere; it does not just descend.
      p.lean + bias.torsoPitch + this.nodAmount * 0.02 + this.settle * 0.035,
      // The whole of the gaze's yaw for a player with a horn at their lips, and
      // none of it for anyone else, whose neck does the job. Taking all of it
      // rather than a share is the point: the head's yaw below is in the root's
      // frame, so an equal turn here leaves the face square to the chest — and
      // to the mouthpiece, and to the keys the fingers are on, all of which are
      // carried by this group.
      swing * 0.05 + this.twist + (this.mouthpiece ? this.headYaw : 0),
      // The roll picks up whatever the shift gave away, and then some: a seated
      // player's groove is *all* spine, because the one part of them that cannot
      // move is the part they are sitting on.
      -swing * (0.055 + (1 - this.shift) * 0.075),
    );
    this.torsoBody.scale.set(
      p.torsoW * (1 + breath * depth),
      p.torsoH * (1 + breath * depth * 0.4),
      p.torsoD * (1 + breath * depth * 1.2),
    );

    // --- head: nod, gaze, recoil ------------------------------------------
    const nod = Math.sin(this.nodPhase + this.swayBias * 2) * this.nodAmount;
    const headState = this.placed.get('head');
    if (headState) {
      headState.rest.copy(p.head);
      headState.rest.y += nod * p.height * 0.006 + breath * p.height * 0.0025;
      headState.rest.z += bias.headPush;
    }

    // --- limbs -------------------------------------------------------------
    this.handHeld[0] = this.placed.get('left-hand')?.commanded === true;
    this.handHeld[1] = this.placed.get('right-hand')?.commanded === true;
    // The same reading, for the arms. `commanded` is cleared at the bottom of
    // the loop below, so both have to be taken here or not at all.
    this.handWorking.left = this.handHeld[0];
    this.handWorking.right = this.handHeld[1];
    for (const st of this.placed.values()) {
      // The rest first, and for every part whether it is commanded or not: an
      // uncommanded part is placed at it, and a commanded one still has to
      // record how far off it the command was. See `Placed.offset` — decaying
      // that residue is what makes an idle limb ride the body's own movement
      // immediately instead of trailing it by a time constant.
      const rest = this.liveRest(st, V1, step);
      if (st.commanded) {
        st.node.position.copy(st.pos);
        st.offset.subVectors(st.pos, rest);
        if (st.orientable) st.node.quaternion.copy(st.quat);
      } else {
        const k = 1 - Math.exp(-step / st.tau);
        st.offset.multiplyScalar(1 - k);
        if (st.offset.lengthSq() < 1e-10) st.offset.set(0, 0, 0);
        st.node.position.copy(rest).add(st.offset);
        st.pos.copy(st.node.position);
        if (st.orientable) {
          st.node.quaternion.slerp(st.restQuat, k);
          st.quat.copy(st.node.quaternion);
        }
      }
      st.commanded = false;
    }

    // After the loop, because the head's *position* is an effector and its
    // *attitude* is not. See `Placed.orientable`.
    this.head.rotation.set(
      this.headPitch - nod * 0.20 + bias.headPitch,
      this.headYaw,
      swing * 0.06,
    );

    // --- face --------------------------------------------------------------
    this.face.mouth(
      Math.max(this.mouthOpen, bias.mouthOpen),
      Math.max(this.mouthRound, bias.mouthRound),
      Math.max(this.mouthSpread, bias.mouthSpread),
    );
    // The squint rides `effort` like the brow does, so it arrives with the
    // first note and goes when the player stops rather than being a face this
    // performer wears all night. It loses to `eyes-shut` and to a reaction,
    // both of which are larger and both of which mean something else.
    this.face.eyes(Math.max(this.eyesClosed, bias.eyesClosed, this.effort * this.squint));
    this.face.brow(bias.browRaise, Math.max(bias.browFurrow, this.effort * this.browShare));
    this.face.effort(this.effort);
    this.face.update(now, step);

    this.followForearm('left');
    this.followForearm('right');
    this.hands.left.update(step);
    this.hands.right.update(step);

    // Last, and reading everything above them: the torso is posed, the feet and
    // the hands are placed, the hands have taken their shape, and the two fitted
    // limbs are whatever is left between the ends of all that.
    this.legs.update();
    this.arms.update(step);

    this.driftSplats(now);

    if (this.reaction && now - this.reactionStart >= REACTION_SECONDS[this.reaction]) {
      this.reaction = undefined;
    }
  }

  /**
   * Turn the chest toward whatever the hands are doing.
   *
   * Nobody plays square-on to something that is off to one side. A drummer
   * working the hi-hat and the snare — both of them left of the throne — sits
   * turned that way, and it is not decoration: with the chest square, the arm
   * that has to cross the body has nowhere to cross but *through* it, and no
   * amount of care about where an elbow goes can fix a shoulder that is facing
   * the wrong way. The same turn is most of what a flautist's stance is.
   *
   * So: the mean of the two hands, as an angle off the body's own forward, and
   * a share of it. A share rather than the whole angle because a player turns
   * *toward* their hands and does not face them squarely — and because the
   * share is what keeps this stable for a player whose instrument is strapped
   * on. A carried instrument turns with the chest, so its contacts turn with
   * it, so the angle this reads next frame contains the turn it just made; at a
   * share below one that settles a little short of the clamp instead of winding
   * up into it, and where it does reach the clamp — a flute, held out to one
   * side by definition — the clamp is a stance a flautist actually stands in.
   *
   * Read from last frame's hands, like `settleUnder` and for the same reason:
   * the alternative is measuring hands the same frame that placed them.
   */
  private twistToHands(step: number): void {
    const l = this.hands.left.group.position;
    const r = this.hands.right.group.position;
    // Depth is floored rather than clamped to a sign: hands *behind* the chest
    // are a fold, not a turn, and dividing by the true depth there would spin
    // the player round to look at their own back.
    const ahead = Math.max(
      (l.z + r.z) * 0.5 - this.torso.position.z, this.proportions.torsoD * 0.6,
    );
    const want = clamp(
      Math.atan2((l.x + r.x) * 0.5, ahead) * TWIST_SHARE, -TWIST_LIMIT, TWIST_LIMIT,
    );
    this.twist += (want - this.twist) * (1 - Math.exp(-step / TWIST_TAU));
  }

  /**
   * Weight: the body gives when a hand lands on something hard.
   *
   * Fourth on the list of things that separate a person from a puppet, after
   * the arc, the fingers and the wrist, and the cheapest of the four. A hand
   * that was travelling down fast and has stopped has hit something, and a body
   * that absorbs nothing when that happens looks like a body with no mass in
   * it. So the torso drops **seven millimetres** and folds a couple of degrees
   * and
   * recovers over about a sixth of a second. The drop is `height * 0.007`, so
   * seven millimetres is the coefficient read as a distance: it is 12.3 mm on a
   * 1.75 m player and 11.1 to 13.4 mm across the cast's height spread. The fold
   * and the sixth of a second are exact.
   *
   * Two conditions on the trigger, both learned the hard way:
   *
   *  - **Only a commanded hand counts.** A *resting* limb rides `bodyOffset`,
   *    so a settle would move it down, which would look like a landing, which
   *    would settle the body further. That is an oscillator, and at 60 Hz a
   *    centimetre of it is a vibrating performer.
   *  - **It reads last frame's positions**, before anything this frame has
   *    moved them. The one frame of latency is 16 ms against a 160 ms decay and
   *    is not perceptible; the alternative is measuring a hand the same frame
   *    that placed it, which measures nothing.
   */
  private settleUnder(step: number): void {
    this.settle *= Math.exp(-step / 0.16);
    if (this.settle < 1e-4) this.settle = 0;
    if (step <= 1e-5) return;

    const sides: readonly Limb[] = ['left-hand', 'right-hand'];
    for (let i = 0; i < 2; i++) {
      const st = this.placed.get(sides[i]!);
      if (!st) continue;
      const y = st.node.position.y;
      const rate = (y - this.handY[i]!) / step;
      const was = this.handRate[i]!;
      // Coming down at better than half a metre a second, and losing most of
      // that in one frame. Anything gentler is a hand being moved, not a hand
      // arriving.
      if (this.handHeld[i] && was < -0.5 && rate - was > 0.5) {
        this.settle = Math.min(1, this.settle + Math.min(1, -was / 2.4));
      }
      this.handY[i] = y;
      this.handRate[i] = rate;
    }
  }

  /**
   * Break one wrist toward the forearm that is actually there.
   *
   * This began as the cheap half of the Rayman compromise bought back: there was
   * no arm, so the line from the shoulder to the hand stood in for one, and a
   * wrist breaking correctly is most of what sells a limb that does not exist.
   * The limb exists now — `performer-arms.ts` fits one — so the stand-in is
   * retired and this reads the drawn elbow. It is the same measurement either
   * way: expressed in the hand's own frame, where `-z` is the cuff and `+y` the
   * back of the hand, the two angles off `-z` are exactly wrist extension and
   * wrist deviation, and handing them to the hand costs one quaternion per hand
   * per frame.
   *
   * Two things follow from using the real elbow rather than the shoulder. The
   * angle is right — an elbow hangs well below the shoulder→hand line and a
   * wrist bent toward the shoulder was bent about twenty degrees too far — and
   * a pose that demands a straight wrist now gets one for free: `HandPose.align`
   * puts the elbow directly behind the hand, so the angle measured here comes
   * out at zero with nothing having to know why.
   *
   * The elbow read is one frame old, since the arms are fitted after the hands
   * are posed. That is 16 ms against a 120 ms wrist, it is not perceptible, and
   * the alternative is fitting the arms twice a frame to chase a loop whose gain
   * is a few hundredths — see `settleUnder`, which makes the same trade.
   *
   * Only a fraction of the angle is taken: a wrist that lines up perfectly with
   * its forearm reads as a mechanism, and the residual is what a real wrist's
   * limited range looks like anyway.
   */
  private followForearm(side: BodySide): void {
    const hand = this.hands[side].group;
    V1.copy(this.arms.elbow(side)).sub(hand.position);
    if (V1.lengthSq() < 1e-8) { this.hands[side].setWrist(0, 0); return; }
    // Into the hand's own frame.
    V1.applyQuaternion(Q1.copy(hand.quaternion).invert()).normalize();
    // How far behind the hand the arm is. Floored, so an arm that has ended up
    // in front of the fingers — a hand reaching back past the hip — bends the
    // wrist hard rather than dividing by nothing.
    const back = Math.max(-V1.z, 0.18);
    this.hands[side].setWrist(
      Math.atan2(V1.y, back) * 0.45,
      -Math.atan2(V1.x, back) * 0.40,
    );
  }

  /**
   * The head turns late and imperfectly and the eyes get there first, which is
   * the same note the plan makes about the follow spot: an operator, not a
   * servo. With no target the gaze wanders on a seeded schedule rather than
   * locking forward, because a band staring straight ahead is the animatronic
   * failure mode this whole system exists to avoid.
   */
  private trackGaze(now: number, step: number): void {
    let wantYaw = this.idleYaw;
    let wantPitch = this.idlePitch;
    if (this.target) {
      this.head.getWorldPosition(V1);
      V2.copy(this.target).sub(V1).applyQuaternion(this.worldQuatInv);
      const flat = Math.hypot(V2.x, V2.z);
      wantYaw = clamp(Math.atan2(V2.x, V2.z), -1.2, 1.2);
      wantPitch = clamp(-Math.atan2(V2.y, Math.max(flat, 1e-4)), -0.5, 0.5);
    } else if (now >= this.nextGlance) {
      // One draw either way, so the schedule stays in step with the seed and
      // only the size of the wander changes. See `MOUTHPIECE_IDLE_TURN`.
      const wander = this.mouthpiece ? MOUTHPIECE_IDLE_TURN : IDLE_TURN;
      this.idleYaw = this.rng.float(-wander, wander);
      this.idlePitch = this.rng.float(-0.10, 0.14);
      this.nextGlance = now + this.rng.float(1.4, 4.5);
    }
    // A player with a mouthpiece on their lips turns from the waist and only so
    // far; whatever is left over goes to the eyes below, as it already does for
    // the part of a turn the neck has not caught up with.
    const turn = this.mouthpiece
      ? clamp(wantYaw, -MOUTHPIECE_TURN, MOUTHPIECE_TURN) : wantYaw;
    const k = 1 - Math.exp(-step / 0.24);
    this.headYaw += (turn - this.headYaw) * k;
    this.headPitch += (wantPitch - this.headPitch) * k;
    // Whatever the head has not caught up with yet, the eyes are already doing.
    this.face.gaze((wantYaw - this.headYaw) * 2.2, (wantPitch - this.headPitch) * 2.0);
  }

  private reactionBias(now: number): Bias {
    const none: Bias = {
      torsoPitch: 0, headPush: 0, headPitch: 0,
      eyesClosed: 0, browRaise: 0, browFurrow: 0,
      mouthOpen: 0, mouthRound: 0, mouthSpread: 0,
    };
    if (!this.reaction || !Number.isFinite(this.reactionStart)) return none;
    const span = REACTION_SECONDS[this.reaction];
    const t = clamp01((now - this.reactionStart) / span);
    // A sharp rise and a slow fall. A symmetric envelope reads as a machine
    // doing an animation; this reads as something happening to a person.
    const hit = t < 0.14 ? t / 0.14 : Math.exp(-(t - 0.14) * 3.4);
    const s = this.reactionStrength;

    switch (this.reaction) {
      case 'hit':
        return {
          ...none,
          torsoPitch: 0.42 * hit * s,
          headPush: -0.09 * hit * s,
          headPitch: 0.30 * hit * s,
          eyesClosed: Math.min(1, hit * 1.6) * s,
          browFurrow: hit * s,
          mouthOpen: 0.45 * hit * s,
          mouthSpread: 0.50 * hit * s,
        };
      case 'wince':
        return { ...none, eyesClosed: hit * s * 0.9, browFurrow: hit * s, torsoPitch: 0.10 * hit * s };
      case 'grin':
        return { ...none, browRaise: 0.45 * hit * s, mouthOpen: 0.22 * hit * s, mouthSpread: 0.95 * hit * s };
      case 'glare': {
        // Sustained, not a spike: the point of a glare is that it holds.
        const hold = t < 0.12 ? t / 0.12 : t > 0.85 ? (1 - t) / 0.15 : 1;
        return { ...none, browFurrow: hold * s, eyesClosed: hold * s * 0.28, headPitch: -0.04 * hold * s };
      }
      case 'surprise':
        return {
          ...none, browRaise: hit * s, headPush: 0.03 * hit * s,
          mouthOpen: 0.55 * hit * s, mouthRound: 0.35 * hit * s,
        };
    }
  }

  private driftSplats(now: number): void {
    for (const s of this.splats) {
      if (!Number.isFinite(s.born)) s.born = now;
      const t = clamp01((now - s.born) / 3.5);
      s.mesh.position.copy(s.from).addScaledVector(s.down, t * 0.022);
      s.mesh.scale.y = s.mesh.scale.x * (1 + t * 0.35);
    }
  }

  // -- housekeeping -------------------------------------------------------

  measure(): PerformerStats {
    let objects = 0;
    let triangles = 0;
    let shadowCasters = 0;
    this.root.traverse((o) => {
      objects++;
      if (!(o instanceof Mesh)) return;
      const mesh: Mesh = o;
      if (mesh.castShadow) shadowCasters++;
      const g = mesh.geometry;
      const count = g.index ? g.index.count : (g.getAttribute('position')?.count ?? 0);
      triangles += Math.floor(count / 3);
    });
    return { objects, triangles, shadowCasters };
  }

  dispose(): void {
    this.clearSplats();
    this.root.parent?.remove(this.root);
    // Only the geometries and materials are shared; the Object3Ds are ours and
    // go with the tree.
    this.root.clear();
    this.placed.clear();
    this.leases.releaseAll();
  }
}

// ---------------------------------------------------------------------------

/**
 * A rotation that puts local `+y` along `n` and keeps local `+z` as close to
 * the body's forward as the normal allows.
 *
 * The second half is what stops a hand spinning about the contact normal
 * between frames: `setFromUnitVectors` alone leaves the roll unconstrained, and
 * an unconstrained roll on a drummer's hand looks like a fault in the renderer.
 */
/**
 * Build a hand basis from a surface normal, and optionally a roll reference.
 *
 * `n` becomes local `+y` — the back of the hand — so the palm, which faces
 * `-y`, presses into the surface. That fixes two axes. The third is the roll
 * about the normal, and when the caller says nothing it falls back to a fixed
 * forward, which is arbitrary. On anything the fingers lie *along* — a row of
 * keys down a tube — arbitrary is visibly wrong, so `along` lets the model
 * pin it.
 */
function orientTo(n: Vector3, along?: Vector3): Quaternion {
  if (along && along.lengthSq() > 1e-8) {
    const ax = V4.copy(along).addScaledVector(n, -along.dot(n));
    if (ax.lengthSq() > 1e-6) {
      ax.normalize();
      M1.makeBasis(ax, n, V6.crossVectors(ax, n).normalize());
      return Q1.setFromRotationMatrix(M1);
    }
  }
  const fwd = V4.copy(FWD).addScaledVector(n, -FWD.dot(n));
  if (fwd.lengthSq() < 1e-6) fwd.copy(UP).addScaledVector(n, -UP.dot(n));
  if (fwd.lengthSq() < 1e-6) fwd.set(1, 0, 0);
  fwd.normalize();
  const x = V5.crossVectors(n, fwd).normalize();
  const z = V6.crossVectors(x, n).normalize();
  M1.makeBasis(x, n, z);
  return Q1.setFromRotationMatrix(M1);
}

/**
 * A hand's private, permanent deviation from whatever shape it is given.
 *
 * Two hands sent to the same pose on the same frame should not come out
 * identical, and two players sent to the same pose should not either. This is
 * the whole of that: a few percent, drawn once, applied for the life of the
 * rig. Small enough that `stick` is unmistakably `stick`, big enough that the
 * ten fingers of a drummer are not one finger drawn ten times.
 */
function handBias(rng: Rng): HandBias {
  const j = (m: number): number => rng.float(-m, m);
  return {
    curl: [j(0.05), j(0.05), j(0.05), j(0.05)],
    tip: j(0.04),
    spread: j(0.04),
    cup: j(0.05),
    wrist: j(0.06),
  };
}

function finite(v: Vector3): boolean {
  return Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function clamp01(v: number): number {
  return Number.isFinite(v) ? (v < 0 ? 0 : v > 1 ? 1 : v) : 0;
}
