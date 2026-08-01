/**
 * Mood presets, named in the vocabulary the repertoire already uses.
 *
 * Iskelmä sorts its moods by degrees of melancholy and names them in Finnish;
 * jazz sorts by heat; ambient by weather and light; synth by destination. This
 * genre has had a mood vocabulary of its own since about 1600 and it is printed
 * at the top of every score: *cantabile*, *maestoso*, *agitato*, *scherzando*.
 * Those are not tempo markings — the tempo word is a separate one next to them —
 * they are **character markings**, which is exactly what a `Mood` is: a thumb on
 * the choices the generator was going to make anyway.
 *
 * Using the Italian is the same decision iskelmä's file makes about Finnish and
 * for the same reason. `mesto` and `dolente` are not the same sadness, `maestoso`
 * and `brillante` are not the same loudness, and the distinctions do not survive
 * translation into a single English word each. Anyone reading a score has met
 * all nine.
 *
 * Two genre-specific behaviours worth naming:
 *
 * **`ornament` runs with the era rather than with the emotion.** In most of this
 * project a bright mood is a busy one; here the two are nearly independent,
 * because ornamentation in this repertoire is a *period practice* — a baroque
 * adagio is more ornamented than a romantic allegro — and the era already
 * decides which styles are in play. So the spread on `ornament` below is
 * deliberately narrow, and where it moves it moves for a reason about the
 * character rather than about the tempo: `cantabile` decorates because a singing
 * line is where a performer adds things, and `maestoso` does not because nobody
 * puts a trill in a fanfare.
 *
 * **`density` does most of the work.** This is orchestral music and the loudest
 * thing about a mood is how many people are playing. `maestoso` and `brillante`
 * add layers; `mesto` and `misterioso` take them away, which is the difference
 * between a tutti and a wind quartet and is the whole of what a nineteenth-
 * century orchestrator meant by dynamics.
 *
 * `ordinario` is last and has to be. An unspecified mood does not draw at
 * random — `generateSong` passes the table's final entry to `lookup` as the
 * fallback — so the last row is the default for every song nobody has asked a
 * question about, and `npm run genres` asserts that it biases nothing. The name
 * is the genre's own: *ord.* is the instruction that cancels every other
 * instruction and tells the player to go back to playing normally.
 */

import type { Mood } from '../../style/types.js';

const moods: Mood[] = [
  {
    id: 'maestoso',
    label: 'Maestoso',
    gloss: 'stately, ceremonial, the full band',
    styleBias: {
      overture: 3.2, march: 2.8, polonaise: 2.4, chorale: 1.8, sonata: 1.6,
      passacaglia: 1.4, fugue: 1.2, pavane: 1.2,
      berceuse: 0.2, nocturne: 0.3, mazurka: 0.3, rondo: 0.5, gigue: 0.5,
    },
    modeBias: { minor: 1.1, major: 1.4 },
    tempo: -0.3,
    // The largest positive density in the table. A ceremonial piece is not
    // played louder than an intimate one, it is played by more people.
    density: 0.22,
    ornament: 0.7,
    leap: 1.1,
    restraint: -0.4,
  },
  {
    id: 'cantabile',
    label: 'Cantabile',
    gloss: 'singing, the tune in front of everything',
    styleBias: {
      aria: 3.0, adagio: 2.6, nocturne: 2.4, barcarolle: 2.0, berceuse: 1.6,
      sarabande: 1.4, chorale: 1.2, pavane: 1.2,
      toccata: 0.2, etude: 0.2, gigue: 0.3, scherzo: 0.3, march: 0.3,
    },
    modeBias: { minor: 1.1, major: 1.2 },
    tempo: -0.45,
    density: -0.08,
    // The one place ornament is genuinely a mood rather than a period: a singing
    // line is where a performer puts something in, whatever century it is.
    ornament: 1.35,
    leap: 0.75,
    restraint: 0.4,
  },
  {
    id: 'giocoso',
    label: 'Giocoso',
    gloss: 'playful, light on its feet',
    styleBias: {
      rondo: 3.0, gigue: 2.6, scherzo: 2.4, gavotte: 2.0, minuet: 1.6,
      mazurka: 1.4, waltz: 1.2,
      lacrimosa: 0.05, sarabande: 0.2, chorale: 0.2, adagio: 0.3, passacaglia: 0.3,
    },
    modeBias: { minor: 0.4, major: 2.0 },
    tempo: 0.6,
    density: -0.05,
    ornament: 1.2,
    leap: 1.3,
    restraint: 0.1,
  },
  {
    id: 'mesto',
    label: 'Mesto',
    gloss: 'sorrowful, and not making a scene about it',
    styleBias: {
      lacrimosa: 3.2, sarabande: 2.8, adagio: 2.2, passacaglia: 2.0, chaconne: 1.8,
      nocturne: 1.6, pavane: 1.6, chorale: 1.4,
      rondo: 0.1, march: 0.1, gigue: 0.15, scherzo: 0.2, gavotte: 0.2,
    },
    modeBias: { minor: 3.0, major: 0.2 },
    tempo: -0.75,
    density: -0.2,
    ornament: 0.95,
    leap: 0.6,
    restraint: 0.75,
  },
  {
    id: 'agitato',
    label: 'Agitato',
    gloss: 'restless, driven, the storm movement',
    styleBias: {
      etude: 2.8, toccata: 2.6, scherzo: 2.2, sonata: 2.0, fugue: 1.5,
      chaconne: 1.3, overture: 1.2,
      berceuse: 0.05, pavane: 0.15, chorale: 0.2, aria: 0.3, minuet: 0.3,
    },
    modeBias: { minor: 2.6, major: 0.4 },
    tempo: 0.7,
    density: 0.15,
    ornament: 0.8,
    leap: 1.35,
    restraint: -0.5,
  },
  {
    id: 'brillante',
    label: 'Brillante',
    gloss: 'brilliant, and enjoying being watched',
    styleBias: {
      toccata: 2.8, etude: 2.6, rondo: 2.2, polonaise: 2.0, waltz: 1.8,
      overture: 1.6, sonata: 1.4, gigue: 1.4,
      lacrimosa: 0.1, berceuse: 0.15, chorale: 0.2, sarabande: 0.25, adagio: 0.3,
    },
    modeBias: { minor: 0.8, major: 1.6 },
    tempo: 0.75,
    density: 0.18,
    ornament: 1.25,
    leap: 1.4,
    restraint: -0.45,
  },
  {
    id: 'tranquillo',
    label: 'Tranquillo',
    gloss: 'calm, unhurried, nothing at stake',
    styleBias: {
      berceuse: 2.8, barcarolle: 2.4, pavane: 2.0, adagio: 1.8, prelude: 1.8,
      chorale: 1.5, minuet: 1.2, aria: 1.2,
      toccata: 0.15, etude: 0.15, march: 0.2, scherzo: 0.2, overture: 0.3,
    },
    modeBias: { minor: 0.9, major: 1.4 },
    tempo: -0.55,
    density: -0.22,
    ornament: 0.9,
    leap: 0.65,
    restraint: 0.8,
  },
  {
    id: 'misterioso',
    label: 'Misterioso',
    gloss: 'veiled — the harmony has stopped explaining itself',
    styleBias: {
      prelude: 3.4, pavane: 2.0, nocturne: 1.6, lacrimosa: 1.5, barcarolle: 1.3,
      passacaglia: 1.2, adagio: 1.2,
      march: 0.05, rondo: 0.1, gavotte: 0.15, gigue: 0.15, overture: 0.2,
    },
    modeBias: { minor: 1.6, major: 1.0 },
    tempo: -0.5,
    density: -0.18,
    ornament: 0.8,
    leap: 0.8,
    restraint: 0.65,
  },
  {
    id: 'ordinario',
    label: 'Ordinario',
    gloss: 'as written — no bias, the full spread of the era',
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
