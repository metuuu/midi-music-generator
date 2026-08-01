/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The rig — everything a synthesiser is *except* its keys.
 *
 * ## Why this seam exists
 *
 * `synth.ts` used to draw one object and say so in its own docstring: thirty-odd
 * catalogue entries land on it, so it "deliberately does *not* try to be a
 * particular instrument", because a Minimoog silhouette would be a lie on two
 * thirds of the parts staged on it.
 *
 * That reasoning is sound where a synthesiser is a synthesiser. It fails where
 * the synthesiser *is* the period, and measurement is what settled it: across
 * ten synth-genre concerts, **49% of all performers were this one archetype**,
 * against 14% for the commonest model in an iskelmä band. A typical stage came
 * out as `drumkit, synth, harp, synth, synth, synth, synth` — five identical
 * people behind five identical trestle tables. Nothing was broken. It simply
 * did not look like a band.
 *
 * The generic model is still the right answer to "which synthesiser is this
 * pad patch" — that question has no answer. It is the wrong answer to "what did
 * a synthesiser look like", because that question has three, and they share
 * almost no geometry:
 *
 *  - **1972–77** a cabinet of patch cables the player stands inside; the
 *    keyboard is a small controller in front of a wall.
 *  - **1978–83** a keyboard *is* the instrument — wooden end-cheeks, one row of
 *    knobs, an X-stand.
 *  - **1984–90** a thin plastic slab with membrane buttons and no knobs at all,
 *    usually two of them stacked on a double stand.
 *
 * ## What is on which side of it
 *
 * **The keys stay in `synth.ts`.** They are the only part `resolve` touches, and
 * `resolve` is required to be pure, cheap and identical for the same point on
 * every replay. Nothing here may move them, and nothing here is consulted about
 * where a hand goes — which is exactly what makes three rigs safe to build in
 * parallel against one unchanged contract.
 *
 * **Everything else is a rig**: the case the keys sit in, the control surface,
 * the patch bay, the wheels, and whatever holds it off the floor. A rig is
 * geometry and nothing more. It gets told where the playing surface is so it can
 * build around it, and it is told nothing whatsoever about the music.
 *
 * The year comes from `Concert.year` by way of `InstrumentBuildOptions.year` —
 * a year rather than an era id, because era ids are genre-local and what an
 * instrument looks like is a fact about a decade. See `EraProfile.year`.
 */

import type { BufferGeometry, InstancedMesh, Material, Object3D } from 'three';
import {
  BoxGeometry, CylinderGeometry, Group, Matrix4, Mesh, Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import type { BoardSpec } from '../../../concert/instruments.js';

/**
 * An extra board as a rig sees it: the layout table's entry, plus the one thing
 * about it only the keyboard can measure.
 *
 * `BoardSpec.range` says which notes are on it and `boardWidth` in `synth.ts`
 * turns that into metres, using a white key's own width — which lives with the
 * keys and should stay there. A rig that wanted a case around one of these
 * boards would otherwise have to guess, and a guess is a case whose end caps
 * are a centimetre out from the keybed they are supposed to wrap.
 *
 * It is a measurement of the keybed like every other field here, and it is
 * handed over for the same reason: a rig cannot ask, and must not assume.
 */
export type RigBoard = BoardSpec & {
  /** Width of this board's keybed, in metres. */
  width: number;
};

/**
 * Where the keys are, so a rig can be built around them without being able to
 * move them.
 *
 * Every field is a measurement of the keybed `synth.ts` owns. A rig reads them
 * and must not assume any of them are constant — they are passed rather than
 * imported precisely so that a change to the keyboard cannot silently leave a
 * case sized for the old one.
 */
export interface SynthRigOptions {
  /** Deterministic per performer. Vary finish and small proportions with it. */
  seed: number;
  /** Body colour hint from the venue palette. A rig may ignore it. */
  finish?: string;
  /** Width of the playable keybed, in metres. The case should span at least this. */
  boardWidth: number;
  /** Y of the white key tops — the playing surface. */
  keyTopY: number;
  /** Z of the back edge of the keys. The panel and everything behind sits at greater z. */
  keyBackZ: number;
  /** Length of a white key, front to back, so a case can be sized around it. */
  whiteLength: number;
  /**
   * The extra keyboards this station carries, beyond the one under the hands.
   *
   * A modular frame or a digital stack, and never a polysynth — see
   * `SynthRigSpec.maxBoards`. The rig's job is to hold them up: the keys
   * themselves belong to `synth.ts` on the other side of this seam, and a rig
   * that moved one would break the contact its own choreography was written
   * against.
   *
   * There is one of these when the music asked for one, which is what
   * `boardsWanted` in `concert/cast.ts` decides — a second part to put on it, or
   * a part that has to split across two keyboards. A rig is never handed a board
   * that nobody will play on.
   *
   * Board 0 is deliberately not in here. It sits on whatever this rig already
   * builds for it, and passing it would invite a second shelf under the one
   * keyboard that already has one.
   */
  extraBoards?: readonly RigBoard[];
  /**
   * A machine this rig *contains*, if the band's is mounted here.
   *
   * The clue is in the name: a modular is a frame with modules in it, chosen
   * for what the band needs, and a rhythm box is one of the things a band
   * needed. Where the person working the machine is the person standing at this
   * rig, the honest object is a percussion module in the cabinet next to the
   * oscillators — not a second box balanced on the end of the stand.
   *
   * A rig that has no bay for one ignores this and the machine is mounted
   * externally instead; see `StageMachine.mount`. The events are the pattern,
   * because the object holds its own pattern — see `createMachineRunner`.
   */
  machine?: {
    kind: 'box' | 'programmed' | 'sequencer';
    /**
     * When each note of the figure lands, in beats. Pitch is deliberately not
     * here: a step lamp knows a step fired and how hard, exactly as `react`
     * knows a note happened and not which one.
     */
    events: readonly { beat: number; velocity: number }[];
    beatsPerBar: number;
    /** The beat a hand starts it. Dark before then — see `DrumMachineOptions`. */
    startedAt?: number;
  };
}

export interface SynthRig {
  /**
   * Everything but the keys, at the model's own origin. `synth.ts` adds this
   * under the root and never reparents or moves it.
   */
  group: Group;
  /**
   * The rig's own response to the instrument being played — a level LED
   * flickering, a mod wheel leaning, a tape reel turning.
   *
   * Here rather than in `synth.ts` because it is the rig's own furniture that
   * moves, and a rig that owns a light should own what the light does. Note
   * what is *not* passed: no pitch, no layer, no section. A rig learns that a
   * note happened and how hard, which is all a panel lamp knows too.
   *
   * `force` is 0..1; `now` is the song position in beats, from the one clock —
   * do not keep your own.
   */
  react?(force: number, now: number): void;
  /**
   * Where this rig's lead plugs in, in the model's own frame.
   *
   * `InstrumentModel.outlet` for a synthesiser used to be one point written in
   * `synth.ts` — "out of the back of the rig at knee height, which is true of
   * all three rigs" — and it was true of none of them. A polysynth at knee
   * height behind the keys is a hand's width of air between two stand tubes; a
   * slab is 40 cm higher than that; a modular has a console filling the space,
   * so the lead started *inside* the cabinet and came out through the side of
   * it. All three drew a cable that began in mid-air, which is worse than no
   * cable at all — see the top of `cables.ts`.
   *
   * A rig is the only thing that knows where its own back panel is, so a rig is
   * what answers. `mountOutlet` puts a socket plate there in the same call, so
   * the point a lead starts from and the object it appears to start from cannot
   * drift apart: the plate is the reason the number is right.
   *
   * Absent falls back to the old point, which is what `buildBareRig` gets and
   * nothing staged ever does.
   */
  outlet?: Vector3;
  /**
   * Optional per-frame settle, in beats from the one clock — decay whatever
   * `react` displaced. Most rigs have nothing and should omit it.
   */
  update?(now: number): void;
  /** Release GPU resources. `disposeTree` below is almost always the whole of it. */
  dispose(): void;
}

export type SynthRigBuilder = (opts: SynthRigOptions) => SynthRig;

/**
 * Where a board sits, as one matrix: board-local → the model's own frame.
 *
 * Shared for the same reason `BoardSpec` is one table. The keys are placed with
 * it in `synth.ts` and the case, shelf or arms that hold them up are placed with
 * it here, so a board and the furniture under it cannot come out at different
 * angles — which is precisely what a second copy of this composition would
 * eventually produce.
 *
 * The pitch turns about the key line rather than the board's origin, and that is
 * the whole subtlety of it: a board's frame has its origin on the floor, so a
 * rotation about `+x` there would swing a keyboard a metre away bodily toward
 * the player instead of tilting it in place. `keyTopY` and `keyBackZ` are passed
 * rather than imported because they are the keyboard's measurements and a rig is
 * handed them for everything else too — see `SynthRigOptions`.
 *
 * A board with no pitch composes exactly the matrix this file's callers composed
 * before the field existed, down to the multiplication, so nothing flat can have
 * moved.
 */
export function placeBoard(
  board: { at: readonly [number, number, number]; yaw: number; pitch: number },
  keyTopY: number,
  keyBackZ: number,
): Matrix4 {
  const place = new Matrix4()
    .makeRotationY(board.yaw)
    .setPosition(board.at[0], board.at[1], board.at[2]);
  if (!board.pitch) return place;
  return place
    .multiply(new Matrix4().makeTranslation(0, keyTopY, keyBackZ))
    .multiply(new Matrix4().makeRotationX(board.pitch))
    .multiply(new Matrix4().makeTranslation(0, -keyTopY, -keyBackZ));
}

/**
 * How far the jack barrels stand out of the plate. The lead starts here.
 *
 * A socket is a hole and a lead ends in a plug, and the plug is what sticks
 * out — so the curve has to begin a plug's length clear of the panel or it
 * starts inside the case and the first centimetre of rubber is invisible.
 */
const OUTLET_PROUD = 0.013;

/**
 * Bolt a socket plate on the back of a case, and say where its lead starts.
 *
 * One object for all three rigs, and the reason is the same as `placeBoard`'s:
 * two copies of "where does a cable leave this thing" is two answers, and the
 * one nobody checked is the one that draws a lead hanging in the air 8 cm
 * behind a keyboard. A rig says where its back panel is; this decides what a
 * socket looks like and how far a plug stands off it.
 *
 * `at` is the panel face, in the rig's own frame, and `+z` is out of it —
 * every rig here is built with the keys at the front and everything else
 * behind, so the back of a case always faces upstage. Two jacks rather than
 * one because the instruments in this pool are all stereo or have a phones
 * socket beside the output, and a lone hole reads as a repair.
 */
export function mountOutlet(target: Object3D, mat: Material, at: Vector3): Vector3 {
  const plate = new BoxGeometry(0.058, 0.036, 0.006);
  plate.translate(0, 0, 0.002);
  const barrel = new CylinderGeometry(0.0075, 0.0075, OUTLET_PROUD, 8);
  const parts: BufferGeometry[] = [plate];
  for (const side of [1, -1]) {
    const jack = barrel.clone();
    jack.rotateX(Math.PI / 2);
    jack.translate(side * 0.014, 0, OUTLET_PROUD / 2);
    parts.push(jack);
  }
  barrel.dispose();
  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  if (!merged) return at.clone();

  const mesh = new Mesh(merged, mat);
  mesh.name = 'rig:outlet';
  mesh.position.copy(at);
  mesh.castShadow = true;
  target.add(mesh);
  return at.clone().add(new Vector3(0, 0, OUTLET_PROUD));
}

/**
 * Free every geometry and material under a subtree, once each.
 *
 * Shared rather than copied into each rig: a set per resource is the only way to
 * dispose a tree where an instanced mesh and a plain one hold the same material,
 * and four independent versions of that is four chances to leak.
 */
export function disposeTree(root: Object3D): void {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  root.traverse((o) => {
    const mesh = o as Partial<Mesh> & Partial<InstancedMesh>;
    if (mesh.geometry) geometries.add(mesh.geometry);
    const m = mesh.material;
    if (Array.isArray(m)) for (const one of m) materials.add(one);
    else if (m) materials.add(m);
    if ((o as InstancedMesh).isInstancedMesh) (o as InstancedMesh).dispose();
  });
  for (const g of geometries) g.dispose();
  for (const m of materials) m.dispose();
  root.clear();
}

/**
 * An empty rig — keys on nothing.
 *
 * Never staged. It exists so that a rig builder can be swapped out or fail to
 * load without taking the keyboard down with it, and so the dispatcher below has
 * something total to return.
 */
export const buildBareRig: SynthRigBuilder = () => {
  const group = new Group();
  group.name = 'synth-rig-bare';
  return { group, dispose: () => disposeTree(group) };
};

/**
 * The boundaries between the three rigs, as years.
 *
 * 1978 is the Prophet-5 — the first polyphonic synthesiser with a memory, and
 * the year the instrument stopped being a cabinet and became a keyboard. 1984 is
 * the DX7 shipping in volume, which is when the knobs went away. Both are real
 * discontinuities in what the object looked like rather than round numbers, and
 * a show whose era lands either side of one should stage a different prop.
 *
 * Anything earlier than the first boundary is modular; anything later than the
 * second is digital. Ambient's `tape` era (1978) lands on polysynth and its
 * `hybrid` era (2006) on digital, which is why this is a year and not a switch
 * over this genre's three era ids.
 */
export const POLYSYNTH_FROM = 1978;
export const DIGITAL_FROM = 1984;
