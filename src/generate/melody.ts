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
import { makeScale, scaleStepsBetween, snapToScale, stepInScale } from '../core/scale.js';
import type { Rng } from '../core/rng.js';
import type { NoteEvent } from '../core/types.js';
import type { RhythmCell, Style } from '../style/types.js';
import {
  buildAccompaniment, EMPTY_ACCOMPANIMENT, evaluate as evaluateRules, RULES,
  type Accompaniment, type NoteContext, type Rule,
} from './constraints.js';
import { getHook, type HookLevel } from './hook.js';

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
  /** Constraint strictness, 0 (free) to 4 (polished). */
  strictness?: number;
  /** What the band is already playing, for the vertical rules. */
  accompaniment?: Accompaniment;
  /**
   * Which scale the melody draws on for a given chord. Supplied by the genre:
   * key-relative for iskelmä, chord-relative for jazz, drone-relative for
   * ambient. This one function is most of what makes the genres sound like
   * different music rather than the same music with different chords.
   */
  scaleForChord?: (tonic: Pc, mode: Mode, chord: Chord) => Scale;
  /** Rule table, already adjusted for the genre. Defaults to the base rules. */
  rules?: Rule[];
  /** Leap freedom of the instrument playing this line, 0..1. */
  agility?: number;
  /**
   * How much this line should repeat itself. Defaults to `through`, which is
   * neutral: no motif is favoured, no rhythm locked, no vocabulary narrowed.
   * See `generate/hook.ts`.
   */
  hook?: HookLevel;
}

interface BarMotif {
  cell: RhythmCell;
  /** Scale-step deltas between successive notes; first is relative to the previous bar's last note. */
  intervals: number[];
}

/**
 * Fallback when no genre rule is supplied: natural minor, switching to harmonic
 * minor the moment a dominant arrives.
 */
function defaultScaleForChord(tonic: Pc, mode: Mode, chord: Chord): Scale {
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
  /** Constraint context — everything below is what the rule engine needs. */
  prevPrev?: Midi;
  prevChord?: Chord;
  mode: Mode;
  tonic: Pc;
  duration: number;
  beat: number;
  accompaniment: Accompaniment;
  strictness: number;
  rules: Rule[];
  agility: number;
  /** How far to narrow the vocabulary, 0..1. */
  vocabulary: number;
  /** Pitch classes already sounded in this phrase, and how often. */
  phraseUse: Map<Pc, number>;
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
    // Repeating a note is the safest move available, so at high strictness —
    // where leaps are capped and beats want chord tones — it becomes the path
    // of least resistance and the tune stops moving. Make it progressively
    // less attractive as the other options narrow.
    //
    // Hook pushes back on exactly this term, and the two are arguing about
    // different things. Strictness suppresses repetition because a line that
    // stalls is a *symptom* of the filtering. A hook repeats a note because
    // repeating it is the idea.
    if (semis === 0) {
      w *= Math.max(0.15, 0.55 - args.strictness * 0.09) * (1 + args.vocabulary * 1.2);
    }
    // "Chord tone on the beat" and "move by step" pull against each other,
    // because adjacent chord tones are a third apart. As strictness rises the
    // vertical rules win by default and the line starts arpeggiating, so the
    // preference for steps has to rise with them.
    else if (semis <= 2) w *= 6.0 + args.strictness * 2.5;
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

    // Narrow the vocabulary: pull toward pitch classes the phrase has already
    // used. Six notes heard four times each are far more memorable than
    // twenty-four heard once, and the difference between a folk tune and an
    // exercise is mostly this.
    if (args.vocabulary > 0) {
      const heard = args.phraseUse.get(pc(cand)) ?? 0;
      w *= heard > 0 ? 1 + args.vocabulary * 1.6 : 1 - args.vocabulary * 0.45;
    }

    // Recover from a leap by stepping back the other way.
    if (Math.abs(prevInterval) > 4) {
      const sameDirection = Math.sign(cand - prev) === Math.sign(prevInterval);
      if (sameDirection) w *= 0.3;
      if (semis <= 2 && !sameDirection) w *= 2.4;
    }

    if (w > 0) scored.push([cand, w]);
  }

  if (!scored.length) return clampToRange(snapToScale(scale, prev), lo, hi);

  // Apply the constraint rules on top of the stylistic score. Vetoes can empty
  // the field entirely — a bar where every reachable note breaks something —
  // so relax one level at a time rather than failing. Music that obeys no rule
  // beats music that stops.
  for (let level = args.strictness; level >= 1; level--) {
    const allowed: (readonly [Midi, number])[] = [];
    for (const [cand, w] of scored) {
      const ctx: NoteContext = {
        candidate: cand,
        prev,
        chord,
        scale,
        mode: args.mode,
        tonic: args.tonic,
        strength,
        duration: args.duration,
        beat: args.beat,
        accompaniment: args.accompaniment,
        agility: args.agility,
        ...(args.prevPrev !== undefined ? { prevPrev: args.prevPrev } : {}),
        ...(args.prevChord !== undefined ? { prevChord: args.prevChord } : {}),
      };
      const verdict = evaluateRules(ctx, level, args.rules);
      if (!verdict.vetoed && verdict.weight > 0) allowed.push([cand, w * verdict.weight]);
    }
    if (allowed.length) return rng.weighted(allowed);
  }

  // Even the last resort must not hand back an augmented second or a tritone
  // leap. If level 1 forbade everything, take whichever candidate breaks the
  // fewest of those rules rather than ignoring them wholesale.
  if (args.strictness >= 1) {
    let best: Midi | undefined;
    let bestScore = Infinity;
    for (const [cand, w] of scored) {
      const ctx: NoteContext = {
        candidate: cand, prev, chord, scale,
        mode: args.mode, tonic: args.tonic, strength,
        duration: args.duration, beat: args.beat,
        accompaniment: args.accompaniment,
        agility: args.agility,
        ...(args.prevPrev !== undefined ? { prevPrev: args.prevPrev } : {}),
        ...(args.prevChord !== undefined ? { prevChord: args.prevChord } : {}),
      };
      const broken = evaluateRules(ctx, 1, args.rules).violations.length;
      const score = broken - w * 0.001; // weight only breaks ties
      if (score < bestScore) { bestScore = score; best = cand; }
    }
    if (best !== undefined) return best;
  }

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
  mode: Mode;
  tonic: Pc;
  prevPrev?: Midi;
  prevChord?: Chord;
  accompaniment: Accompaniment;
  strictness: number;
  rules: Rule[];
  agility: number;
  vocabulary: number;
  phraseUse: Map<Pc, number>;
}): { events: NoteEvent[]; last: Midi; lastInterval: number; motif: BarMotif } {
  const { cell, chord, scale, barStartBeat, slotsPerBar, range, rng, leap, arcAt, cadenceTarget } = args;
  const events: NoteEvent[] = [];
  const intervals: number[] = [];
  let prev = args.prev;
  let prevPrev = args.prevPrev;
  let prevChord = args.prevChord;
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
    const beat = barStartBeat + slot / SLOTS_PER_BEAT;

    let midi: Midi;
    if (isLastNote && cadenceTarget !== undefined) {
      midi = clampToRange(cadenceTarget, range[0], range[1]);
    } else {
      midi = choosePitch({
        scale, chord, prev, prevInterval, strength,
        targetHeight: arcAt(t),
        range, rng, leap,
        forceChordTone: strength >= 2 && dur >= SLOTS_PER_BEAT,
        mode: args.mode,
        tonic: args.tonic,
        duration: dur / SLOTS_PER_BEAT,
        beat,
        accompaniment: args.accompaniment,
        strictness: args.strictness,
        rules: args.rules,
        agility: args.agility,
        vocabulary: args.vocabulary,
        phraseUse: args.phraseUse,
        ...(prevPrev !== undefined ? { prevPrev } : {}),
        ...(prevChord !== undefined ? { prevChord } : {}),
      });
    }

    noteHeard(args.phraseUse, midi);

    // Record the motion as scale steps so the figure can be transposed later.
    intervals.push(scaleStepsBetween(scale, prev, midi));
    prevInterval = midi - prev;
    prevPrev = prev;
    prevChord = chord;
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
  phraseUse: Map<Pc, number>;
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
    noteHeard(args.phraseUse, midi);
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

/** Tally a sounded pitch class, for the vocabulary-narrowing weight. */
function noteHeard(use: Map<Pc, number>, midi: Midi): void {
  const p = pc(midi);
  use.set(p, (use.get(p) ?? 0) + 1);
}

function velocityFor(strength: number, rng: Rng): number {
  const base = 0.62 + strength * 0.075;
  return Math.max(0.3, Math.min(1, base + rng.float(-0.05, 0.05)));
}

/**
 * Second-pass repair.
 *
 * Two paths bypass `choosePitch` entirely: motif replay (which transposes a
 * stored shape wholesale) and cadence targets (which are placed by rule). Both
 * can land on something the constraints forbid, so sweep the finished line and
 * nudge offenders to the nearest note that fixes the problem.
 *
 * Repairs move a note as little as possible and never touch the last note of
 * the line, since that is the cadence the whole phrase was aiming at.
 */
function repairMelody(args: {
  notes: NoteEvent[];
  chordAtBeat: (beat: number) => Chord;
  scaleAtBeat: (beat: number) => Scale;
  mode: Mode;
  tonic: Pc;
  range: [Midi, Midi];
  slotsPerBar: number;
  beatsPerBar: number;
  accompaniment: Accompaniment;
  strictness: number;
  rules: Rule[];
  agility: number;
}): { notes: NoteEvent[]; repairs: number } {
  const { notes, chordAtBeat, scaleAtBeat, mode, tonic, range, beatsPerBar, accompaniment, strictness } = args;
  if (strictness < 1 || notes.length < 2) return { notes, repairs: 0 };

  const sorted = notes.slice().sort((a, b) => a.beat - b.beat);
  let repairs = 0;

  for (let i = 1; i < sorted.length - 1; i++) {
    const note = sorted[i]!;
    const chord = chordAtBeat(note.beat);
    const scale = scaleAtBeat(note.beat);
    const barStart = Math.floor(note.beat / beatsPerBar) * beatsPerBar;
    const slot = Math.round((note.beat - barStart) * SLOTS_PER_BEAT);

    const context = (candidate: Midi): NoteContext => ({
      candidate,
      prev: sorted[i - 1]!.midi,
      chord,
      scale,
      mode,
      tonic,
      strength: metricStrength(slot, args.slotsPerBar),
      duration: note.duration,
      beat: note.beat,
      accompaniment,
      agility: args.agility,
      ...(i >= 2 ? { prevPrev: sorted[i - 2]!.midi } : {}),
      ...(i >= 1 ? { prevChord: chordAtBeat(sorted[i - 1]!.beat) } : {}),
    });

    /**
     * Cost of placing `candidate` here: what it breaks looking backwards, plus
     * what it breaks at the join to the *next* note. Checking backwards alone
     * is how a fix for one interval quietly manufactures a tritone leap on the
     * other side — and counting only vetoes is how a repair trades a forbidden
     * note for three merely bad ones.
     */
    const cost = (candidate: Midi): number => {
      const here = evaluateRules(context(candidate), strictness, args.rules);
      let total = (here.vetoed ? 100 : 0) + here.violations.length;

      const next = sorted[i + 1];
      if (next) {
        const nextBarStart = Math.floor(next.beat / beatsPerBar) * beatsPerBar;
        const nextSlot = Math.round((next.beat - nextBarStart) * SLOTS_PER_BEAT);
        const after = evaluateRules({
          candidate: next.midi,
          prev: candidate,
          prevPrev: note.midi,
          prevChord: chord,
          chord: chordAtBeat(next.beat),
          scale: scaleAtBeat(next.beat),
          mode, tonic,
          strength: metricStrength(nextSlot, args.slotsPerBar),
          duration: next.duration,
          beat: next.beat,
          accompaniment,
          agility: args.agility,
        }, strictness, args.rules);
        total += (after.vetoed ? 100 : 0) + after.violations.length;
      }
      return total;
    };

    const currentCost = cost(note.midi);
    if (currentCost < 100) continue; // nothing forbidden here; leave it alone

    // Search outward for the closest strictly better replacement.
    let replacement: Midi | undefined;
    let bestCost = currentCost;
    for (let step = 1; step <= 4; step++) {
      for (const dir of [-1, 1]) {
        const cand = clampToRange(stepInScale(scale, note.midi, step * dir), range[0], range[1]);
        if (cand === note.midi) continue;
        const c = cost(cand);
        if (c < bestCost) { bestCost = c; replacement = cand; }
      }
      if (replacement !== undefined && bestCost < 100) break;
    }
    if (replacement !== undefined) {
      sorted[i] = { ...note, midi: replacement };
      repairs++;
    }
  }
  return { notes: sorted, repairs };
}

export function generateMelody(opts: MelodyOptions): NoteEvent[] {
  const { chords, beatsPerBar, style, rng, tonic, mode, range, startBeat } = opts;
  const slotsPerBar = beatsPerBar * SLOTS_PER_BEAT;
  const bars = chords.length;
  const phraseBars = bars >= 8 ? 4 : Math.max(2, bars);
  // Instruments that leap badly should also *want* to leap less, not merely be
  // vetoed after the fact — filtering alone leaves the line fighting itself.
  const leap = style.melody.leap * opts.leapScale * (opts.soloistic ? 1.25 : 1)
    * (0.35 + (opts.agility ?? 0.7) * 1.05);
  const ornament = style.melody.ornament * opts.ornamentScale * (opts.soloistic ? 1.5 : 1);

  const baseScale = makeScale(tonic, mode === 'minor' ? 'minor' : 'major');
  const centre = (range[0] + range[1]) / 2;
  const out: NoteEvent[] = [];

  const strictness = opts.strictness ?? 2;
  const hook = opts.hook ?? getHook('through');
  const sequenceChance = Math.min(0.95, style.melody.sequence * hook.sequence);
  const accompaniment = opts.accompaniment ?? EMPTY_ACCOMPANIMENT;
  const scaleForChord = opts.scaleForChord ?? defaultScaleForChord;
  const rules = opts.rules ?? RULES;
  const agility = opts.agility ?? 0.7;
  const barOf = (beat: number) =>
    Math.min(bars - 1, Math.max(0, Math.floor((beat - startBeat) / beatsPerBar)));
  const chordAtBeat = (beat: number) => chords[barOf(beat)]!;
  const scaleAtBeat = (beat: number) => scaleForChord(tonic, mode, chordAtBeat(beat));

  let prev = clampToRange(snapToScale(baseScale, Math.round(centre)), range[0], range[1]);
  let prevPrev: Midi | undefined;
  let prevChord: Chord | undefined;
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

    // The vocabulary is counted per phrase, not per song: a hook is a small set
    // of notes turned over inside one breath, and a tally that ran the whole
    // way through would just converge on the scale.
    const phraseUse = new Map<Pc, number>();

    // Rhythm lock: one cell for every non-cadential bar of the phrase, so the
    // shape stays recognisable even as the pitches move under it.
    const lockedCell = rng.chance(hook.rhythmLock)
      ? pickCell(rng, style.melodyCells, slotsPerBar)
      : undefined;

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

      // Bar 3 restates the opening figure by default. A hook may also restate
      // it at bar 2, which is a different rhetorical move: waiting until bar 3
      // reads as development, answering immediately reads as a refrain.
      const restateBar = b === 2 || (hook.earlyRestate && b === 1);
      const useSequence =
        restateBar && !isCadenceBar && motifA !== undefined && rng.chance(sequenceChance);

      if (useSequence && motifA) {
        // Classic sequence: restate the opening figure a step or third lower.
        // Verbatim restatement is the *least* likely outcome by default, which
        // is right for art music and wrong for a hook — so hook is what buys
        // the unchanged repeat its weight.
        const shift = rng.weighted([
          [-1, 4], [-2, 3], [1, 2], [0, 1 + hook.exactRepeat * 12],
        ] as const);
        const r = renderMotif({
          motif: motifA, chord, scale, prev, barStartBeat, slotsPerBar, range, rng, shift,
          phraseUse,
          ...(cadenceTarget !== undefined ? { cadenceTarget } : {}),
        });
        out.push(...r.events);
        if (r.events.length >= 2) prevPrev = r.events[r.events.length - 2]!.midi;
        prev = r.last;
        prevChord = chord;
        prevInterval = r.lastInterval;
      } else {
        const cell = isCadenceBar
          ? pickCell(rng, style.cadenceCells, slotsPerBar)
          : lockedCell ?? pickCell(rng, style.melodyCells, slotsPerBar);
        const r = renderBar({
          cell, chord, scale, prev, prevInterval, barStartBeat, slotsPerBar, range, rng,
          leap, ornament, arcAt: arcFor(b),
          mode, tonic, accompaniment, strictness, rules, agility,
          vocabulary: hook.vocabulary, phraseUse,
          ...(prevPrev !== undefined ? { prevPrev } : {}),
          ...(prevChord !== undefined ? { prevChord } : {}),
          ...(cadenceTarget !== undefined ? { cadenceTarget } : {}),
        });
        out.push(...r.events);
        if (r.events.length >= 2) prevPrev = r.events[r.events.length - 2]!.midi;
        prev = r.last;
        prevChord = chord;
        prevInterval = r.lastInterval;
        if (b === 0) motifA = r.motif;
      }
    }
  }

  // Motif replay and cadence targets never pass through choosePitch, so sweep
  // the finished line for anything they introduced.
  return repairMelody({
    notes: out,
    chordAtBeat,
    scaleAtBeat,
    mode,
    tonic,
    range,
    slotsPerBar,
    beatsPerBar,
    accompaniment,
    strictness,
    rules,
    agility,
  }).notes;
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
