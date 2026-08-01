/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * `Look` and `Posture` made physical: proportions, clothes, hair, accessories.
 *
 * Nothing here chooses anything. The genre and the era decided the sequinned
 * jacket and the beehive long before this file ran — see `concert/cast.ts` —
 * and the job here is to render the sixteen hair styles and the twenty
 * accessories the contract names, not to have opinions about which suits a
 * trombonist. Every branch below is a `switch` over a frozen union, which is
 * deliberate: adding a hair style to `concert/types.ts` should fail the build
 * here rather than quietly produce a bald accordionist. That is now enforced
 * rather than hoped for — each switch ends in a `never` assignment, because a
 * `switch` in a function returning `void` will otherwise accept a missing case
 * in silence, which is exactly the failure the paragraph above claims cannot
 * happen: a silhouette a genre's wardrobe asks for every night and which never
 * once appears on stage.
 *
 * ## The local frame, and the one thing that is easy to get backwards
 *
 * A rig's `root` is placed at the `Station` and turned by `facing`, so
 * everything in this file is in the performer's own frame: `+y` up, `+z` the
 * way they are looking, origin on the boards between their feet.
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

import { Group, Mesh, Object3D, Vector3 } from 'three';

import type { Accessory, HairStyle, Look, Posture } from '../../concert/types.js';
import type { Rng } from '../../core/rng.js';

import {
  Leases, bead, clothSurface, collar, disc, hairSurface, hoodShell, hoop, orb,
  pill, shade, slab, spike, surface, torsoShell, tube,
} from './performer-assets.js';

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
  /** Seat height, 0 when the player is on their feet. */
  seatY: number;
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

  const seated = posture === 'sit' || posture === 'straddle';
  const seatY =
    seated ? Math.min(0.47, height * 0.27)
      : posture === 'stool' ? height * 0.40
        : posture === 'kit' ? height * 0.33
          : 0;
  const hipY = seatY > 0 ? seatY + height * 0.055 : standHipY;
  const lean = posture === 'perch' ? 0.26 : posture === 'kit' ? 0.13 : seated ? 0.05 : 0;
  /**
   * Knees apart, more so sitting, and much more so round an instrument.
   *
   * A cellist's knees are turned out far enough that the lower bout passes
   * between them, which is most of a metre across the shoulders of the thighs.
   * The seated 0.30 is what a pianist does and it is not enough by about ten
   * centimetres a side — the measurement that started this was a right thigh
   * through the ribs of a cello.
   */
  const splay = posture === 'straddle' ? 0.75 : seatY > 0 ? 0.30 : 0.11;

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
  const seated = p.seatY > 0;
  const kit = posture === 'kit';
  const outward = p.torsoW * 0.5 + p.handR * (seated ? 1.1 : 1.5);

  // A drummer's idle is not a seated player's idle: the sticks stay up over the
  // kit rather than dropping into the lap, which is also the difference between
  // a drummer waiting for the count-in and a drummer who has left.
  const handY = kit ? p.hipY + p.torsoH * 0.20
    : seated ? p.hipY + p.torsoH * 0.34
      : p.hipY + p.torsoH * 0.10;
  const handZ = kit ? h * 0.22
    : posture === 'perch' ? h * 0.22
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
        left: new Vector3(SIDE.left * h * 0.072, y, 0),
        right: new Vector3(SIDE.right * h * 0.072, y, h * 0.02),
      };
    case 'perch':
      // Weight on the front foot, the other trailing. A leaning player who is
      // square on their feet reads as a mannequin pushed over.
      return {
        left: new Vector3(SIDE.left * h * 0.070, y, -h * 0.06),
        right: new Vector3(SIDE.right * h * 0.075, y, h * 0.05),
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
 */
export function fitLimb(mesh: Mesh, a: Vector3, b: Vector3, radius: number): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  mesh.position.set(a.x + dx * 0.5, a.y + dy * 0.5, a.z + dz * 0.5);
  if (len < 1e-6) {
    mesh.scale.set(radius * 2, 1e-4, radius * 2);
    return;
  }
  mesh.quaternion.setFromUnitVectors(FIT_UP, FIT_AXIS.set(dx / len, dy / len, dz / len));
  mesh.scale.set(radius * 2, len, radius * 2);
}

// ---------------------------------------------------------------------------
// Clothes
// ---------------------------------------------------------------------------

/**
 * Dress the torso group.
 *
 * Four colours and no cloth simulation, so the whole outfit is: a lathed body
 * in the jacket colour, a soft shirt front proud of it, two lapels, and
 * whatever the accent lands on. The seated postures get a lap, which is added
 * to the root rather than the torso because a thigh does not follow a lean.
 *
 * One fabric is also a shape here, and exactly one — see the `brocade` note
 * below for why that is not the beginning of a fabric-by-fabric wardrobe. The
 * other fourteen are reflectance, and reflectance is `clothSurface`'s.
 */
export function dressTorso(
  torso: Group, look: Look, p: Proportions, l: Leases,
): Mesh {
  const { jacket, shirt, trousers, fabric } = look.outfit;

  const body = new Mesh(torsoShell(l), clothSurface(l, jacket, fabric));
  body.scale.set(p.torsoW, p.torsoH, p.torsoD);
  body.castShadow = true;
  torso.add(body);

  // Shirt front — a soft mass sitting proud of the jacket, so the two read as
  // layers rather than as a decal.
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
  const front = new Mesh(orb(l), clothSurface(l, shirt, fabric));
  front.scale.set(p.torsoW * 0.34, p.torsoH * 0.48, p.torsoD * 0.34);
  front.position.set(0, p.torsoH * 0.74, p.torsoD * 0.34);
  torso.add(front);

  const lapelMat = clothSurface(l, shade(jacket, -0.07), fabric);
  for (const s of [SIDE.left, SIDE.right]) {
    const lapel = new Mesh(slab(l), lapelMat);
    lapel.scale.set(p.torsoW * 0.13, p.torsoH * 0.36, p.torsoD * 0.10);
    lapel.position.set(s * p.torsoW * 0.14, p.torsoH * 0.76, p.torsoD * 0.42);
    lapel.rotation.z = -s * 0.20;
    torso.add(lapel);
  }

  // Hips, in the trousers colour, and the mass both thighs come out of. It has
  // to be wide and deep enough to bury the top of each one — see the socket in
  // `performer-legs.ts`, which sits at 30 % of the shoulder width and is inside
  // this by a comfortable margin.
  const hips = new Mesh(orb(l), clothSurface(l, trousers, fabric));
  hips.scale.set(p.torsoW * 0.88, p.torsoH * 0.34, p.torsoD * 0.98);
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

  return body;
}

// ---------------------------------------------------------------------------
// Hair
// ---------------------------------------------------------------------------

/**
 * Sixteen styles, nearly all built from the same three primitives.
 *
 * Two of them are load-bearing. The crown is an ellipsoid pushed back and up
 * so the hairline clears the brows, and it is all a short style needs. The
 * shell is a whole head of hair for the styles that hang: everything with
 * length — a bob's wings, a curtain, the fall down the nape, a rope — grows out
 * of that rather than being asked to cover the skull as well as reach. A
 * beehive's tower and seven curls still sit on the crown. `hood` and `wrap` are
 * the odd ones out: they are cloth rather than hair, and both need an open shell
 * so the face is a hole in the geometry rather than a hole in a texture.
 *
 * ## The one number every style here is written against
 *
 * The face lives between `z +0.76R` and `z +1.03R` — brow, eye, cheek, nose,
 * lip, in that order outward — and hair is seen *along* that axis from the
 * house. So the recurring question below is not how long a style is but how far
 * forward it comes at the height of the eyes, and almost every position in this
 * function is the answer to it. Mass that reaches the face does not sit beside
 * it; it is drawn over the whole of it. An afro is a case in point: it is a
 * 42-centimetre ellipsoid and the only reason it is not a helmet is that its
 * centre is `0.85R` behind the skull's, which buys back everything the width
 * costs at eye level and nothing at all at the crown.
 */
export function buildHair(
  head: Object3D, look: Look, p: Proportions, l: Leases, rng: Rng,
): void {
  const R = p.headR;
  const style: HairStyle = look.hairStyle;
  const mat = hairSurface(l, look.hair);

  const crown = (sx: number, sy: number, sz: number, y: number, z: number): Mesh => {
    const m = new Mesh(orb(l), mat);
    m.scale.set(R * sx, R * sy, R * sz);
    m.position.set(0, R * y, R * z);
    m.castShadow = true;
    head.add(m);
    return m;
  };

  /**
   * A whole head of hair, for the styles that cover more of the skull than a
   * crown does.
   *
   * It is the skull's own ellipsoid — 2 × 2.10 × 1.90 R — inflated about a
   * sixth and pushed back, and that one relationship does all the work. A
   * scaled copy of a convex shape is proud of it everywhere the surface turns
   * away and buried behind it everywhere it turns towards you, so this is
   * outside the skin over the crown, the temples, the sides and the nape, and
   * inside it across the whole face: brow, eye, cheek, nose, lip and chin end
   * up clear without a single number being tuned against any of them. What is
   * left is a head of hair with a face-shaped hole in it.
   *
   * It matters because the hanging styles were built without one. A bob and a
   * curtain were each asked to cover the head *and* be the length, from
   * masses parked beside the skull, and both failed the same way: the slab
   * either reached forward far enough to lie down the cheek, or sat back far
   * enough to leave bare scalp between itself and the crown. With a shell
   * underneath, length is only length.
   */
  const shell = (): void => {
    const m = new Mesh(orb(l), mat);
    m.scale.set(R * 2.36, R * 2.58, R * 2.30);
    m.position.set(0, -R * 0.10, -R * 0.38);
    m.castShadow = true;
    head.add(m);
  };

  switch (style) {
    case 'bald':
      break;

    case 'short':
      crown(2.06, 1.16, 2.06, 0.54, -0.18);
      break;

    case 'slick': {
      const c = crown(2.04, 1.04, 2.12, 0.56, -0.22);
      c.material = surface(l, look.hair, { roughness: 0.26, metalness: 0.16 });
      const quiff = new Mesh(pill(l), c.material);
      quiff.scale.set(R * 0.5, R * 0.42, R * 0.5);
      quiff.position.set(0, R * 1.02, R * 0.42);
      quiff.rotation.x = 0.9;
      head.add(quiff);
      break;
    }

    case 'beehive': {
      crown(2.02, 1.10, 2.02, 0.52, -0.20);
      const tower = new Mesh(orb(l), mat);
      tower.scale.set(R * 1.62, R * 1.85, R * 1.55);
      tower.position.set(0, R * 1.55, R * -0.26);
      tower.castShadow = true;
      head.add(tower);
      const cone = new Mesh(spike(l), mat);
      cone.scale.set(R * 1.30, R * 0.85, R * 1.24);
      cone.position.set(0, R * 2.40, R * -0.26);
      head.add(cone);
      break;
    }

    case 'bob': {
      crown(2.08, 1.18, 2.08, 0.52, -0.20);
      shell();
      // Wings, and the only part of a bob that is a bob: hair held out at full
      // width past the ear and cut off level below the jaw instead of
      // following the skull back in. The shell already covers the head, so
      // these only have to be the shape — which is why they can sit outboard
      // at x ±0.88R and stop at z +0.28R, still behind the widest point of the
      // face. A bob swings forward of the ear; it is never drawn down a cheek,
      // which is what the old pair of slabs at z +0.73R were doing.
      for (const s of [SIDE.left, SIDE.right]) {
        const wing = new Mesh(orb(l), mat);
        wing.scale.set(R * 0.80, R * 1.85, R * 1.24);
        wing.position.set(s * R * 0.88, -R * 0.62, -R * 0.34);
        wing.castShadow = true;
        head.add(wing);
      }
      break;
    }

    case 'long': {
      crown(2.08, 1.18, 2.08, 0.52, -0.20);
      shell();
      for (const s of [SIDE.left, SIDE.right]) {
        // Curtains, and the two numbers that keep them curtains. The top at
        // y +0.30R is inside the shell rather than level with it, so the fall
        // grows out of the hair instead of hanging behind a bare head — the
        // fault that had these parked at z -0.80R, where they read as boards
        // beside a skull from every angle but dead-on. And the front edge at
        // z +0.26R stays behind the cheek and a long way behind the brow, nose
        // and lip line at +0.76R and out, because a head in profile is seen
        // *along* this axis: a curtain that reaches the face does not sit
        // beside it, it is drawn over the whole of it.
        const fall = new Mesh(orb(l), mat);
        fall.scale.set(R * 0.76, R * 3.20, R * 1.20);
        fall.position.set(s * R * 0.92, -R * 1.30, -R * 0.34);
        fall.castShadow = true;
        head.add(fall);
      }
      const back = new Mesh(orb(l), mat);
      back.scale.set(R * 1.95, R * 3.25, R * 1.00);
      back.position.set(0, -R * 1.32, -R * 0.80);
      back.castShadow = true;
      head.add(back);
      break;
    }

    case 'mane': {
      // `long` with more of it would be a synonym, so this is not that. Two
      // things separate them and both are about where the hair *ends* rather
      // than how much there is. It falls past the shoulder blades rather than
      // to the shoulder line, which is the difference between a haircut and a
      // mass; and a pair of locks come forward over the collarbones, which is
      // the thing `long`'s curtains never do — they stop at the jaw and leave
      // the shoulders bare. A head bent over a guitar should disappear into
      // this, and the front locks are most of why it does.
      crown(2.08, 1.18, 2.08, 0.52, -0.20);
      shell();
      for (const s of [SIDE.left, SIDE.right]) {
        const fall = new Mesh(orb(l), mat);
        fall.scale.set(R * 0.92, R * 4.40, R * 1.34);
        fall.position.set(s * R * 0.94, -R * 1.75, -R * 0.26);
        fall.castShadow = true;
        head.add(fall);
        // Forward of the ear and nowhere near the cheek: the front edge lands
        // at z +0.61R, still well behind the brow line.
        const front = new Mesh(orb(l), mat);
        front.scale.set(R * 0.62, R * 2.10, R * 0.62);
        front.position.set(s * R * 0.80, -R * 1.40, R * 0.30);
        front.castShadow = true;
        head.add(front);
      }
      const back = new Mesh(orb(l), mat);
      back.scale.set(R * 2.15, R * 4.60, R * 1.10);
      back.position.set(0, -R * 1.85, -R * 0.78);
      back.castShadow = true;
      head.add(back);
      break;
    }

    case 'mullet': {
      // Short from the front and long from the side, which is the entire joke
      // and also the entire geometry. There is deliberately nothing beside the
      // face — a mullet with curtains is `long` — so the crown is the one from
      // `short`, the tail hangs off the occiput alone, and the two flicks over
      // the ears exist only so the tail has somewhere to have come from.
      crown(2.08, 1.16, 2.08, 0.54, -0.18);
      const tail = new Mesh(orb(l), mat);
      tail.scale.set(R * 1.44, R * 2.60, R * 1.05);
      tail.position.set(0, -R * 1.10, -R * 0.78);
      tail.castShadow = true;
      head.add(tail);
      for (const s of [SIDE.left, SIDE.right]) {
        const flick = new Mesh(orb(l), mat);
        flick.scale.set(R * 0.70, R * 0.85, R * 1.30);
        flick.position.set(s * R * 0.92, -R * 0.30, -R * 0.42);
        head.add(flick);
      }
      break;
    }

    case 'dreadlocks': {
      // Ropes, and the reason they are ten separate meshes rather than one
      // shaped mass is that they are the only hair in this file with *gaps* in
      // it. A back light goes between them, the silhouette is a comb rather
      // than a slab, and a head turn moves them at slightly different times.
      // A single ellipsoid does none of that and reads as `long` in a wig.
      shell();
      const n = 10;
      for (let i = 0; i < n; i++) {
        // Round the head from the right temple, backwards, to the left, with
        // the front 90° left out — a lock over the nose is not a hairstyle.
        const a = Math.PI * (0.75 + (i / (n - 1)) * 1.50);
        const half = R * rng.float(0.95, 1.42);
        const lock = new Mesh(pill(l), mat);
        lock.scale.set(R * 0.30, half, R * 0.30);
        const x = Math.cos(a) * R * 0.90;
        lock.position.set(x, R * 0.14 - half, Math.sin(a) * R * 0.86 - R * 0.14);
        // Flared out at the tip, away from whichever side it grew on.
        lock.rotation.z = (x >= 0 ? 1 : -1) * rng.float(0.06, 0.18);
        lock.castShadow = true;
        head.add(lock);
      }
      break;
    }

    case 'braids': {
      // A tight scalp and one heavy plait behind it. Cornrows themselves are a
      // pattern rather than a shape and there is no honest way to build one
      // here — a row is an arc over a curved skull and a straight capsule laid
      // across it is buried at the crown and floating at both ends — so what is
      // built is what a row of them *becomes*, which is the plait, and which is
      // also the Nordic and the country one. The five knots are the read: a
      // braid is a segmented rope and a smooth one is a ponytail.
      crown(2.04, 1.10, 2.06, 0.52, -0.20);
      for (let i = 0; i < 5; i++) {
        const knot = new Mesh(orb(l), mat);
        const w = R * (0.66 - 0.07 * i);
        knot.scale.set(w, w * 1.10, w);
        knot.position.set(
          // Alternating sides by a few millimetres, which is what makes the
          // stack a plait instead of a string of beads.
          (i % 2 === 0 ? 1 : -1) * R * 0.08,
          -R * 0.55 * i,
          -R * (0.98 + 0.04 * i),
        );
        knot.castShadow = true;
        head.add(knot);
      }
      break;
    }

    case 'mohawk': {
      // The only style here that is mostly skull, and it has no crown at all
      // for that reason: shaved sides mean the head's own skin is the hair.
      // Eight cones rather than one fin, because the fin has to *follow* the
      // skull and a straight ridge cannot — its height is solved per cone from
      // the skull's own ellipse, so the crest grows out of the head at the
      // hairline and again at the nape without a number being tuned.
      const n = 8;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const z = R * (0.68 - 1.44 * t);
        const skull = R * 1.05 * Math.sqrt(Math.max(0, 1 - (z / (R * 0.95)) ** 2));
        const h = R * (0.55 + 1.20 * Math.sin(Math.PI * t));
        const fin = new Mesh(spike(l), mat);
        // Bases wider than the spacing, so the crest is continuous.
        fin.scale.set(R * 0.44, h, R * 0.54);
        fin.position.set(0, skull + h * 0.42, z);
        fin.castShadow = true;
        head.add(fin);
      }
      break;
    }

    case 'afro': {
      // See the header: the width is free and the depth is not. The halo's
      // centre sits 0.85R behind the skull's, which puts its front edge at
      // z +0.59R at eye level and z +0.69R at the brow — behind the face
      // everywhere it matters — while costing nothing at the crown, where there
      // is no face to clear. The crown underneath is not decoration; without it
      // a hairline of bare scalp shows between the forehead and the halo.
      crown(2.02, 1.14, 2.04, 0.52, -0.18);
      const halo = new Mesh(orb(l), mat);
      halo.scale.set(R * 3.30, R * 2.95, R * 3.10);
      halo.position.set(0, R * 0.55, -R * 0.85);
      halo.castShadow = true;
      head.add(halo);
      // Seven lumps on the silhouette itself. An ellipsoid this size has a
      // perfect edge and nothing else in the room does; these break it.
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (-0.14 + (i / 6) * 1.28) + rng.float(-0.12, 0.12);
        const bump = new Mesh(bead(l), mat);
        bump.scale.setScalar(R * rng.float(0.52, 0.82));
        bump.position.set(
          Math.cos(a) * R * 1.60,
          R * 0.55 + Math.sin(a) * R * 1.42,
          -R * 0.85,
        );
        head.add(bump);
      }
      break;
    }

    case 'updo': {
      // The least geometry of any style here, and that is what it is for. A
      // platform player's hair is *controlled* — the shape is the absence of
      // one — so it is a smooth crown and a knot, and the only thing carrying
      // it is the surface: pinned hair runs a single band of light round the
      // skull the way `slick` does, where a matte crown would read as short.
      const c = crown(2.02, 1.08, 2.04, 0.52, -0.22);
      c.material = surface(l, look.hair, { roughness: 0.34, metalness: 0.10 });
      const bun = new Mesh(orb(l), c.material);
      bun.scale.set(R * 1.22, R * 1.10, R * 1.12);
      bun.position.set(0, -R * 0.10, -R * 1.18);
      bun.castShadow = true;
      head.add(bun);
      break;
    }

    case 'curls': {
      crown(1.94, 1.02, 1.94, 0.50, -0.20);
      // Seeded, so the same performer has the same head of hair every show.
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + rng.float(-0.2, 0.2);
        const t = rng.float(0.25, 0.95);
        const curl = new Mesh(bead(l), mat);
        const r = R * rng.float(0.62, 0.92);
        curl.scale.setScalar(r);
        curl.position.set(
          Math.cos(a) * R * 0.92 * Math.sin(t * Math.PI * 0.72),
          R * (0.35 + 0.85 * Math.cos(t * Math.PI * 0.72)),
          Math.sin(a) * R * 0.92 * Math.sin(t * Math.PI * 0.72) - R * 0.20,
        );
        head.add(curl);
      }
      break;
    }

    case 'hood': {
      // Outerwear, in the jacket's colour. Double sided, because you can see
      // the inside of a hood from most seats in the house.
      const shell = new Mesh(hoodShell(l), surface(l, shade(look.outfit.jacket, -0.05), {
        roughness: 0.92, metalness: 0, doubleSide: true,
      }));
      shell.scale.set(R * 2.70, R * 2.80, R * 2.80);
      shell.position.set(0, R * 0.06, -R * 0.24);
      shell.castShadow = true;
      head.add(shell);
      break;
    }

    case 'wrap': {
      // The same open shell as a hood and three deliberate differences from
      // one, because at ten metres those are the whole distinction. It is cut
      // to the skull rather than standing off it, so it is a covered head and
      // not a garment with a head somewhere inside; it takes the accent colour
      // rather than the jacket's, because a scarf over the hair is the one
      // loud thing a player in an otherwise plain outfit is wearing; and it
      // falls onto the shoulders, where a hood hangs behind them.
      const cloth = surface(l, look.outfit.accent, {
        roughness: 0.90, metalness: 0.04, doubleSide: true,
      });
      const cover = new Mesh(hoodShell(l), cloth);
      cover.scale.set(R * 2.32, R * 2.44, R * 2.40);
      cover.position.set(0, R * 0.02, -R * 0.16);
      cover.castShadow = true;
      head.add(cover);
      for (const s of [SIDE.left, SIDE.right]) {
        const fall = new Mesh(orb(l), cloth);
        fall.scale.set(R * 0.86, R * 2.10, R * 1.20);
        fall.position.set(s * R * 0.88, -R * 0.85, -R * 0.34);
        fall.castShadow = true;
        head.add(fall);
      }
      break;
    }

    default:
      // See the header. Not reachable, and that is the point: a new value in
      // `HairStyle` fails here rather than walking on stage bald.
      assertBuilt(style);
  }
}

// ---------------------------------------------------------------------------
// Accessories
// ---------------------------------------------------------------------------

export interface Attachments {
  head: Object3D;
  torso: Object3D;
  /** Shoulder height in the torso group's own frame, for collars and scarves. */
  neckY: number;
}

/** Twenty of them, each one built where it belongs and never anywhere else. */
export function buildAccessories(
  at: Attachments, look: Look, p: Proportions, l: Leases,
): void {
  for (const a of look.accessories) buildAccessory(a, at, look, p, l);
}

function buildAccessory(
  a: Accessory, at: Attachments, look: Look, p: Proportions, l: Leases,
): void {
  const R = p.headR;
  const { head, torso } = at;
  const accent = look.outfit.accent;

  switch (a) {
    case 'glasses': {
      const frame = surface(l, '#2b2b30', { roughness: 0.4, metalness: 0.3 });
      for (const s of [SIDE.left, SIDE.right]) {
        const rim = new Mesh(hoop(l), frame);
        rim.scale.set(R * 0.68, R * 0.62, R * 0.68);
        rim.position.set(s * R * 0.36, R * 0.12, R * 0.90);
        head.add(rim);
        const arm = new Mesh(slab(l), frame);
        arm.scale.set(R * 0.05, R * 0.05, R * 0.80);
        arm.position.set(s * R * 0.72, R * 0.16, R * 0.50);
        head.add(arm);
      }
      const bridge = new Mesh(slab(l), frame);
      bridge.scale.set(R * 0.24, R * 0.05, R * 0.05);
      bridge.position.set(0, R * 0.16, R * 0.92);
      head.add(bridge);
      break;
    }

    case 'sunglasses': {
      const frame = surface(l, '#17171b', { roughness: 0.3, metalness: 0.35 });
      const lens = surface(l, '#0d0d12', { roughness: 0.12, metalness: 0.6 });
      for (const s of [SIDE.left, SIDE.right]) {
        const glass = new Mesh(disc(l), lens);
        glass.scale.set(R * 0.70, R * 0.56, 1);
        glass.position.set(s * R * 0.36, R * 0.12, R * 0.93);
        head.add(glass);
        const rim = new Mesh(hoop(l), frame);
        rim.scale.set(R * 0.76, R * 0.62, R * 0.60);
        rim.position.set(s * R * 0.36, R * 0.12, R * 0.92);
        head.add(rim);
        const arm = new Mesh(slab(l), frame);
        arm.scale.set(R * 0.06, R * 0.06, R * 0.80);
        arm.position.set(s * R * 0.74, R * 0.16, R * 0.50);
        head.add(arm);
      }
      break;
    }

    case 'wraparounds': {
      // One band, not two discs, and that is the only reason this is not
      // `sunglasses` in a different frame. A single ellipsoid does it: wide
      // enough to pass outboard of both temples, shallow enough in `y` to be a
      // visor rather than a mask, and it curves round the face for free because
      // that is what an ellipsoid does.
      const lens = surface(l, '#101014', { roughness: 0.10, metalness: 0.72 });
      const visor = new Mesh(orb(l), lens);
      visor.scale.set(R * 1.92, R * 0.58, R * 1.16);
      visor.position.set(0, R * 0.14, R * 0.44);
      head.add(visor);
      for (const s of [SIDE.left, SIDE.right]) {
        const arm = new Mesh(slab(l), lens);
        arm.scale.set(R * 0.07, R * 0.07, R * 0.80);
        arm.position.set(s * R * 0.94, R * 0.18, R * 0.42);
        head.add(arm);
      }
      break;
    }

    case 'porkpie': {
      const felt = surface(l, shade(look.outfit.jacket, -0.16), { roughness: 0.95 });
      const crown = new Mesh(tube(l), felt);
      crown.scale.set(R * 2.02, R * 0.62, R * 2.02);
      crown.position.set(0, R * 1.00, -R * 0.12);
      crown.castShadow = true;
      head.add(crown);
      const brim = new Mesh(tube(l), felt);
      brim.scale.set(R * 2.90, R * 0.09, R * 2.90);
      brim.position.set(0, R * 0.70, -R * 0.12);
      brim.castShadow = true;
      head.add(brim);
      const band = new Mesh(tube(l), surface(l, accent, { roughness: 0.7 }));
      band.scale.set(R * 2.07, R * 0.18, R * 2.07);
      band.position.set(0, R * 0.80, -R * 0.12);
      head.add(band);
      break;
    }

    case 'flatcap': {
      const cloth = surface(l, shade(look.outfit.jacket, -0.10), { roughness: 0.95 });
      const dome = new Mesh(orb(l), cloth);
      dome.scale.set(R * 2.16, R * 1.02, R * 2.20);
      dome.position.set(0, R * 0.62, -R * 0.20);
      dome.castShadow = true;
      head.add(dome);
      const peak = new Mesh(orb(l), cloth);
      peak.scale.set(R * 1.40, R * 0.14, R * 1.10);
      peak.position.set(0, R * 0.44, R * 0.86);
      peak.rotation.x = -0.16;
      head.add(peak);
      break;
    }

    case 'ballcap': {
      // Backwards, and that is a decision rather than a shortcut. `flatcap`
      // already covers a soft cap with the peak the right way round, so a
      // second forward-peaked cap would be one hat with two names; and a peak
      // over the brows puts the whole face in shadow under a follow spot, which
      // is a real cost on the one player most likely to be wearing it. In the
      // accent colour, because a cap is a statement where a flat cap is part of
      // the suit.
      const cloth = surface(l, accent, { roughness: 0.85 });
      const dome = new Mesh(orb(l), cloth);
      dome.scale.set(R * 2.22, R * 1.42, R * 2.26);
      dome.position.set(0, R * 0.58, -R * 0.16);
      dome.castShadow = true;
      head.add(dome);
      const peak = new Mesh(orb(l), cloth);
      peak.scale.set(R * 1.55, R * 0.18, R * 1.30);
      peak.position.set(0, R * 0.42, -R * 1.16);
      // Tipped up at the far end, which is what a peak does when the head it
      // is sitting on slopes away underneath it.
      peak.rotation.x = 0.20;
      head.add(peak);
      const button = new Mesh(bead(l), cloth);
      button.scale.setScalar(R * 0.20);
      button.position.set(0, R * 1.28, -R * 0.16);
      head.add(button);
      break;
    }

    case 'beanie': {
      // A dome and a rolled hem, and the hem is the whole silhouette — without
      // it this is a swimming cap. The roll is the fat torus the scarf uses,
      // laid flat round the skull at brow height, which is exactly where a
      // beanie is pulled down to and just clear of the top of the eyes.
      const knit = surface(l, shade(look.outfit.jacket, -0.12), { roughness: 0.98 });
      const dome = new Mesh(orb(l), knit);
      dome.scale.set(R * 2.24, R * 1.45, R * 2.26);
      dome.position.set(0, R * 0.66, -R * 0.20);
      dome.castShadow = true;
      head.add(dome);
      const roll = new Mesh(collar(l), knit);
      roll.scale.set(R * 2.30, R * 2.30, R * 0.90);
      roll.rotation.x = Math.PI / 2;
      roll.position.set(0, R * 0.50, -R * 0.14);
      head.add(roll);
      break;
    }

    case 'cowboyhat': {
      // The one hat in the union that is read from its *outline* rather than
      // from its colour: a brim two and a half heads across, and a crown twice
      // the height of the porkpie's. The two turned edges are what stop it
      // being a lampshade — a flat disc that wide reads as a table.
      const felt = surface(l, shade(look.outfit.jacket, -0.14), { roughness: 0.96 });
      const crown = new Mesh(tube(l), felt);
      crown.scale.set(R * 1.96, R * 1.55, R * 1.90);
      crown.position.set(0, R * 1.42, -R * 0.12);
      crown.castShadow = true;
      head.add(crown);
      const brim = new Mesh(tube(l), felt);
      brim.scale.set(R * 3.60, R * 0.10, R * 3.20);
      brim.position.set(0, R * 0.66, -R * 0.12);
      brim.castShadow = true;
      head.add(brim);
      for (const s of [SIDE.left, SIDE.right]) {
        const curl = new Mesh(slab(l), felt);
        curl.scale.set(R * 0.40, R * 0.44, R * 2.60);
        curl.position.set(s * R * 1.70, R * 0.80, -R * 0.12);
        curl.rotation.z = -s * 0.55;
        head.add(curl);
      }
      const band = new Mesh(tube(l), surface(l, accent, { roughness: 0.7 }));
      band.scale.set(R * 2.01, R * 0.22, R * 1.95);
      band.position.set(0, R * 0.82, -R * 0.12);
      head.add(band);
      break;
    }

    case 'bandana': {
      // Tied at the brow rather than perched on the crown, which is the tell:
      // it sits lower than any hat here and covers the hairline entirely. The
      // knot and the two tails behind are what separate it from a swim cap, and
      // they are the part that shows when the player is facing the drummer.
      const cloth = surface(l, accent, { roughness: 0.92 });
      const cap = new Mesh(orb(l), cloth);
      cap.scale.set(R * 2.12, R * 1.20, R * 2.16);
      cap.position.set(0, R * 0.54, -R * 0.22);
      cap.castShadow = true;
      head.add(cap);
      const knot = new Mesh(bead(l), cloth);
      knot.scale.setScalar(R * 0.44);
      knot.position.set(0, R * 0.06, -R * 1.06);
      head.add(knot);
      for (const s of [SIDE.left, SIDE.right]) {
        const tail = new Mesh(slab(l), cloth);
        tail.scale.set(R * 0.26, R * 1.05, R * 0.10);
        tail.position.set(s * R * 0.20, -R * 0.55, -R * 1.10);
        tail.rotation.z = s * 0.16;
        head.add(tail);
      }
      break;
    }

    case 'turban': {
      // Bulk *above* the skull with a brow band under it, which is the shape
      // wrapped cloth actually takes and the reason this is an accessory rather
      // than a hairstyle: hair shows below it. That is also what earns it twice
      // over — over a shaved head or an updo it is a turban, and over
      // `dreadlocks` it is the tam, which is the same object from the stalls.
      const cloth = surface(l, accent, { roughness: 0.88, metalness: 0.05 });
      const bulk = new Mesh(orb(l), cloth);
      bulk.scale.set(R * 2.46, R * 1.90, R * 2.46);
      bulk.position.set(0, R * 1.00, -R * 0.14);
      bulk.castShadow = true;
      head.add(bulk);
      for (let i = 0; i < 2; i++) {
        const k = 2.30 - i * 0.28;
        const wind = new Mesh(collar(l), cloth);
        wind.scale.set(R * k, R * k, R * 0.80);
        wind.rotation.x = Math.PI / 2;
        wind.position.set(0, R * (0.52 + i * 0.52), -R * 0.14);
        head.add(wind);
      }
      break;
    }

    case 'tie': {
      const silk = surface(l, accent, { roughness: 0.35, metalness: 0.12 });
      const knot = new Mesh(slab(l), silk);
      knot.scale.set(p.torsoW * 0.10, p.torsoH * 0.06, p.torsoD * 0.14);
      knot.position.set(0, p.torsoH * 0.93, p.torsoD * 0.44);
      torso.add(knot);
      const blade = new Mesh(slab(l), silk);
      blade.scale.set(p.torsoW * 0.11, p.torsoH * 0.42, p.torsoD * 0.10);
      blade.position.set(0, p.torsoH * 0.68, p.torsoD * 0.46);
      torso.add(blade);
      break;
    }

    case 'bowtie': {
      const silk = surface(l, accent, { roughness: 0.35, metalness: 0.12 });
      for (const s of [SIDE.left, SIDE.right]) {
        const wing = new Mesh(slab(l), silk);
        wing.scale.set(p.torsoW * 0.13, p.torsoH * 0.07, p.torsoD * 0.10);
        wing.position.set(s * p.torsoW * 0.09, p.torsoH * 0.95, p.torsoD * 0.44);
        wing.rotation.z = s * 0.28;
        torso.add(wing);
      }
      const middle = new Mesh(bead(l), silk);
      middle.scale.set(p.torsoW * 0.05, p.torsoH * 0.05, p.torsoD * 0.08);
      middle.position.set(0, p.torsoH * 0.95, p.torsoD * 0.47);
      torso.add(middle);
      break;
    }

    case 'scarf': {
      const wool = surface(l, accent, { roughness: 0.98 });
      const loop = new Mesh(collar(l), wool);
      loop.scale.set(p.torsoW * 0.86, p.torsoW * 0.86, p.torsoD * 1.20);
      loop.rotation.x = Math.PI / 2;
      loop.position.set(0, at.neckY, 0);
      torso.add(loop);
      const tail = new Mesh(slab(l), wool);
      tail.scale.set(p.torsoW * 0.16, p.torsoH * 0.40, p.torsoD * 0.10);
      tail.position.set(p.torsoW * 0.16, at.neckY - p.torsoH * 0.22, p.torsoD * 0.40);
      tail.rotation.z = 0.10;
      torso.add(tail);
      break;
    }

    case 'towel': {
      // A scarf is worn and this is *used*, which is a distinction the eye
      // makes instantly and which lives in two numbers: it is off-white
      // towelling rather than the accent colour — the one thing on a performer
      // that is not part of an outfit — and it hangs in two even falls rather
      // than one thrown tail, because it was put there straight and nobody has
      // arranged it since.
      const terry = surface(l, '#e6e2d8', { roughness: 1 });
      const loop = new Mesh(collar(l), terry);
      loop.scale.set(p.torsoW * 0.80, p.torsoW * 0.80, p.torsoD * 1.10);
      loop.rotation.x = Math.PI / 2;
      loop.position.set(0, at.neckY, 0);
      torso.add(loop);
      for (const s of [SIDE.left, SIDE.right]) {
        const fall = new Mesh(slab(l), terry);
        fall.scale.set(p.torsoW * 0.20, p.torsoH * 0.46, p.torsoD * 0.10);
        fall.position.set(s * p.torsoW * 0.17, at.neckY - p.torsoH * 0.25, p.torsoD * 0.50);
        fall.rotation.z = s * 0.05;
        torso.add(fall);
      }
      break;
    }

    case 'chain': {
      // No rotation, for the reason the headphone band carries the note: a
      // torus already lies in the `xy` plane, and that is the plane a chain
      // hangs in against a chest. Turned flat like the scarf's loop it would be
      // a ring round the neck seen edge-on, which from the house is a line.
      const metal = surface(l, accent, { roughness: 0.16, metalness: 0.95 });
      const loop = new Mesh(hoop(l), metal);
      loop.scale.set(p.torsoW * 0.44, p.torsoH * 0.28, p.torsoD * 0.30);
      loop.position.set(0, at.neckY - p.torsoH * 0.18, p.torsoD * 0.44);
      torso.add(loop);
      const pendant = new Mesh(bead(l), metal);
      pendant.scale.setScalar(p.torsoW * 0.09);
      pendant.position.set(0, at.neckY - p.torsoH * 0.32, p.torsoD * 0.48);
      torso.add(pendant);
      break;
    }

    case 'beard': {
      const hair = hairSurface(l, look.hair);
      const chin = new Mesh(orb(l), hair);
      chin.scale.set(R * 1.58, R * 1.18, R * 1.58);
      chin.position.set(0, -R * 0.56, -R * 0.02);
      chin.castShadow = true;
      head.add(chin);
      break;
    }

    case 'moustache': {
      const hair = hairSurface(l, look.hair);
      const tache = new Mesh(pill(l), hair);
      tache.scale.set(R * 0.13, R * 0.32, R * 0.13);
      tache.rotation.z = Math.PI / 2;
      tache.position.set(0, -R * 0.26, R * 0.84);
      head.add(tache);
      break;
    }

    case 'earrings': {
      const metal = surface(l, accent, { roughness: 0.18, metalness: 0.9 });
      for (const s of [SIDE.left, SIDE.right]) {
        const stud = new Mesh(bead(l), metal);
        stud.scale.setScalar(R * 0.20);
        stud.position.set(s * R * 0.99, -R * 0.30, R * 0.04);
        head.add(stud);
      }
      break;
    }

    case 'hoops': {
      // Hung from the same lobe the stud sits on, and in the `xy` plane for the
      // same reason the chain is: a hoop turned front-to-back is edge-on to
      // every seat in the house and reads as a scratch on the jaw. This one is
      // a ring below the jawline that catches the key light and swings with a
      // head turn, which is the entire point of the shape.
      const metal = surface(l, accent, { roughness: 0.18, metalness: 0.9 });
      for (const s of [SIDE.left, SIDE.right]) {
        const lobe = new Mesh(bead(l), metal);
        lobe.scale.setScalar(R * 0.15);
        lobe.position.set(s * R * 0.99, -R * 0.30, R * 0.04);
        head.add(lobe);
        const ring = new Mesh(hoop(l), metal);
        ring.scale.set(R * 0.66, R * 0.66, R * 0.44);
        ring.position.set(s * R * 0.97, -R * 0.62, R * 0.06);
        head.add(ring);
      }
      break;
    }

    case 'headphones': {
      const shell = surface(l, '#20202a', { roughness: 0.5, metalness: 0.2 });
      const band = new Mesh(hoop(l), shell);
      band.scale.set(R * 2.45, R * 2.40, R * 2.40);
      // No rotation, and that is the fix rather than an omission. A
      // `TorusGeometry` already lies in the `xy` plane, which for a head is the
      // ear-over-crown-to-ear arc a headband actually takes. The quarter turn
      // that used to be here stood the ring up in `yz` instead — over the face
      // and down the back of the skull — while the cups stayed at `±x`, so the
      // band and the things it is supposed to join were at right angles.
      band.position.set(0, R * 0.28, -R * 0.06);
      head.add(band);
      for (const s of [SIDE.left, SIDE.right]) {
        const cup = new Mesh(tube(l), shell);
        cup.scale.set(R * 0.92, R * 0.34, R * 0.92);
        cup.rotation.z = Math.PI / 2;
        cup.position.set(s * R * 1.06, -R * 0.06, -R * 0.04);
        head.add(cup);
      }
      break;
    }

    default:
      assertBuilt(a);
  }
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
 */
function assertBuilt(_unbuilt: never): void { /* see above */ }

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
