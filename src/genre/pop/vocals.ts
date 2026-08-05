/**
 * How this music sings.
 *
 * The unit is **one person, close to a microphone, mixed above everything else
 * on the record.** That is the whole design brief and it is genuinely unlike the
 * other singers in this project, all of which are described by what they have to
 * fight. A rock singer is at the top of their range competing with two
 * amplifiers; a tanssilava vocalist is projecting across a pavilion; a reggae
 * trio sits inside the riddim; a funk lead is above a horn section. This one is
 * fighting nothing at all. It is six inches from a condenser microphone in a
 * treated booth, compressed until every syllable is the same loudness, and it
 * arrives at the listener as the loudest thing in the arrangement by a margin
 * nobody has to work for.
 *
 * Almost everything below follows from that single fact:
 *
 *  - **`gain: 1.05`**, the second highest in the project after Indian classical
 *    — where the voice genuinely is the entire piece. This is not that, and it
 *    is still above the melody layer, because on a pop record the vocal is
 *    *never* balanced against the arrangement. It is placed on top of it.
 *  - **`noise: 0.03`**, the lowest here by a distance. Rock's 0.12 is a rasp and
 *    is described as the thing that separates a rock lead from a well-produced
 *    pop one singing the same notes; this is the well-produced pop one. Breath
 *    noise is what a compressor and a de-esser were bought to remove.
 *  - **`scoop: 0.35`**, against rock's 1.0. A pop note arrives *on* the pitch,
 *    because it was tuned, and a full scoop would be describing a genre that
 *    predates the equipment. Not zero: the 1963 half of this repertoire is a
 *    teenager singing live to a two-track and there is a slide into every long
 *    note on it.
 *
 * ## `signature: 'female'`, chosen against the alternatives on purpose
 *
 * The one genre here where a low male lead would be the *wrong* average. Iskelmä
 * takes `low-male` and rock and funk take `tenor`; sixty years of pop singles are
 * disproportionately sung by women and by high male voices, and a table that
 * split the difference at `androgynous` would be describing a repertoire that
 * did not have the girl groups, the disco singers, the eighties duos or the
 * whole of the last twenty years in it. `female` at `centre: 66` sits a fourth
 * above rock's, and the range below reaches down to A♭2 — low enough for the
 * baritone half of the genre to fold into rather than be transposed out of.
 *
 * ## The words are `scat`, and the reason is the consonant density
 *
 * Four invented languages exist in `style/vocals.ts` and none is English.
 * Choosing on shape rather than on name: `scat`'s one-to-three-syllable words
 * and 98% onset density are what a pop line needs, because a pop syllable
 * *starts* — the whole point of close-miking is that the consonant is audible,
 * and `airy`, which has no stops at all, would produce a line with nothing
 * placing it. `finnish` is ruled out by vowel harmony and `machine` by a coda
 * density that closes every syllable, which is a talker.
 *
 * The consonant weights below then pull the draw away from `scat`'s hard `d`/`b`
 * and toward the nasals, liquids and the aspirate, which is the one adjustment
 * this profile makes: a pop onset is *present* rather than percussive, and the
 * difference between this table and rock's — which leans the same language the
 * other way — is most of the difference between the two voices.
 *
 * ## And the delivery is `sung`
 *
 * `ballad` halves the syllable rate and doubles the melisma, which is a crooner
 * and is right for iskelmä and for Arabic and wrong here: a pop line is one
 * syllable per note and the notes are short. `syllabic` would put a gap after
 * every syllable, which reads as blipping. `sung` is joined inside the word and
 * broken between words, and `syllableBeats: 0.55` is quicker than rock's — the
 * words fit into the bar because somebody wrote them to.
 */

import { WORD_STYLES, type VocalProfile } from '../../style/vocals.js';

export const VOCALS: VocalProfile = {
  name: 'voice',
  // 53 — Voice Oohs. One person, for the MIDI render; 52's Choir Aahs would
  // stage a backing group that only half this genre has.
  gm: 53,
  /**
   * A square, and it is the iskelmä argument rather than the rock one.
   *
   * Rock picks a saw because its voice has to cut through two distorted guitars
   * and the brightness is worth the headroom. This voice has nothing to cut
   * through — it is already on top — so the trade runs the other way: the same
   * spectral slope for about 5 dB more average level at the same peak, which is
   * what a heavily compressed pop vocal actually is.
   */
  strudel: 'square',
  /**
   * Above the melody layer, which is the statement.
   *
   * Every other genre here mixes its singer level with the tune or under it,
   * because in every other genre the tune is being played by somebody. On a pop
   * record the melody layer is frequently a synthesiser doubling the vocal, and
   * the balance between them is not a negotiation — the voice wins, always, and
   * the doubling is there to make it bigger rather than to share the line.
   */
  gain: 1.05,
  /**
   * Bright and front, and the `i` weighted higher than anywhere else here.
   *
   * A close-miked pop vowel is *forward* — the tongue is high and the sound is
   * placed at the front of the mouth, which is the opposite of the open shouted
   * `a` rock is built on. `ae` at 2.5 does the same job it does there: the
   * flattened front vowel is most of what makes a sung line read as English.
   */
  vowels: [
    ['e', 4], ['a', 4], ['i', 3.5], ['o', 3], ['ae', 2.5], ['u', 2], ['aa', 2],
  ],
  /**
   * Present rather than percussive, and this is the table that separates this
   * voice from rock's.
   *
   * Both draw from `scat`. Rock puts the stops at 5 and 3.5 because a shouted
   * syllable has to arrive before the ear's masking settles against a guitar
   * chord. Nothing is masking this one, so the onset can be a nasal or a liquid
   * — which is what a pop lyric is mostly made of — and the stops come down to
   * where they place the note without punching it.
   *
   * `none` at 3 is the highest in the project and is deliberate: a pop line ties
   * across syllables constantly, and a syllable with no onset is what a held
   * vowel running into the next word sounds like.
   */
  consonants: [
    ['nasal', 4], ['liquid', 3.5], ['stop', 3.2], ['nasal-m', 3], ['none', 3],
    ['liquid-r', 3], ['glide', 2.8], ['fricative', 2.5], ['stop-p', 2.2],
    ['fricative-sh', 2], ['stop-k', 1.8], ['fricative-h', 1.5], ['fricative-f', 1.2],
  ],
  words: WORD_STYLES.scat!,
  signature: 'female',
  delivery: 'sung',
  /**
   * F♯ above middle C, and comfortable there rather than straining.
   *
   * Rock's 62 is described as high enough to be uncomfortable and meant to be.
   * This is four semitones higher and means the opposite: it is where the voice
   * is *easy*, because the whole production apparatus of this genre exists to
   * make the singer sound unforced. A pop vocal that audibly costs the singer
   * something is a rock vocal.
   */
  centre: 66,
  /**
   * A♭2 to C6. The widest range in the project, and it has to be — this one
   * profile covers a 1963 contralto singing to a two-track and a 2010 lead
   * whose top note was written for her by somebody with a keyboard.
   */
  range: [44, 84],
  spread: 0.3,
  voice: {
    bodyGain: 0.14,
    bodyLpf: 6800,
    /**
     * 0.55, roughly in the middle and nowhere near rock's 0.9.
     *
     * The consonant here has to be *audible* rather than *transient*, because it
     * is not competing with anything — and rock's own note warns that above 0.85
     * a line turns into a percussion part, which is a hazard there and would be
     * a defect here. What a pop record wants is a syllable you can make out the
     * word of, which is a much lower number than one you can hear through a
     * distorted guitar.
     */
    burstGain: 0.55,
    /**
     * Just over half a beat a syllable, sounding for two of its three
     * quarter-beat slots.
     *
     * Both numbers are chosen against the Strudel renderer's sixteenth grid,
     * where beats round to quarter-beats: 0.55 rounds to two slots and 0.4 to
     * one and a half, so the gap survives quantisation and the re-attack is
     * audible. This is quicker than rock's 0.66 for a structural reason rather
     * than a stylistic one — a pop lyric has more syllables in the bar, because
     * somebody sat down and fitted them.
     */
    syllableBeats: 0.55,
    blipBeats: 0.4,
    /** Fast, but not instant. A tuned note arrives; it does not swell and it
     * does not crack either. */
    attack: 0.018,
    decay: 0.07,
    sustain: 0.9,
    release: 0.08,
    /** The lowest in the project. See the header: this is what the compressor
     * and the de-esser were for. */
    noise: 0.03,
    /**
     * Fast and shallow — 6 Hz at 0.14.
     *
     * A pop vibrato is a *decoration on the end of a held note* rather than the
     * spin of a trained voice, and the renderer approximates it with rate and
     * depth alone. Faster than rock's 5 Hz because the note is not being leant
     * on, and much shallower than any of the sung profiles here for the same
     * reason the noise is low: a wide vibrato does not survive being tuned.
     */
    vibRate: 6,
    vibDepth: 0.14,
    /**
     * A third of a scoop, over 40 ms.
     *
     * The one place this profile splits the difference across its own sixty
     * years, and the split is honest rather than lazy. In 1963 there is a slide
     * into every long note; by 2010 the note is placed on the grid and corrected
     * afterwards, and a full approach from below would be describing equipment
     * that removes it. 0.35 is closer to the second, because three of the four
     * eras are on that side of the line.
     */
    scoop: 0.35,
    scoopTime: 0.04,
  },
};
