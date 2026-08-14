/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Tomatoes — aim, throw, arc, splat, and a band that runs out of patience.
 *
 * The one interactive system on the stage, and the plan's §8.9. Everything
 * else on this page is a renderer of a decision made in `src/concert/`; this
 * is the only place where the audience gets to make one. That asymmetry is the
 * whole design brief: it has to feel like a *throw* rather than like a button,
 * and its consequence has to be legible before it lands rather than after.
 *
 * ## What this module does and does not do
 *
 * It owns the physics, the marks on everything that is not a person, and the
 * band's visible morale. It owns **none** of the musical consequence. A hit
 * emits `onHit` and the show runner mutes the layer, rerolls the part through
 * `GenerateOptions.variation` and brings the player back. That is the whole of
 * what a tomato does to the music.
 * There is no import from `src/generate/` here and there never should be —
 * the visuals cannot be allowed a path by which they change what is heard, and
 * the way to keep that structural rather than a promise is to report events and
 * let the thing that owns the music decide what they mean.
 *
 * ## What counts as a hit
 *
 * Hitting somebody's snare drum counts. It counts against *them*, it emits the
 * same `onHit`, and it moves the same ladder — a tomato in the kit is a tomato
 * thrown at the band, and a mechanic that silently ignores a third of the
 * connections teaches the audience that the throw is broken rather than that
 * their aim is. It does not count for as much: see `INSTRUMENT_COST`.
 *
 * ## The escalating tell
 *
 * A patience budget you cannot see coming is a random punishment. A patience
 * budget you *can* see coming is a game mechanic, and the difference is worth
 * more than the mechanic itself. So the band tells you, in the order the plan
 * asks for and with nothing on the HUD:
 *
 *   1st hit   the bandleader turns and glares at where the tomato came from,
 *             and keeps glancing back for the rest of the number.
 *   2nd       the drummer stops nodding — `mood().groove` goes to zero for
 *             them — and stares out at the house.
 *   3rd       whoever has taken the most starts glancing at the wings. That is
 *             what "visibly considering leaving" looks like from the tenth row.
 *   4th       the whole band is glaring, the glances at the wings get quick,
 *             and the house has stopped laughing.
 *   5th       the top of the ladder, and it stays there.
 *
 * The ladder used to end in a walk-off: a fifth hit fired `onPatienceLost` and
 * the show runner stopped the number at the end of the bar. That is gone. It
 * worked, and it was the wrong thing to spend a number on — about fifteen
 * seconds of accurate throwing ended the piece you were listening to, so the
 * mechanic's reward for engaging with it was taking away the music. The band
 * now gets as angry as it ever did and keeps playing.
 *
 * `PATIENCE` therefore no longer buys anything back; it is only how many hits
 * the ladder is spread over. The thresholds scale with it, the rungs are counted
 * in body hits — two in the kit climb one rung — and the *first* connection of
 * any kind is answered immediately, because a hit nobody visibly notices is a
 * hit that did not happen.
 *
 * ## Frame contract, which matters more than usual here
 *
 * ```ts
 * const tomatoes = createTomatoes(scene, { seed: concert.seed });
 * tomatoes.begin(number.cast, rigs, stage, { instruments, scenery });
 * tomatoes.onHit((ev) => show.hit(ev));         // mute, reroll, return
 *
 * // per frame, with the one beat the transport was asked for at the top:
 * animate.update(beat, dt);        // writes gaze, groove, effectors
 * tomatoes.update(beat, dt);       // writes the tells over the top
 * for (const rig of rigs.values()) rig.update(now, dt);
 * ```
 *
 * **Call `update` after the animation runtime's writes and before
 * `PerformerRig.update`.** The reactions survive any order — `react` is its own
 * channel and nothing else calls it — but the gaze does not: `lookAt` is one
 * slot and the last writer in the frame owns it. An animator that would rather
 * arbitrate can read `mood(id).gaze` and do it properly.
 *
 * **Nothing is built on the throw, and nothing is built on the landing.**
 * `begin` allocates the whole pool — six tomatoes, six shadows, thirty pieces
 * of pulp, every splat, *and the material the performer rigs put on bodies* —
 * and leaves it in the scene for a frame so the renderer compiles its programs
 * and uploads its buffers there rather than on the frame somebody clicks.
 * Building a mesh mid-flight is not a correctness problem and it is very much a
 * *feel* problem: it put a visible hitch between the release and the tomato,
 * which reads as the throw being broken. See `WARM_FRAMES` for the measurement,
 * and `bodyMark` for the one that was still costing 6.5 ms of it.
 *
 * `beat` is used for exactly one thing: stamping `TomatoHit.beat` so the show
 * runner knows which bar to end. Every duration in here is in seconds and comes
 * from accumulated `dt`, because gravity is metres per second squared and a
 * tomato does not care what the tempo is. **The clock is never sampled** — not
 * `transport.beat()`, not `performance.now()`, not `Date.now()` — and there is
 * no `Math.random()` anywhere: the arc scatter, the tumble and every blob's
 * shape come off `core/rng.ts` streams keyed by throw index, so replaying the
 * same throws in the same order gives the same show down to the last drip.
 */

import {
  Box3, Camera, CircleGeometry, ConeGeometry, Group, IcosahedronGeometry,
  InstancedMesh, type Intersection, Matrix3, Matrix4, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, Object3D, Quaternion, Raycaster, Vector3,
} from 'three';

import type { Cast, Performer } from '../../concert/types.js';
import { Rng } from '../../core/rng.js';
import { Leases, quad, splatSurface } from './performer-assets.js';
import type { PerformerRig } from './performer.js';
import type { StageRig } from './stage.js';
import { sweep, type Impact, type Shape, type Target } from './tomato-collide.js';
import { createSplatField, SPLAT_TRIANGLES } from './tomato-splat.js';

export interface TomatoOptions {
  /**
   * Every random choice derives from this. Pass the concert seed and a replayed
   * show throws identical tomatoes.
   */
  seed?: string;
  /**
   * How many body hits the band's tells are spread over. Nothing happens at the
   * end of it any more — see `PATIENCE`, and the module docs for what used to.
   */
  patience?: number;
  /** Seconds between throws. The reason the show gets seen at all. */
  cooldownSeconds?: number;
  /** Tomato radius in metres. */
  radius?: number;
  /**
   * Metres per second per second. Not 9.81: a real tomato over ten metres is a
   * flat, fast line and reads as a bullet. 11 with a slower launch gives an arc
   * whose apex you can see, which is what makes the throw legible.
   */
  gravity?: number;
  /** Horizontal launch speed, m/s. With `gravity`, this sets the arc's height. */
  throwSpeed?: number;
  /**
   * Aim scatter in radians. Small — this is the difference between clipping a
   * shoulder and missing it, not between the stage and the ceiling. 0 makes the
   * solve exact, which is what the tests use.
   */
  spread?: number;
  /** Tomatoes in the air at once. */
  maxInFlight?: number;
  /** Marks on the stage and its instruments. Bodies keep their own, 8 each. */
  splatCap?: number;
  /** The blob under a flying tomato. Cheap, and the only depth cue an arc has. */
  shadows?: boolean;
}

export interface TomatoHit {
  /**
   * Who wore it. For an instrument hit, whoever is playing the instrument —
   * a tomato in the ride cymbal is an event about the drummer.
   */
  performerId: string;
  /** Where it landed. A copy — safe to keep. */
  worldPoint: Vector3;
  /** Song position when it landed, straight off the beat passed to `update`. */
  beat: number;
  /** Hits this player has taken this number, on them or their kit, this one included. */
  hits: number;
  /** Hits the band has taken this number, this one included. */
  bandHits: number;
  /**
   * What is left of the tell ladder, counted in body hits and rounded up.
   *
   * Nothing happens when it reaches 0 — see the module docs on the walk-off
   * that used to. It is a mood read-out, and it stays at 0 once the band is as
   * annoyed as it gets.
   * 0 means this hit was the last one, exactly as before — but it no longer
   * falls out of `bandHits`, because an instrument hit costs less than one. See
   * `INSTRUMENT_COST`.
   */
  patienceLeft: number;
  /**
   * What the tomato actually hit.
   *
   * Optional in the type and always present in fact: it is new, and a consumer
   * written when only bodies scored must keep compiling untouched. Read it
   * rather than inferring anything from the other fields — a consumer that
   * wants to treat a hit on the kit differently has to be told, and lying about
   * `performerId` or `hits` to encode it would break everything else.
   */
  struck?: 'body' | 'instrument';
}

/**
 * How one player is holding up, for an animation runtime that wants to fold it
 * in properly rather than have its gaze overwritten.
 */
export interface PerformerMood {
  /** Hits taken this number. */
  hits: number;
  /**
   * Multiply groove amplitude by this. 1 is into it; 0 is a drummer who has
   * stopped nodding, which is the second tell and the one people notice.
   */
  groove: number;
  /**
   * Where they are pointedly looking, if anywhere. Live, and owned by this
   * module — copy it if you intend to keep it past the frame.
   */
  gaze: Vector3 | undefined;
  /** Visibly weighing the exit. */
  bailing: boolean;
}

export interface TomatoStats {
  objects: number;
  triangles: number;
  /** Per flying tomato, including its shadow blob. */
  perTomato: { objects: number; triangles: number };
  /** Per mark. Bodies' own marks are the rig's and are not counted here. */
  perSplat: { objects: number; triangles: number };
  inFlight: number;
  splats: number;
  splatCap: number;
  targets: number;
}

/**
 * What else is solid, beyond the performers and the room.
 *
 * Both optional and both cheap to omit: without them a tomato still collides
 * with the band, the boards, the backdrop and the walls, which is most of the
 * game. With them it bounces off a drum kit and leaves a mark that travels with
 * the trombone it landed on.
 */
export interface Staging {
  /** `Performer.id` to the instrument's root, from `buildInstrumentFor`. */
  instruments?: Iterable<readonly [string, Object3D]>;
  /** Risers, flight cases, a piano lid. Anything with a world bounding box. */
  scenery?: Iterable<Object3D>;
}

export interface Tomatoes {
  /** Everything this module owns. Already added to the scene you passed in. */
  readonly root: Object3D;
  /** The budget in force, after clamping. */
  readonly patience: number;

  /**
   * Bind to a number. Resets the hit count, the morale and every mark — a
   * `begin` is a `strike` plus a new cast, so the runner never has to call
   * both.
   *
   * It is also where every object this module will ever draw is built and
   * warmed up (see `WARM_FRAMES`), so **call it behind the curtain**. After it
   * returns, the throw path allocates no geometry, no material and no mesh.
   */
  begin(cast: Cast, rigs: Map<string, PerformerRig>, stage: StageRig, staging?: Staging): void;

  /**
   * Aim from a screen point, in normalised device coordinates: -1..1 with +y
   * up, which is `(x / w) * 2 - 1` and `-(y / h) * 2 + 1` from a pointer event.
   *
   * Returns where the throw would land — the first thing the cursor ray meets,
   * or a point out in front when it meets nothing. Use it for a reticle. Cheap
   * enough to call on every pointer move; it does one pick against the target
   * list and allocates nothing.
   */
  aim(ndcX: number, ndcY: number, camera?: Camera): Vector3 | undefined;
  /** The last resolved aim point, or `undefined` before the first `aim`. */
  aimPoint(): Vector3 | undefined;

  /**
   * Throw at the current aim, from just in front of the camera.
   *
   * Returns false and does nothing when the cooldown is still running, when the
   * air is full, or when nothing has been aimed at yet — so a show runner can
   * wire it straight to a click and let this decide.
   */
  throwNow(camera?: Camera): boolean;
  /** 0 just thrown, 1 ready. For a reticle that fills; not a hit counter. */
  ready(): number;
  inFlight(): number;

  /** Once a frame, with the frame's one `beat` and the frame delta in seconds. */
  update(beat: number, dt: number): void;

  /** Wipe the stage between numbers: every mark, everywhere, and the morale. */
  strike(): void;

  onHit(fn: (ev: TomatoHit) => void): void;
  hitsThisNumber(): number;
  /** Hits one player has taken this number. */
  hitsOn(performerId: string): number;
  mood(performerId: string): PerformerMood;

  measure(): TomatoStats;
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Tuning
// ---------------------------------------------------------------------------

/**
 * How many body hits the tell ladder is spread over.
 *
 * Five, from the plan. It was a budget once — the fifth hit ended the number —
 * and now it only sets the spacing of the rungs, so the argument for the number
 * is what is left of the original: three and the rungs arrive faster than you
 * can read them, eight and you cannot see the difference between "two of eight"
 * and "three of eight" in body language. Past the fifth the band stays at the
 * top of the ladder for the rest of the piece.
 */
const PATIENCE = 5;
/**
 * What one tomato in somebody's kit costs, against a body hit's 1.
 *
 * Half, and the reason is target size. A performer is a 30 cm head on a 45 cm
 * capsule and hitting one is a skill. A drum kit is the world bounding box of
 * its model — a cubic metre and a half — and a piano is worse; at close range
 * you cannot *miss* the kit. Charging full price for one would collapse the
 * whole mechanic into "spray at the drums for fifteen seconds", and the head
 * shot, which is the best thing in the game, would stop being worth aiming for.
 *
 * Free was worse, though, which is what this replaced: the tomato burst on the
 * snare, the drummer looked up, and *nothing else happened* — no gasp, no
 * ladder, no sulk. From the tenth row that is indistinguishable from the hit
 * not registering, and the thing the audience concludes is that the game is
 * broken rather than that they missed.
 *
 * Half also keeps the arithmetic legible: two in the kit are one in the chest,
 * so the top of the ladder is five bodies or ten drums.
 */
const INSTRUMENT_COST = 0.5;
/**
 * Two seconds. A throw takes about a second to land and another half to
 * register, so this is "watch what you did, then go again" rather than a wait.
 * At one second the whole band can be exhausted inside a verse.
 */
const COOLDOWN = 2;
const RADIUS = 0.055;
const GRAVITY = 11;
const THROW_SPEED = 9.5;
const SPREAD = 0.012;
const MAX_FLIGHT = 6;
const SPLAT_CAP = 24;

/** Flight time bounds, seconds. Below the first it is a dart; above, a lob. */
const MIN_FLIGHT_SECONDS = 0.3;
const MAX_FLIGHT_SECONDS = 1.6;
/**
 * How high above the hand a level throw is allowed to arc, in metres.
 *
 * The real bound on a throw, and the one `MAX_FLIGHT_SECONDS` was standing in
 * for badly: 1.6 s of hang is 3.5 m of arc, which from the back of the house
 * put tomatoes over the PA stacks and down out of the lighting rig. See
 * `solveLaunch` for the table.
 *
 * 1.2 m is chosen to be *seen* rather than to be small. The module note by
 * `gravity` argues that an arc whose apex you can watch is what makes a throw
 * legible rather than a bullet, and a metre of rise over a stage is plainly an
 * arc; it is also under the top of a ground-stacked cabinet, so a throw across
 * the room reads as going *at* the band rather than over them.
 */
const APEX_CEILING = 1.2;
/** Give up on a tomato that has hit nothing. */
const LIFETIME = 6;
/** Physics substep. A tomato covers 8cm in one, and a head is 30cm across. */
const SUBSTEP = 1 / 120;
const MAX_SUBSTEPS = 16;
/**
 * How far a tomato flies before it can hit anything.
 *
 * The launch point is inside the thrower, and on a close shot the camera can be
 * inside a performer's capsule. Without this the first substep splats the
 * tomato on whoever the camera is standing in.
 */
const ARM_DISTANCE = 0.3;
/**
 * Frames the pool is left in the scene, drawing nothing, after `begin`.
 *
 * A tomato used to be *built* on the throw: a group, three meshes, and — the
 * part that actually cost — three materials and three geometries that no
 * renderer had ever seen. The first `render` that meets one compiles and links
 * a `MeshStandardMaterial` program and uploads its buffers, on that frame, in
 * front of the audience. Measured cold in node, with no GPU work at all, the
 * first throw's flight-and-land path cost 2.8 ms against 0.19 ms warm; on a
 * real driver the program link is the larger half again and it lands as a
 * visible hitch between the click and the tomato.
 *
 * So the pool is built and *drawn* during `begin`, which the show runner calls
 * behind a closed curtain while the next number is being staged — the one
 * moment in the show where a frame of jank is free. Two frames, because the
 * first `update` after `begin` can precede the first `render`.
 */
const WARM_FRAMES = 2;
/**
 * How big a warm-up tomato is. Not zero: a degenerate scale can be optimised
 * into nothing before it reaches the driver, and the whole point is to reach
 * the driver. A tenth of a millimetre is under a pixel from anywhere.
 */
const WARM_SCALE = 1e-4;

// --- the impact ------------------------------------------------------------
/**
 * Seconds the tomato itself takes to stop existing after it lands.
 *
 * It used to be zero: the tomato vanished on the frame it touched and a flat
 * mark appeared where it had been. Nothing about that reads as an impact — the
 * eye gets no event, only a before and an after, and the mark looks like it was
 * always there. What it needs is a beat in which the tomato is visibly *losing*
 * — flattening into the surface, spreading across it, going. 120 ms is seven
 * frames, which is long enough to see and short enough that it is over before
 * anybody thinks about it.
 */
const BURST_SECONDS = 0.12;
/**
 * Bits of pulp per tomato, and how long they live.
 *
 * Five is enough to read as "it came apart" and few enough that the impact does
 * not turn into confetti. They are pooled per tomato rather than globally so
 * that a landing never has to find a free one — six tomatoes cannot land more
 * than six times at once by definition.
 *
 * They fly ballistically and hit nothing. A pulp bit is a centimetre across and
 * lives for four tenths of a second; running it through `sweep` would cost
 * thirty more swept queries per substep to decide whether a speck stops at the
 * boards or under them, and at that size and that speed there is nothing to
 * see either way.
 */
const PULP = 5;
const PULP_SECONDS = 0.34;
/**
 * Metres per second the pulp leaves at, before each bit's own scatter.
 *
 * Tuned down from something closer to the real physics. A tomato arriving at
 * twelve metres a second really does throw pulp a metre and a half, and at this
 * scale that is not a splash — it is a metre and a half of confetti around a
 * performer who is 1.7 m tall, and it reads as a firework. What the eye wants
 * is a spray about a head wide in the first tenth of a second, which is this.
 */
const PULP_SPEED = 1.6;
/** A bit's radius as a fraction of the tomato's. */
const PULP_SIZE = 0.26;
/**
 * The closing speed, in m/s, that counts as a full-force impact.
 *
 * Roughly what a flat throw from the third row arrives at. Everything softer
 * scales down: the burst spreads less and the mark is smaller. A lobbed tomato
 * that drops onto the boards from the top of its arc should not leave the same
 * mark as one fired into the backdrop, and before this it did — the size was a
 * constant, which is the sort of thing nobody can name and everybody feels.
 */
const HARD_IMPACT = 12;
/**
 * Mark radius as a multiple of the tomato's, from a graze to a full-force hit.
 *
 * Straddling 2.3, which is the constant this replaced: an ordinary throw leaves
 * the mark it always did, and the range only shows up at the ends. Widening it
 * further was tempting and wrong — at 3.1 a hard shot at the backdrop leaves a
 * mark a third of a metre across, which stops reading as a tomato.
 */
const MARK_MIN = 1.7;
const MARK_MAX = 2.9;

/**
 * How far past the proxy contact `refine` keeps looking for real geometry.
 *
 * The gap it has to cross is the gap between a collision shape and the thing
 * that shape stands for, and the worst of those is a drum kit: the box is the
 * world bounding box of the whole model, so its front face can be somewhere out
 * past the crash cymbal while the shell a tomato is heading for is most of a
 * metre behind it. Under about half a metre those hits stay on the box.
 *
 * It is not larger because the reach is also the blast radius of a miss. A ray
 * that slips between the tubes of a drum stand keeps going and marks whatever
 * of the *same* instrument it finds on the far side — nothing else is traced,
 * so it cannot wander onto a neighbour, but it can put a mark on the back of a
 * piano lid. At 0.9 that is rare and still a real surface; at three metres it
 * would be common and would read as marks appearing out of nowhere.
 */
const REFINE_REACH = 0.9;

/**
 * How full a node's own box has to be before `decompose` accepts it whole.
 *
 * 0.55 from the catalogue sweep. Lower and a drum shell gets pointlessly cut
 * into its own hoops; higher and the rule starts splitting objects that were
 * always a fair box, which costs targets and buys nothing.
 */
const PART_OCCUPANCY = 0.55;
/**
 * Above this many cubic metres a node is cut up whatever its occupancy says.
 *
 * A quarter of a cubic metre is about a bass drum, and it is the size at which
 * "the box is a fair slab" stops being a good enough answer — a harp's frame
 * and a sitar's gourd both pass the occupancy test at most of a cubic metre,
 * and both hang a wall of nothing beside a player.
 */
const PART_BIG = 0.25;
/**
 * Boxes one object may contribute. A backstop, not a budget.
 *
 * Fourteen is the measured mean and a drum kit is the worst at about thirty.
 * This is here so that a model somebody builds out of two hundred rivets
 * cannot quietly put two hundred entries in the list every substep walks.
 */
const PARTS_CAP = 160;
/**
 * Boxes one instanced leaf may be split into. See `pushLeaf`.
 *
 * Twenty-four is where the two costs cross for the worst object in the
 * catalogue: a modular's 448 jacks become 24 boxes of about nineteen adjacent
 * sockets each, which is tight enough that nothing stops in open air and small
 * enough that a wall of synths does not double the target list.
 */
const INSTANCE_CHUNKS = 24;

/** Thinner than a hand is a painted surface, not a thing you can hit. */
const PROP_MIN_THICKNESS = 0.08;
/** Longer than a person is tall is a row of things merged into one mesh. */
const PROP_MAX_SPAN = 3.0;

/** Seconds after which a reaction has played out and can be re-issued. */
const GLARE_SECONDS = 2.7;
/** How long one look at the wings lasts. */
const GLANCE_SECONDS = 1.7;
/** The laugh comes after the gasp, not with it. */
const LAUGH_DELAY = 0.45;

const V1 = new Vector3();
const V2 = new Vector3();
const V3 = new Vector3();
const V4 = new Vector3();
/**
 * The burst path's own scratch.
 *
 * Separate from V1..V4 on purpose. The flight loop keeps live values in V1 and
 * V2 across the substep loop and reads V2 again after it, and the burst is
 * driven from inside that loop on the frame a tomato lands. Sharing would work
 * today, by an accident of where the `continue`s are.
 */
const V5 = new Vector3();
const V6 = new Vector3();
const UP = new Vector3(0, 1, 0);
const BOX = new Box3();
const LEAF = new Box3();
const SIZE = new Vector3();
/** `pushLeaf`'s, and only its: one instance's transform at a time. */
const M2 = new Matrix4();

/**
 * `refine`'s own scratch, and its answer.
 *
 * `HIT_P` and `HIT_N` are read all the way through `land`, past `openBurst` and
 * `register`, which is further than any other scratch in this file survives —
 * so they are not V-anything. Nothing either of those calls reaches can write
 * here, and naming them for the one job keeps it that way.
 */
const HIT_P = new Vector3();
const HIT_N = new Vector3();
/**
 * The mesh `refine` landed on, or undefined when it fell back to the proxy.
 *
 * A rig needs this and not just the point: only the mesh says which part of a
 * body the surface belonged to. See `PerformerRig.splat`.
 */
let HIT_OBJ: Object3D | undefined;
const RAY_DIR = new Vector3();
const RAY_N = new Vector3();
const RAY_SCALE = new Vector3();
const RAY_TMP = new Vector3();
const NORMALS = new Matrix3();
const ray = new Raycaster();
/** Reused, emptied before and after every trace. `intersectObject` appends. */
const rayHits: Intersection[] = [];

/** The `Impact.target` before anything has been hit. Never dereferenced. */
const NOTHING: Target = {
  kind: 'scenery', label: 'nothing',
  shape: { kind: 'box', min: new Vector3(), max: new Vector3() },
};

interface Flight {
  group: Group;
  shadow: Mesh | undefined;
  /** Launch point and launch velocity. Position is analytic, never integrated. */
  from: Vector3;
  vel: Vector3;
  /** Seconds since launch. */
  age: number;
  /** In the air, and therefore collidable. False the instant it touches. */
  live: boolean;
  spin: Vector3;

  // --- the burst, which outlives the flight by four tenths of a second -----
  /**
   * Seconds since it landed, or -1 when this tomato is not bursting.
   *
   * A separate state from `live` because a bursting tomato is neither flying
   * nor free: it must not be swept against anything, and `take` must not hand
   * its group to the next throw while its pulp is still in the air.
   */
  burst: number;
  /** Where it burst, on the surface rather than a radius off it. */
  hitAt: Vector3;
  /** The surface normal there. Unit, pointing away from what it hit. */
  hitNormal: Vector3;
  /** Turns the impact frame's +y onto the surface normal. Squash and scatter. */
  hitQuat: Quaternion;
  /** How hard it arrived, 0..1 against `HARD_IMPACT`. */
  force: number;
  /** The pulp, and where each bit goes in the impact frame. */
  pulp: Mesh[];
  pulpDir: Vector3[];
}

interface Tell {
  rig: PerformerRig;
  performer: Performer;
  /** Owned, mutated in place, and handed to `lookAt`, which retains it. */
  gaze: Vector3;
  gazeActive: boolean;
  nextGlare: number;
  /** When the last glare started, so the gaze can hold for as long as it runs. */
  lastGlare: number;
  nextGlance: number;
  glanceUntil: number;
  /** Seeded, so the band never reacts in unison. */
  phase: number;
  hits: number;
}

export function createTomatoes(scene: Object3D, opts: TomatoOptions = {}): Tomatoes {
  const seed = opts.seed ?? 'tomato';
  const patience = Math.max(1, Math.round(opts.patience ?? PATIENCE));
  const cooldownSeconds = Math.max(0, opts.cooldownSeconds ?? COOLDOWN);
  const radius = Math.max(0.01, opts.radius ?? RADIUS);
  const gravity = Math.max(0.1, opts.gravity ?? GRAVITY);
  const throwSpeed = Math.max(1, opts.throwSpeed ?? THROW_SPEED);
  const spread = Math.max(0, opts.spread ?? SPREAD);
  const maxInFlight = Math.max(1, Math.round(opts.maxInFlight ?? MAX_FLIGHT));
  const shadows = opts.shadows ?? true;

  const root = new Group();
  root.name = 'tomatoes';
  scene.add(root);

  const splats = createSplatField({
    cap: Math.max(1, Math.round(opts.splatCap ?? SPLAT_CAP)),
    seed: `${seed}:splat`,
  });
  root.add(splats.root);

  // --- shared geometry and materials, owned and disposed here --------------
  const fleshGeo = new IcosahedronGeometry(1, 1);
  /** A pulp bit is a centimetre across and lasts a third of a second: 20 tris. */
  const pulpGeo = new IcosahedronGeometry(1, 0);
  const calyxGeo = new ConeGeometry(0.5, 0.4, 5);
  const shadowGeo = new CircleGeometry(1, 10);
  const fleshMat = new MeshStandardMaterial({ color: '#c8210f', roughness: 0.34, metalness: 0 });
  const calyxMat = new MeshStandardMaterial({ color: '#3f6b27', roughness: 0.8, metalness: 0 });
  const shadowMat = new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.3, depthWrite: false });
  /** Every bit of pulp is the tomato's own material, so it costs no new program. */
  const pulpMat = fleshMat;

  /**
   * A mesh that exists only so that the mark on a *body* is warm.
   *
   * This is the one hole the rest of the warm-up left, and it was the whole of
   * the stall at impact. `PerformerRig.splat` builds its marks the first time
   * somebody is hit, out of `quad` and `splatSurface` from the shared asset
   * pool — and `splatSurface` is the only textured material in the concert. Its
   * factory generates a 64×64 splat texture pixel by pixel, which measures at
   * 6.5 ms of pure CPU on the impact frame, and hands back a
   * `MeshStandardMaterial` with `map` + `alphaTest` + `transparent` that no
   * other material on this stage matches — so the first `render` after the
   * first hit also compiles and links a program nobody has ever asked for and
   * uploads 16 kB of texture. All three land on the frame of the impact, which
   * is why a hit lagged just before it showed.
   *
   * The tomato pool's own warm-up never covered it: `splats.prime()` warms the
   * marks on *scenery*, whose material is untextured and opaque and shares no
   * program with this one, and a warm-up hung off a rig would not have worked
   * either — the show keeps `band.visible = false` behind the curtain, and an
   * invisible subtree is never submitted, so it would have compiled nothing.
   *
   * So the mark's assets are leased here and drawn from `root`, which the
   * curtain does not hide. The pool is keyed by name, so the material this
   * takes is the identical instance the rigs get later; by the time anybody is
   * hit, the texture exists, the program is linked and the buffers are up. The
   * lease is held for the life of the module rather than released after the
   * warm-up so that the texture survives a `strike` and is generated once for
   * the life of the page rather than once per number.
   */
  const markLeases = new Leases();
  const bodyMark = new Mesh(quad(markLeases), splatSurface(markLeases));
  bodyMark.name = 'body-mark-warmup';
  bodyMark.frustumCulled = false;
  bodyMark.visible = false;
  root.add(bodyMark);

  const flights: Flight[] = [];
  /**
   * The scatter every bit of pulp will ever fly along, drawn once at `build`.
   *
   * Fixed per bit rather than per landing, because a landing must not allocate
   * an `Rng` and must not draw from a shared one — the throw streams are keyed
   * by throw index precisely so that a replay is identical, and a draw whose
   * count depends on how many things a tomato clipped on the way would desync
   * them. Thirty bits across six tomatoes is more distinct scatter than anybody
   * can see in a tenth of a second, and `Flight.force` varies the speed per
   * impact anyway.
   */
  const pulpRng = new Rng(`${seed}:pulp`);
  /** Reused every substep. `target` is only meaningful when `sweep` returns true. */
  const impact: Impact = {
    t: 0, point: new Vector3(), normal: new Vector3(0, 1, 0), target: NOTHING,
  };

  // --- the world -----------------------------------------------------------
  /** Rebuilt on `begin`. Performer shapes are refreshed every frame. */
  const targets: Target[] = [];
  /** `decompose`'s output, reused across the objects `begin` walks. */
  const parts: Box3[] = [];
  /** Parallel to the performer entries, so the per-frame refresh is a walk. */
  const bodies: { rig: PerformerRig; head: Target; torso: Target }[] = [];
  /**
   * Every instrument root, so that tracing a *body* can step over them.
   *
   * A held instrument is parented into its player's rig — `show.ts` says why,
   * and it is right: a sax has to sway with the person blowing it. It means the
   * subtree `refine` traces for a body hit has a saxophone in it, and a tomato
   * that got past the horn's own box (which is trimmed away under its owner's
   * head, so that the drummer can be hit in the face at all) would otherwise
   * come to rest on the bell — while `PerformerRig.splat` hangs the mark off a
   * head. A mark drawn on the horn that moves with the chin.
   *
   * A body hit marks the body. If the horn was really in the way, its own box
   * is what should have caught the tomato.
   */
  const carried = new Set<Object3D>();
  const tells = new Map<string, Tell>();
  let rigs: Map<string, PerformerRig> = new Map();
  let stage: StageRig | undefined;
  let leaderId: string | undefined;
  let drummerId: string | undefined;

  /** Where the thrower is, so the band knows where to glare. */
  const thrower = new Vector3(0, 1.5, 8);
  /** The near wing and the far wing, chosen per performer by which side they are. */
  const wingLeft = new Vector3(-5, 1.4, -3);
  const wingRight = new Vector3(5, 1.4, -3);

  // --- state ---------------------------------------------------------------
  let now = 0;
  /** Frames of pool warm-up still to run. See `WARM_FRAMES`. */
  let warm = 0;
  let cooldown = 0;
  let throwCount = 0;
  /**
   * Tomatoes that connected with somebody this number, on them or on their kit.
   *
   * An honest event count, which is what `TomatoHit.bandHits` promises. It is
   * deliberately *not* what the tell ladder is measured in — see `spent`.
   */
  let hits = 0;
  /**
   * The same tomatoes, priced. A body is worth 1 and a kit `INSTRUMENT_COST`.
   *
   * Split from `hits` rather than making `hits` fractional, because `hits` and
   * `bandHits` are reported to the show runner as counts and "you have been hit
   * one and a half times" is not a thing anybody can act on. Patience is what
   * is fractional, so patience is what carries the fraction.
   */
  let spent = 0;
  let lastBeat = 0;
  let camera: Camera | undefined;
  let aimed: Vector3 | undefined;
  /**
   * The surface normal at the aim point.
   *
   * The whole reason this is kept: the solve lands the tomato's *centre* where
   * it is told, and a tomato is 11cm across. Aiming the centre at a spot on the
   * boards puts the skin into the boards a radius early, and on a descent of
   * about forty degrees that is seven centimetres short of where the player
   * pointed — small, consistent, and exactly the sort of thing that makes aiming
   * feel untrustworthy without being nameable. Offsetting the solve's target
   * along this makes the *skin* touch the point.
   */
  const aimNormal = new Vector3(0, 1, 0);
  let laughAt = Number.POSITIVE_INFINITY;
  let laughLevel = 0;
  let tier = 0;
  const hitQueue: TomatoHit[] = [];
  const hitListeners: ((ev: TomatoHit) => void)[] = [];

  // -- thresholds, as fractions of the budget so tuning keeps the ladder ----
  const tNod = Math.max(2, Math.ceil(patience * 0.4));
  const tBail = Math.max(3, Math.ceil(patience * 0.6));
  const tAll = Math.max(4, Math.ceil(patience * 0.8));

  // -----------------------------------------------------------------------
  // Building the world
  // -----------------------------------------------------------------------

  function addBox(kind: Target['kind'], label: string, box: Box3, performerId?: string, node?: Object3D): void {
    if (box.isEmpty()) return;
    const min = box.min.clone();
    const max = box.max.clone();
    if (!finite3(min) || !finite3(max)) return;
    targets.push({ kind, label, shape: { kind: 'box', min, max }, performerId, node });
  }

  function buildRoom(rig: StageRig): void {
    const m = rig.metrics;
    const halfW = m.width / 2;
    // The boards. A box rather than a plane so a tomato cannot tunnel under it
    // on a slow frame and vanish into the cellar.
    addBox('scenery', 'boards', BOX.set(
      V1.set(-halfW, -0.5, m.backZ), V2.set(halfW, 0, m.lipZ),
    ));
    // The house floor, which is where a short throw lands. Among the audience,
    // where it belongs.
    addBox('scenery', 'house', BOX.set(
      V1.set(-m.houseWidth / 2, m.houseY - 0.5, m.lipZ),
      V2.set(m.houseWidth / 2, m.houseY, m.lipZ + m.houseDepth),
    ));
    addBox('scenery', 'backdrop', BOX.set(
      V1.set(-halfW - 0.6, 0, m.backZ - 0.4), V2.set(halfW + 0.6, m.openingHeight + 2, m.backZ),
    ));
    for (const side of [-1, 1] as const) {
      addBox('scenery', side < 0 ? 'wall-left' : 'wall-right', BOX.set(
        V1.set(side * halfW - (side < 0 ? 0.6 : 0), 0, m.backZ),
        V2.set(side * halfW + (side < 0 ? 0 : 0.6), m.openingHeight + 2, m.lipZ),
      ));
    }
    wingLeft.set(-halfW - 1.1, 1.45, m.backZ + 1.2);
    wingRight.set(halfW + 1.1, 1.45, m.backZ + 1.2);
    thrower.set(0, 1.5, m.lipZ + 3.5);
  }

  /**
   * A person is a sphere on a capsule and nothing below the hips, which is not
   * a shortcut: there are no legs to hit. See the Rayman-hands note in the plan
   * — the art style decides the collision model, and a tomato that sails under
   * a standing player's torso is correct rather than a tunnelling bug.
   */
  function buildBodies(cast: Cast): void {
    for (const performer of cast.performers) {
      const rig = rigs.get(performer.id);
      if (!rig) continue;
      const p = rig.proportions;
      const head: Target = {
        kind: 'performer', label: `${performer.id}:head`, performerId: performer.id,
        shape: { kind: 'sphere', centre: new Vector3(), radius: p.headR * 1.15 },
      };
      const torso: Target = {
        kind: 'performer', label: `${performer.id}:torso`, performerId: performer.id,
        shape: { kind: 'capsule', a: new Vector3(), b: new Vector3(), radius: Math.max(0.08, p.torsoW * 0.46) },
      };
      targets.push(head, torso);
      bodies.push({ rig, head, torso });
    }
    refreshBodies();
  }

  /**
   * Lower an instrument's box until it stops being a lid over its own player.
   *
   * This is the least obvious thing in the file and the most important. An
   * instrument collides as the world bounding box of its model, which for a
   * drum kit is a cubic metre and a half of mostly air with a ride cymbal
   * defining the top — and the drummer's head sits five centimetres above that
   * top, *behind* it from the house. A tomato thrown at the drummer's face
   * therefore clips an invisible ceiling fifteen centimetres short and vanishes.
   * The drummer, who is the single most satisfying target on the stage, was
   * unhittable; so was a bassist, whose head is inside the bounding box of an
   * upright bass's neck.
   *
   * A tighter collision shape per archetype would fix it properly and costs
   * **twenty-two** files this module does not own — twenty-four, since the
   * archetype count is what that number is, and it has only ever gone up. The rule that fixes it here is
   * true anyway and needs no per-instrument knowledge: **a player's head is
   * never inside their own instrument.** So where an instrument's footprint is
   * under its player's head, its box is capped just below that head. A cymbal
   * stops being solid in the top few centimetres, which nobody will ever
   * notice, and the drummer can be hit in the face, which is the entire point.
   *
   * Returns false when trimming would leave nothing, in which case the
   * instrument does not collide at all.
   */
  function trimAgainstOwner(box: Box3, performerId: string): boolean {
    const body = bodies.find((b) => b.rig.performer.id === performerId);
    const head = body?.head.shape;
    if (!head || head.kind !== 'sphere') return true;
    const c = head.centre;
    const r = head.radius;
    // Only where the instrument is actually underneath them. A piano two metres
    // to the side keeps its full height, and blocking a neighbour's head shot
    // with it is cover rather than a bug.
    if (c.x < box.min.x - r || c.x > box.max.x + r) return true;
    if (c.z < box.min.z - r || c.z > box.max.z + r) return true;
    const ceiling = c.y - r - 0.02;
    if (ceiling <= box.min.y + 0.05) return false;
    box.max.y = Math.min(box.max.y, ceiling);
    return true;
  }

  /**
   * Cut an object up into the handful of boxes it is actually made of.
   *
   * The replacement for one world bounding box per instrument, and the reason
   * is arithmetic. Measured over the catalogue, as a fraction of its own box
   * that an instrument's geometry actually occupies: a vibraphone **6%**, a
   * modular synth 11%, an electric piano 18%, an organ 28%, a grand piano 40%.
   * The other 94% of a vibraphone is a cuboid of air that stops tomatoes, hides
   * the player standing behind it and takes marks on an invisible flat face.
   * One box was never a proxy for those objects; it was a proxy for the room
   * they stand in.
   *
   * ## The rule, and why it is not a table
   *
   * The obvious fix is an authored volume per archetype beside `ARCHETYPES`.
   * It was measured against this one and it loses on both counts: it is
   * twenty-odd hand-written numbers that restate geometry which is *generated*
   * — every model varies by finish, year and player height, so the numbers are
   * wrong the day somebody changes a builder and nothing says so — and it
   * covers only instruments, while the same defect is sitting in the stage
   * dressing. This reads the model instead, so it cannot drift from it.
   *
   * Descend into a node while either is true:
   *
   *   - **it is mostly air.** Occupancy is the summed volume of the leaf meshes
   *     underneath against the node's own box. Leaves, not immediate children:
   *     sibling boxes overlap, and summing *those* reports a guitar's box as
   *     full when it is a thin slab lying in a large cuboid.
   *   - **it is big.** A harp's frame passes the occupancy test — a triangle in
   *     a rectangle is a fair slab — and is still most of a cubic metre. Being
   *     wrong about a big box is expensive wherever it happens to be honest.
   *
   * Stop otherwise, and stop at `PARTS_CAP` however much is left, so a model
   * with a hundred screws cannot flood the target list.
   *
   * Measured on the same catalogue: mean occupancy 100% → 54%, about fourteen
   * boxes per instrument. The archetypes that stay a single box — an electric
   * guitar, a harmonica, an accordion — are the ones whose single box was
   * already honest, which is the rule agreeing with itself.
   */
  function decompose(node: Object3D, into: Box3[]): void {
    node.updateWorldMatrix(true, true);
    walkParts(node, into);
    // Nothing came back: a node whose every mesh is empty or non-finite. The
    // caller's own `addBox` drops an empty box, so one is a safe answer.
    if (into.length === 0) into.push(new Box3().setFromObject(node));
  }

  function walkParts(node: Object3D, into: Box3[]): void {
    const box = new Box3().setFromObject(node);
    if (box.isEmpty()) return;
    const kids = node.children.filter((c) => !BOX.setFromObject(c).isEmpty());
    if (kids.length === 0) { pushLeaf(node, box, into); return; }
    if (into.length + kids.length > PARTS_CAP) { into.push(box); return; }
    const vol = boxVolume(box);
    const tight = vol > 0 && Math.min(1, leafVolume(node) / vol) >= PART_OCCUPANCY;
    if (tight && vol <= PART_BIG) { into.push(box); return; }
    for (const kid of kids) walkParts(kid, into);
  }

  /**
   * A leaf, and the one case where the hierarchy has run out but the air has
   * not: an `InstancedMesh`.
   *
   * A modular synth is the example that found this. Its rig is thirteen leaves
   * and every one of them is a single instanced mesh whose bounding box is the
   * union of every copy — `modular:carcass` is ten cabinets scattered through
   * **7.8 cubic metres**, reported as one solid. There is no child to descend
   * into and no authored shape that would help either, because the instance
   * matrices are where the geometry actually is.
   *
   * So split by instance. Not one box per copy: `modular:jacks` is 448 of them,
   * and 448 targets for a panel of sockets is a worse answer than the one being
   * fixed. Chunk the copies into at most `INSTANCE_CHUNKS` runs and union each
   * run — builders emit instances in layout order, so consecutive copies are
   * neighbours and a run's union is a tight local box rather than a scattering.
   * A count under the chunk limit degenerates to exactly one box per copy.
   *
   * Only for leaves big enough to be worth it. A keyboard's white keys are an
   * instanced mesh too, and its box is already the keyboard.
   */
  function pushLeaf(node: Object3D, box: Box3, into: Box3[]): void {
    const inst = node as InstancedMesh;
    const count = inst.isInstancedMesh ? inst.count : 0;
    const geo = inst.isInstancedMesh ? inst.geometry : undefined;
    if (count < 2 || !geo || boxVolume(box) <= PART_BIG) { into.push(box); return; }
    if (!geo.boundingBox) geo.computeBoundingBox();
    const bounds = geo.boundingBox;
    if (!bounds) { into.push(box); return; }

    const chunks = Math.min(count, INSTANCE_CHUNKS, Math.max(1, PARTS_CAP - into.length));
    const per = Math.ceil(count / chunks);
    for (let start = 0; start < count; start += per) {
      const run = new Box3();
      for (let i = start; i < Math.min(start + per, count); i++) {
        inst.getMatrixAt(i, M2);
        M2.premultiply(node.matrixWorld);
        BOX.copy(bounds).applyMatrix4(M2);
        run.union(BOX);
      }
      if (!run.isEmpty()) into.push(run);
    }
  }

  /** Cheap enough for every frame: a matrix walk and six vectors per player. */
  function refreshBodies(): void {
    for (const body of bodies) {
      const rig = body.rig;
      const p = rig.proportions;
      rig.root.updateWorldMatrix(true, false);
      const head = body.head.shape;
      if (head.kind === 'sphere') {
        head.centre.copy(p.head).applyMatrix4(rig.root.matrixWorld);
      }
      const torso = body.torso.shape;
      if (torso.kind === 'capsule') {
        torso.a.set(0, p.hipY, 0).applyMatrix4(rig.root.matrixWorld);
        torso.b.set(0, p.hipY + p.torsoH * Math.cos(p.lean), p.torsoH * Math.sin(p.lean))
          .applyMatrix4(rig.root.matrixWorld);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Aiming and throwing
  // -----------------------------------------------------------------------

  /** The hand, roughly: down and to the right of the eye, and slightly ahead. */
  function throwOrigin(cam: Camera, out: Vector3): Vector3 {
    cam.updateWorldMatrix(true, false);
    const e = cam.matrixWorld.elements;
    // Columns of the world matrix: right, up, and -forward.
    out.setFromMatrixPosition(cam.matrixWorld);
    out.x += e[0]! * 0.2 - e[4]! * 0.18 - e[8]! * 0.3;
    out.y += e[1]! * 0.2 - e[5]! * 0.18 - e[9]! * 0.3;
    out.z += e[2]! * 0.2 - e[6]! * 0.18 - e[10]! * 0.3;
    return out;
  }

  function pick(ndcX: number, ndcY: number, cam: Camera, out: Vector3): boolean {
    cam.updateWorldMatrix(true, false);
    V1.setFromMatrixPosition(cam.matrixWorld);
    V2.set(clamp(ndcX, -1, 1), clamp(ndcY, -1, 1), 0.5).unproject(cam).sub(V1);
    if (!finite3(V2) || V2.lengthSq() < 1e-12) return false;
    V2.normalize();
    // 60 metres is past the back wall of any venue this generator builds.
    V3.copy(V1).addScaledVector(V2, 60);
    if (sweep(V1, V3, 0, targets, impact)) {
      out.copy(impact.point);
      aimNormal.copy(impact.normal);
      return true;
    }
    // Nothing under the cursor: aim at the plane of the boards if the ray is
    // heading down, and at arm's length in the air if it is not. Either way the
    // throw is a miss, which is the honest answer to aiming at the ceiling.
    if (V2.y < -1e-4) {
      const t = -V1.y / V2.y;
      if (t > 0 && t < 60) {
        out.copy(V1).addScaledVector(V2, t);
        aimNormal.set(0, 1, 0);
        return true;
      }
    }
    out.copy(V1).addScaledVector(V2, 14);
    aimNormal.copy(V2).negate();
    return true;
  }

  /**
   * The launch velocity that lands exactly on `to`, in vacuum.
   *
   * Flight time comes from the horizontal distance and a fixed launch speed, so
   * a near throw is quick and a far one hangs; then the vertical component is
   * whatever makes the arithmetic land. The whole solve is four lines because
   * there is no drag: a 55mm tomato over ten metres loses about a centimetre to
   * air, which is a tenth of the aim scatter and would cost the exactness that
   * makes "it lands where you aimed" testable.
   *
   * ## Why the flight time is capped rather than the speed
   *
   * A fixed launch speed means the whole of a longer throw is paid for in
   * *hang*, and the height of a ballistic arc goes with the square of it. From
   * the back of the house that was not a throw, it was a mortar: the apex above
   * the launch point runs
   *
   *     5 m  0.38 m      12 m  2.19 m
   *     8 m  0.98 m      15 m  3.43 m
   *    10 m  1.52 m      20 m  3.52 m
   *
   * — so a tomato aimed at the far side of the stage went up over the PA stacks
   * and came down out of the lighting. `MAX_FLIGHT_SECONDS` did bound it, at
   * 1.6 s, which is 3.5 m of arc and far too generous to be the bound anybody
   * wanted.
   *
   * `APEX_CEILING` is that bound said in the units it is actually about. A
   * throw at a target on the level peaks `gravity · t² / 8` above the hand, so
   * capping the time at `√(8 · ceiling / gravity)` caps the arc — and every
   * throw inside about nine metres is untouched, because it was already quicker
   * than that. Past nine metres the arm simply throws harder, which is what an
   * arm does, and the tomato covers the extra ground flat rather than over the
   * top.
   *
   * The cap is on the *ballistic* half only. Aim at something above you and the
   * `dy / t` term still lifts the arc as far as it has to, because that is not a
   * lob, it is a target on a riser and the throw has to get up there.
   */
  function solveLaunch(from: Vector3, to: Vector3, out: Vector3): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const horiz = Math.hypot(dx, dz);
    const hang = Math.min(MAX_FLIGHT_SECONDS, Math.sqrt(8 * APEX_CEILING / gravity));
    const t = clamp(horiz / throwSpeed, MIN_FLIGHT_SECONDS, hang);
    out.set(dx / t, dy / t + 0.5 * gravity * t, dz / t);
  }

  function build(): Flight {
    const group = new Group();
    const flesh = new Mesh(fleshGeo, fleshMat);
    // Not a ball: wider than it is tall, and a little flattened at the poles.
    flesh.scale.set(radius, radius * 0.86, radius);
    group.add(flesh);
    const calyx = new Mesh(calyxGeo, calyxMat);
    calyx.scale.setScalar(radius);
    calyx.position.y = radius * 0.72;
    group.add(calyx);
    /**
     * Never culled, in flight or warming up.
     *
     * A tomato is 11 cm and spends its life between the camera and the band, so
     * the cull test almost never says no; and while it is warming up it is
     * 0.1 mm at the origin, where a cull *would* say no and quietly skip the
     * one draw the whole warm-up exists for. Six groups that are invisible for
     * the rest of the show cost nothing — `visible = false` is checked before
     * the frustum.
     */
    group.frustumCulled = false;
    group.visible = false;
    root.add(group);

    let shadow: Mesh | undefined;
    if (shadows) {
      shadow = new Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.renderOrder = 2;
      shadow.frustumCulled = false;
      shadow.visible = false;
      root.add(shadow);
    }
    // The pulp. Same material as the flesh and its own cheap geometry, both of
    // which `prime` draws, so a burst compiles nothing and uploads nothing.
    const pulp: Mesh[] = [];
    const pulpDir: Vector3[] = [];
    for (let i = 0; i < PULP; i++) {
      const bit = new Mesh(pulpGeo, pulpMat);
      bit.frustumCulled = false;
      bit.visible = false;
      root.add(bit);
      pulp.push(bit);
      // A cone off the surface: always outward, never grazing, and weighted so
      // most of it goes up and out rather than straight back at the thrower.
      const a = pulpRng.float(0, Math.PI * 2);
      const lift = pulpRng.float(0.34, 0.96);
      const flat = Math.sqrt(Math.max(0, 1 - lift * lift));
      pulpDir.push(new Vector3(Math.cos(a) * flat, lift, Math.sin(a) * flat)
        .multiplyScalar(pulpRng.float(0.55, 1.35)));
    }

    const flight: Flight = {
      group, shadow, from: new Vector3(), vel: new Vector3(),
      age: 0, live: false, spin: new Vector3(),
      burst: -1, hitAt: new Vector3(), hitNormal: new Vector3(0, 1, 0),
      hitQuat: new Quaternion(), force: 1, pulp, pulpDir,
    };
    flights.push(flight);
    return flight;
  }

  /** Free means neither flying nor still bursting — see `Flight.burst`. */
  function take(): Flight | undefined {
    for (const f of flights) if (!f.live && f.burst < 0) return f;
    // `prime` fills the pool, so this only fires if somebody threw before
    // `begin`. Building one is still better than dropping the throw.
    return flights.length >= maxInFlight ? undefined : build();
  }

  /**
   * Build the pool, and get every part of it in front of the renderer once.
   *
   * See `WARM_FRAMES`. Everything a throw and a landing will need — six
   * tomatoes, six shadows, thirty pieces of pulp, `splatCap` marks, the mark
   * the rigs put on bodies, seven materials — exists and has been drawn before
   * the first click, so neither the throw nor the landing allocates anything or
   * compiles anything.
   *
   * The rule for anything added here later: if a landing can put a mesh in
   * front of the renderer, this has to have put it there first. A single
   * uncovered material is the whole stall back again — `bodyMark` was one, and
   * it cost more than everything else in the file put together.
   */
  function prime(): void {
    while (flights.length < maxInFlight) build();
    for (const f of flights) {
      if (f.live || f.burst >= 0) continue;
      f.group.position.set(0, 0, 0);
      f.group.quaternion.identity();
      f.group.scale.setScalar(WARM_SCALE);
      f.group.visible = true;
      if (f.shadow) {
        f.shadow.position.set(0, 0, 0);
        f.shadow.scale.setScalar(WARM_SCALE);
        f.shadow.visible = true;
      }
      for (const bit of f.pulp) {
        bit.position.set(0, 0, 0);
        bit.scale.setScalar(WARM_SCALE);
        bit.visible = true;
      }
    }
    bodyMark.position.set(0, 0, 0);
    bodyMark.scale.setScalar(WARM_SCALE);
    bodyMark.visible = true;
    splats.prime();
    warm = WARM_FRAMES;
  }

  /** Put the warm-up back out of sight. Idempotent. */
  function cool(): void {
    warm = 0;
    for (const f of flights) if (!f.live && f.burst < 0) retire(f);
    bodyMark.visible = false;
    splats.cool();
  }

  function positionAt(f: Flight, t: number, out: Vector3): Vector3 {
    return out.set(
      f.from.x + f.vel.x * t,
      f.from.y + f.vel.y * t - 0.5 * gravity * t * t,
      f.from.z + f.vel.z * t,
    );
  }

  function retire(f: Flight): void {
    f.live = false;
    f.burst = -1;
    f.group.visible = false;
    if (f.shadow) f.shadow.visible = false;
    for (const bit of f.pulp) bit.visible = false;
  }

  // -----------------------------------------------------------------------
  // Consequences — the visual half. The musical half is the show runner's.
  // -----------------------------------------------------------------------

  /**
   * How hard this tomato is arriving, 0..1 against `HARD_IMPACT`.
   *
   * The component of its velocity *into* the surface rather than its speed: a
   * tomato that grazes the backdrop at fifteen metres a second has barely
   * touched it and should not leave the mark of one that went in square. The
   * age is a substep past the true contact time, which is nine centimetres a
   * second of gravity — three quarters of one per cent, and not worth solving.
   */
  function impactForce(f: Flight, normal: Vector3): number {
    V5.set(f.vel.x, f.vel.y - gravity * f.age, f.vel.z);
    return clamp(-V5.dot(normal) / HARD_IMPACT, 0, 1);
  }

  /**
   * Stop flying, and start coming apart. See `BURST_SECONDS`.
   *
   * The tomato is not retired here. It stays in the scene, flattened against
   * what it hit and losing size, while its pulp arcs off — which is the beat
   * the impact used to be missing entirely.
   */
  function openBurst(f: Flight, point: Vector3, normal: Vector3): void {
    f.force = impactForce(f, normal);
    f.live = false;
    f.burst = 0;
    // `point` is on the surface, not the tomato's centre: `refine` has already
    // taken the radius off, and on a hit it traced the surface outright rather
    // than backing off a proxy. Everything about the burst happens there.
    f.hitAt.copy(point);
    f.hitNormal.copy(normal);
    f.hitQuat.setFromUnitVectors(UP, normal);
    if (f.shadow) f.shadow.visible = false;
    // Stop the tumble and lie down on the surface, so that the squash below
    // flattens along the normal instead of along whatever it had spun to.
    f.group.quaternion.copy(f.hitQuat);
    drawBurst(f);
  }

  /**
   * One frame of a burst. Pure writes to transforms: no allocation, no branch
   * that can build anything, and nothing here can touch the collision world.
   */
  function drawBurst(f: Flight): void {
    const t = f.burst;

    // --- the tomato: flattens into the surface, spreads, and goes -----------
    const k = clamp(t / BURST_SECONDS, 0, 1);
    if (k < 1) {
      // Squared, so it holds its size for the first frame or two and then
      // leaves quickly. Linear reads as a balloon deflating.
      const fade = 1 - k * k;
      const spread = 1 + (0.5 + 0.9 * f.force) * k;
      f.group.visible = true;
      // The centre sinks the radius it was standing off the surface, so the
      // skin stays put while the middle collapses onto it.
      f.group.position.copy(f.hitAt).addScaledVector(f.hitNormal, radius * (1 - k) * 0.9);
      f.group.scale.set(spread * fade, (1 - 0.8 * k) * fade, spread * fade);
    } else if (f.group.visible) {
      f.group.visible = false;
    }

    // --- the pulp -----------------------------------------------------------
    const g = clamp(t / PULP_SECONDS, 0, 1);
    // Shrinks away rather than fading out: one material is shared by every
    // tomato and every bit of every burst, so there is no per-bit opacity to
    // fade, and giving them one would be the impact-frame shader compile all
    // over again — see `bodyMark`.
    const size = radius * PULP_SIZE * (1 - g) * (0.55 + 0.45 * f.force);
    const speed = PULP_SPEED * (0.45 + 0.55 * f.force);
    for (let i = 0; i < f.pulp.length; i++) {
      const bit = f.pulp[i]!;
      if (g >= 1) { bit.visible = false; continue; }
      V5.copy(f.pulpDir[i]!).applyQuaternion(f.hitQuat);
      V6.copy(f.hitAt)
        .addScaledVector(f.hitNormal, radius * 0.4)
        .addScaledVector(V5, speed * t);
      V6.y -= 0.5 * gravity * t * t;
      bit.position.copy(V6);
      bit.scale.setScalar(size);
      bit.visible = true;
    }
  }

  /**
   * Move a hit off the collision proxy and onto something somebody can see.
   *
   * `sweep` answers with the shape it was given, and the shapes are coarse on
   * purpose: a person is a sphere on a capsule and an instrument is the world
   * bounding box of its model. That is the right trade for *stopping* a tomato
   * — it is exact enough that nobody can tell, and it costs no allocation in
   * the substep loop. It is the wrong answer for *marking* one, because the
   * mark is a thing you then stare at for the rest of the number:
   *
   *   - an instrument's box is mostly air, so its mark hangs in the air beside
   *     the instrument, on an invisible flat face;
   *   - that face is world-axis-aligned, so every mark on the front of a drum
   *     kit is coplanar and faces the house dead on, and the drips in
   *     `tomato-splat.ts` — which fall out of `normal · up` and would run down
   *     a slanted shell beautifully — never see a slanted anything;
   *   - a torso's capsule is `torsoW * 0.46` while `torsoShell` is barely over
   *     half that deep at the chest, so a mark on a shirt floats clear of it.
   *
   * So once, on the frame a tomato lands, trace the thing it hit. One ray
   * against one subtree, a few hundred triangles, some tens of microseconds —
   * next to the burst this is free, and it is emphatically not in the substep
   * loop. The trace starts where the substep started, which is the one point
   * we know is in open air, and runs the way the tomato was going.
   *
   * `Raycaster` allocates: an intersection record per surface it meets, each
   * with a point and a face. That is the one place in this module where a hit
   * costs the collector anything, and it is deliberate — the alternative is a
   * hand-rolled triangle sweep over every mesh in the band, which is `sweep`
   * again with worse constants. What the warm-up promises is that the throw
   * path builds no *geometry, material or mesh*, and this builds none of the
   * three. A few dozen short-lived objects on the frame something bursts, next
   * to the thirty pieces of pulp that frame already starts moving, is noise.
   *
   * ## The second ray
   *
   * The first ray follows the tomato, and for a body or a drum kit that is the
   * end of it. A grand piano is the case it does not cover: the box is the lid
   * raised at an angle over a footprint two metres square, so most of a corner
   * approach clips the box through open air and comes out the other side having
   * met no wood at all — three quarters of a metre of nothing between the mark
   * and the instrument, measured. So a miss gets one more ray, from the proxy
   * contact toward the middle of the box, which is *into* the thing rather than
   * past it. It can put a mark somewhere the tomato did not literally go; it is
   * still on the piano, and the piano is what was hit.
   *
   * What neither ray reaches is a box inflated by one thin outlier — a synth rig
   * with a stand raising its box most of a metre above the rig, hit up in that
   * empty metre. The line to the middle of the box crosses the room. Aiming at
   * the nearest piece instead was written and measured and caught none of them,
   * so it is not here; the fix is a tighter shape per archetype, which the
   * comment on `trimAgainstOwner` prices at twenty-four files.
   *
   * Leaves the surface point in `HIT_P`, its outward normal in `HIT_N` and the
   * mesh in `HIT_OBJ`, and returns what a mark should hang on. Two misses leave
   * the proxy's own answer there — a mark in roughly the wrong place beats no
   * mark at all, since the band has already flinched.
   */
  function refine(centre: Vector3, normal: Vector3, target: Target, from: Vector3): Object3D | undefined {
    // The proxy answer, which is also the fallback. `sweep` reports where the
    // tomato's *centre* is at contact, one radius off the surface.
    HIT_P.copy(centre).addScaledVector(normal, -radius);
    HIT_N.copy(normal);
    HIT_OBJ = undefined;

    const node = target.kind === 'performer'
      ? (target.performerId ? rigs.get(target.performerId)?.root : undefined)
      : target.node;
    // Nothing to trace. The room's own walls and boards are built from metrics
    // rather than from meshes, and their proxy *is* the surface.
    if (!node) return target.node;

    // The rig has been posed this frame but nothing has drawn yet, so the world
    // matrices under here are a frame stale. A head marked where it was last
    // frame is a mark a centimetre off, every time, in the same direction.
    node.updateWorldMatrix(true, true);
    // A body trace steps over the horn the body is holding; an instrument trace
    // is looking for exactly that horn, so it steps over nothing.
    const skip = target.kind === 'performer' ? carried : undefined;

    // Along the way the tomato was going, from the one point this substep knows
    // was in open air.
    RAY_DIR.copy(centre).sub(from);
    // Contact on the first sample of the substep: there is no travel to take a
    // direction from, so come in against the surface.
    if (RAY_DIR.lengthSq() < 1e-12) RAY_DIR.copy(normal).negate();
    let found = finite3(RAY_DIR) && RAY_DIR.lengthSq() > 1e-12
      && trace(from, from.distanceTo(centre) + REFINE_REACH, node, skip);

    if (!found) {
      // Inward, from the proxy contact — which is on the proxy, and a proxy
      // encloses what it stands for, so that point is outside the geometry.
      //
      // A body aims at its own middle, which for a sphere or a capsule is where
      // the body is. A box aims at the nearest piece instead, because the middle
      // of a box is not reliably inside anything: a synth rig whose bounding box
      // is raised most of a metre by one thin stand has a hit up at 1.55 m and a
      // box centre down at 0.86, and the line between them passes through the
      // room. Nearest-piece turns that from a mark hanging in mid-air into a
      // mark on the part of the instrument closest to where it was hit.
      core(target.shape, HIT_P, RAY_DIR);
      found = inward(node, skip);
    }

    if (found && target.kind !== 'performer' && HIT_OBJ) {
      return parentFor(HIT_OBJ, target.node);
    }
    return target.node;
  }

  /**
   * A fallback ray from `HIT_P` to the aim point `RAY_DIR` is holding, and out
   * the far side — a piano struck on the tail has its nearest wood beyond the
   * centre of its own bounding box.
   */
  function inward(node: Object3D, skip: ReadonlySet<Object3D> | undefined): boolean {
    RAY_DIR.sub(HIT_P);
    const reach = RAY_DIR.length();
    if (!(reach > 1e-4)) return false;
    RAY_DIR.divideScalar(reach);
    return trace(HIT_P, reach * 2, node, skip);
  }

  /**
   * One ray from `origin` along `RAY_DIR`, writing the first surface a mark can
   * go on into `HIT_P` / `HIT_N` / `HIT_OBJ`. Leaves all three alone on a miss.
   */
  function trace(origin: Vector3, far: number, node: Object3D, skip: ReadonlySet<Object3D> | undefined): boolean {
    RAY_DIR.normalize();
    ray.set(origin, RAY_DIR);
    ray.near = 0;
    ray.far = far;
    rayHits.length = 0;
    ray.intersectObject(node, true, rayHits);

    let hit = false;
    for (const it of rayHits) {
      // Sorted by distance, so the first one that is really there wins.
      if (!it.face || !markable(it.object, node, skip)) continue;
      NORMALS.getNormalMatrix(it.object.matrixWorld);
      RAY_N.copy(it.face.normal).applyMatrix3(NORMALS);
      if (RAY_N.lengthSq() < 1e-12) continue; // Degenerate triangle. Try the next.
      RAY_N.normalize();
      // A back face reports its normal pointing away from us — which happens on
      // anything built double-sided, a cymbal especially, and on every hit the
      // second ray makes from inside a bounding box.
      if (RAY_N.dot(RAY_DIR) > 0) RAY_N.negate();
      HIT_P.copy(it.point);
      HIT_N.copy(RAY_N);
      HIT_OBJ = it.object;
      hit = true;
      break;
    }
    rayHits.length = 0;
    return hit;
  }

  function land(f: Flight, point: Vector3, normal: Vector3, target: Target, from: Vector3): void {
    const host = refine(point, normal, target, from);
    openBurst(f, HIT_P, HIT_N);
    const rig = target.performerId ? rigs.get(target.performerId) : undefined;
    const body = target.kind === 'performer';
    const instrument = target.kind === 'instrument';

    // How far the pulp spread. Computed once, here, because both the rig's
    // marks and this module's read the same closing speed and they should not
    // disagree about how hard the same tomato arrived.
    const mark = radius * (MARK_MIN + (MARK_MAX - MARK_MIN) * f.force);

    if (rig && target.performerId && (body || instrument)) {
      register(target.performerId, rig, body, f.hitAt, f.hitNormal, HIT_OBJ, mark);
    }

    // A mark on a body is the rig's: it knows which part was hit and can parent
    // the mark to a head that is going to go on nodding, which this cannot.
    if (body) return;

    // Everything else — their kit, the boards, the backdrop — is a mark here.
    // `host` is the mesh the trace found when it found one, so a mark on a
    // cymbal swings with the cymbal rather than with the kit it belongs to.
    splats.place(f.hitAt, f.hitNormal, mark, host);
  }

  /**
   * One tomato has connected with a player — on them, or on their kit.
   *
   * Everything the band and the house do about it is here. Everything the
   * *music* does about it is in the event this queues, and the reason that
   * split is worth a function boundary is in the module docs.
   */
  function register(
    performerId: string, rig: PerformerRig, body: boolean,
    point: Vector3, normal: Vector3, hitObject: Object3D | undefined, mark: number,
  ): void {
    const tell = tells.get(performerId);
    if (tell) tell.hits++;
    hits++;
    spent += body ? 1 : INSTRUMENT_COST;

    if (body) {
      // The rig owns marks on bodies, and its `splat` already flinches — it
      // reacts with 'hit' internally, so a `react` here would replace the
      // reaction with a weaker one rather than adding to it. The size goes
      // with the point: the rig knows which part was hit and cannot know how
      // fast the thing was going, and it clamps the number against that part.
      // The normal and the mesh go with both, and they are what stop the mark
      // being laid on the sphere the rig approximates that part by — see
      // `refine`, which is where the point stopped being a guess.
      rig.splat(point, mark, normal, hitObject);
    } else {
      // Their kit and not them: they look up from it, they do not flinch.
      rig.react('surprise', 0.55);
    }
    stage?.gasp();
    escalate();
    // The room finds the first one funny and the fourth one uncomfortable. One
    // that burst on a bass drum is funnier than one that burst on a person —
    // there is a bang, and nobody is hurt — so it starts higher and then dies
    // down the same ladder as everything else.
    laughAt = now + LAUGH_DELAY;
    laughLevel = Math.max(0.05, (body ? 0.3 : 0.4) - 0.06 * tier);
    hitQueue.push({
      performerId,
      worldPoint: point.clone(),
      beat: lastBeat,
      hits: tell ? tell.hits : 1,
      bandHits: hits,
      patienceLeft: Math.max(0, Math.ceil(patience - spent)),
      struck: body ? 'body' : 'instrument',
    });
  }

  /**
   * The ladder. Called on every hit; the per-frame half is in `tellFrame`.
   *
   * Each rung *adds* to the one below it and none of them expire, because a
   * tell that fades is a lie about a budget that does not. What decays is only
   * the urgency: the glares get less frequent as the seconds since the last hit
   * pile up, and quicken again the moment another one lands.
   */
  function escalate(): void {
    // Rounded *up*, so half a rung still shows. The band's mood is the only
    // read-out this mechanic has, and a first tomato in the kit that produced
    // no glare at all would read exactly like a tomato that did not register —
    // which is the bug instrument hits were added to fix, arriving by a
    // different door. Up-rounding costs at most half a rung of generosity and
    // buys every connection a visible answer.
    tier = Math.min(Math.ceil(spent), patience);
    if (stage) {
      // The house going quiet is the cheapest tell there is, and it is the one
      // that reads from the back of the room. Set on the edge only, so the show
      // runner's own attention control still owns the space between hits.
      stage.setAttention(clamp(0.6 - 0.11 * tier, 0.08, 1));
    }
    // Whoever is eligible glares now rather than on their next period, so a hit
    // is answered immediately. Staggered — a band turning as one is a chorus
    // line, not a band. This is also where a player who has just become
    // eligible gets put on the clock at all: the periods are Infinity until a
    // hit promotes them, and nothing else moves the tier.
    for (const tell of tells.values()) {
      if (Number.isFinite(glarePeriod(tell))) tell.nextGlare = now + tell.phase * 0.9;
      if (Number.isFinite(glancePeriod(tell)) && !Number.isFinite(tell.nextGlance)) {
        tell.nextGlance = now + 1.6 + tell.phase;
      }
    }
  }

  /** Who is most likely to walk. The one who has worn the most, and it shows. */
  function flightRisk(): Tell | undefined {
    let best: Tell | undefined;
    for (const tell of tells.values()) {
      if (tell.hits === 0) continue;
      if (!best || tell.hits > best.hits || (tell.hits === best.hits && tell.phase > best.phase)) best = tell;
    }
    return best;
  }

  /** Seconds between glares for this player at the current tier, or Infinity. */
  function glarePeriod(tell: Tell): number {
    const id = tell.performer.id;
    if (tier >= tAll) return 5 + tell.phase;
    if (id === leaderId && tier >= 1) return Math.max(3.5, 8.5 - tier * 1.2) + tell.phase;
    if (id === drummerId && tier >= tNod) return Math.max(4, 9 - tier) + tell.phase;
    if (tier >= tBail && tell.hits > 0) return 7 + tell.phase;
    return Number.POSITIVE_INFINITY;
  }

  /** Seconds between glances at the wings, or Infinity for someone staying. */
  function glancePeriod(tell: Tell): number {
    if (tier >= patience) return 4 + tell.phase;
    if (tier >= tAll && tell.hits > 0) return 5.5 + tell.phase;
    if (tier >= tBail && tell === flightRisk()) return 7 + tell.phase;
    return Number.POSITIVE_INFINITY;
  }

  function grooveFor(tell: Tell): number {
    if (tier === 0) return 1;
    if (tell.performer.id === drummerId && tier >= tNod) return 0;
    return clamp(1 - (tier / patience) * 1.1, 0, 1);
  }

  function tellFrame(): void {
    if (tier === 0) return;
    const risk = flightRisk();
    for (const tell of tells.values()) {
      const period = glarePeriod(tell);
      if (Number.isFinite(period) && now >= tell.nextGlare) {
        tell.rig.react('glare', clamp(0.45 + 0.14 * tier, 0, 1));
        tell.lastGlare = now;
        tell.nextGlare = now + period;
      }

      const glance = glancePeriod(tell);
      if (Number.isFinite(glance) && now >= tell.nextGlance) {
        tell.glanceUntil = now + GLANCE_SECONDS;
        tell.nextGlance = now + glance;
        // A glance at the exit reads as weighing it only if the face agrees.
        if (tell === risk) tell.rig.react('surprise', 0.5);
      }

      // Gaze. Glancing at the wings beats staring at the thrower, which beats
      // whatever the animation runtime wanted — see the frame contract.
      if (now < tell.glanceUntil) {
        const wing = tell.performer.station.position[0] < 0 ? wingLeft : wingRight;
        tell.gaze.copy(wing);
        commandGaze(tell, true);
      } else if (now - tell.lastGlare < GLARE_SECONDS) {
        tell.gaze.copy(thrower);
        commandGaze(tell, true);
      } else {
        commandGaze(tell, false);
      }
    }
  }

  function commandGaze(tell: Tell, on: boolean): void {
    if (on) {
      tell.gazeActive = true;
      tell.rig.lookAt(tell.gaze);
    } else if (tell.gazeActive) {
      tell.gazeActive = false;
      tell.rig.lookAt(undefined);
    }
  }

  // -----------------------------------------------------------------------
  // The public shape
  // -----------------------------------------------------------------------

  const api: Tomatoes = {
    root,
    patience,

    begin(cast, nextRigs, nextStage, staging) {
      api.strike();
      rigs = nextRigs;
      stage = nextStage;
      targets.length = 0;
      bodies.length = 0;
      carried.clear();
      tells.clear();

      buildRoom(nextStage);
      buildBodies(cast);

      if (staging?.instruments) {
        for (const entry of staging.instruments) {
          const [performerId, node] = entry;
          // Registered before anything can bail out: an instrument that does not
          // collide is still an instrument, and a body trace must step over it
          // either way.
          carried.add(node);
          parts.length = 0;
          decompose(node, parts);
          let i = 0;
          for (const part of parts) {
            // Per part, not per instrument. A cymbal that reaches over its
            // drummer's head is trimmed and the kick drum beside it is not,
            // where one box for the kit had to lose the whole top of itself.
            if (!trimAgainstOwner(part, performerId)) continue;
            addBox('instrument', `${performerId}:instrument:${i++}`, part, performerId, node);
          }
        }
      }
      if (staging?.scenery) {
        for (const node of staging.scenery) {
          parts.length = 0;
          decompose(node, parts);
          let i = 0;
          for (const part of parts) {
            // The span test that used to live in `show.ts` and reject the whole
            // prop, applied to the pieces instead. A row of bunting built as one
            // ten-metre mesh cannot be cut up and is still refused; a string of
            // lanterns built as one lantern each is now nine hittable lanterns
            // where it used to be one invisible wall across the room.
            if (!compact(part)) continue;
            addBox('scenery', `${node.name || 'prop'}:${i++}`, part, undefined, node);
          }
        }
      }

      leaderId = cast.leadPerformerId ?? cast.performers[0]?.id;
      drummerId = cast.performers.find((p) => p.layer === 'drums')?.id
        ?? cast.performers.find((p) => p.archetype === 'drumkit')?.id
        ?? cast.performers.find((p) => p.layer === 'bass')?.id;

      const rng = new Rng(`${seed}:tells`);
      for (const performer of cast.performers) {
        const rig = rigs.get(performer.id);
        if (!rig) continue;
        tells.set(performer.id, {
          rig, performer, gaze: new Vector3(), gazeActive: false,
          nextGlare: Number.POSITIVE_INFINITY, lastGlare: Number.NEGATIVE_INFINITY,
          nextGlance: Number.POSITIVE_INFINITY,
          glanceUntil: -1, phase: rng.float(0, 1.4), hits: 0,
        });
      }

      // Last, so that a `strike` inside this call cannot undo it.
      prime();
    },

    aim(ndcX, ndcY, cam) {
      const use = cam ?? camera;
      if (!use || !Number.isFinite(ndcX) || !Number.isFinite(ndcY)) return aimed;
      camera = use;
      if (!aimed) aimed = new Vector3();
      if (!pick(ndcX, ndcY, use, aimed)) return undefined;
      return aimed;
    },

    aimPoint() { return aimed; },

    throwNow(cam) {
      const use = cam ?? camera;
      if (!use || !aimed || cooldown > 0) return false;
      const flight = take();
      if (!flight) return false;
      camera = use;

      const rng = new Rng(`${seed}:throw:${throwCount}`);
      throwCount++;

      throwOrigin(use, V1);
      V2.copy(aimed).addScaledVector(aimNormal, radius);
      if (spread > 0) {
        // Scatter perpendicular to the aim, growing with range: an arm is
        // accurate in angle, not in metres.
        V3.copy(V2).sub(V1);
        const range = V3.length();
        if (range > 1e-3) {
          V3.divideScalar(range);
          perpendicular(V3, V4);
          const a = rng.float(0, Math.PI * 2);
          const r = Math.sqrt(rng.next()) * Math.tan(spread) * range;
          V2.addScaledVector(V4, Math.cos(a) * r);
          V4.crossVectors(V3, V4).normalize();
          V2.addScaledVector(V4, Math.sin(a) * r);
        }
      }

      solveLaunch(V1, V2, flight.vel);
      if (!finite3(flight.vel)) return false;
      flight.from.copy(V1);
      flight.age = 0;
      flight.live = true;
      flight.group.visible = true;
      flight.group.position.copy(V1);
      // Undo the warm-up shrink. A tomato that goes out at 0.1 mm is a throw
      // that appears to do nothing, which is a worse bug than the one this
      // whole mechanism fixes.
      flight.group.scale.setScalar(1);
      // And undo the last burst. The tumble below is written through `rotation`
      // and the squash is written through `quaternion`; clearing the Euler
      // clears both, and without it a reused tomato flies out already lying
      // flat against a surface that is no longer there.
      flight.group.rotation.set(0, 0, 0);
      for (const bit of flight.pulp) bit.visible = false;
      flight.spin.set(rng.float(-14, 14), rng.float(-14, 14), rng.float(-14, 14));
      if (flight.shadow) flight.shadow.visible = true;

      // The band is told where it came from even if it misses. Being shot at is
      // being shot at.
      thrower.copy(V1);
      cooldown = cooldownSeconds;
      return true;
    },

    ready() { return cooldownSeconds > 0 ? clamp(1 - cooldown / cooldownSeconds, 0, 1) : 1; },

    inFlight() {
      let n = 0;
      for (const f of flights) if (f.live) n++;
      return n;
    },

    update(beat, dt) {
      if (Number.isFinite(beat)) lastBeat = beat;
      // A backgrounded tab hands back several seconds and a clock that has not
      // started hands back NaN. Neither may teleport a tomato through a head.
      const step = Number.isFinite(dt) ? Math.min(Math.max(dt, 0), 0.1) : 0;
      now += step;
      cooldown = Math.max(0, cooldown - step);

      // Frames, not seconds: what the warm-up is waiting for is a `render`, and
      // there is exactly one of those per frame however long it took.
      if (warm > 0 && --warm === 0) cool();

      if (bodies.length > 0) refreshBodies();

      // --- flight ---------------------------------------------------------
      const subs = Math.max(1, Math.min(MAX_SUBSTEPS, Math.ceil(step / SUBSTEP)));
      const h = step / subs;
      for (const f of flights) {
        // A bursting tomato is out of the physics: it has already hit
        // something, and its pulp is decoration rather than a projectile.
        if (f.burst >= 0) {
          f.burst += step;
          if (f.burst >= PULP_SECONDS) retire(f);
          else drawBurst(f);
          continue;
        }
        if (!f.live) continue;
        for (let i = 0; i < subs && f.live; i++) {
          positionAt(f, f.age, V1);
          f.age += h;
          positionAt(f, f.age, V2);
          const armed = V1.distanceToSquared(f.from) > ARM_DISTANCE * ARM_DISTANCE;
          if (armed && sweep(V1, V2, radius, targets, impact)) {
            // V1 is where this substep started, and the last thing `sweep` said
            // about it is that nothing was in the way — which makes it the one
            // point `refine` can safely start a ray from.
            land(f, impact.point, impact.normal, impact.target, V1);
            break;
          }
        }
        if (!f.live) continue;
        if (f.age > LIFETIME || V2.y < -40) { retire(f); continue; }

        positionAt(f, f.age, V1);
        f.group.position.copy(V1);
        f.group.rotation.x += f.spin.x * h;
        f.group.rotation.y += f.spin.y * h;
        f.group.rotation.z += f.spin.z * h;
        if (f.shadow) {
          const gy = V1.z > (stage?.metrics.lipZ ?? 0) ? (stage?.metrics.houseY ?? 0) : 0;
          const drop = Math.max(0.05, V1.y - gy);
          f.shadow.position.set(V1.x, gy + 0.008, V1.z);
          f.shadow.scale.setScalar(radius * (1.4 + drop * 0.35));
          // It fades with height rather than vanishing, so a lob does not lose
          // its one depth cue at the top of the arc.
          f.shadow.visible = drop < 9;
        }
      }

      // --- the room and the marks -----------------------------------------
      if (now >= laughAt) {
        laughAt = Number.POSITIVE_INFINITY;
        stage?.applaud(laughLevel);
      }
      splats.update(step);
      tellFrame();

      // --- events, once the frame's physics has settled --------------------
      // Deliberately after everything: a listener that mutes a layer must not
      // run half way through the substep loop, and one that throws must not
      // leave a tomato in an impossible state.
      if (hitQueue.length > 0) {
        const queued = hitQueue.splice(0, hitQueue.length);
        for (const ev of queued) for (const fn of hitListeners) fn(ev);
      }
    },

    strike() {
      cool();
      for (const f of flights) retire(f);
      splats.clear();
      for (const tell of tells.values()) {
        tell.hits = 0;
        tell.nextGlare = Number.POSITIVE_INFINITY;
        tell.lastGlare = Number.NEGATIVE_INFINITY;
        tell.nextGlance = Number.POSITIVE_INFINITY;
        tell.glanceUntil = -1;
        commandGaze(tell, false);
        tell.rig.clearSplats();
      }
      hits = 0;
      spent = 0;
      tier = 0;
      hitQueue.length = 0;
      laughAt = Number.POSITIVE_INFINITY;
      cooldown = 0;
    },

    onHit(fn) { hitListeners.push(fn); },
    hitsThisNumber() { return hits; },
    hitsOn(performerId) { return tells.get(performerId)?.hits ?? 0; },

    mood(performerId) {
      const tell = tells.get(performerId);
      if (!tell) return { hits: 0, groove: 1, gaze: undefined, bailing: false };
      return {
        hits: tell.hits,
        groove: grooveFor(tell),
        gaze: tell.gazeActive ? tell.gaze : undefined,
        bailing: Number.isFinite(glancePeriod(tell)),
      };
    },

    measure() {
      const s = splats.stats();
      // Group, flesh, calyx, shadow, and one object per bit of pulp. The
      // triangles are the flesh's 80, the calyx's 10, the shadow's 10 and 20
      // for each bit — a worst case, since the pulp is only ever drawn during
      // the four tenths of a second after an impact.
      const perTomato = {
        objects: (shadows ? 4 : 3) + PULP,
        triangles: 80 + 10 + (shadows ? 10 : 0) + PULP * 20,
      };
      let live = 0;
      for (const f of flights) if (f.live || f.burst >= 0) live++;
      return {
        // The two roots, the body-mark warm-up, and the pool.
        objects: 1 + 1 + 1 + flights.length * perTomato.objects + s.objects,
        triangles: live * perTomato.triangles + s.triangles,
        perTomato,
        perSplat: { objects: 1, triangles: SPLAT_TRIANGLES },
        inFlight: live,
        splats: s.live,
        splatCap: s.cap,
        targets: targets.length,
      };
    },

    dispose() {
      api.strike();
      for (const f of flights) {
        f.group.removeFromParent();
        f.shadow?.removeFromParent();
        for (const bit of f.pulp) bit.removeFromParent();
      }
      flights.length = 0;
      splats.dispose();
      // The body-mark assets belong to the shared pool, not to this. Giving the
      // lease back is what lets the pool free the splat texture once the rigs
      // have gone too; disposing them here would pull them out from under a rig
      // that is still holding one.
      bodyMark.removeFromParent();
      markLeases.releaseAll();
      fleshGeo.dispose();
      pulpGeo.dispose();
      calyxGeo.dispose();
      shadowGeo.dispose();
      fleshMat.dispose();
      calyxMat.dispose();
      shadowMat.dispose();
      targets.length = 0;
      bodies.length = 0;
      carried.clear();
      tells.clear();
      hitListeners.length = 0;
      root.removeFromParent();
    },
  };

  return api;
}

// ---------------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Whether a box is a solid object rather than a painted-on surface or a wall.
 *
 * Nothing thinner than a hand, nothing longer than a person is tall. The test
 * came from `show.ts`, where it had to accept or reject a whole prop, and 70 of
 * 100 pieces of dressing failed it — a builder that places a row of things
 * places it as one object, so the bunting was 10.6 m wide and the beams
 * 19.8 x 15.7, and several were flat with a dimension of exactly zero: carpets,
 * rugs, the dance floor. Handing those over hangs room-sized invisible planes
 * in the air for tomatoes to stop dead against.
 *
 * `decompose` runs first now, so this is asked of the *pieces*. A prop that is
 * a row of separate meshes passes piece by piece; only geometry that is
 * genuinely one long mesh still fails, and for that the answer really is no.
 */
function compact(box: Box3): boolean {
  if (box.isEmpty()) return false;
  box.getSize(SIZE);
  const thinnest = Math.min(SIZE.x, SIZE.y, SIZE.z);
  const longest = Math.max(SIZE.x, SIZE.y, SIZE.z);
  return thinnest >= PROP_MIN_THICKNESS && longest <= PROP_MAX_SPAN;
}

/** Metres cubed, or 0 for an empty box. */
function boxVolume(box: Box3): number {
  if (box.isEmpty()) return 0;
  box.getSize(SIZE);
  return SIZE.x * SIZE.y * SIZE.z;
}

/**
 * Summed world-box volume of every mesh under `node`, itself included.
 *
 * Overlapping leaves are counted twice, which is why this is only ever
 * compared against a threshold and clamped to 1 — it is a "does this node have
 * anything in it" test, not a measurement of solid.
 */
function leafVolume(node: Object3D): number {
  let sum = 0;
  node.traverse((child) => {
    if (!(child as Mesh).isMesh) return;
    sum += boxVolume(LEAF.setFromObject(child));
  });
  return sum;
}

function finite3(v: Vector3): boolean {
  return Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
}

/**
 * What a mark traced onto `leaf` should hang on.
 *
 * The leaf is the better answer when it can be had: a mark on a cymbal should
 * swing with the cymbal and not merely ride the kit. It cannot always be had.
 * `SplatField.place` hangs a mark with `Object3D.attach`, which preserves the
 * world transform by giving the mark a compensating scale — and one scale
 * cannot undo a non-uniform one under a rotation, so a mark on a part that has
 * been stretched along a single axis comes out sheared. There are plenty of
 * those: a limb whose `scale.y` is its length in metres is the house style.
 *
 * So: the leaf when its world scale is uniform, and the whole instrument when
 * it is not. The mark still travels either way; it just travels with something
 * larger.
 */
function parentFor(leaf: Object3D, fallback: Object3D | undefined): Object3D | undefined {
  leaf.getWorldScale(RAY_SCALE);
  const lo = Math.min(RAY_SCALE.x, RAY_SCALE.y, RAY_SCALE.z);
  const hi = Math.max(RAY_SCALE.x, RAY_SCALE.y, RAY_SCALE.z);
  if (lo > 1e-4 && hi / lo < 1.02) return leaf;
  return fallback;
}

/**
 * The middle of a collision shape, as seen from `p`, into `out`.
 *
 * Where a second ray aims when the first one — the one that follows the tomato
 * — went through the shape without meeting anything real. Every shape here
 * encloses the thing it stands for, so a ray from a point on the shape toward
 * its core runs into that thing rather than past it.
 *
 * A capsule answers with the nearest point on its own axis rather than its
 * midpoint, which is the difference between a glancing hit on a shoulder aiming
 * at the shoulder and one aiming at the navel.
 */
function core(shape: Shape, p: Vector3, out: Vector3): Vector3 {
  if (shape.kind === 'sphere') return out.copy(shape.centre);
  if (shape.kind === 'box') {
    return out.copy(shape.min).add(shape.max).multiplyScalar(0.5);
  }
  out.copy(shape.b).sub(shape.a);
  const len = out.lengthSq();
  if (len < 1e-12) return out.copy(shape.a);
  const u = clamp(RAY_TMP.copy(p).sub(shape.a).dot(out) / len, 0, 1);
  return out.multiplyScalar(u).add(shape.a);
}

/**
 * Whether a traced hit is one a mark can go on: visible the whole way up to
 * `stopAt`, and not inside anything in `skip`.
 *
 * Visibility has to be asked here because `Raycaster` does not ask it. It tests
 * layers and then calls `raycast` on every descendant, so a mesh that has been
 * switched off — a bell that is only out for one number, the spare hands a rig
 * keeps hidden — is exactly as solid to a ray as anything you can see. A mark
 * on one of those is a mark that never appears.
 *
 * One walk for both questions, and it stops at `stopAt` rather than at the
 * scene root: everything above the thing being traced is somebody else's.
 */
function markable(obj: Object3D, stopAt: Object3D, skip?: ReadonlySet<Object3D>): boolean {
  let node: Object3D | null = obj;
  while (node) {
    if (!node.visible) return false;
    if (skip?.has(node)) return false;
    if (node === stopAt) return true;
    node = node.parent;
  }
  return true;
}

/** Any unit vector at right angles to `v`, chosen to stay well-conditioned. */
function perpendicular(v: Vector3, out: Vector3): Vector3 {
  return Math.abs(v.y) < 0.9
    ? out.set(0, 1, 0).cross(v).normalize()
    : out.set(1, 0, 0).cross(v).normalize();
}
