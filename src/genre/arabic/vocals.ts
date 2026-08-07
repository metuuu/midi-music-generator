/**
 * How this genre sings.
 *
 * The other eighteen sung profiles in the project sit on one axis — how much
 * consonant there is — and this one is off it, because the question that
 * decides an Arabic vocal is not how the syllable starts but **how long it is
 * allowed to last**. A tarab singer takes one line of text and spends ninety
 * seconds on it: the word arrives, the vowel opens, and then the line moves for
 * a very long time on that one vowel before the next consonant is permitted to
 * happen. `delivery: 'ballad'` is exactly that mechanism and exactly that
 * description — *half the syllable rate, twice the melisma, one long line per
 * breath* — and it is the single field this profile is built around.
 *
 * ## Three vowels, and it is not a simplification
 *
 * Classical Arabic has three vowel phonemes: /a/, /i/ and /u/, each short or
 * long. Not five, and the absence of /e/ and /o/ as *phonemes* is real rather
 * than a rounding — where they appear it is because an adjacent emphatic
 * consonant has backed the vowel that was there, which is an allophone. So the
 * word style below has a three-way harmony that models exactly that: /a/ is
 * neutral and goes anywhere, and the rounded and unrounded sets are the two
 * sides of the emphatic split. The result is a language whose words sit on a
 * narrower vowel palette than any other in the project and whose long syllables
 * are where all the interest is, which is the truth about it.
 *
 * ## And no /p/
 *
 * `stop-p` is absent from the consonant list and it is the one omission worth
 * pointing at. Arabic has no /p/; loans acquire a /b/ instead, which is why the
 * language's own name for the piano is *biano*. The list is a permission list —
 * a letter missing from it is a letter this voice cannot say — so leaving it out
 * is the whole of what it takes to say so.
 */

/**
 * Type-only, and the one profile here that imports no `WORD_STYLES` entry.
 *
 * The five styles in that table are `finnish`, `scat`, `airy`, `machine` and
 * `sargam`, and none of them is a plausible fallback: three of the consonants
 * this voice needs are missing from the Finnish inventory, and the other four
 * are not languages — two syllabaries, an invented one and a set of solfège
 * note names.
 * So this genre carries its own, on the same argument `Staging` makes about
 * rooms — a language belongs to whoever speaks it rather than to the shared
 * file, and a sixth entry over there would be one more table nineteen genre
 * authors have to edit.
 */
import type { VocalProfile, WordStyle } from '../../style/vocals.js';

/**
 * The invented Arabic. Nobody ever sees the words; what the spelling buys is
 * the *shape* — where the consonants fall and how long the vowels are.
 *
 * Roots here are triconsonantal, which is why `lengths` clusters on two and
 * three syllables and `maxSyllables` is four: an Arabic word is a three-letter
 * root poured into a vowel pattern, and both the pattern and the root are short.
 * `codaChance` is at the top of `WORD_STYLES` — level with `machine`'s 0.5 and
 * above the other four — because
 * closed syllables are ordinary here in a way they are not in Finnish, and
 * `longChance` is high for the reason the whole profile exists — a long vowel
 * is where the melisma goes, and a language with no long vowels gives it
 * nowhere to sit.
 */
const ARABIC: WordStyle = {
  // The consonants a romanised Arabic word actually opens on, minus /p/.
  onsets: ['m', 'n', 'l', 'r', 's', 'h', 'b', 'd', 'k', 't', 'w', 'j', 'z', 'š', 'f', 'g'],
  codas: ['n', 'm', 'r', 'l', 'b', 't', 's', 'h'],
  // Three phonemes and the emphatic split. `a` is neutral and is most of the
  // language; the other two sets are the backed and unbacked halves of /i/ and
  // /u/, which is what an emphatic consonant does to the vowel beside it.
  harmony: { back: ['o', 'u'], front: ['e', 'i'], neutral: ['a'] },
  // A word without an opening consonant is a word beginning with a glottal
  // stop, which the phonology counts as a consonant and this engine cannot
  // make. Near enough 1.
  onsetChance: 0.95,
  codaChance: 0.5,
  longChance: 0.5,
  lengths: [2, 2, 3, 3, 4],
  spelling: 0.9,
  onsetDensity: 0.95,
  interiorDensity: 0.85,
  codaDensity: 0.5,
  maxSyllables: 4,
};

export const VOCALS: VocalProfile = {
  name: 'voice',
  /**
   * 85 — Lead 6 (voice), and not 52 or 53.
   *
   * Both of those are *ensemble* patches with detuning baked into the sample:
   * they are several people, which is what ambient wants and is precisely what
   * this is not. There is one singer here, in front of an orchestra, and the
   * whole cultural apparatus of the repertoire is built on there being exactly
   * one. Re-attacking a choir pad at syllable rate produces a wobbling ghost;
   * the solo-voice lead patch at least holds still while the line moves.
   */
  gm: 85,
  // A square, for the headroom reason iskelmä's profile states at length: a
  // square delivers about 5 dB more average level than a saw at the same peak,
  // and this line has to sit over a drum whose low stroke is the loudest thing
  // in the mix.
  strudel: 'square',
  // Above iskelmä's 0.95, which is the loudest of the profiles this project
  // shipped with, and it should be. In this repertoire the ensemble is
  // accompanying a person: the firqa's forty players exist to leave a hole for
  // the singer and to fill it when the singer stops.
  gain: 0.98,
  /**
   * Weighted onto the three phonemes and their long forms. `aa` is å — a long
   * open back vowel — and it carries nearly as much as `a` because it is what
   * a held syllable becomes: the mouth opens as the note is sustained, and a
   * melisma that stayed on a close vowel would be a hum.
   *
   * `e` and `o` are present at low weight rather than absent, because the
   * emphatic allophones are audible even though they are not phonemes, and a
   * palette of three vowels with nothing between them reads as a synthesiser
   * rather than as a language.
   */
  vowels: [
    ['a', 6], ['aa', 5], ['i', 3], ['u', 3], ['e', 2], ['o', 2], ['ae', 1],
  ],
  /**
   * Wide, and wider than any other profile here. Arabic is a consonant-heavy
   * language — the pharyngeals and the emphatics have no equivalent in this
   * synthesis and what stands in for them is a fricative or a stop — so the
   * permission list is nearly the whole table. The weights order the fallbacks
   * rather than the draw; the word's own letters choose first.
   *
   * `stop-p` is the exception and the point. See the header.
   */
  consonants: [
    ['liquid', 5], ['nasal', 4], ['fricative-h', 4], ['stop', 3], ['nasal-m', 3],
    ['liquid-r', 3], ['fricative', 3], ['fricative-sh', 2.5], ['stop-k', 2.5],
    ['glide', 2], ['none', 2], ['fricative-f', 1.5],
  ],
  words: ARABIC,
  /**
   * A mezzo, which is the voice this repertoire is remembered in — and the
   * choice is between two real ones rather than a default. `tenor` is Abdel
   * Halim and Wadih el-Safi and is the other half of the tradition; `female` is
   * Umm Kulthum and Fairuz and is the half that carries the long form, which is
   * what this genre's `wahda` and `tarab` tables are written for.
   *
   * Not `high-female`, whose own gloss is the reason: every vowel migrates
   * toward /a/ at the top. A tarab singer's whole art is that the *word* stays
   * legible through a forty-second melisma, and a tract that erases the vowel
   * at pitch would erase it.
   */
  signature: 'female',
  delivery: 'ballad',
  // A shade below the middle of the range, which is where this singing lives:
  // the drama is in going *up* from a comfortable place, repeatedly, and a
  // voice centred high has nowhere to go.
  centre: 63,
  // E3 to G5. Wider than the iskelmä crooner by half an octave at the top,
  // because the climb is the form.
  range: [52, 79],
  // Large. Consecutive syllables move a long way in the mouth here — the
  // language's own consonants force it — and a small value is what produces the
  // "duu du du" failure the field exists to prevent.
  spread: 0.45,
  voice: {
    bodyGain: 0.2,
    bodyLpf: 5200,
    burstGain: 0.65,
    /**
     * A syllable every beat and a half, which at these tempos is about a
     * second. Slower than iskelmä and much faster than ambient, and the number
     * is the melisma: the syllable is struck once and then the tune keeps
     * moving underneath it, so what the rate controls is not how fast the words
     * come but how many notes each word gets. `delivery: 'ballad'` halves it
     * again on top of this.
     */
    syllableBeats: 1.5,
    blipBeats: 1.3,
    // Struck, not swelled. A note in this idiom is *arrived at* from below and
    // then leaned on, which is the scoop below rather than the attack.
    attack: 0.02,
    decay: 0.14,
    sustain: 0.92,
    release: 0.22,
    noise: 0.06,
    /**
     * Two and a half times iskelmä's depth and half a hertz faster, and it is
     * the genre's signature more than any choice of scale is. A tarab singer's
     * vibrato is a *deliberate* device applied to the end of a held note rather
     * than an involuntary wobble under the whole of it — this engine cannot
     * place it, so it is on throughout at a depth that would be too much on a
     * crooner and is barely enough here.
     */
    vibRate: 5.6,
    vibDepth: 0.3,
    /**
     * A large scoop, and unlike the vibrato this one *is* placeable and lands
     * where it should. Approaching the note from below and
     * sliding onto it is the most audible single gesture in Arabic singing —
     * it is what an `atabah` is made of — and it is also the cheapest "this is
     * a person" cue there is. 1.1 semitones over 180 ms: far enough to hear as
     * a slide rather than as being out of tune, slow enough that the ear
     * follows it up.
     */
    scoop: 1.1,
    scoopTime: 0.18,
  },
};
