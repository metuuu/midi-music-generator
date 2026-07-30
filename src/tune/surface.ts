/**
 * The surface — getting from one structural tone to the next.
 *
 * By the time this runs, everything has been decided except which notes sound: the
 * figure is known, the backbone is known, the arrival is known. So a surface note
 * is not a choice about what would sound acceptable here, it is a step on a route
 * with a destination. That is the inversion this whole engine is for.
 *
 * Two things in here are the substance.
 *
 * **The figure bends at its approach, not throughout.** When a figure's own shape
 * does not quite reach the anchor it is heading for, the discrepancy is absorbed by
 * the step *into* the anchor rather than smeared across every note. The figure
 * therefore keeps its identity and only its last interval gives — which is exactly
 * what a player does when sequencing a lick through changes, and the opposite of
 * what the old engine did, where a stored shape was replayed verbatim and then had
 * individual notes dragged onto chord tones afterwards.
 *
 * **Dissonance must resolve; it is not forbidden.** The old engine's rule was a
 * hard skip: a strong beat could not carry a non-chord tone at all. That single
 * line is most of the computer sound, because suspensions, appoggiaturas, 4–3s and
 * anticipations are all strong-beat dissonances, and they are most of what makes a
 * line sound sung. Here a strong-beat dissonance is allowed and then *checked*: the
 * next note has to step out of it, against the direction it was approached from. If
 * it does not, something moves — and the thing that moves first is the resolution,
 * not the dissonance.
 */

import { chordPcs, type Chord } from '../core/chord.js';
import { SLOTS_PER_BEAT } from '../core/grid.js';
import type { Midi, Pc } from '../core/pitch.js';
import { clampToRange, pc } from '../core/pitch.js';
import type { Rng } from '../core/rng.js';
import type { Mode, Scale } from '../core/scale.js';
import { snapToScale, scaleStepsBetween, stepInScale } from '../core/scale.js';
import {
  evaluate as evaluateRules, type Accompaniment, type NoteContext, type Rule,
} from '../core/rules.js';
import type { NoteEvent } from '../core/types.js';
import type { Motif, Skeleton } from './types.js';

export interface SurfaceOptions {
  figure: Motif;
  skeleton: Skeleton;
  bars: number;
  slotsPerBar: number;
  /** Absolute beat of this phrase's first bar. */
  startBeat: number;
  /** Chord under each bar of the phrase. */
  chords: Chord[];
  scaleAt: (barInPhrase: number) => Scale;
  baseScale: Scale;
  subset: readonly number[];
  range: [Midi, Midi];
  mode: Mode;
  tonic: Pc;
  strictness: number;
  rules: Rule[];
  accompaniment: Accompaniment;
  /** Leap freedom of whoever is playing this, 0..1. */
  agility: number;
  rng: Rng;
}

export function realisePhrase(opts: SurfaceOptions): NoteEvent[] {
  const { figure, skeleton, bars, slotsPerBar, range } = opts;
  const phraseSlots = bars * slotsPerBar;
  const onsets = figure.gesture.onsets.filter((o) => o.at < phraseSlots);
  if (!onsets.length || !skeleton.targets.length) return [];

  const midis = walk(opts, onsets, phraseSlots);
  resolveDissonances(opts, onsets, midis, phraseSlots);
  applyRules(opts, onsets, midis, phraseSlots);

  return onsets.map((onset, i) => ({
    beat: opts.startBeat + onset.at / SLOTS_PER_BEAT,
    duration: Math.max(1, onset.dur) / SLOTS_PER_BEAT,
    midi: clampToRange(midis[i]!, range[0], range[1]),
    velocity: 0.5 + onset.accent * 0.4,
  }));
}

/**
 * Lay the pitches out: anchors exactly, everything else on the way between them.
 */
function walk(
  opts: SurfaceOptions, onsets: Motif['gesture']['onsets'], phraseSlots: number,
): Midi[] {
  const { figure, skeleton, slotsPerBar, range } = opts;
  const [lo, hi] = range;
  const midis: Midi[] = new Array(onsets.length).fill(0);

  // Which onset each target lands on. A target whose slot has no onset attaches to
  // the nearest one, so a skeleton is never silently ignored.
  const anchorAt = new Map<number, Midi>();
  for (const t of skeleton.targets) {
    let best = 0;
    for (let i = 0; i < onsets.length; i++) {
      if (Math.abs(onsets[i]!.at - t.at) < Math.abs(onsets[best]!.at - t.at)) best = i;
    }
    anchorAt.set(best, t.midi);
  }
  const anchors = [...anchorAt.keys()].sort((a, b) => a - b);

  const scaleFor = (index: number): Scale => {
    const slot = Math.max(0, onsets[index]!.at);
    return opts.scaleAt(Math.max(0, Math.min(opts.bars - 1, Math.floor(slot / slotsPerBar))));
  };

  // Anchors first, exactly as the skeleton chose them.
  for (const i of anchors) midis[i] = anchorAt.get(i)!;

  // Behind the first anchor: a pickup, walked backwards out of the note it leads
  // into. Written forwards it would start from nowhere in particular and arrive at
  // the anchor by luck.
  const first = anchors[0]!;
  for (let i = first - 1; i >= 0; i--) {
    const step = figure.contour[i + 1] ?? 0;
    midis[i] = reflect(stepInScale(scaleFor(i), midis[i + 1]!, -step), lo, hi);
  }

  // Between anchors.
  for (let a = 0; a < anchors.length - 1; a++) {
    const from = anchors[a]!;
    const to = anchors[a + 1]!;
    if (to <= from + 1) continue;

    const steps = figure.contour.slice(from + 1, to + 1);
    const required = scaleStepsBetween(scaleFor(from), midis[from]!, midis[to]!);
    const fitted = fitSegment(steps, required, opts.agility);

    let cursor = midis[from]!;
    for (let i = from + 1; i < to; i++) {
      cursor = reflect(stepInScale(scaleFor(i), cursor, fitted[i - from - 1] ?? 0), lo, hi);
      midis[i] = snapToSubset(scaleFor(i), opts.subset, cursor);
    }
  }

  // Past the last anchor — a tail the figure has that the backbone did not reach.
  const last = anchors[anchors.length - 1]!;
  let cursor = midis[last]!;
  for (let i = last + 1; i < onsets.length; i++) {
    cursor = reflect(stepInScale(scaleFor(i), cursor, figure.contour[i] ?? 0), lo, hi);
    midis[i] = snapToSubset(scaleFor(i), opts.subset, cursor);
  }

  void phraseSlots;
  return midis;
}

/**
 * Make the figure's steps add up to the distance it has to cover.
 *
 * The discrepancy goes into the **approach** — the step into the anchor — and only
 * spills back into the body of the figure when the approach would become a leap
 * nobody could sing. A figure whose every interval is quietly widened to reach its
 * target is a different figure; one whose last interval is a fourth instead of a
 * third is the same figure arriving.
 */
export function fitSegment(steps: number[], required: number, agility: number): number[] {
  if (!steps.length) return steps;
  const out = steps.slice();
  const reach = 3 + Math.round(agility * 3);

  const body = out.slice(0, -1).reduce((a, b) => a + b, 0);
  let approach = required - body;
  if (Math.abs(approach) <= reach) {
    out[out.length - 1] = approach;
    return out;
  }

  // Too far to bridge in one step: give the body some of it, largest intervals
  // first, so the shape stretches where it is already stretching.
  const order = out.slice(0, -1)
    .map((s, i) => [i, Math.abs(s)] as const)
    .sort((a, b) => b[1] - a[1])
    .map(([i]) => i);
  const dir = Math.sign(approach);
  let debt = Math.abs(approach) - reach;
  for (let pass = 0; pass < 4 && debt > 0 && order.length; pass++) {
    for (const i of order) {
      if (debt <= 0) break;
      out[i] = out[i]! + dir;
      debt--;
    }
  }
  approach = required - out.slice(0, -1).reduce((a, b) => a + b, 0);
  out[out.length - 1] = Math.max(-reach - 2, Math.min(reach + 2, approach));
  return out;
}

/**
 * The resolution rule — the replacement for "strong beats must be chord tones".
 *
 * A strong-beat note outside the chord is allowed to stand if the next note steps
 * out of it against the direction it arrived from. That is the definition of a
 * suspension, an appoggiatura and a 4–3 alike, and all three were unreachable in
 * the old engine because it filtered the dissonance out before it could resolve.
 *
 * When the check fails the *resolution* moves first, not the dissonance. Moving the
 * dissonance is what the old engine did, and it is the wrong end: the note is
 * usually the good one, and the note after it is usually the accident.
 */
function resolveDissonances(
  opts: SurfaceOptions, onsets: Motif['gesture']['onsets'], midis: Midi[], phraseSlots: number,
): void {
  const anchorSlots = new Set(opts.skeleton.targets.map((t) => t.at));
  const [lo, hi] = opts.range;

  for (let i = 0; i < onsets.length; i++) {
    const onset = onsets[i]!;
    if (onset.accent < 0.7 || anchorSlots.has(onset.at)) continue;

    const bar = Math.max(0, Math.min(opts.bars - 1, Math.floor(Math.max(0, onset.at) / opts.slotsPerBar)));
    const chord = opts.chords[Math.min(opts.chords.length - 1, bar)]!;
    if (chordPcs(chord).includes(pc(midis[i]!))) continue;

    const approach = i > 0 ? midis[i]! - midis[i - 1]! : 0;
    const next = midis[i + 1];

    if (next === undefined) {
      // Nothing follows, so nothing can resolve it. A phrase may not end on an
      // unprepared dissonance; that is not a suspension, it is a wrong note.
      midis[i] = nearChordTone(chord, midis[i]!, 2, lo, hi) ?? midis[i]!;
      continue;
    }

    const resolution = next - midis[i]!;
    const stepwise = Math.abs(resolution) <= 2 && resolution !== 0;
    const away = approach === 0 || Math.sign(resolution) !== Math.sign(approach);
    if (stepwise && away) continue;

    const dir = approach > 0 ? -1 : approach < 0 ? 1 : (opts.rng.chance(0.7) ? -1 : 1);
    const scale = opts.scaleAt(bar);
    const cand = stepInScale(scale, midis[i]!, dir);
    if (!anchorSlots.has(onsets[i + 1]!.at) && cand >= lo && cand <= hi) {
      midis[i + 1] = cand;
    } else {
      midis[i] = nearChordTone(chord, midis[i]!, 2, lo, hi) ?? midis[i]!;
    }
  }
  void phraseSlots;
}

/**
 * The rule table, applied to connective notes only.
 *
 * `core/rules.ts` is good at what it does and is kept whole: it knows that an
 * augmented second is unsingable, that a tritone leap wants preparing, that a
 * seventh has somewhere to go. What it is not allowed to do here is overrule the
 * backbone — an anchor is a structural decision made with the harmony in hand, and
 * a rule that moves it has misunderstood which pass is in charge.
 */
function applyRules(
  opts: SurfaceOptions, onsets: Motif['gesture']['onsets'], midis: Midi[], phraseSlots: number,
): void {
  if (opts.strictness < 1) return;
  const anchorSlots = new Set(opts.skeleton.targets.map((t) => t.at));
  const [lo, hi] = opts.range;

  for (let i = 1; i < onsets.length; i++) {
    const onset = onsets[i]!;
    if (anchorSlots.has(onset.at)) continue;

    const bar = Math.max(0, Math.min(opts.bars - 1, Math.floor(Math.max(0, onset.at) / opts.slotsPerBar)));
    const scale = opts.scaleAt(bar);
    const context = (candidate: Midi): NoteContext => ({
      candidate,
      prev: midis[i - 1]!,
      chord: opts.chords[Math.min(opts.chords.length - 1, bar)]!,
      scale,
      mode: opts.mode,
      tonic: opts.tonic,
      strength: strengthOf(onset.accent),
      duration: onset.dur / SLOTS_PER_BEAT,
      beat: opts.startBeat + onset.at / SLOTS_PER_BEAT,
      accompaniment: opts.accompaniment,
      agility: opts.agility,
      ...(i >= 2 ? { prevPrev: midis[i - 2]! } : {}),
    });

    if (!evaluateRules(context(midis[i]!), opts.strictness, opts.rules).vetoed) continue;

    // Search outward for the nearest note that is not forbidden. Failing that,
    // leave it: music that breaks a rule beats music that stops.
    for (let d = 1; d <= 3; d++) {
      const up = clampToRange(stepInScale(scale, midis[i]!, d), lo, hi);
      const down = clampToRange(stepInScale(scale, midis[i]!, -d), lo, hi);
      const better = [down, up].find((c) =>
        c !== midis[i]! && !evaluateRules(context(c), opts.strictness, opts.rules).vetoed);
      if (better !== undefined) { midis[i] = better; break; }
    }
  }
  void phraseSlots;
}

/**
 * The rule table counts in metric strength; a figure counts in what it leans on.
 *
 * Translating rather than replacing is deliberate. The rules were written against
 * "how much does the ear expect something here", which is a real question with a
 * metric answer — but in this engine the answer is the figure's, because a
 * syncopation is a note the figure accents where the metre does not.
 */
function strengthOf(accent: number): number {
  if (accent >= 0.95) return 4;
  if (accent >= 0.85) return 3;
  if (accent >= 0.72) return 2;
  if (accent >= 0.6) return 1;
  return 0;
}

function nearChordTone(
  chord: Chord, midi: Midi, reach: number, lo: Midi, hi: Midi,
): Midi | undefined {
  const tones = chordPcs(chord);
  let best: Midi | undefined;
  let bestDist = Infinity;
  for (let d = -reach; d <= reach; d++) {
    const cand = midi + d;
    if (cand < lo || cand > hi || !tones.includes(pc(cand))) continue;
    if (Math.abs(d) < bestDist) { bestDist = Math.abs(d); best = cand; }
  }
  return best;
}

/**
 * Step into the range by turning back rather than by dropping an octave.
 *
 * `clampToRange` preserves the pitch class by moving whole octaves, which is right
 * for an isolated note and wrong inside a figure: a sequence that walks into the
 * ceiling comes back an octave lower, and the listener hears a twelve-semitone leap
 * in the middle of a stepwise idea. Reflecting keeps the *size* of the motion, which
 * is what the shape is made of, and reverses only its direction.
 */
function reflect(midi: Midi, lo: Midi, hi: Midi): Midi {
  if (midi >= lo && midi <= hi) return midi;
  if (hi <= lo) return lo;
  let m = midi;
  for (let guard = 0; guard < 8 && (m < lo || m > hi); guard++) {
    if (m < lo) m = lo + (lo - m);
    if (m > hi) m = hi - (m - hi);
  }
  return clampToRange(m, lo, hi);
}

/** Pull a note onto the section's degree subset, by the smallest move available. */
export function snapToSubset(scale: Scale, subset: readonly number[], midi: Midi): Midi {
  if (subset.length >= scale.pcs.length) return midi;
  const allowed = new Set(subset.map((d) => scale.pcs[d % scale.pcs.length]!));
  if (allowed.has(pc(midi))) return midi;
  for (let d = 1; d <= 2; d++) {
    if (allowed.has(pc(midi - d))) return midi - d;
    if (allowed.has(pc(midi + d))) return midi + d;
  }
  return snapToScale(scale, midi);
}
