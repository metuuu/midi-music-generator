/**
 * Hiphop moods.
 *
 * Bias rather than control, as everywhere else, over the axis this repertoire
 * actually has. Iskelmä sorts by degrees of melancholy, jazz by heat, ambient by
 * weather, synth by destination and funk by how hard the floor is being worked.
 * **This music sorts by what the record is playing out of** — a crate, a stolen
 * stereo, a car with the seats out, or a pair of headphones at two in the
 * morning — which is not a mood in the usual sense and is the only axis the
 * sleeve notes of this genre have ever used either.
 *
 * It is worth being clear that this is not four settings of a loudness knob.
 * `hard` and `trunk` are both loud and they are loud in different octaves;
 * `dusty` and `hazy` are both slow and one of them is a jazz record and the
 * other is a cough syrup. What separates them is *where the weight of the
 * arrangement sits*, and the four moods below move `density` by less than a
 * fifth between them while moving the style weights by a factor of ten.
 *
 * Three knobs behave in a genre-specific way and are worth naming.
 *
 * **`ornament` is the lowest set in the project.** A grace note is a player
 * deciding something in the moment; here the decision was made at a keyboard,
 * saved, and triggered four hundred times without being revisited. The one
 * exception is `hazy`, where the tempo is slow enough that a note has room to
 * bend inside its own length — which is the same argument funk's `slink` makes
 * at almost the same tempo.
 *
 * **`leap` runs opposite to density rather than alongside it.** The fullest
 * arrangements here are the sampled ones, and a sampled hook moves by step
 * because it was a phrase before it was a hook. The emptiest is `trunk`, whose
 * melodic content is three notes an octave apart from each other.
 *
 * **`restraint` is positive in three of the four.** It is negative almost
 * everywhere else in the project, because elsewhere a mood asking for restraint
 * is asking for a quieter version of the music. Here the sparse arrangement is
 * not the quiet one, it is the *expensive* one — see `modern` in `eras.ts`,
 * whose density of 0.44 is the lowest outside ambient and is what the records
 * with the largest budgets sound like.
 */

import type { Mood } from '../../style/types.js';

const moods: Mood[] = [
  {
    id: 'dusty',
    label: 'Dusty',
    gloss: 'somebody else\'s record, twelve bits deep, with the hiss left in',
    styleBias: {
      boombap: 4.0, jazzrap: 3.4, lofi: 3.2, soulloop: 3.0, breaks: 2.4,
      hornloop: 2.0, abstract: 2.0, conscious: 1.8, oldschool: 1.4,
      trap: 0.3, drill: 0.3, crunk: 0.3, miami: 0.4, clubrap: 0.4, electrorap: 0.5,
    },
    modeBias: { minor: 1.3, major: 1.0 },
    tempo: -0.3,
    density: 0.05,
    // Highest here and still low. What moves in this mood is a sampled phrase,
    // and a sampled phrase already has whatever ornament its player put in it.
    ornament: 0.9,
    leap: 0.8,
    restraint: 0.15,
  },
  {
    id: 'hard',
    label: 'Hard',
    gloss: 'the loop with the top rolled off and nothing forgiving in it',
    styleBias: {
      hardcore: 4.0, drill: 3.0, phonk: 2.8, hornloop: 2.4, breaks: 2.2,
      boombap: 2.0, trap: 1.8, crunk: 1.6, minimal: 1.4,
      clubrap: 0.2, party: 0.3, soulloop: 0.3, cloud: 0.3, lofi: 0.4, jazzrap: 0.5,
    },
    // The most lopsided mode bias in the project. Everything this mood is about
    // stops working in a major key — see `hardcore` in `styles.ts`, which is
    // 0.92 minor on its own before any mood touches it.
    modeBias: { minor: 1.8, major: 0.5 },
    tempo: 0.15,
    density: -0.05,
    ornament: 0.5,
    leap: 0.8,
    restraint: 0.35,
  },
  {
    id: 'trunk',
    label: 'Trunk',
    gloss: 'mixed for a car with the seats out, and audible from the next street',
    styleBias: {
      dirtysouth: 3.6, crunk: 3.2, miami: 3.0, trap: 2.6, bounce: 2.4,
      phonk: 2.0, chopped: 1.8, gfunk: 1.6, clubrap: 1.4,
      jazzrap: 0.3, lofi: 0.3, cloud: 0.3, abstract: 0.4, conscious: 0.5,
    },
    modeBias: { minor: 1.3, major: 1.0 },
    tempo: 0.1,
    // The emptiest arrangement here and the loudest. Those are the same records.
    density: -0.14,
    ornament: 0.4,
    // Three notes an octave apart from each other. See the header.
    leap: 1.3,
    restraint: 0.45,
  },
  {
    id: 'hazy',
    label: 'Hazy',
    gloss: 'four in the morning, at seventy per cent speed, with everything wet',
    styleBias: {
      cloud: 4.0, chopped: 3.6, lofi: 3.0, minimal: 2.2, abstract: 2.0,
      jazzrap: 1.6, soulloop: 1.4, gfunk: 1.2,
      party: 0.2, miami: 0.2, breaks: 0.3, crunk: 0.3, bounce: 0.3, oldschool: 0.4,
    },
    modeBias: { minor: 1.4, major: 1.0 },
    tempo: -0.7,
    density: -0.1,
    // The one mood here that decorates. At 62 BPM a sixteenth is a quarter of a
    // second, which is long enough to bend into and out of.
    ornament: 1.4,
    leap: 0.75,
    restraint: 0.5,
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
