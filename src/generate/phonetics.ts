/**
 * Words -> syllables. The sound of a word, as a pure function of the word.
 *
 * The requirement is easy to state and slightly awkward to satisfy: the same
 * word must always sound the same, different words must sound clearly
 * different, and none of it may need a pronunciation dictionary, because the
 * text is going to be Finnish, or English, or an invented place name, and no
 * dictionary covers all three.
 *
 * A hash gets you most of the way. Hash the word, use the bits to pick vowels:
 * stable by construction, and as separated as the hash function is uniform.
 * But a pure hash throws away information that is sitting right there — the
 * word already contains vowels, and they are already a rough description of how
 * it sounds. Hashing "kuutamo" and "hiljaisuus" into random vowels means the
 * dark word might come out bright, and the ear notices, because it can read the
 * word on the screen at the same time.
 *
 * So this does both, on a slider:
 *
 *  - **The letters choose the region.** Each vowel letter of the word maps to a
 *    point in the openness/frontness plane — `u` is closed and back, `i` is
 *    closed and front, `a` is open. That fixes roughly where in the mouth the
 *    syllable happens.
 *  - **The hash chooses the vowel within it.** Which of the palette's vowels
 *    near that point actually gets used, and everything the letters cannot
 *    say — the consonants of the interior syllables, and which syllables get
 *    one at all.
 *  - **Separation is enforced afterwards.** A candidate too close to the
 *    previous syllable's vowel in that same plane is heavily penalised, so a
 *    word never comes out as one vowel repeated. This is the part that actually
 *    stops "duu du du duu": the vowels are guaranteed to move, whatever the
 *    letters and the hash between them wanted.
 *
 * At `spelling: 0` the letters are ignored and it is a pure hash; at 1 they
 * dominate. Both ends are useful and the interesting settings are in between.
 *
 * Consonants are deliberately thin. Two reasons, and the second is the real
 * one: this synthesises manner of articulation rather than phonemes, so a
 * consonant on every syllable reads as clatter rather than as speech; and a
 * line built mostly of vowel-to-vowel motion is what makes a voice sound
 * floating rather than chopped. So the word's *first* letter usually decides
 * its opening consonant — which is what makes "moon" hum and "tale" click —
 * and the syllables after it are usually bare.
 */

import type { Consonant, Vowel } from '../core/types.js';
import { hashString } from '../core/rng.js';
import { VOWEL_FRONTNESS, VOWEL_OPENNESS } from '../style/vocals.js';

/** One syllable, fully specified. No coda: see the note on consonants above. */
export interface Syllable {
  onset: Consonant;
  vowel: Vowel;
  /** Carries the word's stress — longer, louder, and it is where melisma goes. */
  stress: boolean;
}

export interface PhoneticWord {
  /** The word as written, for display. */
  text: string;
  /** Its hash, shown in the lab so a word's identity is visible. */
  hash: number;
  syllables: Syllable[];
  /** Punctuation followed this word — take a breath. */
  breakAfter: boolean;
}

/**
 * The vocabulary and habits of a voice — everything that decides what a *word*
 * sounds like, as distinct from who is saying it or how they are performing it.
 */
export interface PhoneticStyle {
  /** The vowels this voice uses at all, and how much it favours each. */
  vowels: (readonly [Vowel, number])[];
  /** Which consonant manners it reaches for, when it reaches for one. */
  consonants: (readonly [Consonant, number])[];
  /** 0 = the word's letters are ignored; 1 = they choose the vowels outright. */
  spelling: number;
  /**
   * Minimum distance in the openness/frontness plane between the vowels of
   * neighbouring syllables. About 0.25 is "audibly a different vowel"; above
   * 0.5 the palette starts running out of legal moves and the rule relaxes
   * itself rather than failing.
   */
  separation: number;
  /** Chance the first syllable of a word gets a consonant onset, 0..1. */
  onsetDensity: number;
  /** Chance a later syllable does. Keep this low — it is the floatiness knob. */
  interiorDensity: number;
  /** Cap on syllables per word, however long the word is. */
  maxSyllables: number;
}

/**
 * Preset vocabularies.
 *
 * These are palettes rather than languages. `finnish` is the one the iskelmä
 * genre wants — Finnish is a front-rounded language and its popular singing
 * sits in that colour, so a voice built only from the five cardinal vowels
 * sounds Italian. `wide` exists to hear the whole formant table at once.
 */
export const PHONETIC_STYLES: Record<string, PhoneticStyle> = {
  finnish: {
    vowels: [['a', 4], ['o', 4], ['u', 3], ['e', 3], ['i', 2.5], ['ae', 3], ['oe', 3], ['y', 2], ['aa', 2]],
    consonants: [['liquid', 5], ['nasal', 4], ['stop', 2.5], ['fricative', 1]],
    spelling: 0.8,
    separation: 0.3,
    onsetDensity: 0.85,
    interiorDensity: 0.35,
    maxSyllables: 4,
  },
  open: {
    vowels: [['a', 5], ['o', 4], ['u', 3], ['e', 3], ['i', 2]],
    consonants: [['liquid', 5], ['nasal', 5], ['stop', 2], ['fricative', 0.8]],
    spelling: 0.7,
    separation: 0.32,
    onsetDensity: 0.8,
    interiorDensity: 0.3,
    maxSyllables: 4,
  },
  dark: {
    vowels: [['o', 5], ['u', 4], ['aa', 3], ['oe', 3], ['a', 2.5], ['uh', 2], ['ue', 1.5]],
    consonants: [['nasal', 6], ['liquid', 4], ['stop', 1.5]],
    spelling: 0.6,
    separation: 0.24,
    onsetDensity: 0.7,
    interiorDensity: 0.22,
    maxSyllables: 4,
  },
  bright: {
    vowels: [['i', 4], ['e', 4], ['ae', 3.5], ['a', 3], ['y', 2.5], ['en', 2], ['oe', 2]],
    consonants: [['liquid', 4], ['stop', 3], ['nasal', 3], ['fricative', 2]],
    spelling: 0.7,
    separation: 0.3,
    onsetDensity: 0.9,
    interiorDensity: 0.4,
    maxSyllables: 4,
  },
  nasal: {
    vowels: [['an', 4], ['on', 4], ['en', 3], ['un', 3], ['a', 2], ['o', 2], ['e', 1.5]],
    consonants: [['nasal', 8], ['liquid', 3], ['none', 2]],
    spelling: 0.5,
    separation: 0.22,
    onsetDensity: 0.6,
    interiorDensity: 0.3,
    maxSyllables: 4,
  },
  wide: {
    vowels: [
      ['a', 3], ['e', 3], ['i', 3], ['o', 3], ['u', 3],
      ['ae', 2], ['aa', 2], ['oe', 2], ['ue', 2], ['y', 2], ['uh', 2],
      ['an', 1], ['en', 1], ['on', 1], ['un', 1],
    ],
    consonants: [['liquid', 4], ['nasal', 4], ['stop', 3], ['fricative', 2]],
    spelling: 0.7,
    separation: 0.35,
    onsetDensity: 0.85,
    interiorDensity: 0.35,
    maxSyllables: 5,
  },
};

export const PHONETIC_STYLE_ORDER = Object.keys(PHONETIC_STYLES);

/**
 * Where each written vowel sits in the openness/frontness plane.
 *
 * These are the positions the letters *claim*, not measurements — the point is
 * to place the letter in the same space the palette's vowels live in, so the
 * two can be compared. Close enough for every language that spells its vowels
 * roughly the way the IPA does, which is most of Europe, and where it is wrong
 * (English, gloriously) the hash carries the word anyway.
 */
const LETTER_VOWEL: Record<string, readonly [number, number]> = {
  a: [0.95, 0.30], 'á': [0.95, 0.30], 'à': [0.95, 0.30], 'â': [0.90, 0.35],
  'ä': [0.88, 0.85], 'æ': [0.88, 0.85],
  'å': [0.68, 0.12],
  e: [0.55, 0.80], 'é': [0.50, 0.85], 'è': [0.60, 0.78], 'ê': [0.55, 0.80],
  i: [0.05, 1.00], 'í': [0.05, 1.00], 'ï': [0.05, 1.00],
  o: [0.35, 0.12], 'ó': [0.35, 0.12], 'ò': [0.35, 0.12], 'ô': [0.35, 0.12],
  'ö': [0.40, 0.58], 'ø': [0.40, 0.58], 'œ': [0.45, 0.55],
  u: [0.08, 0.05], 'ú': [0.08, 0.05], 'ù': [0.08, 0.05],
  'ü': [0.10, 0.62],
  y: [0.12, 0.62],
};

/**
 * Where each written consonant lands, by manner rather than by letter.
 *
 * The manner is what this synthesises — a burst of noise and a rate of arrival
 * — so `t` and `k` are the same thing here and nothing is lost by saying so.
 * Nobody is going to mistake this for language, and the mapping exists so that
 * a word *starts* the way it looks like it starts, which is a surprisingly
 * large part of a word sounding like itself.
 */
const LETTER_ONSET: Record<string, Consonant> = {
  m: 'nasal', n: 'nasal', 'ñ': 'nasal', 'ŋ': 'nasal',
  l: 'liquid', r: 'liquid', j: 'liquid', w: 'liquid',
  s: 'fricative', f: 'fricative', h: 'fricative', v: 'fricative',
  z: 'fricative', 'š': 'fricative', 'ž': 'fricative', c: 'fricative',
  p: 'stop', b: 'stop', t: 'stop', d: 'stop', k: 'stop', g: 'stop',
  q: 'stop', x: 'stop',
};

const VOWEL_LETTERS = new Set(Object.keys(LETTER_VOWEL));

/**
 * Avalanche a hash with a salt into a fresh 32-bit value.
 *
 * Every decision about a word draws from `mix(wordHash, n)` for its own `n`,
 * which is what keeps the decisions independent: adding a syllable to a word
 * must not reshuffle the syllables before it, exactly as `Rng.fork` exists so
 * that adding a layer cannot reshuffle the others.
 */
function mix(h: number, salt: number): number {
  let x = (h ^ Math.imul(salt + 1, 0x9e3779b9)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97) >>> 0;
  return (x ^ (x >>> 15)) >>> 0;
}

/** That value as a uniform float in [0, 1). */
function unit(h: number, salt: number): number {
  return mix(h, salt) / 4294967296;
}

/** Deterministic weighted pick, driven by a hash draw rather than an RNG. */
function pickWeighted<T>(items: readonly (readonly [T, number])[], draw: number): T | undefined {
  let total = 0;
  for (const [, w] of items) total += w;
  if (total <= 0) return items[0]?.[0];
  let r = draw * total;
  for (const [item, w] of items) {
    r -= w;
    if (r < 0) return item;
  }
  return items[items.length - 1]?.[0];
}

function planeDistance(v: Vowel, target: readonly [number, number]): number {
  return Math.hypot(VOWEL_OPENNESS[v] - target[0], VOWEL_FRONTNESS[v] - target[1]);
}

/**
 * Split a word into runs of vowel letters.
 *
 * The naive syllable counter, and it is naive on purpose: it is wrong about
 * English silent `e` and about diphthongs in every language, and neither
 * matters. What it gets right is the thing that has to be right — a longer word
 * gets more syllables, and the same word always gets the same number.
 */
function vowelGroups(word: string): string[] {
  const groups: string[] = [];
  let run = '';
  for (const ch of word) {
    if (VOWEL_LETTERS.has(ch)) {
      run += ch;
    } else if (run) {
      groups.push(run);
      run = '';
    }
  }
  if (run) groups.push(run);
  return groups;
}

/** The plane position a run of vowel letters claims — the mean of its letters. */
function groupTarget(group: string): readonly [number, number] | undefined {
  let open = 0;
  let front = 0;
  let n = 0;
  for (const ch of group) {
    const p = LETTER_VOWEL[ch];
    if (!p) continue;
    open += p[0];
    front += p[1];
    n++;
  }
  return n ? [open / n, front / n] as const : undefined;
}

/**
 * Choose the vowel for one syllable.
 *
 * Three influences multiply into the palette's own weights, which is what lets
 * all of them have a say rather than the last rule overriding the others:
 *
 *  - the letters, as a gaussian pull toward the point they claim, raised to the
 *    `spelling` power so that 0 flattens it to no influence at all;
 *  - separation from the previous syllable, as a hard penalty rather than a
 *    ban, so a palette with nowhere legal to go degrades instead of failing;
 *  - and the hash, which makes the final draw.
 */
function chooseVowel(
  style: PhoneticStyle,
  target: readonly [number, number] | undefined,
  previous: Vowel | undefined,
  draw: number,
): Vowel {
  const weighted = style.vowels.map(([v, w]) => {
    let weight = w;
    if (target && style.spelling > 0) {
      const d = planeDistance(v, target);
      // σ = 0.3 is about one step in the vowel quadrilateral, so the pull is
      // firm about the region and indifferent within it.
      weight *= Math.exp(-0.5 * (d / 0.3) ** 2) ** style.spelling;
    }
    if (previous) {
      const d = Math.hypot(
        VOWEL_OPENNESS[v] - VOWEL_OPENNESS[previous],
        VOWEL_FRONTNESS[v] - VOWEL_FRONTNESS[previous],
      );
      if (d < style.separation) weight *= 0.04 + 0.96 * (d / style.separation) ** 2;
    }
    return [v, Math.max(weight, 1e-6)] as const;
  });
  return pickWeighted(weighted, draw) ?? style.vowels[0]?.[0] ?? 'a';
}

/** Choose a consonant manner, never repeating the one before it. */
function chooseConsonant(
  style: PhoneticStyle,
  previous: Consonant | undefined,
  draw: number,
): Consonant {
  const weighted = style.consonants.map(([c, w]) =>
    [c, c === previous ? w * 0.15 : w] as const);
  return pickWeighted(weighted, draw) ?? 'none';
}

/**
 * The pronunciation of one word.
 *
 * Pure: same text and same style in, same syllables out, every time and in
 * every process. That is the whole contract, and it is what makes a sung line
 * reproducible from a seed and a string rather than from a recording.
 */
export function pronounceWord(text: string, style: PhoneticStyle): PhoneticWord {
  const norm = text.toLowerCase().replace(/[^\p{L}]/gu, '');
  const breakAfter = /[,.;:!?—–]$/.test(text.trim());
  if (!norm) return { text, hash: 0, syllables: [], breakAfter };

  const h = hashString(norm);
  const groups = vowelGroups(norm);
  const count = Math.max(1, Math.min(style.maxSyllables, groups.length || 1));

  const syllables: Syllable[] = [];
  let prevVowel: Vowel | undefined;
  let prevOnset: Consonant | undefined;

  for (let i = 0; i < count; i++) {
    const group = groups[i];
    const target = group ? groupTarget(group) : undefined;
    const vowel = chooseVowel(style, target, prevVowel, unit(h, i * 4 + 1));

    // The first syllable takes the word's own first letter, which is what makes
    // a word open the way it looks: "moon" hums, "tale" clicks — and "ilta"
    // opens on a bare vowel, because it does. A word that begins with a vowel
    // letter is the one case that overrides the density roll outright; putting
    // a consonant in front of it would be inventing a letter that is not there,
    // and it is audible as the wrong word.
    //
    // Everything after the first syllable is hashed, and usually nothing: the
    // density knobs are low on purpose, because vowel-to-vowel motion is what
    // makes a line float rather than clatter.
    let onset: Consonant = 'none';
    const initial = norm[0] ?? '';
    const vowelInitial = i === 0 && VOWEL_LETTERS.has(initial);
    const wants = !vowelInitial
      && unit(h, i * 4 + 2) < (i === 0 ? style.onsetDensity : style.interiorDensity);
    if (wants) {
      const literal = i === 0 ? LETTER_ONSET[initial] : undefined;
      onset = literal && style.consonants.some(([c]) => c === literal)
        ? literal
        : chooseConsonant(style, prevOnset, unit(h, i * 4 + 3));
    }

    // Initial stress. True of Finnish and Hungarian outright, and the default
    // guess everywhere else; getting it wrong costs a little naturalness and
    // nothing else, because stress here only lengthens and lifts a syllable.
    syllables.push({ onset, vowel, stress: i === 0 && count > 1 });
    prevVowel = vowel;
    if (onset !== 'none') prevOnset = onset;
  }

  return { text, hash: h, syllables, breakAfter };
}

/** Split a block of text into words and pronounce each one. */
export function pronounce(text: string, style: PhoneticStyle): PhoneticWord[] {
  return text
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)
    .map((w) => pronounceWord(w, style))
    .filter((w) => w.syllables.length > 0);
}

/** Rendered as text, e.g. "ku-o-ma" — for the lab's readout. */
export function spellSyllables(word: PhoneticWord): string {
  const mark: Record<Consonant, string> = {
    none: '', stop: 't', fricative: 's', nasal: 'm', liquid: 'l',
  };
  return word.syllables.map((s) => mark[s.onset] + s.vowel).join('-');
}
