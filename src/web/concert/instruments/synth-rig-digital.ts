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
 *  1. **The stack.** Two slabs on a double-tier stand. Nothing else in this file
 *     changes the silhouette as much: one keyboard on a stand is a keyboard in
 *     any decade, and two of them stacked is 1987 from the back of the room.
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
 * ## The second slab is somebody's instrument
 *
 * It used to be scenery: a keybed of white and black boxes with a comment
 * saying nothing resolved against them. That was the wrong half of the object
 * to fake. A player does not buy a second keyboard for the silhouette, they buy
 * it for a second sound within arm's reach, and the whole read of the stack is
 * that the hands can go up to it.
 *
 * So the upper keyboard is a **board in the layout table** — `boardsFor` in
 * `concert/instruments.ts`, `SYNTH_RIGS.digital.maxBoards` — `synth.ts` puts
 * real keys on it exactly as it does for board 0, and this file builds the case
 * *around* them. Three consequences, all of them the point rather than a cost:
 *
 *  - **The height and the setback are not this file's to choose.** The tier is
 *    where `EXTRA_BOARDS[0]` says, because the choreographer budgets a hand's
 *    travel against that same table and the two must not disagree. What this
 *    file owns is the shell that goes round it.
 *  - **It is level.** It used to tilt back a fifth of a radian, which is a nice
 *    detail on a box of moulding and a lie under keys somebody plays: the keys
 *    come from the board's own frame, which has a yaw and no pitch.
 *  - **A stack of one is a slab on a stand.** With no upper board there is no
 *    upper tier and the columns stop at the arms under the one keyboard —
 *    rather than a second keybed nobody can touch, which is where this started.
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
 *  - **The rule applies inside the tier too**, and unchanged, because the tier's
 *    contents are built in the upper board's own frame with the same `keyTopY`
 *    and `keyBackZ` the lower slab uses — one piece of arithmetic, not a second
 *    argument. The upper case begins where its own keys end, and the board sits
 *    0.24 m further from the player, which puts even the front lip of that case
 *    8 cm behind the lower key line: the two keyboards never overlap in `z` at
 *    all, and a hand on the lower one has nothing above it.
 */

import {
  BoxGeometry, Color, Group, InstancedMesh, type Material, Matrix4, Mesh,
  MeshStandardMaterial, type Object3D, Quaternion, Vector3,
} from 'three';

import { Rng } from '../../../core/rng.js';
import { disposeTree, type SynthRig, type SynthRigBuilder } from './synth-rig.js';
import { addTo } from './types.js';

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
 * The upper instrument, which is the smaller of the two.
 *
 * A stack is almost never two of the same keyboard: the point of the lower one
 * is range and the point of the upper one is a second sound within arm's reach,
 * so it is the 61-note box. The layout table says that part already — every
 * extra board `boardsFor` lays out is 61 notes — and these are the rest of it:
 * a case a few millimetres thinner and a shallower panel behind the keys.
 */
const UP_CASE_H = 0.086;
const UP_PANEL_D = 0.155;

/** Depth of the steel arms the upper keyboard rests on, top to bottom. */
const ARM_H = 0.026;

/** Resting glow of the LCD backlight, and how much a note may add to it. */
const LCD_BASE = 0.62;
const LCD_SWELL = 0.18;

/**
 * End caps of 2.75 cm rather than the polysynth's wooden cheeks. There is
 * almost nothing either side of a DX7's keybed — the moulding wraps it and
 * stops — and a generous overhang is the first thing that makes a plastic
 * instrument look like a furniture one.
 */
const END_CAP = 0.0275;

/** What a slab is built around: a keybed, in that board's own frame. */
interface SlabSpec {
  /** Width of the keys this case wraps. */
  boardWidth: number;
  /** Y of the key tops — the playing surface. */
  keyTopY: number;
  /** Z of the back edge of the keys. The panel starts here. */
  keyBackZ: number;
  /** How far forward the keys run from `keyBackZ`. */
  whiteLength: number;
  /** Depth of the panel behind the keys. */
  panelDepth: number;
  /** Overall case height. */
  caseH: number;
}

/** What the rest of the rig needs to know about a slab once it is built. */
interface Slab {
  /** Across the mouldings: the keybed and an end cap each side. */
  shellW: number;
  /** Y of the top of the case — the plane the panel furniture sits on. */
  deckTopY: number;
  /** Y of the underside, which is what an arm or a stand meets. */
  botY: number;
  /** Z of the front lip, just ahead of the keys. */
  frontZ: number;
}

/**
 * One slab: the tray under the keys, the panel deck behind them, and a flange
 * filling the overhang at each end.
 *
 * Shared by the two, and that is what keeps the upper one honest. Both are
 * built in a board's *own* frame — the same `keyTopY` and `keyBackZ` `synth.ts`
 * lays keys out against — so the second slab is the first one with a smaller
 * keybed and a thinner case, and the two cannot drift apart. It is also why the
 * "nothing above the key plane forward of `keyBackZ`" rule holds on both boards
 * from a single piece of arithmetic instead of being argued twice.
 */
function slab(target: Object3D, mat: Material, s: SlabSpec): Slab {
  const shellW = s.boardWidth + 2 * END_CAP;
  const deckTopY = s.keyTopY + 0.004;
  const botY = deckTopY - s.caseH;
  const frontZ = s.keyBackZ - s.whiteLength - 0.012;

  /**
   * The panel deck: flat, in the same plane as the top of the case, and not
   * tilted. This is the one place the file departs from `synth.ts`, whose panel
   * is hinged back at 0.55 rad like a Minimoog's. A sloped panel exists so a
   * player can see thirty knobs at once; when there are no knobs there is
   * nothing to angle, and every instrument of this decade is flat on top. Its
   * front face lands exactly on `keyBackZ`, which is the whole of the clearance
   * argument for a slab: there is nothing above the keys because the case
   * begins where they end.
   */
  const deck = addTo(target, new Mesh(new BoxGeometry(shellW, s.caseH, s.panelDepth), mat));
  deck.position.set(0, botY + s.caseH / 2, s.keyBackZ + s.panelDepth / 2);
  deck.castShadow = true;
  deck.receiveShadow = true;

  /**
   * The tray the keys sit in, running forward under them. Its top is 21 mm
   * below the key surface — the keys are 18 mm thick, so it clears their
   * undersides by 3 mm and never crosses the playing plane.
   */
  const troughTopY = s.keyTopY - 0.021;
  const troughD = s.keyBackZ - frontZ;
  const trough = addTo(target, new Mesh(new BoxGeometry(shellW, troughTopY - botY, troughD), mat));
  trough.position.set(0, (botY + troughTopY) / 2, s.keyBackZ - troughD / 2);
  trough.castShadow = true;
  trough.receiveShadow = true;

  /**
   * A flange at each end of the keybed, filling the overhang the keys do not
   * reach. It stops 2 mm *below* the key tops: a real end cap stands slightly
   * proud, but nothing this rig owns is allowed above the playing plane forward
   * of `keyBackZ`, and two millimetres of moulding is not worth arguing about.
   */
  const flangeGeo = new BoxGeometry(END_CAP, s.keyTopY - 0.002 - troughTopY, troughD);
  for (const side of [1, -1]) {
    const flange = addTo(target, new Mesh(flangeGeo, mat));
    flange.position.set(
      side * (s.boardWidth + END_CAP) / 2,
      (troughTopY + s.keyTopY - 0.002) / 2,
      s.keyBackZ - troughD / 2,
    );
    flange.castShadow = true;
  }

  return { shellW, deckTopY, botY, frontZ };
}

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

  // --- The lower slab ------------------------------------------------------

  /** Everything behind the keys, and there is startlingly little of it. */
  const panelDepth = rng.float(0.175, 0.198);

  const low = slab(group, caseMat, {
    boardWidth, keyTopY, keyBackZ, whiteLength, panelDepth, caseH: CASE_H,
  });
  const { shellW, deckTopY } = low;
  const caseBotY = low.botY;

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

  /**
   * The second keyboard, where this player has one.
   *
   * `extraBoards` is the layout table's own answer — `boardsFor` puts the
   * second board on a tier before it puts one out on a wing, which is what a
   * stand does too — so a digital player with two boards has exactly one entry
   * here and a player with one has none. There is no branch for a wing because
   * `SYNTH_RIGS.digital.maxBoards` is 2: a slab is a stack, not a frame.
   *
   * **How much daylight the stack ends up with**, since this file no longer
   * chooses it: the board's keys are 0.285 m above the lower board's, its case
   * hangs `UP_CASE_H` under its own key tops and the arms `ARM_H` under that,
   * which leaves about 0.18 m of air. A hand playing the lower board keeps its
   * wrist around 8 cm above the keys and the knuckles rise another 4 or 5 on a
   * lifted attack, so 13 cm is the tallest a hand ever gets and 0.18 clears it
   * outright — where the tier this file used to place for itself sat *at* 0.13
   * and accepted that a big lifted attack would not fit under it. It is still
   * well inside the 0.25–0.35 m a real double stand adjusts through, so the
   * pair reads as one instrument somebody is standing at rather than as two
   * keyboards on scaffolding.
   *
   * None of that is load-bearing for collisions, which is worth being plain
   * about: the whole upper assembly sits 0.24 m behind the lower key line and
   * never passes over the lower keys at all. The clearance is what the stack
   * looks like, and what a hand crossing between the two boards moves through.
   */
  const host = opts.extraBoards?.[0];

  /** Where the stand's uprights are, which both tiers hang off. */
  const xPost = Math.min(0.40, boardWidth * 0.28);

  /** Y of the underside of the arms under the upper slab. Absent with no tier. */
  let tierArmBotY: number | undefined;

  if (host) {
    /**
     * The tier group carries the board's own placement and nothing else, so
     * everything inside it is written in the same coordinates as the lower
     * slab — and lands wherever `synth.ts` put the keys, because that is the
     * transform the keys got too. A yaw is honoured for form's sake; the tier
     * this rig is given has none, and a wing is a modular's problem.
     */
    const tier = addTo(group, new Group());
    tier.name = 'digital:upper-tier';
    tier.position.set(host.at[0], host.at[1], host.at[2]);
    tier.rotation.y = host.yaw;

    const up = slab(tier, caseMat, {
      boardWidth: host.width, keyTopY, keyBackZ, whiteLength,
      panelDepth: UP_PANEL_D, caseH: UP_CASE_H,
    });

    /**
     * Sixteen buttons and a screen on the upper unit, sharing the lower one's
     * geometry and materials. Half the grid rather than a full one because the
     * second instrument is the smaller model, and one shared material means
     * both displays glow as one colour — two panels flickering out of phase is
     * a detail nobody buys at six metres.
     *
     * No sliders: the pair of faders is the lower instrument's editing
     * interface and the second box is the one you play rather than the one you
     * program. It is also the honest reading of what a stack is for.
     */
    const upXEnd = up.shellW / 2 - 0.022;
    const upLcdX = upXEnd - 0.040;
    const upPads = addTo(tier, new InstancedMesh(padGeo, padMat, 16));
    upPads.name = 'digital:keypad:upper';
    {
      const m = new Matrix4();
      const q = new Quaternion();
      const one = new Vector3(1, 1, 1);
      for (let i = 0; i < 16; i++) {
        m.compose(
          new Vector3(
            upLcdX - 0.066 - (i % 8) * padPitch,
            up.deckTopY,
            keyBackZ + 0.031 + Math.floor(i / 8) * 0.037,
          ),
          q, one,
        );
        upPads.setMatrixAt(i, m);
      }
      upPads.instanceMatrix.needsUpdate = true;
    }
    /**
     * The upper display, and on a stack it is *the* display: the lower one sits
     * under this board from any angle the house has, which is exactly what
     * happens to the bottom keyboard of a real two-tier rig. The lit thing the
     * silhouette needs is up here.
     */
    const upBezel = addTo(tier, new Mesh(new BoxGeometry(0.070, 0.010, 0.038), bezelMat));
    upBezel.position.set(upLcdX, up.deckTopY - 0.001, keyBackZ + 0.100);
    const upScreen = addTo(tier, new Mesh(new BoxGeometry(0.052, 0.002, 0.022), lcdMat));
    upScreen.position.set(upLcdX, up.deckTopY + 0.0045, keyBackZ + 0.100);

    /**
     * The arms the upper keyboard is bolted to. Inside the tier group so they
     * follow the board rather than needing to be kept level with it, and they
     * stop a centimetre short of the case at each end — a bracket you would
     * bolt rather than a beam the length of the instrument.
     */
    const armFront = up.frontZ + 0.010;
    const armBack = keyBackZ + UP_PANEL_D - 0.010;
    const upArmGeo = new BoxGeometry(0.034, ARM_H, armBack - armFront);
    for (const side of [1, -1]) {
      const arm = addTo(tier, new Mesh(upArmGeo, steelMat));
      arm.position.set(side * xPost, up.botY - ARM_H / 2, (armFront + armBack) / 2);
      arm.castShadow = true;
    }

    tierArmBotY = host.at[1] + up.botY - ARM_H;
  }

  // --- The stand -----------------------------------------------------------

  /**
   * A tier frame: a runner on the floor each side, a column standing on it, and
   * a pair of arms cantilevered forward off the column per keyboard. The
   * columns sit 27 cm *behind* the keys and the runners stop short of the key
   * fronts, so the player has clear floor from `keyBackZ - whiteLength - 0.012`
   * forward — the front lip of the case is the furthest anything reaches toward
   * them, and their standing position is another 27 cm beyond that.
   */
  const colZ = keyBackZ + 0.27;
  const runnerFront = keyBackZ - whiteLength + 0.010;
  const runnerBack = keyBackZ + 0.42;
  const runnerD = runnerBack - runnerFront;

  const runnerGeo = new BoxGeometry(0.038, 0.030, runnerD);
  /**
   * The column stops exactly under the highest arm it carries, which is a
   * bracket you would actually bolt rather than a number that looks about
   * right — and it is what makes the stand say how many keyboards are on it.
   * With no upper board there is nothing above the one slab and the column
   * stops at its arms: a slab on a stand, which is the other thing 1987 looked
   * like and is honest in a way a second keybed nobody could play was not.
   */
  const colTopY = tierArmBotY ?? caseBotY;
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
