/**
 * Jazz moods.
 *
 * Same mechanism as the iskelmä moods — bias, not control — but the vocabulary
 * is different because the emotional axes of the two genres are different.
 * Iskelmä sorts itself by degrees of melancholy; jazz sorts itself mostly by
 * heat and room temperature.
 */

import type { Mood } from '../../style/types.js';

const moods: Mood[] = [
  {
    id: 'smoky',
    label: 'Smoky',
    gloss: 'late-night club, slow and minor',
    styleBias: { ballad: 3.0, blues: 1.6, trio: 1.4, modal: 1.2, swing: 0.9, bossa: 0.7, bebop: 0.3, gypsy: 0.4 },
    modeBias: { minor: 2.2, major: 0.5 },
    tempo: -0.8,
    density: -0.18,
    ornament: 0.9,
    leap: 0.85,
    restraint: 0.7,
  },
  {
    id: 'swinging',
    label: 'Swinging',
    gloss: 'up-tempo, major, front-of-house',
    styleBias: { swing: 3.0, blues: 1.6, bebop: 1.4, gypsy: 1.3, trio: 1.0, bossa: 0.6, modal: 0.5, ballad: 0.2 },
    modeBias: { minor: 0.6, major: 1.8 },
    tempo: 0.6,
    density: 0.15,
    ornament: 1.2,
    leap: 1.15,
    restraint: -0.3,
  },
  {
    id: 'cool',
    label: 'Cool',
    gloss: 'understated, unhurried, west-coast',
    styleBias: { bossa: 2.4, modal: 2.0, trio: 2.0, ballad: 1.5, swing: 1.2, blues: 0.8, bebop: 0.3, gypsy: 0.4 },
    modeBias: { minor: 1.2, major: 1.2 },
    tempo: -0.35,
    density: -0.12,
    ornament: 0.95,
    leap: 0.9,
    restraint: 0.5,
  },
  {
    id: 'hot',
    label: 'Hot',
    gloss: 'fast and dense — bebop and hard swing',
    styleBias: { bebop: 3.2, swing: 1.8, gypsy: 1.6, trio: 1.5, blues: 1.3, bossa: 0.3, modal: 0.5, ballad: 0.1 },
    modeBias: { minor: 1.1, major: 1.2 },
    tempo: 0.85,
    density: 0.25,
    ornament: 1.4,
    leap: 1.3,
    restraint: -0.4,
  },
  {
    id: 'bluesy',
    label: 'Bluesy',
    gloss: 'twelve bars and blue notes',
    styleBias: { blues: 3.4, swing: 1.3, bebop: 0.9, ballad: 0.8, trio: 0.8, modal: 0.6, gypsy: 0.5, bossa: 0.3 },
    modeBias: { minor: 1.3, major: 1.3 },
    tempo: -0.1,
    density: 0.05,
    ornament: 1.25,
    leap: 1.1,
    restraint: 0.1,
  },
  {
    id: 'dreamy',
    label: 'Dreamy',
    gloss: 'floating and open — modal and ballad',
    styleBias: { modal: 3.0, trio: 2.6, ballad: 2.2, bossa: 1.4, swing: 0.6, blues: 0.5, bebop: 0.15, gypsy: 0.2 },
    modeBias: { minor: 1.8, major: 0.8 },
    tempo: -0.5,
    density: -0.2,
    ornament: 0.85,
    leap: 0.85,
    restraint: 0.75,
  },
  {
    id: 'neutral',
    label: 'Neutral',
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
