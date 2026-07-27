/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The singer's "instrument" — which is a microphone, a stand and a cable.
 *
 * ## This model is not a person, and that is a surprising shape for this file
 *
 * Every other archetype in this directory is an object a performer operates.
 * `singer` is the one where the *instrument is the performer*, and the frozen
 * interface has no way to say that — so the split is: the performer rig owns
 * the body, the head, the face and the mouth; this file owns the hardware in
 * front of it and, critically, **where the mouth belongs**.
 *
 * Which means `resolve({ kind: 'viseme', … })` deliberately **ignores the vowel
 * and the consonant it is handed**. Those two fields exist for the face, and
 * the face is not built here. What a viseme point means to a microphone is
 * only ever "a note is being sung, so the mouth is at the capsule", and the
 * answer is the capsule every time. It is worth stating plainly rather than
 * leaving as a silent `_` in a signature, because a reader who finds a
 * `Vowel` in the argument list and no use of it will otherwise assume a bug.
 *
 * The capsule sits at exactly `ARCHETYPES.singer.workHeight` (1.55 m), so the
 * rig has a fixed, documented place to find the mouth. `Contact.normal` runs
 * up the microphone's own axis toward the singer: a rig that wants the lips a
 * few centimetres off the grille rather than on it adds `normal * gap`, which
 * is what the normal is for.
 *
 * ## What moves
 *
 * A microphone is the least animated object on a stage, so the two things it
 * does do have to be right: the head shivers on its shock mount for an instant
 * after a loud note, and the cable swings. The shiver is capped at three
 * millimetres — smaller than the tolerance of a floating hand, so nothing the
 * runtime placed against `resolve` drifts, and large enough to catch a
 * rim light.
 */

import {
  BoxGeometry, CatmullRomCurve3, CylinderGeometry, Group, LatheGeometry, Mesh,
  MeshStandardMaterial, SphereGeometry, TorusGeometry, TubeGeometry, Vector2,
  Vector3,
} from 'three';

import { ARCHETYPES } from '../../../concert/instruments.js';
import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import type {
  Contact, InstrumentBuildOptions, InstrumentBuilder, InstrumentModel,
} from './types.js';
import { addTo } from './types.js';

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

const SPEC = ARCHETYPES.singer;

/** The capsule, and therefore the mouth. The frozen table says 1.55. */
const CAPSULE = new Vector3(0, SPEC.workHeight, -0.030);
/** How far the microphone leans back off vertical, toward the singer. */
const MIC_TILT = -0.62;
/** Capsule centre measured up the microphone from where the clip holds it. */
const MIC_REACH = 0.145;
/** Links in the swinging part of the cable. */
const CABLE_LINKS = 5;
const LINK_LEN = 0.055;

export const buildSinger: InstrumentBuilder = (opts: InstrumentBuildOptions): InstrumentModel => {
  live++;
  const rng = new Rng(`singer:${opts.seed}`);

  // The stand is the one thing here a venue palette can usefully tint: a
  // chrome stand in a jazz cellar and a black one at a tanssilava.
  const standHue = opts.finish ?? (rng.chance(0.4) ? '#c6cbd1' : '#232527');
  const matStand = shared(`stand:${standHue}`, () => new MeshStandardMaterial({
    color: standHue, roughness: 0.3, metalness: 0.8,
  }));
  const matMic = shared('mic', () => new MeshStandardMaterial({
    color: '#3a3d41', roughness: 0.45, metalness: 0.55,
  }));
  const matGrille = shared('grille', () => new MeshStandardMaterial({
    // A little brighter than the body so the capsule reads as the thing you
    // are meant to look at, which on a sung number it is.
    color: '#9aa1a8', roughness: 0.55, metalness: 0.9,
  }));
  const matCable = shared('cable', () => new MeshStandardMaterial({
    color: '#141414', roughness: 0.85, metalness: 0.0,
  }));

  const geoBase = shared('base', () => new LatheGeometry([
    new Vector2(0.000, 0.000), new Vector2(0.140, 0.000), new Vector2(0.148, 0.010),
    new Vector2(0.140, 0.022), new Vector2(0.052, 0.030), new Vector2(0.034, 0.048),
    new Vector2(0.020, 0.052),
  ], 20));
  const geoLowerShaft = shared('lowershaft', () => new CylinderGeometry(0.0130, 0.0140, 0.94, 10)
    .translate(0, 0.47, 0));
  const geoClutch = shared('clutch', () => new CylinderGeometry(0.0215, 0.0215, 0.055, 12));
  const geoUpperShaft = shared('uppershaft', () => new CylinderGeometry(0.0102, 0.0102, 0.40, 10)
    .translate(0, 0.20, 0));
  const geoClipCollar = shared('clipcollar', () => new TorusGeometry(0.0225, 0.0055, 5, 14));
  const geoClipArm = shared('cliparm', () => new BoxGeometry(0.012, 0.048, 0.010));
  const geoMicBody = shared('micbody', () => new LatheGeometry([
    new Vector2(0.0130, 0.000), new Vector2(0.0165, 0.012), new Vector2(0.0180, 0.055),
    new Vector2(0.0205, 0.098), new Vector2(0.0235, 0.118), new Vector2(0.0250, 0.128),
  ], 14));
  const geoGrille = shared('grillegeo', () => new SphereGeometry(0.0268, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2)
    .translate(0, MIC_REACH, 0));
  const geoConnector = shared('connector', () => new BoxGeometry(0.020, 0.024, 0.020));
  const geoLink = shared('link', () => new CylinderGeometry(0.0055, 0.0055, LINK_LEN, 6)
    .translate(0, -LINK_LEN / 2, 0));

  // --- assembly ----------------------------------------------------------
  const root = new Group();
  root.name = 'singer';

  const base = addTo(root, new Mesh(geoBase, matStand));
  base.castShadow = true;
  base.receiveShadow = true;

  const lowerShaft = addTo(root, new Mesh(geoLowerShaft, matStand));
  lowerShaft.position.y = 0.045;
  lowerShaft.castShadow = true;

  const clutch = addTo(root, new Mesh(geoClutch, matStand));
  clutch.position.y = 0.99;

  const upperShaft = addTo(root, new Mesh(geoUpperShaft, matStand));
  upperShaft.position.y = 1.01;
  upperShaft.castShadow = true;

  /**
   * The clip, and everything it holds. `clip` is the pivot; the microphone
   * hangs off it at the angle a stand actually sets, leaning back into the
   * singer rather than standing up like a lamp.
   */
  const clip = addTo(root, new Group());
  clip.rotation.x = MIC_TILT;
  // Solve the clip's position so the capsule lands exactly on `CAPSULE`.
  clip.position.copy(CAPSULE).sub(new Vector3(0, MIC_REACH, 0).applyEuler(clip.rotation));

  const collar = addTo(clip, new Mesh(geoClipCollar, matStand));
  collar.position.y = 0.045;
  collar.rotation.x = Math.PI / 2;
  const clipArm = addTo(clip, new Mesh(geoClipArm, matStand));
  clipArm.position.set(0, 0.020, 0.020);

  /** The microphone itself. Its own group, so it can shiver on its mount. */
  const mic = addTo(clip, new Group());
  const micBody = addTo(mic, new Mesh(geoMicBody, matMic));
  micBody.castShadow = true;
  const grille = addTo(mic, new Mesh(geoGrille, matGrille));
  grille.castShadow = true;
  const connector = addTo(mic, new Mesh(geoConnector, matMic));
  connector.position.y = -0.012;

  /**
   * The cable: a swinging loop from the microphone's tail, then a static run
   * to the boards and off toward the wings.
   *
   * A stand with no cable reads as a prop from a shop window. This is four
   * hundred triangles and it is the difference.
   */
  const cable = addTo(root, new Group());
  cable.position.copy(clip.position).add(new Vector3(0, -0.014, 0).applyEuler(clip.rotation));
  const links: Group[] = [];
  let hook: Group = cable;
  for (let i = 0; i < CABLE_LINKS; i++) {
    const link = addTo(hook, new Group());
    if (i > 0) link.position.y = -LINK_LEN;
    // A hanging cable is not straight: it drifts back toward the stand.
    link.rotation.x = i === 0 ? 0.22 : 0.06;
    addTo(link, new Mesh(geoLink, matCable));
    links.push(link);
    hook = link;
  }

  // Where the swinging part ends, at rest — the static run starts there.
  root.updateMatrixWorld(true);
  const chainEnd = new Vector3(0, -LINK_LEN, 0)
    .applyMatrix4(links[CABLE_LINKS - 1]!.matrixWorld);
  const runCurve = new CatmullRomCurve3([
    chainEnd.clone(),
    new Vector3(0.030, chainEnd.y - 0.28, 0.055),
    new Vector3(0.010, 0.34, 0.030),
    new Vector3(-0.060, 0.075, 0.010),
    new Vector3(-0.200, 0.010, -0.080),
    new Vector3(-0.400, 0.010, -0.190),
  ]);
  const geoRun = shared(
    `run:${chainEnd.x.toFixed(3)}:${chainEnd.y.toFixed(3)}:${chainEnd.z.toFixed(3)}`,
    () => new TubeGeometry(runCurve, 22, 0.0055, 6, false),
  );
  const run = addTo(root, new Mesh(geoRun, matCable));

  // --- contacts ----------------------------------------------------------
  /** Up the microphone's axis, toward the singer. */
  const axis = new Vector3(0, 1, 0).applyEuler(clip.rotation).normalize();
  const sungContact: Contact = {
    position: CAPSULE.clone(),
    normal: axis.clone(),
  };
  /**
   * A rest is a breath, and a singer takes one *off* the microphone — ten
   * centimetres back along the same axis. It is the smallest possible way for
   * the rig to show a phrase ending, and it costs nothing here.
   */
  const restContact: Contact = {
    position: CAPSULE.clone().addScaledVector(axis, 0.10),
    normal: axis.clone(),
  };

  function copy(c: Contact): Contact {
    return { position: c.position.clone(), normal: c.normal.clone() };
  }

  // --- animation state ---------------------------------------------------
  let shake = 0;
  let phase = 0;
  let swing = 0;
  let swingVel = 0;
  let lastBeat = Number.NaN;

  return {
    archetype: 'singer',
    root,
    station: {
      // Just behind the stand, facing out. Close enough that the rig's head
      // lands on the capsule without the body intersecting the shaft.
      offset: new Vector3(0, 0, -0.20),
      facing: 0,
      posture: SPEC.posture,
    },

    /**
     * The capsule, whatever is being sung.
     *
     * `point.vowel` and `point.consonant` are not read. They belong to the
     * face, which the performer rig builds; a microphone has no opinion about
     * whether it is hearing an /a/ or an /u/. See the note at the top.
     */
    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'viseme') return copy(sungContact);
      if (point.kind === 'rest') return copy(restContact);
      return undefined;
    },

    react(point: PlayPoint, force: number, _now: number): void {
      if (point.kind !== 'viseme') return;
      const f = Math.min(Math.max(force, 0), 1);
      shake = Math.max(shake, 0.25 + 0.75 * f);
      // The cable takes a kick from the loud ones only; a whole phrase of
      // quiet notes should not set it wobbling.
      swingVel += 0.9 * f * f;
    },

    update(now: number): void {
      const dt = Number.isFinite(lastBeat) ? Math.min(Math.max(now - lastBeat, 0), 0.5) : 0;
      lastBeat = now;
      if (dt === 0) return;

      // The head shivers on its mount: fast, small, and gone within a beat.
      phase += dt * 27;
      shake *= Math.exp(-dt / 0.16);
      const d = 0.003 * shake * Math.sin(phase);
      mic.position.set(0, d, d * 0.6);
      mic.rotation.z = 0.02 * shake * Math.sin(phase * 0.7);

      // A pendulum, damped. The links share the angle unequally so the loop
      // bends rather than swinging as one rigid stick.
      swingVel -= swing * 34 * dt;
      swingVel *= Math.exp(-dt / 0.55);
      swing += swingVel * dt;
      for (let i = 0; i < CABLE_LINKS; i++) {
        const w = 0.5 + 0.5 * (i / (CABLE_LINKS - 1));
        links[i]!.rotation.z = swing * 0.055 * w;
      }
    },

    dispose(): void {
      root.removeFromParent();
      root.clear();
      release();
    },
  };
};
