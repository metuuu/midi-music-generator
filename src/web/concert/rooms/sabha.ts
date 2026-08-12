/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The sabhā — warm plaster, a cloth stretched overhead, and almost no stage.
 *
 * Written as the room at the *other* end of the catalogue from `circuit`. An
 * arena is the room where the band is furthest from anybody; this is the room
 * where they are closest, and the whole of its job is that the difference is
 * legible in the first frame, next to a gilt concert hall, a touring shed and a
 * threshing barn. That is a harder brief than it sounds, because three of the
 * numbers that would carry it are not this file's to choose: `venue.ts` sets
 * ten rows at 0.8 density and `stage.ts` derives a 12.1 m house from them, so
 * the *hall* is fifteen metres by twenty however intimate the music is. The
 * intimacy has to be bought with the four numbers a room does own — how high
 * the band stands, how low the thing over them hangs, how close the walls come
 * in, and what the lamps are bolted to.
 *
 * ## What this room is
 *
 * A hall a Hindustani or Carnatic recital happens in: `indian/staging.ts` calls
 * it the Gandharva Hall, Kalā Mandir, the Baithak, and says in as many words
 * that the real thing is "a room in a house with thirty people in it and no
 * stage at all". So: lime-warm plaster on four close walls, a plain lit wall
 * behind the players, a shamiana stretched under the ceiling over the platform,
 * a row of pendant lamps on a painted batten, ceiling fans turning over the
 * audience, and a dais you step onto rather than climb.
 *
 * ## `rise` — 0.25 m, the lowest in the project, and why not lower
 *
 * `riihi.ts` has already done the arithmetic for zero and it is worth not
 * repeating: the house floor is a plane at `houseY` reaching past the lip and
 * past the back wall, the boards are a plane at 0, and at `rise` 0 they are
 * coplanar over the
 * whole playing area. Shimmering rectangle — but **nothing this file can do
 * about it, both planes belong to `stage.ts`** has stopped being true, and it
 * matters here more than it does in the barn. This file lays its own house
 * floor, three hundred lines down, and it is sized off the building the way
 * `salon.ts` argues for — which it was not when this paragraph was written.
 * The sentence stood here describing the fault *and naming the two rooms that
 * had been fixed*, which is exactly how the bug survived: a note recording a
 * known fault stops being read as an outstanding one. Only the boards belong to
 * `stage.ts`. So the question is not whether to have a
 * dais but how little of one to have.
 *
 * The barn stopped at 0.3 m and had to, because its house is **nine rows
 * standing** — a 1.74 m crown in the front row, against which a plank on two
 * blocks is already losing. This house is *seated*, ten rows of it, and the
 * front row's crowns land at `houseY + 1.14`. That releases the constraint the
 * barn was pinned by, and what replaces it is a positive claim rather than a
 * clearance: **at 0.25 m the front row's crowns sit 0.89 m above the boards**,
 * which is a hand's breadth under a cross-legged player's own crown. The front
 * row's eyes are level with the soloist's hands. That is the one fact about a
 * baithak that a photograph of one always shows, and it is worth exactly
 * 0.25 m — at the courtyard's 0.45 the same crowns are at 0.69 and the players
 * are looking down at the top of the audience's heads from a platform, which is
 * a small theatre, and every other room in the catalogue is already that.
 *
 * The floor of 0.25 is set by the apron rather than by the picture, and the
 * apron is `stage.ts`'s: it is `bevelBox(width, rise, depth)` under the boards
 * and the lip moulding is a 0.09 m bead hanging to −0.065. Under about 0.15 m
 * the moulding is most of the apron and there is no face left for the house to
 * read as being below; 0.25 leaves 0.19 m of it, which is one step, which is
 * what a vedika is.
 *
 * ## The posture this room is built for, and the one it will get
 *
 * `indian/staging.ts` says it plainly and it is the reason this paragraph
 * exists: **this music is performed sitting on the floor**, and `Posture` has
 * no floor value — `sit` is a chair — so `cast.ts` stages four cross-legged
 * players about half a metre too high, on furniture that is not there. Neither
 * `cast.ts` nor the instrument models are this file's to fix.
 *
 * So the room is dimensioned for the fix rather than for the bug, and it is
 * worth being exact about what that costs today, because "build for a future
 * state" is usually a way of shipping something that looks wrong now. It does
 * not, here, and the reason is that the whole difference lands in one number:
 * a floor-seated crown is about 0.95 m above the boards and a chair-seated one
 * about 1.45 m. Every clearance in this file is checked against **both**. The
 * front row is 0.06 m under the first and 0.56 m under the second — closer than
 * is comfortable in the fixed case and generous in the broken one, which is the
 * right way round for a room that is waiting for a fix. Nothing overhead comes
 * near either: the lowest thing this file hangs is a lamp shade at 3.07 m.
 *
 * ## Two lids, and the cloth is deliberately not the house one
 *
 * The hall has plaster at 4.35 m over the boards, and under it, over the
 * platform and the first two metres of the audience, a shamiana tied off to the
 * side walls and sagging 0.22 m in the middle. `headroom` is the **cloth**,
 * because `headroom` is the lowest thing over the boards and the camera has to
 * clear it. `houseLid` is the **plaster**, and that is a choice rather than a
 * transcription: the cloth does overhang the first rows, so the strictly lowest
 * thing over some of the house is 3.8 m and not 4.35.
 *
 * Publishing the cloth would be wrong in the direction that matters. Exactly
 * two things in this show are fixed to the house lid, and both are downstage of
 * the cloth's edge in all four eras — `chandelier` hangs at `houseLid − 0.08`
 * at `lipZ + houseDepth * 0.3`, which is 6.88 m, and `lights.ts` brackets the
 * follow spot at `houseLid − 0.3` at `lipZ + houseDepth * 0.42`, which is
 * 8.33 m, against a cloth edge at `lipZ + 2` = 5.25 m. Publishing 3.8 would
 * drop both by 0.55 m onto nothing, and would hang the follow spot *under* the
 * canopy it is supposed to be shooting over. `houseLid` is the surface a thing
 * is bolted to — `stage-kit.ts` says so at length — and over the part of the
 * house anything is bolted to, that surface is the plaster.
 *
 * ## Four eras, one building
 *
 * They differ in dressing and in light and in nothing else, and the genre
 * author had already decided that before this file existed: filmī is "the same
 * hall taken over by a studio" and fusion is the one where "the carpet stays
 * and everything else becomes a 1975 concert stage". Both sentences say *the
 * same hall*. The catalogue agrees from the other side — none of the four eras
 * names `open-air`, `brick`, `black-box` or `low-ceiling`, and the only
 * architectural modifier that ever reaches this room is `haze`, at p = 0.55 in
 * fusion, which is air rather than architecture and which `stage.ts` has
 * already spent on cards before this file is called.
 *
 * So this room reads **no** props, and that is a finding rather than an
 * omission. A sabhā that could also be a brick shell, a black box, a lidless
 * yard or a cellar would be a room with no opinion, and the point of moving the
 * building out of `stage.ts` was to stop rooms having no opinion. The one that
 * would genuinely break is worth naming since it would break silently:
 * `low-ceiling` makes `stage-props.ts` board the room over at `STAGE_SOFFIT`,
 * 2.85 m above the boards, under a `headroom` of 3.8 that the camera trusts —
 * every wide shot would then be taken through a ceiling. The answer to that is
 * not a branch here. It is that a sabhā with a cellar's soffit in it is a
 * different room and should be a different file.
 *
 * ## What this file does not draw
 *
 * The dais is the boards and `stage.ts` owns them; the carpet on it is a prop
 * and is on every era; `flowers`, `drapes` and `candles` are props. So this
 * file draws no floor covering, no hanging and no flame — what it draws is the
 * *surface the drapes hang against*, which is the plain lit wall upstage.
 *
 * That wall is plain on purpose and the courtyard is why. `hindustani` names
 * `arches`, and that prop arcades the back wall at `backZ + 0.22` with its
 * lintel topping out at 3.58 m. The courtyard learned that two files arcading
 * one wall put a second row of piers 0.2 m in front of the first; so the pilaster
 * runs below stop at the upstage corner and the wall behind the band carries
 * nothing at all. The 0.22 m of air the cloth leaves over that lintel is the
 * tightest clearance in the room and is the reason `CANOPY` is where it is.
 */

import {
  type BufferAttribute, type BufferGeometry, ConeGeometry, CylinderGeometry,
  DoubleSide, Group, InstancedMesh, Mesh, Object3D, PlaneGeometry, SphereGeometry,
} from 'three';

import {
  blend, cellPlane, hueShift, shade, tint,
} from '../stage-kit.js';
import {
  noCurtain, type RoomBuilder, type RoomContext, type RoomDatum, type RoomRig,
  type RoomShape,
} from './types.js';

/** How far the platform stands above the floor of the hall. See the header. */
const DAIS_RISE = 0.25;

/**
 * The lowest point of the shamiana, above the boards.
 *
 * Three numbers meet here and it is the only one of the eight that is not free.
 *
 * From **below**: `arches` is on the hindustani era and stands a lintel whose
 * top is at `spring + r + 0.54` — 2.25 + 0.79 + 0.54 = 3.58 m on a ten-metre
 * stage and 3.66 m if this room ever grew to filmī's width with an arcade in
 * it. The cloth sags to its lowest at mid-span, which is 4 m downstage of the
 * arcade, so what has to clear is the tie line and not the sag; but a canopy
 * that has to be measured against a prop to know whether it is inside the
 * building is a canopy with no margin, and 3.8 leaves 0.22 m over the worst
 * case with the sag ignored entirely.
 *
 * From **above**: `LENS_GAP` is 0.6, so this is the camera's ceiling plus
 * 0.6 m, and `clearCrowd` will not let a composed shot behind the front row
 * drop below `houseY + 2.54` = 2.29 m. At 3.8 the lens has 0.91 m of travel
 * between those two, which is the number the cellar's comment says a room needs
 * to have a camera rather than a fixed viewpoint.
 *
 * And from the **picture**: `wideEye` wants 3.6 m at any distance over 12 m and
 * this room gives it 3.2. The wide shot is held down, on purpose, by a ceiling
 * — which is the one thing a room can do to a camera and the only reason this
 * number is not simply 4.5.
 */
const CANOPY = 3.8;

/** How far the cloth bellies below the line it is tied off at. */
const CANOPY_SAG = 0.22;

/**
 * How far downstage of the lip the canopy runs out.
 *
 * A shamiana over a platform is not a proscenium border stopping at the lip; it
 * is pitched over the people at the front of the room as well, which is what
 * makes it a canopy and not a ceiling. Two metres puts its valance over the
 * gangway between the lip and the first row, and — see the header — keeps its
 * edge upstage of both things fixed to the house lid.
 */
const CANOPY_RUN = 2.0;

/** How much higher the hall's own plaster is than the cloth under it. */
const PLASTER_OVER = 0.55;

/**
 * How far outside the house the walls stand — the minimum `rooms/types.ts`
 * allows, taken at the minimum for the same reason the barn takes it there.
 * Every centimetre further out is a centimetre of hall this room is trying not
 * to have.
 */
const WALL_OUT = 0.6;

/** How far a pilaster stands proud of the plaster behind it. */
const PILASTER_PROUD = 0.16;

/** A hall bay. Wide enough to be architecture, close enough to be a rhythm. */
const BAY = 3.0;

function shape(d: RoomDatum): RoomShape {
  const rise = DAIS_RISE;
  return {
    rise,
    /**
     * The whole width of the platform, and nothing masks it.
     *
     * The courtyard's argument and the barn's, unchanged, because it is the
     * same argument: there is no arch, no leg and no tormentor in this room, a
     * player sitting on the corner of the dais is seen from every seat, and the
     * honest fraction is 1.0. What makes it worth restating rather than
     * inheriting is that a sabhā is the room somebody would be most tempted to
     * narrow — it is *supposed* to feel small — and narrowing it is precisely
     * what the hard rule in `RoomShape` forbids: `cast.ts` clamps players to
     * `min(width/2 − 0.5, width * 0.47)` with no sight of this file, so an
     * aperture under `width − 1.0` would leave a tabla player outside the
     * picture with nothing able to tell the caster. Mask inside it or do not
     * mask.
     *
     * It is also what the arcade is sized off. `arches` takes its bay count
     * from this number, so the full width is what puts a five-bay arcade across
     * the whole back wall rather than a five-bay arcade with a metre of blank
     * plaster either side of it.
     */
    openingWidth: d.width,
    /**
     * Up to the cloth. In a theatre the aperture is the arch and in a barn it
     * is the gable; here it is the clear air between the platform and the
     * canopy, and above that line nothing hangs because above that line is
     * cloth.
     */
    openingHeight: CANOPY,
    /**
     * Where a cloth would be if there were one across the front, and there is
     * not — but `stage-props.ts` hangs drapes off this and `stage.ts` puts the
     * fly bar 1.1 m upstage of it, so it has to be the front of the room. Half
     * a metre in from the lip, which is the courtyard's number for the
     * courtyard's reason: a platform with no lip moulding to clear and no
     * footlight trough behind it puts the line where the lamp batten is
     * actually hung, and that is where this file hangs it.
     */
    curtainZ: d.lipZ - 0.5,
    /**
     * The batten. A handspan and a half under the cloth, which is as high as a
     * beam can be strapped to a sagging canopy and still be a beam under it
     * rather than a crease in it.
     *
     * The clearance below is what fixes the number rather than the aesthetic.
     * `lights.ts` short-yokes its pars at −0.10 under any finite lid, so their
     * cans bottom out at 3.33 m, and the pendant lamps this file hangs off the
     * same batten bottom out at 3.07 m — against `HANG_FLOOR` at 2.65 m and a
     * chair-seated crown at 1.45 m. Nothing on this bar can reach a face.
     */
    flyY: CANOPY - 0.25,
    /** The cloth, which is the lowest thing over the boards. See the header. */
    headroom: CANOPY,
    /** The plaster, which is what anything over the house is bolted to. */
    houseLid: CANOPY + PLASTER_OVER,
    /**
     * The cloth again, and it is the one room where publishing the *higher*
     * surface would be obviously wrong.
     *
     * `rigLid` is the surface a hanger over the boards is shackled to, and the
     * temptation in a room with two lids is to reach past the low one for the
     * structural one — the plaster at `CANOPY + PLASTER_OVER`. That is exactly
     * what must not happen here: the shamiana is stretched over the whole
     * platform, so a drop that went to the plaster would come up *through* the
     * canopy, in the one room whose entire overhead is that canopy. A shamiana
     * is not something you shackle a motor to; a truss under one is tied to the
     * same battens the cloth is, at the cloth.
     *
     * The residual against a raycast is the sag and is worth stating so nobody
     * closes it. `CANOPY` is the cloth's *low* point at mid-span — see the
     * header — and the truss's picks are out at `±(width / 2 − 0.4)`, where the
     * cloth has already climbed 0.103–0.110 m of its `CANOPY_SAG` toward the tie
     * line in the four eras. Publishing the height at the pick would put the
     * published rigging plane above the lowest thing in the room, which is a
     * number no other consumer could safely take a `Math.min` against.
     *
     * No era of this genre names `truss`. This is answered because `RoomShape`
     * requires it and because the wrong answer here is a specific one.
     */
    rigLid: CANOPY,
    /**
     * The wall behind the band, floor to plaster — it is a wall of the hall and
     * walls are measured from the ground. Full height rather than a coping
     * course: unlike a tanssilava's low wall this is not something anyone is
     * meant to see over, and `lights.ts` sizes the cyclorama glow at
     * `openingHeight * 1.06` = 4.03 m, which needs a surface at least that tall
     * behind it or the glow is a lit rectangle hanging in the dark.
     */
    backdropHeight: CANOPY + PLASTER_OVER + rise,
    /** The arcade's inner face. See `halfX` in `build`. */
    wallX: d.houseWidth / 2 + WALL_OUT,
  };
}

/**
 * Pull a surface's own vertex colours down toward its edges and its head.
 *
 * The brief for this room is warm plaster "with the corners falling to dark",
 * and there is no way to get that out of the lighting rig: `lights.ts` owns
 * every fixture, has one shadow-caster, and lights a flat plane to one number —
 * which is the same observation `courtyard.ts` makes about why a ceiling needs
 * cells to read as a ceiling at all. A wall lit to one number is a rectangle of
 * paint whatever colour it is painted, and the corners of a hall are the one
 * place a viewer reads volume from.
 *
 * So it is baked, in the only channel a room owns: `cellPlane` has already put
 * a per-cell colour on every vertex, and this multiplies it by a smooth ramp
 * over the outer half of the span. Costs one pass over an attribute that was
 * built a line earlier, adds no material, no light and no draw call, and
 * because it is albedo rather than shadow it survives the house lights coming
 * up — which a shadow would not, and which is what happens in the carnatic era
 * on purpose.
 *
 * Only upward in y. A wall is dark where it meets the ceiling and lit where the
 * floor bounces into it, so darkening the foot as well would put a black skirt
 * round a room whose whole subject is the people sitting at the bottom of it.
 */
function fallToDark(geo: BufferGeometry, w: number, h: number, depth: number): BufferGeometry {
  const pos = geo.getAttribute('position') as BufferAttribute;
  const col = geo.getAttribute('color') as BufferAttribute;
  /** Nothing over the inner half, smooth to full over the outer half. */
  const ramp = (t: number): number => {
    const u = Math.max(0, Math.min(1, (Math.max(0, t) - 0.5) * 2));
    return u * u * (3 - 2 * u);
  };
  for (let i = 0; i < pos.count; i++) {
    const k = 1 - depth * Math.max(
      ramp(Math.abs(pos.getX(i)) / (w / 2)),
      ramp(pos.getY(i) / (h / 2)),
    );
    col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k);
  }
  return geo;
}

function build(c: RoomContext): RoomRig {
  const p = c.venue.palette;
  const m = c.m;
  const rise = -m.houseY;
  /** The inner face of the side walls, and the outer edge of everything. */
  const halfX = m.houseWidth / 2 + WALL_OUT;
  /** Behind the last row, with the 1.6 m of margin every room keeps. */
  const houseBackZ = m.lipZ + m.houseDepth + 1.6;
  /** The plane the wall behind the band stands on. Everything upstage stops here. */
  const backWallZ = m.backZ - 0.1;
  /** Floor to plaster. Read back out of the metrics rather than recomputed. */
  const wallH = m.backdropHeight;
  const plasterY = m.houseY + wallH;

  const root = new Group();
  root.name = `room:${c.venue.id}`;

  // --- the floor of the hall ----------------------------------------------
  /**
   * Big polished slabs, laid dark.
   *
   * The courtyard paves its court in 0.62 m flags with a 0.13 jitter because a
   * yard is rough stone outdoors; this is the inside of a hall, so the slabs are
   * nearly twice the size and the jitter is halved — the difference between a
   * surface you can see the individual stones of and one you can only see the
   * joints in, which is the whole difference between a courtyard and a room at
   * the distance either is ever seen from.
   *
   * Colour off `proscenium` pulled halfway to `backdrop` and taken well down.
   * Not off `boards`: `boards` is the platform, the platform is under a carpet
   * that covers it corner to corner, and a hall floor the colour of the thing
   * the audience is looking at is one flat field with a band somewhere in it.
   *
   * Receives. It is the large flat thing under the room and it is what a shadow
   * lands on.
   */
  const floorW = m.houseWidth + 8;
  /**
   * Sized off the building, not off the house — and this room *knew*, which is
   * the part worth recording.
   *
   * It was `houseDepth + 8` centred on `lipZ + houseDepth / 2`: a house-shaped
   * number for a plane that has to reach past the house at both ends, pinning
   * the upstage edge at `lipZ - 4` and leaving the ground `depth - 4` metres
   * short of the back wall. The header three hundred lines up has said so in
   * as many words since it was written — *"still at `houseDepth + 8`"* — and it
   * stayed true for as long as the note describing it did.
   *
   * A comment that records a known fault is not a fix, and after a certain
   * amount of time it stops being read as one. That is the same failure as a
   * comment describing a limitation that has since been repaired, running in
   * the other direction: both end with the code and the prose disagreeing and
   * a reader trusting the prose.
   */
  const floorFrom = m.backZ - 2;
  const floorTo = m.lipZ + m.houseDepth + 4;
  const floorD = floorTo - floorFrom;
  const floor = new Mesh(
    c.kit.own(cellPlane({
      width: floorW, height: floorD,
      cols: Math.max(8, Math.round(floorW / 1.15)),
      rows: Math.max(8, Math.round(floorD / 1.15)),
      colour: shade(blend(p.proscenium, p.backdrop, 0.5), 0.46),
      jitter: 0.065, rng: c.rng('housefloor'),
    })),
    c.kit.solid('#ffffff', { vertexColors: true, rough: 0.72 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, m.houseY, (floorFrom + floorTo) / 2);
  floor.receiveShadow = true;
  root.add(floor);

  // --- the walls ------------------------------------------------------------
  /**
   * Lime plaster, warm, and the same single-sided decision every walled room in
   * this directory has made for the same reason: orbit yaw is not clamped,
   * swinging round the outside of the building is a thing a viewer does in the
   * first ten seconds, and a solid wall answers that with a black screen. These
   * let you look straight in instead — the room disappears and the show does
   * not.
   *
   * Four of them, closed at both ends, because a hall is a hall. The upstage
   * one runs the full span rather than the 1.2 × stage width a proscenium's
   * cloth takes, so it meets both side walls: `backdropHeight` describes it and
   * a backdrop that stopped 1.6 m short of each corner would leave two slots of
   * nothing at exactly the place a wide shot looks.
   *
   * The plaster is `proscenium` warmed toward `ambient` rather than cooled
   * toward `backdrop`. That single choice is most of what separates this room
   * from the courtyard on screen: limewash in a court is bleached by the sky
   * over it, and plaster in a hall is the colour of the lamps in the hall.
   */
  const wallRng = c.rng('walls');
  const wallColour = tint(blend(p.proscenium, p.ambient, 0.22), 0.06);
  const wallMat = c.kit.solid('#ffffff', { vertexColors: true, rough: 0.95 });
  const plaster = (w: number, h: number, colour: string, fall: number): Mesh => new Mesh(
    c.kit.own(fallToDark(cellPlane({
      width: w, height: h,
      cols: Math.max(4, Math.round(w / 1.5)),
      rows: Math.max(3, Math.round(h / 1.3)),
      colour, jitter: 0.05, rng: wallRng,
    }), w, h, fall)),
    wallMat,
  );

  const sideDepth = houseBackZ - backWallZ;
  for (const side of [-1, 1]) {
    const mesh = plaster(sideDepth, wallH, wallColour, 0.55);
    mesh.position.set(side * halfX, m.houseY + wallH / 2, backWallZ + sideDepth / 2);
    mesh.rotation.y = side * -Math.PI / 2;
    mesh.receiveShadow = true;
    root.add(mesh);
  }

  const rear = plaster(halfX * 2, wallH, wallColour, 0.55);
  rear.position.set(0, m.houseY + wallH / 2, houseBackZ);
  rear.rotation.y = Math.PI;
  rear.receiveShadow = true;
  root.add(rear);

  /**
   * The wall behind the band — this room's backdrop, and the only surface in it
   * that is meant to be looked at.
   *
   * Lighter than the other three and falling off half as hard, because it is
   * the one the follow spot and the cyclorama glow land on and a lit wall that
   * darkens at its own edges as fast as a side wall does reads as a spotlight
   * rather than as a wall with a light on it. It sits at `backZ − 0.1`, which
   * is where every room in this directory puts it: `lights.ts` draws the glow at
   * `backZ − 0.07`, so three centimetres further downstage, and a wall placed
   * flush would swallow it.
   *
   * Plain. See the header — `arches` arcades this surface in the hindustani era
   * and two files arcading one wall is the collision the seam exists to make
   * impossible.
   */
  const back = plaster(halfX * 2, wallH, tint(wallColour, 0.07), 0.28);
  back.position.set(0, m.houseY + wallH / 2, backWallZ);
  back.receiveShadow = true;
  root.add(back);

  // --- pilasters ------------------------------------------------------------
  /**
   * Shallow plaster piers dividing the side and rear walls into bays.
   *
   * The room needs something with thickness in it and this is the cheapest
   * honest candidate. Three walls of flat plaster with a colour ramp on them are
   * still three flat planes: they have no silhouette, they catch no highlight
   * along an edge, and — the part that actually shows — they are the only
   * surfaces in this room large enough to receive the one shadow the budget
   * allows, with nothing standing in front of them to cast one. A pier is a
   * chunky solid standing on a floor, which is exactly the class the shadow
   * policy says casts, so these are what give the walls their own relief.
   *
   * Deliberately *not* an arcade. The courtyard has one and it is that room's
   * whole subject; an arcade here would say Damascus, and — more practically —
   * `arches` is already going to stand one against the wall behind the band.
   * A pilaster is the same wall articulated without a single opening in it,
   * which is what a hall built for listening in actually has.
   *
   * The corners belong to the side runs, so the rear run is inset by half a bay
   * and carries none: two piers meeting in one corner is a corner with a step
   * in it.
   *
   * Two instanced meshes for all twenty-one of them. Twenty-one shafts and
   * twenty-one caps as `Mesh`es is forty-two draw calls for something nobody
   * looks directly at.
   */
  const stone = c.kit.solid(shade(tint(wallColour, 0.1), 0.12), { rough: 0.9 });
  const shaftH = wallH - 0.2;
  const capH = 0.13;
  const runs: { along: 'z' | 'x'; at: number; from: number; to: number; inset: boolean }[] = [
    { along: 'z', at: -halfX, from: backWallZ, to: houseBackZ, inset: false },
    { along: 'z', at: halfX, from: backWallZ, to: houseBackZ, inset: false },
    { along: 'x', at: houseBackZ, from: -halfX, to: halfX, inset: true },
  ];
  const plan = runs.map((r) => {
    const span = Math.abs(r.to - r.from);
    const bays = Math.max(2, Math.round(span / BAY));
    return { ...r, span, bays, count: r.inset ? bays : bays + 1 };
  });
  const total = plan.reduce((sum, r) => sum + r.count, 0);

  const dummy = new Object3D();
  const shafts = new InstancedMesh(
    c.kit.bevelBox(0.34, shaftH, PILASTER_PROUD, 0.03), stone, total);
  const caps = new InstancedMesh(
    c.kit.bevelBox(0.46, capH, PILASTER_PROUD + 0.09, 0.03), stone, total);
  let pi = 0;
  for (const run of plan) {
    const step = run.span / run.bays;
    const lo = Math.min(run.from, run.to);
    for (let i = 0; i < run.count; i++) {
      const along = lo + (run.inset ? (i + 0.5) : i) * step;
      /** Inward off the wall face, by half the depth it stands proud. */
      const off = -Math.sign(run.at || 1) * PILASTER_PROUD / 2;
      const x = run.along === 'z' ? run.at + off : along;
      const z = run.along === 'z' ? along : run.at + off;
      const yaw = run.along === 'z' ? Math.PI / 2 : 0;
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.setScalar(1);
      dummy.position.set(x, m.houseY + shaftH / 2, z);
      dummy.updateMatrix();
      shafts.setMatrixAt(pi, dummy.matrix);
      dummy.position.set(x, m.houseY + shaftH + capH / 2, z);
      dummy.updateMatrix();
      caps.setMatrixAt(pi, dummy.matrix);
      pi++;
    }
  }
  shafts.castShadow = true;
  caps.castShadow = true;
  root.add(shafts, caps);

  // --- the plaster overhead -------------------------------------------------
  /**
   * A flat lid over the whole hall, terminating against all four walls.
   *
   * `courtyard.ts` argues both halves of this and they hold here word for word:
   * a lid that stops short of a wall leaves a slot of nothing all round the
   * room, and `DoubleSide` because a hemisphere lights a single-sided plane from
   * whichever face it has and a ceiling lit from above is a ceiling the room
   * cannot see. Cells for the same reason again — a flat plane under a
   * hemisphere gets identical light at every pixel and reads as a hole.
   *
   * Neither casts nor receives. It is above every fixture in the rig, so a
   * shadow on it would have had to be cast upward.
   */
  const lidD = houseBackZ - backWallZ;
  const lid = new Mesh(
    c.kit.own(cellPlane({
      width: halfX * 2, height: lidD,
      cols: Math.max(4, Math.round(halfX * 2 / 1.3)),
      rows: Math.max(4, Math.round(lidD / 1.3)),
      colour: shade(blend(p.proscenium, p.backdrop, 0.52), 0.34),
      jitter: 0.07, rng: c.rng('ceiling'),
    })),
    c.kit.solid('#ffffff', { vertexColors: true, rough: 0.98, side: DoubleSide }),
  );
  lid.rotation.x = -Math.PI / 2;
  lid.position.set(0, plasterY, backWallZ + lidD / 2);
  root.add(lid);

  // --- the shamiana ---------------------------------------------------------
  /**
   * A cloth stretched from the wall behind the band out over the front of the
   * audience, tied off to the pilaster faces down both sides.
   *
   * It is the object that makes this room a sabhā rather than a small hall with
   * a low ceiling, and the reason is that it is *soft*. Everything else
   * overhead in this project is structure — a fly tower, a roof, a soffit, a
   * grid — and every one of them says the room was built to put something on.
   * A cloth says somebody put it up this afternoon for this evening, which is
   * exactly what a shamiana is and exactly what the music under it is like.
   *
   * The surface is `clothY` and nothing else may have an opinion about it. That
   * is not tidiness: the batten with the lamps on it is strapped to the
   * underside of this cloth, and a batten whose strap length was guessed rather
   * than solved is either floating under the canopy or driven through it. One
   * function, two consumers, and they cannot disagree.
   *
   * The sag is pinned at all four edges, which is what a stretched sheet does,
   * and it is why `headroom` is the *low* point rather than the tie line: the
   * cloth is lowest at mid-span, mid-span is over the boards, and a `headroom`
   * quoting the tie line would put the camera's ceiling 0.22 m inside the cloth.
   *
   * Neither casts nor receives — it is cloth, and the policy is explicit.
   */
  const clothW = (halfX - PILASTER_PROUD - 0.02) * 2;
  const clothFrontZ = m.lipZ + CANOPY_RUN;
  const clothD = clothFrontZ - backWallZ;
  const clothZ = backWallZ + clothD / 2;
  const tieY = m.headroom + CANOPY_SAG;
  const bump = (t: number): number => Math.sin(Math.PI * Math.max(0, Math.min(1, t)));
  /** How low the cloth hangs at a point under it. The one source of truth. */
  const clothY = (x: number, z: number): number => tieY - CANOPY_SAG
    * bump((x + clothW / 2) / clothW) * bump((z - backWallZ) / clothD);

  const clothGeo = c.kit.own(cellPlane({
    width: clothW, height: clothD,
    cols: Math.max(6, Math.round(clothW / 1.1)),
    rows: Math.max(6, Math.round(clothD / 1.1)),
    colour: tint(hueShift(p.curtain, 6, 0.05), 0.14),
    jitter: 0.085, rng: c.rng('canopy'),
  }));
  {
    const pos = clothGeo.getAttribute('position') as BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      // The plane is laid flat by a quarter turn about x, so its local +y runs
      // upstage and its local +z is world up. Displacing z is displacing height.
      pos.setZ(i, clothY(pos.getX(i), clothZ - pos.getY(i)) - tieY);
    }
    pos.needsUpdate = true;
    // Cells make it faceted rather than smooth, which is the right cloth: a
    // shamiana is panels seamed together and not a membrane.
    clothGeo.computeVertexNormals();
  }
  const cloth = new Mesh(
    clothGeo, c.kit.solid('#ffffff', { vertexColors: true, rough: 0.99, side: DoubleSide }),
  );
  cloth.rotation.x = -Math.PI / 2;
  cloth.position.set(0, tieY, clothZ);
  root.add(cloth);

  /**
   * The valance along the leading edge, which is what stops the canopy reading
   * as a sheet of coloured paper.
   *
   * A stretched cloth seen from underneath has no thickness and no end — it
   * simply stops, in mid-air, at a line. A pelmet hanging off the front gives it
   * both, and it is the piece of this room that is visible from the furthest
   * back seat. 0.24 m deep, hung off the tie line at the front where the cloth
   * has no sag, so its hem is at 3.78 m: 0.58 m above the camera's ceiling and
   * a metre and a half above anything on the boards.
   */
  const valance = new Mesh(
    c.kit.geometry(`valance|${clothW.toFixed(2)}`, () => new PlaneGeometry(clothW, 0.24)),
    c.kit.solid(shade(hueShift(p.curtain, 6, 0.05), 0.18), { rough: 0.99, side: DoubleSide }),
  );
  valance.position.set(0, tieY - 0.12, clothFrontZ);
  root.add(valance);

  // --- fans -----------------------------------------------------------------
  /**
   * Ceiling fans over the audience, turning.
   *
   * The one moving thing this room owns, and the only reason it has an `update`
   * at all. It earns that: a hall in Madras in December has fans in it, they are
   * the first thing anybody who has sat in one remembers, and — the part that
   * matters to a renderer — a still room full of seated silhouettes reads as a
   * photograph rather than as a place, however well it is lit. A few blades
   * turning slowly in the top of frame are the cheapest possible evidence that
   * the picture is alive.
   *
   * They hang under the *plaster*, over the house, and both halves of that are
   * load-bearing. Under the plaster because that is the surface they are bolted
   * to and `houseLid` is the field that answers it. Over the house because a fan
   * over the boards would be dressing inside the sightline — `HANG_FLOOR` is
   * 2.65 m and these sweep at 4.0 m, so the height is fine, but a rotating blade
   * crossing behind a soloist's head every second is the visual equivalent of a
   * click track.
   *
   * **Down the centre line**, and that was a correction rather than a first
   * guess. They started at ±0.3 of the house width, dodging the two things this
   * room already hangs over its audience — `chandelier` at ±0.17 of the house
   * width, and `lights.ts`'s follow-spot bracket at x = 0 — and the geometry of
   * that was fine and the picture was nothing at all. The ceiling only ever
   * appears as a band across the top of the frame, that band is a couple of
   * degrees of vertical field, and at ±4.2 m the fans were outside the
   * *horizontal* field for the whole of it. Four objects, sixteen blades, one
   * `update` and no photograph: the same cost-with-no-picture the truss's bevel
   * was stripped for.
   *
   * So they hang where a hall's fans actually hang, down its spine, and the
   * clash is resolved in z instead of x. The follow spot is a 0.3 m can at 0.42
   * of the house depth; the fans are at 0.28, 0.60 and 0.85 of it, so the
   * nearest blade tip is 0.88 m clear of it, and the chandeliers at ±2.38 m are
   * 1.3 m clear in x of a 0.66 m sweep on the centre line. The first one also
   * has to keep off the canopy's leading edge, which is why it starts at 0.28
   * rather than under the valance.
   *
   * Three instanced meshes for the lot — stems, hubs and every blade in the room
   * — so the whole rig is three draw calls and the per-frame cost is twelve
   * matrix writes.
   */
  const fanRng = c.rng('lamps');
  const fanCount = c.quality === 'low' ? 2 : 3;
  const fanY = m.houseLid - 0.34;
  const BLADE = 0.55;
  const HUB_R = 0.11;
  const FAN_AT = [0.28, 0.6, 0.85];
  const fans: { x: number; z: number; phase: number; rate: number }[] = [];
  for (let i = 0; i < fanCount; i++) {
    fans.push({
      x: 0,
      z: m.lipZ + m.houseDepth * FAN_AT[i]!,
      phase: fanRng.float(0, Math.PI * 2),
      // Nothing in a room like this is on the same speed as anything else, and
      // three fans in lockstep read as one object drawn three times.
      rate: fanRng.float(1.5, 2.3),
    });
  }
  const brass = c.kit.solid(
    shade(hueShift(p.proscenium, 24, 0.1), 0.42), { metal: 0.5, rough: 0.5 });
  const stems = new InstancedMesh(
    c.kit.geometry('fan-stem', () => new CylinderGeometry(0.028, 0.028, 0.34, 6)),
    brass, fanCount);
  const hubs = new InstancedMesh(
    c.kit.geometry('fan-hub', () => new CylinderGeometry(HUB_R, HUB_R * 0.82, 0.11, 10)),
    brass, fanCount);
  const blades = new InstancedMesh(
    c.kit.geometry('fan-blade', () => {
      const g = new PlaneGeometry(BLADE, 0.17);
      // Built out along +x from the hub so the instance can be spun about y at
      // the hub rather than translated round it every frame.
      g.rotateX(-Math.PI / 2);
      g.translate(HUB_R + BLADE / 2, 0, 0);
      return g;
    }),
    c.kit.solid(shade(p.boards, 0.34), { rough: 0.8, side: DoubleSide }),
    fanCount * 4,
  );
  for (let i = 0; i < fanCount; i++) {
    const f = fans[i]!;
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.position.set(f.x, m.houseLid - 0.17, f.z);
    dummy.updateMatrix();
    stems.setMatrixAt(i, dummy.matrix);
    dummy.position.set(f.x, fanY, f.z);
    dummy.updateMatrix();
    hubs.setMatrixAt(i, dummy.matrix);
  }
  root.add(stems, hubs, blades);

  const idle = c.reducedMotion ? 0.2 : 1;
  const spin = (t: number): void => {
    for (let i = 0; i < fanCount; i++) {
      const f = fans[i]!;
      const a = f.phase + t * f.rate * idle;
      for (let b = 0; b < 4; b++) {
        dummy.position.set(f.x, fanY - 0.02, f.z);
        dummy.rotation.set(0, a + b * Math.PI / 2, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        blades.setMatrixAt(i * 4 + b, dummy.matrix);
      }
    }
    blades.instanceMatrix.needsUpdate = true;
  };
  spin(0);

  // --- what the lamps hang on -----------------------------------------------
  /**
   * A painted batten strapped to the underside of the canopy, with five pendant
   * lamps clipped along the front of it. This room's entire answer to the fly
   * bar.
   *
   * There is no rig here and there is not going to be one. A sabhā is lit the
   * way a room is lit — lamps, at head height and above it, on whatever there
   * was to fix them to — and the honest object is a length of timber with flexes
   * hanging off it. `lights.ts` then hangs its six pars along the batten's local
   * x without knowing or caring that it is a plank, which is the whole point of
   * `flyBar` being an `Object3D` and not a pipe.
   *
   * The straps are solved off `clothY` rather than given a length, which is the
   * thing this room would otherwise have got wrong: the canopy sags, so the gap
   * between the batten and the cloth is different at each end of the bar and
   * different again in every era, because the cloth's span is `houseWidth` and
   * `houseWidth` grows with the room. A fixed 0.25 m strap is a strap through
   * the cloth in one era and a strap hanging in air in the next.
   *
   * The lamps hang 0.22 m downstage of the bar's centre line rather than on it.
   * `lights.ts` puts its pars at local z = 0 and its warm lamp at local z =
   * −0.35, so the front face is the one piece of this bar nothing else has
   * claimed — and a domestic pendant in front of a theatre lantern is also the
   * right way round to look at, since the pendant is the thing that is really
   * lighting the room.
   *
   * That offset is why each flex is two instances and not one: it moved the
   * lamps off the batten and left the drops beginning in mid-air until the spur
   * below was added. See `lampZ`.
   */
  const flyBar = new Group();
  flyBar.name = 'fly-bar';
  flyBar.position.set(0, m.flyY, m.curtainZ - 1.1);
  const battenW = Math.min(m.openingWidth + 0.8, clothW - 0.6);
  const batten = new Mesh(
    c.kit.bevelBox(battenW, 0.1, 0.11, 0.02),
    c.kit.solid(shade(p.boards, 0.42), { rough: 0.82 }),
  );
  flyBar.add(batten);

  const strapMat = c.kit.solid(shade(p.proscenium, 0.66), { metal: 0.35, rough: 0.6 });
  for (const side of [-1, 1]) {
    const sx = side * battenW * 0.38;
    const h = Math.max(0.08, clothY(sx, flyBar.position.z) - m.flyY - 0.05);
    const strap = new Mesh(c.kit.bevelBox(0.05, h, 0.05, 0.02), strapMat);
    strap.position.set(sx, h / 2 + 0.05, 0);
    flyBar.add(strap);
  }

  /**
   * Five of them, staggered off the six pars `lights.ts` runs along the same
   * bar. The pars land at ±1, ±0.6 and ±0.2 of `openingWidth / 2 − 0.8`; these
   * land on the halves, so the nearest approach is 0.6 m in x.
   *
   * The x is what does the work, and it is worth saying which way round that
   * is: the lamps' 0.22 m in z is clearance to look at, not clearance to rely
   * on, because the spur runs back to z = 0.045 and passes within a fingerwidth
   * of the pars' own plane at z = 0. Under a par it would foul the yoke; 0.6 m
   * away in x it cannot, in any era, since both sets are laid out as fractions
   * of the same `openingWidth` and the stagger is scale-free.
   */
  const lampN = 5;
  const flexTop = -0.05;
  const shadeR = 0.15;
  /**
   * How far downstage of the bar's centre line the whole pendant sits — one
   * number rather than the four copies of `0.22` this loop used to carry,
   * because the two places that have to agree about it are the lamp and the
   * flex that reaches it, and they stopped agreeing once already.
   *
   * That is the bug this spur exists to fix. The batten is 0.11 m deep, so its
   * front face is at z = 0.055; a plumb cylinder dropped at `lampZ` starts
   * 0.165 m in front of the wood with nothing whatever above it. The offset was
   * introduced later, to clear the pars, and the flex's anchor was never
   * re-solved — so all five lamps in all four eras hung on air. From the wide
   * shot the coincidence covers it (the eye is capped at `headroom − 0.6` and
   * the sightline climbs about 0.006 m across the gap, so the ray lands on the
   * batten's 0.10 m front face and the flex reads as attached); from the
   * `front` framing, or from any viewer orbit toward the side, the gap is seen
   * in profile and they are five cables beginning under a plank.
   *
   * So the flex turns the corner instead. `spurZ` starts it 0.010 m *inside*
   * the face rather than flush on it, because the batten's bottom-front edge is
   * bevelled 0.02 and a tube ending on the round of that bevel reads as a cable
   * stopped short of the timber; buried, it reads as a flex stapled to the
   * underside and turned over the front edge, which is what it is.
   *
   * Both inputs are this room's own constants and neither scales with the
   * house, so the one spur length is right in every era — `openingWidth` grows
   * 10 → 10.8 and `battenW` moves with the cloth, but only the lamps' x moves
   * and the spur rides at its own lamp's x. Nothing here reads a lid, so it is
   * equally correct under a finite one and under `Infinity`, and nothing moves
   * down, so `HANG_FLOOR` is untouched.
   */
  const lampZ = 0.22;
  const spurZ = 0.045;
  const spur = lampZ - spurZ;
  /**
   * Two instances a lamp: 0…lampN−1 are the drops, lampN…2·lampN−1 the spurs.
   */
  const flexes = new InstancedMesh(
    c.kit.geometry('lamp-flex', () => new CylinderGeometry(0.008, 0.008, 1, 4)),
    c.kit.solid(shade(p.backdrop, 0.4), { rough: 0.9 }), lampN * 2);
  /**
   * Open-ended, and double-sided because of it: a cone stands point-up with its
   * wide end down, which is already a pendant shade, and the face anybody in
   * this room ever sees is the *inside* of it.
   */
  const shades = new InstancedMesh(
    c.kit.geometry('lamp-shade', () => new ConeGeometry(shadeR, 0.15, 12, 1, true)),
    c.kit.solid(shade(hueShift(p.proscenium, 18, 0.1), 0.25), {
      metal: 0.45, rough: 0.45, side: DoubleSide,
    }),
    lampN);
  const bulbs = new InstancedMesh(
    c.kit.geometry('lamp-bulb', () => new SphereGeometry(0.055, 8, 6)),
    c.kit.basic(tint(p.ambient, 0.5)), lampN);
  for (let i = 0; i < lampN; i++) {
    const x = ((i / (lampN - 1)) * 2 - 1) * m.openingWidth * 0.36;
    /**
     * A hand's variation, because five identical flexes is a shop fitting. The
     * range is bounded above rather than eyeballed: at 0.26 m the bulb's underside
     * lands at 3.07 m, which is the lowest thing this room hangs anywhere and is
     * 0.42 m clear of `HANG_FLOOR`.
     */
    const flex = fanRng.float(0.18, 0.26);
    const yaw = fanRng.float(0, Math.PI);
    dummy.rotation.set(0, yaw, 0);
    dummy.scale.set(1, flex, 1);
    dummy.position.set(x, flexTop - flex / 2, lampZ);
    dummy.updateMatrix();
    flexes.setMatrixAt(i, dummy.matrix);
    dummy.scale.setScalar(1);
    dummy.position.set(x, flexTop - flex - 0.075, lampZ);
    dummy.updateMatrix();
    shades.setMatrixAt(i, dummy.matrix);
    dummy.rotation.set(0, 0, 0);
    dummy.position.set(x, flexTop - flex - 0.115, lampZ);
    dummy.updateMatrix();
    bulbs.setMatrixAt(i, dummy.matrix);
    /**
     * The spur, written last on purpose: the bulb above has already put
     * `dummy.rotation` back to zero and the shade put the scale back to one, so
     * laying the cylinder down here disturbs neither the shade's `yaw` nor the
     * drop's stretch on the next pass.
     *
     * The cylinder's axis is y, so a quarter turn about x lays it along z. The
     * 0.008 m tube then spans y −0.058…−0.042 and z 0.045…0.220: it is inside
     * the batten (y ≥ −0.05, z ≤ 0.055) at one end and swallows the drop's top
     * cap at the other, so batten, spur, drop, shade and bulb are one solid,
     * and that solid is already tied to the canopy through the straps.
     */
    dummy.rotation.set(Math.PI / 2, 0, 0);
    dummy.scale.set(1, spur, 1);
    dummy.position.set(x, flexTop, (spurZ + lampZ) / 2);
    dummy.updateMatrix();
    flexes.setMatrixAt(lampN + i, dummy.matrix);
  }
  flyBar.add(flexes, shades, bulbs);
  root.add(flyBar);

  /**
   * No cloth across the front, and therefore no curtain.
   *
   * `noCurtain()` reports the tabs as being exactly where the show asked for
   * them, immediately, so `show.ts` never stalls waiting for travel that will
   * not happen and the band is still hidden while it is being staged. The
   * reveal becomes a cut, and in this room that is not a compromise — it is what
   * happens. The audience is already sitting on the floor, the players walk on
   * with their instruments, sit down, and start tuning. There has never been a
   * curtain in front of a baithak.
   */
  const curtain = noCurtain();
  root.add(curtain.root);

  return { root, flyBar, curtain, update: (t) => spin(t) };
}

export const sabha: RoomBuilder = { shape, build };
