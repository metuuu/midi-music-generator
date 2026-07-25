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
 */

import type { Rng } from '../core/rng.js';

interface Noun {
  nom: string;
  gen: string;
}

const NOUNS: Noun[] = [
  { nom: 'satumaa', gen: 'satumaan' },
  { nom: 'kuutamo', gen: 'kuutamon' },
  { nom: 'kaipuu', gen: 'kaipuun' },
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
  { nom: 'valssi', gen: 'valssin' },
  { nom: 'tango', gen: 'tangon' },
  { nom: 'sydän', gen: 'sydämen' },
  { nom: 'unelma', gen: 'unelman' },
  { nom: 'hiljaisuus', gen: 'hiljaisuuden' },
  { nom: 'kaiho', gen: 'kaihon' },
  { nom: 'onni', gen: 'onnen' },
  { nom: 'toive', gen: 'toiveen' },
  { nom: 'ranta', gen: 'rannan' },
  { nom: 'taivas', gen: 'taivaan' },
  { nom: 'tuuli', gen: 'tuulen' },
  { nom: 'sade', gen: 'sateen' },
  { nom: 'lumi', gen: 'lumen' },
  { nom: 'kotiseutu', gen: 'kotiseudun' },
  { nom: 'nuoruus', gen: 'nuoruuden' },
  { nom: 'kyynel', gen: 'kyyneleen' },
  { nom: 'sävel', gen: 'sävelen' },
  { nom: 'lupaus', gen: 'lupauksen' },
];

const ADJECTIVES = [
  'yksinäinen', 'hiljainen', 'viimeinen', 'kaunis', 'kaukainen', 'vanha',
  'kultainen', 'sininen', 'punainen', 'ikuinen', 'unohtumaton', 'haikea',
  'kirkas', 'pitkä', 'hopeinen', 'lämmin', 'kylmä', 'suloinen',
];

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generateTitle(rng: Rng): string {
  const pattern = rng.weighted([
    ['adj-noun', 5],
    ['gen-noun', 5],
    ['noun-ja-noun', 3],
    ['viimeinen', 2],
    ['gen-adj-noun', 2],
  ] as const);

  const a = rng.pick(NOUNS);
  let b = rng.pick(NOUNS);
  let guard = 0;
  while (b.nom === a.nom && guard++ < 8) b = rng.pick(NOUNS);
  const adj = rng.pick(ADJECTIVES);

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
  }
}
