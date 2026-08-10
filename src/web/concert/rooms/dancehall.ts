/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The dance hall — a wide, low, boarded room with a bandstand at one end and
 * posts down both sides of the floor.
 *
 * `country/staging.ts` calls its room `DANCE_HALL`, eight rows deep at 0.82
 * density, `seated: false`, and its header says what the building is for in one
 * sentence: *couples going round a floor anticlockwise with the band at one end
 * and the bar at the other.* That is a different claim from every other room in
 * this directory. A theatre, a concert hall and a sabha are rooms built so that
 * people can face one way; an arena is a room built so that nine thousand of
 * them can. This one is built so that a hundred people can move about in the
 * middle of it, and everything below follows from that.
 *
 * ## It is not the riihi, and the seam only pays if it is not
 *
 * The nearest neighbour is `riihi.ts`, and the collision is real rather than
 * theoretical: country's own 1932 dressing is a barn — `beams`, `hay`, bunting,
 * a floor somebody swept — and if this file came out a log barn with a pitched
 * roof then two genres would be paying for two files to get one building. So
 * the differences are chosen against it, one at a time, and each of them is
 * something you can see in the first second:
 *
 * **The lid is flat, and low.** A riihi is a volume you look *up* into: two
 * planes meeting at a ridge 6.0 m above a 14.8 m span, which is a section of
 * 1 : 2.5. This room is boarded over at 3.7 m across an 18 m span — 1 : 4.9,
 * twice as flat — and there is no step in it, no gable, and nothing overhead
 * that is not level. `LID` argues the number. The whole read of the room is
 * that the ceiling is *near*, and it is near everywhere at once.
 *
 * **The walls are sawn boards with a dado rail, not round logs.** A stacked log
 * wall is strongly horizontal and round, and `riihi.ts` spends a paragraph on
 * why it is drawn as cylinders rather than as stripes. This one is the opposite
 * texture on purpose: vertical board-and-batten above the rail, horizontal
 * beading below it, and a chunky moulding between the two. Two grains at right
 * angles with a line across them is a *finished* wall — a room somebody painted
 * — where a log wall is a room somebody stacked.
 *
 * **There are posts.** This is the silhouette no other room here has, and it is
 * the one that is actually structural rather than decorative: a timber hall
 * cannot span eighteen metres, so it does not — it carries two beams down the
 * length of the room on two rows of posts and spans the ceiling in three bites.
 * See `POST_OUT` for where they stand and, more importantly, for the proof that
 * they stand nowhere that matters.
 *
 * **The floor is the point of the building.** In a riihi the floor is a
 * threshing floor that a band happens to be standing on; here it is what
 * everybody paid to get onto, and it is drawn pale, waxed and running *across*
 * the room, at right angles to both the barn's planks and this room's own
 * ceiling boards. See `build`.
 *
 * **The bandstand is low and you can walk onto it.** `HALL_RISE` is 0.55 m,
 * with a flight of two treads at each downstage corner. A riihi has no stage at
 * all and a proscenium has 0.9 m of one; this is the thing in between, and it is
 * in between for a stated reason rather than by splitting the difference.
 *
 * ## What this file does not draw, and it is most of the furniture
 *
 * `country/staging.ts` names `riser`, `bar` and `dance-floor` genre-wide and its
 * four dressings add `neon`, `beams`, `hay`, `tables`, `posters`, `low-ceiling`,
 * `carpet`, `railing`, `pa-stack`, `backline`, `truss`, `drapes`, `wedges`,
 * `crowd-barrier`, `rug` and a handful of maybes. Every one of those belongs to
 * `stage-props.ts`, which places them for every room at once, so a dance hall
 * drawing its own bar would draw two bars a few centimetres apart — the
 * collision `RoomDatum.props` exists to make impossible rather than merely
 * unlikely.
 *
 * Two of those are worth naming because they are the ones this room would
 * otherwise be tempted by. The brief for the building says *a bar along the
 * side*; `BUILDERS.bar` stands it across the **back** of the house at
 * `lipZ + houseDepth - 0.8`, and that is the prop's decision and not this
 * file's. What the room owes it is a wall to stand against and somewhere for the
 * people at it to be, which is what the downstage wall and the aisle behind the
 * post row are. And `beams` puts tie timbers across the room at
 * `headroom - 0.22` whenever the 1932 dressing is up — so there are no ceiling
 * joists in this file, however much a boarded ceiling wants them. The line runs
 * exactly where `riihi.ts` put it: the *planes* are architecture and are here,
 * the *timbers under them* are objects and are the prop's. What is here instead
 * is the two beams the posts carry, and those are here because a post holding up
 * nothing is the one thing a post may not be.
 *
 * ## The modifiers
 *
 * `low-ceiling` is answered, and answering it is nearly free. `stage-props.ts`
 * draws a limewashed lid at `houseY + LOW_CEILING` and a soffit at
 * `STAGE_SOFFIT` whenever the prop is named, whatever this file publishes, and
 * a boarded ceiling at 3.7 m behind a plaster one at 3.6 m is two buildings ten
 * centimetres apart — z-fighting's older and stupider cousin. So on those seeds
 * the hall takes the ceiling it has been given: the boarding is not built, the
 * posts and their beams run up to the prop's lid instead, and the eight numbers
 * are measured to it. That the two heights were within 10 cm of each other
 * before anybody arranged it is not a coincidence — `LOW_CEILING`'s own comment
 * says 3.6 m is where a lid can be low and still let a camera stand under it,
 * and `LID` below arrives at 3.7 m from the other end of the same question.
 *
 * It is also the right building for that era. 1955 is the honky-tonk, and
 * `country/staging.ts` says of it: *a ceiling low enough to reach*. What the
 * prop adds over this room's own lid is the step at the proscenium line — a
 * bulkhead over the bandstand, which is what you get when somebody boxes in a
 * corner of a hall and calls it a stage.
 *
 * `brick` is answered, and this is the first room besides the proscenium to
 * answer it. The 1978 dressing spends the genre's single room-modifier slot on
 * it and argues the case properly: *the Austin rooms that this decade happened
 * in were old buildings with the plaster off — an armoury, a skating rink, a
 * furniture warehouse.* That is a real distinction and it is a distinction about
 * the *wall*, which is the one thing here a modifier can honestly change. So on
 * those seeds the boarding, the wainscot and the dado rail all go and the walls
 * are a staggered bond from the floor to the ceiling. Everything else stays,
 * and it has to: the posts, the lid and the plank floor are what make a
 * furniture warehouse a place you can dance in, and stripping those as well
 * would be admitting the building was only ever paint.
 *
 * `open-air` and `black-box` are refused. The lid is this room's entire claim
 * — take it away and what is left is a floor with some posts standing in it,
 * which is a car park — and a hall painted matte black is a room that has
 * stopped being able to say which century it is in. A genre wanting either
 * wants `proscenium`, which does both in one `if` each.
 *
 * `haze` is air rather than architecture and there is nothing here to add.
 * Country never names it anyway, and its reason is worth borrowing: the 1955
 * dressing carries `fog: 0.34` with no haze prop, because what is in the air in
 * a bar in 1955 is two hundred cigarettes and not a machine.
 *
 * ## The 1968 broadcast, which stays in this building
 *
 * `nashville` is the era that looks as though it wants a different room, and it
 * does not get one. The reasoning is worth writing down because the opposite
 * answer is the easy one.
 *
 * Start with what is even possible. A room cannot see the era and must not be
 * given a way to — `circuit.ts` makes the argument at length and it holds here
 * word for word: the era reaches this file through exactly two channels, the
 * size through `StageDressing.grow` and the modifiers through `props`, and
 * `StageRoom.architecture` is one field on the *room* rather than one per
 * dressing. So "different architecture for 1968" could only mean branching on a
 * prop, and the only prop that could carry it is `carpet` — a floor covering.
 * Making a floor covering change the building is precisely the flag that should
 * have been a room, which is the mistake `proscenium.ts` was split up to stop.
 *
 * And the history is on the hall's side, which is the half that matters. The
 * Grand Ole Opry was a *barn dance on the radio*: that is what the programme
 * was called, that is what the set was painted as, and the Ryman it ran from is
 * a tabernacle with a flat floor and pews. The 1968 dressing's own comment names
 * `carpet` as the giveaway — *which no working dance hall in this genre has ever
 * had* — and that is exactly right and exactly an argument for leaving the
 * building alone. A carpet, a pair of black legs and a rail across the front of
 * the stage is what a network does to a dance hall when it points a camera at
 * one; it is three objects, all three of them props, and all three of them come
 * off again on Monday. Building a theatre for that era would be this file
 * claiming the Opry was one, which is the single most wrong thing it could say
 * about this music.
 *
 * What the era does get is the size. `grow: [0.5, 0.4]` makes it the second
 * largest stage in the genre, and everything in this file scales continuously
 * off `width` and `houseWidth` — the walls, the posts, the beams, the lid, the
 * floor and the steps all move with it — so the broadcast room comes out a
 * bigger, deeper version of the same hall. Which is what a network did: it took
 * over the room and built the stage out.
 */

import {
  Color, DoubleSide, Group, InstancedMesh, Mesh, Object3D,
} from 'three';

import type { Rng } from '../../../core/rng.js';
import {
  blend, cellPlane, shade, tint,
  LOW_CEILING, STAGE_SOFFIT,
} from '../stage-kit.js';
import {
  noCurtain, type RoomBuilder, type RoomContext, type RoomDatum, type RoomRig,
  type RoomShape,
} from './types.js';

/**
 * How high the bandstand stands above the floor everybody is dancing on.
 *
 * The brief for this room is *low — the dancers matter more than the band* and
 * that is not a flourish, it is the social fact the building is arranged
 * around. A real dance-hall bandstand is eighteen inches to two feet, which is
 * a platform somebody built out of the same lumber as the floor and not a
 * stage; 0.55 m is the middle of that and it is the fourth different answer
 * this directory has given to the question, which is the point of the seam.
 *
 * It sits between the two rooms it is arguing with. `riihi.ts` takes 0.3 m and
 * spends its longest comment saying that the honest answer is zero and that
 * zero z-fights the house floor; a barn dance has no platform at all. The
 * proscenium takes 0.9 m, which lifts a band clear over a standing crowd
 * because that is what a building with seats in it is for. Neither is this. A
 * dance hall has a platform — somebody built it, it is a fixture, the drums
 * live on it — and it is deliberately not high enough to put the band above the
 * room.
 *
 * ## What it costs, measured rather than hoped for
 *
 * This house is **eight rows standing**. `crowdExtent` puts the top of the
 * tallest head at `houseY + 2.17`, so at 0.55 m the crowns of the back row sit
 * 1.62 m above the boards — across a standing fiddler's chest and above a
 * seated player's head. From a camera down in the house there are people
 * between the lens and the band, permanently, and that is not a defect being
 * tolerated: it is what standing at the back of a dance hall is, and it is the
 * photograph every one of these rooms exists in.
 *
 * The other half of the cost is headroom, and it is the half that actually
 * pinned the number. The lid is a fact about the *building* and does not move
 * when the bandstand does, so every centimetre of rise is a centimetre taken
 * off the air over the band's heads: at 0.55 m there is 3.15 m over the boards
 * against `HEAD_BAND.hi`'s 2.4 m, which is 0.75 m of clearance. A proscenium's
 * 0.9 m in this room would leave 0.4 m — five centimetres less than the cellar,
 * which is the tightest room in the project and is *trying* to be.
 */
const HALL_RISE = 0.55;

/**
 * How high the ceiling is above the floor, and the number this room is.
 *
 * Twelve feet. Every other decision here is downstream of it, so it is worth
 * being exact about what fixes it, because "low" on its own is a taste and this
 * had a floor and a ceiling of its own.
 *
 * **The floor under it is the camera.** `camera.ts` caps the lens at
 * `headroom - LENS_GAP` and separately wants to stand `crowd.topY + 0.3` above
 * the house floor so it is not filming through the back of its own audience.
 * Those two meet at a lid of 3.07 m — and they meet there in *every* era,
 * because both sides of the inequality carry the rise and it cancels. Below
 * that the wide shot is a lens inside somebody's head; `clearCrowd` refuses to
 * fix it and says so — *the ceiling still wins* — and the room would have
 * bought its lowness by making every wide shot in the genre a bad one.
 *
 * **The ceiling over it is the riihi.** A barn is a room you look up into and
 * this one is not, so the lid has to be visibly below where a barn's roof would
 * be over the same span. `riihi.ts` publishes a soffit of 4.04 m above the
 * house floor over a narrower room than this one, and a ridge at 5.99 m. A lid
 * anywhere near four metres would be a barn with the roof flattened.
 *
 * 3.7 m sits with two thirds of a metre of daylight over the camera's floor and
 * a clear third of a metre under the barn's eaves, and it happens to be the
 * height these halls were actually built to. What it buys in the picture is
 * exact: the wide shot settles at 3.10 m above the house floor rather than the
 * 4.5 m an open room allows, which is a person standing at the back of the
 * dance floor looking over the dancers — and that is the shot the whole room is
 * for.
 *
 * It does *not* scale with the era. The eras grow the stage from 10.5 m to
 * 11.4 m and the room grows with them, and the ceiling stays exactly where it
 * is, because that is what a building does: you can push the stage out into a
 * hall and you cannot raise its roof. The proportion goes from 1 : 4.9 to
 * 1 : 5.2 across the four, which is the room getting *flatter* as it gets
 * bigger — the correct direction, and the opposite of what a ratio would have
 * done.
 */
const LID = 3.7;

/**
 * How far outside the house the walls stand, and how far past the last row the
 * room carries on.
 *
 * The minimum `rooms/types.ts` allows is `houseWidth / 2 + 0.6` at the sides and
 * `lipZ + houseDepth + 1.6` downstage, which is what a theatre takes: a room
 * built tightly round its seats. This one takes 1.75 m and 4.2 m, and the extra
 * is doing two jobs rather than being generous.
 *
 * The first is the aisle. The posts stand at `POST_OUT` and the whole point of a
 * post row is that there is something *behind* it — that is where the tables
 * are, where the bar is, and where the people not dancing are standing. At 1.75
 * there is 0.89 m between the back of a post and the wall, which is a person
 * with a drink; at the 0.6 m minimum there would be 0.11 m, and the posts would
 * read as pilasters glued to a wall, which is a decoration rather than a
 * structure.
 *
 * The second is the proportion. `houseWidth` is `width + 4` and no room may
 * argue with it, so the width of this building is very nearly fixed from
 * outside; the only dimension left to spend is the length. At these two numbers
 * the hall comes out 19.3 m by 18.0 m in 1932 and 19.9 m by 18.9 m in 1978 — a
 * metre longer than it is wide in every era, which is as long as this seam can
 * make it and is worth stating plainly rather than claiming. What actually
 * carries *long and low* is not the plan, it is the section: see `LID`.
 */
const WALL_OUT = 1.75;
const HALL_BEHIND = 4.2;

/**
 * Where the posts stand, measured out from the edge of the house — and the one
 * number in this file that had to be *proved* rather than chosen.
 *
 * A post is a solid standing in the middle of a room full of people, and three
 * separate systems have already committed to that room without being able to
 * see this file. Each of them is checked below, and each of them is checked as
 * an argument rather than as a measurement, because a measurement holds for the
 * four venues it was taken on and an argument holds for the fifth.
 *
 * **The sightline.** `cast.ts` places the band so that everybody is visible
 * from `DEFAULT_CAMERA`, which is `[0, 2.4, 11]` — on the centre line. Every
 * player is inside the playing area, so every player has `|x| <= width / 2 -
 * 0.5`. A segment from a point at x = 0 to a point at |x| <= h is a convex
 * combination of the two, so **every point on it has |x| <= h**: nothing
 * outboard of the playing area's own half-width can lie between that camera and
 * any player, at any z, in any era, whatever the caster does. The posts stand
 * at `houseWidth / 2 + 0.75`, which is `width / 2 + 2.75`, so their inner faces
 * are 3.14 m outside the widest ray the sightline pass can draw. That is not a
 * margin, it is a different half of the room.
 *
 * **The leads.** `cableBounds` holds every routed cable inside
 * `|x| <= width / 2 - 0.25` and `z` inside the boards, and `concert-check.ts`
 * asserts that no lead crosses anything solid. The posts are 3 m outboard of
 * that strip in x and never over the boards in z, so there is no seed on which
 * a cable and a post can be within three metres of each other. (They are not in
 * `cables.ts`'s obstacle list either, and they must not be — the router's
 * obstacles are things a cable could plausibly reach.)
 *
 * **The lens.** `camera.ts` bounds the orbit with `inRoom`, which holds the
 * viewer's camera inside `|x| <= houseWidth / 2` out in the house and inside
 * `|x| <= width / 2` over the stage. The inner face of a post is 0.64 m outside
 * the first of those, so a viewer dragging the camera all the way round cannot
 * put the lens inside one, and cannot get behind one either.
 *
 * **The hay.** The 1932 dressing throws bales into the house at
 * `width / 2 + [0.6, 1.9]` with a random yaw, which reaches `width / 2 + 2.16`
 * at the corner of a turned bale. That is the closest anything else in the
 * project comes to this line, and it clears by 0.23 m. It is the reason the
 * number is 0.75 and not the 0.5 that everything else would have allowed.
 */
const POST_OUT = 0.75;

/** A square post. An 8 × 8 in the timber this hall was built out of. */
const POST_SIDE = 0.22;

/**
 * How far apart the posts stand down the room.
 *
 * A spacing rather than a count, which is the same decision `riihi.ts` makes
 * about its log courses and for the same reason: you do not choose to have
 * seven posts, you choose how far a beam of this size will span and then stand
 * one every time you run out. 2.7 m is a comfortable span for a doubled timber
 * beam and it puts seven bays in the 1932 room and eight in the 1978 one, so
 * the colonnade genuinely lengthens with the building instead of stretching.
 */
const POST_GAP = 2.7;

/**
 * The top of the wainscot, above the floor.
 *
 * Chest height, which is where a dado rail goes in a room where people stand up
 * — it is a rail to stop chairs and shoulders marking the paint, so its height
 * is set by shoulders. It also lands just above the 0.82 m the `tables` prop
 * puts its tops at and just above the crowd's own waist, so the line reads
 * across the back of the room rather than through the middle of the people
 * standing at it.
 */
const DADO = 0.98;

/**
 * The hall, solved once and read by both halves of the contract.
 *
 * `shape()` may not build and `build()` may not disagree with `shape()`, so the
 * two or three facts they both need live in neither of them. It is a much
 * shorter structure than the barn's, and that is the whole architectural claim
 * restated as an interface: this room has *one* height overhead and the barn
 * has three.
 */
interface Hall {
  /** Whether `stage-props.ts` is about to ceil this room for us. See the header. */
  lowCeiling: boolean;
  /** Whether the walls are a bond rather than boarding. See the header. */
  brick: boolean;
  /** x of the inner face of the side walls. */
  wallX: number;
  /** y of the underside of the lid, **above the house floor**. */
  lid: number;
}

function hall(d: RoomDatum): Hall {
  const lowCeiling = d.props.has('low-ceiling');
  return {
    lowCeiling,
    brick: d.props.has('brick'),
    wallX: d.houseWidth / 2 + WALL_OUT,
    /**
     * Boarded over, the ceiling is the prop's and not this file's, and every
     * number below is measured to the prop's plaster rather than to boarding
     * that is not built. See the header: two lids 10 cm apart is two buildings,
     * and the one you can see is whichever was drawn last.
     */
    lid: lowCeiling ? LOW_CEILING : LID,
  };
}

function shape(d: RoomDatum): RoomShape {
  const h = hall(d);
  /**
   * The lowest thing over the boards.
   *
   * Normally the ceiling, straight. Where the `low-ceiling` prop is up it is
   * that prop's *soffit* rather than its house lid — `stage-props.ts` steps the
   * ceiling down over the stage to `STAGE_SOFFIT` and hangs a fascia at the lip
   * to join the two, and a camera or a lantern solved against the higher of the
   * pair is a camera through a bulkhead. The `Math.min` states it rather than
   * assuming the soffit is always lower, which it is at every rise this room
   * could take and might not be at one somebody tries later.
   */
  const headroom = h.lowCeiling
    ? Math.min(h.lid - HALL_RISE, STAGE_SOFFIT)
    : h.lid - HALL_RISE;
  return {
    rise: HALL_RISE,
    /**
     * The whole width of the boards, and nothing is masking it.
     *
     * There is no arch here, no leg and no tormentor: the bandstand is a
     * platform in the corner of a room and the floor carries on past both ends
     * of it, so a fiddler standing on the very corner is seen from everywhere
     * anybody could be standing. The honest fraction is 1.0.
     *
     * The rule in `RoomShape` — never narrower than the playing area, which is
     * `width - 1.0` — is therefore satisfied with the entire metre to spare, and
     * it matters here more than it looks: `cast.ts` clamps players to
     * `min(width / 2 - 0.5, width * 0.47)` with a hardcoded constant and no
     * sight of this file, and a low wide room with posts in it is exactly the
     * kind of room somebody would be tempted to narrow for atmosphere. Mask
     * inside the aperture if it ever needs to look tighter; do not shrink it.
     *
     * It is deliberately *not* `circuit.ts`'s answer either. That room claims
     * more than the stage is wide because a touring deck really is wider than
     * the band. This bandstand is exactly as wide as the boards, because
     * somebody built it to fit the end of the room and then the room was
     * measured off it.
     */
    openingWidth: d.width,
    /**
     * The aperture's height, and in a room with no arch it is simply the air
     * over the band's heads: from the boards to the boarding, with nothing
     * between.
     *
     * Publishing the lid here rather than some fraction of the width is what
     * keeps the dressing inside the room. `neon` hangs its back sign at
     * `min(openingHeight - 0.5, …)`, `drapes` builds legs `openingHeight` tall,
     * `bunting` solves its swag under it and `lights.ts` sizes the cyclorama
     * glow at `openingHeight * 1.06`. Every one of those, handed a proscenium's
     * `width * 0.44`, would be 4.8 m in a room whose ceiling is 3.15 m above the
     * boards — the whole rig and half the dressing inside the plaster, which is
     * the bug `flyY` and `houseLid` were both written after, arrived at from a
     * third direction.
     */
    openingHeight: headroom,
    /**
     * Where a cloth would be if there were one, and there is not — but
     * `stage-props.ts` ties bunting, drapes, posters and the downstage truss run
     * off this line, so it has to be the front of the room. Half a metre in from
     * the lip: the same number `riihi.ts` and `circuit.ts` take, for the same
     * reason, which is that a platform with no arch over it has no moulding to
     * clear and nothing behind which a track could hide.
     */
    curtainZ: d.lipZ - 0.5,
    /**
     * A handspan under the ceiling, which is the only place a bar can be in a
     * room with a ceiling.
     *
     * This is `proscenium.ts`'s cellar arithmetic and it is not borrowed
     * loosely — it is the same physical object arrived at from the same
     * premise. There is no fly tower in a hall that has been boarded over,
     * there is nothing above the boarding to fly from, so what the lamps hang on
     * is a length of pipe screwed to the joists with two short drop-arms. 0.13 m
     * is the depth of the arm.
     *
     * Because it is stated against `headroom` rather than against the ceiling,
     * it follows the `low-ceiling` prop down automatically: 3.02 m in the plain
     * hall, 2.72 m under the honky-tonk's soffit, which is `STAGE_SOFFIT - 0.13`
     * exactly — the cellar's own number, in the room the cellar's ceiling has
     * been dropped into. A room that grows a lid can never leave its lamps
     * inside the plaster, which is the bug this field exists to have fixed.
     *
     * The clearance underneath was checked rather than assumed. `lights.ts`
     * short-yokes its pars to 0.10 m under the pipe when `headroom` is finite,
     * so the bottom of a can sits at 2.92 m over the plain hall and 2.62 m under
     * the honky-tonk soffit, against `HEAD_BAND.hi` at 2.40 m. Both clear; the
     * second only just, which is what a honky-tonk is.
     */
    flyY: headroom - 0.13,
    headroom,
    /**
     * **One lid, and therefore one number twice.**
     *
     * This is the field's easy case and it is worth saying why it is easy. The
     * cellar has two ceilings because it has a downstand at the proscenium line;
     * the barn has two because a pitched roof is higher over the middle of the
     * room than over the edge of the stage. A dance hall has one flat ceiling
     * over the whole building, which is very nearly the definition of one, so
     * `headroom` and `houseLid` are the same plane and anything hung anywhere
     * lands on the same boards.
     *
     * Under the `low-ceiling` prop they part company, and correctly: the prop
     * draws its house lid at `houseY + LOW_CEILING` and its soffit lower, so the
     * house keeps the full 3.6 m while the bandstand is tucked under a bulkhead.
     * That is the one era where this room has an upstairs and a downstairs, and
     * it is the era whose own comment asks for it.
     */
    houseLid: h.lowCeiling ? h.lid - HALL_RISE : headroom,
    /**
     * The end wall of the hall, floor to ceiling, measured from the floor
     * because it is a wall and walls are measured from the ground.
     *
     * There is no cloth behind this band. What is behind them is the end of the
     * building — the same boarding, the same dado, the same paint as the two
     * walls beside it — so the number is the ceiling height and not a height
     * chosen for a backdrop. `lights.ts` sizes the cyclorama glow at
     * `min(openingHeight * 1.06, backdropHeight - 0.1)`, which lands it 3.34 m
     * up a 3.7 m wall: a wash on a wall, with the top of the wall showing above
     * it, rather than the tanssilava's three metres of lit rectangle hanging in
     * the air off nothing that this field was added after.
     */
    backdropHeight: h.lid,
    /** Already solved, because this room needed it for itself. See `Hall`. */
    wallX: h.wallX,
  };
}

/**
 * One wall of the hall, as a group standing on the floor with its face on +z.
 *
 * Three surfaces rather than one, and the three are the whole reason this room
 * does not read as a shed. A single jittered plane is what every other wall in
 * this project is and it is the right answer for a cellar or a black box, where
 * the wall is a dark thing you are not meant to look at. Here the walls are lit
 * — the room is low, so the wash reaches them — and a large lit surface with one
 * grain on it reads as a *sheet* however well the colour is chosen. That is the
 * lesson the cellar ceiling paid for, one wall over.
 *
 * So: boarding above, beading below, and a rail between the two. The cells run
 * **vertically** in the field and **horizontally** in the wainscot, which is not
 * a stylisation — board-and-batten runs up and beadboard runs along, that is
 * what the two products are — and it means the eye gets a direction change and a
 * hard line at chest height for two extra draw calls. It is also, precisely, the
 * texture a log wall is not: `riihi.ts` argues that a stacked log wall is
 * *horizontal and round*, and this is vertical, flat and painted.
 *
 * `brick` collapses it to one bonded plane and no rail, which is the 1978 room.
 * See the header for why the modifier is answered at all.
 *
 * Everything receives and nothing casts. A wall is the large flat thing a shadow
 * lands on, which is the first clause of the shadow policy; a plane's own cast
 * shadow is a black line, and this one would be cast onto whatever is outside
 * the building, where nothing is.
 */
function boardWall(
  c: RoomContext, h: Hall, w: number, height: number, rng: Rng,
): Group {
  const p = c.venue.palette;
  const node = new Group();
  const mat = c.kit.solid('#ffffff', { vertexColors: true, rough: 0.93 });

  if (h.brick) {
    /**
     * A bond, floor to ceiling. The proscenium's own trick and deliberately the
     * same arithmetic — 0.42 m by 0.2 m cells staggered on alternate rows — so
     * that a brick room in this genre and a brick room in another are the same
     * masonry rather than two people's idea of it. The colour is not the
     * proscenium's: that file darkens `backdrop` by a further third, which on
     * this genre's 1978 entry is `#110f0b` and is a wall you cannot see. A dance
     * hall's brick is lit by the room, so it is `backdrop` pulled toward the
     * palette's one pale entry instead — a warm grey-brown that has somewhere to
     * go when the wash reaches it.
     */
    const brick = new Mesh(c.kit.own(cellPlane({
      width: w, height,
      cols: Math.max(6, Math.round(w / 0.42)),
      rows: Math.max(4, Math.round(height / 0.2)),
      colour: shade(blend(p.backdrop, p.proscenium, 0.42), 0.12),
      jitter: 0.13, rng, stagger: true,
    })), mat);
    brick.position.y = height / 2;
    brick.receiveShadow = true;
    node.add(brick);
    return node;
  }

  /** Board-and-batten: narrow in x, one storey tall, so the grain runs up. */
  const fieldH = height - DADO;
  const field = new Mesh(c.kit.own(cellPlane({
    width: w, height: fieldH,
    cols: Math.max(8, Math.round(w / 0.29)),
    rows: 2,
    colour: blend(p.proscenium, p.backdrop, 0.42),
    jitter: 0.1, rng,
  })), mat);
  field.position.y = DADO + fieldH / 2;
  field.receiveShadow = true;
  node.add(field);

  /**
   * Beading below the rail, and darker.
   *
   * Dark paint below a dado rail is what a room that gets kicked is painted, and
   * it does something for the picture besides being true: the crowd is drawn as
   * unlit silhouette, so a pale wall behind a standing house is a row of dark
   * shapes on a bright field with no ground under them — the same failure the
   * proscenium's house floor had and fixed. A dark band at exactly the height
   * the people are gives them something to stand against.
   */
  const skirt = new Mesh(c.kit.own(cellPlane({
    width: w, height: DADO,
    cols: 3,
    rows: Math.max(4, Math.round(DADO / 0.14)),
    colour: shade(blend(p.proscenium, p.backdrop, 0.66), 0.1),
    jitter: 0.11, rng,
  })), mat);
  skirt.position.y = DADO / 2;
  skirt.receiveShadow = true;
  node.add(skirt);

  /**
   * The rail, and it is a solid rather than a stripe on purpose.
   *
   * A dado drawn as a change of colour is a change of colour; a dado drawn as a
   * moulding sticking 40 mm off the wall catches the wash along its top edge and
   * draws a bright line the whole length of the room. That line is the single
   * cheapest thing in this file and it is what makes an eighteen-metre wall read
   * as having a length.
   */
  const rail = new Mesh(
    c.kit.bevelBox(w, 0.09, 0.05, 0.018),
    c.kit.solid(tint(p.proscenium, 0.12), { rough: 0.55 }),
  );
  rail.position.set(0, DADO + 0.02, 0.03);
  rail.receiveShadow = true;
  node.add(rail);
  return node;
}

function build(c: RoomContext): RoomRig {
  const p = c.venue.palette;
  const m = c.m;
  const h = hall(c);
  const { wallX } = h;
  /** The lid, in the stage's own coordinates. */
  const lidY = m.houseY + h.lid;
  /** The two ends of the building. See `WALL_OUT`. */
  const frontZ = m.backZ - 0.12;
  const backZ = m.lipZ + m.houseDepth + HALL_BEHIND;
  const roomLen = backZ - frontZ;

  const root = new Group();
  root.name = `room:${c.venue.id}`;

  // --- the floor -----------------------------------------------------------
  /**
   * The reason anybody is in the building, and the one surface here that is
   * *pale*.
   *
   * Every other floor in this directory is dark. The proscenium's is `boards`
   * blended most of the way to `backdrop` and shaded by a third, the barn's is
   * darker still because it has been threshed on since 1780, and the arena's is
   * a slab. All three are right, and all three are floors nobody is looking at.
   * This one is waxed maple with fifty years of boots on it, it is the brightest
   * large surface in the room, and it is what the band is playing to. So it goes
   * the other way: `boards` pulled toward the palette's pale architecture entry
   * and then lifted, at a roughness of 0.62 rather than the usual 0.95, which is
   * the difference between timber and *polished* timber under a wash.
   *
   * That is not only atmosphere. `stage-audience.ts` draws the crowd as unlit
   * silhouette, and a silhouette needs something behind and below it or it
   * floats — the failure `proscenium.ts` names at length about its own house
   * floor. A hundred dark shapes standing on a pale floor is the photograph;
   * a hundred dark shapes standing on a dark floor is a smudge.
   *
   * **The boards run across the room, which is the other half of not being a
   * barn.** `riihi.ts` runs its planks in z, away from the camera, and so does
   * the proscenium and so do the stage's own boards — three surfaces with one
   * grain, converging on the stage. Running these the other way puts a ladder of
   * horizontal lines under the crowd, and a ladder of horizontal lines is how a
   * wide floor reads as *wide*: the perspective is in the spacing rather than in
   * the convergence. It is also at right angles to this room's own ceiling
   * boarding, so the two large planes the eye has to tell apart are told apart
   * by their grain and not by their colour.
   *
   * It runs wall to wall and end to end with 0.3 m of overlap, so no seam opens
   * at the foot of any wall — and not one plank further, because these walls are
   * planes the camera can look through from outside and floorboards sticking out
   * through the side of a building is the thing that stops being invisible the
   * first time somebody screenshots the room from the wrong side.
   *
   * It receives. It is the large flat thing under the band.
   */
  const floorW = wallX * 2 + 0.6;
  const floorD = roomLen + 0.6;
  const floor = new Mesh(
    c.kit.own(cellPlane({
      width: floorW, height: floorD,
      cols: Math.max(5, Math.round(floorW / 2.8)),
      rows: Math.max(12, Math.round(floorD / 0.26)),
      colour: tint(blend(p.boards, p.proscenium, 0.34), 0.06),
      jitter: 0.12, rng: c.rng('housefloor'),
    })),
    c.kit.solid('#ffffff', { vertexColors: true, rough: 0.62 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, m.houseY, (frontZ + backZ) / 2);
  floor.receiveShadow = true;
  root.add(floor);

  // --- the walls -----------------------------------------------------------
  /**
   * Four of them, and the fourth is the one behind the band.
   *
   * A proscenium builds three and leaves the upstage end to a cloth, because in
   * a theatre there genuinely is a cloth and nobody is ever behind it. There is
   * no cloth here — the thing behind this band is the end wall of the hall, with
   * the same dado running round it at the same height — so it is built as a wall
   * out of the same function as the other three and gets the `backdrop` stream,
   * which is the name every room in this project uses for the surface behind the
   * band. Two of the four are 19 m long and the whole room is one material, one
   * rail line and one paint job, which is what a building is and what four
   * independently coloured planes are not.
   *
   * **Single-sided**, like every room here except the barn, and for the reason
   * `proscenium.ts` gives: orbit yaw is not clamped, swinging round the outside
   * of the building is something a viewer does in the first ten seconds, and a
   * solid wall answers that with a black screen where a single-sided one lets
   * you look straight in.
   *
   * The floor-to-ceiling height is `h.lid` in every era including the boarded
   * one, and that is deliberate rather than incidental: under the `low-ceiling`
   * prop the plaster comes in at exactly `houseY + LOW_CEILING`, so a wall built
   * to anything else would leave a slot of nothing all the way round the room —
   * the failure `stage-props.ts` has already had twice and written two comments
   * about, and the one this room came closest to shipping.
   */
  const wallRng = c.rng('walls');
  const sideWall = (side: number): Group => {
    const wall = boardWall(c, h, roomLen, h.lid, wallRng);
    wall.position.set(side * wallX, m.houseY, (frontZ + backZ) / 2);
    wall.rotation.y = side * -Math.PI / 2;
    return wall;
  };
  root.add(sideWall(-1));
  root.add(sideWall(1));

  const rear = boardWall(c, h, wallX * 2, h.lid, wallRng);
  rear.position.set(0, m.houseY, backZ);
  rear.rotation.y = Math.PI;
  root.add(rear);

  const end = boardWall(c, h, wallX * 2, h.lid, c.rng('backdrop'));
  end.position.set(0, m.houseY, frontZ);
  root.add(end);

  // --- the posts -----------------------------------------------------------
  /**
   * Two rows of posts down the room, with a beam on each row.
   *
   * This is the object the whole file is for. A timber hall eighteen metres
   * across cannot span it in one go and does not try: it carries a beam down
   * each side of the dance floor on a row of posts and spans the ceiling in
   * three bites — a wide clear middle where people are dancing and two narrow
   * aisles where the tables, the bar and everybody's coat are. The silhouette of
   * a receding colonnade is the thing that says *dance hall* from the back of
   * the room before a single object in it is legible, and nothing else in this
   * directory has one: the courtyard's arcade is masonry across a back wall, and
   * the arena's steel is ten metres up.
   *
   * `POST_OUT` carries the proof that they are somewhere harmless. What is worth
   * repeating here is the shape of the picture it produces, because it is the
   * reason the answer is a colonnade at the sides rather than the row down the
   * middle a real hall often has. Down the middle would be architecturally
   * closer and completely unusable — every post would be between the camera and
   * the band. At the sides they are outside every frame the show composes at the
   * near end of the room and inside it at the far end, so what the wide shot
   * gets is two rows of verticals sweeping out of frame past the lens. That is
   * the same thing a real colonnade does to a real photograph, and it is bought
   * rather than faked.
   *
   * **They receive and do not cast.** The rule says chunky solids on a floor
   * cast, and it is the right rule; the reason it does not fire here is
   * arithmetic rather than taste. There is one shadow-casting lantern in the
   * budget and `lights.ts` gives it a frustum of `max(width, depth) / 2 + 4`
   * aimed at the stage. These stand `width / 2 + 2.75` out, at the very edge of
   * that box, and what they would cast is a post shadow onto empty floor eight
   * metres from anybody. A depth pass for a shadow no camera in this show is
   * pointed at is the cost `riihi.ts` refuses for its walls and its door posts,
   * for the same reason. The **steps** below are where this room spends its
   * casting, and they are 2.5 m from the drummer.
   *
   * One `InstancedMesh` for the posts and one for the knee braces: about thirty
   * bevelled boxes in two draw calls. The braces are not decoration — a post
   * meeting a beam in a butt joint reads as a pipe, and the pair of diagonals
   * under the head is the single detail that says the thing is made of wood and
   * was cut by somebody.
   */
  const timberColour = shade(blend(p.proscenium, p.boards, 0.55), 0.26);
  const timber = c.kit.solid(timberColour, { rough: 0.95, flat: true });
  /**
   * The beam soffit. The posts run from the floor to it and the beam sits on
   * top, so the two meet at a face rather than overlapping by half a section —
   * which is what a post and a beam do, and is also the only way the beam's own
   * shadow line reads as a joint rather than as a seam.
   */
  const beamH = 0.3;
  const postH = h.lid - beamH;
  const bays = Math.max(4, Math.round(roomLen / POST_GAP));
  const postX = m.houseWidth / 2 + POST_OUT;

  const posts = new InstancedMesh(
    c.kit.bevelBox(POST_SIDE, postH, POST_SIDE, 0.022), timber, bays * 2);
  const braces = new InstancedMesh(
    c.kit.bevelBox(0.1, 0.62, 0.1, 0.02), timber, bays * 4);
  const dummy = new Object3D();
  const postColour = new Color();
  const postBase = new Color(timberColour);
  let pi = 0;
  let bi = 0;
  for (let i = 0; i < bays; i++) {
    const z = frontZ + ((i + 0.5) * roomLen) / bays;
    for (const side of [-1, 1]) {
      dummy.position.set(side * postX, m.houseY + postH / 2, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      posts.setMatrixAt(pi, dummy.matrix);
      /**
       * Per-post colour, which is `cellPlane`'s argument one object up: a row of
       * thirty identically shaded timbers is one timber repeated, and the eye
       * reads the repeat instead of the row. Every post in a real hall came off
       * a different tree and half of them have been repainted since.
       */
      postColour.copy(postBase).multiplyScalar(1 + (wallRng.next() - 0.5) * 0.24);
      posts.setColorAt(pi, postColour);
      pi++;

      // A knee brace each way, springing 0.44 m below the beam and dying into
      // its soffit — so both ends land on something, which is the only rule a
      // diagonal has.
      for (const lean of [-1, 1]) {
        dummy.position.set(
          side * postX,
          m.houseY + postH - 0.22,
          z + lean * 0.22,
        );
        dummy.rotation.set(lean * 0.7, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        braces.setMatrixAt(bi++, dummy.matrix);
      }
    }
  }
  posts.receiveShadow = true;
  braces.receiveShadow = true;
  root.add(posts);
  root.add(braces);

  /**
   * The two beams, running the whole length of the room and dying into the end
   * walls at both ends.
   *
   * They exist because the posts do. A post holding up nothing is a bollard, and
   * a row of them under a flat ceiling is a row of bollards — the same failure
   * `stage-props.ts` names about a beam that stops short of a wall, one axis
   * over. Running them the full length also means neither end is ever visible as
   * an edge in mid-air, whatever the era does to the size of the room.
   *
   * Deeper than they are wide, at 0.3 by 0.2, because that is which way round a
   * beam is loaded and because the depth is what shows: from anywhere in the
   * room you see the soffit and one cheek, and a square section would read as a
   * duct.
   *
   * **Dropped 0.02 m**, so the beam's top is under the boarding rather than in
   * it. `postH` is `h.lid - beamH`, so a beam sitting square on its posts has its
   * top face at `m.houseY + h.lid`, which is `lidY` — the plane of the ceiling,
   * drawn `DoubleSide` and therefore drawn from below as well. Both runs the
   * length of the room, so it was three square metres of ceiling flickering
   * over the two things the eye follows in this room. The 2 cm comes off the
   * top and is taken up at the bottom, where the beam simply overlaps the head
   * of its post: nothing opens, and no post loses its bearing.
   */
  const beamGeo = c.kit.bevelBox(0.2, beamH, roomLen, 0.025);
  for (const side of [-1, 1]) {
    const beam = new Mesh(beamGeo, timber);
    beam.position.set(side * postX, m.houseY + postH + beamH / 2 - 0.02, (frontZ + backZ) / 2);
    beam.receiveShadow = true;
    root.add(beam);
  }

  // --- the lid -------------------------------------------------------------
  /**
   * The ceiling, and it is the reason the room is worth building.
   *
   * Not built at all where `low-ceiling` is up: `stage-props.ts` is about to
   * span the whole room with a `DoubleSide` plane 10 cm below this one, and
   * geometry nobody can see is geometry nobody should pay for. Everything else
   * in this file stands in that era exactly as it does in the other three — the
   * posts, the beams, the floor and the walls are what the eye reads a dance
   * hall by at head height anyway, and the posts simply stop 10 cm lower.
   *
   * `cellPlane` and `DoubleSide` and no shadow flags, which is what every lid in
   * this project is, and the argument is `low-ceiling`'s own and worth restating
   * because it applies to any ceiling: a hemisphere lights a flat plane to *one
   * number*, so a surface whose normal never changes gets identical light at
   * every pixel and reads as a hole however carefully the colour is picked.
   * Cells give it a grain for nothing. The cells here run **along** the room —
   * narrow in x, long in z — which is at right angles to the floorboards below
   * and is what makes the two planes distinguishable at a glance in a room where
   * they are only three metres apart.
   *
   * Pale, and paler than anything else overhead in this directory. The barn's
   * roof is sooty and argues for being only *slightly* darker than its walls;
   * this is painted boarding in a room where the wash reaches it, and the whole
   * lesson of the cellar ceiling is that spending the smallest light budget in
   * the room on the darkest albedo in the room gives five counts out of 255 and
   * a hole in the top of the frame. A low ceiling is in shot far more of the
   * time than a high one, so it can afford it least of all.
   *
   * It runs wall to wall so every edge of it dies into something.
   */
  if (!h.lowCeiling) {
    const lid = new Mesh(
      c.kit.own(cellPlane({
        width: floorW, height: floorD,
        cols: Math.max(8, Math.round(floorW / 0.3)),
        rows: Math.max(4, Math.round(floorD / 2.2)),
        colour: tint(blend(p.proscenium, p.ambient, 0.28), 0.2),
        jitter: 0.1, rng: c.rng('ceiling'),
      })),
      c.kit.solid('#ffffff', { vertexColors: true, rough: 0.96, side: DoubleSide }),
    );
    lid.rotation.x = -Math.PI / 2;
    lid.position.set(0, lidY, (frontZ + backZ) / 2);
    root.add(lid);
  }

  // --- the bandstand -------------------------------------------------------
  /**
   * Two treads at each downstage corner of the platform, and they are the only
   * thing this file adds to the stage itself.
   *
   * `stage.ts` owns the boards, the apron and the lip and no room may argue with
   * any of them; what the apron draws is a 0.55 m face across the front of the
   * room, which is correct and is not a bandstand. The difference between a
   * platform and a stage is that you walk onto a platform, and a step is the
   * object that says so. It is also what makes the height legible: 0.55 m is a
   * number nobody can read off a blank face, and *two steps* is a number
   * everybody can.
   *
   * They are at the corners rather than across the front, and the position was
   * forced rather than chosen. `dance-floor` lays parquet from `lipZ + 0.45`,
   * `crowd-barrier` stands at `lipZ + 0.82`, and the stage's own lip reaches
   * `lipZ + 0.14`: a step across the front has 0.31 m to live in and would touch
   * two props on most seeds. Outboard of `width / 2` there is nothing at all —
   * the parquet is `houseWidth * 0.35` wide, which is *narrower* than the boards
   * in every era of this genre, and the railing stops at `width - 0.4`. So the
   * steps go where a hall's steps actually are, at the ends, where somebody
   * carrying a bass fiddle would come up.
   *
   * **These cast**, and they are the only thing in this room that does. They are
   * chunky solids standing on a floor 2.5 m from the drummer and well inside the
   * shadow frustum, which is the exact case the policy's second clause is for —
   * unlike the posts, which stand at the edge of it over empty floor.
   */
  const tread = c.kit.solid(shade(blend(p.boards, p.proscenium, 0.3), 0.34), { rough: 0.88 });
  for (const side of [-1, 1]) {
    for (const step of [0, 1]) {
      const height = (HALL_RISE * (step + 1)) / 2;
      const box = new Mesh(c.kit.bevelBox(0.86, height, 0.34, 0.025), tread);
      box.position.set(
        side * (m.width / 2 + 0.52),
        m.houseY + height / 2,
        m.lipZ - 0.18 - step * 0.34,
      );
      box.castShadow = true;
      box.receiveShadow = true;
      root.add(box);
    }
  }

  // --- what the lamps hang on ----------------------------------------------
  /**
   * A pipe on two drop-arms, screwed to the ceiling joists.
   *
   * `RoomRig.flyBar` forbids a bare group at a height nothing reaches, which
   * rules out the obvious cheat of returning an empty node at `flyY` and calling
   * a boarded ceiling a fly tower. There is no flying in this building and never
   * was: somebody bolted a length of conduit up and hung six cans off it, and
   * the arms are short because there is nothing to be long about.
   *
   * **Its z is the one number this file and `stage-props.ts` have to agree
   * about**, and `circuit.ts` found out why the hard way. `BUILDERS.truss` hangs
   * its downstage run at `curtainZ - 1.1` and, in a room with a finite
   * `headroom`, at `max(HANG_FLOOR + 0.3, headroom - 0.28)` — which in this room
   * is 2.95 m, within 7 cm of this bar's own height. Two objects at the same
   * height and the same z is one object drawn twice by two files. So the bar
   * sits 0.75 m upstage of the truss line, which clears the lattice's 0.17 m
   * half-section and this pipe's own by half a metre, and reads as two bars
   * rather than as one thick one. The 1978 and some 1968 shows are the only ones
   * that have both, and those are the shows where a rig with two bars in it is
   * the point.
   *
   * Straight rather than sagging, for the courtyard's reason: `lights.ts`
   * parents its pars at y = 0 in this group's frame, so a pipe that dipped in
   * the middle would have its lamps hanging in the air below it.
   */
  const flyBar = new Group();
  flyBar.name = 'fly-bar';
  flyBar.position.set(0, m.flyY, m.curtainZ - 1.85);
  const pipe = new Mesh(
    c.kit.bevelBox(m.openingWidth + 0.8, 0.08, 0.08, 0.038),
    c.kit.solid(shade(p.proscenium, 0.68), { metal: 0.5, rough: 0.45 }),
  );
  flyBar.add(pipe);
  /**
   * The arms, and they reach the ceiling exactly. `m.headroom` is the underside
   * of whatever is overhead — this room's boarding, or the honky-tonk soffit the
   * prop draws — so the same expression lands on both without a branch, and
   * neither leaves a centimetre of daylight between the top of an arm and the
   * thing it is screwed to. A hanger with a gap over it is a hanger hanging from
   * nothing, which is a smaller version of the bug `flyY` was written after.
   */
  const armH = Math.max(0.05, m.headroom - m.flyY - 0.04);
  const armGeo = c.kit.bevelBox(0.05, armH, 0.05, Math.min(0.018, armH * 0.3));
  const armMat = c.kit.solid(shade(p.proscenium, 0.78), { metal: 0.45, rough: 0.5 });
  for (const side of [-1, 1]) {
    const arm = new Mesh(armGeo, armMat);
    arm.position.set(side * (m.openingWidth / 2 - 0.7), armH / 2 + 0.04, 0);
    flyBar.add(arm);
  }
  root.add(flyBar);

  /**
   * No cloth, and the 1968 broadcast is the interesting reason rather than the
   * obvious one.
   *
   * The obvious one first: a dance hall has no house tabs. There is nothing to
   * fly them from, nothing to mask the track with, and nothing anybody would
   * have paid for — the band walks on from the side of the room past the people
   * already standing at the front, which is what `noCurtain()` describes
   * exactly. It reports the cloth as being where the show asked for it on the
   * same frame, so `show.ts` never stalls waiting for travel that will not
   * happen and the band is still hidden while it is being staged, which is what
   * the invisibility was ever for. The reveal is a cut, and a cut is right: what
   * actually happens is that five people put their drinks down.
   *
   * The interesting one is that the era which *did* have a curtain does not get
   * one from this file either. A 1968 network stage had drapes, and it had them
   * because the network brought them — which is why `nashville` names `drapes`,
   * a prop, and why `stage-props.ts` hangs two pairs of legs at
   * `curtainZ - 1.6` and `curtainZ - 3.5` when it does. Cloth that arrives with
   * the outside broadcast unit is not architecture. Building house tabs into the
   * hall so that one era in four could have them would be the room lying about
   * the other three, which is the whole thing this seam exists to stop.
   */
  const curtain = noCurtain();
  root.add(curtain.root);

  return { root, flyBar, curtain };
}

export const dancehall: RoomBuilder = { shape, build };
