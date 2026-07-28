/**
 * Jazz title generation.
 *
 * Standards titles cluster around a small set of shapes — a colour or a time of
 * day attached to a noun, a place, a dedication, or a dance instruction — which
 * makes them easy to generate without sounding like a random word pair.
 *
 * Some of the vocabulary names the music rather than picturing something, and
 * those words are gated on the piece: see `CLAIMS`.
 */

import type { Rng } from '../../core/rng.js';
import type { TitleContext } from '../types.js';

const NOUNS = [
  'blues', 'moon', 'rain', 'street', 'avenue', 'mood', 'groove', 'shadow',
  'velvet', 'mist', 'lullaby', 'waltz', 'stomp', 'bounce', 'swing', 'dream',
  'sketch', 'portrait', 'letter', 'window', 'harbour', 'lantern', 'echo',
  'silhouette', 'boulevard', 'stairway', 'carousel', 'afternoon', 'evening',
  'daybreak', 'reverie', 'interlude', 'ballad', 'rhythm', 'sidewalk', 'train',
];

const ADJECTIVES = [
  'blue', 'midnight', 'little', 'lazy', 'sweet', 'slow', 'crooked', 'quiet',
  'crimson', 'golden', 'restless', 'velvet', 'smoky', 'lonesome', 'easy',
  'silver', 'wandering', 'tender', 'careless', 'rainy',
];

const PLACES = [
  'Harlem', 'Montmartre', 'the Village', 'Bourbon Street', 'the Bowery',
  'Copenhagen', 'Rio', 'Lisbon', 'the Delta', 'Chelsea', 'Marseille',
  'the boulevard', 'the east side', 'the harbour', 'Brooklyn',
];

const NAMES = [
  'Clara', 'Django', 'Miles', 'Ruby', 'Sonny', 'Lucille', 'Marcel', 'Ida',
  'Theo', 'Bess', 'Otto', 'Nadine',
];

const TIMES = ['midnight', 'sunday', 'autumn', 'april', 'september', 'monday morning', 'the small hours'];

/** Whether the piece is one a blues title can honestly be put on. */
function bluesy(c: TitleContext): boolean {
  return c.style.id === 'blues' || c.mood.id === 'bluesy';
}

/**
 * Words that assert something about the music instead of picturing something.
 *
 * A bossa is not a swing, a bebop head at 240 is not a lullaby, and nothing in
 * this repertoire is a waltz unless the bar says so — the piece has to earn
 * these before they go in the pot. Everything not listed here is imagery and
 * always available.
 */
const CLAIMS: Record<string, (c: TitleContext) => boolean> = {
  swing: (c) => c.style.swing > 0,
  stomp: (c) => c.style.swing > 0 && c.bpm >= 140,
  bounce: (c) => c.style.swing > 0 && c.bpm >= 130,
  waltz: (c) => c.style.beatsPerBar === 3,
  blues: bluesy,
  ballad: (c) => c.bpm <= 90,
  lullaby: (c) => c.bpm <= 100,
  reverie: (c) => c.bpm <= 130,
  // Tempo words, which is what most of these adjectives are.
  lazy: (c) => c.bpm <= 150,
  slow: (c) => c.bpm <= 110,
  easy: (c) => c.bpm <= 170,
  restless: (c) => c.bpm >= 120,
  quiet: (c) => c.bpm <= 170 && c.mood.id !== 'hot',
};

function fit(words: readonly string[], c: TitleContext): string[] {
  return words.filter((w) => CLAIMS[w]?.(c) ?? true);
}

// First letter only. A word boundary would also catch the one after an
// apostrophe, which is how "Sonny's echo" became "Sonny'S echo".
function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type Pattern =
  | 'adj-noun' | 'noun-in-place' | 'time-noun' | 'noun-for-name'
  | 'name-noun' | 'adj-noun-blues';

export function generateTitle(rng: Rng, ctx: TitleContext): string {
  const patterns: (readonly [Pattern, number])[] = [
    ['adj-noun', 6],
    ['noun-in-place', 4],
    ['time-noun', 4],
    ['noun-for-name', 3],
    ['name-noun', 2],
  ];
  // "…Blues" is a claim about the form, not a mood word, so it only goes on a
  // piece that is one.
  if (bluesy(ctx)) patterns.push(['adj-noun-blues', 3]);
  const pattern = rng.weighted(patterns);

  const noun = rng.pick(fit(NOUNS, ctx));
  const adj = rng.pick(fit(ADJECTIVES, ctx));

  switch (pattern) {
    case 'adj-noun':
      return capitalise(`${adj} ${noun}`);
    case 'noun-in-place':
      return capitalise(`${noun} in ${rng.pick(PLACES)}`);
    case 'time-noun':
      return capitalise(`${rng.pick(TIMES)} ${noun}`);
    case 'noun-for-name':
      return capitalise(`${noun} for ${rng.pick(NAMES)}`);
    case 'adj-noun-blues':
      return capitalise(`${adj} ${rng.pick(PLACES).replace(/^the /, '')} blues`);
    case 'name-noun':
      return capitalise(`${rng.pick(NAMES)}'s ${noun}`);
  }
}
