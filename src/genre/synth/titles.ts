/**
 * Vintage electronic title generation.
 *
 * Ambient titles name a place or an object. These name a *thing that moves, or
 * a thing that measures* — and then, very often, they number it. That is the
 * one habit which separates this repertoire's titling from every other genre
 * here: the composers thought in suites, so a side of vinyl is one idea in four
 * numbered movements, and a title is frequently a noun plus a Roman numeral
 * with no further explanation offered. Nothing in iskelmä or jazz does that,
 * because a dance and a standard are each complete in three minutes.
 *
 * Five families cover nearly all of it —
 *
 *  - the **numbered movement**, above: a subject and a numeral, or a subject
 *    and "Part Four". The most characteristic shape in the genre and weighted
 *    accordingly.
 *  - the **single abstract noun**, usually Latinate and usually something you
 *    would find in a physics index — an instrument's worth of music named after
 *    a measurable quantity.
 *  - the **machine**, definite-articled or made of a metal. A synthesiser
 *    record named after a turbine is claiming kinship with it.
 *  - **transit**: a region and a way of crossing it. This is where the genre's
 *    obsession with roads, rails and ferries lands, and it is the only family
 *    that names somewhere real enough to buy a ticket to.
 *  - **celestial**: an adjective off a star chart and a word for approaching
 *    something. The sleeve is a photograph taken from orbit.
 *
 * The coined machine name exists for the same reason ambient has a syllable
 * generator: a made-up proper noun that sounds like equipment is a real and
 * durable title in this music, and it cannot be assembled from a fixed list
 * without repeating itself within a dozen songs.
 *
 * Nothing here reproduces an actual title. The vocabularies are deliberately
 * one step to the side of the famous ones — the neighbouring word rather than
 * the word itself — so that outputs read as belonging to the genre without
 * being taken from it.
 */

import type { Rng } from '../../core/rng.js';

/**
 * Latinate nouns for a measurable quantity. A whole side named after one of
 * these is the most confident thing this music does.
 */
const ABSTRACT = [
  'parallax', 'telemetry', 'refraction', 'magnetism', 'velocity', 'inertia',
  'convection', 'diffusion', 'resonance', 'chronometry', 'hydraulics',
  'circuitry', 'symmetry', 'ascension', 'radiance', 'cadence', 'apparatus',
  'trajectory', 'luminance', 'kinetics', 'induction', 'saturation',
];

const MACHINES = [
  'transmitter', 'reactor', 'turbine', 'dynamo', 'relay', 'oscillator',
  'telegraph', 'generator', 'centrifuge', 'gyroscope', 'transformer',
  'accumulator', 'condenser', 'conveyor', 'compressor', 'rectifier',
  'commutator', 'beacon', 'lathe', 'pantograph',
];

/** Adjectives off a star chart. */
const CELESTIAL = [
  'lunar', 'solar', 'stellar', 'orbital', 'sidereal', 'polar', 'auroral',
  'nocturnal', 'meridian', 'equatorial', 'cometary', 'geostationary',
];

const CELESTIAL_NOUNS = [
  'orbit', 'eclipse', 'aurora', 'zenith', 'nebula', 'corona', 'apogee',
  'perihelion', 'penumbra', 'terminator', 'ionosphere', 'stratosphere',
  'magnetosphere', 'quasar', 'ellipse', 'declination',
];

/** Words for approaching or leaving something. Half the genre is one of these. */
const MOTION = [
  'approach', 'descent', 'ascent', 'transit', 'drift', 'return', 'crossing',
  'passage', 'departure', 'arrival', 'alignment', 're-entry', 'traverse',
  'circuit', 'flyby',
];

const TRANSIT = [
  'express', 'junction', 'interchange', 'viaduct', 'terminus', 'freight',
  'ferry', 'overpass', 'motorway', 'sleeper', 'concourse', 'platform',
  'tramline', 'cableway', 'line', 'depot', 'crossing', 'canal',
];

/** Where the line runs. Regional rather than national, as the sleeves are. */
const REGIONS = [
  'northern', 'baltic', 'alpine', 'continental', 'coastal', 'western',
  'lowland', 'arctic', 'adriatic', 'nordic', 'central', 'eastern',
  'transcontinental', 'riverside', 'harbour', 'frontier',
];

const MATERIALS = [
  'chromium', 'neon', 'krypton', 'caesium', 'titanium', 'mercury', 'graphite',
  'tungsten', 'argon', 'cobalt', 'platinum', 'sodium', 'quartz', 'basalt',
];

/** Adjectives of automation and emptiness — the genre's emotional register. */
const STATES = [
  'automatic', 'electric', 'silent', 'distant', 'empty', 'nocturnal', 'winter',
  'final', 'first', 'endless', 'magnetic', 'weightless', 'unmanned', 'frozen',
];

/** What a numbered thing gets called before it gets numbered. */
const DESIGNATIONS = [
  'model', 'mark', 'type', 'series', 'unit', 'sector', 'zone', 'phase',
  'cycle', 'stage', 'channel', 'signal',
];

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const WORD_NUMBERS = [
  'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
];

/** Prefixes for a coined piece of equipment. Greek and Latin, as the trade was. */
const PREFIXES = [
  'kryo', 'mag', 'helio', 'cyclo', 'stro', 'vari', 'poly', 'thermo', 'ferro',
  'micro', 'hydro', 'aero', 'chrono', 'photo', 'volta', 'reso', 'astro', 'omni',
];

/** Suffixes that make a word into a machine. `-tron` did most of the work. */
const SUFFIXES = [
  'tron', 'atron', 'scope', 'graph', 'meter', 'drome', 'phone', 'lith',
  'flux', 'wave', 'stat', 'sphere',
];

function capitalise(s: string): string {
  return s.replace(/(^|[ -])([a-z])/g, (_, sep: string, c: string) => sep + c.toUpperCase());
}

/** A coined piece of equipment: a prefix, a suffix, and nothing in between. */
function coin(rng: Rng): string {
  const word = `${rng.pick(PREFIXES)}${rng.pick(SUFFIXES)}`;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * What gets numbered. Any of the four concrete vocabularies will do — the
 * numeral is doing the work, and it does it to a machine, a quantity, a
 * junction or a planet with equal conviction.
 */
function subject(rng: Rng): string {
  return rng.weighted([
    [rng.pick(ABSTRACT), 4],
    [rng.pick(MACHINES), 4],
    [rng.pick(CELESTIAL_NOUNS), 3],
    [rng.pick(TRANSIT), 2],
  ] as const);
}

export function generateTitle(rng: Rng): string {
  const pattern = rng.weighted([
    ['numbered-movement', 6],
    ['part', 5],
    ['bare-abstract', 5],
    ['celestial-motion', 5],
    ['region-transit', 5],
    ['material-machine', 4],
    ['the-machine', 4],
    ['coined', 4],
    ['state-machine', 4],
    ['theme-for', 3],
    ['designation', 3],
    ['bare-celestial', 3],
    ['coined-numbered', 2],
  ] as const);

  switch (pattern) {
    // A noun and a Roman numeral, nothing else. The suite is the unit of
    // composition in this repertoire and this is what its parts get called.
    case 'numbered-movement':
      return `${capitalise(subject(rng))} ${rng.pick(ROMAN)}`;
    // The same idea spelled out, which is what happens when the sleeve has room.
    case 'part':
      return `${capitalise(subject(rng))}, Part ${rng.pick(WORD_NUMBERS)}`;
    case 'bare-abstract':
      return capitalise(rng.pick(ABSTRACT));
    case 'bare-celestial':
      return capitalise(rng.pick(CELESTIAL_NOUNS));
    case 'celestial-motion':
      return capitalise(`${rng.pick(CELESTIAL)} ${rng.pick(MOTION)}`);
    // A region and a way of crossing it — the only family that names somewhere
    // you could actually buy a ticket to.
    case 'region-transit':
      return capitalise(`${rng.pick(REGIONS)} ${rng.pick(TRANSIT)}`);
    case 'material-machine':
      return capitalise(`${rng.pick(MATERIALS)} ${rng.pick(MACHINES)}`);
    case 'state-machine':
      return capitalise(`${rng.pick(STATES)} ${rng.pick(rng.chance(0.5) ? MACHINES : TRANSIT)}`);
    // The definite article does the whole job: a machine with a "the" in front
    // of it is a character rather than a component.
    case 'the-machine':
      return capitalise(`the ${rng.pick(MACHINES)}`);
    case 'coined':
      return coin(rng);
    case 'coined-numbered':
      return `${coin(rng)} ${rng.pick(ROMAN)}`;
    // Borrowed from the film-score end, where a cue is titled after what it is
    // a cue for.
    case 'theme-for':
      return capitalise(`theme for the ${rng.pick(REGIONS)} ${rng.pick(TRANSIT)}`);
    // A part number and nothing to say what the part is. Cold in exactly the
    // way the machine end of this music likes to be.
    case 'designation':
      return capitalise(`${rng.pick(DESIGNATIONS)} ${rng.pick(WORD_NUMBERS).toLowerCase()}`);
  }
}
