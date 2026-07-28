/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * `Look` and `Posture` made physical: proportions, clothes, hair, accessories.
 *
 * Nothing here chooses anything. The genre and the era decided the sequinned
 * jacket and the beehive long before this file ran — see `concert/cast.ts` —
 * and the job here is to render the eight hair styles and the eleven
 * accessories the contract names, not to have opinions about which suits a
 * trombonist. Every branch below is a `switch` over a frozen union, which is
 * deliberate: adding a hair style to `concert/types.ts` should fail the build
 * here rather than quietly produce a bald accordionist.
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
// Clothes
// ---------------------------------------------------------------------------

/**
 * Dress the torso group.
 *
 * Four colours and no cloth simulation, so the whole outfit is: a lathed body
 * in the jacket colour, a soft shirt front proud of it, two lapels, and
 * whatever the accent lands on. The seated postures get a lap, which is added
 * to the root rather than the torso because a thigh does not follow a lean.
 */
export function dressTorso(
  torso: Group, look: Look, p: Proportions, l: Leases,
): Mesh {
  const { jacket, shirt, trousers } = look.outfit;

  const body = new Mesh(torsoShell(l), clothSurface(l, jacket));
  body.scale.set(p.torsoW, p.torsoH, p.torsoD);
  body.castShadow = true;
  torso.add(body);

  // Shirt front — a soft mass sitting proud of the jacket, so the two read as
  // layers rather than as a decal.
  const front = new Mesh(orb(l), clothSurface(l, shirt));
  front.scale.set(p.torsoW * 0.34, p.torsoH * 0.48, p.torsoD * 0.34);
  front.position.set(0, p.torsoH * 0.74, p.torsoD * 0.34);
  torso.add(front);

  const lapelMat = clothSurface(l, shade(jacket, -0.07));
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
  const hips = new Mesh(orb(l), clothSurface(l, trousers));
  hips.scale.set(p.torsoW * 0.88, p.torsoH * 0.34, p.torsoD * 0.98);
  hips.position.set(0, -p.torsoH * 0.05, 0);
  hips.castShadow = true;
  torso.add(hips);

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
 * Eight styles, all built from the same three primitives.
 *
 * The crown is the load-bearing part: an ellipsoid pushed back and up so the
 * hairline clears the brows. Everything else — a bob's side masses, a
 * beehive's tower, seven curls — hangs off that. `hood` is the odd one: it is
 * jacket-coloured outerwear, not hair, and it needs an open shell so the face
 * is a hole in the geometry rather than a hole in a texture.
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
      for (const s of [SIDE.left, SIDE.right]) {
        const side = new Mesh(orb(l), mat);
        side.scale.set(R * 0.62, R * 1.60, R * 1.90);
        side.position.set(s * R * 0.88, -R * 0.30, -R * 0.22);
        side.castShadow = true;
        head.add(side);
      }
      const back = new Mesh(orb(l), mat);
      back.scale.set(R * 1.90, R * 1.70, R * 0.90);
      back.position.set(0, -R * 0.16, -R * 0.86);
      head.add(back);
      break;
    }

    case 'long': {
      crown(2.08, 1.18, 2.08, 0.52, -0.20);
      for (const s of [SIDE.left, SIDE.right]) {
        // Two numbers here are load-bearing, and both are about the profile
        // rather than the front. A head in profile is seen *along* this axis,
        // so a curtain is not merely beside the face — it is drawn over the
        // whole of it. Hence the front edge at z +0.25R, behind the cheek and
        // well behind the brow, nose and lip line at z +0.76R and out: the
        // silhouette that makes a head a face survives the turn. And the top
        // at y +1.26R, barely proud of the crown, because a mass rising past
        // the skull on both sides closes the head into a smooth dark ovoid —
        // the helmet. Length is untouched; it is what makes this style long.
        const side = new Mesh(orb(l), mat);
        side.scale.set(R * 0.60, R * 2.78, R * 1.05);
        side.position.set(s * R * 0.98, -R * 1.52, -R * 0.80);
        side.castShadow = true;
        head.add(side);
      }
      const back = new Mesh(orb(l), mat);
      back.scale.set(R * 1.95, R * 3.40, R * 1.00);
      back.position.set(0, -R * 1.20, -R * 0.82);
      back.castShadow = true;
      head.add(back);
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

/** Eleven of them, each one built where it belongs and never anywhere else. */
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
  }
}

// ---------------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
