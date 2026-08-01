/**
 * Mood presets.
 *
 * A mood does not pick notes. It leans on choices the generator was going to
 * make anyway — which style, major or minor, where in the tempo band, how many
 * layers, how ornamented — so a `vauhdikas itkuvirsi` stays reachable and merely
 * very unlikely, which is the correct relationship between a mood and a style.
 *
 * Finnish, like iskelmä's, and for the reason reggae states in plain English:
 * use the vocabulary the music uses about itself. What is deliberately *not*
 * shared with iskelmä is any of the words. That genre's table is built around
 * `haikea` and `kaihoisa` — two shades of wistfulness that are the emotional
 * subject of Finnish popular song — and this one has almost no use for either.
 * Folk music is not about longing; it is about a wedding, a funeral, a floor, a
 * pasture and a hymn, and the seven opinionated entries below name those.
 *
 * `arkainen` and `jykevä` are the two ends of the genre and are worth reading as
 * a pair: they are the same table with the weights inverted, because the
 * distance from a kantele drone to an amplified seven is the whole span this
 * genre covers and a mood is the fastest way to ask for one end of it.
 *
 * The last entry is load-bearing in a way nothing about it looks load-bearing.
 * `generateSong` uses a genre's final mood as the fallback for any song that did
 * not ask for one, so an opinionated entry in that slot silently becomes the
 * default for the whole genre; `npm run genres` asserts it is flat.
 */

import type { Mood } from '../../style/types.js';

const moods: Mood[] = [
  {
    id: 'arkainen',
    label: 'Arkainen',
    gloss: 'archaic: the layer before the fiddle — a drone, a voice, and no harmony',
    styleBias: {
      runolaulu: 3.4, soitto: 2.8, itkuvirsi: 2.4, karjanhuuto: 2.2, virsi: 1.8,
      piirileikki: 1.2, rekilaulu: 0.8, polska: 0.5, hambo: 0.2, menuetti: 0.2,
      polkka: 0.1, sottiisi: 0.1, katrilli: 0.1, tanhu: 0.1,
      sahkopelimanni: 0.15, poljento: 0.15, karjalanlaulu: 0.4,
    },
    modeBias: { minor: 2.4, major: 0.4 },
    tempo: -0.7,
    density: -0.3,
    ornament: 1.2,
    leap: 0.7,
    restraint: 0.8,
  },
  {
    id: 'murheinen',
    label: 'Murheinen',
    gloss: 'sorrowful: the lament, the slow waltz, and the hymn sung too slowly',
    styleBias: {
      itkuvirsi: 3.4, hidasvalssi: 2.8, virsi: 2.2, runolaulu: 1.4, rekilaulu: 1.3,
      soitto: 1.2, konserttikantele: 1.2, polska: 0.8, haavalssi: 0.7,
      menuetti: 0.4, katrilli: 0.2, polkka: 0.1, sottiisi: 0.1, tanhu: 0.1,
      piirileikki: 0.15, purpuri: 0.2, marssi: 0.3,
    },
    modeBias: { minor: 3, major: 0.2 },
    tempo: -0.8,
    density: -0.2,
    ornament: 1.15,
    leap: 0.7,
    restraint: 0.75,
    /** Behind the beat, held long, and the metre allowed to go soft. */
    feelBias: { laidback: 2.2, driving: 0.2, pocket: 0.6 },
  },
  {
    id: 'juhlava',
    label: 'Juhlava',
    gloss: 'ceremonial: the wedding — the march in, the suite, and the waltz everybody waited for',
    styleBias: {
      haavalssi: 3, marssi: 2.8, purpuri: 2.6, katrilli: 2, menuetti: 1.8,
      soittokunta: 1.6, virsi: 1.4, polska: 1.2, tanhu: 1.2, hambo: 1.1,
      itkuvirsi: 0.35, karjanhuuto: 0.2, sahkopelimanni: 0.4, poljento: 0.3,
    },
    modeBias: { minor: 0.7, major: 1.8 },
    tempo: 0.15,
    density: 0.2,
    ornament: 1.15,
    leap: 1.1,
    restraint: -0.15,
  },
  {
    id: 'vauhdikas',
    label: 'Vauhdikas',
    gloss: 'brisk: the floor, and nobody sitting down',
    styleBias: {
      polkka: 3.2, sottiisi: 2.8, tanhu: 2.6, piirileikki: 2.2, katrilli: 2,
      sahkopelimanni: 1.8, masurkka: 1.6, haavalssi: 1.4, polska: 1.3,
      purpuri: 1.2, hambo: 1, poljento: 1,
      itkuvirsi: 0.05, karjanhuuto: 0.1, runolaulu: 0.1, virsi: 0.1,
      hidasvalssi: 0.15, soitto: 0.2, konserttikantele: 0.2,
    },
    modeBias: { minor: 0.5, major: 2 },
    tempo: 0.8,
    density: 0.2,
    ornament: 1.05,
    leap: 1.3,
    restraint: -0.4,
    /** The band leaning in, and never dragging. */
    feelBias: { driving: 2, laidback: 0.15, pocket: 0.8 },
  },
  {
    id: 'harras',
    label: 'Harras',
    gloss: 'devout: the folk hymn, the kantele, and the room going quiet',
    styleBias: {
      virsi: 3.4, soitto: 2.4, konserttikantele: 2.2, itkuvirsi: 2, runolaulu: 1.8,
      hidasvalssi: 1.4, karjanhuuto: 1.1, rekilaulu: 0.8, soittokunta: 0.7,
      polkka: 0.1, sottiisi: 0.1, tanhu: 0.1, katrilli: 0.15, purpuri: 0.2,
      sahkopelimanni: 0.15, poljento: 0.15,
    },
    modeBias: { minor: 1.8, major: 0.8 },
    tempo: -0.75,
    density: -0.25,
    ornament: 1.35,
    leap: 0.6,
    restraint: 0.85,
  },
  {
    id: 'pyoriva',
    label: 'Pyörivä',
    gloss: 'turning: the dances in three, and the limp in the middle of them',
    styleBias: {
      polska: 3, haavalssi: 2.6, hambo: 2.4, masurkka: 2.2, soittokunta: 2,
      menuetti: 1.8, hidasvalssi: 1.4,
      polkka: 0.3, sottiisi: 0.3, marssi: 0.2, purpuri: 0.3, katrilli: 0.3,
      piirileikki: 0.4, tanhu: 0.4, runolaulu: 0.2, itkuvirsi: 0.2,
      karjanhuuto: 0.1, poljento: 0.3, karjalanlaulu: 0.2, sahkopelimanni: 0.4,
    },
    modeBias: { minor: 1.3, major: 1.1 },
    tempo: -0.05,
    density: 0.05,
    ornament: 1.2,
    leap: 1,
    restraint: 0.15,
  },
  {
    id: 'jykeva',
    label: 'Jykevä',
    gloss: 'heavy: amplified, in seven, and with a drummer',
    styleBias: {
      sahkopelimanni: 3.2, poljento: 3, karjalanlaulu: 2.8, tanhu: 1.2,
      polska: 1.1, sottiisi: 0.8, soittokunta: 0.7,
      runolaulu: 0.25, itkuvirsi: 0.2, soitto: 0.2, karjanhuuto: 0.15,
      virsi: 0.2, menuetti: 0.2, haavalssi: 0.3, hidasvalssi: 0.3,
      konserttikantele: 0.2, piirileikki: 0.3,
    },
    modeBias: { minor: 2.4, major: 0.5 },
    tempo: 0.5,
    density: 0.25,
    ornament: 0.75,
    leap: 1.15,
    restraint: -0.35,
    feelBias: { driving: 2.4, laidback: 0.1 },
  },
  {
    id: 'tavallinen',
    label: 'Tavallinen',
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
