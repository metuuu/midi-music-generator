/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The operator on the follow spot.
 *
 * This is the highest-value visual in the feature and it is the one thing in
 * the rig that is deliberately *wrong*. A beam that is exactly on the soloist
 * at exactly the beat the cue names reads as a machine — and it is a machine,
 * which is the problem. What an audience recognises as a follow spot is a
 * person behind a lantern who saw the soloist stand up, swung the beam over,
 * went slightly past, came back, and then could not hold their hands
 * completely still. All four of those are here.
 *
 * `concert/lighting.ts` deliberately does not encode any of it, and says why:
 * lateness is *positional*, `LightCue` has no position field, and a constant
 * offset baked into the score would be a different mechanism rather than a
 * human one. So the score names a performer and the beat the cue is taken; the
 * lag is entirely this file's.
 *
 * ## The model, and the numbers
 *
 * Four stages, applied to the aim point in world space:
 *
 * 1. **Dead time** — `reactionSeconds` (0.13 s). The operator's aim chases the
 *    subject's position *as it was* an eighth of a second ago. This is what
 *    makes a swaying player's beam trail them rather than ride them, and it is
 *    the cheapest, most convincing part of the whole model.
 * 2. **A second-order spring** — `omega` 5.4 rad/s, damping ratio 0.70 while
 *    tracking. A step of any size takes roughly 0.42 s to first arrive and
 *    about 0.9 s to settle, so at 120 BPM the beam finds a new soloist a bit
 *    under a beat late and at 60 BPM about half a beat late. Crucially the
 *    lateness **scales with how far the beam had to travel** — a hand-off
 *    across the stage is visibly slower than a nudge — which is exactly the
 *    thing a constant offset in the score could not have expressed.
 * 3. **The grab** — for `grabSeconds` (1.0 s) after the score names somebody
 *    new, the damping ratio drops to 0.44, which overshoots by about 20% and
 *    swings back. That is the operator finding the player, going past, and
 *    correcting. Once the grab has decayed the ratio eases back to 0.70 and the
 *    beam tracks without oscillating.
 * 4. **Tremor** — a small sum of out-of-phase sines, ~1.6 cm at rest and up to
 *    four times that while the beam is travelling, added to the *output* rather
 *    than integrated so it can never destabilise the spring. Phases come from
 *    `Venue.id` through `core/rng.ts`; there is no `Math.random()` anywhere in
 *    the rig.
 *
 * Everything above is in **seconds**, not beats, and that is on purpose: a
 * reaction time is a physical constant. It does not get quicker because the
 * band counted the tune off faster, and a lag expressed in beats would say it
 * does.
 *
 * ## What it is not
 *
 * It is not the `warm` fixture. Ambient refuses to have a foreground, so the
 * fixture that favours a player there moves by interpolating in *beat* space
 * over the cue's own `fadeBeats` — no lag, no overshoot, no tremor, and slow
 * enough that nobody can watch it happening. That lives in `lights.ts`, and the
 * two being different mechanisms rather than the same one with different
 * numbers is what makes "ambient never uses a follow spot" hold in the picture
 * as well as in the data.
 */

import { Vector3 } from 'three';

import { Rng } from '../../core/rng.js';

export interface FollowTuning {
  /** Seconds before the operator's aim reacts to anything at all. */
  reactionSeconds: number;
  /** Spring natural frequency, rad/s. Bigger is snappier. */
  omega: number;
  /** Damping ratio while tracking a player who is already found. */
  damping: number;
  /** Damping ratio during the grab. Below ~0.6 to get a visible overshoot. */
  grabDamping: number;
  /** How long the grab lasts, in seconds. */
  grabSeconds: number;
  /** Hand tremor at rest, in metres. */
  wobbleMetres: number;
}

/**
 * Wave 3 will tune these by eye; they are here as one table so that is a
 * one-line change rather than a hunt through the update loop.
 */
export const OPERATOR: FollowTuning = {
  reactionSeconds: 0.13,
  omega: 5.4,
  damping: 0.70,
  grabDamping: 0.44,
  grabSeconds: 1.0,
  wobbleMetres: 0.016,
};

/**
 * Under `prefers-reduced-motion` the beam still follows — refusing to move the
 * follow spot would delete the feature rather than calm it. What goes is the
 * part that oscillates: no overshoot, no tremor, and a slightly quicker, fully
 * damped travel so the beam arrives and stops.
 */
export const STEADY: FollowTuning = {
  reactionSeconds: 0.08,
  omega: 6.5,
  damping: 1.0,
  grabDamping: 1.0,
  grabSeconds: 0,
  wobbleMetres: 0,
};

/** How many delayed samples to keep. 96 frames is 1.6 s at 60fps. */
const DELAY_CAPACITY = 96;

export class FollowSpot {
  /** Where the beam is actually pointing. Read after `update`. */
  readonly aim = new Vector3();
  /** Where the score is asking it to point. */
  readonly wanted = new Vector3();

  private readonly pos = new Vector3();
  private readonly vel = new Vector3();
  private readonly perceived = new Vector3();
  private readonly acc = new Vector3();

  /** Flat ring of (t, x, y, z). The dead time is a read from this, not a filter. */
  private readonly buf = new Float64Array(DELAY_CAPACITY * 4);
  private pushed = 0;

  private clock = 0;
  private grabFor = 0;
  private subject: string | undefined;
  private readonly phase: number[];

  constructor(
    private readonly tuning: FollowTuning,
    rng: Rng,
  ) {
    this.phase = [0, 0, 0, 0, 0].map(() => rng.float(0, Math.PI * 2));
  }

  /** Whom the beam currently believes it is on. */
  following(): string | undefined {
    return this.subject;
  }

  /** Metres between where the beam is and where it was asked to be. */
  error(): number {
    return this.aim.distanceTo(this.wanted);
  }

  /**
   * Put the beam somewhere with no travel at all.
   *
   * For `begin()` and for a hard reset. Never for a cue: a spot that teleports
   * onto a soloist is the exact failure this class exists to avoid.
   */
  snap(point: Vector3): void {
    this.pos.copy(point);
    this.vel.set(0, 0, 0);
    this.aim.copy(point);
    this.wanted.copy(point);
    this.perceived.copy(point);
    this.pushed = 0;
    this.grabFor = 0;
  }

  /**
   * One frame.
   *
   * `wanted` is where the score would like the beam; `subject` is the performer
   * id the cue names, or `undefined` when the cue names nobody — in which case
   * the beam **holds where it is** rather than re-centring, because an operator
   * whose cue has gone out does not swing the lantern back to the middle of the
   * stage, they take their hands off it.
   */
  update(dt: number, wanted: Vector3, subject: string | undefined): void {
    const d = Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.1)) : 0;
    this.clock += d;

    if (subject !== this.subject) {
      // A new name on the cue sheet. The grab is the overshoot, and it fires
      // only on a *change* — re-stating the same performer is not a grab.
      if (subject !== undefined) this.grabFor = this.tuning.grabSeconds;
      this.subject = subject;
    }
    this.grabFor = Math.max(0, this.grabFor - d);

    this.wanted.copy(wanted);
    this.push(this.clock, wanted);
    this.sampleAt(this.clock - this.tuning.reactionSeconds, this.perceived);

    /**
     * Ease between the grab's damping and the tracking damping rather than
     * switching. A discontinuity in the damping term is a visible kick, and the
     * whole point of the grab is that it looks like one movement.
     */
    const g = this.tuning.grabSeconds > 0
      ? this.grabFor / this.tuning.grabSeconds
      : 0;
    const zeta = this.tuning.damping
      + (this.tuning.grabDamping - this.tuning.damping) * (g * g);

    // Substepped so a 4fps frame cannot blow the integrator up. Semi-implicit
    // Euler is stable well past this step size at omega 5.4.
    const w = this.tuning.omega;
    let left = d;
    while (left > 1e-6) {
      const h = Math.min(left, 1 / 120);
      this.acc.copy(this.perceived).sub(this.pos).multiplyScalar(w * w)
        .addScaledVector(this.vel, -2 * zeta * w);
      this.vel.addScaledVector(this.acc, h);
      this.pos.addScaledVector(this.vel, h);
      left -= h;
    }

    this.aim.copy(this.pos);
    const amp = this.tuning.wobbleMetres;
    if (amp > 0) {
      // More tremor while the beam is moving — a lantern being swung is far
      // less steady than one resting on its stop.
      const k = amp * (0.45 + Math.min(1.6, this.vel.length() * 0.55));
      const t = this.clock;
      const p = this.phase;
      this.aim.x += k * (Math.sin(t * 3.1 + p[0]!) * 0.6 + Math.sin(t * 7.3 + p[1]!) * 0.4);
      this.aim.y += k * 0.55 * Math.sin(t * 4.7 + p[2]!);
      this.aim.z += k * (Math.sin(t * 2.6 + p[3]!) * 0.5 + Math.sin(t * 6.1 + p[4]!) * 0.5);
    }
  }

  // -- the dead-time ring --------------------------------------------------

  private push(t: number, v: Vector3): void {
    const i = (this.pushed % DELAY_CAPACITY) * 4;
    this.buf[i] = t;
    this.buf[i + 1] = v.x;
    this.buf[i + 2] = v.y;
    this.buf[i + 3] = v.z;
    this.pushed++;
  }

  /** Linear read of the ring at time `t`, clamped to what is in it. */
  private sampleAt(t: number, out: Vector3): void {
    const n = Math.min(this.pushed, DELAY_CAPACITY);
    if (n === 0) { out.copy(this.wanted); return; }

    const at = (k: number) => ((this.pushed - 1 - k) % DELAY_CAPACITY + DELAY_CAPACITY)
      % DELAY_CAPACITY * 4;

    // Newest first: the answer is almost always one or two back.
    let newer = at(0);
    if (t >= this.buf[newer]!) {
      out.set(this.buf[newer + 1]!, this.buf[newer + 2]!, this.buf[newer + 3]!);
      return;
    }
    for (let k = 1; k < n; k++) {
      const older = at(k);
      if (this.buf[older]! <= t) {
        const t0 = this.buf[older]!;
        const t1 = this.buf[newer]!;
        const f = t1 > t0 ? (t - t0) / (t1 - t0) : 1;
        out.set(
          this.buf[older + 1]! + (this.buf[newer + 1]! - this.buf[older + 1]!) * f,
          this.buf[older + 2]! + (this.buf[newer + 2]! - this.buf[older + 2]!) * f,
          this.buf[older + 3]! + (this.buf[newer + 3]! - this.buf[older + 3]!) * f,
        );
        return;
      }
      newer = older;
    }
    // Older than anything held: the oldest sample is the best answer there is.
    out.set(this.buf[newer + 1]!, this.buf[newer + 2]!, this.buf[newer + 3]!);
  }
}
