/**
 * How Finnish folk sings, which is nothing like how Finnish popular song sings.
 *
 * The two profiles live two folders apart and the contrast is the point, because
 * both are singing invented Finnish and everything else about them differs:
 *
 *                     iskelmä              finnfolk
 *   signature         low-male             female
 *   delivery          ballad               chant
 *   scoop             1.2                  0.15
 *   vibrato depth     0.12                 0.03
 *
 * A tanssilava singer is a crooner: a baritone, one line to a breath, sliding
 * into every note hard enough that removing the slide is audible as wrongness.
 * A runo singer is the opposite of all four of those. The delivery is
 * **chant** — syllables on the grid, subdividing the written notes, because the
 * words are the event and the tune is the vehicle. There is essentially **no
 * scoop**, because a slide into a note is an expressive decision and this
 * singing does not make expressive decisions per note; and there is essentially
 * **no vibrato**, because traditional Nordic singing is straight-toned and the
 * wobble a western-classical ear expects is exactly the thing that is not there.
 * `scoop: 0.15` is not zero only because a human larynx cannot start a pitch
 * from nowhere.
 *
 * **`female`, and it is a fact about the repertoire rather than a casting
 * choice.** The lament is women's music — an itkuvirsi is sung by women at
 * funerals and weddings and by nobody else — the herding calls are women's work
 * by the same division of labour, and the contemporary vocal ensembles that
 * brought Karelian material back are women's groups. The pelimanni dances have
 * no singer at all. So the styles in this genre that *have* a voice are, with
 * one exception, sung by women, and a low male crooner over a kantele drone
 * would be a different genre's singer standing in the wrong room.
 *
 * The vowel table leans harder on `a` than anything else here, and that is the
 * Kalevala metre showing up in the phonetics: the metre's whole substrate is
 * Finnish's back vowels, the vocabulary of the old poetry is full of them, and a
 * runo line is closer to `a`-`a`-`o`-`a` than to anything a pop lyric produces.
 * `WORD_STYLES.finnish` carries the vowel harmony that keeps it honest — the
 * back set and the front set never meet inside a word, which is one rule and is
 * most of what separates a word that sounds Finnish from a word that sounds like
 * nothing.
 */

import { WORD_STYLES, type VocalProfile } from '../../style/vocals.js';

export const VOCALS: VocalProfile = {
  name: 'voice',
  /**
   * 52 — Choir Aahs, where iskelmä takes 53. Not a preference between two
   * approximations: runo singing is genuinely **two people**. The singer states
   * a line and the *puoltaja*, the seconder, repeats it holding the last
   * syllable under the start of the next one, so there is never one voice
   * sounding alone for long. The contemporary end of the genre is four women in
   * unison, which is the same object with more of it. A solo patch would be the
   * one thing this repertoire is not.
   */
  gm: 52,
  /**
   * A square, for the headroom rather than the timbre, and the argument is
   * iskelmä's — a square delivers about 5 dB more average level than a saw at
   * the same peak, which matters because six of these styles have a drum kit
   * that reaches the ceiling on its own. Ambient can afford the saw's richer
   * spectrum because nothing in an ambient mix is loud; three of these eras are
   * a band in a hall.
   */
  strudel: 'square',
  // Just above the melody it doubles. A folk singer is not amplified above the
  // band in three of the four eras and is only barely so in the fourth.
  gain: 0.88,
  /**
   * Open, and back-heavy. See the header: the old poetry is built on Finnish's
   * back vowels and the metre is built on the poetry. `ae` and `oe` are ä and ö
   * and carry the front half of the harmony; `i` is present and small because
   * you do not hold a closed front vowel and this singing holds a great deal.
   */
  vowels: [
    ['a', 6], ['o', 4], ['aa', 3], ['e', 3], ['u', 2.5],
    ['ae', 2.5], ['oe', 2], ['i', 1.5], ['y', 1],
  ],
  /**
   * Near enough the whole table, because the words are spelled in Finnish and a
   * letter omitted here is a letter the voice cannot say. The weights order the
   * fallbacks rather than the draw — see `VocalProfile.consonants`.
   *
   * `liquid-r` sits far higher than it does in iskelmä, and it is the one
   * genuinely *different* number in this list. A tanssilava singer's /r/ is a
   * tap; a runo singer's is rolled, and F3 dropped nearly an octave is what
   * makes it audible as one. Everything else here leans on liquids, nasals and
   * bare vowel onsets, which is what keeps the line from sounding chewed.
   */
  consonants: [
    ['liquid', 5], ['nasal', 4.5], ['none', 4], ['liquid-r', 4], ['nasal-m', 3],
    ['stop', 3], ['stop-k', 2.5], ['fricative-h', 2], ['glide', 1.5],
    ['fricative', 1.2], ['stop-p', 1], ['fricative-f', 0.6],
  ],
  words: WORD_STYLES.finnish!,
  // See the header: the repertoire that has a singer in it is, with one
  // exception, sung by women, and the exception is the rekilaulu.
  signature: 'female',
  // Syllables on the grid, subdividing the written note. The words are the
  // event; a rubato that stretched them would be a performance of the tune.
  delivery: 'chant',
  // E4. A folk singer sits in chest voice and stays there — this is not a
  // trained instrument and the top of it is not where it lives.
  centre: 64,
  // G3 to E5. Narrow at the top on purpose: an unamplified singer in a wooden
  // room does not go above the staff, and the tunes never ask.
  range: [55, 76],
  // A shade under iskelmä's. Finnish vowel harmony already keeps consecutive
  // syllables from landing in the same place in the mouth, so this does not have
  // to work as hard as it does in a language with none.
  spread: 0.26,
  voice: {
    bodyGain: 0.16,
    bodyLpf: 5200,
    // Between iskelmä's 0.7 and ambient's 0.35. There are real consonants in
    // this singing — it is speech that happens to be pitched — but a burst on
    // every syllable of a Kalevala line is eight of them a bar.
    burstGain: 0.6,
    // A syllable a beat, sounding for three sixteenths of it, which is iskelmä's
    // arithmetic and survives the renderer's grid for the reason stated there:
    // 0.72 rounds to three slots sounding and leaves the fourth silent, where
    // anything from 0.76 up rounds to a full beat and quantises the gap away.
    //
    // Worth saying what this does *not* have to do. A Kalevala line is eight
    // syllables over five beats and most of those notes are already an eighth
    // long, so they take one syllable each without being subdivided at all —
    // the metre does the work and this number only ever applies to the held
    // notes at the end of a line.
    syllableBeats: 1,
    blipBeats: 0.72,
    // A spoken attack. Faster than iskelmä's and far faster than ambient's,
    // because a chanted syllable starts the way a said one does.
    attack: 0.012,
    decay: 0.08,
    sustain: 0.92,
    release: 0.05,
    // Breath, and slightly more of it than a crooner has: this is an untrained
    // voice in a room rather than a microphone technique.
    noise: 0.08,
    // Straight-toned, and this is the number the header is about. Not zero —
    // no held human note is perfectly steady — but a quarter of iskelmä's, and
    // slow enough that what is left reads as a voice rather than as an effect.
    vibRate: 4.4,
    vibDepth: 0.03,
    // Almost nothing. A crooner slides into every note and a runo singer
    // arrives on them; 0.15 is the physical minimum rather than a gesture.
    scoop: 0.15,
    scoopTime: 0.03,
  },
};
