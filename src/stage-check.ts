/**
 * Stage correctness checks — the dressing side of `npm run concert`.
 *
 *   npm run stage
 *
 * Every prop and room defect this repo has ever fixed was found by a person
 * looking at one screenshot: a lantern on a drummer's face, a chandelier
 * floating under its own ceiling, a truss with its motor drops ending in open
 * air, a poster pasted two metres inboard of the brick. The cast side has not
 * been found that way since `concert-check.ts` was written — it verifies 1.1 M
 * hand and foot gestures against the instruments they land on — and the reason
 * is not that hands are easier. It is that nobody wrote the other half.
 *
 * This is the other half. Seventy-two venues, one seed, no browser: `buildStage`
 * is pure `Venue` in and scene graph out, so every question below is arithmetic
 * over boxes and rays, and none of it needs a screenshot or a person.
 *
 * ## What it can and cannot see
 *
 * It sees geometry. It cannot see colour, and it should not try: a wall the
 * wrong shade is a matter of taste and a wall in the wrong place is not. The
 * six sections are the six ways a stage has actually been wrong here —
 * something floating, something hung off nothing, something through the
 * ceiling, two things in the same cubic metre, something standing in front of
 * the one object in the room that emits light, and a hole you can see the void
 * through.
 *
 * ## Provenance, without touching the thing being measured
 *
 * A failure has to name a builder or it is not actionable, and three.js keeps
 * no record of who added what. So `Object3D.prototype.add` is wrapped **here**,
 * for the length of this run, and the innermost `stage-props.ts` /
 * `rooms/*.ts` frame of the stack is recorded against the object. Nothing in
 * `web/concert/` knows this file exists, which is the point: a debug hook in
 * production code is a hook that will be read as an interface. The same trick
 * wraps `RoomBuilder.shape`, because `RoomShape` carries three numbers —
 * `rigLid` above all — that `StageMetrics` does not republish, and a check that
 * reconstructed the `RoomDatum` by hand would be a second copy of `stage.ts`'s
 * first thirty lines, free to drift.
 *
 * ## Read `concert-check.ts` first
 *
 * Same shape, same reason: every assertion prints its worst measurement even
 * when it passes, so a regression shows up as a number moving one run before it
 * shows up as a red line.
 *
 * ## What it said the first time it ran, so the next reader knows what moved
 *
 * All six failed, on 72 venues in 35 s, against a tree that was already under
 * repair while this was being written — so these are a floor rather than a
 * census, and several had been fixed between the first measurement and the last.
 *
 * In order: 8 prop clusters fixed to nothing, all of them a hanging run tied to
 * a fly bar its own ends overshoot — the pavilion's and the lawn's bunting,
 * festoons and lanterns. 15 of 60 hanging assemblies with nothing at the top,
 * worst the pavilion's paper lanterns at 4.149 m from any surface at all, and
 * `salon truss` hung at 5.350 with the first surface at 5.510, which is the
 * shape of sentence a fix has to answer. 18 prop instances above their half of
 * the room's lid on two room-and-prop pairs, worst `theatre drapes` at 4.400
 * against a 2.850 soffit: 1.550 m of cloth through the plaster. 53 real
 * collisions of 95 candidates on nine pairs, worst `salon arches x backline` at
 * 0.0907 m³ — an amp stack a fifth of a cubic metre inside a stone pier. Five
 * lit props screened, worst `salon screen` 39.4% behind its own arcade. And
 * 4084 of 266 112 rays out of the building in seven rooms, 2385 of them in the
 * black box, which is one defect seen 2385 times: `proscenium.ts` builds no
 * ceiling.
 *
 * Four were measured a second way before this file was committed, because a
 * check nobody has audited is a check that invents work. `salon truss`
 * reproduces a number written into `RoomShape.rigLid`'s docstring long before
 * this file existed, to the millimetre. `theatre drapes` is arithmetic:
 * `BUILDERS.drapes` sets `h = openingHeight` and places the panel at `h / 2`,
 * so its top *is* `openingHeight`, and it reads no lid at any point.
 * `shed backline x flight-case` is 0.52 × 0.59 × 0.16 m by hand off the two
 * builders' own placement rules — and `flight-case`'s docstring says in prose
 * that it walks out of `pa-stack`'s footprint, with no mention of the other
 * thing parked on that same strip of boards. `black-box drapes x flight-case`
 * is the same measurement on the other side: 0.105 m³ of bounding box, 0.009 m³
 * of cloth.
 */

import {
  Box3, DoubleSide, Matrix4, Object3D, Raycaster, Vector3,
  type BufferGeometry, type InstancedMesh, type Material, type Mesh,
} from 'three';

import { GENRES } from './genre/index.js';
import { chooseVenue, PROPS, type PropName } from './concert/venue.js';
import type { Venue } from './concert/types.js';
import { buildStage } from './web/concert/stage.js';
import { LENS_GAP, type StageMetrics } from './web/concert/stage-kit.js';
import { ROOMS } from './web/concert/rooms/index.js';
import type { RoomShape } from './web/concert/rooms/types.js';

// ---------------------------------------------------------------------------
// The four tolerances
// ---------------------------------------------------------------------------

/**
 * How close two surfaces have to be before one is **fixed to** the other.
 *
 * 0.06 m, and it is a modelling tolerance rather than a physical one. Nothing
 * in this directory is built by placing a bracket: a cord is drawn to the
 * height its room published, a truss post is cut to `lid - (y + S)`, a lantern
 * body hangs at `hang - 0.12`. So the gap between a hanger and the thing it
 * claims to hang from is either zero by construction or it is the whole
 * distance the arithmetic was wrong by, and the second kind is never small —
 * the eight cases `rigLid` was added for run from 0.153 m to 0.533 m, the
 * `mirror-ball` rod missed by 0.51 m in the hall and 2.5 m in a circuit, and
 * the `paper-lanterns` cord found nothing within 0.35 m in any of the four
 * venues that carry it.
 *
 * 0.06 m is therefore chosen to sit in the empty band between "the model rounds
 * to this" and "the arithmetic was wrong": under the smallest real defect on
 * record by a factor of two and a half, and clear of every deliberate standoff
 * measured — the ballroom's grid batten at 0.025 m off a truss pick, the shed's
 * nearest rafter at 0.054 m, both of which their own files argue for in prose.
 * It is a narrow band and it is a real one; if a room ever wants more than
 * 60 mm of daylight between a hanger and its steel, the room should say so and
 * §2 should go red until it does.
 */
const CONTACT = 0.06;

/**
 * A modelling standoff, not a collision.
 *
 * 0.02 m. Two objects that share a boundary — a purlin on a tie, a post buried
 * 0.035 m into a chord, a bill flush against `wallX` — are drawn to touch, and
 * floating-point and bevel radii put the surfaces a few millimetres either side
 * of the nominal plane. Anything under 20 mm of overlap or clearance is that,
 * and calling it a fault would mean every joint in the rig is a fault.
 */
const CLEAR = 0.02;

/**
 * How much intersecting volume earns the name "collision".
 *
 * 0.004 m³ — a 16 cm cube. Below this the two objects are touching, mitred or
 * buried on purpose (see `CLEAR`), and a check that reported them would report
 * the whole rig. Volume rather than depth because the thing that reads as a
 * fault on screen is one object *inside* another, and a deep intersection over
 * a hairline area is a mitre while a shallow one over a square metre is a box
 * sunk into a wall.
 */
const SOLID = 0.004;

/**
 * The width below which a hole in the enclosure is a seam.
 *
 * 0.05 m. Two walls that meet at a corner are two planes ending at the same
 * line, and a ray fired exactly along that line hits neither — the room is not
 * open there, the model just has no thickness at the join. Measured by firing
 * the escaping ray again from four origins offset 0.025 m across it: if all
 * four find a surface, the hole is narrower than a joint and is reported rather
 * than failed.
 */
const GAP = 0.05;

// ---------------------------------------------------------------------------

const problems: string[] = [];
const check = (label: string, pass: boolean, detail: string): void => {
  console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${label.padEnd(46)} ${detail}`);
  if (!pass) problems.push(label);
};

const m3 = (v: number): string => `${v.toFixed(3)} m`;

// ---------------------------------------------------------------------------
// Who built what
// ---------------------------------------------------------------------------

const PROP_NAMES = new Set<string>(PROPS);
/** Object → `prop:<name>`, `room:<file>`, or `stage` for the datum and house. */
const builtBy = new Map<Object3D, string>();

const realAdd = Object3D.prototype.add;
type AddFn = (this: Object3D, ...objs: Object3D[]) => Object3D;
(Object3D.prototype as { add: AddFn }).add = function patched(
  this: Object3D, ...objs: Object3D[]
): Object3D {
  const frames = (new Error().stack ?? '').split('\n');
  let tag = 'stage';
  for (let i = 2; i < frames.length; i++) {
    const hit = /at (?:\w+\.)?([A-Za-z0-9_$<>.-]+) \(.*\/(stage-props|stage-audience|rooms\/[a-z-]+)\.ts:/
      .exec(frames[i] ?? '');
    if (!hit) continue;
    if (hit[2] === 'stage-audience') { tag = 'audience'; break; }
    if (hit[2] === 'stage-props') {
      // `put`, `cord` and the tick closures are all in this file too, so the
      // frame that names the prop is the first one whose function name is one
      // of the vocabulary's own words. Everything else keeps looking outward.
      if (PROP_NAMES.has(hit[1] ?? '')) { tag = `prop:${hit[1]}`; break; }
      continue;
    }
    tag = `room:${(hit[2] ?? '').slice(6)}`;
    break;
  }
  for (const o of objs) if (o && !builtBy.has(o)) builtBy.set(o, tag);
  return realAdd.apply(this, objs);
};

/** The last `RoomShape` each architecture answered. See the header. */
let lastShape: RoomShape | undefined;
for (const builder of Object.values(ROOMS)) {
  const real = builder.shape.bind(builder);
  builder.shape = (d) => { const s = real(d); lastShape = s; return s; };
}

// ---------------------------------------------------------------------------
// A piece: one instance of one mesh, in world space
// ---------------------------------------------------------------------------

interface Piece {
  prop: PropName | undefined;
  box: Box3;
  /** Instance index inside an `InstancedMesh`, or -1. */
  at: number;
  /** A `Line` — a cord or a cable run. Real, and with no volume. */
  wire: boolean;
  /**
   * `depthWrite: false` — the haze cards and the sky dome. Drawn, and not a
   * surface: nothing can be nailed to smoke, and a sky that counted as a hit
   * would report every open-air rig as properly rigged.
   */
  ghost: boolean;
  object: Object3D;
}

const SIZE = new Vector3();
const dimension = (b: Box3, pick: 'min' | 'max'): number => {
  b.getSize(SIZE);
  return pick === 'min' ? Math.min(SIZE.x, SIZE.y, SIZE.z) : Math.max(SIZE.x, SIZE.y, SIZE.z);
};

/**
 * Two adjustments to the built rig, before a single measurement is taken.
 *
 * **Every material becomes double-sided.** A ceiling is one plane with its
 * normal pointing at the floor, and `Raycaster` obeys `material.side` — so a
 * ray fired *up* at a `FrontSide` ceiling passes through it and reports open
 * sky. That is a rendering fact and this file is asking a modelling question:
 * is there a surface at that height. Left alone it reported 63 of 68 hanging
 * assemblies as hung off nothing and 16 081 escaping rays, almost all of them
 * through a lid that is right there.
 *
 * **The audience is dropped.** Six hundred and seventy-two instanced people per
 * venue is 76% of everything in the scene, and none of it is scenery: nothing
 * in this file may be *fixed to* a person, nothing may be excused for standing
 * behind one, and the floor they are on anchors everything they could have. It
 * costs §1 nothing and saves it 48 000 boxes.
 */
function readPieces(root: Object3D): Piece[] {
  const out: Piece[] = [];
  const m4 = new Matrix4();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    const mesh = o as Partial<Mesh>;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) if (mat) mat.side = DoubleSide;
  });
  root.traverse((o) => {
    if ((builtBy.get(o) ?? '') === 'audience') return;
    const any = o as Partial<Mesh> & { isMesh?: boolean; isLine?: boolean; isInstancedMesh?: boolean };
    if (!any.isMesh && !any.isLine) return;
    const geo = any.geometry as BufferGeometry | undefined;
    if (!geo) return;
    if (!geo.boundingBox) geo.computeBoundingBox();
    const base = geo.boundingBox;
    if (!base || !Number.isFinite(base.min.x)) return;
    const tag = builtBy.get(o) ?? 'stage';
    const prop = tag.startsWith('prop:') ? (tag.slice(5) as PropName) : undefined;
    const mat = any.material as Material | Material[] | undefined;
    const one = Array.isArray(mat) ? mat[0] : mat;
    const ghost = one?.depthWrite === false;
    const wire = any.isLine === true;
    if (any.isInstancedMesh) {
      const inst = o as InstancedMesh;
      for (let i = 0; i < inst.count; i++) {
        inst.getMatrixAt(i, m4);
        m4.premultiply(inst.matrixWorld);
        out.push({ prop, box: base.clone().applyMatrix4(m4), at: i, wire, ghost, object: o });
      }
      return;
    }
    out.push({ prop, box: base.clone().applyMatrix4(o.matrixWorld), at: -1, wire, ghost, object: o });
  });
  return out;
}

/** Straight-line distance between two boxes; 0 when they touch or overlap. */
function boxGap(a: Box3, b: Box3): number {
  const dx = Math.max(0, a.min.x - b.max.x, b.min.x - a.max.x);
  const dy = Math.max(0, a.min.y - b.max.y, b.min.y - a.max.y);
  const dz = Math.max(0, a.min.z - b.max.z, b.min.z - a.max.z);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// ---------------------------------------------------------------------------
// The corpus
// ---------------------------------------------------------------------------

interface Scene {
  venue: Venue;
  /** `funk/jb` — the genre and era that drew this dressing, so it reproduces. */
  label: string;
  m: StageMetrics;
  shape: RoomShape;
  pieces: Piece[];
  /** Everything a ray may legitimately stop on. No haze, no sky, no cord. */
  solids: Object3D[];
  /** Everything opaque, plus the sky. See where it is filled in. */
  shell: Object3D[];
  openAir: boolean;
}

/** How a failure names its venue: the room to fix, and the dressing to rebuild. */
const who = (s: Scene): string => `${s.venue.id}@${s.label}`;

const raycaster = new Raycaster();
raycaster.far = 140;

/** Does anything solid stand in this direction, and how far away is it? */
function shoot(from: Vector3, dir: Vector3, targets: Object3D[]): number {
  raycaster.far = 140;
  raycaster.set(from, dir);
  const hits = raycaster.intersectObjects(targets, false);
  return hits.length ? (hits[0]?.distance ?? Infinity) : Infinity;
}

/**
 * Whether a point is inside the actual triangles of one piece.
 *
 * Parity: a ray from an interior point crosses a closed surface an odd number
 * of times. Three directions and a majority, because half of what this file
 * measures is *not* closed — a leg drape is one curved sheet, a screen is a
 * plane — and a single ray gives every point in front of a sheet an odd count
 * and calls it solid. Three unrelated directions agree only where the surface
 * really wraps the point.
 *
 * The directions are deliberately not axis-aligned: everything here is built
 * from boxes and cylinders on the axes, and an axis-parallel ray lands on a
 * shared face plane and counts it twice or not at all.
 */
const PARITY: readonly Vector3[] = [
  new Vector3(0.7331, 0.5123, 0.4471).normalize(),
  new Vector3(-0.2110, 0.8330, -0.5120).normalize(),
  new Vector3(0.4510, -0.2880, 0.8440).normalize(),
];

function inside(at: Vector3, p: Piece): boolean {
  let votes = 0;
  for (const d of PARITY) {
    raycaster.far = 200;
    raycaster.set(at, d);
    const crossings = raycaster.intersectObject(p.object, false)
      .filter((h) => p.at < 0 || h.instanceId === p.at).length;
    if (crossings % 2 === 1) votes++;
  }
  return votes >= 2;
}

/** What fraction of a box is inside both pieces. 6³ samples, cell-centred. */
function solidShare(box: Box3, a: Piece, b: Piece): number {
  const N = 6;
  const at = new Vector3();
  let both = 0;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      for (let k = 0; k < N; k++) {
        at.set(
          box.min.x + ((i + 0.5) / N) * (box.max.x - box.min.x),
          box.min.y + ((j + 0.5) / N) * (box.max.y - box.min.y),
          box.min.z + ((k + 0.5) / N) * (box.max.z - box.min.z),
        );
        if (inside(at, a) && inside(at, b)) both++;
      }
    }
  }
  return both / (N * N * N);
}

// ---------------------------------------------------------------------------
// §2 — the props that hang from a published height
// ---------------------------------------------------------------------------

/**
 * Every prop that solves a height off `rigHeight()`, `headroom`, `houseLid`,
 * `flyY` or `openingHeight + 1.2` **and hangs from it** — read out of
 * `stage-props.ts`, not guessed.
 *
 * `beams` reads `headroom - 0.22` and is not here, because it does not hang
 * from it. It is a tie beam: `span` is `houseWidth + 6`, so both ends are
 * buried a clear three metres inside the side walls, and what holds it up is
 * §1's business rather than this section's. A ray fired up off the top of a
 * purlin measures the gap to the roof over it, which in a shed is 0.643 m and
 * is *correct* — a tie beam is not shackled to the sheeting.
 *
 * What the *name* of the height is is measured rather than restated. Matching
 * the top of the built assembly against every number the room published is
 * robust against the builder being changed to ask for a different one, which is
 * exactly what is happening to `truss` and `rigLid` — and it says something a
 * restatement cannot: whether the number the room published is where the prop
 * actually ended up.
 */
const HANGERS: readonly PropName[] = [
  'bunting', 'fairy-lights', 'paper-lanterns', 'mirror-ball', 'chandelier', 'truss',
];

function namedHeight(s: RoomShape, m: StageMetrics, y: number): string {
  const named: [string, number][] = [
    ['headroom', m.headroom], ['houseLid', m.houseLid], ['rigLid', s.rigLid],
    ['flyY', m.flyY], ['openingHeight', m.openingHeight],
    ['openingHeight+1.2', m.openingHeight + 1.2],
  ];
  const found = named.filter(([, v]) => Number.isFinite(v) && Math.abs(v - y) < 0.002);
  return found.length ? found.map(([k]) => k).join('=') : 'no published height';
}

// ---------------------------------------------------------------------------
// §5 — the props that are meant to be looked at
// ---------------------------------------------------------------------------

const LIT: readonly PropName[] = ['screen', 'projection', 'neon', 'organ-pipes'];

// ---------------------------------------------------------------------------
// Build them all, once
// ---------------------------------------------------------------------------

const t0 = Date.now();
const scenes: Scene[] = [];
for (const gid of Object.keys(GENRES)) {
  for (const eid of Object.keys(GENRES[gid]?.eras ?? {})) {
    const venue = chooseVenue(gid, eid, 'seed0');
    builtBy.clear();
    lastShape = undefined;
    const rig = buildStage(venue, { quality: 'high', reducedMotion: false });
    // One frame, so the props whose positions are written by their `tick` —
    // `moths` above all — are measured where they are drawn rather than at the
    // origin, which is where an untouched `InstancedMesh` leaves them.
    rig.update(0, 1 / 60);
    const pieces = readPieces(rig.root);
    const shape = lastShape;
    if (!shape) throw new Error(`no RoomShape captured for ${venue.id}`);
    const solid: Object3D[] = [];
    const shell: Object3D[] = [];
    const seen = new Set<Object3D>();
    for (const p of pieces) {
      if (seen.has(p.object)) continue;
      seen.add(p.object);
      if (!p.wire && !p.ghost) solid.push(p.object);
      /**
       * The shell is everything opaque, plus the sky — which is a `ghost` to
       * every other section and is the only thing closing an open-air room.
       *
       * Props are in it, and that is not a concession. The jazz cellar's
       * plaster is `BUILDERS['low-ceiling']` and not `proscenium.ts`, so a
       * shell of "the building only" reported 17 726 escaping rays, nearly all
       * of them straight up through a ceiling that is right there and filed
       * under dressing. §6 asks whether a camera can see the void, and the void
       * does not care which file closed it.
       */
      const sky = p.ghost && dimension(p.box, 'min') >= 30;
      if (!p.wire && (!p.ghost || sky)) shell.push(p.object);
    }
    scenes.push({
      venue, label: `${gid}/${eid}`, m: rig.metrics, shape, pieces,
      solids: solid, shell, openAir: venue.props.includes('open-air'),
    });
  }
}
console.log(`\n${scenes.length} venues, ${scenes.reduce((a, s) => a + s.pieces.length, 0)} pieces, built in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

// ---------------------------------------------------------------------------
// §1 — every prop object is fixed to something
// ---------------------------------------------------------------------------
console.log('\nFixed to something');

/**
 * The anchor seed: everything that is already part of the building.
 *
 * `< 30 m in its smallest dimension` is what keeps the sky dome out. It is a
 * 40–90 m sphere centred on the house, so *everything* is inside it and a union
 * seeded from it would report every open-air venue as perfectly rigged. The
 * lake is the object the rule is tuned around from the other side: 90 × 60 m of
 * water, zero thick, 32 m upstage — landscape rather than dressing, fixed to
 * ground the room does not model, and it legitimately anchors its own glint.
 * It is a prop by filing and an anchor by nature, so it is named here.
 */
const ANCHOR_PROPS = new Set<string>(['lake']);
/**
 * The one prop that is not fixed to anything and is right not to be.
 *
 * `moths` fly. They are the one prop in the vocabulary whose whole subject is
 * not being attached to anything, and `BUILDERS.moths` says so — twenty-four
 * flecks on sine wander between `HANG_FLOOR + 0.28` and `0.92 openingHeight`.
 *
 * `stalls` was the other one, and it was here because it was a wall of seat
 * *backs* and nothing else: one 0.55 × 0.5 m plane per seat, hanging at `houseY
 * + 0.66`, with no pan, no legs and 0.41 m of air under it. 2094 of the 2109
 * clusters this section first reported were one of those planes each. It has
 * since grown the standards that argument was really asking for and then a pan
 * between them, so every seat reaches `houseY` and the exemption was doing
 * nothing but hiding a prop that now passes on its own.
 */
const FLOATERS = new Set<string>(['moths']);

class Union {
  private readonly up: number[];
  constructor(n: number) { this.up = Array.from({ length: n }, (_, i) => i); }
  find(a: number): number {
    let r = a;
    while (this.up[r] !== r) r = this.up[r] as number;
    while (this.up[a] !== r) { const n = this.up[a] as number; this.up[a] = r; a = n; }
    return r;
  }
  join(a: number, b: number): void {
    const x = this.find(a); const y = this.find(b);
    if (x !== y) this.up[x] = y;
  }
}

let looseClusters = 0;
/** Room and prop set → the first era that showed it. See `overLid` in §3. */
const loose = new Map<string, string>();
let lonely = 0;
let lonelyAt = '';

for (const s of scenes) {
  // No haze and no sky: nothing is fixed to smoke, and a 0.85 × 2.6 m card
  // drifting over the boards would otherwise anchor whatever it touched and
  // weld two unrelated clusters together on its way past.
  const live = s.pieces.filter((p) => !p.ghost);
  const pad = CONTACT / 2;
  const grown = live.map((p) => p.box.clone().expandByScalar(pad));
  const u = new Union(live.length);

  // Split by size rather than gridding everything: the room's floors, walls and
  // roof are twenty boxes several metres across, and a uniform grid holding
  // them holds them in every cell. Small against small through the grid, big
  // against all directly.
  const big: number[] = [];
  const cells = new Map<string, number[]>();
  const CELL = 1.2;
  const key = (x: number, y: number, z: number): string => `${x}|${y}|${z}`;
  for (let i = 0; i < live.length; i++) {
    const b = grown[i] as Box3;
    if (dimension(b, 'max') > 4) { big.push(i); continue; }
    for (let x = Math.floor(b.min.x / CELL); x <= Math.floor(b.max.x / CELL); x++) {
      for (let y = Math.floor(b.min.y / CELL); y <= Math.floor(b.max.y / CELL); y++) {
        for (let z = Math.floor(b.min.z / CELL); z <= Math.floor(b.max.z / CELL); z++) {
          const k = key(x, y, z);
          const bucket = cells.get(k);
          if (bucket) bucket.push(i); else cells.set(k, [i]);
        }
      }
    }
  }
  for (const bucket of cells.values()) {
    for (let a = 0; a < bucket.length; a++) {
      for (let b = a + 1; b < bucket.length; b++) {
        const i = bucket[a] as number; const j = bucket[b] as number;
        if ((grown[i] as Box3).intersectsBox(grown[j] as Box3)) u.join(i, j);
      }
    }
  }
  for (const i of big) {
    for (let j = 0; j < live.length; j++) {
      if (i === j) continue;
      if ((grown[i] as Box3).intersectsBox(grown[j] as Box3)) u.join(i, j);
    }
  }

  const anchored = new Set<number>();
  for (let i = 0; i < live.length; i++) {
    const p = live[i] as Piece;
    // The 30 m rule stands even though the only object it currently catches is
    // already out as a `ghost`: a room that drew an opaque dome would put the
    // whole world in one component, and the size test is the one that says why.
    const isAnchor = (!p.prop || ANCHOR_PROPS.has(p.prop)) && dimension(p.box, 'min') < 30;
    if (isAnchor) anchored.add(u.find(i));
  }

  const orphans = new Map<number, Set<string>>();
  for (let i = 0; i < live.length; i++) {
    const p = live[i] as Piece;
    if (!p.prop || FLOATERS.has(p.prop)) continue;
    const root = u.find(i);
    if (anchored.has(root)) continue;
    const bucket = orphans.get(root) ?? new Set<string>();
    bucket.add(p.prop);
    orphans.set(root, bucket);
  }
  for (const names of orphans.values()) {
    looseClusters++;
    const named = [...names].sort().join('+');
    if (!loose.has(`${s.venue.id} ${named}`)) loose.set(`${s.venue.id} ${named}`, `${who(s)} ${named}`);
  }

  // The loneliest prop instance in the venue: how far the nearest surface of
  // any kind is. Zero everywhere the rig is properly built, and the first
  // number to move when something starts floating.
  for (let i = 0; i < live.length; i++) {
    const p = live[i] as Piece;
    if (!p.prop || FLOATERS.has(p.prop) || ANCHOR_PROPS.has(p.prop)) continue;
    let near = Infinity;
    for (let j = 0; j < live.length; j++) {
      if (i === j || (live[j] as Piece).object === p.object) continue;
      const g = boxGap(p.box, (live[j] as Piece).box);
      if (g < near) near = g;
      if (near === 0) break;
    }
    if (near > lonely) { lonely = near; lonelyAt = `${who(s)} ${p.prop}`; }
  }
}

const looseSaid = [...loose.values()];
check('every prop object is fixed to something', looseClusters === 0,
  looseClusters
    ? `${looseClusters} free cluster(s), ${loose.size} room-and-prop: ${looseSaid.slice(0, 8).join(', ')}${looseSaid.length > 8 ? ', …' : ''}`
    : `loneliest instance ${lonelyAt} at ${m3(lonely)} from anything`);

// ---------------------------------------------------------------------------
// §2 — nothing hangs from a height with no surface at it
// ---------------------------------------------------------------------------
console.log('\nHung off something');

/**
 * There is no named excuse in this section, and there nearly was one.
 *
 * `shed` publishes its roof sheeting at the **edge of the boards**, and the
 * pitch carries the same sheeting 0.064 m higher over the truss's own pick 0.4 m
 * in; `shed.ts` argues in prose that a plane taken at the pick would be above
 * the roof at the corner of the deck, which is the worse lie. A vertical ray is
 * therefore expected to overshoot there, and it does — 0.534 m up to the next
 * thing directly overhead in every shed, unit and warehouse.
 *
 * It needs no excuse because the *nearest surface* to the top of that drop is a
 * rafter 0.054 m away, and a shackle is not a laser (see the tip loop below).
 * An excuse by name would have been a licence to be wrong in that room by any
 * amount; this passes on the measurement instead, and the day the rafter moves
 * out of reach the check goes red without anybody having to remember to lift
 * the exemption.
 */
let hangers = 0;
let standing = 0;
let unhung = 0;
/** Room and prop → the worst reach. See `overLid` in §3, same argument. */
const unhungWorst = new Map<string, { reach: number; said: string }>();
let worstHang = 0;
let worstHangSaid = 'nothing hangs anywhere';
const UP = new Vector3(0, 1, 0);
const DOWN = new Vector3(0, -1, 0);
const probe = new Box3();

for (const s of scenes) {
  for (const name of HANGERS) {
    const mine = s.pieces.filter((p) => p.prop === name);
    if (!mine.length) continue;
    const others = s.solids.filter((o) => !mine.some((p) => p.object === o));

    /**
     * A truss under an open sky is a tower, not a hanger.
     *
     * `BUILDERS.truss` has three cases and only two of them hang: with no lid
     * over the boards and no lid over the house it stands its verticals *down*
     * on to the boards or the house floor, which is what an arena rig does.
     * Asking what is above its top chord in that case measures the roof deck
     * ten metres up and calls a correctly built tower a defect. So the assembly
     * is asked what is under its own foot first, and if it is standing on
     * something this section has no question for it — §1 does.
     */
    const bottom = Math.min(...mine.map((p) => p.box.min.y));
    const foot = mine.filter((p) => p.box.min.y < bottom + 0.002)[0] as Piece;
    const underfoot = shoot(
      new Vector3((foot.box.min.x + foot.box.max.x) / 2, bottom + CLEAR,
        (foot.box.min.z + foot.box.max.z) / 2), DOWN, others,
    );
    if (underfoot <= CONTACT + CLEAR) { standing++; continue; }

    const top = Math.max(...mine.map((p) => p.box.max.y));
    const tips = mine.filter((p) => p.box.max.y > top - 0.002);
    let worst = 0;
    let found = Infinity;
    for (const tip of tips) {
      const at = new Vector3(
        (tip.box.min.x + tip.box.max.x) / 2, top - CLEAR, (tip.box.min.z + tip.box.max.z) / 2,
      );
      /**
       * The ray is the measurement and it is not the whole of it.
       *
       * Fired from `CLEAR` below the top so that a tie ending exactly *on* the
       * plaster — which is what every correctly solved hanger does — starts
       * under the surface it is looking for rather than above it. And a shackle
       * is not a laser: the ballroom's grid batten is 0.22 m deep and `truss`
       * picks it at `z ± S`, which lands 0.025 m off the timber's face, so a
       * vertical ray finds nothing over a post that is a finger's width from
       * six metres of solid oak. Whichever of the two is nearer is the reach.
       */
      const overhead = shoot(at, UP, others) - CLEAR;
      // The top `CLEAR` of the member itself, not its centre line: a 0.07 m
      // truss post standing 0.025 m off the face of the ballroom's grid batten
      // is 0.060 m off it measured from the middle of the pipe, and 0.025 m is
      // the number `stage-props.ts` argues for by name. Measure surface to
      // surface or the check disagrees with the file it is checking.
      probe.set(tip.box.min.clone().setY(top - CLEAR), tip.box.max.clone().setY(top));
      let near = Math.max(0, overhead);
      for (const p of s.pieces) {
        if (p.wire || p.ghost || p.prop === name) continue;
        if (p.box.max.y < top - CLEAR) continue;   // not a surface at this height
        const g = boxGap(probe, p.box);
        if (g < near) near = g;
      }
      if (near > worst) { worst = near; found = overhead; }
    }
    hangers++;
    const asked = namedHeight(s.shape, s.m, top);
    const surface = Number.isFinite(found)
      ? `first surface above it at ${(top + found).toFixed(3)}`
      : 'nothing above it at all';
    const line = `${who(s)} ${name}: hung at ${top.toFixed(3)} = ${asked}, ${worst > 0 ? `${m3(worst)} from anything` : 'touching'}, ${surface}`;
    if (worst > worstHang) { worstHang = worst; worstHangSaid = line; }
    if (worst <= CONTACT) continue;
    unhung++;
    const key = `${s.venue.id} ${name}`;
    const before = unhungWorst.get(key);
    if (!before || before.reach < worst) unhungWorst.set(key, { reach: worst, said: line });
  }
}

const unhungSaid = [...unhungWorst.values()].sort((a, b) => b.reach - a.reach);
check('nothing hangs from a height with no surface', unhung === 0,
  unhung
    ? `${unhung} of ${hangers}, ${unhungWorst.size} room-and-prop: ${unhungSaid.slice(0, 8).map((x) => x.said).join('; ')}${unhungSaid.length > 8 ? '; …' : ''}`
    : `${hangers} hung assemblies (${standing} more stand on the floor), worst ${m3(worstHang)} — ${worstHangSaid}`);

// ---------------------------------------------------------------------------
// §3 — nothing is drawn through the room's own lid
// ---------------------------------------------------------------------------
console.log('\nUnder the lid');

let throughLid = 0;
/**
 * One line per room and prop, carrying that pair's worst instance.
 *
 * Every dressing of a room draws its props by the same arithmetic, so a `beams`
 * purlin 0.120 m over a riihi's soffit is one bug seen once per era table, and
 * `moths` is twenty-four flecks each at its own height on the same wrong
 * ceiling. Printing them all buries the six distinct faults in thirty-one
 * lines. The key is the room and the prop; the number kept is the worst, and
 * the era that produced it rides along so the reading reproduces.
 */
const overLid = new Map<string, { over: number; said: string }>();
let worstLid = -Infinity;
let worstLidSaid = 'no room publishes a lid';

for (const s of scenes) {
  /**
   * The lid over the boards is the *surface*, which is not always `headroom`.
   *
   * `headroom` is a clearance plane — the lowest thing overhead, which in a
   * framed roof is the underside of a rafter with sheeting behind it. `rigLid`
   * is the surface a hanger is shackled to, and where the two differ they
   * differ by the depth of the roof: 0.470 m in a shed, 0.153 in a riihi, 0.160
   * in a salon.
   *
   * Testing against `headroom` alone puts this section in direct contradiction
   * with §2. §2 requires a drop to *reach* the surface it is fixed to, which is
   * `rigLid`; §3 would then fail the same drop for standing above `headroom`,
   * and no prop can satisfy both. Measured on the day the two were reconciled:
   * `shed mirror-ball` at 5.236 against a 4.766 soffit, exactly its own
   * `rigLid`, reported by §3 as 0.470 m of rod through the ceiling while §2
   * reported it as correctly hung. One of them had to be wrong and it was this
   * one — a purlin above a rafter soffit is where a purlin goes.
   *
   * So each half's barrier is its own clearance plane lifted to the rig surface
   * where the room publishes one: `max(headroom, rigLid)` over the boards and
   * `max(houseLid, rigLid)` over the house.
   *
   * The house half takes the same lift even though `rigLid` is defined over the
   * *boards*, and the reason is that the three rooms it differs in have one roof
   * over both halves. A shed's rafters run the length of the building and
   * `rigLid` is the only published measure of how deep that frame is; a salon's
   * coffers are the ceiling of the whole room. `beams` is the prop that makes it
   * matter, because it spans `houseWidth + 6` and lands most of its instances
   * out over the crowd. In a room with a flat lid — a dancehall, a club — the
   * two are equal, the lift is nothing, and `beams` at 0.120 m over the plaster
   * is still a red line, which is the case worth keeping.
   */
  const lift = Number.isFinite(s.shape.rigLid) ? s.shape.rigLid : -Infinity;
  const boardLid = Math.max(s.m.headroom, lift);
  const houseLid = Math.max(s.m.houseLid, Number.isFinite(s.m.houseLid) ? lift : -Infinity);
  for (const p of s.pieces) {
    if (!p.prop) continue;
    const overHouse = (p.box.min.z + p.box.max.z) / 2 > s.m.lipZ;
    const lid = overHouse ? houseLid : boardLid;
    const plain = overHouse ? s.m.houseLid : s.m.headroom;
    const lidName = lid > plain ? 'rigLid' : (overHouse ? 'houseLid' : 'headroom');
    if (!Number.isFinite(lid)) continue;
    const over = p.box.max.y - lid;
    if (over > worstLid) {
      worstLid = over;
      worstLidSaid = `${who(s)} ${p.prop} tops out ${p.box.max.y.toFixed(3)} under ${lidName} ${lid.toFixed(3)}`;
    }
    if (over <= CLEAR) continue;
    throughLid++;
    const key = `${s.venue.id} ${p.prop}`;
    const before = overLid.get(key);
    if (before && before.over >= over) continue;
    overLid.set(key, {
      over,
      said: `${who(s)} ${p.prop} ${p.box.max.y.toFixed(3)} vs ${lidName} ${lid.toFixed(3)} (+${over.toFixed(3)})`,
    });
  }
}

const lidWorst = [...overLid.values()].sort((a, b) => b.over - a.over);
check('nothing is drawn through the room\'s own lid', throughLid === 0,
  throughLid
    ? `${throughLid} instance(s), ${overLid.size} room-and-prop: ${lidWorst.slice(0, 8).map((x) => x.said).join('; ')}${lidWorst.length > 8 ? '; …' : ''}`
    : `worst clearance ${m3(-worstLid)} — ${worstLidSaid}`);

// ---------------------------------------------------------------------------
// §4 — no two props occupy the same space
// ---------------------------------------------------------------------------
console.log('\nOne thing per place');

/**
 * Each of these is one object resting on another.
 *
 * The 53 collisions this section first reported came down to five on three
 * pairs once the props that were genuinely in each other's place had moved — an
 * arcade's piers out of a wall of amplifiers, a lantern wire out of the
 * stonework, a road case off the amp line, a tabletop out of a bar counter.
 * What is left is the category the volume test cannot tell apart from a fault:
 * two things touching *because that is what they do*.
 *
 * Named rather than tolerated by a smaller `SOLID`, because a collision of this
 * size between two objects that are *not* one of these pairs is still worth a
 * red line. The largest of the three is 0.0194 m³, so covering them would mean a
 * five-fold threshold and a section that could no longer see the 0.0087 m³
 * tabletop buried in a bar it was just used to find.
 *
 * Two of the three are the same fact about cloth. A masking leg is a single
 * `PlaneGeometry` and everything parked in a wing stands against it, so the box
 * test raises the pair and `solidShare` cannot help — a plane has no interior,
 * and three parity rays through a point in front of one vote it inside about
 * half the time. Both are re-measurable by hand from the two builders' own
 * placement rules, which is what the numbers below are.
 *
 * `cables|riser` and `backline|cables` were here too, and went with the prop:
 * three unconnected tubes along the back wall that shared a little volume with
 * whatever they ran under. Nothing replaces them — the band's real leads are
 * built by `show.ts`, not by a prop, and this file only ever sees the dressing.
 */
const EXCUSED_PAIRS = new Set<string>([
  // A truss clamped to the tie beam over it, which is what happens in a barn.
  // `BUILDERS.truss` argues this one by name and by number in its own docstring:
  // `finnfolk/contemporary` lands its downstage run at z 1.700 with a `beams`
  // tie at 1.725, and the 0.30 × 0.26 × 0.56 hoist block at the pick — the whole
  // point of which is to be a solid mass where 32 mm struts are not — is 0.0194
  // m³ inside it at three picks. The only dodge is a narrower block, and a
  // narrower block is the defect the block was added to fix.
  'beams|truss',
  // A road case standing against a masking leg. `black-box@ambient/tape`: the
  // case's outboard 0.346 m and 0.554 m of its depth are behind the leg's box,
  // 0.1049 m³ of it, and what is actually in there is one angled sheet of cloth
  // crossing a 0.61 m high box — 8.3% of the box, 0.0087 m³. A leg hangs to the
  // deck and a case is pushed back against the cloth; the alternative is a
  // 0.35 m gap of lit floor between them.
  'drapes|flight-case',
  // `drapes|pa-stack` was here, and the excuse died with the thing it excused.
  // A 1.0 m wing stack stood against the same cloth — `warehouse@house/warehouse`,
  // the leg's inboard edge at `openingWidth / 2 - 0.25` = 5.250 against the
  // cabinet's outboard face at `width / 2 - 0.2` = 5.300, 0.0170 m³ over the
  // box's full height — and the argument was that neither number could move
  // without giving up what it was for. One of them then moved for an unrelated
  // reason: the PA went up on poles to get out of the band, and a pole and a
  // hanging leg do not want the same deck. Measured with the excuse lifted,
  // nothing solid meets.
]);

let collisions = 0;
let candidates = 0;
let worstVol = 0;
let worstVolSaid = 'nothing overlaps at all';
let excusedWorst = 0;
let excusedCount = 0;
/** One line per room and pair, carrying the worst — see `overLid`, same argument. */
const worstPair = new Map<string, { vol: number; said: string }>();
const hit = new Box3();

for (const s of scenes) {
  const props = s.pieces.filter((p) => p.prop && !p.wire);
  for (let i = 0; i < props.length; i++) {
    const a = props[i] as Piece;
    for (let j = i + 1; j < props.length; j++) {
      const b = props[j] as Piece;
      if (a.prop === b.prop) continue;
      if (!a.box.intersectsBox(b.box)) continue;
      hit.copy(a.box).intersect(b.box);
      hit.getSize(SIZE);
      const gross = SIZE.x * SIZE.y * SIZE.z;
      const thin = Math.min(SIZE.x, SIZE.y, SIZE.z);
      const pair = [a.prop, b.prop].sort().join('|');
      if (gross <= SOLID || thin <= CLEAR) continue;
      candidates++;
      if (EXCUSED_PAIRS.has(pair)) {
        excusedCount++;
        if (gross > excusedWorst) excusedWorst = gross;
        continue;
      }
      /**
       * The box says where to look; the triangles say whether anything is
       * there.
       *
       * An axis-aligned box is a lie about exactly the objects this section
       * cares most about. An arcade's arch ring has a bounding box that fills
       * the *opening* — so every paper lantern hung in a courtyard archway read
       * as buried in the stonework — and a leg drape's box is a solid slab
       * where the cloth is one curved sheet through the middle of it. Measured:
       * of the 76 pairs the box test raised, 32 have under a fifth of their box
       * inside both objects and eleven have none of it at all.
       *
       * So the box test is the cheap gate it should be, and the volume the
       * threshold is applied to is `gross × solidShare` — 216 point-in-mesh
       * tests per candidate, at about 40 ms for the whole corpus.
       */
      const vol = gross * solidShare(hit, a, b);
      if (vol > worstVol) {
        worstVol = vol;
        worstVolSaid = `${who(s)} ${pair.replace('|', ' x ')} ${vol.toFixed(4)} m³ solid of ${gross.toFixed(4)} m³ boxed`;
      }
      if (vol <= SOLID) continue;
      collisions++;
      const key = `${s.venue.id} ${pair}`;
      const before = worstPair.get(key);
      if (before && before.vol >= vol) continue;
      worstPair.set(key, {
        vol,
        said: `${who(s)} ${pair.replace('|', ' x ')} ${vol.toFixed(4)} m³ solid (of ${gross.toFixed(4)} boxed, thinnest side ${thin.toFixed(3)})`,
      });
    }
  }
}

const pairWorst = [...worstPair.values()].sort((a, b) => b.vol - a.vol);
check('no two props occupy the same space', collisions === 0,
  collisions
    ? `${collisions} of ${candidates} candidates, ${worstPair.size} room-and-pair: ${pairWorst.slice(0, 8).map((x) => x.said).join('; ')}${pairWorst.length > 8 ? '; …' : ''}`
    : `${candidates} boxes met, worst real overlap ${worstVolSaid}; ${excusedCount} excused resting pairs up to ${excusedWorst.toFixed(4)} m³ boxed`);

// ---------------------------------------------------------------------------
// §5 — nothing screens something meant to be looked at
// ---------------------------------------------------------------------------
console.log('\nNothing in front of the light');

/**
 * The largest piece of a lit prop the house can still see *whole*, as a
 * fraction of the largest piece it could see with nothing in front of it.
 *
 * ## This was a share of total area, and a share of total area cannot be judged
 *
 * It asserted that at most 10 % of a lit prop's frontal area was hidden, and
 * that number could not survive its own corpus. Once the two real defects were
 * gone — an LED wall behind an arcade in two rooms — the remaining twenty-six
 * lit props measured 16.1, 13.1, 12.6, 8.4, 6.4, 5.9, 3.5, 3.5, 3.5, 1.3, 1.3,
 * 1.3 and then zero fourteen times. That is a continuum, and any threshold
 * drawn through it is a number chosen to make three named rooms pass, which is
 * exactly what `CONTACT`'s docstring says a tolerance may never be.
 *
 * The three at the top are not defects. A truss chord 70 mm thick crossing a
 * bar sign, and a wall of amplifiers standing along the bottom of a video wall,
 * are what a stage looks like. The two that were removed are defects. Total
 * area cannot tell those apart, because it is answering the wrong question:
 * this section is named for whether the object still *reads*, and an object
 * reads when you can see a piece of it whole.
 *
 * ## The largest connected piece can, and it has a factor-of-five gap in it
 *
 * Measured over the catalogue at the same 40 × 40 sampling, largest surviving
 * piece over largest possible piece:
 *
 *   fails   0.10  courtyard@arabic/satellite `screen` behind the arcade
 *           0.175 salon@latin/moderno `screen` behind the arcade
 *   passes  0.84  a video wall with a backline along the bottom of it
 *           0.92  a neon sign under a truss chord (twice)
 *           0.85–1.00  everything else, thirteen of them untouched at 1.00
 *
 * Nothing lands between 0.175 and 0.84. The threshold sits in the middle of an
 * empty band rather than on a slope, which is the only kind of threshold this
 * file is allowed to carry.
 *
 * The shape is the argument in the two that fail: a 0.36 m entablature runs
 * unbroken across the whole 10.88 m of each screen with six 0.42 m piers under
 * it, and not one vertical line of sight through the wall's full height is
 * clear — 0 of 200 sampled columns. What is left of an 11 m video wall is
 * sixteen fragments, the biggest a tenth of it.
 */
const LEGIBLE = 0.4;
/** How far downstage of the face an object has to be to count as in the way. */
const INFRONT = 0.8;

/**
 * The largest 4-connected run of set cells in an `n × n` grid.
 *
 * Flood fill, iterative — a 1600-cell grid recurses 1600 deep in the worst
 * case, which is the case this section is looking for.
 */
function biggestPiece(grid: Uint8Array, n: number): number {
  const seen = new Uint8Array(n * n);
  const stack: number[] = [];
  let best = 0;
  for (let start = 0; start < n * n; start++) {
    if (!grid[start] || seen[start]) continue;
    stack.push(start);
    seen[start] = 1;
    let size = 0;
    while (stack.length) {
      const k = stack.pop() as number;
      size++;
      const ix = (k / n) | 0;
      const iy = k % n;
      if (ix > 0 && grid[k - n] && !seen[k - n]) { seen[k - n] = 1; stack.push(k - n); }
      if (ix < n - 1 && grid[k + n] && !seen[k + n]) { seen[k + n] = 1; stack.push(k + n); }
      if (iy > 0 && grid[k - 1] && !seen[k - 1]) { seen[k - 1] = 1; stack.push(k - 1); }
      if (iy < n - 1 && grid[k + 1] && !seen[k + 1]) { seen[k + 1] = 1; stack.push(k + 1); }
    }
    if (size > best) best = size;
  }
  return best;
}

let screened = 0;
const screenedSaid: string[] = [];
let worstRatio = 1;
let worstShareSaid = 'no lit prop is drawn anywhere';
let litCount = 0;

const AT_HOUSE = new Vector3(0, 0, -1);

for (const s of scenes) {
  for (const name of LIT) {
    const mine = s.pieces.filter((p) => p.prop === name);
    if (!mine.length) continue;
    litCount++;
    const face = Math.max(...mine.map((p) => p.box.max.z));
    const minX = Math.min(...mine.map((p) => p.box.min.x));
    const maxX = Math.max(...mine.map((p) => p.box.max.x));
    const minY = Math.min(...mine.map((p) => p.box.min.y));
    const maxY = Math.max(...mine.map((p) => p.box.max.y));
    const back = Math.min(...mine.map((p) => p.box.min.z));
    const own = new Set(mine.map((p) => p.object));
    const blockers = s.pieces.filter((p) => p.prop && p.prop !== name && !p.wire
      && p.box.max.z > face + CLEAR && p.box.min.z < face + INFRONT);
    const targets = [...new Set([...own, ...blockers.map((p) => p.object)])];

    /**
     * One ray per sample, fired at the prop from where the house is.
     *
     * Not a box raster, and the reason is the courtyard: `arches` builds an
     * arcade, an arch's bounding box fills the hole in the middle of it, and a
     * box raster therefore called 61.1% of an 11 m LED wall screened by an
     * arcade you can see straight through. It is 37.0%, which is the piers. The
     * same error runs the other way on the *lit* side — a `neon` sign is a bent
     * glass tube and its box is a filled 1.5 × 0.62 m rectangle — and the
     * dancehall's sign went from 25.9% to 13.1% when both ends were measured off
     * the triangles instead.
     *
     * The ray starts `INFRONT` downstage of the prop's own face and stops at
     * its back, so the band it crosses is exactly "within 0.8 m downstage". A
     * sample counts as lit when the ray reaches the prop at all, and as screened
     * when something else stops it first — which resolves both questions with
     * one cast and cannot double-count two blockers standing in line.
     */
    const N = 40;
    const litAt = new Uint8Array(N * N);
    const clearAt = new Uint8Array(N * N);
    /**
     * Who actually stopped the ray, rather than who was standing in the band.
     *
     * The blame string used to be every prop whose box overlapped the 0.8 m
     * strip, which named `riser` in all five of this section's first failures
     * and `riser` screens nothing in any of them. Counting the prop that owns
     * the *first* hit gives the arcade alone in the courtyard, and the arcade
     * plus the backline in the salon — which is the sentence a fix has to
     * answer.
     */
    const byObject = new Map(blockers.map((p) => [p.object, p.prop as string]));
    const culprit = new Map<string, number>();
    let lit = 0;
    let dark = 0;
    const from = new Vector3();
    for (let ix = 0; ix < N; ix++) {
      const x = minX + ((ix + 0.5) / N) * (maxX - minX);
      for (let iy = 0; iy < N; iy++) {
        from.set(x, minY + ((iy + 0.5) / N) * (maxY - minY), face + INFRONT);
        raycaster.far = INFRONT + (face - back) + CLEAR;
        raycaster.set(from, AT_HOUSE);
        const hits = raycaster.intersectObjects(targets, false);
        const first = hits.findIndex((h) => own.has(h.object));
        if (first < 0) continue;   // the ray missed the prop: not lit here
        lit++;
        litAt[ix * N + iy] = 1;
        if (first === 0) {
          clearAt[ix * N + iy] = 1;
        } else {
          dark++;
          const by = byObject.get((hits[0] as { object: Object3D }).object) ?? 'something';
          culprit.set(by, (culprit.get(by) ?? 0) + 1);
        }
      }
    }
    if (!lit) continue;
    const whole = biggestPiece(litAt, N);
    const ratio = whole ? biggestPiece(clearAt, N) / whole : 1;
    const share = dark / lit;
    const blame = [...culprit.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]).join('+') || 'nothing';
    const said = `${who(s)} ${name} biggest visible piece ${(ratio * 100).toFixed(0)}% of the wall`
      + ` (${(share * 100).toFixed(1)}% of it hidden by ${blame})`;
    if (ratio < worstRatio) {
      worstRatio = ratio;
      worstShareSaid = said;
    }
    if (ratio >= LEGIBLE) continue;
    screened++;
    if (screenedSaid.length < 8) screenedSaid.push(said);
  }
}

check('nothing screens something meant to be looked at', screened === 0,
  screened
    ? `${screened}/${litCount}: ${screenedSaid.join('; ')}`
    : `${litCount} lit props, worst ${worstShareSaid}`);

// ---------------------------------------------------------------------------
// §6 — the room encloses the house
// ---------------------------------------------------------------------------
console.log('\nThe room encloses the house');

/**
 * Where a lens can actually be, restated from `camera.ts`.
 *
 * `inRoom` there is six comparisons and this is the same six: the boards are
 * `width` wide and the house is `houseWidth`, the house floor is a stage height
 * down, `ROOM_GAP` is kept off every surface, and the lid is
 * `min(headroom, houseLid) - LENS_GAP`. Restated rather than imported because
 * `createDirector` closes over its metrics and exposes none of it; the numbers
 * are `camera.ts`'s and the copy is named so it can be found when they move.
 */
const ROOM_GAP = 0.35;
/**
 * The highest a shot ever gets. `wideEye` is `2.3 + min(d * 0.11, 1.3)`, so no
 * framing this director composes stands above 3.6 m however tall the room is,
 * and a room with no lid at all would otherwise be swept to infinity.
 */
const EYE_CEILING = 3.6;

/**
 * Twenty-two of them, and the corners are the whole point.
 *
 * A room leaks at its edges — where two walls meet, where a wall stops short of
 * a ceiling, where the house floor runs out from under the last row. A grid of
 * eye points through the middle of the room finds none of that, because from
 * the middle every wall is broadside on and every joint is a long way away. So
 * the house is sampled at both extremes of all three axes and once through the
 * centre — 3 z × 3 x × 2 y — and the boards get four more, at the two heights
 * and two depths a close shot actually reaches.
 *
 * Twenty-two eyes × 24 azimuths × 7 elevations is 3696 rays a venue and 266 112
 * over the catalogue, which is 26 of this file's 35 seconds. Doubling either
 * grid quadruples the section and found nothing the coarse one missed when it
 * was tried, because the holes these rooms have are metres across.
 */
function eyePoints(m: StageMetrics): Vector3[] {
  const lid = Math.min(
    Math.min(m.headroom, m.houseLid) - LENS_GAP,
    EYE_CEILING,
  );
  const out: Vector3[] = [];
  for (const zf of [0.08, 0.5, 0.92]) {
    const z = m.lipZ + 0.4 + zf * (m.houseDepth - 0.8);
    const floor = m.houseY + ROOM_GAP;
    for (const xf of [-0.88, 0, 0.88]) {
      for (const y of [floor, Math.max(floor + 0.1, lid)]) {
        out.push(new Vector3((xf * m.houseWidth) / 2, y, z));
      }
    }
  }
  // Over the boards too: close shots stand on the stage, and the two halves of
  // the room have different floors, different widths and different lids.
  const stageLid = Math.min(m.headroom - LENS_GAP, EYE_CEILING);
  for (const zf of [0.2, 0.8]) {
    const z = m.backZ + ROOM_GAP + zf * (m.lipZ - m.backZ - ROOM_GAP);
    for (const xf of [-0.8, 0.8]) {
      out.push(new Vector3((xf * m.width) / 2, Math.max(ROOM_GAP, Math.min(stageLid, 1.7)), z));
    }
  }
  return out;
}

/**
 * The sweep is offset by 1.7° in azimuth and 1.3° in elevation.
 *
 * An on-axis grid is the one grid that lies. Every wall in this directory is
 * axis-aligned and the sky dome's poles are on the y axis, so a ray at exactly
 * 0°, 90° or straight up runs along a seam, through a pole, or parallel to a
 * face — and reports a miss where the room is closed and a hit where it is not.
 */
const AZ_OFFSET = 1.7;
const EL_OFFSET = 1.3;

let holes = 0;
/** venue id → how many rays got out, and the first one that did. */
const leaks = new Map<string, { n: number; how: string }>();
let seams = 0;
let openSky = 0;
let rays = 0;

const dir = new Vector3();
const side = new Vector3();
const upSide = new Vector3();
const off = new Vector3();

for (const s of scenes) {
  const eyes = eyePoints(s.m);
  /**
   * The wall head, above which an open-air room is *supposed* to show sky.
   *
   * `backdropHeight` is measured from the house floor and is the tallest thing
   * the room claims to have built, so a ray leaving above it in a room whose
   * props include `open-air` is leaving over the wall — which is what a
   * courtyard, a lawn and a lakeside pavilion are for. Below it, an escape is a
   * hole in a wall that is declared to exist, open air or not.
   */
  const head = s.m.houseY + s.m.backdropHeight;
  const venueHoles = new Set<string>();
  for (const eye of eyes) {
    for (let a = 0; a < 24; a++) {
      const az = ((a * 15 + AZ_OFFSET) * Math.PI) / 180;
      for (let e = 0; e < 7; e++) {
        const el = (((e - 3) * 25 + EL_OFFSET) * Math.PI) / 180;
        dir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
        rays++;
        if (Number.isFinite(shoot(eye, dir, s.shell))) continue;
        // Nothing at all in that direction. Is it a seam, sky, or a hole?
        side.set(dir.z, 0, -dir.x).normalize();
        upSide.crossVectors(dir, side).normalize();
        let blocked = 0;
        for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          off.copy(eye).addScaledVector(side, (sx * GAP) / 2).addScaledVector(upSide, (sy * GAP) / 2);
          if (Number.isFinite(shoot(off, dir, s.shell))) blocked++;
        }
        if (blocked === 4) { seams++; continue; }
        // Where the ray leaves the room's own footprint, and how high it is
        // there. An open-air room is allowed to be open above its wall head.
        const t = Math.max(0, (s.m.houseWidth / 2) / Math.max(1e-3, Math.abs(dir.x)));
        const outY = eye.y + dir.y * Math.min(t, 30);
        if (s.openAir && (dir.y > 0 && outY > head)) { openSky++; continue; }
        holes++;
        venueHoles.add(`from (${eye.x.toFixed(1)}, ${eye.y.toFixed(1)}, ${eye.z.toFixed(1)}) looking az ${(a * 15 + AZ_OFFSET).toFixed(0)}° el ${((e - 3) * 25 + EL_OFFSET).toFixed(0)}°`);
      }
    }
  }
  if (!venueHoles.size) continue;
  const seen = leaks.get(s.venue.id) ?? { n: 0, how: [...venueHoles][0] as string };
  seen.n += venueHoles.size;
  leaks.set(s.venue.id, seen);
}

// One line per room, not one per ray: 2385 escaping rays in a black box are one
// defect — `proscenium.ts` builds no ceiling — seen 2385 times.
const worstLeaks = [...leaks.entries()].sort((x, y) => y[1].n - x[1].n);
check('the room encloses the house', holes === 0,
  holes
    ? `${holes} of ${rays} rays escape, in ${leaks.size} room(s): ${worstLeaks.slice(0, 4).map(([id, l]) => `${id} ×${l.n} (${l.how})`).join('; ')}${worstLeaks.length > 4 ? '; …' : ''}`
    : `${rays} rays, ${seams} through joints under ${GAP} m, ${openSky} into declared open sky`);

// ---------------------------------------------------------------------------

console.log(`\n${((Date.now() - t0) / 1000).toFixed(1)}s`);
if (problems.length) {
  console.log(`${problems.length} check(s) failed.\n`);
  process.exit(1);
}
console.log('All stage checks passed.\n');
