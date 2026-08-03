/**
 * How funk sings.
 *
 * A funk vocal is a **percussion part with pitch in it**. The line is the same
 * one the melody engine wrote, as everywhere else in this project, and the whole
 * of this file is about how it is delivered — and here the answer is: short,
 * high, hard on the front of every syllable, and stopped dead rather than
 * released. What the singer is doing rhythmically is what the guitarist is doing
 * rhythmically, and the two are audibly the same instrument.
 *
 * ## Why `scat` and not a table of its own
 *
 * `WORD_STYLES.scat` is a syllabary rather than a language — one- and
 * two-syllable words, hard onsets, and a coda on a third of them — and that is
 * exactly the inventory this idiom uses. Funk vocal vocabulary is *hnh*, *ow*,
 * *hit it*, *good God*: monosyllables with a stop or a fricative on the front,
 * and the phonetic distance between that and a scat syllable is smaller than the
 * distance between either and a sung word. Writing a fifth `WordStyle` to say the
 * same thing with different letters would be a table nobody could tell from the
 * one next to it — see `style/vocals.ts`, which argues that a word style earns a
 * row by being a *language* rather than a setting.
 *
 * What is genuinely different is everything below the words, and it is different
 * in one direction: **shorter**. `syllableBeats` of 0.375 against jazz's 0.5 puts
 * a syllable on every third sixteenth rather than every other one, which is what
 * a line delivered on the grid sounds like; `release` at 0.02 is the shortest in
 * the project, because a funk singer does not let a note die, they stop it.
 *
 * ## The register, and why it is up
 *
 * `centre: 62` and a range topping out at F5. This is the highest voice in the
 * project by a fourth and it is not a preference — the lead vocal in this
 * repertoire lives at the top of a male range and is *straining*, deliberately,
 * because that is where the horn section is and a voice under a four-piece horn
 * section at a comfortable pitch is a voice nobody can hear. `signature: 'tenor'`
 * for the same reason: the tract is short, the formants are up, and the whole
 * effect depends on the listener being able to tell that this is hard work.
 *
 * The scoop stays where jazz has it rather than going further. A voice that
 * reaches a pitch from below is the strongest "this is a person" cue there is,
 * and at this articulation rate a long one would smear into the syllable in front
 * of it — 45 milliseconds is already most of a sixteenth at 110 BPM.
 */

import { WORD_STYLES, type VocalProfile } from '../../style/vocals.js';

export const VOCALS: VocalProfile = {
  name: 'voice',
  /**
   * 85 — Lead 6 (voice) rather than 52 (Choir Aahs), which is what the two
   * other consonant-driven profiles here use. A choir patch is a pad, and this
   * line is not: it has to articulate at sixteenth-note speed, and a `.mid`
   * opened on a choir programme would play this part as a wash.
   */
  gm: 85,
  strudel: 'square',
  /**
   * Level with the loudest thing on the record and slightly above the tune.
   * A funk singer is not being accompanied; they are the front of a rhythm
   * section that is playing at them, and this is the one genre here where the
   * voice would be shouting over the band in the room as well as on the desk.
   */
  gain: 0.95,
  /**
   * Open and forward. `a` leads, where jazz's scat leads with `u` — the
   * difference between "doo" and "hah", which is most of the distance between
   * the two idioms in one vowel. `aa` is unusually high here for the same
   * reason: it is the shape the mouth is in when somebody shouts.
   */
  vowels: [
    ['a', 5], ['aa', 4], ['e', 3], ['uh', 3], ['o', 2.5], ['u', 2], ['i', 1.5],
  ],
  /**
   * Stops and the glottal-adjacent fricatives, and very little else. The
   * characteristic funk syllable opens on an /h/ or on nothing at all and then
   * closes hard — *hnh*, *unh*, *ow* — so `fricative-h` carries real weight
   * here where it is nearly absent from the other three profiles, and `none` is
   * high because a vowel with no onset that is stopped at the end is a whole
   * word in this idiom.
   */
  consonants: [
    ['stop', 5], ['fricative-h', 4], ['none', 4], ['stop-p', 3],
    ['nasal', 2.5], ['nasal-m', 2], ['stop-k', 2], ['fricative', 2],
    ['liquid', 1.5], ['fricative-sh', 1.5], ['glide', 1], ['liquid-r', 1],
  ],
  words: WORD_STYLES.scat!,
  // A high male voice working at the top of its range, articulated to the
  // syllable rather than sung across the phrase. See the header.
  signature: 'tenor',
  delivery: 'syllabic',
  centre: 62,
  // C3 to F5. The widest and the highest in the project, because this line goes
  // from a spoken aside at the bottom to a shout at the top inside one phrase.
  range: [48, 77],
  /**
   * Tighter than jazz's 0.35. Scat gets its character from vowel variety; this
   * gets its character from the consonants and from the rhythm, and a vowel that
   * wanders while the syllables are this short reads as the singer losing the
   * word rather than as colour.
   */
  spread: 0.28,
  voice: {
    bodyGain: 0.2,
    // Brighter than any other voice here. A shouted vowel has energy up where a
    // crooned one has none, and rolling it off at 6 kHz takes away the effort.
    bodyLpf: 7000,
    // The loudest transient in the project. In this idiom the consonant *is* the
    // note — a syllable with a soft onset lands nowhere on a sixteenth grid.
    burstGain: 0.95,
    /**
     * Three sixteenths sounding, one and a half silent, at the renderer's grid.
     * A quarter faster than jazz's scat and twice as fast as anything sung — the
     * line is being delivered on the same grid the guitar is chanking on, and
     * the silence between syllables is where the next one is coming from.
     */
    syllableBeats: 0.375,
    blipBeats: 0.22,
    attack: 0.006,
    decay: 0.05,
    sustain: 0.78,
    // The shortest release in the project. A funk singer does not let a note
    // decay, they stop it — the note ends because the mouth shut, and that
    // closure is as much a rhythmic event as the onset was.
    release: 0.02,
    noise: 0.06,
    // Fast and shallow, which is what a voice under pressure does. A wide slow
    // vibrato is a singer with time, and there is none here.
    vibRate: 6.4,
    vibDepth: 0.06,
    scoop: 0.7,
    scoopTime: 0.045,
  },
};
