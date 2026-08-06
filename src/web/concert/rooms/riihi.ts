/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The riihi — a log threshing barn with a pitched roof and no stage in it.
 *
 * `finnfolk/staging.ts` opens with the sentence this file exists to draw: *a
 * barn with the doors shut, because it is October.* Its header spends four
 * paragraphs arguing that the genre is not iskelmä, and the argument turns
 * entirely on the building — the pavilion and the lawn own `open-air`, "a
 * tanssilava is outdoors because Finland has six weeks of summer, a riihi is
 * indoors because the other forty-six exist". Then it deliberately takes **no
 * room modifier**, because none of the four the proscenium offers is this: you
 * cannot paint out a log wall (`black-box`), a threshing barn has no masonry in
 * it (`brick`), and a roof is the one thing it certainly has (`open-air`).
 *
 * So the genre had nowhere to put its building and wrote the only two things it
 * could — `beams` and `hay` — and hoped a proscenium arch with brown paint on it
 * would be read as a barn. It was not. This is the room those two props have
 * been standing in the wrong version of.
 *
 * ## What is here that is nowhere else in the project
 *
 * **A pitched roof, seen from underneath.** Every other room in the catalogue
 * has a flat lid or open sky: the cellar's two plaster steps, the courtyard's
 * coffered slab, the tanssilava's night. Two planes meeting at a ridge is the
 * whole silhouette of this one, and it is the reason a riihi is legible in the
 * first second against a gilt hall and a black box — the ceiling is not level,
 * so the room reads as a *shape* rather than as a box with paint on it.
 *
 * **Log walls.** Horizontal round timbers with the ends crossing at the
 * corners, which is a texture with a direction: a stacked log wall is strongly
 * horizontal in a way plaster, brick, plank and cloth are not, and that alone
 * separates it from all four of the surfaces the proscenium can make. They are
 * drawn as *cylinders*, not as a striped plane, because the thing the eye reads
 * a log wall by is the shadow line where one round course meets the next, and a
 * `cellPlane` of horizontal bands gives the stripes with none of the roundness
 * — it is a barcode, and it looks like one.
 *
 * **One floor.** The band is standing on the same boards the dancers are, which
 * is the fact about this music the room has to get right; see `RIIHI_RISE`, the
 * longest argument in this file, for what "no stage" costs and where it stops.
 *
 * ## What this file does not draw
 *
 * `finnfolk` names `beams` and `hay` and both belong to `stage-props.ts`, which
 * places them for every room at once — a room drawing its own would draw them
 * twice. The line runs where `RoomShape` says it does: the roof *planes* and the
 * ridge are architecture and are here, the *timbers* under them are objects and
 * are the prop's. In particular there are no rafters in this file, however much
 * a pitched roof wants them, because a rafter is a timber and the prop is
 * already putting timber up there. What the planes get instead is a grain: the
 * boarding runs up the slope, from eaves to ridge, so that even with no prop at
 * all the roof has a direction.
 *
 * That division pays off twice over, and both are worth stating because they
 * were checked rather than hoped for. `beams` hangs its tie beams at
 * `headroom - 0.22` and runs them 6 m past the walls, on the argument that "an
 * edge in mid-air reads as a mistake and the only cure is for every edge to die
 * into something". In a rectangular room the something is a wall. Here the
 * published `headroom` is the roof soffit over the *edge of the boards*, so a
 * tie beam is visible for about 10.7 m across the middle of the room and both
 * ends disappear into the rafters — which is not a beam that has been hidden,
 * it is a **collar**, the member that actually spans between two rafters part
 * way up a roof. And `houseLid` is the same number, so the follow spot, which
 * hangs 0.3 m under it, lands inside the tie beams' own 0.24 m section: a
 * lantern nailed to a beam, which is the only place a lantern in a barn has ever
 * been.
 *
 * ## The modifiers
 *
 * `low-ceiling` is answered and is the only one that is. It is in `runo`'s
 * `maybe` at 0.3, and `beams`'s own comment names the collision it makes — "a
 * room that names both this and `low-ceiling` is describing a contradiction that
 * only the room can settle". This is the settlement, and it is forced rather
 * than chosen: `stage-props.ts` draws a limewashed lid at `houseY + LOW_CEILING`
 * and a soffit at `STAGE_SOFFIT` whenever that prop is named, whatever this file
 * publishes, and both of them are `DoubleSide` planes spanning the entire room.
 * A pitched roof 6 m up behind a flat ceiling 3.6 m up is two buildings, and the
 * one you can see is the wrong one. So on those seeds the barn takes the lid it
 * has been given: the log walls run up past it, the roof is not built at all —
 * geometry nothing can see is geometry nobody should pay for — and
 * `backdropHeight` is measured to the wall head rather than to a ridge that is
 * not there, because a cyclorama glow sized to an invisible ridge is a lit
 * rectangle on nothing, which is the exact bug `backdropHeight` was added after.
 *
 * It is also not a contradiction in the building. A riihi has two rooms: the
 * `luuva`, the threshing floor, open to the roof — and the drying chamber
 * itself, which is boarded over at the height of the `parret` so the kiln heat
 * stays in it. `low-ceiling` is the second room, and the second room is where
 * somebody sings in October rather than where a village dances in June, which is
 * precisely which era draws it.
 *
 * `haze` is `contemporary`'s and changes nothing here: somebody brought a
 * machine, and a machine is not a wall. `open-air`, `brick` and `black-box` are
 * not answered and should not be — a barn with no roof is a `lato`, a barn made
 * of brick is a different country, and a barn painted matte black is a joke this
 * room is not in on. A genre wanting any of the three wants `proscenium`.
 *
 * ## The eras do not differ, and that is the answer rather than a shortcut
 *
 * `runo`, `pelimanni`, `revival` and `contemporary` span about three hundred
 * years and every one of them stages in this same building at the same eight
 * numbers. Two things say it should be that way. The first is the genre's own:
 * the four dressings differ by *taking the hay out and putting a PA in*, which
 * is a change stated in props, and `StageRoom.eras` already carries the palette,
 * the props, the fog and the size for exactly that. The second is that the
 * building is the thing that did not change — a log barn put up in 1780 is
 * standing in 1975 with a Kaustinen soittokunta in it and standing in 2005 with
 * a lighting truss bolted to its collars, and *that is the joke the genre is
 * making*. A room that got tidier by 1975 would be a different barn, and a
 * different barn is the one thing four eras of this music do not have.
 *
 * What does move is `Venue.width`, which the eras grow from 9.6 m to 10.4 m —
 * and the roof rides it out with one number to spare. `houseWidth` is
 * `width + 4` and the walls stand `WALL_OUT` outside that, so the wall is
 * *always* exactly 2.6 m outboard of the edge of the boards whatever the era
 * does, and the roof soffit over the band comes out within 5 cm of the same
 * height in all four. **The ridge is the only thing that grows, by 20 cm** —
 * which it does not, and has the argument the wrong way round. `RIDGE_RISE` is
 * a height rather than an angle and `COURSES` is a count rather than a height,
 * so nothing the ridge is made of can see `width`: measured, it is 5.99 m in
 * all four eras. What moves is the *soffit*, and downward — 3.744, 3.730, 3.710
 * and 3.690 m over the boards, 5.4 cm of shallower roof over a barn that got
 * 80 cm wider. That is still what a real building does, and it is what
 * `RIDGE_RISE`'s own note says two hundred lines down.
 */

import {
  BufferGeometry, Color, CylinderGeometry, DoubleSide, Float32BufferAttribute,
  Group, InstancedMesh, Mesh, Object3D, PlaneGeometry,
} from 'three';

import type { Rng } from '../../../core/rng.js';
import {
  blend, cellPlane, hueShift, shade, tint,
  LOW_CEILING, STAGE_SOFFIT,
} from '../stage-kit.js';
import {
  noCurtain, type RoomBuilder, type RoomContext, type RoomDatum, type RoomRig,
  type RoomShape,
} from './types.js';

/**
 * How far the band stands above the threshing floor, and the number this room
 * argued longest about.
 *
 * **The honest answer is zero and zero does not work.** A riihi has no
 * platform; the band is on the floor with the dancers, and that is not a detail
 * of the staging, it is the fact about pelimanni music that everything else in
 * `finnfolk/` is downstream of. So zero was tried first, and it fails twice, in
 * both cases against files this room may not touch.
 *
 * The first is arithmetic and fatal. The house floor is a plane
 * at `houseY` reaching past the lip and past the back wall — it has to, because
 * the house is
 * `width + 4` wide and the boards are not, so there is floor either side of the
 * band and floor behind them. At `rise` 0 that plane is at y = 0 and the boards
 * are at y = 0, and the two overlap over the whole playing area of exactly
 * coplanar geometry. That is z-fighting: not a
 * subtle error, a shimmering rectangle under the band that changes with the
 * camera. **Nothing this file can do prevents it, because both planes belong to
 * `stage.ts`** — which was true when this was written and is not now. The house
 * floor is a *room's*, and this file lays its own two hundred lines down; the
 * boards are still `stage.ts`'s. That makes the coplanarity this room's own to
 * cause, which strengthens the argument rather than weakening it: `rise` is the
 * one number that keeps two planes this file can see apart. The reach was
 * `lipZ - 4` then, and the proscenium has since been fixed to measure from the
 * building instead. The apron goes the same way for a milder reason — it is built as
 * `bevelBox(width, rise, depth)`, and at zero height that is a flat sheet 6 mm
 * under the boards with no face on it, which is what the apron *is*: the thing
 * that makes the house read as being below the band.
 *
 * The second is the picture. This house is **nine rows standing** — `seated:
 * false`, and `finnfolk/staging.ts` explains at length that for three of the
 * four eras the audience *is* the dance. A standing figure here is 1.62 m to the
 * middle of the head and 1.74 m to the top of it. At `rise` 0 the front row's
 * crowns are therefore level with a standing fiddler's chin and a long way above
 * a seated kantele player's head, from every camera in the room, permanently.
 *
 * 0.3 m is one step. It is what `finnfolk/staging.ts` already says the stage in
 * this room is — "a plank across two trestles, which is what the stage was
 * anyway" — and it is a plank on two blocks rather than a platform: 10 cm lower
 * than the drum riser that stands on it, which is a funny thing to be able to
 * say and is exactly right, since the riser is a real object somebody carried in
 * and this is not.
 *
 * The cost is real and is named rather than hidden. At 0.3 m the front row's
 * crowns sit at 1.44 m above the boards, which is under a standing player's
 * shoulder and across a seated player's chest. From a low camera in the house
 * there are heads between the lens and the band. The cellar's own comment
 * refuses to call that a defect and it is right: it is the photograph everybody
 * has seen of a room like this, and in a barn it is not even the photograph —
 * it is what being at a barn dance is. Anything from 0.45 m upward buys the
 * sightline back and buys a stage with it, and a stage is the one thing this
 * room is not allowed to have.
 */
const RIIHI_RISE = 0.3;

/** Radius of a wall log. A 23 cm round timber, which is a wall you can lift. */
const LOG_R = 0.115;

/**
 * How many courses stand between the floor and the wall plate.
 *
 * Thirteen of them, so the wall head is at 2.99 m — and it is stated as a course
 * count rather than as a height because that is the decision somebody building
 * one actually makes. You do not choose a 3 m wall, you stack logs until it is
 * tall enough to walk a loaded cart in under, and stop. It also means the wall
 * does not scale with the room, which is right for the same reason: a wider barn
 * is not built of taller logs, it is built of longer ones.
 */
const COURSES = 13;

/** The wall plate, above the house floor. See `COURSES`. */
const EAVES = 2 * LOG_R * COURSES;

/**
 * How far the ridge stands above the wall plate — a height, not an angle, and
 * the distinction is what keeps this a barn.
 *
 * A small riihi is 6 m across the walls and carries the 45° roof Finland's snow
 * asks for, which puts its ridge 3 m up. This room cannot be 6 m across:
 * `houseWidth` is `width + 4` and the walls have to stand outside it, so the
 * span is nearly 15 m. Holding the *angle* at 45° over that span puts the ridge
 * 7.4 m above the wall head and 10.4 m above the floor, and a 10 m interior with
 * a pitched roof over it is not a barn, it is a nave. Holding the ridge height
 * instead gives a 22° roof, which is what a wide span gets in practice anyway —
 * you cannot rafter 15 m without purlins, and once there are purlins the pitch
 * is free to lie down.
 *
 * So: 3.0 m of ridge, and the pitch falls out of however wide the barn is. It
 * also means the ridge is at the same height in all four eras while the roof
 * gets very slightly shallower as the room grows, which is the correct way round
 * — the eras are dressings of one building, and one building has one ridge.
 */
const RIDGE_RISE = 3.0;

/**
 * How far outside the house the walls stand. The minimum `rooms/types.ts`
 * allows, and taken at the minimum deliberately: every centimetre further out is
 * a centimetre of span the roof has to climb over before it reaches the band,
 * and this room is trying to be low.
 */
const WALL_OUT = 0.6;

/** How far a log end runs past the corner it crosses. See `logWalls`. */
const LOG_PROJECT = 0.34;

/** The cart doors. Wide enough to back a load of sheaves through, and no wider. */
const DOOR_W = 2.8;
const DOOR_H = 2.35;

/**
 * The building, solved once and read by both halves of the contract.
 *
 * `shape()` may not build and `build()` may not disagree with `shape()`, so the
 * arithmetic that decides how tall the barn is lives in neither of them. The
 * courtyard solves the same problem by reading `m.backdropHeight` back out of
 * the finished metrics; that works there because a courtyard is one height, and
 * it does not work here because a barn is three — a wall plate, a ridge, and a
 * soffit over the boards that is neither.
 */
interface Barn {
  /** Whether `stage-props.ts` is about to board this room over. See the header. */
  lowCeiling: boolean;
  /** x of the inner face of the side walls, and the half-span of the roof. */
  halfX: number;
  /** How many log courses stand between the floor and the wall plate. */
  courses: number;
  /** The wall plate, above the house floor. Always a whole number of logs. */
  eaves: number;
  /** The ridge, above the house floor — the wall plate where there is no roof. */
  ridge: number;
  /**
   * The lowest the lid gets over the boards, **above the boards**.
   *
   * Not the eaves. The wall plate is 2.6 m outboard of the edge of the boards in
   * every era — `houseWidth` is `width + 4` and the wall stands `WALL_OUT`
   * outside that, so the two grow together and the gap never moves — and over
   * that 2.6 m the roof has climbed a metre. Publishing the eaves as `headroom`
   * would say the roof is a metre lower over the band than it is, and would cost
   * the camera and every hanging prop that metre for nothing.
   */
  soffit: number;
}

function barn(d: RoomDatum): Barn {
  const lowCeiling = d.props.has('low-ceiling');
  const halfX = d.houseWidth / 2 + WALL_OUT;
  /**
   * Boarded over, the walls have to reach the boards.
   *
   * `stage-props.ts` puts its lid at `houseY + LOW_CEILING` whatever this room
   * says, so a wall that stopped at its usual 2.99 m would leave 0.6 m of
   * nothing between the top log and the plaster all the way round — the exact
   * failure that file has already had twice and written two comments about, and
   * the one this room came closest to shipping. Three more courses put the wall
   * head a handspan past the boarding, which is what you see in a room that has
   * been ceiled: the logs carry on behind it.
   *
   * Rounded to a whole number of logs either way, because a log wall is a count
   * and not a height. See `COURSES`.
   */
  const courses = Math.max(4, Math.round((lowCeiling ? LOW_CEILING + 0.16 : EAVES) / (2 * LOG_R)));
  const eaves = courses * 2 * LOG_R;
  return {
    lowCeiling,
    halfX,
    courses,
    eaves,
    ridge: lowCeiling ? eaves : eaves + RIDGE_RISE,
    soffit: lowCeiling
      ? LOW_CEILING - RIIHI_RISE
      : eaves + (RIDGE_RISE / halfX) * (halfX - d.width / 2) - RIIHI_RISE,
  };
}

function shape(d: RoomDatum): RoomShape {
  const b = barn(d);
  /**
   * Over the boards there is a roof, unless there is a soffit under it, and
   * then there is a soffit — `STAGE_SOFFIT` is where `stage-props.ts` draws one
   * and a camera solved against anything higher is a camera through a ceiling.
   */
  const headroom = b.lowCeiling ? STAGE_SOFFIT : b.soffit;
  return {
    rise: RIIHI_RISE,
    /**
     * The whole width of the boards, and nothing is masking it.
     *
     * The courtyard's argument holds here word for word: there is no arch, no
     * leg and no tormentor, so a player standing on the corner of the plank
     * stage is seen from every seat and the honest fraction is 1.0. The rule in
     * `RoomShape` — never narrower than `width - 2 * MARGIN_SIDE` — is satisfied
     * with the entire metre to spare, which matters more here than in a
     * courtyard: `cast.ts` clamps to `min(width/2 - 0.5, width * 0.47)` with no
     * sight of this file, and a barn is the kind of room somebody would be
     * tempted to narrow for atmosphere.
     */
    openingWidth: d.width,
    /**
     * **The gable**, which is what `StageMetrics` says an aperture is in a barn.
     * The band is framed by the two roof slopes coming down either side of them
     * and by the collar across the two; above that line nothing hangs, because
     * above that line is roof.
     */
    openingHeight: b.soffit,
    /**
     * Where a cloth would be if there were one, and there is not — but
     * `stage-props.ts` ties bunting, fairy lights and a truss run off it, so it
     * has to be the front of the room. Half a metre in from the lip, the
     * courtyard's number for the courtyard's reason: a plank on two blocks has
     * no lip moulding to clear and no footlight trough behind it, so the line
     * sits where a rope of pennants is actually tied off.
     */
    curtainZ: d.lipZ - 0.5,
    /**
     * The pole. See `build` for what it is; the height is the only interesting
     * part and it is one expression covering two rooms.
     *
     * Half a metre under the roof is where you nail a pole up in a barn — high
     * enough that the pars on it clear `HEAD_BAND.hi` by nearly two thirds of a
     * metre, low enough to reach off a ladder. Boarded over, the same expression
     * lands on `STAGE_SOFFIT - 0.13`, which is the cellar's answer to the same
     * question arrived at from the other side: there is no flying where there is
     * a ceiling, so the bar goes a handspan under it. Taking the lower of the two
     * rather than branching means a room that grows a lid can never leave its
     * lamps inside the plaster, which is the bug `flyY` was written after.
     */
    flyY: Math.min(b.soffit - 0.5, headroom - 0.13),
    headroom,
    /**
     * One roof and therefore one lid: unlike the cellar there is no step at the
     * proscenium line, because there is no proscenium line. See the header for
     * what falls out of publishing the same number twice — the follow spot ends
     * up bolted to a tie beam.
     */
    houseLid: b.soffit,
    /**
     * The gable behind the band, from the floor to the ridge — it is a wall of
     * the building and walls are measured from the ground. Where the room has
     * been boarded over this is the wall head instead, because a glow sized to a
     * ridge nobody can see is three metres of lit rectangle hanging on nothing,
     * which is the tanssilava bug this field exists to have fixed.
     */
    backdropHeight: b.ridge,
  };
}

/**
 * A gable end, as vertical boards cut to the roof line.
 *
 * Above the wall plate a log wall stops, because you cannot notch a triangle,
 * and what goes up there is sawn boarding run vertically. That is a lucky
 * accident for this room rather than a constraint: the whole legibility of the
 * walls is that they are *horizontal*, so the one surface that has to be
 * different is different in the one way that reads at any distance.
 *
 * Built by hand rather than by `cellPlane` because a gable is a triangle and
 * `cellPlane` makes rectangles. The alternative — a rectangle relying on the
 * roof planes to occlude its top corners — works from inside the room and only
 * from inside the room, and it is the kind of thing that is correct until
 * somebody moves a camera. Each board is one quad with its own shade, which is
 * the same trick `cellPlane` plays and gives the same crisp seam for the same
 * reason: nothing is indexed, so nothing interpolates across a join.
 *
 * The geometry comes out in the xy plane with its foot on y = 0 and its normal
 * on +z, so the caller positions it at the wall head and turns it to face in.
 */
function gableBoards(
  halfX: number, rise: number, boards: number, colour: string, rng: Rng,
): BufferGeometry {
  const pos: number[] = [];
  const col: number[] = [];
  const base = new Color(colour);
  const c = new Color();
  const head = (x: number): number => rise * (1 - Math.abs(x) / halfX);
  for (let i = 0; i < boards; i++) {
    const x0 = -halfX + (2 * halfX * i) / boards;
    const x1 = -halfX + (2 * halfX * (i + 1)) / boards;
    const y0 = head(x0);
    const y1 = head(x1);
    pos.push(x0, 0, 0, x1, 0, 0, x1, y1, 0);
    pos.push(x0, 0, 0, x1, y1, 0, x0, y0, 0);
    c.copy(base).multiplyScalar(1 + (rng.next() - 0.5) * 0.24);
    for (let v = 0; v < 6; v++) col.push(c.r, c.g, c.b);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}

function build(c: RoomContext): RoomRig {
  const p = c.venue.palette;
  const m = c.m;
  const b = barn(c);
  const { halfX } = b;
  /** The wall plate and the ridge, in the stage's own coordinates. */
  const eavesY = m.houseY + b.eaves;
  const ridgeY = m.houseY + b.ridge;
  /** Behind the last row, with the 1.6 m of margin `rooms/types.ts` requires. */
  const houseBackZ = m.lipZ + m.houseDepth + 1.6;
  /** Inner faces of the two gable walls. Upstage, where every room's is. */
  const backInner = m.backZ - 0.1;

  const root = new Group();
  root.name = `room:${c.venue.id}`;

  /**
   * The threshing floor, and there is only one of it.
   *
   * A `luuva` is planked — you thresh on boards, because grain swept off dirt is
   * grain with dirt in it — so this is the same trick and very nearly the same
   * geometry as the boards `stage.ts` lays for the stage: long cells running
   * away from the camera, one draw call, no texture. That the two read as the
   * same floor is the entire point. The band is standing on the room's floor on
   * a plank 30 cm up, and if the house floor looked like a different material
   * the plank would look like a stage.
   *
   * Narrower boards than the stage's 0.42 m and a heavier jitter, which is the
   * only difference and is the difference between a floor somebody laid and a
   * floor somebody has been threshing on since 1780. Colour off `boards` pulled
   * toward `backdrop` and darkened — the courtyard argues the opposite way and
   * both are right for their own room: there the flags are stone and must not
   * take the dais's colour, here the floor is the same timber as the plank on it
   * and must.
   *
   * **Cut to the room rather than to the frame**, which is the one thing here
   * that is not the proscenium's. That floor is `houseWidth + 8` wide by
   * **`houseDepth + 8`** deep — the depth half has since been fixed, and reads
   * `backZ - 2` to `lipZ + houseDepth + 4` now, which for a finnfolk barn is
   * 22.0 m rather than 17.8 and overruns the walls by more than it used to, not
   * less. Either way the reason is unchanged and is the reason this room
   * declines it: the proscenium's walls are one-sided planes the
   * camera can look straight through and there has to be ground behind them out
   * to the edge of frame. These walls are solid logs, so the same overrun is
   * 3.4 m of floorboard sticking out through the side of a barn — invisible from
   * every camera position `camera.ts` allows, and wrong in the way that stops
   * being invisible the first time somebody takes a screenshot from outside. It
   * runs wall to wall and gable to gable with 0.2 m of overlap so no seam opens
   * at the foot of the wall, and not one plank further.
   *
   * It receives. It is the large flat thing under the band, which is the first
   * clause of the shadow policy.
   */
  const floorW = halfX * 2 + 0.4;
  const floorD = houseBackZ - backInner + 0.4;
  const floor = new Mesh(
    c.kit.own(cellPlane({
      width: floorW, height: floorD,
      cols: Math.max(8, Math.round(floorW / 0.31)),
      rows: Math.max(3, Math.round(floorD / 2.4)),
      colour: shade(blend(p.boards, p.backdrop, 0.44), 0.3),
      jitter: 0.15, rng: c.rng('housefloor'),
    })),
    c.kit.solid('#ffffff', { vertexColors: true, rough: 0.94 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, m.houseY, (backInner + houseBackZ) / 2);
  floor.receiveShadow = true;
  root.add(floor);

  // --- the walls -----------------------------------------------------------
  /**
   * Four log walls, as one instanced stack of round timbers.
   *
   * **Solid, not single-sided.** The proscenium and the courtyard both build
   * their house walls as one-sided planes so that a camera swung outside the
   * room looks straight in rather than at a black screen, and both are right to.
   * It does not apply here, and the reason is worth writing down rather than
   * assumed: `camera.ts` bounds the orbit with `inRoom`, which holds the lens
   * inside `±houseWidth/2` in x and inside `[backZ, lipZ + houseDepth]` in z —
   * which is 0.6 m inside these walls at the sides and 1.6 m inside them
   * downstage. The lens cannot get out except through the `ORBIT_MIN` escape at
   * the stage end, which every room in the project already accepts as a
   * momentary look from outside. So the walls can be what they are, and what
   * they are matters: a log is round, and roundness is the whole read. A
   * one-sided plane with horizontal stripes on it is a barcode.
   *
   * **They receive and do not cast.** A shadow from these lands outside the
   * room, where nothing is, and the depth pass for it is the same cost as one
   * that lands somewhere. The proscenium's walls make the same call.
   *
   * One `InstancedMesh` of a unit cylinder, scaled to length per course: about
   * eighty instances of thirty-odd triangles, which is a rounding error, and one
   * draw call rather than eighty. Eight sides rather than sixteen — a log is
   * faceted at this budget and looks like a log anyway, because what sells it is
   * the dark line between courses and not the silhouette of any one of them.
   */
  const wallRng = c.rng('walls');
  /**
   * Smoke-darkened timber, off `proscenium` rather than `boards`.
   *
   * `proscenium` is the palette's architecture slot and this is architecture;
   * `boards` is the floor and the plank stage, and a barn whose walls are the
   * colour of its floor is one flat field. It also does the era's work for free
   * — finnfolk's `proscenium` runs warm through 1975 and goes cold grey-blue in
   * 2005, which is the genre's own stated intent ("cold overhead and warm on the
   * boards") arriving without a constant.
   *
   * Named once because the per-log jitter below has to start from exactly this
   * value; two copies of the expression is the kind of duplication that stays
   * correct until somebody changes one of them.
   */
  const timberColour = shade(blend(p.proscenium, p.backdrop, 0.55), 0.16);
  const timber = c.kit.solid(timberColour, { rough: 0.97, flat: true });
  const logGeo = c.kit.geometry(`log|${LOG_R}`,
    () => new CylinderGeometry(LOG_R, LOG_R, 1, 8, 1));

  /** Centre lines of the two gable walls, a log's radius outside the faces. */
  const zBack = backInner - LOG_R;
  const zFront = houseBackZ + LOG_R;
  /** Centre lines of the two side walls. */
  const xSide = halfX + LOG_R;

  /**
   * One log: `along` is the axis it lies on, `at` the other two coordinates,
   * and `from`/`to` its ends. Collected first and instanced after, because the
   * count is not knowable until the doorways have taken their bites out of it.
   */
  const logs: { along: 'x' | 'z'; at: number; y: number; from: number; to: number }[] = [];

  /**
   * The corner, which is the one detail that says *log* rather than *stripes*.
   *
   * At a notched corner (`nurkkasalvos`) the ends of the two walls cross and run
   * past each other, and they cannot both be at the same height or they would
   * occupy the same wood. So they alternate: on even courses the side walls run
   * long and the gables stop against them, on odd courses the reverse. That is
   * not a stylisation of a corner notch, it is what one is, and it costs a
   * ternary. The 0.34 m of overrun is the `koirankaula` — the projecting end —
   * and it is the thing you can see from inside as well as out, because it
   * pokes into the corner of the room.
   */
  for (let j = 0; j < b.courses; j++) {
    const y = m.houseY + LOG_R + j * 2 * LOG_R;
    const sideRuns = j % 2 === 0;
    for (const side of [-1, 1]) {
      logs.push({
        along: 'z',
        at: side * xSide,
        y,
        from: sideRuns ? zBack - LOG_PROJECT : zBack + LOG_R,
        to: sideRuns ? zFront + LOG_PROJECT : zFront - LOG_R,
      });
    }
    /**
     * The gable courses, with the doorway cut out of them. Below the head the
     * course is two logs dying into the door posts; the courses above it are
     * whole, which is how a log wall lintels an opening — the log over the door
     * *is* the lintel, and there is no other member.
     */
    const end = sideRuns ? halfX : halfX + 2 * LOG_R + LOG_PROJECT;
    for (const at of [zBack, zFront]) {
      if (y < m.houseY + DOOR_H) {
        logs.push({ along: 'x', at, y, from: -end, to: -(DOOR_W / 2 + 0.16) });
        logs.push({ along: 'x', at, y, from: DOOR_W / 2 + 0.16, to: end });
      } else {
        logs.push({ along: 'x', at, y, from: -end, to: end });
      }
    }
  }

  const wall = new InstancedMesh(logGeo, timber, logs.length);
  const dummy = new Object3D();
  const wallColour = new Color();
  const wallBase = new Color(timberColour);
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i]!;
    const len = Math.max(0.02, log.to - log.from);
    const mid = (log.from + log.to) / 2;
    dummy.position.set(
      log.along === 'x' ? mid : log.at,
      log.y,
      log.along === 'x' ? log.at : mid,
    );
    // The unit cylinder stands on y; a quarter turn lays it on x or on z.
    dummy.rotation.set(
      log.along === 'z' ? Math.PI / 2 : 0, 0,
      log.along === 'x' ? Math.PI / 2 : 0,
    );
    dummy.scale.set(1, len, 1);
    dummy.updateMatrix();
    wall.setMatrixAt(i, dummy.matrix);
    /**
     * Per-log colour, which is the same argument `cellPlane` makes for every
     * other surface in the project one level up: a wall of eighty identically
     * shaded timbers is a wall of one timber repeated, and the eye reads the
     * repeat rather than the wall. Every log in a real one came off a different
     * tree.
     */
    wallColour.copy(wallBase).multiplyScalar(1 + (wallRng.next() - 0.5) * 0.3);
    wall.setColorAt(i, wallColour);
  }
  wall.receiveShadow = true;
  root.add(wall);

  // --- the gables and the roof ---------------------------------------------
  /**
   * Boarded over, none of what follows is built.
   *
   * `stage-props.ts` is about to span the entire room with two `DoubleSide`
   * planes at 3.6 m and 2.85 m, and everything below this line lives above them.
   * Building it anyway would be paying for a roof behind a ceiling — see the
   * header, and note that this is the *only* thing `low-ceiling` removes: the
   * log walls, the floor and both doorways are still there, and they are what
   * the eye reads a barn by at head height anyway.
   */
  if (!b.lowCeiling) {
    const gableRng = c.rng('backdrop');
    /**
     * One geometry for both ends, and one `rng` draw sequence with it. That is
     * not a saving, it is a claim: the two gables of a barn were boarded by the
     * same person out of the same stack on the same afternoon, and two
     * independently jittered ends would be two buildings.
     */
    const gableGeo = c.kit.own(gableBoards(
      halfX, RIDGE_RISE, 26,
      shade(blend(p.proscenium, p.backdrop, 0.46), 0.24), gableRng,
    ));
    const gableMat = c.kit.solid('#ffffff', { vertexColors: true, rough: 0.96 });
    for (const [z, facing] of [[backInner, 1], [houseBackZ, -1]] as const) {
      const gable = new Mesh(gableGeo, gableMat);
      gable.position.set(0, eavesY, z);
      gable.rotation.y = facing > 0 ? 0 : Math.PI;
      gable.receiveShadow = true;
      root.add(gable);
    }

    /**
     * The two slopes, and the only lid in the catalogue that is not level.
     *
     * `cellPlane` again, and the cells run **up the slope** — from eaves to ridge
     * — because that is the way roof boarding runs and because it is the one
     * thing that gives a plane a direction. The `low-ceiling` prop learned the
     * general form of this the hard way and its comment is worth restating,
     * since it applies to any lid: a hemisphere lights a flat plane to *one
     * number*, so a surface whose normal never changes gets identical light at
     * every pixel and reads as a hole however well the colour is chosen. Cells
     * give it a grain for nothing. A pitched roof is two planes rather than one,
     * so it already gets two values out of the hemisphere — which is exactly why
     * a pitched roof reads and a flat one has to be helped.
     *
     * Darker than the walls, which is where "dark at the edges" mostly comes
     * from: there is no fixture in `lights.ts` pointing up, the roof is lit by
     * the hemisphere alone, and a barn roof is sooty. Not *much* darker, for the
     * reason above — the whole lesson of the cellar ceiling is that spending the
     * smallest light budget in the room on the darkest albedo in the room gives
     * five counts out of 255 and a hole in the top of the frame.
     *
     * `DoubleSide`, as every lid in this project is, so that the one camera
     * position that can see it from outside sees a roof. Neither casts nor
     * receives: it is a ceiling, and a shadow on it would have to have been cast
     * upward.
     *
     * The overhang past both gables is a real `räystäs` and it is also what
     * stops the boarding above from being seen edge-on as a sheet of paper.
     */
    const roofFrom = zBack - LOG_R - 0.45;
    const roofTo = zFront + LOG_R + 0.45;
    const roomLen = roofTo - roofFrom;
    /**
     * The slope, springing at the **inner** face of the wall — the same `halfX`
     * `barn()` solves `soffit` from, so the number this room published and the
     * plane it drew are the same plane. Landing it on the outer face instead
     * would put the roof a few centimetres above everything solved against it,
     * which is the direction nobody checks.
     */
    const slope = Math.hypot(halfX, RIDGE_RISE);
    const alpha = Math.atan2(RIDGE_RISE, halfX);
    const roofRng = c.rng('ceiling');
    const roofMat = c.kit.solid('#ffffff', {
      vertexColors: true, rough: 0.98, side: DoubleSide,
    });
    for (const side of [-1, 1]) {
      const plane = new Mesh(
        c.kit.own(cellPlane({
          width: slope, height: roomLen,
          cols: 3, rows: Math.max(6, Math.round(roomLen / 0.34)),
          colour: shade(blend(p.proscenium, p.backdrop, 0.62), 0.24),
          jitter: 0.12, rng: roofRng,
        })),
        roofMat,
      );
      // Flat, then hinged about the ridge: the plane's own x runs out from the
      // ridge toward the wall head and its y runs the length of the room, so one
      // rotation on the parent tips it and lands the far edge exactly on the
      // plate. See `alpha`.
      plane.rotation.x = -Math.PI / 2;
      plane.position.x = (side * slope) / 2;
      const pitchNode = new Group();
      pitchNode.add(plane);
      pitchNode.rotation.z = -side * alpha;
      pitchNode.position.set(0, ridgeY, (roofFrom + roofTo) / 2);
      root.add(pitchNode);
    }

    /**
     * The ridge piece, and it is architecture rather than a timber: it is where
     * the two planes meet, and without it they meet in a seam you can see
     * daylight through at a grazing angle. Set 0.1 m under the apex so it reads
     * as the thing the boarding lands on rather than as a stick balanced on top.
     */
    const ridgeLog = new Mesh(
      c.kit.geometry(`ridge|${roomLen.toFixed(2)}`,
        () => new CylinderGeometry(0.135, 0.135, roomLen, 8, 1)),
      timber,
    );
    ridgeLog.rotation.x = Math.PI / 2;
    ridgeLog.position.set(0, ridgeY - 0.1, (roofFrom + roofTo) / 2);
    root.add(ridgeLog);
  }

  // --- the doors -----------------------------------------------------------
  /**
   * The cart doors, at both ends, shut.
   *
   * Both ends because that is what a threshing floor is: you back the load in at
   * one end and out at the other, and the draught between the two open doors is
   * how the chaff is carried off the grain. It is not decoration, it is the
   * machine the building is. It also solves a framing problem for nothing — the
   * upstage pair is behind the band in the shot everybody sees, and the
   * downstage pair is what the orbit finds when somebody drags the camera round
   * to look at the room instead of at the band, which otherwise is fourteen
   * metres of blank log wall.
   *
   * **Shut**, which is the genre's first sentence and is also the only way this
   * works. A barn doorway is the brightest thing for a mile and an open one
   * behind the band would silhouette them for the whole show. Shut, what gets in
   * is the joint: a 4 cm line of daylight the full height of the meeting stile
   * and a 7 cm strip under the leaves, which is more light than a shut barn door
   * has ever kept out.
   *
   * That light is `basic` — unlit, taking no cue, going out in no blackout — and
   * that is the one honest use of an unlit material in this directory. The
   * cellar ceiling's comment is right that emissive is not light and that a
   * surface which glows through a blackout is worse than a dark one. The
   * exception it does not cover is a surface which is not in the room: it is
   * October outside, and October does not take a cue from the lighting desk.
   * Colour is the palette's own two pale entries blended and washed out, so the
   * crack goes warm in 1830 and cold in 2005 without a constant anywhere.
   */
  const doorTimber = c.kit.solid(
    shade(blend(p.proscenium, p.backdrop, 0.34), 0.4), { rough: 0.98 },
  );
  const daylight = c.kit.basic(tint(blend(p.ambient, p.proscenium, 0.5), 0.55));
  const leafW = DOOR_W / 2 - 0.02;
  const leafGeo = c.kit.own(cellPlane({
    width: leafW, height: DOOR_H - 0.07,
    cols: Math.max(3, Math.round(leafW / 0.21)), rows: 2,
    colour: shade(blend(p.proscenium, p.backdrop, 0.34), 0.4),
    jitter: 0.13, rng: wallRng,
  }));
  const leafMat = c.kit.solid('#ffffff', { vertexColors: true, rough: 0.98 });
  const gapGeo = c.kit.geometry(`doorgap|${DOOR_W}|${DOOR_H}`,
    () => new PlaneGeometry(DOOR_W, DOOR_H));
  /** Ledges and one diagonal per leaf — the brace that stops a door dropping. */
  const brace = new InstancedMesh(c.kit.bevelBox(1, 0.14, 0.06, 0.02), doorTimber, 12);
  let bi = 0;

  for (const [zInner, facing] of [[backInner, 1], [houseBackZ, -1]] as const) {
    /** The daylight, behind the leaves and inside the reveal. */
    const gap = new Mesh(gapGeo, daylight);
    gap.position.set(0, m.houseY + DOOR_H / 2, zInner - facing * 0.1);
    gap.rotation.y = facing > 0 ? 0 : Math.PI;
    root.add(gap);

    /** The posts the opening is framed in, and what the cut logs die into. */
    for (const side of [-1, 1]) {
      const post = new Mesh(
        c.kit.bevelBox(0.16, DOOR_H + 0.06, 2 * LOG_R + 0.02, 0.03), doorTimber);
      post.position.set(
        side * (DOOR_W / 2 + 0.08), m.houseY + (DOOR_H + 0.06) / 2, zInner - facing * LOG_R);
      post.receiveShadow = true;
      root.add(post);

      const leaf = new Mesh(leafGeo, leafMat);
      leaf.position.set(
        side * (DOOR_W / 4 + 0.01), m.houseY + 0.07 + (DOOR_H - 0.07) / 2,
        zInner - facing * 0.04);
      leaf.rotation.y = facing > 0 ? 0 : Math.PI;
      leaf.receiveShadow = true;
      root.add(leaf);

      const x = side * (DOOR_W / 4 + 0.01);
      const z = zInner + facing * 0.02;
      for (const [y, tilt] of [
        [m.houseY + 0.42, 0], [m.houseY + DOOR_H - 0.28, 0],
        [m.houseY + DOOR_H / 2, Math.atan2(DOOR_H - 0.9, leafW)],
      ] as const) {
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, facing > 0 ? 0 : Math.PI, tilt === 0 ? 0 : -facing * tilt);
        dummy.scale.set(tilt === 0 ? leafW : Math.hypot(leafW, DOOR_H - 0.9), 1, 1);
        dummy.updateMatrix();
        brace.setMatrixAt(bi++, dummy.matrix);
      }
    }
  }
  brace.count = bi;
  root.add(brace);

  // --- what the lamps hang on ----------------------------------------------
  /**
   * A pole on two ropes, and it is the whole of this room's fly bar.
   *
   * `RoomRig.flyBar` insists there is something actually up there and forbids a
   * bare group at a height nothing reaches, which is the right rule and rules
   * out the two obvious cheats: there is no grid in a barn, and hanging the pars
   * off the `beams` prop's tie beams is not available because that prop may not
   * be drawn — a second genre pointing at `riihi` gets this room with whatever
   * props it named, and a fly bar that only exists when `beams` does is a fly bar
   * that fails silently.
   *
   * So it is what somebody would actually do: a debarked pole, the same timber
   * the walls are, slung under the roof on two ropes. Straight rather than
   * sagging, for the courtyard's reason — `lights.ts` parents its pars at y = 0
   * in this group's frame, so a pole that dipped in the middle would have its
   * lamps hanging in the air above it.
   *
   * The ropes reach the roof plane at the exact x they hang from, computed from
   * the same pitch that built it, so neither end floats and neither end is
   * inside anything. Boarded over they reach the soffit instead, at 13 cm, which
   * is a rope through a staple rather than a rope at all — and is precisely what
   * `proscenium.ts` does with its drop-arms in the cellar for the same reason.
   */
  const flyBar = new Group();
  flyBar.name = 'fly-bar';
  flyBar.position.set(0, m.flyY, m.curtainZ - 1.1);
  const poleLen = m.openingWidth + 0.6;
  const pole = new Mesh(
    c.kit.geometry(`pole|${poleLen.toFixed(2)}`,
      () => new CylinderGeometry(0.055, 0.055, poleLen, 6, 1)),
    timber,
  );
  pole.rotation.z = Math.PI / 2;
  flyBar.add(pole);
  const ropeMat = c.kit.solid(tint(hueShift(p.proscenium, 8, -0.1), 0.2), { rough: 1 });
  for (const side of [-1, 1]) {
    const x = side * (poleLen / 2 - 0.35);
    /** The soffit above this exact point: the roof, or the boards under it. */
    const top = b.lowCeiling
      ? m.headroom
      : eavesY + (RIDGE_RISE / halfX) * (halfX - Math.abs(x));
    const len = Math.max(0.08, top - m.flyY);
    const rope = new Mesh(
      c.kit.geometry(`rope|${len.toFixed(2)}`,
        () => new CylinderGeometry(0.018, 0.018, len, 5, 1)),
      ropeMat,
    );
    rope.position.set(x, len / 2, 0);
    flyBar.add(rope);
  }
  root.add(flyBar);

  /**
   * No cloth, and therefore no curtain.
   *
   * `noCurtain()` reports the tabs as being exactly where the show asked for
   * them, immediately, so `show.ts` never stalls waiting for travel that will
   * not happen and the band is still hidden while it is being staged. In a barn
   * with the floor swept and the room already full, the reveal is a cut, because
   * what actually happens is that four people put their drinks down and pick
   * their instruments up. The doors are not an answer to this and were
   * considered: they are at the wrong end of the room to reveal anything, and
   * they are shut.
   */
  const curtain = noCurtain();
  root.add(curtain.root);

  return { root, flyBar, curtain };
}

export const riihi: RoomBuilder = { shape, build };
