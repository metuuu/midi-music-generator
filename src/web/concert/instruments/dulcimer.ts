/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Hammered dulcimer — the mallet instrument that is not a row of bars.
 *
 * A trapezoid soundbox on a stand, thirty-two courses of wire running across
 * it, two bridges standing on the soundboard, and a pair of spoon hammers.
 * `mallets` staged it for as long as it had no model of its own, and that
 * borrow got exactly one thing right — two beaters over a row of pitches — and
 * everything else wrong: no bars, no resonators, no motor, no pedal, and a
 * pitch layout that is not a keyboard and never has been.
 *
 * Five genres cast it and two of them sit on the floor to play it, which is why
 * `ARCHETYPES.dulcimer` carries `lap` and this file builds two heights of the
 * same object. See `postureFor` in `cast.ts` for the other half.
 *
 * ## The layout, which is the whole instrument
 *
 * Strings run **left to right**; courses are stacked in depth with the low ones
 * nearest the player and pitch rising away. Two bridges stand on the
 * soundboard, and a course is stopped by the bridge it sits on:
 *
 *  - A **bass course** passes over the bass bridge, on the player's left, and is
 *    struck to the *right* of it — in the wide middle of the instrument.
 *  - A **treble course** passes over the treble bridge, further right, and is
 *    struck on *either side of it*, sounding two different pitches a fifth
 *    apart. The left side — again the middle of the instrument — is the higher
 *    of the two.
 *
 * So the middle of the soundboard carries the bottom octave and the top octave
 * interleaved, and the narrow strip on the right carries the octave between
 * them. That is genuinely how a hammered dulcimer is laid out, it is why a
 * player's hands cross back and forth over one small area rather than tracking
 * the pitch, and it is the single most legible thing about watching one played.
 *
 * Thirteen bass courses cover 55–67. Nineteen treble courses sound 68–86 struck
 * right of the treble bridge and 75–93 struck left of it, which is the same
 * fifth stated twice: course *i* gives `68 + i` on one side and `75 + i` on the
 * other. The two ranges overlap by an octave, exactly as a real instrument's do,
 * and `resolve` has to pick one — it takes the right-hand side up to 80 and the
 * left-hand side from 81, so each octave of the part has one place it is played
 * and a run does not flicker between two.
 *
 * **What this is not.** A real hammered dulcimer is diatonic, with a course per
 * scale degree and accidentals it simply does not have; a cimbalom is chromatic
 * and is the concert instrument this is really shaped like. The catalogue writes
 * chromatic lines anywhere in [55, 93] and `resolve` may not answer `undefined`
 * for a third of them, so every course here is a semitone from its neighbour.
 * The bridges, the fifth and the crossing hands are the instrument; the tuning
 * is a cimbalom's.
 *
 * Build frame: `+x` is the player's left and the bass end, `-z` is toward the
 * player, `+y` up — the same conventions `mallets.ts` uses, so a pair of hands
 * that can play one can play the other.
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

/** G3..A6 — exactly what `ARCHETYPES.dulcimer` and `RANGE_OF.dulcimer` declare. */
const LOW = 55;
const HIGH = 93;

/** The bottom octave, one course each, struck right of the bass bridge. */
const BASS_COURSES = 13;
/** And the courses that are read twice. See the header. */
const TREBLE_COURSES = 19;
/** What the treble bridge is worth: the left side is a fifth above the right. */
const TREBLE_RIGHT_LOW = 68;
const TREBLE_LEFT_LOW = TREBLE_RIGHT_LOW + 7;
/** Above this the left-hand side is used, below it the right. */
const SIDE_SPLIT = 81;

const SLOTS = BASS_COURSES + TREBLE_COURSES;

/**
 * The trapezoid, in metres. The near edge is the long one because the near
 * courses are the low ones and a low course needs a long string — which is the
 * whole reason this instrument is the shape it is.
 */
const HALF_NEAR = 0.50;
const HALF_FAR = 0.30;
const Z_NEAR = -0.22;
const Z_FAR = 0.20;
/** How deep the box is, top face to bottom. */
const BOX_H = 0.085;

/** How far a hammer descends onto the wire, off vertical. See `UP` in the seam. */
const HAMMER_DROP = (30 * Math.PI) / 180;

/** Where the strings sit above the boards, standing and on the floor. */
const STRING_Y_STAND = 0.780;
const STRING_Y_FLOOR = 0.340;
/**
 * And how far under them the soundboard is — which is a bridge's height, not a
 * clearance. The strings run *over the tops of the bridges*, so the board, the
 * bridge and the string plane are three numbers that have to agree or the wire
 * passes through the thing that is supposed to be holding it up.
 */
const BRIDGE_H = 0.030;
const CAP_H = 0.012;
const BOARD_DROP = BRIDGE_H + 0.002;

/**
 * Where the bridges and the two strike zones sit, as fractions of the local
 * half-width — so all four slant inward with the sides and none of them walks
 * off the end of a short course.
 */
const BASS_BRIDGE_F = 0.60;
const TREBLE_BRIDGE_F = -0.12;
/** Between the two bridges: the bass courses and the treble courses' left side. */
const MIDDLE_F = 0.24;
/** And right of the treble bridge, the narrow strip. */
const RIGHT_F = -0.58;

const mix = (lo: number, hi: number, t: number): number => lo + (hi - lo) * t;

/** How far back a slot sits, 0 at the near edge and 1 at the far one. */
function slotT(slot: number): number {
  return SLOTS > 1 ? slot / (SLOTS - 1) : 0;
}
function slotZ(slot: number): number {
  return mix(Z_NEAR, Z_FAR, slotT(slot));
}
function halfWidthAt(slot: number): number {
  return mix(HALF_NEAR, HALF_FAR, slotT(slot));
}

/**
 * Which depth slot each course takes.
 *
 * Bass and treble courses **interleave**, which is not decoration: on a real
 * instrument they share one soundboard and each bass course sits between two
 * treble courses, passing under the treble bridge's cap on its way across. Two
 * separate ramps would read as two instruments pushed together. The bass ramp
 * runs out after thirteen, so the last six slots are treble alone — which is
 * also true, and is the far corner where the courses are shortest.
 */
function trebleSlot(i: number): number {
  return i < BASS_COURSES ? i * 2 : BASS_COURSES * 2 + (i - BASS_COURSES);
}
function bassSlot(j: number): number {
  return j * 2 + 1;
}

/** Where a course is struck, and on which side of its bridge. */
interface Station {
  slot: number;
  /** Fraction of the local half-width. See `MIDDLE_F` and `RIGHT_F`. */
  fx: number;
}

/**
 * The pitch layout, and the only place it is written down.
 *
 * Total over `[LOW, HIGH]` by construction — every semitone in the archetype's
 * range lands on a course, which is what stops a third of a chromatic part
 * putting a hammer nowhere. See the header for what that costs.
 */
function stationFor(midi: number): Station | undefined {
  if (!Number.isInteger(midi) || midi < LOW || midi > HIGH) return undefined;
  if (midi < TREBLE_RIGHT_LOW) {
    return { slot: bassSlot(midi - LOW), fx: MIDDLE_F };
  }
  if (midi < SIDE_SPLIT) {
    return { slot: trebleSlot(midi - TREBLE_RIGHT_LOW), fx: RIGHT_F };
  }
  return { slot: trebleSlot(midi - TREBLE_LEFT_LOW), fx: MIDDLE_F };
}

/**
 * How long a struck course keeps moving, in beats, near to far.
 *
 * Wire, not wood: a dulcimer's bass courses ring on and on — it is an
 * undamped instrument and the wash of everything still sounding is what it is
 * loved and complained about in equal measure — while a top course is short,
 * tight and quick. The amplitude is a tenth of a bar's, because a string moves
 * a millimetre and a bar moves five, and it flickers many times faster.
 */
const RING_NEAR = 2.6;
const RING_FAR = 0.9;
const SWING_NEAR = 0.0022;
const SWING_FAR = 0.0008;
const FLICKER_NEAR = 7.0;
const FLICKER_FAR = 13.0;

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

/** The soundbox: a trapezoid extruded downward, top face at `y = 0`. */
function boxGeometry(): BufferGeometry {
  const shape = new Shape();
  shape.moveTo(HALF_NEAR, Z_NEAR);
  shape.lineTo(HALF_FAR, Z_FAR);
  shape.lineTo(-HALF_FAR, Z_FAR);
  shape.lineTo(-HALF_NEAR, Z_NEAR);
  shape.closePath();
  const geo = new ExtrudeGeometry(shape, { depth: BOX_H, bevelEnabled: false });
  // The shape is drawn in xz and extruded along its own +z; this turns that
  // into "lying flat, growing downward" — shape y becomes world z, and the
  // extrusion becomes world -y, so the face at depth 0 is the soundboard.
  geo.rotateX(Math.PI / 2);
  return geo;
}

export const buildDulcimer: InstrumentBuilder = (opts) => {
  const rng = new Rng(`dulcimer:${opts.seed}`);
  const root = new Group();
  root.name = 'dulcimer';

  /**
   * On a stand, or across the lap of somebody cross-legged on a carpet.
   *
   * The same object either way — this is not a smaller dulcimer — so only the
   * height moves and the legs stop being built. A santoor on the floor with a
   * trestle still under it would be the borrowed-object error again, one
   * archetype further on.
   */
  const floor = opts.posture === 'floor';
  const stringY = floor ? STRING_Y_FLOOR : STRING_Y_STAND;
  const boardY = stringY - BOARD_DROP;

  const woodColour = opts.finish ?? rng.pick(['#7a4a28', '#8b5a2f', '#5d3a20']);
  const bodyMat = new MeshStandardMaterial({ color: woodColour, roughness: 0.55, metalness: 0.04 });
  const boardMat = new MeshStandardMaterial({ color: '#c39a63', roughness: 0.5, metalness: 0.03 });
  const bridgeMat = new MeshStandardMaterial({ color: '#3a2515', roughness: 0.45, metalness: 0.05 });
  const wireMat = new MeshStandardMaterial({ color: '#cdd2d6', roughness: 0.25, metalness: 0.85 });
  const pinMat = new MeshStandardMaterial({ color: '#8d8f93', roughness: 0.4, metalness: 0.7 });
  const holeMat = new MeshStandardMaterial({ color: '#231710', roughness: 0.9, metalness: 0 });

  const scratch = new Matrix4();
  const noRot = new Quaternion();
  const unitY = new Vector3(0, 1, 0);

  // --- Soundbox ------------------------------------------------------------

  const box = addTo(root, new Mesh(boxGeometry(), bodyMat));
  box.position.y = boardY;
  box.castShadow = true;
  box.receiveShadow = true;

  /**
   * The soundboard, a shade proud of the box and a lighter wood.
   *
   * A dulcimer's top is a thin spruce or ply sheet let into a hardwood frame,
   * and the two are visibly different timbers. One flat plate at 2 mm reads as
   * that from any distance that matters, and it is what the roses are cut into.
   */
  const boardGeo = boxGeometry();
  boardGeo.scale(0.965, 0.024, 0.955);
  const board = addTo(root, new Mesh(boardGeo, boardMat));
  board.position.y = boardY + 0.002;
  board.receiveShadow = true;

  /**
   * Two roses. Under the courses, which is where a rose is — and a millimetre
   * *above* the board rather than flush with it, because two faces at one
   * height is a shimmer rather than a rosette.
   */
  for (const [fx, slot] of [[-0.30, 6], [-0.30, 20]] as const) {
    const rose = addTo(root, new Mesh(new CylinderGeometry(0.038, 0.038, 0.002, 16), holeMat));
    rose.position.set(fx * halfWidthAt(slot), boardY + 0.004, slotZ(slot));
  }

  // --- Bridges -------------------------------------------------------------

  /**
   * A bridge is a rail standing on the board, slanting inward with the sides,
   * with a cap where each of its own courses crosses it. The caps are what a
   * bridge is *for* — they set the speaking length — and they are also what
   * makes the two rails read as different objects rather than as two sticks.
   */
  function bridge(fx: number, slots: number[]): void {
    const a = new Vector3(fx * HALF_NEAR, boardY, Z_NEAR + 0.02);
    const b = new Vector3(fx * HALF_FAR, boardY, Z_FAR - 0.02);
    const dir = b.clone().sub(a);
    const rail = addTo(root, new Mesh(
      new BoxGeometry(0.022, BRIDGE_H, Math.max(dir.length(), 1e-4)), bridgeMat,
    ));
    rail.position.copy(a).add(b).multiplyScalar(0.5);
    rail.position.y = boardY + BRIDGE_H / 2;
    rail.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), dir.clone().normalize());
    rail.castShadow = true;

    // Crowns, centred so their tops reach the string plane: the wire sits *in*
    // one of these, and the two heights are `BOARD_DROP` apart by construction.
    const caps = addTo(root, new InstancedMesh(
      new CylinderGeometry(0.010, 0.012, CAP_H, 8), bridgeMat, slots.length,
    ));
    slots.forEach((slot, i) => {
      scratch.makeTranslation(
        fx * halfWidthAt(slot), stringY - CAP_H / 2 + 0.002, slotZ(slot),
      );
      caps.setMatrixAt(i, scratch);
    });
    caps.instanceMatrix.needsUpdate = true;
  }
  const trebleSlots: number[] = [];
  const bassSlots: number[] = [];
  for (let i = 0; i < TREBLE_COURSES; i++) trebleSlots.push(trebleSlot(i));
  for (let j = 0; j < BASS_COURSES; j++) bassSlots.push(bassSlot(j));
  bridge(BASS_BRIDGE_F, bassSlots);
  bridge(TREBLE_BRIDGE_F, trebleSlots);

  // --- Courses -------------------------------------------------------------

  /**
   * Three wires to a course, which is why a dulcimer is loud enough to be heard
   * beside anything, and why a course reads as a band of light rather than as a
   * line. One instanced mesh for all ninety-six of them; `update` rewrites only
   * the strings of courses that are actually ringing.
   */
  const PER_COURSE = 3;
  const wireGeo = new BoxGeometry(1, 0.0016, 0.0016);
  const wires = addTo(root, new InstancedMesh(wireGeo, wireMat, SLOTS * PER_COURSE));
  wires.name = 'courses';

  interface Course {
    slot: number;
    /** Rest positions of this course's wires, in instance order. */
    homes: Vector3[];
    span: number;
    hit: Hit;
    ring: number;
    swing: number;
    flicker: number;
  }
  const courses: Course[] = [];
  for (let slot = 0; slot < SLOTS; slot++) {
    const t = slotT(slot);
    const span = halfWidthAt(slot) * 2 - 0.055;
    const z = slotZ(slot);
    const homes: Vector3[] = [];
    for (let w = 0; w < PER_COURSE; w++) {
      const home = new Vector3(0, stringY, z + (w - 1) * 0.0045);
      homes.push(home);
      scratch.compose(home, noRot, new Vector3(span, 1, 1));
      wires.setMatrixAt(slot * PER_COURSE + w, scratch);
    }
    courses.push({
      slot, homes, span, hit: new Hit(),
      ring: mix(RING_NEAR, RING_FAR, t),
      swing: mix(SWING_NEAR, SWING_FAR, t),
      flicker: mix(FLICKER_NEAR, FLICKER_FAR, t),
    });
  }
  wires.instanceMatrix.needsUpdate = true;

  // --- Pin blocks ----------------------------------------------------------

  /**
   * A pin per course at each end, along the two slanting sides. They are the
   * reason the sides of a dulcimer glitter, and without them the wires appear
   * to end in mid-air a centimetre short of the frame.
   */
  const PIN_H = 0.040;
  const pinGeo = new CylinderGeometry(0.0035, 0.0045, PIN_H, 6);
  const pins = addTo(root, new InstancedMesh(pinGeo, pinMat, SLOTS * 2));
  for (let slot = 0; slot < SLOTS; slot++) {
    const inset = halfWidthAt(slot) - 0.018;
    for (const [i, x] of [inset, -inset].entries()) {
      // Driven into the board and standing proud of the wire it carries, which
      // is the only arrangement in which a string can be wound onto one.
      scratch.makeTranslation(x, boardY + PIN_H / 2 - 0.004, slotZ(slot));
      pins.setMatrixAt(slot * 2 + i, scratch);
    }
  }
  pins.instanceMatrix.needsUpdate = true;

  // --- Stand ---------------------------------------------------------------

  /**
   * Four splayed legs and a stretcher between each pair, which is the stand a
   * dulcimer is sold with. Absent on the floor: there the box is on the
   * player's crossed legs and a trestle underneath it would be nonsense.
   */
  if (!floor) {
    const legGeo = new CylinderGeometry(0.016, 0.022, 1, 8);
    legGeo.translate(0, -0.5, 0);
    const legTop = boardY - BOX_H;
    /** How far a foot lands outside the corner it hangs from. */
    const SPLAY = 0.07;

    /** A rod between two points, which is all a stretcher is. */
    function strut(a: Vector3, b: Vector3, r: number): void {
      const dir = b.clone().sub(a);
      const rod = addTo(root, new Mesh(
        new CylinderGeometry(r, r, Math.max(dir.length(), 1e-4), 6), bodyMat,
      ));
      rod.position.copy(a).add(b).multiplyScalar(0.5);
      rod.quaternion.setFromUnitVectors(unitY, dir.clone().normalize());
    }

    for (const sx of [1, -1]) {
      const feet: Vector3[] = [];
      for (const [sz, hw] of [[Z_NEAR + 0.07, HALF_NEAR], [Z_FAR - 0.07, HALF_FAR]] as const) {
        const top = new Vector3(sx * (hw - 0.09), legTop, sz);
        const leg = addTo(root, new Mesh(legGeo, bodyMat));
        leg.position.copy(top);
        leg.scale.y = legTop;
        // Splayed outward, so the stand is wider on the boards than the box is.
        // A vertical leg under a metre of plank is a table waiting to go over
        // the first time somebody leans on it. The rotation is about `z` and
        // signed by the side, so both feet move away from the centre line.
        leg.rotation.z = sx * SPLAY;
        leg.castShadow = true;
        feet.push(new Vector3(top.x + sx * legTop * Math.sin(SPLAY), 0, sz));
      }
      // Between the two legs of one side, a little under half way down — where
      // a stretcher goes, and joining the legs where they actually are rather
      // than where an unsplayed pair would have been.
      const [near, far] = feet as [Vector3, Vector3];
      const t = 0.55;
      strut(
        new Vector3(sx * (HALF_NEAR - 0.09), legTop, Z_NEAR + 0.07).lerp(near, t),
        new Vector3(sx * (HALF_FAR - 0.09), legTop, Z_FAR - 0.07).lerp(far, t),
        0.012,
      );
    }
  }

  // --- The seam ------------------------------------------------------------

  const moving = new Set<Course>();
  /**
   * Which way a hammer meets the wire: the palm normal leans away from the
   * player by `HAMMER_DROP`, which pitches the fingers, and the shaft with
   * them, down onto the course. A flat normal laid the hammer along the
   * strings, and the rig, which parks the fist a shaft's length behind the
   * tip, put a seated player's hands at hip height behind the near edge.
   */
  const UP = new Vector3(0, Math.cos(HAMMER_DROP), Math.sin(HAMMER_DROP));
  /**
   * Knuckles across the courses, so a hammer runs away from the player and
   * lands on one course rather than lying along three. Same axis and same
   * reason as `mallets.ts`; the courses here run the way a vibraphone's row
   * does, so the hands hold the same line.
   */
  const ACROSS = new Vector3(1, 0, 0);
  const scale = new Vector3();

  const model: InstrumentModel = {
    archetype: 'dulcimer',
    root,

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        /**
         * Both hammers over the middle of the board — one answer for both, and
         * deliberately one, for the reason `mallets.ts` gives at length: a pure
         * `resolve` cannot know which end of the instrument this number lives
         * at, and `animate.ts` idles a pair of coincident hands over the notes
         * each has actually struck. A guess here would switch that off.
         */
        const slot = Math.floor(SLOTS / 2);
        return {
          position: new Vector3(
            MIDDLE_F * halfWidthAt(slot), stringY + 0.10, slotZ(slot),
          ),
          normal: UP.clone(),
          along: ACROSS.clone(),
        };
      }
      if (point.kind !== 'key') return undefined;
      const station = stationFor(point.midi);
      if (!station) return undefined;
      return {
        position: new Vector3(
          station.fx * halfWidthAt(station.slot), stringY, slotZ(station.slot),
        ),
        normal: UP.clone(),
        along: ACROSS.clone(),
      };
    },

    react(point: PlayPoint, force: number, now: number): void {
      if (point.kind !== 'key') return;
      const station = stationFor(point.midi);
      if (!station) return;
      const course = courses[station.slot];
      if (!course) return;
      course.hit.fire(now, force);
      moving.add(course);
    },

    update(now: number): void {
      if (moving.size === 0) return;
      let dirty = false;
      for (const course of moving) {
        // A struck course swings about its bridge and blurs. It is a small
        // motion and a fast one — the opposite of a bar, which dips a long way
        // slowly — and getting that contrast right is most of what says the
        // thing being hit is wire rather than metal plate.
        const d = course.hit.wobble(now, course.ring, course.flicker) * course.swing;
        scale.set(course.span, 1, 1);
        for (let w = 0; w < PER_COURSE; w++) {
          const home = course.homes[w]!;
          scratch.compose(
            new Vector3(home.x, home.y + d * (w === 1 ? 1 : 0.7), home.z), noRot, scale,
          );
          wires.setMatrixAt(course.slot * PER_COURSE + w, scratch);
        }
        dirty = true;
        if (Math.abs(d) < 1e-6 && now - course.hit.beat > course.ring) moving.delete(course);
      }
      if (dirty) wires.instanceMatrix.needsUpdate = true;
    },

    station: {
      // Closer on the floor, because there the instrument is across the
      // player's own legs rather than on a trestle they stand behind.
      offset: new Vector3(0, 0, Z_NEAR - (floor ? 0.20 : 0.32)),
      facing: 0,
      posture: floor ? 'floor' : 'stand',
    },

    dispose(): void {
      disposeTree(root);
    },
  };

  return model;
};
