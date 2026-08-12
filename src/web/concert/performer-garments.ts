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
 * existed, and its case adds no mesh. **Ten genres that nobody has dressed** are
 * therefore not *approximately* what they were, they are vertex-for-vertex what
 * they were, and that is checkable on the bench rather than a promise. There are
 * none left: all nineteen carry a `garments` table now, so the guarantee has
 * been spent rather than broken. It is kept because it is still the acceptance
 * test — a twentieth genre gets `suit` and gets it exactly.
 *
 * ## Cost
 *
 * Between nothing and three meshes per player, all of them leased from the same
 * pool everything else uses, and no garment adds a material a player did not
 * already have except the braces and the sash — both of which are one shade off
 * a colour the outfit already carries.
 *
 * A seated player pays elsewhere and pays more: `legsOf` hands the four skirted
 * garments a `LapCloth`, and `performer-legs.ts` spends up to five meshes of it
 * on the cloth a body holds when it sits down. That is the one thing this file
 * decides and does not draw, and the reason is that it has to be re-fitted every
 * frame to joints only that file has.
 */

import { Color, Group, Mesh, MeshStandardMaterial } from 'three';

import type { Garment, Look } from '../../concert/types.js';

import {
  FLARE_WAIST, Leases, clothSurface, flare, shade, skinSurface, slab, tube,
} from './performer-assets.js';
import {
  LEG_SOCKET_X, SIDE, STANCE_X, assertBuilt, legRadii, type Proportions,
} from './performer-look.js';

// ---------------------------------------------------------------------------
// Contrast that survives the cloth it is cut from
// ---------------------------------------------------------------------------

/**
 * A tone the garment's own colour cannot swallow: away from it, not under it.
 *
 * Every seam a garment has — a lapel, the split between two tails — is drawn as
 * cloth in a second shade of the *same* colour, because that is what a seam is:
 * one bolt, two angles to the light. The obvious way to get the second shade is
 * `shade(colour, -x)`, and it was what three of these used, and it is wrong in a
 * way that only shows on half the catalogue. `shade` moves HSL lightness by an
 * absolute amount and clamps at zero, so on `classical:romantic`'s `#141418` —
 * lightness 0.07 — every negative shift lands on black, and the notch a lapel is
 * supposed to cut out of a neckline is black cloth in front of black cloth under
 * a follow spot. Forty players in evening dress had no lapels at all, and the
 * bench had been showing that for as long as there had been a bench.
 *
 * So the direction is decided by the colour rather than by the caller: down off
 * anything pale, up off anything dark. It costs a `Color` construction on a path
 * that already constructs several, and it means a lapel is visible on all
 * **fourteen** genres rather than on the four with cream jackets — nineteen, as
 * of the two that arrived after this was written.
 *
 * `by` is deliberately much larger than the 0.07 this replaced. That number was
 * chosen against a near-white tanssilava jacket, where seven points of lightness
 * is a legible edge; everywhere else it was a rounding error. A seventh of the
 * range is what it takes for a rim light to find an edge on a mid-tone at ten
 * metres, which is the distance every silhouette in `Garment` is judged from.
 */
export function relief(colour: string, by: number): string {
  return shade(colour, lightness(colour) > 0.5 ? -by : by);
}

/**
 * How pale a colour is, on the same 0–1 scale `shade` moves things along.
 *
 * Three lines, factored out of `relief` rather than copied into the braces,
 * because that scale is the one thing every contrast decision in this file is
 * arguing about and there should be a single place that reads it.
 *
 * **It is not the number a colour picker shows.** `getHSL` with no colour space
 * asked for reports lightness in the renderer's linear working space, so mid
 * grey `#808080` is 0.216 here and the whole bottom half of the sRGB range is
 * squeezed into the first fifth. Every caller has to know that. `relief`'s 0.5
 * is not a midpoint in this space but a mark well up in the pale end, which is
 * why it lifts most mid-tone jackets rather than darkening them — no bad thing
 * for a lapel, and the reason it works — and it is why the braces below measure
 * their separation from the shirt as a ratio rather than as a subtraction.
 */
function lightness(colour: string): number {
  const hsl = { h: 0, s: 0, l: 0 };
  new Color(colour).getHSL(hsl);
  return hsl.l;
}

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
  /**
   * How far down the garment's own cloth reaches, and therefore whether there
   * is a skirt at all.
   *
   * A field rather than a literal in `dressGarment`'s switch, which is the line
   * this interface's own note draws, and it earns the crossing twice over: four
   * of the eight disagree about it, and the answer is read from *two* files.
   * `dressGarment` turns it into a hem height for a standing player and
   * `performer-legs.ts` turns it into a lap for a seated one, and those two have
   * to be the same decision — a robe that grows a knee-length skirt standing up
   * and a floor-length lap sitting down is a wardrobe change, not a posture.
   */
  hem: 'none' | 'knee' | 'floor';
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
    hem: 'none',
  },
  /** Identical to a suit from the front. The two panels are the difference. */
  tails: {
    shell: 'jacket', girth: 1.00, chest: 'front', lapels: true,
    under: 'trousers', sleeve: 'jacket',
    hem: 'none',
  },
  /**
   * The skirted coat: sherwani, achkan, court coat, kurtā. No lapels, because
   * the collar stands instead — and a shirt front still shows below it, which is
   * the cravat in 1720 and the kurtā under a sherwani in every other era.
   */
  coat: {
    shell: 'jacket', girth: 1.03, chest: 'front', lapels: false,
    under: 'trousers', sleeve: 'jacket',
    hem: 'knee',
  },
  /** Thobe, kaftan, galabeya, cassock, choir robe. One column, wide sleeves. */
  robe: {
    shell: 'jacket', girth: 1.06, chest: 'none', lapels: false,
    under: 'garment', sleeve: 'wide',
    hem: 'floor',
  },
  /** Fitted above and flared below — the only garment that changes width. */
  gown: {
    shell: 'jacket', girth: 0.95, chest: 'none', lapels: false,
    under: 'garment', sleeve: 'bare',
    hem: 'floor',
  },
  /** Wrapped to the ankle with one band over the shoulder, over a blouse. */
  drape: {
    shell: 'jacket', girth: 0.98, chest: 'collar', lapels: false,
    under: 'garment', sleeve: 'shirt',
    hem: 'floor',
  },
  /**
   * A shirt with a sleeveless body over it. `chest: 'none'` because the shell
   * *is* the shirt here — a shirt front in the shirt colour on a shirt-coloured
   * torso is a mesh nobody can see.
   */
  waistcoat: {
    shell: 'shirt', girth: 0.98, chest: 'none', lapels: false,
    under: 'trousers', sleeve: 'shirt',
    hem: 'none',
  },
  /** No jacket at all. The braces are the entire silhouette; see the switch. */
  shirtsleeves: {
    shell: 'shirt', girth: 0.96, chest: 'none', lapels: false,
    under: 'trousers', sleeve: 'shirt',
    hem: 'none',
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
  /**
   * The garment gathered over a seated player's legs, or `null` for a garment
   * that has nothing to gather. See `LapCloth` and `buildLap`.
   */
  lap: LapCloth | null;
}

/**
 * A skirt, for a player who cannot wear one.
 *
 * `dressGarment` builds no skirt for anybody off their feet, and the reason is
 * argued there: it is one rigid mesh, there is no skin and no bones, and on a
 * bench it hangs from the hips straight down through the boards while the
 * thighs go forward out the front of it. What that left was correct and bare —
 * a seated robe was a torso and two legs in the same cloth, which reads as a
 * jumpsuit rather than as somebody sitting down in a thobe.
 *
 * The cloth *is* still there on a real body; it is just somewhere else. It
 * gathers over the thighs, sags in the gap between them, and falls from the
 * knees to the boards. All three of those follow the legs, so they are built
 * and fitted where the legs are — `performer-legs.ts` already has the hip, the
 * knee and the ankle every frame, and a lap solved anywhere else would be a
 * second solver arguing with that one.
 *
 * This is the wardrobe half of the answer, and it is here for the reason
 * everything else in this file is: what a garment is may not be decided in the
 * file that draws it.
 */
export interface LapCloth {
  /** The skirt's own cloth, which is not always the leg's. See `legsOf`. */
  material: MeshStandardMaterial;
  /** Whether the cloth stops at the knee or carries on to the boards. */
  hem: 'knee' | 'floor';
}

/**
 * What to build a leg out of, and what the garment does over it when sitting.
 *
 * Two answers, and the second one is the one that matters. Under trousers this
 * is exactly what `performer-legs.ts` did on its own — the trouser colour, the
 * outfit's fabric, no change of thickness — and under a garment the leg *is* the
 * garment: the jacket colour, a tenth thicker, so that where a robe's skirt ends
 * and the leg begins there is no seam of a different colour and no step in the
 * width. Get this one wrong and the failure is the exact one in the header:
 * a floor-length column of cream linen standing on two charcoal shins.
 *
 * The lap is a third answer and it is deliberately not folded into the first
 * two. A sherwani's legs are trousers and its lap is the coat — two colours,
 * and the one time this file hands out cloth the legs are *not* made of. Fold
 * them together and a seated sherwani is either a coat with coat-coloured shins
 * or a pair of trousers with nothing over them, which are the two failures the
 * separation exists to make unspellable.
 */
export function legsOf(look: Look, l: Leases): LegCloth {
  const { jacket, trousers, fabric } = look.outfit;
  const cut = cutOf(look.outfit.garment);
  return {
    material: clothSurface(l, cut.under === 'garment' ? jacket : trousers, fabric),
    girth: legGirth(look.outfit.garment),
    lap: cut.hem === 'none'
      ? null
      : { material: clothSurface(l, jacket, fabric), hem: cut.hem },
  };
}

/**
 * The girth half of `legsOf`, on its own, for a caller with no `Leases`.
 *
 * `dressGarment` is that caller and it wants the number for the opposite
 * reason `performer-legs.ts` does: it is drawing the cloth that has to be
 * *wider* than the leg, so it needs the same answer or the skirt clears a leg
 * nobody is building. Split out rather than duplicated, which is the whole
 * argument of this file applied to one multiplier.
 */
export function legGirth(garment: Garment): number {
  return cutOf(garment).under === 'garment' ? 1.10 : 1;
}

// ---------------------------------------------------------------------------
// The geometry only one garment has
// ---------------------------------------------------------------------------

/**
 * Everything a garment adds that the shared torso does not already build.
 *
 * Called by `dressTorso` after the shell, the chest, the lapels and the hips,
 * and parented to the same `torso` group as all of them — so a garment rides a
 * lean and a fold exactly as the body it hangs from does. A skirt is the one
 * exception and it is argued where it is built: cloth follows a body everywhere
 * except at the hem, which follows gravity.
 *
 * The hem is measured **from the boards up**, not from the torso down, and that
 * is the one piece of arithmetic in this file worth reading twice. `torsoH` is
 * the same length for a standing player and a seated one — see `proportions()`
 * — and only `hipY` moves, so a skirt sized as a multiple of the torso would
 * pool half a metre deep on the floor under anybody on a stool and end at the
 * knee on anybody standing. Sized against `hipY` it stops just above the shoe,
 * which is what a hem is.
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
   * The narrowest a skirt may be cut and still have the legs inside it, as a
   * fraction of the shoulder width.
   *
   * **This is the number the whole garment set was wrong by.** The widths below
   * were written against the hips — 0.88 is what `dressTorso` scales them to,
   * and a column wider than that was said to step out past them and read as a
   * barrel bolted to a person. The objection is real and the premise was not:
   * what a skirt has to contain is not the hips, it is the *legs*, and this
   * rig's legs used to be nearly as wide as its shoulders. Two thighs came out
   * of the sides of every floor-length garment in the catalogue, from the
   * front, on every player wearing one.
   *
   * Derived rather than typed, from the three facts `performer-legs.ts` and
   * `restLocals` build against — see `LEG_SOCKET_X`, `STANCE_X` and `legRadii`,
   * which is why all three live in `performer-look.ts` now and not in the files
   * that draw a leg and place a foot.
   *
   * **The `max` is not belt and braces.** A leg's widest point is its hip on
   * some bodies and its *foot* on others, because a socket is a fraction of the
   * shoulders and a stance is a fraction of the height: a broad player's hips
   * are wider than their stance and a slight player's stance is wider than
   * their hips, by three centimetres. Sized off the socket alone, this cut
   * every slight player's hem inside their own knees while every broad one
   * looked right — which is the shape of bug that survives a bench, because the
   * bench's example body is average.
   *
   * `0.13` is air, and it is a per-frame requirement rather than a taste. A hem
   * cut exactly to the standing silhouette is inside the legs as soon as
   * anybody moves: the groove sways the hips up to 2.6 % of the body's height
   * sideways (`performer.ts`) and the feet stay planted, so the skirt travels
   * and the shins do not.
   *
   * ## What stopped this growing
   *
   * The first version of this arithmetic was right and produced a robe 58 cm
   * across, which went straight through the body of an electric bass. That is
   * the constraint nobody had written down: a strap-hung instrument sits about
   * 10 cm off the front of the thigh, so **cloth on this rig is squeezed between
   * the legs it must cover and the instrument it must not touch**, and the way
   * out is not to pick a number between them — it is to make the legs smaller.
   * They are: the thigh went from 19 cm to 15, the sockets from 0.30 of the
   * shoulders to 0.23 and the stance from 0.072 of the height to 0.060, which
   * bought back 12 cm of hem and cost nothing that reads at ten metres.
   *
   * One object is still un-dodgeable and it is not this file's to dodge. An
   * upright bass is placed **17 cm inside its player's own torso**, garment or
   * no garment, so a hem that clears it does not exist at any width.
   */
  const clear = 2 * (
    Math.max(LEG_SOCKET_X, STANCE_X * p.height / p.torsoW)
    + legRadii(p, legGirth(garment)).thigh / p.torsoW
  ) + 0.13;

  /**
   * A skirt: a column or an A-line, hung plumb from inside the hip mass.
   *
   * `ease` is how loose the cloth is *where it passes the legs*, as a multiple
   * of `clear` — 1 is a skirt cut to the body, 1.05 is one that hangs. It
   * replaced a fraction of the shoulder width, and the change is the difference
   * between a garment set that varies and one that does not: `clear` lands near
   * 0.88 of the shoulders, and a floor applied to four typed fractions would
   * have flattened every one of them below it to the same width and cut a sari
   * like a kaftan. An ease keeps a drape tighter than a robe *and* keeps both
   * off the legs.
   *
   * For a `flared` skirt the ease is still the waist, which is the narrow end
   * and the only end a leg can get out of; the hem follows from `FLARE_WAIST`.
   *
   * Nothing is built for a seated player, and that is the second half of the
   * same fault. A skirt here is one rigid mesh — there is no skin, no bones and
   * nothing to bend at the hip — so on a bench it hangs from the hips straight
   * down through the boards while the thighs it is meant to be covering go
   * *forward*, out through the front of it, and the shins come back down outside
   * it. Cross-legged is worse than wrong: `floorY` sits above the hip for a
   * player whose hip is 10 cm off the ground, so the mesh inverts and a sitarist
   * in a kurtā wore a saucer. The legs are already the garment's own cloth under
   * `under: 'garment'` — see `legsOf` — so what a seated player loses is the
   * column and not the costume: the colour, the collar and the sleeves are all
   * still there, and what is left reads as the same cloth over a lap. Giving
   * them back a hem means cloth that drapes over a thigh, and that is a skinned
   * garment rather than a wider cylinder.
   */
  const skirt = (kind: 'column' | 'flared', ease: number): void => {
    if (p.seated) return;
    const hemY = cutOf(garment).hem === 'knee' ? kneeY : floorY;

    // The top sits *above* the hip line so the join is buried inside the hips
    // ellipsoid rather than showing as a rim of a slightly different shade
    // where two ellipsoids meet.
    const topY = p.torsoH * 0.10;
    const len = topY - hemY;
    // `flare` is scaled by its hem and is `FLARE_WAIST` of that at the top, so
    // a skirt whose *waist* has to clear the legs is sized from the waist out.
    const w = clear * ease / (kind === 'flared' ? FLARE_WAIST : 1);
    const m = new Mesh(kind === 'flared' ? flare(l) : tube(l), cloth(jacket));
    /**
     * Flatter than the body it hangs off, and measured off the *width* rather
     * than off `torsoD` to say so.
     *
     * This is the axis every carried instrument is on. A torso is 0.70 as deep
     * as it is wide, and a skirt cut to that ratio reaches 16 cm in front of
     * the hip — where the body of a bass, a guitar or an accordion is. 0.58
     * brings the hem in to 14, which is the whole of the difference between a
     * robe with a bass through it and one without, and it is bought at no cost
     * to the legs: they are 8 cm deep and the shoes barely more, so a skirt has
     * far more depth than it needs and far less width.
     *
     * What it costs is the *lower* leg of a player standing fore-and-aft rather
     * than square — a perch splits the feet 19 cm front to back — whose shins
     * come out below the hem. Which is what a hem and a spread stance do to
     * each other, and is the reason the guarantee above is about the thigh and
     * the knee rather than about the whole leg.
     */
    m.scale.set(p.torsoW * w, len, p.torsoW * w * 0.58);

    /**
     * Plumb, against the lean the rest of the garment takes.
     *
     * The one place in the rig where a part is deliberately taken back out of
     * its parent's attitude, and gravity is the reason. Everything else on a
     * torso is attached to it: a lapel pitches with the chest because it is
     * sewn to the chest. A hem is not attached to anything — it hangs — and
     * these are by a distance the longest objects on a performer, so the error
     * is not subtle. A keyboard player perches at 15°, and a skirt square to
     * that torso swings its hem 23 cm downstage while the legs stay where the
     * boards are: both shins, from the knee down, out in the open behind the
     * robe. That was read as a costume fault for as long as it was looked at
     * from the front.
     *
     * Only the *resting* lean is cancelled, not the breath and the fold the
     * animator adds on top. Those are centimetres and a hem may have them —
     * cloth does move when a body does. It is the permanent 15° that cannot
     * stand.
     */
    const half = len * 0.5;
    m.rotation.x = -p.lean;
    m.position.set(0, topY - half * Math.cos(p.lean), half * Math.sin(p.lean));
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
       *
       * `relief` rather than `shade` because the first attempt at that fix only
       * worked on pale cloth, and the one era in the project where every player
       * on the platform is in tails is `classical:romantic`, whose entire jacket
       * list is three near-blacks. A tailcoat is the one garment here that has
       * to read on black, so it is the one that could least afford a shade that
       * clamps to it.
       */
      for (const s of [SIDE.left, SIDE.right]) {
        const tail = new Mesh(slab(l), cloth(relief(jacket, 0.13)));
        tail.scale.set(p.torsoW * 0.28, -kneeY * 1.22, p.torsoD * 0.11);
        tail.position.set(s * p.torsoW * 0.18, kneeY * 0.61, -p.torsoD * 0.38);
        tail.castShadow = true;
        torso.add(tail);
      }
      break;
    }

    case 'coat':
      // Knee-length and cut to the body, so it hangs rather than flares — a
      // sherwani and a 1720 court coat are both a straight skirt with a vent in
      // it, and the flare belongs to the gown. Its legs are trousers, so `clear`
      // is already the narrowest of the four: no ease on top of it.
      skirt('column', 1);
      standCollar();
      break;

    case 'robe':
      // To the boards, and the loosest thing here. A thobe and a kaftan are cut
      // to hang off the shoulders rather than off the body, and the eye has to
      // read one column from the shoulder down rather than a jacket standing on
      // a tube.
      skirt('column', 1.05);
      standCollar();
      break;

    case 'gown':
      // The A-line, and the only one. Close at the waist and out to a hem a
      // quarter as wide again, which is the shape and is also the only way a
      // flare can be drawn on a body: see `flare`, and the cone that was here.
      skirt('flared', 1.01);
      break;

    case 'drape': {
      // A sari is wrapped rather than hung: the tightest of the four, which is
      // `clear` and nothing over it.
      skirt('column', 1);
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
       * Two front panels over the shirt, and the shirt is the shell under them.
       *
       * **Not a second body, and the reason is arithmetic rather than taste.**
       * Two versions of this were built as one solid scaled down over the torso
       * and the bench threw out both, for opposite reasons that turn out to be
       * the same reason.
       *
       * The first was an ellipsoid: a torso is *narrowest* at the waist and an
       * ellipsoid is *widest* in the middle, so the two profiles disagree
       * exactly where a waistcoat is supposed to be tightest, and every
       * string-band player came out with a paunch. The obvious repair was to
       * reuse `torsoShell`, which cannot disagree with the body's waist because
       * it *is* the body's waist — and that is true, and it was still wrong.
       * A lathe compressed in `y` brings its shoulder flare, the widest part of
       * the profile by a fifth, down to the wearer's chest, where the body it is
       * meant to be hugging has narrowed to 86 % of it. The screenshot was worse
       * than the paunch: a flat-topped box, a centimetre wider at the chest than
       * the shoulders above it, cut off dead level at the armpit. No scale
       * repairs it either — hug the chest and the garment sinks inside the body
       * all the way from the waist down, clear the waist and it is a barrel.
       *
       * So it is drawn the way the tails and the braces are, as flat panels on a
       * body that is already the right shape. Two of them, leaning out at the
       * top by the same trick and the same sign the lapels use, which makes the
       * gap between them a V that narrows to a closed front at the waist and
       * crosses over below it. That V of shirt between two dark panels, under
       * shirt shoulders and shirt sleeves, *is* the garment.
       *
       * They stay inside 0.34 of the shoulder width at their widest, which is
       * the same constraint the skirt's own note argues at length from the other
       * end: a flat panel on a round torso whose outer edge passes the body's
       * silhouette is a plank bolted to a person, and from three-quarters on it
       * is a plank seen edge-on. The braces get away with 0.21 because they are
       * straps; this is as wide as the trick goes.
       *
       * The back is left as shirt on purpose, and that is a judgement rather
       * than an omission. Half the waistcoats ever made have a plain back in a
       * cheaper cloth because nobody was ever going to see it, and a player read
       * from behind as a shirt is not this garment's failure — a player read
       * from the front as a barrel was.
       */
      const panel = cloth(jacket);
      for (const s of [SIDE.left, SIDE.right]) {
        const front = new Mesh(slab(l), panel);
        front.scale.set(p.torsoW * 0.30, p.torsoH * 0.68, p.torsoD * 0.05);
        front.position.set(s * p.torsoW * 0.20, p.torsoH * 0.42, p.torsoD * 0.35);
        // All three angles, and none of them is decoration. `z` is the V. `x`
        // leans the top forward because a chest is 3 cm deeper than a waist and
        // a panel that ignores that is a board propped against a person — which
        // is exactly what the side view showed the first time this was two
        // upright slabs. `y` swings each outer edge back around the ribs for the
        // same reason, in the other axis: a flat panel a third of the shoulders
        // wide, left square to the front, ends in a hard vertical edge standing
        // off the flank, and the three-quarter view is where the whole rig is
        // least forgiving of one.
        front.rotation.set(0.10, s * 0.28, -s * 0.18);
        front.castShadow = true;
        torso.add(front);
      }
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
       *
       * ## But they are worn on the shirt
       *
       * The colour is owed to the trousers and the *contrast* is owed to the
       * shirt, and for a long time this line only did the first half. Braces
       * cross the chest: whatever the cloth they buckle to is doing down at the
       * waist, the field they are seen against is the shirt. So a fixed drop of
       * 0.26 off the trousers answers a question nobody asked, and it answers it
       * wrongly on exactly one shape of wardrobe — the pale one. `latin:conjunto`
       * is that wardrobe, and it is not an oversight: cream drill trousers under
       * a white shirt is what the 1938 photograph shows. The strap came out one
       * step off the trousers and landed a factor of 1.7 from the shirt, which
       * at row scale on the bench is not a strap, it is a smudge. A shirtsleeved
       * player whose braces have gone is a torso in a paler colour — the failure
       * this case exists to prevent, arrived at from the other side.
       *
       * The trousers still choose the hue and the saturation, which is the whole
       * of the argument above and is untouched: `shade` only ever moves
       * lightness, so a strap off cream drill is still warm and a strap off navy
       * is still blue. Only the *lightness* is taken off the trousers and handed
       * to the shirt.
       *
       * `relief(trousers, …)` is the tool that looks right here and is not, for
       * a reason worth naming so it does not get "fixed" back. `relief` asks the
       * *garment's own* colour which way to go, which is exactly right for a
       * lapel cut from the jacket it notches — and here it would ask the
       * trousers, so `country:stringband`'s near-black `#3a3630` would send the
       * braces *up* and every wardrobe that reads correctly today would go pale
       * on a pale shirt to rescue the one that does not. The question a brace has
       * to answer is not what the trousers are, it is what the shirt is.
       *
       * ## A ratio, because this scale is linear light
       *
       * The distance is a *factor* rather than a number of points, and that is
       * forced by the scale `shade` and `lightness` work on. With colour
       * management on, `getHSL` reports lightness in the renderer's linear
       * working space, where mid grey is 0.216 and not 0.5: subtracting a fixed
       * amount there is a cosmetic nudge at the top of the range and a cliff into
       * black at the bottom. Contrast in linear light is a ratio, so this asks
       * for one — the same shape a display standard uses, flare term and all,
       * with `lightness` standing in for luminance because that is the measure
       * this file already has and the difference between them is smaller than
       * the difference a stage lamp makes.
       *
       * 3 is the floor a graphical object is held to rather than a number tuned
       * against one wardrobe, and the wardrobes that were already right clear it
       * by a mile: a black strap on a white shirt is 21, and every dark-trouser
       * genre — `country:stringband`, `arabic:shaabi`, `finnfolk:pelimanni` —
       * comes out of this arithmetic as the same black it has always been,
       * because `Math.min` never fires on a strap that is already far away. What
       * moves is only what was failing: conjunto's cream drill, `funk:pfunk`'s
       * pale trousers against a yellow shirt at 1.1, `iskelma:eighties`.
       *
       * Down wherever the shirt has room under it, because dark straps on a
       * light field *is* the garment, and up only where it does not — which is
       * what `under >= 0` tests, and it tests it honestly rather than against a
       * threshold somebody picked. `country:outlaw` wears a `#2b2b2b` shirt that
       * no strap can be three times darker than, and black braces on it were as
       * invisible as cream on cream. That shirt and `indian:fusion`'s dark teal
       * are the only two cloths in the catalogue this hands a pale strap to, and
       * both of them were below the floor with a black one.
       */
      const RATIO = 3;
      const shirtL = lightness(shirt);
      const trouserL = lightness(trousers);
      // What the strap is before the shirt has a say: the trousers, one step
      // darker, which is what a leather brace against its own cloth is. It
      // stands wherever it is already clear of the shirt, and that is most of
      // the catalogue.
      const worn = trouserL - 0.26;
      // The palest a dark strap may be, and the darkest a pale one. 0.05 is the
      // flare the ratio is measured through, and it is not decoration: without
      // it a ratio off a black shirt is satisfied by black, so `under` could
      // never go negative and the second branch could never happen.
      const under = (shirtL + 0.05) / RATIO - 0.05;
      const over = (shirtL + 0.05) * RATIO - 0.05;
      const strapL = under >= 0 ? Math.min(worn, under) : Math.max(worn, over);
      const strap = cloth(shade(trousers, strapL - trouserL));
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
