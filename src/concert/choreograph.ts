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
import { instrumentIdForTrack, rangeForTrack, specFor } from './instruments.js';
import type {
  Archetype, ArchetypeSpec, Cast, Choreography, Effector, Gesture, GestureKind,
  Performer, PerformerPart, PlayPoint,
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
      gestures: gesturesFor(song, performer),
    };
  }
  return { parts };
}

function gesturesFor(song: Song, performer: Performer): Gesture[] {
  const spec = specFor(performer.archetype);
  // Deterministic from the song and the performer, so the same seed gives the
  // same show and adding a player cannot reshuffle anyone else's timing.
  const rng = new Rng(`${song.meta.seed}:choreo:${performer.id}`);
  const board = new Board(song.meta.bpm, rng.float(0.9, 1.12));

  if (performer.archetype === 'drumkit' || performer.layer === 'drums') {
    drumPart(song.drums.events, board);
  } else {
    const track = trackFor(song, performer);
    if (track) {
      const notes = track.notes.slice().sort((a, b) => a.beat - b.beat || a.midi - b.midi);
      playPart(notes, track, performer, spec, board);
    }
  }

  // Sorted by beat, as `PerformerPart` promises. `Array.prototype.sort` is
  // stable, so gestures placed together in one motion keep the order they were
  // emitted in and the output is byte-identical run to run.
  return board.gestures.sort((a, b) => a.beat - b.beat);
}

/**
 * Which track this performer is playing.
 *
 * By layer, which is what `Performer.layer` means, and by instrument name where
 * a layer somehow carries more than one track — the Song IR does not forbid it
 * and a silent performer would be a worse failure than a guess.
 */
function trackFor(song: Song, performer: Performer): Track | undefined {
  const candidates = song.tracks.filter((t) => t.layer === performer.layer);
  if (candidates.length <= 1) return candidates[0];
  return candidates.find((t) => t.instrument === performer.instrument) ?? candidates[0];
}

function playPart(
  notes: NoteEvent[], track: Track, performer: Performer, spec: ArchetypeSpec, board: Board,
): void {
  const groups = groupByBeat(notes);
  const reach = reachFor(spec, track);
  switch (performer.archetype) {
    case 'accordion':
      keyboardPart(groups, spec, reach, board, { kind: 'press', split: ACCORDION_BUTTON_TOP });
      bellowsPart(groups, board);
      return;
    case 'mallets':
      keyboardPart(groups, spec, reach, board, { kind: 'strike' });
      return;
    case 'organ':
      keyboardPart(groups, spec, reach, board, { kind: 'press', pedalboardTop: ORGAN_MANUAL_BOTTOM });
      return;
    case 'grand-piano':
    case 'electric-piano':
    case 'synth':
      keyboardPart(groups, spec, reach, board, { kind: 'press' });
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
    while (stickable.length > 2 && stickable.some((x) => x.voice === 'hh')) {
      const i = stickable.map((x) => x.voice).lastIndexOf('hh');
      const [hat] = stickable.splice(i, 1);
      board.place({
        effector: 'left-foot', beat, kind: 'strike', travel: 0,
        force: hat!.velocity, targets: [{ kind: 'pedal', which: 'hat' }],
      });
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
}

/**
 * Two hands over a line of pitch.
 *
 * The interesting case is a chord, and the rule is the one a pianist would
 * describe: if the voicing fits under one hand, one hand takes it; if it does
 * not, it is split at its widest interval and the halves go low-to-left,
 * high-to-right. Measured across all three genres the median voicing this
 * generator writes spans nine semitones and the widest spans twenty-three, so
 * both branches are live and neither is an edge case.
 *
 * Splitting *at the widest interval* rather than in the middle matters: a
 * rootless voicing with the bass an octave below and three close notes on top is
 * one note in the left hand and a grab in the right, which is how it is actually
 * played. Splitting by count would put the hands in two impossible positions.
 */
function keyboardPart(
  groups: NoteEvent[][], spec: ArchetypeSpec, reach: [Midi, Midi],
  board: Board, opts: KeyboardOptions,
): void {
  const span = handSpanSemitones(spec.id);
  // Hands start a third and two thirds of the way up, which is where they sit
  // on a keyboard nobody is playing yet.
  const at: Record<'left-hand' | 'right-hand', number> = { 'left-hand': 0.35, 'right-hand': 0.6 };
  let footAt = 0.05;

  const point = (midi: Midi): PlayPoint => (opts.asString
    ? { kind: 'string', string: midi - reach[0], fret: 0 }
    : { kind: 'key', midi });

  for (const group of groups) {
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
          force, sustainBeats: sustain, targets: feet.map(point),
        });
        footAt = where;
      }
    }
    if (!midis.length) continue;

    let clusters: [Midi[], Midi[]];
    if (opts.split !== undefined) {
      // The accordion is not split by proximity: the left hand is on bass and
      // chord buttons and the right hand is on a keyboard, and they are separate
      // instruments that happen to share a box.
      clusters = [midis.filter((m) => m < opts.split!), midis.filter((m) => m >= opts.split!)];
    } else if (midis.length === 1 || (midis[midis.length - 1]! - midis[0]!) <= span) {
      clusters = [[], []];
      const where = whereInRange(mean(midis), reach);
      const hand = chooseHand(board, beat, where, at, opts.kind);
      clusters[hand === 'left-hand' ? 0 : 1] = midis;
    } else {
      const cut = widestGap(midis);
      clusters = [midis.slice(0, cut), midis.slice(cut)];
    }

    const hands: ['left-hand', 'right-hand'] = ['left-hand', 'right-hand'];
    for (let i = 0; i < 2; i++) {
      const cluster = clusters[i]!;
      if (!cluster.length) continue;
      const hand = hands[i]!;
      const where = whereInRange(mean(cluster), reach);
      board.place({
        effector: hand, beat, kind: opts.kind, travel: Math.abs(where - at[hand]),
        force, sustainBeats: sustain, targets: cluster.map(point),
      });
      at[hand] = where;
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
  at: Record<'left-hand' | 'right-hand', number>, kind: GestureKind,
): 'left-hand' | 'right-hand' {
  const cost = (hand: 'left-hand' | 'right-hand'): number => {
    const travel = Math.abs(where - at[hand]);
    const crosses = hand === 'left-hand' ? where > at['right-hand'] : where < at['left-hand'];
    return travel
      + (crosses ? 0.25 : 0)
      + (board.canReach(hand, beat, travel, kind) ? 0 : 1);
  };
  return cost('left-hand') <= cost('right-hand') ? 'left-hand' : 'right-hand';
}

/**
 * Bellows, which are the accordion's breath and the only thing on stage that
 * moves continuously without making a note of its own.
 *
 * One squeeze per phrase, alternating direction, on the body rather than on a
 * hand — the left hand is on the buttons and it is the whole left *arm* that
 * opens the box. `PlayPoint` carries the direction, which is a small piece of
 * luck: the bow, which needs exactly the same thing, has nowhere to put it.
 */
function bellowsPart(groups: NoteEvent[][], board: Board): void {
  let open = true;
  let lastEnd = -Infinity;
  let lastChange = -Infinity;
  for (const group of groups) {
    const beat = quantise(group[0]!.beat);
    // A phrase join, or two bars of one direction — whichever comes first. The
    // arm is long but it is not infinite, and a box that opens for a whole
    // number and never closes is the one thing an audience would notice.
    if (beat - lastEnd > 1 || beat - lastChange > 8) {
      board.place({
        effector: 'body', beat, kind: 'squeeze', travel: 0,
        force: Math.max(...group.map((n) => n.velocity)),
        sustainBeats: 2, targets: [{ kind: 'bellows', open }],
      });
      open = !open;
      lastChange = beat;
    }
    lastEnd = beat + Math.max(...group.map((n) => n.duration));
  }
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

  for (const group of groups) {
    const beat = quantise(group[0]!.beat);
    const sustain = Math.max(...group.map((n) => n.duration));
    const force = Math.max(...group.map((n) => n.velocity));
    const midis = group.map((n) => foldIntoReach(n.midi, reach)).sort((a, b) => a - b);
    const stops = chooseStops(midis, open, maxFret, reach, fretAt);
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
 * Where to put the fingers.
 *
 * Ascending, one string each — a chord cannot use a string twice — choosing the
 * fingering that keeps the hand where it already is. That is the actual decision
 * a player makes and it is why a bass line stays in one position instead of
 * lurching up the neck for every note that happens to be available higher.
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
