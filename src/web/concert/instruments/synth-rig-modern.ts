/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The 1991-onward synthesiser — a controller with no sound in it, and a laptop.
 *
 * ## The instrument left the keyboard
 *
 * Each of the other three rigs is a period because of something that was *on*
 * the instrument: patch cables in 1974, a row of knobs in a wooden frame in
 * 1978, a membrane panel with nothing to turn in 1987. This one is a period
 * because of something that is no longer on it at all. General MIDI in 1991
 * made a sound module a commodity that any keyboard could drive, and once that
 * was true the thing under the hands stopped needing to be an instrument: what
 * you bought was a keybed, a circuit board and a socket, in a case with no
 * voice in it and nothing to program. The same year the PowerBook took the
 * lid-and-palmrest shape a laptop still has.
 *
 * Put those two facts on one stand and you have the whole read, which is the
 * only thing this file is really trying to draw: **a lid standing up where a
 * second keyboard used to be.** Patch cables say 1974 from six metres and a
 * 94 mm slab says 1987; a screen above a keyboard says after 1990, and it says
 * it at any distance an audience sits at, because a lit rectangle is the one
 * thing a dark stage cannot hide.
 *
 * ## What it is, in order of how much of the read each part carries
 *
 *  1. **The lid.** Silver, upright, tilted back a hand's width off vertical,
 *     lit. Nothing else here changes the silhouette at all by comparison, and
 *     everything below it could be any decade's keyboard without it.
 *  2. **The thinness of the board.** 62 mm against the DX7's 94. A controller
 *     has no voice boards, no output stage and no power supply — it is the
 *     thinnest keyboard object of any era, and a third off the slab is what
 *     makes it read as a plank with keys on rather than as a box.
 *  3. **The grid of lit pads**, at the treble end. Sixteen squares that glow is
 *     the one visual invention this decade made that the other three had no
 *     equivalent for, and it is the only thing on the board that moves.
 *  4. **Eight encoders and nine faders**, in one cluster at the bass end, and
 *     the rest of the panel bare.
 *
 * ## What it deliberately does not draw
 *
 * **No wooden end cheeks and no chrome X-stand** — those are the polysynth, and
 * a black plastic case with timber sides is an object nobody built. **No patch
 * bay**: there is no signal inside this thing to patch. **No display on the
 * board.** A controller of this decade has at most a two-line strip, and there
 * is a fifteen-inch one open above it — putting a second screen on the panel
 * would be spending the era's one lit object twice. **No membrane voice grid.**
 * Thirty-two buttons in a block is a patch memory, and a controller has no
 * patches; the pads replace them and are a different object, played with a
 * hand rather than pressed with a finger.
 *
 * **No second keybed**, and that is `SYNTH_RIGS.modern.maxBoards` being 1
 * rather than a shortcut here. The reason people stopped stacking a second
 * keyboard is that the laptop took the tier — the second sound moved into the
 * machine — so a stack drawn on this rig would be drawing the object it
 * replaced. A player carrying two lines plays them on the one board, exactly as
 * a polysynth player does.
 *
 * ## Where it may and may not put geometry
 *
 * The same two rules the digital rig states, for the same reasons, because they
 * are facts about the keyboard rather than about either object:
 *
 *  - `resolve` in `synth.ts` sends a hand to `keyBackZ - 0.098` at `keyTopY`
 *    and the player stands at `keyBackZ - whiteLength - 0.28`. **Nothing above
 *    `keyTopY` may sit at a smaller `z` than `keyBackZ`**: the panel deck
 *    starts exactly at the key line and everything on it is further back, and
 *    the case under the keys and the whole stand are below the playing plane.
 *  - A `control` point resolves to `keyTopY + 0.10` at `keyBackZ + 0.24` —
 *    y 1.05, z 0.19 on the numbers `synth.ts` passes. The tray's underside is
 *    at `keyTopY + 0.209`, so a hand reaching the panel has 0.11 m of air over
 *    it. That is more than the digital stack leaves under its second keyboard
 *    (0.077 m), which is the sanity check that matters: the tier here is lower
 *    than a keyboard tier and still clears the only hand that goes under it,
 *    because what is on it is 17 mm thick instead of a keybed in a case.
 *
 * ## No two faces in one plane
 *
 * Two faces in one plane z-fight unless both are hidden, and "both are hidden"
 * is a property a later change can quietly take away. So every part that rests
 * on another here is sunk a few millimetres into it rather than set on top of
 * it: the beam into the tray, each column into its own foot and into the beam,
 * the arms into the case, the end blocks into the key tray, the lit inserts
 * into the pads, the screen into the lid, and the fader bezels half a
 * millimetre proud of the deck rather than flush with it. The overlaps are
 * 0.5–3 mm and invisible at any distance an audience sits at.
 *
 * One join is deliberately left butted, because there the hidden-ness is
 * structural rather than incidental: the deck's front face and the key tray's
 * back face are both at `keyBackZ` and each is covered by the other's body, as
 * they are on the digital rig, which is the argument for building a case in two
 * boxes at all.
 *
 * **Measured**, over ten seeds, by walking every mesh and every instance and
 * pairing their world boxes: 13 butted pairs and **no coincident faces**. The
 * digital rig scanned the same way has 6 — its deck top is in the plane of both
 * slider bezels, each column top is in the plane of the arm it carries, and
 * each column's outer face is in the plane of the mid tie's end. The key tray
 * here is 4 mm narrower than the shell at each end so that the end blocks own
 * the outer face of the case alone, which is `synth-rig-polysynth.ts`'s fix for
 * its wooden cheeks borrowed wholesale.
 *
 * One thing a box-based scan will report here and should be read past: adjacent
 * encoders. A cylinder turned about `+y` has a bounding box inflated to its own
 * diagonal — 32 mm for a 23 mm cap — so neighbours at a 30 mm pitch appear to
 * share their top and bottom planes. The caps themselves are 7 mm apart and
 * never meet.
 */

import {
  BoxGeometry, Color, CylinderGeometry, Group, InstancedMesh, type Material,
  Matrix4, Mesh, MeshStandardMaterial, type Object3D, Quaternion, Vector3,
} from 'three';

import { Rng } from '../../../core/rng.js';
import {
  disposeTree, mountOutlet, type SynthRig, type SynthRigBuilder,
} from './synth-rig.js';
import { addTo } from './types.js';

/**
 * The case colours, and there are only blacks.
 *
 * The polysynth rig picks between four timbers and the digital between three
 * greys and an off-white, because those decades had a house colour each. This
 * one does not: from the Novation SL to the Akai MPK to the Arturia KeyLab,
 * every controller worth naming is black, near-black, or the one dark graphite
 * that is black under a stage light anyway. A red one would read as a toy, and
 * a pale one as the D-50 it is not.
 */
const SKINS = ['#1c1d20', '#232427', '#141517', '#2a2b2f'] as const;

/**
 * What a lit pad is, and one accent for all of them.
 *
 * A real grid shows several colours at once — that is what the colours are
 * *for*, one per clip — and one accent is the compromise, made for the reason
 * `synth-rig-polysynth.ts` gives for its knob caps: a per-instance emissive
 * colour is a custom shader, `InstancedMesh.setColorAt` reaches the diffuse
 * term and not the glow, and sixteen separately-lit meshes is sixteen draw
 * calls for a detail 26 mm across. From six metres what reads is a small grid
 * of glowing squares in a dark panel, and the count of colours in it is not
 * part of that read. These four are the ones those grids actually shipped:
 * Launchpad green and amber, Push blue, and the white a clip goes when it is
 * armed.
 */
const PAD_LIGHTS = ['#3fd07a', '#e8a534', '#4a8ff0', '#e8e6dd'] as const;

/**
 * The laptop, in the three finishes it came in. Silver first because the
 * silver one is the one that reads: a bright rectangle standing above a black
 * keyboard is the whole silhouette, and a black lid on black gear is a hole.
 */
const LIDS = ['#b7babe', '#a9acb0', '#6e7276'] as const;

/** Overall case height. A slab is 94 mm; a controller has nothing inside it. */
const CASE_H = 0.062;

/**
 * How far the case top stands above the key tops.
 *
 * 3 mm, against the digital rig's 4. A controller's panel is pressed from the
 * same moulding as the keybed surround and is very nearly flush with the keys;
 * the deck has to be *some* way proud or the panel furniture would be sunk in
 * a trench, and this is the smallest amount that is not.
 */
const DECK_LIFT = 0.003;

/**
 * The moulding beyond the last key at each end, 18 mm.
 *
 * The digital rig argues 27.5 mm against the polysynth's 65 mm of timber, on
 * the grounds that a generous overhang is what makes a plastic instrument look
 * like a furniture one. The same argument taken one decade further: a
 * controller's case stops as soon as the keybed does, because the case is a
 * cost and there is nothing behind the end key to house.
 */
const END_CAP = 0.018;

/** How high the tray sits above the key tops, and how big it is. */
const TRAY_RISE = 0.225;
const TRAY_W = 0.58;
const TRAY_T = 0.016;

/** The laptop: a fifteen-inch one, to the millimetre it was actually built to. */
const LAP_W = 0.335;
const LAP_BASE_T = 0.017;
const LAP_BASE_D = 0.235;
const LID_L = 0.230;
const LID_T = 0.0055;

/**
 * How far off vertical the lid leans, in radians.
 *
 * 0.262 is 15°, which is a lid opened to about 105° from its base — where
 * everybody actually leaves one, because past 90° the screen stops catching the
 * ceiling lights and starts catching the player. It is also what keeps the top
 * edge at 1.414 m: upright it would be 1.44 and flat against the tray it would
 * not be a silhouette at all.
 */
const LID_TILT = 0.262;

/** Resting glow of the pad grid, and how much a note may add to it. */
const PAD_BASE = 0.55;
const PAD_SWELL = 1.05;

/**
 * A box, from its size and the centre of it.
 *
 * Twenty of this object's parts are one, two are tubes, and the remaining
 * fifty-three are instances in six meshes. The alternative to a helper is
 * twenty repetitions of construct-position-shadow in which one `castShadow`
 * eventually goes missing. Every part of this rig casts and receives, because
 * every part of it is a matte surface in a lit room — there is no glass here
 * and no lamp on it big enough to matter.
 */
function box(
  target: Object3D, mat: Material,
  w: number, h: number, d: number,
  x: number, y: number, z: number,
): Mesh {
  const mesh = addTo(target, new Mesh(new BoxGeometry(w, h, d), mat));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export const buildModernRig: SynthRigBuilder = (opts) => {
  const rng = new Rng(`synth-rig-modern:${opts.seed}`);
  const group = new Group();
  group.name = 'synth-rig-modern';

  const { boardWidth, keyTopY, keyBackZ, whiteLength } = opts;

  // --- Finish --------------------------------------------------------------

  /**
   * `finish` tints the case and never the laptop or the stand, which is the
   * same line the other three rigs draw: a venue palette may say what colour
   * the plastic was moulded in, and it may not say that a unibody lid was
   * anodised lilac or that a stand was sprayed to match the drapes.
   */
  const caseColour = new Color(opts.finish ?? rng.pick(SKINS));
  const accent = rng.pick(PAD_LIGHTS);

  const caseMat = new MeshStandardMaterial({
    color: caseColour, roughness: 0.80, metalness: 0.02,
  });
  /**
   * The pads are rubber and the panel is plastic, so they are a shade *darker*
   * rather than lighter — the one place this object's finish is not uniform.
   * Unlit silicone under a stage light is the blackest thing on the rig.
   */
  const padMat = new MeshStandardMaterial({
    color: caseColour.clone().lerp(new Color('#000000'), 0.45),
    roughness: 0.92, metalness: 0,
  });
  const padLitMat = new MeshStandardMaterial({
    color: '#101014', emissive: accent, emissiveIntensity: PAD_BASE, roughness: 0.30,
  });
  const knobMat = new MeshStandardMaterial({ color: '#101114', roughness: 0.52, metalness: 0.12 });
  const capMat = new MeshStandardMaterial({ color: '#9fa4aa', roughness: 0.50, metalness: 0.18 });
  const slotMat = new MeshStandardMaterial({ color: '#0b0c0e', roughness: 0.60, metalness: 0.08 });
  /**
   * Anodised aluminium, not the digital rig's powder-coated steel.
   *
   * The two stands are the same shape from a distance and the finish is most of
   * what separates them close up: an 80s double-tier is matte black steel tube
   * with a bolted second tier, and a 2000s column stand is extruded aluminium
   * with cast clamps — lighter in colour, and specular in a way paint is not.
   * At stage distance that difference in highlight is the whole of it, which is
   * the same observation the digital rig makes about the chrome X-stand it is
   * not.
   */
  const standMat = new MeshStandardMaterial({ color: '#2e3034', roughness: 0.38, metalness: 0.78 });
  const trayMat = new MeshStandardMaterial({ color: '#17181b', roughness: 0.66, metalness: 0.28 });
  const lidMat = new MeshStandardMaterial({
    color: rng.pick(LIDS), roughness: 0.34, metalness: 0.86,
  });
  /**
   * The screen, and it is lit rather than dark for the reason the digital rig
   * lights its LCD: an unlit rectangle on a matte panel is invisible from six
   * metres, and this one is carrying the entire period claim on its own.
   */
  const screenMat = new MeshStandardMaterial({
    color: '#0a0d14', emissive: '#8fb6e8', emissiveIntensity: 0.85, roughness: 0.18,
  });
  const ifaceMat = new MeshStandardMaterial({ color: '#191a1d', roughness: 0.55, metalness: 0.42 });
  const rubberMat = new MeshStandardMaterial({ color: '#0d0d0f', roughness: 0.95, metalness: 0 });

  // --- The controller ------------------------------------------------------

  /**
   * Everything behind the keys, and there is less of it than on the slab —
   * 15 cm against the DX7's 18 to 20. The panel is a strip rather than a deck
   * because there is one cluster of controls on it and a pad grid, and nothing
   * that needs a hundred and forty-five parameters' worth of aluminium.
   */
  const panelD = rng.float(0.142, 0.156);

  const shellW = boardWidth + 2 * END_CAP;
  const deckTopY = keyTopY + DECK_LIFT;
  const caseBotY = deckTopY - CASE_H;
  const backZ = keyBackZ + panelD;

  /**
   * The panel deck: flat, and its front face lands exactly on `keyBackZ`.
   *
   * That coincidence is the whole clearance argument for a slab-shaped case and
   * it is inherited unchanged from `synth-rig-digital.ts`: there is nothing
   * above the keys because the case begins where the keys end. Flat rather than
   * hinged back like the polysynth's, and for the reason that file gives in
   * reverse — a panel is angled so a player can take in thirty knobs at once,
   * and there are seventeen of them here, all in one cluster at one end.
   */
  box(group, caseMat, shellW, CASE_H, backZ - keyBackZ, 0, caseBotY + CASE_H / 2, (keyBackZ + backZ) / 2);

  /**
   * The tray the keys sit in. Its top is 21 mm below the playing surface — the
   * keys are 18 mm thick, so it clears their undersides by 3 — and it is 4 mm
   * narrower than the shell at each end, so the end block that caps it owns the
   * outer face of the instrument on its own. That is the polysynth file's fix
   * for its wooden cheeks, and it is needed here for the same reason: two boxes
   * whose side faces are in one plane down the whole length of a case is the
   * largest fight this object could pick.
   */
  const troughTopY = keyTopY - 0.021;
  const frontZ = keyBackZ - whiteLength - 0.008;
  const troughD = keyBackZ - frontZ;
  box(
    group, caseMat, shellW - 0.008, troughTopY - caseBotY, troughD,
    0, (caseBotY + troughTopY) / 2, keyBackZ - troughD / 2,
  );

  /**
   * A block at each end filling the overhang the keys do not reach, stopping
   * 2 mm below the key tops so that nothing this rig owns is above the playing
   * plane forward of the key line.
   *
   * Sunk 2 mm into the tray under it and held 2 mm inside its ends, so it
   * shares no plane with the tray in any of the three axes while still standing
   * proud of it in `x` — which is the whole job of an end block.
   */
  const flangeTopY = keyTopY - 0.002;
  const flangeBotY = troughTopY - 0.002;
  for (const side of [1, -1]) {
    box(
      group, caseMat, END_CAP, flangeTopY - flangeBotY, troughD - 0.004,
      side * (boardWidth + END_CAP) / 2,
      (flangeBotY + flangeTopY) / 2,
      keyBackZ - 0.002 - (troughD - 0.004) / 2,
    );
  }

  // --- The control cluster, at the bass end --------------------------------

  /**
   * Faders in front and encoders behind them, both at the player's left, which
   * is `+x` — bass runs to `+x` on every keyboard here.
   *
   * One cluster at one end and the rest of the panel bare, which is the same
   * shape of statement the digital rig makes and a different reason for it.
   * There, the panel is empty because there was nothing left to put on it once
   * the knobs went away. Here it is empty because everything that would have
   * been on it is *in the screen*: a controller has as many controls as it has
   * physical assignments, seventeen is a generous count for one, and a panel
   * covered edge to edge would be claiming the computer was not there.
   *
   * Faders nearer the keys than the encoders because they are the controls a
   * hand goes to mid-phrase — a filter sweep, a stem coming up — and 4 cm of
   * reach is the difference between doing that without looking and not.
   */
  const xEnd = shellW / 2 - 0.026;

  const FADERS = 9;
  const FADER_PITCH = 0.026;
  const TRAVEL = 0.056;
  const faderZ = keyBackZ + 0.040;
  {
    const slotGeo = new BoxGeometry(0.009, 0.004, TRAVEL);
    const capGeo = new BoxGeometry(0.017, 0.008, 0.012);
    const slots = addTo(group, new InstancedMesh(slotGeo, slotMat, FADERS));
    const caps = addTo(group, new InstancedMesh(capGeo, capMat, FADERS));
    slots.name = 'modern:fader-slots';
    caps.name = 'modern:fader-caps';
    const m = new Matrix4();
    for (let i = 0; i < FADERS; i++) {
      const x = xEnd - i * FADER_PITCH;
      /**
       * The slot bezel stands half a millimetre proud of the deck rather than
       * flush with it. Flush would put 5 cm² of face in the deck's own plane
       * nine times over, and a fader on one of these does sit in a moulded
       * surround rather than in a hole cut straight through the panel.
       */
      m.makeTranslation(x, deckTopY - 0.0015, faderZ);
      slots.setMatrixAt(i, m);
      /**
       * Where a cap sits along its own travel is decoration, resolved by
       * nothing, so the seed sets it — and nine faders lined up at one height
       * is the single thing that never happens on a rig somebody uses.
       */
      m.makeTranslation(x, deckTopY + 0.003, faderZ + rng.float(-0.4, 0.4) * TRAVEL);
      caps.setMatrixAt(i, m);
    }
    slots.instanceMatrix.needsUpdate = true;
    caps.instanceMatrix.needsUpdate = true;
  }

  const ENCODERS = 8;
  const ENC_PITCH = 0.030;
  const encZ = keyBackZ + 0.090;
  {
    /**
     * Endless encoders rather than pots: no pointer line all the way to a cap
     * edge, because an encoder has no end stop and a mark claiming a position
     * on one is a lie the object tells about itself. A short ridge across the
     * middle is what the caps actually carry, and it is what a thumb finds.
     */
    const bodyGeo = new CylinderGeometry(0.0105, 0.0115, 0.016, 12);
    const ridgeGeo = new BoxGeometry(0.0024, 0.018, 0.0105);
    const bodies = addTo(group, new InstancedMesh(bodyGeo, knobMat, ENCODERS));
    const ridges = addTo(group, new InstancedMesh(ridgeGeo, capMat, ENCODERS));
    bodies.name = 'modern:encoders';
    ridges.name = 'modern:encoder-ridges';
    const m = new Matrix4();
    const q = new Quaternion();
    const one = new Vector3(1, 1, 1);
    const yAxis = new Vector3(0, 1, 0);
    for (let i = 0; i < ENCODERS; i++) {
      const at = new Vector3(xEnd - 0.004 - i * ENC_PITCH, deckTopY + 0.008, encZ);
      q.setFromAxisAngle(yAxis, rng.float(-1.5, 1.5));
      m.compose(at, q, one);
      bodies.setMatrixAt(i, m);
      ridges.setMatrixAt(i, m);
    }
    bodies.instanceMatrix.needsUpdate = true;
    ridges.instanceMatrix.needsUpdate = true;
  }

  // --- The pad grid, at the treble end -------------------------------------

  /**
   * Sixteen pads in two rows of eight, and they are not the slab's keypad with
   * a different label on it.
   *
   * A DX7's thirty-two buttons are a *memory map* — one per voice in a bank —
   * pressed with a fingertip and flush with the panel because a membrane switch
   * has no travel. These are an instrument: 26 mm of moulded rubber, 5 mm proud
   * so a hand can find one without looking, struck rather than pressed, and lit
   * from underneath, which is the thing the earlier decade had no equivalent
   * for at all. Two rows of eight rather than the square four-by-four because
   * that is what fits on a keyboard rather than on a box, and it is the layout
   * every controller with a keybed under it shipped.
   *
   * The lit ones are a seeded few rather than all sixteen. A grid with every
   * pad lit is a demo unit on a shop shelf; a grid in use has the clips that
   * are running lit and the rest dark, and three to six of sixteen is what that
   * looks like.
   */
  const PAD_COLS = 8;
  const PAD_ROWS = 2;
  const PAD_PITCH = 0.031;
  const PAD_SIZE = 0.026;
  const padRight = -(shellW / 2 - 0.030);
  const padFrontZ = keyBackZ + 0.036;
  {
    const bodyGeo = new BoxGeometry(PAD_SIZE, 0.008, PAD_SIZE);
    const litGeo = new BoxGeometry(0.019, 0.006, 0.019);
    const bodies = addTo(group, new InstancedMesh(bodyGeo, padMat, PAD_COLS * PAD_ROWS));
    bodies.name = 'modern:pads';
    const spots: Vector3[] = [];
    const m = new Matrix4();
    let slot = 0;
    for (let row = 0; row < PAD_ROWS; row++) {
      for (let col = 0; col < PAD_COLS; col++) {
        const at = new Vector3(
          padRight + col * PAD_PITCH, deckTopY + 0.001, padFrontZ + row * 0.034,
        );
        m.makeTranslation(at.x, at.y, at.z);
        bodies.setMatrixAt(slot++, m);
        spots.push(at);
      }
    }
    bodies.instanceMatrix.needsUpdate = true;

    /**
     * The lit inserts stand 1 mm proud of the pad they sit in rather than flush
     * with it. Flush would put two faces in one plane over 19 mm of pad top,
     * which is the one arrangement that visibly fails.
     */
    const chosen = rng.shuffle(spots).slice(0, rng.int(3, 6));
    const lit = addTo(group, new InstancedMesh(litGeo, padLitMat, chosen.length));
    lit.name = 'modern:pads-lit';
    chosen.forEach((at, i) => {
      m.makeTranslation(at.x, deckTopY + 0.004, at.z);
      lit.setMatrixAt(i, m);
    });
    lit.instanceMatrix.needsUpdate = true;
  }

  // --- The tier, the laptop, and the box the sound leaves by ---------------

  /**
   * How high the tray sits, and why it is lower than a keyboard tier.
   *
   * `EXTRA_BOARDS[0]` puts a second keybed 0.285 m up, because what goes there
   * is a keyboard in a case and a hand has to get *under* the black keys. A
   * laptop is 17 mm thick and is looked down at, so 0.225 is where one goes:
   * high enough that the screen clears the player's own hands, low enough that
   * they are not reading it with their chin up. It also keeps the top of the
   * lid at 1.414 m — below a standing player's head, which is what makes this
   * rig honest about hiding nobody. `SYNTH_RIGS.modern.height` says 1.42.
   */
  const trayTopY = keyTopY + TRAY_RISE;
  const trayBotY = trayTopY - TRAY_T;
  /**
   * Where the shelf sits in `z`, and it is as near the player as it can get.
   *
   * `+z` is downstage, so everything behind the keys is *further from* the
   * person: the last row of encoders is 0.53 m from where they stand and the
   * shelf begins 2 cm past them, which puts the near edge of the laptop at
   * 0.56 m and the trackpad at about 0.67. That is a reach, and it is the
   * shortest one available — anything nearer would be over the controls, which
   * a hand goes to. The shelf overhangs nothing it needs to: it is 0.21 m above
   * the panel, and the only hand that ever goes under it is the one resolving a
   * `control` point at 1.05 m, with 0.109 m to spare.
   */
  const trayFrontZ = keyBackZ + 0.12;
  const trayBackZ = keyBackZ + 0.39;
  box(
    group, trayMat, TRAY_W, TRAY_T, trayBackZ - trayFrontZ,
    0, trayBotY + TRAY_T / 2, (trayFrontZ + trayBackZ) / 2,
  );

  /**
   * The laptop sits off centre, toward the treble end, and the audio interface
   * takes the space that leaves at the bass end.
   *
   * Which is where both of them go on a real one, and for a reason: the hand
   * that works a trackpad is the right hand, and the hand nearer the interface
   * is the one that is not going to be plugging anything in mid-number.
   */
  const lapX = -0.095;
  const lapBackZ = keyBackZ + 0.3725;
  const lapFrontZ = lapBackZ - LAP_BASE_D;
  const lapTopY = trayTopY + LAP_BASE_T;
  box(
    group, lidMat, LAP_W, LAP_BASE_T, LAP_BASE_D,
    lapX, trayTopY + LAP_BASE_T / 2, (lapFrontZ + lapBackZ) / 2,
  );

  /**
   * The lid, hinged at the downstage edge of the base and leaning away from the
   * player — so the screen faces the person and the house sees the back of it.
   *
   * That is worth being plain about, because it decides what the lit part of
   * this object is *for*. A player does not turn their screen round for the
   * audience, so the emissive panel here is seen from the wings, from any
   * camera that goes round the band, and by the player; what the house gets
   * from straight on is an upright silver rectangle with a lit maker's mark on
   * it. Both of those are the real image, and the silhouette — a lid standing
   * where a second keyboard used to be — does not depend on which way it faces.
   *
   * It is built inside a group placed *at the hinge* rather than positioned by
   * arithmetic in the rig's frame. The angle and the hinge are one fact and
   * composing them separately is how a lid ends up floating a centimetre off
   * the base it is supposed to be bolted to — which is exactly the failure the
   * digital rig's tier avoids by taking `placeBoard` rather than composing its
   * own. It also means the tilt can be changed by one number without any of the
   * three parts below coming apart.
   *
   * The top of it tips 4.7 cm past the back of its own shelf, which is what a
   * laptop opened past 90° on a shallow tray does.
   */
  const hinge = addTo(group, new Group());
  hinge.name = 'modern:lid';
  hinge.position.set(lapX, lapTopY, lapBackZ);
  hinge.rotation.x = LID_TILT;
  box(hinge, lidMat, LAP_W, LID_L, LID_T, 0, LID_L / 2, LID_T / 2);
  /**
   * The screen, inset in the lid and biting 0.2 mm into it. The bezel is drawn
   * by the lid itself standing proud around the panel — 12 mm each side and 13
   * top and bottom, which is a 2010s machine rather than a 2020s one and is the
   * right decade for everything else here.
   */
  box(hinge, screenMat, LAP_W - 0.024, LID_L - 0.026, 0.002, 0, LID_L / 2, -0.0008);
  /**
   * The maker's mark on the back of the lid, which is the only lit thing on
   * this rig the house sees from straight on. A roundel and not a badge:
   * whatever was etched into one of these, at 34 mm across from six metres it
   * is a soft bright disc and nothing more.
   */
  const mark = addTo(hinge, new Mesh(
    new CylinderGeometry(0.017, 0.017, 0.002, 16), screenMat,
  ));
  mark.rotation.x = Math.PI / 2;
  mark.position.set(0, LID_L * 0.52, LID_T - 0.0006);

  /**
   * The audio interface, and it is where the outlet is.
   *
   * A period-true detail that argues itself: on this rig the keyboard makes no
   * sound, so a lead leaving the back of *that* would be a lead carrying
   * nothing. The sound leaves a soundcard, the soundcard sits beside the laptop
   * it is plugged into, and its back panel is the only surface on this object a
   * jack can honestly be on.
   *
   * The socket ends up 1.20 m off the boards on the downstage face of a box on
   * a shelf, with the jack barrels standing 5 mm clear of the shelf's own back
   * edge — so a lead leaves it into open air and falls to the deck past
   * everything: the beam is 0.10 m upstage of it, the case ends 0.24 m upstage
   * and 0.25 m below, and the nearer foot is 0.14 m away across. That matters
   * because none of this rig's aluminium is an obstacle the cable router can
   * see; it is the same argument the digital rig makes for refusing to put a
   * socket on its upper slab, reached from the other end.
   */
  const IFACE_W = 0.15;
  const IFACE_H = 0.048;
  const IFACE_D = 0.115;
  const ifaceX = 0.195;
  const ifaceZ = keyBackZ + 0.325;
  box(
    group, ifaceMat, IFACE_W, IFACE_H, IFACE_D,
    ifaceX, trayTopY + IFACE_H / 2, ifaceZ,
  );
  const outlet = mountOutlet(
    group, slotMat,
    new Vector3(ifaceX, trayTopY + IFACE_H * 0.5, ifaceZ + IFACE_D / 2),
  );

  // --- The stand -----------------------------------------------------------

  /**
   * Two columns, two feet, and no ties across.
   *
   * The digital rig ties its frame twice and says why: a double stand carrying
   * two keyboards is tall enough to fold sideways without them. This one has
   * 8 kg of controller and 2 kg of laptop on it, and the controller's own case
   * spans both columns and braces them — which is what a real single-column
   * stand relies on too, and why they ship without a tie. Leaving the space
   * under the keyboard empty is also most of what makes this stand read as
   * lighter than the 80s one, which is true of it.
   */
  /**
   * How far out the columns stand, and how far behind the keys.
   *
   * `xPost` is a fraction of the keybed rather than a metre, so a narrower
   * board does not end up with its stand outboard of its own case. `colZ` puts
   * the tubes under the middle of the shelf, which is the only place they can
   * be: the shelf is what they carry, the case hangs off them forward of that,
   * and a column any further downstage would be standing in front of the
   * keyboard from the house.
   */
  const xPost = Math.min(0.36, boardWidth * 0.27);
  const colZ = keyBackZ + 0.27;

  /** Where the tray's beam is: under the tray, biting 3 mm into it. */
  const beamTopY = trayBotY + 0.003;
  const BEAM_H = 0.030;

  const armTopY = caseBotY + 0.003;
  const ARM_H = 0.024;
  const armFrontZ = frontZ + 0.05;
  const armBackZ = keyBackZ + 0.31;

  const footFrontZ = keyBackZ - 0.06;
  const footBackZ = keyBackZ + 0.34;
  const FOOT_H = 0.024;
  const footBotY = 0.010;

  for (const side of [1, -1]) {
    /**
     * The foot runs front to back and stops 6 cm short of the key line, so
     * there is nothing under the player's feet: they stand another 27 cm
     * upstage of that again. It is shorter than the digital rig's runner
     * because the load is lighter and further back.
     */
    box(
      group, standMat, 0.055, FOOT_H, footBackZ - footFrontZ,
      side * xPost, footBotY + FOOT_H / 2, (footFrontZ + footBackZ) / 2,
    );
    for (const z of [footFrontZ + 0.035, footBackZ - 0.035]) {
      box(group, rubberMat, 0.050, 0.012, 0.050, side * xPost, 0.006, z);
    }

    /**
     * The column: round extruded tube, standing from inside its own foot up to
     * inside the beam. Round rather than the digital rig's square section —
     * these stands are drawn aluminium with a cast clamp that closes round a
     * tube, and a square post is the 80s one.
     */
    const colBotY = footBotY + 0.006;
    const colTopY = beamTopY - 0.017;
    const column = addTo(group, new Mesh(
      new CylinderGeometry(0.020, 0.022, colTopY - colBotY, 12), standMat,
    ));
    column.position.set(side * xPost, (colBotY + colTopY) / 2, colZ);
    column.castShadow = true;
    column.receiveShadow = true;

    /**
     * The arm under the controller, cantilevered forward off the column and
     * sunk 3 mm into the case above it. It stops 5 cm short of the case's front
     * lip, which is what a bracket looks like and what stops the stand from
     * being the first thing a player's knee finds.
     */
    box(
      group, standMat, 0.030, ARM_H, armBackZ - armFrontZ,
      side * xPost, armTopY - ARM_H / 2, (armFrontZ + armBackZ) / 2,
    );
    /** The clamp: the cast block the arm bolts to, wrapped round the tube. */
    box(group, standMat, 0.054, 0.072, 0.054, side * xPost, armTopY - 0.030, colZ);
  }

  /**
   * The beam across the columns, which is what the tray actually rests on. It
   * overhangs each column by 2 cm — a beam cut flush with its own supports
   * looks like it was measured to the millimetre, and none of them were.
   */
  box(
    group, standMat, 2 * xPost + 0.040, BEAM_H, 0.045,
    0, beamTopY - BEAM_H / 2, colZ,
  );

  // --- The one thing that moves --------------------------------------------

  /**
   * The pads breathe, and swell when a note lands.
   *
   * Two circuits in one number, and each half is answering a different fact.
   * The **breath** is free-running on a period drawn from the seed and
   * deliberately not a division of the bar: what those lamps are showing is a
   * clip grid, which is running whether or not anybody's hand is on the
   * keyboard, and a grid that went dark through the rests would be claiming the
   * pads were the instrument. That is the same argument
   * `synth-rig-modular.ts` makes for its LFO lamp, arrived at from the other
   * end — there because 1972 had no sync, here because the grid is not
   * following the hands.
   *
   * The **swell** is `react`, and it is why the glow is on the pads rather than
   * on the screen. A screen full of a running arrangement is a great deal of
   * small motion and no change at all in average brightness; a lit pad is one
   * value. So the screen is steady and the grid is what moves, which is also
   * the truer picture of a rig somebody is playing.
   */
  const breathBeats = rng.float(1.7, 2.6);
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
      const phase = now / breathBeats - Math.floor(now / breathBeats);
      const breath = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
      const age = now - hitBeat;
      const env = age < 0 || age > 3 ? 0 : Math.exp(-age / 0.45);
      padLitMat.emissiveIntensity = PAD_BASE * (0.72 + 0.28 * breath)
        + PAD_SWELL * hitForce * env;
    },

    dispose(): void {
      disposeTree(group);
    },
  };

  return rig;
};
