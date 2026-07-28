/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The 1984–90 synthesiser — the DX7, the D-50, the M1.
 *
 * ## The knobs went away
 *
 * Everything about this object follows from one commercial fact: FM and early
 * sample-playback instruments were programmed through a two-line display and a
 * membrane keypad, so there was nothing left on the outside to turn. A DX7 has
 * six operators with about a hundred and forty-five parameters behind them, and
 * a panel with a knob per parameter would have been a metre of aluminium nobody
 * could afford to build in 1983. Yamaha shipped a sheet of printed plastic
 * instead, and the whole decade looked like that afterwards.
 *
 * So the visual argument here runs the opposite way from the other two rigs.
 * The modular rig is legible because it is *busy*; the polysynth because it has
 * one honest row of controls in a wooden frame. This one is legible because it
 * is **empty**, and its emptiness is the period. The single strongest temptation
 * while writing it is to put something in the blank half of the panel, and every
 * such thing turns it back into a 1978 instrument wearing the wrong badge. The
 * treble half of the deck below is bare on purpose. Leave it bare.
 *
 * ## What it is, in order of how much of the read each part carries
 *
 *  1. **The stack.** Two slabs on a double-tier stand, the upper one tilted back
 *     toward the player. Nothing else in this file changes the silhouette as
 *     much: one keyboard on a stand is a keyboard in any decade, and two of them
 *     stacked is 1987 from the back of the room.
 *  2. **The thinness.** A DX7 is 100 × 33.5 × 9.4 cm. Ninety-four millimetres —
 *     it is a clipboard with keys on it, and beside a Minimoog's hinged panel it
 *     looks like it is missing a piece. Getting that proportion wrong costs more
 *     than any amount of detail on the panel.
 *  3. **The one lit thing.** A small backlit LCD. Everything else on the
 *     instrument is dead matte plastic in one colour.
 *  4. **The keypad, the two sliders, two switches.** That is the entire physical
 *     control surface, and listing it takes one sentence, which is the point.
 *
 * ## What it deliberately does not draw
 *
 * No pitch and mod wheels. A DX7 has both, but they sit in the keybed moulding
 * at the bass end rather than on the panel, which puts them on the *keyboard's*
 * side of the seam described in `synth-rig.ts` — and a rig that guessed wrong
 * about that would put a second pair on an instrument that already had one.
 * No patch cables, no jack field, no accent colour: an instrument you program
 * through a menu has nothing to plug into itself.
 *
 * ## Where it may and may not put geometry
 *
 * `resolve` in `synth.ts` sends a hand to `keyBackZ - 0.098` at `keyTopY`, and
 * the player stands at `keyBackZ - whiteLength - 0.28` facing `+z`. Two rules
 * follow, and both are load-bearing rather than stylistic:
 *
 *  - Nothing above `keyTopY` may sit at a smaller `z` than `keyBackZ`. The panel
 *    deck starts exactly at `keyBackZ` and everything on it is further back; the
 *    case under the keys and the whole stand are below the playing plane.
 *  - The upper tier clears the hands by construction rather than by arithmetic —
 *    see `TIER_CLEAR` below.
 */

import {
  BoxGeometry, Color, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial,
  Quaternion, Vector3,
} from 'three';

import { Rng } from '../../../core/rng.js';
import { disposeTree, type SynthRig, type SynthRigBuilder } from './synth-rig.js';
import { addTo } from './types.js';

const BLACK = [false, true, false, true, false, false, true, false, true, false, true, false];

/**
 * The four instruments this rig is a composite of, reduced to the only thing
 * about their finish that survives to the back of a room: the colour of the
 * moulding. Three greys and one off-white, because the D-50 is the reason the
 * decade is not remembered as uniformly black.
 */
const SKINS = ['#2b2c30', '#26272b', '#3b3c40', '#c6c2b6'] as const;

/** Green electroluminescent backlights, which is what the era's screens were. */
const BACKLIGHTS = ['#7ee0a4', '#8ee3c4', '#a6e58a'] as const;

/** Overall case height. A DX7 is 94 mm tall including its feet. */
const CASE_H = 0.092;

/**
 * How far the underside of the upper tier sits above the lower keyboard's key
 * tops, in metres.
 *
 * A hand playing the lower board keeps its wrist around 8 cm above the key
 * surface and the knuckles rise another 4 or 5 on a lifted attack, so about
 * 13 cm is the tallest a hand ever gets. Real double stands adjust between
 * roughly 0.25 and 0.35 m and players set them near the middle of that, which
 * is both the honest number and about twice the clearance a hand needs.
 *
 * It is a *guaranteed* minimum rather than a hopeful one: every child of the
 * tier group is built at local `y >= 0` and local `z >= 0`, and the group is
 * rotated about its own front-bottom edge by `-TIER_TILT`. Rotating a point
 * with both coordinates non-negative about `x` by a negative angle maps
 * `y' = y·cos + z·sin`, which is non-negative too — so the lowest point of the
 * whole assembly, tilt and all, is exactly the group origin. Tilting the second
 * keyboard can never drop it onto the player's hands.
 */
const TIER_CLEAR_MIN = 0.300;
const TIER_CLEAR_MAX = 0.330;

/** Depth of the steel arms the upper keyboard rests on, top to bottom. */
const ARM_H = 0.026;

/** Resting glow of the LCD backlight, and how much a note may add to it. */
const LCD_BASE = 0.62;
const LCD_SWELL = 0.18;

export const buildDigitalRig: SynthRigBuilder = (opts) => {
  const rng = new Rng(`synth-rig-digital:${opts.seed}`);
  const group = new Group();
  group.name = 'synth-rig-digital';

  const { boardWidth, keyTopY, keyBackZ, whiteLength } = opts;

  // --- Finish --------------------------------------------------------------

  const caseColour = new Color(opts.finish ?? rng.pick(SKINS));
  /**
   * The buttons are a shade off the case and never a contrasting colour. A
   * membrane panel is one moulding with a printed sheet dropped into it, so the
   * switches can only be lighter than what surrounds them — or, on the pale
   * D-50, darker. A red or amber cap here would read as a 1970s panel, which is
   * exactly the mistake this rig exists to stop making.
   */
  const luma = caseColour.r * 0.299 + caseColour.g * 0.587 + caseColour.b * 0.114;
  const padColour = caseColour.clone().lerp(new Color(luma > 0.5 ? '#111113' : '#ffffff'), 0.20);

  const caseMat = new MeshStandardMaterial({ color: caseColour, roughness: 0.74, metalness: 0.03 });
  const padMat = new MeshStandardMaterial({ color: padColour, roughness: 0.88, metalness: 0 });
  const bezelMat = new MeshStandardMaterial({ color: '#101114', roughness: 0.30, metalness: 0.10 });
  const lcdMat = new MeshStandardMaterial({
    color: '#08170f', emissive: rng.pick(BACKLIGHTS), emissiveIntensity: LCD_BASE, roughness: 0.22,
  });
  const capMat = new MeshStandardMaterial({ color: '#9aa0a6', roughness: 0.58, metalness: 0.06 });
  /**
   * Black powder-coated square tube, not the chrome of the X-stand under a
   * Prophet. The 70s stand is a shiny folding X; the 80s stand is matte black
   * steel with a bolted second tier, and at stage distance the difference in
   * specular highlight is most of what dates the furniture.
   */
  const steelMat = new MeshStandardMaterial({ color: '#17181b', roughness: 0.52, metalness: 0.62 });
  const rubberMat = new MeshStandardMaterial({ color: '#0e0e10', roughness: 0.95, metalness: 0 });
  const ivoryMat = new MeshStandardMaterial({ color: '#e9e6dc', roughness: 0.46, metalness: 0 });
  const ebonyMat = new MeshStandardMaterial({ color: '#141418', roughness: 0.40, metalness: 0 });

  // --- The lower slab ------------------------------------------------------

  /**
   * End caps of 2.75 cm rather than the polysynth's wooden cheeks. There is
   * almost nothing either side of a DX7's keybed — the moulding wraps it and
   * stops — and a generous overhang is the first thing that makes a plastic
   * instrument look like a furniture one.
   */
  const shellW = boardWidth + 0.055;
  /** Everything behind the keys, and there is startlingly little of it. */
  const panelDepth = rng.float(0.175, 0.198);

  const deckTopY = keyTopY + 0.004;
  const caseBotY = deckTopY - CASE_H;
  const frontZ = keyBackZ - whiteLength - 0.012;

  /**
   * The panel deck: flat, in the same plane as the top of the case, and not
   * tilted. This is the one place the file departs from `synth.ts`, whose panel
   * is hinged back at 0.55 rad like a Minimoog's. A sloped panel exists so a
   * player can see thirty knobs at once; when there are no knobs there is
   * nothing to angle, and every instrument of this decade is flat on top. Its
   * front face lands exactly on `keyBackZ`, which is the whole of the clearance
   * argument for the lower slab: there is nothing above the keys because the
   * case begins where they end.
   */
  const deck = addTo(group, new Mesh(new BoxGeometry(shellW, CASE_H, panelDepth), caseMat));
  deck.position.set(0, caseBotY + CASE_H / 2, keyBackZ + panelDepth / 2);
  deck.castShadow = true;
  deck.receiveShadow = true;

  /**
   * The tray the keys sit in, running forward under them. Its top is 21 mm
   * below the key surface — the keys are 18 mm thick, so it clears their
   * undersides by 3 mm and never crosses the playing plane.
   */
  const troughTopY = keyTopY - 0.021;
  const troughD = keyBackZ - frontZ;
  const trough = addTo(group, new Mesh(new BoxGeometry(shellW, troughTopY - caseBotY, troughD), caseMat));
  trough.position.set(0, (caseBotY + troughTopY) / 2, keyBackZ - troughD / 2);
  trough.castShadow = true;
  trough.receiveShadow = true;

  /**
   * A flange at each end of the keybed, filling the overhang the keys do not
   * reach. It stops 2 mm *below* the key tops: a real end cap stands slightly
   * proud, but nothing this rig owns is allowed above the playing plane forward
   * of `keyBackZ`, and two millimetres of moulding is not worth arguing about.
   */
  const flangeGeo = new BoxGeometry((shellW - boardWidth) / 2, keyTopY - 0.002 - troughTopY, troughD);
  for (const side of [1, -1]) {
    const flange = addTo(group, new Mesh(flangeGeo, caseMat));
    flange.position.set(
      side * (boardWidth + (shellW - boardWidth) / 2) / 2,
      (troughTopY + keyTopY - 0.002) / 2,
      keyBackZ - troughD / 2,
    );
    flange.castShadow = true;
  }

  // --- Membrane keypad, LCD, sliders ---------------------------------------

  /**
   * The controls all live at the bass end, which is the player's left, exactly
   * where a DX7 puts them. Laying them out inward from that end rather than
   * about the centre is what leaves the rest of the deck blank.
   */
  const xEnd = shellW / 2 - 0.022;
  const lcdX = xEnd - 0.104;
  const padRightX = lcdX - 0.058;

  /**
   * Thirty-two buttons, in two rows of sixteen, because a DX7 holds thirty-two
   * voices in a bank and there is one button per voice — the grid is a memory
   * map before it is a keypad, which is why it is a square block rather than a
   * scattering. They are 1.6 mm thick and half-sunk: a membrane switch has no
   * travel and no bevel, and giving them relief turns them into the rubber pads
   * of a decade later.
   */
  const PAD_COLS = 16;
  const PAD_ROWS = 2;
  const SWITCHES = 4;
  const padGeo = new BoxGeometry(0.0165, 0.0016, 0.0115);
  // Shrink the pitch rather than run off the end of a narrow board.
  const padPitch = Math.min(0.0215, (padRightX + shellW / 2 - 0.030) / (PAD_COLS - 1));
  const pads = addTo(group, new InstancedMesh(padGeo, padMat, PAD_COLS * PAD_ROWS + SWITCHES));
  pads.name = 'digital:keypad';
  {
    const m = new Matrix4();
    const q = new Quaternion();
    const one = new Vector3(1, 1, 1);
    let slot = 0;
    for (let row = 0; row < PAD_ROWS; row++) {
      for (let col = 0; col < PAD_COLS; col++) {
        m.compose(
          new Vector3(padRightX - col * padPitch, deckTopY, keyBackZ + 0.031 + row * 0.037),
          q, one,
        );
        pads.setMatrixAt(slot++, m);
      }
    }
    /**
     * Four function switches behind the grid, wider than a voice button because
     * they carry a word rather than a number. Same geometry, stretched on the
     * instance matrix — a second mesh for four boxes is a draw call spent on
     * nothing.
     */
    for (let i = 0; i < SWITCHES; i++) {
      m.compose(
        new Vector3(padRightX - i * 0.030, deckTopY, keyBackZ + 0.106),
        q, new Vector3(1.5, 1, 1.15),
      );
      pads.setMatrixAt(slot++, m);
    }
    pads.instanceMatrix.needsUpdate = true;
  }

  /**
   * Two lines of sixteen characters, in a glossy black bezel — the only lit
   * thing on the instrument and the only way to know what it is doing. The
   * DX7's own display was a reflective LCD you had to find an angle for; the
   * backlight arrived with the D-50 in 1987. Drawing it lit is the composite
   * choosing the later half of its own range, and it is worth it: an unlit
   * rectangle on a matte panel is invisible from six metres and this object has
   * nothing else to look at.
   */
  const lcdZ = keyBackZ + 0.142;
  const bezel = addTo(group, new Mesh(new BoxGeometry(0.084, 0.010, 0.046), bezelMat));
  bezel.position.set(lcdX, deckTopY - 0.001, lcdZ);
  const screen = addTo(group, new Mesh(new BoxGeometry(0.064, 0.002, 0.027), lcdMat));
  screen.position.set(lcdX, deckTopY + 0.0045, lcdZ);

  /**
   * Data entry and volume: two short front-to-back faders at the very end of
   * the panel. On a DX7 the data slider is how every one of those hundred and
   * forty-five parameters gets its value, so the instrument's entire editing
   * interface is one 6 cm slot. Their positions are cosmetic and never
   * resolved, so the seed sets them.
   */
  const slotGeo = new BoxGeometry(0.0085, 0.004, 0.062);
  const sliderCapGeo = new BoxGeometry(0.016, 0.009, 0.013);
  const slots = addTo(group, new InstancedMesh(slotGeo, bezelMat, 2));
  const sliderCaps = addTo(group, new InstancedMesh(sliderCapGeo, capMat, 2));
  {
    const m = new Matrix4();
    for (let i = 0; i < 2; i++) {
      const x = xEnd - 0.010 - i * 0.024;
      m.makeTranslation(x, deckTopY - 0.002, keyBackZ + 0.062);
      slots.setMatrixAt(i, m);
      m.makeTranslation(x, deckTopY + 0.004, keyBackZ + 0.062 + rng.float(-0.024, 0.024));
      sliderCaps.setMatrixAt(i, m);
    }
    slots.instanceMatrix.needsUpdate = true;
    sliderCaps.instanceMatrix.needsUpdate = true;
  }

  // --- The upper tier ------------------------------------------------------

  const TIER_CLEAR = rng.float(TIER_CLEAR_MIN, TIER_CLEAR_MAX);
  const TIER_TILT = rng.float(0.19, 0.25);
  /**
   * The second keyboard starts just behind the lower one's display, which is
   * exactly how far back a player pushes it: far enough to read the screen, and
   * not one centimetre further, because everything past that is reach.
   */
  const tierSetback = panelDepth + 0.012;

  const tier = addTo(group, new Group());
  tier.name = 'digital:upper-tier';
  tier.position.set(0, keyTopY + TIER_CLEAR, keyBackZ + tierSetback);
  tier.rotation.x = -TIER_TILT;

  /**
   * A 61-note synth on top of a longer board underneath — the stack is almost
   * never two of the same instrument, because the point of the lower one is
   * range and the point of the upper one is a second sound within arm's reach.
   */
  const upBoardW = boardWidth * rng.float(0.68, 0.74);
  const upShellW = upBoardW + 0.05;
  const upKeyL = whiteLength * 0.88;
  const upPanelD = 0.155;
  const upCaseH = 0.086;
  const upDepth = upKeyL + upPanelD + 0.012;
  /** Local `y` of the upper instrument's own underside — it rides on the arms. */
  const upY0 = ARM_H;
  const upBodyH = upCaseH - 0.014;

  const upBody = addTo(tier, new Mesh(new BoxGeometry(upShellW, upBodyH, upDepth), caseMat));
  upBody.position.set(0, upY0 + upBodyH / 2, upDepth / 2);
  upBody.castShadow = true;
  const upDeck = addTo(tier, new Mesh(new BoxGeometry(upShellW, 0.014, upPanelD), caseMat));
  upDeck.position.set(0, upY0 + upCaseH - 0.007, upKeyL + 0.012 + upPanelD / 2);
  upDeck.castShadow = true;

  /**
   * Keys on it, and they are not optional. A second slab with a blank front
   * edge reads as a shelf with a box on it; the row of white and black is the
   * whole reason the silhouette says "two synthesisers" rather than "one
   * synthesiser and some staging". Nothing resolves against them — `synth.ts`
   * owns every playable key on this model — so they are pure geometry laid out
   * by the same C-major arithmetic every keyboard here uses.
   */
  const kw = upBoardW / 36;
  const upWhiteXs: number[] = [];
  const upBlackXs: number[] = [];
  {
    let wi = -1;
    for (let midi = 36; midi <= 96; midi++) {
      if (BLACK[midi % 12]!) upBlackXs.push(upBoardW / 2 - (wi + 1) * kw);
      else { wi++; upWhiteXs.push(upBoardW / 2 - (wi + 0.5) * kw); }
    }
  }
  const upBlackL = upKeyL * 0.63;
  const upWhiteMesh = addTo(tier, new InstancedMesh(
    new BoxGeometry(kw * 0.94, 0.014, upKeyL), ivoryMat, upWhiteXs.length));
  const upBlackMesh = addTo(tier, new InstancedMesh(
    new BoxGeometry(kw * 0.47, 0.010, upBlackL), ebonyMat, upBlackXs.length));
  upWhiteMesh.receiveShadow = true;
  upBlackMesh.castShadow = true;
  {
    const m = new Matrix4();
    upWhiteXs.forEach((x, i) => {
      m.makeTranslation(x, upY0 + upCaseH - 0.007, 0.012 + upKeyL / 2);
      upWhiteMesh.setMatrixAt(i, m);
    });
    upBlackXs.forEach((x, i) => {
      m.makeTranslation(x, upY0 + upCaseH - 0.002, 0.012 + upKeyL - upBlackL / 2);
      upBlackMesh.setMatrixAt(i, m);
    });
    upWhiteMesh.instanceMatrix.needsUpdate = true;
    upBlackMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Sixteen buttons and a screen on the upper unit, sharing the lower one's
   * geometry and materials. Half the grid rather than a full one because the
   * second instrument is usually the smaller model, and one shared material
   * means both displays glow as one colour — two panels flickering out of phase
   * is a detail nobody buys at six metres.
   */
  const upPadRight = upShellW / 2 - 0.128;
  const upPads = addTo(tier, new InstancedMesh(padGeo, padMat, 16));
  {
    const m = new Matrix4();
    for (let i = 0; i < 16; i++) {
      m.makeTranslation(
        upPadRight - (i % 8) * padPitch,
        upY0 + upCaseH,
        upKeyL + 0.042 + Math.floor(i / 8) * 0.035,
      );
      upPads.setMatrixAt(i, m);
    }
    upPads.instanceMatrix.needsUpdate = true;
  }
  const upBezel = addTo(tier, new Mesh(new BoxGeometry(0.070, 0.010, 0.038), bezelMat));
  upBezel.position.set(upShellW / 2 - 0.062, upY0 + upCaseH - 0.001, upKeyL + 0.062);
  const upScreen = addTo(tier, new Mesh(new BoxGeometry(0.052, 0.002, 0.022), lcdMat));
  upScreen.position.set(upShellW / 2 - 0.062, upY0 + upCaseH + 0.0045, upKeyL + 0.062);

  /**
   * The arms the upper keyboard is bolted to. They live *inside* the tier group
   * so they tilt with it — an arm that stayed level under a tilted keyboard
   * would touch it at one edge and float at the other — and they occupy local
   * `y` from 0 to `ARM_H`, which is what makes the group origin the lowest
   * point of the whole assembly and `TIER_CLEAR` an exact figure.
   */
  const xPost = Math.min(0.40, boardWidth * 0.28);
  const upArmGeo = new BoxGeometry(0.034, ARM_H, upDepth - 0.02);
  for (const side of [1, -1]) {
    const arm = addTo(tier, new Mesh(upArmGeo, steelMat));
    arm.position.set(side * xPost, ARM_H / 2, 0.008 + (upDepth - 0.02) / 2);
    arm.castShadow = true;
  }

  // --- The stand -----------------------------------------------------------

  /**
   * A double-tier frame: a runner on the floor each side, a column standing on
   * it, and two pairs of arms cantilevered forward off the column. The columns
   * sit 27 cm *behind* the keys and the runners stop short of the key fronts,
   * so the player has clear floor from `keyBackZ - whiteLength - 0.012`
   * forward — the front lip of the case is the furthest anything reaches toward
   * them, and their standing position is another 27 cm beyond that.
   */
  const colZ = keyBackZ + 0.27;
  const runnerFront = keyBackZ - whiteLength + 0.010;
  const runnerBack = keyBackZ + 0.42;
  const runnerD = runnerBack - runnerFront;

  const runnerGeo = new BoxGeometry(0.038, 0.030, runnerD);
  /**
   * The column stops exactly where the tilted upper arm passes over it. The arm
   * rises `sin(tilt)` per metre from the tier's front edge, so the meeting
   * height is that rise over the distance from the front edge to the column —
   * which is a bracket you would actually bolt rather than a number that looks
   * about right.
   */
  const colTopY = keyTopY + TIER_CLEAR + Math.sin(TIER_TILT) * (colZ - (keyBackZ + tierSetback));
  const colBotY = 0.044;
  const colGeo = new BoxGeometry(0.040, colTopY - colBotY, 0.040);

  const lowArmFront = keyBackZ - whiteLength + 0.040;
  const lowArmBack = keyBackZ + 0.300;
  const lowArmGeo = new BoxGeometry(0.034, 0.026, lowArmBack - lowArmFront);

  for (const side of [1, -1]) {
    const runner = addTo(group, new Mesh(runnerGeo, steelMat));
    runner.position.set(side * xPost, 0.029, (runnerFront + runnerBack) / 2);
    runner.castShadow = true;

    const column = addTo(group, new Mesh(colGeo, steelMat));
    column.position.set(side * xPost, (colBotY + colTopY) / 2, colZ);
    column.castShadow = true;

    const arm = addTo(group, new Mesh(lowArmGeo, steelMat));
    arm.position.set(side * xPost, caseBotY - 0.013, (lowArmFront + lowArmBack) / 2);
    arm.castShadow = true;
  }

  // Two ties across, one at the floor and one mid-column, which is what stops a
  // frame this tall from folding sideways under a keyboard on top of it.
  const floorTie = addTo(group, new Mesh(new BoxGeometry(2 * xPost, 0.026, 0.032), steelMat));
  floorTie.position.set(0, 0.028, keyBackZ + 0.380);
  const midTie = addTo(group, new Mesh(new BoxGeometry(2 * xPost + 0.040, 0.028, 0.030), steelMat));
  midTie.position.set(0, keyTopY - 0.330, colZ);

  const footGeo = new BoxGeometry(0.044, 0.014, 0.050);
  const feet = addTo(group, new InstancedMesh(footGeo, rubberMat, 4));
  {
    const m = new Matrix4();
    let slot = 0;
    for (const side of [1, -1]) {
      for (const z of [runnerFront + 0.030, runnerBack - 0.030]) {
        m.makeTranslation(side * xPost, 0.007, z);
        feet.setMatrixAt(slot++, m);
      }
    }
    feet.instanceMatrix.needsUpdate = true;
  }

  // --- The one thing that moves --------------------------------------------

  /**
   * The display flutters as it is played, and only just.
   *
   * What is actually happening on a real one is that the characters redraw —
   * the voice name changes, the sequencer position counts up — and at stage
   * distance a two-line screen redrawing is a small change in average
   * brightness, not a pulse. So the swell is 18/62 of the resting level, on a
   * slow decay, and there is no idle animation at all: an LCD that breathed
   * while nothing was playing would be a lamp, and this era's panel is not a
   * light show. The rest of the instrument is inert plastic, correctly.
   */
  let flickerBeat = -1e9;
  let flickerForce = 0;

  const rig: SynthRig = {
    group,

    react(force: number, now: number): void {
      flickerBeat = now;
      flickerForce = force < 0 ? 0 : force > 1 ? 1 : force;
    },

    update(now: number): void {
      const age = now - flickerBeat;
      const env = age < 0 || age > 3 ? 0 : Math.exp(-age / 0.55);
      lcdMat.emissiveIntensity = LCD_BASE + LCD_SWELL * flickerForce * env;
    },

    dispose(): void {
      disposeTree(group);
    },
  };

  return rig;
};
