/**
 * How this music sings.
 *
 * ## The honest thing first: half of it is not pitched at all
 *
 * This genre has two vocal traditions and only one of them is a *melody*. On one
 * side is the wail — Halford, Dickinson, Kiske, Tate — a tenor pushed to the top
 * of its range and held there, which is a sung line by any definition and is
 * closer to bel canto than to rock. On the other is the growl and the shriek,
 * which is a **noise source rather than a pitch**: a death metal vocal is
 * false-fold phonation with the actual vocal folds barely involved, and its
 * spectrum is broadband with no identifiable fundamental. There is nothing in
 * this engine that produces it. `VoiceSettings` has a `noise` term and it mixes
 * noise *into* a pitched source; it cannot make a source that has no pitch.
 *
 * So the profile below is the sung tradition, and the extreme half is
 * unrepresented rather than approximated. Turning `noise` up to 0.6 and calling it
 * a growl would produce a hoarse tenor, which is not the sound and is worse than
 * the absence because it looks deliberate. What is here instead is `noise: 0.16`,
 * roughly twice iskelmä's, which is a voice with rasp in it — the Bon Scott and
 * Lemmy end, which is genuinely pitched and genuinely rough and is the furthest
 * along that axis this engine can honestly go.
 *
 * ## `signature: 'tenor'`, and it is the one everybody argues about
 *
 * The instinct is `low-male`, and it is wrong for the same reason it would be
 * wrong for funk: this is a voice competing with two distorted guitars, and a
 * distorted guitar owns 200 Hz to 3 kHz completely. A baritone lives inside that
 * and disappears; a tenor at the top of its range sits *above* the guitars where
 * there is nothing else, which is not a stylistic preference but the reason the
 * genre's most famous singers all sing where they do. The signature's own gloss
 * is "the voice that carries over a band", and this is a band that needs carrying
 * over more than most.
 *
 * ## The words are `machine`, and the name is the wrong thing to read
 *
 * Four invented languages exist in `style/vocals.ts` and none of them is this
 * one. Choosing by name gives `machine` to industrial and nothing to anybody
 * else; choosing by *shape* — which is what the renderer consumes — gives it to
 * the whole genre, and the shape is right on every count that matters:
 *
 *  - **The shortest words in the file**, one to three syllables at weight, which
 *    is what a line sung at 200 BPM over sixteenth-note guitars has room for.
 *  - **`codaDensity: 0.55`, the highest anywhere.** Metal English closes its
 *    syllables hard and lands the consonant on the beat — the final /t/ of a
 *    shouted word is a rhythmic event, and a language that left it off would be
 *    singing a different music.
 *  - **The widest onset inventory**, fourteen consonants including the voiced
 *    stops and the sibilants, because there is nothing this delivery avoids.
 *
 * What `machine` is not right about is that it is a *vocoder's* alphabet — it was
 * built for a synthesised talker and its distribution is flatter than a person's.
 * The consonant table below leans it back toward the plosives and the sibilants,
 * which is where a shouted English line actually concentrates, and that is the
 * compromise available without writing a fifth language into a file this genre
 * does not own.
 *
 * ## And the delivery is `syllabic`
 *
 * Not `sung`, which joins syllables inside a word, and emphatically not `ballad`,
 * which is one line to a breath with the ends held. A metal vocal is one syllable
 * per note with a gap after it: the words are *hit* rather than sung through, and
 * at these tempos a legato inside a word would smear two notes of a riff-doubling
 * line into one. Funk's profile reaches `syllabic` from the opposite direction and
 * for the same physical reason, which is worth noticing — both are voices working
 * against a rhythm section that is already full.
 */

import { WORD_STYLES, type VocalProfile } from '../../style/vocals.js';

export const VOCALS: VocalProfile = {
  name: 'voice',
  /**
   * 85 — Lead 6 (voice) — for the shipping MIDI render.
   *
   * Not 52 Choir Aahs, which is what the two genres with actual harmony singing
   * use. There is one person on the microphone here and a choir patch would stage
   * a section that is not in the room; the synthesised-voice lead is a single
   * line with an edge on it, which is at least the right count and the right
   * attack.
   */
  gm: 85,
  /**
   * A sawtooth, and the headroom argument runs the other way from reggae's.
   *
   * A square delivers about 5 dB more average level for the same peak, which is
   * exactly what a voice mixed *under* the band needs. This one is mixed on top
   * of it and has room, and what it wants instead is the saw's odd-and-even
   * harmonic series — a fuller spectrum that survives being sat next to two
   * guitars whose own spectrum has holes in it.
   */
  strudel: 'sawtooth',
  /**
   * In front, and higher than every genre here except the two that are about
   * singing.
   *
   * This is the layer the record is sold on. A metal mix puts the voice clearly
   * above the guitars — audibly, unfashionably above them — because the guitars
   * are a single wide object and anything not distinctly in front of it is inside
   * it. 0.96 against a comp at 0.9 in `index.ts` is about three decibels, which
   * is where these mixes actually sit.
   */
  gain: 0.96,
  /**
   * Open and forward, with no rounded vowels at all.
   *
   * A shouted vowel is an open one: the mouth is wide and the larynx is high, so
   * the first formant is up and the second is not far behind it, and `a` and `ae`
   * do most of the work. `oe` and `ue` are absent entirely — a front-rounded
   * vowel needs a small lip aperture, which is the opposite of the gesture this
   * whole delivery is made of. `i` is here at a real weight because the top of a
   * tenor's range is where /i/ stops being a vowel and becomes a scream, and that
   * is a real thing singers in this genre do on purpose.
   */
  vowels: [
    ['a', 5], ['ae', 4], ['e', 3.5], ['o', 3], ['i', 3], ['aa', 2], ['uh', 1.5],
  ],
  /**
   * Plosives and sibilants at the top, and the nasals well down — the exact
   * inverse of reggae's table, which is the useful way to read it.
   *
   * That genre wants an onset that lands softly on an offbeat; this one wants an
   * onset that *starts a note* against a wall of guitar, and the only consonants
   * with a transient sharp enough to do that are the stops and the fricatives.
   * `none` is at 1 and effectively absent: a syllable that opens on nothing has
   * no attack, and a line of them disappears into the mix entirely.
   *
   * `fricative-h` is up rather than down, unusually. Aspiration is how a pushed
   * voice starts a note at the top of its range — the breath arrives before the
   * pitch does — and it is audible on every one of these records.
   */
  consonants: [
    ['stop', 5], ['stop-k', 4.5], ['fricative', 4], ['stop-p', 3.5],
    ['fricative-sh', 3], ['liquid-r', 3], ['fricative-f', 2.5],
    ['nasal', 2.2], ['liquid', 2], ['fricative-h', 2], ['nasal-m', 1.6],
    ['glide', 1.2], ['none', 1],
  ],
  words: WORD_STYLES.machine!,
  signature: 'tenor',
  delivery: 'syllabic',
  /**
   * Two semitones above middle C, which is high, and the range runs a fifth
   * higher than any other male lead in the project.
   *
   * G2 to C6 is not a boast about the singer, it is where the parts are written:
   * the verse of a metal song sits low and conversational and the chorus is an
   * octave above it, and a range that could not hold both would flatten the one
   * gesture the vocal arrangement has.
   */
  centre: 62,
  range: [43, 84],
  spread: 0.34,
  voice: {
    bodyGain: 0.2,
    bodyLpf: 6800,
    /**
     * The loudest consonant bursts in the project, and they are doing rhythmic
     * work rather than linguistic work.
     *
     * Reggae argues 0.75 as the ceiling before a line turns into a percussion
     * part. Here it turning into a percussion part is the intention: a syllable
     * landing with the kick is what makes a metal vocal lock to a riff rather
     * than float over it, and the whole reason the delivery is `syllabic` is to
     * give each of those bursts a gap to land in.
     */
    burstGain: 0.95,
    /**
     * Half a beat, sounding for a shade over two thirds of it.
     *
     * Both numbers are chosen against the Strudel renderer's sixteenth grid,
     * where beats round to quarter-beats: 0.5 is two slots and 0.36 rounds to
     * one, so one slot in two is silence and the re-attack survives quantisation.
     * At 0.45 or above the gap rounds away and the line becomes a held pad, which
     * is the failure iskelmä's profile documents at the other end of the tempo
     * range and is much easier to fall into here, where the tempo band is twice
     * as wide.
     */
    syllableBeats: 0.5,
    blipBeats: 0.36,
    // Twelve milliseconds — faster than any other voice here. A shouted syllable
    // is at full level almost immediately; anything slower reads as a swell, and
    // a swell in front of a downpicked riff arrives late.
    attack: 0.012,
    decay: 0.07,
    sustain: 0.88,
    release: 0.05,
    // Twice iskelmä's, and the furthest along the rasp axis this engine honestly
    // goes. See the header for what is on the other side of it and why nothing
    // here is pretending to reach it.
    noise: 0.16,
    /**
     * Fast and wide, which is the operatic end of this genre rather than the
     * rock end.
     *
     * 6.2 Hz at 0.3 depth is roughly a trained singer's vibrato and it is
     * deliberately not a crooner's — the held note at the end of a metal chorus
     * is *sustained under pressure*, and the wobble is the audible evidence of
     * that pressure. It is also the one thing that makes a long note at the top
     * of the range read as a person rather than as an oscillator.
     */
    vibRate: 6.2,
    vibDepth: 0.3,
    // A short scoop rather than a full one. The note is attacked from below and
    // arrives fast; a long slide up is a blues gesture and this genre took the
    // volume from the blues and left the phrasing behind.
    scoop: 0.55,
    scoopTime: 0.035,
  },
};
