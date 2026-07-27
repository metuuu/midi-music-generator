/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Acoustic guitar — six strings, nineteen frets, a big hollow box.
 *
 * The whole file turns on one number: `SCALE * 2^(-n/12)` is the sounding
 * length of a string stopped at fret `n`, and therefore the distance from the
 * *bridge* to that fret. Fret 12 lands at half the scale length, the frets
 * crowd together going up the neck, and a hand placed by this rule looks like
 * it has held a guitar before. A hand placed by `n * spacing` does not, and it
 * is the single most visible thing a string model can get wrong.
 *
 * The model is built in its own frame — `+x` runs from the bridge toward the
 * nut, `+y` is out of the soundboard, `+z` crosses the strings from low to
 * high — and mounted onto the root by one frozen matrix. Geometry and contacts
 * therefore come from the same numbers by construction: there is no second
 * description of where the strings are that could drift out of agreement with
 * the first.
 */

import {
  BoxGeometry, type BufferGeometry, CircleGeometry, CylinderGeometry,
  ExtrudeGeometry, Group, InstancedMesh, type Material, Matrix4, Mesh,
  MeshStandardMaterial, RingGeometry, Shape, Vector3,
} from 'three';

import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import {
  addTo, type Contact, type InstrumentBuilder, type InstrumentModel,
  type PlayerStation,
} from './types.js';

// ---------------------------------------------------------------------------
// The numbers `resolve` depends on. None of these may vary with the seed.
// ---------------------------------------------------------------------------

/** Nut to bridge, in metres. A 25.5" guitar, which is most of them. */
const SCALE = 0.648;
/** Matches `ARCHETYPES['acoustic-guitar'].frets`. */
const FRETS = 19;
const STRINGS = 6;
/** Outer string centres at the nut and at the bridge; strings fan out. */
const NUT_SPREAD = 0.043;
const BRIDGE_SPREAD = 0.056;
/** Strings float this far over the fretboard; a fingertip sits above them. */
const STRING_HEIGHT = 0.005;
const FINGER_HEIGHT = 0.012;
/** Where the right hand lives: between the soundhole and the bridge. */
const PLUCK_X = 0.105;
/** Left hand at ease — third position, lifted clear of the strings. */
const IDLE_X = SCALE * Math.pow(2, -3 / 12);

/** Neck rises toward the player's left; the soundboard turns up and out. */
const NECK_TILT = 0.244;

const FACE = new Vector3(0, 1, 0);

/** Body outline, in the build frame's x (along) and z (across). */
const BODY_TAIL = -0.215;
const BODY_HEEL = 0.290;

/**
 * A local frame from "where the strings run" and "which way the face looks".
 *
 * The second vector is a hint and gets orthogonalised against the first, so
 * both can be written as what they mean rather than as a rotation nobody can
 * read back.
 */
function mountBasis(alongStrings: Vector3, faceHint: Vector3, at: Vector3): Matrix4 {
  const x = alongStrings.clone().normalize();
  const y = faceHint.clone().addScaledVector(x, -faceHint.dot(x)).normalize();
  const z = new Vector3().crossVectors(x, y);
  return new Matrix4().makeBasis(x, y, z).setPosition(at);
}

const MOUNT = mountBasis(
  new Vector3(Math.cos(NECK_TILT), Math.sin(NECK_TILT), 0),
  new Vector3(0, 0.33, 0.94),
  new Vector3(-0.078, 0.965, 0.055),
);

/** Distance from the bridge to fret `n`. Equal temperament, and nothing else. */
function fretX(n: number): number {
  return SCALE * Math.pow(2, -n / 12);
}

/** Where string `i` sits across the neck at distance `x` from the bridge. */
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

/** Everything the model allocated, so `dispose` can be exact about it. */
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

/** The classic figure-eight. Widths vary with the seed; lengths never do. */
function bodyOutline(lower: number, upper: number, waist: number): Shape {
  const s = new Shape();
  const tail = BODY_TAIL;
  const heel = BODY_HEEL;
  s.moveTo(tail, 0);
  s.bezierCurveTo(tail, lower * 0.72, tail + 0.06, lower, tail + 0.17, lower);
  s.bezierCurveTo(tail + 0.28, lower, 0.055, waist + 0.045, 0.105, waist);
  s.bezierCurveTo(0.15, waist - 0.04, 0.185, upper - 0.02, 0.225, upper);
  s.bezierCurveTo(0.265, upper, heel, upper * 0.7, heel, 0);
  s.bezierCurveTo(heel, -upper * 0.7, 0.265, -upper, 0.225, -upper);
  s.bezierCurveTo(0.185, -upper + 0.02, 0.15, -waist + 0.04, 0.105, -waist);
  s.bezierCurveTo(0.055, -waist - 0.045, tail + 0.28, -lower, tail + 0.17, -lower);
  s.bezierCurveTo(tail + 0.06, -lower, tail, -lower * 0.72, tail, 0);
  return s;
}

/** Not part of `InstrumentModel`. See the note on `soundingContact`. */
export interface AcousticGuitarModel extends InstrumentModel {
  /**
   * Where the *right* hand goes for this point.
   *
   * `resolve` answers for the stopping hand, because that is the contact that
   * moves with the note and the one an audience reads. A guitar takes two
   * hands in two very different places and `PlayPoint` carries no effector, so
   * the picking hand needs its own question. See the build report.
   */
  soundingContact(point: PlayPoint): Contact | undefined;
}

export const buildAcousticGuitar: InstrumentBuilder = (opts) => {
  const rng = new Rng(`acoustic-guitar:${opts.seed}`);
  const kit = new Kit();

  const root = new Group();
  root.name = 'acoustic-guitar';
  /** Small whole-instrument recoil. Rests at identity so `MOUNT` stays true. */
  const recoil = addTo(root, new Group());
  const inst = addTo(recoil, new Group());
  inst.applyMatrix4(MOUNT);

  // --- Materials. Flat colour, a rim light does the rest. -------------------
  const warm = rng.pick(['#c98a3e', '#d79a4b', '#b87434', '#e0a862']);
  const topMat = kit.mat(new MeshStandardMaterial({
    color: opts.finish ?? warm, roughness: 0.45, metalness: 0.04,
  }));
  const darkMat = kit.mat(new MeshStandardMaterial({
    color: '#2a1b13', roughness: 0.55, metalness: 0.05,
  }));
  const neckMat = kit.mat(new MeshStandardMaterial({
    color: rng.pick(['#8a5a30', '#7a4d29', '#96683a']), roughness: 0.6,
  }));
  const metalMat = kit.mat(new MeshStandardMaterial({
    color: '#cfd2d6', roughness: 0.3, metalness: 0.85, flatShading: true,
  }));
  const stringMat = kit.mat(new MeshStandardMaterial({
    color: '#d9cba6', roughness: 0.35, metalness: 0.6,
  }));
  const holeMat = kit.mat(new MeshStandardMaterial({
    color: '#100b08', roughness: 0.95,
  }));

  // --- Body ----------------------------------------------------------------
  const bodyGeo = kit.geo(new ExtrudeGeometry(
    bodyOutline(
      0.200 * rng.float(0.96, 1.05),
      0.152 * rng.float(0.95, 1.05),
      0.118 * rng.float(0.93, 1.03),
    ),
    {
      depth: 0.098, bevelEnabled: true, bevelThickness: 0.020,
      bevelSize: 0.017, bevelSegments: 2, curveSegments: 7,
    },
  ));
  // Shape (u, v) extruded along w becomes build (u, w, -v): the slab's
  // thickness runs along the soundboard normal, which is what we want.
  bodyGeo.rotateX(-Math.PI / 2);
  bodyGeo.translate(0, -0.128, 0);
  const body = addTo(inst, new Mesh(bodyGeo, topMat));
  body.castShadow = true;
  body.receiveShadow = true;

  /** The soundboard, as a thin slice of the same outline. Costs no geometry. */
  const plate = addTo(inst, new Mesh(bodyGeo, kit.mat(new MeshStandardMaterial({
    color: '#e8c88a', roughness: 0.5,
  }))));
  plate.scale.set(0.965, 0.085, 0.965);
  plate.position.set(0.002, -0.007, 0);
  plate.receiveShadow = true;

  const holeGeo = kit.geo(new CircleGeometry(0.0435, 18));
  holeGeo.rotateX(-Math.PI / 2);
  const hole = addTo(inst, new Mesh(holeGeo, holeMat));
  hole.position.set(0.195, -0.0072, 0);

  const roseGeo = kit.geo(new RingGeometry(0.0435, 0.056, 20));
  roseGeo.rotateX(-Math.PI / 2);
  const rosette = addTo(inst, new Mesh(roseGeo, darkMat));
  rosette.position.set(0.195, -0.0075, 0);

  // --- Neck, fretboard, frets ---------------------------------------------
  const neckGeo = kit.geo(new BoxGeometry(SCALE - 0.245, 0.024, 0.058));
  const neck = addTo(inst, new Mesh(neckGeo, neckMat));
  neck.position.set((SCALE + 0.245) / 2, -0.020, 0);
  neck.castShadow = true;

  const boardGeo = kit.geo(new BoxGeometry(SCALE - 0.055, 0.008, 0.062));
  const board = addTo(inst, new Mesh(boardGeo, darkMat));
  board.position.set((SCALE + 0.055) / 2, -0.005, 0);
  board.receiveShadow = true;

  const fretGeo = kit.geo(new BoxGeometry(0.0026, 0.0035, 0.062));
  const frets = addTo(inst, new InstancedMesh(fretGeo, metalMat, FRETS));
  {
    const m = new Matrix4();
    for (let n = 1; n <= FRETS; n++) {
      frets.setMatrixAt(n - 1, m.makeTranslation(fretX(n), 0.0005, 0));
    }
    frets.instanceMatrix.needsUpdate = true;
  }

  // --- Headstock and tuners ------------------------------------------------
  const headGeo = kit.geo(new BoxGeometry(0.135, 0.016, 0.072));
  const head = addTo(inst, new Mesh(headGeo, neckMat));
  head.position.set(SCALE + 0.062, -0.020, 0);
  head.rotation.z = -0.20;
  head.castShadow = true;

  const pegGeo = kit.geo(new CylinderGeometry(0.006, 0.006, 0.030, 6));
  pegGeo.rotateX(Math.PI / 2);
  const pegs = addTo(inst, new InstancedMesh(pegGeo, metalMat, STRINGS));
  {
    const m = new Matrix4();
    for (let i = 0; i < STRINGS; i++) {
      const side = i < 3 ? 0.046 : -0.046;
      const along = SCALE + 0.030 + (i % 3) * 0.036;
      pegs.setMatrixAt(i, m.makeTranslation(along, -0.026, side));
    }
    pegs.instanceMatrix.needsUpdate = true;
  }

  const nutGeo = kit.geo(new BoxGeometry(0.007, 0.010, 0.046));
  addTo(inst, new Mesh(nutGeo, kit.mat(new MeshStandardMaterial({
    color: '#efe6d2', roughness: 0.4,
  })))).position.set(SCALE + 0.002, 0.0015, 0);

  // --- Bridge, which flexes -----------------------------------------------
  const bridgeGroup = addTo(inst, new Group());
  const bridgeGeo = kit.geo(new BoxGeometry(0.042, 0.014, 0.150));
  const bridge = addTo(bridgeGroup, new Mesh(bridgeGeo, darkMat));
  bridge.position.set(0, -0.001, 0);
  bridge.castShadow = true;
  const saddleGeo = kit.geo(new BoxGeometry(0.006, 0.011, 0.120));
  addTo(bridgeGroup, new Mesh(saddleGeo, kit.mat(new MeshStandardMaterial({
    color: '#efe6d2', roughness: 0.4,
  })))).position.set(0.002, 0.0025, 0);

  // --- Strings -------------------------------------------------------------
  const stringGeo = kit.geo(new CylinderGeometry(0.0011, 0.0011, SCALE + 0.075, 5, 1, true));
  stringGeo.rotateZ(-Math.PI / 2);
  stringGeo.translate((SCALE + 0.075) / 2, 0, 0);
  const strings: Mesh[] = [];
  const gauge: number[] = [];
  for (let i = 0; i < STRINGS; i++) {
    const m = addTo(inst, new Mesh(stringGeo, stringMat));
    // Wound low strings are visibly fatter than a plain high E.
    const g = 2.4 - i * 0.28;
    gauge.push(g);
    // Pivot at the bridge and lean the far end out to the nut spacing, so the
    // drawn string and `stringZ` describe the same line.
    m.position.set(0, STRING_HEIGHT, stringZ(i, 0));
    m.rotation.y = -Math.asin((stringZ(i, SCALE) - stringZ(i, 0)) / SCALE);
    m.scale.set(1, g, g);
    strings.push(m);
  }

  // --- Reaction state ------------------------------------------------------
  const amp = new Float32Array(STRINGS);
  const phase = new Float32Array(STRINGS);
  /** Cycles per beat. Higher strings shimmer faster; nothing musical in it. */
  const rate = [17, 19, 22, 25, 28, 32];
  for (let i = 0; i < STRINGS; i++) phase[i] = rng.float(0, Math.PI * 2);
  let bodyAmp = 0;
  let bodyPhase = 0;
  let last = 0;
  let started = false;

  const station: PlayerStation = {
    offset: new Vector3(-0.06, 0, -0.20),
    facing: 0,
    posture: 'stand',
  };

  const model: AcousticGuitarModel = {
    archetype: 'acoustic-guitar',
    root,
    station,

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        return contactAt(IDLE_X, FINGER_HEIGHT + 0.035, stringZ(2, IDLE_X));
      }
      if (point.kind !== 'string') return undefined;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return undefined;
      if (!Number.isFinite(point.fret)) return undefined;
      // A fretted instrument snaps: there is nowhere between two wires to put
      // a finger and get a different note out of it.
      const n = Math.round(point.fret);
      if (n < 0 || n > FRETS) return undefined;
      const x = fretX(n);
      return contactAt(x, FINGER_HEIGHT, stringZ(i, x));
    },

    soundingContact(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        return contactAt(PLUCK_X + 0.06, STRING_HEIGHT + 0.05, 0);
      }
      if (point.kind !== 'string') return undefined;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return undefined;
      return contactAt(PLUCK_X, STRING_HEIGHT + 0.016, stringZ(i, PLUCK_X));
    },

    react(point: PlayPoint, force: number, now: number): void {
      if (point.kind !== 'string') return;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return;
      const f = Math.min(Math.max(force, 0), 1);
      amp[i] = Math.min(1.4, (amp[i] ?? 0) + 0.55 + f * 0.5);
      bodyAmp = Math.min(1.2, bodyAmp + 0.35 + f * 0.55);
      bodyPhase = 0;
      if (!started) { last = now; started = true; }
    },

    update(now: number): void {
      if (!started) { last = now; started = true; }
      const dt = Math.min(Math.max(now - last, 0), 0.4);
      last = now;
      if (dt <= 0 && bodyAmp <= 0) return;

      let live = false;
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
        live = true;
        // Low strings ring longer, which is both true and useful: the eye
        // reads the bass note as the one still moving.
        a *= Math.exp(-dt / (0.85 + (STRINGS - i) * 0.09));
        amp[i] = a;
        phase[i] = (phase[i] ?? 0) + dt * rate[i]!;
        const blur = 1 + a * 5.5;
        strings[i]!.scale.set(1, gauge[i]! * blur, gauge[i]! * (1 + a * 1.4));
        strings[i]!.position.y = STRING_HEIGHT + Math.sin(phase[i]!) * a * 0.0016;
      }

      if (bodyAmp > 0.001) {
        live = true;
        bodyAmp *= Math.exp(-dt / 0.55);
        bodyPhase += dt * 9;
        const b = Math.sin(bodyPhase) * bodyAmp;
        plate.scale.y = 0.085 * (1 + b * 0.22);
        bridgeGroup.position.y = b * -0.0022;
        bridgeGroup.rotation.z = b * 0.05;
        recoil.rotation.x = b * 0.012;
      } else if (bodyAmp !== 0) {
        bodyAmp = 0;
        plate.scale.y = 0.085;
        bridgeGroup.position.y = 0;
        bridgeGroup.rotation.z = 0;
        recoil.rotation.x = 0;
      }
      if (!live) bodyAmp = 0;
    },

    dispose(): void {
      frets.dispose();
      pegs.dispose();
      root.removeFromParent();
      root.clear();
      kit.release();
    },
  };

  return model;
};
