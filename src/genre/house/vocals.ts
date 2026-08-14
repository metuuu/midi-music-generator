/**
 * How house sings: somebody else did, and it was cut into a two-bar loop.
 *
 * Every other sung profile in this project is an attempt at a person in a room.
 * This one is an attempt at a person **on a tape somebody else made**, and almost
 * every number below follows from that one fact rather than from any opinion
 * about the singer.
 *
 * The archetype is real and it is specific: a gospel-trained contralto or mezzo,
 * usually a church singer, usually paid a session fee and usually uncredited,
 * who sang four bars in a studio in New Jersey and never met the record. Her
 * phrase is then *treated as an instrument* — chopped at the bar, pitched to fit
 * whatever key the track turned out to be in, and repeated until the record ends.
 * That is not an insult to the singer; it is the compositional method, and it is
 * why the vocal in this genre behaves so differently from pop's, which is a
 * performance of a lyric from the first bar to the last.
 *
 * ## What comes out of that, field by field
 *
 * **`gm: 53`, Voice Oohs, rather than 52 or 85.** The thing on a house record's
 * vocal track is more often a wordless hook than a sentence, and where there are
 * words there are usually four of them. A choir patch is a mass of people, which
 * is the church this voice came out of rather than the record; a synth lead is a
 * vocoder, which is the genre next door. 53 is one voice, open, on a vowel, which
 * is the honest description.
 *
 * **`delivery: 'sung'` and `signature: 'female'`**, neither of which is a
 * compromise. This is the one genre in the project where the archetype is
 * unambiguous enough that hedging would be less accurate than choosing.
 *
 * **`spread: 0.55`, the highest of the sung profiles.** Vowel motion is high
 * because this singer is *melismatic*: a gospel line moves through three or four
 * vowels on one syllable, and a profile that let consecutive syllables sit on
 * neighbouring vowels would produce the flat, placed delivery of a pop lead. The
 * one thing a house vocal is never is placed.
 *
 * **`scoop: 0.7`, the deepest here.** The approach from below is what a trained
 * church singer does to every long note without deciding to, and it is the single
 * loudest "this is a person" cue the renderer has. Pop's own profile sets 0.35
 * and says why — from about 1990 the note is put on the grid and corrected — and
 * this genre is the counter-example inside the same decades: nobody tuned a house
 * vocal, because the whole reason for hiring that singer was that she did not
 * need it.
 *
 * ## The one thing this profile cannot say, and it is the important one
 *
 * The vocal layer is defined as *the melody doubled* — `generate/drop.ts` says so
 * in as many words when it excludes `vocal` from `DropLayer`: it "has no onset
 * the melody did not have". That is right for every genre in the catalogue and it
 * is wrong here in a specific way. **A house vocal is a two-bar phrase looped
 * against an eight-bar chord cycle**, which means it is deliberately *out of
 * phase* with the harmony under it — the same sung line lands on `i` this time
 * round and on `VI` the next, and the fact that it fits both is the record's whole
 * trick. There is no way to say that. The line doubles the tune, in phase, for as
 * long as the tune runs.
 *
 * `CompPattern.cycle` is exactly the mechanism this wants — a figure whose length
 * is not the bar — and it exists on the comp, the bass, the counter and the kit
 * and not on the voice. Named here rather than discovered later; it is in
 * `index.ts` under what the engine could not express.
 */

import { WORD_STYLES, type VocalProfile } from '../../style/vocals.js';

export const VOCALS: VocalProfile = {
  name: 'garage vocal',
  // 53 — Voice Oohs. See the header.
  gm: 53,
  strudel: 'gm_voice_oohs',
  /**
   * 0.9, and it is above the lead rather than level with it.
   *
   * The mix table in `index.ts` puts the melody at 0.68, which is low for a lead
   * and argued there: in an instrumental house record the "tune" is a stab, and a
   * stab that dominates is a different genre. But on the nights there is a
   * singer, the singer is the record — a garage twelve-inch is sold on the vocal
   * and the track is what it is sung over. So this is the one layer in the genre
   * allowed in front of everything else, and it is only present when asked for.
   */
  gain: 0.9,
  /**
   * Open and back-leaning, with the front vowels present rather than prominent.
   *
   * `a` and `o` at the top because this voice's characteristic sound is a long
   * open vowel held across a bar and bent through three notes on the way, which
   * needs somewhere for the jaw to be. `ae` is here at 2 and doing the job it
   * does in pop — the flattened front vowel is most of what makes a sung line
   * read as English — and `i` is deliberately below it: a gospel melisma sits in
   * the open half of the mouth and passes through the closed vowels rather than
   * resting on them.
   */
  vowels: [
    ['a', 5], ['o', 4], ['e', 3.5], ['aa', 3], ['ae', 2], ['u', 2], ['i', 1.5],
  ],
  /**
   * Soft onsets, and one hard one kept at real weight.
   *
   * Nasals and liquids lead because this line is *legato by construction* — it
   * ties across syllables constantly, and `none` at 3 says the same thing from
   * the other side: a syllable with no onset at all is what a held vowel running
   * into the next word sounds like, and this voice does that more than any other
   * in the project.
   *
   * `fricative-h` is the entry that is unusually high, at 2.5 against pop's 1.5,
   * and it is not a spelling accident. An aspirated onset — the audible breath
   * before a note that a church singer puts in on purpose — is one of the two or
   * three things that identify this delivery, and it is the only consonant in the
   * table that is a *performance* rather than a letter.
   */
  consonants: [
    ['nasal', 4], ['liquid', 4], ['none', 3], ['nasal-m', 3], ['liquid-r', 3],
    ['glide', 2.8], ['fricative-h', 2.5], ['stop', 2.5], ['fricative', 2.2],
    ['stop-p', 1.8], ['fricative-sh', 1.6], ['stop-k', 1.4], ['fricative-f', 1],
  ],
  words: WORD_STYLES.scat!,
  signature: 'female',
  delivery: 'sung',
  /**
   * A above middle C — the highest centre in the project.
   *
   * `centre` is documented as the pitch the voice is *not* straining at, and this
   * one is not straining high up because that is where the job was. A house
   * vocal has to cut through a mix whose bottom two octaves are already
   * completely spoken for by a kick and a sub, so the singer was hired for a
   * register nothing else in the arrangement occupies.
   */
  centre: 69,
  /** F3 to D6. Wide, and the top of it is real: the ad-lib above the last chorus
   * of a garage record goes places a pop lead does not. */
  range: [53, 86],
  spread: 0.55,
  voice: {
    /**
     * 0.2, above every other sung profile here.
     *
     * `bodyGain` is the unshaped source leaking through under the formants, and
     * everywhere else it is held down because it costs vowel contrast. This voice
     * wants some of it back: a chest-voice gospel note has a great deal of energy
     * below the first formant, and a profile that filters all of it out produces
     * a thin, breathy singer — which is the one thing this archetype is not.
     */
    bodyGain: 0.2,
    bodyLpf: 7200,
    /** Middling. The consonant has to be audible over a kick and a hat pattern
     * without becoming a percussion part in its own right. */
    burstGain: 0.5,
    /**
     * Slow — 0.7 of a beat a syllable, sounding for two of its three quarter-beat
     * slots on the renderer's grid.
     *
     * The slowest of the sung profiles here, and the reason is arithmetic rather
     * than taste. This music runs at 120–135 BPM against pop's 90–120, so a
     * syllable rate that *looks* leisurely is producing about the same number of
     * words per second as a pop lead does. Set to pop's 0.55 the line comes out
     * as patter, which is a rap delivery on a singer's voice.
     */
    syllableBeats: 0.7,
    blipBeats: 0.5,
    /** A church singer leans into a note rather than placing it. Slower than
     * pop's 18 ms and much slower than a machine's four. */
    attack: 0.03,
    decay: 0.08,
    sustain: 0.92,
    release: 0.12,
    /** Audible. Nobody de-essed these records and nobody wanted to — the breath
     * before the phrase is part of what was being bought. */
    noise: 0.09,
    /** 5.4 Hz at 0.26 — a trained spin rather than a decoration on the end of a
     * held note, which is what pop's 6 Hz at 0.14 describes. */
    vibRate: 5.4,
    vibDepth: 0.26,
    formantTrack: 1,
    /** The deepest scoop in the project. See the header. */
    scoop: 0.7,
    scoopTime: 0.07,
  },
};
