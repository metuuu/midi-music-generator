/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * A face, procedurally: two eyes, two brows, a nose and a mouth.
 *
 * No morph targets and no blend shapes, because there is no mesh to morph — the
 * face is **eleven small primitives** whose transforms are computed every frame
 * from **six numbers**. Counted off the built head it is ten, and twelve on a
 * blower, whose cheeks are the two that come and go; the channels are nine, the
 * `gaze` pair and `effort` having arrived after this paragraph. That is not a
 * shortcut around a rigging pipeline; it is
 * what lets the same face be driven by the viseme track, the groove and a
 * tomato at the same time without any of them needing to know about the others.
 *
 * ## The mouth is three numbers, and that is the contract
 *
 * `Viseme` carries `open`, `round` and `spread`, because the fifteen vowels map
 * onto that triangle exactly as the formant table does — `/a/` open and
 * neutral, `/u/` closed and round, `/i/` closed and spread. The lips are
 * therefore driven by *the same numbers the synthesiser is singing*, not by a
 * parallel animation track that has to be kept in agreement with it. There is
 * nothing to drift.
 *
 * The values are applied on the frame they arrive, with no smoothing. The
 * easing is the runtime's, from `Viseme.onsetSeconds` — a stop pops the lips in
 * 20 ms and a liquid takes 80, and a filter in here would flatten that
 * distinction into one mush for every consonant in the language.
 *
 * ## Everything else the face does
 *
 * Eyes that track a target and lead the head; brows that furrow and raise;
 * blinking on a seeded schedule so a band does not blink in unison; cheeks that
 * puff for a player who is blowing into something. The gaze *direction* is
 * decided by the rig — this file only knows where to put the irises.
 */

import { Color, Group, Mesh, MeshStandardMaterial, Object3D, SRGBColorSpace } from 'three';

import { Rng } from '../../core/rng.js';

import { Leases, bead, hairSurface, pip, shade, slab, surface, pill } from './performer-assets.js';
import { SIDE } from './performer-look.js';

export interface FaceRig {
  /** Viseme channel. Jaw opening, lip rounding, lip spreading, each 0..1. */
  mouth(open: number, round: number, spread: number): void;
  /** 0 open .. 1 shut. Blinking is added on top of whatever is set here. */
  eyes(closed: number): void;
  /** Brow raise and furrow, each 0..1. Surprise and effort respectively. */
  brow(raise: number, furrow: number): void;
  /** Where the irises point, in radians relative to straight ahead. */
  gaze(yaw: number, pitch: number): void;
  /** 0..1 — how hard this player is working. Puffs the cheeks of a blower. */
  effort(amount: number): void;
  /** `now` in seconds, for the blink schedule. Applies every channel. */
  update(now: number, dt: number): void;
}

/** Iris colours. Nothing in `Look` says, so it comes off the performer's id. */
const IRIS = ['#4a3524', '#2f4a5c', '#3d5240', '#5b5148', '#2a2320'] as const;

/**
 * Brows are hair, and were the only hair on this body that did not know it.
 *
 * They were `shade(skin, -0.30)` — a fixed step down from the *face* — which is
 * a plausible brow on nobody in particular and the wrong one on anybody the
 * wardrobe has an opinion about: a black-haired player in dark brown brows, and
 * every player on the stage in a different pair, because they were tracking skin
 * tone. The beard and the moustache in `performer-accessories.ts` have taken
 * `look.hair` all along; this is the same claim, applied to the pair of them
 * above the eyes.
 *
 * **The one thing hair colour cannot be trusted with is contrast.** Hair runs to
 * `#efeae0` in the classical and country wardrobes, and white brows on a light
 * face are not a subtle brow — they are *no brow*, and the brow is a channel:
 * `brow(raise, furrow)` is where surprise and effort are written, and a player
 * who cannot furrow has lost an expression rather than gained a hair colour. So
 * the hair's own lightness stands unless it lands within `BROW_CONTRAST` of the
 * face's, and only then is it pushed clear.
 *
 * Pushed *darker* where there is room and lighter where there is not, which is
 * the half the old rule could not express: a `shade(skin, -0.30)` on a dark face
 * clamps to black, so a grey-haired player in a dark skin tone got the same
 * black brows as everybody else standing beside them. Light hair over a dark
 * face is a real head and it now draws as one.
 */
const BROW_CONTRAST = 0.18;

/**
 * In sRGB, explicitly, and every call below says so.
 *
 * `Color` works in linear-sRGB by default, so an unqualified `getHSL` hands back
 * a lightness on a curve nobody reading a hex code is thinking in: `#3a2416` is
 * 0.157 to the eye and 0.02 linear, and a contrast rule written against one and
 * fed the other pushes brows the wrong way — it lightened a dark-haired player
 * on dark skin to `#aa724e`, which is a brow the colour of a plaster. The
 * numbers here are read off the wardrobe's own hex strings, so the comparison
 * has to happen in the space those strings are written in.
 */
function browColour(hairColour: string, skinColour: string): string {
  const hair = { h: 0, s: 0, l: 0 };
  const brow = new Color(hairColour);
  brow.getHSL(hair, SRGBColorSpace);
  const face = { h: 0, s: 0, l: 0 };
  new Color(skinColour).getHSL(face, SRGBColorSpace);

  const l = Math.abs(hair.l - face.l) >= BROW_CONTRAST
    ? hair.l
    : (face.l >= BROW_CONTRAST ? face.l - BROW_CONTRAST : face.l + BROW_CONTRAST);
  brow.setHSL(hair.h, hair.s, l, SRGBColorSpace);
  return `#${brow.getHexString(SRGBColorSpace)}`;
}

export function buildFace(
  head: Object3D, headR: number, skinColour: string, hairColour: string,
  blown: boolean, l: Leases, rng: Rng,
): FaceRig {
  const R = headR;
  const skin = surface(l, skinColour, { roughness: 0.62 });
  const lipMat = surface(l, shade(skinColour, -0.13), { roughness: 0.5 });
  const whiteMat = surface(l, '#f3f0ea', { roughness: 0.35 });
  const irisMat = surface(l, rng.pick(IRIS), { roughness: 0.25 });
  // `hairSurface` rather than a face material: these are hair, and they catch a
  // rim light the way the head does rather than the way a cheek does.
  const browMat = hairSurface(l, browColour(hairColour, skinColour));
  const innerMat = surface(l, '#2b1216', { roughness: 0.6 });

  // --- eyes --------------------------------------------------------------
  interface Eye { pivot: Group; iris: Mesh }
  const eyes: Eye[] = [];
  for (const s of [SIDE.left, SIDE.right]) {
    const pivot = new Group();
    pivot.position.set(s * R * 0.34, R * 0.14, R * 0.76);
    head.add(pivot);

    const white = new Mesh(pip(l), whiteMat);
    white.scale.set(R * 0.32, R * 0.42, R * 0.26);
    pivot.add(white);

    const iris = new Mesh(bead(l), irisMat);
    iris.scale.setScalar(R * 0.17);
    iris.position.set(0, 0, R * 0.10);
    pivot.add(iris);

    eyes.push({ pivot, iris });
  }

  // --- brows -------------------------------------------------------------
  const brows: Mesh[] = [];
  for (const s of [SIDE.left, SIDE.right]) {
    const brow = new Mesh(slab(l), browMat);
    brow.scale.set(R * 0.44, R * 0.09, R * 0.11);
    brow.position.set(s * R * 0.34, R * 0.42, R * 0.79);
    brows.push(brow);
    head.add(brow);
  }

  // --- nose --------------------------------------------------------------
  const nose = new Mesh(pip(l), skin);
  nose.scale.set(R * 0.24, R * 0.22, R * 0.30);
  nose.position.set(0, -R * 0.06, R * 0.88);
  head.add(nose);

  // --- mouth -------------------------------------------------------------
  const mouth = new Group();
  mouth.name = 'mouth';
  mouth.position.set(0, -R * 0.44, R * 0.84);
  head.add(mouth);

  const inner = new Mesh(pip(l), innerMat);
  mouth.add(inner);

  const lips: Mesh[] = [];
  for (let i = 0; i < 2; i++) {
    const lip = new Mesh(pill(l), lipMat);
    lip.rotation.z = Math.PI / 2;
    mouth.add(lip);
    lips.push(lip);
  }

  // --- cheeks ------------------------------------------------------------
  // Only for players who are blowing into something. A guitarist with puffable
  // cheeks is two meshes nobody will ever see move.
  const cheeks: Mesh[] = [];
  if (blown) {
    for (const s of [SIDE.left, SIDE.right]) {
      const cheek = new Mesh(pip(l), skin);
      cheek.position.set(s * R * 0.52, -R * 0.28, R * 0.58);
      cheeks.push(cheek);
      head.add(cheek);
    }
  }

  // --- state -------------------------------------------------------------
  let mOpen = 0;
  let mRound = 0;
  let mSpread = 0;
  let eyeClosed = 0;
  let browRaise = 0;
  let browFurrow = 0;
  let gazeYaw = 0;
  let gazePitch = 0;
  let effortAmount = 0;

  // Blinking, seeded per performer. Two people blinking together looks staged,
  // and a band of six doing it looks like a rendering bug.
  let nextBlink = rng.float(0.4, 3.5);
  let blinkUntil = -1;
  let blinkFrom = 0;
  const BLINK = 0.13;

  function applyMouth(): void {
    const halfW = R * (0.17 + 0.11 * mSpread - 0.07 * mRound);
    const halfH = R * (0.018 + 0.21 * mOpen);
    inner.scale.set(halfW * 2, halfH * 2 + R * 0.02, R * 0.20);
    const lipT = R * (0.055 + 0.035 * mRound);
    for (let i = 0; i < 2; i++) {
      const lip = lips[i];
      if (!lip) continue;
      const dir = i === 0 ? 1 : -1;
      lip.scale.set(lipT, halfW * 1.06, lipT);
      lip.position.set(0, dir * (halfH + lipT * 0.45), R * 0.03);
    }
    // A rounded vowel pushes the whole mouth forward. It is the difference
    // between /u/ and a small /a/, and it costs one line.
    mouth.position.z = R * (0.84 + 0.10 * mRound);
  }

  function applyEyes(now: number): void {
    if (now >= nextBlink && blinkUntil < 0) {
      blinkFrom = now;
      blinkUntil = now + BLINK;
      // Occasional double blink, which is what real eyes do and what nobody
      // ever animates.
      nextBlink = now + (rng.chance(0.18) ? 0.22 : rng.float(2.2, 6.5));
    }
    let blink = 0;
    if (blinkUntil >= 0) {
      if (now >= blinkUntil) {
        blinkUntil = -1;
      } else {
        blink = Math.sin(Math.PI * ((now - blinkFrom) / BLINK));
      }
    }
    const shut = Math.min(1, Math.max(eyeClosed, blink));
    for (const eye of eyes) {
      eye.pivot.scale.y = 1 - shut * 0.94;
      // The eyes lead the head. Clamped, because an iris that reaches the
      // corner of the eye reads as a stare rather than as a glance.
      eye.iris.position.x = clamp(gazeYaw * R * 0.22, -R * 0.10, R * 0.10);
      eye.iris.position.y = clamp(gazePitch * R * 0.20, -R * 0.09, R * 0.09) / Math.max(0.06, 1 - shut * 0.94);
    }
  }

  function applyBrows(): void {
    for (let i = 0; i < brows.length; i++) {
      const brow = brows[i];
      if (!brow) continue;
      const s = i === 0 ? SIDE.left : SIDE.right;
      brow.position.y = R * (0.42 + 0.13 * browRaise - 0.09 * browFurrow);
      brow.rotation.z = s * (browFurrow * 0.52 - browRaise * 0.20);
    }
  }

  function applyCheeks(): void {
    for (const cheek of cheeks) {
      cheek.scale.setScalar(R * (0.40 + 0.16 * effortAmount));
    }
  }

  applyMouth();
  applyBrows();
  applyCheeks();

  return {
    mouth(open: number, round: number, spread: number): void {
      mOpen = clamp01(open);
      mRound = clamp01(round);
      mSpread = clamp01(spread);
    },
    eyes(closed: number): void { eyeClosed = clamp01(closed); },
    brow(raise: number, furrow: number): void {
      browRaise = clamp01(raise);
      browFurrow = clamp01(furrow);
    },
    gaze(yaw: number, pitch: number): void { gazeYaw = yaw; gazePitch = pitch; },
    effort(amount: number): void { effortAmount = clamp01(amount); },
    update(now: number, _dt: number): void {
      applyMouth();
      applyEyes(now);
      applyBrows();
      applyCheeks();
    },
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function clamp01(v: number): number {
  return Number.isFinite(v) ? (v < 0 ? 0 : v > 1 ? 1 : v) : 0;
}
