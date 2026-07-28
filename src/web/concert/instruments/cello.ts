/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Cello — four strings, no frets, an endpin in the boards and a player sitting
 * around it.
 *
 * The violin's rules at twice the size, and the size is the point: a 0.69 m
 * string means a semitone near the nut is 39 mm of fingerboard, so the left
 * hand visibly *shifts* rather than stretching. `MENSUR * 2^(-n/12)` gives
 * that for free — the same continuous equal-tempered position rule as the
 * violin and the upright bass, with no wire to snap to.
 *
 * Build frame: `+x` bridge → nut, `+y` out of the belly, `+z` A string → C.
 * The root's origin is the endpin, on the boards, which is also what the whole
 * instrument rocks about.
 *
 * **`+z` runs treble to bass, and the violin's runs bass to treble.** That
 * asymmetry is not a slip; it is what the frames force. `z` is `x × y` in both
 * files, and a violin lies across the player with its face up while a cello
 * stands on end with its face to the house — so the same cross product lands on
 * opposite sides of the player. Written the violin's way round the cello comes
 * out mirrored, and the tell is the bow: the frog ends up over the player's
 * *left* shoulder and the right hand reaches across the body to find it, which
 * is what this file used to do.
 */

import {
  BoxGeometry, type BufferGeometry, CapsuleGeometry, Color, CylinderGeometry,
  ExtrudeGeometry, Group, InstancedMesh, type Material, Matrix4, Mesh,
  MeshStandardMaterial, Quaternion, Shape, Vector3,
} from 'three';

import type { GestureKind, PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import {
  addTo, type Contact, type InstrumentBuilder, type InstrumentModel,
  type PlayerStation,
} from './types.js';

/** Sounding length, bridge to nut. A 4/4 cello. */
const MENSUR = 0.690;
const STRINGS = 4;
/**
 * Two octaves plus thumb position, which is what the fingerboard covers and
 * more than `ARCHETYPES.cello.range` asks of the A string (57 → 81).
 */
const MAX_SEMITONES = 26;
const NUT_SPREAD = 0.024;
const BRIDGE_SPREAD = 0.048;
const ARC_R = 0.052;
const STRING_HEIGHT = 0.008;
const FINGER_HEIGHT = 0.017;
const BOW_X = 0.085;

const BODY_TAIL = -0.400;
const BODY_LEN = 0.755;

// ---------------------------------------------------------------------------
// The bow. See `violin.ts` for the argument; the numbers are a cello's.
// ---------------------------------------------------------------------------

/**
 * Where the frog sits along the stick. Negative, because on this instrument the
 * bow arm is at `-z` — see the note on the build frame at the top of the file.
 */
const FROG_Z = -0.344;
const HAIR_HALF = 0.340;
const BOW_CLEAR = 0.006;
/**
 * `BOW_TRAVEL`, `BOW_SPEED` and `BOW_MIN_STROKE` in `web/concert/animate.ts`,
 * and they have to stay equal to them. How far the bow may slide either side of
 * the middle of its hair, how fast it goes, and the least one note may use. See
 * the long note in `violin.ts` for the whole law — why the stroke is a position
 * rather than a per-note nudge, why it runs down the stick rather than across
 * the player, and why running out of bow turns round instead of clamping.
 */
const BOW_LEAN = 0.170;
const BOW_SPEED = 0.085;
const BOW_MIN_STROKE = 0.085;
const BOW_LIFT = 0.040;
/**
 * Standing down: the bow goes with the hand. See `violin.ts` for the whole
 * argument — the bow is a child of the instrument, so a bowing arm that has
 * gone to the player's side leaves it lying across the strings with nothing at
 * the frog. It matters more here than it does there, because a cello is not
 * lowered at all: the instrument stays exactly where it was played and the bow
 * on it is the only thing that reads as abandoned.
 *
 * `FROG_DIR` is `−z` on this instrument and `+z` on the violin, which is the
 * build-frame asymmetry at the top of this file and the reason the carry is
 * written against a direction rather than against a sign.
 */
const CARRY_FULL = 0.5;
const FROG_DIR = new Vector3(0, 0, Math.sign(FROG_Z));
/** Frog to tip, and how much air the tip is left under a seated player. */
const BOW_REACH = Math.abs(FROG_Z) * 2;
const BOW_FLOOR = 0.10;

// Per frame, per bowed player, and it may not allocate. See `hangBow`.
const C1 = new Vector3();
const C2 = new Vector3();
const C3 = new Vector3();
const CM = new Matrix4();
const CQ = new Quaternion();

/** The runtime's easing, over the runtime's own span. See `violin.ts`. */
function smooth(s: number): number {
  return s * s * (3 - 2 * s);
}
const SPAN_MIN = 0.15;
const SPAN_MAX = 4;

function mountBasis(alongStrings: Vector3, faceHint: Vector3, at: Vector3): Matrix4 {
  const x = alongStrings.clone().normalize();
  const y = faceHint.clone().addScaledVector(x, -faceHint.dot(x)).normalize();
  const z = new Vector3().crossVectors(x, y);
  return new Matrix4().makeBasis(x, y, z).setPosition(at);
}

/** Leaning back into the player's chest, scroll past their left ear. */
const MOUNT = mountBasis(
  new Vector3(0.220, 0.931, -0.290),
  new Vector3(0, 0.25, 0.96),
  new Vector3(-0.060, 0.620, 0.100),
);

/**
 * Where the player sits, in the instrument's frame: behind the endpin, and a
 * hand's width to its **left**, which is what puts the instrument between their
 * knees rather than through one of them.
 *
 * The lateral number is the one that was missing. `MOUNT` tilts the cello so
 * the scroll goes past the left ear, and a tilted line whose top is left of
 * centre has its bottom right of centre — the endpin lands 15 cm to the
 * player's right and the lower bout with it. Seated at `x = 0` the player then
 * has the whole width of the ribs on top of their right thigh, and no stance
 * fixes that, because the instrument is not between the knees at all: it is
 * outside the right one. Sitting 0.10 m to its right leaves the bout centred on
 * the player at knee height, with the endpin 5 cm inside their right foot,
 * which is where a cellist actually plants it.
 *
 * `y` stays zero. Both the player and the endpin are on the boards.
 */
const SEAT = new Vector3(-0.100, 0, -0.300);
/**
 * How far behind the player's hips the chair's own centre is: they sit forward
 * on it, as anybody working an instrument does. See the chair.
 */
const SEAT_SHIFT = -0.050;

/**
 * The axis the stopping hand's knuckles lie along: **down the fingerboard**.
 *
 * `−x`, nut toward bridge, which is the same sign the violin uses and for the
 * same reason: the rig lays the four fingers out with the index at the `−along`
 * end, and the first finger takes the lowest note of the position. See
 * `violin.ts` for the argument in full.
 *
 * The sign being shared does *not* mean the hands look alike, because `+z` runs
 * the other way here — see the build-frame note at the top. `along × normal`
 * sends a violinist's fingers across the strings toward the G and a cellist's
 * toward the A, and both are right: a violin is played from underneath its neck
 * and a cello from outside it, with the arm round the C side. Which is why the
 * cellist's elbow lifts for the C string and the violinist's swings under for
 * the G — in both cases the elbow follows the palm round the neck.
 */
const DOWN_BOARD = new Vector3(-1, 0, 0);

/** How much further round the neck the hand rolls than the board turns. */
const HAND_ROLL = 2.0;

/**
 * The positions a cellist's left hand stops in, and how far it leans past one.
 *
 * A cello's fingers span a **minor third**, not a fourth — the string is twice
 * as long and the hand is not — which is exactly why a cellist shifts so much
 * more visibly than a violinist. Three semitones of reach, positions every tone
 * up the neck and then wider once the thumb comes over the board. See
 * `violin.ts` for what the three numbers do.
 */
const POSITIONS: readonly number[] = [1, 3, 5, 7, 9, 11, 13, 16, 19, 22, 25];
const REACH = 3;
const LEAN_INTO_REACH = 0.3;
/** The hand never goes back past half position; the pegbox starts there. */
const HALF_POSITION = 1;

function stopX(n: number): number {
  return MENSUR * Math.pow(2, -n / 12);
}

/** Where the *hand* sits for a note stopped `n` semitones up. See `violin.ts`. */
function handStop(n: number): number {
  let base = POSITIONS[POSITIONS.length - 1]!;
  for (const p of POSITIONS) {
    if (n <= p + REACH) { base = p; break; }
  }
  if (base > n) base = n;
  return Math.max(base + (n - base) * LEAN_INTO_REACH, HALF_POSITION);
}

/**
 * Where string `i` sits across the bridge, `x` from it. **High to low along
 * `+z`** — see the build-frame note at the top. Index order is unchanged and
 * still low to high, because that is what `PlayPoint.string` indexes.
 */
function stringZ(i: number, x: number): number {
  const t = Math.min(Math.max(x / MENSUR, 0), 1);
  const spread = BRIDGE_SPREAD + (NUT_SPREAD - BRIDGE_SPREAD) * t;
  return -(i - (STRINGS - 1) / 2) * (spread / (STRINGS - 1));
}

function arcDrop(z: number): number {
  return Math.sqrt(Math.max(ARC_R * ARC_R - z * z, 0)) - ARC_R;
}

function arcNormal(z: number): Vector3 {
  return new Vector3(0, Math.sqrt(Math.max(ARC_R * ARC_R - z * z, 0)) / ARC_R, z / ARC_R);
}

/** The same turn, taken as far as the arm takes it. See `HAND_ROLL`. */
function handNormal(z: number): Vector3 {
  const a = Math.asin(Math.min(Math.max(z / ARC_R, -1), 1)) * HAND_ROLL;
  return new Vector3(0, Math.cos(a), Math.sin(a));
}

function contactAt(x: number, lift: number, z: number): Contact {
  return {
    position: new Vector3(x, lift + arcDrop(z), z).applyMatrix4(MOUNT),
    // Rolled with the string, and further than the board itself turns: crossing
    // to the next string is a turn of the whole hand.
    normal: handNormal(z).transformDirection(MOUNT),
    along: DOWN_BOARD.clone().transformDirection(MOUNT),
  };
}

function bowTilt(z: number): number {
  return Math.asin(Math.min(Math.max(z / ARC_R, -1), 1));
}

function bowPivotY(z: number, lift: number): number {
  return STRING_HEIGHT + arcDrop(z) + BOW_CLEAR + lift;
}

/**
 * The bowing hand: the frog, at the stroke's mid-point. See `violin.ts`.
 *
 * `STICK_Y` is where the stick hangs under the pivot's axis, which is the
 * hair-string crossing and therefore a construction line with no bow on it.
 * Measured off the stick mesh below; without it the hand is placed a centimetre
 * over the thing it is supposed to be holding.
 */
const STICK_Y = -0.012;

function bowContactAt(z: number, lift: number): Contact {
  const t = bowTilt(z);
  return {
    position: new Vector3(
      BOW_X,
      bowPivotY(z, lift) + Math.cos(t) * STICK_Y - Math.sin(t) * FROG_Z,
      z + Math.sin(t) * STICK_Y + Math.cos(t) * FROG_Z,
    ).applyMatrix4(MOUNT),
    normal: arcNormal(z).transformDirection(MOUNT),
    along: new Vector3(0, -Math.sin(t), Math.cos(t)).transformDirection(MOUNT),
  };
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

function violinOutline(
  tail: number, len: number, lower: number, waist: number, upper: number, neck: number,
): Shape {
  const t = tail;
  const h = tail + len;
  const u = (f: number): number => t + len * f;
  const s = new Shape();
  s.moveTo(t, 0);
  s.bezierCurveTo(t, lower * 0.62, u(0.05), lower, u(0.19), lower);
  s.bezierCurveTo(u(0.30), lower, u(0.35), lower * 0.74, u(0.40), waist * 1.10);
  s.bezierCurveTo(u(0.45), waist * 0.95, u(0.50), waist, u(0.56), waist);
  s.bezierCurveTo(u(0.62), waist, u(0.65), waist * 0.98, u(0.69), upper * 0.82);
  s.bezierCurveTo(u(0.73), upper, u(0.81), upper, u(0.87), upper * 0.93);
  s.bezierCurveTo(u(0.95), upper * 0.84, h, upper * 0.44, h, neck);
  s.lineTo(h, -neck);
  s.bezierCurveTo(h, -upper * 0.44, u(0.95), -upper * 0.84, u(0.87), -upper * 0.93);
  s.bezierCurveTo(u(0.81), -upper, u(0.73), -upper, u(0.69), -upper * 0.82);
  s.bezierCurveTo(u(0.65), -waist * 0.98, u(0.62), -waist, u(0.56), -waist);
  s.bezierCurveTo(u(0.50), -waist, u(0.45), -waist * 0.95, u(0.40), -waist * 1.10);
  s.bezierCurveTo(u(0.35), -lower * 0.74, u(0.30), -lower, u(0.19), -lower);
  s.bezierCurveTo(u(0.05), -lower, t, -lower * 0.62, t, 0);
  return s;
}

/** Not part of `InstrumentModel`. See the notes on the two extra members. */
export interface CelloModel extends InstrumentModel {
  /**
   * Where the bowing hand goes: the frog, on the stick. `resolve` answers for
   * the left hand. See `violin.ts` — this is not the hair-string crossing, and
   * returning that crossing is what put the hand a third of a metre from the
   * only part of the bow anybody holds.
   */
  soundingContact(point: PlayPoint): Contact | undefined;
  /** The model's own bow, driven to stay under that hand. */
  bow: Group;
  /**
   * Carry the bow in the bowing hand rather than on the strings. `down` is how
   * far that hand has let go, 0..1, and `hand` is where it is in world space —
   * both of which only the runtime can know. See `violin.ts`.
   */
  carryBow(down: number, hand: Vector3): void;
}

export const buildCello: InstrumentBuilder = (opts) => {
  const rng = new Rng(`cello:${opts.seed}`);
  const kit = new Kit();

  const root = new Group();
  root.name = 'cello';
  /** Rocks about the endpin, which is this group's origin. */
  const rock = addTo(root, new Group());
  const inst = addTo(rock, new Group());
  inst.applyMatrix4(MOUNT);

  const wood = opts.finish ?? rng.pick(['#a75e28', '#94501f', '#bd7434', '#8a4720']);
  const bodyMat = kit.mat(new MeshStandardMaterial({
    color: wood, roughness: 0.4, metalness: 0.04,
  }));
  const bellyMat = kit.mat(new MeshStandardMaterial({
    color: rng.pick(['#dda758', '#cd9547', '#e8b869']), roughness: 0.45,
  }));
  const ebonyMat = kit.mat(new MeshStandardMaterial({ color: '#171310', roughness: 0.42 }));
  const stringMat = kit.mat(new MeshStandardMaterial({
    color: '#ddd5bb', roughness: 0.4, metalness: 0.45,
  }));
  const metalMat = kit.mat(new MeshStandardMaterial({
    color: '#c2c6cb', roughness: 0.3, metalness: 0.85, flatShading: true,
  }));

  // --- Body ----------------------------------------------------------------
  const bodyGeo = kit.geo(new ExtrudeGeometry(
    violinOutline(
      BODY_TAIL, BODY_LEN,
      0.222 * rng.float(0.97, 1.03),
      0.121 * rng.float(0.96, 1.04),
      0.172 * rng.float(0.97, 1.03),
      0.030,
    ),
    {
      depth: 0.105, bevelEnabled: true, bevelThickness: 0.026,
      bevelSize: 0.022, bevelSegments: 3, curveSegments: 6,
    },
  ));
  bodyGeo.rotateX(-Math.PI / 2);
  // A cello bridge is 90 mm tall; the belly hangs that far below the strings.
  bodyGeo.translate(0, -0.213, 0);
  const body = addTo(inst, new Mesh(bodyGeo, bodyMat));
  body.castShadow = true;
  body.receiveShadow = true;

  const belly = addTo(inst, new Mesh(bodyGeo, bellyMat));
  belly.scale.set(0.97, 0.085, 0.97);
  belly.position.set(0, -0.073, 0);
  belly.receiveShadow = true;

  const fGeo = kit.geo(new CapsuleGeometry(0.0085, 0.105, 2, 6));
  fGeo.rotateZ(Math.PI / 2);
  for (const side of [1, -1]) {
    const f = addTo(inst, new Mesh(fGeo, ebonyMat));
    f.position.set(0.004, -0.077, side * 0.100);
    f.rotation.y = side * 0.21;
  }

  // --- Neck, fingerboard, scroll ------------------------------------------
  const neckGeo = kit.geo(new BoxGeometry(MENSUR - 0.395, 0.042, 0.044));
  const neck = addTo(inst, new Mesh(neckGeo, bodyMat));
  neck.position.set((MENSUR + 0.395) / 2, -0.038, 0);
  neck.castShadow = true;

  const boardLen = MENSUR - stopX(MAX_SEMITONES) + 0.025;
  const boardGeo = kit.geo(new BoxGeometry(boardLen, 0.018, 0.058));
  const board = addTo(inst, new Mesh(boardGeo, ebonyMat));
  board.position.set(MENSUR + 0.010 - boardLen / 2, -0.010, 0);
  board.castShadow = true;

  addTo(inst, new Mesh(kit.geo(new BoxGeometry(0.125, 0.050, 0.038)), bodyMat))
    .position.set(MENSUR + 0.068, -0.024, 0);
  const scrollGeo = kit.geo(new CylinderGeometry(0.032, 0.020, 0.034, 7));
  scrollGeo.rotateX(Math.PI / 2);
  const scroll = addTo(inst, new Mesh(scrollGeo, bodyMat));
  scroll.position.set(MENSUR + 0.148, -0.010, 0);
  scroll.rotation.z = 0.55;

  const pegGeo = kit.geo(new CylinderGeometry(0.008, 0.008, 0.082, 6));
  pegGeo.rotateX(Math.PI / 2);
  const pegs = addTo(inst, new InstancedMesh(pegGeo, ebonyMat, STRINGS));
  {
    const m = new Matrix4();
    for (let i = 0; i < STRINGS; i++) {
      const side = i % 2 === 0 ? 0.014 : -0.014;
      pegs.setMatrixAt(i, m.makeTranslation(
        MENSUR + 0.036 + Math.floor(i / 2) * 0.056, -0.024, side,
      ));
    }
    pegs.instanceMatrix.needsUpdate = true;
  }

  addTo(inst, new Mesh(kit.geo(new BoxGeometry(0.010, 0.013, 0.034)), ebonyMat))
    .position.set(MENSUR + 0.004, 0.003, 0);

  // --- Bridge, tailpiece ---------------------------------------------------
  const bridgeGroup = addTo(inst, new Group());
  bridgeGroup.position.set(0, -0.082, 0);
  const bridgeShape = new Shape();
  bridgeShape.moveTo(-0.044, 0);
  bridgeShape.lineTo(-0.026, 0);
  bridgeShape.lineTo(-0.020, 0.030);
  bridgeShape.bezierCurveTo(-0.008, 0.052, 0.008, 0.052, 0.020, 0.030);
  bridgeShape.lineTo(0.026, 0);
  bridgeShape.lineTo(0.044, 0);
  bridgeShape.lineTo(0.038, 0.062);
  bridgeShape.bezierCurveTo(0.024, 0.090, -0.024, 0.090, -0.038, 0.062);
  const bridgeGeo = kit.geo(new ExtrudeGeometry(bridgeShape, {
    depth: 0.011, bevelEnabled: false, curveSegments: 4,
  }));
  bridgeGeo.rotateY(Math.PI / 2);
  bridgeGeo.translate(0, 0, -0.0055);
  addTo(bridgeGroup, new Mesh(bridgeGeo, kit.mat(new MeshStandardMaterial({
    color: '#e0c68f', roughness: 0.5,
  })))).castShadow = true;

  const tailGeo = kit.geo(new BoxGeometry(0.215, 0.016, 0.070));
  const tail = addTo(inst, new Mesh(tailGeo, ebonyMat));
  tail.position.set(-0.160, -0.058, 0);
  tail.rotation.z = 0.14;

  // --- Strings -------------------------------------------------------------
  const stringGeo = kit.geo(new CylinderGeometry(0.0013, 0.0013, MENSUR + 0.04, 4, 1, true));
  stringGeo.rotateZ(-Math.PI / 2);
  stringGeo.translate((MENSUR + 0.04) / 2 - 0.022, 0, 0);
  const strings: Mesh[] = [];
  const gauge: number[] = [];
  for (let i = 0; i < STRINGS; i++) {
    const m = addTo(inst, new Mesh(stringGeo, stringMat));
    const g = 2.1 - i * 0.32;
    gauge.push(g);
    const z0 = stringZ(i, 0);
    m.position.set(0, STRING_HEIGHT + arcDrop(z0), z0);
    m.rotation.y = -Math.asin((stringZ(i, MENSUR) - z0) / MENSUR);
    m.scale.set(1, g, g);
    strings.push(m);
  }

  // --- Endpin: vertical in the world, not in the build frame --------------
  {
    const foot = new Vector3(BODY_TAIL - 0.020, -0.160, 0).applyMatrix4(MOUNT);
    const len = Math.max(foot.y, 0.05);
    const pinGeo = kit.geo(new CylinderGeometry(0.007, 0.005, len, 6));
    const pin = addTo(root, new Mesh(pinGeo, metalMat));
    pin.position.set(foot.x, len / 2, foot.z);
    pin.castShadow = true;
  }

  // --- The chair -----------------------------------------------------------
  //
  // A cellist sits on something, and until now they sat on nothing: the rig put
  // the hips at seat height and there was no seat, so a stage of players
  // standing at their instruments had one of them sitting in mid-air.
  //
  // It belongs to the model rather than to the stage for the same reason the
  // grand's bench does — the seat height and the station are one measurement,
  // and a chair placed by anything that cannot see `SEAT` is a chair the player
  // is beside. One chair for every room, not one per venue: the shape of an
  // orchestral chair does not change between a lakeside pavilion and a black
  // box, and the thing that actually reads from the house is what the room's
  // light does to it. The venue's own timber colour comes in through `finish`,
  // taken down dark so the chair is furniture rather than a second cello.
  {
    /**
     * The seat, three centimetres under the hip height the rig sits at.
     *
     * `min(0.47, 0.27 × height)` is `proportions()` in `performer-look.ts` and
     * has to stay equal to it. The three centimetres are the difference between
     * a seat and a plinth: the rig's thighs are cartoon-thick, so a top at
     * exactly the hip height is a chair through both of them — which is the
     * correction the grand's bench had made to it for the same reason.
     */
    const seatY = Math.min(0.47, (opts.height ?? 1.75) * 0.27) - 0.030;
    /**
     * Wider than the hips and no deeper than them.
     *
     * The width is a floor rather than a taste: the rig's seated hip mass is
     * `0.88 × torsoW` across, which at the tall end of casting is 0.44 m, and a
     * seat narrower than that is a player perched on a plank. The depth is
     * capped the other way — the thighs leave the hip going forward and down,
     * so every centimetre of seat in front of the hips is a centimetre the
     * front edge spends inside one.
     */
    const w = 0.46 * rng.float(0.97, 1.03);
    const d = 0.36;
    const cx = SEAT.x;
    const cz = SEAT.z + SEAT_SHIFT;

    const frameMat = kit.mat(new MeshStandardMaterial({
      color: new Color(opts.finish ?? '#6b4a2c').multiplyScalar(0.42),
      roughness: 0.55,
    }));
    const seatMat = kit.mat(new MeshStandardMaterial({
      color: new Color(opts.finish ?? '#6b4a2c').multiplyScalar(0.55),
      roughness: 0.7,
    }));

    const seat = addTo(root, new Mesh(kit.geo(new BoxGeometry(w, 0.038, d)), seatMat));
    seat.position.set(cx, seatY - 0.019, cz);
    seat.castShadow = true;
    seat.receiveShadow = true;

    const legGeo = kit.geo(new CylinderGeometry(0.014, 0.011, seatY - 0.038, 6));
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const leg = addTo(root, new Mesh(legGeo, frameMat));
        leg.position.set(
          cx + sx * (w / 2 - 0.030), (seatY - 0.038) / 2, cz + sz * (d / 2 - 0.030),
        );
        leg.castShadow = true;
      }
    }

    // A low back, and low on purpose. It is behind the lumbar and nowhere near
    // the shoulder blades, because a player who leans into a phrase leans back
    // out of it — and a rail at shoulder height is a rail through a shoulder.
    const postGeo = kit.geo(new CylinderGeometry(0.013, 0.013, 0.300, 6));
    for (const sx of [-1, 1]) {
      const post = addTo(root, new Mesh(postGeo, frameMat));
      post.position.set(cx + sx * (w / 2 - 0.030), seatY + 0.150, cz - d / 2 + 0.020);
      post.castShadow = true;
    }
    const rail = addTo(root, new Mesh(
      kit.geo(new BoxGeometry(w - 0.040, 0.070, 0.024)), seatMat,
    ));
    rail.position.set(cx, seatY + 0.265, cz - d / 2 + 0.020);
    rail.castShadow = true;
  }

  // --- The bow -------------------------------------------------------------
  /** Pivot on the string, stick on the pivot. See `violin.ts` for why. */
  const bowPivot = addTo(inst, new Group());
  const bow = addTo(bowPivot, new Group());
  {
    const stickGeo = kit.geo(new CylinderGeometry(0.0042, 0.0034, 0.700, 5));
    stickGeo.rotateX(Math.PI / 2);
    const stick = addTo(bow, new Mesh(stickGeo, kit.mat(new MeshStandardMaterial({
      color: '#3a2216', roughness: 0.4,
    }))));
    stick.position.set(0, -0.012, -0.02);
    stick.castShadow = true;
    const hairGeo = kit.geo(new BoxGeometry(0.0034, 0.0110, HAIR_HALF * 2));
    addTo(bow, new Mesh(hairGeo, kit.mat(new MeshStandardMaterial({
      color: '#f2ecd8', roughness: 0.8,
    })))).position.set(0, -0.0020, -0.02);
    const frogGeo = kit.geo(new BoxGeometry(0.019, 0.024, 0.042));
    // Named so the probe can measure the contact against the mesh itself.
    const frog = addTo(bow, new Mesh(frogGeo, ebonyMat));
    frog.name = 'bow-frog';
    frog.position.set(0, -0.010, FROG_Z);
    const tipGeo = kit.geo(new BoxGeometry(0.012, 0.017, 0.024));
    addTo(bow, new Mesh(tipGeo, ebonyMat)).position.set(0, -0.007, -FROG_Z - 0.006);
  }

  // --- Reaction state ------------------------------------------------------
  const amp = new Float32Array(STRINGS);
  const phase = new Float32Array(STRINGS);
  const rate = [11, 13, 16, 19];
  for (let i = 0; i < STRINGS; i++) phase[i] = rng.float(0, Math.PI * 2);
  let bellyAmp = 0;
  let rockAmp = 0;
  let rockPhase = 0;
  /** The runtime's stroke: `+1` to start, reversed by every note that is not a slur. */
  let stroke = 1;
  /**
   * Where along the stroke the bow is and the two ends of the run under way.
   * `leanFrom` is where it already was, so a slur is one travel — `violin.ts`.
   */
  let lean = 0;
  let leanFrom = 0;
  let leanTo = 0;
  let lift = BOW_LIFT;
  /** How far the bow has gone to the hand, and where that hand is. `carryBow`. */
  let carried = 0;
  const carriedHand = new Vector3();
  /** Set on the beat, never eased — see the note in `violin.ts`. */
  let bowString = 1;
  /** `-Infinity`, so the first note is a new beat by the same test as the rest. */
  let strokeAt = Number.NEGATIVE_INFINITY;
  let strokeSpan = 1;
  let last = 0;
  let started = false;

  /** The runtime's curve, over the runtime's span, between the same two ends. */
  function leanAt(now: number): number {
    if (leanFrom === leanTo) return leanTo;
    return leanFrom + (leanTo - leanFrom)
      * smooth(Math.min(Math.max((now - strokeAt) / strokeSpan, 0), 1));
  }

  /** Reverse unless slurred, and run on from wherever the bow is. `violin.ts`. */
  function turn(kind: GestureKind | undefined, f: number, now: number, span: number): void {
    // The two kinds that are a bow stroke, and the two the runtime turns its own
    // copy on. A `pluck` is a pizzicato and must not move the bow — `violin.ts`.
    if (kind !== 'bow' && kind !== 'hold') return;
    if (now === strokeAt) return;
    const from = leanAt(now);
    if (kind !== 'hold') stroke = -stroke;
    // Length × force, floored so a short note still draws something, capped at
    // the whole bow — and out of bow is a turn rather than a clamp, because a
    // clamped bow is a bow that has stopped moving. See `violin.ts`.
    const dist = Math.min(
      Math.max(BOW_SPEED * span * (0.4 + 0.6 * f), BOW_MIN_STROKE), BOW_LEAN * 2,
    );
    let to = from + stroke * dist;
    if (to > BOW_LEAN || to < -BOW_LEAN) {
      stroke = -stroke;
      to = from + stroke * dist;
    }
    leanFrom = from;
    leanTo = Math.min(Math.max(to, -BOW_LEAN), BOW_LEAN);
    strokeAt = now;
    strokeSpan = span;
    lean = from;
  }

  function placeBow(): void {
    const z = stringZ(bowString, BOW_X);
    bowPivot.position.set(BOW_X, bowPivotY(z, lift), z);
    // All three axes: `hangBow` writes a quaternion and three.js back-fills the
    // Euler from it, so an assignment to `x` alone leaves the carry's yaw and
    // roll on the pivot for good. See `violin.ts`.
    bowPivot.rotation.set(bowTilt(z), 0, 0);
    // The stroke is a slide down the stick and nothing else: the crossing point
    // stays on the string and the frog runs up and down the hair, under a hand
    // the runtime has displaced along this same axis by this same number.
    //
    // The pivot's `+z`, because that is the `along` the contact publishes — and
    // on this instrument the frog is at `−z`, so taking the frog's side would
    // have run the bow one way while the hand went the other.
    bow.position.set(0, 0, lean);

    // Unless the player has stood down, in which case the bow is in their hand
    // instead. Computed after the playing pose because it blends from it.
    if (carried > 0.001) hangBow();
  }

  /**
   * Hang the bow from the bowing hand: the frog in the hand, the stick under
   * it, tilted up out of the boards when a seated player has not the height to
   * hang it in. The argument, the axes and the reason it is written through the
   * pivot are all in `violin.ts`; this is the same six lines against a cello's
   * frame, where the frog is at `−z` and the mount hangs off a rocking group
   * rather than off the root.
   */
  /** Pivot to the hand's grip on the stick, turned by `q`. See `STICK_Y`. */
  function gripOffset(q: Quaternion, out: Vector3): Vector3 {
    return out.set(0, STICK_Y, FROG_Z + lean).applyQuaternion(q);
  }

  function hangBow(): void {
    inst.updateWorldMatrix(true, false);
    CM.copy(inst.matrixWorld);

    C3.copy(bowPivot.position).add(gripOffset(bowPivot.quaternion, C2)).applyMatrix4(CM);
    C1.copy(FROG_DIR).applyQuaternion(bowPivot.quaternion).transformDirection(CM);

    const rise = Math.min(Math.max((carriedHand.y - BOW_FLOOR) / BOW_REACH, 0.3), 1);
    C2.set(-C1.x, 0, -C1.z);
    if (C2.lengthSq() < 1e-8) C2.set(0, 0, 1);
    C2.normalize().multiplyScalar(Math.sqrt(1 - rise * rise));
    C2.y = -rise;
    C2.negate();

    const t = smooth(Math.min(carried / CARRY_FULL, 1));
    C1.lerp(C2, t);
    if (C1.lengthSq() < 1e-6) C1.copy(C2);
    C1.normalize();
    C3.lerp(carriedHand, t);

    CM.invert();
    C1.transformDirection(CM);
    C3.applyMatrix4(CM);
    bowPivot.quaternion.copy(CQ.setFromUnitVectors(FROG_DIR, C1));
    bowPivot.position.copy(C3).sub(gripOffset(CQ, C2));
  }
  placeBow();

  const station: PlayerStation = {
    // Cloned: the station is handed out and `SEAT` is this module's own.
    offset: SEAT.clone(),
    facing: 0,
    posture: 'straddle',
  };

  const model: CelloModel = {
    archetype: 'cello',
    root,
    station,
    bow,

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        const x = stopX(handStop(2));
        return contactAt(x, FINGER_HEIGHT + 0.035, stringZ(1, x));
      }
      if (point.kind !== 'string') return undefined;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return undefined;
      const n = point.fret;
      if (!Number.isFinite(n) || n < 0 || n > MAX_SEMITONES) return undefined;
      // To a position, not to the note. See `handStop`.
      const x = stopX(handStop(n));
      return contactAt(x, FINGER_HEIGHT, stringZ(i, x));
    },

    soundingContact(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') return bowContactAt(stringZ(1, BOW_X), BOW_LIFT);
      if (point.kind !== 'string') return undefined;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return undefined;
      return bowContactAt(stringZ(i, BOW_X), 0);
    },

    carryBow(down: number, hand: Vector3): void {
      const c = Math.min(Math.max(down, 0), 1);
      if (c <= 0 && carried <= 0) return;
      carried = c;
      if (c > 0) carriedHand.copy(hand);
      placeBow();
    },

    react(
      point: PlayPoint, force: number, now: number, kind?: GestureKind, hold?: number,
    ): void {
      const first = !started;
      if (first) { last = now; started = true; }
      // The runtime's own follow-through: how long this stroke lasts and, since
      // the travel is a speed now, how far it gets. See `violin.ts`.
      const span = Math.min(Math.max(
        Number.isFinite(hold) && hold! > 0 ? hold! : strokeSpan,
        SPAN_MIN,
      ), SPAN_MAX);

      // The bow goes up, and the travel walks home to the middle of the hair
      // with it — which is where a lifted bow's `soundingContact` puts the hand.
      if (point.kind === 'rest') {
        lift = BOW_LIFT;
        if (now !== strokeAt) {
          leanFrom = leanAt(now);
          leanTo = 0;
          strokeAt = now;
          strokeSpan = span;
        }
        placeBow();
        return;
      }
      if (point.kind !== 'string') return;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return;
      const f = Math.min(Math.max(force, 0), 1);
      amp[i] = Math.min(1.2, (amp[i] ?? 0) + 0.4 + f * 0.5);
      bellyAmp = Math.min(1, bellyAmp + 0.3 + f * 0.45);
      rockAmp = Math.min(1, rockAmp + 0.15 + f * 0.35);
      rockPhase = 0;
      // Reverse on anything that is not a slur, which is what `Runtime.stroke`
      // does with the same gestures. See the long note in `violin.ts`.
      turn(kind, f, now, span);
      bowString = i;
      lift = 0;
      placeBow();
    },

    update(now: number): void {
      if (!started) { last = now; started = true; }
      const dt = Math.min(Math.max(now - last, 0), 0.4);
      last = now;

      for (let i = 0; i < STRINGS; i++) {
        let a = amp[i] ?? 0;
        if (a <= 0.001) {
          if (a !== 0) {
            amp[i] = 0;
            strings[i]!.scale.set(1, gauge[i]!, gauge[i]!);
          }
          continue;
        }
        a *= Math.exp(-dt / 1.8);
        amp[i] = a;
        phase[i] = (phase[i] ?? 0) + dt * rate[i]!;
        strings[i]!.scale.set(1, gauge[i]! * (1 + a * 3.6), gauge[i]! * (1 + a * 1.3));
      }

      lean = leanAt(now);
      placeBow();

      if (bellyAmp > 0.002) {
        bellyAmp *= Math.exp(-dt / 1.0);
        belly.scale.y = 0.085 * (1 + Math.sin(now * 10) * bellyAmp * 0.16);
        bridgeGroup.rotation.z = Math.sin(now * 10) * bellyAmp * 0.028;
      } else if (bellyAmp !== 0) {
        bellyAmp = 0;
        belly.scale.y = 0.085;
        bridgeGroup.rotation.z = 0;
      }

      if (rockAmp > 0.002) {
        rockAmp *= Math.exp(-dt / 1.1);
        rockPhase += dt * 4.5;
        rock.rotation.z = Math.sin(rockPhase) * rockAmp * 0.006;
        rock.rotation.x = Math.cos(rockPhase * 0.6) * rockAmp * 0.004;
      } else if (rockAmp !== 0) {
        rockAmp = 0;
        rock.rotation.set(0, 0, 0);
      }
    },

    dispose(): void {
      pegs.dispose();
      root.removeFromParent();
      root.clear();
      kit.release();
    },
  };

  return model;
};
