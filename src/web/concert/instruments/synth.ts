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

import { boardsFor, type BoardSpec } from '../../../concert/instruments.js';
import type { GestureKind, PlayPoint, SynthRigId } from '../../../concert/types.js';
import { buildDigitalRig } from './synth-rig-digital.js';
import { buildModularRig } from './synth-rig-modular.js';
import { buildPolysynthRig } from './synth-rig-polysynth.js';
import { disposeTree, type SynthRigBuilder } from './synth-rig.js';
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

/** Whites across a board spanning `lo..hi`, and therefore how wide it is. */
function whiteCount(lo: number, hi: number): number {
  return whiteIndex(hi) - whiteIndex(lo) + 1;
}
function boardWidth(lo: number, hi: number): number {
  return whiteCount(lo, hi) * WHITE_W;
}

const WHITE_COUNT = whiteCount(LOW, HIGH);
const BOARD_W = WHITE_COUNT * WHITE_W;

/**
 * Where a key sits across its own board, in that board's local frame.
 *
 * Takes the board's range rather than assuming the full 88, because a station
 * may carry a 61-note board beside an 88 and the two number their whites from
 * different places. Pitch still runs bass at `+x` to treble at `-x` on every one
 * of them; the argument is in `grand-piano.ts`.
 */
function keyU(midi: number, lo: number): number {
  const i = whiteIndex(midi) - whiteIndex(lo);
  return BLACK[midi % 12]! ? (i + 1) * WHITE_W : (i + 0.5) * WHITE_W;
}
function keyX(midi: number, lo: number, hi: number): number {
  return boardWidth(lo, hi) / 2 - keyU(midi, lo);
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

/**
 * Where the control surface is, relative to the keys.
 *
 * A hand's depth above the key plane and a hand's reach behind the key line —
 * which is where a panel is on all three rigs, and which is clear of the keys
 * by construction so reaching for a knob never puts a fist through a keybed.
 */
const PANEL_RISE = 0.10;
const PANEL_BACK = 0.24;

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
 * Which of the three to build.
 *
 * A lookup and no longer a decision, which is the whole of this change. It used
 * to take the year and answer from it, per performer, here in the renderer —
 * and a year cannot count. Synth's `modular` era is 1974, 90% of its numbers
 * carry three or more keyboards, so every one of them got a five-cabinet Moog
 * System 55 and the stage came out as three walls of patch cables. Nothing was
 * broken; nothing was in a position to know there were three.
 *
 * `Performer.rig` is now decided in `concert/cast.ts`, where the whole band is
 * one array and a cap can be applied. See `assignRigs` and `SYNTH_RIGS`.
 *
 * The table lives here and **not** in `synth-rig.ts` on purpose. That file is
 * the contract every rig is written against; if it also imported the three rigs
 * then every rig would transitively depend on the other two, and each of them
 * would import a module that imports it back. The keyboard is the one place
 * that already knows about all three, so the mapping happens here.
 *
 * An unnamed rig is the keyboard-shaped instrument rather than the earliest
 * one, because that is what this model looked like before any of this existed
 * and a caller who sets nothing should not have their stage silently
 * redecorated.
 */
const RIGS: Record<SynthRigId, SynthRigBuilder> = {
  modular: buildModularRig,
  polysynth: buildPolysynthRig,
  digital: buildDigitalRig,
};

function pickRig(rig: SynthRigId | undefined): SynthRigBuilder {
  return rig ? RIGS[rig] : buildPolysynthRig;
}

export const buildSynth: InstrumentBuilder = (opts) => {
  const root = new Group();
  root.name = 'synth';

  /**
   * How many keyboards, and where. Read before the rig is built because the rig
   * has to put a shelf under each of the extra ones.
   */
  const layout = boardsFor(opts.boards ?? 1);

  /**
   * The rig is handed measurements of the keybed rather than importing them, so
   * that a change to the keyboard cannot leave a case sized for the old one.
   * Nothing comes back the other way: a rig cannot move a key and is never
   * asked where one is.
   */
  const rig = pickRig(opts.rig)({
    seed: opts.seed,
    ...(opts.finish ? { finish: opts.finish } : {}),
    boardWidth: BOARD_W,
    keyTopY: KEY_TOP_Y,
    keyBackZ: KEY_BACK_Z,
    whiteLength: WHITE_L,
    ...(opts.machine ? { machine: opts.machine } : {}),
    // Board 0 is the one every rig already builds a shelf for; the rest are the
    // rig's to support, each with the width only this file can measure. See
    // `SynthRigOptions.extraBoards`.
    ...(layout.length > 1
      ? {
        extraBoards: layout.slice(1).map((b) => ({
          ...b, width: boardWidth(b.range[0], b.range[1]),
        })),
      }
      : {}),
  });
  addTo(root, rig.group);

  const ivoryMat = new MeshStandardMaterial({ color: '#eceade', roughness: 0.44, metalness: 0 });
  const ebonyMat = new MeshStandardMaterial({ color: '#141417', roughness: 0.4, metalness: 0 });

  // --- Keybeds -------------------------------------------------------------
  //
  // One per board. A station with several is a *frame* with keyboards in it —
  // see `boardsFor` — and every board here is a real keybed with real keys that
  // `resolve` can send a hand to. That is the whole point of the change: the
  // second row of keys on this stage used to be scenery.
  //
  // The geometry is shared and the layout is not. Every board reuses one white
  // and one black `BoxGeometry` through two instanced meshes, so four boards
  // cost four draw calls rather than four hundred.

  const whiteGeo = new BoxGeometry(WHITE_W * 0.94, WHITE_H, WHITE_L);
  whiteGeo.translate(0, -WHITE_H / 2, -WHITE_L / 2);
  const blackGeo = new BoxGeometry(BLACK_W, BLACK_H, BLACK_L);
  blackGeo.translate(0, -BLACK_H / 2, -BLACK_L / 2);

  interface Key { mesh: InstancedMesh; slot: number; pivot: Vector3; hit: Hit }
  interface Board {
    spec: BoardSpec;
    /** Board-local → model-local. Composed once; `resolve` reads it every call. */
    place: Matrix4;
    keys: Map<number, Key>;
  }
  const scratch = new Matrix4();
  const quat = new Quaternion();
  const one = new Vector3(1, 1, 1);
  const xAxis = new Vector3(1, 0, 0);
  const yAxis = new Vector3(0, 1, 0);

  const boards: Board[] = layout.map((spec, index) => {
    const [lo, hi] = spec.range;
    const whites: number[] = [];
    const blacks: number[] = [];
    for (let m = lo; m <= hi; m++) (BLACK[m % 12]! ? blacks : whites).push(m);

    /**
     * Where this board sits, as one matrix.
     *
     * Board 0 is the identity by construction — `boardsFor` puts it at the
     * origin with no yaw — so a single-board station composes exactly the
     * transforms it did before this existed, and nothing about it can have
     * moved.
     */
    const place = new Matrix4()
      .makeRotationY(spec.yaw)
      .setPosition(spec.at[0], spec.at[1], spec.at[2]);

    const whiteMesh = addTo(root, new InstancedMesh(whiteGeo, ivoryMat, whites.length));
    const blackMesh = addTo(root, new InstancedMesh(blackGeo, ebonyMat, blacks.length));
    whiteMesh.name = `keys:white:${index}`;
    blackMesh.name = `keys:black:${index}`;
    whiteMesh.receiveShadow = true;
    blackMesh.castShadow = true;
    whiteMesh.matrixAutoUpdate = false;
    blackMesh.matrixAutoUpdate = false;
    whiteMesh.matrix.copy(place);
    blackMesh.matrix.copy(place);

    const keys = new Map<number, Key>();
    const seat = (mesh: InstancedMesh, list: number[], y: number): void => {
      list.forEach((midi, slot) => {
        // Board-local: the instanced mesh already carries `place`, so a key's
        // own matrix must not carry it a second time.
        const pivot = new Vector3(keyX(midi, lo, hi), y, KEY_BACK_Z);
        scratch.makeTranslation(pivot.x, pivot.y, pivot.z);
        mesh.setMatrixAt(slot, scratch);
        keys.set(midi, { mesh, slot, pivot, hit: new Hit() });
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    seat(whiteMesh, whites, KEY_TOP_Y);
    seat(blackMesh, blacks, BLACK_TOP_Y);

    return { spec, place, keys };
  });

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
      if (point.kind === 'control') {
        /**
         * The panel, in this model's own frame rather than the rig's.
         *
         * Every one of the three rigs puts its controls in the same place —
         * above the key plane and behind the key line — because that is the one
         * region a keyboard leaves free: the modular's console, the polysynth's
         * knob row and the digital deck are all there. So the keyboard can
         * answer this without asking the rig, which keeps the seam intact: a
         * rig is geometry the keys are built around and is never consulted
         * about where a hand goes.
         *
         * This is the player's *own* panel — their filter, their mod wheel.
         * A `control` point that names a machine standing beside them never
         * reaches here: the show intercepts it, because the box is a separate
         * object at a distance only the show knows. See `aimMachineControls` in
         * `./index.ts`. This answer was doing that job too while the machine was
         * bolted to the back of the same rig and the two were a few centimetres
         * apart; on its own stand at the player's elbow they are most of a
         * metre apart and it was placing the hand on the wrong object.
         */
        const at = Math.max(0, Math.min(1, point.at));
        return {
          position: new Vector3(
            BOARD_W / 2 - at * BOARD_W,
            KEY_TOP_Y + PANEL_RISE,
            KEY_BACK_Z + PANEL_BACK,
          ),
          normal: UP.clone(),
          along: ACROSS.clone(),
        };
      }
      if (point.kind !== 'key') return undefined;
      const board = boards[point.board ?? 0];
      /**
       * A board this station does not have is `undefined`, not board 0.
       *
       * Falling back would hide a choreography bug behind a hand that looks
       * fine — the model's contract is that a point it does not recognise gets
       * no guess, precisely so the failure is visible.
       */
      if (!board) return undefined;
      const midi = point.midi;
      const [lo, hi] = board.spec.range;
      if (midi < lo || midi > hi || !Number.isInteger(midi)) return undefined;
      const black = BLACK[midi % 12]!;
      return {
        position: new Vector3(
          keyX(midi, lo, hi),
          black ? BLACK_TOP_Y : KEY_TOP_Y,
          black ? BLACK_TOUCH_Z : WHITE_TOUCH_Z,
        ).applyMatrix4(board.place),
        // Turned with the board: a wing is toed in half a radian, so "up off
        // the keys" and "along the knuckles" are not the model's axes there.
        normal: UP.clone().applyAxisAngle(yAxis, board.spec.yaw),
        along: ACROSS.clone().applyAxisAngle(yAxis, board.spec.yaw),
      };
    },

    react(
      point: PlayPoint, force: number, now: number,
      _kind?: GestureKind, hold?: number,
    ): void {
      if (point.kind !== 'key') return;
      const key = boards[point.board ?? 0]?.keys.get(point.midi);
      if (!key) return;
      key.hit.fire(now, force, hold);
      moving.add(key);
      // The rig learns that a note happened and how hard, and nothing else —
      // not which note. A panel lamp does not know either.
      rig.react?.(force, now);
    },

    update(now: number): void {
      if (moving.size > 0) {
        const dirty = new Set<InstancedMesh>();
        for (const key of moving) {
          // Slower than a piano: a pad is held, and a synth action is squashy.
          const env = key.hit.level(now, 0.40);
          const dip = 0.052 * (0.6 + 0.4 * key.hit.force) * env;
          quat.setFromAxisAngle(xAxis, -dip);
          scratch.compose(key.pivot, quat, one);
          key.mesh.setMatrixAt(key.slot, scratch);
          dirty.add(key.mesh);
          if (env < 0.02) moving.delete(key);
        }
        // Which meshes rather than which two: with four boards there are eight.
        for (const mesh of dirty) mesh.instanceMatrix.needsUpdate = true;
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
