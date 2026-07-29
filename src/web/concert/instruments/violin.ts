/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Violin — four strings, no frets, a bow, and a job to do for six other parts.
 *
 * `ARCHETYPE_OF` sends `strings1`, `strings2`, `tremoloStrings`, `pizzStrings`
 * and `fiddle` here as well as `violin`: one player stands in for the whole
 * section, because three identical performers on one line reads as a rendering
 * bug rather than as an orchestra. That decision is made in `concert/`, but it
 * lands here as a quality bar — this model is on stage for more of the show
 * than any other string instrument, and it has to hold up.
 *
 * Two things make it read as a violin rather than as a small guitar:
 *
 *  - **The bridge is curved**, so the four strings sit on an arc. The stopping
 *    contact carries that arc in its height *and in its normal*, which is what
 *    lets a hand come at the E string from a different angle than the G. That
 *    is the whole reason `Contact.normal` exists.
 *  - **The bow is part of the instrument**, and the bowing hand is *on* it.
 *    See the bow section below: this was the thing the model got wrong.
 *
 * Build frame: `+x` bridge → nut, `+y` out of the belly, `+z` G string → E.
 * Low to high is `x × y` here as on every other string model — a front view
 * with the neck up puts the lowest string on the viewer's left — and on a
 * violin that lands on the player's right, which is the side the E string and
 * the frog are both on. (The cello and the upright bass are stood on end, so
 * the same `+z` lands on the player's *left* there. The order along it does
 * not change; only where it points does — see their files.)
 */

import {
  BoxGeometry, type BufferGeometry, CapsuleGeometry, CylinderGeometry,
  ExtrudeGeometry, Group, InstancedMesh, type Material, Matrix4, Mesh,
  MeshStandardMaterial, Quaternion, Shape, Vector3,
} from 'three';

import type { GestureKind, PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import {
  addTo, type Contact, type InstrumentBuilder, type InstrumentModel,
  type PlayerStation,
} from './types.js';

/** Sounding length, bridge to nut. A full-size violin. */
const MENSUR = 0.328;
const STRINGS = 4;
/**
 * How far up the fingerboard this model goes. Two octaves and a bit, which is
 * what the fingerboard physically covers and comfortably more than
 * `ARCHETYPES.violin.range` asks of the E string (76 → 96).
 */
const MAX_SEMITONES = 26;
const NUT_SPREAD = 0.0165;
const BRIDGE_SPREAD = 0.0340;
/** Radius of the bridge arc. Everything about string crossing follows from it. */
const ARC_R = 0.042;
const STRING_HEIGHT = 0.0042;
const FINGER_HEIGHT = 0.0095;
/** The bow lives between the bridge and the end of the fingerboard. */
const BOW_X = 0.042;

const BODY_TAIL = -0.195;
const BODY_LEN = 0.356;

// ---------------------------------------------------------------------------
// The bow
// ---------------------------------------------------------------------------

/**
 * How far the frog sits from the hair's midpoint, and how much hair there is.
 *
 * `FROG_Z` is the number this file used to get wrong. The bow hand holds the
 * *frog*, 35 cm from where the hair crosses the string — and `soundingContact`
 * used to return the crossing. The runtime places the bowing hand exactly where
 * the model says, so the hand sat in the middle of the stick with the bow
 * sawing past it. Every other complaint about "the hand should follow the bow"
 * is downstream of that one third of a metre.
 */
const FROG_Z = 0.352;
/** Half the hair. The crossing has to stay inside this or the bow is in mid-air. */
const HAIR_HALF = 0.350;
/** The hair floats this far over the string before the stroke settles it. */
const BOW_CLEAR = 0.004;

/**
 * The stroke: how far the bow may slide either side of the middle of its hair,
 * how fast it goes, and the least any one note is allowed to use.
 *
 * These are `BOW_TRAVEL`, `BOW_SPEED` and `BOW_MIN_STROKE` in
 * `web/concert/animate.ts` and they have to be the same three numbers. The
 * runtime owns the hand and slides it **down the stick** — `Contact.along`,
 * which this model publishes — and the model owns the bow and slides it the
 * same distance along itself, so the frog stays under the hand for nothing.
 *
 * They are copied rather than imported because the dependency runs the wrong
 * way — `animate.ts` imports the models, and a model that reached back into the
 * runtime would close a cycle for three floats. If the runtime's numbers change
 * these have to follow.
 *
 * ## What the law is, and what it was
 *
 * A note runs the bow `BOW_SPEED · span · force` further in whatever direction
 * the stroke is going, from **wherever the bow already is**, and never less than
 * `BOW_MIN_STROKE`; a `bow` reverses the direction first and a `hold` — a slur
 * — simply carries on. So the position along the hair is continuous for the
 * whole of a stroke and a slurred phrase is one long travel rather than several.
 *
 * ## Why the numbers are these numbers
 *
 * `BOW_SPEED` is set so that four beats at full force — the longest the
 * choreographer lets one stroke run before it forces a `bow` — is exactly the
 * `2 × BOW_LEAN` from one end of the travel to the other. So a semibreve draws
 * the whole bow and takes the whole note doing it, and a quaver draws a
 * fraction. `BOW_MIN_STROKE` then puts a floor under the fraction, because
 * below about a quarter of the travel a stroke stops reading as a stroke at
 * all: the eye sees a bow standing still on a moving arm.
 *
 * They were 0.055 and 0.034, and against a 0.70 m stick that was a bow moving
 * three centimetres a note. Worse, the runtime was sliding the hand along the
 * *player's lateral axis* rather than down the stick, and on a violin those are
 * 61° apart — so more than half of even that went into skewing the bow instead
 * of drawing it, and the answer to "does the bow move" was, correctly, no.
 */
const BOW_LEAN = 0.170;
const BOW_SPEED = 0.085;
const BOW_MIN_STROKE = 0.085;
/** How far the bow lifts off the string on a rest. A visible, small thing. */
const BOW_LIFT = 0.030;

/**
 * Standing down: the bow goes with the hand, because the hand is holding it.
 *
 * The bow is a child of the instrument, so when the runtime lowers a violin off
 * the chin the bow came down with it — still lying across the strings, still at
 * the playing angle, with nothing at the frog. The bowing arm had meanwhile gone
 * to the player's hip, which is what `AT_EASE` says it does. A bow held by
 * nobody, at the one moment there is time to look at it.
 *
 * So the carried pose is stated the way the object actually is: the frog in the
 * hand, the stick hanging off it. `carryBow` blends between that and the playing
 * pose, and it can only be the runtime that drives it — the hand's position is
 * the rig's business and the model has never been able to see it.
 *
 * `CARRY_FULL` is how far into the stand-down the bow is fully in the hand
 * rather than partly on the strings. Short, and short on purpose: the two ends
 * of the blend are a few centimetres apart at the moment it starts — the model's
 * frog against wherever the idle layer has drifted the hand — so a blend that
 * took the whole stand-down would spend it visibly closing that gap. Past this
 * the frog *is* the hand and the two travel to the hip together.
 *
 * `FROG_DIR` is which way down the stick the frog lies in the pivot's own frame.
 * `+z` here and `−z` on the cello, which is the whole reason it is a constant
 * and not a literal — see the note on `bow.position` in `placeBow`.
 */
const CARRY_FULL = 0.5;
const FROG_DIR = new Vector3(0, 0, Math.sign(FROG_Z));
/** Frog to tip. The stick is a shade longer; this is the part that can hit. */
const BOW_REACH = Math.abs(FROG_Z) * 2;
/** The tip clears the boards by this much, which is what tilts a low bow up. */
const BOW_FLOOR = 0.10;

// Scratch for the carry, which runs per frame per bowed player and may not
// allocate. See `hangBow`.
const C1 = new Vector3();
const C2 = new Vector3();
const C3 = new Vector3();
const CM = new Matrix4();
const CQ = new Quaternion();

/**
 * The runtime's own easing, because the bow has to ride the same curve.
 *
 * `animate.ts` runs the hand along the stroke by this curve, over the `release`
 * it hands here as `hold`, between the same two ends — so the two are one curve
 * evaluated twice rather than two estimates of one. It used to guess the span
 * from the gap since the previous note, which is right for a legato line and
 * wrong for everything else: a whole note's stroke was over in the time the
 * last quaver took, and a short note after a long one crawled.
 *
 * An exponential settle was tried in place of the smoothstep and was worse: it
 * is fastest where the smoothstep is slowest, so the two disagreed most in the
 * first third of every note, which is where the eye is.
 */
function smooth(s: number): number {
  return s * s * (3 - 2 * s);
}
/**
 * Bounds on the span, for the fallback and against a nonsense `hold`.
 *
 * The ceiling is `MAX_SUSTAIN_BEATS` in `choreograph.ts`, which is the longest
 * follow-through anything is given and therefore the longest note `BOW_SPEED`
 * has to fill a whole bow across. It was three, which quietly meant a semibreve
 * drew three quarters of one.
 */
const SPAN_MIN = 0.15;
const SPAN_MAX = 4;

function mountBasis(alongStrings: Vector3, faceHint: Vector3, at: Vector3): Matrix4 {
  const x = alongStrings.clone().normalize();
  const y = faceHint.clone().addScaledVector(x, -faceHint.dot(x)).normalize();
  const z = new Vector3().crossVectors(x, y);
  return new Matrix4().makeBasis(x, y, z).setPosition(at);
}

/**
 * Where the jaw is, as a fraction of standing height.
 *
 * `performer-look.ts` builds a standing player out of four fractions of
 * `height`: the head has radius `0.078 h`, the shoulders sit at
 * `h − 2·headR − 0.026 h`, the head's centre `0.026 h + 0.96·headR` above that,
 * and the bottom of the head — the jaw — one radius below the centre. Multiply
 * it out and the whole chain collapses to `0.841 h`, with the collarbone at
 * `0.818 h` a shade under four centimetres below it. That gap is the neck, and
 * it is where a violin goes.
 *
 * Copied rather than imported for the same reason `BOW_LEAN` is: the rig knows
 * nothing about instruments and instruments know nothing about the rig, and one
 * fraction is a cheaper coupling than a shared module neither of them wants.
 */
const JAW_OF_HEIGHT = 0.841;

/**
 * How far the mount's origin sits above the top face of the chinrest.
 *
 * Measured off the chinrest mesh through the mount basis rather than guessed,
 * because it is the number that decides what "at the neck" means: put the mount
 * this far above the jaw and the chinrest's top face lands exactly on it.
 */
const CHINREST_RISE = 0.021;

/** The mean of casting's draw, for a caller that does not say. See `cast.ts`. */
const MEAN_HEIGHT = 1.75;

/**
 * Up on the shoulder, scroll out to the player's left and toward the house.
 *
 * ## Reading the translation
 *
 * It is **not** in the player's frame, and that is the trap. `show.ts` puts a
 * carried model's root at `−station.offset`, so where the bridge actually
 * lands is this plus `(0.16, 0, 0.14)`; the y is the exception, because
 * `offset.y` is zero and the root is dropped by the hip height, so the height
 * below is simply metres off the boards.
 *
 * ## Why the height is a function and not a number
 *
 * Because a violin is held *to a jaw*, and jaws are not all at one height.
 * This was `1.485` for every player on the stage, with a note calling that a
 * known limitation "about 40 mm out at each end of the range". The note was
 * wrong by an order of magnitude, which is why it survived: `cast.ts` draws
 * `1.58 + bell() × 0.34`, so the jaw runs from 1.329 to 1.615 — a spread of
 * 286 mm against a fixed chinrest at 1.457. A tall violinist had the
 * instrument **157 mm below their jaw**, flat on the sternum, and a short one
 * wore it up beside their ear. The mean was fine, which is all anyone had
 * measured.
 *
 * Anchored to the jaw, the chinrest's top face lands on it at every height and
 * the body hangs in the neck-to-collarbone band below. The extra 0.035 in z
 * carries it out from under the chin to where a jaw can close on it instead of
 * behind the throat.
 *
 * The basis is the same at every height — only the origin moves — so only the
 * two contact helpers have to be told which mount they are answering for.
 */
function mountFor(height: number): Matrix4 {
  return mountBasis(
    new Vector3(0.86, 0.10, 0.50),
    new Vector3(0.20, 0.90, 0.40),
    new Vector3(0.100, height * JAW_OF_HEIGHT + CHINREST_RISE, 0.095),
  );
}

/**
 * The axis the stopping hand's knuckles lie along: **down the fingerboard**.
 *
 * This was `(0, 0, 1)`, across the strings, and it was exactly backwards. The
 * rig builds the hand from `along × normal`, so an axis across the strings aims
 * the fingers *down the string toward the bridge* — the splint the old comment
 * here said it was preventing. It also puts the four knuckles across the four
 * strings, and a violinist's four fingers are not across the strings: they are
 * spaced up one of them, a semitone apart, which is what a position *is*.
 *
 * Then it was `+x`, bridge → nut, which is the right line and the wrong way
 * along it. The rig lays the fingers out with **the index at the `−along`
 * end**, so that put the first finger down at the bridge and the fourth up at
 * the nut — a hand playing its position backwards — and, because the same
 * vector sets the roll, it hung the palm over the G string with the fingers
 * dropping onto the board from above.
 *
 * `−x` is the same line run nut → bridge. The first finger takes the lowest
 * note of the position, which is what a position *is*, and the hand comes up
 * under the neck to do it: palm and thumb on the E side, fingertips reaching
 * across the strings toward the G. That is also why the elbow swings right to
 * play on the G — it is the far string from this hand, not the near one.
 */
const DOWN_BOARD = new Vector3(-1, 0, 0);

/**
 * How much further round the neck the hand rolls than the fingerboard turns.
 *
 * The arc under the strings is only 42 mm across, so between the G string and
 * the E the board's own surface turns by about 22° — and up at the nut, where
 * the strings are closest together, by 11°. Handing the hand that angle and
 * nothing else is honest about the *board* and wrong about the *player*: a
 * violinist crossing from the G string to the E rotates the whole forearm under
 * the instrument, and the wrist arrives somewhere visibly different. At 11° it
 * reads as no movement at all, which is the "it never rotates for the higher
 * strings" this exists to answer.
 *
 * The fingertip stays exactly on the string either way — the roll is about the
 * contact, not a translation of it — so amplifying it cannot put a finger
 * anywhere it should not be. It only decides where the rest of the hand hangs.
 */
const HAND_ROLL = 2.2;

/**
 * The positions a left hand actually stops in, as semitones above the open
 * string, and how far past one the hand leans before it shifts.
 *
 * This is the other half of "levels of highness per string". A violinist does
 * not slide continuously up the fingerboard a semitone at a time: the hand
 * *sits* in a position and four fingers cover a fourth from there, and it only
 * moves when the line runs off the top of what those fingers can reach. The
 * model used to send the hand to the stopped note itself, so it crept up and
 * down the neck by 18 mm on every step of a scale, which is a hand with no
 * position at all.
 *
 * Half, first, second, third … up to the top of the board. `REACH` is the span
 * from the first finger to the fourth, and `LEAN` is how much of that span the
 * hand itself takes up — a real hand does drift up as the fourth finger goes
 * down, it simply does not travel the whole way.
 */
const POSITIONS: readonly number[] = [1, 3, 5, 7, 9, 12, 14, 16, 19, 22, 26];
const REACH = 5;
const LEAN_INTO_REACH = 0.3;

/**
 * The nearest the stopping hand ever gets to the nut, in semitones.
 *
 * `stopX(0)` is the nut itself: it lands inside the 5 mm nut mesh, 6 mm short
 * of the end of the fingerboard, with the pegbox block beginning immediately
 * after. An open string resolves to exactly `fret === 0` — the four open
 * pitches are in `ARCHETYPES.violin.strings` and a generated line lands on
 * them constantly — so answering it
 * arithmetically parks the left hand in the pegs, and throws it 36 mm up the
 * neck and back on every other note in a phrase that touches an open string.
 * That is the "string hand placement looks wrong" in the report.
 *
 * A violinist does not move for an open string; the hand stays put, and the
 * furthest back it ever sits is half position, one semitone up, which is
 * 18 mm onto the board. Clamping rather than special-casing keeps the answer
 * continuous, which matters because `fret` is not an integer here — a
 * portamento slides through every value between two notes.
 */
const HALF_POSITION = 1;

/**
 * How far a waiting left hand's fingers sit above the strings, in metres.
 *
 * This was 22 mm, which is most of the width of the fingerboard, and it is the
 * number that made the hand look like it was not holding the violin. `rest` is
 * asked for in two places and both of them are a hand *on the neck*: the
 * runtime drifts the stopping hand here between phrases, and — the part that
 * does not look like a rest position at all — `AT_EASE` in
 * `web/concert/animate.ts` uses it as the pivot the whole instrument hangs from
 * when the player stands down. At 22 mm the violin dangled from a point two
 * centimetres off its own neck, with a splayed hand beside it holding nothing.
 *
 * A violinist waiting keeps the fingers a few millimetres over the string and a
 * violinist at ease has the neck in their palm. Four millimetres is the first
 * and near enough the second.
 */
const REST_CLEAR = 0.004;

function stopX(n: number): number {
  return MENSUR * Math.pow(2, -n / 12);
}

/**
 * Where the *hand* sits for a note stopped `n` semitones up. Pure, monotone,
 * and mostly flat — which is the point.
 *
 * The lowest position whose four fingers can reach the note, plus a little of
 * the reach itself. Inside a position the answer barely moves, so a scale is a
 * hand holding still while fingers work; crossing out of one is a shift, and it
 * happens in one step because that is what a shift is.
 *
 * Continuous in `n` within a position, so a portamento still slides rather than
 * stepping. It jumps at the position boundaries, which is the shift, and the
 * runtime eases the hand into it either way.
 */
function handStop(n: number): number {
  let base = POSITIONS[POSITIONS.length - 1]!;
  for (const p of POSITIONS) {
    if (n <= p + REACH) { base = p; break; }
  }
  if (base > n) base = n;
  return Math.max(base + (n - base) * LEAN_INTO_REACH, HALF_POSITION);
}

function stringZ(i: number, x: number): number {
  const t = Math.min(Math.max(x / MENSUR, 0), 1);
  const spread = BRIDGE_SPREAD + (NUT_SPREAD - BRIDGE_SPREAD) * t;
  return (i - (STRINGS - 1) / 2) * (spread / (STRINGS - 1));
}

/** How far below the arc's crown a string at `z` sits. Always ≤ 0. */
function arcDrop(z: number): number {
  return Math.sqrt(Math.max(ARC_R * ARC_R - z * z, 0)) - ARC_R;
}

/** The fingerboard's normal at `z`: the arc is what makes it turn. */
function arcNormal(z: number): Vector3 {
  return new Vector3(0, Math.sqrt(Math.max(ARC_R * ARC_R - z * z, 0)) / ARC_R, z / ARC_R);
}

/** The same turn, taken as far as the arm takes it. See `HAND_ROLL`. */
function handNormal(z: number): Vector3 {
  const a = Math.asin(Math.min(Math.max(z / ARC_R, -1), 1)) * HAND_ROLL;
  return new Vector3(0, Math.cos(a), Math.sin(a));
}

/**
 * `mount` is this player's, not the module's. The basis is the same for
 * everyone and only the origin moves with their height — see `mountFor` — but
 * the position has to go through theirs or the hands answer for a violin that
 * is not where this one is.
 */
function contactAt(mount: Matrix4, x: number, lift: number, z: number): Contact {
  return {
    position: new Vector3(x, lift + arcDrop(z), z).applyMatrix4(mount),
    // Rolled with the string, and rolled *further* than the board is: crossing
    // to the next string up is a turn of the hand, not a 2 mm sidestep.
    normal: handNormal(z).transformDirection(mount),
    along: DOWN_BOARD.clone().transformDirection(mount),
  };
}

/** Where the hair crosses string `i`, and how far the arc has tipped there. */
function bowTilt(z: number): number {
  return Math.asin(Math.min(Math.max(z / ARC_R, -1), 1));
}

/**
 * How far the *stick* is turned about the string, which is not the same angle.
 *
 * The bridge arc spans 44° across four strings, and a rigid rod pivoting on the
 * string with the frog 35 cm out swings that frog through 27 cm from the G to
 * the E — 9 cm for every adjacent crossing. Which is very nearly what a real
 * bow hand does, and reads on screen as an arm being yanked up and dropped
 * again on every note that changes string, because the model has no wrist to
 * take up the slack and the crossing is instant rather than a beat's worth of
 * forearm rotation.
 *
 * So two corrections, both toward the arm and away from the rigid rod, and both
 * applied to the *bow* and the *hand* through this one function so the two
 * cannot come apart:
 *
 *  - `CROSS_SWING` — the frog takes a bit over half the crossing and a wrist
 *    that this rig does not have takes the rest. An adjacent string is 4.6 cm
 *    of hand rather than 8.9, which still reads as a crossing and no longer
 *    reads as a flinch.
 *  - `BOW_HANG` — the stick sits a constant few degrees below the arc's own
 *    tangent, because the bow arm hangs off a shoulder rather than being held
 *    out level. Seven centimetres of frog, and it is the "the bow hand is a bit
 *    up" in the report.
 *
 * The cost is that the hair is no longer exactly tangent to the arc, which is a
 * lie about a 3 mm ribbon. Worst case is the G string, where the residual tips
 * the hair 21° and drops it 4.2 mm by the time it reaches the D string's `z` —
 * against `BOW_CLEAR` plus the 2.7 mm the D string sits higher, so it still
 * passes 2.5 mm clear. Nothing crosses anything.
 */
const CROSS_SWING = 0.55;
const BOW_HANG = 0.20;

function frogTilt(z: number): number {
  return BOW_HANG + CROSS_SWING * bowTilt(z);
}

function bowPivotY(z: number, lift: number): number {
  return STRING_HEIGHT + arcDrop(z) + BOW_CLEAR + lift;
}

/**
 * Where the bowing hand goes: the frog, with the bow at the middle of its hair.
 *
 * The middle and not "wherever the bow currently is", because `resolve` is
 * required to be pure — the runtime resolves a gesture once, on the frame it
 * becomes live, and caches it. So this is the *reference* end of the stroke and
 * the runtime displaces the hand from it by however far along the travel the
 * bow has got, which is the one number both sides compute the same way. See
 * `BOW_LEAN`.
 *
 * `STICK_Y` is the last centimetre of "the hand is a bit above the bow", and it
 * is a discrepancy between what this file draws and what it publishes rather
 * than a matter of taste. `bowPivot` is the *hair-string crossing*, so its axis
 * is a construction line: the hair hangs 1.5 mm under it, the stick 10 mm and
 * the frog's own centre 8. The contact used to be on the axis, which is a hand
 * placed against a line that has no bow on it. Measured off the stick mesh, so
 * moving the stick moves the hand.
 */
const STICK_Y = -0.010;

function bowContactAt(mount: Matrix4, z: number, lift: number): Contact {
  const t = frogTilt(z);
  return {
    position: new Vector3(
      BOW_X,
      bowPivotY(z, lift) + Math.cos(t) * STICK_Y - Math.sin(t) * FROG_Z,
      z + Math.sin(t) * STICK_Y + Math.cos(t) * FROG_Z,
    ).applyMatrix4(mount),
    normal: arcNormal(z).transformDirection(mount),
    // Down the stick: a bow hold spaces the fingers along it, thumb at the frog.
    // It is also the axis the runtime runs the *stroke* along, which is the
    // whole reason a bow that is not parallel to anything on the player still
    // draws instead of skewing. See `BOW_LEAN`.
    along: new Vector3(0, -Math.sin(t), Math.cos(t)).transformDirection(mount),
  };
}

class Kit {
  private readonly geos: BufferGeometry[] = [];
  private readonly mats: Material[] = [];
  geo<T extends BufferGeometry>(g: T): T { this.geos.push(g); return g; }
  mat<T extends Material>(m: T): T { this.mats.push(m); return m; }
  release(): void {
    for (const g of this.geos) g.dispose();
    for (const m of this.mats) m.dispose();
    this.geos.length = 0;
    this.mats.length = 0;
  }
}

function violinOutline(
  tail: number, len: number, lower: number, waist: number, upper: number, neck: number,
): Shape {
  const t = tail;
  const h = tail + len;
  const u = (f: number): number => t + len * f;
  const s = new Shape();
  s.moveTo(t, 0);
  s.bezierCurveTo(t, lower * 0.62, u(0.05), lower, u(0.19), lower);
  s.bezierCurveTo(u(0.30), lower, u(0.35), lower * 0.74, u(0.40), waist * 1.10);
  s.bezierCurveTo(u(0.45), waist * 0.95, u(0.50), waist, u(0.56), waist);
  s.bezierCurveTo(u(0.62), waist, u(0.65), waist * 0.98, u(0.69), upper * 0.82);
  s.bezierCurveTo(u(0.73), upper, u(0.81), upper, u(0.87), upper * 0.93);
  s.bezierCurveTo(u(0.95), upper * 0.84, h, upper * 0.44, h, neck);
  s.lineTo(h, -neck);
  s.bezierCurveTo(h, -upper * 0.44, u(0.95), -upper * 0.84, u(0.87), -upper * 0.93);
  s.bezierCurveTo(u(0.81), -upper, u(0.73), -upper, u(0.69), -upper * 0.82);
  s.bezierCurveTo(u(0.65), -waist * 0.98, u(0.62), -waist, u(0.56), -waist);
  s.bezierCurveTo(u(0.50), -waist, u(0.45), -waist * 0.95, u(0.40), -waist * 1.10);
  s.bezierCurveTo(u(0.35), -lower * 0.74, u(0.30), -lower, u(0.19), -lower);
  s.bezierCurveTo(u(0.05), -lower, t, -lower * 0.62, t, 0);
  return s;
}

/** Not part of `InstrumentModel`. See the notes on the two extra members. */
export interface ViolinModel extends InstrumentModel {
  /**
   * Where the bowing *hand* goes: the frog, on the bow, mid-stroke.
   *
   * `resolve` answers for the stopping hand; a `bow` effector wants this
   * instead. It is emphatically not "where the hair meets the string" — that
   * point is 35 cm down the stick from anything a hand is holding, and putting
   * a hand there is what made the bow look like it was being pushed by a ghost.
   */
  soundingContact(point: PlayPoint): Contact | undefined;
  /**
   * The model's own bow, driven by `react` and `update` to stay under the hand
   * `soundingContact` placed. Hide it if the performer rig carries its own.
   */
  bow: Group;
  /**
   * Carry the bow in the bowing hand rather than on the strings.
   *
   * `down` is how far that hand has let go of the instrument, 0..1, and `hand`
   * is where it actually is in world space — the runtime knows both and the
   * model can see neither. At 0 the bow is played; above it the frog moves into
   * the hand and the stick hangs from it. See `CARRY_FULL`.
   */
  carryBow(down: number, hand: Vector3): void;
}

export const buildViolin: InstrumentBuilder = (opts) => {
  const rng = new Rng(`violin:${opts.seed}`);
  const kit = new Kit();

  const root = new Group();
  root.name = 'violin';
  const inst = addTo(root, new Group());
  // This player's own, so the chinrest meets this player's jaw. Everything the
  // model answers about where a hand goes resolves through the same matrix.
  const mount = mountFor(opts.height ?? MEAN_HEIGHT);
  inst.applyMatrix4(mount);

  const wood = opts.finish ?? rng.pick(['#b4682c', '#9c5423', '#c67e3a', '#8a4a1f']);
  const bodyMat = kit.mat(new MeshStandardMaterial({
    color: wood, roughness: 0.35, metalness: 0.05,
  }));
  const bellyMat = kit.mat(new MeshStandardMaterial({
    color: rng.pick(['#e0a95e', '#d19749', '#eab96e']), roughness: 0.4,
  }));
  const ebonyMat = kit.mat(new MeshStandardMaterial({ color: '#17130f', roughness: 0.4 }));
  const stringMat = kit.mat(new MeshStandardMaterial({
    color: '#e2dcc4', roughness: 0.35, metalness: 0.4,
  }));
  const hairMat = kit.mat(new MeshStandardMaterial({ color: '#f2ecd8', roughness: 0.8 }));

  // --- Body ----------------------------------------------------------------
  const bodyGeo = kit.geo(new ExtrudeGeometry(
    violinOutline(
      BODY_TAIL, BODY_LEN,
      0.104 * rng.float(0.97, 1.03),
      0.056 * rng.float(0.96, 1.04),
      0.084 * rng.float(0.97, 1.03),
      0.013,
    ),
    {
      depth: 0.026, bevelEnabled: true, bevelThickness: 0.010,
      bevelSize: 0.009, bevelSegments: 2, curveSegments: 5,
    },
  ));
  bodyGeo.rotateX(-Math.PI / 2);
  // A violin bridge is 33 mm tall, so the belly sits that far under the strings.
  bodyGeo.translate(0, -0.065, 0);
  const body = addTo(inst, new Mesh(bodyGeo, bodyMat));
  body.castShadow = true;
  body.receiveShadow = true;

  const belly = addTo(inst, new Mesh(bodyGeo, bellyMat));
  belly.scale.set(0.97, 0.10, 0.97);
  belly.position.set(0, -0.024, 0);

  const fGeo = kit.geo(new CapsuleGeometry(0.0042, 0.052, 2, 5));
  fGeo.rotateZ(Math.PI / 2);
  for (const side of [1, -1]) {
    const f = addTo(inst, new Mesh(fGeo, ebonyMat));
    f.position.set(0.002, -0.0255, side * 0.048);
    f.rotation.y = side * 0.20;
  }

  // --- Neck, fingerboard, scroll ------------------------------------------
  const neckGeo = kit.geo(new BoxGeometry(MENSUR - 0.135, 0.020, 0.024));
  const neck = addTo(inst, new Mesh(neckGeo, bodyMat));
  neck.position.set((MENSUR + 0.135) / 2, -0.019, 0);
  neck.castShadow = true;

  const boardLen = MENSUR - stopX(MAX_SEMITONES) + 0.012;
  const boardGeo = kit.geo(new BoxGeometry(boardLen, 0.009, 0.030));
  const board = addTo(inst, new Mesh(boardGeo, ebonyMat));
  board.position.set(MENSUR + 0.006 - boardLen / 2, -0.0055, 0);
  board.castShadow = true;

  addTo(inst, new Mesh(kit.geo(new BoxGeometry(0.062, 0.024, 0.020)), bodyMat))
    .position.set(MENSUR + 0.036, -0.011, 0);
  const scrollGeo = kit.geo(new CylinderGeometry(0.016, 0.010, 0.017, 7));
  scrollGeo.rotateX(Math.PI / 2);
  const scroll = addTo(inst, new Mesh(scrollGeo, bodyMat));
  scroll.position.set(MENSUR + 0.076, -0.004, 0);
  scroll.rotation.z = 0.6;

  const pegGeo = kit.geo(new CylinderGeometry(0.0045, 0.0045, 0.046, 6));
  pegGeo.rotateX(Math.PI / 2);
  const pegs = addTo(inst, new InstancedMesh(pegGeo, ebonyMat, STRINGS));
  {
    const m = new Matrix4();
    for (let i = 0; i < STRINGS; i++) {
      const side = i % 2 === 0 ? 0.008 : -0.008;
      pegs.setMatrixAt(i, m.makeTranslation(
        MENSUR + 0.020 + Math.floor(i / 2) * 0.030, -0.011, side,
      ));
    }
    pegs.instanceMatrix.needsUpdate = true;
  }

  addTo(inst, new Mesh(kit.geo(new BoxGeometry(0.005, 0.007, 0.020)), ebonyMat))
    .position.set(MENSUR + 0.002, 0.0015, 0);

  // --- Bridge, tailpiece, chinrest ----------------------------------------
  const bridgeGroup = addTo(inst, new Group());
  bridgeGroup.position.set(0, -0.029, 0);
  const bridgeShape = new Shape();
  bridgeShape.moveTo(-0.021, 0);
  bridgeShape.lineTo(-0.013, 0);
  bridgeShape.lineTo(-0.009, 0.012);
  bridgeShape.bezierCurveTo(-0.003, 0.021, 0.003, 0.021, 0.009, 0.012);
  bridgeShape.lineTo(0.013, 0);
  bridgeShape.lineTo(0.021, 0);
  bridgeShape.lineTo(0.018, 0.026);
  bridgeShape.bezierCurveTo(0.011, 0.036, -0.011, 0.036, -0.018, 0.026);
  const bridgeGeo = kit.geo(new ExtrudeGeometry(bridgeShape, {
    depth: 0.005, bevelEnabled: false, curveSegments: 4,
  }));
  bridgeGeo.rotateY(Math.PI / 2);
  bridgeGeo.translate(0, 0, -0.0025);
  addTo(bridgeGroup, new Mesh(bridgeGeo, kit.mat(new MeshStandardMaterial({
    color: '#e3cb96', roughness: 0.5,
  }))));

  const tailGeo = kit.geo(new BoxGeometry(0.108, 0.008, 0.030));
  const tail = addTo(inst, new Mesh(tailGeo, ebonyMat));
  tail.position.set(-0.078, -0.022, 0);
  tail.rotation.z = 0.13;

  const chinGeo = kit.geo(new BoxGeometry(0.058, 0.014, 0.052));
  const chin = addTo(inst, new Mesh(chinGeo, ebonyMat));
  chin.position.set(-0.168, -0.020, -0.030);
  chin.rotation.z = 0.06;

  // --- Strings -------------------------------------------------------------
  const stringGeo = kit.geo(new CylinderGeometry(0.0006, 0.0006, MENSUR + 0.02, 4, 1, true));
  stringGeo.rotateZ(-Math.PI / 2);
  stringGeo.translate((MENSUR + 0.02) / 2 - 0.012, 0, 0);
  const strings: Mesh[] = [];
  const gauge: number[] = [];
  for (let i = 0; i < STRINGS; i++) {
    const m = addTo(inst, new Mesh(stringGeo, stringMat));
    const g = 1.9 - i * 0.3;
    gauge.push(g);
    const z0 = stringZ(i, 0);
    m.position.set(0, STRING_HEIGHT + arcDrop(z0), z0);
    m.rotation.y = -Math.asin((stringZ(i, MENSUR) - z0) / MENSUR);
    m.scale.set(1, g, g);
    strings.push(m);
  }

  // --- The bow, which the model drives itself -----------------------------
  /**
   * Two groups, and the split is the design.
   *
   * `bowPivot` sits on the string, at the crossing, and never leaves it — so
   * the hair cannot slide off the instrument no matter what the stroke does.
   * `bow` hangs off it and carries the stick, which aims at wherever the hand
   * is and slides along itself until the frog is under it. A stroke is
   * therefore a few degrees of skew plus a few centimetres of travel, and the
   * one thing it can never be is a bow floating beside the strings.
   */
  const bowPivot = addTo(inst, new Group());
  const bow = addTo(bowPivot, new Group());
  {
    const stickGeo = kit.geo(new CylinderGeometry(0.0035, 0.0028, 0.720, 5));
    stickGeo.rotateX(Math.PI / 2);
    const stick = addTo(bow, new Mesh(stickGeo, kit.mat(new MeshStandardMaterial({
      color: '#3a2216', roughness: 0.4,
    }))));
    stick.position.set(0, -0.010, 0.02);
    stick.castShadow = true;
    const hairGeo = kit.geo(new BoxGeometry(0.0028, 0.0090, HAIR_HALF * 2));
    addTo(bow, new Mesh(hairGeo, hairMat)).position.set(0, -0.0015, 0.02);
    const frogGeo = kit.geo(new BoxGeometry(0.016, 0.020, 0.036));
    // Named, because the probe measures the contact against *this mesh* rather
    // than against a constant that could quietly disagree with it.
    const frog = addTo(bow, new Mesh(frogGeo, ebonyMat));
    frog.name = 'bow-frog';
    frog.position.set(0, -0.008, FROG_Z);
    const tipGeo = kit.geo(new BoxGeometry(0.010, 0.014, 0.020));
    addTo(bow, new Mesh(tipGeo, ebonyMat)).position.set(0, -0.006, -FROG_Z + 0.004);
  }

  // --- Reaction state ------------------------------------------------------
  const amp = new Float32Array(STRINGS);
  const phase = new Float32Array(STRINGS);
  const rate = [26, 30, 35, 41];
  for (let i = 0; i < STRINGS; i++) phase[i] = rng.float(0, Math.PI * 2);
  let bellyAmp = 0;
  /**
   * The stroke, and it is the *runtime's* stroke.
   *
   * `Runtime.stroke` starts at `+1`, reverses on every `bow` gesture, carries
   * through every `hold`, and — since the floor under a note's travel means a
   * phrase now reaches the end of the bow — reverses again whenever the next
   * note would run off it. This has to be the same sign through all three or
   * the bow goes one way while the hand goes the other, which is worse than a
   * bow that does not move at all. See `turn`.
   */
  let stroke = 1;
  /**
   * Where along the stroke the bow is, in metres of hand travel, and the two
   * ends of the run currently under way.
   *
   * `leanFrom` is where the bow *was* when the note landed rather than the
   * middle of the hair. That is the whole of "a slur is one bow": nothing here
   * ever returns to zero except a rest, so consecutive notes under one stroke
   * continue a single travel instead of restarting it.
   */
  let lean = 0;
  let leanFrom = 0;
  let leanTo = 0;
  /** Off the string, on a rest. Starts lifted: nothing has been played yet. */
  let lift = BOW_LIFT;
  /** How far the bow has gone to the hand, and where that hand is. `carryBow`. */
  let carried = 0;
  const carriedHand = new Vector3();
  /**
   * Which string, when the stroke started, and how long the last one lasted.
   *
   * **The string and the lift are set, not eased**, and that is deliberate. The
   * runtime's arc puts the hand *exactly* on the contact at the beat, having
   * travelled there over the prep; a bow that then took a tenth of a beat to
   * cross would be behind the hand at the one instant the contract guarantees
   * they are together, and a G-to-E crossing swings the frog eighteen
   * centimetres. Whatever the model eases, it must not be the part the hand has
   * already committed to.
   */
  let bowString = 1;
  /**
   * When the current stroke started. `-Infinity` rather than 0 so that the
   * first note of a number is a new beat by the same test every later one uses.
   */
  let strokeAt = Number.NEGATIVE_INFINITY;
  let strokeSpan = 1;
  let last = 0;
  let started = false;

  /** The runtime's curve, over the runtime's span, between the same two ends. */
  function leanAt(now: number): number {
    if (leanFrom === leanTo) return leanTo;
    return leanFrom + (leanTo - leanFrom)
      * smooth(Math.min(Math.max((now - strokeAt) / strokeSpan, 0), 1));
  }

  /**
   * Turn the stroke: reverse it unless the note is slurred, and set the run
   * from wherever the bow is to wherever this note takes it.
   *
   * `now` alone decides whether this is a new note, because `react` is called
   * once per *point* and a double stop is two points under one bow — turning
   * per call made the direction depend on the parity of the chord, so a
   * two-note chord never reversed and a three-note one did. The runtime guards
   * the identical case with a once-per-frame flag, and every `react` in a frame
   * carries that frame's beat.
   */
  function turn(kind: GestureKind | undefined, f: number, now: number, span: number): void {
    // Only the two kinds that *are* a bow stroke. A pizzicato section is staged
    // on this model and its notes arrive here as `pluck`; moving the bow for one
    // would be a bow sawing away beside a string being plucked with a finger,
    // and — worse, because it does not go away — the runtime turns its own copy
    // of this state only for gestures on the `bow` effector, which are exactly
    // these two kinds. Anything else and the two would be out of step for good.
    if (kind !== 'bow' && kind !== 'hold') return;
    if (now === strokeAt) return;
    const from = leanAt(now);
    if (kind !== 'hold') stroke = -stroke;
    /**
     * How much bow this note gets, and then which way it goes.
     *
     * Length × force, floored so that even a semiquaver draws something the eye
     * can follow, and capped at the whole travel because there is only one bow.
     *
     * **Running out of bow reverses the stroke rather than clamping it**, which
     * is the difference between a player and a prop. Clamping was the old rule
     * and it was fine while a note moved three centimetres and could never
     * reach an end; at a floor of a quarter of the travel a slurred run reaches
     * one within four notes, and every note after that would have been a bow
     * pinned against its own limit and not moving — the exact symptom this
     * whole change is about, reintroduced at the other end. A violinist who
     * runs out of bow turns round mid-phrase, so this does too.
     *
     * `animate.ts` computes the identical thing from the identical inputs to
     * place the hand, reversal and all. See `BOW_LEAN`.
     */
    const dist = Math.min(
      Math.max(BOW_SPEED * span * (0.4 + 0.6 * f), BOW_MIN_STROKE), BOW_LEAN * 2,
    );
    let to = from + stroke * dist;
    if (to > BOW_LEAN || to < -BOW_LEAN) {
      stroke = -stroke;
      to = from + stroke * dist;
    }
    leanFrom = from;
    leanTo = Math.min(Math.max(to, -BOW_LEAN), BOW_LEAN);
    strokeAt = now;
    strokeSpan = span;
    lean = from;
  }

  function placeBow(): void {
    const z = stringZ(bowString, BOW_X);
    bowPivot.position.set(BOW_X, bowPivotY(z, lift), z);
    // Turned about the string it is on, which is what makes crossing to the E
    // look like a different movement from crossing to the G. Not quite the
    // arc's own tangent — see `frogTilt`.
    //
    // All three axes, not just the one that carries the tilt. `hangBow` writes
    // a whole quaternion, three.js back-fills the Euler from it, and every
    // player is at ease before the cue — so assigning `rotation.x` alone left
    // the carry's yaw and roll on the pivot for the rest of the number, which
    // is a bow skewed off the strings that no stroke could straighten.
    bowPivot.rotation.set(frogTilt(z), 0, 0);

    // And the stroke is a slide down the stick and nothing else: the crossing
    // point stays on the string, the frog runs up and down the hair, and the
    // hand the runtime has displaced along this same axis by this same number
    // is on the frog by construction rather than by agreement.
    //
    // The pivot's `+z`, which is exactly the `along` the contact publishes —
    // *not* the direction the frog happens to lie in. The two are the same here
    // and opposite on the cello, whose frog is at `−z`, and taking the frog's
    // side would have sent that bow the other way from its own hand.
    bow.position.set(0, 0, lean);

    // And then, if the player is standing down, none of the above: the bow is
    // in their hand rather than on their instrument. It is still computed
    // first, because `hangBow` blends *from* it and reads the pose it just set.
    if (carried > 0.001) hangBow();
  }

  /**
   * Take the bow off the strings and hang it from the bowing hand.
   *
   * Everything here is a rigid stick described by two things — which way it
   * points and where its frog is — because those are the two the blend has to
   * be continuous in and because the second of them is given in world space by
   * a runtime that has never heard of the pivot.
   *
   *  - **Pointing.** `tip → frog`, which is `FROG_DIR` turned by whatever
   *    `placeBow` just decided. The carried answer is straight up, so the stick
   *    hangs; tilted off vertical only when there is not the height under the
   *    hand to hang it in, which is a seated cellist and very occasionally a
   *    short violinist. The tilt goes the way the tip already lies, so the bow
   *    swings down out of the playing pose and stops early rather than
   *    sweeping round to some unrelated side.
   *  - **The frog.** The hand, once the blend is in — the hand is *holding* it.
   *
   * The pose is then written back through the pivot, since that is what the
   * scene graph has: the pivot takes the whole orientation and sits one frog's
   * worth back up the stick, and `bow.position` keeps the stroke it already had.
   * At `carried = 0` this reproduces `placeBow` exactly — the minimal rotation
   * from `FROG_DIR` to `FROG_DIR` turned about `x` *is* that turn about `x` —
   * which is what makes the two ends of the blend one continuous motion.
   */
  /** Pivot to the hand's grip on the stick, turned by `q`. See `STICK_Y`. */
  function gripOffset(q: Quaternion, out: Vector3): Vector3 {
    return out.set(0, STICK_Y, FROG_Z + lean).applyQuaternion(q);
  }

  function hangBow(): void {
    // The pivot's own frame, this frame. Read rather than cached because the
    // runtime lowers `root` as the player stands down, which is exactly the
    // thing being answered here.
    inst.updateWorldMatrix(true, false);
    CM.copy(inst.matrixWorld);

    // The playing pose, in world: where the hand has the stick, and which way
    // the stick runs from its tip to its frog. The same offset the contact is
    // published at, so the bow arrives *in* the hand rather than beside it.
    C3.copy(bowPivot.position).add(gripOffset(bowPivot.quaternion, C2)).applyMatrix4(CM);
    C1.copy(FROG_DIR).applyQuaternion(bowPivot.quaternion).transformDirection(CM);

    // The carried one: hanging, tilted up only as far as the boards insist.
    const rise = Math.min(Math.max((carriedHand.y - BOW_FLOOR) / BOW_REACH, 0.3), 1);
    C2.set(-C1.x, 0, -C1.z);
    if (C2.lengthSq() < 1e-8) C2.set(0, 0, 1);
    C2.normalize().multiplyScalar(Math.sqrt(1 - rise * rise));
    C2.y = -rise;
    C2.negate();

    const t = smooth(Math.min(carried / CARRY_FULL, 1));
    // A lerp between two directions collapses if they are ever exactly
    // opposed, which these are not and which is one line to be sure of.
    C1.lerp(C2, t);
    if (C1.lengthSq() < 1e-6) C1.copy(C2);
    C1.normalize();
    C3.lerp(carriedHand, t);

    // Back into the frame the pivot is placed in, and back onto the pivot:
    // the whole orientation, and then one grip's worth back up the stick.
    CM.invert();
    C1.transformDirection(CM);
    C3.applyMatrix4(CM);
    bowPivot.quaternion.copy(CQ.setFromUnitVectors(FROG_DIR, C1));
    bowPivot.position.copy(C3).sub(gripOffset(CQ, C2));
  }
  placeBow();

  const station: PlayerStation = {
    offset: new Vector3(-0.16, 0, -0.14),
    facing: 0,
    posture: 'stand',
  };

  const model: ViolinModel = {
    archetype: 'violin',
    root,
    station,
    bow,

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        // First position, on the neck rather than over it — see `REST_CLEAR`.
        // Centred across the board too: a waiting hand sits over the middle of
        // the four strings, and taking the D string's own `z` rolled the whole
        // hand a few degrees toward the G for no reason a hand would have.
        return contactAt(mount, stopX(handStop(2)), FINGER_HEIGHT + REST_CLEAR, 0);
      }
      if (point.kind !== 'string') return undefined;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return undefined;
      const n = point.fret;
      // Unfretted, so the *note* is continuous. A portamento passes through
      // every value on the way, and snapping the note to semitones would turn a
      // slide into a staircase.
      if (!Number.isFinite(n) || n < 0 || n > MAX_SEMITONES) return undefined;
      // The hand, though, goes where a hand goes: to a position, off the nut,
      // and not one 18 mm step per semitone. See `handStop` and `HALF_POSITION`.
      // The *range* check above is still against the note the choreographer
      // asked for, so an unplayable one is still `undefined` rather than a hand
      // parked at the limit.
      const x = stopX(handStop(n));
      return contactAt(mount, x, FINGER_HEIGHT, stringZ(i, x));
    },

    soundingContact(point: PlayPoint): Contact | undefined {
      // The bow's own idle. The choreographer places a `rest` on the bow when
      // the line stops for more than a bar, and the runtime drifts the bowing
      // hand here whenever nothing is asking for it, so this has to be the frog
      // of a *lifted* bow rather than a point in the air beside one.
      if (point.kind === 'rest') return bowContactAt(mount, stringZ(1, BOW_X), BOW_LIFT);
      if (point.kind !== 'string') return undefined;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return undefined;
      return bowContactAt(mount, stringZ(i, BOW_X), 0);
    },

    carryBow(down: number, hand: Vector3): void {
      const c = Math.min(Math.max(down, 0), 1);
      if (c <= 0 && carried <= 0) return;
      carried = c;
      if (c > 0) carriedHand.copy(hand);
      placeBow();
    },

    react(
      point: PlayPoint, force: number, now: number, kind?: GestureKind, hold?: number,
    ): void {
      const first = !started;
      if (first) { last = now; started = true; }
      /**
       * How long this stroke lasts: the runtime's own follow-through.
       *
       * A quaver's bow crosses in a quaver and a semibreve's takes four beats,
       * which is the whole of "the bow should support longer and shorter
       * notes" — and it is the same number the hand at the frog is being run
       * out along, so the two cannot drift apart. It is also how *far* the bow
       * gets, since the travel is a speed now.
       *
       * The fallback is the previous span rather than the gap since the last
       * note, which is what it used to be. Not because the gap is a worse guess
       * — it is a better one — but because the runtime has to compute this same
       * number to place the hand and the two have to agree *exactly*, and the
       * only inputs both of them provably share are `hold` and the last value
       * of this. A caller that passes a `hold` never reaches it either way.
       */
      const span = Math.min(Math.max(
        Number.isFinite(hold) && hold! > 0 ? hold! : strokeSpan,
        SPAN_MIN,
      ), SPAN_MAX);

      // The bow lifts off the string. The choreographer sends this when the
      // line rests for more than a bar, and it is one of the few gestures whose
      // kind survives `fireReacts` — a `rest` point collides with nothing. The
      // travel walks home to the middle of the hair as it goes up, which is
      // where a lifted bow's own `soundingContact` says the hand is.
      if (point.kind === 'rest') {
        lift = BOW_LIFT;
        if (now !== strokeAt) {
          leanFrom = leanAt(now);
          leanTo = 0;
          strokeAt = now;
          strokeSpan = span;
        }
        placeBow();
        return;
      }
      if (point.kind !== 'string') return;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return;
      const f = Math.min(Math.max(force, 0), 1);
      amp[i] = Math.min(1.2, (amp[i] ?? 0) + 0.35 + f * 0.45);
      bellyAmp = Math.min(1, bellyAmp + 0.25 + f * 0.4);

      /**
       * A note is a bow change unless the runtime says it is a slur.
       *
       * `hold` means "carry on under the stroke already running" and everything
       * else means "reverse", which is what `Runtime.stroke` does with the same
       * gestures. The catch is that the kind that arrives here is usually the
       * *stopping* hand's: a violin note is two gestures on the same
       * `{string, fret}`, `fireReacts` de-duplicates by point, and the left
       * hand's `press` is placed first — so the bow's own `bow`/`hold` rarely
       * survives to be seen. Reversing on anything that is not a `hold` is
       * therefore both the correct reading of the contract and the behaviour
       * that falls out of what actually arrives, which is `press`: alternating
       * every note is détaché, and it is what a player does by default.
       */
      turn(kind, f, now, span);
      // The string and the lift are set, not eased. The stroke is not: it picks
      // up from where it already was, which is the point.
      bowString = i;
      lift = 0;
      placeBow();
    },

    update(now: number): void {
      if (!started) { last = now; started = true; }
      const dt = Math.min(Math.max(now - last, 0), 0.4);
      last = now;

      for (let i = 0; i < STRINGS; i++) {
        let a = amp[i] ?? 0;
        if (a <= 0.001) {
          if (a !== 0) {
            amp[i] = 0;
            strings[i]!.scale.set(1, gauge[i]!, gauge[i]!);
          }
          continue;
        }
        // Bowed strings are driven, not struck: the blur holds while the note
        // sounds rather than pinging and dying.
        a *= Math.exp(-dt / 1.6);
        amp[i] = a;
        phase[i] = (phase[i] ?? 0) + dt * rate[i]!;
        const blur = 1 + a * 3.2;
        strings[i]!.scale.set(1, gauge[i]! * blur, gauge[i]! * (1 + a * 1.2));
      }

      // The bow, along the stroke on the runtime's own curve. This is the only
      // part of the bow's pose that is a function of time rather than of the
      // last `react`, and the runtime is evaluating the same two ends over the
      // same span to decide where to put the hand.
      lean = leanAt(now);
      placeBow();

      if (bellyAmp > 0.002) {
        bellyAmp *= Math.exp(-dt / 0.9);
        belly.scale.y = 0.10 * (1 + Math.sin(now * 13) * bellyAmp * 0.12);
        bridgeGroup.rotation.z = Math.sin(now * 13) * bellyAmp * 0.03;
      } else if (bellyAmp !== 0) {
        bellyAmp = 0;
        belly.scale.y = 0.10;
        bridgeGroup.rotation.z = 0;
      }
    },

    dispose(): void {
      pegs.dispose();
      root.removeFromParent();
      root.clear();
      kit.release();
    },
  };

  return model;
};
