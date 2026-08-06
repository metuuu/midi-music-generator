/**
 * Ambient title generation.
 *
 * Ambient titles do something the other eighteen genres do not: they name a *place
 * or an object* rather than a feeling, and they are usually a noun phrase with
 * no verb in it. "Midnight Blues" tells you how the piece goes; "Sodium
 * Corridor" tells you where you are while it goes.
 *
 * Four families cover almost the whole repertoire —
 *
 *  - a colour or a material attached to a landscape or a piece of infrastructure
 *    (Boards of Canada's stacked-noun titles are the extreme case),
 *  - a coined proper noun, which is the most characteristic shape of all and
 *    the reason there is a syllable generator below,
 *  - the catalogue title — "Music for", "Study for", a number — which comes
 *    out of Eno's framing of the stuff as furniture,
 *  - and the bare disused place, which is the whole Fallout end of it.
 *
 * A year on its own is included because it is a real and surprisingly durable
 * ambient title, and the range is the analogue one: the period this music is
 * almost always nostalgic *for*, whenever it was actually made.
 */

import type { Rng } from '../../core/rng.js';

const COLOURS = [
  'turquoise', 'amber', 'cobalt', 'ochre', 'pale', 'grey', 'chrome', 'rust',
  'indigo', 'bleached', 'silver', 'olive', 'ash', 'copper', 'sepia', 'violet',
];

const MATERIALS = [
  'hexagon', 'prism', 'lattice', 'spiral', 'halo', 'aperture', 'vapour',
  'glass', 'resin', 'static', 'foil', 'dust', 'pollen', 'mercury', 'granite',
  'snow', 'sodium', 'quartz', 'iron', 'salt',
];

const PLACES = [
  'sun', 'field', 'orchard', 'transmitter', 'reservoir', 'aerial', 'corridor',
  'chapel', 'terminal', 'shoreline', 'glacier', 'meadow', 'pylon', 'tundra',
  'monolith', 'canopy', 'harbour', 'quarry', 'silo', 'valley', 'station',
  'garden', 'waterline', 'ridge', 'hollow', 'mirror', 'tide', 'basin',
  'causeway', 'plateau',
];

/** Adjectives of disuse and slowness — the genre's entire emotional register. */
const STATES = [
  'disused', 'unlit', 'unmapped', 'forgotten', 'submerged', 'sleeping',
  'dwindling', 'thawing', 'receding', 'drifting', 'waiting', 'half-remembered',
  'derelict', 'flooded', 'abandoned', 'quiet',
];

const INSTITUTIONS = [
  'Industries', 'Systems', 'Laboratories', 'Telecom', 'Cooperative', 'Works',
  'Holdings', 'Institute', 'Observatory', 'Provincial', 'Transit Authority',
  'Reclamation',
];

/** Syllables for coined proper nouns. Kept plausible rather than exotic. */
const ONSETS = [
  'kai', 'sel', 'var', 'tel', 'mor', 'ana', 'ori', 'nev', 'hal', 'sol',
  'dur', 'veh', 'lum', 'sar', 'ith', 'oke', 'pel', 'ryn', 'ast', 'cir',
];

const CODAS = [
  'na', 'mir', 'den', 'sha', 'lo', 'ven', 'tar', 'ris', 'mel', 'dae',
  'vik', 'sun', 'ora', 'thal', 'ley', 'mos', 'eth', 'ryn', 'ka', 'wen',
];

const COUNTS = ['three', 'four', 'six', 'seven', 'nine', 'twelve'];

function capitalise(s: string): string {
  return s.replace(/(^|[ -])([a-z])/g, (_, sep: string, c: string) => sep + c.toUpperCase());
}

function plural(noun: string): string {
  return /(s|x|ch|sh)$/.test(noun) ? `${noun}es` : `${noun}s`;
}

function coin(rng: Rng): string {
  const word = rng.chance(0.3)
    ? `${rng.pick(ONSETS)}${rng.pick(CODAS)}${rng.pick(CODAS)}`
    : `${rng.pick(ONSETS)}${rng.pick(CODAS)}`;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function generateTitle(rng: Rng): string {
  const pattern = rng.weighted([
    ['colour-place', 6],
    ['material-place', 5],
    ['state-place', 5],
    ['coined', 4],
    ['stacked', 3],
    ['coined-institution', 3],
    ['music-for', 3],
    ['study-for', 2],
    ['the-state-place', 2],
    ['year', 2],
  ] as const);

  const place = rng.pick(PLACES);

  switch (pattern) {
    case 'colour-place':
      return capitalise(`${rng.pick(COLOURS)} ${place}`);
    case 'material-place':
      return capitalise(`${rng.pick(MATERIALS)} ${place}`);
    case 'state-place':
      return capitalise(`${rng.pick(STATES)} ${place}`);
    case 'coined':
      return coin(rng);
    // Colour, then material, then landscape — three nouns with nothing joining
    // them. Reads as a photograph caption, which is exactly the effect.
    case 'stacked':
      return capitalise(`${rng.pick(COLOURS)} ${rng.pick(MATERIALS)} ${place}`);
    case 'coined-institution':
      return `${coin(rng)} ${rng.pick(INSTITUTIONS)}`;
    case 'music-for':
      return capitalise(`music for ${rng.pick(STATES)} ${plural(place)}`);
    case 'study-for':
      return capitalise(`study for ${rng.pick(COUNTS)} ${plural(place)}`);
    case 'the-state-place':
      return capitalise(`the ${rng.pick(STATES)} ${place}`);
    case 'year':
      return String(1962 + Math.floor(rng.float(0, 37)));
  }
}
