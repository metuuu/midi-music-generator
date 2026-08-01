/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The electric piano — a Rhodes/Wurlitzer silhouette on a stand.
 *
 * Three catalogue entries land here (`epiano1`, `epiano2`, `celesta`), and what
 * they have in common is not the sound but the *shape*: a slab with a lid,
 * standing on four splayed legs at playing height, with the player on their
 * feet behind it. That silhouette is the whole job — at stage distance a
 * suitcase Rhodes is a wedge with a red stripe, and getting the wedge and the
 * stripe right is worth more than any amount of detail nobody can see.
 *
 * Key layout, pitch direction and the reason for it are the same as the grand:
 * bass under the player's left hand at `+x`, treble toward `-x`. See
 * `grand-piano.ts` for the argument.
 */

import {
  BoxGeometry, BufferGeometry, CylinderGeometry, Group, InstancedMesh, Material,
  Matrix4, Mesh, MeshStandardMaterial, Object3D, Quaternion, Vector3,
} from 'three';

import type { GestureKind, PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import {
  addTo, type Contact, type InstrumentBuilder, type InstrumentModel,
} from './types.js';

const BLACK = [false, true, false, true, false, false, true, false, true, false, true, false];
const WHITE_AT = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];

/** E1..G7 — the 76-note board `ARCHETYPES['electric-piano']` declares. */
const LOW = 28;
const HIGH = 103;

const WHITE_W = 0.0235;
const WHITE_L = 0.150;
const BLACK_W = 0.0110;
const BLACK_L = 0.095;
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

const KEY_BACK_Z = -0.06;
const KEY_TOP_Y = 0.95;   // the archetype's workHeight
const BLACK_TOP_Y = KEY_TOP_Y + 0.010;
const WHITE_TOUCH_Z = KEY_BACK_Z - 0.100;
const BLACK_TOUCH_Z = KEY_BACK_Z - 0.058;

/**
 * How long a re-struck key spends letting go and falling again, in beats, and
 * how far up it gets in that time as a fraction of full travel.
 */
const REBOUND = 0.14;
const REBOUND_LIFT = 0.85;

class Hit {
  beat = -1e9;
  force = 0;
  /**
   * How long the finger stays on it, in beats.
   *
   * A key is not a drum head. The old envelope started decaying on the instant
   * of the note, so a four-beat pad chord had its keys back up within half a
   * beat while the hand that was holding them down stayed where it was — a
   * player pressing keys that are not there. `hold` is the gesture's own
   * follow-through, so the key is down for exactly as long as the hand is on
   * it and the spring only has to bring it back afterwards.
   */
  hold = 0;
  /**
   * How long this press spends coming back up before it falls again, in beats.
   *
   * Non-zero only when the note repeated — when the press landed on a key that
   * `hold` was still holding down. A repeated note is not one long note, and
   * pinning the key at full depth across the re-strike turned a bar of the same
   * quaver into a player leaning on one key. The key has to be seen letting go.
   */
  rebound = 0;
  fire(now: number, force: number, hold = 0): void {
    const stillDown = now - this.beat < this.hold;
    this.beat = now;
    this.force = force < 0 ? 0 : force > 1 ? 1 : force;
    this.hold = Number.isFinite(hold) && hold > 0 ? hold : 0;
    // Never longer than half the note it belongs to, or a run of short repeats
    // would be all lift and no key.
    this.rebound = stillDown ? Math.min(REBOUND, this.hold * 0.45) : 0;
  }
  level(now: number, tau: number): number {
    const age = now - this.beat;
    if (age < 0) return 0;
    // Up and back down again, landing at full depth exactly as the lift ends.
    if (age < this.rebound) {
      return 1 - REBOUND_LIFT * Math.sin(Math.PI * age / this.rebound);
    }
    // Held all the way down, then released. `tau` is the return spring alone.
    if (age <= this.hold) return 1;
    const off = age - this.hold;
    return off > tau * 6 ? 0 : Math.exp(-off / tau);
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

export const buildElectricPiano: InstrumentBuilder = (opts) => {
  const rng = new Rng(`electric-piano:${opts.seed}`);
  const root = new Group();
  root.name = 'electric-piano';

  // `scale` runs from a light Wurlitzer to a suitcase Rhodes. It changes the
  // case, never the keys — the keybed is the one thing `resolve` reads.
  const heft = opts.scale ?? 0.6;
  const caseDepth = 0.40 + heft * 0.10;
  const caseColour = opts.finish ?? rng.pick(['#20232a', '#1b1b1d', '#2b2118', '#33383f']);
  const accent = rng.pick(['#b8352c', '#c2622a', '#2f6fa8', '#c9a23f']);

  const caseMat = new MeshStandardMaterial({ color: caseColour, roughness: 0.72, metalness: 0.05 });
  const railMat = new MeshStandardMaterial({ color: accent, roughness: 0.5, metalness: 0.1 });
  const ivoryMat = new MeshStandardMaterial({ color: '#f0ece0', roughness: 0.46, metalness: 0 });
  const ebonyMat = new MeshStandardMaterial({ color: '#16161a', roughness: 0.4, metalness: 0 });
  const chromeMat = new MeshStandardMaterial({ color: '#c6ccd4', roughness: 0.28, metalness: 0.9 });
  const lampMat = new MeshStandardMaterial({
    color: '#3a0d0b', emissive: '#ff3b2e', emissiveIntensity: 0.5, roughness: 0.4,
  });

  // --- Case ----------------------------------------------------------------

  const shellW = BOARD_W + 0.10;
  const backZ = KEY_BACK_Z + caseDepth - 0.16;

  // The keybed tray the keys sit in.
  const tray = addTo(root, new Mesh(new BoxGeometry(shellW, 0.14, WHITE_L + 0.10), caseMat));
  tray.position.set(0, KEY_TOP_Y - 0.08, KEY_BACK_Z - WHITE_L / 2 - 0.02);
  tray.castShadow = true;
  tray.receiveShadow = true;

  // The lid, sloping up and away — the wedge that says "electric piano".
  const lid = addTo(root, new Group());
  lid.position.set(0, KEY_TOP_Y + 0.015, KEY_BACK_Z + 0.01);
  lid.rotation.x = -0.30;
  const lidSlab = addTo(lid, new Mesh(new BoxGeometry(shellW, 0.055, caseDepth - 0.10), caseMat));
  lidSlab.position.z = (caseDepth - 0.10) / 2;
  lidSlab.castShadow = true;

  // Name rail: the one loud colour, and the thing the eye picks the model out by.
  const rail = addTo(root, new Mesh(new BoxGeometry(shellW, 0.045, 0.028), railMat));
  rail.position.set(0, KEY_TOP_Y + 0.032, KEY_BACK_Z + 0.005);
  rail.castShadow = true;

  const lamp = addTo(root, new Mesh(new CylinderGeometry(0.009, 0.009, 0.012, 8), lampMat));
  lamp.rotation.x = Math.PI / 2;
  lamp.position.set(shellW / 2 - 0.06, KEY_TOP_Y + 0.032, KEY_BACK_Z - 0.010);

  // Cheeks, so the keybed has ends rather than trailing off.
  for (const side of [1, -1]) {
    const cheek = addTo(root, new Mesh(new BoxGeometry(0.045, 0.085, WHITE_L + 0.08), caseMat));
    cheek.position.set(side * (shellW / 2 - 0.022), KEY_TOP_Y + 0.014, KEY_BACK_Z - WHITE_L / 2 - 0.02);
    cheek.castShadow = true;
  }

  // --- Stand ---------------------------------------------------------------

  const legGeo = new CylinderGeometry(0.017, 0.017, 1, 8);
  const braceGeo = new CylinderGeometry(0.013, 0.013, 1, 6);
  function tube(geo: BufferGeometry, a: Vector3, b: Vector3): void {
    const mesh = addTo(root, new Mesh(geo, chromeMat));
    const dir = b.clone().sub(a);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.scale.set(1, Math.max(dir.length(), 1e-4), 1);
    mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
  }
  const top = KEY_TOP_Y - 0.15;
  for (const sx of [1, -1]) {
    for (const sz of [1, -1]) {
      const x = sx * (shellW / 2 - 0.10);
      const z = KEY_BACK_Z - 0.08 + sz * 0.14;
      tube(legGeo, new Vector3(x, top, z), new Vector3(x + sx * 0.13, 0.01, z + sz * 0.10));
    }
  }
  for (const sx of [1, -1]) {
    const x = sx * (shellW / 2 - 0.10);
    tube(braceGeo, new Vector3(x + sx * 0.12, 0.30, KEY_BACK_Z - 0.20),
      new Vector3(x + sx * 0.12, 0.30, KEY_BACK_Z + 0.06));
  }
  tube(braceGeo, new Vector3(shellW / 2 - 0.10, top, KEY_BACK_Z - 0.08),
    new Vector3(-(shellW / 2 - 0.10), top, KEY_BACK_Z - 0.08));

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
  whiteMesh.name = 'keys:white';
  blackMesh.name = 'keys:black';
  whiteMesh.receiveShadow = true;
  blackMesh.castShadow = true;

  interface Key { mesh: InstancedMesh; slot: number; pivot: Vector3; hit: Hit }
  const keys = new Map<number, Key>();
  const scratch = new Matrix4();
  const quat = new Quaternion();
  const one = new Vector3(1, 1, 1);
  const axis = new Vector3(1, 0, 0);

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
  const KEY_DIP = 0.055;
  const lampHit = new Hit();

  const UP = new Vector3(0, 1, 0);
  /** Knuckles across the keyboard. The argument is in `grand-piano.ts`. */
  const ACROSS = new Vector3(1, 0, 0);

  const model: InstrumentModel = {
    archetype: 'electric-piano',
    root,

    /**
     * Under the back edge of the keybed tray, off to one side — which is where
     * a Rhodes' output actually is, and the only part of this case a lead could
     * leave from without coming out of the lid.
     */
    outlet: new Vector3(shellW * 0.30, KEY_TOP_Y - 0.15, KEY_BACK_Z - 0.02),

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        return {
          position: new Vector3(0, KEY_TOP_Y + 0.09, WHITE_TOUCH_Z),
          normal: UP.clone(),
          along: ACROSS.clone(),
        };
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
        along: ACROSS.clone(),
      };
    },

    react(
      point: PlayPoint, force: number, now: number,
      _kind?: GestureKind, hold?: number,
    ): void {
      if (point.kind !== 'key') return;
      const key = keys.get(point.midi);
      if (!key) return;
      key.hit.fire(now, force, hold);
      moving.add(key);
      lampHit.fire(now, force);
    },

    update(now: number): void {
      if (moving.size > 0) {
        let whiteDirty = false;
        let blackDirty = false;
        for (const key of moving) {
          const env = key.hit.level(now, 0.18);
          const dip = KEY_DIP * (0.55 + 0.45 * key.hit.force) * env;
          quat.setFromAxisAngle(axis, -dip);
          scratch.compose(key.pivot, quat, one);
          key.mesh.setMatrixAt(key.slot, scratch);
          if (key.mesh === whiteMesh) whiteDirty = true; else blackDirty = true;
          if (env < 0.02) moving.delete(key);
        }
        if (whiteDirty) whiteMesh.instanceMatrix.needsUpdate = true;
        if (blackDirty) blackMesh.instanceMatrix.needsUpdate = true;
      }
      // The power lamp swells with the playing. One emissive number, and it is
      // the difference between a switched-on instrument and a piece of furniture.
      lampMat.emissiveIntensity = 0.45 + 0.9 * lampHit.force * lampHit.level(now, 0.6);
    },

    station: { offset: new Vector3(0, 0, KEY_BACK_Z - WHITE_L - 0.28), facing: 0, posture: 'stand' },

    dispose(): void {
      disposeTree(root);
    },
  };

  return model;
};
