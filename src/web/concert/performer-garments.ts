/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The eight silhouettes, and the one table three files read to agree on them.
 *
 * `Garment` in `concert/types.ts` argues *what* the eight are and why the list
 * stops at eight; this file is *how*, and it exists because of a fact about the
 * renderer's layout that no amount of care in one file could have fixed.
 *
 * ## Three files put cloth on one person
 *
 * The torso is `performer-look.ts`, the sleeves are `performer-arms.ts` and the
 * legs are `performer-legs.ts`, and that split is right — they are three
 * unrelated pieces of geometry maintained by different hands. But a *garment*
 * crosses all three. A robe is not a torso decision: it is a column of cloth to
 * the ankle, which means the arms hang wide out of it and the legs are the same
 * cloth continuing rather than a pair of trousers. Left to themselves the three
 * files would each carry their own `switch (garment)`, three copies would drift,
 * and the failure is completely specific and completely silly: a thobe with
 * charcoal pinstripe shins under it, because two files were dressed for a robe
 * and one was still dressing a lounge suit.
 *
 * So the three files ask questions and this file answers them. `cutOf` is the
 * facts — what colour the shell is, whether there are lapels, what is under the
 * hem — and `sleeveOf` and `legsOf` are the two answers the other two files
 * need, handed over as a finished material rather than as a colour they would
 * each have to turn into one. **Nothing about which garment is which lives
 * anywhere else.** The rule that keeps that true is worth stating because it is
 * easy to break by accident: `under: 'garment'` and a floor-length skirt are the
 * *same decision*, and they are made forty lines apart in this file rather than
 * in two.
 *
 * ## The import runs backwards on purpose
 *
 * This module imports `SIDE` and `assertBuilt` from `performer-look.ts`, and
 * `performer-look.ts` imports `dressGarment` from here — a cycle, deliberately,
 * and it is safe for a reason rather than by luck: neither module touches the
 * other's bindings at evaluation time. Everything crossing the cycle is used
 * inside a function that runs long after both modules have finished loading. The
 * alternative was a third copy of the one line that makes the exhaustiveness
 * check work, which is precisely what `assertBuilt`'s own comment says not to do.
 *
 * ## The default is not a default
 *
 * `suit` draws **nothing here**. That is the acceptance test for the whole
 * feature written as a case in a switch: a genre whose wardrobe names no
 * garments gets `suit` from `cast.ts` without spending a random draw, `suit`
 * takes every field in `CUTS` at the value the renderer used before this file
 * existed, and its case adds no mesh. Ten genres that nobody has dressed are
 * therefore not *approximately* what they were, they are vertex-for-vertex what
 * they were, and that is checkable on the bench rather than a promise.
 *
 * ## Cost
 *
 * Between nothing and three meshes per player, all of them leased from the same
 * pool everything else uses, and no garment adds a material a player did not
 * already have except the braces and the sash — both of which are one shade off
 * a colour the outfit already carries.
 */

import { Group, Mesh, MeshStandardMaterial } from 'three';

import type { Garment, Look } from '../../concert/types.js';

import {
  Leases, clothSurface, shade, skinSurface, slab, spike, torsoShell, tube,
} from './performer-assets.js';
import { SIDE, assertBuilt, type Proportions } from './performer-look.js';

// ---------------------------------------------------------------------------
// The facts
// ---------------------------------------------------------------------------

/**
 * What a garment is, expressed as the questions the three drawing files ask.
 *
 * Every field here is a fact the *shared* geometry needs — the parts that exist
 * for every garment and only change their colour, their size or their presence.
 * Anything a garment adds that no other garment has (a skirt, two tails, a sash,
 * a pair of braces) is not a field, it is a case in `dressGarment`. That line is
 * where the file stops being a costume shop: a field costs eight entries and
 * gets read by three files, so it has to be something at least two garments
 * disagree about, and a one-off is cheaper as five lines in a switch.
 */
export interface GarmentCut {
  /**
   * Which of the outfit's colours the torso shell is cut from.
   *
   * `'shirt'` is not a colour swap, it is the whole of what a waistcoat and a
   * pair of shirtsleeves *are*: the shoulders and the arms are the shirt and
   * whatever sits over them is a smaller object on top. A jacketed shoulder is
   * square and padded and a shirt shoulder is not, and that difference carries
   * at a distance where a lapel has stopped being visible.
   */
  shell: 'jacket' | 'shirt';
  /**
   * A multiplier on the shell's width and depth. 1 is the tailored default.
   *
   * Small numbers — nothing here is above 1.06 — because the shell is also what
   * the arms clear their ribs against and what the hair is settled onto, and a
   * torso that grew 20 % would have every player's elbows shoved out through
   * their own sleeves. What it buys is the difference between cloth that is
   * hanging and cloth that has been fitted, which reads even at a few per cent.
   */
  girth: number;
  /** The shirt mass proud of the chest: the full front, a neck band, or none. */
  chest: 'front' | 'collar' | 'none';
  /** Whether the two notched lapel slabs are built. */
  lapels: boolean;
  /**
   * What is below the hem, and therefore what colour and girth the legs are.
   *
   * `'garment'` means there are no trousers: the legs are the same cloth as the
   * body, a little thicker, and a floor-length skirt is hiding most of them.
   * They are still *built* — see the header of `performer-legs.ts`, which won
   * the argument that a missing leg reads as a bust on a plinth — and the reason
   * they are still worth building under a skirt is the seated postures. A player
   * sitting in a thobe has the cloth over their knees and the same cloth down
   * the shin, and hiding the legs would have left their shoes out in front of
   * them attached to nothing.
   */
  under: 'trousers' | 'garment';
  /** What the arm is made of. See `sleeveOf`. */
  sleeve: 'jacket' | 'shirt' | 'wide' | 'bare';
}

/**
 * Every garment's facts, and exhaustive by construction.
 *
 * `Record<Garment, …>` rather than a function with a `switch` in it, which is
 * the cheaper of the two ways to make the compiler count: a missing key is a
 * type error at the declaration rather than at a call site, and a key that is
 * not in the union is one too. The `switch` further down needs `assertBuilt`
 * because it returns `void` and TypeScript will not check it; this does not.
 */
const CUTS: Record<Garment, GarmentCut> = {
  /**
   * The lounge suit, and every value below is the number the renderer used
   * before garments existed. This row is the regression test.
   */
  suit: {
    shell: 'jacket', girth: 1.00, chest: 'front', lapels: true,
    under: 'trousers', sleeve: 'jacket',
  },
  /** Identical to a suit from the front. The two panels are the difference. */
  tails: {
    shell: 'jacket', girth: 1.00, chest: 'front', lapels: true,
    under: 'trousers', sleeve: 'jacket',
  },
  /**
   * The skirted coat: sherwani, achkan, court coat, kurtā. No lapels, because
   * the collar stands instead — and a shirt front still shows below it, which is
   * the cravat in 1720 and the kurtā under a sherwani in every other era.
   */
  coat: {
    shell: 'jacket', girth: 1.03, chest: 'front', lapels: false,
    under: 'trousers', sleeve: 'jacket',
  },
  /** Thobe, kaftan, galabeya, cassock, choir robe. One column, wide sleeves. */
  robe: {
    shell: 'jacket', girth: 1.06, chest: 'none', lapels: false,
    under: 'garment', sleeve: 'wide',
  },
  /** Fitted above and flared below — the only garment that changes width. */
  gown: {
    shell: 'jacket', girth: 0.95, chest: 'none', lapels: false,
    under: 'garment', sleeve: 'bare',
  },
  /** Wrapped to the ankle with one band over the shoulder, over a blouse. */
  drape: {
    shell: 'jacket', girth: 0.98, chest: 'collar', lapels: false,
    under: 'garment', sleeve: 'shirt',
  },
  /**
   * A shirt with a sleeveless body over it. `chest: 'none'` because the shell
   * *is* the shirt here — a shirt front in the shirt colour on a shirt-coloured
   * torso is a mesh nobody can see.
   */
  waistcoat: {
    shell: 'shirt', girth: 0.98, chest: 'none', lapels: false,
    under: 'trousers', sleeve: 'shirt',
  },
  /** No jacket at all. The braces are the entire silhouette; see the switch. */
  shirtsleeves: {
    shell: 'shirt', girth: 0.96, chest: 'none', lapels: false,
    under: 'trousers', sleeve: 'shirt',
  },
};

/** What this player is wearing, as facts. See `GarmentCut`. */
export function cutOf(garment: Garment): GarmentCut {
  return CUTS[garment];
}

// ---------------------------------------------------------------------------
// The two answers the other two files need
// ---------------------------------------------------------------------------

export interface SleeveCloth {
  material: MeshStandardMaterial;
  /** Multipliers on the upper-arm and forearm radii the arm would otherwise use. */
  upper: number;
  fore: number;
}

/**
 * What to build an arm out of.
 *
 * A finished material rather than a colour, and that is not tidiness. `bare` is
 * a *skin* surface and every other value is a *cloth* surface, and those are two
 * different functions with two different pools behind them — handing back a
 * string would mean `performer-arms.ts` deciding which one to call, which is the
 * one decision this file exists to keep out of there.
 *
 * The radii are multipliers rather than metres for the same reason: how thick a
 * cartoon arm is at a given build is the arms file's business and it argues the
 * number at length. What a *garment* has an opinion about is only whether the
 * cloth hangs off it. A wide sleeve is half again as thick because a kaftan
 * sleeve is a bag rather than a tube; a bare arm is a fifth thinner because
 * there is no cloth on it, and an arm that stayed the same width when the
 * sleeve came off is the tell that a wardrobe is painted on.
 */
export function sleeveOf(look: Look, l: Leases): SleeveCloth {
  const { jacket, shirt, fabric } = look.outfit;
  switch (cutOf(look.outfit.garment).sleeve) {
    case 'jacket':
      return { material: clothSurface(l, jacket, fabric), upper: 1, fore: 1 };
    case 'shirt':
      return { material: clothSurface(l, shirt, fabric), upper: 0.94, fore: 0.96 };
    case 'wide':
      return { material: clothSurface(l, jacket, fabric), upper: 1.52, fore: 1.44 };
    case 'bare':
      return { material: skinSurface(l, look.skin), upper: 0.80, fore: 0.82 };
  }
}

export interface LegCloth {
  material: MeshStandardMaterial;
  /** Multiplier on the thigh and shin radii the legs file would otherwise use. */
  girth: number;
}

/**
 * What to build a leg out of.
 *
 * Two answers, and the second one is the one that matters. Under trousers this
 * is exactly what `performer-legs.ts` did on its own — the trouser colour, the
 * outfit's fabric, no change of thickness — and under a garment the leg *is* the
 * garment: the jacket colour, a tenth thicker, so that where a robe's skirt ends
 * and the leg begins there is no seam of a different colour and no step in the
 * width. Get this one wrong and the failure is the exact one in the header:
 * a floor-length column of cream linen standing on two charcoal shins.
 */
export function legsOf(look: Look, l: Leases): LegCloth {
  const { jacket, trousers, fabric } = look.outfit;
  return cutOf(look.outfit.garment).under === 'garment'
    ? { material: clothSurface(l, jacket, fabric), girth: 1.10 }
    : { material: clothSurface(l, trousers, fabric), girth: 1 };
}

// ---------------------------------------------------------------------------
// The geometry only one garment has
// ---------------------------------------------------------------------------

/**
 * Everything a garment adds that the shared torso does not already build.
 *
 * Called by `dressTorso` after the shell, the chest, the lapels and the hips,
 * and parented to the same `torso` group as all of them — so a skirt rides a
 * lean and a fold exactly as the body it hangs from does. The lean matters more
 * here than anywhere else in the rig, because these are the longest objects on a
 * performer: a perching singer pitches 15° and the hem of a floor-length robe
 * swings twenty centimetres, which is cloth following a body and is right.
 *
 * The hem is measured **from the boards up**, not from the torso down, and that
 * is the one piece of arithmetic in this file worth reading twice. `torsoH` is
 * the same length for a standing player and a seated one — see `proportions()`
 * — and only `hipY` moves, so a skirt sized as a multiple of the torso would
 * pool half a metre deep on the floor under anybody on a stool and end at the
 * knee on anybody standing. Sized against `hipY` it stops just above the shoe in
 * both, which is what a hem is.
 */
export function dressGarment(
  torso: Group, look: Look, p: Proportions, l: Leases,
): void {
  const { jacket, shirt, trousers, accent, fabric, garment } = look.outfit;
  const cloth = (colour: string): MeshStandardMaterial =>
    clothSurface(l, colour, fabric);

  /**
   * Torso-local `y` of a hem that reaches the boards, and of one at the knee.
   *
   * The torso group sits at `hipY` — see `performer.ts` — so the boards are at
   * `-hipY` in this frame and a hem clear of the shoe top is a shoe's height
   * above that. The knee is a little over half way, which is where a knee is.
   */
  const floorY = -(p.hipY - p.footH * 1.20);
  const kneeY = floorY * 0.52;

  /**
   * A skirt: a column or a cone, hung from inside the hip mass.
   *
   * `width` is a fraction of the *shoulder* width, like everything else in this
   * frame, and the number that matters is `0.88` — that is what `dressTorso`
   * scales the hips to, and a column any wider than it steps out past the hips
   * and reads as a barrel bolted to a person rather than as cloth hanging off
   * one. The first version of the coat was 0.95 and it looked like an apron.
   * A flared hem may of course pass 0.88, since it gets there gradually.
   */
  const skirt = (
    kind: 'column' | 'flared', width: number, hemY: number,
  ): void => {
    // The top sits *above* the hip line so the join is buried inside the hips
    // ellipsoid rather than showing as a rim of a slightly different shade
    // where two ellipsoids meet.
    const topY = p.torsoH * 0.10;
    const len = topY - hemY;
    const m = new Mesh(kind === 'flared' ? spike(l) : tube(l), cloth(jacket));
    m.scale.set(p.torsoW * width, len, p.torsoD * width * 1.02);
    m.position.set(0, (topY + hemY) * 0.5, 0);
    m.castShadow = true;
    torso.add(m);
  };

  /** A stand collar: a short solid cylinder where a lapel would have been. */
  const standCollar = (): void => {
    // Solid rather than a ring, because there is no neck under it. `NECK` in
    // `performer-look.ts` says so out loud — the head floats over the shoulders
    // with a gap — so a torus here would be a collar with the backdrop visible
    // through the middle of it, which is what the first version was.
    const c = new Mesh(tube(l), cloth(shade(jacket, 0.06)));
    c.scale.set(p.torsoW * 0.36, p.torsoH * 0.17, p.torsoD * 0.44);
    c.position.set(0, p.torsoH * 1.01, p.torsoD * 0.02);
    torso.add(c);
  };

  switch (garment) {
    case 'suit':
      // Nothing. See the header: this case being empty is the whole guarantee
      // that an undressed genre is unchanged.
      break;

    case 'tails': {
      /**
       * Two panels behind, to the back of the knee.
       *
       * The only garment in the set that is invisible from the front, which is
       * why it is two slabs at `-z` and nothing else: from the stalls a tailcoat
       * *is* a dark suit, and every photograph that makes it look like anything
       * more is taken from the side. Two rather than one, with daylight between
       * them, because a single panel is an apron worn backwards — the split up
       * the middle is the object.
       *
       * Shaded rather than the jacket's own colour, and that is the fix a
       * screenshot asked for. Black cloth in front of black cloth under a stage
       * lamp is one silhouette with no edge in it: the first version was exact —
       * tails are the same bolt as the coat — and from the back of the room the
       * whole garment vanished into the suit it is supposed to be different
       * from. Two shades is enough for the rim light to find the split, which is
       * the same trick the lapels have used since the beginning.
       */
      for (const s of [SIDE.left, SIDE.right]) {
        const tail = new Mesh(slab(l), cloth(shade(jacket, -0.09)));
        tail.scale.set(p.torsoW * 0.28, -kneeY * 1.22, p.torsoD * 0.11);
        tail.position.set(s * p.torsoW * 0.18, kneeY * 0.61, -p.torsoD * 0.38);
        tail.castShadow = true;
        torso.add(tail);
      }
      break;
    }

    case 'coat':
      // Knee-length and narrower than the hips, so it hangs rather than flares —
      // a sherwani and a 1720 court coat are both a straight skirt with a vent
      // in it, and the flare belongs to the gown.
      skirt('column', 0.86, kneeY);
      standCollar();
      break;

    case 'robe':
      // To the boards, and a hair wider than the hips so the eye reads one
      // column from the shoulder down rather than a jacket standing on a tube.
      skirt('column', 0.87, floorY);
      standCollar();
      break;

    case 'gown':
      // The cone, and the only one. Its apex is inside the waist, so the width
      // at the hem is set by how far down the hem is — which means a gown on a
      // seated player is automatically narrower than a gown on a standing one,
      // exactly as a skirt gathered over a bench is.
      skirt('flared', 1.02, floorY);
      break;

    case 'drape': {
      skirt('column', 0.82, floorY);
      /**
       * The band over the shoulder, and the only asymmetric cloth in the rig.
       *
       * Over the performer's *left*, which is `+x` — see `SIDE`, and the whole
       * point of that constant is that this is the sign everybody gets backwards
       * — falling across the body to the right hip. Its angle and length are
       * solved from the two ends rather than typed in, so it still lands on a
       * shoulder and a hip when the build or the height moves it.
       */
      const topX = SIDE.left * p.torsoW * 0.30;
      const topY = p.torsoH * 0.90;
      const lowX = SIDE.right * p.torsoW * 0.22;
      const lowY = p.torsoH * 0.02;
      const dx = lowX - topX;
      const dy = lowY - topY;
      const sash = new Mesh(slab(l), cloth(accent));
      sash.scale.set(p.torsoW * 0.30, Math.hypot(dx, dy), p.torsoD * 0.10);
      sash.position.set((topX + lowX) * 0.5, (topY + lowY) * 0.5, p.torsoD * 0.50);
      // `+z` about the z axis carries `+y` toward `−x`, so a band whose top is
      // at `+x` needs a negative angle. Taken from the ends for the reason the
      // length is.
      sash.rotation.z = Math.atan2(dx, -dy);
      torso.add(sash);
      break;
    }

    case 'waistcoat': {
      /**
       * A body over the shirt, and the shirt is the shell underneath it.
       *
       * **A second torso lathe, three-quarter height, and not an ellipsoid.** The
       * first version was an ellipsoid and the bench threw it out immediately:
       * a torso is *narrowest* at the waist and an ellipsoid is *widest* in the
       * middle, so the two profiles disagree exactly where a waistcoat is
       * supposed to be tightest. Every string-band player came out with a
       * paunch. The same lathe cannot disagree with itself — scaled to 0.78 of
       * the height it follows the body's own waist, and the point where it
       * closes over lands at the chest, which is a waistcoat's neckline rather
       * than an accident.
       *
       * What is left uncovered is the whole read: the shoulders and the arms
       * stay the shirt's, because `sleeve: 'shirt'` and `shell: 'shirt'` in the
       * table above have already made them so. A jacketed shoulder is square and
       * padded and a shirt shoulder is not, and that survives to the back of a
       * hall long after a lapel has stopped being a shape.
       */
      const vest = new Mesh(torsoShell(l), cloth(jacket));
      vest.scale.set(p.torsoW * 1.03, p.torsoH * 0.78, p.torsoD * 1.06);
      vest.castShadow = true;
      torso.add(vest);
      break;
    }

    case 'shirtsleeves': {
      /**
       * Two braces, and they are not decoration — they are the garment.
       *
       * A shirt with no jacket, drawn honestly, is a torso in a paler colour,
       * and a torso in a paler colour fails the ten-metre test that every member
       * of `Garment` had to pass. Two dark verticals on a pale field do not: it
       * is the one thing on a stage that reads as a person who has taken their
       * coat off, and it is two boxes.
       *
       * Off the trousers rather than off the accent, because that is what they
       * are attached to and because the accent is already spoken for — a tie, a
       * scarf and a sash all take it, and a player in a red tie and red braces
       * looks like a uniform nobody ordered.
       */
      const strap = cloth(shade(trousers, -0.26));
      for (const s of [SIDE.left, SIDE.right]) {
        const brace = new Mesh(slab(l), strap);
        brace.scale.set(p.torsoW * 0.085, p.torsoH * 0.86, p.torsoD * 0.06);
        brace.position.set(s * p.torsoW * 0.17, p.torsoH * 0.46, p.torsoD * 0.45);
        brace.rotation.z = s * 0.05;
        torso.add(brace);
      }
      break;
    }

    default:
      // See the header, and `assertBuilt`'s own comment. Not reachable, and that
      // is the point: a ninth value in `Garment` fails the build here rather
      // than putting a genre's entire band on stage in a lounge suit every night
      // while the wardrobe, the bench label and the IR all insist otherwise.
      assertBuilt(garment);
  }
}
