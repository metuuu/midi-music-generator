/**
 * Voice signatures — who is singing.
 *
 * A voice is not a preset of a hundred numbers. Almost everything that
 * distinguishes a low male from a soprano follows from *one* physical fact: the
 * vocal tract is a tube, and a shorter tube resonates higher. An adult male
 * tract is about 17.5 cm, an adult female about 14.5, a child about 12 — and
 * because resonance frequency goes as the inverse of length, every formant in
 * the vowel table scales by that ratio and nothing else has to change. A
 * woman's /a/ is not a different vowel, it is the same vowel in a shorter tube.
 *
 * This matters more than it sounds like, because the naive alternative —
 * transposing the pitch and leaving the formants alone — is exactly what a
 * sampler does when you play it an octave up, and it is why that sounds like a
 * chipmunk rather than like a woman. Pitch and tract length are independent,
 * and the ear knows it: a bass singing high still sounds like a bass, a soprano
 * singing low still sounds like a soprano. Keeping the two separate is the
 * single thing that makes these signatures read as different *people* rather
 * than as the same synthesiser at different speeds.
 *
 * The remaining fields are voice quality, which does not follow from length:
 * how steeply the glottal source rolls off (pressed and bright against soft and
 * dark), how much air escapes unvoiced, and how the singer's formant sits.
 */

import type { Midi } from '../core/pitch.js';

export type VoiceSignatureId =
  | 'low-male' | 'male' | 'tenor' | 'androgynous' | 'female' | 'high-female' | 'child';

export interface VoiceSignature {
  id: VoiceSignatureId;
  label: string;
  gloss: string;
  /**
   * Multiplies every formant frequency in the vowel table.
   *
   * 1.0 *is* the table — those are the conventional measured values for an
   * adult male tract, so this is a ratio against that reference rather than an
   * arbitrary scaling. Physically it is (male tract length ÷ this tract's
   * length), which is why the numbers cluster so tightly: human vocal tracts
   * only vary by about 35% end to end, and that narrow band contains every
   * voice anyone has ever heard.
   */
  formantScale: number;
  /** The pitch this voice is most comfortable at — where it is not straining. */
  centre: Midi;
  /** Lowest and highest note it can produce at all, inclusive. */
  range: [Midi, Midi];
  /**
   * How steeply the glottal source rolls off: harmonic n has amplitude 1/nᵖ.
   *
   * A real glottal pulse is about -12 dB/octave, which is p = 2. Below that the
   * fold closure is snappier and the voice is brighter and more pressed — belt,
   * shout, a tenor at the top. Above it the closure is gentler, the upper
   * harmonics are weak, and the voice is soft and dark. This is the difference
   * between the same person singing loudly and quietly, and it does more for
   * character than any filter setting.
   */
  rolloff: number;
  /**
   * Aspiration: unvoiced air passing the folds, 0..1.
   *
   * Small numbers only. This is the noise a voice has *in addition* to the
   * pitch, and its main job is to stop the source being a perfect periodic
   * waveform — an oscillator with no noise in it reads as an organ no matter
   * what the formants do. Push it past about 0.2 and the voice starts to
   * whisper.
   */
  breath: number;
  /**
   * The singer's formant: a boost in dB around 2.8 kHz (scaled with the tract).
   *
   * Trained singers cluster F3, F4 and F5 into one strong peak there, which is
   * how an unamplified voice is heard over an orchestra playing the same notes
   * — the orchestra has comparatively little energy in that band and the ear
   * has its maximum sensitivity in it. A conversational voice has none of this;
   * an opera singer has 20 dB of it. It is the single most audible difference
   * between "someone talking" and "someone singing", quite apart from the tune.
   */
  ring: number;
  /** Vibrato rate in Hz. 5–6 is human; much faster reads as a synth LFO. */
  vibRate: number;
  /** Vibrato depth in semitones, before the delivery scales it. */
  vibDepth: number;
  /**
   * Nearest General MIDI program, for the file that has to open in something
   * that cannot synthesise a vowel — 52 Choir Aahs, 53 Voice Oohs, 85 Lead 6.
   */
  gm: number;
}

/**
 * The signatures, ordered low to high.
 *
 * Deliberately not one per demographic label. The interesting axis is the
 * *tube*, and the labels are shorthand for regions of it — which is also why
 * `androgynous` is here and is not a compromise: a tract right between the two
 * clusters is a real voice, and in practice it is the most useful one for a
 * game, because nobody hears it as being aimed at them.
 */
export const VOICE_SIGNATURES: Record<VoiceSignatureId, VoiceSignature> = {
  'low-male': {
    id: 'low-male',
    label: 'Low male',
    gloss: 'Bass–baritone. Long tract, dark source, almost no ring — close and confiding.',
    formantScale: 0.90,
    centre: 45,               // A2
    range: [33, 57],          // A1 – A3
    rolloff: 2.25,
    breath: 0.05,
    ring: 2,
    vibRate: 4.8,
    vibDepth: 0.10,
    gm: 53,
  },
  male: {
    id: 'male',
    label: 'Male',
    gloss: 'Baritone. The reference tract — every formant in the table, unscaled.',
    formantScale: 1.00,
    centre: 52,               // E3
    range: [40, 65],          // E2 – F4
    rolloff: 2.0,
    breath: 0.07,
    ring: 4,
    vibRate: 5.2,
    vibDepth: 0.12,
    gm: 53,
  },
  tenor: {
    id: 'tenor',
    label: 'Tenor',
    gloss: 'Bright and pressed, with real ring. The voice that carries over a band.',
    formantScale: 1.06,
    centre: 57,               // A3
    range: [45, 72],          // A2 – C5
    rolloff: 1.8,
    breath: 0.06,
    ring: 8,
    vibRate: 5.6,
    vibDepth: 0.16,
    gm: 85,
  },
  androgynous: {
    id: 'androgynous',
    label: 'Androgynous',
    gloss: 'A tract between the two clusters. Reads as a person, not as a gender.',
    formantScale: 1.09,
    centre: 59,               // B3
    range: [48, 74],
    rolloff: 1.95,
    breath: 0.10,
    ring: 4,
    vibRate: 5.4,
    vibDepth: 0.13,
    gm: 52,
  },
  female: {
    id: 'female',
    label: 'Female',
    gloss: 'Mezzo. Shorter tract, breathier source — warm rather than piercing.',
    formantScale: 1.17,
    centre: 62,               // D4
    range: [50, 77],          // D3 – F5
    rolloff: 1.9,
    breath: 0.12,
    ring: 5,
    vibRate: 5.6,
    vibDepth: 0.15,
    gm: 52,
  },
  'high-female': {
    id: 'high-female',
    label: 'High female',
    gloss: 'Soprano. Every vowel migrates toward /a/ up top, whether it wants to or not.',
    formantScale: 1.22,
    centre: 67,               // G4
    range: [55, 84],          // G3 – C6
    rolloff: 1.75,
    breath: 0.14,
    ring: 7,
    vibRate: 5.9,
    vibDepth: 0.19,
    gm: 52,
  },
  child: {
    id: 'child',
    label: 'Child',
    gloss: 'Short tract, weak source, no ring at all — small rather than merely high.',
    formantScale: 1.34,
    centre: 69,               // A4
    range: [57, 84],
    rolloff: 1.7,
    breath: 0.17,
    ring: 0,
    vibRate: 6.2,
    vibDepth: 0.08,
    gm: 52,
  },
};

export const SIGNATURE_ORDER: VoiceSignatureId[] = [
  'low-male', 'male', 'tenor', 'androgynous', 'female', 'high-female', 'child',
];

export function getSignature(id: string): VoiceSignature {
  const found = VOICE_SIGNATURES[id as VoiceSignatureId];
  if (!found) throw new Error(`Unknown voice signature: ${id}`);
  return found;
}

/**
 * Fold a line by whole octaves so it lands where this voice can sing it.
 *
 * Whole octaves and the whole line, because moving notes individually to fit a
 * range rewrites the tune's contour, and the contour *is* the tune. Scored on
 * how far notes are pushed outside the range rather than on the mean, because a
 * wide line can average out to a comfortable pitch while its bottom sits below
 * anything a voice produces.
 *
 * Asymmetric, because the two failures are not the same failure: reaching above
 * the top strains and thins the tone, which listeners hear as effort and
 * accept, while below the bottom the folds simply stop closing and there is no
 * note at all.
 */
export function octaveFoldFor(midis: number[], sig: VoiceSignature): number {
  if (!midis.length) return 0;
  const [lo, hi] = sig.range;
  const mean = midis.reduce((s, m) => s + m, 0) / midis.length;
  const sq = (x: number) => x * x;

  let best = 0;
  let bestCost = Infinity;
  for (const shift of [-36, -24, -12, 0, 12, 24, 36]) {
    let cost = 0;
    for (const m of midis) {
      const midi = m + shift;
      cost += 3 * sq(Math.max(0, lo - midi)) + sq(Math.max(0, midi - hi));
    }
    // Well below one semitone of excursion, so it only separates shifts that
    // are otherwise equally singable.
    cost += Math.abs(mean + shift - sig.centre) * 0.01;
    if (cost < bestCost) { bestCost = cost; best = shift; }
  }
  return best;
}
