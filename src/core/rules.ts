/**
 * Melodic and vertical constraints — the "what sounds wrong" rules.
 *
 * These encode the prohibitions that classical voice-leading, species
 * counterpoint and jazz arranging practice all converge on. They are not
 * arbitrary: each one names a specific, audible fault that a note-by-note
 * generator will otherwise produce at a measurable rate.
 *
 * Two things make this workable rather than a straitjacket:
 *
 *  1. Rules are *graded*, not binary. Each has a `minLevel` at which it starts
 *     applying as a scoring penalty, and a `vetoLevel` at which it becomes a
 *     hard prohibition. Raising strictness turns preferences into laws.
 *
 *  2. Vetoes degrade gracefully. If every candidate is forbidden, the caller
 *     relaxes a level at a time rather than emitting something broken. Music
 *     that obeys no rule beats music that stops.
 *
 * The trade is real and worth stating plainly: higher levels genuinely do
 * reduce chaos, and they also reduce character. Level 4 writes music that can
 * never offend and rarely surprises.
 */

import type { Chord } from './chord.js';
import { chordPcs } from './chord.js';
import type { Midi, Pc } from './pitch.js';
import { pc } from './pitch.js';
import type { Mode, Scale } from './scale.js';
import { scaleStepsBetween } from './scale.js';
import type { NoteEvent } from './types.js';

// ---------------------------------------------------------------------------
// Levels
// ---------------------------------------------------------------------------

export type StrictnessId = 'free' | 'light' | 'standard' | 'strict' | 'polished';

export interface StrictnessLevel {
  id: StrictnessId;
  level: number;
  label: string;
  gloss: string;
}

export const STRICTNESS_LEVELS: StrictnessLevel[] = [
  {
    id: 'free', level: 0, label: 'Free',
    gloss: 'no filtering — most character, occasional roughness',
  },
  {
    id: 'light', level: 1, label: 'Light',
    gloss: 'blocks the unambiguously ugly melodic leaps only',
  },
  {
    id: 'standard', level: 2, label: 'Standard',
    gloss: 'adds dissonance handling and resolution of tendency tones',
  },
  {
    id: 'strict', level: 3, label: 'Strict',
    gloss: 'adds vertical clash and parallel-motion checks against the band',
  },
  {
    id: 'polished', level: 4, label: 'Polished',
    gloss: 'maximum consonance — safe, smooth, and noticeably tamer',
  },
];

const BY_ID = new Map(STRICTNESS_LEVELS.map((l) => [l.id, l]));

export function getStrictness(id: StrictnessId | number): StrictnessLevel {
  if (typeof id === 'number') {
    const found = STRICTNESS_LEVELS.find((l) => l.level === id);
    if (!found) throw new Error(`Unknown strictness level ${id}`);
    return found;
  }
  const found = BY_ID.get(id);
  if (!found) throw new Error(`Unknown strictness "${id}". Known: ${[...BY_ID.keys()].join(', ')}`);
  return found;
}

export const STRICTNESS_IDS = STRICTNESS_LEVELS.map((l) => l.id);

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/** What the accompaniment is doing at a given moment. */
export interface Accompaniment {
  /** Every accompaniment pitch sounding at this beat. */
  soundingAt(beat: number): readonly Midi[];
  /** The lowest accompaniment pitch sounding at this beat, i.e. the bass. */
  bassAt(beat: number): Midi | undefined;
}

export const EMPTY_ACCOMPANIMENT: Accompaniment = {
  soundingAt: () => [],
  bassAt: () => undefined,
};

export interface NoteContext {
  candidate: Midi;
  /** Previous melody note, if any. */
  prev?: Midi;
  /** The note before that — needed to spot two leaps in a row. */
  prevPrev?: Midi;
  /** Chord governing the previous note, for tendency-tone resolution. */
  prevChord?: Chord;
  chord: Chord;
  scale: Scale;
  mode: Mode;
  tonic: Pc;
  /** 0 = offbeat sixteenth … 4 = downbeat. */
  strength: number;
  /** Duration in beats. */
  duration: number;
  beat: number;
  accompaniment: Accompaniment;
  /**
   * How freely the instrument playing this line leaps, 0..1. A vibraphone is
   * near 1, a trombone near 0.4. Defaults to 0.7 when unknown.
   */
  agility: number;
}

/** Level high enough that a rule never applies — used to disable or never-veto. */
export const RULE_DISABLED = 99;

export interface Rule {
  id: string;
  /** Grouping for the generated reference — see `npm run rules`. */
  category: string;
  /** Shown in the audit and the docs. */
  description: string;
  /** Level from which the rule applies as a penalty. */
  minLevel: number;
  /** Level from which a violation is forbidden outright. */
  vetoLevel: number;
  /** Score multiplier when violated below the veto level. */
  penalty: number;
  test(ctx: NoteContext): boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const leadingTonePc = (tonic: Pc): Pc => pc(tonic + 11);

/** Interval above the chord root, 0..11. */
function degreeAboveRoot(midi: Midi, chord: Chord): number {
  return ((pc(midi) - chord.root) % 12 + 12) % 12;
}

function isChordTone(midi: Midi, chord: Chord): boolean {
  return chordPcs(chord).includes(pc(midi));
}

function hasMajorThird(chord: Chord): boolean {
  return chordPcs(chord).includes(pc(chord.root + 4));
}

/** The seventh of a seventh chord, if it has one. */
function seventhPc(chord: Chord): Pc | undefined {
  const pcs = chordPcs(chord);
  return pcs.length >= 4 ? pcs[3] : undefined;
}

// ---------------------------------------------------------------------------
// The rules
// ---------------------------------------------------------------------------

export const RULES: Rule[] = [
  // --- Melodic intervals -------------------------------------------------
  {
    id: 'augmented-second',
    category: 'melodic interval',
    description:
      'Augmented second between adjacent scale degrees (♭6→♮7 in harmonic minor). One scale step but three semitones. Sounds distinctly Middle Eastern; wrong for a singable idiom, and common because the generator reaches for harmonic minor over every dominant.',
    minLevel: 1, vetoLevel: 1, penalty: 0.02,
    test: ({ candidate, prev, scale }) => {
      if (prev === undefined) return false;
      if (Math.abs(candidate - prev) !== 3) return false;
      return Math.abs(scaleStepsBetween(scale, prev, candidate)) === 1;
    },
  },
  {
    id: 'tritone-leap',
    category: 'melodic interval',
    description: 'Melodic tritone. Classically forbidden — the line loses its footing.',
    minLevel: 1, vetoLevel: 1, penalty: 0.05,
    test: ({ candidate, prev }) => prev !== undefined && Math.abs(candidate - prev) === 6,
  },
  {
    id: 'seventh-leap',
    category: 'melodic interval',
    description: 'Leap of a major or minor seventh. Effectively unsingable.',
    minLevel: 1, vetoLevel: 1, penalty: 0.03,
    test: ({ candidate, prev }) => {
      if (prev === undefined) return false;
      const d = Math.abs(candidate - prev);
      return d === 10 || d === 11;
    },
  },
  {
    id: 'oversized-leap',
    category: 'melodic interval',
    description: 'Leap wider than an octave.',
    minLevel: 1, vetoLevel: 1, penalty: 0.02,
    test: ({ candidate, prev }) => prev !== undefined && Math.abs(candidate - prev) > 12,
  },
  {
    id: 'compound-leap',
    category: 'melodic interval',
    description:
      'A leap followed by another leap in the same direction. Fine occasionally when it outlines the chord, tiring when it does not.',
    minLevel: 2, vetoLevel: 3, penalty: 0.3,
    test: ({ candidate, prev, prevPrev, chord }) => {
      if (prev === undefined || prevPrev === undefined) return false;
      const a = prev - prevPrev;
      const b = candidate - prev;
      if (Math.abs(a) <= 4 || Math.abs(b) <= 2) return false;
      if (Math.sign(a) !== Math.sign(b)) return false;
      // Arpeggiating the current chord is idiomatic, not a fault.
      return !(isChordTone(candidate, chord) && isChordTone(prev, chord) && isChordTone(prevPrev, chord));
    },
  },

  // --- Tendency tones ----------------------------------------------------
  {
    id: 'unresolved-leading-tone',
    category: 'tendency tone',
    description:
      'The leading tone under a dominant chord must rise to the tonic. Leaving it hanging is the single most audible voice-leading error.',
    minLevel: 2, vetoLevel: 3, penalty: 0.25,
    test: ({ candidate, prev, prevChord, tonic }) => {
      if (prev === undefined || !prevChord?.dominantFunction) return false;
      if (pc(prev) !== leadingTonePc(tonic)) return false;
      // Resolution is up a semitone to the tonic; repeating the note is a stay
      // of execution, not a violation.
      return pc(candidate) !== tonic && candidate !== prev;
    },
  },
  {
    id: 'unresolved-seventh',
    category: 'tendency tone',
    description:
      'The seventh of a seventh chord should fall by step. Leaping away from it leaves the dissonance dangling.',
    minLevel: 2, vetoLevel: 3, penalty: 0.3,
    test: ({ candidate, prev, prevChord }) => {
      if (prev === undefined || !prevChord) return false;
      const seventh = seventhPc(prevChord);
      if (seventh === undefined || pc(prev) !== seventh) return false;
      const move = candidate - prev;
      if (move === 0) return false;
      return !(move < 0 && move >= -2);
    },
  },
  {
    id: 'unprepared-dissonance',
    category: 'tendency tone',
    description:
      'A non-chord tone arrived at by leap. Dissonance should be approached by step — that is what makes a passing note sound intentional.',
    minLevel: 2, vetoLevel: 3, penalty: 0.2,
    test: ({ candidate, prev, chord }) => {
      if (prev === undefined) return false;
      if (isChordTone(candidate, chord)) return false;
      return Math.abs(candidate - prev) > 2;
    },
  },

  // --- Monotony ----------------------------------------------------------
  {
    id: 'static-repetition',
    category: 'motion',
    description:
      'An immediately repeated note. Not a fault in itself, but once leaps are capped and beats want chord tones, repeating becomes the path of least resistance and the tune stops moving. A preference only — never vetoed.',
    minLevel: 3, vetoLevel: RULE_DISABLED, penalty: 0.4,
    test: ({ candidate, prev }) => prev !== undefined && candidate === prev,
  },
  {
    id: 'repeated-note-run',
    category: 'motion',
    description: 'Three or more identical notes in a row.',
    minLevel: 2, vetoLevel: 2, penalty: 0.15,
    test: ({ candidate, prev, prevPrev }) =>
      prev !== undefined && prevPrev !== undefined && candidate === prev && prev === prevPrev,
  },

  // --- Vertical: melody against the chord --------------------------------
  {
    id: 'flat-nine',
    category: 'melody vs chord',
    description:
      'A melody note a semitone above the chord root, held on a beat. The harshest interval available short of a cluster.',
    minLevel: 2, vetoLevel: 2, penalty: 0.1,
    test: ({ candidate, chord, strength, duration }) => {
      if (chord.quality === 'dom7b9') return false; // there it is the point
      // Same reasoning as semitone-clash: held, not brushed in passing.
      if (strength < 2 || duration < 0.5) return false;
      return degreeAboveRoot(candidate, chord) === 1;
    },
  },
  {
    id: 'avoid-fourth',
    category: 'melody vs chord',
    description:
      'A sustained perfect fourth above the root of a major-quality chord, clashing with its major third. Fine as a passing suspension, muddy when held.',
    minLevel: 3, vetoLevel: 4, penalty: 0.25,
    test: ({ candidate, chord, strength, duration }) => {
      if (chord.quality === 'sus4') return false;
      if (!hasMajorThird(chord)) return false;
      if (strength < 2 || duration < 1) return false;
      return degreeAboveRoot(candidate, chord) === 5;
    },
  },

  // --- Vertical: melody against the band ---------------------------------
  {
    id: 'semitone-clash',
    category: 'melody vs band',
    description:
      'A melody note a semitone or minor ninth from something the band is holding. The most common source of accidental sourness.',
    minLevel: 3, vetoLevel: 3, penalty: 0.12,
    test: ({ candidate, beat, strength, duration, accompaniment }) => {
      // Only a *sustained* clash on a beat is sour. A passing note that brushes
      // a semitone against a held chord tone is ordinary voice leading, and
      // forbidding it deletes the very neighbour tones that connect a line —
      // which measurably made 'strict' less smooth than no filtering at all.
      if (strength < 2 || duration < 0.5) return false;
      for (const other of accompaniment.soundingAt(beat)) {
        const d = Math.abs(candidate - other);
        if (d === 1 || d === 13) return true;
      }
      return false;
    },
  },
  {
    id: 'parallel-perfects',
    category: 'melody vs band',
    description:
      'Parallel fifths or octaves between melody and bass. Fuses the two lines into one and hollows out the texture.',
    minLevel: 3, vetoLevel: 4, penalty: 0.3,
    test: ({ candidate, prev, beat, accompaniment, strength }) => {
      if (prev === undefined || strength < 2) return false;
      const bassNow = accompaniment.bassAt(beat);
      if (bassNow === undefined) return false;
      // Approximate the previous bass by looking a beat back; good enough at
      // these harmonic rhythms.
      const bassPrev = accompaniment.bassAt(beat - 1);
      if (bassPrev === undefined) return false;

      const nowInterval = ((candidate - bassNow) % 12 + 12) % 12;
      const prevInterval = ((prev - bassPrev) % 12 + 12) % 12;
      const isPerfect = (i: number) => i === 0 || i === 7;
      if (!isPerfect(nowInterval) || !isPerfect(prevInterval)) return false;
      if (nowInterval !== prevInterval) return false;
      // Only parallel if both voices actually moved, in the same direction.
      const melodyMove = candidate - prev;
      const bassMove = bassNow - bassPrev;
      if (melodyMove === 0 || bassMove === 0) return false;
      return Math.sign(melodyMove) === Math.sign(bassMove);
    },
  },

  // --- Maximum smoothing -------------------------------------------------
  {
    id: 'chromatic-tone',
    category: 'melody vs chord',
    description: 'A note outside the prevailing scale.',
    minLevel: 4, vetoLevel: 4, penalty: 0.1,
    test: ({ candidate, scale, chord }) =>
      !scale.pcs.includes(pc(candidate)) && !isChordTone(candidate, chord),
  },
  {
    id: 'non-chord-tone-on-strong-beat',
    category: 'melody vs chord',
    description:
      'A non-chord tone on a downbeat or half-bar. Restricted to *strong* beats on purpose: forcing a chord tone onto every quarter removes the passing notes that connect a line, and turns the melody into an arpeggio.',
    minLevel: 3, vetoLevel: 4, penalty: 0.2,
    test: ({ candidate, chord, strength }) => strength >= 3 && !isChordTone(candidate, chord),
  },

  // --- Melodic smoothness ------------------------------------------------
  // These exist to counterbalance everything above. The vertical rules all
  // push the melody toward chord tones, and chord tones are thirds apart — so
  // without a countervailing pressure, raising strictness makes a line *less*
  // smooth, not more. Measured before these were added: stepwise motion fell
  // from 72% at 'standard' to 50% at 'polished', and wide leaps doubled.
  {
    id: 'wide-leap',
    category: 'melodic interval',
    description:
      'A leap beyond a perfect fourth. Vetoed at the level where the vertical rules begin pushing the line onto chord tones, so it has a counterweight.',
    minLevel: 2, vetoLevel: 3, penalty: 0.3,
    test: ({ candidate, prev }) => prev !== undefined && Math.abs(candidate - prev) > 5,
  },
  {
    id: 'leap-beyond-third',
    category: 'melodic interval',
    description:
      'Any motion wider than a major third. At the smoothest setting the line should walk, not jump.',
    minLevel: 4, vetoLevel: 4, penalty: 0.25,
    test: ({ candidate, prev }) => prev !== undefined && Math.abs(candidate - prev) > 4,
  },
  {
    id: 'unidiomatic-leap',
    category: 'melodic interval',
    description:
      'A leap wider than the instrument comfortably plays. A tenth is nothing on a vibraphone and a real problem on a trombone, so the threshold follows the instrument rather than a fixed number.',
    minLevel: 1, vetoLevel: 3, penalty: 0.12,
    test: ({ candidate, prev, agility }) => {
      if (prev === undefined) return false;
      return Math.abs(candidate - prev) > comfortableLeap(agility);
    },
  },
];

/**
 * Widest leap an instrument handles without sounding laboured, in semitones.
 * Keyboards and mallets reach an octave and beyond; brass and reeds want to
 * stay inside a sixth.
 */
export function comfortableLeap(agility: number): number {
  // 0.4 (trombone) -> 7 semitones; 0.6 (sax) -> 9; 1.0 (vibraphone) -> 12.
  // The low end has to sit inside the range melodies actually use, or the rule
  // never fires and "instrument-aware" means nothing.
  return Math.round(4 + agility * 8);
}

export const RULES_BY_ID = new Map(RULES.map((r) => [r.id, r]));

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

/** Per-genre adjustments to a rule's thresholds. */
export interface RuleOverride {
  minLevel?: number;
  vetoLevel?: number;
  penalty?: number;
}

export type RuleOverrides = Record<string, RuleOverride>;

/**
 * Apply a genre's overrides to the rule table.
 *
 * The rules encode faults that classical and jazz practice mostly agree on,
 * but not entirely: a jazz line is not obliged to resolve its leading tone,
 * and bebop's chromaticism is the point rather than a defect. Rather than fork
 * the table per genre, each genre nudges the thresholds it disagrees with.
 */
export function resolveRules(overrides?: RuleOverrides): Rule[] {
  if (!overrides) return RULES;
  return RULES.map((rule) => {
    const o = overrides[rule.id];
    return o ? { ...rule, ...o } : rule;
  });
}

export interface Verdict {
  /** True when a rule at or above its veto level was broken. */
  vetoed: boolean;
  /** Product of the penalties of all broken non-vetoing rules. */
  weight: number;
  violations: string[];
}

export function evaluate(ctx: NoteContext, level: number, rules: Rule[] = RULES): Verdict {
  let weight = 1;
  let vetoed = false;
  const violations: string[] = [];

  for (const rule of rules) {
    if (level < rule.minLevel) continue;
    if (!rule.test(ctx)) continue;
    violations.push(rule.id);
    if (level >= rule.vetoLevel) vetoed = true;
    else weight *= rule.penalty;
  }
  return { vetoed, weight, violations };
}

/** Every rule violated by a note, ignoring levels. Used by the audit. */
export function violationsOf(ctx: NoteContext, rules: Rule[] = RULES): string[] {
  return rules.filter((r) => r.test(ctx)).map((r) => r.id);
}

// ---------------------------------------------------------------------------
// Accompaniment index
// ---------------------------------------------------------------------------

/**
 * Build a lookup of what the band is playing, quantised to sixteenths.
 *
 * Melody is generated after bass, comp and pad, so by this point we genuinely
 * know what the melody has to fit against — which is what makes the vertical
 * rules possible at all.
 */
export function buildAccompaniment(sources: readonly NoteEvent[][]): Accompaniment {
  const RES = 4; // slots per beat
  const sounding = new Map<number, Midi[]>();
  const bass = new Map<number, Midi>();

  for (const notes of sources) {
    for (const n of notes) {
      const from = Math.round(n.beat * RES);
      const to = Math.max(from + 1, Math.round((n.beat + n.duration) * RES));
      for (let s = from; s < to; s++) {
        const arr = sounding.get(s);
        if (arr) arr.push(n.midi);
        else sounding.set(s, [n.midi]);
        const b = bass.get(s);
        if (b === undefined || n.midi < b) bass.set(s, n.midi);
      }
    }
  }

  return {
    soundingAt: (beat) => sounding.get(Math.round(beat * RES)) ?? [],
    bassAt: (beat) => bass.get(Math.round(beat * RES)),
  };
}
