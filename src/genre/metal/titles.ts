/**
 * Title generation.
 *
 * Metal titles are the easiest in this project to characterise and the easiest to
 * embarrass yourself with, and both come from the same fact: the vocabulary is
 * *narrow and famous*. Everybody knows what the words are, which means every wrong
 * one is conspicuous and every right one is a step from parody. Three rules keep
 * this table on the right side of that line.
 *
 * **No gore, and no atrocity.** A real proportion of the genre's actual titles are
 * about dismemberment and this table contains none of it. Not squeamishness — the
 * house register is affectionate and dry, and a generator producing a hundred
 * variations on a mutilation is neither. What is left is the other ninety percent
 * of the repertoire, which is weather, metal, machinery, ruins, weapons and
 * abstractions, and which is what most of these records are actually called.
 *
 * **No real people and no real places.** Reggae's generator makes this argument
 * about the dub-plate title shape and it applies harder here, because this genre's
 * proper nouns are largely somebody's religion or somebody's country. So the
 * places below are types rather than names — a cathedral, a foundry, a
 * battlefield — and nothing generated here has ever existed.
 *
 * **The genre words are an announcement, not an image.** "Doom", "Thunder",
 * "Steel", "Frost", "Machine" and "Rune" each label a *kind of record*, exactly as
 * "Steppers" labels a kind of riddim, and an announcement that disagrees with the
 * music reads as a mislabelled tape rather than as a poetic liberty. So each is
 * gated on the styles that actually play it — the same mechanism iskelmä uses to
 * stop generating a valssi in 4/4, and it matters more here because there are
 * twenty-four styles and six of them would otherwise be indistinguishable in
 * print.
 */

import type { Rng } from '../../core/rng.js';
import type { TitleContext } from '../types.js';

interface Noun {
  word: string;
  /** Only usable when the piece is one of these styles. */
  styles?: string[];
  /** Only usable when the piece is not trying to be triumphant. */
  grim?: boolean;
  /** Only usable when the piece is not trying to be grim. */
  bright?: boolean;
}

/**
 * The announcing words: each is the name of a *kind of record*.
 *
 * `Doom` on a glam number is a mislabelled tape. `Machine` on a folk metal one is
 * worse, because it is nearly right and therefore reads as carelessness rather
 * than as a joke. Everything below is legal on exactly the styles that play it,
 * and the shape that uses them — `place-badge`, weighted highest where it applies
 * — is the genre's most characteristic title form by a distance.
 */
const BADGES: Noun[] = [
  { word: 'Doom', styles: ['doom', 'sludge', 'heavy', 'postmetal'] },
  { word: 'Sabbath', styles: ['doom', 'heavy', 'stoner'] },
  { word: 'Thunder', styles: ['heavy', 'nwobhm', 'speed', 'glam', 'power'] },
  { word: 'Steel', styles: ['nwobhm', 'speed', 'power', 'thrash', 'glam'] },
  { word: 'Lightning', styles: ['nwobhm', 'speed', 'thrash', 'power'] },
  { word: 'Overkill', styles: ['speed', 'thrash', 'crossover'] },
  { word: 'Frost', styles: ['black', 'death', 'postmetal', 'gothic'] },
  { word: 'Blood', styles: ['death', 'black', 'thrash', 'melodeath'] },
  { word: 'Machine', styles: ['industrial', 'djent', 'groove', 'metalcore'] },
  { word: 'Engine', styles: ['industrial', 'djent', 'groove'] },
  { word: 'Rune', styles: ['folkmetal', 'black', 'symphonic'] },
  { word: 'Requiem', styles: ['symphonic', 'gothic', 'melodeath', 'postmetal'] },
  { word: 'Nocturne', styles: ['gothic', 'symphonic', 'black'] },
  { word: 'Caprice', styles: ['shred', 'progressive', 'techdeath'] },
  { word: 'Riff', styles: ['stoner', 'heavy', 'groove'] },
  { word: 'Anvil', styles: ['heavy', 'thrash', 'groove', 'sludge'] },
  { word: 'Hammer', styles: ['thrash', 'crossover', 'folkmetal', 'power'] },
  { word: 'Wolves', styles: ['black', 'folkmetal', 'melodeath'] },
];

const NOUNS: Noun[] = [
  { word: 'Iron' },
  { word: 'Fire' },
  { word: 'Ash' },
  { word: 'Stone' },
  { word: 'Glass' },
  { word: 'Salt' },
  { word: 'Rain' },
  { word: 'Storm' },
  { word: 'Winter' },
  { word: 'Dawn' },
  { word: 'Dusk' },
  { word: 'Midnight' },
  { word: 'Mountain' },
  { word: 'River' },
  { word: 'Forest' },
  { word: 'Ocean' },
  { word: 'Tower' },
  { word: 'Gate' },
  { word: 'Bridge' },
  { word: 'Wire' },
  { word: 'Circuit' },
  { word: 'Piston' },
  { word: 'Mirror' },
  { word: 'Compass' },
  { word: 'Lantern' },
  { word: 'Wheel' },
  { word: 'Crown' },
  { word: 'Banner' },
  { word: 'Oath' },
  { word: 'Bell' },
  { word: 'Sermon' },
  { word: 'Verdict' },
  { word: 'Silence' },
  { word: 'Distance' },
  { word: 'Hunger' },
  { word: 'Exile', grim: true },
  { word: 'Ruin', grim: true },
  { word: 'Plague', grim: true },
  { word: 'Reckoning', grim: true },
  { word: 'Abyss', grim: true },
  { word: 'Famine', grim: true },
  { word: 'Grave', grim: true },
  { word: 'Sorrow', grim: true },
  { word: 'Triumph', bright: true },
  { word: 'Glory', bright: true },
  { word: 'Legend', bright: true },
  { word: 'Kingdom', bright: true },
  { word: 'Horizon', bright: true },
  { word: 'Voyage', bright: true },
];

/**
 * Places as *types* rather than as names — see the header. Every one of them is a
 * building or a landscape that exists in a thousand copies, so nothing generated
 * here can be about anywhere in particular.
 */
const PLACES = [
  'Cathedral', 'Foundry', 'Quarry', 'Highway', 'Harbour', 'Wasteland',
  'Battlefield', 'Cloister', 'Mineshaft', 'Sawmill', 'Causeway', 'Reservoir',
  'Watchtower', 'Boneyard', 'Ferry', 'Terminal', 'Aqueduct', 'Barrow',
];

const ADJECTIVES = [
  'Black', 'Iron', 'Molten', 'Frozen', 'Silent', 'Endless', 'Hollow',
  'Burning', 'Rising', 'Falling', 'Ancient', 'Broken', 'Crimson', 'Electric',
  'Northern', 'Distant', 'Restless', 'Golden', 'Savage',
];

/** Adjectives of decay, held back from anything generated to be triumphant. */
const GRIM_ADJECTIVES = new Set(['Hollow', 'Broken', 'Frozen', 'Silent', 'Falling']);

/**
 * The imperative, which is a genuine title shape and not a joke: "Ride the
 * Lightning", "Break the Silence", "Hold the Line". Present-participle rather
 * than bare imperative wherever the word takes one, because "Raining Blood" is
 * the form that survived.
 */
const VERBS = ['Ride', 'Break', 'Raise', 'Burn', 'Hold', 'Cross', 'Bury', 'Forge', 'Chase'];

/** Moods a word of decay would contradict. */
const BRIGHT_MOODS = new Set(['epic', 'soaring', 'swagger']);

/** Moods a word of triumph would contradict. */
const GRIM_MOODS = new Set(['savage', 'cold', 'crushing']);

type Pattern =
  | 'place-badge' | 'adj-noun' | 'noun-of-noun' | 'the-noun' | 'one-word'
  | 'verb-the-noun' | 'noun-noun' | 'adj-place';

export function generateTitle(rng: Rng, ctx: TitleContext): string {
  const bright = BRIGHT_MOODS.has(ctx.mood.id);
  const grim = GRIM_MOODS.has(ctx.mood.id);

  const usable = (n: Noun): boolean =>
    (!n.styles || n.styles.includes(ctx.style.id))
    && !(n.grim && bright)
    && !(n.bright && grim);

  const nouns = NOUNS.filter(usable);
  const badges = BADGES.filter(usable);
  const adjectives = ADJECTIVES.filter((a) => !(bright && GRIM_ADJECTIVES.has(a)));

  const patterns: (readonly [Pattern, number])[] = [
    ['adj-noun', 6],
    ['noun-of-noun', 5],
    ['the-noun', 4],
    ['verb-the-noun', 4],
    ['adj-place', 3],
    ['noun-noun', 3],
    /**
     * One word, and it is worth its own entry rather than being a degenerate
     * case of something else. A single noun in capitals is a title shape this
     * genre uses more than any other repertoire in the project — it is the whole
     * of "Blackout", "Overkill", "Ace of Spades" minus its preposition — and it
     * is the only shape here that makes no claim at all.
     */
    ['one-word', 2],
  ];
  /**
   * "Foundry Steel", "Wasteland Doom". The announcement shape, and where it
   * applies it deserves the largest weight in the table, because in the actual
   * repertoire it is roughly a third of everything.
   */
  if (badges.length) patterns.push(['place-badge', 7]);
  const pattern = rng.weighted(patterns);

  const a = rng.pick(nouns);
  let b = rng.pick(nouns);
  let guard = 0;
  while (b.word === a.word && guard++ < 8) b = rng.pick(nouns);
  const place = rng.pick(PLACES);
  const adjective = rng.pick(adjectives);

  switch (pattern) {
    case 'place-badge':
      return `${place} ${rng.pick(badges).word}`;
    case 'adj-noun':
      return `${adjective} ${a.word}`;
    case 'noun-of-noun':
      return `${a.word} of ${b.word}`;
    case 'the-noun':
      return `The ${adjective} ${a.word}`;
    case 'verb-the-noun':
      return `${rng.pick(VERBS)} the ${a.word}`;
    case 'adj-place':
      return `${adjective} ${place}`;
    case 'noun-noun':
      return `${a.word} ${b.word}`;
    case 'one-word':
      return a.word;
  }
}
