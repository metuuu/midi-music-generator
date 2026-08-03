/**
 * Mood presets.
 *
 * A mood does not pick notes. It leans on choices the generator was going to make
 * anyway — which style, major or minor, where in the tempo band, how many layers,
 * how ornamented — so `epic black` stays reachable and merely unlikely, which is
 * the correct relationship between a mood and a style and is also, as it happens,
 * a real record.
 *
 * ## Why these seven and not the obvious ones
 *
 * The obvious mood table for this genre is a list of adjectives about *volume*,
 * and it would be seven words for one thing. What actually varies across
 * twenty-four styles is two axes and neither of them is loudness: **how fast**,
 * and **how much of the arrangement is melody**. `savage` and `crushing` are the
 * ends of the first; `soaring` and `cold` are the ends of the second. `epic`,
 * `swagger` and `technical` sit on the diagonals.
 *
 * `restraint` is the field to read them by rather than `density`, because in this
 * genre the arrangement is nearly always the same five parts and what changes is
 * whether all five are playing at once. A `cold` verse is two guitars and nothing
 * else on purpose; an `epic` chorus has everything in the building on it.
 *
 * Seven with an opinion and one without. The last entry is load-bearing in a way
 * nothing about it looks load-bearing: `generateSong` uses a genre's final mood as
 * the fallback for any song that did not ask for one, so an opinionated entry in
 * that slot silently becomes the default for the whole genre. `npm run genres`
 * asserts it is flat.
 */

import type { Mood } from '../../style/types.js';

const moods: Mood[] = [
  {
    id: 'crushing',
    label: 'Crushing',
    gloss: 'slow and enormous: the beat halved, the chords held, and nothing in a hurry',
    styleBias: {
      doom: 3.4, sludge: 3, postmetal: 2.6, groove: 2.4, gothic: 1.8,
      heavy: 1.5, stoner: 1.4, metalcore: 1.2, industrial: 1.1, djent: 1.1,
      speed: 0.15, crossover: 0.1, glam: 0.2, power: 0.25, shred: 0.2,
      thrash: 0.4, black: 0.4, techdeath: 0.3, nwobhm: 0.4, folkmetal: 0.3,
    },
    modeBias: { minor: 3, major: 0.2 },
    tempo: -0.85,
    density: -0.05,
    ornament: 0.7,
    leap: 0.65,
    restraint: 0.5,
  },
  {
    id: 'savage',
    label: 'Savage',
    gloss: 'as fast and as unpleasant as the catalogue goes: blast beats and no tune',
    styleBias: {
      black: 3.4, death: 3.2, crossover: 2.8, thrash: 2.6, techdeath: 2.4,
      speed: 2, sludge: 1.4, melodeath: 1.2, metalcore: 1.1,
      glam: 0.05, power: 0.15, gothic: 0.2, symphonic: 0.3, doom: 0.3,
      postmetal: 0.3, stoner: 0.3, folkmetal: 0.4, heavy: 0.5,
    },
    modeBias: { minor: 3.4, major: 0.1 },
    tempo: 0.85,
    density: 0.05,
    ornament: 0.45,
    leap: 1.1,
    restraint: -0.2,
  },
  {
    id: 'epic',
    label: 'Epic',
    gloss: 'everything in the building on the chorus: choirs, strings, and a key that opens',
    styleBias: {
      symphonic: 3.4, power: 3.2, folkmetal: 2.6, melodeath: 2, gothic: 1.6,
      nwobhm: 1.6, shred: 1.3, postmetal: 1.2, progressive: 1.1,
      crossover: 0.15, sludge: 0.2, industrial: 0.3, groove: 0.4, black: 0.4,
      djent: 0.4, thrash: 0.5,
    },
    modeBias: { minor: 1.4, major: 1.8 },
    tempo: 0.15,
    density: 0.2,
    ornament: 1.35,
    leap: 1.1,
    restraint: -0.4,
  },
  {
    id: 'cold',
    label: 'Cold',
    gloss: 'the middle of the arrangement left empty: two guitars, a kit, and distance',
    styleBias: {
      black: 3.2, postmetal: 2.8, industrial: 2.4, gothic: 2, doom: 1.8,
      death: 1.4, djent: 1.3, sludge: 1.2, techdeath: 1,
      glam: 0.05, power: 0.2, stoner: 0.2, folkmetal: 0.2, nwobhm: 0.3,
      heavy: 0.4, crossover: 0.4, symphonic: 0.6,
    },
    modeBias: { minor: 3.2, major: 0.15 },
    tempo: -0.25,
    density: -0.3,
    ornament: 0.6,
    leap: 0.75,
    restraint: 0.8,
  },
  {
    id: 'swagger',
    label: 'Swagger',
    gloss: 'the blues end: mid-tempo, syncopated, and enjoying itself',
    styleBias: {
      stoner: 3.2, groove: 3, heavy: 2.6, glam: 2.4, metalcore: 1.4,
      sludge: 1.2, doom: 1, industrial: 0.9, nwobhm: 0.9,
      black: 0.1, techdeath: 0.15, symphonic: 0.25, postmetal: 0.3,
      death: 0.3, speed: 0.4, crossover: 0.4, progressive: 0.4,
    },
    modeBias: { minor: 1.3, major: 1.5 },
    tempo: -0.35,
    density: 0,
    ornament: 1.15,
    leap: 1,
    restraint: 0.15,
  },
  {
    id: 'soaring',
    label: 'Soaring',
    gloss: 'twin guitars, a lead line that goes up and stays up, and a real cadence',
    styleBias: {
      nwobhm: 3.2, shred: 3, melodeath: 2.6, power: 2.4, speed: 2,
      symphonic: 1.6, folkmetal: 1.4, glam: 1.3, progressive: 1.1,
      sludge: 0.1, industrial: 0.15, djent: 0.2, groove: 0.3, doom: 0.3,
      black: 0.4, crossover: 0.4, postmetal: 0.4,
    },
    modeBias: { minor: 1.8, major: 1.2 },
    tempo: 0.4,
    density: 0.1,
    ornament: 1.4,
    leap: 1.35,
    restraint: -0.25,
  },
  {
    id: 'technical',
    label: 'Technical',
    gloss: 'the bar is an odd length and the riff is a different odd length',
    styleBias: {
      djent: 3.4, techdeath: 3.2, progressive: 3, shred: 2.2, metalcore: 1.3,
      death: 1.2, melodeath: 1, industrial: 0.9,
      glam: 0.05, doom: 0.15, stoner: 0.2, heavy: 0.3, crossover: 0.3,
      gothic: 0.3, sludge: 0.4, postmetal: 0.5,
    },
    modeBias: { minor: 2.4, major: 0.5 },
    tempo: 0.25,
    density: -0.05,
    ornament: 0.9,
    leap: 1.25,
    restraint: 0.1,
  },
  {
    id: 'plain',
    label: 'Plain',
    gloss: 'no bias — the full spread of the era',
    styleBias: {},
    modeBias: { minor: 1, major: 1 },
    tempo: 0,
    density: 0,
    ornament: 1,
    leap: 1,
    restraint: 0,
  },
];

export const MOODS: Record<string, Mood> = Object.fromEntries(moods.map((m) => [m.id, m]));
