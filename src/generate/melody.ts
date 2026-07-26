/**
 * Pitch realisation, over a rhythm that has already been decided.
 *
 * The order matters and it is the opposite of the obvious one. Rhythm is
 * planned first, for the whole phrase, in `generate/rhythm.ts`; this file only
 * decides *which notes* go on the onsets it is handed. Identity lives in the
 * rhythm — a tune hummed at the wrong pitches is still the tune — so the
 * rhythm is the thing that has to be composed rather than sampled, and pitch
 * is the layer that can afford to negotiate with the constraint rules.
 *
 * What this file still owns:
 *  - Chord tones on strong beats, passing and neighbour tones on weak ones.
 *  - Stepwise motion dominates; a leap is answered by a step the other way.
 *  - Phrases arc: they rise to a peak around two-thirds through, then fall.
 *  - Antecedent phrases stop on 5̂ or 2̂ (open); consequents land on 1̂ (closed).
 *  - A restated bar replays the *shape* of the bar it restates, transposed
 *    through the scale — a diatonic sequence rather than a fresh invention.
 */

import type { Chord } from '../core/chord.js';
import { chordPcs } from '../core/chord.js';
import type { Midi, Pc } from '../core/pitch.js';
import { clampToRange, pc } from '../core/pitch.js';
import type { Mode, Scale } from '../core/scale.js';
import { makeScale, scaleStepsBetween, snapToScale, stepInScale } from '../core/scale.js';
import type { Rng } from '../core/rng.js';
import type { NoteEvent } from '../core/types.js';
import type { Style } from '../style/types.js';
import {
  buildAccompaniment, comfortableLeap, EMPTY_ACCOMPANIMENT,
  evaluate as evaluateRules, RULES,
  type Accompaniment, type NoteContext, type Rule,
} from './constraints.js';
import { getHook, type HookLevel } from './hook.js';
import type { Motto } from './motto.js';
import {
  metricStrength, planPhraseRhythm, SLOTS_PER_BEAT, trimOverlaps,
  type PhrasePlan,
} from './rhythm.js';

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
  /**
   * The song's own figure — rhythm and shape. Phrases are built from it in
   * proportion to `hook.mottoAdherence`. See `generate/motto.ts`.
   */
  motto?: Motto;
}

/**
 * Fallback when no genre rule is supplied: natural minor, switching to harmonic
 * minor the moment a dominant arrives.
 */
function defaultScaleForChord(tonic: Pc, mode: Mode, chord: Chord): Scale {
  if (mode === 'minor' && chord.dominantFunction) return makeScale(tonic, 'harmonicMinor');
  return makeScale(tonic, mode === 'minor' ? 'minor' : 'major');
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

  /**
   * How far this line can reach at all.
   *
   * Weighting a leap down makes it rare; it does not make it impossible, and
   * across a few hundred bars "rare" still means a trombone eventually plays an
   * octave leap. Reach is a physical property of the instrument, so it belongs
   * in the candidate set rather than in the scoring — the note is not unlikely,
   * it is unavailable.
   *
   * Strictness widens the allowance at the loose end, which is what keeps it a
   * real axis: at `free` a player is allowed to overreach, and overreaching is
   * a large part of what raw playing sounds like.
   */
  const reach = comfortableLeap(args.agility) + Math.max(0, 3 - args.strictness);

  for (const cand of new Set(candidates)) {
    const isChordTone = tones.has(pc(cand));
    if (wantChordTone && !isChordTone && strength >= 3) continue; // downbeats are non-negotiable
    if (Math.abs(cand - prev) > reach) continue;

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
    // Wide motion is suppressed by *taste*, not by law, so how hard depends on
    // the setting. At `free` the line is allowed to lunge — that is what the
    // bottom of the axis is for, and a `free` that merely declines to veto
    // while still weighting leaps into near-extinction is not free of anything.
    else if (semis <= 7) w *= 0.3 * (1 + (4 - args.strictness) * 0.55);
    else w *= 0.06 * (1 + (4 - args.strictness) * 0.9);

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
 * The widest interval a line should take, given who is playing and how hard the
 * voice leading is being policed.
 *
 * Two ceilings, and the lower wins. The player's reach is physical and comes
 * from `comfortableLeap`; the stylistic one mirrors the rule table, where
 * `wide-leap` forbids anything beyond a fourth at `strict` and
 * `leap-beyond-third` narrows that again at `polished`. Keeping the numbers in
 * step with the rules is what makes the paths that skip the rules — motif
 * transposition, cadence placement, repair — behave like the paths that do not.
 */
function melodicReach(agility: number, strictness: number): number {
  const physical = comfortableLeap(agility) + Math.max(0, 3 - strictness);
  const stylistic = strictness >= 4 ? 4 : strictness >= 3 ? 5 : strictness >= 2 ? 7 : 99;
  return Math.min(physical, stylistic);
}

/**
 * The chord tone nearest `midi`, within `maxMove` semitones and inside the
 * range. Undefined when the harmony has nothing that close — in which case the
 * shape keeps its note, since dragging it a third to reach a chord tone would
 * destroy the figure to fix a passing dissonance.
 */
function nearestChordTone(
  chord: Chord, midi: Midi, maxMove: number, [lo, hi]: [Midi, Midi], avoid?: Midi,
): Midi | undefined {
  const tones = chordPcs(chord);
  let best: Midi | undefined;
  let bestDist = Infinity;
  for (let d = -maxMove; d <= maxMove; d++) {
    const cand = midi + d;
    if (cand < lo || cand > hi) continue;
    if (cand === avoid) continue;
    if (!tones.includes(pc(cand))) continue;
    if (Math.abs(d) < bestDist) { bestDist = Math.abs(d); best = cand; }
  }
  return best;
}

/**
 * Step through the scale, turning back rather than wrapping when the range ends.
 *
 * `clampToRange` preserves the pitch class by moving whole octaves, which is
 * right for placing an isolated note and wrong in the middle of a figure: a
 * sequence that walks into the ceiling comes back an octave lower, and the
 * listener hears a twelve-semitone leap in the middle of a stepwise idea. It is
 * the fault that made a trombone reach as far as a vibraphone despite every
 * agility rule pointing the other way.
 *
 * Reflecting instead keeps the *size* of the motion, which is what the shape is
 * made of, and only reverses its direction — which is what a composer does when
 * a sequence runs out of room.
 */
function stepWithin(
  scale: Scale, prev: Midi, step: number, [lo, hi]: [Midi, Midi], reach: number,
): Midi {
  const ok = (m: Midi) => m >= lo && m <= hi && Math.abs(m - prev) <= reach;
  // Shrink the step until it is both inside the range and inside the player's
  // reach, trying each size in both directions before giving up a semitone of
  // it. A sequence narrowed by a scale step is still the same figure; one that
  // jumps an octave to stay in range is not.
  for (let mag = Math.abs(step); mag >= 0; mag--) {
    const signed = mag * Math.sign(step || 1);
    const forward = stepInScale(scale, prev, signed);
    if (ok(forward)) return forward;
    const back = stepInScale(scale, prev, -signed);
    if (ok(back)) return back;
  }
  return clampToRange(stepInScale(scale, prev, step), lo, hi);
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

    /**
     * Search outward for the closest strictly better replacement.
     *
     * Bounded by the player's reach on *both* sides. A repair that fixes one
     * forbidden interval by manufacturing an octave leap into or out of the
     * note has not repaired anything — and because the cost function only
     * counts violations, a wide leap that clears a veto could genuinely win.
     */
    const reach = melodicReach(args.agility, strictness);
    const prevMidi = sorted[i - 1]!.midi;
    const nextMidi = sorted[i + 1]?.midi;
    let replacement: Midi | undefined;
    let bestCost = currentCost;
    for (let step = 1; step <= 4; step++) {
      for (const dir of [-1, 1]) {
        const cand = clampToRange(stepInScale(scale, note.midi, step * dir), range[0], range[1]);
        if (cand === note.midi) continue;
        if (Math.abs(cand - prevMidi) > reach) continue;
        if (nextMidi !== undefined && Math.abs(nextMidi - cand) > reach) continue;
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


/**
 * Realise one phrase: walk its planned onsets and put a pitch on each.
 *
 * Two paths through the loop, and the split is the whole reason melodies made
 * this way sound composed rather than sampled:
 *
 *  - a bar that **restates** an earlier bar replays that bar's interval shape,
 *    transposed through the scale. The figure survives the harmony changing
 *    underneath it, which is what a sequence is.
 *  - every other note is chosen freshly against the chord, the arc and the
 *    constraint rules.
 *
 * The cadence note is placed by rule rather than chosen, because a phrase
 * ending is a destination the whole arc was aiming at, not an outcome.
 */
function renderPhrase(args: {
  plan: PhrasePlan;
  phraseStartBeat: number;
  slotsPerBar: number;
  beatsPerBar: number;
  chordAtBar: (barInPhrase: number) => Chord;
  scaleFor: (chord: Chord) => Scale;
  baseScale: Scale;
  prev: Midi;
  prevInterval: number;
  prevPrev?: Midi;
  prevChord?: Chord;
  range: [Midi, Midi];
  rng: Rng;
  leap: number;
  arc: (posInPhrase: number) => number;
  /** Scale degrees the phrase may close on. The pitch is chosen at the
   *  cadence itself, not in advance — see below. */
  cadenceDegrees: number[];
  mode: Mode;
  tonic: Pc;
  accompaniment: Accompaniment;
  strictness: number;
  rules: Rule[];
  agility: number;
  hook: HookLevel;
  /**
   * Widest interval a restated figure may use.
   *
   * Restatements never pass through `choosePitch`, so the rule table never sees
   * them — which meant a sequence could leap however far it liked no matter how
   * high smoothness was set, and `strict` measured no smoother than `free`.
   * This is the rule table's melodic ceiling expressed as a number the
   * transposition path can honour directly.
   */
  reach: number;
  phraseUse: Map<Pc, number>;
  /** Total sixteenths the phrase spans, for the arc. */
  phraseSlots: number;
  /**
   * The motto's shape, when this phrase was built on the motto. Seeds bar 0 so
   * the quotation carries its contour and not merely its rhythm.
   */
  mottoContour?: number[];
}): { events: NoteEvent[]; last: Midi; lastInterval: number } {
  const {
    plan, phraseStartBeat, slotsPerBar, chordAtBar, scaleFor, baseScale,
    range, rng, leap, arc, cadenceDegrees, hook, phraseUse, phraseSlots,
  } = args;

  const events: NoteEvent[] = [];
  let prev = args.prev;
  let prevPrev = args.prevPrev;
  let prevChord = args.prevChord;
  let prevInterval = args.prevInterval;

  /**
   * Interval shape of each bar as it is realised, so a later bar can restate
   * it. Stored as scale steps rather than semitones: that is what lets the
   * figure be replayed over a different chord and still fit.
   */
  const shapes = new Map<number, number[]>();
  const lastIdx = plan.notes.length - 1;

  /**
   * When the phrase quotes the motto, bar 0 *is* the motto: its shape is known
   * before a note is chosen, so it is installed rather than invented. Every
   * later restatement in the phrase then sequences off it as usual, which is
   * how one figure ends up owning a whole phrase.
   */
  if (plan.fromMotto && args.mottoContour) {
    shapes.set(0, args.mottoContour.slice());
    plan.restates[0] = 0;
  }

  for (let i = 0; i < plan.notes.length; i++) {
    const note = plan.notes[i]!;
    const barInPhrase = Math.max(0, note.bar);
    const chord = chordAtBar(barInPhrase);
    const scale = scaleFor(chord);
    const beat = phraseStartBeat + note.slot / SLOTS_PER_BEAT;
    const duration = note.dur / SLOTS_PER_BEAT;

    let midi: Midi;
    const model = plan.restates[barInPhrase] ?? -1;
    const shape = model >= 0 ? shapes.get(model) : undefined;
    const step = shape?.[note.pos];

    if (i === lastIdx) {
      /**
       * The cadence pitch is decided *here*, against the note actually before
       * it, rather than once at the top of the phrase. Choosing it in advance
       * anchors it to whatever the previous phrase happened to end on, and the
       * approach into it then becomes whatever interval falls out — which is
       * how a trombone ended up leaping an octave into its own cadence while
       * every agility rule pointed the other way. A cadence is an arrival, and
       * an arrival is defined by the step that reaches it.
       */
      midi = clampToRange(
        nearestDegree(baseScale, rng.pick(cadenceDegrees), prev), range[0], range[1],
      );
    } else if (step !== undefined) {
      /**
       * Restatement. The first note of the restated bar is displaced by a
       * sequence interval — verbatim is the *least* likely outcome by default,
       * which is right for art music and wrong for a hook, so `hook` is what
       * buys the unchanged repeat its weight.
       */
      if (note.pos === 0) {
        // Bar 0 of a motto phrase is the statement, not a restatement of it, so
        // it arrives where the arc wants rather than a sequence step away.
        const shift = barInPhrase === 0 && model === 0
          ? 0
          : rng.weighted([
            [-1, 4], [-2, 3], [1, 2], [0, 1 + hook.exactRepeat * 12],
          ] as const);
        midi = stepWithin(scale, prev, shift, range, args.reach);
      } else {
        midi = stepWithin(scale, prev, step, range, args.reach);
      }
      /**
       * A sequence has to bend to the changes.
       *
       * Replaying a stored shape through the scale keeps the figure recognisable
       * and says nothing at all about the chord underneath it, so a motto
       * arriving over new harmony lands wherever the arithmetic puts it. That is
       * how a tune ends up sounding *nearly* right — the shape is familiar and
       * the note is sour, which is worse than either alone. Pulling a strong-beat
       * note onto the nearest chord tone within a step costs the shape almost
       * nothing and is exactly what a player does when sequencing a lick through
       * changes.
       */
      if (note.strength >= 3 && !chordPcs(chord).includes(pc(midi))) {
        // Never snap onto the note just played: trading a passing dissonance
        // for a stalled line is not an improvement.
        const fixed = nearestChordTone(chord, midi, 2, range, prev);
        if (fixed !== undefined) midi = fixed;
      }
    } else {
      midi = choosePitch({
        scale, chord, prev, prevInterval,
        strength: note.strength,
        targetHeight: arc(phraseSlots > 0 ? (note.slot + slotsPerBar) / (phraseSlots + slotsPerBar) : 0),
        range, rng, leap,
        forceChordTone: note.strength >= 2 && note.dur >= SLOTS_PER_BEAT,
        mode: args.mode,
        tonic: args.tonic,
        duration,
        beat,
        accompaniment: args.accompaniment,
        strictness: args.strictness,
        rules: args.rules,
        agility: args.agility,
        vocabulary: hook.vocabulary,
        phraseUse,
        ...(prevPrev !== undefined ? { prevPrev } : {}),
        ...(prevChord !== undefined ? { prevChord } : {}),
      });
    }

    noteHeard(phraseUse, midi);
    if (note.bar >= 0) {
      const arr = shapes.get(note.bar) ?? [];
      arr[note.pos] = scaleStepsBetween(scale, prev, midi);
      shapes.set(note.bar, arr);
    }

    prevInterval = midi - prev;
    prevPrev = prev;
    prevChord = chord;
    prev = midi;

    events.push({
      beat,
      duration,
      midi,
      velocity: velocityFor(note.strength, rng),
    });
  }

  return { events, last: prev, lastInterval: prevInterval };
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

  const baseScale = makeScale(tonic, mode === 'minor' ? 'minor' : 'major');
  const centre = (range[0] + range[1]) / 2;
  const out: NoteEvent[] = [];

  const strictness = opts.strictness ?? 2;
  const hook = opts.hook ?? getHook('through');
  const accompaniment = opts.accompaniment ?? EMPTY_ACCOMPANIMENT;
  const scaleForChord = opts.scaleForChord ?? defaultScaleForChord;
  const rules = opts.rules ?? RULES;
  const agility = opts.agility ?? 0.7;

  /**
   * Appetite for gestures that cross the barline.
   *
   * Drawn from the style's own sequence/ornament character and pushed by the
   * mood, then damped at the top of the smoothness range — "polished" is
   * supposed to be tamer, and squarer placement is part of what tamer means.
   * It is deliberately *not* driven by smoothness alone: a syncopation is a
   * choice being made, not a fault being tolerated.
   */
  const syncopation = clamp(
    (style.melody.syncopation ?? 0.3) * opts.ornamentScale * (opts.soloistic ? 1.2 : 1)
      * (strictness >= 4 ? 0.5 : 1),
    0, 0.85,
  );

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
    const arc = (pos: number) => {
      const shape = pos <= peak ? pos / peak : 1 - (pos - peak) / Math.max(0.001, 1 - peak);
      return phraseBase + lift * shape;
    };

    // The vocabulary is counted per phrase, not per song: a hook is a small set
    // of notes turned over inside one breath, and a tally that ran the whole
    // way through would just converge on the scale.
    const phraseUse = new Map<Pc, number>();

    /**
     * Rhythm before pitch. The phrase's onsets — including its pickup and any
     * note tied across a barline — are all decided here, before a single note
     * is chosen. See `generate/rhythm.ts`.
     */
    const plan = planPhraseRhythm({
      bars: thisPhraseBars,
      slotsPerBar,
      cells: style.melodyCells,
      cadenceCells: style.cadenceCells,
      rng,
      hook,
      syncopation,
      /**
       * A pickup into the first phrase of a section lands *before* the section
       * starts, in the bar the previous section is still playing. That is not
       * a bug — it is the most characteristic entrance in this music, and it is
       * exactly how a singer comes in. `song.ts` trims the whole melody layer
       * for overlaps once the sections are concatenated, which is what makes it
       * safe to write across the seam.
       */
      allowAnacrusis: true,
      ...(opts.motto ? { motto: opts.motto.cell } : {}),
    });
    if (!plan.notes.length) continue;

    // Antecedent stays open on 5̂ or 2̂; consequent closes on 1̂ (or 3̂).
    const cadenceDegrees = isConsequent ? [0, 0, 0, 2] : [4, 4, 1, 2];

    const r = renderPhrase({
      plan,
      phraseStartBeat: startBeat + phraseStart * beatsPerBar,
      slotsPerBar,
      beatsPerBar,
      chordAtBar: (b) => chords[Math.min(bars - 1, phraseStart + b)]!,
      scaleFor: (c) => scaleForChord(tonic, mode, c),
      baseScale,
      prev,
      prevInterval,
      range,
      rng,
      leap,
      arc,
      cadenceDegrees,
      mode,
      tonic,
      accompaniment,
      strictness,
      rules,
      agility,
      hook,
      reach: melodicReach(agility, strictness),
      phraseUse,
      phraseSlots: thisPhraseBars * slotsPerBar,
      ...(opts.motto ? { mottoContour: opts.motto.contour } : {}),
      ...(prevPrev !== undefined ? { prevPrev } : {}),
      ...(prevChord !== undefined ? { prevChord } : {}),
    });

    out.push(...r.events);
    if (r.events.length >= 2) prevPrev = r.events[r.events.length - 2]!.midi;
    prev = r.last;
    prevInterval = r.lastInterval;
    prevChord = chords[Math.min(bars - 1, phraseStart + thisPhraseBars - 1)]!;
  }

  /**
   * Two repairs, in this order.
   *
   * `trimOverlaps` first, because the rhythm plan deliberately produces notes
   * that run past their own bar — a tie, a push, a pickup landing inside the
   * previous phrase's cadence — and a monophonic line cannot sound two notes at
   * once. Trimming keeps the onset, which is what the ear timed.
   *
   * `repairMelody` second, because restated figures and cadence targets never
   * pass through `choosePitch` and can land on something the rules forbid.
   */
  const trimmed = trimOverlaps(out);
  return repairMelody({
    notes: trimmed,
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

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
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
