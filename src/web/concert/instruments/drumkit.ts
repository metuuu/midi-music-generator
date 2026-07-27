/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The drum kit — the model the audience actually watches.
 *
 * Everything else on this stage can be approximately right and still read. The
 * kit cannot: a drummer whose left hand goes to the snare on two and four and
 * whose right hand crosses to the hats is the single clearest evidence that the
 * visuals are being driven by the notes rather than decorating them. So the
 * layout below is a real right-handed kit rather than a convenient arc, and
 * the sides matter.
 *
 * **Which way round.** The kit is built in its own frame with the drummer
 * behind it at `-z`, facing `+z` toward the audience. A performer facing the
 * audience has their right hand toward `-x` (see the rotation convention in
 * `concert/types.ts`), so the *player's left* — hi-hat, crash — is at `+x` and
 * the *player's right* — floor tom, ride — is at `-x`. Watched from the front
 * that puts the hi-hat on the audience's right, which is exactly where it looks
 * like it is when you stand in front of a drummer.
 *
 * **Feet are points too.** `{ kind: 'drum', voice: 'bd' }` resolves to the kick
 * *pedal*, not to the batter head, because the pedal is where the effector has
 * to be. The head still dishes — that is `react`'s job, and the two halves of a
 * hit (the limb arriving, the thing moving because of it) are deliberately kept
 * on opposite sides of this interface.
 */

import {
  BoxGeometry, BufferGeometry, CircleGeometry, CylinderGeometry, Group,
  InstancedMesh, LatheGeometry, Material, Matrix4, Mesh, MeshStandardMaterial,
  Object3D, Quaternion, SphereGeometry, Vector2, Vector3,
} from 'three';

import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import type { DrumVoice } from '../../../core/types.js';
import {
  addTo, type Contact, type InstrumentBuilder, type InstrumentModel,
} from './types.js';

const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// The layout
// ---------------------------------------------------------------------------

/**
 * How thick the bronze is. A real cymbal is under two millimetres and at stage
 * distance that is less than a pixel, so this is deliberately generous: the
 * edge is the part of a cymbal that catches a light, and it has to have one.
 */
const CYMBAL_THICK = 0.005;

/**
 * Where the three cymbals hang, in one place because two things have to agree
 * about them: the mesh, and the strike point in `LAYOUT` below.
 *
 * `y` is the height of the *rim* — a cymbal's lathe has its outer edge at the
 * origin — and each of them clears the tallest drum head on the kit. That is
 * not a nicety. The hi-hat used to sit at 0.84, which is below the rim of a
 * tilted rack tom at 0.95: the hats disappeared into the toms from the front,
 * and a hi-hat you cannot see is a groove you cannot read.
 */
const HAT_AT = [0.56, 0.980, -0.34] as const;
const CRASH_AT = [0.52, 1.235, 0.12] as const;
const RIDE_AT = [-0.60, 1.050, -0.02] as const;

/**
 * Hat gap: shut is the two cymbals nested, open is a hand's width of daylight.
 *
 * Shut has to be about the thickness of the bronze rather than zero, because
 * both cymbals are domed the same way and a smaller number puts the top one's
 * underside through the bottom one's bell.
 */
const HAT_SHUT = CYMBAL_THICK + 0.002;
const HAT_OPEN = 0.055;

/**
 * Where each voice is struck, and which way "off the drum" points.
 *
 * One table, consulted by `resolve` and used to place the geometry, so the
 * hand and the thing it hits cannot drift apart. Nothing here varies with the
 * seed: two kits on one stage differ in finish, never in where the snare is.
 *
 * The normals lean back toward the player on the drums the drummer tilts —
 * a snare and a rack tom both face slightly uphill — which is what stops every
 * prep being a vertical lift.
 */
const LAYOUT: Record<DrumVoice, { at: readonly [number, number, number]; up: readonly [number, number, number] }> = {
  /**
   * The pedal board, not the head. A kick is played with a foot.
   *
   * The height here *is* the height of the drummer's sole: the rig places a
   * foot at the contact and pushes it half a foot back along the normal, which
   * lands the underside of the shoe exactly on this number. It used to say
   * 0.085 and the leg read as floating, because a footboard eight and a half
   * centimetres off the boards is not a footboard.
   */
  bd: { at: [-0.09, 0.052, -0.22], up: [0, 0.993, -0.118] },
  sd: { at: [0.12, 0.740, -0.50], up: [0, 0.97, -0.24] },
  /** The near rim of the same drum — a cross-stick lands on the hoop. */
  rim: { at: [0.05, 0.766, -0.64], up: [0, 0.95, -0.31] },
  /**
   * On the bow, on the near side — not on the bell. A hand hovering over the
   * middle of a cymbal is one of those small wrongnesses that makes a whole
   * kit read as a toy, and it costs nothing to put the stick where a stick goes.
   */
  hh: { at: [HAT_AT[0], HAT_AT[1] + HAT_SHUT + 0.003, -0.43], up: [0.10, 0.98, -0.15] },
  /**
   * Open hats are struck further out, on the edge — and *higher*, because the
   * top cymbal has lifted by the time the stick gets there. Two voices, two
   * heights, off one pair of numbers.
   */
  oh: { at: [HAT_AT[0] + 0.025, HAT_AT[1] + HAT_OPEN + 0.001, -0.49], up: [0.16, 0.97, -0.15] },
  lt: { at: [-0.50, 0.660, -0.30], up: [-0.12, 0.98, -0.10] },
  mt: { at: [-0.16, 0.860, 0.02], up: [-0.05, 0.95, -0.30] },
  ht: { at: [0.20, 0.900, 0.00], up: [0.05, 0.95, -0.30] },
  /** The near edge of the crash: what a drummer swings through, not the bell. */
  cr: { at: [CRASH_AT[0] - 0.02, CRASH_AT[1] + 0.007, CRASH_AT[2] - 0.14], up: [0.18, 0.96, -0.20] },
  /** The bow of the ride, two thirds out, on the side nearest the player. */
  rd: { at: [RIDE_AT[0] + 0.02, RIDE_AT[1] + 0.008, RIDE_AT[2] - 0.14], up: [-0.15, 0.97, -0.18] },
  /** A clap is not a kit piece, so the kit grows a pad for it, by the hats. */
  cp: { at: [0.40, 0.800, -0.68], up: [0, 1, 0] },
  /**
   * The shaker stands in for brushes (`core/types.ts` says so), and brushes
   * live on the snare. Resolving it just above the batter head means a jazz
   * kit's hand goes where a jazz player's hand goes, rather than into the air.
   */
  sh: { at: [0.26, 0.820, -0.56], up: [0, 1, 0] },
  /** Woodblock, clamped to the bass drum hoop on the player's right. */
  perc: { at: [-0.26, 1.103, 0.234], up: [0, 0.92, -0.40] },
  /** Cowbell, on the same bracket, struck on the shoulder. */
  cb: { at: [0.02, 1.160, 0.242], up: [0, 0.80, -0.60] },
};

/** Sticks at rest, hovering over the middle of the kit. */
const REST = { at: [0.10, 0.98, -0.52] as const, up: [0, 1, 0] as const };

/** Which drum shell each voice belongs to, for `react`. */
type ShellId = 'kick' | 'snare' | 'high' | 'mid' | 'floor' | 'pad';
const SHELL_OF: Partial<Record<DrumVoice, ShellId>> = {
  bd: 'kick', sd: 'snare', rim: 'snare', sh: 'snare',
  ht: 'high', mt: 'mid', lt: 'floor', cp: 'pad',
};

type CymbalId = 'hatTop' | 'crash' | 'ride';
const CYMBAL_OF: Partial<Record<DrumVoice, CymbalId>> = {
  hh: 'hatTop', oh: 'hatTop', cr: 'crash', rd: 'ride',
};

/**
 * How far each cymbal swings when it is struck, how long it rings for in beats,
 * and how fast it rocks in cycles per beat.
 *
 * One set of numbers for all three was the old behaviour and it was wrong in
 * both directions at once: a hi-hat that flaps like a crash, and a crash that
 * settles as fast as a hi-hat. A crash is a thin sail on a spring and it is
 * still moving a bar later; hats are clamped between a clutch and a rod.
 */
const CYMBAL_MOTION: Record<CymbalId, { swing: number; tau: number; hz: number }> = {
  hatTop: { swing: 0.05, tau: 0.30, hz: 2.6 },
  crash: { swing: 0.26, tau: 1.10, hz: 1.5 },
  ride: { swing: 0.11, tau: 0.85, hz: 1.9 },
};

// ---------------------------------------------------------------------------
// Motion primitives
// ---------------------------------------------------------------------------

/**
 * One impulse, remembered as *when* rather than as a running value.
 *
 * The pose is recomputed analytically from `now - beat` on every frame, which
 * means a seek, a restart or a dropped frame all land in the right place
 * instead of leaving something half-displaced. Nothing here integrates.
 */
class Hit {
  private beat = -1e9;
  private force = 0;

  fire(now: number, force: number): void {
    this.beat = now;
    this.force = force < 0 ? 0 : force > 1 ? 1 : force;
  }

  /** Damped oscillation about zero. `hz` is cycles per beat. */
  wobble(now: number, tau: number, hz: number): number {
    const age = now - this.beat;
    if (age < 0 || age > tau * 6) return 0;
    return this.force * Math.exp(-age / tau) * Math.cos(age * TAU * hz);
  }

  /** One-shot decay: `force` at the instant of the hit, 0 once settled. */
  decay(now: number, tau: number): number {
    const age = now - this.beat;
    if (age < 0 || age > tau * 6) return 0;
    return this.force * Math.exp(-age / tau);
  }
}

/**
 * A value that eases from one setting to another — the hi-hat gap.
 *
 * Also stored as endpoints plus a start beat rather than integrated per frame,
 * for the same reason as `Hit`.
 */
class Eased {
  private from: number;
  private to: number;
  private at = -1e9;
  constructor(private readonly span: number, initial: number) {
    this.from = initial;
    this.to = initial;
  }

  set(now: number, value: number): void {
    this.from = this.value(now);
    this.to = value;
    this.at = now;
  }

  value(now: number): number {
    const t = (now - this.at) / this.span;
    if (!(t > 0)) return this.from;
    if (t >= 1) return this.to;
    const e = t * t * (3 - 2 * t);
    return this.from + (this.to - this.from) * e;
  }
}

// ---------------------------------------------------------------------------
// Small geometry helpers
// ---------------------------------------------------------------------------

/** A shallow dome, its rim at the local origin, for a drum head. */
function headGeometry(radius: number, seg = 16): BufferGeometry {
  const phi = 0.13;
  const R = radius / Math.sin(phi);
  const g = new SphereGeometry(R, seg, 2, 0, TAU, 0, phi);
  g.translate(0, -R * Math.cos(phi), 0);
  return g;
}

/**
 * A cymbal: a flat bow with a bell in the middle, and — this is the whole fix —
 * a solid one, walked in the direction that puts its normals in the light.
 *
 * The first version was a single open lathe of the bow alone, and every cymbal
 * on the kit was invisible. `LatheGeometry` derives its normal from the
 * direction of travel along the profile, as `(dy, -dx)`; a profile walked from
 * the bell *outward and downward*, which is the way a cymbal is actually
 * shaped, therefore has normals pointing at the floor. With the default
 * `FrontSide` material that is a back face from every camera above the kit,
 * which is every camera we have, so all three cymbals rendered as the dark
 * sliver of their own edge — "thin dark ellipses", which is exactly what was
 * reported.
 *
 * So: out to the rim, back *inward* along the top face (normals up), down the
 * thickness, and back out along the underside (normals down). First point
 * equals last, so the lathe closes and the thing is solid metal rather than a
 * one-sided sheet.
 */
function cymbalGeometry(radius: number, seg = 20): BufferGeometry {
  const bell = radius * 0.16;
  /** Rim first, then inward and up to the bell. */
  const bow: ReadonlyArray<readonly [number, number]> = [
    [radius, 0],
    [radius * 0.55, bell * 0.10],
    [bell, bell * 0.24],
    [bell * 0.5, bell * 0.5],
    [0.0001, bell * 0.55],
  ];
  const points = bow.map(([r, y]) => new Vector2(r, y));
  for (let i = bow.length - 1; i >= 0; i--) {
    points.push(new Vector2(bow[i]![0], bow[i]![1] - CYMBAL_THICK));
  }
  points.push(new Vector2(radius, 0));   // up the rim, closing the loop
  return new LatheGeometry(points, seg);
}

function disposeTree(root: Object3D): void {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  root.traverse((o) => {
    const mesh = o as Partial<Mesh> & Partial<InstancedMesh>;
    if (mesh.geometry) geometries.add(mesh.geometry);
    const m = mesh.material;
    if (Array.isArray(m)) for (const one of m) materials.add(one);
    else if (m) materials.add(m);
    if (typeof (o as InstancedMesh).dispose === 'function' && (o as InstancedMesh).isInstancedMesh) {
      (o as InstancedMesh).dispose();
    }
  });
  for (const g of geometries) g.dispose();
  for (const m of materials) m.dispose();
  root.clear();
}

// ---------------------------------------------------------------------------
// The builder
// ---------------------------------------------------------------------------

export const buildDrumkit: InstrumentBuilder = (opts) => {
  const rng = new Rng(`drumkit:${opts.seed}`);
  const root = new Group();
  root.name = 'drumkit';

  // Finish varies per kit; nothing `resolve` reads does. A second kit on a
  // stage should be a different colour, never a different shape.
  const shellHue = opts.finish ?? rng.pick(['#8c2f26', '#1d2a3a', '#3d2a1b', '#6d6257', '#2b2b2e']);
  const sparkle = rng.chance(0.5);

  const shellMat = new MeshStandardMaterial({
    color: shellHue, roughness: sparkle ? 0.28 : 0.55, metalness: sparkle ? 0.35 : 0.05,
  });
  const headMat = new MeshStandardMaterial({ color: '#efe7d8', roughness: 0.75, metalness: 0 });
  const chromeMat = new MeshStandardMaterial({ color: '#c9ced6', roughness: 0.3, metalness: 0.85 });
  const brassMat = new MeshStandardMaterial({
    color: rng.pick(['#caa85c', '#c9a552', '#b89a4e']), roughness: 0.34, metalness: 0.9,
  });
  const darkMat = new MeshStandardMaterial({ color: '#17171a', roughness: 0.7, metalness: 0.1 });
  const woodMat = new MeshStandardMaterial({ color: '#8a6a3c', roughness: 0.8, metalness: 0 });

  // Geometry shared across every piece of hardware on the kit. One tube, one
  // leg, one lug — scaled and placed, never rebuilt.
  const tubeGeo = new CylinderGeometry(0.014, 0.014, 1, 8, 1, false);
  const legGeo = new CylinderGeometry(0.008, 0.008, 1, 6, 1, false);
  const lugGeo = new BoxGeometry(0.03, 0.055, 0.028);

  /**
   * Hardware.
   *
   * A kit is three dozen chrome tubes and they are all the same tube. Rather
   * than three dozen meshes, every `strut` records a transform and the lot goes
   * up as two instanced meshes at the end — the single biggest saving available
   * on this model, and the reason a whole kit draws in about forty calls.
   */
  const tubeSlots: Matrix4[] = [];
  const legSlots: Matrix4[] = [];
  const yUp = new Vector3(0, 1, 0);

  function strut(slots: Matrix4[], a: Vector3, b: Vector3): void {
    const dir = b.clone().sub(a);
    const len = Math.max(dir.length(), 1e-4);
    slots.push(new Matrix4().compose(
      a.clone().add(b).multiplyScalar(0.5),
      new Quaternion().setFromUnitVectors(yUp, dir.normalize()),
      new Vector3(1, len, 1),
    ));
  }

  /** A tripod under a cymbal or a snare: three splayed legs and a post. */
  function tripod(at: Vector3, top: number): void {
    strut(tubeSlots, new Vector3(at.x, 0.02, at.z), new Vector3(at.x, top, at.z));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + 0.4;
      strut(legSlots, new Vector3(at.x, 0.30, at.z), new Vector3(
        at.x + Math.cos(a) * 0.26, 0.01, at.z + Math.sin(a) * 0.26,
      ));
    }
  }

  // --- Drums ---------------------------------------------------------------

  const shells: Record<ShellId, { head: Mesh; hit: Hit }> = {} as never;

  /**
   * One drum, built about its own centre with the batter head at `+y`. The
   * kick is the same object rotated onto its side, which is what a kick is.
   */
  function drum(id: ShellId, radius: number, depth: number): Group {
    const g = addTo(root, new Group());

    const shell = addTo(g, new Mesh(
      new CylinderGeometry(radius, radius, depth, 20, 1, true), shellMat,
    ));
    shell.castShadow = true;
    shell.receiveShadow = true;

    for (const side of [1, -1]) {
      const hoop = addTo(g, new Mesh(
        new CylinderGeometry(radius * 1.04, radius * 1.04, 0.024, 20, 1, true), chromeMat,
      ));
      hoop.position.y = (side * depth) / 2;
    }

    const head = addTo(g, new Mesh(headGeometry(radius), headMat));
    head.name = `head:${id}`;
    head.position.y = depth / 2;
    head.receiveShadow = true;

    const back = addTo(g, new Mesh(new CircleGeometry(radius, 20), headMat));
    back.name = `shell:${id}`;
    back.rotation.x = Math.PI / 2;
    back.position.y = -depth / 2;

    shells[id] = { head, hit: new Hit() };
    return g;
  }

  // Kick: 22x16, lying on its side with the batter head toward the drummer.
  const kick = drum('kick', 0.28, 0.42);
  kick.position.set(0, 0.30, 0.15);
  kick.rotation.x = -Math.PI / 2;
  // Spurs, so it does not float.
  strut(tubeSlots, new Vector3(0.24, 0.30, 0.15), new Vector3(0.40, 0.01, 0.02));
  strut(tubeSlots, new Vector3(-0.24, 0.30, 0.15), new Vector3(-0.40, 0.01, 0.02));

  // Snare: 14x5.5, tilted a little toward the player.
  const snare = drum('snare', 0.175, 0.135);
  snare.position.set(0.12, 0.665, -0.50);
  snare.rotation.x = 0.24;
  tripod(new Vector3(0.12, 0.60, -0.50), 0.60);

  const ht = drum('high', 0.155, 0.20);
  ht.position.set(0.20, 0.795, 0.00);
  ht.rotation.x = 0.30;

  const mt = drum('mid', 0.175, 0.22);
  mt.position.set(-0.16, 0.745, 0.02);
  mt.rotation.x = 0.30;

  // The rack toms hang off one post out of the bass drum, the way they do.
  strut(tubeSlots, new Vector3(0.02, 0.55, 0.15), new Vector3(0.02, 1.02, 0.18));
  strut(tubeSlots, new Vector3(0.02, 0.95, 0.16), new Vector3(0.22, 0.90, 0.02));
  strut(tubeSlots, new Vector3(0.02, 0.95, 0.16), new Vector3(-0.16, 0.86, 0.04));

  const lt = drum('floor', 0.205, 0.36);
  lt.position.set(-0.50, 0.475, -0.30);
  lt.rotation.x = 0.10;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.7;
    strut(legSlots, new Vector3(-0.50 + Math.cos(a) * 0.20, 0.60, -0.30 + Math.sin(a) * 0.20),
      new Vector3(-0.50 + Math.cos(a) * 0.23, 0.01, -0.30 + Math.sin(a) * 0.23));
  }

  // The clap pad: a small rubber disc on a short boom by the hats.
  const padGeo = new CylinderGeometry(0.075, 0.075, 0.028, 16);
  const pad = addTo(root, new Mesh(padGeo, darkMat));
  pad.name = 'head:pad';
  pad.position.set(0.40, 0.786, -0.68);
  pad.castShadow = true;
  shells['pad'] = { head: pad, hit: new Hit() };
  strut(tubeSlots, new Vector3(0.40, 0.02, -0.68), new Vector3(0.40, 0.77, -0.68));

  // Lugs are the detail that makes a shell read as a drum, and forty separate
  // draw calls for them would be a poor trade. One instanced mesh for the kit,
  // placed through each drum's own matrix so the kick's lie on their side too.
  {
    const drums: Array<[Group, number, number]> = [
      [kick, 0.28, 8], [snare, 0.175, 8], [ht, 0.155, 6], [mt, 0.175, 6], [lt, 0.205, 6],
    ];
    const total = drums.reduce((n, d) => n + d[2], 0);
    const lugMesh = addTo(root, new InstancedMesh(lugGeo, chromeMat, total));
    const local = new Matrix4();
    let i = 0;
    for (const [g, radius, count] of drums) {
      g.updateMatrix();
      for (let k = 0; k < count; k++) {
        const a = (k / count) * TAU;
        local.makeRotationY(-a).setPosition(
          Math.cos(a) * radius * 1.03, 0, Math.sin(a) * radius * 1.03,
        );
        lugMesh.setMatrixAt(i++, g.matrix.clone().multiply(local));
      }
    }
    lugMesh.instanceMatrix.needsUpdate = true;
  }

  // --- Cymbals -------------------------------------------------------------

  const cymbals: Record<CymbalId, { mesh: Mesh; hit: Hit; tilt: number; baseY: number }> = {} as never;

  function cymbal(id: CymbalId, radius: number, at: readonly [number, number, number], lean: number): Mesh {
    const mesh = addTo(root, new Mesh(cymbalGeometry(radius), brassMat));
    mesh.name = `cymbal:${id}`;
    mesh.position.set(at[0], at[1], at[2]);
    mesh.rotation.z = lean;
    mesh.castShadow = true;
    // A cymbal is thin enough that it catches the rim light on the underside
    // too, and it is over the toms, so it is worth having it take a shadow.
    mesh.receiveShadow = true;
    cymbals[id] = { mesh, hit: new Hit(), tilt: lean, baseY: at[1] };
    return mesh;
  }

  // Hi-hat: two cymbals, and the gap between them is the whole point.
  const hatBottom = addTo(root, new Mesh(cymbalGeometry(0.17), brassMat));
  hatBottom.name = 'cymbal:hatBottom';
  hatBottom.position.set(HAT_AT[0], HAT_AT[1], HAT_AT[2]);
  hatBottom.rotation.z = -0.10;
  hatBottom.receiveShadow = true;
  const hatTop = cymbal('hatTop', 0.175, HAT_AT, -0.10);
  tripod(new Vector3(HAT_AT[0], 0.40, HAT_AT[2]), HAT_AT[1] - 0.01);

  cymbal('crash', 0.21, CRASH_AT, -0.20);
  tripod(new Vector3(0.60, 0.60, 0.22), 1.10);
  strut(tubeSlots, new Vector3(0.60, 1.10, 0.22), new Vector3(CRASH_AT[0], CRASH_AT[1] - 0.005, CRASH_AT[2]));

  cymbal('ride', 0.26, RIDE_AT, 0.17);
  tripod(new Vector3(-0.66, 0.50, 0.10), 1.00);
  strut(tubeSlots, new Vector3(-0.66, 1.00, 0.10), new Vector3(RIDE_AT[0], RIDE_AT[1] - 0.005, RIDE_AT[2]));

  // --- Cowbell and woodblock, on a bracket off the bass drum ---------------

  strut(tubeSlots, new Vector3(0.02, 0.95, 0.16), new Vector3(-0.12, 1.16, 0.22));
  const bell = addTo(root, new Mesh(new BoxGeometry(0.055, 0.10, 0.075), brassMat));
  bell.position.set(0.02, 1.12, 0.22);
  bell.rotation.x = 0.5;
  bell.castShadow = true;
  const block = addTo(root, new Mesh(new BoxGeometry(0.16, 0.05, 0.055), woodMat));
  block.position.set(-0.26, 1.08, 0.24);
  block.rotation.x = 0.4;
  block.castShadow = true;
  const aux: Record<'cb' | 'perc', { mesh: Mesh; hit: Hit; base: number }> = {
    cb: { mesh: bell, hit: new Hit(), base: 1.12 },
    perc: { mesh: block, hit: new Hit(), base: 1.08 },
  };

  // --- Pedals --------------------------------------------------------------

  /**
   * A footboard: heel plate on the boards at the player's end, toe end raised
   * toward the drum, hinged at the heel so that pressing flattens it.
   *
   * Both halves of this were wrong before and they compounded. The heel plate
   * was at the *drum* end, which is a pedal built back to front, and the board
   * sat at 0.075 with the contact 0.085 above it — and the contact is the sole
   * of the drummer's shoe, not a hint. A foot cannot be on a board that is a
   * hand's width off the floor, so the leg read as floating, which is what was
   * reported. The whole assembly now lives between 0.02 and 0.06.
   */
  const PEDAL_HEEL_Y = 0.020;
  const PEDAL_TOE_Y = 0.058;

  function pedal(id: 'kick' | 'hat', x: number, toeZ: number, heelZ: number): { board: Mesh; hit: Hit; tilt: number } {
    const len = toeZ - heelZ;
    const board = addTo(root, new Mesh(new BoxGeometry(0.10, 0.016, len), darkMat));
    board.name = `pedal:${id}`;
    board.position.set(x, (PEDAL_HEEL_Y + PEDAL_TOE_Y) / 2, (heelZ + toeZ) / 2);
    // Negative pitch lifts the `+z` end, and `+z` is the toe on both pedals.
    const tilt = -Math.atan2(PEDAL_TOE_Y - PEDAL_HEEL_Y, len);
    board.rotation.x = tilt;
    board.castShadow = true;
    const plate = addTo(root, new Mesh(new BoxGeometry(0.13, 0.012, 0.10), chromeMat));
    plate.position.set(x, 0.008, heelZ - 0.03);
    return { board, hit: new Hit(), tilt };
  }

  // Toe toward the drum, heel toward the throne — the drummer sits at `-z`.
  const kickPedal = pedal('kick', -0.09, -0.12, -0.44);
  const hatPedal = pedal('hat', 0.56, -0.36, -0.66);

  /** The beater, hinged low and swinging into the batter head. */
  const beater = addTo(root, new Group());
  beater.position.set(-0.09, 0.10, -0.10);
  const beaterRod = addTo(beater, new Mesh(legGeo, chromeMat));
  beaterRod.position.y = 0.13;
  beaterRod.scale.y = 0.26;
  const beaterHead = addTo(beater, new Mesh(new SphereGeometry(0.028, 10, 6), darkMat));
  beaterHead.position.y = 0.26;
  const BEATER_REST = -0.55;
  const BEATER_STRIKE = 0.12;
  beater.rotation.x = BEATER_REST;

  const hatGap = new Eased(0.09, HAT_SHUT);

  // --- Throne --------------------------------------------------------------

  const seatY = 0.58 + rng.float(-0.02, 0.02);
  const seat = addTo(root, new Mesh(new CylinderGeometry(0.16, 0.16, 0.07, 16), darkMat));
  seat.position.set(0, seatY, -0.95);
  seat.castShadow = true;
  strut(tubeSlots, new Vector3(0, 0.02, -0.95), new Vector3(0, seatY - 0.03, -0.95));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.9;
    strut(legSlots, new Vector3(0, 0.30, -0.95),
      new Vector3(Math.cos(a) * 0.26, 0.01, -0.95 + Math.sin(a) * 0.26));
  }

  // --- Hardware, all of it at once ----------------------------------------

  for (const [geo, slots] of [[tubeGeo, tubeSlots], [legGeo, legSlots]] as const) {
    const mesh = addTo(root, new InstancedMesh(geo, chromeMat, slots.length));
    slots.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    // Stands are thin and their shadows are noise. The drums cast; the chrome
    // catches the rim light and that is enough.
    mesh.castShadow = false;
  }

  // --- The interface -------------------------------------------------------

  function contact(spec: { at: readonly [number, number, number]; up: readonly [number, number, number] }): Contact {
    return {
      position: new Vector3(spec.at[0], spec.at[1], spec.at[2]),
      normal: new Vector3(spec.up[0], spec.up[1], spec.up[2]).normalize(),
    };
  }

  const model: InstrumentModel = {
    archetype: 'drumkit',
    root,

    resolve(point: PlayPoint): Contact | undefined {
      switch (point.kind) {
        case 'drum': {
          const spec = LAYOUT[point.voice];
          return spec ? contact(spec) : undefined;
        }
        case 'pedal':
          if (point.which === 'kick') return contact(LAYOUT.bd);
          // The same height as the kick board, for the same reason: this is
          // where the sole of the left shoe ends up.
          if (point.which === 'hat') return contact({ at: [0.56, 0.052, -0.46], up: [0, 0.993, -0.118] });
          return undefined;  // A drum kit has no sustain pedal.
        case 'rest':
          return contact(REST);
        default:
          return undefined;
      }
    },

    react(point: PlayPoint, force: number, now: number): void {
      const f = force < 0 ? 0 : force > 1 ? 1 : force;

      if (point.kind === 'pedal') {
        if (point.which === 'kick') {
          kickPedal.hit.fire(now, f);
          shells.kick.hit.fire(now, f);
        } else if (point.which === 'hat') {
          hatPedal.hit.fire(now, f);
          hatGap.set(now, HAT_SHUT);
          cymbals.hatTop.hit.fire(now, f * 0.3);
        }
        return;
      }
      if (point.kind !== 'drum') return;

      const voice = point.voice;
      if (voice === 'bd') {
        kickPedal.hit.fire(now, f);
        shells.kick.hit.fire(now, f);
        return;
      }
      // The hats answer to three different things and it matters which: a
      // closed hat shuts them, an open hat parts them, and the pedal chicks.
      if (voice === 'hh') hatGap.set(now, HAT_SHUT);
      if (voice === 'oh') hatGap.set(now, HAT_OPEN);

      const shell = SHELL_OF[voice];
      if (shell) shells[shell].hit.fire(now, voice === 'rim' ? f * 0.4 : voice === 'sh' ? f * 0.25 : f);

      const cym = CYMBAL_OF[voice];
      if (cym) cymbals[cym].hit.fire(now, voice === 'hh' ? f * 0.35 : f);

      if (voice === 'cb' || voice === 'perc') aux[voice].hit.fire(now, f);
    },

    update(now: number): void {
      // Heads dish inward on impact and flutter back. Scaling the dome about
      // its rim inverts it, which is what a struck head actually does — and the
      // factor has to stay small, because the dome is only about a centimetre
      // tall and a large one would drive the head out through the shell.
      for (const id of ['kick', 'snare', 'high', 'mid', 'floor', 'pad'] as ShellId[]) {
        const s = shells[id];
        const d = s.hit.wobble(now, 0.22, 3.2);
        if (id === 'pad') s.head.position.y = 0.786 - d * 0.010;
        else s.head.scale.y = 1 - d * 2.2;
      }

      // Cymbals rock, and they have to rock *visibly* or a struck crash reads
      // as a painted disc. Each one gets its own swing and its own ring: a
      // crash is a sail on a stick and flaps for a bar, a ride is stiffer and
      // shorter, and the hats are two cymbals clamped together and barely move
      // at all. The vertical bob is small but it is what sells the hit from
      // straight on, where a rotation about the stand is nearly invisible.
      for (const id of ['hatTop', 'crash', 'ride'] as CymbalId[]) {
        const c = cymbals[id];
        const m = CYMBAL_MOTION[id];
        const w = c.hit.wobble(now, m.tau, m.hz);
        c.mesh.rotation.z = c.tilt + w * m.swing;
        c.mesh.rotation.x = w * m.swing * 0.55;
        c.mesh.position.y = c.baseY + w * m.swing * 0.04
          + (id === 'hatTop' ? hatGap.value(now) : 0);
      }

      // A pressed board flattens onto the boards; it does not swing past them.
      kickPedal.board.rotation.x = kickPedal.tilt * (1 - kickPedal.hit.decay(now, 0.22));
      hatPedal.board.rotation.x = hatPedal.tilt * (1 - hatPedal.hit.decay(now, 0.22));
      beater.rotation.x = BEATER_REST
        + (BEATER_STRIKE - BEATER_REST) * kickPedal.hit.decay(now, 0.18);

      aux.cb.mesh.position.y = aux.cb.base - aux.cb.hit.wobble(now, 0.30, 4) * 0.012;
      aux.perc.mesh.position.y = aux.perc.base - aux.perc.hit.wobble(now, 0.30, 4) * 0.012;
    },

    station: { offset: new Vector3(0, 0, -0.95), facing: 0, posture: 'kit' },

    dispose(): void {
      disposeTree(root);
    },
  };

  return model;
};
