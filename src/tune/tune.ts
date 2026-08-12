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
import { makeScale, stepInScale, type Scale } from '../core/scale.js';
import { EMPTY_ACCOMPANIMENT, RULES, type Accompaniment, type Rule } from '../core/rules.js';
import type { NoteEvent } from '../core/types.js';
import { describePhrases, planPhrases } from './grammar.js';
import { judge, signatureOf, type Signature, type Verdict } from './judge.js';
import { NEUTRAL_IDIOM, applyOps, motifFamily, tileTo } from './motif.js';
import { describeSkeleton, planArc, skeletonFor } from './skeleton.js';
import { realisePhrase } from './surface.js';
import type {
  ArchetypeId, Idiom, Motif, PhraseNode, SectionShape, Skeleton, TuneContext, TunePlan, Voice,
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
  /**
   * The kind of tune this is, declared rather than drawn here.
   *
   * Supplied on every path that goes through `auditionTune`, which draws it once for
   * the whole audition — see there for why the judge must not be the one choosing.
   * Left out, this falls back to a draw, which is right for a single unjudged tune
   * and is what the tune lab and the checks use.
   */
  archetype?: ArchetypeId;
  /**
   * **The song's own material**, where the song has any — the figures every
   * section of it is made out of. See `Subject` in `adapt.ts`.
   *
   * Absent means this tune invents its own family, which is what every tune in
   * the project did until now and what the tune lab and the checks still do.
   *
   * Supplied, it replaces the drawn family and *only* that: the phrase plan, the
   * arc, which figure lands in which slot, the surface and the judge are all
   * still this section's own, so two sections handed the same three motifs do
   * not come out as the same tune. That is the whole design — a subject is
   * material, not a melody.
   */
  subject?: readonly Motif[];
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
  /**
   * How the instrument playing this line shapes its music — whether it breaks
   * chords, runs up scales, holds one note, or has to stop and breathe. Agility says
   * how far it can reach; this says what it plays.
   */
  idiom?: Idiom;
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

  /**
   * The draw happens whether or not the archetype was declared, and its result is
   * then thrown away if it was.
   *
   * This looks wasteful and is load-bearing. `AuditionOptions` states the project's
   * rule about randomness: a draw added or removed must not move decisions that have
   * nothing to do with it — "the same fault that made adding one drum-source draw
   * move every song in the project". Skipping this draw when the audition supplies an
   * archetype would take one number off the front of the tape and shift every motif,
   * form and arc behind it, so declaring the archetype would silently rewrite the
   * catalogue and every measurement taken on it. Keeping the draw means the only
   * thing the declaration changes is the thing it declares.
   */
  const drawn = rng.weighted(archetypeWeights(voice, opts.shape, opts.idiom));
  const archetypeId = opts.archetype ?? drawn;
  const arch = ARCHETYPES[archetypeId];
  const subset = rng.weighted(voice.subsets).slice();

  const scaled: Voice = opts.density !== undefined && opts.density !== 1
    ? { ...voice, density: voice.density * opts.density }
    : voice;

  /**
   * Drawn either way, and discarded when the song supplied its own — the same
   * rule the archetype draw above states and for the same reason. Skipping it
   * would take numbers off the front of the tape and move the phrase plan, the
   * arc and every judge attempt behind it, so a song acquiring a subject would
   * silently rewrite the sections that have nothing to do with one.
   */
  const drawnMotifs = motifFamily(rng, {
    voice: scaled,
    archetype: arch,
    slotsPerBar,
    span,
    ...(opts.idiom ? { idiom: opts.idiom } : {}),
    ...(ctx.groups ? { groups: ctx.groups } : {}),
  });
  const motifs = opts.subject?.length ? [...opts.subject] : drawnMotifs;

  const { form, phrases } = planPhrases({
    bars, archetype: arch, voice: scaled, repetition: opts.repetition, rng,
  });

  const figures = resolveFigures(phrases, motifs, rng);
  const arc = planArc(rng, arch, ctx.range, voice.compass, opts.strictness ?? 2);
  const baseScale = makeScale(ctx.tonic, ctx.mode === 'minor' ? 'minor' : 'major');

  const skeletons: Record<string, Skeleton> = {};
  const notes: NoteEvent[] = [];
  const peakBar = peakPosition(arc) * bars;

  let bar = 0;
  let previous: Midi | undefined;
  for (const phrase of phrases) {
    const stated = figures.get(phrase.id);
    if (!stated) { bar += phrase.bars; continue; }
    // A phrase longer than the figure's canvas gets the figure again, rather than
    // the figure and then silence. See `tileTo`.
    const figure = tileTo(stated, phrase.bars * slotsPerBar);

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
      agility: opts.agility ?? 0.7,
      strictness: opts.strictness ?? 2,
      // The one place the player's hand reaches the *structure* — see `stride`.
      ...(opts.idiom ? { idiom: opts.idiom } : {}),
      rng,
      ...(phrase.from && skeletons[phrase.from.id] ? { model: skeletons[phrase.from.id]! } : {}),
    });
    skeletons[phrase.id] = skeleton;

    /**
     * A section's tune starts inside its section.
     *
     * The engine writes pickups freely, and a pickup on the *first* phrase lands
     * before bar 0 — inside the section before it, where that section's answering
     * line is already playing and was written without knowing this note would
     * arrive. The old engine took the same liberty and got away with it; three
     * counter notes in 377 overlaps came out doubling the tune at the octave, which
     * `npm run genres` forbids outright and is right to. Phrase pickups inside the
     * section are untouched — it is only the seam that has to be respected.
     */
    const entering = bar === 0
      ? { ...figure, gesture: { ...figure.gesture, onsets: figure.gesture.onsets.filter((o) => o.at >= 0) } }
      : figure;
    if (!entering.gesture.onsets.length) { bar += phrase.bars; continue; }

    notes.push(...realisePhrase({
      figure: entering,
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
      idiom: opts.idiom ?? NEUTRAL_IDIOM,
      ...(previous !== undefined ? { prev: previous } : {}),
      rng,
    }));
    previous = notes[notes.length - 1]?.midi ?? previous;

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
 *
 * **The archetype is drawn here, once, and every attempt is handed it.**
 *
 * `judge.ts` claims its first defence against Goodharting is that the score is
 * conditional — measured against a declared archetype rather than against tunes in
 * general. That claim was false while the archetype was drawn inside `composeTune`,
 * because then twenty-four attempts drew twenty-four archetypes and the judge chose
 * between them: it was comparing scores computed with *different weight sets*, which
 * is not a comparison. Archetypes are not equally scorable under their own weights —
 * measured over 128 sections, `wide-interval` averaged 0.651 and `arch-hook` 0.699 —
 * and a 5% handicap under max-of-24 is fatal. `wide-interval` won 11 auditions where
 * chance would give it 32, `long-note` 11 against 24, while `chant` — which lowers
 * its own `interest` weight to 0.5 and raises `figure` to 1.9, trading the hard term
 * for the easy one — won 33 against 17.
 *
 * So the judge was quietly deleting two thirds of the two most characterful kinds of
 * tune in the table, and the effect compounds across a catalogue: winners measured
 * more like each other than random candidates did, in every genre. Declaring the
 * archetype before the audition is what the doc always said happened, and it costs
 * one draw.
 *
 * Its own RNG stream, for the reason the per-attempt streams have theirs: drawn off
 * attempt 0's tape, changing `attempts` would silently rewrite which *kind* of tune
 * every section of every song is.
 */
export function auditionTune(opts: AuditionOptions): { best: Audition; worst: Audition } {
  const slotsPerBar = Math.round(opts.ctx.beatsPerBar * SLOTS_PER_BEAT);
  const bars = opts.ctx.chords.length;
  const canvasBars = opts.voice.canvasBars ?? 2;
  const archetype = opts.archetype
    ?? new Rng(`${opts.tag}:archetype`)
      .weighted(archetypeWeights(opts.voice, opts.shape, opts.idiom));
  let best: Audition | undefined;
  let worst: Audition | undefined;

  for (let k = 0; k < Math.max(1, opts.attempts); k++) {
    const tune = composeTune({ ...opts, archetype, rng: new Rng(`${opts.tag}:${k}`) });
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
      strictness: opts.strictness ?? 2,
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

// ---------------------------------------------------------------------------
// Variation on recall
// ---------------------------------------------------------------------------

export interface VaryOptions {
  notes: readonly NoteEvent[];
  /** The key's own scale, for stepping. */
  scale: Scale;
  range: [Midi, Midi];
  /** How far to go, 0..1. */
  amount: number;
  rng: Rng;
}

/**
 * The same tune, with one thing changed.
 *
 * A real arrangement does not paste its chorus back in three times. It adds an
 * ornament, holds the last note longer, takes the top note higher the final time —
 * and those small differences are most of what makes a record sound arranged rather
 * than assembled. `docs/hook.md` listed verbatim recall as a known limitation from
 * the day recall was written.
 *
 * Note-level rather than plan-level, deliberately. The operators in `motif.ts` work
 * on a figure and would need the whole plan re-realised to apply, which would
 * produce a *different* tune — and a chorus that comes back different is not a
 * chorus. These four are the ones a player actually does to a line they have already
 * played twice.
 */
export function varyRecall(opts: VaryOptions): NoteEvent[] {
  const { scale, range, rng } = opts;
  let notes = opts.notes.map((n) => ({ ...n }));
  if (notes.length < 3 || opts.amount <= 0) return notes;

  const moves = Math.max(1, Math.round(opts.amount * 2.4));
  for (let k = 0; k < moves; k++) {
    notes = rng.weighted([
      [liftPeak, 3],
      [ornamentLongest, 3],
      [holdLast, 2],
    ] as const)(notes, scale, range, rng);
  }
  return trim(notes);
}

/** Take the high note higher — the most idiomatic final-chorus gesture there is. */
function liftPeak(notes: NoteEvent[], scale: Scale, range: [Midi, Midi], rng: Rng): NoteEvent[] {
  const top = notes.reduce((a, b) => (b.midi > a.midi ? b : a));
  const up = rng.chance(0.3) ? top.midi + 12 : stepInScale(scale, top.midi, 1);
  if (up > range[1]) return notes;
  return notes.map((n) => (n === top ? { ...n, midi: up, velocity: Math.min(1, n.velocity + 0.06) } : n));
}

/** Split the longest note into a note and its neighbour. */
function ornamentLongest(notes: NoteEvent[], scale: Scale, range: [Midi, Midi], rng: Rng): NoteEvent[] {
  let idx = -1;
  let best = 0.7;
  for (let i = 0; i < notes.length; i++) {
    if (notes[i]!.duration > best) { best = notes[i]!.duration; idx = i; }
  }
  if (idx < 0) return notes;
  const note = notes[idx]!;
  const half = note.duration / 2;
  const neighbour = stepInScale(scale, note.midi, rng.chance(0.6) ? 1 : -1);
  if (neighbour < range[0] || neighbour > range[1]) return notes;
  const out = notes.slice();
  out.splice(idx, 1,
    { ...note, duration: half },
    { ...note, beat: note.beat + half, duration: half, midi: neighbour, velocity: note.velocity * 0.85 });
  return out;
}

/**
 * Sit on the arrival. A cadence held is a cadence meant.
 *
 * There is deliberately no *pickup* among these three. Coming in early is the fourth
 * thing a singer does to a line they have sung twice, and it is the one that cannot be
 * done here: written in front of the first note it lands in the previous section, and
 * carved out of the first note it changes the two tokens every recall measurement
 * keys on. Both are worse than not having it.
 */
function holdLast(notes: NoteEvent[]): NoteEvent[] {
  const out = notes.slice();
  const last = out[out.length - 1]!;
  out[out.length - 1] = { ...last, duration: last.duration * 1.5 };
  return out;
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
