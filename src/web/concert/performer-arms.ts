/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Arms — the legs' argument, made at the other end of the body.
 *
 * `performer-legs.ts` establishes the shape of the thing: a limb that is
 * **fitted between two points somebody else decided**, every frame, with no
 * opinion of its own. The feet are effectors and the legs are what is left
 * between the hips and the ankles. This file does exactly that for the hands,
 * and the rule it lives under is the same one: **nothing here may move a hand.**
 *
 * That rule is the whole reason arms can exist at all, because it is what keeps
 * the IK problem the header of `performer.ts` describes from coming back. The
 * hard version of this is a solver asked to find a shoulder-to-hand chain that
 * reaches the snare, and its failure mode is famous: the solution that puts the
 * hand on the drum puts the elbow through the ribs. There is no solver here.
 * The hand is already on the snare — the instrument model said where and the
 * animator put it there — and the elbow is *invented* and then, if it did land
 * in the ribs, pushed out of them. Nothing downstream can disagree, because
 * nothing downstream is asked.
 *
 * ## Where the elbow goes: it hangs off the arm, and never sideways
 *
 * The knee has anatomy to lean on — knees bend forward, there is no pole target
 * to hint — and an elbow does not, quite. What an elbow does is *hang*, and the
 * useful part of that turns out to be the second half: an elbow hangs **in the
 * plane of the arm**, below it and behind it, and it does not swing out to the
 * side and it never crosses the body.
 *
 * So the bend direction is the shoulder→wrist line crossed with the body's own
 * lateral axis: perpendicular to the arm by construction, with no sideways
 * component in it at all. Two of those, opposite one another, and the sign is
 * the whole of the anatomy — take the one that hangs. It covers cases that look
 * nothing alike with no special pleading:
 *
 *  - **A hand resting by the hip.** The arm is nearly vertical, both candidates
 *    are nearly level, and the tie-break sends the elbow *behind* the arm, which
 *    is where an arm hangs.
 *  - **A hand out on a key bed.** The elbow drops under the forearm and a little
 *    back, which is where a pianist's is.
 *  - **A hand cupped at the mouth.** The arm is folded double and the elbow
 *    drops under it and *forward*, in front of the chest — where a harmonica
 *    player's is, and not out at the side of their head.
 *
 * Then a lean outward, so the pair reads as two arms rather than one in front of
 * another, and so the elbows clear the ribs. That is a separate term and it is
 * added last precisely because it must never be able to carry an elbow across
 * the mid-line.
 *
 * The size of the bulge is not a choice at all. Two links of known length whose
 * ends are a known distance apart put the elbow on a circle, and the radius of
 * that circle is arithmetic; only which way round it is free. So this file picks
 * the direction and takes the distance, exactly as the legs do, and stretches
 * the segments to span when the hand is further away than an arm reaches.
 *
 * ## The exception: hands with technique
 *
 * A hanging elbow is right until the instrument says otherwise. A pianist's
 * forearm is level with the back of their hand, an accordionist's runs straight
 * in behind the bass strap, and a bow arm keeps a straight wrist because a bent
 * one cannot draw a straight bow — in each case the hand is saying something
 * about where the arm behind it has to be.
 *
 * The hand says how much of that it insists on: `HandPose.align`, a pose field
 * for the same reason `touch` and `tool` are, since it is a fact about the shape
 * the hand is in rather than about the instrument in front of it.
 *
 * **What it buys is a direction to bend in, never a place to put the elbow.**
 * That distinction is the whole of the second draft of this file. A straight
 * wrist implies an elbow a forearm back along the hand's own axis, and putting
 * the elbow *there* ignores the two links: on a cello, where the bow arm is
 * already at 95 % of its stretch reaching down to the frog, it pulled the elbow
 * off the line and out in front, so the upper arm pointed forwards and the
 * forearm hung vertically out of it — a broken wrist drawn by the mechanism
 * whose entire job is to prevent one. Blended as a *direction*, the same demand
 * turns the arm's bend toward the technique and cannot move the elbow off the
 * circle the link lengths put it on. Where the arm is folded there is a lot of
 * bend to aim and technique gets most of what it asked for; where it is
 * stretched there is none, and the wrist breaks instead — which is what a real
 * player's does when the instrument is out at arm's length.
 *
 * One further check before the demand is granted at all: the hand has to be
 * facing a way an arm could come from (`REACH_MIN`). Several instrument models
 * pin the roll the other way round, and on those the aim points into the room.
 *
 * **And it only applies while the hand is working.** Technique is something a
 * player does to an instrument, not a posture they hold all evening: a violinist
 * standing at ease does not keep a straight bow wrist, and one whose elbow stayed
 * cocked through the applause would read as a mannequin with a bow. So the
 * discipline is scaled by whether the hand is being *placed* on anything this
 * frame, eased in quickly and out slowly, because a hand between two notes has
 * not stopped playing and an elbow that flapped between them would be worse than
 * no elbow at all.
 *
 * ## What this buys back upstream
 *
 * `Rig.followForearm` has always broken the wrist toward where the arm *would*
 * be, and it had to guess, because the only end of the arm it knew was the
 * shoulder. It reads this elbow now. The wrist break and the elbow are one
 * statement made at both ends instead of two systems with different ideas about
 * where the forearm is — and an arm bent the way a pose asked for leaves less
 * for the wrist to make up, which is the same fact seen from the other end and
 * needs no special case to be true.
 *
 * ## Cost
 *
 * Four meshes an arm: a shoulder, an upper, an elbow, a forearm. The shoulder is
 * a child of the torso and never moves again — it is there because a lathed
 * torso tapers over the shoulder line and the top of an upper arm would show a
 * flat cap through it — and the other three are re-fitted per frame. Cylinders
 * rather than capsules for the same reason as the legs: a capsule scaled to span
 * a segment stretches its own end caps, and both ends here are buried in a ball
 * anyway. Every geometry and material is leased, so six players share one
 * cylinder and one sphere.
 */

import { Mesh, Object3D, Quaternion, Vector3 } from 'three';

import type { Look } from '../../concert/types.js';

import { Leases, bead, clothSurface, tube } from './performer-assets.js';
import type { HandRig } from './performer-hands.js';
import { SIDE, fitLimb, type BodySide, type Proportions } from './performer-look.js';

// Scratch. `update` runs per arm per performer per frame.
const A = new Vector3();
const B = new Vector3();
const E = new Vector3();
const D = new Vector3();
const FALL = new Vector3();
const BACK = new Vector3();
const OUT = new Vector3();
const AIMED = new Vector3();
const BLEND = new Vector3();
const T = new Vector3();
const RIB = new Vector3();
const SAMPLE = new Vector3();
const QI = new Quaternion();

const XAXIS = new Vector3(1, 0, 0);
const SIDES = ['left', 'right'] as const;

/**
 * Upper arm and forearm, as fractions of standing height.
 *
 * A little short of anatomy — a real arm is about 0.186 and 0.146 — and the
 * length is a compromise between the two ends of the show, both of which were
 * measured rather than guessed.
 *
 * Short, because of the idle. `restLocals` parks a standing player's hands a
 * little above the hips and a little forward, which is a pose and a good one,
 * but it is only 0.27 of a height from the shoulder. The elbow of a two-link arm
 * folded into that gap has to stand off the shoulder→wrist line by an amount the
 * arithmetic fixes and nothing else can argue with, and at full length that is
 * most of a hand's width behind the player's own back.
 *
 * Long, because of the reach. A violinist's stopping hand is 0.515 of a height
 * from their shoulder, and an arm shorter than that plays the violin with a limb
 * straight as a pole — no elbow under the instrument at all, which is the one
 * thing everybody knows a violinist's left arm for. Several instruments are
 * further away again: a trombone at seventh position is 0.55 out, because every
 * model here was placed against a player who did not have arms.
 *
 * So: long enough that the violin bends an elbow, short enough that a hanging
 * arm keeps its own elbow inside the player's silhouette. What it costs at the
 * far end is stretch, which is shared between the two links and reads as a long
 * arm rather than a broken one — and the hands are oversized by the same art
 * direction that made them floatable, so from the shoulder to the end of those
 * fingers is more than a real arm anyway.
 */
const UPPER_OF_HEIGHT = 0.173;
const FORE_OF_HEIGHT = 0.141;

/**
 * The two things the fall needs beyond "hang".
 *
 * `BACK` breaks the tie for an arm hanging straight down, where both of the two
 * candidate directions are level and only one of them is behind the arm.
 * `OUT` is the lateral lean added afterwards — the elbow's own width, which the
 * cross product deliberately has none of. See `update`.
 */
const FALL_BACK = 0.45;
const FALL_OUT = 0.35;

/** In fast, out slow. See the header: a hand between two notes is still playing. */
const WORK_RISE = 0.10;
const WORK_FALL = 0.55;

/**
 * How well the hand has to be facing the shoulder before its technique is
 * granted, as the cosine between the hand's own backward axis and the direction
 * the arm is coming from: nothing below `MIN`, all of it at `FULL`.
 *
 * This is the guard that makes `HandPose.align` safe to state as a flat number
 * per shape. A hand's roll about the contact normal is pinned by the instrument
 * model through `Contact.along`, and `along` is a *line* — the fingers are laid
 * out along it, and which of its two ends they point toward is a sign the model
 * picks for its own reasons. Most pick the end that has the wrist nearest the
 * body, which is the only one a real hand can be in; several pick the other,
 * and on those the hand's backward axis points out into the room. Placing an
 * elbow a forearm along *that* is how a violinist ends up with a right elbow out
 * past the scroll and an upper arm three times its own length, which is exactly
 * what the first version of this file drew.
 *
 * Rather than trusting every model, the arm asks whether the straight wrist it
 * is being asked for is one an arm could arrive at, and takes the fall instead
 * where it is not. A hand facing the wrong way for its arm is a hand whose wrist
 * has to break — which is true of a real player too, and is what the wrist break
 * in `followForearm` is for.
 */
const REACH_MIN = 0.05;
const REACH_FULL = 0.50;

/** How much the ribs push an elbow forward rather than sideways. `clearRibs`. */
const RIBS_FRONT = 0.85;

/**
 * Where along the upper arm the body guard starts looking, and how finely.
 *
 * Not at the shoulder: the socket is inside the torso on purpose and the top of
 * the arm is meant to be buried in it. Half way out is past the deltoid and
 * still early enough that a lever arm of 0.5 does not turn a centimetre of
 * shortfall into a metre of correction.
 */
const RIB_FROM = 0.5;
const RIB_STEP = 0.125;

/**
 * How many times the guard is allowed to have another go, and how deep a point
 * is allowed to stay.
 *
 * One pass moves the elbow far enough for whichever point of the arm was
 * deepest, and a point nearer the shoulder moves only its share of that — so
 * the pass that fixes the elbow can leave the middle of the upper arm still
 * inside. Three is enough for everything on this stage; the slack is what stops
 * a fourth from being spent chasing a millimetre.
 */
const RIB_PASSES = 3;
const RIB_SLACK = 0.004;

/**
 * Where the arm starts easing into its own reach rather than hitting it.
 *
 * Below this fraction of the reach the solve is exact; above it the span the
 * elbow is solved for approaches the reach asymptotically. See `update`.
 */
const SOFT_FROM = 0.88;

/**
 * The body an elbow may not be inside, above the chest: how wide the neck and
 * head are against the chest, and how far above the hips the crown is. Both in
 * multiples of hip-to-shoulder, which is the one length the arms already have.
 */
const NECK_OF_TORSO = 0.55;
const CROWN_OF_TORSO = 1.55;

function reachable(agree: number): number {
  const t = (agree - REACH_MIN) / (REACH_FULL - REACH_MIN);
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export interface ArmsRig {
  /**
   * Re-fit both arms to the live torso and hand transforms.
   *
   * Call **last** in the frame, after the torso has been posed, after every
   * effector has been committed and after the hands have taken their shape,
   * because it reads all three and writes none of them.
   */
  update(dt: number): void;
  /**
   * Where this arm's elbow is, in the root's frame.
   *
   * **Live and owned by the rig.** Read it, copy it, never retain or mutate it;
   * the next `update` moves it. A caller reading it before `update` — which
   * `followForearm` deliberately does — gets last frame's elbow, which is 16 ms
   * stale and the only way to close the loop without one of the two ends having
   * to run twice.
   */
  elbow(side: BodySide): Vector3;
}

/**
 * Where the arms read their two ends from.
 *
 * `torso` and every hand's `group` must be direct children of the same parent as
 * the arms — the rig's `root` — because the fit is done in that frame with no
 * matrix work at all. Stated as a requirement rather than handled, exactly as
 * `LegAnchors` states it, since handling it would cost a world-matrix update and
 * an inverse per arm per frame to buy nothing.
 */
export interface ArmAnchors {
  torso: Object3D;
  hands: Record<BodySide, HandRig>;
  /**
   * Whether each hand is being *placed* on something this frame, as opposed to
   * resting or easing home. Read live, every frame; see `HandPose.align` for
   * what it gates.
   */
  working: Record<BodySide, boolean>;
}

export function buildArms(
  root: Object3D, anchors: ArmAnchors, p: Proportions, look: Look, l: Leases,
): ArmsRig {
  const cloth = clothSurface(l, look.outfit.jacket, look.outfit.fabric);

  // Slender, and deliberately: these hands are cartoon-huge, and a forearm
  // scaled to match one would be a leg. A sleeve about two thirds of a palm
  // across is the proportion the big-hands art direction actually implies, and
  // it is thin enough for the hand's own cuff to read as a cuff rather than as
  // the place the arm happens to stop.
  const upperR = p.height * (0.028 + 0.008 * p.build);
  const foreR = p.height * (0.021 + 0.005 * p.build);
  const elbowR = (upperR + foreR) * 0.52;

  const upperL = p.height * UPPER_OF_HEIGHT;
  const foreL = p.height * FORE_OF_HEIGHT;
  const reach = upperL + foreL;

  /**
   * The shoulder joint, in the torso's own frame.
   *
   * Inside the lathe rather than on it — the torso's widest point is `0.5` of
   * its width at `0.87` of its height, and this sits just under and just in from
   * that — so the joint is buried and only the ball of the shoulder stands proud
   * of the jacket. It is the arm's socket *and* the point the whole limb is
   * measured from; there is deliberately no second shoulder anywhere in the rig.
   */
  const socket: Record<BodySide, Vector3> = {
    left: new Vector3(SIDE.left * p.torsoW * 0.42, p.torsoH * 0.88, 0),
    right: new Vector3(SIDE.right * p.torsoW * 0.42, p.torsoH * 0.88, 0),
  };

  // The ribs, as an ellipse in the torso's own frame, fattened by half a sleeve.
  // See `clearRibs`.
  const ribX = p.torsoW * 0.5 + upperR * 0.6;
  const ribZ = p.torsoD * 0.5 + upperR * 0.6;

  interface Arm { side: BodySide; upper: Mesh; joint: Mesh; fore: Mesh; work: number }

  const build = (side: BodySide): Arm => {
    // The deltoid. A child of the torso and never touched again: it is at a
    // fixed point on the body, so it rides a lean and a sway for free.
    const cap = new Mesh(bead(l), cloth);
    cap.name = `${side}-shoulder`;
    cap.scale.setScalar(upperR * 2.2);
    cap.position.copy(socket[side]);
    cap.castShadow = true;
    anchors.torso.add(cap);

    const upper = new Mesh(tube(l), cloth);
    upper.name = `${side}-upper-arm`;
    upper.castShadow = true;
    const joint = new Mesh(bead(l), cloth);
    joint.name = `${side}-elbow`;
    joint.scale.setScalar(elbowR * 2);
    const fore = new Mesh(tube(l), cloth);
    fore.name = `${side}-forearm`;
    fore.castShadow = true;
    root.add(upper, joint, fore);

    return { side, upper, joint, fore, work: 0 };
  };

  const arms: Record<BodySide, Arm> = { left: build('left'), right: build('right') };

  /**
   * How deep into the player a point is, as a fraction of the way to the axis:
   * 0 on the skin or outside it, 1 at the centre. Leaves the point in the
   * torso's frame in `T` and its normalised radial coordinates in `RIB`.
   *
   * The column runs from the hips to the crown, not to the shoulders, and it
   * narrows where the player does. Above the shoulder line the radius tapers to
   * `NECK_OF_TORSO` — a neck and a head are about half the width of a chest —
   * so the same guard that clears a rib clears a chin. Solved in the torso's own
   * frame, so a folded chest carries its own ribs with it rather than being
   * defended by a box left behind at the resting lean.
   */
  const intoBody = (q: Vector3, torso: Object3D): number => {
    T.copy(q).sub(torso.position).applyQuaternion(QI);
    const up = T.y / p.torsoH;
    if (up < -0.10 || up > CROWN_OF_TORSO) return 0;
    const narrow = up <= 0.90 ? 1
      : Math.max(NECK_OF_TORSO, 1 - (up - 0.90) * (1 - NECK_OF_TORSO) / 0.22);
    RIB.set(T.x / (ribX * narrow), narrow, T.z / (ribZ * narrow));
    const r = Math.hypot(RIB.x, RIB.z);
    return r >= 1 ? 0 : 1 - r;
  };

  /**
   * Keep the **whole upper arm** out of the player, and take it out forwards.
   *
   * The failure an IK solver would have handed us for free is an elbow inside
   * the chest, and guarding the elbow alone is not enough — that was the second
   * thing a screenshot found. A guitarist's picking hand sits in front of their
   * own belly at very nearly the arm's full reach, so there is no bend left to
   * place: the elbow is pinned to the shoulder→wrist line, the line runs
   * straight through the ribcage, and the elbow itself comes out the far side
   * perfectly clear of it. The guard passed and the upper arm was a third of the
   * way through the player's chest. Every fretted instrument had it, because
   * every one of them is played with one hand across the front of the body.
   *
   * So the segment is sampled and the elbow is moved for whichever point of it
   * is deepest. Moving the elbow moves a sample at *t* along the arm by `t` of
   * as much, so the elbow has to move by the sample's shortfall over `t` — which
   * is why the sweep starts at `RIB_FROM` rather than at the shoulder. The
   * shoulder is *inside* the body by construction, the top of the upper arm is
   * supposed to be buried in the deltoid, and a guard that included it would
   * divide by nothing and throw the arm across the stage.
   *
   * The push leans forward rather than going straight out from the chest's axis,
   * and that is the other half of it: **an arm that crosses the body crosses in
   * front of it** — always, on every instrument here. Pushed sideways, an arm
   * over the sternum comes out of the player's flank and the forearm doubles
   * back; pushed forwards, it leaves through the shirt front with the rest of
   * the arm in front of the body behind it.
   *
   * The maths is a ray against the ellipse, in the space where the ellipse is a
   * unit circle.
   */
  const clearRibs = (e: Vector3, a: Vector3, torso: Object3D, side: BodySide): void => {
    for (let pass = 0; pass < RIB_PASSES; pass++) if (!pushOnce(e, a, torso, side)) return;
  };

  /** One pass of `clearRibs`. True if it moved the elbow and another is worth it. */
  const pushOnce = (e: Vector3, a: Vector3, torso: Object3D, side: BodySide): boolean => {
    let deep = 0;
    let at = 1;
    let ux = 0;
    let uz = 0;
    let narrow = 1;
    for (let t = RIB_FROM; t <= 1.0001; t += RIB_STEP) {
      SAMPLE.copy(a).lerp(e, t);
      const d = intoBody(SAMPLE, torso);
      if (d > deep) {
        deep = d;
        at = t;
        ux = RIB.x;
        uz = RIB.z;
        narrow = RIB.y;
      }
    }
    if (deep <= RIB_SLACK) return false;

    let dx = ux;
    let dz = uz + RIBS_FRONT;
    let len = Math.hypot(dx, dz);
    if (len < 1e-3) {
      // Dead on the axis the forward lean puts the origin at. Out to this
      // player's own side, which is the answer the fall would have given.
      dx = SIDE[side];
      dz = 0;
      len = 1;
    }
    dx /= len;
    dz /= len;
    // Where the ray leaves the ellipse, in normalised units, and then the same
    // move in metres — divided by `at`, because the elbow is the end of a lever
    // whose other end is pinned in the shoulder.
    const inside = ux * ux + uz * uz;
    const back = ux * dx + uz * dz;
    const s = (-back + Math.sqrt(Math.max(0, back * back + 1 - inside))) / at;
    T.copy(e).sub(torso.position).applyQuaternion(QI);
    T.x += s * dx * ribX * narrow;
    T.z += s * dz * ribZ * narrow;
    e.copy(T).applyQuaternion(torso.quaternion).add(torso.position);
    return true;
  };

  /**
   * Slide the elbow along the arm until the two links are stretched alike.
   *
   * The guard above moves the elbow *away* from the line, and everything it
   * takes comes out of the upper arm: a guitarist's picking elbow, pushed clear
   * of their own belly, ended up with an upper arm 40 % long and a forearm a
   * shade short. One bone doing all of the lying reads as a deformity where two
   * bones sharing it read as an arm held a little further round than it can
   * quite reach — the same trade the over-reach case makes, for the same reason.
   *
   * Where the elbow ends up is decided; how far along the arm it sits is not, and
   * that is the one degree of freedom left to spend. Keeping its distance from
   * the line and sliding it along, the two link lengths are
   * `√(a² + h²)` and `√((span − a)² + h²)`; asking for those to be in the ratio
   * the real bones are in is a quadratic in `a`, and the root that matters is the
   * one that gives `a = upper·span/reach` when the elbow is on the line.
   */
  const rebalance = (e: Vector3, a: Vector3, b: Vector3): void => {
    OUT.subVectors(b, a);
    const span = OUT.length();
    if (span < 1e-4) return;
    OUT.divideScalar(span);
    SAMPLE.subVectors(e, a);
    const along = SAMPLE.dot(OUT);
    SAMPLE.addScaledVector(OUT, -along);
    const h = SAMPLE.length();
    // On the line there is nothing to balance, and the links are already in
    // proportion by construction.
    if (h < 1e-4) return;
    const u2 = upperL * upperL;
    const k = foreL * foreL - u2;
    const solved = Math.abs(k) < 1e-6
      ? span * 0.5
      : (-u2 * span + Math.sqrt(Math.max(0, u2 * span * span * (u2 + k) - k * k * h * h))) / k;
    if (!Number.isFinite(solved)) return;
    // Clamped rather than refused. A bail-out is a step, and a step in where the
    // elbow sits is exactly the flicker this whole pass is chasing out.
    const want = solved < 0 ? 0 : solved > span * 1.5 ? span * 1.5 : solved;
    // `SAMPLE` is still the offset from the line, so the elbow keeps exactly the
    // clearance the guard just bought it and only slides along the arm.
    e.copy(a).addScaledVector(OUT, want).add(SAMPLE);
  };

  function update(dt: number): void {
    const torso = anchors.torso;
    QI.copy(torso.quaternion).invert();

    for (const side of SIDES) {
      const arm = arms[side];
      const hand = anchors.hands[side];
      const node = hand.group;

      // How much technique this arm is entitled to this frame.
      const want = anchors.working[side] ? 1 : 0;
      const tau = want > arm.work ? WORK_RISE : WORK_FALL;
      if (dt > 0) arm.work += (want - arm.work) * (1 - Math.exp(-dt / tau));

      // Both ends, in the root's frame. The torso and the hands are siblings of
      // the arms, so this is a rotate-and-add rather than a matrix chain. The
      // far end is the hand's *cuff* and not its origin — the hand knows where
      // its own wrist is for the shape it is in, wrist break included, exactly
      // as it knows where it touches.
      A.copy(socket[side]).applyQuaternion(torso.quaternion).add(torso.position);
      B.copy(hand.wristPoint).applyQuaternion(node.quaternion).add(node.position);

      D.subVectors(B, A);
      const span = D.length();
      if (!(span > 1e-4)) {
        // A wrist inside its own shoulder. Nothing sensible to draw and nothing
        // that should ever be reached; the guard exists so a bad frame is a
        // squashed arm rather than a NaN that poisons every transform below it.
        fitLimb(arm.upper, A, A, upperR);
        fitLimb(arm.fore, A, A, foreR);
        arm.joint.position.copy(A);
        continue;
      }
      D.divideScalar(span);

      // Which way the elbow falls: **out of the arm's own line, in the plane
      // that has no sideways in it.**
      //
      // The obvious construction is "down and back and out, projected onto the
      // plane the elbow is free to be in", and it is wrong twice. It collapses
      // whenever that one vector happens to lie along the arm, which is a pose
      // rather than a corner case — a harmonica player's hands are up at their
      // mouth, so the line from shoulder to wrist runs up and inward, almost
      // exactly opposite to down-and-back-and-out, and what survived the
      // projection was a rounding error that put both elbows behind the
      // player's own head. And when it does not collapse it still lets the
      // *lateral* part of "down" through, which is how the same player's left
      // elbow ended up across their own sternum: the lowest point on the circle
      // an elbow may sit on is very often on the wrong side of the body.
      //
      // Crossing the arm's line with the body's lateral axis answers both at
      // once. What comes out is perpendicular to the arm by construction and
      // has no sideways component at all, so an elbow can no longer cross the
      // mid-line however folded the arm is, and it is stable however the arm
      // lies: a cross degenerates only for an arm held straight out to the
      // side, where straight down is the answer anyway.
      //
      // Two of those, opposite each other, and the sign is the whole of the
      // anatomy: **take the one that hangs.** Where the arm is folded that is
      // unambiguous and the elbow drops under it, forward, which is where a
      // hand cupped at a mouth puts one. Where the arm hangs, both are level
      // and the tie-break is `FALL_BACK` — an elbow goes behind an arm, never
      // in front of it — which is what makes a standing player's arms read as
      // hanging rather than as held out.
      FALL.crossVectors(XAXIS, D);
      if (FALL.lengthSq() < 1e-8) FALL.set(0, -1, 0);
      FALL.normalize();
      if (FALL.y + FALL.z * FALL_BACK > 0) FALL.negate();
      // And a lean outward, so the elbows clear the ribs and read as a pair
      // rather than as one arm in front of another.
      OUT.set(SIDE[side], 0, 0).addScaledVector(D, -SIDE[side] * D.x);
      if (OUT.lengthSq() > 1e-8) FALL.addScaledVector(OUT.normalize(), FALL_OUT);
      FALL.normalize();

      // And then technique, if this hand has any, is using it, and is in a
      // position to — as a direction to bend in, not as a place to put the
      // elbow. The forearm continues the hand's own axis, local `-z` being the
      // cuff, so the offset of *that* elbow from the line is the way a straight
      // wrist wants the arm to bend, and blending it into the fall turns the
      // whole arm toward the technique while leaving the geometry alone.
      //
      // A place would have been the obvious thing to lerp toward and it is
      // wrong, because the two links are not free to end up anywhere. Obeyed as
      // a position, a bow hold on a cello — where the arm is already at 95 % of
      // its stretch reaching down to the frog — put the elbow off the line and
      // out in front, so the upper arm pointed forwards and the forearm dropped
      // vertically out of it. That reads as a broken wrist, which is precisely
      // the thing `align` exists to prevent. As a direction the same demand
      // does nothing at all there, because an arm at full stretch has no bend
      // left to aim: the elbow is already pinned to the line and the wrist has
      // to break, exactly as a real player's would.
      let align = hand.align * arm.work;
      if (align > 1e-3) {
        BACK.set(0, 0, -1).applyQuaternion(node.quaternion);
        align *= reachable(-BACK.dot(D));
      }
      if (align > 1e-3) {
        AIMED.copy(B).addScaledVector(BACK, foreL).sub(A);
        AIMED.addScaledVector(D, -AIMED.dot(D));
        if (AIMED.lengthSq() > 1e-8) {
          BLEND.copy(FALL).lerp(AIMED.normalize(), align > 1 ? 1 : align);
          // Zero only if the two are exactly opposed at exactly half, in which
          // case the fall stands: a direction that cancels is not an opinion.
          if (BLEND.lengthSq() > 1e-6) FALL.copy(BLEND).normalize();
        }
      }

      // How far along the line the elbow sits and how far off it, from the two
      // link lengths alone. `span` is clamped a hair short of a straight arm, so
      // a hand further away than the arm reaches gets a straight arm and some
      // stretch rather than a square root of a negative number.
      //
      // The stretch is shared out in proportion when it happens, which it does
      // more than it should: a trombone at seventh position and a bass at the
      // dusty end of the neck are both further from the shoulder than any arm
      // goes, because every instrument here was placed against a player who did
      // not have one. An arm 30 % long reads as a long arm. An arm of the right
      // length with a forearm 90 % long reads as a broken one, and that is what
      // leaving the elbow at its unstretched distance would draw.
      // `d` is the span the elbow is solved *for*, and it approaches the arm's
      // own reach without ever arriving. A hard `min(span, reach)` is the
      // obvious version and it has a square root in it that flattens to zero
      // exactly there — so an arm at full stretch, which is where a violinist's
      // bow hand idles, swings its elbow through centimetres for a millimetre
      // of body sway and reads as a glitch. `performer-legs.ts` names the same
      // trap at a knee. Easing into the limit instead leaves a hand's width of
      // bend at full stretch, which a real arm has too — nobody reaches with a
      // locked elbow — and makes the whole approach smooth in the first
      // derivative rather than infinite in it.
      const near = span / reach;
      const soft = near < SOFT_FROM
        ? near
        : SOFT_FROM + (1 - SOFT_FROM) * (1 - Math.exp(-(near - SOFT_FROM) / (1 - SOFT_FROM)));
      const d = soft * reach;
      const along = (d * d + upperL * upperL - foreL * foreL) / (2 * d);
      const bulge = Math.sqrt(Math.max(0, upperL * upperL - along * along));
      E.copy(A).addScaledVector(D, span > d ? along * (span / d) : along)
        .addScaledVector(FALL, bulge);

      clearRibs(E, A, torso, side);
      rebalance(E, A, B);
      clearRibs(E, A, torso, side);

      fitLimb(arm.upper, A, E, upperR);
      fitLimb(arm.fore, E, B, foreR);
      arm.joint.position.copy(E);
    }
  }

  update(0);
  return { update, elbow: (side: BodySide): Vector3 => arms[side].joint.position };
}
