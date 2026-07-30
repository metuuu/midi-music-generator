/**
 * Scoring, so that a hundred tunes can be generated and one kept.
 *
 * Generating a plan is cheap. Generating three hundred and keeping the best is
 * still cheap, and it is the only way to get quality out of a generator without
 * hand-tuning weights forever — which is what the old engine required, and why its
 * fourteen weights in `choosePitch` had accreted rather than been designed.
 *
 * The failure mode this file is designed against is more dangerous than a bad
 * weight, and it has a name. **A scalar judge Goodharts**: maximise one number
 * globally and every song converges on the single tune that maximises it. A bad
 * weight makes one worse tune; a bad judge makes a thousand identical ones. Two
 * defences, and they are structural rather than careful:
 *
 *  - **The score is conditional.** Every term is measured against the *declared
 *    archetype*, and the archetype is drawn before any of this runs. There is no
 *    absolute best tune here, only fitness for the kind of tune we said we were
 *    writing.
 *  - **Dullness is a term.** `core/rules.ts` already handles *wrong*. If this file
 *    only measured correctness, best-of-N would faithfully rediscover the output
 *    we are replacing — polite, unobjectionable, forgettable. `interest` and
 *    `freshness` are the terms that stop it.
 */

import { chordPcs } from '../core/chord.js';
import { SLOTS_PER_BEAT } from '../core/grid.js';
import { pc } from '../core/pitch.js';
import type { NoteEvent } from '../core/types.js';
import { accentTemplate } from './motif.js';
import type { Archetype, TermId, TuneContext, TunePlan, Voice } from './types.js';

export type { TermId };

export interface Verdict {
  score: number;
  terms: Record<TermId, number>;
}

/**
 * A tune's fingerprint, for telling it apart from the other sections of its own
 * song.
 *
 * Intervals rather than pitches, so a transposed restatement counts as the same
 * material — which it is. Onsets folded onto two bars, so a figure recognisably
 * reused counts as reused however far into the section it appears.
 */
export interface Signature {
  intervals: number[];
  onsets: number[];
}

export interface JudgeOptions {
  notes: readonly NoteEvent[];
  plan: TunePlan;
  ctx: TuneContext;
  archetype: Archetype;
  voice: Voice;
  bars: number;
  slotsPerBar: number;
  /** Onsets per bar the section plan asked for. */
  wantDensity: number;
  /** Constraint strictness, 0..4. */
  strictness: number;
  /** Material this section should not resemble — the song's other sections. */
  avoid?: readonly Signature[];
}

const BASE_WEIGHTS: Record<TermId, number> = {
  peak: 1.1,
  economy: 1.2,
  figure: 1.3,
  motion: 1,
  arrival: 1.2,
  shape: 1,
  density: 0.8,
  groove: 0.9,
  interest: 1.4,
  freshness: 1,
};

export function judge(opts: JudgeOptions): Verdict {
  const terms: Record<TermId, number> = {
    peak: peakTerm(opts),
    economy: economyTerm(opts),
    figure: figureTerm(opts),
    motion: motionTerm(opts),
    arrival: arrivalTerm(opts),
    shape: shapeTerm(opts),
    density: densityTerm(opts),
    groove: grooveTerm(opts),
    interest: interestTerm(opts),
    freshness: freshnessTerm(opts),
  };

  const weights = { ...BASE_WEIGHTS, ...(opts.archetype.judge ?? {}) };
  /**
   * Smoothness has to reach the *selection*, not only the realisation.
   *
   * Making every candidate tamer is not the same as choosing a tamer candidate: the
   * axis changes which of two dozen tunes wins, and on the one genre whose rule table
   * is mostly disabled the winner at `polished` came out leapier than the winner at
   * `strict` even though each individual realisation was narrower. The *target* for
   * `motion` is unchanged — what a well-moving line looks like is not a matter of
   * taste — only how much it counts against the rest.
   */
  weights.motion = (weights.motion ?? 1) * (1 + opts.strictness * 0.3);
  let total = 0;
  let sum = 0;
  for (const id of Object.keys(terms) as TermId[]) {
    const w = weights[id] ?? 0;
    total += w;
    sum += w * terms[id];
  }
  return { score: total > 0 ? sum / total : 0, terms };
}

// ---------------------------------------------------------------------------
// Terms
// ---------------------------------------------------------------------------

/**
 * One clear high point.
 *
 * A section whose top note is struck six times has no high point, it has a
 * ceiling. Counted in distinct moments rather than notes, because a held top note
 * re-articulated is one arrival.
 */
function peakTerm({ notes }: JudgeOptions): number {
  if (notes.length < 3) return 0;
  const top = Math.max(...notes.map((n) => n.midi));
  const moments = new Set(notes.filter((n) => n.midi >= top - 1).map((n) => Math.round(n.beat * 2)));
  return 1 / (1 + (moments.size - 1) * 0.55);
}

/**
 * Few notes, heard often.
 *
 * Six pitch classes heard four times each are far more memorable than twenty-four
 * heard once, and the difference between a folk tune and an exercise is mostly
 * this. Bounded at the bottom too: two pitch classes is not economy, it is a
 * doorbell.
 */
function economyTerm({ notes }: JudgeOptions): number {
  if (!notes.length) return 0;
  const classes = new Set(notes.map((n) => pc(n.midi))).size;
  if (classes < 3) return 0.25;
  const turnover = notes.length / classes;
  return clamp01((turnover - 1.4) / 2.2);
}

/**
 * Is there a rhythm anybody could clap back?
 *
 * The most-repeated bar-level onset pattern, as a fraction of the bars. Rhythmic
 * identity is what survives being hummed badly by someone who cannot hold a pitch,
 * which is most people, which is why this carries more weight than the pitch terms.
 */
function figureTerm({ notes, bars, slotsPerBar }: JudgeOptions): number {
  if (bars < 2) return 0.5;
  const counts = new Map<string, number>();
  for (let bar = 0; bar < bars; bar++) {
    const from = bar * slotsPerBar;
    const key = notes
      .filter((n) => {
        const slot = Math.round(n.beat * SLOTS_PER_BEAT);
        return slot >= from && slot < from + slotsPerBar;
      })
      .map((n) => Math.round(n.beat * SLOTS_PER_BEAT) - from)
      .join(',');
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (!counts.size) return 0;
  const best = Math.max(...counts.values());
  return clamp01((best / bars) * 2);
}

/**
 * Mostly steps, with somewhere to leap.
 *
 * The target is a line that walks and jumps once or twice, which is what singing
 * is. Both extremes are failures the old engine reached routinely: at high
 * strictness it arpeggiated, because "chord tone on the beat" and "move by step"
 * pull against each other and the vertical rule won.
 */
function motionTerm({ notes }: JudgeOptions): number {
  if (notes.length < 3) return 0.3;
  const intervals: number[] = [];
  for (let i = 1; i < notes.length; i++) intervals.push(Math.abs(notes[i]!.midi - notes[i - 1]!.midi));
  const steps = intervals.filter((d) => d > 0 && d <= 2).length / intervals.length;
  const wide = intervals.filter((d) => d >= 5).length;
  const stepFit = Math.exp(-((steps - 0.62) ** 2) / (2 * 0.22 * 0.22));
  const leapFit = wide === 0 ? 0.55 : wide <= 3 ? 1 : Math.max(0.2, 1 - (wide - 3) * 0.2);
  return clamp01(stepFit * 0.6 + leapFit * 0.4);
}

/** Does the ending sound like an ending? */
function arrivalTerm({ notes, ctx, plan }: JudgeOptions): number {
  const last = notes[notes.length - 1];
  if (!last) return 0;
  const chord = ctx.chords[ctx.chords.length - 1]!;
  const closing = plan.phrases[plan.phrases.length - 1]?.cadence === 'closed';

  let score = pc(last.midi) === ctx.tonic
    ? 1
    : chordPcs(chord).includes(pc(last.midi)) ? 0.65 : 0.15;
  // A cadence the form called closed and the tune did not is worse than an open
  // ending honestly reached.
  if (closing && pc(last.midi) !== ctx.tonic) score *= 0.7;
  // Long is arrival. A cadence that goes past in a sixteenth has not landed.
  score *= clamp01(0.45 + last.duration * 0.45);
  return clamp01(score);
}

/** Did we build the kind of tune we said we were building? */
function shapeTerm({ notes, archetype }: JudgeOptions): number {
  if (notes.length < 3) return 0;
  const span = notes[notes.length - 1]!.beat - notes[0]!.beat;
  if (span <= 0) return 0;
  const top = notes.reduce((a, b) => (b.midi > a.midi ? b : a));
  const at = (top.beat - notes[0]!.beat) / span;
  const want = (archetype.peakAt[0] + archetype.peakAt[1]) / 2;
  return Math.exp(-((at - want) ** 2) / (2 * 0.22 * 0.22));
}

function densityTerm({ notes, bars, wantDensity }: JudgeOptions): number {
  if (!bars) return 0;
  const actual = notes.length / bars;
  return Math.exp(-((actual - wantDensity) ** 2) / (2 * 1.3 * 1.3));
}

/**
 * Do the notes land where this style puts its accents?
 *
 * This is what makes a complicated rhythm read as intentional. A figure that
 * disagrees with the groove is the definition of noise, and no amount of interest
 * elsewhere rescues it.
 */
function grooveTerm({ notes, voice, slotsPerBar, ctx }: JudgeOptions): number {
  if (!notes.length) return 0;
  const span = slotsPerBar * (voice.canvasBars ?? 2);
  const template = accentTemplate(voice, slotsPerBar, span, ctx.groups);
  let sum = 0;
  for (const n of notes) {
    const slot = ((Math.round(n.beat * SLOTS_PER_BEAT) % span) + span) % span;
    sum += template[slot] ?? 0.4;
  }
  return clamp01((sum / notes.length) * 1.35);
}

/**
 * The anti-Goodhart term.
 *
 * Every other term in this file can be satisfied by a tune that is correct and
 * dull — which is precisely the tune the old engine wrote, and the reason a judge
 * made only of the other nine terms would rediscover it. Three things a dull tune
 * lacks: it never changes direction, it never reaches, and it never uses more than
 * the middle of its own register.
 */
function interestTerm({ notes }: JudgeOptions): number {
  if (notes.length < 4) return 0.2;
  let turns = 0;
  let lastDir = 0;
  let repeats = 0;
  for (let i = 1; i < notes.length; i++) {
    const d = notes[i]!.midi - notes[i - 1]!.midi;
    if (d === 0) repeats++;
    const dir = Math.sign(d);
    if (dir !== 0 && lastDir !== 0 && dir !== lastDir) turns++;
    if (dir !== 0) lastDir = dir;
  }
  const perNote = turns / notes.length;
  // Around a third of the notes turning the line around is the sound of a shape.
  // Far less is a scale; far more is a tremble.
  const turnFit = Math.exp(-((perNote - 0.32) ** 2) / (2 * 0.16 * 0.16));

  const used = Math.max(...notes.map((n) => n.midi)) - Math.min(...notes.map((n) => n.midi));
  const reachFit = clamp01((used - 4) / 8);
  const stallFit = 1 - clamp01(repeats / notes.length / 0.35);
  return clamp01(turnFit * 0.5 + reachFit * 0.3 + stallFit * 0.2);
}

/** How unlike the song's other sections this is. */
function freshnessTerm(opts: JudgeOptions): number {
  if (!opts.avoid?.length) return 1;
  const mine = signatureOf(opts.notes, opts.slotsPerBar, opts.voice.canvasBars ?? 2);
  let worst = 0;
  for (const other of opts.avoid) worst = Math.max(worst, similarity(mine, other));
  return clamp01(1 - worst);
}

// ---------------------------------------------------------------------------
// Signatures
// ---------------------------------------------------------------------------

export function signatureOf(
  notes: readonly NoteEvent[], slotsPerBar: number, canvasBars: number,
): Signature {
  const span = Math.max(1, slotsPerBar * canvasBars);
  const intervals: number[] = [];
  for (let i = 1; i < notes.length; i++) intervals.push(notes[i]!.midi - notes[i - 1]!.midi);
  const onsets = [...new Set(notes.map((n) => ((Math.round(n.beat * SLOTS_PER_BEAT) % span) + span) % span))];
  return { intervals, onsets: onsets.sort((a, b) => a - b) };
}

export function similarity(a: Signature, b: Signature): number {
  return 0.55 * gramOverlap(a.intervals, b.intervals) + 0.45 * jaccard(a.onsets, b.onsets);
}

/** Shared three-note interval runs — the unit at which the ear recognises a lick. */
function gramOverlap(a: number[], b: number[]): number {
  const grams = (xs: number[]) => {
    const out = new Set<string>();
    for (let i = 0; i + 2 < xs.length; i++) out.add(xs.slice(i, i + 3).join(','));
    return out;
  };
  const ga = grams(a);
  const gb = grams(b);
  if (!ga.size || !gb.size) return 0;
  let shared = 0;
  for (const g of ga) if (gb.has(g)) shared++;
  return shared / Math.min(ga.size, gb.size);
}

function jaccard(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 0;
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  return inter / (sa.size + sb.size - inter);
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** The verdict as text, for a printed plan. */
export function describeVerdict(v: Verdict): string {
  const parts = (Object.keys(v.terms) as TermId[])
    .map((id) => `${id} ${v.terms[id].toFixed(2)}`)
    .join('  ');
  return `score ${v.score.toFixed(3)}   ${parts}`;
}
