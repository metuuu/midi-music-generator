/**
 * Arabic moods.
 *
 * Same mechanism as everywhere else — bias, not control — on the axis this
 * repertoire actually sorts itself by, which is **occasion**. Iskelmä sorts by
 * degrees of melancholy, jazz by heat, ambient by weather and light, synth by
 * destination; this one sorts by *what the music is for and who is in the
 * room*, because that is the only question that separates a maqsum played at a
 * wedding from the same maqsum played at a concert, and the two are genuinely
 * different performances of one cycle.
 *
 * The names are the Arabic ones because the occasions are, and there is no
 * English word for `tarab` that is not a paragraph. Each gloss is that
 * paragraph, compressed.
 *
 * Two knobs behave unusually here and both follow from the ensemble.
 * **`density` adds players rather than parts**: the firqa is forty people
 * doubling one line, so more density is a thicker unison rather than a busier
 * arrangement. And **`ornament` never goes below 0.7**, because the floor of
 * this idiom is still more decorated than the ceiling of any other one in the
 * project — a maqam line with the ornament taken off is a scale exercise, and no
 * occasion calls for that.
 */

import type { Mood } from '../../style/types.js';

const moods: Mood[] = [
  {
    id: 'tarab',
    label: 'Tarab',
    gloss: 'the long absorption — a line sung six times, each further out than the last',
    styleBias: {
      wahda: 3.6, taqsim: 3.2, chiftetelli: 2.4, masmoudi: 1.8, samai: 1.6,
      muwashshah: 1.2, maqsum: 0.8, dabke: 0.3, zaffa: 0.2, malfuf: 0.2,
      fallahi: 0.25, longa: 0.4,
    },
    modeBias: { minor: 1.4, major: 1.0 },
    tempo: -0.7,
    density: -0.1,
    // The highest in the project by a distance, and the one number that says
    // what the word means: tarab is what happens when a phrase is turned over
    // and over and comes back slightly different every time.
    ornament: 1.3,
    leap: 0.75,
    restraint: 0.5,
  },
  {
    id: 'hanin',
    label: 'Hanin',
    gloss: 'longing, and for a place rather than a person — the slow sung forms',
    styleBias: {
      muwashshah: 3.2, wahda: 2.6, samai: 2.2, bashraf: 1.8, dawrhindi: 1.5,
      baladi: 1.2, taqsim: 1.4, chiftetelli: 1.0, zaffa: 0.2, malfuf: 0.25,
      fallahi: 0.3, dabke: 0.4, khaleeji: 0.5,
    },
    modeBias: { minor: 2.4, major: 0.5 },
    tempo: -0.5,
    density: -0.05,
    ornament: 1.1,
    leap: 0.7,
    restraint: 0.45,
  },
  {
    id: 'farah',
    label: 'Farah',
    gloss: 'the wedding — the procession, the line dance, and everybody standing up',
    styleBias: {
      zaffa: 3.8, malfuf: 3.0, dabke: 2.8, saidi: 2.4, fallahi: 2.2,
      khaleeji: 1.8, maqsum: 1.2, baladi: 1.0,
      taqsim: 0.1, samai: 0.2, bashraf: 0.2, muwashshah: 0.3, wahda: 0.3,
      chiftetelli: 0.4,
    },
    modeBias: { minor: 0.6, major: 1.8 },
    tempo: 0.7,
    density: 0.2,
    ornament: 0.75,
    leap: 1.15,
    restraint: -0.35,
  },
  {
    id: 'raqs',
    label: 'Raqs',
    gloss: 'the dance set — a cabaret floor, a drum solo, and somebody working',
    styleBias: {
      baladi: 3.0, maqsum: 2.6, saidi: 2.4, chiftetelli: 2.2, masmoudi: 2.0,
      malfuf: 1.6, ayyub: 1.4, khaleeji: 1.0,
      bashraf: 0.2, samai: 0.3, muwashshah: 0.25, dulab: 0.6, longa: 0.6,
    },
    modeBias: { minor: 1.0, major: 1.3 },
    tempo: 0.15,
    density: 0.1,
    ornament: 1.0,
    leap: 1.0,
    restraint: -0.15,
  },
  {
    id: 'sahra',
    label: 'Sahra',
    gloss: 'the late session — instrumental, virtuoso, and nobody is dancing',
    styleBias: {
      longa: 3.4, samai: 2.8, bashraf: 2.6, jurjina: 2.4, aqsaq: 2.2,
      dawrhindi: 2.0, taqsim: 2.0, dulab: 1.6,
      zaffa: 0.2, dabke: 0.3, khaleeji: 0.4, baladi: 0.5, fallahi: 0.4,
    },
    modeBias: { minor: 1.5, major: 0.9 },
    tempo: 0.25,
    density: -0.05,
    ornament: 1.15,
    leap: 1.1,
    restraint: 0.2,
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
