/**
 * How this music sings.
 *
 * The unit is **one voice with a second one a third above it**, and that pair is
 * the fact to build the profile around. The Delmores, the Blue Sky Boys, the
 * Louvins, the Everlys, Porter and Dolly, and every bluegrass chorus ever sung:
 * a lead, and a tenor who does not deviate from the third for the length of the
 * song. `gm: 53` — Voice Oohs — is the honest one-line description for the MIDI
 * render, and it is the *lighter* of the two choir programmes on purpose: this is
 * two people, not a choir, and Choir Aahs describes eight.
 *
 * ## The words are `machine`, and the name is the wrong thing to read
 *
 * Six invented languages exist in `style/vocals.ts`. Choosing between them on
 * their names would give `machine` a wide berth and reach for `scat`; choosing
 * on their *shapes* gives the opposite answer, and the shape is what the renderer
 * actually consumes. Four properties decide it and three of them point the same
 * way:
 *
 *  - **It is rhotic where the alternatives are not.** `r` appears in `machine`'s
 *    onsets and, unusually, in its **codas** — only `finnish` and `tarana` also
 *    close a syllable on one, and neither is a candidate here. A southern American
 *    accent pronounces every /r/ it is given and holds the ones at the ends of
 *    words longest of all; "heart", "before", "more" are three of the commonest
 *    rhymes in the repertoire and all three end on one. `scat` has no `r`
 *    anywhere, in onset or coda, which rules it out on its own.
 *  - **The syllables close.** `codaChance: 0.5`, the highest in the table, and
 *    `codaDensity: 0.55`, behind only `tarana`'s 0.85 — and a tarana is a drum
 *    syllable, so its codas are drum strokes rather than consonants closing a
 *    word. This is the exact opposite of the Jamaican profile next
 *    door, which drops three fifths of its codas, and the contrast is real: a
 *    country line is sung with the consonants intact because the words are the
 *    point and somebody in the room is following the story.
 *  - **Short words.** One and two syllables mostly, which is what a line of this
 *    verse is made of.
 *
 * The one thing it gets wrong is `longChance: 0.2`, the lowest in the table apart
 * from `tarana`'s 0.08, where
 * this repertoire drawls harder than anything else in the project. That is
 * recovered in the vowel weights below rather than in the word style — `aa` and
 * `ae` between them are a fifth of the draw, so the long vowels arrive from the
 * inventory instead of from the spelling. It is the available fix; the alternative
 * was a seventh language in a file this genre does not own.
 *
 * ## And the delivery is `sung`, not `ballad`
 *
 * Iskelmä phrases one line to a breath and holds the ends of them, which is what
 * `ballad` is for. This does not. A country vocal is **syllabic to a degree
 * nothing else here is**: one note per syllable, the tune following the natural
 * stress of the sentence, and melisma reserved for the last word of the chorus and
 * for nowhere else. `sung` puts the syllables at a beat each with `melisma: 0.28`,
 * which is close enough that overriding it would be inventing precision.
 *
 * What the profile does push hard is the `scoop`. A country singer arrives at a
 * note from underneath, audibly and on purpose, and it is the single strongest cue
 * that the voice is this one rather than a trained one — a conservatory tenor
 * hits the pitch and this voice slides onto it.
 */

import { WORD_STYLES, type VocalProfile } from '../../style/vocals.js';

export const VOCALS: VocalProfile = {
  name: 'voice',
  // 53 — Voice Oohs. Two people in thirds, not a choir. See above.
  gm: 53,
  /**
   * A sawtooth, and it is the one place this profile disagrees with the two
   * genres either side of it.
   *
   * Iskelmä and reggae both choose a square for headroom, which is the right call
   * where the voice has to fit under a very loud bass or a wall of brass. Here the
   * voice is the loudest thing on the record by design and has all the headroom it
   * wants, so the choice is made on spectrum instead: a saw has every harmonic
   * where a square has only the odd ones, and the even harmonics are most of what
   * a nasal voice is. This one is nasal on purpose.
   */
  strudel: 'sawtooth',
  /**
   * The loudest voice in the project, and it should be.
   *
   * 0.97 against iskelmä's 0.95 and reggae's 0.82. A country record is a *song*
   * in the most literal sense available — the arrangement exists to deliver a
   * sentence, the title is that sentence, and every production decision from 1927
   * to 1990 was made in service of the words being audible. The mix in `index.ts`
   * pushes the melody layer with it, because in three quarters of these
   * arrangements the melody layer is the singer's line played by something else.
   */
  gain: 0.97,
  /**
   * Open, low and long, with a diphthong on the front of it.
   *
   * `a` and `aa` carry more than a third of the draw between them, and that is the
   * drawl: the vowel in "time" and "night" and "my" is a long open /a/ in this
   * accent where standard English has a diphthong, and it is the most immediately
   * placeable sound in the whole repertoire. `ae` is the other one — the flat
   * front vowel in "hand" and "man", which this accent raises and holds. No
   * front-rounded vowels at all, for the same reason reggae has none: there is no
   * `ö` in this mouth.
   */
  vowels: [
    ['a', 5], ['aa', 4], ['ae', 3], ['o', 3], ['e', 2.5], ['i', 2.5], ['u', 1.5],
  ],
  /**
   * Liquids at the top, and that is the whole table's argument.
   *
   * `liquid-r` at 4.5 is the highest weight given to that consonant anywhere in
   * the project, against reggae's and iskelmä's 2.5 apiece. Everything else
   * follows the plain English inventory: stops and nasals do most of the work,
   * `fricative-h` stays at a real weight because this accent aspirates where the
   * Jamaican one drops, and `none` is low because a country line opens nearly
   * every syllable on something.
   */
  consonants: [
    ['stop', 5], ['liquid-r', 4.5], ['nasal', 4], ['liquid', 3.5],
    ['fricative', 3], ['nasal-m', 3], ['stop-k', 2.5], ['stop-p', 2.5],
    ['glide', 2], ['fricative-h', 2], ['fricative-sh', 1.2],
    ['fricative-f', 1.2], ['none', 1],
  ],
  words: WORD_STYLES.machine!,
  /**
   * A tenor, and it is the genre's own word for it.
   *
   * "The high lonesome sound" is a phrase this music uses about itself and it is a
   * technical description: Bill Monroe sang in B and B♭ so that the tune sat at
   * the very top of his voice, and Hank Williams did the same thing in E and F.
   * The strain is the expression — a country lead is *supposed* to sound like
   * somebody reaching, and a comfortable baritone singing the same notes an octave
   * down is a different and much duller record. It is also the honest average of
   * the repertoire's leads, which run high far more often than they run low.
   */
  signature: 'tenor',
  delivery: 'sung',
  // Middle C and a shade above, which is high for a male lead and is the point.
  centre: 61,
  // C3 to E5. The top of that is where the high lonesome actually lives and it is
  // a note most of these singers could only just reach, which is why it is there.
  range: [48, 76],
  spread: 0.28,
  voice: {
    bodyGain: 0.18,
    /**
     * Bright, and brighter than anything else here.
     *
     * 6200 Hz against reggae's 5200. A country voice is nasal and forward — the
     * soft palate stays low and a great deal of the sound comes out through the
     * nose — and what that does spectrally is put energy in the 2–4 kHz band and
     * keep it there. Rolling it off would produce a warm voice, which is the one
     * thing this is not.
     */
    bodyLpf: 6200,
    // High. The consonants are carrying the words and the words are the record.
    burstGain: 0.82,
    /**
     * A syllable a beat, sounding for three quarters of it.
     *
     * Slower than reggae's 0.75 and faster than a crooner's, and it is the
     * syllabic setting: one note, one syllable, one word of the sentence. Both
     * numbers are chosen against the Strudel renderer's sixteenth grid, where
     * beats round to quarter-beats — 1.0 is four slots and 0.78 rounds to three,
     * so one slot in four is silence and the re-attack survives quantisation.
     */
    syllableBeats: 1,
    blipBeats: 0.78,
    attack: 0.02,
    decay: 0.1,
    sustain: 0.9,
    release: 0.08,
    // More than any other voice here. A country tenor at the top of the range is
    // audibly working, and the breath in the tone is a large part of why anybody
    // believes the song.
    noise: 0.1,
    // Slow and wide, and it arrives late — this is a singer's vibrato rather than
    // a violinist's, and on a held final note it is the whole of the ornament.
    vibRate: 5,
    vibDepth: 0.22,
    /**
     * A full scoop, and a long one.
     *
     * 0.09 seconds against reggae's 0.06 and iskelmä's 0.07; only arabic and
     * indian hold it longer, at 0.18, and both of those are an ornament rather
     * than an accent. The slide up onto the
     * pitch is not an artefact of this voice, it is the accent — a country singer
     * reaches a note from a semitone or two underneath and the ear reads the
     * approach as sincerity. It is the single most identifiable thing about the
     * delivery and the cheapest to get wrong by tidying up.
     */
    scoop: 1.0,
    scoopTime: 0.09,
  },
};
