/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Cello — four strings, no frets, an endpin in the boards and a player sitting
 * around it.
 *
 * The violin's rules at twice the size, and the size is the point: a 0.69 m
 * string means a semitone near the nut is 39 mm of fingerboard, so the left
 * hand visibly *shifts* rather than stretching. `MENSUR * 2^(-n/12)` gives
 * that for free — the same continuous equal-tempered position rule as the
 * violin and the upright bass, with no wire to snap to.
 *
 * Build frame: `+x` bridge → nut, `+y` out of the belly, `+z` C string → A.
 * The root's origin is the endpin, on the boards, which is also what the whole
 * instrument rocks about.
 */

import {
  BoxGeometry, type BufferGeometry, CapsuleGeometry, CylinderGeometry,
  ExtrudeGeometry, Group, InstancedMesh, type Material, Matrix4, Mesh,
  MeshStandardMaterial, Shape, Vector3,
} from 'three';

import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import {
  addTo, type Contact, type InstrumentBuilder, type InstrumentModel,
  type PlayerStation,
} from './types.js';

/** Sounding length, bridge to nut. A 4/4 cello. */
const MENSUR = 0.690;
const STRINGS = 4;
/**
 * Two octaves plus thumb position, which is what the fingerboard covers and
 * more than `ARCHETYPES.cello.range` asks of the A string (57 → 81).
 */
const MAX_SEMITONES = 26;
const NUT_SPREAD = 0.024;
const BRIDGE_SPREAD = 0.048;
const ARC_R = 0.052;
const STRING_HEIGHT = 0.008;
const FINGER_HEIGHT = 0.017;
const BOW_X = 0.085;

const BODY_TAIL = -0.400;
const BODY_LEN = 0.755;

function mountBasis(alongStrings: Vector3, faceHint: Vector3, at: Vector3): Matrix4 {
  const x = alongStrings.clone().normalize();
  const y = faceHint.clone().addScaledVector(x, -faceHint.dot(x)).normalize();
  const z = new Vector3().crossVectors(x, y);
  return new Matrix4().makeBasis(x, y, z).setPosition(at);
}

/** Leaning back into the player's chest, scroll past their left ear. */
const MOUNT = mountBasis(
  new Vector3(0.220, 0.931, -0.290),
  new Vector3(0, 0.25, 0.96),
  new Vector3(-0.060, 0.620, 0.100),
);

function stopX(n: number): number {
  return MENSUR * Math.pow(2, -n / 12);
}

function stringZ(i: number, x: number): number {
  const t = Math.min(Math.max(x / MENSUR, 0), 1);
  const spread = BRIDGE_SPREAD + (NUT_SPREAD - BRIDGE_SPREAD) * t;
  return (i - (STRINGS - 1) / 2) * (spread / (STRINGS - 1));
}

function arcDrop(z: number): number {
  return Math.sqrt(Math.max(ARC_R * ARC_R - z * z, 0)) - ARC_R;
}

function arcNormal(z: number): Vector3 {
  return new Vector3(0, Math.sqrt(Math.max(ARC_R * ARC_R - z * z, 0)) / ARC_R, z / ARC_R);
}

function contactAt(x: number, lift: number, z: number): Contact {
  return {
    position: new Vector3(x, lift + arcDrop(z), z).applyMatrix4(MOUNT),
    normal: arcNormal(z).transformDirection(MOUNT),
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
export interface CelloModel extends InstrumentModel {
  /** Where the bow crosses this string. `resolve` answers for the left hand. */
  soundingContact(point: PlayPoint): Contact | undefined;
  /** The model's own bow, animated by `react`. Hide it if the rig has one. */
  bow: Group;
}

export const buildCello: InstrumentBuilder = (opts) => {
  const rng = new Rng(`cello:${opts.seed}`);
  const kit = new Kit();

  const root = new Group();
  root.name = 'cello';
  /** Rocks about the endpin, which is this group's origin. */
  const rock = addTo(root, new Group());
  const inst = addTo(rock, new Group());
  inst.applyMatrix4(MOUNT);

  const wood = opts.finish ?? rng.pick(['#a75e28', '#94501f', '#bd7434', '#8a4720']);
  const bodyMat = kit.mat(new MeshStandardMaterial({
    color: wood, roughness: 0.4, metalness: 0.04,
  }));
  const bellyMat = kit.mat(new MeshStandardMaterial({
    color: rng.pick(['#dda758', '#cd9547', '#e8b869']), roughness: 0.45,
  }));
  const ebonyMat = kit.mat(new MeshStandardMaterial({ color: '#171310', roughness: 0.42 }));
  const stringMat = kit.mat(new MeshStandardMaterial({
    color: '#ddd5bb', roughness: 0.4, metalness: 0.45,
  }));
  const metalMat = kit.mat(new MeshStandardMaterial({
    color: '#c2c6cb', roughness: 0.3, metalness: 0.85, flatShading: true,
  }));

  // --- Body ----------------------------------------------------------------
  const bodyGeo = kit.geo(new ExtrudeGeometry(
    violinOutline(
      BODY_TAIL, BODY_LEN,
      0.222 * rng.float(0.97, 1.03),
      0.121 * rng.float(0.96, 1.04),
      0.172 * rng.float(0.97, 1.03),
      0.030,
    ),
    {
      depth: 0.105, bevelEnabled: true, bevelThickness: 0.026,
      bevelSize: 0.022, bevelSegments: 3, curveSegments: 6,
    },
  ));
  bodyGeo.rotateX(-Math.PI / 2);
  // A cello bridge is 90 mm tall; the belly hangs that far below the strings.
  bodyGeo.translate(0, -0.213, 0);
  const body = addTo(inst, new Mesh(bodyGeo, bodyMat));
  body.castShadow = true;
  body.receiveShadow = true;

  const belly = addTo(inst, new Mesh(bodyGeo, bellyMat));
  belly.scale.set(0.97, 0.085, 0.97);
  belly.position.set(0, -0.073, 0);
  belly.receiveShadow = true;

  const fGeo = kit.geo(new CapsuleGeometry(0.0085, 0.105, 2, 6));
  fGeo.rotateZ(Math.PI / 2);
  for (const side of [1, -1]) {
    const f = addTo(inst, new Mesh(fGeo, ebonyMat));
    f.position.set(0.004, -0.077, side * 0.100);
    f.rotation.y = side * 0.21;
  }

  // --- Neck, fingerboard, scroll ------------------------------------------
  const neckGeo = kit.geo(new BoxGeometry(MENSUR - 0.395, 0.042, 0.044));
  const neck = addTo(inst, new Mesh(neckGeo, bodyMat));
  neck.position.set((MENSUR + 0.395) / 2, -0.038, 0);
  neck.castShadow = true;

  const boardLen = MENSUR - stopX(MAX_SEMITONES) + 0.025;
  const boardGeo = kit.geo(new BoxGeometry(boardLen, 0.018, 0.058));
  const board = addTo(inst, new Mesh(boardGeo, ebonyMat));
  board.position.set(MENSUR + 0.010 - boardLen / 2, -0.010, 0);
  board.castShadow = true;

  addTo(inst, new Mesh(kit.geo(new BoxGeometry(0.125, 0.050, 0.038)), bodyMat))
    .position.set(MENSUR + 0.068, -0.024, 0);
  const scrollGeo = kit.geo(new CylinderGeometry(0.032, 0.020, 0.034, 7));
  scrollGeo.rotateX(Math.PI / 2);
  const scroll = addTo(inst, new Mesh(scrollGeo, bodyMat));
  scroll.position.set(MENSUR + 0.148, -0.010, 0);
  scroll.rotation.z = 0.55;

  const pegGeo = kit.geo(new CylinderGeometry(0.008, 0.008, 0.082, 6));
  pegGeo.rotateX(Math.PI / 2);
  const pegs = addTo(inst, new InstancedMesh(pegGeo, ebonyMat, STRINGS));
  {
    const m = new Matrix4();
    for (let i = 0; i < STRINGS; i++) {
      const side = i % 2 === 0 ? 0.014 : -0.014;
      pegs.setMatrixAt(i, m.makeTranslation(
        MENSUR + 0.036 + Math.floor(i / 2) * 0.056, -0.024, side,
      ));
    }
    pegs.instanceMatrix.needsUpdate = true;
  }

  addTo(inst, new Mesh(kit.geo(new BoxGeometry(0.010, 0.013, 0.034)), ebonyMat))
    .position.set(MENSUR + 0.004, 0.003, 0);

  // --- Bridge, tailpiece ---------------------------------------------------
  const bridgeGroup = addTo(inst, new Group());
  bridgeGroup.position.set(0, -0.082, 0);
  const bridgeShape = new Shape();
  bridgeShape.moveTo(-0.044, 0);
  bridgeShape.lineTo(-0.026, 0);
  bridgeShape.lineTo(-0.020, 0.030);
  bridgeShape.bezierCurveTo(-0.008, 0.052, 0.008, 0.052, 0.020, 0.030);
  bridgeShape.lineTo(0.026, 0);
  bridgeShape.lineTo(0.044, 0);
  bridgeShape.lineTo(0.038, 0.062);
  bridgeShape.bezierCurveTo(0.024, 0.090, -0.024, 0.090, -0.038, 0.062);
  const bridgeGeo = kit.geo(new ExtrudeGeometry(bridgeShape, {
    depth: 0.011, bevelEnabled: false, curveSegments: 4,
  }));
  bridgeGeo.rotateY(Math.PI / 2);
  bridgeGeo.translate(0, 0, -0.0055);
  addTo(bridgeGroup, new Mesh(bridgeGeo, kit.mat(new MeshStandardMaterial({
    color: '#e0c68f', roughness: 0.5,
  })))).castShadow = true;

  const tailGeo = kit.geo(new BoxGeometry(0.215, 0.016, 0.070));
  const tail = addTo(inst, new Mesh(tailGeo, ebonyMat));
  tail.position.set(-0.160, -0.058, 0);
  tail.rotation.z = 0.14;

  // --- Strings -------------------------------------------------------------
  const stringGeo = kit.geo(new CylinderGeometry(0.0013, 0.0013, MENSUR + 0.04, 4, 1, true));
  stringGeo.rotateZ(-Math.PI / 2);
  stringGeo.translate((MENSUR + 0.04) / 2 - 0.022, 0, 0);
  const strings: Mesh[] = [];
  const gauge: number[] = [];
  for (let i = 0; i < STRINGS; i++) {
    const m = addTo(inst, new Mesh(stringGeo, stringMat));
    const g = 2.1 - i * 0.32;
    gauge.push(g);
    const z0 = stringZ(i, 0);
    m.position.set(0, STRING_HEIGHT + arcDrop(z0), z0);
    m.rotation.y = -Math.asin((stringZ(i, MENSUR) - z0) / MENSUR);
    m.scale.set(1, g, g);
    strings.push(m);
  }

  // --- Endpin: vertical in the world, not in the build frame --------------
  {
    const foot = new Vector3(BODY_TAIL - 0.020, -0.160, 0).applyMatrix4(MOUNT);
    const len = Math.max(foot.y, 0.05);
    const pinGeo = kit.geo(new CylinderGeometry(0.007, 0.005, len, 6));
    const pin = addTo(root, new Mesh(pinGeo, metalMat));
    pin.position.set(foot.x, len / 2, foot.z);
    pin.castShadow = true;
  }

  // --- The bow -------------------------------------------------------------
  const bowPivot = addTo(inst, new Group());
  const bow = addTo(bowPivot, new Group());
  {
    const stickGeo = kit.geo(new CylinderGeometry(0.0042, 0.0034, 0.700, 5));
    stickGeo.rotateX(Math.PI / 2);
    const stick = addTo(bow, new Mesh(stickGeo, kit.mat(new MeshStandardMaterial({
      color: '#3a2216', roughness: 0.4,
    }))));
    stick.position.set(0, -0.012, 0.02);
    stick.castShadow = true;
    const hairGeo = kit.geo(new BoxGeometry(0.0034, 0.0110, 0.680));
    addTo(bow, new Mesh(hairGeo, kit.mat(new MeshStandardMaterial({
      color: '#f2ecd8', roughness: 0.8,
    })))).position.set(0, -0.0020, 0.02);
    const frogGeo = kit.geo(new BoxGeometry(0.019, 0.024, 0.042));
    addTo(bow, new Mesh(frogGeo, ebonyMat)).position.set(0, -0.010, 0.344);
    const tipGeo = kit.geo(new BoxGeometry(0.012, 0.017, 0.024));
    addTo(bow, new Mesh(tipGeo, ebonyMat)).position.set(0, -0.007, -0.338);
  }

  // --- Reaction state ------------------------------------------------------
  const amp = new Float32Array(STRINGS);
  const phase = new Float32Array(STRINGS);
  const rate = [11, 13, 16, 19];
  for (let i = 0; i < STRINGS; i++) phase[i] = rng.float(0, Math.PI * 2);
  let bellyAmp = 0;
  let rockAmp = 0;
  let rockPhase = 0;
  let bowDir = 1;
  let bowSpeed = 0;
  let bowSlide = rng.float(-0.08, 0.08);
  let bowString = 1;
  let bowStringNow = 1;
  let last = 0;
  let started = false;

  function placeBow(): void {
    const z = stringZ(bowStringNow, BOW_X);
    bowPivot.position.set(BOW_X, STRING_HEIGHT + arcDrop(z) + 0.006, z);
    bowPivot.rotation.x = Math.asin(Math.min(Math.max(z / ARC_R, -1), 1));
    bow.position.z = bowSlide;
  }
  placeBow();

  const station: PlayerStation = {
    offset: new Vector3(0.0, 0, -0.30),
    facing: 0,
    posture: 'sit',
  };

  const model: CelloModel = {
    archetype: 'cello',
    root,
    station,
    bow,

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        const x = stopX(2);
        return contactAt(x, FINGER_HEIGHT + 0.035, stringZ(1, x));
      }
      if (point.kind !== 'string') return undefined;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return undefined;
      const n = point.fret;
      if (!Number.isFinite(n) || n < 0 || n > MAX_SEMITONES) return undefined;
      const x = stopX(n);
      return contactAt(x, FINGER_HEIGHT, stringZ(i, x));
    },

    soundingContact(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        return contactAt(BOW_X, STRING_HEIGHT + 0.08, 0);
      }
      if (point.kind !== 'string') return undefined;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return undefined;
      return contactAt(BOW_X, STRING_HEIGHT + 0.005, stringZ(i, BOW_X));
    },

    react(point: PlayPoint, force: number, now: number): void {
      if (point.kind !== 'string') return;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return;
      const f = Math.min(Math.max(force, 0), 1);
      amp[i] = Math.min(1.2, (amp[i] ?? 0) + 0.4 + f * 0.5);
      bellyAmp = Math.min(1, bellyAmp + 0.3 + f * 0.45);
      rockAmp = Math.min(1, rockAmp + 0.15 + f * 0.35);
      rockPhase = 0;
      bowString = i;
      bowDir = -bowDir;
      bowSpeed = 0.14 + f * 0.42;
      bowSlide = Math.min(Math.max(bowSlide, -0.26), 0.26);
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
          }
          continue;
        }
        a *= Math.exp(-dt / 1.8);
        amp[i] = a;
        phase[i] = (phase[i] ?? 0) + dt * rate[i]!;
        strings[i]!.scale.set(1, gauge[i]! * (1 + a * 3.6), gauge[i]! * (1 + a * 1.3));
      }

      bowSlide += bowDir * bowSpeed * dt;
      if (bowSlide > 0.28) { bowSlide = 0.28; bowDir = -1; }
      if (bowSlide < -0.28) { bowSlide = -0.28; bowDir = 1; }
      bowSpeed *= Math.exp(-dt / 2.4);
      const k = 1 - Math.exp(-dt * 12);
      bowStringNow += (bowString - bowStringNow) * k;
      placeBow();

      if (bellyAmp > 0.002) {
        bellyAmp *= Math.exp(-dt / 1.0);
        belly.scale.y = 0.085 * (1 + Math.sin(now * 10) * bellyAmp * 0.16);
        bridgeGroup.rotation.z = Math.sin(now * 10) * bellyAmp * 0.028;
      } else if (bellyAmp !== 0) {
        bellyAmp = 0;
        belly.scale.y = 0.085;
        bridgeGroup.rotation.z = 0;
      }

      if (rockAmp > 0.002) {
        rockAmp *= Math.exp(-dt / 1.1);
        rockPhase += dt * 4.5;
        rock.rotation.z = Math.sin(rockPhase) * rockAmp * 0.006;
        rock.rotation.x = Math.cos(rockPhase * 0.6) * rockAmp * 0.004;
      } else if (rockAmp !== 0) {
        rockAmp = 0;
        rock.rotation.set(0, 0, 0);
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
