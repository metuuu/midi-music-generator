/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Seventeen heads of hair.
 *
 * This was the middle third of `performer-look.ts`, and it moved out for a
 * reason that is about people rather than about code: the hair models and the
 * accessory models are worked on by different hands, and one 1300-line file with
 * three unrelated switches in it can only be edited by one of them at a time.
 * What was left behind — `Proportions`, `dressTorso`, the limb fitting — is what
 * both halves are written *against*, and it is the part nobody is queued up to
 * change.
 *
 * Nothing here chooses anything. The genre and the era decided the beehive long
 * before this file ran — see `concert/cast.ts` — and the job here is to render
 * the seventeen styles the contract names, not to have opinions about which suits
 * a trombonist. The switch below is over a frozen union and ends in a `never`
 * assignment, which is deliberate: a `switch` in a function returning `void`
 * will otherwise accept a missing case in silence, and the result is not an
 * error but a silhouette a genre's wardrobe asks for every night and which never
 * once appears on stage.
 *
 * The local frame is the performer's own and is documented once, in
 * `performer-look.ts`: `+y` up, `+z` the way they are looking, `+x` their left.
 * Everything here is in multiples of `Proportions.headR` off the head's centre.
 *
 * ## Two things outside the head that hair was ignoring
 *
 * A head of hair used to be built into a frame with nothing else in it, and both
 * of the things that share that frame were being walked through.
 *
 * **Upward there is whatever the wardrobe put on top.** `buildHair` returns a
 * `HairProfile` and `performer-accessories.ts` reads it. Hair does not know what
 * a porkpie is and must not: it says how high it reaches and whether it is the
 * kind of hair that squashes, and the hat does the arithmetic. Before this
 * existed a hat sat at a fixed multiple of head radius whatever was underneath,
 * so a porkpie over an afro showed nothing but its own gold band and a beehive's
 * finial came out of the top of a beanie.
 *
 * **Downward there is a torso.** Anything that hangs past the shoulder line ends
 * up inside a solid jacket, and the fix is not a shorter number — it is that the
 * shoulders are in `Proportions`, which this function has always been handed and
 * never read. `settle()` resolves every falling mass against them, and the rule
 * is stated there once rather than tuned per style.
 */

import { Box3, BufferGeometry, Group, Mesh, Object3D } from 'three';

import type { HairStyle, Look } from '../../concert/types.js';
import type { Rng } from '../../core/rng.js';

import {
  Leases, bead, hairSurface, headShell, orb, pill, shade, spike, surface,
} from './performer-assets.js';
import { SIDE, assertBuilt, type Proportions } from './performer-look.js';

// ---------------------------------------------------------------------------
// What hair tells the things worn over it
// ---------------------------------------------------------------------------

/**
 * How a head of hair answers something put on top of it.
 *
 * Three answers rather than a boolean, because the thing that goes wrong is not
 * "a hat and hair" but "a hat and *this* hair", and the three differ in kind. A
 * flat cap over a bob has nothing to arbitrate. A flat cap over an afro has to
 * ride the hair or hide it. A flat cap over a hood is two garments on one head,
 * which no placement makes right — see the note on `garment`.
 */
export type HairBearing =
  /** Held to the skull. A hat sits where it was drawn to sit. */
  | 'close'
  /** Mass standing off the skull. A hat perches on it or squashes it flat. */
  | 'volume'
  /**
   * Cloth already covering the head. Nothing squashes it and nothing sits on it
   * convincingly, so the renderer places a hat over one as well as it can and
   * `concert/cast.ts` is what stops the pairing being cast in the first place —
   * see the `COVERED` note there for why that is a wardrobe rule and not this
   * file's.
   */
  | 'garment';

/**
 * What head furniture needs to know about the head under it, and nothing more.
 *
 * The alternative is `performer-accessories.ts` reading `Look.hairStyle` and
 * carrying a case per pair, which is seventeen times eight branches and puts
 * wardrobe knowledge in the file that draws felt. This is three facts.
 *
 * Two of them are *measured off the meshes that were built* rather than written
 * down beside them, and that is the part worth defending. A table saying a
 * beehive reaches **2.83 R** is true until somebody improves the beehive, and
 * then
 * it is a silently wrong number in a file that person never opened — which is
 * the exact shape of the bug this whole change is about, one level up. Somebody
 * improved the beehive: it is a blunt ellipsoid rather than a cone now and it
 * reaches 2.500 R, so the number in this paragraph is the stale table it
 * predicted, and the profile that hats actually read never noticed. A `Box3`
 * of what was actually built cannot go stale.
 */
export interface HairProfile {
  /** Highest point of the hair above head centre, in multiples of `headR`. */
  readonly crown: number;
  /**
   * Widest half-extent in `x`, same units. What a brim has to beat to still be
   * seen from the front: a hat lifted clear of an afro but narrower than one
   * reads as a lid on a bush rather than as a hat.
   */
  readonly halfWidth: number;
  readonly bearing: HairBearing;
  /**
   * Squash what was built until the crown reaches no higher than `to`.
   *
   * One uniform scale on the group, which is the whole implementation and is
   * deliberately not seventeen per-style answers. Hair pulled into a beanie loses
   * height and width together — the width matters, because eight curls that are
   * merely shorter still break out of the sides — and a *uniform* scale is also
   * the only kind allowed on a node with children by the rule at the top of
   * `performer-assets.ts`, so nothing rotated underneath is sheared.
   *
   * It is only ever called on `volume` hair, and every volume style is mass
   * above the skull with nothing hanging below the jaw, which is what makes
   * scaling the whole group safe: there is no length for it to shorten. A style
   * that was both tall and long would need this to know the difference; the
   * guard that keeps that honest is in `performer-accessories.ts`, since that is
   * where the decision to call it is made.
   */
  compress(to: number): void;
}

/**
 * Which styles are mass and which are haircuts.
 *
 * A `Record` over the whole union rather than a list of the interesting ones, so
 * a new `HairStyle` fails the build here as well as in the switch. What a
 * missing entry would otherwise give you is `close`, and `close` is precisely
 * the answer that makes a hat behave as though the hair were not there.
 */
const BEARING: Record<HairStyle, HairBearing> = {
  bald: 'close',
  short: 'close',
  updo: 'close',
  braids: 'close',
  bob: 'close',
  long: 'close',
  mane: 'close',
  mullet: 'close',
  dreadlocks: 'close',
  // Close, and the flattest thing in the list: what `emo` puts under a hat is
  // hair ironed to a centimetre and a half of the skull. Everything that
  // makes the style is *below* the brim and in front of the face, where nothing
  // worn on a head can reach it, so a beanie pulled over one with the fringe
  // still hanging out from under it is the picture, and `close` draws it.
  emo: 'close',
  // The five that stand far enough off the skull for a hat to have to answer.
  // `slick` is in the list on the strength of one mesh: its quiff reaches
  // 1.48 R — 1.477, measured off the built group — which is higher than the
  // inside of **five** of the eight hats, and is six of them now that
  // `cowboyhat`'s crown has stopped being a stovepipe: only that hat, at 1.76,
  // and `turban`, at 1.93, still clear it. A
  // quiff is exactly the sort of hair a cap flattens.
  slick: 'volume',
  beehive: 'volume',
  mohawk: 'volume',
  afro: 'volume',
  curls: 'volume',
  // Cloth. Both are a covered head already.
  hood: 'garment',
  wrap: 'garment',
};

// ---------------------------------------------------------------------------
// Hair
// ---------------------------------------------------------------------------

/**
 * Seventeen styles, nearly all built from the same three primitives.
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
 *
 * **`emo` is the one style that spends this rather than obeying it**, and it is
 * an exception rather than a hole in the rule: a fringe sweeping across the brow
 * is drawn over half of a face on purpose, and the numbers there are about
 * exactly which half. Everything else keeps clear.
 *
 * ## Why it is a group and not seventeen meshes on the head
 *
 * Everything is built into a group of its own and the group is added to the head
 * last. That is what makes both contracts in the header cheap rather than
 * invasive: the crown height is one `Box3` of the group, taken while its own
 * transform is still identity so the numbers come out in the head's frame, and
 * squashing the lot under a beanie is one scale on it. Neither needs a case.
 */
export function buildHair(
  head: Object3D, look: Look, p: Proportions, l: Leases, rng: Rng,
): HairProfile {
  const R = p.headR;
  const style: HairStyle = look.hairStyle;
  const mat = hairSurface(l, look.hair);
  const hair = new Group();

  /** Masses that reach past the neck, and which way each one gets by. */
  const hanging: { mesh: Mesh; way: Fall }[] = [];
  const falls = (mesh: Mesh, way: Fall): void => { hanging.push({ mesh, way }); };

  const crown = (sx: number, sy: number, sz: number, y: number, z: number): Mesh => {
    const m = new Mesh(orb(l), mat);
    m.scale.set(R * sx, R * sy, R * sz);
    m.position.set(0, R * y, R * z);
    m.castShadow = true;
    hair.add(m);
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
    hair.add(m);
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
      hair.add(quiff);
      break;
    }

    case 'beehive': {
      // One swept mass, which is what a beehive is and what this was not.
      //
      // It was a crown 2.02 R across carrying a tower 1.62 R across carrying a
      // cone, and both joins were visible from the house: a ledge two and a half
      // centimetres deep where the tower stood on the crown, and a point where
      // the finial stood on the tower. Soft-serve in an acorn cup. Nothing about
      // a beehive has a corner in it — it is the hair off the whole head
      // gathered upward, so the outline leaves the skull and arrives at the top
      // without changing direction twice.
      //
      // So it is the crown and one ellipsoid, and the ellipsoid does all three
      // jobs the three meshes were sharing. Its widest point is 0.96 R at
      // y 1.05, a shade inside the crown's 1.01 R at y 0.52, so the outline
      // crosses from one to the other through a waist of about a centimetre
      // instead of a step of three. Its bottom is buried at −0.40 R, well inside
      // the skull, so there is no lower edge anywhere to catch the light. And
      // its top is a rounded end for nothing, which is the whole reason it is no
      // longer a cone: a `spike` cannot be blunt, and a beehive that comes to a
      // point is a party hat.
      //
      // ## It also stops at 2.50 R rather than 2.83 R
      //
      // That is a published `crown` a third of a head radius lower and every hat
      // over a beehive reads it, so it is worth saying why the direction is the
      // safe one. The height that went was the finial — the part above where the
      // mass had already stopped widening — and it was never the read. What says
      // beehive at ten metres is that the hair is a *tower narrower than the
      // head*, which is the one thing no other volume in the union does: an afro
      // is nearly as tall and twice as wide, and `updo` is the same discipline
      // with none of the height. Losing five centimetres off the tip costs
      // nothing against either.
      crown(2.02, 1.10, 2.02, 0.52, -0.20);
      const tower = new Mesh(orb(l), mat);
      tower.scale.set(R * 1.92, R * 2.90, R * 1.84);
      tower.position.set(0, R * 1.05, R * -0.24);
      tower.castShadow = true;
      hair.add(tower);
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
      //
      // ## The length, which was not a bob's
      //
      // "Cut off level below the jaw" is the sentence, and the geometry said
      // something else. These reached 1.55 R down, past the shoulder line, so
      // `settle` cut them where it cuts everything that hangs — 1.49 R, which is
      // to the millimetre where `long`'s curtains end. A bob and a curtain were
      // therefore the same length, the same width to within a centimetre, and
      // hung off the same shell, and the union was spending two of its seventeen
      // names on one picture. The jaw is at −1.05 R and the shoulder line is at
      // −1.29 R, so stopping at −1.15 R is below the one and clear of the other:
      // the wings now keep their own hem instead of being given the common one,
      // and `settle` leaves them alone, which is what its first rule is for.
      for (const s of [SIDE.left, SIDE.right]) {
        const wing = new Mesh(orb(l), mat);
        wing.scale.set(R * 0.80, R * 1.46, R * 1.24);
        wing.position.set(s * R * 0.88, -R * 0.42, -R * 0.34);
        wing.castShadow = true;
        hair.add(wing);
        falls(wing, 'shoulder');
      }
      break;
    }

    case 'emo': {
      // Hair that is *on* a head rather than near one, and the only style here
      // built that way.
      //
      // Every other case in this file is spheres parked against a skull, and for
      // hair with body in it that is the right model — a mass has a middle, and
      // where its surface ends up is a consequence. Ironed hair has no middle.
      // It follows the skull to its widest point and then falls straight, which
      // two spheres cannot make and five cannot either. What they make is a
      // helmet, and three passes at making the helmet smaller only ever made a
      // smaller helmet.
      //
      // So this is `headShell` — see `performer-assets.ts`, where the whole
      // argument lives. Two walls cut to the head's own ellipsoid and joined at
      // every edge, scaled by exactly the scale the skull is built at, so both
      // surfaces are stated as the head: `[1.08, 1.18]` is **a centimetre of air
      // under a centimetre and a third of hair**. The air is deliberate
      // and it is the second thing this got wrong — a shell laid flat on the
      // skin is a bathing cap, and hair sits off a scalp — but it is a
      // centimetre by decision rather than a gap that opens and closes between
      // the crown and the nape because two ellipsoids disagree. Thin wall, wide
      // gap: the hair is *lifted*, which is what hair does, rather than a thick
      // rind moulded onto a skull.
      //
      // ## The face, which is the point of the style
      //
      // The head is covered by two of these and the seam between them is the
      // whole design. The cap takes the arc from one cheek round the back to the
      // other, leaving a 0.56π opening centred on the face; the fringe fills
      // that opening from the crown down, and its hem is a *diagonal* — that is
      // the one thing this generator does that a sphere cannot, an edge that
      // runs from the hairline on one side to below the eye on the other.
      //
      // The measured result: both brows are behind hair, the swept eye and its
      // outer corner are behind hair, and the other eye, the nose, the mouth,
      // both cheeks and the chin are in the open. One eye gone and one eye
      // looking at you, which is what the style is.
      const s = rng.chance(0.5) ? SIDE.left : SIDE.right;

      // Ironed is a surface as well as a shape, and this is the half of it a
      // silhouette cannot carry. `hairSurface` is roughness 0.72 — hair that
      // scatters — and under a follow spot that is a matte shape whatever it is
      // shaped like. Straightened hair returns a *band*: one long highlight
      // running the length of the fall, which is the thing a photograph of this
      // haircut always has in it. At 0.52 it is a long way short of `slick`'s oiled
      // 0.26 and of `updo`'s pinned 0.34, and that ordering is the point: a flat
      // iron is not pomade. Lower than this and the head turns to moulded
      // plastic under a key light, which is the other way to lose a haircut.
      // Both shells take it, so the head is one surface and the band crosses the
      // whole of it.
      const ironed = surface(l, look.hair, { roughness: 0.52, metalness: 0.04 });

      // Both are scaled by the skull's own scale — `2 × 2.10 × 1.90 R`, the
      // numbers `performer.ts` builds the head at — and that is not a
      // coincidence to be tidied later. It is what makes `wall` mean what its
      // doc says: a multiple of the head's own radius, on every axis at once.
      const head = (g: BufferGeometry): Mesh => {
        const m = new Mesh(g, ironed);
        m.scale.set(R * 2, R * 2.10, R * 1.90);
        m.castShadow = true;
        hair.add(m);
        return m;
      };

      // The cap, and `fall` is where the haircut is rather than the hem.
      //
      // A hem at one angle all the way round is a **bowl cut**: same length over
      // the ear as at the nape, cut level, which is 1966 and not 2003. What is
      // left of a bowl once the fringe is swept is still a bowl. So the fall is
      // three numbers — 0.10 of a head radius beside the face, 0.02 behind it,
      // 0.10 on the other side — and the shape that comes out is the one this
      // haircut is built on: layers, slightly longer at the face than at the
      // nape, which is what no single hem can say.
      //
      // **They are small numbers on purpose.** The sides are the part that goes
      // wrong in the other direction: hair down the jaw to the collar is a bob
      // with a fringe on it, and this cut is *short* everywhere except the
      // fringe. The ends land at y −1.11 R — just past the chin at −1.05, a
      // fifth of a head radius clear of the shoulder line — and the length in
      // the style is the thing hanging over one eye, not the pieces beside it.
      head(headShell(l, {
        phi: [Math.PI * 0.72, Math.PI * 2.28],
        hem: [Math.PI * 0.80, Math.PI * 0.80],
        wall: [1.08, 1.18],
        fall: [0.10, 0.02, 0.10],
        land: [0.95, 0.95],
      }));

      // The fringe, and it is the *only* long thing here. The hem runs from
      // 0.32π on the short side of the part — y +0.66 R, above the brow — to
      // 0.66π on the swept side, which is y −0.58 R, and then keeps going:
      // another 0.16 R of fall on that end alone takes the point to −0.75 R,
      // level with the mouth and past the cheekbone. A fringe that stops at an
      // eyebrow is a fringe; one that reaches the jaw on one side and the temple
      // on the other is this haircut, and the contrast with the short sides
      // beside it is the whole read.
      //
      // Both are mirrored by swapping the ends, which is all the part decides.
      const SHALLOW = Math.PI * 0.32;
      const DEEP = Math.PI * 0.66;
      const left = s === SIDE.left;
      head(headShell(l, {
        // `phi` runs from the performer's right cheek to their left, so the far
        // end of the arc is their left and `SIDE.left` sweeps the hair there.
        phi: [Math.PI * 0.26, Math.PI * 0.74],
        hem: left ? [SHALLOW, DEEP] : [DEEP, SHALLOW],
        wall: [1.07, 1.16],
        fall: left ? [0, 0.04, 0.16] : [0.16, 0.04, 0],
      }));
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
        //
        // The 3.20 R is how far the hair *grows*, not how much of it is drawn.
        // This is the style the union defines as reaching to the shoulder line
        // — `mane` is defined against it — so the body says where it stops, and
        // everything `settle` removes here was inside the jacket already.
        const fall = new Mesh(orb(l), mat);
        fall.scale.set(R * 0.76, R * 3.20, R * 1.20);
        fall.position.set(s * R * 0.92, -R * 1.30, -R * 0.34);
        fall.castShadow = true;
        hair.add(fall);
        falls(fall, 'shoulder');
      }
      const back = new Mesh(orb(l), mat);
      back.scale.set(R * 1.95, R * 3.25, R * 1.00);
      back.position.set(0, -R * 1.32, -R * 0.80);
      back.castShadow = true;
      hair.add(back);
      falls(back, 'back');
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
      //
      // Both of those distinctions were being made in words only. The back mass
      // reached 3.95 R down and every millimetre of it below the shoulder was
      // inside the jacket; the front locks were inside the chest from the point
      // they passed the collarbone they are named after. So what separated a
      // mane from a curtain on stage was nothing at all. `back` and `chest` are
      // what make the paragraph above true of the picture rather than of the
      // intention.
      //
      // ## And one of them still was, because length is not available
      //
      // "Falls past the shoulder blades" cannot be seen, and that is not a bug
      // to be fixed here: `settle` stops every hanging mass in the file at the
      // shoulder, for the reason given where it is written, so `long` and `mane`
      // arrive at the same hem however far either is drawn to grow. Front-on
      // they were two slabs 2.60 and 2.80 R wide ending on the same line — a
      // difference of one and a half centimetres a side, which is nothing at
      // ten metres. The only distinction left that the house can actually see is
      // *shape*, so that is the one this takes: a curtain is parallel-sided and
      // a mane is a triangle. The 0.32 of tilt on each fall costs one line and
      // sweeps the hem from 1.02 R at the crown out to 1.63 R at the shoulder,
      // where `long` runs at a flat 1.30 R from top to bottom.
      //
      // It leans out rather than the root moving out, and that is the half of it
      // that matters. Rotation is about the mesh's own centre, so the tip goes
      // outboard and the top comes *in* — to x 0.56 R, still well inside a shell
      // 1.09 R wide at that height, so the mass is more firmly rooted than it
      // was rather than less. The tip lands at 1.63 R against a jacket that is
      // 1.66 R across where `SINK` buries it, which is the number this is
      // pressed up against and the reason it is not 0.40.
      crown(2.08, 1.18, 2.08, 0.52, -0.20);
      shell();
      for (const s of [SIDE.left, SIDE.right]) {
        const fall = new Mesh(orb(l), mat);
        fall.scale.set(R * 0.92, R * 4.40, R * 1.34);
        fall.position.set(s * R * 0.86, -R * 1.75, -R * 0.26);
        fall.rotation.z = s * 0.32;
        fall.castShadow = true;
        hair.add(fall);
        falls(fall, 'shoulder');
        // Forward of the ear and nowhere near the cheek: the front edge lands
        // at z +0.61R, still well behind the brow line.
        const front = new Mesh(orb(l), mat);
        front.scale.set(R * 0.62, R * 2.10, R * 0.62);
        front.position.set(s * R * 0.80, -R * 1.40, R * 0.30);
        front.castShadow = true;
        hair.add(front);
        falls(front, 'chest');
      }
      const back = new Mesh(orb(l), mat);
      back.scale.set(R * 2.15, R * 4.60, R * 1.10);
      back.position.set(0, -R * 1.85, -R * 0.78);
      back.castShadow = true;
      hair.add(back);
      falls(back, 'back');
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
      hair.add(tail);
      falls(tail, 'back');
      for (const s of [SIDE.left, SIDE.right]) {
        const flick = new Mesh(orb(l), mat);
        flick.scale.set(R * 0.70, R * 0.85, R * 1.30);
        flick.position.set(s * R * 0.92, -R * 0.30, -R * 0.42);
        hair.add(flick);
      }
      break;
    }

    case 'dreadlocks': {
      // Ropes with daylight between them, and that is the entire model. This is
      // the only hair in the file with *gaps* in it: a back light goes through
      // it, the outline is a comb rather than a slab, and a head turn moves the
      // locks at slightly different times. A single shaped mass does none of
      // that and reads as `long` in a wig.
      //
      // None of which was true of the picture, and the reason is worth spelling
      // out because it is not the ropes. They were 0.30 R thick and hung on a
      // ring 0.90 R out from the head axis — *inside* a `shell()` that is
      // 1.18 R wide and hangs to the shoulder line on its own. So every rope was
      // buried in a helmet from root to tip, the only part of any of them the
      // house could see was the last centimetre poking out under the hem, and
      // what walked on stage was a smooth slab with a scalloped bottom edge.
      // A model whose whole argument is its outline had no share of its own
      // outline at all.
      //
      // Two clearances fix it, and both are about who owns which part of the
      // silhouette. The scalp stops at the jaw instead of the shoulder, so
      // everything below y −0.92 R is rope and nothing else. And the ring stands
      // outside the scalp rather than inside it, so the temple is scalloped too
      // rather than only the hem.

      // The scalp, and deliberately not `shell()`. A shell is a whole head of
      // hair down to the shoulder, which is exactly right for a bob and fatal
      // here — it is the outline the locks are supposed to be. This is the same
      // idea and the same relationship to the skull: an inflated copy of it,
      // pushed back, so it is proud of the crown, the temples and the nape and
      // buried behind the whole of the face. It is only taken to the jaw.
      const scalp = new Mesh(orb(l), mat);
      scalp.scale.set(R * 2.24, R * 2.12, R * 2.20);
      scalp.position.set(0, R * 0.14, -R * 0.36);
      scalp.castShadow = true;
      hair.add(scalp);

      const n = 9;
      // Nine and not ten, and thicker: what has to survive ten metres is the
      // *gap*, not the rope. Nine locks round this ring are half a head radius
      // apart and each is 0.38 R through, which leaves about two and a half
      // centimetres of dark between them — where ten thinner ones left one, and
      // one centimetre at ten metres is a texture nobody sees rather than a
      // shape everybody does.
      const ring = 0.94;
      // A ring at a constant *normalised* radius on an ellipsoid sits at a
      // constant height, which is why one number does for all nine roots
      // instead of nine solves: 0.94 of full radius puts every root under hair
      // at y 0.50 R and every rope 1.05 R out, against a scalp 1.12 R wide. With
      // 0.19 R of rope on top of that the ring is proud of the scalp at the
      // temple as well as free below the jaw.
      const root = R * (0.14 + 1.06 * Math.sqrt(1 - ring * ring));
      for (let i = 0; i < n; i++) {
        // Round the head from the right temple, backwards, to the left, with
        // the front 90° left out — a lock over the nose is not a hairstyle.
        const a = Math.PI * (0.75 + (i / (n - 1)) * 1.50);
        // Lengths that straddle the shoulder line on purpose. `settle` leaves a
        // mass whose tip is already above the line alone and cuts every other
        // one to the same floor, so a set of lengths all past the shoulder
        // comes back as nine ropes ending on one dead level line — which is the
        // hem of a slab, the thing this style is trying not to be. Drawing from
        // 0.72 to 1.24 puts about a third of them short of the line, where they
        // keep whatever length they were given, and the ends spread over seven
        // centimetres instead of none.
        const half = R * rng.float(0.72, 1.24);
        const lock = new Mesh(pill(l), mat);
        lock.scale.set(R * 0.38, half, R * 0.38);
        const x = Math.cos(a) * R * 1.12 * ring;
        lock.position.set(x, root - half, Math.sin(a) * R * 1.10 * ring - R * 0.36);
        // Flared out at the tip, away from whichever side it grew on, and
        // further than it was: the flare is what opens the gaps downward, so a
        // comb that is tight at the root is a fan at the hem. Capped where it
        // is because `SINK` only buries a tip that is still inside the roll of
        // the shoulder, and at this ring a swing of a quarter of a radian puts
        // the far side of the last rope at 1.40 R against a jacket 1.66 R wide.
        lock.rotation.z = (x >= 0 ? 1 : -1) * rng.float(0.10, 0.26);
        lock.castShadow = true;
        hair.add(lock);
        // Every lock rests, including the ones at the nape. Swinging the back
        // of the ring clear of the shoulder blades and cutting the sides would
        // open a gap in the one shape here whose whole read is that it *is* a
        // ring; and a rope that stops on the shoulder is what dreadlocks this
        // length do.
        falls(lock, 'shoulder');
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
        hair.add(knot);
        // The plait is one hank, so `settle` swings all five knots by one
        // angle and the stack keeps its shape. The 0.04 R of drift per knot in
        // the `z` above was the same intention — a plait that leans away from
        // the spine — attempted without knowing where the spine is, and an
        // order of magnitude short of the back of a jacket.
        falls(knot, 'back');
      }
      break;
    }

    case 'mohawk': {
      // A strip and a crest, and the strip is the half of it that was missing.
      //
      // Shaved sides mean the head's own skin is most of a mohawk, and this was
      // built as though that were the whole of it: eight cones on the midline
      // and no crown mesh anywhere, which from ten metres is a horn on a bare
      // skull. What a mohawk shows at that distance is an *edge* — the line
      // where the clippers stopped — and there was no edge here to see, because
      // there was no hair lying on the head at all, only hair standing off it.
      // The crest was doing the work of saying "hair" and of saying "and none
      // anywhere else", and it could only ever do the first.
      //
      // So the strip is `short`'s crown with the two numbers that make it a
      // strip changed and the other three left exactly alone. It keeps the
      // 2.06 length and the −0.18 seat, which between them are the hairline:
      // this ends over the brow at the same z as every close cut in the file,
      // and writing it as the same numbers rather than as new ones is what stops
      // the two hairlines drifting apart the next time either is touched.
      //
      // What differs is that it is 0.80 across instead of 2.06 — the clippers —
      // and 1.34 tall instead of 1.16, which is not decoration either. A strip
      // left standing between two shaved sides is *longer* hair than a short cut
      // by definition; it has to be or it would not stand. Two centimetres of it
      // clear the skull, which is what puts a band of hair on the head from the
      // front instead of a fin hovering over bare skin.
      //
      // ## Why the strip is 0.80 R and not a hand's width more
      //
      // `performer-accessories.ts` decides whether a hat can be *set down* on
      // hair by asking whether the hair is at least `HOLD` = 0.5 R across, and
      // a mohawk is the one style in the union that has to fail that test. Hair
      // four centimetres wide holds nothing up; a flat cap balanced on a crest
      // reads as a hat that has come off, which is worse than either honest
      // answer. At 0.80 the strip publishes a `halfWidth` of 0.39 R and fails it
      // with room to spare, so a cap flattens the crest — which is what a cap
      // does to a crest. A strip as wide as the crown would quietly lift every
      // hat over a mohawk a whole head clear of the skull.
      const stripW = 0.80;
      const stripH = 1.34;
      const stripL = 2.06;
      const stripY = 0.52;
      const stripZ = -0.18;
      crown(stripW, stripH, stripL, stripY, stripZ);
      // Eight cones rather than one fin, because a fin has to *follow* what it
      // grows out of and a straight ridge cannot. Each one is stood on the
      // strip's own ellipse rather than on the skull's, which is the only
      // change of substance: the strip is what the hair comes out of now, so
      // the crest rises out of the band at the hairline and sinks back into it
      // at the nape without a number being tuned against either end.
      //
      // The old crest peaked 2.66 R above head centre — twenty-two centimetres
      // clear of the crown, on a head twenty-seven across. This one peaks at
      // 2.00 R, which is thirteen: still the tallest thing on any close-cut head
      // in the catalogue, and no longer an aerial.
      const n = 8;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const z = 0.55 - 1.40 * t;
        const along = (z - stripZ) / (stripL * 0.5);
        const ridge = R * (stripY + stripH * 0.5 * Math.sqrt(Math.max(0, 1 - along * along)));
        const h = R * (0.28 + 0.60 * Math.sin(Math.PI * t));
        const fin = new Mesh(spike(l), mat);
        // Bases wider than the spacing, so the crest is continuous; as wide as
        // the strip will allow, because a crest ten centimetres across and
        // thirteen tall is a crest and the 0.44 this replaces was a spike; and
        // still inside the strip, so it is the band and never a cone that
        // decides what `halfWidth` gets published.
        fin.scale.set(R * 0.78, h, R * 0.60);
        fin.position.set(0, ridge + h * 0.42, R * z);
        fin.castShadow = true;
        hair.add(fin);
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
      hair.add(halo);
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
        hair.add(bump);
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
      hair.add(bun);
      break;
    }

    case 'curls': {
      // A mass with a lumpy edge, and the lumps have to be *on* the edge or
      // they are not there at all.
      //
      // The eight beads this replaces were scattered over a hemisphere of
      // radius 0.92 R and then pulled in again by their own polar angle, so they
      // sat between 0.49 and 0.77 R out from the head axis — inside a skull that
      // is 1.00 R. Most of each one was buried in the face it was standing on,
      // and what showed was three or four blobs surfacing at random from a
      // smooth cap. It read as damage rather than as hair, and under a brim it
      // was the reason a cap over curls broke out at the sides in one place and
      // not the other seven.
      //
      // ## Which is the pair, and what the pair is about
      //
      // `curls` and `afro` are the two heads of hair with volume and no length,
      // and the union does not want them told apart by scale. So they differ in
      // *how far the hair stands off the skull*, which is the thing you can
      // actually see: an afro is a 3.30 R halo with a near-perfect edge that
      // seven bumps have to be added to spoil, and this is a cap barely a
      // centimetre and a half proud of the head whose edge is *nothing but*
      // bumps. One is a big smooth thing; the other is a small rough one. That
      // survives a hat, a follow-spot and a back row; "the same but smaller"
      // does not.
      crown(2.20, 2.10, 2.16, 0.18, -0.22);
      // Nine on the front-view outline and none anywhere else, for the reason
      // the afro's seven are where they are: hair is read from its silhouette,
      // and a bead on the far side of the head from the house is polygons spent
      // on nothing. They overlap — 0.48 R apart on the ring, 0.58 to 0.76 R
      // across — so the edge is a continuous scallop rather than a string of
      // separate balls, which was the other half of what made eight of them read
      // as damage.
      //
      // Seeded, so the same performer has the same head of hair every show. The
      // jitter in `z` is the one draw that is not about the outline: it stops
      // the nine from lying in a single plane, which from the wings would be a
      // smooth cap with a decorated rim.
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (-0.10 + (i / 8) * 1.20) + rng.float(-0.06, 0.06);
        const curl = new Mesh(bead(l), mat);
        curl.scale.setScalar(R * rng.float(0.58, 0.76));
        curl.position.set(
          Math.cos(a) * R * 1.02,
          R * (0.18 + Math.sin(a) * 1.00),
          -R * 0.22 + R * rng.float(-0.24, 0.24),
        );
        hair.add(curl);
      }
      break;
    }

    case 'hood': {
      // Outerwear, in the jacket's colour, and the one thing in this union that
      // is not a haircut.
      //
      // ## It does not reach the coat, and that is the decision rather than a
      // ## limitation
      //
      // A real hood is sewn to one, and the previous pass took that literally:
      // the cloth fell past the shoulder line and finished inside the jacket, so
      // the two solids overlapped and there was no seam to see. It still read
      // wrong, and the reason is structural rather than a number. This is a
      // `HairStyle`. It is built into the hair group, which hangs off the
      // **head** — and a head yaws through 1.2 radians while a coat does not, so
      // anything modelled as attached to both is attached to neither: it swings
      // through the shoulder it is supposedly sewn to every time the player
      // looks at the drummer. Cloth that pretends to a join it cannot keep is
      // worse than cloth that does not claim one.
      //
      // So it stops at the neck. The hem lands at y −1.16 R against a shoulder
      // line at −1.29, which is a hood pulled up over a head — the object this
      // union can actually hold — and the collar of the coat below it is the
      // jacket's business. Being a garment worn instead of hair is still true
      // and still enforced, in `cast.ts`, by `COVERED`.
      //
      // What was genuinely broken is fixed and stays fixed. It was a bare sphere
      // 35 % wider than the skull with a bite out of the front: no thickness, so
      // its edge was a knife and it only rendered at all because the material
      // was `doubleSide`, and — because a sphere can only be concentric with the
      // head — 3 to 9 cm of air, most of it behind the skull. `headShell` gives
      // the cloth a section and states its distance from the head as a number:
      // 1.12 to 1.22, which is a centimetre and a half of daylight for the hair
      // underneath and a centimetre and a third of cloth over it.
      const cloth = surface(l, shade(look.outfit.jacket, -0.05), {
        roughness: 0.92, metalness: 0,
      });
      const drape = (g: BufferGeometry): void => {
        const m = new Mesh(g, cloth);
        m.scale.set(R * 2, R * 2.10, R * 1.90);
        m.castShadow = true;
        hair.add(m);
      };

      // The garment itself. `fall: [0, 0.30, 0]` is nothing at either end of the
      // arc and a third of a head radius at the back, so the cloth covers the
      // nape and the top of the neck and stops there — the hem lands at
      // y −1.16 R, a head radius and a bit down, with the shoulder line another
      // 0.13 below it. The front of the collar stays open and no cloth hangs
      // across the face, which is what the zeroes at the ends are for.
      //
      // `land: [1.00, 0.85]` leaves the sides plumb and brings the back in an
      // eighth. Cloth off the back of a head hangs closer to the neck than the
      // skull is wide; the sides have nothing to clear.
      drape(headShell(l, {
        phi: [Math.PI * 0.80, Math.PI * 2.20],
        hem: [Math.PI * 0.72, Math.PI * 0.72],
        wall: [1.12, 1.22],
        fall: [0, 0.30, 0],
        land: [1.00, 0.85],
      }));

      // And the brow, which closes the top of the opening. The old shell's bite
      // ran from the hem clear to the crown, so a hooded player was bare-headed
      // in a wedge up the middle of their own forehead — visible in every front
      // view and never once noticed, because a hood is the thing you expect to
      // see a face inside. The opening should be a hole *around* a face: this is
      // its top edge, at 0.36π, which is y +0.52 R and a thumb above the brow.
      drape(headShell(l, {
        phi: [Math.PI * 0.18, Math.PI * 0.82],
        hem: [Math.PI * 0.36, Math.PI * 0.36],
        wall: [1.12, 1.22],
      }));
      break;
    }

    case 'wrap': {
      // The same generator as a hood and three deliberate differences from one,
      // because at ten metres those are the whole distinction. It is cut to the
      // skull rather than standing off it, so it is a covered head and not a
      // garment with a head somewhere inside; it takes the accent colour rather
      // than the jacket's, because a scarf over the hair is the one loud thing a
      // player in an otherwise plain outfit is wearing; and it falls onto the
      // shoulders, where a hood hangs behind them.
      //
      // "Cut to the skull" is now a number rather than a claim: the wall is 1.05
      // to 1.14, so there is seven millimetres of air under a centimetre and a
      // fifth of cloth. It is the tightest of the three, which is the
      // distinction — a scarf is tied *on*, where a hood is pulled *over*.
      const cloth = surface(l, look.outfit.accent, {
        roughness: 0.90, metalness: 0.04,
      });
      const tie = (g: BufferGeometry): void => {
        const m = new Mesh(g, cloth);
        m.scale.set(R * 2, R * 2.10, R * 1.90);
        m.castShadow = true;
        hair.add(m);
      };

      // The cover, and it does **not** fall all the way round. That was the last
      // version of this and it was wrong: a scarf let down evenly from a hem is
      // a cowl, and what this style has always been is a cover with two lengths
      // hanging beside the face. Turning those two into a skirt lost the whole
      // silhouette. So the shell only tucks at the nape — `[0, 0.12, 0]`, enough
      // that the neck is not bare under it — and the length is the pair below.
      tie(headShell(l, {
        phi: [Math.PI * 0.76, Math.PI * 2.24],
        hem: [Math.PI * 0.78, Math.PI * 0.78],
        wall: [1.05, 1.14],
        fall: [0, 0.12, 0],
        land: [0.95, 0.80],
      }));

      // The front edge, lower than a hood's because a scarf covers the hairline
      // where a hood shows it: 0.32π is y +0.60 R.
      tie(headShell(l, {
        phi: [Math.PI * 0.22, Math.PI * 0.78],
        hem: [Math.PI * 0.32, Math.PI * 0.32],
        wall: [1.05, 1.14],
      }));

      // And the two lengths. They start at y +0.20 R, a fifth of the way up
      // inside a cover whose rim is at −0.86, so each one comes out of the cloth
      // rather than hanging near it; they are 0.10 R wider than the cover at the
      // ear, which is cloth thickening where it is gathered; and `settle` stops
      // them in the roll of the shoulder, which is what "falls onto the
      // shoulders" means and where the sentence above came from.
      for (const side of [SIDE.left, SIDE.right]) {
        const fall = new Mesh(orb(l), cloth);
        fall.scale.set(R * 0.72, R * 2.10, R * 1.10);
        fall.position.set(side * R * 0.82, -R * 0.85, -R * 0.26);
        fall.castShadow = true;
        hair.add(fall);
        falls(fall, 'shoulder');
      }
      break;
    }

    default:
      // See the header. Not reachable, and that is the point: a new value in
      // `HairStyle` fails here rather than walking on stage bald.
      assertBuilt(style);
  }

  settle(hanging, shoulders(p), R);
  // Measured before parenting, so the box is in the head's own frame rather
  // than wherever the rig happens to be standing, and after settling, so it
  // describes the hair a hat is actually going to meet.
  const profile = measure(hair, BEARING[style], R);
  head.add(hair);
  return profile;
}

/**
 * Read the two numbers off what was built, and hand back the one lever.
 *
 * An empty group — `bald` — boxes as an inverted infinity, which is why the
 * reach is floored rather than passed on: a crown of `-Infinity` would make
 * every hat in the union lift by an absurd amount rather than by none, and a
 * bald player in a porkpie is the commonest figure in the catalogue.
 */
function measure(hair: Group, bearing: HairBearing, R: number): HairProfile {
  const box = new Box3().setFromObject(hair);
  const state = {
    crown: box.isEmpty() ? 0 : Math.max(0, box.max.y / R),
    width: box.isEmpty() ? 0 : Math.max(0, box.max.x / R),
  };
  return {
    get crown() { return state.crown; },
    get halfWidth() { return state.width; },
    bearing,
    compress(to: number): void {
      if (state.crown <= to || state.crown <= 0) return;
      // Floored well above zero: a hat is allowed to flatten hair, not to
      // delete it, and a scale of 0 on a shared geometry is a degenerate
      // normal matrix rather than an invisible mesh.
      const k = Math.max(0.15, to / state.crown);
      hair.scale.setScalar(k);
      state.crown *= k;
      state.width *= k;
    },
  };
}

// ---------------------------------------------------------------------------
// Where the body lets hair hang
// ---------------------------------------------------------------------------

/**
 * Which way a mass of hair gets past the shoulders.
 *
 * Three answers, and the geometry rather than taste decides which is available
 * to a given mass. Hair beside the head cannot go anywhere: the torso is 1.83 R
 * wide at the shoulders and a curtain hangs at 0.9 R, so clearing it sideways
 * would mean hair growing out of the air a hand's width off the ear. Hair at the
 * nape and hair over the collarbone both *can* clear, because the torso is only
 * 1.28 R deep and the swing needed is small enough that the root stays inside
 * the shell it grew out of.
 */
type Fall = 'shoulder' | 'chest' | 'back';

/** The body, seen from inside the head group. Metres; `line` is negative. */
interface Shoulders {
  /** Height of the shoulder line relative to head centre. */
  line: number;
  /** Half-width and half-depth of the torso where it is widest. */
  halfWidth: number;
  halfDepth: number;
}

/**
 * Where `Proportions` says the body is, read from the head's point of view.
 *
 * This is the arithmetic `proportions()` did to place the head, run backwards,
 * and it comes out at a constant −1.293 R for every performer of every height: a
 * neck gap plus 0.96 of a head radius. It is computed rather than written down
 * precisely *because* it is a consequence — of `NECK` and of the head's own
 * offset, both of which live in `performer-look.ts` and neither of which is this
 * file's to know by heart.
 *
 * The lean is deliberately half-ignored. `cos(lean)` is in, because a pitched
 * torso genuinely lowers the shoulder; the couple of centimetres it also moves
 * the shoulder *forward* are not, because that moves the chest towards anything
 * hanging over it and the back away from anything hanging behind it, and `CLEAR`
 * is wider than the error in either direction.
 */
function shoulders(p: Proportions): Shoulders {
  return {
    line: p.hipY + p.torsoH * Math.cos(p.lean) - p.head.y,
    halfWidth: p.torsoW * 0.5,
    halfDepth: p.torsoD * 0.5,
  };
}

/**
 * How far into the shoulder a resting mass is allowed to end, in head radii.
 *
 * Not zero: a curtain cut off exactly at the shoulder line ends in a visible
 * disc hanging over a sloping shoulder. Not much either. `torsoShell` rolls over
 * at the top, so the body is only about 1.10 R wide at the shoulder line itself
 * and does not reach the 1.30 R a curtain's outer edge needs until roughly this
 * far below it. Deep enough for the tip to be inside the roll, shallow enough
 * that a head turn does not drag it out through the back of the jacket.
 */
const SINK = 0.20;

/** Daylight between hair and cloth, in head radii. About a centimetre. */
const CLEAR = 0.08;

/**
 * The most a hank may swing. About thirty degrees.
 *
 * A cap rather than a solve, because the solve has no upper bound: a mass whose
 * tip starts close under the chin needs most of a right angle to get outside a
 * torso, and hair standing out horizontally is a worse picture than hair with
 * its tip in a jacket. Nothing in the seventeen currently reaches it.
 */
const SWING = 0.55;

/**
 * Put every hanging mass where the body is not. The rule, once, for all seventeen.
 *
 * A mass whose lowest point is above the shoulder line is left alone, which is
 * most of the hair in this file and costs an if.
 *
 * A `shoulder` mass is **shortened**, holding its top exactly where it grew out
 * of the shell so the hair still comes from the head rather than floating beside
 * it. What that removes was already invisible: from the front the torso's own
 * surface is 1.11 R proud of a curtain hanging at 0.9 R, from the side the
 * curtain is a metre inboard of the shoulder, and from the back the torso is
 * behind it — the only places the old geometry showed at all were the corners,
 * where it broke the outline of the jacket at three-quarters and sawed through
 * the shoulder every bar with `groove` on. So this is not a haircut. It is the
 * part of the model that was inside a solid, and nothing else.
 *
 * A `chest` or `back` mass is **swung** about the head's own origin, which is
 * what a hank of hair pivots about. One angle for the whole set rather than one
 * per mesh, so a plait bends as a plait instead of coming apart knot by knot,
 * and the angle is solved from the *deepest* tip in the set — everything above
 * it is nearer the pivot and rises further, into the narrowing top of the lathe
 * where there is less and less to clear. Partial burial on the way down is not a
 * fault to be fixed: hair against a back lies on the back.
 */
function settle(
  hanging: readonly { mesh: Mesh; way: Fall }[], body: Shoulders, R: number,
): void {
  const floor = body.line - SINK * R;
  for (const { mesh, way } of hanging) {
    if (way !== 'shoulder') continue;
    const half = halfHeight(mesh);
    if (mesh.position.y - half >= body.line) continue;
    const top = mesh.position.y + half;
    // A stub rather than an inversion, for a mass that begins below the line.
    const cut = Math.max((top - floor) * 0.5, half * 0.08);
    mesh.scale.y *= cut / half;
    mesh.position.y = floor + cut;
  }

  swing(hanging, 'back', body, R);
  swing(hanging, 'chest', body, R);
}

/**
 * One angle, solved from the deepest tip, applied to the whole hank.
 *
 * The solve is the only trigonometry in the file and it is three lines. Take the
 * tip at `(y, z)` relative to head centre, write it as a radius `ρ` and an angle
 * `ψ` forward of straight down; a rotation of `θ` about the lateral axis leaves
 * it at `z = ρ sin(ψ − θ)`. So the angle that puts the tip on a given plane is
 * `ψ − asin(target / ρ)`, and taking `asin`'s principal branch is what keeps the
 * answer the *small* rotation — the other solution swings the hair up over the
 * head to arrive at the same plane from above.
 *
 * `target` is the torso's own surface at the tip's `x`, from the ellipse
 * `torsoShell` is lathed into, plus the mass's own half-depth so the whole of it
 * clears rather than its centreline, plus `CLEAR`.
 */
function swing(
  hanging: readonly { mesh: Mesh; way: Fall }[],
  way: 'chest' | 'back', body: Shoulders, R: number,
): void {
  const hank = hanging.filter((h) => h.way === way);
  if (hank.length === 0) return;
  const dir = way === 'chest' ? 1 : -1;

  let theta = 0;
  let deepest = Infinity;
  for (const { mesh } of hank) {
    const tip = mesh.position.y - halfHeight(mesh);
    if (tip >= body.line || tip >= deepest) continue;
    deepest = tip;
    const across = Math.min(1, Math.abs(mesh.position.x) / body.halfWidth);
    const want = dir * (
      body.halfDepth * Math.sqrt(Math.max(0, 1 - across * across))
      + halfDepth(mesh) + CLEAR * R
    );
    const reach = Math.hypot(tip, mesh.position.z);
    if (reach < 1e-6) continue;
    const psi = Math.atan2(mesh.position.z, -tip);
    theta = psi - Math.asin(Math.max(-1, Math.min(1, want / reach)));
  }
  if (theta === 0) return;
  theta = Math.max(-SWING, Math.min(SWING, theta));

  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  for (const { mesh } of hank) {
    const { y, z } = mesh.position;
    mesh.position.setY(y * cos - z * sin).setZ(y * sin + z * cos);
    // Composed onto whatever the style already set rather than assigned. No
    // hanging mass in the seventeen has a lateral tilt of its own today, and a
    // future one that did would otherwise have it silently thrown away.
    mesh.rotation.x += theta;
  }
}

/**
 * Half the mesh's own height, in metres, whatever primitive it is.
 *
 * Off the geometry rather than off `scale.y`, because those are not the same
 * number: `orb` is a unit sphere, so half its height is `scale.y / 2`, and
 * `pill` is a capsule of total length two, so half its height is `scale.y`. A
 * curtain is an `orb` and a dreadlock is a `pill`, and a rule that assumed
 * either would cut the other one in half or leave it twice as long.
 */
function halfHeight(m: Mesh): number {
  const g = m.geometry;
  if (!g.boundingBox) g.computeBoundingBox();
  return (g.boundingBox?.max.y ?? 0.5) * m.scale.y;
}

/** Half the mesh's own depth, for the same reason and by the same means. */
function halfDepth(m: Mesh): number {
  const g = m.geometry;
  if (!g.boundingBox) g.computeBoundingBox();
  return (g.boundingBox?.max.z ?? 0.5) * m.scale.z;
}
