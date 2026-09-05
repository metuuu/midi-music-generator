/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The beams — the part of a lighting rig you can actually see.
 *
 * A spotlight with nothing in front of it is a bright patch on the floor.
 * Every argument in `concert/lighting.ts` about isolation, about a solo being
 * a statement, about a drum chorus lighting one player, assumes an audience can
 * see the *cone*. So the beams are not decoration on top of the lighting; they
 * are half of it, and `LightingScore.haze` is the fixture budget's other half.
 *
 * ## Why a cone mesh and not volumetrics
 *
 * Real volumetric scattering means ray-marching the depth buffer per fixture
 * per pixel, and on the integrated graphics this feature targets that is the
 * whole frame budget for something an analytic cone approximates to within a
 * hair. The cone is also *better behaved*: it never flickers under temporal
 * reprojection, it costs the same whether the camera is in the beam or not, and
 * it can be tuned by a person rather than by a scattering coefficient.
 *
 * ## How a cone reads as air
 *
 * The mesh is a closed frustum and it is only a trigger. The shader ignores
 * where on the surface a fragment landed and solves the view ray against the
 * frustum itself, in the unit cone's own space, for the chord between where
 * the ray enters the haze and where it leaves. That length is the brightness:
 * long through the middle, nothing at the silhouette, a whole throw of haze
 * when the camera is in the beam looking along it. Raising it, as a fraction
 * of the cone's width there, to a power sharpens the core. The cone's edge is
 * a penumbra rather than a wall: looking along the beam a ray just inside the
 * silhouette still runs the whole throw, and without `EDGE` the beam ended in
 * a hard sixteen-sided disc wherever a shot looked down it.
 *
 * Side-on the faceted surface normal says the same thing with the
 * tessellation's grain on it, which is wanted: it is what stops a beam being
 * an airbrushed cone, and it coarsens with the segment count. It is mixed in by
 * how much the ray crosses the beam rather than runs down it, which is exactly
 * how far the surface can be trusted, and not at all from inside.
 *
 * Only the surface nearest the camera draws, and it draws the whole chord.
 * The depth test then asks the one question a beam can answer without a depth
 * buffer, whether something stands in front of it; when the far wall drew its
 * share as well, a back wall or a player the beam ran into cut a hard-edged
 * hole out of the haze. From inside there is no near surface, so the far one
 * draws with the depth test off. Deep inside a beam the whole frame is a chord of haze,
 * which at the density ambient asks for is a whiteout; `INSIDE_MOST` is the
 * most a beam adds once the camera is well inside it, ramping back to the
 * outside level over the outer half of the radius.
 *
 * A beam spreads, so the same light thins along the throw, and the alpha
 * reaches zero at the end rather than stopping at a rim. The far end is cut
 * level with the floor the beam lands on, a shear on the unit cone, so nothing
 * dives under the boards and the end is a pool rather than a tilted disc.
 *
 * ## Cost
 *
 * One closed frustum, one height segment: `segments * 4` triangles. Sixteen
 * segments is 64 triangles and one draw call per beam. The expense is fill,
 * not geometry, which is why the quality tiers cut the *number* of beams and
 * not their tessellation until the bottom tier.
 *
 * ## Colour space
 *
 * `ShaderMaterial` output does not go through three's automatic linear-to-sRGB
 * conversion (only the built-in materials carry that chunk), so the uniform is
 * fed the sRGB values rather than the working-space ones. `stage.ts`'s haze
 * cards take the same shortcut; this one converts explicitly so the beam is the
 * colour the gel says it is.
 */

import {
  AdditiveBlending, Color, CylinderGeometry, DoubleSide, Matrix4, Mesh, PlaneGeometry,
  ShaderMaterial, Vector3, type BufferGeometry, type Camera, type PerspectiveCamera,
} from 'three';

import type { Kit } from './stage-kit.js';

/** Local axis the unit cone points along: apex at the origin, spreading down. */
const AXIS = new Vector3(0, -1, 0);

/**
 * The mouth's radius as a fraction of the wide end — the lens, not a point.
 * The geometry and the shader both need it, so neither gets to spell it twice.
 */
const MOUTH = 0.045;

/** The most a beam adds to a pixel once the camera stands well inside it. */
const INSIDE_MOST = 0.3;

/** Where the beam starts fading toward its edge, as a fraction of the radius; the follow spot's penumbra. */
const EDGE = 0.65;

/** Beams within this of horizontal keep a square end; the level cut runs away. */
const LEVEL_MIN_DROP = 0.3;

const scratchDir = new Vector3();
const scratchScale = new Vector3();
const scratchRot = new Matrix4();

export interface Beam {
  readonly mesh: Mesh;
  /**
   * Point the cone from `from` to `to`, spreading to `halfAngle` radians. The
   * far end is cut level through `to`, which every caller puts on the floor.
   */
  aim(from: Vector3, to: Vector3, halfAngle: number): void;
  /** Gel and density. `alpha` 0 makes it invisible without removing it. */
  set(colour: Color, alpha: number): void;
  /** Swap tessellation when the quality tier changes. */
  setSegments(segments: number): void;
}

export interface BeamOptions {
  /** How hard the core is. 1.2 is a soft glow, 2.2 is a defined shaft. */
  sharpness?: number;
  /** Render order. Beams draw after the stage's own haze cards. */
  order?: number;
}

/**
 * A closed unit frustum with its mouth at the local origin, spreading along
 * -y to y = -1.
 *
 * Not a `ConeGeometry`: a cylinder with a small top radius gives the beam a
 * lens-sized mouth instead of a mathematical point, which is what stops the
 * first few centimetres out of the lantern looking like a needle. Closed,
 * because a ray leaving through an open end had nothing to draw the haze in
 * front of it on. Cached on the kit by segment count.
 */
function beamGeometry(kit: Kit, segments: number): BufferGeometry {
  return kit.geometry(`beam|${segments}`, () => {
    const g = new CylinderGeometry(MOUTH, 1, 1, segments, 1, false);
    g.translate(0, -0.5, 0);
    return g;
  });
}

const VERTEX = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vNormalV;
  varying vec3 vPosV;
  varying vec3 vAxisV;
  varying float vCap;
  void main() {
    vLocal = position;
    // The end caps carry no grain: their normal has nothing to do with the haze.
    vCap = abs(normal.y) > 0.95 ? 1.0 : 0.0;
    vNormalV = normalMatrix * normal;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vPosV = mv.xyz;
    vAxisV = (modelViewMatrix * vec4(0.0, -1.0, 0.0, 0.0)).xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColour;
  uniform float uAlpha;
  uniform float uSharp;
  uniform vec3 uCam;      // the camera, in the unit frustum's space
  uniform float uRadius;  // the wide end, metres
  uniform float uNear;    // the camera's near plane, metres
  varying vec3 vLocal;
  varying vec3 vNormalV;
  varying vec3 vPosV;
  varying vec3 vAxisV;
  varying float vCap;

  const float M = ${MOUTH.toFixed(3)};
  const float K = ${(1 - MOUTH).toFixed(3)};
  const float FAR = 1.0e6;

  float radiusAt(float y) { return M - K * y; }
  float dilute(float t) { return 1.0 - pow(clamp(t, 0.0, 1.0), 1.25); }

  void main() {
    float dist = length(vPosV);
    if (dist < 1e-5) discard;
    // The ray in unit space: s = 0 is the camera, s = 1 is this fragment.
    vec3 c = uCam;
    vec3 d = vLocal - c;

    // The slab between the mouth plane and the far cut.
    float sa = -FAR, sb = FAR;
    if (abs(d.y) > 1e-7) {
      float p = (-1.0 - c.y) / d.y;
      float q = -c.y / d.y;
      sa = min(p, q);
      sb = max(p, q);
    } else if (c.y < -1.0 || c.y > 0.0) {
      sb = -FAR;
    }

    // The cone, x^2 + z^2 <= radiusAt(y)^2, as a quadratic in s. Roots in the
    // stable form, because a ray grazing the cone's own angle makes A tiny.
    float rc = radiusAt(c.y);
    float A = d.x * d.x + d.z * d.z - K * K * d.y * d.y;
    float B = c.x * d.x + c.z * d.z + K * d.y * rc;
    float C = c.x * c.x + c.z * c.z - rc * rc;
    float lo, hi;
    float disc2 = B * B - A * C;
    if (A > 1e-7 && disc2 < 0.0) {
      // The ray misses the cone. A fragment on its surface never gets here.
      lo = FAR; hi = -FAR;
    } else if (abs(A) > 1e-7) {
      float disc = sqrt(max(disc2, 0.0));
      float qq = -(B + (B >= 0.0 ? disc : -disc));
      float rA = qq / A;
      float rB = abs(qq) > 1e-12 ? C / qq : rA;
      float r1 = min(rA, rB), r2 = max(rA, rB);
      if (A > 0.0) {
        lo = r1; hi = r2;
      } else if (d.y < 0.0) {
        // The direction is within the cone's angle: the ray is inside
        // everywhere but between the roots, and only the nappe running down
        // the throw is a beam.
        lo = r2; hi = FAR;
      } else {
        lo = -FAR; hi = r1;
      }
    } else if (B > 1e-9) {
      lo = -FAR; hi = -C / (2.0 * B);
    } else if (B < -1e-9) {
      lo = -C / (2.0 * B); hi = FAR;
    } else {
      lo = C <= 0.0 ? -FAR : FAR;
      hi = C <= 0.0 ? FAR : -FAR;
    }

    float e0 = max(lo, sa), e1 = min(hi, sb);
    float s0 = max(e0, 0.0);
    float s1 = max(e1, s0);
    float chord = (s1 - s0) * dist;
    if (chord <= 0.0) discard;

    // The entry surface draws the chord; the exit only when the entry is behind
    // the camera or its near plane.
    bool entry = abs(e0 - 1.0) < abs(e1 - 1.0);
    if (!entry && e0 * dist >= uNear) discard;

    vec3 pm = c + 0.5 * (s0 + s1) * d;
    float ym = pm.y;
    float full = clamp(chord / (2.0 * uRadius * radiusAt(ym)), 0.0, 1.0);
    float edge = 1.0 - smoothstep(${EDGE.toFixed(2)}, 1.0, length(pm.xz) / radiusAt(ym));

    float t0 = -(c.y + s0 * d.y), t1 = -(c.y + s1 * d.y), tm = -ym;
    float dilution = (dilute(t0) + 4.0 * dilute(tm) + dilute(t1)) / 6.0;
    float mouth = smoothstep(0.0, 0.05, tm);

    // Where the camera stands, as a fraction of the cone's radius at its
    // height; anything past the ends counts as far outside.
    float within = 2.0;
    if (c.y <= 0.0 && c.y >= -1.0) within = length(c.xz) / rc;

    vec3 ray = vPosV / dist;
    vec3 axis = normalize(vAxisV);
    float b = dot(ray, axis);
    float sq = 1.0 - b * b;
    // The grain is the entry wall's normal, and only from a distance: near
    // the beam that wall is grazing and reads dark, while the far cap, which
    // has no grain, does not, and the cap stood out as a lighter disc.
    float facing = abs(dot(normalize(vNormalV), ray));
    float grain = sq * (1.0 - vCap) * (entry ? 1.0 : 0.0) * smoothstep(0.85, 1.6, within);
    float shape = mix(full, facing, grain);

    float most = min(1.0, ${INSIDE_MOST.toFixed(2)} / max(2.0 * uAlpha, 1e-4));
    float gain = mix(most, 1.0, smoothstep(0.5, 1.0, within));
    // Haze scatters forward, so a ray looking back at the lamp carries a glare.
    float glare = 1.0 + 0.35 * smoothstep(0.5, 1.0, -b);

    float a = 2.0 * pow(shape, uSharp) * edge * dilution * mouth * gain * glare;
    gl_FragColor = vec4(uColour, a * uAlpha);
  }
`;

export function buildBeam(kit: Kit, segments: number, opts: BeamOptions = {}): Beam {
  const uCam = new Vector3();
  const material = kit.own(new ShaderMaterial({
    uniforms: {
      uColour: { value: new Color(1, 1, 1) },
      uAlpha: { value: 0 },
      uSharp: { value: opts.sharpness ?? 1.7 },
      uCam: { value: uCam },
      uRadius: { value: 1 },
      uNear: { value: 0.1 },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    side: DoubleSide,
    fog: false,
  }));

  const mesh = new Mesh(beamGeometry(kit, segments), material);
  mesh.renderOrder = opts.order ?? 12;
  mesh.frustumCulled = false;
  mesh.matrixAutoUpdate = false;
  mesh.visible = false;

  const uColour = material.uniforms.uColour!.value as Color;
  const shear = new Matrix4();
  const invWorld = new Matrix4();

  // The camera in unit space decides whether it is inside, and inside the one
  // wall ahead of it must draw through whatever stands in the beam.
  mesh.onBeforeRender = (_renderer, _scene, camera: Camera) => {
    invWorld.copy(mesh.matrixWorld).invert();
    uCam.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(invWorld);
    material.uniforms.uNear!.value = 'near' in camera ? (camera as PerspectiveCamera).near : 0.1;
    const r = MOUTH - (1 - MOUTH) * uCam.y;
    const inside = uCam.y <= 0 && uCam.y >= -1 && uCam.x * uCam.x + uCam.z * uCam.z <= r * r;
    material.depthTest = !inside;
  };

  return {
    mesh,

    aim(from, to, halfAngle) {
      scratchDir.copy(to).sub(from);
      const length = scratchDir.length();
      if (!(length > 1e-3)) { mesh.visible = false; return; }
      scratchDir.divideScalar(length);
      mesh.quaternion.setFromUnitVectors(AXIS, scratchDir);
      const radius = Math.max(0.05, length * Math.tan(halfAngle));
      material.uniforms.uRadius!.value = radius;

      // Shear the unit cone so the far ring lies in the horizontal plane
      // through `to`: the rotation's y row says how much each unit of x and z
      // climbs, and the shear cancels it along the axis.
      const e = scratchRot.makeRotationFromQuaternion(mesh.quaternion).elements;
      const drop = e[5]!;
      let sx = 0, sz = 0;
      if (drop > LEVEL_MIN_DROP) {
        sx = -e[1]! * radius / (drop * length);
        sz = -e[9]! * radius / (drop * length);
      }
      shear.set(1, 0, 0, 0, sx, 1, sz, 0, 0, 0, 1, 0, 0, 0, 0, 1);
      mesh.matrix
        .compose(from, mesh.quaternion, scratchScale.set(radius, length, radius))
        .multiply(shear);
      mesh.matrixWorldNeedsUpdate = true;
    },

    set(colour, alpha) {
      const a = alpha > 0 ? alpha : 0;
      material.uniforms.uAlpha!.value = a;
      // Written as sRGB because a raw ShaderMaterial output is not converted.
      uColour.copy(colour).convertLinearToSRGB();
      mesh.visible = a > 0.002;
    },

    setSegments(next) {
      mesh.geometry = beamGeometry(kit, next);
    },
  };
}

/**
 * The backdrop wash, which is a glowing cloth rather than a light.
 *
 * `cyc` was built as a lantern first and it does not work as one, for a reason
 * that is geometric rather than a matter of tuning. A cyc has to cover five
 * metres of cloth from a metre or two away, which needs a cone so wide that it
 * swallows the upstage half of the stage — and the drummer is centre-back by
 * construction, so *every* build of it put several times the key light on the
 * one player who is furthest from the audience. Flown high and aimed down, hung
 * low and aimed up, wide or narrow: the same fixture, the same problem.
 *
 * A real cyc bar solves this with a line of asymmetric reflectors hugging the
 * cloth, which is a dozen lights this budget does not have. So the wash is
 * drawn instead of lit: an additive card standing just downstage of the
 * backdrop, graded bright at the bottom and gone by two thirds height, the way
 * a groundrow actually lays light on a cloth. One draw call, no light in the
 * shader loop, and it is *incapable* of spilling on anybody — which is a
 * stronger guarantee than any amount of careful aiming.
 *
 * The top of the gradient reaching zero also means the card can safely be
 * larger than whatever is behind it: an open-air stage has a low wall and the
 * night, and the wash fades out well before it would be caught glowing in the
 * sky.
 */
export interface CycGlow {
  readonly mesh: Mesh;
  set(colour: Color, alpha: number): void;
}

const CYC_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CYC_FRAGMENT = /* glsl */ `
  uniform vec3 uColour;
  uniform float uAlpha;
  varying vec2 vUv;
  void main() {
    // Bright along the foot of the cloth and gone by two thirds up, which is
    // what a groundrow does and what stops the card having a top edge.
    float v = smoothstep(0.92, 0.16, vUv.y) * smoothstep(0.0, 0.05, vUv.y);
    float x = abs(vUv.x - 0.5) * 2.0;
    v *= smoothstep(1.0, 0.70, x);
    gl_FragColor = vec4(uColour, v * uAlpha);
  }
`;

export function buildCycGlow(kit: Kit, width: number, height: number): CycGlow {
  const material = kit.own(new ShaderMaterial({
    uniforms: {
      uColour: { value: new Color(1, 1, 1) },
      uAlpha: { value: 0 },
    },
    vertexShader: CYC_VERTEX,
    fragmentShader: CYC_FRAGMENT,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    fog: false,
  }));
  const mesh = new Mesh(
    kit.geometry(`cyc|${width.toFixed(2)}|${height.toFixed(2)}`,
      () => new PlaneGeometry(width, height)),
    material,
  );
  mesh.renderOrder = 6;
  mesh.visible = false;
  const uColour = material.uniforms.uColour!.value as Color;

  return {
    mesh,
    set(colour, alpha) {
      const a = alpha > 0 ? alpha : 0;
      material.uniforms.uAlpha!.value = a;
      uColour.copy(colour).convertLinearToSRGB();
      mesh.visible = a > 0.002;
    },
  };
}

/**
 * How dense the beams are, from `LightingScore.haze`.
 *
 * The score's range is real and has to survive intact: iskelmä's lakeside
 * pavilion sits around 0.25–0.35, where a beam should be a suggestion of moths
 * and damp air, and ambient sits around 0.85–0.95, where the room is more fog
 * than air and the beams are nearly solid objects. A linear map gives the
 * pavilion far too much and ambient not enough, so the curve is convex: the
 * bottom of the range is squashed toward nothing and the top opens up.
 *
 *   haze 0.25 -> 0.10    haze 0.28 -> 0.13    haze 0.70 -> 0.57    haze 0.90 -> 0.83
 */
export function beamDensity(haze: number): number {
  const t = Math.max(0, Math.min(1, (haze - 0.12) / 0.76));
  return 0.045 + 0.78 * Math.pow(t, 1.45);
}
