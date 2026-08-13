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
 * whole frame budget for something an additive cone approximates to within a
 * hair. The cone is also *better behaved*: it never flickers under temporal
 * reprojection, it costs the same whether the camera is in the beam or not, and
 * it can be tuned by a person rather than by a scattering coefficient.
 *
 * Three tricks make it read as air rather than as a plastic cone:
 *
 *  - **The chord through the cone.** The brightness of a ray through a cone of
 *    haze is proportional to how far that ray travels inside it: long through
 *    the middle, nothing at the silhouette — and *everything* when the camera is
 *    in the beam looking down it. Two things compute that length and the shader
 *    uses both. `abs(dot(normal, view))` reads it off the surface, and side-on
 *    it is exact — that dot product *is* the chord of a cylinder, normalised —
 *    with the tessellation's fingerprints on it, because the normal is lerped
 *    across each facet and renormalised per fragment. That grain is wanted: it
 *    is what stops a beam being a smooth airbrushed cone, and it coarsens with
 *    the segment count, so the low tier's eight-sided beams are the ribbed ones.
 *    What the surface cannot do is inside: every wall the camera can see from in
 *    there is grazing, the dot product goes to zero, and the beam you are
 *    standing in is the dimmest thing on screen. So the length is *also* solved
 *    analytically against the cone's axis, and the two are mixed by how much the
 *    ray crosses the beam rather than running down it — which is precisely how
 *    far the surface can be trusted. Raising the result to a power sharpens the
 *    core. Rendered double-sided the near and far walls sum, which doubles the
 *    middle for free and is right for the same reason; inside the cone the near
 *    wall is behind the camera, so the far one is given the pair's weight.
 *  - **Dilution along the throw.** A beam spreads, so the same light is spread
 *    over more air the further it gets. The alpha falls off toward the far end
 *    and reaches zero there, which is also what stops the cone having a visible
 *    rim where it stops.
 *  - **No depth write.** Beams never occlude each other or anything else; they
 *    only add. Depth *test* stays on, so a beam behind a player is correctly
 *    hidden while the near wall of the same cone still draws in front of them —
 *    which is what a beam passing over somebody looks like.
 *
 * ## Cost
 *
 * One open-ended cone, one height segment: `segments * 2` triangles. Sixteen
 * segments is 32 triangles and one draw call per beam. The whole rig's beams at
 * the top quality tier are under four hundred triangles — the expense is fill,
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
  AdditiveBlending, Color, CylinderGeometry, DoubleSide, Mesh, PlaneGeometry,
  ShaderMaterial, Vector3, type BufferGeometry,
} from 'three';

import type { Kit } from './stage-kit.js';

/** Local axis the unit cone points along: apex at the origin, spreading down. */
const AXIS = new Vector3(0, -1, 0);

/**
 * The mouth's radius as a fraction of the wide end — the lens, not a point.
 * The geometry and the shader both need it, so neither gets to spell it twice.
 */
const MOUTH = 0.045;

const scratchDir = new Vector3();

export interface Beam {
  readonly mesh: Mesh;
  /** Point the cone from `from` to `to`, spreading to `halfAngle` radians. */
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
 * A unit cone with its apex at the local origin, spreading along -y to y = -1.
 *
 * Not a `ConeGeometry`: a cylinder with a small top radius gives the beam a
 * lens-sized mouth instead of a mathematical point, which is what stops the
 * first few centimetres out of the lantern looking like a needle. Cached on the
 * kit by segment count, so the three quality tiers share three geometries
 * between every beam in the rig.
 */
function beamGeometry(kit: Kit, segments: number): BufferGeometry {
  return kit.geometry(`beam|${segments}`, () => {
    const g = new CylinderGeometry(MOUTH, 1, 1, segments, 1, true);
    g.translate(0, -0.5, 0);
    return g;
  });
}

const VERTEX = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vPosV;
  varying vec3 vMouthV;
  varying vec3 vAxisV;
  varying float vRadius;
  void main() {
    // Lerped across each facet and renormalised below, which is where the
    // beam's grain comes from. See the header.
    vNormalV = normalMatrix * normal;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vPosV = mv.xyz;
    // The cone's own frame, in view space: the centre of its mouth, its axis
    // (length = the throw), and the radius of its wide end. The same three
    // numbers for every vertex, carried down as varyings because three does not
    // hand the fragment stage a model matrix to work them out from.
    vMouthV = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vAxisV = (modelViewMatrix * vec4(0.0, -1.0, 0.0, 0.0)).xyz;
    vRadius = length((modelViewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColour;
  uniform float uAlpha;
  uniform float uSharp;
  varying vec3 vNormalV;
  varying vec3 vPosV;
  varying vec3 vMouthV;
  varying vec3 vAxisV;
  varying float vRadius;

  void main() {
    float throwLen = max(length(vAxisV), 1e-4);
    vec3 axis = vAxisV / throwLen;
    vec3 ray = normalize(vPosV);   // the camera is the origin of view space
    vec3 toCam = -vMouthV;         // ...so this is where it stands, mouth-relative

    // Closest approach between the view ray and the beam's axis: sMid along the
    // ray, tMid down the throw, off the gap left between the two.
    float b = dot(ray, axis);
    float d = dot(ray, toCam);
    float e = dot(axis, toCam);
    float sq = max(1.0 - b * b, 1e-6);   // collapses when the ray runs down the beam
    float sMid = (b * e - d) / sq;
    float tMid = (e - b * d) / sq;
    float off = length(toCam + sMid * ray - tMid * axis);

    // How much air the ray crosses, as a fraction of the cone's full width
    // there: 1 straight through the middle, 0 at the silhouette. Treating the
    // cone as a cylinder of the radius it has where the ray passes closest is
    // exact side-on and within a hair over a beam this narrow. Looking down the
    // beam, sq collapses and the chord runs away to a whole throw of haze,
    // which is the honest answer and why it is clamped rather than capped by a
    // dot product that would have said zero.
    float r = vRadius * (${MOUTH.toFixed(3)} + ${(1 - MOUTH).toFixed(3)} * clamp(tMid / throwLen, 0.0, 1.0));
    float reach = sqrt(max(r * r - off * off, 0.0) / sq);
    float s0 = max(sMid - reach, 0.0);   // clamped at the camera, for when it is inside
    float s1 = sMid + reach;

    // Two questions, and they only look like one from outside.
    //
    // Where in the cone this ray passes is what the sharpening is for: full at
    // the middle, nothing at the silhouette, raised to a power to harden the
    // core. How much of that crossing is still in front of the camera is a
    // quantity of air, and air is linear. Asking the power to answer both is
    // what it did until now, and inside the beam it made a mess of it: stand on
    // the axis and look across, and half the crossing is behind you, which the
    // power turned into an eighth of the brightness and a beam that all but
    // went out sideways.
    float full = clamp(reach / r, 0.0, 1.0);
    float seen = clamp((s1 - s0) / (2.0 * r), 0.0, 1.0);
    float ahead = full > 1e-5 ? min(seen / full, 1.0) : 0.0;

    // Is the camera in the beam, and how far off its axis if so: 1 at the wall,
    // 0 on the axis, ramped across the wall rather than switched at it.
    float camWall = vRadius * (${MOUTH.toFixed(3)} + ${(1 - MOUTH).toFixed(3)} * clamp(e / throwLen, 0.0, 1.0));
    // Unclamped on purpose: it is a ratio, and a camera out in the house has to
    // read as the twenty wall-radii away it is rather than as one.
    float within = length(toCam - e * axis) / max(camWall, 1e-4);
    float inside = (1.0 - smoothstep(0.85, 1.15, within)) * step(0.0, e) * step(e, throwLen);

    // The same number off the surface instead, faceted by the tessellation.
    // Where the two agree it is the one that carries the grain, so it is what
    // gets used; sq is exactly how much the ray crosses the cone rather than
    // running down it, which is exactly how far the surface can be trusted.
    //
    // From *inside* the cone it can be trusted nowhere, whatever sq says, and
    // this is the term that has to say so. A dot against the wall's normal
    // brightens the piece of wall that happens to face the lens, and seen from
    // within a tube that piece is a bright sheet swinging round the inside as
    // the camera turns: a thing in the shot that is not in the scene. The
    // chord has no such preference: it asks the volume, and the volume does not
    // know where the camera is pointing.
    float facing = abs(dot(normalize(vNormalV), -ray));
    float a = pow(mix(full, facing, sq * (1.0 - inside)), uSharp) * ahead;

    // Where down the throw that crossing happens. Clamping the two ends to the
    // beam's own extent is what keeps a ray fired along the axis sampling the
    // middle of the haze still ahead of it rather than the far rim.
    float tA = clamp(dot(s0 * ray - vMouthV, axis), 0.0, throwLen);
    float tB = clamp(dot(s1 * ray - vMouthV, axis), 0.0, throwLen);
    float t = 0.5 * (tA + tB) / throwLen;

    // The beam spreads, so the same light thins out along the throw, and it
    // reaches zero at the end rather than stopping at a rim.
    a *= 1.0 - pow(t, 1.25);
    // ...and it does not start as a bright disc pasted on the lens either.
    a *= smoothstep(0.0, 0.05, t);

    // Both walls draw and sum, except from inside, where the near one is behind
    // the camera and the far one is all there is. The survivor is handed the
    // pair's weight so that crossing the wall is not a step, but only *at* the
    // wall: the compensation is for a missing wall and it is spent on the
    // distance off the axis, which runs to nothing at the axis itself.
    //
    // Which is where it had to be spent. On the axis the chord is a whole
    // throw of haze and clamps to full, and doubling full covers the frame in
    // gel, an additive whiteout with the beam's own subject somewhere inside
    // it, lit exactly as before and looking like the one thing in the shot that
    // is not. A beam you are standing in should be bright. It should not be
    // brighter than the same beam is from the seats, which is what this was.
    a *= 1.0 + inside * min(within, 1.0);

    gl_FragColor = vec4(uColour, a * uAlpha);
  }
`;

export function buildBeam(kit: Kit, segments: number, opts: BeamOptions = {}): Beam {
  const material = kit.own(new ShaderMaterial({
    uniforms: {
      uColour: { value: new Color(1, 1, 1) },
      uAlpha: { value: 0 },
      uSharp: { value: opts.sharpness ?? 1.7 },
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
  mesh.matrixAutoUpdate = true;
  mesh.visible = false;

  const uColour = material.uniforms.uColour!.value as Color;

  return {
    mesh,

    aim(from, to, halfAngle) {
      scratchDir.copy(to).sub(from);
      const length = scratchDir.length();
      if (!(length > 1e-3)) { mesh.visible = false; return; }
      scratchDir.divideScalar(length);
      mesh.position.copy(from);
      mesh.quaternion.setFromUnitVectors(AXIS, scratchDir);
      const radius = Math.max(0.05, length * Math.tan(halfAngle));
      mesh.scale.set(radius, length, radius);
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
