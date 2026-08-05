/**
 * How hiphop sings, and the awkward fact that it does not.
 *
 * ## What is actually missing, stated plainly
 *
 * In a very large part of this repertoire **there is no melodic instrument at
 * all.** The tune is a voice, the voice is saying words, and the words are the
 * composition — not the vehicle for it, not a text set to it, the thing itself.
 * Take the words off a boom-bap record and what is left is four bars of somebody
 * else's jazz record with a kick on it, which is a texture rather than a piece.
 * That is not true of any other genre in this project: an iskelmä song without
 * its lyric is still the song, a jazz head is the head, and ambient never had a
 * text to lose.
 *
 * This engine's voice is **wordless and vowel-led by construction**. It sings an
 * invented language nobody ever sees — `generate/vocals.ts` — whose syllables are
 * a pure function of a generated word, and it doubles a line the melody engine
 * already wrote. There is no register in which it can carry meaning, and no
 * field on `VocalProfile` that would give it one. `docs/voice.md` describes forty-
 * nine voices to audition and every one of them is a way of *performing*
 * something; none of them is a way of *saying* something.
 *
 * **So the cost is named rather than mitigated: this genre generates the record
 * with the rapper taken off it.** That is a real object — it is the B-side of
 * every twelve-inch this music ever pressed, it is what `titles.ts` calls
 * `(Instrumental)`, and it is a thing people buy on purpose. It is not the
 * genre. Anybody reading the output should know which of the two they have.
 *
 * ## What is done instead, and it is not nothing
 *
 * Three decisions, each of which moves the voice as far toward speech as the
 * machinery allows.
 *
 * **`delivery: 'talk-sing'`.** The single most useful field in the file and it
 * already existed. Its `flatten` is 0.5 — half the written pitches survive and
 * the other half is replaced by a *speech intonation contour*, a 3.5-semitone
 * span with stresses lifting and the phrase falling at its end — and its timing
 * stays metric, so the syllables land on the grid the hi-hat is on. That
 * combination is the definition of the thing: pitch abandoned, metre kept. It is
 * one preset away from `spoken`, which goes to `flatten: 1` and `timing:
 * 'speech'` and comes out as somebody talking over a record rather than on it;
 * `docs/voice.md` says in as many words that quantising speech to a grid *"is
 * instantly audible as a rap"*, which is the one place in this project where a
 * warning about a failure mode is a specification for a feature.
 *
 * **`words: WORD_STYLES.machine`, and it is not a joke about drum machines.**
 * That table's own comment opens *"a vocoder is tracking a talker, and a talker
 * says anything"* — it is the widest consonant inventory in the file, the
 * shortest words, and by a distance the most **closed syllables**, at
 * `codaDensity: 0.55`. Those three properties are what separates rapped English
 * from sung English: consonant clusters, monosyllables, and a stop at the end of
 * half of them. `scat` was the obvious pick, is what funk uses, and is wrong
 * here — it is an open syllabary with `maxSyllables: 3` and a coda on three in
 * ten, which is a horn player's mouth.
 *
 * **A register that is barely a register.** `centre: 50` and a range of
 * twenty-one semitones, both the narrowest in the project. A sung line is placed
 * where a voice sounds best; a rapped line sits where a person's speaking voice
 * already is and moves about a fourth either side of it for emphasis. Every
 * other profile here has a range of two octaves or more because it has to reach
 * the tune. This one is not reaching for anything.
 *
 * ## What the engine still could not be asked for
 *
 * A `WordStyle` of its own. `WORD_STYLES` earns a row by being a *language*
 * rather than a setting, and rapped English arguably is one — the syllable
 * inventory is English's, the stress pattern is not, and the interesting property
 * is that stress lands *against* the beat rather than on it. That would want a
 * field this type does not have, and it would want editing `style/vocals.ts`,
 * which is outside this genre's folder. `machine` is a good approximation and it
 * is an approximation; the indian author made exactly the same report about
 * `sargam` and got the row.
 */

import { WORD_STYLES, type VocalProfile } from '../../style/vocals.js';

export const VOCALS: VocalProfile = {
  name: 'voice',
  /**
   * 85 — Lead 6 (voice) rather than 52 Choir Aahs, for the reason funk gives and
   * more so: a choir patch is a pad, and this line has to articulate at
   * sixteenth-note speed. A `.mid` opened on a choir programme would play a
   * verse of this as one long chord.
   */
  gm: 85,
  strudel: 'square',
  /**
   * The loudest layer in the genre, above the melody and level with the kick.
   * This is not a mix preference; in this music the voice is the subject and
   * everything else is the accompaniment, which is the exact inverse of what
   * `hiphop/index.ts` says about the *instrumental* balance — where the bass
   * outranks the tune. Both are true at once and the reason they are not a
   * contradiction is that the tune is not the subject either.
   */
  gain: 0.98,
  /**
   * Led by `uh`, which no other profile in the project does.
   *
   * The reduced central vowel is somewhere near a third of the syllables in
   * ordinary spoken English and almost none of the syllables in sung English —
   * a singer opens it out, because a schwa held for a beat and a half is a
   * mumble. Nothing here is held for a beat and a half. Putting `uh` at the top
   * of the table is the cheapest single thing that makes this read as speech
   * rather than as singing, and `aa` is second because the vowel that *is*
   * stressed in this delivery is the open one.
   */
  vowels: [
    ['uh', 5], ['aa', 4], ['e', 3.5], ['i', 3], ['a', 3], ['o', 2], ['ae', 2], ['u', 1.5],
  ],
  /**
   * Stops and sibilants, and very little that is soft.
   *
   * The plosives lead because a rapped syllable is *placed* — the consonant is
   * what lands on the sixteenth and the vowel is what happens afterwards, which
   * is the same relationship a kick has to its own decay. `fricative-sh` and
   * `fricative` are high because the sibilants are the only consonants that
   * survive being mixed under a hi-hat, and `none` is deliberately low: a
   * syllable with no onset has nothing to put on the grid, which is the one
   * thing this delivery cannot afford.
   */
  consonants: [
    ['stop', 5], ['stop-k', 4], ['stop-p', 3.5], ['fricative', 3.5],
    ['fricative-sh', 3], ['liquid-r', 3], ['nasal', 2.5], ['liquid', 2.5],
    ['nasal-m', 2], ['fricative-f', 2], ['fricative-h', 1.5], ['glide', 1.5],
    ['none', 1],
  ],
  // A talker, not a vocoder. See the header for why this table is the right one
  // for the wrong-sounding reason.
  words: WORD_STYLES.machine!,
  signature: 'male',
  delivery: 'talk-sing',
  // D3. A speaking voice, and not a comfortable singing centre.
  centre: 50,
  /**
   * G2 to E4 — twenty-one semitones, the narrowest range in the project by about
   * an octave. Every other profile here is wide because it has to reach a tune.
   */
  range: [43, 64],
  /**
   * 0.4, the widest here, and the field where the argument about words gets
   * settled by a number.
   *
   * `spread` is how far this voice's vowels may travel between neighbouring
   * syllables, and it is what stops a line coming out as one vowel repeated. A
   * sung idiom wants it low, because a vowel that wanders inside a held note is
   * a singer losing the word. Connected speech does the opposite: consecutive
   * syllables in English land in genuinely different parts of the mouth, four or
   * five times a second, and that motion is a large part of why speech is
   * intelligible at all. Funk sits at 0.28 and calls that tight; this is the
   * other end of the same axis.
   */
  spread: 0.4,
  voice: {
    /**
     * High, at 0.3. `bodyGain` is how much of the unshaped source leaks through
     * under the formant bands, and in a delivery this fast the bands never
     * settle — the mouth is already moving to the next syllable. What is audible
     * between the consonants is mostly body, and turning it down leaves three
     * thin slices and a lot of nothing.
     */
    bodyGain: 0.3,
    // Bright, but under funk's 7000. That voice is shouting over a horn section;
    // this one is close-miked with the band underneath it, which is a different
    // amount of effort and a different amount of top.
    bodyLpf: 6500,
    /**
     * 1.0, the loudest transient in the project, and the one number in this file
     * that is not a compromise. In this idiom **the consonant is the note**: what
     * lands on the sixteenth is the plosive, and the pitch that follows it is
     * almost incidental. A soft onset here does not sound gentle, it sounds late.
     */
    burstGain: 1.0,
    /**
     * A syllable every sixteenth — the fastest in the project, a third quicker
     * than funk's 0.375 and twice anything sung. The rate is set by the hi-hat
     * rather than by the breath, which is why it is a fixed subdivision and not
     * a rate per second: at 90 BPM this is six syllables to the second, which is
     * the top of what a person does, and at 140 half-time it is what the roll
     * is doing.
     */
    syllableBeats: 0.25,
    blipBeats: 0.16,
    attack: 0.005,
    decay: 0.04,
    sustain: 0.7,
    /**
     * 0.015, the shortest in the project. Funk's 0.02 is described as a singer
     * stopping a note rather than letting it decay; this is a syllable ending
     * because the *next one has started*, which is a shorter event again.
     */
    release: 0.015,
    // Twice funk's. Breath and consonant noise are a large fraction of what is
    // audible in a close-miked spoken line and the mix does not hide them.
    noise: 0.12,
    /**
     * Effectively off. Vibrato is a thing that happens to a note being *held*,
     * and nothing in this delivery is held — the longest event here is a
     * quarter-note at the end of a phrase. A vibrato under a rapped line reads
     * as a singer who has wandered into the wrong session.
     */
    vibRate: 5.5,
    vibDepth: 0.015,
    /**
     * Small and fast. Speech does approach its pitches from below, which is why
     * this is not zero — but it arrives in about twenty milliseconds, where a
     * singer's scoop is a gesture lasting most of a beat. At six syllables a
     * second anything longer would smear each onset into the one in front of it.
     */
    scoop: 0.3,
    scoopTime: 0.02,
  },
};
