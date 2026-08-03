/**
 * Funk title generation.
 *
 * Ambient titles name a place, synth titles name a thing that moves or measures,
 * iskelmä titles name a feeling. **Funk titles give an instruction, or they name
 * a dance, and about a fifth of them are numbered.**
 *
 * The numbering is the habit that separates this repertoire's titling from
 * everything else in the project, and it comes from a specific fact about how the
 * records were sold: a groove that ran nine minutes was cut across both sides of
 * a seven-inch single, so the A-side was Part One and the B-side was Part Two,
 * and the convention outlived the format. Nothing in jazz or iskelmä does that,
 * because a standard and a dance are each complete in three minutes.
 *
 * Six families cover nearly all of it —
 *
 *  - the **instruction**: a verb, a particle, and the listener. This is the
 *    single commonest shape in the genre and it is weighted accordingly. It is
 *    also the one that has to be filtered against tempo, for the reason below.
 *  - the **gerund**, which is the same instruction with the person taken out —
 *    an activity named rather than demanded.
 *  - the **named dance**, an adjective and a noun for a way of moving. Half of
 *    these dances never existed outside the title of the record that named them,
 *    which is itself part of the convention.
 *  - the **object**, and specifically a *mundane* one. This music titles itself
 *    after a thermostat rather than after a nebula, and the flatness is the joke.
 *  - the **place**, which is a part of a town rather than a country.
 *  - **theme from**, borrowed off the blaxploitation soundtrack shelf, where a
 *    third of these records were actually released.
 *
 * ## The tempo filter, and why it is not decoration
 *
 * `TitleContext` exists because an announcement that disagrees with the music is
 * worse than no announcement — the type's own doc says so about a bossa called a
 * swing. Here the disagreement is sharper: "Get On Up" over a 66 BPM ballad is
 * not a poetic liberty, it is a promise the record does not keep. So the
 * imperative and the gerund families are struck below 88 BPM and on the ballad
 * style, and the slow end draws from the object, place and theme families
 * instead, which say nothing about how fast anybody is moving.
 *
 * Nothing here reproduces an actual title. Every vocabulary is deliberately one
 * word to the side of the famous ones — the neighbouring verb, the neighbouring
 * appliance — so an output reads as belonging to this repertoire without having
 * been taken from it.
 */

import type { Rng } from '../../core/rng.js';
import type { TitleContext } from '../types.js';

/** What the record tells you to do. */
const VERBS = [
  'get', 'give', 'take', 'shake', 'work', 'move', 'hold', 'turn', 'break',
  'drop', 'pass', 'throw', 'keep', 'bring', 'roll', 'wind', 'set',
];

/** …and where. The particle is doing at least half the work. */
const PARTICLES = [
  'on up', 'it up', 'it down', 'it over', 'it loose', 'it out', 'on down',
  'it back', 'it here', 'on out', 'it around', 'it together', 'on over',
];

/**
 * The instruction with the person taken out. Apostrophes rather than a `g`,
 * because that is how these were printed on the labels.
 */
const GERUNDS = [
  'struttin', 'grindin', 'slidin', 'sweatin', 'crawlin', 'hustlin', 'shufflin',
  'wobblin', 'bumpin', 'poppin', 'slappin', 'pushin', 'diggin', 'rollin',
  'duckin', 'stompin', 'creepin', 'scufflin',
];

/** Adjectives for a way of moving. */
const ADJECTIVES = [
  'greasy', 'sweaty', 'nasty', 'heavy', 'mellow', 'loose', 'tight', 'cold',
  'slippery', 'dusty', 'crooked', 'sticky', 'lowdown', 'ragged', 'salty',
  'smoky', 'gritty', 'second-hand', 'sideways', 'backwards',
];

/** …and the dance itself, half of which never existed. */
const DANCES = [
  'bump', 'strut', 'grind', 'stomp', 'crawl', 'glide', 'hustle', 'shuffle',
  'wobble', 'scuffle', 'ramble', 'prowl', 'slide', 'swagger', 'trot', 'drag',
  'hitch', 'lurch', 'skid', 'sidestep',
];

/**
 * Mundane objects. The flatness is the joke: this music titles itself after a
 * thermostat where the genre next door titles itself after a nebula.
 */
const OBJECTS = [
  'thermostat', 'elevator', 'socket', 'turnstile', 'carburettor', 'ratchet',
  'spindle', 'girder', 'radiator', 'dumbwaiter', 'floorboard', 'doorframe',
  'transmission', 'alternator', 'fire escape', 'meter', 'awning', 'gearbox',
];

/** A part of a town, never a country. */
const PLACES = [
  'uptown', 'downtown', 'crosstown', 'backroom', 'corner', 'sidewalk',
  'basement', 'rooftop', 'alley', 'boulevard', 'courtyard', 'stairwell',
  'waterfront', 'eastside', 'westside', 'loading dock', 'back lot',
];

/** What things are made of on this shelf, and none of it is precious. */
const MATERIALS = [
  'chrome', 'velvet', 'concrete', 'plastic', 'brass', 'copper', 'cardboard',
  'linoleum', 'formica', 'denim', 'vinyl', 'neon', 'amber', 'lime', 'tinfoil',
];

/** Parts of a person, used as the subject of a sentence about a groove. */
const BODY = [
  'nerve', 'elbow', 'knuckle', 'shoulder', 'thumb', 'ankle', 'jawbone',
  'backbone', 'kneecap', 'eyebrow', 'wrist', 'hipbone',
];

const PART_NUMBERS = ['One', 'Two', 'Three', 'Four'];

function capitalise(s: string): string {
  return s.replace(/(^|[ -])([a-z])/g, (_, sep: string, c: string) => sep + c.toUpperCase());
}

/** The thing a Part number gets attached to. Any of the concrete families will do. */
function subject(rng: Rng): string {
  return rng.weighted([
    [`${rng.pick(ADJECTIVES)} ${rng.pick(DANCES)}`, 4],
    [`the ${rng.pick(OBJECTS)}`, 3],
    [`${rng.pick(PLACES)} ${rng.pick(DANCES)}`, 3],
    [rng.pick(GERUNDS), 2],
  ] as const);
}

export function generateTitle(rng: Rng, ctx: TitleContext): string {
  /**
   * A slow number does not get an imperative.
   *
   * The line at 88 is where the two halves of this repertoire actually divide —
   * below it nobody is being told to get up, and `ballad` is struck by name as
   * well as by tempo because its band can draw a fast tempo and still be playing
   * a ballad.
   */
  const walking = ctx.bpm >= 88 && ctx.style.id !== 'ballad';

  const pattern = rng.weighted([
    ['instruction', walking ? 7 : 0],
    ['gerund', walking ? 5 : 0],
    ['gerund-pair', walking ? 3 : 0],
    ['named-dance', 6],
    ['numbered', 5],
    ['the-object', 4],
    ['place-dance', 4],
    ['material-object', 3],
    ['body-noun', 3],
    ['theme-from', 3],
    ['bare-place', walking ? 2 : 4],
    ['possessive-dance', 2],
  ] as const);

  switch (pattern) {
    // A verb, a particle, and the listener. The commonest shape in the genre.
    case 'instruction':
      return capitalise(`${rng.pick(VERBS)} ${rng.pick(PARTICLES)}`);
    case 'gerund':
      return `${capitalise(rng.pick(GERUNDS))}'`;
    // Two activities, joined. The version with room on the label.
    case 'gerund-pair':
      return `${capitalise(rng.pick(GERUNDS))}' and ${capitalise(rng.pick(GERUNDS))}'`;
    case 'named-dance':
      return capitalise(`${rng.pick(ADJECTIVES)} ${rng.pick(DANCES)}`);
    /**
     * A subject and a part number, and the reason it is here at weight 5: a
     * groove that ran nine minutes was cut across both sides of a single, and
     * the convention outlived the format by twenty years.
     */
    case 'numbered':
      return `${capitalise(subject(rng))}, Part ${rng.pick(PART_NUMBERS)}`;
    case 'the-object':
      return capitalise(`the ${rng.pick(OBJECTS)}`);
    case 'place-dance':
      return capitalise(`${rng.pick(PLACES)} ${rng.pick(DANCES)}`);
    case 'material-object':
      return capitalise(`${rng.pick(MATERIALS)} ${rng.pick(OBJECTS)}`);
    case 'body-noun':
      return capitalise(`${rng.pick(ADJECTIVES)} ${rng.pick(BODY)}`);
    // Off the soundtrack shelf, where a third of these records were released.
    case 'theme-from':
      return capitalise(`theme from the ${rng.pick(PLACES)}`);
    case 'bare-place':
      return capitalise(`${rng.pick(MATERIALS)} ${rng.pick(PLACES)}`);
    // Somebody's dance, and the somebody is never named.
    case 'possessive-dance':
      return capitalise(`${rng.pick(BODY)}'s ${rng.pick(DANCES)}`);
  }
}
