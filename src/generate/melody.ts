/**
 * Melody generation.
 *
 * The single most important decision in this file is that melodies are built
 * from *motifs and their transformations*, not from note-by-note random walks.
 * Iskelmä is vocal music: a phrase states an idea, restates it a step lower,
 * and answers it with a cadence. A random walk that merely obeys the harmony
 * sounds like an exercise; reusing a two-bar shape sounds like a song.
 *
 * The other rules enforced here, all genuinely idiomatic:
 *  - Chord tones on strong beats, passing and neighbour tones on weak ones.
 *  - Stepwise motion dominates; a leap is answered by a step in the opposite
 *    direction.
 *  - Over dominant-function chords in minor, the 7th is raised — harmonic
 *    minor — so the leading tone actually leads.
 *  - Phrases arc: they rise to a peak around two-thirds through, then fall.
 *  - Antecedent phrases stop on 5̂ or 2̂ (open); consequents land on 1̂ (closed),
 *    usually on a long held note.
 */

import type { Chord } from '../core/chord.js';
import { chordPcs } from '../core/chord.js';
import type { Midi, Pc } from '../core/pitch.js';
import { clampToRange, pc } from '../core/pitch.js';
import type { Mode, Scale } from '../core/scale.js';
import { makeScale, snapToScale, stepInScale } from '../core/scale.js';
import type { Rng } from '../core/rng.js';
import type { NoteEvent } from '../core/types.js';
import type { RhythmCell, Style } from '../style/types.js';

export const SLOTS_PER_BEAT = 4;

export interface MelodyOptions {
  chords: Chord[];
  beatsPerBar: number;
  style: Style;
  rng: Rng;
  tonic: Pc;
  mode: Mode;
  range: [Midi, Midi];
  /** Absolute beat where this section starts. */
  startBeat: number;
  /** Multipliers from the mood. */
  ornamentScale: number;
  leapScale: number;
  /** Solo sections get busier, more ornamented lines. */
  soloistic?: boolean;
}

interface BarMotif {
  cell: RhythmCell;
  /** Scale-step deltas between successive notes; first is relative to the previous bar's last note. */
  intervals: number[];
}

/** Natural minor for melody, harmonic minor the moment the dominant arrives. */
function scaleForChord(tonic: Pc, mode: Mode, chord: Chord): Scale {
  if (mode === 'minor' && chord.dominantFunction) return makeScale(tonic, 'harmonicMinor');
  return makeScale(tonic, mode === 'minor' ? 'minor' : 'major');
}

/** 0 = offbeat sixteenth, 1 = eighth, 2 = beat, 3 = half-bar, 4 = downbeat. */
function metricStrength(slot: number, slotsPerBar: number): number {
  if (slot === 0) return 4;
  if (slotsPerBar % 2 === 0 && slot === slotsPerBar / 2) return 3;
  if (slot % SLOTS_PER_BEAT === 0) return 2;
  if (slot % 2 === 0) return 1;
  return 0;
}

/** Normalise a cell so its durations exactly fill the bar. */
function fitCell(cell: RhythmCell, slotsPerBar: number): RhythmCell {
  const total = cell.reduce((a, b) => a + Math.abs(b), 0);
  if (total === slotsPerBar) return cell;
  const out = cell.slice();
  if (total < slotsPerBar) {
    const last = out[out.length - 1] ?? 4;
    out[out.length - 1] = last < 0 ? last - (slotsPerBar - total) : last + (slotsPerBar - total);
    return out;
  }
  // Too long: trim from the end, dropping entries entirely if needed.
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

function pickCell(rng: Rng, cells: { cell: RhythmCell; weight: number }[], slotsPerBar: number): RhythmCell {
  const chosen = rng.weighted(cells.map((c) => [c.cell, c.weight] as const));
  return fitCell(chosen, slotsPerBar);
}

/**
 * Choose the next melody note.
 *
 * Candidate generation is deliberately narrow — a window of a few scale steps
 * around the previous note — because wide-open choice is what makes generated
 * melody wander. Scoring then expresses the actual style rules.
 */
function choosePitch(args: {
  scale: Scale;
  chord: Chord;
  prev: Midi;
  prevInterval: number;
  strength: number;
  targetHeight: number;
  range: [Midi, Midi];
  rng: Rng;
  leap: number;
  forceChordTone: boolean;
}): Midi {
  const { scale, chord, prev, prevInterval, strength, targetHeight, range, rng, leap, forceChordTone } = args;
  const [lo, hi] = range;
  const tones = new Set(chordPcs(chord));

  const candidates: Midi[] = [];
  for (let step = -5; step <= 5; step++) {
    const cand = stepInScale(scale, prev, step);
    if (cand >= lo && cand <= hi) candidates.push(cand);
  }
  // Always allow the chord tones nearest the previous note, even if they fall
  // outside the stepwise window — this is how expressive leaps happen.
  for (const p of tones) {
    for (const oct of [-12, 0, 12]) {
      const base = Math.floor(prev / 12) * 12 + p + oct;
      if (base >= lo && base <= hi) candidates.push(base);
    }
  }

  const wantChordTone = forceChordTone || strength >= 2;
  const scored: (readonly [Midi, number])[] = [];

  for (const cand of new Set(candidates)) {
    const isChordTone = tones.has(pc(cand));
    if (wantChordTone && !isChordTone && strength >= 3) continue; // downbeats are non-negotiable

    const semis = Math.abs(cand - prev);
    let w = 1;

    // Stepwise motion is the default gait of the style. These weights are the
    // main lever on how singable the result is: iskelmä melodies are roughly
    // 60% seconds, 25% thirds, and only occasional wider leaps.
    if (semis === 0) w *= 0.55;
    else if (semis <= 2) w *= 6.0;
    else if (semis <= 4) w *= 1.15;
    else if (semis <= 7) w *= 0.3;
    else w *= 0.06;

    // The style's leap appetite scales everything wider than a step, so a
    // chord tone five semitones away can never simply out-argue a neighbour.
    if (semis > 2) w *= 0.45 + leap * 1.8;

    // Harmony fit.
    if (isChordTone) w *= wantChordTone ? 2.1 : 1.15;
    else if (wantChordTone) w *= 0.3;

    // Follow the phrase arc — a gentle pull, not a magnet, or every note
    // jumps straight to the target height.
    const heightErr = Math.abs(cand - targetHeight);
    w *= Math.exp(-(heightErr * heightErr) / (2 * 7 * 7));

    // Recover from a leap by stepping back the other way.
    if (Math.abs(prevInterval) > 4) {
      const sameDirection = Math.sign(cand - prev) === Math.sign(prevInterval);
      if (sameDirection) w *= 0.3;
      if (semis <= 2 && !sameDirection) w *= 2.4;
    }

    if (w > 0) scored.push([cand, w]);
  }

  if (!scored.length) return clampToRange(snapToScale(scale, prev), lo, hi);
  return rng.weighted(scored);
}

/**
 * Render one bar from a rhythm cell, choosing pitches freshly.
 * Returns the events plus the interval sequence, so the bar can be reused as a
 * motif later.
 */
function renderBar(args: {
  cell: RhythmCell;
  chord: Chord;
  scale: Scale;
  prev: Midi;
  prevInterval: number;
  barStartBeat: number;
  slotsPerBar: number;
  range: [Midi, Midi];
  rng: Rng;
  leap: number;
  ornament: number;
  arcAt: (t: number) => number;
  cadenceTarget?: Midi;
}): { events: NoteEvent[]; last: Midi; lastInterval: number; motif: BarMotif } {
  const { cell, chord, scale, barStartBeat, slotsPerBar, range, rng, leap, arcAt, cadenceTarget } = args;
  const events: NoteEvent[] = [];
  const intervals: number[] = [];
  let prev = args.prev;
  let prevInterval = args.prevInterval;
  let slot = 0;

  const noteCount = cell.filter((c) => c > 0).length;
  let noteIdx = 0;

  for (const entry of cell) {
    const dur = Math.abs(entry);
    if (entry < 0) {
      slot += dur;
      continue;
    }
    const isLastNote = noteIdx === noteCount - 1;
    const strength = metricStrength(slot, slotsPerBar);
    const t = slotsPerBar > 0 ? slot / slotsPerBar : 0;

    let midi: Midi;
    if (isLastNote && cadenceTarget !== undefined) {
      midi = clampToRange(cadenceTarget, range[0], range[1]);
    } else {
      midi = choosePitch({
        scale, chord, prev, prevInterval, strength,
        targetHeight: arcAt(t),
        range, rng, leap,
        forceChordTone: strength >= 2 && dur >= SLOTS_PER_BEAT,
      });
    }

    // Record the motion as scale steps so the figure can be transposed later.
    intervals.push(scaleStepsBetween(scale, prev, midi));
    prevInterval = midi - prev;
    prev = midi;

    events.push({
      beat: barStartBeat + slot / SLOTS_PER_BEAT,
      duration: dur / SLOTS_PER_BEAT,
      midi,
      velocity: velocityFor(strength, rng),
    });
    slot += dur;
    noteIdx++;
  }

  return { events, last: prev, lastInterval: prevInterval, motif: { cell, intervals } };
}

/** Replay a motif's shape over a new chord — a diatonic sequence. */
function renderMotif(args: {
  motif: BarMotif;
  chord: Chord;
  scale: Scale;
  prev: Midi;
  barStartBeat: number;
  slotsPerBar: number;
  range: [Midi, Midi];
  rng: Rng;
  /** Extra scale steps applied to the whole figure. */
  shift: number;
  cadenceTarget?: Midi;
}): { events: NoteEvent[]; last: Midi; lastInterval: number } {
  const { motif, chord, scale, slotsPerBar, range, rng, shift, barStartBeat, cadenceTarget } = args;
  const events: NoteEvent[] = [];
  let slot = 0;
  let idx = 0;
  let prev = args.prev;
  let lastInterval = 0;

  // Start the sequence on a chord tone so the transposition still fits the bar.
  let cursor = stepInScale(scale, args.prev, shift);
  cursor = clampToRange(cursor, range[0], range[1]);

  const noteCount = motif.cell.filter((c) => c > 0).length;

  for (const entry of motif.cell) {
    const dur = Math.abs(entry);
    if (entry < 0) {
      slot += dur;
      continue;
    }
    const step = motif.intervals[idx] ?? 0;
    let midi = idx === 0 ? cursor : stepInScale(scale, prev, step);
    midi = clampToRange(midi, range[0], range[1]);

    if (idx === noteCount - 1 && cadenceTarget !== undefined) {
      midi = clampToRange(cadenceTarget, range[0], range[1]);
    }

    lastInterval = midi - prev;
    prev = midi;
    events.push({
      beat: barStartBeat + slot / SLOTS_PER_BEAT,
      duration: dur / SLOTS_PER_BEAT,
      midi,
      velocity: velocityFor(metricStrength(slot, slotsPerBar), rng),
    });
    slot += dur;
    idx++;
  }
  return { events, last: prev, lastInterval };
}

function velocityFor(strength: number, rng: Rng): number {
  const base = 0.62 + strength * 0.075;
  return Math.max(0.3, Math.min(1, base + rng.float(-0.05, 0.05)));
}

/** Signed number of scale steps from `a` to `b`, used to store motif shapes. */
function scaleStepsBetween(scale: Scale, a: Midi, b: Midi): number {
  const sa = snapToScale(scale, a);
  const sb = snapToScale(scale, b);
  if (sa === sb) return 0;
  const dir = sb > sa ? 1 : -1;
  let cur = sa;
  for (let n = 1; n <= 24; n++) {
    cur = stepInScale(scale, cur, dir);
    if ((dir > 0 && cur >= sb) || (dir < 0 && cur <= sb)) return n * dir;
  }
  return Math.round((b - a) / 2);
}

export function generateMelody(opts: MelodyOptions): NoteEvent[] {
  const { chords, beatsPerBar, style, rng, tonic, mode, range, startBeat } = opts;
  const slotsPerBar = beatsPerBar * SLOTS_PER_BEAT;
  const bars = chords.length;
  const phraseBars = bars >= 8 ? 4 : Math.max(2, bars);
  const leap = style.melody.leap * opts.leapScale * (opts.soloistic ? 1.25 : 1);
  const ornament = style.melody.ornament * opts.ornamentScale * (opts.soloistic ? 1.5 : 1);

  const baseScale = makeScale(tonic, mode === 'minor' ? 'minor' : 'major');
  const centre = (range[0] + range[1]) / 2;
  const out: NoteEvent[] = [];

  let prev = clampToRange(snapToScale(baseScale, Math.round(centre)), range[0], range[1]);
  let prevInterval = 0;

  for (let phraseStart = 0; phraseStart < bars; phraseStart += phraseBars) {
    const thisPhraseBars = Math.min(phraseBars, bars - phraseStart);
    const phraseIndex = Math.floor(phraseStart / phraseBars);
    // Alternate open (antecedent) and closed (consequent) endings.
    const isConsequent = phraseIndex % 2 === 1 || phraseStart + phraseBars >= bars;

    // The arc: rise toward a peak about two-thirds through, then fall away.
    const peak = rng.float(0.55, 0.72);
    const lift = rng.float(3, style.melody.span * 0.55);
    const phraseBase = centre - lift * 0.35;
    const arcFor = (barInPhrase: number) => (t: number) => {
      const pos = (barInPhrase + t) / thisPhraseBars;
      const shape = pos <= peak ? pos / peak : 1 - (pos - peak) / Math.max(0.001, 1 - peak);
      return phraseBase + lift * shape;
    };

    let motifA: BarMotif | undefined;

    for (let b = 0; b < thisPhraseBars; b++) {
      const barIdx = phraseStart + b;
      const chord = chords[barIdx]!;
      const scale = scaleForChord(tonic, mode, chord);
      const barStartBeat = startBeat + barIdx * beatsPerBar;
      const isCadenceBar = b === thisPhraseBars - 1;

      let cadenceTarget: Midi | undefined;
      if (isCadenceBar) {
        // Antecedent stays open on 5̂ or 2̂; consequent closes on 1̂ (or 3̂).
        const degrees = isConsequent ? [0, 0, 0, 2] : [4, 4, 1, 2];
        const deg = rng.pick(degrees);
        const target = stepInScale(baseScale, prev, 0);
        cadenceTarget = nearestDegree(baseScale, deg, target);
      }

      const useSequence =
        b === 2 && motifA !== undefined && rng.chance(style.melody.sequence);

      if (useSequence && motifA) {
        // Classic sequence: restate the opening figure a step or third lower.
        const shift = rng.weighted([[-1, 4], [-2, 3], [1, 2], [0, 1]] as const);
        const r = renderMotif({
          motif: motifA, chord, scale, prev, barStartBeat, slotsPerBar, range, rng, shift,
          ...(cadenceTarget !== undefined ? { cadenceTarget } : {}),
        });
        out.push(...r.events);
        prev = r.last;
        prevInterval = r.lastInterval;
      } else {
        const cell = isCadenceBar
          ? pickCell(rng, style.cadenceCells, slotsPerBar)
          : pickCell(rng, style.melodyCells, slotsPerBar);
        const r = renderBar({
          cell, chord, scale, prev, prevInterval, barStartBeat, slotsPerBar, range, rng,
          leap, ornament, arcAt: arcFor(b),
          ...(cadenceTarget !== undefined ? { cadenceTarget } : {}),
        });
        out.push(...r.events);
        prev = r.last;
        prevInterval = r.lastInterval;
        if (b === 0) motifA = r.motif;
      }
    }
  }

  return out;
}

/** Nearest note of scale degree `deg` (0-based) to a reference pitch. */
function nearestDegree(scale: Scale, deg: number, reference: Midi): Midi {
  const target = scale.pcs[deg % scale.pcs.length]!;
  const base = Math.floor(reference / 12) * 12 + target;
  let best = base;
  let bestDist = Math.abs(base - reference);
  for (const cand of [base - 12, base + 12]) {
    const d = Math.abs(cand - reference);
    if (d < bestDist) { best = cand; bestDist = d; }
  }
  return best;
}
