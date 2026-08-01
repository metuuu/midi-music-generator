/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The polysynth rig — 1978 to 1983, when the keyboard *was* the instrument.
 *
 * This is the Prophet-5, the Jupiter-8, the CS-80: the short window between the
 * cabinet of patch cables you stand inside and the plastic slab you stack two
 * of. Everything that made those instruments look like each other is a
 * consequence of one fact — the synthesiser had finally shrunk to the size of
 * its own keyboard, so the case had to be a piece of furniture rather than a
 * rack, and it was built like one: a wooden surround, a metal panel between the
 * cheeks, and a chrome X-stand underneath because it was now light enough for
 * one.
 *
 * Four things carry the period at stage distance, and they are the four things
 * this file spends its geometry on: **timber sides**, **one dense row of knobs
 * and sliders** on a panel angled at the audience, **two wheels at the player's
 * left**, and the **X-stand**. Miss any of them and it reads as a modern
 * keyboard; get them and nothing else matters much, because nothing else on one
 * of these is bigger than a thumbnail from row ten.
 *
 * ## No patch bay
 *
 * The old generic model had a bank of jacks with cables looped out of it, and
 * that is exactly what 1978 got rid of. The Prophet-5's headline feature was
 * *memory* — forty patches recalled by a two-digit number — and the reason it
 * mattered commercially is that it ended the need to re-patch a sound between
 * numbers. A patch bay on this rig would be a cabinet part on a piece of
 * furniture, and it would also duplicate the modular rig, where cables are the
 * whole point. So the jacks are gone and the programmer that replaced them is
 * here instead: a small block of program buttons and a lit display at the bass
 * end, next to the wheels, which is where Sequential put it.
 *
 * Nothing here is consulted about where a hand goes, and everything sits behind
 * or below the keys — see `synth-rig.ts` for why both of those are true.
 */

import {
  BoxGeometry, Color, CylinderGeometry, Group, InstancedMesh, Material, Matrix4,
  Mesh, MeshStandardMaterial, Quaternion, Vector3,
} from 'three';

import { Rng } from '../../../core/rng.js';
import {
  disposeTree, mountOutlet, type SynthRig, type SynthRigBuilder,
} from './synth-rig.js';
import { addTo } from './types.js';

/**
 * Walnut, rosewood, teak, and one nearly-black stain.
 *
 * Real timber rather than the painted cheeks the generic model had, because a
 * wooden side is the single most recognisable thing about the era: it is the
 * one part of a Prophet-5 you can identify from the back of a hall, and a
 * black-on-black keyboard from this decade simply did not exist.
 */
const WOODS = ['#5b3a24', '#4a2c1b', '#6a4526', '#3d2a1d'];

/**
 * Knob caps and slider caps, in the colours the period actually used: Roland's
 * orange-red and blue, Yamaha's amber, Sequential's cream. One accent across
 * the whole panel rather than a colour per control, because these were designed
 * objects and a randomly parti-coloured panel reads as a toy.
 */
const ACCENTS = ['#d8452e', '#2f7fc2', '#e0a52c', '#dcd6c8'];

/**
 * What is in the row. A Prophet-5 has about forty knobs and a Jupiter-8 about
 * thirty controls of which half are faders; 28 and 7 is that shape at a density
 * where each one is still an object rather than a speck, and it is the count
 * that makes the panel look busy far more than any individual control does.
 */
const KNOBS = 28;
const SLIDERS = 7;

export const buildPolysynthRig: SynthRigBuilder = (opts) => {
  const rng = new Rng(`polysynth:${opts.seed}`);
  const group = new Group();
  group.name = 'synth-rig-polysynth';

  const { boardWidth, keyTopY, keyBackZ, whiteLength } = opts;

  /**
   * The case is the keybed plus a cheek at each end, and the cheeks are wood.
   *
   * 13 cm of overhang rather than 10 puts 1.5 cm of daylight between the timber
   * and the last key. The generic model's painted cheeks were flush against the
   * key ends, which is fine when they are 4 cm tall and a problem now they stand
   * 5 cm proud: a hand on the bottom A has to be able to get to it.
   */
  const shellW = boardWidth + 0.13;
  /** Thick enough to read as a plank from row ten, which is the whole point. */
  const CHEEK_W = 0.05;
  const caseDepth = whiteLength + 0.09;
  const caseZ = keyBackZ - whiteLength / 2 - 0.02;

  // --- Materials -----------------------------------------------------------

  /**
   * The grain varies with the seed, a little. Two of these on one stage were cut
   * from two different trees and finished in two different years, and a pair of
   * identical browns is the tell that they are one object drawn twice. The
   * offsets are small on purpose — wide enough to separate two instruments side
   * by side, narrow enough that none of them stops being walnut.
   */
  const woodColour = new Color(rng.pick(WOODS)).offsetHSL(
    rng.float(-0.012, 0.012), rng.float(-0.06, 0.06), rng.float(-0.03, 0.03),
  );
  const accent = rng.pick(ACCENTS);

  /**
   * `finish` tints the chassis and never the wood. A venue palette can say what
   * colour the sheet metal was sprayed; it cannot say what a walnut plank looks
   * like, and letting it try is how you get a lime green Prophet.
   */
  const chassisColour = opts.finish ?? rng.pick(['#23262b', '#1a1c20', '#2f3138']);

  const woodMat = new MeshStandardMaterial({ color: woodColour, roughness: 0.52, metalness: 0.02 });
  const chassisMat = new MeshStandardMaterial({ color: chassisColour, roughness: 0.62, metalness: 0.14 });
  const panelMat = new MeshStandardMaterial({ color: '#2a2c31', roughness: 0.45, metalness: 0.35 });
  const slotMat = new MeshStandardMaterial({ color: '#0e0f11', roughness: 0.6, metalness: 0.1 });
  const knobMat = new MeshStandardMaterial({ color: '#1a1b1e', roughness: 0.55, metalness: 0.15 });
  const capMat = new MeshStandardMaterial({ color: accent, roughness: 0.45, metalness: 0.2 });
  const chromeMat = new MeshStandardMaterial({ color: '#b9c0c8', roughness: 0.3, metalness: 0.88 });
  /** Screen-printed legend and cream button caps — one material, both cream. */
  const printMat = new MeshStandardMaterial({ color: '#cfc9ba', roughness: 0.6, metalness: 0.05 });
  /** Wheels are rubber-topped and matt, which is why they never catch a light. */
  const rubberMat = new MeshStandardMaterial({ color: '#17181a', roughness: 0.9, metalness: 0 });
  const ledMat = new MeshStandardMaterial({
    color: '#0d1a12', emissive: accent, emissiveIntensity: 0.8, roughness: 0.4,
  });

  // --- Case ----------------------------------------------------------------

  const tray = addTo(group, new Mesh(new BoxGeometry(shellW, 0.11, caseDepth), chassisMat));
  tray.position.set(0, keyTopY - 0.062, caseZ);
  tray.castShadow = true;
  tray.receiveShadow = true;

  /**
   * The end cheeks, standing 5 cm proud of the keys and running the whole depth
   * of the case. They frame the keybed rather than covering it, and they are
   * the thing that makes this silhouette not a slab.
   */
  const cheekGeo = new BoxGeometry(CHEEK_W, 0.13, caseDepth);
  const cheekX = shellW / 2 - CHEEK_W / 2;
  for (const side of [1, -1]) {
    const cheek = addTo(group, new Mesh(cheekGeo, woodMat));
    cheek.position.set(side * cheekX, keyTopY - 0.009, caseZ);
    cheek.castShadow = true;
  }

  // --- Control panel -------------------------------------------------------

  /**
   * The control surface, tilted back so the player can read it and the audience
   * can see there is something to read. Everything on the panel hangs off this
   * group, so the tilt is set once and every position below is in panel-local
   * coordinates: `y` is up out of the panel face, `z` runs from the front edge
   * (nearest the keys) to the back.
   */
  const panel = addTo(group, new Group());
  panel.position.set(0, keyTopY - 0.005, keyBackZ + 0.015);
  panel.rotation.x = -0.55;

  /** The panel is inset between the cheeks — the metal never reaches the ends. */
  const panelW = shellW - CHEEK_W * 2;
  const panelSlab = addTo(panel, new Mesh(new BoxGeometry(panelW, 0.035, 0.30), panelMat));
  panelSlab.position.z = 0.15;
  panelSlab.castShadow = true;
  /** Panel top surface, in panel-local `y`. Everything mounted sits above it. */
  const FACE = 0.0175;

  /** The wood carries on up the sides of the panel, standing a centimetre proud. */
  const panelCheekGeo = new BoxGeometry(CHEEK_W, 0.045, 0.31);
  for (const side of [1, -1]) {
    const flank = addTo(panel, new Mesh(panelCheekGeo, woodMat));
    flank.position.set(side * cheekX, 0.005, 0.152);
    flank.castShadow = true;
  }
  /** And across the back, so the timber reads as a surround and not two planks. */
  const backRail = addTo(panel, new Mesh(new BoxGeometry(shellW, 0.05, 0.03), woodMat));
  backRail.position.set(0, 0.010, 0.295);

  /**
   * One row, and the whole panel is that row.
   *
   * A polysynth panel is a single dense band of controls that you read left to
   * right like a signal path — oscillators, mixer, filter, envelopes — and it is
   * dense because there is one control per parameter and no menu anywhere. Two
   * tidy rows of large knobs is what a boutique reissue looks like, not what a
   * production instrument looked like.
   *
   * The layout is measured in *units* rather than metres so that it is the
   * keybed that decides how big a knob is. Hard-coded pitches would work for
   * today's 88 keys and hang half the row off the end of a 61-note board.
   */
  const rowSpan = panelW - 0.11;
  const ROW_Z = 0.15;
  const PROG_UNITS = 3.6;
  const GAP_UNITS = 0.8;
  const SLIDER_UNITS = 1.2;
  const unit = rowSpan / (PROG_UNITS + GAP_UNITS * 2 + KNOBS + SLIDERS * SLIDER_UNITS);

  /** Hands out the next slice of the row, bass end first, and returns its centre. */
  let cursor = rowSpan / 2;
  const take = (units: number): number => {
    const centre = cursor - (units * unit) / 2;
    cursor -= units * unit;
    return centre;
  };

  const scratch = new Matrix4();
  const quat = new Quaternion();
  const one = new Vector3(1, 1, 1);
  const yAxis = new Vector3(0, 1, 0);

  // --- The programmer, at the bass end next to the wheels ------------------

  /**
   * Eight square buttons in two ranks: bank above, program below. This is what
   * a patch bay turned into, and it is at the player's left because that is
   * where the Prophet-5 put it — you set a number with the hand that is not
   * playing.
   */
  const progX = take(PROG_UNITS);
  const progPitch = (PROG_UNITS * unit) / 4;
  const buttonGeo = new BoxGeometry(progPitch * 0.62, 0.008, 0.016);
  const buttons = addTo(panel, new InstancedMesh(buttonGeo, printMat, 8));
  for (let i = 0; i < 8; i++) {
    const col = i % 4;
    const rank = i < 4 ? 1 : -1;
    scratch.makeTranslation(
      progX + (1.5 - col) * progPitch, FACE + 0.004, ROW_Z + rank * 0.024,
    );
    buttons.setMatrixAt(i, scratch);
  }
  buttons.instanceMatrix.needsUpdate = true;

  /**
   * The lit display above them, and the one thing on this rig that moves.
   *
   * On the real instrument it shows the patch number and does nothing else; here
   * it answers to the playing, because a panel with nothing alive on it reads as
   * a photograph of an instrument rather than one in use. What it cannot do any
   * more is slide along the panel to follow the pitch, which is what the generic
   * model did — a rig is told that a note happened and how hard, and never which
   * note. That is the price of the seam and it is a fair one: no synthesiser
   * ever had a lamp that tracked the melody.
   */
  const led = addTo(panel, new Mesh(new BoxGeometry(0.026, 0.010, 0.014), ledMat));
  led.position.set(progX, FACE + 0.005, ROW_Z + 0.078);

  take(GAP_UNITS);

  // --- Knobs ---------------------------------------------------------------

  /**
   * 21 mm caps at 27 mm centres, which is about a Prophet's and deliberately
   * smaller than the generic model's 38 mm dinner plates. Small knobs close
   * together are what makes a panel look like it has a hundred things on it.
   * Body and pointer are two instanced meshes over the same transforms.
   */
  const knobR = unit * 0.39;
  const knobGeo = new CylinderGeometry(knobR * 0.92, knobR, 0.020, 10);
  const pointerGeo = new BoxGeometry(0.0035, 0.017, knobR * 1.1);
  const knobMesh = addTo(panel, new InstancedMesh(knobGeo, knobMat, KNOBS));
  const pointerMesh = addTo(panel, new InstancedMesh(pointerGeo, capMat, KNOBS));
  const knobX: number[] = [];
  for (let i = 0; i < KNOBS; i++) {
    const x = take(1);
    knobX.push(x);
    // Knob angles are pure decoration and never resolved, so the seed is free
    // to set them.
    quat.setFromAxisAngle(yAxis, rng.float(-1.9, 1.9));
    scratch.compose(new Vector3(x, FACE + 0.010, ROW_Z), quat, one);
    knobMesh.setMatrixAt(i, scratch);
    scratch.compose(new Vector3(x, FACE + 0.020, ROW_Z), quat, one);
    pointerMesh.setMatrixAt(i, scratch);
  }
  knobMesh.instanceMatrix.needsUpdate = true;
  pointerMesh.instanceMatrix.needsUpdate = true;

  /**
   * Screen-printed rules between sections, every fifth knob or so. They are a
   * millimetre wide and cost one draw call, and they are the difference between
   * a row of knobs and a row of knobs that is obviously grouped into an
   * oscillator, a filter and an envelope — which is the thing the tilt exists to
   * let the audience see.
   */
  const RULE_AFTER = [4, 9, 14, 19, 24];
  const ruleGeo = new BoxGeometry(0.0015, 0.001, 0.058);
  const rules = addTo(panel, new InstancedMesh(ruleGeo, printMat, RULE_AFTER.length));
  RULE_AFTER.forEach((k, i) => {
    const a = knobX[k] ?? 0;
    const b = knobX[k + 1] ?? a;
    scratch.makeTranslation((a + b) / 2, FACE + 0.0005, ROW_Z);
    rules.setMatrixAt(i, scratch);
  });
  rules.instanceMatrix.needsUpdate = true;

  take(GAP_UNITS);

  // --- Sliders -------------------------------------------------------------

  /**
   * Faders as well as knobs, at the treble end where the envelopes live. An
   * all-knob panel is a later idea — the Jupiter-8 and the CS-80 are half
   * sliders, and a hand full of them is most of what makes the panel look like
   * a mixing desk rather than a pedal.
   *
   * The cap sits at a seeded point along its own travel. Nothing reads this and
   * nothing moves it; it is here because seven faders lined up at exactly the
   * same height is the one thing that never happens on a used instrument.
   */
  const TRAVEL = 0.070;
  const slotGeo = new BoxGeometry(0.008, 0.006, TRAVEL);
  const sliderGeo = new BoxGeometry(unit * 0.62, 0.010, 0.014);
  const slotMesh = addTo(panel, new InstancedMesh(slotGeo, slotMat, SLIDERS));
  const sliderMesh = addTo(panel, new InstancedMesh(sliderGeo, capMat, SLIDERS));
  for (let i = 0; i < SLIDERS; i++) {
    const x = take(SLIDER_UNITS);
    scratch.makeTranslation(x, FACE - 0.001, ROW_Z);
    slotMesh.setMatrixAt(i, scratch);
    scratch.makeTranslation(x, FACE + 0.005, ROW_Z + rng.float(-0.4, 0.4) * TRAVEL);
    sliderMesh.setMatrixAt(i, scratch);
  }
  slotMesh.instanceMatrix.needsUpdate = true;
  sliderMesh.instanceMatrix.needsUpdate = true;

  // --- Pitch and mod wheels, at the player's left --------------------------

  /**
   * The other thing 1978 standardised. Before it, bend was a ribbon or a lever
   * or a knob or nothing at all; after it, every keyboard made anywhere had two
   * wheels in a block off the bass end, and that block is now so expected that
   * leaving it off is more noticeable than getting it wrong.
   *
   * They sit in their own housing outboard of the cheek, with only the top
   * quarter of each wheel above the woodwork — which is both what the real thing
   * looks like and what keeps them clear of the space a hand needs over the
   * keys.
   */
  const wheelX = shellW / 2 + 0.048;
  const wheelBlock = addTo(group, new Mesh(new BoxGeometry(0.096, 0.12, 0.15), woodMat));
  wheelBlock.position.set(wheelX, keyTopY - 0.057, keyBackZ - 0.072);
  wheelBlock.castShadow = true;

  const wheelGeo = new CylinderGeometry(0.030, 0.030, 0.016, 14);
  /** Pitch in front, mod behind it — the order every one of them shipped in. */
  const pitchWheel = addTo(group, new Mesh(wheelGeo, rubberMat));
  pitchWheel.rotation.z = Math.PI / 2;
  pitchWheel.position.set(wheelX, keyTopY - 0.004, keyBackZ - 0.108);
  pitchWheel.castShadow = true;
  const modWheel = addTo(group, new Mesh(wheelGeo, rubberMat));
  modWheel.rotation.z = Math.PI / 2;
  modWheel.position.set(wheelX, keyTopY - 0.004, keyBackZ - 0.058);
  modWheel.castShadow = true;

  // --- X-stand -------------------------------------------------------------

  /**
   * Chrome tube, and the reason it is here at all is that this is the first
   * generation light enough to stand on one. The legs cross in x as well as z,
   * so it reads as an X from the front and still has a footprint from the side.
   */
  const barGeo = new CylinderGeometry(0.019, 0.019, 1, 8);
  function tube(a: Vector3, b: Vector3, mat: Material): void {
    const mesh = addTo(group, new Mesh(barGeo, mat));
    const dir = b.clone().sub(a);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.scale.set(1, Math.max(dir.length(), 1e-4), 1);
    mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
  }
  const standTop = keyTopY - 0.12;
  const zc = keyBackZ - whiteLength * 0.5 - 0.01;
  for (const s of [1, -1]) {
    tube(new Vector3(0.30 * s, standTop, zc - 0.22), new Vector3(-0.30 * s, 0.02, zc + 0.22), chromeMat);
    tube(new Vector3(0.30 * s, standTop, zc + 0.22), new Vector3(-0.30 * s, 0.02, zc - 0.22), chromeMat);
  }
  tube(new Vector3(0.30, standTop, zc - 0.22), new Vector3(0.30, standTop, zc + 0.22), chromeMat);
  tube(new Vector3(-0.30, standTop, zc - 0.22), new Vector3(-0.30, standTop, zc + 0.22), chromeMat);

  // --- Sockets -------------------------------------------------------------

  /**
   * On the back of the tray, at the bass end, under the panel's overhang.
   *
   * Which is where they were: a case of this era carries its jacks on the rear
   * apron, and the sloped panel stands proud above them — so the plate is in
   * shadow from the house and the lead drops out of it into daylight, which is
   * exactly the read wanted. The bass end because the player stands at the
   * treble end of a five-octave board more often than not, and a lead should
   * leave by the end nobody is working at.
   */
  const outlet = mountOutlet(
    group, slotMat,
    new Vector3(shellW * 0.32, keyTopY - 0.055, caseZ + caseDepth / 2),
  );

  // --- Response ------------------------------------------------------------

  /**
   * One decaying level, driven by whatever was last played and read by both the
   * lamp and the mod wheel. `tau` of 0.7 beats is slow enough that a busy pad
   * keeps the display lit rather than strobing it.
   */
  let hitBeat = -1e9;
  let hitForce = 0;

  const rig: SynthRig = {
    group,
    outlet,

    react(force: number, now: number): void {
      hitBeat = now;
      hitForce = force < 0 ? 0 : force > 1 ? 1 : force;
    },

    update(now: number): void {
      const age = now - hitBeat;
      const glow = age < 0 || age > 4.2 ? 0 : hitForce * Math.exp(-age / 0.7);
      ledMat.emissiveIntensity = 0.35 + 2.4 * glow;
      // The mod wheel leans into a hard note. It is the only control on this
      // instrument a player's hand would actually be moving that is not a key —
      // the pitch wheel is sprung to centre and only gets touched on a lead
      // line, so it stays where it is.
      modWheel.rotation.x = -glow * 0.5;
    },

    dispose(): void {
      disposeTree(group);
    },
  };

  return rig;
};
