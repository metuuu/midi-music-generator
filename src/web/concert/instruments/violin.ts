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
 *  - **The bow is part of the instrument.** It is model-owned and self-driven:
 *    `react` flips its direction, aims it at the string being played and gives
 *    it a speed. A violin without a moving bow is a prop.
 *
 * Build frame: `+x` bridge → nut, `+y` out of the belly, `+z` G string → E.
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

function mountBasis(alongStrings: Vector3, faceHint: Vector3, at: Vector3): Matrix4 {
  const x = alongStrings.clone().normalize();
  const y = faceHint.clone().addScaledVector(x, -faceHint.dot(x)).normalize();
  const z = new Vector3().crossVectors(x, y);
  return new Matrix4().makeBasis(x, y, z).setPosition(at);
}

/** Up on the shoulder, scroll out to the player's left and toward the house. */
const MOUNT = mountBasis(
  new Vector3(0.86, 0.10, 0.50),
  new Vector3(0.20, 0.90, 0.40),
  new Vector3(0.100, 1.420, 0.060),
);

function stopX(n: number): number {
  return MENSUR * Math.pow(2, -n / 12);
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
export interface ViolinModel extends InstrumentModel {
  /**
   * Where the bow crosses this string. `resolve` answers for the stopping
   * hand; a `bow` effector wants this instead.
   */
  soundingContact(point: PlayPoint): Contact | undefined;
  /**
   * The model's own bow, animated by `react`. Hide it if the performer rig
   * would rather carry its own.
   */
  bow: Group;
}

export const buildViolin: InstrumentBuilder = (opts) => {
  const rng = new Rng(`violin:${opts.seed}`);
  const kit = new Kit();

  const root = new Group();
  root.name = 'violin';
  const inst = addTo(root, new Group());
  inst.applyMatrix4(MOUNT);

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
    const hairGeo = kit.geo(new BoxGeometry(0.0028, 0.0090, 0.700));
    addTo(bow, new Mesh(hairGeo, hairMat)).position.set(0, -0.0015, 0.02);
    const frogGeo = kit.geo(new BoxGeometry(0.016, 0.020, 0.036));
    addTo(bow, new Mesh(frogGeo, ebonyMat)).position.set(0, -0.008, 0.352);
    const tipGeo = kit.geo(new BoxGeometry(0.010, 0.014, 0.020));
    addTo(bow, new Mesh(tipGeo, ebonyMat)).position.set(0, -0.006, -0.348);
  }

  // --- Reaction state ------------------------------------------------------
  const amp = new Float32Array(STRINGS);
  const phase = new Float32Array(STRINGS);
  const rate = [26, 30, 35, 41];
  for (let i = 0; i < STRINGS; i++) phase[i] = rng.float(0, Math.PI * 2);
  let bellyAmp = 0;
  /** Which way the bow is going, and how fast, in build-frame metres a beat. */
  let bowDir = 1;
  let bowSpeed = 0;
  let bowSlide = rng.float(-0.06, 0.06);
  let bowString = 1;
  let bowStringNow = 1;
  let last = 0;
  let started = false;

  function placeBow(): void {
    const z = stringZ(bowStringNow, BOW_X);
    bowPivot.position.set(BOW_X, STRING_HEIGHT + arcDrop(z) + 0.004, z);
    // Lie the bow along the arc's tangent, which is what makes crossing to the
    // E string look like a different movement from crossing to the G.
    bowPivot.rotation.x = Math.asin(Math.min(Math.max(z / ARC_R, -1), 1));
    bow.position.z = bowSlide;
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
        // First position, fingers hovering. Where a violinist's hand waits.
        const x = stopX(2);
        return contactAt(x, FINGER_HEIGHT + 0.022, stringZ(1, x));
      }
      if (point.kind !== 'string') return undefined;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return undefined;
      const n = point.fret;
      // Unfretted: continuous. A portamento passes through every value on the
      // way, and snapping to semitones would turn a slide into a staircase.
      if (!Number.isFinite(n) || n < 0 || n > MAX_SEMITONES) return undefined;
      const x = stopX(n);
      return contactAt(x, FINGER_HEIGHT, stringZ(i, x));
    },

    soundingContact(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        return contactAt(BOW_X, STRING_HEIGHT + 0.05, 0);
      }
      if (point.kind !== 'string') return undefined;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return undefined;
      return contactAt(BOW_X, STRING_HEIGHT + 0.003, stringZ(i, BOW_X));
    },

    react(point: PlayPoint, force: number, now: number): void {
      if (point.kind !== 'string') return;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return;
      const f = Math.min(Math.max(force, 0), 1);
      amp[i] = Math.min(1.2, (amp[i] ?? 0) + 0.35 + f * 0.45);
      bellyAmp = Math.min(1, bellyAmp + 0.25 + f * 0.4);
      // A new note is a bow change: reverse, aim at the string, and set a
      // speed. Loud notes get more bow, which is exactly what a player does.
      bowString = i;
      bowDir = -bowDir;
      bowSpeed = 0.10 + f * 0.34;
      // Start the stroke from the end the bow is now travelling away from, so
      // a long note has room to run.
      bowSlide = Math.min(Math.max(bowSlide, -0.24), 0.24);
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
        // Bowed strings are driven, not struck: the blur holds while the note
        // sounds rather than pinging and dying.
        a *= Math.exp(-dt / 1.6);
        amp[i] = a;
        phase[i] = (phase[i] ?? 0) + dt * rate[i]!;
        const blur = 1 + a * 3.2;
        strings[i]!.scale.set(1, gauge[i]! * blur, gauge[i]! * (1 + a * 1.2));
      }

      // The bow: travel, then ease across to whichever string is next.
      bowSlide += bowDir * bowSpeed * dt;
      if (bowSlide > 0.26) { bowSlide = 0.26; bowDir = -1; }
      if (bowSlide < -0.26) { bowSlide = -0.26; bowDir = 1; }
      bowSpeed *= Math.exp(-dt / 2.2);
      const k = 1 - Math.exp(-dt * 14);
      bowStringNow += (bowString - bowStringNow) * k;
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
