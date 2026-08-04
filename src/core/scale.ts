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
   * with the wrong degree 0 is a different scale. Durga is `durga`, the row
   * directly below; Malkauns and Hansadhwani are unreachable from here for the
   * same reason and now have rows of their own as well.
   *
   * It is not `major` with two degrees quietly avoided. The 4 and the 7 are the
   * two notes that carry tonal function, and a generator that still has them in
   * the scale keeps landing on them; removing them from the table is what makes
   * the third-to-fifth move one scale step rather than two, which is where the
   * open, leaping quality of a pentatonic tune comes from.
   */
  majorPentatonic: [0, 2, 4, 7, 9],
  /**
   * Rāg Durga — S R m P D. The row above with a Ma where it has a Ga.
   *
   * The `majorPentatonic` docstring already argues this against itself, because
   * that is where the mistake was: the pitch classes are available a fourth
   * away and the tonic is not. C Durga is C D F G A, which is exactly F
   * Bhoopali, and the two are opposite pieces of music. Durga drops Ga and
   * keeps Ma; Bhoopali drops Ma and keeps Ga; both drop Ni. Nothing but the
   * note the phrase comes to rest on tells them apart, and every phrase in
   * either one is built to arrive there.
   *
   * It is worth its own row rather than a note in the documentation for the
   * plainest possible reason: a comment naming a scale is not a scale a genre
   * can ask for, and for as long as this one was only a comment the genre that
   * wanted Durga got Bhoopali under Durga's name.
   */
  durga: [0, 2, 5, 7, 9],
  /**
   * The major pentatonic with the ♭3 put back — C D E♭ E G A. Both thirds
   * inside one phrase, and the ear deciding after the fact which one the note
   * was going to be.
   *
   * Two genres asked for this one independently, which is rare enough here to
   * be most of the argument. `genre/country/index.ts` describes it note for
   * note and then declines to invent it, on the grounds that the catalogue is
   * shared and a six-note hybrid built in one folder would be a scale nobody
   * else could read. Instead it splits the claim: the genre answers with the
   * major pentatonic and its four electric styles — `rockabilly`,
   * `bakersfield`, `truckdriving`, `outlaw` — override to the **minor**
   * pentatonic. That header records precisely what the split costs, and it is
   * not the blue note, which the minor pentatonic has. It is the *mixture*, the
   * phrase with both thirds in it that a Bakersfield Telecaster line is made
   * of, and no five-note scale can produce it. `genre/rock/index.ts` has the
   * same tension over eight styles and settles it the same way.
   *
   * Not `blues`, which is the minor pentatonic plus a ♭5 — a different scale
   * for a different job. That one has no ♮3 at all, so the ♭3-to-♮3 slide over
   * a major chord is unavailable in it by construction, and its extra note is
   * the flat fifth, which country's `styles.ts` singles out as the line between
   * a country record and a blues. The two are near neighbours on paper and
   * opposite answers to the same question.
   *
   * Not `majorPentatonic` with a passing note either, and the difference is the
   * table rather than the pitch. A chromatic neighbour outside the scale is a
   * note the generator never chooses; a note inside it is one the generator will
   * land on and hold. Adjacent degrees a semitone apart are what let a line pass
   * *through* the blue third on the way to the chord tone, which is the gesture.
   * Six notes also keeps both three-semitone steps this inherits from the
   * pentatonic — ♮3 to 5̂ and 6̂ to the octave — so the `augmented-second`
   * warning above applies here in full, and country has already turned that rule
   * off at every strictness level for exactly this reason.
   */
  majorBlues: [0, 2, 3, 4, 7, 9],
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
   * Rāg Malkauns — S g m d n. A midnight rāg, one of the oldest shapes in
   * Hindustani music, and the reason the row above is named Dhani in the genre
   * that plays both.
   *
   * Its intervals are a rotation of that row's and its tonic is not, which is
   * the first warning above stated as a rāga. Asking for `minorPentatonic`
   * hands back a Pa that Malkauns does not have, and the result is not a
   * Malkauns held wrong — it is Dhani, a real and separate rāg with its own
   * repertoire and its own hour. `genre/indian/styles.ts` reached that
   * conclusion on its own and did the honest thing rather than the convenient
   * one: the style that wanted Malkauns is written on Dhani and *named* Dhani,
   * and the constant table says so on the line where `DHANI` is defined.
   *
   * This row is what lets the two be different pieces. Malkauns refuses Re and
   * Pa; Dhani refuses Re and Dha. Refusing the fifth is the whole character —
   * a rāg with no Pa has no consonance to fall back on and no obvious place to
   * rest below Sa, which is what makes Malkauns sound unlit and suspended where
   * Dhani sounds merely plaintive. A table that can only spell the one with a Pa
   * cannot say that.
   */
  malkauns: [0, 3, 5, 8, 10],
  /**
   * Rāg Hansadhwani — S R G P N. Carnatic in origin, borrowed north, and the
   * piece a concert opens with; Vatapi Ganapatim is in it, which makes this
   * plausibly the most performed five notes in the whole repertoire.
   *
   * Unlike the two rotations above it is not reachable from anything here at
   * any tonic. Every other pentatonic in this block is anhemitonic — no two of
   * their notes are a semitone apart — and this one closes the gap under the
   * octave with a ♮7. That leading tone is the rāg: phrases climb to Ni, lean
   * on it, and the Sa above answers, which is a gesture no anhemitonic
   * pentatonic can make at all. It is also why there was no five-note entry it
   * could be approximated from, which is what `genre/indian/styles.ts` says
   * where it lists the three rāgas from its brief that it had to leave out.
   *
   * Five notes with a leading tone also makes the steps wildly uneven — one
   * semitone at the top, four from Pa to Ni, three from Ga to Pa — and both
   * warnings above land on it. Ga to Pa is one scale step of exactly three
   * semitones, which is what `augmented-second` vetoes; and Ga to Ni, two steps
   * and the most ordinary motion this rāg has, is a perfect fifth, which
   * `wide-leap` counts as a leap.
   */
  hansadhwani: [0, 2, 4, 7, 11],

  // No Japanese pentatonic, which is a gap rather than an oversight and is
  // recorded here so the next reader does not have to rediscover it. `koto`,
  // `shamisen` and `dantranh` all sit in `style/instruments.ts` with ranges and
  // concert archetypes, and there is nothing in this table any of them would
  // actually be played in: hirajoshi is `[0, 2, 3, 7, 8]`, built on semitones
  // where every pentatonic above is built to avoid them, and no rotation of any
  // row reaches it. Two things argue against writing it down today. It is a
  // *tuning* before it is a scale — a koto is not an instrument that plays
  // hirajoshi, it is an instrument strung to it, and the engine has no tuning
  // concept at all — and no genre in the catalogue is Japanese, so the row would
  // be chosen by nobody, for nothing. When one is written it will want hirajoshi
  // and kumoi and their rotations iwato and in-sen, which is four rows and not
  // two, picked together by someone who knows which pieces need which.

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
   * something else under the right label. Nikriz proper is `nikriz`, the row
   * directly below.
   *
   * It is the fourth mode of `doubleHarmonic`, which for the reason given at
   * the top of this block does not make it reachable from it.
   */
  hungarianMinor: [0, 2, 3, 6, 7, 8, 11],
  /**
   * Maqam Nikriz — dorian with the fourth raised. The row above's lower jins
   * and a different world above the fifth.
   *
   * The two share jins Nikriz on the tonic, the ♭3 and ♯4 that both are
   * identified by in their first four notes, and part company at the sixth:
   * this takes ♮6 and ♭7 where Nawa Athar takes ♭6 and ♮7. One degree apart in
   * each direction, and a maqam is named for its upper jins as much as its
   * lower, so a genre asking for Nikriz and receiving Nawa Athar gets the right
   * opening and the wrong destination — which is what was happening, under this
   * label, until the genre that plays these daily read the comment.
   *
   * The difference is not cosmetic and `genre/arabic/index.ts` has already
   * written down its consequence from the other side. Nawa Athar's ♮7 gives it
   * a real dominant and its ♯4 leaves nothing usable on the fourth degree, so
   * every progression table in that genre locks it out and it survives in
   * `taqsim` alone, over a drone with no chords to contradict it. This scale's
   * upper tetrachord is dorian's, so it keeps dorian's chords wherever the ♯4 is
   * not involved and has no leading tone at all: a genre choosing it is choosing
   * a modal cadence over a dominant one, which is the more common Arabic
   * answer and one the table could not previously give.
   *
   * One augmented second rather than two — ♭3 to ♯4 — and it still needs
   * `augmented-second` relaxed, because that one interval is the jins.
   */
  nikriz: [0, 2, 3, 6, 7, 9, 10],
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

  // No `altered` (or `superLocrian`, which is the same seven notes under a
  // second name), no `lydianDominant`, no `prometheus` — three decisions rather
  // than three gaps, and each fails a different test.
  //
  // The altered scale is already being played. `genre/jazz/index.ts` answers
  // every altered dominant with `makeScale(pc(root + 1), 'melodicMinor')`, and
  // those are the seven right pitch classes: the altered scale *is* melodic
  // minor a semitone up, and it is how the players who use it think of it, so
  // the call reads as the idiom rather than as a workaround. It does put degree
  // 0 on the ♭9 instead of the chord root, which the first warning at the top of
  // this block would normally make fatal — except that warning is about *keys*,
  // as `wholeTone`'s own comment says in as many words. A chord scale lasts one
  // chord and no phrase cadences to its tonic. The single place degree 0 leaks
  // into one is `snapToSubset`, and there the offset yields a subset counted
  // from the ♭9, which over a dominant is a rootless altered colour and is what
  // the chord wanted. A row would buy a tidier degree 0 and nothing audible.
  //
  // Lydian dominant fails a different test: nothing could select it. There is no
  // `ChordQuality` in `core/chord.ts` meaning a ♯11 dominant, so `dom7`, `dom9`
  // and `dom13` are the whole population and `mixolydian` is the right answer to
  // all three. The row would have to come after the chord quality, not before.
  //
  // Prometheus is one composer's chord written out as a scale. No genre in this
  // catalogue is written on Scriabin, and `wholeTone` already holds the job the
  // nearest genre would reach for it to do.

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
