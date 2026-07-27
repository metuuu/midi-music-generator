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
 * **Black box (ambient)** — `black-box`, `projection`, `gear-table`,
 * `flight-case`, `cables`, `drapes`
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
 */

import {
  AdditiveBlending, BackSide, BufferGeometry, CatmullRomCurve3, Color,
  ConeGeometry, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group,
  IcosahedronGeometry, InstancedMesh, Line, LineBasicMaterial, Material, Mesh,
  Object3D, PlaneGeometry, ShaderMaterial, SphereGeometry, TorusGeometry,
  TubeGeometry, Vector3,
} from 'three';

import { Rng } from '../../core/rng.js';
import type { Venue } from '../../concert/types.js';
import {
  blend, cellPlane, hueShift, sagLine, shade, tint,
  type Kit, type Quality, type StageMetrics,
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
  'projection', 'gear-table', 'flight-case', 'cables', 'drapes',
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
  'table-of-gear': 'gear-table', trestle: 'gear-table', 'gear-tables': 'gear-table',
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
  p: Venue['palette'];
  accent: string;
  idle: number;
  rng(tag: string): Rng;
  tick(fn: (t: number, dt: number) => void): void;
}

export function dressStage(o: PropOptions): PropRig {
  const root = new Group();
  const updaters: ((t: number, dt: number) => void)[] = [];
  const ctx: Ctx = {
    ...o,
    root,
    m: o.metrics,
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

  /** Two swagged runs of triangular flags across the opening. */
  bunting: (c) => {
    const rng = c.rng('bunting');
    const w = c.m.openingWidth;
    const runs = [
      { y: c.m.openingHeight * 0.86, z: c.m.curtainZ - 0.35, sag: 0.8, n: 20 },
      { y: c.m.openingHeight * 0.62, z: c.m.backZ + 0.5, sag: 0.6, n: 16 },
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
        const drop = 0.3 + rng.float(-0.03, 0.03);
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
    const pts = sagLine(
      new Vector3(-w / 2, c.m.openingHeight * 0.78, c.m.curtainZ - 0.15),
      new Vector3(w / 2, c.m.openingHeight * 0.78, c.m.curtainZ - 0.15),
      0.9, n,
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

  'paper-lanterns': (c) => {
    const rng = c.rng('lanterns');
    const warm = tint(hueShift(c.p.curtain, 25, 0.1), 0.45);
    const geo = c.kit.geometry('lantern', () => new SphereGeometry(0.19, 10, 7));
    const group = new Group();
    c.root.add(group);
    const swings: { node: Object3D; phase: number; rate: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * (c.m.openingWidth / 5.5);
      const y = c.m.openingHeight * (0.7 + rng.float(-0.08, 0.08));
      const z = c.m.backZ + 1.1 + rng.float(-0.4, 0.4);
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

  /** Moths in the beams. Twenty-four instanced flecks and a lot of charm. */
  moths: (c) => {
    const rng = c.rng('moths');
    const n = c.quality === 'low' ? 10 : 24;
    const mesh = new InstancedMesh(
      c.kit.geometry('moth', () => new ConeGeometry(0.035, 0.07, 3)),
      c.kit.basic(tint(c.p.ambient, 0.7)),
      n,
    );
    mesh.frustumCulled = false;
    c.root.add(mesh);
    const flock = Array.from({ length: n }, () => ({
      x: rng.float(-c.m.width * 0.4, c.m.width * 0.4),
      y: rng.float(1.6, c.m.openingHeight * 0.85),
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
      dummy.position.set(x, 0.11, c.m.lipZ - 0.28);
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
    for (const y of [0.95, 0.62]) {
      put(c, c.kit.bevelBox(w, 0.09, 0.09, 0.03), mat, 0, y, c.m.lipZ - 0.12, true);
    }
    const n = Math.max(4, Math.round(w / 1.3));
    const posts = new InstancedMesh(c.kit.bevelBox(0.1, 0.95, 0.1, 0.03), mat, n);
    const dummy = new Object3D();
    for (let i = 0; i < n; i++) {
      dummy.position.set((i - (n - 1) / 2) * (w / (n - 1)), 0.48, c.m.lipZ - 0.12);
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

  chandelier: (c) => {
    const n = 8;
    const brass = tint(hueShift(c.p.proscenium, 30, 0.15), 0.25);
    const node = new Group();
    node.position.set(0, c.m.houseY + 3.4, c.m.lipZ + 4.5);
    const ring = new Mesh(
      c.kit.geometry('chand-ring', () => new TorusGeometry(0.55, 0.045, 5, 16)),
      c.kit.solid(brass, { metal: 0.7, rough: 0.35 }),
    );
    ring.rotation.x = Math.PI / 2;
    node.add(ring);
    const bulbs = new InstancedMesh(
      c.kit.geometry('bulb', () => new IcosahedronGeometry(0.05, 0)),
      c.kit.basic(tint(c.p.ambient, 0.6)), n,
    );
    const dummy = new Object3D();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * 0.55, 0.1, Math.sin(a) * 0.55);
      dummy.scale.setScalar(1.4);
      dummy.updateMatrix();
      bulbs.setMatrixAt(i, dummy.matrix);
    }
    node.add(bulbs);
    c.root.add(node);
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

  /** The ceiling is what makes a basement a basement. */
  'low-ceiling': (c) => {
    // Stops at the stage lip: a ceiling over the *band* at this height would
    // have the trumpet player's head inside it.
    const ceil = put(c, c.kit.geometry('ceil', () => new PlaneGeometry(c.m.houseWidth + 6, c.m.houseDepth)),
      c.kit.solid(shade(c.p.backdrop, 0.55), { side: BackSide }),
      0, c.m.houseY + 2.9, c.m.lipZ + c.m.houseDepth / 2 + 0.25);
    ceil.rotation.x = -Math.PI / 2;
    const pipe = c.kit.geometry('pipe', () => new CylinderGeometry(0.07, 0.07, c.m.houseWidth + 6, 6));
    for (const z of [c.m.lipZ + 2.2, c.m.lipZ + 5.4]) {
      const p = put(c, pipe, c.kit.solid(shade(c.p.proscenium, 0.5), { metal: 0.4, rough: 0.5 }),
        0, c.m.houseY + 2.72, z);
      p.rotation.z = Math.PI / 2;
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

  /** The table half the band stands behind. */
  'gear-table': (c) => {
    const w = Math.min(2.4, c.m.width * 0.28);
    const top = shade(c.p.boards, 0.55);
    put(c, c.kit.bevelBox(w, 0.07, 0.7, 0.02), c.kit.solid(top), -c.m.width * 0.16, 0.82, c.m.backZ + 1.05, true);
    const leg = c.kit.bevelBox(0.07, 0.8, 0.07, 0.02);
    const legMat = c.kit.solid(shade(c.p.proscenium, 0.55), { metal: 0.3, rough: 0.5 });
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        put(c, leg, legMat, -c.m.width * 0.16 + sx * (w / 2 - 0.1), 0.4, c.m.backZ + 1.05 + sz * 0.28);
      }
    }
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

  /** Extra masking legs. A black box is mostly drapes. */
  drapes: (c) => {
    const cloth = c.kit.solid(shade(c.p.curtain, 0.55), { rough: 0.98, side: DoubleSide });
    const h = c.m.openingHeight;
    const geo = c.kit.geometry(`drape|${h}`, () => new PlaneGeometry(1.8, h));
    for (const side of [-1, 1]) {
      for (let i = 0; i < 2; i++) {
        const m = put(c, geo, cloth, side * (c.m.openingWidth / 2 - 0.2), h / 2, c.m.curtainZ - 1.6 - i * 1.9);
        m.rotation.y = side * 0.35;
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
