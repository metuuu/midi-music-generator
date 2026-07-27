/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The accordion — and the bellows actually open.
 *
 * `ARCHETYPES.accordion` declares a range of 41..93 and says why: *both* hands
 * play. That is not one keyboard with a wide reach, it is two different
 * instruments bolted to the ends of a box of air, and this model splits the
 * range where the instrument does:
 *
 *   - **53..93** — F3 to A6, the 41-note treble keyboard, played by the right
 *     hand on the far side of the treble box. Low notes at the top.
 *   - **41..52** — F2 to E3, one chromatic octave, played by the left hand on
 *     the bass buttons. Exactly the span a Stradella bass row covers.
 *
 * **The bass buttons are laid out in fifths, not chromatically.** That is what
 * a Stradella bass is: each button down the row is a fifth above the last, so a
 * I–V move is one button and a chromatic run is a scramble. It costs nothing to
 * be right about and it is the reason an accordionist's left hand moves the way
 * it does.
 *
 * **What moves.** The treble side is strapped to the player and stays put; the
 * bass side rides the bellows, which is how a real accordion works and why
 * `resolve` can be pure for the right hand and only approximately fixed for the
 * left. Bass-button contacts are given at the *neutral* bellows position and
 * drift by up to ±0.12 m as the bellows work — the `bellows` point itself
 * carries the full travel, so the left hand that is following a squeeze gesture
 * goes where the buttons actually are.
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

const BASS_LOW = 41;    // F2
const BASS_HIGH = 52;   // E3
const TREBLE_LOW = 53;  // F3
const TREBLE_HIGH = 93; // A6

// --- Treble keyboard, measured down the side of the treble box ---
const KEY_PITCH = 0.0195;
const KEY_W = 0.0178;        // along y
const WHITE_L = 0.130;       // along z
const BLACK_L = 0.085;
const WHITE_T = 0.012;       // how far the key stands proud, along -x
const BLACK_T = 0.022;
const KEY_PIVOT_Z = -0.075;

// --- The box ---
const TREBLE_OUTER_X = -0.19;
const TREBLE_INNER_X = -0.09;
const BASS_DEPTH = 0.09;
const BELLOWS_SHUT = 0.06;
const BELLOWS_NEUTRAL = 0.18;
const BELLOWS_OPEN = 0.30;
const BOX_H = 0.50;
const BOX_Z = 0.22;

/** Height above the boards of the instrument's centre — the archetype's workHeight. */
const CHEST_Y = 1.15;
/** A quarter turn of the treble side toward the audience, so the keys read. */
const YAW = 0.14;

function whiteIndex(midi: number): number {
  return Math.floor(midi / 12) * 7 + WHITE_AT[midi % 12]!;
}
const TREBLE_WHITES = whiteIndex(TREBLE_HIGH) - whiteIndex(TREBLE_LOW) + 1;
const KEYBOARD_L = TREBLE_WHITES * KEY_PITCH;

/** Distance down the keyboard from its low (top) end. */
function keyU(midi: number): number {
  const i = whiteIndex(midi) - whiteIndex(TREBLE_LOW);
  return BLACK[midi % 12]! ? (i + 1) * KEY_PITCH : (i + 0.5) * KEY_PITCH;
}
/** Low notes at the top, high notes at the bottom — as they are on the instrument. */
function keyY(midi: number): number {
  return KEYBOARD_L / 2 - keyU(midi);
}

const BUTTON_PITCH = 0.032;
/**
 * Which button in the bass row a pitch class sits on.
 *
 * The row runs in fifths from F, so the inverse map is a multiply by 7 — seven
 * being its own inverse modulo twelve, which is a small piece of luck the
 * circle of fifths has been trading on for centuries.
 */
function bassColumn(midi: number): number {
  return (((midi % 12) - 5) * 7 % 12 + 12) % 12;
}
function bassY(midi: number): number {
  return (11 * BUTTON_PITCH) / 2 - bassColumn(midi) * BUTTON_PITCH;
}
/** The row that sounds single bass notes; the others are chord buttons. */
const BASS_ROW_Z = -0.015;
const BUTTON_ROWS = [-0.048, -0.015, 0.018, 0.051];

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

/** Endpoint-and-start easing, so a seek lands in the right place. See drumkit. */
class Eased {
  private from: number;
  private to: number;
  private at = -1e9;
  constructor(private readonly span: number, initial: number) {
    this.from = initial;
    this.to = initial;
  }
  set(now: number, value: number): void {
    this.from = this.value(now);
    this.to = value;
    this.at = now;
  }
  value(now: number): number {
    const t = (now - this.at) / this.span;
    if (!(t > 0)) return this.from;
    if (t >= 1) return this.to;
    return this.from + (this.to - this.from) * (t * t * (3 - 2 * t));
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

export const buildAccordion: InstrumentBuilder = (opts) => {
  const rng = new Rng(`accordion:${opts.seed}`);
  const root = new Group();
  root.name = 'accordion';

  const shellColour = opts.finish ?? rng.pick(['#8c1f1f', '#151517', '#1d3a5c', '#2f6b4a', '#efe6d6']);
  const trim = rng.pick(['#e8dcc0', '#c9a34a', '#d8d8dc']);

  const shellMat = new MeshStandardMaterial({ color: shellColour, roughness: 0.24, metalness: 0.18 });
  const trimMat = new MeshStandardMaterial({ color: trim, roughness: 0.35, metalness: 0.5 });
  const ivoryMat = new MeshStandardMaterial({ color: '#f2eee2', roughness: 0.4, metalness: 0 });
  const ebonyMat = new MeshStandardMaterial({ color: '#17171b', roughness: 0.38, metalness: 0 });
  const bellowsMat = new MeshStandardMaterial({ color: '#1a1a1d', roughness: 0.85, metalness: 0 });
  const pleatMat = new MeshStandardMaterial({ color: trim, roughness: 0.7, metalness: 0.1 });
  const strapMat = new MeshStandardMaterial({ color: '#3a2a1e', roughness: 0.9, metalness: 0 });

  /**
   * Everything lives inside this, and `resolve` transforms through its matrix.
   * The yaw is a staging nicety — an accordion turned flat-on to the audience
   * is a rectangle — and putting it here means the key table stays readable in
   * the instrument's own terms.
   */
  const body = addTo(root, new Group());
  body.position.set(0, CHEST_Y, 0.04);
  body.rotation.y = YAW;
  body.updateMatrix();
  body.updateMatrixWorld(true);

  // --- Treble box ----------------------------------------------------------

  const trebleBox = addTo(body, new Mesh(
    new BoxGeometry(TREBLE_INNER_X - TREBLE_OUTER_X, BOX_H, BOX_Z), shellMat,
  ));
  trebleBox.position.set((TREBLE_OUTER_X + TREBLE_INNER_X) / 2, 0, 0);
  trebleBox.castShadow = true;
  trebleBox.receiveShadow = true;

  // The grille — the fretwork over the treble reeds, and the face of the
  // instrument as far as an audience is concerned.
  const grille = addTo(body, new Mesh(new BoxGeometry(0.012, BOX_H * 0.9, 0.05), trimMat));
  grille.position.set(TREBLE_OUTER_X - 0.004, 0, BOX_Z / 2 - 0.035);
  const slotGeo = new BoxGeometry(0.016, 0.012, 0.03);
  const slots = addTo(body, new InstancedMesh(slotGeo, ebonyMat, 11));
  {
    const m = new Matrix4();
    for (let i = 0; i < 11; i++) {
      m.makeTranslation(TREBLE_OUTER_X - 0.008, 0.19 - i * 0.038, BOX_Z / 2 - 0.035);
      slots.setMatrixAt(i, m);
    }
    slots.instanceMatrix.needsUpdate = true;
  }

  // --- Treble keyboard -----------------------------------------------------

  /**
   * Keys stand proud of the box face at `-x` and pivot about `y` at their near
   * end, so pressing one swings its far end inward. The geometry carries the
   * offset; the instance matrix is a position and one angle.
   */
  const whiteGeo = new BoxGeometry(WHITE_T, KEY_W, WHITE_L);
  whiteGeo.translate(-WHITE_T / 2, 0, WHITE_L / 2);
  const blackGeo = new BoxGeometry(BLACK_T, KEY_W * 0.55, BLACK_L);
  blackGeo.translate(-BLACK_T / 2, 0, BLACK_L / 2);

  const whites: number[] = [];
  const blacks: number[] = [];
  for (let m = TREBLE_LOW; m <= TREBLE_HIGH; m++) (BLACK[m % 12]! ? blacks : whites).push(m);

  const whiteMesh = addTo(body, new InstancedMesh(whiteGeo, ivoryMat, whites.length));
  const blackMesh = addTo(body, new InstancedMesh(blackGeo, ebonyMat, blacks.length));
  whiteMesh.castShadow = true;
  blackMesh.castShadow = true;

  interface Pressable { mesh: InstancedMesh; slot: number; home: Matrix4; axis: 'key' | 'button'; pivot: Vector3; hit: Hit }
  const pressables = new Map<number, Pressable>();
  const scratch = new Matrix4();
  const quat = new Quaternion();
  const one = new Vector3(1, 1, 1);
  const yAxis = new Vector3(0, 1, 0);

  function seatKeys(mesh: InstancedMesh, list: number[]): void {
    list.forEach((midi, slot) => {
      const pivot = new Vector3(TREBLE_OUTER_X, keyY(midi), KEY_PIVOT_Z);
      const home = new Matrix4().makeTranslation(pivot.x, pivot.y, pivot.z);
      mesh.setMatrixAt(slot, home);
      pressables.set(midi, { mesh, slot, home, axis: 'key', pivot, hit: new Hit() });
    });
    mesh.instanceMatrix.needsUpdate = true;
  }
  seatKeys(whiteMesh, whites);
  seatKeys(blackMesh, blacks);

  // --- Bellows -------------------------------------------------------------

  /**
   * Twelve pleats, respaced every frame from one number. Alternating materials
   * give the concertina stripe without a texture, which is the whole art
   * direction of this feature in one object.
   */
  const PLEATS = 12;
  const pleatGeo = new BoxGeometry(0.010, BOX_H, BOX_Z);
  const pleatInnerGeo = new BoxGeometry(0.010, BOX_H * 0.93, BOX_Z * 0.90);
  const pleatsA = addTo(body, new InstancedMesh(pleatGeo, bellowsMat, Math.ceil(PLEATS / 2)));
  const pleatsB = addTo(body, new InstancedMesh(pleatInnerGeo, pleatMat, Math.floor(PLEATS / 2)));
  pleatsA.castShadow = true;

  const bellows = new Eased(0.45, BELLOWS_NEUTRAL);

  // --- Bass side -----------------------------------------------------------

  const bassSide = addTo(body, new Group());
  const bassBox = addTo(bassSide, new Mesh(new BoxGeometry(BASS_DEPTH, BOX_H, BOX_Z), shellMat));
  bassBox.position.x = BASS_DEPTH / 2;
  bassBox.castShadow = true;
  bassBox.receiveShadow = true;

  const strap = addTo(bassSide, new Mesh(new BoxGeometry(0.02, 0.30, 0.045), strapMat));
  strap.position.set(BASS_DEPTH + 0.030, 0, 0);
  const strapArm = addTo(bassSide, new Mesh(new BoxGeometry(0.055, 0.03, 0.045), strapMat));
  strapArm.position.set(BASS_DEPTH + 0.012, 0.15, 0);
  const strapArm2 = addTo(bassSide, new Mesh(new BoxGeometry(0.055, 0.03, 0.045), strapMat));
  strapArm2.position.set(BASS_DEPTH + 0.012, -0.15, 0);

  /**
   * Forty-eight buttons in four rows, of which the twelve in the bass row are
   * the ones anything resolves to. The other three rows are the chord buttons,
   * and they are there because a Stradella bass with one row on it would look
   * like a mistake.
   */
  const buttonGeo = new CylinderGeometry(0.0085, 0.0085, 0.016, 8);
  buttonGeo.rotateZ(-Math.PI / 2);          // axis along +x
  buttonGeo.translate(BASS_DEPTH + 0.008, 0, 0);
  const buttonMesh = addTo(bassSide, new InstancedMesh(buttonGeo, ivoryMat, BUTTON_ROWS.length * 12));
  {
    let i = 0;
    for (const rowZ of BUTTON_ROWS) {
      for (let k = 0; k < 12; k++) {
        const y = (11 * BUTTON_PITCH) / 2 - k * BUTTON_PITCH;
        scratch.makeTranslation(0, y, rowZ);
        buttonMesh.setMatrixAt(i, scratch);
        i++;
      }
    }
    buttonMesh.instanceMatrix.needsUpdate = true;
  }
  // Only the bass row is addressable, and its slots are the second block of 12.
  const BASS_ROW_INDEX = BUTTON_ROWS.indexOf(BASS_ROW_Z);
  for (let midi = BASS_LOW; midi <= BASS_HIGH; midi++) {
    const slot = BASS_ROW_INDEX * 12 + bassColumn(midi);
    pressables.set(midi, {
      mesh: buttonMesh, slot, axis: 'button',
      home: new Matrix4().makeTranslation(0, bassY(midi), BASS_ROW_Z),
      pivot: new Vector3(0, bassY(midi), BASS_ROW_Z), hit: new Hit(),
    });
  }

  // --- Contacts, precomputed through the body transform --------------------

  const bodyMatrix = body.matrix.clone();
  const bodyQuat = body.quaternion.clone();

  function place(local: Vector3, normal: Vector3): Contact {
    return {
      position: local.clone().applyMatrix4(bodyMatrix),
      normal: normal.clone().applyQuaternion(bodyQuat).normalize(),
    };
  }

  const OUT_TREBLE = new Vector3(-0.97, 0, 0.24);
  const OUT_BASS = new Vector3(0.97, 0, -0.24);

  /** Every contact this model can ever return, worked out once. */
  const contacts = new Map<number, Contact>();
  for (let midi = TREBLE_LOW; midi <= TREBLE_HIGH; midi++) {
    const black = BLACK[midi % 12]!;
    contacts.set(midi, place(
      new Vector3(
        TREBLE_OUTER_X - (black ? BLACK_T : WHITE_T),
        keyY(midi),
        KEY_PIVOT_Z + (black ? BLACK_L * 0.62 : WHITE_L * 0.72),
      ),
      OUT_TREBLE,
    ));
  }
  const neutralBassX = TREBLE_INNER_X + BELLOWS_NEUTRAL;
  for (let midi = BASS_LOW; midi <= BASS_HIGH; midi++) {
    contacts.set(midi, place(
      new Vector3(neutralBassX + BASS_DEPTH + 0.016, bassY(midi), BASS_ROW_Z),
      OUT_BASS,
    ));
  }

  /** Where the left hand sits under the strap, at either end of the travel. */
  function strapContact(width: number): Contact {
    return place(
      new Vector3(TREBLE_INNER_X + width + BASS_DEPTH + 0.035, 0, 0),
      OUT_BASS,
    );
  }
  const BELLOWS_PULLED = strapContact(BELLOWS_OPEN);
  const BELLOWS_PUSHED = strapContact(BELLOWS_SHUT);
  const REST_CONTACT = place(
    new Vector3(TREBLE_OUTER_X - 0.075, 0, KEY_PIVOT_Z + WHITE_L * 0.72), OUT_TREBLE,
  );

  const moving = new Set<Pressable>();
  const KEY_DIP = 0.10;      // radians at the key pivot
  const BUTTON_DIP = 0.006;  // metres straight in

  const model: InstrumentModel = {
    archetype: 'accordion',
    root,

    resolve(point: PlayPoint): Contact | undefined {
      switch (point.kind) {
        case 'key': {
          const c = contacts.get(point.midi);
          if (!c) return undefined;
          return { position: c.position.clone(), normal: c.normal.clone() };
        }
        case 'bellows': {
          const c = point.open ? BELLOWS_PULLED : BELLOWS_PUSHED;
          return { position: c.position.clone(), normal: c.normal.clone() };
        }
        case 'rest':
          return { position: REST_CONTACT.position.clone(), normal: REST_CONTACT.normal.clone() };
        default:
          return undefined;
      }
    },

    react(point: PlayPoint, force: number, now: number): void {
      if (point.kind === 'bellows') {
        // A hard squeeze travels further than a gentle one, which is the whole
        // dynamic range of the instrument made visible.
        const f = force < 0 ? 0 : force > 1 ? 1 : force;
        const reach = 0.055 + 0.075 * f;
        bellows.set(now, point.open
          ? Math.min(BELLOWS_OPEN, BELLOWS_NEUTRAL + reach)
          : Math.max(BELLOWS_SHUT, BELLOWS_NEUTRAL - reach));
        return;
      }
      if (point.kind !== 'key') return;
      const p = pressables.get(point.midi);
      if (!p) return;
      p.hit.fire(now, force);
      moving.add(p);
    },

    update(now: number): void {
      // A small permanent drift on top of whatever the gestures asked for. An
      // accordion with a perfectly still bellows is an accordion nobody is
      // breathing through, and that reads as broken rather than as calm.
      const drift = Math.sin(now * 0.22 * Math.PI * 2) * 0.012;
      const w = Math.max(BELLOWS_SHUT, Math.min(BELLOWS_OPEN, bellows.value(now) + drift));

      const start = TREBLE_INNER_X;
      const step = w / PLEATS;
      let a = 0;
      let b = 0;
      for (let i = 0; i < PLEATS; i++) {
        scratch.makeTranslation(start + step * (i + 0.5), 0, 0);
        if (i % 2 === 0) pleatsA.setMatrixAt(a++, scratch);
        else pleatsB.setMatrixAt(b++, scratch);
      }
      pleatsA.instanceMatrix.needsUpdate = true;
      pleatsB.instanceMatrix.needsUpdate = true;
      bassSide.position.x = start + w;

      if (moving.size > 0) {
        let whiteDirty = false;
        let blackDirty = false;
        let buttonDirty = false;
        for (const p of moving) {
          const env = p.hit.level(now, 0.30);
          if (p.axis === 'key') {
            quat.setFromAxisAngle(yAxis, KEY_DIP * (0.6 + 0.4 * p.hit.force) * env);
            scratch.compose(p.pivot, quat, one);
          } else {
            scratch.makeTranslation(
              -BUTTON_DIP * (0.6 + 0.4 * p.hit.force) * env, p.pivot.y, p.pivot.z,
            );
          }
          p.mesh.setMatrixAt(p.slot, scratch);
          if (p.mesh === whiteMesh) whiteDirty = true;
          else if (p.mesh === blackMesh) blackDirty = true;
          else buttonDirty = true;
          if (env < 0.02) moving.delete(p);
        }
        if (whiteDirty) whiteMesh.instanceMatrix.needsUpdate = true;
        if (blackDirty) blackMesh.instanceMatrix.needsUpdate = true;
        if (buttonDirty) buttonMesh.instanceMatrix.needsUpdate = true;
      }
    },

    station: { offset: new Vector3(0, 0, -0.28), facing: 0, posture: 'stand' },

    dispose(): void {
      disposeTree(root);
    },
  };

  return model;
};
