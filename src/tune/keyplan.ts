/**
 * The key route — where the song changes key, and how it gets there.
 *
 * What this replaces was one line and one field: a single roll against
 * `era.keyChangeChance`, and if it came up, every section from the last chorus
 * onward transposed by one or two semitones. That is a truck-driver's gear change,
 * hard-coded as the only modulation the project could express — and it arrived
 * without preparation, because nothing told the harmony a key change was coming.
 *
 * Two things here that the field could not say.
 *
 * **More than one relation.** A tone up for the last chorus is the pop signature and
 * stays the most likely, but a bridge in the subdominant or the dominant is at least
 * as common in this repertoire and was unreachable.
 *
 * **A pivot.** A modulation announced by the dominant of the key it is going to is
 * the difference between a key change and a splice. The bar before the new key gets
 * that chord, expressed as an applied dominant — `V7/II` for a tone up — so it is a
 * real roman numeral that everything downstream can read back rather than a
 * transposition smuggled past the label.
 *
 * Only four relations are offered, and the reason is worth recording: those are the
 * ones whose applied-dominant numeral resolves to the same root in both modes.
 * `V7/bIII` does not — in minor it parses to a different target — and a route whose
 * pivot lands somewhere else in half the songs is worse than no route.
 */

import type { Rng } from '../core/rng.js';
import type { SectionKind } from '../core/types.js';

/** Semitones up, relative to the key being left. */
export type Relation = 1 | 2 | 5 | 7;

/** The applied dominant that announces each relation, as a roman numeral. */
const PIVOTS: Record<Relation, string> = {
  1: 'V7/bII',
  2: 'V7/II',
  5: 'V7/IV',
  7: 'V7/V',
};

export interface KeyPlan {
  /** Semitone transposition of each section, relative to the song's own key. */
  transpose: number[];
  /**
   * For each section index, the pivot chord that belongs in its **last bar** because
   * the section after it is in a new key. Absent everywhere else.
   */
  pivots: Map<number, string>;
}

export interface KeyPlanOptions {
  kinds: readonly SectionKind[];
  /** The era's appetite for the final lift. */
  chance: number;
  /**
   * The era's appetite for a bridge that goes somewhere, separately.
   *
   * This was `chance * 0.5` and the multiplier was the whole problem: one field
   * fired two gestures, so a genre that wanted the gear change got a bridge
   * modulation at half the rate as a side effect, and a genre that wanted the
   * bridge could only ask for it by also asking for the lift. They are not
   * related events — the bridge leaves and comes back, the last chorus leaves
   * and stays — and nothing but the shape of the old code tied them.
   *
   * Absent keeps the 0.5, which is the current behaviour rather than a chosen
   * default, and the substitution is exact rather than approximate: `rng.chance`
   * costs one `next()` whatever it returns and both draws below are
   * unconditional, so an era that declines this field draws the same numbers in
   * the same order and produces the same bytes. Measured over 570 songs in all
   * nineteen genres before this landed, and no era declares it yet — the field
   * is here so that a table *can* say it, which is the gap `docs/engine-gaps.md`
   * §4 recorded.
   */
  bridgeChance?: number;
  /**
   * May a change be announced by the dominant of the key it is going to?
   *
   * False for the genres whose identity is the absence of a leading tone in minor —
   * see `Genre.preparedModulation`. They modulate directly, which is also a real
   * gesture and the one those records actually make.
   */
  prepared?: boolean;
  rng: Rng;
}

export function planKeys(opts: KeyPlanOptions): KeyPlan {
  const { kinds, rng } = opts;
  const transpose = kinds.map(() => 0);

  /**
   * The final lift.
   *
   * Weighted toward the semitone and the tone, which is what the records do: the
   * gear change exists to deliver a chorus everybody already knows one notch
   * brighter, and a fourth would be a different song rather than a lift.
   */
  if (rng.chance(opts.chance)) {
    const at = lastIndexOf(kinds, 'chorus');
    if (at > 0) {
      const by = rng.weighted([[1, 4], [2, 3]] as const) as Relation;
      for (let i = at; i < transpose.length; i++) transpose[i] = by;
    }
  }

  /**
   * The bridge that goes somewhere.
   *
   * A separate, rarer draw rather than an alternative to the lift, because they are
   * different gestures and a song may have both: the bridge leaves and comes back,
   * the last chorus leaves and stays. Skipped where the bridge is the final section,
   * since a bridge that never returns is an outro.
   *
   * *Rarer* is now the default rather than the rule — see `bridgeChance`, which a
   * table may set to say how often this happens without also saying how often the
   * final chorus lifts.
   */
  if (rng.chance(opts.bridgeChance ?? opts.chance * 0.5)) {
    const at = kinds.indexOf('bridge');
    if (at > 0 && at < transpose.length - 1) {
      const by = rng.weighted([[5, 3], [7, 2]] as const) as Relation;
      transpose[at] = (transpose[at]! + by) % 12;
    }
  }

  /**
   * The pivot goes in the bar before the change, and only where the step between the
   * two keys is one this can announce. A modulation with no dominant in front of it
   * still happens — that is a direct modulation, which is also a real gesture — it
   * simply does not get prepared.
   */
  const pivots = new Map<number, string>();
  if (opts.prepared === false) return { transpose, pivots };
  for (let i = 0; i + 1 < transpose.length; i++) {
    const step = (((transpose[i + 1]! - transpose[i]!) % 12) + 12) % 12;
    const pivot = PIVOTS[step as Relation];
    if (pivot) pivots.set(i, pivot);
  }

  return { transpose, pivots };
}

function lastIndexOf(kinds: readonly SectionKind[], kind: SectionKind): number {
  for (let i = kinds.length - 1; i >= 0; i--) {
    if (kinds[i] === kind) return i;
  }
  return -1;
}

/** One line per key change, for a printed plan or a report. */
export function describeKeys(plan: KeyPlan): string {
  const changes: string[] = [];
  for (let i = 1; i < plan.transpose.length; i++) {
    if (plan.transpose[i] === plan.transpose[i - 1]) continue;
    const pivot = plan.pivots.get(i - 1);
    const by = plan.transpose[i]! - plan.transpose[i - 1]!;
    changes.push(`§${i} ${by > 0 ? '+' : ''}${by}${pivot ? ` via ${pivot}` : ' direct'}`);
  }
  return changes.length ? changes.join('  ') : 'one key throughout';
}
