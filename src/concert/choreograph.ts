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
 *  3. **Hand assignment is greedy by proximity in the instrument's own space,**
 *     with a hard "can it get there in time" test that is allowed to override
 *     proximity. There is no geometry here, so proximity cannot be metres; see
 *     `kitDistance` and `whereInRange` for what it is instead, and for the
 *     limitation that implies.
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

import { quantise } from '../core/grid.js';
import type { Midi } from '../core/pitch.js';
import { Rng } from '../core/rng.js';
import type { DrumEvent, DrumVoice, NoteEvent, Song, Track } from '../core/types.js';
import { IDIOMS, INSTRUMENTS } from '../style/instruments.js';
import {
  boardGap, boardsFor, instrumentIdForTrack, rangeForTrack, specFor,
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
 */
const KIT: Record<DrumVoice, { sweep: number; tier: number }> = {
  hh: { sweep: 0.06, tier: 1 },
  oh: { sweep: 0.06, tier: 1 },
  cr: { sweep: 0.18, tier: 1 },
  sd: { sweep: 0.34, tier: 0 },
  rim: { sweep: 0.34, tier: 0 },
  cp: { sweep: 0.36, tier: 0 },
  ht: { sweep: 0.46, tier: 0 },
  cb: { sweep: 0.50, tier: 1 },
  bd: { sweep: 0.50, tier: 0 }, // a foot; here so the record is total
  perc: { sweep: 0.54, tier: 0 },
  sh: { sweep: 0.58, tier: 0 },
  mt: { sweep: 0.64, tier: 0 },
  lt: { sweep: 0.78, tier: 0 },
  rd: { sweep: 0.90, tier: 1 },
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

  if (performer.archetype === 'drumkit' || performer.layer === 'drums') {
    drumPart(song.drums.events, board);
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
   */
  if (machines.length) operatePart(song, machines, board);

  // Sorted by beat, as `PerformerPart` promises. `Array.prototype.sort` is
  // stable, so gestures placed together in one motion keep the order they were
  // emitted in and the output is byte-identical run to run.
  return board.gestures.sort((a, b) => a.beat - b.beat);
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
    moments.push({ beat: first, at: 0.12, start: true });

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

    /**
     * The free hand, and it is the left by preference.
     *
     * A right hand is where the tune usually is on a keyboard, so the left is
     * the one more often idle at a section boundary. `canReach` settles it
     * either way — this only decides who is asked first.
     */
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
      let placed = false;
      for (const beat of tries) {
        if (placed) break;
        /**
         * Whether a hand is free *then*, rather than free since it last moved.
         *
         * `board.canReach` is the wrong question here and answering it cost
         * three quarters of these gestures. It compares a candidate beat with
         * that limb's most recent placement, which is exactly right while a
         * part is being written forwards — and this runs *after* the whole part
         * is on the schedule, so the most recent placement is the last note of
         * the number and every candidate beat looks like the past. It could
         * only ever have placed a gesture after the final note.
         *
         * So the window is checked against the gestures themselves. A limb is
         * busy from `beat - prep` to `beat + release`; a panel touch needs its
         * own such window clear.
         *
         * What is still lost, measured across twenty machine numbers: two, and
         * both are the same case. Their figure begins on beat 0, so the walk
         * backwards has nowhere to walk to — every candidate is filtered off
         * the front of the number — and the player's own part begins on that
         * downbeat with both hands. Narrowing the window does not help; there
         * is one beat to try and it is occupied. The fix is a start *before*
         * the number, which is a decision about where a number begins rather
         * than about this loop.
         */
        const free = (hand: Hand): boolean => !board.gestures.some((g) => (
          g.effector === hand
          && beat + PANEL_RELEASE > g.beat - g.prep
          && beat - PANEL_PREP < g.beat + g.release
        ));
        const hand: Hand = free('left-hand') ? 'left-hand'
          : free('right-hand') ? 'right-hand' : 'left-hand';
        if (!free(hand)) continue;
        placed = true;
        board.place({
          effector: hand,
          beat,
          kind: 'press',
          travel: 0.5,
          force: 0.45,
          sustainBeats: 0.5,
          targets: [{ kind: 'control', at: moment.at, machine: index }],
        });
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

/**
 * Two sticks, two pedals, and a scheduling problem.
 *
 * The sticking is not chosen from a table, because the interesting case is
 * exactly the one a table cannot express: a drummer keeping time on the hat with
 * the right hand and the backbeat with the left has to give the hat up when the
 * right hand crosses to the toms for a fill, and take it back afterwards. So the
 * hands start where a drummer's hands start — right on whatever this song's
 * timekeeper is, left on the snare — and every stroke afterwards goes to the
 * nearest stick that can physically get there.
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

  const hands: Record<'left-hand' | 'right-hand', DrumVoice> = {
    'left-hand': 'sd',
    'right-hand': timekeeperOf(events),
  };

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

  for (const beat of beats) {
    // Loudest first: when two strokes compete for one stick, the accent should
    // get the hand that is already near it and the ghost note should be the one
    // that travels.
    const here = slots.get(beat)!.slice().sort((a, b) => b.velocity - a.velocity);

    for (const e of here.filter((x) => x.voice === 'bd')) {
      board.place({
        effector: 'right-foot', beat, kind: 'strike', travel: 0,
        force: e.velocity, targets: [{ kind: 'pedal', which: 'kick' }],
      });
    }

    let stickable = here.filter((x) => x.voice !== 'bd');

    // More voices than sticks. A closed hat is the one that can be handed to a
    // foot without lying about the sound; an *open* hat cannot, because the
    // pedal being down is what makes a hat closed, so an open hat is always
    // somebody's stick.
    let chicked = false;
    while (stickable.length > 2 && stickable.some((x) => x.voice === 'hh')) {
      const i = stickable.map((x) => x.voice).lastIndexOf('hh');
      const [hat] = stickable.splice(i, 1);
      board.place({
        effector: 'left-foot', beat, kind: 'strike', travel: 0,
        force: hat!.velocity, targets: [{ kind: 'pedal', which: 'hat', shut: true }],
      });
      chicked = true;
    }

    // The foot, when it is not making a sound with the pedal but is still the
    // reason there is one. A chick is already that press and does not want a
    // second gesture arguing with it for the limb on the same beat; anything
    // else that says something about the hats moves the leg iff the state it
    // asks for is not the state the leg is already holding.
    if (chicked) hatShut = true;
    else {
      const asks = here.some((x) => x.voice === 'oh') ? false
        : here.some((x) => x.voice === 'hh') ? true
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

    // Two sticks, assigned as a pair rather than one at a time: with two strokes
    // to place, the total travel of the better pairing is frequently smaller
    // than what greedy-per-note produces, and the difference is the crossover.
    const primary = stickable.slice(0, 2);
    const [first, second] = primary;
    let assignment: [Effector, DrumEvent][] = [];
    if (first && second) {
      const straight = kitDistance(hands['left-hand'], first.voice)
        + kitDistance(hands['right-hand'], second.voice);
      const crossed = kitDistance(hands['left-hand'], second.voice)
        + kitDistance(hands['right-hand'], first.voice);
      assignment = straight <= crossed
        ? [['left-hand', first], ['right-hand', second]]
        : [['left-hand', second], ['right-hand', first]];
    } else if (first) {
      const left = kitDistance(hands['left-hand'], first.voice);
      const right = kitDistance(hands['right-hand'], first.voice);
      const leftFree = board.canReach('left-hand', beat, left, 'strike');
      const rightFree = board.canReach('right-hand', beat, right, 'strike');
      // Proximity picks the stick; reachability overrules it. This is the only
      // place the two disagree, and when they do it is because the near hand is
      // still coming back from somewhere else — which is precisely the case the
      // "cannot be in two places at once" rule exists for.
      const useLeft = leftFree === rightFree ? left <= right : leftFree;
      assignment = [[useLeft ? 'left-hand' : 'right-hand', first]];
    }

    for (const [effector, e] of assignment) {
      const hand = effector as 'left-hand' | 'right-hand';
      board.place({
        effector, beat, kind: 'strike',
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
    for (const e of stickable.slice(2)) {
      const hand: 'left-hand' | 'right-hand'
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
 * The fallback exists because a `PlayPoint` must always resolve: a sitar's
 * lowest string is a C3 and its declared range starts a minor third below, so a
 * note can be inside the range, folded into the octave, and still off the end of
 * every string. It gets the nearest string with the fret clamped, which is a
 * finger in a plausible place rather than a hand in mid-air.
 */
function chooseStops(
  midis: Midi[], open: Midi[], maxFret: number, reach: [Midi, Midi], anchor: number,
): { string: number; fret: number }[] {
  // A harp, whose strings are one per note and are addressed by pitch.
  if (!open.length) {
    return midis.map((m) => ({ string: m - reach[0], fret: 0 }));
  }
  const used = new Set<number>();
  const out: { string: number; fret: number }[] = [];
  for (const midi of midis) {
    let best: { string: number; fret: number } | undefined;
    let bestCost = Infinity;
    for (let s = 0; s < open.length; s++) {
      if (used.has(s)) continue;
      const fret = midi - open[s]!;
      if (fret < 0 || fret > maxFret) continue;
      // Staying in position is the whole cost; the mild bias toward lower
      // strings is what stacks a chord upward instead of piling it onto the top
      // two wires.
      const cost = Math.abs(fret - anchor) + s * 0.05;
      if (cost < bestCost) { bestCost = cost; best = { string: s, fret }; }
    }
    if (!best) {
      // Nothing in reach on a free string. Take the nearest string that is
      // still free and clamp the finger onto the neck: the note is a semitone
      // or two out of where it would really be, which nobody can see, and the
      // alternative is two fingers on one wire, which everybody can. Only a
      // chord with more notes than the instrument has strings — a four-part
      // voicing handed to a violin standing in for a whole section — doubles up,
      // and then the doubling is the section rather than the player.
      let nearest = -1;
      for (let s = 0; s < open.length; s++) {
        if (used.has(s)) continue;
        if (nearest < 0 || Math.abs(midi - open[s]!) < Math.abs(midi - open[nearest]!)) nearest = s;
      }
      if (nearest < 0) {
        for (let s = 0; s < open.length; s++) {
          if (nearest < 0 || Math.abs(midi - open[s]!) < Math.abs(midi - open[nearest]!)) nearest = s;
        }
      }
      best = { string: nearest, fret: Math.max(0, Math.min(maxFret, midi - open[nearest]!)) };
    }
    used.add(best.string);
    out.push(best);
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
