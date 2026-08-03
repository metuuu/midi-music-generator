/**
 * Mood presets.
 *
 * A mood does not pick notes. It leans on choices the generator was going to make
 * anyway — which rhythm, major or minor, where in the tempo band, how many layers,
 * how ornamented — so `conscious ska` remains reachable and merely unlikely, which
 * is the correct relationship between a mood and a style.
 *
 * Named in plain English, unlike iskelmä's, and the reason is the same one that
 * makes iskelmä's Finnish: use the vocabulary the music uses about itself. This
 * one talks about weight, sweetness, echo and the dance, and it does not need
 * translating. What it is *not* doing is affecting an accent — a mood table
 * written in patois would be a mainland writer doing an impression, and the words
 * below are the ones a sleeve note would actually have used.
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
    id: 'conscious',
    label: 'Conscious',
    gloss: 'roots-minded: minor, slow, and looking a long way past the dance floor',
    styleBias: {
      roots: 3, nyabinghi: 2.8, steppers: 2.2, dubpoetry: 2.2, onedrop: 1.8,
      dub: 1.6, rockers: 1.4, horns: 1.1, lovers: 0.4, ska: 0.25,
      shuffle: 0.15, mento: 0.15, twotone: 0.3, slengteng: 0.5, ragga: 0.3,
    },
    modeBias: { minor: 2.6, major: 0.3 },
    tempo: -0.6,
    density: -0.05,
    ornament: 0.85,
    leap: 0.75,
    restraint: 0.55,
  },
  {
    id: 'heavy',
    label: 'Heavy',
    gloss: 'militant: the bass forward, the kick on all four, and nothing decorative',
    styleBias: {
      steppers: 3, rockers: 2.6, rubadub: 2.4, roots: 1.8, dub: 1.6,
      dancehall: 1.4, onedrop: 1.2, ragga: 1.1, nyabinghi: 1.1,
      lovers: 0.3, mento: 0.1, shuffle: 0.2, ska: 0.4, bubble: 0.5,
    },
    modeBias: { minor: 2.4, major: 0.4 },
    tempo: -0.1,
    density: 0.1,
    ornament: 0.6,
    leap: 0.7,
    restraint: 0.2,
  },
  {
    id: 'sweet',
    label: 'Sweet',
    gloss: 'lovers rock: major, sung, and unembarrassed about it',
    styleBias: {
      lovers: 3.4, rocksteady: 2.6, bubble: 1.6, onedrop: 1.3, horns: 1.2,
      skinhead: 0.9, roots: 0.6, steppers: 0.25, ragga: 0.2, dubpoetry: 0.15,
      nyabinghi: 0.2, rubadub: 0.4,
    },
    modeBias: { minor: 0.35, major: 2.6 },
    tempo: -0.4,
    density: 0.05,
    ornament: 1.35,
    leap: 0.9,
    restraint: 0.35,
  },
  {
    id: 'jump',
    label: 'Jump',
    gloss: 'the floor: fast, major, horns, and everybody up',
    styleBias: {
      ska: 3.2, twotone: 3, shuffle: 2.6, skinhead: 2.4, mento: 2,
      horns: 1.4, bubble: 1.1, rocksteady: 0.8, onedrop: 0.5, roots: 0.4,
      dub: 0.2, dubpoetry: 0.1, nyabinghi: 0.2, steppers: 0.4,
    },
    modeBias: { minor: 0.5, major: 2.2 },
    tempo: 0.75,
    density: 0.15,
    ornament: 1.2,
    leap: 1.3,
    restraint: -0.35,
  },
  {
    id: 'echo',
    label: 'Echo',
    gloss: 'the version: half the band at any moment, and all of it wet',
    styleBias: {
      dub: 3.4, dubpoetry: 2.4, flyers: 1.8, rubadub: 1.6, steppers: 1.3,
      roots: 1.2, onedrop: 1.1, nyabinghi: 0.8, ska: 0.2, mento: 0.1,
      shuffle: 0.1, twotone: 0.2, lovers: 0.5,
    },
    modeBias: { minor: 2.2, major: 0.5 },
    tempo: -0.5,
    density: -0.3,
    ornament: 0.7,
    leap: 0.85,
    restraint: 0.8,
  },
  {
    id: 'rough',
    label: 'Rough',
    gloss: 'digital: hard, fast, programmed, and one chord',
    styleBias: {
      ragga: 3.2, dancehall: 3, slengteng: 2.8, rubadub: 1.6, steppers: 1,
      dub: 0.8, onedrop: 0.5, roots: 0.4, mento: 0, shuffle: 0, ska: 0.2,
      lovers: 0.4, nyabinghi: 0.2, bubble: 0.4,
    },
    modeBias: { minor: 2.2, major: 0.5 },
    tempo: 0.55,
    density: -0.05,
    ornament: 0.5,
    leap: 1.05,
    restraint: 0.1,
  },
  {
    id: 'easy',
    label: 'Easy',
    gloss: 'skanking at half attention: mid-tempo, unhurried, nothing at stake',
    styleBias: {
      onedrop: 2.2, bubble: 2, lovers: 1.8, rocksteady: 1.7, horns: 1.6,
      flyers: 1.4, roots: 1.1, skinhead: 1, mento: 0.9, dub: 0.9,
      ragga: 0.4, steppers: 0.6, dubpoetry: 0.5,
    },
    modeBias: { minor: 1, major: 1.3 },
    tempo: -0.3,
    density: -0.15,
    ornament: 1.05,
    leap: 0.9,
    restraint: 0.5,
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
