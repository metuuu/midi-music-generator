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
   * How this genre starts its syllables, weighted.
   *
   * This is what stops the line being one syllable repeated. A voice with no
   * consonants sings "duu duu duu" no matter how carefully the vowels are
   * chosen, because the ear separates syllables by their *onsets* far more than
   * by their vowels.
   */
  consonants: (readonly [Consonant, number])[];
  /**
   * How many notes a vowel survives before another is chosen. 1 is scat — a
   * fresh syllable on every note. Higher values hold one vowel across a phrase,
   * which is what a sustained ballad line does. A phrase break always forces a
   * new choice regardless, because that is where the breath goes.
   */
  hold: number;
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
   * How loosely the openness target is followed, in openness units. Small
   * values track pitch and note length closely and can sound mechanical; large
   * values fall back on the raw weights.
   */
  spread: number;
  /** Articulation. */
  voice: VoiceSettings;
}
