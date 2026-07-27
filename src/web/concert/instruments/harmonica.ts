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
 * Off the **ends**, not across the front. The harp is at the lips with its
 * holes facing the player, so what a room sees is the back of the instrument —
 * and a rig palm is 136 mm across on a 155 mm harp, so two hands placed on that
 * face hide the entire object. They hold it at the end plates instead and let
 * the fingers do the closing; see `cupAt`, where the measurement is.
 *
 * **Both** hands, at opposite ends. A harmonica is played in a cup: the left
 * hand holds the low end, the right closes and opens the far end and works the
 * slide, and the two of them are a hand's width apart the whole time. This
 * model used to return one contact for both hands, so both palms went to the
 * same point on a 155 mm instrument and the cup was a fist. Hole 1 is at the
 * player's **left** (+x, since `SIDE.right === −1`) and the slide button is out
 * the right-hand end — which is what the comment on the slide has always
 * claimed and the geometry did the opposite of.
 */

import {
  BoxGeometry, CylinderGeometry, Group, InstancedMesh, Matrix4, Mesh,
  MeshStandardMaterial, Vector3,
} from 'three';

import { ARCHETYPES } from '../../../concert/instruments.js';
import type { Effector, PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import { mouthFor } from './mouth.js';
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

/** The hole face, on the player's side of the comb. */
const HOLE_FACE_Z = -0.012;

export const buildHarmonica: InstrumentBuilder = (opts: InstrumentBuildOptions): InstrumentModel => {
  live++;
  const rng = new Rng(`harmonica:${opts.seed}`);

  /** Where the centre of the harp sits: at this player's lips. */
  const mouth = mouthFor(opts, SPEC.workHeight);

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
  harp.position.set(0, mouth.y, 0);

  const comb = addTo(harp, new Mesh(geoComb, matComb));
  comb.name = 'comb';
  comb.castShadow = true;

  /** Cover plates, hinged at the comb so a draw can open them a hair. */
  const coverTop = addTo(harp, new Group());
  const topShell = addTo(coverTop, new Mesh(geoCover, matCover));
  topShell.name = 'cover-top';
  topShell.position.y = 0.001;
  topShell.castShadow = true;
  const coverBottom = addTo(harp, new Group());
  const bottomShell = addTo(coverBottom, new Mesh(geoCover, matCover));
  bottomShell.name = 'cover-bottom';
  bottomShell.position.y = -0.001;
  bottomShell.rotation.x = Math.PI;

  for (const x of [-COMB_LEN / 2 - 0.002, COMB_LEN / 2 + 0.002]) {
    const end = addTo(harp, new Mesh(geoEnd, matCover));
    end.name = 'end-plate';
    end.position.x = x;
  }
  for (const x of [-COMB_LEN / 2 + 0.010, COMB_LEN / 2 - 0.010]) {
    const screw = addTo(harp, new Mesh(geoScrew, matCover));
    screw.name = 'screw';
    screw.position.set(x, 0, 0.004);
  }

  /**
   * Twelve hole mouths on the player's face of the comb, in one draw call.
   * They are the thing that says "harmonica" and nothing else about the
   * object does, so they are worth the instanced mesh.
   */
  // Hole 1 — the low end — is at the player's left, which is +x.
  const holeX: number[] = [];
  for (let i = 0; i < HOLES; i++) holeX.push(((HOLES - 1) / 2 - i) * HOLE_PITCH);
  const mouths = new InstancedMesh(geoHole, matHole, HOLES);
  // Named for the family's convention: whatever the lips close on is the
  // "mouthpiece", and the probe checks it lands at the mouth.
  mouths.name = 'mouthpiece';
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
  slideRod.name = 'slide-rod';
  slideRod.position.set(-COMB_LEN / 2 - 0.017, 0, -0.004);
  const slideButton = addTo(slide, new Mesh(geoSlideButton, matCover));
  slideButton.name = 'slide-button';
  slideButton.position.set(-COMB_LEN / 2 - 0.036, 0, -0.004);

  // --- contacts ----------------------------------------------------------
  /**
   * One contact per hole per hand, and almost no travel between them — under
   * three centimetres end to end. That is right: a harmonica player's hands
   * breathe along the instrument, they do not reach for it, and the lips are
   * what actually find the hole.
   */
  /**
   * The cup: one hand off each **end** of the harp, not two palms in front of
   * it.
   *
   * A rig hand is `2 R` across and `R` is `0.040 × height`, so a palm is about
   * 136 mm wide and 119 mm deep on a 155 mm instrument. Two of those, centred
   * 96 mm apart on the audience face and standing 17 mm proud of it — which is
   * where this used to put them, because the contact was at `z = 0.018` and a
   * `touch: 0` pose holds its palm `0.19 R` behind the contact — are not a cup
   * around a harmonica. They are a harmonica-shaped hole in a wall of hand:
   * measured, the pair covered `x ∈ [−0.116, 0.116]` against a comb that ends
   * at ±0.078, so every part of the instrument was behind a palm and the model
   * might as well not have been built.
   *
   * So the normal turns from the audience (`+z`) to **outward along the harp**
   * (`±x`). That is the whole fix, and it is one line: the palm now hangs off
   * the end plate rather than in front of the covers, and only the fingers —
   * which curl toward `−normal`, meaning inward — come back across the harp.
   * The middle ~100 mm of comb, holes, covers and slide is left in clear air.
   *
   * `GRIP_X` is `0.19 R` inside the end plate for the same reason the trumpet's
   * left hand is inside its valve casing: the contact is where the palm's
   * *surface* should end up, not where its centre goes, so a contact placed on
   * the end plate floats the hand a centimetre and a half off the instrument.
   */
  const GRIP_X = COMB_LEN / 2 - 0.012;
  /**
   * How much of the played hole's offset the hands take.
   *
   * A quarter, not all of it. Hands that fully tracked the hole put the low
   * hand 57 mm past the end of a harp it is supposed to be holding; a real
   * player's cup breathes along the instrument by a centimetre or so while the
   * lips do the travelling.
   */
  const DRIFT = 0.25;
  function cupAt(x: number, side: number): Contact {
    return {
      position: new Vector3(side * GRIP_X + x * DRIFT, mouth.y - 0.006, 0.002),
      // Out of the end of the harp, a little downward and a little toward the
      // audience — a cupping hand comes up around a harmonica from below and
      // closes on it from the front, it does not press onto the covers.
      normal: new Vector3(side * 0.95, -0.27, 0.18).normalize(),
      /**
       * Knuckles up the face, so the fingers reach *forward and then inward*.
       *
       * The rig derives the fingers from `along × normal`, and with the normal
       * now running out of the end of the harp this sends both sets of fingers
       * toward the audience; the pose's own curl then folds them back along
       * `−normal`, which is inward over the end of the instrument. That is a
       * cup: two hands closing on the ends from the front. The mirror is what
       * keeps each hand's wrist on its own side of the body.
       */
      along: new Vector3(0, -side, 0),
    };
  }
  const leftContacts: Contact[] = holeX.map((x) => cupAt(x, 1));
  const rightContacts: Contact[] = holeX.map((x) => cupAt(x, -1));
  /** Hands at rest: closed on both ends, over the middle of the harp. */
  const restLeft = cupAt(0, 1);
  const restRight = cupAt(0, -1);

  function copy(c: Contact): Contact {
    return {
      position: c.position.clone(),
      normal: c.normal.clone(),
      ...(c.along ? { along: c.along.clone() } : {}),
    };
  }

  /** `'right-hand'` and `'bow'` ask for the sounding hand. See `InstrumentModel`. */
  function isRight(effector?: Effector): boolean {
    return effector === undefined || effector === 'right-hand' || effector === 'bow';
  }

  const [LO, HI] = SPEC.range;

  // --- animation state ---------------------------------------------------
  let slideAt = 0;
  let slideTo = 0;
  /** −1 fully blown, +1 fully drawn. The covers breathe with it. */
  let breath = 0;
  let breathTo = 0;
  let lastBeat = Number.NaN;
  /** Guards a second `dispose`: `release` is refcounted across the stage. */
  let disposed = false;

  return {
    archetype: 'harmonica',
    root,
    station: {
      // The hole face, less how far in front of the body this player's mouth
      // is — which is what puts the lips on the holes rather than near them.
      offset: new Vector3(0, 0, HOLE_FACE_Z - mouth.z),
      facing: 0,
      posture: SPEC.posture,
    },

    resolve(point: PlayPoint, effector?: Effector): Contact | undefined {
      const right = isRight(effector);
      if (point.kind === 'rest') return copy(right ? restRight : restLeft);
      if (point.kind !== 'hole') return undefined;
      if (point.midi < LO || point.midi > HI) return undefined;
      const note = noteFor(point.midi);
      if (!note) return undefined;
      return copy((right ? rightContacts : leftContacts)[note.hole]!);
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
      // A non-finite beat has to stop here. `dt` would be NaN, every eased
      // value in this method is `x += (target − x) * k`, and one NaN k turns
      // the whole instrument into NaN transforms permanently — three.js keeps
      // drawing it, at no position, for the rest of the show.
      if (!Number.isFinite(now)) return;
      const dt = Number.isFinite(lastBeat) ? Math.min(Math.max(now - lastBeat, 0), 0.5) : 0;
      lastBeat = now;
      if (dt === 0) return;

      slideAt += (slideTo - slideAt) * (1 - Math.exp(-dt / 0.03));
      // Toward +x, which is *into* the harp now that the button is out the
      // right-hand (−x) end. It travelled outward before, which is a button
      // being pulled rather than pressed.
      slide.position.x = SLIDE_TRAVEL * slideAt;

      breath += (breathTo - breath) * (1 - Math.exp(-dt / 0.06));
      breathTo *= Math.exp(-dt / 0.35);
      coverTop.rotation.x = -0.055 * breath;
      coverBottom.rotation.x = 0.055 * breath;
    },

    dispose(): void {
      // A second call would free the shared buffers out from under every
      // other one of these on the stage. That renders as nothing at all and
      // reports nothing, so it is guarded rather than left to be noticed.
      if (disposed) return;
      disposed = true;
      mouths.dispose();
      root.removeFromParent();
      root.clear();
      release();
    },
  };
};
