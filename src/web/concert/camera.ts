/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The camera director.
 *
 * Not in the original spec, and the feature is half as good without it. A
 * locked wide shot on a stage this detailed wastes everything built for it: the
 * drummer's hands are the clearest proof that the visuals come from the MIDI,
 * and from the house seat they are forty pixels across.
 *
 * Two rules carry almost all of the quality here.
 *
 * **Cut, don't fly.** Two or three fixed positions per stage plus a slow push
 * is more convincing than any amount of swooping, and it is what a television
 * gallery actually does. A camera that flies between subjects reads as a video
 * game; a camera that cuts reads as a broadcast. It is also far cheaper to get
 * right — there is no path to plan and nothing to collide with.
 *
 * **Cut on the music, never into it.** Cuts land on section boundaries and
 * downbeats. A cut in the middle of a phrase is felt as a mistake even by
 * someone who could not say why, because the eye and the ear are both counting
 * and the picture just lost count.
 *
 * The shot list is *planned ahead* from the form rather than chosen reactively.
 * The form is already in the IR and already knows a solo chorus is coming, so
 * there is no reason for the camera to be surprised by one — and a planned list
 * is deterministic, inspectable and testable, where a reactive director is
 * none of the three.
 */

import { PerspectiveCamera, Vector3, type Object3D } from 'three';

import { Rng } from '../../core/rng.js';
import type { LayerId, Song } from '../../core/types.js';
import type { Cast, SoloSpot, Venue } from '../../concert/types.js';
import { LENS_GAP, type StageMetrics } from './stage-kit.js';

/** What a shot is looking at. Resolved to an object at render time. */
export type ShotSubject =
  | { kind: 'stage' }
  | { kind: 'performer'; performerId: string };

export type ShotFraming =
  /** The whole band. Where the show lives, and where it returns between ideas. */
  | 'wide'
  /** Chest-up on one player. The solo shot. */
  | 'close'
  /** Low and near the boards, looking up. The kit shot, and the fill shot. */
  | 'low'
  /** Across the front line at head height. Good for a horn section. */
  | 'front';

export interface Shot {
  /** Beat this shot cuts in on. Always a downbeat. */
  beat: number;
  framing: ShotFraming;
  subject: ShotSubject;
  /**
   * How far the shot pushes in over its own length, in metres. Small —
   * a push you can see is a push that is too fast.
   */
  push: number;
}

export interface CameraDirector {
  camera: PerspectiveCamera;
  /**
   * The room, once, when the stage is built.
   *
   * Separate from `begin` because it is a different lifetime: the shot list is
   * per number and the building is not. What the director wants out of it is
   * the ceiling and the floor — the two surfaces it can put the lens through if
   * nobody tells it they are there.
   */
  room(metrics: StageMetrics): void;
  /** Plan the shot list for a number. Call before it starts. */
  begin(song: Song, cast: Cast, solos: SoloSpot[], venue: Venue, seed: string): void;
  /** The objects a shot can point at, keyed by performer id. */
  setSubjects(subjects: Map<string, Object3D>): void;
  /** One call per frame, with the beat from the one clock. */
  update(beat: number, dt: number): void;
  /** Drag to orbit. Hands control to the viewer until the next cut. */
  orbit(dx: number, dy: number): void;
  /**
   * Wheel or pinch to dolly. `factor` above 1 backs off, below 1 moves in.
   *
   * A multiplier rather than a distance because the shot it is scaling is not
   * one distance: the same notch has to mean the same *gesture* on a ten metre
   * wide shot and a two metre close-up, and only a ratio does that.
   */
  zoom(factor: number): void;
  /** The planned list, for verification and for the record. */
  shots(): readonly Shot[];
}

/**
 * How high above a performer's feet a shot is aimed, in metres.
 *
 * Roughly sternum height on a standing player. Not the head: framing on the
 * head puts the instrument out of shot, and the instrument is the thing that
 * proves the animation is coming from the music.
 */
const SUBJECT_HEIGHT = 1.25;

/** Breathing room around a computed framing. 1.0 is edge-to-edge and airless. */
const FRAMING_SLACK = 1.12;

/** The lens the show is shot on when the room allows it. */
const BASE_FOV = 42;

/**
 * The widest lens allowed. Past about here the perspective starts to bow and a
 * stage stops looking like a place — which is a worse failure than a shot that
 * loses the players at the ends of the front line.
 */
const MAX_FOV = 66;

/**
 * Shortest a shot may be, in bars.
 *
 * Four bars is roughly two seconds at a dance tempo and five at an ambient one,
 * which is about the floor for a shot that reads as a shot rather than as a
 * flicker. The bound is in bars rather than seconds on purpose: cutting is a
 * musical act here, and a slow piece should hold longer in absolute time.
 */
const MIN_SHOT_BARS = 4;

/**
 * How soon after a cut its subject has to be playing, in bars. See `playsFrom`.
 */
const ENTRY_BARS = 2;

/**
 * How far downstage of the wide shot's aim point the front row stands, as a
 * fraction of the stage depth.
 *
 * Two numbers added together, both of them owned elsewhere. `concert/cast.ts`
 * keeps everybody 0.7 m off the downstage lip, which on these stages puts the
 * front row about 0.4 of the depth in front of stage centre; the wide shot then
 * aims a further 0.25 of the depth upstage of centre. So the nearest players
 * are about two thirds of a stage depth nearer the lens than the plane the
 * framing is solved at — 4.2 m of it in the black box, which is most of the
 * distance the camera stands off in the first place.
 */
const FRONT_PLANE = 0.65;

/**
 * How much of the stage width the wide shot holds *at the front row's plane*.
 *
 * Not the whole stage. Asking for all of it at the nearest plane puts the
 * camera four metres further out and shrinks the band to nothing, and there is
 * nobody standing in the downstage corners to see: the staging holds the front
 * line inside 0.44 of the width by construction and inside about 0.37 of it in
 * practice, ambient's scatter included. 0.72 of the width — 0.36 either side of
 * centre — covers the players who are actually there and costs a metre.
 */
const FRONT_SHARE = 0.72;

/**
 * Where the downstage edge of the boards is, relative to the wide shot's aim
 * point, as a fraction of the stage depth.
 *
 * Exact rather than measured, unlike `FRONT_PLANE`: the lip is at `+depth/2` by
 * definition and the wide shot aims at `-depth * 0.25`, so the gap between them
 * is three quarters of the depth and always will be.
 */
const LIP_PLANE = 0.75;

/**
 * How much house floor the wide shot keeps *under* the lip, in metres.
 *
 * A frame whose bottom edge lands exactly on the stage edge does not read as
 * "the front of the stage is in shot" — it reads as a crop that happens to have
 * stopped in the right place. A hand's breadth of the apron below it says the
 * boards end there.
 */
const LIP_MARGIN = 0.12;

/** The height the wide shot is aimed at: over the band, under the fly bar. */
const WIDE_AIM_Y = 1.45;

/**
 * How near a surface of the room the lens may come, in metres.
 *
 * The drag used to be answered with an *angle*: yaw stopped a shade under 60°,
 * which kept the camera out of the one place every venue here is not built for
 * — behind it, where the backdrop is a cloth with nothing printed on the back
 * and the wings are single-sided planes. It worked, and it was the wrong shape
 * of answer. Most of a room is behind you at a concert, and a camera that will
 * not turn round is a camera on a rail.
 *
 * So the rule is a *place* instead. The lens may go the whole way round, and
 * what keeps it honest is that it has to stay in the room: inside the walls,
 * downstage of the backdrop, over a floor and under whatever lid there is.
 * Where the circle it is travelling on would leave the building, the radius
 * gives rather than the angle — swinging round the back of a band on a six
 * metre stage walks the camera in to a metre or so behind them, because that is
 * where somebody standing there would have to stand.
 *
 * That is the whole difference between the two rules. The old one said *you
 * cannot look from there*; this one says *from there, you are standing this
 * close*.
 */
const ROOM_GAP = 0.35;

/**
 * Nearest the lens may orbit to what it is looking at, in metres.
 *
 * The floor under the rule above, for the case where the room has none to give:
 * upstage of a band on a shallow stage the wall is genuinely a metre away, and
 * a radius solved purely from the room would keep shrinking until the camera
 * was inside the person it is pointed at.
 */
const ORBIT_MIN = 1.1;

/**
 * How far in and out the viewer may dolly, as a multiple of the shot's own
 * framing distance.
 *
 * Bounded as a *ratio* so both ends mean the same thing from every shot. In
 * puts you at a third of wherever the director was standing, which turns the
 * wide shot into a close-up and the close-up into a pair of hands — and
 * `ORBIT_MIN` catches it before it reaches anybody's teeth. Out is the looser
 * bound because it cannot go wrong in the same way: the room runs out long
 * before three does in every venue here, and what happens then is the lens
 * opening rather than the camera leaving the building.
 */
const ZOOM_MIN = 0.33;
const ZOOM_MAX = 3;

export function createDirector(reducedMotion = false): CameraDirector {
  const camera = new PerspectiveCamera(BASE_FOV, 1, 0.1, 120);
  const subjects = new Map<string, Object3D>();

  let plan: Shot[] = [];
  let venue: Venue | undefined;
  let metrics: StageMetrics | undefined;
  let index = -1;
  /** Beats into the current shot, for the push. */
  let held = 0;

  /**
   * Viewer control. While it is set the director keeps its hands off, and the
   * *cut* is what takes the camera back.
   *
   * It used to be a four-second timer, which is the obvious rule and the wrong
   * one. Letting go of a camera is not a request to have it taken away: a
   * viewer who has swung round to watch the drummer's left hand is watching the
   * drummer's left hand, and four seconds later the picture slid off it for no
   * reason they could see, in the middle of a shot nothing else about the show
   * had finished with. The complaint that reads as *the camera keeps snapping
   * back* is that timer and nothing else.
   *
   * So the handback happens at the moment the camera was going to move anyway.
   * The director gets it back on its next cut — a boundary the viewer can hear
   * coming, because it lands on the music — and until then the angle is
   * theirs. `begin` counts as one: a new number is a new shot list, and holding
   * a drag across the end of a piece would be holding it across a cut nobody
   * planned.
   */
  let viewerHas = false;
  let yaw = 0;
  let pitch = 0;
  /** The viewer's dolly, as a multiple of the shot's framing distance. */
  let range = 1;
  /** How far the lens has opened to pay for a walk-in. 1 is the framing's own. */
  let lens = 1;

  const eye = new Vector3();
  const focus = new Vector3();
  const wanted = new Vector3();
  const wantedFocus = new Vector3();
  /** Scratch for the orbit: the direction it points, and where `reach` looks. */
  const ray = new Vector3();
  const probe = new Vector3();

  /**
   * The point a shot is *about*, which is never where the performer's origin is.
   *
   * A rig's root sits on the boards at its feet, because that is what a station
   * is. Framing on it points the camera at a pair of shoes and puts the person
   * you came to watch above the top of frame. Every shot therefore lifts to a
   * working height first — chest for a standing player, lower for a seated one,
   * and the instrument's own surface for a kit.
   */
  function subjectPoint(subject: ShotSubject, out: Vector3): Vector3 {
    if (subject.kind === 'performer') {
      const obj = subjects.get(subject.performerId);
      if (obj) return obj.getWorldPosition(out).setY(out.y + SUBJECT_HEIGHT);
    }
    // The stage, or a performer who has left it — the wide shot is always safe.
    return out.set(0, 1.35, -1);
  }

  /**
   * How far back to stand to fit something of a given size in frame.
   *
   * This is the part the first version got wrong, and it got it wrong in a way
   * that only shows up on a real window: the distances were *constants*. A
   * vertical field of view is only half the story, because the horizontal one
   * depends on the aspect ratio — and in a tall window (the browser pane here
   * is 0.96) the horizontal field is *narrower* than the vertical. A wide shot
   * framed by eye on a 16:9 monitor becomes a close-up of somebody's chin.
   *
   * So the distance is solved, per frame, from whichever axis is tighter.
   */
  function fitRect(width: number, height: number, fovY: number): number {
    const fovX = 2 * Math.atan(Math.tan(fovY / 2) * frameAspect());
    return Math.max(
      (height / 2) / Math.tan(fovY / 2),
      (width / 2) / Math.tan(fovX / 2),
    ) * FRAMING_SLACK;
  }

  /**
   * Settle the lens, then report where to stand.
   *
   * `need` answers "how far back does this shot have to be on a lens this
   * wide", and a shot may have more than one thing to satisfy — the wide one
   * has three. They are all asked on the *same* candidate lens and the furthest
   * answer wins, because a framing solved against one field of view and then
   * measured against another is not solved at all.
   *
   * In a small room, take a wider lens rather than a longer walk backwards.
   *
   * This is the second thing the framing maths got wrong, and it only appears
   * in the venues that are actually small. Solving purely for distance asked
   * for 13 m to fit an 8.8 m stage in a tall window — and a jazz cellar's
   * house is nowhere near 13 m deep, so the camera reversed straight through
   * the back wall and ended up *above the ceiling joists*, filming the band
   * through the plumbing.
   *
   * A camera operator in a cramped room does not knock the wall out. They put
   * a wider lens on, accept the perspective, and stay inside the building. So
   * the FOV opens until the shot fits or until it starts to look like a
   * fisheye, and only then does the distance give.
   */
  function solveDistance(need: (fovY: number) => number): number {
    let fovY = (BASE_FOV * Math.PI) / 180;
    let d = need(fovY);
    while (d > maxDistance() && fovY < (MAX_FOV * Math.PI) / 180) {
      fovY = Math.min(fovY * 1.06, (MAX_FOV * Math.PI) / 180);
      d = need(fovY);
    }

    const degrees = (fovY * 180) / Math.PI;
    if (Math.abs(camera.fov - degrees) > 0.01) {
      camera.fov = degrees;
      camera.updateProjectionMatrix();
    }
    return Math.min(d, maxDistance());
  }

  /** The single-rectangle case, which is every shot except the wide one. */
  function distanceFor(width: number, height: number): number {
    return solveDistance((fovY) => fitRect(width, height, fovY));
  }

  /**
   * The aspect ratio the framing maths is allowed to believe.
   *
   * Belt and braces with `resize`: a camera that has never been sized, or one
   * sized while the page was off-layout, must not be able to ask for an
   * infinite pull-back. 16:9 is a better guess than a division by zero.
   */
  function frameAspect(): number {
    return Number.isFinite(camera.aspect) && camera.aspect > 0.05
      ? Math.min(camera.aspect, 4)
      : 16 / 9;
  }

  /**
   * How far back the wide shot has to stand to keep the front row in frame.
   *
   * `distanceFor` fits its rectangle *at the plane it is given*, and the band
   * is a volume rather than a plane: the players nearest the audience stand
   * `FRONT_PLANE` of a stage depth in front of the plane the wide shot aims at,
   * so they are magnified against the framing that was solved for the middle of
   * the band and the ends of the front line fall out of shot.
   *
   * The reason this went unnoticed is that it hides itself on a tall window. A
   * narrow horizontal field cannot fit the boards at the aim plane either, so
   * the lens opens toward `MAX_FOV` and the camera walks backwards, and the
   * front row comes along for free. A widescreen window has horizontal field to
   * spare, stays at `BASE_FOV`, stands close — and crops. At 16:9 in the black
   * box the frame was two metres either side of centre at the downstage lip.
   *
   * So the wide shot solves the front plane as well and takes whichever
   * distance is further back.
   */
  function frontEdgeDistance(width: number, depth: number, fovY: number): number {
    const tanX = Math.tan(fovY / 2) * frameAspect();
    return ((width * FRONT_SHARE) / 2) / tanX + depth * FRONT_PLANE;
  }

  /**
   * How high the wide shot's rostrum stands, at a given distance.
   *
   * Above the house, not in it. A wide shot taken at standing height in the
   * audience is a shot with the balcony rail through the middle of the band —
   * which is exactly what a person at the back of a club sees, and exactly what
   * nobody wants to watch. Cameras live on a rostrum for this reason. The lift
   * scales with distance so a small room does not end up looking down at the
   * top of everyone's head.
   *
   * **Under the ceiling, though.** That was the assumption nobody wrote down:
   * that a room has as much height as the shot wants. The jazz cellar does not
   * — its lid is the whole reason it reads as a cellar — and so every wide shot
   * in that room was framed from a rostrum standing *through* the ceiling. What
   * you saw was not the obstruction you would expect, because a single-sided
   * plane seen from above does not obstruct: you saw its edge and its two
   * service pipes ruled straight across the crowd, appearing and disappearing
   * as the solved distance moved the lens back and forth through 2.0 m.
   *
   * `headroom` is `Infinity` in a room with nothing overhead, so this costs the
   * pavilion and the black box exactly nothing. In the cellar it settles the
   * lens at 1.8 m, which is still a metre above the back row of a seated house
   * — the shot the doc above refuses is a *standing* crowd, and the one room
   * with a lid is the one room whose audience is sitting down.
   *
   * The margin is `LENS_GAP` and it is deliberately generous. Clearing the
   * ceiling is not the same as looking like you have cleared it: a lens a
   * hand's breadth under a lid puts the ceiling at the top of every frame and
   * keeps it there, which is a different bad picture from the one this started
   * as but still a bad picture.
   */
  function wideEye(d: number): number {
    return Math.min(2.3 + Math.min(d * 0.11, 1.3), ceiling());
  }

  /**
   * The highest the lens may go in this room. See `wideEye`.
   *
   * **Both lids, not just `headroom`.** That field is documented as the worse
   * of the two so that one number can answer for the whole room, and it is —
   * in every room where the *stage* is the enclosed half. The shape it cannot
   * describe is the opposite one: a theatre with a fly tower over the boards
   * and plaster over the audience publishes `Infinity` overhead, honestly,
   * because there genuinely is nothing above the band to hang from or duck
   * under — and a lens solved against that alone walks up through the house
   * ceiling the moment it stands in the house, which is where every wide shot
   * stands. `ballroom.ts` names this as its one honest defect and says it
   * cannot be fixed from there because nothing reads `houseLid` for a lens.
   * This is that consumer.
   *
   * It changes no room that was already right: everywhere else the pair is
   * either equal or `headroom` is the lower, so the `min` picks what was
   * picked before.
   */
  function ceiling(): number {
    return Math.min(
      metrics?.headroom ?? Infinity,
      metrics?.houseLid ?? Infinity,
    ) - LENS_GAP;
  }

  /**
   * The lowest, at a given depth. A camera under the floorboards is not a low
   * angle — and which floorboards depends on where it is standing, because the
   * house floor is a whole stage height below the boards and a lens over the
   * stage that is allowed down to the house floor is a lens inside the apron.
   */
  function floorAt(z: number): number {
    const onStage = z < (metrics?.lipZ ?? 3);
    return (onStage ? 0 : metrics?.houseY ?? -0.9) + ROOM_GAP;
  }

  /** Whether a point is somewhere a camera could actually stand in this room. */
  function inRoom(v: Vector3): boolean {
    const lipZ = metrics?.lipZ ?? 3;
    const onStage = v.z < lipZ;
    // The boards end where they end; the house is wider than they are, and its
    // walls stand another 0.6 m outside this.
    const halfX = (onStage ? metrics?.width ?? 10 : metrics?.houseWidth ?? 14) / 2;
    return Math.abs(v.x) <= halfX
      && v.z >= (metrics?.backZ ?? -3) + ROOM_GAP
      && v.z <= lipZ + (metrics?.houseDepth ?? 8)
      && v.y >= floorAt(v.z) && v.y <= ceiling();
  }

  /**
   * How far along a ray from a point inside the room the room lasts.
   *
   * Marched and then bisected rather than solved. The volume is not one box:
   * the house is wider than the stage and its floor is a stage height lower, so
   * a ray crossing the lip steps in two of the six surfaces at once, and it can
   * leave the boards at the side and re-enter the room over the house floor a
   * metre later. A closed form for that is a case analysis nobody could check
   * by reading it, where `inRoom` says what a room is in six comparisons and
   * this asks it politely. Twenty-four samples and eight bisections lands
   * within a couple of centimetres of the surface, once a frame, and only while
   * somebody is actually dragging.
   */
  function reach(at: Vector3, dir: Vector3, far: number): number {
    let last = 0;
    for (let i = 1; i <= 24; i++) {
      const t = (i / 24) * far;
      if (inRoom(probe.copy(dir).multiplyScalar(t).add(at))) { last = t; continue; }
      let lo = last;
      let hi = t;
      for (let j = 0; j < 8; j++) {
        const mid = (lo + hi) / 2;
        if (inRoom(probe.copy(dir).multiplyScalar(mid).add(at))) lo = mid; else hi = mid;
      }
      return lo;
    }
    return far;
  }

  /**
   * Over the crowd, or in front of it. Never through it.
   *
   * The room has always been solved for and the *people in it* never were: a
   * lens gets its height from what it is framing and its distance from how wide
   * that is, and neither of those has an opinion about whose head is in the
   * way. Every shot standing back far enough — the wide at `maxDistance`, a
   * front-on across a broad stage — puts the camera somewhere in the seats, and
   * the only reason it was not obviously wrong before is that the house floor
   * used to be 0.9 m down, which bought the shot heights half a metre of
   * accidental clearance. The boards came down to `CELLAR_RISE`, the crowd came
   * up with them, and the accident ran out.
   *
   * Downstage of the front row this does nothing — that is open floor between
   * the lip and the first table, and it is where the close shots live. Behind
   * that line the lens goes over the heads or it does not go there.
   *
   * The ceiling still wins. In a room too low to fly the camera over its own
   * audience the honest answer is a shot with somebody's head in the near
   * foreground, which is a jazz photograph, rather than a lens inside it.
   *
   * **The director obeys this and the viewer does not.** It is a rule about
   * shots the show composes for you, and a drag is not one of those: somebody
   * who has pulled the camera down into the seats has asked to be in the seats.
   * Enforcing it there was also what pinned the cellar — a lid at 2.25 m over a
   * crowd wanting 1.74 left the drag half a metre of travel, and a camera with
   * half a metre of travel is a camera at a fixed height.
   */
  function clearCrowd(v: Vector3): void {
    const c = metrics?.crowd;
    if (!c || v.z < c.frontZ) return;
    v.y = Math.min(Math.max(v.y, c.topY + 0.3), ceiling());
  }

  /**
   * How far back the wide shot has to stand for the front of the stage to be in
   * shot at all.
   *
   * The third thing the framing maths got wrong, and the one a wide monitor
   * shows off. `frontEdgeDistance` holds the front row's *width*; nothing held
   * its *floor*, and the wide shot is a tilted camera, so the bottom of frame
   * rises steeply as it comes forward. On a tall window that never mattered —
   * the lens is already open and the camera is already at the back wall, so the
   * lip is in frame by accident. Give the shot a 21:9 window and the horizontal
   * constraint costs almost nothing, the camera walks in to eight metres, and
   * the bottom of frame crosses the boards three quarters of a metre up: the
   * front row is cut off at the waist and the stage has no edge. That is the
   * "the camera has no maximum zoom" complaint, and this is where it lives.
   *
   * The condition is exact for a point on the camera's own vertical centre
   * line, and the bottom of frame is a plane through the lens, so solving at
   * centre stage holds the lip across the whole width: the lip is in shot when
   * the angle down to it is no steeper than the tilt plus half the vertical
   * field.
   *
   * Bisected rather than solved. The distance appears on both sides — the
   * rostrum rises with it — and a closed form for that is a quadratic with a
   * discriminant nobody would be able to check by reading it, where the
   * predicate below says what it means in one line.
   */
  function lipDistance(depth: number, fovY: number): number {
    const ahead = depth * LIP_PLANE;
    const half = fovY / 2;
    const holds = (d: number): boolean => {
      const eye = wideEye(d);
      const tilt = Math.atan((eye - WIDE_AIM_Y) / d);
      const down = Math.atan((eye + LIP_MARGIN) / Math.max(d - ahead, 0.1));
      return down - tilt <= half;
    };

    // Nothing nearer than the lip itself is a camera position, and nothing
    // further than the back wall is one either. If the wall is not far enough,
    // say so by asking for more than there is: the lens is what gives next.
    const near = ahead + 0.6;
    const far = maxDistance();
    if (!holds(far)) return far + 1;
    if (holds(near)) return near;

    let lo = near;
    let hi = far;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      if (holds(mid)) hi = mid; else lo = mid;
    }
    return hi;
  }

  /**
   * How far back the camera may stand before it is outside the building.
   *
   * Derived from the house rather than guessed: the audience occupies roughly a
   * metre per row, and the back wall is a little behind the last one.
   */
  function maxDistance(): number {
    const rows = venue?.audience.rows ?? 6;
    const depth = venue?.depth ?? 6;
    return depth * 0.5 + rows * 0.95 + 2.5;
  }

  /**
   * Where a framing puts the camera relative to its subject.
   *
   * The *angles* are a small fixed table and stay that way — a director that
   * solves for an optimal angle produces a different one every time and the
   * show stops having a visual grammar. Only the distance is computed, because
   * "fit this much in frame" is arithmetic, not taste.
   */
  function place(shot: Shot, t: number): void {
    const width = venue?.width ?? 10;
    const depth = venue?.depth ?? 6;
    subjectPoint(shot.subject, wantedFocus);
    const push = shot.push * t;

    switch (shot.framing) {
      case 'wide': {
        // The whole band and the room it is in, plus headroom for the fly bar.
        wantedFocus.set(0, WIDE_AIM_Y, -depth * 0.25);
        /**
         * Three things to hold, and the shot stands wherever the furthest of
         * them says. The boards at the plane the shot is aimed at, the front
         * row's width at the plane it actually stands on, and the lip of the
         * stage under it. Which one binds depends entirely on the window: a
         * tall one is short of horizontal field and the first wins, a wide one
         * has field to spare and the third does.
         *
         * That third one is what stops a wide monitor from zooming in past the
         * front of the stage, and it is a *derived* limit rather than a floor
         * somebody picked: on any aspect from 16:9 upwards it settles this
         * room's wide shot at about ten metres, which is where a camera has to
         * be for the stage to have an edge.
         */
        const solved = solveDistance((fovY) => Math.max(
          fitRect(width * 0.98, 3.4, fovY),
          frontEdgeDistance(width, depth, fovY),
          lipDistance(depth, fovY),
        ));
        /**
         * Solve for where the push *ends*, and start a push behind it.
         *
         * A wide shot leans in half a metre over its length, and half a metre
         * is a fifth of the margin the lip is holding on to. Framing the shot
         * at its first frame therefore buys nothing: the stage would have an
         * edge on the downbeat and lose it again by the end of the section,
         * which is the same bug arriving slowly. The house wall still has the
         * last word — in a room too shallow to back up into, the push simply
         * spends what room there is.
         */
        const d = Math.min(solved + shot.push, maxDistance()) - push;
        wanted.set(0, wideEye(d), wantedFocus.z + d);
        break;
      }
      case 'close': {
        /**
         * Waist up on one player: about 1.7 m of subject.
         *
         * A chest-up frame was too tight on anyone the rig does not hold
         * perfectly still. The aim point is a sternum, and a sternum moves —
         * a singer leans, a guitarist rocks back — so a frame with 1.1 m in it
         * spends half the solo on a chin or an elbow. Hold the player instead
         * of the player's shirt and the same movement stays inside the frame.
         *
         * The push is solved for like the wide shot's: this is where the shot
         * *ends*, and it starts that much further back. Framing the first
         * frame instead would just move the crop to the last one — and the
         * solo push is the longest in the show at 0.8 m, which is a third of
         * this distance.
         */
        const d = distanceFor(1.9, 1.7) + shot.push - push;
        wanted.set(wantedFocus.x * 0.55, wantedFocus.y + 0.12, wantedFocus.z + d);
        break;
      }
      case 'low': {
        /**
         * Low *relative to the player*, not to the floor.
         *
         * An absolute height here put the lens at 0.85 m — below the top of a
         * drum riser — so the shot that exists to show the kit was a study of
         * the riser's front panel with the kit floating above it. Anything on a
         * platform breaks a fixed camera height, and the drummer, who is the
         * whole point of this framing, is the one player who is always on one.
         *
         * Half a metre under the sternum is still a looking-up angle and still
         * reads as a low shot; it just does it from a height that can see the
         * subject.
         */
        /**
         * Framed on the *kit*, not on the player.
         *
         * The subject point is a person's sternum, which is the right thing to
         * aim at for every other shot and the wrong thing here: a kit is wide,
         * low and in front of its player, so a person-sized frame around a
         * sternum crops the drummer's head off the top and fills the rest with
         * bass drum. Drop the aim toward the drums and open the frame enough to
         * hold the player behind them.
         */
        wantedFocus.y -= 0.15;
        const d = distanceFor(4.6, 3.6) - push;
        wanted.set(wantedFocus.x * 0.6 + 1.4, wantedFocus.y + 0.1, wantedFocus.z + d);
        break;
      }
      case 'front': {
        // Across the front line at head height.
        const d = distanceFor(width * 0.55, 2.0) - push;
        wanted.set(wantedFocus.x * 0.3, 1.6, wantedFocus.z + d);
        break;
      }
    }

    // Never end up behind the audience, and never inside the band.
    wanted.z = Math.max(wanted.z, wantedFocus.z + 1.6);
    /**
     * And never through a surface of the room.
     *
     * `wideEye` already keeps the wide shot under the lid, which is where the
     * problem was; this is the same rule applied to the other three framings so
     * that the one place the height is decided is not three places. They are all
     * well clear of it today — `front` is fixed at 1.6 m and the rest track a
     * player's sternum — so this changes no shot that currently exists, which
     * is exactly what a guard rail should do the day it is installed.
     */
    wanted.y = Math.max(Math.min(wanted.y, ceiling()), floorAt(wanted.z));
    clearCrowd(wanted);
  }

  /**
   * Hand the camera over, starting from wherever it already is.
   *
   * The angle used to begin at zero, which is a defensible answer for a drag —
   * a drag is a request to move, and it moves from the front — and no answer at
   * all for a wheel. Zoom is a request to change *one* thing, and a notch that
   * also swung the lens round to head-on before it moved in is a zoom that
   * threw the shot away to do it. So the take is seeded from the shot's own
   * direction, and the first gesture of either kind starts from the picture
   * that was on screen.
   *
   * A drag inherits that and is better for it: the tail of a wide shot from
   * stage left now turns from stage left rather than sliding to centre first.
   * The cut still resets everything — see `update`.
   */
  function take(): void {
    if (viewerHas) return;
    viewerHas = true;
    range = 1;
    ray.copy(wanted).sub(wantedFocus);
    const r = ray.length();
    // Before the first frame there is no shot to inherit, and a zero-length
    // direction has no angles in it. Head-on is the honest default there.
    if (r < 1e-3) { yaw = 0; pitch = 0; return; }
    ray.divideScalar(r);
    yaw = Math.atan2(ray.x, ray.z);
    pitch = Math.max(-0.5, Math.min(1.0, Math.asin(Math.max(-1, Math.min(1, ray.y)))));
  }

  return {
    camera,

    room(m) {
      metrics = m;
    },

    begin(song, cast, solos, v, seed) {
      venue = v;
      plan = planShots(song, cast, solos, seed, reducedMotion);
      index = -1;
      held = 0;
      viewerHas = false;
      yaw = 0;
      pitch = 0;
      range = 1;
      lens = 1;

      /**
       * Take up the opening position *now*, not on the first frame with a clock.
       *
       * The runner stopped driving the director while the transport is silent —
       * correctly, because a stopped clock honestly reports beat 0 and the
       * director read that as a position and reversed the camera two hundred
       * metres. But the curtain opens *before* the first downbeat, and a camera
       * that has never been placed is still at the origin: standing on the
       * boards, inside the band, looking at the back of the curtain. The reveal
       * is the one shot in the show that cannot be got wrong.
       */
      if (plan.length) {
        place(plan[0]!, 0);
        eye.copy(wanted);
        focus.copy(wantedFocus);
        camera.position.copy(eye);
        camera.lookAt(focus);
      }
    },

    setSubjects(next) {
      subjects.clear();
      for (const [id, obj] of next) subjects.set(id, obj);
    },

    update(beat, dt) {
      // Advance to the last shot whose cut has passed. A loop rather than a
      // single step so that a dropped frame or a seek cannot leave the camera
      // one shot behind for the rest of the number.
      //
      // And *back* to the beginning first when the beat has gone backwards,
      // which is the one direction the loop above cannot walk. This was the
      // only system on the stage that could not survive a jump: the lighting
      // rig is a pure function of the beat, and the animator re-seeks its own
      // cursors on the same test. Left as it was, a jump back to bar 8 held
      // whatever shot bar 60 was on for the rest of the number — the plan
      // never runs out, so it never recovers.
      let next = plan[index] && plan[index]!.beat > beat ? 0 : index;
      while (next + 1 < plan.length && plan[next + 1]!.beat <= beat) next++;
      /**
       * The cut is also the handback, and it travels the way every other change
       * of shot travels.
       *
       * This was briefly a hard snap, on the argument that a drag can leave the
       * lens anywhere in the building and a second spent crossing the room to
       * get back is the flight this file refuses. The argument is about the
       * *plan* and this is not the plan: a viewer who has moved the camera is
       * already off the shot list, and dumping them back on it in one frame
       * reads as the picture breaking rather than as a cut. It also made the
       * handback the only movement in the show that does not ease, which is
       * what it looked like. So it eases — same `k`, same curve as the push and
       * as every shot change — and the return is something the eye can follow
       * back to where the director was.
       */
      if (next !== index) {
        index = next;
        held = 0;
        // And the angle goes back to neutral with the camera. Leaving it where
        // the drag left it means the next nudge of the mouse teleports the lens
        // back to a position the viewer abandoned two shots ago.
        viewerHas = false;
        yaw = 0;
        pitch = 0;
        range = 1;
      }

      const shot = plan[Math.max(index, 0)];
      if (!shot) return;

      const shotEnd = plan[index + 1]?.beat ?? beat + 16;
      const span = Math.max(shotEnd - shot.beat, 1);
      held = Math.min((beat - shot.beat) / span, 1);
      place(shot, held);

      let squeeze = 1;
      if (viewerHas) {
        // Viewer has the camera. Orbit the *current* focus so the handback does
        // not snap somewhere unrelated.
        const r = wanted.distanceTo(wantedFocus);
        ray.set(
          Math.sin(yaw) * Math.cos(pitch),
          Math.sin(pitch),
          Math.cos(yaw) * Math.cos(pitch),
        );
        /**
         * The angle is the viewer's and the distance is the room's.
         *
         * Nothing here clamps where the drag may point — round the back, over
         * the top of the band, in among the tables, all of it is a place a
         * person could stand and all of it is now reachable. What the room owns
         * is how far along that line the lens ends up: the shot's own framing
         * distance where the building has that much to give, and the last point
         * inside the walls where it does not.
         *
         * `ORBIT_MIN` wins over both, so a stage with a metre behind the band
         * puts you a metre behind the band rather than inside the drummer. It
         * can push back through a surface in a room that tight, which is why
         * the height is clamped again below — a lens through a side wall shows
         * you the room from outside for a moment, and a lens through the lid
         * shows you the plumbing.
         *
         * The dolly sits between the two: the viewer's `range` says what
         * multiple of the shot's distance to ask for, and the room answers the
         * same way it answers the angle. `r` is re-solved from the director's
         * framing every frame rather than accumulated, so a zoom held across a
         * push stays a third of the way in as the push moves, and the handback
         * at the cut has nothing to unwind.
         */
        const want = Math.max(ORBIT_MIN, r * range);
        const d = Math.max(ORBIT_MIN, Math.min(want, reach(wantedFocus, ray, want)));
        wanted.copy(ray).multiplyScalar(d).add(wantedFocus);
        wanted.y = Math.max(Math.min(wanted.y, ceiling()), floorAt(wanted.z));
        /**
         * How much of the distance it asked for the room took. The lens gives
         * it back below.
         *
         * Measured against what the *viewer* wanted rather than against the
         * framing, which is the whole difference between a zoom and a shrug: a
         * dolly the room can afford is answered by the camera moving and the
         * lens staying where it was, so the picture actually gets closer.
         * Compensating back to the framing distance would open the lens by
         * exactly the ratio the camera had just moved in by, and the two would
         * cancel to no zoom at all.
         *
         * Backing out in a room with no more room behind you is the one that
         * still opens the lens, and that is right — a wider lens is what a
         * camera with its back to the wall has left to give.
         *
         * The crowd is deliberately not fenced off in here, unlike in `place`.
         * Somebody who has dragged the camera down into the seats has asked to
         * be in the seats, and a head in the near foreground is a photograph of
         * a concert rather than a fault.
         */
        squeeze = Math.max(1, want / d);
      }

      /**
       * Cuts are instant, pushes are smoothed.
       *
       * `held === 0` is the frame a cut lands on, and it must snap — easing
       * into a new shot is a fly, and flying is the thing this director exists
       * not to do. Everything after that frame is a slow lerp, which is what
       * makes the push read as a camera operator leaning in rather than as a
       * dolly on rails.
       */
      const k = held === 0 ? 1 : Math.min(dt * 2.5, 1);
      eye.lerp(wanted, k);
      focus.lerp(wantedFocus, k);
      camera.position.copy(eye);
      camera.lookAt(focus);

      /**
       * And the lens follows the walk in, on the same easing as the walk.
       *
       * A drag that ends up at a third of its framing distance is holding a
       * third of what it was framing, and a third of a wide shot from behind a
       * band on a shallow stage is a shirt. So the field of view opens by the
       * ratio the radius lost, and `MAX_FOV` stops it where the perspective
       * starts to bow.
       *
       * Eased rather than applied, and eased *out here* rather than inside the
       * orbit branch, because the two have to move together: at the handback
       * the position starts easing back toward the director's shot, and a lens
       * that snapped back on the same frame would be a zoom the drag never
       * asked for. Same `k`, so the walk out and the lens close on the same
       * curve they opened on. `place` re-solves the framing from `BASE_FOV`
       * every frame, so this multiplies a fresh number rather than compounding
       * its own.
       */
      lens += (squeeze - lens) * k;
      const deg = lens < 1.005 ? camera.fov : Math.min(
        MAX_FOV, (2 * Math.atan(Math.tan((camera.fov * Math.PI) / 360) * lens) * 180) / Math.PI,
      );
      if (Math.abs(camera.fov - deg) > 0.01) {
        camera.fov = deg;
        camera.updateProjectionMatrix();
      }
    },

    orbit(dx, dy) {
      take();
      // Yaw runs free and wraps: there is nowhere round the circle the camera
      // may not point, only distances the room will not lend it. Pitch is
      // bounded because it is not a circle — over the top and under the floor
      // are the same picture upside down — and the room takes the rest of it in
      // `update`, by pulling the lens in rather than by refusing the angle.
      yaw = (yaw - dx * 0.005) % (Math.PI * 2);
      pitch = Math.max(-0.5, Math.min(1.0, pitch + dy * 0.004));
    },

    zoom(factor) {
      take();
      // Multiplied rather than added, so a notch is the same proportion of the
      // picture wherever it is spent, and the bounds hold at both ends however
      // far past them the gesture keeps going.
      range = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, range * factor));
    },

    shots: () => plan,
  };
}

// ---------------------------------------------------------------------------

/**
 * Turn the form into a shot list.
 *
 * The whole director is really this function; everything above is a lerp. It
 * reads the same section list the lighting score reads, and for the same
 * reason — the music already said where the interesting moments are, and
 * inventing a second opinion about it would only produce a picture that
 * disagrees with the sound.
 */
function planShots(
  song: Song, cast: Cast, solos: SoloSpot[], seed: string, reducedMotion: boolean,
): Shot[] {
  const rng = new Rng(`${seed}:camera`);
  const { beatsPerBar } = song.meta;
  const shots: Shot[] = [];
  const push = reducedMotion ? 0 : 0.5;

  const soloAt = new Map<number, SoloSpot>();
  for (const s of solos) soloAt.set(s.sectionIndex, s);

  const drummer = cast.performers.find((p) => p.layer === 'drums');
  const lead = cast.leadPerformerId;
  const leadLayer = cast.performers.find((p) => p.id === lead)?.layer;

  for (let i = 0; i < song.sections.length; i++) {
    const section = song.sections[i]!;
    const at = section.startBar * beatsPerBar;
    const solo = soloAt.get(i);

    if (solo) {
      /**
       * A solo is the one moment the show has a subject, and the camera should
       * agree with the follow spot rather than second-guess it. Trading fours
       * is the exception worth special-casing: the picture alternating with the
       * band is most of what makes the device legible to someone who does not
       * know what trading fours is.
       *
       * `backing: 'trade'` on its own is not that, and the drummer test is what
       * separates them — the same test `concert/lighting.ts` makes at the spot,
       * for the same reason. A drum chorus is written as `trade` with every
       * block belonging to the drummer, so alternating on the name alone cut
       * every four bars between the drummer and the drummer: the right person
       * in the frame, and the framing snapping between `low` and `close` for a
       * whole chorus for no reason anyone watching could have named.
       */
      if (solo.backing === 'trade' && drummer && drummer.id !== solo.performerId) {
        const bars = section.lengthBars;
        for (let b = 0; b < bars; b += 4) {
          const toDrums = (b / 4) % 2 === 1;
          shots.push({
            beat: at + b * beatsPerBar,
            framing: toDrums ? 'low' : 'close',
            subject: {
              kind: 'performer',
              performerId: toDrums ? drummer.id : solo.performerId,
            },
            push,
          });
        }
      } else {
        shots.push({
          beat: at,
          framing: 'close',
          subject: { kind: 'performer', performerId: solo.performerId },
          push: push * 1.6,
        });
      }
      continue;
    }

    // Everything else: mostly wide, because wide is where the show lives, with
    // a periodic look at whoever has the tune so the wide shot means something
    // when it comes back.
    const isBig = section.kind === 'chorus' || section.transpose > 0;
    const over = at + section.lengthBars * beatsPerBar;
    /**
     * ...as long as they have it *here*.
     *
     * `leadPerformerId` is the front person for the whole number, decided once
     * from the instrumentation, and a bridge is exactly where the tune stops:
     * jazz drops the melody through the middle eight and comes back in for the
     * head out, and an outro is often rhythm section alone. Pushing in on the
     * singer through eight bars they are not singing is the picture equivalent
     * of a spotlight on silence, which `concert/lighting.ts` refuses for the
     * spot and this used to allow for the lens — very nearly one close-up in
     * five, across a hundred and twenty concerts of all three genres.
     *
     * The fallback is the wide shot rather than a substitute soloist. Which of
     * the players still going should inherit the close-up is a second opinion
     * about who the section is about, and this director's whole argument is
     * that it does not form those: a bridge with no tune in it is a band
     * moment, and the wide shot is what a band moment looks like.
     *
     * And it is the *top* of the shot that has to be playing, which is a
     * stricter thing than the shot containing a note somewhere — see
     * `playsFrom`. Asking the looser question left the fault it was written to
     * fix half in place: a melody that rests through a bridge and comes back
     * with a pickup into the next section sounds inside this shot, one beat
     * before the end of it, and the picture is on a still player for the four
     * bars before that.
     *
     * The draw stays where it was. `rng.chance` is spent before the test, so a
     * shot list is either the same as it was or one shot wider — nothing
     * downstream of this section's stream moves.
     */
    const half = Math.floor(section.lengthBars / 2);
    const canCut = section.lengthBars >= MIN_SHOT_BARS * 3 && !!drummer;
    const midCut = at + half * beatsPerBar;
    const closeUp = !isBig && lead && rng.chance(0.35)
      && leadLayer !== undefined
      && playsFrom(song, leadLayer, at, canCut ? midCut : over, beatsPerBar);
    shots.push(closeUp
      ? { beat: at, framing: 'front', subject: { kind: 'performer', performerId: lead }, push }
      : { beat: at, framing: 'wide', subject: { kind: 'stage' }, push });

    /**
     * Long sections get one cut in the middle. Without it an eight-bar wide
     * shot at 60 BPM is thirty-two seconds of one picture, which is a still
     * photograph with sound.
     *
     * Only where the kit is actually going *as this lands*. A drummer exists
     * as soon as the number contains one drum event anywhere, so "there is a
     * drummer" says nothing about whether they are playing in bar nine — and a
     * low, close shot up at a motionless kit is the most conspicuous still
     * frame the stage can produce.
     *
     * Anywhere in the half is not the same question, and the difference is the
     * fault: a kit that lays out over a quiet second half and comes back with a
     * fill into the next chorus has a drum event in this window, at the far end
     * of it, and the shot was eight bars of a drummer sitting still followed by
     * one bar of playing. `playsFrom` asks the question the picture cares
     * about.
     */
    if (canCut && rng.chance(0.5) && playsFrom(song, 'drums', midCut, over, beatsPerBar)) {
      shots.push({
        beat: midCut,
        framing: 'low',
        subject: { kind: 'performer', performerId: drummer.id },
        push,
      });
    }
  }

  // A number always opens and closes wide. The first shot has to establish who
  // is on stage before it is allowed to look at anyone in particular.
  if (shots.length) shots[0] = { ...shots[0]!, framing: 'wide', subject: { kind: 'stage' } };

  return shots.sort((a, b) => a.beat - b.beat);
}

/**
 * Whether a layer has a note in `[from, to)`.
 *
 * The one thing a close-up has to be right about, and `Section.activeLayers` is
 * nearly the answer without being it: a layer can be listed for a section and
 * still rest through the half of it a shot actually covers, which is precisely
 * where the mid-section cut lands. The notes are the only source that cannot be
 * stale, and they are right here.
 */
function soundsIn(song: Song, layer: LayerId, from: number, to: number): boolean {
  if (layer === 'drums') return song.drums.events.some((e) => e.beat >= from && e.beat < to);
  return song.tracks.some((t) => t.layer === layer
    && t.notes.some((n) => n.beat >= from && n.beat < to));
}

/**
 * Whether a layer is playing *when the camera arrives*.
 *
 * The test every shot that names a player is gated on, and the one `soundsIn`
 * on its own gets wrong. A gallery does not cut to a player because they will
 * eventually do something in the next sixteen bars; it cuts to a player who is
 * going now, because a cut is an assertion that this is where the music is. Ask
 * only whether the window contains a note and the two worst cases pass it — a
 * horn that comes back with a pickup on the last beat of the shot, and a kit
 * that lays out and returns with a fill into the next chorus. Both put the lens
 * on somebody sitting still for the whole shot and then cut away as they start,
 * which is the exact opposite of the shot that was wanted, and both were
 * happening: about one shot in twenty across the four genres, and the drum
 * version is the most visible of all because the low shot fills the frame with
 * hands that are not moving.
 *
 * Two bars, not one. A bar is short enough that a snare answering on beat 3 of
 * bar two reads as a late entry rather than as silence, and long enough that
 * nothing musical needs a third — a player who has not moved in two bars is not
 * about to be the subject of anything.
 *
 * The whole rest of the shot is deliberately not tested. A soloist who finishes
 * their phrase two bars before the cut is a phrase ending, which is a normal
 * shape for music and a good one to be watching; the shot is about who is
 * playing, and by then they have played.
 */
function playsFrom(
  song: Song, layer: LayerId, from: number, to: number, beatsPerBar: number,
): boolean {
  return soundsIn(song, layer, from, Math.min(to, from + ENTRY_BARS * beatsPerBar));
}
