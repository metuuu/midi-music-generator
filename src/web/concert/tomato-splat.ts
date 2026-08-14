/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The marks a tomato leaves on everything that is not a person.
 *
 * `PerformerRig.splat` already owns marks on bodies — it knows which part was
 * hit and can parent the mark to a head that is going to keep nodding. This
 * owns the other half: the boards, the backdrop, the walls, and the drum a
 * near miss went into. Same visual language, different host.
 *
 * ## What a splat is
 *
 * One mesh, one geometry, about twenty triangles: a jittered fan for the blob
 * and three tapered quads for the drips. No texture, no alpha, no decal
 * projection — this is the same cell-shaded strategy the rest of the stage
 * uses, and a projected decal would need the receiving geometry, which for a
 * curtain that moves is a different mesh every frame.
 *
 * The drips are the only animated part of the *geometry*, and they are animated
 * in the geometry rather than in a shader, because a shader uniform is per
 * material and these share one. Twelve vertices move, for about eight seconds,
 * and then the mark is static for the rest of the number. A splat that has
 * stopped growing costs exactly one draw call and no CPU.
 *
 * ## Being born
 *
 * A mark that switches on in one frame reads as a texture swap rather than as
 * something landing, so every mark spends its first hundred milliseconds
 * arriving: it comes in at just under half size, overshoots by about a tenth,
 * and settles. That is a write to `mesh.scale` and nothing else — see
 * `POP_SECONDS`.
 *
 * It is deliberately *not* an opacity ramp, which would read better and cannot
 * be had: every mark shares one material, so a per-mark alpha means a material
 * per mark, which means a program-cache entry and an upload per mark, on the
 * frame of impact. That is exactly the stall the warm-up in `prime` exists to
 * remove, and buying a nicer fade with it would be a bad trade.
 *
 * ## Gravity, for free
 *
 * A mark's local `-y` is world down projected onto the surface it landed on,
 * so a splat on a vertical backdrop runs straight down and one on the boards
 * does not run at all — `drip` falls out of `normal · up` rather than being a
 * flag anybody has to set.
 */

import {
  BufferAttribute, BufferGeometry, DoubleSide, DynamicDrawUsage, Group, Matrix4,
  Mesh, MeshStandardMaterial, Object3D, Quaternion, Vector3,
} from 'three';

import { Rng } from '../../core/rng.js';

/** Rim vertices in the blob. 14 verts, 14 triangles. */
const RIM = 14;
/** Drips per splat, whether or not the surface lets them run. */
const DRIPS = 3;
/** Seconds a drip takes to reach most of its length. */
const DRIP_TAU = 2.4;
/** After this the mark is static and stops costing anything. */
const DRIP_SECONDS = 8;

/**
 * Seconds a mark takes to arrive.
 *
 * Under about 60 ms it is indistinguishable from an instant quad and the whole
 * thing is wasted; over about 200 ms the mark is visibly inflating after the
 * tomato that made it has already gone, which reads as a bubble rather than as
 * a splash. 110 ms is six or seven frames, which is enough to see and short
 * enough that it still belongs to the impact.
 */
const POP_SECONDS = 0.11;
/**
 * Where the mark starts, as a fraction of its settled size.
 *
 * Not 0. A mark that starts at nothing spends its first frames as a few
 * sub-pixel triangles, which is a frame of *nothing* followed by a mark, and
 * that is the instant quad again with extra steps.
 */
const POP_FROM = 0.42;
/** How far past full size it goes on the way. Thrown fluid overshoots. */
const POP_OVERSHOOT = 0.16;

/**
 * How far a mark floats off its surface: this, plus `LIFT_PER_RADIUS` of its
 * own radius.
 *
 * The polygon offset on the material handles the depth *test*. This handles the
 * geometry, which the depth test cannot: a mark is flat and a drum shell is
 * not, so a 12 cm blob laid tangent to a 20 cm shell has its rim about six
 * millimetres inside the drum, and it comes out as a ring of holes. Scaling the
 * lift by the mark's own radius covers that, and leaves a small mark on the
 * flat boards pressed where it belongs — a fixed lift big enough for the drum
 * would make every mark on the boards a hovering sticker.
 *
 * It only covers marks that are small against what they landed on, which is all
 * of them at the sizes `tomatoes.ts` asks for. A mark as wide as its host would
 * still clip, and no lift fixes that: the fix is a projected decal, and the
 * reason there is not one is at the top of this file.
 */
const LIFT = 0.003;
const LIFT_PER_RADIUS = 0.05;

const VERTS = 1 + RIM + DRIPS * 4;
const TRIS = RIM + DRIPS * 2;

export interface SplatStats {
  /** Marks currently on the stage. */
  live: number;
  cap: number;
  objects: number;
  triangles: number;
}

export interface SplatField {
  /** Marks with no host of their own live here. Add it to the scene once. */
  root: Group;
  /**
   * Build every slot now, and put them where a renderer will see them.
   *
   * Marks used to be built on the frame a tomato landed, which is the frame
   * with the least room for it: a `BufferGeometry`, two typed arrays and an
   * index buffer are the cheap half, and the expensive half is that the
   * material has never been compiled and the buffers have never been uploaded.
   * Both happen inside the first `render` that sees the mesh — so the audience
   * saw a stutter at the moment of impact, every first impact, which reads as
   * the throw being broken rather than as a frame drop.
   *
   * `prime` moves that cost to wherever the show runner calls it, which is
   * behind a closed curtain. The primed meshes are degenerate — every vertex at
   * the origin, so they draw nothing — and `frustumCulled` is already false, so
   * they reach the renderer whatever the camera is doing.
   *
   * Idempotent, and safe to call every `begin`.
   */
  prime(): void;
  /**
   * Take the primed meshes back out of the scene. Call a frame or two after
   * `prime`, once they have been drawn.
   */
  cool(): void;
  /**
   * Leave a mark. `normal` points away from the surface; `size` is the blob's
   * radius in metres — the caller is expected to vary it with how hard the
   * tomato arrived, since a mark that is the same size however it got there is
   * the single most obvious tell that this is a decal. `host`, when given, is
   * what the mark is parented to so it travels with a moving instrument.
   *
   * The mark is not full size when this returns: it arrives over the next
   * hundred milliseconds of `update`. See `POP_SECONDS`.
   *
   * Past the cap the oldest mark is recycled, geometry and all. Nothing is
   * allocated after `prime()`, so neither the first throw nor a very determined
   * audience can grow the scene or build a mesh mid-frame.
   */
  place(point: Vector3, normal: Vector3, size: number, host?: Object3D): void;
  /** Grows the drips. `dt` in seconds; a non-finite one is ignored. */
  update(dt: number): void;
  /** Struck between numbers. Every mark leaves, wherever it was parented. */
  clear(): void;
  stats(): SplatStats;
  dispose(): void;
}

interface Slot {
  mesh: Mesh;
  geo: BufferGeometry;
  pos: Float32Array;
  attr: BufferAttribute;
  /** Where each drip starts, in the blob's own frame. */
  baseX: Float32Array;
  baseY: Float32Array;
  halfWidth: Float32Array;
  length: Float32Array;
  age: number;
  /** 0 on a floor, 1 on a wall. Scales how far the drips run. */
  drip: number;
  growing: boolean;
  /** Still arriving. Cleared once the pop has settled, so it stops costing. */
  popping: boolean;
  /**
   * The scale the mark settles at.
   *
   * Not always 1: `attach` re-derives the local transform from the world one,
   * so a mark hung on a host with a scaled ancestor lands with a compensating
   * scale of its own. The pop multiplies this rather than replacing it, which
   * is the difference between a mark that grows into place and one that snaps
   * to the wrong size the first time `update` touches it.
   */
  restScale: Vector3;
  /**
   * Whether this slot is carrying a mark somebody threw.
   *
   * Not the same question as "is it parented", which it used to be: `prime`
   * parents every slot to warm it up, and a warm-up mesh is not a splat. The
   * budget in `TomatoStats` counts marks, so it has to ask this instead.
   */
  used: boolean;
}

export interface SplatOptions {
  /** Marks on stage at once. Performer bodies keep their own, capped at 8. */
  cap?: number;
  /** Every jitter in every blob derives from this. */
  seed?: string;
  colour?: string;
}

const UP = new Vector3(0, 1, 0);
const V1 = new Vector3();
const V2 = new Vector3();
const V3 = new Vector3();
const M1 = new Matrix4();
const Q1 = new Quaternion();

export function createSplatField(o: SplatOptions = {}): SplatField {
  const cap = Math.max(1, Math.round(o.cap ?? 24));
  const rng = new Rng(o.seed ?? 'splat');
  const root = new Group();
  root.name = 'tomato-splats';

  const material = new MeshStandardMaterial({
    color: o.colour ?? '#a8140c',
    roughness: 0.38,
    metalness: 0,
    side: DoubleSide,
    // A mark sits on a surface, and a surface is exactly where the depth
    // buffer is most ambiguous. Offset rather than a bigger lift off the
    // surface, which reads as a sticker hovering a centimetre out.
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });

  const slots: Slot[] = [];
  let next = 0;

  function build(): Slot {
    const pos = new Float32Array(VERTS * 3);
    const attr = new BufferAttribute(pos, 3);
    attr.setUsage(DynamicDrawUsage);
    const geo = new BufferGeometry();
    geo.setAttribute('position', attr);

    const index: number[] = [];
    for (let i = 0; i < RIM; i++) index.push(0, 1 + i, 1 + ((i + 1) % RIM));
    for (let d = 0; d < DRIPS; d++) {
      const b = 1 + RIM + d * 4;
      index.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    geo.setIndex(index);

    const mesh = new Mesh(geo, material);
    mesh.renderOrder = 3;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = false;
    // Invisible to a ray. `tomatoes.ts` traces the thing a tomato hit to find
    // the surface it should stick to, and a mark already hanging on that
    // surface is nearer the camera than the surface is — so the second tomato
    // into a drum would land on the first one's blob and creep outward from
    // there, a millimetre at a time, for as long as the audience kept throwing.
    mesh.raycast = () => {};

    return {
      mesh, geo, pos, attr,
      baseX: new Float32Array(DRIPS),
      baseY: new Float32Array(DRIPS),
      halfWidth: new Float32Array(DRIPS),
      length: new Float32Array(DRIPS),
      age: 0, drip: 0, growing: true, popping: false, used: false,
      restScale: new Vector3(1, 1, 1),
    };
  }

  /**
   * The next slot to write, oldest first once the cap is reached.
   *
   * Never allocates: `prime` has already built all of them. It is still written
   * defensively — a caller that skipped `prime` gets a mark rather than a
   * crash, and pays for it once.
   */
  function take(): Slot {
    if (slots.length < cap) {
      const slot = build();
      slots.push(slot);
      return slot;
    }
    const slot = slots[next % cap]!;
    next++;
    slot.mesh.removeFromParent();
    return slot;
  }

  return {
    root,

    prime() {
      while (slots.length < cap) slots.push(build());
      for (const slot of slots) {
        if (slot.used) continue;
        // Every vertex at the origin: zero-area triangles, which the rasteriser
        // throws away and the driver still has to have compiled a program for.
        slot.pos.fill(0);
        slot.attr.needsUpdate = true;
        slot.mesh.position.set(0, 0, 0);
        slot.mesh.quaternion.identity();
        slot.mesh.scale.set(1, 1, 1);
        slot.growing = false;
        slot.popping = false;
        root.add(slot.mesh);
      }
    },

    cool() {
      for (const slot of slots) if (!slot.used) slot.mesh.removeFromParent();
    },

    place(point, normal, size, host) {
      if (!finite3(point) || !Number.isFinite(size)) return;
      const r = Math.max(0.01, Math.min(size, 1));
      V1.copy(normal);
      if (!finite3(V1) || V1.lengthSq() < 1e-9) V1.set(0, 1, 0);
      V1.normalize();

      const slot = take();

      // --- the frame the mark lives in -------------------------------------
      // +z is the surface normal, +y is surface-up. On a floor there is no
      // surface-up, so any perpendicular will do and the drips are zero
      // anyway.
      V2.copy(UP).addScaledVector(V1, -UP.dot(V1));
      if (V2.lengthSq() < 1e-6) V2.set(1, 0, 0).addScaledVector(V1, -V1.x);
      if (V2.lengthSq() < 1e-6) V2.set(0, 0, 1).addScaledVector(V1, -V1.z);
      V2.normalize();
      V3.crossVectors(V2, V1).normalize();
      M1.makeBasis(V3, V2, V1);
      Q1.setFromRotationMatrix(M1);

      slot.drip = Math.min(1, Math.max(0, 1 - Math.abs(V1.dot(UP))));
      slot.age = 0;
      slot.growing = true;
      slot.popping = true;
      slot.used = true;

      // --- the blob --------------------------------------------------------
      const p = slot.pos;
      p[0] = 0; p[1] = 0; p[2] = 0;
      const spin = rng.float(0, Math.PI * 2);
      // A splat is wider across than down: it arrived travelling, not dropped.
      const squashY = rng.float(0.74, 0.94);
      for (let i = 0; i < RIM; i++) {
        const a = spin + (i / RIM) * Math.PI * 2;
        const rr = r * rng.float(0.58, 1);
        const k = (1 + i) * 3;
        p[k] = Math.cos(a) * rr;
        p[k + 1] = Math.sin(a) * rr * squashY;
        p[k + 2] = 0;
      }

      // --- the drips -------------------------------------------------------
      for (let d = 0; d < DRIPS; d++) {
        // Anchored on the lower rim, where the pulp actually gathers.
        const a = -Math.PI / 2 + rng.float(-0.85, 0.85);
        const rr = r * rng.float(0.55, 0.9);
        slot.baseX[d] = Math.cos(a) * rr;
        slot.baseY[d] = Math.sin(a) * rr * squashY;
        slot.halfWidth[d] = r * rng.float(0.10, 0.20);
        slot.length[d] = r * rng.float(1.1, 2.6) * slot.drip;
      }
      writeDrips(slot, 0);
      slot.attr.needsUpdate = true;
      slot.geo.computeBoundingSphere();

      // --- hang it ---------------------------------------------------------
      const mesh = slot.mesh;
      mesh.position.copy(point).addScaledVector(V1, LIFT + r * LIFT_PER_RADIUS);
      mesh.quaternion.copy(Q1);
      mesh.scale.set(1, 1, 1);
      if (host) {
        // `attach` re-parents while preserving the world transform, which is
        // what puts a mark on a trombone that is going to move.
        host.updateWorldMatrix(true, false);
        host.attach(mesh);
      } else {
        root.add(mesh);
      }
      // After the parenting, never before: `attach` may have written a scale of
      // its own, and that scale is what the pop is a fraction of.
      slot.restScale.copy(mesh.scale);
      mesh.scale.copy(slot.restScale).multiplyScalar(popScale(0));
    },

    update(dt) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      const step = Math.min(dt, 0.1);
      for (const slot of slots) {
        if (!slot.used || !slot.mesh.parent) continue;
        if (!slot.growing && !slot.popping) continue;
        slot.age += step;
        if (slot.popping) {
          // Two multiplies and a write to a transform. No allocation, and it
          // stops entirely after a tenth of a second.
          slot.mesh.scale.copy(slot.restScale).multiplyScalar(popScale(slot.age));
          if (slot.age >= POP_SECONDS) slot.popping = false;
        }
        if (!slot.growing) continue;
        if (slot.age >= DRIP_SECONDS) slot.growing = false;
        writeDrips(slot, slot.age);
        slot.attr.needsUpdate = true;
      }
    },

    clear() {
      for (const slot of slots) {
        slot.mesh.removeFromParent();
        slot.growing = false;
        slot.popping = false;
        slot.used = false;
      }
      next = 0;
    },

    stats() {
      let live = 0;
      for (const slot of slots) if (slot.used && slot.mesh.parent) live++;
      return { live, cap, objects: live, triangles: live * TRIS };
    },

    dispose() {
      for (const slot of slots) {
        slot.mesh.removeFromParent();
        slot.geo.dispose();
      }
      slots.length = 0;
      material.dispose();
      root.removeFromParent();
    },
  };
}

/**
 * How big a mark is, as a fraction of its settled size, `age` seconds in.
 *
 * Out-cubic to full size with a half-sine laid over it, so it arrives fast,
 * passes about a tenth over, and comes back — and lands on exactly 1 at
 * `POP_SECONDS` rather than near it, because a mark that settles at 0.998 of
 * its size is a mark whose rim moves for the rest of the number.
 */
function popScale(age: number): number {
  if (!(age > 0)) return POP_FROM;
  if (age >= POP_SECONDS) return 1;
  const t = age / POP_SECONDS;
  const eased = 1 - (1 - t) ** 3;
  return POP_FROM + (1 - POP_FROM) * eased + POP_OVERSHOOT * Math.sin(Math.PI * t);
}

/** Ease the drips out to length. Twelve vertices, and only while growing. */
function writeDrips(slot: Slot, age: number): void {
  const grown = 1 - Math.exp(-age / DRIP_TAU);
  const p = slot.pos;
  for (let d = 0; d < DRIPS; d++) {
    const bx = slot.baseX[d]!;
    const by = slot.baseY[d]!;
    const w = slot.halfWidth[d]!;
    const len = slot.length[d]! * grown;
    const k = (1 + RIM + d * 4) * 3;
    // Two verts on the rim, two at the running end, tapered.
    p[k] = bx - w; p[k + 1] = by; p[k + 2] = 0;
    p[k + 3] = bx + w; p[k + 4] = by; p[k + 5] = 0;
    p[k + 6] = bx + w * 0.4; p[k + 7] = by - len; p[k + 8] = 0;
    p[k + 9] = bx - w * 0.4; p[k + 10] = by - len; p[k + 11] = 0;
  }
}

function finite3(v: Vector3): boolean {
  return Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
}

/** Triangles in one mark. Exported so the budget can be asserted, not guessed. */
export const SPLAT_TRIANGLES = TRIS;
