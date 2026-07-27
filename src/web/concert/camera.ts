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
import type { Song } from '../../core/types.js';
import type { Cast, SoloSpot, Venue } from '../../concert/types.js';

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
  /** Plan the shot list for a number. Call before it starts. */
  begin(song: Song, cast: Cast, solos: SoloSpot[], venue: Venue, seed: string): void;
  /** The objects a shot can point at, keyed by performer id. */
  setSubjects(subjects: Map<string, Object3D>): void;
  /** One call per frame, with the beat from the one clock. */
  update(beat: number, dt: number): void;
  /** Drag to orbit. Hands control to the viewer until they stop. */
  orbit(dx: number, dy: number): void;
  /** The planned list, for verification and for the record. */
  shots(): readonly Shot[];
}

/** Seconds of no input before the director takes the camera back. */
const HANDBACK_SECONDS = 4;

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

export function createDirector(reducedMotion = false): CameraDirector {
  const camera = new PerspectiveCamera(BASE_FOV, 1, 0.1, 120);
  const subjects = new Map<string, Object3D>();

  let plan: Shot[] = [];
  let venue: Venue | undefined;
  let index = -1;
  /** Beats into the current shot, for the push. */
  let held = 0;

  // Viewer control. `orbitFor` counts down; while it is positive the director
  // keeps its hands off.
  let orbitFor = 0;
  let yaw = 0;
  let pitch = 0;

  const eye = new Vector3();
  const focus = new Vector3();
  const wanted = new Vector3();
  const wantedFocus = new Vector3();

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
   */
  function wideEye(d: number): number {
    return 2.3 + Math.min(d * 0.11, 1.3);
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
        // Chest up on one player: about 1.1 m of subject.
        const d = distanceFor(1.3, 1.15) - push;
        wanted.set(wantedFocus.x * 0.55, wantedFocus.y + 0.18, wantedFocus.z + d);
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
  }

  return {
    camera,

    begin(song, cast, solos, v, seed) {
      venue = v;
      plan = planShots(song, cast, solos, seed, reducedMotion);
      index = -1;
      held = 0;
      orbitFor = 0;
      yaw = 0;
      pitch = 0;

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
      if (orbitFor > 0) orbitFor -= dt;

      // Advance to the last shot whose cut has passed. A loop rather than a
      // single step so that a dropped frame or a seek cannot leave the camera
      // one shot behind for the rest of the number.
      let next = index;
      while (next + 1 < plan.length && plan[next + 1]!.beat <= beat) next++;
      if (next !== index) { index = next; held = 0; }

      const shot = plan[Math.max(index, 0)];
      if (!shot) return;

      const shotEnd = plan[index + 1]?.beat ?? beat + 16;
      const span = Math.max(shotEnd - shot.beat, 1);
      held = Math.min((beat - shot.beat) / span, 1);
      place(shot, held);

      if (orbitFor > 0) {
        // Viewer has the camera. Orbit the *current* focus so letting go does
        // not snap somewhere unrelated.
        const r = wanted.distanceTo(wantedFocus);
        wanted.set(
          wantedFocus.x + Math.sin(yaw) * Math.cos(pitch) * r,
          wantedFocus.y + Math.sin(pitch) * r,
          wantedFocus.z + Math.cos(yaw) * Math.cos(pitch) * r,
        );
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
    },

    orbit(dx, dy) {
      orbitFor = HANDBACK_SECONDS;
      yaw -= dx * 0.005;
      pitch = Math.max(-0.35, Math.min(0.9, pitch + dy * 0.004));
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
       */
      if (solo.backing === 'trade' && drummer) {
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
    const closeUp = !isBig && lead && rng.chance(0.35);
    shots.push(closeUp
      ? { beat: at, framing: 'front', subject: { kind: 'performer', performerId: lead }, push }
      : { beat: at, framing: 'wide', subject: { kind: 'stage' }, push });

    /**
     * Long sections get one cut in the middle. Without it an eight-bar wide
     * shot at 60 BPM is thirty-two seconds of one picture, which is a still
     * photograph with sound.
     */
    const half = Math.floor(section.lengthBars / 2);
    if (section.lengthBars >= MIN_SHOT_BARS * 3 && drummer && rng.chance(0.5)) {
      shots.push({
        beat: at + half * beatsPerBar,
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
