/**
 * What kinds of tune exist, and what a style's melodies are made of.
 *
 * Two tables. **Archetypes** are the kinds — a claim about the shape of a whole
 * section, which is the level at which a listener notices that two tunes are
 * different tunes rather than two samples of one. **Voices** are per-style
 * vocabulary: how busy, how leapy, where the accents fall, which archetypes this
 * music reaches for.
 *
 * The archetype table is the answer to *"there is so much variety in melodies
 * even inside one genre"*. Per-note noise cannot produce that variety — the old
 * engine's own report shows forty distinct bar shapes per song and every song
 * still sounding like the same writer, because a thousand random walks through the
 * same scoring function are a thousand versions of one tune. A decision about
 * kind, made once per section, is heard immediately.
 */

import type { Archetype, ArchetypeId, Voice } from './types.js';

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  'arch-hook': {
    id: 'arch-hook',
    label: 'Arch with a hook',
    gloss: 'rise to one high point, with a figure that keeps coming back',
    density: 1,
    peakAt: [0.55, 0.72],
    forms: [['period', 3], ['sentence', 3], ['aaba', 2], ['arch-form', 3]],
    shapes: [['arch', 4], ['turn', 3], ['rise', 2], ['gap-fill', 2], ['repeat-tail', 2]],
    stride: 2,
    sequenceDir: 0.6,
    leap: 1,
  },
  'descending-sequence': {
    id: 'descending-sequence',
    label: 'Descending sequence',
    gloss: 'a figure walked down the scale, three times if it can get away with it',
    density: 1,
    // The high point is at the *start*: a descending sequence spends the whole
    // section falling away from it, which is the opposite of an arch and the
    // reason it needs its own entry rather than a shape weight.
    peakAt: [0.08, 0.25],
    forms: [['chain', 5], ['sentence', 3], ['period', 1]],
    shapes: [['fall', 5], ['thirds', 3], ['turn', 1], ['valley', 1]],
    stride: 2,
    sequenceDir: -1,
    leap: 1.1,
  },
  'riff-response': {
    id: 'riff-response',
    label: 'Riff and response',
    gloss: 'a short figure and the thing that answers it',
    density: 1.15,
    peakAt: [0.3, 0.6],
    forms: [['riff-response', 6], ['aaba', 2], ['chain', 1]],
    shapes: [['repeat-tail', 4], ['neighbour', 3], ['plateau', 2], ['leap-home', 2]],
    stride: 1,
    sequenceDir: 0.2,
    leap: 0.9,
  },
  'long-note': {
    id: 'long-note',
    label: 'Long notes',
    gloss: 'few onsets, long values, the cadence doing the work',
    density: 0.45,
    peakAt: [0.5, 0.78],
    forms: [['period', 5], ['arch-form', 3], ['sentence', 1]],
    shapes: [['climb-hold', 4], ['rise', 3], ['arch', 3], ['fall', 2]],
    stride: 3,
    sequenceDir: 0.5,
    leap: 0.8,
  },
  chant: {
    id: 'chant',
    label: 'Chant',
    gloss: 'one note repeated with a tail — the hook is the rhythm',
    density: 0.9,
    peakAt: [0.6, 0.85],
    forms: [['riff-response', 3], ['aaba', 3], ['period', 2]],
    shapes: [['plateau', 5], ['repeat-tail', 4], ['neighbour', 2]],
    stride: 1,
    sequenceDir: 0,
    leap: 0.5,
  },
  'wide-interval': {
    id: 'wide-interval',
    label: 'Wide intervals',
    gloss: "a singer's tune — it leaps out and steps home",
    density: 0.85,
    peakAt: [0.4, 0.72],
    forms: [['sentence', 3], ['arch-form', 3], ['period', 2]],
    shapes: [['leap-home', 4], ['gap-fill', 4], ['thirds', 2], ['arch', 2]],
    stride: 3,
    sequenceDir: 0.4,
    leap: 1.6,
  },
};

/**
 * Degree subsets worth living in, 0-based indices into the mode's own scale.
 *
 * Indexing the *mode* rather than naming absolute intervals is what makes one
 * table serve both keys: `[0,2,3,4,6]` is 1̂ 3̂ 4̂ 5̂ 7̂ in major and the minor
 * pentatonic in minor, and both are the sound of a tune that stays out of trouble.
 *
 * The full diatonic is on the list and weighted like everything else. A subset is
 * a colour rather than a discipline.
 */
export const SUBSETS: readonly (readonly [readonly number[], number])[] = [
  [[0, 1, 2, 3, 4, 5, 6], 3],
  [[0, 1, 2, 4, 5], 3],          // 1 2 3 5 6 — bright, folk, hardest to get wrong
  [[0, 2, 3, 4, 6], 3],          // 1 3 4 5 7 — yearning in major, pentatonic in minor
  [[0, 1, 3, 4, 6], 2],          // 1 2 4 5 7 — modal, no third to commit you
  [[0, 1, 2, 4, 5, 6], 2],       // diatonic without the fourth
  [[0, 1, 2, 3, 4, 6], 1],       // diatonic without the sixth
];

/**
 * The fallback voice.
 *
 * Every style resolves through this until `adapt.ts` and the per-style tables land
 * — see `docs/tune-plan.md` Phase 4. It is deliberately middling rather than
 * neutral: there is no such thing as a styleless melody, and pretending otherwise
 * produced the old engine's house accent.
 */
export const DEFAULT_VOICE: Voice = {
  id: 'default',
  archetypes: [
    ['arch-hook', 4],
    ['descending-sequence', 2],
    ['riff-response', 2],
    ['long-note', 1],
    ['chant', 1],
    ['wide-interval', 2],
  ],
  subsets: SUBSETS,
  density: 3.2,
  leap: 0.25,
  ornament: 0.15,
  compass: 14,
  syncopation: 0.3,
};

const VOICES = new Map<string, Voice>();

/** The voice for a style id, or the fallback. */
export function getVoice(styleId?: string): Voice {
  return (styleId ? VOICES.get(styleId) : undefined) ?? DEFAULT_VOICE;
}

export function registerVoice(voice: Voice): void {
  VOICES.set(voice.id, voice);
}

export function archetype(id: ArchetypeId): Archetype {
  return ARCHETYPES[id];
}
