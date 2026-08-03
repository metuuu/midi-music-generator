/**
 * Title generation.
 *
 * Rock titles are shorter than any other repertoire's in this project and the
 * reason is structural rather than stylistic: the title is almost always a
 * phrase that is *already in the chorus*, so it has to be four words at most and
 * has to be singable. That rules out most of what a title generator wants to do.
 * There are no compound announcements here — nothing corresponding to iskelmä's
 * "Satumaan valssi" or reggae's "Trench Town Rock", where the title names the
 * rhythm as an administrative act — because a rock record does not need
 * labelling for anybody's benefit.
 *
 * What the genre has instead is the **imperative**, which is the one title shape
 * that belongs to it and to nothing else here. "Break", "Run", "Burn", "Hold" —
 * a verb aimed at somebody, with no subject, which is a thing a shouted chorus
 * does and a thing a dance-band title never does. It is weighted highest of the
 * six patterns below for that reason.
 *
 * Three gates, and the third is the one the other genres do not have:
 *
 *  - **Words of weight** are held back from anything generated to be cheerful,
 *    and **words of tenderness** from anything generated to be loud. The same
 *    device reggae uses, and for the same reason: "Reckoning" on a bright
 *    two-minute single reads as a mistake rather than as a liberty.
 *  - **Rhythm words** — Boogie, Stomp, Shuffle — are legal only on the styles
 *    that play them, which is a short list here. A stomp is a specific thing the
 *    band is doing and a title claiming one over a shoegaze record is a
 *    mislabelled tape.
 *  - **Speed words** are gated on the *tempo actually chosen*, not on the
 *    style's band. `TitleContext.bpm` exists for exactly this and nothing else
 *    in the project reads it. "Highway", "Runaway", "Overdrive" and "Wire" are
 *    about motion and belong on something moving; "Slow", "Sleep", "Ash" and
 *    "Hollow" belong on something that is not. The threshold is 120 BPM, which
 *    is where a rock record stops feeling like it is going somewhere and starts
 *    feeling like it is standing still — and it is drawn from the tempo the song
 *    ended up at, so the same style titles itself differently at the two ends of
 *    its own band, which is right.
 */

import type { Rng } from '../../core/rng.js';
import type { TitleContext } from '../types.js';

interface Noun {
  word: string;
  /** Only usable when the piece is one of these styles. */
  styles?: string[];
  /** Only usable when the piece is not trying to be cheerful. */
  grave?: boolean;
  /** Only usable when the piece is not trying to be loud. */
  tender?: boolean;
  /** Only usable above 120 BPM. */
  fast?: boolean;
  /** Only usable at or below 120 BPM. */
  slow?: boolean;
}

/**
 * The rhythm words, and the whole of the genre's administrative vocabulary —
 * which is four entries, against reggae's sixteen.
 *
 * That difference is the interesting part. In Jamaica the rhythm word on the
 * label told the next twenty producers which riddim you meant; in rock nobody
 * was versioning anything, so the only rhythm words that survived are the ones
 * that were already dance names before the guitar arrived.
 */
const RHYTHMS: Noun[] = [
  { word: 'Boogie', styles: ['boogie', 'bluesrock', 'southern'] },
  { word: 'Shuffle', styles: ['bluesrock', 'boogie', 'southern', 'beat'] },
  { word: 'Stomp', styles: ['glam', 'boogie', 'garage'] },
  { word: 'Blues', styles: ['bluesrock', 'southern', 'psych'] },
];

const NOUNS: Noun[] = [
  { word: 'Fire' },
  { word: 'Stone' },
  { word: 'Iron' },
  { word: 'Glass' },
  { word: 'Smoke' },
  { word: 'Thunder' },
  { word: 'Lightning' },
  { word: 'River' },
  { word: 'Mountain' },
  { word: 'Valley' },
  { word: 'Winter' },
  { word: 'Summer' },
  { word: 'Morning' },
  { word: 'Midnight' },
  { word: 'Daylight' },
  { word: 'Machine' },
  { word: 'Engine' },
  { word: 'Circle' },
  { word: 'Mirror' },
  { word: 'Window' },
  { word: 'Ladder' },
  { word: 'Hammer' },
  { word: 'Anchor' },
  { word: 'Static' },
  { word: 'Signal' },
  { word: 'Trouble' },
  { word: 'Fever' },
  { word: 'Heaven' },
  { word: 'Kingdom' },
  { word: 'Border' },
  { word: 'Harbour' },

  // Motion. Above 120 only — see the header.
  { word: 'Highway', fast: true },
  { word: 'Runaway', fast: true },
  { word: 'Overdrive', fast: true },
  { word: 'Wire', fast: true },
  { word: 'Wheels', fast: true },
  { word: 'Sparks', fast: true },

  // Stillness. Below 120 only.
  { word: 'Ash', slow: true },
  { word: 'Hollow', slow: true },
  { word: 'Shadow', slow: true },
  { word: 'Sleep', slow: true },
  { word: 'Tide', slow: true },
  { word: 'Dust', slow: true },

  // Weight. Not on anything cheerful.
  { word: 'Reckoning', grave: true },
  { word: 'Gallows', grave: true },
  { word: 'Ruin', grave: true },
  { word: 'Exile', grave: true },
  { word: 'Judgement', grave: true },
  { word: 'Famine', grave: true },

  // Tenderness. Not on anything loud.
  { word: 'Letter', tender: true },
  { word: 'Promise', tender: true },
  { word: 'Garden', tender: true },
  { word: 'Sunday', tender: true },
  { word: 'Feather', tender: true },
  { word: 'Lullaby', tender: true },
];

/**
 * The verbs, and the pattern that uses them is the genre's own.
 *
 * All of them are one syllable except two, which is not an accident of the list
 * — a shouted chorus has one strong beat for the verb and a three-syllable one
 * arrives late. The two longer ones are here because they are the two a singer
 * genuinely does stretch across two beats.
 */
const VERBS = [
  'Break', 'Burn', 'Run', 'Hold', 'Turn', 'Drive', 'Chase', 'Cut',
  'Wake', 'Leave', 'Bring', 'Take', 'Shake', 'Ride', 'Follow', 'Carry',
];

const ADJECTIVES = [
  'Electric', 'Golden', 'Restless', 'Crooked', 'Wild', 'Silver', 'Heavy',
  'Distant', 'Hollow', 'Bitter', 'Endless', 'Broken', 'Rolling', 'Blinding',
  'Quiet', 'Patient', 'Ragged', 'Iron',
];

/** Adjectives of weight, held back from anything generated to be cheerful. */
const GRAVE_ADJECTIVES = new Set(['Bitter', 'Broken', 'Hollow', 'Distant', 'Ragged']);

/** Moods a word of weight would contradict. */
const BRIGHT_MOODS = new Set(['bright', 'swagger']);

/** Moods a word of tenderness would contradict. */
const LOUD_MOODS = new Set(['heavy', 'raw', 'swagger']);

/** Where a rock record stops feeling like it is going somewhere. */
const MOVING = 120;

type Pattern =
  | 'imperative' | 'adj-noun' | 'the-adj-noun' | 'noun-noun'
  | 'noun-of-noun' | 'rhythm';

export function generateTitle(rng: Rng, ctx: TitleContext): string {
  const bright = BRIGHT_MOODS.has(ctx.mood.id);
  const loud = LOUD_MOODS.has(ctx.mood.id);
  const moving = ctx.bpm > MOVING;

  const usable = (n: Noun): boolean =>
    (!n.styles || n.styles.includes(ctx.style.id))
    && !(n.grave && bright)
    && !(n.tender && loud)
    && !(n.fast && !moving)
    && !(n.slow && moving);

  const nouns = NOUNS.filter(usable);
  const rhythms = RHYTHMS.filter(usable);
  const adjectives = ADJECTIVES.filter((a) => !(bright && GRAVE_ADJECTIVES.has(a)));

  const patterns: (readonly [Pattern, number])[] = [
    ['imperative', 6],
    ['adj-noun', 5],
    ['noun-noun', 3],
    ['the-adj-noun', 3],
    ['noun-of-noun', 2],
  ];
  // "Midnight Boogie" — only where the band really is playing one.
  if (rhythms.length) patterns.push(['rhythm', 4]);
  const pattern = rng.weighted(patterns);

  const a = rng.pick(nouns);
  let b = rng.pick(nouns);
  let guard = 0;
  while (b.word === a.word && guard++ < 8) b = rng.pick(nouns);
  const adjective = rng.pick(adjectives);
  const verb = rng.pick(VERBS);

  switch (pattern) {
    case 'imperative':
      return `${verb} the ${a.word}`;
    case 'adj-noun':
      return `${adjective} ${a.word}`;
    case 'the-adj-noun':
      return `The ${adjective} ${a.word}`;
    case 'noun-noun':
      return `${a.word} ${b.word}`;
    case 'noun-of-noun':
      return `${a.word} of ${b.word}`;
    case 'rhythm':
      return `${a.word} ${rng.pick(rhythms).word}`;
  }
}
