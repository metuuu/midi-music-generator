/**
 * Funk moods.
 *
 * Same mechanism as everywhere else — bias, not control — over an axis this
 * repertoire actually has. Iskelmä sorts by degrees of melancholy, jazz by heat,
 * ambient by weather, synth by destination. **This music sorts by how hard the
 * floor is being worked.**
 *
 * Which is not the same as tempo, and the difference is the whole reason these
 * four are not a speed dial. A ballad at 66 and a vamp at 112 can be worked
 * equally hard; what separates them is how much of the bar is being used and how
 * many people are using it. So the axis runs from a five-piece in a room that is
 * too small, through the mid-tempo walk that most of this music actually is, to
 * the slow one that is working just as hard with a tenth of the notes, and out to
 * the version with a horn section, a choir and a spaceship on the sleeve.
 *
 * Two knobs behave in a genre-specific way and are worth naming.
 *
 * **`ornament` is low across the board** and lower than in any other genre here.
 * A grace note is a player deciding something in the moment, and in this idiom
 * the decision was made at rehearsal and is not being revisited — the figure is
 * the point and it comes round exactly the same way. The exception is `slink`,
 * where the tempo is slow enough that there is room to bend into a note without
 * losing the grid.
 *
 * **`restraint` runs the opposite way to density** rather than alongside it,
 * which it does nowhere else. The sparsest arrangement in this repertoire is
 * often the hardest-working one — a Meters side is four people and a hole, and it
 * moves a floor that a nine-piece cannot — so `raw` takes a *positive* restraint
 * with a positive density, which reads as a contradiction and is the correct
 * description of the music.
 */

import type { Mood } from '../../style/types.js';

const moods: Mood[] = [
  {
    id: 'raw',
    label: 'Raw',
    gloss: 'five people, one riff, and a room that is too small for them',
    styleBias: {
      deepfunk: 4.0, vamp: 2.6, jbshuffle: 2.4, swamp: 2.2, memphis: 2.0,
      breakbeat: 2.0, funkrock: 1.6, horns: 1.2,
      disco: 0.3, boogie: 0.3, electro: 0.3, talkbox: 0.4, ballad: 0.3,
    },
    modeBias: { minor: 1.5, major: 0.9 },
    tempo: 0.1,
    // Positive, and so is `restraint` below. See the header — this is the mood
    // where the band is working hardest and playing least.
    density: -0.12,
    ornament: 0.5,
    leap: 0.75,
    restraint: 0.5,
  },
  {
    id: 'strut',
    label: 'Strut',
    gloss: 'the mid-tempo walk, which is most of what this music is',
    styleBias: {
      vamp: 2.4, horns: 2.4, clav: 2.2, pfunk: 2.2, gogo: 2.0, slap: 1.8,
      latin: 1.6, afrofunk: 1.6, boogie: 1.6, memphis: 1.4,
      ballad: 0.3, jazzfunk: 0.8,
    },
    modeBias: { minor: 1.1, major: 1.1 },
    tempo: 0,
    density: 0.08,
    ornament: 0.7,
    leap: 0.9,
    restraint: 0,
  },
  {
    id: 'slink',
    label: 'Slink',
    gloss: 'after midnight, at half the speed and none of the hurry',
    styleBias: {
      ballad: 4.0, memphis: 2.6, swamp: 2.4, minneapolis: 1.8, jazzfunk: 1.6,
      talkbox: 1.4, clav: 1.2,
      jbshuffle: 0.3, breakbeat: 0.3, disco: 0.3, deepfunk: 0.5, electro: 0.6,
    },
    modeBias: { minor: 1.4, major: 1.0 },
    tempo: -0.65,
    density: -0.15,
    // The one mood here that decorates. At 66 BPM a sixteenth is long enough to
    // bend into, which at 116 it is not.
    ornament: 1.25,
    leap: 1.1,
    restraint: 0.55,
  },
  {
    id: 'cosmic',
    label: 'Cosmic',
    gloss: 'the long one, with the horn section and the spaceship on the sleeve',
    styleBias: {
      pfunk: 3.6, jazzfunk: 2.6, afrofunk: 2.2, horns: 2.0, talkbox: 2.0,
      electro: 1.8, disco: 1.6, minneapolis: 1.4,
      deepfunk: 0.4, memphis: 0.4, jbshuffle: 0.4,
    },
    // Even, and deliberately so. A P-Funk side in minor is not sad — the pulse
    // is carrying the affect and the mode is only painting it.
    modeBias: { minor: 1.1, major: 1.2 },
    tempo: -0.1,
    // The fullest arrangement in the genre. This is the mood with nine people
    // and a choir on it, and it is the only one where everybody plays at once.
    density: 0.3,
    ornament: 0.85,
    leap: 1.15,
    restraint: -0.4,
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
