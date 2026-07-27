/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The grand piano.
 *
 * The whole reason to model a keyboard properly rather than as a striped slab
 * is that a hand at C4 has to be *visibly* at C4. So the keys are laid out with
 * real proportions — 23.5 mm white, black keys on the boundaries between them —
 * and `resolve` reads the same table the geometry was built from. Nothing else
 * on this instrument matters as much.
 *
 * **Which way the pitch runs.** The pianist faces the audience, and a performer
 * facing the audience has their right hand toward `-x` (see the rotation
 * convention in `concert/types.ts`). Low notes are under the player's *left*
 * hand, so the bass end is at `+x` and pitch increases toward `-x`. Watched
 * from the front that puts the treble on the audience's left, which is what you
 * see standing in front of a pianist.
 *
 * The frame: origin on the floor at the centre of the case, keyboard at the
 * `-z` (player) end, tail toward the audience, lid hinged on the bass spine.
 * The stager turns the whole thing; a recital angle is a rotation, not a
 * different model.
 */

import {
  BoxGeometry, BufferGeometry, CylinderGeometry, ExtrudeGeometry, Group,
  InstancedMesh, Material, Matrix4, Mesh, MeshStandardMaterial, Object3D,
  Quaternion, Shape, Vector3,
} from 'three';

import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import {
  addTo, type Contact, type InstrumentBuilder, type InstrumentModel,
} from './types.js';

// ---------------------------------------------------------------------------
// Keyboard arithmetic
// ---------------------------------------------------------------------------

/** Semitone within the octave → is it a black key. */
const BLACK = [false, true, false, true, false, false, true, false, true, false, true, false];
/** Semitone → the white key it sits at or immediately after, within the octave. */
const WHITE_AT = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];

const LOW = 21;    // A0
const HIGH = 108;  // C8

const WHITE_W = 0.0235;
const WHITE_L = 0.150;
const BLACK_W = 0.0110;
const BLACK_L = 0.095;
const WHITE_H = 0.020;
const BLACK_H = 0.016;

/** Index of the white key `midi` sits on, counted from MIDI 0. */
function whiteIndex(midi: number): number {
  return Math.floor(midi / 12) * 7 + WHITE_AT[midi % 12]!;
}

const WHITE_COUNT = whiteIndex(HIGH) - whiteIndex(LOW) + 1;
const BOARD_W = WHITE_COUNT * WHITE_W;

/**
 * Distance from the bass end of the board to the centre of a key.
 *
 * A black key sits on the boundary between its two neighbours, which is a
 * simplification real pianos do not make — they nudge the sharps sideways so
 * the gaps are even. It keeps the ordering strictly monotonic, which is the
 * property that matters here, and nobody has ever noticed the difference at
 * stage distance.
 */
function keyU(midi: number): number {
  const i = whiteIndex(midi) - whiteIndex(LOW);
  return BLACK[midi % 12]! ? (i + 1) * WHITE_W : (i + 0.5) * WHITE_W;
}

/** Key centre in the instrument's own frame. Bass at `+x`, treble at `-x`. */
function keyX(midi: number): number {
  return BOARD_W / 2 - keyU(midi);
}

// --- Where the keybed sits in the case ---

const KEY_BACK_Z = -0.80;      // the far end of the keys, where they pivot
const KEY_TOP_Y = 0.72;        // white key surface — the archetype's workHeight
const BLACK_TOP_Y = KEY_TOP_Y + 0.011;
/** Where a finger lands: near the front on a white, further back on a black. */
const WHITE_TOUCH_Z = KEY_BACK_Z - 0.100;
const BLACK_TOUCH_Z = KEY_BACK_Z - 0.060;

const PEDAL_SUSTAIN = new Vector3(-0.075, 0.118, -0.885);

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

/** One impulse, stored as *when* rather than as a running value. See drumkit. */
class Hit {
  beat = -1e9;
  force = 0;

  fire(now: number, force: number): void {
    this.beat = now;
    this.force = force < 0 ? 0 : force > 1 ? 1 : force;
  }

  /** Unit envelope: 1 at the instant of the hit, 0 once settled. */
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

// ---------------------------------------------------------------------------
// The builder
// ---------------------------------------------------------------------------

export const buildGrandPiano: InstrumentBuilder = (opts) => {
  const rng = new Rng(`grand-piano:${opts.seed}`);
  const root = new Group();
  root.name = 'grand-piano';

  const caseColour = opts.finish ?? rng.pick(['#141416', '#1a1512', '#2a1b12', '#3a2418']);
  const caseMat = new MeshStandardMaterial({ color: caseColour, roughness: 0.22, metalness: 0.12 });
  const ivoryMat = new MeshStandardMaterial({ color: '#f4f1e6', roughness: 0.42, metalness: 0 });
  const ebonyMat = new MeshStandardMaterial({ color: '#131316', roughness: 0.36, metalness: 0 });
  const brassMat = new MeshStandardMaterial({ color: '#c4a557', roughness: 0.3, metalness: 0.9 });
  const plateMat = new MeshStandardMaterial({ color: '#b6903f', roughness: 0.5, metalness: 0.7 });
  const feltMat = new MeshStandardMaterial({ color: '#7d1f26', roughness: 0.95, metalness: 0 });

  // --- The case ------------------------------------------------------------

  /**
   * The rim, as an outline. The spine — the long straight side — is the bass
   * side, so it is at `+x`; the bentside curves in on the treble side. Getting
   * that round the wrong way is the sort of thing that looks fine until
   * somebody who plays looks at it.
   */
  const outline = new Shape();
  const rim: Array<[number, number]> = [
    [0.725, -0.905], [0.725, 0.905], [0.40, 0.925], [0.10, 0.865],
    [-0.20, 0.700], [-0.44, 0.420], [-0.58, 0.050], [-0.665, -0.400],
    [-0.705, -0.780], [-0.725, -0.905],
  ];
  outline.moveTo(rim[0]![0], -rim[0]![1]);
  for (const [x, z] of rim.slice(1)) outline.lineTo(x, -z);
  outline.closePath();

  const caseGeo = new ExtrudeGeometry(outline, {
    depth: 0.26, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 1,
  });
  caseGeo.rotateX(-Math.PI / 2);
  const body = addTo(root, new Mesh(caseGeo, caseMat));
  body.position.y = 0.60;
  body.castShadow = true;
  body.receiveShadow = true;

  // Soundboard and plate, visible under the open lid and worth the two meshes.
  const boardGeo = new ExtrudeGeometry(outline, { depth: 0.012, bevelEnabled: false });
  boardGeo.rotateX(-Math.PI / 2);
  const soundboard = addTo(root, new Mesh(boardGeo, plateMat));
  soundboard.position.y = 0.845;
  soundboard.scale.set(0.94, 1, 0.94);

  // Strings: one instanced sliver, fanning from the bass corner to the tail.
  const stringGeo = new BoxGeometry(0.004, 0.002, 1);
  const strings = addTo(root, new InstancedMesh(stringGeo, brassMat, 34));
  {
    const m = new Matrix4();
    const q = new Quaternion();
    for (let i = 0; i < 34; i++) {
      const t = i / 33;
      const x = 0.64 - t * 1.26;
      const len = 1.55 - t * 0.95;
      const skew = (0.5 - t) * 0.22;
      q.setFromAxisAngle(new Vector3(0, 1, 0), skew);
      m.compose(new Vector3(x, 0.862, -0.70 + len / 2), q, new Vector3(1, 1, len));
      strings.setMatrixAt(i, m);
    }
    strings.instanceMatrix.needsUpdate = true;
  }

  // --- Keybed --------------------------------------------------------------

  /**
   * Keys pivot about their far end, so the geometry is built with its origin at
   * the top-back edge and a rotation about `x` is the whole animation.
   */
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

  /** Per-key state. Index into `keys` is keyed by midi through `slotOf`. */
  interface Key { mesh: InstancedMesh; slot: number; pivot: Vector3; hit: Hit }
  const keys = new Map<number, Key>();
  const restMatrix = new Matrix4();
  const scratch = new Matrix4();
  const quat = new Quaternion();
  const one = new Vector3(1, 1, 1);
  const axis = new Vector3(1, 0, 0);

  function seat(mesh: InstancedMesh, list: number[], top: number): void {
    list.forEach((midi, slot) => {
      const pivot = new Vector3(keyX(midi), top, KEY_BACK_Z);
      restMatrix.makeTranslation(pivot.x, pivot.y, pivot.z);
      mesh.setMatrixAt(slot, restMatrix);
      keys.set(midi, { mesh, slot, pivot, hit: new Hit() });
    });
    mesh.instanceMatrix.needsUpdate = true;
  }
  seat(whiteMesh, whites, KEY_TOP_Y);
  seat(blackMesh, blacks, BLACK_TOP_Y);

  /** Keys currently on their way back up. Empty most of the time. */
  const moving = new Set<Key>();
  /** 8 mm of travel over a 150 mm key is about three degrees. */
  const KEY_DIP = 0.055;

  // Keyslip, cheek blocks, fallboard and the music desk — the frame the keys
  // sit in, and what makes a keybed read as a piano rather than as a xylophone.
  const slip = addTo(root, new Mesh(new BoxGeometry(BOARD_W + 0.12, 0.05, 0.03), caseMat));
  slip.position.set(0, KEY_TOP_Y - 0.012, KEY_BACK_Z - WHITE_L - 0.015);
  slip.castShadow = true;
  for (const side of [1, -1]) {
    const cheek = addTo(root, new Mesh(new BoxGeometry(0.055, 0.10, WHITE_L + 0.03), caseMat));
    cheek.position.set(side * (BOARD_W / 2 + 0.03), KEY_TOP_Y + 0.02, KEY_BACK_Z - WHITE_L / 2 - 0.015);
    cheek.castShadow = true;
  }
  const fall = addTo(root, new Mesh(new BoxGeometry(BOARD_W + 0.12, 0.075, 0.05), caseMat));
  fall.position.set(0, KEY_TOP_Y + 0.03, KEY_BACK_Z + 0.03);
  fall.castShadow = true;
  const desk = addTo(root, new Mesh(new BoxGeometry(0.70, 0.26, 0.018), caseMat));
  desk.position.set(0, KEY_TOP_Y + 0.20, KEY_BACK_Z + 0.10);
  desk.rotation.x = -0.28;

  // --- Lid -----------------------------------------------------------------

  /**
   * Hinged on the spine and propped open. The underside is the bright face the
   * rim light catches, and the prop is what stops it reading as a folded sheet.
   */
  const lidGeo = new ExtrudeGeometry(outline, {
    depth: 0.026, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1,
  });
  lidGeo.rotateX(-Math.PI / 2);
  lidGeo.translate(-0.725, 0, 0);
  const lidPivot = addTo(root, new Group());
  lidPivot.position.set(0.725, 0.882, 0);
  lidPivot.rotation.z = -rng.float(0.68, 0.86);
  const lid = addTo(lidPivot, new Mesh(lidGeo, caseMat));
  lid.castShadow = true;
  const prop = addTo(root, new Mesh(new CylinderGeometry(0.012, 0.012, 1, 6), caseMat));
  {
    const foot = new Vector3(0.10, 0.882, 0.10);
    const head = new Vector3(0.725, 0.882, 0.10).add(
      new Vector3(Math.cos(lidPivot.rotation.z) * -0.66, Math.sin(-lidPivot.rotation.z) * 0.66, 0),
    );
    const mid = foot.clone().add(head).multiplyScalar(0.5);
    const dir = head.clone().sub(foot);
    prop.position.copy(mid);
    prop.scale.set(1, dir.length(), 1);
    prop.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize());
  }

  // --- Legs and the pedal lyre --------------------------------------------

  const legGeo = new CylinderGeometry(0.045, 0.062, 0.60, 8);
  for (const [x, z] of [[0.62, -0.80], [-0.62, -0.80], [0.28, 0.80]] as const) {
    const leg = addTo(root, new Mesh(legGeo, caseMat));
    leg.position.set(x, 0.30, z);
    leg.castShadow = true;
    const caster = addTo(root, new Mesh(new CylinderGeometry(0.055, 0.055, 0.03, 8), brassMat));
    caster.position.set(x, 0.015, z);
  }

  const lyre = addTo(root, new Mesh(new BoxGeometry(0.30, 0.30, 0.035), caseMat));
  lyre.position.set(-0.02, 0.42, -0.80);
  const pedalGroup = addTo(root, new Group());
  pedalGroup.position.set(0, 0.13, KEY_BACK_Z);
  const pedalGeo = new BoxGeometry(0.05, 0.014, 0.14);
  const pedals: Mesh[] = [];
  for (const x of [0.075, 0, -0.075]) {
    const p = addTo(pedalGroup, new Mesh(pedalGeo, brassMat));
    p.position.set(x, 0, -0.07);
    pedals.push(p);
  }
  /** The rightmost pedal, on the player's right at `-x`, is the sustain. */
  const sustainPedal = pedals[2]!;
  const sustainHit = new Hit();

  const bench = addTo(root, new Mesh(new BoxGeometry(0.62, 0.07, 0.30), caseMat));
  bench.position.set(0, 0.53, -1.24);
  bench.castShadow = true;
  const benchTop = addTo(root, new Mesh(new BoxGeometry(0.58, 0.035, 0.26), feltMat));
  benchTop.position.set(0, 0.575, -1.24);
  for (const [x, z] of [[0.26, -1.13], [-0.26, -1.13], [0.26, -1.35], [-0.26, -1.35]] as const) {
    const leg = addTo(root, new Mesh(new CylinderGeometry(0.018, 0.022, 0.50, 6), caseMat));
    leg.position.set(x, 0.25, z);
  }

  // --- The interface -------------------------------------------------------

  const UP = new Vector3(0, 1, 0);

  function keyContact(midi: number): Contact | undefined {
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
  }

  const model: InstrumentModel = {
    archetype: 'grand-piano',
    root,

    resolve(point: PlayPoint): Contact | undefined {
      switch (point.kind) {
        case 'key':
          return keyContact(point.midi);
        case 'pedal':
          // A grand has three, but only the sustain is in the IR's vocabulary.
          return point.which === 'sustain'
            ? { position: PEDAL_SUSTAIN.clone(), normal: UP.clone() }
            : undefined;
        case 'rest':
          // Hands off the keys, over the middle of the board.
          return { position: new Vector3(0, KEY_TOP_Y + 0.09, WHITE_TOUCH_Z), normal: UP.clone() };
        default:
          return undefined;
      }
    },

    react(point: PlayPoint, force: number, now: number): void {
      if (point.kind === 'key') {
        const key = keys.get(point.midi);
        if (!key) return;
        key.hit.fire(now, force);
        moving.add(key);
        return;
      }
      if (point.kind === 'pedal' && point.which === 'sustain') sustainHit.fire(now, force);
    },

    update(now: number): void {
      // Only keys that have been struck are touched, so a still keyboard costs
      // nothing and a busy one costs two instance-buffer uploads.
      if (moving.size > 0) {
        let whiteDirty = false;
        let blackDirty = false;
        for (const key of moving) {
          const env = key.hit.level(now, 0.16);
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
      sustainPedal.rotation.x = -sustainHit.level(now, 0.5) * 0.20;
    },

    station: { offset: new Vector3(0, 0, -1.24), facing: 0, posture: 'sit' },

    dispose(): void {
      disposeTree(root);
    },
  };

  return model;
};
