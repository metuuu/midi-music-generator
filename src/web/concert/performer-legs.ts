/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Legs — the half of the Rayman decision that turned out to be wrong first.
 *
 * *Placed* hands are the right call and the header of `performer.ts` argues it
 * properly: a hand nothing has to solve for can be put exactly where the
 * instrument model says the snare is. Floating *feet* were read as the same
 * decision, and they are not the same decision. A missing forearm is a gap in
 * mid-air and can pass for a stylisation; a missing leg is a gap between a body
 * and the boards it is standing on, and that reads as a bust on a plinth. In the
 * screenshots the drummer was a body and a head sitting on the kit with a pair
 * of shoes parked in front of it.
 *
 * The arm turned out to be worth drawing too — `performer-arms.ts`, built on
 * everything below — but the leg is where the argument was made and won.
 *
 * ## Legs that follow the feet, rather than deciding where they are
 *
 * The feet are already effectors: the animator puts them on pedals, taps them
 * on the pulse, and `restLocals` says where they idle. Nothing here may argue
 * with that, so the legs are strictly downstream — every frame they are re-fitted
 * to wherever the hip and the ankle **actually are**, and they have no opinion
 * of their own. That is the opposite of a skeleton, where the hip drives the
 * knee drives the ankle, and it is why there is no solver here to fight with the
 * one in the animator: there isn't one there either.
 *
 * The knee is the only thing this file invents, and it is invented rather than
 * solved. Two links of fixed length meeting at a knee is a circle intersection,
 * which is four lines — but it is also *numerically nasty near full extension*,
 * where a millimetre of hip sway swings the knee through centimetres, and a
 * standing player is at full extension permanently. So the knee is placed on the
 * bisector at whatever bulge the slack allows, the segments are then stretched
 * to span hip→knee→ankle exactly, and the leg is allowed to be a percent long
 * when the foot is further away than a leg reaches. A leg that stretches 1 % is
 * invisible. A knee that jitters is not, and a gap at the ankle is fatal —
 * spanning by construction means there is no arithmetic that can open one.
 *
 * Which way the knee bulges is the part IK makes hard and anatomy makes easy:
 * knees bend forward. There is no pole target to hint and no per-instrument
 * special case; the bend direction is the body's own forward, splayed outward a
 * little more when the player is sitting, projected off the hip→ankle axis.
 *
 * ## Cost
 *
 * Five meshes per leg would be a thigh, a knee, a shin, an ankle and a hip. It
 * is three: the hip is already inside the trouser mass on the torso and the
 * ankle is already inside the shoe. Cylinders rather than capsules, because a
 * capsule scaled to span a segment stretches its own end caps and a chunky
 * thigh turns into a rugby ball; flat ends are fine when both of them are buried
 * in something. The knee is the one ball that has to be there, since two
 * cylinders meeting at a drummer's hundred degrees show daylight through the
 * outside of the bend.
 *
 * Every geometry and material is leased from the shared pool, so six players
 * cost one cylinder and one sphere between them.
 */

import { Mesh, Object3D, Vector3 } from 'three';

import type { Look } from '../../concert/types.js';

import { Leases, bead, clothSurface, tube } from './performer-assets.js';
import { SIDE, fitLimb, type BodySide, type Proportions } from './performer-look.js';

// Scratch. `update` runs per leg per performer per frame.
const A = new Vector3();
const B = new Vector3();
const K = new Vector3();
const D = new Vector3();
const BEND = new Vector3();
const UP = new Vector3(0, 1, 0);

export interface LegsRig {
  /**
   * Re-fit both legs to the live hip and foot transforms.
   *
   * Call **last** in the frame, after the torso has been posed and after every
   * effector has been committed, because it reads both and writes neither.
   */
  update(): void;
}

/**
 * Where the legs read their two ends from.
 *
 * Both nodes must be direct children of the same parent as the legs — the rig's
 * `root` — because the fit is done in that frame with no matrix work at all. It
 * is stated as a requirement rather than handled, since handling it would mean a
 * `updateWorldMatrix` and an inverse per leg per frame to buy nothing: nothing
 * in the rig has ever reparented a foot.
 */
export interface LegAnchors {
  torso: Object3D;
  feet: Record<BodySide, Object3D>;
}

export function buildLegs(
  root: Object3D, anchors: LegAnchors, p: Proportions, look: Look, l: Leases,
): LegsRig {
  const seated = p.seatY > 0;
  const cloth = clothSurface(l, look.outfit.trousers);

  // A cartoon leg is thicker than a real one and tapers hard. Build widens the
  // thigh twice as much as the shin, which is where build actually shows.
  const thighR = p.height * (0.043 + 0.012 * p.build);
  const shinR = p.height * (0.032 + 0.006 * p.build);
  const kneeR = thighR * 1.04;

  /**
   * The hip socket, in the torso's own frame.
   *
   * Pushed forward for a seated player, and that is not cosmetic: a seated
   * thigh leaves the hip going forwards, so a socket on the torso's centre line
   * sends the first fifteen centimetres of it straight through the player's own
   * abdomen — which is invisible from the front and obvious from the wings.
   */
  const socket: Record<BodySide, Vector3> = {
    left: new Vector3(SIDE.left * p.torsoW * 0.30, -p.torsoH * 0.06, seated ? p.torsoD * 0.30 : 0),
    right: new Vector3(SIDE.right * p.torsoW * 0.30, -p.torsoH * 0.06, seated ? p.torsoD * 0.30 : 0),
  };

  /** The ankle, in the foot's own frame: up into the shoe and a little back. */
  const ankle = new Vector3(0, p.footH * 0.34, -p.footL * 0.03);

  /**
   * How long the leg wants to be: socket to ankle with the player standing.
   *
   * From the *standing* layout rather than from this posture, so one person has
   * one pair of legs whatever they are sitting on — `hipY` moves with the
   * posture and the femur does not. And measured between the two points this
   * file actually uses rather than between the hip height and the boards: the
   * first version took the whole 0.875 m from the ground to the hip pivot,
   * which is six centimetres more leg than there is between the socket and the
   * ankle, and six centimetres of slack at full extension is a standing player
   * with a permanent sixteen-centimetre bend in both knees.
   *
   * Taken off `socket` and `ankle` rather than restating their offsets, so
   * moving either of them cannot leave this behind. `height * 0.50` is the
   * standing hip, which is where `proportions()` puts it.
   */
  const reach = (p.height * 0.50 + socket.left.y) - (p.footH * 0.5 + ankle.y);

  /**
   * Knees apart. Two parallel shins read as a doll, and a cellist's have to be
   * further apart than that again — see `Proportions.splay`, which is where the
   * number lives now, because it is a fact about the posture rather than about
   * the fitting done here.
   */
  const splay = p.splay;

  interface Leg { side: BodySide; thigh: Mesh; knee: Mesh; shin: Mesh }
  const legs: Leg[] = [];

  for (const side of ['left', 'right'] as const) {
    const thigh = new Mesh(tube(l), cloth);
    thigh.name = `${side}-thigh`;
    thigh.castShadow = true;
    const knee = new Mesh(bead(l), cloth);
    knee.name = `${side}-knee`;
    knee.scale.setScalar(kneeR * 2);
    const shin = new Mesh(tube(l), cloth);
    shin.name = `${side}-shin`;
    shin.castShadow = true;
    root.add(thigh, knee, shin);
    legs.push({ side, thigh, knee, shin });
  }

  function update(): void {
    const torso = anchors.torso;
    for (const leg of legs) {
      // Both ends, in the root's frame. The torso and the feet are siblings of
      // the legs, so this is a rotate-and-add rather than a matrix chain.
      A.copy(socket[leg.side]).applyQuaternion(torso.quaternion).add(torso.position);
      const foot = anchors.feet[leg.side];
      B.copy(ankle).applyQuaternion(foot.quaternion).add(foot.position);

      D.subVectors(B, A);
      const span = D.length();
      if (!(span > 1e-4)) {
        // A foot inside its own hip. Nothing sensible to draw and nothing that
        // should ever be reached; the guard exists so a bad frame is a squashed
        // leg rather than a NaN that poisons every transform below it.
        fitLimb(leg.thigh, A, A, thighR);
        fitLimb(leg.shin, A, A, shinR);
        leg.knee.position.copy(A);
        continue;
      }
      D.divideScalar(span);

      // The bend: the body's forward, splayed outward, with whatever component
      // lies along the leg removed. Falls back through two axes so there is no
      // input for which this is undefined.
      //
      // The *root's* forward, deliberately, not the torso's. A perching player
      // leans 15° and their knees still bend forward rather than forward-and-
      // down; taking the torso's rotation here made the lean drive the knee,
      // which is the tail wagging the dog.
      BEND.set(SIDE[leg.side] * splay, 0, 1);
      BEND.addScaledVector(D, -BEND.dot(D));
      if (BEND.lengthSq() < 1e-8) {
        BEND.copy(UP).addScaledVector(D, -UP.dot(D));
        if (BEND.lengthSq() < 1e-8) BEND.set(1, 0, 0);
      }
      BEND.normalize();

      // How far the knee can stand off the hip→ankle line. Zero once the foot
      // is a leg's length away, which is a straight leg and is what standing
      // is, so a standing player has no permanent bend to jitter.
      const half = reach * 0.5;
      const halfSpan = Math.min(span, reach * 0.999) * 0.5;
      const bulge = Math.sqrt(Math.max(0, half * half - halfSpan * halfSpan));

      K.copy(A).addScaledVector(D, span * 0.5).addScaledVector(BEND, bulge);

      fitLimb(leg.thigh, A, K, thighR);
      fitLimb(leg.shin, K, B, shinR);
      leg.knee.position.copy(K);
    }
  }

  update();
  return { update };
}
