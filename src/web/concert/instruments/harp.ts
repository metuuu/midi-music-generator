/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Harp — eighty strings, one per note, and no stopping hand at all.
 *
 * The odd one out in the string family. Every other instrument here resolves a
 * pitch to *a string plus a length of it*; a harp resolves a pitch to a whole
 * string, so `ARCHETYPES.harp` carries neither `strings` nor `frets` and there
 * is no fret rule in this file. What there is instead is a fan: the strings run
 * between two lines — the soundboard and the neck — and the distance between
 * those lines shrinks from a metre at the bass end to 15 cm at the treble, so
 * the bass strings are long and low and near the column and the treble ones are
 * short and high and by the player's shoulder. That fan is the harp's whole
 * silhouette and it is four numbers.
 *
 * Eighty strings is also the one place in this family where instancing is not
 * optional: they are one `InstancedMesh` and one draw call, and `update` only
 * rewrites the matrices of strings that are actually ringing.
 *
 * Build frame: `+x` bass → treble, `+y` up, `+z` out of the string plane
 * toward the player, which is the side both hands work from.
 */

import {
  BoxGeometry, type BufferGeometry, CatmullRomCurve3, Color, CylinderGeometry,
  Group, InstancedMesh, type Material, Matrix4, Mesh, MeshStandardMaterial,
  Quaternion, TubeGeometry, Vector3,
} from 'three';

import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import {
  addTo, type Contact, type InstrumentBuilder, type InstrumentModel,
  type PlayerStation,
} from './types.js';

/** `ARCHETYPES.harp.range` is [24, 103]: eighty strings, chromatic. */
const LOWEST_MIDI = 24;
const COURSES = 80;

/** Where the strings leave the soundboard, bass end and treble end. */
const SOUND_LOW = new Vector3(0.00, 0.36, 0);
const SOUND_HIGH = new Vector3(0.30, 1.49, 0);
/** And where they meet the neck. */
const NECK_LOW = new Vector3(0.62, 1.22, 0);
const NECK_HIGH = new Vector3(0.36, 1.63, 0);
/** How far along the string a harpist actually plucks. Not the middle. */
const PLUCK_T = 0.42;

const PLANE_NORMAL = new Vector3(0, 0, 1);

/**
 * The string plane, turned so the audience gets a three-quarter view and the
 * player sits behind it. Built from "which way does the player face the
 * strings" rather than from Euler angles, because that is the fact that
 * matters and the angles are not readable.
 */
function harpMount(): Matrix4 {
  const z = new Vector3(-0.55, 0.10, -0.83).normalize();
  const y = new Vector3(0, 1, 0);
  y.addScaledVector(z, -y.dot(z)).normalize();
  const x = new Vector3().crossVectors(y, z);
  return new Matrix4().makeBasis(x, y, z).setPosition(new Vector3(0.275, 0.025, -0.182));
}

const MOUNT = harpMount();

/** Soundboard end of string `n`. */
function footOf(n: number, out: Vector3): Vector3 {
  return out.copy(SOUND_LOW).lerp(SOUND_HIGH, n / (COURSES - 1));
}

/** Neck end of string `n`. */
function headOf(n: number, out: Vector3): Vector3 {
  return out.copy(NECK_LOW).lerp(NECK_HIGH, n / (COURSES - 1));
}

/**
 * Which string a point asks for.
 *
 * `ARCHETYPES.harp` declares no `strings` array, so there is no index space for
 * `PlayPoint.string` to index into and the convention has to be stated
 * somewhere. It is stated here: **`string` is the course number up from the
 * archetype's lowest note, and `fret` is a semitone offset added to it**, so
 * both `{string: midi - 24, fret: 0}` and `{string: 0, fret: midi - 24}` mean
 * the same string. A `key` point is accepted too, since a harp is the one
 * plucked instrument where a pitch identifies a course exactly. Anything that
 * lands outside 0..79 is `undefined` rather than the nearest string — see the
 * build report, this is the one convention worth confirming centrally.
 */
function courseOf(point: PlayPoint): number | undefined {
  let n: number;
  if (point.kind === 'string') {
    if (!Number.isFinite(point.string) || !Number.isFinite(point.fret)) return undefined;
    n = Math.round(point.string + point.fret);
  } else if (point.kind === 'key') {
    if (!Number.isFinite(point.midi)) return undefined;
    n = Math.round(point.midi) - LOWEST_MIDI;
  } else {
    return undefined;
  }
  return n >= 0 && n < COURSES ? n : undefined;
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

/** Not part of `InstrumentModel`. */
export interface HarpModel extends InstrumentModel {
  /**
   * The same place `resolve` returns: on a harp the stopping hand and the
   * sounding hand are the same hand. Present so every string model in this
   * family answers the same question.
   */
  soundingContact(point: PlayPoint): Contact | undefined;
}

export const buildHarp: InstrumentBuilder = (opts) => {
  const rng = new Rng(`harp:${opts.seed}`);
  const kit = new Kit();

  const root = new Group();
  root.name = 'harp';
  /**
   * Rests at identity, so `MOUNT` describes the instrument's pose exactly and
   * `resolve` can be computed from it without ever reading the scene graph.
   */
  const shiver = addTo(root, new Group());
  const inst = addTo(shiver, new Group());
  inst.applyMatrix4(MOUNT);

  const gilt = opts.finish ?? rng.pick(['#c8a24a', '#d8b45c', '#b8903c']);
  const frameMat = kit.mat(new MeshStandardMaterial({
    color: gilt, roughness: 0.35, metalness: 0.45, flatShading: true,
  }));
  const boxMat = kit.mat(new MeshStandardMaterial({
    color: rng.pick(['#7a4a24', '#8c5a2c', '#6b3d1e']), roughness: 0.55,
  }));
  const boardMat = kit.mat(new MeshStandardMaterial({
    color: '#e6cf9a', roughness: 0.5,
  }));
  const stringMat = kit.mat(new MeshStandardMaterial({
    color: '#ffffff', roughness: 0.4, metalness: 0.2,
  }));

  // --- Soundbox: a tapered wedge lying along the soundboard line ----------
  const boxDir = new Vector3().subVectors(SOUND_HIGH, SOUND_LOW);
  const boxLen = boxDir.length();
  {
    const g = kit.geo(new CylinderGeometry(0.055, 0.150, boxLen, 6, 1, false));
    const box = addTo(inst, new Mesh(g, boxMat));
    box.position.copy(SOUND_LOW).addScaledVector(boxDir, 0.5);
    box.position.z = -0.115;
    box.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), boxDir.clone().normalize());
    box.castShadow = true;
    box.receiveShadow = true;
  }
  /** The soundboard itself: the flat strip the strings actually come out of. */
  {
    const g = kit.geo(new BoxGeometry(0.052, boxLen, 0.030));
    const board = addTo(inst, new Mesh(g, boardMat));
    board.position.copy(SOUND_LOW).addScaledVector(boxDir, 0.5);
    board.position.z = 0.006;
    board.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), boxDir.clone().normalize());
    board.receiveShadow = true;
  }

  // --- Base and pedals -----------------------------------------------------
  {
    const g = kit.geo(new BoxGeometry(0.70, 0.20, 0.34));
    const base = addTo(inst, new Mesh(g, boxMat));
    base.position.set(0.32, 0.10, -0.06);
    base.castShadow = true;
    base.receiveShadow = true;
  }
  const pedalGeo = kit.geo(new BoxGeometry(0.036, 0.014, 0.075));
  const pedals = addTo(inst, new InstancedMesh(pedalGeo, frameMat, 7));
  {
    const m = new Matrix4();
    for (let i = 0; i < 7; i++) {
      const side = i < 4 ? 1 : -1;
      pedals.setMatrixAt(i, m.makeTranslation(
        0.16 + (i % 4) * 0.10, 0.085, side * 0.19,
      ));
    }
    pedals.instanceMatrix.needsUpdate = true;
  }

  // --- Column and neck -----------------------------------------------------
  {
    const from = new Vector3(0.60, 0.19, -0.02);
    const to = NECK_LOW.clone();
    const dir = new Vector3().subVectors(to, from);
    const g = kit.geo(new CylinderGeometry(0.038, 0.052, dir.length(), 7));
    const col = addTo(inst, new Mesh(g, frameMat));
    col.position.copy(from).addScaledVector(dir, 0.5);
    col.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
    col.castShadow = true;
  }
  {
    // The neck is the one curve on the instrument and it does a lot of work.
    const curve = new CatmullRomCurve3([
      NECK_LOW.clone().add(new Vector3(0.02, -0.03, 0)),
      new Vector3(0.585, 1.375, 0),
      new Vector3(0.500, 1.560, 0),
      NECK_HIGH.clone().add(new Vector3(-0.03, 0.02, 0)),
    ]);
    const neck = addTo(inst, new Mesh(
      kit.geo(new TubeGeometry(curve, 12, 0.040, 6, false)), frameMat,
    ));
    neck.castShadow = true;
  }

  // --- Eighty strings, one instanced mesh ---------------------------------
  const stringGeo = kit.geo(new CylinderGeometry(0.0016, 0.0016, 1, 4, 1, true));
  const stringMesh = addTo(inst, new InstancedMesh(stringGeo, stringMat, COURSES));
  const mids: Vector3[] = [];
  const quats: Quaternion[] = [];
  const lens: number[] = [];
  {
    const up = new Vector3(0, 1, 0);
    const foot = new Vector3();
    const head = new Vector3();
    const dir = new Vector3();
    const m = new Matrix4();
    const scale = new Vector3();
    const colour = new Color();
    for (let n = 0; n < COURSES; n++) {
      footOf(n, foot);
      headOf(n, head);
      dir.subVectors(head, foot);
      const len = dir.length();
      const mid = new Vector3().copy(foot).addScaledVector(dir, 0.5);
      const q = new Quaternion().setFromUnitVectors(up, dir.clone().normalize());
      mids.push(mid);
      quats.push(q);
      lens.push(len);
      stringMesh.setMatrixAt(n, m.compose(mid, q, scale.set(1, len, 1)));
      // The colour code every harpist navigates by: C red, F blue-black.
      const pc = (LOWEST_MIDI + n) % 12;
      colour.set(pc === 0 ? '#c8352c' : pc === 5 ? '#2f4e8c' : '#efe6cf');
      stringMesh.setColorAt(n, colour);
    }
    stringMesh.instanceMatrix.needsUpdate = true;
    if (stringMesh.instanceColor) stringMesh.instanceColor.needsUpdate = true;
  }

  // --- Reaction state ------------------------------------------------------
  const amp = new Float32Array(COURSES);
  const phase = new Float32Array(COURSES);
  /** Only these get their matrices rewritten. Eighty per frame would be silly. */
  const ringing = new Set<number>();
  let boardAmp = 0;
  let last = 0;
  let started = false;
  const scratchM = new Matrix4();
  const scratchP = new Vector3();
  const scratchS = new Vector3();

  function excite(n: number, energy: number): void {
    if (n < 0 || n >= COURSES) return;
    amp[n] = Math.min(1.3, (amp[n] ?? 0) + energy);
    phase[n] = rng.float(0, Math.PI * 2);
    ringing.add(n);
  }

  const station: PlayerStation = {
    offset: new Vector3(-0.21, 0, -0.36),
    facing: 0.585,
    posture: 'sit',
  };

  const model: HarpModel = {
    archetype: 'harp',
    root,
    station,

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        // Hands lifted off the middle of the fan, which is where they wait.
        const foot = footOf(40, new Vector3());
        const head = headOf(40, new Vector3());
        return {
          position: foot.lerp(head, PLUCK_T).add(new Vector3(0, 0.05, 0.09))
            .applyMatrix4(MOUNT),
          normal: PLANE_NORMAL.clone().transformDirection(MOUNT),
        };
      }
      const n = courseOf(point);
      if (n === undefined) return undefined;
      const foot = footOf(n, new Vector3());
      const head = headOf(n, new Vector3());
      return {
        position: foot.lerp(head, PLUCK_T).add(new Vector3(0, 0, 0.012))
          .applyMatrix4(MOUNT),
        normal: PLANE_NORMAL.clone().transformDirection(MOUNT),
      };
    },

    soundingContact(point: PlayPoint): Contact | undefined {
      return model.resolve(point);
    },

    react(point: PlayPoint, force: number, now: number): void {
      const n = courseOf(point);
      if (n === undefined) return;
      const f = Math.min(Math.max(force, 0), 1);
      excite(n, 0.6 + f * 0.5);
      // Sympathetic ring at the octave and the twelfth. A harp is a room full
      // of undamped strings and it is why the instrument sounds like weather.
      excite(n + 12, (0.6 + f * 0.5) * 0.16);
      excite(n - 12, (0.6 + f * 0.5) * 0.12);
      excite(n + 19, (0.6 + f * 0.5) * 0.08);
      boardAmp = Math.min(1, boardAmp + 0.3 + f * 0.4);
      if (!started) { last = now; started = true; }
    },

    update(now: number): void {
      if (!started) { last = now; started = true; }
      const dt = Math.min(Math.max(now - last, 0), 0.4);
      last = now;

      if (ringing.size > 0) {
        for (const n of ringing) {
          let a = amp[n] ?? 0;
          // Bass strings ring for bars; treble ones are gone in a beat.
          a *= Math.exp(-dt / (2.6 - (n / COURSES) * 1.9));
          const settled = a <= 0.004;
          amp[n] = settled ? 0 : a;
          phase[n] = (phase[n] ?? 0) + dt * (9 + (n / COURSES) * 34);
          const wobble = settled ? 0 : Math.sin(phase[n]!) * a * 0.010;
          const blur = settled ? 1 : 1 + a * 4.5;
          scratchP.copy(mids[n]!);
          scratchP.z += wobble;
          stringMesh.setMatrixAt(n, scratchM.compose(
            scratchP, quats[n]!, scratchS.set(blur, lens[n]!, blur),
          ));
          if (settled) ringing.delete(n);
        }
        stringMesh.instanceMatrix.needsUpdate = true;
      }

      if (boardAmp > 0.002) {
        boardAmp *= Math.exp(-dt / 1.2);
        const s = Math.sin(now * 8) * boardAmp;
        shiver.position.set(s * 0.0016, 0, s * 0.0022);
        shiver.rotation.z = s * 0.0018;
      } else if (boardAmp !== 0) {
        boardAmp = 0;
        shiver.position.set(0, 0, 0);
        shiver.rotation.z = 0;
      }
    },

    dispose(): void {
      stringMesh.dispose();
      pedals.dispose();
      root.removeFromParent();
      root.clear();
      kit.release();
    },
  };

  return model;
};
