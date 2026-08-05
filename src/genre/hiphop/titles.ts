/**
 * Hiphop title generation.
 *
 * Ambient titles name a place, synth titles name a thing that moves or measures,
 * iskelmä titles name a feeling and funk titles give an instruction. **Hiphop
 * titles name a thing and then argue about which version of it this is.**
 *
 * The parenthetical is the convention that separates this repertoire's titling
 * from everything else in the project, and it comes from a fact about how the
 * records were sold. A twelve-inch single carried the vocal, the instrumental,
 * the a cappella and usually a remix, so the *title* had to be qualified before
 * it identified anything — and by the time the format died the qualifier had
 * become part of how these records are named. Nothing in jazz or iskelmä does
 * that, because a standard and a dance are each one object.
 *
 * Seven families cover nearly all of it —
 *
 *  - **the definite noun**: `the` and one plain word. The single commonest shape
 *    in the genre and the flattest — the joke is that the most self-assured
 *    music anybody makes titles itself like a memo.
 *  - **the initialism**, two or three letters with stops between them. A whole
 *    convention on its own, and one that survives from 1982 to now.
 *  - **the block**: a number and a piece of street furniture. This music is
 *    unusually specific about *where*, and the where is a corner rather than a
 *    city.
 *  - **the gerund**, which is the activity named rather than demanded.
 *  - **the instruction**, which is funk's family arriving one decade later with
 *    the particle removed — and, like funk's, filtered against tempo.
 *  - **the boast**: an adjective and an abstract noun, delivered flat.
 *  - **the numbered noun**, where the number is doing the whole job.
 *
 * ## The parenthetical, and why it is filtered rather than decorative
 *
 * `TitleContext` exists because an announcement that disagrees with the music is
 * worse than no announcement — the type's own doc says so about a bossa called a
 * swing. Here the disagreement is unusually sharp because the qualifiers are
 * *claims about the production*: `(Screwed)` on a 140 BPM record is not a poetic
 * liberty, it is a factual error about a well-documented process. So the tag
 * pool is drawn against the style and the tempo, `chopped` almost always carries
 * one and nothing above 100 BPM can, and the neutral tags — `(Remix)`,
 * `(Instrumental)` — are the only ones available everywhere.
 *
 * The imperative and gerund families are struck below 76 BPM and on the three
 * styles whose whole subject is stillness, for the reason funk's table gives:
 * telling somebody to move over a record that is not moving is a promise the
 * record does not keep.
 *
 * Nothing here reproduces an actual title. Every vocabulary is deliberately one
 * word to the side of the famous ones — the neighbouring noun, the neighbouring
 * piece of pavement — so an output reads as belonging to this repertoire without
 * having been taken from it.
 */

import type { Rng } from '../../core/rng.js';
import type { TitleContext } from '../types.js';

/** One plain word, with `the` in front of it. The commonest shape in the genre. */
const NOUNS = [
  'blueprint', 'bulletin', 'inventory', 'chamber', 'ledger', 'circuit',
  'transmission', 'stairwell', 'perimeter', 'appointment', 'delivery',
  'arrangement', 'procedure', 'notice', 'schedule', 'apparatus', 'exchange',
  'reminder', 'forecast', 'switchboard', 'inquiry', 'threshold',
];

/** Letters that read as an initialism rather than as a word. */
const LETTERS = ['B', 'C', 'D', 'G', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'X', 'Z'];

/** Street furniture. The where in this music is a corner, not a city. */
const BLOCK = [
  'avenue', 'boulevard', 'crossing', 'underpass', 'stairwell', 'courtyard',
  'lot', 'corner', 'arcade', 'terrace', 'walkway', 'yard', 'block', 'row',
  'landing', 'forecourt', 'sidestreet', 'depot',
];

/** The activity, named rather than demanded. Apostrophes, as printed on labels. */
const GERUNDS = [
  'creepin', 'stackin', 'coastin', 'clockin', 'leanin', 'buildin', 'circlin',
  'countin', 'flexin', 'driftin', 'grindin', 'holdin', 'plottin', 'ridin',
  'shufflin', 'stallin', 'trackin', 'waitin',
];

/** The instruction, one decade after funk's and with the particle removed. */
const VERBS = [
  'check', 'run', 'pass', 'hold', 'watch', 'count', 'clear', 'call', 'bring',
  'keep', 'stack', 'move', 'take', 'set', 'flip',
];

/** …and what it is done to. Concrete, and never a person. */
const OBJECTS = [
  'the meter', 'the tape', 'the corner', 'the table', 'the lock', 'the crate',
  'the numbers', 'the doorway', 'the shutters', 'the register', 'the block',
  'the fixtures', 'the ledger', 'the gate', 'the wire', 'the rooftop',
];

/** Adjectives for the boast, and none of them is a compliment. */
const ADJECTIVES = [
  'cold', 'flat', 'heavy', 'plain', 'quiet', 'wide', 'blunt', 'narrow',
  'long', 'low', 'dry', 'hard', 'straight', 'thin', 'blank', 'sharp',
  'level', 'crooked', 'slow',
];

/** …and the abstract noun it lands on, delivered without a smile. */
const ABSTRACTS = [
  'arithmetic', 'weather', 'business', 'manners', 'science', 'geometry',
  'grammar', 'evidence', 'inventory', 'economics', 'engineering', 'physics',
  'procedure', 'accounting', 'diagnostics', 'logistics', 'surveying',
];

/** Numbers that get put in front of a noun and left there. */
const NUMBERS = ['six', 'nine', 'twelve', 'sixteen', 'twenty-two', 'thirty-six', 'forty-four', 'eight'];

/** Things a number can be put in front of. */
const COUNTABLE = [
  'chambers', 'corners', 'degrees', 'stories', 'floors', 'bars', 'blocks',
  'windows', 'stops', 'lanes', 'gates', 'doors', 'panels',
];

/**
 * The parenthetical.
 *
 * Two are neutral and available everywhere; the rest are claims about what was
 * done to the tape, and a claim that disagrees with the tempo or the style is a
 * factual error rather than a flourish. See the header.
 */
const NEUTRAL_TAGS = ['Remix', 'Instrumental', 'Reprise', 'Extended'];
const SLOW_TAGS = ['Screwed', 'Slowed', 'Chopped', 'Late Version'];
const LOOP_TAGS = ['Loop', 'Sample Version', 'Tape Edit'];

function capitalise(s: string): string {
  return s.replace(/(^|[ -])([a-z])/g, (_, sep: string, c: string) => sep + c.toUpperCase());
}

/** Two or three letters with stops between them. */
function initialism(rng: Rng): string {
  const n = rng.chance(0.4) ? 2 : 3;
  const out: string[] = [];
  while (out.length < n) {
    const letter = rng.pick(LETTERS);
    if (!out.includes(letter)) out.push(letter);
  }
  return `${out.join('.')}.`;
}

export function generateTitle(rng: Rng, ctx: TitleContext): string {
  /**
   * A record that is not moving does not tell anybody to move.
   *
   * The line at 76 is where this repertoire's two halves actually divide, and
   * three styles are struck by name as well as by tempo because each of them can
   * draw a fast tempo and still be a record about standing still — `chopped` is
   * the tape slowed down, `cloud` is a held pad, and `minimal` is two sounds.
   */
  const still = ctx.style.id === 'chopped' || ctx.style.id === 'cloud' || ctx.style.id === 'minimal';
  const walking = ctx.bpm >= 76 && !still;

  const base = rng.weighted([
    ['the-noun', 7],
    ['initialism', 5],
    ['block', 5],
    ['boast', 4],
    ['numbered', 4],
    ['gerund', walking ? 4 : 0],
    ['instruction', walking ? 4 : 0],
    ['adjective-block', 3],
    ['bare-noun', 3],
  ] as const);

  const title = ((): string => {
    switch (base) {
      // `the` and one plain word: the flattest shape in the genre and the
      // commonest. See the header on why the flatness is the joke.
      case 'the-noun':
        return capitalise(`the ${rng.pick(NOUNS)}`);
      case 'initialism':
        return initialism(rng);
      // A number and a piece of street furniture. Never a city.
      case 'block':
        return capitalise(`${rng.pick(NUMBERS)} ${rng.pick(BLOCK)}`);
      case 'boast':
        return capitalise(`${rng.pick(ADJECTIVES)} ${rng.pick(ABSTRACTS)}`);
      case 'numbered':
        return capitalise(`${rng.pick(NUMBERS)} ${rng.pick(COUNTABLE)}`);
      case 'gerund':
        return `${capitalise(rng.pick(GERUNDS))}'`;
      case 'instruction':
        return capitalise(`${rng.pick(VERBS)} ${rng.pick(OBJECTS)}`);
      case 'adjective-block':
        return capitalise(`${rng.pick(ADJECTIVES)} ${rng.pick(BLOCK)}`);
      case 'bare-noun':
        return capitalise(rng.pick(NOUNS));
    }
  })();

  /**
   * …and then the argument about which version this is.
   *
   * `chopped` carries one four times in five, because the qualifier is the whole
   * of what distinguishes that record from the one it was made out of. `lofi`
   * and `abstract` reach the tape-edit pool. Everything else gets a neutral tag
   * one time in six, which is about the rate a twelve-inch's B-side turns up in
   * a catalogue.
   */
  const slow = ctx.bpm < 76 || ctx.mood.id === 'hazy';
  const tagPool = [
    ...NEUTRAL_TAGS,
    ...(slow || ctx.style.id === 'chopped' ? SLOW_TAGS : []),
    ...(ctx.style.id === 'lofi' || ctx.style.id === 'abstract' ? LOOP_TAGS : []),
  ];
  const tagChance = ctx.style.id === 'chopped' ? 0.8 : 0.17;
  return rng.chance(tagChance) ? `${title} (${rng.pick(tagPool)})` : title;
}
