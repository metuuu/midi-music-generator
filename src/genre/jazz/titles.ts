/**
 * Jazz title generation.
 *
 * Standards titles cluster around a small set of shapes — a colour or a time of
 * day attached to a noun, a place, a dedication, or a dance instruction — which
 * makes them easy to generate without sounding like a random word pair.
 */

import type { Rng } from '../../core/rng.js';

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

function capitalise(s: string): string {
  return s.replace(/\b[a-z]/, (c) => c.toUpperCase());
}

export function generateTitle(rng: Rng): string {
  const pattern = rng.weighted([
    ['adj-noun', 6],
    ['noun-in-place', 4],
    ['time-noun', 4],
    ['noun-for-name', 3],
    ['adj-noun-blues', 3],
    ['name-noun', 2],
  ] as const);

  const noun = rng.pick(NOUNS);
  const adj = rng.pick(ADJECTIVES);

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
