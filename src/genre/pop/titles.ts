/**
 * Title generation.
 *
 * Pop titles are the shortest in the project and the most constrained, and the
 * constraint is structural rather than stylistic: **the title is a phrase from
 * the chorus**, so it has to be four words at most, singable, and placed on
 * strong beats. That rules out almost everything a title generator wants to do —
 * there are no compound announcements here, nothing like iskelmä's "Satumaan
 * valssi" or reggae's "Trench Town Rock", because a pop record does not label
 * itself for anybody's filing system.
 *
 * Two devices belong to this genre and to nothing else in the project.
 *
 * **The second person.** Pop titles are *aimed at somebody* far more than any
 * other repertoire's: "Baby", "You", "Me", "Us". Rock has the imperative, which
 * is a verb with no subject shouted at a room; this is a verb with an object,
 * addressed to one person, and the difference is the whole difference between
 * the two genres' subject matter. It carries the heaviest weight below.
 *
 * **The parenthetical.** "Heartbreak (One More Time)". This is the one piece of
 * administrative apparatus pop ever had, and it exists because the hook and the
 * title were frequently not the same phrase — the label wanted the words people
 * would ask for at the counter, and the writer wanted the line that actually
 * repeats. A bracket holds both. It is weighted below the plain patterns because
 * a catalogue where every record has one reads as a joke about the device rather
 * than as the device.
 *
 * Three gates, the same three shapes reggae and rock use and pointed at this
 * repertoire's own hazards:
 *
 *  - **Words of weight** are held back from anything generated to be cheerful,
 *    and **words of tenderness** from anything generated for a dance floor.
 *    "Reckoning" on a bubblegum single reads as a mistake rather than a liberty.
 *  - **Format words** — Radio, Record, Discotheque — are legal only on the
 *    styles that plausibly mention them. A 1963 girl-group side does not have
 *    "Discotheque" in it, and a tropical record does not have "Record" in it.
 *  - **Speed words** are gated on `TitleContext.bpm`, the *tempo actually
 *    chosen*, not the style's band — the one field on that interface nothing
 *    else in the project reads. The threshold is 112, which is where a pop
 *    record stops being something you sway to and starts being something you
 *    move to, and because it is drawn from the tempo the song ended up at, the
 *    same style titles itself differently at the two ends of its own range.
 */

import type { Rng } from '../../core/rng.js';
import type { TitleContext } from '../types.js';

interface Noun {
  word: string;
  /** Only usable when the piece is one of these styles. */
  styles?: string[];
  /** Only usable when the piece is not trying to be cheerful. */
  grave?: boolean;
  /** Only usable when the piece is not aimed at a dance floor. */
  tender?: boolean;
  /** Only usable above 112 BPM. */
  fast?: boolean;
  /** Only usable at or below 112 BPM. */
  slow?: boolean;
}

/**
 * The format words — the genre's whole administrative vocabulary, which is six
 * entries against reggae's sixteen.
 *
 * That difference says something true. In Jamaica the rhythm word on the label
 * told the next twenty producers which riddim you meant, and it was information.
 * Here the format word is *decoration*: a pop record that mentions the radio is
 * flattering the thing that is about to play it.
 *
 * **Every style has to appear in at least one row or it loses the pattern
 * silently.** `usable` filters this list by style and `generateTitle` only
 * offers the `format` pattern when something survives, so a style absent from
 * all six is not handed a fallback — it is quietly dealt seven patterns instead
 * of eight. `citypop` was added to the file and to none of these rows, which cost
 * it about a ninth of its title weight and locked it out of the two words its own
 * repertoire is most literally about: the radio and the telephone are what half
 * those records are named after.
 */
const FORMATS: Noun[] = [
  { word: 'Radio', styles: ['synthpop', 'newromantic', 'stadium', 'powerpop', 'jangle', 'citypop'] },
  { word: 'Record', styles: ['bubblegum', 'merseybeat', 'girlgroup', 'brill', 'powerpop'] },
  { word: 'Discotheque', styles: ['discopop', 'hinrg', 'europop'] },
  { word: 'Jukebox', styles: ['girlgroup', 'merseybeat', 'brill', 'bubblegum'] },
  { word: 'Telephone', styles: ['girlgroup', 'brill', 'synthpop', 'teen', 'electropop', 'citypop'] },
  { word: 'Encore', styles: ['stadium', 'ballad', 'europop', 'dancepop'] },
];

const NOUNS: Noun[] = [
  { word: 'Heart' },
  { word: 'Love' },
  { word: 'Night' },
  { word: 'Morning' },
  { word: 'Summer' },
  { word: 'Weekend' },
  { word: 'Sunday' },
  { word: 'City' },
  { word: 'Street' },
  { word: 'Window' },
  { word: 'Mirror' },
  { word: 'Letter' },
  { word: 'Photograph' },
  { word: 'Secret' },
  { word: 'Promise' },
  { word: 'Message' },
  { word: 'Chance' },
  { word: 'Reason' },
  { word: 'Feeling' },
  { word: 'Melody' },
  { word: 'Colour' },
  { word: 'Paradise' },
  { word: 'Nothing' },
  { word: 'Everything' },
  { word: 'Nobody' },
  { word: 'Somebody' },
  { word: 'Tonight' },
  { word: 'Forever' },

  // Motion. Above 112 only — see the header.
  { word: 'Fire', fast: true },
  { word: 'Lightning', fast: true },
  { word: 'Fever', fast: true },
  { word: 'Neon', fast: true },
  { word: 'Rocket', fast: true },
  { word: 'Heartbeat', fast: true },

  // Stillness. Below 112 only.
  { word: 'Shadow', slow: true },
  { word: 'Winter', slow: true },
  { word: 'Rain', slow: true },
  { word: 'Ocean', slow: true },
  { word: 'Candle', slow: true },
  { word: 'Silence', slow: true },

  // Weight. Not on anything cheerful.
  { word: 'Ruin', grave: true },
  { word: 'Goodbye', grave: true },
  { word: 'Ashes', grave: true },
  { word: 'Stranger', grave: true },
  { word: 'Regret', grave: true },
  { word: 'Distance', grave: true },

  // Tenderness. Not on anything aimed at a floor.
  { word: 'Lullaby', tender: true },
  { word: 'Garden', tender: true },
  { word: 'Feather', tender: true },
  { word: 'Handwriting', tender: true },
  { word: 'Daydream', tender: true },
];

/**
 * The verbs, and every one of them takes an object.
 *
 * That is the constraint rather than an accident of the list: the pattern these
 * are for is the second-person address, and a verb with nobody on the end of it
 * is rock's gesture rather than this one's. All but three are one syllable,
 * because a shouted chorus has one strong beat for the verb and a
 * three-syllable one arrives late.
 */
const VERBS = [
  'Hold', 'Call', 'Kiss', 'Tell', 'Save', 'Keep', 'Leave', 'Find',
  'Take', 'Want', 'Need', 'Miss', 'Trust', 'Follow', 'Remember', 'Forgive',
];

const ADJECTIVES = [
  'Golden', 'Electric', 'Perfect', 'Endless', 'Lonely', 'Sweet', 'Little',
  'Bright', 'Quiet', 'Foolish', 'Careless', 'Ordinary', 'Restless', 'Silver',
  'Faded', 'Secret', 'Patient', 'Simple',
];

/** Adjectives of weight, held back from anything generated to be cheerful. */
const GRAVE_ADJECTIVES = new Set(['Lonely', 'Faded', 'Careless', 'Foolish', 'Restless']);

/**
 * The bracketed halves — the second phrase, which is the one that actually
 * repeats. All of them are things a chorus says rather than things a title says,
 * which is the whole distinction the device exists to hold.
 */
const PARENTHETICALS = [
  'One More Time', 'All Night', 'Don\'t Stop', 'Come Back', 'I Still Do',
  'Say It Again', 'Just For Tonight', 'And I Mean It', 'Every Time',
  'Nobody Else', 'Not This Time', 'Right Now',
];

/** Moods a word of weight would contradict. */
const BRIGHT_MOODS = new Set(['single', 'summer']);

/** Moods a word of tenderness would contradict. */
const FLOOR_MOODS = new Set(['floor', 'single']);

/** Where a pop record stops being something you sway to. */
const MOVING = 112;

type Pattern =
  | 'address' | 'verb-me' | 'adj-noun' | 'the-adj-noun' | 'noun-noun'
  | 'noun-of-noun' | 'format' | 'parenthetical';

export function generateTitle(rng: Rng, ctx: TitleContext): string {
  const bright = BRIGHT_MOODS.has(ctx.mood.id);
  const floor = FLOOR_MOODS.has(ctx.mood.id);
  const moving = ctx.bpm > MOVING;

  const usable = (n: Noun): boolean =>
    (!n.styles || n.styles.includes(ctx.style.id))
    && !(n.grave && bright)
    && !(n.tender && floor)
    && !(n.fast && !moving)
    && !(n.slow && moving);

  const nouns = NOUNS.filter(usable);
  const formats = FORMATS.filter(usable);
  const adjectives = ADJECTIVES.filter((a) => !(bright && GRAVE_ADJECTIVES.has(a)));

  const patterns: (readonly [Pattern, number])[] = [
    ['address', 6],
    ['adj-noun', 5],
    ['verb-me', 4],
    ['the-adj-noun', 3],
    ['noun-noun', 3],
    ['noun-of-noun', 2],
    ['parenthetical', 2],
  ];
  // "Saturday Discotheque" — only where the record would plausibly say so.
  if (formats.length) patterns.push(['format', 3]);
  const pattern = rng.weighted(patterns);

  const a = rng.pick(nouns);
  let b = rng.pick(nouns);
  let guard = 0;
  while (b.word === a.word && guard++ < 8) b = rng.pick(nouns);
  const adjective = rng.pick(adjectives);
  const verb = rng.pick(VERBS);

  switch (pattern) {
    case 'address':
      return `${verb} Me, ${rng.chance(0.5) ? 'Baby' : 'Darling'}`;
    case 'verb-me':
      return `${verb} the ${a.word}`;
    case 'adj-noun':
      return `${adjective} ${a.word}`;
    case 'the-adj-noun':
      return `The ${adjective} ${a.word}`;
    case 'noun-noun':
      return `${a.word} ${b.word}`;
    case 'noun-of-noun':
      return `${a.word} of ${b.word}`;
    case 'format':
      return `${adjective} ${rng.pick(formats).word}`;
    case 'parenthetical':
      return `${a.word} (${rng.pick(PARENTHETICALS)})`;
  }
}
