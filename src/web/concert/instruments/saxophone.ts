/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Saxophone — one model, four horns.
 *
 * `opts.scale` snaps to a family member (soprano, alto, tenor, baritone) and
 * sets the tube length, the bell and the transposition; the fingering is the
 * same on all four. The horn hangs on the player's right (`SIDE.right` is
 * local −x) with the keywork on the tube's +z face toward the house and only
 * the thumbs behind it.
 *
 * ## Hands
 *
 * Each hand has one contact, the pearl under its index finger, and never moves
 * along the tube. The note is `Contact.fingers`, read off the same chart that
 * closes the pads, so the fingers and the keywork cannot disagree.
 */

import {
  BoxGeometry, CatmullRomCurve3, CylinderGeometry, DoubleSide, Group,
  LatheGeometry, Mesh, MeshStandardMaterial, TorusGeometry, TubeGeometry,
  Vector2, Vector3,
} from 'three';

import { ARCHETYPES } from '../../../concert/instruments.js';
import type { Effector, PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import { BLOWN_MOUTH_Y, mouthFor } from './mouth.js';
import type {
  Contact, FingerCurl, InstrumentBuildOptions, InstrumentBuilder, InstrumentModel,
} from './types.js';
import { addTo, indexToCentre } from './types.js';

// ---------------------------------------------------------------------------
// The family
// ---------------------------------------------------------------------------

interface Member {
  name: string;
  /** Where this member sits on `InstrumentBuildOptions.scale`, 0..1. */
  at: number;
  /** Semitones to add to a sounding pitch to get the written one. */
  transpose: number;
}

/** `scale` 0.6 is a tenor, as the interface's own comment promises. */
const FAMILY: readonly Member[] = [
  { name: 'soprano', at: 0.0, transpose: 2 },
  { name: 'alto', at: 0.35, transpose: 9 },
  { name: 'tenor', at: 0.6, transpose: 14 },
  { name: 'baritone', at: 1.0, transpose: 21 },
];

function memberFor(scale: number | undefined): Member {
  const s = Math.min(Math.max(scale ?? 0.6, 0), 1);
  let best = FAMILY[0]!;
  for (const m of FAMILY) if (Math.abs(m.at - s) < Math.abs(best.at - s)) best = m;
  return best;
}

// ---------------------------------------------------------------------------
// Fingering
// ---------------------------------------------------------------------------

/** Touches beyond the six pearls: the pinky tables, the palm keys. */
type Key = 'g#' | 'eb' | 'c' | 'c#' | 'b' | 'bb' | 'palm-d' | 'palm-eb' | 'palm-f' | 'side';

interface Row {
  /** Left hand, index to little, 1 pressed. */
  l: FingerCurl;
  /** Right hand, index to little. */
  r: FingerCurl;
  keys?: readonly Key[];
}

export interface Fingering {
  left: FingerCurl;
  right: FingerCurl;
  /** The octave key, under the left thumb. */
  octave: boolean;
  keys: readonly Key[];
}

const NONE: readonly Key[] = [];

/** Written D up to C#, a row a semitone. The same twelve repeat with the octave key. */
const MAIN: readonly Row[] = [
  { l: [1, 1, 1, 0], r: [1, 1, 1, 0] },
  { l: [1, 1, 1, 0], r: [1, 1, 1, 1], keys: ['eb'] },
  { l: [1, 1, 1, 0], r: [1, 1, 0, 0] },
  { l: [1, 1, 1, 0], r: [1, 0, 0, 0] },
  { l: [1, 1, 1, 0], r: [0, 1, 0, 0] },
  { l: [1, 1, 1, 0], r: [0, 0, 0, 0] },
  { l: [1, 1, 1, 1], r: [0, 0, 0, 0], keys: ['g#'] },
  { l: [1, 1, 0, 0], r: [0, 0, 0, 0] },
  { l: [1, 0, 0, 0], r: [1, 0, 0, 0] },
  { l: [1, 0, 0, 0], r: [0, 0, 0, 0] },
  { l: [0, 1, 0, 0], r: [0, 0, 0, 0] },
  { l: [0, 0, 0, 0], r: [0, 0, 0, 0] },
];

/** Written Bb3 up to C#4, below the stacks: everything down plus a pinky table. */
const LOW: readonly Row[] = [
  { l: [1, 1, 1, 1], r: [1, 1, 1, 1], keys: ['bb'] },
  { l: [1, 1, 1, 1], r: [1, 1, 1, 1], keys: ['b'] },
  { l: [1, 1, 1, 0], r: [1, 1, 1, 1], keys: ['c'] },
  { l: [1, 1, 1, 1], r: [1, 1, 1, 0], keys: ['c#'] },
];

/** Written D6 up to F#6: the left palm keys, and from E the right hand on its side keys, off the pearls. */
const PALM: readonly Row[] = [
  { l: [0, 0, 0, 0], r: [0, 0, 0, 0], keys: ['palm-d'] },
  { l: [0, 0, 0, 0], r: [0, 0, 0, 0], keys: ['palm-d', 'palm-eb'] },
  { l: [0, 0, 0, 0], r: [1, 0, 0, 0], keys: ['palm-d', 'palm-eb', 'side'] },
  { l: [0, 0, 0, 0], r: [1, 0, 0, 0], keys: ['palm-d', 'palm-eb', 'palm-f', 'side'] },
  { l: [0, 0, 0, 0], r: [1, 0, 1, 0], keys: ['palm-d', 'palm-eb', 'palm-f', 'side'] },
];

/** Written Bb3, the bottom of every saxophone. */
const WRITTEN_FLOOR = 58;

/** The fingering for a sounding pitch. Total: below the horn is all down, above it repeats. */
export function fingeringFor(midi: number, member: Member): Fingering {
  const n = midi + member.transpose - WRITTEN_FLOOR;
  if (n < LOW.length) {
    const row = LOW[Math.max(n, 0)]!;
    return { left: row.l, right: row.r, octave: false, keys: row.keys ?? NONE };
  }
  const m = n - LOW.length;
  const pc = m % 12;
  const register = Math.floor(m / 12);
  const row = register >= 2 && pc < PALM.length ? PALM[pc]! : MAIN[pc]!;
  return { left: row.l, right: row.r, octave: register > 0, keys: row.keys ?? NONE };
}

/**
 * How far the model will answer: the union of `RANGE_OF`'s four saxophone
 * entries, which is wider than `ARCHETYPES.saxophone.range` at both ends.
 */
const LO = 37;
const HI = 89;

// ---------------------------------------------------------------------------
// Shared GPU resources
// ---------------------------------------------------------------------------

interface Disposable { dispose(): void }

/** Refcounted, and keyed by size, so two tenors cost one set of vertices. */
const CACHE = new Map<string, Disposable>();
let live = 0;

function shared<T extends Disposable>(key: string, make: () => T): T {
  const hit = CACHE.get(key) as T | undefined;
  if (hit) return hit;
  const made = make();
  CACHE.set(key, made);
  return made;
}

function release(): void {
  if (--live > 0) return;
  for (const res of CACHE.values()) res.dispose();
  CACHE.clear();
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

const SPEC = ARCHETYPES.saxophone;
/** Where the lips close on the mouthpiece; the height is this player's mouth. */
const LIP_Z = -0.02;
/** Mouthpiece length, tip to cork. The beak points *back*, into the player. */
const MP_LEN = 0.068;
/** How far past the lips the tip pokes; the rest of the beak is in the mouth. */
const MP_BITE = 0.020;
/** Body tube lean: bell end forward, top end back toward the player. */
const BODY_TILT_X = -0.10;
/**
 * How far in front of the lip point the bottom of the body tube sits. The
 * mouthpiece stays pinned at the lips and the neck reaches, as a real crook does.
 */
const BODY_Z = 0.140;
/** Negative leans the top of the tube toward +x, in from the right hip to the mouth. */
const BODY_TILT_Z = -0.09;
/** How far a pad swings off its hole, radians about its hinge. Shallow, on a long arm, so the cup lifts more than it tilts. */
const LIFT = 0.20;

function flareProfile(len: number, r0: number, r1: number, steps: number): Vector2[] {
  const pts: Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push(new Vector2(r0 + (r1 - r0) * t ** 2.4, t * len));
  }
  return pts;
}

interface Pad {
  name: string;
  /** Height up the body tube from the bow, metres. */
  y: number;
  /** Across the tube from the pearls' line; positive toward the player's left. */
  x: number;
  small?: boolean;
  /** 1 on its hole, 0 lifted. Closed-standing pads answer 1 until their key is pressed. */
  closed(f: Fingering): number;
}

interface Hinge {
  group: Group;
  /** Sign of the rotation that lifts this cup off the tube. */
  sign: number;
  closed(f: Fingering): number;
}

export const buildSaxophone: InstrumentBuilder = (opts: InstrumentBuildOptions): InstrumentModel => {
  live++;
  const mouth = mouthFor(opts, BLOWN_MOUTH_Y);
  const member = memberFor(opts.scale);
  const s = member.at;
  const rng = new Rng(`saxophone:${opts.seed}`);

  // Proportions, all driven by the member so a "tenor" is always tenor-sized.
  const bodyLen = 0.36 + 0.30 * s;
  const rTop = 0.0125 + 0.009 * s;
  const rBot = 0.024 + 0.018 * s;
  const bowR = 0.045 + 0.030 * s;
  const bellR = 0.032 + 0.048 * s;
  const bellLen = 0.15 + 0.15 * s;
  /** A whole horn below the lips; the strap length is whatever puts it there. */
  const bowY = mouth.y - (0.53 + 0.28 * s);
  const key = member.name;
  /** Which side of the player the horn hangs on: their right, which is −x. */
  const SIDE = -1;

  const lacquer = opts.finish ?? (rng.chance(0.22) ? '#b08d55' : '#c69a33');
  const matBody = shared(`body:${lacquer}`, () => new MeshStandardMaterial({
    color: lacquer, roughness: 0.34, metalness: 0.85,
  }));
  /** The keywork wears the body's lacquer, as most saxophones' does; silver cups flash white when they tilt. */
  const matKeys = matBody;
  const matSilver = shared('silver', () => new MeshStandardMaterial({
    color: '#d9dde2', roughness: 0.3, metalness: 0.9,
  }));
  const matDark = shared('dark', () => new MeshStandardMaterial({
    color: '#1b1a18', roughness: 0.62, metalness: 0.06,
  }));
  /** Both faces, for the bell alone: its flare shows its inside to the house. */
  const matBore = shared(`bore:${lacquer}`, () => new MeshStandardMaterial({
    color: lacquer, roughness: 0.34, metalness: 0.85, side: DoubleSide,
  }));

  const geoBody = shared(`tube:${key}`, () => new CylinderGeometry(rTop, rBot, bodyLen, 12)
    .translate(0, bodyLen / 2, 0));
  const geoBow = shared(`bow:${key}`, () => {
    const g = new TorusGeometry(bowR, rBot, 6, 12, Math.PI);
    g.rotateY(-Math.PI / 2);
    g.rotateX(Math.PI);
    return g;
  });
  const geoBell = shared(`bell:${key}`, () => new LatheGeometry(flareProfile(bellLen, rBot, bellR, 8), 16));
  /** The bead round the bell's mouth, turned onto the bell's +y axis here. */
  const geoBellRim = shared(`bellrim:${key}`, () => new TorusGeometry(bellR, 0.0055, 5, 20).rotateX(Math.PI / 2));
  const geoCup = shared(`cup:${key}`, () => new CylinderGeometry(0.013 + 0.006 * s, 0.013 + 0.006 * s, 0.005, 8));
  const geoRod = shared(`rod:${key}`, () => new CylinderGeometry(0.0035, 0.0035, bodyLen * 0.8, 6));
  const geoMouthpiece = shared('mouthpiece', () => new LatheGeometry([
    new Vector2(0.006, 0), new Vector2(0.012, 0.012), new Vector2(0.0155, 0.03),
    new Vector2(0.0155, 0.056), new Vector2(0.011, 0.068),
  ], 10));
  const geoLigature = shared('ligature', () => new TorusGeometry(0.0165, 0.0035, 4, 12));
  const geoOctave = shared('octave', () => new BoxGeometry(0.010, 0.030, 0.007));
  const geoThumb = shared('thumb', () => new BoxGeometry(0.020, 0.026, 0.008));
  const geoRing = shared('ring', () => new TorusGeometry(0.011, 0.0025, 4, 10));

  // --- assembly ----------------------------------------------------------
  const root = new Group();
  root.name = `saxophone:${member.name}`;

  /** The straight body tube. Its local +y runs from the bow up to the neck. */
  const body = addTo(root, new Group());
  body.position.set(SIDE * 0.055, bowY + 0.055, BODY_Z);
  body.rotation.set(BODY_TILT_X, 0, BODY_TILT_Z);
  body.updateMatrix();
  const bodyMatrix = body.matrix.clone();

  const tube = addTo(body, new Mesh(geoBody, matBody));
  tube.name = 'body';
  tube.castShadow = true;
  tube.receiveShadow = true;

  /** Every body pad hinges on a long arm from the horn's own side of the tube. */
  const rodX = SIDE * (0.036 + 0.008 * s);
  const rod = addTo(body, new Mesh(geoRod, matKeys));
  rod.name = 'rod';
  rod.position.set(SIDE * (0.021 + 0.008 * s), bodyLen * 0.5, rTop * 0.4);

  const bow = addTo(root, new Mesh(geoBow, matBody));
  bow.name = 'bow';
  bow.position.set(body.position.x, body.position.y, body.position.z + bowR);
  bow.castShadow = true;

  /** The bell: up and forward past the player's hip. Its own group, so it flares. */
  const bellGroup = addTo(root, new Group());
  bellGroup.position.set(body.position.x, body.position.y - 0.004, body.position.z + 2 * bowR);
  bellGroup.rotation.x = 0.55;
  const bell = addTo(bellGroup, new Mesh(geoBell, matBore));
  bell.name = 'bell';
  bell.castShadow = true;
  bell.receiveShadow = true;
  const bellRim = addTo(bellGroup, new Mesh(geoBellRim, matBody));
  bellRim.name = 'bell-rim';
  bellRim.position.y = bellLen;

  /** The strap hook, on the back of the tube where the strap can reach it. */
  const strapRing = addTo(body, new Mesh(geoRing, matSilver));
  strapRing.position.set(0, bodyLen * 0.66, -(rTop + 0.008));
  strapRing.rotation.x = Math.PI / 2;

  /** The neck crook, from the top of the body across and back to the cork. */
  const corkZ = LIP_Z + MP_LEN - MP_BITE;
  const bodyTop = new Vector3(0, bodyLen, 0).applyMatrix4(bodyMatrix);
  const neckCurve = new CatmullRomCurve3([
    bodyTop.clone(),
    bodyTop.clone().add(new Vector3(0.004, 0.055, -0.012)),
    new Vector3(SIDE * 0.024, mouth.y - 0.012, corkZ + 0.055),
    new Vector3(0, mouth.y, corkZ + 0.006),
  ]);
  const geoNeck = shared(`neck:${key}:${bodyTop.x.toFixed(3)}:${bodyTop.y.toFixed(3)}:${bodyTop.z.toFixed(3)}`,
    () => new TubeGeometry(neckCurve, 14, rTop * 1.05, 8, false));
  const neck = addTo(root, new Mesh(geoNeck, matBody));
  neck.name = 'neck';
  neck.castShadow = true;

  const mouthpiece = addTo(root, new Mesh(geoMouthpiece, matDark));
  mouthpiece.name = 'mouthpiece';
  mouthpiece.position.set(0, mouth.y, corkZ);
  // −π/2 lays the lathe along −z, so the tip ends up in the player's mouth.
  mouthpiece.rotation.x = -Math.PI / 2 - 0.25;
  const ligature = addTo(root, new Mesh(geoLigature, matSilver));
  ligature.name = 'ligature';
  ligature.position.set(0, mouth.y - 0.004, corkZ - 0.014);
  ligature.rotation.x = 0.25;

  /** The octave key and the thumb hook, on the face of the tube toward the player. */
  const octave = addTo(body, new Group());
  octave.position.set(0, bodyLen * 0.94, -(rTop + 0.006));
  addTo(octave, new Mesh(geoOctave, matKeys)).name = 'octave-key';
  const thumb = addTo(body, new Mesh(geoThumb, matDark));
  thumb.name = 'thumb-rest';
  thumb.position.set(0, bodyLen * 0.5, -(rTop + 0.006));

  // --- keywork -----------------------------------------------------------
  /**
   * Pearl spacing within a stack, and where each stack's outer pearl sits. The
   * spacing is capped at this player's own knuckle spacing, so a short player
   * on a baritone still has a finger on every pearl.
   */
  const pearl = Math.min(0.026 + 0.014 * s, indexToCentre(opts.height) / 1.5);
  const yF = bodyLen * 0.40;
  const yG = bodyLen * 0.56;
  const rAt = (y: number): number => rBot + (rTop - rBot) * (y / bodyLen);
  const has = (f: Fingering, k: Key): boolean => f.keys.includes(k);
  const on = (b: boolean): number => (b ? 1 : 0);
  const either = (a: number, b: number): number => Math.max(a, b);
  /** A right finger on a pearl; on the side keys the whole hand is off the stack. */
  const rh = (f: Fingering, i: number): number => (has(f, 'side') ? 0 : f.right[i]!);

  /**
   * The pads on the body, bow end first. The pinky tables sit to the player's
   * left, the right pinky's spatulas to their right, and the C# spatula closes
   * low C while it opens its own pad, which is what the table does.
   */
  const PADS: readonly Pad[] = [
    { name: 'low-c', y: bodyLen * 0.05, x: SIDE * 0.004,
      closed: (f) => on(has(f, 'bb') || has(f, 'b') || has(f, 'c') || has(f, 'c#')) },
    { name: 'low-c#', y: bodyLen * 0.10, x: -SIDE * 0.010, closed: (f) => on(!has(f, 'c#')) },
    { name: 'eb', y: yF - 2.6 * pearl, x: SIDE * 0.010, small: true, closed: (f) => on(!has(f, 'eb')) },
    { name: 'd', y: yF - 2 * pearl, x: 0, closed: (f) => rh(f, 2) },
    { name: 'e', y: yF - pearl, x: 0, closed: (f) => rh(f, 1) },
    { name: 'f', y: yF, x: 0, closed: (f) => rh(f, 0) },
    { name: 'f#', y: yF + 0.55 * pearl, x: 0, small: true, closed: (f) => either(rh(f, 0), rh(f, 1)) },
    { name: 'g#', y: yG - 0.6 * pearl, x: -SIDE * 0.012, small: true, closed: (f) => on(!has(f, 'g#')) },
    { name: 'g', y: yG, x: 0, closed: (f) => f.left[2] },
    { name: 'a', y: yG + pearl, x: 0, closed: (f) => f.left[1] },
    { name: 'bis', y: yG + 1.5 * pearl, x: 0, small: true, closed: (f) => either(f.left[1], rh(f, 0)) },
    { name: 'b', y: yG + 2 * pearl, x: 0, closed: (f) => f.left[0] },
    { name: 'c#', y: yG + 2.9 * pearl, x: 0, small: true, closed: (f) => either(f.left[0], f.left[1]) },
    { name: 'palm-d', y: yG + 3.6 * pearl, x: -SIDE * 0.012, small: true, closed: (f) => on(!has(f, 'palm-d')) },
    { name: 'palm-eb', y: yG + 4.2 * pearl, x: -SIDE * 0.012, small: true, closed: (f) => on(!has(f, 'palm-eb')) },
    { name: 'palm-f', y: yG + 4.8 * pearl, x: -SIDE * 0.012, small: true, closed: (f) => on(!has(f, 'palm-f')) },
  ];

  const hinges: Hinge[] = [];
  for (const pad of PADS) {
    const r = rAt(pad.y);
    const hinge = addTo(body, new Group());
    hinge.position.set(rodX + pad.x, pad.y, r * 0.5);
    const cup = addTo(hinge, new Mesh(geoCup, matKeys));
    cup.name = `pad-${pad.name}`;
    cup.position.set(-rodX, 0, r * 0.5 + 0.006);
    cup.rotation.x = Math.PI / 2;
    if (pad.small) cup.scale.set(0.62, 1, 0.62);
    hinges.push({ group: hinge, sign: SIDE, closed: pad.closed });
  }

  /** Low B and Bb, on the bell, turned to face between the house and the player's left. */
  const bellKeys = addTo(bellGroup, new Group());
  bellKeys.rotation.y = SIDE * Math.PI / 4;
  const BELL_PADS: readonly { name: string; at: number; closed(f: Fingering): number }[] = [
    { name: 'low-b', at: 0.35, closed: (f) => on(has(f, 'b') || has(f, 'bb')) },
    { name: 'low-bb', at: 0.60, closed: (f) => on(has(f, 'bb')) },
  ];
  for (const pad of BELL_PADS) {
    const r = rBot + (bellR - rBot) * pad.at ** 2.4;
    const hinge = addTo(bellKeys, new Group());
    hinge.position.set(-SIDE * (r + 0.006), pad.at * bellLen, -0.02);
    const cup = addTo(hinge, new Mesh(geoCup, matKeys));
    cup.name = `pad-${pad.name}`;
    cup.position.set(0, 0, 0.02);
    cup.rotation.z = Math.PI / 2;
    hinges.push({ group: hinge, sign: -SIDE, closed: pad.closed });
  }

  // --- contacts ----------------------------------------------------------
  /**
   * From a cup's centre, out toward the house, to an unpressed index pad: the
   * cup's half depth, the flesh of the pad, and the press travel still to come.
   */
  const KEY_OFF = 0.013;

  /**
   * One contact per hand, placed so the index pad lands on the top pearl of its
   * stack and the other fingers fall down the tube at the rig's spacing. The
   * back of the hand faces out to its own side and a little forward, so the
   * fingers come round the tube onto the pearls and a knuckle flex pushes them
   * toward the player, into the keys; `along` is mirrored per hand so each
   * wrist stays on its own side of the horn with the knuckles running down it.
   */
  function contactAt(y: number, side: number): Contact {
    const normal = new Vector3(side, 0, 0.5).normalize();
    return {
      position: new Vector3(0, y, rAt(y) + 0.006 + KEY_OFF).applyMatrix4(bodyMatrix),
      normal: normal.transformDirection(bodyMatrix),
      along: new Vector3(0, -side, 0).transformDirection(bodyMatrix),
    };
  }
  const centre = indexToCentre(opts.height);
  const leftContact = contactAt(yG + 2 * pearl - centre, 1);
  const rightContact = contactAt(yF - centre, -1);

  function copy(c: Contact, fingers?: FingerCurl): Contact {
    return {
      position: c.position.clone(),
      normal: c.normal.clone(),
      ...(c.along ? { along: c.along.clone() } : {}),
      ...(fingers ? { fingers } : {}),
    };
  }

  /** `'right-hand'` and `'bow'` ask for the sounding hand. See `InstrumentModel`. */
  function isRight(effector?: Effector): boolean {
    return effector === undefined || effector === 'right-hand' || effector === 'bow';
  }

  // --- animation state ---------------------------------------------------
  const closed: number[] = hinges.map(() => 1);
  const closedTo: number[] = hinges.map(() => 1);
  let octaveAt = 0;
  let octaveTo = 0;
  let flare = 0;
  let lastBeat = Number.NaN;
  /** Guards a second `dispose`: `release` is refcounted across the stage. */
  let disposed = false;

  return {
    archetype: 'saxophone',
    root,
    station: {
      /** Behind the mouthpiece, on the centreline: the horn does the sidestep. */
      offset: new Vector3(0, 0, LIP_Z - mouth.z),
      facing: 0,
      posture: SPEC.posture,
    },

    resolve(point: PlayPoint, effector?: Effector): Contact | undefined {
      const right = isRight(effector);
      const contact = right ? rightContact : leftContact;
      if (point.kind === 'rest') return copy(contact);
      if (point.kind !== 'hole') return undefined;
      if (point.midi < LO || point.midi > HI) return undefined;
      const f = fingeringFor(point.midi, member);
      return copy(contact, right ? f.right : f.left);
    },

    react(point: PlayPoint, force: number, _now: number): void {
      if (point.kind === 'rest') {
        // Between phrases the fingers stay over the keys and the octave key lets go.
        octaveTo = 0;
        return;
      }
      if (point.kind !== 'hole') return;
      if (point.midi < LO || point.midi > HI) return;
      const f = fingeringFor(point.midi, member);
      for (let i = 0; i < hinges.length; i++) closedTo[i] = hinges[i]!.closed(f);
      octaveTo = f.octave ? 1 : 0;
      flare = Math.max(flare, 0.2 + 0.8 * Math.min(Math.max(force, 0), 1));
    },

    update(now: number): void {
      // A non-finite beat would make every eased value NaN for the rest of the show.
      if (!Number.isFinite(now)) return;
      const dt = Number.isFinite(lastBeat) ? Math.min(Math.max(now - lastBeat, 0), 0.5) : 0;
      lastBeat = now;
      if (dt === 0) return;

      // Pads are light and fast; they snap rather than settle.
      const k = 1 - Math.exp(-dt / 0.035);
      for (let i = 0; i < hinges.length; i++) {
        closed[i] = closed[i]! + (closedTo[i]! - closed[i]!) * k;
        const h = hinges[i]!;
        h.group.rotation.y = h.sign * LIFT * (1 - closed[i]!);
      }
      octaveAt += (octaveTo - octaveAt) * k;
      octave.rotation.x = -0.5 * octaveAt;

      flare += (0 - flare) * (1 - Math.exp(-dt / 0.22));
      const g = 1 + 0.05 * flare;
      bellGroup.scale.set(g, 1 + 0.015 * flare, g);
    },

    dispose(): void {
      // A second call would free the shared buffers under every other one on the stage.
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      root.clear();
      release();
    },
  };
};
