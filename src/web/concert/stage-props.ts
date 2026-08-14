/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Set dressing — the genre in the room.
 *
 * `Venue.props` is a `string[]` and the plan calls it "free-form,
 * genre-specific", which makes this file the *reader* of a vocabulary written
 * somewhere else — and, until recently, the author of a second copy of it.
 * `SUPPORTED_PROPS` used to be declared here, name for name alongside the union
 * in `src/concert/venue.ts`, agreeing by inspection rather than by the
 * compiler. It is one list now, and it lives on the IR side, because
 * `web/concert/` renders `concert/` and not the other way round.
 *
 * That inversion is what makes the seam load-bearing rather than merely tidy.
 * `BUILDERS` at the bottom is a total `Record<PropName, …>` over the imported
 * list, so a genre author adding a name to the vocabulary and nothing else gets
 * a failed `npm run typecheck` naming this file, instead of a room that quietly
 * comes up short one object. Nineteen genre authors — sixteen when this was
 * written — can dress rooms this file
 * has never heard of, and the compiler is the only meeting any of them need.
 *
 * Two rules survive from when the lists were separate, and one of them shrank:
 *
 * 1. **An unrecognised string is ignored, silently.** A venue that asks for a
 *    thing this file has never heard of gets a stage without it, not an
 *    exception in the middle of a show. Nothing inside the repo can produce one
 *    now — `StageDressing.props` is `PropName[]` — but the IR is `string[]` on
 *    purpose and a concert can arrive from a file. `unknownProps()` reports
 *    what was skipped.
 * 2. **The names are levelled before matching.** Case, spaces, underscores and
 *    a trailing plural, and nothing else at all. The table of synonyms that
 *    used to sit here went with the second list; see `normaliseProp` for why
 *    it could not survive the vocabulary growing.
 *
 * ## The vocabulary
 *
 * In `src/concert/venue.ts`, one line of argument each, grouped by the room it
 * dresses. Deliberately not restated here — a second copy of the list is the
 * thing this file has just stopped keeping, and a prose copy of it drifts in
 * exactly the same way for exactly the same reason.
 *
 * Four of them are architectural rather than dressing — `black-box`, `brick`,
 * `open-air` and `haze` change how the room itself is built, so the handlers
 * here are deliberately empty. There are still four. What has moved is where
 * they are read: **`stage.ts` reads those directly** was true of all four and is
 * true of `haze` alone now, that being the only `props.has` left in the file.
 * `black-box`, `brick` and `open-air` — and `low-ceiling`, which is architectural
 * too and does have a handler here — belong to the rooms now. So anything that
 * would have been a fifth belongs in `rooms/` beside the ones that moved, and
 * still not here as an object pretending to be a room.
 *
 * ## Where props are allowed to stand
 *
 * The cast is placed by `concert/cast.ts` and this file cannot see it, so
 * everything here keeps out of the playing area: floor props sit within a
 * metre of the wings, upstage of the backline, or downstage of the lip. The
 * three exceptions are underfoot on purpose — `rug`, `carpet` and `riser` —
 * the first two because a floor covering a band avoids is not a floor
 * covering, and both are flat enough to be walked over. `riser` is
 * the one to watch, because `Station.riser` says a performer is
 * standing on a platform and this places one. Its top is at **0.4 m**, centred
 * at **(0, -1.15 m upstage of centre)**, 2.8 m wide by 2.0 m deep. Only the
 * width holds: the clamp is `min(2.8, width * 0.32)` and every one of the
 * catalogue's 72 dressings is wide enough, but the depth is
 * `min(2.0, depth * 0.3)` and reaches the clamp in exactly half of them,
 * bottoming out at 1.41 m in house's `afterhours`. The z follows the depth off
 * `backZ + d / 2 + 0.45` and runs from −1.195 to −2.550; no venue produces
 * −1.15. Ask `riserFootprint` rather than this paragraph — and ask it in
 * `concert/venue.ts`, which is where it moved when `cast.ts` turned out to need
 * the same answer and to be forbidden from importing this file to get it.
 *
 * ## Where props are allowed to *hang*
 *
 * The same argument one storey up, and it took a screenshot to notice. Floor
 * props were kept out of the playing area from the start; hanging ones were
 * hung by eye at a fraction of `openingHeight`, and a fraction of a small
 * opening is head height. Measured across every room this generator builds:
 * a paper lantern hung with its bottom at 2.30 m directly over the drum riser,
 * a festoon sagged to 2.08 m over the front line, the upstage bunting run sank
 * to 1.54 m, and the moths flew from 1.51 m up. From a camera down in the
 * house every one of those sits on somebody's face.
 *
 * So hanging dressing answers to `HEAD_BAND` in `stage-kit.ts`: its lowest
 * point clears `HANG_FLOOR`, or it is upstage of the backline, and the runs
 * that span the opening do both. `swag()` is where the arithmetic lives —
 * a run is tied off at whatever height its own sag and its own flag drop
 * require, rather than at a fraction that happens to work in a ten-metre room.
 *
 * ## And what they are allowed to hang *from*
 *
 * The third question, and the one this file kept answering with a constant. A
 * clearance is a distance from a face; a fixing is a distance from a *surface*,
 * and the surface has to exist. Measured across every room: a mirror ball on a
 * 0.6 m rod stopping half a metre under the beams it is bolted to, a lantern on
 * 0.9 m of string ending in open air, two festoons and a truss reaching for the
 * top of an aperture that is a wall in a theatre and nothing at all in the nine
 * rooms whose "opening" is the clear span of the building. `rigHeight()` is the
 * answer for anything hung over the boards, `houseLid()` for anything over the
 * house, and `StageMetrics.headroom` for the steel; a builder that solves a
 * length instead of solving a drop from one of those is the bug, every time.
 *
 * And a height is still not a place. Solving the drop leaves one question after
 * it — *is there anything at that height, at this x, at this z* — which this
 * file went on answering by assertion until it was measured, and the answer was
 * no at 24 run ends across five venues. `tieOff()` settles it now: the roof,
 * where a room publishes one and over the span it publishes it for; the head of
 * the back wall, where that is high enough; and otherwise a **mast**, because
 * the thing a festoon outdoors is tied to is a pole, and standing one is honest
 * where drawing a cord into the sky is not. `stalls` is the same argument with
 * gravity the other way up — see its note on `houseRake`, the field that would
 * let a seat find the floor its own room built.
 */

import {
  AdditiveBlending, BoxGeometry, BufferGeometry, CatmullRomCurve3, Color,
  ConeGeometry, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group,
  IcosahedronGeometry, InstancedMesh, Line, LineBasicMaterial, Material, Mesh,
  MeshBasicMaterial, Object3D, PlaneGeometry, ShaderMaterial, SphereGeometry,
  TorusGeometry, TubeGeometry, Vector3,
} from 'three';

import { Rng } from '../../core/rng.js';
import type { Venue } from '../../concert/types.js';
import { PROPS, riserFootprint, type PropName } from '../../concert/venue.js';
import { rowGap, SEAT_Y } from './stage-audience.js';
import {
  blend, cellPlane, HEAD_BAND, houseLid, hueShift, LENS_GAP, LOW_CEILING, playingArea, sagLine,
  shade, tint,
  type Kit, type PlayingArea, type Quality, type StageMetrics,
} from './stage-kit.js';

// ---------------------------------------------------------------------------
// The vocabulary
// ---------------------------------------------------------------------------

/**
 * Everything `stage.ts` will act on, under the name its callers already know.
 *
 * An alias for `PROPS` in `concert/venue.ts` rather than a list. The old name
 * is kept because `stage.ts` re-exports it as part of this directory's public
 * surface and there is no reason to make the renderer's consumers learn that
 * the vocabulary moved house; what matters is that there is nothing here left
 * to disagree with.
 *
 * `dressStage` iterates it, so the order the props are declared in `venue.ts`
 * is the order they are built in here. That ordering is grouped by room, which
 * is the right thing for a reader and means nothing to the scene graph — every
 * builder below places itself in y and z rather than relying on being late.
 */
export { PROPS as SUPPORTED_PROPS };
export type { PropName };

const KNOWN = new Set<string>(PROPS);

/**
 * The strip of deck along the back wall that the room's own back-wall dressing
 * owns, measured downstage from `backZ`.
 *
 * 0.45 m, and it is not a new number: it is the riser's upstage face, which
 * `riserFootprint` puts at `backZ + 0.45` on every stage this builds and which
 * `arches` and `backline` each quote in prose as the limit they stop short of.
 * Everything this file stands against the back wall is inside it — measured, the
 * most downstage face of each: `backline` 0.36, `arches` 0.39 (the lintel, the
 * deepest member of the arcade), `organ-pipes` 0.42, `screen` 0.10. So a prop
 * that stands *on* the boards rather than against the wall belongs downstage of
 * this line, and one that does not is standing in whatever the room put there.
 *
 * Measured, that is exactly what `flight-case` was doing: its z draw starts at
 * `backZ + 0.5` and a case is 0.6 deep, so its upstage face reached `backZ +
 * 0.2` — 0.16 m inside the amp line, 0.0528 m³ of it, in both shed venues that
 * dress the two together.
 */
const BACK_STRIP = 0.45;

/**
 * Where the arcade's stone is, so the two props that hang and stand in front of
 * it can clear it.
 *
 * `riserFootprint`'s argument, one prop over: two builders were solving one
 * layout and only one of them was right by construction. `backline` put a wall
 * of cabinets at `backZ + 0.2` and `arches` put a row of piers at `backZ + 0.22`
 * — the same 0.32 m of deck, at the same height, with the two files' only
 * acknowledgement of each other being `backline`'s prose note that it "stands 20
 * mm further downstage at the same depth". Measured in `latin/salsa`: **0.0907
 * m³** of pier inside cabinet, thirteen instances, and the same again in
 * `latin/moderno`. `paper-lanterns` is the same collision one storey up — its
 * bodies hang at `backZ + 0.3 ± 0.12` with a 0.19 m radius, which is inside the
 * arch rings in a courtyard and inside the lintel in a salon.
 *
 * A **function of the metrics** rather than a `Ctx` field, which is the choice
 * worth arguing since `Ctx.tables` exists three fields down. `Ctx` carries facts
 * that were *drawn* — a table's x and z come off a stream and cannot be
 * recomputed, so the only way to have them is to be handed them, and that costs
 * an ordering constraint: `dressStage` iterates `PROPS`, so a reader must be
 * declared after its writer. The arcade's layout is not drawn. It is
 * `openingWidth` and `backZ` and nothing else, so it can be asked for from
 * anywhere — which matters, because `paper-lanterns` is declared **six** names
 * into `PROPS` and `arches` is declared thirty-two, and no channel that runs
 * forward can reach it. One fact, one expression, and `arches` builds from the
 * same one it publishes.
 *
 * `openings` is the centre of each archway and `clear` the span between its
 * piers, which is what a thing standing *in* the arcade needs; `front` is the
 * downstage face of its deepest member, which is what a thing standing in front
 * of it needs.
 */
interface Arcade {
  /** z of the run's centre line. */
  z: number;
  /** z of the downstage face of the lintel — the deepest member, 0.34 across. */
  front: number;
  /** x of the centre of every arch, from the outside in. */
  openings: number[];
  /** Clear span between two piers. */
  clear: number;
  /** Bay module and pier width — the arcade's own, and nobody else's business. */
  bay: number;
  pierW: number;
}

function arcadeFootprint(m: { openingWidth: number; backZ: number }): Arcade {
  let bays = Math.max(3, Math.round(m.openingWidth / 2));
  if (bays % 2 === 0) bays += 1;
  const bay = m.openingWidth / bays;
  const pierW = Math.min(0.42, bay * 0.3);
  const z = m.backZ + 0.22;
  return {
    z,
    front: z + 0.17,
    openings: Array.from({ length: bays }, (_, i) => (i - (bays - 1) / 2) * bay),
    clear: bay - pierW,
    bay,
    pierW,
  };
}

/**
 * Where `pa-stack` stands its poles, so the floor props sharing that strip can
 * keep off them.
 *
 * `riserFootprint`'s argument a third time, and the cheapest instance of it: a
 * pole is 0.4 m of base plate and the only question anybody else asks about it
 * is where that plate is. `flight-case` used to carry a hand copy of the PA's
 * old cabinet footprint for exactly this, which was right until the PA moved and
 * would have been silently wrong the moment it did.
 *
 * The x is `drapes`' expression for the wing — outboard of the band, inboard of
 * the deck edge — with the pole standing in the middle of what that leaves, and
 * then held back off the edge by its own base. Both clamps bite somewhere in
 * the catalogue and they are 0.5 m apart: the wing is `MARGIN_SIDE` wide and the
 * plate is 0.36, so a room where `openingWidth` is no help gives the base 0.07 m
 * of daylight to the widest a player's own footprint reaches, and a room where
 * the aperture is wider than the boards would have hung 0.105 m of it over the
 * edge with the house floor a stage below.
 *
 * The z is upstage, which is where a PA hangs in any room that flies one, and
 * clear of `truss`' upstage run at `backZ + 0.9`.
 */
const PA_BASE_R = 0.18;

/**
 * And where `pa-ground` stands its columns, which is the older answer and a
 * different one: on the deck, at the back corners, in the band's own room.
 *
 * Published for the same reason as the pole's — `flight-case` parks on this
 * strip — and read a second time by `showPa`, which is the only thing in this
 * file that has to decide whether a *person* is standing in a prop.
 *
 * The x and z are the numbers `pa-stack` used before it went up: a 1.0 × 0.7 m
 * cabinet at `±(width / 2 - 0.7)` on `backZ + 1.3`. They reach 0.7 m inside
 * `play.halfX`, which is the whole reason this prop can be struck and the pole
 * version cannot — a stack in the wings is not in the wings.
 */
function paGroundFootprint(m: StageMetrics): { x: number; z: number; w: number; d: number } {
  return { x: m.width / 2 - 0.7, z: m.backZ + 1.3, w: 1.0, d: 0.7 };
}

function paFootprint(m: StageMetrics): { x: number; z: number; r: number } {
  const play = playingArea(m);
  const inner = Math.max(
    play.halfX, Math.min(m.width / 2 - 0.15, m.openingWidth / 2 - 0.25),
  );
  return {
    x: Math.min((inner + m.width / 2) / 2, m.width / 2 - PA_BASE_R - 0.02),
    z: m.backZ + 1.6,
    r: PA_BASE_R,
  };
}

/**
 * Where `bar` puts its counter, so the furniture in front of it can stop.
 *
 * Same argument as `arcadeFootprint` and the same ordering problem in the other
 * direction: `tables` is declared before `bar`, so nothing can be handed
 * forward, and the counter's z is a function of `lipZ` and `houseDepth` alone.
 *
 * Measured in all four jazz cellars, whose house is the shallowest that dresses
 * both: the counter's front face lands at `lipZ + 7.15` and the fourth row of
 * tables draws from `lipZ + 7.6` to `lipZ + 7.8`, so two tabletops a night sat
 * **0.05 m inside the counter** — 0.0087 m³ of 0.05 m plate buried in a bar,
 * eight instances over the four eras. The dance halls are the near miss that
 * says this is a clamp and not a coincidence: `country/outlaw`'s counter front
 * is at `lipZ + 7.85` against the same `lipZ + 7.8 + 0.34` of table, and it
 * clears only because that seed's jitter went the other way.
 */
function barFootprint(m: { houseWidth: number; houseDepth: number; lipZ: number }): {
  z: number; w: number; d: number;
} {
  // The counter, not the body: it is 0.2 m wider and 0.15 m deeper than the
  // cabinet under it, so it is the footprint of the two.
  return { z: m.lipZ + m.houseDepth - 0.8, w: m.houseWidth * 0.55 + 0.2, d: 0.7 };
}

/**
 * Level case, separators and a trailing plural. Nothing else.
 *
 * There were sixty-odd synonyms here — `lanterns`, `amps`, `carpet`, `flags`,
 * `platform`, `video` — and they existed because two files kept two lists and
 * the *other side* might reasonably have spelled a name differently. There is
 * no other side now. Every room in this repo is typed `PropName[]`, so a
 * synonym is unreachable from the only path that produces a `Venue`, and a
 * table nobody can reach is at best dead weight.
 *
 * It is worse than dead weight, and that is the part worth keeping. A synonym
 * is not a spelling, it is a claim about what a word means *given the rest of
 * the list* — and the list just grew by eleven names chosen precisely because
 * they were the distinctions the old vocabulary could not draw. `amps` meant
 * the PA when the PA was the only amplification in the world, and means
 * `backline` now. `carpet` was a small worn rug and is now the opposite of one.
 * `flags` was bunting, and a courtyard asking for flags wants neither.
 * `projection-screen` resolved to film on a cloth, which is the one thing a
 * `screen` is not. Every one of those would have gone on quietly resolving to
 * the answer that was correct before, in the rooms least able to notice —
 * fifteen new ones, written by people who never saw the old list.
 *
 * What is left cannot go wrong that way, because it never changes which *word*
 * was said. `"Paper Lanterns"`, `"paper_lanterns"` and `"paper-lanterns"` are
 * one word typed by three people, and forgiving that much is all a `string[]`
 * arriving from a file has ever needed.
 */
export function normaliseProp(raw: string): PropName | undefined {
  const key = raw.trim().toLowerCase().replace(/[\s_]+/g, '-');
  if (KNOWN.has(key)) return key as PropName;
  const singular = key.replace(/s$/, '');
  return KNOWN.has(singular) ? (singular as PropName) : undefined;
}

/** Which of a venue's props this stage understands. Order preserved, deduped. */
export function readProps(props: readonly string[]): Set<PropName> {
  const out = new Set<PropName>();
  for (const p of props) {
    const name = normaliseProp(p);
    if (name) out.add(name);
  }
  return out;
}

/** Which it did not — for reconciling the two vocabularies, not for crashing. */
export function unknownProps(props: readonly string[]): string[] {
  return props.filter((p) => normaliseProp(p) === undefined);
}

// ---------------------------------------------------------------------------
// Building them
// ---------------------------------------------------------------------------

export interface PropOptions {
  kit: Kit;
  venue: Venue;
  metrics: StageMetrics;
  quality: Quality;
  reducedMotion: boolean;
}

/** One solid piece of dressing, and which prop put it there. */
export interface PropSolid {
  name: PropName;
  node: Object3D;
}

export interface PropRig {
  root: Group;
  /**
   * The individual objects the dressing put in the room, one per solid thing.
   *
   * For anything that wants to know where the furniture *is* — which so far
   * means a tomato, whose collision world was the boards, the backdrop and two
   * walls and nothing else, so a throw at a PA stack went straight through it
   * and marked the wall behind. See `Staging.scenery` in `tomatoes.ts`.
   *
   * Not `root`: one box round the whole dressing is a box round the room.
   */
  solids: PropSolid[];
  /** Which names were placed. */
  placed: PropName[];
  /** Which were not recognised. */
  ignored: string[];
  /**
   * Whether the drum platform is standing. See the note by `BUILDERS.riser`.
   *
   * A no-op in a venue whose props do not include one, so the caller can say
   * what this number needs without first asking what the room owns.
   */
  showRiser(on: boolean): void;
  /**
   * Strike the ground-stacked PA on whichever side this number's cast is
   * standing in. See `BUILDERS['pa-ground']`.
   *
   * The caller passes where the band is and not which stack to hide, because
   * where the cabinets are is this file's business and where the people are is
   * `cast.ts`'s. A room whose props do not include `pa-ground` ignores it, as
   * `showRiser` does.
   *
   * `r` is the radius of what the performer *occupies*, gear included — a
   * modular is a metre of cabinets and a singer is a body — so the caller has
   * to know which of those it is handing over. That is one question with an
   * answer in the IR (`Performer.rig`) rather than a footprint this file could
   * work out for itself.
   */
  showPa(cast: readonly { x: number; z: number; r: number }[]): void;
  update(t: number, dt: number): void;
}

interface Ctx extends PropOptions {
  root: Group;
  m: StageMetrics;
  /** Where the band can be standing. Nothing hangs into it. See `stage-kit`. */
  play: PlayingArea;
  p: Venue['palette'];
  accent: string;
  idle: number;
  rng(tag: string): Rng;
  tick(fn: (t: number, dt: number) => void): void;
  /**
   * Which props this venue named — the set `dressStage` is already iterating.
   *
   * **Not a licence to branch on the room**, which is the rule this record is
   * one edge away from breaking. `c.venue.architecture` is the forbidden
   * question and `arches` carries the file's one violation of it, with a note
   * saying so. This is a different question with a different answer: not "what
   * building am I in" but "is the other object there", which a prop has to be
   * able to ask the moment two of them want the same patch of deck and the one
   * that has to move is built first. `flight-case` was already asking it — it
   * called `readProps(c.venue.props)` for itself to dodge `pa-stack` — and
   * recomputing a set `dressStage` has in its hand is the only part of that
   * which was wrong.
   *
   * What a builder may do with the answer is clear something. It may not build a
   * different object.
   */
  dressed: ReadonlySet<PropName>;
  /** Set by `BUILDERS.riser` so `showRiser` has something to hide. */
  riser?: Group;
  /**
   * The two ground-stacked PA columns, in `[-x, +x]` order, so `showPa` has
   * something to hide. The fourth thing published across this record and the
   * second one that exists for a *number* rather than for another builder —
   * see `riser`, whose switch this is a copy of on purpose.
   */
  paGround?: Group[];
  /**
   * Where `BUILDERS.tables` put its tops, so `candles` can stand on one.
   *
   * The second thing published across this record and for the same reason as
   * `riser`: two builders were computing one layout and only one of them was
   * right by construction. `PROPS` in `venue.ts` lists `tables` before
   * `candles` and `dressStage` iterates `PROPS`, so this is always written
   * before it is read; absent means the venue asked for candles and no tables,
   * which is a real dressing (a riihi, a sabha, a courtyard) and not an error.
   */
  tables?: { x: number; z: number }[];
  /**
   * The poles `mastHead` has already stood, so a second run reuses one.
   *
   * The third thing published across this record, and unlike `riser` and
   * `tables` it is written and read by the *same* helper rather than by two
   * builders. It is here rather than in a module-level cache because a `Ctx` is
   * one stage: a cache outside it would carry the pavilion's poles into the next
   * venue built in the same process, which is what `stage-check.ts` does 72
   * times in a row.
   */
  masts?: { x: number; z: number; head: Vector3 }[];
}

/**
 * The lowest anything may hang over the boards.
 *
 * `HEAD_BAND.hi` already includes the drum riser; the extra quarter of a metre
 * is for the swing, the sway and the fact that a decoration grazing the top of
 * somebody's head still reads as being on their head.
 */
const HANG_FLOOR = HEAD_BAND.hi + 0.25;

/**
 * The height a hanging run may be tied off *to* — the lowest real surface or
 * pipe over the boards.
 *
 * `swag` used to solve against `openingHeight` alone, which is the height of
 * the *aperture* and is a surface in a theatre and nowhere else. Seven of the
 * twelve rooms answer `openingWidth`/`openingHeight` with the clear span of the
 * building, so a run tied off "a hand's breadth under the header" was tied off
 * a hand's breadth under nothing at all — and in the lawn, whose aperture is
 * 4.64 m and whose only bar is at 3.45 m, it hung the festoon and both bunting
 * runs *above* the one thing in the room they could have been tied to.
 *
 * So: the plaster over the stage if the room has one, and the fly bar if the
 * sky is open. It is the rule `chandelier` already uses one storey up
 * (`Number.isFinite(lid) ? lid : c.m.flyY`) applied to the stage lid instead of
 * the house lid.
 *
 * Deliberately *not* `min(openingHeight, …)`, which is the version that reads
 * right and hangs wrong. A salon's aperture is its cornice soffit at 4.55 m and
 * its ceiling is at 5.00 m; the cornice is a moulding round the edge of the
 * room and the ceiling is a plane over all of it, so a run whose ends are 0.6 m
 * outboard of the aperture finds the ceiling there and finds no cornice at all.
 * The aperture bounds where a run may *hang* — that clamp stays, in `swag`,
 * because a run above the opening is a run the audience cannot see — but it is
 * not a thing anything can be tied to.
 *
 * ## It answers with the surface now, not with the clearance
 *
 * `headroom` is the lowest thing overhead and `rigLid` is the sheeting behind
 * it; this returned the first, and `deck()` below is the two-lid rule `truss`
 * already uses. There is no reason a cord should use the other one. Measured in
 * latin/conjunto, the salon: the festoon's ends were tied at 5.000 with the
 * ceiling panel at **5.160**, so both of them stopped 0.160 m short of the
 * plaster they claimed to hang from — the same 0.16 the salon's coffer sink
 * cost `truss` before `rigLid` existed, found again by a second prop.
 *
 * It moves nothing else. In all six roofed venues that carry a run, `swag`'s
 * `min(hang, openingHeight)` is bound by the aperture or by a `rigLid` equal to
 * `headroom`, so every run hangs at the height it hung at before to the
 * millimetre and only the tie moves.
 *
 * ## And the residual is in z, not in x
 *
 * The note that stood here said the fly bar is "a pipe rather than a plane" and
 * that a tie 0.24 m outboard of its span ends in air. Both sentences are true
 * and neither was what was happening. Measured bar spans: pavilion z 1.40–1.50,
 * courtyard 1.88–1.92, salon 1.74–1.82 — `curtainZ − 1.1` in all three — while
 * the runs hang at `curtainZ − 0.15` (festoon), `curtainZ − 0.35` and
 * `backZ + 0.25` (bunting) and `backZ + 0.3` (lanterns). In iskelmä/tanssilava
 * that is ties at z = 2.40 and z = −2.75 against a bar at z = 1.45: a ray fired
 * up or sideways from any of them returns Infinity, and the x was never the
 * problem.
 *
 * The lawn is the room that proves the near-miss is not a rule to code against.
 * Its bar sits at z 2.35–2.45 against a `curtainZ` of 2.750 — `curtainZ − 0.35`,
 * not `curtainZ − 1.1` — so a builder that solved for the bar's z would be right
 * in three rooms and wrong in the fourth, and wrong invisibly. **The bar's z and
 * its span are not published and this height is the whole of what a run may take
 * from it.** Where a run's end is actually closed is `tieOff`.
 */
function rigHeight(c: Ctx): number {
  return Number.isFinite(c.m.headroom)
    ? deck(c.m, c.m.headroom)
    : Math.min(c.m.openingHeight, c.m.flyY);
}

/**
 * The **surface** behind a lid — what a drop ends *on*, rather than what a lens
 * has to keep out of.
 *
 * `rigHeight` above answers "how high may a run be tied off". This answers a
 * different question with the same units, and the two are the same number in
 * nine of the twelve rooms and different in three, because in a room whose roof
 * is sloped, framed or coffered the lowest thing overhead is a *member* and the
 * continuous surface it carries is behind it. Measured, at the point the room
 * states the field for: **0.470 m** of rafter-plus-purlin above the soffit in
 * the shed, **0.153–0.160 m** of roof slope in the riihi, **0.160 m** of coffer
 * sink in the salon. A hanger solved against `headroom` in those three ends
 * that far under the steel it is bolted to, above a lid nobody can get over to
 * see it — which is exactly how it survived three rooms. See `RoomShape.rigLid`
 * in `rooms/types.ts`, which owns the number and argues every one of them.
 *
 * The `Number.isFinite` guard is not paranoia about `Infinity` arithmetic. A
 * stage house publishes a finite `houseLid` and an honest `Infinity` here — it
 * has a ceiling over the audience and genuinely nothing at all over the boards
 * — so a bare `Math.max` would hand a room with a real plaster lid an infinite
 * one the moment the caller passed it the other lid of the two.
 */
function deck(m: StageMetrics, lid: number): number {
  return Number.isFinite(m.rigLid) ? Math.max(lid, m.rigLid) : lid;
}

/**
 * Tie a hanging run off high enough that nothing on it reaches a face.
 *
 * A swag is not one height: it is the height of its ends, minus how far it
 * sags, minus how far whatever is tied to it drops below the line. Hanging by a
 * fraction of `openingHeight` gets all three wrong at once, and gets them
 * wrong hardest in the small rooms — where the opening is 3.6 m, a "0.62 of
 * the opening" run with a 0.6 m sag and 0.3 m pennants bottoms out at 1.33 m.
 *
 * So: solve for the ends. If the sag will not fit under the header, the sag
 * gives rather than the clearance — a taut run of bunting is a look, and a run
 * of bunting through a trumpeter's face is not.
 *
 * `hang` comes back with the answer because a run also has to be *attached* at
 * both ends, and only the caller knows where its ends are. The `- 0.12` here
 * was always trying to say "a hand's breadth under the thing overhead"; it
 * never checked that anything was overhead, and the callers never drew the last
 * hand's breadth. Both are fixed at once: see `rigHeight` for the height, and
 * `bunting`/`fairy-lights` for the vertical tie that now closes the gap.
 *
 * That vertical tie has since moved into `tieOff`, and the reason is worth a
 * line here because it is a correction to the sentence above. Drawing the last
 * hand's breadth was necessary and it was not sufficient: a cord drawn from the
 * run's end straight up to `hang` asserts that `hang` is a *surface at that
 * x and that z*, and in five of the twelve venues that carry these props there
 * is nothing there at all. `hang` is still the right height and it is no longer
 * the right place. See `tieOff`.
 */
function swag(c: Ctx, wantSag: number, drop: number): { y: number; sag: number; hang: number } {
  const hang = rigHeight(c);
  // Under the aperture as well as under the thing it is tied to: a run hung
  // above the opening is a run the house cannot see. In the nine rooms where
  // the aperture is the lower of the two this is the number it always was.
  const top = Math.min(hang, c.m.openingHeight) - 0.12;
  const sag = Math.max(0.15, Math.min(wantSag, top - drop - HANG_FLOOR));
  return { y: Math.min(top, HANG_FLOOR + sag + drop), sag, hang };
}

/**
 * Close one end of a hanging run — on a surface, or on a pole this stands for
 * it.
 *
 * `rigHeight` answers *how high* a run may be tied. This answers the other
 * half, which the file had been asserting rather than solving: **is there
 * anything at that height, at this x, at this z**. Probed at all 24 run ends in
 * the twelve venues that name `bunting`, `fairy-lights` or `paper-lanterns`,
 * with rays up and sideways from the tie and props excluded, the answer was no
 * in five venues and marginal in two more:
 *
 * ```
 *  iskelmä/tanssilava  bunting ×4, festoon ×2, lanterns   nothing, any direction
 *  iskelmä/eighties    bunting ×4, festoon ×2             nothing, any direction
 *  reggae/ska          bunting-back ×2, festoon ×2, lant. nothing, any direction
 *  reggae/rocksteady   festoon ×2                         nothing, any direction
 *  arabic/shaabi       festoon ×2                         nothing, any direction
 *  arabic/takht        lanterns                           nothing, any direction
 *  finnfolk/pelimanni  bunting ×4      roof 0.160 m BELOW the tie — it pokes out
 *  finnfolk/revival    bunting ×4, festoon ×2   roof 0.157 / 0.236 m below
 *  latin/conjunto      festoon ×2                         ceiling 0.160 m above
 *  country/*, hiphop   bunting, festoon                   ceiling exactly at 0
 * ```
 *
 * Three answers, in this order, and each of them is a published number rather
 * than a room:
 *
 * **1. The lid, at the pick.** `RoomShape.rigLid` states what a hanger over the
 * boards may be shackled to and states the span it is guaranteed over — "what
 * is over `x = ±(width / 2 − 0.4)`, upstage and downstage of the band", in its
 * own words. Every run in the catalogue overshoots that: bunting ends at
 * `openingWidth / 2 + 0.4` and the festoon at `+ 0.6`, which in a room whose
 * aperture is its clear span puts the end 0.4–0.6 m outboard of the boards and
 * 0.8–1.0 m outboard of the pick. So the tie goes up **and inboard**, to the
 * nearest x the room has answered for, which is what a guy on the end of a
 * festoon does anyway. That is not pedantry about a guarantee: the riihi's roof
 * is a pitch, and measured, its boarding is at 3.890 m over the pick and
 * **3.570 m** over the end of the run — a vertical tie there ends 0.320 m
 * outside the building, through the roof, which is how it survived. The
 * dancehall (3.150 at both) and the salon (5.160 at both) are unmoved by the
 * clamp and lose nothing to it.
 *
 * **2. The head of the back wall.** For a run that is already upstage —
 * `z ≤ backZ + 0.8`, which is bunting's upstage run and the lantern wire and
 * nothing else — `houseY + backdropHeight` is a real wall head, and the wall is
 * there: probed horizontally at ±(width / 2 + 0.5), the back wall answers at
 * every x in every room. Measured heads above the boards, against the height
 * the run wants: lawn **3.550 vs 3.450**, courtyard **4.170 vs 3.920** — both
 * usable, and both rooms where the alternative was a pole standing 0.35 m in
 * front of a perfectly good wall. The pavilion is why this is a test and not a
 * rule: its back wall tops out **1.500 m** above the boards, 1.15 m *below*
 * `HANG_FLOOR`, so a run tied to it would be a run through the trumpeter.
 *
 * **3. A mast.** Nothing overhead and no wall high enough. Under an open sky
 * that is the truth and there is no arithmetic that improves on it — standing
 * the pole a festoon is actually tied to is honest where drawing a cord into
 * the air and calling the top of it a fixing is not. It is the same admission
 * `birch` made about a bare cylinder ending in mid-air, from the other end.
 *
 * Masts are shared, because two runs 0.20 m apart do not get two poles. Within
 * half a metre in x and in z is one mast, which merges the festoon's ends into
 * bunting's downstage pair (Δ 0.20 m, 0.20 m) and the lantern wire's into
 * bunting's upstage pair (Δ 0.00 m, 0.05 m), and cannot merge a downstage tie
 * with an upstage one — those are five metres apart. `PROPS` is iterated in
 * declaration order and `bunting` is declared first, so which prop stands the
 * pole is fixed, and so is where it stands.
 *
 * ## The gate on branch 2 was 0.5 and is 0.8
 *
 * It is a question about the *wall* — is it near enough that a cord to it reads
 * as a tie rather than as a cable strung across the room — and 0.5 was the
 * distance the callers of the day happened to sit at rather than an answer to
 * it. The lantern wire moved: `arches` owns the strip of deck it used to hang
 * over (see `arcadeFootprint`), so where an arcade is dressed the wire is at
 * `backZ + 0.73` and the old gate threw it onto a mast — two timber poles stood
 * in a riad courtyard, 0.8 m in front of a perfectly good wall, which is the
 * exact failure the gate's own paragraph above says branch 2 exists to prevent.
 *
 * Nothing else in the file comes near either number, so the widening is
 * measurable and it is small: the only ties this file makes are bunting's
 * upstage run at `backZ + 0.25`, the lantern wire at `backZ + 0.3` or
 * `backZ + 0.73`, and three downstage runs at `curtainZ − 0.15` to
 * `curtainZ − 0.35`, which in every open-air room are **five metres or more**
 * downstage of the gate at either setting. The cord this buys in the courtyard
 * runs 0.81 m upstage and rises 0.12 m to the wall head — flatter than the
 * 0.35 m × 0.12 m diagonal branch 2 was already drawing there, and a great deal
 * more like a tie than a 4.37 m pole is.
 */
function tieOff(c: Ctx, end: Vector3, colour: string): void {
  const hang = rigHeight(c);
  if (Number.isFinite(c.m.headroom)) {
    const pick = Math.max(0, c.m.width / 2 - 0.4);
    const x = Math.sign(end.x) * Math.min(Math.abs(end.x), pick);
    cord(c, [end, new Vector3(x, hang, end.z)], colour);
    return;
  }
  // The wall's face, not its centre line: the rooms build the thing behind the
  // band at `backZ - 0.075` (lawn) or `backZ - 0.1` (pavilion, courtyard), so a
  // tie landing at `backZ - 0.05` is 0.025–0.05 m off it either way.
  if (end.z <= c.m.backZ + 0.8 && c.m.houseY + c.m.backdropHeight >= hang) {
    cord(c, [end, new Vector3(end.x, hang, c.m.backZ - 0.05)], colour);
    return;
  }
  cord(c, [end, mastHead(c, end.x, end.z, hang)], colour);
}

/**
 * Stand a pole, or find the one already standing there. Returns its head.
 *
 * A tapered timber post, because the two rooms that need most of them are a
 * lakeside dance pavilion and a festival lawn and both of them would have
 * timber. Colour off `boards` rather than `proscenium` for the same reason: the
 * deck is the other timber in the picture and a post that matches it reads as
 * part of the building rather than as scaffold.
 *
 * **The foot is the argument.** A mast that ends in the air is the bug it was
 * built to fix, so it stands on one of the two surfaces every room publishes —
 * the boards at y = 0 where the run has not overshot them, the house floor at
 * `houseY` where it has. Measured, every mast this places in the catalogue is
 * outboard of the deck edge (5.10 against 5.00 in the pavilion, 5.90 against
 * 5.50 on the lawn, 6.30 against 5.70 in the courtyard), so all of them are on
 * the house floor, and a ray fired down from each foot position lands on it:
 * −0.900, −0.750, −0.450 respectively, which is `houseY` to the millimetre. The
 * 0.08 m of margin on the deck test is the pole's own radius plus a little, so
 * a mast that does stand on the boards stands with its whole section on them.
 *
 * Heights run 4.20 m (lawn, floor at −0.75 to a bar height of 3.45) to 4.95 m
 * (pavilion). That is a tall pole and it is the right tall pole: the pavilion
 * gets four of them, two downstage and two upstage, which is a dance pavilion's
 * corner posts, and the picture that produced this whole defect was of bunting
 * "passing in front of a row of masts" that were actually birch trunks. There
 * are masts now, and they are holding the bunting up.
 *
 * Fourteen poles over the whole catalogue — pavilion ×4 twice, lawn ×2 twice,
 * courtyard ×2 — and swept against every other solid in their rooms they touch
 * one thing: in the two venues where `fairy-lights` stands its own pole rather
 * than sharing bunting's, the end lampholder is **0.00062 m³** inside it. That
 * is a seventh of a collision and it is where the end lampholder of a festoon
 * is. Where the pole is shared the run ends 0.20 m inboard of it and there is
 * nothing at all.
 */
function mastHead(c: Ctx, x: number, z: number, top: number): Vector3 {
  const masts = (c.masts ??= []);
  const near = masts.find((m) => Math.abs(m.x - x) < 0.5 && Math.abs(m.z - z) < 0.5);
  if (near) return near.head;
  const foot = Math.abs(x) <= c.m.width / 2 - 0.08 ? 0 : c.m.houseY;
  const h = top - foot;
  put(c, c.kit.geometry(`mast|${h.toFixed(3)}`,
    () => new CylinderGeometry(0.055, 0.075, h, 8)),
  c.kit.solid(shade(c.p.boards, 0.25), { rough: 0.92 }), x, foot + h / 2, z, true);
  const head = new Vector3(x, top, z);
  masts.push({ x, z, head });
  return head;
}

export function dressStage(o: PropOptions): PropRig {
  const root = new Group();
  const updaters: ((t: number, dt: number) => void)[] = [];
  const wanted = readProps(o.venue.props);
  const ctx: Ctx = {
    ...o,
    root,
    m: o.metrics,
    play: playingArea(o.metrics),
    p: o.venue.palette,
    accent: hueShift(o.venue.palette.curtain, 42, 0.2),
    idle: o.reducedMotion ? 0.18 : 1,
    rng: (tag: string) => new Rng(`${o.venue.id}:prop:${tag}`),
    tick: (fn) => { updaters.push(fn); },
    dressed: wanted,
  };

  const placed: PropName[] = [];
  /**
   * What each builder actually put in the room, so that something can be thrown
   * at it.
   *
   * Taken as the slice of `root.children` a builder added rather than by asking
   * the builders to return anything: there are seventy-odd of them, they all
   * write into `ctx.root` and several add more than one object — two PA stacks,
   * a row of bales — and a bounding box drawn round *all* of a prop's pieces at
   * once would be a box with the stage in the middle of it. One node, one solid
   * thing, which is the granularity a collision proxy wants.
   */
  const solids: PropSolid[] = [];
  for (const name of PROPS) {
    if (!wanted.has(name)) continue;
    const before = root.children.length;
    BUILDERS[name](ctx);
    placed.push(name);
    for (const node of root.children.slice(before)) solids.push({ name, node });
  }

  return {
    root,
    solids,
    placed,
    ignored: unknownProps(o.venue.props),
    showRiser(on: boolean): void {
      if (ctx.riser) ctx.riser.visible = on;
    },
    showPa(cast): void {
      if (!ctx.paGround) return;
      const pa = paGroundFootprint(ctx.m);
      ctx.paGround.forEach((stack, i) => {
        const x = (i === 0 ? -1 : 1) * pa.x;
        // A rectangle grown by the body's radius, which is the cheap standard
        // test and the right one here: both shapes are axis-aligned and the
        // corner error is a few centimetres on a prop that is either standing
        // or gone.
        stack.visible = !cast.some((p) => Math.abs(p.x - x) < pa.w / 2 + p.r
          && Math.abs(p.z - pa.z) < pa.d / 2 + p.r);
      });
    },
    update(t: number, dt: number): void {
      for (const fn of updaters) fn(t, dt);
    },
  };
}

// --- small helpers ---------------------------------------------------------

function put(
  c: Ctx, geo: BufferGeometry, mat: Material,
  x: number, y: number, z: number, shadow = false,
): Mesh {
  const mesh = new Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = shadow;
  c.root.add(mesh);
  return mesh;
}

function cord(c: Ctx, points: Vector3[], colour: string): Line {
  const geo = c.kit.own(new BufferGeometry().setFromPoints(points));
  const line = new Line(geo, c.kit.material(`cord|${colour}`, () => new LineBasicMaterial({ color: colour })));
  c.root.add(line);
  return line;
}

// ---------------------------------------------------------------------------
// The handlers
// ---------------------------------------------------------------------------

const BUILDERS: Record<PropName, (c: Ctx) => void> = {
  // -- architectural: stage.ts reads these itself ---------------------------
  'black-box': () => {},
  brick: () => {},
  'open-air': () => {},
  haze: () => {},

  // -- the pavilion --------------------------------------------------------

  /**
   * Two swagged runs of triangular flags across the opening.
   *
   * The flags hang about a third of a metre below the cord, so the cord is not
   * the thing that has to clear a head — see `swag`. The upstage run is also
   * pushed behind the backline: at `backZ + 0.5` it was tied off exactly on the
   * cast's upstage margin and sagged into the drummer.
   *
   * And both runs are tied off *upward*, which they were not. A run 0.4 m past
   * the aperture on each side ended in mid-air in every room whose aperture is
   * not an arch: measured at the end points, the pavilion's upstage run found
   * nothing within 0.35 m of either end and the lawn's pair hung 0.33 m above
   * the only bar in the field. The scanner never said so because in a dancehall
   * the flags top out 0.12 m under the plaster and it counts that as hung, and
   * because the open-air rooms union everything into the sky dome. A short
   * vertical from each end up to `rigHeight` is the whole fix — four cords, one
   * per end of each run, and in the tall rooms it reads as what it is, a run
   * dropped off the ceiling rather than nailed to a header that is not there.
   *
   * ## The vertical was half of it
   *
   * The paragraph above is right about the cord and wrong about "the whole
   * fix", and the second half took another sweep to see. A vertical drawn to
   * `rigHeight` asserts a surface at the run's own x and z; probed in every
   * venue that carries this prop, there is one in five of them and not in the
   * other four. Worst of all is the room the prop was written for: in
   * iskelmä/tanssilava all four ties sit at z = 2.20 and z = −2.75 with the fly
   * bar at z = 1.45, so the cords this docstring was added for went **up 0.47 m
   * into open sky** and stopped. The upstage pair in country/nashville had
   * nothing within 1.179 m of the top in any direction. And in
   * finnfolk/pelimanni the tie was 0.160 m *outside* the roof rather than under
   * it, the run being 0.40 m outboard of a boarding that slopes.
   *
   * So the four cords stay and where they go is `tieOff`'s decision — up and
   * inboard to the roof, back to the head of the wall, or on to a mast standing
   * where nothing else does. `hang` is no longer read here for the same reason:
   * it is a height, and an end needs a place.
   */
  bunting: (c) => {
    const rng = c.rng('bunting');
    const w = c.m.openingWidth;
    const drop = 0.33;
    const front = swag(c, 0.8, drop);
    const back = swag(c, 0.6, drop);
    const runs = [
      { y: front.y, z: c.m.curtainZ - 0.35, sag: front.sag, n: 20 },
      { y: back.y, z: c.m.backZ + 0.25, sag: back.sag, n: 16 },
    ];
    const cols = [c.accent, hueShift(c.accent, 120, 0.1), hueShift(c.accent, -110, 0.1), tint(c.p.curtain, 0.5)];
    for (const run of runs) {
      const pts = sagLine(
        new Vector3(-w / 2 - 0.4, run.y, run.z),
        new Vector3(w / 2 + 0.4, run.y, run.z),
        run.sag, run.n,
      );
      cord(c, pts, shade(c.p.proscenium, 0.5));
      // Inside the loop, so the upstage run gets its pair too — it is the one
      // the pavilion had nothing under at all. The two runs resolve differently
      // and must: on a lawn the upstage pair reaches the back wall and the
      // downstage pair has to have a pole stood for it.
      for (const end of [pts[0]!, pts[run.n]!]) tieOff(c, end, shade(c.p.proscenium, 0.5));
      const pos: number[] = [];
      const col: number[] = [];
      const tmp = new Color();
      for (let i = 0; i < run.n; i++) {
        const a = pts[i]!;
        const b = pts[i + 1]!;
        const drop = 0.3 + rng.float(-0.03, 0.03);   // ≤ `drop` above, by design
        pos.push(a.x, a.y, a.z, b.x, b.y, b.z, (a.x + b.x) / 2, (a.y + b.y) / 2 - drop, (a.z + b.z) / 2);
        tmp.set(cols[i % cols.length]!);
        for (let v = 0; v < 3; v++) col.push(tmp.r, tmp.g, tmp.b);
      }
      const geo = c.kit.own(new BufferGeometry());
      geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
      geo.setAttribute('color', new Float32BufferAttribute(col, 3));
      geo.computeVertexNormals();
      const flags = new Mesh(geo, c.kit.solid('#ffffff', { vertexColors: true, side: DoubleSide, rough: 0.9 }));
      c.root.add(flags);
      c.tick((t) => {
        flags.rotation.z = Math.sin(t * 0.5 + run.z) * 0.012 * c.idle;
        flags.position.y = Math.sin(t * 0.7 + run.z) * 0.02 * c.idle;
      });
    }
  },

  /**
   * A festoon of warm bulbs. Unlit material — they are the light source.
   *
   * The run is `openingWidth + 1.2`, so each end sits 0.6 m outboard of the
   * aperture on the faith that a proscenium wall is there to bury it in. Seven
   * of the twelve rooms publish the clear span of the building as their
   * aperture, and in those there is no wall at that x: measured at the end
   * points, the salon's run stops 2.00 m short of its own side wall and the
   * courtyard's finds nothing within 0.35 m. The width is left alone — a
   * festoon that stops short of the wing is a festoon, and shortening it would
   * pull the brightest object in the frame in off the edges — and the ends are
   * tied up to `rigHeight` instead, which is a hanging point in every room and
   * is the last thing `swag`'s own `- 0.12` was already assuming.
   *
   * ## `rigHeight` is a height and it is not a hanging point
   *
   * The last sentence above is the one that was wrong, and this run is the
   * clearest case in the file because it overshoots the aperture further than
   * anything else: 0.6 m each side, which is 1.0 m outboard of the pick the
   * lid is published over. Measured at the ends, with props excluded and rays
   * fired up and both ways in x and z — nothing at all in
   * iskelmä/tanssilava (5.30), iskelmä/eighties (5.58), reggae/ska (6.10),
   * reggae/rocksteady (6.20) or arabic/shaabi (6.30); the roof 0.236 m *below*
   * the tie in finnfolk/revival, the run having walked out past the pitch; and
   * the salon's ceiling 0.160 m above the tie in latin/conjunto, which is the
   * `headroom`-versus-`rigLid` gap `rigHeight` now closes with `deck`.
   *
   * The width is still left alone, for the reason above, and the two ends are
   * handed to `tieOff` — which in the six rooms with a roof takes them up and
   * inboard to it and in the other four stands the pole a festoon outdoors is
   * strung between. On a lawn that is two poles for six runs' worth of ends,
   * because the masts are shared.
   */
  'fairy-lights': (c) => {
    const rng = c.rng('fairy');
    const w = c.m.openingWidth + 1.2;
    const n = c.quality === 'low' ? 18 : 30;
    // A 0.9 m sag off 0.78 of the opening bottomed out at 2.08 m in a jazz
    // cellar — a bulb per player, at eye level. The bulbs are 5 cm, so that is
    // all the drop `swag` has to allow for.
    const line = swag(c, 0.9, 0.06);
    const z = c.m.curtainZ - 0.15;
    const pts = sagLine(
      new Vector3(-w / 2, line.y, z),
      new Vector3(w / 2, line.y, z),
      line.sag, n,
    );
    cord(c, pts, shade(c.p.proscenium, 0.6));
    for (const end of [pts[0]!, pts[n]!]) tieOff(c, end, shade(c.p.proscenium, 0.6));
    const warm = tint(hueShift(c.p.ambient, 20, 0.2), 0.55);
    const bulbs = new InstancedMesh(
      c.kit.geometry('bulb', () => new IcosahedronGeometry(0.05, 0)),
      c.kit.basic(warm),
      n + 1,
    );
    bulbs.frustumCulled = false;
    const dummy = new Object3D();
    const rates: number[] = [];
    for (let i = 0; i <= n; i++) {
      dummy.position.copy(pts[i]!);
      dummy.updateMatrix();
      bulbs.setMatrixAt(i, dummy.matrix);
      rates.push(rng.float(0.4, 1.6));
    }
    c.root.add(bulbs);
    const tone = new Color(warm);
    const out = new Color();
    c.tick((t) => {
      for (let i = 0; i <= n; i++) {
        const k = 0.78 + 0.22 * Math.sin(t * rates[i]! + i) * c.idle;
        bulbs.setColorAt(i, out.copy(tone).multiplyScalar(k));
      }
      if (bulbs.instanceColor) bulbs.instanceColor.needsUpdate = true;
    });
  },

  /**
   * Lanterns against the back wall, above everybody.
   *
   * This is the prop the whole sightline rule was written for. A 0.38 m sphere
   * of ten segments reads as a hexagon at any distance, it is unlit so it is the
   * brightest thing in the room, and it used to hang at `backZ + 1.1` — which is
   * the middle of the drum riser — with its bottom at 2.30 m, which is the top
   * of a drummer's head once the riser is under them. It sat on the drummer's
   * face in every wide shot.
   *
   * Both halves of the fix, because either alone leaves a camera angle that
   * still finds it: upstage of the backline, *and* clear of `HANG_FLOOR`.
   *
   * ## And the cord goes somewhere now
   *
   * The body's height is solved against `HANG_FLOOR` and the aperture, and the
   * thing it hung *from* was then a constant: `y + 0.9`, 0.9 m above a height
   * that was itself derived, with no relationship to any ceiling, beam or bar.
   * Probed in all four venues that carry the prop, nothing was within 0.35 m of
   * the top of any cord — the pavilion's stopped 0.02 m *past* its fly bar, the
   * lawn's 0.62 m above the only bar in the field, the salon's 0.78 m below its
   * own ceiling. `chandelier`'s note cites this prop as an example of a fitting
   * that says what it hangs from, which it was not. It is `rigHeight` now, the
   * same height `swag` ties its runs to, so the cord is as long as the room
   * makes it: 0.28 m in the lawn, 1.27 m in the salon.
   *
   * ## Five cords needed one wire
   *
   * And `rigHeight` was a height with nothing at it, which is the same defect
   * one level up. Probed at the top of every cord in the four venues that carry
   * the prop, with props excluded: nothing in any direction in
   * iskelmä/tanssilava, reggae/ska or arabic/takht, all three of which are open
   * to the sky over the boards. Only latin/conjunto had anything, and that was
   * the salon's ceiling 0.160 m above.
   *
   * The fix is not five ties. A string of paper lanterns is hung from a **span
   * wire**, and hanging one is what makes five cords into one problem: the wire
   * runs the width of the aperture at `backZ + 0.3`, the bodies drop off it, and
   * its two ends go to `tieOff` like any other run's. That also puts the ends at
   * `openingWidth / 2 + 0.4`, which is exactly where `bunting`'s upstage run
   * ends — so where both props are dressed the wire shares bunting's masts
   * rather than standing two more of its own, and where only this prop is
   * dressed (arabic/takht) the wire reaches the back wall and needs none.
   *
   * The wire hangs at `min(rigHeight, openingHeight) - 0.12` rather than at
   * `rigHeight`, which is `swag`'s own top and is under the aperture as well as
   * under the lid. That subsumes the `hang - 0.12` clamp below, which was
   * saying the same thing about one lantern at a time; the bodies do not move,
   * because `openingHeight - 0.4` or the `HANG_FLOOR` term binds first in all
   * four venues.
   *
   * The z jitter is kept and now belongs to the *body* rather than to the whole
   * assembly, so the cord leans a little off a wire that is straight. That is
   * what a lantern on a wire does, and it keeps the draw order of
   * `':prop:lanterns'` intact — the same five lanterns in the same places, which
   * a reshuffle here would have moved for no gain.
   *
   * ## `backZ + 0.3` is not this prop's to have where there is an arcade
   *
   * The strip of deck behind the band is the room's, and in two of the four
   * venues something is standing in it: `arches` runs a row of piers, rings and
   * a lintel through `backZ + 0.05` to `backZ + 0.39`, and the wire hangs its
   * bodies at `backZ + 0.3 ± 0.12` with a 0.19 m radius — from `backZ − 0.01` to
   * `backZ + 0.61`. So a lantern was inside the stonework, and not marginally.
   * Measured: in `latin/conjunto` **all five** bodies sit at y 3.05–3.49 against
   * a lintel whose soffit is at 3.173, **0.0224 m³** in the worst of them; in
   * `arabic/takht` three of five are inside the arch rings themselves at
   * y 2.78–3.20 against stone from 2.86 to 3.16, 0.0067 m³.
   *
   * Neither of the two other ways out survives measurement. Above the lintel is
   * 3.71 m in the courtyard against a wire at 3.80 and an aperture that stops the
   * body at 3.77 — a 0.06 m cord, which is a lantern glued to its own wire.
   * Moving the arcade is not available: its upstage face is already 0.16 m off
   * the backdrop and its downstage face 0.06 m off the riser, which its own
   * docstring calls the tightest clearance in the file.
   *
   * So the wire goes downstage of the stone, by exactly the arcade's reach plus
   * the body's own: `front + 0.19 + 0.12` and 0.03 m of daylight, which is
   * `backZ + 0.73`. That 0.03 is the guarantee at the worst jitter either lantern
   * could draw; measured, the nearest body to any stone is 0.057 m in the
   * courtyard and 0.059 m in the salon. It gives up the *belt* of this prop's two sightline
   * guarantees and keeps the braces — the rule at the top of this file is that
   * hanging dressing clears `HANG_FLOOR` **or** stands upstage of the backline,
   * and the bodies' undersides are at 2.83 m (courtyard) and 3.11 m (salon)
   * against a 2.65 m floor. It is also the better picture: a string of lanterns
   * in a riad hangs *in* the courtyard with the arcade behind it, which is what
   * `arches` is for.
   */
  'paper-lanterns': (c) => {
    const rng = c.rng('lanterns');
    const warm = tint(hueShift(c.p.curtain, 25, 0.1), 0.45);
    const geo = c.kit.geometry('lantern', () => new SphereGeometry(0.19, 10, 7));
    const group = new Group();
    c.root.add(group);
    const swings: { node: Object3D; phase: number; rate: number }[] = [];
    /** The ceiling, the bar or the top of the aperture — whatever is lowest. */
    const hang = rigHeight(c);
    /** The wire the five of them hang from: under the lid, under the aperture. */
    const wireY = Math.min(hang, c.m.openingHeight) - 0.12;
    // Behind the backline at `play.backZ`, and far enough off the backdrop
    // (which sits at `backZ - 0.1`) that a 0.19 m body does not go into it —
    // unless the room has an arcade in that strip, in which case the wire hangs
    // downstage of the stone by a body's radius and its own jitter. See above.
    const arcade = c.dressed.has('arches') ? arcadeFootprint(c.m) : undefined;
    const wireZ = arcade ? arcade.front + 0.19 + 0.12 + 0.03 : c.m.backZ + 0.3;
    const halfW = c.m.openingWidth / 2 + 0.4;
    const wire = shade(c.p.proscenium, 0.7);
    const ends = [new Vector3(-halfW, wireY, wireZ), new Vector3(halfW, wireY, wireZ)];
    cord(c, ends, wire);
    for (const end of ends) tieOff(c, end, wire);
    // The body is 0.19 × 0.85 tall, and the swing is a 0.05 rad tilt, so the
    // lowest the paper ever gets is the centre less 0.17 m. That 0.17 is the
    // body's half-height and not a cord term, which is why a cord that is now
    // 0.28–1.27 m rather than a flat 0.9 m does not disturb it: a tilt swings
    // the body sideways by `0.05 · L` and *lifts* it by `L · (1 − cos 0.05)`,
    // 6 cm across and 2 mm up on the longest of them.
    const lowest = HANG_FLOOR + 0.17;
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * (c.m.openingWidth / 5.5);
      const y = Math.min(
        c.m.openingHeight - 0.4,
        // Under the wire it hangs from, which `openingHeight - 0.4` does not
        // guarantee on its own. Inert in all four venues that carry the prop —
        // the shortest cord it produces is 0.28 m on a lawn.
        wireY,
        Math.max(lowest, c.m.openingHeight * 0.72) + rng.float(-0.06, 0.06),
      );
      const zj = rng.float(-0.12, 0.12);
      const node = new Group();
      node.position.set(x, wireY, wireZ);
      const body = new Mesh(geo, c.kit.basic(warm));
      body.position.set(0, y - wireY, zj);
      body.scale.y = 0.85;
      node.add(body);
      cord(c, [new Vector3(x, wireY, wireZ), new Vector3(x, y, wireZ + zj)], wire);
      group.add(node);
      swings.push({ node, phase: rng.float(0, 6.28), rate: rng.float(0.35, 0.6) });
    }
    c.tick((t) => {
      for (const s of swings) s.node.rotation.z = Math.sin(t * s.rate + s.phase) * 0.05 * c.idle;
    });
  },

  /**
   * Moths in the beams. Twenty-four instanced flecks and a lot of charm.
   *
   * *In the beams* — which is where the plan asks for them and, until this was
   * measured, not where they were: the flock started at 1.6 m and wandered
   * another 0.28 m below that, so a third of them spent the show orbiting the
   * singer's head. They are 3.5 cm and it still reads, because a small bright
   * thing crossing a face is exactly what the eye is built to notice.
   *
   * ## Both ends of the band were a guess, and the top one went through plaster
   *
   * `floor + 0.5` and `openingHeight * 0.92` are two numbers about the aperture
   * and neither of them is about the ceiling, which this prop had never read.
   * In `country/stringband` — a dance hall with a 3.150 m plaster lid and a
   * 3.150 m opening — the `max` put the band's top at **3.430**, the vertical
   * wander added another 0.28 and the fleck's own half-diagonal another 0.05, so
   * fourteen of the twenty-four spent the show at up to **3.639 m**, half a metre
   * above the plaster. Moths *moving* through a ceiling is the worst version of
   * this defect in the catalogue, which is why they are worth the arithmetic: a
   * static object above a lid reads as a mistake once and a moving one reads as
   * one continuously.
   *
   * The bottom was wrong by less and in the same way. `HANG_FLOOR + 0.7 · 0.4`
   * reserved the *largest* wander any moth could draw and then forgot the body,
   * so the lowest underside in the flock was 2.60 m against a 2.65 m floor —
   * five centimetres into the head band, in every room.
   *
   * So the band is stated once, in surfaces rather than in centres: `HANG_FLOOR`
   * to `min(0.92 · openingHeight, headroom)`, with the fleck's own reach taken
   * off each end. `MOTH` is that reach — a 0.07 m cone of 0.035 m radius
   * tumbling on all three axes, so the furthest any vertex gets from the centre
   * is `hypot(0.035, 0.035)`, and it is a *sphere* because `tick` spins it.
   *
   * The wander then gives rather than the band. Each fleck's vertical amplitude
   * is its own `r · 0.4` clamped to half of whatever room is left, so a tall
   * house is untouched — the clamp is inert in all five open-air venues, where
   * the band is 1.5 to 2.2 m wide against amplitudes of 0.10 to 0.28 — and the
   * dance hall gets a 0.20 m band with the flecks fluttering inside it instead of
   * a flock with a ceiling through the middle of it. A room with no band at all
   * gets no moths, the way `beams` and `mirror-ball` stand down rather than draw
   * the contradiction; nothing in the catalogue reaches it, the tightest being
   * the same dance hall at 0.199 m.
   *
   * The draw *order* is untouched and so is the stream: `y` was the third of six
   * floats and still is, taken as a fraction and mapped after `r` is known
   * instead of before. The flock does move — every fleck's height is remapped —
   * and nothing reads this stream or is placed against a moth.
   */
  moths: (c) => {
    const rng = c.rng('moths');
    const n = c.quality === 'low' ? 10 : 24;
    /** How far a tumbling 0.07 × 0.035 m cone reaches from its own centre. */
    const MOTH = Math.hypot(0.035, 0.035);
    /** The band a fleck's whole body stays inside. See the docstring. */
    const lo = HANG_FLOOR + MOTH;
    const hi = Math.min(c.m.openingHeight * 0.92, c.m.headroom) - MOTH;
    if (hi <= lo) return;
    const mesh = new InstancedMesh(
      c.kit.geometry('moth', () => new ConeGeometry(0.035, 0.07, 3)),
      c.kit.basic(tint(c.p.ambient, 0.7)),
      n,
    );
    mesh.frustumCulled = false;
    c.root.add(mesh);
    const flock = Array.from({ length: n }, () => {
      const x = rng.float(-c.m.width * 0.4, c.m.width * 0.4);
      const at = rng.float(0, 1);
      const z = rng.float(c.m.backZ + 1, c.m.lipZ);
      const r = rng.float(0.25, 0.7);
      /** Vertical wander: this fleck's own, or half the band, whichever fits. */
      const ry = Math.min(r * 0.4, (hi - lo) / 2);
      return {
        x, z, r, ry,
        y: lo + ry + at * (hi - lo - 2 * ry),
        s: rng.float(0.5, 1.4),
        ph: rng.float(0, 6.28),
      };
    });
    const dummy = new Object3D();
    c.tick((t) => {
      const time = t * c.idle;
      for (let i = 0; i < n; i++) {
        const f = flock[i]!;
        dummy.position.set(
          f.x + Math.sin(time * f.s + f.ph) * f.r,
          f.y + Math.sin(time * f.s * 1.7 + f.ph * 2) * f.ry,
          f.z + Math.cos(time * f.s * 0.8 + f.ph) * f.r,
        );
        dummy.rotation.set(time * f.s, time * f.s * 2, f.ph);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });
  },

  /**
   * Pale trunks in the wings, with a crown on each. A lakeside pavilion is in
   * a wood — and a wood is the leaves, not the poles.
   *
   * ## What six bare cylinders looked like
   *
   * This drew `CylinderGeometry(0.09, 0.13, h, 7)` six times and nothing else.
   * Measured in iskelmä/tanssilava: six poles in `tint(backdrop, 0.62)` =
   * **#cfd0d2**, heights 4.876–6.424 m, tops at 3.976 / 4.042 / 4.242 / 4.419 /
   * 4.453 / 5.524 m above the boards, and a ray fired straight up from every
   * one of those tops hit **nothing** until the sky dome at 83.2 m. Three of
   * the six clear the 4.40 m aperture outright, so they are inside the wide
   * shot rather than off in the wings, and the nearest object to any of them is
   * the upstage bunting run 1.89–3.58 m *downstage* — which is why the note
   * that got this changed said the flags looked like they were passing in front
   * of a row of masts. That is exactly what they were doing. A pale vertical
   * cylinder that stops in mid-air with nothing on top of it is a pipe, and six
   * of them in a row is a scaffold.
   *
   * The second half was underfoot. The deepest trunk stood at z = −6.174 while
   * `proscenium.ts` runs the house floor from `floorFrom = m.backZ − 2` =
   * −5.00, so one trunk in six had **no ground under it at all**: 1.174 m past
   * the upstage edge of the floor, with its foot 0.35 m in the air above the
   * lake plane at `houseY − 0.35`. The old z draw was `backZ − rng.float(0.5,
   * 4)`, whose bottom quarter is off the end of the world.
   *
   * ## The crown
   *
   * Three overlapping icosahedral masses per tree, one `InstancedMesh` of 18
   * for the six — the same shape `flowers`, `moths` and `backline` already use,
   * and the reason to instance is that these are the only 18 objects here that
   * are identical up to a matrix.
   *
   * The masses start at **0.72 h** and that number is doing one job: there must
   * be no slot of sky between bark and leaf. `CROWN[0]`'s centre sits exactly
   * one radius above 0.72 h, so its underside lands on 0.72 h and its top on
   * 0.72 h + 2 r = 0.72 h + 0.38 h — past the top of the trunk at h, by 0.10 h.
   * The trunk therefore dies *inside* the first mass rather than emerging from
   * it, which is the whole difference between a tree and a mast with a bush
   * balanced on it. All three masses also contain the trunk's own axis
   * (horizontal offsets 0.505 / 0.510 / 0.130 r against radii 1.00 / 0.86 /
   * 0.72 r), and each overlaps the next — centre spacing 1.187 r and 0.837 r
   * against radius sums of 1.86 r and 1.58 r.
   *
   * `r = 0.19 h` puts the whole tree at 1.267 h. Measured after the change, in
   * all three iskelmä dressings alike (the trees are placed off `width` and
   * `backZ`, and the eighties dressing only grows the room): crown undersides
   * at 2.735–2.948 m and crown tops at 5.497–5.873 m above the boards, so
   * **six crowns in six leave the top of the aperture** — 4.40 m in the
   * pavilion and the fallback, 4.664 in the eighties — where three trunks in
   * six used to stop inside it. A trunk seen through the opening now runs out
   * of frame instead of ending, which is the read the bare version could not
   * produce at any height.
   *
   * ## Where they stand
   *
   * x is solved from the crown rather than guessed: `width / 2 + CROWN_REACH ·
   * r + a gap`, where `CROWN_REACH` is the largest `|offset| + radius` over the
   * three masses and is invariant under the per-tree spin because it is taken
   * in the horizontal plane. So the *foliage*, not the trunk, is what clears
   * the deck, and by construction it clears it by at least the gap's 0.30 m;
   * measured, the nearest leaf to the deck edge stands 0.723 m off it and the
   * furthest 1.124 m. Trunks land 1.95–2.35 m outboard of the boards, against
   * 0.60–2.60 m before.
   *
   * z is `backZ − rng.float(0.5, 1.8)`, inboard of the ground's own edge at
   * `backZ − 2` with 0.2 m to spare, so every foot is on the floor: measured,
   * 0.507–1.212 m inboard, and each of the six now rests on exactly one
   * surface, the house floor plane at y = `houseY` spanning x ±11 and z −5.00
   * to 17.60. It is a narrower band than the old 0.5–4.0 and that is the point
   * — the ground behind this stage is 2 m deep and a tree cannot be planted
   * outside it.
   *
   * Nothing else is touched. Crown masses against every other object in the
   * three rooms, sphere-against-box: **zero** intersections, the bunting run
   * included — it ends at `openingWidth / 2 + 0.4`, which is `width / 2 + 0.1`
   * in this architecture, and the nearest leaf is 0.62 m outboard of that.
   *
   * ## The colour, and why it is a literal
   *
   * The bark stays `tint(backdrop, 0.62)`. The leaf is `blend(backdrop,
   * '#4c5a33', 0.7)` — L 0.070, which is 0.32 of the fog's 0.221 and 0.11 of
   * the bark's 0.630, so the crown is a dark mass against the night and the
   * trunk stays the pale thing a birch is.
   *
   * A palette rotation was tried first and is not usable here, for a measured
   * reason worth recording. Every one of these palettes is a near-neutral once
   * it has been blended toward the lamp colour, and hue is ill-conditioned on a
   * near-neutral: `hueShift(blend(backdrop, ambient, k), 96, …)` swings through
   * **10° / 71° / 101°** as k goes 0.06 → 0.08 → 0.10, so the same expression
   * gives red, olive and green on a two-hundredth of a blend. There is no green
   * in a room palette to rotate to, and a leaf colour that lands anywhere on
   * the wheel depending on the venue is worse than a stated one. `posters`
   * already carries a paper literal for the same kind of reason.
   *
   * ## The stream reshuffles
   *
   * Four draws per trunk now (h, gap, z, spin) where there were three (h, gap,
   * z), so `':prop:birch'` parts company with its old self after the first
   * trunk and **every tree moves**. That is fine here: nothing else reads this
   * stream, no other prop is placed against a birch, and the positions being
   * fixed was never a property anything depended on.
   */
  birch: (c) => {
    const rng = c.rng('birch');
    /**
     * Three masses, in crown radii: horizontal offset, height above 0.72 h,
     * and radius. Deliberately lopsided — three concentric spheres are a
     * snowman, and a birch crown is heavier on one side than the other.
     */
    const CROWN = [
      { x: -0.42, y: 1.00, z: 0.28, r: 1.00 },
      { x: 0.46, y: 1.62, z: -0.22, r: 0.86 },
      { x: -0.12, y: 2.16, z: 0.05, r: 0.72 },
    ] as const;
    /** How far leaf reaches from the trunk, in radii. 1.505, spin-invariant. */
    const CROWN_REACH = Math.max(...CROWN.map((b) => Math.hypot(b.x, b.z) + b.r));

    const bark = c.kit.solid(tint(c.p.backdrop, 0.62), { rough: 0.95 });
    // Faceted on purpose. An 80-face icosahedron under flat shading gives each
    // clump a dozen values off one light, which is the curved-surface version
    // of what `cellPlane` does for the walls and floors — variation without a
    // texture, and the alternative is three smooth balloons.
    const crowns = new InstancedMesh(
      c.kit.geometry('birch-crown', () => new IcosahedronGeometry(1, 1)),
      c.kit.solid(blend(c.p.backdrop, '#4c5a33', 0.7), { rough: 0.95, flat: true }),
      6 * CROWN.length,
    );
    const dummy = new Object3D();
    let mass = 0;
    for (let i = 0; i < 6; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const h = rng.float(4.5, 6.5);
      const r = h * 0.19;
      const x = side * (c.m.width / 2 + CROWN_REACH * r + rng.float(0.3, 1.5));
      const z = c.m.backZ - rng.float(0.5, 1.8);
      const spin = rng.float(0, Math.PI * 2);
      put(c, c.kit.geometry(`trunk|${h.toFixed(2)}`,
        () => new CylinderGeometry(0.09, 0.13, h, 7)),
        bark, x, c.m.houseY + h / 2, z);
      const cos = Math.cos(spin);
      const sin = Math.sin(spin);
      for (const b of CROWN) {
        dummy.position.set(
          x + (b.x * cos - b.z * sin) * r,
          c.m.houseY + h * 0.72 + b.y * r,
          z + (b.x * sin + b.z * cos) * r,
        );
        dummy.rotation.set(0, spin, 0);
        dummy.scale.setScalar(b.r * r);
        dummy.updateMatrix();
        crowns.setMatrixAt(mass++, dummy.matrix);
      }
    }
    c.root.add(crowns);
  },

  /**
   * Water beyond the pavilion. No moon on it, because there is no moon.
   *
   * ## The road
   *
   * This drew a second plane over the lake — `PlaneGeometry(1.6, 26)`, an
   * unlit `MeshBasicMaterial` in `tint(ambient, 0.75)` = **#fff6ec** at opacity
   * 0.35, lying at `houseY − 0.33` across z −38 to −12 — and called it the moon
   * on the water. Measured, that colour is L 0.932 against the water's 0.169, a
   * ratio of **5.53 : 1**; carried through the 0.35 alpha and the fog at the
   * distance a wide shot stands, its near end still steps **2.16 : 1** off the
   * water it lies on, and it is the only mark of any contrast at all on 5400 m²
   * of lake. It has a hard rectangular boundary and constant alpha everywhere
   * inside it, which no specular streak has; it is pinned in world space at
   * x = 0.8 and only breathes ±0.35 m, so it cannot track the viewer, which is
   * the one thing a specular streak must do; and **there is no moon anywhere in
   * this renderer** — the sky dome is a two-colour gradient and the word appears
   * in exactly one place, which was the line above this one. Fog does not rescue
   * it either: `fogNear` is 12.8 m and `fogFar` 72.4 m, and the wide shot stands
   * 26 m off the near end of the streak, so its first third renders 78 % its own
   * colour. A bright hard-edged rectangle lying flat on a tan plane is a road,
   * and that is what it was reported as.
   *
   * ## The compounding cause was the water
   *
   * The albedo was `shade(blend(backdrop, ambient, 0.5), 0.55)` = **#836f56**,
   * and the scene's fog colour is `shade(blend(ambient, backdrop, 0.55), 0.35)`
   * = **#947e63**. Per channel the water is 0.766 / 0.762 / 0.746 of the fog —
   * the same chromaticity to within a percent, at 0.76 of the value. That has a
   * consequence you can measure: fogged along its own 60 m, from the shore at
   * 19 m out to the far edge at 79 m, the whole lake rendered across a range of
   * **1.27 : 1**. Sixty metres of receding surface that never changes value does
   * not recede — a surface painted the colour of the air it recedes into cannot
   * read as anything but ground, so the lake was a tan plain, and the eye then
   * named the one high-contrast mark on it. `metal: 0.35` finished the job: that
   * lifts `envMapIntensity` to 1.7 (see `Kit.solid`), and one environment wash
   * over one constant normal is a flat painted surface however you colour it.
   *
   * ## What not to do about it
   *
   * Additive blending with a vertex ramp was proposed and measured wrong,
   * recorded here so it is not proposed twice. `Kit.basic` defaults `fog: true`
   * and three.js applies fog *before* the blend, so the "black" border of a
   * ramped streak emits `fogFactor × fogColour` and additive blending then adds
   * that on top of the water: a hard-edged 1.6 × 26 m rectangle of uniform
   * lift, brightest exactly where the streak was supposed to vanish, measured
   * at +0.00958 linear at the far end.
   *
   * ## So the streak is gone
   *
   * A highlight with no light source behind it is a fiction, and no amount of
   * shaping makes a fiction read. The prop's job is to make the water read as
   * water, and water is dark. Three changes, all of them to the plane that was
   * already there:
   *
   * **Colour.** `shade(tint(backdrop, 0.06), 0.5)` = #353944 / #33353c, L
   * **0.041** where it was 0.169 — 0.185 of the fog's 0.221 where it was 0.763.
   * And it is a different hue rather than a darker one: the fog is red-dominant
   * at r/b 2.37, the water is now blue-dominant at b/r 1.62. The 6 % lift
   * toward white is not decoration and is the reason this is not simply
   * `shade(backdrop, 0.5)` — that alone is L 0.0116, four counts of blue and a
   * hole in the frame. The lift supplies 0.029 of the 0.041, which is the
   * skyglow a lake picks up on a July night and the whole of why it is visible.
   *
   * **Cells.** A hemisphere lights a flat plane to one number, so 5400 m² of
   * constant normal returns one value however well that value is chosen — the
   * argument `low-ceiling` makes at length, and the ceiling is a smaller plane
   * than this one. `cellPlane` at 3 m and jitter 0.12 breaks it into patches
   * the way a light air breaks a lake, using the machinery the boards, the
   * brick and the house floor already use. It does not vary the normal, so the
   * specular is still one wash; what it fixes is the diffuse, which at metal 0
   * is nearly all of it.
   *
   * **Metal 0, roughness 0.6.** Dropping the metalness takes `envMapIntensity`
   * back to 1 and hands the surface back to its albedo. The broad lobe left is
   * the only sheen the prop keeps, and it is soft-edged, low-contrast and dimmer
   * than the sky it reflects — which is the test the streak failed.
   *
   * ## What it measures now
   *
   * Water against fog goes 0.763 → **0.185** in the pavilion, 0.766 → 0.174 in
   * the eighties, 0.761 → 0.188 in the fallback.
   *
   * Fogged along its own length, the lake renders 0.060 at the shore and 0.221
   * at the far edge, a spread of **3.68 : 1** against the old 1.27 : 1. That is
   * the whole point of the darker albedo: the fog now has something to do, so
   * the surface goes away from you instead of standing there.
   *
   * The highest-contrast mark *on* the water goes 2.16 : 1 → **1.27 : 1**, which
   * is one cell of `cellPlane` against its neighbour at the jitter's extreme —
   * a 3 m patch seen from 19–79 m, not a 1.6 × 26 m rectangle with a ruled edge.
   *
   * At the shore the step is 1.95 : 1 in the pavilion, 1.44 in the eighties and
   * 1.68 in the fallback, against 1.48 / 1.97 / 1.68 before — no larger, and
   * that is not the interesting part. The *sign* flipped. The old water was
   * brighter than the ground beside it in all three dressings; it is darker than
   * the ground in all three now, which is the way round a lake at midnight is.
   *
   * One edge in the landscape is higher than any of these and it is not this
   * prop's: the far waterline, where the fully-fogged lake meets the sky dome's
   * horizon band, at 3.23 : 1. It measures the same before and after — the far
   * edge of the lake is 79 m out and saturates the fog either way — and a
   * horizon is the one place in a picture where a hard bright edge is what the
   * eye is expecting.
   *
   * The plane's size and position are untouched, deliberately. Its near edge is
   * `backZ − 32 + 30` = `backZ − 2`, which is `floorFrom` in `proscenium.ts`
   * to the metre — two expressions in two files agreeing that the shore is
   * where the ground stops. Moving or resizing this plane opens a strip of
   * nothing between the two.
   */
  lake: (c) => {
    const plane = put(c, c.kit.own(cellPlane({
      width: 90, height: 60, cols: 30, rows: 20,
      colour: shade(tint(c.p.backdrop, 0.06), 0.5),
      jitter: 0.12, rng: c.rng('lake'),
    })), c.kit.solid('#ffffff', { vertexColors: true, rough: 0.6 }),
    0, c.m.houseY - 0.35, c.m.backZ - 32);
    plane.rotation.x = -Math.PI / 2;
  },

  flowers: (c) => {
    const rng = c.rng('flowers');
    const n = 9;
    const pots = new InstancedMesh(
      c.kit.geometry('pot', () => new CylinderGeometry(0.13, 0.1, 0.22, 8)),
      c.kit.solid(shade(c.p.boards, 0.25)), n,
    );
    const blooms = new InstancedMesh(
      c.kit.geometry('bloom', () => new IcosahedronGeometry(0.13, 0)),
      c.kit.solid('#ffffff', { rough: 0.7 }), n,
    );
    const dummy = new Object3D();
    const tone = new Color();
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * (c.m.width / n);
      // Downstage of the tabs by the same 0.27 m they always had: the pots are
      // 0.26 m across and the closed cloth's own fold depth reaches 0.13 m
      // upstage of them, so this is a 9 mm gap and it has to move when the
      // curtain line does. It just did — see `CURTAIN_FROM_LIP`.
      dummy.position.set(x, 0.11, c.m.curtainZ + 0.27);
      dummy.rotation.set(0, rng.float(0, 3), 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      pots.setMatrixAt(i, dummy.matrix);
      dummy.position.y = 0.32;
      dummy.scale.set(1, 0.8, 1);
      dummy.updateMatrix();
      blooms.setMatrixAt(i, dummy.matrix);
      blooms.setColorAt(i, tone.set(hueShift(c.accent, rng.float(-60, 60), 0.25)));
    }
    if (blooms.instanceColor) blooms.instanceColor.needsUpdate = true;
    c.root.add(pots);
    c.root.add(blooms);
  },

  /** A rail along the front of the boards, as an open-air stage has. */
  railing: (c) => {
    const wood = shade(c.p.boards, 0.15);
    const mat = c.kit.solid(wood);
    const w = c.m.width - 0.4;
    const z = c.m.lipZ - 0.12;
    for (const y of [0.95, 0.62]) {
      put(c, c.kit.bevelBox(w, 0.09, 0.09, 0.03), mat, 0, y, z, true);
    }
    const n = Math.max(4, Math.round(w / 1.3));
    const posts = new InstancedMesh(c.kit.bevelBox(0.1, 0.95, 0.1, 0.03), mat, n);
    const dummy = new Object3D();
    for (let i = 0; i < n; i++) {
      dummy.position.set((i - (n - 1) / 2) * (w / (n - 1)), 0.48, z);
      dummy.updateMatrix();
      posts.setMatrixAt(i, dummy.matrix);
    }
    posts.castShadow = true;
    c.root.add(posts);
  },

  /** Parquet in the house, in front of the stage. Somebody has to dance. */
  'dance-floor': (c) => {
    const rng = c.rng('parquet');
    const geo = c.kit.own(cellPlane({
      width: c.m.houseWidth * 0.7, height: 5.5, cols: 16, rows: 8,
      colour: tint(c.p.boards, 0.15), jitter: 0.13, rng,
    }));
    const floor = put(c, geo, c.kit.solid('#ffffff', { vertexColors: true, rough: 0.55 }),
      0, c.m.houseY + 0.02, c.m.lipZ + 3.2, true);
    floor.rotation.x = -Math.PI / 2;
  },

  /**
   * Slowly turning, faceted, and entirely an era signal — on a rod as long as
   * the room needs rather than a rod of one length.
   *
   * The builder used to have exactly one height in it and it was the wrong
   * quantity: the ball at `openingHeight * 0.82` and a fixed 0.6 m rod above
   * it, so the tip landed at a hard `0.82 h + 0.8` and nothing here ever read
   * `headroom`, `houseLid` or `flyY`. `0.82 h + 0.8 = h` has one root,
   * `h = 0.8 / 0.18 = 4.444`, so the rod met the top of a 4.44 m aperture and
   * missed everywhere else — and the top of the aperture is not a surface at
   * this z anyway, the arch standing 1.7 m downstage of the ball.
   *
   * Measured against the lid each room actually publishes: 0.51 m short in the
   * hall, 0.51 in every salon era, 1.26 below the ballroom's own grid batten,
   * and 2.5 m of open air above it in a circuit. The shed is the tell that this
   * is one bug rather than several — it is the only room where
   * `headroom == openingHeight`, so it is the only one where the 4.44 m root
   * nearly holds, and its rod stops 0.058 m short, which is the only reason the
   * float scan did not report it.
   *
   * So the rod is solved as a drop from the thing it is fixed to, the shape
   * `chandelier` and `truss` already use: the plaster over the boards, or the
   * grid `truss` reaches for where there is none. `hang - 0.8` is today's 0.6 m
   * rod kept as a floor, so no room gets a stubbier one than it has now, and
   * the `min` only bites in the dancehall — the ball's centre does not move by
   * a millimetre in the other eight architectures, which is what keeps every
   * clearance another file solved against it (ballroom's `FLY_TRIM`, hall's
   * `BRIDGE_FROM_CURTAIN`, shed's fly-bar z, lawn's `BAR_UPSTAGE`) exactly as
   * measured.
   *
   * And where it bites, it bites the whole prop. Below the 4.44 m root the old
   * arithmetic ran the rod *into* the ceiling and dragged the ball down with
   * it: in a 2.85 m dancehall the ball occupied 2.00–2.68 m dead centre over
   * the playing area — 0.65 m below `HANG_FLOOR`, chin-to-crown height, in
   * front of the band rather than above the top of the frame. A room that
   * cannot hang a 0.68 m sphere clear of everybody does not get one. Skipping
   * is the answer rather than shrinking it (half the radius still leaves the
   * bottom at 2.16 m) or moving it out over the dance floor (`ballroom.ts`
   * hangs it over the *stage* on purpose, and that is not this builder's
   * decision to reverse). The guard draws it iff `hang >= 0.8 + 0.34 +
   * HANG_FLOOR` = 3.79 m, which every reachable venue clears except the
   * dancehall and a cellar-height shed or circuit.
   *
   * ## And `openingHeight + 1.2` is one room's object, not three branches' worth
   *
   * The paragraph above was right that the rod must be solved as a drop and
   * wrong about how many things it can be dropped from. `openingHeight + 1.2`
   * is a **grid batten `ballroom.ts` builds**, and nowhere else — so the same
   * expression that lands 0.02 m off the timber in a ballroom reached for
   * nothing at all in the two rooms that publish no lid and no house lid
   * either. Measured, at the top of the rod: **1.550 m of open sky** above the
   * tip in `iskelma/eighties`, whose pavilion has one pipe in it at 4.314 and a
   * ball hung a metre and a half over it; **2.630 m** in `rock/beat`, where the
   * circuit's own roof steel is at 8.580 and the rod stopped at 6.700 between
   * the two. So the branch splits the way `truss` splits, and for the same
   * reason: under a lid the surface, in a stage house the grid, under open sky
   * the one thing the room does publish — `flyY`, which `RoomRig.flyBar`
   * *requires* to be a real object.
   *
   * Under a lid it is `deck()` rather than `headroom`, which is what closes the
   * salon: its ceiling is coffered, `headroom` is the rib soffit, no rib is over
   * the centre line, and the rod ended 0.160 m under the panel it is screwed to
   * in both eras that hang one. Now 0.000.
   *
   * **The ball itself does not move by a millimetre anywhere.** `y` is
   * `min(openingHeight * 0.82, hang - 0.8)` and the first term wins in every
   * venue that keeps its old `hang`; only the rod's length changes. The two
   * rooms that change branch are the two where the ball *should* move, because
   * it was hung off a height with nothing at it.
   *
   * Three residuals, named here rather than left to be re-found. All three are
   * the same residual — the rod is vertical, and the thing overhead is a *pipe*
   * with a z of its own that this file cannot see:
   *   - ballroom, variety, theatre: the tip lands level with the grid batten and
   *     0.02 m downstage of its face — the ball is at `lipZ - 1.4` and the
   *     batten at `curtainZ - 1.1`, which are 0.04 m apart on every stage this
   *     builds, less the rod's own 0.02 m radius.
   *   - shed and warehouse: `rigLid` is stated **at the pick**, `±(width / 2 -
   *     0.4)`, and this ball is on the centre line of a 9° pitch, so the deck
   *     over it is higher again — 0.830 m higher, measured. The rod is 0.470 m
   *     longer than it was and still short, and it cannot be made right from
   *     here: what would fix it is a number for the ridge, which is the room's
   *     to publish and not this field's to be stretched into.
   *   - pavilion and circuit: the tip is now at bar height and the bar is 0.08 m
   *     and 0.95 m upstage of it. The pavilion's is within a handspan; the
   *     circuit's is where it is because `circuit.ts` stands its bar well
   *     upstage, and `shed.ts` says in as many words that it moved its own bar
   *     "0.8 m clear of the `mirror-ball`" on purpose. A room that has decided
   *     not to have a ball threaded onto its pipe is not a room this prop should
   *     be dragging its ball onto.
   *
   * ## The third residual was the third branch, and `flyY` is a height
   *
   * The bullet above is a correct description of a rod ending in mid-air, filed
   * as a near miss. It is not a near miss. Measured, tip against bar: the
   * pavilion's rod stops at (0, 4.314, 1.752) and its bar is a 0.09 m pipe from
   * z 1.555 to 1.645 — **0.089 m** of daylight, in z, at the same height; the
   * circuit's stops at (0, 4.070, 1.852) against a bar at z 0.795 to 0.905 —
   * **0.929 m**. The ball is not on the pipe in either room and the arithmetic
   * cannot put it there, because `flyY` is a *height* and the bar's z is not
   * published. `swag`'s docstring measured that and wrote the rule down: the bar
   * sits at `curtainZ − 1.1` in the pavilion, the courtyard and the salon and at
   * `curtainZ − 0.35` on the lawn, "so a builder that solved for the bar's z
   * would be right in three rooms and wrong in the fourth, and wrong invisibly."
   * This branch was that builder, one storey up and with a 0.68 m sphere on it.
   *
   * So the rung is `rigLid` instead, which is the field for exactly this
   * question — "y of the continuous surface a hanger over the **boards** can be
   * shackled to, or `Infinity` where there is none" — and which reaches the same
   * places `deck()` reaches, one branch down, in a room whose `headroom` is
   * honestly infinite because there is nothing in a lens's way. Four rungs now,
   * each of them a published surface: the lid's own deck, the roof over an open
   * stage, the stage house's grid, and nothing.
   *
   * **Nothing means no ball**, the way this builder already stands down in a room
   * too low to hang one clear of everybody, and `beams` in a barn that has been
   * boarded over. It costs two dressings today and they are the two the section
   * above was wrong about:
   *
   *   - `rock/beat`, the circuit, is a room that *has* the surface and declines
   *     to say so. It models its roof as a deck plane at **8.580** spanning the
   *     whole hall, with the fly bar's own four hangers running from 4.125 up to
   *     it, and answers `Infinity` for all three lids — deliberately, and
   *     `circuit.ts` argues it: publishing the steel would hand `truss` five
   *     metres of motor stub over a lattice that is meant to read as a rig, and
   *     an open-sky truss stands on its own legs instead. That argument is about
   *     `truss` and it decides this too, because there is one field. So there is
   *     no ball in an arena, and the residual worth writing down is that
   *     `rigLid` is being asked two questions by two props — *what may a drop end
   *     on* and *how far up should a drop go* — which have the same answer in
   *     nine rooms and different answers here. A `RoomShape` that wanted to serve
   *     both would need the second one separately; nothing in this file can
   *     invent it.
   *   - `iskelma/eighties`, the pavilion, has no roof at all and is right to
   *     answer `Infinity` three times. An open-air stage with one lighting pipe
   *     over it has nowhere to shackle this, and the pipe is 0.089 m away in a
   *     direction the prop cannot see. Getting the ball back is a room-side
   *     answer too — either something over the boards, or a `RoomShape` field
   *     for the bar's *z* to go with its height — and not a rod stretched until
   *     it touches.
   */
  'mirror-ball': (c) => {
    /**
     * What the rod is fixed to: the surface behind the lid, the roof over an
     * open stage, the stage house's grid — or nothing, and then no ball.
     */
    const hang = Number.isFinite(c.m.headroom) ? deck(c.m, c.m.headroom)
      : Number.isFinite(c.m.rigLid) ? c.m.rigLid
        : Number.isFinite(houseLid(c.m)) ? c.m.openingHeight + 1.2
          : Infinity;
    if (!Number.isFinite(hang)) return;
    const y = Math.min(c.m.openingHeight * 0.82, hang - 0.8);
    if (y - 0.34 < HANG_FLOOR) return;
    const ball = new Mesh(
      c.kit.geometry('ball', () => new IcosahedronGeometry(0.34, 1)),
      c.kit.solid(tint(c.p.ambient, 0.8), { metal: 0.95, rough: 0.14, flat: true }),
    );
    const node = new Group();
    node.position.set(0, y, c.m.lipZ - 1.4);
    node.add(ball);
    // 0.2 keeps the foot buried in the ball, as it always was. Keyed by length
    // because this is a per-room geometry now: one ball is built per stage so a
    // fixed key cannot alias today, but `Kit` is shared with the rooms and
    // every other variable-length geometry in this file keys by size.
    const drop = hang - y - 0.2;
    const rod = new Mesh(
      c.kit.geometry(`ballrod|${drop.toFixed(2)}`, () => new CylinderGeometry(0.02, 0.02, drop, 5)),
      c.kit.solid(shade(c.p.proscenium, 0.6)),
    );
    rod.position.y = 0.2 + drop / 2;
    node.add(rod);
    c.root.add(node);
    c.tick((t, dt) => { ball.rotation.y += dt * 0.35 * c.idle; void t; });
  },

  /**
   * The one piece of grandeur a gilt room has — hung off something, and hung
   * off the centre line.
   *
   * There used to be one of these, a bare brass ring with eight bulbs on it,
   * parked at 2.5 m over the middle of the house. Three things were wrong with
   * that and they compound.
   *
   * It had **no stem**. The mirror ball got a rod and the paper lanterns got a
   * cord; this one hung on nothing, in a house that also had no ceiling to hang
   * it from, and a lit ring seen edge-on with nothing above it does not read as
   * a light fitting. It reads as a small balcony floating in the room.
   *
   * It was at **camera height**. The wide shot works between **2.1** and 3.6 m —
   * `wideEye` starts at 2.3, not 2.1, which `stage-kit.ts` states correctly two
   * files over — and
   * the ring sat at 2.5 m, dead ahead — an object in the lens's own volume,
   * in front of the band, in a band of heights the framing solver sweeps
   * through as the window's aspect changes. That is the "it looks different on
   * different screens" of it: nothing about the fitting changed, only whether
   * the frame happened to contain it.
   *
   * And in the swing-era cellar it was above the room's **own ceiling** — 2.5 m
   * against a lid at 2.0 m — so the one venue that always emits it hung it
   * outside the building.
   *
   * All three answers are the same answer: hang it from the ceiling, and hang
   * it high enough that the lens passes *underneath* it. That last part is the
   * one that actually holds, and it holds for a reason worth stating plainly —
   * everything on the stage projects below the horizon of a camera looking
   * slightly down at it, so anything kept above that horizon cannot cross a
   * player no matter where the camera stands or what shape the window is. The
   * band of height between `headroom` and `headroom - LENS_GAP` is the only
   * place in the house where that is true, which is why the fitting below is
   * built downward from the ceiling to fit inside it rather than hung at a
   * height that looked about right. Reading the depth of that band from the
   * constant rather than baking it in is what let the camera drop 0.3 m later
   * without this having to be re-measured.
   *
   * With no lid at all it goes up to the fly height instead — roof beams, over
   * a dance floor, which is where a tanssilava would have put one — with a stem
   * that says what it is fixed to.
   *
   * ## The one room where the lid and the ceiling were not the same height
   *
   * `houseLid` is a *clearance* plane, and in nine of the ten venues that hang
   * one of these it is also the plaster: a ray straight up from the top of the
   * stem hits the ceiling at 0.000 m in the jazz cellar, all three sabhas, the
   * courtyard, all three concert halls and the variety house. In the salon it
   * hit at **0.160 m**, every time, in the era that hangs one — that room's
   * ceiling is coffered, `houseLid` is the underside of the *ribs*, the ribs are
   * on the bay module and the two fittings sit at `±houseWidth * 0.17` where
   * there is no rib. So the stem was screwed to the height of a moulding that
   * is somewhere else, with a panel a coffer's depth above it. `deck()` is the
   * panel, and it is the same fix and the same 0.160 m as `truss` and
   * `mirror-ball` take one storey down. Now 0.000 in ten of ten.
   *
   * And a pair, off to either side. Two lamps near the edges of the frame are a
   * room with lighting in it; one lamp on the centre line is an obstacle.
   */
  chandelier: (c) => {
    const n = 8;
    const brass = tint(hueShift(c.p.proscenium, 30, 0.15), 0.25);
    /** The ceiling if there is one; the fly height if the sky is open. */
    // The ceiling if there is one; the fly height if the sky is open — which is
    // what the line above has always said and what `Math.min(lid, flyY)` only
    // accidentally did. It stopped being accidental when the cellar's bar came
    // down under its soffit: the lower of the two is now the *pipe over the
    // stage*, and a chandelier hung at that height over the crowd is a lamp
    // floating half a metre below the plaster it is supposed to be screwed to.
    const lid = houseLid(c.m);
    const hang = Number.isFinite(lid) ? deck(c.m, lid) : c.m.flyY;
    const stem = 0.08;
    const bulbDrop = 0.07;
    const bulbR = 0.05 * 1.2;
    /** Everything hangs above this, and `LENS_GAP` is why. */
    const clear = hang - LENS_GAP;
    const ringGeo = c.kit.geometry('chand-ring', () => new TorusGeometry(0.42, 0.04, 5, 16));
    const stemGeo = c.kit.geometry('chand-stem', () => new CylinderGeometry(0.022, 0.022, stem, 6));
    const metal = c.kit.solid(brass, { metal: 0.7, rough: 0.35 });
    const bulbGeo = c.kit.geometry('bulb', () => new IcosahedronGeometry(0.05, 0));
    const bulbMat = c.kit.basic(tint(c.p.ambient, 0.6));

    for (const side of [-1, 1]) {
      const node = new Group();
      node.position.set(
        side * c.m.houseWidth * 0.17,
        Math.max(hang - stem, clear + bulbDrop + bulbR),
        c.m.lipZ + c.m.houseDepth * 0.3,
      );
      const ring = new Mesh(ringGeo, metal);
      ring.rotation.x = Math.PI / 2;
      node.add(ring);
      const drop = new Mesh(stemGeo, metal);
      drop.position.y = stem / 2;
      node.add(drop);
      // Below the ring, which is where a bulb goes and is also the half of the
      // 0.3 m that is left once the stem has spent the other half.
      const bulbs = new InstancedMesh(bulbGeo, bulbMat, n);
      const dummy = new Object3D();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        dummy.position.set(Math.cos(a) * 0.42, -bulbDrop, Math.sin(a) * 0.42);
        dummy.scale.setScalar(1.2);
        dummy.updateMatrix();
        bulbs.setMatrixAt(i, dummy.matrix);
      }
      node.add(bulbs);
      c.root.add(node);
    }
  },

  // -- the club ------------------------------------------------------------

  /**
   * Small round tables among the crowd, which is what makes it a club.
   *
   * The layout is published on `Ctx` because `candles` needs it and had been
   * *reproducing* it: the same `±rng.float(1.2, houseWidth * 0.4)` and the same
   * `lipZ + 1.9 + row * 1.9` written out a second time, off a second stream.
   * See `BUILDERS.candles` for the three ways that came apart.
   *
   * ## The rows ran off the back of the room and into the counter
   *
   * `lipZ + 1.9 + row * 1.9` is a pitch with no end on it. Four rows of eight
   * reach `lipZ + 7.8`, and a 0.68 m top puts the last of them at `lipZ + 8.14`
   * — which is inside the house in the deep rooms and outside the *furniture* in
   * the shallow ones. Measured in all four jazz cellars, whose 8.3 m house is the
   * shallowest that dresses both this and a bar: the counter's front face is at
   * `lipZ + 7.15`, so the fourth row's two tables stood **0.05 m inside it**,
   * 0.0087 m³ of tabletop plate buried in a bar, in every era. `country/outlaw`
   * is the near miss that says this is a rule and not one seed's bad luck — its
   * counter front is at `lipZ + 7.85` against the same `lipZ + 8.14` of reach,
   * and it clears only because that draw's jitter went the other way.
   *
   * So a table stops where the bar starts, off `barFootprint` — the counter's
   * front face, less the top's own radius and 0.03 m of daylight. It is a clamp
   * rather than a re-layout because the pitch is right and only its end was
   * missing: in the cellar it pulls two tables from `lipZ + 7.75` to
   * `lipZ + 6.75`, which lands them 0.98 m behind row two and leaves a 0.35 m
   * gangway behind them, and it is inert in the other ten venues that dress both.
   * `candles` reads these spots, so the tealights come with them.
   */
  tables: (c) => {
    const rng = c.rng('tables');
    const n = c.quality === 'low' ? 4 : 8;
    const tops = new InstancedMesh(
      c.kit.geometry('tabletop', () => new CylinderGeometry(0.34, 0.34, 0.05, 12)),
      c.kit.solid(shade(c.p.boards, 0.4), { rough: 0.5 }), n,
    );
    const stems = new InstancedMesh(
      c.kit.geometry('tablestem', () => new CylinderGeometry(0.05, 0.14, 0.72, 8)),
      c.kit.solid(shade(c.p.proscenium, 0.6)), n,
    );
    const dummy = new Object3D();
    const spots: { x: number; z: number }[] = [];
    /** The deepest a 0.34 m top may stand. See the docstring. */
    const counter = c.dressed.has('bar') ? barFootprint(c.m) : undefined;
    const back = counter ? counter.z - counter.d / 2 - 0.34 - 0.03 : Infinity;
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / 2);
      spots.push({
        x: (i % 2 === 0 ? -1 : 1) * rng.float(1.2, c.m.houseWidth * 0.4),
        z: Math.min(back, c.m.lipZ + 1.9 + row * 1.9 + rng.float(-0.2, 0.2)),
      });
    }
    for (let i = 0; i < n; i++) {
      const s = spots[i]!;
      dummy.position.set(s.x, c.m.houseY + 0.74, s.z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      tops.setMatrixAt(i, dummy.matrix);
      dummy.position.y = c.m.houseY + 0.36;
      dummy.updateMatrix();
      stems.setMatrixAt(i, dummy.matrix);
    }
    c.root.add(tops);
    c.root.add(stems);
    c.tables = spots;
  },

  /**
   * Tealights. Unlit material, and the flame flickers on its own scale.
   *
   * `venue.ts` defines this as "one per table", and it was one per nothing.
   * This builder used to reproduce `BUILDERS.tables`' arithmetic verbatim —
   * same `±rng.float(1.2, houseWidth * 0.4)`, same `lipZ + 1.9 + row * 1.9` —
   * and land nowhere near a table, for three independent reasons, any one of
   * which alone would have been fatal:
   *
   * 1. **A different seed.** `':prop:tables'` and `':prop:candles'` are
   *    unrelated sequences.
   * 2. **A different draw arity.** Even on one seed they part after the first
   *    item: a table draws two floats, a candle drew four.
   * 3. **A different count.** 8 tables against 10 candles, so `floor(i / 2)`
   *    gave the candles a fifth row where the tables had four — 1.9 m
   *    downstage of the last table and, in a jazz cellar, behind the bar.
   *
   * The y is what proves the x and z had drifted rather than the height: the
   * tabletop's surface is `houseY + 0.765` and the wax's base is `houseY +
   * 0.765`, flush to the millimetre. That is the 0.74–0.77 m gap the float scan
   * kept reporting — a candle sitting on the exact plane a tabletop would
   * occupy, with the tabletop somewhere else in the room. Asked directly, eight
   * of ten touched nothing in jazz/swingera and ten of ten in rnb/neo.
   *
   * So it reads the layout instead, as `showRiser` already reads `Ctx.riser`,
   * and the count follows from it — which fixes the fifth row for free. Four
   * venues ask for candles with no tables at all (a riihi, a sabha, a
   * courtyard, a sabha again); there the scatter stays and the tealight goes on
   * the floor, half its own height above it, rather than at the height of a
   * table that is not there.
   */
  candles: (c) => {
    const rng = c.rng('candles');
    const on = c.tables;
    const n = on ? on.length : (c.quality === 'low' ? 5 : 10);
    const wax = new InstancedMesh(
      c.kit.geometry('wax', () => new CylinderGeometry(0.035, 0.04, 0.11, 6)),
      c.kit.solid(tint(c.p.boards, 0.55)), n,
    );
    const flames = new InstancedMesh(
      c.kit.geometry('flame', () => new ConeGeometry(0.026, 0.09, 5)),
      c.kit.basic(tint(hueShift(c.p.ambient, 25, 0.4), 0.5)), n,
    );
    flames.frustumCulled = false;
    const spots: { x: number; y: number; z: number; ph: number; r: number }[] = [];
    for (let i = 0; i < n; i++) {
      const spot = on?.[i];
      const row = Math.floor(i / 2);
      spots.push({
        // On a table: 0.74 + 0.05 / 2 + 0.11 / 2 = 0.82 was always the
        // tabletop's answer, so the height is unchanged and only the x and z
        // stop being invented. On bare floor: half the wax, and no more.
        x: spot ? spot.x : (i % 2 === 0 ? -1 : 1) * rng.float(1.2, c.m.houseWidth * 0.4),
        y: c.m.houseY + (spot ? 0.82 : 0.055),
        z: spot ? spot.z : c.m.lipZ + 1.9 + row * 1.9 + rng.float(-0.2, 0.2),
        ph: rng.float(0, 6.28),
        r: rng.float(5, 11),
      });
    }
    const dummy = new Object3D();
    for (let i = 0; i < n; i++) {
      const s = spots[i]!;
      dummy.position.set(s.x, s.y, s.z);
      dummy.updateMatrix();
      wax.setMatrixAt(i, dummy.matrix);
    }
    c.root.add(wax);
    c.root.add(flames);
    c.tick((t) => {
      for (let i = 0; i < n; i++) {
        const s = spots[i]!;
        const f = 0.75 + 0.25 * Math.sin(t * s.r + s.ph) * c.idle;
        dummy.position.set(s.x, s.y + 0.09, s.z);
        dummy.scale.set(1, f, 1);
        dummy.rotation.set(0, 0, Math.sin(t * s.r * 0.5 + s.ph) * 0.12 * c.idle);
        dummy.updateMatrix();
        flames.setMatrixAt(i, dummy.matrix);
      }
      flames.instanceMatrix.needsUpdate = true;
    });
  },

  /**
   * The ceiling is what makes a basement a basement.
   *
   * Height is `LOW_CEILING`, in `stage-kit.ts`, because the camera has to know
   * it too — read that constant for why it went up by 0.4 m and what was wrong
   * before. Two smaller things were also wrong here, and both are the same
   * mistake in different clothing: this was a plane rather than a surface.
   *
   * `DoubleSide` rather than `BackSide`. A one-sided lid does not fail by
   * blocking the view when you get above it, which would at least be legible —
   * it fails by *vanishing*, leaving its own edge and its pipes drawn across
   * whatever is behind them. The camera is held under it now, so this should
   * never be seen from above; it is here so that the frame in which some future
   * shot gets it wrong looks like a mistake instead of like a glitch.
   *
   * And it runs past the back of the house rather than stopping level with the
   * last row, so it meets the wall `stage.ts` puts there. A ceiling with an
   * edge in mid-air is the thing that read as a plane through the crowd; a
   * ceiling that dies into brick is a room.
   *
   * The third thing was that it came out **black**, and the fix is a colour
   * rather than a light, which took one wrong attempt to see.
   *
   * A ceiling is the worst-lit orientation in the room and there is no fixing
   * that: every lantern in `lights.ts` is above it pointing down, so the only
   * thing that reaches a down-facing normal is a hemisphere's *ground* colour —
   * `washHemi`'s is the cue colour at 0.28, and that is the whole budget. What
   * made it black was spending that budget on the darkest albedo in the room.
   * This was `shade(backdrop, 0.55)`, darker than the house walls beside it at
   * `shade(backdrop, 0.32)`, so the surface with the least light on it also had
   * the least to give back: 0.18 of a light on 0.45 of a dark brown is five
   * counts out of 255, which is a hole in the top of the frame.
   *
   * The wrong fix was emissive — a tenth of the lamp colour baked into the
   * plaster. It reads fine in one frame and is broken in every other: emissive
   * is not light, so it does not go out in a blackout, does not take the cue's
   * colour, and adds *on top of* a lit room instead of inside it. A ceiling
   * glowing over a dark stage is worse than a black one, because a black
   * ceiling is at least what a room with the lights off looks like.
   *
   * So: **whitewash**. A cellar ceiling is limewashed plaster gone warm with
   * smoke, not more brick — the walls are the masonry, the lid is the thing
   * painted over it, and tinting toward white rather than shading toward black
   * is what makes it a different surface instead of a darker one. A pale albedo
   * spends the same small budget of light and returns something visible, which
   * is exactly how a real low ceiling reads: never bright, never absent, and
   * carrying whatever colour the wash happens to be. It goes properly black in
   * a blackout, because then so does everything.
   *
   * And it is `cellPlane`, for the reason the value alone was not enough. A
   * hemisphere lights a flat plane to *one number*: every pixel of a lid whose
   * normal never changes gets identical light, so however well the value is
   * chosen the result is a fill, and a fill of any brightness reads as a hole
   * rather than as a ceiling. Making it paler only made it a paler hole. What
   * the eye wants is variation, and this file already has the way to get it —
   * the same per-cell vertex colours the walls, the boards and the brick use,
   * one draw call and no texture. Bays 0.45 m across and long down the room,
   * jittered a little harder than brick because limewash over plaster is
   * patchier than a bond is, and running the same way as the pipes so the
   * ceiling has one grain instead of two.
   */
  'low-ceiling': (c) => {
    const y = c.m.houseY + LOW_CEILING;
    const width = c.m.houseWidth + 6;
    /**
     * One plane, from behind the cloth to behind the back wall of the house.
     *
     * This was two, with a fascia across the lip joining them: `LOW_CEILING`
     * over the house and a soffit 0.2–0.45 m lower over the boards, on the
     * argument that a downstand at the proscenium line is the most basement
     * thing in the room. It is, in a basement that has one. What this room has
     * is a lid that was drawn in two pieces because the constants came in two
     * pieces — a house height measured from the house floor and a stage height
     * measured from the boards — so the size of the step was whatever the
     * *riser* happened to be, 0.1 m in the shed and 0.45 m in the riihi, in
     * rooms that are supposed to be the same cellar. A step nobody chose the
     * height of is not a beam, and the fascia that closed it was three draw
     * calls spent hiding the arithmetic.
     *
     * Both edges still die into something, which is the rule that mattered and
     * is why the two-piece version existed at all: upstage into the cloth, half
     * a metre behind `backZ`, and downstage past the back of the house into the
     * wall `stage.ts` puts there. What goes over the boards now hides the top
     * of the arch the way the soffit did — the plaster is opaque and full width,
     * and the legs of the portal run up into it, which is what a suspended
     * ceiling in an older room does to an older arch.
     */
    const front = c.m.backZ - 0.5;
    const back = c.m.lipZ + c.m.houseDepth + 2.25;
    const span = back - front;

    // Smoke-stained limewash: a fifth of the room's lamp colour blended into
    // the brick, then most of the way to white. Bright as a *surface*, dim in
    // every frame, because the light on it is the only thing that sets it.
    const plaster = tint(blend(c.p.backdrop, c.p.ambient, 0.2), 0.45);
    const lid = c.kit.solid('#ffffff', { vertexColors: true, side: DoubleSide });
    /** Bays 0.45 m across and long down the room, in the grain of the pipes. */
    const bays = (w: number, d: number, tag: string): BufferGeometry => cellPlane({
      width: w, height: d,
      cols: Math.max(6, Math.round(w / 0.45)),
      rows: Math.max(4, Math.round(d / 1.4)),
      colour: plaster, jitter: 0.17, rng: c.rng(tag),
    });

    const ceil = put(c, c.kit.own(bays(width, span, 'ceiling')), lid,
      0, y, (front + back) / 2);
    ceil.rotation.x = -Math.PI / 2;

    /**
     * Service runs — along the room, and flush to the lid.
     *
     * Both of those were wrong, and they were wrong in the way this whole file
     * keeps being wrong: something was placed at a height that sounded right
     * instead of against the rule three functions up. These hung 0.18 m below
     * the ceiling — *inside* the `LENS_GAP` band reserved for the camera — and
     * they ran across the room, so the nearer of the two sat 1.45 m in front of
     * the lens at wide-shot distance. A 0.14 m cylinder at 1.45 m subtends five
     * and a half degrees. It was not a pipe on a ceiling, it was a bar ruled
     * across the picture.
     *
     * Running them along the depth instead fixes it twice over. A pipe pointing
     * away from the camera converges toward the arch rather than cutting the
     * frame in half, which is what a real basement ceiling does to a
     * photograph; and there is no camera position from which it becomes a
     * horizontal rule, so this cannot come back at some other aspect ratio.
     *
     * And they are *against* the plaster, not hanging near it. `PIPE_R` up from
     * the centre puts the top of the cylinder exactly on the ceiling plane, so
     * the last centimetre is what stops a sliver of ceiling showing through the
     * gap at a grazing angle: a pipe with daylight between it and the ceiling is
     * a cylinder somebody left floating, and a pipe touching the ceiling is a
     * service run. That is the whole difference, and it is one number.
     *
     * ## The downstage end
     *
     * Which used to be the fascia's problem. The run stopped dead at the step
     * and the step covered the cut, so nobody had to say where a pipe goes when
     * it stops — and with one flat lid the same cut is an open cylinder in the
     * middle of the plaster, which is the floating-geometry failure this file
     * writes a comment about every time it finds one.
     *
     * A pipe that stops on a ceiling stops *in a wall*. So it bends: a quarter
     * elbow of the same 0.07 m tube on a 0.3 m radius, and a cross arm out to
     * `wallX` with 0.2 m of it buried past the plaster, which is the same
     * margin every other edge in this prop takes.
     *
     * The turn is at `lipZ + 0.9` and the 0.9 is the one number here that was
     * chosen rather than derived. It cannot be at the lip, which is where the
     * step was and where the arm looks like it belongs: `proscenium.ts` stands
     * its portal on `archZ = lipZ + 0.28` and its tormentors 0.36 m deep on
     * `archZ + 0.1`, so an arm across the room at the old `stepZ` runs straight
     * through both of them. A metre into the house clears the downstage face of
     * the tormentor by 0.27 m of air, and it puts the cross run over the front
     * of the *house* — near the top of the frame, four metres and more from any
     * lens the director owns, where a 0.14 m pipe is a duct going into a wall
     * and not the bar ruled across the picture that the paragraph above is
     * about.
     */
    const PIPE_R = 0.07;
    const BEND_R = 0.3;
    /** Where the run turns out of the room. See above for the 0.9. */
    const turnZ = c.m.lipZ + 0.9;
    const runLen = back - (turnZ + BEND_R);
    const run = c.kit.geometry(`pipe|${runLen.toFixed(2)}`,
      () => new CylinderGeometry(PIPE_R, PIPE_R, runLen, 6));
    const elbow = c.kit.geometry(`elbow|${BEND_R.toFixed(2)}`,
      () => new TorusGeometry(BEND_R, PIPE_R, 6, 4, Math.PI / 2));
    const pipeMat = c.kit.solid(shade(c.p.proscenium, 0.5), { metal: 0.4, rough: 0.5 });
    /** The axis, so that `PIPE_R` above it is a centimetre inside the plaster. */
    const axisY = y - PIPE_R + 0.01;
    for (const side of [-1, 1]) {
      const x = side * c.m.houseWidth * 0.22;
      const p = put(c, run, pipeMat, x, axisY, turnZ + BEND_R + runLen / 2);
      p.rotation.x = Math.PI / 2;

      /**
       * The bend, centred a radius outboard of the run and a radius upstage of
       * the arm, which is where a quarter circle tangent to both of them goes.
       * `Euler` is `XYZ`, so the z term turns the arc in its own plane first and
       * the x term lays it flat second: the right-hand pipe wants the quadrant
       * that opens inboard and the left-hand one wants its mirror.
       */
      const bend = put(c, elbow, pipeMat, x + side * BEND_R, axisY, turnZ + BEND_R);
      bend.rotation.set(-Math.PI / 2, 0, side > 0 ? Math.PI / 2 : 0);

      const armFrom = Math.abs(x) + BEND_R;
      const armLen = c.m.wallX + 0.2 - armFrom;
      const arm = put(c, c.kit.geometry(`pipe|${armLen.toFixed(2)}`,
        () => new CylinderGeometry(PIPE_R, PIPE_R, armLen, 6)), pipeMat,
        side * (armFrom + armLen / 2), axisY, turnZ);
      arm.rotation.z = Math.PI / 2;
    }
  },

  /**
   * A counter across the back of the house.
   *
   * Where it stands is `barFootprint`, which is where it always stood — the
   * expression is unchanged and it has a name now, because `tables` fills the
   * floor in front of this and was filling it straight through the counter. See
   * that footprint's docstring for the measurement.
   */
  bar: (c) => {
    const stand = barFootprint(c.m);
    const len = stand.w - 0.2;
    const back = stand.z;
    put(c, c.kit.bevelBox(len, 1.06, 0.55, 0.05), c.kit.solid(shade(c.p.boards, 0.45)),
      0, c.m.houseY + 0.53, back, true);
    put(c, c.kit.bevelBox(len + 0.2, 0.08, 0.7, 0.03), c.kit.solid(tint(c.p.boards, 0.1), { rough: 0.35 }),
      0, c.m.houseY + 1.08, back);
  },

  /**
   * Old bills pasted up the side wall of the wing — and pasted up the *wall*,
   * which is a datum this prop did not have.
   *
   * ## The aperture is not a wall
   *
   * Three bills at `openingWidth / 2 + 0.9` is an inch of paste on a
   * proscenium tormentor, and it was written when every room had one. Seven of
   * the twelve answer `openingWidth: d.width`, so that x is 0.9 m outboard of
   * the *boards*, over open house floor, with the side wall a further 1.4–3.65
   * m out. Rebuilt and measured, the air behind each bill: 1.96 m in a
   * proscenium, 1.91 in a ballroom, 1.70 in a salon and a riihi, 1.67 on a
   * lawn, 1.40 in a courtyard, 1.74–2.85 in a dancehall. Nothing under them
   * either — the deck stops at `width / 2`, so the nearest surface below is the
   * house floor a metre and a half down, which is the gap the float scan
   * reported. Only the shed was right, and only because `shed.ts` builds a
   * black flat whose inner face lands 0.02 m behind these bills *because* this
   * prop assumed a tormentor was there. Two room authors had already written
   * the defect down and both said the same thing: it is one number, and it
   * belongs here.
   *
   * ## `houseWidth / 2 + 0.57`
   *
   * Every room stands its side walls at `houseWidth / 2 + WALL_OUT`, and
   * `WALL_OUT >= 0.6` is a stated contract — `proscenium.ts` takes 0.6 and
   * `circuit.ts`, `dancehall.ts` and `hall.ts` each restate it as the minimum a
   * room may take. Seven of the nine architectures that name this prop take
   * exactly 0.6, verified by rebuilding and measuring the first surface
   * outboard: proscenium 7.00, ballroom 8.35, salon 8.45, riihi 7.65–7.88, shed
   * 8.60, the courtyard's arcade piers 0.03–0.05 m proud, the lawn's zinc fence
   * at `houseWidth / 2 + 0.57..0.62`.
   *
   * The 3 cm is load-bearing twice, which is why it is 0.57 and not 0.60: the
   * bill is a single-sided plane and the wall in five of those rooms is also a
   * plane at exactly that x, so 3 cm keeps them off each other's depth values;
   * and it lands the lawn's bill on the face of the zinc rather than inside it.
   * `neon` used to take 0.55 off the same datum for its wing pair and shared
   * this argument; the wings are gone (see the note there) and this prop is the
   * only side-wall dressing left.
   *
   * ## `m.wallX`, which is the change the paragraph above asked for
   *
   * The constant closed seven rooms and left three named residues: the
   * dancehall's `WALL_OUT = 1.75` left the bills 1.15 m off the boarding, the
   * arena's `HALL_OUT = 3.5` left them with nothing within 2.9 m of any x this
   * prop could compute, and the shed's flats ended up masking two of them. That
   * paragraph closed by saying the only change that closes all twelve is
   * `RoomShape` publishing the x of the first inward-facing surface beside the
   * stage. It publishes it now — see `RoomShape.wallX` — so the estimate is
   * gone and the three residues with it.
   *
   * The 3 cm survives the change intact and for both of its original reasons: a
   * single-sided plane 3 cm off a plane wall keeps the two out of each other's
   * depth values, and it lands the lawn's bill on the face of the zinc rather
   * than inside it. What it is measured from is the only thing that moved.
   *
   * No wall, no bill. A pavilion is a roof on posts and the whole point of it is
   * that there is nothing at the sides; three sheets of paper pasted to the air
   * where a wall would have been is the defect this is fixing, not a version of
   * it that is allowed because the paper is thin.
   *
   * **And a wall is not the same thing as somewhere to paste.** `wallX` answers
   * where the first inward-facing surface is, which is all a prop can ask for
   * and is not the whole question: `salon.ts` puts eight bays of 3.1 m double
   * doors under coloured fanlights along both sides, so the surface at that x is
   * a door leaf, and a bill pasted across a door is the version of this defect
   * that passes every measurement — it lands 0.01–0.03 m off the first surface,
   * like every other room, and it is wrong. Nothing here can see that; a room
   * knows what its walls are made of and this file never will. So it stays a
   * dressing decision: a genre staging in a room with doors, arcading or
   * glazing down both sides should not name `posters`, and `latin` no longer
   * does. See the note in `concert/venue.ts`, which is where the vocabulary
   * says so to the next author.
   *
   * ## A bill is paper with print on it, not a coloured rectangle
   *
   * One plane in one saturated colour is what the eye reads as a *sticker*, and
   * three of them at head height on a side wall read as three swatches somebody
   * left in the scene — which is the note that got this changed. A bill is
   * cheap paper, so it is nearly white; what is coloured on it is the ink. The
   * sheet is therefore paper-coloured with two blocks of ink on it, a heavy
   * band across the top where the name goes and a lighter block under it for
   * the small print, and it hangs a degree or two off square because nothing
   * pasted up in a hurry is level. At the distance these are seen from, that is
   * the whole difference between a poster and a rectangle.
   */
  posters: (c) => {
    if (!Number.isFinite(c.m.wallX)) return;
    const rng = c.rng('posters');
    const sheet = c.kit.geometry('poster', () => new PlaneGeometry(0.7, 1));
    const head = c.kit.geometry('poster-head', () => new PlaneGeometry(0.56, 0.26));
    const body = c.kit.geometry('poster-body', () => new PlaneGeometry(0.56, 0.34));
    // Paper, not scenery: the sheet keeps a little of the room's warmth so it
    // is not a white hole in a dark wall, and the ink carries the colour.
    const paper = c.kit.solid(blend(c.p.proscenium, '#f2ece0', 0.75), { rough: 1 });
    for (let i = 0; i < 3; i++) {
      const side = i === 1 ? -1 : 1;
      const ink = hueShift(c.accent, rng.float(-90, 90), 0.45);
      const bill = new Group();
      bill.position.set(
        side * (c.m.wallX - 0.03), 1.7 + rng.float(-0.3, 0.5), c.m.curtainZ - 0.9 - i * 1.4,
      );
      bill.rotation.y = side * -Math.PI / 2;
      bill.rotation.z = rng.float(-0.035, 0.035);
      bill.add(new Mesh(sheet, paper));
      // Off the paper by a millimetre each, which is what stops the print from
      // z-fighting the sheet and is still inside the 3 cm the bill stands off
      // the wall.
      const top = new Mesh(head, c.kit.solid(shade(ink, 0.15), { rough: 1 }));
      top.position.set(0, 0.28, 0.001);
      bill.add(top);
      const under = new Mesh(body, c.kit.solid(tint(ink, 0.45), { rough: 1 }));
      under.position.set(0, -0.19, 0.002);
      bill.add(under);
      c.root.add(bill);
    }
  },

  rug: (c) => {
    const rng = c.rng('rug');
    const geo = c.kit.own(cellPlane({
      width: Math.min(4.2, c.m.width * 0.5), height: 2.6, cols: 7, rows: 5,
      colour: shade(c.accent, 0.35), jitter: 0.14, rng,
    }));
    const rug = put(c, geo, c.kit.solid('#ffffff', { vertexColors: true, rough: 0.95 }),
      0, 0.012, c.m.lipZ - 2.2, true);
    rug.rotation.x = -Math.PI / 2;
  },

  /**
   * Tube signage: the one prop here that is a *word* and cannot spell one.
   *
   * A honky-tonk, a dancehall and a basement club are the same room with three
   * different names over the bar, and the name is the whole of the difference —
   * which is a problem, because there is no text anywhere in this renderer and
   * adding a font to draw one word would cost more than the entire stage. So
   * this draws the *shape* of a sign rather than a sign: a bent tube inside a
   * rectangle, which is what a neon reads as from the back of a dark room long
   * before anybody makes out what it says. Unlit, like the bulbs and the
   * candles, because a sign is a light and not a thing lit by one.
   *
   * ## One sign, because a bar has one sign
   *
   * This hung three of them — the back wall and one on each side wall, the
   * wing pair at the `posters` position — and the third copy was the one thing
   * here that was never a fact about the room. The argument for it was framing:
   * offstage, seen through the opening at an angle, *so a wide shot has
   * something bright in the dark either side of the arch*. That is scenery
   * placed for the lens rather than for the building, and it costs exactly what
   * placing scenery for the lens always costs — the object stops meaning
   * anything. Three identical signs 17 m apart is not a bar with a sign in it,
   * it is a livery; and because the pair sits at the house edges at 1.85 m,
   * every angle the camera can take has one in it. A room dressed with `neon`
   * read as *the neon room* rather than as a room with a neon in it, which is
   * the note that got this cut.
   *
   * What the wings were compensating for is real and is somebody else's:
   * a wide shot of a dark room wants something bright at the edges, and the
   * things that legitimately supply it are the fixtures — see `lights.ts`.
   *
   * So: one sign, over the band, on the wall the room actually built. The two
   * geometries stay in the kit's cache rather than being built inline, which
   * buys nothing at one instance and is how every other prop in this file is
   * written; the sign is the object that changed, not the machinery.
   *
   * ## The back sign was hung off the wrong datum
   *
   * It was 0.26 m off the wall in every one of the seven
   * architectures, uniformly, because `backZ` is the upstage edge of the
   * *boards* and not the wall: every room sets its cloth or plaster 0.10 m
   * upstage of it (0.12 in the dancehall) so that nobody standing on the back
   * of the boards is inside it. A 1.5 × 0.62 m open frame with no back, no
   * raceway and no bracket, a quarter of a metre off the plaster. `backZ −
   * 0.05` puts the script tube's glass at `backZ − 0.078`: 0.022 m off the
   * plaster in the seven, 0.042 in the dancehall, and inside the wall in none
   * of them, which is the depth of a real sign's fixings. Only the y is left as
   * it was — a bare 1.85 in board space is 2.85 m above a ballroom's house
   * floor and 2.15 m above a riihi's, and that is fine for a sign.
   *
   * And one of them flickers, which is the whole reason the back-wall sign gets
   * a material of its own. A neon that never falters is a lightbox. The stutter
   * is two sines beating against each other rather than a random draw, so it is
   * the same on every machine and needs no stream of its own, and it stops
   * entirely under reduced motion — a flickering sign is exactly the thing that
   * setting is for.
   */
  neon: (c) => {
    const W = 1.5;
    const H = 0.62;
    const script = c.kit.geometry('neon-script', () => {
      const pts: Vector3[] = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        pts.push(new Vector3(
          (t - 0.5) * W * 0.84,
          Math.sin(t * Math.PI * 2.6) * H * 0.28 - (t > 0.55 ? H * 0.07 : 0),
          0,
        ));
      }
      return new TubeGeometry(new CatmullRomCurve3(pts), 28, 0.028, 5, false);
    });
    // The surround is one closed tube rather than four bars, which is both a
    // quarter of the draw calls and the better object: a neon border is a
    // single bent length of glass with rounded corners, and four butted boxes
    // is a picture frame.
    const border = c.kit.geometry('neon-border', () => {
      const pts: Vector3[] = [];
      const per = 4;
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const;
      for (let i = 0; i < 4; i++) {
        const [ax, ay] = corners[i]!;
        const [bx, by] = corners[(i + 1) % 4]!;
        for (let s = 0; s < per; s++) {
          const t = s / per;
          pts.push(new Vector3(
            ((ax + (bx - ax) * t) * W) / 2, ((ay + (by - ay) * t) * H) / 2, 0,
          ));
        }
      }
      return new TubeGeometry(new CatmullRomCurve3(pts, true), 44, 0.022, 4, true);
    });
    const hot = tint(hueShift(c.accent, 150, 0.55), 0.18);
    const frame = c.kit.basic(tint(hueShift(c.p.ambient, -45, 0.5), 0.12));

    // Over the band, high enough to be a sign on a wall rather than a hazard at
    // head height, and upstage of the backline besides.
    const tube = c.kit.material('neon|back', () => new MeshBasicMaterial({ color: hot }));
    const node = new Group();
    node.add(new Mesh(script, tube));
    node.add(new Mesh(border, frame));
    node.position.set(
      -c.m.openingWidth * 0.2,
      Math.min(c.m.openingHeight - 0.5, Math.max(HANG_FLOOR + 0.4, c.m.openingHeight * 0.6)),
      c.m.backZ - 0.05,
    );
    c.root.add(node);

    const lit = new Color(hot);
    c.tick((t) => {
      const beat = Math.sin(t * 11.3) * Math.sin(t * 3.1);
      const dip = beat > 0.86 && c.idle > 0.5 ? 0.32 : 1;
      tube.color.copy(lit).multiplyScalar(dip * (0.94 + 0.06 * Math.sin(t * 2.3)));
    });
  },

  // -- the black box -------------------------------------------------------

  /**
   * A slow field on the backdrop. Two triangles and a fragment shader that
   * costs nothing — and for a genre with no foreground it is most of the set.
   */
  projection: (c) => {
    const mat = c.kit.own(new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uA: { value: new Color(c.p.ambient) },
        uB: { value: new Color(hueShift(c.p.ambient, 60, 0.1)) },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform vec3 uA; uniform vec3 uB;
        varying vec2 vUv;
        void main() {
          float y = vUv.y * 3.0 - uTime * 0.045;
          float b = 0.5 + 0.5 * sin(y * 3.1 + sin(vUv.x * 2.3 + uTime * 0.06) * 1.6);
          float r = length(vUv - 0.5);
          float vig = smoothstep(0.72, 0.15, r);
          gl_FragColor = vec4(mix(uA, uB, b), vig * 0.5);
        }`,
    }));
    const w = Math.min(c.m.width * 0.8, c.m.openingWidth * 0.8);
    const screen = put(c, c.kit.geometry(`proj|${w}`, () => new PlaneGeometry(w, w * 0.56)), mat,
      0, c.m.openingHeight * 0.45, c.m.backZ + 0.06);
    screen.renderOrder = 1;
    c.tick((t) => {
      const u = mat.uniforms.uTime;
      if (u) u.value = t * c.idle;
    });
  },

  /**
   * Three road cases parked in the wings.
   *
   * ## And parked *in front of* whatever the room stands against its back wall
   *
   * The z draw starts at `backZ + 0.5` and a case is 0.6 m deep, so its upstage
   * face reached `backZ + 0.2` — inside the strip every back-wall prop in this
   * file occupies. Measured against the one that is there most often: `backline`
   * runs its cabinets from `backZ + 0.04` to `backZ + 0.36` across the whole
   * width, so a case at the bottom of the draw stood **0.16 m** inside the amp
   * line, **0.0528 m³** of it, twice over in each of `metal/thrash` and
   * `metal/extreme`. There is no dodging that in x — a backline is a wall, and
   * every x the case can draw is behind one.
   *
   * `BACK_STRIP` is the whole answer and it is not a new number: it is the
   * riser's own upstage face, and everything this file stands against the back
   * wall is inside it. So the case's *upstage face* clamps to it — z at
   * `backZ + BACK_STRIP + 0.3` at the tightest — which leaves the amp line 0.09 m
   * of daylight and moves nothing in the eighteen venues whose draw already
   * landed downstage of it. The clamp is a `max` on the drawn z rather than a
   * narrower draw, so the stream is untouched and the PA walk below still starts
   * from the same numbers.
   */
  'flight-case': (c) => {
    const rng = c.rng('cases');
    const body = c.kit.solid(shade(c.p.backdrop, 0.6), { rough: 0.7 });
    const edge = c.kit.solid(tint(c.p.proscenium, 0.2), { metal: 0.6, rough: 0.4 });
    /** Half a case's depth downstage of the strip the back wall's dressing owns. */
    const clearOfWall = c.m.backZ + BACK_STRIP + 0.3;
    /**
     * Where the cases already down this wall are, so the next one clears them.
     *
     * Two of the three are drawn on the same side from the same 0.6 m band of x
     * and 1.3 m band of z, which puts them in the same place often enough to
     * see: two boxes standing in each other, and — because both stand on the
     * boards — with their lids and their bases on shared planes. The draws are
     * left exactly as they were and the clash is walked out of afterwards, so
     * no other prop's stream moves.
     */
    const down: { x: number; z: number; w: number }[] = [];
    /**
     * And the PA is already parked here, on the seeds that have one.
     *
     * It used to be a 1.0 by 0.7 cabinet on the boards at `±(width/2 - 0.7)`,
     * dead inside the band this file draws from, and a case that drew the same
     * corner stood in a speaker. It is a pole now — see `paFootprint` — so what
     * is left down here is 0.42 m of base plate, which is much easier to miss
     * and still exactly as solid as the cabinet was.
     *
     * The footprint comes off the one function that says where the PA is rather
     * than off a hand copy of its old arithmetic, which is the correction this
     * paragraph is: the copy was right for as long as nothing moved.
     *
     * The set it asks comes off `Ctx` rather than being re-read from the venue:
     * `dressStage` has it in hand, and see `Ctx.dressed` for what a builder may
     * and may not do with the answer.
     */
    if (c.dressed.has('pa-stack')) {
      const pa = paFootprint(c.m);
      for (const side of [-1, 1]) {
        down.push({ x: side * pa.x, z: pa.z, w: pa.r * 2 });
      }
    }
    // And the ground-stacked one is the old obstacle unchanged, on the venues
    // that name it instead. It can be struck for a number; the cases stay where
    // the venue was built, so this dodges the stack that was *placed* rather
    // than the one that happens to be standing tonight.
    if (c.dressed.has('pa-ground')) {
      const pa = paGroundFootprint(c.m);
      for (const side of [-1, 1]) {
        down.push({ x: side * pa.x, z: pa.z, w: pa.w });
      }
    }
    for (let i = 0; i < 3; i++) {
      const side = i === 1 ? 1 : -1;
      const w = rng.float(0.7, 1.1);
      const h = rng.float(0.45, 0.75);
      const x = side * (c.m.width / 2 - rng.float(0.5, 1.1));
      let z = Math.max(clearOfWall, c.m.backZ + rng.float(0.5, 1.8));
      for (let guard = 0; guard < 4; guard++) {
        const clash = down.some((d) => d.x * side > 0
          && Math.abs(d.x - x) < (d.w + w) / 2 && Math.abs(d.z - z) < 0.7);
        if (!clash) break;
        z += 0.75;
      }
      down.push({ x, z, w });
      put(c, c.kit.bevelBox(w, h, 0.6, 0.04), body, x, h / 2, z, true);
      put(c, c.kit.bevelBox(w + 0.04, 0.05, 0.64, 0.02), edge, x, h - 0.03, z);
    }
  },

  /**
   * `cables` was here: three 36 mm tubes lying along the back wall, joined to
   * nothing at either end, at twice the thickness of a real lead.
   *
   * It was the stage's only cabling once, and it worked precisely because it
   * connected nothing — an eye that has decided a tube is texture does not
   * follow it anywhere. Then `cables.ts` started running leads from real jacks,
   * and the prop's last revision argued it could keep half its job: a bare deck
   * reads as a showroom, so leave a room's own spare cable coiled upstage where
   * nobody is using it.
   *
   * That argument does not survive the leads getting *better*. A run you can
   * trace from a guitarist's jack to the wing, drawn at 13 mm, lying beside
   * three fatter tubes that begin and end in open floor, does not read as a
   * stage with spare cable on it. It reads as a stage where somebody drew the
   * cabling twice and only meant it once — and the thicker, older, unconnected
   * one is the one the eye picks first, because it is thicker. A bare deck was
   * never the problem this prop was solving; it was solving an empty one, and
   * the deck is not empty any more.
   */

  /**
   * Extra masking legs. A black box is mostly drapes.
   *
   * A leg is floor-to-grid cloth, so it occupies the whole head band by
   * definition and the only question is whether it occupies it *where somebody
   * is standing*. It did: centred 0.2 m inside the opening edge, a 1.8 m panel
   * reached 0.85 m into the playing area and a player at the x limit stood
   * inside it. Anchoring the inner *edge* rather than the centre keeps the
   * overlap that makes it mask and loses the overlap that makes it clip.
   *
   * ## And the leg has to be standing on something
   *
   * `openingWidth` may be *wider* than the boards — `hall` by `2 · MASK_OUT`,
   * `circuit` by `2 · WING` — and the aperture is not a floor. In `hall` that
   * put `inner` at `width / 2 + 0.20`, so the whole 1.69 × 4.70 m cloth was
   * outboard of the deck with its hem at deck level and the house floor a metre
   * below it: the largest single floater on any of these stages, one each side,
   * framing the wide shot with a metre of lit concrete showing under the hem.
   * `concert-hall` has the same 0.15 m overrun and escaped only because a flat
   * at x 6.55 happens to intersect the cloth. So the inner edge is clamped to
   * the boards as well as to the band, and the two clamps are opposite ends of
   * the same sentence: never inside the playing area, never off the deck.
   *
   * What is *not* a defect and must not be "fixed": the 1.2–1.4 m of leg that
   * overhangs the lip in every room, hem at deck level. A masking leg is hung
   * from a bar and trimmed to the deck, and its hem staying level past the edge
   * of the stage is what cloth does.
   *
   * ## The top was the aperture, which is the one thing a leg does not hang from
   *
   * "Hung from a bar and trimmed to the deck" is the sentence directly above,
   * and the height under it was `openingHeight` — the *hole the audience looks
   * through*, which is a header in a theatre and the clear span of the building
   * in seven of the twelve rooms. Cloth was therefore being hung off a height
   * with nothing at it, which is the defect `rigHeight` and `tieOff` were written
   * for one prop over, and in the two rooms where something *was* at that height
   * it was hung through it:
   *
   *   - `rnb/neo` puts a low-ceilinged theatre's aperture at **4.400** and its
   *     soffit at **2.850**, so all four panels stood 1.550 m through the
   *     plaster — two and a half metres of black masking in a cellar ceiling, and
   *     the worst instance in the catalogue by half a metre.
   *   - `metal/heavy` tops its cloth out at 4.766, which is the shed's rafter
   *     soffit exactly, and `beams` hangs a 0.24 m tie beam from that same plane
   *     down to 4.526 — so the top 0.24 m of every leg was inside a timber,
   *     0.0295 m³ of it, twice.
   *
   * `flyY` is the answer to both and it is the honest one: it is the height the
   * room says its bar is at, `RoomRig.flyBar` *requires* something real to be
   * there, and a leg hangs from a bar. It is below `openingHeight` in all 27
   * venues that dress this — by 0.13 m in a dance hall and 1.68 m in the neo
   * theatre, 0.45 m at the median — so every leg gets shorter and none gets
   * short: the lowest bar any of them hangs on is 2.720 m, which is a metre clear
   * of `HEAD_BAND.hi` and still masks a 2.850 m room to the ceiling.
   *
   * The third term is the lid, and it is inert today on purpose. `headroom` is
   * over `flyY` in all 27 — every room hangs its bar under its own ceiling —
   * but the guarantee this prop owes is "no cloth through the plaster", and a
   * prop that owes a guarantee should state it rather than inherit it from a
   * habit of the rooms. `deck()` deliberately *not*: a rafter is opaque and
   * cloth does not pass behind one.
   */
  drapes: (c) => {
    const cloth = c.kit.solid(shade(c.p.curtain, 0.55), { rough: 0.98, side: DoubleSide });
    /** Floor to the bar, under the aperture, and under the lid. See above. */
    const h = Math.min(c.m.openingHeight, c.m.flyY, c.m.headroom);
    const halfW = 0.9;
    const angle = 0.35;
    const geo = c.kit.geometry(`drape|${h.toFixed(3)}`, () => new PlaneGeometry(halfW * 2, h));
    // Inside the opening if there is room for it, on the boards either way, and
    // never inside the band. `put` places the panel at `inner + halfW·cos`, so
    // `inner` is the cloth's inboard edge rather than its centre.
    const inner = Math.max(c.play.halfX, Math.min(c.m.width / 2 - 0.15, c.m.openingWidth / 2 - 0.25));
    for (const side of [-1, 1]) {
      for (let i = 0; i < 2; i++) {
        const m = put(c, geo, cloth,
          side * (inner + halfW * Math.cos(angle)), h / 2,
          c.m.curtainZ - 1.6 - i * 1.9);
        m.rotation.y = side * angle;
      }
    }
  },

  // -- the concert hall ----------------------------------------------------

  /**
   * Rows of seats in the house, which is a hall's audience and not a club's.
   *
   * The distinction the name is drawing is `tables`: both put furniture among
   * the crowd, and they are opposite claims about what the crowd is *for*. A
   * table says people came to sit round something and the band is at the end of
   * the room; a rank of identical seats all pointing the same way says everyone
   * came to face one direction, which is the entire social fact of a concert
   * hall and is legible from the stage before you see a single face.
   *
   * The seats are built for the room rather than for the people in it, and that
   * is deliberate: `audience.density` leaves gaps on purpose, and a gap in a
   * hall should be an empty seat. It was the one thing this could add that the
   * crowd could not — a thinned house over bare floor reads as a room that was
   * never full, and a thinned house over rows of seats reads as a room that did
   * not sell out. Same geometry, and only one of them is a concert.
   *
   * ## Two files place one row, again
   *
   * Where the rows are is `stage-audience.ts`'s decision, and a seat back that
   * disagrees with it is a plank through somebody's chest. Most of the answer
   * comes back through the metrics — `crowd.frontZ` is the front of row zero
   * and `rowGap` is exported precisely so a second file can ask — but the seat
   * pitch, the rake and the half-pitch stagger on alternate rows are private
   * over there, and are restated here rather than exported. That is the
   * `HEAD_BAND` bargain: importing them would be the tighter coupling and this
   * is the one whose failure is visible in the first frame.
   *
   * A pane per seat rather than a rail per row, because a continuous board at
   * chest height across a room is a fence, and 480 double-sided planes are two
   * triangles each in a single draw call. No shadows: the house is silhouette,
   * and furniture in it that caught the one shadow-casting lantern would be the
   * only lit thing among a hundred unlit people.
   *
   * ## A back is not a seat
   *
   * The pane was the whole chair for as long as this prop has existed, and the
   * name of the prop is what gives it away: `stalls` is where an audience
   * *sits*, and there was nothing here to sit on. From behind the last row it
   * passed, because a pane is what you see of the row in front. From anywhere
   * the camera goes down the side of the house it was a rank of boards on
   * sticks with people standing between them.
   *
   * So the standard the prop grew below is now two, at the ends of a pan, and
   * the pan is at `SEAT_Y` — `stage-audience.ts`'s number, imported rather than
   * restated, because it is the one measurement here that the people are also
   * posed from. The legs move outboard with it: they used to stand at the
   * pane's own x, which is the middle of somebody, and the litre of a crowd
   * body each of the 39–48 posts a venue was sharing is smaller at the flank
   * than it was at the sternum. Each leg is still 0.05 square and still runs to
   * `houseY`, so the buried-volume arithmetic below is unchanged — it is per
   * post, and there are now two of them rather than one that was wider.
   *
   * ## The rake is the crowd's, not the floor's
   *
   * `row * rake` was being read as air, and it is structure. A sweep of all 72
   * venues found this the largest unanchored cluster in the project — 2110 seat
   * planes over eight venues, hanging with nothing under them — and the reason
   * it looked defensible is that in one of the four rooms it is. Measured, with
   * a ray fired down from each plane's underside:
   *
   * ```
   *   classical/{baroque,classical,romantic,impressionist}   concert-hall
   *       every row 0.410 m over its own step
   *   indian/{carnatic,filmi}   sabha       0.410 m (row 0) → 1.310 m (row 9)
   *   arabic/firqa              courtyard   0.410 → 1.310
   *   rnb/soul                  ballroom    0.410 → 1.510
   * ```
   *
   * `concert-hall.ts` builds the rake it seats people on — a step per row, tread
   * at `houseY + row * rake` — so its seats stand 0.410 m over a tread in all
   * twelve rows and its houses are right. The other three rooms lay one flat
   * plane at `houseY` and lift nobody, so the gap grows by 0.1 m a row until the
   * back row of rnb/soul is **1.510 m in the air**. The parenthesis in the
   * defect report — "the rooms that carry stalls model their own floor slope" —
   * is true of one room in four and was worth measuring rather than believing.
   *
   * ## What would fix it properly, and is not available here
   *
   * The missing fact is **the slope of the house floor the room actually
   * built**, and no room publishes it. It would be a `RoomShape` field in the
   * manner of `wallX` and `rigLid` — call it `houseRake`, "the rise per row of
   * the surface the audience stands on, or 0 where the floor is flat", answered
   * `seated ? 0.1 : 0.05` by `concert-hall` and `0` by the other eleven, with
   * `stage-audience.ts` reading it too so the crowd stops floating for the same
   * reason the seats did. This file must not guess it: a prop that assumed a
   * rake is how the eight venues got here, and a prop that assumed a flat floor
   * would bury seven of the concert hall's twelve rows inside its steps —
   * measured, row 11's plane would sit 0.69 m under its own tread.
   *
   * ## So the seat gets the leg it never had
   *
   * What is available is the floor plane itself: `houseY` exists in every room,
   * a ray fired down from every one of the 2110 planes lands on it, and it is
   * the one surface all four rooms agree about. So each seat stands a standard
   * from `houseY` to its own underside, and the amount of air that used to be
   * under the pane is now the length of the post: 0.410 m where the room raked
   * its floor, 0.410 + `row * rake` where it did not.
   *
   * In the concert hall the lower `row * rake` of that post is inside the step —
   * which is what a seat standard bolted through a tread is. Measured, the
   * buried section is **0.00275 m³** in the worst row (row 11 of 12, 1.1 m of a
   * 0.05 m square post), which is why the post is 0.05 and not 0.06: it has to
   * stay under the 0.004 m³ that counts as a collision, and at 0.06 the same row
   * would bury 0.00396 and a sixteen-row house would go over. The other overlap
   * the sweep finds is 39–48 posts a venue sharing about a litre each with a
   * crowd body — the pane has always done that, on purpose, and a post at the
   * pane's own x and z did no more of it. The pair that replaced that post
   * stand at the flanks instead and share less; see "A back is not a seat".
   * In the three flat rooms the whole post
   * is visible, and the back row of rnb/soul stands on a 1.5 m stalk. That is
   * not a nice picture and it is the true one: the crowd in that room is already
   * 1.1 m in the air on a floor that does not rise, and a prop that hid it would
   * be hiding the missing `houseRake` rather than reporting it. The pane is
   * unmoved — it has to stay level with the back of the person in front, and
   * where they are is `stage-audience.ts`'s call, not this file's.
   *
   * One more draw call, and it buys the whole prop a floor.
   */
  stalls: (c) => {
    const seated = c.venue.audience.seated;
    const rows = Math.max(1, Math.min(16, Math.round(c.venue.audience.rows)));
    /** `stage-audience.ts`'s `ROW` and `spacing`. See the note above. */
    const SEAT = 0.66;
    const rake = seated ? 0.1 : 0.05;
    const gap = rowGap(seated);
    const perRow = Math.max(3, Math.min(30, Math.floor(c.m.houseWidth / SEAT)));
    const woodwork = c.kit.solid(shade(blend(c.p.curtain, c.p.backdrop, 0.35), 0.3), { rough: 0.95, side: DoubleSide });
    const backs = new InstancedMesh(
      c.kit.geometry('seat-back', () => new PlaneGeometry(SEAT - 0.11, 0.5)),
      woodwork,
      rows * perRow,
    );
    /**
     * The pan and its two standards, three instances of one unit box.
     *
     * A unit box scaled per instance, not a bevelled one and not three
     * geometries: a bevel on a stretched box rounds unevenly along the axis it
     * was stretched on, which `concert-hall.ts` says at length about its own
     * steps, and a second geometry for the pan would be a second draw call for
     * a slab that differs from a leg only in which way it is long.
     */
    const frame = new InstancedMesh(
      c.kit.geometry('seat-frame', () => new BoxGeometry(1, 1, 1)),
      woodwork,
      rows * perRow * 3,
    );
    /** Across the seat — the pane's width, so the chair is one object wide. */
    const W = SEAT - 0.11;
    /** Front to back. Deep enough to be a seat, short enough to clear the row. */
    const PAN = 0.44;
    const THICK = 0.055;
    const dummy = new Object3D();
    let i = 0;
    let j = 0;
    for (let row = 0; row < rows; row++) {
      // Behind the row's own occupants — a seat back is the thing the person in
      // front of you is leaning on, so from the stage it fills the gaps.
      const z = c.m.crowd.frontZ + 0.35 + row * gap + 0.24;
      const y = c.m.houseY + row * rake + 0.66;
      /** The top of the pan, which is the hip height `stage-audience.ts` sits at. */
      const pan = c.m.houseY + row * rake + SEAT_Y;
      /** Floor to the underside of the pan. The air that used to be here. */
      const leg = pan - THICK - c.m.houseY;
      const stagger = (row % 2) * SEAT * 0.5;
      for (let s = 0; s < perRow; s++) {
        const x = (s - (perRow - 1) / 2) * SEAT + stagger;
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        backs.setMatrixAt(i++, dummy.matrix);
        // Downstage of the pane by half its own depth and 0.03 more, so the
        // person on it has the back behind their back rather than under their
        // knees and the two boards do not meet in one face.
        const seatZ = z - PAN / 2 - 0.03;
        dummy.position.set(x, pan - THICK / 2, seatZ);
        dummy.scale.set(W, THICK, PAN);
        dummy.updateMatrix();
        frame.setMatrixAt(j++, dummy.matrix);
        for (const side of [-1, 1]) {
          dummy.position.set(x + side * (W / 2 - 0.03), c.m.houseY + leg / 2, seatZ);
          dummy.scale.set(0.05, leg, 0.05);
          dummy.updateMatrix();
          frame.setMatrixAt(j++, dummy.matrix);
        }
      }
    }
    c.root.add(backs);
    c.root.add(frame);
  },

  /**
   * The front pipes of an organ, high on the back wall.
   *
   * One genre's prop, like `lake` and `birch` before it, and worth the same
   * defence: a hall is otherwise a big proscenium, and a big proscenium is what
   * the house room already is. This is the object that makes it a *hall* — a
   * church, a Konserttitalo, the back of any room built before amplification —
   * and it does it from a distance at which nothing else on stage is legible.
   *
   * Above the band by construction rather than by luck. The feet sit at
   * `HANG_FLOOR` or at 0.44 of the opening, whichever is higher, and the whole
   * run is upstage of the backline, so it clears the sightline rule twice over
   * — which matters more here than for most props, because a fan of bright
   * vertical metal directly behind a row of heads is the single worst backdrop
   * a face can have.
   *
   * A three-peak front, tall at the ends and in the middle, which is what an
   * organ case does and is also the only profile that survives being drawn with
   * seventeen cylinders. The case underneath is not decoration: it is what the
   * pipes stand on, and this file has learned twice that an object with nothing
   * under it reads as an object floating rather than as an object high up.
   */
  'organ-pipes': (c) => {
    const n = c.quality === 'low' ? 11 : 17;
    const foot = Math.max(HANG_FLOOR, c.m.openingHeight * 0.44);
    const top = Math.max(foot + 1.2, c.m.openingHeight - 0.3);
    const runW = Math.min(c.m.openingWidth * 0.8, c.m.width - 1.4);
    const pipes = new InstancedMesh(
      c.kit.geometry('front-pipe', () => new CylinderGeometry(0.078, 0.078, 1, 7)),
      c.kit.solid(tint(c.p.proscenium, 0.4), { metal: 0.8, rough: 0.26 }),
      n,
    );
    const dummy = new Object3D();
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const h = (top - foot) * (0.34 + 0.66 * (1 - Math.abs(Math.sin(t * Math.PI * 2))));
      dummy.position.set((t - 0.5) * runW, foot + h / 2, c.m.backZ + 0.26);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      pipes.setMatrixAt(i, dummy.matrix);
    }
    c.root.add(pipes);
    // The case they stand in, and its back face is on the wall plane so the
    // loft dies into the cloth rather than ending in mid-air.
    put(c, c.kit.bevelBox(runW + 0.55, 0.32, 0.44, 0.04),
      c.kit.solid(shade(c.p.boards, 0.4), { rough: 0.65 }),
      0, foot - 0.16, c.m.backZ + 0.2);
  },

  /**
   * The floor covered, corner to corner. Not a bigger `rug`.
   *
   * The two are opposite objects that happen to be made the same way. A rug is
   * a worn thing thrown under the gear, off centre, smaller than the stage, and
   * what it says is that somebody put it there. A carpet is the deck itself
   * gone soft: no boards visible, no edge inside the frame, and a band that
   * *sits on it* — which is a Hindustani recital, a qawwali party, and any room
   * where the floor is where the music happens rather than where it stands.
   *
   * So it is the fourth thing allowed underfoot, and the least dangerous of the
   * four. Eight millimetres of textile is not an obstacle at any camera height,
   * and it is laid *under* the rug's twelve so a room asking for both gets a
   * worn rug on a carpet, which is a real room, rather than z-fighting.
   *
   * A border, in a second plane, and it is not a flourish. A field of jittered
   * cells with a raw edge is the boards with the colour changed; the same field
   * inside a plain band is a made object with a maker, and the whole difference
   * costs one draw call.
   */
  carpet: (c) => {
    const rng = c.rng('carpet');
    const w = Math.min(c.m.width - 1.0, 7.4);
    const d = Math.min(c.m.depth - 0.9, 5.0);
    const z = (c.m.backZ + c.m.lipZ) / 2 - 0.2;
    const border = put(c,
      c.kit.geometry(`carpet-edge|${w.toFixed(2)}|${d.toFixed(2)}`, () => new PlaneGeometry(w, d)),
      c.kit.solid(shade(hueShift(c.accent, 24, 0.3), 0.5), { rough: 0.98 }),
      0, 0.006, z, true);
    border.rotation.x = -Math.PI / 2;
    const field = put(c,
      c.kit.own(cellPlane({
        width: w - 0.5, height: d - 0.5,
        cols: 14, rows: 10,
        colour: shade(hueShift(c.accent, -16, 0.35), 0.28), jitter: 0.16, rng,
      })),
      c.kit.solid('#ffffff', { vertexColors: true, rough: 0.98 }),
      0, 0.009, z, true);
    field.rotation.x = -Math.PI / 2;
  },

  // -- the barn and the warehouse ------------------------------------------

  /**
   * Exposed roof timbers, across the whole room.
   *
   * A barn and a warehouse are the same building to a camera — one big volume
   * with a band at one end — and the two props that separate them are this and
   * `hay`. This is the shared half: a roof you can see the structure of, which
   * is what every room that was built to store something rather than to listen
   * in has instead of a ceiling.
   *
   * **They run past both walls, and that is the whole trick.** `low-ceiling`
   * learned it first: an edge in mid-air reads as a mistake and the only cure
   * is for every edge to die into something. A tie beam ending a metre short of
   * a wall is a plank hanging in a room. Six metres of overrun puts both ends
   * outside anything a lens can frame, in a room that may not have walls at all.
   *
   * The height is a camera constant, not a taste. `camera.ts` lifts the wide
   * shot to 3.6 m at distance and `LENS_GAP` wants 0.6 m of air above that, so
   * 4.3 m is the lowest a beam can hang and still be a beam rather than a bar
   * ruled across the picture — the exact failure the cellar's service pipes had.
   * Where the room does have a lid, the timbers go under it instead.
   *
   * ## What must clear the lid is the top of the *stack*, and it was the centre
   * of the bottom member
   *
   * This is two timbers, not one: a purlin sits on a tie, which is what makes
   * the row of planks a roof. So the assembly is `TIE + PURLIN = 0.46 m` deep,
   * and the old arithmetic solved for a point 0.12 m up from its underside —
   * `headroom - 0.22` was the tie's *centre*, so the purlin's top landed at
   * `headroom + 0.12` and stood through the roof. Measured before, in all six
   * venues that name this prop and by exactly the same 0.120 m in every one:
   * `metal/heavy` 4.886 against a shed soffit at 4.766, `finnfolk/pelimanni`
   * 3.850 against 3.730, `finnfolk/revival` 3.830 against 3.710,
   * `finnfolk/contemporary` 3.810 against 3.690, `country/stringband` 3.270
   * against a dance-hall plaster at 3.150. Six of six, and it is the same
   * mistake `truss` was making one prop over: solving a member's centre against
   * a plane its surface has to clear.
   *
   * `finnfolk/runo` was worse and is the reason there is a guard below. It names
   * `beams` **and** `low-ceiling`, so the floor clamp `max(HANG_FLOOR + 0.2, …)`
   * won and put `y` at 2.85 — the cellar's old stage soffit exactly — which does
   * not put the timber near the ceiling, it puts the ceiling *through the middle
   * of the tie beams*: 2.730 to 2.970 against a soffit plane at 2.850, with the
   * purlins entirely above it and outside the building. That contradiction used
   * to be named here and left to the room, and the room answered it by
   * publishing the lid it was given. A tie and a purlin need 0.46 m and
   * `HANG_FLOOR` needs 2.65, so a room needs **3.11 m** of lid to carry exposed
   * roof timbers over standing people, and 2.85 was not 3.11.
   *
   * The arithmetic no longer settles it, which is why the guard below is now a
   * sentence rather than a subtraction. `stage-props.ts` draws one flat lid for
   * `low-ceiling` instead of a house plaster and a lower stage soffit, so the
   * riihi's boarding is at 3.30 m over the boards and 3.30 is comfortably 3.11:
   * the timbers would fit, and they still must not be drawn. The reason was
   * always the *building* rather than the clearance — `low-ceiling` means the
   * barn has been boarded over, and boarding a barn over is precisely the
   * operation that takes the timbers out of sight. `country/stringband` is the
   * closest room that still gets them, at 3.150 — 0.040 m of margin, so it is
   * the one to re-measure if either constant moves.
   *
   * ## And where the lid is a member, the purlin goes up behind it
   *
   * The tie stays under `min(headroom, houseLid)`, which is the lowest surface
   * anything spanning the boards *and* the house passes beneath. The purlin is
   * allowed the space between that lid and `deck()` — the surface the lid's
   * member carries — but no more of it than its own depth, because a purlin is
   * a purlin and not a second storey.
   *
   * In the riihi the whole available 0.153–0.160 m goes to it, and the reason
   * that is not cheating is the room's own sentence: it "deliberately has no
   * rafters in it… and lets the `beams` prop put the timber up there", so its
   * `headroom` is boarding rather than a member, measured *at the edge of the
   * boards*, and the roof climbs from there. The purlins stand at
   * `±houseWidth * 0.26`, a good way inboard of that edge, and the boarding over
   * them is at 4.250 in `finnfolk/contemporary` against a 3.690 lid — so 3.844
   * is not through anything and is 0.034 m closer to the boarding than the
   * 3.810 it used to reach. The remaining 0.406 is slope this file cannot see;
   * `rigLid` is stated at the truss's pick and not at the purlin's x, and
   * stretching it to mean "the roof anywhere" is the mistake the field's own
   * docstring forbids.
   *
   * In the shed the deck is 0.470 m and the clamp bites: the purlin takes 0.220
   * of it and stops at 4.986, with the shed's own rafter soffit over that x at
   * 5.057 — let into the frame by 0.07, which is where a purlin lives. And the
   * tie's top lands on 4.766 exactly, which in that room is the plane the frame
   * bears on rather than an arbitrary clearance.
   *
   * No shadows. The one shadow-casting lantern is hung below these, and a
   * timber lit from underneath casting up onto nothing costs a depth pass for a
   * shadow no camera in this show can see.
   */
  beams: (c) => {
    /** A purlin on a tie. Both are timber and the assembly is their sum. */
    const TIE = 0.24;
    const PURLIN = 0.22;
    /**
     * The lowest thing the run goes under. It crosses the boards and the house,
     * so both lids bind and the lower of them is the answer. The one room where
     * they differed was the cellar-height riihi, whose house stood 0.45 m taller
     * than its stage; that room is the one the guard above now turns away, and
     * the `min` is kept because a room with a sloped or stepped roof is a thing
     * this vocabulary still allows.
     */
    /**
     * Boarded over, the timbers are behind the boarding and there is nothing to
     * draw. See the docstring: this used to fall out of the arithmetic, because
     * a cellar's stage soffit was 2.85 m and the assembly needs 3.11 m over
     * `HANG_FLOOR`. One flat lid took the riihi's plaster to 3.30 m and the
     * clearance appeared, which is a reason to *state* the rule rather than a
     * reason to start drawing a roof under a ceiling. Asking whether the other
     * prop is there is what `Ctx.dressed` is for; the answer here is to build
     * nothing, not to build something else.
     */
    if (c.dressed.has('low-ceiling')) return;
    const lid = Math.min(c.m.headroom, houseLid(c.m));
    /** Top of the highest member. See the docstring for both clamps. */
    const top = Number.isFinite(lid)
      ? Math.min(deck(c.m, lid), lid + PURLIN)
      : Math.max(4.3, c.m.openingHeight - 0.3) + TIE + PURLIN;
    // Nothing may reach down into the head band, and unlike a swag there is no
    // give in this one: the depth is the object. See `finnfolk/runo`.
    if (top - TIE - PURLIN < HANG_FLOOR) return;
    const y = top - PURLIN - TIE / 2;
    const span = c.m.houseWidth + 6;
    const from = c.m.backZ - 0.6;
    const to = c.m.lipZ + c.m.houseDepth + 1;
    const n = Math.max(4, Math.min(14, Math.round((to - from) / 2.3)));
    const timber = c.kit.solid(shade(hueShift(c.p.boards, -8, 0.08), 0.42), { rough: 0.96 });
    const ties = new InstancedMesh(c.kit.bevelBox(span, TIE, 0.28, 0.03), timber, n);
    const dummy = new Object3D();
    for (let i = 0; i < n; i++) {
      dummy.position.set(0, y, from + ((i + 0.5) * (to - from)) / n);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      ties.setMatrixAt(i, dummy.matrix);
    }
    c.root.add(ties);
    // Purlins over the ties, running the other way, so the roof is a structure
    // rather than a row of unrelated planks. Seated on the tie rather than
    // floated over it — the two half-depths are the whole of the offset.
    const purlin = c.kit.bevelBox(0.2, PURLIN, to - from, 0.03);
    for (const side of [-1, 1]) {
      put(c, purlin, timber, side * c.m.houseWidth * 0.26, y + TIE / 2 + PURLIN / 2, (from + to) / 2);
    }
  },

  /**
   * Bales, out in the house rather than on the boards.
   *
   * The other half of the barn, and the half that decides which building it is:
   * `beams` over a bare floor is a warehouse, and `beams` over this is a barn
   * dance. One prop, and the room changes century.
   *
   * They are in the *house* on purpose, and it took working out why the obvious
   * placement was wrong. A bale in the wings is set dressing nobody uses, in the
   * half-metre of board between the playing area and the edge, competing for the
   * one spot the flight cases and the amps already want. A bale in the room is
   * furniture: it is what people at a barn dance sit on, it is at the edge of
   * the floor where the crowd is, and it needs no clearance from anything
   * because nothing else this file builds goes there.
   *
   * Stacked in pairs about half the time, because two bales is a seat with a
   * back and a stack of identical boxes at identical heights is a warehouse
   * again.
   */
  hay: (c) => {
    const rng = c.rng('hay');
    const straw = c.kit.solid(tint(hueShift(c.p.boards, 24, 0.22), 0.3), { rough: 1 });
    const bale = c.kit.bevelBox(0.92, 0.44, 0.46, 0.05);
    const placed: { x: number; y: number; z: number; yaw: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (c.m.width / 2 + rng.float(0.6, 1.9));
      /**
       * Pushed clear of any bale already down this side of the floor.
       *
       * Three draws from a 2.9 m range put two of them within a bale's own
       * length of each other about a third of the time, and two bales in one
       * place is not a near miss — they are the same box at the same height, so
       * their tops are one plane and the seat flickers. A bale is 0.92 long, so
       * 1.15 m of clearance is one bale and a gap; walking the draw forward in
       * whole steps keeps it deterministic and keeps it on the same floor.
       */
      let z = c.m.lipZ + rng.float(0.7, 3.6);
      for (let guard = 0; guard < 6; guard++) {
        const clash = placed.some((b) => b.x * side > 0
          && Math.abs(b.x - x) < 1.15 && Math.abs(b.z - z) < 1.15);
        if (!clash) break;
        z += 1.2;
      }
      const yaw = rng.float(-0.45, 0.45) + (side < 0 ? Math.PI : 0);
      placed.push({ x, y: c.m.houseY + 0.22, z, yaw });
      if (rng.chance(0.45)) {
        placed.push({
          x: x + rng.float(-0.08, 0.08), y: c.m.houseY + 0.66,
          z: z + rng.float(-0.06, 0.06), yaw: yaw + rng.float(-0.3, 0.3),
        });
      }
    }
    const bales = new InstancedMesh(bale, straw, placed.length);
    const dummy = new Object3D();
    for (let i = 0; i < placed.length; i++) {
      const b = placed[i]!;
      dummy.position.set(b.x, b.y, b.z);
      dummy.rotation.set(0, b.yaw, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      bales.setMatrixAt(i, dummy.matrix);
    }
    bales.castShadow = true;
    c.root.add(bales);
  },

  // -- the courtyard -------------------------------------------------------

  /**
   * An arcade across the back wall — a riad, a cloister, a patio.
   *
   * The one piece of architecture in this file that is not a modifier, and the
   * line it stays the right side of is worth naming, because `stage.ts` owns
   * how a room is built and is not mine to change. An arcade *in front of* the
   * back wall is an object standing on the boards: it does not alter a surface,
   * a colour or a dimension, and a room that drops it is the same room with a
   * plain cloth behind the band. Arcading the side walls of the house would not
   * be — that is a wall, and it would belong next to `brick`.
   *
   * Horseshoe rather than semicircular: the arc runs a touch past a half turn
   * so the springing tucks back in under itself, which is the difference
   * between Córdoba and a railway viaduct and costs nothing but one constant.
   * Odd number of bays, so one arch is on the centre line and the band stands
   * in front of it rather than in front of a pier.
   *
   * The lintel across the top is doing the same job as the organ's case: an
   * arcade is a *wall with holes in it*, and a row of freestanding hoops with
   * open sky above them is a croquet lawn. The whole run is upstage of the
   * backline and clears the riser's front face by 70 mm, which is the tightest
   * clearance in this file and the reason the depth is 0.32 and not 0.4.
   *
   * ## Where it stands is published, because two other props were standing there
   *
   * The bay module, the pier width and the run's z come out of
   * `arcadeFootprint` now. The expressions are unchanged to the last decimal —
   * they were moved, not rewritten — and the reason they moved is in that
   * function's docstring: `backline` and `paper-lanterns` were both solving into
   * this arcade's 0.32 m of deck with no way to see it, at 0.0907 m³ and 0.0224
   * m³ respectively. "Upstage of the backline" in the paragraph above turns out
   * to have meant `play.backZ`, the cast's margin, and not the prop of the same
   * name, which stands at `backZ + 0.2` — 20 mm upstage of this and the same
   * 0.32 m deep, so a stone pier was inside a wall of amplifiers in every salon
   * that dressed the two.
   */
  arches: (c) => {
    const stone = c.kit.solid(tint(blend(c.p.proscenium, c.p.backdrop, 0.35), 0.22), { rough: 0.92 });
    const run = arcadeFootprint(c.m);
    const bays = run.openings.length;
    const bay = run.bay;
    const pierW = run.pierW;
    /**
     * Half the thickness of the arch's stone. Four things solve against it, and
     * until now none of them could see it.
     *
     * It was a bare 0.16 inside the `TorusGeometry` call below, so the radius
     * was solved as if the ring were a line rather than a pipe 0.32 across, and
     * the pier's depth was a second literal that happened to be the same 0.32.
     * That is the defect the user reported as the curved parts sitting half
     * outside the pillars: with `r` at the half-opening the tube's *centreline*
     * landed on the pier's inner face — `r` minus the half-opening measured
     * 0.0000 on all nine venues that name this prop — so half the pipe hung out
     * over the opening with no stone behind it, 0.1600 of a 0.3200 cap in a
     * half turn and more where the horseshoe tilts the cut face.
     *
     * 0.15 rather than 0.16, for two reasons. It is what `rooms/courtyard.ts`
     * gives its own arcade, and that file says in prose that it is deliberately
     * drawing this same arch — two arcades in one room that were not the same
     * arch would read as two buildings. And it leaves 0.01 m of stone either
     * side of the tube inside the 0.32 m pier instead of 0.0000: at exactly
     * half the depth the tube's flank and the pier's are one plane, and a
     * coincident pair z-fights along the whole ridge of every ring. Deepening
     * the pier to 0.34 would buy the same clearance and spend the 70 mm this
     * arcade has off the riser's front face, which the note above records as
     * the tightest clearance in the file.
     */
    const TUBE = 0.15;
    /** Above the tallest player, and upstage of them all in any case. */
    const spring = Math.max(HEAD_BAND.hi - 0.15, 2.1);
    const z = run.z;
    /**
     * Past a half turn in a riad; a true half turn in a ballroom.
     *
     * The horseshoe was a constant, and a constant is what made it wrong twice.
     *
     * **It landed nowhere.** Sweeping to 208.8° puts the arch's two *ends* below
     * the line the piers were solved against — `r · sin(14.4°)` = 0.163 m below
     * it in the salon — so every arch stopped 0.16 m short of its own pier,
     * springing out of the side of the column with bare stone left above it and
     * the tucked end hanging free into the opening. The x was never wrong: the
     * rings sit on the pier midpoints to the millimetre. It was the overshoot,
     * and only the overshoot. At `Math.PI` exactly the ends land at `y = spring`
     * and `x = ±r`, which is the pier's top and its inner face — the arch sits
     * on the impost, which is what an arch does. (True as it was written, and
     * superseded: an arch that *sits on* the impost is an open pipe end resting
     * on an arris, which is the next defect down the page. `r` and `impost` are
     * now solved off the tube's surface rather than off its centreline, so the
     * ends land inside the pier instead of on it. The overshoot argument above
     * is untouched by that.)
     *
     * **It was in the wrong building.** A horseshoe is Andalusian, and this prop
     * was written for the courtyard: a riad, a cloister, a patio. `latin` names
     * `arches` on the salón genre-wide, so a Havana ballroom was being given a
     * Córdoba arcade, and it read as exactly that to the first person who looked
     * at it. A Spanish colonial hall has an arcade; it does not have that arcade.
     *
     * So the courtyard keeps its overshoot and everyone else gets the half turn
     * that fits their piers. Keying on the architecture rather than a prop flag is
     * deliberate: the horseshoe is a fact about the *building*, and `RoomStyle`
     * is where this file can read one without a genre inventing a name for it.
     *
     * **Known, and unfixed: this is a prop branching on which room it is in.**
     * A builder in this file is not allowed to ask that — everything it needs
     * is supposed to arrive through `StageMetrics` / `RoomShape` — and the test
     * below is exactly that, however good the argument for the two shapes is.
     * The honest fix is an `archOvershoot` on `RoomShape` that the courtyard
     * answers for itself, which is a change in `rooms/types.ts`, in
     * `rooms/courtyard.ts` and in the default every other room falls back to.
     * It has its own blast radius and is left for its own change rather than
     * smuggled in behind a geometry fix.
     */
    const ARC = Math.PI * (c.venue.architecture === 'courtyard' ? 1.16 : 1);
    /** How far past the half turn the arc runs, per end. Zero in a half turn. */
    const o = Math.max(0, (ARC - Math.PI) / 2);
    /**
     * The ring's radius, and it is solved against the **pier** rather than
     * against the opening.
     *
     * It was `(bay - pierW) / 2`, the half-opening, which is where an arch's
     * centreline springs and not where its stone ends. Measured, on all nine
     * venues that name this prop: `r` came out equal to the half-opening to the
     * last decimal place, so every cut face stood proud of the pier's inner
     * face out over the opening — and both ends of the tube are open geometry,
     * see the rings below. In the five semicircular rooms 0.1600 of the 0.3200
     * cap was over the void and all four of its corners landed at the pier top
     * *exactly*, so the open end was fully exposed at springing height; in the
     * four horseshoe rooms the tilt makes it worse, 0.1731 to 0.1755 inside the
     * opening with the top corner 0.0398 **above** the pier it springs from.
     *
     * Read the expression as: take the half-opening, lift it by the tube radius
     * in quadrature so the cut face's inner *corner* clears the pier rather
     * than its centreline landing on it, project that out along the springing
     * radius — the arc ends `o` past the horizontal, 14.4 degrees in a
     * courtyard and nothing anywhere else — and hand the tube radius back.
     *
     * The quadrature is not ornament. `a / cos(o) + TUBE` puts that inner
     * corner back on the pier's inner face at 0.0000 in every semicircular
     * room, which is a coincident plane and the same flicker again; `hypot(a,
     * TUBE) - a` is exactly the margin it fails to buy, and it is 0.0141 m in
     * the sabha's 1.58 m opening rising to 0.0192 in the tightest courtyard
     * bay. `rooms/courtyard.ts` reached the same expression for its own arcade.
     */
    const r = Math.hypot((bay - pierW) / 2, TUBE) / Math.cos(o) + TUBE;

    /**
     * The impost — where the pier stops and the arch takes over.
     *
     * Not `spring`, and the difference is the whole of what was wrong with the
     * horseshoe. `spring` is the *centre* of the ring; the arch's two ends are
     * `r · sin(overshoot)` below it, because sweeping past a half turn is
     * exactly what carries them down there. Standing the piers up to `spring`
     * therefore built a column that finished 0.163 m above the thing it was
     * supposed to be carrying, and left the arch's tucked end hanging over the
     * opening with bare stone above it.
     *
     * Solved rather than trimmed by a constant, so it stays right at any bay
     * width, and so the overshoot term is identically zero for a half turn and
     * nothing here has to branch.
     *
     * **And one tube radius on top of it**, because a pier must finish above
     * the arch's *end* and not above its centreline. Without that term the cut
     * face's top corners land at `y = impost` exactly — measured at 0.0000 on
     * all five semicircular venues, and at 0.0398 *above* the pier where the
     * horseshoe tilts the face — so the open end of the pipe sat on the pier's
     * cap in full view, and sat on it badly: `bevelBox` rounds the pier's top
     * face by 0.03 a side, so the corner it was standing on is a fillet rather
     * than a flat. With `+ TUBE` the whole cut face is 0.1500 below the pier
     * top in a half turn (one tube radius, by construction) and 0.1127 below it
     * in a horseshoe.
     */
    const impost = spring - r * Math.sin(o) + TUBE;

    const dummy = new Object3D();
    const piers = new InstancedMesh(c.kit.bevelBox(pierW, impost, 0.32, 0.03), stone, bays + 1);
    for (let i = 0; i <= bays; i++) {
      dummy.position.set((i - bays / 2) * bay, impost / 2, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      piers.setMatrixAt(i, dummy.matrix);
    }
    piers.castShadow = true;
    c.root.add(piers);

    /**
     * The arches themselves, and **both ends of every one of them are open.**
     *
     * `TorusGeometry` emits no cap: the index buffer holds zero triangles
     * inside either end ring, and the material is `FrontSide`, so a cut end
     * facing the house is a hole with the inside of the far wall of the pipe
     * visible through it. Nothing here closes it and nothing should — three.js
     * will not build the cap, and `DoubleSide` would buy it by giving up
     * correct shading on every piece of stone in the arcade, `stone` being the
     * one material the piers, the rings and the lintel share.
     *
     * What hides them is that they are buried, and that is the whole of the
     * fix: `r` puts each cut face 0.0141 to 0.0192 m inside the pier's inner
     * face, and `impost` puts its top corner 0.1127 to 0.1500 m below the pier
     * top. Both ends are stone on every face, with 0.10 to 0.11 m of pier still
     * showing outboard of the arch as an impost setback. So do not re-derive
     * `impost` from `spring`, and do not solve `r` from the half-opening:
     * either one un-buries an open pipe end at springing height, which is
     * exactly what the user reported seeing through.
     */
    const rings = new InstancedMesh(
      c.kit.geometry(`arch|${r.toFixed(3)}`, () => new TorusGeometry(r, TUBE, 4, 10, ARC)),
      stone, bays,
    );
    for (let i = 0; i < bays; i++) {
      // `run.openings` — the same centres the two props that clear this arcade
      // are handed, so there is one answer to where an arch is.
      dummy.position.set(run.openings[i]!, spring, z);
      // The arc starts at angle zero, so swing it back by half the overshoot to
      // stand it symmetrically on its own two piers.
      dummy.rotation.set(0, 0, Math.PI / 2 - ARC / 2);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      rings.setMatrixAt(i, dummy.matrix);
    }
    rings.castShadow = true;
    c.root.add(rings);
    // Seated on the crown rather than floated off the centreline. The extrados
    // is `r + TUBE` above `spring`, and half the beam's own 0.36 depth puts its
    // underside exactly there. It was `spring + r + 0.36`, which is the same
    // arithmetic with the tube left out: half the beam, 0.18, against a crown
    // that stood at 0.16, leaving a measured 0.0200 slot of daylight over the
    // top of every arch in all nine venues. Now 0.0000 in all nine.
    put(c, c.kit.bevelBox(c.m.openingWidth + pierW, 0.36, 0.34, 0.03), stone,
      0, spring + r + TUBE + 0.18, z, true);
  },

  // -- the arena -----------------------------------------------------------

  /**
   * Lighting lattice over the stage — flown where the room has a roof over the
   * boards, and standing on its own legs where it has not.
   *
   * A truss is a goalpost in the mind's eye: two towers and a beam. It cannot
   * be one *in a theatre*, and the reason is a number rather than an opinion.
   * The proscenium opening is 0.94 of the stage width, so the strip of board
   * that is both inside the opening and outside the playing area is about a
   * *handspan* on a nine-metre stage and narrower on a wide one. A tower with
   * its feet in that strip is invisible behind the arch leg; a tower wide
   * enough to read is standing where the guitarist is. There is nowhere on
   * these boards for a ground support to stand.
   *
   * Flown is not a consolation prize — it is what an arena rig actually is, and
   * it solves the sightline for free by living above everything. Two runs, one
   * over the fly bar and one upstage over the backline, because a single bar
   * reads as a scaffolding pole and two parallel ones read as a rig.
   *
   * ## What each end is held up by, and the three answers the room gives
   *
   * This used to be one answer — a stub of `Math.max(0.3, …)` at each end,
   * "going up out of frame, which is where the motors would be" — and the
   * arithmetic under it was wrong in every branch at once. Measured:
   *
   * **Under a lid** the 0.3 m floor silently overrode the tuck. `y` is
   * `headroom - 0.28`, so the honest reach is `0.28 - S = 0.11 m`, always less
   * than 0.3, so the floor always won and every stub stood `headroom + 0.19`
   * proud of the ceiling it was supposed to die into — 4.822 against a
   * courtyard awning at 4.632, 3.420 against a dancehall's plaster at 3.15,
   * with the chord itself already 5 mm through that one. Nobody can get above
   * the lid to see it, which is why this is the branch the other two are built
   * on rather than the one that looked broken. So the clauses are split: `y` is
   * clamped so the chord's own 35 mm radius never crosses the lid, and the rise
   * is exactly what is left. Under 0.05 m there is no drop at all — at a 3.15 m
   * ceiling a truss is bolted to the roof steel and has no motors, which is
   * true of every real room that low.
   *
   * **Inside a building with no lid over the boards** — a fly tower, which is
   * why `headroom` is honestly `Infinity` there and `houseLid` is not — the
   * stub reaches `openingHeight + 1.2`, and `ballroom.ts` has built a real
   * timber grid batten at exactly that height *because* this expression reaches
   * for it. It missed it twice. In x, `len / 2` put the drop 0.10 m outboard of
   * a batten that is `openingWidth + 1.6` wide, so a ray up from the top chord
   * hit nothing; the pick is 0.4 m in from the tip now, which lands 0.30 m
   * inside the timber in every ballroom venue and still 0.5 m outboard of the
   * opening, so it dies behind the masking as before. In z the batten is on the
   * fly bar, over `runs[0]` only, so the upstage pair rose 1.27 m with nothing
   * above them anywhere — that run gets no drops. `houseLid` cannot rescue it
   * and tucking under it would be wrong: that plane is built over the *house*,
   * and over the boards there is a tower.
   *
   * **Under open sky** the prop must stop inventing a height. In a circuit
   * `openingHeight + 1.2` is 7.95 m against roof steel the room really models
   * at 9.77–10.53, so the stub ended with two and a half metres of air over it
   * — in the one room with no proscenium header, where `ceiling()` is
   * `Infinity` and the viewer's orbit can be flown up to the girders. The room
   * refuses to publish that roof for good reasons of its own, so the honest
   * answer is the other one: a leg to the floor. That is what an arena rig is,
   * it is the same three draw calls, and the feet land 1.45 m outboard of the
   * boards on the arena floor, well inside the hall.
   *
   * ## The lid is not the surface, and in three rooms it is 0.15 to 0.47 m off
   *
   * The first clause above is still right about *where* the drop stops and was
   * wrong about *what* it stops on. `headroom` is a clearance plane — the lowest
   * thing in a lens's way — and where the lid is a member rather than a sheet,
   * the steel a motor is shackled to is behind it. Measured, firing a ray
   * straight up from the top of every drop, before: **0.000 m** to a courtyard
   * awning at 4.632 and **0.005 m** to a dance-hall plaster at 3.150, both of
   * which were already right, against **0.534 m** to shed sheeting at 5.300,
   * **0.154 m** to riihi boarding at 3.844 and **0.160 m** to a salon panel at
   * 5.510. Six venues in the shed's roof, one in the barn's, one in the salon's
   * — eight of the twenty-three that can draw a truss, ending in air above a lid
   * nobody can climb over to notice. So the reach is `deck()`, which
   * is `rigLid` where the room publishes one and `headroom` where it does not,
   * and the `y` clamp below is untouched: a drop may go *up* through a rafter
   * and nothing may come *down* through a ceiling.
   *
   * One behaviour change worth stating because it will look like a bug. In
   * `dnb/design` two of the eight posts now pass through a rafter whose soffit
   * is at 4.848 and stop under the deck at 5.236; the other six have clear air
   * to the sheeting at 5.300. That is a drop bolted *through* a member to the
   * steel above it, which is what a scaff bolt does, and it is the correct
   * reading — the alternative is six posts on the roof and two stopping short of
   * it for no reason a viewer can see.
   *
   * ## Being held and *reading* as held are different problems
   *
   * The clause above closes the geometry and does nothing at all for the
   * picture, which was the complaint. In `arabic/satellite` the posts are
   * **0.110 m** long and land on the awning at 0.000 — perfectly correct, and
   * from the house it is a lighting rack floating in the dark, because 11 cm of
   * 70 mm pipe against an unlit ceiling is nothing to see. Below 0.05 m there is
   * no post at all, by the rule above, so the two lowest rooms had no visible
   * attachment whatsoever.
   *
   * What a truss has where it meets the steel is *hardware* — a shackle, a
   * clamp bracket, a motor body — and hardware is a small object with a
   * silhouette rather than a long thin pipe. So there is a block at each pick,
   * 0.30 by 0.26 by 0.56, hung with its crown flush with the top chord's own
   * crown. At 8 m that is **1.86°** of vertical silhouette where the 0.110 m
   * post gave 0.79°, and **ten times** the frontal area (0.078 m² against
   * 0.0077 m²) — enough that the join is legible with no drop at all,
   * which is the case that had to work. Under open sky the block goes under the
   * *bottom* chord instead: the leg arrives from below there and this is a
   * ground-support tower head.
   *
   * Flush with the crown rather than above it, and that is forced rather than
   * chosen. In `country/outlaw` and both hip-hop clubs the chord's own 35 mm
   * radius already touches a 3.150 m ceiling — there is no air over the truss at
   * all, which is the whole reason those rooms get no drop — so hardware that
   * sat on top of the chord would sit in the plaster. It hangs into the lattice
   * instead, where it is still the only solid thing in a section made of 32 mm
   * struts you can see the room through, and it stands 0.075 m proud of the
   * chords in z so the block breaks the truss's outline from any three-quarter
   * angle rather than hiding inside it.
   *
   * It overlaps the two or three braces nearest the pick. That is deliberate and
   * it is the same trade as the verticals being "buried 35 mm" in their chords:
   * a clamp that floats clear of the lattice is a box in the air, and a clamp
   * that eats a strut is a clamp.
   *
   * It also buys one collision with another prop, and it is worth writing down
   * where it came from. `finnfolk/contemporary` names `beams` as well as this,
   * and that room's downstage truss run lands at z = 1.700 with a tie beam at
   * **1.725** — 25 mm apart, by coincidence of two independent z series. The
   * chords are 70 mm and slipped past it; a 0.56 m block does not, and the
   * intersection is 0.0194 m³ at the one pick. Left alone rather than dodged,
   * because the only dodge available is a narrower block, the narrower block is
   * the defect this section exists to fix, and a truss clamped to the tie beam
   * over it is a thing that happens in barns.
   *
   * ## Length, and the one room the overrun ran out of
   *
   * The ends overrun the opening by 0.9 m so they die behind the masking —
   * true in a theatre, and in a barn it ran them out through the roof.
   * `riihi`'s `headroom` is the gable *soffit*, not the sheeting: the roof
   * falls 0.375 m/m from a 5.45 m ridge, so a 12.20 m truss in a 10.40 m barn
   * put the last 0.70 m of each end above the boarding and both motor stubs
   * outside the building, where a `DoubleSide` roof shows them against the sky.
   * So under a lid the length is capped at the room's own width: a room with a
   * roof over its boards has no roof wider than its boards, `shed` and `riihi`
   * being the two that prove it. The cap is deliberately *not* applied in the
   * open-air branch, where there is no roof to run through and where taking it
   * would cost the ballroom most of its 0.9 m of masking overrun and pull the
   * motor picks inside the aperture.
   *
   * ## The one place in this file that does not use `bevelBox`
   *
   * A hundred and eight diagonal braces at 108 triangles each is 11.7k
   * triangles of bevel — it was 52 braces and 5.6k when only one face of the
   * truss was laced, which was itself the defect below. A bevel is the house
   * style because it catches a highlight along an edge and stops a box reading
   * as a rendering; a 32 mm strut seen from six metres has no edge to catch
   * anything on, and the rounding is a cost with no picture attached. Plain
   * boxes, and the prop stays at a tenth of what it would be.
   *
   * The count doubled because the lacing was only ever on one face. Every brace
   * went to `z - S`, so the two chords at `z + S` were a rigid pair joined to
   * nothing — and since `runs[0]` is `curtainZ - 1.1`, the bare pair was the
   * one pointing at the audience: from the house, the front of the downstage
   * truss was two 70 mm pipes 0.34 m apart with the lacing visible behind them,
   * 2.78 m over a dancehall's band. That unattached pair is what the float scan
   * was reporting as a one-part cluster in shed, dancehall, salon and courtyard
   * — those rooms' drops do reach the lid, and it was one chord pair adrift.
   * Both faces are laced now and the zig-zag is mirrored, so the section reads
   * as a box rather than as a parallelogram. That argument was about bevelling
   * and not about lacing, so it survives; only its arithmetic needed restating.
   *
   * Everything repeated is instanced — the chords, the braces and the verticals
   * are three draw calls between them rather than fourteen meshes, which is
   * what the rest of this file does everywhere it places more than two of a
   * thing.
   */
  truss: (c) => {
    const steel = c.kit.solid(shade(tint(c.p.proscenium, 0.3), 0.35), { metal: 0.75, rough: 0.4 });
    /** Half the truss section. A 0.34 m square is a light-duty rigging truss. */
    const S = 0.17;
    /** The lid over the *boards*. `Infinity` under a fly tower or the sky. */
    const lid = c.m.headroom;
    const lidded = Number.isFinite(lid);
    const y = lidded
      ? Math.max(
        // Never low enough to put the bottom chord's own surface into the
        // clearance the head band is owed. Under about 2.9 m of lid nothing can
        // be both under the ceiling and over everybody — the section alone is
        // 0.41 m — and going up through plaster that no camera under it can see
        // is the right way to fail that.
        HANG_FLOOR + S + 0.035,
        // `- S - 0.035` keeps the top chord's own surface under the lid; the
        // `- 0.28` trim is what it takes when the room is tall enough to give
        // it. The old `max(0.3, …)` on the rise below was written for the
        // open-air clause and silently won this one instead.
        Math.min(lid - S - 0.035, Math.max(HANG_FLOOR + 0.3, lid - 0.28)),
      )
      : c.m.flyY + 0.34;
    const len = lidded ? Math.min(c.m.openingWidth + 1.8, c.m.width) : c.m.openingWidth + 1.8;
    /**
     * Two runs where both can be held up, one where only one can.
     *
     * The two-run rule is in the docstring above and it is right: a single bar
     * reads as a scaffolding pole and two parallel ones read as a rig. It was
     * being applied one step too early. In a stage-house room — `headroom`
     * `Infinity` over the boards with a real plaster ceiling over the house —
     * the only thing in that dark void is the room's own grid batten, and the
     * batten is on the fly bar's line. The upstage run had nothing over it at
     * any x, so it was built and then given no verticals, and 29 pieces of
     * lattice hung in the ballroom's void with a 2.61 m gap under them.
     *
     * Dropping the run is the fix rather than raising verticals off it, because
     * verticals off it would end in the same void 1.27 m higher up — the defect
     * moved rather than solved, and moved to the one place a camera pitching up
     * over the header is looking. One run that is held is a rig; two runs where
     * one is flying is a mistake with a second copy of itself in it.
     */
    const runs = lidded || !Number.isFinite(houseLid(c.m))
      ? [c.m.curtainZ - 1.1, c.m.backZ + 0.9]
      : [c.m.curtainZ - 1.1];
    const perRun = Math.max(6, Math.round(len / 0.5));
    /**
     * Where a vertical member stands: 0.4 m in from the tip, over a chord.
     *
     * Two per end rather than one, because a pick on the truss's centre z — one
     * pipe up the middle, which is what this drew — touches neither chord. It
     * is 0.10 m clear of both, so each face of the lattice was left hanging on
     * nothing while a pole rose between them. `z ± S` puts each vertical on the
     * top chord it is picking, buried 35 mm into it, and from the house the two
     * overlap in screen space and read as one.
     *
     * The one clearance this costs is at the far end, and it is small: the
     * ballroom's grid batten is 0.22 m deep, so a vertical at `z ± S` lands
     * 0.025 m off the timber's face rather than through its middle. A quarter
     * of a handspan, six metres up behind the header, against a lattice that is
     * actually attached to itself.
     */
    const pick = len / 2 - 0.4;

    /**
     * The hardware at the pick, and how big it has to be to count.
     *
     * A hoist body across the two top chords. See the docstring's section on
     * why the drop alone cannot carry the reading: 0.30 by 0.26 of block against
     * 0.070 m of pipe is a **1.86° silhouette** at 8 m instead of 0.79°, ten
     * times the area, and it is there at *any* drop length from zero up.
     *
     * `HOLD_D` is the one that has to be argued. The chords are at `z ± S` and
     * 70 mm thick, so the pair is 0.41 m across the outside; 0.56 bridges both
     * and stands **0.075 m proud of each**, which is what stops the block being
     * a solid the lattice hides. It is also a solid mass inside an open
     * lattice, which is a strong event in its own right — the braces are 32 mm
     * and you can see the room through them.
     */
    const HOLD_W = 0.30;
    const HOLD_H = 0.26;
    const HOLD_D = 0.56;

    /** How long the vertical is, where its centre sits, and which runs get one. */
    let holdH: number;
    let holdY: number;
    let holdAt: readonly number[];
    /** Centre of the hardware: on the top chord, or under the bottom one. */
    let headY: number;
    if (lidded) {
      // `deck()`, not the lid. `headroom` is what a lens must clear and a motor
      // drop dies into the surface behind it — 0.470 m behind in the shed,
      // 0.153 in the riihi, 0.160 in the salon. See the docstring.
      holdH = Math.max(0, deck(c.m, lid) - (y + S));
      holdY = y + S + holdH / 2;
      holdAt = runs;
      // Crown flush with the top chord's own crown, which the `y` clamp above
      // guarantees is under the lid. Everything else hangs below it.
      headY = y + S + 0.035 - HOLD_H / 2;
    } else if (Number.isFinite(houseLid(c.m))) {
      // A roofed building whose stage is under a tower: the grid is up there
      // even where the room has not modelled one, and only the fly bar's run
      // has anything over it — which is why `runs` above is one run here, and
      // why every run there is gets held.
      holdH = Math.max(0, c.m.openingHeight + 1.2 - (y + S));
      holdY = y + S + holdH / 2;
      holdAt = runs;
      headY = y + S + 0.035 - HOLD_H / 2;
    } else {
      // Open sky. The foot goes on whichever surface is under the pick — the
      // boards if the truss is narrower than they are, the house floor if it
      // overhangs them, which it does in both rooms that reach this today.
      const foot = pick <= c.m.width / 2 ? 0 : c.m.houseY;
      holdH = Math.max(0, y - S - foot);
      holdY = (y - S + foot) / 2;
      // Under the bottom chord here, because the leg arrives from below: this
      // is the head of a ground-support tower and the truss sits on it.
      headY = y - S - 0.035 - HOLD_H / 2;
      holdAt = runs;
    }
    /** Below this there is nothing to draw: the steel is already on the lid. */
    const holds = holdH >= 0.05 ? holdAt.length * 4 : 0;

    const chords = new InstancedMesh(
      c.kit.geometry(`truss-chord|${len.toFixed(2)}`,
        () => new CylinderGeometry(0.035, 0.035, len, 6)),
      steel, runs.length * 4,
    );
    const braces = new InstancedMesh(
      c.kit.geometry('truss-brace', () => new BoxGeometry(0.032, 0.42, 0.032)),
      steel, runs.length * perRun * 2,
    );

    const dummy = new Object3D();
    let ci = 0;
    let bi = 0;
    for (const z of runs) {
      for (const dy of [-S, S]) {
        for (const dz of [-S, S]) {
          dummy.position.set(0, y + dy, z + dz);
          dummy.rotation.set(0, 0, Math.PI / 2);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          chords.setMatrixAt(ci++, dummy.matrix);
        }
      }
      for (const face of [-S, S]) {
        for (let i = 0; i < perRun; i++) {
          const tilt = i % 2 === 0 ? 0.72 : -0.72;
          dummy.position.set((i - (perRun - 1) / 2) * (len / perRun), y, z + face);
          // Mirrored on the downstage face, so the two zig-zags meet at the
          // chords and the section reads as a box seen from any angle.
          dummy.rotation.set(0, 0, face === S ? -tilt : tilt);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          braces.setMatrixAt(bi++, dummy.matrix);
        }
      }
    }
    c.root.add(chords);
    c.root.add(braces);

    // The hardware, before the drop and unconditionally — it is the half of the
    // attachment that has to survive `holds === 0`.
    const heads = new InstancedMesh(
      c.kit.bevelBox(HOLD_W, HOLD_H, HOLD_D, 0.035), steel, holdAt.length * 2,
    );
    let hj = 0;
    for (const z of holdAt) {
      for (const side of [-1, 1]) {
        dummy.position.set(side * pick, headY, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        heads.setMatrixAt(hj++, dummy.matrix);
      }
    }
    c.root.add(heads);

    if (holds === 0) return;
    const posts = new InstancedMesh(
      c.kit.geometry(`truss-post|${holdH.toFixed(2)}`,
        () => new CylinderGeometry(0.035, 0.035, holdH, 6)),
      steel, holds,
    );
    let pi = 0;
    for (const z of holdAt) {
      for (const side of [-1, 1]) {
        for (const face of [-S, S]) {
          dummy.position.set(side * pick, holdY, z + face);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          posts.setMatrixAt(pi++, dummy.matrix);
        }
      }
    }
    c.root.add(posts);
  },

  /**
   * An LED wall behind the band. The `projection` of a different forty years.
   *
   * They are not the same object and the room can tell. `projection` is a lamp
   * throwing soft light onto a cloth: additive, vignetted, edgeless, and the
   * whole reason it suits ambient is that you cannot say where it stops. A
   * screen is the opposite in every one of those — a hard rectangle in a frame,
   * bright enough to silhouette the people standing in front of it, made of
   * panels you can count. Handing a hip-hop stage the film projector would be
   * the same category of wrong as handing a 1968 jazz cellar a video wall.
   *
   * Panels rather than pixels: `cellPlane` with half-metre cells and a hard
   * jitter is a wall of tiles at slightly different brightnesses, which is what
   * a real one looks like at any distance a camera stands. The cells are white
   * and all the colour arrives through `material.color`, which multiplies them
   * — so the drift over the show is one `Color.lerp` a frame instead of
   * rewriting a vertex buffer, and the wall still takes the room's palette.
   *
   * Unlit, because it emits. This is the case the low ceiling's emissive
   * experiment was *not*: a ceiling is a surface that reflects the room's light
   * and faking that with emissive breaks in every cue, whereas a screen is a
   * light source, goes on being a light source in a blackout, and would be
   * wrong to dim with the lanterns.
   */
  screen: (c) => {
    const rng = c.rng('screen');
    const w = Math.min(c.m.width * 0.88, c.m.openingWidth * 0.92);
    const h = Math.min(w * 0.5, c.m.openingHeight * 0.66);
    const y = Math.max(h / 2 + 0.35, c.m.openingHeight * 0.5);
    // Behind it, so the edge of the picture is a bezel rather than a cut-out.
    put(c, c.kit.bevelBox(w + 0.24, h + 0.24, 0.12, 0.03),
      c.kit.solid(shade(c.p.backdrop, 0.75), { rough: 0.8 }), 0, y, c.m.backZ - 0.02);
    const mat = c.kit.material('led-wall', () => new MeshBasicMaterial({ vertexColors: true }));
    put(c, c.kit.own(cellPlane({
      width: w, height: h,
      cols: Math.max(8, Math.round(w / 0.5)),
      rows: Math.max(5, Math.round(h / 0.5)),
      colour: '#ffffff', jitter: 0.22, rng,
    })), mat, 0, y, c.m.backZ + 0.05);
    const a = new Color(tint(c.p.ambient, 0.1));
    const b = new Color(hueShift(c.p.curtain, 40, 0.25));
    c.tick((t) => {
      mat.color.copy(a).lerp(b, 0.5 + 0.5 * Math.sin(t * 0.19 * c.idle));
    });
  },

  /**
   * The steel across the pit, and the gap of empty floor in front of it.
   *
   * `railing` does not already cover this, and the two are worth keeping apart
   * because they are in different rooms. `railing` is a wooden rail on the
   * *stage*, along the lip, and what it says is that the boards are a platform
   * in the open air with a dance floor beyond — a tanssilava. This stands in
   * the *house*, a metre downstage of the lip, and what it says is that a crowd
   * is pressing forward hard enough to need holding back. Give an arena the
   * pavilion's rail and you have put a garden fence on the stage.
   *
   * The gap is the prop as much as the steel is. A barrier flush against the
   * front row would be a handrail; the empty metre between it and the boards is
   * the photograph — it is where the security stand, and it is the only piece of
   * floor in an arena nobody is allowed on. So it sits at `lipZ + 0.82` with
   * its feet pointing upstage into that gap, which also clears the front row's
   * bodies by 0.15 m rather than by luck.
   *
   * ## One datum, three heights, two gaps
   *
   * Every piece here is solved against `c.m.houseY` and that is right — the
   * barrier stands in the house, and the feet prove it: a 0.06 m box centred at
   * `houseY + 0.03` has its underside dead on the floor, which is why the float
   * scan never reported *them*. The defect was entirely internal. The three
   * heights were each picked alone and none of them met the next:
   *
   *     feet    houseY + 0.00 .. + 0.06
   *     panel   houseY + 0.35 .. + 0.97      0.35 m of air under it
   *     rail    houseY + 1.04 .. + 1.12      and a 0.07 m slot over it
   *
   * — a barrier in three floating layers, identical to the millimetre in all
   * sixteen shows that carry it. Mostly screened by the front row's bodies, but
   * plainly visible in four ways: on a lawn the rail tops out 0.33 m *above*
   * the deck, so both slots are silhouetted against the lit stage face; from
   * any lens the viewer has dragged down into the pit, which `camera.ts`
   * explicitly permits and which is the one metre of floor this comment calls
   * the photograph; from an elevated house shot tilted down into it; and in
   * shadow, since both the rail and the panel cast and the wash threw a barrier
   * shadow with a break in it and nothing joining it to its feet.
   *
   * The panel is the piece that moves, and it has to be the panel: `houseY +
   * 1.08` is quoted as a fixed cross-file number by three rooms — `lawn.ts`
   * chose `LAWN_RISE` from it, `circuit.ts` chose `DECK_MAX` from it, and
   * `dancehall.ts` fits its corner steps into the 0.31 m it leaves — and the
   * panel is the only piece nothing outside this builder reads. So it grows to
   * meet both: 1.04 m tall centred at `houseY + 0.52`, floor to rail underside,
   * both contacts exact rather than within a tolerance.
   *
   * Rejected: stopping it at the top of the feet (0.98 tall at `+ 0.55`) closes
   * the visible break and leaves a 60 mm slot of lit floor running the whole
   * 15–17 m, which from a lens in the pit is a bright line and not a kick
   * space. A real pit barrier is a continuous sheet to the deck with the plate
   * on the ground, so the sheet goes to the deck.
   *
   * Two consequences, stated rather than discovered later. Where `dance-floor`
   * is also named the parquet sits at `houseY + 0.02` across the middle 70% of
   * the house, so the panel's lowest 20 mm is *under* the parquet there and
   * above bare floor at the ends — buried, which is the right failure direction
   * and the reason not to split the difference at `+ 0.02`. And each panel's
   * ends land 15 mm inside their foot box, which is interpenetration inside
   * opaque steel with no coplanar pair; trimming the panel to `seg - 0.12`
   * instead would make those two faces coplanar, which is worse.
   */
  'crowd-barrier': (c) => {
    const steel = c.kit.solid(shade(tint(c.p.proscenium, 0.3), 0.42), { metal: 0.65, rough: 0.42 });
    const span = c.m.houseWidth * 0.92;
    const n = Math.max(4, Math.round(span / 1.18));
    const seg = span / n;
    const z = c.m.lipZ + 0.82;
    // Bevel on the rail, which is the one part at hand height and the only part
    // a light ever runs along; a flat panel and a foot on the floor get plain
    // boxes and a plane. See the note on `truss` — the same arithmetic, and
    // this was the second most expensive prop in the room before it.
    const rail = new InstancedMesh(c.kit.bevelBox(seg - 0.05, 0.08, 0.08, 0.035), steel, n);
    const panel = new InstancedMesh(
      c.kit.geometry(`barrier-panel|${seg.toFixed(3)}`, () => new PlaneGeometry(seg - 0.09, 1.04)),
      c.kit.solid(shade(c.p.backdrop, 0.62), { metal: 0.4, rough: 0.7, side: DoubleSide }), n,
    );
    const feet = new InstancedMesh(
      c.kit.geometry('barrier-foot', () => new BoxGeometry(0.12, 0.06, 0.66)), steel, n + 1);
    const dummy = new Object3D();
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * seg;
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.position.set(x, c.m.houseY + 1.08, z);
      dummy.updateMatrix();
      rail.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, c.m.houseY + 0.52, z);
      dummy.updateMatrix();
      panel.setMatrixAt(i, dummy.matrix);
    }
    for (let i = 0; i <= n; i++) {
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.position.set((i - n / 2) * seg, c.m.houseY + 0.03, z - 0.28);
      dummy.updateMatrix();
      feet.setMatrixAt(i, dummy.matrix);
    }
    rail.castShadow = true;
    panel.castShadow = true;
    c.root.add(rail);
    c.root.add(panel);
    c.root.add(feet);
  },

  // -- any stage -----------------------------------------------------------

  /**
   * The house speakers, on poles in the wings.
   *
   * ## They used to stand in the band, and this file could not see that they did
   *
   * A 1.0 × 0.7 m stack at `±(width / 2 - 0.7)` on `backZ + 1.3` is inside the
   * playing area on both axes: `play.halfX` is `width / 2 - 0.5`, so 0.7 m of
   * cabinet reached in past the band's own side limit, and 1.3 m off the back
   * wall is the back line itself — `cast.ts` puts the drum riser at `backZ +
   * 1.45` and `layoutModulars` stands a wall of cabinets at exactly that z. On
   * the synth hall (10 × 6.6) the two overlap: the PA occupies x ∈ [3.8, 4.8],
   * z ∈ [−2.35, −1.65], and a modular's outboard wing — 0.62 m upstage of its
   * player, 0.32 deep, toed in 19° — occupies x ∈ [3.9, 4.5], z ∈ [−2.7,
   * −2.22]. A speaker through a synthesiser, every number that casts one.
   *
   * The cast is not at fault and there is no x to move it to. A modular player
   * declares a 1.1 m footprint and `layoutModulars` places them at `xLimit - r`,
   * so the rig fills the playing area *to* its edge and no further. What is left
   * outside is the 0.5 m wing, and no floor-standing PA fits in half a metre.
   *
   * ## So it goes up, which is what the vocabulary said it was all along
   *
   * `venue.ts` calls this prop "speakers, flown or on poles" and it was neither.
   * On a pole the footprint on the boards is 0.4 m of base plate, which fits the
   * wing with room to spare, and the box itself clears `HEAD_BAND.hi` — so the
   * 0.2 m by which it overhangs the playing area is 0.2 m of air above every
   * head in the band, which is the same bargain every hanging prop in this file
   * already makes. Nothing on the deck can collide with it at any cast.
   *
   * Three numbers do the work and none of them is new:
   *
   * - **x** is `drapes`' answer to where a wing is — never inside the band,
   *   never off the deck — and the pole stands in the middle of whatever that
   *   leaves. See `paFootprint`. The wing is half a metre and the box is 0.9,
   *   so it has to overhang *something*; it overhangs the band, in the air, and
   *   not the deck edge, where it would be a floater over the house floor.
   * - **y** is the head band, and the box is **scaled** to whatever is left
   *   between it and the room's own lid rather than trimmed to a height. The
   *   trim-only version put 0.169 m of cabinet through a shed's 2.950 m roof in
   *   three venues: under a low lid there is no height at which a full-size box
   *   both clears the heads and clears the plaster, so the box gets smaller,
   *   which is what a top box in a low room is. `HEAD_BAND.hi` rather than
   *   `HANG_FLOOR`, because that constant is owed to a run strung *over* the
   *   band and this is 0.2 m of overhang at the extreme wing.
   * - **z** is `backZ + 1.6`, 0.3 m upstage of where the stack stood. Not for
   *   the cast — nothing on the deck can reach this prop now — but for `truss`,
   *   whose upstage run is a 0.34 m section on `backZ + 0.9` trimmed to
   *   `HANG_FLOOR + 0.205` in exactly the low rooms where this box is trimmed
   *   down to meet it. They shared 0.0062 m³ in two venues. Downstage was never
   *   available: that end of the deck is the front line, the curtain at
   *   `curtainZ` and the wedges.
   *
   * One box rather than two stacked. A pole carries a top box; the sub it would
   * have sat on is the half of the old prop that was standing in the band.
   */
  'pa-stack': (c) => {
    const box = c.kit.solid(shade(c.p.backdrop, 0.55), { rough: 0.85 });
    const grille = c.kit.solid(shade(c.p.backdrop, 0.78), { rough: 0.95 });
    const steel = c.kit.solid(shade(c.p.proscenium, 0.55), { metal: 0.65, rough: 0.4 });

    const BOX_W = 0.9;
    const BOX_H = 0.62;
    const BOX_D = 0.52;
    const { x: x0, z } = paFootprint(c.m);
    // Aimed down at the house. A top box on a pole is never level: it is trimmed
    // above the heads and then tipped back at the people it is for.
    const TILT = 0.22;
    /** The bottom of the box, and the height of the pole under it. */
    const trim = HEAD_BAND.hi + 0.05;
    /** What a full-size box stands in, tilt included — this is a bounding box. */
    const full = BOX_H * Math.cos(TILT) + BOX_D * Math.sin(TILT);
    /**
     * Shrink to the gap between the heads and the lid, and no further than half.
     * A box under 0.45 has stopped being a speaker and become a smoke detector;
     * the shallowest lid in the catalogue asks for 0.49, so the floor is a guard
     * rather than a number anything reaches.
     */
    const fit = Math.max(0.45, Math.min(1,
      (Math.min(c.m.openingHeight, c.m.headroom) - 0.15 - trim) / full));

    const plate = c.kit.geometry('pa-plate',
      () => new CylinderGeometry(PA_BASE_R - 0.02, PA_BASE_R, 0.06, 12));
    const mast = c.kit.geometry('pa-pole', () => new CylinderGeometry(0.045, 0.05, 1, 10));
    const cone = c.kit.geometry('pa-driver', () => new CylinderGeometry(0.2, 0.2, 0.04, 14));
    const horn = c.kit.geometry('pa-horn', () => new CylinderGeometry(0.11, 0.07, 0.05, 10));

    for (const side of [-1, 1]) {
      const x = side * x0;
      put(c, plate, steel, x, 0.03, z, true);
      // The pole runs into the cabinet rather than up to it, so no seam shows
      // where the two meet.
      const pole = put(c, mast, steel, x, (trim + 0.1) / 2, z, true);
      pole.scale.y = trim + 0.1;

      const head = new Group();
      head.position.set(x, trim + full * fit / 2, z);
      head.rotation.x = TILT;
      head.scale.setScalar(fit);
      const cab = new Mesh(c.kit.bevelBox(BOX_W, BOX_H, BOX_D, 0.03), box);
      cab.castShadow = true;
      const lf = new Mesh(cone, grille);
      lf.rotation.x = Math.PI / 2;
      lf.position.set(0, -0.09, BOX_D / 2 + 0.008);
      const hf = new Mesh(horn, grille);
      hf.rotation.x = Math.PI / 2;
      hf.position.set(0, 0.19, BOX_D / 2 + 0.012);
      head.add(cab, lf, hf);
      c.root.add(head);
    }
  },

  /**
   * The same PA, ground-stacked: two columns of boxes on the deck at the back
   * corners.
   *
   * This is what `pa-stack` was before it went up a pole, kept because getting
   * out of the way is not always what a PA is for. In a dancehall, a warehouse
   * or on a lawn with a rig on it the speakers *are* the room — `lawn.ts` says
   * so at length about the one genre this is most true of — and a stack of
   * boxes taller than the person in front of it is the picture. A top box
   * trimmed above the heads is a PA that has been dealt with; a wall of
   * cabinets on the deck is a sound system.
   *
   * ## Which is why this one, and only this one, can be struck
   *
   * The cabinets stand 0.7 m inside `play.halfX`, in the band's own floor. That
   * is the whole point of them and it is also the collision: `layoutModulars`
   * stands a wall of synthesiser at `backZ + 1.45` as far outboard as it fits,
   * and on the seeds where it lands on this corner the two are in the same
   * cubic metre. There is no x for either to move to — the cast fills the
   * playing area to its edge by construction and the wing is 0.5 m wide.
   *
   * So the stack is struck for the number, on the side that is occupied, the
   * way `riser` is struck when nobody is standing on it. It is what a crew does
   * with a stack that a band's own gear has to go where: the boxes come down
   * and go back up after the set. `showPa` is the switch and `show.ts` is the
   * only place that can throw it, because the room is built once and the cast
   * is cast per number.
   *
   * One side at a time. Two modulars flank, so both sides can go — and a stage
   * with neither is what that band actually needs, rather than a symmetry kept
   * for its own sake.
   */
  'pa-ground': (c) => {
    const box = c.kit.solid(shade(c.p.backdrop, 0.55), { rough: 0.85 });
    const grille = c.kit.solid(shade(c.p.backdrop, 0.78), { rough: 0.95 });
    const { x: x0, z, w, d } = paGroundFootprint(c.m);
    const cone = c.kit.geometry('driver', () => new CylinderGeometry(0.28, 0.28, 0.05, 12));
    const stacks: Group[] = [];
    for (const side of [-1, 1]) {
      const x = side * x0;
      const stack = new Group();
      const lo = new Mesh(c.kit.bevelBox(w, 1.0, d, 0.04), box);
      lo.position.set(x, 0.5, z);
      const hi = new Mesh(c.kit.bevelBox(w - 0.1, 0.75, d - 0.08, 0.04), box);
      hi.position.set(x, 1.38, z);
      for (const m of [lo, hi]) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
      const d1 = new Mesh(cone, grille);
      d1.position.set(x, 0.55, z + d / 2 + 0.01);
      d1.rotation.x = Math.PI / 2;
      const d2 = new Mesh(cone, grille);
      d2.position.set(x, 1.36, z + d / 2 - 0.03);
      d2.rotation.x = Math.PI / 2;
      d2.scale.setScalar(0.62);
      stack.add(lo, hi, d1, d2);
      c.root.add(stack);
      stacks.push(stack);
    }
    c.paGround = stacks;
  },

  /**
   * The band's own amplifiers, in a wall along the back.
   *
   * `pa-stack` is not this and the difference is which way the boxes point.
   * A PA faces the house: it is the building's, it is up on poles or flown at
   * the sides, and it is what the *audience* hears. A backline stands on the
   * deck behind the band facing the same way the band does, it belongs to the
   * five people playing through it, and it is what *they* hear. Every rock,
   * metal, funk and country stage that has ever been photographed has a row of
   * cabinets across the back of it, and no amount of PA makes that picture.
   *
   * It is a row rather than a pair for the same reason. Two stacks at the
   * corners is a sound system; an unbroken line of boxes the full width of the
   * stage is a wall, and the wall is the object — it is the thing the band is
   * standing in front of, the reason the back of the stage is dark, and the
   * scale reference that makes the players look small.
   *
   * The whole run is upstage of the backline margin and stops **70 mm** short of
   * the riser's front face — 90 mm, measured: the cabinets are centred at
   * `backZ + 0.2` and `CAB_D` is 0.32, so their downstage face is at
   * `backZ + 0.36`. 70 mm is `arches`' clearance, which stands 20 mm further
   * downstage at the same depth. The riser's front face is at `backZ + 0.45` on
   * every stage this
   * builds by construction — see `riserFootprint`, where the drum platform's
   * depth cancels out of that sum. Not a coincidence worth relying on silently,
   * so: if the riser ever moves downstage, this collides, and the number to
   * change is `CAB_D`.
   *
   * Heads on most of the stacks and doubles on about half, from the venue's own
   * stream. A row of identical boxes at one height is a shipping container.
   *
   * ## "70 mm is `arches`' clearance" was measuring the wrong gap
   *
   * The paragraph above compares this run's depth to the *riser* and reads
   * `arches` as a neighbour standing 20 mm further downstage. Both props are
   * 0.32 m deep and 20 mm apart in z, which is not a neighbour — it is the same
   * patch of deck, and the two rows interleave in x rather than avoiding each
   * other. Measured in `latin/salsa`: **0.0907 m³** of stone pier inside a
   * cabinet, thirteen instances, and the same again in `latin/moderno`. Both
   * eras of the salon, which is the room where the arcade is the whole look.
   *
   * There is nowhere else in z for either of them. The backdrop is 0.16 m
   * upstage of the arcade's back face and the riser is 0.06 m downstage of its
   * front, so the strip is 0.55 m wide and the two props want 0.64 m of it.
   *
   * So the wall is set **into** the arcade instead: one stack on the centre line
   * of each archway, which is where a band pushes its amps in a room like that
   * and is the only place in the run where there is no stone. Measured in both
   * salons: seven bays of 1.67–1.73 m with a 1.25–1.31 m clear span, a 0.78 m
   * cabinet on each centre with **0.235 m** of daylight to the nearest pier on
   * either side, the outermost stack 0.45 m inboard of the deck edge, and the
   * arch rings' lowest stone at 2.250 m against a tall stack's 1.635 m — the
   * springing is above everything this prop stands. Nine evenly-spaced stacks
   * become seven bay-spaced ones and the wall is still a wall — it is the same
   * boxes at the same depth, aligned to the architecture behind them.
   *
   * The bays come from `arcadeFootprint`, which is the one place that says where
   * the arcade is; `Ctx.dressed` is what makes the question askable at all.
   */
  backline: (c) => {
    const rng = c.rng('backline');
    const CAB_W = 0.78;
    const CAB_H = 0.72;
    const CAB_D = 0.32;
    const z = c.m.backZ + 0.2;
    /**
     * Where the stacks stand: in the arcade's bays if there is one and the
     * cabinets fit them, and evenly across the boards if there is not.
     *
     * The fit test is not decoration — `arcadeFootprint` puts three bays in a
     * narrow aperture and the clear span can in principle come down to 0.7 of
     * the module. Both salons clear it by 0.47 m; a room that did not would get
     * the even row and a check failure rather than a cabinet inside a pier.
     */
    const arcade = c.dressed.has('arches') ? arcadeFootprint(c.m) : undefined;
    const n = Math.max(3, Math.min(9, Math.round(c.m.width / 1.15)));
    const xs = arcade && arcade.clear >= CAB_W + 0.2
      ? arcade.openings.filter((x) => Math.abs(x) + CAB_W / 2 <= c.m.width / 2 - 0.1)
      : Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * (c.m.width / n));
    const stacks = xs.map((x) => ({
      x,
      tall: rng.chance(0.55),
      head: rng.chance(0.7),
    }));

    const boxes = stacks.reduce((k, s) => k + (s.tall ? 2 : 1), 0);
    const heads = stacks.reduce((k, s) => k + (s.head ? 1 : 0), 0);
    const cabs = new InstancedMesh(
      c.kit.bevelBox(CAB_W, CAB_H, CAB_D, 0.03),
      c.kit.solid(shade(c.p.backdrop, 0.62), { rough: 0.88 }), boxes,
    );
    const cloth = new InstancedMesh(
      c.kit.geometry('cab-grille', () => new PlaneGeometry(CAB_W - 0.12, CAB_H - 0.14)),
      c.kit.solid(shade(c.p.backdrop, 0.84), { rough: 0.98 }), boxes,
    );
    const tops = new InstancedMesh(
      c.kit.bevelBox(CAB_W - 0.06, 0.19, CAB_D - 0.03, 0.02),
      c.kit.solid(shade(c.p.proscenium, 0.55), { metal: 0.5, rough: 0.5 }), Math.max(1, heads),
    );

    const dummy = new Object3D();
    let b = 0;
    let t = 0;
    for (const s of stacks) {
      const high = s.tall ? 2 : 1;
      for (let level = 0; level < high; level++) {
        const y = CAB_H / 2 + level * CAB_H;
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.position.set(s.x, y, z);
        dummy.updateMatrix();
        cabs.setMatrixAt(b, dummy.matrix);
        // The grille sits on the downstage face, which is the one face of this
        // whole wall anybody ever sees.
        dummy.position.set(s.x, y, z + CAB_D / 2 + 0.006);
        dummy.updateMatrix();
        cloth.setMatrixAt(b, dummy.matrix);
        b++;
      }
      if (s.head) {
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.position.set(s.x, high * CAB_H + 0.1, z);
        dummy.updateMatrix();
        tops.setMatrixAt(t++, dummy.matrix);
      }
    }
    tops.count = t;
    cabs.castShadow = true;
    tops.castShadow = true;
    c.root.add(cabs);
    c.root.add(cloth);
    c.root.add(tops);
  },

  /** Wedges along the lip, angled back at the band. */
  wedges: (c) => {
    const n = 4;
    const mesh = new InstancedMesh(
      c.kit.bevelBox(0.66, 0.34, 0.42, 0.04),
      c.kit.solid(shade(c.p.backdrop, 0.62), { rough: 0.85 }), n,
    );
    const dummy = new Object3D();
    for (let i = 0; i < n; i++) {
      dummy.position.set((i - (n - 1) / 2) * (c.m.width / (n + 0.6)), 0.17, c.m.lipZ - 0.55);
      dummy.rotation.set(-0.42, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.castShadow = true;
    c.root.add(mesh);
  },

  /**
   * A drum riser upstage centre. Top at 0.4 m — see the note at the top of
   * this file, because `Station.riser` is the other half of this decision.
   *
   * ## And why it is a group with a switch on it
   *
   * A riser is a venue prop, so it is built once for the room; a drummer is
   * cast per number, so some numbers have one and some have a rhythm box
   * instead. Left standing, the platform in the empty half of that arrangement
   * is not merely a spare piece of staging — `cast.ts` gives the back centre
   * away the moment the riser is empty, deliberately: a lone modular is placed
   * dead centre exactly there, and with no drummer to keep, `stageBand` puts
   * the bass and the pad within half a metre of the middle of the back line.
   * All of them stand on the boards at `y = 0`, so the 0.4 m platform came up
   * through them and cut the band off at the shins.
   *
   * Of the two ways out — keep everybody off the footprint, or take the
   * platform away — this is the one that agrees with the decision already made
   * upstairs. `layoutModulars` reads an empty riser as free floor on purpose,
   * and `concert-check` asserts it. So the platform is here when somebody is
   * standing on it and gone when nobody is, which is also what a stage crew
   * would do with it.
   */
  riser: (c) => {
    // `h` off the same function rather than the 0.4 that used to be written out
    // here: it is the number `Station.riser` carries, and a deck built to any
    // other height stands the kit in the air or buries it to the rims.
    const { w, d, z, h } = riserFootprint(c.m);
    const deck = new Mesh(
      c.kit.bevelBox(w, h, d, 0.03),
      c.kit.solid(shade(c.p.boards, 0.3), { rough: 0.9 }),
    );
    deck.position.set(0, h / 2, z);
    deck.castShadow = true;
    deck.receiveShadow = true;
    const lip = new Mesh(
      c.kit.bevelBox(w + 0.1, 0.04, d + 0.1, 0.015),
      c.kit.solid(shade(c.p.curtain, 0.35)),
    );
    lip.position.set(0, h + 0.01, z);

    const group = new Group();
    group.add(deck, lip);
    c.root.add(group);
    c.riser = group;
  },
};
