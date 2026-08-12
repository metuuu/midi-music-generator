/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * `Look` and `Posture` made physical: proportions, the frame, and the clothes.
 *
 * This file used to be three files' worth of work in one, and the third that is
 * left is the third the other two are written *against*. The seventeen hair styles
 * are `performer-hair.ts` and the twenty accessories are
 * `performer-accessories.ts`; what stayed is `Proportions` — where the head, the
 * shoulders, the hips and the feet are — together with `dressTorso`, which is
 * the solid that hanging hair has to stay out of, and the two helpers
 * (`separate`, `fitLimb`) that would otherwise be copied into four files.
 *
 * A fourth left later and for a different reason. The eight garment silhouettes
 * are `performer-garments.ts`, and that split is not about how long this file
 * was — it is that a garment is not a torso. A robe reaches the sleeves and the
 * legs as well, so its table has to sit somewhere all three can read it, and
 * `dressTorso` below is one of the three readers rather than the owner.
 *
 * The split was made for a reason that is about people. A hat model and a hair
 * model are improved by different hands, and a single 1300-line module with
 * three unrelated switches in it can only be edited by one hand at a time. The
 * *contract* between the two halves is not in this file either: hair publishes
 * what it reaches to and head furniture reads it — see `HairProfile`.
 *
 * Nothing anywhere in the three chooses anything. The genre and the era decided
 * the sequinned jacket and the beehive long before any of them ran — see
 * `concert/cast.ts` — and the job is to render what the contract names, not to
 * have opinions about which suits a trombonist. Every branch is a `switch` over
 * a frozen union, which is deliberate: adding a hair style to `concert/types.ts`
 * should fail the build rather than quietly produce a bald accordionist. That is
 * enforced rather than hoped for — each switch ends in a `never` assignment via
 * `assertBuilt` below, because a `switch` in a function returning `void` will
 * otherwise accept a missing case in silence, which is exactly the failure the
 * paragraph above claims cannot happen: a silhouette a genre's wardrobe asks for
 * every night and which never once appears on stage.
 *
 * ## The local frame, and the one thing that is easy to get backwards
 *
 * A rig's `root` is placed at the `Station` and turned by `facing`, so
 * everything in these three files is in the performer's own frame: `+y` up,
 * `+z` the way they are looking, origin on the boards between their feet.
 *
 * `+x` is the performer's **left**. In three.js a viewer's right is
 * `forward × up`, so a performer looking down `+z` has their right hand at
 * `-x` — which is the audience's left, exactly as it is in a real room. Get
 * this wrong and every guitarist plays left-handed, so the sign lives in one
 * place: `SIDE`.
 *
 * ## Postures are silhouettes, not offsets
 *
 * A seated player is not a standing player lowered. The torso is the same
 * length, but it starts from a bench, the hips carry a lap that a standing
 * player does not have, the feet are out in front rather than underneath, and
 * a drummer's are up on pedals. `proportions()` returns the differences and
 * `restLocals()` returns where the limbs live when nothing is asking them to
 * be anywhere in particular.
 *
 * The legs that connect the two ends are `performer-legs.ts`, which reads the
 * hips and the feet and invents nothing. Nothing in this file may place a thigh
 * itself, and one version of it did: a pair of fixed capsules under a seated
 * player that pointed at where the feet usually were rather than at where they
 * had been put.
 */

import { Group, Mesh, Vector3 } from 'three';

import type { Look, Posture } from '../../concert/types.js';
import type { Rng } from '../../core/rng.js';

import {
  Leases, clothSurface, orb, shade, slab, surface, torsoShell, tube,
} from './performer-assets.js';
import { cutOf, dressGarment, legGirth, relief } from './performer-garments.js';

/** Which way `+x` is for each side of the body. See the header. */
export const SIDE = { left: 1, right: -1 } as const;

export type BodySide = keyof typeof SIDE;

// ---------------------------------------------------------------------------
// Proportions
// ---------------------------------------------------------------------------

export interface Proportions {
  /** Standing height in metres, crown to boards, straight from `Look`. */
  height: number;
  /** 0 slight .. 1 broad, straight from `Look`. */
  build: number;
  /** Head radius. Cartoon proportions: about a sixth of the body, not a eighth. */
  headR: number;
  /** Head centre, in the local frame, allowing for the posture's lean. */
  head: Vector3;
  /** Hip pivot height — where the torso is hinged. */
  hipY: number;
  /** Hip to shoulder. Constant across postures; only its base moves. */
  torsoH: number;
  /** Shoulder width and body depth in metres. */
  torsoW: number;
  torsoD: number;
  /** Palm half-width. */
  handR: number;
  footL: number;
  footW: number;
  footH: number;
  /**
   * Seat height, 0 when the player is on their feet — **and also 0 when they
   * are sitting on the floor**, which is why `seated` exists beside it.
   *
   * `seatY > 0` was the test for "is this body's weight off its feet" for as
   * long as every seat in the union was furniture, and it was a good one: a
   * bench, a stool and a throne all have a height and a standing player has
   * none. `floor` broke it by having a perfectly real answer of zero. Three
   * files were asking the question that way — the hand rests below, the hip
   * socket in `performer-legs.ts` and the sway damping in `performer.ts` — and
   * every one of them would have given a cross-legged player a standing body's
   * answer.
   */
  seatY: number;
  /**
   * Whether the weight is on the seat rather than on the feet.
   *
   * The question `seatY > 0` used to stand in for. True for every posture that
   * is off its feet, including `floor`, whose seat is the boards.
   */
  seated: boolean;
  /** Forward pitch of the torso about the hip, radians. */
  lean: number;
  /**
   * How far the knees turn out, as the lateral weight in the bend direction
   * `performer-legs.ts` bulges a knee along. It is a posture's number rather
   * than the legs' own, because what the knees are making room for is decided
   * by what the player is sitting at: nothing, a pedalboard, or a cello.
   */
  splay: number;
}

/** The gap between the shoulders and the head. Rayman's neck is not there. */
const NECK = 0.026;

export function proportions(look: Look, posture: Posture): Proportions {
  const height = clamp(look.height, 1.35, 2.10);
  const build = clamp(look.build, 0, 1);
  const headR = height * 0.078;

  // Everything derives from the standing layout, so a player who stands up
  // between numbers is the same person.
  const standShoulderY = height - 2 * headR - height * NECK;
  const standHipY = height * 0.50;
  const torsoH = standShoulderY - standHipY;

  const bench = posture === 'sit' || posture === 'straddle';
  const onFloor = posture === 'floor';
  const seatY =
    bench ? Math.min(0.47, height * 0.27)
      : posture === 'stool' ? height * 0.40
        : posture === 'kit' ? height * 0.33
          : 0;
  /**
   * The hip rides `0.055 × height` above whatever the player is sitting on, and
   * for a cross-legged one that surface is the boards.
   *
   * The one line that makes `floor` cheap. It is not a new rule — it is the
   * existing rule with the seat at zero, which is what sitting on the floor
   * *is*, and it lands the hip at 9.6 cm for a 1.75 m player: about where the
   * pelvis of somebody cross-legged actually is. Everything above it follows
   * from the standing torso the way it does for every other posture, so the head
   * comes out at 0.472 × height and the crown at 0.550, which is the pair of
   * numbers `headAbove` in `cast.ts` and `rooms/sabha.ts` were both written
   * against.
   */
  const hipY = seatY > 0 || onFloor ? seatY + height * 0.055 : standHipY;
  const lean = posture === 'perch' ? 0.26 : posture === 'kit' ? 0.13
    // Between a bench-sitter's and a drummer's. A cross-legged player carries a
    // straight back — a khyāl singer's is famously vertical — but there is an
    // instrument in the lap and the eyes go down to it.
    : onFloor ? 0.08 : bench ? 0.05 : 0;
  /**
   * Knees apart, more so sitting, and much more so round an instrument.
   *
   * A cellist's knees are turned out far enough that the lower bout passes
   * between them, which is most of a metre across the shoulders of the thighs.
   * The seated 0.30 is what a pianist does and it is not enough by about ten
   * centimetres a side — the measurement that started this was a right thigh
   * through the ribs of a cello.
   *
   * Cross-legged is off the end of that scale and belongs there. A cellist's
   * knees are turned out *and still forward*; a cross-legged player's have gone
   * past the hips and down to the floor, so the bend `performer-legs.ts` builds
   * has to be more lateral than forward — which is what a number over 1 means,
   * since the bend direction is `(side × splay, 0, 1)` before the leg axis is
   * taken out of it. 1.6 puts the knee 58° off the body's forward, which with
   * the feet crossed under the opposite shins is the shape of the posture.
   */
  const splay = onFloor ? 1.6 : posture === 'straddle' ? 0.75 : seatY > 0 ? 0.30 : 0.11;

  // The head rides on top of the leaned torso rather than floating where the
  // shoulders would have been. A leaning player whose head stays put is the
  // single most obvious tell that a rig is a stack of unrelated parts.
  const shoulderY = hipY + torsoH * Math.cos(lean);
  const shoulderZ = torsoH * Math.sin(lean);

  return {
    height,
    build,
    headR,
    head: new Vector3(0, shoulderY + height * NECK + headR * 0.96, shoulderZ * 1.05),
    hipY,
    torsoH,
    torsoW: height * (0.235 + 0.10 * build),
    torsoD: height * (0.235 + 0.10 * build) * 0.70,
    handR: height * 0.040,
    footL: height * 0.145,
    footW: height * 0.062,
    footH: height * 0.050,
    seatY,
    seated: seatY > 0 || onFloor,
    lean,
    splay,
  };
}

/**
 * The closest two hands are ever allowed to rest, in multiples of `handR`.
 *
 * `handR` is the palm's *half* width, so two hands whose centres are `2 × handR`
 * apart are touching. 2.6 leaves about four centimetres of daylight at adult
 * scale, which is what the eye needs to read two hands rather than one lump.
 * Enforced here rather than hoped for, because the failure is not subtle: with
 * both idle hands at one point the drummer's hands interpenetrated and the
 * fingers of one poked out of the back of the other.
 */
export const MIN_HAND_GAP = 2.6;

/**
 * Where each placeable part sits when nothing has asked it to be anywhere.
 *
 * This is the body's *own* idle, and it is deliberately not the instrument's.
 * A guitarist's hands rest on the guitar, and the guitar knows where that is —
 * the runtime asks the model to `resolve({ kind: 'rest' })` first and only
 * falls back here when there is no instrument or no answer. What this gives is
 * a person standing there plausibly: hands by the hips, feet under the body,
 * head level.
 *
 * `rng` is the performer's own, so the small asymmetries below are stable for a
 * given `Performer.id` and different between two players standing side by side.
 * Pass a *dedicated* stream rather than the rig's general one — the draws here
 * would otherwise shift every later draw and quietly re-roll the blink
 * schedule of every existing performer.
 */
export function restLocals(p: Proportions, posture: Posture, rng: Rng): Record<string, Vector3> {
  const hands = handRests(p, posture, rng);
  const feet = footRests(p, posture);

  return {
    'left-hand': hands.left,
    'right-hand': hands.right,
    'left-foot': feet.left,
    'right-foot': feet.right,
    head: p.head.clone(),
    // The chest, for `Effector.body`: the point a lean is measured at.
    body: new Vector3(0, p.hipY + p.torsoH * 0.62 * Math.cos(p.lean), p.torsoH * 0.62 * Math.sin(p.lean)),
    mouth: new Vector3(0, p.head.y - p.headR * 0.42, p.head.z + p.headR * 0.92),
  };
}

/**
 * Two resting hands, and specifically not one resting hand mirrored.
 *
 * The mirrored version was the first one and it is wrong twice over. It is
 * wrong statically, because nobody stands with their hands at matched height
 * and matched depth — one hand leads. And it is wrong dynamically, because two
 * limbs easing home along mirrored paths arrive at mirrored places at the same
 * instant, and a pair of hands that are always each other's reflection is the
 * single clearest tell that a body is being driven by one number.
 *
 * So one hand leads: forward, a little lower, a little further out. Which one
 * comes off the performer's id, along with a couple of centimetres of scatter,
 * which is the cheapest possible answer to "why does the whole band stand the
 * same way".
 */
function handRests(p: Proportions, posture: Posture, rng: Rng): { left: Vector3; right: Vector3 } {
  const h = p.height;
  const seated = p.seated;
  const kit = posture === 'kit';
  const outward = p.torsoW * 0.5 + p.handR * (seated ? 1.1 : 1.5);

  // A drummer's idle is not a seated player's idle: the sticks stay up over the
  // kit rather than dropping into the lap, which is also the difference between
  // a drummer waiting for the count-in and a drummer who has left.
  const handY = kit ? p.hipY + p.torsoH * 0.20
    : seated ? p.hipY + p.torsoH * 0.34
      : p.hipY + p.torsoH * 0.10;
  // Nearer the body on the floor than on a bench, and the difference is a piece
  // of furniture: a seated player's hands come forward over the front edge of a
  // seat, and a cross-legged player's have crossed shins under them instead.
  const handZ = kit ? h * 0.22
    : posture === 'perch' ? h * 0.22
      : posture === 'floor' ? h * 0.12
        : seated ? h * 0.15
          : h * 0.045;

  const lead: BodySide = rng.chance(0.5) ? 'right' : 'left';
  const ahead = h * rng.float(0.028, 0.052);
  const drop = h * rng.float(0.008, 0.020);
  const tuck = rng.float(0.90, 0.97);

  const place = (side: BodySide): Vector3 => {
    const leads = side === lead;
    return new Vector3(
      SIDE[side] * outward * (leads ? 1 : tuck),
      handY + (leads ? -drop : drop * 0.6),
      handZ + (leads ? ahead : -ahead * 0.55),
    );
  };

  const left = place('left');
  const right = place('right');
  separate(left, right, p.handR * MIN_HAND_GAP);
  return { left, right };
}

/**
 * Push two points apart along `x` until they are at least `gap` apart.
 *
 * Along the body's lateral axis and nothing else: a hand shoved forward to
 * avoid its twin ends up somewhere the player is not reaching, whereas a hand
 * shoved sideways ends up on its own side of the body, which is where it
 * belongs anyway. Exported because the runtime has the same problem with a
 * different input — see `PerformerRig.separateRest`.
 */
export function separate(left: Vector3, right: Vector3, gap: number): void {
  if (left.distanceTo(right) >= gap) return;
  // Opened to `gap` on the `x` axis alone rather than by the shortfall in
  // distance, which is the version that provably works: separating two points
  // by `gap − d` along one axis leaves them closer than `gap` whenever they
  // were also apart on another. And the direction comes from `SIDE` rather than
  // from the difference, because two points that coincide *exactly* have no
  // difference to take a direction from — which is precisely the case that
  // happens, a model answering `rest` once for both hands.
  const push = (gap - (left.x - right.x)) * 0.5 + 1e-4;
  left.x += SIDE.left * push;
  right.x += SIDE.right * push;
}

function footRests(p: Proportions, posture: Posture): { left: Vector3; right: Vector3 } {
  const h = p.height;
  const y = p.footH * 0.5;
  switch (posture) {
    case 'stand':
      return {
        left: new Vector3(SIDE.left * h * STANCE_X, y, 0),
        right: new Vector3(SIDE.right * h * STANCE_X, y, h * 0.02),
      };
    case 'perch':
      /**
       * Weight on the front foot, the other trailing. A leaning player who is
       * square on their feet reads as a mannequin pushed over.
       *
       * The trail was three times this and it was the one stance no hem could
       * cover. A skirt hangs plumb from the hip and is 13 cm deep — see
       * `SKIRT_ROUND` — so a foot 10 cm behind the body puts the whole trailing
       * leg, knee included, outside the cloth from the side, and the knee clamp
       * in `performer-legs.ts` cannot help: it bounds where a knee *travels to*,
       * and this one is out before it travels anywhere. 6 cm between the shoes
       * fore and aft still reads as weight forward, and reads it from the front,
       * which is where a keyboard player is seen from.
       */
      return {
        left: new Vector3(SIDE.left * h * STANCE_X, y, -h * 0.020),
        right: new Vector3(SIDE.right * h * (STANCE_X + 0.005), y, h * 0.016),
      };
    case 'sit':
      // Not square: one foot goes further under the bench than the other. Two
      // feet at matched depth is how a shop dummy sits.
      return {
        left: new Vector3(SIDE.left * h * 0.085, y, h * 0.205),
        right: new Vector3(SIDE.right * h * 0.090, y, h * 0.160),
      };
    case 'straddle':
      // Both feet flat and planted wide, because they are what the knees are
      // braced against: a cellist grips the instrument between the legs and
      // that is not done from a pianist's stance. Still not square — the bow
      // arm's side draws back a little, as it does on a real bench.
      //
      // The width is not free. Each two centimetres of foot buys only one of
      // knee, since the knee is placed near the middle of the hip→ankle line
      // (`performer-legs.ts`), so the clearance round the lower bout is bought
      // mostly by `Proportions.splay` and this only has to be the stance that
      // splay is plausible from.
      return {
        left: new Vector3(SIDE.left * h * 0.175, y, h * 0.190),
        right: new Vector3(SIDE.right * h * 0.170, y, h * 0.155),
      };
    case 'stool':
      // One foot hooked on the rung, one on the boards. The asymmetry is the
      // reason a stool reads as a stool from the back of the room.
      return {
        left: new Vector3(SIDE.left * h * 0.078, p.seatY * 0.42, h * 0.055),
        right: new Vector3(SIDE.right * h * 0.082, y, h * 0.16),
      };
    case 'floor':
      // **Crossed**, and that is the entire read.
      //
      // Every other pair in this switch keeps each foot on its own side of the
      // body; this one puts the left ankle under the right shin and the right
      // under the left, which is what makes the silhouette sukhāsana rather than
      // a player who has been sunk into the boards. It is also what drives the
      // legs: `performer-legs.ts` spans hip → knee → ankle, so an ankle across
      // the centre line and a knee splayed hard outward (see `Proportions.splay`
      // — 1.6, over twice a cellist's) give a thigh going out and a shin coming
      // back in, folded flat. Nothing had to be taught what cross-legged is.
      //
      // Forward of the hips by about an eighth of a body, which is where crossed
      // shins sit, and still not square: the ankles are at different depths for
      // the reason every other pair here is asymmetric.
      return {
        left: new Vector3(SIDE.right * h * 0.040, y, h * 0.120),
        right: new Vector3(SIDE.left * h * 0.032, y, h * 0.150),
      };
    case 'kit':
      // Both feet occupied, on pedals, well forward of the throne.
      //
      // The height is the number the report was about. A footboard sits about
      // three centimetres off the boards, not twelve, and at twelve the shins
      // came out horizontal and the knees ended up level with the snare — which
      // is what "the drummer's leg seems to be too high" looks like from the
      // front. It is `y` — half a shoe, sole on the floor — plus the thickness
      // of a pedal plate, and nothing else.
      //
      // Forward matters as much, now that there is a leg to see. Pedals are at
      // the far end of a stretched-out leg; at a fifth of a body height ahead
      // of the throne the leg folded into a Z. The kit model owns where the
      // pedals actually are — this is only where the feet go until it says.
      return {
        left: new Vector3(SIDE.left * h * 0.098, y + h * 0.016, h * 0.235),
        right: new Vector3(SIDE.right * h * 0.062, y + h * 0.020, h * 0.255),
      };
  }
}

// ---------------------------------------------------------------------------
// Limbs
// ---------------------------------------------------------------------------

const FIT_UP = new Vector3(0, 1, 0);
const FIT_AXIS = new Vector3();

/**
 * Stand a unit cylinder between two points.
 *
 * The tips land exactly on `a` and `b`, so a chain of these has no gap at the
 * joints by construction — there is no length arithmetic that could disagree
 * with the endpoints, because the length *is* the endpoints. That is the one
 * property both fitted limbs are built on: `performer-legs.ts` spans hip to
 * knee to ankle and `performer-arms.ts` spans shoulder to elbow to wrist, and
 * neither is allowed to open a seam at a joint whatever the solve does.
 *
 * Here rather than in either of them because it is the same function, and a
 * second copy is a second place for the degenerate case below to be got wrong.
 *
 * `depth` is for the one caller whose cross-section is not round: the sheet of
 * cloth `performer-legs.ts` sags between a seated player's thighs is half a
 * metre across and a hand thick, and it is fitted between two points exactly as
 * a limb is. Defaulting it to `radius` is what keeps every other call a limb.
 * The roll about the axis is unconstrained — `setFromUnitVectors` takes the
 * short way round — which is invisible on a cylinder and fine for the sheet,
 * whose axis has no sideways component to roll it out of level.
 */
export function fitLimb(
  mesh: Mesh, a: Vector3, b: Vector3, radius: number, depth = radius,
): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  mesh.position.set(a.x + dx * 0.5, a.y + dy * 0.5, a.z + dz * 0.5);
  if (len < 1e-6) {
    mesh.scale.set(radius * 2, 1e-4, depth * 2);
    return;
  }
  mesh.quaternion.setFromUnitVectors(FIT_UP, FIT_AXIS.set(dx / len, dy / len, dz / len));
  mesh.scale.set(radius * 2, len, depth * 2);
}

/**
 * How far out the hip sockets are, as a fraction of the shoulder width.
 *
 * `performer-legs.ts` is the only file that *builds* a leg and was for that
 * reason the only one that knew where one starts or how thick it is. It is not
 * the only file that has to know: a skirt is a tube with a pair of legs inside
 * it, and the one property it cannot be allowed to get wrong is being wider
 * than they are. Sized against a number somebody typed, it was not — every
 * floor-length garment in the catalogue had two thighs bulging out of its
 * sides, because a cartoon leg is nearly as wide as a cartoon shoulder and
 * nothing said so anywhere `dressGarment` could read it.
 *
 * So the stance lives here, with the rest of the proportions, and both callers
 * derive from it. That is the same rule `legsOf` in `performer-garments.ts`
 * exists to keep from the other direction — one home per fact that two files
 * have to agree about.
 */
export const LEG_SOCKET_X = 0.23;

/**
 * How far to each side a standing player plants a foot, as a fraction of their
 * *height*.
 *
 * The other end of the leg, and the second thing a skirt has to be wider than.
 * A hip socket scales with the shoulders and a stance scales with the body, so
 * which of the two is the leg's widest point depends on the build: on a broad
 * player the hips win, and on a slight one — narrow shoulders, same legs — the
 * feet do, by three centimetres. `dressGarment` sized against the socket alone
 * and cut every slight player's hem inside their own knees.
 *
 * It is also two centimetres narrower than the stance it replaced, which is the
 * *other* half of a skirt that clears a bass guitar: cloth hangs off the widest
 * thing under it, so the cheapest width to buy back is the one the feet were
 * spending on a stance nobody had measured. 21 cm between the shoes at average
 * height is a person standing; 25 was a person braced.
 */
export const STANCE_X = 0.060;

/** How thick a leg is at the three places `performer-legs.ts` puts a mesh. */
export interface LegRadii {
  thigh: number;
  shin: number;
  knee: number;
}

/**
 * Leg thickness, given how much the garment adds to it — see `legsOf`.
 *
 * A cartoon leg is thicker than a real one and tapers hard. Build widens the
 * thigh twice as much as the shin, which is where build actually shows.
 *
 * **These numbers were once the answer to a garment problem and are not any
 * more.** A skirt has to be wider than the legs inside it, so when the first
 * honest hem came out 61 cm across and went through the body of a bass, thinning
 * every leg in the catalogue looked like the way out. It was the wrong lever
 * twice over: it changed every player on stage to fix the one in four wearing a
 * skirt, and it was the *smaller* half of the width it bought — the sockets and
 * the stance gave 7 cm of hem and this gave 5. The stance stayed narrow and
 * these went back. See `clearFor` and `SKIRT_ROUND` in
 * `performer-garments.ts`: the depth axis is where the instruments are, and it
 * is the axis a skirt could always afford to give up.
 */
export function legRadii(p: Proportions, girth: number): LegRadii {
  const thigh = p.height * (0.043 + 0.012 * p.build) * girth;
  return {
    thigh,
    shin: p.height * (0.032 + 0.006 * p.build) * girth,
    // The one ball that has to be there: two cylinders meeting at a drummer's
    // hundred degrees show daylight through the outside of the bend.
    knee: thigh * 1.04,
  };
}

// ---------------------------------------------------------------------------
// Clothes
// ---------------------------------------------------------------------------

/**
 * Dress the torso group.
 *
 * Four colours, one material and one *shape* — see `Garment` — and no cloth
 * simulation, so what is built here is only the part every garment has: a lathed
 * body, a soft shirt front proud of it, two lapels, and the hip mass the thighs
 * come out of. Whether each of those exists at all, and which of the outfit's
 * colours it is cut from, is `cutOf`'s answer rather than this file's; anything
 * a single garment adds on top — a skirt, two tails, a sash, a pair of braces —
 * is `dressGarment`'s, called at the end.
 *
 * That division is the header's rule about opinions, applied one level down.
 * This file used to build one silhouette because one silhouette was all there
 * was, and the moment there were eight the tempting thing was a `switch` right
 * here. It is next door instead, because the sleeves and the legs need the same
 * answers and three copies of a garment table is how a robe ends up with
 * pinstripe shins under it. See `performer-garments.ts`, which argues it.
 *
 * One fabric is also a shape here, and exactly one — see the `brocade` note
 * below for why that is not the beginning of a fabric-by-fabric wardrobe. The
 * other fourteen are reflectance, and reflectance is `clothSurface`'s.
 */
export function dressTorso(
  torso: Group, look: Look, p: Proportions, l: Leases,
): Mesh {
  const { jacket, shirt, trousers, fabric } = look.outfit;
  const cut = cutOf(look.outfit.garment);

  const body = new Mesh(
    torsoShell(l),
    clothSurface(l, cut.shell === 'shirt' ? shirt : jacket, fabric),
  );
  // `girth` is the only place a garment is allowed to touch the shared body, and
  // it stays within a few per cent for the reason its own comment gives: this
  // solid is what the arms clear their ribs against and what the hair settles
  // onto, and both of those read `Proportions` rather than this scale.
  body.scale.set(p.torsoW * cut.girth, p.torsoH, p.torsoD * cut.girth);
  body.castShadow = true;
  torso.add(body);

  // Shirt front — the strip of shirt an open jacket leaves down the middle,
  // tucked behind the lapels. `collar` is the same object pulled up to the neck
  // and cut short: a garment with no open front still shows a band of shirt
  // under the chin, and a garment that is *itself* the shirt shows none, which
  // is what `none` means rather than an omission.
  //
  // A `slab` rather than the `orb` this was, and the bench had been complaining
  // about the `orb` since it was first drawn beside anything. An ellipsoid a
  // third of the shoulder width across and half the torso tall, sitting proud of
  // the chest, is not a shirt showing between two lapels — it is an egg on the
  // front of the jacket, and every survey of this page has called it a bib. The
  // object it is standing in for is flat and narrow and mostly hidden: what you
  // see of a shirt under a lounge suit is a placket, which is exactly the shape
  // the `brocade` block further down already builds for the same reason. Sized
  // and placed to sit inside the lapels' own V at the top and be overlapped by
  // them at the bottom, so the three read as layers in the right order rather
  // than as one mass with two slabs stuck on it.
  //
  // It takes the outfit's fabric like everything else, because the IR carries
  // exactly one: `Look.outfit.fabric` is drawn once per player. Giving the shirt
  // a matte value of its own here would stop a sequinned lead from glittering at
  // the collar, which is tempting and is the renderer inventing wardrobe policy
  // — the thing this file is otherwise careful never to do. If a satin shirt
  // over a wool suit is wanted, that is a second field in the wardrobe, decided
  // by the genre that owns the clothes. Note that `satin`'s own doc comment
  // already describes it as a shirt fabric, so the single value is not obviously
  // the wrong reading of what the tables mean today.
  if (cut.chest !== 'none') {
    const wide = cut.chest === 'front';
    const front = new Mesh(slab(l), clothSurface(l, shirt, fabric));
    front.scale.set(
      p.torsoW * (wide ? 0.20 : 0.30),
      p.torsoH * (wide ? 0.38 : 0.10),
      p.torsoD * (wide ? 0.10 : 0.12),
    );
    front.position.set(0, p.torsoH * (wide ? 0.75 : 0.93), p.torsoD * 0.40);
    torso.add(front);
  }

  // Lapels are a notch cut out of a neckline and only two garments have one.
  // Everything else here either closes at the centre under a stand collar or
  // does not close at all, and a lapel slab left on a robe is the single most
  // obvious way to make an expensive kaftan look like a dressing gown.
  //
  // `relief` rather than `shade(jacket, -0.07)`, which is the other half of the
  // same complaint the shirt front above answers. Seven points of lightness is a
  // legible edge on a cream tanssilava jacket and nothing at all anywhere else,
  // and on the near-black jackets that four genres are almost entirely made of
  // it clamps to the jacket's own colour — so the one garment feature every
  // undressed genre in the project had was invisible on most of them. See
  // `relief`, which argues the direction and the size.
  if (cut.lapels) {
    const lapelMat = clothSurface(l, relief(jacket, 0.14), fabric);
    for (const s of [SIDE.left, SIDE.right]) {
      const lapel = new Mesh(slab(l), lapelMat);
      lapel.scale.set(p.torsoW * 0.13, p.torsoH * 0.36, p.torsoD * 0.10);
      lapel.position.set(s * p.torsoW * 0.14, p.torsoH * 0.76, p.torsoD * 0.42);
      lapel.rotation.z = -s * 0.20;
      torso.add(lapel);
    }
  }

  /**
   * Hips, in the trousers colour — or in the garment's own, when there are no
   * trousers under the hem and this is the top of one continuous column.
   *
   * **Sized off the legs rather than off the shoulders, and that is a fix.** It
   * was `torsoW * 0.88`, chosen to bury the top of each thigh back when the hip
   * socket sat at 30 % of the shoulder width. The socket is at 23 % now — see
   * `LEG_SOCKET_X`, which came in to get a skirt off a bass guitar — and a
   * number that was a burial margin quietly became a pelvis 6 cm wider than the
   * legs coming out of it and 6 cm wider than the body above it. Nothing was
   * wrong with the ellipsoid; it had simply stopped being told what it was
   * supposed to contain.
   *
   * So it contains them by construction: the span across both thighs, less a
   * little, so the *legs* are the widest thing below the waist. That ordering —
   * waist, then hips, then thighs — is what reads as a body rather than as a
   * blob with two poles under it, and it is the ordering the rig had before the
   * socket moved. `torsoShell` swells to 0.76 of the shoulders just under the
   * waist, so this lands within a centimetre of the shell above it and the join
   * is a swell rather than a step.
   *
   * The depth came down with it and for the same reason: 0.98 made the hips as
   * deep as the chest, which no body is, and there was never anything to bury
   * there — a standing thigh is on the centre line, so a fifth of this depth
   * would do. A seated one comes forward out of the front of the hips and is
   * *meant* to.
   */
  const hipSpan =
    2 * (p.torsoW * LEG_SOCKET_X + legRadii(p, legGirth(look.outfit.garment)).thigh);
  const hips = new Mesh(
    orb(l),
    clothSurface(l, cut.under === 'garment' ? jacket : trousers, fabric),
  );
  hips.scale.set(hipSpan * 0.96, p.torsoH * 0.34, p.torsoD * 0.80);
  hips.position.set(0, -p.torsoH * 0.05, 0);
  hips.castShadow = true;
  torso.add(hips);

  /**
   * Embroidery, which is the one thing a fabric can be that a material cannot.
   *
   * Every other value in `Fabric` is a statement about *reflectance* — what a
   * follow spot does when it crosses the cloth — and a shader is the right place
   * for all of them. `brocade` is not that. It is a woven pattern with metal
   * thread in it, and the thing that says so from row twenty is neither sheen
   * nor colour but a *band*: a placket down the front of the coat and a border
   * round the hem, brighter than the cloth they are on. Sherwani, folk waistcoat
   * and court coat are all that band in different proportions, which is why one
   * pair of shapes serves four genres, and why this is geometry rather than a
   * number handed to `clothSurface`.
   */
  if (look.outfit.fabric === 'brocade') {
    const thread = surface(l, look.outfit.accent, { roughness: 0.42, metalness: 0.35 });
    // Proud of the shirt front by a centimetre — it is on the coat, over the
    // shirt, and buried in it at any depth less than this.
    const placket = new Mesh(slab(l), thread);
    placket.scale.set(p.torsoW * 0.13, p.torsoH * 0.78, p.torsoD * 0.10);
    placket.position.set(0, p.torsoH * 0.52, p.torsoD * 0.52);
    torso.add(placket);
    const hem = new Mesh(tube(l), thread);
    hem.scale.set(p.torsoW * 0.80, p.torsoH * 0.07, p.torsoD * 0.82);
    hem.position.set(0, p.torsoH * 0.16, 0);
    torso.add(hem);
  }

  // There were two stand-in thighs here for the seated postures: capsules
  // parented to the root at a fixed angle, which did not move, did not reach
  // the feet, and existed only because a seated player with nothing below the
  // hips looked worse than a standing one. `performer-legs.ts` now builds real
  // legs for every posture and they end at the ankle, so a fixed prop that
  // ended in mid-air would only intersect them.

  // Last, and after the hips deliberately: a skirt hangs from inside that mass
  // and a sash lies over the shirt front, so both want everything shared to
  // exist already. For `suit` this adds nothing at all, which is the whole
  // guarantee that a genre with no garment table is untouched.
  dressGarment(torso, look, p, l);

  return body;
}

// ---------------------------------------------------------------------------

/**
 * The compile-time half of "every value in the union is built here".
 *
 * A `switch` over a union in a function returning `void` is not checked for
 * exhaustiveness by anything — TypeScript is perfectly happy for a case to be
 * missing, and the result is not an error but a wardrobe entry that draws
 * nothing: a genre asks for a cowboy hat every night of the run and the player
 * walks on bare-headed. Narrowing the argument to `never` in the default branch
 * is what turns that into a build failure, which is what the header claims.
 *
 * It is never called. If it ever is, the union has grown a value at runtime
 * that the type system did not know about, and doing nothing quietly is still
 * the right answer on stage.
 *
 * Here rather than in either of the two files that use it, and for the reason
 * `fitLimb` is here: it is the same function, and a second copy is a second
 * place for the one line that does the work to be written as `unknown` by
 * somebody in a hurry — at which point the check is gone and nothing says so.
 */
export function assertBuilt(_unbuilt: never): void { /* see above */ }

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
