/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The ballroom — a flat floor, a gallery round three sides, a low wide arch at
 * one end, and a decorated room being used for something it was not decorated
 * for.
 *
 * `funk/staging.ts` names the building in its first line: *a ballroom with the
 * chairs taken out*. That sentence is doing more work than it looks like. It is
 * not describing a room that happens to have no seats in it — it is describing
 * a room that **had** seats, or a sprung floor, or a supper licence, and has
 * been emptied out and handed to a nine-piece band with a PA. The Apollo was a
 * burlesque house, the Regal was a cinema, the municipal hall down the road was
 * built for the mayor's ball, and by 1975 all three of them are doing the same
 * job on a Friday night. That mismatch — plasterwork over a room full of people
 * dancing to something four times louder than the plasterwork was moulded for —
 * is the entire character of this file, and everything below is either the
 * decoration or the mismatch.
 *
 * ## What this is not, at length, because it very nearly was
 *
 * `concert-hall.ts` is the room this one would have collapsed into if nobody
 * had said so out loud. Both are grand interiors, both are plastered, both have
 * a decorated ceiling, both have a gallery, and both put a band in a hole in the
 * end wall. Written carelessly they come out as one file with two palettes,
 * which is the exact failure `rooms/types.ts` exists to stop and which the
 * fourteen reskinned prosceniums are a monument to.
 *
 * So the differences are structural rather than decorative, and there are five
 * of them:
 *
 *  1. **The floor is flat.** The hall's whole architecture *is* the audience
 *     arranged in tiers — its own header says the rake is the thing you cannot
 *     mistake a hall for anything else by, and it spends an `InstancedMesh` on
 *     twelve steps to put a floor under the crowd's existing lift. This room
 *     builds no steps at all, deliberately, and the paragraph on the house floor
 *     below argues why that is a claim and not an omission.
 *  2. **The gallery is a gallery, not a fascia.** The hall's is a box against
 *     the wall — one bevelled solid per side, seen only from the front. A
 *     ballroom's is a shelf you can walk round with a drink, so this one has a
 *     visible soffit over the back of the floor, a panelled front and a capping
 *     rail, and it is nearly twice as deep. What you see from the floor is the
 *     *underside* of a balcony, which is the thing a horseshoe gallery reads by.
 *  3. **The room is low and wide, not tall.** The hall is 0.82 of its platform
 *     width high and clamped at 10.9 m, because a hall's volume is its acoustic.
 *     This one is 0.66 and clamped at 8.4 m — three metres shorter over a floor
 *     the same width — because a ballroom's volume is the *floor*, and the money
 *     went sideways.
 *  4. **There is an arch, and there is a cloth.** The hall has neither, and says
 *     so at length: no arch, no moulding, no valance, no tormentor, no masking
 *     flat, and above all no curtain, because there is nothing to reveal. This
 *     room is a *theatre*, however far it has come down in the world; it reveals
 *     things for a living. It has a moulded architrave standing proud of the
 *     end wall and a house tab that gathers, and `jb`'s own era note calls for
 *     "a theatre with a red house curtain" in as many words.
 *  5. **The ornament is tired.** The hall gilds: its order is `tint(proscenium,
 *     0.14)`, i.e. lighter than the plaster around it, which is what maintained
 *     gilding looks like. Everything here goes the other way — the ornament is
 *     pulled *toward* the wall rather than away from it — for the reason set out
 *     at `ornament` below. A maintained room has high contrast in its
 *     mouldings. A worked one does not.
 *
 * `circuit.ts` is the other neighbour and the other trap, because funk's later
 * eras arrive carrying `truss`, `pa-stack`, `screen` and `crowd-barrier`, which
 * between them are the entire arena set. The temptation is to let 1984 turn into
 * a small dark rig-led room, at which point this file has written `circuit.ts`
 * again with a lower ceiling. It does not, and the reason is in "the eras" below:
 * the *building* does not change across sixteen years, and the ballroom's answer
 * to a truss is not to become a shed but to have one bolted up in front of its
 * plasterwork, which is a better photograph and a true one.
 *
 * ## The eras are one building, and that is an argument rather than laziness
 *
 * `RoomDatum` has no era in it and must not — a room that switched on the string
 * `'electro'` would be a room only funk could ever use, and `./index.ts` exists
 * precisely so that a ballroom, a dancehall and a salon can be one file. The two
 * channels a genre author actually has are the *size*, through `StageDressing.
 * grow`, and the *modifiers*, through `props`. Funk uses the first and none of
 * the second, so this room is one building at four sizes: 11.5 m of stage in
 * 1968, 12.0 in 1975, 12.4 in 1980, 12.7 in 1984, and every dimension here is a
 * continuous function of that.
 *
 * That is also the right answer historically, which is the part worth arguing.
 * A 1984 electro number under plaster mouldings looks like an anachronism and is
 * not one: those buildings were still standing, still hired out, and still the
 * only room in a lot of towns with a stage and a licence. What actually changed
 * between `jb` and `electro` is what got hung in the room and what colour the
 * lamps were, and both of those already arrive — the truss and the LED wall
 * through `props`, and the paint through `palette.proscenium`, which goes from
 * `#c2a05a` gilt to `#565f6b` grey across the table. Every colour below is
 * derived from that entry, so the same arithmetic that reads as tired gilding in
 * 1968 reads as a room painted out in cold grey in 1984 with no branch anywhere.
 * The building is the constant; the decade is the paint and the equipment. That
 * is what those photographs are.
 *
 * ## What the room may not draw
 *
 * `dance-floor` is a prop, and it is in all four of funk's eras. So is `riser`,
 * `backline`, `pa-stack`, `truss`, `mirror-ball`, `screen`, `crowd-barrier`,
 * `wedges`, `neon`, `drapes`, `posters`, `bar`, `tables`, `chandelier` and
 * `flight-case`. Between them that is almost everything a photograph of this
 * room contains, and every one of them belongs to `stage-props.ts`, which places
 * them for every room at once — so a ballroom that drew its own sprung maple
 * would draw two floors two centimetres apart, and one that drew a mirror ball
 * would hang two of them turning at slightly different rates.
 *
 * The division that leaves is a good one and worth stating positively: **the
 * prop supplies the sprung maple and the room supplies the worn boards it was
 * laid into.** See the house floor. The same split runs through the whole file
 * — the room builds the alcove and the props stand the backline in it, the room
 * builds the grid batten and the prop hangs the truss off it.
 *
 * Where the two have to agree about a *number* there are three places, and all
 * three are measured rather than assumed: the mirror ball against the fly trim
 * (see `FLY_TRIM`), the truss's drop legs against the grid batten (see the fly
 * bar in `build`), and the offstage reach of `drapes` and `posters` against the
 * side walls (see the walls in `build`).
 *
 * ## The five modifiers, and why this room answers none of them
 *
 * `open-air` is a different building. A ballroom with no roof is a bandstand,
 * and the two things this file is made of — the gallery and the lid — are
 * exactly what it would delete.
 *
 * `low-ceiling` **is answered**, and the paragraph that used to stand here
 * refusing it is worth keeping the shape of, because the refusal was reasonable
 * and was still wrong. It said: a ballroom is defined by the volume over its
 * floor, put a 3.6 m lid on it and it is a function suite, which is a real room
 * somebody should write and is not this one.
 *
 * All of that is true about the *architecture* and none of it was ever a
 * decision this file got to make. `rnb/staging.ts` names `low-ceiling` on its
 * 1998 dressing — deliberately, at length, because that end of the repertoire
 * went back into a small room with candles on the tables — and a room cannot
 * decline a prop. `stage-props.ts` draws the two lids either way. What a refusal
 * bought was not a ballroom, it was a ballroom with a plaster ceiling drawn
 * across it at 3.6 m that nothing in the show had been told about: the camera
 * took its wide shot from 3.6 m, *above the lid*, filming the band through
 * whatever the ceiling did not occlude; the follow spot hung at 5.75 m, inside
 * the same plaster; and the gallery and the cove went on being built above both.
 *
 * So the room answers it, and answering it is five numbers and three omissions
 * — see `CLUB_RISE`, `shape`, and the three `club` branches in `build`. The
 * function suite the paragraph asked for is exactly what comes out, which is the
 * point: under the lid this is not a ballroom any more, and the file's job is to
 * stop drawing the parts of one that are now behind plaster.
 *
 * `brick` is a material claim about a building that is plastered by definition.
 * The plaster is not a finish here, it is what the mouldings are made of.
 *
 * `black-box` would be honourable — a listed room painted out for a rock booking
 * is a real evening — and it is still refused, because funk cannot produce it
 * and an unexercised branch in a room nobody can reach is a liability rather
 * than a feature. The paint is already doing the work: `palette.proscenium` at
 * `#565f6b` in 1984 *is* the room painted out, and it arrives without a flag.
 *
 * `haze` is not architecture. `stage.ts` reads it off the venue directly and
 * hangs cards of air; there is nothing here for a room to add.
 */

import {
  DoubleSide, Group, InstancedMesh, Mesh, Object3D, PlaneGeometry, TorusGeometry,
} from 'three';

import { buildCurtain } from '../stage-curtain.js';
import {
  blend, cellPlane, LOW_CEILING, shade, tint,
} from '../stage-kit.js';
import {
  type RoomBuilder, type RoomContext, type RoomDatum, type RoomRig, type RoomShape,
} from './types.js';

/**
 * How far the boards stand above the floor of the room.
 *
 * A metre, which is higher than the proscenium's 0.9 and lower than the touring
 * deck's 1.16, and it sits between them for a reason that is about this room's
 * floor rather than about taste.
 *
 * A proscenium house can afford 0.9 m because the seats behind row four are
 * climbing; a concert hall can afford 0.6 m because they are climbing steeply
 * and it says so. **Nothing in this room climbs.** `stage-audience.ts` lifts a
 * standing house 0.05 m a row — 0.45 m over ten rows — and that lift is a cheat
 * with nothing under it, which is a cheat this room specifically declines to
 * convert into architecture (see the house floor). So the crowd is, to the
 * nearest reasonable number, standing on one plane, and everything that gets the
 * band above it has to come out of the stage.
 *
 * The extra 0.1 m over a theatre is roughly what the missing rake would have
 * bought by the third row, and it is what a variety stage built into the end of
 * a flat hall actually measures. It is also what the crowd looks like from the
 * boards: `crowdExtent` puts the front row's heads at 0.62 m above the deck and
 * the tallest head in the house at 1.27 m, which is knee height and waist height
 * on a standing player. A band looking down at a dance floor, which is the
 * photograph the genre's own staging note asks for.
 */
const BALLROOM_RISE = 1.0;

/**
 * And how far they stand above it once the room has been ceilinged — a kerb, and
 * the one number in this file that was *solved* rather than argued.
 *
 * A metre of stage cannot survive `low-ceiling`. The prop hangs one sheet of
 * plaster across the whole room at `houseY + LOW_CEILING`, so the rise is the
 * *only* thing standing between the band and the ceiling: at 1.0 m the boards
 * get 2.6 m of it, which is 0.2 m over the tallest player `HEAD_BAND` allows.
 *
 * It was solved rather than argued, and the solving is worth keeping even though
 * one of the two walls it was solved against has since been demolished. The prop
 * used to step down to a soffit over the boards with a fascia joining the two,
 * and the fascia needed the house lid to stay above that soffit's fixed 2.85 m,
 * which put a hard ceiling of 0.75 m on this number; below 0.49 m the camera
 * failed from the other side, because `camera.ts` capped the lens at 2.25 m over
 * the boards and wants to stand 0.3 m over `crowd.topY`, which twelve seated
 * rows put at `houseY + 2.44`. The window was 0.49–0.75 m and 0.55 sat inside
 * both ends.
 *
 * With one flat lid neither wall binds: the cap is `LOW_CEILING - rise -
 * LENS_GAP` and the crowd is `-rise + 2.44`, so the rise cancels and the lens
 * clears the back row by 0.26 m at whatever height the boards care to be. The
 * number stays where it was because the *other* reason for it never depended on
 * the prop: it is `dancehall.ts`'s bandstand to the centimetre, which is the
 * platform a small room builds when it wants the band visible and has no height
 * to put them above the crowd with. Which is the 1998 room exactly.
 */
const CLUB_RISE = 0.55;

/**
 * How much of the stage's width the arch takes back, per side.
 *
 * **The aperture may never be narrower than `width - 1.0 m`**, because
 * `concert/cast.ts` clamps players to `min(width / 2 - 0.5, width * 0.47)` with
 * no link to this file and no way to see it, and a room that narrows the
 * aperture below that has no way to tell the caster. The symptom is half a
 * trumpeter behind a plaster jamb.
 *
 * 0.21 m a side takes 0.42 m in total and leaves 0.29 m of clear reveal outside
 * the outermost player in every one of funk's four eras — measured, not
 * estimated, because the cast clamp and the aperture scale at different rates
 * (`width / 2 - 0.5` versus a fixed subtraction) and the margin is smallest in
 * the smallest room. At 11.5 m the clamp is ±5.25 and the aperture edge is at
 * ±5.54; at 12.7 m it is ±5.85 against ±6.14. The margin happens to be constant.
 *
 * It is deliberately *thin*. The proscenium takes 3 % a side and the concert
 * hall gives 0.4 m *back* on the argument that it has no arch at all; this is
 * neither. It is the remains of an arch — a moulded band applied to the face of
 * a wall, standing 0.22 m proud of it, with almost no reveal behind it. That is
 * what a ballroom's proscenium is and it is why the band looks like it is
 * playing *in* the room rather than *through* a hole into it.
 */
const ARCH_REVEAL = 0.21;

/**
 * How far upstage of the lip the house tabs hang, and it is the proscenium's
 * number taken unchanged with its argument.
 *
 * `proscenium.ts` spends three paragraphs getting from 0.55 to 0.45, and the two
 * ends of the range are both hard: `cast.ts` holds the front line 0.7 m off the
 * lip, so anything upstage of 0.45 starts eating the 0.25 m of clearance that
 * stops the band showing through a closed cloth; and `lights.ts` sets a
 * footlight trough into the deck reaching `lipZ - 0.29`, which with the cloth's
 * own ±0.13 m fold envelope means anything downstage of 0.42 breathes through
 * the footlight shells.
 *
 * So 0.45 is not a preference, it is the only number in a 0.03 m window, and a
 * room that moved it would be re-litigating a fix rather than making a decision.
 * The one thing it costs is written down at `FLY_TRIM`.
 */
const CURTAIN_FROM_LIP = 0.45;

/** How far downstage of the boards the end wall of the room stands. */
const WALL_FROM_LIP = 0.3;

/**
 * Where the lighting bar trims, as a fraction of the arch.
 *
 * **This number was solved against two props rather than chosen, and both
 * solves are worth writing down, because a fraction that looks arbitrary is
 * exactly the kind of thing the next author deletes.**
 *
 * `circuit.ts` supplies the first half of the lesson: `openingHeight - 0.35` is
 * the proscenium's rule, it is right in a fly house where the bar lives behind
 * the header, and it put the arena's whole rig above the top of every frame the
 * show composes. Reproducing that solve here — the wide shot stands 11.2 m back
 * at 42°, `wideEye` lifts the lens to 3.53 m and it tilts 10.5° down onto
 * `WIDE_AIM_Y` — puts the top edge of frame at 4.93 m at the bar's own z in the
 * 1968 room, which is 0.33 m above the arch. The bar is in shot either way here;
 * what is *not* automatically in shot is the object hanging off it.
 *
 * That object is the second solve and it binds much harder. `BUILDERS.truss`
 * hangs at `flyY + 0.34` in a room with no lid, with a 0.34 m section, so its
 * lower chord sits at `flyY + 0.135` — and `BUILDERS['mirror-ball']` puts a
 * 0.68 m sphere at `openingHeight * 0.82`, crown at `openingHeight * 0.82 +
 * 0.34`. Three of funk's four eras carry both. Requiring the chord to clear the
 * crown is `flyY > 0.82 · openingHeight + 0.205`, i.e. a trim above 0.867 in the
 * smallest room, and requiring the truss to stay *inside* the opening rather
 * than disappearing behind the header is a trim below about 0.89. There is a
 * two-hundredth of the arch between those, and 0.88 is in it.
 *
 * What that buys, measured across the four eras: the truss's upper chord lands
 * 0.007–0.065 m under the arch soffit — it fills the head of the opening exactly,
 * which is what a hall rig bolted up as high as it will go looks like — and its
 * lower chord clears the mirror ball's crown by 0.071–0.100 m. The pars sling
 * 0.24 m below the pipe and land 1.41–1.83 m above `HEAD_BAND.hi`.
 *
 * ## The one intersection this room does not fix, and why
 *
 * The mirror ball's suspension rod runs 0.8 m up from the ball's centre at
 * `lipZ - 1.4`, and the truss's downstage chords sit at `curtainZ - 1.1 + 0.17`.
 * With `CURTAIN_FROM_LIP` at 0.45 those are 0.04 m apart in z, so the top of a
 * 0.04 m rod passes inside a 0.07 m steel tube four metres up, directly above an
 * opaque 0.68 m sphere.
 *
 * The room's only lever on that is `curtainZ`, and moving it 0.08 m upstage
 * separates them — at the cost of taking the closed curtain's clearance over the
 * front line from 0.25 m to 0.17 m, which is undoing by hand the fix that
 * `CURTAIN_FROM_LIP` documents. **The proscenium already has this intersection**
 * — it is in every funk venue the generator has ever built — and it has never
 * been visible, whereas a band showing through a closed cloth was reported. So
 * the trade is refused in the direction that keeps the visible thing right, and
 * the invisible one is named here rather than left to be re-discovered.
 */
const FLY_TRIM = 0.88;

/**
 * The highest the director's lens can ever get, restated from `camera.ts`.
 *
 * `wideEye` is `2.3 + min(d · 0.11, 1.3)` clamped to the room's own ceiling, so
 * 3.6 m is the top of it, and every other framing the show composes is lower —
 * the front shot is pinned at 1.6 m and the rest track a player's sternum.
 * Restated rather than imported, on the same bargain `HEAD_BAND` strikes with
 * `cast.ts`: a room that imported the camera to find out how tall it is has the
 * dependency the wrong way round, and if the two ever drift the symptom is
 * visible in the first frame.
 */
const LENS_CEILING = 3.6;

/**
 * The underside of the gallery, above the boards — and this is the number
 * `camera.ts` warns about while describing something else entirely: *"A wide
 * shot taken at standing height in the audience is a shot with the balcony rail
 * through the middle of the band."*
 *
 * The fix is geometric rather than careful, and it is the argument
 * `stage-props.ts` banks its chandeliers on. Everything standing on the boards
 * projects **below** the horizon of a camera that is above it and looking
 * slightly down; anything kept **above** the lens projects above that horizon;
 * and two things on opposite sides of the horizon cannot cross in the frame, at
 * any distance, on any aspect ratio, in any window. The tallest thing a player
 * can be is `HEAD_BAND.hi` at 2.4 m plus a 0.4 m riser; the highest the lens can
 * be is `LENS_CEILING`. So the only requirement on this number is that it is
 * greater than 3.6, and everything above that is margin.
 *
 * 0.55 m of margin rather than the concert hall's 0.75, and the difference is
 * not carelessness — it is that this room is three metres shorter. Every
 * centimetre the gallery is lifted for the camera's comfort comes off the
 * storey above it, and at 4.15 m there is still 0.91 m of upper wall between the
 * capping rail and the springing of the cove in the smallest era, rising to
 * 1.70 m in the largest. Below about 4.05 m that storey stops existing and the
 * gallery reads as a shelf screwed to the underside of the cornice.
 *
 * ## And it is out of shot twice over, which was worth measuring
 *
 * The horizon argument is the one that has to hold, because it is the one that
 * survives a window nobody has tried yet. But there is a second, cruder fact
 * about this particular room that is worth recording: the gallery's inner edge
 * stands at 6.75–7.35 m off the centre line, and the wide shot's frame is only
 * 4.11 m wide at the plane of the proscenium and 6.32 m at the plane it is
 * actually aimed at. The gallery is therefore outside the frustum *horizontally*
 * at every point along its run, in every era, on every aspect from 4:3 to the
 * 4.0 that `frameAspect` clamps at — because the room is 16.7 m wide and the
 * shot is framed on an 11.5 m stage.
 *
 * So the gallery is a thing the composed shots cannot see and the viewer's own
 * drag can, which is the correct shape for architecture: it is there when
 * somebody goes looking, and it is never in the way.
 */
const GALLERY_SOFFIT = LENS_CEILING + 0.55;

/**
 * How far in from the wall the gallery reaches, how tall its front is, and the
 * capping rail on top of it.
 *
 * 1.6 m is nearly twice the concert hall's 0.9 and the depth is the whole point
 * of the object. A hall's gallery is a rank of seats cantilevered over the
 * stalls and what you see of it from below is a fascia; a ballroom's is a
 * *promenade* — you go up there with a drink and lean on the rail and watch the
 * floor — and what you see of it from below is a ceiling over the back of the
 * room with people under it. Under two metres that undercroft does not read,
 * and the object collapses back into the hall's shelf.
 *
 * The front is two members rather than one for the same reason: a panelled
 * front with a moulded capping rail standing 0.06 m proud of it catches the top
 * light on its own upper face and throws a line of shadow under itself, where a
 * single box of the same height reads as a painted stripe. It is the concert
 * hall's cornice argument applied to the one horizontal in this room that
 * anybody is ever going to look at.
 */
const GALLERY_DEEP = 1.6;
const GALLERY_FACE = 0.62;
const GALLERY_RAIL = 0.16;

/** The depth of the coved band where the wall turns into the ceiling. */
const COVE = 0.75;

/**
 * How tall the room is over the floor, and the number that says ballroom rather
 * than hall louder than any ornament in the file.
 *
 * `concert-hall.ts` takes 0.82 of its platform width and clamps at 10.9 m,
 * arguing — correctly — that a hall's height is not a lid you notice but a
 * volume, and that the volume is most of why the place reads as grand. This
 * takes 0.66 and clamps at 8.4: 7.6 m over an 11.5 m stage where the hall would
 * be 9.8, and 8.4 over 12.7 where the hall would be 10.4.
 *
 * Three metres shorter over a floor of the same width, and it is the correct
 * three metres. A concert hall is tall because the reverberation time is the
 * product it sells. A ballroom is not selling a reverberation time; it is
 * selling a floor, and the money went sideways — into the width of the floor,
 * the depth of the gallery and the length of the bar. Every photograph of one of
 * these rooms has the same proportion in it: a ceiling you can see the detail of
 * without tipping your head back.
 *
 * The floor of 7.2 m is where the gallery stops having a storey above it and the
 * room turns into a school assembly hall. The ceiling of 8.4 is where the cove
 * leaves the top of the widest shot this room's own aspect ratio ever takes and
 * stops paying for its triangles.
 */
function ceilingHeight(width: number): number {
  return Math.max(7.2, Math.min(width * 0.66, 8.4));
}

/**
 * How tall the arch is above the boards. Wide and low, on purpose.
 *
 * 0.40 of the stage width against the proscenium's 0.44 and the concert hall's
 * effective 0.46, which does not sound like much until it is put the other way
 * round: this is an opening 2.5 times wider than it is tall, and the other two
 * are 2.3 and 2.2. A variety proscenium is a letterbox. It has to be, because
 * the act is a line of nine people standing shoulder to shoulder rather than a
 * pyramid of ninety on risers, and a tall arch over a wide flat band is a lot of
 * empty plaster with a follow spot wandering about in it.
 *
 * ## The floor of 4.4 m is architecture, and the reason that used to be written
 * here was not
 *
 * It said the floor was *not* architectural: it was the mirror ball. `BUILDERS
 * ['mirror-ball']` hung its rod from `openingHeight · 0.82 + 0.8`, so below
 * 4.44 m of arch the tip came out through the soffit into the header — invisible
 * from the front, and waiting for the first person to orbit the camera round to
 * the side. That is recorded rather than deleted, because it was wrong in two
 * different ways and both of them are the kind of thing that gets re-derived by
 * the next author who finds a bare number.
 *
 * **It sat on the wrong side of its own break-even.** Having named 4.44 as the
 * crossing it picked 4.4, where the tip works out at `4.4 · 0.82 + 0.8 = 4.408`
 * — 8 mm *above* the head of the opening, not the "0.03 m under the soffit" the
 * same paragraph claimed one sentence later. A floor that fails the test it is
 * justified by is pinning nothing.
 *
 * **And there was no soffit over the rod to come through.** The ball hangs at
 * `lipZ - 1.4`; the only wall a header can belong to is this room's end wall at
 * `lipZ + WALL_FROM_LIP`, 1.7 m downstage of the rod, with the open stage house
 * in between. Sweeping everything whose footprint covers the rod finds two
 * objects and no plaster: the `truss` prop's upper chord, which the tip ends
 * *inside* and which is the intersection `FLY_TRIM` names and deliberately
 * refuses, and this room's own grid batten 1.15 m above that — the structure a
 * ball in a hall is hung from in the first place.
 *
 * ## What 4.4 is
 *
 * The shortest arch this room will draw, as a claim about the picture. The 0.40
 * above is a *ratio*, and a ratio applied to the smallest halls that name this
 * architecture makes an opening whose head comes down toward the equipment
 * standing under it, because none of that equipment scales with the floor:
 * `HANG_FLOOR` is a fixed 2.65 m wherever the boards are, a player is
 * `HEAD_BAND.hi` tall in a 10 m room and in a 12.7 m one, and the bar with
 * everything on it trims off the arch. Below about 4.4 the storey over the band
 * stops being the empty plaster the letterbox argument is spending width on and
 * starts being a lid resting on the rig.
 *
 * So it binds only in the small rooms and only just: pop's 1965 and 1975 houses
 * at 10.0 and 10.6 m of stage, which want 4.00 and 4.24, and rnb's 1998 one at
 * 10.2 m, which wants 4.08; pop's 1985 and rnb's 1965 rooms land on 4.4 exactly
 * at 11.0 m, and everything wider takes the ratio. What it costs is the
 * proportion, in the one room that can afford to pay: at 10 m of stage the
 * opening goes from 2.5 : 1 to 2.27 : 1, which is the smallest house here still
 * reading as a proscenium rather than as a hatch.
 *
 * The 5.2 at the other end is a guard rather than a shape — the widest room this
 * architecture is given is 12.7 m, which wants 5.08 — and it is left in place so
 * that a genre arriving with a 14 m stage does not get a two-storey arch by
 * arithmetic.
 *
 * The mechanical bottom is written down so that nobody mistakes this for one
 * again. Both solves at `FLY_TRIM` bottom out around 3.4 m of arch: the truss's
 * lower chord meets the mirror ball's crown at `0.06 · openingHeight = 0.205`,
 * i.e. 3.42, and the pars reach `HANG_FLOOR` within a few centimetres of the
 * same number. There is a metre of margin under 4.4, and a future room that
 * wants a shorter arch should be re-measuring those two rather than this.
 */
function archHeight(width: number): number {
  return Math.max(4.4, Math.min(width * 0.4, 5.2));
}

/**
 * Whether `stage-props.ts` is about to ceil this room for us.
 *
 * One question in one place, because eight decisions hang off it — five numbers
 * in `shape` and three omissions in `build` — and a room that asked it eight
 * times is a room that will one day answer it seven ways. See the header for
 * why it is asked at all.
 */
function lidded(props: ReadonlySet<string>): boolean {
  return props.has('low-ceiling');
}

function shape(d: RoomDatum): RoomShape {
  const openingHeight = archHeight(d.width);
  const ceiling = ceilingHeight(d.width);
  const club = lidded(d.props);
  const rise = club ? CLUB_RISE : BALLROOM_RISE;
  return {
    rise,
    openingWidth: d.width - 2 * ARCH_REVEAL,
    /**
     * The arch keeps its full height under the lid, and it is not a contradiction
     * that the plaster is 1.35 m below the top of it.
     *
     * `proscenium.ts` does the same thing in the cellar and for the same reason:
     * the opening is what the *building* has, the lid is what has since been put
     * across it, and the prop's plaster hides the difference from every seat in
     * the room by running over the top of it. Shrinking it here would move the
     * arch, the architrave and the cheeks — the objects the ceiling is drawn in
     * front of — to fit a ceiling that is a suspended one.
     */
    openingHeight,
    curtainZ: d.lipZ - CURTAIN_FROM_LIP,
    /**
     * Under the plaster, though, because a lantern is not dressing.
     *
     * `FLY_TRIM` puts the bar in the head of the arch at 3.87 m, which under a
     * lid is 0.82 m inside the ceiling: the whole rig would light the stage from
     * a position the room does not contain, and the beams would begin in mid-air
     * below it. `proscenium.ts` and `shed.ts` both drop to a handspan under
     * their cellar's plaster and this is the same 0.13 m — the depth of the pipe
     * plus the shackle that holds it up.
     */
    flyY: club ? LOW_CEILING - rise - 0.13 : openingHeight * FLY_TRIM,
    /**
     * **`Infinity` over the boards, with a plaster ceiling 7.6 m over the house
     * six metres away, and that is the honest answer rather than a convenient
     * one** — in the three eras with nothing overhead. Under `low-ceiling` it is
     * the prop's plaster, which is genuinely the lowest thing over the band.
     *
     * This field is not a description of the ceiling — `RoomShape` says what it
     * is for in two clauses, that the camera keeps `LENS_GAP` under it and every
     * hanging prop clamps to it, and then says a height nobody can reach is the
     * honest way to publish "nothing is in your way". Over the boards of this
     * room there is a stage house: a dark void above the arch, masked from the
     * front by the header, with a grid batten across it at `openingHeight + 1.2`
     * and nothing else in it but air.
     *
     * There is plaster on top of that void — see the roof at the end of the
     * ceiling section, which was added after this paragraph and which the
     * paragraph used to deny — and it changes nothing here, which is the point
     * worth keeping. It is at `lidY`, the depth of the header above the arch
     * (1.99 m in the 1968 room) and 0.52–1.02 m above the top of the grid batten
     * across the eleven dressings that build it. The tallest thing anything in
     * this room reaches is that batten, which `truss` and `mirror-ball` land on
     * exactly — 6.000 m in 1975, 6.160 in 1980, 6.280 in 1984 — and the highest
     * framing the director composes is 3.60. `circuit.ts` publishes `Infinity`
     * under a steel roof ten metres up on exactly this argument. A clearance
     * plane nothing can reach is not a clearance plane.
     *
     * `circuit.ts` reached the same answer from the other end and its reasoning
     * is the reasoning here, so it is not re-argued but it is re-measured.
     * `BUILDERS.truss` hangs at `headroom - 0.28` whenever the number is finite,
     * so publishing anything real would fly the object three of funk's four eras
     * are built around straight up behind the header, where the audience cannot
     * see it — the lighting rig would become roof steel. Publishing `Infinity`
     * sends it down the `flyY + 0.34` path instead, which is where `FLY_TRIM`
     * was solved to put it: filling the head of the opening, in shot, in front
     * of the plaster.
     *
     * The four rooms with a soffit — the dancehall, the riihi, the sabha and the
     * shed — all publish `openingHeight` here, and this room is not being clever
     * by not doing so. Try it: with `headroom = openingHeight` the truss is
     * pinned at `openingHeight - 0.28` and its lower chord clears the mirror
     * ball by 0.003 m in the 1968 room. The soffit those rooms are publishing is
     * real and low and over the band; this room's stage house is real and high
     * and empty.
     *
     * ## The cost, paid off
     *
     * This used to end by naming a defect: `camera.ts` derived the drag ceiling
     * from this field and nothing else, so a viewer who pitched the camera all
     * the way up passed through the plaster over the house — *and it cannot be
     * fixed from here, because `houseLid` is published on the line below and
     * there is no consumer that reads it for a lens.* There is one now.
     * `camera.ts` takes the lower of the two lids, so the drag is held under the
     * house plaster in every era while the rig over the boards still hangs in
     * clear air. Nothing about the number changed; something finally read the
     * other one.
     */
    headroom: club ? LOW_CEILING - rise : Infinity,
    /**
     * And the plaster over the house, which is the room's own in three eras and
     * the prop's in the fourth.
     *
     * `LOW_CEILING` rather than the room's own plaster: the prop hangs its lid
     * at `houseY + LOW_CEILING`, so this is that same plane written the way
     * `RoomShape` wants it. Getting it
     * from the room's own 7.6 m ceiling instead would put the follow spot and
     * the chandeliers three metres above a lid they are supposed to be bolted
     * to, which is the bug `lights.ts` describes at `roomLid`.
     */
    houseLid: (club ? LOW_CEILING : ceiling) - rise,
    /**
     * The same plane as `headroom`, and under a lid the same *number*, because
     * the prop's plaster is one sheet over the boards and the house alike.
     *
     * `rigLid` is the steel a motor drop dies into rather than the lowest thing
     * a lens has to clear, and the two only come apart where the roof is sloped,
     * coffered or framed — the shed, the riihi and the salon, which are the
     * three rooms that answer it with anything but this line. A plaster soffit
     * is one plane and there is nothing behind it: measured over the truss's
     * pick at `±(width / 2 − 0.4)`, the club era's plaster is at
     * `LOW_CEILING - rise` and so is the first surface above it, to 0.000 m.
     *
     * `Infinity` in the other three eras, and that is the load-bearing half.
     * There is a stage house up there — see `headroom` — and what is in it is a
     * grid batten at `openingHeight + 1.2` for `truss` to find, with the room's
     * own plaster 0.52–1.02 m above that. Neither may be published here. The
     * batten would be a lid invented out of a beam that only exists over
     * `runs[0]`, and the prop already has its own clause for a room with a tower
     * and reaches the timber by itself. The plaster would be worse: a motor drop
     * solved against it is half a metre to a metre of steel *through* the grid it
     * is supposed to be shackled to, and the measurement says the drops land on
     * that timber to 0.000 m today.
     */
    rigLid: club ? LOW_CEILING - rise : Infinity,
    /**
     * The wall behind the band, measured from the floor like a wall — and it is
     * the same height as the room, because it *is* the room. The stage is an
     * alcove in the end of one rectangular hall rather than a separate building
     * bolted onto it, so its back wall and the ballroom's side walls are one
     * piece of plaster at one height, which is both the truth about the building
     * and one draw call each.
     *
     * Tall is free and short is not. `lights.ts` draws the cyclorama glow at
     * `min(openingHeight · 1.06, backdropHeight - 0.1)`, so this number can only
     * ever be the *lower* bound on the glow, and a wall shorter than the glow
     * would put a hard-edged lit rectangle in the air above it attached to
     * nothing — the failure the field was written after. At 7.6 m against a
     * 4.9 m glow there is no argument to have.
     *
     * Under the lid it is the lid: a wall carried on up to 7.6 m behind a
     * ceiling at 3.6 is four metres of plaster in a roof void, and the glow that
     * gets clamped to it is 1.4 m of light on the far side of the soffit. The
     * clamp still binds the right way round — 3.5 m of glow on a 3.6 m wall.
     */
    backdropHeight: club ? LOW_CEILING : ceiling,
    /** The plaster the side walls stand on. See `halfX` in `build`. */
    wallX: d.houseWidth / 2 + 0.6,
  };
}

function build(c: RoomContext): RoomRig {
  const p = c.venue.palette;
  const m = c.m;
  const rise = -m.houseY;
  /**
   * Under the prop's plaster, three things stop being built: the ceiling, the
   * gallery with the storey above it, and — at the fly bar, where it has its own
   * paragraph — the grid batten. See the header for why the question is asked.
   *
   * The ceiling is the one that has to go: `stage-props.ts` lays its lid at
   * exactly `m.houseLid` now, so this room's own coved plaster would be a second
   * surface on the same plane across the whole house — z-fighting the width of
   * the room, which is the failure `dancehall.ts` names as *two lids 10 cm apart
   * is two buildings*. The gallery and the storey above it are the cheaper half
   * of the decision: their lowest member is `GALLERY_SOFFIT` at 4.15 m, the
   * plaster is at 3.05 m, and there is no camera position under a lid from which
   * a single triangle of either is visible.
   */
  const club = lidded(c.props);

  /** Inner faces of the side walls, and the outer edge of everything. */
  const halfX = m.houseWidth / 2 + 0.6;
  /** Behind the last row, with the 1.6 m of margin every room in here keeps. */
  const houseBackZ = m.lipZ + m.houseDepth + 1.6;
  /** The end wall of the room, with the arch applied to its house face. */
  const wallZ = m.lipZ + WALL_FROM_LIP;
  /** Stage y of the plaster over the house, and the height of every wall. */
  const lidY = m.houseLid;
  const wallH = lidY - m.houseY;
  const halfOpening = m.openingWidth / 2;

  const root = new Group();
  root.name = `room:${c.venue.id}`;

  // --- paint ---------------------------------------------------------------
  /**
   * Four values off one palette entry, and the whole of what makes this room a
   * 1975 photograph rather than a 1975 colour scheme.
   *
   * `palette.proscenium` is the *room* colour — gilt in 1968, a duller gilt in
   * 1975, a chrome-grey in 1980, a cold slate in 1984 — and in a proscenium
   * house it only ever reaches the arch, which is one object at the front. Here
   * it is the entire building: the walls, the architrave, the gallery, the
   * pilasters and the cove are the same hue at four distances from the plaster.
   *
   * **The ornament goes toward the wall, not away from it**, and that single
   * decision is most of the tiredness. `concert-hall.ts` lightens its order to
   * `tint(proscenium, 0.14)`, which is right — a maintained room has strong
   * value contrast in its mouldings, because somebody gilds them. Nobody has
   * gilded this room since about 1954. What happens to plasterwork after twenty
   * years of that is that the contrast *closes*: the gilding goes dull, then
   * somebody paints the lot one colour to save money, and the mouldings survive
   * as shape rather than as brightness. So the ornament here is the palette
   * entry pulled 42 % back toward the wall it stands on and then darkened again.
   * It reads at all only because it is modelled proud and catches the top light
   * on its own upper faces, which is exactly how a real overpainted moulding
   * reads and is the reason every ornament in this file has thickness.
   *
   * The fascia gets a fourth value, pulled toward `backdrop` instead. A gallery
   * front is the one part of a room like this that gets repainted on its own —
   * it is what the audience looks at from the floor, it is where the sponsor's
   * name went, and it has been a different colour from the walls in every one of
   * these buildings at some point. Off-hue from the plaster is not an accident
   * here, it is the single most legible "this room has been worked" cue that
   * costs nothing but a `blend`.
   */
  const plaster = shade(blend(p.proscenium, p.backdrop, 0.5), 0.26);
  const ornament = shade(blend(p.proscenium, plaster, 0.42), 0.1);
  const fasciaColour = shade(blend(plaster, p.backdrop, 0.34), 0.08);
  const lidColour = shade(blend(p.proscenium, p.ambient, 0.24), 0.42);

  const ornamentMat = c.kit.solid(ornament, { rough: 0.72 });
  const fasciaMat = c.kit.solid(fasciaColour, { rough: 0.86 });
  const surfaceMat = c.kit.solid('#ffffff', { vertexColors: true, rough: 0.95 });

  const wallRng = c.rng('walls');
  /**
   * A plastered panel, and the cells are smaller and much noisier than the
   * concert hall's.
   *
   * That file uses 1.7 m cells at 0.05 jitter, which is a wall laid out in bays
   * by somebody who was paid to. This is 1.15 m at 0.15, which at any distance a
   * camera stands is not a rhythm at all — it is patching. Damp, filler, three
   * generations of emulsion and the ghost of a fire door. A uniform surface is
   * the one thing this room must not have, and the cell grid is the only
   * texturing this project owns, so the jitter is doing the work an image map
   * would do somewhere else.
   *
   * It is also the reason the walls are not one flat number under a hemisphere,
   * which the courtyard's ceiling learned the expensive way and every room since
   * has taken on trust.
   */
  const panel = (w: number, h: number, colour: string, jitter = 0.15): Mesh => new Mesh(
    c.kit.own(cellPlane({
      width: w,
      height: h,
      cols: Math.max(3, Math.round(w / 1.15)),
      rows: Math.max(3, Math.round(h / 1.0)),
      colour,
      jitter,
      rng: wallRng,
    })),
    surfaceMat,
  );

  // --- the floor of the room ----------------------------------------------
  /**
   * One flat plane of worn boards, with **no steps on it anywhere**, and the
   * absence is the single most load-bearing decision in this file.
   *
   * `concert-hall.ts` makes the opposite one at length and is right to: the rake
   * is already in the show and is currently a lie — `stage-audience.ts` says in
   * as many words that the floor is flat and the back rows are lifted off it —
   * so putting steps under twelve rows converts an existing cheat into an
   * existing building for the price of one `InstancedMesh`. That is a very good
   * trade in a room whose whole architecture is the audience arranged in tiers.
   *
   * It is the wrong trade here, and not by a little. This room's audience is
   * `seated: false, density: 0.9` — **the densest in the project** — and it is
   * *dancing*. Both halves of that have been overtaken by the two genres that
   * came after it and are kept because the trade is decided by the dancing. It
   * is funk's house that is `seated: false, density: 0.9`; pop and rnb name this
   * architecture too and both sit down, at 0.75 and 0.86. And 0.9 is fourth
   * now — metal 0.94, dnb 0.92, reggae 0.90 — with `shed.ts` holding the title. The rake `stage-audience.ts` applies to a standing house is
   * 0.05 m a row rather than 0.1, which over ten rows is 0.45 m and is a
   * different kind of cheat: it is not a raked floor drawn cheaply, it is a
   * crowd drawn with depth so the back of it does not vanish behind the front.
   * Building steps under that would be inventing a terraced dance floor, which
   * is not a thing, in the one room in the catalogue whose defining feature is
   * that the floor is flat enough to dance on. The hall's own header names the
   * distinction while dismissing it: *a pavilion's floor is flat because people
   * are dancing on it.*
   *
   * So: flat, and the 0.45 m stays a cheat. The one place it shows is a wide
   * shot low enough to see the back of the house edge-on, and what it looks like
   * there is a crowd that thins upward, which is what a crowd does.
   *
   * ## Worn boards, because the parquet is a prop
   *
   * `dance-floor` is in all four eras and lays `tint(boards, 0.15)` — bright,
   * polished, `houseWidth · 0.7` wide by 5.5 m deep — over the middle of this
   * plane at `houseY + 0.02`. That is the sprung maple, and it is the prop's.
   * What is left for the room is the floor it was laid *into*: the same boards
   * two shades down and much browner, running out to the walls, under the bar
   * and under the gallery where nobody has polished anything since the war. The
   * two together are the object — a lit rectangle of dance floor in a dark room
   * — and neither half is that object on its own.
   */
  const floorRng = c.rng('housefloor');
  const floorW = m.houseWidth + 8;
  /**
   * Sized off the building, not off the house.
   *
   * It was `houseDepth + 8` centred on `lipZ + houseDepth / 2`, which is a
   * house-shaped number for a plane that has to reach past the house at both
   * ends: `lipZ` and `backZ` are `±depth / 2`, so the upstage edge sits at
   * `lipZ - 4` whatever the room is, and the ground stops `depth - 4` metres
   * short of the back wall. It reads as a black triangle in each bottom corner
   * of a wide shot.
   *
   * **This room has the least masking of the five that carried it**, which is
   * why it belongs in the set even though it was found last. A proscenium hides
   * the wedge behind its tormentors and a courtyard behind its walls; a ballroom
   * is a lit box a camera is meant to swing around the outside of, and the
   * dancing floor is the thing the room is named for.
   */
  const floorFrom = m.backZ - 2;
  const floorTo = m.lipZ + m.houseDepth + 4;
  const floorD = floorTo - floorFrom;
  const floor = new Mesh(
    c.kit.own(cellPlane({
      width: floorW,
      height: floorD,
      cols: Math.max(8, Math.round(floorW / 0.72)),
      rows: Math.max(8, Math.round(floorD / 0.72)),
      colour: shade(blend(p.boards, p.backdrop, 0.5), 0.36),
      jitter: 0.12,
      rng: floorRng,
    })),
    surfaceMat,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, m.houseY, (floorFrom + floorTo) / 2);
  floor.receiveShadow = true;
  root.add(floor);

  // --- the walls -----------------------------------------------------------
  /**
   * Two sides and a back, running the **whole length of the building** — past
   * the proscenium wall and on to the back of the stage — because that is what
   * the building is. A ballroom with a stage in the end of it is one rectangle
   * with a partition across it, not a hall with a separate stage house bolted on
   * at one end, and drawing it as one wall each side is both the truth and half
   * the geometry.
   *
   * They stand at `houseWidth / 2 + 0.6`, which is the minimum this directory
   * allows, and taking the minimum is a positive claim rather than a default.
   * `circuit.ts` takes 3.5 m more and spends a paragraph on why an arena's
   * emptiness is its subject; a ballroom is the opposite building. It was put up
   * to get as many paying bodies as possible onto a floor inside four walls, and
   * the walls are *tight*: the crowd at the edges is against the plaster, and
   * the gallery overhead is 1.6 m of it.
   *
   * ## The offstage has to be wide enough for the props, and it was checked
   *
   * `drapes` hangs its four panels out to ±7.64 m in the largest era and
   * `posters` pins three sheets at ±7.04, both of them upstage of the
   * proscenium wall and facing inward — that is, in the offstage space this
   * wall encloses. At ±8.95 there is a metre and a third to spare behind the
   * furthest of them. `neon` was the third and hung a lit sign at ±6.99 on each
   * side; it hangs one on the back wall now and is no longer offstage at all. A room that pulled its walls in to the stage
   * edge, which is what a stage house of the boards' own width would be, would
   * hang four two-storey cloths and three posters in mid-air outside the
   * building.
   *
   * They receive and do not cast. A wall is the large flat surface behind and
   * beside the band that a shadow lands on, and a single plane has no thickness
   * to cast one with.
   */
  const sideFrom = m.backZ - 0.12;
  const sideDepth = houseBackZ - sideFrom;
  for (const side of [-1, 1]) {
    const wall = panel(sideDepth, wallH, plaster);
    wall.position.set(side * halfX, m.houseY + wallH / 2, sideFrom + sideDepth / 2);
    wall.rotation.y = side * -Math.PI / 2;
    wall.receiveShadow = true;
    root.add(wall);
  }
  const rear = panel(halfX * 2, wallH, plaster);
  rear.position.set(0, m.houseY + wallH / 2, houseBackZ);
  rear.rotation.y = Math.PI;
  rear.receiveShadow = true;
  root.add(rear);

  /**
   * The back of the stage, which is this room's backdrop and is a **wall**.
   *
   * `concert-hall.ts` records what happens if the palette's `backdrop` entry
   * goes here unmodified: fifty-five per cent of every wide shot becomes a flat
   * black rectangle. That lesson is real and it applies less here than it does
   * there, which is worth being exact about rather than copying the fix. A hall
   * has nothing else at the back of its platform, so the wall is the picture. A
   * funk stage has a backline, a PA, a truss, wedges, a neon sign and — in 1984
   * — a lit LED wall standing in front of this, and the cyclorama glow washing
   * up it. It is a background, and it has to stay one.
   *
   * So it goes most of the way toward `backdrop` rather than all of it: dark
   * enough that a screen reads as the brightest thing in the room and a rim
   * light still separates a player from it, light enough that it is legibly the
   * same plaster as the walls beside it rather than a hole. And it is the full
   * width of the building, because it is the building's own end wall.
   */
  const backRng = c.rng('backdrop');
  const backH = m.backdropHeight;
  const backdrop = new Mesh(
    c.kit.own(cellPlane({
      width: halfX * 2,
      height: backH,
      cols: Math.max(4, Math.round((halfX * 2) / 1.3)),
      rows: Math.max(4, Math.round(backH / 1.1)),
      colour: blend(plaster, p.backdrop, 0.62),
      jitter: 0.11,
      rng: backRng,
    })),
    surfaceMat,
  );
  backdrop.position.set(0, backH / 2 - rise, m.backZ - 0.1);
  backdrop.receiveShadow = true;
  root.add(backdrop);

  // --- the proscenium wall -------------------------------------------------
  /**
   * A partition across the building with a wide low hole in it, and the arch
   * standing proud of its house face.
   *
   * This is where the room differs from the concert hall in *plan* rather than
   * in dressing, and the difference is worth naming because both files draw
   * three panels round a rectangular opening. A hall's platform is **recessed**:
   * the side walls step in 0.55 m, the ceiling steps down three metres, and the
   * orchestra plays out of the far end of a box with reveals you can see into.
   * A ballroom's is a **hole in a thin wall**. There is no reveal to speak of —
   * 0.3 m, the thickness of the partition — and no step in the side walls at
   * all, because the walls do not change: they run straight past the opening and
   * on to the back of the stage. What steps is the *ceiling*, and it steps by
   * stopping.
   *
   * The cheeks run 2.6 m wider than the room on each side. That is masking
   * rather than architecture and it is bought for one framing: `frameAspect`
   * clamps at 4.0, at which the wide shot's frame is 9.14 m wide at the plane of
   * this wall against a room half-width of 8.95, so a wall that stopped at the
   * side walls would let a very wide window see 0.2 m past the corner of the
   * building into nothing. It costs nothing — the extra is a single plane
   * outside the room, invisible from every position inside it.
   */
  const cheekOuter = halfX + 2.6;
  const cheekW = cheekOuter - halfOpening;
  for (const side of [-1, 1]) {
    const cheek = panel(cheekW, wallH, plaster);
    cheek.position.set(side * (halfOpening + cheekW / 2), m.houseY + wallH / 2, wallZ);
    cheek.receiveShadow = true;
    root.add(cheek);
  }
  const headerH = lidY - m.openingHeight;
  if (headerH > 0.05) {
    /**
     * 0.012 m downstage of the cheeks, because it laps them by 0.2 m a side.
     *
     * Three planes, one `wallZ`, and the header's ends inside the cheeks' near
     * edges: the lap fought over its whole height directly above the opening,
     * which is the middle of every wide shot this room is ever framed in. The
     * lap itself is wanted — a butt joint between two cell planes shows as a
     * seam — so what moves is the depth, not the width.
     */
    const header = panel(m.openingWidth + 0.4, headerH, plaster);
    header.position.set(0, m.openingHeight + headerH / 2, wallZ + 0.012);
    header.receiveShadow = true;
    root.add(header);
  }

  // --- the architrave, or what is left of one ------------------------------
  /**
   * A moulded band round three sides of the opening, standing 0.22 m off the
   * wall, and a cartouche over the crown of it.
   *
   * The brief for this room asks how much arch is left, and the answer this file
   * gives is: the frame, and nothing behind it. There is no leg with a return, no
   * tormentor running out to the edge of frame, no moulded reveal and no
   * splayed jamb — all of which `proscenium.ts` builds and all of which belong
   * to a fly house. What survives in a hall is the *architrave*: a fibrous
   * plaster band about a third of a metre wide, cast in lengths, screwed to the
   * face of the partition, and painted over every time the room changed hands.
   * Four members and one ornament, and it is the whole of the arch.
   *
   * The cartouche is the one piece of pure decoration in the file and it earns
   * its draw call on a measurement. The browser pane this show is played in is
   * roughly square — `camera.ts` says 0.96 in its own doc — and at that aspect
   * the wide shot opens to 47° and stands 15 m back, which puts the top of frame
   * at 6.31 m at the plane of this wall. So the whole storey above the arch is in
   * shot on the aspect that matters: the header, the cartouche at 5.15 m, the
   * gallery rail and the springing of the cove. On a 16:9 window the frame top at
   * that plane is 4.63 m and the cartouche is out of it, which is the right way
   * for a piece of ornament to fail.
   *
   * ## Nothing here casts a shadow, and that is deliberate
   *
   * The shadow policy calls for chunky solids standing on a floor to cast, and
   * these jambs are the only objects in this room that qualify — everything else
   * is a wall plane or an ornament in the air. They still do not, and
   * `proscenium.ts` sets the same flag to false on its own legs without saying
   * why, so it is said here. The one shadow-casting light in the budget is the
   * key, at `(3.2, openingHeight + 1.4, lipZ + 5.5)` aimed at the middle of the
   * band from front of house. A four-metre plaster jamb standing at the lip and
   * lit from there throws a hard diagonal bar across the boards and across the
   * players, all night, in every cue. The one shadow this show can afford is the
   * one under the band's own feet; spending it on the architecture is how a room
   * ruins a stage.
   */
  const archZ = wallZ + 0.11;
  const bandW = 0.4;
  const jambH = m.openingHeight + rise + bandW;
  for (const side of [-1, 1]) {
    const jamb = new Mesh(
      c.kit.bevelBox(bandW, jambH, 0.22, 0.05), ornamentMat);
    jamb.position.set(side * (halfOpening + bandW / 2), jambH / 2 - rise, archZ);
    root.add(jamb);
  }
  /**
   * 0.24 of relief against the jambs' 0.22, so the head stands 10 mm proud.
   *
   * Equal sections put the head's face on the jambs' face, and the band laps
   * the jambs by its own width at both top corners — 0.4 m square of mitre,
   * flickering, at the two corners of the arch. A head standing slightly proud
   * of what it lands on is how the member is cast anyway. The extra 0.02 of
   * length is the same fix on the other axis: at exactly `bandW * 2` over the
   * opening the head's ends died on the jambs' outer faces.
   */
  const archHead = new Mesh(
    c.kit.bevelBox(m.openingWidth + bandW * 2 + 0.02, bandW, 0.24, 0.05), ornamentMat);
  archHead.position.set(0, m.openingHeight + bandW / 2, archZ);
  root.add(archHead);

  const cartouche = new Mesh(
    c.kit.bevelBox(1.5, 0.7, 0.26, 0.08), ornamentMat);
  cartouche.position.set(0, m.openingHeight + bandW + 0.35, archZ + 0.02);
  root.add(cartouche);

  // --- the gallery, and the storey above it --------------------------------
  // Both are behind the prop's plaster in the 1998 room. See `club`.
  if (!club) {
    /**
     * A balcony round three sides: a soffit you see the underside of, a panelled
     * front, a capping rail, and a strip of moulding at every bay.
     *
     * Cantilevered, with nothing under it, and the reason is the same one
     * `concert-hall.ts` gives — half the rooms of the period are on iron
     * stanchions and half are not, and the ones that are would stand a colonnade
     * in the middle of the dance floor at exactly the height a camera dragged down
     * into the crowd looks along. The other half is free, and this room needs its
     * floor clear more than any other room in the catalogue does.
     *
     * **One tier, always.** The hall grows a second gallery above 12.5 m of
     * platform because a nineteenth-century public hall genuinely did, and its
     * eras cross that line. This room's four sizes all sit inside 11.5–12.7 m and
     * a ballroom does not have an upper circle in any of them: two tiers is a
     * theatre built for sightlines, and this building was built for a floor with a
     * shelf round it. A switch here would have been a switch with nothing on the
     * far side of it.
     *
     * ## Where it is, and how it was proved to be out of the way
     *
     * See `GALLERY_SOFFIT`, which carries the argument and the numbers. In one
     * line: its underside is 0.55 m above the highest the director's lens can ever
     * get, so it is on the far side of the horizon from every player and cannot
     * cross one in any window; and separately its inner edge is 6.75–7.35 m off the
     * centre line where the wide shot's frame is 4.11 m wide at the proscenium and
     * 6.32 m at the plane it is aimed at, so it is outside the frustum
     * horizontally along its whole run in every era and at every aspect ratio the
     * camera will accept.
     *
     * Neither casts nor receives. Every fixture in the rig hangs below it and the
     * one shadow-casting light is pointed down at the stage from in front, so a
     * shadow onto this would have to be thrown upward from the crowd.
     */
    const galleryFrom = wallZ;
    const galleryRun = houseBackZ - galleryFrom;
    /**
     * How far the two side runs actually go, which is not to the back wall.
     *
     * The back run is `GALLERY_DEEP` deep and spans the full width of the room,
     * so it already covers both back corners. A side run carried the whole way
     * laid a second soffit plane, a second fascia and a second capping rail
     * across the same 1.6 m square — same heights, same sections, so all six
     * surfaces were coplanar with their opposite number and 2.5 m² of gallery
     * underside flickered at each corner. Stopping the sides at the back run's
     * face is both the fix and how the joinery goes together.
     */
    const sideRun = galleryRun - GALLERY_DEEP;
    const sideMid = galleryFrom + sideRun / 2;
    const railTop = GALLERY_SOFFIT + GALLERY_FACE + GALLERY_RAIL;
    const soffitMat = c.kit.solid(shade(plaster, 0.3), { rough: 0.95 });

    /**
     * One run of gallery underside, facing down.
     *
     * The Euler is spelled out rather than composed, because a plane's default
     * normal is `+z` and getting it to `-y` *and* getting its long axis onto the
     * right wall are two different rotations that do not commute in three.js's
     * `XYZ` order. `(π/2, 0, 0)` alone points the normal at the floor with the
     * length running along world x, which is the back run; the side runs need the
     * extra `π/2` about the local z to swing that length round onto world z. Doing
     * it by writing `rotation.y` afterwards produces neither, and the symptom is a
     * gallery standing on edge in the middle of the room.
     */
    const galleryRunAt = (length: number, x: number, z: number, alongZ: boolean): void => {
      const under = new Mesh(
        c.kit.geometry(`gal-soffit|${length.toFixed(2)}`,
          () => new PlaneGeometry(length, GALLERY_DEEP)),
        soffitMat,
      );
      /**
       * 0.02 m above `GALLERY_SOFFIT`, which is where the fascia's bottom is.
       *
       * The fascia is a box whose underside sits on `GALLERY_SOFFIT` exactly, so
       * the soffit plane ran through it edge-on — a down-facing plane and a
       * down-facing face, 0.2 m by the whole run of the gallery, on one plane and
       * fighting the length of three walls. Lifting the plane leaves the fascia
       * with a 2 cm return under the ceiling, which is what a boarded gallery
       * front has anyway, and it is the direction that adds clearance rather than
       * taking it — see `GALLERY_SOFFIT` for why that matters here.
       */
      under.position.set(x, GALLERY_SOFFIT + 0.02, z);
      under.rotation.set(Math.PI / 2, 0, alongZ ? Math.PI / 2 : 0);
      root.add(under);
    };

    const bayStrip = c.kit.bevelBox(0.14, GALLERY_FACE - 0.16, 0.05, 0.02);
    const strips: { x: number; z: number; yaw: number }[] = [];

    for (const side of [-1, 1]) {
      galleryRunAt(sideRun, side * (halfX - GALLERY_DEEP / 2), sideMid, true);
      const face = new Mesh(
        c.kit.bevelBox(sideRun, GALLERY_FACE, 0.2, 0.04), fasciaMat);
      face.position.set(
        side * (halfX - GALLERY_DEEP), GALLERY_SOFFIT + GALLERY_FACE / 2, sideMid,
      );
      face.rotation.y = Math.PI / 2;
      root.add(face);

      const rail = new Mesh(
        c.kit.bevelBox(sideRun, GALLERY_RAIL, 0.32, 0.05), ornamentMat);
      rail.position.set(
        side * (halfX - GALLERY_DEEP), railTop - GALLERY_RAIL / 2, sideMid,
      );
      rail.rotation.y = Math.PI / 2;
      root.add(rail);

      const bays = Math.max(2, Math.round(sideRun / 2.1));
      for (let i = 0; i <= bays; i++) {
        strips.push({
          x: side * (halfX - GALLERY_DEEP - 0.09),
          z: galleryFrom + (i * sideRun) / bays,
          yaw: Math.PI / 2,
        });
      }
    }

    const backRun = halfX * 2;
    galleryRunAt(backRun, 0, houseBackZ - GALLERY_DEEP / 2, false);
    {
      const face = new Mesh(
        c.kit.bevelBox(backRun, GALLERY_FACE, 0.2, 0.04), fasciaMat);
      face.position.set(0, GALLERY_SOFFIT + GALLERY_FACE / 2, houseBackZ - GALLERY_DEEP);
      root.add(face);
      const rail = new Mesh(
        c.kit.bevelBox(backRun, GALLERY_RAIL, 0.32, 0.05), ornamentMat);
      rail.position.set(0, railTop - GALLERY_RAIL / 2, houseBackZ - GALLERY_DEEP);
      root.add(rail);
      const bays = Math.max(2, Math.round(backRun / 2.1));
      for (let i = 0; i <= bays; i++) {
        strips.push({
          x: -halfX + (i * backRun) / bays,
          z: houseBackZ - GALLERY_DEEP - 0.09,
          yaw: 0,
        });
      }
    }

    {
      const panels = new InstancedMesh(bayStrip, ornamentMat, strips.length);
      const dummy = new Object3D();
      for (let i = 0; i < strips.length; i++) {
        const s = strips[i]!;
        dummy.position.set(s.x, GALLERY_SOFFIT + GALLERY_FACE / 2, s.z);
        dummy.rotation.set(0, s.yaw, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        panels.setMatrixAt(i, dummy.matrix);
      }
      root.add(panels);
    }

    // --- the storey above it -----------------------------------------------
    /**
     * Pilasters between the capping rail and the cove, and a continuous band
     * along the top of them.
     *
     * A repeated vertical rhythm is the strongest single cue that a wall belongs
     * to a building rather than to a box, and it goes here rather than below the
     * gallery for the reason `concert-hall.ts` gives about its own order: the wall
     * under a gallery is behind a hundred and fifty silhouettes and nothing on it
     * is ever seen. This room's crowd is denser than the hall's, so the argument is
     * stronger, not weaker.
     *
     * Where it differs is the **band**. The hall's order runs from the gallery
     * clean to the ceiling with nothing across the top of it, which is a giant
     * order and is correct for a hall. A ballroom's upper wall is a defined
     * storey: pilasters carrying an entablature, with the cove springing off the
     * band. That horizontal is what closes the storey, and it is also the only
     * member in the room that runs continuously round all three walls — which is
     * what makes the gallery, the wall and the ceiling read as one piece of
     * plasterwork rather than as three surfaces that happen to meet.
     *
     * One module for the whole room, taken from the side walls, because bays that
     * change width as the wall turns a corner is the one thing about an order that
     * anybody notices.
     */
    const orderFrom = railTop + 0.12;
    const orderTo = lidY - COVE;
    const orderH = orderTo - orderFrom - 0.22;
    if (orderH > 0.35) {
      const bays = Math.max(2, Math.round(galleryRun / 2.1));
      const bay = galleryRun / bays;
      const rearBays = Math.max(2, Math.round((halfX * 2) / bay));
      const pilaster = new InstancedMesh(
        c.kit.bevelBox(Math.min(0.55, bay * 0.28), orderH, 0.16, 0.04),
        ornamentMat,
        bays * 2 + rearBays + 1,
      );
      const dummy = new Object3D();
      let i = 0;
      const place = (x: number, z: number, yaw: number): void => {
        dummy.position.set(x, orderFrom + orderH / 2, z);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        pilaster.setMatrixAt(i++, dummy.matrix);
      };
      // `b < bays`, not `b <= bays`: the last side bay lands in the corner the
      // rear run's end pilaster already occupies, and two pilasters in one corner
      // is two sets of faces on each other's planes.
      for (const side of [-1, 1]) {
        for (let b = 0; b < bays; b++) {
          place(side * (halfX - 0.08), galleryFrom + b * bay, Math.PI / 2);
        }
      }
      for (let b = 0; b <= rearBays; b++) {
        place(-halfX + (b * halfX * 2) / rearBays, houseBackZ - 0.08, 0);
      }
      root.add(pilaster);

      /** The entablature the cove springs off. Three members, one height. */
      const bandY = orderTo - 0.11;
      // Stopping at the rear band's face, for the reason the gallery below stops
      // at its own: two 0.26 m runs at one height crossing in a corner share a
      // top and a soffit over the whole crossing.
      const bandRun = galleryRun - 0.26;
      for (const side of [-1, 1]) {
        const run = new Mesh(
          c.kit.bevelBox(bandRun, 0.22, 0.26, 0.05), ornamentMat);
        run.position.set(side * (halfX - 0.13), bandY, galleryFrom + bandRun / 2);
        run.rotation.y = Math.PI / 2;
        root.add(run);
      }
      const rearBand = new Mesh(
        c.kit.bevelBox(halfX * 2, 0.22, 0.26, 0.05), ornamentMat);
      rearBand.position.set(0, bandY, houseBackZ - 0.13);
      root.add(rearBand);
    }
  }

  // --- the ceiling ---------------------------------------------------------
  // The room's own, and only where the props have not laid one. See `club`.
  if (!club) {
    /**
     * A coved lid with a rose in the middle of it, and it is a cove rather than
     * coffers on purpose.
     *
     * `concert-hall.ts` hangs two instanced runs of beams a third of a metre below
     * its plaster, which from the floor of a hall is a grid of shadowed squares
     * thirty feet up and is the most legible thing about a ceiling of that period.
     * A ballroom does not have that. What it has is a **cove** — the curved sweep
     * where the wall turns into the ceiling, which is the thing that makes a room
     * of this kind feel soft-edged and enclosed rather than boxy — and a flat
     * middle with a rose in it.
     *
     * The cove is four canted solids rather than four canted planes, and the
     * thickness is the point: a plane at 45° between two other planes takes one
     * value of light and reads as a chamfer somebody drew on. A 0.1 m solid has
     * its own two edges, catches the top light along the upper one and throws a
     * line of shadow under the lower one, and that pair of lines is the whole of
     * what says "coved" from six metres below. They overlap in the four corners,
     * which is a mitre nobody will ever be close enough to fault and is better
     * than the triangular hole the alternative leaves.
     *
     * The lid itself is one plane with cells in it, `DoubleSide`, unlit by the
     * shadow. All three of those were settled by the courtyard and the arguments
     * carry over unchanged: a hemisphere lights a flat plane to exactly one number
     * so a ceiling whose normal never varies reads as a hole; a single-sided one
     * is a ceiling the room cannot see; and a shadow on it would have to be cast
     * upward.
     *
     * ## The rose is where the mirror ball is not
     *
     * A plaster rose in the centre of a ballroom ceiling is a ventilation grille
     * and a light fitting and, in exactly these buildings, the thing a mirror ball
     * was hung from when the room still ran dances. It is not hung from one here:
     * `mirror-ball` is a prop and `stage-props.ts` hangs it over the *stage* at
     * `lipZ - 1.4`, because by 1975 the show is the band and not the floor. So the
     * rose sits over the middle of the dance floor with nothing on it, which is a
     * joke the room is making at its own expense and costs two draw calls.
     *
     * It is placed at `houseDepth · 0.3` downstage, which is the same z
     * `stage-props.ts` hangs its chandeliers at — they go at ±17 % of the house
     * width and this has a 1.1 m radius, so a room that rolls the chandelier gets
     * a pair of fittings flanking a rose rather than three objects fighting for
     * the centre line.
     */
    const lidRng = c.rng('ceiling');
    const lidD = houseBackZ - wallZ;
    const lid = new Mesh(
      c.kit.own(cellPlane({
        width: halfX * 2,
        height: lidD,
        cols: Math.max(4, Math.round((halfX * 2) / 1.5)),
        rows: Math.max(4, Math.round(lidD / 1.5)),
        colour: lidColour,
        jitter: 0.09,
        rng: lidRng,
      })),
      c.kit.solid('#ffffff', { vertexColors: true, rough: 0.98, side: DoubleSide }),
    );
    lid.rotation.x = -Math.PI / 2;
    lid.position.set(0, lidY, wallZ + lidD / 2);
    root.add(lid);

    const coveMat = c.kit.solid(shade(blend(lidColour, ornament, 0.4), 0.1), { rough: 0.92 });
    const coveSpan = COVE * Math.SQRT2;
    for (const side of [-1, 1]) {
      const run = new Mesh(c.kit.bevelBox(coveSpan, 0.1, lidD, 0.03), coveMat);
      run.position.set(side * (halfX - COVE / 2), lidY - COVE / 2, wallZ + lidD / 2);
      run.rotation.z = side * -Math.PI / 4;
      root.add(run);
    }
    for (const [z, sign] of [[houseBackZ - COVE / 2, 1], [wallZ + COVE / 2, -1]] as const) {
      const run = new Mesh(c.kit.bevelBox(halfX * 2, 0.1, coveSpan, 0.03), coveMat);
      run.position.set(0, lidY - COVE / 2, z);
      run.rotation.x = (sign * Math.PI) / 4;
      root.add(run);
    }

    {
      const roseZ = m.lipZ + m.houseDepth * 0.3;
      const outer = new Mesh(
        c.kit.geometry('rose-outer', () => new TorusGeometry(1.1, 0.09, 4, 24)),
        c.kit.solid(tint(lidColour, 0.1), { rough: 0.9 }),
      );
      outer.position.set(0, lidY - 0.07, roseZ);
      outer.rotation.x = Math.PI / 2;
      root.add(outer);
      const inner = new Mesh(
        c.kit.geometry('rose-inner', () => new TorusGeometry(0.52, 0.07, 4, 18)),
        coveMat,
      );
      inner.position.set(0, lidY - 0.09, roseZ);
      inner.rotation.x = Math.PI / 2;
      root.add(inner);
    }

    /**
     * And the same plaster over the stage house, which had none.
     *
     * `headroom`'s note calls the volume above the arch "a dark void ... No lid,
     * no soffit, no plaster", and it was one: the side walls run the whole length
     * of the building and stop at `lidY`, the backdrop is the end wall at exactly
     * `lidY`, the cheeks and the header close the downstage end to exactly
     * `lidY` — four sides of a box with nothing on top of it. Measured, from the
     * eye points `camera.ts` can actually reach: **624 escaping rays in funk's
     * four dressings, 608 in pop's, 451 in rnb's, 1683 of the catalogue's 4084**.
     * In the 1968 room, 144 of the 157 left from a lens standing *on the boards*
     * looking up; the other 13 went out through the proscenium opening from the
     * side of the house — the 51° shot the failure was reported as — passing
     * under the header and carrying on up.
     *
     * One plane closes all of it, and every escaping ray in the room proves that
     * one plane is enough: each of the 157 crosses the grid height *inside* the
     * stage house, at z from −2.82 to 3.54 of a house that runs −3.60 to 3.80.
     *
     * ## Not borders, and that was measured before it was rejected
     *
     * The theatre answer to a void over the boards is a *teaser* on the bar, and
     * this room has exactly one bar height to hang one from — the grid batten at
     * `openingHeight + 1.2`, 1.85 m upstage of the proscenium wall. It fails
     * twice. It cannot close the room: a border is a strip, the escapes cross the
     * grid plane over 6.4 m of stage depth, and covering that with strips at one
     * height *is* this plane, drawn in pieces. And it cannot be hung without
     * getting into the picture, which is the more interesting half. The header's
     * lower edge is the top of the frame at `wallZ`; a sightline that grazes it
     * from a lens at the front of the house is 2.09 m higher again by the time it
     * reaches the batten — 6.69 m against a border bottom at 4.60 — so a teaser
     * there reads as the arch having been lowered by two metres, from every seat
     * except the very back. What masks this room is the header, which is 1.99 m
     * deep and standing where masking belongs.
     *
     * So the audience does see the grid here, and that is the room and not an
     * oversight: `flyY` is solved to fill the head of the opening with the truss
     * *in shot*, and the batten is the timber it hangs from.
     *
     * The plaster is darker than the house's. It is the one ceiling in the
     * building nothing points at — the pars on the bar are aimed down at the band
     * — and above the arch a theatre is painted out. Not black: `lidColour` at
     * 0.55 is still a surface returning what the wash gives it, which is the
     * whole of the cellar ceiling's lesson about spending the smallest light
     * budget in the room on the darkest albedo in it.
     */
    const houseRoof = new Mesh(
      c.kit.own(cellPlane({
        width: halfX * 2,
        height: wallZ - sideFrom,
        cols: Math.max(4, Math.round((halfX * 2) / 1.5)),
        rows: Math.max(3, Math.round((wallZ - sideFrom) / 1.5)),
        colour: shade(lidColour, 0.55),
        jitter: 0.09,
        rng: lidRng,
      })),
      c.kit.solid('#ffffff', { vertexColors: true, rough: 0.98, side: DoubleSide }),
    );
    houseRoof.rotation.x = -Math.PI / 2;
    houseRoof.position.set(0, lidY, (sideFrom + wallZ) / 2);
    root.add(houseRoof);
  }

  // --- what the lamps hang on ----------------------------------------------
  /**
   * A barrel on two lines from a timber grid batten, and the batten is the
   * reason this is not a bare group at a height.
   *
   * `RoomRig.flyBar` is explicit that a fly bar with nothing reaching it is the
   * bug the field was written after, and this room could have had it in a new
   * way: `headroom` here is `Infinity`, so there is no plaster for a drop-arm to
   * bolt to and no fly floor to hang a wire from — a pipe alone at four metres
   * with clear air above it would read as a mistake rather than as a rig.
   *
   * What a hall like this actually has over its stage is a **grid**: scaffold or
   * timber, a metre or so above the arch, put in when the building was new and
   * used ever since by whoever turned up with lanterns. So the bar is slung off
   * a batten, and the batten sits at `openingHeight + 1.2` — which is not a
   * height picked to look right. `BUILDERS.truss` computes its drop legs, in the
   * no-lid case, as reaching *exactly* `openingHeight + 1.2`, that being the
   * notional structure the prop assumes when the room has not published one. So
   * this is the first room in the directory to put a real object where that prop
   * has always been reaching, and the result is that funk's truss lands with its
   * legs on the grid instead of ending in mid-air.
   *
   * ## The grid spans the stage house, and for most of this file's life it did
   * not span anything
   *
   * The height was right and the **length** was wrong, and the length is what
   * made the paragraph above a wish rather than a fact until it was fixed. The
   * batten was `openingWidth + 1.6` long — `width / 2 + 0.59` a side — against
   * side walls at `halfX` = `width / 2 + 2.6`, so it stopped 2.010 m short of the
   * plaster at each end, identically in all eleven non-club shows, because both
   * terms scale with the width and the difference between them does not. The
   * object whose whole job is to be *the thing the rig hangs from* was therefore
   * the largest floating body in the catalogue: 12.68 m of timber at 5.72–5.88 m
   * in the 1968 room, carrying the pipe, both drop lines, all six pars and —
   * where the era has them — the truss and the mirror ball, with two metres of
   * daylight past each end and open air above.
   *
   * And it missed the truss it was built for. `BUILDERS.truss` puts its legs at
   * `±(openingWidth / 2 + 0.9)`, which is 0.10 m *outside* `openingWidth + 1.6`;
   * a Ø0.07 m tube cleared the timber by 0.065 m and hung there on its own. That
   * near miss is the proof the number was an oversight rather than a decision —
   * lengthening to `+ 1.8` would have caught the legs and left the batten itself
   * floating, so it is not the fix either.
   *
   * The fix is `halfX * 2 + 0.12`: one baulk across the stage house bearing on
   * the plaster at both ends, which is what a grid in a hall physically is. The
   * side wall runs from `m.houseY` to the ceiling, so everything under here is
   * now hung off something standing on the floor, and the truss's legs land
   * 1.97 m inside the ends with their tops buried in the middle of the 0.16 m
   * section.
   *
   * The `+ 0.12` is 0.06 m of embedment a side and is not an epsilon. `halfX * 2`
   * exactly puts the batten's two end faces on the *same planes* as the side-wall
   * panels — the coplanar pair this file refuses at the architrave head and at
   * the header, for the same reason. The 0.06 m of timber outside the plaster is
   * unreachable: `camera.ts` clamps the lens to `width / 2` over the boards and
   * `houseWidth / 2` in the house, both of them well inside `halfX`, and the wall
   * panels are single-sided facing in.
   *
   * **Not a drop to `houseLid`, which is finite in this room and looks like an
   * invitation.** The lid mesh is laid from `wallZ` downstage only, and the
   * batten sits at `curtainZ - 1.1`, 1.85 m upstage of `wallZ` — a wire to
   * `houseLid` would reach a plane that stops short of it. `headroom: Infinity`
   * is honest: the stage house has no roof, which is exactly why the grid has to
   * find its bearing sideways.
   *
   * The batten and the legs are masked from the house by the header, which is
   * checked rather than hoped: a ray from the wide shot's lens at 3.60 m to the
   * batten at 5.80 m crosses the plane of the proscenium wall at 5.44 m, and the
   * header occupies 4.60–6.59 m there. What the audience sees is a truss whose
   * legs go up and disappear behind the arch, which is what a truss in a theatre
   * looks like. The new length is masked by *more* wall rather than less:
   * everything outside the opening is behind a cheek, and a cheek is a
   * full-height panel running out to `halfX + 2.6`.
   *
   * What is not masked is the viewer's own drag, and that is how the floating
   * slab was reported rather than measured. `camera.ts` takes its ceiling from
   * `min(headroom, houseLid) - LENS_GAP`, which in the 1968 room is 5.99 m —
   * 0.11 m above the batten's own top, over a floor the lens may stand anywhere
   * on. Pitch up from there and the grid is the whole picture, which is a good
   * argument for it being a piece of the building.
   *
   * `lights.ts` then does `flyBar.add(rig)` and spreads its pars along the bar's
   * local x without knowing any of this, which is the point of the contract.
   *
   * ## And under a lid there is no grid, because there is nowhere to put one
   *
   * The batten is a metre above an arch that is now a metre inside the ceiling,
   * so the object that made this a rig rather than a floating pipe has to be the
   * *plaster* instead: two short drops from the ceiling to the bar, which is how
   * a bar is hung in every low room that ever had one. `shape` has already
   * brought `flyY` down to a handspan under it, so the drops are 0.13 m of
   * steel and the geometry says the same thing the tall version says — the bar
   * is held up by something the room contains.
   */
  const flyBar = new Group();
  flyBar.name = 'fly-bar';
  flyBar.position.set(0, m.flyY, m.curtainZ - 1.1);
  const pipe = new Mesh(
    c.kit.bevelBox(m.openingWidth + 0.9, 0.1, 0.1, 0.05),
    c.kit.solid(shade(p.proscenium, 0.68), { metal: 0.55, rough: 0.45 }),
  );
  flyBar.add(pipe);

  const battenY = m.openingHeight + 1.2 - m.flyY;
  const lineH = club
    ? Math.max(0.06, m.headroom - m.flyY - 0.045)
    : Math.max(0.1, battenY - 0.08);
  for (const side of [-1, 1]) {
    const line = new Mesh(
      c.kit.bevelBox(0.04, lineH, 0.04, Math.min(0.016, lineH * 0.3)),
      c.kit.solid(shade(p.proscenium, 0.76), { metal: 0.4, rough: 0.55 }),
    );
    line.position.set(side * (m.openingWidth / 2 - 0.9), lineH / 2, 0);
    flyBar.add(line);
  }
  if (!club) {
    const batten = new Mesh(
      c.kit.bevelBox(halfX * 2 + 0.12, 0.16, 0.22, 0.03),
      c.kit.solid(shade(blend(p.boards, p.backdrop, 0.4), 0.5), { rough: 0.95 }),
    );
    batten.position.set(0, battenY, 0);
    flyBar.add(batten);
  }
  root.add(flyBar);

  // --- the cloth -----------------------------------------------------------
  /**
   * A house tab with a valance over it, in every era, and the presence of it is
   * as much of an argument as the concert hall's refusal is.
   *
   * That room has no curtain because there has never been one in a concert hall:
   * nothing is concealed, nothing is revealed, and the social shape of the
   * evening is that you watch the players walk on and tune. This room is the
   * other thing entirely. It is a *theatre*, however far down the bill it has
   * come — a building whose whole trade is that something is behind the cloth
   * and then it isn't — and `funk/staging.ts` says so directly in its note on
   * 1968: "a theatre with a red house curtain and gilt somebody stopped
   * repainting in about 1954".
   *
   * It stays for 1984, which is the interesting half. A room does not get to see
   * the era, and it should not want to: the palette already carries the answer,
   * because `curtain` goes from `#7a1f2b` velvet red to `#1b2c3a` cold blue-grey
   * across the four decades, and a re-hung house tab in a dark synthetic is
   * exactly what those rooms had by then. Nobody threw the track away. The
   * valance is on for the same reason — it is a pelmet, it is part of the
   * building rather than part of the show, and a hall that took its pelmet down
   * would have taken the plasterwork down with it.
   */
  const curtain = buildCurtain({
    kit: c.kit,
    width: m.openingWidth,
    height: m.openingHeight,
    z: m.curtainZ,
    colour: p.curtain,
    valance: true,
    reducedMotion: c.reducedMotion,
    quality: c.quality,
  });
  root.add(curtain.root);

  return { root, flyBar, curtain };
}

export const ballroom: RoomBuilder = { shape, build };
