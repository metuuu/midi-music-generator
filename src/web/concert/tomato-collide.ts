/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * What a tomato can hit, and when it hits it.
 *
 * Three shapes and one query. The shapes are chosen for what is actually on
 * this stage rather than for generality: a person is a sphere on a capsule, an
 * instrument is a box, and so is a wall. Nothing here knows about three.js
 * beyond `Vector3` and `Object3D`, and nothing here allocates — the query runs
 * per flying tomato per physics substep, and a `new Vector3()` in that path is
 * a stutter every few seconds rather than a wrong answer, which is worse.
 *
 * ## Why a swept test rather than a point test
 *
 * A tomato covers about 16 cm per 60Hz frame and a head is 26 cm across, so a
 * point test at frame boundaries misses roughly a third of the head hits at
 * that speed and *all* of them on a slow frame. Every query here is a segment
 * against a shape inflated by the tomato's radius — the Minkowski sum — so the
 * result does not depend on the frame rate. Corners come out sharp rather than
 * rounded, which is wrong by at most the tomato's radius on a box edge and is
 * not worth a rounded-box solve.
 *
 * ## The one approximation worth knowing about
 *
 * Everything is static within a substep. The band moves — a nodding head
 * travels a couple of centimetres — and the shapes are refreshed each frame
 * from the rig's own transform, but within a 8ms substep a performer is a
 * fixed capsule. At tomato speeds the relative error is under a millimetre.
 */

import type { Object3D, Vector3 } from 'three';

/** A thing that stops a tomato. */
export type Shape =
  /** A head. */
  | { kind: 'sphere'; centre: Vector3; radius: number }
  /** A torso: the segment `a`..`b` thickened. */
  | { kind: 'capsule'; a: Vector3; b: Vector3; radius: number }
  /** An instrument, a riser, a wall, the boards. World-axis-aligned. */
  | { kind: 'box'; min: Vector3; max: Vector3 };

/**
 * What a hit *means*, which is the only reason this is not just geometry.
 *
 *   performer   the player. Scores in full, and the rig owns the mark.
 *   instrument  their kit. Scores against the same player, at a discount — see
 *               `INSTRUMENT_COST` in `tomatoes.ts` for why a bass drum is worth
 *               less than a face. The mark stays on the kit.
 *   scenery     the boards, the backdrop, the walls. Just a mark.
 */
export type TargetKind = 'performer' | 'instrument' | 'scenery';

export interface Target {
  kind: TargetKind;
  shape: Shape;
  /** The player this is, or the player whose instrument this is. */
  performerId?: string;
  /**
   * What a mark should be parented to, so it travels with the thing it is on.
   * Absent means the mark is pinned in world space, which is right for the
   * boards and wrong for a trombone.
   */
  node?: Object3D;
  /** For scene dumps and test failures. Never shown to anybody. */
  label: string;
}

export interface Impact {
  /** Fraction along the queried segment, 0..1. */
  t: number;
  point: Vector3;
  /** Unit, pointing away from the surface. A mark faces along it. */
  normal: Vector3;
  target: Target;
}

// ---------------------------------------------------------------------------
// Scratch.
// ---------------------------------------------------------------------------

const D = { x: 0, y: 0, z: 0 };
const P = { x: 0, y: 0, z: 0 };
const N = { x: 0, y: 0, z: 0 };
const EPS = 1e-12;

/**
 * The earliest thing the segment `from`..`to` hits, for a sphere of `radius`.
 *
 * Writes into `out` and returns whether anything was hit, so that a caller in
 * the frame path never allocates. `out.target` is the caller's own `Target`
 * object, not a copy — do not retain it past the frame.
 */
export function sweep(
  from: Vector3,
  to: Vector3,
  radius: number,
  targets: readonly Target[],
  out: Impact,
): boolean {
  D.x = to.x - from.x;
  D.y = to.y - from.y;
  D.z = to.z - from.z;
  if (!Number.isFinite(D.x + D.y + D.z)) return false;

  let bestT = Number.POSITIVE_INFINITY;
  let best: Target | undefined;
  let bnx = 0; let bny = 1; let bnz = 0;

  for (const target of targets) {
    const s = target.shape;
    let t = -1;
    if (s.kind === 'sphere') {
      t = hitSphere(from, s.centre, s.radius + radius);
    } else if (s.kind === 'capsule') {
      t = hitCapsule(from, s.a, s.b, s.radius + radius);
    } else {
      t = hitBox(from, s.min, s.max, radius);
    }
    if (t < 0 || t > 1 || t >= bestT) continue;

    // The normal, computed only for the shape that is actually winning so far.
    P.x = from.x + D.x * t;
    P.y = from.y + D.y * t;
    P.z = from.z + D.z * t;
    if (s.kind === 'sphere') {
      normalise(P.x - s.centre.x, P.y - s.centre.y, P.z - s.centre.z);
    } else if (s.kind === 'capsule') {
      closestOnSegment(s.a, s.b, P.x, P.y, P.z);
      normalise(P.x - N.x, P.y - N.y, P.z - N.z);
    } else {
      // `hitBox` left the entry face in N.
    }
    bestT = t;
    best = target;
    bnx = N.x; bny = N.y; bnz = N.z;
  }

  if (!best) return false;
  out.t = bestT;
  out.point.set(from.x + D.x * bestT, from.y + D.y * bestT, from.z + D.z * bestT);
  out.normal.set(bnx, bny, bnz);
  out.target = best;
  return true;
}

/** A vector of unit length in `N`, or `+y` if the input was degenerate. */
function normalise(x: number, y: number, z: number): void {
  const l = Math.sqrt(x * x + y * y + z * z);
  if (!(l > EPS)) { N.x = 0; N.y = 1; N.z = 0; return; }
  N.x = x / l; N.y = y / l; N.z = z / l;
}

/** The point on `a`..`b` nearest `(px,py,pz)`, into `N`. */
function closestOnSegment(a: Vector3, b: Vector3, px: number, py: number, pz: number): void {
  const bx = b.x - a.x; const by = b.y - a.y; const bz = b.z - a.z;
  const len = bx * bx + by * by + bz * bz;
  let u = len > EPS ? ((px - a.x) * bx + (py - a.y) * by + (pz - a.z) * bz) / len : 0;
  u = u < 0 ? 0 : u > 1 ? 1 : u;
  N.x = a.x + bx * u; N.y = a.y + by * u; N.z = a.z + bz * u;
}

/** Segment against a sphere of radius `r`. Returns `t`, or -1. */
function hitSphere(from: Vector3, c: Vector3, r: number): number {
  const fx = from.x - c.x; const fy = from.y - c.y; const fz = from.z - c.z;
  const a = D.x * D.x + D.y * D.y + D.z * D.z;
  if (a < EPS) return -1;
  const b = 2 * (fx * D.x + fy * D.y + fz * D.z);
  const cc = fx * fx + fy * fy + fz * fz - r * r;
  const disc = b * b - 4 * a * cc;
  if (disc < 0) return -1;
  const root = Math.sqrt(disc);
  const t0 = (-b - root) / (2 * a);
  // A segment that starts inside is not a hit: see the arming distance in
  // `tomatoes.ts`. Reporting one would splat the thrower's own camera.
  return t0 >= 0 ? t0 : -1;
}

/**
 * Segment against a capsule. Body first, then the two caps.
 *
 * The quadratic degenerates when the segment runs along the axis, which for a
 * torso means a tomato dropped straight down the spine — rare, and handled by
 * falling through to the cap tests rather than by dividing by zero.
 */
function hitCapsule(from: Vector3, a: Vector3, b: Vector3, r: number): number {
  const bax = b.x - a.x; const bay = b.y - a.y; const baz = b.z - a.z;
  const oax = from.x - a.x; const oay = from.y - a.y; const oaz = from.z - a.z;
  const baba = bax * bax + bay * bay + baz * baz;
  const bard = bax * D.x + bay * D.y + baz * D.z;
  const baoa = bax * oax + bay * oay + baz * oaz;
  const rdoa = D.x * oax + D.y * oay + D.z * oaz;
  const oaoa = oax * oax + oay * oay + oaz * oaz;

  const qa = baba * (D.x * D.x + D.y * D.y + D.z * D.z) - bard * bard;
  const qb = baba * rdoa - baoa * bard;
  const qc = baba * (oaoa - r * r) - baoa * baoa;
  if (Math.abs(qa) > EPS) {
    const h = qb * qb - qa * qc;
    if (h >= 0) {
      const t = (-qb - Math.sqrt(h)) / qa;
      const y = baoa + t * bard;
      if (t >= 0 && y > 0 && y < baba) return t;
    }
  }
  // Caps.
  let best = -1;
  for (let end = 0; end < 2; end++) {
    const ex = end === 0 ? a.x : b.x;
    const ey = end === 0 ? a.y : b.y;
    const ez = end === 0 ? a.z : b.z;
    const t = hitSphereAt(from, ex, ey, ez, r);
    if (t >= 0 && (best < 0 || t < best)) best = t;
  }
  return best;
}

function hitSphereAt(from: Vector3, cx: number, cy: number, cz: number, r: number): number {
  const fx = from.x - cx; const fy = from.y - cy; const fz = from.z - cz;
  const a = D.x * D.x + D.y * D.y + D.z * D.z;
  if (a < EPS) return -1;
  const b = 2 * (fx * D.x + fy * D.y + fz * D.z);
  const cc = fx * fx + fy * fy + fz * fz - r * r;
  const disc = b * b - 4 * a * cc;
  if (disc < 0) return -1;
  const t0 = (-b - Math.sqrt(disc)) / (2 * a);
  return t0 >= 0 ? t0 : -1;
}

/**
 * Segment against a box grown by `pad` on every side. Slab method.
 *
 * Leaves the entry face's outward normal in `N`, because working it out
 * afterwards from the hit point means comparing floats against a box face and
 * picking the wrong one on an exact edge.
 */
function hitBox(from: Vector3, min: Vector3, max: Vector3, pad: number): number {
  let tmin = 0;
  let tmax = 1;
  let axis = -1;
  let sign = 1;

  for (let i = 0; i < 3; i++) {
    const o = i === 0 ? from.x : i === 1 ? from.y : from.z;
    const d = i === 0 ? D.x : i === 1 ? D.y : D.z;
    const lo = (i === 0 ? min.x : i === 1 ? min.y : min.z) - pad;
    const hi = (i === 0 ? max.x : i === 1 ? max.y : max.z) + pad;
    if (Math.abs(d) < 1e-9) {
      if (o < lo || o > hi) return -1;
      continue;
    }
    const inv = 1 / d;
    let t1 = (lo - o) * inv;
    let t2 = (hi - o) * inv;
    let s = -1;
    if (t1 > t2) { const swap = t1; t1 = t2; t2 = swap; s = 1; }
    if (t1 > tmin) { tmin = t1; axis = i; sign = s; }
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return -1;
  }
  // Started inside: not a hit, for the same reason as the sphere.
  if (axis < 0) return -1;
  N.x = axis === 0 ? sign : 0;
  N.y = axis === 1 ? sign : 0;
  N.z = axis === 2 ? sign : 0;
  return tmin;
}
