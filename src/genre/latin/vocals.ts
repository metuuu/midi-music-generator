/**
 * How this music sings.
 *
 * Two jobs under one profile, and the tension between them is the thing to get
 * right. The **sonero** improvises against a fixed chorus over a two-bar vamp:
 * short phrases, hard consonants placed against the clave, and a great deal of
 * text delivered quickly. The **bolerista** holds a note at the end of a line
 * and lets the band wait. They are the same singer on two different nights, and
 * a profile that only did one of them would be describing half a genre.
 *
 * The compromise is that the *phonetics* are pitched at the sonero and the
 * *envelope* is pitched at the bolerista, because those are the halves each one
 * actually needs. A held note with the wrong vowels in it is still a held note;
 * a fast line with a slow attack on every syllable is mush.
 *
 * ## The words are `scat`, and again the name is the wrong thing to read
 *
 * Four invented languages exist in `style/vocals.ts` and none of them is
 * Spanish. Choosing on their names would take `finnish` for being a language;
 * choosing on their *shapes* — which is what the renderer consumes — gives the
 * opposite answer:
 *
 *  - **No vowel harmony.** `finnish` is out on that alone: harmony is one rule
 *    and it is most of what makes a Finnish word sound Finnish, and Spanish has
 *    nothing remotely like it.
 *  - **Five vowels, all pure, none reduced.** `scat` declares exactly five
 *    neutral vowels and no front-rounded ones, which is the Spanish inventory
 *    almost by accident. An unstressed vowel in Spanish is the *same* vowel as a
 *    stressed one — there is no schwa anywhere in the language — and that is the
 *    single most audible thing about a Spanish singer's line.
 *  - **Open syllables.** `codaChance: 0.3` and `codaDensity: 0.4` mean most
 *    syllables end on their vowel, which is what Spanish does: the language
 *    closes syllables on about five consonants and does it a minority of the
 *    time.
 *  - **Short words.** `lengths: [1, 1, 2, 2, 3]` is a shade shorter than Spanish
 *    really runs, and it is the one place this table is approximating rather
 *    than agreeing. Two and three syllables would be truer; one is not wrong for
 *    a sonero placing single words against a clave.
 *
 * What `scat` is *not* right about is `onsetDensity: 0.98`, which starts
 * essentially every syllable on a consonant. Spanish opens about a quarter of
 * its syllables on a vowel, and the consonant table below leans the fallback
 * order toward the softer end to recover a little of that — the same compromise
 * reggae's profile records, arrived at from the other side of the Caribbean.
 *
 * ## And the delivery is `sung`
 *
 * Not `ballad`, which phrases one line to a breath and holds the ends: that is
 * iskelmä's crooner and it would flatten the sonero completely. Not `syllabic`
 * either, which would be right for the montuno and wrong for everything before
 * it. `sung` puts the syllables on the notes at a rate the written rhythm
 * decides, which is what lets the same profile deliver a guaracha's word-count
 * and a bolero's held cadence without arguing with either.
 */

import { WORD_STYLES, type VocalProfile } from '../../style/vocals.js';

export const VOCALS: VocalProfile = {
  name: 'voz',
  /**
   * 52 — Choir Aahs — for the MIDI render, and it is the coro rather than the
   * lead that decides it. Almost every style here has a chorus answering the
   * singer, and in the montuno the coro is on more bars than the sonero is; a
   * single-voice patch would be describing the four bars in eight where one
   * person is alone.
   */
  gm: 52,
  // A square, for the headroom reason iskelmä's profile works out at length: a
  // saw and a square have the same spectral slope, but the square delivers about
  // 5 dB more average level for the same peak, and this line has to sit over a
  // band with four percussionists in it.
  strudel: 'square',
  /**
   * Loud, and the loudest of the recent genres.
   *
   * Reggae puts its voice at 0.82 and argues for it: the riddim is the record
   * and the singer sits inside it. This repertoire makes the opposite claim and
   * makes it explicitly — the sonero is *improvising*, which means the words are
   * new and are the reason anybody is listening to this take rather than the
   * previous one. A mix that buried them would be a mix of the arrangement.
   */
  gain: 0.92,
  /**
   * Five vowels and nothing else, weighted toward the open ones.
   *
   * `a` runs away with it and that is correct: Spanish `a` is the commonest
   * phoneme in the language by a wide margin and it is the vowel almost every
   * held cadence in this repertoire lands on. No `ö`, no `y`, no `ae` — Spanish
   * has no front-rounded vowels and no lax-tense distinction, and a voice built
   * with any of them is singing in the wrong mouth.
   *
   * `aa` is here at a low weight as the long open vowel a held note stretches
   * into, not as a separate phoneme.
   */
  vowels: [
    ['a', 6], ['o', 4], ['e', 4], ['i', 2.5], ['u', 2], ['aa', 1.5],
  ],
  /**
   * Stops, nasals and liquids at the top; the aspirate almost absent.
   *
   * Three facts about the language, and each one moves a weight. Spanish stops
   * are **unaspirated** and short, which makes them land cleanly on a beat and
   * is why they head the table — a syllable placed against the clave needs an
   * edge that arrives exactly when it is struck. The **tap and trill** are the
   * language's signature sound and there is no other language on this list that
   * would put `liquid-r` this high. And orthographic *h* is **silent** in
   * Spanish, so `fricative-h` sits at the bottom next to nothing, which is the
   * same number reggae's profile reaches from a completely different rule.
   *
   * `none` is at a real weight, which is the correction the header describes:
   * roughly a quarter of Spanish syllables begin on their vowel, and a table
   * that opened all of them on a consonant would read as clipped.
   */
  consonants: [
    ['stop', 5], ['nasal', 4.5], ['liquid', 4], ['liquid-r', 4],
    ['nasal-m', 3.5], ['none', 3.5], ['stop-p', 3], ['stop-k', 3],
    ['fricative', 2.5], ['glide', 2], ['fricative-sh', 1.2],
    ['fricative-f', 1], ['fricative-h', 0.3],
  ],
  words: WORD_STYLES.scat!,
  /**
   * A tenor, and it is the honest average rather than a flattering one.
   *
   * The sonero's job description is to be heard over a trumpet section without a
   * monitor, and the leads of this repertoire run high — a light tenor with a
   * usable falsetto is the default, and the bolero baritone is the exception
   * that the range below leaves room for at the bottom.
   */
  signature: 'tenor',
  delivery: 'sung',
  // Middle C and a little above. High for a male lead, which is the point.
  centre: 60,
  // B2 to E5 — a working tenor with the top of the falsetto included.
  range: [47, 76],
  spread: 0.32,
  voice: {
    bodyGain: 0.16,
    bodyLpf: 5600,
    /**
     * Hard, and the hardest in the project so far.
     *
     * A syllable landing on the *and* of two is doing rhythmic work — it is
     * agreeing with the bombo and the montuno's accent, and it has to be
     * audible as an event and not merely as a pitch. Spanish stops are
     * unaspirated and therefore *short*, so a high burst gain here does not
     * produce the spat consonants it would in English; it produces a clean
     * click at the front of the syllable, which is what the clave wants.
     */
    burstGain: 0.85,
    /**
     * Two thirds of a beat, sounding for a shade over half of it.
     *
     * Spanish is **syllable-timed**: every syllable takes about the same length,
     * where English and Finnish stretch the stressed ones. That is the single
     * most characteristic thing about the rhythm of the language and it is what
     * this pair of numbers is actually encoding — an even rate, fast enough for
     * a guaracha's word count, with a gap the Strudel renderer's sixteenth grid
     * will not round away. Below about 0.6 the syllables merge into a held pad,
     * which is the failure iskelmä's profile documents at the other end of the
     * tempo range.
     */
    syllableBeats: 0.66,
    blipBeats: 0.5,
    // Fifteen milliseconds to full volume. Anything slower is a choir patch
    // swelling rather than a person starting a word.
    attack: 0.015,
    decay: 0.09,
    sustain: 0.92,
    release: 0.08,
    noise: 0.06,
    /**
     * A wide, slowish vibrato that arrives late in the note.
     *
     * This is the bolero half of the profile. The held cadence at the end of a
     * bolero line is not a straight tone — it opens out, and the opening is the
     * expressive event the whole phrase was built toward. 5.2 Hz at 0.22 is
     * wider than anything else in the project and is what separates this from a
     * pop vocal holding the same note.
     */
    vibRate: 5.2,
    vibDepth: 0.22,
    /**
     * A moderate scoop, and deliberately less than reggae's full one.
     *
     * A slide up onto the pitch says *arriving*, which is what a line written
     * against a missing downbeat needs. Here the downbeat is not missing so much
     * as *anticipated*, and a note that scooped all the way in would blur the
     * one thing the placement is for: the syllable is early, and early only
     * reads if the pitch is there when the syllable is.
     */
    scoop: 0.6,
    scoopTime: 0.045,
  },
};
