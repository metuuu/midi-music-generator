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
 * `programmed` is a machine you write into — a TR-808, a LinnDrum — and
 * `sequencer` is the same object running a pitched figure instead of a kit.
 * Their front is a row of sixteen step keys, which is the object's whole visual
 * signature and the reason the pattern is a grid rather than a knob.
 *
 * They share a carcass and a stand because at stage distance they *are* the
 * same silhouette: a shoebox at somebody's elbow. What differs is the row along
 * the front, and that is the part a camera can actually resolve.
 */

import {
  BoxGeometry, Color, CylinderGeometry, Group, InstancedMesh, Matrix4, Mesh,
  MeshStandardMaterial,
} from 'three';

import { Rng } from '../../../core/rng.js';
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
 * The row of keys along the front, in the tilted case's own frame: how wide it
 * is, how far up the panel, and how far forward.
 *
 * Module-level because two things need them and one of them is not in this file
 * — see `MACHINE_PANEL_Y` below.
 */
const ROW_W = CASE_W - 0.05;
const ROW_Y = CASE_H + 0.001;
const ROW_Z = -CASE_D / 2 + 0.045;

/**
 * Where a hand lands on this object, in its own frame, relative to the top of
 * its stand.
 *
 * Exported because the hand is placed by something that never sees this
 * geometry: `resolve` on the *player's instrument* answers a `control` point,
 * and a machine standing beside them is not part of that instrument. The
 * alternative is a second set of numbers in `instruments/index.ts` describing a
 * box it cannot see, which would be wrong the first time either file was
 * touched — and wrong invisibly, since a hand landing 2 cm off a button looks
 * like a hand on a button.
 *
 * Derived rather than written down, because the case is *tilted*: the row is at
 * `ROW_Y` on a panel turned `TILT` toward the player, and rotating it about `x`
 * drops it 1.3 cm and pulls it 1.7 cm nearer — numbers nobody would guess and
 * nobody would notice being stale.
 *
 * `PANEL_Z` is negative, and that is the row facing its player: the box's local
 * `+z` runs away from them, so its front row is on their side of the case.
 */
export const MACHINE_PANEL_W = ROW_W;
export const MACHINE_PANEL_Y = ROW_Y * Math.cos(TILT) + ROW_Z * Math.sin(TILT);
export const MACHINE_PANEL_Z = ROW_Z * Math.cos(TILT) - ROW_Y * Math.sin(TILT);

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
  kind: 'box' | 'programmed' | 'sequencer';
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
  events: readonly { beat: number; velocity: number; voice?: string }[];
  /** Beats per bar, so the step row means a bar rather than an arbitrary window. */
  beatsPerBar: number;
  /**
   * How far the stand's top is above the deck it stands on, in metres.
   *
   * `StageMachine.stand`. The object's origin is that top surface, so this is
   * the length of the legs and nothing else — the box's own geometry is
   * unaffected by how high it is being held.
   */
  stand: number;
  /**
   * The beat the player's hand reaches the panel, if anybody's does.
   *
   * The panel is **dark before it**. A machine already running when the curtain
   * goes up is the failure §8.1 of `docs/backline-plan.md` exists to prevent,
   * dressed up as a lit lamp: if the box is stepping before anybody touches it,
   * the hand that arrives on the downbeat is pressing a button that changes
   * nothing, and the start gesture becomes decoration.
   *
   * Absent — an ambient number with nobody on the boards — and it runs from its
   * own first event, which is the honest answer when there is no cause to wait
   * for.
   */
  startedAt?: number;
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
  events: readonly { beat: number; voice?: string }[],
  beatsPerBar: number, steps: number,
  /** See `DrumMachineOptions.startedAt`. Absent means "from its own first event". */
  startedAt?: number,
): {
  step(now: number): number;
  lamp(i: number, now: number): boolean;
  running(now: number): boolean;
  lamps: number;
} {
  const LAMP_OF: Record<string, number> = {
    bd: 0, lt: 0, mt: 0,
    sd: 1, rim: 1, cp: 1, ht: 1,
    hh: 2, oh: 2, rd: 2, cr: 2, perc: 2, cb: 2, sh: 2,
  };
  /**
   * A pitched figure has no voices, so every note lights the same lamp pair.
   *
   * `voice` is a drum's; a sequencer's events are notes. Rather than two
   * runners, the mapping falls through to a rotating lamp so a running sequence
   * still has something moving on it — which is the whole job of these three
   * lights, and is true of a bass figure as much as of a hi-hat.
   */
  const hits = [...events]
    .map((e, i) => ({
      beat: e.beat,
      lamp: e.voice === undefined ? i % 3 : LAMP_OF[e.voice] ?? 2,
    }))
    .sort((a, b) => a.beat - b.beat);

  /**
   * When it is running, which is a window and not "always".
   *
   * It starts when somebody starts it — or, with nobody to do so, at its own
   * first note. It stops a bar after its last, which is where the choreographer
   * puts the hand that switches it off: a machine that stops at the instant of
   * its final hit has been cut off rather than switched off, and a bar is one
   * cycle of the row coming round empty, which is what you see on the real
   * object between the last note and the hand reaching the switch.
   */
  const from = startedAt ?? (hits.length ? hits[0]!.beat : 0);
  const to = (hits.length ? hits[hits.length - 1]!.beat : 0) + beatsPerBar;

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
    running(now: number): boolean {
      return now >= from && now < to;
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
   * A stand of its own, the size of the box and nothing more.
   *
   * Two versions of this were wrong in opposite directions and both are worth
   * keeping in view. The first stood the machine on a **folding table** in the
   * middle of the stage: a lone piece of furniture producing a full drum part,
   * which the eye files as scenery, so the percussion still arrived from
   * nowhere. The second bolted it to the **top of somebody's keyboard**, which
   * bought the explanation and lost the object — from six metres a shoebox
   * lying on the panel behind the keys is inside the keyboard's own silhouette,
   * and the one thing the audience has to be able to see is a second instrument
   * being started.
   *
   * So: a stand, at the player's right hand, purpose-built and obviously so —
   * a top the size of the case, four tubes and a brace, no wider than it has to
   * be. It is not furniture that happens to have a box on it, and it is not
   * hidden behind a keyboard. What makes it belong to the person beside it is
   * that they turn and work it, which is the thing an audience can actually
   * read; a mounting plate is an argument nobody in row six can see.
   *
   * The origin is the **top surface**, so `stand` is the leg length and the
   * case's own geometry does not know how high it is being held.
   */
  const TOP_Y = 0;
  const TOP_THICK = 0.014;
  const TOP_W = CASE_W + 0.06;
  const TOP_D = CASE_D + 0.05;
  const stand = Math.max(0, opts.stand);

  const top = addTo(root, new Mesh(
    new BoxGeometry(TOP_W, TOP_THICK, TOP_D), steelMat));
  top.position.set(0, TOP_Y - TOP_THICK / 2, 0);
  top.receiveShadow = true;
  top.castShadow = true;

  /**
   * Four tubes and one brace low down, which is the whole stand.
   *
   * Tubes rather than a box frame: this is stage hardware, and the thing that
   * says so is that you can see through it. A solid pedestal at this size reads
   * as a plinth, and a plinth is furniture again. The brace sits near the floor
   * for the same reason a real one does — it is what stops a light frame
   * racking, and it is the detail that makes four separate legs read as one
   * object.
   */
  if (stand > TOP_THICK + 0.05) {
    const LEG_R = 0.011;
    const legX = TOP_W / 2 - 0.028;
    const legZ = TOP_D / 2 - 0.028;
    /**
     * The legs run from *under the top* to the deck, so they are `stand` less
     * the top's own thickness.
     *
     * Written out because the obvious version is wrong by exactly that: `stand`
     * is the height of the top *surface*, which is this object's origin, so four
     * legs of length `stand` hung beneath the board put their feet 14 mm into
     * the boards. Small enough never to be seen and exactly what the verifier's
     * "its legs reach the deck the player stands on" is for.
     */
    const legLen = stand - TOP_THICK;
    const legGeo = new CylinderGeometry(LEG_R, LEG_R, legLen, 8);
    const legs = addTo(root, new InstancedMesh(legGeo, steelMat, 4));
    legs.castShadow = true;
    {
      const m = new Matrix4();
      let i = 0;
      for (const sx of [1, -1]) {
        for (const sz of [1, -1]) {
          m.makeTranslation(sx * legX, TOP_Y - TOP_THICK - legLen / 2, sz * legZ);
          legs.setMatrixAt(i++, m);
        }
      }
      legs.instanceMatrix.needsUpdate = true;
    }

    // Measured up from the deck rather than down from the top: a brace sits a
    // hand's width off the floor whatever height the stand is set to.
    const braceY = TOP_Y - stand + 0.16;
    const braceGeo = new BoxGeometry(legX * 2, 0.012, 0.012);
    const braces = addTo(root, new InstancedMesh(braceGeo, steelMat, 2));
    braces.castShadow = true;
    {
      const m = new Matrix4();
      [1, -1].forEach((sz, i) => {
        m.makeTranslation(0, braceY, sz * legZ);
        braces.setMatrixAt(i, m);
      });
      braces.instanceMatrix.needsUpdate = true;
    }
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

  // Hoisted to module scope, because `MACHINE_PANEL_Y` is derived from them and
  // a second copy here would drift the first time the panel moved.
  const panelY = ROW_Y;
  const rowZ = ROW_Z;

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
  const keyW = ROW_W / keys * 0.78;
  const keyGeo = new BoxGeometry(keyW, 0.004, 0.016);
  const stepXs: number[] = [];
  for (let i = 0; i < keys; i++) {
    stepXs.push(-ROW_W / 2 + (ROW_W / keys) * (i + 0.5));
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

  const runner = createMachineRunner(opts.events, opts.beatsPerBar, keys, opts.startedAt);

  const machine: DrumMachine = {
    root,

    update(now: number): void {
      if (!Number.isFinite(now)) return;
      /**
       * Dark until somebody starts it, and dark again once they stop it.
       *
       * The whole of the "cause" half of §8.1 lives in this branch. A panel
       * that steps from the first frame is a machine that started itself, and
       * the player's hand arriving on the downbeat is then a hand pressing a
       * button that demonstrably does nothing.
       */
      if (!runner.running(now)) {
        for (let i = 0; i < VOICE_ROWS; i++) voiceLit[i]!.visible = false;
        lit.visible = false;
        return;
      }
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
