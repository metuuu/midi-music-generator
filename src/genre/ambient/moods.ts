/**
 * Ambient moods.
 *
 * Same mechanism as the other genres — bias, not control — with a vocabulary
 * that reflects how this music actually sorts itself. Iskelmä sorts by degrees
 * of melancholy and jazz by heat; ambient sorts by *weather and light*, which
 * is the only axis its listeners and its sleeve notes have ever used.
 *
 * One knob behaves differently here and it is worth naming: `density` is
 * subtracted almost everywhere. In a dance band, density adds players. In
 * ambient it adds *layers to a texture*, and the texture is already the whole
 * piece — so the interesting direction is down.
 */

import type { Mood } from '../../style/types.js';

const moods: Mood[] = [
  {
    id: 'warm',
    label: 'Warm',
    gloss: 'tape-warm and nostalgic — analogue, major-leaning, half-remembered',
    styleBias: { hauntology: 3.4, drone: 1.4, choral: 1.1, kosmische: 1.0, aquatic: 0.7, wasteland: 0.3 },
    modeBias: { minor: 0.8, major: 1.6 },
    tempo: -0.15,
    density: 0.05,
    ornament: 1.1,
    leap: 1.0,
    restraint: 0.2,
  },
  {
    id: 'bleak',
    label: 'Bleak',
    gloss: 'cold, industrial, unlit — the wasteland end',
    styleBias: { wasteland: 3.8, drone: 1.6, aquatic: 1.0, kosmische: 0.8, choral: 0.6, hauntology: 0.4 },
    modeBias: { minor: 2.6, major: 0.3 },
    tempo: -0.7,
    density: -0.15,
    ornament: 0.6,
    leap: 1.15,
    restraint: 0.75,
  },
  {
    id: 'weightless',
    label: 'Weightless',
    gloss: 'high, still and slow — nothing has a pulse',
    styleBias: { drone: 3.6, choral: 2.0, hauntology: 0.9, wasteland: 1.0, aquatic: 0.6, kosmische: 0.4 },
    modeBias: { minor: 1.2, major: 1.2 },
    tempo: -0.85,
    density: -0.2,
    ornament: 0.5,
    leap: 0.7,
    restraint: 0.85,
  },
  {
    id: 'pulse',
    label: 'Pulse',
    gloss: 'something is running underneath — sequencers and four-on-the-floor',
    styleBias: { kosmische: 3.4, aquatic: 3.0, hauntology: 1.3, wasteland: 0.5, drone: 0.3, choral: 0.2 },
    modeBias: { minor: 1.5, major: 0.9 },
    tempo: 0.55,
    density: 0.2,
    ornament: 1.0,
    leap: 1.0,
    restraint: -0.25,
  },
  {
    id: 'sacred',
    label: 'Sacred',
    gloss: 'modal and luminous — voices, strings, three beats to a bar',
    styleBias: { choral: 3.8, drone: 1.8, hauntology: 0.9, wasteland: 0.6, kosmische: 0.4, aquatic: 0.3 },
    modeBias: { minor: 1.7, major: 0.9 },
    tempo: -0.5,
    density: -0.05,
    ornament: 0.7,
    leap: 0.75,
    restraint: 0.5,
  },
  {
    id: 'submerged',
    label: 'Submerged',
    gloss: 'heard through water — filtered, deep, slow-moving',
    styleBias: { aquatic: 3.4, wasteland: 1.8, drone: 1.5, kosmische: 1.0, hauntology: 0.8, choral: 0.4 },
    modeBias: { minor: 1.9, major: 0.7 },
    tempo: -0.2,
    density: -0.1,
    ornament: 0.7,
    leap: 0.8,
    restraint: 0.55,
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
