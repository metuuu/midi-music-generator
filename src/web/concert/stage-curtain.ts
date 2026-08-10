/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The house tabs — a curtain that gathers.
 *
 * ## Why a shader and not a sliding rectangle
 *
 * A curtain that opens by translating two quads sideways reads as a door. The
 * whole visual payoff of a curtain is that the cloth does not go anywhere: it
 * *bunches*, the pleats deepen as the span shrinks, and by the time it is open
 * there are two heavy columns of fabric standing in the wings. That is the
 * moment the show starts, and it is worth one shader.
 *
 * ## Why a shader and not a cloth simulation
 *
 * Because the constraint that matters is arc length, and it is the only one.
 * A traveller curtain is cloth of fixed width hung from carriers that converge
 * along a track. As the carriers close up, the horizontal span `span` shrinks
 * but the cloth itself does not, so everything the cloth loses across the stage
 * it must gain in depth. Writing that down:
 *
 *     compression   c    = span / halfWidth
 *     pleat wave    z(t) = A · sin(k·t)          k = 2π · pleats / halfWidth
 *     arc length    ∫ √(c² + (A·k·cos)²) dt  =  ∫ 1 dt
 *
 * Approximating ⟨cos²⟩ = ½ over a whole number of pleats gives
 *
 *     A = √(2(1 − c²)) / k
 *
 * — which is the one line this file exists for. It is not a physical
 * simulation, it *is* the physics that matters, evaluated per vertex for free,
 * and it means the fold depth is never tuned by hand: it falls out of how far
 * the curtain has travelled.
 *
 * Because `pleats` is a whole number, `sin(k·t)` is zero at both edges, so the
 * leading edge stays vertical and the outer edge stays flat against the wall
 * without either being special-cased.
 *
 * ## What is layered on top
 *
 * Only what cloth does that arc length does not say: the hem hangs wider than
 * the track, the fabric lifts a little as it bunches, the bottom trails the top
 * while the track is moving, and it breathes when nothing else is happening.
 * The last one is idle motion and answers to `prefers-reduced-motion`.
 *
 * The material is a patched `MeshStandardMaterial` rather than a bespoke
 * `ShaderMaterial`, so the lighting rig's fixtures, the venue fog and any
 * shadow the stage receives all still apply. Normals are computed analytically
 * from the same derivative as the arc-length term — without that the folds are
 * a flat sheet with a wobbly outline, and the shading *is* the effect.
 */

import {
  DoubleSide, Group, Mesh, MeshStandardMaterial, PlaneGeometry, type IUniform,
} from 'three';

import type { Kit } from './stage-kit.js';

interface CurtainUniforms {
  uOpen: IUniform<number>;
  uHalfW: IUniform<number>;
  uHeight: IUniform<number>;
  uGather: IUniform<number>;
  uPleats: IUniform<number>;
  uSlack: IUniform<number>;
  uBase: IUniform<number>;
  uVel: IUniform<number>;
  uTime: IUniform<number>;
  uIdle: IUniform<number>;
}

const CURTAIN_CHUNK = /* glsl */ `
uniform float uOpen;
uniform float uHalfW;
uniform float uHeight;
uniform float uGather;
uniform float uPleats;
uniform float uSlack;
uniform float uBase;
uniform float uVel;
uniform float uTime;
uniform float uIdle;

// p.x runs 0 (leading edge, centre of the opening) .. uHalfW (fixed at the
// wing). p.y runs 0 (the track) .. -uHeight (the hem).
vec3 curtainDisplace(vec3 p, out vec3 nrm) {
  float v = clamp(-p.y / uHeight, 0.0, 1.0);

  // How much of its own width the cloth still spans.
  float span = mix(uHalfW, uGather, uOpen);
  float c = clamp(span / uHalfW, 0.02, 1.0);

  // Arc length is conserved; the depth of the folds is whatever that costs.
  float k = 6.2831853 * uPleats / uHalfW;
  float amp = uBase + uSlack * 1.4142136 * sqrt(max(0.0, 1.0 - c * c)) / k;
  amp *= 0.72 + 0.5 * v;             // hangs wider at the hem than at the track

  float phase = k * p.x;
  float sn = sin(phase);
  float cs = cos(phase);

  float x = (uHalfW - span) + c * p.x;
  float y = p.y + (1.0 - c) * v * 0.075 * uHeight;   // bunching lifts the hem
  float z = amp * sn;

  // While the track is moving the bottom trails it, and swings out.
  float drag = uVel * v * v;
  x -= drag * 0.5;
  z += abs(drag) * 0.35;

  // Idle breath. Calmed to nothing under prefers-reduced-motion.
  z += uIdle * 0.02 * uHeight * v * sin(uTime * 0.55 + p.x * 0.85);

  // Tangent along the cloth, normal ninety degrees off it in plan. (Not
  // called "tan" — that is a GLSL builtin and some drivers refuse to let a
  // variable hide one.)
  vec3 tng = normalize(vec3(c, 0.0, amp * k * cs));
  nrm = vec3(-tng.z, 0.0, tng.x);
  return vec3(x, y, z);
}
`;

function curtainMaterial(kit: Kit, colour: string): {
  material: MeshStandardMaterial; uniforms: CurtainUniforms;
} {
  const uniforms: CurtainUniforms = {
    uOpen: { value: 0 },
    uHalfW: { value: 1 },
    uHeight: { value: 1 },
    uGather: { value: 0.5 },
    uPleats: { value: 7 },
    uSlack: { value: 1 },
    uBase: { value: 0.03 },
    uVel: { value: 0 },
    uTime: { value: 0 },
    uIdle: { value: 1 },
  };

  const material = kit.own(new MeshStandardMaterial({
    color: colour,
    roughness: 0.95,
    metalness: 0,
    side: DoubleSide,
  }));

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${CURTAIN_CHUNK}`)
      .replace(
        '#include <beginnormal_vertex>',
        /* glsl */ `
        vec3 curtainNormal;
        vec3 curtainPos = curtainDisplace(position, curtainNormal);
        vec3 objectNormal = curtainNormal;
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3( tangent.xyz );
        #endif
        `,
      )
      .replace('#include <begin_vertex>', 'vec3 transformed = curtainPos;');
  };
  // Two curtain materials must not be handed each other's compiled program,
  // and two *ordinary* standard materials must not be handed this one. The
  // default cache key knows nothing about onBeforeCompile.
  material.customProgramCacheKey = () => 'concert-curtain';

  return { material, uniforms };
}

export interface CurtainOptions {
  kit: Kit;
  /** Clear width of the proscenium opening, in metres. */
  width: number;
  /** Track height above the boards. */
  height: number;
  /** Where the curtain line sits, in stage coordinates. */
  z: number;
  colour: string;
  /**
   * A pelmet across the top. Off for a black box.
   *
   * This said "hiding the track" for as long as there was no track to hide —
   * see the board in `buildCurtain`. There is one now, and the correction is
   * worth stating rather than quietly editing away: what the pelmet covers is
   * the carriers and the cloth's top edge hanging off them. It does not cover
   * the board, which stands 0.29 m above the pelmet's own top edge and is the
   * thing that masks the head of the opening. Turning this off loses the frill
   * and keeps the board.
   */
  valance?: boolean;
  reducedMotion?: boolean;
  /** Fewer segments on weak hardware. Fixed at build; see `StageRig`. */
  quality?: 'low' | 'medium' | 'high';
}

export interface CurtainRig {
  root: Group;
  /** Set the target. The cloth takes its own time getting there. */
  setOpen(target: number): void;
  /** Jump, for a state reset. No travel, no hem drag. */
  snap(value: number): void;
  /** Where the cloth actually is, 0 closed .. 1 fully gathered. */
  open(): number;
  /** Where it is heading. */
  target(): number;
  update(dt: number): void;
}

/** Smoothstep with a zero second derivative at both ends — heavy, not springy. */
function smoother(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export function buildCurtain(o: CurtainOptions): CurtainRig {
  const { kit } = o;
  const halfW = o.width / 2;
  const height = o.height;
  const pleats = Math.max(5, Math.round(halfW / 0.85));
  const gather = Math.min(halfW * 0.34, 0.55 + halfW * 0.1);
  const segX = o.quality === 'low' ? 40 : o.quality === 'medium' ? 56 : 76;
  const segY = o.quality === 'low' ? 6 : o.quality === 'medium' ? 10 : 14;

  const root = new Group();
  root.position.set(0, height, o.z);

  const { material, uniforms } = curtainMaterial(kit, o.colour);
  uniforms.uHalfW.value = halfW;
  uniforms.uHeight.value = height;
  uniforms.uGather.value = gather;
  uniforms.uPleats.value = pleats;
  // A little above the 1.0 that arc length alone would give: real cloth has
  // more fullness hung on the track than the span it covers, and folds that
  // are slightly too generous look like cloth where exact ones look like tin.
  uniforms.uSlack.value = 1.15;
  // The resting pleat is a fraction of the pleat *wavelength*, not an absolute
  // depth: a two-metre curtain with the same fold depth as an eight-metre one
  // is a corrugated sheet.
  uniforms.uBase.value = 0.045 * (halfW / pleats);
  uniforms.uIdle.value = o.reducedMotion ? 0 : 1;

  // One geometry, two meshes. The second is mirrored in x, which flips the
  // analytic normal through the normal matrix and the winding through the
  // renderer's own determinant check — so both halves gather outward from the
  // centre with no second shader and no second draw setup.
  const geo = kit.geometry(`curtain|${halfW}|${height}|${segX}|${segY}`, () => {
    const g = new PlaneGeometry(halfW, height, segX, segY);
    g.translate(halfW / 2, -height / 2, 0);
    return g;
  });

  for (const side of [1, -1]) {
    const half = new Mesh(geo, material);
    half.scale.x = side;
    // The band behind it is the thing that should be casting shadows, and a
    // curtain that casts one needs its displacement duplicated into the depth
    // material for no visible gain.
    half.castShadow = false;
    half.receiveShadow = true;
    half.renderOrder = 2;
    root.add(half);
  }

  /**
   * The track the cloth hangs from, which until now was not there at all.
   *
   * `CurtainOptions.valance` has described the pelmet as "hiding the track"
   * since the day it was written, and no track was ever built. `root` sits at
   * the head of the opening, both halves hang from local y = 0, and local y = 0
   * was empty air: a neighbour probe over every show that builds a pelmet found
   * it touching nothing — no bar, no board, no arch member, and not even the
   * cloth it laps, which hangs 0.12 m upstage of it. So the head of the curtain
   * was a 0.74 m strip of velvet with daylight over it, and a viewer who
   * dragged the lens above the arch — 5.99 m of drag ceiling against a 4.60 m
   * soffit in the 1968 ballroom — looked straight down at it.
   *
   * It is not only a drag bug, which is why the fix is a board rather than a
   * pipe nobody would see. Solving the composed shots against the lowest
   * downstage edge of the surround — the ballroom's architrave head at
   * `openingHeight`, the proscenium's header mould 0.02 m under it — puts the
   * top of frame between `openingHeight + 0.124` and `openingHeight + 0.278` at
   * the curtain's own plane across the eighteen shows that build a pelmet, the
   * worst of them jazz/modern's wide shot on the near-square pane `camera.ts`
   * documents. Against a pelmet whose top edge is at local +0.04 that is a
   * strip of unmasked void across the full width of the opening at the top of
   * frame; in the ballroom the rays through it clear the 6.59 m backdrop and
   * leave through the open top of the stage house, so what shows is the fogged
   * background — a black line above a lit pelmet, dead centre.
   *
   * 0.36 tall centred at +0.15 spans `height - 0.03 .. height + 0.33`. The top
   * is what closes that slot, with 0.05 m over the worst of the eighteen
   * framings. The bottom laps the cloth's top edge by 0.03 m so the join cannot
   * open a hairline, and it is the only part of this that reaches down into the
   * opening at all: 3.57 m over the boards in the shallowest arch either room
   * can build, which is 0.92 m clear of `HANG_FLOOR` and nowhere near anybody.
   *
   * 0.26 deep at local z = +0.08 spans -0.05..0.21, and that is two solves. The
   * back face is upstage of the cloth plane, so the halves hang from under the
   * board rather than beside it and the three pieces are one object. The front
   * face has to stand proud of the pelmet, and the pelmet is not flat: its fold
   * depth is `0.075 · (0.72 + 0.5v)`, so over the 0.07 m of it that laps the
   * board the deepest crest reaches 0.179. At 0.21 the cloth dies against a
   * face 0.03 m in front of it. At the 0.17 that a 0.22 m board would give, the
   * two are within 0.004 m and fight along the whole width of the opening,
   * which is trading one visible defect for another.
   *
   * `width + 2.0` is what a house tab track is anyway — the cloth has to be
   * able to dead-hang off-stage — and it is also the measured requirement. The
   * board stands 0.63–0.96 m upstage of the reveal, so the opening projects
   * wider than the board at the board's own plane, and the worst overrun a
   * composed shot asks for is 0.95 m. At +1.0 a side both ends die behind the
   * cheeks in every framing; `width + 1.6` leaves 0.35 m of board end showing
   * in the widest of them.
   *
   * `kit.solid` rather than the curtain material, which would run the
   * displacement shader over a plank. It is a board covered in the same velvet
   * as the tabs, which is what a pelmet board is.
   *
   * And it is built whether or not there is a valance over it. The pelmet is
   * decoration and a black box does without it; the track is structure, and
   * cloth hanging from nothing is wrong in a black box too. The three black
   * boxes escaped the report rather than the defect — their slot happens to
   * show a black backdrop through black masking.
   */
  const board = new Mesh(
    kit.bevelBox(o.width + 2.0, 0.36, 0.26, 0.04),
    kit.solid(o.colour, { rough: 0.95 }),
  );
  board.position.set(0, 0.15, 0.08);
  board.renderOrder = 2;
  root.add(board);

  // The valance is the same cloth permanently gathered: it never travels, so
  // its own uniforms hold uOpen at zero and lean on the resting pleat instead.
  // Its top edge sits 0.07 m inside the board above it, so the tack line is
  // covered from every angle rather than being a free edge in the air.
  if (o.valance !== false) {
    const v = curtainMaterial(kit, o.colour);
    v.uniforms.uHalfW.value = o.width;
    v.uniforms.uHeight.value = height * 0.16;
    v.uniforms.uGather.value = o.width;
    v.uniforms.uPleats.value = pleats * 2;
    v.uniforms.uSlack.value = 0;
    v.uniforms.uBase.value = 0.075;
    v.uniforms.uIdle.value = 0;
    const vg = kit.geometry(`valance|${o.width}|${height}`, () => {
      const g = new PlaneGeometry(o.width, height * 0.16, segX, 3);
      g.translate(o.width / 2, -height * 0.08, 0);
      return g;
    });
    const valance = new Mesh(vg, v.material);
    valance.position.set(-o.width / 2, 0.04, 0.12);
    valance.renderOrder = 3;
    root.add(valance);
  }

  // --- travel ------------------------------------------------------------
  let from = 0;
  let to = 0;
  let cur = 0;
  let t = 1;
  let dur = 1;
  let vel = 0;
  let time = 0;

  return {
    root,
    setOpen(next: number): void {
      const clamped = Number.isFinite(next) ? Math.max(0, Math.min(1, next)) : cur;
      if (Math.abs(clamped - to) < 1e-4) return;
      from = cur;
      to = clamped;
      t = 0;
      // A full traverse is deliberate and slow; a small correction is quick.
      dur = 0.9 + 2.4 * Math.abs(to - from);
    },
    snap(value: number): void {
      const clamped = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
      from = clamped; to = clamped; cur = clamped; t = 1; vel = 0;
      uniforms.uOpen.value = cur;
      uniforms.uVel.value = 0;
    },
    open(): number { return cur; },
    target(): number { return to; },
    update(dt: number): void {
      const d = Math.max(0, Math.min(dt, 0.1));
      time += d;
      if (t < 1) {
        t = Math.min(1, t + d / dur);
        const next = from + (to - from) * smoother(t);
        vel = d > 0 ? (next - cur) / d : 0;
        cur = next;
      } else {
        vel *= Math.max(0, 1 - d * 4);
      }
      uniforms.uOpen.value = cur;
      // Scaled into metres of hem lag, and capped so a tab-out spike cannot
      // fling the cloth across the stage.
      uniforms.uVel.value = Math.max(-1, Math.min(1, vel)) * halfW * 0.22;
      uniforms.uTime.value = time;
    },
  };
}
