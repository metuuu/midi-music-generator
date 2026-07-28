/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The house — silhouetted heads in the near foreground.
 *
 * A concert with no crowd is a rehearsal, so this is not decoration; it is
 * half of what tells you what kind of room you are in. It is also the only
 * thing on this stage that exists in the hundreds, which decides everything
 * about how it is built:
 *
 * - **Three `InstancedMesh`es for the whole house.** Heads, shoulders, hands.
 *   A hundred and sixty people cost three draw calls and about thirty thousand
 *   triangles of very small, very dark geometry. Adding a fourth part to a
 *   person is a whole extra draw call, which is why they do not have arms.
 * - **Unlit.** `MeshBasicMaterial`, near black, with a few percent of
 *   per-instance variation so the crowd has depth without having features.
 *   This is cheaper than lighting them, and it is also *better*: a foreground
 *   crowd that responds to the stage wash stops reading as a silhouette and
 *   starts reading as a hundred badly lit people sitting between you and the
 *   band.
 * - **Quality is `mesh.count`.** Every instance is allocated once at the
 *   maximum and the crowd is built front row first, so dropping the count
 *   thins the back of the house and leaves the row you can actually see.
 *
 * **Nobody is in phase with anybody.** Each person gets a phase, a rate and a
 * clap tempo from the venue's own seed. A crowd bobbing in unison is the same
 * failure as a band nodding in unison, and the fix is the same two lines.
 *
 * The nod runs off the song clock when there is one — `now` is beats, so a
 * house moving on the pulse costs one `sin` and is free of any decision the
 * Performance IR should have made. With the transport stopped it falls back to
 * wall time and simply breathes.
 */

import {
  Color, Group, IcosahedronGeometry, InstancedMesh, Object3D, SphereGeometry,
} from 'three';

import { Rng } from '../../core/rng.js';
import type { Venue } from '../../concert/types.js';
import { blend, shade, type Kit, type Quality } from './stage-kit.js';

const CAP: Record<Quality, number> = { low: 48, medium: 96, high: 168 };

/**
 * How a house is laid out, in one place, because two files need it.
 *
 * These were literals inside `buildAudience` and one of them — the row gap —
 * was *also* a literal in `stage.ts`, where `houseDepth` is derived from it.
 * That is the kind of duplication that stays correct right up until somebody
 * seats the crowd closer together and the room does not follow.
 */
const ROW = {
  /** Downstage face of the first row, upstage of the lip. */
  frontZ: 1.35,
  seated: { gap: 0.95, rake: 0.1, head: 1.14 },
  standing: { gap: 0.8, rake: 0.05, head: 1.58 },
} as const;

/** The gap between rows a house of this kind is built with. */
export function rowGap(seated: boolean): number {
  return (seated ? ROW.seated : ROW.standing).gap;
}

/** Where the crowd is, for anything that has to keep out of it. */
export interface CrowdExtent {
  /** Nothing downstage of this is in the crowd at all. */
  frontZ: number;
  /** The back of the last row. */
  backZ: number;
  /** The top of the tallest head in the house, jitter and bobbing included. */
  topY: number;
}

/**
 * The volume the audience occupies, from the numbers that place it.
 *
 * `camera.ts` is the caller that matters: a lens is solved from framing, and
 * framing has no opinion about whether the answer is inside somebody's head.
 * It was, and the reason it took a room rebuild to notice is that the crowd
 * used to sit half a metre lower — the shot heights that skimmed the back of
 * the house came down with the boards, and the heads did not.
 */
export function crowdExtent(
  audience: Venue['audience'], houseY: number, lipZ: number,
): CrowdExtent {
  const rows = Math.max(1, Math.min(16, Math.round(audience.rows)));
  const r = audience.seated ? ROW.seated : ROW.standing;
  const back = rows - 1;
  return {
    frontZ: lipZ + ROW.frontZ - 0.35,
    backZ: lipZ + ROW.frontZ + back * r.gap + 0.35,
    // The head jitter tops out at +0.07 and the idle bob and applause lift add
    // about another 0.1 between them. Rounded up, because this is a clearance.
    topY: houseY + back * r.rake + r.head + 0.2,
  };
}

interface Person {
  x: number;
  /** Head height above the house floor for this row. */
  y: number;
  z: number;
  yaw: number;
  scale: number;
  /** Everything that keeps this person out of step with their neighbours. */
  phase: number;
  rate: number;
  clapRate: number;
  clapPhase: number;
  /** 0..1 — how likely this one is to put their hands over their head. */
  demonstrative: number;
  /** Seconds this person's gasp lags the person who saw it first. */
  gaspLag: number;
}

export interface AudienceOptions {
  kit: Kit;
  venue: Venue;
  /** y of the house floor, below the boards. Negative. */
  houseY: number;
  /** z of the stage lip. The front row sits downstage of it. */
  lipZ: number;
  /** How wide the house is. Usually wider than the stage. */
  houseWidth: number;
  quality: Quality;
  reducedMotion: boolean;
}

export interface AudienceRig {
  root: Group;
  /** How many people are currently drawn. */
  count(): number;
  /** How many were built. `setQuality` moves `count` within this. */
  capacity(): number;
  applaud(intensity: number): void;
  gasp(): void;
  setAttention(level: number): void;
  setQuality(q: Quality): void;
  update(now: number, dt: number): void;
}

export function buildAudience(o: AudienceOptions): AudienceRig {
  const { kit, venue } = o;
  const rng = new Rng(`${venue.id}:audience`);
  const seated = venue.audience.seated;
  const density = Math.max(0, Math.min(1, venue.audience.density));
  const rows = Math.max(1, Math.min(16, Math.round(venue.audience.rows)));

  // --- who is in the room ------------------------------------------------
  const spacing = seated ? 0.66 : 0.58;
  const r = seated ? ROW.seated : ROW.standing;
  const perRow = Math.max(3, Math.min(30, Math.floor(o.houseWidth / spacing)));
  const cap = CAP.high;
  const people: Person[] = [];

  // Front row first, so thinning for quality thins the back of the house.
  outer: for (let row = 0; row < rows; row++) {
    const z = o.lipZ + ROW.frontZ + row * r.gap;
    const rake = row * r.rake;
    const stagger = (row % 2) * spacing * 0.5;
    for (let s = 0; s < perRow; s++) {
      if (people.length >= cap) break outer;
      // Density is an occupancy, not a scale: an empty row has gaps in it.
      if (!rng.chance(density * 0.92 + 0.08)) continue;
      const base = (s - (perRow - 1) / 2) * spacing + stagger;
      const head = r.head + rng.float(-0.06, 0.07);
      people.push({
        x: base + rng.float(-0.08, 0.08),
        y: o.houseY + rake + head,
        z: z + rng.float(-0.12, 0.12),
        yaw: rng.float(-0.22, 0.22),
        scale: rng.float(0.92, 1.09),
        phase: rng.float(0, Math.PI * 2),
        rate: rng.float(0.8, 1.25),
        clapRate: rng.float(5.6, 8.4),
        clapPhase: rng.float(0, Math.PI * 2),
        demonstrative: rng.next(),
        gaspLag: rng.float(0, 0.16),
      });
    }
  }

  const n = people.length;
  const root = new Group();

  // --- the three meshes --------------------------------------------------
  const dark = shade(blend(venue.palette.backdrop, venue.palette.ambient, 0.35), 0.86);
  const mat = kit.basic(dark);

  const headGeo = kit.geometry('aud-head', () => new IcosahedronGeometry(0.115, 1));
  const bustGeo = kit.geometry('aud-bust', () => new SphereGeometry(0.23, 8, 5));
  const handGeo = kit.geometry('aud-hand', () => new IcosahedronGeometry(0.055, 0));

  const heads = new InstancedMesh(headGeo, mat, Math.max(1, n));
  const busts = new InstancedMesh(bustGeo, mat, Math.max(1, n));
  const hands = new InstancedMesh(handGeo, mat, Math.max(1, n * 2));
  for (const m of [heads, busts, hands]) {
    m.frustumCulled = false;   // one bounding sphere for the whole house
    m.castShadow = false;
    m.receiveShadow = false;
    root.add(m);
  }

  // A few percent of brightness variation. Not visible as individuals; very
  // visible as the difference between a crowd and a cardboard cutout.
  const tone = new Color();
  const baseTone = new Color(dark);
  for (let i = 0; i < n; i++) {
    const k = 0.86 + rng.next() * 0.3;
    tone.copy(baseTone).multiplyScalar(k);
    heads.setColorAt(i, tone);
    busts.setColorAt(i, tone.clone().multiplyScalar(0.82));
    hands.setColorAt(i * 2, tone);
    hands.setColorAt(i * 2 + 1, tone);
  }
  for (const m of [heads, busts, hands]) {
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }

  // --- state -------------------------------------------------------------
  const dummy = new Object3D();
  let quality: Quality = o.quality;
  let shown = Math.min(n, CAP[quality]);
  let time = 0;
  let applause = 0;
  let applauseTarget = 0;
  let gaspAt = -99;
  let attention = 0;
  let attentionTarget = 0;
  let lastNow = Number.NaN;
  let clockLife = 0;
  const idle = o.reducedMotion ? 0.22 : 1;

  function draw(now: number, dt: number): void {
    time += dt;

    // Applause rises fast and dies slowly, like a room does.
    applauseTarget *= Math.exp(-dt / 1.9);
    applause += (applauseTarget - applause) * Math.min(1, dt * 9);
    attention += (attentionTarget - attention) * Math.min(1, dt * 2.2);

    // Is there a clock? A beat that has stopped advancing means the transport
    // is stopped, and the house goes back to breathing on wall time.
    const live = Number.isFinite(now) && now !== lastNow;
    lastNow = now;
    clockLife += ((live ? 1 : 0) - clockLife) * Math.min(1, dt * 3);

    const gaspAge = time - gaspAt;
    const beat = Number.isFinite(now) ? now : 0;

    for (let i = 0; i < shown; i++) {
      const p = people[i]!;
      // Half-note nod on the song clock, slow breath off it. Blended so a
      // transport that starts mid-frame does not snap the whole house.
      const nod = clockLife * Math.sin(beat * Math.PI + p.phase)
        + (1 - clockLife) * Math.sin(time * p.rate + p.phase);
      const sway = Math.sin(time * 0.31 * p.rate + p.phase * 1.7);

      // A gasp travels: the front of the house recoils a frame before the back.
      const g = gaspAge - p.gaspLag;
      const gasp = g >= 0 && g < 1.1 ? Math.sin(Math.PI * (g / 1.1)) ** 2 : 0;

      const excite = applause * (0.6 + p.demonstrative * 0.8);
      const bob = nod * (0.016 + excite * 0.05) * idle;

      const x = p.x + sway * 0.022 * idle * (1 - attention * 0.6);
      const y = p.y + bob + gasp * 0.045 + excite * 0.02;
      // +z is toward the audience: a solo leans them in, a tomato throws them
      // back into their seats.
      const z = p.z - attention * 0.11 + gasp * 0.14;

      dummy.position.set(x, y, z);
      dummy.rotation.set(gasp * -0.16 + nod * 0.05 * idle, p.yaw + sway * 0.05, 0);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      heads.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x - sway * 0.006, y - 0.3 * p.scale, z + 0.02);
      dummy.rotation.set(attention * 0.12, p.yaw * 0.6, 0);
      dummy.scale.set(p.scale * 1.45, p.scale * 0.95, p.scale * 0.95);
      dummy.updateMatrix();
      busts.setMatrixAt(i, dummy.matrix);

      // Hands: in the lap, or up and clapping, or over the head if this one is
      // the sort. The clap is the only fast motion in the house and it is what
      // makes applause read from thirty feet away.
      const clap = Math.sin(time * p.clapRate * 6.283 + p.clapPhase);
      const lift = excite * (0.34 + p.demonstrative * 0.42);
      // The clap itself is fast repetitive motion, so it is the oscillation
      // rather than the raised hands that reduced motion takes away.
      const sep = 0.115 - excite * 0.055 * (0.5 + 0.5 * clap * idle);
      const hy = y - 0.36 * p.scale + lift;
      const hz = z + 0.14 + excite * 0.06;
      for (let h = 0; h < 2; h++) {
        dummy.position.set(x + (h === 0 ? -sep : sep), hy, hz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        hands.setMatrixAt(i * 2 + h, dummy.matrix);
      }
    }

    heads.count = shown;
    busts.count = shown;
    hands.count = shown * 2;
    heads.instanceMatrix.needsUpdate = true;
    busts.instanceMatrix.needsUpdate = true;
    hands.instanceMatrix.needsUpdate = true;
  }

  // Place everyone once so a stage that is built and never updated still has a
  // house in it rather than a hundred people stacked at the origin.
  draw(Number.NaN, 0);

  return {
    root,
    count: () => shown,
    capacity: () => n,
    applaud(intensity: number): void {
      const v = Number.isFinite(intensity) ? Math.max(0, Math.min(1, intensity)) : 0.6;
      applauseTarget = Math.max(applauseTarget, v);
    },
    gasp(): void { gaspAt = time; },
    setAttention(level: number): void {
      attentionTarget = Number.isFinite(level) ? Math.max(0, Math.min(1, level)) : 0;
    },
    setQuality(q: Quality): void {
      quality = q;
      shown = Math.min(n, CAP[quality]);
    },
    update: draw,
  };
}
