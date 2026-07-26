/**
 * Scales, with the minor-mode handling that iskelmä actually requires.
 *
 * Finnish tango and most minor-key iskelmä is *natural minor melodically but
 * harmonic minor cadentially*: the melody sits in aeolian, but the moment the
 * dominant arrives the 7th degree is raised to give a real leading tone.
 * Writing the two as separate scales and choosing per-chord is the only way to
 * get this right — a single "minor scale" always sounds wrong somewhere.
 */

import type { Midi, Pc } from './pitch.js';
import { pc } from './pitch.js';

export type Mode = 'major' | 'minor';

export const SCALE_STEPS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  /** Aeolian. The default melodic material in minor keys. */
  minor: [0, 2, 3, 5, 7, 8, 10],
  /** Raised 7. Used over dominant-function chords in minor. */
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  /** Raised 6 and 7. Used for ascending approach into the leading tone. */
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],

  // --- Modes and scales the jazz genre needs -----------------------------
  // Jazz melody follows the *chord* rather than the key, so each chord
  // quality gets its own scale. These are the ones that mapping needs.
  /** Minor 7th chords. The default minor sound in jazz, not aeolian. */
  dorian: [0, 2, 3, 5, 7, 9, 10],
  /** Unaltered dominant 7th chords. */
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  /** Major 7th chords wanting a #11 colour. */
  lydian: [0, 2, 4, 6, 7, 9, 11],
  /** Flat 2. The darkest mode ambient reaches for; the sound of a ♭II drone. */
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  /** Half-diminished chords. */
  locrian: [0, 1, 3, 5, 6, 8, 10],
  /** Whole-half diminished, for fully diminished sevenths. Eight notes. */
  diminished: [0, 2, 3, 5, 6, 8, 9, 11],
  /** Six-note blues scale — the ♭3, ♭5 and ♭7 blue notes. */
  blues: [0, 3, 5, 6, 7, 10],
  /** Mixolydian plus a passing major 7th, so chord tones land on the beat. */
  bebopDominant: [0, 2, 4, 5, 7, 9, 10, 11],
} as const satisfies Record<string, readonly number[]>;

export type ScaleName = keyof typeof SCALE_STEPS;

export interface Scale {
  tonic: Pc;
  name: ScaleName;
  /** Absolute pitch classes of the scale, ascending from the tonic. */
  pcs: Pc[];
}

export function makeScale(tonic: Pc, name: ScaleName): Scale {
  return { tonic, name, pcs: SCALE_STEPS[name].map((s) => pc(tonic + s)) };
}

/** Diatonic degree (0-based) of a MIDI note, or -1 if chromatic. */
export function degreeOf(scale: Scale, midi: Midi): number {
  return scale.pcs.indexOf(pc(midi));
}

export function isInScale(scale: Scale, midi: Midi): boolean {
  return degreeOf(scale, midi) >= 0;
}

/**
 * Convert a scale degree index (may be negative or beyond 6, meaning other
 * octaves) into a MIDI note, anchored so that degree 0 in octave `octave` is
 * the tonic.
 */
export function degreeToMidi(scale: Scale, degree: number, octave: number): Midi {
  const len = scale.pcs.length;
  const oct = Math.floor(degree / len);
  const idx = ((degree % len) + len) % len;
  const step = SCALE_STEPS[scale.name][idx]!;
  return (octave + 1) * 12 + scale.tonic + step + oct * 12;
}

/**
 * Snap a MIDI note to the nearest scale tone. Ties resolve downward, which
 * keeps descending melodic lines smooth — the common case in iskelmä phrase
 * endings.
 */
export function snapToScale(scale: Scale, midi: Midi): Midi {
  for (let d = 0; d <= 6; d++) {
    if (scale.pcs.includes(pc(midi - d))) return midi - d;
    if (scale.pcs.includes(pc(midi + d))) return midi + d;
  }
  return midi;
}

/**
 * Step `steps` scale degrees from a note that is assumed to be in the scale.
 * If it isn't, it is snapped first.
 */
/**
 * Signed number of scale steps from `a` to `b`.
 *
 * Used both to store motif shapes for transposition and to tell a real step
 * from a leap that merely looks small in semitones — the augmented second
 * between ♭6 and ♮7 in harmonic minor is one scale step but three semitones,
 * and that distinction is exactly what makes it forbidden.
 */
export function scaleStepsBetween(scale: Scale, a: Midi, b: Midi): number {
  const sa = snapToScale(scale, a);
  const sb = snapToScale(scale, b);
  if (sa === sb) return 0;
  const dir = sb > sa ? 1 : -1;
  let cur = sa;
  for (let n = 1; n <= 24; n++) {
    cur = stepInScale(scale, cur, dir);
    if ((dir > 0 && cur >= sb) || (dir < 0 && cur <= sb)) return n * dir;
  }
  return Math.round((b - a) / 2);
}

export function stepInScale(scale: Scale, midi: Midi, steps: number): Midi {
  const snapped = snapToScale(scale, midi);
  const len = scale.pcs.length;
  const idx = scale.pcs.indexOf(pc(snapped));
  if (idx < 0) return snapped; // unreachable after snapping, but keeps types honest
  // Recover the exact tonic below `snapped`: it sits `stepSemis` semitones down.
  const tonicMidi = snapped - SCALE_STEPS[scale.name][idx]!;
  const target = idx + steps;
  const octShift = Math.floor(target / len);
  const newIdx = ((target % len) + len) % len;
  return tonicMidi + octShift * 12 + SCALE_STEPS[scale.name][newIdx]!;
}
