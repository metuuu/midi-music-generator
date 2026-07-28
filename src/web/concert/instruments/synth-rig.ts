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

import type { BufferGeometry, InstancedMesh, Material, Mesh, Object3D } from 'three';
import { Group } from 'three';

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
   * Optional per-frame settle, in beats from the one clock — decay whatever
   * `react` displaced. Most rigs have nothing and should omit it.
   */
  update?(now: number): void;
  /** Release GPU resources. `disposeTree` below is almost always the whole of it. */
  dispose(): void;
}

export type SynthRigBuilder = (opts: SynthRigOptions) => SynthRig;

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
