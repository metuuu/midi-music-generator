/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Clarinet — straight, black, and held down the front.
 *
 * The clarinet and the flute have to be built as opposites or the wind section
 * reads as one instrument at two angles. This one is the vertical: a dark tube
 * dropping from the mouth toward the floor, the fingers stacked one above the
 * other down its front, the bell pointing at the boards. The flute is the
 * horizontal, and neither should be mistakable for the other in silhouette
 * from the back of the room.
 *
 * ## The twelfth
 *
 * A clarinet is a stopped pipe, so it overblows a **twelfth** rather than an
 * octave. That single acoustic fact is why its fingering pattern repeats every
 * nineteen semitones instead of twelve, why the chalumeau register runs so far
 * up before the register key is needed, and why a clarinettist's hands crawl
 * the whole length of the instrument in a way a flautist's never do. It is
 * cheap to encode and it is the difference between animating a clarinet and
 * animating a black flute.
 *
 * Nineteen stations, therefore. The lowest note has everything closed; each
 * semitone above opens one more hole from the bell end; the register key
 * repeats the lot a twelfth higher.
 */

import {
  BoxGeometry, CylinderGeometry, Group, LatheGeometry, Mesh,
  MeshStandardMaterial, TorusGeometry, Vector2, Vector3,
} from 'three';

import { ARCHETYPES } from '../../../concert/instruments.js';
import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import type {
  Contact, InstrumentBuildOptions, InstrumentBuilder, InstrumentModel,
} from './types.js';
import { addTo } from './types.js';

// ---------------------------------------------------------------------------
// Fingering
// ---------------------------------------------------------------------------

/** A Bb clarinet sounds a major second below what it reads. */
const TRANSPOSE = 2;
/** Written E3, the bottom of the horn, everything closed. */
const WRITTEN_FLOOR = 52;
/** The clarinet overblows a twelfth. This number is the whole instrument. */
const STATIONS = 19;

function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

export interface Fingering {
  /** 0 (all closed, low E) .. 18 (only the top hole closed). */
  station: number;
  /** 0 chalumeau, 1 clarion (register key), 2+ altissimo. */
  register: number;
}

/** The fingering for a sounding pitch. Pure, and total over the integers. */
export function fingeringFor(midi: number): Fingering {
  const written = midi + TRANSPOSE;
  return {
    station: mod(written - WRITTEN_FLOOR, STATIONS),
    register: Math.floor((written - WRITTEN_FLOOR) / STATIONS),
  };
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
/** Where the lips are: the same height every blown archetype puts a mouth. */
const MOUTH = new Vector3(0, 1.50, -0.16);
/** Finger holes run between these distances from the mouthpiece. */
const FIRST_HOLE = 0.17;
const LAST_HOLE = 0.53;
/** Only ten pads are drawn for nineteen stations; the rest are open holes. */
const PAD_STATIONS: readonly number[] = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18];

export const buildClarinet: InstrumentBuilder = (opts: InstrumentBuildOptions): InstrumentModel => {
  live++;
  const rng = new Rng(`clarinet:${opts.seed}`);

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
  const geoRod = shared('rod', () => new CylinderGeometry(0.0028, 0.0028, 0.30, 6));
  const geoLever = shared('lever', () => new BoxGeometry(0.008, 0.026, 0.006));
  const geoThumb = shared('thumbrest', () => new BoxGeometry(0.018, 0.010, 0.014));

  // --- assembly ----------------------------------------------------------
  const root = new Group();
  root.name = 'clarinet';

  /**
   * Tube frame: local +y runs from the bell rim up to the mouthpiece tip, and
   * local +z is the *front* of the instrument — the side the finger holes are
   * on, which faces the audience, with the thumb and register key behind. That
   * is the right way round and it is the one people get wrong.
   */
  const tube = addTo(root, new Group());
  tube.rotation.x = LEAN;
  tube.position.set(
    MOUTH.x,
    MOUTH.y - TUBE * Math.cos(LEAN),
    MOUTH.z - TUBE * Math.sin(LEAN),
  );
  tube.updateMatrix();
  const tubeMatrix = tube.matrix.clone();

  /** The bell gets its own group so it can shiver without moving the tube. */
  const bellGroup = addTo(tube, new Group());
  const bell = addTo(bellGroup, new Mesh(geoBell, matWood));
  bell.castShadow = true;
  bell.receiveShadow = true;
  const lower = addTo(tube, new Mesh(geoLower, matWood));
  lower.position.y = 0.085;
  lower.castShadow = true;
  const upper = addTo(tube, new Mesh(geoUpper, matWood));
  upper.position.y = 0.320;
  upper.castShadow = true;
  const barrel = addTo(tube, new Mesh(geoBarrel, matWood));
  barrel.position.y = 0.540;
  const mouthpiece = addTo(tube, new Mesh(geoMouthpiece, matWood));
  mouthpiece.position.y = 0.600;
  const reed = addTo(tube, new Mesh(geoReed, matReed));
  reed.position.set(0, 0.632, -0.0125);
  const ligature = addTo(tube, new Mesh(geoLigature, matKeys));
  ligature.position.y = 0.612;

  for (const y of [0.083, 0.318, 0.538]) {
    const ring = addTo(tube, new Mesh(geoRing, matKeys));
    ring.position.y = y;
  }
  for (const y of [0.20, 0.42]) {
    const rod = addTo(tube, new Mesh(geoRod, matKeys));
    rod.position.set(0.019, y, 0.004);
  }

  const thumbrest = addTo(tube, new Mesh(geoThumb, matKeys));
  thumbrest.position.set(0, 0.300, -0.020);

  /** The register key: the thumb lever that turns the horn into a twelfth. */
  const register = addTo(tube, new Group());
  register.position.set(0, 0.470, -0.014);
  addTo(register, new Mesh(geoLever, matKeys));

  // --- stations ----------------------------------------------------------
  /** Distance from the mouthpiece for each of the nineteen fingerings. */
  const stationY: number[] = [];
  for (let i = 0; i < STATIONS; i++) {
    const d = LAST_HOLE - (i / (STATIONS - 1)) * (LAST_HOLE - FIRST_HOLE);
    stationY.push(TUBE - d);
  }

  const pads: Group[] = PAD_STATIONS.map((st) => {
    const hinge = addTo(tube, new Group());
    hinge.position.set(0.017, stationY[st]!, 0.004);
    const cup = addTo(hinge, new Mesh(geoCup, matKeys));
    cup.position.set(-0.017, 0, 0.013);
    return hinge;
  });

  // --- contacts ----------------------------------------------------------
  const contacts: Contact[] = stationY.map((y) => ({
    position: new Vector3(0, y, 0.028).applyMatrix4(tubeMatrix),
    // Out of the front of the tube, angled a little up its length: fingers
    // come over the top of a clarinet, never straight in from the side.
    normal: new Vector3(0, 0.25, 1).normalize().transformDirection(tubeMatrix),
      // The keys run the length of the tube, so the knuckles do too.
      along: new Vector3(0, 1, 0).transformDirection(tubeMatrix),
  }));
  /** Between phrases the hands stay over the middle of the horn. */
  const restContact = contacts[9]!;

  function copy(c: Contact): Contact {
    return { position: c.position.clone(), normal: c.normal.clone() };
  }

  const [LO, HI] = SPEC.range;

  // --- animation state ---------------------------------------------------
  const closed: number[] = PAD_STATIONS.map(() => 1);
  const closedTo: number[] = PAD_STATIONS.map(() => 1);
  let registerAt = 0;
  let registerTo = 0;
  let ring = 0;
  let lastBeat = Number.NaN;

  return {
    archetype: 'clarinet',
    root,
    station: {
      offset: new Vector3(0, 0, -0.30),
      facing: 0,
      posture: SPEC.posture,
    },

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') return copy(restContact);
      if (point.kind !== 'hole') return undefined;
      if (point.midi < LO || point.midi > HI) return undefined;
      return copy(contacts[fingeringFor(point.midi).station]!);
    },

    react(point: PlayPoint, force: number, _now: number): void {
      if (point.kind === 'rest') {
        registerTo = 0;
        return;
      }
      if (point.kind !== 'hole') return;
      if (point.midi < LO || point.midi > HI) return;
      const { station, register: reg } = fingeringFor(point.midi);
      for (let i = 0; i < PAD_STATIONS.length; i++) {
        closedTo[i] = PAD_STATIONS[i]! >= station ? 1 : 0;
      }
      registerTo = reg > 0 ? 1 : 0;
      // A clarinet does not flare — the bell is barely part of the sound
      // except at the bottom of the horn. What it does is ring, so the bell
      // gets a short shiver on a hard attack. Nothing else on the instrument
      // moves, because every finger contact is measured against the tube and a
      // model whose geometry drifts under its own contacts lies to the hand it
      // is placing.
      ring = Math.max(ring, Math.min(Math.max(force, 0), 1));
    },

    update(now: number): void {
      const dt = Number.isFinite(lastBeat) ? Math.min(Math.max(now - lastBeat, 0), 0.5) : 0;
      lastBeat = now;
      if (dt === 0) return;

      const k = 1 - Math.exp(-dt / 0.035);
      for (let i = 0; i < pads.length; i++) {
        closed[i] = closed[i]! + (closedTo[i]! - closed[i]!) * k;
        pads[i]!.rotation.x = -0.26 * (1 - closed[i]!);
      }
      registerAt += (registerTo - registerAt) * k;
      register.rotation.x = 0.45 * registerAt;

      ring += (0 - ring) * (1 - Math.exp(-dt / 0.12));
      const g = 1 + 0.03 * ring;
      bellGroup.scale.set(g, 1, g);
    },

    dispose(): void {
      root.removeFromParent();
      root.clear();
      release();
    },
  };
};
