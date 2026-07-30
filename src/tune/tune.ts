/**
 * The entry point: plan a tune, then realise it.
 *
 * The order is the point. Everything about the section is decided — archetype,
 * degree subset, material, form, derivations, the arc, every phrase's backbone —
 * before a single pitch sounds, and the result of that deciding is a `TunePlan`
 * that can be printed. When a tune is bad you read its plan and see which pass was
 * wrong. The engine this replaces could only be adjusted by moving one of fourteen
 * weights in a scoring function and listening to a hundred songs, which is not
 * debugging, it is superstition.
 *
 * The passes, in order, and each one is a file:
 *
 *   1. material   `motif.ts`     a figure, and two relatives of it
 *   2. form       `grammar.ts`   which phrase is which phrase transformed how
 *   3. arc        `skeleton.ts`  one high point for the whole section
 *   4. backbone   `skeleton.ts`  two to four structural pitches per phrase
 *   5. surface    `surface.ts`   how to get from each one to the next
 */

import { SLOTS_PER_BEAT } from '../core/grid.js';
import type { Midi } from '../core/pitch.js';
import { Rng } from '../core/rng.js';
import { makeScale } from '../core/scale.js';
import { EMPTY_ACCOMPANIMENT, RULES, type Accompaniment, type Rule } from '../core/rules.js';
import type { NoteEvent } from '../core/types.js';
import { describePhrases, planPhrases } from './grammar.js';
import { judge, signatureOf, type Signature, type Verdict } from './judge.js';
import { applyOps, motifFamily } from './motif.js';
import { describeSkeleton, planArc, skeletonFor } from './skeleton.js';
import { realisePhrase } from './surface.js';
import type {
  ArchetypeId, Motif, PhraseNode, SectionShape, Skeleton, TuneContext, TunePlan, Voice,
} from './types.js';
import { ARCHETYPES, archetypeWeights } from './voice.js';

export interface TuneOptions {
  ctx: TuneContext;
  voice: Voice;
  rng: Rng;
  /** How much this section leans on repeating itself, 0..1. */
  repetition: number;
  /** Multiplier on the voice's onset density, from the section plan. */
  density?: number;
  /** Forced rather than drawn. */
  archetype?: ArchetypeId;
  /**
   * What kind of section this is, as a bias on which archetypes are drawn and how
   * much the section repeats itself. See `voice.ts`.
   */
  shape?: SectionShape;
  /** Constraint strictness, 0 (free) to 4 (polished). */
  strictness?: number;
  /** Rule table, already adjusted for the genre. */
  rules?: Rule[];
  /** What the band is already playing, for the vertical rules. */
  accompaniment?: Accompaniment;
  /** Leap freedom of the instrument playing this line, 0..1. */
  agility?: number;
}

export interface Tune {
  plan: TunePlan;
  notes: NoteEvent[];
}

export function composeTune(opts: TuneOptions): Tune {
  const { ctx, voice, rng } = opts;
  const bars = ctx.chords.length;
  const slotsPerBar = Math.round(ctx.beatsPerBar * SLOTS_PER_BEAT);
  const sectionSlots = bars * slotsPerBar;
  const span = slotsPerBar * (voice.canvasBars ?? 2);

  const archetypeId = opts.archetype ?? rng.weighted(archetypeWeights(voice, opts.shape));
  const arch = ARCHETYPES[archetypeId];
  const subset = rng.weighted(voice.subsets).slice();

  const scaled: Voice = opts.density !== undefined && opts.density !== 1
    ? { ...voice, density: voice.density * opts.density }
    : voice;

  const motifs = motifFamily(rng, {
    voice: scaled,
    archetype: arch,
    slotsPerBar,
    span,
    ...(ctx.groups ? { groups: ctx.groups } : {}),
  });

  const { form, phrases } = planPhrases({
    bars, archetype: arch, voice: scaled, repetition: opts.repetition, rng,
  });

  const figures = resolveFigures(phrases, motifs, rng);
  const arc = planArc(rng, arch, ctx.range, voice.compass);
  const baseScale = makeScale(ctx.tonic, ctx.mode === 'minor' ? 'minor' : 'major');

  const skeletons: Record<string, Skeleton> = {};
  const notes: NoteEvent[] = [];
  const peakBar = peakPosition(arc) * bars;

  let bar = 0;
  for (const phrase of phrases) {
    const figure = figures.get(phrase.id);
    if (!figure) { bar += phrase.bars; continue; }

    const chords = ctx.chords.slice(bar, bar + phrase.bars);
    while (chords.length < phrase.bars) chords.push(chords[chords.length - 1] ?? ctx.chords[0]!);
    const scaleAt = (barInPhrase: number) =>
      ctx.scaleForChord(ctx.tonic, ctx.mode, chords[Math.min(chords.length - 1, barInPhrase)]!);

    const phraseStartSlot = bar * slotsPerBar;
    const phraseSlots = phrase.bars * slotsPerBar;

    const skeleton = skeletonFor({
      figure,
      bars: phrase.bars,
      slotsPerBar,
      cadence: phrase.cadence,
      chords,
      scaleAt,
      baseScale,
      subset,
      range: ctx.range,
      archetype: arch,
      // The phrase sees the *section's* arc through the window it occupies. One
      // shape for the whole section is the correction: four phrases with four
      // little hills of their own is a texture, not a shape.
      arc: (pos) => arc(sectionSlots > 0 ? (phraseStartSlot + pos * phraseSlots) / sectionSlots : 0),
      shift: figure.shift,
      carriesPeak: peakBar >= bar && peakBar < bar + phrase.bars,
      rng,
      ...(phrase.from && skeletons[phrase.from.id] ? { model: skeletons[phrase.from.id]! } : {}),
    });
    skeletons[phrase.id] = skeleton;

    notes.push(...realisePhrase({
      figure,
      skeleton,
      bars: phrase.bars,
      slotsPerBar,
      startBeat: ctx.startBeat + bar * ctx.beatsPerBar,
      chords,
      scaleAt,
      baseScale,
      subset,
      range: ctx.range,
      mode: ctx.mode,
      tonic: ctx.tonic,
      strictness: opts.strictness ?? 2,
      rules: opts.rules ?? RULES,
      accompaniment: opts.accompaniment ?? EMPTY_ACCOMPANIMENT,
      agility: opts.agility ?? 0.7,
      rng,
    }));

    bar += phrase.bars;
  }

  const plan: TunePlan = { archetype: archetypeId, form, subset, motifs, phrases, skeletons };
  return { plan, notes: trim(notes) };
}

// ---------------------------------------------------------------------------
// Audition
// ---------------------------------------------------------------------------

export interface AuditionOptions extends Omit<TuneOptions, 'rng'> {
  /**
   * Stream tag for this section. Attempt *k* draws from `${tag}:${k}`.
   *
   * Per-attempt streams rather than one running stream, and this is not tidiness.
   * Drawing every attempt off a shared tape makes attempt 7 depend on how many
   * numbers attempts 0–6 happened to consume, so changing `attempts` silently
   * rewrites every tune in the catalogue — the same fault that made adding one
   * drum-source draw move every song in the project. Here, attempt *k* is the same
   * tune whether you asked for ten or three hundred, and raising the count only
   * changes which one wins.
   */
  tag: string;
  attempts: number;
  /** Material this section should not resemble — the song's other sections. */
  avoid?: readonly Signature[];
}

export interface Audition extends Tune {
  verdict: Verdict;
  signature: Signature;
}

/**
 * Write it many times and keep the best one.
 *
 * Both ends are returned because the difference between them is the only honest
 * test of whether the judge is measuring anything: if best-of-a-hundred and
 * worst-of-a-hundred are hard to tell apart by ear, the scoring is decoration. See
 * `docs/tune-plan.md` Phase 3.
 */
export function auditionTune(opts: AuditionOptions): { best: Audition; worst: Audition } {
  const slotsPerBar = Math.round(opts.ctx.beatsPerBar * SLOTS_PER_BEAT);
  const bars = opts.ctx.chords.length;
  const canvasBars = opts.voice.canvasBars ?? 2;
  let best: Audition | undefined;
  let worst: Audition | undefined;

  for (let k = 0; k < Math.max(1, opts.attempts); k++) {
    const tune = composeTune({ ...opts, rng: new Rng(`${opts.tag}:${k}`) });
    const arch = ARCHETYPES[tune.plan.archetype];
    const verdict = judge({
      notes: tune.notes,
      plan: tune.plan,
      ctx: opts.ctx,
      archetype: arch,
      voice: opts.voice,
      bars,
      slotsPerBar,
      wantDensity: opts.voice.density * arch.density * (opts.density ?? 1),
      ...(opts.avoid ? { avoid: opts.avoid } : {}),
    });
    const candidate: Audition = {
      ...tune,
      verdict,
      signature: signatureOf(tune.notes, slotsPerBar, canvasBars),
    };
    if (!best || verdict.score > best.verdict.score) best = candidate;
    if (!worst || verdict.score < worst.verdict.score) worst = candidate;
  }

  return { best: best!, worst: worst! };
}

/**
 * Walk the phrase list and hand each phrase its actual material.
 *
 * A statement takes the family motif for its role. A derivation applies its
 * operators to whatever its model resolved to — so a chain of derivations
 * compounds, which is what `A''` being *"A sequenced up, sequenced up again"*
 * means, and it is why this is a resolution pass rather than a lookup.
 */
export function resolveFigures(
  phrases: readonly PhraseNode[], motifs: readonly Motif[], rng: Rng,
): Map<string, Motif> {
  const out = new Map<string, Motif>();
  const byRole = new Map(motifs.map((m) => [m.role, m]));

  for (const phrase of phrases) {
    if (phrase.from) {
      const model = out.get(phrase.from.id) ?? byRole.get('hook') ?? motifs[0]!;
      out.set(phrase.id, applyOps(model, phrase.from.ops, rng));
      continue;
    }
    const stated = byRole.get(phrase.motif ?? 'hook') ?? motifs[0]!;
    out.set(phrase.id, stated);
  }
  return out;
}

/** Where the arc's high point sits, as a fraction of the section. */
function peakPosition(arc: (pos: number) => Midi): number {
  let best = 0;
  let height = -Infinity;
  for (let i = 0; i <= 32; i++) {
    const h = arc(i / 32);
    if (h > height) { height = h; best = i / 32; }
  }
  return best;
}

/**
 * Clip a monophonic line so no note runs into the next.
 *
 * Expected rather than exceptional: a figure may be held past its own extent and a
 * phrase's pickup is written backwards into the phrase before it. Trimming keeps the
 * onset, which is what the ear timed, and loses only tail that was inaudible under
 * the next attack anyway.
 */
export function trim(notes: NoteEvent[]): NoteEvent[] {
  const MIN_AUDIBLE = 0.125;
  const sorted = notes.slice().sort((a, b) => a.beat - b.beat);
  const out: NoteEvent[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const n = sorted[i]!;
    const next = sorted[i + 1];
    const room = next ? next.beat - n.beat : n.duration;
    const duration = Math.min(n.duration, room);
    if (duration < MIN_AUDIBLE) continue;
    out.push({ ...n, duration });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Printing
// ---------------------------------------------------------------------------

/** The plan as text. See `docs/tune-plan.md` §4.6 — this is how a tune is debugged. */
export function describeTune(
  plan: TunePlan, notes: readonly NoteEvent[], slotsPerBar = 16,
): string[] {
  const lines = [
    `archetype  ${ARCHETYPES[plan.archetype].label} — ${ARCHETYPES[plan.archetype].gloss}`,
    `form       ${plan.form}`,
    `subset     ${plan.subset.map((d) => d + 1).join(' ')}`,
    `notes      ${notes.length}`,
    '',
    'material',
  ];
  for (const m of plan.motifs) {
    const rhythm = m.gesture.onsets.map((o) => `${o.at}:${o.dur}`).join(' ');
    lines.push(`  ${m.role.padEnd(7)} ${rhythm}`);
    lines.push(`  ${''.padEnd(7)} contour ${m.contour.join(' ')}`);
  }
  lines.push('', 'phrases');
  const described = describePhrases(plan.phrases);
  plan.phrases.forEach((p, i) => {
    lines.push('  ' + described[i]!);
    const skeleton = plan.skeletons[p.id];
    if (skeleton) lines.push(`        bones  ${describeSkeleton(skeleton, slotsPerBar)}`);
  });
  return lines;
}
