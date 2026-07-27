/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The mallet instrument — a vibraphone.
 *
 * Six catalogue entries land here (vibraphone, glockenspiel, marimba, tubular
 * bells, music box, kalimba) and `ARCHETYPES.mallets` calls the archetype a
 * vibraphone, so that is what this is: bars in two rows laid out like a
 * keyboard, a resonator under every one of them, a damper bar and a pedal, and
 * the rotating discs that no other instrument on a stage has.
 *
 * The discs are the reason this model is worth building rather than faking.
 * They turn *all the time*, independently of anything being played, and a thing
 * that moves when nothing has happened is what separates a working instrument
 * from a prop.
 *
 * Layout follows every other keyboard here: naturals in the near row, sharps
 * raised behind them on the boundaries between their neighbours, low notes at
 * `+x` under the player's left hand and pitch rising toward `-x`.
 */

import {
  BoxGeometry, BufferGeometry, CylinderGeometry, Group, InstancedMesh, Material,
  Matrix4, Mesh, MeshStandardMaterial, Object3D, Quaternion, Vector3,
} from 'three';

import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import {
  addTo, type Contact, type InstrumentBuilder, type InstrumentModel,
} from './types.js';

const BLACK = [false, true, false, true, false, false, true, false, true, false, true, false];
const WHITE_AT = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];

/** F3..C7 — three and a half octaves, exactly what the archetype declares. */
const LOW = 53;
const HIGH = 96;

/** Bar-to-bar spacing across the naturals. A real vibe is about this wide. */
const PITCH = 0.052;
const NATURAL_W = 0.046;
const SHARP_W = 0.040;

const NATURAL_Y = 0.900;   // the archetype's workHeight
const SHARP_Y = 0.955;
const NATURAL_Z = -0.14;
const SHARP_Z = 0.11;

function whiteIndex(midi: number): number {
  return Math.floor(midi / 12) * 7 + WHITE_AT[midi % 12]!;
}
const NATURAL_COUNT = whiteIndex(HIGH) - whiteIndex(LOW) + 1;
const ROW_W = NATURAL_COUNT * PITCH;

function barU(midi: number): number {
  const i = whiteIndex(midi) - whiteIndex(LOW);
  return BLACK[midi % 12]! ? (i + 1) * PITCH : (i + 0.5) * PITCH;
}
function barX(midi: number): number {
  return ROW_W / 2 - barU(midi);
}
/** How far up the instrument a note is, 0 at the bottom bar and 1 at the top. */
function barT(midi: number): number {
  return (midi - LOW) / (HIGH - LOW);
}
/** Bars get shorter as they get higher, which is most of a vibraphone's shape. */
function barLength(midi: number): number {
  return 0.255 - 0.115 * barT(midi);
}

class Hit {
  beat = -1e9;
  force = 0;
  fire(now: number, force: number): void {
    this.beat = now;
    this.force = force < 0 ? 0 : force > 1 ? 1 : force;
  }
  wobble(now: number, tau: number, hz: number): number {
    const age = now - this.beat;
    if (age < 0 || age > tau * 6) return 0;
    return this.force * Math.exp(-age / tau) * Math.cos(age * Math.PI * 2 * hz);
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

export const buildMallets: InstrumentBuilder = (opts) => {
  const rng = new Rng(`mallets:${opts.seed}`);
  const root = new Group();
  root.name = 'mallets';

  const frameColour = opts.finish ?? rng.pick(['#2a2c30', '#1d1f22', '#3a2a1c']);
  const frameMat = new MeshStandardMaterial({ color: frameColour, roughness: 0.5, metalness: 0.3 });
  const barMat = new MeshStandardMaterial({ color: '#cfd6dc', roughness: 0.26, metalness: 0.82 });
  const sharpMat = new MeshStandardMaterial({ color: '#b9c2ca', roughness: 0.26, metalness: 0.82 });
  const tubeMat = new MeshStandardMaterial({ color: '#9aa4ad', roughness: 0.35, metalness: 0.7 });
  const discMat = new MeshStandardMaterial({ color: '#d8dde2', roughness: 0.3, metalness: 0.75 });
  const feltMat = new MeshStandardMaterial({ color: '#6d2029', roughness: 0.95, metalness: 0 });
  const cordMat = new MeshStandardMaterial({ color: '#22242a', roughness: 0.9, metalness: 0 });

  const naturals: number[] = [];
  const sharps: number[] = [];
  for (let m = LOW; m <= HIGH; m++) (BLACK[m % 12]! ? sharps : naturals).push(m);

  // --- Bars ----------------------------------------------------------------

  /**
   * Unit bars, stretched per instance. One geometry for the whole natural row
   * and one for the sharps; the length taper lives entirely in the matrices.
   */
  const naturalGeo = new BoxGeometry(NATURAL_W, 0.014, 1);
  const sharpGeo = new BoxGeometry(SHARP_W, 0.014, 1);
  const naturalMesh = addTo(root, new InstancedMesh(naturalGeo, barMat, naturals.length));
  const sharpMesh = addTo(root, new InstancedMesh(sharpGeo, sharpMat, sharps.length));
  naturalMesh.name = 'bars:natural';
  sharpMesh.name = 'bars:sharp';
  naturalMesh.castShadow = true;
  sharpMesh.castShadow = true;

  interface Bar { mesh: InstancedMesh; slot: number; home: Vector3; len: number; hit: Hit }
  const bars = new Map<number, Bar>();
  const scratch = new Matrix4();
  const noRot = new Quaternion();

  function seat(mesh: InstancedMesh, list: number[], y: number, z: number): void {
    list.forEach((midi, slot) => {
      const len = barLength(midi);
      const home = new Vector3(barX(midi), y, z);
      scratch.compose(home, noRot, new Vector3(1, 1, len));
      mesh.setMatrixAt(slot, scratch);
      bars.set(midi, { mesh, slot, home, len, hit: new Hit() });
    });
    mesh.instanceMatrix.needsUpdate = true;
  }
  seat(naturalMesh, naturals, NATURAL_Y - 0.007, NATURAL_Z);
  seat(sharpMesh, sharps, SHARP_Y - 0.007, SHARP_Z);

  // --- Resonators ----------------------------------------------------------

  /**
   * A tube under every bar, tuned by length — which is why the row looks like
   * a pipe organ lying on its back and why a vibraphone reads as a vibraphone
   * from the side rather than only from above.
   */
  const tubeGeo = new CylinderGeometry(0.024, 0.024, 1, 10, 1, true);
  tubeGeo.translate(0, -0.5, 0);   // hang from the top
  function resonators(list: number[], topY: number, z: number): InstancedMesh {
    const mesh = addTo(root, new InstancedMesh(tubeGeo, tubeMat, list.length));
    list.forEach((midi, i) => {
      const len = Math.max(0.055, 0.50 * Math.pow(2, -(midi - LOW) / 12));
      scratch.compose(new Vector3(barX(midi), topY, z), noRot, new Vector3(1, len, 1));
      mesh.setMatrixAt(i, scratch);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    return mesh;
  }
  resonators(naturals, NATURAL_Y - 0.055, NATURAL_Z);
  resonators(sharps, SHARP_Y - 0.055, SHARP_Z);

  // --- Rotating discs ------------------------------------------------------

  /**
   * The motor. Two shafts, a disc at the mouth of every resonator, turning
   * whether or not anybody is playing. This is the only part of any model in
   * this family that moves without being struck, and it is worth the two
   * instanced meshes on its own.
   */
  const discGeo = new CylinderGeometry(0.023, 0.023, 0.0025, 10);
  const shafts: Group[] = [];
  function discRow(list: number[], y: number, z: number): void {
    const shaft = addTo(root, new Group());
    shaft.position.set(0, y, z);
    const mesh = addTo(shaft, new InstancedMesh(discGeo, discMat, list.length));
    list.forEach((midi, i) => {
      scratch.makeTranslation(barX(midi), 0, 0);
      mesh.setMatrixAt(i, scratch);
    });
    mesh.instanceMatrix.needsUpdate = true;
    const rod = addTo(shaft, new Mesh(new CylinderGeometry(0.005, 0.005, ROW_W + 0.12, 6), frameMat));
    rod.rotation.z = Math.PI / 2;
    shafts.push(shaft);
  }
  discRow(naturals, NATURAL_Y - 0.048, NATURAL_Z);
  discRow(sharps, SHARP_Y - 0.048, SHARP_Z);
  /** Cycles per beat. Slow enough to read as a wobble rather than as a strobe. */
  const DISC_RATE = rng.float(0.55, 0.85);

  // --- Damper --------------------------------------------------------------

  /**
   * The felt bar that sits against the naturals until the pedal drops it. Every
   * strike drops it, which is not strictly what a player does but is exactly
   * what the audience sees happen when the instrument starts ringing.
   */
  const damper = addTo(root, new Group());
  damper.position.set(0, NATURAL_Y - 0.045, NATURAL_Z - 0.09);
  addTo(damper, new Mesh(new BoxGeometry(ROW_W + 0.04, 0.016, 0.030), frameMat));
  const damperFelt = addTo(damper, new Mesh(new BoxGeometry(ROW_W + 0.04, 0.012, 0.034), feltMat));
  damperFelt.position.y = 0.013;
  const damperHit = new Hit();
  const DAMPER_UP = NATURAL_Y - 0.045;

  // --- Frame ---------------------------------------------------------------

  const railGeo = new CylinderGeometry(0.014, 0.014, 1, 8);
  function rail(a: Vector3, b: Vector3): void {
    const mesh = addTo(root, new Mesh(railGeo, frameMat));
    const dir = b.clone().sub(a);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.scale.set(1, Math.max(dir.length(), 1e-4), 1);
    mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
    mesh.castShadow = true;
  }
  const halfW = ROW_W / 2 + 0.05;
  for (const s of [1, -1]) {
    // End frames: an upright at each corner and a foot rail joining them.
    rail(new Vector3(s * halfW, 0.02, NATURAL_Z - 0.14), new Vector3(s * halfW, NATURAL_Y, NATURAL_Z - 0.14));
    rail(new Vector3(s * halfW, 0.02, SHARP_Z + 0.14), new Vector3(s * halfW, SHARP_Y, SHARP_Z + 0.14));
    rail(new Vector3(s * halfW, 0.02, NATURAL_Z - 0.14), new Vector3(s * halfW, 0.02, SHARP_Z + 0.14));
    rail(new Vector3(s * halfW, NATURAL_Y, NATURAL_Z - 0.14), new Vector3(s * halfW, SHARP_Y, SHARP_Z + 0.14));
  }
  rail(new Vector3(halfW, NATURAL_Y - 0.01, NATURAL_Z - 0.14), new Vector3(-halfW, NATURAL_Y - 0.01, NATURAL_Z - 0.14));
  rail(new Vector3(halfW, SHARP_Y - 0.01, SHARP_Z + 0.14), new Vector3(-halfW, SHARP_Y - 0.01, SHARP_Z + 0.14));
  rail(new Vector3(halfW, 0.06, 0), new Vector3(-halfW, 0.06, 0));

  // The suspension cord the bars hang on, at their nodes. Two thin lines, and
  // they are what stop the bars looking like they are floating.
  for (const [y, z] of [[NATURAL_Y - 0.012, NATURAL_Z], [SHARP_Y - 0.012, SHARP_Z]] as const) {
    for (const off of [-0.075, 0.075]) {
      const cord = addTo(root, new Mesh(new BoxGeometry(ROW_W + 0.06, 0.003, 0.003), cordMat));
      cord.position.set(0, y, z + off);
    }
  }

  // Pedal, at the player's feet. Nothing resolves against it — the archetype
  // declares only `key` and `rest` — but it is what the damper is attached to.
  const pedal = addTo(root, new Mesh(new BoxGeometry(0.16, 0.02, 0.16), frameMat));
  pedal.position.set(0, 0.06, NATURAL_Z - 0.30);
  pedal.castShadow = true;
  rail(new Vector3(0, 0.07, NATURAL_Z - 0.24), new Vector3(0, NATURAL_Y - 0.10, NATURAL_Z - 0.14));

  const moving = new Set<Bar>();
  const UP = new Vector3(0, 1, 0);
  /**
   * Knuckles across the row, so a mallet lies along the bar rather than across
   * it. Same axis and same reason as every keyboard here; see `grand-piano.ts`.
   */
  const ACROSS = new Vector3(1, 0, 0);
  const scale = new Vector3();

  const model: InstrumentModel = {
    archetype: 'mallets',
    root,

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        // Mallets held over the middle of the naturals.
        return {
          position: new Vector3(0, NATURAL_Y + 0.10, NATURAL_Z),
          normal: UP.clone(),
          along: ACROSS.clone(),
        };
      }
      if (point.kind !== 'key') return undefined;
      const midi = point.midi;
      if (midi < LOW || midi > HIGH || !Number.isInteger(midi)) return undefined;
      const black = BLACK[midi % 12]!;
      // The centre of the bar, which is where a player aims and where the bar
      // actually speaks. The ends are nodes and sound dead.
      return {
        position: new Vector3(barX(midi), black ? SHARP_Y : NATURAL_Y, black ? SHARP_Z : NATURAL_Z),
        normal: UP.clone(),
        along: ACROSS.clone(),
      };
    },

    react(point: PlayPoint, force: number, now: number): void {
      if (point.kind !== 'key') return;
      const bar = bars.get(point.midi);
      if (!bar) return;
      bar.hit.fire(now, force);
      moving.add(bar);
      damperHit.fire(now, force);
    },

    update(now: number): void {
      // The discs, always.
      const angle = now * DISC_RATE * Math.PI * 2;
      for (const shaft of shafts) shaft.rotation.x = angle;

      if (moving.size > 0) {
        let naturalDirty = false;
        let sharpDirty = false;
        for (const bar of moving) {
          // A struck bar rings: it dips and then oscillates about its rest
          // height for a good deal longer than a drum head does.
          const d = bar.hit.wobble(now, 1.1, 2.4) * 0.0055;
          scale.set(1, 1, bar.len);
          scratch.compose(
            new Vector3(bar.home.x, bar.home.y - d, bar.home.z), noRot, scale,
          );
          bar.mesh.setMatrixAt(bar.slot, scratch);
          if (bar.mesh === naturalMesh) naturalDirty = true; else sharpDirty = true;
          if (Math.abs(d) < 1e-5 && now - bar.hit.beat > 1.1) moving.delete(bar);
        }
        if (naturalDirty) naturalMesh.instanceMatrix.needsUpdate = true;
        if (sharpDirty) sharpMesh.instanceMatrix.needsUpdate = true;
      }

      damper.position.y = DAMPER_UP - 0.035 * damperHit.level(now, 0.9);
    },

    station: { offset: new Vector3(0, 0, NATURAL_Z - 0.48), facing: 0, posture: 'stand' },

    dispose(): void {
      disposeTree(root);
    },
  };

  return model;
};
