/**
 * How this genre sings — which is a bigger question here than in the other four,
 * because this is the only one of the five where the voice is the *senior*
 * instrument.
 *
 * Everything else in this project treats singing as a thing added to a band. In
 * Hindustani and Carnatic music it is the other way round: khyāl, dhrupad,
 * thumrī, kṛti, tarānā, bhajan and qawwālī are all vocal forms, and the
 * instrumental tradition is explicitly modelled on them — a sitārist talks
 * about *gāyakī ang*, playing in the singing manner, and means it as the
 * highest praise available. So the profile below is not a decoration on the
 * genre; it is the thing the genre's melody layer is imitating.
 *
 * ## The one thing this could not have and most needed
 *
 * A vocal line here should be sung on **sargam** — sa, re, ga, ma, pa, dha, ni,
 * the solfège, which in this music is not a teaching device but a performance
 * vocabulary: a khyāl singer improvises out loud in note names for minutes at a
 * time, and a tarānā is sung entirely on the tabla's own syllables, *dir ta na
 * dere*. Both are closed sets of about eight syllables with a very specific
 * shape: single consonant, single short vowel, no clusters, no codas at all.
 *
 * That is a `WordStyle`, and `WORD_STYLES` lives in `style/vocals.ts`, which is
 * outside this genre's folder. So the nearest of the four available is used —
 * `airy`, the choral-ambient one — and it is nearer than it has any right to
 * be. Its onsets are `m n l h v r`, which reaches *ma*, *na*, *ni*, *re* and
 * *ha*; it doubles its vowel more often than not, which is what ākār is; and it
 * closes almost nothing, which matches a syllabary with no codas in it. What it
 * cannot do is *dha*, *ga*, *ta*, *dir* or *dere* — the stopped consonants,
 * which are exactly the ones a tarānā is made of, and the ones that make the
 * voice sound like a drum.
 *
 * A `sargam` word style would be seven onsets and five vowels and would be the
 * single highest-value thing anybody could add for this genre. Written down
 * here rather than done, because a new entry in that table is a change to a
 * shared file.
 *
 * ## Ākār, and why the vowels are so few
 *
 * The default vowel of this music is /a/, and not by a small margin. Singing a
 * phrase on a bare open *aa* — ākār — is the ordinary way to state a rāga
 * before words arrive, and a great deal of a khyāl is that. So `a` and `aa`
 * carry more than half the weight between them, and the closed vowels are
 * present at the bottom of the table only because a syllabary that contained no
 * /i/ could not say *ni* or *dir*.
 *
 * ## Where this sits against the other four profiles
 *
 * Between iskelmä and ambient, and closer to ambient. A syllable every beat
 * rather than ambient's every two: this voice articulates far more than a choir
 * does — sargam is one syllable per note, at speed — but far less than a pop
 * singer, because the long held note is the form's basic unit. What it has that
 * neither of the others has is the **scoop**, which is the largest number in
 * this profile and the reason it is here.
 */

import { WORD_STYLES, type VocalProfile } from '../../style/vocals.js';

export const VOCALS: VocalProfile = {
  name: 'voice',
  /**
   * 85 — Lead 6 (voice), not 52 Choir Aahs.
   *
   * Ambient takes the choir patch because a sustained ensemble "aah" is a fair
   * description of what it wants. This is the opposite: one person, alone,
   * audible over a tabla, with the whole weight of the performance on them. The
   * GM choir is a dozen people averaged together, which removes precisely the
   * thing that identifies a singer here — that every ornament is one throat
   * doing something deliberate. A synth voice lead is a worse *timbre* and a
   * far better *soloist*, and this profile is about a soloist.
   */
  gm: 85,
  strudel: 'sawtooth',
  /**
   * Above the melody layer it doubles rather than under it, which is the
   * inverse of ambient and the reason the genre's `mix` puts `melody` at 0.95:
   * in a vocal item the instrument is shadowing the singer, and the shadow
   * should be behind the thing casting it.
   */
  gain: 1.15,
  // Ākār. `a` and `aa` are more than half the table between them, and `i` is in
  // it only so the voice can say *ni* and *dir*.
  vowels: [
    ['a', 6], ['aa', 5], ['e', 3], ['o', 2.5], ['i', 2], ['u', 1.5],
  ],
  /**
   * A permission list rather than a draw — see `VocalProfile.consonants`, which
   * explains that the word's own spelling chooses these and the weights only
   * settle what an unavailable letter becomes.
   *
   * Nasals and liquids lead because `airy` is built on them and because the
   * three commonest sargam syllables — *ni*, *ma*, *re* — are exactly a nasal, a
   * nasal and a liquid. The stops are listed at low weight rather than omitted:
   * *ga*, *dha* and *ta* are real syllables in this vocabulary and a voice that
   * could not make a stop at all could never sing a tarānā even badly.
   */
  consonants: [
    ['nasal', 5], ['nasal-m', 4], ['liquid-r', 4], ['liquid', 3],
    ['none', 3], ['fricative-h', 2], ['stop', 1.5], ['stop-k', 1],
  ],
  words: WORD_STYLES.airy!,
  /**
   * A high female voice and a legato delivery.
   *
   * `sung` rather than ambient's `chant`, and the difference is the point: a
   * chant has almost no contour, and this line has nothing but contour — the
   * pitch is moving between the notes as much as it is sitting on them. The
   * signature is `high-female` because the register this music is most
   * associated with is a woman singing at the top of a tanpura tuned to C♯,
   * which lands where a treble line lands.
   */
  signature: 'high-female',
  delivery: 'sung',
  // A tanpura tuned around C♯ or D puts the middle Sa near D4 and the upper Sa
  // near D5, and a khyāl spends most of its time between them.
  centre: 64,
  // C3 to E5 — wider than any other profile here, because a vocal item's whole
  // structure is a climb from the lower Sa to the upper one and back.
  range: [48, 76],
  spread: 0.34,
  voice: {
    bodyGain: 0.18,
    bodyLpf: 4600,
    burstGain: 0.4,
    /**
     * A syllable a beat — one mātrā, since a mātrA is an eighth here, so this is
     * one syllable per two mātrās at the printed tempo. Twice as often as
     * ambient and half as often as iskelmä, which is where sargam sits: it is
     * one syllable per note and the notes are not fast.
     *
     * `blipBeats` at 0.8 leaves the gap the ear needs to hear two syllables
     * rather than one held vowel — on the renderer's sixteenth grid that rounds
     * to three slots sounding out of four.
     */
    syllableBeats: 1,
    blipBeats: 0.8,
    attack: 0.05,
    decay: 0.16,
    sustain: 0.93,
    release: 0.22,
    noise: 0.06,
    /**
     * Slow and wide, and the widest depth in the project.
     *
     * This is a real disagreement with Western practice rather than a taste. A
     * trained operatic vibrato is fast and narrow and continuous — it is part of
     * the tone. What this music does is *āndolan*: a deliberate, slow, wide
     * oscillation applied to particular swaras of particular rāgas and to
     * nothing else, wide enough that a listener hears two pitches rather than a
     * shimmer. The engine has one vibrato setting for a whole part, so what is
     * here is the compromise: slower and wider than any other profile, applied
     * everywhere, which is the closest a single number gets to a gesture that is
     * supposed to be selective.
     */
    vibRate: 4.2,
    vibDepth: 0.4,
    /**
     * The largest scoop here by a wide margin, and the single most
     * genre-defining number in the profile.
     *
     * A *meend* is a slide from one swara to another with everything in between
     * sounded, and it is not an ornament added to the line — in this music it is
     * how the line gets from note to note. The engine has no way to write a
     * meend between two written notes; what it has is a scoop into each one, and
     * a deep slow scoop on every syllable is a fair approximation of a voice
     * that never arrives at a pitch from nowhere. A semitone and a half, taken
     * over nearly a fifth of a second — iskelmä's is a third of that in both
     * directions, and ambient's is a tenth.
     */
    scoop: 1.5,
    scoopTime: 0.18,
  },
};
