/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * A face, procedurally: two eyes, two brows, a nose and a mouth.
 *
 * No morph targets and no blend shapes, because there is no mesh to morph — the
 * face is **eleven small primitives** whose transforms are computed every frame
 * from **six numbers**. Counted off the built head it is ten, and twelve on a
 * blower, whose cheeks are the two that come and go — and they go all the way,
 * inside the skull and off the draw list, until there is air behind them; the
 * channels are nine, the `gaze` pair and `blow` having arrived after this
 * paragraph. That is not a shortcut around a rigging pipeline; it is what lets
 * the same face be driven by the viseme track, the groove and a tomato at the
 * same time without any of them needing to know about the others.
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
 * puff for a player who is blowing into something, and are inside the head
 * until they do. The gaze *direction* is decided by the rig — this file only
 * knows where to put the irises.
 */

import { Color, Group, Mesh, MeshStandardMaterial, Object3D, SRGBColorSpace } from 'three';

import { Rng } from '../../core/rng.js';

import { Leases, bead, hairSurface, orb, pip, shade, slab, surface, pill } from './performer-assets.js';
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
  /**
   * 0..1 — how much air is going out of this mouth right now. Puffs the cheeks
   * of a blower and does nothing to anyone else, who has none built.
   *
   * Not effort, which is what this channel used to be. Effort is exertion: it
   * idles at 0.12 for a player standing still and settles at 0.72 for one who
   * is playing anything at all, so there was no value of it that took the
   * cheeks away and no value that moved them much either. A cheek is not a
   * function of how hard the part is. It is a function of whether there is
   * pressure behind it on this note.
   */
  blow(amount: number): void;
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

/**
 * The skull, as the cheeks have to know it: an ellipsoid of `2 × 2.10 × 1.90 R`,
 * written here as semi-axes.
 *
 * `performer.ts` builds it and `performer-hair.ts` inflates copies of it, so
 * this is the third place the same three numbers appear, and it earns its
 * repetition: every other feature on this face is a lump parked on the *outside*
 * of the skull and can be placed by eye against a screenshot. A cheek is the one
 * part that has to be *inside* it, and "inside an ellipsoid" is a containment
 * test rather than a matter of taste. A test needs the shape it tests against.
 */
const SKULL = { x: 1, y: 1.05, z: 0.95 } as const;

/**
 * A cheek is a ball that **slides out of** the head, not one that grows on it.
 *
 * It used to be a ball of `0.20 R` parked at `(0.52, -0.28, 0.58) R` — `0.83 R`
 * from the centre of a skull whose surface along that ray is at `0.98 R`, so
 * half a centimetre of the ball stood through the face before anything drove
 * it. Every wind player and every singer walked on wearing two lumps on their
 * cheekbones and wore them all night, through the numbers they sat out as well
 * as the ones they played. And the channel driving them was `effort`, which
 * idles at 0.12 and settles at 0.72 — so the puff ran between **8 mm and 14 mm
 * proud**: never absent, and 6 mm of travel between standing still and playing
 * flat out. There was no value of the input that put the cheeks away, because
 * the ball was outside the head at every value including zero.
 *
 * So the radius is fixed and the *centre travels* along `CHEEK_DIR`. At rest the
 * whole ball is inside the skull and nothing draws; at full puff it stands
 * `CHEEK_PUSH` proud and what shows is the cap that has come through — a cap
 * that starts at zero width and widens, so a cheek **fills** rather than pops.
 * That is the argument for sliding a fixed sphere rather than scaling one in
 * place: a sphere grown about its own centre is either already showing at rest
 * or has to cross the surface all at once, and it arrives as a disc.
 *
 * The numbers: at rest the ball's crown is `0.0095 R` — 1.3 mm — inside the
 * skull, and at full puff it stands `0.12 R` proud, which is 1.6 cm on a 13.7 cm
 * head radius, opening a cap about 6 cm across. That is a brass player's cheek
 * at the top of a phrase, not a chipmunk's. Nothing shows at all below a puff
 * of about 0.07, which is the 1.3 mm of clearance being crossed.
 */
const CHEEK_R = 0.28;
const CHEEK_PUSH = 0.13;
const CHEEK_DIR = unit(0.62, -0.30, 0.60);

/**
 * The rest distance, derived rather than eyeballed — which is the point of
 * having `SKULL` at all. Move the cheek, widen it, or reshape the head, and the
 * ball is still inside the face when nobody is blowing.
 */
const CHEEK_REST = deepestInside(CHEEK_DIR, CHEEK_R);

/**
 * Below this the cheek is not drawn at all.
 *
 * Belt and braces on the same door: the ball is inside the skull by
 * construction at rest, and `visible` takes it off the draw list anyway. The
 * threshold is small enough that it always lands well before the ball's crown
 * reaches the surface — nothing pops into view, it is already invisible when it
 * appears.
 */
const CHEEK_SHOW = 0.01;

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
  //
  // `orb` rather than the `pip` every other lump on this face is made of: what
  // a puff shows is a cap coming through the skull, and the rim of that cap is
  // a silhouette edge lying across a face at close camera range. Ten segments
  // of sphere read as a hexagon there. 384 triangles on the players who blow,
  // 144 more than the pips they replace, and none at all on anybody else.
  //
  // Neither the position nor the visibility is set here, unlike every other
  // feature above: both are the puff's, and `applyCheeks` below runs before
  // this function returns. A cheek has no build-time pose worth writing down.
  const cheeks: Mesh[] = [];
  if (blown) {
    for (let i = 0; i < 2; i++) {
      const cheek = new Mesh(orb(l), skin);
      // `orb` is a diameter of 1.
      cheek.scale.setScalar(R * CHEEK_R * 2);
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
  let puffAmount = 0;

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
    const out = R * (CHEEK_REST + CHEEK_PUSH * puffAmount);
    const shown = puffAmount > CHEEK_SHOW;
    for (let i = 0; i < cheeks.length; i++) {
      const cheek = cheeks[i];
      if (!cheek) continue;
      const s = i === 0 ? SIDE.left : SIDE.right;
      cheek.position.set(s * CHEEK_DIR.x * out, CHEEK_DIR.y * out, CHEEK_DIR.z * out);
      cheek.visible = shown;
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
    blow(amount: number): void { puffAmount = clamp01(amount); },
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

/** A direction as a plain triple. No `Vector3`: it is read, never computed on. */
function unit(x: number, y: number, z: number): { x: number; y: number; z: number } {
  const n = Math.hypot(x, y, z);
  return { x: x / n, y: y / n, z: z / n };
}

/**
 * How far out along `dir` the centre of a sphere of `radius` can sit with all
 * of the sphere still inside the skull. In multiples of R, like everything else
 * in this file.
 *
 * Divide the world by `SKULL` and the skull becomes the unit sphere — but the
 * sphere being placed becomes an *ellipsoid* in that space, and there is no
 * closed form for the distance from a point to an ellipsoid worth writing here.
 * Bounding the transformed cheek by its longest semi-axis, `radius / min(SKULL)`,
 * is one line and is conservative in every direction at once.
 *
 * It costs about a millimetre of depth against the exact answer, and it cannot
 * be wrong in the direction that matters. A cheek a millimetre deeper than it
 * had to be is nothing; a cheek a millimetre shallower is a lump on a face.
 */
function deepestInside(dir: { x: number; y: number; z: number }, radius: number): number {
  const reach = Math.hypot(dir.x / SKULL.x, dir.y / SKULL.y, dir.z / SKULL.z);
  const thinnest = Math.min(SKULL.x, SKULL.y, SKULL.z);
  return Math.max(0, (1 - radius / thinnest) / reach);
}
