/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Flute — held sideways, which is the entire point.
 *
 * The clarinet is a dark vertical dropping from the mouth to the boards; this
 * is a bright horizontal running across the frame to the player's right, which
 * is local −x (`SIDE.right`). The head turns, the left arm crosses the body,
 * both hands hang under the tube with the fingers arching over it, and the
 * instrument catches the light along its whole length.
 *
 * ## Hands
 *
 * The left hand is nearer the lips and the right nearer the foot, each with
 * one contact: the index finger on the first cup of its block. The note is
 * `Contact.fingers`, from the same chart that lifts the pads. There is no
 * octave key, so the register drives the thing a flautist actually does
 * instead: roll the instrument out as the line climbs.
 */

import {
  BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial,
  SphereGeometry, TorusGeometry, Vector3,
} from 'three';

import { ARCHETYPES } from '../../../concert/instruments.js';
import type { Effector, PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import { mouthFor } from './mouth.js';
import type {
  Contact, FingerCurl, InstrumentBuildOptions, InstrumentBuilder, InstrumentModel,
} from './types.js';
import { addTo, indexToCentre } from './types.js';

// ---------------------------------------------------------------------------
// Fingering
// ---------------------------------------------------------------------------

/** B3: the bottom of a B-foot flute. Non-transposing. */
const FLOOR = 59;
/** D5 is the first note that repeats the first octave with the index lifted. */
const SECOND = 15;
/** D6 and above: the third octave, its own cycle. */
const THIRD_FROM = 27;

/** Levers beyond the eight cups: the G# lever and the foot rollers. */
type Key = 'g#' | 'eb' | 'c#' | 'c' | 'b';

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
  /** 0, 1 or 2: how far the embouchure is doing the work. */
  register: number;
  keys: readonly Key[];
}

const NONE: readonly Key[] = [];

/** B3 up to Eb5, a row a semitone; E5 to C#6 reuse E4 to C#5. The thumb key is behind. */
const FIRST: readonly Row[] = [
  { l: [1, 1, 1, 0], r: [1, 1, 1, 1], keys: ['b'] },
  { l: [1, 1, 1, 0], r: [1, 1, 1, 1], keys: ['c'] },
  { l: [1, 1, 1, 0], r: [1, 1, 1, 1], keys: ['c#'] },
  { l: [1, 1, 1, 0], r: [1, 1, 1, 0] },
  { l: [1, 1, 1, 0], r: [1, 1, 1, 1], keys: ['eb'] },
  { l: [1, 1, 1, 0], r: [1, 1, 0, 1], keys: ['eb'] },
  { l: [1, 1, 1, 0], r: [1, 0, 0, 1], keys: ['eb'] },
  { l: [1, 1, 1, 0], r: [0, 0, 1, 1], keys: ['eb'] },
  { l: [1, 1, 1, 0], r: [0, 0, 0, 1], keys: ['eb'] },
  { l: [1, 1, 1, 1], r: [0, 0, 0, 1], keys: ['eb', 'g#'] },
  { l: [1, 1, 0, 0], r: [0, 0, 0, 1], keys: ['eb'] },
  { l: [1, 0, 0, 0], r: [1, 0, 0, 1], keys: ['eb'] },
  { l: [1, 0, 0, 0], r: [0, 0, 0, 1], keys: ['eb'] },
  { l: [1, 0, 0, 0], r: [0, 0, 0, 1], keys: ['eb'] },
  { l: [0, 0, 0, 0], r: [0, 0, 0, 1], keys: ['eb'] },
  { l: [0, 1, 1, 0], r: [1, 1, 1, 0] },
  { l: [0, 1, 1, 0], r: [1, 1, 1, 1], keys: ['eb'] },
];

/** D6 up to C7. */
const THIRD: readonly Row[] = [
  { l: [0, 1, 1, 0], r: [1, 1, 0, 1], keys: ['eb'] },
  { l: [0, 1, 1, 0], r: [1, 0, 0, 1], keys: ['eb'] },
  { l: [1, 1, 0, 0], r: [1, 0, 0, 1], keys: ['eb'] },
  { l: [1, 0, 1, 0], r: [1, 0, 0, 1], keys: ['eb'] },
  { l: [1, 0, 1, 0], r: [0, 0, 1, 1], keys: ['eb'] },
  { l: [0, 1, 1, 0], r: [0, 0, 0, 1], keys: ['eb'] },
  { l: [0, 1, 1, 1], r: [0, 0, 0, 1], keys: ['eb', 'g#'] },
  { l: [1, 0, 1, 0], r: [1, 1, 0, 1], keys: ['eb'] },
  { l: [1, 0, 0, 0], r: [1, 1, 1, 1], keys: ['eb'] },
  { l: [1, 1, 0, 0], r: [0, 1, 1, 1], keys: ['eb'] },
  { l: [0, 1, 1, 0], r: [1, 1, 0, 1], keys: ['eb'] },
];

/** The fingering for a pitch. Total: below the flute is all down. */
export function fingeringFor(midi: number): Fingering {
  const n = midi - FLOOR;
  let row: Row;
  let register: number;
  if (n < FIRST.length) {
    row = FIRST[Math.max(n, 0)]!;
    register = n < SECOND ? 0 : 1;
  } else if (n < THIRD_FROM) {
    row = FIRST[n - 12]!;
    register = 1;
  } else {
    row = THIRD[(n - THIRD_FROM) % THIRD.length]!;
    register = 2;
  }
  return { left: row.l, right: row.r, register, keys: row.keys ?? NONE };
}

// ---------------------------------------------------------------------------
// Shared GPU resources
// ---------------------------------------------------------------------------

interface Disposable { dispose(): void }

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
// Proportions
// ---------------------------------------------------------------------------

const SPEC = ARCHETYPES.flute;

/** A concert flute is 67 cm. Local +x is the crown end and −x the foot. */
const HALF = 0.335;
/** The embouchure hole sits 16.5 cm in from the crown. */
const LIP_X = HALF - 0.165;
/** Swing of the far end toward the audience, and its droop: square across the player, nearly. */
const SWING = 0.24;
const DROOP = 0.14;
/** How far a pad swings off its hole, radians about the rod. */
const LIFT = 0.55;

interface Pad {
  name: string;
  /** Along the tube from the lips' frame, metres; the foot is −x. */
  x: number;
  small?: boolean;
  /** 1 on its hole, 0 lifted. Closed-standing pads answer 1 until their key is pressed. */
  closed(f: Fingering): number;
}

const has = (f: Fingering, k: Key): boolean => f.keys.includes(k);
const on = (b: boolean): number => (b ? 1 : 0);
const either = (a: number, b: number): number => Math.max(a, b);

/**
 * The cups, crown end first. The Bb pad closes under the A key or the F key,
 * which is the "one and one" Bb; the G# and Eb pads stand closed; the foot
 * rollers close in a chain down to low B.
 */
const PADS: readonly Pad[] = [
  { name: 'l1', x: 0.065, closed: (f) => f.left[0] },
  { name: 'bb', x: 0.042, small: true, closed: (f) => either(f.left[1], f.right[0]) },
  { name: 'l2', x: 0.028, closed: (f) => f.left[1] },
  { name: 'l3', x: -0.005, closed: (f) => f.left[2] },
  { name: 'g#', x: -0.030, small: true, closed: (f) => on(!has(f, 'g#')) },
  { name: 'r1', x: -0.070, closed: (f) => f.right[0] },
  { name: 'r2', x: -0.104, closed: (f) => f.right[1] },
  { name: 'r3', x: -0.138, closed: (f) => f.right[2] },
  { name: 'eb', x: -0.185, closed: (f) => on(!has(f, 'eb')) },
  { name: 'c#', x: -0.230, closed: (f) => on(has(f, 'c#') || has(f, 'c') || has(f, 'b')) },
  { name: 'c', x: -0.265, closed: (f) => on(has(f, 'c') || has(f, 'b')) },
  { name: 'b', x: -0.300, closed: (f) => on(has(f, 'b')) },
];

export const buildFlute: InstrumentBuilder = (opts: InstrumentBuildOptions): InstrumentModel => {
  live++;
  const rng = new Rng(`flute:${opts.seed}`);

  /** This player's lips; the whole tube is hung off the embouchure hole. */
  const mouth = mouthFor(opts, SPEC.workHeight);

  const bodyHue = opts.finish ?? (rng.chance(0.25) ? '#d8c47a' : '#dfe4ea');
  const matBody = shared(`body:${bodyHue}`, () => new MeshStandardMaterial({
    // Polished harder than anything else in the family: on a lit stage the flute is a line of light.
    color: bodyHue, roughness: 0.13, metalness: 0.97,
  }));
  const matKeys = shared('keys', () => new MeshStandardMaterial({
    color: '#c7ccd3', roughness: 0.26, metalness: 0.9,
  }));
  const matDark = shared('dark', () => new MeshStandardMaterial({
    color: '#2a2724', roughness: 0.6, metalness: 0.1,
  }));

  const alongX = (g: CylinderGeometry): CylinderGeometry => g.rotateZ(Math.PI / 2);
  const geoHead = shared('head', () => alongX(new CylinderGeometry(0.0105, 0.0105, 0.220, 12)));
  const geoBody = shared('bodyjoint', () => alongX(new CylinderGeometry(0.0098, 0.0098, 0.315, 12)));
  const geoFoot = shared('foot', () => alongX(new CylinderGeometry(0.0092, 0.0092, 0.135, 12)));
  const geoCrown = shared('crown', () => alongX(new CylinderGeometry(0.0118, 0.0118, 0.018, 12)));
  const geoLipPlate = shared('lipplate', () => new BoxGeometry(0.034, 0.005, 0.026));
  const geoLipRim = shared('liprim', () => new TorusGeometry(0.0062, 0.0026, 4, 10).rotateX(Math.PI / 2));
  const geoCup = shared('cup', () => new CylinderGeometry(0.0115, 0.0115, 0.004, 8));
  const geoRod = shared('rod', () => alongX(new CylinderGeometry(0.0026, 0.0026, 0.30, 6)));
  const geoTenon = shared('tenon', () => alongX(new CylinderGeometry(0.0112, 0.0112, 0.016, 10)));
  const geoTip = shared('tip', () => new SphereGeometry(0.0104, 10, 6));

  // --- assembly ----------------------------------------------------------
  const root = new Group();
  root.name = 'flute';

  /**
   * Flute frame: local +x runs from the crown, past the lips, out to the foot;
   * local +y is the keyed top. The whole thing swings toward the audience and
   * droops a little, which is how one is actually held.
   */
  const flute = addTo(root, new Group());
  flute.rotation.set(0, SWING, DROOP);
  // Put the lips at the same height every blown archetype puts a mouth.
  const lipLocal = new Vector3(LIP_X, 0, 0).applyEuler(flute.rotation);
  flute.position.set(0, mouth.y - lipLocal.y, -lipLocal.z);

  /** The roll group turns about the tube's own axis, so a key moves under it by under a millimetre. */
  const roll = addTo(flute, new Group());

  flute.updateMatrix();
  const fluteMatrix = flute.matrix.clone();

  // Everything is laid out from the crown at +x down to the foot at −x.
  const head = addTo(roll, new Mesh(geoHead, matBody));
  head.name = 'head-joint';
  head.position.x = HALF - 0.110;
  head.castShadow = true;
  const crown = addTo(roll, new Mesh(geoCrown, matDark));
  crown.name = 'crown';
  crown.position.x = HALF - 0.009;
  const body = addTo(roll, new Mesh(geoBody, matBody));
  body.name = 'body-joint';
  body.position.x = HALF - 0.220 - 0.1575;
  body.castShadow = true;
  const foot = addTo(roll, new Mesh(geoFoot, matBody));
  foot.name = 'foot-joint';
  foot.position.x = HALF - 0.535 - 0.0675;
  foot.castShadow = true;
  const tip = addTo(roll, new Mesh(geoTip, matBody));
  tip.name = 'foot-tip';
  tip.position.x = -HALF;

  for (const x of [0.220, 0.535]) {
    const tenon = addTo(roll, new Mesh(geoTenon, matBody));
    tenon.name = 'tenon';
    tenon.position.x = HALF - x;
  }

  const lipPlate = addTo(roll, new Mesh(geoLipPlate, matBody));
  lipPlate.name = 'mouthpiece';
  lipPlate.position.set(LIP_X, 0.0095, 0);
  const lipRim = addTo(roll, new Mesh(geoLipRim, matBody));
  lipRim.name = 'embouchure';
  lipRim.position.set(LIP_X, 0.0125, 0);

  for (const x of [0.02, 0.24]) {
    const rod = addTo(roll, new Mesh(geoRod, matKeys));
    rod.name = 'rod';
    rod.position.set(HALF - x - 0.15, 0.0138, -0.0075);
  }

  /** Each cup hangs off a hinge on the rod behind it, so lifting is a turn about the rod. */
  const hinges: Group[] = PADS.map((pad) => {
    const hinge = addTo(roll, new Group());
    hinge.position.set(pad.x, 0.0092, -0.0075);
    const cup = addTo(hinge, new Mesh(geoCup, matKeys));
    cup.name = `pad-${pad.name}`;
    cup.position.set(0, 0.0022, 0.0075);
    if (pad.small) cup.scale.set(0.65, 1, 0.65);
    return hinge;
  });

  // --- contacts ----------------------------------------------------------
  /**
   * Both hands hang under the tube and arch over it from opposite sides: the
   * left in front with its palm turned back at the player, the right behind
   * with its palm out at the room. `side` signs both vectors, so the two hands
   * are one mirror pair about the tube's axis, and `along` runs the knuckles
   * across the tube with the index toward the crown on both.
   */
  /** From a cup's top face to an unpressed index pad, striking end-on: the flesh and the press travel. */
  const KEY_OFF = 0.011;
  const CUP_TOP = 0.0134;

  function contactAt(x: number, side: number): Contact {
    return {
      position: new Vector3(x, CUP_TOP + KEY_OFF, 0).applyMatrix4(fluteMatrix),
      normal: new Vector3(0, -0.09, side).normalize().transformDirection(fluteMatrix),
      along: new Vector3(-side, 0, 0).transformDirection(fluteMatrix),
    };
  }
  // Toward the foot from each block's first cup, so the index lands on that cup.
  const centre = indexToCentre(opts.height);
  const leftContact = contactAt(PADS[0]!.x - centre, 1);
  const rightContact = contactAt(PADS[5]!.x - centre, -1);

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

  const [LO, HI] = SPEC.range;

  // --- animation state ---------------------------------------------------
  const closed: number[] = PADS.map((p) => p.closed(fingeringFor(LO)));
  const closedTo: number[] = [...closed];
  let rollAt = 0;
  let rollTo = 0;
  let shiver = 0;
  let lastBeat = Number.NaN;
  /** Guards a second `dispose`: `release` is refcounted across the stage. */
  let disposed = false;

  return {
    archetype: 'flute',
    root,
    station: {
      // Behind the lips, not behind the instrument: the shoulders sit where the head joint is.
      offset: new Vector3(lipLocal.x, 0, -mouth.z),
      facing: 0,
      posture: SPEC.posture,
    },

    resolve(point: PlayPoint, effector?: Effector): Contact | undefined {
      const right = isRight(effector);
      const contact = right ? rightContact : leftContact;
      if (point.kind === 'rest') return copy(contact);
      if (point.kind !== 'hole') return undefined;
      if (point.midi < LO || point.midi > HI) return undefined;
      const f = fingeringFor(point.midi);
      return copy(contact, right ? f.right : f.left);
    },

    react(point: PlayPoint, force: number, _now: number): void {
      if (point.kind === 'rest') {
        rollTo = 0;
        return;
      }
      if (point.kind !== 'hole') return;
      if (point.midi < LO || point.midi > HI) return;
      const f = fingeringFor(point.midi);
      for (let i = 0; i < PADS.length; i++) closedTo[i] = PADS[i]!.closed(f);
      // Rolled out for the top octave, back in for the bottom.
      rollTo = f.register * 0.055;
      shiver = Math.max(shiver, Math.min(Math.max(force, 0), 1));
    },

    update(now: number): void {
      // A non-finite beat would make every eased value NaN for the rest of the show.
      if (!Number.isFinite(now)) return;
      const dt = Number.isFinite(lastBeat) ? Math.min(Math.max(now - lastBeat, 0), 0.5) : 0;
      lastBeat = now;
      if (dt === 0) return;

      const k = 1 - Math.exp(-dt / 0.03);
      for (let i = 0; i < hinges.length; i++) {
        closed[i] = closed[i]! + (closedTo[i]! - closed[i]!) * k;
        hinges[i]!.rotation.x = -LIFT * (1 - closed[i]!);
      }
      shiver += (0 - shiver) * (1 - Math.exp(-dt / 0.10));
      rollAt += (rollTo - rollAt) * (1 - Math.exp(-dt / 0.14));
      roll.rotation.x = rollAt + 0.03 * shiver;
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
