/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Hands, which are most of what an audience actually watches.
 *
 * The art direction deletes the hard problem — a floating hand has no elbow, so
 * there is no IK solution to find and nothing to put through the ribs — but it
 * does not delete the *interesting* one. A hand placed correctly on a snare and
 * shaped like a starfish still reads as a bug. So the position comes from the
 * instrument model and the **shape comes from here**: a fist around a stick, a
 * flat palm on a key bed, fingers spread across a fretboard.
 *
 * Thirteen poses, blended rather than switched. A pose is nine numbers — four
 * finger curls, a second-joint fold, a splay, two thumb values and a palm
 * arch — so blending two poses is `lerp` on each, and asking for "halfway to a
 * fist" is a meaningful request rather than a special case. Two hands never
 * snap between shapes; they ease over about a tenth of a second, which is
 * roughly what a real hand does and is short enough that a sixteenth-note
 * passage still reads.
 *
 * ## Two things on top of the pose, and why they are not poses
 *
 * **The wrist follows the arm.** A placed hand takes its whole orientation from
 * the contact normal, which leaves the wrist perfectly square to the instrument
 * whatever the body is doing. `setWrist` breaks it toward wherever the forearm
 * would be running. That cannot be a pose, because it changes for a reason the
 * pose knows nothing about — where the hand happens to have been put.
 *
 * **The two hands are never identical.** Each carries a fixed, tiny `HandBias`
 * drawn from the performer's id, so "both hands to `stick`" produces two
 * slightly different hands rather than one hand and its mirror. That also
 * cannot be a pose, because it must survive every pose.
 *
 * ## Why the fingers are cheap
 *
 * Each bone is one mesh, not a group holding a mesh. The shared `bone` geometry
 * has its origin at the base rather than the centre, so the mesh *is* the
 * pivot: a knuckle is `rotation.x` and the next bone is a child at `y = 1`.
 * That halves the object count of a hand, and object count is the budget that
 * actually binds when six of these are on stage.
 *
 * Everything articulated is uniformly scaled. A finger inherits its parent's
 * scale, and a non-uniform parent would shear every rotated child — a hand
 * flattened in `y` with skewed fingers is the exact failure this rule exists to
 * prevent. The palm, which has no children, is free to be squashed.
 */

import { Group, Mesh, MeshStandardMaterial } from 'three';

import type { Archetype } from '../../concert/types.js';

import { Leases, bone, collar, orb, surface } from './performer-assets.js';
import type { Proportions } from './performer-look.js';

/** The named shapes. Anything outside this list is a blend of two of them. */
export type HandPoseId =
  | 'relax'   // hanging, fingers loosely curled. The default idle.
  | 'fist'    // closed on nothing — a clenched hand, and rarely what you want
  | 'grip'    // round a cylinder: a mic, a bass neck, a trombone slide
  | 'stick'   // a matched grip: index and thumb pinch, the other three wrap
  | 'bowhold' // draped over a frog, thumb bent underneath
  | 'flat'    // fingers straight and together — a palm mute, a wave
  | 'keys'    // curved and slightly spread, over a key bed
  | 'press'   // one finger down on a key, the rest lifted
  | 'spread'  // splayed, stopping strings on a fretboard
  | 'strap'   // flat under an accordion's bass strap, fingers on the buttons
  | 'pluck'   // thumb and index pinched, the rest folded
  | 'point'   // index out; a cue, a count-in
  | 'open';   // fingers straight and fanned — a singer's free hand

export interface HandPose {
  /** Fold at the knuckle, index to little, 0 straight .. 1 into the palm. */
  curl: [number, number, number, number];
  /** Fold at the second joint, applied to all four. */
  tip: number;
  /** Fan, 0 together .. 1 splayed. */
  spread: number;
  thumbCurl: number;
  /** 0 tucked alongside the index .. 1 fully abducted. */
  thumbOut: number;
  /** Palm arch. A cupped palm is what makes a grip read as holding something. */
  cup: number;
  /**
   * Wrist pitch. **Negative lifts the fingers, positive drops them.**
   *
   * Stated by what it does rather than by an "up/down" that has to be resolved
   * against three.js's rotation sense every time it is read: `flex.rotation.x`
   * is positive, and a positive rotation about `+x` sends the fingers, which
   * are `+z`, toward `-y`. So a pianist's hand over a keybed is positive and a
   * fretting hand reaching up at a neck is negative.
   */
  wrist: number;
}

/**
 * The vocabulary. Thirteen shapes, and the four added last are the four the
 * first nine were quietly approximating.
 *
 *  - **`fist` is not how anyone holds a stick.** A matched grip has the stick
 *    running across the first joint of the index and held against the thumb
 *    pad; the other three fingers wrap it loosely and do most of the rebound.
 *    A drummer with two clenched fists reads as someone about to hit the kit
 *    rather than someone playing it, and that is what was on stage.
 *  - **A bow hold is not a grip.** The hand hangs off the frog — thumb bent
 *    underneath, fingers draped over, little finger curved on top — and the
 *    difference between that and a closed fist around a stick is most of what
 *    a string player's right hand looks like.
 *  - **An accordion's left hand holds nothing at all.** It is behind a strap,
 *    flat against the casing, and only the fingers move onto the buttons. It
 *    was `grip`, which is the shape for a microphone, and it made the bass
 *    hand look like it was strangling the instrument.
 *  - **`press` is one finger, not five.** A whole hand at `keys` descending on
 *    a key is a hand playing a cluster.
 */
export const HAND_POSES: Record<HandPoseId, HandPose> = {
  relax: { curl: [0.34, 0.40, 0.43, 0.46], tip: 0.50, spread: 0.18, thumbCurl: 0.30, thumbOut: 0.35, cup: 0.25, wrist: -0.06 },
  fist: { curl: [1.00, 1.00, 1.00, 1.00], tip: 1.00, spread: 0.00, thumbCurl: 0.55, thumbOut: 0.12, cup: 0.65, wrist: 0.00 },
  grip: { curl: [0.72, 0.76, 0.76, 0.72], tip: 0.86, spread: 0.05, thumbCurl: 0.34, thumbOut: 0.58, cup: 0.48, wrist: 0.00 },
  stick: { curl: [0.58, 0.78, 0.86, 0.92], tip: 0.80, spread: 0.06, thumbCurl: 0.44, thumbOut: 0.28, cup: 0.58, wrist: -0.04 },
  bowhold: { curl: [0.44, 0.52, 0.60, 0.70], tip: 0.60, spread: 0.24, thumbCurl: 0.68, thumbOut: 0.42, cup: 0.34, wrist: -0.12 },
  flat: { curl: [0.00, 0.00, 0.00, 0.00], tip: 0.00, spread: 0.02, thumbCurl: 0.00, thumbOut: 0.22, cup: 0.00, wrist: 0.00 },
  keys: { curl: [0.42, 0.46, 0.46, 0.44], tip: 0.56, spread: 0.32, thumbCurl: 0.18, thumbOut: 0.62, cup: 0.30, wrist: 0.10 },
  press: { curl: [0.66, 0.28, 0.30, 0.32], tip: 0.74, spread: 0.26, thumbCurl: 0.20, thumbOut: 0.56, cup: 0.34, wrist: 0.14 },
  spread: { curl: [0.30, 0.36, 0.38, 0.34], tip: 0.34, spread: 1.00, thumbCurl: 0.10, thumbOut: 0.86, cup: 0.10, wrist: -0.16 },
  strap: { curl: [0.50, 0.58, 0.56, 0.48], tip: 0.68, spread: 0.22, thumbCurl: 0.22, thumbOut: 0.08, cup: 0.14, wrist: 0.24 },
  pluck: { curl: [0.84, 0.54, 0.60, 0.66], tip: 0.90, spread: 0.10, thumbCurl: 0.70, thumbOut: 0.50, cup: 0.52, wrist: 0.00 },
  point: { curl: [0.00, 1.00, 1.00, 1.00], tip: 1.00, spread: 0.00, thumbCurl: 0.60, thumbOut: 0.18, cup: 0.55, wrist: 0.00 },
  open: { curl: [0.05, 0.05, 0.08, 0.10], tip: 0.05, spread: 0.76, thumbCurl: 0.00, thumbOut: 0.82, cup: 0.00, wrist: -0.10 },
};

/**
 * What each archetype's hands do when nothing else is asked of them.
 *
 * A `Record` over the frozen union rather than a lookup with a default, for the
 * same reason `ARCHETYPE_OF` is: a new archetype should fail the build here
 * rather than arrive on stage with starfish hands. Left and right differ
 * wherever the instrument is asymmetric, which is most of them — a guitarist's
 * left hand is spread across a fretboard and their right is picking.
 *
 * ## `grip` is load-bearing outside this file
 *
 * `animate.ts` reads this table and treats `grip` as meaning "this hand is
 * *holding* something", which is what lets it blend a bowed player's right hand
 * toward `pluck` for a pizzicato section and leave every other hand alone. So a
 * hand whose default is changed away from `grip` silently loses that blend.
 * That is why the violin and cello right hands stay `grip` rather than moving
 * to the more accurate `bowhold` — the improvement is not worth breaking a
 * behaviour in a file this one does not own. The accordion's left hand does
 * move, to `strap`, because an accordion emits no `pluck` gestures at all and
 * there is nothing there to lose.
 */
export const DEFAULT_HAND_POSES: Record<Archetype, { left: HandPoseId; right: HandPoseId }> = {
  drumkit: { left: 'stick', right: 'stick' },
  'grand-piano': { left: 'keys', right: 'keys' },
  'electric-piano': { left: 'keys', right: 'keys' },
  organ: { left: 'keys', right: 'keys' },
  synth: { left: 'keys', right: 'keys' },
  accordion: { left: 'strap', right: 'keys' },
  harmonica: { left: 'grip', right: 'grip' },
  'acoustic-guitar': { left: 'spread', right: 'pluck' },
  'electric-guitar': { left: 'spread', right: 'pluck' },
  'upright-bass': { left: 'spread', right: 'pluck' },
  'electric-bass': { left: 'spread', right: 'pluck' },
  harp: { left: 'pluck', right: 'pluck' },
  sitar: { left: 'spread', right: 'pluck' },
  violin: { left: 'spread', right: 'grip' },
  cello: { left: 'spread', right: 'grip' },
  mallets: { left: 'stick', right: 'stick' },
  trumpet: { left: 'grip', right: 'keys' },
  trombone: { left: 'grip', right: 'grip' },
  saxophone: { left: 'keys', right: 'keys' },
  clarinet: { left: 'keys', right: 'keys' },
  flute: { left: 'keys', right: 'keys' },
  // A singer's hands are free, and that is most of what a singer's body says.
  singer: { left: 'relax', right: 'open' },
};

export function blendPoses(a: HandPose, b: HandPose, t: number): HandPose {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  const mix = (x: number, y: number): number => x + (y - x) * k;
  return {
    curl: [
      mix(a.curl[0], b.curl[0]), mix(a.curl[1], b.curl[1]),
      mix(a.curl[2], b.curl[2]), mix(a.curl[3], b.curl[3]),
    ],
    tip: mix(a.tip, b.tip),
    spread: mix(a.spread, b.spread),
    thumbCurl: mix(a.thumbCurl, b.thumbCurl),
    thumbOut: mix(a.thumbOut, b.thumbOut),
    cup: mix(a.cup, b.cup),
    wrist: mix(a.wrist, b.wrist),
  };
}

// ---------------------------------------------------------------------------

export interface HandRig {
  /**
   * The placement node. Its position and orientation belong to the runtime;
   * everything under it belongs to the pose.
   *
   * Local frame: the palm lies in the `xz` plane, the palm *faces* `-y`, and
   * the fingers point along `+z`. So orienting a hand to a `Contact` is
   * "point local `+y` along the surface normal", which is one `setFromUnitVectors`
   * and no special cases for a snare versus a fretboard.
   */
  group: Group;
  /** Target shape. The hand eases toward it; see `update`. */
  setPose(pose: HandPose): void;
  /** Target shape, immediately. For the first frame and for a hard cut. */
  snapPose(pose: HandPose): void;
  /**
   * Where the forearm is, as two angles in the hand's own frame — extension
   * and deviation, radians, both clamped internally.
   *
   * There is no forearm, and that is exactly why this exists. A hand placed on
   * a contact takes its whole orientation from the surface normal, so an
   * accordionist reaching across to the bass buttons and a drummer's hand flat
   * on a snare end up with identically axis-aligned wrists — and a wrist that
   * never breaks is the single most puppet-like thing left once the fingers are
   * right. The rig knows where the shoulder is, so it can say which way the
   * arm *would* run, and the wrist bends to meet it. It is additive on top of
   * `HandPose.wrist`, so a pose's own attitude survives.
   */
  setWrist(extend: number, deviate: number): void;
  update(dt: number): void;
}

/** How long a hand takes to change shape. A tenth of a second, like a hand. */
const POSE_TAU = 0.085;

/** How long the wrist takes to follow the arm. Slower: a wrist is heavier. */
const WRIST_TAU = 0.12;

/** How far the wrist will break to meet the forearm, radians. */
const WRIST_LIMIT = 0.42;

/**
 * A per-hand constant offset, applied to every pose this hand ever takes.
 *
 * Two hands asked for the same shape at the same instant should not *be* the
 * same shape: real pairs of hands are never in agreement to three decimal
 * places, and a band of drummers whose ten fingers move as one is uncanny in a
 * way that is hard to point at and impossible to unsee. Deterministic per
 * performer per side, tiny — a twentieth of the range at most — and applied at
 * the point of use so the frozen poses in `HAND_POSES` are never touched.
 */
export interface HandBias {
  curl: [number, number, number, number];
  tip: number;
  spread: number;
  cup: number;
  wrist: number;
}

export const NO_BIAS: HandBias = { curl: [0, 0, 0, 0], tip: 0, spread: 0, cup: 0, wrist: 0 };

export function buildHand(
  side: 'left' | 'right', p: Proportions, skin: MeshStandardMaterial,
  cuffColour: string, l: Leases, bias: HandBias = NO_BIAS,
): HandRig {
  const R = p.handR;
  // Which way the thumb points. The right hand lives at -x and its thumb
  // reaches across the body toward +x; the left is the mirror.
  const thumbSign = side === 'right' ? 1 : -1;

  const group = new Group();
  group.name = `${side}-hand`;

  /** Wrist flex, so `group` can stay purely a placement node. */
  const flex = new Group();
  group.add(flex);

  const palm = new Mesh(orb(l), skin);
  palm.scale.set(R * 2.0, R * 0.86, R * 1.75);
  palm.castShadow = true;
  flex.add(palm);

  // A sleeve cuff at the wrist. It costs one mesh and it is the difference
  // between a floating hand and a floating hand that belongs to a jacket.
  const cuff = new Mesh(collar(l), surface(l, cuffColour, { roughness: 0.9 }));
  cuff.scale.set(R * 1.55, R * 1.15, R * 1.10);
  cuff.position.set(0, 0, -R * 1.02);
  flex.add(cuff);

  const boneGeo = bone(l);

  interface Finger { base: Mesh; tip: Mesh; fan: number; length: number }
  const fingers: Finger[] = [];
  const LENGTHS = [1.0, 1.08, 1.0, 0.84];
  for (let i = 0; i < 4; i++) {
    const length = R * 0.62 * (LENGTHS[i] ?? 1);
    const base = new Mesh(boneGeo, skin);
    base.scale.setScalar(length);
    base.position.set(thumbSign * (1.5 - i) * R * 0.46, 0, R * 0.78);
    flex.add(base);

    const tip = new Mesh(boneGeo, skin);
    tip.scale.setScalar(0.80);
    tip.position.set(0, 0.88, 0);
    base.add(tip);

    fingers.push({ base, tip, fan: 1.5 - i, length });
  }

  const thumbBase = new Mesh(boneGeo, skin);
  thumbBase.scale.setScalar(R * 0.58);
  thumbBase.position.set(thumbSign * R * 0.82, -R * 0.08, -R * 0.04);
  flex.add(thumbBase);
  const thumbTip = new Mesh(boneGeo, skin);
  thumbTip.scale.setScalar(0.84);
  thumbTip.position.set(0, 0.86, 0);
  thumbBase.add(thumbTip);

  const current: HandPose = { ...HAND_POSES.relax, curl: [...HAND_POSES.relax.curl] };
  let target: HandPose = HAND_POSES.relax;
  let settled = false;

  // The forearm channel. Held separately from the pose because it changes for a
  // different reason and on a different clock: the pose is a decision, this is
  // a consequence of where the hand was put.
  let wantExtend = 0;
  let wantDeviate = 0;
  let extend = 0;
  let deviate = 0;

  function applyFlex(): void {
    flex.rotation.set(clamp(current.wrist + bias.wrist, -1, 1) * 0.55 + extend, deviate, 0);
  }

  function apply(pose: HandPose): void {
    const cup = clamp(pose.cup + bias.cup, 0, 1);
    const spread = clamp(pose.spread + bias.spread, 0, 1);
    const tip = clamp(pose.tip + bias.tip, 0, 1);
    for (let i = 0; i < fingers.length; i++) {
      const f = fingers[i];
      if (!f) continue;
      const curl = clamp((pose.curl[i] ?? 0) + (bias.curl[i] ?? 0), 0, 1);
      // `+π/2` lays the bone along `+z`; anything beyond that folds it toward
      // the palm, which is `-y`. One angle does the whole knuckle.
      f.base.rotation.set(
        Math.PI / 2 + curl * 1.75 + cup * 0.16,
        0,
        -thumbSign * f.fan * spread * 0.24,
      );
      f.tip.rotation.x = tip * curl * 1.45;
    }
    thumbBase.rotation.set(
      Math.PI / 2 - 0.22 + pose.thumbCurl * 1.30,
      0,
      -thumbSign * (0.42 + 0.62 * pose.thumbOut),
    );
    thumbTip.rotation.x = pose.thumbCurl * 1.10;
    // The palm arches as it closes. Small, but it is what stops a fist looking
    // like four fingers folded onto a plank.
    palm.scale.set(R * 2.0 * (1 - cup * 0.10), R * 0.86 * (1 + cup * 0.22), R * 1.75);
    applyFlex();
  }

  apply(current);

  /** In place, because this runs twelve times a frame with six on stage. */
  function ease(k: number): number {
    let moved = 0;
    for (let i = 0; i < 4; i++) {
      const to = target.curl[i] ?? 0;
      const d = (to - (current.curl[i] ?? 0)) * k;
      current.curl[i] = (current.curl[i] ?? 0) + d;
      moved += Math.abs(d);
    }
    const step = (key: Exclude<keyof HandPose, 'curl'>): void => {
      const d = (target[key] - current[key]) * k;
      current[key] += d;
      moved += Math.abs(d);
    };
    step('tip'); step('spread'); step('thumbCurl');
    step('thumbOut'); step('cup'); step('wrist');
    return moved;
  }

  return {
    group,
    setPose(pose: HandPose): void {
      target = pose;
      settled = false;
    },
    snapPose(pose: HandPose): void {
      target = pose;
      ease(1);
      apply(current);
      settled = true;
    },
    setWrist(e: number, d: number): void {
      wantExtend = clamp(Number.isFinite(e) ? e : 0, -WRIST_LIMIT, WRIST_LIMIT);
      wantDeviate = clamp(Number.isFinite(d) ? d : 0, -WRIST_LIMIT, WRIST_LIMIT);
    },
    update(dt: number): void {
      // The wrist is eased and written every frame, outside the `settled`
      // short-circuit: the pose can be finished for minutes while the hand is
      // still being moved around the instrument, and a wrist that only updated
      // when the fingers did would lock the moment a player settled into a
      // groove — which is the exact moment anyone is looking at it.
      const wk = 1 - Math.exp(-dt / WRIST_TAU);
      extend += (wantExtend - extend) * wk;
      deviate += (wantDeviate - deviate) * wk;

      if (settled) {
        applyFlex();
        return;
      }
      const moved = ease(1 - Math.exp(-dt / POSE_TAU));
      apply(current);
      if (moved < 1e-4) settled = true;
    },
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
