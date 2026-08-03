/**
 * Title generation.
 *
 * Country titles are the most literal in this project and that is the thing to
 * get right. A Jamaican title labels a riddim; a Finnish one is an image; a jazz
 * one is frequently a private joke. A country title is *the hook line of the
 * chorus, verbatim* — "Your Cheatin' Heart", "He Stopped Loving Her Today",
 * "Six Days on the Road", "Mama Tried". The song has a sentence in it that the
 * whole thing is built to deliver, and the sentence goes on the label.
 *
 * That is not generable and should not be faked. What is generable is the second
 * commonest shape, which is nearly as characteristic and much older: **a place and
 * a thing**, or **a thing and a rhythm**. "Wabash Cannonball", "Orange Blossom
 * Special", "Nashville Blues", "Kentucky Waltz", "Cumberland Gap", "Blue Ridge
 * Cabin Home". Half the string-band repertoire is named this way and it stayed the
 * default for fifty years after.
 *
 * Two vocabularies are therefore claims rather than images, and both are gated on
 * the piece:
 *
 *  - **The rhythm words.** "Waltz" on a two-step is not a poetic liberty, it is a
 *    mislabelled record — the same error iskelmä's generator guards against with
 *    "Satumaan valssi" in 4/4. It matters here because in this repertoire the
 *    rhythm word tells a band standing in front of you what to count.
 *  - **The words of drink and dying, and the words of home.** Country's two
 *    subjects are trouble and belonging, and each reads as a mistake on the
 *    other's record. So "Whiskey" is held back from anything generated to be
 *    devotional and "Cradle" from anything generated to be hard luck.
 *
 * The place list is real American places, exactly as reggae's is real Jamaican
 * ones, and for the same reason: half of these titles exist because somebody
 * wanted to name where they were from. What the file deliberately does not
 * generate is a *person's* name — "Wreck of the Old 97" is a shape and "Hank" is
 * somebody's father.
 */

import type { Rng } from '../../core/rng.js';
import type { TitleContext } from '../types.js';

interface Noun {
  word: string;
  /** Only usable when the piece is one of these styles. */
  styles?: string[];
  /** Only usable when the piece is not trying to be devotional or cheerful. */
  hard?: boolean;
  /** Only usable when the piece is not trying to be hard-bitten. */
  tender?: boolean;
}

/**
 * The rhythm words, and the only administrative vocabulary in the file.
 *
 * Each names a beat or a dance, so each is legal on exactly the styles that play
 * it. `Blues` is the one that stayed generic and it is ungated on purpose: in a
 * country title it has meant "a slow one about being unhappy" since about 1925
 * and has almost never meant twelve bars.
 */
const RHYTHMS: Noun[] = [
  { word: 'Breakdown', styles: ['breakdown', 'bluegrass', 'newgrass'] },
  { word: 'Reel', styles: ['breakdown'] },
  { word: 'Hoedown', styles: ['breakdown', 'bluegrass'] },
  { word: 'Special', styles: ['breakdown', 'bluegrass', 'newgrass', 'trainsong'] },
  { word: 'Waltz', styles: ['waltz', 'bluegrasswaltz'] },
  { word: 'Two-Step', styles: ['twostep', 'cajun'] },
  { word: 'Shuffle', styles: ['honkytonk', 'westernswing'] },
  { word: 'Stomp', styles: ['westernswing', 'zydeco'] },
  { word: 'Rag', styles: ['breakdown', 'westernswing'] },
  { word: 'Boogie', styles: ['rockabilly', 'trainsong', 'zydeco'] },
  { word: 'Hymn', styles: ['gospel'] },
  { word: 'Blues' },
];

/**
 * Nouns that take a place after them, and the only ones that do.
 *
 * "Streets of Laredo", "Banks of the Ohio", "Pines of Carolina". The `X of Y`
 * shape is real and old, and it is *entirely* a shape about geography: the second
 * half is always somewhere, never another object. Drawing the second half from the
 * general noun list produced "River of Kitchen" and "Sundown of Mockingbird",
 * which is the exact failure mode a two-slot pattern has when neither slot is
 * constrained — both halves are individually plausible and the pair is not English.
 */
const PLACE_NOUNS = [
  'Banks', 'Streets', 'Hills', 'Fields', 'Roads', 'Pines', 'Rain', 'Dust',
  'Wind', 'Sundown', 'Bells',
];

const NOUNS: Noun[] = [
  { word: 'Rain' },
  { word: 'Moon' },
  { word: 'Morning' },
  { word: 'Midnight' },
  { word: 'Sunday' },
  { word: 'Saturday' },
  { word: 'Highway' },
  { word: 'Freight' },
  { word: 'Depot' },
  { word: 'Diesel' },
  { word: 'Ridge' },
  { word: 'Holler' },
  { word: 'Pines' },
  { word: 'River' },
  { word: 'Creek' },
  { word: 'Bottomland' },
  { word: 'Dust' },
  { word: 'Cotton' },
  { word: 'Wheat' },
  { word: 'Fence' },
  { word: 'Porch' },
  { word: 'Kitchen' },
  { word: 'Letter' },
  { word: 'Sundown' },
  { word: 'Wire' },
  { word: 'Boots' },
  { word: 'Wagon' },
  { word: 'Mockingbird' },
  { word: 'Whippoorwill' },
  { word: 'Bluebird' },
  { word: 'Hound' },
  { word: 'Whiskey', hard: true },
  { word: 'Jukebox', hard: true },
  { word: 'Barroom', hard: true },
  { word: 'Trouble', hard: true },
  { word: 'Gallows', hard: true },
  { word: 'Grave', hard: true },
  { word: 'Devil', hard: true },
  { word: 'Pistol', hard: true },
  { word: 'Ramble', hard: true },
  { word: 'Cradle', tender: true },
  { word: 'Cabin', tender: true },
  { word: 'Sweetheart', tender: true },
  { word: 'Sunday Dress', tender: true },
  { word: 'Homecoming', tender: true },
  { word: 'Rocking Chair', tender: true },
];

/** Real places, and the reason half of these titles exist. */
const PLACES = [
  'Nashville', 'Bristol', 'Knoxville', 'Amarillo', 'Abilene', 'Bakersfield',
  'El Paso', 'Galveston', 'Muskogee', 'Wichita', 'Tulsa', 'Memphis',
  'Luckenbach', 'Lafayette', 'Cumberland', 'Shenandoah', 'Red River',
  'Rio Grande', 'Kentucky', 'Tennessee', 'Carolina', 'Blue Ridge',
];

const ADJECTIVES = [
  'Lonesome', 'Blue', 'Old', 'Long', 'Cold', 'Rambling', 'Ragged', 'Golden',
  'Silver', 'Wild', 'Faded', 'High', 'Dusty', 'Sweet', 'Quiet', 'Crooked',
  'Rainy', 'Half-Broke',
];

/** Adjectives of weather and wear, held back from anything devotional. */
const HARD_ADJECTIVES = new Set(['Ragged', 'Crooked', 'Half-Broke', 'Dusty', 'Cold']);

/** Moods a word about drink or dying would contradict. */
const BRIGHT_MOODS = new Set(['sunday', 'hoedown']);

/** Moods a word about home would contradict. */
const STERN_MOODS = new Set(['hardluck', 'barroom', 'lonesome']);

type Pattern =
  | 'place-rhythm' | 'adj-noun' | 'noun-noun' | 'the-adj-noun'
  | 'noun-of-place' | 'place-noun' | 'adj-place-noun' | 'back-to-place';

export function generateTitle(rng: Rng, ctx: TitleContext): string {
  const bright = BRIGHT_MOODS.has(ctx.mood.id);
  const stern = STERN_MOODS.has(ctx.mood.id);

  const usable = (n: Noun): boolean =>
    (!n.styles || n.styles.includes(ctx.style.id))
    && !(n.hard && bright)
    && !(n.tender && stern);

  const nouns = NOUNS.filter(usable);
  const rhythms = RHYTHMS.filter(usable);
  const adjectives = ADJECTIVES.filter((a) => !(bright && HARD_ADJECTIVES.has(a)));

  const patterns: (readonly [Pattern, number])[] = [
    ['adj-noun', 6],
    ['place-noun', 4],
    ['noun-noun', 3],
    ['the-adj-noun', 3],
    ['adj-place-noun', 2],
    ['noun-of-place', 2],
  ];
  /**
   * "Kentucky Waltz" — the shape that is a third of the string-band repertoire,
   * and it only exists where the piece really is that rhythm. Where it applies it
   * deserves the largest weight in the table.
   */
  if (rhythms.length) patterns.push(['place-rhythm', 6]);
  /**
   * "Back to Abilene". A whole subgenre of this music is about leaving somewhere
   * and a slightly larger one is about wanting to go back, and the second is only
   * available to a song that is not currently pleased about anything.
   */
  if (stern) patterns.push(['back-to-place', 3]);

  const pattern = rng.weighted(patterns);

  const a = rng.pick(nouns);
  let b = rng.pick(nouns);
  let guard = 0;
  while (b.word === a.word && guard++ < 8) b = rng.pick(nouns);
  const place = rng.pick(PLACES);
  const adjective = rng.pick(adjectives);

  switch (pattern) {
    case 'place-rhythm':
      return `${place} ${rng.pick(rhythms).word}`;
    case 'adj-noun':
      return `${adjective} ${a.word}`;
    case 'noun-noun':
      return `${a.word} ${b.word}`;
    case 'the-adj-noun':
      return `The ${adjective} ${a.word}`;
    case 'place-noun':
      return `${place} ${a.word}`;
    case 'adj-place-noun':
      return `${adjective} ${place} ${a.word}`;
    case 'noun-of-place':
      return `${rng.pick(PLACE_NOUNS)} of ${place}`;
    case 'back-to-place':
      return `Back to ${place}`;
  }
}
