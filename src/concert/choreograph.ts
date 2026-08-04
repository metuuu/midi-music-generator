/**
 * Choreography — which limb plays which note, where, how hard, and when it has
 * to start moving.
 *
 * `Song + Cast → Choreography`. Pure data in, pure data out, no geometry and no
 * renderer: the choreographer knows that the high tom is being hit and has no
 * idea where the high tom is. That wall is the whole reason the concert can be
 * built in parallel, and it is also the reason this file can be *measured*
 * rather than looked at.
 *
 * Four decisions carry the file, and each of them was arrived at by asking what
 * the alternative would look like on stage:
 *
 *  1. **Prep is computed in seconds and converted to beats, never the reverse.**
 *     A stick crossing a kit takes about a fifth of a second whether the tune is
 *     a ballad or a humppa — travel is a fact about an arm, not about a tempo.
 *     Writing prep as a constant fraction of a beat (the obvious first version)
 *     gives a drummer at 63 bpm a windup a third of a second too long and one at
 *     180 bpm a windup that starts after the previous note has finished. Both
 *     read as wrong immediately and neither is fixable downstream.
 *
 *  2. **A limb is scheduled, not triggered.** Every gesture is placed against
 *     the previous gesture on the same effector, and the previous gesture's
 *     follow-through is *trimmed* to make room for this one's windup rather than
 *     the windup being shortened to fit. A hand that starts moving on the beat
 *     arrives after it, and a band that arrives after the beat looks like it is
 *     miming to a recording — which, technically, it is, so the one thing the
 *     animation must never do is admit it.
 *
 *  3. **Hand assignment is by proximity in the instrument's own space,** with a
 *     hard "can it get there in time" test that is allowed to override
 *     proximity. There is no geometry here, so proximity cannot be metres; see
 *     `kitDistance` and `whereInRange` for what it is instead, and for the
 *     limitation that implies. Greedy everywhere except the kit, where a
 *     drummer's two sticks are planned as a path rather than a series of
 *     independent choices — see `planSticking`, and the argument there for why
 *     greedy cannot answer "which hand starts the fill".
 *
 *  4. **Sustaining instruments do not strike.** A bowed line travels and changes
 *     direction; a blown line does not travel at all — the fingers move and the
 *     air does the rest — and it has to breathe, which is the first thing in
 *     this project to make any use of `IDIOMS[...].breath`.
 *
 * What is deliberately *not* here: head nods, foot taps, sway, weight shifts,
 * looking at the soloist. Those are caused by the band rather than by this
 * player's notes, they belong to `concert/groove.ts`, and a player who has both
 * would nod twice. Everything below is caused by a note, by the absence of one
 * (a breath, a bow lift), or by the mechanics of making one (bellows).
 */

import { quantise, quantiseDown } from '../core/grid.js';
import type { Midi } from '../core/pitch.js';
import { Rng } from '../core/rng.js';
import type { DrumEvent, DrumVoice, NoteEvent, Song, Track } from '../core/types.js';
import { IDIOMS, INSTRUMENTS } from '../style/instruments.js';
import {
  boardGap, boardsFor, drumEventsFor, instrumentIdForTrack, rangeForTrack, specFor,
  type BoardSpec,
} from './instruments.js';
import type {
  Archetype, ArchetypeSpec, Cast, Choreography, Effector, Gesture, GestureKind,
  PartRef, Performer, PerformerPart, PlayPoint, StageMachine,
} from './types.js';

// ---------------------------------------------------------------------------
// How long a limb takes
// ---------------------------------------------------------------------------

/**
 * Windup, in **seconds**: `base + travel × reach + lift × force`.
 *
 * `reach` is 0..1, the fraction of the player's reach the effector has to
 * cross; `force` is 0..1 from note velocity. So a ghost note played where the
 * stick already is costs `base` alone, and a hard crash from the far side of the
 * kit costs all three terms — 0.06 + 0.22 + 0.10 ≈ a third of a second, which at
 * 114 bpm is two thirds of a beat of visible arm.
 *
 * These are the numbers Wave 3 will argue about, and they are in one table for
 * exactly that reason. The ratios matter more than the absolutes: the difference
 * between a ghost note and a crash has to be *four times*, not twenty percent,
 * or the whole point of computing prep is lost and a constant would have done.
 */
const PREP_SECONDS: Record<GestureKind, readonly [base: number, travel: number, lift: number]> = {
  strike: [0.06, 0.22, 0.10],
  pluck: [0.04, 0.12, 0.03],
  press: [0.05, 0.18, 0.04],
  // A bow reverses rather than arrives; most of the cost is the direction
  // change itself, and almost none of it is where along the string it happens.
  bow: [0.09, 0.10, 0.05],
  // Nothing travels. The embouchure sets and the valve is already under a
  // finger. Kept non-zero so the face has somewhere to move from.
  blow: [0.03, 0.02, 0.02],
  squeeze: [0.10, 0.00, 0.06],
  hold: [0.03, 0.06, 0.01],
  // `lift` carries the idiom's breath number rather than a velocity here — see
  // `breatheInRests`. A brass player at 0.9 inhales for half a second.
  breathe: [0.18, 0.00, 0.35],
  sway: [0.25, 0.00, 0.00],
};

/** Follow-through, in seconds: `base + byForce × force`. */
const RELEASE_SECONDS: Record<GestureKind, readonly [base: number, byForce: number]> = {
  strike: [0.06, 0.14], // the rebound, and it is bigger off a hard hit
  pluck: [0.05, 0.06],
  press: [0.04, 0.04],
  bow: [0.06, 0.04],
  blow: [0.04, 0.03],
  squeeze: [0.12, 0.00],
  hold: [0.04, 0.00],
  breathe: [0.04, 0.00],
  sway: [0.10, 0.00],
};

/**
 * Kinds where the effector stays engaged for as long as the note sounds.
 *
 * A finger stays on a key, a bow keeps travelling, a mouth keeps blowing. A
 * stick does not stay on a drum — it bounces off, which is why `strike` and
 * `pluck` are absent and take their release from force alone.
 */
const SUSTAINS = new Set<GestureKind>(['press', 'bow', 'blow', 'hold', 'squeeze']);

/**
 * Ceiling on a sustained release, in beats.
 *
 * A four-bar pad note does not need a four-bar follow-through: after a second or
 * two the hand is simply resting on the keys and the runtime can hold the last
 * pose. Uncapped, one long note would swallow the whole rest of the phrase when
 * the scheduler trims.
 */
const MAX_SUSTAIN_BEATS = 4;

/**
 * How much of the gap between two gestures on one limb the windup may claim.
 *
 * The windup wins, always. A late arrival is visible on every note; a truncated
 * bounce is visible on none.
 *
 * The first version split the gap evenly-ish and it inverted the one ratio this
 * whole file exists to get right: measured across every genre, a **crash came
 * out with a smaller windup than a snare** — 118 ms against 160 ms — because
 * crashes land immediately after a fill where the gap is tight, and an even
 * split handed a quarter of that tight gap to a rebound nobody is watching. The
 * fix is that the previous gesture keeps its follow-through only up to this
 * fraction of the gap; the arm leaves early and the crash gets its swing.
 */
const PREP_SHARE = 0.75;

// ---------------------------------------------------------------------------
// The scheduler
// ---------------------------------------------------------------------------

/** One motion of one limb: a stroke, a chord grab, a strum. */
interface Motion {
  effector: Effector;
  /** Already quantised. */
  beat: number;
  kind: GestureKind;
  /** 0..1 fraction of the player's reach this motion crosses. */
  travel: number;
  /** 0..1, from velocity. */
  force: number;
  /** Note length in beats, for the sustaining kinds. */
  sustainBeats?: number;
  /** One gesture per target, all sharing this motion's timing. */
  targets: PlayPoint[];
}

/**
 * A performer's limbs, and the invariant that they are only ever in one place.
 *
 * The class exists to hold one rule: **a gesture's prep window may not start
 * before the previous gesture on that limb has released.** Everything that makes
 * the concert check's physical assertions pass is here rather than scattered
 * through the part builders, so there is exactly one place where it can be
 * wrong.
 */
class Board {
  readonly gestures: Gesture[] = [];
  private readonly limbs = new Map<Effector, { beat: number; last: Gesture[] }>();

  constructor(
    private readonly bpm: number,
    /**
     * Per-performer multiplier on every windup, a few percent either side of 1.
     *
     * A band whose windups are identical to the millisecond is a band of
     * clones. This is the cheapest possible fix and it is deterministic from the
     * performer's id, so the same seed still gives the same show.
     */
    private readonly loose: number,
  ) {}

  /**
   * Seconds to beats, and the direction is the decision.
   *
   * Travel is a fact about an arm and rests are a fact about a lung; both are
   * measured in seconds and neither knows what the tempo is. Everything in this
   * file is therefore written in seconds and converted here, exactly once.
   */
  toBeats(seconds: number): number {
    return (seconds * this.bpm) / 60;
  }

  /**
   * Whether this limb could cross `travel` and arrive by `beat`.
   *
   * The hard "cannot be in two places at once" test. It is deliberately
   * separate from the greedy proximity choice: proximity says which hand
   * *should* take a note, this says which hand *can*, and when they disagree
   * this one wins. That disagreement is the whole of the fill-crossing
   * behaviour — the hat hand is nearest to the next hat but is still on the
   * floor tom, so the hat goes elsewhere.
   */
  canReach(effector: Effector, beat: number, travel: number, kind: GestureKind): boolean {
    const last = this.limbs.get(effector);
    if (!last) return true;
    if (beat <= last.beat) return false;
    const [base, per] = PREP_SECONDS[kind];
    return beat - last.beat >= this.toBeats(base + per * clamp01(travel));
  }

  place(motion: Motion): void {
    const [pBase, pTravel, pLift] = PREP_SECONDS[motion.kind];
    const [rBase, rForce] = RELEASE_SECONDS[motion.kind];
    const force = clamp01(motion.force);

    let prep = this.toBeats(
      (pBase + pTravel * clamp01(motion.travel) + pLift * force) * this.loose,
    );
    let release = this.toBeats(rBase + rForce * force);
    if (SUSTAINS.has(motion.kind)) {
      release = Math.max(release, Math.min(motion.sustainBeats ?? 0, MAX_SUSTAIN_BEATS));
    }

    const limb = this.limbs.get(motion.effector);
    let companion = false;
    if (limb && motion.beat > limb.beat) {
      // Split the gap: the previous gesture keeps its follow-through, but only
      // as far as its share of the gap, and the windup takes everything else it
      // wants. Then the follow-through is trimmed to whatever is actually left.
      // These two lines are what makes "prep starts after the previous release"
      // true by construction rather than by assertion.
      const gap = motion.beat - limb.beat;
      const held = Math.max(0, ...limb.last.map((g) => g.release));
      prep = Math.min(prep, Math.max(0, gap - Math.min(held, gap * (1 - PREP_SHARE))));
      const ceiling = Math.max(0, gap - prep);
      for (const g of limb.last) g.release = Math.min(g.release, ceiling);
    } else if (limb && motion.beat === limb.beat) {
      // One motion, more than one surface — the overflow branch at the end of
      // `drumPart`. A clap layered on the backbeat and a rim shot are the same
      // stroke, not a third arm, so they inherit that stroke's timing instead of
      // competing with it for the limb.
      companion = true;
      prep = limb.last[0]?.prep ?? prep;
      release = limb.last[0]?.release ?? release;
    }
    // Nothing may wind up from before the downbeat. A real band gets that
    // runway from the count-in, which the show runner owns and this IR does not
    // describe; the first note of a number simply arrives with less arm.
    prep = Math.max(0, Math.min(prep, motion.beat));

    const made: Gesture[] = motion.targets.map((target) => ({
      beat: motion.beat,
      prep,
      release,
      effector: motion.effector,
      target,
      force,
      kind: motion.kind,
    }));
    this.gestures.push(...made);
    this.limbs.set(motion.effector, {
      beat: motion.beat,
      last: companion && limb ? [...limb.last, ...made] : made,
    });
  }
}

// ---------------------------------------------------------------------------
// Proximity, without geometry
// ---------------------------------------------------------------------------

/**
 * The kit, laid out left to right as the drummer meets it.
 *
 * **This is the limitation the plan asked to have stated plainly.** The
 * choreographer has no geometry — where the floor tom actually stands is the
 * drum-kit model's business and this file must never know — so "how far has the
 * stick got to go" cannot be a distance in metres. What it can be is the thing a
 * drummer would actually say: a kit is an arc in front of you, and what costs a
 * stroke time is *sweeping across that arc*.
 *
 * So `sweep` is a fraction of the drummer's span, 0 at the hi-hat side and 1 at
 * the ride, and `tier` separates the heads from the cymbals above them. The
 * numbers are a conventional right-handed kit; the model is free to stand
 * everything somewhere else and the *relative* ordering will still be right,
 * which is all the metric uses.
 *
 * Two things this metric gets wrong, on purpose. It cannot see that a crash
 * sits higher above the snare than the sweep suggests — the `force` term covers
 * for that, since crashes arrive loud and a loud hit already buys a bigger
 * windup. And it treats the kit as symmetric for a left-handed player, which
 * nobody has asked for.
 *
 * ## The ordering is now load-bearing, and four entries had to be corrected
 *
 * "The relative ordering will still be right, which is all the metric uses" was
 * true while the only question asked of this table was how long a stroke takes.
 * It is not the only question any more: `tangle` reads `sweep` as *which side of
 * the body a surface is on* and `tier` as *whether an arm can pass over another
 * one*, so a voice filed on the wrong side of its neighbours no longer costs a
 * few milliseconds of windup, it sends the wrong hand across the kit.
 *
 * Four entries disagreed with the kit the renderer actually builds, and all four
 * moved to agree with it. The clap pad is not beside the snare, it is on a boom
 * *outboard of the crash*, which is the far left of the kit and the longest
 * reach on it. Brushes are played on the snare — `sh` resolves to a point a
 * centimetre above the batter head — so they are at the snare's sweep rather
 * than out past the mid tom. The woodblock is to the *right* of the mid tom on
 * its bracket, not to the left of it. And both bracket pieces are mounted a full
 * head-height above the drums, which is `tier: 1` for the same reason a ride is.
 *
 * This is still not geometry — no metre appears here and none may — but where
 * the model has an opinion about which side of a drummer something stands, this
 * table now shares it.
 */
const KIT: Record<DrumVoice, { sweep: number; tier: number }> = {
  cp: { sweep: 0.02, tier: 0 },
  /**
   * Clamped to the hi-hat stand's upper rod: a shade outboard of the hats and a
   * head-height above them, which is where a drummer bolts one and which is why
   * it files between the clap pad and the hats rather than beside the crash.
   */
  tb: { sweep: 0.04, tier: 1 },
  hh: { sweep: 0.06, tier: 1 },
  oh: { sweep: 0.06, tier: 1 },
  cr: { sweep: 0.18, tier: 1 },
  rim: { sweep: 0.32, tier: 0 },
  sd: { sweep: 0.34, tier: 0 },
  sh: { sweep: 0.34, tier: 0 },
  ht: { sweep: 0.46, tier: 0 },
  cb: { sweep: 0.50, tier: 1 },
  bd: { sweep: 0.50, tier: 0 }, // a foot; here so the record is total
  mt: { sweep: 0.64, tier: 0 },
  perc: { sweep: 0.70, tier: 1 },
  lt: { sweep: 0.78, tier: 0 },
  rd: { sweep: 0.90, tier: 1 },
  /**
   * The three hand-drum strokes, **which no drummer plays and which this table
   * keeps only because it is a total record.**
   *
   * They used to be live entries, on the argument that a genre writing them
   * needed sane prep times rather than a type error, and with a note saying no
   * era drew them. Seven genres draw them now, and the prep times were the
   * least of it: the kit had no hand drum on it, so every one of those strokes
   * was a windup toward a patch of air past the floor tom.
   *
   * They belong to `HAND_REACH` and to `handdrum` now, and `drumStations` sees
   * to it that `drumPart` is never handed one. `kitDistance` is the only reader
   * of this table and it is only ever called from there, so these numbers are
   * unreachable; the record stays total because widening `DrumVoice` should
   * still be a compile error somebody has to answer for.
   */
  mp: { sweep: 0.82, tier: 0 },
  lp: { sweep: 0.85, tier: 0 },
  hp: { sweep: 0.88, tier: 0 },
};

/** Sweep across the kit, plus a lift between the heads and the cymbals. */
function kitDistance(from: DrumVoice, to: DrumVoice): number {
  const a = KIT[from];
  const b = KIT[to];
  return Math.min(1, Math.abs(a.sweep - b.sweep) + 0.22 * Math.abs(a.tier - b.tier));
}

/**
 * A pitch as a fraction of what this instrument can reach.
 *
 * The pitched equivalent of the kit sweep, and the same argument: a keyboard is
 * a line, a hand travels along it, and the only honest measure available here is
 * how much of the instrument that crossing represents. Crossing half a piano and
 * crossing half a kit both come out at 0.5, which is what lets one prep formula
 * serve every archetype.
 */
function whereInRange(midi: Midi, [lo, hi]: [Midi, Midi]): number {
  return hi > lo ? clamp01((midi - lo) / (hi - lo)) : 0.5;
}

// ---------------------------------------------------------------------------
// Reach
// ---------------------------------------------------------------------------

/** The two limbs that play a pitched line, whatever they are holding. */
type Hand = 'left-hand' | 'right-hand';

/**
 * The span of pitch one hand can cover in a single grab, in semitones.
 *
 * An octave on a keyboard, which is the reach the phrase "an octave stretch"
 * refers to and comfortably covers the 9-semitone median voicing this generator
 * writes. Two mallets in one hand cover less.
 */
function handSpanSemitones(archetype: Archetype): number {
  return archetype === 'mallets' ? 10 : 12;
}

/**
 * The widest chord one hand will actually be given, in semitones, and why that
 * is not the same number as the stretch above.
 *
 * `handSpanSemitones` answers "can the thumb and the little finger reach the
 * ends of this", and answering "does this go to one hand" with it put the
 * busier hand on 72.2% of a chordal keyboard part's notes, with one hand
 * playing **every** note of 9.0% of them. That is the same failure `malletPart`
 * was written to fix and it survived here because a keyboard is genuinely
 * played one-handed often enough that the symptom looks like the idiom. With
 * the two questions separated the same corpus reads 68.6% and 5.9%.
 *
 * A part that is genuinely a *line* is untouched by any of this and stays
 * one-handed 92.7% of the time, which is correct: a pianist playing a melody
 * plays it with one hand. Making both hands busy on those is the generator's
 * job, not this one's — see `Style.twoHanded`.
 *
 * Two questions were being answered with one number, and they come apart as
 * soon as the chord has more than two notes in it:
 *
 *  - **Three notes inside an octave are one grab.** Thumb, a finger and the
 *    little finger; a pianist would be surprised to be asked for two hands, and
 *    the rootless left-hand shell this generator writes is exactly this shape.
 *  - **Four notes inside an octave are two hands.** Not because the octave is
 *    out of reach — physically it is one hand — but because a four-note voicing
 *    is *voiced* in two: the shell below and the colour tones above. It is what
 *    a pianist does bar after bar, and the four-note guide voicing behind every
 *    jazz comp in the catalogue is the single most common chord here.
 *
 * So width decides up to three notes and stops deciding at four, where there is
 * no span at which one hand is the answer. The generator's voicings measure a
 * median of nine semitones and a mean of eleven, mostly in four voices — which
 * is precisely the band that used to land on the one-hand side of a twelve and
 * now lands where a pianist puts it.
 *
 * The mallet player is exempt and keeps the stretch: two sticks in one hand
 * have no fingers to fit between, so their only limit is reach. They do not
 * reach this function anyway — `malletPart` has its own rules — and the guard
 * is here so that stops being true silently.
 */
function grabSpan(archetype: Archetype, notes: number): number {
  if (archetype === 'mallets') return handSpanSemitones(archetype);
  return notes >= 4 ? -1 : handSpanSemitones(archetype);
}

/**
 * Whether one hand could carry this part from end to end.
 *
 * The question casting has to answer before it can put two lines on one player:
 * a person has two hands, so two parts fit one body exactly when each of them
 * fits one hand. A part with a single voicing wider than a grab is a two-handed
 * part and cannot be anybody's second line — it *is* their line.
 *
 * **Exported, and the direction of that import is the point.** What a hand can
 * hold is a fact this file owns — see `grabSpan` above, and the corpus argument
 * in it — and `cast.ts` needs the answer to decide whether a band of five
 * keyboard players is really a band of four. The alternative is a second copy of
 * `grabSpan`'s rule in a file that has no business restating it, which is the
 * failure mode this project keeps writing single-owner tables to avoid. See
 * `mergeStations`.
 *
 * It reads the raw pitches rather than the folded ones `keyboardPart` groups,
 * which is an approximation of exactly one kind: a note outside the
 * instrument's reach is folded by octaves before it is grouped, so a part with
 * such a note could be judged on a span it will not actually be played at.
 * `npm run concert` measures that at 0.0000% of notes, so the two agree
 * everywhere it matters and the honest thing is to say so rather than to thread
 * a reach through here.
 */
export function oneHanded(archetype: Archetype, notes: readonly NoteEvent[]): boolean {
  for (const group of groupByBeat(notes.slice())) {
    if (group.length < 2) continue;
    const midis = group.map((n) => n.midi).sort((a, b) => a - b);
    const span = midis[midis.length - 1]! - midis[0]!;
    if (span > grabSpan(archetype, midis.length)) return false;
  }
  return true;
}

/**
 * What this player can physically be asked for.
 *
 * Three sources, intersected, and each of them can be the binding one:
 *
 *  - **The archetype's range**, which is what the *model* is able to resolve. A
 *    violin model has no MIDI 36 to put a finger on.
 *  - **The catalogue entry's range**, where it is narrower. A tenor sax is one
 *    of four instruments sharing the saxophone model, and the archetype's
 *    88-note span is the union of all four; letting a tenor part run to the top
 *    of it would put a soprano's altissimo on a tenor player.
 *  - **The strings**, where there are any. An electric bass declares 28..67 but
 *    four strings and twenty frets stop at 63, and a hand asked for a 65 has
 *    nowhere to go. Doing this here means the fingering chooser never has to
 *    fail.
 *
 * That last clause is load-bearing now rather than a nicety, because
 * `chooseStops` no longer clamps a note onto the neck when it cannot place it —
 * it drops it. What makes dropping safe is the guarantee this function gives:
 * **every pitch in the returned span sits on at least one string.** The two
 * clamps only pin the ends of it, and the middle is covered because every
 * tuning in `ARCHETYPES` overlaps: no string sits more than seven semitones
 * above the one below it and the shortest neck in the table is nineteen frets,
 * so each string's window opens far inside the window below it. A tuning whose
 * windows did *not* overlap would leave a hole in the middle of a span this
 * hands back as reachable, and the honest fix for that would be here, in the
 * reach, rather than in the hand that has to find somewhere to put the note.
 *
 * Where the catalogue entry is *wider* than the archetype — a string ensemble
 * voicing down to C2 — the archetype wins, because one violinist is standing in
 * for the whole section and the cellos are not on stage. Those notes fold.
 */
function reachFor(spec: ArchetypeSpec, track?: Track): [Midi, Midi] {
  let [lo, hi] = spec.range;
  const catalogue = track ? rangeForTrack(track) : undefined;
  if (catalogue) { lo = Math.max(lo, catalogue[0]); hi = Math.min(hi, catalogue[1]); }
  if (spec.strings?.length) {
    lo = Math.max(lo, Math.min(...spec.strings));
    hi = Math.min(hi, Math.max(...spec.strings) + (spec.frets ?? UNFRETTED_STOPS));
  }
  // A catalogue entry and an archetype that do not overlap at all would be a
  // casting bug rather than a choreography one; trust the object being held.
  return lo <= hi ? [lo, hi] : spec.range;
}

/**
 * How far up an unfretted string a hand goes.
 *
 * Two octaves. A violinist in seventh position is a normal thing and a double
 * bassist in thumb position is a slightly less normal one; beyond that the note
 * belongs on the next string up, which the chooser will find because the cost
 * of a fret this high exceeds the cost of crossing.
 */
const UNFRETTED_STOPS = 24;

/**
 * Bring a note the instrument cannot reach into the nearest octave it can.
 *
 * These are rare — around one note in seven thousand is outside its own
 * catalogue entry's range — and they are *real*: the generator writes for a
 * register rather than for a player, so once in a while it puts a B1 on a cello
 * whose bottom string is a C. Widening the cello to accept it would be a lie
 * about the instrument, and emitting an unreachable `PlayPoint` would leave a
 * model to resolve a note it does not have and a hand hovering in mid-air.
 *
 * Octave-folding is what a real player does with a part written out of their
 * register, and it is invisible on stage because the audience is watching a hand
 * rather than reading the part. It happens more often than the raw stray rate
 * suggests for one specific and deliberate reason: a string *ensemble* voices
 * down to C2, and the ensemble is staged as one violinist standing in for the
 * section, so the cellos that are not on stage fold up into the violin.
 */
function foldIntoReach(midi: Midi, [lo, hi]: [Midi, Midi]): Midi {
  let m = midi;
  while (m < lo) m += 12;
  while (m > hi) m -= 12;
  return Math.max(lo, Math.min(hi, m));
}

// ---------------------------------------------------------------------------
// The public surface
// ---------------------------------------------------------------------------

/**
 * Which effectors actually make the sound on this archetype.
 *
 * Exported because the coverage assertion — one gesture per sounding note —
 * needs to be able to tell a note apart from the things that accompany it. A
 * guitarist's left hand frets and their right hand plucks, so a note produces
 * two gestures and only one of them is the note; a trombonist's right hand moves
 * the slide but the sound comes out of their mouth.
 *
 * Combined with `target.kind !== 'rest'`, which excludes breaths and bow lifts,
 * this identifies the sounding gesture exactly.
 */
export function soundingEffectors(archetype: Archetype): readonly Effector[] {
  switch (archetype) {
    case 'drumkit':
      return ['left-hand', 'right-hand', 'left-foot', 'right-foot'];
    // A hand drummer's feet do nothing. `ARCHETYPES.handdrum` has no `pedal` in
    // its `points` for the same reason, and this is the half of that statement
    // the coverage assertion reads.
    case 'handdrum':
      return ['left-hand', 'right-hand'];
    case 'violin':
    case 'cello':
      return ['bow', 'right-hand'];
    case 'acoustic-guitar':
    case 'electric-guitar':
    case 'upright-bass':
    case 'electric-bass':
    case 'sitar':
      return ['right-hand'];
    case 'trumpet':
    case 'trombone':
    case 'saxophone':
    case 'clarinet':
    case 'flute':
    case 'harmonica':
    case 'singer':
      return ['mouth'];
    default:
      // Keyboards, mallets, harp, accordion: both hands sound, and an organist's
      // left foot reaches the pedalboard.
      return ['left-hand', 'right-hand', 'left-foot'];
  }
}

/**
 * `Song + Cast → Choreography`.
 *
 * Casting is somebody else's problem: the cast arrives decided, and every
 * performer in it is choreographed against whichever track carries their layer.
 * A performer with no track, or a track with no notes, gets an empty part rather
 * than being dropped — the stage still has to put them somewhere and the groove
 * score still has to give them something to do.
 */
export function choreograph(song: Song, cast: Cast): Choreography {
  const parts: Record<string, PerformerPart> = {};
  for (const performer of cast.performers) {
    parts[performer.id] = {
      performerId: performer.id,
      gestures: gesturesFor(
        song, performer,
        (cast.machines ?? []).filter((m) => m.tendedBy === performer.id),
      ),
    };
  }
  return { parts };
}

function gesturesFor(
  song: Song, performer: Performer, machines: StageMachine[] = [],
): Gesture[] {
  const spec = specFor(performer.archetype);
  // Deterministic from the song and the performer, so the same seed gives the
  // same show and adding a player cannot reshuffle anyone else's timing.
  const rng = new Rng(`${song.meta.seed}:choreo:${performer.id}`);
  const board = new Board(song.meta.bpm, rng.float(0.9, 1.12));

  if (performer.archetype === 'handdrum') {
    handPart(drumEventsFor(song.drums.events, 'handdrum'), board);
  } else if (performer.archetype === 'drumkit' || performer.layer === 'drums') {
    // Their share of it. A percussion part is one event stream over as many as
    // two players — see `drumStations` — and the kit's share is everything the
    // hand drum did not take. When there is no hand drum that is all of it,
    // which is every number this file was written against.
    drumPart(drumEventsFor(song.drums.events, 'drumkit'), board);
  } else {
    /**
     * Every line this player is carrying, and there is usually one.
     *
     * A part that resolves to no track, or to a track with no notes, is dropped
     * here rather than choreographed as silence — `choreograph` promises a
     * performer with nothing to play an empty part, and a double that has gone
     * missing should leave the hand that would have been on it free.
     */
    const parts: { track: Track; notes: NoteEvent[] }[] = [];
    for (const ref of [performer, ...(performer.doubles ?? [])]) {
      const track = trackForPart(song, ref);
      if (!track?.notes.length) continue;
      parts.push({
        track,
        notes: track.notes.slice().sort((a, b) => a.beat - b.beat || a.midi - b.midi),
      });
    }

    if (parts.length === 1) {
      playPart(parts[0]!.notes, parts[0]!.track, performer, spec, board);
    } else if (parts.length > 1) {
      /**
       * Two lines, one player: **a hand each, lowest to the left**.
       *
       * The hand split is what makes this safe rather than merely plausible.
       * Each part is choreographed on its own effector, so the two never compete
       * for a limb — `Board.place` keeps its bookkeeping per effector and would
       * otherwise be handed a second part that rewinds the clock on a hand it
       * had already scheduled to the end of the number. Casting guarantees the
       * halves fit: see `oneHanded`, which is the test it uses to allow this at
       * all.
       *
       * Lowest to the left hand is not a convention, it is the only way round it
       * is played: the keyboard bass sits under the left hand and the tune under
       * the right, which is Manzarek's whole left arm and Emerson's. It also
       * decides the keyboards for free — the right hand is the one that goes up
       * to the tier, which is the same answer `pickBoard` gives for a split
       * voicing and for the same reason, since a left hand crossing up to a
       * second board is a circus trick.
       */
      parts.sort((a, b) => mean(a.notes.map((n) => n.midi)) - mean(b.notes.map((n) => n.midi)));
      const top = (performer.boards ?? 1) - 1;
      parts.forEach((part, i) => playPart(part.notes, part.track, performer, spec, board, {
        only: i === 0 ? 'left-hand' : 'right-hand',
        atBoard: Math.min(i, top),
      }));
      // …and the press that changes the sound between them, where the object
      // has something to press. Only a synthesiser is ever merged today — see
      // `mergeStations`, which takes no other archetype — so this guard is
      // stating the rule rather than catching a live case, and it is the same
      // rule `operatePart` is held to below.
      if (hasAPanel(spec)) patchPart(parts, performer, board);
    }
  }

  /**
   * …and then whatever machines this player is minding, in the gaps.
   *
   * **After the part, deliberately.** Playing wins: the gestures above are
   * already on the schedule, so `canReach` refuses any panel move that would
   * need a hand which is busy, and operating fills the room that is left. That
   * is the right precedence and it is also what a player does — you play your
   * line and you reach over when you can.
   *
   * **And only where the object has a panel to reach for**, which is the whole
   * of `hasAPanel` and is the second half of the fix `cast.ts` carries. Casting
   * will not choose a tender who cannot work one, but it will still stand a
   * rhythm box beside *somebody* on a stage where nobody can — see `anybody`
   * there, and see §8.1: percussion arriving from an empty stage is the worse
   * failure, so the box is placed and its `tendedBy` says whose corner of the
   * boards it is in rather than who is seen starting it. This is the line that
   * keeps that from turning back into a gesture. Writing one anyway is what
   * produced 51 panel touches on nine archetypes that never claimed a panel,
   * and the ones on a carried instrument resolved to nothing at all.
   */
  if (machines.length && hasAPanel(spec)) operatePart(song, machines, board);

  // Sorted by beat, as `PerformerPart` promises. `Array.prototype.sort` is
  // stable, so gestures placed together in one motion keep the order they were
  // emitted in and the output is byte-identical run to run.
  return board.gestures.sort((a, b) => a.beat - b.beat);
}

/**
 * Whether a hand of this player's may be sent to a control surface at all.
 *
 * The choreographer's half of `ArchetypeSpec.points`: that list is what a model
 * of the archetype must resolve, so it is also the only list this file may draw
 * from. Everywhere else that is automatic — a `drum` point is emitted by
 * `drumPart` and only a kit is choreographed through it — and the panel is the
 * one gesture in the file that is written for a *reason outside the part*, so
 * it is the one that could arrive on a player whose instrument has nothing to
 * answer with. It did: `operatePart` and `patchPart` between them put `control`
 * points on clarinets, trombones, guitars, violins and a singer.
 *
 * Asked of the spec rather than by naming `synth`, so the day an electric piano
 * or an organ model grows a `control` branch and its spec says so, both callers
 * below start working without being edited.
 */
function hasAPanel(spec: ArchetypeSpec): boolean {
  return spec.points.includes('control');
}

/**
 * How much room a hand on the panel needs either side of the touch, in beats.
 *
 * Generous rather than tight. These gestures are placed into whatever gaps a
 * part leaves, and a hand that leaves the keys for a knob and is back a
 * sixteenth later has not visibly done anything — the point of the gesture is
 * that somebody can *see* the machine being worked.
 */
const PANEL_PREP = 0.75;
const PANEL_RELEASE = 0.75;

/**
 * Whether this limb is clear to spend `PANEL_PREP`…`PANEL_RELEASE` on a panel.
 *
 * **Not `board.canReach`, and answering the wrong one of these two questions
 * cost three quarters of the machine gestures once already.** `canReach`
 * compares a candidate beat with that limb's most recent placement, which is
 * exactly right while a part is being written forwards — and every caller here
 * runs *after* the whole part is on the schedule, so the most recent placement
 * is the last note of the number and every candidate beat looks like the past.
 * It could only ever have placed a gesture after the final note.
 *
 * So the window is checked against the gestures themselves: a limb is busy from
 * `beat - prep` to `beat + release`, and a panel touch needs its own such
 * window clear of all of them.
 */
function panelFree(board: Board, hand: Hand, beat: number): boolean {
  return !board.gestures.some((g) => (
    g.effector === hand
    && beat + PANEL_RELEASE > g.beat - g.prep
    && beat - PANEL_PREP < g.beat + g.release
  ));
}

/**
 * The one hand that could be on the panel at `beat`, left by preference.
 *
 * A right hand is where the tune usually is on a keyboard, so the left is the
 * one more often idle at a section boundary. `undefined` where both are busy.
 */
function freeHand(board: Board, beat: number): Hand | undefined {
  if (panelFree(board, 'left-hand', beat)) return 'left-hand';
  if (panelFree(board, 'right-hand', beat)) return 'right-hand';
  return undefined;
}

/** A hand on a panel: the player's own where `machine` is absent. */
function panelTouch(board: Board, hand: Hand, beat: number, at: number, machine?: number): void {
  board.place({
    effector: hand,
    beat,
    kind: 'press',
    travel: 0.5,
    force: 0.45,
    sustainBeats: 0.5,
    targets: [{ kind: 'control', at, ...(machine === undefined ? {} : { machine }) }],
  });
}

/**
 * One keyboard, two lines, two sounds — so somebody changes it.
 *
 * `mergeStations` folds a thin line into a player who is already standing at a
 * keyboard, and on a polysynth (`maxBoards: 1`) both lines come out of the one
 * instrument. Two different patches out of one synthesiser with nobody touching
 * it is the same silent-cause problem `operatePart` exists to answer, one
 * object closer in: the sound changes and the stage offers no reason.
 *
 * **Only where the lines take turns.** Two parts sounding at once on one
 * keyboard is a split — the bass under the left hand and the lead under the
 * right, one patch keyed across the boards — and a player does not reach for
 * anything to do it. What earns a press is a line that stops and a different
 * one that starts, which is exactly the shape of a thin part: a colour that
 * arrives for a section and leaves again.
 *
 * The press goes in the gap *before* the incoming line, walking back half a
 * beat at a time and then in whole ones until a hand is free, for the reason a
 * start switch does: you change the sound before you play it, not while it is
 * coming out. Four beats is as far back as it looks — beyond that the reach has
 * stopped belonging to the line it is for, and the sound would sit changed and
 * unused for a bar.
 */
function patchPart(
  parts: { track: Track; notes: NoteEvent[] }[], performer: Performer, board: Board,
): void {
  // A second board carries the second sound on its own; nothing to press.
  if ((performer.boards ?? 1) > 1) return;
  if (new Set(parts.map((p) => p.track.instrument)).size < 2) return;

  const spans = parts.map((p) => p.notes.map((n) => [n.beat, n.beat + n.duration] as const));
  for (let i = 0; i < spans.length; i++) {
    for (let j = i + 1; j < spans.length; j++) {
      const together = spans[i]!.some(([a, b]) => spans[j]!.some(
        ([c, d]) => a < d - 1e-6 && b > c + 1e-6,
      ));
      if (together) return;
    }
  }

  const timeline = parts
    .flatMap((part, owner) => part.notes.map((n) => ({ beat: n.beat, owner })))
    .sort((a, b) => a.beat - b.beat);

  let changes = 0;
  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i]!.owner === timeline[i - 1]!.owner) continue;
    const into = timeline[i]!.beat;
    for (const step of [-0.5, -1, -1.5, -2, -3, -4]) {
      const beat = quantise(into + step);
      if (beat < 0) break;
      const hand = freeHand(board, beat);
      if (!hand) continue;
      // Along the panel rather than at one spot: two sounds are two presets,
      // and a player reaching for the same button twice has selected one thing.
      panelTouch(board, hand, beat, 0.16 + 0.6 * ((changes % 3) / 2));
      break;
    }
    changes++;
  }
}

/**
 * Working a machine that is playing itself.
 *
 * The rule from `docs/backline-plan.md` §8.1, made concrete: a self-playing part
 * must have a **visible cause**. Without one the music starts by itself and the
 * whole proposition of this project — that you can watch it being made — is
 * quietly given away, one sequencer at a time.
 *
 * Four gestures, and not one of them invents anything about the music.
 *
 * **Somebody starts it.** A hand goes to the panel on the beat the machine's
 * figure first sounds. That beat is not chosen, it is read off the part, so the
 * cause lands exactly on the effect.
 *
 * **Somebody keeps working it.** `NoteEvent.brightness` is a real, generated,
 * section-long filter sweep, and until now nothing on the stage was causing it.
 * A hand on the panel where that ramp turns is an honest cause for an audible
 * change — the sound genuinely opens while the hand is on the knob, because the
 * generator already decided it would.
 *
 * **Somebody changes it at the seams.** A drum machine has no brightness on its
 * events at all, so the clause above never fires for one and the player touched
 * the box exactly once in four minutes — which is a start switch, not somebody
 * working a machine. A section boundary is a real event in the IR and it is
 * precisely what the front row of a rhythm box is *for*: those are named
 * patterns, and you change them when the song does. So every section the
 * machine plays into gets a hand on the row.
 *
 * **Somebody switches it off.** After the last event it goes quiet, and a box
 * that stops on its own is the same silent-cause problem the other way round.
 *
 * The `where` a hand goes is 0..1 across the panel. On a filter move it tracks
 * the brightness itself, so the knob the player reaches for moves with the sound
 * rather than being a fixed spot they keep prodding; on a pattern change it
 * walks along the row of buttons, because those are different buttons.
 */
function operatePart(song: Song, machines: StageMachine[], board: Board): void {
  machines.forEach((machine, index) => {
    const notes = machine.layer
      ? song.tracks.find((t) => t.layer === machine.layer)?.notes ?? []
      : song.drums.events.map((e) => ({ beat: e.beat, brightness: undefined }));
    if (!notes.length) return;

    /** Every moment the machine's sound is asked to change, plus its start. */
    const moments: { beat: number; at: number; start?: boolean }[] = [];
    /**
     * The ends of the part, as a min and a max rather than as the ends of the
     * array.
     *
     * `playPart` sorts a track's notes before it walks them, which says plainly
     * that the IR does not promise an order. Reading `notes[0]` for the start
     * was getting away with it; a stop read off the last element would land in
     * the middle of the number the first time a generator emitted a layer out of
     * order, and would look like a player switching the drums off early.
     */
    let lo = Infinity;
    let hi = 0;
    for (const n of notes) {
      if (n.beat < lo) lo = n.beat;
      if (n.beat > hi) hi = n.beat;
    }
    const first = quantise(lo);
    const lastBeat = quantise(hi);
    /**
     * The start lands on the slot at or *before* the machine's first note.
     *
     * `quantise` rounds to the nearest slot and so can round forward: a counter
     * entering at 165.44 gives a first note of 165.5 and a start gesture on top
     * of it, which is a player pressing the button a sixteenth after the box has
     * already spoken. Cause has to precede effect even by a hair, and this is the
     * one gesture in the file where that is true — every other one accompanies a
     * sound rather than causing it, which is why `quantise` is right for them.
     */
    moments.push({ beat: quantiseDown(lo), at: 0.12, start: true });

    /**
     * How far the filter moves across this part, and therefore what counts as
     * a move.
     *
     * A fixed threshold was wrong and measurably so: a sequenced bass line's
     * brightness spans at most 0.06 over a whole number, so anything absolute
     * either never fires or fires on noise. What matters is not how far the
     * sweep goes in the abstract but whether *this* part audibly changes, so
     * the bar is a third of the range the track actually has — and a part whose
     * filter barely moves at all gets no hand on it, correctly, because there
     * is nothing to cause.
     */
    const brights = (notes as { brightness?: number }[])
      .map((n) => n.brightness).filter((b): b is number => b !== undefined);
    const span = brights.length ? Math.max(...brights) - Math.min(...brights) : 0;
    const step = span / 3;

    if (span > 0.02) {
      let last: number | undefined;
      for (const n of notes as { beat: number; brightness?: number }[]) {
        const bright = n.brightness;
        if (bright === undefined) continue;
        // Only where it actually turns. A ramp sampled per note would put a
        // hand on the knob every sixteenth, which is a fidget, not a gesture.
        if (last === undefined || Math.abs(bright - last) >= step) {
          const beat = quantise(n.beat);
          if (beat > first) moments.push({ beat, at: 0.10 + 0.55 * (1 - bright) });
          last = bright;
        }
      }
    }

    /**
     * A pattern change where the song changes, walking along the row.
     *
     * The row of buttons on the front of one of these machines is a row of
     * *named rhythms* on a preset box and a row of steps on a programmed one,
     * and both are things a player reaches for when the arrangement turns. This
     * is the gesture that keeps a drum machine's tender doing something: with
     * no brightness on a drum event the sweep above never fires, so before this
     * the whole of "somebody is working that box" was one press at bar one.
     *
     * Only the seams the machine actually plays across — a boundary before it
     * starts or after it stops is a hand on a box that is not running.
     */
    const bar = song.meta.beatsPerBar;
    song.sections.forEach((section, i) => {
      if (i === 0) return;
      const beat = quantise(section.startBar * bar);
      if (beat <= first || beat >= lastBeat) return;
      // Along the row rather than at one spot: consecutive changes are
      // different buttons, which is what changing the pattern looks like.
      moments.push({ beat, at: 0.18 + 0.62 * ((i % 4) / 3) });
    });

    /**
     * And somebody switches it off.
     *
     * Half a beat after the last thing it plays, which is a hand arriving as
     * the sound stops rather than cutting it short. The panel goes dark a bar
     * later — see `createMachineRunner` — so the gesture and the lamps agree
     * about which way round cause and effect go at this end too.
     */
    if (lastBeat > first) moments.push({ beat: quantise(lastBeat + 0.5), at: 0.12 });

    /** How many of this machine's moments actually got a hand. */
    let touches = 0;

    for (const moment of moments) {
      /**
       * A start may happen *early*, and that is not a concession — it is what
       * pressing start is.
       *
       * The first attempt placed it exactly on the beat the figure comes in,
       * and lost three quarters of them: a machine's part very often begins on
       * the same downbeat as the player's own, and a hand cannot be in two
       * places. But nobody starts a sequencer on the beat they want to hear it;
       * they start it in the bar before and it comes round. So a start walks
       * backwards half a bar at a time looking for a hand that is free, and
       * only a start does — a filter move has to land where the sound moves.
       */
      /**
       * Where a start may go, and it is a search rather than a beat.
       *
       * Walking back in ever coarser steps: a hand that can start the thing
       * exactly on the downbeat should, and one that cannot should still start
       * it, a bar or two earlier, which is what a player does anyway — you set
       * the sequencer running and it comes round. Coarse to eight beats because
       * beyond that the gesture has stopped belonging to the entrance.
       */
      const tries = moment.start
        ? [0, -0.25, -0.5, -0.75, -1, -1.5, -2, -3, -4, -6, -8]
          .map((d) => moment.beat + d).filter((b) => b >= 0)
        : [moment.beat];
      /**
       * A hand that is free *then*, rather than free since it last moved. See
       * `panelFree` — this runs after the whole part is on the schedule, so the
       * question `board.canReach` answers is the wrong one here.
       *
       * What is lost even so, measured across twenty machine numbers: two, and
       * both are the same case. Their figure begins on beat 0, so the walk
       * backwards has nowhere to walk to — every candidate is filtered off the
       * front of the number — and the player's own part begins on that downbeat
       * with both hands. The settling touch below is what catches those.
       */
      for (const beat of tries) {
        const hand = freeHand(board, beat);
        if (!hand) continue;
        panelTouch(board, hand, beat, moment.at, index);
        touches++;
        break;
      }
    }

    /**
     * …and a box nobody ever touched gets one touch, wherever there is room.
     *
     * Every gesture above is tied to a moment in the music — the entry, a turn
     * in the filter, a seam, the stop — which is what makes them honest, and
     * also what lets a machine end up with none of them: a figure that starts on
     * beat 0 has no earlier beat to be started from, a drum pattern has no
     * brightness to turn, and a player whose own part covers the seams has no
     * hand to spare at any of them. Measured before this: 29 of 317 staged
     * machines were never touched at all, and 11 of those stood on a stage with
     * another box beside them that *was* worked — two identical shoeboxes, one
     * of them plainly somebody's and the other plainly furniture.
     *
     * So: anywhere this machine is running, any hand that is free, one press.
     * It invents nothing about the music — the level and the tone of a running
     * box are a player's to settle at any point — and it is the difference
     * between a machine that belongs to somebody and a machine that is scenery.
     * Walking forwards from the first thing it plays, because the sooner the
     * audience sees whose it is the less of the number it has spent unexplained.
     *
     * Half a bar at a time rather than a bar: the four boxes a whole-bar walk
     * still missed were all minded by pad players, whose chords are struck on
     * the downbeats and held, so the free room in their hands is the second half
     * of the bar and a search that only ever asked about the first found none of
     * it. At half a bar every machine measured — 317 of them — is worked.
     */
    if (!touches) {
      const step = song.meta.beatsPerBar / 2;
      for (let beat = quantise(first + step); beat < lastBeat; beat = quantise(beat + step)) {
        const hand = freeHand(board, beat);
        if (!hand) continue;
        panelTouch(board, hand, beat, 0.3, index);
        break;
      }
    }
  });
}

/**
 * Which track a part reference names.
 *
 * By layer, which is what `Performer.layer` means, and by instrument name where
 * a layer somehow carries more than one track — the Song IR does not forbid it
 * and a silent performer would be a worse failure than a guess.
 *
 * A `PartRef` rather than a `Performer` because a player may be carrying more
 * than one line — see `Performer.doubles` — and the second one has to be looked
 * up the same way the first is. A `Performer` *is* a `PartRef` structurally, so
 * the primary part still resolves through this one function and there is no
 * second description of "which track is this person playing" to disagree with
 * it. `cast.ts` and `concert-check.ts` both need it too.
 */
export function trackForPart(song: Song, ref: PartRef): Track | undefined {
  const candidates = song.tracks.filter((t) => t.layer === ref.layer);
  if (candidates.length <= 1) return candidates[0];
  return candidates.find((t) => t.instrument === ref.instrument) ?? candidates[0];
}

/**
 * One of a player's parts, where they are carrying more than one.
 *
 * Only keyboards ever see this — `mergeStations` merges nothing else, because a
 * second line on a trumpet is not a thing a person has — so the branches below
 * that ignore it are correct rather than unfinished. If it ever arrives on an
 * archetype that cannot honour it, that archetype's part is played the way it
 * always was and the collision would show up in the checks rather than on the
 * stage.
 */
interface PartShare {
  /** The one hand this part gets. The other is on the player's other line. */
  only: Hand;
  /** The keyboard it lives on, already clamped to what this player stands at. */
  atBoard: number;
}

function playPart(
  notes: NoteEvent[], track: Track, performer: Performer, spec: ArchetypeSpec, board: Board,
  share?: PartShare,
): void {
  const groups = groupByBeat(notes);
  const reach = reachFor(spec, track);
  switch (performer.archetype) {
    case 'accordion':
      // The bellows are planned first because the keys have to carry the plan:
      // the left hand is on a box that moves, and a note has to say where the
      // box was when it sounded. See `bellowsPart`.
      keyboardPart(groups, spec, reach, board, {
        kind: 'press', split: ACCORDION_BUTTON_TOP, bellows: bellowsPart(groups, board),
      });
      return;
    case 'mallets':
      // Not a keyboard. See `malletPart` — two sticks is a different problem
      // from ten fingers, and running it through `keyboardPart` left one arm
      // hanging over the middle of the instrument for whole numbers at a time.
      malletPart(groups, reach, board);
      return;
    case 'organ':
      keyboardPart(groups, spec, reach, board, { kind: 'press', pedalboardTop: ORGAN_MANUAL_BOTTOM });
      return;
    case 'grand-piano':
    case 'electric-piano':
      keyboardPart(groups, spec, reach, board, { kind: 'press' });
      return;
    case 'synth':
      keyboardPart(groups, spec, reach, board, {
        kind: 'press',
        // A station with one board behaves exactly as it did; see `boardsFor`.
        ...(performer.boards && performer.boards > 1
          ? { boards: boardsFor(performer.boards) }
          : {}),
        // One line of two: this hand, that keyboard, and no crossing.
        ...(share ?? {}),
      });
      return;
    case 'harp':
      // A harp has a string per note and no fretting hand, so it is a keyboard
      // that happens to emit string points: both hands pluck, split by register.
      keyboardPart(groups, spec, reach, board, { kind: 'pluck', asString: true });
      return;
    case 'violin':
    case 'cello':
      // A pizzicato string part is staged on a violin but is not bowed. The
      // catalogue already knows — `pizzStrings` carries the `plucked` idiom —
      // and putting a bow on it would be visibly wrong for a whole section.
      stringPart(groups, spec, reach, board, idiomOf(track) !== 'plucked');
      return;
    case 'acoustic-guitar':
    case 'electric-guitar':
    case 'upright-bass':
    case 'electric-bass':
    case 'sitar':
      stringPart(groups, spec, reach, board, false);
      return;
    case 'singer':
      sungPart(groups, board);
      return;
    default:
      blownPart(groups, track, spec, reach, board);
  }
}

/** The accordion's right-hand keyboard starts around F3; below that is buttons. */
const ACCORDION_BUTTON_TOP = 53;
/** An organ's manuals stop at C2. Below that the organist has feet. */
const ORGAN_MANUAL_BOTTOM = 36;

// ---------------------------------------------------------------------------
// Drums
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Sticking
// ---------------------------------------------------------------------------

/**
 * Which hand plays which stroke — the one decision on this kit an audience can
 * read at fifteen metres, and the one greedy proximity gets wrong.
 *
 * Four facts about a pair of arms, none of which is a distance to the next drum:
 *
 *  1. **A hand cannot repeat as fast as two hands can alternate.** A stick
 *     bounces, so a single hand will hold down eighths all night, but sixteenths
 *     past about 115 bpm are two hands trading — and a moving figure runs out of
 *     hand far sooner than a stationary one, because the stick has to be carried
 *     as well as lifted. That is `REPEAT_SECONDS`, and it is the whole of "use
 *     both hands for fast stuff": nothing here counts notes or measures a tempo,
 *     it just becomes cheaper to alternate than to hurry one arm.
 *
 *  2. **Arms are in each other's way.** `tangle`, below.
 *
 *  3. **A right-handed drummer leads with the right.** The timekeeper is under
 *     the lead hand and the backbeat under the other, which is what makes the
 *     hats-over-snare cross the *normal* posture rather than an accident.
 *
 *  4. **Which hand starts a fill is decided by where the fill ends.** This is
 *     the one that cannot be greedy. Coming off a groove into `sd ht mt lt`, the
 *     first stroke is a coin toss on proximity alone — both sticks are a snare's
 *     width away — and the two choices differ only three strokes later, where
 *     one of them has the left hand out on the floor tom with the right stranded
 *     on the mid and the other does not. A per-stroke choice cannot see that, so
 *     the sticking for a whole part is solved as a path instead: every stroke is
 *     a state, every state is scored, and the cheapest way through the part wins.
 *     A drummer calls this working out the sticking, and does it in the bar's
 *     rest before the fill.
 */

/**
 * How long one hand needs between two strokes, in **seconds**:
 * `base + travel × reach`, the same shape as `PREP_SECONDS`.
 *
 * Two thresholds rather than one, because "can a hand do this" and "would a
 * drummer ask a hand to" are different questions and the space between them is
 * where the sticking is actually decided.
 *
 * `floor` is the physical limit: below it the stroke does not happen and the
 * planner will pay almost anything to avoid asking for it. It is not
 * `PREP_SECONDS.strike`, which is a *windup* — how long the stick has been on
 * its way — and fifty milliseconds looks impossibly short next to it until you
 * remember what the stationary case is: the second half of a double is the
 * stick's own rebound, and a rebound comes back in about that.
 *
 * `ease` is what one hand does without being asked twice. Its base is small on
 * purpose and is stretched by `BURST_FADE` below; nearly all of the standing
 * cost is in the travel term, and that is the point. A stick that has to be
 * *carried* from the high tom to the mid tom has spent most of the gap
 * travelling before the stroke is started, which is why a fill runs out of one
 * hand at a tempo a hi-hat pattern is comfortable at.
 */
const REPEAT_SECONDS = {
  floor: [0.050, 0.22] as const,
  ease: [0.060, 0.28] as const,
};

/**
 * A hand can burst, and cannot sustain — which is the distinction a single
 * threshold cannot draw, and the one drumming is actually made of.
 *
 * A jazz ride at 150 bpm puts two strokes a tenth of a second apart and then
 * leaves the hand alone for three times that. Straight sixteenths at the same
 * tempo put every stroke a tenth of a second apart for thirty-two bars. The gaps
 * are identical and the answers are opposite: the first is one hand playing
 * spang-a-lang, which is the most recognisable figure in the idiom, and the
 * second is two hands trading, because nobody's right arm does that for a
 * chorus. Scored on the gap alone the planner has to get one of them wrong, and
 * it got the ride wrong — it broke the swing pattern across both hands, which is
 * a jazz drummer nobody would book.
 *
 * So a hand carries a `run`: how many strokes it has already made inside
 * `BURST_SECONDS` of each other. Every run resets the moment the hand gets a
 * breath. `ease` stretches by `BURST_FADE` for each stroke of it, so the first
 * fast repeat is free, the second is asked for, and the fourth is refused —
 * which is a stick's rebound running out, told in the order it runs out in.
 *
 * `BURST_SECONDS` is therefore the sustainable rate rather than a fast one:
 * eight strokes a second, which is sixteenths at 120 bpm or eighths at 240, and
 * a right hand really will hold either of those down for a whole number. Only
 * what is faster than a hand can *keep up* counts toward a run, which is why the
 * ordinary rock groove — eighths on the hats at any tempo this generator writes
 * — never reaches this machinery at all and stays where it belongs, in one hand,
 * crossed over a left hand on the snare.
 */
const BURST_SECONDS = 0.125;
const BURST_FADE = 1.10;
const RUN_CAP = 3;

/**
 * The same two numbers for the left foot, which is the other limb that can take
 * a closed hat — and a foot is not a hand. A heel-down pedal stroke lives around
 * five or six a second at the outside, where a hand bursts at twenty, so the
 * foot is offered the hats it can hold down rather than the ones it cannot.
 */
const FOOT_SECONDS = { floor: 0.115, ease: 0.200 };

/**
 * What each thing costs the planner, in units where 1 is a stick crossing the
 * whole kit. The ratios are the argument; the absolutes are not.
 *
 * **Travel is cheap on purpose.** It is the one term that would otherwise decide
 * everything, and in the wrong direction: an arm that never moves never pays,
 * so a planner that weighted travel heavily would keep one hand parked and play
 * the whole fill with the other. Travel here is a preference for the nearer
 * stick between two that are both free, and nothing more — the *hard* cost of
 * moving a stick is time, and that is charged by `REPEAT_SECONDS` instead.
 *
 * `STUCK` is not infinite because a demand no sticking can meet must still
 * produce a sticking: thirty-second notes on one surface arrive occasionally and
 * the drummer plays them as best they can rather than throwing.
 */
const TRAVEL_COST = 0.35;
const CRAMPED_COST = 2.0;
const STUCK_COST = 12;
const LEAD_COST = 0.06;

/**
 * What it costs to take a stroke with the hand that took the one before it,
 * **when the stroke is somewhere else on the kit** — and this is the term that
 * makes a fill look like drumming.
 *
 * Everything above it is about what a hand *can* do, and by that measure a
 * three-stroke tom fill at 160 bpm is comfortably one-handed: half a second to
 * cross two drums, both sticks free, and the nearest one is the one that just
 * played. So that is what came out — the left hand walking `ht mt lt` on its own
 * while the right arm hung there — and it is wrong for a reason no feasibility
 * test can state. Drummers alternate. It is the first thing anybody is taught,
 * it is why the rudiments are named after it, and a fill played with one arm
 * reads as a man tapping rather than a man playing.
 *
 * The condition is what keeps it honest: **only when the surface changes.** A
 * hand repeating on one surface is not a failure to alternate, it is the
 * timekeeping hand doing its job, and charging it here would break the one thing
 * on this kit that must not break — the right hand riding the hats for a whole
 * number while the left answers on the snare.
 */
const DOUBLE_COST = 0.35;

/**
 * A cymbal that is not the timekeeper belongs to the lead hand, and this is a
 * much larger claim than `LEAD_COST` because it is a much stronger convention.
 *
 * A crash on the downbeat is the right arm coming up over the hats. It is the
 * one gesture an audience reads from the back of a hall and there is no
 * right-handed kit on which the left hand takes it — the left hand is down on
 * the snare, a foot lower and half a metre back, and reaching it across and up
 * to a crash is a movement nobody makes when the other stick is free.
 *
 * Being *above* `DOUBLE_COST` is the whole point of the number: without it the
 * alternation rule sends the crash to the left hand purely because the right one
 * played the last hat, which is the correct instinct applied to the one stroke
 * it does not apply to.
 */
const CYMBAL_LEAD_COST = 0.45;

/**
 * What it costs to give a closed hat to the left foot rather than to a stick.
 *
 * The foot is not free and must not be cheap: a chick and a stick on a shut
 * hi-hat are different sounds, and a planner that could reach for the pedal
 * whenever it was convenient would quietly take the drummer's right arm out of
 * the groove — the arm being the thing an audience is watching. So this is
 * priced above a comfortable stick stroke and below an awkward one, which makes
 * the foot exactly what a drummer uses it for: the hat that keeps ticking while
 * both hands are busy elsewhere.
 *
 * It is what puts a jazz drummer back together. A ride pattern with the hats on
 * two and four and the snare comping between them is three voices for two
 * sticks, over and over, and the sticks-only answer is the right hand hopping
 * off the ride onto the snare and the left hand tapping the hats — a drummer
 * playing their own kit backwards. The hats on two and four are a *foot*, and
 * this is the number that says so without anything having to know it is jazz.
 */
const CHICK_COST = 0.25;

/**
 * The cost of the two arms being crossed, per unit of overlap — and the reason
 * there are two numbers rather than a prohibition.
 *
 * A drummer's hands are crossed most of the time and it is not a bug. The right
 * hand keeps time on the hi-hat, which is out at the *left* of a right-handed
 * kit, while the left hand plays a snare that is further right than the hats
 * are: crossed, by any definition, and the single most recognisable thing a
 * drummer's arms do. What makes it work is that the crossing hand is on a cymbal
 * *above* the hand it crosses — the right forearm passes over the left, they
 * never meet, and the reach costs almost nothing.
 *
 * So the tier difference is the whole distinction. Right hand higher: an arm
 * passing over an arm, which is `OVER` and nearly free. Level or lower: two
 * forearms competing for the same air, which is `THROUGH` and expensive enough
 * that the planner will re-stick a whole fill to avoid it. A left hand out on
 * the floor tom with the right hand back on the high tom is the case this
 * number exists to delete, and it is what greedy proximity produced.
 */
const OVER_COST = 0.25;
const THROUGH_COST = 1.6;

/**
 * How far the hands may cross before it counts as crossing at all.
 *
 * Two sticks on neighbouring toms are about a hand's width apart whichever way
 * round they are, and calling that a tangle is what stopped fills alternating:
 * every descending fill crosses the hands *somewhere*, because the toms run
 * left to right and two hands taking turns have to trade places to follow them.
 * Charged from zero, the planner's answer was to keep one arm still, which is
 * the one thing worse than a momentary cross.
 *
 * A fifth of the kit is roughly the width of a tom, and it is the width at which
 * two forearms stop being near each other and start being in each other's way.
 */
const CROSS_SLACK = 0.18;

/** How many partial stickings survive each stroke. See `planSticking`. */
const STICKING_WIDTH = 24;

/**
 * How badly these two hands are in each other's way, given where each of them
 * last struck.
 *
 * Positive depth is the left hand standing to the right of the right hand,
 * measured along the kit's own sweep — the only axis this file has, and enough,
 * because crossing is a fact about the left-to-right order of two arms.
 *
 * A crossing is charged for as long as it stands, and **not** faded by how long
 * ago either arm last moved — which is what it used to do, and the fade was the
 * single worst bug in this planner.
 *
 * The reasoning behind the fade was that an arm which struck half a second ago
 * has come back to a hover and is not in anybody's way. It is even true. What it
 * misses is that a *station* is not a position: an arm that keeps returning to
 * the same wrong place is stationed there, and the tell is that the fade could
 * only ever be escaped by playing *slowly*. So a jazz drummer alternating the
 * ride and the hats a beat apart got the crossing for nothing, and settled into
 * the left hand out on the ride with the right hand over on the hi-hats — arms
 * fully swapped, held for a whole number, at zero cost. It was 0.8% of every
 * posture in the corpus and every one of them was this.
 *
 * `CROSS_SLACK` is what makes the un-faded reading safe: it is transient
 * crossings the fade was really trying to forgive, and a tom's width of slack
 * forgives them without pretending an arm has gone home. It is also the reading
 * the renderer agrees with — a drummer's idle hands hover over the mean of what
 * that hand has been playing, so a hand that keeps playing the ride *is* over
 * the ride between strokes.
 */
function tangle(left: DrumVoice, right: DrumVoice): number {
  const { depth, over } = crossing(left, right);
  return depth <= 0 ? 0 : depth * (over ? OVER_COST : THROUGH_COST);
}

/**
 * How far past each other the two sticks are, and whether the right forearm has
 * the height to pass over the left.
 */
function crossing(left: DrumVoice, right: DrumVoice): { depth: number; over: boolean } {
  return {
    depth: KIT[left].sweep - KIT[right].sweep - CROSS_SLACK,
    over: KIT[right].tier > KIT[left].tier,
  };
}

/**
 * Whether a pair of arms in these two places is knotted: crossed by more than
 * they can be waved off as, with neither forearm clear of the other.
 *
 * **Exported for `concert-check.ts`**, which asserts that a drummer is almost
 * never in one — the same reason `oneHanded` is exported, and the same rule
 * about which direction the import runs. What the arms can do is a fact this
 * file owns; the check is entitled to ask, and not to re-derive.
 *
 * The hats-over-snare cross that a drummer holds all night is deliberately *not*
 * one of these, and that is the whole distinction: the right hand is up on a
 * cymbal and the left is down on a head, so the arms never meet. See `tangle`.
 */
export function armsKnotted(left: DrumVoice, right: DrumVoice): boolean {
  const { depth, over } = crossing(left, right);
  return depth > 0 && !over;
}

/**
 * The lead hand's claim on a surface, in three strengths.
 *
 * The **timekeeper and the backbeat** are the two anchors a groove is built out
 * of, and their claim is deliberately tiny — a twentieth of a kit-crossing —
 * because it is a convention rather than a constraint. It decides nothing except
 * the cases where everything else is level, and those are exactly the cases
 * where a drummer falls back on habit: the timekeeper under the right hand and
 * the backbeat under the left, on every right-handed kit ever set up.
 *
 * Without even that much, a fast hi-hat pattern comes out *open-handed* — the
 * two sticks alternate on the hats, so at the backbeat the cheapest thing is for
 * the right hand to take the snare and the left to stay on the hats, which is
 * uncrossed, physically sound, and not what anybody does.
 *
 * Being tiny is also what lets the fast pattern alternate in the first place,
 * and it is why the timekeeper is tested *before* `CYMBAL_LEAD_COST` rather than
 * falling into it. A hi-hat is a cymbal; the hi-hat a drummer is keeping time on
 * is not an accent, and pricing the left hand off it at accent rates would buy
 * back the very thing the whole `run` machinery exists to produce.
 */
function anchorCost(hand: Hand, voice: DrumVoice, timekeeper: DrumVoice): number {
  const lead = hand === 'right-hand';
  if (voice === timekeeper) return lead ? 0 : LEAD_COST;
  if (voice === 'sd' || voice === 'rim') return lead ? LEAD_COST : 0;
  return KIT[voice].tier === 1 && !lead ? CYMBAL_LEAD_COST : 0;
}

/** One beat's worth of work for the sticks, after the kick has taken its own. */
interface StickSlot {
  beat: number;
  /** The one or two strokes that need a stick of their own, loudest first. */
  primary: DrumEvent[];
  /** A third surface on a two-stick kit — see the end of `drumPart`. */
  extra: DrumEvent[];
  /**
   * When the left foot last had the hat pedal for a chick this beat or before,
   * counting only the ones already decided — see the overflow rule in
   * `drumPart`. The planner's own chicks are in its state; these are not, so
   * they are carried alongside as a floor under it.
   */
  footFrom: number;
}

/** Which limb takes which stroke, for one slot. */
interface Deal {
  strokes: ReadonlyArray<readonly [Hand, DrumEvent]>;
  /** A closed hat handed to the left foot instead of to a stick. */
  chick?: DrumEvent;
}

/** Where a stick is, when it got there, and how long it has been hurrying. */
interface Where {
  voice: DrumVoice;
  beat: number;
  run: number;
}

interface Sticking {
  cost: number;
  left: Where;
  right: Where;
  /** When the left foot last chicked. */
  foot: number;
  /** Index into the previous slot's surviving stickings. */
  from: number;
  deal: Deal;
}

/**
 * Every way this slot's strokes could be shared out.
 *
 * Two ways to deal a slot between two sticks, and two more for each of them if
 * one of the strokes is a closed hat, because a closed hat has a third limb that
 * can make it. An open hat has not: the pedal being down is what closes a
 * hi-hat, so `oh` is always somebody's stick.
 *
 * The conventional deal is listed first so that a tie breaks toward habit rather
 * than toward whatever the sort happens to do.
 */
function dealsFor(primary: readonly DrumEvent[], footBusy: boolean): Deal[] {
  const [a, b] = primary;
  const out: Deal[] = [];
  if (a && b) {
    out.push({ strokes: [['left-hand', a], ['right-hand', b]] });
    out.push({ strokes: [['right-hand', a], ['left-hand', b]] });
  } else if (a) {
    out.push({ strokes: [['right-hand', a]] });
    out.push({ strokes: [['left-hand', a]] });
  } else {
    return [{ strokes: [] }];
  }
  if (footBusy) return out;
  // The hat, on the foot, and whatever is left over on whichever stick suits.
  const hat = a?.voice === 'hh' ? a : b?.voice === 'hh' ? b : undefined;
  if (hat) {
    const rest = hat === a ? b : a;
    if (rest) {
      out.push({ strokes: [['left-hand', rest]], chick: hat });
      out.push({ strokes: [['right-hand', rest]], chick: hat });
    } else {
      out.push({ strokes: [], chick: hat });
    }
  }
  return out;
}

/**
 * Solve the sticking for a whole drum part.
 *
 * A Viterbi pass, and the state is small enough to say out loud: where each
 * stick is and when it last struck. Every slot offers two ways to share its
 * strokes out, each is scored against the state it would leave behind, and
 * states that come out identical keep only their cheapest history — which is
 * what stops two choices per slot from becoming two to the power of the song.
 *
 * "Identical" needs the ages rather than the beats, and needs them capped: a
 * hand that struck a second ago and a hand that struck a minute ago are the same
 * hand as far as anything here can tell, so `horizon` folds the whole of the
 * past into one state and the live set stays at a handful. `STICKING_WIDTH` is a
 * backstop for the pathological part rather than a working limit.
 */
function planSticking(
  slots: readonly StickSlot[], board: Board, timekeeper: DrumVoice,
): Deal[] {
  /** Past this, nothing in the scoring can tell one gap from another. */
  const horizon = board.toBeats(Math.max(
    BURST_SECONDS, FOOT_SECONDS.ease,
    REPEAT_SECONDS.ease[0] * (1 + BURST_FADE * RUN_CAP) + REPEAT_SECONDS.ease[1],
  ));

  const burst = board.toBeats(BURST_SECONDS);

  const score = (
    from: Sticking, deal: Deal, slot: StickSlot,
  ): { cost: number; left: Where; right: Where; foot: number } => {
    const beat = slot.beat;
    let cost = 0;
    let left = from.left;
    let right = from.right;
    let foot = Math.max(from.foot, slot.footFrom);
    /** Whose turn it would not be. `undefined` when both struck together. */
    const played = left.beat === right.beat ? undefined
      : left.beat > right.beat ? 'left-hand' : 'right-hand';

    for (const [hand, e] of deal.strokes) {
      const at = hand === 'left-hand' ? left : right;
      const travel = kitDistance(at.voice, e.voice);
      const gap = beat - at.beat;
      const floor = board.toBeats(REPEAT_SECONDS.floor[0] + REPEAT_SECONDS.floor[1] * travel);
      const ease = board.toBeats(
        REPEAT_SECONDS.ease[0] * (1 + BURST_FADE * at.run) + REPEAT_SECONDS.ease[1] * travel,
      );
      if (gap < floor) cost += STUCK_COST;
      else if (gap < ease) cost += CRAMPED_COST * (1 - gap / ease);
      cost += TRAVEL_COST * travel;
      cost += anchorCost(hand, e.voice, timekeeper);
      if (hand === played && travel > 0) cost += DOUBLE_COST;
      const now: Where = {
        voice: e.voice, beat, run: gap < burst ? Math.min(at.run + 1, RUN_CAP) : 0,
      };
      if (hand === 'left-hand') left = now; else right = now;
    }

    if (deal.chick) {
      cost += CHICK_COST;
      const gap = beat - foot;
      const ease = board.toBeats(FOOT_SECONDS.ease);
      if (gap < board.toBeats(FOOT_SECONDS.floor)) cost += STUCK_COST;
      else if (gap < ease) cost += CRAMPED_COST * (1 - gap / ease);
      foot = beat;
    }

    // And the arms, where this deal has left them. Nothing to say until both of
    // them have been somewhere: a hand that has not played yet is not crossed
    // with anything, it is by the player's side.
    const both = left.beat > -Infinity && right.beat > -Infinity;
    return {
      cost: cost + (both ? tangle(left.voice, right.voice) : 0), left, right, foot,
    };
  };

  /**
   * Where a drummer's hands start: the right on whatever this song keeps time
   * on, the left on the snare. Both `-Infinity` ago, so the first stroke of the
   * number is never charged for hurrying.
   */
  let live: Sticking[] = [{
    cost: 0,
    left: { voice: 'sd', beat: -Infinity, run: 0 },
    right: { voice: timekeeper, beat: -Infinity, run: 0 },
    foot: -Infinity,
    from: -1,
    deal: { strokes: [] },
  }];
  const steps: Sticking[][] = [];

  for (const slot of slots) {
    const merged = new Map<string, Sticking>();
    const age = (at: number): number =>
      Math.round(Math.min(slot.beat - at, horizon) * 1000);
    const deals = dealsFor(slot.primary, slot.footFrom === slot.beat);
    for (let i = 0; i < live.length; i++) {
      const at = live[i]!;
      for (const deal of deals) {
        const { cost, left, right, foot } = score(at, deal, slot);
        const total = at.cost + cost;
        const key = `${left.voice}:${age(left.beat)}:${left.run}`
          + `|${right.voice}:${age(right.beat)}:${right.run}|${age(foot)}`;
        const seen = merged.get(key);
        if (seen && seen.cost <= total) continue;
        merged.set(key, { cost: total, left, right, foot, from: i, deal });
      }
    }
    live = [...merged.values()].sort((a, b) => a.cost - b.cost).slice(0, STICKING_WIDTH);
    steps.push(live);
  }

  // Back down the cheapest path. The sort above leaves it first.
  const out: Deal[] = new Array(slots.length);
  let at = 0;
  for (let i = steps.length - 1; i >= 0; i--) {
    const node = steps[i]![at]!;
    out[i] = node.deal;
    at = node.from;
  }
  return out;
}

/**
 * Two sticks, two pedals, and a scheduling problem.
 *
 * The sticking is not chosen from a table, because the interesting case is
 * exactly the one a table cannot express: a drummer keeping time on the hat with
 * the right hand and the backbeat with the left has to give the hat up when the
 * right hand crosses to the toms for a fill, and take it back afterwards. So the
 * kick is settled first — it is the one limb whose job never moves — and
 * everything else goes to `planSticking`, which works out both sticks and the
 * hat foot together, for the whole part at once.
 *
 * Feet:
 *  - The kick is the right foot, always. `{kind: 'pedal', which: 'kick'}`.
 *  - The hi-hat pedal is the left foot, and it is the *overflow route* rather
 *    than the default. A closed hat is idiomatically a stick — the plan says so
 *    in the same breath as calling this a scheduling problem — but the hat keeps
 *    ticking through a tom fill, and the only limb left to tick it is the foot.
 *    Deriving that from the scheduler rather than from a rule is the difference
 *    between a drummer and a drum machine with arms.
 *
 *    Two routes on to that foot, and only the first of them is arithmetic. Three
 *    surfaces on a two-stick kit is a *count*, and the hat goes down here before
 *    anything is planned because no sticking can make three into two. The second
 *    is a judgement and belongs to the planner, which is what `CHICK_COST` is
 *    for: the hats on two and four under a jazz ride are two voices, not three,
 *    and the reason they are still a foot is that the alternative takes the
 *    right hand off the cymbal.
 *
 * Neither foot is ever given anything else, which is also what stops the groove
 * score from tapping a foot that is on a pedal.
 */
function drumPart(events: DrumEvent[], board: Board): void {
  const slots = new Map<number, DrumEvent[]>();
  for (const e of events) {
    const beat = quantise(e.beat);
    const at = slots.get(beat);
    if (at) at.push(e);
    else slots.set(beat, [e]);
  }
  const beats = [...slots.keys()].sort((a, b) => a - b);
  const timekeeper = timekeeperOf(events);

  /**
   * What each beat holds, worked out once and then choreographed twice.
   *
   * The pass has to be split, and the split is where the feature lives:
   * `planSticking` decides the first stroke of a fill by looking at the last one
   * of it, so it cannot be handed one beat at a time and cannot place anything
   * as it goes. So this loop only sorts the events into limbs it is certain
   * about, and everything a plan could change is put aside until there is one.
   */
  const here = new Map<number, DrumEvent[]>();
  /** Hats a count, rather than a plan, has already sent to the foot. */
  const chicks = new Map<number, DrumEvent[]>();
  /** Surfaces past the second, which ride along with a stick that is going anyway. */
  const extras = new Map<number, DrumEvent[]>();
  const work: StickSlot[] = [];
  let footFrom = -Infinity;

  for (const beat of beats) {
    // Loudest first: when two strokes compete for one stick, the accent should
    // get the hand that is already near it and the ghost note should be the one
    // that travels.
    const all = slots.get(beat)!.slice().sort((a, b) => b.velocity - a.velocity);
    here.set(beat, all);

    let stickable = all.filter((x) => x.voice !== 'bd');

    // More voices than sticks. A closed hat is the one that can be handed to a
    // foot without lying about the sound; an *open* hat cannot, because the
    // pedal being down is what makes a hat closed, so an open hat is always
    // somebody's stick.
    const forced: DrumEvent[] = [];
    while (stickable.length > 2 && stickable.some((x) => x.voice === 'hh')) {
      const i = stickable.map((x) => x.voice).lastIndexOf('hh');
      const [hat] = stickable.splice(i, 1);
      forced.push(hat!);
    }
    if (forced.length) footFrom = beat;

    if (forced.length) chicks.set(beat, forced);
    if (stickable.length) {
      work.push({ beat, footFrom, primary: stickable.slice(0, 2), extra: stickable.slice(2) });
      if (stickable.length > 2) extras.set(beat, stickable.slice(2));
    }
  }

  // Both sticks and the hat foot, for the whole part, solved together.
  const deals = planSticking(work, board, timekeeper);

  /**
   * Where the left foot has the hi-hat pedal — `undefined` until it has taken
   * up position.
   *
   * A hi-hat is shut because a foot is holding it shut and open because that
   * foot let go, so `hh` and `oh` are not two sounds, they are two *leg
   * positions*, and every crossing between them is a movement. Without this the
   * cymbals parted and closed over a leg that never moved all night, which is
   * the drum equivalent of a piano playing itself.
   *
   * Only the crossings, though. A drummer does not pump the pedal under a bar
   * of closed hats — the foot goes down on the first stroke of the number and
   * then stays wherever it was put until the music asks for the other state,
   * which is also why one gesture per change is enough to hold it there.
   */
  let hatShut: boolean | undefined;

  const hands: Record<Hand, DrumVoice> = {
    'left-hand': 'sd',
    'right-hand': timekeeper,
  };
  const planned = new Map(work.map((slot, i) => [slot.beat, deals[i]!]));

  for (const beat of beats) {
    const all = here.get(beat)!;

    for (const e of all.filter((x) => x.voice === 'bd')) {
      board.place({
        effector: 'right-foot', beat, kind: 'strike', travel: 0,
        force: e.velocity, targets: [{ kind: 'pedal', which: 'kick' }],
      });
    }

    const deal = planned.get(beat);
    const onTheFoot = [...(chicks.get(beat) ?? [])];
    if (deal?.chick) onTheFoot.push(deal.chick);
    for (const hat of onTheFoot) {
      board.place({
        effector: 'left-foot', beat, kind: 'strike', travel: 0,
        force: hat.velocity, targets: [{ kind: 'pedal', which: 'hat', shut: true }],
      });
    }

    // The foot, when it is not making a sound with the pedal but is still the
    // reason there is one. A chick is already that press and does not want a
    // second gesture arguing with it for the limb on the same beat; anything
    // else that says something about the hats moves the leg iff the state it
    // asks for is not the state the leg is already holding.
    if (onTheFoot.length) hatShut = true;
    else {
      const asks = all.some((x) => x.voice === 'oh') ? false
        : all.some((x) => x.voice === 'hh') ? true
          : undefined;
      if (hatShut === undefined || (asks !== undefined && asks !== hatShut)) {
        const shut = asks ?? true;
        board.place({
          effector: 'left-foot', beat, kind: 'press', travel: 0,
          // Weight, not speed. A foot that slammed the pedal every time the
          // hats shut would be a drummer with one dynamic.
          force: shut ? 0.45 : 0.2,
          targets: [{ kind: 'pedal', which: 'hat', shut }],
        });
        hatShut = shut;
      }
    }

    if (!deal) continue;
    for (const [hand, e] of deal.strokes) {
      board.place({
        effector: hand, beat, kind: 'strike',
        travel: kitDistance(hands[hand], e.voice),
        force: e.velocity,
        targets: [{ kind: 'drum', voice: e.voice }],
      });
      hands[hand] = e.voice;
    }
    // Anything still left is a third surface on a two-stick kit, and it is
    // almost always a clap layered on the backbeat — which is one physical
    // event, not a third arm. It joins the nearest stick's stroke and inherits
    // its timing, so the limb is still in exactly one place.
    for (const e of extras.get(beat) ?? []) {
      const hand: Hand
        = kitDistance(hands['left-hand'], e.voice) <= kitDistance(hands['right-hand'], e.voice)
          ? 'left-hand' : 'right-hand';
      board.place({
        effector: hand, beat, kind: 'strike',
        travel: kitDistance(hands[hand], e.voice),
        force: e.velocity,
        targets: [{ kind: 'drum', voice: e.voice }],
      });
    }
  }
}

/**
 * Where each surface a percussionist owns sits along their own reach, 0..1.
 *
 * The hand drum's answer to `KIT`, and a far shorter table because a hand
 * drummer's world is one skin with a small table beside it. The three strokes
 * are clustered on purpose: they are three places on one head, four
 * centimetres apart, and the hands never leave it. Filing them any further
 * apart would charge a full windup for every *doum-tek* in the bar, which is
 * the mistake the note on `KIT`'s own `lp`/`mp`/`hp` entries warned about back
 * when this table did not exist and those three voices had nowhere else to go.
 *
 * The trap table is a genuine reach away, and that gap is the whole content of
 * this table: a *tek* costs almost nothing and picking up a riq costs a real
 * movement.
 */
const HAND_REACH: Partial<Record<DrumVoice, number>> = {
  mp: 0.30, lp: 0.34, hp: 0.38,
  cp: 0.55,
  cb: 0.80, tb: 0.86, sh: 0.92, perc: 0.96,
};

function handDistance(from: DrumVoice, to: DrumVoice): number {
  return Math.min(1, Math.abs((HAND_REACH[from] ?? 0.34) - (HAND_REACH[to] ?? 0.34)));
}

/**
 * `DrumEvent[] → two hands`, for the player with no sticks.
 *
 * Deliberately a tenth of `drumPart`. Almost everything that function does is
 * about the things a kit has and a hand drum has not: a kick pedal, a hi-hat
 * whose open and shut states are a *leg position*, a third surface that has to
 * ride along with a stick already going somewhere, and a sticking plan that
 * looks at the last stroke of a fill to choose the first. A darbuka has one
 * skin and two hands on it, and the honest version of that is short.
 *
 * What it does have is alternation, and that is what `idle` buys. Nearest-hand
 * alone would send every stroke to the same hand, because the three strike
 * points are within four centimetres of each other and the same hand is
 * therefore always the nearest one — a percussionist playing a whole number
 * with their left hand parked. The bonus is small enough that it never
 * overrides the reach to the trap table, which is half the arc away, and large
 * enough to break the tie between two places on one skin.
 */
function handPart(events: DrumEvent[], board: Board): void {
  const slots = new Map<number, DrumEvent[]>();
  for (const e of events) {
    const beat = quantise(e.beat);
    const at = slots.get(beat);
    if (at) at.push(e);
    else slots.set(beat, [e]);
  }

  const HANDS: Hand[] = ['left-hand', 'right-hand'];
  /** Where each hand last landed, and when. */
  const on: Record<Hand, DrumVoice> = { 'left-hand': 'mp', 'right-hand': 'hp' };
  const since: Record<Hand, number> = { 'left-hand': -1e9, 'right-hand': -1e9 };

  for (const beat of [...slots.keys()].sort((a, b) => a - b)) {
    // Loudest first, for the reason `drumPart` sorts the same way: when two
    // strokes compete for one hand, the accent should get the hand that is
    // already near it and the ghost note should be the one that travels.
    const all = slots.get(beat)!.slice().sort((a, b) => b.velocity - a.velocity);
    const taken = new Set<Hand>();

    for (const e of all) {
      const free = HANDS.filter((h) => !taken.has(h));
      /**
       * A third stroke on a two-handed instrument joins a hand that is already
       * moving, exactly as a clap does on the kit: one physical event, not a
       * third arm. It is rare here — a hand drum part with three simultaneous
       * voices is a hand drum part with a mistake in it — but the record has to
       * be total or a written note produces no gesture at all.
       */
      const pool = free.length ? free : HANDS;
      /**
       * Alternation, as *which hand went last* rather than as how long each
       * one has been still.
       *
       * This was `min(beat - since[h], 1) * 0.10`, and the cap is what broke
       * it. Past a single beat both hands are equally rested, so the term took
       * the same value on both sides of the comparison and cancelled exactly,
       * leaving bare proximity to decide. Proximity on this instrument never
       * changes its mind — the three strike points are four centimetres apart,
       * so whichever hand is nearest stays nearest for the rest of the number
       * — and the result was a percussionist playing an entire number with one
       * arm, which is the precise failure this bonus exists to prevent. It
       * worked only on parts whose strokes fall closer together than a beat,
       * and said nothing at all about the rest.
       *
       * Relative rather than absolute, so it cannot cancel: one hand is always
       * the more rested of the two, and exactly one bonus is ever paid. The
       * magnitude is unchanged and still claims what it claimed — 0.10 clears
       * every distance within the skin, which is 0.08 at its widest, and falls
       * well short of the reach out to the trap table, which is 0.17 at its
       * nearest. So alternation still breaks ties on the head and still never
       * argues with a real movement.
       */
      const rested: Hand
        = since['left-hand'] <= since['right-hand'] ? 'left-hand' : 'right-hand';
      const score = (h: Hand): number =>
        handDistance(on[h], e.voice) - (h === rested ? 0.10 : 0);
      const reachable = pool.filter(
        (h) => board.canReach(h, beat, handDistance(on[h], e.voice), 'strike'),
      );
      const hand = (reachable.length ? reachable : pool)
        .reduce((best, h) => (score(h) < score(best) ? h : best));

      board.place({
        effector: hand, beat, kind: 'strike',
        travel: handDistance(on[hand], e.voice),
        force: e.velocity,
        targets: [{ kind: 'drum', voice: e.voice }],
      });
      on[hand] = e.voice;
      since[hand] = beat;
      taken.add(hand);
    }
  }
}

/**
 * What this drummer is keeping time on.
 *
 * Read off the pattern rather than assumed, for the same reason the groove score
 * reads the pulse off the kick: a jazz style rides and a pop style hats, and a
 * drummer whose right hand starts on the wrong one spends the first bar
 * travelling. Everything is derived from the actual events, so a style nobody
 * has written yet gets the right sticking for free.
 */
function timekeeperOf(events: DrumEvent[]): DrumVoice {
  const counts = new Map<DrumVoice, number>();
  for (const e of events) {
    if (e.voice === 'hh' || e.voice === 'rd' || e.voice === 'oh' || e.voice === 'sh') {
      counts.set(e.voice, (counts.get(e.voice) ?? 0) + 1);
    }
  }
  let best: DrumVoice = 'hh';
  let most = -1;
  for (const [voice, n] of counts) {
    if (n > most) { most = n; best = voice; }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Keyboards, mallets, accordion, harp
// ---------------------------------------------------------------------------

interface KeyboardOptions {
  kind: GestureKind;
  /** Notes below this go to the left hand regardless of proximity. */
  split?: number;
  /** Notes below this go to the left foot — an organ's pedalboard. */
  pedalboardTop?: number;
  /** Emit `string` points instead of `key` points. Harp. */
  asString?: boolean;
  /**
   * How far open the bellows are at each note group, from `bellowsPart`.
   *
   * Accordion only. Indexed by group, so it is the one thing in here that has
   * to line up with the loop below rather than being a flag.
   */
  bellows?: number[];
  /**
   * The keyboards this player is standing at, where there is more than one.
   *
   * Absent means one board and every gesture emits no `board` on its point,
   * which is what everything written before this existed means. See `boardsFor`
   * — the same table the model reads, so the hand and the keys cannot disagree
   * about where a board is.
   */
  boards?: BoardSpec[];
  /**
   * Give this part one hand, because the other one is on another part.
   *
   * Set only where a player is carrying two lines — see `Performer.doubles` and
   * `PartShare`. It replaces every hand decision below rather than biasing one:
   * no proximity choice, no split at the widest interval, no crossing to another
   * board. One line, one hand, and the other hand is somewhere else in this same
   * schedule doing the same thing with the other line.
   */
  only?: Hand;
  /**
   * The keyboard this part lives on, instead of `pickBoard` choosing per figure.
   *
   * A player with two lines has put one sound on each board and is not hopping:
   * the reason to cross mid-figure is a voicing too wide for one hand, and a
   * part that got here has none. So the board is settled once, by casting, and
   * the hand goes there and stays.
   */
  atBoard?: number;
}

/**
 * Width of the main keyboard in metres, for converting a board gap into the
 * units `travel` is measured in.
 *
 * `whereInRange` runs 0..1 across an instrument's whole pitch span, so a travel
 * of 1 is a hand crossing the full keyboard — 52 white keys at 23.5 mm, which is
 * 1.22 m. Reaching to another board is a real distance in metres and has to be
 * converted before it can be added to that, or a tier 0.29 m up would read as a
 * cost of 0.29 of a keyboard: four times what it is.
 */
const BOARD_SPAN_M = 1.222;

/**
 * The most a hand may be asked to travel between boards, in `travel` units.
 *
 * A hand that cannot make it stays where it is — see `pickBoard`. This is not a
 * comfort threshold, it is the point past which the gesture would be a lie: the
 * runtime places a hand *at* the target on the beat, so a crossing the schedule
 * cannot fit produces a hand that teleports rather than one that hurries.
 */
const BOARD_REACH = 1.15;

/**
 * Two hands over a line of pitch.
 *
 * The interesting case is a chord, and the rule is the one a pianist would
 * describe: if the voicing is something one hand *grabs*, one hand takes it; if
 * it is not, it is split at its widest interval and the halves go low-to-left,
 * high-to-right. Measured across all three genres the median voicing this
 * generator writes spans nine semitones in four voices and the widest spans
 * twenty-three, so both branches are live and neither is an edge case.
 *
 * **What counts as a grab is `grabSpan`, not the stretch**, and that distinction
 * is the whole of a fix. See there.
 *
 * Splitting *at the widest interval* rather than in the middle matters: a
 * rootless voicing with the bass an octave below and three close notes on top is
 * one note in the left hand and a grab in the right, which is how it is actually
 * played. Splitting by count would put the hands in two impossible positions.
 *
 * Both halves then update `at`, which is what makes the assignment stateful
 * rather than a per-chord decision: once a two-handed voicing has put the left
 * hand low and the right hand high, the single notes between them go to
 * whichever hand is already on that side of the keyboard. A pianist comping a
 * chord and then answering it with one finger does not swap hands to do it, and
 * before the split existed there was nothing to stop them.
 */
function keyboardPart(
  groups: NoteEvent[][], spec: ArchetypeSpec, reach: [Midi, Midi],
  board: Board, opts: KeyboardOptions,
): void {
  // Hands start a third and two thirds of the way up, which is where they sit
  // on a keyboard nobody is playing yet.
  const at: Record<Hand, number> = { 'left-hand': 0.35, 'right-hand': 0.6 };
  /** Which keyboard each hand is currently on. Everyone starts on the main one. */
  const on: Record<Hand, number> = { 'left-hand': 0, 'right-hand': 0 };
  let footAt = 0.05;

  const point = (midi: Midi, bellows?: number, board?: number): PlayPoint => (opts.asString
    ? { kind: 'string', string: midi - reach[0], fret: 0 }
    : {
      kind: 'key', midi,
      ...(bellows === undefined ? {} : { bellows }),
      // Omitted entirely for board 0, so a single-keyboard part is byte-identical
      // to what it was before any of this existed.
      ...(board ? { board } : {}),
    });

  /**
   * Which keyboard this cluster goes to, and it is deliberately conservative.
   *
   * The main board plays everything and is always the answer unless a *reason*
   * shows up, because the failure mode on the other side is the one this whole
   * change exists to fix in reverse: boards that exist and are never touched are
   * scenery, and boards a hand hops between for no reason are worse — a player
   * whose hands flit mid-figure reads as broken rather than as busy.
   *
   * So the reason is the hands already being far apart. When a voicing is too
   * wide for one hand it is split at its widest interval, and *that* is the
   * moment a player with two keyboards uses the second one: the low half stays
   * under the left hand and the right hand goes up to the board above. It is
   * what the instrument is for and it needs no new musical concept to detect.
   *
   * Three things can veto it, in order of how often they fire:
   *
   *  - **The notes have to fit.** The extra boards are 61-note; a cluster with
   *    anything outside that range stays on the 88.
   *  - **The hand has to get there.** Board-to-board distance is real metres
   *    converted into `travel` units, added to the move the hand was making
   *    anyway, and checked against the schedule like any other travel. A
   *    crossing that does not fit does not happen — the hand stays put and
   *    plays the notes where it is.
   *  - **Nothing to cross to.** A one-board station never reaches this at all.
   *  - **Somebody already decided.** A player carrying two lines has one on each
   *    board and this question does not arise; `atBoard` answers it.
   */
  const pickBoard = (
    hand: Hand, cluster: Midi[], beat: number, where: number, split: boolean,
  ): number => {
    if (opts.atBoard !== undefined) return opts.atBoard;
    const boards = opts.boards;
    if (!boards || boards.length < 2 || !cluster.length) return 0;
    // Only the upper half of a split voicing goes up, and only the right hand
    // takes it: a left hand crossing over to a tier is a circus trick.
    const want = split && hand === 'right-hand' ? 1 : 0;
    if (want === on[hand]) return want;
    const spec = boards[want];
    if (!spec) return on[hand];
    const [lo, hi] = spec.range;
    if (cluster.some((m) => m < lo || m > hi)) return on[hand];
    const cross = boardGap(boards, on[hand], want) / BOARD_SPAN_M;
    const travel = Math.abs(where - at[hand]) + cross;
    if (travel > BOARD_REACH) return on[hand];
    return board.canReach(hand, beat, travel, opts.kind) ? want : on[hand];
  };

  for (const [index, group] of groups.entries()) {
    // Bound to this group's bellows before it is handed to `map`, which would
    // otherwise pass the array index in as the second argument.
    const air = opts.bellows?.[index];
    const pointHere = (midi: Midi): PlayPoint => point(midi, air);
    const beat = quantise(group[0]!.beat);
    const sustain = Math.max(...group.map((n) => n.duration));
    const force = Math.max(...group.map((n) => n.velocity));
    let midis = group.map((n) => foldIntoReach(n.midi, reach)).sort((a, b) => a - b);

    if (opts.pedalboardTop !== undefined) {
      const feet = midis.filter((m) => m < opts.pedalboardTop!);
      midis = midis.filter((m) => m >= opts.pedalboardTop!);
      if (feet.length) {
        const where = whereInRange(mean(feet), reach);
        board.place({
          effector: 'left-foot', beat, kind: opts.kind, travel: Math.abs(where - footAt),
          force, sustainBeats: sustain, targets: feet.map(pointHere),
        });
        footAt = where;
      }
    }
    if (!midis.length) continue;

    let clusters: [Midi[], Midi[]];
    if (opts.only) {
      // One hand has this whole line, so there is nothing to divide: no
      // proximity choice, and no splitting a voicing that casting has already
      // established one hand can hold. See `oneHanded`.
      clusters = opts.only === 'left-hand' ? [midis, []] : [[], midis];
    } else if (opts.split !== undefined) {
      // The accordion is not split by proximity: the left hand is on bass and
      // chord buttons and the right hand is on a keyboard, and they are separate
      // instruments that happen to share a box.
      clusters = [midis.filter((m) => m < opts.split!), midis.filter((m) => m >= opts.split!)];
    } else if (
      midis.length === 1
      || (midis[midis.length - 1]! - midis[0]!) <= grabSpan(spec.id, midis.length)
    ) {
      clusters = [[], []];
      const where = whereInRange(mean(midis), reach);
      const hand = chooseHand(board, beat, where, at, opts.kind);
      clusters[hand === 'left-hand' ? 0 : 1] = midis;
    } else {
      const cut = widestGap(midis);
      clusters = [midis.slice(0, cut), midis.slice(cut)];
    }

    const hands: [Hand, Hand] = ['left-hand', 'right-hand'];
    // Both clusters carrying notes is what "the hands are apart" means, and it
    // is the only thing that sends a hand to another keyboard. See `pickBoard`.
    const split = clusters[0]!.length > 0 && clusters[1]!.length > 0;
    for (let i = 0; i < 2; i++) {
      const cluster = clusters[i]!;
      if (!cluster.length) continue;
      const hand = hands[i]!;
      const where = whereInRange(mean(cluster), reach);
      const to = pickBoard(hand, cluster, beat, where, split);
      const cross = opts.boards ? boardGap(opts.boards, on[hand], to) / BOARD_SPAN_M : 0;
      board.place({
        effector: hand, beat, kind: opts.kind,
        travel: Math.abs(where - at[hand]) + cross,
        force, sustainBeats: sustain,
        targets: cluster.map((m) => point(m, air, to)),
      });
      at[hand] = where;
      on[hand] = to;
    }
  }
}

/**
 * Which hand takes a note that either could.
 *
 * Nearest wins, unless the nearest cannot get there in time, in which case the
 * other one does — and a small penalty stops the hands crossing, because a
 * pianist crossing hands is a deliberate gesture and a pianist crossing hands by
 * accident forty times a bar is a bug you can see from the back row.
 */
function chooseHand(
  board: Board, beat: number, where: number,
  at: Record<Hand, number>, kind: GestureKind,
): Hand {
  const cost = (hand: Hand): number => {
    const travel = Math.abs(where - at[hand]);
    const crosses = hand === 'left-hand' ? where > at['right-hand'] : where < at['left-hand'];
    return travel
      + (crosses ? 0.25 : 0)
      + (board.canReach(hand, beat, travel, kind) ? 0 : 1);
  };
  return cost('left-hand') <= cost('right-hand') ? 'left-hand' : 'right-hand';
}

// ---------------------------------------------------------------------------
// Mallets
// ---------------------------------------------------------------------------

/**
 * Two sticks over a line of pitch, which is not the same problem as two hands.
 *
 * Mallets used to go through `keyboardPart`, and that is a *pianist's* rule:
 * each hand owns a region of the keyboard and a note goes to whichever region
 * it falls in. It is right for ten fingers and wrong for two sticks, because a
 * pianist's region is as wide as their hand and a vibraphonist's is as wide as
 * their arm — so on a part that sits inside one octave, which is most of what
 * this generator writes, one region swallowed the whole line.
 *
 * Measured over 128 staged mallet parts before this existed: the busier hand
 * took **77% of the notes on average and every single note on 29% of them**. A
 * vibraphonist playing a whole number with one arm while the other hangs over
 * the middle of the instrument is the most obviously wrong thing a mallet
 * player can do, and it is also why the hands never went anywhere — a part
 * spanning fifteen semitones is 38 cm of a 1.35 m instrument, and half of that
 * again if only one hand ever crosses it.
 *
 * A percussionist alternates. That single difference is what puts both sticks
 * on the bars and keeps them travelling along the row, and it is the reason a
 * mallet player's hands visibly cross the instrument where a pianist's do not.
 * Three rules, in order:
 *
 *  - **Alternate.** The stick that did not play the last note plays this one.
 *  - **Do not cross by more than a stick's own span.** Left stays below right
 *    at the scale that reads from the audience; inside a hand's span the two
 *    interleave freely, which is what alternating through a close line
 *    actually looks like. Without the limit an arpeggio plaits the arms;
 *    with it set any tighter, a part inside one octave collapses back to one
 *    stick, because in a narrow band every alternation is a small crossing.
 *  - **Do not ask for the impossible.** A stick still coming back from the far
 *    end of the row cannot make the next note, so the other one takes it —
 *    a double stroke, and `Board.canReach` is the same test the kit's sticking
 *    already uses for the same reason.
 *
 * A chord is split rather than stuck: at its widest interval, low notes to the
 * left stick and high to the right. That is what a player does and it is also
 * the only way two mallets reach three bars.
 */
function malletPart(groups: NoteEvent[][], reach: [Midi, Midi], board: Board): void {
  /**
   * How far a stick may stray onto the other stick's side, as a fraction of the
   * row. One hand span, so the rule bites at a crossover and nowhere else.
   */
  const slack = handSpanSemitones('mallets') / Math.max(1, reach[1] - reach[0]);
  // Where the sticks start: a third and two thirds up, over a row nobody is
  // playing yet. Only the first note reads these — after that the sticks are
  // wherever the line has taken them — so they are a plausible opening stance
  // rather than a claim about who owns which end.
  const at: Record<Hand, number> = { 'left-hand': 0.35, 'right-hand': 0.6 };
  /**
   * Which stick played last, or nothing after a chord.
   *
   * A chord is struck by both, so neither of them is "the one that went last"
   * and there is nothing to alternate away from. The note after it goes to the
   * nearer free stick instead, which is where alternation picks up again.
   */
  let last: Hand | undefined;

  for (const group of groups) {
    const beat = quantise(group[0]!.beat);
    const sustain = Math.max(...group.map((n) => n.duration));
    const force = Math.max(...group.map((n) => n.velocity));
    const midis = group.map((n) => foldIntoReach(n.midi, reach)).sort((a, b) => a - b);

    let clusters: [Midi[], Midi[]];
    if (midis.length === 1) {
      const hand = stickFor(board, beat, whereInRange(midis[0]!, reach), at, last, slack);
      clusters = hand === 'left-hand' ? [midis, []] : [[], midis];
      last = hand;
    } else {
      const cut = widestGap(midis);
      clusters = [midis.slice(0, cut), midis.slice(cut)];
      last = undefined;
    }

    const hands: [Hand, Hand] = ['left-hand', 'right-hand'];
    for (let i = 0; i < 2; i++) {
      const cluster = clusters[i]!;
      if (!cluster.length) continue;
      const hand = hands[i]!;
      const where = whereInRange(mean(cluster), reach);
      board.place({
        effector: hand, beat, kind: 'strike', travel: Math.abs(where - at[hand]),
        force, sustainBeats: sustain, targets: cluster.map((midi) => ({ kind: 'key', midi })),
      });
      at[hand] = where;
    }
  }
}

/**
 * Which stick takes a single note: alternation, overruled by crossing and by
 * physics, in that order.
 *
 * The fallbacks at the bottom are not decoration. Both sticks can be
 * compromised at once — a fast line at the very top of the row leaves the left
 * stick permanently crossing and the right stick permanently late — and a
 * chooser that returned nothing in that case would have to be handled by its
 * caller, which is worse than answering "the one that is free", then "the one
 * that is near".
 */
function stickFor(
  board: Board, beat: number, where: number,
  at: Record<Hand, number>, last: Hand | undefined, slack: number,
): Hand {
  const other = (h: Hand): Hand => (h === 'left-hand' ? 'right-hand' : 'left-hand');
  const gap = (h: Hand): number => Math.abs(where - at[h]);
  const free = (h: Hand): boolean => board.canReach(h, beat, gap(h), 'strike');
  const crosses = (h: Hand): boolean => (h === 'left-hand'
    ? where > at['right-hand'] + slack
    : where < at['left-hand'] - slack);

  const want = last
    ? other(last)
    : gap('left-hand') <= gap('right-hand') ? 'left-hand' : 'right-hand';
  if (!crosses(want) && free(want)) return want;
  const alt = other(want);
  if (!crosses(alt) && free(alt)) return alt;
  if (free(want) !== free(alt)) return free(want) ? want : alt;
  return gap(want) <= gap(alt) ? want : alt;
}

/**
 * How far the bellows are allowed to travel, 0 shut .. 1 fully out, and where a
 * number starts.
 *
 * The margins are not decoration. A bellows run to either stop is a bellows
 * that has to change direction *now*, whatever the music is doing, and a player
 * arranges never to be there — so the plan turns round inside them and the ends
 * stay as headroom for a phrase that runs long.
 */
const BELLOWS_FLOOR = 0.08;
const BELLOWS_CEIL = 0.94;
/** Mostly shut, with the pull still in hand. Which is how you pick one up. */
const BELLOWS_START = 0.28;

/**
 * How much of the box one beat of sound costs at full volume.
 *
 * The whole of "keep track of if there is enough range to play". A free reed
 * spends air for as long as it sounds, so a held chord costs what a held chord
 * costs and a staccato flick costs almost nothing — which is why an
 * accordionist's box drifts steadily under a sustained line and barely moves
 * under a comping pattern. At 0.14 a loud sustained line crosses the whole
 * travel in about seven beats, near enough two bars, which is where a real
 * player turns round.
 */
const AIR_PER_BEAT = 0.14;
/** A chord opens more reeds than a single note, though not proportionally. */
const AIR_PER_EXTRA_NOTE = 0.12;
/** Longest note the air model will believe. A whole-note pad is not a drone. */
const AIR_MAX_BEATS = 4;
/**
 * How little room has to be left before a phrase join is taken as the moment to
 * turn round.
 *
 * The direction changes when the air runs out — that is the rule — but a player
 * who can see the end coming would rather change at the join than four notes
 * into the next phrase. A fifth of the travel is close enough to "nearly out"
 * to be worth the early turn and far enough from it that a short rest in the
 * middle of a long open passage does not flip the box for no reason.
 */
const BELLOWS_TURN_EARLY = 0.2;
/**
 * How far the box drifts before the arm is told about it again.
 *
 * The direction changes are the gestures that matter, but a squeeze that is
 * only ever placed at a reversal leaves the *torso* still for the whole eight
 * beats in between while the box slides out from under it. Restating it about
 * every third of the travel keeps the lean tracking the box without turning
 * every note into a gesture — the box itself is carried by the notes, so this
 * only has to be often enough for a torso.
 */
const BELLOWS_STEP = 0.35;

/**
 * Bellows, which are the accordion's breath and the only thing on stage that
 * moves continuously without making a note of its own.
 *
 * Returns where the box is at each note group, which is what the left hand
 * needs: half an accordion rides the bellows and the hand on it has to ride
 * them too. See `PlayPoint`'s `bellows` for why that travels on the note rather
 * than being worked out by the model.
 *
 * ## Why this is a budget and not an alternation
 *
 * The first version placed one squeeze per phrase and flipped the direction
 * each time, which is the behaviour you write when you think of the bellows as
 * a metronome. It is not one. A bellows is a **tank**: it holds a fixed amount
 * of travel, every sounding note spends some, and the direction changes when
 * the tank runs out — not when the phrase does. That single difference is most
 * of what makes an accordionist look like they are playing rather than
 * pumping, because it means the box goes the same way for four bars of quiet
 * comping and turns round twice inside one loud held passage.
 *
 * So: spend `AIR_PER_BEAT` per beat of sound, turn round when there is not
 * enough left for the note in front of you, and prefer to turn at a phrase join
 * if one is close. Gestures go on the body rather than on a hand — the left
 * hand is on the buttons and it is the whole left *arm* that opens the box.
 */
function bellowsPart(groups: NoteEvent[][], board: Board): number[] {
  const plan: number[] = [];
  let at = BELLOWS_START;
  /** +1 pulling the box open, −1 pushing it shut. */
  let dir = 1;
  /** The last extension the arm was told about. */
  let told = Number.NaN;
  let lastEnd = -Infinity;

  const say = (beat: number, force: number): void => {
    board.place({
      effector: 'body', beat, kind: 'squeeze', travel: 0, force,
      sustainBeats: 2, targets: [{ kind: 'bellows', open: dir > 0, at }],
    });
    told = at;
  };

  for (const group of groups) {
    const beat = quantise(group[0]!.beat);
    const sustain = Math.max(...group.map((n) => n.duration));
    const force = Math.max(...group.map((n) => n.velocity));

    const air = AIR_PER_BEAT
      * Math.min(sustain, AIR_MAX_BEATS)
      * (0.45 + 0.55 * clamp01(force))
      * (1 + AIR_PER_EXTRA_NOTE * (group.length - 1));
    const room = dir > 0 ? BELLOWS_CEIL - at : at - BELLOWS_FLOOR;
    const join = beat - lastEnd > 1 || !Number.isFinite(lastEnd);

    // Out of air, or close enough to it that this join is the better place.
    const turn = air > room || (join && room < BELLOWS_TURN_EARLY);
    if (turn) dir = -dir;

    /**
     * Where the box is **as this note lands**, which is what `PlayPoint.bellows`
     * promises and what the model starts this note's travel from.
     *
     * Reported before the note's air is spent, not after. The other order reads
     * as the natural one and says something else entirely: where the box will
     * be when the note *ends*. So the box arrived at each note already holding
     * the air that note had yet to spend, and every extension in the plan was
     * one note out of step with the sound paying for it.
     */
    plan.push(at);

    // The arm hears about a reversal immediately and about a long drift every
    // so often. Everything between is carried by the notes themselves.
    if (turn || !Number.isFinite(told) || Math.abs(at - told) >= BELLOWS_STEP) say(beat, force);

    at = Math.min(BELLOWS_CEIL, Math.max(BELLOWS_FLOOR, at + dir * air));

    lastEnd = beat + sustain;
  }
  return plan;
}

// ---------------------------------------------------------------------------
// Strings, stopped and either bowed or plucked
// ---------------------------------------------------------------------------

/**
 * Two hands doing different jobs, which is what makes this archetype family
 * different from every other one.
 *
 * The left hand stops the string and the right hand — or the bow — sounds it, so
 * a note produces *two* gestures and only one of them is the note. That is not a
 * coverage failure, it is the instrument: a guitarist's fretting hand is the one
 * an audience watches and it moves further and faster than the picking hand.
 * `soundingEffectors` exists so the verifier can tell them apart.
 *
 * Proximity for the fretting hand is fret distance along the neck, which is the
 * same reasoning as the kit sweep and the keyboard range: it is the axis the
 * hand actually travels along, and crossing strings barely costs anything by
 * comparison. Proximity for the picking hand is which string it is over.
 */
function stringPart(
  groups: NoteEvent[][], spec: ArchetypeSpec, reach: [Midi, Midi],
  board: Board, bowed: boolean,
): void {
  const open = spec.strings ?? [];
  const maxFret = spec.frets ?? UNFRETTED_STOPS;
  const stringSpan = Math.max(1, open.length - 1);
  const sounding: Effector = bowed ? 'bow' : 'right-hand';

  let fretAt = 0;
  let stringAt = stringSpan / 2;
  // A bow is finite and reverses at phrase joins; see `bowStroke`.
  let bowBeats = 0;
  let lastEnd = -Infinity;

  // Folded once, up front, because the position planner reads ahead into them.
  const pitches = groups.map(
    (g) => g.map((n) => foldIntoReach(n.midi, reach)).sort((a, b) => a - b),
  );

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]!;
    const beat = quantise(group[0]!.beat);
    const sustain = Math.max(...group.map((n) => n.duration));
    const force = Math.max(...group.map((n) => n.velocity));
    const midis = pitches[i]!;

    // Everything the hand has to cover before it can shift again.
    const window = [midis];
    for (let j = i + 1; j < groups.length; j++) {
      if (quantise(groups[j]![0]!.beat) - beat > POSITION_LOOKAHEAD) break;
      window.push(pitches[j]!);
    }
    const position = open.length ? planPosition(window, open, maxFret) : fretAt;

    const stops = chooseStops(midis, open, maxFret, reach, position);
    /**
     * Nothing here has an honest fingering, so nobody plays it.
     *
     * `chooseStops` returns one stop per note it can place and no stop at all
     * for a note it cannot, so a chord comes back short and a single note can
     * come back empty. Short is the ordinary case and everything below already
     * handles it — the means are over what was placed, and the bow crosses the
     * strings that are stopped. Empty is the one that needs a decision, and the
     * decision is to place nothing: `Board.place` with no targets makes no
     * gestures but still books the limb, which would push the next real note's
     * windup off a gesture that does not exist. Both hands simply carry on, and
     * the runtime drifts an effector with nothing to do toward the model's own
     * `rest` — a player not playing this one, rather than a player playing the
     * wrong note.
     *
     * `lastEnd` deliberately does not move: the bow really is still where the
     * last sounded note left it, so a long silence still earns its lift.
     *
     * With the catalogue as it stands this cannot fire — `reachFor` guarantees
     * every folded note sits on some string — so it is a guard rather than a
     * behaviour. It is here because the alternative to the guard is a silent
     * scheduling fault the first time a tuning changes.
     */
    if (!stops.length) continue;
    const gap = beat - lastEnd;

    // A bow that has left the string has to come back to it, and a bow that has
    // been travelling one way for four beats is running out of hair. Both are
    // direction changes, and a direction change is a fresh `bow`; everything
    // under one stroke is a `hold`, which is how a slur reaches the renderer.
    // `Gesture` has no field for *which* direction, so the renderer alternates
    // on each `bow` and continues through each `hold` — see the report.
    const stroke: GestureKind = bowed && gap <= 0.25 && bowBeats <= 4 ? 'hold' : 'bow';
    if (bowed) bowBeats = stroke === 'bow' ? sustain : bowBeats + sustain;

    // The bow lifts, visibly, when the line rests for more than a bar's worth.
    if (bowed && gap > 2 && Number.isFinite(lastEnd)) {
      board.place({
        effector: 'bow', beat: quantise(lastEnd + 0.25), kind: 'hold', travel: 0.1,
        force: 0.2, targets: [{ kind: 'rest' }],
      });
    }

    const fretMean = mean(stops.map((s) => s.fret));
    const stringMean = mean(stops.map((s) => s.string));
    const targets: PlayPoint[] = stops.map((s) => ({ kind: 'string', string: s.string, fret: s.fret }));

    board.place({
      effector: 'left-hand', beat, kind: 'press',
      travel: Math.abs(fretMean - fretAt) / Math.max(1, maxFret),
      force, sustainBeats: sustain, targets,
    });
    board.place({
      effector: sounding, beat, kind: bowed ? stroke : 'pluck',
      travel: Math.abs(stringMean - stringAt) / stringSpan,
      force, sustainBeats: sustain, targets,
    });

    fretAt = fretMean;
    stringAt = stringMean;
    lastEnd = beat + sustain;
  }
}

/**
 * How many frets one hand covers without shifting.
 *
 * Four, so a position is five frets wide counting the one the index finger is
 * on: first position on a guitar, and about what a bassist covers with
 * one-two-four low on a much longer neck. This is the unit a player actually
 * thinks in — you shift *positions*, not fingers — and it is therefore the unit
 * the planner below works in.
 */
const POSITION_SPAN = 4;

/**
 * How far ahead the hand commits, in beats.
 *
 * Half a bar. Long enough that a shift is made for a phrase rather than for a
 * note, short enough that the hand is not sitting up at the seventh fret two
 * bars before the one note that needs it.
 */
const POSITION_LOOKAHEAD = 2;

/**
 * Where the hand sits for the next half-bar — the fix for a hand that went up
 * the neck once and never came back.
 *
 * The anchor used to be simply the last position the hand was in, and that has
 * a ratchet in it: the single highest note in a phrase drags the hand up to
 * reach it, and every note afterwards is then *closer* to a high fingering than
 * to the low one it belongs at, so it stays. One Eb3 in a bass line — the only
 * note in it that a four-string bass cannot play below the eighth fret — pinned
 * an entire chorus of E2s and G2s to the sixth and eighth frets, on the thick
 * strings, for the rest of the number. Measured over a dozen concerts, the mean
 * bass fret was 8.1 where the notes themselves only ever needed 2.9.
 *
 * So plan instead of drift: take the lowest position that covers everything in
 * the look-ahead window, and if nothing covers the whole window, shorten it
 * until something does. A player reaches up for the outlier and comes straight
 * back down, because the *next* window no longer contains it.
 *
 * Open strings are always available — they need no hand at all — so a note that
 * an open string can sound never constrains the position.
 *
 * This ignores the one-note-per-string rule, which `chooseStops` still enforces:
 * a position is a hint about where the arm goes, and a chord that cannot quite
 * be fingered there still wants the hand in the neighbourhood.
 */
function planPosition(window: Midi[][], open: Midi[], maxFret: number): number {
  for (let end = window.length; end > 0; end--) {
    const p = lowestPositionCovering(window.slice(0, end).flat(), open, maxFret);
    if (p >= 0) return p;
  }
  return 0;
}

/** The lowest index-finger fret that reaches every one of these, or -1. */
function lowestPositionCovering(midis: Midi[], open: Midi[], maxFret: number): number {
  for (let p = 0; p <= maxFret; p++) {
    const top = Math.min(p + POSITION_SPAN, maxFret);
    let covered = true;
    for (const midi of midis) {
      let reachable = false;
      for (const o of open) {
        const fret = midi - o;
        if (fret === 0 || (fret >= p && fret <= top)) { reachable = true; break; }
      }
      if (!reachable) { covered = false; break; }
    }
    if (covered) return p;
  }
  return -1;
}

/**
 * Where to put the fingers.
 *
 * Ascending, one string each — a chord cannot use a string twice — choosing the
 * fingering nearest the position the hand has been planned into. That is the
 * actual decision a player makes and it is why a bass line stays in one position
 * instead of lurching up the neck for every note that happens to be available
 * higher. `anchor` is that position; see `planPosition` for how it is chosen and
 * for what went wrong when it was just wherever the hand happened to be last.
 *
 * **The one thing this function guarantees: `open[string] + fret` is the note
 * the stop was made for.** A `{kind:'string'}` point that does not sound its own
 * note is worse than no point at all, because a fingerboard is legible — an
 * audience cannot hear which of four inner voices is missing but can see a
 * finger sitting on a fret. So a note that has no honest fingering gets no stop,
 * and the returned array is shorter than `midis`. `stringPart` handles that.
 *
 * That used to be a clamp — nearest free string, `fret` folded into `0..maxFret`
 * — and the clamp is what this replaces. It was written for a note that no
 * string could reach at all, which cannot happen any more: `reachFor` bounds
 * every part by its own strings, and the one instrument whose declared range
 * really did start below its lowest string (the sitar, a minor third under its
 * C3) has since been given a range bounded by its own tuning. What the clamp
 * actually fired on was something else entirely — a chord with more notes than
 * the instrument has *free* strings — and there `Math.max(0, ...)` landed on
 * fret 0, an open string, the single most readable hand position there is.
 * Measured across 42 concerts it put 30.4% of a violinist's left hand on a note
 * that was not in the chord, and pinned the hand into the bottom twelfth of the
 * fingerboard for nine tenths of the show.
 *
 * Hence two passes:
 *
 *  - **Greedy, ascending, cheapest free string.** Untouched, because it is the
 *    fingering a player thinks in and because it is already right: on six
 *    strings it strands about one note in a thousand and on the basses and the
 *    cello it strands none at all.
 *  - **Then, for whatever it stranded, one augmenting search**: could the notes
 *    already placed have been fingered differently and still left a string for
 *    this one? That is the question a player asks when a voicing does not fall
 *    under the hand, and answering it exactly is what turns a greedy assignment
 *    into a maximum one. It reshuffles earlier notes, which is why it is a
 *    second pass and not the first: a chord that the greedy pass placed whole
 *    never reaches it, so an instrument that never strands a note is fingered
 *    exactly as it was before any of this.
 *
 * What is left after both passes is a section pad with more voices than one
 * player has strings, and those voices are dropped. That is the honest reading
 * of the archetype table: `ARCHETYPES.violin` is one violinist standing in for
 * a whole section, four-part writing does not fit on four strings under one
 * hand, and the voices that do not fit belong to the players who are not on
 * stage. Showing three of four is a true statement about one pair of hands.
 *
 * Rejected: capping a bowed part at a genuine two-string double stop and
 * dropping everything above it. More faithful to what a bow can sound at once,
 * but it throws away voices this instrument demonstrably can hold, and the
 * "a bow only crosses two strings" simplification is the renderer's to make —
 * it already spreads one stroke across every string it is handed.
 */
function chooseStops(
  midis: Midi[], open: Midi[], maxFret: number, reach: [Midi, Midi], anchor: number,
): { string: number; fret: number }[] {
  // A harp, whose strings are one per note and are addressed by pitch.
  if (!open.length) {
    return midis.map((m) => ({ string: m - reach[0], fret: 0 }));
  }
  // Staying in position is the whole cost; the mild bias toward lower strings is
  // what stacks a chord upward instead of piling it onto the top two wires.
  const cost = (midi: Midi, s: number): number => Math.abs(midi - open[s]! - anchor) + s * 0.05;
  /** Every string that can sound `midi`, cheapest fingering first. */
  const fits = (midi: Midi): number[] => {
    const ss: number[] = [];
    for (let s = 0; s < open.length; s++) {
      const fret = midi - open[s]!;
      if (fret >= 0 && fret <= maxFret) ss.push(s);
    }
    return ss.sort((a, b) => cost(midi, a) - cost(midi, b));
  };

  /** Which note each string is holding, indexed into `midis`, or -1. */
  const on: number[] = new Array<number>(open.length).fill(-1);
  const stranded: number[] = [];
  for (let i = 0; i < midis.length; i++) {
    const s = fits(midis[i]!).find((c) => on[c]! < 0);
    if (s === undefined) stranded.push(i);
    else on[s] = i;
  }

  /** Seat note `i`, moving whoever is in the way somewhere they also fit. */
  const reseat = (i: number, tried: boolean[]): boolean => {
    for (const s of fits(midis[i]!)) {
      if (tried[s]) continue;
      tried[s] = true;
      if (on[s]! < 0 || reseat(on[s]!, tried)) { on[s] = i; return true; }
    }
    return false;
  };
  for (const i of stranded) reseat(i, new Array<boolean>(open.length).fill(false));

  // Ascending by pitch, which is the order the caller's targets have always been
  // in and the order the bow crosses the strings in.
  const out: { string: number; fret: number }[] = [];
  for (let i = 0; i < midis.length; i++) {
    const s = on.indexOf(i);
    if (s >= 0) out.push({ string: s, fret: midis[i]! - open[s]! });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Blown, and sung
// ---------------------------------------------------------------------------

/**
 * Nothing travels, and that is the point.
 *
 * A wind or brass player's hands do not go anywhere — the instrument is held and
 * the keywork is already under the fingers — so the sounding gesture is on the
 * *mouth*, one per note, with a windup that is an embouchure rather than a
 * swing. Giving these archetypes a striking hand was the first version and it
 * looked exactly as wrong as it sounds.
 *
 * The trombone is the exception worth the extra branch: a slide is a hand that
 * genuinely travels, it travels *with the pitch*, and it is the single most
 * recognisable movement in the brass section.
 */
function blownPart(
  groups: NoteEvent[][], track: Track, spec: ArchetypeSpec, reach: [Midi, Midi], board: Board,
): void {
  const pointKind: 'valve' | 'hole' = spec.points.includes('valve') ? 'valve' : 'hole';
  const slide = spec.id === 'trombone';
  let slideAt = 0.5;
  const air = spec.blown ? planBreaths(groups, board, breathOf(track)) : [];
  let next = 0;

  for (const group of groups) {
    const beat = quantise(group[0]!.beat);
    // Breaths are placed *in time order with the notes* rather than appended
    // afterwards. Appending was the first version and it silently broke the one
    // invariant this file exists to hold: a breath inserted behind gestures that
    // were already scheduled has nothing to schedule itself against, and its
    // windup ran back through the release of the phrase before it.
    while (next < air.length && air[next]!.beat < beat) {
      const it = air[next++]!;
      board.place({
        effector: 'mouth', beat: it.beat, kind: 'breathe', travel: 0,
        force: it.force, targets: [{ kind: 'rest' }],
      });
    }

    const sustain = Math.max(...group.map((n) => n.duration));
    const force = Math.max(...group.map((n) => n.velocity));
    const midis = group.map((n) => foldIntoReach(n.midi, reach));
    // A chord on a monophonic instrument, which the generator does write: the
    // brass and pad layers get voicings and the catalogue answers them with a
    // "brass section" or a "string ensemble" on one player. One motion, several
    // targets — the same stand-in the archetype table already makes when it
    // stages a whole string section as one violinist. The model fingers the top
    // one; the rest are the players who are not on stage.
    const targets: PlayPoint[] = midis.map((midi) => (
      pointKind === 'valve' ? { kind: 'valve', midi } : { kind: 'hole', midi }
    ));

    board.place({
      effector: 'mouth', beat, kind: 'blow', travel: 0,
      force, sustainBeats: sustain, targets,
    });
    if (slide) {
      // A slide is one position, so it gets one target even where the mouth got
      // four: whichever note of the voicing is nearest its centre is the one the
      // player on stage is actually taking. Handing the slide the whole chord
      // would ask one arm to be in four places, which is the exact failure this
      // file is otherwise built to prevent.
      const centre = mean(midis);
      const taken = midis.reduce((a, b) => (Math.abs(b - centre) < Math.abs(a - centre) ? b : a));
      const where = whereInRange(taken, reach);
      board.place({
        effector: 'right-hand', beat, kind: 'press', travel: Math.abs(where - slideAt),
        force, sustainBeats: sustain, targets: [{ kind: 'valve', midi: taken }],
      });
      slideAt = where;
    }
  }
}

/**
 * The singer.
 *
 * One gesture per sung note on the mouth, carrying the vowel and the consonant
 * the synthesiser is already singing — the same numbers, used twice, so the lips
 * cannot drift out of agreement with the voice. What this does *not* do is
 * describe the mouth's shape: jaw, rounding and spreading are `Viseme`, they
 * live in `concert/visemes.ts`, and they are a finer-grained reading of the same
 * notes. This says when the mouth moves and how much; that says what it looks
 * like when it gets there.
 *
 * Breath is not decoration here. A singer who never inhales is the most
 * uncanny thing that can be put on a stage, and `IDIOMS.vocal.breath` has been
 * sitting in the style tables saying how badly this line needs air since long
 * before anything visual existed to use it.
 */
function sungPart(groups: NoteEvent[][], board: Board): void {
  const air = planBreaths(groups, board, IDIOMS.vocal.breath);
  let next = 0;
  for (const group of groups) {
    const beat = quantise(group[0]!.beat);
    while (next < air.length && air[next]!.beat < beat) {
      const it = air[next++]!;
      board.place({
        effector: 'mouth', beat: it.beat, kind: 'breathe', travel: 0,
        force: it.force, targets: [{ kind: 'rest' }],
      });
    }
    const sustain = Math.max(...group.map((n) => n.duration));
    const force = Math.max(...group.map((n) => n.velocity));
    const targets: PlayPoint[] = group.map((n) => ({
      kind: 'viseme',
      vowel: n.vowel ?? 'a',
      consonant: n.consonant ?? 'none',
    }));
    // No folding and no range check: a viseme has no pitch in it. A note above
    // the singer's declared range is a note sung with more effort, and the face
    // is the only thing on stage that shows it.
    board.place({
      effector: 'mouth', beat, kind: 'blow', travel: 0,
      force, sustainBeats: sustain, targets,
    });
  }
}

/**
 * Visible inhales, in the gaps, scaled by how badly the line needs air.
 *
 * `IDIOMS[...].breath` is already the right number — brass 0.9, wind 0.7, voice
 * 0.8, and 0.05 for a keyboard that does not breathe at all — and until now
 * nothing has used it for anything except deciding where to put rests. Reading
 * it here means a trumpet visibly takes more air than a flute without anyone
 * writing a second table, and it means the two agree by construction: the same
 * number that *created* the rest is the one that fills it.
 *
 * The inhale is placed so that it finishes before the entry rather than on it,
 * because a breath taken on the downbeat is a breath taken too late, and it only
 * happens where the rest is long enough to contain it — a player does not snatch
 * a breath in a sixteenth.
 */
function planBreaths(
  groups: NoteEvent[][], board: Board, breath: number,
): { beat: number; force: number }[] {
  if (breath < 0.2) return [];
  const inhale = board.toBeats(PREP_SECONDS.breathe[0] + PREP_SECONDS.breathe[2] * breath);
  const out: { beat: number; force: number }[] = [];
  let lastEnd = -Infinity;
  for (const group of groups) {
    const beat = quantise(group[0]!.beat);
    const gap = beat - lastEnd;
    lastEnd = beat + Math.max(...group.map((n) => n.duration));
    if (!Number.isFinite(gap) || gap < inhale + 0.5) continue;
    // Clear of the entry by at least a slot: the air is in *before* the note,
    // not with it. A breath taken on the downbeat is a breath taken too late.
    const at = quantise(beat - Math.max(0.25, Math.min(gap * 0.35, inhale)));
    if (at >= beat || at <= 0) continue;
    out.push({ beat: at, force: breath });
  }
  return out;
}

/** How badly this track's instrument needs air. */
function breathOf(track: Track): number {
  return IDIOMS[idiomOf(track)].breath;
}

function idiomOf(track: Track): keyof typeof IDIOMS {
  const id = instrumentIdForTrack(track);
  return id ? INSTRUMENTS[id].idiom : 'vocal';
}

// ---------------------------------------------------------------------------
// Small shared parts
// ---------------------------------------------------------------------------

/**
 * Notes that sound together are one motion.
 *
 * Grouped on the *quantised* beat rather than the raw one, because that is where
 * the audio puts them: two notes a thousandth of a beat apart are one chord to
 * the ear and to the renderer, and treating them as two would ask one hand to be
 * in two places a thousandth of a beat apart.
 */
function groupByBeat(notes: NoteEvent[]): NoteEvent[][] {
  const by = new Map<number, NoteEvent[]>();
  for (const n of notes) {
    const beat = quantise(n.beat);
    const at = by.get(beat);
    if (at) at.push(n);
    else by.set(beat, [n]);
  }
  return [...by.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

/** Index to split an ascending chord at its widest interval. */
function widestGap(midis: Midi[]): number {
  let cut = 1;
  let widest = -1;
  for (let i = 1; i < midis.length; i++) {
    const gap = midis[i]! - midis[i - 1]!;
    if (gap > widest) { widest = gap; cut = i; }
  }
  return cut;
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
