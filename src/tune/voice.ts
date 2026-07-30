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

import type { SectionKind } from '../core/types.js';
import type { Archetype, ArchetypeId, SectionShape, Voice } from './types.js';

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
    judge: { peak: 1.4, shape: 1.3 },
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
    judge: { peak: 0.8, shape: 1.3, figure: 1.5 },
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
    judge: { figure: 1.8, economy: 1.5, freshness: 0.8 },
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
    // Sparse is the point, so it must not be measured against a dance band.
    judge: { density: 0.3, figure: 0.7, economy: 1.4 },
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
    // A chant is supposed to stall. `interest` would otherwise veto the archetype.
    judge: { interest: 0.5, economy: 1.7, figure: 1.9, motion: 0.6 },
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
    judge: { motion: 1.5, interest: 1.2 },
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

// ---------------------------------------------------------------------------
// Authored voices
// ---------------------------------------------------------------------------

/**
 * TANGO — suomalainen tango.
 *
 * Everything here follows from two facts the style's own description states: the
 * melodies are stepwise and they end phrases on a long held note, the *kaipuu*
 * note the whole style is built around. So `long-note` is weighted where it would
 * be a curiosity elsewhere, and `descending-sequence` is weighted high because the
 * descending i–VII–VI–V tetrachord is the style's signature and a tune that walks
 * down with it is the tune that belongs on it.
 *
 * The accent table is the dotted lilt. Slots 6 and 14 — the eighth after a dotted
 * quarter — carry more weight than the beats on either side of them, which is what
 * a tango melody leans on and what a purely metric template gets exactly backwards.
 */
const tango: Voice = {
  id: 'tango',
  archetypes: [
    ['arch-hook', 4],
    ['descending-sequence', 4],
    ['long-note', 3],
    ['wide-interval', 2],
    ['riff-response', 0.5],
    ['chant', 0.5],
  ],
  subsets: [
    [[0, 1, 2, 3, 4, 5, 6], 4],
    [[0, 2, 3, 4, 6], 3],
    [[0, 1, 2, 3, 4, 6], 2],
    [[0, 1, 2, 4, 5], 1],
  ],
  density: 2.6,
  leap: 0.22,
  ornament: 0.14,
  compass: 14,
  syncopation: 0.5,
  accents: [
    1, 0.08, 0.3, 0.1, 0.72, 0.08, 0.55, 0.1,
    0.86, 0.08, 0.32, 0.1, 0.7, 0.08, 0.5, 0.12,
  ],
  ops: { sequence: 1.6, transpose: 1.3, diminish: 0.4, displace: 0.6, ornament: 0.8 },
};

/**
 * ISKELMÄPOP — the 1980s radio sound.
 *
 * Straight eighths and unembarrassed about it. The style's own note says the chorus
 * is a fixed tune with a fixed rhythm and that the key change exists to deliver it
 * one more time a tone higher, so `chant` and `riff-response` — the two archetypes
 * whose hook *is* the rhythm — are weighted where tango has them near zero.
 *
 * Its accent table is the opposite statement from tango's: every eighth is a place
 * a note belongs, and no sixteenth is.
 */
const iskelmapop: Voice = {
  id: 'iskelmapop',
  archetypes: [
    ['arch-hook', 4],
    ['riff-response', 3],
    ['chant', 2.5],
    ['wide-interval', 2],
    ['descending-sequence', 2],
    ['long-note', 1],
  ],
  subsets: [
    [[0, 1, 2, 4, 5], 4],
    [[0, 2, 3, 4, 6], 3],
    [[0, 1, 2, 3, 4, 5, 6], 3],
    [[0, 1, 2, 4, 5, 6], 2],
  ],
  density: 3.6,
  leap: 0.24,
  ornament: 0.18,
  compass: 14,
  syncopation: 0.45,
  accents: [
    1, 0.1, 0.5, 0.12, 0.75, 0.1, 0.5, 0.12,
    0.88, 0.1, 0.5, 0.12, 0.72, 0.1, 0.55, 0.16,
  ],
  ops: { transpose: 1.4, sequence: 1.2, ornament: 1.2, expand: 1.3 },
};

/**
 * BERLIN — the school where the composer is the sequencer.
 *
 * The lead is not the piece here and the voice has to say so. Density is a third of
 * iskelmäpop's, the canvas is four bars rather than two because the harmony moves
 * every two, and `ornament` is almost absent: a melody over a running sixteenth
 * figure earns its place by holding still while the machine moves.
 *
 * That is also why `long-note` and `chant` carry it. The style's own melody cells
 * are `[8,8]`, `[16]` and `[12,4]` — half notes and whole notes, which is a
 * statement about what a tune is for in this music rather than a rhythmic
 * preference.
 */
const berlin: Voice = {
  id: 'berlin',
  archetypes: [
    ['long-note', 5],
    ['chant', 3],
    ['descending-sequence', 2],
    ['arch-hook', 1.5],
    ['wide-interval', 1],
    ['riff-response', 0.5],
  ],
  subsets: [
    [[0, 1, 3, 4, 6], 4],
    [[0, 1, 2, 4, 5, 6], 3],
    [[0, 2, 3, 4, 6], 2],
    [[0, 1, 2, 3, 4, 5, 6], 2],
  ],
  density: 1.2,
  leap: 0.22,
  ornament: 0.06,
  compass: 14,
  syncopation: 0.2,
  canvasBars: 4,
  ops: { transpose: 1.5, sequence: 1.4, ornament: 0.2, diminish: 0.3, displace: 0.4 },
};

const VOICES = new Map<string, Voice>(
  [tango, iskelmapop, berlin].map((v) => [v.id, v]),
);

/**
 * The voice for a style id, or the fallback.
 *
 * Three styles are authored. The rest resolve through `DEFAULT_VOICE` until
 * `adapt.ts` derives something serviceable from their existing `MelodyStyle`
 * fields — see `docs/tune-plan.md` §13, which says plainly that "serviceable" means
 * generic until somebody sits with them.
 */
export function getVoice(styleId?: string): Voice {
  return (styleId ? VOICES.get(styleId) : undefined) ?? DEFAULT_VOICE;
}

export function registerVoice(voice: Voice): void {
  VOICES.set(voice.id, voice);
}

export function hasVoice(styleId: string): boolean {
  return VOICES.has(styleId);
}

export function archetype(id: ArchetypeId): Archetype {
  return ARCHETYPES[id];
}

// ---------------------------------------------------------------------------
// Section contrast
// ---------------------------------------------------------------------------

/**
 * How each kind of section differs from the others, before the style has a say.
 *
 * The `favour` entries are the substantive part. A chorus reaches for the
 * archetypes whose hook is a repeated figure; a bridge reaches for the ones that
 * contrast with whatever it interrupts, which is why `wide-interval` and
 * `descending-sequence` are lifted there and `chant` is pushed down. A solo wants
 * none of it — the whole point of a solo is that it is not the tune.
 */
const SHAPES: Record<SectionKind, SectionShape> = {
  intro: {
    density: 0.7, register: -2, repetition: 0.45,
    favour: { 'long-note': 2, chant: 1.5, 'riff-response': 1.4 },
  },
  verse: {
    density: 1, register: -2, repetition: 0.55,
  },
  chorus: {
    // Higher, longer, and more repetitive: the three things that make a chorus a
    // chorus and that the old engine expressed with none of.
    density: 1.05, register: 2, repetition: 0.85,
    favour: { 'arch-hook': 1.8, chant: 1.5, 'riff-response': 1.5, 'long-note': 0.7 },
  },
  bridge: {
    density: 0.95, register: 0, repetition: 0.3,
    favour: { 'wide-interval': 2, 'descending-sequence': 1.6, chant: 0.4, 'arch-hook': 0.7 },
  },
  solo: {
    density: 1.35, register: 1, repetition: 0.15,
    favour: { 'descending-sequence': 1.5, 'wide-interval': 1.5, chant: 0.3, 'long-note': 0.5 },
  },
  outro: {
    density: 0.7, register: -1, repetition: 0.75,
    favour: { 'long-note': 2, 'arch-hook': 1.2 },
  },
};

export function sectionShape(kind: SectionKind): SectionShape {
  return SHAPES[kind];
}

/** The voice's archetype weights with a section's bias applied. */
export function archetypeWeights(
  voice: Voice, shape?: SectionShape,
): readonly (readonly [ArchetypeId, number])[] {
  if (!shape?.favour) return voice.archetypes;
  const favour = shape.favour;
  return voice.archetypes.map(([id, w]) => [id, w * (favour[id] ?? 1)] as const);
}
