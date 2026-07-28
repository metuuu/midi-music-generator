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
  BackSide, type BufferGeometry, Color, Float32BufferAttribute, Fog, Group, Mesh,
  MeshBasicMaterial, Object3D, PlaneGeometry, ShaderMaterial, SphereGeometry,
} from 'three';

import { Rng } from '../../core/rng.js';
import type { Venue } from '../../concert/types.js';
import { buildAudience, type AudienceRig } from './stage-audience.js';
import { buildCurtain, type CurtainRig } from './stage-curtain.js';
import {
  blend, cellPlane, hueShift, shade, tint,
  Kit, LOW_CEILING, STAGE_SOFFIT, type Quality, type StageMetrics,
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
 * The same, in a room with a lid on it.
 *
 * A cellar club does not have a stage, it has a *riser* — a platform you step
 * up onto, ankle-high to the people standing at the bar. 0.9 m is a proscenium
 * house: it puts the band above a standing crowd, which is what a pavilion
 * wants and what a basement has never once had.
 *
 * It is not only a truth about clubs, it is where the headroom comes from.
 * `STAGE_SOFFIT` needs air over `HEAD_BAND.hi` and there is only so much room
 * between a floor and a ceiling; every centimetre the boards give up is a
 * centimetre the lid does not have to. Half a metre of it was sitting under the
 * band for no reason but a default shared with a room that has open sky.
 *
 * The cost is honest and worth naming: at 0.4 m a seated house no longer clears
 * the front line by much, so from a low camera there are heads between the lens
 * and the band. That is not a defect. It is the photograph everybody has seen
 * of a room like this, and it is the reason to sit near the front.
 */
const CELLAR_RISE = 0.4;

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
  const lowCeiling = props.has('low-ceiling');
  /** See `CELLAR_RISE`: a room with a lid puts the band on a kerb, not a stage. */
  const rise = lowCeiling ? CELLAR_RISE : STAGE_RISE;

  const width = Math.max(4, venue.width);
  const depth = Math.max(3, venue.depth);
  const openingWidth = width * 0.94;
  const openingHeight = Math.max(3.6, Math.min(width * 0.44, 6.4));
  const rows = Math.max(1, Math.min(16, Math.round(venue.audience.rows)));
  // Up here rather than with the backdrop it builds, because `m` publishes it
  // and the lighting rig sizes the cyclorama glow off it.
  const backHeight = openAir ? 2.4 : openingHeight + 2.2;

  const m: StageMetrics = {
    width,
    depth,
    lipZ: depth / 2,
    backZ: -depth / 2,
    houseY: -rise,
    openingWidth,
    openingHeight,
    curtainZ: depth / 2 - CURTAIN_FROM_LIP,
    flyY: openingHeight - 0.35,
    houseDepth: 2.6 + rows * (venue.audience.seated ? 0.95 : 0.8),
    houseWidth: width + 4,
    /**
     * The lid, published so the camera can stay under it. `Infinity` is not a
     * cop-out here: most of these rooms genuinely have nothing overhead, and a
     * height nobody can reach is the honest way to say so — every consumer of
     * this wants a `Math.min` and gets the right answer for free.
     *
     * The cellar's ceiling is two heights now, so this is the **lower** of them.
     * A camera solved against the house lid would clear it and then put its lens
     * through the soffit the moment the shot moved over the boards, which is the
     * original bug with an extra step in it. Every consumer wanting the worst
     * case is exactly why one number can still say this.
     */
    headroom: lowCeiling ? Math.min(-rise + LOW_CEILING, STAGE_SOFFIT) : Infinity,
    backdropHeight: backHeight,
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
    kit.bevelBox(width, rise, depth, 0.04),
    kit.solid(shade(p.boards, 0.55), { rough: 0.9 }),
  );
  apron.position.set(0, -rise / 2 - 0.006, 0);
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
  houseFloor.position.set(0, -rise, m.lipZ + m.houseDepth / 2);
  houseFloor.receiveShadow = true;
  root.add(houseFloor);

  // --- the backdrop ------------------------------------------------------
  // Brick is the same cell trick with the rows staggered into a bond; an
  // open-air stage gets a low wall and the night behind it instead.
  const backWidth = width * 1.2;
  const backColour = blackBox ? shade(p.backdrop, 0.55) : p.backdrop;
  const backRng = new Rng(`${venue.id}:backdrop`);
  if (openAir) {
    /**
     * A wall you can walk behind.
     *
     * Indoors a backdrop is a cloth and a plane is the honest model of one:
     * nobody is ever on the other side of it. Outdoors it is a low wall at the
     * back of a dance floor, the audience can and does walk round it, and the
     * camera can be swung behind it in one drag — at which point a plane is a
     * sheet of paper with nothing printed on the back. It is also the one
     * surface in this room the eye has a real thickness for, because a coping
     * stone reading as a *line* rather than as a top is what makes a low wall
     * look like a cut-out.
     *
     * So it is a box with a capping rail, and it costs two draw calls.
     */
    const wall = new Mesh(
      kit.bevelBox(backWidth, backHeight, 0.3, 0.04),
      kit.solid(backColour, { rough: 0.95 }),
    );
    wall.position.set(0, backHeight / 2 - rise, m.backZ - 0.25);
    wall.castShadow = true;
    wall.receiveShadow = true;
    root.add(wall);

    const coping = new Mesh(
      kit.bevelBox(backWidth + 0.18, 0.11, 0.46, 0.04),
      kit.solid(shade(p.proscenium, 0.22), { rough: 0.7 }),
    );
    coping.position.set(0, backHeight - rise + 0.05, m.backZ - 0.25);
    coping.castShadow = true;
    root.add(coping);
  } else {
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
    backdrop.position.set(0, backHeight / 2 - rise, m.backZ - 0.1);
    backdrop.receiveShadow = true;
    root.add(backdrop);
  }

  // --- the night ---------------------------------------------------------
  /**
   * What an open-air stage has instead of walls.
   *
   * The cellar and the black box are answered by building the room; a
   * tanssilava cannot be, because the absence of a room is the whole idea of
   * one. But "no walls" was being drawn as *no anything* — past the 2.4 m back
   * wall, and past the ends of it, and above it, and behind you if you dragged
   * the camera round, the scene was the page's background colour. That is not
   * an open-air stage at midnight, it is a stage with the lights off in a void,
   * and the void is what reads as out of bounds.
   *
   * A dome fixes it from every angle at once, which is the property worth
   * paying for: there is no orbit, no aspect ratio and no shot that finds an
   * edge of it. One sphere, seen from the inside, unlit and unfogged — it *is*
   * the far distance, so a fog that pulls it toward the fog colour would only
   * be telling you the horizon is far away, which you can already see.
   *
   * The gradient is three bands and all three come from `Venue.palette`, so the
   * sixties tanssilava and the eighties one get different nights out of the same
   * arithmetic — the deep blue overhead is `backdrop`, the pale band at the
   * waterline is `ambient`, and below it darkens to a far shore. Finland in
   * July: the sun is barely down and the horizon never quite goes out.
   *
   * The horizon sits at the house floor, which is *below* the top of the back
   * wall — so from the front you see wall, then sky, and the shore only shows
   * once the camera is high enough or wide enough to look past the ends. That
   * is the right way round. The wall is the near thing and it should occlude.
   */
  if (openAir) {
    /**
     * Big enough to contain the `lake`, which is 90 m across and reaches 79 m
     * from the origin at its corners. The dome writes no depth and draws first,
     * so anything *outside* it paints over the sky instead of being hidden by
     * it — at 60 m that put the lake's far edge as a hard line a fraction of a
     * degree above the horizon. The camera's far plane is 120 m and the most
     * distant point of this is about 104 m, so there is room for it.
     */
    const skyR = 90;
    // 32 rings rather than 16: the gradient is shaped finer than the mesh at
    // the horizon, which is the one part of it anybody looks at, and a band of
    // 11° there smears the glow halfway up the sky. Two thousand triangles.
    const skyGeo = kit.own(new SphereGeometry(skyR, 24, 32));
    const pos = skyGeo.getAttribute('position');
    const tint3 = new Float32Array(pos.count * 3);
    const zenith = new Color(shade(p.backdrop, 0.4));
    const horizon = new Color(tint(hueShift(p.ambient, -8, 0.05), 0.12));
    const shore = new Color(shade(p.backdrop, 0.8));
    const band = new Color();
    for (let i = 0; i < pos.count; i++) {
      const t = pos.getY(i) / skyR;
      // Below the waterline the shore closes in fast; above it the pale band
      // is thin and the blue takes over. `pow` rather than a straight ramp so
      // the glow hugs the horizon instead of washing halfway up the sky.
      band.copy(horizon).lerp(t < 0 ? shore : zenith,
        t < 0 ? Math.min(1, -t * 7) : Math.min(1, Math.pow(t, 0.55)));
      tint3[i * 3] = band.r;
      tint3[i * 3 + 1] = band.g;
      tint3[i * 3 + 2] = band.b;
    }
    skyGeo.setAttribute('color', new Float32BufferAttribute(tint3, 3));
    const sky = new Mesh(skyGeo, kit.own(new MeshBasicMaterial({
      vertexColors: true, side: BackSide, fog: false, depthWrite: false,
    })));
    sky.position.set(0, m.houseY, 0);
    sky.renderOrder = -1;
    root.add(sky);
  }

  // --- the walls of the house --------------------------------------------
  /**
   * The room the camera is standing in.
   *
   * Everything above this line dresses the thing the camera points *at*, and
   * for a long time that was the whole model: a stage, a floor, and an audience
   * sitting in the dark on it. That survives a camera which only ever looks
   * forward from one seat. It does not survive a camera the viewer can orbit,
   * and it does not survive a ceiling — a lid over a house with no walls is a
   * slab hanging in space, which is exactly what the low ceiling looked like
   * from every angle that could see its edge.
   *
   * So the house gets three sides. Not for their own sake, and not to be looked
   * at: they are what the ceiling terminates against, and a ceiling that meets
   * a wall reads as a ceiling where the same plane alone reads as a mistake.
   *
   * **Single-sided, deliberately.** The camera is now held inside the room in y
   * and was always held in z, but orbit yaw is not clamped at all and swinging
   * round the side of the house is a thing a viewer does in the first ten
   * seconds. Solid walls answer that with a black screen. These let you look
   * straight in from outside instead, which is the graceful version of the same
   * failure: the room disappears and the show does not.
   *
   * `openAir` opts out. A tanssilava is a roof on posts at the edge of a lake
   * and the entire point of it is that there is nothing at the sides.
   */
  if (!openAir) {
    // The *house* lid, not `m.headroom` — that publishes the lower of the two
    // ceilings for the camera's sake, and a wall built to it would stop a
    // handspan short of the plaster and leave a slot of nothing all round the
    // room. What a wall has to meet is the ceiling above it.
    const wallTop = lowCeiling ? -rise + LOW_CEILING
      : Number.isFinite(m.headroom) ? m.headroom : backHeight - rise;
    const wallH = wallTop - m.houseY;
    /**
     * Behind the camera, with room to spare. The wide shot stands at most
     * `depth * 0.25 + rows * 0.95 + 2.5` downstage of centre — `maxDistance`
     * in `camera.ts`, less the quarter-depth its aim point sits upstage — and
     * `houseDepth` is derived from the same row count, so the last seat is
     * always a little over a metre in front of that. The 1.6 m states the
     * margin rather than trusting it.
     */
    const houseBackZ = m.lipZ + m.houseDepth + 1.6;
    const wallRng = new Rng(`${venue.id}:walls`);
    const wallColour = shade(backColour, blackBox ? 0.25 : 0.32);
    const wallMat = kit.solid('#ffffff', { vertexColors: true, rough: 0.95 });

    /** The backdrop's own trick, so a brick room is brick the whole way round. */
    const wall = (w: number, h: number): BufferGeometry => cellPlane({
      width: w,
      height: h,
      cols: brick ? Math.round(w / 0.42) : 5,
      rows: brick ? Math.round(h / 0.2) : 3,
      colour: wallColour,
      jitter: brick ? 0.13 : 0.05,
      rng: wallRng,
      stagger: brick,
    });

    const sideDepth = houseBackZ - m.backZ;
    for (const side of [-1, 1]) {
      const mesh = new Mesh(kit.own(wall(sideDepth, wallH)), wallMat);
      mesh.position.set(side * (m.houseWidth / 2 + 0.6), m.houseY + wallH / 2, m.backZ + sideDepth / 2);
      mesh.rotation.y = side * -Math.PI / 2;
      mesh.receiveShadow = true;
      root.add(mesh);
    }

    const back = new Mesh(kit.own(wall(m.houseWidth + 1.2, wallH)), wallMat);
    back.position.set(0, m.houseY + wallH / 2, houseBackZ);
    back.rotation.y = Math.PI;
    back.receiveShadow = true;
    root.add(back);
  }

  // --- proscenium and masking -------------------------------------------
  const archColour = blackBox ? shade(p.proscenium, 0.5) : p.proscenium;
  const archMat = kit.solid(archColour, { rough: 0.7 });
  const mouldMat = kit.solid(blackBox ? archColour : tint(p.proscenium, 0.22), { rough: 0.5 });
  const archZ = m.lipZ + 0.28;
  const legW = 0.62;
  const legH = openingHeight + 1.1 + rise;

  for (const side of [-1, 1]) {
    const x = side * (openingWidth / 2 + legW / 2);
    const leg = new Mesh(kit.bevelBox(legW, legH, 0.55, 0.06), archMat);
    leg.position.set(x, legH / 2 - rise, archZ);
    leg.castShadow = false;
    root.add(leg);
    if (!blackBox) {
      const mould = new Mesh(kit.bevelBox(0.16, legH - 0.4, 0.66, 0.05), mouldMat);
      mould.position.set(x - side * (legW / 2 - 0.08), legH / 2 - 0.2 - rise, archZ);
      root.add(mould);
    }
    // Tormentors — flat panels running out to the edge of frame, so a wide
    // shot cannot see past the arch into nothing.
    const torW = 4;
    const tor = new Mesh(kit.bevelBox(torW, legH + 3, 0.3, 0.04), kit.solid(shade(archColour, 0.7)));
    tor.position.set(side * (openingWidth / 2 + legW + torW / 2 - 0.05), (legH + 3) / 2 - rise, archZ + 0.1);
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
