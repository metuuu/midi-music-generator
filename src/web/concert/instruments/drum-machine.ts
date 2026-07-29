/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The rhythm box — the one thing on the stage that plays without hands.
 *
 * It is not an `InstrumentModel` and deliberately does not implement that
 * interface. Every method on it exists to answer a question about a *player*:
 * `resolve` says where to put a hand, `station` says where a body stands,
 * `react` says what moved because somebody hit it. A machine has no player. It
 * is an object with a lamp on it, and pretending otherwise would mean inventing
 * a performer for something with no face — which is the exact bug this whole
 * change exists to undo.
 *
 * ## The lamp is not decoration
 *
 * A self-playing part is the one thing that can quietly destroy this project's
 * proposition, which is that you can watch the music being made. Percussion
 * arriving from an empty stage is worse than the drummer who used to mime it:
 * at least the mime explained where the sound came from.
 *
 * So the machine shows what it is playing. It is handed its own pattern at
 * build time — which is honest, because a drum machine genuinely does hold the
 * pattern in memory, and it is the reason this needs no per-frame feed from the
 * transport beyond the beat itself — and it lights the step it is on, plus the
 * voice lamps for whatever lands there. From six metres that reads as a machine
 * running rather than a box sitting still, and it is the whole of the
 * "consequence" half of the rule in `docs/backline-plan.md` §8.1.
 *
 * ## Two objects, one file
 *
 * `box` is a preset machine — a Mini Pops, a Rhythm Ace. Its front is a row of
 * rhythm-name buttons and a start switch, because that is the entire interface:
 * you choose *Bossa Nova* and you press start.
 *
 * `programmed` is a machine you write into — a TR-808, a LinnDrum. Its front is
 * a row of sixteen step keys, which is the object's whole visual signature and
 * the reason the pattern is a grid rather than a knob.
 *
 * They share a carcass and a mounting plate because at stage distance they *are*
 * the same silhouette: a shoebox on somebody's rig. What differs is the row
 * along the front, and that is the part a camera can actually resolve.
 */

import {
  BoxGeometry, Color, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial,
  Vector3,
} from 'three';

import { Rng } from '../../../core/rng.js';
import type { DrumEvent } from '../../../core/types.js';
import { disposeTree } from './synth-rig.js';
import { addTo } from './types.js';

/** Case size. A Mini Pops is about 30 × 20 cm and a TR-808 half again as wide. */
const CASE_W = 0.34;
const CASE_D = 0.21;
const CASE_H = 0.075;

/** How far the panel tilts up toward the player. Enough to read, not a lectern. */
const TILT = 0.22;

/** Sixteen steps, because that is what a bar of this music is. */
const STEPS = 16;

/**
 * How long a lit step stays lit, in beats.
 *
 * Short — a step lamp is a strobe, not a glow. Long enough to survive a frame
 * at 30 fps and a slow tempo, short enough that two adjacent sixteenths do not
 * merge into one smear.
 */
const FLASH = 0.22;

export interface DrumMachineOptions {
  /** Which object. See the note above; it decides the front row and nothing else. */
  kind: 'box' | 'programmed';
  /** Deterministic per number. Varies the finish. */
  seed: number;
  /** Body colour hint from the venue palette. May be ignored. */
  finish?: string;
  /**
   * The pattern it is playing, in beats from the start of the number.
   *
   * The machine holds its own pattern, exactly as the real object does. Passing
   * it here rather than feeding events per frame is what keeps the show runner
   * from having to know a machine exists beyond calling `update`.
   */
  events: readonly DrumEvent[];
  /** Beats per bar, so the step row means a bar rather than an arbitrary window. */
  beatsPerBar: number;
}

/**
 * Which step is lit and which voice lamps are flashing, at a given beat.
 *
 * Exported because a rhythm box is not always a box: where the player is
 * standing at a modular it is a *module* in the cabinet, drawn by
 * `synth-rig-modular.ts`, and both objects have to agree about what the machine
 * is doing at any moment. Two copies of this would drift the day either was
 * touched, and the drift would be invisible — a panel lamp is not something
 * anybody checks against a second panel lamp.
 *
 * Holds a cursor rather than scanning: a four-minute number is a couple of
 * thousand drum events and this runs at frame rate. Rewinds when the clock goes
 * backwards, which is what a number restarting looks like.
 */
export function createMachineRunner(
  events: readonly DrumEvent[], beatsPerBar: number, steps: number,
): { step(now: number): number; lamp(i: number, now: number): boolean; lamps: number } {
  const LAMP_OF: Record<string, number> = {
    bd: 0, lt: 0, mt: 0,
    sd: 1, rim: 1, cp: 1, ht: 1,
    hh: 2, oh: 2, rd: 2, cr: 2, perc: 2, cb: 2, sh: 2,
  };
  const hits = [...events]
    .map((e) => ({ beat: e.beat, lamp: LAMP_OF[e.voice] ?? 2 }))
    .sort((a, b) => a.beat - b.beat);

  let cursor = 0;
  const litUntil = [-1e9, -1e9, -1e9];
  let lastNow = -1e9;

  const advance = (now: number): void => {
    if (now < lastNow) {
      cursor = 0;
      litUntil.fill(-1e9);
    }
    lastNow = now;
    while (cursor < hits.length && hits[cursor]!.beat <= now) {
      litUntil[hits[cursor]!.lamp] = hits[cursor]!.beat + FLASH;
      cursor++;
    }
  };

  return {
    lamps: 3,
    /**
     * The position light, which runs whether or not this step has anything in
     * it. That is the difference between a machine *running* and a machine
     * responding, and it is the one that says nobody is driving this.
     */
    step(now: number): number {
      advance(now);
      const inBar = ((now % beatsPerBar) + beatsPerBar) % beatsPerBar;
      return Math.floor((inBar / beatsPerBar) * steps) % steps;
    },
    lamp(i: number, now: number): boolean {
      advance(now);
      return now < litUntil[i]!;
    },
  };
}

export interface DrumMachine {
  root: Group;
  /** Song position in beats, from the one clock. Do not keep your own. */
  update(now: number): void;
  dispose(): void;
}

/**
 * Cream and wood for a preset box, black and orange for a programmable one.
 *
 * Not a taste: the preset machines were built as organ accessories and dressed
 * like furniture, and the step-sequencer generation was studio equipment and
 * dressed like a rack. Getting this backwards makes a 1974 stage look like 1983.
 */
const BOX_SKINS = ['#c9bda4', '#b9a888', '#cdc6b4'] as const;
const PROGRAMMED_SKINS = ['#26262a', '#1d1e22', '#303036'] as const;

export function buildDrumMachine(opts: DrumMachineOptions): DrumMachine {
  const rng = new Rng(`drum-machine:${opts.kind}:${opts.seed}`);
  const root = new Group();
  root.name = `drum-machine-${opts.kind}`;

  const preset = opts.kind === 'box';
  const caseColour = new Color(
    opts.finish ?? rng.pick(preset ? BOX_SKINS : PROGRAMMED_SKINS),
  );

  const caseMat = new MeshStandardMaterial({
    color: caseColour, roughness: preset ? 0.72 : 0.58, metalness: preset ? 0.02 : 0.12,
  });
  const steelMat = new MeshStandardMaterial({ color: '#17181b', roughness: 0.5, metalness: 0.6 });
  /**
   * One material per lamp state, shared across every instance of that state.
   *
   * Instanced meshes cannot carry a material each, so the lit step is a separate
   * single-instance mesh that moves along the row rather than sixteen meshes
   * with sixteen materials. One draw call for the row, one for the lit one.
   */
  const lampOffMat = new MeshStandardMaterial({
    color: preset ? '#7b6f5c' : '#43363a', roughness: 0.6, metalness: 0,
  });
  const lampOnMat = new MeshStandardMaterial({
    color: '#ffb347', emissive: '#ff9020', emissiveIntensity: 1.6, roughness: 0.35,
  });
  const voiceOffMat = new MeshStandardMaterial({
    color: '#4a4a50', roughness: 0.7, metalness: 0,
  });
  const voiceOnMat = new MeshStandardMaterial({
    color: '#ff5a4a', emissive: '#ff3b28', emissiveIntensity: 1.5, roughness: 0.35,
  });

  // --- How it is held up ---------------------------------------------------

  /**
   * A mounting plate and two brackets, and **no legs**.
   *
   * The first version of this stood on a folding table of its own, and that was
   * the whole problem with it: a lone box on a table in the middle of a stage
   * produces a full drum part and offers no account of why. The eye files it as
   * scenery, so the percussion still arrives from nowhere — which is the failure
   * the box was introduced to fix, relocated rather than solved.
   *
   * Gear is mounted, not parked. This sits on somebody's rig — the end of a
   * keyboard stand, the shelf of a modular — and the plate is what says so. A
   * machine on a person's own equipment needs no explanation; a machine on its
   * own furniture is a mystery the audience has to solve.
   */
  const TOP_Y = 0;
  const PLATE_THICK = 0.010;
  const plate = addTo(root, new Mesh(
    new BoxGeometry(CASE_W + 0.03, PLATE_THICK, CASE_D + 0.02), steelMat));
  plate.position.set(0, TOP_Y - PLATE_THICK / 2, 0);
  plate.receiveShadow = true;
  plate.castShadow = true;

  // Two short brackets under the plate, which is what a clamp on the end of a
  // stand looks like from six metres: a hand's width of steel and then nothing.
  const bracketGeo = new BoxGeometry(0.020, 0.055, 0.020);
  const brackets = addTo(root, new InstancedMesh(bracketGeo, steelMat, 2));
  brackets.castShadow = true;
  {
    const m = new Matrix4();
    [1, -1].forEach((sx, i) => {
      m.makeTranslation(sx * (CASE_W / 2 - 0.05), TOP_Y - PLATE_THICK - 0.0275, 0);
      brackets.setMatrixAt(i, m);
    });
    brackets.instanceMatrix.needsUpdate = true;
  }

  // --- The case ------------------------------------------------------------

  const shell = addTo(root, new Group());
  shell.position.set(0, TOP_Y, 0);
  shell.rotation.x = -TILT;

  const body = addTo(shell, new Mesh(new BoxGeometry(CASE_W, CASE_H, CASE_D), caseMat));
  body.position.set(0, CASE_H / 2, 0);
  body.castShadow = true;
  body.receiveShadow = true;

  /**
   * A wooden end cheek each side on the preset machine and nothing on the
   * programmable one — the single cheapest way to say "organ accessory" versus
   * "studio box", and the same device `synth-rig-polysynth.ts` uses for the
   * same decade.
   */
  if (preset) {
    const cheekMat = new MeshStandardMaterial({ color: '#6b4a2c', roughness: 0.66 });
    const cheekGeo = new BoxGeometry(0.018, CASE_H + 0.006, CASE_D + 0.004);
    for (const side of [1, -1]) {
      const cheek = addTo(shell, new Mesh(cheekGeo, cheekMat));
      cheek.position.set(side * (CASE_W / 2 + 0.009), CASE_H / 2, 0);
      cheek.castShadow = true;
    }
  }

  // --- The front row -------------------------------------------------------

  const panelY = CASE_H + 0.001;
  const rowZ = -CASE_D / 2 + 0.045;

  /**
   * Sixteen steps on a programmable machine, and on a preset one the same row
   * standing in for its rhythm-name buttons.
   *
   * The preset machine gets fewer, wider keys, because that is what those
   * panels were — a dozen named rhythms in a strip. It still lights them in
   * time, which is a small lie about a Mini Pops (its lamp was one flashing
   * tempo light, not a moving position) and the right call anyway: one blinking
   * lamp at stage distance is invisible, and the thing being communicated —
   * *this object is producing the beat* — is true of both machines.
   */
  const keys = preset ? 10 : STEPS;
  const keyW = (CASE_W - 0.05) / keys * 0.78;
  const keyGeo = new BoxGeometry(keyW, 0.004, 0.016);
  const stepXs: number[] = [];
  for (let i = 0; i < keys; i++) {
    stepXs.push(-(CASE_W - 0.05) / 2 + ((CASE_W - 0.05) / keys) * (i + 0.5));
  }

  const stepRow = addTo(shell, new InstancedMesh(keyGeo, lampOffMat, keys));
  stepRow.name = 'machine:steps';
  {
    const m = new Matrix4();
    stepXs.forEach((x, i) => {
      m.makeTranslation(x, panelY, rowZ);
      stepRow.setMatrixAt(i, m);
    });
    stepRow.instanceMatrix.needsUpdate = true;
  }

  /** The one that moves. A single mesh reparked each time the step changes. */
  const lit = addTo(shell, new Mesh(new BoxGeometry(keyW, 0.005, 0.017), lampOnMat));
  lit.position.set(stepXs[0]!, panelY + 0.001, rowZ);
  lit.visible = false;

  /**
   * A short column of voice lamps behind the step row — kick, snare, hat.
   *
   * Three rather than the whole kit: what the eye reads at this distance is
   * *something on the left flashing on the beat and something on the right
   * flashing between them*, and adding eleven more lamps turns that into a
   * texture. The mapping to real voices is deliberately coarse for the same
   * reason.
   */
  const VOICE_ROWS = 3;
  const voiceGeo = new BoxGeometry(0.012, 0.004, 0.012);
  const voiceXs = [-0.075, 0, 0.075];
  const voiceZ = rowZ + 0.052;
  const voiceRow = addTo(shell, new InstancedMesh(voiceGeo, voiceOffMat, VOICE_ROWS));
  {
    const m = new Matrix4();
    voiceXs.forEach((x, i) => {
      m.makeTranslation(x, panelY, voiceZ);
      voiceRow.setMatrixAt(i, m);
    });
    voiceRow.instanceMatrix.needsUpdate = true;
  }
  const voiceLit: Mesh[] = voiceXs.map((x) => {
    const lamp = addTo(shell, new Mesh(new BoxGeometry(0.013, 0.005, 0.013), voiceOnMat));
    lamp.position.set(x, panelY + 0.001, voiceZ);
    lamp.visible = false;
    return lamp;
  });

  // --- What it is playing --------------------------------------------------

  const runner = createMachineRunner(opts.events, opts.beatsPerBar, keys);

  const machine: DrumMachine = {
    root,

    update(now: number): void {
      if (!Number.isFinite(now)) return;
      for (let i = 0; i < VOICE_ROWS; i++) voiceLit[i]!.visible = runner.lamp(i, now);
      lit.position.x = stepXs[runner.step(now)]!;
      lit.visible = true;
    },

    dispose(): void {
      disposeTree(root);
    },
  };

  return machine;
}
