/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The animation runtime — the thing that turns the Performance IR into limbs.
 *
 * Everything above this file is data. `Choreography` says a stick hits the
 * high tom on beat 14.75 and starts moving 0.31 beats earlier; the drum-kit
 * model says where the high tom is; the rig says "put a hand there". This file
 * is the only place all three meet, and it is the only place that knows what
 * time it is.
 *
 * ## Six rules, and the reason each exists
 *
 *  1. **Read ahead, never react.** A limb that starts moving on the beat
 *     arrives after it, and a band that arrives after the beat looks like it is
 *     miming to a recording. Every frame asks "which gestures' windows contain
 *     now" and places the effector along an arc that is *at the target exactly
 *     on `Gesture.beat`*. The clock is never sampled here — `beat` is handed in,
 *     once per frame, by the caller.
 *
 *  2. **Three layers, in priority order: play, groove, idle.** A note gesture
 *     wins over a groove behaviour, which wins over idle. Groove is additive on
 *     the channels the rig separates for us (`setSway`, `setHeadNod`) and
 *     yields on the channels it shares with play (a tapping foot stops tapping
 *     when it is on a pedal). Idle is mostly the *absence* of a command.
 *
 *  3. **`react` fires once, on the beat.** Not every frame in the window, and
 *     not twice when a frame runs long. The fire cursor only ever moves
 *     forward, so a 250 ms frame fires four gestures in beat order rather than
 *     dropping three of them. Once per *place struck*, rather than once per
 *     gesture — a note on a string instrument is two gestures at one point —
 *     and the one that survives is the gesture that made the sound.
 *
 *  4. **Nothing is allocated per frame.** `InstrumentModel.resolve` is pure and
 *     time-invariant by contract, so every contact is resolved once, on the
 *     frame its gesture first becomes active, and cached in the model's own
 *     local frame — which is also the frame `Contact.position` is expressed in.
 *     Per frame the runtime does a matrix multiply per contact and nothing else.
 *
 *  5. **No position is ever remembered in world space.** Not the contacts, and
 *     — the part that was wrong — not the *bookkeeping* either: where a limb was
 *     last put, where an idle drift started, where a windup is anchored. All of
 *     it lives in the model's local frame and is transformed on read.
 *
 *     This is the bug the bassist made visible. A carried instrument is
 *     parented to the player's torso, so it sways with them; the contacts rode
 *     that correctly, but `last` and `idleFrom` were world points frozen at the
 *     moment they were captured. Between two bass notes the hands sat where the
 *     bass *had been* while the bass and the player swayed out from under them.
 *     Anything cached across a frame boundary now goes through `toLocal` on the
 *     way in and `toWorld` on the way out, and for a floor-standing instrument
 *     both are the identity, so nothing pays for it.
 *
 *  6. **No `Math.random`.** Everything that wants a little human scatter — the
 *     groove's drift, the per-limb arc jitter that stops two hands moving in
 *     lockstep, the stroke-to-stroke variation that stops one hand playing the
 *     same arc twice — draws from `new Rng(performer.id + tag)`, so two shows
 *     from one seed animate identically down to the frame.
 *
 * ## The seam this file does *not* cross
 *
 * It makes no decision the IR could have made. Which limb plays a note, when it
 * starts moving, how hard, how long the follow-through is and what the body is
 * feeling all arrive as data. What is decided here is exactly the set of things
 * the IR deliberately refuses to carry: the *shape* of the arc, the easing, the
 * lerp between two stepped groove spans, and the bow's stroke direction — which
 * the contract hands over by name, because the renderer has to hold that state
 * either way and a second source of truth would be worse.
 */

import { Box3, Euler, Matrix4, Quaternion, Vector3 } from 'three';

import { soundingEffectors } from '../../concert/choreograph.js';
import { ARCHETYPES } from '../../concert/instruments.js';
import type {
  Archetype, ConcertNumber, Effector, Gesture, GestureKind, GrooveBehaviour,
  PlayPoint, Span, Viseme,
} from '../../concert/types.js';
import { Rng } from '../../core/rng.js';

import {
  apexOf, bounce, clamp01, coverOf, hop, liftCeiling, reach, smooth, snapOf,
} from './animate-arc.js';
import type { InstrumentModel } from './instruments/types.js';
import {
  DEFAULT_HAND_POSES, type BodySide, type HandPoseId, type PerformerRig,
} from './performer.js';

// ---------------------------------------------------------------------------
// The public surface
// ---------------------------------------------------------------------------

export interface Animator {
  /**
   * Bind to a number that is about to play. Idempotent: calling it again
   * replaces everything, so a struck number leaves nothing behind.
   *
   * `rigs` and `models` are keyed by `Performer.id`. A performer with no rig is
   * skipped entirely; a performer with a rig but no model still grooves, still
   * breathes and still idles — they simply have nowhere to put their hands.
   */
  begin(
    number: ConcertNumber,
    rigs: Map<string, PerformerRig>,
    models: Map<string, InstrumentModel>,
  ): void;

  /**
   * One call per frame, and the only one.
   *
   * `beat` is the song position from the one clock, sampled once by the caller
   * and passed to every system. `dt` is the frame delta in **seconds** and is
   * clamped internally, so a backgrounded tab cannot teleport a limb.
   *
   * By default this also calls `InstrumentModel.update` and `PerformerRig.update`
   * for every bound performer — see `AnimatorOptions.driveRigs`.
   */
  update(beat: number, dt: number): void;

  /**
   * Whether this player is still playing. A tomato stops them: no note
   * gestures, the groove drops toward nothing over about a second, and the
   * hands go idle where they are. `PerformerRig.setPlaying` is driven from
   * here too, so effort and breathing follow.
   *
   * Unknown ids are ignored, so the tomato system does not have to know who is
   * bound.
   */
  setPlaying(performerId: string, playing: boolean): void;

  /**
   * The number is about to start. Take up playing position.
   *
   * Until this is called the band stands at ease — hands by their sides, horns
   * down — however much of the gesture list is nominally live. That is not an
   * animation state so much as an admission about what `begin` means: `begin`
   * happens behind a closed curtain, during two awaited promises, at a point
   * where nobody can see the stage and the transport has not started. A band
   * that took up position there has already done the one thing worth watching
   * before the audience arrives.
   *
   * So the show runner says when. The natural moment is the reveal: the tabs
   * are travelling, the band is standing there, and the band picking their
   * instruments up is the thing worth watching.
   *
   * Who comes up is the number's own answer, not this call's: whoever is in at
   * the top takes their instrument up on the cue, and anybody whose first entry
   * is further off than `OPENING_ENTRY_SECONDS` waits at ease for it. A cue is
   * for the people who are about to play.
   *
   * `leaderPerformerId` names whoever is giving the count, and turns this from
   * a state change into a *cue*: that player beats time until their own first
   * note and the rest of the band watches them, which is what a band waiting to
   * come in actually does. Omit it and the band simply comes up.
   *
   * Idempotent, and **not** undone by `begin`: a player revoiced mid-number
   * after a tomato re-binds every player, and dropping the whole band's hands
   * in answer to that would be worse than the bug this fixes. `end` is what
   * puts the band back at ease.
   */
  cue(leaderPerformerId?: string): void;

  /**
   * The count is over: the piece proper has begun.
   *
   * Ends the leader's count and hands the engagement want back to the gesture
   * list, which is the only thing that should be deciding it once there is
   * music. Both halves matter: a leader still beating time under the second
   * verse is a man with a tic, and the opening is the one moment the gesture
   * list cannot decide for itself — there is no clock behind it to ask.
   *
   * It also closes the reveal. Whoever waited the count out at ease comes up
   * for their entry at the working speed rather than at the slow one the
   * opening shot is worth. See `OPEN_RISE_SECONDS`.
   *
   * Idempotent, and safe before `cue` — it only ever clears.
   */
  downbeat(): void;

  /** Struck. Drops every reference; safe to call twice. */
  end(): void;
}

export interface AnimatorOptions {
  /**
   * Whether `update` also drives `PerformerRig.update` and
   * `InstrumentModel.update`. Default `true`.
   *
   * The rig has to be updated *after* the frame's `setEffector` calls, and this
   * file is the thing making them, so owning the call is the arrangement with
   * the fewest ways to go wrong. Turn it off only if the show runner wants to
   * drive the rigs itself in states where no number is playing — and then it
   * must drive them in *every* state, because calling `rig.update` twice in one
   * frame advances breath and blink at double rate and eases every idle limb
   * home twice as fast.
   *
   * `PerformerRig.update` wants monotonic **seconds**; this accumulates them
   * from `dt` rather than deriving them from `beat`, because the transport
   * wraps `beat` at the end of a number and a rig whose clock goes backwards
   * stops blinking.
   */
  driveRigs?: boolean;
}

export function createAnimator(options: AnimatorOptions = {}): Animator {
  return new Runtime(options.driveRigs !== false);
}

// ---------------------------------------------------------------------------
// Tuning. Everything the IR refuses to carry, in one table each.
// ---------------------------------------------------------------------------

/**
 * How far an effector lifts off the surface during its windup, in metres:
 * `base + byForce × force + byTravel × travel`, along `Contact.normal`.
 *
 * Along the normal is the whole trick. The prep of a snare stroke is a stick
 * going *up*; the prep of a fretting hand is a finger coming in from the side;
 * the prep of a trombone slide is nothing at all. One formula serves all three
 * because the model already said which way "away from the instrument" is.
 *
 * The ratios are what matter. A crash lifts about four times as far as a ghost
 * note, which is the difference the plan asks the prep numbers to preserve.
 *
 * What this table cannot say is how much *time* there is, and that turns out to
 * matter more than any of these numbers: a sixteenth-note hat pattern and a
 * crash both want a lift and only one of them can have it. `liftCeiling` caps
 * every result by what the limb could actually fall back down in the beats the
 * gesture has, so the ceiling — not the table — is what keeps the sticks low in
 * a fast passage.
 */
const LIFT: Record<GestureKind, readonly [base: number, byForce: number, byTravel: number]> = {
  strike: [0.035, 0.075, 0.150],
  pluck: [0.010, 0.018, 0.050],
  press: [0.009, 0.014, 0.040],
  // A bow does not leave the string, and a stroke that hopped would be a
  // spiccato nobody wrote.
  bow: [0.003, 0.004, 0.000],
  blow: [0, 0, 0],
  squeeze: [0, 0, 0],
  hold: [0.004, 0.000, 0.020],
  breathe: [0, 0, 0],
  sway: [0, 0, 0],
};

/** Follow-through height, as a fraction of the windup's lift. */
const REBOUND: Record<GestureKind, number> = {
  strike: 0.62, // a stick bounces, and it bounces higher off a hard hit
  pluck: 0.45,
  press: 0.16, // a finger leaves a key; it does not leap off it
  bow: 0.25,
  blow: 0,
  squeeze: 0,
  hold: 0.20,
  breathe: 0,
  sway: 0,
};

/**
 * Kinds where the effector stays engaged for the length of the note.
 *
 * The same set `choreograph.ts` calls `SUSTAINS`, and it has to be the same
 * set: over there it decides that `release` carries the note's duration, and
 * here it decides that the release is a *hold* rather than a bounce. A finger
 * on a key does not rebound for four beats.
 */
const SUSTAINS: ReadonlySet<GestureKind> = new Set<GestureKind>([
  'press', 'bow', 'blow', 'hold', 'squeeze',
]);

/**
 * The effectors that are a hand. Used where "which limb" matters and "which
 * part" does not — a bow is a right hand holding something, and for the purpose
 * of remembering what a hand last played it is one.
 */
const HANDED: ReadonlySet<Effector> = new Set<Effector>([
  'left-hand', 'right-hand', 'bow',
]);

/** How much of a sustained release is spent still on the note. */
const SUSTAIN_HOLD = 0.65;

/** Ceiling on the travel term, in metres. Nothing crosses more than this. */
const MAX_TRAVEL = 0.6;

/**
 * The bow stroke, as a position along the hair rather than as a per-note nudge.
 *
 * `BOW_TRAVEL` is how far from the middle of the stroke the hand may get, so a
 * full bow is twice it; `BOW_SPEED` is how fast it gets there, in metres of
 * hand travel per beat at full force; `BOW_MIN_STROKE` is the least any one
 * note may use. **All three are duplicated in `violin.ts` and `cello.ts` and
 * all three have to agree**, because the models own the bow and this file owns
 * the hand that is holding it. The dependency runs the wrong way to import them
 * — `animate.ts` imports the models — and three numbers is the price of not
 * closing that cycle.
 *
 * ## Which way the hand goes
 *
 * **Down the stick**, which is `Contact.along` on a bow contact, and not along
 * the player's own lateral axis, which is what this used to be. On a cello the
 * two are 13° apart and it hardly mattered; on a violin they are 61° apart, so
 * more than half of every stroke went into skewing the bow across the string
 * instead of drawing it along, and the visible answer to "does the bow move" was
 * no. The models publish the axis because the rig wants it anyway — a bow hold
 * spaces the fingers down the stick — so this costs nothing and it means a bow
 * pointing anywhere at all is drawn correctly.
 *
 * ## Why a position and not a nudge
 *
 * This used to be `stroke × BOW_TRAVEL × smooth(tau / release)`: zero on the
 * beat, out to the full travel by the end of the note, and back to zero on the
 * next one. Which is not a bow stroke. It is a bow *twitch*, repeated once per
 * note, and it got worse the better the line was: `stringPart` marks a legato
 * run as `hold` — one bow, several notes, which is what a slur is — and every
 * one of those notes reset the travel to zero and dragged the hand back through
 * the middle of the hair before setting off again. The models did the same
 * thing with `lean = 0` in their own `react`, so the bow and the hand at least
 * agreed on the beat; in between the model snapped the bow home instantly while
 * the runtime eased the hand there over the next windup, and for that windup
 * the frog was not under the hand at all.
 *
 * So the stroke is a *position* now, carried across notes and never reset. A
 * note moves it `BOW_SPEED × span` further in whatever direction the stroke is
 * going and a `bow` reverses that direction first, so a slur is several notes
 * continuing one way, a bow change is a sweep from one end back toward the
 * other, and there is no instant at which anything returns to the middle
 * because a note happened to end.
 *
 * The speed is set against what the choreographer allows: it forces a `bow`
 * after four beats under one stroke, so four beats at full force is exactly the
 * `2 × BOW_TRAVEL` from one end to the other and a semibreve draws the whole
 * bow across the whole note.
 *
 * ## The floor, and why running out is a turn
 *
 * `BOW_MIN_STROKE` is a quarter of the full travel. Below about that a stroke
 * stops reading as one — the arm moves and the bow appears not to — and a line
 * of quavers at a middling velocity comes in well under it on the speed alone.
 *
 * Which means a slurred run now reaches an end of the travel within a few
 * notes, so **running out of bow reverses the stroke instead of clamping it**.
 * Clamping was safe while a note moved three centimetres and could never get
 * there; with a floor it would have pinned the bow against its own limit and
 * left it motionless for the rest of the phrase, which is the exact fault the
 * floor exists to cure. A violinist who runs out of bow turns round mid-phrase.
 */
const BOW_TRAVEL = 0.170;
const BOW_SPEED = 0.085;
const BOW_MIN_STROKE = 0.085;
/**
 * Bounds on a stroke's span in beats, against a nonsense `release`.
 *
 * The ceiling is `MAX_SUSTAIN_BEATS` in `choreograph.ts` — the longest
 * follow-through anything is given, and so the longest note `BOW_SPEED` has to
 * fill a whole bow across.
 */
const BOW_SPAN_MIN = 0.15;
const BOW_SPAN_MAX = 4;

/**
 * How far a tapping foot lifts, in metres, at full amplitude.
 *
 * A tap is a small thing. At two centimetres it reads from the tenth row and
 * does not look like a march.
 */
const TAP_LIFT = 0.022;

/** How far a `lean` pushes the chest toward the phrase. The rig clamps at 0.22. */
const LEAN_REACH = 0.16;

/**
 * How much of a body gesture's travel across the instrument becomes lean.
 *
 * See `leanTo`. Half, so an accordion's bellows — the only body gesture anybody
 * emits, and 0.32 m of strap travel end to end — leans the player about eight
 * centimetres either side of the middle of its range, which is the same order
 * as the groove's own `lean` and reads as a torso working a box rather than a
 * torso being moved by one.
 */
const BODY_LEAN = 0.5;

/** Seconds an idle hand holds the last thing it played before drifting off. */
const IDLE_HOLD_SECONDS = 0.7;
/** Seconds it then takes to reach the instrument's own rest position. */
const IDLE_EASE_SECONDS = 0.9;

/** Seconds the groove takes to die away under a player who has stopped. */
const STOP_FADE_SECONDS = 0.9;

/**
 * How far the leader's head moves while counting the band in.
 *
 * Bigger than any groove nod in the score, and it has to be: this one is not
 * feeling the pulse, it is *giving* it to five other people across a stage.
 */
const COUNT_NOD = 0.55;

// ---------------------------------------------------------------------------
// At ease, and coming back up
// ---------------------------------------------------------------------------
//
// The third thing an idle layer has to know, after "where does this hand go"
// and "how does it get there": **whether the player is at their instrument at
// all**. Without it a horn player holds the mouthpiece to their lips through
// a thirty-two bar rest, a pianist's fingers hover over keys nobody is going
// to press for eight bars, and — worst of the three, because it is the first
// thing anybody sees — the whole band is already playing position before the
// count-in has finished, so the number has no beginning.
//
// One number per player carries all of it: `Player.engage`, 0 at ease and 1 at
// the instrument. It eases toward a want that the gesture list decides, and
// everything downstream reads it — the hands drift to the body's own idle, the
// wrists let go of the instrument's attitude, the shapes relax, and a carried
// instrument comes down off the face. The reverse of all four is the band
// picking their instruments up, which is why it is one number and not four
// systems: they have to happen together or it reads as four separate faults.

/**
 * Seconds to come up to the instrument, and seconds to come down off it.
 *
 * **Time constants, not durations.** An exponential is about 95 % of the way
 * there after three of them, so 0.30 here is a movement that takes the better
 * part of a second — which is what a hand going to a keyboard looks like, and
 * is the number these have to be read against.
 *
 * Deliberately asymmetric, and this is the pair to get right rather than the
 * thresholds. Coming up is a cue being taken: a player who is about to play
 * gets there briskly and *early*, because arriving late is the one failure an
 * audience reads as a mistake. Coming down is nobody's hurry.
 */
const ENGAGE_RISE_SECONDS = 0.30;
const ENGAGE_FALL_SECONDS = 0.85;

/**
 * Except the first raise of a number, which is slower, because it is the shot.
 *
 * A mid-piece raise is functional and wants to be over before the note it is
 * for. The opening raise is the reveal: the tabs are travelling, the band is
 * standing there, and the whole band picking their instruments up is the thing
 * worth watching. At the brisk constant it is finished before the curtain has
 * cleared its first tenth and nobody sees it happen at all.
 *
 * Bounded above by the count-in rather than by taste. That gap is Strudel
 * scheduling to a cycle boundary, so it is at most one bar and often less;
 * 0.55 puts the band in position inside 1.7 s, which fits inside a bar at
 * anything above about 90 BPM and still reads as a lift rather than a snap.
 * The earlier value of 1.20 was chosen as if it were a duration and left the
 * band four fifths of the way up when the music started.
 */
const OPEN_RISE_SECONDS = 0.55;

/**
 * How far ahead of a note the want turns on, in seconds.
 *
 * This is the "bring the instrument up first" lead, and it has to be several
 * rise constants long or the raise is still finishing as the note lands. At
 * 1.1 s against a 0.30 s rise the hand is 97 % of the way there when the
 * gesture's own windup starts, so the windup anchors from playing position and
 * the arc is the one the choreographer wrote rather than a scramble.
 */
const ENGAGE_LEAD_SECONDS = 1.10;

/** How long after the last note the player stays at the instrument. */
const ENGAGE_HOLD_SECONDS = 0.90;

/**
 * The shortest pause worth leaving the instrument for, in seconds.
 *
 * A rest is not a break. Two bars off at a ballad tempo is a player waiting,
 * not a player standing down, and a band that drops its hands into every gap
 * in the arrangement looks like it keeps losing interest. Measured on the
 * whole pause rather than on either end of it, so the decision is made once
 * for the gap instead of half-made twice.
 */
const ENGAGE_GAP_SECONDS = 4.0;

/**
 * How far into a number a first entry can be and still be part of the opening.
 *
 * The cue raises the band, but not all of it: the people who *start the number*
 * take their instruments up and everybody else stays at ease and comes up for
 * their own entry. Which is what a band does, and it is also the only way the
 * entries read as entries — a horn section that came up on the cue and then
 * stood at the ready through a sixteen-bar intro has spent its entrance before
 * it happened.
 *
 * Deliberately the same figure as `ENGAGE_GAP_SECONDS`, for the same reason:
 * that constant says the shortest pause worth standing down for, and this is
 * the same question asked at the front of the number. Anything shorter would
 * leave a player at ease through the count and then bring them straight back up
 * a beat into the music, which is the half-measure both constants exist to
 * prevent. Measured from the first downbeat of the music proper rather than
 * from the cue, because the runway between the two is the show runner's and
 * varies with the curtain.
 */
const OPENING_ENTRY_SECONDS = 4.0;

/**
 * Where a carried instrument goes when its player stands down.
 *
 * Angles are in the *torso's* frame — the one frame that means the same thing
 * for every model, since a trumpet, a violin and a Telecaster do not agree
 * about which way their own local axes point and do agree about which way is
 * down. `pitch` is about the player's lateral axis, so a bell swings down;
 * `roll` is about their forward axis, so an instrument held across the body
 * tips and hangs; `turn` is about their up axis. `drop` and `back` then move
 * the whole thing, in metres.
 *
 * All three are needed or none are. Two angles reach only a surface of
 * orientations, and which surface depends on where the instrument started — for
 * anything lowered straight down the front of the body that is plenty, and for
 * the one instrument that starts on a shoulder it is not. See `violin` below,
 * where the missing axis was the difference between a violin hanging face-out
 * and the same violin hanging face-in.
 *
 * ## The pivot, which is the part that was wrong
 *
 * The rotation is about **the point the player holds the instrument by** —
 * `resolve({kind:'rest'})`, which is where the model says a hand goes. That is
 * not a refinement: rotating about the model's own origin instead put the
 * pivot on the boards, because `show.ts` stages a carried model with its
 * origin at floor level and only the geometry up at chest height. Pitching
 * 0.8 rad about a point a metre and a half below the horn threw a trumpet
 * **1.2 m downstage** — measured — so the band stood at ease with their
 * instruments hanging in the air out over the front row.
 *
 * ## Why a table and not a formula
 *
 * Because "at ease" is a different physical act per instrument and the picture
 * is the only judge. A trumpet comes down to the waist with the bell toward
 * the floor. A saxophone barely moves — it is on a neck strap, and all that
 * changes is that the mouthpiece leaves the lips. A violin comes off the chin
 * and hangs from the left hand by the hip, which is a roll rather than a
 * pitch. Anything carried on a strap and *not* here — a guitar, a bass, an
 * accordion — stays exactly where it hangs, because that is what those do.
 *
 * Every figure below was measured against the body it belongs to. The comments
 * give the resulting bounding box in the player's own frame, y from the
 * boards, for a mean-height cast member.
 */
interface AtEasePose {
  pitch: number;
  roll: number;
  /**
   * Yaw, about the player's up axis. Optional: it is the middle term of the
   * `ZYX` Euler below, which was written as a literal zero because nothing
   * needed it until an instrument had to be turned over rather than tipped.
   */
  turn?: number;
  drop: number;
  back: number;
  /**
   * How far it also moves along the player's lateral axis, positive to their
   * left. Optional, because only one instrument is not carried in front of the
   * body.
   *
   * `drop` and `back` are the whole motion for anything held at the chest and
   * lowered to the waist — a trumpet, a flute, a clarinet all come straight
   * down the front. A violin does not start there: it is up on the *left
   * shoulder*, so the hand holding its neck begins half a metre out from the
   * player's midline, and lowering it in `y` and `z` alone leaves that arm held
   * out to the side for the length of the rest. Coming down means coming in as
   * well, and there was no axis to say so in.
   */
  across?: number;
  /**
   * How far each hand lets go of the instrument, `[left, right]`: 0 stays on
   * it, 1 goes to the hip.
   *
   * The instrument coming down and the hands going to the hips were two
   * independent motions, and an instrument nobody is holding is what that looks
   * like — a flute floating down to the waist while both hands set off for the
   * pockets, arriving at neither the flute nor the body on the way. Something
   * has to be carrying it.
   *
   * So each pose says which hands stay. A clarinet, a flute and a saxophone are
   * held in *both* hands at rest, near enough where they play; a trumpet and a
   * trombone hang from the hand that was already taking their weight while the
   * other arm drops; a violin hangs from the left hand by its neck with the bow
   * arm down. The small non-zero values on the two-handed ones are the fingers
   * coming off the keys without the hands leaving the instrument.
   *
   * Anything not in this table is unchanged — both hands go to the hips, which
   * is right for a guitar or an accordion on a strap.
   */
  hands: readonly [number, number];
}

const AT_EASE: Partial<Record<Archetype, AtEasePose>> = {
  // Bell to the floor, held in front of the waist: y 0.90–1.40, z 0.17–0.41
  // against a chest front at 0.19. Was y 1.49–1.68 at the lips.
  // The left hand keeps the casing; the right comes off the valves.
  trumpet: { pitch: 1.35, roll: 0, drop: 0.42, back: 0.14, hands: [0.08, 0.75] },
  // Long, so it needs the room: bell down by the shin, slide up at the chest.
  // y 0.40–1.30. The left hand is the one holding it and always was.
  trombone: { pitch: 1.10, roll: 0, drop: 0.44, back: 0.06, hands: [0.08, 0.70] },
  // On its strap, and that is the whole point — it hangs where it hangs and
  // only comes off the face. Ten centimetres of daylight under the lips.
  saxophone: { pitch: 0.38, roll: 0, drop: 0.10, back: 0, hands: [0.18, 0.18] },
  // Straight down the front of the body, tight in: z 0.16–0.23.
  clarinet: { pitch: 0.55, roll: 0, drop: 0.22, back: 0.02, hands: [0.18, 0.18] },
  // Off the lip plate and down to the waist: y 1.06–1.28, from 1.57–1.69.
  flute: { pitch: 0.60, roll: 0, drop: 0.46, back: 0.02, hands: [0.20, 0.20] },
  // A harp weighs nothing and comes down in one hand, so this is mostly the
  // 42 cm from the lips to the waist: y ~1.49 to ~1.07 on a mean-height cast
  // member. The roll is the shape of that — the pivot is the left hand on the
  // low end, so the far end dips under it and the thing reads as *held* rather
  // than as a level object translated downward. Nothing at all was here
  // before, which for a `held` archetype means the harmonica hung at the lips
  // of a player whose hands had both gone to their hips.
  harmonica: { pitch: 0.20, roll: 0.50, drop: 0.42, back: 0.05, hands: [0.05, 0.85] },
  // Off the chin and hanging straight down by the left hip: y 0.55–1.15.
  //
  // ## Why three angles and why these three
  //
  // A violin at rest turns rather than tips: the pivot is the hand on the neck
  // and the body swings down under it, which is only true if that hand is still
  // on the neck — so it is the one that does not let go.
  //
  // Turning it *far enough* took the third axis. The instrument has to end up
  // with two things true at once, and with `turn` pinned at zero only the first
  // was reachable: the scroll points **up**, because the hand holds the neck
  // and the body is the heavy end, and the belly faces **out**, away from the
  // player. The second is not a detail about the pretty side of the wood. The
  // contact normal is the belly's, so it is also which side of the neck the
  // hand is on: face-in put the hand between the violin and the thigh with the
  // palm turned outward, which is an arm held in supination for the whole rest.
  // Face-out is the hand outboard, palm in, arm hanging.
  //
  // So the target is stated as a basis and the angles are solved for it, rather
  // than dialled in: the build frame's `+x` (bridge → nut) onto the player's
  // `+y`, its `+y` (out of the belly) onto the player's `+x`. That is a proper
  // rotation — the third axis falls out as the player's `−z` — and decomposing
  // `[ŷ x̂ −ẑ] · Mᵀ` in `ZYX` gives exactly the numbers below. The pitch is a
  // hair off 180°, which is the sense in which this pose is the old one turned
  // over.
  //
  // The three lengths are read against where that hand goes when it is holding
  // nothing at all, which is what `restPosition` answers and what the eye
  // compares it to: about (0.35, 0.93, 0.08) on a mean-height player. Dropping
  // 0.34 and nothing else left the grip at (0.52, 1.21, 0.39) — seventeen
  // centimetres out and thirty in front of a hanging arm, so the violinist
  // spent every rest holding the instrument out in front of them at chest
  // height. These put it at (0.38, 1.05, 0.14): hand by the waist, elbow bent,
  // body of the violin swinging beside the thigh. The lengths are unchanged by
  // the turn above: the rotation is about the grip, so it moves the instrument
  // around the hand without moving the hand.
  violin: {
    pitch: 2.83, turn: -0.48, roll: 1.82,
    drop: 0.48, back: 0.25, across: -0.14, hands: [0.0, 0.85],
  },
};

/**
 * A model whose bow is held rather than parked, and can therefore be handed to
 * the hand that holds it.
 *
 * Structural, like `HasSoundingContact` in `instruments/index.ts` and for the
 * same reason: two of the twenty-two models have a bow and `InstrumentModel`
 * should not grow a member the other twenty must ignore. See
 * `Animator.carryBow`.
 */
interface CarriesBow {
  carryBow(down: number, hand: Vector3): void;
}

/**
 * How far an at-ease hand may be pulled back to get out of the instrument.
 *
 * The body's own idle puts a standing player's hands a few centimetres in
 * front of their hips, which is where hands go and is *inside the key bed* for
 * anybody standing at a keyboard: measured, a synth player's right hand rests
 * 5 cm inside the model and an electric piano's left hand 8 cm. So an at-ease
 * hand backs up until it is clear of the thing it is standing at.
 *
 * Capped, and deliberately not a collision system. It resolves along one axis,
 * against one box, for players who are standing at something in front of them.
 * A seated pianist's hands land in their lap and a drummer's inside a cubic
 * metre of mostly air, and pulling either of those backwards would be worse
 * than the overlap — so neither is asked.
 */
const KEEP_OUT_PUSH = 0.18;
/** Clearance to leave once out, so a hand does not graze the case. */
const KEEP_OUT_MARGIN = 0.03;
/**
 * How far into the stand-down the escape reaches full strength.
 *
 * A hand that is still playing must never be pushed off what it is playing —
 * a contact sits on the surface and therefore inside the mesh's box — so the
 * correction ramps in rather than switching on. Short, because the first tenth
 * of a stand-down is also the last tenth of a note and neither wants to wait.
 */
const KEEP_OUT_GATE = 0.10;

/**
 * How close two idle answers have to be before the runtime decides the model
 * gave it one answer twice rather than two answers that happen to be near.
 *
 * Deliberately tiny. The condition being detected is not "these hands are
 * close", it is "this model ignored the `effector` parameter and built the same
 * contact twice", which comes back as the identical floats and a distance of
 * exactly zero. Four millimetres is slack for two separately constructed
 * vectors and nothing else.
 *
 * A larger threshold would be the more *helpful*-looking number and would be
 * wrong: an instrument whose two hands genuinely sit two centimetres apart has
 * an opinion, and overriding it puts a flautist's hands on the wrong sides of
 * the tube. Every string model has answered per hand since `withSoundingContact`
 * and every wind, brass and free-reed model now does too, so the set this
 * catches is exactly the models that never needed to choose — a drum is struck
 * where it is struck.
 */
const COINCIDENT = 0.004;

/**
 * How far a hand is pulled from the model's rest toward the part of the
 * instrument that hand actually plays, when the model gave one answer for both.
 *
 * This is the other half of "the drummer's hands are on top of each other", and
 * the half that makes the result look deliberate rather than merely
 * non-overlapping. A drum kit's `rest` is one point in front of the drummer;
 * pushing two hands apart from it puts them somewhere neither of them plays. But
 * the runtime already knows where each hand plays — it has been resolving that
 * hand's contacts all number — so the mean of them is available for free, and it
 * is exactly "over the part of it that hand plays": the left stick hovers over
 * the snare and hats, the right over the ride and toms.
 */
const ZONE_PULL = 0.75;

/** Contacts a hand must have resolved before its play zone is trusted. */
const ZONE_MIN = 3;

/**
 * How many contacts the zone mean is taken over before it starts forgetting.
 *
 * A running mean over everything would freeze on the intro; capping the count
 * turns it into an exponential mean, so a hand that moves to the ride for the
 * solo idles over the ride within a few bars.
 */
const ZONE_MEMORY = 48;

/** How far a hand hovers off a surface it plays but is not playing now, metres. */
const IDLE_HOVER = 0.05;

/**
 * How wide the thing under a hand has to be, in metres, before the hand is
 * stretched — and how narrow before it is one finger.
 *
 * Metres rather than semitones, because this layer measures the instrument
 * rather than the music: the distance is between two contacts a model resolved,
 * so a keyboard with narrower keys or a model built at a different scale is
 * answered correctly without anything here being told about it.
 *
 * The numbers are a piano's own. A white key is 23.5 mm, so an octave is seven
 * of them and `SPAN_REACH` is the stretch a hand makes for one — the point at
 * which a real hand has run out of hand. `SPAN_PRESS` is a whole tone, below
 * which two "notes" are one finger's width apart and the distinction stops
 * being about the hand at all.
 */
const SPAN_REACH = 0.155;
const SPAN_PRESS = 0.030;

/**
 * What a keyboard hand's span reads as when it has not played anything yet.
 *
 * `SPAN_PRESS` exactly, which is the seam between the two shapes and therefore
 * the one value that asks for neither: a hand starts the number in its
 * archetype's own `keys` pose and is moved off it by what it plays. Zero would
 * be the obvious initialiser and would put every pianist's hands in a
 * one-fingered poke before the downbeat.
 */
const SPAN_NEUTRAL = SPAN_PRESS;

/**
 * Seconds a hand takes to open across a chord or close onto a single note.
 *
 * Slower than `POSE_TAU` in the rig, which is the ease this feeds into: the two
 * compound, and the sum is meant to land near the tenth of a second a hand
 * really takes. Slower than the *note*, deliberately — a hand that snapped to
 * full stretch on the frame a chord landed would be reacting to it rather than
 * arriving with it, and the arrival is the whole point of a scheduled IR.
 */
const SPAN_TAU = 0.11;

/**
 * The most of a `press` a keyboard hand is ever asked for.
 *
 * A pianist playing a single-note line does lift the other fingers, and they do
 * not lift them all the way: the hand stays over the keys ready for the next
 * note. At 1.0 the shape reads as somebody pointing at a piano.
 */
const PRESS_MAX = 0.8;

/**
 * Seconds an idle hand takes to follow a step in its target.
 *
 * The drift home is already smooth; the *target* is not. A wind player's
 * fingering changes discretely from one note to the next — the trumpet model
 * builds a contact per fingering precisely so the hands can track the pitch —
 * and a hand that teleported between valve positions made a trumpeter look like
 * a slideshow. Short enough not to lag the drift measurably, long enough to
 * read as a finger moving.
 */
const IDLE_FOLLOW_SECONDS = 0.035;

/**
 * Seconds a wrist takes to turn from what the last stroke left it at to the
 * idle attitude.
 *
 * The play layer hands `Contact.normal` to the rig and the rig turns the palm
 * into the surface; idle used to hand it nothing at all, so the wrist snapped
 * back to its resting attitude on the frame the release ended. The position
 * crossfaded and the rotation did not, which is a tell nobody could name and
 * everybody could see.
 */
const NORMAL_EASE_SECONDS = 0.10;

/**
 * How much of the body's sway an idle hand rides, and over how long the
 * reference it is measured against forgets.
 *
 * A *commanded* limb goes exactly where it is put — the rig adds no sway to it,
 * deliberately, or a hand on a snare would slide off the snare. That is right
 * for a floor-standing instrument being played and wrong for the same
 * instrument's hands doing nothing: a drummer swaying with two perfectly
 * motionless hands is uncanny in a way a still frame will not show you.
 *
 * So an idle hand takes a share of the *difference* between the rig's live rest
 * and a slow average of it, which is the sway with the posture subtracted out.
 * Only for instruments the player does not carry: a saxophone already takes its
 * player's hands with it, and adding this on top would sway them twice.
 */
const IDLE_SWAY_FOLLOW = 0.45;
const SWAY_REFERENCE_SECONDS = 1.1;

/** How long the mouth takes to shut after a syllable. Matches `visemes.ts`. */
const MOUTH_CLOSE_SECONDS = 0.06;

/**
 * Default hand poses that mean "this hand is *holding* something".
 *
 * Named here rather than tested for by comparing against `'grip'`, which is
 * what this used to do and which was a trap: `DEFAULT_HAND_POSES` is the rig's
 * table and it grew four entries — `stick`, `bowhold`, `strap`, `press` — the
 * moment somebody improved the hands. A drummer moved from `grip` to `stick`
 * and the equality test silently started answering "no". The rig agent noticed
 * and deliberately left the violin and cello right hands on `grip` rather than
 * moving them to the more accurate `bowhold` so as not to break this file;
 * naming the whole category removes the reason for that favour, and a pose id
 * that stops existing is now a compile error rather than a shrug.
 *
 * What the category is *for* is `poses()`: only a hand that is holding
 * something has anything to learn from a gesture kind, because every other
 * default already describes the action about to happen.
 */
const HOLDING_POSES: ReadonlySet<HandPoseId> = new Set<HandPoseId>([
  'grip', 'stick', 'bowhold', 'strap', 'fist',
]);

// ---------------------------------------------------------------------------
// Effector bookkeeping
// ---------------------------------------------------------------------------

const EFFECTORS: readonly Effector[] = [
  'left-hand', 'right-hand', 'left-foot', 'right-foot', 'mouth', 'bow', 'body', 'head', 'eyes',
];
const N_EFF = EFFECTORS.length;

const SLOT_OF: Record<Effector, number> = {
  'left-hand': 0, 'right-hand': 1, 'left-foot': 2, 'right-foot': 3,
  mouth: 4, bow: 5, body: 6, head: 7, eyes: 8,
};

/**
 * Which physical part an effector moves.
 *
 * `bow` *is* the right hand and `mouth` *is* the head — the rig says so — so
 * "is this limb already busy" has to be asked of the part rather than of the
 * effector, or the idle layer quietly commands a right hand that is in the
 * middle of a bow stroke and the two fight at 60 Hz.
 */
const PART_OF: Record<Effector, number> = {
  'left-hand': 0, 'right-hand': 1, bow: 1,
  'left-foot': 2, 'right-foot': 3,
  mouth: 4, head: 4, eyes: 4,
  body: 5,
};
const N_PART = 6;

/** The order effectors are committed in. Later wins where two share a part. */
const COMMIT_ORDER: readonly Effector[] = [
  'left-hand', 'right-hand', 'bow', 'left-foot', 'right-foot', 'body', 'head', 'mouth',
];

const REST_POINT: PlayPoint = { kind: 'rest' };

/** Floats cached per gesture: position, surface normal, knuckle axis. */
const CONTACT_STRIDE = 9;

/** Distinct idle points cached per effector. Comfortably a wind fingering set. */
const IDLE_CACHE = 32;

/**
 * Floats per cached idle contact: position, normal, knuckle axis.
 *
 * The same nine as `CONTACT_STRIDE`, and it has to be the same nine. This
 * cached six for a while and dropped `Contact.along` on the floor, which for
 * the whole wind and brass family meant it was never used at all: a blown
 * instrument's sounding gestures are all on the `mouth`, so the hands have no
 * gestures and are placed *exclusively* through this path. Every saxophone in
 * every show had its fingers across the keys instead of along them, and no
 * amount of the model getting the axis right could have fixed it.
 */
const IDLE_STRIDE = 9;

// ---------------------------------------------------------------------------
// Scratch. Six players at 60 Hz is not the place to allocate a vector.
// ---------------------------------------------------------------------------

const V1 = new Vector3();
const V2 = new Vector3();
const V3 = new Vector3();
const V4 = new Vector3();
const V5 = new Vector3();
const V6 = new Vector3();
const V7 = new Vector3();
const V8 = new Vector3();
const Q1 = new Quaternion();
const Q2 = new Quaternion();
const E1 = new Euler();
/** `InstrumentModel.shift`'s answer, and its rotation, for this frame. */
const M1 = new Matrix4();

/** Points fired this beat, for the `react` de-duplication. */
const FIRED: (PlayPoint | undefined)[] = new Array<PlayPoint | undefined>(24).fill(undefined);

// ---------------------------------------------------------------------------
// Per-effector state
// ---------------------------------------------------------------------------

interface Slot {
  /** This frame's weighted accumulation, in world space. */
  px: number; py: number; pz: number;
  nx: number; ny: number; nz: number;
  ax: number; ay: number; az: number;
  weight: number;
  /**
   * The loudest single gesture's weight, as distinct from their sum.
   *
   * A chord is one motion and several gestures — `choreograph.ts` emits one per
   * target — so the sum reaches three on a triad and the "is this gesture
   * arriving or leaving" test never fired. Authority is the maximum; the sum is
   * only ever a divisor for the weighted mean of the positions.
   */
  top: number;
  /** Whether the play layer put anything here this frame. */
  played: boolean;
  /**
   * The first contact this effector took this frame, and the furthest anything
   * else got from it — the width of the chord under this hand, in metres.
   *
   * One reference point rather than a bounding box, and on a keyboard that is
   * exact rather than approximate: the gestures of one motion arrive in
   * ascending pitch order, so the first contact is an end of the cluster and the
   * furthest from it is the other end. On a kit, where a hand can be given two
   * surfaces at once, it is a lower bound — and a lower bound is the right
   * failure, because it under-opens a hand rather than splaying one that is
   * holding a stick.
   */
  spanRef: Vector3;
  spanMax: number;

  /** Where this effector was last commanded, in the model's local frame. */
  last: Vector3;
  hasLast: boolean;
  /**
   * The attitude it was last commanded with, eased toward the idle attitude.
   * Local, unit, or unset. `norm` is the surface normal and `along` the
   * knuckle axis — both, because a normal alone leaves the roll free and the
   * roll is exactly what puts a wind player's fingers across the keys instead
   * of on them.
   */
  norm: Vector3;
  hasNorm: boolean;
  along: Vector3;
  hasAlong: boolean;

  /** Where the idle drift started — local — and when, in beats. */
  idleFrom: Vector3;
  idleSince: number;
  idling: boolean;

  /** The slow average of the rig's own rest for this limb. World; see below. */
  swayRef: Vector3;
  hasSwayRef: boolean;

  /**
   * Idle contacts, cached by point *value*: the points, six floats each, and a
   * flag of 1 resolved or 2 the model does not know.
   *
   * More than one entry because of the wind players. A trumpet's idle target is
   * its *fingering*, which changes with every note, so a single-entry cache
   * missed on every note and called `resolve` — which by contract returns
   * freshly built vectors — twice a note for the whole number. That is a slow
   * drip of garbage in the one path that promises not to produce any.
   *
   * By value and not by reference, which is the part that took a measurement to
   * find. The `PlayPoint` objects in the IR are stable but they are not
   * *shared*: `choreograph.ts` builds a fresh `{kind:'hole', midi}` for every
   * note, so a saxophone playing the same F♯ three hundred times presents three
   * hundred distinct objects for one fingering. Identity alone thrashed a
   * thirty-two entry cache down to a permanent miss. `samePoint` is the same
   * comparison `react` de-duplicates with, and `idleHint` keeps the common
   * case — the fingering did not change since last frame — a single reference
   * check.
   */
  idlePoints: (PlayPoint | undefined)[];
  idleLocal: Float64Array;
  idleFlags: Uint8Array;
  idleCount: number;
  idleNext: number;
  idleHint: number;

  /**
   * The mean of every contact this effector has resolved, with its mean normal
   * and knuckle axis, in the model's local frame — "the part of the instrument
   * this hand plays".
   */
  zone: Vector3;
  zoneN: Vector3;
  zoneA: Vector3;
  zoneCount: number;

  /** Per-limb arc scatter, so two hands never move in lockstep. */
  varyLift: number;
  varyApex: number;
  varyBounce: number;
}

function makeSlot(): Slot {
  return {
    px: 0, py: 0, pz: 0, nx: 0, ny: 0, nz: 0, ax: 0, ay: 0, az: 0,
    weight: 0, top: 0, played: false,
    spanRef: new Vector3(), spanMax: 0,
    last: new Vector3(), hasLast: false,
    norm: new Vector3(), hasNorm: false,
    along: new Vector3(), hasAlong: false,
    idleFrom: new Vector3(), idleSince: 0, idling: false,
    swayRef: new Vector3(), hasSwayRef: false,
    idlePoints: new Array<PlayPoint | undefined>(IDLE_CACHE).fill(undefined),
    idleLocal: new Float64Array(IDLE_STRIDE * IDLE_CACHE),
    idleFlags: new Uint8Array(IDLE_CACHE),
    idleCount: 0, idleNext: 0, idleHint: 0,
    zone: new Vector3(), zoneN: new Vector3(), zoneA: new Vector3(), zoneCount: 0,
    varyLift: 1, varyApex: 0, varyBounce: 1,
  };
}

// ---------------------------------------------------------------------------
// Per-performer state
// ---------------------------------------------------------------------------

class Player {
  readonly id: string;
  readonly rig: PerformerRig;
  readonly model: InstrumentModel | undefined;
  readonly gestures: readonly Gesture[];
  readonly blown: boolean;
  readonly singer: boolean;
  /** Whether this part is bowed, which decides how the right hand idles. */
  readonly usesBow: boolean;
  /**
   * Which of this archetype's effectors actually make the sound.
   *
   * Used only to break the tie in `fireReacts`. It is the choreographer's own
   * answer rather than a second one invented here, because a second answer is
   * how a guitarist's fretting hand ends up counting as the note.
   */
  readonly sounds: ReadonlySet<Effector>;
  /**
   * Whether the instrument occupies any hands at all.
   *
   * `ArchetypeSpec.hands` is 0 for a singer, and a microphone stand that is
   * asked where a hand goes answers with the capsule, because from its side
   * there is only one interesting place. Idling a singer's hands there puts
   * both of them on the microphone; a singer's hands are free, and the frozen
   * table already says so.
   */
  readonly occupiesHands: boolean;
  /**
   * Whether each hand's archetype default is a *holding* pose rather than a
   * playing one. Only those are worth overriding from a gesture — see `poses`.
   */
  readonly holding: [boolean, boolean];
  /**
   * Whether each hand is on a key bed, and so whether the width of what it is
   * playing means anything. See the constructor.
   */
  readonly keyed: [boolean, boolean];
  /**
   * Whether an idle hand should ride a share of the body's sway.
   *
   * The inverse of `ArchetypeSpec.held`, and the reason that field exists: a
   * carried instrument takes the hands with it, a floor-standing one does not.
   */
  readonly ridesSway: boolean;
  /** `ArchetypeSpec.held`: whether this instrument is on the player's body. */
  readonly carried: boolean;

  /** Contacts, in the model's own local frame: 9 floats per gesture. */
  readonly contact: Float64Array;
  /** 0 unresolved, 1 resolved, 2 the model does not know this point. */
  readonly resolved: Uint8Array;
  /** Where each gesture's windup started from, local. 3 floats per gesture. */
  readonly anchor: Float64Array;
  readonly anchored: Uint8Array;
  /**
   * A −1..1 wobble per gesture, so no hand plays the same arc twice.
   *
   * Per *gesture* rather than per limb, because the thing being cured is two
   * consecutive strokes of one hand being identical, and because two hands that
   * happen to hit the same beat land on different indices and therefore
   * different numbers. Drawn once at `begin` from the performer's id.
   */
  readonly vary: Float32Array;

  /** Cursors into `gestures`: the active window, and the next `react`. */
  lo = 0;
  hi = 0;
  fire = 0;
  /**
   * The latest beat any finished gesture ran to. **The maximum, not the last.**
   *
   * `gestures[lo - 1]` looks like the same thing and is not: the list is
   * ordered by `beat` and releases are not all equal, so the most recently
   * *skipped* gesture is often not the latest-*ending* one. Reading it made
   * "how long since this player last did anything" jump backwards every time
   * the cursor stepped, which flickered the engagement want inside a single
   * rest and gave the band a twitch on the way down.
   */
  lastEnd = Number.NEGATIVE_INFINITY;

  readonly slots: Slot[] = [];
  readonly busy: boolean[] = new Array<boolean>(N_PART).fill(false);

  // Groove.
  readonly behaviours: readonly GrooveBehaviour[];
  readonly spanCursor: Int32Array;
  phase = 0;
  looseness = 0;
  drift = 0;

  // Visemes.
  readonly visemes: readonly Viseme[];
  readonly breaths: readonly Span[];
  vCursor = 0;
  bCursor = 0;

  /** The bow's stroke: +1 or −1, reversed by every `bow`, held through `hold`. */
  stroke = 1;
  /**
   * And where along that stroke the hand is: the two ends of the run currently
   * under way, when it started and how long it lasts. See `BOW_TRAVEL`.
   *
   * `bowFrom` is wherever the hand had got to when the note landed rather than
   * a fixed end, which is the whole of "the bow does not go back to the middle
   * between notes". The model keeps the same four numbers and turns them on the
   * same `react`, so the two never see different histories — which is why the
   * turn below lives inside the branch that calls `react` and not beside it.
   */
  bowFrom = 0;
  bowTo = 0;
  bowAt = 0;
  bowSpan = 1;

  /**
   * The fingering an active mouth gesture implies, for idle hands.
   *
   * **Sticky.** It used to be cleared every frame and re-derived, so between two
   * notes of a trumpet phrase — where there is no live mouth gesture at all —
   * both hands fell back to the instrument's `rest` and then jumped to the next
   * fingering. A player between two notes keeps their fingers on the valves;
   * the last fingering stands until another one replaces it.
   */
  fingering: PlayPoint | undefined;

  /**
   * Where each hand idles this frame, in world space, already separated.
   *
   * Computed once for both hands together rather than per limb inside the idle
   * loop, because separating two points is a decision about the *pair* and
   * doing it one hand at a time made the answer depend on which hand was
   * processed first — the left pushed off the right's previous-frame position
   * and the right then pushed off the left's new one, so the gap converged over
   * several frames instead of being right on the first.
   */
  readonly goal: [Vector3, Vector3] = [new Vector3(), new Vector3()];
  /** Both in the model's local frame; zero length means the model said nothing. */
  readonly goalNormal: [Vector3, Vector3] = [new Vector3(), new Vector3()];
  readonly goalAlong: [Vector3, Vector3] = [new Vector3(), new Vector3()];
  readonly goalOk: [boolean, boolean] = [false, false];

  /**
   * 0 at ease, 1 at the instrument. See the `ENGAGE_*` block.
   *
   * Starts at zero, which is the whole of "the number opens with the band
   * standing there": the first frame of a number finds every player at their
   * own body's idle, and the first gesture's lead pulls them up during the
   * count-in. `Runtime.begin` carries it across a re-bind so that one player
   * coming back from a tomato does not drop and re-raise the whole band.
   */
  engage = 0;
  /**
   * Whether this player has ever reached the instrument in this number.
   *
   * Only to tell the opening raise from every later one — see
   * `OPEN_RISE_SECONDS`. Carried across a re-bind alongside `engage`, or a
   * revoiced player would take the slow reveal raise in the middle of a bar.
   */
  opened = false;
  /**
   * Whether this player is in at the top of the number. See
   * `OPENING_ENTRY_SECONDS`, which decides it, and `Runtime.begin`, which asks.
   *
   * A property of the gesture list rather than of the frame, and that is the
   * point: the cue is an instruction taken once for the whole wait, so a player
   * either comes up with the band or does not, and nothing about the passing
   * pre-roll can change its mind halfway.
   */
  opens = false;

  /**
   * A carried instrument's staged transform, in the torso's frame.
   *
   * Captured once, from where `show.ts` put it, because lowering the
   * instrument means writing that transform every frame and there would
   * otherwise be nothing left to lower it *from*. Held per player rather than
   * asked of the model, which has no idea it is attached to anybody.
   */
  readonly carryPos = new Vector3();
  readonly carryQuat = new Quaternion();
  /**
   * The point the player holds it by, in the torso's frame.
   *
   * `resolve({kind:'rest'})` is the model's own answer to "where does a hand
   * go on this", which is exactly the pivot a lowered instrument turns about.
   * Falling back to the model's origin is a fallback and not a default — see
   * `AT_EASE` for what happens when the origin is used as a pivot.
   */
  readonly carryPivot = new Vector3();
  readonly atEase: AtEasePose | undefined;
  readonly hasCarry: boolean;

  /**
   * The parts of the instrument an at-ease hand must not end up inside, as
   * boxes **in the model's own frame**.
   *
   * Three things about the shape of this, each of which was a wrong answer
   * first:
   *
   * **In the model's frame and no other.** A *world* box round a model turned
   * by the player's facing is inflated by the turn: measured on a synth at
   * −27°, a 1.34 × 0.15 m key bed reports 1.16 × 0.68. Turning that box into
   * the *player's* frame inflates it a second time, to 1.34 × 1.13 — a key bed
   * apparently over a metre deep, swallowing hands nowhere near it. Only in
   * the model's own frame is every mesh axis-aligned and the bound tight.
   *
   * **Per mesh, not one box round the model.** A single union box is useless
   * for anything the player sits *inside*: a drummer's hands are 44 cm deep
   * inside the union of a drum kit and 1 % inside any actual part of it, and a
   * pianist's are 42 cm inside a grand piano's union and touching none of it.
   * One box would have shoved both backwards for nothing.
   *
   * **Only the parts at hand height.** Which is what keeps the per-mesh test
   * cheap: a drum kit is forty meshes and two of them are anywhere near where
   * a hand comes to rest.
   *
   * Measured once, because a floor instrument does not move.
   */
  readonly keepOut: readonly Box3[] | undefined;

  stopped = false;
  /** Eases 1 → 0 when this player is stopped. Scales every groove amplitude. */
  gain = 1;
  sounding = false;
  soundingSent = false;

  /** Held, because `lookAt` keeps the reference and reads it during `update`. */
  readonly look = new Vector3();

  /** How much of a plucking shape each hand is being asked for, this frame. */
  readonly pluck: [number, number] = [0, 0];
  /**
   * How far apart the things each hand is playing are, in metres, eased.
   *
   * The chord width, arrived at as geometry rather than as pitch — which is the
   * only way this layer *can* have it, and is also the better answer. The
   * choreographer says "these four keys, one motion"; the model says where those
   * keys are; the distance between the outer two is the stretch the hand is
   * actually making. Nothing here has to know that a tenth is sixteen
   * centimetres of keyboard, and a guitarist's fretting hand gets the same
   * treatment for free.
   *
   * Eased rather than taken raw because it changes on the frame a chord starts
   * and a hand does not: `SPAN_TAU` is the hand's own opening time.
   */
  readonly span: [number, number] = [0, 0];
  /** Quantised hand-pose weights, so `setHandPose` is called only on change. */
  readonly poseWeight: [number, number] = [0, 0];
  /**
   * And which shape each weight belongs to.
   *
   * Held alongside the weight because the weight alone stopped identifying the
   * request the moment there were two shapes to ask for: a hand a quarter of
   * the way to `pluck` and a hand a quarter of the way to `relax` are the same
   * number and different hands, and comparing only the number silently kept
   * the first one when the player stood down.
   */
  readonly poseName: [HandPoseId, HandPoseId] = ['pluck', 'pluck'];

  /**
   * The model's world transform and its inverse, refreshed once a frame.
   *
   * The inverse is what makes rule 5 cheap: every position the runtime
   * remembers is pushed through it on the way into storage, so a cache entry is
   * a fact about the *instrument* rather than about where the instrument
   * happened to be standing on the frame it was written.
   */
  readonly world = new Matrix4();
  readonly worldInv = new Matrix4();
  readonly worldQuat = new Quaternion();
  readonly worldQuatInv = new Quaternion();
  readonly rigQuat = new Quaternion();

  constructor(
    id: string, rig: PerformerRig, model: InstrumentModel | undefined,
    gestures: readonly Gesture[], behaviours: readonly GrooveBehaviour[],
    phase: number, looseness: number,
    visemes: readonly Viseme[], breaths: readonly Span[],
  ) {
    this.id = id;
    this.rig = rig;
    this.model = model;
    this.gestures = gestures;
    this.behaviours = behaviours;
    this.phase = phase;
    this.looseness = looseness;
    this.visemes = visemes;
    this.breaths = breaths;

    const archetype = rig.performer.archetype;
    const spec = ARCHETYPES[archetype];
    this.blown = spec.blown === true;
    this.singer = archetype === 'singer';
    this.usesBow = gestures.some((g) => g.effector === 'bow');
    this.sounds = new Set<Effector>(soundingEffectors(archetype));
    this.occupiesHands = spec.hands > 0;
    this.ridesSway = !spec.held;
    this.carried = spec.held;
    this.atEase = AT_EASE[archetype];
    // Whatever `show.ts` staged is the rest. Read now, before anything in this
    // file has had a chance to move it.
    this.hasCarry = this.carried && model !== undefined;
    if (this.hasCarry && model) {
      this.carryPos.copy(model.root.position);
      this.carryQuat.copy(model.root.quaternion);
      // The grip, carried from the model's own frame into the torso's by the
      // transform `show.ts` staged it with.
      const grip = model.resolve(REST_POINT, 'left-hand');
      if (grip) this.carryPivot.copy(grip.position).applyQuaternion(this.carryQuat).add(this.carryPos);
      else this.carryPivot.copy(this.carryPos);
    }

    // Anything this player plays that stands on the floor: a keyboard on a
    // stand, a vibraphone, an organ console, a cello between the knees. Every
    // posture, because the per-mesh bound is tight enough that a player who
    // sits inside their instrument no longer reads as a player inside it.
    this.keepOut = model && !spec.held && spec.hands > 0
      ? keepOutParts(model, rig) : undefined;
    const defaults = DEFAULT_HAND_POSES[archetype];
    this.holding = [HOLDING_POSES.has(defaults.left), HOLDING_POSES.has(defaults.right)];
    /**
     * Which hands are on a key bed, and why that is two tests rather than one.
     *
     * The pose is not enough by itself: a saxophonist, a clarinettist, a
     * flautist and a trumpeter's right hand all default to `keys`, because
     * keywork is what they have under their fingers — and none of them is
     * *reaching* for anything. Their contacts are one fingering point per note,
     * so the measured span is always zero, and a hand shaped from that alone
     * would spend the whole number with one finger down and four in the air.
     *
     * `points` is the half that actually decides. An archetype that resolves a
     * `key` has a keyboard laid out in pitch, which is the only case where the
     * distance between two contacts means "how far apart the fingers are".
     * Together they pick out exactly the keyboards, including the accordion's
     * right hand and excluding its left, which is behind a strap.
     */
    const keyed = spec.points.includes('key');
    this.keyed = [keyed && defaults.left === 'keys', keyed && defaults.right === 'keys'];
    if (this.keyed[0]) this.span[0] = SPAN_NEUTRAL;
    if (this.keyed[1]) this.span[1] = SPAN_NEUTRAL;

    const n = gestures.length;
    this.contact = new Float64Array(n * CONTACT_STRIDE);
    this.resolved = new Uint8Array(n);
    this.anchor = new Float64Array(n * 3);
    this.anchored = new Uint8Array(n);
    this.vary = new Float32Array(n);
    this.spanCursor = new Int32Array(behaviours.length);

    for (let i = 0; i < N_EFF; i++) this.slots.push(makeSlot());

    // A few percent of drift, so no two players are exactly on the beat with
    // each other. `GroovePart.looseness` says how much; the id says which way.
    this.drift = new Rng(`${id}#drift`).float(0, Math.PI * 2);

    const strokes = new Rng(`${id}#stroke`);
    for (let i = 0; i < n; i++) this.vary[i] = strokes.float(-1, 1);

    // Per-limb scatter. Two hands with identical arcs are the tell that this is
    // one animation played twice, and the drummer is where it shows: both
    // sticks rising and falling as one object. A few percent on the lift, the
    // apex and the bounce is enough to break the read without any limb becoming
    // the odd one out.
    for (let s = 0; s < N_EFF; s++) {
      const rng = new Rng(`${id}#${EFFECTORS[s]!}`);
      const slot = this.slots[s]!;
      slot.varyLift = rng.float(0.88, 1.12);
      slot.varyApex = rng.float(-1, 1);
      slot.varyBounce = rng.float(0.84, 1.16);
    }
  }

  /**
   * Seek every cursor to `beat`. Used on the first frame and after a wrap.
   *
   * The fire cursor is placed by the gesture's *window* rather than by its
   * beat, and that is not a detail: the first frame after `begin` lands a few
   * milliseconds after zero, and seeking by beat alone would silently swallow
   * the downbeat of every number — the one hit an audience is certainly
   * watching for. Anything whose window still contains `now` fires on this
   * frame; anything genuinely finished is skipped, which is what keeps a show
   * started mid-number from dumping a bar of reactions in one frame.
   */
  seek(beat: number): void {
    const gs = this.gestures;
    let i = 0;
    while (i < gs.length && (gs[i]!.beat - gs[i]!.prep) <= beat) i++;
    this.hi = i;
    let lo = 0;
    while (lo < this.hi && (gs[lo]!.beat + gs[lo]!.release) < beat) lo++;
    this.lo = lo;
    let fire = 0;
    while (fire < gs.length && (gs[fire]!.beat + gs[fire]!.release) < beat) fire++;
    this.fire = fire;
    this.anchored.fill(0);
    this.fingering = undefined;
    // Nothing has finished *yet* from here. Left alone, a wrap would leave the
    // end of the last pass sitting in the future, so "how long since this
    // player last played" would come back negative for a whole number and
    // nobody would ever stand down again.
    this.lastEnd = Number.NEGATIVE_INFINITY;
    for (let s = 0; s < N_EFF; s++) {
      const slot = this.slots[s]!;
      slot.hasLast = false;
      slot.hasNorm = false;
      slot.hasAlong = false;
      slot.idling = false;
      slot.hasSwayRef = false;
    }
  }
}

// ---------------------------------------------------------------------------
// The runtime
// ---------------------------------------------------------------------------

class Runtime implements Animator {
  private readonly driveRigs: boolean;
  private players: Player[] = [];
  private byId = new Map<string, Player>();

  /** Beats per second, for every seconds-shaped constant in this file. */
  private beatsPerSecond = 2;
  private idleHold = 1;
  private idleEase = 1;
  private closeBeats = 0.1;
  /**
   * Where the music proper starts, in beats: past the drummer's count-in, or 0.
   *
   * Only `Player.opens` reads it, and only to ask how far into the number a
   * first entry is. Taken from the song rather than from the show runner
   * because it is a fact about the pattern — `withCountIn` wrote the clicks and
   * `SongMeta.leadInBars` records where it put the music.
   */
  private startBeat = 0;

  /** Monotonic show seconds, accumulated from `dt`. The rigs read this. */
  private seconds = 0;
  private lastBeat = Number.NaN;
  private started = false;
  /** Whether the band has been told to take up position. See `cue`. */
  private cued = false;
  /**
   * Whether the band is waiting to come in: cued, and the piece has not
   * started. See `cue` and `downbeat`.
   */
  private waiting = false;
  /** Who is giving the count, if anybody. See `cue` and `counting`. */
  private leader: string | undefined;

  constructor(driveRigs: boolean) {
    this.driveRigs = driveRigs;
  }

  begin(
    number: ConcertNumber,
    rigs: Map<string, PerformerRig>,
    models: Map<string, InstrumentModel>,
  ): void {
    const bpm = number.song.meta.bpm > 0 ? number.song.meta.bpm : 120;
    this.beatsPerSecond = bpm / 60;
    this.startBeat = (number.song.meta.leadInBars ?? 0) * number.song.meta.beatsPerBar;
    this.idleHold = IDLE_HOLD_SECONDS * this.beatsPerSecond;
    this.idleEase = IDLE_EASE_SECONDS * this.beatsPerSecond;
    this.closeBeats = MOUTH_CLOSE_SECONDS * this.beatsPerSecond;

    /**
     * What the outgoing players were doing, so the incoming ones can continue
     * it.
     *
     * `begin` is called mid-number every time a tomatoed player is revoiced and
     * comes back — see `returnToPlaying` in `show.ts` — and everything else in
     * a `Player` is safe to rebuild from zero because it is either derived from
     * the IR or re-derived on the next frame. `engage` is not: rebuilding it at
     * zero drops the entire band's hands to their sides mid-bar and raises them
     * again over the following second, in answer to one bassist being hit.
     */
    const carriedOver = new Map<string, number>();
    const wasOpened = new Set<string>();
    /**
     * And the bow, which has to come across for a harder reason than `engage`.
     *
     * The *models* are not rebuilt by a re-bind — `show.ts` builds them once a
     * number and hands the same map back — so a violinist's model keeps its
     * stroke direction and its position along the hair while a fresh `Player`
     * would start again at the middle, going the other way. The hand and the
     * bow it is holding would then be up to a full travel apart, permanently,
     * and the two would be drawing in opposite directions. See `BOW_TRAVEL`.
     */
    const previous = new Map<string, Player>();
    for (const prev of this.players) {
      carriedOver.set(prev.id, prev.engage);
      if (prev.opened) wasOpened.add(prev.id);
      previous.set(prev.id, prev);
      this.releaseCarry(prev);
    }

    this.players = [];
    this.byId = new Map();
    this.lastBeat = Number.NaN;
    this.started = false;

    for (const performer of number.cast.performers) {
      const rig = rigs.get(performer.id);
      if (!rig) continue;
      const part = number.choreography.parts[performer.id];
      const groove = number.groove.parts[performer.id];
      const track = number.visemes?.performerId === performer.id ? number.visemes : undefined;
      const player = new Player(
        performer.id, rig, models.get(performer.id),
        part?.gestures ?? [],
        groove?.behaviours ?? [],
        groove?.phase ?? 0,
        groove?.looseness ?? 0,
        track?.visemes ?? [],
        track?.breaths ?? [],
      );
      player.engage = carriedOver.get(performer.id) ?? 0;
      player.opened = wasOpened.has(performer.id);
      player.opens = this.opensNumber(player);
      const was = previous.get(performer.id);
      if (was) {
        player.stroke = was.stroke;
        player.bowFrom = was.bowFrom;
        player.bowTo = was.bowTo;
        player.bowAt = was.bowAt;
        player.bowSpan = was.bowSpan;
      }
      this.players.push(player);
      this.byId.set(performer.id, player);
    }
  }

  /**
   * Whether this player's first entry belongs to the opening.
   *
   * The whole of who picks their instrument up on the cue. A drummer clicking
   * the count is in before the music starts, so their entry is negative and
   * they are in by a mile; a bassist on the downbeat is in at zero; a horn line
   * that arrives at the second chorus is not, and stands at ease until its own
   * lead brings it up under the ordinary rule.
   *
   * A player with nothing to play never opens — there is no instrument to take
   * up and no note to take it up for.
   */
  private opensNumber(p: Player): boolean {
    const first = p.gestures[0];
    if (!first) return false;
    const entry = (first.beat - first.prep - this.startBeat) / this.beatsPerSecond;
    return entry <= OPENING_ENTRY_SECONDS;
  }

  /**
   * Put a carried instrument back where it was staged.
   *
   * Called before a player is dropped, for the same reason `Player` captures
   * the transform in its constructor: the next `Player` for this performer
   * reads `model.root` to learn what "up" is, and a model left half lowered
   * would teach it that half lowered *is* up — and then the next re-bind would
   * lower it from there again. Two tomatoes and the horn is on the floor.
   */
  private releaseCarry(p: Player): void {
    if (!p.hasCarry || !p.model) return;
    p.model.root.position.copy(p.carryPos);
    p.model.root.quaternion.copy(p.carryQuat);
  }

  setPlaying(performerId: string, playing: boolean): void {
    const player = this.byId.get(performerId);
    if (player) player.stopped = !playing;
  }

  cue(leaderPerformerId?: string): void {
    this.cued = true;
    this.waiting = true;
    this.leader = leaderPerformerId;
  }

  downbeat(): void {
    this.waiting = false;
    this.leader = undefined;
    // The reveal is over, so every later raise is a working raise: whoever
    // stayed at ease through the count comes up for their entry at the brisk
    // constant rather than at the slow one the opening shot is worth. See
    // `OPEN_RISE_SECONDS`, which is the difference between a band picking its
    // instruments up and one player reaching for theirs.
    for (const p of this.players) p.opened = true;
  }

  /**
   * The leader, while they are still beating time.
   *
   * From the cue until the piece begins — or until the leader's own first
   * gesture window opens, whichever comes first, which is the honest end of a
   * count whoever is giving it: a drummer counting four stops beating time the
   * moment the sticks start, and a singer keeps going until the band is in.
   */
  private counting(): Player | undefined {
    if (!this.waiting || !this.leader) return undefined;
    const lead = this.byId.get(this.leader);
    return lead && lead.hi === 0 ? lead : undefined;
  }

  end(): void {
    // The band stops being driven here but the instruments stay on the stage
    // until the show runner strikes them, and a bow taken behind a trombone
    // pointing at the boards is not the picture anybody wants.
    for (const p of this.players) this.releaseCarry(p);
    this.players = [];
    this.byId = new Map();
    this.lastBeat = Number.NaN;
    this.started = false;
    // And the next number opens at ease again. Cleared here rather than in
    // `begin` precisely because `begin` is the one that runs mid-number.
    this.cued = false;
    this.waiting = false;
    this.leader = undefined;
  }

  update(beat: number, dt: number): void {
    if (!this.players.length) return;
    if (!Number.isFinite(beat)) return;
    const step = Number.isFinite(dt) ? (dt < 0 ? 0 : dt > 0.1 ? 0.1 : dt) : 0;
    this.seconds += step;

    // The transport wraps `beat` at the end of a number, and a show that is
    // scrubbed goes backwards on purpose. Either way the cursors have to be
    // re-seeked rather than left pointing into the future — but a fraction of a
    // beat of clock jitter must not do it, or every cursor is rebuilt on frames
    // where nothing happened.
    const wrapped = this.started && beat < this.lastBeat - 0.5;
    const fresh = !this.started;

    // Indexed rather than `for…of`, here and in `commitPlay`, and that is a
    // measurement rather than a style: V8 does not always elide the iterator
    // object, and at six players times two loops times sixty hertz the ones it
    // misses were the whole of this file's residual garbage — a few bytes a
    // frame, which is nothing until it is a collection mid-number.
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i]!;
      if (fresh || wrapped) player.seek(beat);
      this.frame(player, beat, step);
    }

    this.started = true;
    this.lastBeat = beat;
  }

  // -- one performer, one frame -------------------------------------------

  private frame(p: Player, beat: number, step: number): void {
    const { rig, model } = p;

    // Cursors first, then how engaged this player is, then the instrument's
    // own transform — all three before the world matrices are read, because
    // lowering a carried instrument moves every contact on it and a matrix
    // sampled before the move would place this frame's hands on last frame's
    // trumpet. `advance` needs nothing but the beat, so it is free to lead.
    this.advance(p, beat);
    this.engage(p, beat, step);

    // World transforms, once. `Contact.position` is in the model's own local
    // frame, so every contact is one matrix multiply away from world space —
    // and so is every position the runtime remembers between frames. With no
    // model both matrices stay the identity and the conversions are free.
    if (model) {
      model.root.updateWorldMatrix(true, false);
      p.world.copy(model.root.matrixWorld);
      p.worldInv.copy(p.world).invert();
      model.root.getWorldQuaternion(p.worldQuat);
      p.worldQuatInv.copy(p.worldQuat).invert();
    }
    rig.root.updateWorldMatrix(true, false);
    rig.root.getWorldQuaternion(p.rigQuat);

    this.fireReacts(p, beat);

    // Where the hands would idle, before anything is known about what is being
    // played. Ahead of the gesture loop on purpose: `commitPlay` crossfades a
    // departing limb toward its idle home and `arcOf` anchors a first windup
    // there, so both want the answer already computed. It costs the fingering
    // hands one frame of lag — 16 ms against a finger movement of 120 — and
    // saves an ordering constraint that was easy to break silently.
    this.idleGoals(p, beat);

    for (let s = 0; s < N_EFF; s++) {
      const slot = p.slots[s]!;
      slot.px = 0; slot.py = 0; slot.pz = 0;
      slot.nx = 0; slot.ny = 0; slot.nz = 0;
      slot.ax = 0; slot.ay = 0; slot.az = 0;
      slot.weight = 0; slot.top = 0; slot.played = false;
      slot.spanMax = 0;
    }
    for (let i = 0; i < N_PART; i++) p.busy[i] = false;
    p.pluck[0] = 0;
    p.pluck[1] = 0;

    let blowWeight = 0;
    let breathWeight = 0;
    let visemeForce = 0;
    let fingerWeight = 0;

    if (!p.stopped) {
      const gs = p.gestures;
      for (let i = p.lo; i < p.hi; i++) {
        const g = gs[i]!;
        const tau = beat - g.beat;
        if (tau < -g.prep || tau > g.release) continue;
        const w = weightOf(g, tau);
        if (w <= 0) continue;

        if (g.effector === 'mouth') {
          if (g.kind === 'breathe' || g.target.kind === 'rest') breathWeight = Math.max(breathWeight, w);
          else {
            blowWeight = Math.max(blowWeight, w);
            if (g.target.kind === 'viseme') visemeForce = Math.max(visemeForce, g.force);
          }
        }

        if (g.kind === 'pluck') {
          if (g.effector === 'left-hand') p.pluck[0] = Math.max(p.pluck[0], w);
          else if (g.effector === 'right-hand') p.pluck[1] = Math.max(p.pluck[1], w);
        }

        /**
         * The `mouth` effector is *placed* only for a `viseme`, and that is a
         * real seam mismatch being caught rather than a stylistic choice.
         *
         * `choreograph.ts` puts a wind player's note on the mouth — correctly,
         * because the sound comes out of their mouth — but the target is a
         * `valve` or a `hole`, and every wind and brass model answers those
         * with **where the fingering hand goes**. Placing a mouth there drags
         * the head down onto the valves.
         *
         * `viseme` is the only `PlayPoint` that describes a mouth, so it is the
         * only one that moves one. Everything else on this effector drives
         * `react`, drives the embouchure, and becomes the target the idle hands
         * follow — which is how a trumpeter's fingers track the pitch without
         * the choreographer having invented a hand gesture for them. A distance
         * test was the first version and it cannot work: a tall singer's
         * capsule is 18 cm from their lips and a trumpet's valves are 13.5 cm,
         * so the two classes overlap and the routing flipped mid-phrase.
         */
        if (g.effector === 'mouth' && g.target.kind !== 'viseme') {
          // The loudest live one wins, rather than the last one in index order,
          // and it *replaces* rather than being cleared each frame — see
          // `Player.fingering`.
          if (w > fingerWeight) { fingerWeight = w; p.fingering = g.target; }
          continue;
        }

        /**
         * A hand that *stays* on what it played is a fingering too.
         *
         * This channel existed for winds alone, because a wind player's note is
         * on their mouth and their hands would otherwise have nothing to
         * follow. Every other instrument fell back to `resolve({kind:'rest'})`
         * the moment a note finished — so a violinist's hands left the neck and
         * the bow for one rest point between phrases, a pianist's went to the
         * middle of a keyboard they were not playing, and an accordionist's
         * left hand let go of a bass side that was still travelling. All three
         * are "the instrument stops being held".
         *
         * `SUSTAINS` is the test and it is the honest one: `press`, `bow`,
         * `blow` and `hold` are the kinds where the effector stays engaged, so
         * they are exactly the kinds whose target is still where the hand
         * belongs afterwards. A drummer's `strike` and a guitarist's `pluck`
         * are not — a stick leaves the head, and a hand idling *on* a drum head
         * would be half inside the drum — so the kit keeps the rest contact and
         * the zone pull it already had.
         */
        if (w > fingerWeight && SUSTAINS.has(g.kind) && HANDED.has(g.effector)) {
          fingerWeight = w;
          p.fingering = g.target;
        }

        const target: Effector = g.effector;
        // `contactOf` leaves the position in V1, the normal in V2 and the
        // knuckle axis, when the model pinned one, in V5.
        if (!this.contactOf(p, i, g, beat)) continue;
        const slot = p.slots[SLOT_OF[target]]!;
        // The width of what this hand is playing, measured before `arcOf`
        // displaces anything. A hand's *shape* is a fact about the notes, not
        // about where in the swing toward them the frame happens to be.
        if (slot.weight === 0) slot.spanRef.copy(V1);
        else {
          const d = slot.spanRef.distanceTo(V1);
          if (d > slot.spanMax) slot.spanMax = d;
        }
        this.arcOf(p, i, g, tau, target);
        slot.px += V4.x * w; slot.py += V4.y * w; slot.pz += V4.z * w;
        slot.nx += V2.x * w; slot.ny += V2.y * w; slot.nz += V2.z * w;
        slot.ax += V5.x * w; slot.ay += V5.y * w; slot.az += V5.z * w;
        slot.weight += w;
        if (w > slot.top) slot.top = w;
        slot.played = true;
        p.busy[PART_OF[target]] = true;
      }
    }

    this.commitPlay(p, beat);
    this.groove(p, beat, step);
    this.idle(p, beat, step);
    this.face(p, beat, blowWeight, breathWeight, visemeForce);
    this.poses(p, step);
    // After both layers have had the hands, because it needs to know where one
    // of them actually ended up. See `carryBow`.
    this.carryBow(p);

    const sounding = !p.stopped && (blowWeight > 0 || p.slots[0]!.played || p.slots[1]!.played
      || p.slots[5]!.played || p.slots[2]!.played || p.slots[3]!.played);
    if (sounding !== p.soundingSent) {
      rig.setPlaying(sounding);
      p.soundingSent = sounding;
    }

    if (model) model.update(beat);
    if (this.driveRigs) rig.update(this.seconds, step);
  }

  // -- cursors -------------------------------------------------------------

  /**
   * Advance the active window and nothing else.
   *
   * A cursor rather than a scan because this runs every frame for six players,
   * and because the window is bounded: a gesture's release is capped at four
   * beats by the choreographer, so the live set is a handful of entries however
   * long the number is.
   */
  private advance(p: Player, beat: number): void {
    const gs = p.gestures;
    while (p.hi < gs.length && (gs[p.hi]!.beat - gs[p.hi]!.prep) <= beat) p.hi++;
    // Only from the front, and only past gestures that are genuinely finished:
    // a four-beat pad note holds the window open over the sixteenths inside it.
    while (p.lo < p.hi && (gs[p.lo]!.beat + gs[p.lo]!.release) < beat) {
      const end = gs[p.lo]!.beat + gs[p.lo]!.release;
      if (end > p.lastEnd) p.lastEnd = end;
      p.lo++;
    }
  }

  /**
   * Whether this player is at their instrument — and, if they carry it, where
   * the instrument itself is.
   *
   * The want is a decision about the *gap*, taken once for the whole gap: a
   * pause is worth standing down for only if it is long enough to stand down
   * and come back up inside, with time either side that reads as deliberate.
   * Half-measures are what the single `ENGAGE_GAP_SECONDS` test exists to
   * prevent — a band that dips its hands two inches into every bar's rest
   * looks like a band with a fault, not a band with a rest.
   *
   * Everything after that is one exponential with two time constants. Nothing
   * downstream branches on "is this player at ease"; they all read the number,
   * which is why the hands, the wrists, the shapes and the horn arrive and
   * leave together instead of four systems each finding their own moment.
   */
  private engage(p: Player, beat: number, step: number): void {
    const gs = p.gestures;
    const bps = this.beatsPerSecond;

    let want: number;
    if (!this.cued) {
      // Bound but not called. See `Animator.cue` — everything before the cue
      // happens where nobody can see it, so nothing before the cue is worth
      // spending the one moment the band has to arrive.
      want = 0;
    } else if (p.stopped) {
      // Hit by a tomato and no longer playing. Standing down *is* the tell —
      // it is the same thing a real player does, and it costs nothing here
      // because the sulk already means there are no gestures to answer.
      want = 0;
    } else if (this.waiting) {
      /**
       * Cued, and the piece has not started: whoever is in at the top is at the
       * ready, whatever the clock says.
       *
       * This is the count-in, and it is the one place the ordinary rule is
       * wrong. That rule asks "is a gesture near?" and before the first
       * downbeat the honest answer for even the players who open the number is
       * no — the drummer is clicking four and everyone else's first note is a
       * bar away, which is comfortably past `ENGAGE_LEAD_SECONDS`. So a band
       * that had just taken up position on the cue would put its instruments
       * straight back down and pick them up again during the count, one player
       * at a time.
       *
       * A cue is an instruction rather than a forecast: from the moment it is
       * given until the band is in, everybody who starts the number is at their
       * instrument. It also covers the pre-roll, where there is no clock at all
       * — `show.ts` runs the beat backwards of zero while the curtain travels.
       *
       * What it is *not* is a rule about the whole band. `Player.opens` is the
       * cast list for the first bar, and anybody outside it waits at ease with
       * everybody else's instruments up around them, which is the picture, and
       * comes up for their own entry when the ordinary rule gets there.
       */
      want = p.opens ? 1 : 0;
    } else if (p.lo < p.hi) {
      want = 1;
    } else {
      // Between two gestures, with the cursors either side of the gap. `hi` is
      // the next gesture whose window has not opened and `lo - 1` the last one
      // that finished, so the pause is exactly the distance between them.
      const next = gs[p.hi];
      const ahead = next ? (next.beat - next.prep - beat) / bps : Number.POSITIVE_INFINITY;
      const since = (beat - p.lastEnd) / bps;
      want = ahead >= ENGAGE_LEAD_SECONDS && since >= ENGAGE_HOLD_SECONDS
        && ahead + since >= ENGAGE_GAP_SECONDS ? 0 : 1;
    }

    const rise = p.opened ? ENGAGE_RISE_SECONDS : OPEN_RISE_SECONDS;
    const tau = want > p.engage ? rise : ENGAGE_FALL_SECONDS;
    p.engage += (want - p.engage) * (1 - Math.exp(-step / tau));
    // Snapped at the ends so the downstream tests can short-circuit, and so a
    // player at the instrument is *at* it rather than a thousandth off it.
    if (p.engage > 0.999) { p.engage = 1; p.opened = true; }
    else if (p.engage < 0.001) p.engage = 0;

    // And the instrument itself, for the ones a player actually puts down.
    // Which those are, and what they do, is `AT_EASE`.
    const ease = p.atEase;
    if (!ease || !p.hasCarry || !p.model) return;
    const root = p.model.root;
    root.position.copy(p.carryPos);
    root.quaternion.copy(p.carryQuat);
    const down = 1 - p.engage;
    if (down <= 0) return;

    // Turn about the grip, then move the grip. Expanding "rotate a rigid body
    // about a point that is not its origin" gives the position as the pivot
    // plus the rotated offset from it — which is the whole of the fix for an
    // origin that sits on the boards.
    Q1.setFromEuler(E1.set(
      ease.pitch * down, (ease.turn ?? 0) * down, ease.roll * down, 'ZYX',
    ));
    root.quaternion.premultiply(Q1);
    root.position.sub(p.carryPivot).applyQuaternion(Q1).add(p.carryPivot);
    root.position.y -= ease.drop * down;
    root.position.z -= ease.back * down;
    if (ease.across) root.position.x += ease.across * down;
  }

  /**
   * The body's own idle for one hand, moved clear of whatever the player is
   * standing at, into `out`.
   *
   * `restPosition` answers "where does this hand go when nothing is asking",
   * and it answers it about a *body* — it has never heard of the keyboard the
   * body is standing behind. For a seated or a kit player that is fine and the
   * caller has no box to check against. For anyone on their feet at a floor
   * instrument it puts the hands in the key bed, so the hand backs up along
   * the player's own forward axis until it is out. See `KEEP_OUT_PUSH`.
   */
  private atEaseHand(p: Player, e: Effector, out: Vector3): Vector3 {
    return this.escape(p, p.rig.restPosition(e, out), 1);
  }

  /**
   * How far this hand has let go of the instrument, 0..1.
   *
   * `1 - engage` says how far the *player* has stood down; this says how much
   * of that applies to one hand. A flautist at ease is still holding the flute
   * and a violinist is still holding the violin by its neck, so those hands
   * ride the instrument down instead of setting off for a hip — see
   * `AtEasePose.hands`. Everything with no at-ease pose keeps the whole
   * stand-down, which is the behaviour a guitarist on a strap wants.
   *
   * `side` is 0 for the left hand and 1 for the right, matching `handSideOf`.
   */
  private standDown(p: Player, side: number): number {
    const down = 1 - p.engage;
    if (down <= 0) return 0;
    const hands = p.atEase?.hands;
    return hands ? down * (hands[side] ?? 1) : down;
  }

  /**
   * Hand the bow to the hand that is holding it.
   *
   * A bow is the one thing on this stage that belongs to the player rather than
   * to the instrument, and the scene graph says the opposite: it is a child of
   * the violin, so a violinist standing down took their bow with the violin —
   * down to the hip, still lying across the strings at the playing angle, with
   * the arm that was holding it away at their side. A cellist's stayed on the
   * cello, which does not come down at all, so theirs simply sat there being
   * held by nobody. Both are the same fact about parentage and neither is
   * fixable inside a model: **where the hand went is the rig's answer**, and a
   * model has never been able to see it.
   *
   * So the runtime tells it. `standDown` is the same number the hand itself was
   * blended by one layer above, which is what keeps the frog *in* the hand
   * rather than chasing it, and the position is the one that was actually
   * commanded this frame — the play layer's while a stroke is live, the idle
   * layer's otherwise, since the two write to different slots for one physical
   * hand. Anything with no bow to carry costs one property lookup.
   */
  private carryBow(p: Player): void {
    const bowed = p.model as Partial<CarriesBow> | undefined;
    if (typeof bowed?.carryBow !== 'function') return;
    const played = p.slots[SLOT_OF.bow]!;
    const idled = p.slots[SLOT_OF['right-hand']]!;
    const src = played.played ? played : idled;
    if (src.hasLast) this.toWorld(p, src.last, V1);
    else this.atEaseHand(p, 'right-hand', V1);
    bowed.carryBow(this.standDown(p, 1), V1);
  }

  /**
   * Push a world point out of whatever part of the instrument it is inside.
   *
   * Applied to the *blended* position rather than only to the at-ease target,
   * which is the difference between guarding a destination and guarding a
   * journey. A cellist's right hand leaves the strings and arrives beside
   * their hip, and both ends are fine; the straight line between them goes
   * through the front of the cello, and it is on that line for the better part
   * of two seconds. Correcting only the endpoint left that untouched.
   *
   * `gate` is how far this hand has stood down, and it exists so that a hand
   * *playing* the instrument is never pushed off it. A contact is on the
   * surface by definition and often just inside a mesh's box; shoving it out
   * would be this file breaking the one invariant it has. It ramps in over the
   * first fraction of the stand-down, so there is no frame where it switches
   * on.
   */
  private escape(p: Player, point: Vector3, gate: number): Vector3 {
    const parts = p.keepOut;
    if (!parts || gate <= 0) return point;
    // Into the instrument's own frame, which is the only one the boxes mean
    // anything in. `toLocal` is the same conversion every cached contact goes
    // through, so it is already correct for a model that has been moved.
    this.toLocal(p, point, V4);
    const out = point;

    // Out along the player's own backward, expressed in the instrument's
    // frame. Horizontal only: a hand pushed up goes into the keys and a hand
    // pushed down goes through the boards, and neither is an escape.
    V5.set(0, 0, -1).applyQuaternion(p.rigQuat);
    V8.copy(V5).applyQuaternion(p.worldQuatInv);

    // The furthest any one part demands, so a hand between two of them leaves
    // both. Taking the first, or the nearest, moves it out of one and leaves
    // it in the next.
    let push = 0;
    for (let i = 0; i < parts.length; i++) {
      const box = parts[i]!;
      if (!box.containsPoint(V4)) continue;
      let exit = Number.POSITIVE_INFINITY;
      if (Math.abs(V8.x) > 1e-6) {
        exit = Math.min(exit, (V8.x > 0 ? box.max.x - V4.x : box.min.x - V4.x) / V8.x);
      }
      if (Math.abs(V8.z) > 1e-6) {
        exit = Math.min(exit, (V8.z > 0 ? box.max.z - V4.z : box.min.z - V4.z) / V8.z);
      }
      if (Number.isFinite(exit) && exit > push) push = exit;
    }
    if (push <= 0) return out;

    // Capped rather than guaranteed. Some instruments wrap further round their
    // player than a hand can back out of, and half a metre of reversing would
    // put the hands behind the body, which is a worse picture than a hand
    // brushing the thing it belongs to.
    const ramp = gate < KEEP_OUT_GATE ? gate / KEEP_OUT_GATE : 1;
    return out.addScaledVector(V5, Math.min(push + KEEP_OUT_MARGIN, KEEP_OUT_PUSH) * ramp);
  }

  /**
   * `react`, once per gesture, on the frame its beat is crossed.
   *
   * The cursor only moves forward, so a long frame fires everything it stepped
   * over, in beat order, and a short one fires nothing twice.
   *
   * De-duplicated by point within a beat, which is not a nicety. A guitar note
   * is two gestures — the left hand stops the string and the right hand sounds
   * it — carrying the *same* `{string, fret}`, and reacting twice blurs the
   * string twice as hard as it was played.
   *
   * **The surviving gesture is the one that makes the sound, not the one that
   * was placed first**, and getting that backwards was a real bug rather than a
   * refinement. `stringPart` places the stopping hand first, so the kind that
   * reached the model was always the left hand's `press` — and on a bowed part
   * the whole of the stroke language is in the kind the *bow* carries. `bow`
   * means reverse, `hold` means carry on under the stroke already running,
   * which is what a slur is; the models implement that and were never being
   * told. A guitar had the milder version of the same fault, being told a note
   * was pressed when it was plucked.
   *
   * The scan is over the batch, which is a handful of gestures, and only ever
   * looks at gestures that are about to fire on this same frame anyway.
   */
  private fireReacts(p: Player, beat: number): void {
    const model = p.model;
    const gs = p.gestures;
    let fired = 0;
    let batch = Number.NaN;
    let turned = false;

    while (p.fire < gs.length && gs[p.fire]!.beat <= beat) {
      const at = p.fire;
      const g = gs[at]!;
      p.fire++;

      if (g.beat !== batch) { batch = g.beat; fired = 0; }

      if (p.stopped || !model) continue;

      let seen = false;
      for (let k = 0; k < fired; k++) {
        if (samePoint(FIRED[k], g.target)) { seen = true; break; }
      }
      if (seen) continue;
      if (fired < FIRED.length) FIRED[fired++] = g.target;

      // Who else at this beat is playing this same point, and does one of them
      // sound it? If so that one's kind is what happened to the instrument.
      let voice = g;
      if (!p.sounds.has(g.effector)) {
        for (let j = at + 1; j < gs.length && gs[j]!.beat === g.beat; j++) {
          const o = gs[j]!;
          if (p.sounds.has(o.effector) && samePoint(o.target, g.target)) { voice = o; break; }
        }
      }

      /**
       * The bow's stroke, turned exactly where the model is told about it.
       *
       * Not beside this call and not earlier in the loop, both of which this
       * has been. The model runs the same state machine on the same `react`,
       * and the only way to be sure the two never diverge is for the one event
       * to drive both — a stopped player's `react` never arrives, so a flip
       * that happened above the `p.stopped` guard would leave the runtime's
       * direction inverted against the model's for the rest of the number.
       *
       * Once per frame, because `react` is called once per *point* and a double
       * stop is two points on one bow: flipping per gesture made the stroke
       * direction depend on the parity of the chord, so a two-note chord never
       * reversed and a three-note one did. The models guard the same case by
       * `now`, which is this frame's beat for every call in it.
       *
       * Rests are the bow *leaving* the string, which is not a stroke; the
       * models return early on one, so this does too — and it walks the travel
       * home to the middle of the hair rather than freezing it out at the end
       * of the stroke it happened to stop on.
       */
      if (!turned && voice.effector === 'bow') {
        turned = true;
        const rest = g.target.kind === 'rest';
        if (!rest && voice.kind !== 'hold') p.stroke = -p.stroke;
        // The same expression the models evaluate, down to the fallback: a
        // release trimmed to nothing by the next gesture's windup would
        // otherwise send the two of them to different spans.
        const span = Math.min(Math.max(
          voice.release > 0 ? voice.release : p.bowSpan, BOW_SPAN_MIN,
        ), BOW_SPAN_MAX);
        const from = this.bowLean(p, beat);
        let to = 0;
        if (!rest) {
          // Length × force, floored and capped, and out of bow turns round
          // rather than pinning. The models run the identical arithmetic off
          // the identical inputs — see `BOW_TRAVEL`.
          const dist = Math.min(Math.max(
            BOW_SPEED * span * (0.4 + 0.6 * voice.force), BOW_MIN_STROKE,
          ), BOW_TRAVEL * 2);
          to = from + p.stroke * dist;
          if (to > BOW_TRAVEL || to < -BOW_TRAVEL) {
            p.stroke = -p.stroke;
            to = from + p.stroke * dist;
          }
        }
        p.bowFrom = from;
        p.bowTo = Math.min(Math.max(to, -BOW_TRAVEL), BOW_TRAVEL);
        p.bowAt = beat;
        p.bowSpan = span;
      }

      // `voice.release` is how long the effector stays on this point, and it is
      // the *same* number `arcOf` runs the bow hand out along. Handing it over
      // is what stops the model and the runtime estimating one note's length
      // twice and disagreeing about it. See `InstrumentModel.react`.
      model.react(g.target, voice.force, beat, voice.kind, voice.release);
    }
  }

  /**
   * Where along the current stroke the bow hand is, in metres, at `beat`.
   *
   * The same curve the models run their own bow out along, over the same span,
   * from the same two ends — see `BOW_TRAVEL`. Continuous across notes and
   * across the gaps between them: past the end of a stroke it simply holds at
   * `bowTo` until the next note gives it somewhere else to be.
   */
  private bowLean(p: Player, beat: number): number {
    if (p.bowFrom === p.bowTo) return p.bowTo;
    const s = p.bowSpan > 0 ? clamp01((beat - p.bowAt) / p.bowSpan) : 1;
    return p.bowFrom + (p.bowTo - p.bowFrom) * smooth(s);
  }

  // -- geometry ------------------------------------------------------------

  /**
   * This gesture's contact, in world space: position into `V1`, normal into
   * `V2`. `false` when the model does not know the point.
   *
   * Resolved once, on the frame the gesture first becomes live, and cached in
   * the model's local frame. The contract makes that legal — `resolve` is pure
   * and must answer the same regardless of what has been played — and it is
   * what keeps the per-frame allocation at zero, since every model returns
   * freshly built vectors.
   *
   * The cache is a cache of the instrument *at rest*. Anything on it that moves
   * is declared through `InstrumentModel.shift` and composed back in here, every
   * frame, before the world transform — so a hand on a moving part rides it
   * exactly, rather than being placed where the part was when the note landed
   * and left there while it travels out from under.
   */
  private contactOf(p: Player, i: number, g: Gesture, beat: number): boolean {
    const state = p.resolved[i]!;
    if (state === 2) return false;
    if (state === 0) {
      const model = p.model;
      const c = model?.resolve(g.target, g.effector);
      if (!c) { p.resolved[i] = 2; return false; }
      const at = i * CONTACT_STRIDE;
      p.contact[at] = c.position.x;
      p.contact[at + 1] = c.position.y;
      p.contact[at + 2] = c.position.z;
      const n = V1.copy(c.normal);
      if (n.lengthSq() < 1e-10) n.set(0, 1, 0); else n.normalize();
      p.contact[at + 3] = n.x;
      p.contact[at + 4] = n.y;
      p.contact[at + 5] = n.z;
      // The knuckle axis, when the model pins it. Zero means "you choose".
      const a = c.along;
      p.contact[at + 6] = a ? a.x : 0;
      p.contact[at + 7] = a ? a.y : 0;
      p.contact[at + 8] = a ? a.z : 0;
      p.resolved[i] = 1;
      this.learnZone(p, g.effector, at);
    }
    const at = i * CONTACT_STRIDE;
    V1.set(p.contact[at]!, p.contact[at + 1]!, p.contact[at + 2]!);
    V2.set(p.contact[at + 3]!, p.contact[at + 4]!, p.contact[at + 5]!);
    V5.set(p.contact[at + 6]!, p.contact[at + 7]!, p.contact[at + 8]!);
    if (this.shiftOf(p, g.effector, beat)) {
      V1.applyMatrix4(M1);
      V2.applyQuaternion(Q2);
      if (V5.lengthSq() > 1e-10) V5.applyQuaternion(Q2);
    }
    V1.applyMatrix4(p.world);
    V2.applyQuaternion(p.worldQuat).normalize();
    if (V5.lengthSq() > 1e-10) V5.applyQuaternion(p.worldQuat).normalize();
    return true;
  }

  /**
   * Where the moving part this effector works on has got to, into `M1`, with
   * its rotation into `Q2`. `false` when nothing under it moves, which is the
   * answer for every model but the accordion and costs one absent method call.
   *
   * The displacement is in the model's own frame and composes *inside* the world
   * transform, because a bellows opens the same way whether the player it is
   * strapped to is standing still or swaying — rule 5, from the other side.
   */
  private shiftOf(p: Player, e: Effector, beat: number): boolean {
    if (!p.model?.shift?.(e, beat, M1)) return false;
    Q2.setFromRotationMatrix(M1);
    return true;
  }

  /**
   * Remember that this effector plays *there*, in the model's local frame.
   *
   * A running mean, capped at `ZONE_MEMORY` so it becomes an exponential one
   * and a hand that moves to the ride for a solo eventually idles over the
   * ride. The normal is averaged alongside the position, because a hand
   * hovering over a hi-hat wants the hat's attitude and not the snare's.
   *
   * Called exactly once per gesture, on the frame it first resolves, so this
   * costs nothing per frame and nothing at all for a gesture never reached.
   *
   * The chest is in here for a different reason than the hands: it does not
   * hover over its zone, it *leans about* it. See `leanTo`.
   */
  private learnZone(p: Player, e: Effector, at: number): void {
    const s = SLOT_OF[e];
    // Hands, the bow hand, and the chest.
    if (s !== 0 && s !== 1 && s !== 5 && s !== SLOT_OF.body) return;
    const slot = p.slots[s]!;
    const n = slot.zoneCount < ZONE_MEMORY ? slot.zoneCount : ZONE_MEMORY;
    const k = 1 / (n + 1);
    slot.zone.x += (p.contact[at]! - slot.zone.x) * k;
    slot.zone.y += (p.contact[at + 1]! - slot.zone.y) * k;
    slot.zone.z += (p.contact[at + 2]! - slot.zone.z) * k;
    slot.zoneN.x += (p.contact[at + 3]! - slot.zoneN.x) * k;
    slot.zoneN.y += (p.contact[at + 4]! - slot.zoneN.y) * k;
    slot.zoneN.z += (p.contact[at + 5]! - slot.zoneN.z) * k;
    slot.zoneA.x += (p.contact[at + 6]! - slot.zoneA.x) * k;
    slot.zoneA.y += (p.contact[at + 7]! - slot.zoneA.y) * k;
    slot.zoneA.z += (p.contact[at + 8]! - slot.zoneA.z) * k;
    slot.zoneCount++;
  }

  /**
   * Where this gesture wants its effector *now*, into `V4`.
   *
   * Reads the contact from `V1` and the normal from `V2`, which `contactOf`
   * has just filled in. The curves themselves are in `animate-arc.ts`; what is
   * decided here is how much of each a given gesture gets.
   */
  private arcOf(p: Player, i: number, g: Gesture, tau: number, target: Effector): void {
    const slot = p.slots[SLOT_OF[target]]!;

    /**
     * The stroke, moved onto the *contact* rather than added to the arc's
     * result — which is where it used to be, and being there is what made the
     * windup fight it.
     *
     * The bow is somewhere along its travel before the note starts as well as
     * after it, so the point the hand is winding up toward is the frog *where
     * the frog will be*, not where it would be if the bow were parked in the
     * middle of the hair. Applied here, the whole arc — anchor, travel, lift,
     * release — is measured against the right place, and the invariant that
     * matters holds: at `tau === 0` the hand is exactly on the frog, and the
     * model has put the frog exactly there.
     *
     * Along `V5`, which `contactOf` has just filled with the contact's own
     * knuckle axis — down the stick. See `BOW_TRAVEL` for why that is not the
     * player's lateral axis. A model that pinned no axis leaves `V5` zero and
     * gets no stroke, which is the right answer for a bow nobody described.
     */
    if (target === 'bow') V1.addScaledVector(V5, this.bowLean(p, g.beat + tau));

    // The windup's anchor: wherever the limb actually was when the windup
    // began, captured once. Re-reading it every frame would feed the arc back
    // into itself and the hand would crawl. Stored in the model's local frame,
    // so a windup that starts on one side of a sway and lands on the other
    // still anchors to a point on the *instrument* — see rule 5.
    if (!p.anchored[i]) {
      const at3 = i * 3;
      if (slot.hasLast) {
        V3.copy(slot.last);
      } else {
        const side: number = handSideOf(target);
        if (side >= 0 && p.goalOk[side]!) this.toLocal(p, p.goal[side]!, V3);
        else this.toLocal(p, p.rig.restPosition(target, V6), V3);
      }
      p.anchor[at3] = V3.x; p.anchor[at3 + 1] = V3.y; p.anchor[at3 + 2] = V3.z;
      p.anchored[i] = 1;
    }
    const at = i * 3;
    V3.set(p.anchor[at]!, p.anchor[at + 1]!, p.anchor[at + 2]!).applyMatrix4(p.world);

    const vary = p.vary[i]!;
    const lifts = LIFT[g.kind];
    // Two sources of scatter, and they answer different complaints: `vary` is
    // per gesture, so one hand never plays two identical strokes, and
    // `varyApex` is per limb, so the two hands are at different phases of their
    // own arcs even when the score puts them on the same beat.
    const apex = apexOf(g.kind, g.force, 0.6 * vary + 0.8 * slot.varyApex);
    const travel = Math.min(V3.distanceTo(V1), MAX_TRAVEL);
    // Read by index rather than destructured: array destructuring goes through
    // the iterator protocol, which is one more thing V8 has to prove it can
    // skip in a function that runs for every live gesture of every player.
    let lift = (lifts[0] + lifts[1] * g.force + lifts[2] * travel)
      * slot.varyLift * (1 + 0.10 * vary);
    // Gravity, which is the only reason a fast passage looks like a fast
    // passage. Everything after the apex is a fall, so that is the time the
    // limb has to get back down from wherever it went.
    const ceiling = liftCeiling(((1 - apex) * g.prep) / this.beatsPerSecond);
    if (lift > ceiling) lift = ceiling;

    if (tau < 0) {
      // The windup: out and up while the limb is high, a hang at the apex, then
      // a fall that is still accelerating when it arrives.
      const s = g.prep > 0 ? clamp01(1 + tau / g.prep) : 1;
      V4.lerpVectors(V3, V1, reach(s, apex, coverOf(g.kind), snapOf(g.kind, g.force)));
      if (lift > 0) V4.addScaledVector(V2, lift * hop(s, apex));
      return;
    }

    // On the beat and after it. `tau === 0` puts the effector exactly on the
    // contact, which is the invariant this whole file exists to hold.
    const u = g.release > 0 ? clamp01(tau / g.release) : 1;
    V4.copy(V1);

    const rebound = lift * REBOUND[g.kind] * slot.varyBounce;
    if (SUSTAINS.has(g.kind)) {
      // Still on the note. Only the last of the release is a departure, and it
      // is a lift rather than a bounce — a finger leaves a key, it is not
      // thrown off it.
      const tail = (u - SUSTAIN_HOLD) / (1 - SUSTAIN_HOLD);
      if (tail > 0 && rebound > 0) V4.addScaledVector(V2, rebound * smooth(clamp01(tail)));
    } else if (rebound > 0) {
      V4.addScaledVector(V2, rebound * bounce(u));
    }
  }

  // -- frames --------------------------------------------------------------

  /** A point in the model's frame, into world space. Identity with no model. */
  private toWorld(p: Player, local: Vector3, out: Vector3): Vector3 {
    return out.copy(local).applyMatrix4(p.world);
  }

  /** The way back. See rule 5 for why every cache goes through this. */
  private toLocal(p: Player, world: Vector3, out: Vector3): Vector3 {
    return out.copy(world).applyMatrix4(p.worldInv);
  }

  // -- the three layers ----------------------------------------------------

  /** Play: whatever the gestures accumulated, blended and committed. */
  private commitPlay(p: Player, beat: number): void {
    for (let c = 0; c < COMMIT_ORDER.length; c++) {
      const e = COMMIT_ORDER[c]!;
      const slot = p.slots[SLOT_OF[e]]!;
      if (!slot.played || slot.weight <= 0) continue;

      const w = slot.weight;
      V1.set(slot.px / w, slot.py / w, slot.pz / w);
      V2.set(slot.nx, slot.ny, slot.nz);

      // Below full authority the gesture is arriving or leaving, and a limb
      // with a home to go to blends toward it. That crossfade *is* the handover
      // to the idle layer, so there is no frame where anything snaps. Measured
      // on `top` rather than on the sum: a triad is three gestures and one
      // motion, and summing them meant a chord never crossfaded at all.
      const side: number = handSideOf(e);
      if (slot.top < 1 && side >= 0 && p.goalOk[side]!) {
        V1.lerp(p.goal[side]!, 1 - slot.top);
      }

      /**
       * And a hand still on its way up plays from where it has got to.
       *
       * The play layer is otherwise absolute — being exactly on the contact
       * exactly on the beat is the invariant this file exists to hold — and
       * `engage` is the one thing allowed to bend it, because the alternative
       * is worse: a note that lands while the band is still standing up
       * teleports that hand from someone's hip to the snare in one frame.
       * Engaged, this is a no-op to the bit, so nothing about ordinary playing
       * pays for it.
       *
       * How far it bends is per hand, not per player: a flautist coming back up
       * is holding the flute the whole way, so the hand that never left it must
       * not be dragged back toward a hip it was never at. See `standDown`.
       */
      if (p.engage < 1 && side >= 0) {
        const letGo = this.standDown(p, side);
        if (letGo > 0) V1.lerp(this.atEaseHand(p, e, V3), letGo);
      }

      const hasNormal = V2.lengthSq() > 1e-8;
      if (hasNormal) V2.normalize();
      V4.set(slot.ax, slot.ay, slot.az);
      const hasAlong = V4.lengthSq() > 1e-8;
      if (hasAlong) V4.normalize();
      // The chest is commanded through `leanTo` and by a point on the *body*,
      // never by the point on the instrument the gesture named — and `last` is
      // still the point on the instrument, so the next gesture's windup anchors
      // in the same space this one aimed at rather than in the leaned one.
      if (e === 'body') p.rig.setEffector(e, this.leanTo(p, slot, V1, V3));
      else p.rig.setEffector(e, V1, hasNormal ? V2 : undefined, hasAlong ? V4 : undefined);
      this.toLocal(p, V1, slot.last);
      slot.hasLast = true;
      // Where the wrist actually ended up, so the idle layer can turn it home
      // rather than dropping it. Stored in the model's frame like everything
      // else, so a carried instrument turns the hand with it.
      if (hasNormal) {
        slot.norm.copy(V2).applyQuaternion(p.worldQuatInv).normalize();
        slot.hasNorm = true;
      }
      if (hasAlong) {
        slot.along.copy(V4).applyQuaternion(p.worldQuatInv).normalize();
        slot.hasAlong = true;
      }
      slot.idling = false;
      slot.idleSince = beat;
      if (e === 'bow') this.handOver(p, SLOT_OF.bow, SLOT_OF['right-hand'], beat);
    }
  }

  /**
   * Carry one hand's continuity from the slot that just drove it to the slot
   * that will drive it next.
   *
   * `bow` and `right-hand` are two effectors and **one hand** — `PART_OF` says
   * so — and the play layer writes to one of them while the idle layer writes
   * to the other. Everything that makes a limb continuous across the handover
   * lives per *slot*: where it was last put, the attitude it was put at, when
   * the idle hold started. So a bowed player's right hand crossed between the
   * two layers with none of it: the idle layer picked up `last` from wherever
   * that hand had been the previous time it idled — a whole note and up to
   * 17 cm of stroke ago — and `IDLE_FOLLOW_SECONDS` then pulled the hand most
   * of the way back to it for a frame before hauling it home again. Which is
   * the hand jumping somewhere and jumping back, once per note, all number.
   *
   * The reverse direction matters for the same reason and is less visible:
   * `arcOf` anchors a windup at the bow slot's `last`, so without this a
   * stroke wound up from where the previous stroke ended rather than from
   * where the hand actually is.
   *
   * Cheap enough to do unconditionally on a bowed player: three vector copies
   * and four flags, twice a frame, for the two models that have a bow.
   */
  private handOver(p: Player, from: number, to: number, beat: number): void {
    const a = p.slots[from]!;
    const b = p.slots[to]!;
    b.last.copy(a.last);
    b.hasLast = a.hasLast;
    b.norm.copy(a.norm);
    b.hasNorm = a.hasNorm;
    b.along.copy(a.along);
    b.hasAlong = a.hasAlong;
    // The receiving slot has not been drifting, whatever it thinks: this hand
    // was commanded this frame, so its idle hold starts from now.
    b.idling = false;
    b.idleSince = beat;
  }

  /**
   * A body gesture's target, turned into a lean, into `out`.
   *
   * `setEffector('body')` reads a point as "put the chest here", clamped at
   * 0.22 m, which is the right reading of the request and the wrong reading of
   * every gesture anybody actually emits on this effector. There is one, the
   * accordion's `squeeze`, and the model answers it with the bass strap —
   * *correctly*, because that is where the arm pulls. But the strap is half a
   * metre from the chest and always on the same side of it, so placed literally
   * the player lurched to the clamp on the frame a squeeze went live and drifted
   * back on the frame it ended, several times a phrase, taking the instrument
   * strapped to them along with it. That is the swing to one side.
   *
   * What the gesture carries is not a place but a *travel*: the strap is where
   * it is because the box is as open as it is. So the lean is measured from the
   * mean of everywhere this effector has been sent — `learnZone`, which the
   * hands have used to the same end since it existed — and it comes out zero in
   * the middle of the bellows' range, one way as the box opens and the other as
   * it closes, which is what a torso working a box does. An effector the model
   * has barely answered yet leans nowhere, which is also right.
   */
  private leanTo(p: Player, slot: Slot, target: Vector3, out: Vector3): Vector3 {
    p.rig.restPosition('body', out);
    if (slot.zoneCount < ZONE_MIN) return out;
    this.toWorld(p, slot.zone, V6);
    V6.subVectors(target, V6).multiplyScalar(BODY_LEAN).clampLength(0, LEAN_REACH);
    return out.add(V6);
  }

  /**
   * Groove: what the body does whether or not it is playing.
   *
   * Additive where the rig separates the channels for us — `setSway` and
   * `setHeadNod` move the torso and everything resting, and a hand placed on a
   * snare stays on the snare because the snare did not sway — and yielding
   * where it shares a part with play. A drummer's tapping foot is not a
   * behaviour the groove score emits, but a keyboard player's `lean` and an
   * accordion's `squeeze` do share the torso, and play wins.
   */
  private groove(p: Player, beat: number, step: number): void {
    const want = p.stopped ? 0 : 1;
    p.gain += (want - p.gain) * (1 - Math.exp(-step / STOP_FADE_SECONDS));
    if (p.gain < 0.001) p.gain = 0;

    let nod = 0; let nodPhase = 0;
    let sway = 0; let swayPhase = 0;
    let eyes = 0;
    let watch: GrooveBehaviour | undefined;
    let watchAmp = 0;

    for (let b = 0; b < p.behaviours.length; b++) {
      const behaviour = p.behaviours[b]!;
      const amp = this.amplitude(p, b, beat) * p.gain;
      if (amp <= 0.0005 && behaviour.kind !== 'watch') continue;

      const phase = this.phaseOf(p, behaviour, beat);
      switch (behaviour.kind) {
        case 'head-nod':
          if (amp > nod) { nod = amp; nodPhase = phase; }
          break;
        case 'body-sway':
          if (amp > sway) { sway = amp; swayPhase = phase; }
          break;
        case 'eyes-shut':
          if (amp > eyes) eyes = amp;
          break;
        case 'foot-tap': {
          const part = PART_OF[behaviour.effector];
          if (p.busy[part]) break;
          const slot = p.slots[SLOT_OF[behaviour.effector]]!;
          p.rig.restPosition(behaviour.effector, V1);
          // Down on the beat, up between: the foot is on the floor when the
          // pulse lands, which is the whole gesture.
          V1.y += TAP_LIFT * amp * (0.5 - 0.5 * Math.cos(phase));
          p.rig.setEffector(behaviour.effector, V1);
          this.toLocal(p, V1, slot.last);
          slot.hasLast = true;
          slot.idling = false;
          slot.idleSince = beat;
          p.busy[part] = true;
          break;
        }
        case 'lean': {
          if (p.busy[PART_OF.body]) break;
          p.rig.restPosition('body', V1);
          V2.set(0, 0, 1).applyQuaternion(p.rigQuat);
          V1.addScaledVector(V2, LEAN_REACH * amp * (0.5 + 0.5 * Math.sin(phase)));
          p.rig.setEffector('body', V1);
          p.busy[PART_OF.body] = true;
          break;
        }
        case 'watch':
          if (amp > watchAmp) { watchAmp = amp; watch = behaviour; }
          break;
      }
    }

    /**
     * The count-in, which overrides all of the above for as long as it lasts.
     *
     * The leader beats time — one nod per beat, in the tempo the number is
     * about to be in — and everybody else watches them. Both halves matter: a
     * leader nodding at a band that is looking elsewhere is a man with a tic,
     * and it is the *watching* that makes an audience understand that
     * something is about to happen.
     *
     * On the show clock rather than on `beat`, because for most of a count-in
     * there is no beat: the transport does not start until the cue has been
     * given. See `show.ts`, which runs the clock backwards of zero until then.
     */
    const lead = this.counting();
    if (lead === p) {
      nod = Math.max(nod, COUNT_NOD);
      nodPhase = this.seconds * this.beatsPerSecond * Math.PI * 2;
    }

    p.rig.setSway(sway, swayPhase);
    p.rig.setHeadNod(nod, nodPhase);
    p.rig.setEyesClosed(eyes);

    // A head can only be turned toward one person, so the score emits one
    // `watch` per soloist with non-overlapping spans and the loudest wins.
    const watched = watch && watchAmp > 0.02
      ? this.byId.get(watch.targetPerformerId ?? '')
      : undefined;
    const target = lead && lead !== p ? lead : watched;
    if (target && target !== p) {
      target.rig.restPosition('head', p.look);
      p.rig.lookAt(p.look);
    } else {
      p.rig.lookAt(undefined);
    }
  }

  /**
   * Idle: mostly the absence of a command, and occasionally the instrument's
   * own idea of where a hand belongs.
   *
   * A hand holds the last thing it played for about two thirds of a second —
   * long enough that a hand does not run home between two crotchets — and then
   * drifts to `resolve({kind:'rest'})`, because a guitarist's hands belong on
   * the guitar and only the guitar knows where that is. Where the model has no
   * answer the command simply stops and the rig eases the limb home on its own,
   * which is positionally continuous because the rig eases from wherever the
   * limb actually is.
   *
   * Feet are exempt from the drift. Several models answer `rest` with one
   * contact meant for a hand, and a foot that wandered up to a hi-hat would be
   * worse than a foot that stayed on its pedal.
   */
  private idle(p: Player, beat: number, step: number): void {
    for (let k = 0; k < 4; k++) {
      const e = EFFECTORS[k]!;
      if (p.busy[PART_OF[e]]) continue;
      const slot = p.slots[SLOT_OF[e]]!;

      if (k >= 2) {
        // A foot stays on its pedal. It is never drifted to the model's `rest`,
        // which on a kit is a contact meant for a hand — a foot that wandered
        // up to a hi-hat would be worse than one that stayed put — and a foot
        // that has never been placed is left entirely alone, so the rig rests
        // it under the body where it belongs.
        if (!slot.hasLast) continue;
        p.rig.setEffector(e, this.toWorld(p, slot.last, V1));
        continue;
      }

      if (!p.goalOk[k]) {
        // The instrument has nothing to say about this hand. Stop commanding
        // it: the rig eases the limb to its own rest, which is live, rides the
        // groove and is separated left from right on its side of the seam. The
        // previous version kept commanding the last position forever, so a hand
        // whose model had no answer froze in mid-air for the whole number.
        slot.idling = false;
        slot.hasLast = false;
        slot.hasNorm = false;
        slot.hasAlong = false;
        continue;
      }

      if (!slot.idling) {
        if (slot.hasLast) slot.idleFrom.copy(slot.last);
        else this.toLocal(p, p.goal[k]!, slot.idleFrom);
        slot.idling = true;
      }

      // Hold what was last played, then drift home. Both ends are in the
      // model's frame, so the whole drift rides a carried instrument.
      this.toWorld(p, slot.idleFrom, V1);
      const held = beat - slot.idleSince;
      const t = smooth(clamp01((held - this.idleHold) / this.idleEase));
      if (t > 0) V1.lerp(p.goal[k]!, t);

      // A share of the body's sway, for a hand the instrument is not already
      // carrying. `restPosition` is live; subtracting a slow average of it
      // leaves the sway with the posture taken out.
      if (p.ridesSway) {
        p.rig.restPosition(e, V2);
        if (!slot.hasSwayRef) { slot.swayRef.copy(V2); slot.hasSwayRef = true; }
        else slot.swayRef.lerp(V2, 1 - Math.exp(-step / SWAY_REFERENCE_SECONDS));
        V1.addScaledVector(V2.sub(slot.swayRef), IDLE_SWAY_FOLLOW);
      }

      // Nothing may step. The drift above is smooth but the *goal* is not — a
      // fingering changes from one note to the next — so a short follow turns a
      // jump into a finger moving. It costs the drift no measurable lag.
      if (slot.hasLast) {
        V1.lerp(this.toWorld(p, slot.last, V6), Math.exp(-step / IDLE_FOLLOW_SECONDS));
      }

      // And the wrist turns home rather than snapping there on the frame the
      // release ends — both axes of it. Passing only the normal leaves the roll
      // to whatever the rig's fallback produces, and for a wind player, whose
      // hands are placed through this path and no other, that is the difference
      // between fingers on the keys and fingers across them.
      const ease = 1 - Math.exp(-step / NORMAL_EASE_SECONDS);
      slot.hasNorm = settleAxis(slot.norm, p.goalNormal[k]!, slot.hasNorm, ease);
      slot.hasAlong = settleAxis(slot.along, p.goalAlong[k]!, slot.hasAlong, ease);

      const norm = slot.hasNorm
        ? V3.copy(slot.norm).applyQuaternion(p.worldQuat).normalize() : undefined;
      const along = slot.hasAlong
        ? V7.copy(slot.along).applyQuaternion(p.worldQuat).normalize() : undefined;

      /**
       * At ease: the same drift, with somewhere else to drift to.
       *
       * Not a separate branch, and that is the point — a hand standing down is
       * a hand whose target moved, so it arrives by the machinery already
       * here rather than by a second path that has to be kept in agreement
       * with this one. `restPosition` is the *body's* own idle, which is live,
       * rides the groove and is already separated left from right, so a
       * disengaged pair of hands ends up by the hips of a person who is still
       * breathing.
       *
       * The attitude has to go with it. A hand released from a key bed that
       * keeps the key bed's normal arrives at the hip palm-down and rigid, so
       * the two axes are turned toward the rig's own resting attitude — palm
       * down the body, knuckles across it — over the same fraction.
       */
      // Per hand, because a hand that is still holding the instrument has not
      // stood down at all — it has come down *with* it, and the model's own
      // rest contact has already moved to where the instrument now is. See
      // `standDown` and `AtEasePose.hands`.
      const down = this.standDown(p, k);
      if (down > 0.001) {
        this.atEaseHand(p, e, V2);
        V1.lerp(V2, down);
        // And the blended point, not just its destination — see `escape`.
        this.escape(p, V1, down);
        if (norm) norm.lerp(V6.set(0, 1, 0).applyQuaternion(p.rigQuat), down).normalize();
        if (along) along.lerp(V6.set(1, 0, 0).applyQuaternion(p.rigQuat), down).normalize();
      }

      p.rig.setEffector(e, V1, norm, along);
      this.toLocal(p, V1, slot.last);
      slot.hasLast = true;
      // The other half of the same hand. See `handOver`.
      if (k === 1 && p.usesBow) this.handOver(p, SLOT_OF['right-hand'], SLOT_OF.bow, beat);
    }
  }

  /**
   * Where both hands idle this frame, into `Player.goal` — separated.
   *
   * The complaint this answers is "the drummer's hands are on top of each
   * other", and there are two things wrong when that happens. The first is that
   * fourteen of the twenty-two models take no notice of `resolve`'s `effector`
   * parameter at all — a drum is struck where it is struck, so they never
   * needed to — and answer `{kind:'rest'}` with one point for both hands. The
   * second is subtler: even pushed apart, one point in front of a drum kit is
   * not where either hand belongs.
   *
   * So: ask per hand, which is the model's chance to be specific and is what
   * `withSoundingContact` already exploits for the whole string family. If the
   * two answers really are one answer, pull each hand toward the part of the
   * instrument *that hand plays* — the runtime has been resolving that hand's
   * contacts all number and their mean is already sitting there — and then
   * guarantee a gap. A model that separated its own hands is left alone
   * entirely; this only ever fires where the model declined to choose.
   */
  private idleGoals(p: Player, beat: number): void {
    for (let k = 0; k < 2; k++) {
      const e: Effector = k === 0 ? 'left-hand' : 'right-hand';
      // A bowed player's right hand idles where the bow lives, not where a
      // pizzicato finger would.
      //
      // Asked once per hand, which is what `resolve`'s `effector` parameter is
      // for and is now load-bearing: every wind and brass model answers the two
      // hands differently — one supports the instrument, the other fingers it —
      // where they all used to return one contact and leave both palms in the
      // same place.
      const ask: Effector = k === 1 && p.usesBow ? 'bow' : e;
      p.goalOk[k] = this.idleContact(
        p, ask, beat, p.goal[k]!, p.goalNormal[k]!, p.goalAlong[k]!,
      );
    }
    // And the bow hand idles at the frog, which is wherever the stroke left it.
    // `soundingContact({rest})` answers for a bow at the middle of its hair —
    // it has to, being pure — so without this the hand drifts to the middle of
    // a bow that is still lying out at the end of the last stroke.
    //
    // Down the stick, as in `arcOf`, so that the idle answer and the played one
    // are displaced along the same axis by the same number and the handover
    // between them moves nothing. `goalAlong` is in the model's frame, like
    // everything else the runtime remembers — rule 5.
    if (p.usesBow && p.goalOk[1] && p.goalAlong[1]!.lengthSq() > 1e-10) {
      p.goal[1]!.addScaledVector(
        V6.copy(p.goalAlong[1]!).applyQuaternion(p.worldQuat).normalize(),
        this.bowLean(p, beat),
      );
    }
    if (!p.goalOk[0] || !p.goalOk[1]) return;

    const left = p.goal[0]!;
    const right = p.goal[1]!;

    // **A model that answered the two hands differently has already decided,
    // and nothing below runs.** That test is the whole safety of this method.
    // Every string model has answered per hand since `withSoundingContact`, and
    // all seven wind and brass models now do too; a runtime that "improved" on
    // them would put a flautist's hands on the wrong sides of the tube, because
    // separating a pair by the performer's lateral axis assumes nobody had a
    // better idea and on those instruments somebody did.
    if (left.distanceTo(right) >= COINCIDENT) return;

    // One answer, twice. Each hand goes to the surface it actually plays,
    // hovering off it rather than resting on it — a hand at a drum head's
    // contact point is half inside the drum.
    for (let k = 0; k < 2; k++) {
      const slot = p.slots[SLOT_OF[k === 0 ? 'left-hand' : (p.usesBow ? 'bow' : 'right-hand')]]!;
      if (slot.zoneCount < ZONE_MIN) continue;
      this.toWorld(p, slot.zone, V6);
      // A mean of normals can cancel — a hand that plays a hat and a snare
      // pointing opposite ways — so a short one is no answer rather than a
      // direction to normalise into noise.
      V7.copy(slot.zoneN);
      const aimed = V7.lengthSq() > 0.04;
      if (aimed) {
        V7.applyQuaternion(p.worldQuat).normalize();
        V6.addScaledVector(V7, IDLE_HOVER);
      }
      p.goal[k]!.lerp(V6, ZONE_PULL);
      // The attitude follows the position: a hand moved to hover over the
      // snare wants the snare's normal, not the rest contact's, and the same
      // argument applies to the knuckle axis one line down.
      if (aimed) p.goalNormal[k]!.copy(slot.zoneN).normalize();
      if (slot.zoneA.lengthSq() > 0.04) p.goalAlong[k]!.copy(slot.zoneA).normalize();
    }

    // Whatever the zones did or did not manage, two hands may not occupy one
    // point — and how far apart "not one point" is depends on how big this
    // performer's hands are, which is the rig's business and not this file's.
    // `separateRest` puts a shared point onto a given hand's side of the body
    // and guarantees the pair a hand's width and a bit; asking it for both
    // hands from the *midpoint* gives the gap it considers acceptable, and if
    // the zones have already opened a wider one than that they stand.
    V6.addVectors(left, right).multiplyScalar(0.5);
    p.rig.separateRest('left-hand', V6, V7);
    p.rig.separateRest(p.usesBow ? 'bow' : 'right-hand', V6, V8);
    if (left.distanceTo(right) < V7.distanceTo(V8)) {
      left.copy(V7);
      right.copy(V8);
    }
  }

  /**
   * The instrument's idea of where this effector idles, into `out`, with its
   * surface normal into `outNormal`.
   *
   * `fingering` first, so a wind player's hands follow the pitch — the trumpet
   * model builds a contact per fingering precisely so the runtime has something
   * pitch-dependent rather than a constant — then `rest`. Cached by point
   * identity, because the `PlayPoint` objects in the IR are stable and
   * comparing references is free, and cached *per effector*, because that is
   * the whole point of passing one.
   */
  private idleContact(
    p: Player, e: Effector, beat: number,
    out: Vector3, outNormal?: Vector3, outAlong?: Vector3,
  ): boolean {
    const model = p.model;
    if (!model) return false;
    if (!p.occupiesHands && e !== 'left-foot' && e !== 'right-foot') return false;
    const slot = p.slots[SLOT_OF[e]]!;
    const point = p.fingering ?? REST_POINT;

    let hit = -1;
    if (slot.idleHint < slot.idleCount && slot.idlePoints[slot.idleHint] === point) {
      hit = slot.idleHint;
    } else {
      for (let j = 0; j < slot.idleCount; j++) {
        if (samePoint(slot.idlePoints[j], point)) { hit = j; break; }
      }
      if (hit >= 0) slot.idleHint = hit;
    }
    if (hit < 0) {
      // A miss is the only place this method is allowed to be expensive, and
      // there are at most a few dozen of them per instrument for the life of a
      // number. Full is not an error: the oldest entry is overwritten and the
      // point behind it will simply resolve again if it comes back.
      hit = slot.idleNext;
      slot.idleNext = (slot.idleNext + 1) % IDLE_CACHE;
      if (slot.idleCount < IDLE_CACHE) slot.idleCount++;
      slot.idleHint = hit;
      slot.idlePoints[hit] = point;
      const c = model.resolve(point, e);
      const at = hit * IDLE_STRIDE;
      if (!c) {
        slot.idleFlags[hit] = 2;
      } else {
        slot.idleFlags[hit] = 1;
        slot.idleLocal[at] = c.position.x;
        slot.idleLocal[at + 1] = c.position.y;
        slot.idleLocal[at + 2] = c.position.z;
        slot.idleLocal[at + 3] = c.normal.x;
        slot.idleLocal[at + 4] = c.normal.y;
        slot.idleLocal[at + 5] = c.normal.z;
        // Zero means "you choose", exactly as in `contactOf`.
        const a = c.along;
        slot.idleLocal[at + 6] = a ? a.x : 0;
        slot.idleLocal[at + 7] = a ? a.y : 0;
        slot.idleLocal[at + 8] = a ? a.z : 0;
      }
    }
    if (slot.idleFlags[hit] !== 1) return false;
    const at = hit * IDLE_STRIDE;
    // Cached at rest and shifted onto the moving part, exactly as in
    // `contactOf` — an idling hand rides the box too, or the handover between
    // the two layers would move it.
    const shifted = this.shiftOf(p, e, beat);
    out.set(slot.idleLocal[at]!, slot.idleLocal[at + 1]!, slot.idleLocal[at + 2]!);
    if (shifted) out.applyMatrix4(M1);
    out.applyMatrix4(p.world);
    if (outNormal) {
      outNormal.set(slot.idleLocal[at + 3]!, slot.idleLocal[at + 4]!, slot.idleLocal[at + 5]!);
      if (outNormal.lengthSq() > 1e-10) {
        if (shifted) outNormal.applyQuaternion(Q2);
        outNormal.normalize();
      } else outNormal.set(0, 0, 0);
    }
    if (outAlong) {
      outAlong.set(slot.idleLocal[at + 6]!, slot.idleLocal[at + 7]!, slot.idleLocal[at + 8]!);
      if (outAlong.lengthSq() > 1e-10) {
        if (shifted) outAlong.applyQuaternion(Q2);
        outAlong.normalize();
      } else outAlong.set(0, 0, 0);
    }
    return true;
  }

  // -- the face ------------------------------------------------------------

  /**
   * The singing mouth is two systems and they are blended, not chosen between.
   *
   * `choreograph.ts` emits one gesture per sung note carrying the vowel, the
   * consonant and a force — that is **timing and loudness**. `visemes.ts` owns
   * **shape**, as three continuous parameters and an onset measured in seconds
   * because articulation is physical and does not scale with tempo. Drive the
   * shape from the track, the amplitude from the gesture, and the mouth cannot
   * drift out of agreement with the voice, because both are readings of the
   * same notes.
   *
   * The mouth arrives at the shape *on the beat*, like every other effector,
   * having taken `onsetSeconds` to get there — so a 3 ms stop pops it open and
   * a 70 ms nasal eases into it. Between syllables it shuts, because
   * `blipBeats` says it does, and that gap is what makes a face read as singing
   * rather than as a hinge.
   */
  private face(p: Player, beat: number, blow: number, breath: number, force: number): void {
    if (!p.singer && !p.blown) return;

    let open = 0;
    let round = 0;
    let spread = 0;

    if (p.visemes.length) {
      const v = this.visemeAt(p, beat);
      if (v) {
        const onset = Math.max(1e-4, v.onsetSeconds * this.beatsPerSecond);
        const tau = beat - v.beat;
        let e: number;
        if (tau < 0) e = smooth(clamp01(1 + tau / onset));
        else if (tau <= v.holdBeats) e = 1;
        else e = 1 - smooth(clamp01((tau - v.holdBeats) / Math.max(this.closeBeats, 1e-4)));
        // Loudness opens the jaw; it does not change which vowel is being sung,
        // so the lips keep their shape.
        const loud = 0.6 + 0.4 * (force > 0 ? force : 0.6);
        open = v.open * e * loud;
        round = v.round * e;
        spread = v.spread * e;
      }
    } else if (p.blown && blow > 0) {
      // An embouchure: a small, tight, round aperture that firms up as the note
      // starts. Nothing here is a viseme — a trumpeter is not singing a vowel.
      open = 0.08 * blow;
      round = 0.30 + 0.35 * blow;
      spread = 0.06 * blow;
    }

    // The inhale. A singer who never breathes is the most uncanny thing that
    // can be put on a stage, and both sources of "there is a breath here" — the
    // choreographer's `breathe` gestures and the viseme track's spans — are
    // taken at their maximum rather than one being picked over the other.
    const depth = Math.max(breath, this.breathAt(p, beat));
    if (depth > 0) {
      open = Math.max(open, 0.34 * depth);
      round = Math.max(round, 0.42 * depth);
    }

    p.rig.setMouth(clamp01(open), clamp01(round), clamp01(spread));
  }

  /** The viseme whose window contains `beat`, or `undefined`. Cursored. */
  private visemeAt(p: Player, beat: number): Viseme | undefined {
    const vs = p.visemes;
    if (!vs.length) return undefined;
    let i = p.vCursor;
    if (i >= vs.length || vs[i]!.beat > beat + 2) i = 0;
    while (i + 1 < vs.length && vs[i + 1]!.beat <= beat) i++;
    p.vCursor = i;
    const v = vs[i]!;
    const onset = Math.max(1e-4, v.onsetSeconds * this.beatsPerSecond);
    if (beat < v.beat - onset) {
      // Before the first onset of all, or in the gap the cursor has not
      // reached: look one back rather than opening the mouth early.
      return undefined;
    }
    return beat <= v.beat + v.holdBeats + this.closeBeats ? v : undefined;
  }

  /** How deep the inhale is at `beat`, 0 when there is none. Cursored. */
  private breathAt(p: Player, beat: number): number {
    const bs = p.breaths;
    if (!bs.length) return 0;
    let i = p.bCursor;
    if (i >= bs.length || bs[i]!.fromBeat > beat + 2) i = 0;
    while (i + 1 < bs.length && bs[i + 1]!.fromBeat <= beat) i++;
    p.bCursor = i;
    const span = bs[i]!;
    if (beat < span.fromBeat || beat > span.toBeat) return 0;
    const width = Math.max(span.toBeat - span.fromBeat, 1e-4);
    const t = (beat - span.fromBeat) / width;
    // In and out over the span, so the chest is fullest as the phrase starts.
    return span.value * Math.sin(Math.PI * clamp01(t));
  }

  // -- hands ---------------------------------------------------------------

  /**
   * Hand shape, changed only where a gesture genuinely calls for it.
   *
   * `DEFAULT_HAND_POSES` is applied per archetype at build and is right almost
   * everywhere: a drummer's fists, a pianist's key hands, a guitarist's spread
   * left and picking right are all already what the gestures are about to ask
   * for, and overriding them from the gesture kind would *replace* a correct
   * pose with a generic one — a guitarist's fretting hand is `spread`, not
   * `keys`, however much `press` sounds like a keyboard.
   *
   * Two cases are genuinely not covered by the default, and both are a hand
   * doing something the archetype cannot know in advance.
   *
   * **A bowed instrument playing pizzicato.** The right hand's default is a bow
   * hold, because it is holding a bow, and for a whole pizzicato section it is
   * not. `HOLDING_POSES` is the test, for the reasons given there.
   *
   * **A keyboard hand, which changes shape on every chord.** `keys` is one
   * shape and a keyboard asks for a range of them: a single-note line is one
   * finger down with the rest lifted, a close triad is the resting curve, and a
   * four-note voicing is a hand opened out to its stretch. Before this, a
   * pianist's hands held the identical curve whether they were playing a melody
   * or a tenth, which is the sort of thing nobody points at and everybody sees.
   * The width comes from `Slot.spanMax` — geometry the play layer already had —
   * so no new channel crosses the seam and the choreographer is not asked which
   * shape it wants.
   *
   * Everything here is blended rather than snapped; the rig eases over about
   * 85 ms on top of it.
   */
  private poses(p: Player, step: number): void {
    /**
     * A hand at ease is not a hand in playing shape.
     *
     * `relax` beats the archetype default whenever the player has stood down,
     * and it beats it *first*, because a spread fretting hand hanging at
     * somebody's hip is a stranger picture than either the shape or the
     * position would be alone. It also carries the pose's `touch` back toward
     * the palm, which is what stops the rig placing a disengaged hand by its
     * fingertips at a point on the thigh nothing is touching.
     */
    for (let side = 0; side < 2; side++) {
      // Per hand: a hand that never let go of the instrument keeps the shape
      // that holds it. A clarinettist standing at ease with the horn in both
      // hands and both hands in `relax` is not holding anything.
      const down = this.standDown(p, side);
      // Only a hand whose default is `grip` — a hand that is *holding*
      // something — has anything to learn from the gesture kind. Every other
      // default already describes the action about to happen.
      let name: HandPoseId = 'pluck';
      let weight = p.holding[side] ? Math.min(1, p.pluck[side]!) : 0;

      if (p.keyed[side]) {
        /**
         * The span is followed only while the hand is *playing*.
         *
         * A hand between chords keeps the shape of the last one, which is what
         * a hand does and is also the only answer available: there is no width
         * to a rest. Easing toward zero in the gaps would close every pianist's
         * hands into a point twice a bar.
         */
        const slot = p.slots[SLOT_OF[side === 0 ? 'left-hand' : 'right-hand']]!;
        let s = p.span[side]!;
        if (slot.played) {
          s += (slot.spanMax - s) * (1 - Math.exp(-step / SPAN_TAU));
          p.span[side] = s;
        }
        if (s >= SPAN_PRESS) {
          name = 'reach';
          weight = clamp01((s - SPAN_PRESS) / (SPAN_REACH - SPAN_PRESS));
        } else {
          name = 'press';
          weight = PRESS_MAX * (1 - s / SPAN_PRESS);
        }
      }

      // Standing down beats anything the hand was shaped for. A spread fretting
      // hand — or a pianist's stretch — hanging at somebody's hip is a stranger
      // picture than either the shape or the position would be alone.
      if (down > weight) { name = 'relax'; weight = down; }
      // Quantised, because `setHandPose` builds a fresh blended pose below full
      // weight and this runs twice a frame per player.
      const q = Math.round(weight * 8) / 8;
      if (q === p.poseWeight[side] && name === p.poseName[side]) continue;
      p.poseWeight[side] = q;
      p.poseName[side] = name;
      const hand: BodySide = side === 0 ? 'left' : 'right';
      p.rig.setHandPose(hand, name, q);
    }
  }

  // -- groove maths --------------------------------------------------------

  /**
   * A behaviour's amplitude at `beat`, interpolated.
   *
   * `Span[]` is stepped on purpose — the section energy it comes from is
   * piecewise, and a chorus is simply bigger than an intro — and the IR carries
   * no easing hint because easing is a rendering decision. This is that
   * decision: each span's value is taken to hold at the span's *centre* and the
   * runtime lerps between centres, so the curve passes through every value the
   * score wrote and no body changes gear on a bar line.
   */
  private amplitude(p: Player, index: number, beat: number): number {
    const spans = p.behaviours[index]!.amplitude;
    if (!spans.length) return 0;
    let i = p.spanCursor[index]!;
    if (i >= spans.length || centreOf(spans[i]!) > beat + 8) i = 0;
    while (i + 1 < spans.length && centreOf(spans[i + 1]!) <= beat) i++;
    p.spanCursor[index] = i;

    const here = spans[i]!;
    const c0 = centreOf(here);
    if (beat <= c0) {
      if (i === 0) return here.value;
      const before = spans[i - 1]!;
      const c = centreOf(before);
      const t = clamp01((beat - c) / Math.max(c0 - c, 1e-6));
      return before.value + (here.value - before.value) * t;
    }
    const next = spans[i + 1];
    if (!next) return here.value;
    const c1 = centreOf(next);
    const t = clamp01((beat - c0) / Math.max(c1 - c0, 1e-6));
    return here.value + (next.value - here.value) * t;
  }

  /**
   * Where a behaviour is in its cycle, in radians.
   *
   * `GroovePart.phase` is a fixed offset in beats and is what stops the band
   * nodding in unison. `looseness` is added on top as a slow drift — a player
   * who keeps time loosely does not sit a constant distance off the beat, they
   * wander — and the wander is drawn from the performer's id, so two shows from
   * one seed nod identically.
   */
  private phaseOf(p: Player, behaviour: GrooveBehaviour, beat: number): number {
    const period = behaviour.periodBeats > 0 ? behaviour.periodBeats : 1;
    const wander = p.looseness * 0.06 * Math.sin(beat * 0.21 + p.drift);
    return ((beat + p.phase + wander) / period) * Math.PI * 2;
  }
}

// ---------------------------------------------------------------------------
// Small shared parts
// ---------------------------------------------------------------------------

/**
 * How much authority a gesture has right now, 0..1.
 *
 * Ramping in over the windup is what makes overlapping gestures crossfade
 * instead of stutter: the last frame of one release is already blending into
 * the next windup. Full at the beat, always. A sustaining kind holds its
 * authority for most of its release, because a finger stays on the key; a
 * ballistic one lets go across the whole bounce.
 */
/** How far above and below the resting hands a part still counts, in metres. */
const KEEP_OUT_BAND = 0.28;

/**
 * The parts of an instrument that an at-ease hand could end up inside, each as
 * a box in the model's **own** frame.
 *
 * `Box3.setFromObject` cannot be used for any of this: it answers in world
 * space, and a world box of a turned model is already inflated before anything
 * else touches it. So each mesh's own geometry box is carried up through the
 * transforms *between that mesh and the model root* — the mesh's world matrix
 * with the root's taken back off — where everything is axis-aligned and tight.
 *
 * Then thrown away unless it is near the hands. That prune is what makes a
 * per-mesh test affordable at all, and it is honest rather than merely cheap:
 * a hand at ease sits at one height, and a cymbal a metre above it or a
 * pedalboard a metre below it can never be the thing it is inside.
 *
 * Once per performer per number, at bind time.
 */
function keepOutParts(model: InstrumentModel, rig: PerformerRig): Box3[] | undefined {
  const root = model.root;
  root.updateWorldMatrix(true, true);
  const inv = new Matrix4().copy(root.matrixWorld).invert();

  // The band, from where this body's own hands actually come to rest.
  const left = rig.restPosition('left-hand', new Vector3()).applyMatrix4(inv);
  const right = rig.restPosition('right-hand', new Vector3()).applyMatrix4(inv);
  const lo = Math.min(left.y, right.y) - KEEP_OUT_BAND;
  const hi = Math.max(left.y, right.y) + KEEP_OUT_BAND;

  const parts: Box3[] = [];
  const rel = new Matrix4();
  root.traverse((o) => {
    const mesh = o as {
      isMesh?: boolean;
      geometry?: { boundingBox: Box3 | null; computeBoundingBox(): void };
      matrixWorld: Matrix4;
    };
    if (!mesh.isMesh || !mesh.geometry) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const g = mesh.geometry.boundingBox;
    if (!g) return;
    rel.multiplyMatrices(inv, mesh.matrixWorld);
    const box = g.clone().applyMatrix4(rel);
    if (box.isEmpty() || box.max.y < lo || box.min.y > hi) return;
    parts.push(box);
  });
  return parts.length ? parts : undefined;
}

function weightOf(g: Gesture, tau: number): number {
  if (tau < 0) {
    if (g.prep <= 0) return 0;
    return smooth(clamp01(1 + tau / g.prep));
  }
  if (g.release <= 0) return tau === 0 ? 1 : 0;
  const u = clamp01(tau / g.release);
  const hold = SUSTAINS.has(g.kind) ? SUSTAIN_HOLD : 0;
  if (u <= hold) return 1;
  return 1 - smooth(clamp01((u - hold) / (1 - hold)));
}

function centreOf(span: Span): number {
  return (span.fromBeat + span.toBeat) * 0.5;
}

/**
 * Ease a stored local axis toward the one the idle target wants, in place.
 *
 * Returns whether there is an axis at all, which is not the same question as
 * whether the ease did anything: a model that supplies no `along` should leave
 * the rig's own fallback in charge rather than be handed a zero vector, and the
 * two are told apart here rather than by every caller.
 */
function settleAxis(cur: Vector3, goal: Vector3, had: boolean, ease: number): boolean {
  if (goal.lengthSq() <= 1e-8) return false;
  if (!had) {
    cur.copy(goal);
  } else {
    cur.lerp(goal, ease);
    if (cur.lengthSq() > 1e-8) cur.normalize(); else cur.copy(goal);
  }
  return true;
}

/**
 * Which hand an effector is, or −1 for something that is not one.
 *
 * `bow` is the right hand — the rig says so — and the idle goals are indexed by
 * hand rather than by effector precisely so that a bow stroke crossfading out
 * lands on the same home a pizzicato right hand would.
 */
function handSideOf(e: Effector): number {
  if (e === 'left-hand') return 0;
  if (e === 'right-hand' || e === 'bow') return 1;
  return -1;
}

/**
 * Whether two play points are the same place on the same instrument.
 *
 * Field-wise over the union rather than a switch, so a new `PlayPoint` variant
 * cannot silently compare equal by having no case: every field any member
 * carries is compared, and `undefined === undefined` covers the ones this
 * variant does not have.
 */
function samePoint(a: PlayPoint | undefined, b: PlayPoint): boolean {
  if (!a || a.kind !== b.kind) return false;
  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  return x['midi'] === y['midi']
    && x['string'] === y['string'] && x['fret'] === y['fret']
    && x['voice'] === y['voice'] && x['which'] === y['which']
    // An accordion's two extra fields, and they are not decoration: the same
    // bass button at two bellows extensions is two *places*, because half the
    // instrument has moved between them. Leaving them out let the idle cache
    // answer a note with a contact built for a box that had since slid 20 cm.
    && x['open'] === y['open'] && x['at'] === y['at'] && x['bellows'] === y['bellows']
    // And the hi-hat pedal's, for the same reason: up and down are two places.
    && x['shut'] === y['shut']
    && x['vowel'] === y['vowel'] && x['consonant'] === y['consonant'];
}
