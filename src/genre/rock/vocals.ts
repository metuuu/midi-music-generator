/**
 * How this music sings.
 *
 * The unit is **one person, at the top of their range, being amplified less than
 * the guitars are.** That is the whole design brief and it is unlike every other
 * singer in this project. A tanssilava vocalist is the loudest thing in the
 * arrangement and a reggae trio sits inside the riddim; a rock singer is neither
 * — they are the loudest *voice* and they are still competing with two
 * amplifiers, which is why the technique is what it is. Strained rather than
 * projected, at the very top of the comfortable range, with the pitch reached
 * from below almost every time because a note approached from underneath cuts
 * through a guitar chord and a note started dead centre does not.
 *
 * `gm: 54` is Voice Oohs rather than 52's Choir Aahs, and the difference is the
 * headcount. Reggae picks the choir patch honestly, because the unit there
 * genuinely is three people; here it is one, and a choir patch would stage a
 * backing group that the arena era has and the other three do not.
 *
 * ## The words are `scat`, and the reason is not the jazz association
 *
 * Four invented languages **used to** exist in `style/vocals.ts` and none of them
 * was English. There are six — `sargam` and `tarana` came with the Indian genre
 * after this was written — and both fail here for a sharper version of the reason
 * `machine` does two paragraphs down: `tarana` is at `codaDensity: 0.85` where
 * `machine`'s 0.55 was already too closed, and `sargam` is at 0 with its syllables
 * pinned to scale degrees. The count was wrong; the answer was not.
 *
 * Choosing on their names would give nothing usable and reject `scat`
 * for being a jazz technique; choosing on their *shapes* — which is what the
 * renderer consumes — gives it immediately:
 *
 *  - **No vowel harmony**, which rules out `finnish` outright.
 *  - **Short words**, one to three syllables, against `finnish`'s two to four.
 *    A rock line is one syllable per note and the notes are short.
 *  - **Hard onsets on `d`, `b`, `t`**, at 98% density. A rock syllable has to
 *    *start* — the consonant is what places the note against a guitar that is
 *    already sounding, and `airy`, which has nasals and liquids and no stops at
 *    all, would produce a line with nothing landing anywhere.
 *  - **`codaDensity: 0.4`**, so three fifths of the closed syllables go
 *    unclosed, which is a shouted vowel held past where the spelling ends it.
 *    That is exactly what a rock vocal does with a long note.
 *
 * `machine` was the near miss and it fails on one number: `codaDensity: 0.55`
 * and a fourteen-consonant inventory make every syllable a closed one, which is
 * a talker rather than a singer. The consonant weights below lean the draw back
 * toward the stops and the sibilants and away from the aspirate, which is the
 * available correction without writing a seventh language into a file this genre
 * does not own — a fifth when this was written, and the number is the only part
 * that aged.
 *
 * ## And the delivery is `sung`
 *
 * `syllabic` would put a gap after every syllable, which is what the engine used
 * to do everywhere and reads as blipping; `ballad` halves the rate and doubles
 * the melisma, which is a crooner. A rock line is joined inside the word and
 * broken between words, at roughly two thirds of a beat a syllable — a shade
 * quicker than reggae's, because the note values are shorter and there is no
 * hole in the bar to place things against.
 */

import { WORD_STYLES, type VocalProfile } from '../../style/vocals.js';

export const VOCALS: VocalProfile = {
  name: 'voice',
  // 54 — Voice Oohs. One person, for the MIDI render. See above.
  gm: 54,
  /**
   * A saw rather than a square, and it is the one place this profile disagrees
   * with both iskelmä's and reggae's reasoning.
   *
   * Both of those pick a square for headroom: the same spectral slope for about
   * 5 dB more average level at the same peak. That argument is correct and it is
   * an argument for a voice that has to *fit under* something. This one has to
   * cut through, and a saw's odd and even harmonics together give a brighter,
   * ruder source that survives being mixed against two distorted guitars — which
   * is the actual problem here, and it is worth the headroom.
   */
  strudel: 'sawtooth',
  /**
   * Level with the melody layer and above nothing else.
   *
   * 0.9 against the melody's own 0.9, which is deliberate: in this genre the
   * melody layer is frequently the *guitar playing the vocal line*, and those
   * two parts are the same part twice. Putting the singer above it would make
   * the doubling audible as a flam; putting them below it, as reggae does, would
   * be describing a mix nobody has ever made of a rock record.
   */
  gain: 0.9,
  /**
   * Open and front, with the long `aa` weighted highest of any genre here.
   *
   * A shouted note is an open note — the tract is as unobstructed as it gets and
   * the jaw is down — so the vowel inventory leans hard on `a` and `aa` and
   * gives the closed ones very little. `ae` is at 2.5 because the flattened
   * front vowel is most of what makes a sung line read as English rather than as
   * Italian, and it is the single most characteristic vowel of an English or
   * American rock singer.
   */
  vowels: [
    ['a', 5], ['aa', 4], ['e', 3], ['o', 3], ['ae', 2.5], ['i', 2], ['u', 1.5],
  ],
  /**
   * Stops first, sibilants second, and the aspirate genuinely present.
   *
   * The one table here that disagrees with reggae's on a specific point:
   * `fricative-h` is at 2 rather than 0.6, because h-dropping is a Jamaican
   * feature and an *aspirated* onset is a rock feature — a shouted syllable
   * beginning on breath is a real and much-used attack, and it is what the top
   * of a phrase sounds like when the singer is already at the limit.
   *
   * `none` is low at 1.5. A syllable with no onset has nothing placing it, and a
   * line of them would float; the whole point of the consonant here is that it
   * is percussive.
   */
  consonants: [
    ['stop', 5], ['stop-k', 3.5], ['stop-p', 3.5], ['fricative', 3],
    ['liquid-r', 3], ['nasal', 2.5], ['fricative-sh', 2.2], ['liquid', 2],
    ['fricative-h', 2], ['nasal-m', 2], ['glide', 1.8], ['fricative-f', 1.5],
    ['none', 1.5],
  ],
  words: WORD_STYLES.scat!,
  /**
   * A tenor, and the gloss on the signature — "the voice that carries over a
   * band" — is the job description with nothing left over.
   *
   * It is also the honest average of the repertoire. Rock leads run high: the
   * blues shouters, the falsetto end of the hard rock decade, the strained
   * mid-range of the alternative one. A baritone lead exists and is rare enough
   * that weighting for it would be describing a different genre.
   */
  signature: 'tenor',
  delivery: 'sung',
  /**
   * D above middle C, which is high enough to be uncomfortable and is meant to
   * be. A rock vocal sits in the top third of the singer's range for the whole
   * song and the strain is not incidental — it is what the listener hears as
   * effort, and a comfortable rock vocal reads as a demo.
   */
  centre: 62,
  // E2 to A5. Wider than reggae's at both ends: the bottom because a verse
  // frequently starts an octave below the chorus, and the top because the
  // falsetto shriek is a real part of the vocabulary rather than a stunt.
  range: [52, 81],
  spread: 0.35,
  voice: {
    bodyGain: 0.18,
    bodyLpf: 5800,
    /**
     * The hardest consonants in the project, and the reason is arithmetic about
     * masking rather than taste.
     *
     * A distorted guitar chord is a broad, continuous, dense spectrum with no
     * gaps in it. The only cue a voice has that survives that is a *transient* —
     * something with a fast enough attack to be heard before the ear's masking
     * settles, which is about 5 ms. 0.9 is where the burst is loud enough to
     * do that. Reggae's own note warns that above 0.85 a line turns into a
     * percussion part; here that is not a hazard, it is the requirement.
     */
    burstGain: 0.9,
    /**
     * Two thirds of a beat, sounding for two of its three quarter-beat slots.
     *
     * Both numbers are chosen against the Strudel renderer's sixteenth grid,
     * where beats round to quarter-beats: 0.66 rounds to three slots and 0.5
     * to two, so one slot in three is silence and the re-attack survives
     * quantisation. Push the blip above about 0.55 and the gap rounds away
     * entirely, at which point the line stops being a series of struck syllables
     * and becomes a held pad — which is precisely the failure a genre this loud
     * cannot afford, because the struck syllable is the only thing getting
     * through the guitars.
     */
    syllableBeats: 0.66,
    blipBeats: 0.5,
    // Ten milliseconds to full volume. Faster than any other voice here: a
    // shouted note does not swell, it arrives.
    attack: 0.01,
    decay: 0.08,
    sustain: 0.92,
    release: 0.06,
    /**
     * The most breath noise in the project at 0.12.
     *
     * This is the rasp, and it is not an effect on top of the voice — a singer
     * at the top of their range with the folds pressed together is producing
     * genuine turbulence, and that turbulence is what separates a rock lead from
     * a well-produced pop one singing the same notes.
     */
    noise: 0.12,
    /**
     * Slow and wide. A rock vibrato is a late one — the note is held straight
     * and then shaken, which the renderer approximates with rate and depth
     * alone — and 5.0 Hz at 0.2 is a singer leaning on a note rather than a
     * trained one spinning it.
     */
    vibRate: 5,
    vibDepth: 0.2,
    /**
     * A full scoop, and the longest in the project at 90 ms.
     *
     * Approaching every note from underneath is the technique, not a mannerism:
     * a pitch that arrives from below is audibly *arriving*, and against a
     * sustained guitar chord that is the difference between a vocal that is
     * present and one that is somewhere in the mix. The extra 30 ms over
     * reggae's is what makes it read as a bend rather than as a portamento.
     */
    scoop: 1.0,
    scoopTime: 0.09,
  },
};
