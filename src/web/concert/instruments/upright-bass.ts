/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Upright bass — four strings, no frets, and nearly as tall as the person
 * playing it.
 *
 * The unfretted case is the interesting one. `PlayPoint.fret` is still the
 * semitone offset from the open string, but there is no wire to snap to, so
 * the same equal-tempered rule is used *continuously*: the stopping point sits
 * at `MENSUR * 2^(-semitones/12)` from the bridge, for any real number of
 * semitones. A quarter-tone lands a quarter-tone up the fingerboard, which is
 * both correct and the only way a hand slid between two notes can be right at
 * both ends of the slide.
 *
 * Everything about this instrument is a consequence of the string being a
 * metre long: the positions are far apart, the hand only covers three
 * semitones without shifting, and the whole thing rocks when it is plucked.
 * The rock is in `react`, and it is most of what says "upright" rather than
 * "large cello".
 *
 * ## The bass leans on the player, and `held` says it does not
 *
 * `ARCHETYPES['upright-bass'].held` is `false`, so `show.ts` stands this model
 * on the deck and leaves it there while the player sways against it — and the
 * hands, which are placed from *this* model's world matrix, stay with the bass
 * and come away from the body. That reads exactly as reported: a bassist waving
 * left and right with their hands nailed to the air in front of them.
 *
 * It should be `true`. A double bass is not furniture; it is balanced against
 * the player's hip with an arm round it, and it goes where they go. `carry`
 * parents the root to the torso, and because `station.offset.y` is zero the
 * root lands at torso-local `-hipY`, which puts the endpin back on the deck
 * exactly. The one artefact is the endpin sliding a few centimetres with the
 * sway, which is what a real endpin does on a wooden stage.
 *
 * That flag lives in `concert/instruments.ts`, which is not this file's to
 * change. What *is* this file's is that the model works either way: everything
 * below the mount hangs off one `rock` pivot at the endpin tip, so the
 * instrument is a single rigid body about the point it actually turns about,
 * and the lean in `update` is a real lean rather than a shiver.
 *
 * Build frame: `+x` bridge → nut, `+y` out of the belly, `+z` **high → low**
 * string. The root's origin is the endpin, on the boards. The direction of `z`
 * is forced: it is `x × y`, and on an instrument stood on end with its face to
 * the house that lands on the player's *left* — which is the side the E string
 * is on. Numbering it the other way mirrors the whole instrument, and the tell
 * is a plucking hand that travels the wrong way across the strings.
 */

import {
  BoxGeometry, type BufferGeometry, CapsuleGeometry, CylinderGeometry,
  ExtrudeGeometry, Group, InstancedMesh, type Material, Matrix4, Mesh,
  MeshStandardMaterial, Shape, Vector3,
} from 'three';

import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import {
  addTo, type Contact, type InstrumentBuilder, type InstrumentModel,
  type PlayerStation,
} from './types.js';

/** Sounding string length, bridge to nut. A 3/4 bass, which is the standard. */
const MENSUR = 1.04;
const STRINGS = 4;
/**
 * How far up the fingerboard the model goes: two octaves, which is exactly
 * what `ARCHETYPES['upright-bass'].range` asks of the G string (43 → 67).
 */
const MAX_SEMITONES = 24;
const NUT_SPREAD = 0.038;
const BRIDGE_SPREAD = 0.086;
/** Upright action is famously high, and the finger has to get above it. */
const STRING_HEIGHT = 0.014;
const FINGER_HEIGHT = 0.026;
/**
 * The pizzicato hand lives at the end of the fingerboard.
 *
 * The board runs from the nut down to `stopX(MAX_SEMITONES)`, which is 0.26 —
 * so this was 0.285 and therefore two and a half centimetres *onto* the board,
 * which is nowhere a bassist has ever plucked.
 */
const PLUCK_X = 0.250;
/** And the bow between there and the bridge. */
const BOW_X = 0.165;
/**
 * How much clear air the plucking hand keeps below the stopping one.
 *
 * At a fixed pluck point the two hands meet in thumb position: the top of the
 * fingerboard *is* the end of the fingerboard, and the two contacts came out
 * 1.2 cm apart with the fingers interleaved. A bassist working up there plucks
 * further toward the bridge instead, so `soundingContact` moves with the stop.
 * It stays a pure function of the point, which is all the contract asks.
 */
const PLUCK_CLEAR = 0.075;
const PLUCK_MIN = 0.115;

const BODY_TAIL = -0.40;
const BODY_LEN = 1.10;

const FACE = new Vector3(0, 1, 0);

function mountBasis(alongStrings: Vector3, faceHint: Vector3, at: Vector3): Matrix4 {
  const x = alongStrings.clone().normalize();
  const y = faceHint.clone().addScaledVector(x, -faceHint.dot(x)).normalize();
  const z = new Vector3().crossVectors(x, y);
  return new Matrix4().makeBasis(x, y, z).setPosition(at);
}

/**
 * Leaning back into the player, and turned a few degrees off square.
 *
 * `size` is the one thing `InstrumentBuildOptions.scale` is for here: an
 * orchestral contrabass really is a bigger object than the 3/4 bass a jazz
 * player stands behind, by about six percent of everything. It goes in the
 * mount as a uniform scale rather than into `MENSUR`, so the geometry and the
 * fret rule cannot scale by different amounts — there is still only one
 * description of where the strings are.
 *
 * `resolve` therefore *does* vary with `scale`. That is allowed and necessary:
 * scale is a property of the instrument, fixed at build time, and the runtime
 * asks the same model instance every time. Only the seed is forbidden from
 * touching it.
 */
function mountFor(size: number): Matrix4 {
  const m = mountBasis(
    new Vector3(-0.120, 0.970, -0.210),
    new Vector3(0, 0.15, 0.99),
    new Vector3(0.090, 0.640, 0.140),
  );
  return m.scale(new Vector3(size, size, size)).setPosition(0.090, 0.640, 0.140);
}

/** 3/4 at the default; a contrabass is the big one. */
function sizeFrom(scale: number | undefined): number {
  return 1 + (Math.min(Math.max(scale ?? 0.5, 0), 1) - 0.5) * 0.12;
}

/** Distance from the bridge to a stop `n` semitones above the open string. */
function stopX(n: number): number {
  return MENSUR * Math.pow(2, -n / 12);
}

/**
 * Where string `i` sits across the bridge. Index order is low to high, as
 * `PlayPoint.string` requires; `+z` runs the other way. See the frame note.
 */
function stringZ(i: number, x: number): number {
  const t = Math.min(Math.max(x / MENSUR, 0), 1);
  const spread = BRIDGE_SPREAD + (NUT_SPREAD - BRIDGE_SPREAD) * t;
  return -(i - (STRINGS - 1) / 2) * (spread / (STRINGS - 1));
}

/** Across the strings — the axis a hand's knuckles lie along. See `Contact`. */
const ACROSS = new Vector3(0, 0, 1);

function contactAt(mount: Matrix4, x: number, y: number, z: number): Contact {
  return {
    position: new Vector3(x, y, z).applyMatrix4(mount),
    normal: FACE.clone().transformDirection(mount),
    // Across the strings, not up the neck. On a fingerboard this is the whole
    // difference between a hand over the strings and a hand lying along one.
    along: ACROSS.clone().transformDirection(mount),
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

/**
 * The violin family's outline: two bouts and a waist with corners in it.
 *
 * Shared shape, three sizes — the bass, the cello and the fiddle are the same
 * drawing at different scales, which is true of the instruments as well.
 */
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

/** Not part of `InstrumentModel`. See the note on `soundingContact`. */
export interface UprightBassModel extends InstrumentModel {
  /**
   * Where the right hand goes — the end of the fingerboard, where a bassist
   * actually pulls the string. `resolve` answers for the stopping hand.
   */
  soundingContact(point: PlayPoint): Contact | undefined;
}

export const buildUprightBass: InstrumentBuilder = (opts) => {
  const rng = new Rng(`upright-bass:${opts.seed}`);
  const kit = new Kit();

  const root = new Group();
  root.name = 'upright-bass';
  /** Rocks about the endpin, which is exactly where this group's origin is. */
  const rock = addTo(root, new Group());
  const inst = addTo(rock, new Group());
  const MOUNT = mountFor(sizeFrom(opts.scale));
  inst.applyMatrix4(MOUNT);

  const wood = opts.finish ?? rng.pick(['#a4682f', '#8d5527', '#b87a3c', '#7c4a22']);
  const bodyMat = kit.mat(new MeshStandardMaterial({
    color: wood, roughness: 0.5, metalness: 0.03,
  }));
  const bellyMat = kit.mat(new MeshStandardMaterial({
    color: rng.pick(['#d9a45c', '#c8934c', '#e2b26a']), roughness: 0.55,
  }));
  const ebonyMat = kit.mat(new MeshStandardMaterial({ color: '#1a1512', roughness: 0.45 }));
  const stringMat = kit.mat(new MeshStandardMaterial({
    color: '#b9b2a0', roughness: 0.5, metalness: 0.35,
  }));
  const metalMat = kit.mat(new MeshStandardMaterial({
    color: '#b9bcc0', roughness: 0.3, metalness: 0.85, flatShading: true,
  }));

  // --- Body ----------------------------------------------------------------
  const bodyGeo = kit.geo(new ExtrudeGeometry(
    violinOutline(
      BODY_TAIL, BODY_LEN,
      0.335 * rng.float(0.97, 1.03),
      0.225 * rng.float(0.96, 1.04),
      0.262 * rng.float(0.97, 1.03),
      0.048,
    ),
    {
      depth: 0.150, bevelEnabled: true, bevelThickness: 0.035,
      bevelSize: 0.030, bevelSegments: 3, curveSegments: 6,
    },
  ));
  bodyGeo.rotateX(-Math.PI / 2);
  // A double bass bridge is 16 cm tall, so the belly sits a long way under the
  // strings. Getting this wrong makes the whole instrument look like a toy.
  bodyGeo.translate(0, -0.341, 0);
  const body = addTo(inst, new Mesh(bodyGeo, bodyMat));
  body.castShadow = true;
  body.receiveShadow = true;

  /** The belly, as a thin slice of the same outline, so it can breathe. */
  const belly = addTo(inst, new Mesh(bodyGeo, bellyMat));
  belly.scale.set(0.97, 0.075, 0.97);
  belly.position.set(0, -0.138, 0);
  belly.receiveShadow = true;

  const fGeo = kit.geo(new CapsuleGeometry(0.012, 0.145, 2, 6));
  fGeo.rotateZ(Math.PI / 2);
  for (const side of [1, -1]) {
    const f = addTo(inst, new Mesh(fGeo, ebonyMat));
    f.position.set(0.005, -0.145, side * 0.145);
    f.rotation.y = side * 0.22;
  }

  // --- Neck, fingerboard, scroll ------------------------------------------
  const neckGeo = kit.geo(new BoxGeometry(MENSUR - 0.66, 0.052, 0.058));
  const neck = addTo(inst, new Mesh(neckGeo, bodyMat));
  neck.position.set((MENSUR + 0.66) / 2, -0.048, 0);
  neck.castShadow = true;

  // Runs from the nut down to exactly the two-octave stop, which is as far as
  // this model claims a hand can go.
  const boardLen = MENSUR - stopX(MAX_SEMITONES);
  const boardGeo = kit.geo(new BoxGeometry(boardLen, 0.026, 0.076));
  const board = addTo(inst, new Mesh(boardGeo, ebonyMat));
  board.position.set(MENSUR - boardLen / 2, -0.014, 0);
  board.castShadow = true;

  const pegboxGeo = kit.geo(new BoxGeometry(0.19, 0.062, 0.052));
  addTo(inst, new Mesh(pegboxGeo, bodyMat)).position.set(MENSUR + 0.095, -0.030, 0);
  const scrollGeo = kit.geo(new CylinderGeometry(0.045, 0.030, 0.048, 8));
  scrollGeo.rotateX(Math.PI / 2);
  const scroll = addTo(inst, new Mesh(scrollGeo, bodyMat));
  scroll.position.set(MENSUR + 0.205, -0.012, 0);
  scroll.rotation.z = 0.5;

  const pegGeo = kit.geo(new CylinderGeometry(0.011, 0.011, 0.115, 6));
  pegGeo.rotateX(Math.PI / 2);
  const pegs = addTo(inst, new InstancedMesh(pegGeo, metalMat, STRINGS));
  {
    const m = new Matrix4();
    for (let i = 0; i < STRINGS; i++) {
      const side = i % 2 === 0 ? 0.02 : -0.02;
      pegs.setMatrixAt(i, m.makeTranslation(
        MENSUR + 0.045 + Math.floor(i / 2) * 0.075, -0.030, side,
      ));
    }
    pegs.instanceMatrix.needsUpdate = true;
  }

  const nutGeo = kit.geo(new BoxGeometry(0.012, 0.018, 0.046));
  addTo(inst, new Mesh(nutGeo, kit.mat(new MeshStandardMaterial({
    color: '#e5dcc6', roughness: 0.45,
  })))).position.set(MENSUR + 0.004, 0.004, 0);

  // --- Bridge, which rocks, and the tailpiece ------------------------------
  // Pivoted at its feet, so the rock in `update` reads as the bridge leaning
  // rather than as the bridge sliding.
  const bridgeGroup = addTo(inst, new Group());
  bridgeGroup.position.set(0, -0.150, 0);
  const bridgeShape = new Shape();
  bridgeShape.moveTo(-0.058, -0.085);
  bridgeShape.lineTo(-0.030, -0.085);
  bridgeShape.lineTo(-0.020, -0.020);
  bridgeShape.bezierCurveTo(-0.005, 0.030, 0.005, 0.030, 0.020, -0.020);
  bridgeShape.lineTo(0.030, -0.085);
  bridgeShape.lineTo(0.058, -0.085);
  bridgeShape.lineTo(0.048, 0.020);
  bridgeShape.bezierCurveTo(0.030, 0.075, -0.030, 0.075, -0.048, 0.020);
  const bridgeGeo = kit.geo(new ExtrudeGeometry(bridgeShape, {
    depth: 0.016, bevelEnabled: true, bevelThickness: 0.004,
    bevelSize: 0.004, bevelSegments: 1, curveSegments: 5,
  }));
  // The shape is drawn in the (across, up) plane and stood on the belly:
  // (across, up, thickness) becomes build (thickness, up, -across).
  bridgeGeo.rotateY(Math.PI / 2);
  bridgeGeo.translate(0, 0.085, -0.008);
  const bridge = addTo(bridgeGroup, new Mesh(bridgeGeo, kit.mat(
    new MeshStandardMaterial({ color: '#e0c48a', roughness: 0.55 }),
  )));
  bridge.castShadow = true;

  const tailGeo = kit.geo(new BoxGeometry(0.30, 0.018, 0.115));
  const tail = addTo(inst, new Mesh(tailGeo, ebonyMat));
  tail.position.set(-0.195, -0.085, 0);
  tail.rotation.z = 0.10;

  // --- Strings -------------------------------------------------------------
  const stringGeo = kit.geo(new CylinderGeometry(0.0022, 0.0022, MENSUR + 0.10, 5, 1, true));
  stringGeo.rotateZ(-Math.PI / 2);
  stringGeo.translate((MENSUR + 0.10) / 2 - 0.05, 0, 0);
  const strings: Mesh[] = [];
  const gauge: number[] = [];
  for (let i = 0; i < STRINGS; i++) {
    const m = addTo(inst, new Mesh(stringGeo, stringMat));
    const g = 2.3 - i * 0.32;
    gauge.push(g);
    m.position.set(0, STRING_HEIGHT, stringZ(i, 0));
    m.rotation.y = -Math.asin((stringZ(i, MENSUR) - stringZ(i, 0)) / MENSUR);
    m.scale.set(1, g, g);
    strings.push(m);
  }

  // --- Endpin, which is vertical in the world and not in the build frame ---
  /**
   * On `rock`, not on `root`.
   *
   * The pin is the leg the instrument turns about and it has to turn with it.
   * Hung off the root it stayed bolt upright while the body above it leaned,
   * so the socket and the tail came apart — a millimetre at the old amplitude,
   * and a centimetre at the one the lean actually needs. `rock`'s origin is the
   * pin's tip, so the tip is the pivot and the pin sweeps from it.
   */
  {
    const foot = new Vector3(BODY_TAIL - 0.02, -0.09, 0).applyMatrix4(MOUNT);
    const pinGeo = kit.geo(new CylinderGeometry(0.010, 0.008, Math.max(foot.y, 0.05), 6));
    const pin = addTo(rock, new Mesh(pinGeo, metalMat));
    pin.position.set(foot.x, Math.max(foot.y, 0.05) / 2, foot.z);
    pin.castShadow = true;
  }

  // --- Reaction state ------------------------------------------------------
  const amp = new Float32Array(STRINGS);
  const phase = new Float32Array(STRINGS);
  /** A long string wobbles slowly, and the eye can see it do it. */
  const rate = [7, 8.5, 10, 12];
  for (let i = 0; i < STRINGS; i++) phase[i] = rng.float(0, Math.PI * 2);
  let rockAmp = 0;
  let rockPhase = 0;
  /** A steady lean into the player, topped up by every note and decaying out. */
  let pull = 0;
  let bellyAmp = 0;
  let last = 0;
  let started = false;

  const station: PlayerStation = {
    offset: new Vector3(-0.30, 0, -0.34),
    facing: 0,
    posture: 'stand',
  };

  /**
   * Which way "toward the player" is, from `station` rather than beside it.
   *
   * A pluck pulls the top of the bass back onto the player's chest and it
   * settles forward again — the one motion that says double bass rather than
   * cello on stilts. Deriving the direction from the station is what stops it
   * from pointing somewhere else the day the player moves.
   */
  const TOWARD = station.offset.clone().setY(0).normalize();

  /**
   * How far the instrument may lean, in radians. Small, and the ceiling is not
   * taste.
   *
   * `rock` sits *under* `root`, and the runtime places hands from
   * `root.matrixWorld` — so anything this group does moves the instrument and
   * not the hands on it. At a metre up the neck, 0.012 rad is 1.2 cm of
   * daylight between a fingertip and its string at the peak of a hard note,
   * which is about a finger's width and gone within the beat. Twice this and
   * the hands are visibly off the strings, which is the very complaint this
   * file is answering. A lean big enough to *read* has to move the root, and
   * the root is `show.ts`'s — see the `held` note at the top.
   */
  const LEAN_MAX = 0.012;

  const model: UprightBassModel = {
    archetype: 'upright-bass',
    root,
    station,

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        // Half position, hand off the string. Where a bassist's hand waits.
        const x = stopX(2);
        return contactAt(MOUNT, x, FINGER_HEIGHT + 0.05, stringZ(1, x));
      }
      if (point.kind !== 'string') return undefined;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return undefined;
      const n = point.fret;
      // Unfretted: no rounding. A stop at 3.5 semitones is a real place to be
      // in the middle of a slide, and snapping it would kill the slide.
      if (!Number.isFinite(n) || n < 0 || n > MAX_SEMITONES) return undefined;
      const x = stopX(n);
      return contactAt(MOUNT, x, FINGER_HEIGHT, stringZ(i, x));
    },

    soundingContact(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        return contactAt(MOUNT, PLUCK_X + 0.08, STRING_HEIGHT + 0.09, 0);
      }
      if (point.kind !== 'string') return undefined;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return undefined;
      const n = point.fret;
      if (!Number.isFinite(n) || n < 0 || n > MAX_SEMITONES) return undefined;
      // Down toward the bridge as the left hand climbs. See `PLUCK_CLEAR`.
      const x = Math.min(PLUCK_X, Math.max(PLUCK_MIN, stopX(n) - PLUCK_CLEAR));
      return contactAt(MOUNT, x, STRING_HEIGHT + 0.022, stringZ(i, x));
    },

    react(point: PlayPoint, force: number, now: number): void {
      if (point.kind !== 'string') return;
      const i = point.string;
      if (!Number.isInteger(i) || i < 0 || i >= STRINGS) return;
      const f = Math.min(Math.max(force, 0), 1);
      amp[i] = Math.min(1.6, (amp[i] ?? 0) + 0.7 + f * 0.6);
      bellyAmp = Math.min(1.2, bellyAmp + 0.4 + f * 0.5);
      // The rock is the signature. It is deliberately small — a metre and a
      // half above the pivot, half a degree is already a visible lurch.
      rockAmp = Math.min(1, rockAmp + 0.3 + f * 0.5);
      rockPhase = 0;
      // And the pull: a plucked string drags the whole instrument back onto the
      // player before it settles. Direction, not just amplitude, which is what
      // an oscillation on its own never gave.
      pull = Math.min(1, pull + 0.25 + f * 0.5);
      if (!started) { last = now; started = true; }
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
            strings[i]!.position.y = STRING_HEIGHT;
          }
          continue;
        }
        a *= Math.exp(-dt / (1.1 + (STRINGS - i) * 0.2));
        amp[i] = a;
        phase[i] = (phase[i] ?? 0) + dt * rate[i]!;
        strings[i]!.scale.set(1, gauge[i]! * (1 + a * 7), gauge[i]! * (1 + a * 2));
        strings[i]!.position.y = STRING_HEIGHT + Math.sin(phase[i]!) * a * 0.005;
      }

      if (bellyAmp > 0.002) {
        bellyAmp *= Math.exp(-dt / 0.6);
        belly.scale.y = 0.075 * (1 + Math.sin(now * 11) * bellyAmp * 0.25);
        bridgeGroup.rotation.z = Math.sin(now * 11) * bellyAmp * 0.05;
      } else if (bellyAmp !== 0) {
        bellyAmp = 0;
        belly.scale.y = 0.075;
        bridgeGroup.rotation.z = 0;
      }

      if (rockAmp > 0.002 || pull > 0.002) {
        rockAmp *= Math.exp(-dt / 0.9);
        // The lean outlives the wobble, which is what makes it read as the
        // instrument being held rather than as the instrument ringing.
        pull *= Math.exp(-dt / 1.6);
        rockPhase += dt * 5.5;
        const tilt = LEAN_MAX * (pull * 0.7 + Math.sin(rockPhase) * rockAmp * 0.5);
        // Leaning the top toward `TOWARD`: a positive turn about `z` carries it
        // toward `-x`, and a positive turn about `x` carries it toward `+z`.
        rock.rotation.z = -TOWARD.x * tilt;
        rock.rotation.x = TOWARD.z * tilt;
      } else if (rockAmp !== 0 || pull !== 0) {
        rockAmp = 0;
        pull = 0;
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
