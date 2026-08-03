/**
 * How this music sings.
 *
 * The unit is a **trio**, and that is the fact to build the profile around. The
 * Wailers, the Heptones, the Mighty Diamonds, the Abyssinians, the Gladiators:
 * one lead and two harmonies, and the two harmonies are not a decoration on the
 * lead, they are the reason the vocal sounds like this genre and not like soul.
 * `gm: 52` — Choir Aahs — is the honest one-line description for the MIDI render
 * for exactly that reason, where a single-voice patch would be describing a
 * different band.
 *
 * ## The words are `scat`, and the name is the wrong thing to read
 *
 * Four invented languages exist in `style/vocals.ts` and none of them is this one.
 * Choosing between them on their names would give `finnish` for being a language
 * and reject `scat` for being jazz; choosing on their *shapes* gives the opposite
 * answer, and the shape is what the renderer actually consumes:
 *
 *  - **No vowel harmony**, which rules out `finnish` outright. Harmony is one
 *    rule and it is most of what makes a Finnish word sound Finnish; applied
 *    here it would produce words that sound like nothing at all.
 *  - **Short words** — one to three syllables, against `finnish`'s two to four.
 *  - **Onsets on `d`, `b` and `t` before anything else.** Jamaican English stops
 *    its dentals — *the* becomes /de/, *think* becomes /tink/ — so the two
 *    consonants that dominate the onset inventory really are `d` and `t`, which
 *    is what this table already says.
 *  - **`codaDensity: 0.4`**, so three fifths of the syllables the spelling closes
 *    go unclosed. That is the single most characteristic thing about the accent
 *    and this table produces it by accident.
 *
 * What `scat` is *not* right about is that it opens 98% of its syllables on
 * something, where this music holds long open vowels across the offbeat far more
 * than that. `airy` has that and nothing else — nasals and liquids only, no stops
 * at all — and a reggae line with no consonant that bites is a line with nothing
 * landing where the skank is. The consonant table below leans back toward the
 * softer end to recover some of it, which is the compromise available without
 * writing a fifth language into a file this genre does not own.
 *
 * ## And the delivery is `sung`, not `ballad`
 *
 * Iskelmä phrases one line to a breath and holds the ends of them, which is what
 * `ballad` is for. This does not: the syllables sit on the notes, joined inside
 * each word, at roughly three quarters of a beat each — quicker than a crooner and
 * far slower than a jazz singer's — because the line is written against a bar with
 * a hole in the middle of it and every syllable is placed relative to that hole.
 */

import { WORD_STYLES, type VocalProfile } from '../../style/vocals.js';

export const VOCALS: VocalProfile = {
  name: 'voice',
  // 52 — Choir Aahs, for the MIDI render. See above: the unit is three people.
  gm: 52,
  // A square, for the headroom reason iskelmä's profile works out at length: a
  // saw and a square have the same spectral slope, but the square delivers about
  // 5 dB more average level for the same peak, and this line has to fit under 1.0
  // alongside a bass mixed as loud as anything in the project.
  strudel: 'square',
  /**
   * Below the melody it doubles, which is the one number here that disagrees with
   * every other genre in the repo.
   *
   * Iskelmä puts the singer at 0.95 and jazz at 0.9, and both are right: in a pop
   * record and in a club set the voice is the loudest thing in the room. A
   * Jamaican mix is not that. The riddim is the record — that is what makes it
   * versionable at all — and the voice sits *in* it rather than on top of it,
   * which is audible on any of these sides the moment the singer stops and
   * nothing gets louder.
   */
  gain: 0.82,
  /**
   * Open and back, with no front-rounded vowels at all.
   *
   * Iskelmä leans on `oe` and `ue` because Finnish is a front-rounded language.
   * This one has none of them: Jamaican English has a five-vowel system that is
   * closer to Italian than to English, with a long open /a/ doing an enormous
   * amount of work, and a voice built with `ö` in it would be singing in the
   * wrong mouth.
   */
  vowels: [
    ['a', 5], ['o', 4], ['e', 3], ['i', 3], ['aa', 2.5], ['u', 2], ['ae', 1.5],
  ],
  /**
   * Stops and nasals at the top, fricatives at the bottom, and `fricative-h`
   * almost absent.
   *
   * The two rules are the accent's own. *Th*-stopping puts `stop` and `stop-p` at
   * the head of the list where another language would have a fricative; and
   * h-dropping is close to categorical, so the aspirate that iskelmä gives 1.5 is
   * worth 0.6 here. The liquids are high because the alternative — a line whose
   * every syllable begins with a plosive — reads as clipped, and this music is
   * legato inside the word and clipped only between them.
   *
   * Near enough the whole table, because a letter this list omits is a letter the
   * voice cannot say and the words are spelled from a fixed inventory. The weights
   * order the fallbacks rather than the draw.
   */
  consonants: [
    ['stop', 5], ['nasal', 4], ['liquid', 4], ['nasal-m', 3.5], ['none', 3],
    ['stop-p', 3], ['stop-k', 2.5], ['liquid-r', 2.5], ['glide', 2],
    ['fricative', 1.8], ['fricative-sh', 1.5], ['fricative-f', 1.2],
    ['fricative-h', 0.6],
  ],
  words: WORD_STYLES.scat!,
  /**
   * A tenor, and pressed rather than dark.
   *
   * The signature's own gloss is "the voice that carries over a band", which is
   * the job description exactly: this music was made to be played through a stack
   * of speakers in a car park, and a confiding baritone would disappear under the
   * first skank. It is also the honest average of the repertoire's leads, which
   * run from a light high tenor to a full falsetto far more often than they run
   * low.
   */
  signature: 'tenor',
  delivery: 'sung',
  // Middle C and a shade above. High for a male lead, which is the point.
  centre: 61,
  // C3 to F5 — a working tenor with the falsetto top included, because a
  // proportion of these leads genuinely live up there.
  range: [48, 77],
  spread: 0.3,
  voice: {
    bodyGain: 0.15,
    bodyLpf: 5200,
    // Between iskelmä's 0.7 and jazz's harder consonants. The bursts have to be
    // audible — a syllable landing on the offbeat is doing rhythmic work and
    // needs an edge on it — without turning the line into a percussion part,
    // which is what happens above about 0.85 on a voice mixed this far back.
    burstGain: 0.75,
    /**
     * Three quarters of a beat, sounding for two slots of the three.
     *
     * Both numbers are chosen against the Strudel renderer's sixteenth grid,
     * where beats round to quarter-beats: 0.75 is three slots and 0.55 rounds to
     * two, so one slot in three is silence and the re-attack survives
     * quantisation. At 0.62 or above the gap rounds away and the line becomes a
     * held pad, which is the exact failure iskelmä's profile documents at the
     * other end of the tempo range.
     */
    syllableBeats: 0.75,
    blipBeats: 0.55,
    // A syllable reaches full volume in about fifteen milliseconds. Anything
    // slower is a choir patch swelling rather than a person starting a word.
    attack: 0.018,
    decay: 0.1,
    sustain: 0.9,
    release: 0.07,
    noise: 0.07,
    vibRate: 5.4,
    vibDepth: 0.15,
    // A full scoop, and it is doing more work here than in most idioms: a line
    // written against a missing downbeat needs its notes to *arrive*, and the
    // slide up onto the pitch is the strongest cue available that somebody is
    // arriving rather than that a key went down.
    scoop: 1.0,
    scoopTime: 0.06,
  },
};
