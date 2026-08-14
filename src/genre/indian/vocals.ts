/**
 * How this genre sings — which is a bigger question here than anywhere else in
 * the project, because this is the only genre where the voice is the *senior*
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
 * ## The two closed syllabaries, and why only one of them is here
 *
 * This repertoire sings on fixed sets of syllables rather than on words, and it
 * is the only one in the project that does. **Sargam** is the solfège — sa, re,
 * ga, ma, pa, dha, ni — which in this music is not a teaching device but a
 * performance vocabulary: a khyāl singer improvises out loud in note names for
 * minutes at a time. A **tarānā** is sung on the tabla's own strokes, *dir ta
 * na dere tom nom*, with the Carnatic tillānā doing the same thing further
 * south. Both are closed sets of about eight syllables with the same shape —
 * single consonant, single short vowel, no clusters — and this profile once
 * asked the engine for both.
 *
 * It got sargam; `words` below names it and explains what the binding buys.
 * This section is about the other one, where the answer is **no**. A refusal
 * that has been measured is worth keeping, because the alternative is that
 * somebody writes the table again.
 *
 * ## Why there is no tarānā voice
 *
 * A `tarana` entry stood in `style/vocals.ts` from the same commit as `sargam`
 * until it was deleted, and in all that time nothing pointed at it. Two things
 * were wrong with it, and only the first is plumbing.
 *
 * **Nothing can select it.** A tarānā is a `Style` here — see `styles.ts`, and
 * `tillana` beside it — while `Genre.vocals` is one `VocalProfile` for the
 * whole genre, read once in `generate/song.ts`. There is no per-style vocal
 * override, and no field on `Style` reaches a word style, so the table was
 * addressed to a selector that has never existed. Nothing in this folder could
 * have supplied one: the field belongs in `style/types.ts` and the read in
 * `generate/song.ts`.
 *
 * **And the voice cannot say it anyway**, which is the half that decides it. A
 * tabla's vocabulary is built on exactly the three distinctions `Consonant`
 * drops. *Voicing*: *ta* and *da* are different strokes and `LETTER_ONSET` puts
 * both on `stop`. *Aspiration*: *dha* against *ta* is the bāyāṅ hand against
 * the dāyāṅ, and there is no aspirated stop at all. *Retroflex*: *ṭa* against
 * *ta* is most of the rest of the kit, and there is one dental stop for both.
 * The deleted table wrote nine onset slots over six letters; the inventory
 * makes five sounds of them, and *d* and *t* alone are four of the nine.
 *
 * Measured over 142,535 sung syllables of this genre's tarānā and tillānā with
 * that table swapped in behind the profile: **five** distinct sounded onsets
 * against sargam's **seven** on the same songs, with `stop` taking 44% of every
 * onset the voice sounded. The consonant-heavy syllabary came out *less*
 * differentiated than the vowel-led one it was written to contrast with, and
 * the reason is the form's own: a tarānā is a drummer's two hands, and both
 * hands arrived as one hand hitting harder.
 *
 * Its codas do not rescue it either, and the entry's own claim for them was the
 * thing least true about it. It offered `r m n` — a liquid and two nasals, not
 * one stop among them — so a syllable it closed did not stop dead, it hummed.
 * They reached 17.9% of syllables through `web/voice-synth.ts`, the only
 * renderer that articulates a coda; through Strudel a closed syllable is a held
 * vowel by construction, so there the figure is zero.
 *
 * **What adopting it would have cost**, had it been reachable: the binding.
 * `tarana` had no `degrees`, and correctly so — a bol names a stroke, not a
 * note — so those two styles would have gone back to a hashed lexicon whose
 * syllables have nothing to do with the pitches under them, which is the exact
 * defect `sargam` was introduced to remove. Ākār goes with it: 87.3% of sung
 * syllables land on /a/ today, and 48.4% would, with /i/ and /e/ taking 41.3%
 * between them.
 *
 * **What would reverse this.** Two changes, neither of them here, and the first
 * is the one that matters: aspirated and retroflex members of `Consonant` in
 * `core/types.ts` — an aspirated stop is a stop with a long voice-onset delay
 * and a retroflex one is a stop with a low F3 locus, so both are cheap to
 * synthesise and neither is cheap to add, since every renderer and the concert
 * visemes read that union. With those, nine bols would land on nine sounds and
 * the argument above stops holding. Then, and only then, is a per-style word
 * style worth building. The table itself was nine lines and can be written
 * again from this paragraph; the measurement is the part that was expensive.
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
 * ## Where this sits against the other profiles
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
   * inverse of ambient and the reason the genre's `mix` puts `melody` at 0.75:
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
   * Nasals and liquids lead because the three commonest sargam syllables —
   * *ni*, *ma*, *re* — are exactly a nasal, a nasal and a liquid.
   *
   * **All seven swara onsets have to be in this list, and two were not.** The
   * list is a permission list, so a syllable whose consonant is absent does not
   * come out approximated, it comes out *drawn* — and a drawn onset on a bound
   * syllable is the one failure this whole mechanism exists to prevent. Without
   * `fricative` and `stop-p`, *sa* and *pa* would each fall back to a roll of
   * the dice, and two of the seven names in the scale would stop being names.
   *
   * The seven land on seven distinct consonants the inventory has, and no two
   * differ only by voicing, so the binding is audible in full — which is the
   * good luck in this repertoire and not a general property. The tarānā's nine
   * bols are the same list under a worse star: they collapse onto five sounds
   * against these seven, because the inventory has neither aspiration nor
   * retroflexion and a drummer's two hands come out as one. Every letter a bol
   * needs is in the list below — *d* and *t* on `stop`, *n* on `nasal`, *r*,
   * *m* and *k* each on their own — which is why the failure is not a missing
   * permission and cannot be fixed by adding one. See the header.
   */
  consonants: [
    ['nasal', 5], ['nasal-m', 4], ['liquid-r', 4], ['stop', 3],
    ['fricative', 3], ['liquid', 2.5], ['stop-k', 2], ['stop-p', 2],
    ['none', 2], ['fricative-h', 1],
  ],
  /**
   * The notes name themselves.
   *
   * This was `airy`, and the genre's own header called the absence of sargam
   * the one thing it could not have: a line here should be sung on *sa re ga ma
   * pa dha ni*, and `airy` invented a word and hashed it into vowels, so the
   * syllable and the note it landed on had nothing to do with each other.
   *
   * `sargam` inverts which end of the pipe picks the syllable — the pitch does
   * — and the invented word keeps the half it was always better at: how many
   * names run together on one breath and which are held. It does not breach the
   * wordless premise this project is built on, because a swara name has no
   * referent outside the scale and nothing in it to localise. See
   * `WordStyle.degrees`, and note the table is twelve entries rather than
   * seven: komal and shuddha *re* are both *re*, so the name belongs to the
   * degree and the voice never has to be told which rāga it is in.
   */
  words: WORD_STYLES.sargam!,
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
