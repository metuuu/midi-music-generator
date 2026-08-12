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
 * ## How far it bulges is the garment's business too
 *
 * The bulge has a second bound, and it comes from the clothes. Near full
 * extension the knee moves as the *square root* of the hip's drop — so the
 * groove's 2 cm bob, which is barely visible on the body, swings a knee nine
 * centimetres forward, and a floor-length skirt is thirteen deep. Every robed
 * player in the catalogue punched a knee out through the front of their own hem
 * once a beat, and no still frame of anybody standing showed it.
 *
 * A wider skirt is not the answer — see `clearFor` in `performer-garments.ts`,
 * where cloth is already squeezed between the legs and the instrument — so the
 * cloth bounds the knee instead, which is what cloth does to a knee. The leg
 * gives up about a centimetre of length to do it, on top of the percent it was
 * already allowed to stretch, and the trade is the right way round: a leg 1.5 %
 * short is invisible and a knee outside a robe is not. `roomFor` is the bound
 * and `skirtSpan` is where it comes from.
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
 * A seated player in a skirted garment pays for up to five more — see `lap` —
 * and nobody else pays anything for them: a standing player, and anybody in a
 * suit, builds not one.
 *
 * Every geometry and material is leased from the shared pool, so six players
 * cost one cylinder and one sphere between them.
 */

import { Mesh, Object3D, Vector3 } from 'three';

import type { Look } from '../../concert/types.js';

import { Leases, bead, tube } from './performer-assets.js';
import { legsOf, skirtSpan, type SkirtSpan } from './performer-garments.js';
import {
  LEG_SOCKET_X, SIDE, fitLimb, legRadii, type BodySide, type Proportions,
} from './performer-look.js';

// Scratch. `update` runs per leg per performer per frame.
const A = new Vector3();
const B = new Vector3();
const K = new Vector3();
const D = new Vector3();
const BEND = new Vector3();
const AXIS = new Vector3();
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

/**
 * How far a knee may leave the hip→ankle line before it leaves the cloth.
 *
 * The whole of the fix for the fault `skirtSpan` describes, and it is worth
 * being exact rather than clamping each axis on its own. The knee that broke
 * out was 15 cm to the side and 10 cm forward inside a hem 23 by 13 — outside
 * the ellipse by a corner, and inside both of its axes taken separately, so a
 * pair of box limits would have reported it contained.
 *
 * So it is solved: the knee travels `mid + bend · t`, the cloth is an ellipse
 * shrunk by the knee's own radius, and the largest `t` still inside it is the
 * positive root of a quadratic. `bend` is a unit vector but not usually a
 * lateral one — the leg axis has been taken out of it — so `a` is the length of
 * what is left in the plane, and a bend with nothing left in the plane is a knee
 * travelling straight up its own leg, which no ellipse can bound.
 *
 * A negative discriminant means the knee is *already* out of the cloth with no
 * bulge at all, which the sway can do on a slight body at the top of a swing.
 * Zero is the answer then: not a fix, but the straightest leg available, and the
 * frame after is back inside.
 */
function roomFor(
  mid: Vector3, bend: Vector3, axis: Vector3, span: SkirtSpan, kneeR: number,
): number {
  const aw = Math.max(1e-3, span.halfW - kneeR);
  const ad = Math.max(1e-3, span.halfD - kneeR);
  const u = (mid.x - axis.x) / aw;
  const w = (mid.z - axis.z) / ad;
  const du = bend.x / aw;
  const dw = bend.z / ad;
  const a = du * du + dw * dw;
  if (a < 1e-9) return Infinity;
  const b = 2 * (u * du + w * dw);
  const c = u * u + w * w - 1;
  const disc = b * b - 4 * a * c;
  if (disc <= 0) return 0;
  return Math.max(0, (-b + Math.sqrt(disc)) / (2 * a));
}

export function buildLegs(
  root: Object3D, anchors: LegAnchors, p: Proportions, look: Look, l: Leases,
): LegsRig {
  // `p.seated` rather than `p.seatY > 0`: a cross-legged player's seat is the
  // boards, so their seat height is honestly zero and the old test called them a
  // standing body. See `Proportions.seatY`.
  const seated = p.seated;

  /**
   * Trousers, or the garment continuing. Asked rather than assumed.
   *
   * This was `look.outfit.trousers` outright, which was true for as long as
   * there was one silhouette. Under a thobe, a cassock or a sari there are no
   * trousers at all and the leg is the same cloth as the body — so the answer
   * comes from `performer-garments.ts`, which is also where the skirt that hides
   * most of it is built, three lines from this decision on purpose. Split across
   * two files it would have been a floor-length column of cream linen standing
   * on a pair of charcoal shins, and only from the wings.
   *
   * The legs are still built under a full-length skirt, which is not waste. A
   * standing player's are inside the cloth and a seated player has no skirt at
   * all — `dressGarment` builds none, because one rigid cylinder cannot be worn
   * sitting down — so the legs are the *only* thing under a robe on a bench,
   * and hiding them would leave a pair of shoes out in front of a torso
   * attached to nothing. That is the failure the header of this file exists to
   * argue against, arrived at from the other end. What the seated garment does
   * over them is `lap` below.
   */
  const leg = legsOf(look, l);
  const cloth = leg.material;

  // The three radii, from `performer-look.ts` rather than from here, because
  // the skirt in `performer-garments.ts` has to be wider than they are and a
  // second copy of the formula is a skirt that stops clearing the legs the
  // first time either number moves. See `legRadii`.
  const { thigh: thighR, shin: shinR, knee: kneeR } = legRadii(p, leg.girth);

  /**
   * The column of cloth this player's knees are inside, if there is one.
   *
   * Asked of `performer-garments.ts` for the same reason the leg's colour is —
   * nothing here may decide what a garment is — and used for something the
   * header of this file did not anticipate: a bound on the solve. See
   * `skirtSpan`, which argues it from the cloth's end, and `roomFor`.
   *
   * The knee is what needs bounding rather than the whole leg, and the reason is
   * a ratio. The groove drops the hips a couple of centimetres; a two-link leg
   * at full extension turns that into eight or nine of *knee*, forward, because
   * near full extension the bulge goes as the square root of the drop. So the
   * one joint a garment cannot let move freely is the one that moves four times
   * as far as the body does.
   */
  const column = skirtSpan(look, p);

  /**
   * The hip socket, in the torso's own frame.
   *
   * Pushed forward for a seated player, and that is not cosmetic: a seated
   * thigh leaves the hip going forwards, so a socket on the torso's centre line
   * sends the first fifteen centimetres of it straight through the player's own
   * abdomen — which is invisible from the front and obvious from the wings.
   */
  const socketX = p.torsoW * LEG_SOCKET_X;
  const socket: Record<BodySide, Vector3> = {
    left: new Vector3(SIDE.left * socketX, -p.torsoH * 0.06, seated ? p.torsoD * 0.30 : 0),
    right: new Vector3(SIDE.right * socketX, -p.torsoH * 0.06, seated ? p.torsoD * 0.30 : 0),
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

  interface Leg {
    side: BodySide;
    thigh: Mesh;
    knee: Mesh;
    shin: Mesh;
    /** Where this leg's three joints ended up, kept for the lap to read. */
    at: { hip: Vector3; knee: Vector3; ankle: Vector3 };
  }
  const legs: Leg[] = [];
  const bySide = {} as Record<BodySide, Leg>;

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
    const built: Leg = {
      side, thigh, knee, shin,
      at: { hip: new Vector3(), knee: new Vector3(), ankle: new Vector3() },
    };
    legs.push(built);
    bySide[side] = built;
  }

  /**
   * The garment, gathered over a seated player's legs.
   *
   * Nothing here for anybody on their feet, and nothing for a suit: `LapCloth`
   * says why, and the short version is that a skirt is a rigid cylinder that
   * cannot be worn sitting down, so the cloth has to be put where a sitting body
   * actually holds it. Three pieces, none of which is a skirt:
   *
   *  - a **drape** over each thigh, which is the garment bunched over the one
   *    part of a seated body it rests on;
   *  - a **sheet** sagging in the gap between the two thighs, which is what
   *    makes a lap read as one surface instead of as two padded legs. It is the
   *    only piece that is not a limb, and it is the reason `fitLimb` grew a
   *    depth;
   *  - a **fall** down each shin for a floor-length hem, because a thobe does
   *    not stop at the knee when its wearer sits — it carries on to the boards,
   *    and a seated robe whose cloth ends at the knee is a tunic.
   *
   * All three are fitted from the joints the legs were just fitted to, in the
   * same frame and in the same pass, which is the whole reason they are built
   * in this file rather than with the skirt they replace. A lap solved against
   * the *rest* pose would be a sheet hanging in the air the moment a drummer
   * lifted a knee.
   */
  const lap = seated ? leg.lap : null;
  const drapes = new Map<BodySide, Mesh>();
  const falls = new Map<BodySide, Mesh>();
  let sheet: Mesh | undefined;

  /** How much wider than the leg inside it each piece of cloth is cut. */
  const DRAPE = 1.42;
  const FALL = 1.55;

  if (lap) {
    for (const { side } of legs) {
      const drape = new Mesh(tube(l), lap.material);
      drape.name = `${side}-lap`;
      drape.castShadow = true;
      root.add(drape);
      drapes.set(side, drape);

      // A fall needs somewhere to fall *to*. A cross-legged player's shins are
      // already flat on the boards — `seatY` is honestly 0 there, which is the
      // distinction `Proportions.seatY` exists to draw — so there is no drop
      // below the knee for cloth to make, and a fall built anyway would be a
      // tube laid along the floor through the player's own ankles.
      if (lap.hem !== 'floor' || p.seatY <= 0) continue;
      const fall = new Mesh(tube(l), lap.material);
      fall.name = `${side}-fall`;
      fall.castShadow = true;
      root.add(fall);
      falls.set(side, fall);
    }

    /**
     * Cloth between the knees, and only where there is nothing between them.
     *
     * `splay` is the right question to ask and it is already the answer: it is
     * how far the knees are turned out, and its own note in `Proportions` says
     * what turns them — *what the knees are making room for*. A pianist's are
     * at 0.30 and making room for nothing; a cellist's are at 0.75 with the
     * lower bout between them and a cross-legged sitarist's are at 1.6 with the
     * whole instrument in the gap. Sheeting either of those over would drape a
     * seated player's garment across their own cello.
     *
     * It is also the difference between a lap and a table. At 0.30 the knees
     * come out 48 cm apart on an average body, which is already most of a
     * shoulder width; at 0.75 they are 75 cm, and a sheet that wide is not
     * cloth at any thickness.
     */
    if (p.splay <= 0.4) {
      sheet = new Mesh(tube(l), lap.material);
      sheet.name = 'lap-sheet';
      sheet.castShadow = true;
      root.add(sheet);
    }
  }

  function update(): void {
    const torso = anchors.torso;

    // Where the cloth is, before anything asks whether a knee is inside it. The
    // skirt hangs plumb from a point `hangY` up the torso's own frame, and the
    // torso is swaying — see `SkirtSpan.hangY`. Once per frame rather than once
    // per leg, since both legs are inside the same garment.
    if (column) {
      AXIS.set(0, column.hangY, 0).applyQuaternion(torso.quaternion).add(torso.position);
    }
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
        leg.at.hip.copy(A);
        leg.at.knee.copy(A);
        leg.at.ankle.copy(A);
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
      const slack = Math.sqrt(Math.max(0, half * half - halfSpan * halfSpan));

      // The knee at no bulge: the midpoint of hip→ankle, which is where the
      // clamp below measures from.
      K.copy(A).addScaledVector(D, span * 0.5);
      const bulge =
        column ? Math.min(slack, roomFor(K, BEND, AXIS, column, kneeR)) : slack;
      K.addScaledVector(BEND, bulge);

      fitLimb(leg.thigh, A, K, thighR);
      fitLimb(leg.shin, K, B, shinR);
      leg.knee.position.copy(K);
      leg.at.hip.copy(A);
      leg.at.knee.copy(K);
      leg.at.ankle.copy(B);
    }

    if (!lap) return;

    // The cloth, over the joints the legs were just fitted to. Same frame, same
    // pass, one loop later — see the note on `lap` above.
    for (const leg of legs) {
      fitLimb(drapes.get(leg.side)!, leg.at.hip, leg.at.knee, thighR * DRAPE);
      const fall = falls.get(leg.side);
      if (fall) fitLimb(fall, leg.at.knee, leg.at.ankle, shinR * FALL);
    }

    if (!sheet) return;
    const left = bySide.left;
    const right = bySide.right;
    /**
     * The sag, and it is a sag rather than a plane on purpose.
     *
     * The sheet's ends are the two joint midpoints, lifted by a fraction of the
     * thigh, and it is only 0.80 of a thigh thick — so its top surface sits
     * below the tops of the two legs either side of it. That is the shape:
     * cloth stretched between two knees hangs, and a lap whose middle is level
     * with the top of the legs is a tray. The lift stops it being a trench.
     *
     * Its width is the gap between the knee *centres*, so both of its edges are
     * buried inside the thigh drapes rather than standing out past them. That
     * is what makes this piece unable to be a table however far the knees go —
     * it can only ever fill a gap that already exists.
     */
    const lift = thighR * 0.30;
    A.addVectors(left.at.hip, right.at.hip).multiplyScalar(0.5);
    K.addVectors(left.at.knee, right.at.knee).multiplyScalar(0.5);
    A.y += lift;
    K.y += lift;
    fitLimb(sheet, A, K, Math.abs(left.at.knee.x - right.at.knee.x) * 0.5, thighR * 0.80);
  }

  update();
  return { update };
}
