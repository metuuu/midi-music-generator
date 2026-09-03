/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Harp — eighty strings, one per note, and no stopping hand at all.
 *
 * The odd one out in the string family. Every other instrument here resolves a
 * pitch to *a string plus a length of it*; a harp resolves a pitch to a whole
 * string, so `ARCHETYPES.harp` carries neither `strings` nor `frets` and there
 * is no fret rule in this file. What there is instead is a fan: the strings run
 * between a straight line and a curve — the soundboard and the neck — and the
 * gap between them shrinks from a metre and a half at the bass end to 9 cm at
 * the treble, so the bass strings are long and low and near the column and the
 * treble ones are short and high and by the player's shoulder. That fan is the
 * harp's whole silhouette, and the curved half of it is why a harp is not a
 * triangle.
 *
 * Eighty strings is also the one place in this family where instancing is not
 * optional: they are one `InstancedMesh` and one draw call, and `update` only
 * rewrites the matrices of strings that are actually ringing.
 *
 * ## The frame, which is a quadrilateral and stands on its narrow end
 *
 * Four corners, and getting their heights right is most of the silhouette:
 *
 *  - the **column** foot and the **soundbox** foot, a hand's breadth apart on
 *    the base — the frame's narrow end is on the floor;
 *  - the **column top**, `COLUMN_TOP`, which is the highest point of the whole
 *    instrument;
 *  - the **treble corner**, `SOUND_HIGH`, where the soundbox meets the tip of
 *    the neck, some 60 cm lower.
 *
 * The neck therefore *descends* from the column to the soundbox. This file used
 * to have that upside down — a 1.03 m column with the neck climbing 41 cm above
 * it, on a base 0.90 m long — which gave a fan splayed out across a squat,
 * wide, sail-shaped thing. The bass strings of a harp run nearly parallel to
 * the column because both of them are nearly vertical and their feet are close
 * together, and no arrangement with a long base and a short column can produce
 * that.
 *
 * ## Build frame, and where the player is
 *
 * `+x` runs from the column toward the treble corner — bass → treble, and also
 * *back toward the player*. `+y` is up. `+z` is out of the string plane on the
 * side the soundboard faces, which, once there is somebody sitting at it, is the
 * player's left: the left hand works from there and the right hand from `-z`.
 *
 * There is no mount matrix: the harp's own frame **is** the model frame, and
 * every fact about how it meets a person lives in `station`. See the note there
 * — the player sits along the plane rather than square to it, which is the one
 * thing about a harp that a piano's or a drum kit's intuition gets wrong.
 */

import {
  BoxGeometry, type BufferGeometry, CatmullRomCurve3, Color, CylinderGeometry,
  Group, InstancedMesh, type Material, Matrix4, Mesh, MeshStandardMaterial,
  Quaternion, TubeGeometry, Vector3,
} from 'three';

import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import {
  addTo, type Contact, type InstrumentBuilder, type InstrumentModel,
  type PlayerStation,
} from './types.js';

/** `ARCHETYPES.harp.range` is [24, 103]: eighty strings, chromatic. */
const LOWEST_MIDI = 24;
const COURSES = 80;

/** The column: a post from the base to the top of the instrument. */
const COLUMN_FOOT = new Vector3(0.00, 0.09, 0);
const COLUMN_TOP = new Vector3(0.16, 1.845, 0);

/**
 * Where the outermost strings leave the soundboard, bass end and treble end.
 *
 * Not the ends of the board. A harp's soundboard runs on below its lowest
 * string — that stretch is the wide bottom of the box, and `BOX_DROP` carries
 * the wood down past it into the base.
 */
const SOUND_LOW = new Vector3(0.310, 0.328, 0);
const SOUND_HIGH = new Vector3(0.741, 1.182, 0);

/**
 * The neck, and it is **the line the strings actually end on**.
 *
 * This curve used to be built down in the builder as decoration while `headOf`
 * interpolated a straight chord, and the two did not agree: the strings stopped
 * short of the wood they are tied to across the whole middle of the fan. A
 * harp's neck is curved *because* the string lengths follow it, so the curve is
 * the definition and `headOf` reads it rather than guessing a chord past it.
 * Heads are spaced by arc length, which is also how a harp is strung: the pins
 * are evenly spaced along the neck, not along the line between its ends.
 *
 * The shape is the ogee every photograph of a harp shows — off the top of the
 * column almost level, then a steep drop through the middle, then flattening
 * out along the last stretch to the tip. It matters more than it sounds: the
 * flat run at the tip is what keeps the top two octaves short.
 */
const NECK_CURVE = new CatmullRomCurve3([
  COLUMN_TOP.clone(),
  new Vector3(0.355, 1.815, 0),
  new Vector3(0.610, 1.460, 0),
  new Vector3(0.855, 1.225, 0),
]);
/**
 * Where the outermost strings sit along it. Not 0 and 1: the neck runs on past
 * the last string at each end — into the column's capital at the bass, and a
 * couple of centimetres proud of the treble string, which is the tip a harp is
 * drawn by.
 */
const HEAD_U0 = 0.040;
const HEAD_U1 = 0.960;
/** How far along the string a harpist actually plucks. Not the middle. */
const PLUCK_T = 0.42;

// --- The body ------------------------------------------------------------
//
// A harp is a closed quadrilateral — base, column, neck, soundbox — and every
// joint of it is a number here, because a joint that is nearly right is a hole
// you can see through from the stalls.

/**
 * The soundboard's width where the lowest and highest strings leave it.
 *
 * This is the dimension the audience sees: the board lies *parallel* to the
 * string plane with the strings running a few millimetres proud of it, so its
 * width is measured across the fan and is the whole of the box's silhouette.
 *
 * Which is why the box is a square frustum rather than the hexagonal one that
 * used to be here. On any regular polygon with a face toward the strings, the
 * widest points of the section are behind that face and twice as far apart as
 * it is — so a 0.19 m soundboard came with a 0.38 m body bulging out either
 * side of it, and the board read as a stripe painted down a barrel. On a square
 * the face corners *are* the widest points, so the board is the silhouette, as
 * it is on the instrument.
 */
const BOX_W_LOW = 0.255;
const BOX_W_HIGH = 0.078;
/** How deep the box is behind the board, as a fraction of its width. */
const BOX_DEPTH = 0.80;
/**
 * How far the box runs past the outermost strings, along the soundboard line.
 * `DROP` buries the bottom cap in the base; `RISE` carries the top up to the
 * treble tip of the neck, which is the corner a harp is closed at.
 */
const BOX_DROP = 0.240;
const BOX_RISE = 0.090;
/** Axis → *face* of a square, as against axis → corner, which is 1. */
const QUAD_FLAT = Math.cos(Math.PI / 4);
/** The string band's thickness, and how far the strings clear its face. */
const BAND_DEPTH = 0.020;
const BAND_LIFT = 0.004;
/** The plane the soundboard face lies in: behind the band, behind the strings. */
const FACE_Z = -(BAND_DEPTH + BAND_LIFT);
/**
 * The spruce plate itself, as a fraction of its own width, and where the box's
 * front face goes.
 *
 * Three millimetres behind the plate's face rather than a plate's thickness
 * behind it: the plate tapers with the box, so any fixed offset that clears it
 * at the wide end opens a slot at the narrow one. Overlapping is free and a
 * visible slot down the front of a soundbox is not.
 */
const PLATE = 0.030;
const BOX_FACE_Z = FACE_Z - 0.003;

/**
 * The base, sized to what stands on it and no larger.
 *
 * Both dimensions are the smallest that still cover the two feet: the box's
 * buried bottom cap reaches x 0.34 and z -0.27, the column's shoe reaches x
 * -0.06 and z ±0.06, and the plinth is drawn round exactly that with a
 * centimetre or two of margin. A pedal box any bigger than its own contents
 * reads as a paving slab somebody stood a harp on.
 */
const BASE_L = 0.46;
const BASE_H = 0.13;
const BASE_W = 0.36;
const BASE_X = 0.14;
/**
 * …and it is not centred on the string plane, because the thing standing on it
 * is not: the soundbox hangs entirely behind the board, so the pedal box has to
 * be behind it too or the bottom of the harp is unsupported. The column, which
 * *is* in the plane, then stands just inside the base's front edge.
 */
const BASE_Z = -0.115;

const PEDAL_L = 0.075;
/** How much of a pedal stays inside the base. The rest of it is the lever. */
const PEDAL_KEYED = 0.035;

/** The neck's radius at the column end, and what fraction of it is left at the tip. */
const NECK_R = 0.056;
const NECK_TAPER = 0.38;

/** Soundboard end of string `n`. */
function footOf(n: number, out: Vector3): Vector3 {
  return out.copy(SOUND_LOW).lerp(SOUND_HIGH, n / (COURSES - 1));
}

/**
 * Neck end of string `n`, sampled off `NECK_CURVE` once at load rather than per
 * call: `getPointAt` walks an arc-length table, and `resolve` is on the hand
 * path.
 */
const HEADS: readonly Vector3[] = Array.from({ length: COURSES }, (_, n) =>
  NECK_CURVE.getPointAt(HEAD_U0 + (HEAD_U1 - HEAD_U0) * (n / (COURSES - 1))));

function headOf(n: number, out: Vector3): Vector3 {
  return out.copy(HEADS[n]!);
}

/**
 * Which string a point asks for.
 *
 * `ARCHETYPES.harp` declares no `strings` array, so there is no index space for
 * `PlayPoint.string` to index into and the convention has to be stated
 * somewhere. It is stated here: **`string` is the course number up from the
 * archetype's lowest note, and `fret` is a semitone offset added to it**, so
 * both `{string: midi - 24, fret: 0}` and `{string: 0, fret: midi - 24}` mean
 * the same string. A `key` point is accepted too, since a harp is the one
 * plucked instrument where a pitch identifies a course exactly. Anything that
 * lands outside 0..79 is `undefined` rather than the nearest string — see the
 * build report, this is the one convention worth confirming centrally.
 */
function courseOf(point: PlayPoint): number | undefined {
  let n: number;
  if (point.kind === 'string') {
    if (!Number.isFinite(point.string) || !Number.isFinite(point.fret)) return undefined;
    n = Math.round(point.string + point.fret);
  } else if (point.kind === 'key') {
    if (!Number.isFinite(point.midi)) return undefined;
    n = Math.round(point.midi) - LOWEST_MIDI;
  } else {
    return undefined;
  }
  return n >= 0 && n < COURSES ? n : undefined;
}

/** Where course `n` is plucked, in the build frame. */
function pluckPoint(n: number): Vector3 {
  return footOf(n, new Vector3()).lerp(headOf(n, new Vector3()), PLUCK_T);
}

/**
 * Which side of the string plane each hand works from, as the sign of `z`.
 *
 * Opposite sides, palms facing each other through the strings. One side for
 * both would make the two hands mirror images with the same palm facing, and
 * one of them would have its thumb at the floor.
 */
const LEFT_SIDE = 1;
const RIGHT_SIDE = -1;

/**
 * Where the fingers point: at the column, dipped a little toward the soundboard.
 *
 * Level with the forearm, so the wrist stays open and the arm comes in from the
 * body. Pointed along the strings the wrist would sit at the top or bottom of
 * the hand and the forearm would stand on end.
 */
const FINGER_DIP = 0.50;
const FINGERS = new Vector3(-Math.cos(FINGER_DIP), -Math.sin(FINGER_DIP), 0);
/**
 * How far each hand turns out of the string plane, about the vertical: the
 * fingertips stay on the string and the wrist swings away from it, toward the
 * arm that hand hangs from.
 */
const HAND_YAW = 0.55;

/** Where a hand goes on course `n`, `off` metres clear of the plane on `side`. */
function pluckAt(n: number, lift: number, off: number, side: number): Contact {
  const turn = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -side * HAND_YAW);
  const normal = new Vector3(0, 0, side).applyQuaternion(turn);
  const fingers = FINGERS.clone().applyQuaternion(turn);
  return {
    position: pluckPoint(n).add(new Vector3(0, lift, side * off)),
    normal,
    // `along` is the hand's own `+x` and the fingers come out as `along × normal`.
    along: new Vector3().crossVectors(normal, fingers),
  };
}

/** Hands wait lifted off the middle of the fan, a hand's breadth clear of it. */
function handAt(point: PlayPoint, side: number): Contact | undefined {
  if (point.kind === 'rest') return pluckAt(40, 0.05, 0.09, side);
  const n = courseOf(point);
  return n === undefined ? undefined : pluckAt(n, 0, 0.012, side);
}

/**
 * Thin a tube from full radius at its start to `end` × that at its finish.
 *
 * `TubeGeometry` has exactly one radius, and a harp's neck has not: it is a
 * carved beam, deepest where the whole fan is pulling on it and slimmest at the
 * tip, and a constant noodle from the capital to the treble corner is the one
 * part of the silhouette a viewer would notice was wrong without being able to
 * say why. It also fixes a smaller thing — the treble strings are 9 cm long,
 * and a tube that fat ate a third of them.
 *
 * The vertices come out as `segments + 1` rings of `radial + 1`, in curve
 * order, each ring centred on `NECK_CURVE.getPointAt(i / segments)` — the very
 * call the geometry made to place it — so scaling a ring about that point is
 * exact rather than a guess at where its middle was.
 */
function taperTube(
  geo: TubeGeometry, segments: number, radial: number, end: number,
): void {
  const pos = geo.attributes.position!;
  const centre = new Vector3();
  const v = new Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    NECK_CURVE.getPointAt(t, centre);
    const k = 1 + (end - 1) * t;
    for (let j = 0; j <= radial; j++) {
      const at = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, at).sub(centre).multiplyScalar(k).add(centre);
      pos.setXYZ(at, v.x, v.y, v.z);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

class Kit {
  private readonly geos: BufferGeometry[] = [];
  private readonly mats: Material[] = [];
  geo<T extends BufferGeometry>(g: T): T { this.geos.push(g); return g; }
  mat<T extends Material>(m: T): T { this.mats.push(m); return m; }
  release(): void {
    for (const g of this.geos) g.dispose();
    for (const m of this.mats) m.dispose();
    this.geos.length = 0;
    this.mats.length = 0;
  }
}

/** Not part of `InstrumentModel`. */
export interface HarpModel extends InstrumentModel {
  /**
   * The right hand's contact. `withSoundingContact` routes the right hand and
   * the bow through this and everything else through `resolve`, so on a harp
   * the two entry points are the two sides of the string plane.
   */
  soundingContact(point: PlayPoint): Contact | undefined;
}

export const buildHarp: InstrumentBuilder = (opts) => {
  const rng = new Rng(`harp:${opts.seed}`);
  const kit = new Kit();

  const root = new Group();
  root.name = 'harp';
  /**
   * The only group under the root, and it shivers. The harp itself rests at
   * identity inside it, so `resolve` is arithmetic on the constants above and
   * never reads the scene graph.
   */
  const body = addTo(root, new Group());

  const gilt = opts.finish ?? rng.pick(['#c8a24a', '#d8b45c', '#b8903c']);
  const frameMat = kit.mat(new MeshStandardMaterial({
    color: gilt, roughness: 0.35, metalness: 0.45, flatShading: true,
  }));
  const woodMat = kit.mat(new MeshStandardMaterial({
    color: rng.pick(['#7a4a24', '#8c5a2c', '#6b3d1e']), roughness: 0.55,
  }));
  const boardMat = kit.mat(new MeshStandardMaterial({
    color: '#e6cf9a', roughness: 0.5,
  }));
  const stringMat = kit.mat(new MeshStandardMaterial({
    color: '#ffffff', roughness: 0.4, metalness: 0.2,
  }));

  // --- Soundbox: a tapered box lying along the soundboard line ------------
  //
  // Built as two members on one axis: the box in dark wood, and the spruce
  // plate laid on its front. That is how a harp is made and it is also the only
  // way to get the colours right — the board is the pale thing an audience sees
  // and the body behind it is not.
  //
  // Leaning the axis by `QUAD_FLAT * radius` puts one full-length face in a
  // fixed plane for the entire run, at both ends and everywhere between, which
  // is what a soundboard is. A cone is only tangent to a plane if its axis leans
  // at the same rate as its radius; the version of this that ran the axis
  // parallel to the board instead stood 35 mm in front of it at the bass and
  // 60 mm behind it at the treble.
  const boxDir = new Vector3().subVectors(SOUND_HIGH, SOUND_LOW);
  const boxLen = boxDir.length();
  const boxAxis = boxDir.clone().normalize();
  /** The half-width of the board `s` metres up the soundboard line. */
  const halfAt = (s: number): number =>
    (BOX_W_LOW + (BOX_W_HIGH - BOX_W_LOW) * (s / boxLen)) / 2;
  /** …and the circumradius a square section needs to reach it. */
  const radAt = (s: number): number => halfAt(s) / QUAD_FLAT;
  const axisAt = (s: number, faceZ: number, depth: number): Vector3 =>
    SOUND_LOW.clone().addScaledVector(boxAxis, s)
      .setZ(faceZ - QUAD_FLAT * radAt(s) * depth);
  /**
   * One tapered square member from `s0` to `s1`, its front face in `faceZ`.
   *
   * `thetaStart` at an eighth turn is what turns a ridge into a face:
   * `CylinderGeometry` puts a *corner* at local +z, and a boat hull pointed at
   * the audience is not a soundboard. It goes in the geometry rather than in
   * the mesh's rotation because `depth` is a local scale, and a scale is
   * applied before the rotation — rolled in the quaternion, it would squash the
   * wrong axis.
   */
  const member = (
    s0: number, s1: number, faceZ: number, depth: number, mat: Material,
  ): Mesh => {
    const foot = axisAt(s0, faceZ, depth);
    const head = axisAt(s1, faceZ, depth);
    const spine = new Vector3().subVectors(head, foot);
    const g = kit.geo(new CylinderGeometry(
      radAt(s1), radAt(s0), spine.length(), 4, 1, false, Math.PI / 4,
    ));
    const m = addTo(body, new Mesh(g, mat));
    m.position.copy(foot).addScaledVector(spine, 0.5);
    m.scale.set(1, 1, depth);
    m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), spine.clone().normalize());
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };
  member(-BOX_DROP, boxLen + BOX_RISE, BOX_FACE_Z, BOX_DEPTH, woodMat);
  member(-BOX_DROP, boxLen + BOX_RISE, FACE_Z, PLATE, boardMat);
  /**
   * The string band: the strip down the middle of the soundboard that the
   * strings are actually anchored through, standing proud of the face.
   *
   * It used to straddle the string plane, so every string was *inside* it for
   * as far as it stayed within the band's width — and the top strings run
   * nearly parallel to the board, so they were buried end to end. The band now
   * sits wholly behind the strings, which clear its face by `BAND_LIFT`.
   */
  {
    const span = boxLen + BOX_DROP + BOX_RISE;
    const g = kit.geo(new BoxGeometry(0.048, span, BAND_DEPTH));
    const band = addTo(body, new Mesh(g, boardMat));
    band.position.copy(SOUND_LOW)
      .addScaledVector(boxAxis, span / 2 - BOX_DROP)
      .setZ(FACE_Z + BAND_DEPTH / 2);
    band.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), boxAxis);
    band.castShadow = true;
    band.receiveShadow = true;
  }

  // --- Base and pedals -----------------------------------------------------
  {
    const g = kit.geo(new BoxGeometry(BASE_L, BASE_H, BASE_W));
    const base = addTo(body, new Mesh(g, woodMat));
    base.position.set(BASE_X, BASE_H / 2, BASE_Z);
    base.castShadow = true;
    base.receiveShadow = true;
  }
  /**
   * Seven pedals, four on the player's right and three on their left, each
   * keyed 35 mm into the base and standing proud of it.
   *
   * They were at a flat z that had nothing to do with where the base's sides
   * were: four of them hung in the air off the front of the instrument and the
   * other three were sealed inside the woodwork. A harp pedal is a lever
   * through a slot in the side of the base, so it has to *touch* the side of
   * the base, and the sides are the two the player's feet reach past.
   */
  const pedalGeo = kit.geo(new BoxGeometry(0.036, 0.014, PEDAL_L));
  const pedals = addTo(body, new InstancedMesh(pedalGeo, frameMat, 7));
  {
    const m = new Matrix4();
    for (let i = 0; i < 7; i++) {
      const side = i < 4 ? -1 : 1;
      const k = i < 4 ? i : i - 4;
      const face = BASE_Z + side * BASE_W / 2;
      pedals.setMatrixAt(i, m.makeTranslation(
        (i < 4 ? 0.02 : 0.07) + k * 0.09,
        BASE_H * 0.62,
        face + side * (PEDAL_L / 2 - PEDAL_KEYED),
      ));
    }
    pedals.instanceMatrix.needsUpdate = true;
  }

  // --- Column and neck -----------------------------------------------------
  {
    const dir = new Vector3().subVectors(COLUMN_TOP, COLUMN_FOOT);
    const g = kit.geo(new CylinderGeometry(0.040, 0.062, dir.length(), 7));
    const col = addTo(body, new Mesh(g, frameMat));
    col.position.copy(COLUMN_FOOT).addScaledVector(dir, 0.5);
    col.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
    col.castShadow = true;
  }
  {
    // The capital. A harp's column ends in a carved block under the neck, and
    // without it the tallest thing on the instrument is a stick that stops.
    const along = new Vector3().subVectors(COLUMN_TOP, COLUMN_FOOT).normalize();
    const g = kit.geo(new BoxGeometry(0.115, 0.075, 0.115));
    const cap = addTo(body, new Mesh(g, frameMat));
    // Square to the post rather than to the world: the column leans, and a
    // capital that does not lean with it shows a notch down one side.
    cap.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), along);
    cap.position.copy(COLUMN_TOP).addScaledVector(along, -0.02);
    cap.castShadow = true;
  }
  {
    // The neck is the one curve on the instrument and it does a lot of work:
    // `NECK_CURVE` is where the strings end, so this mesh is the curve made
    // visible rather than a second opinion about where the neck is.
    const segments = 24;
    const radial = 8;
    const g = kit.geo(new TubeGeometry(NECK_CURVE, segments, NECK_R, radial, false));
    taperTube(g, segments, radial, NECK_TAPER);
    const neck = addTo(body, new Mesh(g, frameMat));
    neck.castShadow = true;
  }

  // --- Eighty strings, one instanced mesh ---------------------------------
  const stringGeo = kit.geo(new CylinderGeometry(0.0016, 0.0016, 1, 4, 1, true));
  const stringMesh = addTo(body, new InstancedMesh(stringGeo, stringMat, COURSES));
  const mids: Vector3[] = [];
  const quats: Quaternion[] = [];
  const lens: number[] = [];
  {
    const up = new Vector3(0, 1, 0);
    const foot = new Vector3();
    const head = new Vector3();
    const dir = new Vector3();
    const m = new Matrix4();
    const scale = new Vector3();
    const colour = new Color();
    for (let n = 0; n < COURSES; n++) {
      footOf(n, foot);
      headOf(n, head);
      dir.subVectors(head, foot);
      const len = dir.length();
      const mid = new Vector3().copy(foot).addScaledVector(dir, 0.5);
      const q = new Quaternion().setFromUnitVectors(up, dir.clone().normalize());
      mids.push(mid);
      quats.push(q);
      lens.push(len);
      stringMesh.setMatrixAt(n, m.compose(mid, q, scale.set(1, len, 1)));
      // The colour code every harpist navigates by: C red, F blue-black.
      const pc = (LOWEST_MIDI + n) % 12;
      colour.set(pc === 0 ? '#c8352c' : pc === 5 ? '#2f4e8c' : '#efe6cf');
      stringMesh.setColorAt(n, colour);
    }
    stringMesh.instanceMatrix.needsUpdate = true;
    if (stringMesh.instanceColor) stringMesh.instanceColor.needsUpdate = true;
  }

  // --- Reaction state ------------------------------------------------------
  const amp = new Float32Array(COURSES);
  const phase = new Float32Array(COURSES);
  /** Only these get their matrices rewritten. Eighty per frame would be silly. */
  const ringing = new Set<number>();
  let boardAmp = 0;
  let last = 0;
  let started = false;
  const scratchM = new Matrix4();
  const scratchP = new Vector3();
  const scratchS = new Vector3();

  function excite(n: number, energy: number): void {
    if (n < 0 || n >= COURSES) return;
    amp[n] = Math.min(1.3, (amp[n] ?? 0) + energy);
    phase[n] = rng.float(0, Math.PI * 2);
    ringing.add(n);
  }

  /**
   * A harpist does not sit square to the strings, and this is the field that
   * says so.
   *
   * Everything else on a stage is played from in front of it: you stand at a
   * keyboard, you sit behind a kit, and the instrument's plane runs across your
   * body. A harp is the exception. Its base goes down between the feet, its
   * frame leans back along the line of the body, and the treble corner comes to
   * rest **on the right shoulder** — so the string plane runs fore-and-aft
   * *through* the player, the column stands out in front of them, and the left
   * hand reaches away down the long bass strings while the right works the
   * short ones by the collarbone.
   *
   * This file used to declare `+0.585` and a seat square behind the fan, which
   * is a right angle away from that: it put the harpist at a lectern. On stage
   * it also meant the plane came out parallel to the front of the deck, so the
   * house was shown the flat back of the soundbox with the player hidden behind
   * it — the whole instrument face-down to the audience.
   *
   * `-π/2` is the right angle back. The small extra is the lean into the
   * instrument: the fan sits a touch to the player's right, and they turn that
   * far into it rather than staring past the column.
   *
   * The `z` is where a harpist actually sits: a hand's breadth off the plane on
   * the soundboard side, so the strings come up in front of the sternum and the
   * *right shoulder* is the part of them the soundbox leans on. Sitting dead in
   * the plane puts the shoulder inside the box; sitting much further out puts
   * the player beside the harp instead of behind it, reaching across
   * themselves.
   *
   * The `x` is far enough back that the treble corner and the tip of the neck
   * come over the shoulder rather than into it — a harpist is behind the top of
   * the fan, not under it.
   */
  const station: PlayerStation = {
    offset: new Vector3(0.86, 0, 0.12),
    facing: -Math.PI / 2 - 0.07,
    posture: 'sit',
  };

  const model: HarpModel = {
    archetype: 'harp',
    root,
    station,

    resolve: (point: PlayPoint): Contact | undefined => handAt(point, LEFT_SIDE),
    soundingContact: (point: PlayPoint): Contact | undefined => handAt(point, RIGHT_SIDE),

    react(point: PlayPoint, force: number, now: number): void {
      const n = courseOf(point);
      if (n === undefined) return;
      const f = Math.min(Math.max(force, 0), 1);
      excite(n, 0.6 + f * 0.5);
      // Sympathetic ring at the octave and the twelfth. A harp is a room full
      // of undamped strings and it is why the instrument sounds like weather.
      excite(n + 12, (0.6 + f * 0.5) * 0.16);
      excite(n - 12, (0.6 + f * 0.5) * 0.12);
      excite(n + 19, (0.6 + f * 0.5) * 0.08);
      boardAmp = Math.min(1, boardAmp + 0.3 + f * 0.4);
      if (!started) { last = now; started = true; }
    },

    update(now: number): void {
      if (!started) { last = now; started = true; }
      const dt = Math.min(Math.max(now - last, 0), 0.4);
      last = now;

      if (ringing.size > 0) {
        for (const n of ringing) {
          let a = amp[n] ?? 0;
          // Bass strings ring for bars; treble ones are gone in a beat.
          a *= Math.exp(-dt / (2.6 - (n / COURSES) * 1.9));
          const settled = a <= 0.004;
          amp[n] = settled ? 0 : a;
          phase[n] = (phase[n] ?? 0) + dt * (9 + (n / COURSES) * 34);
          const wobble = settled ? 0 : Math.sin(phase[n]!) * a * 0.010;
          const blur = settled ? 1 : 1 + a * 4.5;
          scratchP.copy(mids[n]!);
          scratchP.z += wobble;
          stringMesh.setMatrixAt(n, scratchM.compose(
            scratchP, quats[n]!, scratchS.set(blur, lens[n]!, blur),
          ));
          if (settled) ringing.delete(n);
        }
        stringMesh.instanceMatrix.needsUpdate = true;
      }

      if (boardAmp > 0.002) {
        boardAmp *= Math.exp(-dt / 1.2);
        const s = Math.sin(now * 8) * boardAmp;
        body.position.set(s * 0.0016, 0, s * 0.0022);
        body.rotation.z = s * 0.0018;
      } else if (boardAmp !== 0) {
        boardAmp = 0;
        body.position.set(0, 0, 0);
        body.rotation.z = 0;
      }
    },

    dispose(): void {
      stringMesh.dispose();
      pedals.dispose();
      root.removeFromParent();
      root.clear();
      kit.release();
    },
  };

  return model;
};
