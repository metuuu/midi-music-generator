/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The lawn — a fenced piece of ground with a sound system standing on it.
 *
 * `reggae/staging.ts` names this room `lawn` and opens by saying what it is
 * against: *this room is outdoors, like the pavilion and unlike the other two,
 * and for the opposite reason. A tanssilava is outdoors because Finland has six
 * weeks of summer. A lawn is outdoors because a sound system is a lorry-load of
 * speaker boxes and there is no building in the neighbourhood that would hold
 * it.* That sentence is the whole brief for this file, and it has a second half
 * the genre could not write because it had nowhere to put it: a tanssilava is a
 * **building** with no walls, and a lawn is a **piece of ground** with no
 * building. The pavilion's roof is the thing it is; take the roof off and there
 * is nothing left to call it. Take everything off a lawn and the lawn is still
 * there, because the lawn is the dirt.
 *
 * ## The two rooms this one must not be, stated as objects
 *
 * Three rooms in this directory are open to the sky and none of them can afford
 * to be a generic outdoors. The differences are not mood, they are things you
 * could trip over:
 *
 * **Against `courtyard.ts`.** That room is a walled court — four faces of a
 * building, 4.2 to 5.8 m of limewashed masonry, an arcade of horseshoe arches
 * standing in front of three of them, and a flagged floor. The sky is a strip
 * seen up a shaft. Everything vertical in it is *architecture in the strict
 * sense*: somebody laid it, it has footings, and it will be there next year.
 * Nothing in this room is. The boundary here is corrugated zinc sheet lashed to
 * posts driven into the earth, the rig is scaffold standing on the same earth,
 * and the deck is a platform somebody built on Friday. A courtyard is a room
 * that has lost its roof; a lawn is a field that has gained a fence. The test
 * that separates them from a moving camera is the sky: over a court you see a
 * rectangle of night bounded on four sides by wall heads, and here you see the
 * horizon, because the fence is 3.3 m and the eye goes over it from anywhere
 * the lens can stand.
 *
 * **Against the tanssilava**, which is `proscenium.ts` under `open-air` and is
 * the room three quarters of this genre's own props were tuned against. That
 * one keeps its arch, its fly tower, its wings, its curtain and its boarded
 * floor, removes the side and rear walls, and puts a 2.4 m coped wall and a sky
 * behind the band — a *bandstand*, roofed, with birches and a lake round it.
 * Every one of those is refused here. There is no arch and no masking, so
 * nothing narrows the picture; there is no fly tower, so the rig stands on the
 * ground; there is no coping and no lake, so what is behind the band is more
 * fence. And the pavilion is not enclosed at all — its whole idea is that you
 * can walk off it into the trees — where a lawn's single most characteristic
 * object is the thing stopping you doing exactly that. See `FENCE_H`: the fence
 * is the box office.
 *
 * ## What this file draws, and what it must not
 *
 * `reggae/staging.ts` names `riser` and `bar` genre-wide and its four dressings
 * add `pa-stack`, `backline`, `crowd-barrier`, `neon`, `truss`, `wedges`,
 * `dance-floor`, `bunting`, `fairy-lights`, `posters`, `moths`, `flight-case`
 * and `mirror-ball`. Every one of those belongs to `stage-props.ts`, which
 * places them for every room at once, and a room drawing its own would draw
 * each of them twice with a few centimetres of parallax between the copies.
 *
 * The one that has to be said out loud is `pa-stack`, because it is the object
 * this music is *about* and the temptation to build it here is real: the wall
 * of speaker boxes is a sound system, a sound system is why the dance happened,
 * and it is very tempting to call it architecture on the grounds that the room
 * would not exist without it. It is not architecture. It arrived on a lorry, it
 * leaves on the same lorry, and `BUILDERS['pa-stack']` already stands it on the
 * boards. What is left over after every prop has had its share is precisely
 * four things, and they are exactly the four a lawn is: **the ground, the fence
 * round it, the zinc behind the band, and the scaffold the lamps are bolted
 * to.** That is the whole file.
 *
 * ## The modifiers, all five of them, refused
 *
 * `open-air` is named by every era of this genre and by its fallback, and it
 * changes nothing here — which is the honest answer rather than a lazy one. In
 * the courtyard the flag is load-bearing because arabic's fourth era genuinely
 * is *the same court with a roof on it*, so there are two buildings and one
 * flag choosing between them. There is no second building here. A lawn with a
 * lid on it is a hall — an enclosed room with a ceiling the sound comes back
 * off, which is the single most consequential architectural fact about the
 * music that came *after* this one — and a hall is a different building rather
 * than this one with a flag set. That deserves a sibling of this file, and
 * until a genre asks for one, a branch on a flag that is never false would be a
 * switch with one arm.
 *
 * `low-ceiling` follows from that and is refused for the same reason, with one
 * extra note because `riihi.ts` decided the opposite question the opposite way.
 * That room answers the flag — grudgingly, and only because `runo` genuinely
 * names it at 0.3 and `stage-props.ts` will draw a lid at `houseY +
 * LOW_CEILING` whatever the room publishes, so a barn that ignored it would
 * have a pitched roof six metres up behind a flat ceiling three and a half
 * metres up, which is two buildings with the wrong one visible. No era of
 * reggae names it, so that collision cannot occur, and building a second room
 * for a seed that does not exist is the speculative generality this repo is
 * explicit about not paying for.
 *
 * `brick` is a wall you are meant to read, and every vertical surface here is
 * sheet metal on purpose — see `FENCE_H` again. `black-box` is matte paint on a
 * theatre. `haze` is air rather than architecture; `stage.ts` reads it straight
 * off the venue, and it is worth noting that `roots` deliberately does *not*
 * name it while carrying `fog: 0.35`, the highest in the project, on the
 * grounds that what is in the air in a yard is a warm night and several hundred
 * people rather than a machine. Nothing for a room to add to that.
 *
 * ## The eras do not differ architecturally, and that is the answer
 *
 * `ska`, `rocksteady`, `roots` and `digital` span twenty-two years and stage in
 * the same yard at the same eight numbers. The genre says so itself: 1967 is
 * *the same yard, one amplifier louder*, and 1975 is *the sound system has
 * eaten the room*. Both of those are changes in what was **carried in**, which
 * is what `StageDressing.props` is for, and the props do say them — one small
 * PA becomes a wall of boxes, bunting becomes a lighting truss, and a barrier
 * appears across the front when the crowd gets big enough to need one.
 *
 * A room cannot see the era anyway and should not be given a way to; the only
 * channels are the props and `StageDressing.grow`, and `grow` is used: the
 * stage goes from 11 m to 11.6 m across the four, and the fence, the ground,
 * the towers and the aperture all ride it. But the ground itself did not
 * change, and that is the point rather than a shortcut. It is the same piece of
 * dirt behind the same shop in 1963 and in 1985, and a room that got smarter
 * with each decade would be inventing a difference the music does not have.
 * Compare `riihi.ts`, which reaches the same conclusion about a log barn over
 * three hundred years for the same reason.
 */

import {
  BoxGeometry, Color, CylinderGeometry, Group, InstancedMesh, Mesh, Object3D,
  Vector3,
} from 'three';

import { blend, cellPlane, shade, tint } from '../stage-kit.js';
import { skyDome } from './proscenium.js';
import {
  noCurtain, type RoomBuilder, type RoomContext, type RoomDatum, type RoomRig,
  type RoomShape,
} from './types.js';

/**
 * How far the deck stands above the dirt.
 *
 * The longest argument in this file, because it is the number that decides
 * whether this room is a stage in a yard or a yard with a shelf in it, and
 * because `riihi.ts` has already shown that the honest answer to "what is the
 * stage here" can be a number the rest of the system cannot survive.
 *
 * The candidates it sits between are all real and all wrong. `RIIHI_RISE` is
 * 0.3 m — a plank on two blocks, for a room whose whole claim is that there is
 * no stage — and that fails here on the picture: this house is nine rows
 * standing at density 0.9, **the densest crowd in the project** — which it was,
 * and is third now: metal came in at 0.94 and dnb at 0.92, and funk sits level
 * with it at 0.90. Nothing about the derivation moves, because a crowd 4 % less
 * dense is the same wall of heads at the same height and the number below is
 * solved against the height rather than against the spacing. A standing
 * figure is 1.62 m to the middle of the head. At 0.3 m the front row's crowns
 * would sit 1.32 m above the boards, across a standing bass player's chest,
 * from every camera in the room, permanently, with no gaps in the row to see
 * between. `DAIS_RISE` is 0.45 m and buys back 0.15 m of that against a house
 * that is *seated*; this one is not. `STAGE_RISE` is 0.9 m and is a proscenium
 * house — a stage with a building round it. `DECK_RATIO` in `circuit.ts` gives
 * 1.0 to 1.45 m and is a touring deck built so nine thousand people can see
 * over eight rows, which is the right answer for an arena and an absurd one for
 * a yard behind a shop.
 *
 * 0.75 m, and there are two reasons it is that rather than 0.9.
 *
 * The first is what a lawn stage physically was: scaffold decking on adjustable
 * bases, or a flatbed, built in an afternoon by the people who were going to
 * play on it. Below about 0.8 m you climb onto it; above that you need steps
 * bolted on and something to stop people walking off the edge, and at that
 * point somebody has built a stage rather than raised a floor. This is the top
 * of the range where the platform is still a platform.
 *
 * The second is measured, against a prop this genre names in half its eras.
 * `BUILDERS['crowd-barrier']` stands a rail at `houseY + 1.08` — so at 0.75 m
 * of rise the rail tops out **0.33 m above the boards**, which is the
 * photograph: a barrier the front row leans on with their forearms flat on the
 * front of the stage. At the proscenium's 0.9 m it is 0.18 m up and starts to
 * read as a low fence in front of a wall; `circuit.ts` names the same failure
 * from the far end, where above 1.45 m the barrier stops holding a crowd off a
 * stage and starts fencing the bottom of a cliff.
 *
 * What it costs is stated rather than hidden, because the cellar's comment is
 * right that this is not a defect. `crowdExtent` puts the back row's crowns at
 * `houseY + 2.22`, so at this rise the furthest heads are 1.47 m above the
 * boards — around a standing player's waist — and the front row's are at 0.99 m,
 * about the knee. From a low camera down in the house there are heads across
 * the bottom of the frame. That is what being at the front of a dance is, and
 * it is the reason to be at the front of a dance.
 */
const LAWN_RISE = 0.75;

/**
 * Half the footprint of a lighting tower, and therefore half of what the
 * aperture means in this room. See `openingWidth` in `shape()`.
 *
 * 0.72 m square is a light-duty ground-support tower — four standards on
 * base plates with ledgers every lift — and it is deliberately at the slim end
 * of what would really be built, because the towers stand on open ground beside
 * the deck with nothing behind them and a chunky one reads as a pylon. The
 * number is also load-bearing in x: at this half-width the tower's *inner*
 * faces land exactly on the edges of the boards, and its outer faces stand
 * 0.18 m inboard of the one x that two different props both want:
 * `BUILDERS.posters` hangs its side panels at `openingWidth / 2 + 0.9` and
 * `BUILDERS.truss` drops its outboard legs at `(openingWidth + 1.8) / 2`, which
 * is the same number. Widen the tower by a handspan and this room starts
 * drawing steel through two props it does not own.
 */
const TOWER_HALF = 0.36;

/**
 * How far the towers stand proud above the lighting bar.
 *
 * Not decoration: a bar is *clamped* to a tower, so there has to be tower above
 * the clamp. A rig trimmed flush with the top of its own scaffold is a rig
 * hanging off the end of two poles, which is the same visual lie as a fly bar
 * with no fly tower and is exactly what `RoomRig.flyBar` was written to stop at
 * the other end of the same problem.
 *
 * Just under a metre, which is one scaffold lift, and it is also what keeps the
 * whole goal-post inside the wide shot. See `flyY`.
 */
const TOWER_HEAD_CLEAR = 0.95;

/**
 * How far upstage of the curtain line the towers stand, and with them the bar.
 *
 * `proscenium.ts` puts its fly bar at `curtainZ - 1.1` because that is where a
 * theatre's first electric hangs, behind the header and out of sight.
 * `circuit.ts` moved to `curtainZ - 1.9` so that four motor chains climb past
 * the `truss` prop's downstage run rather than through it. Neither argument
 * applies to two towers standing on dirt, and the geometry that does is the
 * footprint: the towers have to be beside the deck rather than in front of it,
 * because 0.82 m is all the ground there is between the lip and
 * `BUILDERS['crowd-barrier']`, and a 0.72 m tower in that strip would be inside
 * the barrier and on top of `BUILDERS['dance-floor']`, which starts at
 * `lipZ + 0.45`.
 *
 * So they stand at the downstage corners of the boards, 0.85 m in from the lip,
 * which puts them clear of every prop in the genre's vocabulary. All three
 * clearances were measured rather than hoped for: the tower's upstage face sits
 * 0.22 m downstage of the `truss` run's near chord, the first `posters` panel
 * lands 0.19 m upstage of that same face, and the bar's own upstage face clears
 * the `mirror-ball`'s swept radius by 0.16 m — which is the tightest number in
 * this file and the reason the bar is not another handspan upstage.
 *
 * It does mean the bar is only 0.15 m upstage of the front line, so the pars on
 * it are nearly straight over the front row of the band. That is a compromise
 * and it is the right one: it is still further *downstage* than a proscenium's
 * first electric, which sits 0.85 m upstage of the same players, and the front
 * of the band is keyed from the house by `lights.ts` anyway. A bar further
 * upstage would be a bar the towers could not hold.
 */
const BAR_UPSTAGE = 0.35;

/**
 * How tall the fence is, from the ground, and why it does not scale with the
 * room.
 *
 * **The fence is the box office.** That is not a joke and it is the reason this
 * object exists rather than a hedge or a line of oil drums: a lawn was a
 * commercial dance, you paid at the gate, and the entire function of a wall of
 * corrugated zinc round a piece of open ground is to stop the people outside it
 * hearing the sound system for free. Every other enclosure in this directory is
 * structural — it holds a roof up, or it is the side of a building somebody
 * lives in. This one holds nothing up and is there to be opaque.
 *
 * Fixed rather than scaled, which is `COURSES` in `riihi.ts`'s argument
 * arriving at the same place from a different material. You do not choose a
 * 3 m fence; zinc comes in sheets of a length, you stand one on end, and the
 * fence is as tall as a sheet is long. A wider yard is not fenced with taller
 * sheets, it is fenced with more of them. 3.05 m is a ten-foot sheet, and the
 * posts stand `POST_PROUD` above it because a post you have nailed a sheet to
 * is always longer than the sheet.
 *
 * It is also as tall as it can be without turning into the courtyard. At 3.3 m
 * the camera's own wide shot stands at about 3.5 m above the floor and looks
 * *over* it, so there is horizon and sky beyond the fence from every position
 * the director uses; a metre more and the yard closes over the audience and
 * this becomes a court with cheaper walls.
 */
const FENCE_H = 3.05;
const POST_PROUD = 0.25;

/**
 * How tall the zinc behind the band is.
 *
 * Taller than the fence, and it is a different object doing a different job:
 * the fence is a boundary and this is a **backing** — sheet lashed to the same
 * scaffold the towers are made of, put up for the dance, to keep the wind off
 * the drums and to give the band something to be seen against. It is measured
 * from the house floor because `RoomShape.backdropHeight` is measured from the
 * ground like a wall.
 *
 * The height is not a taste decision, it is solved against the two things that
 * get drawn on it, and both were measured before the number was picked.
 *
 * `BUILDERS.neon` — named outright by `roots` and `digital` and at 0.4 by
 * `rocksteady` — hangs its back sign at `min(openingHeight - 0.5, max(HANG_FLOOR
 * + 0.4, openingHeight * 0.6))`, which in all four eras of this genre resolves
 * to the `HANG_FLOOR` arm at 3.05 m above the boards, with a 0.62 m sign round
 * it. Its top is therefore at 4.11 m above the ground in every era. A backing
 * shorter than that puts a lit sign in the night sky above its own wall,
 * attached to nothing — which is the exact bug `backdropHeight` was added to
 * `RoomShape` after, when a cyclorama glow sized off the aperture hung three
 * metres of lit rectangle over a tanssilava's low wall.
 *
 * `lights.ts` is the second consumer and is satisfied for free: it sizes the
 * cyc glow at `min(openingHeight * 1.06, backdropHeight - 0.1)`, so this number
 * is what stops the wash overrunning the cloth, and at 4.3 m the glow is 4.2 m
 * tall standing on a 4.3 m surface.
 *
 * 4.3 m is 0.19 m of margin over the sign. It does not scale with the room
 * because neither of the two things it has to contain does.
 */
const BACKDROP_H = 4.3;

/** How far outside the boards the backing runs, as a fraction of the width. */
const BACKDROP_SPREAD = 1.25;

/**
 * How far behind the boards the yard stops.
 *
 * There has to be *some* ground behind the stage or the backing is standing on
 * the edge of the world, and there has to be little enough that it reads as the
 * back of a yard rather than as more yard. 1.2 m is the strip you walk down to
 * get to the back of the deck with a speaker box, which is what it was for.
 */
const YARD_UPSTAGE = 1.2;

/**
 * How far the ground runs past the fence on every side.
 *
 * The dirt does not stop at the zinc — that is the whole difference between a
 * fence and a wall, and the camera finds it the moment it lifts over the fence
 * head, which it does in every wide shot. Eight metres is enough that the edge
 * of the plane is always further away than the fog's own far plane at this
 * genre's `fog` settings, so what is beyond the yard reads as more dark ground
 * going away rather than as a plane ending.
 */
const GROUND_OUT = 8;

/** Cover width of one sheet of corrugated zinc, and how many flutes it has. */
const SHEET_W = 0.82;
const FLUTES = 8;

/** How many sheets between fence posts. */
const POST_EVERY = 3;

function shape(d: RoomDatum): RoomShape {
  /**
   * How high the towers stand above the boards, which in a room with no arch,
   * no header and no roof is the only top edge the picture has.
   *
   * `RoomShape.openingHeight` is "the aperture's height above the boards", and
   * the aperture here is the gap between two scaffold towers with a bar across
   * it — a goal-post, which is what every ground-supported rig in the world
   * looks like. So this is the tower head, and everything hung reads it: the
   * cyc glow fills it, `swag()` ties the bunting and the festoon off just under
   * it, and `lights.ts` puts its wash and its back light at fractions of it.
   *
   * `width * 0.40` against the proscenium's `0.44` and the circuit's `0.5`, and
   * the ranking is deliberate rather than shy. This is not a hall built round a
   * show and it is not a theatre; it is as much scaffold as four people could
   * put up and take down in a day, and it should be visibly less air than a
   * building would have given the same band. Over an 11 m stage it comes to
   * 4.4 m, which with the rise is 5.15 m of tower standing on the dirt.
   *
   * The clamps are for a genre that is not this one. Under 3.9 m the bar would
   * be inside `HANG_FLOOR` and the festoon would be hanging in faces; over
   * 5.2 m the tower head climbs out of the top of the wide shot, which is the
   * failure the next field is about.
   */
  const openingHeight = Math.max(3.9, Math.min(d.width * 0.40, 5.2));
  return {
    rise: LAWN_RISE,
    /**
     * **The aperture is the clear span between the towers, which is exactly the
     * width of the boards** — and that is arithmetic rather than a coincidence,
     * because `TOWER_HALF` was chosen to make it so.
     *
     * A proscenium takes 0.94 of the stage because the outer 6 % is behind a
     * tormentor. A courtyard takes 1.0 because there is no tormentor. A circuit
     * takes 1.14 to 1.17 because the deck is wider than the band and there is
     * nothing at the sides for eight metres. This room takes 1.0 for a third
     * reason: there *is* something at the sides, it is the only thing at the
     * sides, and it stands exactly on the edge of the boards. The two towers
     * are the jambs of the only opening this room has, and a player standing on
     * the corner of the deck is seen from every part of the yard right up to
     * the leg of the tower.
     *
     * Saying anything narrower would be inventing masking that is not there;
     * saying anything wider would be claiming the towers are not in the way,
     * which they are — a lamp hung outboard of them would be hanging behind a
     * scaffold standard. It also leaves the hard rule in `RoomShape` satisfied
     * with the whole margin to spare: `cast.ts` clamps players to a hardcoded
     * `min(width / 2 - 0.5, width * 0.47)` with no sight of this file, so a
     * room that narrowed its aperture below the boards would have no way to
     * tell the caster and the symptom would be half a trombonist behind a leg.
     *
     * What it actually buys is everything hung, and in this room that comes out
     * unusually well because the props were written for a yard before there was
     * one. `BUILDERS.bunting` spans `openingWidth + 0.8` and `fairy-lights`
     * spans `openingWidth + 1.2`, so both runs are tied off within a handspan
     * of the tower centrelines — which is where somebody standing in a yard
     * with a roll of festoon cable would tie them, and neither prop knows this
     * file exists.
     */
    openingWidth: d.width,
    openingHeight,
    /**
     * Where a cloth would be if there were one, and there is not.
     *
     * Half a metre in from the lip, which is `circuit.ts`'s number for the same
     * reason: `stage-props.ts` hangs the `truss` downstage run at
     * `curtainZ - 1.1` and the two festoon runs at `curtainZ - 0.35` and
     * `curtainZ - 0.15`, so this is "the line across the front of the room"
     * rather than a track, and it has to sit where a line across the front of
     * the room would.
     */
    curtainZ: d.lipZ - 0.5,
    /**
     * Where the bar trims, and **this is the field an outdoor room has to earn
     * rather than answer.**
     *
     * There is no fly tower, no roof, no soffit and no beam. `RoomRig.flyBar`
     * is explicit that a bare group at a height nothing reaches is the one
     * thing not allowed, because `lights.ts` does `stage.flyBar.add(rig)` and
     * hangs every par, every wire and the warm lamp off it without ever
     * branching — so if there is nothing there, a dozen fixtures hang in the
     * air. In a cellar the answer was a soffit; in a barn it was a purlin; in a
     * courtyard it was a wire strung wall to wall. Here there is nothing to
     * strand a wire between and nothing overhead at all, so the answer is that
     * **the room builds the thing to hang from**: two scaffold towers on base
     * plates standing on the dirt beside the deck, and a bar clamped across
     * them. It is not dressing and it is not a prop — it is the only structure
     * in this room that is not the ground or the fence, and without it the
     * genre cannot be lit.
     *
     * The height is `TOWER_HEAD_CLEAR` below the tower head rather than a
     * fraction of the opening, because a clamp needs tower above it. **The
     * check `circuit.ts` prescribes was run and this room passes it with room
     * to spare, which is worth writing down because the arithmetic is not
     * obvious.** That file moved its bar from `openingHeight - 0.35` to
     * `openingHeight * 0.74` after finding its rig above the top of every frame
     * the show composes. Solving the same way here: the wide shot's distance is
     * set by `lipDistance` on any window from 16:9 up, which puts the lens
     * 10.7 m out and 3.48 m up, tilted 10.7° down onto `WIDE_AIM_Y`; with a 42°
     * vertical field the top edge of frame passes through **4.82 m** at the
     * towers' own z. The bar lands at 3.45 m and the tower head at 4.40 m in
     * 1963 and at 3.69 m and 4.64 m in 1985, so in every era both are inside
     * the frame with between 0.18 m and 0.42 m of sky above the scaffold —
     * which is the picture this room wants, since in a yard the rig *is* the
     * skyline.
     *
     * **The horizontal is a different answer, and it was found by looking
     * rather than by arithmetic.** The towers stand 6.06 m either side of
     * centre and only 6.9 m from that lens, so they are magnified nearly twice
     * as hard as the zinc behind the band and fall outside a 16:9 frame by
     * about a quarter of its width. What the house shot actually shows is a bar
     * crossing the top of the picture and running out of it at both ends, with
     * the goal-post arriving as soon as the window goes past about 2:1 or the
     * viewer swings the camera round the side.
     *
     * That is a compromise rather than a success, so the alternative is written
     * down along with why it lost. `lights.ts` aims every par at
     * `flyBar.z - 1.9`, which is how a bar over a stage is focused — the lamps
     * light what is nearly two metres upstage of them. Pulling the towers back
     * far enough to clip a 16:9 frame needs `z <= 0.4`, and at that trim the
     * pars aim at `z = -1.5`, which on a 6.5 m stage is the backline: the whole
     * rig would be pointed at the zinc with the front line lit only from the
     * house. There is no z that satisfies both, the band has to be lit, and a
     * rig you can see but that lights nothing is a worse room than a rig that
     * is doing its job just outside the edge of one aspect ratio.
     *
     * It clears the band by 1.05 m either way: `HEAD_BAND.hi` is 2.4 m, drum
     * riser included.
     */
    flyY: openingHeight - TOWER_HEAD_CLEAR,
    /**
     * Open sky, over the boards and over the house alike.
     *
     * Not a cop-out and not even a close call — `circuit.ts` has to argue this
     * one because it has ten metres of steel roof over its stage and is
     * publishing `Infinity` anyway. Here there is genuinely nothing: the
     * towers are at the sides, the bar is a 0.11 m pipe, and above that is the
     * night. Every consumer of these two fields wants a `Math.min` and gets the
     * right answer for free — the camera keeps `LENS_GAP` under a ceiling that
     * is not there, `BUILDERS.truss` takes its no-lid branch and hangs off
     * `flyY` where the rig actually is, and `chandelier` is not in this genre's
     * vocabulary at all.
     */
    headroom: Infinity,
    houseLid: Infinity,
    /**
     * And nothing to shackle to either, which is the third field the paragraph
     * above answers rather than a fourth argument.
     *
     * `rigLid` splits from `headroom` in a room where the lowest thing overhead
     * is a member with a surface behind it. Here neither exists. The only thing
     * a ray fired up from the truss's pick can find in this room is the sky
     * dome at 46.7 m, which is a painted hemisphere and not steel — publishing
     * it would run a 42 m motor drop into a backdrop. `truss` takes its open-sky
     * clause instead and stands the lattice on legs, which is what a rig in a
     * field stands on.
     */
    rigLid: Infinity,
    backdropHeight: BACKDROP_H,
    /**
     * The fence, not a wall — and it is a surface all the same, which is what
     * this field is asked about. See `halfX` in `build`: a yard is exactly as
     * big as the fence somebody put round it.
     */
    wallX: d.houseWidth / 2 + 0.6,
  };
}

/** One straight run of zinc: a line on the ground and a height to stand it at. */
interface Run {
  along: 'x' | 'z';
  /** The other coordinate — z for an `x` run, x for a `z` run. */
  at: number;
  from: number;
  to: number;
  height: number;
}

/** One length of scaffold tube, end to end. */
interface Member {
  a: Vector3;
  b: Vector3;
  r: number;
}

function build(c: RoomContext): RoomRig {
  const p = c.venue.palette;
  const m = c.m;
  const rise = -m.houseY;

  const root = new Group();
  root.name = `room:${c.venue.id}`;

  /**
   * The yard, as four numbers.
   *
   * The sides take the minimum a room is allowed — `houseWidth / 2 + 0.6`, the
   * same handspan outside the last person in each row that `proscenium.ts`
   * takes — and they take it deliberately rather than by default. `circuit.ts`
   * spends 3.5 m here to say *this crowd is not the edge of the building*,
   * which is the truth about an arena and a lie about a lawn: a yard is exactly
   * as big as the fence somebody put round it, and the reason a dance was
   * heaving is that the fence was close. Downstage it is the same minimum,
   * 1.6 m behind the last row, which also puts it 2.4 m behind where
   * `BUILDERS.bar` stands the counter at `lipZ + houseDepth - 0.8` — so the bar
   * has a back to it rather than floating in a field.
   */
  const halfX = m.houseWidth / 2 + 0.6;
  const yardBackZ = m.lipZ + m.houseDepth + 1.6;
  const yardFrontZ = m.backZ - YARD_UPSTAGE;

  // --- the ground ----------------------------------------------------------
  /**
   * Dirt, and it is the floor of this room in the strict sense: **there are no
   * boards under the audience anywhere.**
   *
   * That is the sentence the whole room is built to make good on. A proscenium
   * lays planks, a courtyard lays flags, a circuit pours a slab, a riihi has a
   * threshing floor — all four are *laid*, by somebody, as part of a building.
   * This one is what was there before anybody arrived. The genre puts a
   * `dance-floor` prop on top of it in all four eras, which is right and is
   * also the only laid surface in the yard: somebody carried a floor in for the
   * dancing and the rest of the ground is ground.
   *
   * Same `cellPlane` trick and the same `housefloor` stream as every other
   * floor in this directory, so the rooms stay comparable seed for seed, with
   * two differences that are the whole of dirt versus paving. The cells are
   * roughly square and about 0.85 m across, so nothing in them has a direction
   * — a plank reads by being long and a flagstone by being as wide as it is
   * deep, and ground reads by being neither. And the jitter is **0.18**, the
   * highest of any surface in the project against the proscenium's 0.10 and the
   * courtyard's 0.13, because that is the difference between a surface that was
   * laid to a tolerance and one that was rained on: worn patches where the
   * dancing is, darker where it is not, and no two square metres alike.
   *
   * The colour is the palette's night pulled toward its own boards. `backdrop`
   * in this genre is a very dark green in three eras out of four — `#0f2418` in
   * `roots` — and `boards` is a tan, so blending them gives an unlit warm earth
   * with the green still in it, which is what ground under a warm lamp at
   * midnight is. Taking `boards` alone would have made the yard the colour of
   * the deck standing on it, which is the flat-field failure `circuit.ts` names
   * about its slab.
   *
   * It receives, because it is the large flat surface under the band and that
   * is what a shadow lands on.
   */
  const groundW = halfX * 2 + GROUND_OUT * 2;
  const groundD = (yardBackZ - yardFrontZ) + GROUND_OUT * 2;
  const ground = new Mesh(
    c.kit.own(cellPlane({
      width: groundW, height: groundD,
      cols: Math.max(8, Math.round(groundW / 0.85)),
      rows: Math.max(8, Math.round(groundD / 0.85)),
      colour: shade(blend(p.backdrop, p.boards, 0.42), 0.32),
      jitter: 0.18, rng: c.rng('housefloor'),
    })),
    c.kit.solid('#ffffff', { vertexColors: true, rough: 0.97 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, m.houseY, (yardFrontZ + yardBackZ) / 2);
  ground.receiveShadow = true;
  root.add(ground);

  // --- the night -----------------------------------------------------------
  /**
   * Warm dark rather than cold dark, and it costs one sphere and no new
   * arithmetic.
   *
   * `skyDome` is `proscenium.ts`'s and is shared rather than copied for the
   * reason it states: two hand-tuned three-band gradients drift apart on the
   * first palette change. What is worth saying here is how well the shared
   * arithmetic pays out on *this* palette, because it is not obvious that a
   * gradient written for a Finnish July would suit Kingston at midnight. It
   * does, and by accident of the genre having chosen honestly: the zenith is
   * `shade(backdrop, 0.4)`, and reggae's backdrop is a near-black green, so the
   * top of the sky is the colour of vegetation with no light on it. The horizon
   * band is `tint(hueShift(ambient, -8, 0.05), 0.12)`, and this genre's
   * `ambient` is `#ffc27a` in `roots` — so the bottom of the sky is a warm
   * sodium glow all the way round, which is a town over the fence with its
   * lights on. That is the exact difference between this and `circuit.ts`,
   * which is a large anonymous black volume by design: a lawn at night is dark
   * with a *sky* in it, and the sky has a horizon and the horizon is warm.
   *
   * The radius has to contain everything this room draws, because the dome
   * writes no depth and draws first, so anything outside it paints over the sky
   * instead of being hidden by it. The furthest corner of the ground plane is
   * about 28 m from the origin in the largest era; 48 m clears it comfortably
   * and stays well inside the camera's 120 m far plane. Bigger than the
   * courtyard's 40 m because this room's ground runs `GROUND_OUT` past its own
   * fence rather than stopping at a wall, and much smaller than the pavilion's
   * 90 m because there is no lake.
   */
  root.add(skyDome(c, 48));

  // --- the zinc ------------------------------------------------------------
  /**
   * The fence round the yard and the backing behind the band, which are one
   * material, one draw call and two heights.
   *
   * **Why the stripes are right here and were wrong in the barn.** `riihi.ts`
   * refuses to draw its log wall as a striped plane and the refusal is well
   * argued: the thing the eye reads a log wall by is the shadow line where one
   * *round* course meets the next, so a `cellPlane` of horizontal bands gives
   * the stripes with none of the roundness — "it is a barcode, and it looks like
   * one". Corrugated zinc is the case where that sentence turns into a
   * recommendation. A sheet of it genuinely is flat metal folded into a regular
   * repeat, its entire visual signature at twenty metres is a run of vertical
   * light and dark bands, and a barcode is exactly what it looks like. So this
   * is built the way the barn would not be: one instance per **flute**,
   * alternating bright and dark so the ridges catch and the valleys do not,
   * with the venue's own stream jittering both.
   *
   * They are boxes rather than a plane because the fence has to have a top
   * edge with a thickness on it, and because the sheets are not all the same
   * height. Each sheet gets its own height off `rng`, which gives the ragged
   * top line that is the one silhouette a zinc fence has and a masonry wall
   * never does — the courtyard's wall heads are dead level, because somebody
   * laid them to a string. Nobody laid this to anything.
   *
   * `BoxGeometry` rather than the house `bevelBox`, and `circuit.ts` wrote the
   * argument this borrows: a bevel earns its triangles when it catches a
   * highlight along an edge, and a 0.10 m section seen from eight metres in the
   * dark has no edge to catch anything on. Five runs — four sides of the yard
   * and the backing behind the band — in one `InstancedMesh`, because six
   * hundred sheets of zinc is six hundred draw calls otherwise and is one this
   * way.
   *
   * It receives and does not cast. It is the large flat surface behind the band
   * and behind the house, which is the receiving case exactly; and a 0.05 m
   * sheet's cast shadow is the black line the shadow policy names.
   */
  const zincRng = c.rng('walls');
  const runs: Run[] = [
    { along: 'z', at: -halfX, from: yardFrontZ, to: yardBackZ, height: FENCE_H },
    { along: 'z', at: halfX, from: yardFrontZ, to: yardBackZ, height: FENCE_H },
    { along: 'x', at: yardBackZ, from: -halfX, to: halfX, height: FENCE_H },
    { along: 'x', at: yardFrontZ, from: -halfX, to: halfX, height: FENCE_H },
    /**
     * The backing, and it stands 0.1 m upstage of the boards for the reason
     * every backdrop in this directory does: anything standing on the back of
     * the deck would otherwise be inside it. Wider than the stage by
     * `BACKDROP_SPREAD` so it reads as a run of sheet somebody put up rather
     * than as a panel exactly the size of the band, and narrow enough that the
     * fence behind it still shows past both ends — which is what says these are
     * two different things.
     */
    {
      along: 'x', at: m.backZ - 0.1,
      from: -m.width * BACKDROP_SPREAD / 2, to: m.width * BACKDROP_SPREAD / 2,
      height: BACKDROP_H,
    },
  ];

  const plan = runs.map((run) => {
    const span = Math.abs(run.to - run.from);
    const sheets = Math.max(1, Math.round(span / SHEET_W));
    return { run, span, sheets };
  });
  const fluteCount = plan.reduce((sum, r) => sum + r.sheets * FLUTES, 0);
  /**
   * How many instances each mesh needs, and only the second one is hard.
   *
   * `fluteCount` is exact by construction — the loop writes `FLUTES` instances
   * per sheet and nothing else, so summing `sheets * FLUTES` is the same
   * traversal written twice, and it has never been wrong.
   *
   * `postCount` was, and the correction is worth stating rather than quietly
   * applying. The loop stands a post at every `s` in `[0, sheets)` satisfying
   * `s % POST_EVERY === 0`, plus one at the far end of the run. The number of
   * such `s` is `Math.ceil(sheets / POST_EVERY)`; this line said `Math.floor`,
   * and **the two are the same number only when the sheet count divides by
   * three**, so a `floor` is short by exactly one on two runs out of every
   * three. Nothing in this file gets to arrange which: no sheet count is
   * chosen, each falls out of `Math.round(span / SHEET_W)` on a span the room
   * hands over, and the five spans are four yard sides and a backing width.
   *
   * What it cost is worth writing down too, because it is not the harm you
   * would guess from "the buffer is one short". `si` runs on across all five
   * runs in order, so the indices that fall off the end are always the *last*
   * ones written, and the last run in `runs` is the backing behind the band —
   * the one piece of zinc dead centre in every wide shot. In `ska` five of its
   * seven posts went (two in `digital`, three in `roots`), leaving post heads
   * along the stage-right third and a bald top edge across the rest, on the
   * object at `BACKDROP_H` whose posts stand `POST_PROUD` proud against the
   * night sky. And they did not merely go missing: `setMatrixAt` past the end
   * of a `Float32Array` is silently dropped, then `posts.count = si` below told
   * three to draw them anyway, so `computeBoundingBox` read sixteen
   * `undefined`s per tail instance and produced an all-NaN box, and the draw
   * fetched instance attributes past the end of the buffer.
   *
   * Two other fixes were available and both are worse. `posts.count =
   * Math.min(si, postCount)` silences the NaN and keeps the bug — it drops the
   * same posts on purpose instead of by accident. Counting by running the
   * placement loop twice would also work and buys nothing over a closed form
   * that is exact for every `sheets >= 1`, which the `Math.max(1, ...)` above
   * guarantees. Exact rather than merely sufficient is the point: it makes
   * `posts.count = si` below an assertion instead of a correction, and it holds
   * for any span, so a sixth run added to `runs` is allocated right without
   * anybody rechecking this line.
   */
  const postCount = plan.reduce((sum, r) => sum + Math.ceil(r.sheets / POST_EVERY) + 1, 0);

  /**
   * Weathered galvanised sheet, and the era picks how weathered.
   *
   * Every colour in this directory is a function of `Venue.palette` and this is
   * the one place where obeying that rule pays a dividend rather than costing
   * one. `proscenium` is the palette's own trim colour and this genre moves it
   * a long way across the four eras — a warm cream in 1963, gold in 1975, a
   * cold blue-grey in 1985 — so blending it toward the night and darkening it
   * gives rusted brown zinc in the middle decades and something much nearer
   * actual galvanising in the last, out of one expression. A hardcoded grey
   * would have been the same fence in every era of a genre whose whole staging
   * argument is that the yard changed colour and not shape.
   */
  const zincBase = shade(blend(p.proscenium, p.backdrop, 0.42), 0.3);
  const zinc = new InstancedMesh(
    c.kit.geometry('zinc-flute', () => new BoxGeometry(1, 1, 1)),
    c.kit.solid(zincBase, { rough: 0.72, metal: 0.25 }),
    fluteCount,
  );
  /**
   * Timber, and the posts are the only part of the fence with a shadow.
   *
   * A fence post is a chunky solid standing on a floor, which is the casting
   * case in the shadow policy word for word, and it is the object that makes a
   * run of sheet read as a fence rather than as a hoarding: the sheets are
   * nailed to something, and every third joint is where. Standing `POST_PROUD`
   * above the zinc because a post is always longer than the sheet on it.
   */
  const posts = new InstancedMesh(
    c.kit.geometry('fence-post', () => new BoxGeometry(0.09, 1, 0.09)),
    c.kit.solid(shade(blend(p.boards, p.backdrop, 0.62), 0.42), { rough: 0.95 }),
    postCount,
  );

  const dummy = new Object3D();
  const tone = new Color();
  let fi = 0;
  let si = 0;
  for (const { run, span, sheets } of plan) {
    const dir = Math.sign(run.to - run.from) || 1;
    const sheetW = span / sheets;
    const fluteW = sheetW / FLUTES;
    for (let s = 0; s < sheets; s++) {
      // One height per sheet, so the top line steps rather than ripples.
      const h = run.height * (1 + zincRng.float(-0.035, 0.035));
      for (let f = 0; f < FLUTES; f++) {
        const along = run.from + dir * (s * sheetW + (f + 0.5) * fluteW);
        dummy.position.set(
          run.along === 'z' ? run.at : along,
          m.houseY + h / 2,
          run.along === 'z' ? along : run.at,
        );
        dummy.rotation.set(0, run.along === 'z' ? Math.PI / 2 : 0, 0);
        dummy.scale.set(fluteW, h, 0.05);
        dummy.updateMatrix();
        zinc.setMatrixAt(fi, dummy.matrix);
        // The ridge takes the light and the valley does not; the jitter on top
        // of that is one sheet against the next having stood out for a
        // different number of years.
        const k = (f % 2 === 0 ? 1.18 : 0.82) * (1 + zincRng.float(-0.09, 0.09));
        zinc.setColorAt(fi, tone.setScalar(k));
        fi++;
      }
      if (s % POST_EVERY === 0) {
        const at = run.from + dir * s * sheetW;
        const ph = run.height + POST_PROUD;
        dummy.position.set(
          run.along === 'z' ? run.at - 0.06 : at,
          m.houseY + ph / 2,
          run.along === 'z' ? at : run.at - 0.06,
        );
        dummy.rotation.set(0, run.along === 'z' ? Math.PI / 2 : 0, 0);
        dummy.scale.set(1, ph, 1);
        dummy.updateMatrix();
        posts.setMatrixAt(si++, dummy.matrix);
      }
    }
    // The far end of every run gets a post, or the last sheet is nailed to air.
    const ph = run.height + POST_PROUD;
    dummy.position.set(
      run.along === 'z' ? run.at - 0.06 : run.to,
      m.houseY + ph / 2,
      run.along === 'z' ? run.to : run.at - 0.06,
    );
    dummy.rotation.set(0, run.along === 'z' ? Math.PI / 2 : 0, 0);
    dummy.scale.set(1, ph, 1);
    dummy.updateMatrix();
    posts.setMatrixAt(si++, dummy.matrix);
  }
  zinc.count = fi;
  posts.count = si;
  zinc.receiveShadow = true;
  posts.castShadow = true;
  root.add(zinc);
  root.add(posts);

  // --- what the lamps are bolted to ----------------------------------------
  /**
   * Two towers and a bar, standing on the ground, and this is the piece of this
   * room that had to be invented rather than observed.
   *
   * Every other room in the directory found its fly bar attached to something
   * that was already there for another reason — a fly floor, a soffit, a roof
   * purlin, a courtyard wall, an arena's structural steel. An open field has
   * none of those, and the honest consequence is not that the rig hangs from
   * nothing, it is that **the rig has to hold itself up**, which is what a
   * ground-support tower is and why every festival photograph has two of them
   * in it. So the tower is architecture in this room in a way it would be
   * scenery in any other: take it away and there is no building left that a
   * lamp could be fixed to, and `lights.ts` — which is written to know nothing
   * about which room it is lighting — would put a dozen fixtures in mid-air.
   *
   * Built as tube rather than box, which is `riihi.ts`'s argument about log
   * walls transplanted: a scaffold standard is round, the thing the eye reads a
   * scaffold by is the way the light runs round the tube and stops, and a
   * six-sided cylinder gives that for twelve triangles. One `InstancedMesh` for
   * both towers, oriented member by member from a list of end points, so legs,
   * ledgers and diagonals are one draw call and adding a brace costs a line.
   *
   * They cast. A tower is the chunkiest solid standing on the ground in this
   * room, it is inside the shadow camera's reach — `lights.ts` sets that to
   * `max(width, depth) / 2 + 4`, about 9.8 m, and the towers are 5.9 m out —
   * and the shadow of a scaffold lying across the dirt beside a stage is a
   * thing worth having. They do not receive; a 0.06 m tube's shadow map lookup
   * buys nothing.
   */
  const barZ = m.curtainZ - BAR_UPSTAGE;
  const headY = m.openingHeight;
  const towerH = headY - m.houseY;
  const lifts = Math.max(3, Math.round(towerH / 1.05));
  const members: Member[] = [];
  for (const side of [-1, 1]) {
    const x0 = side * (m.width / 2 + TOWER_HALF);
    const corners: [number, number][] = [
      [-TOWER_HALF, -TOWER_HALF], [TOWER_HALF, -TOWER_HALF],
      [TOWER_HALF, TOWER_HALF], [-TOWER_HALF, TOWER_HALF],
    ];
    for (const [dx, dz] of corners) {
      members.push({
        a: new Vector3(x0 + dx, m.houseY, barZ + dz),
        b: new Vector3(x0 + dx, headY, barZ + dz),
        r: 0.031,
      });
    }
    for (let k = 1; k <= lifts; k++) {
      const y = m.houseY + (towerH * k) / lifts;
      for (let i = 0; i < 4; i++) {
        const [ax, az] = corners[i]!;
        const [bx, bz] = corners[(i + 1) % 4]!;
        members.push({
          a: new Vector3(x0 + ax, y, barZ + az),
          b: new Vector3(x0 + bx, y, barZ + bz),
          r: 0.026,
        });
      }
      /**
       * One diagonal per lift on the outboard face, alternating, which is how
       * a tower is actually braced and is also the only part of it the audience
       * ever sees against the sky. Braced on the outboard face rather than the
       * inboard one so the zigzag is outside the aperture rather than crossing
       * the band.
       */
      const face = side * TOWER_HALF;
      const yLo = m.houseY + (towerH * (k - 1)) / lifts;
      const yHi = m.houseY + (towerH * k) / lifts;
      const swap = k % 2 === 0;
      members.push({
        a: new Vector3(x0 + face, swap ? yLo : yHi, barZ - TOWER_HALF),
        b: new Vector3(x0 + face, swap ? yHi : yLo, barZ + TOWER_HALF),
        r: 0.022,
      });
    }
  }

  const steel = c.kit.solid(shade(tint(p.proscenium, 0.18), 0.55), { metal: 0.55, rough: 0.5 });
  const scaffold = new InstancedMesh(
    c.kit.geometry('scaffold-tube', () => new CylinderGeometry(0.5, 0.5, 1, 6)),
    steel, members.length,
  );
  orient(scaffold, members, dummy);
  scaffold.castShadow = true;
  root.add(scaffold);

  /**
   * The bar, and it is the whole of `flyBar`.
   *
   * It spans tower centreline to tower centreline — `openingWidth + TOWER_HALF
   * * 2` — so both ends die into a standard rather than stopping in the air,
   * which is the difference between a bar that is clamped to something and a
   * bar that is floating between two things. `lights.ts` lays its pars along
   * this group's local x out to `openingWidth / 2 - 0.8`, comfortably inboard
   * of the legs, and hangs its wires downward from them; none of that needs to
   * know it is on scaffold rather than on a pipe in a fly tower, which is the
   * entire point of the contract.
   *
   * Straight, not sagging, for the reason `courtyard.ts` gives about its wire:
   * the fixtures are parented at `y = 0` in this group's frame, so a bar that
   * dipped in the middle would have its lamps hanging in the air above it.
   * A scaffold bar does not sag anyway.
   */
  const flyBar = new Group();
  flyBar.name = 'fly-bar';
  flyBar.position.set(0, m.flyY, barZ);
  const bar = new Mesh(
    c.kit.bevelBox(m.openingWidth + TOWER_HALF * 2, 0.11, 0.11, 0.05),
    steel,
  );
  flyBar.add(bar);
  root.add(flyBar);

  /**
   * No cloth, and in this room the 0.2 s that costs is not a compromise
   * either — but for the opposite reason to `circuit.ts`'s.
   *
   * `noCurtain()` reports the cloth as being exactly where the show asked for
   * it, on the same frame, so `show.ts` never stalls waiting for travel that
   * will not happen and the band is still hidden while it is being staged,
   * which is what the invisibility was ever for. What is left is the gap
   * `courtyard.ts` flagged as a real if defensible pop: `show.ts` spends
   * `CURTAIN_AT` in the `curtain` state before it calls `setCurtain(1)`, with
   * `setMaster(0)` still standing from the state before, so the house sees a
   * fifth of a second of stage lit only by `HOUSE_FLOOR` at 0.10 and then the
   * band and the light coming up together over `STAGE_UP_SECONDS`.
   *
   * `circuit.ts` argues that beat of black *is* the reveal, because a rock show
   * starts with the house going out. This room's claim is different and needs
   * saying, because the two rooms would otherwise look like the same decision
   * copied. **A dance was already happening.** The sound system has been
   * playing for three hours, the yard is full, the crowd is not waiting for a
   * curtain and did not come for one — the band walking up onto the deck and
   * the lamps coming up on them is an *interruption* of an evening that was
   * already going, not the start of one. A fifth of a second of empty lit
   * ground before that is the truest frame in the sequence. A gathering cloth
   * here would be the theatre this genre spent twenty years not being in.
   */
  const curtain = noCurtain();
  root.add(curtain.root);

  return { root, flyBar, curtain };
}

/**
 * Point a unit cylinder along each of a list of segments.
 *
 * A tube is a length between two points, and `InstancedMesh` wants a matrix, so
 * something has to do this conversion; doing it once here rather than inline
 * per member is what keeps the tower's own loop a description of a scaffold
 * rather than a page of quaternion arithmetic. The geometry is
 * `CylinderGeometry(0.5, 0.5, 1)` — a unit tube along +y — so the scale is
 * `(2r, length, 2r)`, which is uniform in x and z: that matters, because
 * `InstancedMesh` transforms normals by the instance matrix without
 * inverse-transposing it, and a tube scaled unevenly across its section would
 * be lit as if it were a different shape than it is drawn.
 */
function orient(mesh: InstancedMesh, members: Member[], dummy: Object3D): void {
  const up = new Vector3(0, 1, 0);
  const dir = new Vector3();
  for (let i = 0; i < members.length; i++) {
    const { a, b, r } = members[i]!;
    dir.subVectors(b, a);
    const len = Math.max(1e-4, dir.length());
    dummy.position.copy(a).add(b).multiplyScalar(0.5);
    dummy.quaternion.setFromUnitVectors(up, dir.divideScalar(len));
    dummy.scale.set(r * 2, len, r * 2);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
}

export const lawn: RoomBuilder = { shape, build };
