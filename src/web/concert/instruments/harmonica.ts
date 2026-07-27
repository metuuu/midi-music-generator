/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Harmonica — small, cupped in two hands, at the mouth.
 *
 * `ARCHETYPES.harmonica.range` is `[60, 96]`, and that is not a round number
 * someone picked: it is exactly C4 to C7, which is exactly the compass of a
 * twelve-hole **chromatic** harmonica in C. So that is what this is. A ten-hole
 * diatonic would be the more folkloric object and it cannot play five notes in
 * twelve without bending, which would mean either a lying model or a range the
 * frozen table does not declare.
 *
 * The layout is solo tuning, which repeats every four holes:
 *
 * ```
 *   hole 4k+1   blow C   draw D
 *   hole 4k+2   blow E   draw F
 *   hole 4k+3   blow G   draw A
 *   hole 4k+4   blow C'  draw B
 * ```
 *
 * — naturals only, three octaves of them, and the slide button raises whatever
 * you are on by a semitone. That covers all twelve pitch classes with nothing
 * left over, and it means every note carries three derivable facts worth
 * animating: which hole, whether it is a blow or a draw, and whether the slide
 * is in. All three are visible on a real player from across a room.
 *
 * ## Where the hands are
 *
 * On the audience side. The harp is at the lips with its holes facing the
 * player, so what a room actually sees of a harmonica player is the back of
 * the instrument and two hands wrapped around it — which is why the contacts
 * below sit on the far face rather than on the holes.
 */

import {
  BoxGeometry, CylinderGeometry, Group, InstancedMesh, Matrix4, Mesh,
  MeshStandardMaterial, Vector3,
} from 'three';

import { ARCHETYPES } from '../../../concert/instruments.js';
import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import type {
  Contact, InstrumentBuildOptions, InstrumentBuilder, InstrumentModel,
} from './types.js';
import { addTo } from './types.js';

// ---------------------------------------------------------------------------
// The layout
// ---------------------------------------------------------------------------

const HOLES = 12;
/** Semitones above the group's C, per hole within a four-hole group. */
const BLOW: readonly number[] = [0, 4, 7, 12];
const DRAW: readonly number[] = [2, 5, 9, 11];
/** Hole 1 blows middle C. */
const BASE = 60;

function blowPitch(hole: number): number {
  return BASE + 12 * Math.floor(hole / 4) + BLOW[hole % 4]!;
}
function drawPitch(hole: number): number {
  return BASE + 12 * Math.floor(hole / 4) + DRAW[hole % 4]!;
}

export interface HarpNote {
  /** 0-based; hole 1 on the instrument is 0 here. */
  hole: number;
  /** Drawn rather than blown. */
  draw: boolean;
  /** Slide button pressed in, raising the reed a semitone. */
  slide: boolean;
}

/**
 * Which hole, which direction, slide in or out — or `undefined` off the harp.
 *
 * Naturals are tried first across the whole instrument before anything with
 * the slide, because that is the order a player's hands find them in: the
 * button is an extra action and you take it only when the note needs it.
 */
export function noteFor(midi: number): HarpNote | undefined {
  for (const slide of [false, true]) {
    const shift = slide ? 1 : 0;
    for (let hole = 0; hole < HOLES; hole++) {
      if (blowPitch(hole) + shift === midi) return { hole, draw: false, slide };
      if (drawPitch(hole) + shift === midi) return { hole, draw: true, slide };
    }
  }
  return undefined;
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

const SPEC = ARCHETYPES.harmonica;

/** A twelve-hole chromatic is about 155 mm of comb. */
const COMB_LEN = 0.155;
const HOLE_PITCH = 0.0104;
/** Half the covers' depth; the harp is barely two centimetres thick. */
const COVER_R = 0.0142;
/** Travel of the slide button. */
const SLIDE_TRAVEL = 0.009;

/** Where the centre of the harp sits: at the lips. */
const MOUTH_Y = SPEC.workHeight;

export const buildHarmonica: InstrumentBuilder = (opts: InstrumentBuildOptions): InstrumentModel => {
  live++;
  const rng = new Rng(`harmonica:${opts.seed}`);

  const coverHue = opts.finish ?? (rng.chance(0.3) ? '#c9a24a' : '#cdd3d9');
  const matCover = shared(`cover:${coverHue}`, () => new MeshStandardMaterial({
    color: coverHue, roughness: 0.2, metalness: 0.92,
  }));
  const matComb = shared('mat:comb', () => new MeshStandardMaterial({
    color: '#221d18', roughness: 0.55, metalness: 0.05,
  }));
  const matHole = shared('mat:hole', () => new MeshStandardMaterial({
    color: '#080706', roughness: 0.95, metalness: 0.0,
  }));

  const geoComb = shared('geo:comb', () => new BoxGeometry(COMB_LEN, 0.024, 0.020));
  const geoCover = shared('geo:cover', () => new CylinderGeometry(
    COVER_R, COVER_R, COMB_LEN - 0.006, 10, 1, true, 0, Math.PI,
  ).rotateZ(Math.PI / 2));
  const geoEnd = shared('end', () => new BoxGeometry(0.005, 0.028, 0.022));
  const geoHole = shared('holegeo', () => new BoxGeometry(0.0062, 0.0078, 0.0035));
  const geoSlideRod = shared('sliderod', () => new CylinderGeometry(0.0032, 0.0032, 0.034, 6).rotateZ(Math.PI / 2));
  const geoSlideButton = shared('slidebutton', () => new CylinderGeometry(0.0085, 0.0085, 0.006, 10).rotateZ(Math.PI / 2));
  const geoScrew = shared('screw', () => new CylinderGeometry(0.0022, 0.0022, 0.026, 6));

  // --- assembly ----------------------------------------------------------
  const root = new Group();
  root.name = 'harmonica';

  /** The harp itself, level at the lips. It does not move; the covers do. */
  const harp = addTo(root, new Group());
  harp.position.set(0, MOUTH_Y, 0);

  const comb = addTo(harp, new Mesh(geoComb, matComb));
  comb.castShadow = true;

  /** Cover plates, hinged at the comb so a draw can open them a hair. */
  const coverTop = addTo(harp, new Group());
  const topShell = addTo(coverTop, new Mesh(geoCover, matCover));
  topShell.position.y = 0.001;
  topShell.castShadow = true;
  const coverBottom = addTo(harp, new Group());
  const bottomShell = addTo(coverBottom, new Mesh(geoCover, matCover));
  bottomShell.position.y = -0.001;
  bottomShell.rotation.x = Math.PI;

  for (const x of [-COMB_LEN / 2 - 0.002, COMB_LEN / 2 + 0.002]) {
    const end = addTo(harp, new Mesh(geoEnd, matCover));
    end.position.x = x;
  }
  for (const x of [-COMB_LEN / 2 + 0.010, COMB_LEN / 2 - 0.010]) {
    const screw = addTo(harp, new Mesh(geoScrew, matCover));
    screw.position.set(x, 0, 0.004);
  }

  /**
   * Twelve hole mouths on the player's face of the comb, in one draw call.
   * They are the thing that says "harmonica" and nothing else about the
   * object does, so they are worth the instanced mesh.
   */
  const holeX: number[] = [];
  for (let i = 0; i < HOLES; i++) holeX.push((i - (HOLES - 1) / 2) * HOLE_PITCH);
  const mouths = new InstancedMesh(geoHole, matHole, HOLES);
  const m = new Matrix4();
  for (let i = 0; i < HOLES; i++) {
    m.makeTranslation(holeX[i]!, 0, -0.0105);
    mouths.setMatrixAt(i, m);
  }
  mouths.instanceMatrix.needsUpdate = true;
  harp.add(mouths);

  /** The slide button, out the right-hand end. Pushing it in is the semitone. */
  const slide = addTo(harp, new Group());
  const slideRod = addTo(slide, new Mesh(geoSlideRod, matCover));
  slideRod.position.set(COMB_LEN / 2 + 0.017, 0, -0.004);
  const slideButton = addTo(slide, new Mesh(geoSlideButton, matCover));
  slideButton.position.set(COMB_LEN / 2 + 0.036, 0, -0.004);

  // --- contacts ----------------------------------------------------------
  /**
   * One contact per hole, on the audience face of the harp. The travel is only
   * about eleven centimetres end to end, which is right: a harmonica player's
   * hands drift along the instrument, they do not reach for it.
   */
  const contacts: Contact[] = holeX.map((x) => ({
    position: new Vector3(x, MOUTH_Y - 0.004, 0.018),
    // Out of the far face and a little downward — a cupping hand comes up
    // around a harmonica, not down onto it.
    normal: new Vector3(0, -0.18, 1).normalize(),
  }));
  /** Hands at rest: cupped around the middle of the harp. */
  const restContact: Contact = {
    position: new Vector3(0, MOUTH_Y - 0.004, 0.018),
    normal: new Vector3(0, -0.18, 1).normalize(),
  };

  function copy(c: Contact): Contact {
    return { position: c.position.clone(), normal: c.normal.clone() };
  }

  const [LO, HI] = SPEC.range;

  // --- animation state ---------------------------------------------------
  let slideAt = 0;
  let slideTo = 0;
  /** −1 fully blown, +1 fully drawn. The covers breathe with it. */
  let breath = 0;
  let breathTo = 0;
  let lastBeat = Number.NaN;

  return {
    archetype: 'harmonica',
    root,
    station: {
      offset: new Vector3(0, 0, -0.16),
      facing: 0,
      posture: SPEC.posture,
    },

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') return copy(restContact);
      if (point.kind !== 'hole') return undefined;
      if (point.midi < LO || point.midi > HI) return undefined;
      const note = noteFor(point.midi);
      return note ? copy(contacts[note.hole]!) : undefined;
    },

    react(point: PlayPoint, force: number, _now: number): void {
      if (point.kind === 'rest') {
        breathTo = 0;
        slideTo = 0;
        return;
      }
      if (point.kind !== 'hole') return;
      const note = noteFor(point.midi);
      if (!note) return;
      slideTo = note.slide ? 1 : 0;
      // A drawn note pulls the covers open; a blown one presses them shut.
      // It is two millimetres of motion and it is the only way an audience can
      // tell a harmonica is doing anything at all.
      breathTo = (note.draw ? 1 : -1) * (0.3 + 0.7 * Math.min(Math.max(force, 0), 1));
    },

    update(now: number): void {
      const dt = Number.isFinite(lastBeat) ? Math.min(Math.max(now - lastBeat, 0), 0.5) : 0;
      lastBeat = now;
      if (dt === 0) return;

      slideAt += (slideTo - slideAt) * (1 - Math.exp(-dt / 0.03));
      slide.position.x = -SLIDE_TRAVEL * slideAt;

      breath += (breathTo - breath) * (1 - Math.exp(-dt / 0.06));
      breathTo *= Math.exp(-dt / 0.35);
      coverTop.rotation.x = -0.055 * breath;
      coverBottom.rotation.x = 0.055 * breath;
    },

    dispose(): void {
      mouths.dispose();
      root.removeFromParent();
      root.clear();
      release();
    },
  };
};
