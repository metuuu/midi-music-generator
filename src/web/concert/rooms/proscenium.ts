/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The proscenium house — an arch, a curtain, a fly bar and three walls.
 *
 * This is `stage.ts` as it stood before rooms existed, lifted out whole and
 * changed in nothing but where it lives. That is the point of it: it is the
 * room every genre gets by not choosing one, so it has to be the room every
 * genre already had. **Thirteen of the fourteen in the catalogue** were still
 * built by this file on the day it was lifted out; eleven room authors and five
 * further genres have happened since, and the count is three of nineteen —
 * ambient's black box, iskelmä's pavilion and jazz's cellar, plus `venue.ts`'s
 * own `HOUSE`, which no genre reaches. Measured over venues rather than rooms it
 * is nine of the catalogue's seventy-two dressings. The obligation is unchanged
 * and is why the sentence is kept: whatever comes out of here comes out of it
 * identical, plank for plank.
 *
 * It is also, quietly, four buildings rather than one, and that is worth being
 * exact about because it is the reason a seam was needed at all rather than a
 * fifth modifier. `black-box`, `open-air`, `brick` and `low-ceiling` each
 * change *how the room is built* and not what stands in it, and each of them is
 * one or two `if`s deep inside a single function. Four is the number of
 * switches that fits in one file; the fifth would have been the one that turned
 * this into a lookup table with a function wrapped round it. Anything genuinely
 * new belongs in a sibling of this file now, not in another flag here — and a
 * room that is *this* room with different paint still belongs here, which is
 * the distinction the modifiers below are on the right side of.
 *
 * ## What each modifier is actually claiming
 *
 * `black-box` — matte black on every surface and no ornament: the mouldings and
 * the valance go, the arch and the backdrop darken. Still a proscenium, because
 * a gallery black box genuinely is one with the plaster painted out.
 *
 * `brick` — the cell trick with the rows staggered into a bond, on the backdrop
 * *and* on the walls, so a brick room is brick the whole way round. Colour and
 * texture only; nothing moves.
 *
 * `open-air` — the one that removes rather than darkens. No side or rear walls,
 * a low coped wall instead of a full-height cloth, and a sky dome behind it. It
 * still has an arch and a fly tower, because a tanssilava is a roofed bandstand
 * and that is what the roof is holding up.
 *
 * `low-ceiling` — the cellar. Two lids, a kerb instead of a stage, and a fly
 * bar bolted to the soffit rather than flown. This is the modifier that pushed
 * hardest against the single-file shape and it is still on the right side of
 * the line: everything it changes is a height.
 */

import {
  BackSide, type BufferGeometry, Color, Float32BufferAttribute, Group, Mesh,
  MeshBasicMaterial, PlaneGeometry, SphereGeometry,
} from 'three';

import { buildCurtain } from '../stage-curtain.js';
import {
  blend, cellPlane, hueShift, shade, tint,
  LOW_CEILING, STAGE_RISE, STAGE_SOFFIT,
} from '../stage-kit.js';
import type { RoomBuilder, RoomContext, RoomDatum, RoomRig, RoomShape } from './types.js';

/**
 * The stage height in a room with a lid on it.
 *
 * A cellar club does not have a stage, it has a *riser* — a platform you step
 * up onto, ankle-high to the people standing at the bar. `STAGE_RISE` is a
 * proscenium house: it puts the band above a standing crowd, which is what a
 * pavilion wants and what a basement has never once had.
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

/**
 * The proscenium's own numbers, exported so a room that is this room with
 * different walls can say so in one line rather than by copying eight
 * expressions and drifting from them. It was seven until `houseLid` stopped
 * being derived from `headroom` and became a field of its own, which is exactly
 * the drift this export exists to stop, arriving one level up.
 *
 * Take it and override what differs — `{ ...prosceniumShape(d), rise: 0.45 }`
 * is a legitimate and complete answer for a room whose only architectural claim
 * is that the band stands lower.
 */
export function prosceniumShape(d: RoomDatum): RoomShape {
  const lowCeiling = d.props.has('low-ceiling');
  const openAir = d.props.has('open-air');
  const rise = lowCeiling ? CELLAR_RISE : STAGE_RISE;
  const openingHeight = Math.max(3.6, Math.min(d.width * 0.44, 6.4));
  return {
    rise,
    openingWidth: d.width * 0.94,
    openingHeight,
    curtainZ: d.lipZ - CURTAIN_FROM_LIP,
    /**
     * The pipe, and in a cellar it is bolted to the soffit rather than flown.
     *
     * `openingHeight - 0.35` is a fly tower's answer and it stopped being true
     * the moment the stage got a lid: the arch is 3.6 m at its shortest and the
     * soffit is at 2.85, so the bar and everything the rig hangs on it — every
     * par, the warm lamp, the wires — sat *inside the ceiling*, invisible, with
     * their beams starting in the plaster. A fly bar cannot be higher than the
     * room; where there is no fly tower it is a length of scaffold on drop-arms
     * a handspan under the plaster, which is what this is.
     */
    flyY: lowCeiling ? STAGE_SOFFIT - 0.13 : openingHeight - 0.35,
    headroom: lowCeiling ? Math.min(-rise + LOW_CEILING, STAGE_SOFFIT) : Infinity,
    houseLid: lowCeiling ? -rise + LOW_CEILING : Infinity,
    /** A cloth indoors; a low wall you are meant to see over, outdoors. */
    backdropHeight: openAir ? 2.4 : openingHeight + 2.2,
  };
}

function build(c: RoomContext): RoomRig {
  const p = c.venue.palette;
  const m = c.m;
  const blackBox = c.props.has('black-box');
  const openAir = c.props.has('open-air');
  const brick = c.props.has('brick');
  const lowCeiling = c.props.has('low-ceiling');
  const rise = -m.houseY;
  const { width, openingWidth, openingHeight } = m;
  const backHeight = m.backdropHeight;

  const root = new Group();
  root.name = `room:${c.venue.id}`;

  /**
   * The house floor — and the crowd is standing on it, which it did not look
   * like.
   *
   * The audience is unlit by design: `MeshBasicMaterial`, near black, so it
   * reads as silhouette instead of as a hundred badly lit people. That only
   * works if there is something *behind* the silhouette. This was one flat
   * plane of `shade(blend(boards, backdrop, 0.6), 0.6)` — 26 counts of brown
   * before any light reached it — so in the cellar the crowd was a field of
   * dark shapes on a darker nothing, floating, with no ground plane to sit the
   * heads on. The same failure as the ceiling and the same two-part fix: an
   * albedo that can return the light it gets, and cells so it is a surface
   * rather than a fill.
   *
   * It gets the better half of the light, unlike the ceiling — a floor faces
   * the hemisphere's *sky* colour and every directional in the rig is above it
   * — so it needs less help and gets a smaller lift: dark boards you can see
   * the grain of, not a lit floor competing with the stage.
   */
  const floorRng = c.rng('housefloor');
  const floorW = m.houseWidth + 8;
  /**
   * Sized off the building, not off the house — which is a bug fix rather than
   * a tidy-up, and the salon found it rather than this room.
   *
   * It was `houseDepth + 8` centred on `lipZ + houseDepth / 2`: a house-shaped
   * number for a plane that has to reach past the house at *both* ends. That
   * pins the upstage edge at `lipZ - 4` no matter what the room is, and since
   * `lipZ` and `backZ` are `±depth / 2`, the ground runs out `depth - 4` metres
   * short of the back wall in **every venue deeper than four metres — which is
   * all thirteen dressings this room and the courtyard are ever asked for**:
   * 1.40 m in jazz's club, 2.30–2.60 m in iskelmä and ambient, 3.60 m in
   * arabic's widest court. The house floor sits a stage height *below* the
   * boards, so what goes missing is the ground beside and behind the stage, and
   * it renders as a black triangle in each bottom corner of a wide shot.
   *
   * A proscenium is the hardest room in the set to catch it in, and that is why
   * it survived here: the tormentors two hundred lines down exist to stop "a
   * wide shot seeing past the arch into nothing", and the wedge they cover is
   * exactly this one. But they are front-on geometry standing at `archZ`, and
   * orbit yaw is not clamped anywhere in this renderer — the courtyard says so
   * in its own wall comment, that swinging round the outside is something a
   * viewer does in the first ten seconds. Masked from one angle is not the same
   * as present, and a floor is cheaper than an argument about camera limits.
   *
   * Upstage it goes 2 m past `backZ`, which is behind the backdrop and
   * therefore never seen; downstage it keeps the reach it already had, because
   * that end was never the fault and moving it would change every shot of the
   * crowd for nothing.
   */
  const floorFrom = m.backZ - 2;
  const floorTo = m.lipZ + m.houseDepth + 4;
  const floorD = floorTo - floorFrom;
  const houseFloor = new Mesh(
    c.kit.own(cellPlane({
      width: floorW, height: floorD,
      cols: Math.max(6, Math.round(floorW / 0.9)),
      rows: Math.max(6, Math.round(floorD / 0.9)),
      colour: shade(blend(p.boards, p.backdrop, 0.6), 0.34),
      jitter: 0.1, rng: floorRng,
    })),
    c.kit.solid('#ffffff', { vertexColors: true, rough: 0.95 }),
  );
  houseFloor.rotation.x = -Math.PI / 2;
  houseFloor.position.set(0, m.houseY, (floorFrom + floorTo) / 2);
  houseFloor.receiveShadow = true;
  root.add(houseFloor);

  // --- the backdrop ------------------------------------------------------
  // Brick is the same cell trick with the rows staggered into a bond; an
  // open-air stage gets a low wall and the night behind it instead.
  const backWidth = width * 1.2;
  const backColour = blackBox ? shade(p.backdrop, 0.55) : p.backdrop;
  const backRng = c.rng('backdrop');
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
      c.kit.bevelBox(backWidth, backHeight, 0.3, 0.04),
      c.kit.solid(backColour, { rough: 0.95 }),
    );
    wall.position.set(0, backHeight / 2 - rise, m.backZ - 0.25);
    wall.castShadow = true;
    wall.receiveShadow = true;
    root.add(wall);

    const coping = new Mesh(
      c.kit.bevelBox(backWidth + 0.18, 0.11, 0.46, 0.04),
      c.kit.solid(shade(p.proscenium, 0.22), { rough: 0.7 }),
    );
    coping.position.set(0, backHeight - rise + 0.05, m.backZ - 0.25);
    coping.castShadow = true;
    root.add(coping);
  } else {
    const backdrop = new Mesh(
      brick
        ? c.kit.own(cellPlane({
          width: backWidth, height: backHeight, cols: Math.round(backWidth / 0.42),
          rows: Math.round(backHeight / 0.2), colour: backColour, jitter: 0.13,
          rng: backRng, stagger: true,
        }))
        : c.kit.own(cellPlane({
          width: backWidth, height: backHeight, cols: 6, rows: 4,
          colour: backColour, jitter: 0.05, rng: backRng,
        })),
      c.kit.solid('#ffffff', { vertexColors: true, rough: 0.95 }),
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
   * the far distance, so a fog that pulled it toward the fog colour would only
   * be telling you the horizon is far away, which you can already see.
   *
   * The gradient is three bands and all three come from `Venue.palette`, so the
   * sixties tanssilava and the eighties one get different nights out of the
   * same arithmetic — the deep blue overhead is `backdrop`, the pale band at
   * the waterline is `ambient`, and below it darkens to a far shore. Finland in
   * July: the sun is barely down and the horizon never quite goes out.
   *
   * The horizon sits at the house floor, which is *below* the top of the back
   * wall — so from the front you see wall, then sky, and the shore only shows
   * once the camera is high enough or wide enough to look past the ends. That
   * is the right way round. The wall is the near thing and it should occlude.
   */
  if (openAir) root.add(skyDome(c, 90));

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
    /**
     * The *house* lid, not `m.headroom` — that publishes the lower of the two
     * ceilings for the camera's sake, and a wall built to it would stop a
     * handspan short of the plaster and leave a slot of nothing all round the
     * room. What a wall has to meet is the ceiling above it.
     */
    const wallTop = Number.isFinite(m.houseLid) ? m.houseLid : backHeight - rise;
    const wallH = wallTop - m.houseY;
    /**
     * Behind the camera, with room to spare. The wide shot stands at most
     * `depth * 0.25 + rows * 0.95 + 2.5` downstage of centre — `maxDistance` in
     * `camera.ts`, less the quarter-depth its aim point sits upstage — and
     * `houseDepth` is derived from the same row count, so the last seat is
     * always a little over a metre in front of that. The 1.6 m states the
     * margin rather than trusting it.
     */
    const houseBackZ = m.lipZ + m.houseDepth + 1.6;
    const wallRng = c.rng('walls');
    const wallColour = shade(backColour, blackBox ? 0.25 : 0.32);
    const wallMat = c.kit.solid('#ffffff', { vertexColors: true, rough: 0.95 });

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
      const mesh = new Mesh(c.kit.own(wall(sideDepth, wallH)), wallMat);
      mesh.position.set(side * (m.houseWidth / 2 + 0.6), m.houseY + wallH / 2, m.backZ + sideDepth / 2);
      mesh.rotation.y = side * -Math.PI / 2;
      mesh.receiveShadow = true;
      root.add(mesh);
    }

    const back = new Mesh(c.kit.own(wall(m.houseWidth + 1.2, wallH)), wallMat);
    back.position.set(0, m.houseY + wallH / 2, houseBackZ);
    back.rotation.y = Math.PI;
    back.receiveShadow = true;
    root.add(back);
  }

  // --- proscenium and masking -------------------------------------------
  const archColour = blackBox ? shade(p.proscenium, 0.5) : p.proscenium;
  const archMat = c.kit.solid(archColour, { rough: 0.7 });
  const mouldMat = c.kit.solid(blackBox ? archColour : tint(p.proscenium, 0.22), { rough: 0.5 });
  const archZ = m.lipZ + 0.28;
  const legW = 0.62;
  const legH = openingHeight + 1.1 + rise;

  for (const side of [-1, 1]) {
    const x = side * (openingWidth / 2 + legW / 2);
    const leg = new Mesh(c.kit.bevelBox(legW, legH, 0.55, 0.06), archMat);
    leg.position.set(x, legH / 2 - rise, archZ);
    leg.castShadow = false;
    root.add(leg);
    if (!blackBox) {
      const mould = new Mesh(c.kit.bevelBox(0.16, legH - 0.4, 0.66, 0.05), mouldMat);
      mould.position.set(x - side * (legW / 2 - 0.08), legH / 2 - 0.2 - rise, archZ);
      root.add(mould);
    }
    // Tormentors — flat panels running out to the edge of frame, so a wide shot
    // cannot see past the arch into nothing.
    const torW = 4;
    const tor = new Mesh(c.kit.bevelBox(torW, legH + 3, 0.3, 0.04), c.kit.solid(shade(archColour, 0.7)));
    tor.position.set(side * (openingWidth / 2 + legW + torW / 2 - 0.05), (legH + 3) / 2 - rise, archZ + 0.1);
    root.add(tor);
  }

  const headerH = 1.0;
  const header = new Mesh(c.kit.bevelBox(openingWidth + legW * 2 + 0.2, headerH, 0.55, 0.06), archMat);
  header.position.set(0, openingHeight + headerH / 2, archZ);
  root.add(header);
  if (!blackBox) {
    const headerMould = new Mesh(c.kit.bevelBox(openingWidth + legW * 2 + 0.3, 0.16, 0.66, 0.05), mouldMat);
    headerMould.position.set(0, openingHeight + 0.08, archZ);
    root.add(headerMould);
  }
  // Masking above the header, up out of frame.
  const above = new Mesh(c.kit.bevelBox(openingWidth + legW * 2 + 9, 4, 0.3, 0.04), c.kit.solid(shade(archColour, 0.72)));
  above.position.set(0, openingHeight + headerH + 2, archZ + 0.1);
  root.add(above);

  // --- wings -------------------------------------------------------------
  const wingMat = c.kit.solid(shade(p.curtain, 0.45), { rough: 0.98, side: BackSide });
  const wingGeo = c.kit.geometry(`wing|${openingHeight}`, () => new PlaneGeometry(2.4, openingHeight + 1));
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
    c.kit.bevelBox(openingWidth + 1.2, 0.09, 0.09, 0.045),
    c.kit.solid(shade(p.proscenium, 0.65), { metal: 0.55, rough: 0.45 }),
  );
  flyBar.add(pipe);
  /**
   * What holds it up, and it has to reach something. 2.6 m of wire going up
   * from a bar 0.16 m under a soffit is 2.44 m of steel through the ceiling —
   * the same mistake as the bar itself, one level down. In a low room these are
   * drop-arms to the plaster, which is how a pipe is hung where there is
   * nothing above it to fly from.
   */
  const wireH = lowCeiling ? Math.max(0.06, STAGE_SOFFIT - m.flyY - 0.045) : 2.6;
  for (const side of [-1, 1]) {
    const wire = new Mesh(
      c.kit.bevelBox(0.03, wireH, 0.03, Math.min(0.014, wireH * 0.3)),
      c.kit.solid(shade(p.proscenium, 0.75), { metal: 0.5, rough: 0.5 }),
    );
    wire.position.set(side * (openingWidth / 2 - 0.6), wireH / 2, 0);
    flyBar.add(wire);
  }
  root.add(flyBar);

  // --- the curtain -------------------------------------------------------
  const curtain = buildCurtain({
    kit: c.kit,
    width: openingWidth,
    height: openingHeight,
    z: m.curtainZ,
    colour: p.curtain,
    valance: !blackBox,
    reducedMotion: c.reducedMotion,
    quality: c.quality,
  });
  root.add(curtain.root);

  return { root, flyBar, curtain };
}

/**
 * The night, as a sphere seen from the inside.
 *
 * Exported because it is the one piece of this room that a room with no walls
 * at all cannot do without and would otherwise copy: a courtyard is open to the
 * same sky a tanssilava is, and two hand-tuned three-band gradients drift apart
 * on the first palette change. Everything in it is a function of
 * `Venue.palette`, so sharing it shares the arithmetic and not the look.
 *
 * `radius` is the caller's because it has to contain whatever the room's own
 * dressing reaches: the dome writes no depth and draws first, so anything
 * *outside* it paints over the sky instead of being hidden by it. At 60 m the
 * pavilion's 90 m `lake` put its far edge as a hard line a fraction of a degree
 * above the horizon. The camera's far plane is 120 m, so there is room up to
 * about 104 m of diagonal.
 */
export function skyDome(c: RoomContext, radius: number): Mesh {
  const p = c.venue.palette;
  // 32 rings rather than 16: the gradient is shaped finer than the mesh at the
  // horizon, which is the one part of it anybody looks at, and a band of 11°
  // there smears the glow halfway up the sky. Two thousand triangles.
  const skyGeo = c.kit.own(new SphereGeometry(radius, 24, 32));
  const pos = skyGeo.getAttribute('position');
  const tint3 = new Float32Array(pos.count * 3);
  const zenith = new Color(shade(p.backdrop, 0.4));
  const horizon = new Color(tint(hueShift(p.ambient, -8, 0.05), 0.12));
  const shore = new Color(shade(p.backdrop, 0.8));
  const band = new Color();
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / radius;
    // Below the waterline the shore closes in fast; above it the pale band is
    // thin and the blue takes over. `pow` rather than a straight ramp so the
    // glow hugs the horizon instead of washing halfway up the sky.
    band.copy(horizon).lerp(t < 0 ? shore : zenith,
      t < 0 ? Math.min(1, -t * 7) : Math.min(1, Math.pow(t, 0.55)));
    tint3[i * 3] = band.r;
    tint3[i * 3 + 1] = band.g;
    tint3[i * 3 + 2] = band.b;
  }
  skyGeo.setAttribute('color', new Float32BufferAttribute(tint3, 3));
  const sky = new Mesh(skyGeo, c.kit.own(new MeshBasicMaterial({
    vertexColors: true, side: BackSide, fog: false, depthWrite: false,
  })));
  sky.position.set(0, c.m.houseY, 0);
  sky.renderOrder = -1;
  return sky;
}

export const proscenium: RoomBuilder = { shape: prosceniumShape, build };
