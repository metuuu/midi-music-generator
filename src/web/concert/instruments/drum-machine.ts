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
 * They share a carcass and a stand because at stage distance they *are* the same
 * silhouette: a shoebox on a table. What differs is the row along the front, and
 * that is the part a camera can actually resolve.
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

/** How far the case stands above the boards when nobody says. See the stand. */
const LEG_DROP = 0.92;

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
  /**
   * How far the case is above the boards, so the stand can reach the floor.
   *
   * The IR places the machine at working height and says nothing about what is
   * holding it up, which is correct — where a thing stands is a staging
   * decision and what it stands on is this file's business.
   */
  standHeight?: number;
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

  // --- The stand -----------------------------------------------------------

  /**
   * A folding table, not a keyboard stand. The box lived on whatever was to
   * hand, and a four-leg table is the honest and cheapest read — the machine's
   * own position already has the table height baked in, so the legs run from
   * the boards up to the case rather than the other way round.
   */
  const TOP_Y = 0;
  /**
   * The legs reach from the case down to the boards, and the machine does not
   * know how far that is — the IR places it at table height and the table has
   * to arrive at the floor whatever height that turns out to be.
   *
   * So the geometry is one unit-tall box and the drop is on the instance
   * matrix. `LEG_DROP` is the fallback for a machine placed with no height
   * information at all, which should not happen and would otherwise produce
   * legs of length zero rather than a visible mistake.
   */
  const legDrop = opts.standHeight ?? LEG_DROP;
  const TOP_THICK = 0.018;
  /** Underside of the tabletop, which is where a leg starts. */
  const underside = TOP_Y - 0.012 - TOP_THICK / 2;
  /**
   * Length is measured to the boards rather than assumed, and the difference is
   * the tabletop's own thickness. Scaling a unit box by the full stand height
   * put the feet 12 mm through the deck — small enough to survive review and
   * large enough to see from the front row, since the stage floor is exactly
   * where the eye goes looking for whether a thing is standing on it.
   */
  const legLen = Math.max(0.01, legDrop + underside);
  const legGeo = new BoxGeometry(0.022, 1, 0.022);
  const legs = addTo(root, new InstancedMesh(legGeo, steelMat, 4));
  legs.castShadow = true;
  {
    const m = new Matrix4();
    let slot = 0;
    for (const sx of [1, -1]) {
      for (const sz of [1, -1]) {
        m.makeScale(1, legLen, 1);
        m.setPosition(
          sx * (CASE_W / 2 - 0.03),
          underside - legLen / 2,
          sz * (CASE_D / 2 - 0.03),
        );
        legs.setMatrixAt(slot++, m);
      }
    }
    legs.instanceMatrix.needsUpdate = true;
  }

  const top = addTo(root, new Mesh(new BoxGeometry(CASE_W + 0.14, TOP_THICK, CASE_D + 0.12), steelMat));
  top.position.set(0, TOP_Y - 0.012, 0);
  top.receiveShadow = true;

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

  /**
   * The pattern, bucketed by voice lamp and sorted once.
   *
   * Sorted so `update` can walk a cursor rather than scanning the whole song
   * every frame: a four-minute number is a couple of thousand drum events and
   * this runs at frame rate. The cursor rewinds only when the clock goes
   * backwards, which happens when a number restarts.
   */
  const LAMP_OF: Record<string, number> = {
    bd: 0, lt: 0, mt: 0,
    sd: 1, rim: 1, cp: 1, ht: 1,
    hh: 2, oh: 2, rd: 2, cr: 2, perc: 2, cb: 2, sh: 2,
  };
  const hits = [...opts.events]
    .map((e) => ({ beat: e.beat, lamp: LAMP_OF[e.voice] ?? 2 }))
    .sort((a, b) => a.beat - b.beat);

  let cursor = 0;
  const litUntil = [-1e9, -1e9, -1e9];
  let lastNow = -1e9;

  const machine: DrumMachine = {
    root,

    update(now: number): void {
      if (!Number.isFinite(now)) return;
      if (now < lastNow) {
        cursor = 0;
        litUntil.fill(-1e9);
      }
      lastNow = now;

      // Everything that has landed since the last frame lights its lamp.
      while (cursor < hits.length && hits[cursor]!.beat <= now) {
        litUntil[hits[cursor]!.lamp] = hits[cursor]!.beat + FLASH;
        cursor++;
      }
      for (let i = 0; i < VOICE_ROWS; i++) voiceLit[i]!.visible = now < litUntil[i]!;

      /**
       * The step lamp runs whether or not anything is being played on this
       * beat, because a drum machine's position light runs whether or not the
       * step has anything in it. That is the difference between a machine
       * *running* and a machine responding, and it is the one that says nobody
       * is driving this.
       */
      const inBar = ((now % opts.beatsPerBar) + opts.beatsPerBar) % opts.beatsPerBar;
      const step = Math.floor((inBar / opts.beatsPerBar) * keys) % keys;
      lit.position.x = stepXs[step]!;
      lit.visible = true;
    },

    dispose(): void {
      disposeTree(root);
    },
  };

  return machine;
}
