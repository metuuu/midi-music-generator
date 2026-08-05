/**
 * House and techno title generation.
 *
 * Two habits do nearly all the work here and neither appears anywhere else in
 * this project.
 *
 * **The first is the mix designation.** A house record is not one piece of music,
 * it is a *sleeve with several versions of one piece on it* — a club mix, a dub,
 * an instrumental, an extended version — and the parenthesis is on the label of a
 * very large fraction of everything this genre ever pressed. Nothing else here
 * titles that way, because nothing else here is a format built to be re-cut for
 * other people's purposes. `TitleContext` carries the style, so the suffix can at
 * least agree with the record: a dub techno number gets a dub, a garage number
 * gets a vocal, and an eleven-minute progressive number gets the extended
 * version.
 *
 * **The second is the catalogue designation**, which is the opposite gesture and
 * belongs to the techno half. A Basic Channel or a Sähkö record is called
 * *Phylyps Trak II* or *Untitled B2* or *M5*, and the refusal to name it is the
 * statement: the record is a tool, it is going in a bag with two hundred others,
 * and a poetic title would be claiming an audience that is not there. It sits
 * directly beside the imperative family — *jack the body*, *move your feet* —
 * which is the Chicago half shouting at a room. One genre, two title practices
 * that disagree with each other completely, and the style weighting below is
 * where they are told apart.
 *
 * Nothing here reproduces an actual title. The vocabularies are one step to the
 * side of the famous ones — the neighbouring word rather than the word itself —
 * so that outputs read as belonging to the genre without being taken from it.
 */

import type { Rng } from '../../core/rng.js';
import type { TitleContext } from '../types.js';

/** What a record tells the floor to do. The Chicago half, and it shouts. */
const VERBS = [
  'jack', 'move', 'work', 'push', 'ride', 'shake', 'lift', 'burn', 'drop',
  'hold', 'run', 'turn', 'rock', 'feel', 'follow', 'let go of',
];

/**
 * The same verbs as a present participle, written out rather than derived.
 *
 * Deriving them was tried and it is a trap: English gerunds double consonants,
 * drop terminal `e` and leave a couple of the verbs above ungrammatical however
 * they are suffixed. A regular expression that gets *most* of them right
 * produces "ridEing" a few songs in a hundred, which reads as a bug rather than
 * as a title. Fourteen strings is cheaper than being wrong.
 */
const GERUNDS = [
  'jacking', 'moving', 'working', 'pushing', 'riding', 'shaking', 'lifting',
  'burning', 'dropping', 'holding', 'running', 'turning', 'rocking', 'following',
];

const BODIES = [
  'your body', 'the body', 'your feet', 'the floor', 'the room', 'the house',
  'the whole night', 'it down', 'the record', 'your hands', 'the rhythm',
  'the beat', 'the wall', 'the bassline',
];

/** Single nouns, and this genre likes them abstract and slightly clinical. */
const ABSTRACT = [
  'acid', 'phase', 'contact', 'resurrection', 'pressure', 'transmission',
  'aftermath', 'motion', 'gravity', 'saturation', 'displacement', 'friction',
  'residue', 'circulation', 'convection', 'threshold', 'drift', 'lattice',
  'iteration', 'hysteresis', 'inertia', 'symmetry', 'attrition', 'undertow',
];

/** Where the record was made, or where it is meant to be played. */
const PLACES = [
  'warehouse', 'basement', 'annexe', 'loading bay', 'south side', 'ring road',
  'east side', 'terminal', 'yard', 'cellar', 'gantry', 'depot', 'lock-up',
  'car park', 'back room', 'stairwell', 'freight lift', 'plant room',
];

/** Adjectives. Cold, wet or industrial — the genre has almost no warm ones. */
const STATES = [
  'liquid', 'deep', 'lower', 'inner', 'hollow', 'black', 'chrome', 'humid',
  'submerged', 'unlit', 'endless', 'shallow', 'northern', 'automatic',
  'wet', 'blank', 'sub-', 'off-',
];

const SPACES = [
  'room', 'space', 'level', 'quarter', 'sector', 'district', 'corridor',
  'chamber', 'shaft', 'zone', 'field', 'strata', 'system', 'grid',
];

/** What a record gets called when nobody names it. The techno half. */
const DESIGNATIONS = [
  'trak', 'version', 'phase', 'variation', 'pattern', 'take', 'edit', 'cut',
  'sequence', 'model', 'unit', 'series', 'plate', 'test',
];

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/** Vinyl sides. The most literal way there is of refusing to title something. */
const SIDES = ['A1', 'A2', 'B1', 'B2', 'C1', 'D2', 'AA'];

const LETTERS = ['M', 'X', 'K', 'Q', 'E', 'V', 'Z', 'R', 'D', 'T'];

/** Syllables for a coined word, which this genre produces constantly. */
const COIN_HEADS = [
  'ac', 'trak', 'sub', 'hyp', 'nox', 'vel', 'rez', 'kry', 'dux', 'mor',
  'stra', 'zel', 'quan', 'flu', 'thra', 'vor', 'nim', 'lek',
];

const COIN_TAILS = [
  'ience', 'oid', 'ika', 'atron', 'esis', 'ura', 'ynth', 'ova', 'aria',
  'ex', 'ium', 'ora', 'is', 'yx', 'ane', 'onic',
];

function capitalise(s: string): string {
  return s.replace(/(^|[ -])([a-z])/g, (_, sep: string, c: string) => sep + c.toUpperCase());
}

/**
 * The parenthesis on the label.
 *
 * Weighted by style rather than drawn flat, because the version a record is
 * *sold as* is a fact about what kind of record it is. A dub techno twelve-inch
 * is a dub; a garage twelve-inch leads with the vocal and puts the dub on the
 * other side; a nine-minute progressive record is the extended version and there
 * is no short one. `none` carries most of the weight because most records are
 * still called one thing.
 */
function mixSuffix(rng: Rng, style: string): string | undefined {
  const dubby = style === 'dubtechno' || style === 'minimal' || style === 'microhouse'
    || style === 'techhouse' || style === 'hardgroove' || style === 'detroit';
  const sung = style === 'garage' || style === 'ukgarage' || style === 'speedgarage'
    || style === 'piano' || style === 'disco';
  const long = style === 'progressive' || style === 'trance' || style === 'ambienthouse';
  const suffix = rng.weighted([
    ['none', 9],
    ['club', sung ? 4 : 2],
    ['dub', dubby ? 5 : 1.5],
    ['original', 2],
    ['vocal', sung ? 3 : 0.2],
    ['instrumental', sung ? 2 : 0.4],
    ['extended', long ? 4 : 1],
    ['reprise', 1],
    ['warehouse', 1],
    ['edit', 1],
  ] as const);
  switch (suffix) {
    case 'none': return undefined;
    case 'club': return 'Club Mix';
    case 'dub': return 'Dub';
    case 'original': return 'Original Mix';
    case 'vocal': return 'Vocal Mix';
    case 'instrumental': return 'Instrumental';
    case 'extended': return 'Extended Version';
    case 'reprise': return 'Reprise';
    case 'warehouse': return 'Warehouse Mix';
    case 'edit': return 'Edit';
  }
}

/** A coined word. Two syllables, no space, and it means nothing. */
function coin(rng: Rng): string {
  const word = `${rng.pick(COIN_HEADS)}${rng.pick(COIN_TAILS)}`;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function generateTitle(rng: Rng, ctx: TitleContext): string {
  const id = ctx.style.id;
  /**
   * Which half of the genre this record is from.
   *
   * The imperative and the catalogue number are not two flavours of one habit —
   * they are two incompatible positions about what a record is for, and a
   * generator that drew between them evenly would name a Basic Channel plate
   * *Jack Your Body*. So the weights are a function of the style, which is the
   * one thing `TitleContext` is actually good for.
   */
  const shouts = id === 'chicago' || id === 'jackin' || id === 'ghetto'
    || id === 'piano' || id === 'garage' || id === 'speedgarage' || id === 'disco';
  const catalogues = id === 'dubtechno' || id === 'minimal' || id === 'microhouse'
    || id === 'hardgroove' || id === 'bleep' || id === 'techhouse';

  const base = rng.weighted([
    ['imperative', shouts ? 7 : 1],
    ['state-space', 5],
    ['bare-abstract', 5],
    ['designation', catalogues ? 7 : 1.5],
    ['side', catalogues ? 4 : 0.5],
    ['coined', 4],
    ['the-place', 4],
    ['place-state', 3],
    ['letter-number', catalogues ? 3 : 0.8],
    ['verbing', shouts ? 4 : 1],
    ['abstract-of-place', 2],
  ] as const);

  let title: string;
  switch (base) {
    // The Chicago half, shouting at a room.
    case 'imperative':
      title = capitalise(`${rng.pick(VERBS)} ${rng.pick(BODIES)}`);
      break;
    case 'verbing':
      title = capitalise(`${rng.pick(GERUNDS)} ${rng.pick(BODIES).replace(/^(it down|the record)$/, 'the house')}`);
      break;
    case 'bare-abstract':
      title = capitalise(rng.pick(ABSTRACT));
      break;
    case 'state-space':
      title = capitalise(`${rng.pick(STATES)}${rng.pick(STATES).endsWith('-') ? '' : ' '}${rng.pick(SPACES)}`
        .replace('- ', '-'));
      break;
    case 'the-place':
      title = capitalise(`the ${rng.pick(PLACES)}`);
      break;
    case 'place-state':
      title = capitalise(`${rng.pick(STATES).replace(/-$/, '')} ${rng.pick(PLACES)}`);
      break;
    case 'abstract-of-place':
      title = capitalise(`${rng.pick(ABSTRACT)} of the ${rng.pick(PLACES)}`);
      break;
    // The techno half, refusing to name it. See the header.
    case 'designation':
      title = capitalise(`${rng.pick(DESIGNATIONS)} ${rng.pick(ROMAN)}`);
      break;
    case 'side':
      title = `Untitled ${rng.pick(SIDES)}`;
      break;
    case 'letter-number':
      title = `${rng.pick(LETTERS)}-${1 + Math.floor(rng.next() * 9)}`;
      break;
    case 'coined':
      title = coin(rng);
      break;
  }

  const suffix = mixSuffix(rng, id);
  return suffix ? `${title} (${suffix})` : title;
}
