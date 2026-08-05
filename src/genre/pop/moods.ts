/**
 * Mood presets.
 *
 * A mood does not pick notes. It leans on choices the generator was going to
 * make anyway — which style, major or minor, where in the tempo band, how many
 * layers, how ornamented — so `heartbreak bubblegum` stays reachable and merely
 * unlikely, which is the correct relationship between a mood and a style.
 *
 * ## The axis is the running order
 *
 * Iskelmä sorts its moods by degrees of melancholy, jazz by heat, ambient by
 * weather and light, synth by destination, rock by the vocabulary of a review.
 * This genre sorts by **what the record is for** — which is not a metaphor here,
 * it is the industry's own vocabulary and the one everybody in it actually used.
 * A song was written to be the single, or the slow one at track four, or the
 * summer release, or the B-side nobody was going to hear. Those are different
 * songs before anybody plays a note, and they are the only categories this
 * repertoire has ever consistently sorted itself into.
 *
 * It is also the one axis that stays meaningful across all four eras. "Bright"
 * and "heavy" mean different things in 1965 and 2016; "this is the single" means
 * exactly the same thing in both, and it constrains tempo, key, length and how
 * soon the chorus arrives in exactly the same way.
 *
 * Seven with an opinion and one without. The last entry is load-bearing in a way
 * nothing about it looks load-bearing: `generateSong` uses a genre's final mood
 * as the fallback for any song that did not ask for one, so an opinionated entry
 * in that slot silently becomes the default for the whole genre. `npm run
 * genres` asserts it is flat, after `synth` shipped without one and spent two
 * hundred songs blaming its style weights.
 */

import type { Mood } from '../../style/types.js';

const moods: Mood[] = [
  {
    id: 'single',
    label: 'Single',
    gloss: 'the A-side: fast, major, and the chorus inside the first minute',
    styleBias: {
      bubblegum: 3.2, merseybeat: 3, powerpop: 2.8, teen: 2.4, europop: 2.2,
      girlgroup: 2, hinrg: 2, dancepop: 1.8, discopop: 1.4, stadium: 1.2,
      torch: 0.05, dreampop: 0.1, chamber: 0.15, baroque: 0.3, ballad: 0.2,
      softrock: 0.4, jangle: 0.7,
    },
    modeBias: { minor: 0.5, major: 2.4 },
    tempo: 0.6,
    density: 0.05,
    ornament: 0.85,
    leap: 1.1,
    restraint: -0.3,
  },
  {
    id: 'slowdance',
    label: 'Slow dance',
    gloss: 'track four, side one: the one they turn the lights down for',
    styleBias: {
      ballad: 3.4, girlgroup: 2.2, softrock: 2.2, brill: 1.8, baroque: 1.6,
      chamber: 1.5, stadium: 1.2, dreampop: 1.2, sunshine: 1,
      bubblegum: 0.05, hinrg: 0.05, europop: 0.1, powerpop: 0.15, teen: 0.3,
      merseybeat: 0.2, dancepop: 0.3, tropical: 0.3,
    },
    modeBias: { minor: 1.3, major: 1.5 },
    tempo: -0.65,
    density: 0.12,
    ornament: 1.3,
    leap: 0.85,
    restraint: 0.35,
  },
  {
    id: 'heartbreak',
    label: 'Heartbreak',
    gloss: 'minor, and about one person who is not in the room',
    styleBias: {
      torch: 3.4, ballad: 2.6, baroque: 2.4, newromantic: 2, dreampop: 1.8,
      chamber: 1.6, girlgroup: 1.4, softrock: 1.3, synthpop: 1.2, jangle: 1.1,
      bubblegum: 0.05, sunshine: 0.05, tropical: 0.15, hinrg: 0.2, merseybeat: 0.2,
      powerpop: 0.3, europop: 0.4,
    },
    modeBias: { minor: 3, major: 0.35 },
    tempo: -0.5,
    density: -0.08,
    ornament: 1.25,
    leap: 0.8,
    restraint: 0.5,
  },
  {
    id: 'summer',
    label: 'Summer',
    gloss: 'the July release: bright, warm, and slightly too pleased with itself',
    styleBias: {
      sunshine: 3.4, tropical: 3.2, merseybeat: 2, bubblegum: 2, jangle: 1.8,
      indiepop: 1.8, discopop: 1.6, dancepop: 1.4, softrock: 1.3, girlgroup: 1.1,
      torch: 0.05, dreampop: 0.2, newromantic: 0.2, baroque: 0.4, stadium: 0.4,
      chamber: 0.5, hinrg: 0.5,
    },
    modeBias: { minor: 0.4, major: 2.6 },
    tempo: 0.15,
    density: 0.06,
    ornament: 1.1,
    leap: 1.05,
    restraint: -0.15,
  },
  {
    id: 'floor',
    label: 'Floor',
    gloss: 'made for a room with a floor in it: four on it, and no slow bit',
    styleBias: {
      dancepop: 3.4, hinrg: 3.2, europop: 3, discopop: 2.8, electropop: 2.4,
      teen: 1.6, synthpop: 1.4, tropical: 1.4, stadium: 1,
      torch: 0.02, chamber: 0.05, baroque: 0.05, dreampop: 0.1, ballad: 0.1,
      brill: 0.2, jangle: 0.3, indiepop: 0.3,
    },
    modeBias: { minor: 1.8, major: 1 },
    tempo: 0.5,
    density: 0.15,
    ornament: 0.6,
    leap: 0.95,
    restraint: -0.35,
  },
  {
    id: 'latenight',
    label: 'Late night',
    gloss: 'the last track: slow, wide, and mostly reverb',
    styleBias: {
      dreampop: 3.4, torch: 2.4, softrock: 2.2, chamber: 1.8, newromantic: 1.6,
      ballad: 1.5, jangle: 1.2, baroque: 1.1, indiepop: 1,
      bubblegum: 0.05, hinrg: 0.05, europop: 0.1, powerpop: 0.15, merseybeat: 0.2,
      teen: 0.25, tropical: 0.3,
    },
    modeBias: { minor: 2, major: 1 },
    tempo: -0.45,
    density: -0.15,
    ornament: 1.15,
    leap: 0.7,
    restraint: 0.6,
    /**
     * The one place this genre's single feel table is aimed at. `softrock` names
     * `laidback` and this mood is what makes it likely — the studio band playing
     * a shade behind the beat at two in the morning, which is the whole of what
     * that style is about and is not something the notes can say.
     */
    feelBias: { laidback: 2.2, straight: 0.7 },
  },
  {
    id: 'bside',
    label: 'B-side',
    gloss: 'the one that was not going to be the single, and knew it',
    styleBias: {
      chamber: 3, indiepop: 2.6, baroque: 2.2, jangle: 2, torch: 1.8,
      dreampop: 1.6, brill: 1.4, sunshine: 1.2, softrock: 1.1,
      dancepop: 0.15, hinrg: 0.15, europop: 0.15, teen: 0.2, bubblegum: 0.2,
      stadium: 0.3, tropical: 0.3,
    },
    modeBias: { minor: 1.5, major: 1.2 },
    tempo: -0.2,
    density: -0.1,
    ornament: 1.35,
    leap: 1.2,
    restraint: 0.3,
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
