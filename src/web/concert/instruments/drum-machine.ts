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
  AdditiveBlending, BoxGeometry, Color, CylinderGeometry, DataTexture, Group,
  InstancedMesh, LinearFilter, Matrix4, Mesh, MeshStandardMaterial, PointLight,
  RGBAFormat, SRGBColorSpace, Sprite, SpriteMaterial, Vector3,
} from 'three';

import { Rng } from '../../../core/rng.js';
import { disposeTree } from './synth-rig.js';
import { addTo } from './types.js';

export type MachineKind = 'box' | 'programmed' | 'sequencer';

/**
 * Case size, per kind — and it is per kind because these are not the same
 * object at two finishes.
 *
 * The comment that used to sit here said "a Mini Pops is about 30 × 20 cm and a
 * TR-808 half again as wide", and then both kinds were built at 34 × 21: the
 * distinction was written down, argued for, and never reached the geometry. A
 * TR-808 is 51 × 30 cm, a LinnDrum 48 × 38, a CR-78 45 × 26. Against a Mini
 * Pops at 32 × 20 that is not a nuance — the programmable machines are half as
 * wide again as the preset ones and they read as a different class of object
 * across a room, which is exactly the distinction §8.0 wants an audience to
 * make between an organ accessory and a piece of studio equipment.
 *
 * The preset box stays where it was, because it was already right.
 */
const CASE = {
  box: { w: 0.34, d: 0.21, h: 0.075 },
  programmed: { w: 0.50, d: 0.30, h: 0.085 },
  sequencer: { w: 0.50, d: 0.30, h: 0.085 },
} as const satisfies Record<MachineKind, { w: number; d: number; h: number }>;

/** How far the panel tilts up toward the player. Enough to read, not a lectern. */
const TILT = 0.22;

/** Sixteen steps, because that is what a bar of *this* music usually is. */
const STEPS = 16;

/** What one step of a step row is worth. A sixteenth, on every machine here. */
const STEP_BEATS = 0.25;

/**
 * How many of a row's lamps are in the cycle, given the meter.
 *
 * A sixteen-step machine playing a 3/4 bar uses twelve steps and leaves four
 * dark, because twelve sixteenths is the bar — that is what the hardware does
 * and what the player programming it would have done. Above sixteen the row
 * simply runs out and wraps mid-bar, which is also what the hardware does and
 * is why this caps rather than stretching.
 */
export function liveSteps(row: number, beatsPerBar: number): number {
  return Math.max(1, Math.min(row, Math.round(beatsPerBar / STEP_BEATS)));
}

/**
 * The row of keys along the front, in the tilted case's own frame: how wide it
 * is, how far up the panel, and how far forward.
 *
 * A function of the case rather than three constants, because the case stopped
 * being one size — and everything downstream of it has to move with it or the
 * hand lands on a lid.
 */
function row(kind: MachineKind): { w: number; y: number; z: number } {
  const c = CASE[kind];
  return { w: c.w - 0.05, y: c.h + 0.001, z: -c.d / 2 + 0.045 };
}

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
 * Derived rather than written down, because the case is *tilted*: the row sits
 * on a panel turned `TILT` toward the player, and rotating it about `x` drops it
 * and pulls it nearer by amounts nobody would guess and nobody would notice
 * being stale.
 *
 * `z` is negative, and that is the row facing its player: the box's local `+z`
 * runs away from them, so its front row is on their side of the case.
 *
 * Takes the kind for the reason `row` does. It was three constants while every
 * machine was one size; a 16 cm difference in width and 9 cm in depth is a hand
 * placed on the wrong part of the box.
 */
export function machinePanel(kind: MachineKind): { w: number; y: number; z: number } {
  const r = row(kind);
  return {
    w: r.w,
    y: r.y * Math.cos(TILT) + r.z * Math.sin(TILT),
    z: r.z * Math.cos(TILT) - r.y * Math.sin(TILT),
  };
}

/**
 * How fast a struck lamp falls back to dark, in beats, and where it is called
 * dark enough to stop drawing.
 *
 * A time constant rather than a window, because a lamp does not switch off. The
 * first version of this was a window — lit for `FLASH` beats, then not — and it
 * read as the panel changing texture rather than as anything lighting up, which
 * is the one thing these lamps exist to do. The rig this machine sometimes
 * lives inside already knew that and said so in a comment, about its LFO lamp
 * and not about this.
 *
 * Measured in **beats**, so the flashes tighten as the tempo climbs. That is
 * the right frame for a machine: the thing decaying is the impression of a hit,
 * and hits arrive in beats.
 *
 * `DECAY` is short enough that two sixteenths do not merge and long enough to
 * survive a frame at 30 fps. `DARK` is four time constants — below it there is
 * nothing on the screen worth a draw call.
 */
const DECAY = 0.17;
const DARK = 0.02;

/**
 * How much of a lamp's brightness is the hit landing at all, and how much is
 * how hard it was hit.
 *
 * A ghost note has to be visibly weaker than a downbeat and still visibly
 * *there* — a lamp that goes to a tenth on a light note has not reported it, it
 * has hidden it. So velocity moves the top three quarters and the bottom
 * quarter is the fact of the hit.
 */
const FLOOR = 0.25;

/**
 * What a voice lamp's `emissiveIntensity` is at full level.
 *
 * A shade above the 1.5 the old switched lamp sat at, because that value was
 * every lamp's brightness and this one is only the loudest note's — a pattern
 * lit at its own velocities is dimmer on average than the same pattern lit flat,
 * and matching the old peak would have made the panel quieter overall while
 * claiming to have made it more expressive.
 */
export const VOICE_GLOW = 1.9;

/**
 * The halo over the panel, and the light it throws on what is around it.
 *
 * ## Why a panel full of lamps was not enough
 *
 * There is no bloom and no tone mapping in this renderer, and no instrument in
 * the show owns a light — every lamp on every rig is an emissive material,
 * which here is flat bright colour and nothing else. A lit step is therefore a
 * few pixels of brighter plastic on a panel that faces its player and tips only
 * about twelve degrees toward the house. Adding a fourth row of lamps buys
 * nothing, and the reason is not about the panel:
 *
 * > Every other object on this stage is lit by the room and therefore belongs
 * > to it. The machine was lit by the room and gave nothing back, and an object
 * > that only receives light is scenery whatever is printed on its front.
 *
 * ## Two things, doing two different jobs
 *
 * **The halo** is a sprite, so it faces the camera from every seat and never
 * foreshortens — which a card lying on the tilted panel does to nothing the
 * moment the director takes a side angle, and side angles are most of the
 * evening. It is what makes the panel read as *on* from the back of the room.
 *
 * **The spill** is a real point light, and it is the half that makes the object
 * belong: the case, the top of its own stand and the near hand of whoever is
 * working it pick up the machine's orange and move with the pattern. That is
 * the thing no amount of emissive can fake, because emissive lights nothing.
 *
 * `SPILL_DECAY` is 1, not the physical 2. The lighting rig already takes this
 * liberty — its warm lamp runs at 0.5 — and the reason is the same: a square
 * law from a source 15 cm off the case makes a hotspot on the lid and nothing
 * at the hand 30 cm away, which is a bright bulb rather than a lit corner.
 * `SPILL_RANGE` then stops it dead before it can reach the player's face or the
 * boards, so this is a machine glowing at its own gear and not a lamp on stage.
 */
const HALO_SIZE = 0.30;
const HALO_ALPHA = 0.85;
const SPILL_PEAK = 0.06;
const SPILL_RANGE = 1.3;
const SPILL_DECAY = 1;

/**
 * How much of the glow is simply "this machine is running" and how much is the
 * pattern hitting.
 *
 * Not all pattern, because the step lamp walks the row whether or not anything
 * lands on it, and that is the light that says *nobody is driving this* — §8.1's
 * consequence half is a machine running, not a machine responding. A glow that
 * went fully dark between hits would contradict the one lamp on the panel that
 * never stops.
 */
const GLOW_IDLE = 0.28;

/**
 * A round soft blob, as bytes rather than through a canvas.
 *
 * `DataTexture` for the reason `performer-assets.ts` gives for its splat: it
 * exists in Node, so building a machine stays possible headlessly. 32 square is
 * plenty for something that is pure gradient and never seen sharp.
 */
function makeHaloTexture(): DataTexture {
  const N = 32;
  const data = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = (x + 0.5) / N - 0.5;
      const dy = (y + 0.5) / N - 0.5;
      const r = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2);
      // Squared falloff with a hot middle: the same shape a small lamp seen
      // through air actually has, and it keeps the sprite from having an edge.
      const a = (1 - r) * (1 - r);
      const o = (y * N + x) * 4;
      data[o] = 255;
      data[o + 1] = Math.round(255 * (0.52 + 0.42 * a));
      data[o + 2] = Math.round(255 * (0.22 + 0.30 * a));
      data[o + 3] = Math.round(255 * a);
    }
  }
  const tex = new DataTexture(data, N, N, RGBAFormat);
  tex.colorSpace = SRGBColorSpace;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

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
  events: readonly { beat: number; velocity?: number; voice?: string }[],
  beatsPerBar: number, steps: number,
  /** See `DrumMachineOptions.startedAt`. Absent means "from its own first event". */
  startedAt?: number,
): {
  step(now: number): number;
  level(i: number, now: number): number;
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
      /**
       * How bright this one lands. Absent velocity is a full hit, which is the
       * only safe reading: a lamp that assumed silence for want of a number
       * would go dark on a whole pattern rather than on one note.
       */
      peak: FLOOR + (1 - FLOOR) * Math.min(Math.max(e.velocity ?? 1, 0), 1),
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
  /**
   * When each lamp was last struck and how hard, which is all a decay needs.
   *
   * Two arrays rather than a running level, because a level would have to be
   * integrated every frame and would therefore depend on how often it was
   * asked. This way the answer at a given beat is the same answer whether it
   * was reached at 30 fps, at 120, or by dragging a scrubber.
   */
  const struckAt = [-1e9, -1e9, -1e9];
  const struckAmp = [0, 0, 0];
  let lastNow = -1e9;

  const advance = (now: number): void => {
    if (now < lastNow) {
      cursor = 0;
      struckAt.fill(-1e9);
      struckAmp.fill(0);
    }
    lastNow = now;
    while (cursor < hits.length && hits[cursor]!.beat <= now) {
      const hit = hits[cursor]!;
      struckAt[hit.lamp] = hit.beat;
      struckAmp[hit.lamp] = hit.peak;
      cursor++;
    }
  };

  return {
    lamps: 3,
    /**
     * The position light, which runs whether or not this step has anything in
     * it. That is the difference between a machine *running* and a machine
     * responding, and it is the one that says nobody is driving this.
     *
     * **One step is a sixteenth, always.** It used to be "a bar divided by
     * however many lamps there are", which is right in 4/4 by coincidence and
     * wrong everywhere else: a sixteen-lamp row spread over a 3/4 bar advances
     * every three sixteenths of a beat, which is not a subdivision of anything
     * and does not land on a single note it is supposedly showing. A machine
     * counts its own clock and wraps at the end of its own row — so in 4/4 it
     * comes round with the bar, in 3/4 it comes round with the bar because the
     * caller lit twelve lamps, and in anything else it drifts against the bar
     * exactly as the hardware does.
     */
    step(now: number): number {
      advance(now);
      const at = Math.floor(now / STEP_BEATS) % steps;
      return at < 0 ? at + steps : at;
    },
    /**
     * How lit lamp `i` is, 0 to 1: the hit's own brightness falling away
     * exponentially from the beat it landed on.
     *
     * Returning a number rather than a boolean is the whole of the fix. Both
     * drawings of this machine — the box on its stand and the bay in a modular
     * cabinet — read this, so neither can hold an opinion about what "lit"
     * means, and a lamp cannot be crude in one of them and not the other.
     */
    level(i: number, now: number): number {
      advance(now);
      const since = now - struckAt[i]!;
      if (since < 0) return 0;
      const lit = struckAmp[i]! * Math.exp(-since / DECAY);
      return lit < DARK ? 0 : lit;
    },
    running(now: number): boolean {
      return now >= from && now < to;
    },
  };
}

export interface DrumMachine {
  root: Group;
  /**
   * Where its lead leaves the case, in the machine's own frame.
   *
   * The same idea as `InstrumentModel.outlet` and deliberately not that type: a
   * machine is not an `InstrumentModel` and the whole top of this file is about
   * why. What the two have in common is only that both are objects with a
   * socket on the back, which is not an interface worth inventing.
   */
  outlet: Vector3;
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
  const { w: CASE_W, d: CASE_D, h: CASE_H } = CASE[opts.kind];
  const { w: ROW_W, y: ROW_Y, z: ROW_Z } = row(opts.kind);
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
  /**
   * A material *per* voice lamp, unlike every other lit thing in this file.
   *
   * Three lamps decaying from three different hits at three different rates is
   * three brightnesses on one frame, and `emissiveIntensity` lives on the
   * material. Three materials for three 13 mm cubes is a fair price; the shared
   * one is what forced the old boolean, since the only thing three meshes on one
   * material can differ in is whether they are drawn at all.
   */
  const voiceOnMats = [0, 1, 2].map(() => new MeshStandardMaterial({
    color: '#ff5a4a', emissive: '#ff3b28', emissiveIntensity: 0, roughness: 0.35,
  }));

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

  // From `row(kind)`, because `machinePanel` is derived from the same thing and
  // a second copy here would drift the first time the panel moved.
  const panelY = ROW_Y;
  const rowZ = ROW_Z;

  /**
   * Sixteen steps on a programmable machine, and on a preset one a row of
   * rhythm-name buttons that is *not* a step row and no longer pretends to be.
   *
   * The old note here admitted the lie and kept it: a Mini Pops has no moving
   * position light, it has one selected rhythm and a tempo lamp, and the row
   * was stepped anyway because "one blinking lamp at stage distance is
   * invisible". That reason has now been paid off — §8.3 gave this object a
   * halo and a light of its own, and the halo pulses with the pattern. A single
   * lamp is no longer invisible, so the preset box can do what the real one
   * does: light the rhythm somebody chose, and leave it lit.
   *
   * Which is also the better *reading*. A preset box has one decision on its
   * front — which rhythm — and a lamp sitting on `BOSSA NOVA` for four minutes
   * says that. A position crawling along a row of rhythm names says the
   * machine is stepping through *the names*, which is not a thing.
   */
  const keys = preset ? 10 : STEPS;
  const keyW = ROW_W / keys * 0.78;
  const keyGeo = new BoxGeometry(keyW, 0.004, 0.016);
  /**
   * Step 0 at the player's **left**, which is the case's local `+x`.
   *
   * It used to be `-x`, and that put step one under their right hand and ran
   * the sequence backwards under it. The panel faces local `-z` (see
   * `machinePanel`), so the person working it stands on the `-z` side looking
   * toward `+z`; their right is therefore local `-x` and their left is `+x`.
   * Every step sequencer ever built starts at the operator's left, and the
   * lamp walking the other way is the one detail that makes the object read as
   * a prop with lights on rather than as a machine counting.
   *
   * From the house it can still run either way, and that is not this file's
   * business to fix: which side of a player their own box stands on decides it,
   * and a real stage has exactly the same property.
   */
  const stepXs: number[] = [];
  for (let i = 0; i < keys; i++) {
    stepXs.push(ROW_W / 2 - (ROW_W / keys) * (i + 0.5));
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

  /**
   * The one that moves — or on a preset box, the one that does not.
   *
   * A single mesh either way: reparked each time the step changes on a machine
   * that steps, and parked once on the rhythm this box is set to on a machine
   * that has no steps to walk. Drawn from the seed, so a given box is set to a
   * given rhythm for the evening rather than choosing again every frame.
   */
  const lit = addTo(shell, new Mesh(new BoxGeometry(keyW, 0.005, 0.017), lampOnMat));
  const chosen = preset ? rng.int(0, keys - 1) : 0;
  lit.position.set(stepXs[chosen]!, panelY + 0.001, rowZ);
  lit.visible = false;

  /**
   * How many lamps are actually in the cycle. See `liveSteps`.
   *
   * A preset box has none — its row is a menu, not a clock.
   */
  const cycle = preset ? 0 : liveSteps(keys, opts.beatsPerBar);

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
  const voiceLit: Mesh[] = voiceXs.map((x, i) => {
    const lamp = addTo(shell, new Mesh(new BoxGeometry(0.013, 0.005, 0.013), voiceOnMats[i]!));
    lamp.position.set(x, panelY + 0.001, voiceZ);
    lamp.visible = false;
    return lamp;
  });

  // --- What it puts back into the room -------------------------------------

  /**
   * Both parked over the middle of the front row, a hand's depth above it.
   *
   * Above rather than on: a halo at the surface is half-buried in the panel it
   * is supposed to be coming off, and a light at the surface grazes the lid
   * instead of lighting it. Four centimetres is enough for both and low enough
   * that neither clears the case when seen from the side.
   */
  const haloTex = makeHaloTexture();
  const haloMat = new SpriteMaterial({
    map: haloTex,
    color: '#ff9b3a',
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    fog: false,
  });
  const halo = addTo(shell, new Sprite(haloMat));
  halo.position.set(0, panelY + 0.04, rowZ + 0.02);
  halo.scale.setScalar(HALO_SIZE);
  halo.visible = false;

  const spill = addTo(shell, new PointLight('#ff8c2e', 0, SPILL_RANGE, SPILL_DECAY));
  spill.position.copy(halo.position);
  // Never. A 4 mm lamp casting shadows of a keyboard player across the boards
  // is the machine claiming to be a lantern, and it is a shadow map nobody
  // asked for on the one tier this feature has to survive.
  spill.castShadow = false;

  // --- What it is playing --------------------------------------------------

  const runner = createMachineRunner(
    opts.events, opts.beatsPerBar, Math.max(1, cycle), opts.startedAt);

  /**
   * The socket, on the back of the case at the end away from the player.
   *
   * Written in the *tilted* case's frame and then rotated out of it, for the
   * same reason `MACHINE_PANEL_Y` is derived rather than measured: the shell is
   * turned `TILT` about x, and a number typed straight into the root frame goes
   * stale the moment that angle changes, invisibly, because a jack 8 mm inside
   * a case still looks like a jack.
   */
  const jack = new Vector3(CASE_W * 0.32, CASE_H * 0.45, CASE_D / 2);
  const outlet = new Vector3(
    jack.x,
    jack.y * Math.cos(TILT) + jack.z * Math.sin(TILT),
    jack.z * Math.cos(TILT) - jack.y * Math.sin(TILT),
  );

  const machine: DrumMachine = {
    root,
    outlet,

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
        halo.visible = false;
        spill.intensity = 0;
        return;
      }
      let loudest = 0;
      for (let i = 0; i < VOICE_ROWS; i++) {
        const level = runner.level(i, now);
        // Off the screen entirely below the runner's own floor, rather than
        // drawn at an intensity nothing can see. A dark lamp is not a dim one.
        voiceLit[i]!.visible = level > 0;
        voiceOnMats[i]!.emissiveIntensity = VOICE_GLOW * level;
        if (level > loudest) loudest = level;
      }
      // A stepping machine walks its row; a preset one sits on the rhythm it is
      // set to, and `lit` was parked there at build time.
      if (cycle) lit.position.x = stepXs[runner.step(now)]!;
      lit.visible = true;

      /**
       * The loudest lamp, not their sum: a kick and a hat landing together are
       * one flash of light on the case and not two. Summing made a backbeat
       * twice as bright as the same backbeat played on its own, which is the
       * machine reporting its own arrangement rather than its own level.
       */
      const glow = GLOW_IDLE + (1 - GLOW_IDLE) * loudest;
      haloMat.opacity = HALO_ALPHA * glow;
      // A hit widens the halo as well as brightening it, which is what stops
      // the flash reading as the same lamp on a dimmer.
      halo.scale.setScalar(HALO_SIZE * (0.82 + 0.30 * glow));
      halo.visible = true;
      spill.intensity = SPILL_PEAK * glow;
    },

    dispose(): void {
      disposeTree(root);
      // Not in the tree's material list — `Material.dispose` leaves its maps
      // alone, and this one is built per machine rather than shared.
      haloTex.dispose();
    },
  };

  return machine;
}
