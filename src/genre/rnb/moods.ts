/**
 * R&B moods.
 *
 * Bias, not control, over an axis this repertoire actually has. Iskelmä sorts by
 * degrees of melancholy, jazz by heat, ambient by weather, synth by destination,
 * funk by how hard the floor is being worked. **This music sorts by what the
 * singer wants and how loudly they are prepared to ask for it.**
 *
 * That is not a tempo dial and it is not a volume one either, which is why it
 * needed four names rather than a slider. A gospel-soul shout at 132 and a deep
 * ballad at 58 are both people asking for something at the top of their lungs;
 * what separates them is who else is in the room. So the axis runs from the revue
 * — a hall, a horn section and a congregation being worked — through the arranged
 * one that is aimed at a car radio and smiling at it, to the slow one that is
 * genuinely in trouble, and out to the one sung to a single person after midnight
 * with the door shut.
 *
 * Three knobs behave in a genre-specific way and are worth naming, because two of
 * them run the opposite direction from the neighbouring genre's.
 *
 * **`ornament` is high across the board** and it is the highest set of numbers in
 * the project. Funk's file says its ornament is low everywhere because a grace
 * note is a player deciding something in the moment and in that idiom the
 * decision was made at rehearsal; here the decision is made *while the note is
 * sounding*, by the one person in the band nobody arranged. A melisma is not a
 * decoration on this music, it is the part of it that is being listened to. The
 * one place it comes down is `sweet`, and the reason is the mirror of funk's:
 * that mood is the one where the line was written by an arranger who was paid for
 * it, and a singer improving on it is a singer being sent home.
 *
 * **`leap` runs with `ornament` rather than against it**, which it does nowhere
 * else. Everywhere in this project a calm mood moves by step and an excited one
 * leaps; here the calm moods leap *further*, because the octave jump into a held
 * note is what a slow soul vocal is made of and a busy one has no room for it.
 *
 * **`restraint` is highest where density is lowest and they agree**, which reads
 * as redundant beside funk's deliberately contradictory pair and is the honest
 * description. In that music the sparse arrangement is the hardest-working one;
 * here a sparse arrangement is a record with the band told to get out of the way,
 * and the two knobs are saying the same thing on purpose.
 */

import type { Mood } from '../../style/types.js';

const moods: Mood[] = [
  {
    id: 'shout',
    label: 'Shout',
    gloss: 'a hall, a horn section and a congregation being worked',
    styleBias: {
      gospelsoul: 3.6, stomper: 3.0, stax: 2.6, motown: 2.2, girlgroup: 2.0,
      funksoul: 2.0, southern: 1.8, discosoul: 1.6, newjack: 1.6, blueeyed: 1.4,
      quietstorm: 0.25, slowjam: 0.25, bedroom: 0.3, offgrid: 0.4, ballad: 0.3,
    },
    // Major, and it is the church rather than the cheer. A shout chorus in this
    // repertoire is built on a plagal cadence and a plagal cadence is a major
    // gesture; the minor half of the genre is the half that is sitting down.
    modeBias: { minor: 0.75, major: 1.4 },
    tempo: 0.6,
    density: 0.22,
    // High, and this is the *low* end of this genre's range. See the header.
    ornament: 1.15,
    leap: 0.9,
    restraint: -0.35,
  },
  {
    id: 'sweet',
    label: 'Sweet',
    gloss: 'the arranged one, aimed at a car radio and smiling at it',
    styleBias: {
      philly: 3.4, chicago: 2.8, crossover: 2.6, motown: 2.2, discosoul: 2.0,
      doowop: 1.8, ballad: 1.6, contemporary: 1.6, girlgroup: 1.4, synthsoul: 1.4,
      deepsoul: 0.4, offgrid: 0.4, bedroom: 0.4, stax: 0.6,
    },
    modeBias: { minor: 0.9, major: 1.3 },
    tempo: 0.15,
    // The fullest arrangement in the genre. Eighteen violins, a harp, four horns
    // and a vibraphone, and every one of them written down beforehand.
    density: 0.3,
    /**
     * The one mood here below 1.0, and the reason is the mirror of funk's.
     * The line in this mood was written by an arranger who was paid for it and
     * whose name is on the label, and a singer improving on it is a singer being
     * replaced. Everywhere else in this genre the decoration is the record.
     */
    ornament: 0.8,
    leap: 0.95,
    restraint: -0.3,
  },
  {
    id: 'ache',
    label: 'Ache',
    gloss: 'the slow one that is not seductive, and is genuinely in trouble',
    styleBias: {
      deepsoul: 3.8, southern: 3.0, ballad: 2.6, gospelsoul: 2.0, stax: 1.8,
      doowop: 1.6, neosoul: 1.4, hiphopsoul: 1.2, blueeyed: 1.2,
      discosoul: 0.25, stomper: 0.25, newjack: 0.3, motown: 0.5, girlgroup: 0.4,
    },
    modeBias: { minor: 1.35, major: 1.05 },
    tempo: -0.7,
    density: -0.1,
    /**
     * The highest number in the project, by a distance, and it is not a taste in
     * ornamentation. At fifty-eight dotted quarters a minute one beat is a
     * second long — `deepsoul`'s `bpm` field says 78–105 because it counts
     * quarters and that style is in 12/8 — and what a deep-soul singer does with
     * a second is the entire performance:
     * every note is approached from below, bent through, and left by a different
     * route than it arrived. A generator that sang this mood plainly would be
     * generating the sheet music rather than the record.
     */
    ornament: 1.6,
    // See the header. The slow moods leap furthest here, because the octave into
    // a held note is what this vocal is made of.
    leap: 1.25,
    restraint: 0.3,
  },
  {
    id: 'smoulder',
    label: 'Smoulder',
    gloss: 'after midnight, one person, and the door shut',
    styleBias: {
      quietstorm: 3.8, slowjam: 3.4, neosoul: 2.6, bedroom: 2.4, offgrid: 2.2,
      contemporary: 1.8, crossover: 1.6, hiphopsoul: 1.4, synthsoul: 1.2,
      stomper: 0.2, gospelsoul: 0.3, girlgroup: 0.3, motown: 0.4, stax: 0.5,
    },
    // Nearly even, and the minor edge is small on purpose. A quiet-storm side in
    // major is not cheerful — the extensions are carrying the affect and the mode
    // is barely involved, which is the same sentence a P-Funk table makes for a
    // completely different reason.
    modeBias: { minor: 1.2, major: 1.05 },
    tempo: -0.55,
    // The sparsest in the genre, and `restraint` agrees with it rather than
    // contradicting it. See the header.
    density: -0.22,
    ornament: 1.4,
    leap: 1.15,
    restraint: 0.6,
  },
  /**
   * No bias — the full spread of the era.
   *
   * **Last on purpose, and it has to be last.** An unspecified mood does not draw
   * at random: `generateSong` passes the final entry of this table as the
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
