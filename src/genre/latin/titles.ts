/**
 * Title generation.
 *
 * In Spanish, for the same reason iskelmä's are in Finnish and jazz's are in
 * English: a record's title is a thing the record actually had, and translating
 * it is a different object. What has to be got right is not vocabulary but
 * **grammar**, and this is the first title generator in the project where that
 * is a real constraint rather than a formality — a Spanish adjective agrees with
 * its noun, so a table of nouns and a table of adjectives cannot simply be
 * multiplied together. Every noun below carries its gender and every adjective
 * carries both forms, which is four extra characters per entry and the
 * difference between a title and a mistake.
 *
 * ## The rhythm words are administrative
 *
 * A very large proportion of this repertoire's titles are literally *a rhythm
 * and a place*: the record is announcing what the band is playing and where they
 * are from, because that is what a dancer needs to know before the needle drops.
 * So the pattern is weighted heavily, and every rhythm word is gated on the
 * styles that actually play it — "Danzón de Matanzas" over a merengue is not a
 * poetic liberty, it is a mislabelled tape, and it is the same error iskelmä's
 * generator guards against with a valssi in 4/4.
 *
 * Two of them are gated more tightly than their names suggest. **Rumba** is
 * legal only on the two Cuban rumba styles and never on anything a ballroom
 * would call one — the collision `styles.ts` explains at the guaguancó. And
 * **Salsa** is legal on three styles and none of them is `son`, because a son
 * recorded in 1940 predates the word by thirty years.
 *
 * ## No names, no saints, no people
 *
 * An enormous number of real titles in this repertoire are a woman's name, or a
 * dedication, or a saint's day. Generating those means putting words in the
 * mouth of somebody who existed or inventing a devotion, and the house register
 * is against both — the same line reggae's generator draws around the
 * `X Meets Y Uptown` dub-plate shape. What is left is places, weather,
 * landscape and time of day, which is most of the rest of the repertoire anyway.
 */

import type { Rng } from '../../core/rng.js';
import type { TitleContext } from '../types.js';

type Gender = 'm' | 'f';

interface Noun {
  word: string;
  gender: Gender;
  /** Only usable when the piece is not trying to be cheerful. */
  grave?: boolean;
  /** Only usable when the piece is not trying to be hard. */
  tender?: boolean;
}

interface Rhythm {
  word: string;
  /** Styles that actually play it. */
  styles: string[];
}

/**
 * The rhythm words, and the only administrative vocabulary in the file.
 *
 * Each is the name of a dance, so each is legal on exactly the styles that are
 * it. `Montuno` is the one that spans four entries and it earns that: it names
 * the *section* rather than the dance, and every one of those four styles has
 * one.
 */
const RHYTHMS: Rhythm[] = [
  { word: 'Son', styles: ['son', 'guaracha', 'guajira'] },
  { word: 'Montuno', styles: ['son', 'salsadura', 'timba', 'songo'] },
  { word: 'Guaracha', styles: ['guaracha'] },
  { word: 'Guajira', styles: ['guajira'] },
  { word: 'Bolero', styles: ['bolero'] },
  { word: 'Danzón', styles: ['danzon'] },
  { word: 'Cha-Cha-Chá', styles: ['chachacha'] },
  { word: 'Mambo', styles: ['mambo'] },
  { word: 'Rumba', styles: ['guaguanco', 'columbia'] },
  { word: 'Guaguancó', styles: ['guaguanco'] },
  { word: 'Columbia', styles: ['columbia'] },
  { word: 'Salsa', styles: ['salsadura', 'songo', 'timba'] },
  { word: 'Songo', styles: ['songo'] },
  { word: 'Timba', styles: ['timba'] },
  { word: 'Merengue', styles: ['merengue'] },
  { word: 'Bachata', styles: ['bachata'] },
  { word: 'Cumbia', styles: ['cumbia'] },
  { word: 'Paseo', styles: ['vallenato'] },
  { word: 'Joropo', styles: ['joropo'] },
  { word: 'Plena', styles: ['plena'] },
  { word: 'Bomba', styles: ['bomba'] },
  { word: 'Samba', styles: ['samba', 'partidoalto'] },
  { word: 'Partido Alto', styles: ['partidoalto'] },
  { word: 'Baião', styles: ['baiao'] },
  { word: 'Frevo', styles: ['frevo'] },
  { word: 'Corrido', styles: ['norteno', 'banda'] },
  { word: 'Ranchera', styles: ['ranchera'] },
];

const NOUNS: Noun[] = [
  { word: 'Camino', gender: 'm' },
  { word: 'Río', gender: 'm' },
  { word: 'Puerto', gender: 'm' },
  { word: 'Barrio', gender: 'm' },
  { word: 'Sol', gender: 'm' },
  { word: 'Mar', gender: 'm' },
  { word: 'Cielo', gender: 'm' },
  { word: 'Amanecer', gender: 'm' },
  { word: 'Tambor', gender: 'm' },
  { word: 'Cañaveral', gender: 'm' },
  { word: 'Viento', gender: 'm' },
  { word: 'Monte', gender: 'm' },
  { word: 'Callejón', gender: 'm' },
  { word: 'Muelle', gender: 'm' },
  { word: 'Rincón', gender: 'm' },
  { word: 'Trópico', gender: 'm' },
  { word: 'Aguacero', gender: 'm' },
  { word: 'Naranjal', gender: 'm' },
  { word: 'Golpe', gender: 'm' },
  { word: 'Silencio', gender: 'm', grave: true },
  { word: 'Recuerdo', gender: 'm', grave: true },
  { word: 'Adiós', gender: 'm', grave: true },
  { word: 'Corazón', gender: 'm', tender: true },
  { word: 'Suspiro', gender: 'm', tender: true },
  { word: 'Noche', gender: 'f' },
  { word: 'Luna', gender: 'f' },
  { word: 'Calle', gender: 'f' },
  { word: 'Palma', gender: 'f' },
  { word: 'Lluvia', gender: 'f' },
  { word: 'Montaña', gender: 'f' },
  { word: 'Estrella', gender: 'f' },
  { word: 'Ceiba', gender: 'f' },
  { word: 'Arena', gender: 'f' },
  { word: 'Bahía', gender: 'f' },
  { word: 'Madrugada', gender: 'f' },
  { word: 'Sal', gender: 'f' },
  { word: 'Vereda', gender: 'f' },
  { word: 'Cumbre', gender: 'f' },
  { word: 'Ventana', gender: 'f' },
  { word: 'Espuma', gender: 'f' },
  { word: 'Cosecha', gender: 'f' },
  { word: 'Marea', gender: 'f' },
  { word: 'Sombra', gender: 'f', grave: true },
  { word: 'Neblina', gender: 'f', grave: true },
  { word: 'Espera', gender: 'f', grave: true },
  { word: 'Llama', gender: 'f', tender: true },
  { word: 'Promesa', gender: 'f', tender: true },
];

interface Adjective {
  m: string;
  f: string;
  grave?: boolean;
}

const ADJECTIVES: Adjective[] = [
  { m: 'Lejano', f: 'Lejana' },
  { m: 'Largo', f: 'Larga' },
  { m: 'Viejo', f: 'Vieja' },
  { m: 'Nuevo', f: 'Nueva' },
  { m: 'Dorado', f: 'Dorada' },
  { m: 'Lento', f: 'Lenta' },
  { m: 'Claro', f: 'Clara' },
  { m: 'Verde', f: 'Verde' },
  { m: 'Azul', f: 'Azul' },
  { m: 'Sereno', f: 'Serena' },
  { m: 'Hondo', f: 'Honda' },
  { m: 'Alegre', f: 'Alegre' },
  { m: 'Bravo', f: 'Brava' },
  { m: 'Sabroso', f: 'Sabrosa' },
  { m: 'Oscuro', f: 'Oscura', grave: true },
  { m: 'Amargo', f: 'Amarga', grave: true },
  { m: 'Callado', f: 'Callada', grave: true },
  { m: 'Perdido', f: 'Perdida', grave: true },
];

/** Real places, and the reason half these titles exist. */
const PLACES = [
  'La Habana', 'Santiago', 'Matanzas', 'Guantánamo', 'Cienfuegos', 'Camagüey',
  'San Juan', 'Ponce', 'Loíza', 'Santo Domingo', 'Puerto Plata',
  'Barranquilla', 'Cartagena', 'Valledupar', 'Maracaibo', 'Caracas',
  'Recife', 'Olinda', 'Bahía', 'Sinaloa', 'Jalisco', 'Monterrey', 'Veracruz',
  'El Cerro', 'La Loma', 'El Malecón', 'La Sierra', 'El Solar',
];

/** Moods a word of weight would contradict. */
const BRIGHT_MOODS = new Set(['carnaval', 'sabroso']);

/** Moods a word of tenderness would contradict. */
const STERN_MOODS = new Set(['bravo', 'rumbero']);

type Pattern =
  | 'rhythm-place' | 'rhythm-noun' | 'article-noun-adj' | 'noun-adj'
  | 'noun-place' | 'noun-y-noun' | 'noun-de-noun';

const article = (n: Noun): string => (n.gender === 'm' ? 'El' : 'La');
const contracted = (n: Noun): string => (n.gender === 'm' ? `del ${n.word}` : `de la ${n.word}`);
const agree = (a: Adjective, n: Noun): string => (n.gender === 'm' ? a.m : a.f);

export function generateTitle(rng: Rng, ctx: TitleContext): string {
  const bright = BRIGHT_MOODS.has(ctx.mood.id);
  const stern = STERN_MOODS.has(ctx.mood.id);

  const nouns = NOUNS.filter((n) => !(n.grave && bright) && !(n.tender && stern));
  const rhythms = RHYTHMS.filter((r) => r.styles.includes(ctx.style.id));
  const adjectives = ADJECTIVES.filter((a) => !(a.grave && bright));

  const patterns: (readonly [Pattern, number])[] = [
    ['article-noun-adj', 5],
    ['noun-adj', 4],
    ['noun-place', 3],
    ['noun-y-noun', 3],
    ['noun-de-noun', 2],
  ];
  /**
   * "Danzón de Matanzas" — the genre's most characteristic title shape, and it
   * exists only where the piece really is that rhythm. Where it applies it takes
   * the largest weight in the table, because in the actual repertoire it is
   * something close to a third of everything.
   */
  if (rhythms.length) {
    patterns.push(['rhythm-place', 6], ['rhythm-noun', 4]);
  }
  const pattern = rng.weighted(patterns);

  const a = rng.pick(nouns);
  let b = rng.pick(nouns);
  let guard = 0;
  while (b.word === a.word && guard++ < 8) b = rng.pick(nouns);
  const place = rng.pick(PLACES);
  const adjective = rng.pick(adjectives);

  switch (pattern) {
    case 'rhythm-place':
      return `${rng.pick(rhythms).word} de ${place}`;
    case 'rhythm-noun':
      return `${rng.pick(rhythms).word} ${contracted(a)}`;
    case 'article-noun-adj':
      return `${article(a)} ${a.word} ${agree(adjective, a)}`;
    case 'noun-adj':
      return `${a.word} ${agree(adjective, a)}`;
    case 'noun-place':
      return `${a.word} de ${place}`;
    case 'noun-y-noun':
      return `${a.word} y ${b.word}`;
    case 'noun-de-noun':
      return `${a.word} ${contracted(b)}`;
  }
}
