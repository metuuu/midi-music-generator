/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Electric guitar — same six strings, twenty-two frets, a plank instead of a box.
 *
 * Geometrically the acoustic's twin: the same scale length, the same
 * `SCALE * 2^(-n/12)` rule for where a finger goes, three more frets and a
 * cutaway that lets a hand reach them. What differs is what *moves*. An
 * acoustic answers a pluck with its whole top; an electric answers with the
 * strings and the tremolo, because there is nothing else on it that can flex.
 * A trem arm dipping half a degree on a hard chord is the cheapest possible
 * tell that this instrument is plugged into something.
 *
 * Build frame: `+x` bridge → nut, `+y` out of the face, `+z` low string → high.
 */

import {
  BoxGeometry, type BufferGeometry, CatmullRomCurve3, CylinderGeometry,
  ExtrudeGeometry, Group, InstancedMesh, type Material, Matrix4, Mesh,
  MeshStandardMaterial, Shape, TubeGeometry, Vector3,
} from 'three';

import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import {
  addTo, type Contact, type InstrumentBuilder, type InstrumentModel,
  type PlayerStation,
} from './types.js';

const SCALE = 0.648;
/** Matches `ARCHETYPES['electric-guitar'].frets`. */
const FRETS = 22;
const STRINGS = 6;
const NUT_SPREAD = 0.041;
const BRIDGE_SPREAD = 0.052;
const STRING_HEIGHT = 0.004;
const FINGER_HEIGHT = 0.011;
/** Over the bridge pickup, which is where a plectrum actually is. */
const PLUCK_X = 0.075;
const IDLE_X = SCALE * Math.pow(2, -5 / 12);

const NECK_TILT = 0.21;
const FACE = new Vector3(0, 1, 0);

function mountBasis(alongStrings: Vector3, faceHint: Vector3, at: Vector3): Matrix4 {
  const x = alongStrings.clone().normalize();
  const y = faceHint.clone().addScaledVector(x, -faceHint.dot(x)).normalize();
  const z = new Vector3().crossVectors(x, y);
  return new Matrix4().makeBasis(x, y, z).setPosition(at);
}

const MOUNT = mountBasis(
  new Vector3(Math.cos(NECK_TILT), Math.sin(NECK_TILT), 0),
  new Vector3(0, 0.28, 0.96),
  new Vector3(-0.092, 0.985, 0.085),
);

function fretX(n: number): number {
  return SCALE * Math.pow(2, -n / 12);
}

function stringZ(i: number, x: number): number {
  const t = Math.min(Math.max(x / SCALE, 0), 1);
  const spread = BRIDGE_SPREAD + (NUT_SPREAD - BRIDGE_SPREAD) * t;
  return (i - (STRINGS - 1) / 2) * (spread / (STRINGS - 1));
}

function contactAt(x: number, y: number, z: number): Contact {
  return {
    position: new Vector3(x, y, z).applyMatrix4(MOUNT),
    normal: FACE.clone().transformDirection(MOUNT),
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

/**
 * An offset double cutaway: one long horn, one short, and a notch on each side
 * of the neck deep enough that reaching fret 22 does not look like a mime.
 */
function bodyOutline(bout: number, horn: number): Shape {
  const s = new Shape();
  const tail = -0.205;
  const pocket = 0.300;
  s.moveTo(tail, 0);
  // Bass side: the long horn.
  s.bezierCurveTo(tail - 0.005, bout * 0.72, tail + 0.05, bout, tail + 0.15, bout);
  s.bezierCurveTo(tail + 0.25, bout, 0.085, 0.128, 0.135, 0.108);
  s.bezierCurveTo(0.205, 0.082, 0.275, 0.108, 0.325, horn);
  s.bezierCurveTo(0.372, horn + 0.028, 0.392, horn - 0.012, 0.368, 0.086);
  s.bezierCurveTo(0.345, 0.062, 0.318, 0.060, pocket, 0.034);
  s.lineTo(pocket, -0.034);
  // Treble side: the short one, so a hand can get past it.
  s.bezierCurveTo(0.318, -0.060, 0.336, -0.062, 0.336, -0.086);
  s.bezierCurveTo(0.336, -0.118, 0.300, -0.130, 0.262, -0.126);
  s.bezierCurveTo(0.205, -0.120, 0.170, -0.135, 0.130, -0.150);
  s.bezierCurveTo(0.060, -0.178, tail + 0.24, -bout * 0.98, tail + 0.14, -bout * 0.98);
  s.bezierCurveTo(tail + 0.05, -bout * 0.98, tail - 0.005, -bout * 0.7, tail, 0);
  return s;
}

/** Not part of `InstrumentModel`. See the note on `soundingContact`. */
export interface ElectricGuitarModel extends InstrumentModel {
  /** Where the picking hand goes. `resolve` answers for the stopping hand. */
  soundingContact(point: PlayPoint): Contact | undefined;
}

export const buildElectricGuitar: InstrumentBuilder = (opts) => {
  const rng = new Rng(`electric-guitar:${opts.seed}`);
  const kit = new Kit();

  const root = new Group();
  root.name = 'electric-guitar';
  const recoil = addTo(root, new Group());
  const inst = addTo(recoil, new Group());
  inst.applyMatrix4(MOUNT);

  const bodyColour = opts.finish ?? rng.pick([
    '#b7302c', '#2e5f8f', '#e8d7a6', '#2b2b2f', '#2f7a4f', '#d9b23a',
  ]);
  const bodyMat = kit.mat(new MeshStandardMaterial({
    color: bodyColour, roughness: 0.28, metalness: 0.12,
  }));
  const darkMat = kit.mat(new MeshStandardMaterial({ color: '#1d1a19', roughness: 0.5 }));
  const neckMat = kit.mat(new MeshStandardMaterial({
    color: rng.pick(['#c79a5e', '#a87b45', '#d8b478']), roughness: 0.55,
  }));
  const chromeMat = kit.mat(new MeshStandardMaterial({
    color: '#d6d9dd', roughness: 0.22, metalness: 0.92, flatShading: true,
  }));
  const stringMat = kit.mat(new MeshStandardMaterial({
    color: '#cfd4d8', roughness: 0.3, metalness: 0.7,
  }));

  // --- Body ----------------------------------------------------------------
  const bodyGeo = kit.geo(new ExtrudeGeometry(
    bodyOutline(0.186 * rng.float(0.96, 1.05), 0.128 * rng.float(0.94, 1.08)),
    {
      depth: 0.040, bevelEnabled: true, bevelThickness: 0.011,
      bevelSize: 0.010, bevelSegments: 2, curveSegments: 6,
    },
  ));
  bodyGeo.rotateX(-Math.PI / 2);
  bodyGeo.translate(0, -0.062, 0);
  const body = addTo(inst, new Mesh(bodyGeo, bodyMat));
  body.castShadow = true;
  body.receiveShadow = true;

  /** Scratchplate: the same outline, thin, inset, in a contrasting colour. */
  const plate = addTo(inst, new Mesh(bodyGeo, kit.mat(new MeshStandardMaterial({
    color: rng.pick(['#f2ead6', '#2a2a2e', '#e0e3e6']),
    roughness: 0.35, metalness: 0.1,
  }))));
  plate.scale.set(0.9, 0.06, 0.9);
  plate.position.set(0.012, -0.0092, -0.010);

  // --- Neck, fretboard, frets ---------------------------------------------
  const neckGeo = kit.geo(new BoxGeometry(SCALE - 0.255, 0.021, 0.055));
  const neck = addTo(inst, new Mesh(neckGeo, neckMat));
  neck.position.set((SCALE + 0.255) / 2, -0.0185, 0);
  neck.castShadow = true;

  const boardGeo = kit.geo(new BoxGeometry(SCALE - 0.045, 0.007, 0.059));
  addTo(inst, new Mesh(boardGeo, darkMat)).position.set((SCALE + 0.045) / 2, -0.0045, 0);

  const fretGeo = kit.geo(new BoxGeometry(0.0024, 0.0032, 0.059));
  const frets = addTo(inst, new InstancedMesh(fretGeo, chromeMat, FRETS));
  {
    const m = new Matrix4();
    for (let n = 1; n <= FRETS; n++) {
      frets.setMatrixAt(n - 1, m.makeTranslation(fretX(n), 0.0003, 0));
    }
    frets.instanceMatrix.needsUpdate = true;
  }

  // --- Headstock -----------------------------------------------------------
  const headGeo = kit.geo(new BoxGeometry(0.150, 0.014, 0.068));
  const head = addTo(inst, new Mesh(headGeo, neckMat));
  head.position.set(SCALE + 0.070, -0.019, 0.006);
  head.rotation.z = -0.16;
  head.castShadow = true;

  const pegGeo = kit.geo(new CylinderGeometry(0.0055, 0.0085, 0.026, 6));
  const pegs = addTo(inst, new InstancedMesh(pegGeo, chromeMat, STRINGS));
  {
    const m = new Matrix4();
    for (let i = 0; i < STRINGS; i++) {
      pegs.setMatrixAt(i, m.makeTranslation(SCALE + 0.028 + i * 0.023, -0.034, 0.030));
    }
    pegs.instanceMatrix.needsUpdate = true;
  }

  const nutGeo = kit.geo(new BoxGeometry(0.006, 0.009, 0.044));
  addTo(inst, new Mesh(nutGeo, kit.mat(new MeshStandardMaterial({
    color: '#e9e2d0', roughness: 0.4,
  })))).position.set(SCALE + 0.002, 0.0015, 0);

  // --- Pickups and controls ------------------------------------------------
  const pickupGeo = kit.geo(new BoxGeometry(0.024, 0.014, 0.076));
  const pickups = addTo(inst, new InstancedMesh(pickupGeo, darkMat, 2));
  {
    const m = new Matrix4();
    pickups.setMatrixAt(0, m.makeTranslation(0.058, -0.0045, 0));
    pickups.setMatrixAt(1, m.makeTranslation(0.190, -0.0045, 0));
    pickups.instanceMatrix.needsUpdate = true;
  }
  const poleGeo = kit.geo(new CylinderGeometry(0.0025, 0.0025, 0.017, 5));
  const poles = addTo(inst, new InstancedMesh(poleGeo, chromeMat, STRINGS * 2));
  {
    const m = new Matrix4();
    for (let p = 0; p < 2; p++) {
      const x = p === 0 ? 0.058 : 0.190;
      for (let i = 0; i < STRINGS; i++) {
        poles.setMatrixAt(p * STRINGS + i, m.makeTranslation(x, -0.0035, stringZ(i, x)));
      }
    }
    poles.instanceMatrix.needsUpdate = true;
  }

  const knobGeo = kit.geo(new CylinderGeometry(0.011, 0.012, 0.017, 8));
  const knobs = addTo(inst, new InstancedMesh(knobGeo, kit.mat(new MeshStandardMaterial({
    color: '#e6e0cd', roughness: 0.35,
  })), 3));
  {
    const m = new Matrix4();
    for (let i = 0; i < 3; i++) {
      knobs.setMatrixAt(i, m.makeTranslation(-0.055 - i * 0.045, -0.004, -0.085 + i * 0.012));
    }
    knobs.instanceMatrix.needsUpdate = true;
  }

  // --- Bridge, saddles and the arm that dips ------------------------------
  const bridgeGroup = addTo(inst, new Group());
  bridgeGroup.position.set(0, 0, 0);
  const plateGeo = kit.geo(new BoxGeometry(0.052, 0.010, 0.086));
  addTo(bridgeGroup, new Mesh(plateGeo, chromeMat)).position.set(-0.004, -0.006, 0);
  const saddleGeo = kit.geo(new CylinderGeometry(0.0045, 0.0045, 0.010, 6));
  saddleGeo.rotateX(Math.PI / 2);
  const saddles = addTo(bridgeGroup, new InstancedMesh(saddleGeo, chromeMat, STRINGS));
  {
    const m = new Matrix4();
    for (let i = 0; i < STRINGS; i++) {
      saddles.setMatrixAt(i, m.makeTranslation(0, 0.0005, stringZ(i, 0)));
    }
    saddles.instanceMatrix.needsUpdate = true;
  }
  const armGeo = kit.geo(new CylinderGeometry(0.0032, 0.0032, 0.145, 5));
  armGeo.translate(0, -0.0725, 0);
  armGeo.rotateZ(-Math.PI / 2.6);
  const arm = addTo(bridgeGroup, new Mesh(armGeo, chromeMat));
  arm.position.set(-0.018, 0.002, -0.040);

  // --- Strings -------------------------------------------------------------
  const stringGeo = kit.geo(new CylinderGeometry(0.001, 0.001, SCALE + 0.09, 5, 1, true));
  stringGeo.rotateZ(-Math.PI / 2);
  stringGeo.translate((SCALE + 0.09) / 2, 0, 0);
  const strings: Mesh[] = [];
  const gauge: number[] = [];
  for (let i = 0; i < STRINGS; i++) {
    const m = addTo(inst, new Mesh(stringGeo, stringMat));
    const g = 2.2 - i * 0.25;
    gauge.push(g);
    m.position.set(0, STRING_HEIGHT, stringZ(i, 0));
    m.rotation.y = -Math.asin((stringZ(i, SCALE) - stringZ(i, 0)) / SCALE);
    m.scale.set(1, g, g);
    strings.push(m);
  }

  // --- The lead, which hangs in world space rather than in the build frame -
  {
    const jack = new Vector3(-0.145, -0.03, -0.10).applyMatrix4(MOUNT);
    const curve = new CatmullRomCurve3([
      jack,
      jack.clone().add(new Vector3(-0.12, -0.22, 0.05)),
      jack.clone().add(new Vector3(-0.16, -0.58, -0.08)),
      new Vector3(jack.x - 0.16, 0.022, jack.z - 0.22),
      new Vector3(jack.x - 0.18, 0.022, jack.z - 0.40),
    ]);
    const cable = addTo(root, new Mesh(
      kit.geo(new TubeGeometry(curve, 14, 0.006, 4, false)),
      kit.mat(new MeshStandardMaterial({ color: '#15151a', roughness: 0.8 })),
    ));
    cable.castShadow = true;
  }

  // --- Reaction state ------------------------------------------------------
  const amp = new Float32Array(STRINGS);
  const phase = new Float32Array(STRINGS);
  const rate = [19, 22, 25, 28, 32, 36];
  for (let i = 0; i < STRINGS; i++) phase[i] = rng.float(0, Math.PI * 2);
  let armAmp = 0;
  let armPhase = 0;
  let last = 0;
  let started = false;

  const station: PlayerStation = {
    offset: new Vector3(-0.07, 0, -0.22),
    facing: 0,
    posture: 'stand',
  };

  const model: ElectricGuitarModel = {
    archetype: 'electric-guitar',
    root,
    station,

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        return contactAt(IDLE_X, FINGER_HEIGHT + 0.03, stringZ(2, IDLE_X));
      }
      if (point.kind !== 'string') return undefined;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return undefined;
      if (!Number.isFinite(point.fret)) return undefined;
      const n = Math.round(point.fret);
      if (n < 0 || n > FRETS) return undefined;
      const x = fretX(n);
      return contactAt(x, FINGER_HEIGHT, stringZ(i, x));
    },

    soundingContact(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        return contactAt(PLUCK_X + 0.05, STRING_HEIGHT + 0.045, -0.02);
      }
      if (point.kind !== 'string') return undefined;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return undefined;
      return contactAt(PLUCK_X, STRING_HEIGHT + 0.014, stringZ(i, PLUCK_X));
    },

    react(point: PlayPoint, force: number, now: number): void {
      if (point.kind !== 'string') return;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return;
      const f = Math.min(Math.max(force, 0), 1);
      amp[i] = Math.min(1.5, (amp[i] ?? 0) + 0.6 + f * 0.6);
      // Only a hard one moves the trem. A dip on every note reads as a wobble
      // board rather than as somebody leaning on the arm.
      if (f > 0.55) { armAmp = Math.min(1, armAmp + (f - 0.55) * 1.6); armPhase = 0; }
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
        // Solid bodies sustain: an electric string rings a lot longer than an
        // acoustic one, and that difference is worth being visible.
        a *= Math.exp(-dt / (1.5 + (STRINGS - i) * 0.12));
        amp[i] = a;
        phase[i] = (phase[i] ?? 0) + dt * rate[i]!;
        const blur = 1 + a * 6;
        strings[i]!.scale.set(1, gauge[i]! * blur, gauge[i]! * (1 + a * 1.6));
        strings[i]!.position.y = STRING_HEIGHT + Math.sin(phase[i]!) * a * 0.0014;
      }

      if (armAmp > 0.002) {
        armAmp *= Math.exp(-dt / 0.7);
        armPhase += dt * 7;
        const w = Math.sin(armPhase) * armAmp;
        arm.rotation.x = w * 0.5;
        bridgeGroup.position.y = w * -0.0016;
        recoil.rotation.x = w * 0.010;
      } else if (armAmp !== 0) {
        armAmp = 0;
        arm.rotation.x = 0;
        bridgeGroup.position.y = 0;
        recoil.rotation.x = 0;
      }
    },

    dispose(): void {
      frets.dispose();
      pegs.dispose();
      poles.dispose();
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
