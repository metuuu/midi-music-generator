/**
 * How this genre sings — which is to say, how it sings *Latin*.
 *
 * Two styles in the catalogue want a voice and they want opposite things from
 * it. `aria` is one person in front of a band showing off; `lacrimosa` is forty
 * people in a gallery agreeing. A `VocalProfile` is one object per genre, so
 * this is a compromise, and it is worth saying which way it leans and why:
 * **toward the chorus**, because a solo voice singing a decorated line is the
 * one thing this synthesis is least able to fake, and a section of voices
 * holding a long vowel in a room is the one it is best at.
 *
 * ## The words
 *
 * `WORD_STYLES.airy`, which ambient also uses, and the resemblance is not an
 * accident of convenience — it is the same phonetic fact arrived at twice.
 * Liturgical Latin is *made of long open vowels with very little in front of
 * them*: `Kyrie`, `Agnus`, `Requiem aeternam`, `dona eis`. Almost every syllable
 * opens on a vowel or on a liquid, the codas are nearly all `n`, `s` and `m`, and
 * a doubled vowel is commoner than a closed syllable. That is the same
 * description `airy` was written to, and inventing another word style to say it
 * again would be a new entry for a description already in the table.
 *
 * **This said *a fifth word style*, and one would now be the seventh.**
 * `WORD_STYLES` holds `finnish`, `scat`, `airy`, `machine`, `sargam` and
 * `tarana`; the last two arrived with indian, which is the genre
 * `docs/engine-gaps.md` §3.10 was written for. The number is dropped rather than
 * bumped because it was never the argument — what matters is that `airy`
 * already says this, not how many neighbours it has — and because a count of a
 * shared table is exactly the sentence that goes stale without anybody in this
 * folder touching a line.
 *
 * The one place the two genres part company is the *rate*, and that is set here
 * rather than there. Ambient sings a syllable every two beats, which at 60 BPM is
 * one every two seconds and is slower than any language. This sings one per beat
 * — the same as iskelmä — because a chorus setting a text is setting *words*,
 * and a word whose syllables are two seconds apart has stopped being one.
 *
 * ## The voice itself
 *
 * `signature: 'androgynous'` and not either of the obvious alternatives, and this
 * is the field that carries most of the compromise above. A choral line is not a
 * male voice and not a female one — it is four sections at once, and what the ear
 * takes from that is a tract length somewhere in the middle with no strong
 * gender cue at all. Picking `male` or `female` would make every sacred number a
 * soloist, which is the failure this whole profile is steering around.
 *
 * `delivery: 'sung'` rather than iskelmä's `ballad`. A ballad delivery is one
 * line per breath with the ends held and a large scoop into every note, which is
 * a crooner; a trained voice arrives *on* the pitch, and the scoop below is a
 * fifth of iskelmä's for that reason. Sliding into a note is the single clearest
 * "this is popular singing" cue there is, and removing it is most of what makes
 * the same synthesis read as a choir.
 */

import { WORD_STYLES, type VocalProfile } from '../../style/vocals.js';

export const VOCALS: VocalProfile = {
  name: 'voice',
  // 52 — Choir Aahs, for the shipping MIDI. The one genre besides ambient where
  // the GM choir patch is not a compromise but a fair description of the target.
  gm: 52,
  /**
   * A sawtooth, following ambient's reasoning rather than iskelmä's.
   *
   * The pop profiles use a square because it delivers more average level for the
   * same peak and a lead vocal has to fight a drum kit that already reaches the
   * ceiling. There is no drum kit anywhere in this genre and nothing in the mix
   * is loud, so the headroom is better spent on the spectrally richer source: a
   * saw gives the formant bands more harmonics to find, and the vowel comes out
   * clearer, which is what a sustained choral tone is almost entirely made of.
   */
  strudel: 'sawtooth',
  // Above the melody it doubles but not by much. A choir is a layer of the
  // texture in this repertoire even when it has the tune; a voice mixed like a
  // pop lead would be an oratorio soloist with the orchestra behind a wall.
  gain: 0.82,
  /**
   * Open and dark, and heavier on `a` than any other profile here.
   *
   * Latin has five vowels and no front-rounded ones at all, which is the exact
   * inverse of the Finnish palette next door: no `ö`, no `y`, no `ä`. `aa` and
   * `oe` earn small weights as the long-vowel colours a held note drifts toward
   * rather than as vowels of the language, and `i` is present because *Kyrie*
   * and *in excelsis* are most of what a chorus actually sings.
   */
  vowels: [
    ['a', 6], ['e', 4], ['o', 4], ['i', 3], ['u', 2.5], ['aa', 1.5], ['oe', 1],
  ],
  /**
   * Liquids, nasals and nothing at all, which is Latin's own consonant profile
   * far more than it is a preference.
   *
   * The permission list matters more than the weights here — see
   * `VocalProfile.consonants`, where the word's own letters do the choosing and
   * this table is consulted only for a letter the voice cannot make. What it
   * says is that this voice has no sibilant worth the name and no hard stop:
   * `stop` and `fricative` are present because *Credo* and *sanctus* exist, and
   * they are at the bottom because a burst of noise at 3 kHz every other
   * syllable is the fastest way to turn a choir back into a synthesiser.
   */
  consonants: [
    ['none', 5], ['nasal', 5], ['liquid', 4], ['nasal-m', 4], ['liquid-r', 3],
    ['fricative', 2], ['stop', 2], ['stop-k', 1.5], ['fricative-h', 1.5],
    ['glide', 1], ['stop-p', 1],
  ],
  words: WORD_STYLES.airy!,
  // See the header: not a man and not a woman, because a choral line is neither
  // and the alternative is turning every sacred number into a soloist.
  signature: 'androgynous',
  delivery: 'sung',
  /**
   * A shade above middle C, and higher than any other profile here.
   *
   * Iskelmä centres at 57 because it is a low-voiced music sung by baritones.
   * This is the opposite end: the melodic line in a mass or an oratorio is the
   * soprano line, and the register that reads as *choir* rather than as *singer*
   * is the one where the tone is nearly all fundamental and second harmonic.
   */
  centre: 64,
  // F3 to A5 — a chorus, taken as one instrument. Wider than any single singer
  // and narrower than the four sections added together, which is the honest
  // description of what one line standing in for a choir can cover.
  range: [53, 81],
  // Wide. A text being set moves around the mouth constantly, and this is the
  // field that stops consecutive syllables landing on the same vowel.
  spread: 0.34,
  voice: {
    bodyGain: 0.16,
    bodyLpf: 4600,
    // Softer than iskelmä's and much softer than jazz's. A choir's consonants
    // arrive together from thirty people and are therefore *blurred*, which is
    // audibly the opposite of a percussive one.
    burstGain: 0.5,
    // A syllable per beat, sounding for three sixteenths of it — the same
    // numbers iskelmä uses, and for the same renderer-grid reason set out at
    // length there: anything between 0.76 and 1.0 rounds up to a full beat and
    // quantises the gap away.
    syllableBeats: 1,
    blipBeats: 0.72,
    // Slower onset than a pop syllable and faster than a pad. A trained voice
    // reaches full tone in about 40 ms; the 15 ms a pop profile uses reads as a
    // consonant even when there is not one.
    attack: 0.04,
    decay: 0.11,
    sustain: 0.92,
    release: 0.12,
    // Less breath than a popular voice. Trained singing hides the noise floor
    // on purpose, and this is the number that decides whether the result sounds
    // like a person leaning in or like a section holding a chord.
    noise: 0.04,
    // Slow and shallow. Choral vibrato is what you get when thirty people each
    // have their own — it averages out into a slight width rather than a wobble,
    // and a fast deep one on this line would be a single opera singer.
    vibRate: 4.6,
    vibDepth: 0.1,
    /**
     * A fifth of iskelmä's, and the single most important number in the file.
     *
     * A scoop is a slide into the note, and it is the clearest "this is popular
     * singing" cue the synthesis has: iskelmä sets it at 1.2 and its own comment
     * says removing it is audible as wrongness. Here it is audible as wrongness
     * the other way round. A trained voice arrives on the pitch — that is most of
     * what the training is for — and 0.25 leaves just enough that the attack is
     * not a step function.
     */
    scoop: 0.25,
    scoopTime: 0.05,
  },
};
