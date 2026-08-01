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
  comfortableLeap, evaluate as evaluateRules,
  type Accompaniment, type NoteContext, type Rule,
} from '../core/rules.js';
import type { NoteEvent } from '../core/types.js';
import type { Idiom, Motif, Skeleton } from './types.js';

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
  /** What the player actually plays. See `types.ts`. */
  idiom: Idiom;
  /** Pitch the previous phrase ended on, so the join is inside reach too. */
  prev?: Midi;
  rng: Rng;
}

export function realisePhrase(opts: SurfaceOptions): NoteEvent[] {
  const { figure, skeleton, bars, slotsPerBar, range } = opts;
  const phraseSlots = bars * slotsPerBar;
  const onsets = figure.gesture.onsets.filter((o) => o.at < phraseSlots);
  if (!onsets.length || !skeleton.targets.length) return [];

  const midis = walk(opts, onsets, phraseSlots);
  capLeaps(opts, midis);
  resolveDissonances(opts, onsets, midis, phraseSlots);
  applyRules(opts, onsets, midis, phraseSlots);
  // Again, because both passes above move notes to fix one fault and can commit
  // another doing it. Cheap, and a no-op whenever they behaved.
  capLeaps(opts, midis);

  return onsets.map((onset, i) => ({
    beat: opts.startBeat + onset.at / SLOTS_PER_BEAT,
    duration: sounding(Math.max(1, onset.dur) / SLOTS_PER_BEAT, opts.idiom.detache),
    midi: clampToRange(midis[i]!, range[0], range[1]),
    velocity: 0.5 + onset.accent * 0.4,
  }));
}

/**
 * How long the note actually sounds, given how this player stops it.
 *
 * A figure advances its cursor by exactly the duration it wrote, so a written
 * duration *is* the distance to the next onset and every note runs into its
 * successor. That is not legato, which is a choice; it is the absence of any
 * articulation at all, and it is what made 77% of the melody notes in the
 * catalogue — 91% on synth — begin at the exact instant the one before them ended.
 * Attacks are most of what tells a listener which instrument is playing, and an
 * attack with no silence in front of it is not heard as an attack.
 *
 * **The gap is a duration, not a proportion.** Stopping a note takes about as long
 * whatever the note was: a tongue interrupts a reed in the same few milliseconds
 * whether it is ending a semiquaver or a semibreve. Taken as a percentage instead,
 * a held note would give back a beat of silence and stop being a held note, which
 * is exactly the fault that makes sampled brass sound like a machine gun and
 * sampled strings sound like a church organ with hiccups.
 *
 * Bounded at half the note, so a sixteenth stays a note rather than becoming a
 * click, and floored at the renderer's own audibility limit.
 */
function sounding(beats: number, detache: number): number {
  const MIN_AUDIBLE = 1 / SLOTS_PER_BEAT / 2;
  const gap = Math.min(detache, beats / 2);
  return Math.max(MIN_AUDIBLE, beats - gap);
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
    const fitted = fitSegment(steps, required, melodicReach(opts.agility, opts.strictness));

    let cursor = midis[from]!;
    for (let i = from + 1; i < to; i++) {
      const step = fitted[i - from - 1] ?? 0;
      cursor = reflect(stepInScale(scaleFor(i), cursor, step), lo, hi);
      midis[i] = unstall(snapToSubset(scaleFor(i), opts.subset, cursor), midis[i - 1]!, step, scaleFor(i), lo, hi);
    }
  }

  // Past the last anchor — a tail the figure has that the backbone did not reach.
  const last = anchors[anchors.length - 1]!;
  let cursor = midis[last]!;
  for (let i = last + 1; i < onsets.length; i++) {
    const step = figure.contour[i] ?? 0;
    cursor = reflect(stepInScale(scaleFor(i), cursor, step), lo, hi);
    midis[i] = unstall(snapToSubset(scaleFor(i), opts.subset, cursor), midis[i - 1]!, step, scaleFor(i), lo, hi);
  }

  void phraseSlots;
  return midis;
}

/**
 * The widest interval this line may take, in semitones.
 *
 * Two ceilings and the lower wins. The player's reach is physical and comes from
 * `comfortableLeap`; the stylistic one mirrors the rule table, where `wide-leap`
 * forbids anything beyond a fourth at `strict` and `leap-beyond-third` narrows it
 * again at `polished`. Keeping the number in step with the rules is what makes the
 * paths that never consult them — a transposed backbone, a bent approach — behave
 * like the path that does. Without it, smoothness measured no smoother than free.
 */
export function melodicReach(agility: number, strictness: number): number {
  const physical = comfortableLeap(agility) + Math.max(0, 3 - strictness);
  const stylistic = strictness >= 4 ? 4 : strictness >= 3 ? 5 : strictness >= 2 ? 7 : 99;
  // The stylistic ceiling is widened by the player's own reach rather than applied
  // flat. Flat, it swallows the instrument entirely: at `standard` every line was
  // capped at a fifth, so a vibraphone measured exactly as stiff as a trombone and
  // "instrument-aware" meant nothing above the loosest setting. Taste narrows what a
  // player would do; it does not make them all the same player.
  //
  // The allowance shrinks at the top of the range, and without that the top of the
  // range does not exist. Taste tightens the ceiling by one semitone going from
  // `strict` to `polished` (5 to 4) and then hands back the same four or five it
  // handed back before, so the two settings came out a semitone apart on paper and
  // indistinguishable in the notes — iskelmä measured 17.77% of intervals wider than
  // a major third at `strict` and 17.55% at `polished`, an ordering held by two
  // tenths of a point. A setting that promises smoothness has to spend the
  // instrument's licence as well as its own.
  const licence = strictness >= 4 ? 2 : 5;
  return Math.min(physical, stylistic + Math.round(agility * licence));
}

/**
 * A note the figure said moved must actually move.
 *
 * Everything that narrows a line can collapse a step into a unison: a tightened
 * approach, a subset snap, a reflection off the top of the range. Each is right on
 * its own and together they stall the tune — measured on synth, repeated notes rose
 * from 24% at `strict` to 32% at `polished`, so the line was not getting smoother, it
 * was getting stuck. The old engine knew this ("repeating a note is the safest move
 * available, so at high strictness it becomes the path of least resistance and the
 * tune stops moving") and fought it with a weight. Here the figure has already said
 * whether this note moves, so there is nothing to weigh: if it said so, it moves.
 */
function unstall(
  midi: Midi, prev: Midi, step: number, scale: Scale, lo: Midi, hi: Midi,
): Midi {
  if (step === 0 || midi !== prev) return midi;
  for (const dir of [Math.sign(step), -Math.sign(step)]) {
    const cand = stepInScale(scale, prev, dir);
    if (cand !== prev && cand >= lo && cand <= hi) return cand;
  }
  return midi;
}

/**
 * Bring any interval back inside what the player can reach.
 *
 * A last resort rather than a policy: the skeleton already refuses anchors beyond
 * reach, and `fitSegment` bounds the approach. What this catches is the compound
 * case — a bent approach into a transposed anchor over a reflected range — where
 * three reasonable decisions add up to an octave. A trombone that leaps a tenth once
 * every few hundred bars is still a trombone that cannot.
 */
function capLeaps(opts: SurfaceOptions, midis: Midi[]): void {
  const reach = melodicReach(opts.agility, opts.strictness);
  // The join into the phrase counts. Realising phrases independently let a line
  // leap a tenth across a phrase boundary while every interval inside both phrases
  // was inside reach — which is how a trombone reached as far as a vibraphone.
  const from = opts.prev !== undefined ? 0 : 1;
  for (let i = from; i < midis.length; i++) {
    const before = i === 0 ? opts.prev! : midis[i - 1]!;
    const gap = midis[i]! - before;
    if (Math.abs(gap) <= reach) continue;
    /**
     * The nearest scale tone *at or inside* the limit.
     *
     * `snapToScale` alone leaks: it moves to the nearest scale tone in either
     * direction, which can put the note back outside the reach it was just pulled
     * inside — measured as a trombone still reaching eleven semitones with a
     * seven-semitone cap in force. Walking inward guarantees the bound.
     */
    const limit = before + Math.sign(gap) * reach;
    let landed = clampToRange(limit, opts.range[0], opts.range[1]);
    for (let k = 0; k <= reach; k++) {
      const cand = limit - Math.sign(gap) * k;
      if (cand < opts.range[0] || cand > opts.range[1]) continue;
      if (opts.baseScale.pcs.includes(pc(cand))) { landed = cand; break; }
    }
    midis[i] = landed;
  }
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
export function fitSegment(
  steps: number[], required: number, reachSemis: number, strictness = 2,
): number[] {
  if (!steps.length) return steps;
  const out = steps.slice();
  /**
   * The approach ceiling, in scale steps — which is what a contour is made of.
   *
   * Deriving it as `3 + agility * 3` read as semitones and spent as steps, so a
   * default instrument's approach into an anchor could be five scale steps, an
   * octave, and two thirds of every interval in a jazz line came out wider than a
   * major third. Halving the semitone reach is the honest conversion: a scale step
   * is a tone, give or take.
   *
   * Tightened at the top of the smoothness range, and the *approach* is the right
   * place to tighten. Narrowing the figure's interior instead — the obvious move,
   * since "chord tone on the beat" and "move by step" pull against each other as
   * strictness rises — makes it worse: a shorter interior leaves more distance for
   * the approach to cover, so every phrase ends with a bigger leap than it began
   * with. Measured on synth, that made `polished` leapier than `strict`. Capping the
   * approach spills the distance backwards into the body instead, which spreads the
   * motion rather than concentrating it.
   */
  const reach = strictness >= 4
    ? 2
    : strictness >= 3 ? 3 : Math.max(2, Math.floor(reachSemis / 2));

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
      // No interior step may grow past the ceiling the approach is held to. Left
      // unbounded, tightening the approach made things worse rather than better: the
      // distance the approach could no longer cover was pushed into the body, four
      // passes deep, so a stepwise figure came out full of fifths. Tightening a cap
      // must not have a leak behind it.
      const grown = out[i]! + dir;
      if (Math.abs(grown) > reach) continue;
      // A step the figure meant may shrink; it may not vanish. Letting it cross
      // zero is how a tightened cap makes a line stall — see `unstall` below.
      if (grown === 0 && out[i] !== 0) continue;
      out[i] = grown;
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
    /**
     * Moving the resolution must not strand the note after it.
     *
     * The note being resolved onto is often the one that has to reach the next
     * anchor, and pulling it a step closer can leave that reach unplayable —
     * measured as a trombone leaping an octave into a cadence, where every
     * individual decision was reasonable and the third one paid for the first two.
     */
    const after = midis[i + 2];
    const reach = melodicReach(opts.agility, opts.strictness);
    const safe = after === undefined || Math.abs(after - cand) <= reach;
    if (safe && !anchorSlots.has(onsets[i + 1]!.at) && cand >= lo && cand <= hi) {
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

    /**
     * Search outward for the nearest note that is not forbidden, bounded by the
     * player's reach on *both* sides. Failing that, leave it: music that breaks a
     * rule beats music that stops.
     *
     * The bound is not decoration. A repair that clears a veto by manufacturing an
     * octave leap into or out of the note has not repaired anything, and because
     * higher strictness means more repairs it is how `polished` ended up measuring
     * *leapier* than `strict` — the axis fixing one fault by committing another.
     */
    const reach = melodicReach(opts.agility, opts.strictness);
    const prevMidi = midis[i - 1]!;
    const nextMidi = midis[i + 1];
    const widest = (c: Midi) => Math.max(
      Math.abs(c - prevMidi),
      nextMidi === undefined ? 0 : Math.abs(nextMidi - c),
    );
    const before = widest(midis[i]!);
    for (let d = 1; d <= 3; d++) {
      const up = clampToRange(stepInScale(scale, midis[i]!, d), lo, hi);
      const down = clampToRange(stepInScale(scale, midis[i]!, -d), lo, hi);
      const better = [down, up].find((c) =>
        c !== midis[i]!
        && widest(c) <= Math.max(before, reach)
        // A repair may not open a bigger gap than the one it found. Left free to,
        // it does: raising strictness means more vetoes, so more repairs, so more
        // manufactured leaps — which is how `polished` measured leapier than
        // `strict` on the one genre whose rule table lets most of them through.
        //
        // At the top of the range the allowance goes away entirely. One semitone
        // per repair is a rounding error on any single note and is not one across a
        // catalogue: `polished` runs the most vetoes, so it collects the most of
        // these, and it was still arriving fractionally leapier than `strict` on
        // iskelmä with every other cap already tighter. The setting whose whole
        // promise is smoothness is the one that cannot afford to buy a fix with a
        // wider interval — and where no repair is available inside the gap it found,
        // the note simply stands, which is the same fallback the loop already has.
        && widest(c) <= (opts.strictness >= 4 ? before : before + 1)
        && !evaluateRules(context(c), opts.strictness, opts.rules).vetoed);
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

/**
 * Pull a note onto the section's degree subset, by the smallest move available.
 *
 * The subsets in `voice.ts` are written as indices into a seven-degree mode,
 * because every scale that reached here used to have seven degrees. Against a
 * shorter scale the degrees have to be *dropped* rather than wrapped: `d % len`
 * turned degree 5 of a pentatonic into degree 0, so a subset chosen as a colour
 * silently became a different colour with the tonic counted twice. A degree the
 * scale does not have is not a degree, and the subset is the ones it does have.
 *
 * Which is also why the "not really a subset" guard counts the degrees that
 * survived rather than the ones that were asked for. Written against
 * `subset.length` it fired on every subset in the table once the scale was five
 * or six notes long, and the feature turned itself off exactly where the wrap
 * had already corrupted it. The floor underneath it is the other end of the same
 * question: two pitch classes is not a colour, it is a drone, and a line that
 * snapped into one would stop being a line.
 */
export function snapToSubset(scale: Scale, subset: readonly number[], midi: Midi): Midi {
  const allowed = new Set<Pc>();
  for (const d of subset) if (d < scale.pcs.length) allowed.add(scale.pcs[d]!);
  if (allowed.size >= scale.pcs.length || allowed.size < 3) return midi;
  if (allowed.has(pc(midi))) return midi;
  for (let d = 1; d <= 2; d++) {
    if (allowed.has(pc(midi - d))) return midi - d;
    if (allowed.has(pc(midi + d))) return midi + d;
  }
  return snapToScale(scale, midi);
}
