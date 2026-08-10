/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Flute — held sideways, which is the entire point.
 *
 * The clarinet is a dark vertical dropping from the mouth to the boards; this
 * is a bright horizontal running across the frame to the player's right. Built
 * as opposites on purpose: a wind section where the flute and the clarinet are
 * the same tube at two angles reads as a rendering shortcut, and it is the one
 * mistake in this family that is visible from the back row.
 *
 * Everything else follows from the sideways hold. The player's head turns; the
 * left arm crosses the body; both hands hang *under* the tube with the fingers
 * reaching up and curling over it; and the instrument catches the light along
 * its whole length, which is why it is the one wind here worth making properly
 * silver.
 *
 * ## Which way is out
 *
 * Out to the player's **right**, which is local −x: `SIDE.right === −1` in
 * `performer-look.ts`. The file said "right" and built the tube along +x,
 * which is the player's left — so the flute crossed the wrong shoulder, the
 * left hand ended up further from the lips than the right, and the whole
 * instrument leaned into whoever was standing on that side.
 *
 * ## Two hands, and they do not swap
 *
 * The left hand is the one nearer the lips and the right nearer the foot, on
 * every flute ever made, and neither crosses the other. `resolve` answers per
 * `effector` for exactly that reason; it used to hand both hands the same key.
 *
 * ## Fingering, and the roll
 *
 * An open pipe, so it overblows at the octave: twelve stations, and the second
 * register is the same fingerings taken with the embouchure alone. There is no
 * octave key to animate — so the register drives the thing a flautist actually
 * does instead, which is **roll the instrument out** as the line climbs. That
 * is a real technique, it is free here, and rolling about the tube's own long
 * axis moves a key by less than a millimetre, so no contact drifts under the
 * hand that has been sent to it.
 */

import {
  BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial,
  SphereGeometry, TorusGeometry, Vector3,
} from 'three';

import { ARCHETYPES } from '../../../concert/instruments.js';
import type { Effector, PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import { mouthFor } from './mouth.js';
import type {
  Contact, FingerCurl, InstrumentBuildOptions, InstrumentBuilder, InstrumentModel,
} from './types.js';
import { addTo, fingersOnStack } from './types.js';

// ---------------------------------------------------------------------------
// Fingering
// ---------------------------------------------------------------------------

/** B3: the bottom of a B-foot flute, everything closed. Non-transposing. */
const FLOOR = 59;
const STATIONS = 12;

function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

export interface Fingering {
  /** 0 (all closed, low B) .. 11 (only the top hole closed). */
  station: number;
  /** 0, 1 or 2 — how far the embouchure is doing the work. */
  register: number;
}

export function fingeringFor(midi: number): Fingering {
  return {
    station: mod(midi - FLOOR, STATIONS),
    register: Math.floor((midi - FLOOR) / STATIONS),
  };
}

// ---------------------------------------------------------------------------
// Shared GPU resources
// ---------------------------------------------------------------------------

interface Disposable { dispose(): void }

const CACHE = new Map<string, Disposable>();
let live = 0;

function shared<T extends Disposable>(key: string, make: () => T): T {
  const hit = CACHE.get(key) as T | undefined;
  if (hit) return hit;
  const made = make();
  CACHE.set(key, made);
  return made;
}

function release(): void {
  if (--live > 0) return;
  for (const res of CACHE.values()) res.dispose();
  CACHE.clear();
}

// ---------------------------------------------------------------------------
// Proportions
// ---------------------------------------------------------------------------

const SPEC = ARCHETYPES.flute;

/**
 * A concert flute is 67 cm. Local +x is the **crown** end and −x the foot,
 * because −x is the player's right and that is the way a flute points.
 */
const HALF = 0.335;
/** The embouchure hole sits 16.5 cm in from the crown. */
const LIP_X = HALF - 0.165;
/**
 * Swing of the far end toward the audience, and its droop.
 *
 * **A flute is played square across the player, not aimed at the house.** The
 * swing was 0.70 — 40°, a quarter-turn's worth — and it was there to pay for a
 * mistake in the hands rather than for anything about a flute: both palms were
 * being laid on *top* of the tube, which parks two forearms and two elbows in
 * the chest unless the whole instrument is swung out of the way first. The hands
 * hang under the tube now, where they belong, and the swing has nothing left to
 * buy. See `contactAt`.
 *
 * 0.24 is 14°, which is the few degrees of forward angle a flautist really does
 * carry — enough that the foot joint clears the right shoulder and the crown
 * stays out of the player's own cheek — and it leaves the tube reading as what
 * this file's first paragraph says it is: the one horizontal in the wind
 * section, running across the frame rather than pointing at the camera.
 */
const SWING = 0.24;
const DROOP = 0.14;
/** Keys run between these x, from just past the head joint out to the foot. */
const FIRST_KEY_X = 0.02;
const LAST_KEY_X = -0.30;
/** Stations 0..5 are the right hand's (the foot end), 6..11 the left's. */
const HAND_SPLIT = 6;

export const buildFlute: InstrumentBuilder = (opts: InstrumentBuildOptions): InstrumentModel => {
  live++;
  const rng = new Rng(`flute:${opts.seed}`);

  /** This player's lips; the whole tube is hung off the embouchure hole. */
  const mouth = mouthFor(opts, SPEC.workHeight);

  const bodyHue = opts.finish ?? (rng.chance(0.25) ? '#d8c47a' : '#dfe4ea');
  const matBody = shared(`body:${bodyHue}`, () => new MeshStandardMaterial({
    // Polished harder than anything else in the family. On a lit stage the
    // flute is a line of light, and that is most of what it contributes.
    color: bodyHue, roughness: 0.13, metalness: 0.97,
  }));
  const matKeys = shared('keys', () => new MeshStandardMaterial({
    color: '#c7ccd3', roughness: 0.26, metalness: 0.9,
  }));
  const matDark = shared('dark', () => new MeshStandardMaterial({
    color: '#2a2724', roughness: 0.6, metalness: 0.1,
  }));

  const alongX = (g: CylinderGeometry): CylinderGeometry => g.rotateZ(Math.PI / 2);
  const geoHead = shared('head', () => alongX(new CylinderGeometry(0.0105, 0.0105, 0.220, 12)));
  const geoBody = shared('bodyjoint', () => alongX(new CylinderGeometry(0.0098, 0.0098, 0.315, 12)));
  const geoFoot = shared('foot', () => alongX(new CylinderGeometry(0.0092, 0.0092, 0.135, 12)));
  const geoCrown = shared('crown', () => alongX(new CylinderGeometry(0.0118, 0.0118, 0.018, 12)));
  const geoLipPlate = shared('lipplate', () => new BoxGeometry(0.034, 0.005, 0.026));
  const geoLipRim = shared('liprim', () => new TorusGeometry(0.0062, 0.0026, 4, 10).rotateX(Math.PI / 2));
  const geoCup = shared('cup', () => new CylinderGeometry(0.0115, 0.0115, 0.004, 8));
  const geoRod = shared('rod', () => alongX(new CylinderGeometry(0.0026, 0.0026, 0.30, 6)));
  const geoTenon = shared('tenon', () => alongX(new CylinderGeometry(0.0112, 0.0112, 0.016, 10)));
  const geoTip = shared('tip', () => new SphereGeometry(0.0104, 10, 6));

  // --- assembly ----------------------------------------------------------
  const root = new Group();
  root.name = 'flute';

  /**
   * Flute frame: local +x runs from the crown, past the lips, out to the foot;
   * local +y is the keyed top. The whole thing swings toward the audience and
   * droops a little, which is how one is actually held and also how it stops
   * being a line pointing straight out of frame.
   */
  const flute = addTo(root, new Group());
  flute.rotation.set(0, SWING, DROOP);
  // Put the lips at the same height every blown archetype puts a mouth.
  const lipLocal = new Vector3(LIP_X, 0, 0).applyEuler(flute.rotation);
  flute.position.set(0, mouth.y - lipLocal.y, -lipLocal.z);

  /**
   * The roll group: everything hangs off it, and it turns about the tube's own
   * long axis. Because that axis passes through the bore, a key 14 mm out
   * moves under a degree of roll by less than a millimetre.
   */
  const roll = addTo(flute, new Group());

  flute.updateMatrix();
  const fluteMatrix = flute.matrix.clone();

  // Everything is laid out from the crown at +x down to the foot at −x, so a
  // joint's position is the crown minus how far along the tube it sits.
  const head = addTo(roll, new Mesh(geoHead, matBody));
  head.name = 'head-joint';
  head.position.x = HALF - 0.110;
  head.castShadow = true;
  const crown = addTo(roll, new Mesh(geoCrown, matDark));
  crown.name = 'crown';
  crown.position.x = HALF - 0.009;
  const body = addTo(roll, new Mesh(geoBody, matBody));
  body.name = 'body-joint';
  body.position.x = HALF - 0.220 - 0.1575;
  body.castShadow = true;
  const foot = addTo(roll, new Mesh(geoFoot, matBody));
  foot.name = 'foot-joint';
  foot.position.x = HALF - 0.535 - 0.0675;
  foot.castShadow = true;
  const tip = addTo(roll, new Mesh(geoTip, matBody));
  tip.name = 'foot-tip';
  tip.position.x = -HALF;

  for (const x of [0.220, 0.535]) {
    const tenon = addTo(roll, new Mesh(geoTenon, matBody));
    tenon.name = 'tenon';
    tenon.position.x = HALF - x;
  }

  const lipPlate = addTo(roll, new Mesh(geoLipPlate, matBody));
  lipPlate.name = 'mouthpiece';
  lipPlate.position.set(LIP_X, 0.0095, 0);
  const lipRim = addTo(roll, new Mesh(geoLipRim, matBody));
  lipRim.name = 'embouchure';
  lipRim.position.set(LIP_X, 0.0125, 0);

  for (const x of [0.02, 0.24]) {
    const rod = addTo(roll, new Mesh(geoRod, matKeys));
    rod.name = 'rod';
    rod.position.set(HALF - x - 0.15, 0.0138, -0.0075);
  }

  /** Twelve stations, twelve cups, laid from the foot back toward the lips. */
  const stationX: number[] = [];
  for (let i = 0; i < STATIONS; i++) {
    stationX.push(LAST_KEY_X - (i / (STATIONS - 1)) * (LAST_KEY_X - FIRST_KEY_X));
  }
  const pads: Group[] = stationX.map((x, i) => {
    const hinge = addTo(roll, new Group());
    hinge.position.set(x, 0.0092, -0.0075);
    const cup = addTo(hinge, new Mesh(geoCup, matKeys));
    cup.name = `pad-${i}`;
    cup.position.set(0, 0.0022, 0.0075);
    return hinge;
  });

  // --- contacts ----------------------------------------------------------
  /**
   * A contact is where the hand goes, not the fingertip.
   *
   * The stations are 29 mm apart and a hand is 80 mm across, so the two hands
   * are backed off toward their own ends of the tube by half a hand. Without
   * it, a note either side of the split puts two palms 29 mm apart on a 20 mm
   * pipe.
   */
  /**
   * ## Nobody plays a flute from above
   *
   * Everything here was written as if the tube were a keyboard: `normal` was
   * `+y`, so both palms lay on top of the pipe with the fingers hanging *down*
   * the far side of it. That is a hand on a piano, moved sideways. On a flute
   * **both hands hang underneath and the fingers point up**, arching over the
   * tube so the pads come down on the cups from the near side — which is why a
   * flautist's knuckles are the part of them an audience sees and why the wrists
   * sit a hand's depth below the instrument, not on it.
   *
   * ## Which side of the tube each hand is on
   *
   * Not the same side, and the difference is the whole of how a flute is held
   * up. It balances on three points — the chin against the lip plate pushing
   * *out*, the base of the left index finger pushing *back*, and the right thumb
   * underneath — so the two hands come at the tube from opposite sides:
   *
   *  - **Left**, at the crown end: in front of the tube, on the audience's side
   *    of it. Palm turned back toward the player, fingers reaching up and
   *    curling *toward* the player over the top, thumb reaching under and round
   *    to the B key at the back. This is the hand the flute leans on, and the
   *    bent wrist that costs is the most recognisable thing about a flautist.
   *  - **Right**, at the foot: behind the tube, on the player's side. Palm
   *    turned out at the room, fingers up and curling *away* over the top, thumb
   *    under the pipe holding it out against the chin.
   *
   * `side` is `+1` for the left hand and `−1` for the right, and it signs both
   * vectors below, so the two hands are one mirror pair about the tube's axis.
   *
   * ## Reading the two vectors
   *
   * The rig takes `normal` as the **back** of the hand and lays the knuckle line
   * along `along`; the fingers come out of the pair as `along × normal`, and the
   * palm faces `−normal`. So neither of these is written in the direction it
   * reads — a palm turned toward the player is a `normal` pointing away from
   * them, and the fingers point up because the two vectors are both horizontal.
   * Local `+z` is out toward the audience, local `−x` is the foot.
   *
   * The small `−y` in `normal` is the last of it: it tips each palm a few
   * degrees up toward the pipe it is under, which is what puts the knuckles a
   * finger's width to their own side of the tube instead of directly beneath it,
   * and so what makes the fingers *arch* rather than stand straight up.
   */
  const HAND = 0.032;

  function contactAt(station: number, side: number): Contact {
    return {
      position: new Vector3(stationX[station]! + side * HAND, 0.017, -0.004)
        .applyMatrix4(fluteMatrix),
      normal: new Vector3(0, -0.09, side).normalize()
        .transformDirection(fluteMatrix),
      // Knuckles across the tube, index toward the crown on both hands — which
      // is the order `fingersOnStack` hands out, the index taking the topmost
      // station of the pair's block. The rig seats the index next to the thumb
      // at local `−x` on a left hand and `+x` on a right, so the sign is `−side`
      // for both and not the `side` it read before: the two hands were each
      // fingering their own block backwards, little finger up at the crown.
      along: new Vector3(-side, 0, 0).transformDirection(fluteMatrix),
    };
  }
  const rightContacts: Contact[] = stationX.map((_, i) => contactAt(i, -1));
  const leftContacts: Contact[] = stationX.map((_, i) => contactAt(i, 1));

  /**
   * Which of each hand's fingers are down, per speaking hole, keyed by the
   * speaking station rather than the clamped one. See `Contact.fingers` and
   * `fingersOnStack`; the saxophone's copy of this table says what keying it
   * the other way costs.
   *
   * A flute has no octave key and no register lever, so this is the *only*
   * thing on the instrument that moves with the pitch other than the pads and
   * the roll — which is exactly the reason `react` was already given the roll
   * to animate. Now the pads have somebody pressing them.
   */
  const rightFingers = stationX.map((_, s) => fingersOnStack(0, HAND_SPLIT - 1, s));
  const leftFingers = stationX.map((_, s) => fingersOnStack(HAND_SPLIT, STATIONS - 1, s));

  /** Neither hand crosses to the other's keys. */
  function stationFor(station: number, right: boolean): number {
    return right
      ? Math.min(station, HAND_SPLIT - 1)
      : Math.max(station, HAND_SPLIT);
  }

  /** Hands stay over their own keys between phrases; a flute is never put down. */
  const restRight = rightContacts[HAND_SPLIT - 3]!;
  const restLeft = leftContacts[HAND_SPLIT + 3]!;

  function copy(c: Contact, fingers?: FingerCurl): Contact {
    // With `along`, which the old copy dropped on the floor. `fingers` is
    // shared rather than cloned: a frozen tuple off a table, and nothing a
    // caller can transform in place.
    return {
      position: c.position.clone(),
      normal: c.normal.clone(),
      ...(c.along ? { along: c.along.clone() } : {}),
      ...(fingers ? { fingers } : {}),
    };
  }

  /** `'right-hand'` and `'bow'` ask for the sounding hand. See `InstrumentModel`. */
  function isRight(effector?: Effector): boolean {
    return effector === undefined || effector === 'right-hand' || effector === 'bow';
  }

  const [LO, HI] = SPEC.range;

  // --- animation state ---------------------------------------------------
  const closed: number[] = stationX.map(() => 1);
  const closedTo: number[] = stationX.map(() => 1);
  let rollAt = 0;
  let rollTo = 0;
  let shiver = 0;
  let lastBeat = Number.NaN;
  /** Guards a second `dispose`: `release` is refcounted across the stage. */
  let disposed = false;

  return {
    archetype: 'flute',
    root,
    station: {
      // Behind the lips, not behind the instrument: the player's shoulders sit
      // where the head joint is, not at the middle of the tube. The z puts the
      // embouchure 0.12 m in front of the body axis, at the mouth.
      offset: new Vector3(lipLocal.x, 0, -mouth.z),
      facing: 0,
      posture: SPEC.posture,
    },

    resolve(point: PlayPoint, effector?: Effector): Contact | undefined {
      const right = isRight(effector);
      if (point.kind === 'rest') return copy(right ? restRight : restLeft);
      if (point.kind !== 'hole') return undefined;
      if (point.midi < LO || point.midi > HI) return undefined;
      const speaking = fingeringFor(point.midi).station;
      const station = stationFor(speaking, right);
      return copy(
        (right ? rightContacts : leftContacts)[station]!,
        (right ? rightFingers : leftFingers)[speaking]!,
      );
    },

    react(point: PlayPoint, force: number, _now: number): void {
      if (point.kind === 'rest') {
        rollTo = 0;
        return;
      }
      if (point.kind !== 'hole') return;
      if (point.midi < LO || point.midi > HI) return;
      const { station, register } = fingeringFor(point.midi);
      for (let i = 0; i < STATIONS; i++) closedTo[i] = i >= station ? 1 : 0;
      // Rolled out for the top octave, back in for the bottom. Real, and the
      // only thing on a flute that says which register you are in.
      rollTo = Math.min(register, 2) * 0.055;
      shiver = Math.max(shiver, Math.min(Math.max(force, 0), 1));
    },

    update(now: number): void {
      // A non-finite beat has to stop here. `dt` would be NaN, every eased
      // value in this method is `x += (target − x) * k`, and one NaN k turns
      // the whole instrument into NaN transforms permanently — three.js keeps
      // drawing it, at no position, for the rest of the show.
      if (!Number.isFinite(now)) return;
      const dt = Number.isFinite(lastBeat) ? Math.min(Math.max(now - lastBeat, 0), 0.5) : 0;
      lastBeat = now;
      if (dt === 0) return;

      const k = 1 - Math.exp(-dt / 0.03);
      for (let i = 0; i < STATIONS; i++) {
        closed[i] = closed[i]! + (closedTo[i]! - closed[i]!) * k;
        pads[i]!.rotation.x = 0.30 * (1 - closed[i]!);
      }
      shiver += (0 - shiver) * (1 - Math.exp(-dt / 0.10));
      rollAt += (rollTo - rollAt) * (1 - Math.exp(-dt / 0.14));
      roll.rotation.x = rollAt + 0.03 * shiver;
    },

    dispose(): void {
      // A second call would free the shared buffers out from under every
      // other one of these on the stage. That renders as nothing at all and
      // reports nothing, so it is guarded rather than left to be noticed.
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      root.clear();
      release();
    },
  };
};
