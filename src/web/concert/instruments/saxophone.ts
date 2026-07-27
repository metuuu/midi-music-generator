/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Saxophone — one model, four horns.
 *
 * `opts.scale` snaps to a family member (soprano, alto, tenor, baritone) and
 * everything else follows from it: how long the body is, how low it hangs, how
 * wide the bell opens, and — the part that matters musically — how the horn
 * transposes. A tenor sounds a major ninth below what it reads; a baritone an
 * octave and a major sixth. The *fingering* is identical across all four,
 * which is the whole reason one saxophonist can pick up any of them, and it is
 * why one model at four sizes is the right shape for this file rather than a
 * compromise.
 *
 * ## Silhouette
 *
 * The curved bell and the neck crook. Nothing else about a saxophone reads at
 * stage distance — not the keywork, not the engraving — and a straight tube
 * with a flare on the end is a clarinet with ambitions. The soprano keeps the
 * curve here even though a real one is usually straight: curved sopranos exist,
 * and the alternative is a wind section where two players hold the same object.
 *
 * ## Fingering
 *
 * A saxophone shortens its air column from the bottom up: everything is closed
 * for the lowest note, and each semitone above opens one more hole from the
 * bell end. Twelve stations cover an octave, and the octave key repeats them.
 * That is the *simple-system* truth rather than the Boehm-derived truth — a
 * real sax has cross-fingerings and side keys — and it is the right lie at
 * this distance, because "the hand walks down the tube as the line falls" is
 * what an audience reads as playing, and a Boehm fingering chart would read as
 * flicker.
 */

import {
  BoxGeometry, CatmullRomCurve3, CylinderGeometry, Group, LatheGeometry, Mesh,
  MeshStandardMaterial, TorusGeometry, TubeGeometry, Vector2, Vector3,
} from 'three';

import { ARCHETYPES } from '../../../concert/instruments.js';
import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import type {
  Contact, InstrumentBuildOptions, InstrumentBuilder, InstrumentModel,
} from './types.js';
import { addTo } from './types.js';

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

/** Written Bb3 — the bottom of every saxophone, all holes closed. */
const WRITTEN_FLOOR = 58;
/** Stations round the tube before the octave key takes over. */
const STATIONS = 12;

function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

export interface Fingering {
  /** 0 (everything closed, lowest note) .. 11 (only the top hole closed). */
  station: number;
  /** 0 for the bottom register, 1 with the octave key, 2+ altissimo. */
  register: number;
}

/**
 * The fingering for a sounding pitch on a given member of the family.
 *
 * Note what does *not* happen here: nothing is clamped. A pitch below the
 * horn's own bottom still lands on a station, because the pattern repeats and
 * a hand has to go somewhere sensible. Whether the part should have been
 * written there at all is a casting question, and `npm run concert` already
 * asserts a rate on it — the geometry is the wrong place to raise it.
 */
export function fingeringFor(midi: number, member: Member): Fingering {
  const written = midi + member.transpose;
  return {
    station: mod(written - WRITTEN_FLOOR, STATIONS),
    register: Math.floor((written - WRITTEN_FLOOR) / STATIONS),
  };
}

/**
 * How far the model will answer.
 *
 * The union of `RANGE_OF`'s four saxophone entries, which is wider than
 * `ARCHETYPES.saxophone.range` at *both* ends — a low-A baritone reaches 37 and
 * an alto's altissimo reaches 89. Honouring only the archetype range would
 * leave real notes unresolved.
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
/**
 * The mouthpiece sits at the player's lips, whatever horn is on the strap.
 *
 * 1.50 m is where every blown archetype in the frozen table puts a mouth — the
 * trumpet, trombone, flute and harmonica all declare `workHeight: 1.5`, and
 * those are all instruments you play *at* your face. A saxophone's declared
 * 1.2 is its keywork, not its mouthpiece, so the horn hangs from this rather
 * than from the spec.
 */
const MOUTH = new Vector3(0, 1.50, -0.09);
/** Body tube lean: back toward the player, and inboard toward the mouth. */
const BODY_TILT_X = -0.30;
const BODY_TILT_Z = 0.09;

function flareProfile(len: number, r0: number, r1: number, steps: number): Vector2[] {
  const pts: Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push(new Vector2(r0 + (r1 - r0) * t ** 2.4, t * len));
  }
  return pts;
}

export const buildSaxophone: InstrumentBuilder = (opts: InstrumentBuildOptions): InstrumentModel => {
  live++;
  const member = memberFor(opts.scale);
  const s = member.at;
  const rng = new Rng(`saxophone:${opts.seed}`);

  // Proportions, all driven by the member so a "tenor" is always tenor-sized.
  const bodyLen = 0.34 + 0.28 * s;
  const rTop = 0.0125 + 0.009 * s;
  const rBot = 0.024 + 0.018 * s;
  const bowR = 0.045 + 0.030 * s;
  const bellR = 0.032 + 0.048 * s;
  const bellLen = 0.15 + 0.15 * s;
  // How low the horn hangs on the strap. Chosen so the keywork's midpoint
  // lands near the archetype's `workHeight`, which is what the camera frames.
  const bowY = 1.05 - 0.29 * s;
  const key = member.name;

  const lacquer = opts.finish ?? (rng.chance(0.22) ? '#b08d55' : '#c69a33');
  const matBody = shared(`body:${lacquer}`, () => new MeshStandardMaterial({
    color: lacquer, roughness: 0.34, metalness: 0.85,
  }));
  const matKeys = shared('keys', () => new MeshStandardMaterial({
    color: '#d9dde2', roughness: 0.2, metalness: 0.94,
  }));
  const matDark = shared('dark', () => new MeshStandardMaterial({
    color: '#1b1a18', roughness: 0.62, metalness: 0.06,
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
  body.position.set(0.055, bowY + 0.055, 0.015);
  body.rotation.set(BODY_TILT_X, 0, BODY_TILT_Z);
  body.updateMatrix();
  const bodyMatrix = body.matrix.clone();

  const tube = addTo(body, new Mesh(geoBody, matBody));
  tube.castShadow = true;
  tube.receiveShadow = true;

  const rod = addTo(body, new Mesh(geoRod, matKeys));
  rod.position.set(0.021 + 0.008 * s, bodyLen * 0.5, -rTop * 0.4);

  const bow = addTo(root, new Mesh(geoBow, matBody));
  bow.position.set(body.position.x, body.position.y, body.position.z + bowR);
  bow.castShadow = true;

  /** The bell: up and forward past the player's hip. Its own group, so it flares. */
  const bellGroup = addTo(root, new Group());
  bellGroup.position.set(body.position.x, body.position.y - 0.004, body.position.z + 2 * bowR);
  bellGroup.rotation.x = 0.55;
  const bell = addTo(bellGroup, new Mesh(geoBell, matBody));
  bell.castShadow = true;
  bell.receiveShadow = true;
  const bellRim = addTo(bellGroup, new Mesh(geoBellRim, matBody));
  bellRim.position.y = bellLen;
  bellRim.rotation.x = -Math.PI / 2;

  const strapRing = addTo(body, new Mesh(geoRing, matKeys));
  strapRing.position.set(0, bodyLen * 0.66, rTop + 0.008);
  strapRing.rotation.x = Math.PI / 2;

  // The neck crook, from the top of the body up and back to the lips.
  const bodyTop = new Vector3(0, bodyLen, 0).applyMatrix4(bodyMatrix);
  const neckCurve = new CatmullRomCurve3([
    bodyTop.clone(),
    bodyTop.clone().add(new Vector3(-0.004, 0.055, -0.012)),
    new Vector3(MOUTH.x + 0.022, MOUTH.y - 0.012, MOUTH.z + 0.055),
    new Vector3(MOUTH.x, MOUTH.y, MOUTH.z + 0.012),
  ]);
  const geoNeck = shared(`neck:${key}:${bodyTop.x.toFixed(3)}:${bodyTop.y.toFixed(3)}:${bodyTop.z.toFixed(3)}`,
    () => new TubeGeometry(neckCurve, 14, rTop * 1.05, 8, false));
  const neck = addTo(root, new Mesh(geoNeck, matBody));
  neck.castShadow = true;

  const mouthpiece = addTo(root, new Mesh(geoMouthpiece, matDark));
  mouthpiece.position.copy(MOUTH);
  mouthpiece.rotation.x = Math.PI / 2 + 0.25;
  const ligature = addTo(root, new Mesh(geoLigature, matKeys));
  ligature.position.set(MOUTH.x, MOUTH.y - 0.004, MOUTH.z + 0.030);
  ligature.rotation.x = 0.25;

  /** The octave key: a thumb lever on the back of the neck. */
  const octave = addTo(body, new Group());
  octave.position.set(0, bodyLen * 0.94, rTop + 0.006);
  addTo(octave, new Mesh(geoOctave, matKeys));
  const thumb = addTo(body, new Mesh(geoThumb, matDark));
  thumb.position.set(0, bodyLen * 0.5, rTop + 0.006);

  /**
   * One key cup per station, laid up the tube from the bow to the neck.
   *
   * Each one is its own group hinged on the rod, so `react` can lift the open
   * ones and drop the closed ones. Twelve pads reconfiguring on every note is
   * the whole visual payoff of a wind instrument at this distance.
   */
  const HOLE_T: readonly number[] = Array.from(
    { length: STATIONS }, (_, i) => 0.08 + (i / (STATIONS - 1)) * 0.84,
  );
  const cups: Group[] = [];
  for (const t of HOLE_T) {
    const r = rBot + (rTop - rBot) * t;
    const hinge = addTo(body, new Group());
    hinge.position.set(0.018 + 0.008 * s, t * bodyLen, -r * 0.5);
    const cup = addTo(hinge, new Mesh(geoCup, matKeys));
    cup.position.set(-(0.018 + 0.008 * s), 0, -(r * 0.5 + 0.006));
    cup.rotation.x = Math.PI / 2;
    cups.push(hinge);
  }

  // --- contacts ----------------------------------------------------------
  /**
   * The finger target for a station is the *lowest closed* hole — the last
   * finger still down. Walking that up the tube as the line rises is exactly
   * the motion an audience reads as playing a wind instrument.
   */
  const contacts: Contact[] = HOLE_T.map((t) => {
    const r = rBot + (rTop - rBot) * t;
    return {
      position: new Vector3(0, t * bodyLen, -(r + 0.016)).applyMatrix4(bodyMatrix),
      // Keys face the player; a finger comes at them from the front.
      normal: new Vector3(0, 0.1, -1).normalize().transformDirection(bodyMatrix),
      // The keys run the length of the tube, so the knuckles do too.
      along: new Vector3(0, 1, 0).transformDirection(bodyMatrix),
    };
  });
  /** Hands at rest sit around the middle of the keywork, not at the bell. */
  const restContact = contacts[6]!;

  function copy(c: Contact): Contact {
    return { position: c.position.clone(), normal: c.normal.clone() };
  }

  // --- animation state ---------------------------------------------------
  const closed: number[] = new Array<number>(STATIONS).fill(1);
  const closedTo: number[] = new Array<number>(STATIONS).fill(1);
  let octaveAt = 0;
  let octaveTo = 0;
  let flare = 0;
  let lastBeat = Number.NaN;

  return {
    archetype: 'saxophone',
    root,
    station: {
      offset: new Vector3(-0.06, 0, -0.24),
      facing: 0,
      posture: SPEC.posture,
    },

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') return copy(restContact);
      if (point.kind !== 'hole') return undefined;
      if (point.midi < LO || point.midi > HI) return undefined;
      return copy(contacts[fingeringFor(point.midi, member).station]!);
    },

    react(point: PlayPoint, force: number, _now: number): void {
      if (point.kind === 'rest') {
        // Between phrases the hands stay over the keys and the octave key
        // lets go. A wind player does not reset to a neutral pose mid-tune.
        octaveTo = 0;
        return;
      }
      if (point.kind !== 'hole') return;
      if (point.midi < LO || point.midi > HI) return;
      const { station, register } = fingeringFor(point.midi, member);
      // Everything from the speaking hole up is closed; everything below it,
      // toward the bell, is open. That is the whole of how a wind works.
      for (let i = 0; i < STATIONS; i++) closedTo[i] = i >= station ? 1 : 0;
      octaveTo = register > 0 ? 1 : 0;
      flare = Math.max(flare, 0.2 + 0.8 * Math.min(Math.max(force, 0), 1));
    },

    update(now: number): void {
      const dt = Number.isFinite(lastBeat) ? Math.min(Math.max(now - lastBeat, 0), 0.5) : 0;
      lastBeat = now;
      if (dt === 0) return;

      // Pads are light and fast; they snap rather than settle.
      const k = 1 - Math.exp(-dt / 0.035);
      for (let i = 0; i < STATIONS; i++) {
        closed[i] = closed[i]! + (closedTo[i]! - closed[i]!) * k;
        cups[i]!.rotation.x = 0.24 * (1 - closed[i]!);
      }
      octaveAt += (octaveTo - octaveAt) * k;
      octave.rotation.x = -0.5 * octaveAt;

      flare += (0 - flare) * (1 - Math.exp(-dt / 0.22));
      const g = 1 + 0.05 * flare;
      bellGroup.scale.set(g, 1 + 0.015 * flare, g);
    },

    dispose(): void {
      root.removeFromParent();
      root.clear();
      release();
    },
  };
};
