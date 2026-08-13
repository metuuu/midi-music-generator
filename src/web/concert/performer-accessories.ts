/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Twenty accessories: what a player wears on the head, the face and the neck.
 *
 * The other third of the old `performer-look.ts`, out for the same reason the
 * hair is — see `performer-hair.ts`. Everything on a head is in multiples of
 * `Proportions.headR` off the head's own centre; everything on a torso is in
 * fractions of the torso the way `dressTorso` builds it, which is why both frames
 * arrive together in `Attachments`.
 *
 * Nothing here chooses anything: `concert/cast.ts` decided that this player has
 * a porkpie and a tie, and decided it under a rule that stops them also having a
 * beanie. The switch ends in a `never` assignment for the reason the hair's does
 * — a missing case is not a compile error but a wardrobe entry that draws
 * nothing, and a genre that asks for a cowboy hat every night gets a player who
 * walks on bare-headed.
 *
 * ## The one thing here that is not written against a bare skull
 *
 * Eight of the twenty go on top of a head that already has hair on it, and until
 * `HairProfile` existed they were each drawn at a fixed multiple of head radius
 * regardless of what was underneath. Every one of them was swallowed by an afro
 * whose halo stands 2.03 R off the skull; a beehive's finial at 2.40 R came out
 * of the top of a beanie and of a cowboy hat; and eight curls broke the sides of
 * both. `HEAD_FIT` and `seat()` below are the whole of the fix, and the point of
 * them is that the rule is written *once* rather than as a case per pairing:
 * every hat says where its own crown ends and whether it is worn pulled on or
 * set on top, and one function does the arithmetic against whatever the hair
 * said it reaches.
 */

import { Group, Mesh, Object3D } from 'three';

import type { Accessory, Look } from '../../concert/types.js';

import {
  Leases, bead, collar, disc, hairSurface, hoop, orb, pill, shade, slab,
  surface, tube,
} from './performer-assets.js';
import type { HairProfile } from './performer-hair.js';
import { SIDE, assertBuilt, type Proportions } from './performer-look.js';

// ---------------------------------------------------------------------------
// Accessories
// ---------------------------------------------------------------------------

export interface Attachments {
  head: Object3D;
  torso: Object3D;
  /** Shoulder height in the torso group's own frame, for collars and scarves. */
  neckY: number;
}

/**
 * How a piece of head furniture meets the hair under it.
 *
 * Two facts, and they are the only two that turn out to matter.
 */
interface HeadFit {
  /**
   * The inside of the crown, above head centre, in multiples of `headR`. Hair
   * has to fit under this or something has to give.
   *
   * The *inside*, not the silhouette, which is why it is a written number and
   * not another `Box3`: a brim is part of the outline and none of the cavity,
   * and no bounding box can tell the two apart. Each one is the top of one named
   * mesh in the case below and is written as that mesh's own arithmetic, so a
   * crown that gets rebuilt shows up here as an obviously stale line rather than
   * as a silently wrong hat.
   */
  cap: number;
  /**
   * What it does when the hair does not fit. `press` is a hat that is pulled
   * *on* and flattens what is under it; `perch` is a hat that is set *on top*
   * and rides whatever height the hair happens to be.
   */
  wear: 'press' | 'perch';
}

/**
 * The eight things worn on a head, and how each one wears.
 *
 * Six perch and two press, and the split is not a judgement call — it is the
 * difference between a hat with a brim you take off by the brim and a hat you
 * pull down over your ears. A cowboy hat sits on top of a beehive, which is a
 * real photograph of Nashville; a beanie over the same beehive does not sit on
 * anything, it swallows it, and the hair is what gives.
 *
 * `headphones` is in the table for the reason it is left out of `cast.ts`'s hat
 * group: it is the one piece of head furniture the wardrobe is allowed to put on
 * top of something else, so it is the one that meets every head in the union
 * rather than a curated few.
 *
 * A hat missing from here is drawn exactly where it was written and is swallowed
 * by anything taller than the skull — which is what all eight used to do, and is
 * the reason `/looks`'s fourth view exists.
 */
const HEAD_FIT: Partial<Record<Accessory, HeadFit>> = {
  // crown, at y 1.00 and 0.62 tall.
  porkpie: { cap: 1.31, wear: 'perch' },
  // dome, at y 0.60 and 0.98 tall. The peak hangs below this and outside it.
  flatcap: { cap: 1.09, wear: 'perch' },
  // dome, at y 0.54 and 1.26 tall. The button rides on the outside of it, and
  // the peak is on a turned group that changes nothing about the cavity.
  ballcap: { cap: 1.17, wear: 'perch' },
  // dome, at y 0.66 and 1.45 tall.
  beanie: { cap: 1.385, wear: 'press' },
  // crown, at y 1.11 and 1.30 tall. The deepest cavity of any hat with a brim,
  // and that is the reason a cowboy hat can be set on top of hair nothing else
  // can — but no longer by the absurd margin it had when the crown was a
  // stovepipe. The old 2.195 was a hat that never rode anything because nothing
  // in the union was tall enough to reach the inside of it. Only `turban` is
  // deeper, and a turban is cloth wound *round* hair rather than a shell set
  // over it, which is why it is the one entry here whose cavity is bulk.
  cowboyhat: { cap: 1.76, wear: 'perch' },
  // cap, at y 0.44 and 1.04 tall. Tied at the brow: the one hat here that is
  // pulled *down* rather than on, and it flattens the hairline by definition.
  // The shallowest cavity of the eight on purpose — a bandana is cloth on a
  // skull, and it is the *only* thing that tells it from a cap head-on.
  bandana: { cap: 0.96, wear: 'press' },
  // bulk, at y 1.00 and 1.86 tall.
  turban: { cap: 1.93, wear: 'perch' },
  // The band's *inner* arc: `hoop` is a torus of outer radius 0.5 and tube 0.06,
  // so the hole reaches 0.38 of the scale, and the band is 2.40 tall at y 0.28.
  //
  // `perch` is right for the band and would be a lie about the whole object, and
  // that is the one place this table's two columns are not the entire story: a
  // hat perches as one piece, and headphones perch at the crown while staying put
  // at the ears. The case that builds them is the only one here that reads how
  // far it is being lifted, and it is where the split is argued.
  headphones: { cap: 1.192, wear: 'perch' },
};

/** Daylight between felt and hair, in head radii. About a centimetre. */
const CLEAR = 0.08;

/**
 * The narrowest hair a hat can be set down on, in head radii.
 *
 * A hat rides hair because the hair is *under* it, holding it up across the
 * whole width of the crown. **A mohawk is 0.21 R across** and **a flat cap over
 * one is lifted 1.58 R** were both true of a narrower, taller crest than the one
 * that is built now. Measured off the group `buildHair` returns, the mohawk
 * publishes a `halfWidth` of `0.394 R` and a `crown` of `1.984 R`, and against
 * `flatcap`'s room of `1.09 - CLEAR = 1.01 R` the lift this constant prevents is
 * `0.974 R`. The distinction is narrower than it was and is still not a fine
 * one: every other volume in the union publishes at least `0.995 R` of
 * half-width, so `HOLD` sits in a gap of six tenths of a head radius. Without
 * it, a flat cap over a mohawk is lifted most of
 * a head clear of the skull, balanced on a fin: it reads as a hat that has
 * come off, which is worse than either of the honest answers. With it, a crest
 * under a cap is flattened, which is what happens to a crest under a cap.
 */
const HOLD = 0.5;

/**
 * The most of a head of hair a pulled-on hat may take out of it — about a fifth.
 *
 * Cloth compresses hair; it does not delete it. Without this the two hats that
 * press were solving the fit exactly, and an afro under a bandana came out at
 * 45 % of its own size — which is to say entirely inside the cap, with a player
 * whose whole silhouette is their hair walking on with none. The bench shows it
 * plainly: a bandana over an afro that reads as a bandana over a bald head, and
 * it is what fixed this number. A fifth leaves the halo standing proud of the
 * cloth on both sides, which is the picture; a third does not.
 *
 * So a squeeze stops here and whatever is still too tall is handled the way
 * everything else is, by the hat riding higher. That composition is why there
 * are two mechanisms rather than a choice between them: a beanie over an afro
 * ends up slightly squashed hair under a beanie worn slightly high, which is the
 * photograph, and neither number on its own gets there.
 *
 * Hair too narrow to carry a hat at all is exempt and gives the whole way — see
 * `HOLD`. A crest is not compressed by the cloth, it is defeated by it.
 */
const SQUASH = 0.78;

/**
 * Twenty of them, each one built where it belongs and never anywhere else.
 *
 * The eight in `HEAD_FIT` are built into a group of their own so that `seat()`
 * has one thing to lift. A hat is rigid and a lift is a translation, so nothing
 * about the model changes — which is what let five of the twenty be rebuilt from
 * the silhouette outwards without touching a line of the arbitration: a case
 * below owes this function one number, `cap`, and owes it nothing else.
 */
export function buildAccessories(
  at: Attachments, look: Look, p: Proportions, l: Leases, hair: HairProfile,
): void {
  for (const a of look.accessories) {
    const fit = HEAD_FIT[a];
    if (!fit) {
      buildAccessory(a, at, look, p, l, 0);
      continue;
    }
    const worn = new Group();
    at.head.add(worn);
    /**
     * Solved before the object is built rather than after, which is the whole of
     * what let `headphones` stop being wrong — see its case below. Nothing else
     * reads it and nothing else should: a hat is rigid, so being told how high it
     * is about to be set is of no use to it whatever.
     *
     * `seat` compresses the hair as a side effect and is still the only caller,
     * so moving the call earlier changes the order of nothing — the hair group is
     * not this group and neither reads the other.
     */
    const lift = seat(fit, hair, p.headR);
    buildAccessory(a, { ...at, head: worn }, look, p, l, lift);
    worn.position.y = lift;
  }
}

/**
 * Where the hat ends up, and — the other half of the same decision — whether the
 * hair is still the shape it was built.
 *
 * The whole arbitration, and it is deliberately not eight cases or seventeen. Hair
 * that fits under the crown is left alone and the hat does not move, which is
 * every close cut under every hat and is the common path. Hair that does not fit
 * **gives** what it can, and the hat then **rides** whatever is left over — by
 * exactly the shortfall and not a millimetre more, so a porkpie on an afro sits
 * with the halo inside its crown and its brim resting on the hair.
 *
 * The two are composed rather than chosen between, and that is the part that
 * took a second pass. Squeezing alone put a whole afro inside a bandana; riding
 * alone put a beanie on top of one like a party hat. What is actually
 * photographed is both at once — hair a bit flatter, hat a bit higher — so both
 * happen, in that order, and `SQUASH` is what stops the first from doing the
 * whole job.
 *
 * Whether hair gives at all is two questions. A hat that is *pulled on* squeezes
 * by nature: that is the difference between a beanie and a porkpie and it is the
 * `wear` column. And a hat that is *set on* squeezes anyway when there is nothing
 * wide enough to set it on — `HOLD`, which is what `halfWidth` is published for.
 *
 * The guard on `bearing` is what makes squeezing safe rather than clever. A
 * beanie is entitled to flatten an afro; it is not entitled to flatten a hood,
 * which is a garment and does not compress, nor to shorten a mane, because
 * `HairProfile.compress` scales the whole group and a style with length would
 * lose that length. `volume` is the union's own word for "mass above the skull
 * and nothing below the jaw", so asking for it here is asking exactly the
 * question that makes a whole-group scale correct. Anything else only rides,
 * which is always available and never wrong, only sometimes tall.
 */
function seat(fit: HeadFit, hair: HairProfile, R: number): number {
  const room = fit.cap - CLEAR;
  if (hair.crown <= room) return 0;
  if (hair.bearing === 'volume') {
    const holds = hair.halfWidth >= HOLD;
    if (!holds || fit.wear === 'press') {
      hair.compress(holds ? Math.max(room, hair.crown * SQUASH) : room);
    }
  }
  return Math.max(0, (hair.crown - room) * R);
}

function buildAccessory(
  a: Accessory, at: Attachments, look: Look, p: Proportions, l: Leases,
  /**
   * How far this object's own group is about to be raised off the skull, in
   * metres — `seat`'s answer, and zero for the twelve accessories that are not
   * head furniture at all.
   *
   * Nineteen of the twenty ignore it, and are right to: a hat is one rigid shell,
   * a lift is a translation, and a translation applied to the group is the same
   * picture as a translation applied to every mesh in it. It is here for the one
   * object in the union that is **sprung** rather than rigid, which is a fact
   * about the thing and not a special case invented for the renderer.
   */
  lift: number,
): void {
  const R = p.headR;
  const { head, torso } = at;
  const accent = look.outfit.accent;

  switch (a) {
    case 'glasses': {
      // ## Why an arm is not parallel to `z`
      //
      // The skull is an ellipsoid 2.00 R across, and at eye height it is only
      // 0.56 R wide at the lens plane and 1.98 R wide at its own centre. An arm
      // held at one `x` all the way back therefore starts outboard of the face
      // and ends *inside the head*: these were parked at x 0.72 and ran from
      // z 0.90 to z 0.10, so everything behind z 0.67 was under the surface and
      // the temple appeared to be driven through the cheekbone.
      //
      // The arm is turned about `y` instead, onto the line that grazes the skull
      // at the temple — the point a real arm touches — and stands clear of it in
      // front and behind. That is one number per pair of glasses rather than a
      // hinge and a second mesh, and it is the same trick either side because
      // `SIDE` carries the sign.
      const frame = surface(l, '#2b2b30', { roughness: 0.4, metalness: 0.3 });
      for (const s of [SIDE.left, SIDE.right]) {
        const rim = new Mesh(hoop(l), frame);
        rim.scale.set(R * 0.68, R * 0.62, R * 0.68);
        rim.position.set(s * R * 0.36, R * 0.12, R * 0.90);
        head.add(rim);
        const arm = new Mesh(slab(l), frame);
        arm.scale.set(R * 0.05, R * 0.05, R * 0.87);
        arm.rotation.y = -s * 0.33;
        arm.position.set(s * R * 0.87, R * 0.16, R * 0.49);
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
      // The lens plane is in front of the eye, which it was not. A flat disc at
      // z 0.93 is behind the front of an iris at z 0.945, so both pupils showed
      // through the glass as two paler dots, and no gaze moved them off it —
      // the iris slides in x and y on the eyeball and never in z, so the fault
      // was on every frame rather than at the corners of a glance. At z 0.98 the
      // glass clears it by 5 mm whatever the eye is doing. `glasses` needs none
      // of this: its rim is a hoop with nothing stretched across it.
      for (const s of [SIDE.left, SIDE.right]) {
        const glass = new Mesh(disc(l), lens);
        glass.scale.set(R * 0.70, R * 0.56, 1);
        glass.position.set(s * R * 0.36, R * 0.12, R * 0.98);
        head.add(glass);
        const rim = new Mesh(hoop(l), frame);
        rim.scale.set(R * 0.76, R * 0.62, R * 0.60);
        rim.position.set(s * R * 0.36, R * 0.12, R * 0.97);
        head.add(rim);
        // Turned onto the skull's tangent for the reason `glasses` is, and
        // reaching further forward than that one because the hinge it has to
        // meet went forward with the lens.
        const arm = new Mesh(slab(l), frame);
        arm.scale.set(R * 0.06, R * 0.06, R * 0.91);
        arm.rotation.y = -s * 0.31;
        arm.position.set(s * R * 0.87, R * 0.16, R * 0.51);
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
      //
      // Wide enough, and not one radius wider. The band was 1.92 R across on a
      // 2.00 R head, which put its ends *outboard of the skull*: from the front
      // the lenses finished past the cheekbones on both sides and the thing read
      // as a welding visor bolted to a face rather than as something worn on it.
      // The width is now 1.78 R and the depth does the work the width was doing
      // — an ellipsoid centred at z 0.26 rather than 0.44 reaches back along the
      // head's own curve toward the temples, which is the whole meaning of
      // "wraparound", and every point of it stays inside the outline of the head
      // from every angle the house has.
      //
      // Deep, not just wide, and the depth is what keeps the eyes behind it. An
      // iris is a bead of 0.17 R sitting 0.10 R proud of an eyeball whose own
      // front pole is at z 0.89, so the thing this band has to stay in front of
      // reaches z 0.945 — and a band 1.46 R deep centred at z 0.26 only reached
      // z 0.935 at the eye's own x, because an ellipsoid has already curved away
      // by the time it gets out there. Two pupils came through the lens as dots.
      // At 1.76 R deep centred at z 0.22 the lens clears the iris by 12 mm at the
      // eye's rest and by 5 mm with the gaze pinned to the outside of its clamp,
      // which is where a mouthpiece player's eyes live whenever the turn is more
      // than the waist will give. The extra 0.06 R of height is for the corner of
      // that clamp — hard out and hard up at once, where the band is curving away
      // in both axes at once and 4 mm of iris was still coming through.
      //
      // The band's own ends did not move: they still sit at x 0.89 on a 0.99 R
      // half-head, buried in the skull, so the silhouette is unchanged.
      //
      // ## An arm is three capsules, and the first one starts under the lens
      //
      // Two things went wrong before this and only one of them was placement.
      // The placement half: the widest point of a skull is halfway along a
      // temple, so a straight rod that lies on the skin at the ear is 4 mm under
      // it at the cheekbone, and a rod lifted clear of the bulge floats off both
      // ends instead. Three short chords with a bend at each join follow the
      // curve to 2 mm — never more than a fifth of the capsule under the skin,
      // never more than 2 mm off it — and they overlap by 8 mm at the joins,
      // which matters because two capsules laid end to end meet at a *point* and
      // pinch there. Butted, they read as separate dashes. Overlapped, as an arm.
      //
      // The other half is where the arm begins. The band's ends are buried in
      // the skull on purpose — that is what keeps its silhouette inside the head
      // — so there is no rim standing in open air for an arm to hinge off, the
      // way there is on `glasses` and `sunglasses`. An arm that starts on bare
      // skin behind it therefore reads as a mark on the head, whatever it does
      // afterwards. So the front capsule starts *inside the band*, at z 0.65
      // where the lens still covers it, and comes out from under the lens edge
      // at z 0.51 where the band's own surface dives into the cheek. The join is
      // hidden by the thing it joins.
      const lens = surface(l, '#101014', { roughness: 0.10, metalness: 0.72 });
      const visor = new Mesh(orb(l), lens);
      visor.scale.set(R * 1.78, R * 0.60, R * 1.76);
      visor.position.set(0, R * 0.14, R * 0.22);
      head.add(visor);
      // Outward offset, centre in `z`, half-length, and the turn about the
      // head's own axis, for each chord of the arm. The turn is in `rotation.z`
      // and not `y` because the `x` that lays a capsule along the head goes
      // first: under the default Euler order that is the pair whose second turn
      // keeps the axis horizontal.
      const TEMPLE = [
        [0.8625, 0.48, 0.197, 0.57],
        [0.9855, 0.18, 0.194, 0.21],
        [0.9875, -0.16, 0.213, -0.19],
      ] as const;
      for (const s of [SIDE.left, SIDE.right]) {
        for (const [out, mid, half, turn] of TEMPLE) {
          const bar = new Mesh(pill(l), lens);
          bar.scale.set(R * 0.07, R * half, R * 0.07);
          bar.rotation.set(Math.PI / 2, 0, s * turn);
          bar.position.set(s * R * out, R * 0.20, R * mid);
          head.add(bar);
        }
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
      // The peak is the entire object and it used to be invisible from the
      // front, which is the angle the house watches a singer from all night.
      // It was 0.14 R thick, tipped *up* at the tip, and ended at z 1.41 — a
      // wafer tucked into the side of a dome that hung lower than it did. Seen
      // head-on there was nothing there at all: a flat cap that was a beanie
      // without the roll, and the two are next to each other in the union.
      //
      // Three things fix it and they are all about what shows in outline.
      //
      // The peak hangs *below the front edge of the cap*. This is the one that
      // matters: a peak tucked up under the cloth is hidden by the cloth no
      // matter how long it is, so the dome is set back to z −0.22 and its front
      // edge lands at y 0.43, while the peak passes the brow at 0.24. That 0.19
      // R band of felt below the cap is the whole of the front view, and it is
      // why the dome is a little shallower than it was rather than a little
      // deeper.
      //
      // The peak reaches z 1.45, half a head clear of the cloth, which is what
      // makes it a peak from three-quarters and from the side.
      //
      // And it is cut two steps darker than the cap rather than out of the same
      // cloth. Real tweed is one cloth, and if the light were doing the work the
      // peak would be in the cap's shadow — but the key is frontal and low, so
      // the peak's upper surface is the *best* lit plane on the hat and comes
      // out brighter than the crown. Painting the shadow in is the only way the
      // seam between the two survives a follow spot.
      const cloth = surface(l, shade(look.outfit.jacket, -0.10), { roughness: 0.95 });
      const stiff = surface(l, shade(look.outfit.jacket, -0.28), { roughness: 0.95 });
      const dome = new Mesh(orb(l), cloth);
      dome.scale.set(R * 2.22, R * 0.98, R * 2.16);
      dome.position.set(0, R * 0.60, -R * 0.22);
      dome.castShadow = true;
      head.add(dome);
      const peak = new Mesh(orb(l), stiff);
      peak.scale.set(R * 1.90, R * 0.22, R * 1.20);
      peak.position.set(0, R * 0.34, R * 0.86);
      peak.rotation.x = 0.20;
      peak.castShadow = true;
      head.add(peak);
      break;
    }

    case 'ballcap': {
      // Not forwards, and that half of the old decision stands: `flatcap`
      // already covers a soft cap with the peak the right way round, so a second
      // forward-peaked cap would be one hat with two names; and a peak over the
      // brows puts the whole face in shadow under a follow spot, which is a real
      // cost on the one player most likely to be wearing it. In the accent
      // colour, because a cap is a statement where a flat cap is part of the
      // suit.
      //
      // But *straight* backwards was a hat with no front view. A peak at z −1.16
      // is directly behind a head 2.00 R wide and 1.6 R of peak never emerges
      // from either side of it, so head-on the whole model was one accent dome —
      // the same accent dome as `bandana` and `turban`, and on a light accent it
      // read as blond hair rather than as a hat at all. Three of the seven
      // silhouettes the wardrobe is supposed to be able to tell apart collapsed
      // into one, at the angle the camera spends most of the show at.
      //
      // So the cap is knocked round on the head — a hundred and seventeen
      // degrees, peak over the left ear and trailing back. That is a real way a
      // cap is worn and it is the only one that puts the peak where it can be
      // seen from the front: 0.6 R of it stands clear of the dome's own outline
      // to one side, which no amount of shaping a dome could ever have done. The
      // face stays out of its shadow, because the peak is behind the plane of
      // the cheek by the time it clears the head.
      //
      // The turn is a group rather than three rotated meshes because the peak
      // needs both a swing about `y` and a tilt about its own cross axis, and
      // `Euler` order `XYZ` applies `rotation.x` last about the *world* axis —
      // set both on the mesh and the tilt becomes a roll. The dome and the
      // button stay on the head itself: they are surfaces of revolution about
      // the crown, turning them does nothing, and leaving them out of the group
      // keeps `HEAD_FIT.ballcap` readable as one mesh's own arithmetic.
      const cloth = surface(l, accent, { roughness: 0.85 });
      const dome = new Mesh(orb(l), cloth);
      dome.scale.set(R * 2.20, R * 1.26, R * 2.24);
      dome.position.set(0, R * 0.54, -R * 0.14);
      dome.castShadow = true;
      head.add(dome);
      const turn = new Group();
      turn.rotation.y = 2.05;
      head.add(turn);
      const peak = new Mesh(orb(l), cloth);
      peak.scale.set(R * 1.58, R * 0.20, R * 1.44);
      peak.position.set(0, R * 0.30, R * 1.06);
      // Tipped up at the far end, which is what a peak does when the head it
      // is sitting on slopes away underneath it.
      peak.rotation.x = -0.12;
      peak.castShadow = true;
      turn.add(peak);
      const button = new Mesh(bead(l), cloth);
      button.scale.setScalar(R * 0.22);
      button.position.set(0, R * 1.14, -R * 0.14);
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
      // from its colour. That sentence was already here and it was right; what
      // was under it drew something else entirely.
      //
      // ## What a stovepipe with paddles looks like from the tenth row
      //
      // The crown was 1.55 R tall on a 1.96 R base — two and a half times the
      // porkpie's height on the same width — so the first thing the eye got was
      // a top hat, and `country` draws this in all four of its eras. The brim
      // under it was a 0.10 R disc: a flat plate, invisible edge-on, doing
      // nothing at all for the shape. And the turn of the brim, which is the
      // one feature that says *cowboy* rather than *magician*, was two boxes
      // stood at ±1.70 R and rolled 0.55 rad. From every angle those read as
      // exactly what they were — two rectangles floating either side of the
      // crown with a gap you could see the background through.
      //
      // ## One surface, and the edge is what lifts
      //
      // A turned brim is continuous: the felt leaves the crown flat, runs out,
      // and rolls up at the rim. Nothing made of boxes can be that, so the rim
      // is a torus — `hoop`, laid flat and set proud of the plate it rings, its
      // tube scaled up so the roll is a body of felt rather than a hoop of wire,
      // and the plate's edge buried inside that tube on every heading so the two
      // are one surface with no seam to find. How far proud and how fat the roll
      // is are the last section's business, because they turn out to be the
      // whole of whether the crown survives.
      //
      // ## And the ring has to be tilted, which took a second look to see
      //
      // A ring laid *level* draws nothing. The house sees it from the side, and
      // the near arc of a level torus is at the same height as its far arc and
      // as both of its flanks — so from the front the whole thing is one
      // horizontal band of constant thickness straight across the hat, which is
      // a flat brim with the edges thickened and reads as a plate. Worse, that
      // near arc is *in front of the crown*, and it was drawn over the hatband:
      // a gold band 0.20 R tall vanished behind it completely and the first
      // version of this fix put a bare grey chimney on the bench.
      //
      // Tilting the whole assembly nose-down answers both. The near arc drops a
      // quarter of a radius, the far arc rises by as much, and the two flanks
      // stay where they are — which is exactly the shape a cattleman brim has:
      // low at the face, swept up behind, and standing highest at the two sides.
      // That rise across the front is the whole silhouette. The band clears the
      // near arc by sitting above it and is gold again.
      //
      // The plate is tilted with the ring rather than left level, and it has to
      // be: a level plate inside a tilted ring hangs 0.4 R below the roll at the
      // back, and what shows from three-quarters is a hoop floating off the back
      // of a disc — the two-detached-boxes failure over again, one ring later.
      //
      // It costs 140 triangles where the two boxes cost 24, and that is the one
      // place in this file where a fix triples a model's budget. The argument
      // is that this hat has nothing else: a porkpie is told from it by brim
      // width alone once the crown is honest, and 24 triangles of paddle were
      // buying a silhouette that was actively wrong rather than merely plain.
      //
      // ## The ring then ate the crown, which is the failure this last pass is
      //
      // Everything above is still true and the hat on the bench was still wrong,
      // because a roll of felt 0.43 R thick standing at y 0.86 has a *top*, and
      // that top was at 1.08 R while the crown finished at 1.58. Half a head
      // radius of crown above a brim nearly four radii across is not a crown, it
      // is a bump — and the arithmetic that settles it is the porkpie's, which
      // shows 0.57 R of crown over a brim 1.45 R wide. The hat with the tall
      // crown was showing *less* crown than the hat named for not having one.
      // From the stalls on `country:outlaw` it read as a boater; from the fourth
      // row back on the wardrobe grid it read as the flat disc it was before the
      // torus, because a brim that hides its own crown is a ring either way.
      //
      // So the proportions are redrawn against the skull rather than against the
      // old numbers, and there are three of them.
      //
      // The crown is *wider than the head*. It was 1.90 R across on a skull 2.00
      // R across — a plug sunk into the brim, with the skull's own outline the
      // wider of the two at every height below the temples, so what the eye had
      // to separate crown from head with was nothing at all. 2.10 R puts felt
      // outboard of skin the whole way round, which is the only reason a hat
      // ever reads as a thing worn rather than as a shape of head.
      //
      // The crown is taller and the brim is lower, and both halves are needed.
      // The crown finishes at 1.76 R and the roll comes down to a top of 0.96 at
      // the flanks, so 0.80 R of crown stands clear — forty per cent more than
      // the porkpie shows, against a brim a third wider than the porkpie's. Each
      // of those two would carry the distinction alone; together there is no
      // angle where the pair are the same hat.
      //
      // And the roll is flattened in section — 0.46 R across the brim and 0.28
      // through it, rather than round. A round bead is a hosepipe bent into a
      // circle; felt rolled over a wire is wider than it is thick, and the
      // flatter section is what buys back the height the crown needed without
      // giving up any of the width that says the edge is turned.
      //
      // The tilt goes to 0.17 rad, as far as it can before the brim's underside
      // reaches the top of a pair of sunglasses at z 0.92 — `country:outlaw`
      // draws both on the same player, and a brim through a lens is a worse
      // failure than a shallow sweep. From the front the top edge of the brim
      // now runs up from 0.69 R at the nose to 0.96 at the tips.
      const TILT = 0.17;
      const felt = surface(l, shade(look.outfit.jacket, -0.14), { roughness: 0.96 });
      const crown = new Mesh(tube(l), felt);
      crown.scale.set(R * 2.10, R * 1.30, R * 2.00);
      crown.position.set(0, R * 1.11, -R * 0.12);
      crown.castShadow = true;
      head.add(crown);
      const brim = new Mesh(tube(l), felt);
      brim.scale.set(R * 3.06, R * 0.09, R * 2.82);
      brim.position.set(0, R * 0.70, -R * 0.12);
      brim.rotation.x = TILT;
      brim.castShadow = true;
      head.add(brim);
      const rim = new Mesh(hoop(l), felt);
      rim.scale.set(R * 3.86, R * 3.56, R * 2.30);
      rim.rotation.x = Math.PI / 2 + TILT;
      rim.position.set(0, R * 0.82, -R * 0.12);
      rim.castShadow = true;
      head.add(rim);
      const band = new Mesh(tube(l), surface(l, accent, { roughness: 0.7 }));
      band.scale.set(R * 2.16, R * 0.20, R * 2.06);
      band.position.set(0, R * 0.90, -R * 0.12);
      head.add(band);
      break;
    }

    case 'bandana': {
      // Tied at the brow rather than perched on the crown, which is the tell:
      // it sits lower than any hat here and covers the hairline entirely.
      //
      // Lower than it used to. A 1.20 R cap standing at y 0.54 is a dome the
      // same height as a ball cap's, and since both take the accent colour the
      // two were the same object from the front — with `turban` making three.
      // A bandana is a square of cloth pulled over a skull: it has no crown of
      // its own and it should be visibly *thinner* than anything with a shape
      // built into it. 1.04 R at y 0.44 hugs the head, which is the cheapest
      // and truest distinction available and the reason `HEAD_FIT` gives this
      // the shallowest cavity of the eight.
      //
      // The knot moves off the back of the head and onto the side of it, and
      // that is the other half of the front view. Behind the skull it was
      // information for the drummer and nobody else — the player is turned
      // upstage perhaps a tenth of the show. At the right ear the knot and its
      // two ends break the outline of the head on one side, which is a shape no
      // other hat here makes, and a bandana tied over one ear is as photographed
      // as one tied at the nape. Right rather than left because `ballcap`'s peak
      // now sticks out to the left, and two accent-coloured things jutting from
      // the same side of the same head would have put the pair straight back
      // where they started.
      const cloth = surface(l, accent, { roughness: 0.92 });
      const cap = new Mesh(orb(l), cloth);
      cap.scale.set(R * 2.10, R * 1.04, R * 2.14);
      cap.position.set(0, R * 0.44, -R * 0.20);
      cap.castShadow = true;
      head.add(cap);
      const s = SIDE.right;
      const knot = new Mesh(bead(l), cloth);
      knot.scale.setScalar(R * 0.52);
      knot.position.set(s * R * 0.94, R * 0.08, -R * 0.48);
      head.add(knot);
      for (const i of [0, 1]) {
        const tail = new Mesh(slab(l), cloth);
        tail.scale.set(R * 0.24, R * (1.00 - i * 0.26), R * 0.11);
        tail.position.set(
          s * R * (0.96 + i * 0.16), -R * (0.44 + i * 0.10), -R * (0.56 + i * 0.20),
        );
        tail.rotation.z = s * 0.20;
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
      //
      // The winds have to *stand off the bulk* or they are not there. At 2.30
      // and 2.02 R against a 2.46 R ellipsoid both of them were buried inside
      // the mass they were meant to be wrapped round, and what reached the house
      // was one smooth accent egg — the same egg `ballcap` and `bandana` were
      // presenting, and the biggest of the three, which is a poor way to be
      // told apart. The bulk comes in to 2.34 and the rings go out to 2.62 and
      // 2.44, so each one shows a hand's width of cloth proud of the shape under
      // it and the outline is stepped rather than smooth.
      //
      // And they are tilted, one forward and one back. Cloth wound round a head
      // does not lie in two level circles — it spirals, and two rings crossing
      // at a slight angle is the cheapest thing that says wound rather than
      // moulded. The tilt goes into `rotation.x` beside the quarter turn rather
      // than into `rotation.z`, because a torus is a surface of revolution about
      // its own z and a roll about that axis is the one rotation it cannot show.
      //
      // The fold at the front is 12 triangles and does more than either wind: a
      // turban has a folded fan where the last wrap is tucked in, it faces the
      // audience, and it is the one part of this model that no dome anywhere in
      // the union has.
      const cloth = surface(l, accent, { roughness: 0.88, metalness: 0.05 });
      const bulk = new Mesh(orb(l), cloth);
      bulk.scale.set(R * 2.34, R * 1.86, R * 2.40);
      bulk.position.set(0, R * 1.00, -R * 0.14);
      bulk.castShadow = true;
      head.add(bulk);
      for (let i = 0; i < 2; i++) {
        const k = 2.62 - i * 0.18;
        const wind = new Mesh(collar(l), cloth);
        wind.scale.set(R * k, R * k, R * 0.74);
        wind.rotation.x = Math.PI / 2 + (i === 0 ? 0.16 : -0.14);
        wind.position.set(0, R * (0.56 + i * 0.62), -R * 0.14);
        wind.castShadow = true;
        head.add(wind);
      }
      const fold = new Mesh(slab(l), cloth);
      fold.scale.set(R * 0.42, R * 0.64, R * 0.30);
      fold.position.set(0, R * 0.86, R * 1.06);
      fold.rotation.x = -0.18;
      head.add(fold);
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
      // A ring 0.86 of the shoulder width across, balanced on the top of the
      // torso, is a cervical collar. That is what this was: 0.89 W of outer
      // diameter round a neck that is 0.68 W, flat in section, and one tail
      // hung off to one side where the loop hid it. The player looked injured.
      //
      // A scarf is narrow and *thick*. The ring comes in to 0.83 W across, which
      // leaves about three centimetres of wool proud of the neck at adult scale,
      // and the section goes the other way — 1.45 rather than 1.20 of the body
      // depth, so it is a bunched wrap standing up to the jaw rather than a
      // plate lying on the collarbones. It also settles a little below the
      // shoulder line instead of on top of it, because cloth sits in the hollow.
      //
      // Then the ends do the identifying, which is why there are two of them and
      // why they are different lengths. Two *even* falls is the towel, four
      // cases down, and the towel earns them: it was laid over the neck straight
      // and nobody has touched it since. A scarf has been thrown, so one end is
      // most of the way down the chest and the other is half that.
      const wool = surface(l, accent, { roughness: 0.98 });
      const loop = new Mesh(collar(l), wool);
      loop.scale.set(p.torsoW * 0.80, p.torsoW * 0.80, p.torsoD * 1.45);
      loop.rotation.x = Math.PI / 2;
      loop.position.set(0, at.neckY - p.torsoH * 0.035, 0);
      torso.add(loop);
      for (const [s, len] of [[SIDE.left, 0.52], [SIDE.right, 0.32]] as const) {
        const end = new Mesh(slab(l), wool);
        end.scale.set(p.torsoW * 0.17, p.torsoH * len, p.torsoD * 0.10);
        end.position.set(
          s * p.torsoW * 0.15, at.neckY - p.torsoH * (len / 2 + 0.03), p.torsoD * 0.44,
        );
        end.rotation.z = s * 0.07;
        torso.add(end);
      }
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
        // `0.56` of the torso depth rather than `0.50`, which is where the
        // drape's sash lies and where a garment band goes generally. Both were
        // the same 0.10 slab on the same plane, so a towel over a drape put two
        // pieces of cloth in one place across the whole chest. A towel is *laid
        // on top of* what somebody is wearing, so the depth says so.
        fall.position.set(s * p.torsoW * 0.17, at.neckY - p.torsoH * 0.25, p.torsoD * 0.56);
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
      //
      // The rest of this case was invisible for two separate reasons and both
      // had to go.
      //
      // It was a thread. `hoop` has a tube one seventh of its ring, so a loop
      // 0.44 W across carried a wire 1.2 cm thick at adult scale and the pendant
      // was 4 cm — jewellery drawn at the scale it is in life, on a figure whose
      // head is a sixth of its height. Nothing in this rig is at life scale. The
      // loop goes to 0.60 W and the pendant to 0.15 W, which is a medallion, and
      // a medallion is the part of a chain anyone has ever seen from a seat.
      //
      // And it was black. Metalness 0.95 means a material with no diffuse term
      // at all: every photon it shows is a reflection, and in a room with no
      // environment map there are none, so the accent colour was never on
      // screen. A scene environment **is being added elsewhere and will help** —
      // it landed, as `lightTheRoom` in `performer-assets.ts`, and all three
      // pages call it — but help is not the same as depending on it, which is
      // why this number did not go back up afterwards. 0.55 keeps the metal reading
      // as metal while leaving enough diffuse for the key light to find gold.
      // `hoops` stays at 0.9 and is right to: it hangs beside a lit face where
      // the skin bounces into it, and a chain hangs on a chest in its own shade.
      const metal = surface(l, accent, { roughness: 0.26, metalness: 0.55 });
      const loop = new Mesh(hoop(l), metal);
      loop.scale.set(p.torsoW * 0.60, p.torsoH * 0.40, p.torsoD * 0.34);
      loop.position.set(0, at.neckY - p.torsoH * 0.20, p.torsoD * 0.42);
      torso.add(loop);
      const pendant = new Mesh(bead(l), metal);
      pendant.scale.setScalar(p.torsoW * 0.15);
      pendant.position.set(0, at.neckY - p.torsoH * 0.40, p.torsoD * 0.46);
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
      // Half a head wide and a centimetre and a half thick is a moustache at
      // life scale, and life scale is wrong here: this rig's head is a sixth of
      // its body, so a feature drawn to a real face's measurements comes out at
      // two thirds of the size the face it is on implies. What it did on the
      // bench was disappear — a thin dark line between a nose and a mouth that
      // are each several times its section.
      //
      // A full head radius across and 0.24 R thick is the same fraction of
      // *this* face that a moustache is of a real one, and it tucks under the
      // nose rather than floating below it, which is what makes it grow out of
      // the lip instead of hanging off it. `country` and `funk` both weight it,
      // and on both it now reads at the same distance the beard does.
      const hair = hairSurface(l, look.hair);
      const tache = new Mesh(pill(l), hair);
      tache.scale.set(R * 0.24, R * 0.50, R * 0.22);
      tache.rotation.z = Math.PI / 2;
      tache.position.set(0, -R * 0.24, R * 0.84);
      head.add(tache);
      break;
    }

    case 'earrings': {
      // A 0.2 R bead on the side of a head is inside the head's own outline
      // from almost everywhere, and what is left of it at the edge is three
      // millimetres of gold on a lit cheek. It was drawn and it was never seen.
      //
      // So it hangs. The difference between an earring you can find at ten
      // metres and one you cannot is entirely whether it breaks the silhouette
      // of the skull, and the only place beside a head where that is free is
      // *below the jaw*: the head's half-width falls to 0.79 R down there while
      // the lobe stays at 0.99, so a drop hung from the lobe is against the
      // background rather than against skin, on both sides, from the front and
      // from three-quarters alike.
      //
      // One capsule per ear and not a stud plus a drop, because the stud was
      // only ever the part that could not be seen — the top of the capsule is
      // inside the head at the lobe, which is exactly where an earring is
      // fastened, and that is the whole of what the stud was drawing.
      const metal = surface(l, accent, { roughness: 0.22, metalness: 0.8 });
      for (const s of [SIDE.left, SIDE.right]) {
        const drop = new Mesh(pill(l), metal);
        drop.scale.set(R * 0.26, R * 0.32, R * 0.26);
        drop.position.set(s * R * 0.99, -R * 0.46, R * 0.04);
        head.add(drop);
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

    /**
     * The one piece of head furniture that is not a rigid shell, and the only
     * case in this file that reads `lift`.
     *
     * Every hat here rides tall hair by being picked up whole, because that is
     * what a hat does — the crown clears the hair and the brim comes with it.
     * Headphones are the exception in the wardrobe and in the world: the band
     * goes *over* whatever is on the head and the cups go *on the ears*, and the
     * two are joined by a slider whose entire purpose is to take up the
     * difference. Lifting the group whole took the cups up with the band, so a
     * player with any real volume of hair wore them on the temples. Over the
     * union's tallest heads that is **`1.0 R` of travel — about eleven
     * centimetres** — which is not a fit that is slightly off, it is the cups
     * above the crown of the skull. That figure is low and the number is worth
     * having right, since everything below is solved against it: measured by
     * running `seat` over every hair in the union, the tallest is `beehive` at
     * `2.500 R`, this entry's room is `1.192 - CLEAR = 1.112 R`, and the lift is
     * **`1.388 R`** — 18.9 cm on a 1.75 m player, whose `headR` is 0.1365 m.
     * The afro is next at `1.212 R`.
     *
     * So the band rides, the cups stay, and **the ring stretches between them**,
     * which is the slider drawn rather than implied. Its top is `1.48 R` over
     * centre and goes up with the lift; its bottom is `-0.92 R` and does not
     * move, so it still passes outside the ears at every height. That is a
     * half-height of `(2.40 R + lift) / 2` about a centre of `0.28 R + lift / 2`,
     * and at `lift = 0` both reduce to exactly the numbers that were here before
     * — the unhatted picture is untouched by construction rather than by luck.
     *
     * The arithmetic is worth one line because it is what makes the stretch the
     * right shape rather than merely a taller ring. The ellipse is `1.225 R`
     * wide, so the band crosses the cup line at `1.175 R` with no lift and at
     * `1.065 R` at `1.0 R` of it — against cups at `1.06 R`. Recomputed at the
     * real maximum of `1.388 R` it crosses at `1.026 R`, which is 0.034 R
     * *inboard* of the cup centres and still well inside a cup that spans
     * `0.89` to `1.23 R`. The band
     * meets the cups across the whole range, and it meets them *closer* the
     * further it has stretched, which is the direction a real slider goes.
     */
    case 'headphones': {
      const shell = surface(l, '#20202a', { roughness: 0.5, metalness: 0.2 });
      const band = new Mesh(hoop(l), shell);
      band.scale.set(R * 2.45, R * 2.40 + lift, R * 2.40);
      // No rotation, and that is the fix rather than an omission. A
      // `TorusGeometry` already lies in the `xy` plane, which for a head is the
      // ear-over-crown-to-ear arc a headband actually takes. The quarter turn
      // that used to be here stood the ring up in `yz` instead — over the face
      // and down the back of the skull — while the cups stayed at `±x`, so the
      // band and the things it is supposed to join were at right angles.
      //
      // The `y` here is inside the group the lift is applied to, so it carries
      // the ride back out: `0.28 R + lift / 2` in the head's own frame, which is
      // what pins the bottom of the ring while the top of it climbs.
      band.position.set(0, R * 0.28 - lift / 2, -R * 0.06);
      head.add(band);
      for (const s of [SIDE.left, SIDE.right]) {
        const cup = new Mesh(tube(l), shell);
        cup.scale.set(R * 0.92, R * 0.34, R * 0.92);
        cup.rotation.z = Math.PI / 2;
        // Undoing the lift exactly, so the cup lands at `-0.06 R` off head
        // centre whatever is under the band. An ear does not move when its owner
        // backcombs.
        cup.position.set(s * R * 1.06, -R * 0.06 - lift, -R * 0.04);
        head.add(cup);
      }
      break;
    }

    default:
      assertBuilt(a);
  }
}
