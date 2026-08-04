/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The salón — a plastered hall in a hot country, with a tiled floor people came
 * to dance on and a band along one end of it.
 *
 * `latin/staging.ts` calls its room `SALON` and its header does most of this
 * file's arguing for it: *an arcaded hall with a sprung floor in the middle of
 * it, tables round three sides and a bar along the fourth*, 11.4 m wide, nine
 * rows deep at 0.88 density, `seated: false`. A sociedad in Havana in 1938, a
 * ballroom in 1953, a club in 1975, a room with a truss in it in 1997 — and the
 * building has a roof in all four, which that file states as a rule rather than
 * as a preference. See "one building, four decades" below.
 *
 * ## It is not the courtyard, and the seam only pays if it is not
 *
 * `courtyard.ts` is the room this one was most likely to come out as, and the
 * collision is not theoretical: both are warm-climate rooms, both are built out
 * of lime plaster, both have a band at one end and a hard floor in front of it,
 * and both have a genre that names `arches` on the room rather than on any era.
 * If this file came out an arcade round a paved rectangle then two genres would
 * have paid for two files and got one building.
 *
 * So the differences are chosen against it, one at a time, and every one of them
 * is visible in the first second:
 *
 * **It has a roof, and the roof is the whole claim.** A courtyard is *outdoors
 * with walls*: `headroom` is `Infinity`, there is a sky dome, and the strip of
 * night overhead is the thing that makes it a court rather than a room. This is
 * a room. There is a coffered plaster lid over every square metre of it, both
 * lids are finite in every era, and `open-air` cannot take it away — see the
 * refusal below, which is the one place this file argues with a modifier rather
 * than answering it.
 *
 * **The openings are cut into the wall, not stood in front of it.** The
 * courtyard's arcade is *free-standing*: piers 0.2 m clear of the plaster with
 * horseshoe rings springing between them and a lintel over the top, which reads
 * as a colonnade with a wall behind it. Here the wall is a single plane and the
 * openings are holes in it — tall rectangular doorways with a louvred leaf in
 * each and a glazed half-round *medio punto* over the head. The only relief on
 * the wall is 0.09 m of pilaster and 0.16 m of cornice. Free-standing stone
 * against cut plaster is not a colour difference; it is a different silhouette
 * from every seat in the house.
 *
 * **The floor is tiled and it is the point of the building.** The courtyard's
 * flags are what a court is paved with — they are under the chairs. This floor
 * is *baldosa hidráulica*: a fine cement-tile field with a dark border laid
 * round it, polished, and it is what everybody paid to get onto. The tile module
 * is 0.28 m against the courtyard's 0.62 m flag and the proscenium's 0.9 m
 * plank, which is the difference between paving, boarding and tiling at the one
 * distance anybody sees them from.
 *
 * **The band is up, not down.** A courtyard dais is 0.45 m and is deliberately
 * not a stage, because a takht plays sitting on a carpet in front of ten rows of
 * chairs. This house is standing, dancing and nine rows deep, so the stand is
 * 0.7 m — see `BANDSTAND_RISE`.
 *
 * ## It is not the dance hall either
 *
 * `dancehall.ts` landed before this one and is the other near neighbour: it too
 * is a wide room with a floor in the middle and a band at one end, and its own
 * header says the building exists so that a hundred people can move about in the
 * middle of it. That sentence is true of this room word for word. What is not
 * shared is everything you can see:
 *
 *  - **It is not timber.** A dance hall is sawn board-and-batten with a dado
 *    rail and a plank floor; this is lime plaster on masonry over cement tile.
 *    Two grains of wood at right angles is a room somebody built; a plastered
 *    wall with a moulded cornice on it is a room somebody *finished*.
 *  - **There are no posts.** That file's posts are its signature and they are
 *    structural — a timber hall cannot span eighteen metres, so it does not. A
 *    masonry hall with a beam over it can, and a *casino de baile* boasting a
 *    clear floor with a post standing in the middle of it is a contradiction in
 *    the one thing the building is for. Nothing in this file stands on the floor.
 *  - **The lid is high, not near.** 3.7 m across 18 m there against 5.7 m across
 *    16 m here — a section of 1 : 4.9 against 1 : 2.8. That is not decoration:
 *    height *is* the air conditioning in a building with none, and it is why
 *    there is room under this ceiling for a fan on a long rod.
 *
 * ## It is not the ballroom, and that one is the closest call of the three
 *
 * `ballroom.ts` landed while this file was being written and it is the nearest
 * neighbour by a distance: a decorated room, a band at one end, a full floor,
 * a genre whose stage is 11.5–12.7 m against this one's 11.4–12.1. In plan the
 * two are the same rectangle. `./index.ts` says out loud that a ballroom, a
 * dancehall and a salón are one big room with a floor in it, so this is exactly
 * the collision the registry predicted, and it has to be answered in section and
 * in surface rather than in plan.
 *
 * It is answered in four of the eight numbers, which is as structural as this
 * seam gets:
 *
 *  - **`openingWidth`.** That room is a *theatre* — its own header says so, at
 *    length, and it has a moulded architrave standing proud of the end wall, so
 *    its aperture is `d.width - 2 * ARCH_REVEAL` and is deliberately **narrower
 *    than the boards**. This one is `d.width` exactly, because there is no arch
 *    to be narrower than.
 *  - **`curtain`.** That room reveals things for a living and gathers a red
 *    house tab to do it. This one returns `noCurtain()`. A *casino de baile* has
 *    never owned a cloth; the floor was full before the band came on.
 *  - **`headroom`.** That room publishes `Infinity` — nothing over the boards,
 *    because a theatre flies its scenery out. This one publishes a finite lid
 *    over every square metre, because a hall is one clear span of plaster and
 *    there is nowhere for anything to go.
 *  - **`rise`.** 1.0 m there, the highest in the project, which is what a stage
 *    built for a burlesque house is. 0.7 m here, which is two steps and a conga.
 *
 * And the surfaces have nothing in common. That room is lined with a **gallery
 * round three sides** — a shelf you walk round with a drink, with a soffit you
 * read the room by. This one cannot have one, and the reason is not taste: the
 * side walls here are eight bays of 3.1 m double doors, and a balcony across
 * them is a balcony across the only thing keeping the building cool. Their
 * ornament is a theatre's, pulled *toward* the wall to read as tired gilding;
 * this room's is a hot-climate hall's — pilasters, a cornice, louvred leaves,
 * coloured fanlights and four fans on long rods, none of which appears in that
 * file and none of which is decoration in the same sense. Theirs was moulded to
 * be looked at from seats that have been taken out. This was cut to move air.
 *
 * Between them and `concert-hall.ts` the three make a clean ladder of section
 * over the same plan: 0.82 of the stage width for a shoebox whose volume is its
 * acoustic, 0.66 for a ballroom whose money went sideways into the floor, and
 * 0.50 here for a room whose height is its ventilation and nothing else.
 *
 * ## One building, four decades, and the room could not tell them apart anyway
 *
 * 1938 and 1997 are arguably not the same room — a Fania dance in a converted
 * cinema and a sociedad with the shutters open are different buildings in every
 * respect but the music. This file stages them as one, and there are two
 * separate reasons, of which only the second is a taste.
 *
 * The first is that it is not possible to do otherwise. A room cannot see the
 * era and must not be given a way to: `StageRoom.architecture` is one field on
 * the *room* rather than one per dressing, so the decade reaches this file
 * through exactly two channels — the size, through `StageDressing.grow`, and the
 * modifiers, through `props`. `circuit.ts` makes the argument at length and
 * `dancehall.ts` restates it for its own 1968 broadcast. Latin names no room
 * modifier in any era, so there is no channel left at all: branching on `neon`
 * or `truss` to change the architecture would be making a light fitting decide
 * what the building is made of, which is exactly the flag that should have been
 * a room.
 *
 * The second is that the genre author already ruled on it, in prose, and ruled
 * the other way from the obvious answer. `latin/staging.ts` opens by refusing to
 * put `open-air` on 1938 and take it away later, and gives the reason: *that
 * would be changing the architecture per decade, which is exactly what a room is
 * not allowed to do.* The courtyard feel of the first era is carried by
 * lanterns, candles and flowers instead. This file is the other half of that
 * bargain and would be breaking it by branching.
 *
 * It also happens to be true of the buildings. The rooms this genre was played
 * in did not get knocked down in 1975; a production company bolted a truss to
 * their ceiling beams, somebody painted the shutters over, and the arcade is
 * still there underneath — which is what the 1997 era comment says in as many
 * words. What changes across the four is the palette, the dressing and about
 * 0.7 m of stage, and that is enough, because the palette here goes from
 * tungsten-on-whitewash to cold grey over a warm floor and takes the whole room
 * with it.
 *
 * ## The modifiers
 *
 * Latin names none of the five, so every branch below would be unreachable
 * today; each is here only because `RoomStyle` is an archetype rather than a
 * catalogue entry, and `rooms/index.ts` says out loud that a ballroom, a dance
 * hall and a salón are one big room with a floor in it. So the question each of
 * these answers is "what would this building do", and three of them answer *it
 * would stop being this building*.
 *
 * `open-air` is **answered, and it does not remove the roof.** It throws every
 * shutter in the hall open. That is the largest thing a flag may do here: the
 * lid is what makes this room not the courtyard, and a salón with the ceiling
 * taken off is a courtyard with a tiled floor, which is a file that already
 * exists. A genre wanting the sky wants `courtyard`, which does it properly with
 * a dome and an `Infinity`. What the flag can honestly say is that the building
 * is standing open to the night, and in a room whose side walls are eight bays
 * of louvred double doors that is a visible and complete answer.
 *
 * `low-ceiling` is **refused.** `stage-props.ts` draws a lid at
 * `houseY + LOW_CEILING` and a soffit at `STAGE_SOFFIT` whenever it is named,
 * whatever this file publishes, so answering it would mean not building the
 * coffering and measuring the eight numbers to 3.6 m — which is what
 * `dancehall.ts` does, correctly, because its own lid is at 3.7 m and the two
 * are ten centimetres apart. Here they are two metres apart. A hall with a 3.6 m
 * ceiling is not a salón at low volume, it is a different building, and it is
 * precisely the one `dancehall` already is.
 *
 * `brick` is **refused**, and it is the closest call. The wall could plausibly
 * have its render off. But every piece of this room's articulation — the
 * pilasters, the cornice, the reveals round the openings, the arch of the medio
 * punto — is *plasterwork*, and stripping the plaster to expose the bond would
 * mean deleting all of it and leaving a rectangular box with holes in it. That
 * is the failure `dancehall.ts` names when it refuses `black-box`: a room that
 * has stopped being able to say which century it is in.
 *
 * `black-box` is **refused** for the same reason and more shortly. `haze` is air
 * rather than architecture and there is nothing here to add; latin never names
 * it anyway, and its own 1975 note gives the better reason — what is in the air
 * in that room is several hundred people and a Tuesday, not a machine.
 *
 * ## What this file does not draw
 *
 * Latin names `arches`, `dance-floor` and `riser` genre-wide, and its four
 * dressings add `paper-lanterns`, `tables`, `candles`, `flowers`, `bar`,
 * `chandelier`, `mirror-ball`, `railing`, `wedges`, `neon`, `posters`,
 * `pa-stack`, `backline`, `truss`, `screen` and a handful of maybes. Every one
 * of those is `stage-props.ts`'s, which places them for every room at once — a
 * salón drawing its own bar would draw two bars a few centimetres apart, which
 * is the collision `RoomDatum.props` exists to make impossible rather than
 * merely unlikely.
 *
 * Three of them are worth naming because they are the ones this room would
 * otherwise be tempted by, and because what the room owes each of them is a
 * surface to stand on.
 *
 * **`arches`** arcades the wall *behind the band*, at `backZ + 0.22`, sized off
 * the aperture, and it is the object latin says makes the room legible. So the
 * end wall here is deliberately plain — no pilasters, no openings, nothing but
 * plaster and the cornice returning across the top — and it is set 0.1 m upstage
 * of `backZ` so the prop's piers stand 0.32 m clear in front of it rather than
 * inside it. The arcade's lintel tops out around 3.4 m and this wall runs on up
 * to 5.7 m, which is the point: the arcade is a screen across the bottom of a
 * tall wall, the way it is in the photographs.
 *
 * **`bar`** stands across the *back of the house* at `lipZ + houseDepth - 0.8`,
 * which is the prop's decision and not this file's. What the room owes it is a
 * wall to stand against, and that is why the downstage wall is the one wall here
 * with no openings cut in it — see `build`.
 *
 * **`dance-floor`** lays parquet `houseWidth * 0.7` wide over the middle of the
 * house at `houseY + 0.02`. That is not a duplicate of the tiled floor below it,
 * it is the other half of the same fact: a sprung wooden floor laid over the
 * tiles in the middle of a hall is exactly what these rooms had, and the tile
 * border showing round three sides of it is what tells you so.
 *
 * ## One thing this room owes the props and does not pay
 *
 * `neon` and `posters` both hang at `±(openingWidth / 2 + 0.9)`, and the neon's
 * own comment says why: *offstage, seen through the opening at an angle, so a
 * wide shot has something bright in the dark either side of the arch.* In a
 * proscenium that x lands on a tormentor. Here the aperture is the full stage
 * width and the side walls are 2.6 m further out, so a 1975 poster hangs in the
 * corner of the hall with about a metre and a half of air behind it.
 *
 * It is deliberately not fixed here, and the reason is the seam rather than
 * laziness. Six of the ten rooms in this directory now answer `d.width` for the
 * aperture and every one of them has the same gap; building a screen at that x
 * to catch a prop would be this file compensating for a placement decision
 * another file owns, which is the direction of dependency the whole split exists
 * to forbid. If it is worth solving it is worth solving in `stage-props.ts`, once,
 * against `houseWidth` — and it is not this file's call to make.
 */

import {
  BoxGeometry, CircleGeometry, Color, DoubleSide, Group, InstancedMesh, Mesh,
  Object3D,
} from 'three';

import {
  blend, cellPlane, hueShift, shade, tint, LENS_GAP,
} from '../stage-kit.js';
import {
  noCurtain, type RoomBuilder, type RoomContext, type RoomDatum, type RoomRig,
  type RoomShape,
} from './types.js';

/**
 * How far the bandstand stands above the tiles.
 *
 * Not `STAGE_RISE`, and not any of the four numbers the rooms either side of it
 * picked. The band in this room walks on through the crowd carrying its own
 * instruments — a conga is 0.75 m tall and thirty kilograms and it is lifted by
 * one person, and there are three of them in the middle era's percussion bench —
 * so the stand is a thing you *step onto*, and a step you can take with a drum
 * under one arm is 0.35 m. Two of them is 0.7 m, and that is the whole of the
 * derivation: this is a platform somebody built out of the same timber as the
 * floor, not a stage a theatre flew scenery onto.
 *
 * It has to survive the densest standing house in the project, though, and that
 * is the half that had to be checked rather than asserted. `stage-audience.ts`
 * puts a standing crown at 1.62 m plus 0.2 m of jitter, bob and applause lift,
 * with the first row's face at `lipZ + 1.0`; at 0.7 m of rise those crowns reach
 * **1.12 m in board space**, which is 0.18 m below `HEAD_BAND.lo` — the chin of
 * a player *sitting down*. So the front row cannot cross any part of any player
 * from any camera position, which is the only thing the height is for. The dance
 * hall's 0.55 m leaves 0.03 m of that margin and the courtyard's 0.45 m has none
 * of it, and both are right, because both of those houses are sitting down or
 * standing still.
 *
 * The rake lifts the back of the house — `m.crowd.topY` comes out at 1.52 m —
 * and that is not the same question and does not want the same answer. The ninth
 * row is 6.4 m downstage of the first and 8.5 m from the front line, so a head
 * up there projects *below* a player's feet from any lens the director owns; it
 * is the row you can reach over that matters, and that is the one measured
 * above.
 *
 * The other direction is where it stops. `lawn.ts` took 0.75 m for a standing
 * crowd and the proscenium takes 0.9 m, and either would work for the
 * sightlines; what neither survives is the drum. Above about 0.7 m the stand
 * stops being something you step onto and starts needing a flight, and a *salón*
 * with a flight of stairs up to the band is a theatre that has lost its seats.
 */
const BANDSTAND_RISE = 0.7;

/** How far outside the house the walls stand. `camera.ts`'s margin. */
const WALL_OUT = 0.6;

/**
 * The moulded band round the head of the wall, and the thing the aperture stops
 * under.
 *
 * A cornice this deep is not ornament in a room like this, it is where the
 * ceiling stops being a ceiling — the plaster runs out horizontally over the
 * wall head, and the clear opening anybody actually sees the band through ends
 * at its soffit rather than at the ceiling plane 0.45 m above it. That is why
 * `openingHeight` and `headroom` are two different numbers here where the
 * courtyard has one: everything `stage-props.ts` and `lights.ts` hang off the
 * aperture — the mirror ball at 0.82 of it, the cyclorama glow at 1.06 of it,
 * the back light at 0.5 m under it, the paper lanterns at 0.72 of it — then sits
 * *under the cornice line* rather than up in the coffering, which is where a
 * fitting in this room hangs and is what stops the ball ending up in the lid.
 */
const CORNICE_H = 0.45;

/** How far the cornice stands proud of the plaster. */
const CORNICE_OUT = 0.16;

/** Pilaster: a flat engaged pier between two bays. Width along the wall, relief. */
const PILASTER_W = 0.42;
const PILASTER_OUT = 0.09;

/**
 * How tall the openings are.
 *
 * 3.1 m of door, which is absurd for a door and correct for this building. Two
 * storeys' worth of opening in a single-storey room is the *whole* device of
 * hot-climate architecture: the taller the opening, the more of the room's air
 * it can move, and a 2.1 m domestic door in a 5.7 m hall would read as a
 * cupboard. It also has to clear the tallest thing in the room after the band —
 * the `bar` prop's counter at 1.08 m and the `railing` at 0.95 m are nowhere
 * near it, so the constraint that actually binds is from above: the head, the
 * transom and the medio punto together have to fit under the cornice soffit,
 * which at the smallest hall this genre builds leaves 1.45 m for 0.9 m of them.
 */
const DOOR_H = 3.1;

/**
 * The highest the wide shot's lens can stand, restated from `camera.ts`.
 *
 * `wideEye` is `min(2.3 + min(d * 0.11, 1.3), headroom - LENS_GAP)`, so the
 * lens tops out at 3.6 m in any room with more than 4.2 m over it — which every
 * era of this one has. Restated rather than imported for the reason
 * `stage-kit.ts` restates `cast.ts`'s margins: a room asking the camera how tall
 * it is would be the stage depending on the director. If the two ever disagree
 * the symptom is a fan blade through the middle of a wide shot, which is exactly
 * what this number is here to stop.
 */
const LENS_CEILING = 3.6;

/**
 * How high the ceiling is above the tiles, before the bandstand is taken off.
 *
 * Scaled with the hall rather than fixed, the way a courtyard wall is: a 16 m
 * room with a 4 m lid is a garage and the same lid over a 9 m room is a parlour.
 * Clamped at both ends because neither extreme is a salón. Under 5.0 m there is
 * no height left over a 3.1 m opening for its transom and its fanlight, and the
 * fans have to come up so far to clear the lens that they are inside the
 * coffering. Over 6.2 m the cornice is too far away to read as a moulding and
 * the room turns into a church.
 *
 * At the four sizes this genre builds — 11.4, 11.7, 11.9 and 12.1 m of stage —
 * it lands between 5.70 m and 6.05 m, which is a real dimension for these
 * buildings and is about a metre and a half taller than anything else in this
 * directory that has a lid on it at all.
 */
function hallHeight(width: number): number {
  return Math.max(5.0, Math.min(width * 0.5, 6.2));
}

/**
 * How far under the ceiling the fans hang, and it is solved rather than chosen.
 *
 * `sabha.ts`'s author found that fans at ±0.3 of the house width sit outside the
 * horizontal field of every wide shot, so these are on the centre line instead,
 * strung down the middle of the house where a hall's fans actually run. That
 * fixes x and leaves y, and y has two constraints pulling opposite ways.
 *
 * A fan wants to be **low**, because the air is wanted on the dancers and not on
 * the plaster, and because the top edge of the wide shot's frame is only a few
 * degrees above the lens: anything much over 4.5 m at this distance is out of
 * the picture, which is the vertical version of the mistake the sabha made
 * horizontally. And it wants to be **high**, because `camera.ts` will put the
 * lens at 3.6 m and a blade below that is a blade the camera flies through.
 *
 * So it hangs exactly `LENS_GAP` over the highest the lens can go — 4.2 m in
 * board space, the same clearance `camera.ts` keeps under the ceiling itself,
 * and about as low as a fan can be without becoming an obstacle. In the tallest
 * era that is 1.15 m of down-rod under the coffering, which is long, and long is
 * right: these rooms hang their fans on a pipe precisely because the ceiling is
 * too far up to be any use.
 */
function fanY(headroom: number): number {
  return Math.min(headroom - 0.55, LENS_CEILING + LENS_GAP);
}

function shape(d: RoomDatum): RoomShape {
  const hallH = hallHeight(d.width);
  const rise = BANDSTAND_RISE;
  /** The coffering, over the boards. Both lids are this; see below. */
  const lid = hallH - rise;
  return {
    rise,
    /**
     * The whole width of the bandstand, and there is nothing beside it.
     *
     * A proscenium takes 0.94 of the stage because the outer 6 % is behind a
     * tormentor. There is no tormentor here, no leg, no arch and no return: the
     * band plays on a platform built across the end of a hall that is 4 m wider
     * than the platform is, and a trombonist standing on the corner of it is
     * seen from every square metre of the floor. So the honest number is the
     * whole width, and `RoomShape`'s one hard rule — never narrower than
     * `width - 2 * MARGIN_SIDE` — is satisfied with the entire metre to spare.
     *
     * Six of the ten rooms in this directory now answer `d.width` here and it is
     * worth saying why that is not everybody copying the courtyard. It is what
     * the field *means* once a room has no arch in it: the aperture is the gap
     * the audience looks through, and where nothing masks the band the gap is
     * the band. What differs between those six is what the number is measured
     * between, and here it is measured between two things that do not exist,
     * which is the strongest form of the same answer.
     *
     * It is also worth naming what it does not buy. `cast.ts` clamps players to
     * `min(width/2 - 0.5, width * 0.47)` with no sight of this file, so below
     * 16.7 m of stage the margin binds and nobody gains a hand's breadth. What
     * changes is everything hung off the aperture: in this room the bunting, the
     * cyclorama glow and the `arches` prop's bay count span the hall rather than
     * an arch that is not there.
     */
    openingWidth: d.width,
    /**
     * Up to the cornice soffit, from the boards. See `CORNICE_H` — this is
     * deliberately 0.45 m short of the ceiling, because the ceiling is not what
     * anybody in this room sees the band against.
     */
    openingHeight: hallH - rise - CORNICE_H,
    /**
     * There is no cloth in this building and there never was, so this is the
     * other thing the field means: the line across the front of the room that
     * everything downstage-most is tied off on. `stage-props.ts` hangs the
     * bunting 0.35 m upstage of it, the fairy lights 0.15 m, the neon and the
     * posters in the corners beside it, and the fly bar rides 1.1 m upstage of
     * it by the convention every room here keeps.
     *
     * 0.62 m in from the lip, and the constraint is at the other end. `flowers`
     * is the one prop that lands *downstage* of this line, at `curtainZ + 0.27`,
     * and `lights.ts` sets a footlight trough into the deck reaching
     * `lipZ - 0.29`; at 0.62 the vases stand at `lipZ - 0.35`, a hand's breadth
     * clear of the trough and on the front edge of the stand where a row of
     * flowers in front of a 1938 conjunto belongs. The proscenium's 0.45 m puts
     * them in the trough. Further upstage than this and the fly bar walks back
     * over the middle of the band instead of over its front rank.
     */
    curtainZ: d.lipZ - 0.62,
    /**
     * A scaffold pipe on two drop-rods off the ceiling ribs, a handspan under
     * the cornice line.
     *
     * There is no fly tower here and there is not going to be one — the ceiling
     * of a *casino de baile* is the ceiling, and what a room like this has is a
     * length of barrel lashed to whatever is up there, which is precisely what
     * the 1997 dressing then bolts its truss to. So the height is measured down
     * from the cornice rather than up from anything: 0.3 m under it, which is
     * where the rods are short enough to be rods and the pipe is still clear of
     * the plaster.
     *
     * That puts it at 4.25 m in the smallest era and 4.60 m in the largest, and
     * both were measured rather than assumed. `circuit.ts` had to move its own
     * after screenshots showed the rig above the top of every frame, so this one
     * was checked the way `lawn.ts` checked its wide shot: solve `camera.ts`'s
     * wide framing for all four eras at four window shapes — 0.72, the 0.96 that
     * file names as the browser pane, 16:9 and 21:9 — settle the lens, and ask
     * the frustum where its top edge crosses the bar's plane.
     *
     * The bar is inside the frame in all sixteen. The tightest is the widest
     * window, where the field is narrowest vertically: the top edge crosses at
     * 5.05 m in `conjunto` against a bar at 4.25, and at 5.13 m in `moderno`
     * against a bar at 4.60 — 0.80 m and 0.53 m of air. The tall windows are not
     * close, at 6.8 m to 8.5 m. The one thing that does clip is the very tip of
     * the pipe in `moderno` at 16:9, where the top corner of the frame comes
     * down to 4.18 m at x = ±5.35; the outermost *par* is at ±5.25 and clears by
     * 0.41 m, so what leaves the picture is 10 cm of barrel end and no fixture.
     */
    flyY: hallH - rise - CORNICE_H - 0.3,
    /**
     * The coffering, and it is the same plaster over the band as over the floor.
     *
     * Both lids are one number here, unlike the cellar and unlike the shed. That
     * is not laziness, it is the building: a hall of this kind is one clear span
     * from wall to wall with nothing stepped down over the band, and the moment
     * there is a soffit over the stage it has become a room with a proscenium
     * boxed into the corner of it, which is the dance hall's honky-tonk and not
     * this.
     *
     * What sits *below* it is the fans, and they are why this number is not
     * simply the lowest thing overhead. `houseLid` is read by exactly one
     * consumer — `chandelier`, through `houseLid()` — and that function's own
     * note says to ask for *the surface you are fixing to*. A ceiling fan is not
     * a surface anything is fixed to, it is a thing already fixed to one. So
     * both numbers publish the plaster, the fans hang under it on the centre
     * line, and the pair of chandeliers the 1953 dressing hangs at
     * ±0.17 of the house width are 2.6 m clear of the nearest blade in x. The
     * camera is safe by construction rather than by clearance: `fanY` puts the
     * blades a full `LENS_GAP` above the highest the lens can stand.
     */
    headroom: lid,
    houseLid: lid,
    /**
     * The end wall of the hall, floor to ceiling, measured from the tiles.
     *
     * Full height, because this is not a cloth and not a coping wall you are
     * meant to see over — it is the gable end of a masonry building with an
     * arcade standing in front of the bottom third of it. `lights.ts` sizes the
     * cyclorama glow as `min(openingHeight * 1.06, backdropHeight - 0.1)`, so
     * publishing the true height lets the aperture win that `min` and the glow
     * lands on the wall under the cornice instead of being clipped by it.
     */
    backdropHeight: hallH,
  };
}

function build(c: RoomContext): RoomRig {
  const p = c.venue.palette;
  const m = c.m;
  /** See the header: this opens the shutters. It does not take the roof off. */
  const openAir = c.props.has('open-air');
  const rise = -m.houseY;
  const hallH = m.backdropHeight;
  /** The inner face of the walls, and the outer edge of everything. */
  const halfX = m.houseWidth / 2 + WALL_OUT;
  /** Behind the last row, with the 1.6 m of margin every room here keeps. */
  const houseBackZ = m.lipZ + m.houseDepth + 1.6;
  /** The ceiling, in board space. */
  const lidY = m.headroom;
  /** The cornice soffit, in board space — the top of the aperture. */
  const corniceY = m.openingHeight;

  const root = new Group();
  root.name = `room:${c.venue.id}`;

  // --- the floor -----------------------------------------------------------
  /**
   * *Baldosa hidráulica* — a cement-tile floor with a dark border laid round a
   * pale field, and it is the one surface in this room that had to be right.
   *
   * Two planes rather than one, and the border is what makes it a floor rather
   * than a fill. A single field of tile running under the walls reads as a
   * texture the room is standing on; a field with a band round it reads as
   * something a tiler set out from the middle, and the corner where the border
   * turns is the only place in the picture that says the floor was *laid* rather
   * than rendered. It costs one extra draw call and it is the cheapest metre of
   * character in the file.
   *
   * The module is 0.28 m. That number is doing the same work the proscenium's
   * 0.9 m plank and the courtyard's 0.62 m flag do: a plank reads from its
   * length, a flagstone from being as wide as it is deep, and a cement tile from
   * being *small* — a floor whose cells are twice the size of your foot is a
   * floor you notice you can count. Fine cells also give the polish somewhere to
   * live, which is the second half of it: `rough: 0.42` here against 0.93 on the
   * courtyard's flags and 0.95 on the proscenium's boards, because this is the
   * only floor in the directory that anybody has ever put wax on.
   *
   * Colour off `proscenium` pulled toward `curtain` rather than toward
   * `backdrop`. That is deliberate and it is what makes the floor warm in 1938
   * and cold in 1997 without a branch: hydraulic tile is *patterned*, the pattern
   * is always a version of whatever else in the room is coloured, and `curtain`
   * is this palette's one saturated entry in every era.
   *
   * Both planes receive. They are the largest flat things under the band, which
   * is the first line of the shadow policy.
   */
  /**
   * The tiling runs the whole plan of the building and then some, which is not
   * what the other rooms do and is a bug they are all carrying.
   *
   * `proscenium.ts` lays a floor `houseDepth + 8` deep centred on
   * `lipZ + houseDepth / 2`, and the courtyard copies it. That reaches
   * `lipZ - 4` upstage, which in this genre is `z = -0.5` — half a metre
   * *downstage of the middle of the stage*. Everything upstage of that outside
   * the boards has no floor under it at all. In a proscenium nobody ever finds
   * out, because the tormentors and the arch legs mask exactly that wedge; here
   * there is no masking anywhere and the first wide shot had a black triangle in
   * each bottom corner where the corner of the hall should be.
   *
   * So it is measured from the building instead: from 2 m behind the end wall to
   * 6 m past the downstage one, which covers every square metre inside the
   * plaster with enough overrun that no camera angle finds an edge.
   */
  const floorRng = c.rng('housefloor');
  const floorW = m.houseWidth + 8;
  const floorFrom = m.backZ - 2;
  const floorTo = houseBackZ + 6;
  const floorD = floorTo - floorFrom;
  const borderColour = shade(blend(p.proscenium, p.backdrop, 0.62), 0.3);
  const tileColour = shade(blend(p.proscenium, p.curtain, 0.22), 0.14);
  const tileMat = c.kit.solid('#ffffff', { vertexColors: true, rough: 0.42 });

  const surround = new Mesh(
    c.kit.own(cellPlane({
      width: floorW, height: floorD,
      cols: Math.max(8, Math.round(floorW / 0.56)),
      rows: Math.max(8, Math.round(floorD / 0.56)),
      colour: borderColour, jitter: 0.1, rng: floorRng,
    })),
    tileMat,
  );
  surround.rotation.x = -Math.PI / 2;
  surround.position.set(0, m.houseY, (floorFrom + floorTo) / 2);
  surround.receiveShadow = true;
  root.add(surround);

  /**
   * The field, inset a metre and a bit from the walls so the border shows all
   * round, and lifted 4 mm so the two planes cannot fight over the same depth.
   * 4 mm rather than the 20 mm the `dance-floor` prop uses, because this is one
   * floor laid in two colours and that is a second floor laid on top of it.
   */
  const fieldW = halfX * 2 - 2.4;
  const fieldD = houseBackZ - m.backZ - 2.4;
  const field = new Mesh(
    c.kit.own(cellPlane({
      width: fieldW, height: fieldD,
      cols: Math.max(8, Math.round(fieldW / 0.28)),
      rows: Math.max(8, Math.round(fieldD / 0.28)),
      colour: tileColour, jitter: 0.075, rng: floorRng,
    })),
    tileMat,
  );
  field.rotation.x = -Math.PI / 2;
  field.position.set(0, m.houseY + 0.004, (m.backZ + houseBackZ) / 2);
  field.receiveShadow = true;
  root.add(field);

  // --- the plaster ---------------------------------------------------------
  /**
   * Lime render, and single-sided for the reason every room here gives: orbit
   * yaw is not clamped, swinging round the outside of the building is a thing a
   * viewer does in the first ten seconds, and a solid wall answers that with a
   * black screen. Looking straight in from outside is the graceful version of
   * the same failure.
   *
   * Four walls, because a hall is closed on all four sides — this is the roofed
   * room the courtyard is not, and three walls with a lid over them is the slab
   * hanging in space the proscenium's house walls were written after.
   */
  const wallRng = c.rng('walls');
  const wallColour = blend(tint(p.proscenium, 0.06), p.ambient, 0.16);
  const wallMat = c.kit.solid('#ffffff', { vertexColors: true, rough: 0.94 });
  const render = (w: number, h: number, colour: string): Mesh => new Mesh(
    c.kit.own(cellPlane({
      width: w, height: h,
      cols: Math.max(4, Math.round(w / 1.7)),
      rows: Math.max(3, Math.round(h / 1.6)),
      colour, jitter: 0.045, rng: wallRng,
    })),
    wallMat,
  );

  const wallH = hallH;
  const sideDepth = houseBackZ - m.backZ;
  for (const side of [-1, 1]) {
    const mesh = render(sideDepth, wallH, wallColour);
    mesh.position.set(side * halfX, m.houseY + wallH / 2, m.backZ + sideDepth / 2);
    mesh.rotation.y = side * -Math.PI / 2;
    mesh.receiveShadow = true;
    root.add(mesh);
  }

  /**
   * The downstage wall, and the one wall with nothing cut into it.
   *
   * `BUILDERS.bar` stands a 1.06 m counter across the back of the house at
   * `lipZ + houseDepth - 0.8`, in every era latin has — it is the only prop this
   * genre names in all four. A run of double doors behind a bar is a fire exit
   * somebody has blocked; what a bar stands against is a solid wall with the
   * bottles on it. So the openings are on the two long sides, where the air
   * actually has to cross the room, and this wall gets the pilasters and the
   * cornice and nothing else.
   */
  const rear = render(halfX * 2, wallH, shade(wallColour, 0.06));
  rear.position.set(0, m.houseY + wallH / 2, houseBackZ);
  rear.rotation.y = Math.PI;
  rear.receiveShadow = true;
  root.add(rear);

  /**
   * The wall behind the band, and it is deliberately the plainest surface in the
   * room.
   *
   * `arches` stands its arcade 0.32 m in front of this, so anything drawn here
   * would be read through it; and the cyclorama glow is painted on it, so
   * anything drawn here would be read through *that* as well. Set 0.1 m upstage
   * of `backZ` so nobody standing on the back of the boards is inside it, and
   * double-sided — the camera never gets behind the other three and it very much
   * can get behind this one by orbiting over the band.
   *
   * **The full width of the hall**, and not the `width * 1.2` every other room
   * here uses. That factor is right for a *backdrop*: a cloth or a panel hung
   * behind a band inside a proscenium, where the arch and its tormentors mask
   * whatever is either side of it. There is no arch here and nothing masks
   * anything, so a 13.7 m panel across a 16.7 m room left a 1.5 m column of
   * page background standing at each end of it — visible in the very first wide
   * shot, floor to ceiling, on both sides of the picture. This is not a backdrop.
   * It is the end wall of the building, and an end wall goes wall to wall.
   */
  const backW = halfX * 2;
  const back = new Mesh(
    c.kit.own(cellPlane({
      width: backW, height: wallH,
      cols: Math.max(5, Math.round(backW / 1.5)),
      rows: Math.max(3, Math.round(wallH / 1.5)),
      colour: tint(wallColour, 0.05), jitter: 0.04, rng: wallRng,
    })),
    c.kit.solid('#ffffff', { vertexColors: true, rough: 0.94, side: DoubleSide }),
  );
  back.position.set(0, wallH / 2 - rise, m.backZ - 0.1);
  back.receiveShadow = true;
  root.add(back);

  // --- the order: pilasters, openings, fanlights, cornice ------------------
  /**
   * The bays.
   *
   * Everything articulated in this room is set out from one module, worked out
   * once from the long side wall and then used on the downstage wall too, for
   * the reason `courtyard.ts` gives about its own arcade: a room whose pilasters
   * change width as the wall turns a corner is the one thing about the order
   * that anybody notices. About 2.35 m of bay is what these buildings use — wide
   * enough for a pair of doors and a pier, narrow enough that eight of them fit
   * down an eighteen metre room.
   */
  const bays = Math.max(4, Math.round(sideDepth / 2.35));
  const bay = sideDepth / bays;
  const openW = Math.max(0.9, bay - PILASTER_W - 0.5);
  /** Half-round glass over the head, and the transom bar under it. */
  const fanR = openW / 2;
  const transomY = m.houseY + DOOR_H;

  const stoneColour = tint(p.proscenium, 0.16);
  const stone = c.kit.solid(stoneColour, { rough: 0.86 });

  /**
   * The pilasters, on the two side walls and the downstage wall.
   *
   * Flat engaged piers, 0.09 m of relief, running from the tiles to the cornice
   * soffit. That relief number is the whole argument against the courtyard's
   * arcade in one dimension: an arcade is a wall you can walk behind and a
   * pilaster is a wall you cannot, and 0.09 m is exactly enough to catch a
   * highlight down one side and throw a soft edge down the other without ever
   * reading as a column.
   *
   * They cast and do not receive. A pier is a chunky solid standing on a floor,
   * which is the class the shadow policy says casts; the wall behind is already
   * receiving and a pilaster that also received would be lighting its own
   * reveal.
   */
  const pilasterH = corniceY + rise;
  const dummy = new Object3D();
  const sidePiers = (bays + 1) * 2;
  const rearBays = Math.max(4, Math.round((halfX * 2) / bay));
  const piers = new InstancedMesh(
    c.kit.bevelBox(PILASTER_W, pilasterH, PILASTER_OUT * 2, 0.025),
    stone, sidePiers + rearBays + 1,
  );
  let pi = 0;
  for (const side of [-1, 1]) {
    for (let i = 0; i <= bays; i++) {
      dummy.position.set(side * (halfX - PILASTER_OUT), m.houseY + pilasterH / 2, m.backZ + i * bay);
      dummy.rotation.set(0, Math.PI / 2, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      piers.setMatrixAt(pi++, dummy.matrix);
    }
  }
  const rearBay = (halfX * 2) / rearBays;
  for (let i = 0; i <= rearBays; i++) {
    dummy.position.set(-halfX + i * rearBay, m.houseY + pilasterH / 2, houseBackZ - PILASTER_OUT);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    piers.setMatrixAt(pi++, dummy.matrix);
  }
  piers.castShadow = true;
  root.add(piers);

  /**
   * The openings, and there are three pieces to each of them.
   *
   * **The reveal** is a dark panel set 0.16 m into the wall. It is what makes a
   * hole in a plane read as a hole rather than as a rectangle painted on: the
   * eye takes the depth from the darkness and the offset, and neither costs
   * anything. At night, from inside a lit room, a doorway onto an unlit gallery
   * is very nearly black, so this is also simply what is there.
   *
   * **The leaf** is a louvred shutter, drawn as a `cellPlane` of one column and
   * fourteen rows with the jitter run up hard. That is the house's own texturing
   * trick used for the one thing it is best at — a stack of slats *is* a run of
   * horizontal bands with a crisp seam between each pair, which is precisely
   * what a non-indexed cell plane gives for forty triangles. Fourteen instanced
   * leaves at forty triangles is less geometry than one bevelled box, against
   * the three hundred boxes a real louvre would have been.
   *
   * **The medio punto** is the half-round fanlight over the head, and it is the
   * one piece of this room that is not generic. A Havana opening is a rectangle
   * with a glazed semicircle over it, the glass is coloured, and no two in a
   * building are the same colour. So it is a half disc with three radiating bars
   * across it, instanced, and each instance takes its own colour from
   * `hueShift` on the palette's `curtain` entry through `setColorAt` — twenty
   * different panes for one draw call and no material per pane.
   *
   * None of the three casts. They are flat, they are in the plane of a wall that
   * is already receiving, and a cast shadow from a plane is a black line — the
   * exact case the shadow policy names. The leaves receive, because a shutter
   * lit differently from the wall it is set in is the artefact this is here to
   * avoid.
   */
  const openings = bays * 2;
  const revealMat = c.kit.solid(shade(blend(p.backdrop, p.proscenium, 0.12), 0.25), { rough: 0.98 });
  const reveals = new InstancedMesh(
    c.kit.geometry(`salon-reveal|${openW.toFixed(3)}`, () => new BoxGeometry(openW, DOOR_H, 0.02)),
    revealMat, openings,
  );
  const leafGeo = c.kit.own(cellPlane({
    width: openW, height: DOOR_H, cols: 1, rows: 18,
    colour: shade(blend(p.boards, p.backdrop, 0.4), 0.12), jitter: 0.17, rng: wallRng,
  }));
  const leaves = new InstancedMesh(
    leafGeo,
    c.kit.solid('#ffffff', { vertexColors: true, rough: 0.8, side: DoubleSide }),
    openings,
  );
  const glass = new InstancedMesh(
    c.kit.geometry(`salon-fan|${fanR.toFixed(3)}`, () => new CircleGeometry(fanR, 14, 0, Math.PI)),
    c.kit.solid('#ffffff', { rough: 0.3, metal: 0.15, side: DoubleSide }),
    openings,
  );
  const barGeo = c.kit.geometry(`salon-fanbar|${fanR.toFixed(3)}`, () => new BoxGeometry(0.035, fanR, 0.03));
  const bars = new InstancedMesh(barGeo, stone, openings * 3 + openings);
  const glassTint = new Color();

  let oi = 0;
  let bi = 0;
  for (const side of [-1, 1]) {
    for (let i = 0; i < bays; i++) {
      const zc = m.backZ + (i + 0.5) * bay;
      /** Which way this leaf faces, and how far it stands open. */
      const yaw = side * -Math.PI / 2;
      /**
       * Open, or shut, per bay.
       *
       * A building in a hot country airs itself unevenly — the shutters facing
       * the street are shut and the ones onto the gallery are open, and which
       * is which is a fact about the evening rather than about the decade. So it
       * is a draw off the `walls` stream: the same venue gets the same building
       * down to which door is open, and no era has to name a flag to get it. The
       * `open-air` modifier throws all of them, which is the whole of what that
       * flag does here.
       */
      const swung = openAir || wallRng.next() < 0.45;
      /**
       * Folded back, not standing out.
       *
       * This was 1.28 rad — a shade over a right angle — which is where a door
       * you have just walked through is and is the worst place a shutter can
       * be: the leaf sticks its full 1.4 m of width straight into the hall and
       * from the house it reads as a free-standing screen parked in the middle
       * of the floor, with nothing visibly holding it. A shutter that is open
       * for the evening is *pushed back against its own wall*, which is 2.15 rad
       * — past square, far edge 0.75 m proud rather than 1.35 m, lying along the
       * plaster instead of across the room. The gain is not subtlety: at the
       * bay nearest the stage the old angle put a panel in front of the band.
       */
      const a = swung ? 2.15 : 0;
      const h = openW / 2;

      dummy.rotation.set(0, yaw, 0);
      dummy.scale.setScalar(1);
      dummy.position.set(side * (halfX + 0.15), m.houseY + DOOR_H / 2, zc);
      dummy.updateMatrix();
      reveals.setMatrixAt(oi, dummy.matrix);

      dummy.rotation.set(0, yaw - a, 0);
      dummy.position.set(
        side * halfX - side * h * Math.sin(a),
        m.houseY + DOOR_H / 2,
        zc - side * h + side * h * Math.cos(a),
      );
      dummy.updateMatrix();
      leaves.setMatrixAt(oi, dummy.matrix);

      dummy.rotation.set(0, yaw, 0);
      dummy.position.set(side * (halfX - 0.012), transomY + 0.09, zc);
      dummy.updateMatrix();
      glass.setMatrixAt(oi, dummy.matrix);
      /**
       * ±75° of hue and a small saturation lift, not ±120° and a large one.
       * The wider spread gave every window in the hall a different primary and
       * the wall turned into a paint chart; the point of a medio punto is that
       * the panes are cut from the same few sheets, so they are *related* —
       * which is exactly what a rotation about the palette's own `curtain`
       * entry says, as long as the rotation is small enough to stay in the
       * family.
       */
      glassTint.set(hueShift(p.curtain, wallRng.float(-75, 75), 0.16));
      glass.setColorAt(oi, glassTint);

      // The transom bar under the glass, then three ribs radiating from its
      // centre — which is the whole of what makes a semicircle a fanlight.
      dummy.rotation.set(0, yaw, Math.PI / 2);
      dummy.position.set(side * (halfX - 0.03), transomY + 0.06, zc);
      dummy.scale.set(1, openW / fanR, 1);
      dummy.updateMatrix();
      bars.setMatrixAt(bi++, dummy.matrix);
      dummy.scale.setScalar(1);
      for (let k = 0; k < 3; k++) {
        const ang = ((k + 1) / 4) * Math.PI;
        dummy.rotation.set(0, yaw, Math.PI / 2 - ang);
        dummy.position.set(
          side * (halfX - 0.03),
          transomY + 0.09 + Math.sin(ang) * fanR / 2,
          zc - side * Math.cos(ang) * fanR / 2,
        );
        dummy.updateMatrix();
        bars.setMatrixAt(bi++, dummy.matrix);
      }
      oi++;
    }
  }
  leaves.receiveShadow = true;
  root.add(reveals);
  root.add(leaves);
  root.add(glass);
  root.add(bars);

  /**
   * The cornice, round all four walls.
   *
   * One continuous band at the wall head, 0.45 m deep and standing 0.16 m proud,
   * and it is the single object that makes this a finished room rather than four
   * rendered surfaces meeting at an edge. It is also the top of the aperture —
   * see `CORNICE_H` — so where it runs is where every hung prop in the room
   * stops.
   *
   * It casts. It is the one piece of relief in the room deep enough to throw
   * anything, and a hard line of shadow under a cornice is most of what says the
   * light is coming from below.
   */
  const corniceMat = c.kit.solid(tint(stoneColour, 0.08), { rough: 0.78 });
  const corniceY0 = corniceY + CORNICE_H / 2;
  for (const side of [-1, 1]) {
    const run = new Mesh(
      c.kit.bevelBox(sideDepth, CORNICE_H, CORNICE_OUT * 2, 0.03), corniceMat);
    run.position.set(side * (halfX - CORNICE_OUT), corniceY0, m.backZ + sideDepth / 2);
    run.rotation.y = Math.PI / 2;
    run.castShadow = true;
    root.add(run);
  }
  for (const [z, w] of [[houseBackZ - CORNICE_OUT, halfX * 2], [m.backZ + CORNICE_OUT, halfX * 2]] as const) {
    const run = new Mesh(c.kit.bevelBox(w, CORNICE_H, CORNICE_OUT * 2, 0.03), corniceMat);
    run.position.set(0, corniceY0, z);
    run.castShadow = true;
    root.add(run);
  }

  // --- the lid -------------------------------------------------------------
  /**
   * A coffered plaster ceiling, and the ribs are the datum rather than the
   * panels.
   *
   * That is the way round a coffered ceiling is actually built and it is also
   * the way round that makes `headroom` a number anybody can use: the ribs are
   * at the published lid and the panels are sunk 0.16 m *above* it, so the
   * lowest point of the ceiling is exactly the height this room told the rest of
   * the show it was. A ceiling with beams hanging below its published plane
   * would put the plane inside the beams, which is the same class of mistake as
   * a fly bar inside a soffit.
   *
   * `cellPlane` for the panels, and it is the better half of the argument rather
   * than a habit: a hemisphere lights a flat plane to *one number*, so a lid
   * whose normal never changes gets identical light at every pixel and reads as
   * a hole rather than as a ceiling, however well the colour is chosen. Cells
   * give it a grain for nothing. `DoubleSide` and hung the same way up as the
   * cellar's, because a hemisphere lights a single-sided plane from whichever
   * face it has and a ceiling lit from above is a ceiling the room cannot see.
   *
   * Neither casts nor receives. It is above every fixture in the rig, so a
   * shadow on it would have to have been cast upward.
   */
  const lidW = halfX * 2;
  const lidD = houseBackZ - m.backZ;
  const panels = new Mesh(
    c.kit.own(cellPlane({
      width: lidW, height: lidD,
      cols: Math.max(4, Math.round(lidW / 1.2)),
      rows: Math.max(4, Math.round(lidD / 1.2)),
      colour: shade(blend(p.proscenium, p.backdrop, 0.44), 0.24),
      jitter: 0.07, rng: c.rng('ceiling'),
    })),
    c.kit.solid('#ffffff', { vertexColors: true, rough: 0.97, side: DoubleSide }),
  );
  panels.rotation.x = -Math.PI / 2;
  panels.position.set(0, lidY + 0.16, (m.backZ + houseBackZ) / 2);
  root.add(panels);

  /**
   * The ribs. Across the hall on the bay module, and two down its length, which
   * turns the lid into coffers rather than joists — a run of parallel beams is
   * the dance hall's boarded ceiling and a grid is a plastered one.
   */
  const ribMat = c.kit.solid(tint(stoneColour, 0.04), { rough: 0.9 });
  const crossRibs = Math.max(3, Math.round(lidD / bay));
  const crossStep = lidD / crossRibs;
  const ribs = new InstancedMesh(
    c.kit.bevelBox(lidW, 0.17, 0.22, 0.02), ribMat, crossRibs + 1);
  for (let i = 0; i <= crossRibs; i++) {
    dummy.position.set(0, lidY + 0.085, m.backZ + i * crossStep);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    ribs.setMatrixAt(i, dummy.matrix);
  }
  root.add(ribs);
  for (const side of [-1, 1]) {
    const spine = new Mesh(c.kit.bevelBox(lidD, 0.17, 0.22, 0.02), ribMat);
    spine.position.set(side * lidW * 0.26, lidY + 0.085, (m.backZ + houseBackZ) / 2);
    spine.rotation.y = Math.PI / 2;
    root.add(spine);
  }

  // --- the fans ------------------------------------------------------------
  /**
   * Ceiling fans, down the centre line of the house, on long rods.
   *
   * See `fanY` for the height and why it is solved rather than picked. The x is
   * the part `sabha.ts` paid for: fans at ±0.3 of the house width are outside
   * the horizontal field of every wide shot in that room, so these are at x = 0,
   * strung down the middle of the floor — which is also simply where a hall's
   * fans run, because that is where the people are.
   *
   * They start 1.9 m downstage of the lip and stop 1.6 m short of the back wall,
   * which keeps them off two things: the `mirror-ball`, which hangs at
   * `lipZ - 1.4` on the same centre line and would otherwise share a metre of
   * air with the nearest blade, and the bar. Three of them at the sizes this
   * genre builds.
   *
   * Each fan is one `InstancedMesh` of four blades — rotating the mesh rotates
   * every instance with it, so a turning fan is one draw call and one matrix
   * write per frame rather than four meshes and a group. They turn slowly and
   * not quite in step: a room full of fans running in phase is a machine, and
   * these are four different ages of the same fitting. Under reduced motion they
   * crawl, for the reason the neon stops flickering.
   *
   * Neither casts nor receives, like everything else overhead.
   */
  const fanBlades: { mesh: InstancedMesh; rate: number }[] = [];
  const fanRng = c.rng('ceiling');
  const fanFrom = m.lipZ + 1.9;
  const fanTo = houseBackZ - 1.6;
  const fans = Math.max(2, Math.min(4, Math.round((fanTo - fanFrom) / 3.1)));
  const bladeY = fanY(lidY);
  const rodMat = c.kit.solid(shade(p.proscenium, 0.62), { metal: 0.5, rough: 0.5 });
  const bladeMat = c.kit.solid(shade(blend(p.boards, p.backdrop, 0.3), 0.2), { rough: 0.7 });
  const bladeGeo = c.kit.bevelBox(0.19, 0.022, 0.72, 0.01);
  for (let i = 0; i < fans; i++) {
    const z = fans === 1 ? (fanFrom + fanTo) / 2 : fanFrom + (i / (fans - 1)) * (fanTo - fanFrom);
    const rodH = lidY - bladeY;
    const rod = new Mesh(c.kit.bevelBox(0.05, rodH, 0.05, 0.02), rodMat);
    rod.position.set(0, bladeY + rodH / 2, z);
    root.add(rod);
    const hub = new Mesh(c.kit.bevelBox(0.26, 0.09, 0.26, 0.035), rodMat);
    hub.position.set(0, bladeY, z);
    root.add(hub);

    const blades = new InstancedMesh(bladeGeo, bladeMat, 4);
    for (let b = 0; b < 4; b++) {
      const ang = (b / 4) * Math.PI * 2;
      dummy.position.set(Math.sin(ang) * 0.46, 0, Math.cos(ang) * 0.46);
      dummy.rotation.set(0, ang, 0.08);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      blades.setMatrixAt(b, dummy.matrix);
    }
    blades.position.set(0, bladeY - 0.035, z);
    blades.rotation.y = fanRng.float(0, Math.PI / 2);
    root.add(blades);
    fanBlades.push({ mesh: blades, rate: fanRng.float(0.5, 0.78) });
  }

  // --- what the lamps hang on ---------------------------------------------
  /**
   * A scaffold pipe on two drop-rods off the ceiling ribs.
   *
   * `RoomRig.flyBar` is explicit that a bare group at a height nothing reaches
   * is the one thing that is not allowed, so the rods run from the pipe up to
   * the rib plane and their length is measured from the published numbers rather
   * than guessed — if `flyY` ever moves, the steel follows it. `lights.ts` then
   * hangs its pars along the bar's local x without knowing or caring that this
   * is a length of barrel somebody lashed up rather than a counterweighted
   * batten, which is the whole point of the field.
   */
  const flyBar = new Group();
  flyBar.name = 'fly-bar';
  flyBar.position.set(0, m.flyY, m.curtainZ - 1.1);
  const pipe = new Mesh(
    c.kit.bevelBox(m.openingWidth + 1.0, 0.085, 0.085, 0.042),
    c.kit.solid(shade(p.proscenium, 0.6), { metal: 0.55, rough: 0.45 }),
  );
  flyBar.add(pipe);
  const rodH = Math.max(0.08, lidY - m.flyY - 0.043);
  for (const side of [-1, 1]) {
    const rod = new Mesh(
      c.kit.bevelBox(0.035, rodH, 0.035, Math.min(0.016, rodH * 0.3)),
      c.kit.solid(shade(p.proscenium, 0.72), { metal: 0.5, rough: 0.5 }),
    );
    rod.position.set(side * (m.openingWidth / 2 - 0.7), rodH / 2, 0);
    flyBar.add(rod);
  }
  root.add(flyBar);

  /**
   * No cloth, and therefore no curtain.
   *
   * See `RoomRig.curtain`: `noCurtain()` reports the cloth as being exactly
   * where the show asked for it, immediately, so `show.ts` never stalls waiting
   * for travel that will not happen and the band is still hidden while it is
   * being staged. The reveal is a cut, and in a hall where the floor was full
   * before the band came on — which is one of this genre's own opening blurbs —
   * that is what happens. They walk on.
   */
  const curtain = noCurtain();
  root.add(curtain.root);

  const idle = c.reducedMotion ? 0.16 : 1;
  return {
    root,
    flyBar,
    curtain,
    update(_t: number, dt: number): void {
      for (const fan of fanBlades) fan.mesh.rotation.y += dt * fan.rate * idle;
    },
  };
}

export const salon: RoomBuilder = { shape, build };
