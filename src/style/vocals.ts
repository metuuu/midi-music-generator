/**
 * Wordless vocal vocabulary.
 *
 * The line the voice sings is the melody the generator already wrote — this
 * file is only concerned with *how* it is sung: which vowels, how often they
 * change, and how the voice is articulated.
 *
 * Nothing here models language. That is the point rather than a shortcut: a
 * wordless voice needs no lyricist, no localisation and no singer, and it sits
 * on the far side of the uncanny valley from synthesised speech. It reads as
 * "someone is singing" without ever claiming to say anything.
 */

import type { Consonant, VoiceSettings, Vowel } from '../core/types.js';
import type { DeliveryId } from './delivery.js';
import type { VoiceSignatureId } from './voices.js';

/**
 * What each consonant does to the start of a syllable.
 *
 * Three independent things carry it, and between them they are enough:
 *
 *  - **How abruptly the vowel arrives.** A /t/ is instant, an /m/ leans in over
 *    seventy milliseconds. That is manner, and it was all this table used to
 *    have.
 *  - **What noise precedes it, and what shape that noise is.** Not just a
 *    centre frequency — a width and a level too, because the difference between
 *    /s/ and /f/ is almost entirely that /s/ is a loud focused hiss and /f/ is a
 *    quiet one with no centre at all. Given the same band and level they are the
 *    same sound, which is how four manners came to read as one consonant.
 *  - **Where the tract is while it is being made** — the locus. This is the cue
 *    that carries *place*, and it does more work than the burst: the ear reads
 *    /b/ /d/ /g/ apart mostly from which way the formants move as the vowel
 *    starts, not from the click itself. Cheap here, because the cascade is
 *    already being automated per syllable.
 *
 * Numbers are the conventional measured ones — Delattre's loci, Klatt's burst
 * bands — rather than tuned by ear, because they are a description of a mouth
 * and the mouth is not a matter of taste.
 */
export interface ConsonantShape {
  /** How fast the vowel itself comes in, seconds. */
  attack: number;
  /** Centre frequency of the noise burst in Hz. Zero means no burst. */
  burstFreq: number;
  /** How long the burst lasts, seconds. */
  burstDecay: number;
  /**
   * How focused the burst is. Around 3 is a sibilant you could pick out of a
   * mix; below 1 is a rush of air with no pitch to it, which is what /f/ and
   * /h/ are and why they cannot be told apart from /s/ at the same width.
   */
  burstQ: number;
  /**
   * How far before the vowel the noise starts, seconds.
   *
   * A fricative leads — the hiss is most of the sound and the folds have not
   * started yet. A stop does not: the release of the closure *is* the start of
   * the vowel.
   */
  burstLead: number;
  /** Burst level relative to a sibilant. /f/ and /h/ are genuinely quiet. */
  burstGain: number;
  /**
   * Where the first three formants sit while the consonant is being made, in Hz
   * — the place of articulation, as something the tract can be set to. Absent
   * for a consonant that does not shape it.
   */
  locus?: readonly [number, number, number];
  /**
   * Centre of the nasal anti-resonance in Hz, or 0 for a consonant that is not
   * nasal. The mouth is a closed side branch during a murmur and cancels a band
   * outright; *where* it cancels is the difference between /m/ and /n/.
   */
  nasalZero: number;
}

/**
 * The inventory.
 *
 * Read down the `burstFreq` and `locus` columns rather than across the rows:
 * the three stops share a manner and differ only in place, and that difference
 * is the entire point of the table having been widened.
 *
 * The five original entries keep their original `attack`, `burstFreq` and
 * `burstDecay` to the digit. Those three are what the Strudel renderer and the
 * concert visemes read, so the shipping song sounds and looks exactly as it did
 * — everything new here is either a new consonant or a field only the Web Audio
 * voice consults.
 */
export const CONSONANTS: Record<Consonant, ConsonantShape> = {
  // Bare vowel onset. Quick, but not as instant as a stop.
  none: { attack: 0.015, burstFreq: 0, burstDecay: 0, burstQ: 1, burstLead: 0, burstGain: 0, nasalZero: 0 },

  // --- stops: a closure, then a click, then the vowel with no ramp at all ---
  // Alveolar. The highest and sharpest of the three, and the tongue tip is at
  // the ridge, so the vowel transitions down out of a high F2.
  stop: {
    attack: 0.003, burstFreq: 3200, burstDecay: 0.022, burstQ: 1.1, burstLead: 0, burstGain: 0.9,
    locus: [350, 1800, 2700], nasalZero: 0,
  },
  // Labial. Low, diffuse and quiet — the lips are a poor resonator and there is
  // no cavity in front of them to ring. Everything transitions *up* out of it.
  'stop-p': {
    attack: 0.004, burstFreq: 900, burstDecay: 0.012, burstQ: 0.5, burstLead: 0, burstGain: 0.55,
    locus: [300, 800, 2200], nasalZero: 0,
  },
  // Velar. Compact: the burst is a narrow mid band rather than a spread, and F2
  // and F3 come together behind it — the velar pinch, which is the cue.
  'stop-k': {
    attack: 0.005, burstFreq: 1800, burstDecay: 0.03, burstQ: 2.6, burstLead: 0, burstGain: 0.8,
    locus: [300, 1900, 2200], nasalZero: 0,
  },

  // --- fricatives: noise first, and the vowel follows it -------------------
  // Sibilant /s/. The loudest consonant a mouth makes, and the highest.
  fricative: {
    attack: 0.03, burstFreq: 6200, burstDecay: 0.085, burstQ: 2.2, burstLead: 0.05, burstGain: 1,
    locus: [330, 1700, 2600], nasalZero: 0,
  },
  // /š/. The same mechanism with a larger cavity in front of it, so an octave
  // lower and broader — and that octave is all it takes to hear them apart.
  'fricative-sh': {
    attack: 0.032, burstFreq: 2700, burstDecay: 0.095, burstQ: 1.5, burstLead: 0.055, burstGain: 0.95,
    locus: [330, 1800, 2500], nasalZero: 0,
  },
  // /f/ and /v/. Broadband and weak — no cavity, so no resonance, so no centre.
  'fricative-f': {
    attack: 0.028, burstFreq: 1900, burstDecay: 0.07, burstQ: 0.35, burstLead: 0.045, burstGain: 0.4,
    locus: [320, 900, 2200], nasalZero: 0,
  },
  // /h/. Aspiration through a tract already shaped for the vowel behind it, so
  // it is barely filtered here and carries no locus of its own at all.
  'fricative-h': {
    attack: 0.05, burstFreq: 1300, burstDecay: 0.075, burstQ: 0.25, burstLead: 0.05, burstGain: 0.45,
    nasalZero: 0,
  },

  // --- nasals: no burst; the voice swells in through the nose --------------
  // /n/. Alveolar: the closed mouth in front of the seal is short, so it traps
  // and cancels a high band.
  nasal: {
    attack: 0.07, burstFreq: 0, burstDecay: 0, burstQ: 1, burstLead: 0, burstGain: 0,
    locus: [260, 1600, 2600], nasalZero: 1700,
  },
  // /m/. Labial: the whole mouth is the trap, so the cancellation is far lower
  // and the murmur is audibly darker. This is the only cue separating them.
  'nasal-m': {
    attack: 0.07, burstFreq: 0, burstDecay: 0, burstQ: 1, burstLead: 0, burstGain: 0,
    locus: [260, 900, 2200], nasalZero: 850,
  },

  // --- liquids: no burst either, but the tongue is faster than the velum ---
  // /l/. Lateral, F3 held high — a bright consonant despite the low F2.
  liquid: {
    attack: 0.028, burstFreq: 0, burstDecay: 0, burstQ: 1, burstLead: 0, burstGain: 0,
    locus: [360, 1100, 2800], nasalZero: 0,
  },
  // /r/. Same F1 and F2, and F3 dropped nearly an octave. That drop *is* the
  // sound; nothing else about /r/ is distinctive and nothing else is needed.
  'liquid-r': {
    attack: 0.03, burstFreq: 0, burstDecay: 0, burstQ: 1, burstLead: 0, burstGain: 0,
    locus: [360, 1150, 1600], nasalZero: 0,
  },

  // A glide is a vowel gone past too fast to be one: closed, front, and no
  // noise anywhere in it. The quickest onset in the table for that reason.
  glide: {
    attack: 0.02, burstFreq: 0, burstDecay: 0, burstQ: 1, burstLead: 0, burstGain: 0,
    locus: [280, 2300, 3000], nasalZero: 0,
  },
};

/**
 * The first three formants of each vowel, in Hz.
 *
 * A vowel is not a waveform, it is a pair of resonances. The vocal tract is a
 * tube the tongue divides in two, and the two chambers ring at frequencies that
 * depend only on where the tongue sits — F1 falls as the tongue rises, F2 rises
 * as it moves forward. Every vowel any human language uses is a coordinate in
 * that two-dimensional space. F3 carries less identity but its absence is
 * audible as a hollowness, so it is worth the third filter.
 *
 * These are the conventional measured values for an adult male tract, which is
 * also roughly where both of these genres sing.
 */
export const VOWEL_FORMANTS: Record<Vowel, readonly [number, number, number]> = {
  i:  [270, 2290, 3010],
  ue: [270, 1750, 2160],   // ü
  u:  [300,  870, 2240],
  y:  [300, 1750, 2200],
  un: [400, 1050, 2200],   // nasal, approximated by its oral neighbour
  o:  [500,  800, 2450],
  oe: [500, 1500, 2500],   // ö
  on: [500, 1080, 2350],
  e:  [530, 1840, 2480],
  aa: [590,  920, 2540],   // å
  en: [600, 1480, 2450],
  uh: [640, 1190, 2390],
  ae: [660, 1720, 2410],   // æ
  an: [700, 1050, 2500],
  a:  [730, 1090, 2440],
};

/**
 * Bandwidth of each formant in Hz, and its level relative to the first.
 *
 * Held constant across vowels. Both do vary in reality, but far less than the
 * centre frequencies do, and it is the centres that carry the identity — the
 * difference between /a/ and /i/ is entirely in where the resonances sit, not
 * how wide or loud they are.
 */
/**
 * Bandwidth of each formant in Hz.
 *
 * Two to three times wider than the 60–130 Hz a real formant measures, and the
 * reason is that this is an *additive* filter bank rather than a real vocal
 * tract. A tract is resonant: it multiplies the whole spectrum, so a harmonic
 * near a formant is lifted even when none sits exactly on it. Parallel
 * bandpasses only pass what falls inside them — and with a fundamental of
 * 220 Hz the harmonics are 220 Hz apart, so a 110 Hz window catches one or
 * none, at random, depending on the note. The vowel colour flickers with pitch
 * instead of tracking the vowel.
 *
 * Widening past the harmonic spacing makes each band reliably catch one or two
 * harmonics, so the formant is present on every note. Measured over five
 * pitches, widening plus a quieter body lifted the spectral difference between
 * /a/, /u/ and /i/ from 3.5 dB to 6.4 dB — which is the difference between
 * vowels you can hear and vowels that are merely in the data.
 */
export const FORMANT_BANDWIDTHS = [250, 300, 400] as const;

/**
 * Level of each formant band.
 *
 * Upside down compared with a natural vowel spectrum, where F1 is strongest and
 * F2 sits about 7 dB under it. Two reasons, both learned the hard way from a
 * voice that measured as loud as the melody and still could not be heard:
 *
 * The first is structural. This F1 is a resonant *lowpass*, so it passes the
 * fundamental and everything under it, not just a peak at F1 — far more energy
 * than a real first formant contributes, and all of it dark. Left at unity it
 * simply drowns the two bands that carry brightness and vowel identity.
 *
 * The other two:
 *
 *  - **Loudness is spectral, not RMS.** A signal with all its energy under
 *    700 Hz sounds far quieter than one of equal power spread across the
 *    spectrum, because hearing peaks around 2–5 kHz. F1-dominant meant dark,
 *    and dark meant buried, whatever the meter said.
 *  - **F2 is where the vowel lives.** The difference between /a/ and /i/ is
 *    almost entirely F2. Mixing it 8 dB down made every vowel sound the same —
 *    the vowels were being chosen correctly and then thrown away.
 *
 * F3 doubles as the singer's formant: the 2.5–3 kHz peak trained singers use to
 * carry over an orchestra, which is exactly the job here.
 */
export const FORMANT_GAINS = [0.8, 1.6, 2.0] as const;

/**
 * What the whole voice is worth against one instrument.
 *
 * The numbers above are a *balance between the bands*, not a level, and nothing
 * used to convert one into the other. That is why the sung line was far louder
 * than the band: every instrument is emitted as a single part at its track
 * gain, and the voice is emitted as five — a body, three formants and the
 * consonant bursts — whose gains add up to roughly four and a half times the
 * gain the mix asked for. A vocal written as 0.95 on a scale where the melody
 * is 0.85 arrived a good 10 dB above it.
 *
 * A quarter puts the sum back at about the nominal gain, so `VocalProfile.gain`
 * finally means what its documentation claims: a level on the same scale as
 * every other layer's. It multiplies the body, the formants and the bursts
 * alike, because both of those are specified *relative to the voice* — scaling
 * the bands alone would leave the consonants behind as loud as a snare.
 *
 * A native engine that runs its resonators in series will not need this: a
 * cascade colours one signal instead of adding five copies of it.
 */
export const VOICE_MIX = 0.25;


/**
 * How open each vowel is, 0 (closed) … 1 (open) — derived from F1, because
 * that is very nearly a measurement of how far the jaw is dropped.
 *
 * Two musically useful facts fall out of it, and they are the whole reason the
 * generator consults this rather than picking a vowel at random:
 *
 *  - **You sustain on open vowels.** A held note on /i/ is thin and hard to
 *    keep in tune; singers land on /a/ or /o/ for anything long and save the
 *    closed vowels for passing syllables.
 *  - **You cannot keep a closed vowel up high.** Past the top of the staff the
 *    first formant collides with the fundamental and every vowel migrates
 *    toward /a/ whether the singer intends it or not. Classical teaching calls
 *    it vowel modification; ignoring it is the most obvious way a synthetic
 *    voice announces itself, because no human larynx has that option.
 *
 * Computed rather than written out so it cannot drift from the formant table.
 */
export const VOWEL_OPENNESS: Record<Vowel, number> = (() => {
  const f1 = Object.values(VOWEL_FORMANTS).map(([f]) => f);
  const lo = Math.min(...f1);
  const hi = Math.max(...f1);
  return Object.fromEntries(
    Object.entries(VOWEL_FORMANTS).map(([v, [f]]) => [v, (f - lo) / (hi - lo)]),
  ) as Record<Vowel, number>;
})();

/**
 * How far forward each vowel is, 0 (back) … 1 (front) — derived from F2, the
 * other half of the coordinate.
 *
 * Openness alone is not a description of a vowel. /u/ and /i/ are both closed
 * and could hardly sound less alike; what separates them is the tongue being at
 * the back of the mouth or the front of it, which is F2. Together the two axes
 * are the vowel quadrilateral every phonetics textbook draws, and — more to the
 * point here — distance in that plane is very nearly a measure of how different
 * two vowels *sound*. That is what lets the word generator guarantee it never
 * puts two near-identical vowels next to each other.
 *
 * Logarithmic in F2, because pitch perception is: 870 → 1090 Hz is a small step
 * and 1750 → 2290 Hz is a comparable one, though the second spans twice the Hz.
 */
export const VOWEL_FRONTNESS: Record<Vowel, number> = (() => {
  const f2 = Object.values(VOWEL_FORMANTS).map(([, f]) => Math.log2(f));
  const lo = Math.min(...f2);
  const hi = Math.max(...f2);
  return Object.fromEntries(
    Object.entries(VOWEL_FORMANTS).map(([v, [, f]]) => [v, (Math.log2(f) - lo) / (hi - lo)]),
  ) as Record<Vowel, number>;
})();

/**
 * How different two vowels sound, as a distance in the openness/frontness
 * plane. Roughly 0 … 1.4 — /i/ against /a/ is about 1.1, /o/ against /u/ about
 * 0.3, and anything under 0.25 is two names for nearly the same mouth shape.
 */
export function vowelDistance(a: Vowel, b: Vowel): number {
  return Math.hypot(
    VOWEL_OPENNESS[a] - VOWEL_OPENNESS[b],
    VOWEL_FRONTNESS[a] - VOWEL_FRONTNESS[b],
  );
}

/**
 * The invented language this voice sings in.
 *
 * Two halves, and they are separate on purpose. The first says how a *word* is
 * spelled — which letters may open a syllable, which may close one, how the
 * vowels behave. The second says how the resulting string is pronounced, and is
 * handed straight to `generate/phonetics.ts`.
 *
 * **Nobody ever sees the words.** They exist because random syllables are not a
 * lyric: what makes a line sound like language is a small vocabulary reused
 * across a song, the same invented word coming back in the same place. Hashing
 * a *word* is what buys that — identity for free, identical in every chorus.
 * Generate syllables directly and you lose the one thing that makes it sound
 * intentional.
 *
 * Two details in the spelling half are load-bearing rather than decorative:
 *
 *  - **Vowel harmony.** Finnish never mixes `a o u` with `ä ö y` inside a word;
 *    `e` and `i` go with either. One rule, and it is most of what separates a
 *    word that sounds Finnish from a word that sounds like nothing. Languages
 *    without it put every vowel in `neutral` and the same code runs.
 *  - **Geminates fall out for free.** A closed syllable followed by an onset
 *    puts two consonants together, and `kk tt pp ll mm nn ss rr` are exactly the
 *    doubled consonants Finnish is full of. Nothing had to be added for that.
 */
export interface WordStyle {
  /** Letters that may open a syllable. Drawn from flat — the palette weights. */
  onsets: readonly string[];
  /**
   * Letters that may close one.
   *
   * A coda does two things, and which of them a listener gets depends on the
   * renderer: it makes the syllable **heavy**, so it is sung over two slots,
   * and it asks for a closing consonant, which only a voice that can articulate
   * one will sound. Through Strudel a closed syllable therefore arrives as a
   * held vowel — the floating version of the same word rather than a shorter
   * one — and through `web/voice-synth.ts` it arrives closed.
   */
  codas: readonly string[];
  /**
   * The two vowel sets that may not meet inside a word, and the ones that go
   * with either. A language with no harmony leaves `back` and `front` empty.
   */
  harmony: {
    back: readonly string[];
    front: readonly string[];
    neutral: readonly string[];
  };
  /**
   * The syllable each note is *named* by, one entry per semitone above the
   * tonic — or absent, which is every language in this table but one.
   *
   * This is the only field here that is not about spelling a word, and the only
   * place in the whole vocal layer where the *pitch* chooses the syllable
   * instead of the other way round. It exists for sargam. *Sa re ga ma pa dha
   * ni* are not words, they are note names: *sa* is the tonic and *ga* is the
   * third, and a passage that sang *ga* on the fifth would be wrong in a way no
   * listener who knows this music could miss. Nothing else in the engine can get
   * that right, and not for want of tuning — a syllable chosen from a word's
   * letters and a hash is chosen by machinery that does not know, and cannot be
   * told, what note it is about to land on.
   *
   * **Twelve entries, and therefore no scale.** The obvious table is seven long,
   * one per swara, and it would need the rāga in play to turn a note into a
   * degree — which the vocal layer does not have and should not acquire. It does
   * not need it, because the name belongs to the degree and not to the pitch:
   * komal re and shuddha re are both *re*, komal ga and shuddha ga are both
   * *ga*, and tīvra ma is still *ma*. So semitone to name is total, fixed, and
   * the same in every rāga, and writing *re* twice is a much smaller price than
   * carrying a scale down here. It also means a chromatic passing note has a
   * name, which under a seven-entry table it would not.
   *
   * Read by `generate/vocals.ts`, the one place holding a note and a tonic at
   * the same moment, and ignored where the caller cannot say where the tonic is
   * — see `LyricContext.tonic`. A voice that reaches for this must also be able
   * to *say* it: the seven names are seven different places of articulation, and
   * a `VocalProfile.consonants` missing one of them merges two swaras into one
   * syllable.
   */
  degrees?: readonly string[];
  /**
   * Chance the *first* syllable of a word opens on a consonant. Interior
   * syllables always do, and that is not a stylistic choice: a bare interior
   * syllable runs its vowel into the one before it, and the two merge into a
   * single long nucleus. The word would silently come out a syllable shorter
   * than it was built to be.
   */
  onsetChance: number;
  /** Chance a syllable is closed. */
  codaChance: number;
  /** Chance a syllable's vowel is written twice — a long vowel. */
  longChance: number;
  /** Syllables per word, drawn from flat. Repeat an entry to weight it. */
  lengths: readonly number[];

  // --- and how the result is pronounced; see `PhoneticStyle` ---------------
  /** 0 = the letters are ignored and it is a pure hash; 1 = they decide. */
  spelling: number;
  /** Chance a word's first syllable sounds its consonant. */
  onsetDensity: number;
  /** Chance a later one does. */
  interiorDensity: number;
  /**
   * Chance a syllable the spelling closes actually sounds its closing
   * consonant. Only a renderer that can articulate a coda hears the difference;
   * for the rest the syllable keeps its length as a held vowel either way.
   */
  codaDensity: number;
  /** Cap on syllables per word. */
  maxSyllables: number;
}

/**
 * One per genre, named rather than inlined into the profiles.
 *
 * A `VocalProfile` inlines everything else about a voice, and these are the
 * exception because they are the only part that is a *language* rather than a
 * setting — four tables that four profiles point at, instead of four tables
 * written out four times with the vowel harmony subtly different in each.
 */
export const WORD_STYLES: Record<string, WordStyle> = {
  /**
   * Finnish, near enough. Consonants in roughly the frequency order of the real
   * inventory, no initial clusters (native Finnish words have none), and codas
   * from the five consonants that actually close a Finnish syllable.
   */
  finnish: {
    onsets: ['k', 't', 's', 'l', 'm', 'n', 'v', 'r', 'h', 'j', 'p'],
    codas: ['n', 's', 't', 'l', 'r'],
    harmony: { back: ['a', 'o', 'u'], front: ['ä', 'ö', 'y'], neutral: ['e', 'i'] },
    // A quarter of words open on a vowel, which is true of the language and is
    // where `ilta`, `aamu` and `onni` come from.
    onsetChance: 0.75,
    codaChance: 0.35,
    longChance: 0.3,
    lengths: [2, 2, 3, 3, 3, 4],
    spelling: 0.9,
    onsetDensity: 0.92,
    // Measured: this lands 69% of struck syllables on a consonant at 0.7 and
    // 78% at 0.8, against the 81% the wordless draw used to produce. The point
    // of the words was more consonant *variety*, not less consonant, so it sits
    // where the density is unchanged and only the choice of consonant has moved.
    interiorDensity: 0.8,
    codaDensity: 0.45,
    maxSyllables: 4,
  },

  /**
   * Scat. Not a language and not pretending to be one — a syllabary, and a
   * famously small one: doo, bah, dat, shoo, ba-doo-ba. Short words, hard
   * onsets, and `š` because "shoo-bee-doo" is real vocabulary rather than an
   * accident.
   */
  scat: {
    // `j` rather than `y` for the "ya-" onset: `y` is a vowel letter here, so
    // spelling it that way makes a diphthong rather than a glide, and `yazo`
    // comes out `ya-zo` in two syllables instead of `ya-zo` in two sounds.
    onsets: ['d', 'b', 't', 'š', 'w', 'j', 'n', 'm', 'l', 'p', 'k', 'z'],
    codas: ['t', 'n', 'p', 'm'],
    harmony: { back: [], front: [], neutral: ['a', 'o', 'u', 'e', 'i'] },
    onsetChance: 0.95,
    codaChance: 0.3,
    longChance: 0.35,
    lengths: [1, 1, 2, 2, 3],
    spelling: 0.7,
    onsetDensity: 0.98,
    interiorDensity: 0.85,
    codaDensity: 0.4,
    maxSyllables: 3,
  },

  /**
   * Choral ambient. Almost no attack of any kind and long vowels everywhere —
   * the words are mostly an excuse for the syllable to be held, which is what
   * this voice does with a phrase.
   */
  airy: {
    onsets: ['m', 'n', 'l', 'h', 'v', 'r'],
    codas: ['n', 'm'],
    harmony: { back: [], front: [], neutral: ['a', 'o', 'u', 'e', 'ö'] },
    onsetChance: 0.6,
    codaChance: 0.15,
    longChance: 0.55,
    lengths: [2, 2, 3],
    spelling: 0.85,
    onsetDensity: 0.7,
    // The softest in the project by a distance — a bit over half the struck
    // syllables open on anything at all, and most of what they open on is a
    // nasal or a liquid. That is what "almost no attack of any kind" means when
    // it is a number.
    interiorDensity: 0.5,
    codaDensity: 0.2,
    maxSyllables: 3,
  },

  /**
   * A vocoder is tracking a talker, and a talker says anything. The widest
   * inventory here, the shortest words, and the most closed syllables — the
   * consonants are the part a vocoder renders best.
   */
  machine: {
    onsets: ['t', 'k', 's', 'd', 'g', 'p', 'b', 'z', 'r', 'l', 'n', 'm', 'v', 'f'],
    codas: ['t', 'k', 's', 'n', 'r'],
    harmony: { back: [], front: [], neutral: ['a', 'e', 'i', 'o', 'u', 'ü', 'ö'] },
    onsetChance: 0.9,
    codaChance: 0.5,
    longChance: 0.2,
    lengths: [1, 2, 2, 3],
    spelling: 0.6,
    onsetDensity: 0.95,
    interiorDensity: 0.8,
    codaDensity: 0.55,
    maxSyllables: 4,
  },

  /**
   * Sargam — the seven swara names, and the only entry in this table whose
   * syllables were not invented here.
   *
   * That is worth stating plainly, because at first glance it looks like the
   * thing this file exists not to do. The proposition of the whole vocal layer
   * is that **nothing models language**: no lyricist, no localisation, no claim
   * to be saying anything. Sargam does not breach it. A swara name is not a
   * word — it has no referent outside the scale, it is the same seven syllables
   * in every performance and for every listener, and there is nothing in it to
   * translate. What it *is* is the one case in this project where the syllables
   * genuinely are fixed and finite, so the question the rest of the table
   * answers — what should this syllable be — is already answered, by the note.
   *
   * So why is this a `WordStyle` at all, when `degrees` decides every syllable?
   * Because the *grouping* is still open, and grouping is most of what this
   * table has ever been for. `degrees` says which name; `lengths` and
   * `onsetChance` say how many names are run together on one breath, which is
   * the whole difference between an ālāp stating one swara at a time and a tān
   * pouring six of them into a beat. The invented words survive as a rhythm and
   * a phrasing that nobody hears as words, and the melody supplies the identity
   * they used to carry. That trade is a straight gain: a lexicon buys repetition
   * by reusing twenty words, and a bound line gets it exactly and for free,
   * because two choruses on the same phrase sing the same swaras without
   * anything having to arrange it.
   *
   * **Seven names, seven places.** *s r g m p d n* land on `fricative`,
   * `liquid-r`, `stop-k`, `nasal-m`, `stop-p`, `stop` and `nasal` — seven
   * distinct entries of an inventory that has thirteen, and no two swaras that
   * differ only by the one distinction it drops, which is voicing. The binding
   * is therefore audible in full. What is lost is aspiration: *dha* is a
   * breathy voiced stop and arrives as a plain one, so it is *da* rather than
   * *dhā*. Nothing collides because of it — no other swara opens on a dental
   * stop — and it costs this entry less than it costs `tarana` below.
   *
   * It degrades honestly, too. Where the tonic is unknown the binding cannot
   * run, the words are pronounced like any other language's, and what comes out
   * is the right syllabary in the wrong order — *ma-ne-sa*, *ga-sa-ri*. That is
   * roughly what this genre gets from `airy` today, with the four consonants
   * `airy` cannot make put back.
   *
   * No codas and no clusters, because the syllabary has none: `codas` is empty
   * rather than merely unlikely, and both densities are 1 because a swara that
   * drops its consonant is not a quieter name, it is ākār and a different note.
   */
  sargam: {
    onsets: ['s', 'r', 'g', 'm', 'p', 'd', 'n'],
    codas: [],
    // Five of the seven names are on /a/, and the letters are drawn from flat,
    // so the repeats are the weighting — the same trick `onsets` uses.
    harmony: { back: [], front: [], neutral: ['a', 'a', 'a', 'a', 'e', 'i'] },
    degrees: ['sa', 're', 're', 'ga', 'ga', 'ma', 'ma', 'pa', 'dha', 'dha', 'ni', 'ni'],
    onsetChance: 1,
    codaChance: 0,
    // A held swara is the form's basic unit, so a third of the syllables are
    // written long and sung across two slots.
    longChance: 0.35,
    // One name alone and a run of four are both real, and the spread between
    // them is what separates the slow statement from the fast one.
    lengths: [1, 2, 2, 3, 3, 4],
    spelling: 1,
    onsetDensity: 1,
    interiorDensity: 1,
    codaDensity: 0,
    maxSyllables: 4,
  },

  /**
   * Tarānā — the other thing this repertoire sings on, and the opposite case in
   * every respect that matters here.
   *
   * A tarānā is sung on the drum's own language: *dir ta na dere tom nom*, the
   * bols a tabla player recites. They are **not tied to pitch** — there is no
   * `degrees` here, and that absence is the whole of the difference. A bol says
   * which stroke, not which note, so binding one to a scale degree would be as
   * wrong in this direction as leaving sargam unbound is in the other. It is a
   * rhythm played on a voice, which is why it belongs in the table beside
   * sargam and not inside it: one entry with a switch would have to carry a
   * field that is meaningless in half of its own settings, and a piece is one
   * form or the other rather than one form at two settings.
   *
   * Consonant-heavy where sargam is vowel-led, and that is the point of it. The
   * codas are load-bearing rather than decorative — *dir*, *tom*, *nom* stop the
   * vowel dead, which is what makes the voice sound struck rather than sung —
   * so `codaDensity` is the highest in this table. Through a renderer that
   * cannot articulate a coda they are heard as length instead, which is the
   * ordinary trade this project makes everywhere and is a worse one here than
   * usual.
   *
   * The syllabifier needed nothing added for it: `dirtana` falls apart as
   * `dir-ta-na` under the existing rule that the last consonant of a cluster
   * opens the next syllable, exactly as `ilta` becomes `il-ta`.
   *
   * **What the inventory cannot say, and what that costs.** A tabla's
   * vocabulary is built on precisely the three distinctions this consonant set
   * drops. *Voicing*: *ta* and *da*, *ka* and *ga* are different strokes and
   * arrive as one sound each. *Aspiration*: *dha* against *ta* is the bāyāṅ
   * hand against the dāyāṅ, and there is no aspirated stop at all. *Retroflex*:
   * *ṭa* against *ta* is most of the rest of the kit, and there is one dental
   * `stop` for both. So nine written bols collapse onto about five sounds, and
   * the concrete loss is that the voice keeps the tarānā's rhythm and loses the
   * drummer's two hands. Fixing it means new members of `Consonant` in
   * `core/types.ts` — an aspirated stop is a stop with a long voice-onset delay
   * and a retroflex one is a stop with a low F3 locus, so both are cheap to
   * synthesise and neither is cheap to add, since every renderer and the
   * concert visemes read that union.
   *
   * The letters that survive the collapse are still written out in full, and
   * the duplicates are the weighting: stops really are twice as common in this
   * vocabulary as anything else.
   */
  tarana: {
    onsets: ['d', 't', 'n', 'r', 'd', 't', 'n', 'm', 'k'],
    codas: ['r', 'm', 'n'],
    harmony: { back: [], front: [], neutral: ['a', 'a', 'a', 'i', 'i', 'o', 'e'] },
    onsetChance: 1,
    codaChance: 0.3,
    // Short vowels almost throughout. A heavy syllable is sung over two slots,
    // and a tarānā is the fastest thing this voice does.
    longChance: 0.08,
    lengths: [1, 2, 2, 3, 3, 4],
    spelling: 1,
    onsetDensity: 1,
    interiorDensity: 1,
    codaDensity: 0.85,
    maxSyllables: 4,
  },
};

export interface VocalProfile {
  /** Track name, shown in the UI and written into the MIDI track title. */
  name: string;
  /**
   * 0-based General MIDI program for the shipping render. GM has no formant
   * filter, so this is the nearest fixed patch — 52 Choir Aahs, 53 Voice Oohs,
   * 85 Lead 6 (voice). Static next to the real thing, but it means a .mid opens
   * with a voice on the vocal track rather than a piano.
   */
  gm: number;
  /**
   * Strudel source — a sampled voice, which is to say a recording of people
   * actually singing.
   *
   * This was a bare sawtooth at first, on the theory that a formant filter
   * wants something spectrally flat to carve. That theory is wrong in a way
   * worth recording. A vocal tract is *resonant*: it puts peaks on a full
   * spectrum and leaves the troughs between them attenuated but present. Three
   * parallel bandpasses instead keep three slices and throw the rest away, so
   * the result is both thin — three buzzy slices, no body — and quiet, because
   * no makeup gain can restore spectrum that is gone. It read as a filter
   * sweep, not as a person.
   *
   * A sampled voice supplies the body, the glottal source and the vowel it was
   * recorded on. The formant bands then ride on top at `formantMix`, colouring
   * it toward whichever vowel the note wants. Strudel's sampler applies the
   * pitch envelope and vibrato to samples exactly as it does to oscillators, so
   * the scoop and the vibrato — the two cues doing most of the "this is a
   * person" work — survive the switch intact.
   */
  strudel: string;
  /** Mix level, 0..1, on the same scale as every other layer's. */
  gain: number;
  /** Vowels this genre sings on, weighted. */
  vowels: (readonly [Vowel, number])[];
  /**
   * Which consonants this voice can make at all, weighted.
   *
   * This is what stops the line being one syllable repeated. A voice with no
   * consonants sings "duu duu duu" no matter how carefully the vowels are
   * chosen, because the ear separates syllables by their *onsets* far more than
   * by their vowels.
   *
   * It used to be a draw and is now mostly a **permission list**: the word's own
   * letters choose its consonants, and the weights are consulted only where the
   * spelling asks for something this voice does not have — a `š` in a palette
   * with no sibilant. So a letter missing from here is a letter the voice
   * cannot say, which is the useful thing to be able to state.
   */
  consonants: (readonly [Consonant, number])[];
  /** The invented language this voice sings. Nobody ever sees the words. */
  words: WordStyle;
  /**
   * Who is singing and how they are performing it — read only by the Web Audio
   * voice, which is the only renderer with a vocal tract to configure.
   *
   * Two ids rather than two tables, because `style/voices.ts` and
   * `style/delivery.ts` already hold seven of each and the whole point of
   * keeping them apart is that a genre picks a pair rather than writing one.
   * Strudel ignores both: it has a fixed filter bank and one envelope, so there
   * is nothing for a tract length or a legato setting to mean.
   */
  signature: VoiceSignatureId;
  delivery: DeliveryId;
  /**
   * Where this voice sits most comfortably. Vowel modification is measured
   * from here — this is the pitch the voice is *not* straining at.
   */
  centre: number;
  /**
   * Lowest and highest MIDI note this voice can sing, inclusive. The melody is
   * folded by whole octaves to fit inside it where that is possible at all.
   */
  range: [number, number];
  /**
   * How freely this voice's vowels move between neighbouring syllables, as a
   * distance in the openness/frontness plane.
   *
   * It used to be the width of a gaussian around a per-note openness target,
   * and that target is gone: the vowel now comes from the word, and a word
   * whose vowels are rewritten by the note they land on is not a word. What is
   * left is the same claim about this voice's appetite for vowel motion, read
   * by the phonetics as `separation`.
   *
   * Small values let consecutive syllables sit on near-identical vowels, which
   * is the "duu du du" failure; large ones force every syllable somewhere else
   * in the mouth, until the palette runs out of legal moves and the rule
   * relaxes itself rather than failing.
   */
  spread: number;
  /** Articulation. */
  voice: VoiceSettings;
}
