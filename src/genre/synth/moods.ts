/**
 * Vintage electronic moods.
 *
 * Same mechanism as everywhere else — bias, not control — over the axis this
 * repertoire actually uses. Iskelmä sorts by degrees of melancholy, jazz by
 * heat, ambient by weather and light. **This music sorts by destination.**
 *
 * That is not a metaphor reached for after the fact; it is the only vocabulary
 * the sleeves have ever had. The records are named after roads, cities,
 * planets, weather systems and the machines that take you to them, the covers
 * are photographs of somewhere you are not, and the standard review sentence
 * for forty years has been some version of "it sounds like being somewhere".
 * Ask a listener what a piece of this is *about* and the answer is a place; ask
 * what it *feels* like and the answer is still a place. So the four moods below
 * are four destinations, ordered outward from the room the record is playing
 * in: the street outside, the country beyond it, the city at scale, and off the
 * planet altogether.
 *
 * The ordering is load-bearing in one small way. The demo UI defaults to the
 * last mood a genre defines, and `cosmos` is the right default here — it is the
 * broadest of the four and the one nobody would be surprised to hear.
 *
 * Two knobs behave in a genre-specific way and are worth naming. **`leap` runs
 * opposite to tempo**, which it does nowhere else: the fast moods here are
 * sequencer moods, and a sequencer line is stepwise because sixteen adjacent
 * knobs get set to adjacent voltages. The slow moods are the ones that leap,
 * because a wide interval played slowly is how this music says "distance".
 * **`ornament` is low almost everywhere**, because there is no player. A grace
 * note is a hand deciding something in the moment, and half of this repertoire
 * is a machine executing a decision made an hour earlier.
 */

import type { Mood } from '../../style/types.js';

const moods: Mood[] = [
  {
    id: 'dread',
    label: 'Dread',
    gloss: 'the street outside, after midnight — a small ostinato and something behind it',
    // `optical` is barely here. A bright arpeggio in a major key is the one
    // thing in the genre this mood cannot use, and the style leans major.
    styleBias: {
      stalker: 4.0, darksynth: 3.4, cinematic: 1.3, berlin: 1.1, outrun: 1.0,
      machine: 0.7, boulevard: 0.4, optical: 0.4, cosmic: 0.2,
    },
    // The hardest mode bias in the genre. A horror ostinato in major is a
    // nursery rhyme, and the difference between the two is one note.
    modeBias: { minor: 3.0, major: 0.2 },
    // Not slow — a stalking figure moves at walking pace, which is roughly a
    // hundred to the minute. Slowing it further turns menace into elegy.
    tempo: -0.25,
    density: -0.2,
    // Nothing decorates. The whole effect depends on the figure being exactly
    // the same every time it comes round, so that the once it is not is
    // audible from the back of the cinema.
    ornament: 0.4,
    leap: 0.8,
    restraint: 0.7,
  },
  {
    id: 'motorway',
    label: 'Motorway',
    gloss: 'forward at a constant speed, all night — sequencer, headlights, no destination yet',
    /**
     * `outrun` is at the top of this table and belongs there more literally
     * than anything else in it. The older styles are *about* motion — a
     * sequence that does not stop is a road by analogy — and that style is a
     * genre whose records are named after cars, whose sleeves are a windscreen
     * at night, and whose entire proposition is the second half of this mood's
     * gloss: headlights, no destination yet.
     */
    styleBias: {
      outrun: 3.8, berlin: 3.2, machine: 2.6, optical: 2.0, darksynth: 1.8,
      cosmic: 1.4, boulevard: 1.2, cinematic: 0.8, stalker: 0.5,
    },
    modeBias: { minor: 1.4, major: 1.0 },
    tempo: 0.35,
    density: 0.1,
    ornament: 0.7,
    // The lowest leap in the genre. A driving sequence moves by step because
    // the hardware that plays it moves by step, and the hypnosis is entirely a
    // function of nothing surprising happening.
    leap: 0.6,
    restraint: -0.1,
  },
  {
    id: 'neon',
    label: 'Neon',
    gloss: 'the city, arrived at and lit up — four on the floor and everything on top',
    // The mood's second home. A city lit up at night is a digital record, and
    // `optical` is the only style here whose instrument was invented for it.
    styleBias: {
      cosmic: 3.6, boulevard: 3.4, optical: 2.8, outrun: 2.4, machine: 2.2,
      darksynth: 1.6, cinematic: 1.2, stalker: 0.6, berlin: 0.5,
    },
    // Even, and deliberately so. This is the one mood where minor is not sad —
    // a euphoric sequencer record in A minor is still euphoric, because the
    // pulse is carrying the affect and the mode is only colouring it.
    modeBias: { minor: 1.2, major: 1.2 },
    tempo: 0.7,
    density: 0.25,
    // The one mood that decorates. Once there is a four-on-the-floor holding
    // the form together, the top line is free to answer itself.
    ornament: 1.2,
    leap: 1.05,
    restraint: -0.35,
  },
  {
    id: 'cosmos',
    label: 'Cosmos',
    gloss: 'off the planet — slow, wide intervals, major and unafraid',
    /**
     * The three revival styles are all under 1 here, which is the only mood
     * where that happens to them. This music looks at a city and at a road; it
     * does not look up. A night-drive record with a choir over it is a
     * `cinematic` record, and it is available under that name.
     */
    styleBias: {
      cinematic: 3.0, berlin: 2.6, optical: 1.5, cosmic: 1.2, boulevard: 0.8,
      outrun: 0.7, machine: 0.5, stalker: 0.4, darksynth: 0.3,
    },
    // Major-leaning, which is the whole difference between this and `dread`.
    // Space in this repertoire is awe rather than horror: the camera pulls back
    // and the choir comes in, and that gesture does not work in minor.
    modeBias: { minor: 1.0, major: 1.5 },
    tempo: -0.4,
    density: -0.05,
    ornament: 0.9,
    // The widest intervals here. A slow octave leap is the cheapest and oldest
    // way music has of meaning "a long way", and this mood is made of it.
    leap: 1.2,
    restraint: 0.45,
  },
  /**
   * No bias — the full spread of the era.
   *
   * **Last on purpose, and it has to be last.** An unspecified mood does not
   * draw at random: `generateSong` passes the final entry of this table as the
   * fallback, so whichever mood is written here is what every song gets unless
   * someone asks for another by name. Every genre in the project ends its table
   * with a neutral entry for exactly this reason.
   *
   * This genre did not, briefly, and the result is worth recording because
   * nothing failed. `cosmos` was last, so every unspecified synth song was a
   * cosmos song — and cosmos biases `cinematic` 3.0 and `stalker` 0.4. Measured
   * over 200 songs the genre generated 98 cinematic and 6 stalker, which reads
   * as a badly weighted style table rather than as a mood that never varied. The
   * era weights were flat all along; a mood table with no neutral in it was
   * doing all of the damage from one position.
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
