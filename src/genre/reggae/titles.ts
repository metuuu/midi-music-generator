/**
 * Title generation.
 *
 * Jamaican record titles are unusually easy to characterise and unusually easy to
 * get wrong, and both come from the same fact: an enormous number of them are
 * simply *a place and a rhythm*. "Trench Town Rock", "Rockfort Rock", "Real Rock",
 * "Greenwich Farm Ska". The title is not describing the song, it is labelling the
 * riddim so that the next twenty people to use it know which one you mean, and
 * that is why so many of them survived into being the names of things rather than
 * of records.
 *
 * Two vocabularies are therefore claims rather than images, and both are gated on
 * the piece:
 *
 *  - **The rhythm words.** "Steppers" on a rocksteady is not a poetic liberty, it
 *    is a mislabelled tape — the same error iskelmä's title generator guards
 *    against with "Satumaan valssi" in 4/4, and it matters more here because in
 *    this genre the rhythm word is doing an administrative job.
 *  - **The words of struggle, and the words of sweetness.** Roots reggae and
 *    lovers rock are the same music with two different subjects, and each subject
 *    reads as a mistake on the other one's record. So "Judgement" is held back
 *    from anything generated to be cheerful, and "Darling" from anything generated
 *    to be militant.
 *
 * The house register applies to the third pattern below, which is the one that
 * needs saying: `X Meets Y Uptown` is the dub-plate title shape and it is real
 * rather than a joke, but the names on the real ones are people's. Generating
 * those would be putting words in the mouth of somebody who existed, so this
 * builds the shape out of the same nouns everything else uses.
 */

import type { Rng } from '../../core/rng.js';
import type { TitleContext } from '../types.js';

interface Noun {
  word: string;
  /** Only usable when the piece is one of these styles. */
  styles?: string[];
  /** Only usable when the piece is not trying to be cheerful. */
  grave?: boolean;
  /** Only usable when the piece is not trying to be militant. */
  tender?: boolean;
}

/**
 * The rhythm words, and the only administrative vocabulary in the file.
 *
 * Each is the name of a beat, so each is legal on exactly the styles that play
 * it. `Rock` and `Riddim` are the two that stayed generic — "rock" in a Jamaican
 * title has meant "a record you can dance to" since about 1966 and never meant
 * the guitar music — so they are ungated on purpose.
 */
const RHYTHMS: Noun[] = [
  { word: 'Ska', styles: ['ska', 'twotone'] },
  { word: 'Boogie', styles: ['shuffle'] },
  { word: 'Mento', styles: ['mento'] },
  { word: 'Rocksteady', styles: ['rocksteady'] },
  { word: 'Rockers', styles: ['rockers'] },
  { word: 'Steppers', styles: ['steppers'] },
  { word: 'One Drop', styles: ['onedrop'] },
  { word: 'Flyers', styles: ['flyers'] },
  { word: 'Roots', styles: ['roots', 'onedrop', 'steppers'] },
  { word: 'Dub', styles: ['dub', 'dubpoetry'] },
  { word: 'Version', styles: ['dub', 'dubpoetry', 'rubadub'] },
  { word: 'Rub-a-Dub', styles: ['rubadub'] },
  { word: 'Chant', styles: ['nyabinghi'] },
  { word: 'Organ', styles: ['bubble', 'skinhead'] },
  { word: 'Horns', styles: ['horns'] },
  { word: 'Riddim', styles: ['slengteng', 'dancehall', 'ragga'] },
];

const NOUNS: Noun[] = [
  { word: 'Rock' },
  { word: 'Riddim' },
  { word: 'Morning' },
  { word: 'Midnight' },
  { word: 'Thunder' },
  { word: 'Lightning' },
  { word: 'River' },
  { word: 'Mountain' },
  { word: 'Valley' },
  { word: 'Harbour' },
  { word: 'Gully' },
  { word: 'Yard' },
  { word: 'Corner' },
  { word: 'Crossroads' },
  { word: 'Lion' },
  { word: 'Dove' },
  { word: 'Crown' },
  { word: 'Kingdom' },
  { word: 'Foundation' },
  { word: 'Cornerstone' },
  { word: 'Message' },
  { word: 'Chapter' },
  { word: 'Promise' },
  { word: 'Sunshine' },
  { word: 'Shadow' },
  { word: 'Stone' },
  { word: 'Water' },
  { word: 'Fire' },
  { word: 'Wind' },
  { word: 'Road' },
  { word: 'Ladder' },
  { word: 'Garden' },
  { word: 'Harvest' },
  { word: 'Judgement', grave: true },
  { word: 'Warning', grave: true },
  { word: 'Exile', grave: true },
  { word: 'Redemption', grave: true },
  { word: 'Tribulation', grave: true },
  { word: 'Reckoning', grave: true },
  { word: 'Freedom', grave: true },
  { word: 'Darling', tender: true },
  { word: 'Sweetness', tender: true },
  { word: 'Letter', tender: true },
  { word: 'Feeling', tender: true },
  { word: 'Whisper', tender: true },
];

/** Real places, and the reason half these titles exist. */
const PLACES = [
  'Kingston', 'Trench Town', 'Rockfort', 'Waterhouse', 'Greenwich Farm',
  'Orange Street', 'Maxfield Avenue', 'Spanish Town', 'Port Royal',
  'Half Way Tree', 'Constant Spring', 'Denham Town', 'Jones Town',
  'Cross Roads', 'Papine', 'Duhaney Park', 'Coventry', 'Brixton',
];

const ADJECTIVES = [
  'Heavy', 'Natural', 'Cool', 'Rocking', 'Golden', 'Silent', 'Distant',
  'Rolling', 'Ancient', 'Humble', 'Sweet', 'Easy', 'Stony', 'Deep',
  'Long', 'Quiet', 'Bright', 'Wandering',
];

/** Adjectives of weight, held back from anything generated to be cheerful. */
const GRAVE_ADJECTIVES = new Set(['Ancient', 'Silent', 'Distant', 'Stony', 'Deep']);

/** Moods a word of struggle would contradict. */
const BRIGHT_MOODS = new Set(['jump', 'sweet', 'easy']);

/** Moods a word of romance would contradict. */
const STERN_MOODS = new Set(['conscious', 'heavy', 'rough', 'echo']);

type Pattern =
  | 'place-rhythm' | 'adj-noun' | 'noun-noun' | 'the-noun'
  | 'noun-of-noun' | 'meets-uptown' | 'place-noun';

export function generateTitle(rng: Rng, ctx: TitleContext): string {
  const bright = BRIGHT_MOODS.has(ctx.mood.id);
  const stern = STERN_MOODS.has(ctx.mood.id);

  const usable = (n: Noun): boolean =>
    (!n.styles || n.styles.includes(ctx.style.id))
    && !(n.grave && bright)
    && !(n.tender && stern);

  const nouns = NOUNS.filter(usable);
  const rhythms = RHYTHMS.filter(usable);
  const adjectives = ADJECTIVES.filter((a) => !(bright && GRAVE_ADJECTIVES.has(a)));

  const patterns: (readonly [Pattern, number])[] = [
    ['adj-noun', 5],
    ['noun-noun', 4],
    ['the-noun', 3],
    ['place-noun', 3],
    ['noun-of-noun', 2],
  ];
  /**
   * "Trench Town Rock" — the genre's most characteristic title shape, and it only
   * exists where the piece really is that rhythm. Where it applies it deserves
   * the largest weight in the table, because in the actual repertoire it is
   * roughly a third of everything.
   */
  if (rhythms.length) patterns.push(['place-rhythm', 6]);
  // The dub plate. Only where there is a version to name.
  if (ctx.style.id === 'dub' || ctx.style.id === 'dubpoetry') {
    patterns.push(['meets-uptown', 3]);
  }
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
    case 'the-noun':
      return `The ${adjective} ${a.word}`;
    case 'place-noun':
      return `${place} ${a.word}`;
    case 'noun-of-noun':
      return `${a.word} of ${b.word}`;
    case 'meets-uptown':
      return `${a.word} Meets ${b.word} Uptown`;
  }
}
