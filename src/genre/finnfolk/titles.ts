/**
 * Title generation.
 *
 * Finnish folk tunes are titled by a rule so consistent it is nearly a filing
 * system: **whose it is, or where it is from, and then which dance it is.**
 * "Kaustisen polska", "Ilomantsin masurkka", "Antin polkka". The title is not
 * describing the music, it is telling the next fiddler which of the four hundred
 * polskas you mean — which is the same administrative job reggae's titles do,
 * arrived at independently in a country with no records in it.
 *
 * That makes the dance word a **claim** rather than an image, and a wrong one is
 * not a poetic liberty, it is a mislabelled tune. Gated on the style, exactly as
 * iskelmä gates "valssi" and for the same reason: "Ilomantsin masurkka" in 2/4
 * is an error somebody would have to correct in the margin.
 *
 * ## Two decisions about names
 *
 * **The places are real parishes and the famous tunes are avoided.** Kaustinen,
 * Veteli, Perho, Ilomantsi and Suistamo are where this material was collected
 * and it would be strange to invent substitutes for them. What is *not* here is
 * any parish whose name is already welded to a specific well-known tune, because
 * generating a title somebody has recorded is not a homage, it is a collision.
 *
 * **The first names are ordinary and the surnames are absent.** "Antin polkka"
 * is the tradition's own shape and it names a fiddler, so the pool is common
 * given names and nothing else: a full name would be a claim about a person who
 * either existed or is about to be invented, and neither is this file's to make.
 * The same line reggae's title generator draws around the dub plate.
 *
 * Finnish inflection is not something to improvise, so genitives are stored
 * rather than derived. Only the first word is capitalised, which is the
 * convention and is also how you tell a Finnish title from a translated one.
 */

import type { Rng } from '../../core/rng.js';
import type { TitleContext } from '../types.js';

interface Noun {
  nom: string;
  gen: string;
  /** Held back from anything generated to be cheerful. */
  grave?: boolean;
  /** Held back from anything generated to be grave. */
  glad?: boolean;
}

/**
 * The dance words: the administrative half of the vocabulary, and the only part
 * of this file that can be *wrong* rather than merely odd.
 *
 * `soitto` covers both kantele styles and `polska` covers the ensemble one,
 * because a soittokunta piece is a polska — the style id names the band and the
 * dance word names the rhythm, and here they are allowed to disagree.
 */
const DANCES: { word: string; styles: string[] }[] = [
  { word: 'polska', styles: ['polska', 'soittokunta'] },
  { word: 'menuetti', styles: ['menuetti'] },
  { word: 'polkka', styles: ['polkka'] },
  { word: 'sottiisi', styles: ['sottiisi'] },
  { word: 'masurkka', styles: ['masurkka'] },
  { word: 'katrilli', styles: ['katrilli'] },
  { word: 'valssi', styles: ['haavalssi', 'hidasvalssi'] },
  { word: 'hambo', styles: ['hambo'] },
  { word: 'marssi', styles: ['marssi'] },
  { word: 'purpuri', styles: ['purpuri'] },
  { word: 'tanhu', styles: ['tanhu'] },
  { word: 'runo', styles: ['runolaulu', 'karjalanlaulu'] },
  { word: 'itkuvirsi', styles: ['itkuvirsi'] },
  { word: 'virsi', styles: ['virsi'] },
  { word: 'piirileikki', styles: ['piirileikki'] },
  { word: 'rekilaulu', styles: ['rekilaulu'] },
  { word: 'soitto', styles: ['soitto', 'konserttikantele'] },
  { word: 'huuto', styles: ['karjanhuuto'] },
  { word: 'poljento', styles: ['poljento'] },
  { word: 'sävelmä', styles: ['sahkopelimanni', 'soittokunta', 'poljento', 'karjalanlaulu'] },
];

/**
 * The imagery, and it is deliberately not iskelmä's.
 *
 * That genre's nouns are a landscape looked at from a car — lake, birch, road,
 * summer night, the way home. These are the same country worked in: the drying
 * barn, the storehouse, the field, the herd, the frost in the ground. A handful
 * overlap because Finland only has so many trees, and where they do the
 * inflected form is the same because the language is the same.
 */
const NOUNS: Noun[] = [
  { nom: 'riihi', gen: 'riihen' },
  { nom: 'lato', gen: 'ladon' },
  { nom: 'aitta', gen: 'aitan' },
  { nom: 'tupa', gen: 'tuvan' },
  { nom: 'pelto', gen: 'pellon' },
  { nom: 'niitty', gen: 'niityn' },
  { nom: 'kaski', gen: 'kasken' },
  { nom: 'metsä', gen: 'metsän' },
  { nom: 'suo', gen: 'suon' },
  { nom: 'koski', gen: 'kosken' },
  { nom: 'järvi', gen: 'järven' },
  { nom: 'kylä', gen: 'kylän' },
  { nom: 'polku', gen: 'polun' },
  { nom: 'kirkko', gen: 'kirkon' },
  { nom: 'kannel', gen: 'kanteleen' },
  { nom: 'viulu', gen: 'viulun' },
  { nom: 'jousi', gen: 'jousen' },
  { nom: 'pilli', gen: 'pillin' },
  { nom: 'torvi', gen: 'torven' },
  { nom: 'sävel', gen: 'sävelen' },
  { nom: 'kaiku', gen: 'kaiun' },
  { nom: 'karja', gen: 'karjan' },
  { nom: 'paimen', gen: 'paimenen' },
  { nom: 'hanki', gen: 'hangen' },
  { nom: 'routa', gen: 'roudan', grave: true },
  { nom: 'jää', gen: 'jään' },
  { nom: 'kuu', gen: 'kuun' },
  { nom: 'aamu', gen: 'aamun' },
  { nom: 'ilta', gen: 'illan' },
  { nom: 'talvi', gen: 'talven' },
  { nom: 'kesä', gen: 'kesän' },
  { nom: 'tuuli', gen: 'tuulen' },
  { nom: 'morsian', gen: 'morsiamen', glad: true },
  { nom: 'sulhanen', gen: 'sulhasen', glad: true },
  { nom: 'häät', gen: 'häiden', glad: true },
  { nom: 'ilo', gen: 'ilon', glad: true },
  { nom: 'hauta', gen: 'haudan', grave: true },
  { nom: 'itku', gen: 'itkun', grave: true },
  { nom: 'suru', gen: 'surun', grave: true },
  { nom: 'tuhka', gen: 'tuhkan', grave: true },
];

/** Real parishes, and none of them already welded to a tune anybody knows. */
const PLACES = [
  'Kaustisen', 'Vetelin', 'Perhon', 'Toholammin', 'Ilmajoen', 'Kuhmon',
  'Ilomantsin', 'Suistamon', 'Rautalammin', 'Karstulan', 'Kihniön', 'Lapuan',
  'Sotkamon', 'Puolangan', 'Nurmeksen',
];

/** Ordinary given names, in the genitive, and no surnames. See the header. */
const NAMES = [
  'Antin', 'Kaisan', 'Juhon', 'Maijan', 'Erkin', 'Liisan', 'Matin', 'Annan',
  'Heikin', 'Elinan', 'Pekan', 'Hilman', 'Jussin', 'Miinan', 'Taavetin',
];

const ADJECTIVES = [
  'vanha', 'hidas', 'nopea', 'pieni', 'suuri', 'musta', 'valkea', 'soiva',
  'matala', 'korkea', 'kiireinen', 'routainen', 'murtunut', 'kolmas',
];

/** Adjectives of weight, held back from anything generated to be cheerful. */
const GRAVE_ADJECTIVES = new Set(['musta', 'murtunut', 'routainen']);

/**
 * The participles, which are the one title shape this tradition has that no
 * other genre here does: a thing that has stopped, named for having stopped.
 * "Vaiennut viulu" — the fiddle that fell silent. Held back from the cheerful
 * moods entirely, because every one of them is an obituary.
 */
const PARTICIPLES = ['vaiennut', 'kadonnut', 'unohtunut', 'nukkunut', 'jäätynyt', 'palanut'];

/** Moods a word of loss would contradict. */
const BRIGHT_MOODS = new Set(['vauhdikas', 'juhlava']);

/** Moods a wedding word would contradict. */
const GRAVE_MOODS = new Set(['murheinen', 'harras', 'arkainen']);

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type Pattern =
  | 'place-dance' | 'name-dance' | 'adj-dance' | 'gen-dance'
  | 'adj-noun' | 'gen-noun' | 'participle-noun' | 'noun-ja-noun';

export function generateTitle(rng: Rng, ctx: TitleContext): string {
  const bright = BRIGHT_MOODS.has(ctx.mood.id);
  const grave = GRAVE_MOODS.has(ctx.mood.id);

  const nouns = NOUNS.filter((n) => !(n.grave && bright) && !(n.glad && grave));
  const adjectives = ADJECTIVES.filter((a) => !(bright && GRAVE_ADJECTIVES.has(a)));
  const dances = DANCES.filter((d) => d.styles.includes(ctx.style.id));

  const patterns: (readonly [Pattern, number])[] = [
    ['adj-noun', 4],
    ['gen-noun', 4],
    ['noun-ja-noun', 2],
  ];
  /**
   * "Kaustisen polska" is a third of the actual repertoire's titles and every
   * style in this genre has a dance word, so this branch fires nearly always and
   * deserves the weight it takes. The three shapes are the three things that go
   * in front of the dance: a parish, a player, or how fast it is.
   */
  if (dances.length) {
    patterns.push(['place-dance', 6], ['name-dance', 5], ['adj-dance', 3], ['gen-dance', 3]);
  }
  // An obituary, and only where the piece is not trying to be cheerful.
  if (!bright) patterns.push(['participle-noun', 3]);
  const pattern = rng.weighted(patterns);

  const a = rng.pick(nouns);
  let b = rng.pick(nouns);
  let guard = 0;
  while (b.nom === a.nom && guard++ < 8) b = rng.pick(nouns);
  const adjective = rng.pick(adjectives);
  const dance = dances.length ? rng.pick(dances).word : '';

  switch (pattern) {
    case 'place-dance':
      return `${rng.pick(PLACES)} ${dance}`;
    case 'name-dance':
      return `${rng.pick(NAMES)} ${dance}`;
    case 'adj-dance':
      return capitalise(`${adjective} ${dance}`);
    case 'gen-dance':
      return capitalise(`${a.gen} ${dance}`);
    case 'adj-noun':
      return capitalise(`${adjective} ${a.nom}`);
    case 'gen-noun':
      return capitalise(`${a.gen} ${b.nom}`);
    case 'participle-noun':
      return capitalise(`${rng.pick(PARTICIPLES)} ${a.nom}`);
    case 'noun-ja-noun':
      return capitalise(`${a.nom} ja ${b.nom}`);
  }
}
