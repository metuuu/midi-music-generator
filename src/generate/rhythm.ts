/**
 * Metric utilities, and the cell helpers the rhythm section still uses.
 *
 * This file used to plan a melodic phrase's rhythm — the pickup, the tie across a
 * barline, the anticipated downbeat — and it argued, correctly, that rhythm has to
 * be composed per phrase rather than sampled per bar, because a tune hummed at the
 * wrong pitches is still the tune. What it could not do was carry that argument up a
 * level: pitch was still chosen a note at a time, so melodies came out rhythmically
 * shapely and melodically characterless.
 *
 * The planner therefore moved to `src/tune/`, where the figure, the phrase and the
 * form are all one model and a `Gesture` is not required to fill a bar. What is left
 * here is what the *accompaniment* needs and always needed: how much the ear expects
 * something at a given sixteenth, how to normalise a bar-length cell, and how to
 * stop a monophonic line sounding two notes at once.
 *
 * ## The operators, and why they are operators
 *
 * `BassPattern.hits`, `CompPattern.hits`, `DrumPattern.voices` and `Style.shots`
 * are four authoring surfaces answering one question — *what onsets does this
 * style hit?* — and until now nothing in the project said so. Each carries its
 * own payload on top, a tone or a voicing or a drum voice, but the onsets are
 * the same object in all four.
 *
 * What is added below is a vocabulary over those onsets: move one, drop some,
 * split one, rotate the lot. Deliberately **not** a library of figures.
 * `style/feel.ts` wrote the rule and the reason —
 *
 * > A proposal that needs its own bass figure is a style, and that line is the
 * > only thing keeping the feel library from growing into a second copy of the
 * > style table.
 *
 * A shared bank of named patterns fails that immediately: it is the style table
 * again under a better name, and its end state is every genre reaching for the
 * same twelve figures, which is the sameness this was written to fix arriving
 * from the other direction. An operator cannot fail it, because it has no
 * figures in it. It composes with whatever the style already authored, so a
 * tango's push is the tango's own pattern pushed, and no number of styles opting
 * in makes two of them converge.
 *
 * Every operator here is **total and payload-preserving**: it takes a figure and
 * returns a figure, it returns the input unchanged when what was asked for will
 * not fit, and it never invents an onset carrying something the caller did not
 * already have. A caller therefore never has to check first, and a chain of them
 * degrades to identity rather than to nonsense. See `docs/rhythm-plan.md` §4.
 */

import type { Rng } from '../core/rng.js';
import type { RhythmCell, WeightedCell } from '../style/types.js';

export const SLOTS_PER_BEAT = 4;

/**
 * 0 = offbeat sixteenth, 1 = eighth, 2 = beat, 3 = half-bar, 4 = downbeat.
 *
 * Almost every consumer of this treats the number as "how much does the ear
 * expect something here", so being wrong about it is not a rounding error: it
 * decides where a melody puts its long notes, where a cadence is allowed to
 * land, and which notes the constraint engine will defend.
 *
 * `groups` is what makes it right in a metre that does not divide evenly. The
 * arithmetic below — halve the bar, then count in fours — describes 4/4 and 3/4
 * exactly and describes 7/8 confidently and wrongly: it finds a half-bar at slot
 * 7, which in a 2+2+3 is the middle of the third group and the last place
 * anyone accents. Handed the grouping, the group heads become the beats and the
 * arithmetic is not consulted at all.
 *
 * Inside a group the subdivision depends on what the groups are made of. A 5/4
 * grouped 3+2 is still counted in quarters, so a slot on a quarter is a beat; a
 * 7/8 grouped 2+2+3 is counted in eighths, and a "quarter" in it is an accident
 * of arithmetic rather than a pulse anyone feels. Whether every group is a whole
 * number of quarters is exactly that question, and it answers itself.
 */
export function metricStrength(
  slot: number, slotsPerBar: number, groups?: readonly number[],
): number {
  const s = ((slot % slotsPerBar) + slotsPerBar) % slotsPerBar;
  if (s === 0) return 4;

  if (groups?.length) {
    let at = 0;
    for (const g of groups) {
      at += g;
      if (at >= slotsPerBar) break;
      if (s === at) return 3;
    }
    const inQuarters = groups.every((g) => g % SLOTS_PER_BEAT === 0);
    if (inQuarters && s % SLOTS_PER_BEAT === 0) return 2;
    return s % 2 === 0 ? 1 : 0;
  }

  if (slotsPerBar % 2 === 0 && s === slotsPerBar / 2) return 3;
  if (s % SLOTS_PER_BEAT === 0) return 2;
  if (s % 2 === 0) return 1;
  return 0;
}

/** Normalise a cell so its durations exactly fill the bar. */
export function fitCell(cell: RhythmCell, slotsPerBar: number): RhythmCell {
  const total = cell.reduce((a, b) => a + Math.abs(b), 0);
  if (total === slotsPerBar) return cell;
  const out = cell.slice();
  if (total < slotsPerBar) {
    const last = out[out.length - 1] ?? 4;
    out[out.length - 1] = last < 0 ? last - (slotsPerBar - total) : last + (slotsPerBar - total);
    return out;
  }
  let excess = total - slotsPerBar;
  while (excess > 0 && out.length) {
    const last = out[out.length - 1]!;
    const mag = Math.abs(last);
    if (mag > excess) {
      out[out.length - 1] = last < 0 ? last + excess : last - excess;
      excess = 0;
    } else {
      out.pop();
      excess -= mag;
    }
  }
  return out.length ? out : [slotsPerBar];
}

export function pickCell(rng: Rng, cells: WeightedCell[], slotsPerBar: number): RhythmCell {
  const chosen = rng.weighted(cells.map((c) => [c.cell, c.weight] as const));
  return fitCell(chosen, slotsPerBar);
}

/**
 * Clip a monophonic line so no note runs into the next.
 *
 * The barline gestures and the pickup both lengthen notes, and a phrase's
 * pickup lands inside the previous phrase's cadence, so overlaps are expected
 * rather than exceptional. Trimming is the right repair: the note keeps its
 * onset, which is what the ear timed, and loses only tail that was inaudible
 * under the next attack anyway.
 */
export function trimOverlaps<T extends { beat: number; duration: number }>(notes: T[]): T[] {
  /**
   * Below this, a note is a click rather than a pitch. At 130 BPM an eighth of
   * a beat is about 55 ms, which is roughly where the ear stops hearing a note
   * and starts hearing an attack — and a trim that leaves a stub is worse than
   * one that removes the note, because the stub is audible and meaningless.
   */
  const MIN_AUDIBLE = 0.125;
  const sorted = notes.slice().sort((a, b) => a.beat - b.beat);
  const out: T[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const n = sorted[i]!;
    const next = sorted[i + 1];
    const room = next ? next.beat - n.beat : n.duration;
    const duration = Math.min(n.duration, room);
    // Squeezed out by whatever follows — most often a pickup written backwards
    // across a section boundary onto a cadence that was still ringing.
    if (duration < MIN_AUDIBLE) continue;
    out.push({ ...n, duration });
  }
  return out;
}

/**
 * One onset of a rhythmic figure, in sixteenths from the top of the figure.
 *
 * Structural rather than named, and generic over whatever hangs off it, in the
 * idiom `cycleHits` in `generate/parts.ts` already established. A `BassHit`
 * carries its `tone`, `dur` and `vel` through every operator below untouched; a
 * `CompHit` carries its own; a drum slot is a bare number the caller wraps and
 * unwraps. None of them is named here, and nothing here can accidentally learn
 * what a bass is.
 */
export interface Onset {
  at: number;
}

/**
 * An onset that knows how long it lasts.
 *
 * Bass and comp hits do; a drum slot does not, because a cymbal has no length —
 * which is the same distinction `Feel.articulation` draws when it refuses to
 * name `drums`.
 */
type Timed = Onset & { dur?: number };

/**
 * Push one onset early and hold it through where it used to be.
 *
 * The push, the anticipation, the lean into the barline — one gesture with four
 * names, and the single most common thing a rhythm section does to its own
 * figure. Extending the duration is what makes it that rather than a note in the
 * wrong place: the note *arrives* early and is still sounding when the beat it
 * left comes round. An untimed onset simply moves.
 *
 * **One definition, two callers, and that is the point.** A seam `elide` and a
 * phrase-end bass push are the same gesture at two scales, and they meet in one
 * bar — the last of a section, which is a phrase end. Two implementations would
 * put two pushed notes an eighth apart across a barline, which is not two
 * gestures but mush. See `docs/rhythm-plan.md` §7.3.
 *
 * Coordinate-agnostic on purpose. `at` is sixteenths from wherever the caller's
 * figure starts, so a bar-relative pattern and an absolute-beat span through a
 * seam both work, and neither has to explain itself.
 */
export function anticipate<T extends Timed>(
  hits: readonly T[],
  opts: {
    /** The onset to push, as it currently stands. */
    target: number;
    /** How far early, in sixteenths. Defaults to 2 — an eighth. */
    by?: number;
  },
): T[] {
  const by = opts.by ?? 2;
  const sorted = hits.slice().sort((a, b) => a.at - b.at);
  if (by <= 0 || !sorted.some((h) => h.at === opts.target)) return sorted;

  /**
   * The whole attack moves, however many notes it is.
   *
   * A bass figure is not always one note at a time: ambient's `drone-octave` and
   * `drone-fifth` sound a root and an octave or a fifth *on the same slot*, and
   * they are one attack rather than two. Pushing the first of them and leaving
   * the second turns a dyad into two separate strikes an eighth apart, which is
   * not a push and is not anything.
   */
  const to = opts.target - by;
  const ceiling = sorted.reduce(
    (hi, h) => (h.at < opts.target ? Math.max(hi, h.at) : hi), -Infinity,
  );
  // A figure cannot push before its own beginning, and it cannot push onto or
  // through the attack in front of it: landing on one is a merge, not a push.
  if (to < 0 || to <= ceiling) return sorted;

  return sorted
    .map((h) => {
      if (h.at === opts.target) {
        return h.dur === undefined ? { ...h, at: to } : { ...h, at: to, dur: h.dur + by };
      }
      // Whatever was holding through that slot gives way. Nothing downstream
      // will do it: `trimOverlaps` guards the melodic layers and a rhythm
      // section figure is not one of them.
      if (h.dur !== undefined && h.at < to && h.at + h.dur > to) {
        return { ...h, dur: to - h.at };
      }
      return h;
    })
    .sort((a, b) => a.at - b.at);
}

/**
 * Drop the onsets the ear expects least.
 *
 * Metric rather than positional, which is the whole improvement over the version
 * `varyPattern` has been doing to the drummer's hand: keeping every other hit
 * thins a straight eighth-note figure correctly and mangles anything else,
 * because "every other" is only the same as "the weak ones" when the figure is
 * regular. Handed a `groups`, `metricStrength` puts the accents where the bar
 * actually has them, so this thins a 2+2+3 the way somebody counting it would.
 *
 * **Never a hole.** `varyPattern` learned this the hard way and wrote it down —
 * halving a waltz's three-quarter ride is not a sparser hand, it is a gap — so
 * the strongest onset survives any threshold, and a figure never thins to
 * nothing.
 */
export function thin<T extends Onset>(
  hits: readonly T[],
  opts: {
    slotsPerBar: number;
    groups?: readonly number[];
    /** Lowest `metricStrength` that survives. Defaults to 1 — the eighths and up. */
    keepAbove?: number;
  },
): T[] {
  const keepAbove = opts.keepAbove ?? 1;
  const strength = (h: T) => metricStrength(h.at, opts.slotsPerBar, opts.groups);
  const kept = hits.filter((h) => strength(h) >= keepAbove);
  if (kept.length) return kept;
  let best = hits[0];
  for (const h of hits) if (best && strength(h) > strength(best)) best = h;
  return best ? [best] : [];
}

/**
 * Split one onset into two of half the length.
 *
 * The fill-in: the bass player putting two eighths where the figure has a
 * quarter, on the bar before the phrase turns over. The second half carries the
 * *same payload* as the first — the same `tone`, so the same pitch — which is
 * what keeps this inside the line `feel.ts` draws around `ghost` and its own
 * `subdivide`: the note count changes and nothing is proposed about the harmony,
 * the voicing or the figure.
 *
 * Below two sixteenths there is nothing to halve that would still be a note
 * rather than a click, which is the threshold `trimOverlaps` already defends at
 * the other end of this file.
 */
export function subdivide<T extends Timed>(
  hits: readonly T[],
  opts: { target: number },
): T[] {
  const sorted = hits.slice().sort((a, b) => a.at - b.at);
  const attack = sorted.filter((h) => h.at === opts.target);
  // The whole attack splits or none of it does, for the reason `anticipate`
  // gives: a dyad half of which has been subdivided is two parts, not one.
  if (!attack.length || attack.some((h) => h.dur === undefined || h.dur < 2)) return sorted;

  const out: T[] = [];
  for (const h of sorted) {
    if (h.at !== opts.target) {
      out.push(h);
      continue;
    }
    const half = Math.floor(h.dur! / 2);
    out.push({ ...h, dur: half }, { ...h, at: h.at + half, dur: h.dur! - half });
  }
  return out.sort((a, b) => a.at - b.at);
}

/**
 * Rotate the whole figure, wrapping.
 *
 * The least safe of these and the one to reach for last. Moving a figure off the
 * downbeat is exactly how a comp stops agreeing with itself bar after bar, and
 * exactly how a **bass** stops stating the harmony — the root on beat one is the
 * one job the bass has, and a displaced bass figure has resigned from it. Comp
 * and counter figures are where this belongs; see `docs/rhythm-plan.md` §10.
 *
 * `span` is the figure's own length, not the bar's, so a pattern carrying a
 * `cycle` rotates within its cycle and keeps the drift that is the point of it.
 */
export function displace<T extends Onset>(
  hits: readonly T[],
  opts: { by: number; span: number },
): T[] {
  const span = Math.max(1, Math.round(opts.span));
  return hits
    .map((h) => ({ ...h, at: (((h.at + opts.by) % span) + span) % span }))
    .sort((a, b) => a.at - b.at);
}
