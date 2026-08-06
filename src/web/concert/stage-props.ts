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
 */
function swag(c: Ctx, wantSag: number, drop: number): { y: number; sag: number } {
  const top = c.m.openingHeight - 0.12;
  const sag = Math.max(0.15, Math.min(wantSag, top - drop - HANG_FLOOR));
  return { y: Math.min(top, HANG_FLOOR + sag + drop), sag };
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

  /** A festoon of warm bulbs. Unlit material — they are the light source. */
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
   */
  'paper-lanterns': (c) => {
    const rng = c.rng('lanterns');
    const warm = tint(hueShift(c.p.curtain, 25, 0.1), 0.45);
    const geo = c.kit.geometry('lantern', () => new SphereGeometry(0.19, 10, 7));
    const group = new Group();
    c.root.add(group);
    const swings: { node: Object3D; phase: number; rate: number }[] = [];
    // The body is 0.19 × 0.85 tall, and the swing is a 0.05 rad tilt on a 0.9 m
    // cord, so the lowest the paper ever gets is the centre less 0.17 m.
    const lowest = HANG_FLOOR + 0.17;
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * (c.m.openingWidth / 5.5);
      const y = Math.min(
        c.m.openingHeight - 0.4,
        Math.max(lowest, c.m.openingHeight * 0.72) + rng.float(-0.06, 0.06),
      );
      // Behind the backline at `play.backZ`, and far enough off the backdrop
      // (which sits at `backZ - 0.1`) that a 0.19 m body does not go into it.
      const z = c.m.backZ + 0.3 + rng.float(-0.12, 0.12);
      const node = new Group();
      node.position.set(x, y + 0.9, z);
      const body = new Mesh(geo, c.kit.basic(warm));
      body.position.y = -0.9;
      body.scale.y = 0.85;
      node.add(body);
      cord(c, [new Vector3(x, y + 0.9, z), new Vector3(x, y, z)], shade(c.p.proscenium, 0.7));
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

  /** Slowly turning, faceted, and entirely an era signal. */
  'mirror-ball': (c) => {
    const ball = new Mesh(
      c.kit.geometry('ball', () => new IcosahedronGeometry(0.34, 1)),
      c.kit.solid(tint(c.p.ambient, 0.8), { metal: 0.95, rough: 0.14, flat: true }),
    );
    const node = new Group();
    node.position.set(0, c.m.openingHeight * 0.82, c.m.lipZ - 1.4);
    node.add(ball);
    const rod = new Mesh(
      c.kit.geometry('ballrod', () => new CylinderGeometry(0.02, 0.02, 0.6, 5)),
      c.kit.solid(shade(c.p.proscenium, 0.6)),
    );
    rod.position.y = 0.5;
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

  /** Small round tables among the crowd, which is what makes it a club. */
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
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / 2);
      const x = (i % 2 === 0 ? -1 : 1) * rng.float(1.2, c.m.houseWidth * 0.4);
      const z = c.m.lipZ + 1.9 + row * 1.9 + rng.float(-0.2, 0.2);
      dummy.position.set(x, c.m.houseY + 0.74, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      tops.setMatrixAt(i, dummy.matrix);
      dummy.position.y = c.m.houseY + 0.36;
      dummy.updateMatrix();
      stems.setMatrixAt(i, dummy.matrix);
    }
    c.root.add(tops);
    c.root.add(stems);
  },

  /** Tealights. Unlit material, and the flame flickers on its own scale. */
  candles: (c) => {
    const rng = c.rng('candles');
    const n = c.quality === 'low' ? 5 : 10;
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
      const row = Math.floor(i / 2);
      spots.push({
        x: (i % 2 === 0 ? -1 : 1) * rng.float(1.2, c.m.houseWidth * 0.4),
        y: c.m.houseY + 0.82,
        z: c.m.lipZ + 1.9 + row * 1.9 + rng.float(-0.2, 0.2),
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

  posters: (c) => {
    const rng = c.rng('posters');
    const geo = c.kit.geometry('poster', () => new PlaneGeometry(0.7, 1));
    for (let i = 0; i < 3; i++) {
      const side = i === 1 ? -1 : 1;
      const m = put(c, geo, c.kit.solid(hueShift(c.accent, rng.float(-90, 90), 0.1), { rough: 0.95 }),
        side * (c.m.openingWidth / 2 + 0.9), 1.7 + rng.float(-0.3, 0.5), c.m.curtainZ - 0.9 - i * 1.4);
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
   * The script is one `TubeGeometry` along a fixed curve, cached and hung three
   * times — the back wall and both wings — rather than three curves, because a
   * bar's signs are made by the same person and match. The wing pair is at the
   * `posters` position for the same reason `posters` is there: offstage, seen
   * through the opening at an angle, so a wide shot has something bright in the
   * dark either side of the arch.
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

    /** One sign, built flat in xy and pointed wherever it is hung. */
    const sign = (tag: string, scale: number): { node: Group; tube: MeshBasicMaterial } => {
      const tube = c.kit.material(`neon|${tag}`, () => new MeshBasicMaterial({ color: hot }));
      const node = new Group();
      node.scale.setScalar(scale);
      node.add(new Mesh(script, tube));
      node.add(new Mesh(border, frame));
      c.root.add(node);
      return { node, tube };
    };

    // Over the band, high enough to be a sign on a wall rather than a hazard at
    // head height, and upstage of the backline besides.
    const back = sign('back', 1);
    back.node.position.set(
      -c.m.openingWidth * 0.2,
      Math.min(c.m.openingHeight - 0.5, Math.max(HANG_FLOOR + 0.4, c.m.openingHeight * 0.6)),
      c.m.backZ + 0.16,
    );
    for (const side of [-1, 1]) {
      const wing = sign('wing', 0.78);
      wing.node.position.set(
        side * (c.m.openingWidth / 2 + 0.85), 1.85, c.m.curtainZ - 1.5,
      );
      wing.node.rotation.y = (side * -Math.PI) / 2;
    }

    const lit = new Color(hot);
    c.tick((t) => {
      const beat = Math.sin(t * 11.3) * Math.sin(t * 3.1);
      const dip = beat > 0.86 && c.idle > 0.5 ? 0.32 : 1;
      back.tube.color.copy(lit).multiplyScalar(dip * (0.94 + 0.06 * Math.sin(t * 2.3)));
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
    for (let i = 0; i < 3; i++) {
      const side = i === 1 ? 1 : -1;
      const w = rng.float(0.7, 1.1);
      const h = rng.float(0.45, 0.75);
      const x = side * (c.m.width / 2 - rng.float(0.5, 1.1));
      const z = c.m.backZ + rng.float(0.5, 1.8);
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
   */
  drapes: (c) => {
    const cloth = c.kit.solid(shade(c.p.curtain, 0.55), { rough: 0.98, side: DoubleSide });
    const h = c.m.openingHeight;
    const halfW = 0.9;
    const angle = 0.35;
    const geo = c.kit.geometry(`drape|${h}`, () => new PlaneGeometry(halfW * 2, h));
    // Inside the opening if there is room for it, and never inside the band.
    const inner = Math.max(c.play.halfX, c.m.openingWidth / 2 - 0.25);
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
      const z = c.m.lipZ + rng.float(0.7, 3.6);
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
    /** Past a half turn, which is what makes it a horseshoe. */
    const ARC = Math.PI * 1.16;

    const dummy = new Object3D();
    const piers = new InstancedMesh(c.kit.bevelBox(pierW, spring, 0.32, 0.03), stone, bays + 1);
    for (let i = 0; i <= bays; i++) {
      dummy.position.set((i - bays / 2) * bay, spring / 2, z);
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
   * Lighting lattice over the stage — flown, and it has to be.
   *
   * A truss is a goalpost in the mind's eye: two towers and a beam. It cannot
   * be one here, and the reason is a number rather than an opinion. The
   * proscenium opening is 0.94 of the stage width, so the strip of board that
   * is both inside the opening and outside the playing area is about a
   * *handspan* on a nine-metre stage and narrower on a wide one. A tower with
   * its feet in that strip is invisible behind the arch leg; a tower wide
   * enough to read is standing where the guitarist is. There is nowhere on
   * these boards for a ground support to stand.
   *
   * Flown is not a consolation prize — it is what an arena rig actually is, and
   * it solves the sightline for free by living above everything. Two runs, one
   * over the fly bar and one upstage over the backline, because a single bar
   * reads as a scaffolding pole and two parallel ones read as a rig. The ends
   * overrun the opening so they die behind the masking, and each end has a
   * short vertical stub going up out of frame, which is where the motors would
   * be: a truss with nothing above it is hanging from the sky.
   *
   * Under a lid it tucks up under the plaster instead of going through it. A
   * cellar asking for a truss is a room describing itself oddly, and the
   * renderer's job there is to make an odd room rather than a broken one.
   *
   * ## The one place in this file that does not use `bevelBox`
   *
   * Fifty-two diagonal braces at 108 triangles each is 5.6k triangles of bevel,
   * which was more than the entire pavilion and more than twice the next most
   * expensive prop. A bevel is the house style because it catches a highlight
   * along an edge and stops a box reading as a rendering; a 32 mm strut seen
   * from six metres has no edge to catch anything on, and the rounding is a
   * cost with no picture attached. Plain boxes, and the prop drops to a tenth
   * of what it was.
   *
   * Everything repeated is instanced for the same reason — the chords, the
   * braces and the motor drops are three draw calls between them rather than
   * fourteen meshes, which is what the rest of this file does everywhere it
   * places more than two of a thing.
   */
  truss: (c) => {
    const steel = c.kit.solid(shade(tint(c.p.proscenium, 0.3), 0.35), { metal: 0.75, rough: 0.4 });
    const y = Number.isFinite(c.m.headroom)
      ? Math.max(HANG_FLOOR + 0.3, c.m.headroom - 0.28)
      : c.m.flyY + 0.34;
    const len = c.m.openingWidth + 1.8;
    /** Half the truss section. A 0.34 m square is a light-duty rigging truss. */
    const S = 0.17;
    /** Up to the plaster, or out of the top of the frame. */
    const rise = Math.max(0.3,
      (Number.isFinite(c.m.headroom) ? c.m.headroom : c.m.openingHeight + 1.2) - y - S);
    const runs = [c.m.curtainZ - 1.1, c.m.backZ + 0.9];
    const perRun = Math.max(6, Math.round(len / 0.5));

    const chords = new InstancedMesh(
      c.kit.geometry(`truss-chord|${len.toFixed(2)}`,
        () => new CylinderGeometry(0.035, 0.035, len, 6)),
      steel, runs.length * 4,
    );
    const braces = new InstancedMesh(
      c.kit.geometry('truss-brace', () => new BoxGeometry(0.032, 0.42, 0.032)),
      steel, runs.length * perRun,
    );
    const drops = new InstancedMesh(
      c.kit.geometry(`truss-drop|${rise.toFixed(2)}`,
        () => new CylinderGeometry(0.035, 0.035, rise, 6)),
      steel, runs.length * 2,
    );

    const dummy = new Object3D();
    let ci = 0;
    let bi = 0;
    let di = 0;
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
      for (let i = 0; i < perRun; i++) {
        dummy.position.set((i - (perRun - 1) / 2) * (len / perRun), y, z - S);
        dummy.rotation.set(0, 0, i % 2 === 0 ? 0.72 : -0.72);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        braces.setMatrixAt(bi++, dummy.matrix);
      }
      for (const side of [-1, 1]) {
        dummy.position.set((side * len) / 2, y + S + rise / 2, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        drops.setMatrixAt(di++, dummy.matrix);
      }
    }
    c.root.add(chords);
    c.root.add(braces);
    c.root.add(drops);
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
      c.kit.geometry(`barrier-panel|${seg.toFixed(3)}`, () => new PlaneGeometry(seg - 0.09, 0.62)),
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
      dummy.position.set(x, c.m.houseY + 0.66, z);
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
