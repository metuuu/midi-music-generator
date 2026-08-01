/**
 * Mood presets.
 *
 * A mood does not pick notes. It leans on choices the generator was going to
 * make anyway — which style, major or minor, where in the tempo band, how many
 * layers, how ornamented — so `hazy punk` stays reachable and merely unlikely,
 * which is the correct relationship between a mood and a style.
 *
 * Named in the vocabulary the music uses about itself, which for this genre is
 * the vocabulary of a review: a band is *heavy*, a record is *raw*, a chorus is
 * *epic*. That is a slightly awkward register for a project whose house voice is
 * explicitly not a critic's — but these are the words the musicians used too,
 * and the alternative is a set of abstractions that would need translating for
 * everybody including the person who wrote them.
 *
 * Seven with an opinion and one without. The last entry is load-bearing in a way
 * nothing about it looks load-bearing: `generateSong` uses a genre's final mood
 * as the fallback for any song that did not ask for one, so an opinionated entry
 * in that slot silently becomes the default for the whole genre. `npm run
 * genres` asserts it is flat.
 */

import type { Mood } from '../../style/types.js';

const moods: Mood[] = [
  {
    id: 'heavy',
    label: 'Heavy',
    gloss: 'the riff: slow, minor, loud, and nothing decorative anywhere in it',
    styleBias: {
      riff: 3.2, stoner: 3, hard: 2.4, grunge: 2, bluesrock: 1.2, prog: 1.1,
      motorik: 0.9, arena: 0.9, punk: 0.8,
      jangle: 0.15, indie: 0.2, beat: 0.15, ballad: 0.3, surf: 0.4,
      glam: 0.4, newwave: 0.2,
    },
    modeBias: { minor: 2.8, major: 0.3 },
    tempo: -0.55,
    density: 0.05,
    ornament: 0.6,
    leap: 0.75,
    restraint: 0.15,
  },
  {
    id: 'swagger',
    label: 'Swagger',
    gloss: 'the strut: mid-tempo, major, shuffled, and enjoying itself',
    styleBias: {
      boogie: 3, southern: 2.8, glam: 2.4, bluesrock: 2.2, hard: 1.6,
      arena: 1.3, garage: 1.2, beat: 0.9,
      shoegaze: 0.1, postpunk: 0.15, stoner: 0.3, math: 0.2, ballad: 0.3,
      motorik: 0.3, grunge: 0.4,
    },
    modeBias: { minor: 0.4, major: 2.6 },
    tempo: 0.15,
    density: 0.08,
    ornament: 1.25,
    leap: 1.15,
    restraint: -0.2,
  },
  {
    id: 'bright',
    label: 'Bright',
    gloss: 'the single: fast, major, two and a half minutes, and a tambourine',
    styleBias: {
      beat: 3.2, jangle: 3, newwave: 2.6, indie: 2.2, surf: 2, glam: 1.8,
      garage: 1.4, punk: 1.2, southern: 0.9,
      stoner: 0.05, riff: 0.1, grunge: 0.2, shoegaze: 0.3, prog: 0.3,
      psych: 0.5, math: 0.3,
    },
    modeBias: { minor: 0.35, major: 2.8 },
    tempo: 0.5,
    density: 0.05,
    ornament: 1.15,
    leap: 1.2,
    restraint: -0.25,
  },
  {
    id: 'raw',
    label: 'Raw',
    gloss: 'made in an afternoon: fast, loud, three chords and one microphone',
    styleBias: {
      punk: 3.4, garage: 3.2, postpunk: 2.2, grunge: 2, math: 1.4, boogie: 1.1,
      motorik: 1.1, alt: 1.1,
      ballad: 0.05, arena: 0.1, prog: 0.15, shoegaze: 0.3, jangle: 0.5,
      psych: 0.4, glam: 0.6,
    },
    modeBias: { minor: 1.4, major: 1.2 },
    tempo: 0.7,
    density: -0.1,
    ornament: 0.45,
    leap: 0.9,
    restraint: -0.3,
  },
  {
    id: 'epic',
    label: 'Epic',
    gloss: 'the building: long, arranged, and delivered to the back row',
    styleBias: {
      arena: 3.2, ballad: 3, prog: 2.4, hard: 1.8, glam: 1.3, alt: 1.1,
      psych: 1,
      garage: 0.1, punk: 0.1, math: 0.3, indie: 0.3, motorik: 0.4,
      boogie: 0.4, surf: 0.3,
    },
    modeBias: { minor: 1.5, major: 1.5 },
    tempo: -0.2,
    density: 0.18,
    ornament: 1.2,
    leap: 1.25,
    restraint: 0.3,
  },
  {
    id: 'hazy',
    label: 'Hazy',
    gloss: 'the drone: one chord, everything sustained, and the tune underneath it',
    styleBias: {
      shoegaze: 3.4, psych: 3, motorik: 2.6, stoner: 1.8, postpunk: 1.3,
      alt: 1, jangle: 0.9,
      punk: 0.1, glam: 0.15, boogie: 0.2, beat: 0.3, southern: 0.2,
      arena: 0.4, bluesrock: 0.3,
    },
    modeBias: { minor: 1.6, major: 1.3 },
    tempo: -0.35,
    density: -0.2,
    ornament: 0.85,
    leap: 0.6,
    restraint: 0.65,
  },
  {
    id: 'wistful',
    label: 'Wistful',
    gloss: 'slow, minor, and looking at something that has already happened',
    styleBias: {
      ballad: 2.8, indie: 2.4, jangle: 2, postpunk: 1.8, alt: 1.6, psych: 1.2,
      shoegaze: 1.2,
      punk: 0.1, boogie: 0.1, glam: 0.15, garage: 0.2, hard: 0.3,
      arena: 0.5, motorik: 0.4,
    },
    modeBias: { minor: 2.4, major: 0.6 },
    tempo: -0.6,
    density: -0.15,
    ornament: 1.3,
    leap: 0.8,
    restraint: 0.6,
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
