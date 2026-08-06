/**
 * How R&B sings.
 *
 * This is the one genre in the project where the vocal is not a layer of the
 * arrangement. Everywhere else the singer doubles a tune the melody engine wrote
 * and the band would be a perfectly good record without them; here the band is
 * accompaniment by definition and the thing being listened to is a person
 * sustaining one vowel across eight notes. Every number below follows from that
 * one sentence, and the two that follow from it hardest are the delivery and the
 * word style — both of which are the *opposite* of the choices funk made next
 * door, for reasons that are worth stating side by side.
 *
 * ## `delivery: 'ballad'`, against funk's `syllabic`
 *
 * A funk vocal is a percussion part with pitch in it: the syllable is the
 * rhythmic event, it lands on a sixteenth, and `syllabic` at 0.375 beats puts one
 * on every third slot. A soul vocal is the reverse instrument. `ballad` is
 * documented in one line — *half the syllable rate, twice the melisma* — and
 * those are precisely the two things this repertoire wants: a syllable every two
 * beats and a 45% chance that a syllable is held across the next note rather than
 * a new one being started.
 *
 * That is what a melisma is, mechanically, and it is the reason this profile does
 * not need a run generator of its own. At `neo`'s tempos a syllable spanning two
 * beats covers eight sixteenths of written melody, and the line underneath it is
 * already moving — so a run comes out of the two systems meeting rather than out
 * of either one faking it. `arabic/vocals.ts` reached the same field from a
 * completely different tradition and wrote the same sentence about it.
 *
 * ## `words: WORD_STYLES.airy`, against funk's `scat`
 *
 * The syllabary a genre sings on is chosen by what its consonants are *for*, and
 * the two answers here are cleanly opposed. Funk's file argues for `scat` because
 * the characteristic funk syllable opens on a stop and closes hard — *hnh*,
 * *unh*, *hit it* — and the consonant is the note. In this music the consonant is
 * the thing that has to get out of the way so the vowel can start: /l/, /m/, /n/,
 * /h/, /v/, /r/, which is `airy`'s entire onset inventory and is not a
 * coincidence, because a soft onset and a long vowel are one decision made twice.
 * `longChance: 0.55` is the highest in the table and it is what a held note is.
 *
 * **The residual, named rather than hidden.** `airy` was written for a choir and
 * its `interiorDensity: 0.5` is softer than a soul singer genuinely is — a bit
 * over half the struck syllables open on anything at all, where this voice would
 * articulate rather more than that. The `consonants` table below corrects what it
 * can: `stop` is kept at real weight so the /d/ and /b/ that do fire are not
 * fallbacks, and `fricative-h` is high because the aspirated onset before a held
 * note is a *breath being taken audibly*, which is a cue this idiom uses on
 * purpose and the choral profile does not. What it cannot correct is the density
 * itself, and the honest note is that this voice is a shade softer at the front of
 * a syllable than the records are. Two genres now want a word style between
 * `scat` and `airy`; a third would make it a row rather than a taste.
 *
 * ## `signature: 'female'`, and it covers the falsetto too
 *
 * The obvious objection is that half of this repertoire is men, and the answer is
 * that half of *those* are singing in head voice. A church-trained contralto
 * belting in the middle of her range and a tenor in falsetto at the top of his are
 * not two tract lengths, they are one region of formant space reached from two
 * directions — which is why the two sound so alike on a record and so unalike in
 * a room. One signature covers both, and the male half comes out as a man singing
 * above his break, which is exactly what those sides are.
 *
 * The range is two and a half octaves, and it is wide for a reason no other genre
 * has: **the gesture this music is built on is crossing the break inside one
 * phrase.** A range that stopped at the top of the chest voice would be a range
 * with the payoff removed.
 *
 * That said *the widest in the project* and it is the fifth widest of nineteen.
 * Measured in semitones: synth 44, metal 41, pop 40, house 33, and this one 30.
 * The superlative is dropped rather than rewritten because it was never the
 * argument — *why* the range is wide is, and none of the four above it is wide
 * for this reason. Synth's is a vocoder's band, metal's and pop's are one profile
 * stretched over four decades of different singers. This one is a single singer
 * who has to be able to get to both sides of one break in one phrase.
 */

import { WORD_STYLES, type VocalProfile } from '../../style/vocals.js';

export const VOCALS: VocalProfile = {
  name: 'voice',
  /**
   * 53 — Voice Oohs rather than 52 Choir Aahs or 85 Lead 6. A `.mid` of this
   * opens on a solo-ish vowel patch rather than on a section of people, which
   * matters here more than anywhere: the whole proposition is one singer, and
   * Choir Aahs would open every file in this genre as a gospel choir.
   */
  gm: 53,
  strudel: 'sawtooth',
  /**
   * 1.0, and the only one in the project. Every other genre's voice is mixed
   * against a band; this one is mixed against a *record made to sell a singer*,
   * which is a different question with a well-known answer — the vocal is the
   * loudest thing on it and the arrangement was built around leaving room. See
   * `mix` in `index.ts`, where the pad and the comp are pulled down to make that
   * true rather than merely asserted.
   */
  gain: 1,
  /**
   * Open, and low in the mouth. `a` and `o` lead because a held note in this
   * idiom is sung on an open vowel — a melisma on /i/ is a whistle and nobody
   * writes one. `uh` is unusually high for the same reason it is high in funk and
   * a different one: there it is a grunt, here it is the neutral vowel a run
   * passes *through* on its way between two open ones.
   */
  vowels: [
    ['o', 5], ['a', 5], ['aa', 3.5], ['uh', 3], ['e', 2.5], ['oe', 2],
    ['u', 2], ['i', 1],
  ],
  /**
   * Liquids and nasals at the head, and a real stop weight under them.
   *
   * The first four are what `airy` actually spells — m, n, l, h, v, r — so those
   * weights are ordering the draw rather than the fallbacks. `fricative-h` is the
   * one that carries this genre's own gesture: an aspirated onset in front of a
   * held note is an audible breath, it is how a soul singer starts a phrase they
   * intend to finish loudly, and it is the cue the choral profile this borrows
   * from has no use for at all.
   */
  consonants: [
    ['liquid', 5], ['nasal', 4.5], ['fricative-h', 4], ['nasal-m', 3.5],
    ['none', 3], ['liquid-r', 3], ['stop', 2.5], ['fricative', 2],
    ['glide', 2], ['stop-p', 1], ['fricative-sh', 1], ['stop-k', 1],
  ],
  words: WORD_STYLES.airy!,
  // See the header: one signature covers the belt and the falsetto, because they
  // are one region of formant space approached from opposite sides.
  signature: 'female',
  delivery: 'ballad',
  /**
   * 64 — E4, and it is deliberately a shade *below* where the singing happens.
   * `centre` is documented as the pitch the voice is not straining at, and the
   * whole affect of this repertoire depends on the listener hearing that the top
   * of the phrase costs something. A centre placed where the chorus sits would
   * produce a comfortable singer, which is the one thing this music never is.
   */
  centre: 64,
  // E3 to B♭5, two and a half octaves — thirty semitones, fifth widest of the
  // nineteen and not the widest, which is what this used to say. Wide because
  // this line crosses the break inside a phrase and both sides of it have to be
  // reachable, which is a different reason from any of the four above it. See
  // the header.
  range: [52, 82],
  /**
   * 0.2 — the tightest in the project, and it is the melisma that forces it.
   *
   * `spread` is how freely a vowel moves between neighbouring syllables. A run of
   * eight notes here is *one syllable*, so the notes inside it are not syllables
   * at all and there is nothing for a wandering vowel to be colour on; what a
   * moving vowel would sound like across a run is the singer losing the word
   * halfway through it. Jazz's scat is at 0.35 and gets its character from vowel
   * variety, which is the opposite instrument.
   */
  spread: 0.2,
  voice: {
    /**
     * 0.3, the highest here. A supported chest voice has an enormous
     * fundamental — that is what support *is* — and the profiles that sit at
     * 0.15 to 0.2 are describing a crooner and a shouter, neither of whom is
     * pushing air the way this one is.
     */
    bodyGain: 0.3,
    // Warmer than funk's 7 kHz. A belted vowel has plenty of energy up there,
    // but the thing that reads as *soul* rather than as *shouting* is the low
    // mids, and rolling off at 5.5 kHz leaves the effort audible without the
    // rasp sitting on top of the horn section.
    bodyLpf: 5500,
    /**
     * 0.5, and the lowest in the project. The transient is where funk's whole
     * character lives and where this one has none: the onsets are liquids and
     * nasals, which have no burst to speak of, and a loud one would put a click
     * in front of every held note. What starts a phrase here is the breath, not
     * the consonant.
     */
    burstGain: 0.5,
    /**
     * One syllable per beat as written — and `ballad` halves it, so the mouth
     * re-opens every *two* beats. At the tempos this genre actually generates at
     * that is a syllable spanning eight sixteenths of melody, which is the
     * melisma arriving out of the arithmetic rather than out of a special case.
     */
    syllableBeats: 1,
    /**
     * 1.6 against a two-beat slot: the syllable sounds for four fifths of it and
     * the last fifth is the only silence in the line. Chosen the same way
     * iskelmä's 0.72 was — to survive the Strudel renderer's sixteenth grid
     * without the gap being quantised away — and set much higher for the obvious
     * reason: a legato line with an audible gap every two beats is a line being
     * chopped, and this voice is the one that must not be.
     */
    blipBeats: 1.6,
    // Slower than any other onset here. A supported note is reached rather than
    // struck, and 45 ms is what a singer taking a breath in front of it sounds
    // like. Anything faster read as a keyboard patch.
    attack: 0.045,
    decay: 0.16,
    sustain: 0.92,
    // Long. The opposite end of the project from funk's 0.02: a funk singer
    // stops a note and a soul singer lets it go, and the release is where the
    // difference lives.
    release: 0.18,
    noise: 0.07,
    /**
     * Slow and deep — the widest vibrato in the project and the only one that is
     * a *feature of the performance* rather than a cue that a person is present.
     * A held note in this repertoire starts straight and opens into vibrato, and
     * the depth is what makes the last four beats of a chorus worth waiting for.
     */
    vibRate: 5.0,
    vibDepth: 0.22,
    /**
     * The biggest scoop here, and a long one.
     *
     * Reaching a pitch from below is this genre's signature gesture at every
     * tempo and in every era — it is what a gospel singer does to a tonic and
     * what a quiet-storm singer does to a ninth. 90 ms is over a sixteenth at
     * these tempos, which would smear a funk syllable into the one in front of
     * it and is exactly the point when the syllable is two beats long.
     */
    scoop: 1.4,
    scoopTime: 0.09,
  },
};
