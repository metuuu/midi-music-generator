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
 * `GenerateOptions.variation` and brings the player back; five hits emit
 * `onPatienceLost` and the show runner stops the number at the end of the bar.
 * There is no import from `src/generate/` here and there never should be —
 * the visuals cannot be allowed a path by which they change what is heard, and
 * the way to keep that structural rather than a promise is to report events and
 * let the thing that owns the music decide what they mean.
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
 *   5th       `onPatienceLost`.
 *
 * The thresholds scale with `patience` so that tuning the budget does not throw
 * the ladder away.
 *
 * ## Frame contract, which matters more than usual here
 *
 * ```ts
 * const tomatoes = createTomatoes(scene, { seed: concert.seed });
 * tomatoes.begin(number.cast, rigs, stage, { instruments, scenery });
 * tomatoes.onHit((ev) => show.hit(ev));         // mute, reroll, return
 * tomatoes.onPatienceLost(() => show.walkOff());
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
 * **Nothing is built on the throw.** `begin` allocates the whole pool — six
 * tomatoes, six shadows, every splat — and leaves it in the scene for a frame
 * so the renderer compiles its programs and uploads its buffers there rather
 * than on the frame somebody clicks. Building a mesh mid-flight is not a
 * correctness problem and it is very much a *feel* problem: it put a visible
 * hitch between the release and the tomato, which reads as the throw being
 * broken. See `WARM_FRAMES` for the measurement.
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
  Box3, Camera, CircleGeometry, ConeGeometry, Group, IcosahedronGeometry, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, Object3D, Vector3,
} from 'three';

import type { Cast, Performer } from '../../concert/types.js';
import { Rng } from '../../core/rng.js';
import type { PerformerRig } from './performer.js';
import type { StageRig } from './stage.js';
import { sweep, type Impact, type Target } from './tomato-collide.js';
import { createSplatField, SPLAT_TRIANGLES } from './tomato-splat.js';

export interface TomatoOptions {
  /**
   * Every random choice derives from this. Pass the concert seed and a replayed
   * show throws identical tomatoes.
   */
  seed?: string;
  /**
   * Hits in one number before the band walks it off. The plan says start at 5
   * and tune by feel; 5 is what this shipped with, and why is in the module
   * docs for `PATIENCE`.
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
  performerId: string;
  /** Where it landed. A copy — safe to keep. */
  worldPoint: Vector3;
  /** Song position when it landed, straight off the beat passed to `update`. */
  beat: number;
  /** Hits this player has taken this number, including this one. */
  hits: number;
  /** Hits the band has taken this number, including this one. */
  bandHits: number;
  /** What is left before `onPatienceLost`. 0 means this hit was the last one. */
  patienceLeft: number;
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
  onPatienceLost(fn: () => void): void;
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
 * Five, from the plan, and it survived the tuning pass for a specific reason:
 * with a two-second cooldown it is about fifteen seconds of uninterrupted,
 * accurate throwing to end a number, and every one of those seconds has the
 * band getting angrier at you. Three was reachable by accident. Eight and the
 * ladder's rungs stop being distinguishable — you cannot see the difference
 * between "two of eight" and "three of eight" in a body language.
 */
const PATIENCE = 5;
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
const BOX = new Box3();

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
  live: boolean;
  spin: Vector3;
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
  const calyxGeo = new ConeGeometry(0.5, 0.4, 5);
  const shadowGeo = new CircleGeometry(1, 10);
  const fleshMat = new MeshStandardMaterial({ color: '#c8210f', roughness: 0.34, metalness: 0 });
  const calyxMat = new MeshStandardMaterial({ color: '#3f6b27', roughness: 0.8, metalness: 0 });
  const shadowMat = new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.3, depthWrite: false });

  const flights: Flight[] = [];
  /** Reused every substep. `target` is only meaningful when `sweep` returns true. */
  const impact: Impact = {
    t: 0, point: new Vector3(), normal: new Vector3(0, 1, 0), target: NOTHING,
  };

  // --- the world -----------------------------------------------------------
  /** Rebuilt on `begin`. Performer shapes are refreshed every frame. */
  const targets: Target[] = [];
  /** Parallel to the performer entries, so the per-frame refresh is a walk. */
  const bodies: { rig: PerformerRig; head: Target; torso: Target }[] = [];
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
  let hits = 0;
  let lost = false;
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
  let lostQueued = false;
  const hitListeners: ((ev: TomatoHit) => void)[] = [];
  const lostListeners: (() => void)[] = [];

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
   * twenty-two files this module does not own. The rule that fixes it here is
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
   * whatever makes the arithmetic land. The whole solve is three lines because
   * there is no drag: a 55mm tomato over ten metres loses about a centimetre to
   * air, which is a tenth of the aim scatter and would cost the exactness that
   * makes "it lands where you aimed" testable.
   */
  function solveLaunch(from: Vector3, to: Vector3, out: Vector3): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const horiz = Math.hypot(dx, dz);
    const t = clamp(horiz / throwSpeed, MIN_FLIGHT_SECONDS, MAX_FLIGHT_SECONDS);
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
    const flight: Flight = {
      group, shadow, from: new Vector3(), vel: new Vector3(),
      age: 0, live: false, spin: new Vector3(),
    };
    flights.push(flight);
    return flight;
  }

  function take(): Flight | undefined {
    for (const f of flights) if (!f.live) return f;
    // `prime` fills the pool, so this only fires if somebody threw before
    // `begin`. Building one is still better than dropping the throw.
    return flights.length >= maxInFlight ? undefined : build();
  }

  /**
   * Build the pool, and get every part of it in front of the renderer once.
   *
   * See `WARM_FRAMES`. Everything a throw and a landing will need — six
   * tomatoes, six shadows, `splatCap` marks, six materials — exists and has
   * been drawn before the first click, so the throw path allocates nothing and
   * compiles nothing.
   */
  function prime(): void {
    while (flights.length < maxInFlight) build();
    for (const f of flights) {
      if (f.live) continue;
      f.group.position.set(0, 0, 0);
      f.group.scale.setScalar(WARM_SCALE);
      f.group.visible = true;
      if (f.shadow) {
        f.shadow.position.set(0, 0, 0);
        f.shadow.scale.setScalar(WARM_SCALE);
        f.shadow.visible = true;
      }
    }
    splats.prime();
    warm = WARM_FRAMES;
  }

  /** Put the warm-up back out of sight. Idempotent. */
  function cool(): void {
    warm = 0;
    for (const f of flights) if (!f.live) retire(f);
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
    f.group.visible = false;
    if (f.shadow) f.shadow.visible = false;
  }

  // -----------------------------------------------------------------------
  // Consequences — the visual half. The musical half is the show runner's.
  // -----------------------------------------------------------------------

  function land(f: Flight, point: Vector3, normal: Vector3, target: Target): void {
    retire(f);
    const rig = target.performerId ? rigs.get(target.performerId) : undefined;

    if (target.kind === 'performer' && rig && target.performerId) {
      const tell = tells.get(target.performerId);
      if (tell) tell.hits++;
      hits++;
      // The rig owns marks on bodies, and its `splat` already flinches — it
      // reacts with 'hit' internally, so a `react` here would replace the
      // reaction with a weaker one rather than adding to it.
      rig.splat(point);
      stage?.gasp();
      escalate();
      // The room finds the first one funny and the fourth one uncomfortable.
      laughAt = now + LAUGH_DELAY;
      laughLevel = Math.max(0.05, 0.3 - 0.06 * tier);
      hitQueue.push({
        performerId: target.performerId,
        worldPoint: point.clone(),
        beat: lastBeat,
        hits: tell ? tell.hits : 1,
        bandHits: hits,
        patienceLeft: Math.max(0, patience - hits),
      });
      if (hits >= patience && !lost) { lost = true; lostQueued = true; }
      return;
    }

    // Everything else is a mark and, if it was their kit, a look.
    //
    // `impact.point` is where the tomato's *centre* is at contact, which is one
    // radius off the surface. The mark goes on the surface. `PerformerRig.splat`
    // does its own projection onto the part it picks, so the centre is the right
    // thing to hand it and the wrong thing to hand this.
    V4.copy(point).addScaledVector(normal, -radius);
    splats.place(V4, normal, radius * 2.3, target.node);
    if (target.kind === 'instrument' && rig) rig.react('surprise', 0.55);
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
    tier = Math.min(hits, patience);
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
      tells.clear();

      buildRoom(nextStage);
      buildBodies(cast);

      if (staging?.instruments) {
        for (const entry of staging.instruments) {
          const [performerId, node] = entry;
          BOX.setFromObject(node);
          if (!trimAgainstOwner(BOX, performerId)) continue;
          addBox('instrument', `${performerId}:instrument`, BOX, performerId, node);
        }
      }
      if (staging?.scenery) {
        for (const node of staging.scenery) {
          BOX.setFromObject(node);
          addBox('scenery', node.name || 'prop', BOX, undefined, node);
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
        if (!f.live) continue;
        for (let i = 0; i < subs && f.live; i++) {
          positionAt(f, f.age, V1);
          f.age += h;
          positionAt(f, f.age, V2);
          const armed = V1.distanceToSquared(f.from) > ARM_DISTANCE * ARM_DISTANCE;
          if (armed && sweep(V1, V2, radius, targets, impact)) {
            land(f, impact.point, impact.normal, impact.target);
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
      // Deliberately after everything: a listener that mutes a layer or ends a
      // number must not run half way through the substep loop, and one that
      // throws must not leave a tomato in an impossible state.
      if (hitQueue.length > 0) {
        const queued = hitQueue.splice(0, hitQueue.length);
        for (const ev of queued) for (const fn of hitListeners) fn(ev);
      }
      if (lostQueued) {
        lostQueued = false;
        for (const fn of lostListeners) fn();
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
      tier = 0;
      lost = false;
      lostQueued = false;
      hitQueue.length = 0;
      laughAt = Number.POSITIVE_INFINITY;
      cooldown = 0;
    },

    onHit(fn) { hitListeners.push(fn); },
    onPatienceLost(fn) { lostListeners.push(fn); },
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
      const perTomato = { objects: shadows ? 4 : 3, triangles: 80 + 10 + (shadows ? 10 : 0) };
      let live = 0;
      for (const f of flights) if (f.live) live++;
      return {
        objects: 1 + flights.length * perTomato.objects + 1 + s.objects,
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
      }
      flights.length = 0;
      splats.dispose();
      fleshGeo.dispose();
      calyxGeo.dispose();
      shadowGeo.dispose();
      fleshMat.dispose();
      calyxMat.dispose();
      shadowMat.dispose();
      targets.length = 0;
      bodies.length = 0;
      tells.clear();
      hitListeners.length = 0;
      lostListeners.length = 0;
      root.removeFromParent();
    },
  };

  return api;
}

// ---------------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function finite3(v: Vector3): boolean {
  return Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
}

/** Any unit vector at right angles to `v`, chosen to stay well-conditioned. */
function perpendicular(v: Vector3, out: Vector3): Vector3 {
  return Math.abs(v.y) < 0.9
    ? out.set(0, 1, 0).cross(v).normalize()
    : out.set(1, 0, 0).cross(v).normalize();
}
