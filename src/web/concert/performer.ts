/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * A performer: a head, a torso, two hands, two feet, and a face.
 *
 * Rayman hands are why this feature is achievable at all, and it is worth being
 * precise about what they delete. A conventional rig is a skeleton, a skinned
 * mesh and an IK solver with elbow pole targets, and IK on a drummer is
 * genuinely hard — the solution that puts the hand on the snare puts the elbow
 * through the ribs, and the fix is per-instrument hinting that never quite
 * generalises. **A floating hand has no elbow to solve.** The instrument model
 * says where the contact is, the runtime says when to be there, and this file
 * puts the hand at that point. There is no chain, so there is nothing to
 * unsolve.
 *
 * What that leaves is the part that actually reads from the tenth row: shape.
 * A hand in the right place with the wrong shape is worse than no hand, so the
 * poses in `performer-hands.ts` carry the weight the skeleton would have.
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
import { buildFace, type FaceRig } from './performer-face.js';
import {
  DEFAULT_HAND_POSES, HAND_POSES, blendPoses, buildHand,
  type HandPose, type HandPoseId, type HandRig,
} from './performer-hands.js';
import {
  buildAccessories, buildHair, dressTorso, proportions, restLocals,
  type BodySide, type Proportions,
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
   *   - `head` places the head centre, clamped to a head's radius of its rest.
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
   */
  splat(worldPosition: Vector3): void;

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
  private readonly head = new Group();
  private readonly placed = new Map<Limb, Placed>();
  private readonly restLocal: Record<string, Vector3>;
  private readonly blown: boolean;

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

  // World transform cache.
  private readonly world = new Matrix4();
  private readonly worldInv = new Matrix4();
  private readonly worldQuatInv = new Quaternion();

  constructor(performer: Performer) {
    this.performer = performer;
    const look = performer.look;
    const posture = performer.station.posture;
    const spec = ARCHETYPES[performer.archetype];
    this.blown = spec.blown === true;

    this.rng = new Rng(`${performer.id}#rig`);
    const faceRng = new Rng(`${performer.id}#face`);
    const hairRng = new Rng(`${performer.id}#hair`);

    const p = proportions(look, posture);
    this.proportions = p;
    this.restLocal = restLocals(p, posture);

    this.breathPhase = this.rng.float(0, Math.PI * 2);
    this.swayBias = this.rng.float(-0.12, 0.12);
    this.nextGlance = this.rng.float(0.5, 3);
    this.idleYaw = this.rng.float(-0.12, 0.12);

    this.root.name = `performer:${performer.id}`;

    // --- torso ------------------------------------------------------------
    this.torsoBase.set(0, p.hipY, 0);
    this.torso.position.copy(this.torsoBase);
    this.torso.rotation.x = p.lean;
    this.root.add(this.torso);
    this.torsoBody = dressTorso(this.torso, this.root, look, p, this.leases);

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
    buildHair(this.head, look, p, this.leases, hairRng);
    buildAccessories(
      { head: this.head, torso: this.torso, neckY: p.torsoH * 0.99 },
      look, p, this.leases,
    );

    // --- hands ------------------------------------------------------------
    const cuff = shade(look.outfit.jacket, -0.04);
    this.hands = {
      left: buildHand('left', p, skin, cuff, this.leases),
      right: buildHand('right', p, skin, cuff, this.leases),
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

    // --- effectors --------------------------------------------------------
    // `standoff` is what stops a hand sinking into a drum head: the point the
    // instrument returned is the surface, and the palm's centre is half a palm
    // back along the normal from it.
    this.register('left-hand', this.hands.left.group, p.handR * 0.62, 1, 0.16, true);
    this.register('right-hand', this.hands.right.group, p.handR * 0.62, 1, 0.16, true);
    this.register('left-foot', feet.left, p.footH * 0.5, 0.15, 0.22, true);
    this.register('right-foot', feet.right, p.footH * 0.5, 0.15, 0.22, true);
    this.register('head', this.head, p.headR * 0.5, 1, 0.20, false);

    this.syncWorld();
  }

  private register(
    limb: Limb, node: Object3D, standoff: number, follow: number,
    tau: number, orientable: boolean,
  ): void {
    const rest = (this.restLocal[limb] ?? new Vector3()).clone();
    node.position.copy(rest);
    this.placed.set(limb, {
      node, rest, restQuat: node.quaternion.clone(), standoff, follow, tau, orientable,
      commanded: false, pos: rest.clone(), quat: node.quaternion.clone(),
    });
  }

  // -- transforms ---------------------------------------------------------

  private syncWorld(): void {
    this.root.updateWorldMatrix(true, false);
    if (!this.world.equals(this.root.matrixWorld)) {
      this.world.copy(this.root.matrixWorld);
      this.worldInv.copy(this.world).invert();
      this.root.getWorldQuaternion(this.worldQuatInv).invert();
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
  }

  carry(object: Object3D): void {
    this.torso.add(object);
  }

  restPosition(e: Effector, out?: Vector3): Vector3 {
    const v = out ?? new Vector3();
    const limb: string = e === 'bow' ? 'right-hand' : e;
    const rest = this.restLocal[limb];
    if (!rest) {
      // Every member of `Effector` is in the table; this is the branch that
      // catches a contract change rather than guessing at one.
      v.set(0, this.proportions.hipY, 0);
    } else {
      const grounded = limb === 'left-foot' || limb === 'right-foot';
      v.copy(rest).addScaledVector(this.bodyOffset, grounded ? 0.15 : 1);
    }
    this.syncWorld();
    return v.applyMatrix4(this.world);
  }

  // -- pose, groove, face -------------------------------------------------

  setHandPose(side: BodySide, pose: HandPoseId, weight = 1): void {
    const base = this.handDefaults[side];
    const wanted = HAND_POSES[pose];
    this.hands[side].setPose(weight >= 1 ? wanted : blendPoses(base, wanted, weight));
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

  splat(worldPosition: Vector3): void {
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
    const size = host.radius * this.rng.float(0.85, 1.35);
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

  private nearestPart(world: Vector3): { node: Object3D; centre: Vector3; radius: number } | undefined {
    const p = this.proportions;
    const parts: { node: Object3D; centre: Vector3; radius: number }[] = [
      { node: this.head, centre: new Vector3(0, 0, 0), radius: p.headR * 1.06 },
      { node: this.torso, centre: new Vector3(0, p.torsoH * 0.58, 0), radius: Math.max(p.torsoW, p.torsoH) * 0.46 },
      { node: this.hands.left.group, centre: new Vector3(), radius: p.handR * 1.2 },
      { node: this.hands.right.group, centre: new Vector3(), radius: p.handR * 1.2 },
    ];
    let best: typeof parts[number] | undefined;
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

    // --- body: lean, sway, breath -----------------------------------------
    const swayK = 1 - Math.exp(-step / 0.18);
    if (!this.bodyCommanded) this.bodyCommand.multiplyScalar(1 - swayK);
    this.bodyCommanded = false;

    const swing = Math.sin(this.swayPhase + this.swayBias) * this.swayAmount;
    this.bodyOffset.set(
      this.bodyCommand.x + swing * p.height * 0.026,
      this.bodyCommand.y - Math.abs(swing) * p.height * 0.006,
      this.bodyCommand.z + Math.cos(this.swayPhase * 0.5 + this.swayBias) * this.swayAmount * p.height * 0.006,
    );

    // Breathing. Faster and deeper for a player who is blowing into something;
    // a wind player who never runs out of air is the tell that nobody thought
    // about it.
    const rate = (this.blown ? 0.42 : 0.26) * (this.playing ? 1.5 : 1);
    const breath = Math.sin(now * Math.PI * 2 * rate + this.breathPhase);
    const depth = (this.blown && this.playing ? 0.030 : 0.014);

    this.effort += ((this.playing ? 0.72 : 0.12) - this.effort) * (1 - Math.exp(-step / 0.35));

    this.torso.position.copy(this.torsoBase).add(this.bodyOffset);
    this.torso.rotation.set(
      p.lean + bias.torsoPitch + this.nodAmount * 0.02,
      swing * 0.05,
      -swing * 0.055,
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
    this.trackGaze(now, step);

    // --- limbs -------------------------------------------------------------
    for (const st of this.placed.values()) {
      if (st.commanded) {
        st.node.position.copy(st.pos);
        if (st.orientable) st.node.quaternion.copy(st.quat);
      } else {
        V1.copy(st.rest).addScaledVector(this.bodyOffset, st.follow);
        const k = 1 - Math.exp(-step / st.tau);
        st.node.position.lerp(V1, k);
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
    this.face.eyes(Math.max(this.eyesClosed, bias.eyesClosed));
    this.face.brow(bias.browRaise, Math.max(bias.browFurrow, this.effort * 0.22));
    this.face.effort(this.effort);
    this.face.update(now, step);

    this.hands.left.update(step);
    this.hands.right.update(step);
    this.driftSplats(now);

    if (this.reaction && now - this.reactionStart >= REACTION_SECONDS[this.reaction]) {
      this.reaction = undefined;
    }
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
      this.idleYaw = this.rng.float(-0.30, 0.30);
      this.idlePitch = this.rng.float(-0.10, 0.14);
      this.nextGlance = now + this.rng.float(1.4, 4.5);
    }
    const k = 1 - Math.exp(-step / 0.24);
    this.headYaw += (wantYaw - this.headYaw) * k;
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

function finite(v: Vector3): boolean {
  return Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function clamp01(v: number): number {
  return Number.isFinite(v) ? (v < 0 ? 0 : v > 1 ? 1 : v) : 0;
}
