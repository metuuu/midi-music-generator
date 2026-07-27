/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Sitar — four playing strings over twenty curved frets, a gourd on the floor,
 * and thirteen sympathetic strings that nobody touches.
 *
 * `style/instruments.ts` calls this "the one plucked instrument that already
 * behaves like a pad", and that comment is the design brief for `react`. Every
 * note excites the sympathetic strings under the frets, and they keep going for
 * bars afterwards — so unlike every other instrument in this family, a sitar is
 * never completely still. That is the sound, and it should be the picture.
 *
 * Two other things are sitar-specific and both are in `react`:
 *
 *  - **The frets are tall arcs**, tied on and movable, which is what leaves
 *    room to pull a string sideways. A hard note bends across the fret rather
 *    than just ringing.
 *  - **The gourd is on the floor.** The player sits cross-legged, the work
 *    height is 0.7 m, and the neck goes up over the left shoulder.
 *
 * Fret positions are the same equal-tempered rule as every fretted instrument
 * here — `SCALE * 2^(-n/12)` from the bridge — which is a simplification a
 * sitar player would argue with, since the frets are movable and get set to the
 * raga. It is the right simplification: they are set to *something* close to
 * equal temperament, and the alternative is a table nobody can check.
 *
 * Build frame: `+x` bridge → nut, `+y` out of the fingerboard, `+z` low → high.
 */

import {
  BoxGeometry, type BufferGeometry, CylinderGeometry, Group, InstancedMesh,
  type Material, Matrix4, Mesh, MeshStandardMaterial, SphereGeometry,
  TorusGeometry, Vector3,
} from 'three';

import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import {
  addTo, type Contact, type InstrumentBuilder, type InstrumentModel,
  type PlayerStation,
} from './types.js';

/** Bridge to nut. A sitar is a long instrument and this is most of why. */
const SCALE = 0.860;
/** Matches `ARCHETYPES.sitar.frets`. */
const FRETS = 20;
const STRINGS = 4;
const SYMPATHETIC = 13;
const NUT_SPREAD = 0.030;
const BRIDGE_SPREAD = 0.058;
/** The action is high: a meend pulls the string a long way sideways. */
const STRING_HEIGHT = 0.020;
const FINGER_HEIGHT = 0.030;
/** The mizrab strikes just in front of the jawari bridge. */
const PLUCK_X = 0.075;
const IDLE_X = SCALE * Math.pow(2, -4 / 12);

const FACE = new Vector3(0, 1, 0);
/**
 * Up the neck — the axis the knuckles lie along, and it is **not** across the
 * strings.
 *
 * This was `(0, 0, 1)`, and the comment that stood here said it was preventing
 * "a hand lying up one string like a splint". It was producing exactly that.
 * The rig builds the hand from `along \u00d7 normal`, so an axis across the strings
 * comes out with the fingers pointing *down the neck toward the bridge*, and
 * the four knuckles spread across the six strings.
 *
 * A fretting hand is the other way round on both counts. Its four fingers take
 * four consecutive **frets**, so the knuckle line runs along the neck, and they
 * come down onto the board across the strings, perpendicular to them. `±x` is
 * bridge to nut, which is the line the frets are spaced along, and it is that
 * knuckle line. Which of its two *directions* a fretting hand takes is a
 * separate question with an anatomical answer: see `DOWN_NECK`.
 *
 * The *plucking* hand keeps this direction. It works over the top, by the
 * bridge, with the index nearest the neck and the mizrab crossing the strings
 * downward.
 */
const UP_NECK = new Vector3(1, 0, 0);
/**
 * Nut toward bridge: the fretting hand, index at the nut and therefore arriving
 * from underneath, palm below the neck and fingertips reaching up across the
 * strings. The argument is in `acoustic-guitar.ts`.
 *
 * A sitar makes it plainer than a guitar does, because the fingers do not just
 * stop the string here — they *pull* it sideways across the fret for a meend,
 * and the pull only makes sense as a hand hooked under the wire rather than
 * dropped onto it from above.
 */
const DOWN_NECK = new Vector3(-1, 0, 0);

function mountBasis(alongStrings: Vector3, faceHint: Vector3, at: Vector3): Matrix4 {
  const x = alongStrings.clone().normalize();
  const y = faceHint.clone().addScaledVector(x, -faceHint.dot(x)).normalize();
  const z = new Vector3().crossVectors(x, y);
  return new Matrix4().makeBasis(x, y, z).setPosition(at);
}

/** Gourd on the left foot, neck up across the body to the right shoulder. */
const MOUNT = mountBasis(
  new Vector3(0.859, 0.499, 0.100),
  new Vector3(0, 0.55, 0.84),
  new Vector3(-0.318, 0.420, 0.100),
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

/** Not part of `InstrumentModel`. See the note on `soundingContact`. */
export interface SitarModel extends InstrumentModel {
  /** Where the mizrab hand goes. `resolve` answers for the stopping hand. */
  soundingContact(point: PlayPoint): Contact | undefined;
}

export const buildSitar: InstrumentBuilder = (opts) => {
  const rng = new Rng(`sitar:${opts.seed}`);
  const kit = new Kit();

  const root = new Group();
  root.name = 'sitar';
  const shiver = addTo(root, new Group());
  const inst = addTo(shiver, new Group());
  inst.applyMatrix4(MOUNT);

  const wood = opts.finish ?? rng.pick(['#8a5a2a', '#7a4a22', '#9a6a34']);
  const woodMat = kit.mat(new MeshStandardMaterial({
    color: wood, roughness: 0.5, metalness: 0.04,
  }));
  const gourdMat = kit.mat(new MeshStandardMaterial({
    color: rng.pick(['#b98a4a', '#a87838', '#c79a58']),
    roughness: 0.45, flatShading: true,
  }));
  const inlayMat = kit.mat(new MeshStandardMaterial({
    color: rng.pick(['#e8dcc0', '#d8c8a0', '#f0e8d4']), roughness: 0.4,
  }));
  const boneMat = kit.mat(new MeshStandardMaterial({ color: '#efe6d0', roughness: 0.45 }));
  const wireMat = kit.mat(new MeshStandardMaterial({
    color: '#cfc9ae', roughness: 0.3, metalness: 0.7,
  }));
  const symMat = kit.mat(new MeshStandardMaterial({
    color: '#b9b09a', roughness: 0.35, metalness: 0.6,
  }));
  const fretMat = kit.mat(new MeshStandardMaterial({
    color: '#c8b070', roughness: 0.3, metalness: 0.8, flatShading: true,
  }));

  // --- The tumba: a gourd the size of a beach ball ------------------------
  const gourdGeo = kit.geo(new SphereGeometry(0.185, 10, 8));
  const gourd = addTo(inst, new Mesh(gourdGeo, gourdMat));
  gourd.position.set(-0.255, -0.130, 0);
  gourd.scale.set(1.15, 0.92, 1.0);
  gourd.castShadow = true;
  gourd.receiveShadow = true;

  /** The tabli — the flat wooden face the bridge stands on. */
  const tabliGeo = kit.geo(new CylinderGeometry(0.150, 0.150, 0.016, 12));
  tabliGeo.rotateZ(Math.PI / 2);
  const tabli = addTo(inst, new Mesh(tabliGeo, woodMat));
  tabli.position.set(-0.150, -0.062, 0);
  tabli.rotation.z = -0.52;

  const upperGeo = kit.geo(new SphereGeometry(0.085, 8, 6));
  const upper = addTo(inst, new Mesh(upperGeo, gourdMat));
  upper.position.set(SCALE + 0.035, -0.105, 0);
  upper.scale.set(1.1, 0.9, 1.0);
  upper.castShadow = true;

  // --- The dandi: a wide hollow neck ---------------------------------------
  const neckGeo = kit.geo(new BoxGeometry(SCALE + 0.10, 0.062, 0.090));
  const neck = addTo(inst, new Mesh(neckGeo, woodMat));
  neck.position.set(SCALE / 2 + 0.005, -0.045, 0);
  neck.castShadow = true;
  neck.receiveShadow = true;

  const inlayGeo = kit.geo(new BoxGeometry(SCALE + 0.06, 0.004, 0.070));
  addTo(inst, new Mesh(inlayGeo, inlayMat)).position.set(SCALE / 2, -0.0125, 0);

  // --- Twenty curved frets, tied on ---------------------------------------
  // A half-torus standing in the (across, up) plane, sunk into the neck so
  // only the arc shows, and stretched sideways so it spans the fingerboard.
  const fretGeo = kit.geo(new TorusGeometry(0.048, 0.0035, 3, 7, Math.PI));
  fretGeo.rotateY(Math.PI / 2);
  fretGeo.translate(0, -0.037, 0);
  const frets = addTo(inst, new InstancedMesh(fretGeo, fretMat, FRETS));
  {
    const m = new Matrix4();
    const p = new Vector3();
    for (let n = 1; n <= FRETS; n++) {
      // Stretched across the neck: a circular arc would be too narrow to reach
      // the outside strings without standing far too proud of the fingerboard.
      m.makeScale(1, 1, 2.0);
      m.setPosition(p.set(fretX(n), 0, 0));
      frets.setMatrixAt(n - 1, m);
    }
    frets.instanceMatrix.needsUpdate = true;
  }

  // --- The jawari: a wide flat bridge on the tabli -------------------------
  const bridgeGroup = addTo(inst, new Group());
  bridgeGroup.position.set(0, -0.030, 0);
  const jawariGeo = kit.geo(new BoxGeometry(0.055, 0.030, 0.110));
  const jawari = addTo(bridgeGroup, new Mesh(jawariGeo, boneMat));
  jawari.position.set(0, 0.015, 0);
  jawari.castShadow = true;
  const symBridgeGeo = kit.geo(new BoxGeometry(0.028, 0.018, 0.080));
  addTo(bridgeGroup, new Mesh(symBridgeGeo, boneMat)).position.set(0.058, 0.006, 0);

  const nutGeo = kit.geo(new BoxGeometry(0.014, 0.016, 0.062));
  addTo(inst, new Mesh(nutGeo, boneMat)).position.set(SCALE + 0.006, 0.005, 0);

  // --- Pegs: four big ones at the top, a ladder of small ones down the side
  const pegGeo = kit.geo(new CylinderGeometry(0.010, 0.016, 0.115, 6));
  pegGeo.rotateX(Math.PI / 2);
  const pegs = addTo(inst, new InstancedMesh(pegGeo, woodMat, STRINGS));
  {
    const m = new Matrix4();
    for (let i = 0; i < STRINGS; i++) {
      const side = i % 2 === 0 ? 0.055 : -0.055;
      pegs.setMatrixAt(i, m.makeTranslation(
        SCALE + 0.055 + Math.floor(i / 2) * 0.070, -0.045, side,
      ));
    }
    pegs.instanceMatrix.needsUpdate = true;
  }
  const symPegGeo = kit.geo(new CylinderGeometry(0.006, 0.009, 0.070, 5));
  symPegGeo.rotateX(Math.PI / 2);
  const symPegs = addTo(inst, new InstancedMesh(symPegGeo, woodMat, SYMPATHETIC));
  {
    const m = new Matrix4();
    for (let i = 0; i < SYMPATHETIC; i++) {
      symPegs.setMatrixAt(i, m.makeTranslation(
        0.235 + i * 0.043, -0.052, 0.056,
      ));
    }
    symPegs.instanceMatrix.needsUpdate = true;
  }

  // --- The thirteen sympathetic strings, under the frets -------------------
  const symGeo = kit.geo(new CylinderGeometry(0.0008, 0.0008, 1, 4, 1, true));
  symGeo.rotateZ(-Math.PI / 2);
  symGeo.translate(0.5, 0, 0);
  const syms = addTo(inst, new InstancedMesh(symGeo, symMat, SYMPATHETIC));
  const symLen: number[] = [];
  const symZ: number[] = [];
  {
    const m = new Matrix4();
    const p = new Vector3();
    for (let i = 0; i < SYMPATHETIC; i++) {
      const len = 0.235 + i * 0.043;
      const z = -0.024 + (i / (SYMPATHETIC - 1)) * 0.048;
      symLen.push(len);
      symZ.push(z);
      m.makeScale(len, 1, 1);
      m.setPosition(p.set(0.045, -0.010, z));
      syms.setMatrixAt(i, m);
    }
    syms.instanceMatrix.needsUpdate = true;
  }

  // --- The four playing strings -------------------------------------------
  const stringGeo = kit.geo(new CylinderGeometry(0.0013, 0.0013, SCALE + 0.09, 5, 1, true));
  stringGeo.rotateZ(-Math.PI / 2);
  stringGeo.translate((SCALE + 0.09) / 2 - 0.04, 0, 0);
  const strings: Mesh[] = [];
  const gauge: number[] = [];
  for (let i = 0; i < STRINGS; i++) {
    const m = addTo(inst, new Mesh(stringGeo, wireMat));
    const g = 1.9 - i * 0.22;
    gauge.push(g);
    m.position.set(0, STRING_HEIGHT, stringZ(i, 0));
    m.rotation.y = -Math.asin((stringZ(i, SCALE) - stringZ(i, 0)) / SCALE);
    m.scale.set(1, g, g);
    strings.push(m);
  }

  // --- Reaction state ------------------------------------------------------
  const amp = new Float32Array(STRINGS);
  const bend = new Float32Array(STRINGS);
  const phase = new Float32Array(STRINGS);
  const rate = [21, 24, 27, 31];
  for (let i = 0; i < STRINGS; i++) phase[i] = rng.float(0, Math.PI * 2);
  const symPhase = new Float32Array(SYMPATHETIC);
  for (let i = 0; i < SYMPATHETIC; i++) symPhase[i] = rng.float(0, Math.PI * 2);
  /**
   * The pad. Every note tops it up and it decays over bars rather than beats,
   * so the sympathetics are never entirely still once the piece has started.
   */
  let halo = 0;
  let gourdAmp = 0;
  let last = 0;
  let started = false;
  const scratchM = new Matrix4();
  const scratchP = new Vector3();

  const station: PlayerStation = {
    offset: new Vector3(-0.24, 0, -0.30),
    facing: 0.18,
    posture: 'sit',
  };

  const model: SitarModel = {
    archetype: 'sitar',
    root,
    station,

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        return contactAt(IDLE_X, FINGER_HEIGHT + 0.045, stringZ(0, IDLE_X), DOWN_NECK);
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
        return contactAt(PLUCK_X + 0.06, STRING_HEIGHT + 0.07, 0.02, UP_NECK);
      }
      if (point.kind !== 'string') return undefined;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return undefined;
      return contactAt(PLUCK_X, STRING_HEIGHT + 0.020, stringZ(i, PLUCK_X), UP_NECK);
    },

    react(point: PlayPoint, force: number, now: number): void {
      if (point.kind !== 'string') return;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return;
      const f = Math.min(Math.max(force, 0), 1);
      amp[i] = Math.min(1.4, (amp[i] ?? 0) + 0.6 + f * 0.5);
      // Meend: a hard note is pulled across the fret, not just struck.
      bend[i] = Math.min(1, (bend[i] ?? 0) + f * 0.9);
      halo = Math.min(1, halo + 0.25 + f * 0.35);
      gourdAmp = Math.min(1, gourdAmp + 0.3 + f * 0.4);
      if (!started) { last = now; started = true; }
    },

    update(now: number): void {
      if (!started) { last = now; started = true; }
      const dt = Math.min(Math.max(now - last, 0), 0.4);
      last = now;

      for (let i = 0; i < STRINGS; i++) {
        const a = (amp[i] ?? 0) * Math.exp(-dt / 2.0);
        const b = (bend[i] ?? 0) * Math.exp(-dt / 0.7);
        const wasLive = (amp[i] ?? 0) > 0.001 || (bend[i] ?? 0) > 0.001;
        amp[i] = a <= 0.001 ? 0 : a;
        bend[i] = b <= 0.001 ? 0 : b;
        if (!wasLive) continue;
        phase[i] = (phase[i] ?? 0) + dt * rate[i]!;
        const z0 = stringZ(i, 0);
        strings[i]!.scale.set(1, gauge[i]! * (1 + a * 5), gauge[i]! * (1 + a * 1.6));
        strings[i]!.position.set(
          0,
          STRING_HEIGHT + Math.sin(phase[i]!) * a * 0.0018,
          z0 + b * 0.014,
        );
      }

      // The sympathetics never quite stop, which is the whole point.
      if (halo > 0.004) {
        halo *= Math.exp(-dt / 6.0);
        for (let i = 0; i < SYMPATHETIC; i++) {
          symPhase[i] = (symPhase[i] ?? 0) + dt * (13 + i * 1.7);
          const w = Math.sin(symPhase[i]!) * halo;
          const blur = 1 + halo * 3.2;
          scratchM.makeScale(symLen[i]!, blur, blur);
          scratchM.setPosition(scratchP.set(0.045, -0.010 + w * 0.0016, symZ[i]!));
          syms.setMatrixAt(i, scratchM);
        }
        syms.instanceMatrix.needsUpdate = true;
      } else if (halo !== 0) {
        halo = 0;
        for (let i = 0; i < SYMPATHETIC; i++) {
          scratchM.makeScale(symLen[i]!, 1, 1);
          scratchM.setPosition(scratchP.set(0.045, -0.010, symZ[i]!));
          syms.setMatrixAt(i, scratchM);
        }
        syms.instanceMatrix.needsUpdate = true;
      }

      if (gourdAmp > 0.002) {
        gourdAmp *= Math.exp(-dt / 0.8);
        const g = Math.sin(now * 9) * gourdAmp;
        gourd.scale.set(1.15 + g * 0.02, 0.92 - g * 0.015, 1.0 + g * 0.02);
        bridgeGroup.rotation.z = g * 0.035;
        shiver.rotation.x = g * 0.006;
      } else if (gourdAmp !== 0) {
        gourdAmp = 0;
        gourd.scale.set(1.15, 0.92, 1.0);
        bridgeGroup.rotation.z = 0;
        shiver.rotation.x = 0;
      }
    },

    dispose(): void {
      frets.dispose();
      pegs.dispose();
      symPegs.dispose();
      syms.dispose();
      root.removeFromParent();
      root.clear();
      kit.release();
    },
  };

  return model;
};
