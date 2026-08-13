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
 * ## Off the nearest edge, not into a hub
 *
 * §8.4 bought a third object — one stage box upstage with a row of jacks, every
 * lead on the stage running to it — on the argument that converging cables read
 * as a system where cables into the wings read as housekeeping. That is a fair
 * argument and it lost to what it actually built: eight runs from wherever the
 * gear stands to one corner of the deck is eight long diagonals across the
 * middle of the stage, which is the one place a cable is both most visible and
 * most obviously not where a cable goes. Length is the cost here. Every metre
 * of run is another metre that has to clear a pair of feet, another metre the
 * eye can follow to something it will find wrong, and another chance for
 * `routeOnDeck` to give up and draw nothing.
 *
 * So a lead now leaves by the **nearest edge of the boards** — stage left,
 * stage right, or upstage, whichever is closest to the gear it comes from — and
 * stops there, under the masking. That is where cable goes on a real stage, and
 * it is short: most runs become the two or three metres from a keyboard to the
 * wall beside it rather than the six from a keyboard to the far upstage corner.
 * The system reads from the leads all leaving the same way, which is a weaker
 * statement than a hub and is bought at a tenth of the geometry — and the hub
 * itself, the only object either version added, is gone.
 *
 * ## A visibly wrong lead is worse than no lead
 *
 * This is the whole risk and it is worth stating before the code. The prop gets
 * away with spaghetti *because* it connects nothing: an eye that has decided a
 * tube is texture will not follow it. The moment a lead starts at a real jack
 * it becomes something to trace, and every object it passes through is then a
 * defect the old version could not have. So routes are deliberate — down to the
 * deck, around whatever is in the way, off the edge — and `routeOnDeck` is
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
  BufferGeometry, CatmullRomCurve3, CylinderGeometry, Euler, Group, Mesh,
  MeshStandardMaterial, Quaternion, TubeGeometry, Vector3,
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
 * `SAMPLES` is the *seed* density and nothing more: 64 points ruled along the
 * straight line, which on a five-metre run is one every 8 cm against a 12 cm
 * clearance. This comment used to stop there and conclude that the straight
 * bits between two samples therefore could not cut a corner an eye would see.
 * That is true of the line this hands to `settle` and false of everything
 * `settle` gives back. Eviction moves a point radially and the smoothing pass
 * pulls it toward its neighbours' midpoint; neither preserves spacing, and the
 * eviction rounds that have the last word do not smooth at all. Measured on the
 * one run in 1045 that failed: mean segment 13.5 cm, longest **77 cm**, every
 * point a full margin clear and the chord across that one gap 5.8 cm inside a
 * performer's circle. See `MAX_STEP`, which is where the claim now lives.
 */
const SAMPLES = 64;
const RELAX = 0.28;
const PASSES = 6;

/**
 * The longest straight bit a finished route may contain.
 *
 * The invariant `SAMPLES` used to assert by arithmetic and could not keep. Both
 * ends of a segment are a full `MARGIN` clear of everything — that is what
 * settling means — so the only thing that can put the *line between them*
 * inside an obstacle is the segment being long enough to sag past it, and the
 * worst obstacle to sag past is a corner, which has no radius to help. Two
 * points `MARGIN` from a corner, `s` apart, take the chord to
 * `√(MARGIN² − (s/2)²)` of it; at `s = 0.20` that is 6.6 cm of daylight, over
 * half the margin kept and three times what `concert-check.ts` asks for. Round
 * obstacles are far kinder: 20 cm across a performer's 30 cm circle costs
 * 1.2 cm of the 12.
 *
 * Enforced by subdividing rather than by sampling harder, because the failure
 * is not a shortage of points — it is that they end up wherever the relaxation
 * leaves them rather than where they were seeded, and a denser seed is stretched
 * by the same factor. Splitting the one or two segments that are actually too
 * long costs a handful of points on a sixty-four-point path; the eight times
 * `SAMPLES` it would take to get near this worst case costs eight times the
 * eviction work on every run on the stage, and still leaves the longest stride
 * a thing that happens to come out small rather than a thing that is bounded.
 */
const MAX_STEP = 0.20;

/**
 * How many rounds of split-then-settle before a route is abandoned.
 *
 * Each round halves whatever is still over `MAX_STEP`, so five takes the 77 cm
 * gap that started this to 2.4 cm and nothing plausible needs more than three.
 * The bound is here for the same reason `SETTLE` has one: a run that will not
 * come to rest gets dropped rather than drawn, and §8.4 prefers the missing
 * lead.
 */
const SPLITS = 5;

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
 * no room to meander, and a front-line player's run to the wing has metres of
 * it. The cap stops a long run turning into a decorative loop, which is the
 * failure `MAX_DETOUR` guards against on the routing side.
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
  /** Where it ends, in band space — the edge of the boards, or another piece of gear. */
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
 * Back onto the boards. `true` when the point had to be moved.
 *
 * One clamp shared by the routing and by the slack laid over it, which held two
 * copies of it — and the second copy was written late, after a lead was found
 * going *through the back wall* because only the first one existed.
 *
 * The ends of a run never come through here, by construction, and that is the
 * point of it being a function a caller has to reach for rather than something
 * the loop does to everything: a jack is where the gear put it, and a box
 * placed half a centimetre outside the strip should not drag its own sockets.
 */
function hold(p: Point2, bounds?: Bounds): boolean {
  if (!bounds) return false;
  const x = Math.min(Math.max(p.x, bounds.minX), bounds.maxX);
  const z = Math.min(Math.max(p.z, bounds.minZ), bounds.maxZ);
  if (x === p.x && z === p.z) return false;
  p.x = x;
  p.z = z;
  return true;
}

/**
 * Put a point in the middle of every segment longer than `MAX_STEP`. `true`
 * when anything was inserted, which is the caller's cue to settle again.
 *
 * The midpoint rather than an even re-parameterisation of the whole run,
 * because there is nothing wrong with the route: six relaxation passes argued
 * its shape and the only defect is the one gap. Spreading every point evenly
 * would move all sixty-four to fix two, and the inserted points are the ones
 * that need evicting in any case — a midpoint over a gap that cut a corner
 * lands *inside* the thing it cut, which is exactly where the next round of
 * eviction wants to find it.
 */
function split(pts: Point2[]): boolean {
  const out: Point2[] = [pts[0]!];
  let cut = false;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    if (Math.hypot(b.x - a.x, b.z - a.z) > MAX_STEP) {
      out.push({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 });
      cut = true;
    }
    out.push(b);
  }
  if (cut) pts.splice(0, pts.length, ...out);
  return cut;
}

/**
 * Settle a run and keep settling it until it is *both* clear at every point and
 * fine enough that the lines between those points are clear too. `false` when
 * either half runs out of rope, which drops the lead.
 *
 * The two halves have to alternate rather than run in order, and that is the
 * whole of why this is a loop. Splitting a gap introduces points inside
 * whatever the gap was cutting across, so it has to be followed by eviction;
 * eviction is what opens gaps in the first place, so it has to be followed by
 * splitting. Ending on the split that finds nothing left to cut is what makes
 * both invariants true at once — and it is the ordering, not either test, that
 * this got wrong before: the route was checked for clearance, declared settled,
 * and handed over with a 77 cm stride in it that nothing had ever looked at.
 */
function tauten(
  pts: Point2[], obstacles: readonly Obstacle[], bounds?: Bounds,
): boolean {
  for (let pass = 0; pass < SPLITS; pass++) {
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
        if (hold(pts[i]!, bounds)) settled = false;
      }
    }
    if (!settled) return false;
    if (!split(pts)) return true;
  }
  return false;
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
   * The slack has to survive all three tests the route did.
   *
   * Obstacles were always re-checked here — swinging a settled run 13 cm sideways
   * can obviously push it into something it had cleared. The boards were not,
   * and that is how a lead ended up *through the back wall*: a run hugging the
   * backdrop is exactly the case where the wander has nowhere to go but
   * upstage, and nothing here was looking. Both of those, and the stride
   * `MAX_STEP` bounds, are `tauten`'s business now — an eviction here opens a
   * gap exactly as an eviction during routing does, and one copy of the answer
   * cannot drift from the other.
   */
  // Unsettled means the slack could not be given anywhere legal, and the taut
  // route it was decorating is still a perfectly good lead.
  return tauten(out, obstacles, bounds) ? out : path;
}

/**
 * One attempt at a route, seeded with a lateral bow of `bow` metres at its
 * midpoint. `undefined` when the relaxation never comes to rest.
 */
function settle(
  from: Point2, to: Point2, obstacles: readonly Obstacle[], bow: number,
  bounds?: Bounds,
): Point2[] | undefined {
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
    if (i > 0 && i < SAMPLES - 1) hold(p, bounds);
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
      hold(pts[i]!, bounds);
    }
  }
  /**
   * Smoothing may have walked a point back inside, so the last word is
   * eviction with nothing after it — repeated until nothing moves, and
   * **abandoned if that never happens**. See `tauten`, which owns both that
   * repetition and the subdivision that goes with it.
   *
   * The repetition is half of it. One pass in list order is what the first
   * version did, and on two overlapping obstacles it evicts from the first
   * straight into the second and calls the result clear. That is not a rare
   * arrangement: it is any two players standing closer than a stride, which is
   * most of a horn section. Eviction is local, though, so it cannot solve the
   * case where there is simply *no gap* — two players half a metre apart, a
   * point between them that cannot be 12 cm clear of both, bouncing off one
   * into the other for ever. A cable would not try; it would go round the pair.
   * Rather than teach a relaxation to plan that, this refuses, which is the
   * documented policy and not a shortfall: §8.4 says an instrument that cannot
   * be routed gets no lead, because an audience does not audit a stage for
   * missing cables and does notice one going through a leg.
   *
   * The other half is that "every point is clear" was never the claim worth
   * making. A point can come to rest a *millimetre* outside the obstacle it was
   * bounced against and pass any is-it-inside test; settling to a full `MARGIN`
   * is what leaves room for the line between two of them — but only if that
   * line is short, and nothing in here was making it short. That is `MAX_STEP`.
   */
  if (!tauten(pts, obstacles, bounds)) return undefined;

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
 * How much of the downstage lip a lead keeps off, and the strip of boards it
 * may lie on.
 *
 * The other three edges are the deck's own, exactly, and that is the change
 * from the stage-box version: the strip used to stop 25 cm inside the side
 * walls and 14 cm downstage of the backdrop, because nothing on the stage
 * needed to reach an edge — everything was going to one box in the upstage
 * corner, and the inset was there to stop the wide bows that get a lead round a
 * group of players from swinging it *behind the back wall* and out again.
 *
 * Leads leave by the edge now, so the edge has to be reachable. Bounding at the
 * deck itself keeps the thing that inset was actually protecting — a run still
 * cannot go upstage of the boards, which is where the backdrop is — and lets
 * `cableExit` put the end of a run exactly *on* the boundary, where nothing
 * clamps it and no route has to be threaded through a strip it is not allowed
 * to be in. The lip keeps its half metre: the front edge is the one place on
 * this deck where a cable would be nearer the camera than the band.
 */
const BOUND_DOWN = 0.5;

/** The strip of boards a routed lead may lie on. */
export interface Bounds { minX: number; maxX: number; minZ: number; maxZ: number }

export function cableBounds(m: { width: number; backZ: number; lipZ: number }): Bounds {
  return {
    minX: -m.width / 2,
    maxX: m.width / 2,
    minZ: m.backZ,
    maxZ: m.lipZ - BOUND_DOWN,
  };
}

/**
 * Where a lead leaving gear at `at` goes off the stage, in band space.
 *
 * Three edges — stage left, stage right, upstage — and never the fourth,
 * because downstage is the audience. A perpendicular run to the closest wall is
 * both the shortest cable and the one a crew would actually lay: you do not walk
 * a lead across the middle of a stage to reach a wall that is two metres behind
 * you.
 *
 * It ends *on* the deck edge rather than short of it or past it. Short of it is
 * a cable stopping in open floor, which is the one shape that reads as a
 * modelling mistake rather than as a stage; past it needs the route to leave the
 * strip it is bounded by, and `tauten` would then spend its whole subdivision
 * budget splitting a segment whose midpoint gets clamped straight back. On the
 * edge, the wall or the masking leg is right there and the run reads as going
 * under it.
 *
 * The free coordinate is clamped into the same strip the route lives in, so a
 * player standing on the lip does not get an exit 40 cm from the front of the
 * deck with the rest of their lead held back off it.
 *
 * ## The nearest edge it can actually reach
 *
 * Nearest alone is not good enough, and the number says so rather than an
 * opinion: over 1531 runs on the check's seeds, sending every one to its closest
 * edge and giving up when that failed dropped **202** of them where the old
 * single hub in the upstage corner dropped 53. A dropped run is a piece of gear
 * with no cable — §8.4's policy and the right call against drawing a lead
 * through somebody's legs, but one in eight is not a policy, it is a shortfall.
 *
 * The cause is that "closest" and "reachable" are different questions. A player
 * in the middle of the front line is three metres from either side wall with the
 * whole rest of the front line standing between them and both of them, and
 * `routeOnDeck` will not thread a gap that is not there. Upstage is further and
 * usually open. So the edges are tried in order of distance and the first one
 * that routes wins — which on those same 1531 runs drops **none of them**,
 * against the hub's 53, while keeping every run that *can* be short, short. The
 * tightest clearance any lead comes to anything goes from 2 cm to 9 cm at the
 * same time, and for the same reason: a short run has less to pass.
 *
 * That means routing twice for every lead — once here to choose, once in
 * `buildCabling` to draw. It is a pure function called again, once per number,
 * behind a closed curtain. The alternative is handing `buildCabling` a list of
 * candidates and letting it pick, which costs nothing extra — and misaims every
 * lead that takes the fallback, because `show.ts` has to build the drop off the
 * case *before* it knows which edge won, and a drop aimed at one wall meeting a
 * run headed for another is a corner at the exact point a cable is nearest the
 * camera. See `buildTail`.
 *
 * The two calls are not quite asked the same question, and it is worth being
 * plain about the gap rather than claiming a determinism this does not have:
 * `at` is where the gear *stands*, and the run `buildCabling` draws starts at
 * the foot of the drop off its case, up to a third of a metre away. Which wall
 * a keyboard is nearest is a fact about the keyboard and not about which side of
 * it the jack is on, so the gear's own position is the right thing to ask — but
 * a route chosen from one point and drawn from another can in principle be
 * refused on the second pass, and that lead is then simply dropped. Which is the
 * same answer §8.4 gives to every run it cannot thread.
 *
 * Here rather than in `show.ts` so that the one thing which has to agree about
 * this — a check that no lead crosses anything — reads it from the same place
 * the show does.
 */
export function cableExit(
  at: Point2, m: { width: number; backZ: number; lipZ: number },
  /** What is in the way. Empty, this is simply the nearest edge. */
  obstacles: readonly Obstacle[] = [],
): Vector3 {
  const b = cableBounds(m);
  const x = Math.min(Math.max(at.x, b.minX), b.maxX);
  const z = Math.min(Math.max(at.z, b.minZ), b.maxZ);
  const edges = [
    { away: at.x - b.minX, at: new Vector3(b.minX, DECK, z) },
    { away: b.maxX - at.x, at: new Vector3(b.maxX, DECK, z) },
    { away: at.z - b.minZ, at: new Vector3(x, DECK, b.minZ) },
  ].sort((p, q) => p.away - q.away);

  for (const edge of edges) {
    if (routeOnDeck(at, { x: edge.at.x, z: edge.at.z }, obstacles, b)) return edge.at;
  }
  // Nothing routes, so the lead is going to be dropped whichever of these is
  // named. Name the nearest, so the drop off the case at least leans the way
  // the run would have gone.
  return edges[0]!.at;
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
 *
 * ## And the player does not stand still
 *
 * That last paragraph was written as though "not welded" were free, and it is
 * not. A carried tail is parented to the torso, so everything the player does
 * with their body it does too: measured over two bars of a standing guitarist at
 * full sway, the foot travels **74 mm across the boards and 26 mm up and down**.
 * The deck run it hands over to is fixed in band space and does none of that.
 *
 * 74 mm is six cable-widths, and the version this replaces made the worst
 * possible job of hiding it — the drop arrived at the deck at about **45°** and
 * simply stopped, so the drift showed as a tube pointing down at a floor it was
 * no longer touching, beside a second tube starting out of nothing.
 *
 * The fix is not to chase the foot every frame with new geometry. It is to
 * arrive **flat**: the descent flattens onto the boards and then lies along them
 * for `RUN_ON`, which measures **0.0°** over the last tenth of the cable. The
 * join is now between two cables both lying down and pointing the same way, so a
 * drift along that line is one sliding under the other and a drift across it is
 * a shallow S-bend — which is what a cable by a moving foot actually does.
 *
 * **The drift itself is not removed and cannot be**, and it is worth saying so
 * rather than implying the seam is solved. A cable hanging off a body that moves
 * has an end that moves; the only reason the number went *up* from the 63 mm
 * this had before is that the foot now sits further out, which is the same
 * `RUN_ON` that buys the flat landing. What changed is that 74 mm of travel in a
 * cable lying on the boards is cable being nudged about, and 63 mm in one
 * hanging at 45° was a cable that had come unplugged.
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
): Tail {
  /**
   * The cable hangs off its own group *at the jack*, and the plug sits in a
   * second one at the same point.
   *
   * Two groups for one object, and the split is what lets a carried lead be
   * corrected: `anchorTail` re-orients and re-stretches the cable every frame
   * about the point it plugs into, and it can only do that if that point is the
   * group's origin. The plug must *not* come along — it is screwed into the
   * instrument and belongs rigidly to it — so it gets its own group and the
   * caller parents both wherever they belong.
   *
   * Everything below is therefore built relative to `from` rather than at it.
   */
  const root = new Group();
  root.name = 'lead-tail';
  root.position.copy(from);
  const plugRoot = new Group();
  plugRoot.name = 'lead-plug';
  plugRoot.position.copy(from);
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
  const reach = Math.min(REACH_MAX, Math.max(0.16, drop * 0.55));

  const at = (out: number, down: number): Vector3 => new Vector3(
    dir.x * reach * out, -drop * down, dir.z * reach * out,
  );

  /**
   * Steep out of the socket, flat onto the boards, then lying on them.
   *
   * The spacing is a catenary's and not a compromise: a hanging cable is nearly
   * vertical where it leaves the jack and nearly horizontal where it lands, and
   * the reason it can be both is that it spends most of its *height* in the
   * middle and most of its *reach* at the bottom. Hence the last descending
   * point at 82% out and 98% down — two thirds of the fall is over before the
   * cable has gone a third of the way out, and the whole of the flattening
   * happens in the last fifth.
   *
   * Then `RUN_ON` of it simply lying there. That is what makes the arrival flat
   * rather than merely flatter: the tangent through the touchdown is set by the
   * points either side of it, so a stretch of deck *after* the landing is what
   * pulls the approach horizontal — 6° off the boards, against the 45° this had
   * when it stopped dead at the point it touched. It is also the whole of the
   * answer to a player who moves; see the note above.
   */
  const land = at(1, 1);
  const end = land.clone().addScaledVector(dir, RUN_ON);
  const curve = new CatmullRomCurve3([
    new Vector3(),
    at(0.13, 0.30),
    at(0.44, 0.72),
    at(0.86, 0.995),
    land.clone(),
    land.clone().addScaledVector(dir, RUN_ON * 0.5),
    end.clone(),
  ]);
  const mesh = addTo(root, new Mesh(new TubeGeometry(curve, 26, RADIUS, 5, false), mat));
  mesh.castShadow = true;

  const plug = buildPlug(plugRoot, curve);

  return {
    root,
    plug: plugRoot,
    foot: end,
    drop,
    dispose(): void {
      mesh.geometry.dispose();
      plug.dispose();
      mat.dispose();
      root.clear();
      plugRoot.clear();
    },
  };
}

export interface Tail {
  /**
   * The cable, hung at the jack — `root.position` *is* the jack, in the frame
   * `from` was given in. Drive this with `anchorTail` if it is carried.
   */
  root: Group;
  /** The plug in the socket. Rigid with the instrument, and never driven. */
  plug: Group;
  /**
   * Where it reaches the boards, **in `root`'s own frame** rather than the
   * instrument's, which is the one frame the answer stays true in.
   *
   * A carried tail is re-orientated and re-stretched every frame, so a foot
   * expressed in the instrument's frame is a fact about the rest pose and about
   * nothing else. This one survives, because it is the point the group's own
   * transform is *solved for*: run it through `root.matrixWorld` at any moment
   * and it is where the cable actually is. `from.clone().add(tail.foot)` gets
   * the old rest-pose answer back for gear that never moves.
   */
  foot: Vector3;
  /** The jack's own height above the boards, which is what `anchorTail` restores. */
  drop: number;
  dispose(): void;
}

/**
 * Hold a carried lead's foot on the exact point the deck run starts from,
 * whatever the player does.
 *
 * ## What goes wrong without it
 *
 * A tail is parented to the instrument and the instrument to a torso, so the
 * cable inherits every axis of a jamming player. Measured over two bars of a
 * standing guitarist at full sway, its foot travels **74 mm across the boards
 * and 26 mm up and down**, and the run it hands over to is fixed in band space
 * and does none of that. Two of those axes are worse than a gap:
 *
 * **The bob.** The flat stretch at the end of the lead sits at `DECK`, which is
 * the cable's own half-thickness, so it has **1.5 mm** of clearance. Drop the
 * body 26 mm and the whole 18 cm run-on is 2.4 cm under the stage — not a tip
 * dipping in, a straight length of cable sunk into timber.
 *
 * **The roll.** Worse, because it is a lever. The torso rolls a few degrees and
 * the cable tilts about a point most of a metre up, so the far end of the run-on
 * swings through the deck on one side and lifts off it on the other. Every
 * centimetre of flat stretch that improves the *landing* makes this worse.
 *
 * ## Why levelling it was not enough
 *
 * The first version of this only took the tilt out and stretched the drop to the
 * jack's height. That fixed the deck — nothing went under it — and left the join
 * visibly broken, for two reasons that are worth keeping written down:
 *
 *  - It did nothing about the 74 mm of horizontal drift, which is the part an
 *    eye actually reads as *unplugged*.
 *  - Worse, taking the tilt out **rotates the foot about the jack**, and the
 *    deck run had been anchored to where the foot was *before* that rotation.
 *    So the correction that fixed one defect introduced a permanent offset on
 *    top of the drift. A cable joined to nothing, a little way from the tip of
 *    the cable it was supposed to continue.
 *
 * ## Solving for the foot instead
 *
 * The tail's group sits at the jack and its geometry runs from there to `foot`,
 * so between them the group's own transform has exactly the freedom needed to
 * put that foot anywhere: a yaw to aim it, a horizontal scale to reach, and a
 * vertical scale to descend. Given where the jack has ended up and where the
 * foot must be, all three are solved rather than approximated — the foot lands
 * on the anchor to floating-point, every frame, at any pose.
 *
 * What the player's movement becomes, then, is the *shape* of the slack: the
 * loop stretches and swings as they lean, by about a fifth of its length at the
 * extremes, which is what a cable with slack in it does when somebody standing
 * on one end of it moves. It is not a compromise against the join; there is no
 * join left to compromise.
 *
 * Pitch and roll are dropped and yaw is solved, so nothing tips into the boards.
 * The plug is untouched — the whole reason it is a separate group: it is screwed
 * into the instrument and moves with every axis, as it should.
 */
export function anchorTail(
  tail: Tail,
  /** Where the jack has ended up, in the frame `anchor` is given in. */
  jack: Vector3,
  /** Where the foot must stay: the point the deck run starts from. */
  anchor: Vector3,
  /** The instrument's orientation in that same frame. */
  parent: Quaternion,
): void {
  const span = Math.hypot(tail.foot.x, tail.foot.z);
  const wantX = anchor.x - jack.x;
  const wantZ = anchor.z - jack.z;
  const reach = Math.hypot(wantX, wantZ);
  /**
   * A jack directly over its own anchor has no bearing to solve for, and a tail
   * built straight down has none to solve *from*. Neither happens on this stage
   * — the foot is 0.4 m out — but a `NaN` quaternion propagates into the whole
   * subtree and is not a thing to debug from a screenshot.
   */
  if (span < 1e-6 || reach < 1e-6) return;

  // Yaw only: the angle from the direction the cable was built along to the one
  // it has to point now. Pitch and roll never enter, so it cannot tip.
  const turn = Math.atan2(wantX, wantZ) - Math.atan2(tail.foot.x, tail.foot.z);
  LEVEL.setFromEuler(EULER.set(0, turn, 0, 'YXZ'));
  // Expressed against the instrument it hangs off, which is what it is a child
  // of: the parent's own orientation, inverted, times the one wanted.
  tail.root.quaternion.copy(SPIN.copy(parent).invert().multiply(LEVEL));

  /**
   * Then reach and descend. Vertical is clamped away from zero and never
   * inverted: a jack that has ended up at or below the boards is a placement
   * fault somewhere else, and a negative scale turns the lead inside out rather
   * than reporting it.
   */
  const s = reach / span;
  tail.root.scale.set(s, Math.max(0.05, (jack.y - anchor.y) / tail.drop), s);
}

const EULER = new Euler();
const LEVEL = new Quaternion();
const SPIN = new Quaternion();

/**
 * How far a lead may lean out on its way down, however high the socket is, and
 * how much of it then lies on the boards before the deck run takes over.
 *
 * `drop · 0.55` alone is right for a case at knee height and absurd by the time
 * it reaches a guitar: a jack worn at 0.81 m got 0.44 m of lean, which is not a
 * cable falling off an instrument, it is a cable being thrown. The ratio is
 * describing the *shape* a lead makes leaving a socket, and that shape stops
 * getting wider once there is enough rope to make it — past about a fifth of a
 * metre the rest of the height is simply fall.
 *
 * The two are split rather than folded into one number because they are doing
 * different jobs and want different limits. `REACH_MAX` is the width of the
 * *fall*, and wide is wrong there. `RUN_ON` is cable lying flat, where the same
 * distance costs nothing and buys the flat arrival and the tolerance to a moving
 * player that the fall cannot. Together they put a guitarist's foot 0.40 m out
 * from the jack, which is a loop of slack at somebody's feet; the fall itself is
 * half of that.
 */
const REACH_MAX = 0.22;
const RUN_ON = 0.18;

/**
 * The plug on the end of a lead, at the socket it is in.
 *
 * The one part of this whole system an audience is ever close enough to read,
 * and until now the only instruments that had anything at all where a cable
 * meets an instrument were the three synth rigs — `mountOutlet` bolts a socket
 * plate to their back panels. A guitar, a bass, an electric piano and an organ
 * all had a tube of rubber emerging from bare wood, which is the same defect as
 * a lead that starts in mid-air and is worse for being at eye level in every
 * close shot.
 *
 * ## Along the cable, not into the socket
 *
 * A plug wants to be drawn along its socket's axis, and there is no honest way
 * to ask for that axis here: `mountOutlet` returns a point already 13 mm *proud*
 * of a panel whose normal it hard-codes, and a guitar returns a point *on* the
 * body face with no normal at all. Two conventions, one of which would put every
 * plug on the stage at right angles to the thing it is plugged into.
 *
 * So the plug is drawn along the **cable's own first few centimetres**, which
 * both conventions agree about and which cannot disagree with the tube it is
 * wrapped around. It starts a plug's depth *behind* the point the cable does, so
 * a barrel that ought to be inside a guitar body is inside it and one that ought
 * to reach a socket plate reaches it — the same 13 mm `mountOutlet` already
 * leaves for exactly this.
 *
 * Two pieces, because a plug is two things: a metal barrel that takes a
 * highlight, and a moulded boot that does not and that tapers down to the cable.
 * The boot is most of what is legible; the barrel is what says it is a jack and
 * not a knot.
 */
const PLUG_BARREL = 0.021;
const PLUG_BOOT = 0.017;
const PLUG_SUNK = 0.013;

function buildPlug(root: Group, curve: CatmullRomCurve3): { dispose(): void } {
  const shell = new MeshStandardMaterial({ color: '#b9bcc4', roughness: 0.34, metalness: 0.9 });
  const boot = new MeshStandardMaterial({ color: '#141418', roughness: 0.82, metalness: 0.05 });

  const head = curve.getPointAt(0);
  /**
   * The direction the cable leaves, over a plug's length of it rather than at
   * the point itself: a tangent at `t = 0` is the curve's, and the curve is a
   * Catmull-Rom whose first tangent is set by a control point 30 cm away.
   */
  const span = Math.min(1, (PLUG_BARREL + PLUG_BOOT) / Math.max(curve.getLength(), 1e-6));
  const axis = curve.getPointAt(span).sub(head);
  if (axis.lengthSq() < 1e-9) axis.set(0, -1, 0);
  axis.normalize();

  const back = head.clone().addScaledVector(axis, -PLUG_SUNK);
  const put = (mesh: Mesh, from: number, len: number): Mesh => {
    mesh.position.copy(back).addScaledVector(axis, from + len / 2);
    // A cylinder is built up `+y`; point it down the cable instead.
    mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), axis);
    mesh.castShadow = true;
    return mesh;
  };

  const barrel = addTo(root, put(new Mesh(
    new CylinderGeometry(0.0088, 0.0088, PLUG_BARREL, 8), shell,
  ), 0, PLUG_BARREL));
  barrel.name = 'lead-tail:plug';
  const sleeve = addTo(root, put(new Mesh(
    new CylinderGeometry(0.0104, 0.0072, PLUG_BOOT, 8), boot,
  ), PLUG_BARREL, PLUG_BOOT));
  sleeve.name = 'lead-tail:boot';

  return {
    dispose(): void {
      barrel.geometry.dispose();
      sleeve.geometry.dispose();
      shell.dispose();
      boot.dispose();
    },
  };
}

