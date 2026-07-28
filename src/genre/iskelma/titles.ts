/**
 * Title generation.
 *
 * A radio station needs something to put on the display. Iskelmä titles are
 * remarkably consistent in their imagery: landscape, seasons, night, longing,
 * and the road home.
 *
 * Finnish inflection is not something to improvise, so genitive forms are
 * stored explicitly rather than derived. Adjectives in nominative singular do
 * not agree beyond number/case, which makes the "adjective + noun" pattern
 * always safe.
 *
 * Two things in the vocabulary are claims rather than images and are gated on
 * the piece: the dance names, which are the whole point of the genre's titles
 * and would be a straightforward error on the wrong rhythm — "Satumaan valssi"
 * in 4/4 is not a valssi — and the words of loss, which have no business on a
 * piece generated to be cheerful.
 */

import type { Rng } from '../../core/rng.js';
import type { TitleContext } from '../types.js';

interface Noun {
  nom: string;
  gen: string;
  /** Only usable when the piece is this style. */
  dance?: string;
  /** Only usable when the piece is not trying to be happy. */
  sad?: boolean;
}

const NOUNS: Noun[] = [
  { nom: 'satumaa', gen: 'satumaan' },
  { nom: 'kuutamo', gen: 'kuutamon' },
  { nom: 'kaipuu', gen: 'kaipuun', sad: true },
  { nom: 'ilta', gen: 'illan' },
  { nom: 'yö', gen: 'yön' },
  { nom: 'aamu', gen: 'aamun' },
  { nom: 'kesä', gen: 'kesän' },
  { nom: 'syksy', gen: 'syksyn' },
  { nom: 'talvi', gen: 'talven' },
  { nom: 'kevät', gen: 'kevään' },
  { nom: 'meri', gen: 'meren' },
  { nom: 'järvi', gen: 'järven' },
  { nom: 'saari', gen: 'saaren' },
  { nom: 'metsä', gen: 'metsän' },
  { nom: 'koivu', gen: 'koivun' },
  { nom: 'ruusu', gen: 'ruusun' },
  { nom: 'tähti', gen: 'tähden' },
  { nom: 'tie', gen: 'tien' },
  { nom: 'silta', gen: 'sillan' },
  { nom: 'rakkaus', gen: 'rakkauden' },
  { nom: 'muisto', gen: 'muiston' },
  { nom: 'laulu', gen: 'laulun' },
  { nom: 'valssi', gen: 'valssin', dance: 'valssi' },
  { nom: 'tango', gen: 'tangon', dance: 'tango' },
  { nom: 'humppa', gen: 'humpan', dance: 'humppa' },
  { nom: 'jenkka', gen: 'jenkan', dance: 'jenkka' },
  { nom: 'sydän', gen: 'sydämen' },
  { nom: 'unelma', gen: 'unelman' },
  { nom: 'hiljaisuus', gen: 'hiljaisuuden', sad: true },
  { nom: 'kaiho', gen: 'kaihon', sad: true },
  { nom: 'onni', gen: 'onnen' },
  { nom: 'toive', gen: 'toiveen' },
  { nom: 'ranta', gen: 'rannan' },
  { nom: 'taivas', gen: 'taivaan' },
  { nom: 'tuuli', gen: 'tuulen' },
  { nom: 'sade', gen: 'sateen' },
  { nom: 'lumi', gen: 'lumen' },
  { nom: 'kotiseutu', gen: 'kotiseudun' },
  { nom: 'nuoruus', gen: 'nuoruuden' },
  { nom: 'kyynel', gen: 'kyyneleen', sad: true },
  { nom: 'sävel', gen: 'sävelen' },
  { nom: 'lupaus', gen: 'lupauksen' },
];

const ADJECTIVES = [
  'yksinäinen', 'hiljainen', 'viimeinen', 'kaunis', 'kaukainen', 'vanha',
  'kultainen', 'sininen', 'punainen', 'ikuinen', 'unohtumaton', 'haikea',
  'kirkas', 'pitkä', 'hopeinen', 'lämmin', 'kylmä', 'suloinen',
];

/** Adjectives of loss, held back from the cheerful moods. */
const SAD_ADJECTIVES = new Set(['yksinäinen', 'haikea', 'kylmä', 'viimeinen']);

/** Moods that would be contradicted by a word of loss in the title. */
const BRIGHT_MOODS = new Set(['iloinen', 'tanssittava']);

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type Pattern =
  | 'adj-noun' | 'gen-noun' | 'noun-ja-noun' | 'viimeinen' | 'gen-adj-noun'
  | 'gen-dance';

export function generateTitle(rng: Rng, ctx: TitleContext): string {
  const bright = BRIGHT_MOODS.has(ctx.mood.id);
  const nouns = NOUNS.filter(
    (n) => (!n.dance || n.dance === ctx.style.id) && !(n.sad && bright),
  );
  const adjectives = ADJECTIVES.filter((a) => !(bright && SAD_ADJECTIVES.has(a)));
  const dance = NOUNS.find((n) => n.dance === ctx.style.id);

  const patterns: (readonly [Pattern, number])[] = [
    ['adj-noun', 5],
    ['gen-noun', 5],
    ['noun-ja-noun', 3],
    ['gen-adj-noun', 2],
  ];
  // "Viimeinen…" is a farewell whatever noun follows it.
  if (!bright) patterns.push(['viimeinen', 2]);
  // "Satumaan valssi" is the genre's most characteristic title shape, and it
  // only exists when the piece is that dance — which is the whole reason the
  // dance words are gated. Where it applies it deserves real weight.
  if (dance) patterns.push(['gen-dance', 3]);
  const pattern = rng.weighted(patterns);

  const a = rng.pick(nouns);
  let b = rng.pick(nouns);
  let guard = 0;
  while (b.nom === a.nom && guard++ < 8) b = rng.pick(nouns);
  const adj = rng.pick(adjectives);

  switch (pattern) {
    case 'adj-noun':
      return capitalise(`${adj} ${a.nom}`);
    case 'gen-noun':
      return capitalise(`${a.gen} ${b.nom}`);
    case 'noun-ja-noun':
      return capitalise(`${a.nom} ja ${b.nom}`);
    case 'viimeinen':
      return capitalise(`viimeinen ${a.nom}`);
    case 'gen-adj-noun':
      return capitalise(`${a.gen} ${adj} ${b.nom}`);
    case 'gen-dance':
      return capitalise(`${(a.dance ? b : a).gen} ${dance!.nom}`);
  }
}
