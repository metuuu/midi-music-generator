/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Set dressing — the genre in the room.
 *
 * `Venue.props` is a `string[]` and the plan calls it "free-form,
 * genre-specific", which makes this file the *reader* of a vocabulary written
 * somewhere else (`src/concert/venue.ts`). Two rules follow, and they are the
 * only reason two agents can write the two halves without meeting:
 *
 * 1. **An unrecognised string is ignored, silently.** A venue that asks for a
 *    thing this file has never heard of gets a stage without it, not an
 *    exception in the middle of a show. `unknownProps()` reports what was
 *    skipped so the two vocabularies can be reconciled deliberately rather
 *    than by watching for crashes.
 * 2. **The names are normalised before matching.** Case, spaces and
 *    underscores are levelled, plurals and obvious synonyms are aliased. If
 *    the other side says `"paper lanterns"`, `"paper_lanterns"` or
 *    `"lanterns"`, all three light up.
 *
 * ## The vocabulary
 *
 * Anything in `SUPPORTED_PROPS` is recognised. Grouped by the room it belongs
 * to, though nothing stops a venue mixing them:
 *
 * **Lakeside dance pavilion (iskelmä)** — `bunting`, `fairy-lights`,
 * `paper-lanterns`, `moths`, `birch`, `lake`, `open-air`, `flowers`,
 * `railing`, `dance-floor`, `mirror-ball`, `chandelier`
 *
 * **Low brick room (jazz)** — `brick`, `tables`, `candles`, `low-ceiling`,
 * `bar`, `posters`, `haze`, `rug`
 *
 * **Black box (ambient)** — `black-box`, `projection`, `flight-case`,
 * `cables`, `drapes`
 *
 * **Any stage** — `pa-stack`, `wedges`, `riser`
 *
 * Four of them are architectural rather than dressing — `black-box`, `brick`,
 * `open-air` and `haze` change how the room itself is built, so `stage.ts`
 * reads those directly and the handlers here are deliberately empty.
 *
 * ## Where props are allowed to stand
 *
 * The cast is placed by `concert/cast.ts` and this file cannot see it, so
 * everything here keeps out of the playing area: floor props sit within a
 * metre of the wings, upstage of the backline, or downstage of the lip. The
 * three exceptions are underfoot on purpose — `rug`, `cables` and `riser` —
 * and `riser` is the one to watch, because `Station.riser` says a performer is
 * standing on a platform and this places one. Its top is at **0.4 m**, centred
 * at **(0, -1.15 m upstage of centre)**, 2.8 m wide by 2.0 m deep.
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
  AdditiveBlending, BufferGeometry, CatmullRomCurve3, Color,
  ConeGeometry, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group,
  IcosahedronGeometry, InstancedMesh, Line, LineBasicMaterial, Material, Mesh,
  Object3D, PlaneGeometry, ShaderMaterial, SphereGeometry, TorusGeometry,
  TubeGeometry, Vector3,
} from 'three';

import { Rng } from '../../core/rng.js';
import type { Venue } from '../../concert/types.js';
import {
  blend, cellPlane, HEAD_BAND, houseLid, hueShift, LENS_GAP, LOW_CEILING, playingArea, sagLine,
  shade, STAGE_SOFFIT, tint,
  type Kit, type PlayingArea, type Quality, type StageMetrics,
} from './stage-kit.js';

// ---------------------------------------------------------------------------
// The vocabulary
// ---------------------------------------------------------------------------

/** Everything `stage.ts` will act on. Aliases resolve into these. */
export const SUPPORTED_PROPS = [
  // architectural — handled in stage.ts
  'black-box', 'brick', 'open-air', 'haze',
  // pavilion
  'bunting', 'fairy-lights', 'paper-lanterns', 'moths', 'birch', 'lake',
  'flowers', 'railing', 'dance-floor', 'mirror-ball', 'chandelier',
  // club
  'tables', 'candles', 'low-ceiling', 'bar', 'posters', 'rug',
  // black box
  'projection', 'flight-case', 'cables', 'drapes',
  // any stage
  'pa-stack', 'wedges', 'riser',
] as const;

export type PropName = (typeof SUPPORTED_PROPS)[number];

/** Spellings the other side might reasonably use. */
const ALIASES: Record<string, PropName> = {
  blackbox: 'black-box', 'black-boxes': 'black-box', studio: 'black-box',
  'brick-wall': 'brick', brickwork: 'brick', bricks: 'brick',
  outdoor: 'open-air', outdoors: 'open-air', openair: 'open-air',
  smoke: 'haze', fog: 'haze', mist: 'haze',
  pennants: 'bunting', flags: 'bunting', garland: 'bunting',
  'string-lights': 'fairy-lights', festoon: 'fairy-lights',
  lights: 'fairy-lights', 'festoon-lights': 'fairy-lights',
  lanterns: 'paper-lanterns', 'paper-lantern': 'paper-lanterns',
  moth: 'moths', insects: 'moths',
  birches: 'birch', trees: 'birch', 'birch-trees': 'birch',
  water: 'lake', 'lake-view': 'lake',
  plants: 'flowers', flowerpots: 'flowers', 'flower-pots': 'flowers',
  rail: 'railing', balustrade: 'railing', fence: 'railing',
  parquet: 'dance-floor', dancefloor: 'dance-floor',
  glitterball: 'mirror-ball', 'disco-ball': 'mirror-ball', mirrorball: 'mirror-ball',
  chandeliers: 'chandelier',
  'cabaret-tables': 'tables', 'small-tables': 'tables', 'cafe-tables': 'tables',
  candle: 'candles', tealights: 'candles',
  ceiling: 'low-ceiling', 'low-roof': 'low-ceiling',
  counter: 'bar', 'bar-counter': 'bar',
  poster: 'posters', bills: 'posters', playbills: 'posters',
  carpet: 'rug', rugs: 'rug',
  projections: 'projection', film: 'projection', slides: 'projection',
  video: 'projection', 'projection-screen': 'projection',
  'flight-cases': 'flight-case', 'road-case': 'flight-case', cases: 'flight-case',
  cabling: 'cables', leads: 'cables', 'cable-runs': 'cables',
  pa: 'pa-stack', speakers: 'pa-stack', 'speaker-stack': 'pa-stack',
  amps: 'pa-stack', 'pa-stacks': 'pa-stack', stacks: 'pa-stack',
  monitors: 'wedges', 'floor-monitors': 'wedges', wedge: 'wedges',
  'black-drapes': 'drapes', legs: 'drapes', masking: 'drapes', tabs: 'drapes',
  'drum-riser': 'riser', platform: 'riser', risers: 'riser', rostrum: 'riser',
};

const KNOWN = new Set<string>(SUPPORTED_PROPS);

/** Level case, separators and plurals, then resolve aliases. */
export function normaliseProp(raw: string): PropName | undefined {
  const key = raw.trim().toLowerCase().replace(/[\s_]+/g, '-');
  if (KNOWN.has(key)) return key as PropName;
  const alias = ALIASES[key];
  if (alias) return alias;
  const singular = key.replace(/s$/, '');
  if (KNOWN.has(singular)) return singular as PropName;
  return ALIASES[singular];
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
  for (const name of SUPPORTED_PROPS) {
    if (!wanted.has(name)) continue;
    BUILDERS[name](ctx);
    placed.push(name);
  }

  return {
    root,
    placed,
    ignored: unknownProps(o.venue.props),
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
   * It was at **camera height**. The wide shot works between 2.1 and 3.6 m and
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

  /** Leads on the boards. Nobody notices them and the stage is wrong without. */
  cables: (c) => {
    const rng = c.rng('cables');
    const mat = c.kit.solid(shade(c.p.backdrop, 0.7), { rough: 0.9 });
    for (let i = 0; i < 3; i++) {
      const from = new Vector3(rng.float(-c.m.width * 0.4, c.m.width * 0.4), 0.03, c.m.backZ + 0.4);
      const to = new Vector3(rng.float(-c.m.width * 0.3, c.m.width * 0.3), 0.03, rng.float(-0.5, c.m.lipZ - 1.4));
      const mid = new Vector3(
        (from.x + to.x) / 2 + rng.float(-1.2, 1.2), 0.03,
        (from.z + to.z) / 2 + rng.float(-0.6, 0.6),
      );
      const curve = new CatmullRomCurve3([from, mid, to]);
      const geo = c.kit.own(new TubeGeometry(curve, 18, 0.022, 4, false));
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
   */
  riser: (c) => {
    const w = Math.min(2.8, c.m.width * 0.32);
    const d = Math.min(2.0, c.m.depth * 0.3);
    put(c, c.kit.bevelBox(w, 0.4, d, 0.03), c.kit.solid(shade(c.p.boards, 0.3), { rough: 0.9 }),
      0, 0.2, c.m.backZ + d / 2 + 0.45, true);
    put(c, c.kit.bevelBox(w + 0.1, 0.04, d + 0.1, 0.015), c.kit.solid(shade(c.p.curtain, 0.35)),
      0, 0.41, c.m.backZ + d / 2 + 0.45);
  },
};
