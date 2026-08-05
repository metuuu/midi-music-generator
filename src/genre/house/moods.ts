/**
 * House and techno moods, sorted by **the hour**.
 *
 * Same mechanism as everywhere else — bias, not control — over an axis nothing
 * else in this project uses, and the axis is the point. Iskelmä sorts by degrees
 * of melancholy, jazz by heat, ambient by weather and light, synth by
 * destination, hip-hop by what the record is doing to you. This music sorts by
 * **what time it is**, because that is the only vocabulary anybody who makes it
 * or plays it has ever used about it.
 *
 * That is not a conceit reached for after the fact. A DJ is handed a slot and the
 * slot is a *time*: the person on at eleven is not playing the same records as
 * the person on at two, and it would be a professional failure if they were. The
 * trade press reviews a record by naming the hour it works at. Producers write
 * *warm-up mix* and *peak time mix* on opposite sides of the same twelve-inch,
 * pressed at the same session from the same parts, and the difference between the
 * two sides is exactly what a `Mood` is in this engine: the same music with the
 * density, the tempo and the restraint moved.
 *
 * Ordered from the front of the night to the end of it, and the ordering is
 * load-bearing in the usual way — the last entry is what an unspecified song
 * gets. See `neutral` at the bottom.
 *
 * ## Two knobs behave in a way particular to this genre
 *
 * **`density` has the widest spread here of any genre in the project**, from
 * −0.3 to +0.3. Everywhere else the arrangement is a setting on the music; here
 * the arrangement *is* the music — a house record is a sequence of things
 * entering and leaving, and how many of them are on at once is the closest single
 * number to "what is this record for". A warm-up record and a peak-time record
 * are frequently the same eight parts with four of them muted.
 *
 * **`ornament` is low everywhere and `leap` is lower**, and both are one fact
 * rather than two. There is no player. A grace note is a hand deciding something
 * in the moment, and every line in this music was drawn on a grid an hour
 * earlier by somebody who then went to bed; a wide interval is a keyboard player
 * reaching, and what is playing these lines has no arm. `dark` is the extreme
 * case at 0.3 ornament, which is as near to *nothing decorates* as this table
 * gets without saying it in a style.
 */

import type { Mood } from '../../style/types.js';

const moods: Mood[] = [
  {
    id: 'warmup',
    label: 'Warm-up',
    gloss: 'eleven at night, a third full — patient, deep, and nobody is dancing yet',
    /**
     * The deep and dubby end at the top, and the loud end near the floor. A
     * warm-up set is not quiet peak time: it is a different repertoire, and the
     * professional error it exists to avoid is playing a record at eleven that
     * has nowhere left to go at one.
     */
    styleBias: {
      deep: 3.4, dubtechno: 3.0, ambienthouse: 2.8, microhouse: 2.2, minimal: 2.0,
      techhouse: 1.6, garage: 1.3, chicago: 1.0, detroit: 1.0, disco: 0.8,
      hardhouse: 0.2, trance: 0.3, hardgroove: 0.3, ghetto: 0.3, speedgarage: 0.4,
    },
    modeBias: { minor: 1.4, major: 1.0 },
    tempo: -0.5,
    density: -0.3,
    ornament: 0.7,
    leap: 0.7,
    // The highest in the table. A warm-up record's whole proposition is that it
    // is holding something back.
    restraint: 0.7,
  },
  {
    id: 'peak',
    label: 'Peak time',
    gloss: 'one in the morning, everybody is in — everything on at once and the kick in front',
    styleBias: {
      hardgroove: 2.6, hardhouse: 2.4, tribal: 2.2, jackin: 2.0, ghetto: 2.0,
      piano: 1.8, disco: 1.8, frenchtouch: 1.7, speedgarage: 1.6, chicago: 1.5,
      progressive: 1.4, techhouse: 1.2, minimal: 0.5, ambienthouse: 0.2,
      microhouse: 0.6, dubtechno: 0.5,
    },
    // Even, and it is the one mood here where minor is not sad. A packed room in
    // A minor is still a packed room: the kick is carrying the affect and the
    // mode is only colouring it.
    modeBias: { minor: 1.2, major: 1.2 },
    tempo: 0.6,
    density: 0.3,
    ornament: 1.0,
    leap: 1.0,
    restraint: -0.4,
  },
  {
    id: 'euphoria',
    label: 'Euphoria',
    gloss: 'the breakdown, and what comes back after it — major chords and both hands up',
    /**
     * The three styles built around the gesture, and they are the three that
     * write `drops: [..., ['breakdown', n]]` most heavily. `trance` at 3.6 is the
     * highest single bias in this file, which is honest rather than generous:
     * that style is *made of* this moment and has very little else to offer.
     */
    styleBias: {
      trance: 3.6, progressive: 2.6, piano: 2.4, garage: 2.0, frenchtouch: 1.8,
      disco: 1.6, ambienthouse: 1.2, speedgarage: 1.2, ukgarage: 1.2,
      acid: 0.6, minimal: 0.3, dubtechno: 0.3, microhouse: 0.4, ghetto: 0.5,
    },
    // The one mood in the genre that leans major, and it is the only place the
    // major tables get a real reading. A hands-in-the-air chord is a major
    // chord; that is nearly the definition of the moment.
    modeBias: { minor: 0.9, major: 2.0 },
    tempo: 0.45,
    density: 0.25,
    // The only mood above 1. Once the room is doing the work, the top line is
    // free to answer itself — and the piano roll that runs down out of a
    // breakdown is the one figure in this genre that is genuinely decorated.
    ornament: 1.3,
    leap: 1.25,
    restraint: -0.25,
  },
  {
    id: 'dark',
    label: 'Dark',
    gloss: 'three in the morning, the lights off — one loop, no tune, and the filter moving',
    styleBias: {
      hardgroove: 3.0, detroit: 2.6, dubtechno: 2.4, acid: 2.2, minimal: 2.2,
      bleep: 2.0, newbeat: 1.8, techhouse: 1.4, chicago: 1.0,
      piano: 0.2, garage: 0.2, disco: 0.3, frenchtouch: 0.3, trance: 0.4,
      ukgarage: 0.4, ambienthouse: 0.6,
    },
    // The hardest mode bias here. A dark techno record in a major key is a
    // different genre, and the difference is one note.
    modeBias: { minor: 3.2, major: 0.2 },
    tempo: 0.3,
    density: -0.1,
    /**
     * The lowest ornament in the project outside ambient, and it is the same
     * argument `synth/moods.ts` makes about `dread` arrived at from a colder
     * direction: the whole effect depends on the figure being *exactly the same*
     * every time it comes round, so that the once it is not is audible from the
     * far end of the room.
     */
    ornament: 0.3,
    leap: 0.6,
    restraint: 0.45,
  },
  /**
   * No bias — the full spread of the era.
   *
   * **Last on purpose, and it has to be last.** An unspecified mood does not draw
   * at random: `generateSong` passes the final entry of this table as the
   * fallback, so whichever mood sits here is what every song gets unless somebody
   * asks for another by name, and `npm run genres` asserts across every genre
   * that this entry is `neutral`. Synth shipped briefly without one, `cosmos`
   * became the default, and 200 songs came out 98 cinematic and 6 stalker with
   * the style weights innocent throughout.
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
