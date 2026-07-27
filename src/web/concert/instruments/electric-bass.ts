/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Electric bass — four strings, twenty frets, a 34" scale.
 *
 * The same equal-tempered rule as every other fretted thing on this stage,
 * over a much longer string: `SCALE * 2^(-n/12)` from the bridge. Because the
 * scale is a third longer than a guitar's, first position is a genuinely wide
 * reach and the frets stay far apart much further up the neck — which is
 * visible, and is why a bassist's hand moves in a way a guitarist's does not.
 *
 * The origin sits at the *instrument's* centre rather than under the body:
 * with a 0.86 m string plus a headstock, hanging the origin off the body would
 * put the nut outside the 0.7 m footprint the archetype declares.
 *
 * Build frame: `+x` bridge → nut, `+y` out of the face, `+z` low → high string.
 */

import {
  BoxGeometry, type BufferGeometry, CylinderGeometry, ExtrudeGeometry, Group,
  InstancedMesh, type Material, Matrix4, Mesh, MeshStandardMaterial, Shape,
  Vector3,
} from 'three';

import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import {
  addTo, type Contact, type InstrumentBuilder, type InstrumentModel,
  type PlayerStation,
} from './types.js';

const SCALE = 0.864;
/** Matches `ARCHETYPES['electric-bass'].frets`. */
const FRETS = 20;
const STRINGS = 4;
const NUT_SPREAD = 0.031;
const BRIDGE_SPREAD = 0.057;
const STRING_HEIGHT = 0.006;
const FINGER_HEIGHT = 0.015;
/** Fingerstyle: over the pickup, thumb on it. */
const PLUCK_X = 0.175;
const IDLE_X = SCALE * Math.pow(2, -3 / 12);

const NECK_TILT = 0.28;
const FACE = new Vector3(0, 1, 0);
/** Up the neck: the plucking hand, over the top. See `acoustic-guitar.ts`. */
const UP_NECK = new Vector3(1, 0, 0);
/**
 * Nut toward bridge: the stopping hand, index at the nut and therefore coming
 * at the board **from underneath** — palm below the neck on the G-string side,
 * thumb behind it, fingertips reaching up across the strings to the E. The
 * argument is in `acoustic-guitar.ts` and a long scale only makes it louder:
 * a bassist's wrist is the most visible thing on the neck, and it was sitting
 * on top of it with the fingers hanging down.
 */
const DOWN_NECK = new Vector3(-1, 0, 0);

function mountBasis(alongStrings: Vector3, faceHint: Vector3, at: Vector3): Matrix4 {
  const x = alongStrings.clone().normalize();
  const y = faceHint.clone().addScaledVector(x, -faceHint.dot(x)).normalize();
  const z = new Vector3().crossVectors(x, y);
  return new Matrix4().makeBasis(x, y, z).setPosition(at);
}

const MOUNT = mountBasis(
  new Vector3(Math.cos(NECK_TILT), Math.sin(NECK_TILT), 0),
  new Vector3(0, 0.26, 0.96),
  new Vector3(-0.340, 0.885, 0.085),
);

function fretX(n: number): number {
  return SCALE * Math.pow(2, -n / 12);
}

function stringZ(i: number, x: number): number {
  const t = Math.min(Math.max(x / SCALE, 0), 1);
  const spread = BRIDGE_SPREAD + (NUT_SPREAD - BRIDGE_SPREAD) * t;
  return (i - (STRINGS - 1) / 2) * (spread / (STRINGS - 1));
}

function contactAt(x: number, y: number, z: number, along: Vector3): Contact {
  return {
    position: new Vector3(x, y, z).applyMatrix4(MOUNT),
    normal: FACE.clone().transformDirection(MOUNT),
    along: along.clone().transformDirection(MOUNT),
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

/** One long horn, one stub, a deep waist. A slab bass, more or less. */
function bodyOutline(bout: number, horn: number): Shape {
  const s = new Shape();
  const tail = -0.265;
  const pocket = 0.345;
  s.moveTo(tail, 0);
  s.bezierCurveTo(tail - 0.008, bout * 0.7, tail + 0.055, bout, tail + 0.165, bout);
  s.bezierCurveTo(tail + 0.27, bout, 0.09, 0.140, 0.150, 0.118);
  s.bezierCurveTo(0.225, 0.094, 0.300, 0.120, 0.360, horn);
  s.bezierCurveTo(0.412, horn + 0.030, 0.432, horn - 0.020, 0.408, 0.092);
  s.bezierCurveTo(0.386, 0.066, 0.362, 0.062, pocket, 0.036);
  s.lineTo(pocket, -0.036);
  s.bezierCurveTo(0.362, -0.062, 0.378, -0.066, 0.378, -0.094);
  s.bezierCurveTo(0.378, -0.128, 0.338, -0.140, 0.296, -0.136);
  s.bezierCurveTo(0.230, -0.130, 0.190, -0.146, 0.145, -0.162);
  s.bezierCurveTo(0.070, -0.192, tail + 0.27, -bout * 0.97, tail + 0.165, -bout * 0.97);
  s.bezierCurveTo(tail + 0.055, -bout * 0.97, tail - 0.008, -bout * 0.7, tail, 0);
  return s;
}

/** Not part of `InstrumentModel`. See the note on `soundingContact`. */
export interface ElectricBassModel extends InstrumentModel {
  /** Where the plucking hand goes. `resolve` answers for the stopping hand. */
  soundingContact(point: PlayPoint): Contact | undefined;
}

export const buildElectricBass: InstrumentBuilder = (opts) => {
  const rng = new Rng(`electric-bass:${opts.seed}`);
  const kit = new Kit();

  const root = new Group();
  root.name = 'electric-bass';
  const recoil = addTo(root, new Group());
  const inst = addTo(recoil, new Group());
  inst.applyMatrix4(MOUNT);

  const bodyMat = kit.mat(new MeshStandardMaterial({
    color: opts.finish ?? rng.pick(['#2f4f7a', '#8c2f2c', '#e6e0cd', '#1f2124', '#4d3a6b']),
    roughness: 0.3, metalness: 0.1,
  }));
  const darkMat = kit.mat(new MeshStandardMaterial({ color: '#1b1815', roughness: 0.5 }));
  const neckMat = kit.mat(new MeshStandardMaterial({
    color: rng.pick(['#c9a066', '#b2854c', '#d8bb84']), roughness: 0.55,
  }));
  const chromeMat = kit.mat(new MeshStandardMaterial({
    color: '#cfd3d8', roughness: 0.24, metalness: 0.9, flatShading: true,
  }));
  const stringMat = kit.mat(new MeshStandardMaterial({
    color: '#c6c0ab', roughness: 0.4, metalness: 0.6,
  }));

  // --- Body ----------------------------------------------------------------
  const bodyGeo = kit.geo(new ExtrudeGeometry(
    bodyOutline(0.215 * rng.float(0.96, 1.04), 0.150 * rng.float(0.95, 1.06)),
    {
      depth: 0.042, bevelEnabled: true, bevelThickness: 0.013,
      bevelSize: 0.012, bevelSegments: 2, curveSegments: 6,
    },
  ));
  bodyGeo.rotateX(-Math.PI / 2);
  bodyGeo.translate(0, -0.066, 0);
  const body = addTo(inst, new Mesh(bodyGeo, bodyMat));
  body.castShadow = true;
  body.receiveShadow = true;

  const plate = addTo(inst, new Mesh(bodyGeo, kit.mat(new MeshStandardMaterial({
    color: rng.pick(['#efe7d2', '#22222a', '#c8ccd0']), roughness: 0.35,
  }))));
  plate.scale.set(0.9, 0.055, 0.9);
  plate.position.set(0.016, -0.0114, -0.012);

  // --- Neck, fretboard, frets ---------------------------------------------
  const neckGeo = kit.geo(new BoxGeometry(SCALE - 0.30, 0.024, 0.062));
  const neck = addTo(inst, new Mesh(neckGeo, neckMat));
  neck.position.set((SCALE + 0.30) / 2, -0.020, 0);
  neck.castShadow = true;

  const boardGeo = kit.geo(new BoxGeometry(SCALE - 0.075, 0.008, 0.066));
  addTo(inst, new Mesh(boardGeo, darkMat)).position.set((SCALE + 0.075) / 2, -0.005, 0);

  const fretGeo = kit.geo(new BoxGeometry(0.0028, 0.0034, 0.066));
  const frets = addTo(inst, new InstancedMesh(fretGeo, chromeMat, FRETS));
  {
    const m = new Matrix4();
    for (let n = 1; n <= FRETS; n++) {
      frets.setMatrixAt(n - 1, m.makeTranslation(fretX(n), 0.0004, 0));
    }
    frets.instanceMatrix.needsUpdate = true;
  }

  // --- Headstock: four big tuners, all on one side ------------------------
  const headGeo = kit.geo(new BoxGeometry(0.185, 0.015, 0.078));
  const head = addTo(inst, new Mesh(headGeo, neckMat));
  head.position.set(SCALE + 0.088, -0.020, 0.010);
  head.rotation.z = -0.13;
  head.castShadow = true;

  const pegGeo = kit.geo(new CylinderGeometry(0.008, 0.013, 0.032, 6));
  const keyGeo = kit.geo(new BoxGeometry(0.030, 0.004, 0.010));
  const pegs = addTo(inst, new InstancedMesh(pegGeo, chromeMat, STRINGS));
  const keys = addTo(inst, new InstancedMesh(keyGeo, chromeMat, STRINGS));
  {
    const m = new Matrix4();
    for (let i = 0; i < STRINGS; i++) {
      const x = SCALE + 0.036 + i * 0.042;
      pegs.setMatrixAt(i, m.makeTranslation(x, -0.038, 0.036));
      keys.setMatrixAt(i, m.makeTranslation(x, -0.052, 0.036));
    }
    pegs.instanceMatrix.needsUpdate = true;
    keys.instanceMatrix.needsUpdate = true;
  }

  const nutGeo = kit.geo(new BoxGeometry(0.007, 0.011, 0.038));
  addTo(inst, new Mesh(nutGeo, kit.mat(new MeshStandardMaterial({
    color: '#e9e2d0', roughness: 0.4,
  })))).position.set(SCALE + 0.003, 0.002, 0);

  // --- Split pickup, knobs, bridge ----------------------------------------
  const pickupGeo = kit.geo(new BoxGeometry(0.030, 0.016, 0.060));
  const pickups = addTo(inst, new InstancedMesh(pickupGeo, darkMat, 2));
  {
    const m = new Matrix4();
    pickups.setMatrixAt(0, m.makeTranslation(0.185, -0.005, 0.034));
    pickups.setMatrixAt(1, m.makeTranslation(0.150, -0.005, -0.034));
    pickups.instanceMatrix.needsUpdate = true;
  }

  const knobGeo = kit.geo(new CylinderGeometry(0.013, 0.014, 0.019, 8));
  const knobs = addTo(inst, new InstancedMesh(knobGeo, kit.mat(new MeshStandardMaterial({
    color: '#dcd6c2', roughness: 0.35,
  })), 2));
  {
    const m = new Matrix4();
    knobs.setMatrixAt(0, m.makeTranslation(-0.030, -0.005, -0.115));
    knobs.setMatrixAt(1, m.makeTranslation(-0.082, -0.005, -0.100));
    knobs.instanceMatrix.needsUpdate = true;
  }

  const bridgeGroup = addTo(inst, new Group());
  bridgeGroup.position.set(0, -0.008, 0);
  addTo(bridgeGroup, new Mesh(kit.geo(new BoxGeometry(0.075, 0.012, 0.082)), chromeMat))
    .position.set(-0.018, 0, 0);
  const saddleGeo = kit.geo(new BoxGeometry(0.020, 0.012, 0.012));
  const saddles = addTo(bridgeGroup, new InstancedMesh(saddleGeo, chromeMat, STRINGS));
  {
    const m = new Matrix4();
    for (let i = 0; i < STRINGS; i++) {
      saddles.setMatrixAt(i, m.makeTranslation(0.002, 0.008, stringZ(i, 0)));
    }
    saddles.instanceMatrix.needsUpdate = true;
  }

  // --- Strings -------------------------------------------------------------
  const stringGeo = kit.geo(new CylinderGeometry(0.0018, 0.0018, SCALE + 0.12, 5, 1, true));
  stringGeo.rotateZ(-Math.PI / 2);
  stringGeo.translate((SCALE + 0.12) / 2 - 0.04, 0, 0);
  const strings: Mesh[] = [];
  const gauge: number[] = [];
  for (let i = 0; i < STRINGS; i++) {
    const m = addTo(inst, new Mesh(stringGeo, stringMat));
    const g = 2.5 - i * 0.35;
    gauge.push(g);
    m.position.set(0, STRING_HEIGHT, stringZ(i, 0));
    m.rotation.y = -Math.asin((stringZ(i, SCALE) - stringZ(i, 0)) / SCALE);
    m.scale.set(1, g, g);
    strings.push(m);
  }

  // --- Reaction state ------------------------------------------------------
  const amp = new Float32Array(STRINGS);
  const phase = new Float32Array(STRINGS);
  const rate = [9, 11, 13, 15];
  for (let i = 0; i < STRINGS; i++) phase[i] = rng.float(0, Math.PI * 2);
  let neckAmp = 0;
  let neckPhase = 0;
  let last = 0;
  let started = false;

  const station: PlayerStation = {
    offset: new Vector3(-0.36, 0, -0.22),
    facing: 0,
    posture: 'stand',
  };

  const model: ElectricBassModel = {
    archetype: 'electric-bass',
    root,
    station,

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        return contactAt(IDLE_X, FINGER_HEIGHT + 0.04, stringZ(1, IDLE_X), DOWN_NECK);
      }
      if (point.kind !== 'string') return undefined;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return undefined;
      if (!Number.isFinite(point.fret)) return undefined;
      const n = Math.round(point.fret);
      if (n < 0 || n > FRETS) return undefined;
      const x = fretX(n);
      return contactAt(x, FINGER_HEIGHT, stringZ(i, x), DOWN_NECK);
    },

    soundingContact(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        return contactAt(PLUCK_X + 0.05, STRING_HEIGHT + 0.06, 0.02, UP_NECK);
      }
      if (point.kind !== 'string') return undefined;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return undefined;
      return contactAt(PLUCK_X, STRING_HEIGHT + 0.018, stringZ(i, PLUCK_X), UP_NECK);
    },

    react(point: PlayPoint, force: number, now: number): void {
      if (point.kind !== 'string') return;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return;
      const f = Math.min(Math.max(force, 0), 1);
      amp[i] = Math.min(1.6, (amp[i] ?? 0) + 0.65 + f * 0.6);
      // A long thin neck whips. It is a real thing basses do and it is free.
      neckAmp = Math.min(1, neckAmp + 0.25 + f * 0.5);
      neckPhase = 0;
      if (!started) { last = now; started = true; }
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
            strings[i]!.position.y = STRING_HEIGHT;
          }
          continue;
        }
        a *= Math.exp(-dt / (1.3 + (STRINGS - i) * 0.18));
        amp[i] = a;
        phase[i] = (phase[i] ?? 0) + dt * rate[i]!;
        strings[i]!.scale.set(1, gauge[i]! * (1 + a * 7), gauge[i]! * (1 + a * 1.8));
        strings[i]!.position.y = STRING_HEIGHT + Math.sin(phase[i]!) * a * 0.003;
      }

      if (neckAmp > 0.002) {
        neckAmp *= Math.exp(-dt / 0.8);
        neckPhase += dt * 6;
        const w = Math.sin(neckPhase) * neckAmp;
        neck.rotation.z = w * 0.004;
        head.rotation.z = -0.13 + w * 0.012;
        recoil.rotation.x = w * 0.008;
      } else if (neckAmp !== 0) {
        neckAmp = 0;
        neck.rotation.z = 0;
        head.rotation.z = -0.13;
        recoil.rotation.x = 0;
      }
    },

    dispose(): void {
      frets.dispose();
      pegs.dispose();
      keys.dispose();
      pickups.dispose();
      knobs.dispose();
      saddles.dispose();
      root.removeFromParent();
      root.clear();
      kit.release();
    },
  };

  return model;
};
