/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The synthesiser — the keyboard, and only the keyboard.
 *
 * Thirty-odd catalogue entries land on this one model: every pad, every lead,
 * every FX patch, the synth basses and the synth brass. What all of them
 * genuinely share is the keybed — a synthesiser has keys under the hands
 * whatever decade it was built in — so the keys are what lives here, and they
 * are the only part `resolve` has ever touched.
 *
 * Everything else — the case, the control panel, the wheels, whatever holds it
 * off the floor — is a *rig*, and which rig gets built is a question about the
 * year rather than about the patch. The argument for that seam is set out at
 * length in `synth-rig.ts`; the short version is that a synthesiser in 1974 and
 * one in 1987 share almost no geometry, and staging one prop for both put five
 * identical people behind five identical trestle tables.
 *
 * The one thing this file does take seriously is the keyboard. Pitch runs bass
 * at `+x` to treble at `-x`, the same as every other keyboard here; the argument
 * is in `grand-piano.ts`.
 */

import {
  BoxGeometry, Group, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion,
  Vector3,
} from 'three';

import type { GestureKind, PlayPoint } from '../../../concert/types.js';
import { buildDigitalRig } from './synth-rig-digital.js';
import { buildModularRig } from './synth-rig-modular.js';
import { buildPolysynthRig } from './synth-rig-polysynth.js';
import {
  DIGITAL_FROM, POLYSYNTH_FROM, disposeTree, type SynthRigBuilder,
} from './synth-rig.js';
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

/**
 * How long a re-struck key spends letting go and falling again, in beats, and
 * how far up it gets in that time as a fraction of full travel. A synth action
 * is squashier than a piano's, so it takes slightly longer over it.
 */
const REBOUND = 0.16;
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
   * quaver into a player leaning on one key: the sound retriggers and nothing
   * on the instrument moves. The key has to be seen letting go.
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

/**
 * Which instrument the year was standing in.
 *
 * This lives here and **not** in `synth-rig.ts` on purpose. That file is the
 * contract every rig is written against; if it also imported the three rigs
 * then every rig would transitively depend on the other two, and each of them
 * would import a module that imports it back. The keyboard is the one place
 * that already knows about all three, so the choosing happens here.
 *
 * An unknown year is the pre-1978 keyboard-shaped instrument rather than the
 * earliest rig, because that is what this model looked like before any of this
 * existed and a caller who never sets a year should not have their stage
 * silently redecorated.
 */
function pickRig(year: number | undefined): SynthRigBuilder {
  if (year === undefined) return buildPolysynthRig;   // what it looked like before this existed
  if (year < POLYSYNTH_FROM) return buildModularRig;
  if (year >= DIGITAL_FROM) return buildDigitalRig;
  return buildPolysynthRig;
}

export const buildSynth: InstrumentBuilder = (opts) => {
  const root = new Group();
  root.name = 'synth';

  /**
   * The rig is handed measurements of the keybed rather than importing them, so
   * that a change to the keyboard cannot leave a case sized for the old one.
   * Nothing comes back the other way: a rig cannot move a key and is never
   * asked where one is.
   */
  const rig = pickRig(opts.year)({
    seed: opts.seed,
    ...(opts.finish ? { finish: opts.finish } : {}),
    boardWidth: BOARD_W,
    keyTopY: KEY_TOP_Y,
    keyBackZ: KEY_BACK_Z,
    whiteLength: WHITE_L,
  });
  addTo(root, rig.group);

  const ivoryMat = new MeshStandardMaterial({ color: '#eceade', roughness: 0.44, metalness: 0 });
  const ebonyMat = new MeshStandardMaterial({ color: '#141417', roughness: 0.4, metalness: 0 });

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
  const UP = new Vector3(0, 1, 0);
  /** Knuckles across the keyboard. The argument is in `grand-piano.ts`. */
  const ACROSS = new Vector3(1, 0, 0);

  const model: InstrumentModel = {
    archetype: 'synth',
    root,

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        return {
          position: new Vector3(0, KEY_TOP_Y + 0.085, WHITE_TOUCH_Z),
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
      // The rig learns that a note happened and how hard, and nothing else —
      // not which note. A panel lamp does not know either.
      rig.react?.(force, now);
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
      rig.update?.(now);
    },

    station: { offset: new Vector3(0, 0, KEY_BACK_Z - WHITE_L - 0.28), facing: 0, posture: 'stand' },

    dispose(): void {
      // The rig first: it empties its own group, so the sweep below walks a
      // keyboard and an empty node rather than freeing the rig's resources on
      // its behalf and leaving it holding stale handles.
      rig.dispose();
      disposeTree(root);
    },
  };

  return model;
};
