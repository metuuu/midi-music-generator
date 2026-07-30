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
