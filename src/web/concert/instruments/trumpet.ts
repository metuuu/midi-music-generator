/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Trumpet — and the fingering is the real one.
 *
 * A trumpet is three valves and a length of tubing, and which valves go down
 * for a given note is not a matter of taste: the open horn sounds a harmonic
 * series, the second valve lowers it a semitone, the first two, the third
 * three, and combinations sum. Given a pitch you can *derive* the fingering,
 * and `fingeringFor` below does. That derivation is the whole difference
 * between a trumpeter and a mime, and it costs about fifteen lines.
 *
 * ## What moves, and what does not
 *
 * `blown: true` means the note is made of air. The horn does not travel to
 * sound a pitch and the player's right hand barely moves — **the fingers move
 * and the air does the rest**. So `react` carries the load here: the derived
 * valves go down, spring back, and the bell flares on a loud one. The horn
 * body itself never moves in `react`, because `resolve` is measured against it
 * and a model whose geometry drifts under its own contacts is a model that
 * lies to the hand it is placing.
 *
 * ## Pitch convention
 *
 * `PlayPoint.midi` is **sounding** pitch, matching `NoteEvent.pitch` in the
 * Song IR — this file does the Bb transposition itself. `ARCHETYPES.trumpet.range`
 * is `[52, 86]`, which is exactly sounding E3 (written F#3, the lowest note on
 * the horn) to sounding D6, so the frozen table agrees.
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
// The fingering
// ---------------------------------------------------------------------------

/**
 * Open-horn harmonics of a Bb trumpet, **sounding**, in semitones.
 *
 * The horn's nominal fundamental is Bb2 (MIDI 46); these are its partials
 * rounded to equal temperament. Partial 7 (a sounding Ab5, 31 cents flat) is
 * missing on purpose: players do not use it, and including it would hand back
 * a first-valve Bb5 where the chart says open-plus-one — the single most
 * common way a generated fingering betrays itself as fake.
 *
 * Partials 2..6, then 8, 9, 10. Nothing above D6, which is the top of the
 * archetype's declared range.
 */
const OPEN_HARMONICS: readonly number[] = [58, 65, 70, 74, 77, 82, 84, 86];

/**
 * Which valves lower the horn by n semitones.
 *
 * 2 → 1 semitone, 1 → 2, 3 → 3 (but 1+2 is the standard fingering for that
 * drop and 3 alone is the alternate), and combinations sum. This is the
 * trumpet fingering chart, and it is a table of seven entries because there
 * are only seven things three valves can do.
 */
const VALVES_FOR_DROP: readonly (readonly number[])[] = [
  [],          // 0 — open
  [2],         // 1
  [1],         // 2
  [1, 2],      // 3
  [2, 3],      // 4
  [1, 3],      // 5
  [1, 2, 3],   // 6
];

/**
 * The valves a trumpeter puts down for a sounding pitch, or `undefined` if the
 * horn cannot reach it.
 *
 * Take the lowest open harmonic at or above the note — which is also the
 * nearest one above, since they ascend — and lower to it. A drop of more than
 * six semitones means the note is below the horn entirely.
 *
 * Exported because the probe checks it against a real chart, and because the
 * choreographer might one day want to know how hard a passage is.
 */
export function fingeringFor(midi: number): readonly number[] | undefined {
  for (const harmonic of OPEN_HARMONICS) {
    if (harmonic < midi) continue;
    const drop = harmonic - midi;
    return drop <= 6 ? VALVES_FOR_DROP[drop]! : undefined;
  }
  return undefined;
}

/** A stable index 0..6 for a fingering, so contacts can be a flat table. */
function dropFor(midi: number): number | undefined {
  for (const harmonic of OPEN_HARMONICS) {
    if (harmonic < midi) continue;
    const drop = harmonic - midi;
    return drop <= 6 ? drop : undefined;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Shared GPU resources
// ---------------------------------------------------------------------------

interface Disposable { dispose(): void }

/**
 * Geometry and material cache shared by every trumpet on the stage, refcounted
 * so the last model disposed is the one that frees the buffers. Two trumpets in
 * a section cost one set of vertices.
 */
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

const SPEC = ARCHETYPES.trumpet;

/** Bell tip to mouthpiece rim, in metres. A Bb trumpet is about half a metre. */
const MOUTH_Z = -0.245;
/** The horn tips its bell up by six degrees, the way a player holds one. */
const TILT = -0.10;
/** Valve casing centres along the horn. Real spacing is about 45 mm. */
const VALVE_Z: readonly number[] = [-0.052, -0.005, 0.042];
/** Top of a finger button at rest, above the horn's axis. */
const BUTTON_Y = 0.058;
/** How far a valve goes down. Short, positive and audible-looking. */
const VALVE_TRAVEL = 0.009;

function bellProfile(len: number, r0: number, r1: number, steps: number): Vector2[] {
  const pts: Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Flare late. A cone reads as a traffic bollard; a trumpet stays narrow
    // for two thirds of its bell and then opens all at once.
    pts.push(new Vector2(r0 + (r1 - r0) * t ** 2.8, t * len));
  }
  return pts;
}

export const buildTrumpet: InstrumentBuilder = (opts: InstrumentBuildOptions): InstrumentModel => {
  live++;
  const rng = new Rng(`trumpet:${opts.seed}`);

  // Finish varies per instance; nothing `resolve` reads varies at all.
  const brassHue = opts.finish ?? (rng.chance(0.25) ? '#d8d9dc' : '#c9a13c');
  const matBrass = shared(`brass:${brassHue}`, () => new MeshStandardMaterial({
    color: brassHue, roughness: 0.31, metalness: 0.88,
  }));
  const matSilver = shared('silver', () => new MeshStandardMaterial({
    color: '#cfd4da', roughness: 0.22, metalness: 0.95,
  }));
  const matPearl = shared('pearl', () => new MeshStandardMaterial({
    color: '#efe7d6', roughness: 0.5, metalness: 0.05,
  }));

  const geoLeadpipe = shared('leadpipe', () => new CylinderGeometry(0.0068, 0.0092, 0.38, 10).rotateX(Math.PI / 2));
  const geoReturn = shared('return', () => new CylinderGeometry(0.0092, 0.0092, 0.212, 10).rotateX(Math.PI / 2));
  const geoBellTube = shared('belltube', () => new CylinderGeometry(0.0105, 0.0105, 0.078, 10).rotateX(Math.PI / 2));
  const geoCrook = shared('crook', () => {
    const g = new TorusGeometry(0.028, 0.0078, 6, 12, Math.PI);
    // Stand the U up in the y-z plane, bulging toward the bell.
    g.rotateY(-Math.PI / 2);
    g.rotateX(Math.PI / 2);
    return g;
  });
  const geoBell = shared('bell', () => new LatheGeometry(bellProfile(0.135, 0.0105, 0.062, 8), 14).rotateX(Math.PI / 2));
  const geoRim = shared('rim', () => new TorusGeometry(0.062, 0.005, 5, 16).rotateX(Math.PI / 2));
  const geoCasing = shared('casing', () => new CylinderGeometry(0.0195, 0.0195, 0.132, 10));
  const geoStem = shared('stem', () => new CylinderGeometry(0.0055, 0.0055, 0.03, 6));
  const geoButton = shared('button', () => new CylinderGeometry(0.0125, 0.0125, 0.009, 10));
  const geoSlideU = shared('slideU', () => {
    const g = new TorusGeometry(0.015, 0.0046, 5, 8, Math.PI);
    g.rotateY(-Math.PI / 2);
    g.rotateX(-Math.PI / 2);
    return g;
  });
  const geoMouthpiece = shared('mouthpiece', () => new LatheGeometry([
    new Vector2(0.0055, 0), new Vector2(0.0060, 0.012), new Vector2(0.0090, 0.020),
    new Vector2(0.0150, 0.030), new Vector2(0.0155, 0.034), new Vector2(0.0110, 0.035),
  ], 10).rotateX(-Math.PI / 2));
  const geoBrace = shared('brace', () => new BoxGeometry(0.008, 0.03, 0.012));

  // --- assembly ----------------------------------------------------------
  const root = new Group();
  root.name = 'trumpet';

  /**
   * The horn's own frame: +z runs mouthpiece to bell, +y is up off the axis.
   * Everything below is laid out in it, and the mouthpiece rim comes out at
   * the archetype's `workHeight` once the tilt is applied.
   */
  const horn = addTo(root, new Group());
  horn.rotation.x = TILT;
  horn.position.y = SPEC.workHeight + Math.sin(-TILT) * -MOUTH_Z;
  horn.updateMatrix();
  const hornMatrix = horn.matrix.clone();

  const mouthpiece = addTo(horn, new Mesh(geoMouthpiece, matSilver));
  mouthpiece.position.z = MOUTH_Z;

  const leadpipe = addTo(horn, new Mesh(geoLeadpipe, matBrass));
  leadpipe.position.set(0, 0.028, -0.045);
  leadpipe.castShadow = true;

  const crook = addTo(horn, new Mesh(geoCrook, matBrass));
  crook.position.set(0, 0, 0.145);

  const back = addTo(horn, new Mesh(geoReturn, matBrass));
  back.position.set(0, -0.028, 0.039);
  back.castShadow = true;

  const bellTube = addTo(horn, new Mesh(geoBellTube, matBrass));
  bellTube.position.set(0, 0, 0.081);

  /** The bell is its own group so a loud note can flare it without moving anything else. */
  const bellGroup = addTo(horn, new Group());
  bellGroup.position.z = 0.12;
  const bell = addTo(bellGroup, new Mesh(geoBell, matBrass));
  bell.castShadow = true;
  bell.receiveShadow = true;
  const rim = addTo(bellGroup, new Mesh(geoRim, matBrass));
  rim.position.z = 0.134;

  for (const z of [0.02, 0.1]) {
    const brace = addTo(horn, new Mesh(geoBrace, matBrass));
    brace.position.set(0, 0.014, z);
  }

  /** One group per valve; `react` slides it down its casing. */
  const valves: Group[] = [];
  for (let i = 0; i < 3; i++) {
    const z = VALVE_Z[i]!;
    const casing = addTo(horn, new Mesh(geoCasing, matBrass));
    casing.position.set(0, -0.048, z);
    casing.castShadow = true;

    const slide = addTo(horn, new Mesh(geoSlideU, matBrass));
    slide.position.set(0, -0.114, z);

    const valve = addTo(horn, new Group());
    valve.position.set(0, 0, z);
    const stem = addTo(valve, new Mesh(geoStem, matSilver));
    stem.position.y = 0.034;
    const button = addTo(valve, new Mesh(geoButton, matPearl));
    button.position.y = BUTTON_Y - 0.0045;
    valves.push(valve);
  }

  // --- contacts ----------------------------------------------------------
  /**
   * Where the right hand goes, per fingering — one entry for each of the seven
   * things three valves can do.
   *
   * A trumpeter's hand does not travel: the fingertips sit on the buttons and
   * stay there. What it does do is follow its own fingers by a centimetre or
   * two, so the contact is the centroid of the buttons that are down (the
   * middle button when the horn is open). That is honest about the instrument
   * — the pitch changes and the hand almost doesn't — and it gives the runtime
   * something pitch-dependent rather than a constant.
   *
   * The y is half a valve's travel below the button top, so the fingertip is
   * never more than 4 mm off a moving button.
   */
  const contacts: Contact[] = VALVES_FOR_DROP.map((combo) => {
    const zs = combo.length ? combo.map((v) => VALVE_Z[v - 1]!) : [VALVE_Z[1]!];
    const z = zs.reduce((a, b) => a + b, 0) / zs.length;
    return {
      position: new Vector3(0, BUTTON_Y - VALVE_TRAVEL / 2, z).applyMatrix4(hornMatrix),
      // Up and back toward the player: a finger comes down onto a valve from
      // above and slightly behind, never straight down a vertical.
      normal: new Vector3(0, 1, -0.3).normalize().transformDirection(hornMatrix),
    };
  });

  /** Where a hand waits when nothing is sounding: the open-horn hand position. */
  const restContact = contacts[0]!;

  function copy(c: Contact): Contact {
    return { position: c.position.clone(), normal: c.normal.clone() };
  }

  // --- animation state ---------------------------------------------------
  const press = [0, 0, 0];
  const pressTarget = [0, 0, 0];
  let flare = 0;
  let lastBeat = Number.NaN;

  return {
    archetype: 'trumpet',
    root,
    station: {
      // Standing right behind the mouthpiece, facing the audience.
      offset: new Vector3(0, 0, -0.32),
      facing: 0,
      posture: SPEC.posture,
    },

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') return copy(restContact);
      if (point.kind !== 'valve') return undefined;
      const drop = dropFor(point.midi);
      if (drop === undefined) return undefined;
      return copy(contacts[drop]!);
    },

    react(point: PlayPoint, force: number, _now: number): void {
      if (point.kind === 'rest') {
        pressTarget[0] = pressTarget[1] = pressTarget[2] = 0;
        return;
      }
      if (point.kind !== 'valve') return;
      const combo = fingeringFor(point.midi);
      if (!combo) return;
      for (let i = 0; i < 3; i++) {
        const down = combo.includes(i + 1);
        pressTarget[i] = down ? 1 : 0;
        // A valve is thrown, not eased: it is at the bottom of its casing
        // before the note has finished starting. The spring in `update` only
        // has to bring it back up.
        if (down) press[i] = 1;
      }
      // The bell opens on a loud note. It is a lie physically and the right
      // lie visually — it is where the eye goes when a horn player leans in.
      flare = Math.max(flare, 0.25 + 0.75 * Math.min(Math.max(force, 0), 1));
    },

    update(now: number): void {
      const dt = Number.isFinite(lastBeat) ? Math.min(Math.max(now - lastBeat, 0), 0.5) : 0;
      lastBeat = now;
      if (dt === 0) return;

      // Valves spring back over about a sixteenth; the bell settles slower.
      const kValve = 1 - Math.exp(-dt / 0.05);
      const kFlare = 1 - Math.exp(-dt / 0.18);
      for (let i = 0; i < 3; i++) {
        press[i] = press[i]! + (pressTarget[i]! - press[i]!) * kValve;
        valves[i]!.position.y = -VALVE_TRAVEL * press[i]!;
      }
      flare += (0 - flare) * kFlare;
      const s = 1 + 0.055 * flare;
      bellGroup.scale.set(s, s, 1 + 0.02 * flare);
    },

    dispose(): void {
      root.removeFromParent();
      root.clear();
      release();
    },
  };
};
