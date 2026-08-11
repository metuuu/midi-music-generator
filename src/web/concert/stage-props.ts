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
 * four exceptions are underfoot on purpose — `rug`, `carpet`, `cables` and
 * `riser` — the first three because a floor covering a band avoids is not a
 * floor covering, and they are all flat enough to be walked over. `riser` is
 * the one to watch, because `Station.riser` says a performer is
 * standing on a platform and this places one. Its top is at **0.4 m**, centred
 * at **(0, -1.15 m upstage of centre)**, 2.8 m wide by 2.0 m deep. Only the
 * width holds: `riserFootprint` clamps at `min(2.8, width * 0.32)` and every
 * one of the catalogue's 72 dressings is wide enough, but the depth is
 * `min(2.0, depth * 0.3)` and reaches the clamp in exactly half of them,
 * bottoming out at 1.41 m in house's `afterhours`. The z follows the depth off
 * `backZ + d / 2 + 0.45` and runs from −1.195 to −2.550; no venue produces
 * −1.15. Ask `riserFootprint` rather than this paragraph.
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
import { PROPS, type PropName } from '../../concert/venue.js';
import { rowGap } from './stage-audience.js';
import {
  blend, cellPlane, HEAD_BAND, houseLid, hueShift, LENS_GAP, LOW_CEILING, playingArea, sagLine,
  shade, STAGE_SOFFIT, tint,
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
 * The drum riser's footprint, which two files need and only one draws.
 *
 * Exported because `show.ts` has to route leads around this platform and a
 * second copy of `min(2.8, width * 0.32)` over there would be a cable that
 * cleared the riser until somebody resized it. The prop below is the only thing
 * that puts a riser on the stage, so this is where the measurement lives.
 */
export function riserFootprint(
  // Narrowed to what it reads, so the check in `concert-check.ts` can ask
  // without constructing a whole `StageMetrics` out of a venue.
  m: { width: number; depth: number; backZ?: number },
): { w: number; d: number; z: number } {
  const w = Math.min(2.8, m.width * 0.32);
  const d = Math.min(2.0, m.depth * 0.3);
  // `backZ` is `-depth / 2` on every stage this builds — see `stage.ts` — so a
  // caller holding only a venue need not go and construct one to ask.
  return { w, d, z: (m.backZ ?? -m.depth / 2) + d / 2 + 0.45 };
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

export interface PropRig {
  root: Group;
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
  /** Set by `BUILDERS.riser` so `showRiser` has something to hide. */
  riser?: Group;
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
 * In the open-air rooms it is the bar, and the bar is a pipe rather than a
 * plane: a tie landing at bar height but 0.24 m outboard of the bar's own span
 * still ends in air. That is the room's to close by publishing a wider bar, and
 * bar height is the closest this file can honestly get.
 */
function rigHeight(c: Ctx): number {
  return Number.isFinite(c.m.headroom) ? c.m.headroom : Math.min(c.m.openingHeight, c.m.flyY);
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

export function dressStage(o: PropOptions): PropRig {
  const root = new Group();
  const updaters: ((t: number, dt: number) => void)[] = [];
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
  };

  const wanted = readProps(o.venue.props);
  const placed: PropName[] = [];
  for (const name of PROPS) {
    if (!wanted.has(name)) continue;
    BUILDERS[name](ctx);
    placed.push(name);
  }

  return {
    root,
    placed,
    ignored: unknownProps(o.venue.props),
    showRiser(on: boolean): void {
      if (ctx.riser) ctx.riser.visible = on;
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
   */
  bunting: (c) => {
    const rng = c.rng('bunting');
    const w = c.m.openingWidth;
    const drop = 0.33;
    const front = swag(c, 0.8, drop);
    const back = swag(c, 0.6, drop);
    const hang = front.hang;
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
      // the pavilion had nothing under at all.
      for (const end of [pts[0]!, pts[run.n]!]) {
        cord(c, [end, new Vector3(end.x, hang, end.z)], shade(c.p.proscenium, 0.5));
      }
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
    for (const end of [pts[0]!, pts[n]!]) {
      cord(c, [end, new Vector3(end.x, line.hang, end.z)], shade(c.p.proscenium, 0.6));
    }
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
        // Under what it hangs from, which `openingHeight - 0.4` does not
        // guarantee on its own. Inert in all four venues that carry the prop —
        // the shortest cord it produces is 0.28 m on a lawn.
        hang - 0.12,
        Math.max(lowest, c.m.openingHeight * 0.72) + rng.float(-0.06, 0.06),
      );
      // Behind the backline at `play.backZ`, and far enough off the backdrop
      // (which sits at `backZ - 0.1`) that a 0.19 m body does not go into it.
      const z = c.m.backZ + 0.3 + rng.float(-0.12, 0.12);
      const node = new Group();
      node.position.set(x, hang, z);
      const body = new Mesh(geo, c.kit.basic(warm));
      body.position.y = y - hang;
      body.scale.y = 0.85;
      node.add(body);
      cord(c, [new Vector3(x, hang, z), new Vector3(x, y, z)], shade(c.p.proscenium, 0.7));
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
   */
  moths: (c) => {
    const rng = c.rng('moths');
    const n = c.quality === 'low' ? 10 : 24;
    /** Wander amplitude is `r`, and `r * 0.4` of it is vertical. */
    const floor = HANG_FLOOR + 0.7 * 0.4;
    const ceil = Math.max(floor + 0.5, c.m.openingHeight * 0.92);
    const mesh = new InstancedMesh(
      c.kit.geometry('moth', () => new ConeGeometry(0.035, 0.07, 3)),
      c.kit.basic(tint(c.p.ambient, 0.7)),
      n,
    );
    mesh.frustumCulled = false;
    c.root.add(mesh);
    const flock = Array.from({ length: n }, () => ({
      x: rng.float(-c.m.width * 0.4, c.m.width * 0.4),
      y: rng.float(floor, ceil),
      z: rng.float(c.m.backZ + 1, c.m.lipZ),
      r: rng.float(0.25, 0.7),
      s: rng.float(0.5, 1.4),
      ph: rng.float(0, 6.28),
    }));
    const dummy = new Object3D();
    c.tick((t) => {
      const time = t * c.idle;
      for (let i = 0; i < n; i++) {
        const f = flock[i]!;
        dummy.position.set(
          f.x + Math.sin(time * f.s + f.ph) * f.r,
          f.y + Math.sin(time * f.s * 1.7 + f.ph * 2) * f.r * 0.4,
          f.z + Math.cos(time * f.s * 0.8 + f.ph) * f.r,
        );
        dummy.rotation.set(time * f.s, time * f.s * 2, f.ph);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });
  },

  /** Pale trunks in the wings. A lakeside pavilion is in a wood. */
  birch: (c) => {
    const rng = c.rng('birch');
    const bark = tint(c.p.backdrop, 0.62);
    for (let i = 0; i < 6; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const h = rng.float(4.5, 6.5);
      const geo = c.kit.geometry(`trunk|${h.toFixed(2)}`, () => new CylinderGeometry(0.09, 0.13, h, 7));
      put(c, geo, c.kit.solid(bark, { rough: 0.95 }),
        side * (c.m.width / 2 + rng.float(0.6, 2.6)),
        c.m.houseY + h / 2,
        c.m.backZ - rng.float(0.5, 4),
      );
    }
  },

  /** Water beyond the pavilion, with the moon on it. */
  lake: (c) => {
    const water = shade(blend(c.p.backdrop, c.p.ambient, 0.5), 0.55);
    const plane = put(c, c.kit.geometry('lake', () => new PlaneGeometry(90, 60)),
      c.kit.solid(water, { rough: 0.25, metal: 0.35 }), 0, c.m.houseY - 0.35, c.m.backZ - 32);
    plane.rotation.x = -Math.PI / 2;
    const glint = put(c, c.kit.geometry('glint', () => new PlaneGeometry(1.6, 26)),
      c.kit.basic(tint(c.p.ambient, 0.75), { opacity: 0.35 }), 0.8, c.m.houseY - 0.33, c.m.backZ - 22);
    glint.rotation.x = -Math.PI / 2;
    c.tick((t) => {
      glint.scale.x = 1 + Math.sin(t * 0.6) * 0.18 * c.idle;
      glint.position.x = 0.8 + Math.sin(t * 0.23) * 0.35 * c.idle;
    });
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
   * Three residuals, named here rather than left to be re-found:
   *   - ballroom: the tip lands level with the grid batten at exactly
   *     `openingHeight + 1.2` and 0.02 m downstage of its face. Ballroom is the
   *     only room that has built a real object at that height, which is why
   *     copying `truss`'s expression is right rather than inventing one.
   *   - shed: `headroom` there is the rafter soffit over the *edge* of the
   *     boards while the sheeting above centre starts 0.054 m higher, and the
   *     shed sits only 0.058 m off the `hang - 0.8` clamp — so it is the room
   *     to re-check if that soffit ever moves.
   *   - circuit, proscenium, courtyard, lawn: nothing is modelled at
   *     `openingHeight + 1.2`, so the rod ends where `truss`'s motor drops end,
   *     which is this file's existing answer for hanging from the sky. Putting
   *     a real object there is those rooms' business under `RoomRig.flyBar`.
   */
  'mirror-ball': (c) => {
    /** What the rod is fixed to: the plaster over the boards, or the grid. */
    const hang = Number.isFinite(c.m.headroom) ? c.m.headroom : c.m.openingHeight + 1.2;
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
    const hang = Number.isFinite(lid) ? lid : c.m.flyY;
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
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / 2);
      spots.push({
        x: (i % 2 === 0 ? -1 : 1) * rng.float(1.2, c.m.houseWidth * 0.4),
        z: c.m.lipZ + 1.9 + row * 1.9 + rng.float(-0.2, 0.2),
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
    const depth = c.m.houseDepth + 2;
    const width = c.m.houseWidth + 6;
    /** Where the house lid begins, and where the fascia hangs. */
    const stepZ = c.m.lipZ + 0.25;

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

    const ceil = put(c, c.kit.own(bays(width, depth, 'ceiling')), lid,
      0, y, stepZ + depth / 2);
    ceil.rotation.x = -Math.PI / 2;

    /**
     * And over the stage, lower — see `STAGE_SOFFIT`. This is the half that
     * makes it a cellar, and the half that was missing.
     *
     * It runs from the fascia to behind the backdrop rather than to the back
     * wall of the stage, for the same reason the house lid runs past the last
     * row: an edge in mid-air is what read as a plane, and the only cure is for
     * every edge to die into something. Upstage that something is the cloth.
     */
    const soffitDepth = stepZ - (c.m.backZ - 0.5);
    const soffit = put(c, c.kit.own(bays(width, soffitDepth, 'soffit')), lid,
      0, STAGE_SOFFIT, stepZ - soffitDepth / 2);
    soffit.rotation.x = -Math.PI / 2;

    /**
     * The step between them, at the lip.
     *
     * Two lids at two heights with nothing joining them is a slot you can see
     * the arch through, which is the same void as before in a thinner shape. A
     * fascia closes it, and closing it is not the only thing it does: a
     * downstand across the top of the opening is the most basement thing in the
     * room. It is what the eye measures the band against, and it is darker than
     * the plaster because the underside of a beam is the one surface here that
     * faces the room rather than the floor.
     */
    const drop = y - STAGE_SOFFIT;
    if (drop > 0.02) {
      put(c, c.kit.geometry(`fascia|${width.toFixed(2)}|${drop.toFixed(2)}`,
        () => new PlaneGeometry(width, drop)),
        c.kit.solid(shade(plaster, 0.35), { side: DoubleSide }),
        0, STAGE_SOFFIT + drop / 2, stepZ);
    }

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
     */
    const PIPE_R = 0.07;
    const pipe = c.kit.geometry(`pipe|${depth.toFixed(2)}`, () => new CylinderGeometry(PIPE_R, PIPE_R, depth, 6));
    const pipeMat = c.kit.solid(shade(c.p.proscenium, 0.5), { metal: 0.4, rough: 0.5 });
    for (const side of [-1, 1]) {
      const p = put(c, pipe, pipeMat,
        side * c.m.houseWidth * 0.22, y - PIPE_R + 0.01, c.m.lipZ + depth / 2 + 0.25);
      p.rotation.x = Math.PI / 2;
    }
  },

  bar: (c) => {
    const len = c.m.houseWidth * 0.55;
    const back = c.m.lipZ + c.m.houseDepth - 0.8;
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
   */
  posters: (c) => {
    if (!Number.isFinite(c.m.wallX)) return;
    const rng = c.rng('posters');
    const geo = c.kit.geometry('poster', () => new PlaneGeometry(0.7, 1));
    for (let i = 0; i < 3; i++) {
      const side = i === 1 ? -1 : 1;
      const m = put(c, geo, c.kit.solid(hueShift(c.accent, rng.float(-90, 90), 0.1), { rough: 0.95 }),
        side * (c.m.wallX - 0.03), 1.7 + rng.float(-0.3, 0.5), c.m.curtainZ - 0.9 - i * 1.4);
      m.rotation.y = side * -Math.PI / 2;
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

  'flight-case': (c) => {
    const rng = c.rng('cases');
    const body = c.kit.solid(shade(c.p.backdrop, 0.6), { rough: 0.7 });
    const edge = c.kit.solid(tint(c.p.proscenium, 0.2), { metal: 0.6, rough: 0.4 });
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
     * `pa-stack` stands a 1.0 by 0.7 cabinet at `±(width/2 - 0.7)` on
     * `backZ + 1.3` — dead inside the band this file draws from — so on any
     * venue naming both, a case ended up standing in a speaker. Two files, one
     * patch of floor, and neither could see the other; stating the one
     * footprint here is cheaper than a shared occupancy map for two props.
     */
    if (readProps(c.venue.props).has('pa-stack')) {
      for (const side of [-1, 1]) {
        down.push({ x: side * (c.m.width / 2 - 0.7), z: c.m.backZ + 1.3, w: 1.0 });
      }
    }
    for (let i = 0; i < 3; i++) {
      const side = i === 1 ? 1 : -1;
      const w = rng.float(0.7, 1.1);
      const h = rng.float(0.45, 0.75);
      const x = side * (c.m.width / 2 - rng.float(0.5, 1.1));
      let z = c.m.backZ + rng.float(0.5, 1.8);
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
   * Spare cable along the back wall — what a room owns, as opposed to what the
   * band plugged in tonight.
   *
   * **This used to be the stage's only cabling and it was spaghetti**: three
   * tubes between random points, one of them arriving 1.4 m from the lip. That
   * worked precisely because it joined nothing to nothing — an eye that has
   * decided a tube is texture does not follow it anywhere.
   *
   * `cables.ts` now runs real leads from real sockets to a stage box, and the
   * two cannot share a floor: a lead you can trace beside three that wander
   * off mid-stage makes the traceable one look like a mistake. So this keeps
   * the job it was actually doing — a bare deck reads as a showroom — and gives
   * up the half that now belongs to something else. Along the upstage edge,
   * where a room's own cable lives when nobody is using it, and nowhere near
   * the playing area.
   *
   * It stays deliberately ignorant of where the stage box is. It could derive
   * that from `c.m` — it is the same arithmetic — and then there would be two
   * answers on this stage to "where does cabling go", and drift the first time
   * either moved.
   */
  cables: (c) => {
    const rng = c.rng('cables');
    const mat = c.kit.solid(shade(c.p.backdrop, 0.7), { rough: 0.9 });
    const wall = c.m.backZ + 0.22;
    for (let i = 0; i < 3; i++) {
      const x0 = rng.float(-c.m.width * 0.34, c.m.width * 0.12);
      const from = new Vector3(x0, 0.022, wall + rng.float(0, 0.12));
      const to = new Vector3(x0 + rng.float(0.8, 2.0), 0.022, wall + rng.float(0, 0.16));
      const mid = new Vector3(
        (from.x + to.x) / 2, 0.022, wall + rng.float(0.10, 0.34),
      );
      const curve = new CatmullRomCurve3([from, mid, to]);
      const geo = c.kit.own(new TubeGeometry(curve, 14, 0.018, 4, false));
      c.root.add(new Mesh(geo, mat));
    }
  },

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
   */
  drapes: (c) => {
    const cloth = c.kit.solid(shade(c.p.curtain, 0.55), { rough: 0.98, side: DoubleSide });
    const h = c.m.openingHeight;
    const halfW = 0.9;
    const angle = 0.35;
    const geo = c.kit.geometry(`drape|${h}`, () => new PlaneGeometry(halfW * 2, h));
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
   */
  stalls: (c) => {
    const seated = c.venue.audience.seated;
    const rows = Math.max(1, Math.min(16, Math.round(c.venue.audience.rows)));
    /** `stage-audience.ts`'s `ROW` and `spacing`. See the note above. */
    const SEAT = 0.66;
    const rake = seated ? 0.1 : 0.05;
    const gap = rowGap(seated);
    const perRow = Math.max(3, Math.min(30, Math.floor(c.m.houseWidth / SEAT)));
    const backs = new InstancedMesh(
      c.kit.geometry('seat-back', () => new PlaneGeometry(SEAT - 0.11, 0.5)),
      c.kit.solid(shade(blend(c.p.curtain, c.p.backdrop, 0.35), 0.3), { rough: 0.95, side: DoubleSide }),
      rows * perRow,
    );
    const dummy = new Object3D();
    let i = 0;
    for (let row = 0; row < rows; row++) {
      // Behind the row's own occupants — a seat back is the thing the person in
      // front of you is leaning on, so from the stage it fills the gaps.
      const z = c.m.crowd.frontZ + 0.35 + row * gap + 0.24;
      const y = c.m.houseY + row * rake + 0.66;
      const stagger = (row % 2) * SEAT * 0.5;
      for (let s = 0; s < perRow; s++) {
        dummy.position.set((s - (perRow - 1) / 2) * SEAT + stagger, y, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        backs.setMatrixAt(i++, dummy.matrix);
      }
    }
    c.root.add(backs);
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
   * Where the room does have a lid, the timbers go under it instead, and a room
   * that names both this and `low-ceiling` is describing a contradiction that
   * only the room can settle.
   *
   * No shadows. The one shadow-casting lantern is hung below these, and a
   * timber lit from underneath casting up onto nothing costs a depth pass for a
   * shadow no camera in this show can see.
   */
  beams: (c) => {
    const roof = Number.isFinite(c.m.headroom)
      ? c.m.headroom - 0.22
      : Math.max(4.3, c.m.openingHeight - 0.3);
    const y = Math.max(HANG_FLOOR + 0.2, roof);
    const span = c.m.houseWidth + 6;
    const from = c.m.backZ - 0.6;
    const to = c.m.lipZ + c.m.houseDepth + 1;
    const n = Math.max(4, Math.min(14, Math.round((to - from) / 2.3)));
    const timber = c.kit.solid(shade(hueShift(c.p.boards, -8, 0.08), 0.42), { rough: 0.96 });
    const ties = new InstancedMesh(c.kit.bevelBox(span, 0.24, 0.28, 0.03), timber, n);
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
    // rather than a row of unrelated planks.
    const purlin = c.kit.bevelBox(0.2, 0.22, to - from, 0.03);
    for (const side of [-1, 1]) {
      put(c, purlin, timber, side * c.m.houseWidth * 0.26, y + 0.23, (from + to) / 2);
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
   */
  arches: (c) => {
    const stone = c.kit.solid(tint(blend(c.p.proscenium, c.p.backdrop, 0.35), 0.22), { rough: 0.92 });
    let bays = Math.max(3, Math.round(c.m.openingWidth / 2));
    if (bays % 2 === 0) bays += 1;
    const bay = c.m.openingWidth / bays;
    const pierW = Math.min(0.42, bay * 0.3);
    const r = (bay - pierW) / 2;
    /** Above the tallest player, and upstage of them all in any case. */
    const spring = Math.max(HEAD_BAND.hi - 0.15, 2.1);
    const z = c.m.backZ + 0.22;
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
     * on the impost, which is what an arch does.
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
     */
    const ARC = Math.PI * (c.venue.architecture === 'courtyard' ? 1.16 : 1);

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
     * width, and so it is identically zero for a half turn — every semicircular
     * room lands on `spring` exactly as before and nothing here has to branch.
     */
    const impost = spring - r * Math.sin(Math.max(0, (ARC - Math.PI) / 2));

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

    const rings = new InstancedMesh(
      c.kit.geometry(`arch|${r.toFixed(3)}`, () => new TorusGeometry(r, 0.16, 4, 10, ARC)),
      stone, bays,
    );
    for (let i = 0; i < bays; i++) {
      dummy.position.set((i - (bays - 1) / 2) * bay, spring, z);
      // The arc starts at angle zero, so swing it back by half the overshoot to
      // stand it symmetrically on its own two piers.
      dummy.rotation.set(0, 0, Math.PI / 2 - ARC / 2);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      rings.setMatrixAt(i, dummy.matrix);
    }
    rings.castShadow = true;
    c.root.add(rings);
    put(c, c.kit.bevelBox(c.m.openingWidth + pierW, 0.36, 0.34, 0.03), stone,
      0, spring + r + 0.36, z, true);
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

    /** How long the vertical is, where its centre sits, and which runs get one. */
    let holdH: number;
    let holdY: number;
    let holdAt: readonly number[];
    if (lidded) {
      holdH = Math.max(0, lid - (y + S));
      holdY = y + S + holdH / 2;
      holdAt = runs;
    } else if (Number.isFinite(houseLid(c.m))) {
      // A roofed building whose stage is under a tower: the grid is up there
      // even where the room has not modelled one, and only the fly bar's run
      // has anything over it — which is why `runs` above is one run here, and
      // why every run there is gets held.
      holdH = Math.max(0, c.m.openingHeight + 1.2 - (y + S));
      holdY = y + S + holdH / 2;
      holdAt = runs;
    } else {
      // Open sky. The foot goes on whichever surface is under the pick — the
      // boards if the truss is narrower than they are, the house floor if it
      // overhangs them, which it does in both rooms that reach this today.
      const foot = pick <= c.m.width / 2 ? 0 : c.m.houseY;
      holdH = Math.max(0, y - S - foot);
      holdY = (y - S + foot) / 2;
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

  'pa-stack': (c) => {
    const box = c.kit.solid(shade(c.p.backdrop, 0.55), { rough: 0.85 });
    const grille = c.kit.solid(shade(c.p.backdrop, 0.78), { rough: 0.95 });
    for (const side of [-1, 1]) {
      const x = side * (c.m.width / 2 - 0.7);
      const z = c.m.backZ + 1.3;
      put(c, c.kit.bevelBox(1.0, 1.0, 0.7, 0.04), box, x, 0.5, z, true);
      put(c, c.kit.bevelBox(0.9, 0.75, 0.62, 0.04), box, x, 1.38, z, true);
      const cone = c.kit.geometry('driver', () => new CylinderGeometry(0.28, 0.28, 0.05, 12));
      const d1 = put(c, cone, grille, x, 0.55, z + 0.36);
      d1.rotation.x = Math.PI / 2;
      const d2 = put(c, cone, grille, x, 1.36, z + 0.32);
      d2.rotation.x = Math.PI / 2;
      d2.scale.setScalar(0.62);
    }
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
   */
  backline: (c) => {
    const rng = c.rng('backline');
    const CAB_W = 0.78;
    const CAB_H = 0.72;
    const CAB_D = 0.32;
    const z = c.m.backZ + 0.2;
    const n = Math.max(3, Math.min(9, Math.round(c.m.width / 1.15)));
    const stacks = Array.from({ length: n }, (_, i) => ({
      x: (i - (n - 1) / 2) * (c.m.width / n),
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
    const { w, d, z } = riserFootprint(c.m);
    const deck = new Mesh(
      c.kit.bevelBox(w, 0.4, d, 0.03),
      c.kit.solid(shade(c.p.boards, 0.3), { rough: 0.9 }),
    );
    deck.position.set(0, 0.2, z);
    deck.castShadow = true;
    deck.receiveShadow = true;
    const lip = new Mesh(
      c.kit.bevelBox(w + 0.1, 0.04, d + 0.1, 0.015),
      c.kit.solid(shade(c.p.curtain, 0.35)),
    );
    lip.position.set(0, 0.41, z);

    const group = new Group();
    group.add(deck, lip);
    c.root.add(group);
    c.riser = group;
  },
};
