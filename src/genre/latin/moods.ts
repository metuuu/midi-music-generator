/**
 * Mood presets.
 *
 * A mood does not pick notes. It leans on choices the generator was going to
 * make anyway — which rhythm, major or minor, where in the tempo band, how many
 * layers, how ornamented — so a *bravo* danzón stays reachable and merely
 * unlikely, which is the correct relationship between a mood and a style.
 *
 * ## Why the ids are in Spanish, and where they are not
 *
 * Iskelmä's moods are in Finnish and reggae's are in English, and both tables
 * give the same reason: use the vocabulary the music uses about itself. This
 * repertoire has one, and it is unusually precise. *Sabor* is a technical term —
 * musicians use it to mean a specific rhythmic quality and will tell each other a
 * band has none — and there is no English word that means it. *Bravo* and
 * *rumbero* are the same kind of word.
 *
 * Where no such term exists the id is the plainest available noun rather than a
 * fancier one: `campo` means the countryside and is doing nothing clever, and
 * `llano` means flat. The rule is that a word earns its place by being what a
 * player would say, not by being Spanish.
 *
 * Seven, six with an opinion and one without. The last entry is load-bearing in
 * a way nothing about it looks load-bearing: `generateSong` uses a genre's final
 * mood as the fallback for any song that did not ask for one, so an opinionated
 * entry in that slot silently becomes the default for the whole genre.
 * `npm run genres` asserts it is flat.
 */

import type { Mood } from '../../style/types.js';

const moods: Mood[] = [
  {
    id: 'sabroso',
    label: 'Sabroso',
    gloss: 'with sabor: mid-tempo, in the pocket, and the floor stays full',
    styleBias: {
      son: 2.6, guaracha: 2.2, chachacha: 2.4, salsadura: 2, songo: 1.8,
      mambo: 1.6, guajira: 1.4, cumbia: 1.4, plena: 1.3, merengue: 1.2,
      samba: 1.2, partidoalto: 1.2,
      bolero: 0.4, ranchera: 0.4, danzon: 0.6, columbia: 0.5, bomba: 0.7,
    },
    modeBias: { minor: 1.1, major: 1.5 },
    tempo: 0.1,
    density: 0.05,
    ornament: 1.1,
    leap: 1,
    restraint: -0.1,
  },
  {
    id: 'bravo',
    label: 'Bravo',
    gloss: 'hard: minor, fast, trombones low, and nothing sweetened',
    styleBias: {
      salsadura: 3.2, timba: 3, songo: 2.2, mambo: 1.8, guaracha: 1.4,
      guaguanco: 1.4, columbia: 1.3, frevo: 1.2, merengue: 1.1,
      bolero: 0.2, guajira: 0.25, bachata: 0.3, danzon: 0.2, ranchera: 0.3,
      chachacha: 0.4, vallenato: 0.4,
    },
    modeBias: { minor: 2.6, major: 0.35 },
    tempo: 0.55,
    density: 0.14,
    ornament: 0.7,
    leap: 1.25,
    restraint: -0.3,
  },
  {
    id: 'romantico',
    label: 'Romántico',
    gloss: 'the slow one: bolero, bachata, a held note and somebody meaning it',
    styleBias: {
      bolero: 3.4, bachata: 3, guajira: 2, ranchera: 2, danzon: 1.4,
      chachacha: 0.9, son: 0.7, samba: 0.7, vallenato: 0.8,
      timba: 0.15, salsadura: 0.25, frevo: 0.1, columbia: 0.1,
      guaguanco: 0.2, bomba: 0.2, merengue: 0.3, banda: 0.5,
    },
    modeBias: { minor: 1.8, major: 1 },
    tempo: -0.7,
    density: -0.08,
    ornament: 1.5,
    leap: 0.75,
    restraint: 0.5,
  },
  {
    id: 'carnaval',
    label: 'Carnaval',
    gloss: 'the street: fast, major, brass, and several hundred people already up',
    styleBias: {
      frevo: 3.4, samba: 3, merengue: 2.4, guaracha: 2.2, banda: 2,
      mambo: 1.8, partidoalto: 1.6, plena: 1.5, norteno: 1.2,
      bolero: 0.1, guajira: 0.2, bachata: 0.2, danzon: 0.3, timba: 0.6,
      columbia: 0.4, cumbia: 0.6,
    },
    modeBias: { minor: 0.4, major: 2.4 },
    tempo: 0.8,
    density: 0.18,
    ornament: 1.15,
    leap: 1.35,
    restraint: -0.4,
  },
  {
    id: 'campo',
    label: 'Campo',
    gloss: 'inland: an accordion, three players, and a song about somebody real',
    styleBias: {
      vallenato: 3.2, norteno: 3, ranchera: 2.6, guajira: 2.2, joropo: 2.2,
      baiao: 2.2, cumbia: 1.6, banda: 1.4, plena: 1.1,
      timba: 0.1, salsadura: 0.15, mambo: 0.2, danzon: 0.3, chachacha: 0.3,
      songo: 0.15, frevo: 0.4,
    },
    modeBias: { minor: 0.9, major: 1.6 },
    tempo: -0.15,
    density: -0.18,
    ornament: 1.25,
    leap: 1.05,
    restraint: 0.35,
  },
  {
    id: 'rumbero',
    label: 'Rumbero',
    gloss: 'drums first: hands, sticks, a chorus answering, and two chords at most',
    styleBias: {
      guaguanco: 3.4, columbia: 3, bomba: 2.8, plena: 2, partidoalto: 1.8,
      songo: 1.5, samba: 1.4, son: 1.1, timba: 1,
      bolero: 0.1, bachata: 0.1, ranchera: 0.15, danzon: 0.2, norteno: 0.15,
      vallenato: 0.2, banda: 0.3, frevo: 0.4, chachacha: 0.4,
    },
    modeBias: { minor: 1.8, major: 0.8 },
    tempo: 0.2,
    density: -0.05,
    ornament: 0.8,
    leap: 0.95,
    restraint: 0.2,
  },
  {
    id: 'llano',
    label: 'Llano',
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
