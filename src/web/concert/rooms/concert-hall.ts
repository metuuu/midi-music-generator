/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The concert hall — a shoebox, a raked and tiered house, a platform recessed
 * into the end wall, and no curtain anywhere in it.
 *
 * `classical/staging.ts` has one sentence that no other genre in the project
 * makes: *the building is part of the event.* Every other room is somewhere the
 * music happens to be played — a shed by a lake, a basement with a bar in it, a
 * black box that has removed its own architecture on purpose. This one is the
 * exception and it is the exception on purpose, and the whole of the work below
 * is spent on making that claim true rather than asserted. Until now the hall
 * was `prosceniumShape` with gilt paint on it, which meant the file that says
 * the building matters was staged in the building every other genre gets by not
 * choosing one.
 *
 * ## The audience is the architecture
 *
 * This is the one room in the project where the *shape of the house* is the
 * thing you recognise, and it is worth being precise about why, because the
 * temptation is to spend the whole budget on the platform end where the camera
 * is pointing.
 *
 * A pavilion's floor is flat because people are dancing on it. A cellar's is
 * flat because there are tables on it. A courtyard's is flagged because it is
 * outside. A hall's floor **climbs**, in steps, one per row, and it climbs
 * because eight hundred people bought seats at different prices and every one
 * of them has to see. That is not decoration and it is not even really a
 * decision — it is the only shape that solves the problem the building exists
 * to solve, which is why every hall from 1720 to now has it and why a room with
 * it cannot be mistaken for a room without it.
 *
 * And it costs almost nothing here, because the rake is already in the show and
 * is currently a lie. `stage-audience.ts` says so in as many words: *"The rake
 * is a cheat: the floor plane is flat and the back rows are lifted off it so
 * they clear the front."* Twelve rows at 0.1 m each is 1.1 m of people standing
 * on nothing at the back of every seated house in the catalogue. Putting steps
 * under them is one instanced mesh, and it converts an existing cheat into an
 * existing building. Nothing about the crowd changes; what changes is that it
 * is now standing on something.
 *
 * The seats themselves are not here — `stalls` is a prop and draws them for
 * every room at once, and a room that also drew seat backs would draw them
 * twice, 0.24 m apart. The division is the one `rooms/types.ts` sets out: the
 * furniture is an object, the rake it stands on is the building.
 *
 * ## Two lids, the other way up
 *
 * The cellar needed `RoomShape` to carry two ceilings because it has plaster
 * over the house and a lower soffit over the stage. This room needs the same
 * two numbers for the opposite reason: the **house** has the lower lid, because
 * the platform is set into the end wall of the room and the volume over the
 * audience carries on up past it for another three metres.
 *
 * That recess is not an ornament either. The boards are 12 m wide and the house
 * is 18 m wide between its walls; something has to happen to the side wall at
 * the platform line, and what happens in every hall of this type is that the
 * wall steps in, the ceiling steps down, and the orchestra plays out of a
 * rectangular hole in the end of the room. It is what a proscenium arch would
 * be if nobody had ever thought of decorating one — and the difference between
 * the two is exactly the difference this room has to make legible in a second:
 * there is no arch, no moulding, no valance, no tormentor, no wing, no masking
 * flat and **no cloth**. There is a hole in a plastered wall with a giant order
 * either side of it, and the room goes up.
 *
 * ## Where the balcony is allowed to be
 *
 * A gallery is the second thing you recognise a hall by and it is the one piece
 * of it that can ruin the picture. `camera.ts` names the failure while
 * describing something else entirely: *"A wide shot taken at standing height in
 * the audience is a shot with the balcony rail through the middle of the band."*
 *
 * The fix is geometric rather than careful. Everything standing on the boards
 * projects **below** the horizon of a camera that is above it and looking
 * slightly down; anything kept **above** the lens projects above that horizon;
 * and two things on opposite sides of the horizon cannot cross in the frame no
 * matter where the camera stands or what shape the window is. `stage-props.ts`
 * banks a chandelier on that same sentence. So the only number the gallery
 * needs is the highest the director's lens can ever get, which is `wideEye`'s
 * `2.3 + 1.3` — restated below as `LENS_CEILING`, because importing it would
 * make the room depend on the camera to know how tall it is, and because if the
 * two ever disagree the symptom is visible in the first frame.
 *
 * ## The eras differ, and they differ by the plan rather than by their names
 *
 * `shape()` is handed a `RoomDatum`, which has no era in it, and that is a
 * feature: an era is a palette and a prop list, and a room that switched on the
 * string `'romantic'` would be a fifth genre table in a directory that exists
 * to have none. What it does have is `d.width`, and classical already varies it
 * — 12.0 m in 1720, 12.4 in 1785, 12.6 in 1910 and 12.8 in 1870 — through
 * `grow`, which its own comment explains as *the era's own density expressed as
 * square metres*, i.e. how many players are coming.
 *
 * How many players are coming is an extremely good proxy for what kind of
 * building this is, because the two grew together and for the same reason. A
 * band of eight in a palace room is a household's private music; a band of
 * ninety is a public subscription concert with two thousand tickets sold, and
 * you cannot seat two thousand people on one floor. So the height of the room
 * scales continuously with the platform, and the **second gallery** — the upper
 * circle, the thing that is unambiguously a nineteenth-century public hall —
 * appears above `TWO_TIERS`. 1720 and 1785 get one gallery; 1870 and 1910 get
 * two. Continuous rather than a switch, so a fifth era or another genre naming
 * this architecture gets a coherent room rather than a default one.
 *
 * ## Modifiers
 *
 * `black-box` is honoured, and only as paint: the plaster, the giant order and
 * the coffers all go matte and dark and the gilding comes off. A hall stripped
 * out for a contemporary programme is a real evening in a real building, and
 * the section is what makes it a hall — you can paint a listed room black and
 * you cannot flatten its floor.
 *
 * The other four are ignored, and each for its own reason rather than by
 * omission. `open-air` and `low-ceiling` are not modifiers of this room, they
 * are different rooms: a hall with no roof is a bandstand and a hall with a lid
 * on it is a function suite, and both delete the two things — the section and
 * the volume — that this file is entirely made of. A genre that wants either
 * should name a different architecture and get a compile error until somebody
 * writes it. `brick` is a material claim about a building that is plastered by
 * definition; the acoustic is the plaster. `haze` is not architecture at all —
 * `stage.ts` reads it and hangs cards of air.
 */

import {
  Color, DoubleSide, Group, InstancedMesh, Mesh, Object3D,
} from 'three';

import { rowGap } from '../stage-audience.js';
import { blend, cellPlane, shade, tint } from '../stage-kit.js';
import {
  noCurtain, type RoomBuilder, type RoomContext, type RoomDatum, type RoomRig,
  type RoomShape,
} from './types.js';

/**
 * How far the platform stands above the stalls floor.
 *
 * Not `STAGE_RISE`, and the reason is the rake rather than taste. A proscenium
 * house is 0.9 m because the floor in front of it is flat and a standing crowd
 * is 1.7 m tall, so the *stage* has to do all of the work of getting the band
 * above the audience. Here the room does it: the floor climbs 0.1 m a row for
 * twelve rows, so by the back of the house there is 1.1 m of lift that cost the
 * platform nothing. A hall that also had a metre of stage in it would be
 * solving the same problem twice and would look it — the band would be up on a
 * shelf, which is a variety theatre.
 *
 * 0.6 m is three steps of 0.2, which is what the players actually walk up, and
 * it is the front of a real orchestra platform to within a few centimetres. It
 * also keeps the promise the brief for this room makes, which is that the front
 * row can see feet: at 0.6 m a seated eye at 1.05 m clears the lip on a line
 * that meets the boards 0.7 m upstage of it, so the front line's shoes are in
 * shot from row one. At 0.9 m they are not.
 */
const PLATFORM_RISE = 0.6;

/**
 * How far outside the boards the recess walls stand, and how far inside their
 * faces the aperture is measured.
 *
 * The first is a wing: half a metre of dead floor either side of the platform
 * for a player to come on from, which is the least a room can have and still
 * have somewhere for the `drapes` prop to hang. Those drapes are the reason the
 * number is not zero — `stage-props.ts` anchors them at `max(play.halfX,
 * openingWidth / 2 - 0.25)` plus a panel's half width, which lands them about
 * 0.35 m outside the edge of the boards in *any* room, so a hall with its side
 * walls flush to the platform would hang four two-storey cloths in mid-air.
 *
 * The second is a reveal, and it is bought with a specific bug. `lights.ts`
 * draws the cyclorama glow at `openingWidth * 1.02` — 2 % wider than the
 * aperture, so that a glow on a cloth reaches the edges of it — and an aperture
 * measured to the wall faces therefore puts 0.14 m of lit rectangle *through*
 * each recess wall at the point in the show where it is brightest. Measuring
 * the clear span a hand's breadth inside the reveals costs nothing anybody can
 * see and takes the glow off the walls.
 */
const RECESS_OUT = 0.55;
const RECESS_REVEAL = 0.15;

/** How far upstage of the lip the recess mouth and the (absent) cloth line are. */
const MOUTH_FROM_LIP = 0.35;
const CURTAIN_FROM_LIP = 0.5;

/**
 * The highest the director's lens can get, restated from `camera.ts`.
 *
 * `wideEye` is `2.3 + min(d * 0.11, 1.3)` clamped to the ceiling, so 3.6 m is
 * the top of it and every other framing in the show is lower — `front` is
 * pinned at 1.6 m and the rest track a player's sternum. Restated rather than
 * imported, on the same bargain `HEAD_BAND` makes with `cast.ts`: a room that
 * imported the camera to find out how tall it is has the dependency the wrong
 * way round, and if the two drift the symptom is a balcony rail through the
 * middle of the band, which is visible in the first frame and named in
 * `camera.ts`'s own doc as the picture nobody wants to watch.
 */
const LENS_CEILING = 3.6;

/**
 * The underside of the first gallery, above the boards.
 *
 * The one dimension in this room that is not a function of the room. It is
 * `LENS_CEILING` plus enough margin that a rail is unambiguously above the
 * horizon rather than on it, and it is therefore the same number in a 12 m hall
 * and a 13 m one — a gallery that scaled with the building would drop through
 * the shot in the small rooms, which is the only place scaling it could
 * possibly matter.
 *
 * It reads high against a photograph of a real hall, where a gallery sits at
 * about two fifths of the height and this one sits at about half. That is the
 * trade and it is the right way round: the alternative is architecturally
 * accurate and puts a horizontal band across the players in every wide shot.
 */
const GALLERY_SOFFIT = LENS_CEILING + 0.75;

/** Fascia depth, fascia height, and the gap up to the tier above. */
const GALLERY_DEEP = 0.9;
const GALLERY_FACE = 0.85;
const GALLERY_STEP = 2.6;

/**
 * The platform width above which the room gets a second gallery.
 *
 * See the header. 12.5 m sits between classical's 12.4 and impressionist's
 * 12.6, which is where the century turns in this genre's own table, and it is
 * stated as a floor area rather than as a date so that any genre naming this
 * architecture lands somewhere sensible.
 */
const TWO_TIERS = 12.5;

/**
 * How tall the room is over the house, from the stalls floor.
 *
 * The single most consequential number in the file, and the one the brief for
 * this room is most insistent about: a hall's height is not a lid you notice,
 * it is volume, and it is most of why the place reads as grand rather than as a
 * big shed. 0.82 of the platform width puts a 12 m room at 9.8 m and a 12.8 m
 * room at 10.5 m — about half the width of the house it is over, which is
 * squatter than a Musikverein and taller than anything else in this project by
 * a factor of two.
 *
 * Clamped at both ends because neither extreme is a hall: under 9.4 m the
 * gallery has no wall above it to stand under and the room turns into an
 * assembly hall, and over 10.9 m the ceiling leaves the top of the widest shot
 * altogether and stops paying for the triangles it costs.
 */
function hallHeight(width: number): number {
  return Math.max(9.4, Math.min(width * 0.82, 10.9));
}

/**
 * How tall the recess is, from the stalls floor. Not quite two thirds.
 *
 * A fraction rather than a fixed height, because the step from the recess head
 * to the ceiling *is* the effect — it is what tells you the room carries on
 * above the orchestra — and a fixed recess in a room whose height varies would
 * make that step grow and shrink for no reason a viewer could name.
 *
 * 0.62 was measured rather than chosen, and the thing it was measured against
 * is the top of the frame. `camera.ts` solves the wide shot to hold the boards
 * and the front row, which on a 16:9 window puts the top of the picture about
 * six and a half metres up at the plane of the back wall — so at 0.7 the recess
 * soffit sat *exactly* on the top edge and every wide shot in the show was
 * taken inside the opening, with no end wall, no cornice and no room visible
 * above the orchestra at all. The section was correct and invisible, which is
 * the same as not having built it. At 0.62 there is a metre of lit plaster and
 * a cornice over the mouth in every wide shot, and that band is the whole of
 * what says the hall did not stop where the platform did.
 */
function recessHead(width: number): number {
  return hallHeight(width) * 0.62;
}

function shape(d: RoomDatum): RoomShape {
  const rise = PLATFORM_RISE;
  /** Above the boards: the recess soffit, which is the top of the aperture. */
  const openingHeight = recessHead(d.width) - rise;
  return {
    rise,
    /**
     * The clear span of the recess, and it is **wider than the boards**.
     *
     * The rule in `RoomShape` is a floor — never narrower than the playing area
     * — and this clears it by two metres, which is not slack but the truth
     * about the building: there is no arch here and nothing masking the ends of
     * the platform, so a player standing on the very corner of the boards is
     * seen from every seat in the house. A proscenium takes 94 % of its width
     * because the outer 6 % is behind a tormentor. There is no tormentor.
     *
     * What it buys is everything that is *hung*, since `openingWidth` is what
     * spans the aperture: the cyclorama glow fills the recess rather than a
     * rectangle inside it, the pars spread to the width of the platform, and
     * the `organ-pipes` prop lays its front out across the whole of the back
     * wall instead of across three quarters of it — which is what an organ
     * front does, and is the object this genre uses to say "hall" from the back
     * row.
     */
    openingWidth: d.width + 2 * (RECESS_OUT - RECESS_REVEAL),
    openingHeight,
    /**
     * Where a cloth would be if there were one, and there is not — see
     * `build`. It still has to be the front of the room, because
     * `stage-props.ts` hangs drapes off it and `build` hangs the lighting bar
     * off it, so it sits just inside the mouth where a hall's own fire curtain
     * would live if the building had ever been asked for one.
     */
    curtainZ: d.lipZ - CURTAIN_FROM_LIP,
    /**
     * The lighting bar, on drop rods from the recess soffit.
     *
     * There is no fly tower in a concert hall and there never was one — the
     * room predates stage lighting by a century and a half. What every one of
     * these buildings actually has is a discreet bar bolted up under the
     * platform ceiling, added in about 1950 and painted the colour of the
     * plaster, and that is what this is. Half a metre down, which is the length
     * of the rods `build` draws: the same argument the cellar makes for its
     * scaffold, one storey higher up.
     */
    flyY: openingHeight - 0.45,
    /**
     * The recess soffit is the lowest thing over the boards, and the ceiling is
     * three metres above that over the house. The cellar's two numbers, the
     * other way up.
     *
     * `houseLid` is deliberately **not** the gallery, which is genuinely lower
     * and genuinely over part of the house. The one thing that reads this is a
     * fitting hung from it, and `stage-props.ts` hangs the chandeliers at
     * `±houseWidth * 0.17` — two and a half metres either side of the centre
     * line, where the surface overhead is the ceiling and the gallery is five
     * metres away at the wall. Publishing the gallery here would hang both of
     * them five metres below the plaster they are screwed to, which is the
     * floating-lamp bug this field was split out of `headroom` to prevent,
     * arriving from the other direction.
     */
    headroom: openingHeight,
    houseLid: hallHeight(d.width) - rise,
    /**
     * The back wall of the recess, floor to soffit. A wall rather than a cloth:
     * there is nothing hung in this room, and the organ stands against it.
     */
    backdropHeight: recessHead(d.width),
  };
}

function build(c: RoomContext): RoomRig {
  const p = c.venue.palette;
  const m = c.m;
  const blackBox = c.props.has('black-box');
  const rise = -m.houseY;

  /** Inner faces of the house walls, and the outer edge of everything. */
  const halfX = m.houseWidth / 2 + 0.6;
  /** Behind the last row, with the 1.6 m of margin every room keeps. */
  const houseBackZ = m.lipZ + m.houseDepth + 1.6;
  /** The end wall of the room, with the platform recessed into it. */
  const mouthZ = m.lipZ - MOUTH_FROM_LIP;
  /** The recess walls. Half a reveal outside the aperture. See `RECESS_OUT`. */
  const flankX = m.openingWidth / 2 + RECESS_REVEAL;
  /** Stage y of the two lids and of the wall head. */
  const soffitY = m.headroom;
  const hallY = m.houseLid;
  const twoTiers = m.width >= TWO_TIERS;

  const root = new Group();
  root.name = `room:${c.venue.id}`;

  // --- paint ---------------------------------------------------------------
  /**
   * Four surfaces and one hue, which is what distinguishes a hall from every
   * other room in the catalogue as much as any dimension does.
   *
   * `palette.proscenium` is this genre's *room* colour — the gilt in 1720, the
   * pale plaster of 1785, the Musikverein gold of 1870, the grey-green of 1910
   * — and in a proscenium house it only ever reaches the arch, which is one
   * object at the front. Here it is the entire building: the walls, the giant
   * order, the galleries, the coffers and the organ case are all the same
   * colour at four different distances from white, and the effect of that is
   * the thing you cannot get by painting a shed. The audience is sitting inside
   * one continuous piece of plasterwork.
   *
   * `black-box` takes the light out of all four and closes the gap between
   * them, which is what painting a room out does: the mouldings stop reading
   * because there is no longer a value difference between a pilaster and the
   * wall behind it.
   */
  const plaster = blackBox
    ? shade(blend(p.proscenium, p.backdrop, 0.72), 0.45)
    : shade(blend(p.proscenium, p.backdrop, 0.44), 0.18);
  const order = blackBox ? plaster : tint(p.proscenium, 0.14);
  const orderMat = c.kit.solid(order, { rough: blackBox ? 0.95 : 0.62 });
  const wallMat = c.kit.solid('#ffffff', { vertexColors: true, rough: 0.95 });

  const wallRng = c.rng('walls');
  /**
   * A plastered panel. Big cells — a hall's wall is bays and panels rather than
   * bricks or planks, so the grain wants to be about a metre and a half, which
   * is also small enough that a flat plane lit by a hemisphere stops reading as
   * one flat number. That second half is the real reason: see the courtyard's
   * ceiling, which learned it the expensive way.
   */
  const panel = (w: number, h: number, colour: string): Mesh => new Mesh(
    c.kit.own(cellPlane({
      width: w, height: h,
      cols: Math.max(3, Math.round(w / 1.7)),
      rows: Math.max(3, Math.round(h / 1.5)),
      colour, jitter: 0.05, rng: wallRng,
    })),
    wallMat,
  );

  // --- the stalls floor ----------------------------------------------------
  /**
   * Parquet, and the same one draw call every room's floor is.
   *
   * Squarer cells than the proscenium's planks and browner than the courtyard's
   * flags: a hall floor is a wood block floor, laid in short lengths, and at
   * this distance the only thing that separates it from floorboards is the
   * aspect of the cell. Colour off `boards` pulled toward `backdrop` and
   * darkened hard, because it is under a hundred and sixty unlit people and its
   * job is to be the thing their silhouettes sit on rather than a surface
   * competing with the platform.
   */
  const floorRng = c.rng('housefloor');
  const floorW = m.houseWidth + 8;
  const floorD = m.houseDepth + 8;
  const floor = new Mesh(
    c.kit.own(cellPlane({
      width: floorW, height: floorD,
      cols: Math.max(8, Math.round(floorW / 0.78)),
      rows: Math.max(8, Math.round(floorD / 0.78)),
      colour: shade(blend(p.boards, p.backdrop, 0.52), 0.4),
      jitter: 0.1, rng: floorRng,
    })),
    c.kit.solid('#ffffff', { vertexColors: true, rough: 0.94 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, m.houseY, m.lipZ + m.houseDepth / 2);
  floor.receiveShadow = true;
  root.add(floor);

  // --- the rake ------------------------------------------------------------
  /**
   * The steps the house is standing on, and the object this room is about.
   *
   * Every number here belongs to `stage-audience.ts` and three of them are
   * private over there, so they are restated rather than imported — the same
   * bargain `stalls` strikes two files away and for the same reason: a step in
   * the wrong place is a plank through somebody's shins and is visible in the
   * first frame, which is a better check than a compile-time one. `rowGap` is
   * exported precisely so a second file can ask; `crowd.frontZ` comes through
   * the metrics; the rake and the row count do not, and are copied.
   *
   * Row zero stands on the floor itself, which is why the run starts at one:
   * the flat strip between the platform and the first step is the cross-aisle,
   * and a hall has one. Each step is a box with its tread at that row's foot
   * level and 1.8 m of buried carcass under it, so that no step can ever hang
   * over a gap however high the rake gets — the alternative is a per-instance
   * scale, and a scaled `RoundedBoxGeometry` bevels unevenly along the axis it
   * was stretched on.
   *
   * They cast and receive. A step is the definition of the shadow policy's
   * "chunky solid standing on a floor", and its tread is the floor for the row
   * on it, which is the definition of the other half.
   */
  const rows = Math.max(1, Math.min(16, Math.round(c.venue.audience.rows)));
  const seated = c.venue.audience.seated;
  /** `stage-audience.ts`'s `ROW.rake`. See above. */
  const rake = seated ? 0.1 : 0.05;
  const gap = rowGap(seated);
  /** The downstage edge of row `r`'s step. Row zero's is the floor. */
  const stepZ = (r: number): number => m.crowd.frontZ + 0.05 + gap * r;
  const stepColour = shade(blend(p.boards, p.backdrop, 0.62), 0.44);
  const stepMat = c.kit.solid(stepColour, { rough: 0.95 });

  if (rows > 1) {
    const steps = new InstancedMesh(
      c.kit.bevelBox(halfX * 2, 1.8, gap, 0.03), stepMat, rows - 1);
    const dummy = new Object3D();
    const tone = new Color();
    const base = new Color(stepColour);
    for (let r = 1; r < rows; r++) {
      dummy.position.set(0, m.houseY + r * rake - 0.9, stepZ(r) + gap / 2);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      steps.setMatrixAt(r - 1, dummy.matrix);
      // A couple of percent either way, so twelve identical steps are not
      // twelve identical steps. The same trick and the same reason as the
      // crowd's own tone variation.
      tone.copy(base).multiplyScalar(0.94 + floorRng.next() * 0.12);
      steps.setColorAt(r - 1, tone);
    }
    steps.castShadow = true;
    steps.receiveShadow = true;
    root.add(steps);

    /**
     * And the standing room at the top, which is not a flourish.
     *
     * `houseDepth` is `2.6 + rows * gap` and the wall stands another 1.6 m
     * behind that, so the last row's step ends three metres short of the back
     * of the room. Left alone that is a three-metre drop from the top of the
     * rake to the floor, seen edge-on from every shot that can see the back
     * wall at all. The top tier runs to the wall.
     */
    const backFrom = stepZ(rows - 1) + gap;
    const backDepth = houseBackZ - backFrom;
    if (backDepth > 0.2) {
      const top = new Mesh(
        c.kit.bevelBox(halfX * 2, 1.8, backDepth, 0.03), stepMat);
      top.position.set(0, m.houseY + (rows - 1) * rake - 0.9, backFrom + backDepth / 2);
      top.castShadow = true;
      top.receiveShadow = true;
      root.add(top);
    }
  }

  // --- the walls of the house ---------------------------------------------
  /**
   * Three of them, single-sided, facing in.
   *
   * The single-sidedness is the proscenium's decision and is taken here for the
   * identical reason, so it is not re-argued: orbit yaw is unclamped, swinging
   * round the outside of a building is a thing a viewer does in the first ten
   * seconds, and a solid wall answers that with a black screen where a
   * single-sided one lets you look straight in.
   *
   * They receive and do not cast. A wall is the large flat surface behind the
   * band that a shadow lands on, and it has no thickness to cast one with.
   */
  const sideDepth = houseBackZ - mouthZ;
  const wallH = hallY - m.houseY;
  for (const side of [-1, 1]) {
    const wall = panel(sideDepth, wallH, plaster);
    wall.position.set(side * halfX, m.houseY + wallH / 2, mouthZ + sideDepth / 2);
    wall.rotation.y = side * -Math.PI / 2;
    wall.receiveShadow = true;
    root.add(wall);
  }
  const rear = panel(halfX * 2, wallH, plaster);
  rear.position.set(0, m.houseY + wallH / 2, houseBackZ);
  rear.rotation.y = Math.PI;
  rear.receiveShadow = true;
  root.add(rear);

  // --- the end wall, with the platform in it -------------------------------
  /**
   * Three panels round a rectangular hole, and this is the room's whole answer
   * to a proscenium arch.
   *
   * It has to exist rather than being left open: the boards are `width` wide
   * and the house is four metres wider, so without it the two side walls of the
   * house simply stop in mid-air at the platform line with a gap either side of
   * the recess looking out into nothing. What it must not become is an arch —
   * no legs in a contrasting colour, no moulding down the reveal, no header
   * band, no tormentors running out to the edge of frame. It is the same
   * plaster as the side walls with a hole in it, and the only thing standing
   * proud of it is the giant order, which stands on the *house* side and is
   * shared with the rest of the room.
   *
   * The header over the opening is the piece that does the work. It is three
   * metres of blank wall between the recess soffit and the ceiling, it is
   * squarely in the top of the widest shot, and it is the only thing in the
   * frame that says the room did not stop where the orchestra did.
   */
  const cheek = halfX - flankX;
  for (const side of [-1, 1]) {
    if (cheek <= 0.05) continue;
    const face = panel(cheek, wallH, plaster);
    face.position.set(side * (flankX + cheek / 2), m.houseY + wallH / 2, mouthZ);
    face.receiveShadow = true;
    root.add(face);
  }
  const headerH = hallY - soffitY;
  if (headerH > 0.05) {
    const header = panel(flankX * 2, headerH, plaster);
    header.position.set(0, soffitY + headerH / 2, mouthZ);
    header.receiveShadow = true;
    root.add(header);
    /**
     * And a cornice on the line where the room steps.
     *
     * The one moulding in this file, and it earns its draw call by being the
     * only object in the wide shot that is *horizontal*. Everything else the
     * camera can see at that height is a plane — the header above, the soffit
     * behind — and two plasters of nearly the same value meeting at a corner
     * read as one surface with a crease in it. A band standing 0.2 m proud
     * catches the top light on its own upper face and throws a line of shadow
     * under itself, and that shadow is what makes the header a wall in front of
     * a ceiling rather than a paler patch of the same thing.
     */
    const cornice = new Mesh(
      c.kit.bevelBox(flankX * 2 + 0.4, 0.36, 0.34, 0.05), orderMat);
    cornice.position.set(0, soffitY + 0.18, mouthZ + 0.12);
    cornice.castShadow = true;
    root.add(cornice);
  }

  // --- the giant order -----------------------------------------------------
  /**
   * Pilasters from the first gallery to the ceiling, on all three house walls.
   *
   * Above the gallery and not below it, and that is a budget decision with a
   * good excuse: the house seats twenty-five to a row at 0.66 m centres, which
   * is 16.5 m of people in an 18 m room, so the wall below the gallery is
   * behind a hundred and sixty silhouettes and nothing on it is ever seen. What
   * *is* seen is the storey above them, and what a hall has there is a repeated
   * vertical rhythm — the single strongest cue that a wall belongs to a
   * building rather than to a box.
   *
   * One module for the whole room, taken from the side walls. The courtyard
   * makes this argument about arches and it is the same one: bays that change
   * width as the wall turns a corner is the one thing about an order that
   * anybody notices. The sides set it because the sides are what a hall shows
   * you — the rear wall is behind every camera in the show.
   *
   * They cast and do not receive: a pilaster is a chunky solid, and one that
   * received would be lighting its own reveal against the wall it stands on.
   */
  const orderFrom = GALLERY_SOFFIT + GALLERY_FACE;
  const orderH = hallY - orderFrom;
  const bays = Math.max(2, Math.round(sideDepth / 2.6));
  const bay = sideDepth / bays;
  const pilasterW = Math.min(0.62, bay * 0.3);
  if (orderH > 0.4) {
    const rearBays = Math.max(2, Math.round((halfX * 2) / bay));
    const order3 = new InstancedMesh(
      c.kit.bevelBox(pilasterW, orderH, 0.3, 0.04),
      orderMat,
      (bays + 1) * 2 + rearBays + 1,
    );
    const dummy = new Object3D();
    let i = 0;
    const place = (x: number, z: number, yaw: number): void => {
      dummy.position.set(x, orderFrom + orderH / 2, z);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      order3.setMatrixAt(i++, dummy.matrix);
    };
    for (const side of [-1, 1]) {
      for (let b = 0; b <= bays; b++) place(side * (halfX - 0.15), mouthZ + b * bay, Math.PI / 2);
    }
    for (let b = 0; b <= rearBays; b++) {
      place(-halfX + (b * halfX * 2) / rearBays, houseBackZ - 0.15, 0);
    }
    order3.castShadow = true;
    root.add(order3);
  }

  // --- the galleries -------------------------------------------------------
  /**
   * A fascia round three sides of the room, and — in the bigger halls — a
   * second one above it.
   *
   * Cantilevered, with nothing under it. Half the halls of the period are on
   * columns and half are not, and the ones that are would put a colonnade
   * straight through the back of the house at the exact height a camera dragged
   * down into the seats looks along. The other half is free.
   *
   * A box rather than a rail and a soffit, because the underside is what is
   * seen from the floor of the house and it wants to be a plane at a definite
   * height rather than the inside of an open balustrade. It is also the only
   * thing in this room with real thickness that anybody looks at from below.
   *
   * It receives and does not cast: it is above every fixture the rig hangs and
   * the one shadow-caster is pointed at the platform, so a shadow from it would
   * have to be thrown upward.
   */
  const galleries = twoTiers ? [GALLERY_SOFFIT, GALLERY_SOFFIT + GALLERY_STEP] : [GALLERY_SOFFIT];
  for (const soffit of galleries) {
    if (soffit + GALLERY_FACE > hallY - 0.4) continue;
    for (const side of [-1, 1]) {
      const run = new Mesh(
        c.kit.bevelBox(sideDepth, GALLERY_FACE, GALLERY_DEEP, 0.05), orderMat);
      run.position.set(
        side * (halfX - GALLERY_DEEP / 2),
        soffit + GALLERY_FACE / 2,
        mouthZ + sideDepth / 2,
      );
      run.rotation.y = Math.PI / 2;
      run.receiveShadow = true;
      root.add(run);
    }
    const back = new Mesh(
      c.kit.bevelBox(halfX * 2, GALLERY_FACE, GALLERY_DEEP, 0.05), orderMat);
    back.position.set(0, soffit + GALLERY_FACE / 2, houseBackZ - GALLERY_DEEP / 2);
    back.receiveShadow = true;
    root.add(back);
  }

  // --- the ceiling ---------------------------------------------------------
  /**
   * Coffered, and the reason the room is worth the height it claims.
   *
   * The lid itself is one plane with cells in it, `DoubleSide` and unlit by the
   * shadow — the courtyard settled all three of those and the arguments carry
   * over unchanged: a hemisphere lights a flat plane to exactly one number, so
   * a ceiling whose normal never varies reads as a hole rather than as a
   * surface however well the colour is chosen; a single-sided one lit from
   * above is a ceiling the room cannot see; and a shadow on it would have had
   * to be cast upward.
   *
   * The coffers are what a cell grid cannot do, which is have an *edge* that
   * catches a light. Two instanced runs of beams crossing at about two and a
   * half metres, hanging a third of a metre below the plaster: from the floor
   * of the house that is a grid of shadowed squares thirty feet up, and it is
   * the single most legible thing about the ceiling of any hall of this period.
   * Cheap, too — two draw calls for the whole ceiling.
   */
  const lidRng = c.rng('ceiling');
  const lidD = houseBackZ - mouthZ;
  const lidColour = blackBox
    ? shade(plaster, 0.35)
    : tint(blend(p.proscenium, p.ambient, 0.3), 0.06);
  const lid = new Mesh(
    c.kit.own(cellPlane({
      width: halfX * 2, height: lidD,
      cols: Math.max(4, Math.round((halfX * 2) / 1.4)),
      rows: Math.max(4, Math.round(lidD / 1.4)),
      colour: shade(lidColour, 0.34), jitter: 0.07, rng: lidRng,
    })),
    c.kit.solid('#ffffff', { vertexColors: true, rough: 0.98, side: DoubleSide }),
  );
  lid.rotation.x = -Math.PI / 2;
  lid.position.set(0, hallY, mouthZ + lidD / 2);
  root.add(lid);

  const coffer = c.kit.solid(shade(lidColour, blackBox ? 0.55 : 0.22), { rough: 0.9 });
  const acrossN = Math.max(2, Math.round(lidD / 2.5));
  const alongN = Math.max(2, Math.round((halfX * 2) / 2.5));
  const ribY = hallY - 0.16;
  {
    const across = new InstancedMesh(
      c.kit.bevelBox(halfX * 2, 0.3, 0.26, 0.04), coffer, acrossN + 1);
    const along = new InstancedMesh(
      c.kit.bevelBox(0.26, 0.3, lidD, 0.04), coffer, alongN + 1);
    const dummy = new Object3D();
    for (let i = 0; i <= acrossN; i++) {
      dummy.position.set(0, ribY, mouthZ + (i * lidD) / acrossN);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      across.setMatrixAt(i, dummy.matrix);
    }
    for (let i = 0; i <= alongN; i++) {
      dummy.position.set(-halfX + (i * halfX * 2) / alongN, ribY, mouthZ + lidD / 2);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      along.setMatrixAt(i, dummy.matrix);
    }
    root.add(across);
    root.add(along);
  }

  // --- the recess ----------------------------------------------------------
  /**
   * The back wall of the platform, which is this room's backdrop — and it is a
   * **wall**, not a cloth, which is the single largest thing in the picture and
   * took two attempts to get right.
   *
   * Every other room in the project puts `palette.backdrop` here, on the
   * reasonable argument that the darkest colour in the venue belongs behind the
   * band and that separation is what an upstage rim light is for. This one did
   * too, and the result was the first thing wrong with it: `backdrop` is
   * `#241a18` in 1870, so **fifty-five per cent of every wide shot in the show
   * was a flat black rectangle**, with two gilded verticals either side of it.
   * That is not a concert hall. That is a proscenium arch with the tabs out and
   * nothing hung, which is the exact building this file exists not to be.
   *
   * So it is plaster, pulled a little under two fifths of the way toward
   * `backdrop` — dark enough that a rank of players in black tails still reads
   * against it, light enough that it is obviously the same room as the walls on
   * either side of it. It is also the truth about the object: in a hall the
   * wall behind the orchestra is the wall, it is the surface the organ is bolted
   * to, and it is very often the most decorated thing in the building.
   *
   * Wider than the boards by the same 1.2 factor every room uses, and 0.1 m
   * upstage of `backZ` so that the glow at `backZ - 0.07` lands in front of it
   * rather than inside it.
   */
  const backRng = c.rng('backdrop');
  const backW = m.width * 1.2;
  const backH = m.backdropHeight;
  const backColour = blackBox
    ? shade(blend(plaster, p.backdrop, 0.5), 0.3)
    : blend(plaster, p.backdrop, 0.38);
  const backdrop = new Mesh(
    c.kit.own(cellPlane({
      width: backW, height: backH,
      cols: Math.max(4, Math.round(backW / 1.6)),
      rows: Math.max(4, Math.round(backH / 1.4)),
      colour: backColour, jitter: 0.06, rng: backRng,
    })),
    wallMat,
  );
  backdrop.position.set(0, backH / 2 - rise, m.backZ - 0.1);
  backdrop.receiveShadow = true;
  root.add(backdrop);

  /**
   * The walls of the recess, from the back wall out to the mouth.
   *
   * These are what the `drapes` prop hangs against and what stops a wide shot
   * seeing out of the sides of the platform into the space between the recess
   * and the house wall. Single-sided and facing in, for the third time in this
   * file and the last.
   */
  const recessD = mouthZ - (m.backZ - 0.1);
  for (const side of [-1, 1]) {
    const flank = panel(recessD, backH, shade(plaster, 0.22));
    flank.position.set(side * flankX, backH / 2 - rise, m.backZ - 0.1 + recessD / 2);
    flank.rotation.y = side * -Math.PI / 2;
    flank.receiveShadow = true;
    root.add(flank);
  }

  /**
   * The recess soffit — the platform's own ceiling, and the one lid in this
   * room anybody actually sees.
   *
   * The hall ceiling is at the very top of the widest shot and out of every
   * other one. This is at six and a half metres directly over the orchestra, it
   * is what the lighting bar is bolted to, and it is the surface that makes the
   * recess a recess rather than a change of wall colour. Ribbed across, in the
   * same rhythm as the coffers above it and for the same reason: an unbroken
   * plane at a constant normal takes exactly one value of light.
   */
  const soffitD = mouthZ - m.backZ;
  const soffit = new Mesh(
    c.kit.own(cellPlane({
      width: flankX * 2, height: soffitD,
      cols: Math.max(3, Math.round((flankX * 2) / 1.5)),
      rows: Math.max(3, Math.round(soffitD / 1.5)),
      colour: shade(lidColour, 0.42), jitter: 0.06, rng: lidRng,
    })),
    c.kit.solid('#ffffff', { vertexColors: true, rough: 0.98, side: DoubleSide }),
  );
  soffit.rotation.x = -Math.PI / 2;
  soffit.position.set(0, soffitY, m.backZ + soffitD / 2);
  root.add(soffit);

  {
    const ribs = Math.max(2, Math.round(soffitD / 1.7));
    const rib = new InstancedMesh(
      c.kit.bevelBox(flankX * 2, 0.24, 0.22, 0.04), coffer, ribs + 1);
    const dummy = new Object3D();
    for (let i = 0; i <= ribs; i++) {
      dummy.position.set(0, soffitY - 0.13, m.backZ + (i * soffitD) / ribs);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      rib.setMatrixAt(i, dummy.matrix);
    }
    root.add(rib);
  }

  // --- the organ case ------------------------------------------------------
  /**
   * A dado, an order and a cornice on the back wall. **No pipes.**
   *
   * `organ-pipes` is a prop, it is drawn by `stage-props.ts` for whichever
   * venues rolled it, and a room that also drew a fan of front pipes would draw
   * two fans one centimetre apart. What is left over is the *case* — the
   * joinery the pipes stand in and the wall it is fixed to — and that is
   * architecture in the strict sense `rooms/types.ts` means: nothing outside
   * this directory has an opinion about it, and it is there in 1720 and in 1910
   * whether or not the dice put an organ in front of it.
   *
   * It has to work both ways round, because this genre rolls the pipes at 0.7
   * in 1720 and 0.2 in 1910. So it is an elevation rather than an object: a
   * plinth course along the floor, a row of pilasters, and a cornice under the
   * soffit. With pipes in it, that is an organ case and the pilasters are its
   * cheeks. Without them it is the panelled end of a platform, which is what the
   * back of a hall looks like when the organ went to a different building.
   *
   * ## Why the order starts at 2.6 m and not at the floor
   *
   * `stage-props.ts` states the rule this obeys while apologising for an organ:
   * *"a fan of bright vertical metal directly behind a row of heads is the
   * single worst backdrop a face can have"*. A row of pilasters is the same
   * object with the shine taken off, and the wall behind the players is the one
   * surface in the room where a vertical rhythm is actively harmful — it slices
   * every head in the band against a stripe that moves whenever the camera does.
   *
   * `HEAD_BAND.hi` is 2.4 m, and there is no drum riser in this genre to add to
   * it. So the order begins a handspan above the tallest thing a player can be,
   * the wall below it is a plain field, and the two zones are exactly the two
   * things the wall has to do: be quiet behind the band, and be a building above
   * it. Everything here also sits upstage of `backZ`, which clears the backline
   * by 0.4 m and the prop's own pipes — at `backZ + 0.26`, radius 0.078 — by
   * seven centimetres in front.
   */
  const corniceY = soffitY - 0.28;
  const orderTop = corniceY - 0.18;
  const caseZ = m.backZ - 0.02;
  if (orderTop > 3.2) {
    const plinth = new Mesh(
      c.kit.bevelBox(backW * 0.94, 0.8, 0.26, 0.04),
      c.kit.solid(shade(backColour, 0.34), { rough: 0.9 }),
    );
    plinth.position.set(0, 0.4, caseZ);
    plinth.castShadow = true;
    root.add(plinth);

    /**
     * The string course the order stands on.
     *
     * One 0.24 m band and it fixes the thing that was most obviously wrong with
     * the first version of this wall: pilasters that begin at 2.6 m and end at
     * nothing hang off the cornice like teeth, because a vertical member with no
     * base does not read as standing, it reads as suspended. This is the same
     * lesson `stage-props.ts` records twice — an object with nothing under it
     * reads as floating rather than as high up — and the cure is the same one,
     * which is to put something under it.
     *
     * A horizontal at this height is also safe where a vertical is not. It runs
     * a handspan over `HEAD_BAND.hi`, so it passes above every head in the band
     * rather than between them, and a line *over* a row of players is the line
     * every photograph of a platform already has in it.
     */
    const impost = new Mesh(
      c.kit.bevelBox(backW * 0.94, 0.24, 0.24, 0.04),
      c.kit.solid(shade(backColour, 0.2), { rough: 0.85 }),
    );
    impost.position.set(0, 2.6 - 0.12, caseZ);
    impost.castShadow = true;
    root.add(impost);

    const caseHalf = m.width / 2 - 0.2;
    const caseBays = Math.max(3, Math.round((caseHalf * 2) / 2.1));
    const cheekH = orderTop - 2.6;
    const cheeks = new InstancedMesh(
      c.kit.bevelBox(0.44, cheekH, 0.24, 0.04),
      // Plaster rather than gilt, unlike the order in the house. This one is
      // behind the players and reads against a lit wall; the same value step
      // that makes a pilaster in the stalls is a stripe here.
      c.kit.solid(blackBox ? plaster : shade(order, 0.24), { rough: 0.78 }),
      caseBays + 1,
    );
    const dummy = new Object3D();
    for (let i = 0; i <= caseBays; i++) {
      dummy.position.set(-caseHalf + (i * caseHalf * 2) / caseBays, 2.6 + cheekH / 2, caseZ);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      cheeks.setMatrixAt(i, dummy.matrix);
    }
    cheeks.castShadow = true;
    root.add(cheeks);

    const band = new Mesh(
      c.kit.bevelBox(backW * 0.94, 0.34, 0.26, 0.05), orderMat);
    band.position.set(0, corniceY, caseZ);
    band.castShadow = true;
    root.add(band);
  }

  // --- what the lamps hang on ---------------------------------------------
  /**
   * A bar on two drop rods from the recess soffit.
   *
   * The rods are the whole point of this being here rather than being a bare
   * group at a height. `RoomRig.flyBar` is explicit that a fly bar with nothing
   * reaching it is the bug the field was written after, and it is a bug this
   * room could have had in a new way: there is no grid over a concert hall, so
   * a pipe hanging in the air six metres over the orchestra with nothing above
   * it would read as a mistake rather than as a rig. Bolted to the ceiling it
   * reads as what every one of these buildings has actually got, which is a bar
   * that was added seventy years after the room was finished.
   *
   * `lights.ts` then does `flyBar.add(rig)` and spreads its pars along the
   * bar's local x without knowing that this is not a fly tower — which is the
   * point of the contract.
   */
  const flyBar = new Group();
  flyBar.name = 'fly-bar';
  flyBar.position.set(0, m.flyY, m.curtainZ - 1.1);
  const pipe = new Mesh(
    c.kit.bevelBox(m.openingWidth * 0.86, 0.08, 0.08, 0.04),
    c.kit.solid(shade(p.proscenium, 0.72), { metal: 0.5, rough: 0.45 }),
  );
  flyBar.add(pipe);
  const rodH = Math.max(0.08, soffitY - m.flyY - 0.04);
  for (const side of [-1, 1]) {
    const rod = new Mesh(
      c.kit.bevelBox(0.05, rodH, 0.05, Math.min(0.02, rodH * 0.3)),
      c.kit.solid(shade(p.proscenium, 0.8), { metal: 0.5, rough: 0.5 }),
    );
    rod.position.set(side * (m.openingWidth * 0.3), rodH / 2, 0);
    flyBar.add(rod);
  }
  root.add(flyBar);

  /**
   * No curtain, and of everything in this file it is the fact that settles the
   * room in the first second.
   *
   * There has never been a curtain in a concert hall. There is nothing to
   * conceal — no scenery, no set change, no illusion that the room is somewhere
   * else — and the whole social shape of the evening is that you watch the
   * players walk on, tune, and wait for the conductor. A house tab in this room
   * would be arguing that something is about to be *revealed*, which is the one
   * claim the repertoire does not make.
   *
   * `noCurtain()` is what makes that free. It reports the cloth as being
   * exactly where the show asked for it on the same frame, so `show.ts` never
   * stalls waiting for travel that will not happen, the band is still held
   * invisible while it is being staged, and the reveal becomes a cut. See
   * `RoomRig.curtain` — the runner does not branch and it should not start.
   */
  const curtain = noCurtain();
  root.add(curtain.root);

  return { root, flyBar, curtain };
}

export const concertHall: RoomBuilder = { shape, build };
