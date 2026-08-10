/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The hall — a wide, low, modern civic room: a concrete floor, four concrete
 * walls, a beamed slab, and a bowed cyclorama across the whole upstage end.
 *
 * `synth/staging.ts` chose this and named it, and the sentence it chose it
 * *against* is the brief for everything below: *"that room is built to have no
 * focus; this genre has one."* It also rejected the cellar for being too small
 * for a wall of patch cables and the pavilion for being the wrong evening, and
 * then said what it wanted instead — *"a planetarium, a Kunsthalle, a cathedral
 * with a PA flown in it, a municipal auditorium with a screen"*, whose common
 * denominator across 1972–1990 is *"a big civic room, a rectangle of light
 * upstage, and more cable than band"*.
 *
 * That list is not four buildings. It is one building: a **large plain modern
 * volume with hard surfaces and no ornament**, hired for the night by people who
 * brought everything they cared about with them on a trolley. The room's job is
 * not to be looked at. Its job is to be the thing the light and the smoke happen
 * *on*, and this genre carries the most fog in the project — 0.55, 0.62 and
 * 0.75, against a black box's 0.5 and a proscenium's 0.2 — so a beam here is not
 * a line, it is a solid, and a solid needs somewhere to land.
 *
 * ## What this is not, stated first, because it is one of three halls
 *
 * There were eleven rooms when this was written, there are twelve in `ROOMS`
 * now, and this one is bracketed by two that could
 * swallow it. Being explicit about the difference is cheaper than discovering it
 * from a screenshot.
 *
 * **It is not `concert-hall`.** That room's whole claim is that *the audience is
 * the architecture*: a floor that climbs one step a row, two galleries, a giant
 * order, coffers in two directions, a plastered recess with a cornice over it,
 * and a section that goes up to 10.9 m. Every one of those is absent here and
 * absent on purpose. **The floor is dead flat**, because the nine rows in this
 * house are *standing* — `audience.seated` is false, and the genre's own comment
 * says why: *"nobody in this repertoire's audience was ever in rows of chairs
 * facing a man behind a Prophet-5"*. There is no gallery, no pilaster, no
 * moulding, no cornice and no plaster of any kind. And the room is **wide and
 * low** where the hall is narrow and tall: 15.8 m between the walls under a
 * 6.1 m soffit, about 2.6 to 1, against a shoebox that is taller than it is
 * wide. That is a section a shoebox cannot make, and it is the single quickest
 * way to tell the two apart from one frame. The concert hall is a room you are
 * meant to notice. This is a room you are meant to forget until a beam crosses
 * it.
 *
 * **It is not `circuit`.** That room is *anonymous by construction* — four
 * surfaces "falling away into black", walls 3.5 m outside the house painted
 * `shade(backdrop, 0.66)`, which on a rock arena resolves to `#050609`, and a
 * header that says in as many words that the building must give away nothing
 * about which town it is in. This room is the opposite claim, and the fog is why.
 * A hall whose walls are black and eight metres away is a hall where a beam
 * crossing the room ends in nothing; the beam has to *arrive* somewhere or the
 * light stops being architecture and goes back to being a lamp. So the walls
 * here stand at the tight end of what a room may take — `houseWidth / 2 + 0.9`
 * against the circuit's `+ 3.5` — and they are concrete rather than black: a
 * value that can return light, close enough to be reached by it. Circuit's
 * ceiling is `Infinity` with steel ten metres up that nobody is meant to read;
 * this one publishes a real lid at head-and-a-half over the rig, and the lid is
 * in the top of every wide shot the show composes. See `hallHeight`, where that
 * was measured rather than guessed.
 *
 * The one-line version: **circuit is a void with a rig in it; this is a room
 * with surfaces in it.** Both are large and dark and neither has any ornament,
 * and that is as far as the resemblance goes.
 *
 * ## The eras are one building, and this genre is the one that proves it
 *
 * Three eras — 1974, 1980, 1987 — and they do **not** differ architecturally.
 * That is a decision rather than an omission, and unusually it is a decision the
 * genre file already made on this room's behalf: *"The architecture is plain
 * proscenium … because the room itself is not the attraction: everything the
 * audience came to look at was carried in on a trolley."*
 *
 * A Kunsthalle built in 1968 was the same Kunsthalle in 1987. Nothing about a
 * municipal auditorium changed between the two dates, and the reason the three
 * photographs look nothing alike is not the building — it is that in 1974 there
 * were two floods and a dry-ice machine, in 1980 there was a truck of par cans,
 * and in 1987 there was so much smoke you could not see the back wall. All three
 * of those arrive here already: through `palette` (cathedral green, then cold
 * blue, then cyan-magenta), through `fog` (0.55 → 0.62 → 0.75) and through
 * `grow`, which takes the stage from 10.0 m to 10.6 m and takes every dimension
 * in this file with it, because all of them are fractions of `d.width`.
 *
 * So the room is continuous in the one channel it is allowed to see, and the
 * eras are the same hall hired three times. A room that switched on the string
 * `'digital'` would be a room only synth could ever use, and the registry in
 * `./index.ts` exists precisely so that is not what a room is.
 *
 * ## Modifiers
 *
 * `black-box` is honoured, and only as paint — the concrete, the beams and the
 * cyc all go matte and dark and the value steps between them close up. That is
 * what painting out a hall does, and it is a real evening: a hired civic room
 * with everything sprayed black for a contemporary programme is a photograph
 * from this decade. Nothing structural moves, because nothing structural can:
 * you can paint a concrete slab and you cannot flatten it.
 *
 * The other three are refused, each for its own reason. `open-air` deletes the
 * lid and the walls, which are the only two things holding the haze that this
 * genre exists to hang in a beam — a hall with no roof is a festival field, and
 * that is `lawn.ts`. `low-ceiling` is the same deletion from the other end: this
 * room is already the lowest lid in the project that is still a public
 * auditorium, and taking it down to `LOW_CEILING` turns it into a function suite
 * with a Prophet-5 in it. `brick` is a material claim about a building that is
 * board-marked in-situ concrete by definition; a brick planetarium is a
 * different century. A genre that wants any of the three should name a different
 * architecture and get a compile error from `ROOMS` until somebody writes it.
 *
 * ## What this room may not draw
 *
 * `synth/staging.ts` names `projection`, `cables` and `riser` for the genre and
 * `drapes`, `pa-stack`, `wedges`, `flight-case`, `haze`, `rug` and `mirror-ball`
 * across the eras, and between them those are the entire evening: the lit
 * rectangle upstage, the gaffered multicore, the drum platform, the masking, the
 * PA, the monitors, the cases and the ball. Every one belongs to
 * `stage-props.ts`, which places them for every room at once. **This file draws
 * none of them**, and the two numbers where it and the props have to agree are
 * argued where those numbers are set — see `openingWidth` for the masking and
 * the fly bar's z for the mirror ball.
 *
 * What is left over is the building: the screed, the walls, the slab and its
 * beams, the cyclorama, the strip of stage floor behind the backline, and the
 * bridge the lamps are clamped to. It is a short list and it is the whole room.
 */

import {
  type BufferAttribute, DoubleSide, Group, InstancedMesh, Mesh, Object3D,
} from 'three';

import { blend, cellPlane, shade, tint } from '../stage-kit.js';
import {
  noCurtain, type RoomBuilder, type RoomContext, type RoomDatum, type RoomRig,
  type RoomShape,
} from './types.js';

/**
 * How high the platform stands above a flat floor with a standing crowd on it.
 *
 * The four rooms either side of this one have four different answers and every
 * one of them is bought with a fact about the house. A concert hall takes 0.6 m
 * because its floor climbs 1.1 m on its own and a platform that also lifted a
 * metre would be a variety theatre. A cellar takes 0.4 m because the ceiling
 * needs the height more than the band does. A touring deck takes 1.0 to 1.45 m
 * because nine thousand people are standing on a flat slab. A proscenium takes
 * 0.9 m, which is a stage built into a building.
 *
 * This house is **flat and standing**, so the platform has to do all of the work
 * — there is no rake to help — and it is *hired*, so it is not built into
 * anything. That pair has exactly one answer in the real world: staging modules
 * on legs, out of a truck, and the legs come in fixed lengths. 1.0 m is the
 * tallest standard leg, and it is what a hall hires when the floor is flat and
 * the audience is on its feet. Anything above it needs a handrail by law and
 * stops being a hired platform; anything below it and the ninth row is watching
 * the back of the second row.
 *
 * Measured against the crowd rather than asserted: `crowdExtent` puts the top of
 * the tallest head in a nine-row standing house at `houseY + 2.22`, so at this
 * rise the furthest crowns sit **1.22 m above the boards** — a standing player's
 * hip. A proscenium's 0.9 m puts them at 1.32 m, up at the waist, and the
 * circuit's arena deck puts them at 0.8 m, below the knee. Hip height is the
 * right one for this room: the front of the crowd is a dark edge along the
 * bottom of the frame rather than a field of heads, and the keyboards — which in
 * this genre are most of the band and stand at about 0.95 m — clear it.
 */
const HALL_RISE = 1.0;

/**
 * How far outside the boards the masking hangs, and therefore what the aperture
 * means in a room with no arch in it.
 *
 * There is no portal here — see `build`, where the side walls run unbroken from
 * the back of the house to the cyclorama and nothing steps in at the stage. So
 * the aperture cannot be a hole in a wall the way the concert hall's is, and it
 * is not the deck the way the circuit's is either. **It is a line in the air**:
 * the width the room's own black legs are hung to, which is the only thing in
 * this building that says where the picture stops.
 *
 * That makes the number a contract with a prop rather than with a surface, and
 * the contract has a floor under it. `BUILDERS.drapes` anchors its inner edge at
 * `max(play.halfX, openingWidth / 2 - 0.25)`, and `play.halfX` is
 * `width / 2 - 0.5`. So if this were under 0.25 m the playing area would win
 * that `max` and **the room would stop deciding where its own masking hangs** —
 * the legs would clamp to the band instead, and every era would mask to the same
 * place regardless of what the building said. At 0.45 m the room's number wins
 * by 0.2 m in all three eras and the legs land 0.45 m outside the boards, which
 * is the least offstage a keyboard player can step into.
 *
 * It also sets the whole rig, because everything hung reads `openingWidth`:
 * `lights.ts` spreads its pars to `openingWidth / 2 - 0.8` and draws the
 * cyclorama glow at `openingWidth * 1.02`. Measured across the catalogue this
 * comes out at 1.085 to 1.090 of the stage, which puts the room between the
 * concert hall's 1.07 and the circuit's 1.14–1.17 and well clear of a
 * proscenium's 0.94 — a hall wider than its band and narrower than a touring
 * deck, which is the ranking it should have. The hard rule in `RoomShape` —
 * never narrower than the playing area, because `cast.ts` clamps players to a
 * hardcoded `width / 2 - 0.5` and cannot see this file — is cleared by 1.9 m.
 */
const MASK_OUT = 0.45;

/**
 * How far outside the house the concrete stands.
 *
 * The minimum any room may take is `houseWidth / 2 + 0.6`, and this is nearly
 * that: a handspan more, and 2.6 m less than the circuit's. It is the single
 * most consequential difference between the two rooms and it is entirely about
 * the fog.
 *
 * `stage.ts` builds `new Fog(colour, 14 - 12 * fog, 78 - 56 * fog)`, and this
 * genre carries the heaviest `fog` in the project — so in 1987 the near plane is
 * at **5.0 m** and the far at 36 m, which is by some distance the thickest air
 * any room here has to stand in. At `+0.9` the side walls run from 8.4 m from
 * the house camera at their nearest to 16.7 m where they meet the cyclorama —
 * **0.11 to 0.38 of the way to the fog colour**: visibly hazed at the upstage
 * end, and still a surface with a value you can read along its whole length.
 * Push them out to the circuit's `+3.5` in this air and the far end of the same
 * wall goes to 0.45, which is where a wall stops being a wall and becomes the
 * fog with a slightly different grey in it. That is exactly what the circuit
 * wants and exactly what this room cannot have.
 *
 * Here the room has to be *found* by the light — a beam that leaves
 * the rig and dies in haze without hitting anything is a beam in an empty field,
 * and this genre's whole visual argument is that the beam lands on something
 * civic and hard.
 *
 * So the walls come in as close as the contract allows and stay lit. The cost is
 * honest: this is a smaller room than the arena and it reads as one. A hall for
 * two thousand people rather than nine.
 */
const WALL_OUT = 0.9;

/**
 * How far upstage of `backZ` the ends of the cyclorama stand, and how far past
 * that its centre bows.
 *
 * A cyclorama is concave toward the audience, so the middle of it is the
 * furthest thing in the room and the ends come forward to meet the side walls.
 * 0.9 m of bow across a 15.8 m chord is a radius of about 35 m, which is a very
 * shallow curve and is on purpose: this is a *building's* end wall, poured that
 * way, not a stretched cloth on a curved track.
 *
 * The point of it is not the plan. It is the **normal**. `cellPlane` computes
 * flat per-face normals on a non-indexed grid, so bending the plane and
 * recomputing gives a wall whose facing swings ±13° from one end to the other —
 * and a single directional light therefore lays a gradient across it instead of
 * one flat value. That is the same problem every other room in this directory
 * has had with a large blank surface and it is the reason they all have cells in
 * them: *a plane whose normal never varies is lit to exactly one number and
 * reads as a hole however well the colour is chosen.* The cells are still here
 * too. The curve is what a room whose backdrop is half the frame gets on top,
 * and it costs no draw call at all — it is the same one mesh, displaced.
 */
const CYC_FROM_BACK = 0.15;
const CYC_BOW = 0.9;

/** Where a cloth would hang if there were one. See `curtainZ` and `build`. */
const CURTAIN_FROM_LIP = 0.5;

/**
 * How far upstage of the curtain line the lighting bridge crosses, and it is set
 * by an object this file does not draw.
 *
 * `BUILDERS['mirror-ball']` hangs its ball at `z = lipZ - 1.4` with a 0.34 m
 * radius and a 0.6 m rod above it, so it occupies a cylinder of z from
 * `lipZ - 1.74` to `lipZ - 1.06`. The polysynth era rolls it one night in five
 * and the digital era three in twenty, so it is not a rare enough case to leave
 * to luck. At `curtainZ - 1.5` — which is where the arithmetic wanted the bar —
 * the bridge's downstage stringer lands at `lipZ - 1.68`, **inside the ball**,
 * and one show in five would have had a steel walkway through a mirror ball.
 *
 * 1.7 m puts the bridge at `lipZ - 2.2` and its downstage stringer at
 * `lipZ - 1.88`, which clears the ball's nearest face by 0.14 m at every height
 * and every era. What it costs is stated rather than hidden: `lights.ts` aims
 * every par at `flyBar.z - 1.9`, so the wash lands at `z = -0.8` — a little
 * upstage of stage centre rather than on it. In this genre that is close to
 * free and arguably right, because the upstage half is where the modular, the
 * riser and the two players who are not at the front line all are, and the front
 * line is lit from the house by the follow spot, the key and the footlights.
 */
const BRIDGE_FROM_CURTAIN = 1.7;

/**
 * Where the bar trims, as a fraction of the picture. **Measured, not chosen.**
 *
 * `circuit.ts` prescribes the check and this room ran it. Solving `camera.ts`'s
 * wide shot by hand for all three eras: `lipDistance` binds on every window from
 * 4:3 upward, which settles the lens at 11.3–11.6 m out and `wideEye` lifts it
 * to 3.54–3.58 m, tilted about 10.5° down onto `WIDE_AIM_Y`. With a 42° vertical
 * field the top edge of frame passes through **5.13 m** at the bridge's own z in
 * 1974 and 5.19 m in 1987.
 *
 * At 0.74 of the aperture the bar lands at 3.48 m and 3.69 m, so there is
 * 1.65 m of picture above it in the earliest era and 1.51 m in the latest, in
 * every aspect ratio tested. It also clears `HEAD_BAND.hi` — 2.4 m, riser
 * included — by more than a metre, which matters here because the pars are
 * short-yoked (see `headroom`) and hang almost on the pipe.
 *
 * The proscenium's `openingHeight - 0.35` would have put it at 4.35 m: still
 * inside the frame in this room, unlike in the arena, but 0.75 m under the beam
 * soffit and reading as a bar jammed against the ceiling rather than as a
 * bridge with a room over it. The fraction is used rather than the
 * offset because it is the honest description of a trim height — an operator
 * trims a bar to the picture, not to the ceiling.
 */
const FLY_TRIM = 0.74;

/**
 * The beams under the slab: how deep they hang and how thick they are.
 *
 * `RIB_DEEP` is load-bearing in a way a decoration would not be, because the
 * **published lid is the underside of the beams and not the slab**. That is the
 * truth about the building — in a room like this the lowest thing over your head
 * is a downstand beam, and the slab is a third of a metre behind it — and it
 * also fixes a collision that the other way round would have been permanent:
 * `lights.ts` brackets the follow spot at `roomLid - 0.3` and draws a 0.35 m can
 * there, so a lid published at the slab with 0.34 m beams hanging off it would
 * have put the front-of-house lantern **inside a beam** in every era, at the one
 * position in the room the audience is standing directly under. Publishing the
 * soffit hangs it 0.3 m below the beams instead, which is where a FOH lantern in
 * an auditorium is actually bracketed.
 */
const RIB_DEEP = 0.42;
const RIB_WIDE = 0.3;

/**
 * How far apart the beams are, and it was 2.5 m until somebody looked.
 *
 * The wide shot only sees the ceiling from about `z = -1` upstage, because
 * everything nearer than that is above the top edge of the frame — so the whole
 * visible band of lid is two to three and a half metres deep depending on the
 * era. At 2.5 m centres that band contained **one beam, and in 1987 sometimes
 * none**, which is a ribbed ceiling that reads as a plain one: a single bar
 * across the top of a frame is a bar, and it takes two before the eye calls it
 * a rhythm.
 *
 * 2.1 m puts at least two in the band in every era and every aspect ratio, and
 * it is still an entirely ordinary spacing for downstand beams over a span this
 * wide. The deeper 0.42 m section is the other half of the same fix — a beam
 * has to have a face the light can find, and 0.34 m seen almost edge-on from
 * below is a line rather than a member.
 */
const RIB_GAP = 2.1;

/**
 * How high the room is, from the house floor to the underside of the beams.
 *
 * **The number this room is most easily got wrong on, and it is low on purpose.**
 * The instinct for a genre whose brief says *planetarium* and *cathedral* is to
 * go up, and the concert hall is right there at 9.4–10.9 m showing how. That
 * would be the wrong building twice over.
 *
 * It is wrong architecturally, because these were not tall rooms. A Palais des
 * Sports, a Kongresshalle, a university great hall and a nineteen-seventies
 * municipal auditorium are all *wide and low* — a big flat slab on a big flat
 * plan, which is what a poured concrete civic building of that decade is. The
 * proportion here is 15.8 m between the walls under a 6.5 m soffit, a shade
 * under two and a half to one, where the concert hall is about one and a half to
 * one the other way. Two sections, two buildings, and no viewer has to be told
 * which is which.
 *
 * And it is wrong for the fog, which is the argument that actually decided it.
 * The lid is not scenery in this room — it is **the top of the haze**, and haze
 * with no top is sky. Solving `camera.ts`'s wide shot by hand: the lens sits
 * 11.3–11.6 m out at 3.54–3.58 m and tilts about 10.4° down, so the top edge of
 * frame passes 5.3 m at stage centre and 6.1 m at the cyclorama. A ceiling at
 * 8 m — a perfectly reasonable civic height — is **above the top of every wide
 * shot the show composes**, in every aspect ratio, which is a ceiling that has
 * been built and never seen.
 *
 * ## The number was found by tinting the beams red and counting them
 *
 * 0.65 of the stage width was the first answer and it was still too tall,
 * which no amount of arithmetic would have shown: the lid was in frame, so the
 * check passed, and the picture was a plain grey band because **only one beam
 * fell inside it** — and one bar across the top of a frame is a bar, where two
 * is a rhythm. Rendering the room with the beams in flat red made that
 * countable in one screenshot, which is the only reason it was found at all.
 *
 * 0.61 puts the soffit 5.10, 5.28 and 5.47 m above the boards, and the ceiling
 * now enters the frame between `z = 1.24` and `z = -0.21` — **4.3 to 5.6 m of
 * lid** in the top of the picture, which at 2.1 m centres is two or three beams
 * in every era and every window from 4:3 up. The room comes out about 2.6 to 1,
 * which is a Kongresshalle to within a rounding error and is a proportion the
 * concert hall's shoebox cannot reach from the other side.
 *
 * Clamped at both ends because neither extreme is this building. Under 6.0 m
 * the masking legs — `openingHeight` tall and hung by `stage-props.ts` — come
 * within a handspan of the beams; over 6.6 m the second beam leaves the frame
 * again and the first version's problem comes back.
 */
function hallHeight(width: number): number {
  return Math.max(6.0, Math.min(width * 0.61, 6.6));
}

function shape(d: RoomDatum): RoomShape {
  const rise = HALL_RISE;
  /**
   * How high the picture goes, in a room whose ceiling is not the answer.
   *
   * There is no header, no arch and no soffit over the stage, so — exactly as
   * `circuit.ts` found — this cannot be a top edge, because there is not one. It
   * is the volume everything the audience is meant to look at fits inside: the
   * bridge trims in the top quarter of it, the cyclorama glow fills it, the
   * masking legs are cut to it and the projection sits at 0.45 of it.
   *
   * `width * 0.47` sits between the proscenium's 0.44 and the circuit's 0.5, and
   * the reason is that both of those are solving for something this room does
   * not have: the proscenium's is the height of an arch that exists, and the
   * arena's is a hall built for nine thousand people.
   *
   * **What actually pins it is the ceiling, through two objects this file does
   * not draw.** `BUILDERS.drapes` cuts its masking legs to exactly
   * `openingHeight` and stands them on the boards, and
   * `BUILDERS['mirror-ball']` hangs at `openingHeight * 0.82` with a 0.6 m rod
   * above it, topping out at `openingHeight * 0.82 + 0.8`. Both therefore rise
   * with this number toward a lid that does not move with it at all — and this
   * is a low lid. At the circuit's 0.5 the legs come to within
   * **0.10 to 0.17 m of the beams** in the three eras — a hand's breadth, which
   * is not clearance, it is a near miss repeated three times — and the ball's
   * rod to within 0.20 m. At 0.47 the legs clear by 0.40–0.48 m and the rod by
   * 0.45–0.58 m, which is the gap a hired masking rig actually has under a
   * ceiling it was not made for.
   */
  const openingHeight = Math.max(4.4, Math.min(d.width * 0.47, 6.2));
  /** The soffit of the beams, from the house floor. See `hallHeight`. */
  const soffit = hallHeight(d.width);

  return {
    rise,
    /** The masking line, not an arch and not a deck. See `MASK_OUT`. */
    openingWidth: d.width + 2 * MASK_OUT,
    openingHeight,
    /**
     * Where a cloth would be, and there is none — see `build`. It still has to
     * be the front of the room, because `stage-props.ts` hangs the masking legs
     * at `curtainZ - 1.6` and `curtainZ - 3.5` and this file hangs the bridge
     * off it. Half a metre in from the lip, which puts the downstage pair of
     * legs 1.2 m upstage of the stage edge — far enough back that a wide shot
     * sees the whole front line inside them, and far enough downstage that they
     * are still masking something.
     */
    curtainZ: d.lipZ - CURTAIN_FROM_LIP,
    /** See `FLY_TRIM`, where the wide shot was solved to place it. */
    flyY: openingHeight * FLY_TRIM,
    /**
     * **One lid, over the whole room, and the same number twice.**
     *
     * The cellar publishes two because it has plaster over the house and a lower
     * soffit over the stage; the concert hall publishes two the other way up
     * because its platform is recessed into an end wall and the volume carries on
     * past it. This room publishes one because it *has* one: a single flat slab
     * on a single set of beams, running unbroken from the cyclorama to the back
     * of the house at one height. That is not a simplification of a hall, it is
     * what a poured concrete civic room is — the roof is one pour and it does not
     * know where the stage is.
     *
     * Both are the underside of the beams rather than the slab, for the reason
     * `RIB_DEEP` gives: the lowest thing over your head in this building is a
     * downstand beam, and a follow spot bracketed 0.3 m under the published lid
     * has to come out under the beam rather than inside it.
     *
     * It is finite where the circuit's is `Infinity`, and that is the
     * architectural claim rather than a detail. It costs the camera nothing —
     * `wideEye` tops out at 3.6 m and `ceiling()` here is 4.50 m — and it buys one
     * thing and pays for one thing. It buys the follow spot its bracket. It pays
     * with `parDrop`, which `lights.ts` shortens from 0.24 m to 0.10 m in any
     * room with a finite lid, so the cans hang almost on the pipe. That rule was
     * written for a cellar and it happens to be exactly right here for a
     * different reason: these are lanterns clamped to the outside rail of a
     * lighting bridge, and there is a walkway immediately behind them. There is
     * no room to sling anything.
     */
    headroom: soffit - rise,
    houseLid: soffit - rise,
    /**
     * **The cyclorama, floor to slab and wall to wall — and this is the number
     * that matters most in this room.**
     *
     * `lights.ts` sizes the glow at `min(openingHeight * 1.06, backdropHeight -
     * 0.1)`, so this field is the *cap* on the one effect this genre's lighting
     * is mostly made of. A room that undersized it would not fail loudly; it
     * would quietly clip the glow and nobody would know what the full size had
     * been. The tanssilava failed the other way — a 2.4 m wall with a 4.7 m glow
     * on it, three metres of lit rectangle hanging in the night sky — and this
     * field exists because of it.
     *
     * Measured: the natural glow is 4.98 m in 1974 and 5.28 m in 1987, and the
     * cap here is 6.42 m and 6.79 m, so **the glow is never the binding term in
     * any era** and it comes out at its full height with 1.39–1.46 m of concrete
     * standing above it. That margin is not slack, it is the picture: the lit
     * rectangle has a wall over it and the beams cross that wall, which is what
     * makes the glow read as light *on* something rather than as a bright panel.
     *
     * It is the whole end of the building rather than a cloth, and that is the
     * only room in the project where that is true. The proscenium hangs a
     * backdrop, the arena hangs a drape, the concert hall builds a wall inside a
     * recess. Here the room simply ends in a curve, from the screed the crowd is
     * standing on to the underside of the slab, from one side wall to the other,
     * and everything the show does upstage — the glow, the two back lights, the
     * `projection` prop's shader field — happens on it.
     */
    backdropHeight: soffit + RIB_DEEP,
    /** Nearly the minimum, deliberately. See `WALL_OUT`. */
    wallX: d.houseWidth / 2 + WALL_OUT,
  };
}

function build(c: RoomContext): RoomRig {
  const p = c.venue.palette;
  const m = c.m;
  const blackBox = c.props.has('black-box');
  const rise = -m.houseY;

  const root = new Group();
  root.name = `room:${c.venue.id}`;

  /** Inner faces of the concrete, and the outer edge of everything here. */
  const halfX = m.houseWidth / 2 + WALL_OUT;
  /** Behind the last row, with the 1.6 m of margin every room in this directory keeps. */
  const houseBackZ = m.lipZ + m.houseDepth + 1.6;
  /** Where the cyclorama meets the side walls, and where its centre bows to. */
  const cycZ = m.backZ - CYC_FROM_BACK;
  const cycDeepZ = cycZ - CYC_BOW;
  /** Stage y of the beam soffits and of the slab above them. */
  const soffitY = m.houseLid;
  const slabY = soffitY + RIB_DEEP;

  // --- paint ---------------------------------------------------------------
  /**
   * Four values of one grey, mixed **up from `backdrop` toward `proscenium`**
   * rather than down the other way — and which end you start from is the whole
   * argument.
   *
   * `palette.proscenium` is this genre's room colour and in this genre it is
   * already concrete: `#7b7466` in 1974, `#8a8fa0` in 1980, `#6a7080` in 1987 —
   * a warm grey, a cold grey and a blue-grey, which is a fair description of
   * what happened to interior finishes over those thirteen years. So the hue is
   * right and the *value* is the decision, and it took a screenshot to settle.
   *
   * ## The cyclorama came down by half, and the first version had it the palest
   * thing in the building
   *
   * The reasoning that produced the pale one is `concert-hall.ts`'s, and it is
   * correct in that room and wrong in this one. That file put `palette.backdrop`
   * behind its orchestra and recorded the result — *"fifty-five per cent of
   * every wide shot in the show was a flat black rectangle"* — so it lightened
   * the wall, and this room, whose backdrop is wall to wall and floor to slab,
   * looked like it had the same exposure and worse.
   *
   * **It does not, because the two rooms are lit by different things.** A hall
   * is lit white, from lanterns, and a surface there is only as bright as its
   * own albedo. This room's upstage wall is lit by `buildCycGlow`, which is not
   * a lantern at all — it is an *additive card* drawn on the surface. Additive
   * light adds to what is under it, so a pale ground does not amplify the colour,
   * it **desaturates** it: cathedral green over mid-grey concrete came out as
   * grey-green milk, and the 1987 cyan-magenta came out as two barely different
   * greys. Put side by side with `circuit.ts` — whose drape is
   * `shade(backdrop, 0.18)`, near black, and whose glow reads as a slab of
   * saturated colour across half the frame — the diagnosis was immediate.
   *
   * So the cyc came down to **half the reflectance it started at** and now sits
   * with the side walls rather than above them, which is the opposite of what a
   * plaster hall does and is the right answer wherever the light is *added*
   * rather than reflected. The order across the four, lightest to darkest, is
   * beams, cyclorama, walls, slab: the beams are palest because an edge only
   * catches if there is something to catch, and the slab is darkest because it
   * faces down and never sees a lantern anyway.
   *
   * What keeps it from being the circuit's black void is that none of them is
   * black: every one is `backdrop` lifted some way toward `proscenium`, so above
   * the glow, where nothing is added, there is still a metre and a half of
   * legible concrete with beams crossing it. Dark enough to take a colour, light
   * enough to be a building.
   *
   * `black-box` takes the light out of all four and closes the gaps between
   * them, which is what spraying a hall out does: the beams stop reading against
   * the slab because there is no longer a value difference between a beam and
   * the concrete behind it.
   */
  const grey = (lift: number, dark: number): string =>
    shade(blend(p.backdrop, p.proscenium, blackBox ? lift * 0.45 : lift), dark);
  const cycColour = grey(0.19, 0.1);
  const wallColour = grey(0.23, 0.3);
  const slabColour = grey(0.17, 0.34);
  const ribColour = grey(0.32, 0.24);
  const concreteMat = c.kit.solid('#ffffff', { vertexColors: true, rough: 0.96 });

  // --- the screed ----------------------------------------------------------
  /**
   * A power-floated concrete floor, wall to wall and end to end.
   *
   * Same one-draw-call trick and the same stream name as every other floor in
   * this directory, so the rooms stay comparable seed for seed — but the cells
   * are 1.8 m square, which is bigger than the circuit's 1.5 m poured bays and
   * much bigger than the proscenium's 0.9 m planks. A civic hall floor is a
   * single monolithic pour with saw cuts in it at the bay centres, and the one
   * thing that distinguishes it from a laid floor at any distance a camera
   * stands is that the grain is *square and large*. There is no direction to it,
   * because nobody laid it in courses.
   *
   * Colour off `boards` pulled most of the way to `backdrop` and darkened hard,
   * for the reason the arena states: `palette.boards` is the *platform*, and a
   * slab the colour of the staging on it is one flat field with a band floating
   * in the middle. It runs from behind the cyclorama to the back wall so that
   * every edge dies into a wall — an edge in mid-air reads as a plane rather
   * than as a surface, which is the failure the cellar's ceiling had.
   *
   * It receives. It is the large flat surface under the band, which is the first
   * clause of the shadow policy.
   */
  const floorW = halfX * 2;
  const floorD = houseBackZ - cycDeepZ;
  const floor = new Mesh(
    c.kit.own(cellPlane({
      width: floorW, height: floorD,
      cols: Math.max(6, Math.round(floorW / 1.8)),
      rows: Math.max(6, Math.round(floorD / 1.8)),
      colour: shade(blend(p.boards, p.backdrop, 0.8), 0.5),
      jitter: 0.09, rng: c.rng('housefloor'),
    })),
    concreteMat,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, m.houseY, (cycDeepZ + houseBackZ) / 2);
  floor.receiveShadow = true;
  root.add(floor);

  // --- the cyclorama -------------------------------------------------------
  /**
   * The end of the building, bowed, and the largest single surface in the
   * project.
   *
   * Fifteen and a half metres wide and seven metres tall in one mesh, running
   * from the screed to the slab and from one side wall to the other. There is no
   * seam in it, no cloth line, no bar it hangs off and nothing standing in front
   * of it that this file drew — the `projection` prop puts its shader field at
   * `backZ + 0.06`, the `pa-stack` puts cabinets at `backZ + 1.3` and `cables`
   * lays multicore at `backZ + 0.22`, all of them downstage of this and all of
   * them somebody else's.
   *
   * The bow is built by displacing the plane after `cellPlane` has coloured it
   * and then recomputing the normals — see `CYC_BOW` for why the normals are the
   * entire point and the plan offset is almost incidental. A parabola rather
   * than a circular arc, because over 0.9 m of sagitta in 15.8 m the two are
   * indistinguishable and one of them is four lines.
   *
   * It receives and does not cast. It is the definition of the shadow policy's
   * first clause — large, flat, behind the band — and it has no thickness to
   * cast with.
   */
  const cycW = halfX * 2;
  const cycH = m.backdropHeight;
  const cycGeo = c.kit.own(cellPlane({
    width: cycW, height: cycH,
    cols: Math.max(8, Math.round(cycW / 1.7)),
    rows: Math.max(5, Math.round(cycH / 1.5)),
    colour: cycColour, jitter: 0.045, rng: c.rng('backdrop'),
  }));
  {
    const pos = cycGeo.getAttribute('position') as BufferAttribute;
    const half = cycW / 2;
    for (let i = 0; i < pos.count; i++) {
      const t = Math.min(1, Math.abs(pos.getX(i)) / half);
      pos.setZ(i, -CYC_BOW * (1 - t * t));
    }
    pos.needsUpdate = true;
    cycGeo.computeVertexNormals();
  }
  const cyc = new Mesh(cycGeo, concreteMat);
  cyc.position.set(0, m.houseY + cycH / 2, cycZ);
  cyc.receiveShadow = true;
  root.add(cyc);

  // --- the stage floor behind the backline ---------------------------------
  /**
   * The strip of deck between the boards and the wall, and it is here because
   * the cyclorama being a *building* rather than a cloth leaves a hole.
   *
   * Every other room in the project puts its backdrop at about `backZ - 0.1`, a
   * handspan behind the upstage edge of the boards, so the 0.4–1.4 m drop from
   * the deck to the house floor is hidden by the thing behind it. This one bows
   * 1.05 m upstage at the centre, and a metre of open air between the back of
   * the boards and the wall is a metre of *nothing*, with the top of the apron
   * showing as a lit edge over a shadow — the exact "floating platform" reading
   * that `rise` exists to prevent at the front.
   *
   * So the stage floor runs back to the wall, which is what it does in any hall
   * where the platform is set out on a flat floor: the modules do not stop at
   * the backline, they stop at the concrete. One box, the height of the rise,
   * `openingWidth + 2.4` wide so its ends die into the dark behind the masking
   * rather than at a visible edge.
   *
   * It runs the full bow rather than following it, so at the sides it is buried
   * a little way inside the cyclorama. That is deliberate and free: the cyc is
   * opaque and spans wall to wall, so nothing behind it is reachable by any
   * camera in the room, and the alternative is a second displaced mesh to save
   * geometry nobody can see.
   *
   * It casts and receives — a chunky solid standing on a floor, which is the
   * second clause of the policy, and the only object in this room that is one.
   */
  const deckW = m.openingWidth + 2.4;
  const deckD = CYC_FROM_BACK + CYC_BOW;
  const deck = new Mesh(
    c.kit.bevelBox(deckW, rise, deckD, 0.04),
    c.kit.solid(shade(p.boards, blackBox ? 0.7 : 0.55), { rough: 0.92 }),
  );
  deck.position.set(0, -rise / 2 - 0.006, m.backZ - deckD / 2);
  deck.castShadow = true;
  deck.receiveShadow = true;
  root.add(deck);

  // --- the concrete --------------------------------------------------------
  /**
   * Three walls, in bays, standing where a beam can still find them.
   *
   * Board-marked in-situ concrete: the cells are 1.2 m across and 0.9 m tall,
   * which is a shutter panel, and the jitter is heavier than any other surface
   * in this room because that is what a board-marked pour looks like — every
   * panel a slightly different grey depending on how wet the mix was that
   * morning. It is the one place in this file where the texture is doing
   * anything at all, and it earns it: these walls are what the fog is standing
   * in front of and what the beams cross, so a wall lit to one flat number would
   * take the whole effect down with it.
   *
   * Three rather than four, unlike the arena. There is no fourth wall to draw
   * because the cyclorama *is* the upstage wall — the same surface, full height,
   * full width — which is the piece of this building that the circuit, with its
   * drape hung 3 m in front of a separate black wall, deliberately does not have.
   *
   * **Single-sided**, for the reason `proscenium.ts` gives and every room since
   * has taken without re-arguing: orbit yaw is not clamped, swinging round the
   * outside of a building is a thing a viewer does in the first ten seconds, and
   * a solid wall answers that with a black screen where a single-sided one lets
   * you look straight in. They receive and do not cast, because a wall is what a
   * shadow lands on and a plane's cast shadow is a black line.
   */
  const wallRng = c.rng('walls');
  const wallH = slabY - m.houseY;
  const wall = (w: number, h: number): Mesh => new Mesh(
    c.kit.own(cellPlane({
      width: w, height: h,
      cols: Math.max(4, Math.round(w / 1.2)),
      rows: Math.max(3, Math.round(h / 0.9)),
      colour: wallColour, jitter: 0.1, rng: wallRng,
    })),
    concreteMat,
  );

  const sideDepth = houseBackZ - cycZ;
  for (const side of [-1, 1]) {
    const mesh = wall(sideDepth, wallH);
    mesh.position.set(side * halfX, m.houseY + wallH / 2, cycZ + sideDepth / 2);
    mesh.rotation.y = side * -Math.PI / 2;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
  const rear = wall(halfX * 2, wallH);
  rear.position.set(0, m.houseY + wallH / 2, houseBackZ);
  rear.rotation.y = Math.PI;
  rear.receiveShadow = true;
  root.add(rear);

  // --- the slab ------------------------------------------------------------
  /**
   * One flat pour over the whole room, and the beams that hold it up.
   *
   * `DoubleSide`, cell-textured, and neither casting nor receiving. All three of
   * those were settled by the courtyard and the arguments carry over unchanged:
   * a hemisphere lights a single-sided plane from whichever face it has, so a
   * ceiling lit from its top is a ceiling the room cannot see; a plane whose
   * normal never changes takes exactly one value of light; and a shadow on a
   * ceiling would have had to be cast upward by the one shadow-caster in the
   * budget, which is pointed at the band.
   *
   * The beams are what a cell grid cannot do, which is have an **edge**. One
   * direction only — spanning the width, repeated upstage to downstage — where
   * the concert hall's coffers run in two. That is not economy, it is the
   * building: a coffered ceiling is a grid of panels and belongs to a room with
   * a plasterer in it, and a concrete civic hall of this period has one-way
   * downstand beams at **two-and-a-half-metre centres** because that is how the
   * slab
   * spans. That is the spacing this room was drawn at and it is `RIB_GAP = 2.1`
   * now — see the constant, which records at length that 2.5 m put one beam in
   * the visible band and sometimes none. The sentence is kept because the
   * *reason* for one-way beams is the point of the paragraph and the centres are
   * an aside; 2.1 m is an entirely ordinary spacing for the same slab. From the floor of the house it is a ladder of shadowed lines
   * receding over the audience toward the stage, and in this room it does a
   * second job the concert hall's coffers never had to: **it is what the haze
   * has for a top**. A beam of light crossing under a ribbed ceiling in smoke
   * picks out three or four of the ribs and stops; crossing under a flat plane
   * it stops at nothing.
   *
   * One instanced mesh for the whole ceiling structure. They neither cast nor
   * receive: they sit above every lantern in the rig, so any shadow of theirs
   * would have to be thrown upward.
   */
  const lidD = houseBackZ - cycDeepZ;
  const slab = new Mesh(
    c.kit.own(cellPlane({
      width: halfX * 2, height: lidD,
      cols: Math.max(4, Math.round((halfX * 2) / 2.1)),
      rows: Math.max(4, Math.round(lidD / 2.1)),
      colour: slabColour, jitter: 0.07, rng: c.rng('ceiling'),
    })),
    c.kit.solid('#ffffff', { vertexColors: true, rough: 0.98, side: DoubleSide }),
  );
  slab.rotation.x = -Math.PI / 2;
  slab.position.set(0, slabY, (cycDeepZ + houseBackZ) / 2);
  root.add(slab);

  {
    const bays = Math.max(3, Math.round(lidD / RIB_GAP));
    const ribs = new InstancedMesh(
      c.kit.bevelBox(halfX * 2, RIB_DEEP, RIB_WIDE, 0.04),
      c.kit.solid(ribColour, { rough: 0.94 }),
      bays + 1,
    );
    /**
     * Let 0.02 m up into the slab, not butted to its underside.
     *
     * `slabY` is `soffitY + RIB_DEEP` by definition, so a rib sitting on
     * `soffitY` has its top face on exactly the plane of the slab — and the
     * slab is `DoubleSide`, so the underside of it is drawn there too. Every
     * rib in the room therefore shared 3.5 m² of plane with the ceiling it
     * hangs from, which is a ladder of flickering bars over the whole house.
     * Raising them buries the top face instead, and it moves the *published*
     * lowest thing overhead — `m.houseLid` — 2 cm further away rather than
     * nearer, which is the safe direction for a number the camera solves to.
     */
    const dummy = new Object3D();
    for (let i = 0; i <= bays; i++) {
      dummy.position.set(0, soffitY + RIB_DEEP / 2 + 0.02, cycDeepZ + (i * lidD) / bays);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      ribs.setMatrixAt(i, dummy.matrix);
    }
    root.add(ribs);
  }

  // --- what the lamps are clamped to ---------------------------------------
  /**
   * A lighting bridge on four hangers, and it is part of the building rather
   * than part of the show.
   *
   * `RoomRig.flyBar` is explicit that the one thing not allowed is a bare group
   * at a height nothing reaches, because `lights.ts` does `flyBar.add(rig)` and
   * hangs a dozen fixtures off it without ever branching. The cellar answered
   * with a scaffold under its soffit, the barn with a purlin, the courtyard with
   * a wire wall to wall, the lawn by building two towers. This room has the
   * answer a real auditorium has: **a fixed steel bridge across the stage, hung
   * on rods from the slab, installed when the building was.**
   *
   * It is not a truss and it is not a fly bar, and the distinction is the room's
   * argument in one object. A truss is a touring lattice that arrived in the van
   * — `circuit.ts` refuses to draw one for exactly that reason, because `truss`
   * is a prop and a room drawing one would draw two. A fly bar is a pipe on
   * hemp from a fly floor, and there is no fly tower here and never was. A
   * bridge is a walkway with a pipe under each rail that somebody can stand on
   * to focus, and it is the single most characteristic piece of steel in a
   * post-war civic hall. Two stringers, a pipe, and four hangers running all the
   * way up to the slab, so that a lamp on this bar is visibly hanging off the
   * building and not off the air.
   *
   * The stringers are 0.32 m either side of the pipe, which is the number that
   * clears the mirror ball — see `BRIDGE_FROM_CURTAIN`, where that was measured.
   * `lights.ts` then lays its pars along the bar's local x out to
   * `openingWidth / 2 - 0.8` and short-yokes them at 0.10 m because this room
   * publishes a finite lid, which puts every can tight under the pipe with the
   * walkway behind it. That is what a bridge rig looks like, and it is a happy
   * accident of a rule written for a basement.
   */
  const flyBar = new Group();
  flyBar.name = 'fly-bar';
  flyBar.position.set(0, m.flyY, m.curtainZ - BRIDGE_FROM_CURTAIN);
  const steel = c.kit.solid(shade(tint(p.proscenium, 0.12), 0.6), { metal: 0.55, rough: 0.45 });
  const bridgeW = m.openingWidth + 2.2;
  const pipe = new Mesh(c.kit.bevelBox(bridgeW, 0.1, 0.1, 0.045), steel);
  flyBar.add(pipe);
  for (const at of [-0.32, 0.32]) {
    const stringer = new Mesh(c.kit.bevelBox(bridgeW, 0.24, 0.07, 0.03), steel);
    stringer.position.set(0, 0.14, at);
    flyBar.add(stringer);
  }
  /**
   * The hangers, and they have to reach. 2.6 m of rod going up from a bar under
   * an open sky is one thing; here the slab is at a known height and the rod is
   * cut to it, so the top of every hanger dies into concrete rather than
   * stopping in mid-air a little short of it. The same mistake the cellar's fly
   * wires made in the other direction, and the same cure.
   */
  const rodH = Math.max(0.1, slabY - m.flyY - 0.05);
  const rodMat = c.kit.solid(shade(p.proscenium, 0.68), { metal: 0.5, rough: 0.5 });
  const rodGeo = c.kit.bevelBox(0.05, rodH, 0.05, Math.min(0.02, rodH * 0.3));
  for (const x of [-0.38, 0.38]) {
    for (const z of [-0.32, 0.32]) {
      const rod = new Mesh(rodGeo, rodMat);
      rod.position.set(x * m.openingWidth, rodH / 2 + 0.05, z);
      flyBar.add(rod);
    }
  }
  root.add(flyBar);

  /**
   * No curtain, and the genre's own programme says so.
   *
   * `synth/staging.ts` prints a blurb tagged `slot: 'open'` reading *"already
   * running when the lights came up"*, which is a complete description of how
   * one of these concerts started and is flatly incompatible with a cloth. There
   * was never a curtain at any of them. The equipment was on the stage from load-
   * in, half of it was patched and humming before the doors opened, and what
   * happened at the top of the show was that the house went out — not that
   * something was revealed. A house tab in this room would be arguing that the
   * stage is a secret, when the entire staging of this repertoire is that the
   * machine is on display.
   *
   * `noCurtain()` is what makes that free rather than a special case. It reports
   * the cloth as being exactly where the show asked for it on the same frame, so
   * `show.ts` never stalls waiting for travel that will not happen, `band.visible`
   * is still held false while the band is being staged, and the reveal becomes a
   * cut: a dark room lit only by `HOUSE_FLOOR` for one fifth of a second, and
   * then the band and the light coming up together. Which is the photograph.
   */
  const curtain = noCurtain();
  root.add(curtain.root);

  return { root, flyBar, curtain };
}

export const hall: RoomBuilder = { shape, build };
