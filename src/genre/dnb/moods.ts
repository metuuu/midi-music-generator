/**
 * Drum and bass moods.
 *
 * Bias rather than control, as everywhere else, over the axis this repertoire
 * actually has. Iskelmä sorts by degrees of melancholy, jazz by heat, ambient by
 * weather, synth by destination, funk by how hard the floor is being worked and
 * hiphop by what the record is playing out of. **This music sorts by what the
 * room is doing** — standing at the bar, shouting at the speaker, facing it with
 * both hands down, or pulling the record back to the start — and that is not a
 * mood in the ordinary sense. It is the only axis a sleeve, a flyer or a two-hour
 * set has ever been organised along in this genre.
 *
 * It is worth being clear that these are not four settings of a loudness knob.
 * `roughneck` and `darkside` are both loud and they are loud in different
 * octaves, and both make the arrangement *thinner* rather than fuller.
 * `deepend` and `wheelup` are both about the sampled half of the catalogue and
 * one of them is a Rhodes chord while the other is eleven ghost strokes. What
 * separates them is where the weight of the arrangement sits, and the four moods
 * below move `density` by less than a fifth between them while moving the style
 * weights by a factor of twenty.
 *
 * Three knobs behave in a genre-specific way and are worth naming.
 *
 * **`ornament` is low everywhere and lowest where the tempo is highest.** A
 * grace note is a player deciding something in the moment; at 174 a sixteenth is
 * 86 ms and there is no moment to decide in. The exception is `deepend`, where
 * the melodic content is the one thing on the record that is allowed to be
 * played rather than placed.
 *
 * **`leap` runs opposite to density, exactly as hiphop's does and for a
 * different reason.** There the fullest arrangements were the sampled ones and a
 * sampled hook moves by step because it was a phrase first. Here the emptiest
 * arrangement is `darkside`, whose melodic content is a bass patch an octave
 * below everything else moving in fifths.
 *
 * **`restraint` is positive in all four**, which is unusual — it is negative
 * almost everywhere else in the project, because elsewhere a mood asking for
 * restraint is asking for a quieter version of the music. In this genre a thin
 * arrangement is not the quiet one. It is the one with a working sub in it: two
 * objects at opposite ends of the spectrum and nothing in the middle is the
 * *sound*, and every mood here wants some of it.
 */

import type { Mood } from '../../style/types.js';

const moods: Mood[] = [
  {
    id: 'deepend',
    label: 'Deep end',
    gloss: 'the first hour, while the room is still filling and nobody has committed',
    styleBias: {
      liquid: 4.0, deep: 3.6, atmospheric: 3.4, intelligent: 3.0, jazzstep: 2.8,
      autonomic: 2.4, dubwise: 1.6, sambass: 1.4,
      jumpup: 0.2, breakcore: 0.2, dancefloor: 0.3, hardcore: 0.3, techstep: 0.4,
      neurofunk: 0.5,
    },
    modeBias: { minor: 1.1, major: 1.2 },
    tempo: -0.4,
    // The fullest arrangement in the genre, and it is still under two thirds.
    density: 0.08,
    // The one mood here that decorates. What is being decorated is a Rhodes
    // chord, and it is the only thing on any of these records that a person
    // could have played in real time.
    ornament: 1.3,
    leap: 0.8,
    restraint: 0.1,
  },
  {
    id: 'roughneck',
    label: 'Roughneck',
    gloss: 'shouted over, and the sub is doing most of the shouting',
    styleBias: {
      ragga: 4.0, jumpup: 3.4, hardcore: 3.0, bleep: 2.6, jungle: 2.4,
      revival: 2.2, dancefloor: 1.6, hardstep: 1.4,
      atmospheric: 0.2, deep: 0.2, minimal: 0.3, autonomic: 0.3, intelligent: 0.4,
      jazzstep: 0.5,
    },
    modeBias: { minor: 1.2, major: 1.1 },
    tempo: 0.1,
    density: 0.04,
    ornament: 0.5,
    leap: 1.15,
    restraint: 0.12,
  },
  {
    id: 'darkside',
    label: 'Darkside',
    gloss: 'three in the morning, facing the speaker, and nothing in it is friendly',
    styleBias: {
      techstep: 4.0, neurofunk: 3.6, darkcore: 3.2, halftime: 2.6, minimal: 2.4,
      drumfunk: 2.0, breakcore: 1.8, hardstep: 1.6,
      liquid: 0.2, sambass: 0.2, jazzstep: 0.3, intelligent: 0.3, deep: 0.5,
      hardcore: 0.5,
    },
    // The most lopsided mode bias in the project after hiphop's `hard`, and it
    // is doing less work than it looks: `techstep` and `neurofunk` are already
    // 0.95 minor before any mood touches them.
    modeBias: { minor: 1.9, major: 0.35 },
    tempo: 0.2,
    // The emptiest and the loudest. Those are the same records.
    density: -0.1,
    ornament: 0.35,
    leap: 0.9,
    restraint: 0.4,
  },
  {
    id: 'wheelup',
    label: 'Wheel-up',
    gloss: 'the one the record gets pulled back for, twice, before anybody hears the drop',
    styleBias: {
      jungle: 4.0, drumfunk: 3.4, revival: 3.2, breakcore: 2.6, ragga: 2.4,
      hardstep: 2.0, rollers: 1.6, dubwise: 1.4,
      deep: 0.2, autonomic: 0.2, minimal: 0.3, dancefloor: 0.4, liquid: 0.5,
    },
    modeBias: { minor: 1.4, major: 1.0 },
    tempo: 0.05,
    density: -0.04,
    // The lowest here. Nothing in a chopped break was decided in the moment; it
    // was decided at a keyboard and then triggered four hundred times.
    ornament: 0.4,
    leap: 1.0,
    restraint: 0.22,
  },
  /**
   * No bias — the full spread of the era.
   *
   * **Last on purpose, and it has to be last.** An unspecified mood does not
   * draw at random: `generateSong` passes the final entry of this table as the
   * fallback, so whichever mood is written here is what every song gets unless
   * somebody asks for another by name. `npm run genres` asserts that every
   * genre's is neutral, and the reason is recorded in `synth/moods.ts` — a genre
   * shipped briefly with an opinionated mood in this slot and generated 98 songs
   * of one style out of 200, with every symptom pointing at the style weights,
   * which were flat and innocent.
   */
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
