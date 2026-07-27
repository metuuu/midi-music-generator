/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The shape of a stroke — the half of the animation the IR deliberately refuses
 * to carry.
 *
 * `Gesture` says when the sound is, how long the arm has to get there, and how
 * hard. It says nothing about the *curve*, because a curve is a rendering
 * decision and an IR that carried one would be describing three.js. This file is
 * that decision, split out of `animate.ts` so the runtime reads as scheduling
 * and blending rather than as trigonometry, and so the curves can be plotted and
 * asserted on without a renderer.
 *
 * ## What was wrong, and what "ballistic" means here as a number
 *
 * The first version eased laterally with a smoothstep and lifted along the
 * normal with `sin(π·s^0.7)`. It read as a lerp, and the measurement says
 * exactly why: **a smoothstep spends 29% of its time inside the last 20% of the
 * travel** — *more* than a straight linear ramp's 20%, because it decelerates
 * into the target. Every limb on stage crept the last few centimetres and
 * arrived apologetically, which is the precise opposite of a strike.
 *
 * A real stroke does the reverse of all three parts of that. It leaves
 * promptly, it spends most of its time near the top of the windup, and then it
 * crosses the last few centimetres faster than it crossed anything else — the
 * limb is still *accelerating* at the moment of contact. The shapes here put
 * that number between 8% and 15%, and the harder the hit the smaller it gets,
 * because `force` is what the speed profile is made of.
 *
 * ## Three curves and a ceiling
 *
 * `reach` is how far along the line to the contact the limb is; `hop` is how far
 * off the surface it is, along the contact normal; `bounce` is the
 * follow-through. `liftCeiling` is the one piece of actual physics: a stick
 * cannot rise higher than it can fall back down in the time the gesture has, so
 * a fast passage keeps the sticks low without anybody writing a rule saying so.
 *
 * All four are functions of normalised time and a handful of scalars. Nothing
 * here reads a clock, allocates, or knows what a `Vector3` is.
 */

import type { GestureKind } from '../../concert/types.js';

const HALF_PI = Math.PI * 0.5;

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Smooth at both ends. Still the right answer for anything that is not a hit. */
export function smooth(s: number): number {
  return s * s * (3 - 2 * s);
}

/**
 * How ballistic a kind's approach is: 0 glides in, 1 whips in.
 *
 * This is the one number the rest of the file is parameterised on, and it is
 * per *kind* rather than per instrument because it is a fact about the motion,
 * not about the object. A mallet on a vibraphone and a stick on a snare are the
 * same stroke; a bow arriving at a string and a finger arriving at a key are
 * both weight rather than speed, and a bow that whipped would be a spiccato
 * nobody wrote.
 */
const SNAP: Record<GestureKind, number> = {
  strike: 1,
  pluck: 0.8,
  press: 0.45,
  bow: 0.15,
  blow: 0,
  squeeze: 0.2,
  hold: 0.2,
  breathe: 0,
  sway: 0,
};

/**
 * Where in the windup the limb is at the top of its arc, 0..1.
 *
 * Late, and later the harder the hit — which is the "hang" a drummer has at the
 * top of a backbeat and does not have on a ghost note. Everything after the
 * apex is a fall, so pushing the apex later is the same thing as making the
 * descent shorter and therefore faster.
 *
 * `vary` is a per-gesture wobble in −1..1, drawn from the performer's id. Two
 * hands hitting the same beat get different apexes and therefore visibly
 * different arcs, which is the cheapest cure there is for two limbs moving in
 * lockstep.
 */
export function apexOf(kind: GestureKind, force: number, vary: number): number {
  const snap = SNAP[kind];
  const a = 0.26 + 0.30 * snap * (0.35 + 0.65 * clamp01(force)) + 0.05 * vary;
  return a < 0.12 ? 0.12 : a > 0.66 ? 0.66 : a;
}

/**
 * How much of the lateral travel is already behind the limb at the apex.
 *
 * A stroke crosses the ground while it is *high* and then drops; it does not
 * slide along the surface and then rise. Getting most of the way across early
 * is also what keeps the shape from reading as an ease-in, which on its own
 * would leave the limb sitting still for the first third of every windup.
 */
export function coverOf(kind: GestureKind): number {
  return 0.50 + 0.24 * SNAP[kind];
}

/**
 * The exponent of the final approach. Bigger is later and faster.
 *
 * This is where `force` becomes *speed* rather than distance. The lift table
 * already makes a hard hit travel further; this makes it arrive faster from
 * that further away, which is the difference between a big gesture and a fast
 * one, and a stage needs both.
 */
export function snapOf(kind: GestureKind, force: number): number {
  return 1.4 + 3.2 * SNAP[kind] * (0.4 + 0.6 * clamp01(force));
}

/**
 * Position along the line from the windup's anchor to the contact, 0..1.
 *
 * Two joined pieces: a smoothstep out to `cover` by the apex, then a power ease
 * into the contact. Both have zero slope at the apex, so the limb genuinely
 * *hangs* there rather than passing through — and the whole reason the apex is
 * a parameter is that the hang is where the anticipation lives.
 */
export function reach(s: number, apex: number, cover: number, snap: number): number {
  if (s <= 0) return 0;
  if (s >= 1) return 1;
  if (s < apex) {
    const t = s / apex;
    return cover * t * t * (3 - 2 * t);
  }
  const t = (s - apex) / (1 - apex);
  return cover + (1 - cover) * Math.pow(t, snap);
}

/**
 * Height above the surface during the windup, as a fraction of the lift, 0..1.
 *
 * Up under muscle — fast, decelerating into the hang — and down under gravity:
 * literally `1 − t²`, so the descent is a parabola and the limb is at its
 * fastest at the instant it arrives. That last clause is the whole point and it
 * is why this is not a sine: a sine's descent is symmetric with its rise, and a
 * symmetric arc is what a lerp looks like.
 *
 * Exactly zero at `s = 1`, which is the invariant the runtime exists to hold —
 * on the beat the effector is *on* the contact, not above it.
 */
export function hop(s: number, apex: number): number {
  if (s <= 0 || s >= 1) return 0;
  if (s < apex) {
    const t = s / apex;
    return Math.sin(HALF_PI * Math.pow(t, 0.75));
  }
  const t = (s - apex) / (1 - apex);
  return 1 - t * t;
}

/** Where the follow-through settles, as a fraction of the rebound height. */
const SETTLE = 0.3;

/**
 * The follow-through, as a fraction of the rebound height.
 *
 * A bounce is a *velocity reversal*, so the curve leaves the surface with
 * infinite slope — `u^0.62` inside the sine is doing that, and it is what makes
 * the difference between a stick that bounces and a stick that is eased back up
 * by an animator. It then decelerates, and settles short of the surface rather
 * than at it: a stick that came all the way back down would tap the drum a
 * second time on every note, which is the bug that shipped in the first cut and
 * read as a flam on everything.
 */
export function bounce(u: number): number {
  if (u <= 0) return 0;
  if (u >= 1) return SETTLE;
  return Math.sin(Math.PI * Math.pow(u, 0.62)) * (1 - 0.3 * u) + SETTLE * u * u;
}

/**
 * Effective downward acceleration of a falling limb, m/s².
 *
 * Emphatically not gravity. A drummer does not *drop* the stick, they throw it
 * back down, and a stick tip routinely pulls several g on the way to the head —
 * at 9.81 a backbeat would be limited to three centimetres of lift, because
 * `Gesture.prep` is a statement about how long an arm needs to *arrive* and is
 * only a tenth of a second for a stroke that has not travelled.
 *
 * Calibrated so that the cap is slack where it should be and tight where it
 * should be: a backbeat with 0.13 s of runway can still lift 11 cm, more than
 * the 8.75 cm the table asks for, while a hi-hat sixteenth whose prep has been
 * trimmed to 0.05 s by the note before it is held to under two centimetres. The
 * ratio is the point; the absolute value only has to leave the table in charge
 * of everything that is not genuinely rushed.
 */
const FALL_G = 55;

/**
 * The most a limb can lift and still be back on the surface in time.
 *
 * `h = ½·g·t²`, and nothing else. This is why a fast passage keeps the sticks
 * low: not a rule about tempo, but the same rule that keeps a real drummer's
 * sticks low, applied to the time the gesture actually has. Without it a
 * sixteenth-note hi-hat pattern lifted as far as a crash and the sticks blurred
 * into a vertical smear.
 */
export function liftCeiling(fallSeconds: number): number {
  if (!(fallSeconds > 0)) return 0;
  return 0.5 * FALL_G * fallSeconds * fallSeconds;
}
