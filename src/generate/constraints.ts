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

import type { Chord } from '../core/chord.js';
import { chordPcs } from '../core/chord.js';
import type { Midi, Pc } from '../core/pitch.js';
import { pc } from '../core/pitch.js';
import type { Mode, Scale } from '../core/scale.js';
import { scaleStepsBetween } from '../core/scale.js';
import type { NoteEvent } from '../core/types.js';

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
}

export interface Rule {
  id: string;
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
    description:
      'Augmented second between adjacent scale degrees (♭6→♮7 in harmonic minor). One scale step but three semitones; it sounds exotic and wrong for iskelmä.',
    minLevel: 1, vetoLevel: 1, penalty: 0.02,
    test: ({ candidate, prev, scale }) => {
      if (prev === undefined) return false;
      if (Math.abs(candidate - prev) !== 3) return false;
      return Math.abs(scaleStepsBetween(scale, prev, candidate)) === 1;
    },
  },
  {
    id: 'tritone-leap',
    description: 'Melodic tritone. Classically forbidden — the line loses its footing.',
    minLevel: 1, vetoLevel: 1, penalty: 0.05,
    test: ({ candidate, prev }) => prev !== undefined && Math.abs(candidate - prev) === 6,
  },
  {
    id: 'seventh-leap',
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
    description: 'Leap wider than an octave.',
    minLevel: 1, vetoLevel: 1, penalty: 0.02,
    test: ({ candidate, prev }) => prev !== undefined && Math.abs(candidate - prev) > 12,
  },
  {
    id: 'compound-leap',
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
    id: 'repeated-note-run',
    description: 'Three or more identical notes in a row.',
    minLevel: 2, vetoLevel: 2, penalty: 0.15,
    test: ({ candidate, prev, prevPrev }) =>
      prev !== undefined && prevPrev !== undefined && candidate === prev && prev === prevPrev,
  },

  // --- Vertical: melody against the chord --------------------------------
  {
    id: 'flat-nine',
    description:
      'A melody note a semitone above the chord root, held on a beat. The harshest interval available short of a cluster.',
    minLevel: 2, vetoLevel: 2, penalty: 0.1,
    test: ({ candidate, chord, strength, duration }) => {
      if (chord.quality === 'dom7b9') return false; // there it is the point
      if (strength < 2 && duration < 0.5) return false;
      return degreeAboveRoot(candidate, chord) === 1;
    },
  },
  {
    id: 'avoid-fourth',
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
    description:
      'A melody note a semitone or minor ninth from something the band is holding. The most common source of accidental sourness.',
    minLevel: 3, vetoLevel: 3, penalty: 0.12,
    test: ({ candidate, beat, strength, duration, accompaniment }) => {
      if (strength < 2 && duration < 0.5) return false;
      for (const other of accompaniment.soundingAt(beat)) {
        const d = Math.abs(candidate - other);
        if (d === 1 || d === 13) return true;
      }
      return false;
    },
  },
  {
    id: 'parallel-perfects',
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
    description: 'A note outside the prevailing scale.',
    minLevel: 4, vetoLevel: 4, penalty: 0.1,
    test: ({ candidate, scale, chord }) =>
      !scale.pcs.includes(pc(candidate)) && !isChordTone(candidate, chord),
  },
  {
    id: 'non-chord-tone-on-beat',
    description: 'Any non-chord tone falling on a beat.',
    minLevel: 4, vetoLevel: 4, penalty: 0.08,
    test: ({ candidate, chord, strength }) => strength >= 2 && !isChordTone(candidate, chord),
  },
];

export const RULES_BY_ID = new Map(RULES.map((r) => [r.id, r]));

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

export interface Verdict {
  /** True when a rule at or above its veto level was broken. */
  vetoed: boolean;
  /** Product of the penalties of all broken non-vetoing rules. */
  weight: number;
  violations: string[];
}

export function evaluate(ctx: NoteContext, level: number): Verdict {
  let weight = 1;
  let vetoed = false;
  const violations: string[] = [];

  for (const rule of RULES) {
    if (level < rule.minLevel) continue;
    if (!rule.test(ctx)) continue;
    violations.push(rule.id);
    if (level >= rule.vetoLevel) vetoed = true;
    else weight *= rule.penalty;
  }
  return { vetoed, weight, violations };
}

/** Every rule violated by a note, ignoring levels. Used by the audit. */
export function violationsOf(ctx: NoteContext): string[] {
  return RULES.filter((r) => r.test(ctx)).map((r) => r.id);
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
