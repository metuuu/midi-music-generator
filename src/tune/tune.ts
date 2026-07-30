/**
 * The entry point: plan a tune, then realise it.
 *
 * The order is the point. Everything about the section is decided — archetype,
 * degree subset, material, form, derivations — before a single pitch exists, and
 * the result of that deciding is a `TunePlan` that can be printed. When a tune is
 * bad you read its plan and see which pass was wrong. The engine this replaces
 * could only be adjusted by moving one of fourteen weights in a scoring function
 * and listening to a hundred songs, which is not debugging.
 *
 * At this stage realisation is deliberately plain: place the figure's onsets, walk
 * its contour through the scale, snap the strong notes to the harmony. It is
 * enough to hear whether the *derivations* are audible, which is what Phase 1 is
 * for, and it is replaced wholesale by the skeleton in Phase 2 — see
 * `docs/tune-plan.md`.
 */

import { chordPcs } from '../core/chord.js';
import type { Chord } from '../core/chord.js';
import { SLOTS_PER_BEAT } from '../core/grid.js';
import type { Midi } from '../core/pitch.js';
import { clampToRange, pc } from '../core/pitch.js';
import type { Rng } from '../core/rng.js';
import type { Scale } from '../core/scale.js';
import { makeScale, snapToScale, stepInScale } from '../core/scale.js';
import type { NoteEvent } from '../core/types.js';
import { describePhrases, planPhrases } from './grammar.js';
import { applyOps, motifFamily } from './motif.js';
import type {
  ArchetypeId, Cadence, Motif, PhraseNode, TuneContext, TunePlan, Voice,
} from './types.js';
import { ARCHETYPES } from './voice.js';

export interface TuneOptions {
  ctx: TuneContext;
  voice: Voice;
  rng: Rng;
  /** How much this section leans on repeating itself, 0..1. */
  repetition: number;
  /** Multiplier on the voice's onset density, from the section plan. */
  density?: number;
  /** Forced rather than drawn — the section plan's business once it exists. */
  archetype?: ArchetypeId;
}

export interface Tune {
  plan: TunePlan;
  notes: NoteEvent[];
}

export function composeTune(opts: TuneOptions): Tune {
  const { ctx, voice, rng } = opts;
  const bars = ctx.chords.length;
  const slotsPerBar = Math.round(ctx.beatsPerBar * SLOTS_PER_BEAT);
  const canvasBars = voice.canvasBars ?? 2;
  const span = slotsPerBar * canvasBars;

  const archetypeId = opts.archetype ?? rng.weighted(voice.archetypes);
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

  const plan: TunePlan = {
    archetype: archetypeId,
    form,
    subset,
    motifs,
    phrases,
    skeletons: {},
  };

  const notes = realise({ plan, figures, ctx, slotsPerBar, span, rng });
  return { plan, notes };
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

interface RealiseArgs {
  plan: TunePlan;
  figures: Map<string, Motif>;
  ctx: TuneContext;
  slotsPerBar: number;
  span: number;
  rng: Rng;
}

/**
 * Place the notes.
 *
 * Plain on purpose at this stage — see the file header. What it does own, and will
 * keep owning after the skeleton lands, is the two things that are true of every
 * realisation: a figure is *clipped* to its phrase rather than allowed to run past
 * it, and the phrase's last note is placed by its cadence rather than by wherever
 * the contour arrived.
 */
function realise(args: RealiseArgs): NoteEvent[] {
  const { plan, figures, ctx, slotsPerBar, rng } = args;
  const [lo, hi] = ctx.range;
  const baseScale = makeScale(ctx.tonic, ctx.mode === 'minor' ? 'minor' : 'major');
  const out: NoteEvent[] = [];

  const chordAt = (bar: number): Chord =>
    ctx.chords[Math.max(0, Math.min(ctx.chords.length - 1, bar))]!;
  const scaleAt = (bar: number): Scale => ctx.scaleForChord(ctx.tonic, ctx.mode, chordAt(bar));

  const starts = new Map<string, Midi>();
  let bar = 0;
  let prev = clampToRange(snapToScale(baseScale, Math.round((lo + hi) / 2)), lo, hi);

  for (const phrase of plan.phrases) {
    const figure = figures.get(phrase.id);
    if (!figure) { bar += phrase.bars; continue; }

    const phraseSlots = phrase.bars * slotsPerBar;
    const onsets = figure.gesture.onsets.filter((o) => o.at < phraseSlots);
    if (!onsets.length) { bar += phrase.bars; continue; }

    // Where the figure enters. A derived phrase enters `shift` scale steps above
    // wherever its model entered, which is what makes a transposition audible as
    // a transposition rather than as a new phrase that happens to be higher.
    const modelStart = phrase.from ? starts.get(phrase.from.id) : undefined;
    const entry = modelStart !== undefined
      ? stepInScale(baseScale, modelStart, figure.shift)
      : prev;
    /**
     * The contour walks on its own cursor, and snapping only touches what is
     * emitted.
     *
     * Stepping from the *snapped* note is the bug that makes a generated line
     * stall: a figure that goes up a step and back down gets its up-step pulled
     * onto a chord tone, then its down-step measured from there, and the two
     * cancel — the tune repeats a note where the figure said it moved. Keeping the
     * intended pitch and the sounded pitch apart costs nothing and is the whole
     * difference between a shape surviving the harmony and being erased by it.
     */
    let cursor = clampToRange(snapToScale(baseScale, entry), lo, hi);
    starts.set(phrase.id, cursor);

    const events: NoteEvent[] = [];
    for (let i = 0; i < onsets.length; i++) {
      const onset = onsets[i]!;
      const slot = bar * slotsPerBar + onset.at;
      const inBar = Math.max(0, Math.min(ctx.chords.length - 1, Math.floor(slot / slotsPerBar)));
      const scale = scaleAt(inBar);

      if (i > 0) cursor = reflect(stepInScale(scale, cursor, figure.contour[i] ?? 0), lo, hi);
      let midi = snapToSubset(scale, plan.subset, cursor);
      /**
       * A note the figure leans on wants to belong to the chord under it — but
       * only just, and this is the rule the old engine got backwards.
       *
       * There it was a hard skip: a strong beat could not carry a non-chord tone
       * at all. The cost is visible the moment you print a line, because pulling
       * an accented note a whole tone onto a chord tone destroys the interval that
       * got it there — a figure that steps up arrives on the note it left. So the
       * nudge is a semitone, which fixes a genuinely sour note and leaves a
       * deliberate one alone. A figure being replayed over new changes is the one
       * case that wants the whole tone, because there the point is that it fits.
       */
      if (figure.resnap) {
        midi = nearChordTone(chordAt(inBar), midi, 2, [lo, hi]) ?? midi;
      } else if (onset.accent >= 0.85) {
        midi = nearChordTone(chordAt(inBar), midi, 1, [lo, hi]) ?? midi;
      }

      events.push({
        beat: ctx.startBeat + slot / SLOTS_PER_BEAT,
        duration: Math.max(1, onset.dur) / SLOTS_PER_BEAT,
        midi,
        velocity: 0.55 + onset.accent * 0.35,
      });
    }

    const landed = landCadence(events, phrase.cadence, baseScale, chordAt(bar + phrase.bars - 1), [lo, hi], rng);
    out.push(...events);
    prev = landed;
    bar += phrase.bars;
  }

  return trim(out);
}

/**
 * Put the phrase's last note where its cadence says.
 *
 * A phrase ending is a destination the whole phrase was aiming at, not an outcome
 * of having walked. `open` leaves the listener hanging on 5̂ or 2̂; `half` stops on
 * the chord's own root so the stop is real without being final; `closed` lands on
 * the tonic; `suspended` sits on 4̂ or 7̂ and asks to be continued.
 */
function landCadence(
  events: NoteEvent[], cadence: Cadence, scale: Scale, chord: Chord,
  [lo, hi]: [Midi, Midi], rng: Rng,
): Midi {
  const last = events[events.length - 1];
  if (!last) return Math.round((lo + hi) / 2);

  const degree = cadence === 'closed'
    ? rng.weighted([[0, 6], [2, 1]] as const)
    : cadence === 'open'
      ? rng.weighted([[4, 5], [1, 3], [2, 2]] as const)
      : cadence === 'suspended'
        ? rng.weighted([[3, 3], [6, 2]] as const)
        : -1;

  const target = degree >= 0
    ? nearestDegree(scale, degree, last.midi)
    : nearPc(chord.root, last.midi);

  last.midi = clampToRange(target, lo, hi);
  return last.midi;
}

// ---------------------------------------------------------------------------
// Pitch helpers
// ---------------------------------------------------------------------------

/**
 * Step into the range by turning back rather than by dropping an octave.
 *
 * `clampToRange` preserves the pitch class by moving whole octaves, which is right
 * for placing an isolated note and wrong in the middle of a figure: a sequence
 * that walks into the ceiling comes back an octave lower and the listener hears a
 * twelve-semitone leap in the middle of a stepwise idea. Reflecting keeps the size
 * of the motion, which is what the shape is made of, and reverses only its
 * direction — which is what a composer does when a sequence runs out of room.
 */
function reflect(midi: Midi, lo: Midi, hi: Midi): Midi {
  if (midi >= lo && midi <= hi) return midi;
  const span = hi - lo;
  if (span <= 0) return lo;
  let m = midi;
  for (let guard = 0; guard < 8 && (m < lo || m > hi); guard++) {
    if (m < lo) m = lo + (lo - m);
    if (m > hi) m = hi - (m - hi);
  }
  return clampToRange(m, lo, hi);
}

/** Pull a note onto the section's degree subset, by the smallest move available. */
function snapToSubset(scale: Scale, subset: readonly number[], midi: Midi): Midi {
  if (subset.length >= scale.pcs.length) return midi;
  const allowed = new Set(subset.map((d) => scale.pcs[d % scale.pcs.length]!));
  if (allowed.has(pc(midi))) return midi;
  for (let d = 1; d <= 3; d++) {
    if (allowed.has(pc(midi - d))) return midi - d;
    if (allowed.has(pc(midi + d))) return midi + d;
  }
  return midi;
}

/** The chord tone nearest `midi` within `reach`, or nothing that close. */
export function nearChordTone(
  chord: Chord, midi: Midi, reach: number, [lo, hi]: [Midi, Midi],
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

export function nearestDegree(scale: Scale, degree: number, reference: Midi): Midi {
  return nearPc(scale.pcs[degree % scale.pcs.length]!, reference);
}

function nearPc(target: number, reference: Midi): Midi {
  const base = Math.floor(reference / 12) * 12 + target;
  let best = base;
  let bestDist = Math.abs(base - reference);
  for (const cand of [base - 12, base + 12]) {
    const d = Math.abs(cand - reference);
    if (d < bestDist) { best = cand; bestDist = d; }
  }
  return best;
}

/** Clip a monophonic line so no note runs into the next. */
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
export function describeTune(plan: TunePlan, notes: readonly NoteEvent[]): string[] {
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
  for (const line of describePhrases(plan.phrases)) lines.push('  ' + line);
  return lines;
}
