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
 * left arm crosses the body; the fingers run *away* from the audience rather
 * than down; and the instrument catches the light along its whole length,
 * which is why it is the one wind here worth making properly silver.
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
import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import type {
  Contact, InstrumentBuildOptions, InstrumentBuilder, InstrumentModel,
} from './types.js';
import { addTo } from './types.js';

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

/** A concert flute is 67 cm; the local frame runs from -x to +x through it. */
const HALF = 0.335;
/** The embouchure hole sits 16.5 cm in from the crown. */
const LIP_X = -HALF + 0.165;
/** Swing of the far end toward the audience, and its droop. */
const SWING = -0.30;
const DROOP = -0.14;
/** Keys run between these x, from just past the head joint to the foot. */
const FIRST_KEY_X = -0.02;
const LAST_KEY_X = 0.30;

export const buildFlute: InstrumentBuilder = (opts: InstrumentBuildOptions): InstrumentModel => {
  live++;
  const rng = new Rng(`flute:${opts.seed}`);

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
  flute.position.set(0, SPEC.workHeight - lipLocal.y, -lipLocal.z);

  /**
   * The roll group: everything hangs off it, and it turns about the tube's own
   * long axis. Because that axis passes through the bore, a key 14 mm out
   * moves under a degree of roll by less than a millimetre.
   */
  const roll = addTo(flute, new Group());

  flute.updateMatrix();
  const fluteMatrix = flute.matrix.clone();

  const head = addTo(roll, new Mesh(geoHead, matBody));
  head.position.x = -HALF + 0.110;
  head.castShadow = true;
  const crown = addTo(roll, new Mesh(geoCrown, matDark));
  crown.position.x = -HALF + 0.009;
  const body = addTo(roll, new Mesh(geoBody, matBody));
  body.position.x = -HALF + 0.220 + 0.1575;
  body.castShadow = true;
  const foot = addTo(roll, new Mesh(geoFoot, matBody));
  foot.position.x = -HALF + 0.535 + 0.0675;
  foot.castShadow = true;
  const tip = addTo(roll, new Mesh(geoTip, matBody));
  tip.position.x = HALF;

  for (const x of [-HALF + 0.220, -HALF + 0.535]) {
    const tenon = addTo(roll, new Mesh(geoTenon, matBody));
    tenon.position.x = x;
  }

  const lipPlate = addTo(roll, new Mesh(geoLipPlate, matBody));
  lipPlate.position.set(LIP_X, 0.0095, 0);
  const lipRim = addTo(roll, new Mesh(geoLipRim, matBody));
  lipRim.position.set(LIP_X, 0.0125, 0);

  for (const x of [0.02, 0.24]) {
    const rod = addTo(roll, new Mesh(geoRod, matKeys));
    rod.position.set(-HALF + x + 0.15, 0.0138, -0.0075);
  }

  /** Twelve stations, twelve cups, laid from the foot back toward the lips. */
  const stationX: number[] = [];
  for (let i = 0; i < STATIONS; i++) {
    stationX.push(LAST_KEY_X - (i / (STATIONS - 1)) * (LAST_KEY_X - FIRST_KEY_X));
  }
  const pads: Group[] = stationX.map((x) => {
    const hinge = addTo(roll, new Group());
    hinge.position.set(x, 0.0092, -0.0075);
    const cup = addTo(hinge, new Mesh(geoCup, matKeys));
    cup.position.set(0, 0.0022, 0.0075);
    return hinge;
  });

  // --- contacts ----------------------------------------------------------
  const contacts: Contact[] = stationX.map((x) => ({
    position: new Vector3(x, 0.017, -0.004).applyMatrix4(fluteMatrix),
    // Down onto the keys from above and slightly behind: a flautist's fingers
    // curl over the top of the tube from the player's side.
    normal: new Vector3(0, 1, -0.35).normalize().transformDirection(fluteMatrix),
      // The keys run the length of the tube, so the knuckles do too.
      along: new Vector3(0, 1, 0).transformDirection(fluteMatrix),
  }));
  /** Hands stay over the keys between phrases; a flute is never put down. */
  const restContact = contacts[6]!;

  function copy(c: Contact): Contact {
    return { position: c.position.clone(), normal: c.normal.clone() };
  }

  const [LO, HI] = SPEC.range;

  // --- animation state ---------------------------------------------------
  const closed: number[] = stationX.map(() => 1);
  const closedTo: number[] = stationX.map(() => 1);
  let rollAt = 0;
  let rollTo = 0;
  let shiver = 0;
  let lastBeat = Number.NaN;

  return {
    archetype: 'flute',
    root,
    station: {
      // Behind the lips, not behind the instrument: the player's shoulders sit
      // where the head joint is, not at the middle of the tube.
      offset: new Vector3(LIP_X * 1.05, 0, -0.16),
      facing: 0,
      posture: SPEC.posture,
    },

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') return copy(restContact);
      if (point.kind !== 'hole') return undefined;
      if (point.midi < LO || point.midi > HI) return undefined;
      return copy(contacts[fingeringFor(point.midi).station]!);
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
      root.removeFromParent();
      root.clear();
      release();
    },
  };
};
