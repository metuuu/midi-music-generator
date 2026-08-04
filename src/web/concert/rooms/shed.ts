/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The shed — a portal-framed industrial hall with a band at one end of it.
 *
 * `metal/staging.ts` calls the room THE SHED in capitals and then spends its
 * header describing a building that is *fighting its own roof*: "a shed with a
 * low ceiling and too much sound in it, and the fixtures across four decades are
 * a record of the building slowly losing that fight". That is a sentence about
 * a structure, not about paint, and there was no room in the catalogue that
 * could draw it. A works, a bus depot, a drill hall, a marquee with a floor
 * poured under it: what those have in common is not a look, it is that **the
 * building is not hiding anything.** The frame that holds the roof up is in the
 * room with you, the walls are the outside of the building seen from inside,
 * and every surface in it was chosen because it was cheap and would last.
 *
 * ## Written against `circuit.ts`, on purpose, line by line
 *
 * The arena next door is the closest thing in this directory and the one this
 * room must not become. Its header is explicit that it "builds less architecture
 * than any of its siblings" and that the hall is "large, dark, and deliberately
 * illegible", because a touring band's four nights in four towns are recognisably
 * one band precisely when the building says nothing. Two dark anonymous rooms
 * is the exact failure the room seam exists to prevent, so every one of those
 * decisions is taken the other way here and it is worth listing which:
 *
 *  - **The deck.** Circuit's is the tallest rise in the project — 1.42 m of
 *    scaffold so nine thousand people can see over eight rows. This one is
 *    0.65 m and does not change between eras. See `SHED_RISE`.
 *  - **The walls.** Circuit's stand 3.5 m outside the last person in each row
 *    and are `backdrop` darkened by two thirds so that what paints them is the
 *    fog. These take the minimum `rooms/types.ts` allows, 0.6 m, and they are
 *    built in two materials you are meant to be able to name — blockwork to
 *    shoulder height and profiled steel sheet above it.
 *  - **What is overhead.** Circuit hangs a flat girder deck 10.5 m up, and
 *    nothing holds it up: there is no column anywhere in that room, which is
 *    right, because an arena roof arrives at the top of the frame already
 *    supported by a building you are not being shown. Here the whole load path
 *    is visible and is the point — column, haunch, rafter, purlin, sheet, and
 *    you can follow it to the floor.
 *  - **The backdrop.** Circuit hangs a black cloth, because everything in that
 *    room came off a truck. Here the thing behind the band is the *end wall of
 *    the building*, with the goods shutter in it, because nothing in this room
 *    came off a truck except the band.
 *  - **`brick`.** Circuit refuses it — "a wall you are meant to read is the one
 *    thing a deliberately anonymous hall cannot have". This room answers it,
 *    and answering it is the same sentence with the sign flipped.
 *
 * The one place the two agree is `noCurtain()`, and they agree for different
 * reasons; see the bottom of `build`.
 *
 * ## And against `riihi.ts`, which is the other room with a pitched roof
 *
 * `./index.ts` says out loud that "a `riihi` and a `shed` are one long roof",
 * so the risk of collapsing into the barn is real and it is answered by pitch
 * and by structure. The barn holds its *ridge height* fixed at 3 m and lets the
 * angle fall out of the span, which is what a carpenter does. A portal frame is
 * a stock section rolled to a stock **pitch** and repeated down the length of
 * the building, so this holds the angle — 9° — and lets the ridge fall out.
 * Over the same 17 m span that is a roof a quarter as deep, and a shallow roof
 * reads as *engineered* where a steep one reads as *built*.
 *
 * The bigger difference is that the barn deliberately has no rafters in it. It
 * publishes a roof soffit and lets the `beams` prop put the timber up there,
 * on the argument that a rafter is a timber and the prop is already drawing
 * timber. This room cannot make that trade, because in a shed the frame *is*
 * the architecture: take the portals out and what is left is a rectangle with
 * a sloping lid, which is a warehouse in a video game. So the frames, the
 * purlins and the sheeting are all here, and what the props add sits under
 * them — see the note on `headroom`, where the arithmetic that makes `truss`
 * land against this roof rather than through it is written down.
 *
 * ## What this file does not draw, and metal names a lot of it
 *
 * `riser` and `backline` are genre-wide and `truss`, `screen`, `pa-stack`,
 * `wedges`, `crowd-barrier`, `flight-case`, `drapes`, `posters`, `neon`, `bar`,
 * `railing`, `rug`, `beams` and `mirror-ball` come and go by era. Every one of
 * them belongs to `stage-props.ts`, which places them for every room at once,
 * so a shed that drew its own backline would draw two walls of amplifiers a few
 * centimetres apart. What is left over after that list is exactly the building:
 * the slab, the walls, the frame, the roof, the shutter, the duct, the stage's
 * side masking and the bar the lamps hang off.
 *
 * Two of those props are the reason the side masking exists at all rather than
 * being scenery for its own sake — `posters` hangs three sheets facing inward at
 * `±(openingWidth / 2 + 0.9)` and `neon` hangs its wing signs at
 * `±(openingWidth / 2 + 0.85)`, both of them assuming a proscenium's tormentor
 * is standing there. In a room with nothing at the sides they are three posters
 * and two lit signs floating in mid-air a metre and a half short of the wall,
 * in three of this genre's four eras. See `sideFlats`.
 *
 * ## The eras: two buildings, not four
 *
 * A room cannot see the era and should not be given a way to. What reaches this
 * file is the size, through `StageDressing.grow`, and the modifiers, through
 * `props` — and read that way metal's four decades are two rooms.
 *
 * `heavy` (1972), `thrash` (1988) and `extreme` (1995) are one building at three
 * sizes. The stage goes from 12 m to 13.4 m and the hall follows it, and the
 * roof rides it out: `houseWidth` is `width + 4` and the walls stand `WALL_OUT`
 * outside that, so the wall is *always* 2.6 m outboard of the edge of the boards
 * and the rafter soffit over the band comes out at 4.77 m in all three. The
 * ridge is the only thing that moves, by 11 cm, over a hall that got 1.4 m
 * wider. That is what a real building does. The two `haze` eras change the air
 * and not the architecture — `stage.ts` reads that prop directly off the venue
 * and there is nothing for a room to add.
 *
 * `nwobhm` (1982) names `brick` **and** `low-ceiling`, and it genuinely is a
 * different building: the room has moved downstairs. `stage-props.ts` will draw
 * a limewashed lid at `houseY + LOW_CEILING` and a soffit at `STAGE_SOFFIT`
 * whatever this file publishes, and a steel roof 6.8 m up behind a plaster
 * ceiling 3.6 m up is two buildings with only one of them visible. So on that
 * era the frame, the purlins, the sheeting and the roof are not built at all —
 * geometry nothing can see is geometry nobody should pay for — the masonry runs
 * the full height and past the lid, and `backdropHeight` is measured to the
 * plaster rather than to a ridge that is not there.
 *
 * `black-box` and `open-air` are not answered and should not be. Painting out a
 * room whose entire claim is that you can read what it is made of leaves a
 * `circuit`, which is a file away; and a shed with the roof taken off is a yard,
 * which is a different building rather than a flag on this one.
 */

import {
  BufferGeometry, Color, CylinderGeometry, DoubleSide, Float32BufferAttribute,
  Group, InstancedMesh, Mesh, Object3D,
} from 'three';

import type { Rng } from '../../../core/rng.js';
import {
  blend, cellPlane, shade, tint, LOW_CEILING, STAGE_SOFFIT,
} from '../stage-kit.js';
import {
  noCurtain, type RoomBuilder, type RoomContext, type RoomDatum, type RoomRig,
  type RoomShape,
} from './types.js';

/**
 * How far the deck stands above the slab, and it is the same number in every
 * era of this genre.
 *
 * **0.6 m of stock leg with the deck's own 50 mm frame on top of it.** Touring
 * staging is hired by the bay and comes with legs in fixed lengths, so the
 * height of a stage in a room like this is not a fraction of anything — it is
 * whichever leg the local company owns, and 600 mm is the one they own. That is
 * the whole argument, and it is why this does not scale with `d.width` the way
 * `circuit.ts`'s `DECK_RATIO` does: an arena deck comes off a truck with the
 * show and is built to the show's size, and a shed's deck is in the shed.
 *
 * ## What it buys, measured, and it is bought against the arena
 *
 * `rise` sets `houseY`, and `houseY` sets the crowd. `crowdExtent` puts the top
 * of the tallest head in this ten-row standing house at `houseY + 2.27` — the
 * arena's eight rows come out at 2.17 and the two extra rows of rake are the
 * whole difference — so here the back row's crowns sit **1.62 m above the
 * boards**, across a standing guitarist's chest, where circuit's 1.42 m deck
 * puts them at 0.75 m, under the knee. Those are two photographs of two
 * different evenings and
 * the difference is the entire brief: `metal/staging.ts` asks for `rows: 10` at
 * `density: 0.94`, the densest crowd in the project, on the argument that this
 * is a house "full of people facing the same direction and pressed forward".
 * A crowd like that belongs *on top of* the band. Lift the deck and it becomes
 * a dark field below a lit shelf, which is the arena and is a room away.
 *
 * The cost is real and is the same one `proscenium.ts` names for its cellar and
 * `riihi.ts` names for its plank: from a low camera in the house there are heads
 * between the lens and the band. Neither of those files calls that a defect and
 * neither does this one. It is what standing in the room is like, and it is the
 * reason to get there early.
 *
 * It does not drop in the cellar era, and that is a claim rather than an
 * oversight. `proscenium.ts` takes its stage down to 0.4 m under a lid and
 * `circuit.ts` to 0.45 m, both of them buying headroom back from a deck that
 * was 0.9 m or 1.42 m to start with. There is nothing to buy here: at 0.65 m
 * the house lid lands at 2.95 m over the boards and the stage soffit at 2.85 m,
 * so `STAGE_SOFFIT` is already the binding constraint and taking the deck lower
 * would buy the camera nothing and cost the sightline a further 25 cm. The hired
 * deck is the hired deck in every decade.
 */
const SHED_RISE = 0.65;

/**
 * How far outside the house the walls stand, and it is the minimum
 * `rooms/types.ts` allows.
 *
 * Taken at the minimum deliberately and for the opposite reason `riihi.ts` takes
 * it: the barn wants a low roof and every centimetre further out is a centimetre
 * of span to climb over. This wants the walls *close*. A shed is a small
 * building with a lot of people in it, and the thing that separates it from the
 * hall in the next file is that you can reach the wall. `circuit.ts` spends
 * 3.5 m here so that what the camera finds past the audience is more dark floor;
 * spending 0.6 m means what the camera finds past the audience is sheeting, with
 * a column standing against it.
 */
const WALL_OUT = 0.6;

/**
 * The haunch — how high the rafter meets the column, above the house floor.
 *
 * This is the single number that decides whether the room is close, and it was
 * set from the camera rather than from taste. `camera.ts` lifts the wide shot's
 * lens to 3.6 m and `wideEye` keeps `LENS_GAP` under `headroom`, so anything
 * this room publishes below 4.2 m over the boards starts pulling the wide shot
 * down; and `headroom` here is the rafter soffit over the *edge of the boards*,
 * which is 2.6 m inboard of the haunch and therefore 0.42 m higher up the slope.
 * 5.0 m at the haunch lands the soffit at 4.77 m over the boards and leaves the
 * camera 0.57 m of margin it never uses.
 *
 * Everything else in the vocabulary then fits underneath it rather than through
 * it, which is the property worth having and is checked in `headroom` below.
 * It is also, for what it is worth, a real small industrial bay: 5 m to the
 * haunch over a 17 m span is a building you could get a lorry into and could not
 * get a gantry crane into, which is exactly the kind of works that ends up with
 * a stage in it.
 */
const HAUNCH = 5.0;

/**
 * The roof pitch, as a rise per metre of run. About 9°.
 *
 * Held constant while the ridge is allowed to move, which is the decision that
 * separates this roof from the barn's — see the header. A duopitch portal frame
 * is a stock detail and the pitch is part of the stock; the fabricator does not
 * re-derive it because the building got a metre wider. Anything under about 6°
 * stops shedding water and anything over about 15° stops being a shed, and 9°
 * sits in the middle of what actually gets built.
 *
 * At `halfX` 8.6 m that is 1.38 m of ridge over the haunch. `riihi.ts` puts 3 m
 * of ridge over a span of the same order, so the two roofs are visibly not each
 * other from the first frame, which is the only test that matters here.
 */
const PITCH = 0.16;

/** Depth of the rafter section. The lowest member, and what `headroom` is. */
const RAFTER = 0.34;
/** Depth of a purlin, sitting on top of the rafters with the sheet on it. */
const PURLIN = 0.13;
/** Rafter soffit to the underside of the sheeting. See `works`. */
const DECK = RAFTER + PURLIN;

/**
 * How far under the roof the lighting bar trims.
 *
 * Not a fraction of the picture — this room's whole claim is that everything is
 * bolted to the building, and what a bar is bolted to in a shed is the purlin
 * directly above it, with two lengths of tube and a pair of swivels. Left to
 * itself that argument would put the pipe a hand's breadth under the steel.
 *
 * It cannot go there, and the reason is a prop this file cannot see. `truss` is
 * named by two of the four eras and hangs at `headroom - 0.28` with a 0.34 m
 * section, so its bottom chord is at `headroom - 0.45` — and a room that hung
 * its own bar tight to the roof would have put every par in the rig *inside* the
 * lattice, in the two eras where the lattice is the thing the era is about.
 * 0.95 m of drop-arm puts the pipe 0.45 m clear under the truss's underside, so
 * the pars hang below the rig the way they do in the photograph, and in the two
 * eras with no truss it is simply a bar on short arms, which is what a small rig
 * in a shed is.
 */
const RIG_DROP = 0.95;

/** How high the blockwork runs before the sheeting takes over. Shoulder height. */
const DADO = 2.3;

/** The goods shutter. Wide enough to back a van up to, and no wider. */
const SHUTTER_W = 3.2;
const SHUTTER_H = 3.4;

/**
 * The building, solved once and read by both halves of the contract.
 *
 * `shape()` may not build and `build()` may not disagree with `shape()`, so the
 * arithmetic that decides how tall the shed is lives in neither of them —
 * `riihi.ts` hit the same wall and solved it the same way, because a room with
 * more than one height in it cannot recover them all from the finished metrics.
 * A shed has four: a haunch, a wall head, a ridge and a soffit over the band
 * that is none of the three.
 */
interface Works {
  /** Whether `stage-props.ts` is about to put a plaster lid on this room. */
  cellar: boolean;
  /** Whether the walls are masonry all the way up rather than sheeted. */
  masonry: boolean;
  /** x of the inner face of the side walls, and the half-span of the frame. */
  halfX: number;
  /** Rafter soffit at the column, above the house floor. `HAUNCH`, or the lid. */
  haunch: number;
  /** Top of the wall sheeting, above the house floor — the eaves line. */
  eaves: number;
  /** Underside of the sheeting at the ridge, above the house floor. */
  ridge: number;
  /**
   * The lowest the roof gets over the boards, **above the boards**.
   *
   * Not the haunch. The wall is 2.6 m outboard of the edge of the boards in
   * every era — `houseWidth` is `width + 4` and the wall stands `WALL_OUT`
   * outside that, so the two grow together and the gap never moves — and over
   * those 2.6 m the rafter has climbed 0.42 m. Publishing the haunch would cost
   * the camera and every hanging prop that 0.42 m for nothing, and would put
   * the `truss` prop's motor drops 42 cm short of the steel they are supposed
   * to be shackled to.
   */
  soffit: number;
}

function works(d: RoomDatum): Works {
  const cellar = d.props.has('low-ceiling');
  const halfX = d.houseWidth / 2 + WALL_OUT;
  /**
   * Boarded over, there is no frame and no roof, and the numbers say so rather
   * than describing steel behind plaster. The haunch becomes the lid and the
   * ridge becomes the lid, so every consumer of this struct lands on the one
   * surface that is actually drawn.
   */
  const haunch = cellar ? LOW_CEILING : HAUNCH;
  return {
    cellar,
    masonry: cellar || d.props.has('brick'),
    halfX,
    haunch,
    /**
     * Boarded over the walls have to run *past* the lid, not stop at it.
     * `stage-props.ts` spans the whole room with a `DoubleSide` plane at
     * `houseY + LOW_CEILING`, and a wall that stopped exactly there would show
     * a hairline of nothing where the two meet from any grazing angle — the
     * failure `riihi.ts` names when it adds three log courses for the same
     * reason. Half a metre of blockwork carries on behind the plaster.
     */
    eaves: cellar ? LOW_CEILING + 0.5 : HAUNCH + DECK,
    ridge: cellar ? LOW_CEILING : HAUNCH + PITCH * halfX + DECK,
    soffit: cellar
      ? STAGE_SOFFIT
      : HAUNCH + PITCH * (halfX - d.width / 2) - SHED_RISE,
  };
}

function shape(d: RoomDatum): RoomShape {
  const w = works(d);
  return {
    rise: SHED_RISE,
    /**
     * The deck, and nothing is masking it.
     *
     * There is no arch, no leg and no tormentor here, so a player standing on
     * the corner of the boards is seen from everywhere and the honest fraction
     * is 1.0. The hard rule in `RoomShape` — never narrower than
     * `width - 2 * MARGIN_SIDE`, because `cast.ts` clamps players to a hardcoded
     * `width/2 - 0.5` with no sight of this file — is satisfied with the whole
     * metre to spare.
     *
     * **It is deliberately not the clear span between the walls**, which is
     * 17.2 m against the deck's 12 m, and the temptation to say so was real: a
     * shed's stage is built across the end of the hall and the building is what
     * you see the band through. Everything hung reads this number. `lights.ts`
     * runs its pars to `openingWidth / 2 - 0.8`, `truss` spans
     * `openingWidth + 1.8` and the cyclorama glow is `openingWidth * 1.02` wide;
     * quoting the building would have put the outermost pars 7.8 m off centre
     * with nothing under them, a 19 m lattice in a 17 m room, and a wash of
     * light on 2.7 m of blockwork either side of the band. That is an arena rig
     * hung in a small hall. A shed's rig is hung over the band, and the band is
     * the deck.
     */
    openingWidth: d.width,
    /**
     * The bay — the air between the deck and the roof steel, which is what an
     * aperture is in a room with no arch in it.
     *
     * The same number as `headroom`, and they agree because in this room they
     * are the same fact: the picture is bounded above by the building, and the
     * building is 4.77 m up. `circuit.ts` deliberately splits the two — its
     * aperture is `width * 0.5` and its roof is twice that, because a follow
     * spot solved against 10.5 m of steel comes down on faces at 57° and lights
     * everybody from the hairline. There is no room for that split here and no
     * need for one: the follow spot lands at `houseLid - 0.3`, which is 4.47 m,
     * which is under the rafter and over the band.
     *
     * Under a lid it is `STAGE_SOFFIT` exactly, for the reason `circuit.ts`
     * states — a cellar's picture is bounded by its ceiling and by nothing else,
     * and saying so keeps the dressing under the plaster. `neon`, which the
     * 1982 era names, hangs its sign at `min(openingHeight - 0.5, …)`: 3.1 m and
     * through the soffit if this said what a proscenium says, 2.35 m and under
     * it when it says this.
     */
    openingHeight: w.soffit,
    /**
     * Where a cloth would be, and there is no cloth — but `stage-props.ts` hangs
     * the downstage truss run at `curtainZ - 1.1` and the era's drapes at
     * `curtainZ - 1.6`, so it still has to be the front of the room. Half a
     * metre in from the lip: far enough upstage that the rig is over the deck
     * rather than over the barrier, and far enough downstage that the front line
     * is lit from in front of itself.
     */
    curtainZ: d.lipZ - 0.5,
    /**
     * The bar, clamped to the purlin above it. See `RIG_DROP` for the 0.95 m,
     * which is bought against a lattice this file cannot see.
     *
     * Under a lid it is `proscenium.ts`'s cellar arithmetic unchanged, and it
     * has to be a branch rather than a `Math.min`: 0.95 m of drop-arm under a
     * 2.85 m soffit is a bar at 1.9 m, which is below `HANG_FLOOR` and through
     * the singer. Where there is no roof to hang from, a bar is a length of
     * scaffold on 130 mm arms a handspan under the plaster.
     */
    flyY: w.cellar ? STAGE_SOFFIT - 0.13 : w.soffit - RIG_DROP,
    /**
     * **Finite, and that is the whole difference between this roof and an
     * arena's.**
     *
     * `circuit.ts` publishes `Infinity` with 10.5 m of steel overhead and is
     * right to: `RoomShape` says this field is not a description of the ceiling
     * but an answer to "what is in your way", the camera tops out at 3.6 m and
     * the tallest prop reaches about 5 m, so a roof nobody can touch is honestly
     * no obstruction. Publish it there and `truss` flies to 10.25 m, five metres
     * above its own pars, reading as roof steel rather than as a rig.
     *
     * Here the opposite is true and the same test proves it. The rafter is at
     * 4.77 m over the boards, which is *inside* the volume the show uses:
     * `truss` lands at 4.49 m with its motor drops running from 4.66 m up past
     * the soffit at 4.77 m and dying into the steel — which is
     * `metal/staging.ts`'s own
     * sentence, "a lighting truss bolted to the roof beams", arriving without
     * anything in this file knowing the era. `beams`, which the 1972 era names,
     * hangs its ties at 4.55 m with purlins 0.23 m over them at 4.78 m, so the
     * timber lands in the plane of the roof rather than floating under it. And
     * the follow spot and the back light both clamp to this and stay under the
     * rafter instead of shining down through it.
     *
     * That is the case that shows the field is being used rather than dodged.
     * The arena says `Infinity` because nothing is in the way; the shed says
     * 4.77 because the building is.
     */
    headroom: w.soffit,
    /**
     * One roof and therefore one lid — there is no step at the stage line here
     * because there is no proscenium to step at, and the frame carries on over
     * the house exactly as it does over the band.
     *
     * It is the soffit over the *boards* rather than over the middle of the
     * house, which is a shade conservative: the ridge is 1.2 m higher and the
     * follow spot could have had it. Publishing the number the band stands under
     * is the version that cannot be wrong from a camera angle.
     */
    houseLid: w.cellar ? -SHED_RISE + LOW_CEILING : w.soffit,
    /**
     * The end wall behind the band, floor to ridge, measured from the slab
     * because it is a wall and walls are measured from the ground.
     *
     * `lights.ts` sizes the cyclorama glow off this at
     * `min(openingHeight * 1.06, backdropHeight - 0.1)`, and a backdrop shorter
     * than its own glow puts a hard-edged lit rectangle in the air above it,
     * attached to nothing — the tanssilava bug this field was added after. A
     * gable end is 6.85 m and the glow is 5.05 m, so the wall carries on past
     * the light on it in every direction, which is what a wall does.
     *
     * Boarded over it is the plaster line, because the gable is behind the
     * ceiling and a glow sized to a ridge nobody can see is the same bug read
     * from the other end.
     */
    backdropHeight: w.cellar ? LOW_CEILING : w.ridge,
  };
}

/**
 * A gable end, as sheeting ribs cut to the roof line.
 *
 * Above the eaves a wall stops being a rectangle, and `cellPlane` only makes
 * rectangles. The alternative — a rectangle relying on the roof planes to
 * occlude its top corners — is correct from inside the room and only from
 * inside the room, and `camera.ts`'s `ORBIT_MIN` escape at the stage end is
 * exactly the shot that finds out.
 *
 * `riihi.ts` has a function of this shape for its own gables and this
 * deliberately does not import it. `./index.ts` is explicit that importing one
 * room into another is how a directory of parallel authors turns back into a
 * file they all have to edit, and the two are not the same object anyway: a
 * barn gable is sawn boarding run vertically because you cannot notch a
 * triangle, and this is a profiled steel sheet cut on the rake by somebody with
 * an angle grinder. Same triangle, different building, twenty lines each.
 *
 * The geometry comes out in the xy plane with its foot on y = 0 and its normal
 * on +z, so the caller puts it at the eaves and turns it to face into the room.
 */
function gableRibs(
  halfX: number, rise: number, ribs: number, colour: string, rng: Rng,
): BufferGeometry {
  const pos: number[] = [];
  const col: number[] = [];
  const base = new Color(colour);
  const c = new Color();
  const head = (x: number): number => rise * (1 - Math.abs(x) / halfX);
  for (let i = 0; i < ribs; i++) {
    const x0 = -halfX + (2 * halfX * i) / ribs;
    const x1 = -halfX + (2 * halfX * (i + 1)) / ribs;
    const y0 = head(x0);
    const y1 = head(x1);
    pos.push(x0, 0, 0, x1, 0, 0, x1, y1, 0);
    pos.push(x0, 0, 0, x1, y1, 0, x0, y0, 0);
    c.copy(base).multiplyScalar(1 + (rng.next() - 0.5) * 0.26);
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
  const w = works(c);
  const { halfX } = w;
  const rise = -m.houseY;

  /** Inner face of the end wall behind the band, where every room's backdrop is. */
  const backInner = m.backZ - 0.1;
  /**
   * Inner face of the wall behind the audience, at the 1.6 m of margin past the
   * last row that `rooms/types.ts` requires. Taken at the margin, like the sides
   * — see `WALL_OUT`. A shed is not a big room and should not pretend to be.
   */
  const houseBackZ = m.lipZ + m.houseDepth + 1.6;
  const hallLen = houseBackZ - backInner;
  const midZ = (backInner + houseBackZ) / 2;
  /** House-floor heights, lifted into the boards' frame. */
  const haunchY = m.houseY + w.haunch;
  const eavesY = m.houseY + w.eaves;
  const ridgeY = m.houseY + w.ridge;

  const root = new Group();
  root.name = `room:${c.venue.id}`;

  // --- the slab ------------------------------------------------------------
  /**
   * Concrete, poured in bays, and **it is the one pale surface in the room**.
   *
   * Every other floor in this directory is dark: the proscenium's is `boards`
   * pulled toward `backdrop` and shaded 0.34, circuit's is the same blend at
   * 0.75 and shaded 0.42, near black so that the fog is what paints it. That is
   * right for a room whose walls fall away into nothing, and it is wrong here
   * for a reason that has nothing to do with taste. The audience is unlit by
   * design — `MeshBasicMaterial`, near black, so it reads as silhouette rather
   * than as a hundred badly lit people — and a silhouette needs something behind
   * it. Ten rows at `density: 0.94` is the densest crowd in the project, and
   * over a dark floor it is a single black mass with a texture; over a pale slab
   * every head has an edge.
   *
   * So the colour comes off `proscenium`, the palette's architecture slot,
   * rather than off `boards`, and it is only shaded a quarter. That does the
   * era's work for free: metal's `proscenium` is warm tan in 1972 and cold blue
   * grey by 1995, so the slab goes from a dusty civic hall to a cold works
   * without a constant anywhere in this file.
   *
   * Bays 2.4 m across rather than circuit's 1.5 m, because a slab is poured in
   * bays the width of the machine that laid it and the saw cuts are further
   * apart than that room's. It runs wall to wall with 0.3 m of overlap so no
   * seam opens at the foot of the sheeting, and it receives, being the large
   * flat thing under the band.
   */
  const floorW = halfX * 2 + 0.3;
  const floorD = hallLen + 0.3;
  const slab = new Mesh(
    c.kit.own(cellPlane({
      width: floorW, height: floorD,
      cols: Math.max(6, Math.round(floorW / 2.4)),
      rows: Math.max(6, Math.round(floorD / 2.4)),
      colour: shade(blend(p.proscenium, p.backdrop, 0.62), 0.24),
      jitter: 0.13, rng: c.rng('housefloor'),
    })),
    c.kit.solid('#ffffff', { vertexColors: true, rough: 0.94 }),
  );
  slab.rotation.x = -Math.PI / 2;
  slab.position.set(0, m.houseY, midZ);
  slab.receiveShadow = true;
  root.add(slab);

  // --- the walls -----------------------------------------------------------
  /**
   * Two materials, and you are meant to be able to name both of them.
   *
   * This is the room's whole thesis stated in surfaces. `circuit.ts` shades its
   * walls to `#050609` on this genre's palette and says so plainly — "a surface
   * you can tell is there and cannot read, which is exactly the brief". The
   * brief here is the opposite one, so the wall is built the way the wall of a
   * cheap industrial building is actually built: dense concrete blockwork up to
   * shoulder height, where things get hit, and profiled steel sheet above it,
   * where nothing does.
   *
   * The two are told apart by their *direction*, which is the only thing that
   * survives being seen across a dark room at twelve metres. Blockwork is a
   * bond: 440 × 215 mm cells with the courses staggered by half a block, the
   * same trick `proscenium.ts` plays for `brick` at a smaller module. Sheeting
   * is a rib: cells 190 mm wide and the full height of the sheet, so it is
   * strongly *vertical* where the blockwork is strongly horizontal. That is also
   * why neither reads as `riihi.ts`'s log wall, which is horizontal and round —
   * three rooms, three directions, no two of them the same surface.
   *
   * **Single-sided**, like every wall in this directory but the barn's, and for
   * `proscenium.ts`'s reason: orbit yaw is not clamped, swinging round the
   * outside of the building is a thing a viewer does in the first ten seconds,
   * and a solid wall answers that with a black screen where a one-sided one lets
   * you look straight in. They receive, because a wall is what a shadow lands
   * on; they do not cast, because a plane's cast shadow is a black line.
   */
  const wallMat = c.kit.solid('#ffffff', { vertexColors: true, rough: 0.95 });
  const blockColour = shade(blend(p.backdrop, p.proscenium, 0.44), 0.14);
  const sheetColour = shade(blend(p.proscenium, p.backdrop, 0.58), 0.3);

  const block = (width: number, height: number, rng: Rng): BufferGeometry =>
    cellPlane({
      width, height,
      cols: Math.max(4, Math.round(width / 0.44)),
      rows: Math.max(2, Math.round(height / 0.215)),
      colour: blockColour, jitter: 0.12, rng, stagger: true,
    });
  const sheet = (width: number, height: number, rng: Rng): BufferGeometry =>
    cellPlane({
      width, height,
      cols: Math.max(4, Math.round(width / 0.19)), rows: 1,
      colour: sheetColour, jitter: 0.2, rng,
    });

  /**
   * One wall, in one or two courses of material, built flat in xy with its foot
   * on the floor and its normal on +z. The caller turns it to face inward.
   *
   * `masonry` is the `brick` modifier and the cellar, and it takes the blockwork
   * all the way up. That is the whole of what `brick` means in this room and it
   * is a real architectural claim rather than paint: a sheeted shed and a
   * masonry one are the same frame with a different skin on it, and 1982 is in
   * a basement where there is no skin at all — just the wall the building
   * stands on.
   */
  const wall = (width: number, top: number, rng: Rng): Group => {
    const node = new Group();
    if (w.masonry) {
      const face = new Mesh(c.kit.own(block(width, top, rng)), wallMat);
      face.position.y = top / 2;
      face.receiveShadow = true;
      node.add(face);
      return node;
    }
    const dado = new Mesh(c.kit.own(block(width, DADO, rng)), wallMat);
    dado.position.y = DADO / 2;
    dado.receiveShadow = true;
    node.add(dado);
    const clad = new Mesh(c.kit.own(sheet(width, top - DADO, rng)), wallMat);
    clad.position.y = DADO + (top - DADO) / 2;
    clad.receiveShadow = true;
    node.add(clad);
    /**
     * And a rail across the joint, which is not a moulding.
     *
     * Sheeting is fixed to horizontal rails spanning between the frames, and the
     * bottom one lands on the head of the blockwork because that is where the
     * sheeting starts. It is 90 mm of steel and it costs one box per wall, and
     * what it buys is that the two materials meet at an *object* rather than at
     * a line. Two `cellPlane`s edge to edge is a texture change with nothing
     * causing it, which reads as a seam in one wall rather than as two.
     */
    const rail = new Mesh(
      c.kit.bevelBox(width, 0.09, 0.07, 0.02),
      c.kit.solid(shade(p.proscenium, 0.52), { metal: 0.4, rough: 0.55 }),
    );
    rail.position.set(0, DADO, 0.05);
    node.add(rail);
    return node;
  };

  const wallRng = c.rng('walls');
  for (const side of [-1, 1]) {
    const node = wall(hallLen, w.eaves, wallRng);
    node.position.set(side * halfX, m.houseY, midZ);
    node.rotation.y = (side * -Math.PI) / 2;
    root.add(node);
  }
  const rear = wall(halfX * 2, w.eaves, wallRng);
  rear.position.set(0, m.houseY, houseBackZ);
  rear.rotation.y = Math.PI;
  root.add(rear);

  /**
   * The end wall behind the band, on its own stream.
   *
   * `backdrop` is the tag every room in the project uses for the surface the
   * audience looks at for two hours, and it is the right one here even though
   * this wall is built out of exactly the same two materials as the other three:
   * it is the one the cyclorama glow lands on, the one the backline stands
   * against and the one the shutter is in, and giving it its own draw sequence
   * means adding a wall to the house cannot reshuffle the blockwork behind the
   * singer.
   */
  const backRng = c.rng('backdrop');
  const back = wall(halfX * 2, w.eaves, backRng);
  back.position.set(0, m.houseY, backInner);
  root.add(back);

  // --- the gables ----------------------------------------------------------
  /**
   * The triangle over each end wall, and it is not built under a lid — there is
   * a plaster ceiling in the way and geometry nothing can see is geometry nobody
   * should pay for.
   *
   * One geometry for both ends and one draw sequence with it, which is the claim
   * `riihi.ts` makes for its own pair and is truer here: two ends of one
   * building were sheeted off the same pallet by the same two people, and two
   * independently jittered gables would be two buildings.
   */
  if (!w.cellar) {
    const gableGeo = c.kit.own(gableRibs(
      halfX, w.ridge - w.eaves, Math.max(8, Math.round(halfX / 0.42)),
      shade(sheetColour, 0.18), backRng,
    ));
    for (const [z, facing] of [[backInner, 1], [houseBackZ, -1]] as const) {
      const gable = new Mesh(gableGeo, wallMat);
      gable.position.set(0, eavesY, z);
      gable.rotation.y = facing > 0 ? 0 : Math.PI;
      gable.receiveShadow = true;
      root.add(gable);
    }
  }

  // --- the frame -----------------------------------------------------------
  /**
   * Portal frames, and this is the object the room exists for.
   *
   * A portal frame is two columns and two rafters welded into one rigid bent,
   * stood up at intervals down the length of the building and tied together by
   * the purlins. It is the cheapest way anybody has found to roof a wide space,
   * which is why every works, depot and agricultural shed built since about 1950
   * is one, and it is the reason a shed is legible from inside in a way an arena
   * is not: **the load path is in the room with you.** The sheet sits on the
   * purlin, the purlin sits on the rafter, the rafter meets the column at the
   * haunch, and the column goes to the floor beside you. `circuit.ts` has a
   * girder deck 10.5 m up with nothing under it anywhere, which is correct for
   * that building and is exactly the sentence this one is arguing with.
   *
   * Bays about 5 m apart, which is what the purlin span wants, so a 19 m hall
   * gets four bays and five frames — one in each end wall and three standing
   * clear. The end pair is half-buried in the gable, which is what a gable frame
   * is.
   *
   * The columns are the only thing this room builds that stands on the floor
   * with real thickness in it, so under the shadow policy they are the only
   * thing here that casts. The steel overhead neither casts nor receives: it is
   * above every lantern in the rig, so a shadow on it would have to have been
   * cast upward, and the one shadow map in the budget has a stage-sized frustum
   * to spend on the band.
   *
   * Instanced — four members a frame across five frames is twenty boxes and two
   * draw calls.
   */
  if (!w.cellar) {
    const bays = Math.max(3, Math.round(hallLen / 5.0));
    const frames = bays + 1;
    const steel = c.kit.solid(
      shade(blend(p.proscenium, p.backdrop, 0.4), 0.34), { metal: 0.45, rough: 0.55 },
    );
    const dummy = new Object3D();

    /** 500 mm deep and 240 wide: a universal beam, seen end on. */
    const columns = new InstancedMesh(
      c.kit.bevelBox(0.24, w.haunch, 0.5, 0.03), steel, frames * 2,
    );
    const alpha = Math.atan(PITCH);
    const slopeLen = Math.hypot(halfX, PITCH * halfX);
    const rafters = new InstancedMesh(
      c.kit.bevelBox(slopeLen, RAFTER, 0.42, 0.03), steel, frames * 2,
    );
    /** Perpendicular half-depth, taken up the slope rather than straight up. */
    const rafterUp = RAFTER / 2 / Math.cos(alpha);

    let ci = 0;
    let ri = 0;
    for (let i = 0; i < frames; i++) {
      const z = backInner + (i * hallLen) / bays;
      for (const side of [-1, 1]) {
        dummy.position.set(side * (halfX - 0.12), m.houseY + w.haunch / 2, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        columns.setMatrixAt(ci++, dummy.matrix);

        dummy.position.set(
          (side * halfX) / 2,
          haunchY + (PITCH * halfX) / 2 + rafterUp,
          z,
        );
        dummy.rotation.set(0, 0, -side * alpha);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        rafters.setMatrixAt(ri++, dummy.matrix);
      }
    }
    columns.castShadow = true;
    columns.receiveShadow = true;
    root.add(columns);
    root.add(rafters);

    /**
     * Purlins, running the length of the building on top of the rafters.
     *
     * They are what makes the roof a *structure* rather than five arches with a
     * sheet over them, and they are the member that runs the other way — the
     * frames are across the room, these are down it, and two directions of steel
     * at two heights is the difference between a roof and a row of unrelated
     * portals. They are also what the lighting bar is clamped to; see the fly
     * bar at the bottom of this file, which reaches the one directly above it.
     *
     * 1.75 m apart, which is a real purlin spacing for a light sheet, and laid
     * out symmetrically about the ridge so there is one on the centre line and
     * one at each eaves rather than a seam down the middle of the room.
     */
    const perSide = Math.max(2, Math.round(halfX / 1.75));
    const purlins = new InstancedMesh(
      c.kit.bevelBox(0.08, PURLIN, hallLen, 0.02),
      c.kit.solid(shade(blend(p.proscenium, p.backdrop, 0.55), 0.3), {
        metal: 0.4, rough: 0.6,
      }),
      perSide * 2 + 1,
    );
    for (let i = 0; i <= perSide * 2; i++) {
      const x = -halfX + (i * halfX) / perSide;
      dummy.position.set(
        x,
        haunchY + PITCH * (halfX - Math.abs(x)) + RAFTER + PURLIN / 2,
        midZ,
      );
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      purlins.setMatrixAt(i, dummy.matrix);
    }
    root.add(purlins);

    /**
     * And the sheeting over the lot, so there is a roof rather than a sky with
     * steel in it.
     *
     * Two planes hinged at the ridge, `DoubleSide` and cell-shaded, which is the
     * form every lid in this project has converged on and the reason is worth
     * restating because it is not obvious: a hemisphere lights a flat plane to
     * *one number*, so a surface whose normal never changes gets identical light
     * at every pixel and reads as a hole however well the colour is chosen. Two
     * planes at an angle already get two values out of it. The cells run **down
     * the slope**, eaves to ridge, because that is the way a profiled sheet is
     * laid and because it is the one thing that gives a plane a direction.
     *
     * Darker than the walls and not much darker. There is no fixture in
     * `lights.ts` pointing up, so this is lit by the hemisphere alone, and the
     * cellar ceiling's hard-won lesson applies: spending the smallest light
     * budget in the room on the darkest albedo in the room gives five counts out
     * of 255 and a hole in the top of the frame.
     */
    const roofRng = c.rng('roof');
    const roofMat = c.kit.solid('#ffffff', {
      vertexColors: true, rough: 0.96, side: DoubleSide,
    });
    for (const side of [-1, 1]) {
      const plane = new Mesh(
        c.kit.own(cellPlane({
          width: slopeLen, height: hallLen + 0.5,
          cols: 3, rows: Math.max(8, Math.round(hallLen / 0.42)),
          colour: shade(sheetColour, 0.3), jitter: 0.13, rng: roofRng,
        })),
        roofMat,
      );
      // Flat, then hinged about the ridge: the plane's own x runs out from the
      // ridge toward the eaves and its y runs the length of the hall, so one
      // rotation on the parent tips it and lands the far edge on the wall head.
      plane.rotation.x = -Math.PI / 2;
      plane.position.x = (side * slopeLen) / 2;
      const pitchNode = new Group();
      pitchNode.add(plane);
      pitchNode.rotation.z = -side * alpha;
      pitchNode.position.set(0, ridgeY, midZ);
      root.add(pitchNode);
    }

    /**
     * The extract duct, and it is the cheapest legibility in the file.
     *
     * A spiral-wound trunk 560 mm across, hung off the steel on drop rods and
     * running the length of the building down one side. Nothing in the show
     * needs it. What it does is make the roof read as *services* rather than as
     * a ceiling: an arena's overhead is a rigging grid and everything on it
     * belongs to the show, and a converted works has ductwork, conduit and a
     * fan on the gable, none of which anybody thought about twice. One cylinder
     * and four rods.
     *
     * It hangs on the opposite side from the shutter so the room is not lopsided,
     * and it is well outside the `HEAD_BAND` box in x and 2 m above it in y, so
     * it cannot end up in front of a face. Overhead, so it neither casts nor
     * receives.
     */
    const ductX = halfX - 1.9;
    const ductTop = haunchY + PITCH * (halfX - ductX);
    const ductR = 0.28;
    const ductY = ductTop - 0.42 - ductR;
    /**
     * Short of both gables, so it does not appear to pass through them — and
     * floored, because this room is a `RoomStyle` rather than metal's private
     * building and the next genre to name it may have a much shorter hall than
     * ten rows of standing crowd make.
     */
    const ductLen = Math.max(2, hallLen - 3.2);
    const duct = new Mesh(
      c.kit.geometry(`duct|${ductLen.toFixed(2)}`,
        () => new CylinderGeometry(ductR, ductR, ductLen, 10, 1)),
      c.kit.solid(tint(shade(p.proscenium, 0.45), 0.12), { metal: 0.55, rough: 0.5 }),
    );
    duct.rotation.x = Math.PI / 2;
    duct.position.set(ductX, ductY, midZ);
    root.add(duct);

    const rodH = ductTop - ductY;
    const rods = new InstancedMesh(
      c.kit.bevelBox(0.035, rodH, 0.035, 0.012),
      c.kit.solid(shade(p.proscenium, 0.62), { metal: 0.5, rough: 0.5 }), 4,
    );
    for (let i = 0; i < 4; i++) {
      dummy.position.set(ductX, ductY + rodH / 2, midZ + ((i - 1.5) * ductLen) / 4);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      rods.setMatrixAt(i, dummy.matrix);
    }
    root.add(rods);
  }

  // --- the shutter ---------------------------------------------------------
  /**
   * The goods door in the end wall, shut, and it is the object that names the
   * building.
   *
   * Everything else in this room could be a hall built to be a hall. A roller
   * shutter 3.2 m wide in the back wall could not: it is there because lorries
   * used to come in through it, and a stage has been built in front of the rest
   * of the wall since. That is the whole of what "a converted works" means and
   * it costs four meshes.
   *
   * **Its slats are horizontal**, which is the reason it reads at all. It is
   * sitting in the middle of a wall whose two materials are a horizontal bond
   * and a vertical rib, and a third texture would be noise — but the shutter's
   * curtain is the one surface in the room made of 90 mm laths stacked up the
   * way blockwork is and *not* bonded, so it comes out as clean unbroken banding
   * against the staggered wall behind it. Guide rails down each side and the
   * barrel hood over the top, because a shutter without them is a striped
   * rectangle painted on a wall.
   *
   * Offset toward one side rather than centred, and clamped so the leaf stays
   * inside the building. Centred, it would be behind the `backline` — the wall
   * of the band's own amplifiers, which runs the full width of the deck — and
   * an object nobody can see is an object nobody should pay for. Where it sits
   * it is outboard of the boards and reads past the end of the cabinets from
   * every seat.
   *
   * It survives into the cellar era, unlike the roof. A basement under a works
   * has a loading door too — that is how the gear gets down there — and it is
   * shortened to fit under the plaster rather than removed.
   */
  const shutterRng = c.rng('shutter');
  /**
   * Clamped to the *lid* rather than to the wall head under a ceiling, and the
   * 0.9 m is the hood plus its clearance. `eaves` in the cellar is deliberately
   * half a metre above the plaster so the blockwork runs on behind it, and
   * measuring from that put the barrel 20 mm through a ceiling somebody else's
   * file draws — the one place in this room where two files agree about a
   * height and only one of them can see it.
   */
  const shutterH = Math.max(
    1.4, Math.min(SHUTTER_H, (w.cellar ? LOW_CEILING : w.eaves) - 0.9));
  const shutterX = -Math.min(m.width / 2 + 1.2, halfX - SHUTTER_W / 2 - 0.4);
  const slats = new Mesh(
    c.kit.own(cellPlane({
      width: SHUTTER_W, height: shutterH,
      cols: 1, rows: Math.max(6, Math.round(shutterH / 0.09)),
      colour: shade(blend(p.proscenium, p.backdrop, 0.3), 0.4),
      jitter: 0.16, rng: shutterRng,
    })),
    wallMat,
  );
  slats.position.set(shutterX, m.houseY + shutterH / 2, backInner + 0.06);
  slats.receiveShadow = true;
  root.add(slats);

  const shutterSteel = c.kit.solid(shade(p.proscenium, 0.5), { metal: 0.45, rough: 0.5 });
  const hood = new Mesh(
    c.kit.bevelBox(SHUTTER_W + 0.34, 0.42, 0.34, 0.05), shutterSteel);
  hood.position.set(shutterX, m.houseY + shutterH + 0.21, backInner + 0.17);
  hood.receiveShadow = true;
  root.add(hood);
  for (const side of [-1, 1]) {
    const guide = new Mesh(
      c.kit.bevelBox(0.13, shutterH, 0.14, 0.03), shutterSteel);
    guide.position.set(
      shutterX + side * (SHUTTER_W / 2 + 0.065), m.houseY + shutterH / 2, backInner + 0.09);
    guide.receiveShadow = true;
    root.add(guide);
  }

  // --- the stage's own sides -----------------------------------------------
  /**
   * Two black flats running up the sides of the deck, and they are here for a
   * measured reason rather than for atmosphere.
   *
   * **`stage-props.ts` assumes there is a surface at the side of the stage.**
   * `posters` puts three sheets facing inward at `±(openingWidth / 2 + 0.9)` and
   * `neon` puts its two wing signs at `±(openingWidth / 2 + 0.85)`, and both were
   * written for a proscenium, where the tormentor is a 4 m flat spanning from
   * 0.2 m to 4.2 m outside the opening and catches them exactly. This room has
   * no arch and therefore nothing there, and the side wall is 2.6 m further out
   * — so without these, metal's three poster eras hang three posters in mid-air
   * and 1982 hangs two lit signs beside them. The inner face lands at
   * `width / 2 + 0.92`, two centimetres behind the posters and seven behind the
   * signs.
   *
   * They are also what a stage in a shed actually has. There is no arch to mask
   * with, so the wings get closed off with black ply on a scaffold frame: it
   * hides the cases, the spare cabs and the cable, it stops a camera swung round
   * the side of the room from looking straight along the back of the backline,
   * and it makes the deck read as *built into the end of the hall* rather than
   * as a platform sitting in the middle of it.
   *
   * They stop 1.2 m upstage of the lip, which keeps them out of the house, out
   * of the crowd — the first row's faces are at `lipZ + 1.35` — and clear of the
   * `crowd-barrier`. And they duck under the cellar's soffit rather than
   * standing through it.
   */
  const flatH = Math.max(1.2, Math.min(3.4, m.openingHeight - 0.6));
  const flatFront = m.lipZ - 1.2;
  /** Floored for the reason the duct's length is: a shallower stage than this. */
  const flatDepth = Math.max(0.8, flatFront - backInner);
  const flatMat = c.kit.solid(shade(blend(p.backdrop, p.proscenium, 0.18), 0.3), {
    rough: 0.96,
  });
  for (const side of [-1, 1]) {
    const flat = new Mesh(
      c.kit.bevelBox(0.12, flatH + rise, flatDepth, 0.03), flatMat);
    flat.position.set(
      side * (m.width / 2 + 0.98), (flatH - rise) / 2, (backInner + flatFront) / 2);
    flat.receiveShadow = true;
    root.add(flat);
  }

  // --- what the lamps hang on ----------------------------------------------
  /**
   * A scaffold bar clamped to the purlin above it.
   *
   * `RoomRig.flyBar` forbids a bare group at a height nothing reaches, and the
   * rule is the whole design of this one: the drop-arms are computed to land on
   * the *actual roof plane at the x they hang from*, using the same pitch that
   * built it, so neither end floats and neither end is inside anything. In a
   * shed that is not a stylisation, it is the only way a bar gets hung — there
   * is no grid, there is nothing to fly from, and what you do is put two tubes
   * up to the steel and clamp them.
   *
   * **Not a lattice**, for the reason `circuit.ts` found the hard way: `truss`
   * is a prop, two of this genre's eras name it, and it hangs its downstage run
   * at `curtainZ - 1.1`. A lattice here would be a second lattice a third of a
   * metre from the prop's, drawn by a second file. So the room draws the pipe,
   * the prop draws the truss, and this sits 0.6 m upstage of the prop's run so
   * the arms climb past the lattice rather than through it — which also puts
   * the pipe 0.8 m clear of the `mirror-ball` the 1972 era hangs one time in
   * four at `lipZ - 1.4`, a ball with a 0.34 m radius that would otherwise have
   * been threaded onto it.
   *
   * Under a lid the arms are 80 mm to the plaster instead of a metre to a
   * purlin. Same object, same argument, one twelfth of the length.
   */
  const flyBar = new Group();
  flyBar.name = 'fly-bar';
  flyBar.position.set(0, m.flyY, m.curtainZ - 1.7);
  const barLen = m.openingWidth + 0.8;
  const pipe = new Mesh(
    c.kit.bevelBox(barLen, 0.1, 0.1, 0.045),
    c.kit.solid(shade(tint(p.proscenium, 0.18), 0.5), { metal: 0.65, rough: 0.42 }),
  );
  flyBar.add(pipe);
  const armMat = c.kit.solid(shade(p.proscenium, 0.6), { metal: 0.5, rough: 0.5 });
  for (const side of [-1, 1]) {
    const x = side * (barLen / 2 - 0.9);
    /** The steel directly above this point: the roof, or the plaster under it. */
    const top = w.cellar
      ? STAGE_SOFFIT
      : haunchY + PITCH * (halfX - Math.abs(x)) - 0.02;
    const len = Math.max(0.06, top - m.flyY - 0.05);
    const arm = new Mesh(
      c.kit.bevelBox(0.055, len, 0.055, Math.min(0.022, len * 0.3)), armMat);
    arm.position.set(x, len / 2 + 0.05, 0);
    flyBar.add(arm);
  }
  root.add(flyBar);

  /**
   * No cloth, and there never was one in this building.
   *
   * `circuit.ts` reaches the same call from the other direction — there the
   * argument is that a touring band does not travel with house tabs and that
   * the beat of black over an empty deck *is* the reveal. Here it is simpler and
   * older: this is a works with a stage in it, nobody has ever hung a track over
   * that shutter, and the room was full and lit before the band came out. What
   * `show.ts` does with `noCurtain()` is report the tabs as being exactly where
   * it asked for them on the same frame, so the runner never stalls waiting for
   * travel that will not happen and the band is still hidden while it is being
   * staged — which is what the invisibility was ever for. The reveal is a cut,
   * and in a room like this a cut is what actually happens: the lights go down,
   * and the people who were standing at the side of the stage are on it.
   */
  const curtain = noCurtain();
  root.add(curtain.root);

  return { root, flyBar, curtain };
}

export const shed: RoomBuilder = { shape, build };
