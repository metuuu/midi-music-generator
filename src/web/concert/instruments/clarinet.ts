/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Clarinet — straight, black, and held down the front.
 *
 * The clarinet and the flute are built as opposites so the wind section does
 * not read as one instrument at two angles: this is the vertical, a dark tube
 * dropping from the mouth toward the boards with the fingers stacked down its
 * front, and the flute is the horizontal.
 *
 * ## Hands
 *
 * The left hand owns the upper joint and the right the lower, each with one
 * contact: the index finger on the top hole of its joint. The note is
 * `Contact.fingers`, from the same chart that opens the pads, so the fingers
 * and the keywork cannot disagree. A clarinet overblows a twelfth, so the
 * chalumeau chart repeats under the register key from written B4.
 */

import {
  BoxGeometry, CylinderGeometry, DoubleSide, Group, LatheGeometry, Mesh,
  MeshStandardMaterial, TorusGeometry, Vector2, Vector3,
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
// Fingering
// ---------------------------------------------------------------------------

/** A Bb clarinet sounds a major second below what it reads. */
const TRANSPOSE = 2;
/** Written E3, the bottom of the horn. */
const WRITTEN_FLOOR = 52;
/** Written B4 is where the register key repeats the chalumeau a twelfth up. */
const CLARION = 19;
/** Written C#6 and above: the altissimo, its own short cycle. */
const ALTISSIMO_FROM = 33;

/** Levers beyond the six holes: the pinky keys, the throat keys. */
type Key = 'e' | 'f' | 'f#' | 'ab' | 'c#' | 'g#' | 'a';

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
  /** The register key, under the left thumb. */
  register: boolean;
  keys: readonly Key[];
}

const NONE: readonly Key[] = [];

/** Written E3 up to Bb4, a row a semitone. The thumb hole is behind and not drawn. */
const CHALUMEAU: readonly Row[] = [
  { l: [1, 1, 1, 0], r: [1, 1, 1, 1], keys: ['e'] },
  { l: [1, 1, 1, 0], r: [1, 1, 1, 1], keys: ['f'] },
  { l: [1, 1, 1, 1], r: [1, 1, 1, 0], keys: ['f#'] },
  { l: [1, 1, 1, 0], r: [1, 1, 1, 0] },
  { l: [1, 1, 1, 0], r: [1, 1, 1, 1], keys: ['ab'] },
  { l: [1, 1, 1, 0], r: [1, 1, 0, 0] },
  { l: [1, 1, 1, 0], r: [1, 0, 0, 1], keys: ['ab'] },
  { l: [1, 1, 1, 0], r: [1, 0, 0, 0] },
  { l: [1, 1, 1, 0], r: [0, 0, 0, 0] },
  { l: [1, 1, 1, 1], r: [0, 0, 0, 0], keys: ['c#'] },
  { l: [1, 1, 0, 0], r: [0, 0, 0, 0] },
  { l: [1, 1, 0, 0], r: [1, 0, 0, 0] },
  { l: [1, 0, 0, 0], r: [0, 0, 0, 0] },
  { l: [0, 0, 0, 0], r: [0, 0, 0, 0] },
  { l: [1, 0, 0, 0], r: [0, 0, 0, 0], keys: ['g#'] },
  { l: [0, 0, 0, 0], r: [0, 0, 0, 0] },
  { l: [1, 0, 0, 0], r: [0, 0, 0, 0], keys: ['g#'] },
  { l: [1, 0, 0, 0], r: [0, 0, 0, 0], keys: ['a'] },
  { l: [1, 0, 0, 0], r: [0, 0, 0, 0], keys: ['a'] },
];

/** Written C#6 up to G6. */
const ALTISSIMO: readonly Row[] = [
  { l: [1, 1, 0, 0], r: [1, 0, 0, 0] },
  { l: [1, 0, 1, 0], r: [1, 0, 0, 0] },
  { l: [1, 0, 1, 0], r: [1, 1, 0, 0] },
  { l: [1, 1, 0, 0], r: [0, 1, 0, 0] },
  { l: [1, 0, 0, 0], r: [1, 1, 1, 0] },
  { l: [1, 1, 1, 0], r: [1, 0, 0, 0] },
  { l: [1, 0, 1, 0], r: [0, 0, 0, 0] },
];

/** The fingering for a sounding pitch. Total: below the horn is all down. */
export function fingeringFor(midi: number): Fingering {
  const n = midi + TRANSPOSE - WRITTEN_FLOOR;
  let row: Row;
  if (n < CLARION) row = CHALUMEAU[Math.max(n, 0)]!;
  else if (n < ALTISSIMO_FROM) row = CHALUMEAU[n - CLARION]!;
  else row = ALTISSIMO[(n - ALTISSIMO_FROM) % ALTISSIMO.length]!;
  return { left: row.l, right: row.r, register: n >= CLARION - 1, keys: row.keys ?? NONE };
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

const SPEC = ARCHETYPES.clarinet;

/** Mouthpiece tip to bell rim. A Bb clarinet is 66 cm. */
const TUBE = 0.66;
/** Lean from vertical. A clarinettist holds the bell out, not tucked in. */
const LEAN = -0.52;
/** Where the lips are along the model's own z; the height is this player's. */
const LIP_Z = -0.16;
/** The reed is bitten about 18 mm from the tip, and that is what sits at the lips. */
const BITE = 0.018;
/** How far a pad swings off its hole, radians about the rod. */
const LIFT = 0.40;

interface Hole {
  name: string;
  /** Height up the tube from the bell rim, metres. */
  y: number;
}

/** The six finger holes: three on the upper joint, three on the lower. */
const HOLES: readonly Hole[] = [
  { name: 'l1', y: 0.460 }, { name: 'l2', y: 0.428 }, { name: 'l3', y: 0.395 },
  { name: 'r1', y: 0.305 }, { name: 'r2', y: 0.271 }, { name: 'r3', y: 0.237 },
];

interface Pad {
  name: string;
  y: number;
  /** Across the tube; positive toward the player's left. */
  x: number;
  small?: boolean;
  /** 1 on its hole, 0 lifted. Closed-standing pads answer 1 until their key is pressed. */
  closed(f: Fingering): number;
}

const has = (f: Fingering, k: Key): boolean => f.keys.includes(k);
const on = (b: boolean): number => (b ? 1 : 0);

/**
 * The pads, bell end first. The three at the bottom stand open and the pinky
 * levers close them in a chain; the rest stand closed and their key opens them.
 */
const PADS: readonly Pad[] = [
  { name: 'e', y: 0.110, x: 0, closed: (f) => on(has(f, 'e')) },
  { name: 'f', y: 0.150, x: 0, closed: (f) => on(has(f, 'e') || has(f, 'f')) },
  { name: 'f#', y: 0.190, x: 0.012, closed: (f) => on(has(f, 'e') || has(f, 'f') || has(f, 'f#')) },
  { name: 'ab', y: 0.215, x: -0.012, small: true, closed: (f) => on(!has(f, 'ab')) },
  { name: 'c#', y: 0.300, x: 0.012, small: true, closed: (f) => on(!has(f, 'c#')) },
  { name: 'g#', y: 0.500, x: 0.010, small: true, closed: (f) => on(!has(f, 'g#')) },
  { name: 'a', y: 0.522, x: 0.004, small: true, closed: (f) => on(!has(f, 'a')) },
];

export const buildClarinet: InstrumentBuilder = (opts: InstrumentBuildOptions): InstrumentModel => {
  live++;
  const rng = new Rng(`clarinet:${opts.seed}`);

  /** This player's lips; the tube is solved so the bite lands on them. */
  const mouth = mouthFor(opts, BLOWN_MOUTH_Y);

  // Grenadilla, or the cheaper resin that looks the same at ten metres.
  const woodHue = opts.finish ?? (rng.chance(0.2) ? '#1d1712' : '#121110');
  const matWood = shared(`wood:${woodHue}`, () => new MeshStandardMaterial({
    color: woodHue, roughness: 0.42, metalness: 0.02,
  }));
  const matKeys = shared('keys', () => new MeshStandardMaterial({
    color: '#d3d8de', roughness: 0.2, metalness: 0.94,
  }));
  const matReed = shared('reed', () => new MeshStandardMaterial({
    color: '#d9c395', roughness: 0.7, metalness: 0.0,
  }));
  const matHole = shared('hole', () => new MeshStandardMaterial({
    color: '#050403', roughness: 0.9, metalness: 0.0,
  }));
  /** Both faces, for the bell alone: it points at the front row, which looks into it. */
  const matBore = shared(`bore:${woodHue}`, () => new MeshStandardMaterial({
    color: woodHue, roughness: 0.42, metalness: 0.02, side: DoubleSide,
  }));

  const geoBell = shared('bell', () => new LatheGeometry([
    new Vector2(0.037, 0), new Vector2(0.031, 0.020), new Vector2(0.0235, 0.046),
    new Vector2(0.0180, 0.070), new Vector2(0.0158, 0.085),
  ], 14));
  const geoLower = shared('lower', () => new CylinderGeometry(0.0146, 0.0158, 0.235, 12)
    .translate(0, 0.235 / 2, 0));
  const geoUpper = shared('upper', () => new CylinderGeometry(0.0136, 0.0146, 0.220, 12)
    .translate(0, 0.220 / 2, 0));
  const geoBarrel = shared('barrel', () => new CylinderGeometry(0.0168, 0.0175, 0.060, 12)
    .translate(0, 0.060 / 2, 0));
  const geoMouthpiece = shared('mouthpiece', () => new LatheGeometry([
    new Vector2(0.0155, 0), new Vector2(0.0150, 0.026), new Vector2(0.0115, 0.048),
    new Vector2(0.0060, 0.060),
  ], 12));
  const geoLigature = shared('ligature', () => new TorusGeometry(0.0158, 0.0035, 4, 12).rotateX(Math.PI / 2));
  const geoReed = shared('reedgeo', () => new BoxGeometry(0.013, 0.055, 0.003));
  const geoRing = shared('ring', () => new TorusGeometry(0.0165, 0.0028, 4, 12).rotateX(Math.PI / 2));
  const geoCup = shared('cup', () => new CylinderGeometry(0.0115, 0.0115, 0.004, 8).rotateX(Math.PI / 2));
  const geoHole = shared('holegeo', () => new CylinderGeometry(0.0045, 0.0045, 0.003, 10).rotateX(Math.PI / 2));
  const geoHoleRing = shared('holering', () => new TorusGeometry(0.0072, 0.0014, 4, 12));
  const geoRod = shared('rod', () => new CylinderGeometry(0.0028, 0.0028, 0.30, 6));
  const geoLever = shared('lever', () => new BoxGeometry(0.008, 0.026, 0.006));
  const geoThumb = shared('thumbrest', () => new BoxGeometry(0.018, 0.010, 0.014));

  // --- assembly ----------------------------------------------------------
  const root = new Group();
  root.name = 'clarinet';

  /**
   * Tube frame: local +y runs from the bell rim up to the mouthpiece tip, and
   * local +z is the front, the side the holes are on, which faces the house.
   */
  const tube = addTo(root, new Group());
  tube.rotation.x = LEAN;
  // Solve the position so the *bite*, not the tip, lands on the mouth.
  const lipAlong = TUBE - BITE;
  tube.position.set(
    0,
    mouth.y - lipAlong * Math.cos(LEAN),
    LIP_Z - lipAlong * Math.sin(LEAN),
  );
  tube.updateMatrix();
  const tubeMatrix = tube.matrix.clone();

  /** The bell gets its own group so it can shiver without moving the tube. */
  const bellGroup = addTo(tube, new Group());
  const bell = addTo(bellGroup, new Mesh(geoBell, matBore));
  bell.name = 'bell';
  bell.castShadow = true;
  bell.receiveShadow = true;
  const lower = addTo(tube, new Mesh(geoLower, matWood));
  lower.name = 'lower-joint';
  lower.position.y = 0.085;
  lower.castShadow = true;
  const upper = addTo(tube, new Mesh(geoUpper, matWood));
  upper.name = 'upper-joint';
  upper.position.y = 0.320;
  upper.castShadow = true;
  const barrel = addTo(tube, new Mesh(geoBarrel, matWood));
  barrel.name = 'barrel';
  barrel.position.y = 0.540;
  const mouthpiece = addTo(tube, new Mesh(geoMouthpiece, matWood));
  mouthpiece.name = 'mouthpiece';
  mouthpiece.position.y = 0.600;
  const reed = addTo(tube, new Mesh(geoReed, matReed));
  reed.name = 'reed';
  reed.position.set(0, 0.632, -0.0125);
  const ligature = addTo(tube, new Mesh(geoLigature, matKeys));
  ligature.name = 'ligature';
  ligature.position.y = 0.612;

  for (const y of [0.083, 0.318, 0.538]) {
    const ring = addTo(tube, new Mesh(geoRing, matKeys));
    ring.name = 'ferrule';
    ring.position.y = y;
  }
  for (const y of [0.20, 0.42]) {
    const rod = addTo(tube, new Mesh(geoRod, matKeys));
    rod.name = 'rod';
    rod.position.set(0.019, y, 0.004);
  }

  const thumbrest = addTo(tube, new Mesh(geoThumb, matKeys));
  thumbrest.name = 'thumb-rest';
  thumbrest.position.set(0, 0.300, -0.020);

  /** The register key: the thumb lever that turns the horn into a twelfth. */
  const register = addTo(tube, new Group());
  register.position.set(0, 0.470, -0.014);
  addTo(register, new Mesh(geoLever, matKeys));

  // --- keywork -----------------------------------------------------------
  /** The finger holes are dark discs with a ring; a finger on one is its cover. */
  for (const hole of HOLES) {
    const disc = addTo(tube, new Mesh(geoHole, matHole));
    disc.name = `hole-${hole.name}`;
    disc.position.set(0, hole.y, 0.0152);
    const ring = addTo(tube, new Mesh(geoHoleRing, matKeys));
    ring.name = `ring-${hole.name}`;
    ring.position.set(0, hole.y, 0.0158);
  }

  /** Each pad hangs off a hinge on the rod, so lifting is a turn about the tube's axis. */
  const hinges: Group[] = PADS.map((pad) => {
    const hinge = addTo(tube, new Group());
    hinge.position.set(pad.x + 0.017, pad.y, 0.004);
    const cup = addTo(hinge, new Mesh(geoCup, matKeys));
    cup.name = `pad-${pad.name}`;
    cup.position.set(-0.017, 0, 0.013);
    if (pad.small) cup.scale.set(0.7, 0.7, 1);
    return hinge;
  });

  // --- contacts ----------------------------------------------------------
  /** From a hole's face, out to the house, to an unpressed index pad: the flesh and the press travel. */
  const KEY_OFF = 0.011;
  const HOLE_Z = 0.0167;

  /**
   * One contact per hand, placed so the index pad lands on the top hole of its
   * joint and the other fingers fall down the tube at the rig's spacing. The
   * back of the hand faces out to its own side and a little forward, so the
   * fingers come round onto the holes and a knuckle flex seals them; `along` is
   * mirrored per hand so each wrist stays on its own side with the knuckles
   * running down the tube.
   */
  function contactAt(y: number, side: number): Contact {
    const normal = new Vector3(side, 0, 0.5).normalize();
    return {
      position: new Vector3(0, y, HOLE_Z + KEY_OFF).applyMatrix4(tubeMatrix),
      normal: normal.transformDirection(tubeMatrix),
      along: new Vector3(0, -side, 0).transformDirection(tubeMatrix),
    };
  }
  const centre = indexToCentre(opts.height);
  const leftContact = contactAt(HOLES[0]!.y - centre, 1);
  const rightContact = contactAt(HOLES[3]!.y - centre, -1);

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
  let registerAt = 0;
  let registerTo = 0;
  let ring = 0;
  let lastBeat = Number.NaN;
  /** Guards a second `dispose`: `release` is refcounted across the stage. */
  let disposed = false;

  return {
    archetype: 'clarinet',
    root,
    station: {
      // The lip point, less how far in front of the body this player's mouth is.
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
      const f = fingeringFor(point.midi);
      return copy(contact, right ? f.right : f.left);
    },

    react(point: PlayPoint, force: number, _now: number): void {
      if (point.kind === 'rest') {
        registerTo = 0;
        return;
      }
      if (point.kind !== 'hole') return;
      if (point.midi < LO || point.midi > HI) return;
      const f = fingeringFor(point.midi);
      for (let i = 0; i < PADS.length; i++) closedTo[i] = PADS[i]!.closed(f);
      registerTo = f.register ? 1 : 0;
      // A clarinet does not flare; it rings, so the bell gets a short shiver on a hard attack.
      ring = Math.max(ring, Math.min(Math.max(force, 0), 1));
    },

    update(now: number): void {
      // A non-finite beat would make every eased value NaN for the rest of the show.
      if (!Number.isFinite(now)) return;
      const dt = Number.isFinite(lastBeat) ? Math.min(Math.max(now - lastBeat, 0), 0.5) : 0;
      lastBeat = now;
      if (dt === 0) return;

      const k = 1 - Math.exp(-dt / 0.035);
      for (let i = 0; i < hinges.length; i++) {
        closed[i] = closed[i]! + (closedTo[i]! - closed[i]!) * k;
        hinges[i]!.rotation.y = LIFT * (1 - closed[i]!);
      }
      registerAt += (registerTo - registerAt) * k;
      register.rotation.x = 0.45 * registerAt;

      ring += (0 - ring) * (1 - Math.exp(-dt / 0.12));
      const g = 1 + 0.03 * ring;
      bellGroup.scale.set(g, 1, g);
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
