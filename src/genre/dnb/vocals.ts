/**
 * How drum and bass sings, and the one place in this project where the engine's
 * limitation is the idiom.
 *
 * ## There are two voices in this music and the engine can only be one of them
 *
 * **The MC** is a person with a microphone talking over a record in a room. They
 * are not on the record — they are on the *night* — and there is no object for
 * them anywhere in this project: `Genre.vocals` casts a singer as a doubling of
 * an instrumental line, and there is no `Archetype` for somebody holding a
 * microphone and nothing else. `docs/engine-gaps.md` §3.20 states the want and
 * hiphop reported it first about a rapper. This genre's version is worse in one
 * specific respect and better in another: worse because the MC is a *live-only*
 * role, so a genre that generates records rather than nights loses them
 * entirely; better because a drum and bass record with no MC on it is the normal
 * object rather than the B-side.
 *
 * **The other voice is a sampled soul vocal, chopped into vowels.** A phrase is
 * lifted off a seventies record, cut at the syllable, pitched to the key and
 * triggered — so what is heard is a person's voice with the *words* removed by
 * the editing rather than by any failure to write them. It is vowel-led, it
 * holds, it has almost no consonant attack, and it moves in long slow arcs
 * because that is what survives being stretched.
 *
 * That second description is a description of **this engine's voice**. Every
 * other genre in this project has had to write down what the wordless
 * vowel-and-melisma singer costs it; here it costs nothing, because the thing
 * the machinery cannot do — carry meaning in words — is the thing a chopped
 * vocal has already had taken away from it before anybody sampled it.
 *
 * ## The three decisions that follow from that
 *
 * **`words: WORD_STYLES.airy`, and not `machine`.** hiphop takes `machine` and
 * argues for it well: the widest consonant inventory in the file, the shortest
 * words and the most closed syllables, because rapped English is consonant
 * clusters and monosyllables. Every one of those properties is wrong here. A
 * chopped vocal is `airy`'s six soft onsets, its 15% coda chance and its 55%
 * long-vowel chance, because a sample cut at a consonant clicks and a sample cut
 * at a vowel does not — which is an editing fact before it is an aesthetic one.
 *
 * **`delivery: 'sung'`**, not `talk-sing` and not `syllabic`. `talk-sing` is the
 * MC and the MC is not on the record. `syllabic` puts a gap after every syllable,
 * which is the blipped sound the engine makes by default and is exactly what a
 * *badly* chopped vocal sounds like. `sung` joins inside each word and lets a
 * syllable run across a note, which is the thing a producer is buying when they
 * sample four bars of somebody's chorus.
 *
 * **`signature: 'female'` and a high centre.** The register is not a preference.
 * The vocals sampled into this genre are overwhelmingly female and
 * overwhelmingly from soul records, and the practical reason is arithmetic: this
 * music leaves the bottom four octaves entirely to the sub and the kick, so
 * anything sung has to live above them or it is inaudible. `centre: 69` is A4.
 *
 * ## What could not be asked for
 *
 * **A way to say the voice is a *sample*.** Everything above describes a chopped
 * recording and all of it is spelled as settings on a synthesised singer, so
 * what comes out is a voice performing the contour of a chop rather than a chop.
 * The nearest real want is small and concrete: a chopped vocal *retriggers the
 * same fragment* — one syllable, four times, on four different pitches — and
 * `VocalProfile` has no field that makes a syllable repeat. `spread` at 0.12
 * below is the closest available statement, and it says "these vowels barely
 * move", which is a consequence of the technique rather than the technique.
 */

import { WORD_STYLES, type VocalProfile } from '../../style/vocals.js';

export const VOCALS: VocalProfile = {
  name: 'voice',
  /**
   * 53 — Voice Oohs rather than 85 Lead 6. A chopped vocal is a held vowel with
   * the attack cut off it, and of the three voice programmes GM has, that is the
   * one that opens slowly. hiphop takes 85 because a rapped line has to
   * articulate at sixteenth-note speed; nothing here articulates at all.
   */
  gm: 53,
  strudel: 'voice',
  /**
   * 0.72, and it is well below hiphop's 0.98 for a reason that is the whole
   * difference between the two genres' voices. There the singer is the subject
   * and everything else is accompaniment. Here the voice is a *sample in the
   * arrangement*, sitting between the pad and the melody, and a chopped vocal
   * mixed to the front stops being a texture and starts being a guest artist.
   */
  gain: 0.72,
  /**
   * Open and back-led, which is what survives a time-stretch.
   *
   * `aa` and `o` lead because a resampled vowel keeps its formants and loses its
   * transitions, and the two open vowels are the ones whose formants are furthest
   * apart and therefore the ones still recognisable after the pitch has been
   * dragged a fourth. `i` and `e` are low for the same reason inverted: a close
   * front vowel stretched by 30% is a whistle.
   */
  vowels: [
    ['aa', 5], ['o', 4], ['a', 3.5], ['u', 3], ['uh', 2.5], ['e', 2], ['oe', 1.5], ['i', 1],
  ],
  /**
   * Almost nothing. Six entries and four of them are nasals or liquids.
   *
   * This is the shortest consonant list any genre in the project declares and it
   * is a statement about the edit rather than about the singer. **A sample cut at
   * a plosive clicks.** The producer cutting four bars of somebody's chorus into
   * sixteen pieces puts every cut point on a vowel or a nasal, because those are
   * the only places where a fragment can start without a transient announcing
   * that it was cut — so the consonants that survive into the finished record are
   * exactly the ones that do not stop the airflow.
   */
  consonants: [
    ['nasal-m', 4], ['liquid', 3.5], ['nasal', 3], ['liquid-r', 2.5],
    ['fricative-h', 2], ['none', 2], ['glide', 1.5], ['fricative', 1],
  ],
  // Six soft onsets, a coda on one syllable in seven, and long vowels more than
  // half the time. See the header — this is an editing constraint written as a
  // syllabary.
  words: WORD_STYLES.airy!,
  signature: 'female',
  delivery: 'sung',
  // A4. High, because everything below the fourth octave in this music belongs
  // to the sub and the kick.
  centre: 69,
  /** E3 to E5 — two octaves, sitting entirely above the bass. */
  range: [52, 76],
  /**
   * 0.12, the tightest in the project, and it is the nearest this file gets to
   * saying that the voice is a sample.
   *
   * `spread` is how far the vowels may travel between neighbouring syllables.
   * hiphop sits at 0.4 and argues for it: connected speech lands in genuinely
   * different parts of the mouth four or five times a second, and that motion is
   * most of why speech is intelligible. This is the other end of the same axis
   * and it is not a taste — **a chopped vocal is one fragment retriggered**, so
   * consecutive syllables are frequently the *same vowel* at different pitches.
   * There is no field that says so; a very small spread is the consequence of
   * the technique standing in for the technique.
   */
  spread: 0.12,
  voice: {
    /**
     * 0.22. Lower than hiphop's 0.3, because there the mouth never settles and
     * what is audible between consonants is mostly body; here the vowel is held
     * for most of a beat and the formant bands have time to be the sound.
     */
    bodyGain: 0.22,
    // Dark. A sampled vocal has been through a twelve-bit converter, a low-pass
    // and a time-stretch, and every one of those takes the top off.
    bodyLpf: 5200,
    /**
     * 0.35, and it is the lowest transient of any genre in this project. hiphop
     * runs `burstGain: 1.0` on the argument that in that idiom **the consonant is
     * the note**. This is the exact inverse: the consonant is the thing the
     * editor cut *off*, and a hard onset here would sound like the sample
     * starting rather than like a voice.
     */
    burstGain: 0.35,
    /**
     * A syllable every beat and a half. The slowest in the project, and at 174
     * BPM that is still one every half second — the rate is set by how long a
     * stretched fragment stays convincing rather than by the breath or by the
     * hi-hat.
     */
    syllableBeats: 1.5,
    blipBeats: 0.9,
    attack: 0.05,
    decay: 0.12,
    sustain: 0.85,
    /**
     * 0.2, the longest release here. A chopped vocal is nearly always printed
     * with a reverb tail on it, and the tail is what makes eight of these
     * fragments sound like one phrase rather than like eight fragments.
     */
    release: 0.2,
    noise: 0.05,
    /**
     * Real but slow. The source recordings are soul singers and soul singers use
     * vibrato; what a time-stretch does to it is slow it down, which is why the
     * rate is under five rather than over six.
     */
    vibRate: 4.6,
    vibDepth: 0.05,
    /**
     * A long scoop, and it is the pitch envelope of the sampler rather than of a
     * singer. A fragment triggered at a pitch it was not recorded at arrives
     * from below over about a tenth of a second, because that is what a cheap
     * varispeed does, and it is one of the two or three cues that make a sampled
     * vocal identifiable as one.
     */
    scoop: 0.55,
    scoopTime: 0.09,
  },
};
