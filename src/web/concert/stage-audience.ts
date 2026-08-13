/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The house — silhouetted people in the near foreground.
 *
 * A concert with no crowd is a rehearsal, so this is not decoration; it is
 * half of what tells you what kind of room you are in. It is also the only
 * thing on this stage that exists in the hundreds, which decides everything
 * about how it is built:
 *
 * - **Three `InstancedMesh`es for the whole house.** Heads, bodies, hands.
 *   A hundred and sixty people cost three draw calls and about thirty thousand
 *   triangles of very small, very dark geometry. Adding a fourth part to a
 *   person is a whole extra draw call, which is why they do not have arms.
 * - **The body reaches the floor.** It was a shoulder blob — a squashed sphere
 *   ending at the ribs — which is fine in a seated house where the row in front
 *   hides everybody's middle, and is a row of heads hanging in mid-air at a
 *   tanssilava, where the crowd is standing on an open dance floor with nothing
 *   in front of it. It is now a tapered column anchored at the feet and
 *   restretched to the shoulders every frame, so a bobbing head cannot lift
 *   anybody off the boards. Same draw call, fewer triangles than the sphere.
 * - **A seated house sits.** `audience.seated` used to buy nothing but a
 *   shorter person: the same column, floor to shoulder, with its head at 1.14 m
 *   instead of 1.62. That is not somebody in a chair, it is somebody 0.48 m
 *   shorter standing in one, and it read as exactly that in every room that
 *   draws the chairs — a rank of `stalls` pans with a body passing straight
 *   down through each of them. A seated person is now three instances of the
 *   *same* column: a torso standing out of the seat, a lap laid forward over it
 *   and shins back down to the floor. Three times the instances in a seated
 *   room and **no extra draw call**, which is the whole reason the parts are
 *   one geometry rather than the four the shape wants.
 * - **The chair decides the hip height, not the person.** `SEAT_Y` is not
 *   scaled by `p.scale` the way the shoulder is. A taller person on the same
 *   seat has a longer torso, not higher hips, and the alternative puts a tenth
 *   of the house a few centimetres inside the pan `stage-props.ts` drew.
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
  Color, CylinderGeometry, Group, IcosahedronGeometry, InstancedMesh, Object3D,
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
  standing: { gap: 0.8, rake: 0.05, head: 1.62 },
} as const;

/**
 * Half the width of a person at the shoulders, and the number the rest of the
 * body is measured against.
 *
 * It was 0.335 — a 0.67 m shoulder, half again as wide as anybody's, and the
 * reason a standing house did not look like one. Height was never the problem:
 * a standing person here is 1.62 m to the middle of the head and 1.74 m to the
 * top of it, which is an adult in shoes. But a silhouette is read by its
 * *proportion*, and 1.74 m over a 0.67 m shoulder is a bollard. It compounded
 * at the spacing, too: people stand 0.58 m apart, so bodies that wide overlap
 * their neighbours and a row stopped being people at all — it merged into one
 * dark band with heads sitting on top, which is exactly the shape a seated
 * crowd makes. Standing, and reading as seated.
 *
 * 0.235 is a 0.47 m shoulder, or a shade under 0.45 across the flats of a
 * seven-sided column. Two head-widths, where the old one was nearly three, and
 * it leaves a hand's breadth of air between neighbours so a row is individuals.
 *
 * The depth is not the same number. A person is much thinner front to back than
 * side to side and the old one was nearly round, which cost nothing head-on and
 * everything the moment the camera came round the side.
 */
const SHOULDER = 0.235;
const CHEST = 0.15;

/** The gap between rows a house of this kind is built with. */
export function rowGap(seated: boolean): number {
  return (seated ? ROW.seated : ROW.standing).gap;
}

/**
 * The top of the seat, above the row's own floor.
 *
 * Exported for the same reason `rowGap` is, and with less room for argument:
 * this file poses the person and `stage-props.ts` draws the chair under them,
 * and the two numbers are the same number. `stalls` restates the seat pitch,
 * the rake and the stagger rather than importing them — the `HEAD_BAND` bargain
 * its docstring makes — and that is defensible for a pitch, where being wrong
 * costs a pane through a shoulder in a row you can barely see. It is not
 * defensible for this one: a pan and a pair of hips that disagree by 0.05 m is
 * a whole house hovering, in the front row, in the first frame.
 *
 * 0.44 m is a chair. It is also where the seat back `stalls` has always drawn
 * ends — its pane spans 0.41 to 0.91 over the row's floor — so the pan this
 * height puts under the crowd meets a back that was already at the right
 * height, and nothing about the picture from behind the last row changes.
 */
export const SEAT_Y = 0.44;

/**
 * The rest of a seated body, in the units the column is scaled in.
 *
 * Radii, not widths: the geometry is a unit-radius cylinder, so `wide: 0.19` is
 * a 0.38 m lap. Each is a little narrower than the part above it, which is what
 * makes three straight columns read as one person rather than as scaffolding —
 * shoulders 0.47 across, lap 0.38, shins 0.30.
 */
const LAP = {
  /** Half the depth of the thigh, and so how far the hip axis clears the pan. */
  thick: 0.1,
  /** Hip to knee. Long enough that the knees clear the front of the pan. */
  reach: 0.42,
  wide: 0.19,
  shinWide: 0.15,
  shinThick: 0.09,
} as const;

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
  /**
   * y this one is standing on — the house floor, plus their row's rake.
   *
   * The rake is a cheat: the floor plane is flat and the back rows are lifted
   * off it so they clear the front. The body has to end at the level its owner
   * was lifted to rather than at the plane, or the back of a raked house grows
   * a row of giants.
   */
  foot: number;
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
        foot: o.houseY + rake,
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
  // A unit column hanging from its own origin: the top face is the shoulder
  // line at y=0 and the feet are at y=-1, so one scale sets a person's height
  // and nothing has to solve for a centre. Seven sides is enough for a shape
  // that is never lit and never more than a couple of hundred pixels tall.
  const bodyGeo = kit.geometry('aud-body', () => (
    new CylinderGeometry(1, 0.74, 1, 7, 1).translate(0, -0.5, 0)
  ));
  const handGeo = kit.geometry('aud-hand', () => new IcosahedronGeometry(0.055, 0));

  /**
   * Instances of that column per person: one standing, three sitting.
   *
   * The count is the only thing a seated house changes about the mesh. Nothing
   * downstream branches on it — `bodies.count` is `shown * PARTS` and the
   * instance for person `i`, part `k`, is at `i * PARTS + k`.
   */
  const PARTS = seated ? 3 : 1;

  const heads = new InstancedMesh(headGeo, mat, Math.max(1, n));
  const bodies = new InstancedMesh(bodyGeo, mat, Math.max(1, n * PARTS));
  const hands = new InstancedMesh(handGeo, mat, Math.max(1, n * 2));
  for (const m of [heads, bodies, hands]) {
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
    const limb = tone.clone().multiplyScalar(0.82);
    for (let part = 0; part < PARTS; part++) bodies.setColorAt(i * PARTS + part, limb);
    hands.setColorAt(i * 2, tone);
    hands.setColorAt(i * 2 + 1, tone);
  }
  for (const m of [heads, bodies, hands]) {
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }

  // --- state -------------------------------------------------------------
  const dummy = new Object3D();
  // Yaw last, so a limb pitched flat still points where its owner is facing.
  // Under the default XYZ the quarter turn that lays a thigh down is applied
  // after the yaw and eats it — every lap in the house pointing at the stage,
  // whatever the person above it was looking at. It costs the head nothing: a
  // nod about the head's own axis rather than about the room's is what a nod is.
  dummy.rotation.order = 'YXZ';
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

      // Shoulders follow the head; the feet do not move. The column is stood
      // between the two rather than placed at a height, so bobbing, gasping and
      // leaning in all happen without anybody taking off. No lean on x either:
      // the origin is at the shoulders, so a tilt there swings the feet.
      const shoulder = y - 0.12 * p.scale;
      const bx = x - sway * 0.006;
      const bz = z + 0.02;
      const yaw = p.yaw * 0.6;
      // Standing, that is the whole person. Sitting, it is the torso, and what
      // it is stood on is the seat rather than the boards — the hip is the
      // anchor the bob stretches against, so a nodding head cannot lift anybody
      // off their chair for the same reason it cannot lift them off the floor.
      const hip = seated ? p.foot + SEAT_Y : p.foot;
      dummy.position.set(bx, shoulder, bz);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(
        p.scale * SHOULDER, Math.max(0.24, shoulder - hip), p.scale * CHEST,
      );
      dummy.updateMatrix();
      bodies.setMatrixAt(i * PARTS, dummy.matrix);

      if (seated) {
        // Forward is -z: the house faces the stage, which is downstage of it.
        // The column hangs from its own top face, so a quarter turn about x
        // lays it along the lap with the wide end at the hip and the taper at
        // the knee. The shin is the same column left hanging, which is what a
        // shin is — the standing body, from the knee down.
        //
        // The lap and the shins hang off the seat, not off the head: they take
        // the lean and the sway, which move the chair's occupant on the chair,
        // and not the bob, which is a person nodding above a lap that stays
        // where it was put.
        const axis = hip + LAP.thick * p.scale;
        const reach = LAP.reach * p.scale;
        dummy.position.set(bx, axis, bz);
        dummy.rotation.set(Math.PI / 2, yaw, 0);
        dummy.scale.set(p.scale * LAP.wide, reach, p.scale * LAP.thick);
        dummy.updateMatrix();
        bodies.setMatrixAt(i * PARTS + 1, dummy.matrix);

        dummy.position.set(bx - Math.sin(yaw) * reach, axis, bz - Math.cos(yaw) * reach);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(
          p.scale * LAP.shinWide, axis - p.foot, p.scale * LAP.shinThick,
        );
        dummy.updateMatrix();
        bodies.setMatrixAt(i * PARTS + 2, dummy.matrix);
      }

      // Hands: at the sides, or up and clapping, or over the head if this one
      // is the sort. The clap is the only fast motion in the house and it is
      // what makes applause read from thirty feet away.
      const clap = Math.sin(time * p.clapRate * 6.283 + p.clapPhase);
      const lift = excite * (0.34 + p.demonstrative * 0.42);
      // At rest they sit just inside the body's own width, because a person
      // with no arms and a hand floating clear of their side reads as a mistake
      // rather than as a hand. Coming in to the chest is what brings them out.
      // The clap itself is fast repetitive motion, so it is the oscillation
      // rather than the raised hands that reduced motion takes away.
      //
      // Measured off the shoulder rather than in metres, so that narrowing a
      // person cannot leave their hands out in the air beside them: 0.89 of the
      // half-width at rest, a third of it with the hands together clapping.
      const sep = Math.max(0.04, p.scale * SHOULDER * (0.89 - excite * 0.5)
        - excite * 0.035 * (0.5 + 0.5 * clap * idle));
      const hy = y - 0.5 * p.scale + lift;
      const hz = z + 0.16 + excite * 0.08;
      for (let h = 0; h < 2; h++) {
        dummy.position.set(x + (h === 0 ? -sep : sep), hy, hz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        hands.setMatrixAt(i * 2 + h, dummy.matrix);
      }
    }

    heads.count = shown;
    bodies.count = shown * PARTS;
    hands.count = shown * 2;
    heads.instanceMatrix.needsUpdate = true;
    bodies.instanceMatrix.needsUpdate = true;
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
