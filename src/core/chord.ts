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
import { nearestPc, pc } from './pitch.js';
import type { Mode } from './scale.js';
import { SCALE_STEPS } from './scale.js';

export type ChordQuality =
  | 'maj' | 'min' | 'dim' | 'aug'
  | 'maj6' | 'min6'
  | 'dom7' | 'min7' | 'maj7' | 'dim7' | 'halfdim7' | 'minmaj7'
  | 'sus4' | 'sus2' | 'dom9' | 'dom7b9';

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
  dom9: [0, 4, 7, 10, 14],
  dom7b9: [0, 4, 7, 10, 13],
};

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
 * `V9` `V7b9` `III+`, and secondary dominants `V/V`, `V7/iv`, `viio7/V`.
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
    case '9': return 'dom9';
    case '7b9': return 'dom7b9';
    case '+': return 'aug';
    case 'o': return 'dim';
    case 'o7': return 'dim7';
    case '%7': return 'halfdim7';
    case 'sus4': return 'sus4';
    case 'sus2': return 'sus2';
    default:
      throw new Error(`Unknown chord suffix "${s}" in ${symbol}`);
  }
}

/**
 * Voice a chord as `voices` notes near `centre`, moving as little as possible
 * from `previous`.
 *
 * Greedy nearest-tone voice leading. It is not a full Schoenberg-grade solver,
 * but for triadic dance-band comping it produces exactly what a keyboard or
 * accordion player does: keep common tones, move the rest by step.
 */
export function voiceChord(
  chord: Chord,
  opts: { voices: number; centre: Midi; previous?: Midi[]; lo?: Midi; hi?: Midi },
): Midi[] {
  const { voices, centre, previous } = opts;
  const lo = opts.lo ?? centre - 12;
  const hi = opts.hi ?? centre + 12;
  const pcs = chordPcs(chord);

  // Choose which chord tones to use when the chord has more tones than voices
  // (drop the 5th first — standard practice), or double the root when it has
  // fewer.
  const chosen: Pc[] = [];
  const priority = pcs.length >= 4 ? [0, 2, 3, 1] : [0, 1, 2];
  for (const p of priority) if (pcs[p] !== undefined) chosen.push(pcs[p]!);
  while (chosen.length > voices) chosen.pop();
  while (chosen.length < voices) chosen.push(pcs[chosen.length % pcs.length]!);

  const anchors = previous && previous.length ? previous : [centre];
  const out: Midi[] = [];
  const used = new Set<number>();
  for (let i = 0; i < chosen.length; i++) {
    const anchor = anchors[Math.min(i, anchors.length - 1)] ?? centre;
    let note = nearestPc(chosen[i]!, anchor);
    while (note < lo) note += 12;
    while (note > hi) note -= 12;
    // Avoid stacking two voices on the identical note; nudge by an octave.
    let guard = 0;
    while (used.has(note) && guard++ < 3) note += 12;
    if (note > hi) note -= 12;
    used.add(note);
    out.push(note);
  }
  return out.sort((a, b) => a - b);
}
