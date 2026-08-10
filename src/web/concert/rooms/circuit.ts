/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The circuit — a big dark room in a different town every night, and a rig.
 *
 * Every other room in this directory is somewhere. A proscenium house is a
 * building with a date on it; a courtyard is a courtyard; a tanssilava is at
 * the edge of a named lake. This one is the opposite claim, and the claim is
 * the whole design: **the room says nothing about where it is, and the rig says
 * everything about what the show is.** A band on this circuit played a 1965
 * ballroom, a 1972 civic hall, a 1982 arena and a 1993 club, and the reason the
 * photographs of those four nights are recognisably one band is that the only
 * constant in them is the equipment. The building behind it is large, dark,
 * and deliberately illegible.
 *
 * So this file builds less architecture than any of its siblings, on purpose.
 * There is no arch, no plaster, no timber, no ornament, no cloth and no
 * masking. There is a floor, four surfaces falling away into black, a deck at
 * the front of it with a drop off the edge, a structural roof too far up to
 * read, and a pipe on motor chains. Anything more decorative than that would be
 * telling the audience which town they are in, which is the one thing this room
 * must not do.
 *
 * ## Why it could not be four modifiers on the proscenium
 *
 * `proscenium.ts` argues that four `if`s is the number that fits in one file
 * and the fifth is the one that turns it into a lookup table. This room would
 * have been the fifth, and it would have been the worst of them, because none
 * of what it needs is a colour: the boards stand half a metre higher than any
 * other room in the project, the aperture is wider than the stage rather than
 * narrower, the lids are gone, the walls are metres further out, and the thing
 * lamps hang from is flown off a steel roof rather than out of a fly tower.
 * That is five of the eight numbers in `RoomShape` and every object in the
 * build, which is a building, not a flag.
 *
 * ## What the room may not draw, and it is most of the arena
 *
 * `rock/staging.ts` names `truss`, `screen`, `crowd-barrier`, `pa-stack` and
 * `backline` as props, and between them those *are* the arena set — the
 * lighting lattice, the video wall, the steel across the pit, the PA and the
 * band's own cabinets. Every one of them belongs to `stage-props.ts`, which
 * places them for every room at once, so a circuit that drew its own would draw
 * each of them twice with a few centimetres of parallax between the copies —
 * the collision `RoomDatum.props` exists to make impossible rather than merely
 * unlikely.
 *
 * What is left over is exactly the building: the concrete, the dark, the deck,
 * the roof and the pipe. It is a short list and it is the right one, and the
 * two places where this file and the props have to agree about a *number* are
 * argued where those numbers are set — see `headroom` in `shape()` and the fly
 * bar's z in `build()`.
 *
 * ## The eras do not branch, and one of them is a different building
 *
 * A room cannot see the era and should not be given a way to. `RoomDatum`
 * carries the venue, the boards, the house and the props, and the era reaches
 * this file only through the two channels a genre author already has: the
 * *size*, through `StageDressing.grow`, and the *modifiers*, through `props`.
 * That is enough, and it is enough on purpose — a room that switched on
 * `'arena'` would be a room only rock could ever use, and the registry in
 * `./index.ts` exists precisely so that a `ballroom`, a `dancehall` and a
 * `circuit` in three genres are one file.
 *
 * So three of rock's four eras are one building at three sizes, and this file
 * scales continuously off `d.width` rather than stepping: `grow` takes the
 * stage from 11 m to 13.5 m and everything here — the deck height, the
 * aperture, the rig, the roof, the walls — follows it. The 1965 ballroom comes
 * out a smaller, lower, tighter version of the 1982 arena, which is what those
 * two rooms actually were to a band that played both of them.
 *
 * The fourth, 1993, names `low-ceiling`, and that one *is* a different
 * building: a lid comes in, the deck drops to a kerb, the walls close to the
 * minimum and the rig comes down to a pipe under the soffit. It is the same
 * anonymity at a tenth of the volume, which is the joke the era is making.
 *
 * ## `open-air` is refused, and refusing it is the point
 *
 * No era of the one genre that names this architecture asks for it, and it
 * would not be a modifier here even if one did. Everywhere else `open-air`
 * *removes*: the tanssilava's walls come off and a sky goes behind. Here the
 * roof is not decoration — it is the only structure overhead, and it is what
 * the fly bar's motor chains are shackled to. Taking it away leaves the rig
 * hanging from the sky, which is the exact failure `BUILDERS.truss` names in
 * `stage-props.ts` and writes a stub of steel out of frame to avoid. A festival
 * has a stage roof on towers standing on the field, and that is a second
 * building with a ground-support structure in it, not a flag on this one. When
 * a genre wants it, it wants a sibling of this file.
 *
 * `black-box`, `brick` and `haze` are ignored for shorter reasons. This room is
 * already a black box — matte black on every surface and no ornament is its
 * resting state, so the modifier would change nothing. `brick` is a wall you
 * are meant to read, and a wall you are meant to read is the one thing a
 * deliberately anonymous hall cannot have. `haze` is air rather than
 * architecture: `stage.ts` reads it directly off the venue and puts another
 * three cards of it in the beam, and there is nothing for a room to add.
 */

import {
  BoxGeometry, DoubleSide, Group, InstancedMesh, Mesh, Object3D,
} from 'three';

import {
  blend, cellPlane, shade, tint, LOW_CEILING, STAGE_SOFFIT,
} from '../stage-kit.js';
import {
  noCurtain, type RoomBuilder, type RoomContext, type RoomDatum, type RoomRig,
  type RoomShape,
} from './types.js';

/**
 * How high the deck stands, as a fraction of the stage's own width.
 *
 * The tallest rise in the project, and the one room where that is right. A
 * proscenium house lifts the band 0.9 m over a standing crowd because that is
 * what a stage in a building with seats in it is; a touring deck is scaffold
 * and it is built to the height that lets nine thousand people standing on a
 * flat floor see over the eight rows in front of them. That is knee height on a
 * theatre stage and chest height on this one.
 *
 * It scales with the stage rather than being fixed because the eras arrive as
 * sizes and nothing else — see the header. A 1965 ballroom at 11 m gets 1.16 m
 * and a 1982 arena at 13.5 m gets 1.42 m, which is the difference between a
 * platform somebody built into the end of a dance hall and a deck that came off
 * a truck.
 *
 * ## What the number actually costs, measured
 *
 * `rise` is not a decoration: it sets `houseY`, and `houseY` sets the crowd.
 * `crowdExtent` puts the top of the tallest head at `houseY + 2.17` in a
 * standing house of eight rows, so at 1.42 m the back row's crowns sit 0.75 m
 * above the boards — under the knees of a standing player, where a proscenium's
 * 0.9 m puts them at 1.27 m, up around the waist. That is the picture this
 * number is bought for and it is the arena photograph exactly: a band on a
 * lit shelf with a dark field of heads below it.
 *
 * It costs two things and both were checked before it was committed. The house
 * camera at `DEFAULT_CAMERA` is `[0, 2.4, 11]` in the *boards'* frame, so it
 * does not move with the rise and the band is framed exactly as it is
 * everywhere else — but it now stands 3.8 m above the house floor rather than
 * 3.3 m, which tips the crowd slightly further below the lens. That reads as a
 * camera on a riser at front of house, which is where an arena camera is.
 * `camera.ts`'s floor for a lens standing in the house is `houseY + ROOM_GAP`,
 * so the low shots gain half a metre of travel rather than losing any.
 *
 * The ceiling of 1.45 m is where it stops being a stage and starts being a
 * balcony: much above that and the front row is looking at the underside of the
 * deck, and `crowd-barrier` — which stands in the house at `lipZ + 0.82` with a
 * 1.08 m rail — stops reading as a barrier holding a crowd off the stage and
 * starts reading as a fence at the bottom of a wall.
 */
const DECK_RATIO = 0.105;
const DECK_MIN = 1.0;
const DECK_MAX = 1.45;

/**
 * The kerb the 1993 room gets instead, and it is `CELLAR_RISE` by another name.
 *
 * Deliberately the same argument `proscenium.ts` makes for a basement, because
 * it is the same fact about small rooms: there is a fixed distance between a
 * floor and a ceiling, `STAGE_SOFFIT` needs air over the tallest player's head,
 * and every centimetre the deck gives up is a centimetre the lid does not have
 * to. 0.45 m rather than the cellar's 0.4 m for the one reason that differs —
 * this house is *standing*, not seated, and a standing head is 1.62 m off the
 * floor against a seated one's 1.14 m, so the deck has to buy back what it can.
 * It does not buy back much. A club stage is a room where the front row can put
 * a drink on the monitor, and that is the honest picture.
 */
const CLUB_RISE = 0.45;

/**
 * How far the deck runs past the boards at each side.
 *
 * The boards are the datum — `cast.ts` clamps players inside them and no room
 * may argue — but a touring deck is not the same shape as the playing area. It
 * is built out of a fixed size of scaffold decking and it is always wider than
 * the band, because that is where the amp tech stands, where the spare guitars
 * live and where the wedges come off. A stage that stopped exactly at the last
 * player's elbow would be a plinth.
 *
 * Just under a metre, which is two decks of real staging, and it is what makes
 * the aperture the widest in the project — see `openingWidth`.
 */
const WING = 0.95;

/**
 * Where the bar trims, as a fraction of the aperture. See `flyY` in `shape()`,
 * which is where the arithmetic that picked it is written down.
 */
const FLY_TRIM = 0.74;

/** How far outside the house the black walls stand. See `build`. */
const HALL_OUT = 3.5;
/** How far past the last row the hall goes, and how far behind the drape. */
const HALL_BEHIND = 6;
const HALL_UPSTAGE = 3;

/**
 * How high the steel is, as a fraction of the stage's width.
 *
 * Not a fraction of anything the band can reach, deliberately: an arena roof is
 * a fact about the *building* and the building scales with the show it was
 * built to hold. 10.5 m over a 13.5 m stage, 8.6 m over an 11 m one, and both
 * are far enough above the rig that the eye reads them as structure rather than
 * as a ceiling. The floor of `flyY + 2.6` is there so that the motor chains are
 * always long enough to be chains; a roof a handspan over the pipe is a lid.
 */
const ROOF_RATIO = 0.78;
const ROOF_CLEAR = 2.6;

function shape(d: RoomDatum): RoomShape {
  /**
   * The 1993 room, and the only era of the four that is a different building.
   * See the header. It is read here rather than in `build` because six of the
   * eight numbers change with it.
   */
  const club = d.props.has('low-ceiling');
  const rise = club
    ? CLUB_RISE
    : Math.max(DECK_MIN, Math.min(d.width * DECK_RATIO, DECK_MAX));

  /**
   * **The aperture is the deck**, and this is the widest one in the project.
   *
   * A proscenium takes 0.94 of the stage because the outer 6 % is behind a
   * tormentor. A courtyard takes 1.0 because there is no tormentor. This room
   * takes *more than the stage is wide*, and the reason is not bravado: there
   * is nothing at the sides of a touring stage at all — no leg, no arch, no
   * wall within eight metres — so the gap the audience sees the band through is
   * the whole deck, and the deck is wider than the boards by `WING` at each
   * side. Saying anything smaller would be inventing masking that is not there.
   *
   * The rule in `RoomShape` — never narrower than the playing area, because
   * `cast.ts` clamps players to a hardcoded `width/2 - 0.5` with no sight of
   * this file — is satisfied with 2.9 m to spare rather than 0.6 m.
   *
   * Measured across the whole catalogue it comes out at 1.14 to 1.17 of the
   * stage in the four rock eras, against a concert hall's 1.07 and a
   * proscenium's 0.94, so this is the widest aperture in the project by a
   * clear margin and the ranking is the point rather than an accident.
   *
   * It is worth being exact about what it buys, because everything hung reads
   * it. `lights.ts` runs its pars out to `openingWidth / 2 - 0.8`, so the front
   * lamps sit over the ends of the deck instead of over the band; the cyclorama
   * glow is `openingWidth * 1.02` wide, which is why the drape below is sized
   * off the aperture and not off the stage; and `truss` spans `openingWidth +
   * 1.8`, so the lattice overhangs the deck by 0.9 m at each end exactly as a
   * rigged truss does. A narrower aperture would have pulled all three of those
   * inboard of the deck and made an arena rig look like a theatre's.
   */
  const openingWidth = d.width + WING * 2;

  /**
   * How high the picture goes, which in a room with no arch is the air the
   * show happens in rather than a header.
   *
   * Nothing here has a top edge to measure — that is the point of the room —
   * so this is the volume everything the audience is meant to look at fits
   * inside: the rig hangs in the top quarter of it, the cyclorama glow fills
   * it, the video wall sits in the middle of it and the drape carries on past
   * it. `width * 0.5` against the proscenium's `width * 0.44`, and a 7.2 m
   * ceiling on it rather than 6.4 m, because a hall built for nine thousand
   * people is taller over the stage than a theatre is and every one of those
   * consumers should scale with it.
   *
   * It is deliberately *not* the roof. `lights.ts` hangs the follow spot at
   * `openingHeight + 1.35` and aims it at faces from front of house; solved
   * against a 10.5 m roof that fixture ends up at 11.8 m and 7.8 m out, which
   * is a 57° down-angle — a top light, not a follow spot, and every face in the
   * show lit from the hairline. The same arithmetic runs through the wash, the
   * key and the back light. The aperture is what the audience looks through,
   * and in this room the audience is not looking at the roof.
   *
   * Under a lid it is the soffit exactly. A club's picture is bounded above by
   * the ceiling and by nothing else, and saying so keeps the dressing under the
   * plaster: `neon` hangs its sign at `min(openingHeight - 0.5, …)`, which at a
   * proscenium's 3.6 m opening is 3.1 m and *through* a 2.85 m soffit, and at
   * this room's 2.85 m opening is 2.35 m and under it.
   */
  const openingHeight = club
    ? STAGE_SOFFIT
    : Math.max(4.4, Math.min(d.width * 0.5, 7.2));

  return {
    rise,
    openingWidth,
    openingHeight,
    /**
     * Where a cloth would be, and there is no cloth. It still has to be the
     * front of the room, because `stage-props.ts` hangs the downstage truss run
     * at `curtainZ - 1.1` and `drapes` at `curtainZ - 1.6`. Half a metre in
     * from the lip: far enough upstage that the rig is over the deck rather
     * than over the pit, and far enough downstage that the front line is lit
     * from in front of itself rather than from above.
     */
    curtainZ: d.lipZ - 0.5,
    /**
     * Where the bar trims, and it is a fraction of the picture rather than a
     * handspan under the top of it. **This number was moved after looking at
     * the room, and the measurement is worth writing down.**
     *
     * `openingHeight - 0.4` is the proscenium's rule and it is the right rule
     * in a theatre, where the bar is behind the header and being at the top of
     * the arch is what a fly bar *is*. It put this room's rig above the top of
     * every frame the show composes. The wide shot solves to about 12.5 m for
     * a 13.5 m stage, `wideEye` lifts the lens to 3.6 m and it tilts down 9.8°
     * onto `WIDE_AIM_Y`, so with a 42° vertical field the top edge of frame
     * passes through 5.4 m at the bar's own z — and the bar was at 6.35 m, a
     * metre above it, with `truss` a further 0.34 m up. The one room in the
     * project whose whole claim is that *the rig is the architecture* was
     * hanging its rig out of shot. The proscenium has the same problem 0.6 m
     * less badly, which is exactly why it went unnoticed.
     *
     * Three quarters of the way up the picture puts the bar at 5.0 m in the
     * arena and the truss's lower chord at 5.17 m, both inside the frame, and
     * it is also what an arena rig does: the trim height is well below the roof
     * because there are several bars in the air and the audience sees the
     * lowest one. In the ballroom it lands at 4.07 m against the proscenium's
     * 4.49 m in the same room — 0.4 m lower, which is a lighting bar over a
     * dance hall rather than a fly floor, and still 1.4 m clear of
     * `HANG_FLOOR`.
     *
     * Under a lid it is `proscenium.ts`'s cellar arithmetic unchanged, for the
     * reason that file gives: a bar cannot be higher than the room, so where
     * there is no fly tower it is a length of scaffold on drop-arms a handspan
     * under the plaster.
     */
    flyY: club ? STAGE_SOFFIT - 0.13 : openingHeight * FLY_TRIM,
    /**
     * **`Infinity`, with a steel roof ten metres up, and that is the honest
     * answer rather than a convenient one.**
     *
     * This field is not a description of the ceiling. `RoomShape` says what it
     * is for in two clauses — the camera keeps `LENS_GAP` under it and every
     * hanging prop clamps to it — and then says that a height nobody can reach
     * is the honest way to publish "nothing is in your way". An arena roof is
     * that height. The camera's wide shot tops out at 3.6 m, the tallest piece
     * of dressing in the vocabulary reaches about 5 m, and neither is within
     * five metres of the steel.
     *
     * Publishing the roof instead breaks the two props this room exists to
     * stage, and both failures were measured before this line was written.
     * `BUILDERS.truss` hangs at `headroom - 0.28` when the number is finite, so
     * the arena's own lighting lattice — the object the whole era is about —
     * would fly up to 10.25 m, five metres above the pars hanging on the bar
     * underneath it, reading as roof steel rather than as a rig. And
     * `chandelier`, which the 1965 era draws one time in five, hangs at
     * `houseLid - LENS_GAP`: 7.98 m in that room, on a 0.08 m stem, over the
     * middle of the house. Both are the floating-lamp bug that `houseLid` was
     * split out of `headroom` to stop, arrived at from the other end.
     *
     * The lid is real in the small room and both numbers say so there, which is
     * the case that proves the field is being used rather than dodged: the
     * `low-ceiling` prop draws the plaster at `houseY + LOW_CEILING` and the
     * soffit at `STAGE_SOFFIT`, and these are those two heights, so the camera
     * and the dressing clear a ceiling that is exactly where it is drawn.
     */
    headroom: club ? Math.min(-rise + LOW_CEILING, STAGE_SOFFIT) : Infinity,
    houseLid: club ? -rise + LOW_CEILING : Infinity,
    /**
     * The drape behind the band, measured from the house floor like a wall.
     *
     * Tall — over ten metres in the arena — and it has to be, for a reason
     * `lights.ts` states from the other side: the cyclorama glow is drawn *on*
     * this surface at `openingHeight * 1.06`, and a backdrop shorter than the
     * glow puts a lit rectangle in the air above it, hard-edged and attached to
     * nothing. Two metres of margin over the rig, plus the rise, because the
     * number is measured from the floor and the aperture is measured from the
     * boards.
     *
     * In the small room it is the house lid exactly, so the cloth dies into the
     * plaster instead of stopping in front of it.
     */
    backdropHeight: club ? LOW_CEILING : openingHeight + rise + 2.0,
    /**
     * The brick, and in an arena it is a long way out.
     *
     * `HALL_OUT` is the 3.5 m this room spends to say the crowd is not the edge
     * of the building, and it is the widest answer in the directory — which is
     * exactly why `RoomShape.wallX` had to become a published number rather
     * than something a prop guessed at `houseWidth / 2 + 0.55`.
     */
    wallX: d.houseWidth / 2 + (club ? 0.6 : HALL_OUT),
  };
}

function build(c: RoomContext): RoomRig {
  const p = c.venue.palette;
  const m = c.m;
  const club = c.props.has('low-ceiling');
  const rise = -m.houseY;

  const root = new Group();
  root.name = `room:${c.venue.id}`;

  /**
   * The box the hall is, and it is much bigger than the show in it.
   *
   * The minimum a room may use is `houseWidth / 2 + 0.6` at the sides and
   * `lipZ + houseDepth + 1.6` downstage, which is what the proscenium takes:
   * walls a handspan outside the last seat, because a theatre is a room built
   * tightly round its audience. This one takes 3.5 m and 6 m instead, and the
   * extra is the single most characteristic thing about the building.
   *
   * It is also the honest answer to a question this room cannot ask. An arena
   * crowd goes back forty rows and this one goes back eight, and there is no
   * way for a room to change that: `houseDepth` and `houseWidth` are
   * `RoomDatum`, derived in `stage.ts` from `venue.audience.rows` and the row
   * gap `stage-audience.ts` owns, and four other files have already solved
   * against them. A room that wanted a deeper house would be moving the crowd,
   * the camera's travel and the tomato bounds from behind their backs.
   *
   * What it *can* do is stop pretending the crowd is the edge of the building.
   * The floor runs 6 m past the last row and the walls stand 3.5 m outside the
   * last person in each row, so what the camera finds beyond the audience is
   * more dark floor rather than a wall — which is what the back of a hall
   * looks like from the stage, and is the difference between eight rows in a
   * room and eight rows in a *big* room.
   *
   * The small room gives all of it back and takes the minimum, because the
   * whole point of 1993 is that the walls are close enough to touch.
   */
  const wallX = m.houseWidth / 2 + (club ? 0.6 : HALL_OUT);
  const hallBackZ = m.lipZ + m.houseDepth + (club ? 1.6 : HALL_BEHIND);
  const hallFrontZ = m.backZ - (club ? 0.8 : HALL_UPSTAGE);
  /** The steel, or the plaster the `low-ceiling` prop is about to draw. */
  const roofY = club
    ? m.houseLid
    : Math.max(m.flyY + ROOF_CLEAR, m.width * ROOF_RATIO);

  // --- the floor -----------------------------------------------------------
  /**
   * Concrete, and it goes to the walls.
   *
   * Same one-draw-call trick as every other floor in this directory and the
   * same stream name, so the rooms stay comparable seed for seed — but square
   * bays a metre and a half across rather than the proscenium's planks or the
   * courtyard's flags. That is the whole visual difference between a floor that
   * was laid and a floor that was poured, at any distance a camera stands, and
   * it is the only thing under the crowd that says what kind of building this
   * is.
   *
   * Colour is `boards` pulled three quarters of the way to `backdrop` and then
   * darkened hard. The palette's `boards` entry is the *deck*, which in this
   * room is a steel-and-ply platform standing on a slab, and a slab the colour
   * of the platform on it is one flat field with a band floating in the middle
   * of it.
   *
   * It spans the whole hall so that every edge of it dies into a wall. An edge
   * in mid-air is what reads as a plane rather than as a surface — the failure
   * the cellar's ceiling had — and it costs nothing to avoid here because the
   * cells scale with the size.
   */
  const floorW = wallX * 2;
  const floorD = hallBackZ - hallFrontZ;
  const floor = new Mesh(
    c.kit.own(cellPlane({
      width: floorW, height: floorD,
      cols: Math.max(6, Math.round(floorW / 1.5)),
      rows: Math.max(6, Math.round(floorD / 1.5)),
      colour: shade(blend(p.boards, p.backdrop, 0.75), 0.42),
      jitter: 0.1, rng: c.rng('housefloor'),
    })),
    c.kit.solid('#ffffff', { vertexColors: true, rough: 0.96 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, m.houseY, (hallFrontZ + hallBackZ) / 2);
  floor.receiveShadow = true;
  root.add(floor);

  // --- the drape -----------------------------------------------------------
  /**
   * What is behind the band when the band brought everything itself: a black
   * cloth on a bar, and nothing else.
   *
   * This is the one surface in the room the audience looks at for two hours, so
   * it is the one place the anonymity has to be built rather than merely
   * asserted — a plain dark plane is a hole, and a hole is what the eye reads
   * when a large flat colour has no grain in it at all. Cells two metres wide
   * and a third of the height tall make it a run of hung panels: the seams are
   * vertical, they are where a real drape is sewn and laced, and they give the
   * cyclorama glow something to sit on.
   *
   * Wider than the aperture rather than than the stage, by 15 %, and that is a
   * number with a consumer. `lights.ts` draws the cyc glow at `openingWidth *
   * 1.02` and hangs it a hair downstage of this cloth; a drape sized off the
   * boards would be narrower than its own glow, and the glow's ends would hang
   * off both sides of it into the dark.
   *
   * It receives. A shadow lands on a backdrop; a backdrop that cast one would
   * be casting it onto the wall four metres behind it, which nothing can see.
   * The `backline` and `pa-stack` props stand cabinets in front of it and the
   * `screen` prop hangs a video wall 0.08 m downstage of it — this file draws
   * none of those, and what it draws is the dark plane they are silhouetted
   * against.
   */
  const drapeW = m.openingWidth * 1.15;
  const drapeH = m.backdropHeight;
  const drape = new Mesh(
    c.kit.own(cellPlane({
      width: drapeW, height: drapeH,
      cols: Math.max(5, Math.round(drapeW / 2.0)),
      rows: Math.max(3, Math.round(drapeH / 2.6)),
      colour: shade(p.backdrop, 0.18), jitter: 0.09, rng: c.rng('backdrop'),
    })),
    c.kit.solid('#ffffff', { vertexColors: true, rough: 0.98 }),
  );
  drape.position.set(0, drapeH / 2 - rise, m.backZ - 0.1);
  drape.receiveShadow = true;
  root.add(drape);

  // --- the dark ------------------------------------------------------------
  /**
   * Four walls, and the intention is that you never quite see them.
   *
   * Near black — the palette's own `backdrop` darkened by a further two thirds,
   * which on this genre's arena entry is `#050609` — so what actually paints
   * them is the fog. `stage.ts` builds a `Fog` from `venue.fog` at 0.45, which
   * puts the near plane at 8.6 m and the far at 52.8 m; the side walls stand
   * about 12 m from the house camera and come out around a twelfth of the way
   * to the fog colour. That is a surface you can tell is there and cannot read,
   * which is exactly the brief: large and dark, and no information about the
   * town.
   *
   * They are drawn at all for two reasons and neither is decoration. A camera
   * that finds no wall finds the page's clear colour, and a flat void is what
   * reads as *out of bounds* rather than as darkness — the failure the
   * tanssilava's sky dome was written after. And a roof needs something to
   * terminate against: a lid over a room with no walls is a slab hanging in
   * space, which is what the cellar's ceiling looked like from every angle that
   * could see its edge.
   *
   * **Four rather than the proscenium's three.** A theatre has no upstage wall
   * because a cloth is stretched across the whole opening and nothing is ever
   * behind it. Here the drape is 3 m downstage of the back of the hall with the
   * flight cases behind it, it is narrower than the room, and the gap between
   * the top of it and the steel is a metre and a half of open air — so from a
   * wide shot you look straight past both ends of the cloth and over the top of
   * it into whatever is back there. A fourth wall makes that "more dark hall".
   *
   * **Single-sided**, like every other room here, and for the reason
   * `proscenium.ts` gives: orbit yaw is not clamped, swinging round the outside
   * of the building is a thing a viewer does in the first ten seconds, and a
   * solid wall answers that with a black screen where a single-sided one lets
   * you look straight in. They receive, because a wall is what a shadow lands
   * on; they do not cast, because a plane's cast shadow is a black line.
   */
  const wallRng = c.rng('walls');
  const wallH = roofY - m.houseY;
  const wallMat = c.kit.solid('#ffffff', { vertexColors: true, rough: 0.97 });
  const wall = (w: number, h: number): Mesh => new Mesh(
    c.kit.own(cellPlane({
      width: w, height: h,
      cols: Math.max(4, Math.round(w / 2.6)),
      rows: Math.max(3, Math.round(h / 2.6)),
      colour: shade(p.backdrop, 0.66), jitter: 0.12, rng: wallRng,
    })),
    wallMat,
  );

  const hallDepth = hallBackZ - hallFrontZ;
  for (const side of [-1, 1]) {
    const mesh = wall(hallDepth, wallH);
    mesh.position.set(side * wallX, m.houseY + wallH / 2, (hallFrontZ + hallBackZ) / 2);
    mesh.rotation.y = side * -Math.PI / 2;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
  const rear = wall(wallX * 2, wallH);
  rear.position.set(0, m.houseY + wallH / 2, hallBackZ);
  rear.rotation.y = Math.PI;
  rear.receiveShadow = true;
  root.add(rear);

  const upstage = wall(wallX * 2, wallH);
  upstage.position.set(0, m.houseY + wallH / 2, hallFrontZ);
  upstage.receiveShadow = true;
  root.add(upstage);

  // --- the deck ------------------------------------------------------------
  /**
   * The two bays of staging either side of the boards, and the drop off the
   * front.
   *
   * The front of this stage is `stage.ts`'s and is already right: the apron is
   * a box the full height of `rise`, so the tallest rise in the project draws
   * itself as a metre and a half of dark face across the front of the room with
   * the lip on top of it, and the audience is standing at the bottom of it.
   * That is where `rise` earns its number and this file must not draw over it —
   * anything built inside the boards' footprint is inside that box and
   * invisible.
   *
   * What is *not* the datum is the deck outside the boards. `cast.ts` clamps
   * players to `width`, so `width` is the playing area, and a touring stage is
   * always wider than the band for the reasons `WING` gives. Two bays, one each
   * side, running the full depth: a black skirt to the floor and a steel plate
   * on top of it. It costs four meshes and it does three things — it makes the
   * front face of the stage 1.9 m wider than the boards so the drop reads as an
   * edge rather than as the end of a platform, it is the strip of deck the
   * `truss` overhang and the outer pars stand over, and it is the only object
   * in this room with real thickness, which under the shadow policy makes it
   * the only thing here that casts.
   *
   * Darker than the apron — `boards` shaded 0.72 against the apron's 0.55 — for
   * a reason that is not taste: the skirt on a touring stage is black moleskin
   * hung off the front of the scaffold and the apron is the deck's own edge,
   * and if the two matched exactly the whole front of the stage would flatten
   * into one silhouette and the deck would stop reading as wider than the
   * boards.
   */
  const skirtMat = c.kit.solid(shade(p.boards, 0.72), { rough: 0.94 });
  const plateMat = c.kit.solid(shade(p.proscenium, 0.62), { metal: 0.35, rough: 0.6 });
  for (const side of [-1, 1]) {
    const x = side * (m.width / 2 + WING / 2);
    const skirt = new Mesh(c.kit.bevelBox(WING, rise, m.depth, 0.03), skirtMat);
    skirt.position.set(x, -rise / 2 - 0.006, 0);
    skirt.castShadow = true;
    skirt.receiveShadow = true;
    root.add(skirt);

    const plate = new Mesh(c.kit.bevelBox(WING, 0.06, m.depth, 0.02), plateMat);
    plate.position.set(x, -0.03, 0);
    plate.receiveShadow = true;
    root.add(plate);
  }

  // --- the steel -----------------------------------------------------------
  /**
   * The roof, which is the last piece of the anonymity.
   *
   * A hall this size has a structural deck over it — a grid of lattice girders
   * with the rigging points on it — and the reason to build it is not that
   * anybody looks at it. It is that the alternative is nothing at all above the
   * walls, and this is the one room whose walls are far enough out that a
   * camera can find their tops. It also gives the fly bar's motor chains
   * somewhere to be shackled to, which is the difference between a rig that is
   * flown and a rig that is hovering.
   *
   * Two directions of girder, half a metre apart in height, because one
   * direction is a set of joists and two is a deck. Plain `BoxGeometry` rather
   * than the house's `bevelBox`, and `BUILDERS.truss` in `stage-props.ts` wrote
   * the argument this borrows: a bevel is worth its triangles when it catches a
   * highlight along an edge, and a 0.3 m section seen from twelve metres in a
   * dark room has no edge to catch anything on. Instanced, so the whole roof
   * structure is two draw calls.
   *
   * Neither casts nor receives. It is above every lantern in the rig — the
   * highest is the follow spot at `openingHeight + 1.35`, which is 2.4 m under
   * this in the arena and 1.7 m under it in the ballroom — so a shadow on it
   * would have to have been cast upward, and the one shadow map in the budget
   * has a stage-sized frustum to spend on the band.
   *
   * Skipped entirely in the small room, where `stage-props.ts` is about to draw
   * a plaster ceiling and a soffit for the `low-ceiling` prop and two lids in
   * one room is one lid too many.
   */
  if (!club) {
    const steel = c.kit.solid(shade(tint(p.proscenium, 0.25), 0.5), { metal: 0.6, rough: 0.45 });
    const dummy = new Object3D();

    const across = Math.max(4, Math.round(hallDepth / 2.6));
    const along = Math.max(3, Math.round(floorW / 3.4));
    const spans = new InstancedMesh(
      c.kit.geometry(`roof-span|${floorW.toFixed(2)}`,
        () => new BoxGeometry(floorW, 0.42, 0.3)),
      steel, across,
    );
    const runs = new InstancedMesh(
      c.kit.geometry(`roof-run|${hallDepth.toFixed(2)}`,
        () => new BoxGeometry(0.26, 0.3, hallDepth)),
      steel, along,
    );
    for (let i = 0; i < across; i++) {
      dummy.position.set(0, roofY - 0.55, hallFrontZ + ((i + 0.5) * hallDepth) / across);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      spans.setMatrixAt(i, dummy.matrix);
    }
    for (let i = 0; i < along; i++) {
      dummy.position.set(
        (i - (along - 1) / 2) * (floorW / along),
        roofY - 0.16,
        (hallFrontZ + hallBackZ) / 2,
      );
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      runs.setMatrixAt(i, dummy.matrix);
    }
    root.add(spans);
    root.add(runs);

    /**
     * And a deck over the girders, so there is a roof rather than a sky with
     * beams in it.
     *
     * `DoubleSide` and `cellPlane` and no shadow flags, which is the courtyard's
     * lid one room over and is the one thing here worth copying rather than
     * reasoning about afresh: a hemisphere lights a single-sided plane from
     * whichever face it has, so a ceiling lit from its top is a ceiling the room
     * cannot see, and a flat plane whose normal never changes is lit to one
     * number and reads as a hole however well the colour is chosen. Cells give
     * it a grain for nothing.
     */
    const lid = new Mesh(
      c.kit.own(cellPlane({
        width: floorW, height: hallDepth,
        cols: Math.max(4, Math.round(floorW / 2.2)),
        rows: Math.max(4, Math.round(hallDepth / 2.2)),
        colour: shade(p.backdrop, 0.5), jitter: 0.11, rng: c.rng('ceiling'),
      })),
      c.kit.solid('#ffffff', { vertexColors: true, rough: 0.98, side: DoubleSide }),
    );
    lid.rotation.x = -Math.PI / 2;
    lid.position.set(0, roofY, (hallFrontZ + hallBackZ) / 2);
    root.add(lid);
  }

  // --- what the lamps hang on ----------------------------------------------
  /**
   * A pipe on motor chains, and its z is the one number this file and
   * `stage-props.ts` have to agree about.
   *
   * `lights.ts` does `stage.flyBar.add(rig)` and lays its pars along the local
   * x of whatever it is handed, so this could be any object at `flyY`. What it
   * must not be is an object at a height nothing reaches — the bug `flyY` was
   * written after, where a cellar's bar and every par on it sat inside the
   * plaster. Here the chains run all the way up to the roof steel, so a lamp
   * hanging off this bar is visibly hanging off the building.
   *
   * **It is not a lattice, deliberately.** The obvious move in an arena is to
   * make the fly bar a truss, and it is the wrong one: `truss` is a prop this
   * genre names in the era where the rig is the point, and it hangs its
   * downstage run at `curtainZ - 1.1` — which is exactly where `proscenium.ts`
   * puts its fly bar. A lattice here would be a second lattice a third of a
   * metre from the prop's, drawn by a second file, which is the collision the
   * whole prop/room split exists to prevent. So the room draws the *pipe* and
   * the prop draws the *truss*, and this bar hangs 0.8 m upstage of the prop's
   * downstage run so that four vertical motor chains climb past the lattice
   * rather than through it. In the three eras with no truss it is simply a bar
   * on chains, which is what a small rig is.
   *
   * The chains stop at the soffit in the small room, where they are 75 mm
   * drop-arms to the plaster rather than five and a half metres of hoist chain.
   * Same object, same argument, one seventieth of the length.
   */
  const flyBar = new Group();
  flyBar.name = 'fly-bar';
  flyBar.position.set(0, m.flyY, m.curtainZ - 1.9);
  const pipe = new Mesh(
    c.kit.bevelBox(m.openingWidth + 1.4, 0.11, 0.11, 0.05),
    c.kit.solid(shade(tint(p.proscenium, 0.2), 0.55), { metal: 0.7, rough: 0.4 }),
  );
  flyBar.add(pipe);

  const chainTop = club ? STAGE_SOFFIT : roofY;
  const chainH = Math.max(0.06, chainTop - m.flyY - 0.055);
  const chainMat = c.kit.solid(shade(p.proscenium, 0.72), { metal: 0.55, rough: 0.5 });
  const chainGeo = c.kit.bevelBox(0.045, chainH, 0.045, Math.min(0.02, chainH * 0.3));
  for (const at of [-0.42, -0.16, 0.16, 0.42]) {
    const chain = new Mesh(chainGeo, chainMat);
    chain.position.set(at * m.openingWidth, chainH / 2 + 0.055, 0);
    flyBar.add(chain);
  }
  root.add(flyBar);

  /**
   * No cloth, and nothing in this room belongs to the building anyway.
   *
   * A touring band does not travel with house tabs, and everything the audience
   * can see arrived in the van. `noCurtain()` reports the cloth as being
   * exactly where the show asked for it, on the same frame, so `show.ts` never
   * stalls waiting for travel that will not happen and the band is still hidden
   * while it is being staged, which is what the invisibility was ever for.
   *
   * ## The `CURTAIN_AT` gap, decided rather than inherited
   *
   * `show.ts` spends `CURTAIN_AT` — 0.2 s — in the `curtain` state before it
   * calls `setCurtain(1)`, and `band.visible` is false until `curtainOpen()`
   * passes `CURTAIN_REVEALS`. With no cloth those 0.2 s are a stage with nobody
   * on it, and it is worth being exact about what is actually visible in them
   * rather than repeating the general worry: the previous state left
   * `setMaster(0)` standing, and the master is not raised until the same frame
   * the band appears, so what the house sees is a dark stage lit only by
   * `HOUSE_FLOOR` at 0.10 for one fifth of a second, and then the band and the
   * light coming up together over `STAGE_UP_SECONDS`.
   *
   * That is not a pop to be tolerated in this room, it is the reveal. A rock
   * show starts with the house going out, a beat of black over an empty deck
   * and the band walking into a lighting cue — and unlike a proscenium's gather
   * it costs nothing, because there is no cloth travelling for three seconds
   * afterwards. The one room where `noCurtain` is not a compromise is this one.
   */
  const curtain = noCurtain();
  root.add(curtain.root);

  return { root, flyBar, curtain };
}

export const circuit: RoomBuilder = { shape, build };
