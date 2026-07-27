/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The venue — proscenium, boards, backdrop, wings, fly bar, curtain, house.
 *
 * `Venue` in, a scene graph out. This file makes no decision the Performance
 * IR could have made instead: every dimension comes from `venue.width` and
 * `venue.depth`, every colour from `venue.palette`, every piece of dressing
 * from `venue.props`, the crowd from `venue.audience` and the air from
 * `venue.fog`. There is no genre switch anywhere in this directory — a
 * lakeside pavilion and a black box differ only in the numbers and strings
 * `src/concert/venue.ts` chose, which is what makes the two halves separable.
 *
 * Everything that is random — where a plank's colour lands, which seats are
 * taken, where a flight case sits — draws from `Venue.id` through
 * `core/rng.ts`, in a named stream per subsystem. Same venue, same room, down
 * to the last moth. Adding a prop cannot reshuffle the audience.
 *
 * ## What the show runner drives
 *
 * ```ts
 * const stage = buildStage(concert.venue);
 * scene.add(stage.root);
 * scene.fog = stage.fog;              // venue.fog, not the lighting haze
 * lights.hangFrom(stage.flyBar);      // the rig owns fixtures; this is the pipe
 *
 * stage.setCurtain(1);                // gathers over ~3s; poll curtainOpen()
 * stage.applaud(0.8);                 // between numbers
 * stage.setAttention(1);              // a solo — the house leans in
 * stage.gasp();                       // a tomato lands
 *
 * stage.update(beat, dt);             // once a frame, with the one clock
 * stage.dispose();                    // strike
 * ```
 *
 * ## Lights and shadows
 *
 * This file adds no lights — the lighting rig owns all of them, including the
 * single shadow-casting spot the budget allows. What it does is decide what
 * casts and what receives: the boards, the backdrop and the risers receive;
 * chunky floor props cast; the curtain and the audience do neither. A curtain
 * that casts a shadow needs its vertex displacement duplicated into the depth
 * material for no visible gain, and an audience that receives one stops being
 * a silhouette.
 */

import {
  BackSide, Color, Fog, Group, Mesh, Object3D, PlaneGeometry, ShaderMaterial,
} from 'three';

import { Rng } from '../../core/rng.js';
import type { Venue } from '../../concert/types.js';
import { buildAudience, type AudienceRig } from './stage-audience.js';
import { buildCurtain, type CurtainRig } from './stage-curtain.js';
import {
  blend, cellPlane, shade, tint,
  Kit, type Quality, type StageMetrics,
} from './stage-kit.js';
import { dressStage, readProps, type PropRig } from './stage-props.js';

export { SUPPORTED_PROPS } from './stage-props.js';
export { normaliseProp, unknownProps } from './stage-props.js';
export type { PropName } from './stage-props.js';
export type { Quality, StageMetrics } from './stage-kit.js';

/**
 * How far the boards sit above the house floor.
 *
 * `Venue` does not carry a stage height and it does not need to: it is not a
 * musical decision and nothing else in the show depends on it. Fixed here, in
 * one place, so the audience, the apron and the house floor agree.
 */
const STAGE_RISE = 0.9;

/**
 * How far upstage of the lip the house tabs hang.
 *
 * This was 0.55 m, and 0.55 m is not a curtain line — it is the distance at
 * which the cloth stopped hitting the footlights. `concert/cast.ts` holds the
 * front line 0.7 m off the lip, so the tabs hung **0.15 m** in front of the
 * frontmost player: less than a torso, never mind an accordion, and the band
 * showed through a closed curtain before the show had started. Measured across
 * every venue this generator builds it was 0.15 m in six rooms of eight and
 * 0.20 m in the other two — a systematic miss, not a near one.
 *
 * 0.45 m is as far downstage as the tabs can go, and the thing that stops them
 * is not the arch: `lights.ts` sets a footlight trough into the deck reaching
 * `lipZ - 0.29`, and the closed cloth's own fold depth and idle breath give it
 * a ±0.13 m envelope at the hem. Three centimetres short of the footlights is
 * where that runs out. Any further and the curtain breathes through the
 * footlight shells, which is a flicker rather than a fix.
 *
 * So this buys 0.25 m of clearance instead of 0.15 m — a torso rather than a
 * third of one — and it is honestly not enough on its own. The rest of the
 * reveal is bought in `show.ts`, which keeps the band out of the room until
 * there is a gap to see it through. The two together, because a curtain that
 * cannot be hung far enough downstage and a band that must be visible for its
 * own bow do not have a single answer between them. See `CURTAIN_REVEALS`.
 */
const CURTAIN_FROM_LIP = 0.45;

export interface StageOptions {
  quality?: Quality;
  /**
   * Override the `prefers-reduced-motion` query. Headless callers must pass
   * it, since there is no `matchMedia` outside a browser.
   */
  reducedMotion?: boolean;
}

export interface StageRig {
  /** Everything the stage owns. Add it to the scene; nothing else touches it. */
  root: Group;
  /**
   * Atmospheric fog from `venue.fog`, ready to assign to `scene.fog`. Separate
   * from the lighting haze by design — this is how far away the back wall
   * feels, not whether you can see the beams.
   */
  fog: Fog;
  /** The pipe over the stage. The lighting rig hangs its fixtures on this. */
  flyBar: Object3D;
  /** Dimensions worked out from the venue; the camera and tomatoes want these. */
  metrics: StageMetrics;
  /** Props recognised and placed, and the strings that were ignored. */
  dressing: { placed: readonly string[]; ignored: readonly string[] };

  /**
   * Where the curtain should be: 0 closed, 1 fully gathered.
   *
   * A *target*, not a pose. The cloth takes about three seconds over a full
   * traverse and eases at both ends, because a curtain has weight and the
   * hem trails the track. Driving it every frame with your own ramp also
   * works — it will track with a small lag, which still looks right.
   */
  setCurtain(open: number): void;
  /** Jump there. For resetting between numbers, not for showing anybody. */
  snapCurtain(open: number): void;
  /** Where the cloth actually is. Poll it to know when the reveal has landed. */
  curtainOpen(): number;

  /** A burst of applause, 0..1, which rises fast and dies over a few seconds. */
  applaud(intensity: number): void;
  /** The tomato reaction: a recoil that travels back through the house. */
  gasp(): void;
  /** Sustained: a solo leans the house in and stills it. 0 relaxed, 1 rapt. */
  setAttention(level: number): void;

  /** Audience size, haze card count. Cheap to change at any time. */
  setQuality(q: Quality): void;
  /** How many people are being drawn. */
  audienceCount(): number;

  /** Once a frame. `now` is song position in beats, from the one clock. */
  update(now: number, dt: number): void;
  dispose(): void;
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function buildStage(venue: Venue, opts: StageOptions = {}): StageRig {
  const quality: Quality = opts.quality ?? 'high';
  const reducedMotion = opts.reducedMotion ?? prefersReducedMotion();
  const kit = new Kit();
  const p = venue.palette;
  const props = readProps(venue.props);
  const blackBox = props.has('black-box');
  const openAir = props.has('open-air');
  const brick = props.has('brick');
  const extraHaze = props.has('haze');

  const width = Math.max(4, venue.width);
  const depth = Math.max(3, venue.depth);
  const openingWidth = width * 0.94;
  const openingHeight = Math.max(3.6, Math.min(width * 0.44, 6.4));
  const rows = Math.max(1, Math.min(16, Math.round(venue.audience.rows)));

  const m: StageMetrics = {
    width,
    depth,
    lipZ: depth / 2,
    backZ: -depth / 2,
    houseY: -STAGE_RISE,
    openingWidth,
    openingHeight,
    curtainZ: depth / 2 - CURTAIN_FROM_LIP,
    flyY: openingHeight - 0.35,
    houseDepth: 2.6 + rows * (venue.audience.seated ? 0.95 : 0.8),
    houseWidth: width + 4,
  };

  const root = new Group();
  root.name = `stage:${venue.id}`;

  // --- the boards --------------------------------------------------------
  // One geometry, per-plank vertex colours, a crisp seam at every join and no
  // texture anywhere. See `cellPlane` — this is the whole texturing strategy.
  const boardRng = new Rng(`${venue.id}:boards`);
  const planks = Math.max(8, Math.round(width / 0.42));
  const boards = new Mesh(
    kit.own(cellPlane({
      width, height: depth, cols: planks, rows: 1,
      colour: p.boards, jitter: 0.085, rng: boardRng,
    })),
    kit.solid('#ffffff', { vertexColors: true, rough: 0.86 }),
  );
  boards.rotation.x = -Math.PI / 2;
  boards.receiveShadow = true;
  root.add(boards);

  // The apron: the face of the stage below the lip, and the reason the house
  // reads as being *below* the band rather than on the same floor.
  const apron = new Mesh(
    kit.bevelBox(width, STAGE_RISE, depth, 0.04),
    kit.solid(shade(p.boards, 0.55), { rough: 0.9 }),
  );
  apron.position.set(0, -STAGE_RISE / 2 - 0.006, 0);
  apron.receiveShadow = true;
  root.add(apron);

  const lip = new Mesh(
    kit.bevelBox(width + 0.12, 0.09, 0.2, 0.035),
    kit.solid(shade(p.proscenium, 0.25), { rough: 0.6 }),
  );
  lip.position.set(0, -0.02, m.lipZ + 0.04);
  root.add(lip);

  // --- the house floor ---------------------------------------------------
  const houseFloor = new Mesh(
    kit.geometry('housefloor', () => new PlaneGeometry(m.houseWidth + 8, m.houseDepth + 8)),
    kit.solid(shade(blend(p.boards, p.backdrop, 0.6), 0.6), { rough: 0.95 }),
  );
  houseFloor.rotation.x = -Math.PI / 2;
  houseFloor.position.set(0, -STAGE_RISE, m.lipZ + m.houseDepth / 2);
  houseFloor.receiveShadow = true;
  root.add(houseFloor);

  // --- the backdrop ------------------------------------------------------
  // Brick is the same cell trick with the rows staggered into a bond; an
  // open-air stage gets a low wall and the night behind it instead.
  const backHeight = openAir ? 2.4 : openingHeight + 2.2;
  const backWidth = width * 1.2;
  const backColour = blackBox ? shade(p.backdrop, 0.55) : p.backdrop;
  const backRng = new Rng(`${venue.id}:backdrop`);
  const backdrop = new Mesh(
    brick
      ? kit.own(cellPlane({
        width: backWidth, height: backHeight, cols: Math.round(backWidth / 0.42),
        rows: Math.round(backHeight / 0.2), colour: backColour, jitter: 0.13,
        rng: backRng, stagger: true,
      }))
      : kit.own(cellPlane({
        width: backWidth, height: backHeight, cols: 6, rows: 4,
        colour: backColour, jitter: 0.05, rng: backRng,
      })),
    kit.solid('#ffffff', { vertexColors: true, rough: 0.95 }),
  );
  backdrop.position.set(0, backHeight / 2 - STAGE_RISE, m.backZ - 0.1);
  backdrop.receiveShadow = true;
  root.add(backdrop);

  // --- proscenium and masking -------------------------------------------
  const archColour = blackBox ? shade(p.proscenium, 0.5) : p.proscenium;
  const archMat = kit.solid(archColour, { rough: 0.7 });
  const mouldMat = kit.solid(blackBox ? archColour : tint(p.proscenium, 0.22), { rough: 0.5 });
  const archZ = m.lipZ + 0.28;
  const legW = 0.62;
  const legH = openingHeight + 1.1 + STAGE_RISE;

  for (const side of [-1, 1]) {
    const x = side * (openingWidth / 2 + legW / 2);
    const leg = new Mesh(kit.bevelBox(legW, legH, 0.55, 0.06), archMat);
    leg.position.set(x, legH / 2 - STAGE_RISE, archZ);
    leg.castShadow = false;
    root.add(leg);
    if (!blackBox) {
      const mould = new Mesh(kit.bevelBox(0.16, legH - 0.4, 0.66, 0.05), mouldMat);
      mould.position.set(x - side * (legW / 2 - 0.08), legH / 2 - 0.2 - STAGE_RISE, archZ);
      root.add(mould);
    }
    // Tormentors — flat panels running out to the edge of frame, so a wide
    // shot cannot see past the arch into nothing.
    const torW = 4;
    const tor = new Mesh(kit.bevelBox(torW, legH + 3, 0.3, 0.04), kit.solid(shade(archColour, 0.7)));
    tor.position.set(side * (openingWidth / 2 + legW + torW / 2 - 0.05), (legH + 3) / 2 - STAGE_RISE, archZ + 0.1);
    root.add(tor);
  }

  const headerH = 1.0;
  const header = new Mesh(kit.bevelBox(openingWidth + legW * 2 + 0.2, headerH, 0.55, 0.06), archMat);
  header.position.set(0, openingHeight + headerH / 2, archZ);
  root.add(header);
  if (!blackBox) {
    const headerMould = new Mesh(kit.bevelBox(openingWidth + legW * 2 + 0.3, 0.16, 0.66, 0.05), mouldMat);
    headerMould.position.set(0, openingHeight + 0.08, archZ);
    root.add(headerMould);
  }
  // Masking above the header, up out of frame.
  const above = new Mesh(kit.bevelBox(openingWidth + legW * 2 + 9, 4, 0.3, 0.04), kit.solid(shade(archColour, 0.72)));
  above.position.set(0, openingHeight + headerH + 2, archZ + 0.1);
  root.add(above);

  // --- wings -------------------------------------------------------------
  const wingMat = kit.solid(shade(p.curtain, 0.45), { rough: 0.98, side: BackSide });
  const wingGeo = kit.geometry(`wing|${openingHeight}`, () => new PlaneGeometry(2.4, openingHeight + 1));
  for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const wing = new Mesh(wingGeo, wingMat);
      wing.position.set(
        side * (openingWidth / 2 - 0.25 + i * 0.5),
        (openingHeight + 1) / 2 - 0.4,
        m.curtainZ - 1.5 - i * 2.1,
      );
      wing.rotation.y = side * (Math.PI / 2 + 0.28);
      root.add(wing);
    }
  }

  // --- fly bar -----------------------------------------------------------
  const flyBar = new Group();
  flyBar.name = 'fly-bar';
  flyBar.position.set(0, m.flyY, m.curtainZ - 1.1);
  const pipe = new Mesh(
    kit.bevelBox(openingWidth + 1.2, 0.09, 0.09, 0.045),
    kit.solid(shade(p.proscenium, 0.65), { metal: 0.55, rough: 0.45 }),
  );
  flyBar.add(pipe);
  for (const side of [-1, 1]) {
    const wire = new Mesh(
      kit.bevelBox(0.03, 2.6, 0.03, 0.014),
      kit.solid(shade(p.proscenium, 0.75), { metal: 0.5, rough: 0.5 }),
    );
    wire.position.set(side * (openingWidth / 2 - 0.6), 1.3, 0);
    flyBar.add(wire);
  }
  root.add(flyBar);

  // --- the curtain -------------------------------------------------------
  const curtain: CurtainRig = buildCurtain({
    kit,
    width: openingWidth,
    height: openingHeight,
    z: m.curtainZ,
    colour: p.curtain,
    valance: !blackBox,
    reducedMotion,
    quality,
  });
  root.add(curtain.root);

  // --- the house ---------------------------------------------------------
  const audience: AudienceRig = buildAudience({
    kit,
    venue,
    houseY: m.houseY,
    lipZ: m.lipZ,
    houseWidth: m.houseWidth,
    quality,
    reducedMotion,
  });
  root.add(audience.root);

  // --- dressing ----------------------------------------------------------
  const dressed: PropRig = dressStage({ kit, venue, metrics: m, quality, reducedMotion });
  root.add(dressed.root);

  // --- air ---------------------------------------------------------------
  const fogAmount = Math.max(0, Math.min(1, venue.fog));
  const fogColour = shade(blend(p.ambient, p.backdrop, 0.55), 0.35);
  const fog = new Fog(fogColour, 14 - 12 * fogAmount, 78 - 56 * fogAmount);

  /**
   * Soft cards of air near the boards, for the fog the `Fog` cannot do: a
   * depth cue is not the same thing as smoke lying in a beam. Radial falloff
   * in the fragment shader rather than a texture, oriented at the house
   * because that is where the camera lives.
   */
  const hazeCards: { mesh: Mesh; drift: number; phase: number; x: number }[] = [];
  const cardCount = fogAmount < 0.08 && !extraHaze
    ? 0
    : (quality === 'low' ? 2 : quality === 'medium' ? 4 : 6);
  if (cardCount > 0) {
    const hazeMat = kit.own(new ShaderMaterial({
      uniforms: {
        uColour: { value: new Color(tint(fogColour, 0.35)) },
        uOpacity: { value: (0.1 + fogAmount * 0.26) * (extraHaze ? 1.5 : 1) },
      },
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColour; uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          vec2 d = vUv - 0.5;
          float r = length(vec2(d.x, d.y * 1.7)) * 2.0;
          float a = smoothstep(1.0, 0.1, r);
          gl_FragColor = vec4(uColour, a * a * uOpacity);
        }`,
    }));
    const cardGeo = kit.geometry(`haze|${width}`, () => new PlaneGeometry(width * 0.85, 2.6));
    const hazeRng = new Rng(`${venue.id}:haze`);
    for (let i = 0; i < cardCount; i++) {
      const mesh = new Mesh(cardGeo, hazeMat);
      const x = hazeRng.float(-width * 0.2, width * 0.2);
      mesh.position.set(x, hazeRng.float(0.5, 2.4), m.backZ + hazeRng.float(0.4, depth - 0.6));
      mesh.renderOrder = 4;
      root.add(mesh);
      hazeCards.push({ mesh, drift: hazeRng.float(0.02, 0.06), phase: hazeRng.float(0, 6.28), x });
    }
  }

  // --- frame -------------------------------------------------------------
  let time = 0;
  const idle = reducedMotion ? 0.2 : 1;

  const rig: StageRig = {
    root,
    fog,
    flyBar,
    metrics: m,
    dressing: { placed: dressed.placed, ignored: dressed.ignored },

    setCurtain: (open) => curtain.setOpen(open),
    snapCurtain: (open) => curtain.snap(open),
    curtainOpen: () => curtain.open(),

    applaud: (intensity) => audience.applaud(intensity),
    gasp: () => audience.gasp(),
    setAttention: (level) => audience.setAttention(level),

    setQuality(q: Quality): void {
      audience.setQuality(q);
    },
    audienceCount: () => audience.count(),

    update(now: number, dt: number): void {
      // A tab that has been in the background hands back a delta measured in
      // seconds. Clamping it here means one lost frame, not a curtain that
      // teleports open and an audience that jumps.
      const d = Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.1)) : 0;
      time += d;
      curtain.update(d);
      audience.update(now, d);
      dressed.update(time, d);
      for (const card of hazeCards) {
        card.mesh.position.x = card.x + Math.sin(time * card.drift * 6 + card.phase) * 1.1 * idle;
        card.mesh.position.y += Math.sin(time * 0.2 + card.phase) * 0.0006 * idle;
      }
    },

    dispose(): void {
      root.removeFromParent();
      root.traverse((obj) => {
        const mesh = obj as Partial<Mesh>;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) for (const one of mat) one.dispose();
        else if (mat) mat.dispose();
      });
      kit.dispose();
      root.clear();
    },
  };

  return rig;
}
