/**
 * Chords and roman-numeral parsing.
 *
 * Degrees are interpreted *relative to the mode*, the way a dance-band arranger
 * would read them: in A minor, `VII` means G major (natural minor 7th degree),
 * not G#. That convention keeps the iskelmä progression tables readable —
 * `i VII VI V7` is the descending tango bass everyone recognises, and writing
 * it as `i bVII bVI V7` would just add noise.
 */

import type { Midi, Pc } from './pitch.js';
import { pc } from './pitch.js';
import type { Mode } from './scale.js';
import { SCALE_STEPS } from './scale.js';

export type ChordQuality =
  | 'maj' | 'min' | 'dim' | 'aug'
  | 'maj6' | 'min6'
  | 'dom7' | 'min7' | 'maj7' | 'dim7' | 'halfdim7' | 'minmaj7'
  | 'sus4' | 'sus2' | 'dom7sus4' | 'dom9' | 'dom7b9'
  // Jazz extensions. Stored as full stacks; the voicer decides what to keep.
  | 'maj9' | 'min9' | 'dom13' | 'dom7sharp9' | 'dom7sharp5' | 'dom7flat5' | 'min11';

/** Semitone offsets from the chord root. */
export const CHORD_INTERVALS: Record<ChordQuality, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  maj6: [0, 4, 7, 9],
  min6: [0, 3, 7, 9],
  dom7: [0, 4, 7, 10],
  min7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  dim7: [0, 3, 6, 9],
  halfdim7: [0, 3, 6, 10],
  minmaj7: [0, 3, 7, 11],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  /**
   * The suspended dominant — a fourth where the third would be, over a seventh.
   *
   * Not a decorated `sus4` and not a `dom7` waiting to be fixed. A plain sus4
   * triad is a suspension, which by definition wants to resolve; adding the
   * seventh turns it into a chord that is content to sit there, and sitting
   * there is the entire point. It is the sound of a V that never arrives, which
   * is most of what separates the harmony after 1959 from the harmony before it.
   */
  dom7sus4: [0, 5, 7, 10],
  dom9: [0, 4, 7, 10, 14],
  dom7b9: [0, 4, 7, 10, 13],
  maj9: [0, 4, 7, 11, 14],
  min9: [0, 3, 7, 10, 14],
  min11: [0, 3, 7, 10, 17],
  dom13: [0, 4, 7, 10, 14, 21],
  dom7sharp9: [0, 4, 7, 10, 15],
  dom7sharp5: [0, 4, 8, 10],
  dom7flat5: [0, 4, 6, 10],
};

/** Dominant chords carrying an alteration — they call for the altered scale. */
export function isAlteredDominant(quality: ChordQuality): boolean {
  return quality === 'dom7b9' || quality === 'dom7sharp9'
    || quality === 'dom7sharp5' || quality === 'dom7flat5';
}

export interface Chord {
  /** Absolute pitch class of the root. */
  root: Pc;
  quality: ChordQuality;
  /** The numeral this came from, kept for debugging and for the Strudel comments. */
  label: string;
  /** True when this chord has dominant function and should force a leading tone. */
  dominantFunction: boolean;
}

export function chordPcs(chord: Chord): Pc[] {
  return CHORD_INTERVALS[chord.quality].map((i) => pc(chord.root + i));
}

/** Chord tones as MIDI notes at or above `from`, spanning one octave. */
export function chordTonesFrom(chord: Chord, from: Midi): Midi[] {
  const base = Math.floor(from / 12) * 12;
  const out: Midi[] = [];
  for (const p of chordPcs(chord)) {
    let m = base + p;
    while (m < from) m += 12;
    out.push(m);
  }
  return out.sort((a, b) => a - b);
}

const ROMAN_TO_INDEX: Record<string, number> = {
  i: 0, ii: 1, iii: 2, iv: 3, v: 4, vi: 5, vii: 6,
};

const NUMERAL_RE = /^([b#]?)([ivIV]+)(.*)$/;

/**
 * Parse a roman numeral in the context of a mode.
 *
 * Supported: `i` `IV` `V7` `bII` `#iv` `ii7` `viio7` `ii%7` `I6` `i6` `Isus4`
 * `V9` `V7b9` `V7sus4` `III+`, and secondary dominants `V/V`, `V7/iv`, `viio7/V`.
 */
export function parseRoman(symbol: string, mode: Mode): Chord {
  const slash = symbol.indexOf('/');
  if (slash >= 0) {
    const applied = symbol.slice(0, slash);
    const targetSym = symbol.slice(slash + 1);
    // Resolve the target's root, then build the applied chord relative to it.
    const target = parseRoman(targetSym, mode);
    const appliedChord = parseRoman(applied, 'major'); // secondary chords are read in major
    const offsetFromTonic = rootOffset(applied, 'major');
    const root = pc(target.root + offsetFromTonic);
    return {
      root,
      quality: appliedChord.quality,
      label: symbol,
      dominantFunction: true,
    };
  }

  const m = NUMERAL_RE.exec(symbol);
  if (!m) throw new Error(`Cannot parse roman numeral: ${symbol}`);
  const [, accidental, numeral, suffix] = m as unknown as [string, string, string, string];
  const idx = ROMAN_TO_INDEX[numeral.toLowerCase()];
  if (idx === undefined) throw new Error(`Unknown roman numeral: ${symbol}`);

  const isUpper = numeral === numeral.toUpperCase();
  const quality = qualityFor(isUpper, suffix, symbol);
  const root = pc(rootOffset(symbol, mode));

  return {
    root,
    quality,
    label: symbol,
    // V and vii° are the dominant-function chords; in minor these are exactly
    // the places where the raised 7th belongs.
    dominantFunction:
      (idx === 4 && (quality === 'maj' || quality.startsWith('dom'))) ||
      (idx === 6 && (quality === 'dim' || quality === 'dim7' || quality === 'halfdim7')),
  };
}

/** Semitone offset of the numeral's root above the tonic, mode-aware. */
function rootOffset(symbol: string, mode: Mode): number {
  const m = NUMERAL_RE.exec(symbol);
  if (!m) throw new Error(`Cannot parse roman numeral: ${symbol}`);
  const [, accidental, numeral] = m as unknown as [string, string, string, string];
  const idx = ROMAN_TO_INDEX[numeral.toLowerCase()];
  if (idx === undefined) throw new Error(`Unknown roman numeral: ${symbol}`);
  let semis = SCALE_STEPS[mode][idx]!;
  if (accidental === 'b') semis -= 1;
  if (accidental === '#') semis += 1;
  return ((semis % 12) + 12) % 12;
}

function qualityFor(isUpper: boolean, suffix: string, symbol: string): ChordQuality {
  const s = suffix.trim();
  switch (s) {
    case '': return isUpper ? 'maj' : 'min';
    case '7': return isUpper ? 'dom7' : 'min7';
    case '6': return isUpper ? 'maj6' : 'min6';
    case 'maj7': return isUpper ? 'maj7' : 'minmaj7';
    case 'maj9': return 'maj9';
    case '9': return isUpper ? 'dom9' : 'min9';
    case '11': return 'min11';
    case '13': return 'dom13';
    case '7b9': return 'dom7b9';
    case '7#9': return 'dom7sharp9';
    case '7#5': return 'dom7sharp5';
    case '7b5': return 'dom7flat5';
    case '+': return 'aug';
    case 'o': return 'dim';
    case 'o7': return 'dim7';
    case '%7': return 'halfdim7';
    case 'sus4': return 'sus4';
    case 'sus2': return 'sus2';
    case '7sus4': return 'dom7sus4';
    default:
      throw new Error(`Unknown chord suffix "${s}" in ${symbol}`);
  }
}
