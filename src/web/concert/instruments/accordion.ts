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
 * bass side rides the bellows, which is how a real accordion works and is the
 * one fact this model is organised around. `resolve` is required to be pure, so
 * for a long time the bass-button contacts were built once at the neutral and
 * the left hand sat on a point the instrument slid out from under — which is
 * why the travel had to be kept down to a few centimetres to stay plausible.
 *
 * A `key` point now carries how far open the box is when it is struck (see
 * `PlayPoint.bellows`), so the answer is still a pure function of the point and
 * the hand lands on the button *wherever the box has got to*. Every note also
 * retargets the box, so the bellows is driven by the part rather than twitching
 * once a phrase, and the two cannot disagree because they are the same number.
 */

import {
  BoxGeometry, BufferGeometry, CylinderGeometry, Group, InstancedMesh, Material,
  Matrix4, Mesh, MeshStandardMaterial, Object3D, Quaternion, Vector3,
} from 'three';

import type { Effector, GestureKind, PlayPoint } from '../../../concert/types.js';
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
 * How far apart the two boxes get — and this time it is a real bellows.
 *
 * The treble side is strapped to the player and the bass side rides the
 * bellows, so whatever the bellows does, the *left hand* has to live with. That
 * used to cap the travel at eight centimetres end to end: `resolve` is required
 * to be pure, so the bass-button contacts were built once at the neutral, and
 * every millimetre past that was a millimetre of daylight between the hand and
 * the button it was supposed to be pressing.
 *
 * The cap is gone because the constraint is gone. A `key` point now carries how
 * far open the box is when it is struck — see `PlayPoint.bellows` — so the
 * contact is still a pure function of the point and the hand lands on the
 * button *wherever the box has got to*. The hand rides the bass side, which is
 * what a left hand does, and the bellows can be as long as an accordion's.
 *
 * 0.30 m of stretch on a 0.50 m box, plus the fan, is about what one opens to
 * on a standing player before the arm runs out.
 */
const BELLOWS_SHUT = 0.075;
const BELLOWS_OPEN = 0.375;
/**
 * Where the box hangs before anybody has played a note, as a `PlayPoint.bellows`.
 *
 * Matches `BELLOWS_START` in `choreograph.ts` — mostly shut, with the pull
 * still in hand — so the first note of a number does not have to travel to
 * reach the plan, and so the contacts a part choreographed without a bellows
 * plan falls back to are the ones the box is actually at.
 *
 * It is where the box *starts* and not somewhere it ever returns to. Nothing
 * walks it back here between phrases, because the left hand does not come back
 * here either: the runtime idles a hand on the last point it played, bellows
 * value and all, so a box that closed to the neutral under a resting phrase
 * would be a box sliding out from under the hand it is supposed to be carrying.
 */
const NEUTRAL_AT = 0.28;
/** The fan angle at full stretch, radians, about the bottom edge. */
const BELLOWS_FAN = 0.10;
/**
 * How much of the travel a beat of sound spends, until the plan has said.
 *
 * Only ever used for the first note of a number, because the second one gives
 * the model a measurement — see `aim`. `choreograph.ts` spends `AIR_PER_BEAT`
 * scaled by force, and a tenth of the travel is what that comes to at the
 * middling velocity most first notes have.
 */
const AIR_SEED = 0.10;
/** Bounds on the note length the box is run across, in beats. */
const DRIFT_MIN = 0.15;
const DRIFT_MAX = 4;
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
 * `PlayPoint.bellows` — 0 shut, 1 out — as a width in metres.
 *
 * The one place the IR's number becomes geometry. Both the contact the left
 * hand is sent to and the box `update` draws go through it, which is the only
 * reason a hand can be promised to land on a moving button.
 */
function widthAt(open: number): number {
  const t = open < 0 ? 0 : open > 1 ? 1 : open;
  return BELLOWS_SHUT + (BELLOWS_OPEN - BELLOWS_SHUT) * t;
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
  fire(now: number, force: number, hold = 0): void {
    this.beat = now;
    this.force = force < 0 ? 0 : force > 1 ? 1 : force;
    this.hold = Number.isFinite(hold) && hold > 0 ? hold : 0;
  }
  level(now: number, tau: number): number {
    const age = now - this.beat;
    if (age < 0) return 0;
    // Held all the way down, then released. `tau` is the return spring alone.
    if (age <= this.hold) return 1;
    const off = age - this.hold;
    return off > tau * 6 ? 0 : Math.exp(-off / tau);
  }
}

/**
 * Endpoint-and-start easing, so a seek lands in the right place. See drumkit.
 *
 * The span is per `set` rather than per instance, because the one thing on this
 * instrument that eases is the box, and how long the box takes to cross is a
 * fact about the note it is crossing under — see `aim`.
 */
class Eased {
  private from: number;
  private to: number;
  private at = -1e9;
  private span: number;
  constructor(private readonly defaultSpan: number, initial: number) {
    this.from = initial;
    this.to = initial;
    this.span = defaultSpan;
  }
  set(now: number, value: number, span = this.defaultSpan): void {
    this.from = this.value(now);
    this.to = value;
    this.at = now;
    this.span = span > 0 ? span : this.defaultSpan;
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
   * The box, and it crosses **under the note** rather than in a burst after it.
   *
   * The default span is only the fallback for an IR that names an extension
   * without saying how long the note holding it lasts; every real note goes
   * through `aim`, which runs the box over that note's own length.
   *
   * This was a flat half beat for every note, and before that a beat and a
   * half, and the flatness was the whole complaint: a semiquaver's box lurched
   * and a semibreve's finished a fifteenth of the way into the note and then
   * stood still for the rest of it. Neither is a bellows. A free reed spends
   * air *for as long as it sounds*, which is exactly what `hold` measures.
   */
  const bellows = new Eased(0.5, widthAt(NEUTRAL_AT));

  /**
   * The plan, as the model has heard it so far: the last extension a note was
   * struck at, the beat it was struck on, and how long that note held.
   *
   * `bellowsPart` reports `PlayPoint.bellows` as where the box is **when the
   * note lands** and only then spends the note's air, so consecutive values
   * differ by exactly what the note in between cost. Two of them are therefore
   * a measurement of the plan's own spending rate, in travel per beat of
   * *sound* — which is the number needed to keep the box moving through a note
   * whose successor has not been announced yet.
   */
  let planAt = NEUTRAL_AT;
  let planBeat = Number.NEGATIVE_INFINITY;
  let planSpan = 1;
  /** Travel per beat of sound, unsigned. `bellowsDir` is what signs it. */
  let airRate = AIR_SEED;
  /** +1 pulling the box open, −1 pushing it shut. */
  let bellowsDir = 1;
  /**
   * Whether a `bellows` gesture has ever named the direction.
   *
   * It always does in practice — `bellowsPart` places one on every reversal —
   * and the direction has to come from there rather than from the samples,
   * because the step between two extensions is the air the *earlier* note
   * spent and so carries the direction that was in force before the turn. An IR
   * that never places one falls back to reading the samples, which is right up
   * to one note of lag at each reversal.
   */
  let toldDir = false;

  /**
   * Where the box is heading, and how long it has to get there.
   *
   * Called once per note with that note's extension and length. The target is
   * the extension *plus the air this note is about to spend*, so the box is at
   * the plan's own number on the beat — which is where the left hand has just
   * been placed — and travels on through the note instead of arriving at the
   * end of a burst and waiting. Nothing snaps: `Eased.set` re-bases from
   * wherever the box actually is, so a prediction that came out slightly wrong
   * is corrected across the next note rather than jumped.
   */
  function aim(now: number, at: number, span: number): void {
    const s = Math.min(Math.max(
      Number.isFinite(span) && span > 0 ? span : planSpan, DRIFT_MIN,
    ), DRIFT_MAX);
    // Only across a real gap: the notes of one chord all arrive on one beat
    // carrying one extension, and a step of zero is not a measurement.
    if (now > planBeat && Number.isFinite(planBeat) && at !== planAt) {
      airRate = Math.abs(at - planAt) / planSpan;
      if (!toldDir) bellowsDir = at > planAt ? 1 : -1;
    }
    planAt = at;
    planBeat = now;
    planSpan = s;
    bellows.set(now, widthAt(at + bellowsDir * airRate * s), s);
  }

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
   * The bass side, through the *same* transform `update` will drive the box
   * with, at whatever extension the caller names.
   *
   * The extension is a parameter and not a constant, and that is the whole of
   * "the hand moves with the accordion". It used to be `BELLOWS_NEUTRAL`,
   * because `resolve` is required to be pure and the model has no way to know
   * what beat it is — so every bass contact was built for a box that was
   * halfway open and the hand sat there while the instrument slid past it. A
   * note now carries the extension it was played at, so the answer is still a
   * pure function of the point and it is the *right* pure function.
   *
   * `scratch` is not used here: this runs at build time and again per resolve,
   * and `update` owns that matrix on the frame path.
   */
  function onBassSide(local: Vector3, normal: Vector3, along: Vector3, open: number): Contact {
    const w = widthAt(open);
    const frame = bellowsFrame(w, bellowsFan(w), new Matrix4());
    return place(local.clone().applyMatrix4(frame), normal, along);
  }
  /** The button's own local position; `onBassSide` puts it where the box is. */
  function bassLocal(midi: number): Vector3 {
    return new Vector3(BASS_DEPTH + 0.016, bassY(midi), BASS_ROW_Z);
  }
  for (let midi = BASS_LOW; midi <= BASS_HIGH; midi++) {
    contacts.set(midi, onBassSide(bassLocal(midi), OUT_BASS, DOWN_BUTTONS, NEUTRAL_AT));
  }

  /**
   * Where the *body* leans on the way to a given extension — `bellows` gestures
   * go to the torso, not to a hand (`choreograph.ts` says why: it is the whole
   * left arm that opens the box). Taken at the strap, which is the part of the
   * instrument the pull is actually applied to.
   */
  function strapContact(open: number): Contact {
    return onBassSide(new Vector3(BASS_DEPTH + 0.035, 0, 0), OUT_BASS, DOWN_BUTTONS, open);
  }
  const BELLOWS_PULLED = strapContact(1);
  const BELLOWS_PUSHED = strapContact(0);

  /**
   * Resting hands, one per side — and this is the other half of "the hands are
   * on both sides".
   *
   * There used to be a single `rest` contact, on the treble side, so the moment
   * the part went quiet *both* hands drifted onto the keyboard and the accordion
   * was being played like a small piano. `resolve` is handed the effector
   * precisely so a two-sided instrument can answer twice.
   *
   * The bass one is at the neutral because a rest carries no extension, and
   * that is only ever asked before the first note of a number — the runtime
   * idles a hand on the last point it played, so once anything has sounded the
   * left hand is answered through `resolve`'s `key` branch with that note's own
   * extension and this contact is not consulted again.
   */
  const REST_TREBLE = place(
    new Vector3(TREBLE_OUTER_X - 0.075, -0.02, KEY_PIVOT_Z + WHITE_L * 0.72),
    OUT_TREBLE, UP_KEYBOARD,
  );
  const REST_BASS_LOCAL = new Vector3(BASS_DEPTH + 0.030, 0.02, BASS_ROW_Z);
  const REST_BASS = onBassSide(REST_BASS_LOCAL, OUT_BASS, DOWN_BUTTONS, NEUTRAL_AT);

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
        case 'key': {
          /**
           * A bass note is answered where the box currently is; a treble note
           * is answered where it always is.
           *
           * And each hand is kept on its own side even when the note is not
           * its own. The runtime asks *both* hands where they idle, and it
           * asks with the last point that was played — so a treble run used to
           * hand the left hand a treble key and drift it round onto the
           * keyboard, which is the accordion being played like a small piano
           * again by a different route.
           */
          const bass = point.midi >= BASS_LOW && point.midi <= BASS_HIGH;
          const open = point.bellows ?? NEUTRAL_AT;
          // A left hand asked about a treble note is the runtime asking where
          // it idles — the answer is the bass side, *at the extension that note
          // was played at*. Returning the fixed neutral here was the last place
          // the hand could still be left behind by the box: the bass line is
          // sparse and the treble is not, so between two bass notes every idle
          // frame was answered from a box that had since travelled.
          if (effector === 'left-hand' && !bass) {
            return copy(onBassSide(REST_BASS_LOCAL, OUT_BASS, DOWN_BUTTONS, open));
          }
          if (effector === 'right-hand' && bass) return copy(REST_TREBLE);
          if (!bass) return copy(contacts.get(point.midi));
          return copy(onBassSide(bassLocal(point.midi), OUT_BASS, DOWN_BUTTONS, open));
        }
        case 'bellows':
          // Where the arm is pulling *to*, when the plan says; the ends of the
          // travel when it does not.
          return copy(point.at === undefined
            ? (point.open ? BELLOWS_PULLED : BELLOWS_PUSHED)
            : strapContact(point.at));
        case 'rest':
          // The left hand never leaves the bass side; everything else that
          // idles on this instrument is the right hand on the keyboard.
          return copy(effector === 'left-hand' ? REST_BASS : REST_TREBLE);
        default:
          return undefined;
      }
    },

    react(
      point: PlayPoint, force: number, now: number,
      _kind?: GestureKind, hold?: number,
    ): void {
      if (point.kind === 'bellows') {
        /**
         * The direction, mostly.
         *
         * A squeeze is placed at a reversal — and at a reversal the *samples*
         * still describe the old direction, because the step between two of
         * them is the air the note before the turn spent. So this is the one
         * thing about the box the model cannot work out for itself.
         *
         * It aims as well, and then the note sharing this beat aims again over
         * its own length and wins. The double call is deliberate: the note
         * carries the identical extension but knows how long the sound it is
         * paying for lasts, where a squeeze only has its own two-beat
         * follow-through — and a squeeze that arrived without one would
         * otherwise leave the box parked.
         *
         * The old version derived a destination from the *force* of the
         * gesture — a hard phrase used the whole box, a quiet one breathed
         * shallowly — which is a good instinct about dynamics and the wrong
         * place for it. It made the box's position a function of how loud the
         * squeeze was rather than of how much air had been spent, so the arm
         * and the box could not be given a shared answer and the left hand had
         * nothing to ride. The dynamics survive: `choreograph.ts` spends air
         * faster on a loud passage, so a loud phrase still crosses more of the
         * bellows. It simply decides that once, for both of us.
         */
        toldDir = true;
        bellowsDir = point.open ? 1 : -1;
        // No plan to ride, so there is nothing to drift toward: an IR that
        // names only a direction gets the end of the travel, as it always did.
        if (point.at === undefined) bellows.set(now, widthAt(point.open ? 1 : 0));
        else aim(now, point.at, hold ?? planSpan);
        return;
      }
      if (point.kind !== 'key') return;
      // Every sounding note moves the box, which is the difference between an
      // instrument that is being played and a prop that twitches once a phrase.
      // The extension is the one the hand on the buttons was placed at, and the
      // note's own length is how long the box has to spend its air over.
      if (point.bellows !== undefined) aim(now, point.bellows, hold ?? planSpan);
      const p = pressables.get(point.midi);
      if (!p) return;
      p.hit.fire(now, force, hold);
      moving.add(p);
    },

    update(now: number): void {
      // Where the plan says the box is, and nothing else on top of it.
      //
      // There used to be a slow sine here — an accordion with a perfectly still
      // bellows is an accordion nobody is breathing through — and it was seven
      // millimetres of wander the left hand had no way to follow. Everything
      // the box does now is a consequence of the plan, which is the same plan
      // the hand is placed from: the hand and the button meet exactly on the
      // beat and part by at most one note's air before the next note brings
      // them back together, where an ornament on this side would never close.
      // The notes keep it alive without one: every one of them names an
      // extension and pays for a note's worth of travel.
      const w = bellows.value(now);
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
