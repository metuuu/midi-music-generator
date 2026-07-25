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
