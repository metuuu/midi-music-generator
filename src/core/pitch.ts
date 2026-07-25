/**
 * Pitch primitives. MIDI note numbers are the canonical representation
 * everywhere in this codebase; note names exist only for display and for the
 * Strudel renderer's mini-notation output.
 */

export type Midi = number;
/** Pitch class, 0..11, where 0 = C. */
export type Pc = number;

const SHARP_NAMES = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'] as const;
const FLAT_NAMES = ['c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'] as const;

/** Keys iskelmä actually lives in: singable, guitar/accordion-friendly. */
export const NOTE_NAMES_BY_KEY_PREFERENCE = { sharp: SHARP_NAMES, flat: FLAT_NAMES };

export function pc(midi: Midi): Pc {
  return ((midi % 12) + 12) % 12;
}

export function octaveOf(midi: Midi): number {
  return Math.floor(midi / 12) - 1;
}

/**
 * Note name in scientific pitch notation, e.g. 60 -> "c4".
 *
 * This matches Strudel's own `noteToMidi`, which computes
 * `(octave + 1) * 12 + pitchClass` — so middle C is `c4`, not `c5`. Getting
 * this wrong transposes the entire render by an octave.
 */
export function midiToNoteName(midi: Midi, spelling: 'sharp' | 'flat' = 'flat'): string {
  const names = spelling === 'flat' ? FLAT_NAMES : SHARP_NAMES;
  return `${names[pc(midi)]}${octaveOf(midi)}`;
}

const NAME_TO_PC: Record<string, number> = {
  c: 0, 'c#': 1, db: 1, d: 2, 'd#': 3, eb: 3, e: 4, f: 5,
  'f#': 6, gb: 6, g: 7, 'g#': 8, ab: 8, a: 9, 'a#': 10, bb: 10, b: 11,
};

export function noteNameToPc(name: string): Pc {
  const v = NAME_TO_PC[name.toLowerCase()];
  if (v === undefined) throw new Error(`Unknown note name: ${name}`);
  return v;
}

/**
 * Whether a key is conventionally written with sharps or flats.
 * Cosmetic, but it decides whether the generated Strudel reads "f#3" or "gb3" —
 * and a tango in F# minor spelled in flats looks wrong to anyone reading it.
 */
export function spellingFor(tonic: Pc, mode: 'major' | 'minor'): 'sharp' | 'flat' {
  const sharpKeys = mode === 'minor'
    ? [9, 4, 11, 6, 1, 8]   // A, E, B, F#, C#, G# minor
    : [0, 7, 2, 9, 4, 11, 6]; // C, G, D, A, E, B, F# major
  return sharpKeys.includes(tonic) ? 'sharp' : 'flat';
}

/** Human-readable key label, e.g. (9, 'minor') -> "A minor". */
export function keyLabel(tonic: Pc, mode: 'major' | 'minor'): string {
  const names = spellingFor(tonic, mode) === 'sharp' ? SHARP_NAMES : FLAT_NAMES;
  const n = names[tonic]!;
  return `${n.charAt(0).toUpperCase()}${n.slice(1)} ${mode}`;
}

/**
 * Move `midi` into the register window [lo, hi] by whole octaves, preserving
 * pitch class. Used constantly to keep generated lines singable.
 */
export function clampToRange(midi: Midi, lo: Midi, hi: Midi): Midi {
  let m = midi;
  while (m < lo) m += 12;
  while (m > hi) m -= 12;
  // If the window is narrower than an octave we may have overshot; pick nearest.
  if (m < lo) {
    const up = m + 12;
    return Math.abs(up - hi) < Math.abs(lo - m) ? up : lo;
  }
  return m;
}

/** Nearest MIDI note with the given pitch class to a reference note. */
export function nearestPc(target: Pc, reference: Midi): Midi {
  const base = Math.floor(reference / 12) * 12 + target;
  let best = base;
  let bestDist = Math.abs(base - reference);
  for (const cand of [base - 12, base + 12]) {
    const d = Math.abs(cand - reference);
    if (d < bestDist) {
      best = cand;
      bestDist = d;
    }
  }
  return best;
}
