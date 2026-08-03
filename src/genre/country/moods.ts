/**
 * Mood presets.
 *
 * A mood does not pick notes. It leans on choices the generator was going to make
 * anyway — which rhythm, major or minor, where in the tempo band, how many layers,
 * how ornamented — so a `sunday` truck-driving song stays reachable and merely
 * unlikely, which is the correct relationship between a mood and a style.
 *
 * Named in the vocabulary the music uses about itself, which here means plain
 * English and specifically the plain English of a jukebox card: lonesome,
 * bar-room, hoedown, heartbreak, hard luck. Every one of those words appears in
 * the titles of the records, which is the test — a mood table that had to reach
 * for a critic's word would be describing the music from outside it.
 *
 * **No zeroes anywhere.** Every bias below is at least 0.1, and that is a
 * mechanical requirement as well as a taste: `chooseStyle` throws when an era and
 * a mood between them leave no style with positive weight, and this genre has four
 * eras in which large blocks of the catalogue are already at zero for historical
 * reasons. A mood that also zeroed things would be one draw away from an era with
 * nothing in it.
 *
 * Eight, with the last one flat. That last entry is load-bearing in a way nothing
 * about it looks load-bearing: `generateSong` uses a genre's final mood as the
 * fallback for any song that did not ask for one, so an opinionated entry in that
 * slot silently becomes the default for the whole genre. `npm run genres` asserts
 * it is flat.
 */

import type { Mood } from '../../style/types.js';

const moods: Mood[] = [
  {
    id: 'lonesome',
    label: 'Lonesome',
    gloss: 'the high lonesome: modal, minor, slow, and sung a fourth higher than is comfortable',
    styleBias: {
      murderballad: 3.2, breakdown: 2.2, altcountry: 2.2, bluegrass: 1.8,
      cowboy: 1.6, ballad: 1.5, duet: 1.4, bluegrasswaltz: 1.3, waltz: 1.2,
      outlaw: 1.2, gospel: 0.6, twostep: 0.3, rockabilly: 0.25, zydeco: 0.25,
      countrypop: 0.2, cajun: 0.4, westernswing: 0.4, truckdriving: 0.4,
    },
    modeBias: { minor: 2.8, major: 0.35 },
    tempo: -0.6,
    density: -0.15,
    ornament: 0.9,
    leap: 0.8,
    restraint: 0.6,
  },
  {
    id: 'barroom',
    label: 'Bar-room',
    gloss: 'the shuffle, the steel and a glass: mid-tempo, major, and slightly the worse for wear',
    styleBias: {
      honkytonk: 3.4, twostep: 2, waltz: 1.8, westernswing: 1.6, bakersfield: 1.5,
      trainsong: 1.3, rockabilly: 1.3, cajun: 1.2, outlaw: 1.2, ballad: 1.1,
      gospel: 0.2, murderballad: 0.5, breakdown: 0.6, countrypop: 0.5,
      altcountry: 0.7, countrypolitan: 0.6,
    },
    modeBias: { minor: 0.8, major: 1.6 },
    tempo: -0.1,
    density: 0.05,
    ornament: 1.15,
    leap: 1,
    restraint: 0.15,
  },
  {
    id: 'hoedown',
    label: 'Hoedown',
    gloss: 'the floor: fast, major, everybody up, and the fiddle player doing the deciding',
    styleBias: {
      breakdown: 3.2, bluegrass: 3, twostep: 2.6, cajun: 2.2, zydeco: 2,
      westernswing: 2, rockabilly: 1.8, newgrass: 1.6, trainsong: 1.4,
      truckdriving: 1.2, bakersfield: 1.2,
      ballad: 0.2, countrypolitan: 0.2, murderballad: 0.15, altcountry: 0.3,
      cowboy: 0.5, waltz: 0.7,
    },
    modeBias: { minor: 0.5, major: 2.2 },
    tempo: 0.8,
    density: 0.15,
    ornament: 1.25,
    leap: 1.3,
    restraint: -0.4,
  },
  {
    id: 'sunday',
    label: 'Sunday',
    gloss: 'shape notes and close harmony: major, unhurried, and everybody singing the same words',
    styleBias: {
      gospel: 3.6, duet: 2.4, bluegrass: 1.5, cowboy: 1.4, bluegrasswaltz: 1.4,
      waltz: 1.2, ballad: 1.2, countrypolitan: 1.1,
      outlaw: 0.25, rockabilly: 0.2, truckdriving: 0.2, murderballad: 0.3,
      altcountry: 0.4, zydeco: 0.4, countrypop: 0.5, honkytonk: 0.4,
    },
    modeBias: { minor: 0.35, major: 2.6 },
    tempo: -0.35,
    density: 0.1,
    ornament: 1.1,
    leap: 0.85,
    restraint: 0.35,
  },
  {
    id: 'heartbreak',
    label: 'Heartbreak',
    gloss: 'the slow one with the strings on it: somebody is being sung about and it is not going well',
    styleBias: {
      ballad: 3.4, countrypolitan: 3, waltz: 2, duet: 1.6, honkytonk: 1.4,
      altcountry: 1.4, cowboy: 1.2, countrypop: 1.2, bluegrasswaltz: 1.1,
      breakdown: 0.2, newgrass: 0.5, twostep: 0.3, rockabilly: 0.25,
      zydeco: 0.25, truckdriving: 0.3, westernswing: 0.5, bluegrass: 0.5,
    },
    modeBias: { minor: 1.5, major: 1.2 },
    tempo: -0.7,
    density: 0.05,
    ornament: 1.3,
    leap: 0.8,
    restraint: 0.45,
  },
  {
    id: 'hardluck',
    label: 'Hard luck',
    gloss: 'no money and no prospects: minor, unadorned, and nobody in it is going to be all right',
    styleBias: {
      outlaw: 3, altcountry: 2.8, murderballad: 2.2, truckdriving: 1.6,
      bakersfield: 1.5, countryrock: 1.3, honkytonk: 1.2, breakdown: 1.1,
      gospel: 0.4, countrypop: 0.25, cajun: 0.5, duet: 0.6, countrypolitan: 0.5,
      cowboy: 0.6, bluegrasswaltz: 0.6,
    },
    modeBias: { minor: 2.4, major: 0.5 },
    tempo: -0.15,
    density: -0.05,
    ornament: 0.65,
    leap: 0.85,
    restraint: 0.3,
  },
  {
    id: 'highway',
    label: 'Highway',
    gloss: 'a rhythm designed to be heard at seventy miles an hour: straight eighths and somewhere to be',
    styleBias: {
      truckdriving: 3.2, trainsong: 3, countryrock: 2.4, bakersfield: 2,
      outlaw: 1.8, rockabilly: 1.4, twostep: 1.2, countrypop: 1.1,
      ballad: 0.25, countrypolitan: 0.3, murderballad: 0.3, gospel: 0.3,
      waltz: 0.2, bluegrasswaltz: 0.2, cowboy: 0.6,
    },
    modeBias: { minor: 0.9, major: 1.7 },
    tempo: 0.65,
    density: 0.1,
    ornament: 0.8,
    leap: 1.1,
    restraint: -0.2,
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
