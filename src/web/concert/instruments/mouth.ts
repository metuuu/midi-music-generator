/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Where this particular player's mouth is.
 *
 * A blown instrument is held *to a face*, so every model in the family needs
 * the same one number and needs it to agree with the rig to the centimetre. If
 * the horn's answer and the body's answer differ by 4 cm, the mouthpiece is at
 * the chin and no amount of good geometry rescues it.
 *
 * ## Why this is not seven copies of `0.886`
 *
 * It is one derivation, written as the arithmetic rather than as a decimal, so
 * that it can be checked against `performer-look.ts` by reading rather than by
 * measuring. That file builds a standing player like this:
 *
 * ```
 *   headR    = 0.078 · h
 *   shoulder = h − 2·headR − 0.026·h
 *   head.y   = shoulder + 0.026·h + 0.96·headR
 *   mouth    = head − (0.42·headR) in y, + (0.92·headR) in z
 * ```
 *
 * — and the constants below are those lines with `h` factored out. When the rig
 * changes its proportions this file is the one place that has to follow, and
 * the probe's lip-to-mouth measurement is what catches it if nobody does.
 *
 * Only for `posture: 'stand'`, which is every blown archetype in the frozen
 * table. A seated player's torso leans and the derivation would need the lean;
 * nothing in this family sits, so nothing here pretends to know.
 *
 * ## Purity
 *
 * `height` is fixed for the life of a model, so a model resolves this **once,
 * at build time**, and lays its geometry out around the answer. Reading it per
 * `resolve` call would be the same value and still wrong: the contract is that
 * two calls agree, and the cheapest way to keep a promise like that is to have
 * nothing to break it with.
 */

import type { InstrumentBuildOptions } from './types.js';

/** `performer-look.ts`: head radius and the gap where a neck would be. */
const HEAD_R = 0.078;
const NECK = 0.026;
/** Shoulder height, as a fraction of standing height, with no lean. */
const SHOULDER = 1 - 2 * HEAD_R - NECK;
/** Head centre. */
const HEAD_Y = SHOULDER + NECK + HEAD_R * 0.96;
/** The mouth is a little below the head's centre and out at its front. */
export const MOUTH_PER_HEIGHT_Y = HEAD_Y - HEAD_R * 0.42;
export const MOUTH_PER_HEIGHT_Z = HEAD_R * 0.92;

/**
 * The same clamp `proportions()` applies.
 *
 * It has to be the same one: the rig will build a 2.10 m body for a 3 m
 * `Look`, and a model that took the 3 m at face value would hang its horn a
 * metre above the head it was clamped to.
 */
const MIN_HEIGHT = 1.35;
const MAX_HEIGHT = 2.10;
/** Casting's mean draw, `1.58 + 0.34/2`. Only used when nobody says. */
const NOMINAL_HEIGHT = 1.75;

/**
 * The fallback mouth height for an archetype whose `workHeight` is not one.
 *
 * The trumpet, trombone, flute and harmonica all declare `workHeight: 1.5`
 * because you play them *at your face*, so their own number is the right
 * fallback. A saxophone's 1.2 and a clarinet's 1.3 measure their **keywork**,
 * which is most of a body-tube below the lips — passing those to `mouthFor`
 * hangs the whole horn 30 cm low and stands a baritone's bell on the boards.
 * Those two pass this instead.
 */
export const BLOWN_MOUTH_Y = 1.50;

export interface Mouth {
  /** Height above the boards, metres. */
  y: number;
  /** How far in front of the player's own axis, metres. */
  z: number;
}

/**
 * Where to put the mouthpiece, given whatever the caller knows.
 *
 * With a height, this is that player's actual mouth. Without one — the model
 * bench, a test, any caller that has no performer — it is the archetype's
 * `workHeight`, which is what `InstrumentBuildOptions.height` documents as the
 * fallback, at the mean player's reach in front. The two agree at 1.69 m and
 * diverge by 0.13 m at the ends of casting's range, which is the entire reason
 * the parameter exists.
 */
export function mouthFor(opts: InstrumentBuildOptions, workHeight: number): Mouth {
  const h = opts.height === undefined
    ? undefined
    : Math.min(Math.max(opts.height, MIN_HEIGHT), MAX_HEIGHT);
  return {
    y: h === undefined ? workHeight : MOUTH_PER_HEIGHT_Y * h,
    z: MOUTH_PER_HEIGHT_Z * (h ?? NOMINAL_HEIGHT),
  };
}
