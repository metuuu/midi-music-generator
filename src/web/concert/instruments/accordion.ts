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

import type { Effector, PlayPoint } from '../../../concert/types.js';
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
/**
 * How far apart the two boxes get, and why the travel is only ten centimetres
 * when a real bellows opens by half a metre.
 *
 * The treble side is strapped to the player and the bass side rides the
 * bellows, so whatever the bellows does, the *left hand* has to live with —
 * and `resolve` is required to be pure, so the bass-button contacts cannot
 * follow it. The first version ran 0.06 to 0.30 about a neutral of 0.18, which
 * put the buttons up to **13 cm** from the hand placed on them: at one end of
 * every phrase the left hand was out in the air beside the instrument, which is
 * what "the hands are not on both sides" looks like from the stalls.
 *
 * So the translation is small and the *fan* does the acting. A bellows hinged
 * along its bottom edge opens like a book, and the wedge of daylight along the
 * top reads as breath from the back of the room at a fraction of the hand
 * error. Between them the buttons never stray more than about 5 cm from the
 * hand, which is a hand shifting under its strap rather than a hand adrift.
 */
const BELLOWS_SHUT = 0.145;
const BELLOWS_NEUTRAL = 0.185;
const BELLOWS_OPEN = 0.225;
/** The fan angle at full stretch, radians, about the bottom edge. */
const BELLOWS_FAN = 0.055;
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

/**
 * Where the bass side of the box is when the bellows are `width` open.
 *
 * One function, called by `update` every frame and *once* at build time to
 * place the button contacts. That is the only way the hand and the buttons stay
 * together: two expressions of the same motion drift the moment either is
 * touched, and this one is a rotation about a hinge, which is exactly the kind
 * of thing that gets re-derived slightly differently the second time.
 *
 * The hinge is the bottom edge of the treble box's inner face, so opening tips
 * the bass side out and *down* — the way an accordion sags on a standing
 * player as the left arm pulls.
 */
const HINGE_X = TREBLE_INNER_X;
const HINGE_Y = -BOX_H / 2;

function bellowsFan(width: number): number {
  const t = (width - BELLOWS_SHUT) / (BELLOWS_OPEN - BELLOWS_SHUT);
  return -BELLOWS_FAN * (t < 0 ? 0 : t > 1 ? 1 : t);
}

/**
 * The frame of the pleat (or the bass box) that sits `reach` along the bellows,
 * fanned by `angle`, into `out`.
 */
function bellowsFrame(reach: number, angle: number, out: Matrix4): Matrix4 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const rx = reach;
  const ry = -HINGE_Y;   // every box is centred on the axis, half a box up
  out.makeRotationZ(angle);
  return out.setPosition(HINGE_X + rx * c - ry * s, HINGE_Y + rx * s + ry * c, 0);
}

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
  pleatsA.name = 'bellows:pleats';
  pleatsA.castShadow = true;

  /**
   * How long the box takes to travel, in beats.
   *
   * Three beats, not the half a beat this used to ease over. `choreograph.ts`
   * emits one squeeze per phrase and alternates the direction, so a slow ease
   * spends the whole phrase on its way and the bellows is *always* moving — it
   * opens through one phrase and closes through the next, which is what a
   * bellows is for. A fast ease made the same gestures read as a twitch
   * followed by a long freeze, which is the "jittering" that was reported.
   */
  const bellows = new Eased(3.0, BELLOWS_NEUTRAL);

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
  buttonMesh.name = 'keys:bass-buttons';
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

  function place(local: Vector3, normal: Vector3, along: Vector3): Contact {
    return {
      position: local.clone().applyMatrix4(bodyMatrix),
      normal: normal.clone().applyQuaternion(bodyQuat).normalize(),
      along: along.clone().applyQuaternion(bodyQuat).normalize(),
    };
  }

  const OUT_TREBLE = new Vector3(-0.97, 0, 0.24);
  const OUT_BASS = new Vector3(0.97, 0, -0.24);
  /**
   * The knuckle line, and it is vertical on both sides of this instrument.
   *
   * Four fingers sit on four adjacent treble keys, and those are stacked *up*
   * the side of the box rather than across a bed — so the axis that runs
   * across the keys is `y`, not `x` as it is on every other keyboard here.
   * The two directions are opposite because the rig reads this as the hand's
   * own `+x`: `+y` on the treble side and `-y` on the bass side is what puts
   * both thumbs up and both sets of fingers pointing at the audience, which is
   * how an accordionist's hands sit.
   */
  const UP_KEYBOARD = new Vector3(0, 1, 0);
  const DOWN_BUTTONS = new Vector3(0, -1, 0);

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
      OUT_TREBLE, UP_KEYBOARD,
    ));
  }

  /**
   * The bass buttons, through the *same* transform `update` will drive the box
   * with, evaluated at the neutral bellows. Half the travel either side of this
   * is what the left hand has to absorb, and the numbers at the top of the file
   * are chosen so that it is about five centimetres.
   */
  const bassNeutral = bellowsFrame(BELLOWS_NEUTRAL, bellowsFan(BELLOWS_NEUTRAL), new Matrix4());
  function onBassSide(local: Vector3, normal: Vector3, along: Vector3): Contact {
    return place(local.clone().applyMatrix4(bassNeutral), normal, along);
  }
  for (let midi = BASS_LOW; midi <= BASS_HIGH; midi++) {
    contacts.set(midi, onBassSide(
      new Vector3(BASS_DEPTH + 0.016, bassY(midi), BASS_ROW_Z), OUT_BASS, DOWN_BUTTONS,
    ));
  }

  /**
   * Where the *body* leans at either end of the travel — `bellows` gestures go
   * to the torso, not to a hand (`choreograph.ts` says why: it is the whole
   * left arm that opens the box). Taken at the strap, which is the part of the
   * instrument the pull is actually applied to.
   */
  function strapContact(width: number): Contact {
    const frame = bellowsFrame(width, bellowsFan(width), new Matrix4());
    return place(
      new Vector3(BASS_DEPTH + 0.035, 0, 0).applyMatrix4(frame), OUT_BASS, DOWN_BUTTONS,
    );
  }
  const BELLOWS_PULLED = strapContact(BELLOWS_OPEN);
  const BELLOWS_PUSHED = strapContact(BELLOWS_SHUT);

  /**
   * Resting hands, one per side — and this is the other half of "the hands are
   * on both sides".
   *
   * There used to be a single `rest` contact, on the treble side, so the moment
   * the part went quiet *both* hands drifted onto the keyboard and the accordion
   * was being played like a small piano. `resolve` is handed the effector
   * precisely so a two-sided instrument can answer twice.
   */
  const REST_TREBLE = place(
    new Vector3(TREBLE_OUTER_X - 0.075, -0.02, KEY_PIVOT_Z + WHITE_L * 0.72),
    OUT_TREBLE, UP_KEYBOARD,
  );
  const REST_BASS = onBassSide(
    new Vector3(BASS_DEPTH + 0.030, 0.02, BASS_ROW_Z), OUT_BASS, DOWN_BUTTONS,
  );

  const moving = new Set<Pressable>();
  const KEY_DIP = 0.10;      // radians at the key pivot
  const BUTTON_DIP = 0.006;  // metres straight in

  /**
   * A contact belongs to the model, so nothing outside gets a reference to one
   * it could write through. Cheap: three vectors, and `resolve` is called a few
   * times per frame, not a few thousand.
   */
  function copy(c: Contact | undefined): Contact | undefined {
    if (!c) return undefined;
    return { position: c.position.clone(), normal: c.normal.clone(), along: c.along!.clone() };
  }

  const model: InstrumentModel = {
    archetype: 'accordion',
    root,

    resolve(point: PlayPoint, effector?: Effector): Contact | undefined {
      switch (point.kind) {
        case 'key':
          return copy(contacts.get(point.midi));
        case 'bellows':
          return copy(point.open ? BELLOWS_PULLED : BELLOWS_PUSHED);
        case 'rest':
          // The left hand never leaves the bass side; everything else that
          // idles on this instrument is the right hand on the keyboard.
          return copy(effector === 'left-hand' ? REST_BASS : REST_TREBLE);
        default:
          return undefined;
      }
    },

    react(point: PlayPoint, force: number, now: number): void {
      if (point.kind === 'bellows') {
        // A hard phrase uses the whole box and a quiet one breathes shallowly,
        // which is the dynamic range of the instrument made visible. The
        // destination is a *fraction of the full travel* rather than a distance
        // added to neutral: a squeeze that stopped short of where the arm was
        // going left the box and the arm disagreeing about the same phrase.
        const f = force < 0 ? 0 : force > 1 ? 1 : force;
        const reach = 0.45 + 0.55 * f;
        bellows.set(now, point.open
          ? BELLOWS_NEUTRAL + (BELLOWS_OPEN - BELLOWS_NEUTRAL) * reach
          : BELLOWS_NEUTRAL - (BELLOWS_NEUTRAL - BELLOWS_SHUT) * reach);
        return;
      }
      if (point.kind !== 'key') return;
      const p = pressables.get(point.midi);
      if (!p) return;
      p.hit.fire(now, force);
      moving.add(p);
    },

    update(now: number): void {
      // A slow drift on top of whatever the gestures asked for. An accordion
      // with a perfectly still bellows is an accordion nobody is breathing
      // through, and that reads as broken rather than as calm — but it is a
      // *breath*, a fifth of a cycle per beat, not a shiver.
      const drift = Math.sin(now * 0.18 * Math.PI * 2) * 0.007;
      const w = Math.max(BELLOWS_SHUT, Math.min(BELLOWS_OPEN, bellows.value(now) + drift));
      const fan = bellowsFan(w);

      // Each pleat takes its share of the fold, so the pleats stay evenly
      // spaced along the arc and their faces splay: a bellows opens like a book
      // rather than like a drawer, and the wedge along the top edge is most of
      // what makes the motion read at a distance.
      const step = w / PLEATS;
      let a = 0;
      let b = 0;
      for (let i = 0; i < PLEATS; i++) {
        bellowsFrame(step * (i + 0.5), fan * ((i + 0.5) / PLEATS), scratch);
        if (i % 2 === 0) pleatsA.setMatrixAt(a++, scratch);
        else pleatsB.setMatrixAt(b++, scratch);
      }
      pleatsA.instanceMatrix.needsUpdate = true;
      pleatsB.instanceMatrix.needsUpdate = true;

      bellowsFrame(w, fan, scratch);
      bassSide.position.setFromMatrixPosition(scratch);
      bassSide.rotation.z = fan;

      if (moving.size > 0) {
        let whiteDirty = false;
        let blackDirty = false;
        let buttonDirty = false;
        for (const p of moving) {
          // A free reed sounds for as long as the key is held and the return is
          // a spring, not a hammer — slower than a piano's key and about the
          // same as an organ's, which is the instrument this one is.
          const env = p.hit.level(now, 0.45);
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
