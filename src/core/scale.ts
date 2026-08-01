/**
 * Scales, with the minor-mode handling that iskelmä actually requires.
 *
 * Finnish tango and most minor-key iskelmä is *natural minor melodically but
 * harmonic minor cadentially*: the melody sits in aeolian, but the moment the
 * dominant arrives the 7th degree is raised to give a real leading tone.
 * Writing the two as separate scales and choosing per-chord is the only way to
 * get this right — a single "minor scale" always sounds wrong somewhere.
 */

import type { Midi, Pc } from './pitch.js';
import { pc } from './pitch.js';

export type Mode = 'major' | 'minor';

export const SCALE_STEPS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  /** Aeolian. The default melodic material in minor keys. */
  minor: [0, 2, 3, 5, 7, 8, 10],
  /** Raised 7. Used over dominant-function chords in minor. */
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  /** Raised 6 and 7. Used for ascending approach into the leading tone. */
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],

  // --- Modes and scales the jazz genre needs -----------------------------
  // Jazz melody follows the *chord* rather than the key, so each chord
  // quality gets its own scale. These are the ones that mapping needs.
  /** Minor 7th chords. The default minor sound in jazz, not aeolian. */
  dorian: [0, 2, 3, 5, 7, 9, 10],
  /** Unaltered dominant 7th chords. */
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  /** Major 7th chords wanting a #11 colour. */
  lydian: [0, 2, 4, 6, 7, 9, 11],
  /** Flat 2. The darkest mode ambient reaches for; the sound of a ♭II drone. */
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  /** Half-diminished chords. */
  locrian: [0, 1, 3, 5, 6, 8, 10],
  /** Whole-half diminished, for fully diminished sevenths. Eight notes. */
  diminished: [0, 2, 3, 5, 6, 8, 9, 11],
  /** Six-note blues scale — the ♭3, ♭5 and ♭7 blue notes. */
  blues: [0, 3, 5, 6, 7, 10],
  /** Mixolydian plus a passing major 7th, so chord tones land on the beat. */
  bebopDominant: [0, 2, 4, 5, 7, 9, 10, 11],

  // --- Scales the rest of the world is written in ------------------------
  // Everything above is European common practice or a chord-scale built for
  // it. What follows is the material for genres that are not: pentatonic folk
  // and pop, the maqam and rāga families, and the modes classical and metal
  // both borrowed from them.
  //
  // Two warnings that apply to the whole block, because they are the reason a
  // genre can pick one of these and still sound wrong.
  //
  // First, none of these can be faked by choosing an existing entry on another
  // tonic. `makeScale` takes `tonic` and `name` as a pair and every degree the
  // melody engine counts is counted from that tonic, so the pitch classes
  // being right is only half of it — the note the phrase comes to rest on is
  // the other half, and it is the half that carries the idiom.
  //
  // Second, several of these have a one-scale-step gap of three semitones, and
  // the `augmented-second` rule in `core/rules.ts` vetoes exactly that from
  // strictness level 1 upward. In harmonic minor that veto is correct — it is
  // the accident of reaching for the raised 7th over a dominant. Here the same
  // interval is the whole point, in the pentatonics as much as in Hijaz. A
  // genre whose default scale is one of these has to relax `augmented-second`
  // through its `ruleOverrides`, or the generator will refuse every
  // characteristic move the scale exists to make.

  /**
   * The five-note major scale — rāg Bhoopali, Finnish folk song, country,
   * gospel, and a fair proportion of everything else ever sung. There was no
   * pentatonic of any kind above this line, which is the largest single hole in
   * the table.
   *
   * **Not Durga**, which this comment also claimed until the genre that uses
   * both read it. Durga is `[0, 2, 5, 7, 9]` — a fourth where this has a third —
   * and it is a *rotation* of this row rather than a variant of it, which by the
   * argument at the top of this block is exactly what cannot be reached from
   * here: `makeScale` fixes degree 0 at the tonic, so the right pitch classes
   * with the wrong degree 0 is a different scale. Malkauns `[0, 3, 5, 8, 10]`
   * and Hansadhwani `[0, 2, 4, 7, 11]` are unreachable for the same reason and
   * have no row of their own.
   *
   * It is not `major` with two degrees quietly avoided. The 4 and the 7 are the
   * two notes that carry tonal function, and a generator that still has them in
   * the scale keeps landing on them; removing them from the table is what makes
   * the third-to-fifth move one scale step rather than two, which is where the
   * open, leaping quality of a pentatonic tune comes from.
   */
  majorPentatonic: [0, 2, 4, 7, 9],
  /**
   * Rock, funk, RnB, and every blues-adjacent lead line there has ever been.
   *
   * The pitch classes are those of `majorPentatonic` a minor third up, and it
   * still needs its own row: an A minor pentatonic riff and a C major
   * pentatonic melody are different pieces of music, and the difference lives
   * entirely in which degree is 0.
   *
   * It is also not `blues`, which is this plus the ♭5. That one extra note is
   * worth keeping the two entries apart for: the ♭5 is a note you slide
   * through on the way somewhere, and once it is in the scale the engine will
   * put it on downbeats and hold it for a beat and a half. Riffs want this
   * one; a blues chorus wants the other.
   */
  minorPentatonic: [0, 3, 5, 7, 10],
  /**
   * Maqam Hijaz — a ♭2 over a major third — and the most immediately
   * recognisable Arabic sound there is. The flamenco cadence is the same scale,
   * and so is a great deal of metal.
   *
   * This is the fifth mode of `harmonicMinor`, and that is precisely why it has
   * to be its own row rather than a note in the documentation. Asking for
   * `harmonicMinor` on the tonic a fourth above gives all seven right pitch
   * classes and the wrong degree 0: cadences resolve to that harmonic-minor
   * tonic instead of to the Hijaz tonic a fifth below it, and resolving onto
   * the Hijaz tonic *is* the mode. A generator that takes `tonic` and `name`
   * together cannot express the rotation any other way.
   *
   * Not `phrygian`, despite the name. They share the ♭2; the major third is
   * what makes this one a dominant, and it is also the ♭2-to-♮3 augmented
   * second the rule table has to be told to allow.
   */
  phrygianDominant: [0, 1, 4, 5, 7, 8, 10],
  /**
   * Maqam Hijazkar and rāg Bhairav. Two augmented seconds, ♭2→♮3 and ♭6→♮7,
   * one on each side of the fifth — the scale is the same shape read from
   * either end, and that symmetry is what stops it sounding like a decorated
   * minor and starts it sounding like its own thing.
   *
   * No rotation of anything above reaches it: harmonic minor has one such gap
   * and this has two.
   */
  doubleHarmonic: [0, 1, 4, 5, 7, 8, 11],
  /**
   * Maqam Nawa Athar, rāg Simhendramadhyamam, and the Roma/Balkan minor that
   * Liszt and Bartók both wrote down. Natural minor with the 4 raised as well
   * as the 7, so again two augmented seconds, ♭3→♯4 and ♭6→♮7.
   *
   * **Not Nikriz**, which this comment claimed until the genre that uses these
   * daily read it. The two share their lower jins — the ♭3 and ♯4 that give both
   * their character — and part company above the fifth, where Nikriz takes ♮6
   * and ♭7 and this takes ♭6 and ♮7. That is `[0, 2, 3, 6, 7, 9, 10]` against
   * the row below, a different scale with a different upper tetrachord, and
   * naming it here would have meant a genre reaching for Nikriz and getting
   * something else under the right label. Nikriz proper has no row yet.
   *
   * It is the fourth mode of `doubleHarmonic`, which for the reason given at
   * the top of this block does not make it reachable from it.
   */
  hungarianMinor: [0, 2, 3, 6, 7, 8, 11],
  /**
   * Six notes, every gap a whole tone. Debussy's, and the colour jazz reaches
   * for over an altered dominant when it wants the chord to stop sounding like
   * it is going anywhere.
   *
   * There is no semitone in it, so there is no leading tone; there is no
   * perfect fifth either, so there is no tonic triad. That is a real constraint
   * rather than a curiosity: this belongs on a chord, handed over by a genre's
   * `scaleForChord`, and not as a key's default scale, because a key whose
   * tonic chord is augmented has no home to return to. Only two of these exist
   * — every transposition is one of the two — which is the same fact from the
   * other side.
   */
  wholeTone: [0, 2, 4, 6, 8, 10],
  /**
   * Major with a ♭6 — rāg Charukesi, and the mode-mixture sound that classical
   * and pop both live on: the borrowed iv, the ♭VI that appears in a major key
   * and aches.
   *
   * One note away from `harmonicMinor`, the third, and that one note is the
   * whole reason it earns a row. The sweetness of the major third against the
   * ♭6 is a specific effect with a name; it is not a shade of minor, and a
   * genre asking for it will not accept minor instead.
   */
  harmonicMajor: [0, 2, 4, 5, 7, 8, 11],
} as const satisfies Record<string, readonly number[]>;

export type ScaleName = keyof typeof SCALE_STEPS;

export interface Scale {
  tonic: Pc;
  name: ScaleName;
  /** Absolute pitch classes of the scale, ascending from the tonic. */
  pcs: Pc[];
}

export function makeScale(tonic: Pc, name: ScaleName): Scale {
  return { tonic, name, pcs: SCALE_STEPS[name].map((s) => pc(tonic + s)) };
}

/** Diatonic degree (0-based) of a MIDI note, or -1 if chromatic. */
export function degreeOf(scale: Scale, midi: Midi): number {
  return scale.pcs.indexOf(pc(midi));
}

export function isInScale(scale: Scale, midi: Midi): boolean {
  return degreeOf(scale, midi) >= 0;
}

/**
 * Convert a scale degree index (may be negative or beyond 6, meaning other
 * octaves) into a MIDI note, anchored so that degree 0 in octave `octave` is
 * the tonic.
 */
export function degreeToMidi(scale: Scale, degree: number, octave: number): Midi {
  const len = scale.pcs.length;
  const oct = Math.floor(degree / len);
  const idx = ((degree % len) + len) % len;
  const step = SCALE_STEPS[scale.name][idx]!;
  return (octave + 1) * 12 + scale.tonic + step + oct * 12;
}

/**
 * Snap a MIDI note to the nearest scale tone. Ties resolve downward, which
 * keeps descending melodic lines smooth — the common case in iskelmä phrase
 * endings.
 */
export function snapToScale(scale: Scale, midi: Midi): Midi {
  for (let d = 0; d <= 6; d++) {
    if (scale.pcs.includes(pc(midi - d))) return midi - d;
    if (scale.pcs.includes(pc(midi + d))) return midi + d;
  }
  return midi;
}

/**
 * Step `steps` scale degrees from a note that is assumed to be in the scale.
 * If it isn't, it is snapped first.
 */
/**
 * Signed number of scale steps from `a` to `b`.
 *
 * Used both to store motif shapes for transposition and to tell a real step
 * from a leap that merely looks small in semitones — the augmented second
 * between ♭6 and ♮7 in harmonic minor is one scale step but three semitones,
 * and that distinction is exactly what makes it forbidden.
 */
export function scaleStepsBetween(scale: Scale, a: Midi, b: Midi): number {
  const sa = snapToScale(scale, a);
  const sb = snapToScale(scale, b);
  if (sa === sb) return 0;
  const dir = sb > sa ? 1 : -1;
  let cur = sa;
  for (let n = 1; n <= 24; n++) {
    cur = stepInScale(scale, cur, dir);
    if ((dir > 0 && cur >= sb) || (dir < 0 && cur <= sb)) return n * dir;
  }
  return Math.round((b - a) / 2);
}

export function stepInScale(scale: Scale, midi: Midi, steps: number): Midi {
  const snapped = snapToScale(scale, midi);
  const len = scale.pcs.length;
  const idx = scale.pcs.indexOf(pc(snapped));
  if (idx < 0) return snapped; // unreachable after snapping, but keeps types honest
  // Recover the exact tonic below `snapped`: it sits `stepSemis` semitones down.
  const tonicMidi = snapped - SCALE_STEPS[scale.name][idx]!;
  const target = idx + steps;
  const octShift = Math.floor(target / len);
  const newIdx = ((target % len) + len) % len;
  return tonicMidi + octShift * 12 + SCALE_STEPS[scale.name][newIdx]!;
}
