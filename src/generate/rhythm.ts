/**
 * Rhythm planning — the phrase's rhythm, decided before any pitch is.
 *
 * Rhythm goes first because rhythm is what identity is made of. A tune hummed
 * at the wrong pitches is still recognisably the tune; the same pitches on a
 * different rhythm are a different tune. Choosing the notes first and letting
 * the rhythm fall out of a per-bar lottery — which is what this generator used
 * to do — gets the priority exactly backwards, and it shows: melodies came out
 * correct and characterless.
 *
 * The unit is the **phrase**, not the bar, and that is the substantive change.
 * A bar-at-a-time generator cannot produce the three gestures that carry most
 * of the rhythmic life in every genre here:
 *
 *  - the **anacrusis** — the pickup that starts a phrase before its downbeat,
 *  - the **tie** — a note begun in one bar and held through the next barline,
 *  - the **push** — a downbeat anticipated, arriving an eighth early.
 *
 * All three cross a barline, and a bar-length rhythm cell forced to fill
 * exactly one bar (which is what `fitCell` guarantees) makes every one of them
 * unreachable. Measured before this file existed: **zero** notes in 120 songs
 * were tied across a barline, and 86% of iskelmä sections began dead on beat 1.
 * That is the sound of an exercise rather than a phrase, and no amount of
 * pitch-level work fixes it.
 */

import type { Rng } from '../core/rng.js';
import type { RhythmCell, WeightedCell } from '../style/types.js';
import type { HookLevel } from './hook.js';

export const SLOTS_PER_BEAT = 4;

export interface PlannedNote {
  /**
   * Sixteenths from the start of the phrase. **May be negative** — that is a
   * pickup, and being able to express it is most of the point of this file.
   */
  slot: number;
  /** Length in sixteenths. May run past the end of its own bar. */
  dur: number;
  /** Bar within the phrase that this note starts in. Negative for a pickup. */
  bar: number;
  /** Position within that bar's figure, for matching a restatement to its model. */
  pos: number;
  /** 0 = offbeat sixteenth … 4 = downbeat. */
  strength: number;
  /**
   * This note is an anticipated downbeat — it sounds before the barline but
   * belongs to the bar after it.
   *
   * Both halves of that matter. Harmonically it takes the *next* chord, which
   * is what an anticipation is: the band arrives and the tune got there first.
   * Metrically it keeps the downbeat's weight rather than the weak weight of
   * the slot it now sits on, because the ear still hears it as the downbeat —
   * that is why the gesture reads as a push instead of as an early note.
   */
  anticipated?: boolean;
}

export interface PhrasePlan {
  notes: PlannedNote[];
  /**
   * For each bar of the phrase, the bar whose figure it restates, or -1.
   * The pitch stage uses this to sequence a motif rather than re-inventing it.
   */
  restates: number[];
  /** The figure this phrase was built from, so a later phrase can quote it. */
  motif: RhythmCell;
  /**
   * True when that figure is the song's motto rather than a fresh draw. The
   * pitch stage reads this to decide whether bar 0 should also carry the
   * motto's *shape* — a quoted rhythm with an unrelated contour is only half a
   * quotation, and the half the ear notices least.
   */
  fromMotto: boolean;
}

/** 0 = offbeat sixteenth, 1 = eighth, 2 = beat, 3 = half-bar, 4 = downbeat. */
export function metricStrength(slot: number, slotsPerBar: number): number {
  const s = ((slot % slotsPerBar) + slotsPerBar) % slotsPerBar;
  if (s === 0) return 4;
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

export interface PhraseRhythmOptions {
  bars: number;
  slotsPerBar: number;
  cells: WeightedCell[];
  cadenceCells: WeightedCell[];
  rng: Rng;
  hook: HookLevel;
  /**
   * Appetite for gestures that cross the barline, 0..1. Comes from the style
   * and the mood, not from smoothness: a syncopation is not a fault being
   * tolerated, it is a choice being made, and the axis that decides whether a
   * note is *wrong* has no business deciding whether it is *interesting*.
   */
  syncopation: number;
  /**
   * May this phrase begin before its first downbeat? False for the phrase that
   * opens a section, where a pickup would sound over the previous section.
   */
  allowAnacrusis: boolean;
  /**
   * The song's own figure. When present, the phrase is built from it rather
   * than from a fresh draw — how often is `hook`'s business.
   */
  motto?: RhythmCell;
}

/**
 * Build one phrase's rhythm.
 *
 * Bars are laid out first, then the barline-crossing gestures are applied on
 * top. Doing it in that order is what lets a gesture be *chosen* rather than
 * merely permitted — the layout knows where the joins are, so a push or a tie
 * can be placed at a musically sensible one instead of wherever a per-bar
 * sampler happened to leave a gap.
 */
export function planPhraseRhythm(opts: PhraseRhythmOptions): PhrasePlan {
  const { bars, slotsPerBar, rng, hook, syncopation } = opts;

  // ---- 1. The figure this phrase is made of ----------------------------
  const fromMotto = opts.motto !== undefined && rng.chance(hook.mottoAdherence);
  const motif = fromMotto && opts.motto
    ? fitCell(opts.motto, slotsPerBar)
    : pickCell(rng, opts.cells, slotsPerBar);

  // Rhythm lock: one figure for every non-cadential bar. Rhythmic identity is
  // what survives being hummed badly by someone who cannot hold a pitch, which
  // is most people, which is why it matters more than the notes do.
  const locked = rng.chance(hook.rhythmLock);

  // ---- 2. Lay the bars out ---------------------------------------------
  const restates: number[] = [];
  const notes: PlannedNote[] = [];

  for (let bar = 0; bar < bars; bar++) {
    const isCadence = bar === bars - 1;
    // Bar 3 restating bar 1 reads as development; bar 2 restating bar 1 reads
    // as a refrain. Which one you want is exactly what `hook` is asking about.
    const restateBar = !isCadence && (bar === 2 || (hook.earlyRestate && bar === 1));

    let cell: RhythmCell;
    if (isCadence) {
      cell = pickCell(rng, opts.cadenceCells, slotsPerBar);
      restates.push(-1);
    } else if (bar === 0 || restateBar || locked) {
      cell = motif;
      restates.push(bar === 0 ? -1 : 0);
    } else {
      cell = pickCell(rng, opts.cells, slotsPerBar);
      restates.push(-1);
    }

    let slot = bar * slotsPerBar;
    let pos = 0;
    for (const entry of cell) {
      const dur = Math.abs(entry);
      if (entry > 0) {
        notes.push({
          slot, dur, bar, pos,
          strength: metricStrength(slot, slotsPerBar),
        });
        pos++;
      }
      slot += dur;
    }
  }

  if (!notes.length) return { notes, restates, motif, fromMotto };

  // ---- 3. Gestures across the barline ----------------------------------
  applyBarlineGestures(notes, { bars, slotsPerBar, rng, syncopation });

  // ---- 4. The pickup ---------------------------------------------------
  if (opts.allowAnacrusis && rng.chance(0.28 + syncopation * 0.34)) {
    addAnacrusis(notes, { slotsPerBar, rng });
  }

  notes.sort((a, b) => a.slot - b.slot);
  for (const n of notes) {
    if (!n.anticipated) n.strength = metricStrength(n.slot, slotsPerBar);
  }
  return { notes, restates, motif, fromMotto };
}

/**
 * Push and tie, at the joins between bars.
 *
 * A **push** moves a downbeat earlier so it arrives before the bar it belongs
 * to — the single most characteristic rhythmic gesture in tango, in bossa, and
 * in most pop written since 1960. A **tie** does the opposite: it holds a note
 * *through* the downbeat so the downbeat is never struck at all. Both remove an
 * accent from the barline, which is why they make a line sound phrased rather
 * than measured, and both were previously impossible to express.
 *
 * The last barline of a phrase is left alone. That join leads into the cadence,
 * and a cadence that arrives early or gets swallowed stops sounding like an
 * arrival — which is the one thing it exists to do.
 */
function applyBarlineGestures(
  notes: PlannedNote[],
  opts: { bars: number; slotsPerBar: number; rng: Rng; syncopation: number },
): void {
  const { bars, slotsPerBar, rng, syncopation } = opts;

  for (let bar = 1; bar < bars - 1; bar++) {
    if (!rng.chance(syncopation)) continue;
    const barStart = bar * slotsPerBar;

    const downbeat = notes.find((n) => n.slot === barStart);
    if (!downbeat) continue;
    const before = lastBefore(notes, barStart);
    if (!before) continue;

    // A push needs the previous note to have room to give up; a tie needs the
    // downbeat note to be expendable.
    if (rng.chance(0.55)) {
      // Push: an eighth is the idiomatic amount, a sixteenth the sharper one.
      const by = rng.weighted([[2, 4], [1, 2]] as const);
      if (before.dur - by < 1) continue;
      before.dur -= by;
      downbeat.slot -= by;
      downbeat.dur += by;
      downbeat.anticipated = true;
    } else {
      // Tie: the previous note swallows the downbeat.
      before.dur += downbeat.dur;
      notes.splice(notes.indexOf(downbeat), 1);
    }
  }
}

/**
 * Prepend a pickup.
 *
 * Taken *out of* the phrase's first note rather than added in front of it, so
 * the phrase still begins where it began. A pickup manufactured by extending
 * backwards would push the whole phrase off the beat.
 */
function addAnacrusis(
  notes: PlannedNote[],
  opts: { slotsPerBar: number; rng: Rng },
): void {
  const { slotsPerBar, rng } = opts;
  const first = notes[0];
  if (!first || first.slot !== 0 || first.dur < 3) return;

  const count = rng.weighted([[1, 5], [2, 2]] as const);
  const unit = first.dur >= 6 ? 2 : 1; // an eighth if there is room, else a sixteenth
  const taken = count * unit;
  if (first.dur - taken < 1) return;

  first.dur -= taken;
  for (let i = 0; i < count; i++) {
    const slot = -(count - i) * unit;
    notes.push({
      slot, dur: unit, bar: -1, pos: i,
      strength: metricStrength(slot, slotsPerBar),
    });
  }
}

function lastBefore(notes: PlannedNote[], slot: number): PlannedNote | undefined {
  let best: PlannedNote | undefined;
  for (const n of notes) {
    if (n.slot < slot && (!best || n.slot > best.slot)) best = n;
  }
  return best;
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
  const sorted = notes.slice().sort((a, b) => a.beat - b.beat);
  const out: T[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const n = sorted[i]!;
    const next = sorted[i + 1];
    const room = next ? next.beat - n.beat : n.duration;
    const duration = Math.min(n.duration, room);
    if (duration <= 1e-6) continue; // wholly displaced by the note after it
    out.push({ ...n, duration });
  }
  return out;
}
