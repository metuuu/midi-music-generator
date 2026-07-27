/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The synthesiser — the ambient band's entire world.
 *
 * Thirty-odd catalogue entries land on this one model: every pad, every lead,
 * every FX patch, the synth basses and the synth brass. So it deliberately does
 * *not* try to be a particular instrument. It reads as "a synthesiser" — a full
 * keyboard on an X-stand, a sloped panel of knobs above it, a patch bay with a
 * few cables hanging out of it — because a Minimoog silhouette would be a lie
 * on two thirds of the parts that get staged on it.
 *
 * The one thing it does take seriously is the keyboard. Pitch runs bass at `+x`
 * to treble at `-x`, the same as every other keyboard here; the argument is in
 * `grand-piano.ts`.
 */

import {
  BoxGeometry, BufferGeometry, CatmullRomCurve3, CylinderGeometry, Group,
  InstancedMesh, Material, Matrix4, Mesh, MeshStandardMaterial, Object3D,
  Quaternion, TubeGeometry, Vector3,
} from 'three';

import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import {
  addTo, type Contact, type InstrumentBuilder, type InstrumentModel,
} from './types.js';

const BLACK = [false, true, false, true, false, false, true, false, true, false, true, false];
const WHITE_AT = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];

const LOW = 21;
const HIGH = 108;

const WHITE_W = 0.0235;
const WHITE_L = 0.145;
const BLACK_W = 0.0110;
const BLACK_L = 0.092;
const WHITE_H = 0.018;
const BLACK_H = 0.014;

function whiteIndex(midi: number): number {
  return Math.floor(midi / 12) * 7 + WHITE_AT[midi % 12]!;
}
const WHITE_COUNT = whiteIndex(HIGH) - whiteIndex(LOW) + 1;
const BOARD_W = WHITE_COUNT * WHITE_W;

function keyU(midi: number): number {
  const i = whiteIndex(midi) - whiteIndex(LOW);
  return BLACK[midi % 12]! ? (i + 1) * WHITE_W : (i + 0.5) * WHITE_W;
}
function keyX(midi: number): number {
  return BOARD_W / 2 - keyU(midi);
}

const KEY_BACK_Z = -0.05;
const KEY_TOP_Y = 0.95;   // the archetype's workHeight
const BLACK_TOP_Y = KEY_TOP_Y + 0.010;
const WHITE_TOUCH_Z = KEY_BACK_Z - 0.098;
const BLACK_TOUCH_Z = KEY_BACK_Z - 0.056;

class Hit {
  beat = -1e9;
  force = 0;
  fire(now: number, force: number): void {
    this.beat = now;
    this.force = force < 0 ? 0 : force > 1 ? 1 : force;
  }
  level(now: number, tau: number): number {
    const age = now - this.beat;
    if (age < 0 || age > tau * 6) return 0;
    return Math.exp(-age / tau);
  }
}

function disposeTree(root: Object3D): void {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  root.traverse((o) => {
    const mesh = o as Partial<Mesh> & Partial<InstancedMesh>;
    if (mesh.geometry) geometries.add(mesh.geometry);
    const m = mesh.material;
    if (Array.isArray(m)) for (const one of m) materials.add(one);
    else if (m) materials.add(m);
    if ((o as InstancedMesh).isInstancedMesh) (o as InstancedMesh).dispose();
  });
  for (const g of geometries) g.dispose();
  for (const m of materials) m.dispose();
  root.clear();
}

export const buildSynth: InstrumentBuilder = (opts) => {
  const rng = new Rng(`synth:${opts.seed}`);
  const root = new Group();
  root.name = 'synth';

  const caseColour = opts.finish ?? rng.pick(['#23262b', '#1a1c20', '#2f3138', '#3a2f2a']);
  const accent = rng.pick(['#e0533a', '#3fa9d8', '#e6b63c', '#8f6fd0']);

  const caseMat = new MeshStandardMaterial({ color: caseColour, roughness: 0.62, metalness: 0.14 });
  const panelMat = new MeshStandardMaterial({ color: '#15171b', roughness: 0.5, metalness: 0.25 });
  const ivoryMat = new MeshStandardMaterial({ color: '#eceade', roughness: 0.44, metalness: 0 });
  const ebonyMat = new MeshStandardMaterial({ color: '#141417', roughness: 0.4, metalness: 0 });
  const chromeMat = new MeshStandardMaterial({ color: '#b9c0c8', roughness: 0.3, metalness: 0.88 });
  const knobMat = new MeshStandardMaterial({ color: '#4a4f57', roughness: 0.5, metalness: 0.35 });
  const capMat = new MeshStandardMaterial({ color: accent, roughness: 0.45, metalness: 0.2 });
  const cableMat = new MeshStandardMaterial({ color: accent, roughness: 0.75, metalness: 0 });
  const ledMat = new MeshStandardMaterial({
    color: '#0d1a12', emissive: accent, emissiveIntensity: 0.8, roughness: 0.4,
  });

  // --- Case and panel ------------------------------------------------------

  const shellW = BOARD_W + 0.10;
  const tray = addTo(root, new Mesh(new BoxGeometry(shellW, 0.11, WHITE_L + 0.09), caseMat));
  tray.position.set(0, KEY_TOP_Y - 0.062, KEY_BACK_Z - WHITE_L / 2 - 0.02);
  tray.castShadow = true;
  tray.receiveShadow = true;

  for (const side of [1, -1]) {
    const cheek = addTo(root, new Mesh(new BoxGeometry(0.05, 0.10, WHITE_L + 0.09), caseMat));
    cheek.position.set(side * (shellW / 2 - 0.024), KEY_TOP_Y + 0.005, KEY_BACK_Z - WHITE_L / 2 - 0.02);
    cheek.castShadow = true;
  }

  /**
   * The control surface, tilted back so the player can read it and the audience
   * can see there is something to read. Everything decorative hangs off this
   * group, so the tilt is set once.
   */
  const panel = addTo(root, new Group());
  panel.position.set(0, KEY_TOP_Y - 0.005, KEY_BACK_Z + 0.015);
  panel.rotation.x = -0.55;
  const panelSlab = addTo(panel, new Mesh(new BoxGeometry(shellW, 0.035, 0.30), panelMat));
  panelSlab.position.z = 0.15;
  panelSlab.castShadow = true;
  const panelLip = addTo(panel, new Mesh(new BoxGeometry(shellW, 0.05, 0.03), caseMat));
  panelLip.position.set(0, 0.010, 0.295);

  // Knobs: two rows, one instanced body and one instanced cap.
  const KNOBS = 22;
  const knobGeo = new CylinderGeometry(0.017, 0.019, 0.026, 10);
  const capGeo = new BoxGeometry(0.005, 0.028, 0.020);
  const knobMesh = addTo(panel, new InstancedMesh(knobGeo, knobMat, KNOBS));
  const capMesh = addTo(panel, new InstancedMesh(capGeo, capMat, KNOBS));
  {
    const m = new Matrix4();
    const q = new Quaternion();
    const yAxis = new Vector3(0, 1, 0);
    for (let i = 0; i < KNOBS; i++) {
      const row = i < 11 ? 0 : 1;
      const col = i % 11;
      const x = 0.44 - col * 0.088;
      const z = 0.085 + row * 0.10;
      // Knob angles are pure decoration and never resolved, so the seed is
      // free to set them.
      q.setFromAxisAngle(yAxis, rng.float(-1.9, 1.9));
      m.compose(new Vector3(x, 0.030, z), q, new Vector3(1, 1, 1));
      knobMesh.setMatrixAt(i, m);
      m.compose(new Vector3(x, 0.044, z), q, new Vector3(1, 1, 1));
      capMesh.setMatrixAt(i, m);
    }
    knobMesh.instanceMatrix.needsUpdate = true;
    capMesh.instanceMatrix.needsUpdate = true;
  }

  // Sliders, because half a synth panel is faders.
  const slotGeo = new BoxGeometry(0.010, 0.006, 0.075);
  const capsGeo = new BoxGeometry(0.020, 0.012, 0.016);
  const slotMesh = addTo(panel, new InstancedMesh(slotGeo, panelMat, 6));
  const faderMesh = addTo(panel, new InstancedMesh(capsGeo, chromeMat, 6));
  {
    const m = new Matrix4();
    for (let i = 0; i < 6; i++) {
      const x = -0.30 - i * 0.034;
      m.makeTranslation(x, 0.022, 0.085);
      slotMesh.setMatrixAt(i, m);
      m.makeTranslation(x, 0.030, 0.085 + rng.float(-0.028, 0.028));
      faderMesh.setMatrixAt(i, m);
    }
    slotMesh.instanceMatrix.needsUpdate = true;
    faderMesh.instanceMatrix.needsUpdate = true;
  }

  // --- Patch bay -----------------------------------------------------------

  /**
   * A small bank of jacks on the treble end of the panel with a few cables
   * looped out of it. Nothing here moves and nothing resolves against it — it
   * is here because a patch cable is the one prop that says "synthesiser" from
   * the back of a room.
   */
  const jackGeo = new CylinderGeometry(0.006, 0.006, 0.010, 8);
  const jacks = addTo(panel, new InstancedMesh(jackGeo, chromeMat, 12));
  {
    const m = new Matrix4();
    const q = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
    for (let i = 0; i < 12; i++) {
      const x = -0.44 + (i % 4) * 0.026;
      const z = 0.235 - Math.floor(i / 4) * 0.026;
      m.compose(new Vector3(x, 0.028, z), q, new Vector3(1, 1, 1));
      jacks.setMatrixAt(i, m);
    }
    jacks.instanceMatrix.needsUpdate = true;
  }
  for (let c = 0; c < 3; c++) {
    const ax = -0.44 + rng.int(0, 3) * 0.026;
    const az = 0.235 - rng.int(0, 2) * 0.026;
    const bx = -0.44 + rng.int(0, 3) * 0.026;
    const bz = 0.235 - rng.int(0, 2) * 0.026;
    const curve = new CatmullRomCurve3([
      new Vector3(ax, 0.030, az),
      new Vector3((ax + bx) / 2 + rng.float(-0.05, 0.05), 0.030 + rng.float(0.06, 0.13), (az + bz) / 2),
      new Vector3(bx, 0.030, bz),
    ]);
    const cable = addTo(panel, new Mesh(new TubeGeometry(curve, 10, 0.0035, 5, false), cableMat));
    cable.castShadow = false;
  }

  /** The note lamp: one LED that slides to whatever is being played. */
  const led = addTo(panel, new Mesh(new BoxGeometry(0.020, 0.010, 0.012), ledMat));
  led.position.set(0, 0.026, 0.255);

  // --- Pitch and mod wheels, on the player's left end ----------------------

  const wheelGeo = new CylinderGeometry(0.032, 0.032, 0.014, 12);
  const wheels: Mesh[] = [];
  for (let i = 0; i < 2; i++) {
    const w = addTo(root, new Mesh(wheelGeo, knobMat));
    w.rotation.z = Math.PI / 2;
    w.position.set(shellW / 2 + 0.035, KEY_TOP_Y + 0.005, KEY_BACK_Z - 0.045 - i * 0.042);
    w.castShadow = true;
    wheels.push(w);
  }
  const wheelBlock = addTo(root, new Mesh(new BoxGeometry(0.085, 0.10, 0.13), caseMat));
  wheelBlock.position.set(shellW / 2 + 0.035, KEY_TOP_Y - 0.038, KEY_BACK_Z - 0.066);
  wheelBlock.castShadow = true;

  // --- X-stand -------------------------------------------------------------

  const barGeo = new CylinderGeometry(0.019, 0.019, 1, 8);
  function tube(a: Vector3, b: Vector3, mat: Material): void {
    const mesh = addTo(root, new Mesh(barGeo, mat));
    const dir = b.clone().sub(a);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.scale.set(1, Math.max(dir.length(), 1e-4), 1);
    mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
  }
  const standTop = KEY_TOP_Y - 0.12;
  const zc = KEY_BACK_Z - 0.08;
  for (const s of [1, -1]) {
    tube(new Vector3(0.30 * s, standTop, zc - 0.22), new Vector3(-0.30 * s, 0.02, zc + 0.22), chromeMat);
    tube(new Vector3(0.30 * s, standTop, zc + 0.22), new Vector3(-0.30 * s, 0.02, zc - 0.22), chromeMat);
  }
  tube(new Vector3(0.30, standTop, zc - 0.22), new Vector3(0.30, standTop, zc + 0.22), chromeMat);
  tube(new Vector3(-0.30, standTop, zc - 0.22), new Vector3(-0.30, standTop, zc + 0.22), chromeMat);

  // --- Keybed --------------------------------------------------------------

  const whiteGeo = new BoxGeometry(WHITE_W * 0.94, WHITE_H, WHITE_L);
  whiteGeo.translate(0, -WHITE_H / 2, -WHITE_L / 2);
  const blackGeo = new BoxGeometry(BLACK_W, BLACK_H, BLACK_L);
  blackGeo.translate(0, -BLACK_H / 2, -BLACK_L / 2);

  const whites: number[] = [];
  const blacks: number[] = [];
  for (let m = LOW; m <= HIGH; m++) (BLACK[m % 12]! ? blacks : whites).push(m);

  const whiteMesh = addTo(root, new InstancedMesh(whiteGeo, ivoryMat, whites.length));
  const blackMesh = addTo(root, new InstancedMesh(blackGeo, ebonyMat, blacks.length));
  whiteMesh.receiveShadow = true;
  blackMesh.castShadow = true;

  interface Key { mesh: InstancedMesh; slot: number; pivot: Vector3; hit: Hit }
  const keys = new Map<number, Key>();
  const scratch = new Matrix4();
  const quat = new Quaternion();
  const one = new Vector3(1, 1, 1);
  const xAxis = new Vector3(1, 0, 0);

  function seat(mesh: InstancedMesh, list: number[], y: number): void {
    list.forEach((midi, slot) => {
      const pivot = new Vector3(keyX(midi), y, KEY_BACK_Z);
      scratch.makeTranslation(pivot.x, pivot.y, pivot.z);
      mesh.setMatrixAt(slot, scratch);
      keys.set(midi, { mesh, slot, pivot, hit: new Hit() });
    });
    mesh.instanceMatrix.needsUpdate = true;
  }
  seat(whiteMesh, whites, KEY_TOP_Y);
  seat(blackMesh, blacks, BLACK_TOP_Y);

  const moving = new Set<Key>();
  const ledHit = new Hit();
  let ledX = 0;
  const UP = new Vector3(0, 1, 0);

  const model: InstrumentModel = {
    archetype: 'synth',
    root,

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        return { position: new Vector3(0, KEY_TOP_Y + 0.085, WHITE_TOUCH_Z), normal: UP.clone() };
      }
      if (point.kind !== 'key') return undefined;
      const midi = point.midi;
      if (midi < LOW || midi > HIGH || !Number.isInteger(midi)) return undefined;
      const black = BLACK[midi % 12]!;
      return {
        position: new Vector3(
          keyX(midi),
          black ? BLACK_TOP_Y : KEY_TOP_Y,
          black ? BLACK_TOUCH_Z : WHITE_TOUCH_Z,
        ),
        normal: UP.clone(),
      };
    },

    react(point: PlayPoint, force: number, now: number): void {
      if (point.kind !== 'key') return;
      const key = keys.get(point.midi);
      if (!key) return;
      key.hit.fire(now, force);
      moving.add(key);
      ledHit.fire(now, force);
      // The lamp tracks pitch across the panel, so a rising line visibly rises.
      ledX = keyX(point.midi) * 0.72;
    },

    update(now: number): void {
      if (moving.size > 0) {
        let whiteDirty = false;
        let blackDirty = false;
        for (const key of moving) {
          // Slower than a piano: a pad is held, and a synth action is squashy.
          const env = key.hit.level(now, 0.40);
          const dip = 0.052 * (0.6 + 0.4 * key.hit.force) * env;
          quat.setFromAxisAngle(xAxis, -dip);
          scratch.compose(key.pivot, quat, one);
          key.mesh.setMatrixAt(key.slot, scratch);
          if (key.mesh === whiteMesh) whiteDirty = true; else blackDirty = true;
          if (env < 0.02) moving.delete(key);
        }
        if (whiteDirty) whiteMesh.instanceMatrix.needsUpdate = true;
        if (blackDirty) blackMesh.instanceMatrix.needsUpdate = true;
      }
      const glow = ledHit.force * ledHit.level(now, 0.7);
      led.position.x += (ledX - led.position.x) * 0.25;
      ledMat.emissiveIntensity = 0.35 + 2.4 * glow;
      // The mod wheel leans into a hard note. It is the only thing on this
      // instrument a player's hand would actually move that is not a key.
      const w = wheels[1];
      if (w) w.rotation.x = -glow * 0.5;
    },

    station: { offset: new Vector3(0, 0, KEY_BACK_Z - WHITE_L - 0.28), facing: 0, posture: 'stand' },

    dispose(): void {
      disposeTree(root);
    },
  };

  return model;
};
