/**
 * The door onto the style tables — the one file inside `src/tune/` allowed to see
 * `style/` and `genre/`, and written last on purpose.
 *
 * The engine was built with no access to the old vocabulary so that it could not
 * inherit the old assumptions, which live in types rather than in opinions: import
 * `RhythmCell` and rhythm is bar-shaped again, import `HookLevel` and repetition is
 * nine scalars instead of a derivation. Now that the model exists, reading those
 * tables is safe — the translation runs one way.
 *
 * Two translations, and the first is the interesting one.
 *
 * **A style's melody cells become its accent table.** The cells are where that
 * style puts its notes, stated as durations that must fill a bar. Read as a
 * histogram of onset positions they are exactly the thing a `Voice` needs and
 * cannot otherwise get: a tango's cells put notes on the eighth after a dotted
 * quarter, a jenkka's on the sixteenth after a dotted eighth, and both facts
 * survive the translation even though the bar-filling contract does not. The same
 * histogram gives density, for free and honestly, as the weighted mean number of
 * onsets per bar.
 *
 * **`melody.sequence` is finally read.** It was authored in every style in the
 * project and consumed by nothing, because there was no code that developed a
 * motif. Here it is the appetite for `sequence` and `transpose`, which is what it
 * always said it was.
 */

import { SLOTS_PER_BEAT } from '../core/grid.js';
import type { Chord } from '../core/chord.js';
import type { Midi, Pc } from '../core/pitch.js';
import type { Mode, Scale } from '../core/scale.js';
import type { Accompaniment, Rule } from '../core/rules.js';
import type { NoteEvent, SectionKind } from '../core/types.js';
import type { Feel } from '../style/feel.js';
import type { IdiomProfile } from '../style/instruments.js';
import type { Style, WeightedCell } from '../style/types.js';
import type { HookLevel } from '../generate/hook.js';
import type { Signature } from './judge.js';
import { auditionTune, type Audition } from './tune.js';
import type { ArchetypeId, Voice } from './types.js';
import { SUBSETS, getVoice, hasVoice, sectionShape } from './voice.js';

/**
 * How many tunes to write per section before choosing one.
 *
 * Twenty-four rather than the two hundred the audition can obviously afford,
 * because this runs inside a generator that writes forty songs in a batch and eight
 * hundred in a report. The measured gain flattens well before this — the terms that
 * separate a good tune from a poor one are mostly satisfied or not by the *plan*,
 * and a plan is drawn in full before a note is placed.
 */
const ATTEMPTS = 24;

const CACHE = new Map<string, Voice>();

/**
 * The voice for a style: authored where one exists, derived where it does not.
 *
 * Deriving is not a placeholder that sounds like nothing. It reads the style's own
 * numbers and its own cells, so an unauthored jenkka is snappier than an unauthored
 * valssi for the same reason the old engine's were — the tables say so. What it
 * cannot do is have an *opinion*, which is what the authored three have and the
 * other seventeen are owed. See `docs/tune-plan.md` §13.
 */
export function voiceForStyle(style: Style): Voice {
  if (hasVoice(style.id)) return getVoice(style.id);
  const cached = CACHE.get(style.id);
  if (cached) return cached;

  const slotsPerBar = Math.round(style.beatsPerBar * SLOTS_PER_BEAT);
  const m = style.melody;
  const derived: Voice = {
    id: style.id,
    archetypes: archetypesFor(style, cellDensity(style.melodyCells, slotsPerBar)),
    subsets: SUBSETS,
    density: cellDensity(style.melodyCells, slotsPerBar),
    leap: m.leap,
    ornament: m.ornament,
    compass: m.span,
    syncopation: m.syncopation ?? 0.3,
    accents: cellAccents(style.melodyCells, slotsPerBar),
    // A style whose lead plays two notes a bar wants a longer canvas: four bars of
    // half notes is a phrase, and two bars of them is a fragment.
    ...(cellDensity(style.melodyCells, slotsPerBar) < 1.7 ? { canvasBars: 4 } : {}),
    ops: {
      sequence: 0.5 + m.sequence * 2,
      transpose: 0.7 + m.sequence * 1.2,
      ornament: 0.4 + m.ornament * 3,
      diminish: 0.3 + (m.syncopation ?? 0.3),
      displace: 0.3 + (m.syncopation ?? 0.3) * 1.5,
      expand: 0.6 + m.leap * 2,
    },
  };
  CACHE.set(style.id, derived);
  return derived;
}

/** Weighted mean onsets per bar across the style's own cells. */
function cellDensity(cells: readonly WeightedCell[], slotsPerBar: number): number {
  let weight = 0;
  let onsets = 0;
  for (const c of cells) {
    const n = c.cell.filter((d) => d > 0).length;
    const bars = Math.max(1, c.cell.reduce((a, b) => a + Math.abs(b), 0) / slotsPerBar);
    weight += c.weight;
    onsets += c.weight * (n / bars);
  }
  return weight > 0 ? onsets / weight : 3;
}

/**
 * The cells read as a histogram of where notes land.
 *
 * A negative entry in a cell is a rest, so it advances the position without
 * contributing an onset — which is what makes the table say *where notes are* rather
 * than *where events are*. The downbeat is pinned at 1 regardless of what the cells
 * happen to contain, because it is the one position no style is ambivalent about.
 */
function cellAccents(cells: readonly WeightedCell[], slotsPerBar: number): number[] {
  const hits = new Array<number>(slotsPerBar).fill(0);
  let peak = 0;
  for (const c of cells) {
    let at = 0;
    for (const entry of c.cell) {
      if (entry > 0 && at >= 0) {
        const slot = at % slotsPerBar;
        hits[slot] = (hits[slot] ?? 0) + c.weight;
        peak = Math.max(peak, hits[slot]!);
      }
      at += Math.abs(entry);
    }
  }
  if (peak <= 0) return hits.map((_, i) => (i === 0 ? 1 : 0.3));
  // A floor, because a position no cell happens to use is unusual rather than
  // forbidden, and a template of hard zeroes makes a figure unable to pass through
  // one on its way somewhere.
  return hits.map((h, i) => (i === 0 ? 1 : Math.max(0.08, h / peak)));
}

/**
 * Which kinds of tune a style reaches for, from what its numbers say.
 *
 * Four readings, each of which is a sentence the tables are already making. A style
 * that sequences is a style that walks figures down the scale. A style that leaps is
 * a singer's style. A style with two notes a bar is holding them. A style with a
 * busy, unornamented lead is riffing.
 */
function archetypesFor(style: Style, density: number): readonly (readonly [ArchetypeId, number])[] {
  const m = style.melody;
  const weights: Record<ArchetypeId, number> = {
    'arch-hook': 3,
    'descending-sequence': 1 + m.sequence * 3,
    'riff-response': 0.6 + Math.max(0, density - 2.6) * 1.2 + (0.2 - Math.min(0.2, m.ornament)) * 4,
    'long-note': 0.4 + Math.max(0, 3 - density) * 1.4,
    chant: 0.5 + Math.max(0, density - 2.2) * 0.6,
    'wide-interval': 0.5 + m.leap * 5,
  };
  return (Object.keys(weights) as ArchetypeId[]).map((id) => [id, weights[id]] as const);
}

/**
 * How much a section should repeat itself: the hook axis, times the kind of section.
 *
 * `HookLevel` had nine fields for this and six of them are gone — they described
 * mechanisms inside an engine that no longer exists. What survives is the level
 * itself, which is what the axis always meant, and it is multiplied by the section's
 * own appetite. A chorus at `through` still repeats more than a bridge at `through`,
 * because a chorus is a chorus.
 */
export function repetitionFor(hook: HookLevel, kind: SectionKind): number {
  const shape = sectionShape(kind);
  return clamp01(shape.repetition * (0.4 + 0.9 * (hook.level / 4)));
}

export interface SectionTuneOptions {
  style: Style;
  hook: HookLevel;
  kind: SectionKind;
  /** One chord per bar, already in concert pitch. */
  chords: Chord[];
  startBeat: number;
  tonic: Pc;
  mode: Mode;
  range: [Midi, Midi];
  scaleForChord: (tonic: Pc, mode: Mode, chord: Chord) => Scale;
  /** RNG stream tag. Attempt *k* of the audition draws from `${tag}:${k}`. */
  tag: string;
  strictness: number;
  rules: Rule[];
  accompaniment: Accompaniment;
  agility: number;
  /** What the instrument actually plays. Mapped from `style/instruments.ts`. */
  idiom?: IdiomProfile;
  /** The song's other sections, so this one can be told apart from them. */
  avoid?: readonly Signature[];
  attempts?: number;
  /**
   * The mood's multipliers on leap and ornament.
   *
   * Applied to the voice rather than to the notes, which is the only place they can
   * do their job: a calmer mood should make the engine *want* to move by step, not
   * write a leaping tune and then flatten it. Same two numbers the old engine took
   * as `leapScale` and `ornamentScale`.
   */
  mood?: { leap: number; ornament: number };
  /**
   * How the section is *felt*, in the three terms a feel is allowed to say to a
   * composed part. See `Feel.voice`.
   *
   * The same door as `mood` above, for the same reason and with more force: the
   * melody is not merely generated here, it is *auditioned*. `auditionTune`
   * writes two dozen candidates, scores each against the rules and a freshness
   * term, and keeps the winner — so a feel that pushed those notes around
   * afterwards would hand back a gesture nobody scored. A funkier section has to
   * be a section the engine *wanted* to write funkier.
   *
   * Already scaled by the span's `amount` when it arrives, so `1` here is
   * genuinely "leave it alone" whatever the span said.
   */
  feel?: NonNullable<Feel['voice']>;
}

export interface SectionTune {
  notes: NoteEvent[];
  audition: Audition;
}

/**
 * The style's voice with the song's mood and the section's feel folded in.
 *
 * One object, built once, because the two are the same kind of statement: a bag
 * of multipliers over a vocabulary that already exists. Neither may add a field
 * to `Voice` — if a modifier needs a knob the voice has not got, it is composing
 * rather than modifying and belongs somewhere else entirely.
 *
 * ## The absent accent table, which is the one real decision here
 *
 * `Voice.accents` is optional, and absent means *"derived from `syncopation` and
 * the metre"* — a derivation that also needs the canvas span and the style's own
 * beat groups, neither of which exists at this altitude. So a multiplier here
 * has nothing to multiply, and it deliberately does nothing rather than
 * materialising a table to scale: any array written here would *replace* the
 * derivation instead of scaling it, which would move the tune even at 1.0 and
 * would assert a four-four backbeat under a style grouped 2+2+3.
 *
 * That is not the feel losing its voice on such a style. The derivation reads
 * `syncopation`, and `syncopation` is the first field in this block — so a feel
 * that wants the offbeats lifted on a voice with no table says it through the
 * door the type already provides, and the metre stays intact on the way through.
 * Every style in the catalogue that can currently draw a feel has a table
 * anyway, derived from its own melody cells by `cellAccents` above — 87 styles
 * can draw a feel and **0 of the 87 arrive here without one**, so the branch
 * that deliberately does nothing has never once been taken by a feel that could
 * have used it.
 *
 * The absent case was written down as *the three authored voices*. **Two of the
 * three have since been given an accent table** — tango's dotted lilt and
 * iskelmäpop's, sixteen slots each — so it is now exactly **one style in 389**:
 * `berlin`, whose own note says the lead is not the piece and earns its place by
 * holding still while the machine moves, which is a voice with nothing to lean
 * on. `DEFAULT_VOICE` carries none either and no style in the catalogue reaches
 * it — `voiceForStyle` derives one from the cells for every unauthored style.
 * So the honest statement of the absent case is *an authored voice that has
 * chosen not to have one*, and whatever is authored next.
 */
function adaptVoice(
  base: Voice, mood?: { leap: number; ornament: number }, feel?: NonNullable<Feel['voice']>,
): Voice {
  if (!mood && !feel) return base;
  const accents = feel?.accents && base.accents
    ? base.accents.map((a, i) => Math.max(0, a * feel.accents![i % feel.accents!.length]!))
    : base.accents;
  return {
    ...base,
    ...(mood ? {
      leap: clamp01(base.leap * mood.leap),
      ornament: clamp01(base.ornament * mood.ornament),
    } : {}),
    ...(feel?.syncopation !== undefined
      ? { syncopation: clamp01(base.syncopation * feel.syncopation) } : {}),
    // Onsets per bar, so a count rather than an appetite: floored just above
    // silence instead of clamped to one, and left uncapped upward because the
    // archetype and the section shape both scale it again downstream.
    ...(feel?.density !== undefined
      ? { density: Math.max(0.4, base.density * feel.density) } : {}),
    ...(accents ? { accents } : {}),
  };
}

/** Write one section's tune. */
export function composeSectionTune(opts: SectionTuneOptions): SectionTune {
  const base = voiceForStyle(opts.style);
  const shape = sectionShape(opts.kind);
  const voice = adaptVoice(base, opts.mood, opts.feel);

  const { best } = auditionTune({
    tag: opts.tag,
    attempts: opts.attempts ?? ATTEMPTS,
    voice,
    shape,
    repetition: repetitionFor(opts.hook, opts.kind),
    density: shape.density,
    strictness: opts.strictness,
    rules: opts.rules,
    accompaniment: opts.accompaniment,
    agility: opts.agility,
    ...(opts.idiom ? { idiom: opts.idiom } : {}),
    ctx: {
      chords: opts.chords,
      beatsPerBar: opts.style.beatsPerBar,
      startBeat: opts.startBeat,
      tonic: opts.tonic,
      mode: opts.mode,
      range: opts.range,
      scaleForChord: opts.scaleForChord,
      ...(opts.style.groups ? { groups: opts.style.groups } : {}),
    },
    ...(opts.avoid ? { avoid: opts.avoid } : {}),
  });

  return { notes: best.notes, audition: best };
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
