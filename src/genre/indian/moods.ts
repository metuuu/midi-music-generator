/**
 * Indian moods, sorted by **rasa**.
 *
 * Same mechanism as everywhere else — a bias on the draw, never a control — and
 * the only genre here whose mood vocabulary was already written down before the
 * genre existed. Iskelmä sorts its moods by degrees of melancholy, jazz by heat,
 * ambient by weather and light; each of those is a reasonable invention. Rasa is
 * not an invention. It is the classification this music's own theory uses, it is
 * about two thousand years old, and the words below are the words a musician
 * would use about a piece unprompted.
 *
 * The load-bearing thing about rasa, and the reason it fits this table rather
 * than fighting it: **a rasa is what the listener is left with, not what the
 * performer feels.** It is an audience-side category. That is exactly what a
 * mood is here — a thumb on which styles get drawn and how fast they go — and
 * it is why none of these tries to be an emotion in the way `Kaihoisa` or
 * `Smoky` do.
 *
 * Six, plus the neutral one every genre has to end on. The other three of the
 * classical nine — *hāsya*, *bhayānaka*, *bībhatsa*: comedy, terror, disgust —
 * are left out because nothing in this catalogue produces them and a mood that
 * biases nothing is a row of ones with a name on it.
 *
 * One knob is used differently here and it is worth naming. `density` is the
 * number of *people playing*, and in this music the answer is nearly always
 * four. So it barely moves: the range across the whole table is 0.3, against
 * ambient's 0.4 and iskelmä's more. What separates a still piece from a
 * headlong one here is tempo and ornament, not headcount.
 */

import type { Mood } from '../../style/types.js';

const moods: Mood[] = [
  {
    id: 'shanta',
    label: 'Śānta',
    gloss: 'stillness — the unmetred end, one line and a drone, nothing hurrying',
    styleBias: {
      alap: 4.0, alapana: 3.6, tanam: 2.2, vilambit: 2.8, dhun: 1.8, santoor: 2.0,
      jor: 1.6, padam: 1.4, dhrupad: 1.2,
      jhala: 0.15, tarana: 0.2, cabaret: 0.1, bhangra: 0.1, tillana: 0.2,
      svara: 0.3, fusiongat: 0.2, qawwali: 0.25,
    },
    modeBias: { minor: 1.1, major: 1.1 },
    tempo: -0.85,
    density: -0.12,
    // The one place ornament is pulled *down*. A śānta piece dwells on a swara
    // rather than decorating it, and the decoration is what the dwelling is
    // instead of.
    ornament: 0.8,
    leap: 0.6,
    restraint: 0.85,
  },
  {
    id: 'bhakti',
    label: 'Bhakti',
    gloss: 'devotional — the forms sung at somebody rather than performed at somebody',
    styleBias: {
      bhajan: 4.0, qawwali: 3.4, kriti: 2.6, dhrupad: 2.4, varnam: 1.2,
      alapana: 1.2, vilambit: 1.0,
      cabaret: 0.1, bhangra: 0.3, ragarock: 0.2, jugalbandi: 0.4, mujra: 0.3,
      thumri: 0.5, ghazal: 0.6,
    },
    modeBias: { minor: 1.2, major: 1.3 },
    tempo: -0.05,
    density: 0.1,
    ornament: 0.9,
    leap: 0.85,
    restraint: 0.2,
  },
  {
    id: 'shringara',
    label: 'Śṛṅgāra',
    gloss: 'the erotic and the beautiful — thumrī, ghazal, and everything sung to somebody',
    styleBias: {
      thumri: 4.0, ghazal: 3.6, padam: 3.0, mujra: 2.6, filmi: 2.0, kriti: 1.2,
      santoor: 1.2, bandish: 1.0,
      dhrupad: 0.2, svara: 0.25, bhangra: 0.2, jhala: 0.3, fusiongat: 0.3,
      varnam: 0.4,
    },
    modeBias: { minor: 1.2, major: 1.1 },
    tempo: -0.4,
    density: 0.0,
    // The highest ornament multiplier in the table, on top of the highest
    // ornament figures in the project. A thumrī is the ornament.
    ornament: 1.35,
    leap: 0.75,
    restraint: 0.4,
  },
  {
    id: 'karuna',
    label: 'Karuṇā',
    gloss: 'grief — the komal rāgas, slow, and the item a concert closes on',
    styleBias: {
      thumri: 2.6, ghazal: 2.6, padam: 2.4, vilambit: 2.0, alap: 1.8,
      alapana: 1.6, bhajan: 1.4, filmi: 1.2, dhrupad: 1.2,
      cabaret: 0.1, bhangra: 0.1, tarana: 0.2, jhala: 0.2, tillana: 0.2,
      svara: 0.3, ragarock: 0.3, jugalbandi: 0.3,
    },
    // The strongest mode bias here. Bhairavi and Asavari are the rāgas this
    // rasa lives in, and both sit on the minor side of every pair they appear
    // in — see the pairing rule at the top of `styles.ts`.
    modeBias: { minor: 2.4, major: 0.4 },
    tempo: -0.6,
    density: -0.1,
    ornament: 1.15,
    leap: 0.7,
    restraint: 0.6,
  },
  {
    id: 'vira',
    label: 'Vīra',
    gloss: 'headlong — jhālā, tarānā, tillānā, and arithmetic at speed',
    styleBias: {
      jhala: 3.8, tarana: 3.4, tillana: 3.2, svara: 2.8, fusiongat: 2.6,
      jugalbandi: 2.4, varnam: 1.8, bandish: 1.4, qawwali: 1.2,
      alap: 0.1, alapana: 0.1, vilambit: 0.15, padam: 0.2, tanam: 0.3,
      santoor: 0.3, ghazal: 0.3, thumri: 0.3,
    },
    modeBias: { minor: 1.2, major: 1.0 },
    tempo: 0.8,
    density: 0.18,
    ornament: 0.75,
    leap: 1.3,
    restraint: -0.35,
  },
  {
    id: 'utsav',
    label: 'Utsav',
    gloss: 'festival — the dhol, the clapping row, and the film number',
    styleBias: {
      bhangra: 4.0, cabaret: 3.4, filmi: 3.0, qawwali: 2.8, ragarock: 2.2,
      bhajan: 1.6, mujra: 1.4, tillana: 1.2,
      alap: 0.05, alapana: 0.05, jor: 0.1, tanam: 0.1, vilambit: 0.15,
      dhrupad: 0.15, padam: 0.2, santoor: 0.3,
    },
    modeBias: { minor: 0.8, major: 1.5 },
    tempo: 0.6,
    density: 0.25,
    ornament: 0.8,
    leap: 1.15,
    restraint: -0.4,
  },
  {
    /**
     * No bias at all, and the last entry, which is what makes it the default —
     * see `npm run genres`, which asserts exactly this about every genre's final
     * mood. A song that did not ask for a rasa gets the era's own spread, which
     * for this genre is the right answer twice over: a concert programme is
     * built to cover the rasas rather than to sit in one.
     */
    id: 'neutral',
    label: 'Neutral',
    gloss: 'no bias — the full spread of the tradition',
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
