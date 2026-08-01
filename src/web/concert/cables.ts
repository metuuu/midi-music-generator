/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The leads — what says the gear on this stage is one system and not a room
 * full of separate objects.
 *
 * Before this file, exactly one thing in the show was plugged into anything:
 * the singer's microphone, which has a swinging loop and a run to the boards
 * because a stand without one reads as a prop from a shop window. Everything
 * else — the guitars, the electric piano, the organ, three kinds of synth rig,
 * the rhythm box — sat on the boards connected to nothing at all, and the
 * `cables` *prop* in `stage-props.ts` was three tubes between random points,
 * which works only because it joins nothing to nothing and nobody looks at it.
 *
 * A lead is the cheapest statement in this medium that an object is part of a
 * system, and the geometry is nearly free. See §8.4 of `docs/backline-plan.md`
 * for the argument and for the two things it deliberately does not buy —
 * amplifiers and a mixing desk, both of which are new objects competing for
 * floor with a layout that took two waves to get right.
 *
 * ## A visibly wrong lead is worse than no lead
 *
 * This is the whole risk and it is worth stating before the code. The prop gets
 * away with spaghetti *because* it connects nothing: an eye that has decided a
 * tube is texture will not follow it. The moment a lead starts at a real jack
 * it becomes something to trace, and every object it passes through is then a
 * defect the old version could not have. So routes are deliberate — down to the
 * deck, around whatever is in the way, to the box — and `routeOnDeck` is
 * allowed to fail, because a run that cannot be routed is better dropped than
 * drawn through a riser leg. An audience does not audit a stage for missing
 * cables. It notices one going through a table.
 *
 * ## Two frames
 *
 * Runs are given in **band space**, the frame every rig and machine root is
 * placed in, because a cable joins two objects and therefore cannot belong to
 * either one's local frame. The exception is `buildTail`, which hangs off a
 * *held* instrument and is built entirely in that instrument's own space so it
 * moves with the guitar rather than drifting away from it when the player
 * sways.
 */

import {
  BoxGeometry, BufferGeometry, CatmullRomCurve3, CylinderGeometry, Group,
  InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, TubeGeometry, Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { addTo } from './instruments/types.js';

/** How thick a lead is. A quarter-inch jack lead is about 7 mm of rubber. */
const RADIUS = 0.0065;

/** How high off the boards a lead lying on them sits — its own half-thickness. */
export const DECK = 0.008;

/**
 * How far a route may be pushed off a straight line before it is abandoned.
 *
 * A lead that has to travel three metres sideways to get round something is not
 * routing, it is a decorative loop, and it will read as one. Better to have no
 * lead on that instrument — see the note above about what an audience notices.
 */
const MAX_DETOUR = 2.2;

/** Clearance kept between a lead and anything it is going round. */
const MARGIN = 0.12;

/**
 * Sampling of a deck run, how hard each smoothing pass pulls it straight, and
 * how many times the two are alternated.
 *
 * `SAMPLES` is dense enough that the straight bits between two samples cannot
 * cut a corner an eye would see: on a five-metre run that is a sample every
 * 8 cm, against a 12 cm clearance.
 */
const SAMPLES = 64;
const RELAX = 0.28;
const PASSES = 6;

/**
 * How far a settled run is then allowed to wander off its own route, and how
 * much of that a metre of cable earns.
 *
 * Routing produces a *taut* line: the relaxation that keeps a lead off the
 * riser is the same pass that pulls it straight, so what arrived on the boards
 * was eight tubes ruled between two points. Nothing lays a cable along a chalk
 * line. It comes off a coil, it keeps some of the coil, and it gets kicked out
 * of the way twice before the doors open — and at stage distance that slack is
 * most of what separates a lead from a wire in a diagram.
 *
 * Scaled by the run's own length because the shape is about spare cable rather
 * than about distance: a 60 cm hop from a rhythm box to the rig beside it has
 * no room to meander, and the trip to the box at the back has metres of it. The
 * cap stops a long run turning into a decorative loop, which is the failure
 * `MAX_DETOUR` guards against on the routing side.
 */
const WANDER_MAX = 0.13;
const WANDER_PER_M = 0.032;

/** Below this, a run is a jumper between two neighbours and stays straight. */
const WANDER_MIN_SPAN = 0.5;

/**
 * How many times the settling pass may go round before it gives up.
 *
 * Evictions are applied per obstacle, so leaving one can enter the next and a
 * single pass in list order settles nothing where two obstacles overlap — which
 * is the normal case, since two players standing 50 cm apart have overlapping
 * feet as far as this is concerned. Repeating until nothing moves finds the
 * gap between them; a bound stops a point trapped between two things that
 * genuinely have no gap from spinning for ever.
 */
const SETTLE = 24;

/**
 * Something a lead may not pass through, in the xz plane.
 *
 * Flat rather than solid because every obstacle that matters here stands on the
 * boards and the lead lies on them: a riser is 40 cm high and a cable does not
 * climb it, so the interesting question is only ever "does the run cross this
 * footprint". A box is not decomposed into a circle because a drum riser is
 * 2.8 m by 2.0 m and the circle that contains it swallows a third of the stage.
 */
export type Obstacle =
  | { kind: 'circle'; x: number; z: number; r: number }
  | { kind: 'box'; x: number; z: number; halfX: number; halfZ: number };

export interface CableRun {
  /** Where the lead leaves the gear, in band space. */
  from: Vector3;
  /** Where it arrives, in band space — a stage box, or another piece of gear. */
  to: Vector3;
}

export interface Cabling {
  root: Group;
  dispose(): void;
}

interface Point2 { x: number; z: number }

/** How far outside `o` the point is; negative inside, and by how much. */
function clearance(p: Point2, o: Obstacle): number {
  if (o.kind === 'circle') {
    return Math.hypot(p.x - o.x, p.z - o.z) - o.r;
  }
  // Outside a box, the distance is the diagonal of the two overruns; inside, it
  // is the *least* penetration, which is also the direction it must be pushed.
  const dx = Math.abs(p.x - o.x) - o.halfX;
  const dz = Math.abs(p.z - o.z) - o.halfZ;
  if (dx > 0 || dz > 0) return Math.hypot(Math.max(dx, 0), Math.max(dz, 0));
  return Math.max(dx, dz);
}

/** Push `p` to the nearest point `MARGIN` clear of `o`. Mutates in place. */
function evict(p: Point2, o: Obstacle): void {
  if (o.kind === 'circle') {
    const dx = p.x - o.x;
    const dz = p.z - o.z;
    const d = Math.hypot(dx, dz);
    const want = o.r + MARGIN;
    // Dead centre has no direction to leave by, so pick one rather than
    // dividing by zero. Which one does not matter; that it is stable does.
    if (d < 1e-6) { p.x = o.x + want; return; }
    p.x = o.x + (dx / d) * want;
    p.z = o.z + (dz / d) * want;
    return;
  }
  const sx = p.x >= o.x ? 1 : -1;
  const sz = p.z >= o.z ? 1 : -1;
  const outX = o.x + sx * (o.halfX + MARGIN);
  const outZ = o.z + sz * (o.halfZ + MARGIN);
  // Leave by the near side, which is the shorter of the two escapes.
  if (Math.abs(outX - p.x) <= Math.abs(outZ - p.z)) p.x = outX;
  else p.z = outZ;
}

/**
 * A path along the boards from `from` to `to` that touches nothing.
 *
 * Relaxation rather than a graph search, because the answer wanted here is not
 * the shortest path — it is the *laziest* one, the shape a lead takes when
 * somebody drops it and kicks it out of the way twice. A straight line is
 * sampled, anything inside an obstacle is pushed to its edge, and the whole
 * thing is then pulled back toward straight; repeating that a few times settles
 * into a curve that hugs whatever it is going round.
 *
 * The ends are pinned: they are jacks, and a jack does not move to make routing
 * easier.
 *
 * Returns `undefined` when the detour needed is longer than a lead should
 * plausibly be, which is the honest answer for gear standing behind something
 * it cannot get round.
 */
export function routeOnDeck(
  from: Point2, to: Point2, obstacles: readonly Obstacle[],
  /**
   * The boards. Omitted, a run may go anywhere — which is what it used to do,
   * including behind the backdrop whenever a bow was wide enough to take it
   * there and out again.
   */
  bounds?: Bounds,
): Point2[] | undefined {
  if (!obstacles.length) {
    const open = settle(from, to, obstacles, 0, bounds);
    return open && lay(open, obstacles, bounds);
  }
  /**
   * Straight first, then bowed one way and the other, wider each time.
   *
   * Relaxation is a local method: it can push a point off an obstacle but it
   * cannot decide to take the whole run round the far side of a horn section.
   * Which side to pass a group on is a *global* choice, and the cheapest honest
   * way to make one is to try both and keep what settles. Four extra attempts
   * on a path of sixty-four points costs nothing measurable and is the
   * difference between a stage where a quarter of the gear has no lead and one
   * where nearly all of it does.
   *
   * Widths in metres, alternating sides so the shortest workable detour wins.
   */
  for (const bow of [0, 0.7, -0.7, 1.5, -1.5]) {
    const path = settle(from, to, obstacles, bow, bounds);
    if (path) return lay(path, obstacles, bounds);
  }
  return undefined;
}

/**
 * A stable 0..1 from a run's own two ends.
 *
 * Determinism, not randomness: the same lead between the same two jacks has to
 * come out the same shape on every replay, and no seed reaches this file. The
 * ends are the one thing a run has that is both its own and stable — two leads
 * from one rig to one socket row differ because they land on different jacks.
 */
function hashEnds(a: Point2, b: Point2): number {
  const n = Math.sin(a.x * 12.9898 + a.z * 78.233 + b.x * 37.719 + b.z * 4.581) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Lay a settled route down loosely, and keep it clear of everything.
 *
 * After routing rather than during it, because the two answer different
 * questions: routing decides which side of a horn section a lead passes on, and
 * this decides what it does on the way. Seeding the relaxation with this shape
 * instead would hand it something it spends six passes flattening.
 *
 * Two frequencies rather than one. A single sine is a bow, and a bow reads as
 * deliberate — as though somebody had swept the cable into an arc. A long bend
 * with a shorter one riding on it reads as slack, which is the thing being
 * drawn. Both are enveloped to nothing at the ends, which are jacks and do not
 * move.
 *
 * Then evicted again, because a bend pushed into somebody's feet is exactly the
 * defect §8.4 calls worse than no lead at all. A wander that will not settle is
 * dropped and the taut route kept — the run is already known good.
 */
function lay(path: Point2[], obstacles: readonly Obstacle[], bounds?: Bounds): Point2[] {
  const first = path[0]!;
  const last = path[path.length - 1]!;
  const dx = last.x - first.x;
  const dz = last.z - first.z;
  const span = Math.hypot(dx, dz);
  if (span < WANDER_MIN_SPAN) return path;

  const nx = -dz / span;
  const nz = dx / span;
  const amp = Math.min(WANDER_MAX, span * WANDER_PER_M);
  const h = hashEnds(first, last);
  // One and a half bends or two and a half, so two leads side by side are not
  // the same curve traced twice.
  const slow = 1.5 + Math.floor(h * 2);
  const phase = h * Math.PI * 2;
  const out = path.map((p, i) => {
    const t = i / (path.length - 1);
    const swing = Math.sin(t * Math.PI) * amp * (
      0.64 * Math.sin(t * Math.PI * slow + phase)
      + 0.36 * Math.sin(t * Math.PI * (slow * 2 + 1) + phase * 2.7)
    );
    return { x: p.x + nx * swing, z: p.z + nz * swing };
  });

  /**
   * The slack has to survive the same two tests the route did.
   *
   * Obstacles were always re-checked here — swinging a settled run 13 cm sideways
   * can obviously push it into something it had cleared. The boards were not,
   * and that is how a lead ended up *through the back wall*: a run hugging the
   * backdrop is exactly the case where the wander has nowhere to go but
   * upstage, and nothing here was looking.
   */
  let settled = true;
  for (let round = 0; round < SETTLE; round++) {
    settled = true;
    for (let i = 1; i < out.length - 1; i++) {
      for (const o of obstacles) {
        if (clearance(out[i]!, o) < MARGIN) { evict(out[i]!, o); settled = false; }
      }
      if (bounds) {
        const x = Math.min(Math.max(out[i]!.x, bounds.minX), bounds.maxX);
        const z = Math.min(Math.max(out[i]!.z, bounds.minZ), bounds.maxZ);
        if (x !== out[i]!.x || z !== out[i]!.z) { out[i]!.x = x; out[i]!.z = z; settled = false; }
      }
    }
    if (settled) break;
  }
  // Unsettled means the slack could not be given anywhere legal, and the taut
  // route it was decorating is still a perfectly good lead.
  return settled ? out : path;
}

/**
 * One attempt at a route, seeded with a lateral bow of `bow` metres at its
 * midpoint. `undefined` when the relaxation never comes to rest.
 */
function settle(
  from: Point2, to: Point2, obstacles: readonly Obstacle[], bow: number,
  bounds?: Bounds,
): Point2[] | undefined {
  /**
   * Back onto the boards, and applied everywhere a point has just been moved.
   *
   * The ends are exempt by construction — they are never passed through this,
   * because a jack is where the gear put it and a box that has been placed
   * half a centimetre outside the strip should not drag its own sockets.
   */
  const hold = (p: Point2): boolean => {
    if (!bounds) return false;
    const x = Math.min(Math.max(p.x, bounds.minX), bounds.maxX);
    const z = Math.min(Math.max(p.z, bounds.minZ), bounds.maxZ);
    if (x === p.x && z === p.z) return false;
    p.x = x;
    p.z = z;
    return true;
  };
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const span = Math.hypot(dx, dz) || 1;
  // Unit normal to the run, which is the direction a bow bulges in.
  const nx = -dz / span;
  const nz = dx / span;
  const pts: Point2[] = [];
  for (let i = 0; i < SAMPLES; i++) {
    const t = i / (SAMPLES - 1);
    // Zero at both ends, widest in the middle — the ends are jacks and do not
    // move to make routing easier.
    const out = bow * Math.sin(t * Math.PI);
    const p = { x: from.x + dx * t + nx * out, z: from.z + dz * t + nz * out };
    if (i > 0 && i < SAMPLES - 1) hold(p);
    pts.push(p);
  }
  if (!obstacles.length) return pts;

  for (let pass = 0; pass < PASSES; pass++) {
    for (let i = 1; i < pts.length - 1; i++) {
      for (const o of obstacles) {
        if (clearance(pts[i]!, o) < MARGIN) evict(pts[i]!, o);
      }
    }
    // Pulled toward the average of its neighbours, which is what takes the
    // corners off the shape the evictions left behind.
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[i - 1]!;
      const b = pts[i + 1]!;
      pts[i]!.x += ((a.x + b.x) / 2 - pts[i]!.x) * RELAX;
      pts[i]!.z += ((a.z + b.z) / 2 - pts[i]!.z) * RELAX;
      hold(pts[i]!);
    }
  }
  /**
   * Smoothing may have walked a point back inside, so the last word is
   * eviction with nothing after it — repeated until nothing moves.
   *
   * The repetition is the whole of it. One pass in list order is what the first
   * version did, and on two overlapping obstacles it evicts from the first
   * straight into the second and calls the result clear. That is not a rare
   * arrangement: it is any two players standing closer than a stride, which is
   * most of a horn section.
   */
  /**
   * …repeated until nothing moves, and **abandoned if that never happens**.
   *
   * Eviction is local, so it cannot solve the case where there is simply *no
   * gap*: two players standing half a metre apart overlap as far as this is
   * concerned, a point between them cannot be 12 cm clear of both, and it
   * bounces off one into the other for ever. A cable would not try — it would
   * go round the pair — and rather than teach a relaxation to plan that, this
   * refuses.
   *
   * Refusing is the documented policy and not a shortfall: §8.4 says an
   * instrument that cannot be routed gets no lead, because an audience does not
   * audit a stage for missing cables and does notice one going through a leg.
   *
   * The test is "did the last round move anything", not "is every point outside
   * everything". They are not the same and the difference is the whole bug this
   * replaced: a point can come to rest a *millimetre* outside an obstacle it
   * was bounced against, pass an is-it-inside test, and still have the straight
   * line to its neighbour cut the corner off. Settling means every point is a
   * full `MARGIN` clear, which is what leaves room for the line between them.
   */
  let settled = false;
  for (let round = 0; round < SETTLE && !settled; round++) {
    settled = true;
    for (let i = 1; i < pts.length - 1; i++) {
      for (const o of obstacles) {
        if (clearance(pts[i]!, o) < MARGIN) { evict(pts[i]!, o); settled = false; }
      }
      // A point evicted off the boards is not settled either: pulling it back
      // may put it inside the thing it was just pushed out of, and the next
      // round has to be allowed to see that rather than call the route done.
      if (hold(pts[i]!)) settled = false;
    }
  }
  if (!settled) return undefined;

  const direct = Math.hypot(to.x - from.x, to.z - from.z);
  let walked = 0;
  for (let i = 1; i < pts.length; i++) {
    walked += Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.z - pts[i - 1]!.z);
  }
  return walked - direct > MAX_DETOUR ? undefined : pts;
}

/**
 * One lead, as a 3D curve: down from the jack, along the boards, up to wherever
 * it lands.
 *
 * The drop is bowed *away* from the gear rather than dropped straight, because
 * a lead leaving a socket bends before it falls — a vertical segment from a
 * jack to the floor is the one detail that says "modelled" out loud.
 */
function leadCurve(run: CableRun, path: readonly Point2[]): CatmullRomCurve3 {
  const pts: Vector3[] = [];
  const first = path[0]!;
  const last = path[path.length - 1]!;

  pts.push(run.from.clone());
  if (run.from.y > DECK + 0.06) {
    const away = new Vector3(first.x - path[1]!.x, 0, first.z - path[1]!.z);
    if (away.lengthSq() > 1e-9) away.normalize().multiplyScalar(0.07);
    pts.push(new Vector3(
      run.from.x + away.x, DECK + (run.from.y - DECK) * 0.35, run.from.z + away.z,
    ));
  }
  for (const p of path) pts.push(new Vector3(p.x, DECK, p.z));
  if (run.to.y > DECK + 0.03) {
    pts.push(new Vector3(last.x, run.to.y * 0.55 + DECK, last.z));
    pts.push(run.to.clone());
  }
  return new CatmullRomCurve3(pts);
}

export interface CablingOptions {
  runs: readonly CableRun[];
  obstacles: readonly Obstacle[];
  /** The boards. Without it a bow is free to swing a lead behind the backdrop. */
  bounds?: Bounds;
  /** Rubber. Dark, and never quite black — a black lead is a hole in the deck. */
  colour?: string;
}

/**
 * Every lead on the stage, as one mesh.
 *
 * Merged rather than one mesh per run because a lead is 5 radial segments of
 * nothing and there may be eight of them; eight draw calls for the cabling
 * would be a third of what the whole band costs. They share a material and
 * never move, so there is nothing a separate mesh would buy.
 */
export function buildCabling(opts: CablingOptions): Cabling {
  const root = new Group();
  root.name = 'cabling';
  const mat = new MeshStandardMaterial({
    color: opts.colour ?? '#1b1b1f', roughness: 0.88, metalness: 0.04,
  });

  const parts: BufferGeometry[] = [];
  for (const run of opts.runs) {
    const path = routeOnDeck(
      { x: run.from.x, z: run.from.z }, { x: run.to.x, z: run.to.z }, opts.obstacles,
      opts.bounds,
    );
    if (!path) continue;
    const curve = leadCurve(run, path);
    // Tubular segments from length, so a two-metre run is not tessellated like
    // a twenty-centimetre one and a long one does not go faceted on a corner.
    const segments = Math.max(12, Math.round(curve.getLength() * 9));
    parts.push(new TubeGeometry(curve, segments, RADIUS, 5, false));
  }

  if (parts.length) {
    const merged = mergeGeometries(parts, false);
    for (const p of parts) p.dispose();
    if (merged) {
      const mesh = addTo(root, new Mesh(merged, mat));
      mesh.name = 'cabling:leads';
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  }

  return {
    root,
    dispose(): void {
      root.traverse((o) => {
        const mesh = o as Partial<Mesh>;
        if (mesh.geometry) mesh.geometry.dispose();
      });
      mat.dispose();
      root.clear();
    },
  };
}

/**
 * The stage box: where every lead on this stage ends up.
 *
 * A hub rather than leads disappearing into the wings, and that is the whole
 * design decision. Cables running off into the dark are housekeeping — which is
 * what the old prop was — and an audience reads them as mess. Cables converging
 * on one object read as a system, and a system is the thing this is for.
 *
 * Deliberately small and deliberately dull: 40 cm of steel box with a row of
 * sockets on it, sitting on the boards. It is a termination and not a
 * character. §9 refuses a mixing desk and anyone standing at one for the same
 * reason — a visible engineer is a second stage.
 */
export interface StageBox {
  root: Group;
  /** Where leads land on it, in band space. */
  socket: Vector3;
  dispose(): void;
}

const BOX_W = 0.40;
const BOX_H = 0.11;
const BOX_D = 0.24;

/**
 * How many jacks are on the front of it, and therefore how many leads can land
 * on their own one before the row starts again.
 *
 * Eight, because eight is what the leads arriving at it come to and because a
 * row reads as a row from about four onward. Out here rather than inside the
 * builder because `stageBoxSocket` has to land a lead on the same jack this
 * draws, and two copies of that arithmetic is one lead ending 5 cm to the side
 * of the hole it is supposed to be in.
 */
const SOCKETS = 8;

/** Where the i-th jack sits across the face, in the box's own frame. */
function socketX(index: number): number {
  const i = ((index % SOCKETS) + SOCKETS) % SOCKETS;
  return -BOX_W / 2 + (BOX_W / SOCKETS) * (i + 0.5);
}

/**
 * The multicore: one fat cable leaving the box for the wings, and the reason
 * there is a box at all.
 *
 * A stage box is a *break-out* — thirty channels arrive on it as individual
 * leads and leave down one trunk to the desk, which is somewhere the audience
 * cannot see. Without that trunk the object is a steel crate that swallows
 * cables, and §8.4's argument for a hub over "leads into the wings" quietly
 * becomes an argument for a dead end. One cable going somewhere is what makes
 * the other eight arriving read as a signal path rather than as tidying.
 *
 * Three times the radius of a jack lead, which is about the ratio a 16-pair
 * multicore has to the cable plugged into it, and enough that it is legible as
 * a different kind of object from two rows back rather than as a lead that got
 * fat.
 */
const TRUNK_RADIUS = RADIUS * 3;

/**
 * Where the stage box goes: upstage, and *beside* the riser rather than behind
 * it.
 *
 * Behind is where the real one lives and it is the wrong answer here. A hub the
 * drummer's platform hides is a hub nobody can see leads converging on, and the
 * converging is the whole reason there is a hub rather than cables running off
 * into the wings. Clamped inside the boards, because a room 5 m wide would
 * otherwise put it in the masking.
 *
 * Here rather than in `show.ts` so that the one thing which has to agree about
 * this — a check that no lead crosses anything — reads it from the same place
 * the show does.
 */
export function stageBoxAt(m: { width: number; backZ: number }): Vector3 {
  return new Vector3(-(m.width / 2 - BOX_INSET), 0, m.backZ + BOX_INSET);
}

/**
 * How far off the two walls the box sits, and the strip of boards a lead is
 * allowed to lie on.
 *
 * The box used to stand a comfortable distance out from the riser, on the
 * reasoning that a hub the drummer's platform hides is a hub nobody sees leads
 * converge on. True, and it put the thing a metre and a half into open floor
 * with cables fanning across the middle of the stage to reach it — and because
 * nothing stopped a route going *upstage* of the backdrop, the wide bows that
 * get a lead round a group of players were free to swing behind the back wall
 * and come out again.
 *
 * The corner fixes both. Leads run to the back and then along it, which is
 * where cable goes on a real stage and is also the shortest way to keep it out
 * from underfoot; and `BOUND` is the strip they may do it in — inside the side
 * walls, downstage of the backdrop, and well upstage of the lip. Convergence
 * survives, because eight leads arriving at one corner converge exactly as much
 * as eight arriving anywhere else.
 */
const BOX_INSET = 0.7;
const BOUND_SIDE = 0.25;
const BOUND_UP = 0.14;
const BOUND_DOWN = 0.5;

/** The strip of boards a routed lead may lie on. */
export interface Bounds { minX: number; maxX: number; minZ: number; maxZ: number }

export function cableBounds(m: { width: number; backZ: number; lipZ: number }): Bounds {
  return {
    minX: -(m.width / 2 - BOUND_SIDE),
    maxX: m.width / 2 - BOUND_SIDE,
    minZ: m.backZ + BOUND_UP,
    maxZ: m.lipZ - BOUND_DOWN,
  };
}

/**
 * Where leads land on a box that would be put `at`, in band space.
 *
 * Separate from `buildStageBox` because the runs are collected while the band
 * is being dressed and the box is not built until it is known whether anything
 * needs one. Two copies of this arithmetic would be two answers to "where does
 * a cable end", and the one nobody checked would be the one that drew a lead
 * stopping 15 cm short of the sockets.
 */
export function stageBoxSocket(at: Vector3, facing: number, index?: number): Vector3 {
  /**
   * A lead lands on *a* jack, not on the middle of the row.
   *
   * Every run used to arrive at one point, so eight leads met at a single spot
   * in front of the box and the last 40 cm of all of them was the same line
   * drawn eight times. A row of sockets with one bundle in front of it is the
   * shape of a diagram; leads fanning to their own holes is the shape of a
   * stage, and it is what makes the row on the case worth drawing at all.
   */
  return new Vector3(index === undefined ? 0 : socketX(index), BOX_H * 0.55, BOX_D / 2 + 0.02)
    .applyAxisAngle(new Vector3(0, 1, 0), facing)
    .add(at);
}

export function buildStageBox(at: Vector3, facing: number, trunkTo?: Vector3): StageBox {
  const root = new Group();
  root.name = 'stage-box';
  root.position.copy(at);
  root.rotation.y = facing;

  const shell = new MeshStandardMaterial({ color: '#23242a', roughness: 0.62, metalness: 0.45 });
  const dark = new MeshStandardMaterial({ color: '#0e0e11', roughness: 0.5, metalness: 0.3 });
  /** The trunk is rubber, not steel: matt, and it never takes a highlight. */
  const rubber = new MeshStandardMaterial({ color: '#191a1e', roughness: 0.9, metalness: 0.03 });

  const body = addTo(root, new Mesh(new BoxGeometry(BOX_W, BOX_H, BOX_D), shell));
  body.position.y = BOX_H / 2;
  body.castShadow = true;
  body.receiveShadow = true;

  /**
   * A row of sockets down the downstage face, which is the only detail that
   * makes this a stage box rather than a crate. See `SOCKETS`.
   */
  const jack = new CylinderGeometry(0.008, 0.008, 0.006, 6);
  const jacks = addTo(root, new InstancedMesh(jack, dark, SOCKETS));
  {
    const m = new Matrix4();
    const rot = new Matrix4().makeRotationX(Math.PI / 2);
    for (let i = 0; i < SOCKETS; i++) {
      m.makeTranslation(socketX(i), BOX_H * 0.55, BOX_D / 2).multiply(rot);
      jacks.setMatrixAt(i, m);
    }
    jacks.instanceMatrix.needsUpdate = true;
  }

  /**
   * And the multicore out of the back of it — see `TRUNK_RADIUS`.
   *
   * Built here rather than as a `CableRun` because it is not one: a run starts
   * at a jack and is routed round the band, and this leaves the *back* face,
   * away from every obstacle on the stage, and goes under the masking. Routing
   * it would be asking a relaxation to solve a problem it does not have.
   *
   * The shape is the whole of the detail: out of the case horizontally through
   * a strain-relief boot, over and down to the boards under its own weight —
   * which is what a cable this stiff does; it has a bend radius and cannot fall
   * straight — and then a long lazy curve upstage. `trunkTo` is where the
   * masking is, in band space, so the end is behind it and the cable reads as
   * going somewhere rather than as stopping.
   */
  if (trunkTo) {
    const local = trunkTo.clone().sub(at).applyAxisAngle(new Vector3(0, 1, 0), -facing);
    const leave = new Vector3(BOX_W * 0.18, BOX_H * 0.5, -BOX_D / 2);
    const boot = addTo(root, new Mesh(
      new CylinderGeometry(TRUNK_RADIUS * 1.45, TRUNK_RADIUS * 1.15, 0.055, 8), dark,
    ));
    boot.position.copy(leave).setZ(leave.z - 0.022);
    boot.rotation.x = Math.PI / 2;
    boot.castShadow = true;

    const down = new Vector3(leave.x + 0.02, TRUNK_RADIUS, leave.z - 0.20);
    const run = new Vector3(local.x, TRUNK_RADIUS, local.z);
    const along = new Vector3().subVectors(run, down);
    // Across the run, so the two waypoints below bend it rather than stretch it.
    const side = new Vector3(-along.z, 0, along.x).normalize();
    const trunk = addTo(root, new Mesh(
      new TubeGeometry(
        new CatmullRomCurve3([
          leave.clone(),
          new Vector3(leave.x + 0.01, leave.y - 0.02, leave.z - 0.09),
          down,
          down.clone().lerp(run, 0.38).addScaledVector(side, 0.10),
          down.clone().lerp(run, 0.74).addScaledVector(side, -0.05),
          run,
        ]),
        28, TRUNK_RADIUS, 6, false,
      ),
      rubber,
    ));
    trunk.name = 'stage-box:multicore';
    trunk.castShadow = true;
    trunk.receiveShadow = true;
  }

  return {
    root,
    /**
     * Just off the downstage face rather than at the box's own origin, so a run
     * arrives at the sockets it is supposed to be going into instead of at a
     * point inside the steel.
     */
    socket: stageBoxSocket(at, facing),
    dispose(): void {
      jacks.dispose();
      root.traverse((o) => {
        const mesh = o as Partial<Mesh>;
        if (mesh.geometry) mesh.geometry.dispose();
      });
      shell.dispose();
      dark.dispose();
      rubber.dispose();
      root.clear();
    },
  };
}

/**
 * A short lead hanging off a *held* instrument, in that instrument's own frame.
 *
 * Guitars and basses are carried — `rig.carry(model.root)` — so anything built
 * for them in band space detaches the moment the player sways into a phrase.
 * The answer is not to rebuild a tube every frame for a 60 cm curve; it is to
 * put the whole thing in the instrument's frame, where it is simply part of the
 * guitar and moves with it for free, exactly as the singer's cable is part of
 * the microphone stand.
 *
 * It ends near the boards and the deck run starts near the boards, and they are
 * not welded to each other. That is not a compromise — it is what a guitar lead
 * does. There is always a loop of slack at a guitarist's feet, and the slack is
 * the reason they can move at all.
 */
export function buildTail(
  from: Vector3,
  drop: number,
  /**
   * Which way the run carries on once it reaches the boards, in the same frame
   * as `from`. Need not be normalised; `y` is ignored.
   *
   * This is the whole of what stops the lead having a corner in it. A drop that
   * lands wherever the model's own axes happen to point, and a deck run that
   * leaves toward a box somewhere else entirely, meet at the boards in a kink —
   * and a kink at the one place a cable is *closest to the camera* is exactly
   * where the eye goes. Landing the drop already pointing the right way makes
   * the two one cable.
   */
  along: Vector3,
  colour = '#1b1b1f',
): { root: Group; foot: Vector3; dispose(): void } {
  const root = new Group();
  root.name = 'lead-tail';
  const mat = new MeshStandardMaterial({ color: colour, roughness: 0.88, metalness: 0.04 });

  /**
   * The direction the cable leans as it falls, and how far out it gets.
   *
   * A lead does not hang plumb from a socket and it does not fall in a straight
   * line to the floor: it leaves the jack roughly along its own axis, sags, and
   * then flattens out over the last stretch so that it arrives at the boards
   * *lying on them* rather than stabbing into them. The flattening is the point.
   * Reach is proportional to the drop, because a socket 40 cm up has less room
   * to make that shape than one at shoulder height and should not be drawn as
   * if it had more.
   */
  const dir = new Vector3(along.x, 0, along.z);
  if (dir.lengthSq() < 1e-9) dir.set(0, 0, 1);
  dir.normalize();
  const reach = Math.max(0.16, drop * 0.55);

  const at = (out: number, down: number): Vector3 => new Vector3(
    from.x + dir.x * reach * out, from.y - drop * down, from.z + dir.z * reach * out,
  );

  /**
   * Four points, and the spacing is the shape: barely out and a third down
   * while it is still falling, then most of the way out over the last quarter
   * of the drop, so the curve leaves the socket steep and meets the deck flat.
   */
  const foot = at(1, 1);
  const curve = new CatmullRomCurve3([
    from.clone(),
    at(0.16, 0.34),
    at(0.55, 0.78),
    at(0.92, 0.97),
    foot.clone(),
  ]);
  const mesh = addTo(root, new Mesh(new TubeGeometry(curve, 20, RADIUS, 5, false), mat));
  mesh.castShadow = true;

  return {
    root,
    /** Where it reaches the boards, in `from`'s frame. The deck run starts here. */
    foot,
    dispose(): void {
      mesh.geometry.dispose();
      mat.dispose();
      root.clear();
    },
  };
}

