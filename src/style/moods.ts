/**
 * Mood presets — the main knob a game hands to the generator.
 *
 * A mood does not pick notes. It biases the choices the generator was going to
 * make anyway: which dance, major or minor, where in the tempo band, how many
 * layers play, how ornamented the melody is. That keeps moods orthogonal to
 * style, so "haikea humppa" is still possible — just unlikely.
 *
 * Names are Finnish because the emotional vocabulary of the genre is, and the
 * distinctions (haikea vs kaihoisa) do not survive translation cleanly.
 */

export interface Mood {
  id: string;
  label: string;
  /** English gloss for UI. */
  gloss: string;
  /** Per-style multipliers applied on top of the era's style weights. */
  styleBias: Record<string, number>;
  /** Multipliers on the style's own mode weights. */
  modeBias: { minor: number; major: number };
  /** -1 = bottom of the tempo band, +1 = top. */
  tempo: number;
  /** Added to the era density, clamped to [0.25, 1]. */
  density: number;
  /** Multiplier on the style's ornament probability. */
  ornament: number;
  /** Multiplier on melodic leap probability — calmer moods move by step. */
  leap: number;
  /** Bias on how often the arrangement drops to a sparse texture. */
  restraint: number;
}

const moods: Mood[] = [
  {
    id: 'haikea',
    label: 'Haikea',
    gloss: 'wistful, bittersweet',
    styleBias: { tango: 2.2, valssi: 1.8, beguine: 1.2, iskelmapop: 1.1, foksi: 0.8, humppa: 0.15, jenkka: 0.15 },
    modeBias: { minor: 1.8, major: 0.4 },
    tempo: -0.55,
    density: -0.12,
    ornament: 0.8,
    leap: 0.75,
    restraint: 0.6,
  },
  {
    id: 'kaihoisa',
    label: 'Kaihoisa',
    gloss: 'longing, the deep melancholy of Finnish tango',
    styleBias: { tango: 3.2, valssi: 1.6, beguine: 0.8, iskelmapop: 0.9, foksi: 0.5, humppa: 0.05, jenkka: 0.05 },
    modeBias: { minor: 3, major: 0.15 },
    tempo: -0.85,
    density: -0.2,
    ornament: 0.9,
    leap: 0.7,
    restraint: 0.8,
  },
  {
    id: 'iloinen',
    label: 'Iloinen',
    gloss: 'cheerful, bright',
    styleBias: { humppa: 2.8, jenkka: 2.4, foksi: 1.2, beguine: 1.1, valssi: 0.9, tango: 0.3, iskelmapop: 1.0 },
    modeBias: { minor: 0.3, major: 2.2 },
    tempo: 0.7,
    density: 0.12,
    ornament: 1.3,
    leap: 1.25,
    restraint: -0.3,
  },
  {
    id: 'tanssittava',
    label: 'Tanssittava',
    gloss: 'danceable, keeps the floor busy',
    styleBias: { humppa: 1.8, jenkka: 1.6, foksi: 1.6, beguine: 1.5, valssi: 1.1, tango: 0.9, iskelmapop: 1.3 },
    modeBias: { minor: 0.9, major: 1.2 },
    tempo: 0.45,
    density: 0.15,
    ornament: 1.1,
    leap: 1.1,
    restraint: -0.25,
  },
  {
    id: 'romanttinen',
    label: 'Romanttinen',
    gloss: 'romantic, warm',
    styleBias: { valssi: 2.0, foksi: 1.7, beguine: 1.6, tango: 1.3, iskelmapop: 1.2, humppa: 0.4, jenkka: 0.3 },
    modeBias: { minor: 1.1, major: 1.3 },
    tempo: -0.25,
    density: 0,
    ornament: 1.2,
    leap: 0.9,
    restraint: 0.25,
  },
  {
    id: 'dramaattinen',
    label: 'Dramaattinen',
    gloss: 'dramatic, big gestures and key changes',
    styleBias: { tango: 2.4, iskelmapop: 1.9, valssi: 1.2, beguine: 0.9, foksi: 0.7, humppa: 0.3, jenkka: 0.2 },
    modeBias: { minor: 2.2, major: 0.5 },
    tempo: 0.15,
    density: 0.25,
    ornament: 1.15,
    leap: 1.3,
    restraint: -0.35,
  },
  {
    id: 'rento',
    label: 'Rento',
    gloss: 'relaxed, background-friendly',
    styleBias: { foksi: 2.0, beguine: 1.9, valssi: 1.2, tango: 1.0, iskelmapop: 1.0, humppa: 0.3, jenkka: 0.3 },
    modeBias: { minor: 1.0, major: 1.2 },
    tempo: -0.4,
    density: -0.22,
    ornament: 0.9,
    leap: 0.85,
    restraint: 0.7,
  },
  {
    id: 'nostalginen',
    label: 'Nostalginen',
    gloss: 'nostalgic, old-radio warmth',
    styleBias: { tango: 1.6, valssi: 1.5, beguine: 1.4, foksi: 1.3, humppa: 1.0, jenkka: 0.8, iskelmapop: 1.0 },
    modeBias: { minor: 1.4, major: 1.0 },
    tempo: -0.2,
    density: -0.05,
    ornament: 1.0,
    leap: 0.95,
    restraint: 0.35,
  },
  {
    id: 'neutraali',
    label: 'Neutraali',
    gloss: 'no bias — the full spread of the era',
    styleBias: {},
    modeBias: { minor: 1, major: 1 },
    tempo: 0,
    density: 0,
    ornament: 1,
    leap: 1,
    restraint: 0,
  },
];

export const MOODS: Record<string, Mood> = Object.fromEntries(moods.map((m) => [m.id, m]));
export const MOOD_IDS = moods.map((m) => m.id);

export function getMood(id: string): Mood {
  const m = MOODS[id];
  if (!m) throw new Error(`Unknown mood "${id}". Known: ${MOOD_IDS.join(', ')}`);
  return m;
}
