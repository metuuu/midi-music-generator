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
 * What each manner of articulation does to the start of a syllable.
 *
 * Two independent things carry a consonant, and between them they are enough:
 * how abruptly the vowel arrives, and what noise (if any) precedes it. A /t/ is
 * a high, brief click and then the vowel is simply *there*; an /s/ is a longer
 * rush of higher noise; an /m/ has no noise at all and the voice leans in over
 * fifty milliseconds. Those are cheap to synthesise and impossible to confuse
 * with one another, which is the whole requirement.
 */
export interface ConsonantShape {
  /** How fast the vowel itself comes in, seconds. */
  attack: number;
  /** Centre frequency of the noise burst in Hz. Zero means no burst. */
  burstFreq: number;
  /** How long the burst lasts, seconds. */
  burstDecay: number;
}

export const CONSONANTS: Record<Consonant, ConsonantShape> = {
  // Bare vowel onset. Quick, but not as instant as a stop.
  none: { attack: 0.015, burstFreq: 0, burstDecay: 0 },
  // The click of a tongue leaving the ridge, then the vowel with no ramp at all.
  stop: { attack: 0.003, burstFreq: 3200, burstDecay: 0.022 },
  // Longer and higher — /s/ is mostly noise, and the vowel follows it.
  fricative: { attack: 0.03, burstFreq: 6200, burstDecay: 0.085 },
  // No burst. The slow swell is what makes it read as humming into the note.
  nasal: { attack: 0.07, burstFreq: 0, burstDecay: 0 },
  // No burst either, but the tongue moves faster than the soft palate does.
  liquid: { attack: 0.028, burstFreq: 0, burstDecay: 0 },
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
