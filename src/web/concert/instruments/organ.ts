/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The organ — two manuals, drawbars, and a pedalboard because the range says so.
 *
 * `ARCHETYPES.organ` reaches down to MIDI 24 while noting that "the manuals
 * stop at C2". That is not a rounding error in the table, it is the shape of
 * the instrument: an organist has feet, and the bottom octave of an organ part
 * is played with them. So this model splits the declared range in two and the
 * split is part of the contract:
 *
 *   - **24..35** → the pedalboard, played by a foot.
 *   - **36..96** → the manuals, played by a hand.
 *
 * And the manuals split again, at middle C: below it the lower manual, at and
 * above it the upper. A Hammond player comps with the left hand on the lower
 * manual and takes the line on the upper, so a two-handed part naturally lands
 * on two keyboards — which is the entire reason to build two of them.
 *
 * Pitch runs bass-to-treble from `+x` to `-x` on every keyboard here, for the
 * reason argued in `grand-piano.ts`.
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

function whiteIndex(midi: number): number {
  return Math.floor(midi / 12) * 7 + WHITE_AT[midi % 12]!;
}

/** The whole declared range. */
const LOW = 24;
const HIGH = 96;
/** Where the feet stop and the hands start. */
const MANUAL_LOW = 36;
/** Where the lower manual stops and the upper begins. */
const MANUAL_SPLIT = 60;

// --- Manual geometry (61 notes, C2..C7) ---
const M_WHITE_W = 0.0225;
const M_WHITE_L = 0.135;
const M_BLACK_W = 0.0105;
const M_BLACK_L = 0.086;
const M_WHITE_H = 0.017;
const M_BLACK_H = 0.014;
const M_WHITES = whiteIndex(HIGH) - whiteIndex(MANUAL_LOW) + 1;
const M_BOARD_W = M_WHITES * M_WHITE_W;

// --- Pedalboard geometry (12 notes, C1..B1) ---
const P_WHITE_W = 0.055;
const P_WHITES = whiteIndex(35) - whiteIndex(LOW) + 1;
const P_BOARD_W = P_WHITES * P_WHITE_W;
const P_NATURAL_Y = 0.095;
const P_SHARP_Y = 0.165;
/**
 * Where a foot lands on a pedal key, and it has to be *on* one.
 *
 * The naturals run from `-0.54` to `-0.14` and the sharps from `-0.46` to
 * `-0.26`; these used to say -0.60 and -0.53, which is off the end of both —
 * six centimetres of daylight between the shoe and the pedalboard, against the
 * toe rail. Near the front of the key, where a foot goes, and no further.
 */
const P_NATURAL_Z = -0.47;
const P_SHARP_Z = -0.40;

/** How far downstage the whole console sits from the reserved centre. */
const Z_SHIFT = 0.22;

/** Lower manual, then upper: back edge (the pivot) and key-top height. */
const MANUALS = [
  { backZ: -0.32, whiteY: 0.735 },
  { backZ: -0.20, whiteY: 0.825 },
] as const;

function manualU(midi: number): number {
  const i = whiteIndex(midi) - whiteIndex(MANUAL_LOW);
  return BLACK[midi % 12]! ? (i + 1) * M_WHITE_W : (i + 0.5) * M_WHITE_W;
}
function manualX(midi: number): number {
  return M_BOARD_W / 2 - manualU(midi);
}
function pedalX(midi: number): number {
  const i = whiteIndex(midi) - whiteIndex(LOW);
  const u = BLACK[midi % 12]! ? (i + 1) * P_WHITE_W : (i + 0.5) * P_WHITE_W;
  return P_BOARD_W / 2 - u;
}

/**
 * How long a re-struck key spends letting go and falling again, in beats, and
 * how far up it gets in that time as a fraction of full travel. Slower than the
 * hammer keyboards: a manual is a switch with a soft spring under it.
 */
const REBOUND = 0.18;
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

export const buildOrgan: InstrumentBuilder = (opts) => {
  const rng = new Rng(`organ:${opts.seed}`);
  const root = new Group();
  root.name = 'organ';

  /**
   * A console, a bench and a pedalboard are a metre and a quarter of stage from
   * front to back, and the archetype reserves a one-metre radius. Everything is
   * therefore built around the *console* — which is what the numbers below read
   * as — and then shifted downstage as a whole so the assembly is centred on
   * the origin the stager reserves around. `resolve` adds the same shift.
   */
  const rig = addTo(root, new Group());
  rig.position.z = Z_SHIFT;

  const woodColour = opts.finish ?? rng.pick(['#4a3121', '#3a2618', '#5a4028', '#2c2018']);
  const woodMat = new MeshStandardMaterial({ color: woodColour, roughness: 0.55, metalness: 0.05 });
  const darkMat = new MeshStandardMaterial({ color: '#1b1a1c', roughness: 0.7, metalness: 0.05 });
  // A Hammond has the colours the other way round from a piano, and that
  // inversion is most of what makes it recognisable from across a room.
  const naturalMat = new MeshStandardMaterial({ color: '#efe9db', roughness: 0.45, metalness: 0 });
  const sharpMat = new MeshStandardMaterial({ color: '#191a1d', roughness: 0.4, metalness: 0 });
  const chromeMat = new MeshStandardMaterial({ color: '#c3c9d1', roughness: 0.3, metalness: 0.88 });
  const lampMat = new MeshStandardMaterial({
    color: '#3b2a05', emissive: '#ffb43a', emissiveIntensity: 0.6, roughness: 0.4,
  });
  const barMats = {
    brown: new MeshStandardMaterial({ color: '#6f4423', roughness: 0.45, metalness: 0.2 }),
    white: new MeshStandardMaterial({ color: '#e6e0d2', roughness: 0.45, metalness: 0.2 }),
    black: new MeshStandardMaterial({ color: '#191a1d', roughness: 0.45, metalness: 0.2 }),
  };

  // --- Console -------------------------------------------------------------

  /**
   * The body, stopping **below the lower manual**.
   *
   * It used to be 0.44 tall with its top at 0.78, and the lower manual plays at
   * 0.735: twenty-four of the seventy-three keys this model owns were inside
   * the console, and from the front the lower keyboard simply was not there.
   * A Hammond is a box with two keyboards cantilevered off the front of it and
   * a knee well underneath — nothing solid reaches the height of the keys.
   */
  const consoleW = M_BOARD_W + 0.14;
  const shell = addTo(rig, new Mesh(new BoxGeometry(consoleW, 0.36, 0.62), woodMat));
  shell.position.set(0, 0.52, -0.14);
  shell.castShadow = true;
  shell.receiveShadow = true;

  /**
   * The step between the manuals: what the upper one stands on, set back far
   * enough that it is behind the lower one's keys rather than over them.
   */
  const riser = addTo(rig, new Mesh(new BoxGeometry(consoleW, 0.11, 0.44), woodMat));
  riser.position.set(0, 0.745, -0.04);
  riser.castShadow = true;

  // The tall back, which carries the drawbars and hides the works.
  const back = addTo(rig, new Mesh(new BoxGeometry(consoleW, 0.30, 0.16), woodMat));
  back.position.set(0, 0.90, 0.09);
  back.castShadow = true;

  for (const side of [1, -1]) {
    const cheek = addTo(rig, new Mesh(new BoxGeometry(0.07, 0.30, 0.50), woodMat));
    cheek.position.set(side * (consoleW / 2 - 0.032), 0.86, -0.18);
    cheek.castShadow = true;
  }

  const legGeo = new CylinderGeometry(0.032, 0.038, 0.36, 8);
  for (const [x, z] of [[0.42, -0.38], [-0.42, -0.38], [0.42, 0.12], [-0.42, 0.12]] as const) {
    const leg = addTo(rig, new Mesh(legGeo, woodMat));
    leg.position.set(x, 0.18, z);
    leg.castShadow = true;
  }

  // --- Drawbars ------------------------------------------------------------

  /**
   * Two banks of nine, in the Hammond colours. They do not move — an organist
   * sets a registration and leaves it — but they are the single most
   * recognisable thing on the instrument and cost three draw calls.
   */
  const PATTERN = ['brown', 'brown', 'white', 'white', 'black', 'white', 'black', 'black', 'white'] as const;
  const barGeo = new BoxGeometry(0.020, 0.016, 0.075);
  const barSlots: Record<'brown' | 'white' | 'black', Matrix4[]> = { brown: [], white: [], black: [] };
  const barQuat = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -0.55);
  for (let bank = 0; bank < 2; bank++) {
    for (let i = 0; i < 9; i++) {
      const colour = PATTERN[i]!;
      const x = (bank === 0 ? 0.30 : -0.02) - i * 0.026;
      const out = rng.float(0.0, 0.030);   // registration: cosmetic, never resolved
      const m = new Matrix4().compose(
        new Vector3(x, 0.945 + out * 0.28, 0.055 - out),
        barQuat, new Vector3(1, 1, 1),
      );
      barSlots[colour].push(m);
    }
  }
  for (const colour of ['brown', 'white', 'black'] as const) {
    const list = barSlots[colour];
    const mesh = addTo(rig, new InstancedMesh(barGeo, barMats[colour], list.length));
    list.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  }

  const lamp = addTo(rig, new Mesh(new CylinderGeometry(0.011, 0.011, 0.014, 8), lampMat));
  lamp.rotation.x = Math.PI / 2;
  lamp.position.set(-consoleW / 2 + 0.07, 0.955, -0.005);

  // --- Manuals -------------------------------------------------------------

  const naturalGeo = new BoxGeometry(M_WHITE_W * 0.94, M_WHITE_H, M_WHITE_L);
  naturalGeo.translate(0, -M_WHITE_H / 2, -M_WHITE_L / 2);
  const sharpGeo = new BoxGeometry(M_BLACK_W, M_BLACK_H, M_BLACK_L);
  sharpGeo.translate(0, -M_BLACK_H / 2, -M_BLACK_L / 2);

  interface Key { mesh: InstancedMesh; slot: number; pivot: Vector3; hit: Hit }
  const keys = new Map<number, Key>();
  const dirty = new Set<InstancedMesh>();
  const scratch = new Matrix4();
  const quat = new Quaternion();
  const one = new Vector3(1, 1, 1);
  const xAxis = new Vector3(1, 0, 0);

  const allNaturals: number[] = [];
  const allSharps: number[] = [];
  for (let midi = MANUAL_LOW; midi <= HIGH; midi++) {
    (BLACK[midi % 12]! ? allSharps : allNaturals).push(midi);
  }

  for (let m = 0; m < 2; m++) {
    const spec = MANUALS[m]!;
    // **Both manuals carry all 61 keys.** The split decides which one *moves*
    // for a given note, not which one exists — a keyboard with the top half
    // missing is a bug you can see from the back of the room.
    const nMesh = addTo(rig, new InstancedMesh(naturalGeo, naturalMat, allNaturals.length));
    const sMesh = addTo(rig, new InstancedMesh(sharpGeo, sharpMat, allSharps.length));
    nMesh.name = `keys:manual${m}-natural`;
    sMesh.name = `keys:manual${m}-sharp`;
    nMesh.receiveShadow = true;
    sMesh.castShadow = true;

    const owns = (midi: number): boolean => (midi < MANUAL_SPLIT) === (m === 0);
    allNaturals.forEach((midi, slot) => {
      const pivot = new Vector3(manualX(midi), spec.whiteY, spec.backZ);
      scratch.makeTranslation(pivot.x, pivot.y, pivot.z);
      nMesh.setMatrixAt(slot, scratch);
      if (owns(midi)) keys.set(midi, { mesh: nMesh, slot, pivot, hit: new Hit() });
    });
    allSharps.forEach((midi, slot) => {
      const pivot = new Vector3(manualX(midi), spec.whiteY + 0.010, spec.backZ);
      scratch.makeTranslation(pivot.x, pivot.y, pivot.z);
      sMesh.setMatrixAt(slot, scratch);
      if (owns(midi)) keys.set(midi, { mesh: sMesh, slot, pivot, hit: new Hit() });
    });
    nMesh.instanceMatrix.needsUpdate = true;
    sMesh.instanceMatrix.needsUpdate = true;

    // The shelf each manual sits on, so they read as two keyboards and not as
    // one keyboard drawn twice.
    const ledge = addTo(rig, new Mesh(new BoxGeometry(consoleW, 0.05, 0.06), woodMat));
    ledge.position.set(0, spec.whiteY - 0.006, spec.backZ + 0.045);
    ledge.castShadow = true;
  }

  // --- Pedalboard ----------------------------------------------------------

  const pedalNaturalGeo = new BoxGeometry(P_WHITE_W * 0.8, 0.03, 0.40);
  pedalNaturalGeo.translate(0, -0.015, -0.20);
  const pedalSharpGeo = new BoxGeometry(0.028, 0.032, 0.20);
  pedalSharpGeo.translate(0, -0.016, -0.10);

  const pedalNaturals: number[] = [];
  const pedalSharps: number[] = [];
  for (let midi = LOW; midi < MANUAL_LOW; midi++) {
    (BLACK[midi % 12]! ? pedalSharps : pedalNaturals).push(midi);
  }
  const pnMesh = addTo(rig, new InstancedMesh(pedalNaturalGeo, naturalMat, pedalNaturals.length));
  const psMesh = addTo(rig, new InstancedMesh(pedalSharpGeo, sharpMat, pedalSharps.length));
  pnMesh.name = 'keys:pedal-natural';
  psMesh.name = 'keys:pedal-sharp';
  pnMesh.receiveShadow = true;
  psMesh.castShadow = true;
  pedalNaturals.forEach((midi, slot) => {
    const pivot = new Vector3(pedalX(midi), P_NATURAL_Y, -0.34);
    scratch.makeTranslation(pivot.x, pivot.y, pivot.z);
    pnMesh.setMatrixAt(slot, scratch);
    keys.set(midi, { mesh: pnMesh, slot, pivot, hit: new Hit() });
  });
  pedalSharps.forEach((midi, slot) => {
    const pivot = new Vector3(pedalX(midi), P_SHARP_Y, -0.36);
    scratch.makeTranslation(pivot.x, pivot.y, pivot.z);
    psMesh.setMatrixAt(slot, scratch);
    keys.set(midi, { mesh: psMesh, slot, pivot, hit: new Hit() });
  });
  pnMesh.instanceMatrix.needsUpdate = true;
  psMesh.instanceMatrix.needsUpdate = true;

  // --- Bench ---------------------------------------------------------------

  /**
   * Top at 0.45, because that is where a `sit` player's seat is — see the same
   * correction, and the same argument, on the grand's bench. An organ bench is
   * lower than a piano bench in any case: the feet have a pedalboard to work.
   */
  const bench = addTo(rig, new Mesh(new BoxGeometry(0.66, 0.06, 0.26), woodMat));
  bench.position.set(0, 0.42, -0.96);
  bench.castShadow = true;
  for (const side of [1, -1]) {
    const cheek = addTo(rig, new Mesh(new BoxGeometry(0.035, 0.40, 0.22), woodMat));
    cheek.position.set(side * 0.29, 0.20, -0.96);
  }
  // A rail across the front of the pedalboard, which is what stops a foot.
  const rail = addTo(rig, new Mesh(new BoxGeometry(P_BOARD_W + 0.06, 0.05, 0.03), darkMat));
  rail.position.set(0, 0.06, -0.755);

  const moving = new Set<Key>();
  const lampHit = new Hit();
  const UP = new Vector3(0, 1, 0);
  /**
   * Knuckles across the keyboard, and toes across the pedalboard. See the same
   * axis in `grand-piano.ts` for why the roll about the normal is not something
   * to leave to the fallback.
   */
  const ACROSS = new Vector3(1, 0, 0);

  /**
   * The stop tabs above the drawbars, purely so the console has a face. Chrome
   * because at this distance chrome is the only thing that reads.
   */
  const tabGeo = new BoxGeometry(0.03, 0.012, 0.03);
  const tabs = addTo(rig, new InstancedMesh(tabGeo, chromeMat, 8));
  for (let i = 0; i < 8; i++) {
    scratch.makeTranslation(-0.34 - i * 0.036, 0.955, 0.02);
    tabs.setMatrixAt(i, scratch);
  }
  tabs.instanceMatrix.needsUpdate = true;

  const model: InstrumentModel = {
    archetype: 'organ',
    root,

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        return {
          position: new Vector3(0, MANUALS[1].whiteY + 0.085, MANUALS[1].backZ - 0.09 + Z_SHIFT),
          normal: UP.clone(),
          along: ACROSS.clone(),
        };
      }
      if (point.kind !== 'key') return undefined;
      const midi = point.midi;
      if (midi < LOW || midi > HIGH || !Number.isInteger(midi)) return undefined;
      const black = BLACK[midi % 12]!;

      if (midi < MANUAL_LOW) {
        // Feet. The naturals stick out further than the sharps, so a foot on a
        // C is well forward of a foot on a C sharp — which is the whole reason
        // a pedalboard is shaped the way it is.
        return {
          position: new Vector3(
            pedalX(midi), black ? P_SHARP_Y : P_NATURAL_Y,
            (black ? P_SHARP_Z : P_NATURAL_Z) + Z_SHIFT,
          ),
          normal: UP.clone(),
          along: ACROSS.clone(),
        };
      }

      const spec = MANUALS[midi < MANUAL_SPLIT ? 0 : 1]!;
      return {
        position: new Vector3(
          manualX(midi),
          black ? spec.whiteY + 0.010 : spec.whiteY,
          spec.backZ - (black ? 0.052 : 0.090) + Z_SHIFT,
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
        dirty.clear();
        for (const key of moving) {
          // Longer than a piano's: an organ key stays down while the note
          // sounds, and a snappy return would read as a plucked instrument.
          const env = key.hit.level(now, 0.55);
          const dip = 0.055 * (0.6 + 0.4 * key.hit.force) * env;
          quat.setFromAxisAngle(xAxis, -dip);
          scratch.compose(key.pivot, quat, one);
          key.mesh.setMatrixAt(key.slot, scratch);
          dirty.add(key.mesh);
          if (env < 0.02) moving.delete(key);
        }
        for (const mesh of dirty) mesh.instanceMatrix.needsUpdate = true;
      }
      lampMat.emissiveIntensity = 0.55 + 0.7 * lampHit.force * lampHit.level(now, 1.2);
    },

    station: { offset: new Vector3(0, 0, -0.96 + Z_SHIFT), facing: 0, posture: 'sit' },

    dispose(): void {
      disposeTree(root);
    },
  };

  return model;
};
