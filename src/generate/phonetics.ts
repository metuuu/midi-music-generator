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
 * Consonants stay *sparse* — a line built mostly of vowel-to-vowel motion is
 * what makes a voice float rather than clatter, and that has not changed. What
 * has changed is that they are no longer *few*. Four manners meant five possible
 * onsets, two of which had no noise in them and differed only in how fast the
 * vowel arrived, so a page of text came out with one audible consonant on it.
 * Place of articulation costs nothing to synthesise and multiplies the
 * inventory: the word's own letters now pick out /m/ from /n/, /l/ from /r/,
 * /p/ from /t/ from /k/. Same density, three times the vocabulary.
 *
 * ### Length
 *
 * A syllable is **light or heavy**, and that is what makes a long word long.
 *
 * Counting syllables is not enough on its own, and the reason is visible in the
 * target language: "hiljaisuus" and "ja" are ten letters and two, and a counter
 * that sees three vowel runs against one makes the first word three times the
 * second when it should be six. Finnish spends its length on long vowels and
 * closed syllables — `uu`, `suus`, `il` — and every one of those was being
 * flattened into a plain short CV.
 *
 * So a syllable with two vowel letters (a long vowel or a diphthong) or with a
 * consonant closing it is heavy, and a heavy syllable is sung over two slots
 * instead of one. That is the standard weight distinction and it lands within a
 * mora of the real count across the sample texts, because the diphthongs a
 * naive counter merges into one syllable are exactly the ones this makes heavy.
 *
 * The closing consonant is a separate decision from the length, which is what
 * `codaDensity` is for: a closed syllable is long whether or not the coda is
 * actually pronounced, so turning codas down gives a floating held vowel rather
 * than a shorter word.
 */

import type { Consonant, Vowel } from '../core/types.js';
import { hashString } from '../core/rng.js';
import { VOWEL_FRONTNESS, VOWEL_OPENNESS } from '../style/vocals.js';

/** One syllable, fully specified. */
export interface Syllable {
  onset: Consonant;
  vowel: Vowel;
  /** The consonant that closes it, or `none` for an open syllable. */
  coda: Consonant;
  /**
   * Heavy: a long vowel, a diphthong, or a closed syllable. Sung over two slots
   * rather than one — see the note on length above.
   */
  heavy: boolean;
  /** Carries the word's stress — longer, louder, and it is where melisma goes. */
  stress: boolean;
}

/** How many slots a syllable takes. The unit the layout counts in. */
export function syllableWeight(s: Syllable): number {
  return s.heavy ? 2 : 1;
}

/** Total weight of a word — its sung length, in slots. */
export function wordWeight(word: PhoneticWord): number {
  return word.syllables.reduce((n, s) => n + syllableWeight(s), 0);
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
  /**
   * Chance a later syllable does — the floatiness knob.
   *
   * It used to be held near a third, and that was right when an interior
   * consonant was a *random* manner: two thirds of the syllables had to be bare
   * or the word became noise that had nothing to do with its spelling. Now the
   * syllable's own letters choose it, so a consonant that sounds is a consonant
   * the word actually has, and the same value that used to read as clatter
   * reads as the word. Hence the higher settings below.
   */
  interiorDensity: number;
  /**
   * Chance a syllable the spelling closes actually gets its closing consonant.
   *
   * Only ever consulted for a syllable that *has* a coda in the word — this
   * cannot invent one. At 0 the syllable stays open and keeps its length as a
   * held vowel, which is the floating version of the same word; at 1 every
   * closed syllable closes, which is the most speech-like and the busiest.
   */
  codaDensity: number;
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
    // Roughly the frequency order of the real inventory — t n s l k m v r h j p
    // — leaning on the sonorants, because that is what the singing does. No
    // /š/: Finnish does not have one outside loanwords.
    consonants: [
      ['liquid', 5], ['nasal', 4], ['nasal-m', 3], ['liquid-r', 2.5],
      ['stop', 2.5], ['stop-k', 2], ['glide', 1.5], ['fricative-h', 1.5],
      ['fricative', 1.2], ['fricative-f', 1], ['stop-p', 1],
    ],
    spelling: 0.8,
    separation: 0.3,
    onsetDensity: 0.92,
    interiorDensity: 0.7,
    codaDensity: 0.45,
    maxSyllables: 5,
  },
  open: {
    vowels: [['a', 5], ['o', 4], ['u', 3], ['e', 3], ['i', 2]],
    consonants: [
      ['liquid', 5], ['nasal', 5], ['nasal-m', 4], ['liquid-r', 3],
      ['stop', 2], ['stop-p', 1.5], ['stop-k', 1.5], ['glide', 1.5],
      ['fricative-h', 1], ['fricative', 0.8],
    ],
    spelling: 0.7,
    separation: 0.32,
    onsetDensity: 0.88,
    interiorDensity: 0.5,
    codaDensity: 0.35,
    maxSyllables: 5,
  },
  dark: {
    vowels: [['o', 5], ['u', 4], ['aa', 3], ['oe', 3], ['a', 2.5], ['uh', 2], ['ue', 1.5]],
    // Back and labial places throughout: /m/ over /n/, /p/ over /t/. A dark
    // palette is as much about where the tongue is for the consonant as for
    // the vowel, and picking places is what the widened table is for.
    consonants: [
      ['nasal-m', 6], ['nasal', 4], ['liquid', 4], ['liquid-r', 3],
      ['stop-p', 2], ['stop-k', 1.5], ['fricative-h', 1.2], ['glide', 1],
    ],
    spelling: 0.6,
    separation: 0.24,
    onsetDensity: 0.8,
    interiorDensity: 0.4,
    codaDensity: 0.25,
    maxSyllables: 4,
  },
  bright: {
    vowels: [['i', 4], ['e', 4], ['ae', 3.5], ['a', 3], ['y', 2.5], ['en', 2], ['oe', 2]],
    // The mirror image: front places, sibilants, and the palatal glide.
    consonants: [
      ['liquid', 4], ['stop', 3.5], ['fricative', 3], ['glide', 3], ['nasal', 3],
      ['stop-k', 2], ['fricative-sh', 2], ['liquid-r', 2], ['nasal-m', 1.5],
      ['fricative-f', 1],
    ],
    spelling: 0.7,
    separation: 0.3,
    onsetDensity: 0.95,
    interiorDensity: 0.75,
    codaDensity: 0.6,
    maxSyllables: 5,
  },
  nasal: {
    vowels: [['an', 4], ['on', 4], ['en', 3], ['un', 3], ['a', 2], ['o', 2], ['e', 1.5]],
    consonants: [
      ['nasal-m', 8], ['nasal', 7], ['liquid', 3], ['none', 2], ['liquid-r', 2], ['glide', 1],
    ],
    spelling: 0.5,
    separation: 0.22,
    onsetDensity: 0.7,
    interiorDensity: 0.45,
    codaDensity: 0.3,
    maxSyllables: 4,
  },
  wide: {
    vowels: [
      ['a', 3], ['e', 3], ['i', 3], ['o', 3], ['u', 3],
      ['ae', 2], ['aa', 2], ['oe', 2], ['ue', 2], ['y', 2], ['uh', 2],
      ['an', 1], ['en', 1], ['on', 1], ['un', 1],
    ],
    // The whole table at once, which is what this palette is for.
    consonants: [
      ['liquid', 4], ['nasal', 4], ['nasal-m', 3], ['liquid-r', 3], ['stop', 3],
      ['stop-k', 2.5], ['stop-p', 2], ['fricative', 2], ['glide', 2],
      ['fricative-sh', 1.5], ['fricative-f', 1.5], ['fricative-h', 1.5],
    ],
    spelling: 0.7,
    separation: 0.35,
    onsetDensity: 0.9,
    interiorDensity: 0.6,
    codaDensity: 0.5,
    maxSyllables: 6,
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
 * Where each written consonant lands.
 *
 * This used to collapse to four manners, so `t` and `k` were the same thing and
 * so were `m` and `n` — which is most of why a line of text arrived sounding
 * like it had one consonant in it. Now it keeps place as well as manner, and
 * the only letters still sharing an entry are the ones that genuinely share a
 * place: `t` with `d`, `p` with `b`, `k` with `g`. Voicing is the distinction
 * dropped instead, and it is the right one to drop — it is carried by the
 * larynx rather than by the tract, so a voiced/unvoiced pair differs by far
 * less here than /p/ and /t/ do.
 */
const LETTER_ONSET: Record<string, Consonant> = {
  m: 'nasal-m',
  n: 'nasal', 'ñ': 'nasal', 'ŋ': 'nasal',
  l: 'liquid',
  r: 'liquid-r',
  j: 'glide', w: 'glide', y: 'glide',
  s: 'fricative', z: 'fricative', c: 'fricative',
  'š': 'fricative-sh', 'ž': 'fricative-sh',
  f: 'fricative-f', v: 'fricative-f',
  h: 'fricative-h',
  t: 'stop', d: 'stop',
  p: 'stop-p', b: 'stop-p',
  k: 'stop-k', g: 'stop-k', q: 'stop-k',
  x: 'fricative',
};

/**
 * `y` is both, and which one it is depends on where it stands.
 *
 * In Finnish it is the close front rounded vowel and nothing else; in English
 * it opens a syllable as a glide and closes one as a vowel. Treating it as a
 * vowel letter is right for the target language, and `LETTER_ONSET` still has
 * an entry for it so that an English word beginning with one does not come out
 * bare.
 */
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

/** A syllable as the *spelling* has it, before any of it becomes sound. */
interface LetterSyllable {
  /** Consonant letters opening it. Empty for a syllable that starts on a vowel. */
  onset: string;
  /** The run of vowel letters that is its nucleus. */
  nucleus: string;
  /** Consonant letters closing it. Empty for an open syllable. */
  coda: string;
}

/**
 * Split a word into syllables, keeping the consonants.
 *
 * Still naive about English silent `e` and about which vowel pairs are really
 * two syllables — `laskeutuu` comes out as three rather than four — and that is
 * still fine, for a reason that is nicer than it sounds: the pairs it wrongly
 * merges are exactly the ones it then marks heavy, so the *length* comes out
 * right even where the count does not. Two slots either way.
 *
 * What it now gets right and did not before is the consonants between the
 * vowels. The rule is the ordinary one: of a cluster standing between two
 * nuclei, the last consonant opens the following syllable and the rest close
 * the preceding one, and a cluster at the end of the word closes it entirely.
 * That is what turns `ilta` into `il-ta` rather than `i-ta`, and `il` being
 * closed is what makes it heavy.
 */
function syllabify(word: string): LetterSyllable[] {
  // Alternating runs of vowel and consonant letters.
  const runs: { vowel: boolean; text: string }[] = [];
  for (const ch of word) {
    const vowel = VOWEL_LETTERS.has(ch);
    const last = runs[runs.length - 1];
    if (last && last.vowel === vowel) last.text += ch;
    else runs.push({ vowel, text: ch });
  }

  const out: LetterSyllable[] = [];
  let onset = runs[0] && !runs[0].vowel ? runs[0].text : '';

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i]!;
    if (!run.vowel) continue;

    const after = runs[i + 1];
    let coda = '';
    let nextOnset = '';
    if (after) {
      const wordFinal = i + 2 >= runs.length;
      if (wordFinal) coda = after.text;
      else {
        coda = after.text.slice(0, -1);
        nextOnset = after.text.slice(-1);
      }
    }

    out.push({ onset, nucleus: run.text, coda });
    onset = nextOnset;
  }

  // A word with no vowel letters in it at all still has to sound like
  // something; the hash picks its vowel with nothing to go on, as it always did.
  return out.length ? out : [{ onset: word, nucleus: '', coda: '' }];
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

/** The manner behind a consonant, ignoring its place — `stop-k` is a `stop`. */
function manner(c: Consonant): string {
  return c.split('-')[0]!;
}

/**
 * Choose a consonant, avoiding the one before it.
 *
 * Two penalties rather than one, now that place exists. Repeating the exact
 * consonant is a stutter and is penalised almost to nothing; repeating the
 * *manner* at a different place — /m/ then /n/, /p/ then /k/ — is merely a bit
 * samey, so it is discouraged rather than forbidden. Without the second one the
 * widened table would spend most of its draws inside whichever family the
 * palette weights highest, which is exactly the complaint it exists to fix.
 */
function chooseConsonant(
  style: PhoneticStyle,
  previous: Consonant | undefined,
  draw: number,
): Consonant {
  const before = previous ? manner(previous) : undefined;
  const weighted = style.consonants.map(([c, w]) => {
    if (c === previous) return [c, w * 0.12] as const;
    if (before && manner(c) === before) return [c, w * 0.45] as const;
    return [c, w] as const;
  });
  return pickWeighted(weighted, draw) ?? 'none';
}

/**
 * The consonant a written letter asks for, if this palette has it.
 *
 * A palette is a vocabulary, and a voice that does not use /š/ should not
 * acquire one because a word happened to be spelled with it. Falling back to a
 * weighted draw rather than to silence keeps the syllable's *shape* — it still
 * opens on something — which is what the ear is tracking.
 */
function literalConsonant(style: PhoneticStyle, letter: string): Consonant | undefined {
  const wanted = LETTER_ONSET[letter];
  return wanted && style.consonants.some(([c]) => c === wanted) ? wanted : undefined;
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
  const letters = syllabify(norm);
  const count = Math.max(1, Math.min(style.maxSyllables, letters.length));

  const syllables: Syllable[] = [];
  let prevVowel: Vowel | undefined;
  let prevConsonant: Consonant | undefined;

  for (let i = 0; i < count; i++) {
    const letter = letters[i]!;
    const target = letter.nucleus ? groupTarget(letter.nucleus) : undefined;
    const vowel = chooseVowel(style, target, prevVowel, unit(h, i * 5 + 1));

    /**
     * The onset comes from the letters that are actually there — which is what
     * makes a word open the way it looks: "moon" hums, "tale" clicks, "ranta"
     * rolls, and "ilta" opens on a bare vowel because it does.
     *
     * Every syllable consults its own onset letters now, not only the first.
     * That was the other half of the one-consonant problem: interior syllables
     * drew from the palette at random, so `kuutamo` could come out as anything
     * at all in the middle, and across a page of text the interiors averaged
     * out to whichever manner the palette weighted highest.
     *
     * The density knobs stay low, because vowel-to-vowel motion is what makes a
     * line float rather than clatter. They decide *whether* there is a
     * consonant; the letters decide which.
     */
    let onset: Consonant = 'none';
    const wants = letter.onset !== ''
      && unit(h, i * 5 + 2) < (i === 0 ? style.onsetDensity : style.interiorDensity);
    if (wants) {
      onset = literalConsonant(style, letter.onset[0]!)
        ?? chooseConsonant(style, prevConsonant, unit(h, i * 5 + 3));
    }
    if (onset !== 'none') prevConsonant = onset;

    /**
     * The coda, from the first letter of the closing cluster — the one that
     * actually shuts the vowel off, rather than the last, which in a cluster
     * like `-ght` is a release the vowel never touches.
     *
     * Whether it sounds is a separate roll from whether the syllable is heavy,
     * so turning `codaDensity` down lengthens the vowel instead of shortening
     * the word. See the note on length at the top.
     */
    let coda: Consonant = 'none';
    if (letter.coda && unit(h, i * 5 + 4) < style.codaDensity) {
      coda = literalConsonant(style, letter.coda[0]!)
        ?? chooseConsonant(style, prevConsonant, unit(h, i * 5 + 5));
    }
    if (coda !== 'none') prevConsonant = coda;

    // Initial stress. True of Finnish and Hungarian outright, and the default
    // guess everywhere else; getting it wrong costs a little naturalness and
    // nothing else, because stress here only lengthens and lifts a syllable.
    syllables.push({
      onset,
      vowel,
      coda,
      heavy: letter.nucleus.length >= 2 || letter.coda !== '',
      stress: i === 0 && count > 1,
    });
    prevVowel = vowel;
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

/**
 * A letter for each consonant, so a syllable can be written down.
 *
 * The obvious choice for each, and worth having as one table rather than three
 * copies: the lab's readout, the timeline and the homophone check all have to
 * agree about what a word looks like or the panel is lying about which words
 * collide.
 */
export const CONSONANT_MARK: Record<Consonant, string> = {
  none: '',
  stop: 't', 'stop-p': 'p', 'stop-k': 'k',
  fricative: 's', 'fricative-sh': 'š', 'fricative-f': 'f', 'fricative-h': 'h',
  nasal: 'n', 'nasal-m': 'm',
  liquid: 'l', 'liquid-r': 'r',
  glide: 'j',
};

/**
 * Rendered as text, e.g. "kuu-ta-mo" or "hil-jai-suus" — for the lab's readout.
 *
 * The colon is the length mark, because a vowel written twice is unreadable
 * once the vowel is spelled `ae` or `oe`. A heavy syllable that has no coda is
 * a long vowel and gets one; a heavy syllable that is heavy *because* it is
 * closed is already visibly longer for having the closing consonant on it.
 */
export function spellSyllables(word: PhoneticWord): string {
  return word.syllables.map((s) => {
    const length = s.heavy && s.coda === 'none' ? ':' : '';
    return CONSONANT_MARK[s.onset] + s.vowel + length + CONSONANT_MARK[s.coda];
  }).join('-');
}
