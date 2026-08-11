/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * What a room must be, and — much more importantly — where a room stops.
 *
 * `stage.ts` used to build one building. That was the right call while three
 * genres shared it, and the header there was right to be proud of having no
 * genre switch in the directory: a lakeside pavilion and a black box really are
 * the same shed in different paint, and a switch would have been an invention
 * rather than an observation. Fourteen rooms later the same sentence has
 * stopped being an observation. A concert hall, a walled courtyard, a threshing
 * barn, an arena and a dancehall came out architecturally identical, because
 * the only things a `StageRoom` could say were two dimensions, five colours, a
 * fog number and a list of props. Ten genre authors wrote data because data was
 * the only thing the system could accept.
 *
 * ## The line
 *
 * The obvious line — "the stage is the wooden bit, the room is the walls" — is
 * not the one drawn here, because it is not the line that predicts which file a
 * change belongs in. This is:
 *
 *   **The stage is the part of the picture some other file already has an
 *   opinion about. The room is the part nothing else has an opinion about.**
 *
 * `cast.ts` stands people on the boards and clamps them to the boards' width.
 * `cables.ts` routes leads inside the boards' bounds. `show.ts` raises the drum
 * riser when this number has a drummer on it. `camera.ts` frames the crowd.
 * `tomatoes.ts` bounces fruit off the boards, the backdrop and the house floor.
 * Every one of those solves against numbers it takes on faith, none of them can
 * see the scene graph, and several of them restate the stage's own constants by
 * hand because the dependency may not point that way. So the boards, the apron,
 * the lip, the riser, the props, the audience and the air are **the datum**,
 * and a room that could move them would be moving something four other files
 * have already committed to. They stay in `stage.ts`.
 *
 * What is left over is everything nothing else asks a question about. Nobody
 * asks whether the walls are brick, only where they are. Nobody asks whether
 * there is a ceiling, only how high the lowest thing overhead hangs. Nobody
 * asks whether there is a proscenium arch, only how wide the gap the audience
 * looks through is. That residue — the surfaces, the architecture, the masking,
 * the thing lamps hang from, and the cloth that closes the gap — is the room,
 * and it is handed over whole.
 *
 * The test for a new field is therefore not "is it near the walls" but "would
 * anything outside this directory notice". A room may build whatever it likes
 * as long as it answers `RoomShape` honestly, because `RoomShape` is the entire
 * surface through which the rest of the show can see it.
 *
 * ## Two methods, not one
 *
 * `shape()` answers eight numbers and builds nothing — seven when this was
 * written, and `houseLid` is the eighth. `build()` builds and
 * answers no numbers. The split is the same one `InstrumentModel.resolve` makes
 * against its own geometry, for the same reason: the choreography has to be
 * computable without ever constructing a guitar, and the room's dimensions have
 * to be knowable without ever constructing a room.
 *
 * It is also forced by the order things happen in. `StageMetrics.crowd` is
 * solved from the house floor, the house floor is a stage height below the
 * boards, and how high the boards stand is a *room* decision — a cellar puts
 * the band on a kerb and a theatre puts them on a stage, and `CELLAR_RISE` in
 * `proscenium.ts` is three paragraphs arguing exactly that. So the metrics
 * cannot be finished until the room has spoken, and the room cannot be built
 * until the metrics are finished. One method would have to be handed a
 * half-built `StageMetrics` with a note saying which fields are not filled in
 * yet, which is a footgun with a comment on it.
 *
 * ## Determinism
 *
 * Every random draw goes through `RoomContext.rng`, which is ``
 * `${venue.id}:${tag}` `` — the same room seeds the same building, down to the
 * last brick, and adding an object to one room cannot reshuffle another.
 *
 * The tag namespace is **flat and shared with `stage.ts`**, which is not
 * elegant and is the only option available. `housefloor`, `backdrop` and
 * `walls` are the three streams the proscenium has always used; prefixing them
 * with `room:` would reseed every venue in the catalogue, and prefixing only
 * the *new* rooms would leave a rule that is true of thirteen rooms and false
 * of one. So: one namespace, and the taken names are written down.
 *
 * **Reserved, do not reuse:** `boards` and `haze` (the stage), `audience`
 * (`stage-audience.ts`), `lights` (`lights.ts`), and everything under `prop:`
 * (`stage-props.ts`). `housefloor`, `backdrop` and `walls` are the proscenium's
 * and are free for another room to use for the same surfaces — reusing a name
 * for the same *kind* of thing is how two rooms stay comparable, and there is
 * no cross-talk because only one room is ever built per venue.
 *
 * ## Shadows
 *
 * There is one shadow-casting light in the entire budget and `lights.ts` owns
 * it. What a room decides is which of its own surfaces take part, and the
 * policy it has to obey is the one `stage.ts` has always applied:
 *
 *  - **Receive**: anything large, flat and behind or under the band — the
 *    house floor, the backdrop, the walls. That is what a shadow lands on.
 *  - **Cast**: chunky solids standing on a floor — a low wall, an arcade pier,
 *    a coping stone. Only where the object has real thickness; a cast shadow
 *    from a plane is a black line.
 *  - **Neither**: cloth, sky, ceilings and anything unlit. A curtain that casts
 *    needs its vertex displacement duplicated into the depth material for no
 *    visible gain, and a sky that receives is a sky with a stage light on it.
 *
 * This is a rule rather than a returned value, deliberately. Three.js takes the
 * flags off the meshes themselves, so a `shadowReceivers` array in `RoomRig`
 * would be a second copy of `receiveShadow` that nothing reads — the exact
 * failure `PROPS`/`SUPPORTED_PROPS` was collapsed to stop. Set the flags.
 */

import { Group, type Object3D } from 'three';

import type { Rng } from '../../../core/rng.js';
import type { Venue } from '../../../concert/types.js';
import type { PropName } from '../../../concert/venue.js';
import type { CurtainRig } from '../stage-curtain.js';
import type { Kit, Quality, StageMetrics } from '../stage-kit.js';

/**
 * The stage, before the room has been asked anything.
 *
 * Everything here is a function of `Venue` alone and no room may argue with any
 * of it: these are the numbers `cast.ts`, `cables.ts` and `camera.ts` have
 * already committed to. It is `StageMetrics` minus the eight fields `RoomShape`
 * decides and the two — `houseY` and `crowd` — that follow from `rise`.
 */
export interface RoomDatum {
  venue: Venue;
  /** `Venue.width`/`depth`, clamped. The boards, and the coordinate datum. */
  width: number;
  depth: number;
  lipZ: number;
  backZ: number;
  /** How far downstage and how wide the house is. See `StageMetrics`. */
  houseDepth: number;
  houseWidth: number;
  /**
   * The props this venue named, already normalised.
   *
   * A room reads these to answer the modifiers it recognises and ignores the
   * rest — `open-air` means something to a courtyard and to a pavilion and
   * nothing at all to a cellar. It is not a licence to place scenery: the
   * objects belong to `stage-props.ts`, which places them for every room at
   * once, and a room drawing its own `arches` would draw them twice.
   */
  props: ReadonlySet<PropName>;
}

/**
 * What a room has to tell the rest of the show about itself.
 *
 * Eight numbers — seven when this was written, `houseLid` being the one added
 * since — and each of them is somewhere a room that had not thought
 * about the question would put something through a wall. They are required —
 * there is no partial form and no merge with a default — because the failure
 * this seam exists to prevent is a room *silently inheriting a proscenium's
 * dimensions*, which was **the failure every one of the fourteen rooms was
 * suffering from** on the day this interface was written. It is nobody's failure
 * now: twelve builders answer here in full and sixteen of the nineteen genre
 * rooms name one of them. The sentence is kept in the past tense because the
 * requiredness is the thing it argues for, and that argument is the reason the
 * failure went. A room that genuinely is a proscenium says so in
 * one line by calling `prosceniumShape`.
 */
export interface RoomShape {
  /**
   * How far the boards stand above the house floor.
   *
   * Not a musical decision and not in `Venue`, but very much a decision about
   * what kind of building this is: a proscenium house lifts the band 0.9 m
   * above a standing crowd, a cellar club has a 0.4 m kerb, and a courtyard has
   * a dais you could step onto carrying a drum. It sets `houseY`, which sets
   * the crowd's rake, the camera's floor and the height of every wall.
   */
  rise: number;
  /**
   * **The aperture** — the gap the audience sees the band through, above the
   * boards.
   *
   * This was `openingWidth`/`openingHeight` and meant "the proscenium arch",
   * which is a definition three of the fourteen rooms can satisfy. Renaming the
   * *meaning* rather than the field is deliberate: a dozen call sites in
   * `stage-props.ts` and `lights.ts` hang things off it, and every one of them
   * wants the same thing under the new definition — bunting spans the aperture,
   * the cyc glow fills it, a lantern hangs inside it. In a theatre it is the
   * arch. In a courtyard it is the clear span between the walls. In a barn it
   * is the gable. In a room with nothing at all it is the boards themselves.
   *
   * **One hard rule.** It may not be narrower than the playing area, which is
   * `width - 2 * MARGIN_SIDE`, or the band stands outside the picture. That is
   * not a style note: `cast.ts` clamps players to `min(width/2 - 0.5, width *
   * 0.47)`, hardcoded, with no link to this file and no ability to see it — so
   * a room that narrows its aperture below the boards has no way to tell the
   * caster, and the symptom is half a trumpeter behind something. Mask *inside*
   * the aperture if a room needs to look narrower; do not shrink it.
   */
  openingWidth: number;
  /** The aperture's height above the boards. Nothing hangs above it. */
  openingHeight: number;
  /**
   * z of the curtain line. Meaningless in a room with no curtain, and it still
   * has to be a number, because `stage-props.ts` hangs neon, drapes and truss
   * runs off it — it is "the line just upstage of the front of the room" as
   * much as it is a track. Put it where a cloth would be if there were one.
   */
  curtainZ: number;
  /**
   * y of whatever the lights hang from. See `RoomRig.flyBar` for why a room
   * with no fly tower still answers this.
   */
  flyY: number;
  /**
   * y of the lowest thing over the *boards*, or `Infinity` under open sky.
   *
   * The camera keeps `LENS_GAP` under it and every hanging prop clamps to it.
   * `Infinity` is not a cop-out — most of these rooms genuinely have nothing
   * overhead, and a height nobody can reach is the honest way to say so, since
   * every consumer wants a `Math.min` and gets the right answer for free.
   */
  headroom: number;
  /**
   * y of the lowest thing over the *house*, or `Infinity`.
   *
   * Two lids, because a cellar has two: plaster over the audience and a lower
   * soffit over the stage. `headroom` publishes the worse of them so a lens
   * solved against it clears both; anything *hung* has to ask for the surface
   * it is actually fixed to, or a chandelier ends up 0.35 m below a ceiling
   * that is somewhere else. This used to be derived — `houseLid()` assumed any
   * room with a finite `headroom` was the cellar and returned `houseY +
   * LOW_CEILING` — and that assumption held exactly as long as the cellar was
   * the only room with a lid on it. It is stated now.
   */
  houseLid: number;
  /**
   * How tall the thing behind the band is, measured from the **house floor**
   * rather than from the boards — it is a wall, and walls are measured from the
   * ground.
   *
   * `lights.ts` sizes the cyclorama glow off it, because a glow is a glow *on*
   * something: sized from the aperture instead it hung three metres of lit
   * rectangle in the night sky above a tanssilava's back wall, attached to
   * nothing and the brightest thing in frame.
   */
  backdropHeight: number;
  /**
   * x of the inner face of the side wall, or `Infinity` where there is no wall.
   *
   * The last field, and it is here for the reason the header gives for all of
   * them: something outside this directory has an opinion about it. `posters`
   * pastes three bills up the side of the stage, and a bill is a thing stuck to
   * a wall — it cannot be placed by a prop that can only see `width` and
   * `houseWidth`, because where the wall stands off the house is each room's own
   * decision and the spread is not small. The rooms answer 0.6, 0.9, 1.75 and
   * 3.5 m outboard of `houseWidth / 2`, and the props were guessing one constant
   * for all of them: right to within a handspan in the five rooms that use the
   * minimum, 1.2 m short in the dancehall and 2.95 m short in the arena, where
   * the dressing floated in mid-air a couple of metres inboard of the brick.
   *
   * `neon` was the second consumer and the one this field was originally added
   * for — a lit sign on each side wall. That pair is gone; the sign hangs on the
   * back wall now, where the room put a wall anyway. The field stays because the
   * argument was never about which prop asked.
   *
   * `Infinity` for the same reason `headroom` uses it and read the same way: a
   * courtyard's fourth side, a lawn and an arena's far reaches have no wall at
   * that x, and a consumer that wants "is there a wall to put this on" gets the
   * right answer from `Number.isFinite` without a second field to forget.
   *
   * Measured to the **inner face**, so a prop mounts flush by sitting at `wallX`
   * and needs no thickness it has no way to know.
   */
  wallX: number;
}

/** Everything a room is handed to build with. */
export interface RoomContext extends RoomDatum {
  /**
   * The stage's own `Kit`, shared rather than owned.
   *
   * One material cache for the whole rig, so a wall and a backdrop the same
   * colour are one material, and one `dispose()` frees the lot. A room that
   * made its own would leak everything in it, because `stage.ts` only disposes
   * the one it holds.
   */
  kit: Kit;
  /**
   * The finished metrics, including this room's own `shape()` answers read
   * back.
   *
   * Handed over rather than recomputed so that a room cannot disagree with the
   * numbers the rest of the show is already using — if `m.headroom` is not what
   * `shape()` said, the bug is in `stage.ts` and not in the rooms. The count
   * this used to give was fourteen and it is twelve, `ROOMS` being a total
   * record over the architectures rather than over the catalogue; the point of
   * the sentence is the direction to look in, and one place is still cheaper to
   * search than twelve.
   */
  m: StageMetrics;
  quality: Quality;
  reducedMotion: boolean;
  /** A named stream. See the header on the tag namespace before picking one. */
  rng(tag: string): Rng;
}

/** What a room hands back. */
export interface RoomRig {
  /** Everything the room owns, in one group named `room:<venue.id>`. */
  root: Group;
  /**
   * Something for the lighting rig to hang fixtures on, at `shape().flyY`.
   *
   * **Always present, in every room, including the ones with no fly tower.**
   * `lights.ts` does `stage.flyBar.add(rig)` and then positions pars along its
   * local x; making that optional would put a branch in the one file whose
   * whole job is to be ignorant of which room it is lighting, and the branch
   * would have to invent a height, which is the room's business.
   *
   * So a room with no flying returns a `Group` at the right height with
   * whatever is actually up there parented to it — a scaffold bar under a
   * cellar soffit, a wire strung across a courtyard, a roof purlin in a barn,
   * or nothing at all. The lamps then hang off a thing that exists. What is
   * *not* allowed is returning a bare group at a height nothing reaches: that
   * is the bug `flyY` was written after, where a cellar's fly bar and every par
   * on it sat inside the plaster with their beams starting in it.
   */
  flyBar: Object3D;
  /**
   * The house tabs. **Always present**, for the same reason as `flyBar`.
   *
   * `show.ts` drives the whole opening sequence off this: it snaps the curtain
   * shut, stages the band behind it, opens it, and waits for `curtainOpen()` to
   * pass 0.98 before counting in — and it holds `band.visible` false until the
   * cloth has cleared `CURTAIN_REVEALS`. A room with no curtain that answered
   * `undefined` would need every one of those five sites to branch.
   *
   * It answers with `noCurtain()` instead, which reports the cloth as being
   * exactly where it was asked to be, instantly. That is not a fudge, it is the
   * truth: in a courtyard there is no cloth to be in the way, so the moment the
   * show says "open" the band is visible. The reveal becomes a cut rather than
   * a gather, the runner never stalls waiting for travel that will not happen,
   * and the band is still hidden while it is being staged — which is what the
   * invisibility was ever for.
   */
  curtain: CurtainRig;
  /**
   * Once a frame, if the room has anything that moves. Most do not.
   *
   * `t` is wall-clock seconds since the rig was built and `dt` is already
   * clamped to 0.1 s, so a tab returning from the background costs one lost
   * frame rather than a room that jumps.
   */
  update?(t: number, dt: number): void;
}

/**
 * A building.
 *
 * The registry in `./index.ts` is a total `Record<RoomStyle, RoomBuilder>` over
 * the union in `concert/types.ts`, so a style named upstream with no builder
 * here is a compile error rather than a room that quietly comes up a
 * proscenium.
 */
export interface RoomBuilder {
  /** Pure, cheap, and buildable without a scene graph. See the header. */
  shape(d: RoomDatum): RoomShape;
  build(c: RoomContext): RoomRig;
}

/**
 * The curtain a room without a curtain has.
 *
 * No geometry, no `Kit` entry, nothing to dispose. It tracks the target
 * exactly, which is the whole design — see `RoomRig.curtain`.
 */
export function noCurtain(): CurtainRig {
  let value = 0;
  const clamp = (v: number): number => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);
  const root = new Group();
  root.name = 'curtain:none';
  return {
    root,
    setOpen: (v) => { value = clamp(v); },
    snap: (v) => { value = clamp(v); },
    open: () => value,
    target: () => value,
    update: () => {},
  };
}
