/**
 * The tune engine's model — no logic, only the shapes the passes hand along.
 *
 * This file is the argument of `docs/tune-plan.md` expressed as types, and it is
 * worth reading as such. The engine it replaces had no type between the note and
 * the section: rhythm was a bar-length array of durations that had to sum to the
 * bar, pitch was a weighted choice made one note at a time, and repetition was
 * nine scalars. Nothing in it could say *this phrase is that phrase, inverted*,
 * because there was no noun for a phrase and no verb for inverted.
 *
 * Four things here are the whole design:
 *
 *  - **`Gesture` does not have to fill anything.** No sum-to-the-bar contract, so
 *    a figure may leave silence, start late, or run past its own end. The old
 *    engine's `fitCell` guaranteed the opposite, which is why pickups, ties and
 *    pushes had to be patched on afterwards by a separate pass.
 *  - **`Motif` is a rhythm and a shape, not a tune.** The contour is scale steps
 *    between successive notes, so the same idea can be replayed over any chord in
 *    any key and still be the same idea.
 *  - **`PhraseNode` carries a derivation.** Every phrase either *is* a statement
 *    or is a named list of transformations of an earlier one. That is the noun and
 *    the verb the old engine lacked.
 *  - **`Skeleton` exists at all.** Two to four structural pitches per phrase,
 *    chosen before any surface note, so that surface notes are ways of getting
 *    somewhere rather than a walk that happens to be scored.
 */

import type { Chord } from '../core/chord.js';
import type { Midi, Pc } from '../core/pitch.js';
import type { Mode, Scale } from '../core/scale.js';

/** Sixteenths. Four to the beat, as everywhere else in the project. */
export type Slot = number;

// ---------------------------------------------------------------------------
// Rhythm
// ---------------------------------------------------------------------------

export interface Onset {
  /** Sixteenths from the start of the gesture. May be negative — that is a pickup. */
  at: Slot;
  dur: Slot;
  /**
   * How hard this note is struck, 0..1, *as the figure intends it* rather than as
   * the metre implies it.
   *
   * The distinction matters and it is the reason this is stored rather than
   * derived. A figure whose accent falls on its second note is a different figure
   * from one whose accent falls on its first, even when the onsets are identical —
   * and a syncopation is precisely a note accented where the metre says it should
   * not be. Deriving accent from position, which is what `metricStrength` did for
   * the old engine, makes that distinction inexpressible.
   */
  accent: number;
}

export interface Gesture {
  onsets: Onset[];
  /**
   * The canvas the figure was written on, in sixteenths. Two bars by default,
   * because almost every hook anybody can hum is a two-bar figure and a one-bar
   * unit cannot express one.
   *
   * Onsets are not required to fill it and are not forbidden from overrunning it.
   */
  span: Slot;
}

// ---------------------------------------------------------------------------
// Material
// ---------------------------------------------------------------------------

export type MotifRole = 'hook' | 'answer' | 'tag';

export interface Motif {
  gesture: Gesture;
  /**
   * Scale steps from each note to the next, one entry per onset.
   *
   * `contour[0]` is always 0: the first note is wherever the phrase puts it, and
   * *where* is the skeleton's business rather than the motif's. That is what lets
   * one motif be the material of a whole section without every phrase starting on
   * the same pitch.
   */
  contour: number[];
  role: MotifRole;
  /**
   * Scale steps this instance sits above the material it derives from.
   *
   * Set by `transpose`, read by the skeleton. A derivation that says "up a third"
   * has to move the *targets*, not merely the first note, or the figure arrives
   * transposed and then walks back to where it always went.
   */
  shift: number;
  /**
   * Force strong-beat notes onto chord tones when realising.
   *
   * Set by `reharmonise`. Snapping is otherwise a matter of degree — a passing
   * dissonance on a strong beat is often the best note in the bar — but a figure
   * being deliberately replayed over new changes is the one case where the point
   * is that it fits them.
   */
  resnap?: boolean;
}

// ---------------------------------------------------------------------------
// The operator algebra
// ---------------------------------------------------------------------------

/**
 * The transformations one phrase can apply to another.
 *
 * This is the primitive the old engine was missing outright, and its absence is
 * measurable: `MelodyStyle.sequence` and `HookLevel.sequence` were authored in
 * every style and every hook level and read by no code at all, because there was
 * no code that developed a motif. A knob for *how much* of something nothing
 * could do.
 *
 * Three of these carry most of the weight. `sequence` — the same figure two or
 * three times, each a step higher — is the single most reliable way to make a
 * line sound intended. `expand` is how a chorus lifts a verse figure: identical
 * shape, wider intervals, and the ear hears *the same idea, more of it*.
 * `diminish` and `displace` together produce rhythmically complicated bars out of
 * no new material, which is what stops complexity sounding like noise.
 *
 * Chromatic transposition is deliberately absent. Moving a figure by a semitone
 * inside one key is a modulation wearing a disguise, and modulation is the key
 * route's job — see `docs/tune-plan.md` §9. Everything here moves through the
 * scale, which is what keeps a derivation legible after the key has changed.
 */
export type Op =
  /** Move the figure through the scale. */
  | { op: 'transpose'; steps: number }
  /** Turn the shape upside down. Up-up-down becomes down-down-up. */
  | { op: 'invert' }
  /** Stretch the rhythm. Notes that fall off the end of the canvas are lost. */
  | { op: 'augment'; factor: number }
  /** Compress the rhythm. Pair with `sequence` to fill the room it frees. */
  | { op: 'diminish'; factor: number }
  /** Keep the first `keep` notes and let the rest be silence. */
  | { op: 'fragment'; keep: number }
  /** Add a note on the end. */
  | { op: 'extend'; with: 'step' | 'leap' | 'repeat' }
  /** Shift the whole figure off the beat by `by` sixteenths. */
  | { op: 'displace'; by: Slot }
  /** Restate the figure `times` in all, each `steps` scale steps above the last. */
  | { op: 'sequence'; times: number; steps: number }
  /** Same contour, wider intervals. */
  | { op: 'expand'; factor: number }
  /** Split long notes into neighbour figures. */
  | { op: 'ornament'; amount: number }
  /** Same shape, made to fit new changes rather than merely surviving them. */
  | { op: 'reharmonise' };

export type OpKind = Op['op'];

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

/**
 * How a phrase ends, which is what tells the listener whether to expect more.
 *
 * `half` is the one the old engine could not express and the one that makes an
 * eight-bar sentence sound like a sentence: a stop on the dominant that is a
 * genuine arrival and still obviously the middle of something.
 */
export type Cadence = 'open' | 'half' | 'closed' | 'suspended';

export interface PhraseNode {
  /** `A`, `A'`, `B`, `A''` — the name the derivation refers to. */
  id: string;
  bars: number;
  /**
   * Absent means this phrase *is* the statement of its material. Present means it
   * is `ops` applied to the phrase named `id`.
   */
  from?: { id: string; ops: Op[] };
  /** Which motif of the family a statement states. Ignored on derived phrases. */
  motif?: MotifRole;
  cadence: Cadence;
}

export type FormId =
  | 'sentence'
  | 'period'
  | 'aaba'
  | 'chain'
  | 'riff-response'
  | 'arch-form';

// ---------------------------------------------------------------------------
// Pitch structure
// ---------------------------------------------------------------------------

export type TargetRole = 'anchor' | 'peak' | 'arrival';

export interface Target {
  /** Sixteenths from the start of the phrase. */
  at: Slot;
  midi: Midi;
  role: TargetRole;
}

export interface Skeleton {
  /** Two to four per phrase. Not one per note — that would be a melody. */
  targets: Target[];
}

// ---------------------------------------------------------------------------
// Archetypes
// ---------------------------------------------------------------------------

/**
 * What kind of tune this is.
 *
 * Variety has to be categorical to be heard. The old engine's variety came from
 * per-note noise, which produces a thousand tunes that are all alike: its own
 * report shows 40 distinct bar shapes per song at the loosest setting and every
 * one of those songs still sounding like the same songwriter. An archetype is a
 * decision about *kind*, and two songs that differ in kind differ audibly.
 */
export type ArchetypeId =
  | 'arch-hook'
  | 'descending-sequence'
  | 'riff-response'
  | 'long-note'
  | 'chant'
  | 'wide-interval';

export type ShapeId =
  | 'rise' | 'fall' | 'arch' | 'valley' | 'turn' | 'repeat-tail'
  | 'leap-home' | 'thirds' | 'neighbour' | 'gap-fill' | 'climb-hold' | 'plateau';

/**
 * The dimensions a tune is scored on. Defined here rather than in `judge.ts` so an
 * archetype can carry its own weights without the two files importing each other.
 */
export type TermId =
  | 'peak' | 'economy' | 'figure' | 'motion' | 'arrival'
  | 'shape' | 'density' | 'groove' | 'interest' | 'freshness';

export interface Archetype {
  id: ArchetypeId;
  label: string;
  gloss: string;
  /** Multiplier on the voice's onset density. */
  density: number;
  /** Where the section's single high point wants to sit, as a fraction of it. */
  peakAt: readonly [number, number];
  forms: readonly (readonly [FormId, number])[];
  shapes: readonly (readonly [ShapeId, number])[];
  /**
   * How far apart consecutive skeleton targets want to be, in scale steps. The
   * difference between a tune that inches and a tune that strides.
   */
  stride: number;
  /**
   * Which way a sequence walks, -1..1, where -1 is always down and 0 is even.
   *
   * The form says *sequence this*; which direction that means is a property of the
   * kind of tune. A descending sequence that walks upward is not a descending
   * sequence, and leaving the direction to the form template would make every
   * archetype sharing a template sound the same going into its third phrase.
   */
  sequenceDir: number;
  /** Multiplier on the voice's leap appetite. */
  leap: number;
  /**
   * Overrides on the judge's term weights.
   *
   * This is what makes the score *conditional* rather than absolute — see
   * `judge.ts`. A chant is supposed to stall, so `interest` cannot be allowed to
   * veto one; a long-note ballad is supposed to be sparse, so `density` must not
   * measure it against a dance band.
   */
  judge?: Partial<Record<TermId, number>>;
}

/**
 * How the instrument holding this line shapes its music.
 *
 * Declared here rather than imported so the engine keeps its one-way door onto the
 * style tables, and mapped across in `adapt.ts`. It is the same four numbers the old
 * engine had, and they answer a question agility does not: agility says how far an
 * instrument can *reach*, idiom says what it actually *plays*. Before it existed a
 * harp and a trombone handed identical chords produced statistically identical
 * lines.
 */
export interface Idiom {
  /** Appetite for broken chords — thirds in the same direction. */
  arpeggio: number;
  /** Appetite for scale runs — steps in the same direction. */
  run: number;
  /** Tolerance for re-articulating the same note. Free on a mallet, ugly sung. */
  repeat: number;
  /** How badly the line needs air. A flute stops to breathe; a vibraphone does not. */
  breath: number;
}

// ---------------------------------------------------------------------------
// Voice — what a style's melodies are made of
// ---------------------------------------------------------------------------

export interface Voice {
  id: string;
  archetypes: readonly (readonly [ArchetypeId, number])[];
  /**
   * Which degrees the tune lives in, by weight. Degrees are 0-based, so
   * `[0,1,2,4,5]` is 1̂ 2̂ 3̂ 5̂ 6̂ — the bright folk pentatonic.
   *
   * A one-line decision with more audible effect than any weight in the old
   * engine's scorer: most memorable hooks live in a five-note subset, and *which*
   * subset changes the colour completely.
   */
  subsets: readonly (readonly [readonly number[], number])[];
  /** Onsets per bar, before the archetype and the section scale it. */
  density: number;
  /** Appetite for intervals wider than a step, 0..1. */
  leap: number;
  /** Appetite for splitting long notes into figures, 0..1. */
  ornament: number;
  /** Semitones the line lives within. */
  compass: number;
  /** Appetite for landing off the beat, 0..1. */
  syncopation: number;
  /**
   * Per-sixteenth attractiveness, tiled across the canvas. A 16-long array is a
   * one-bar statement tiled twice; a 32-long array is a two-bar statement, which
   * is what a clave or a tango accent actually is.
   *
   * Absent means derived from `syncopation` and the metre — serviceable, and the
   * reason the whole catalogue does not have to be authored before anything can
   * be heard.
   */
  accents?: readonly number[];
  /** Bars on the canvas. Two unless the style is slow enough to need four. */
  canvasBars?: number;
  /** Relative appetite for each transformation. Absent entries fall back to 1. */
  ops?: Partial<Record<OpKind, number>>;
}

// ---------------------------------------------------------------------------
// Section contrast
// ---------------------------------------------------------------------------

/**
 * What makes one kind of section a different kind of thing from another.
 *
 * The old engine distinguished a verse from a chorus by two facts: which chord
 * progression it drew from, and whether the tune was replayed verbatim. Everything
 * else — register, density, phrase length, how much it repeats itself, what kind of
 * tune it is at all — was identical, which is why its choruses sounded like verses
 * with different chords. A chorus is not a verse with a better progression. It sits
 * higher, holds its notes longer, repeats itself more, and lands harder.
 */
export interface SectionShape {
  /** Multiplier on the voice's onset density. */
  density: number;
  /** Semitones the lead window moves for this kind of section. */
  register: number;
  /** How much this kind of section leans on repeating itself, 0..1. */
  repetition: number;
  /** Multiplied into the voice's archetype weights. */
  favour?: Partial<Record<ArchetypeId, number>>;
}

// ---------------------------------------------------------------------------
// The plan
// ---------------------------------------------------------------------------

/**
 * Everything decided about one section's tune before a note of it exists.
 *
 * Serialisable, printable, diffable, and that is a design goal rather than a
 * convenience. When a tune is bad you read its plan and see which pass was wrong.
 * The engine this replaces could only be tuned by adjusting one of fourteen
 * weights in a scoring function and listening to a hundred songs, which is not
 * debugging, it is superstition.
 */
export interface TunePlan {
  archetype: ArchetypeId;
  form: FormId;
  /** Scale degrees the tune draws on, 0-based. */
  subset: number[];
  motifs: Motif[];
  phrases: PhraseNode[];
  /** Keyed by phrase id. */
  skeletons: Record<string, Skeleton>;
}

/** What the engine needs to know about the music it is writing into. */
export interface TuneContext {
  /** One chord per bar. */
  chords: Chord[];
  beatsPerBar: number;
  /** Absolute beat where bar 0 of this section sits. */
  startBeat: number;
  tonic: Pc;
  mode: Mode;
  range: [Midi, Midi];
  /** Which scale the tune draws on for a given chord. Genre's business. */
  scaleForChord: (tonic: Pc, mode: Mode, chord: Chord) => Scale;
  /** How the bar groups where it does not group evenly — the 2+2+3 of a 7/8. */
  groups?: readonly number[];
}
