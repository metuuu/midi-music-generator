/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The modular — 1972–77, when a synthesiser was not a keyboard.
 *
 * A Moog System 55, an ARP 2500, an EMS Synthi 100: the instrument was a wall
 * of cabinets, and the keyboard in front of it was a *controller* — a plain box
 * of keys with a glide knob and a ribbon on it, no panel, no wheels, worth about
 * a twentieth of what stood behind it. Wheels in particular are a Minimoog
 * habit and would be an anachronism here; the 953 controller had neither.
 *
 * That inversion is the whole reason this rig exists. Everything expensive to
 * look at is *behind* the player's hands rather than under them, and that is
 * what stops a synth-genre stage reading as five people at five identical
 * tables. The three things doing the work, in order of how far away they still
 * read: the silhouette, the patch cables, and the density of small hardware.
 *
 * ## Where it is allowed to stand, and what that forces
 *
 * `SynthRigOptions` hands over the keybed's measurements and nothing else, and
 * the rule this file obeys absolutely is that **nothing occupies the band the
 * hands work in**: from `keyBackZ` forward to the key fronts, at or above the
 * key plane. A hand approaches a key from `-z` and lands on top of it, so a
 * cabinet cheek beside the keys or a lip over them would be clipped through
 * several times a bar.
 *
 * Everything the *keyboard* carries therefore lives at greater `z` than the key
 * line, and the keyboard cantilevers off the front of it. The wings are the one
 * exception and are not really an exception at all: they stand behind the
 * **player**, who is another 0.43 m upstage of the hands again, so they clear
 * the working band by the width of a person rather than by a margin. The rule
 * was previously written as "no part of it is ever forward of `keyBackZ`",
 * which is the same rule stated as a coordinate — and stating it that way is
 * what kept two 1.7 m cabinets parked between the player and the audience,
 * because that was the only place the coordinate allowed.
 *
 * The obvious build from there is a flat wall straight across the back, which is
 * what the era's photographs mostly show. It cannot be used flat, and the number
 * that rules it out is in `show.ts`: the house camera sits at **y = 1.55 m**,
 * about three and a half metres out. A sightline from there down to a key at
 * 0.95 m crosses the plane half a metre downstage of the keybed at roughly
 * **y = 1.0 m** — so any cabinet *between the camera and the keys* taller than a
 * metre hides the keyboard, the hands, and the one thing this project is
 * actually for. A modular that eats the choreography is a worse prop than a
 * trestle table.
 *
 * So the rig is a **U around the player**, and the U is honest to the
 * instrument:
 *
 *  - **A low console straight ahead of them**, its top *below the key plane*.
 *    Downstage of the keys, where the camera looks past it: anything no higher
 *    than the keys cannot cross a sightline that reaches a key from above, for
 *    any camera anywhere. It is the ARP 2500's centre section, and it is free.
 *  - **Two tall wing cabinets, upstage of the player** — `keyTopY + 0.77`, about
 *    1.7 m from the boards, which is a real System 55 with its stand. Behind
 *    them is the whole point and it was wrong until it was measured: the wings
 *    used to stand at `keyBackZ + 0.44`, which is nearly a metre *downstage* of
 *    the person, so the house spent every number looking at the backs of two
 *    cabinets with a player somewhere in the gap. A modular stands behind its
 *    player. That is what the photographs show, and it is the only arrangement
 *    in which the patch bay faces the room instead of the wall.
 *
 *    They are **aimed, not angled**, at a point on the centre line 1.6 m in
 *    front of the player: about 19° of toe-in, which is a rack turned in toward
 *    the person using it and a panel the room can still read. Aimed at the chest
 *    itself — the same instinct, applied before the cabinets moved — a wing
 *    from behind sits 51° off the house and shows the audience a patch bay in
 *    sharp profile.
 *
 * ## Patch cables
 *
 * The defining object, and the one thing here that must not be done cheaply. A
 * straight segment between two jacks reads as a wire — as *installation* — and a
 * modular in use is not wired, it is patched: a metre of stiff lead doing 30 cm
 * of work, hanging in a loop with its own weight in it. So every cable leaves
 * its jack along the panel normal for a plug's length, sags by a term that grows
 * with the chord, and comes back. The sag is the whole illusion and it costs one
 * control point.
 *
 * Their control points are clamped in `z` regardless of what the seed asks for.
 * Nothing else in this file can reach the key line, but a lead slung between two
 * jacks near the front corner of a wing could, and the rule above is absolute.
 *
 * ## What it costs
 *
 * Five of these can stand on one stage, so nothing repeated is a `Mesh`. Every
 * jack, knob, slider, faceplate, cheek and carcass panel is an instance of one
 * of five shared primitives — the boxes are all one unit cube, scaled — and the
 * cables are welded into a single buffer with their colours baked into vertices,
 * because twenty leads is twenty draw calls and five rigs is a hundred, for
 * geometry that never changes after it is built.
 *
 * Measured, at a 2.1 m keybed: **13 draw calls, about 700 instances and 20 000
 * triangles**, of which the jack fields are half. That is the price of the one
 * thing on the rig that has to be dense to read at all, and it is paid once in
 * vertices rather than every frame in draw calls.
 */

import {
  BoxGeometry, BufferAttribute, BufferGeometry, CatmullRomCurve3, Color,
  CylinderGeometry, Group, InstancedMesh, type Material, Matrix4, Mesh,
  MeshStandardMaterial, type Object3D, Quaternion, TubeGeometry, Vector3,
} from 'three';

import { Rng } from '../../../core/rng.js';
import { createMachineRunner, liveSteps, VOICE_GLOW } from './drum-machine.js';
import {
  disposeTree, mountOutlet, placeBoard,
  type SynthRig, type SynthRigBuilder, type SynthRigOptions,
} from './synth-rig.js';
import { addTo } from './types.js';

const UP = new Vector3(0, 1, 0);
const ONE = new Vector3(1, 1, 1);

/**
 * How far behind the key line the rig is allowed to begin.
 *
 * Four millimetres rather than zero so that no rounding in a composed matrix can
 * put a face on the wrong side of the one boundary this file has.
 */
const CLEAR = 0.004;

/** Cabinet depth, front to back, and the width of one wing bay. */
const WING_D = 0.32;
const WING_W = 0.60;
/** How far out the wings stand. Sets the width of the window over the console. */
const WING_X = 0.78;

/** A faceplate's outer surface, in panel-local `z`. Everything sits on it. */
const FACE = 0.012;

/**
 * Steps across a percussion module, and how far apart they sit.
 *
 * Sixteen because that is what a bar of this music is, and the pitch is tighter
 * than a jack's because a lamp needs no finger. A narrow bay draws fewer rather
 * than shrinking them to nothing — see the `percussion` case.
 */
const MACHINE_STEPS = 16;
const STEP_PITCH = 0.019;

/** Jack pitch on a panel. A quarter-inch nut is 12 mm; 26 mm is a Moog row. */
const JACK_PITCH = 0.026;
const KNOB_PITCH = 0.044;
const SLIDER_PITCH = 0.036;

/**
 * A flat working surface, as a frame: `+x` across it, `+y` up it, `+z` out of
 * it. Panels are the only coordinate system in this file that is not the
 * instrument's own, and they exist so that a jack field can be written once and
 * then placed on a vertical wing, on a console sloped at 42°, or flat on the
 * keyboard shelf without knowing which.
 */
interface Panel {
  m: Matrix4;
  w: number;
  h: number;
}

/**
 * Build a panel frame from the two facts that describe one: which way it faces,
 * and which way is up *along* it. `up` is orthogonalised against the normal, so
 * a caller may pass world up and let the tilt sort itself out.
 */
function panelFrame(origin: Vector3, normal: Vector3, up: Vector3): Matrix4 {
  const ez = normal.clone().normalize();
  const ey = up.clone().addScaledVector(ez, -up.dot(ez)).normalize();
  const ex = new Vector3().crossVectors(ey, ez);
  return new Matrix4().makeBasis(ex, ey, ez).setPosition(origin);
}

/**
 * A pile of instance transforms waiting for a mesh.
 *
 * Collect first and count later: the alternative is deciding up front how many
 * jacks a randomly furnished panel is going to want, which is either a wrong
 * guess or a first pass that does the layout twice.
 */
class Bank {
  private readonly rows: Matrix4[] = [];

  /** One instance at a transform the caller has already composed. */
  add(m: Matrix4): void {
    this.rows.push(m.clone());
  }

  /** A `w × h × d` box centred at `(u, v, out)` in `frame`. */
  box(
    frame: Matrix4, u: number, v: number, out: number,
    w: number, h: number, d: number,
  ): void {
    this.rows.push(new Matrix4()
      .makeTranslation(u, v, out)
      .scale(new Vector3(w, h, d))
      .premultiply(frame));
  }

  build(
    parent: Object3D, geometry: BufferGeometry, material: Material, name: string,
  ): void {
    if (this.rows.length === 0) return;
    const mesh = addTo(parent, new InstancedMesh(geometry, material, this.rows.length));
    mesh.name = name;
    this.rows.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }
}

/**
 * Fuse a set of tube geometries into one indexed buffer, carrying a per-cable
 * colour in a vertex attribute.
 *
 * Worth the forty lines: a patch cable is the most numerous non-instanceable
 * thing on the rig — every one is a different curve, so there is no shared
 * geometry to instance — and nothing about one ever moves. Welding them trades
 * eighteen draw calls for one buffer and one material.
 */
function weld(parts: readonly BufferGeometry[], tints: readonly Color[]): BufferGeometry {
  let verts = 0;
  let elems = 0;
  for (const g of parts) {
    verts += g.getAttribute('position').count;
    elems += g.getIndex()?.count ?? 0;
  }
  const position = new Float32Array(verts * 3);
  const normal = new Float32Array(verts * 3);
  const color = new Float32Array(verts * 3);
  const index = new Uint32Array(elems);
  let v = 0;
  let e = 0;
  parts.forEach((g, n) => {
    const p = g.getAttribute('position');
    const tint = tints[n] ?? new Color('#ffffff');
    position.set(p.array, v * 3);
    normal.set(g.getAttribute('normal').array, v * 3);
    for (let k = 0; k < p.count; k++) {
      color[(v + k) * 3] = tint.r;
      color[(v + k) * 3 + 1] = tint.g;
      color[(v + k) * 3 + 2] = tint.b;
    }
    const src = g.getIndex();
    if (src) for (let k = 0; k < src.count; k++) index[e + k] = src.getX(k) + v;
    v += p.count;
    e += src?.count ?? 0;
  });
  const out = new BufferGeometry();
  out.setAttribute('position', new BufferAttribute(position, 3));
  out.setAttribute('normal', new BufferAttribute(normal, 3));
  out.setAttribute('color', new BufferAttribute(color, 3));
  out.setIndex(new BufferAttribute(index, 1));
  out.computeBoundingSphere();
  return out;
}

/** What a module does, which is all that decides what is drawn on it. */
/**
 * What a module in this frame *is*.
 *
 * The first four are texture: a rack of anonymous panels that says "a lot of
 * hardware" and cannot say which. That is the right read for most of a modular
 * and the wrong level of meaning for all of it, because the interesting fact
 * about a modular is that the modules were chosen — a band that sequenced its
 * bass owned a sequencer and a band that did not, did not, and you could see
 * which from the fourth row.
 *
 * `percussion` is the first named one. It is what makes the drum machine a part
 * of the instrument rather than a box balanced on the end of a stand, and it is
 * the arrangement that needs no explaining: a wall of modules with somebody
 * standing at it already reads as one thing being operated.
 */
type ModuleKind = 'jacks' | 'knobs' | 'sliders' | 'mixed' | 'percussion' | 'sequencer';

export const buildModularRig: SynthRigBuilder = (opts: SynthRigOptions): SynthRig => {
  const rng = new Rng(`synth-rig-modular:${opts.seed}`);
  const group = new Group();
  group.name = 'synth-rig-modular';

  const kb = opts.keyBackZ;
  const kt = opts.keyTopY;
  /** The shelf overhangs the keybed by a cheek's width at each end. */
  const shelfW = opts.boardWidth + 0.10;

  // --- Materials -----------------------------------------------------------
  //
  // A modular is three finishes and no more: a dark painted carcass, walnut end
  // cheeks, and brushed aluminium faceplates. `finish` tints the carcass only —
  // the panels were metal whatever colour the venue is, and a lilac Moog would
  // be a lie the palette is not allowed to tell.

  const carcassMat = new MeshStandardMaterial({
    color: opts.finish ?? rng.pick(['#26262b', '#1e1e22', '#2f2b28']),
    roughness: 0.74, metalness: 0.08,
  });
  const woodMat = new MeshStandardMaterial({
    color: rng.pick(['#4a3122', '#573a26', '#3d2a1d']), roughness: 0.58, metalness: 0.03,
  });
  const plateMat = new MeshStandardMaterial({
    color: rng.pick(['#b4b8bc', '#a8acb1', '#c0c3c6']), roughness: 0.36, metalness: 0.8,
  });
  const chromeMat = new MeshStandardMaterial({
    color: '#b9c0c8', roughness: 0.3, metalness: 0.88,
  });
  /** Sockets, slider slots and plug barrels: everything that is a dark hole. */
  const darkMat = new MeshStandardMaterial({
    color: '#111114', roughness: 0.52, metalness: 0.35,
  });
  const knobMat = new MeshStandardMaterial({
    color: '#1c1e21', roughness: 0.46, metalness: 0.28,
  });
  const pointerMat = new MeshStandardMaterial({
    color: '#e8e4d8', roughness: 0.5, metalness: 0,
  });
  const capMat = new MeshStandardMaterial({
    color: '#cfd3d8', roughness: 0.42, metalness: 0.5,
  });
  const cableMat = new MeshStandardMaterial({
    vertexColors: true, roughness: 0.82, metalness: 0,
  });
  /** The free-running lamp, and the one that answers the keyboard. */
  const lfoMat = new MeshStandardMaterial({
    color: '#2a0f06', emissive: '#ff5a22', emissiveIntensity: 0.5, roughness: 0.4,
  });
  const gateMat = new MeshStandardMaterial({
    color: '#2a2205', emissive: '#ffcc44', emissiveIntensity: 0.3, roughness: 0.4,
  });
  /**
   * Unlit steps and voices, and the two lit ones that move over them.
   *
   * A `Bank` is one instanced mesh with one material, so sixteen individually
   * lit steps would be sixteen materials and sixteen draw calls for a strip
   * 30 cm across. One dark row plus one bright lamp parked on the current step
   * is two draw calls and reads identically from anywhere an audience sits.
   */
  const stepOffMat = new MeshStandardMaterial({
    color: '#241a12', roughness: 0.7, metalness: 0,
  });
  const stepOnMat = new MeshStandardMaterial({
    color: '#ffb347', emissive: '#ff9020', emissiveIntensity: 1.7, roughness: 0.35,
  });
  const voiceOffMat = new MeshStandardMaterial({
    color: '#221417', roughness: 0.7, metalness: 0,
  });
  /**
   * One material per lit voice, because they decay independently.
   *
   * The odd one out among the lamp materials here, and deliberately: every
   * other lamp on this cabinet is either always the same brightness or is one
   * lamp. These are several, each falling from its own hit — see `level` in
   * `drum-machine.ts`, which both drawings of that machine now share so that
   * neither can have its own idea of what a lit lamp looks like.
   *
   * Made lazily below, one per bay lamp, so a cabinet with no percussion module
   * in it builds none.
   */
  const voiceOnMats: MeshStandardMaterial[] = [];

  // --- Shared primitives ---------------------------------------------------

  const BOX = new BoxGeometry(1, 1, 1);
  const POST = new CylinderGeometry(0.021, 0.021, 1, 8);
  const JACK = new CylinderGeometry(0.0055, 0.0055, 0.012, 6);
  const KNOB = new CylinderGeometry(0.0125, 0.0145, 0.022, 10);
  const PLUG = new CylinderGeometry(0.0062, 0.0062, 0.024, 6);

  const plates = new Bank();
  const carcass = new Bank();
  const wood = new Bank();
  const slots = new Bank();
  const caps = new Bank();
  const pointers = new Bank();
  const lfoLamps = new Bank();
  const gateLamps = new Bank();
  /**
   * The percussion bay's own lamps, kept out of the two banks above because
   * they answer to something else entirely: those two are a free-running LFO
   * and a gate that follows the keyboard, and these follow a drum pattern
   * nobody is playing.
   */
  const stepOff = new Bank();
  const voiceOff = new Bank();
  /** Where each step lamp sits, so the lit one can be parked on top of it. */
  const stepAt: Matrix4[] = [];
  const voiceAt: Matrix4[] = [];
  const legs = new Bank();
  const jacks = new Bank();
  const knobs = new Bank();
  const plugs = new Bank();

  /**
   * Turns a cylinder's `+y` axis into a panel's `+z`, so one primitive serves as
   * a jack, a knob and a plug without three geometries.
   */
  const AXIS_OUT = new Matrix4().makeRotationX(Math.PI / 2);
  const scratch = new Matrix4();
  const spin = new Matrix4();

  /** Every socket on the rig, in rig space, so the cables know where to land. */
  interface Socket { p: Vector3; n: Vector3 }
  const sockets: Socket[] = [];

  // --- Furnishing a panel --------------------------------------------------

  function jackGrid(panel: Panel, v0: number, rows: number): void {
    const cols = Math.max(2, Math.floor((panel.w - 0.024) / JACK_PITCH));
    const x0 = -((cols - 1) * JACK_PITCH) / 2;
    const normal = new Vector3().setFromMatrixColumn(panel.m, 2).normalize();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = x0 + c * JACK_PITCH;
        const v = v0 + r * JACK_PITCH;
        jacks.add(scratch
          .makeTranslation(u, v, FACE + 0.001)
          .multiply(AXIS_OUT)
          .premultiply(panel.m));
        sockets.push({
          p: new Vector3(u, v, FACE + 0.006).applyMatrix4(panel.m),
          n: normal.clone(),
        });
      }
    }
  }

  function knobGrid(panel: Panel, v0: number, rows: number): void {
    const cols = Math.max(1, Math.floor((panel.w - 0.026) / KNOB_PITCH));
    const x0 = -((cols - 1) * KNOB_PITCH) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = x0 + c * KNOB_PITCH;
        const v = v0 + r * KNOB_PITCH;
        // Where a knob points is decoration and is resolved by nothing, so the
        // seed is free to set it. A panel of knobs all at noon reads as a mould.
        spin.makeRotationY(rng.float(-2.2, 2.2));
        scratch
          .makeTranslation(u, v, FACE + 0.011)
          .multiply(AXIS_OUT)
          .multiply(spin)
          .premultiply(panel.m);
        knobs.add(scratch);
        pointers.add(scratch.multiply(
          new Matrix4().makeTranslation(0, 0.012, 0.0072).scale(new Vector3(0.004, 0.005, 0.013)),
        ));
      }
    }
  }

  function sliderBank(panel: Panel, v0: number, travel: number): void {
    const cols = Math.max(2, Math.floor((panel.w - 0.02) / SLIDER_PITCH));
    const x0 = -((cols - 1) * SLIDER_PITCH) / 2;
    for (let c = 0; c < cols; c++) {
      const u = x0 + c * SLIDER_PITCH;
      slots.box(panel.m, u, v0, FACE + 0.002, 0.011, travel, 0.008);
      caps.box(
        panel.m, u, v0 + rng.float(-0.42, 0.42) * travel, FACE + 0.009,
        0.019, 0.011, 0.014,
      );
    }
  }

  /**
   * One module: a faceplate and whatever is screwed to it.
   *
   * Every module gets a jack row along its bottom edge whatever else it does,
   * because on a modular every module does — a filter with no inputs is not a
   * filter. That single rule is what makes the jack fields read as continuous
   * across a bay rather than as three separate patches of dots.
   */
  function module(panel: Panel, kind: ModuleKind): void {
    plates.box(panel.m, 0, 0, FACE / 2, panel.w - 0.005, panel.h - 0.005, FACE);
    const top = panel.h / 2 - 0.016;
    jackGrid(panel, -panel.h / 2 + 0.026, 2);
    const free = -panel.h / 2 + 0.026 + 2 * JACK_PITCH + 0.018;
    /** How many rows of something fit between the jack strip and the top edge. */
    const fits = (pitch: number, cap: number): number => Math.max(
      1, Math.min(cap, Math.floor((top - free) / pitch)),
    );
    switch (kind) {
      case 'jacks': {
        // A multiple or a mixer: a block of sockets with its trim above.
        const rows = fits(JACK_PITCH, 3);
        jackGrid(panel, free, rows);
        knobGrid(panel, free + rows * JACK_PITCH + 0.022, 1);
        break;
      }
      case 'knobs':
        knobGrid(panel, free + 0.024, fits(KNOB_PITCH, 3));
        break;
      case 'sliders':
        sliderBank(panel, (free + top) / 2, Math.min(0.11, top - free - 0.015));
        break;
      case 'mixed':
        knobGrid(panel, free + 0.024, 1);
        jackGrid(panel, free + 0.024 + KNOB_PITCH, 1);
        break;
      /**
       * The step sequencer, and it is the same panel as the drum module with
       * one row swapped.
       *
       * A 960 is sixteen columns of knobs over sixteen step lamps: you set a
       * *pitch* per step rather than choosing which drum fires, so the voice
       * lamps become a bank of knobs and the step row stays exactly what it
       * was. Sharing the case is honest as well as cheap — on a real frame
       * these were two modules in the same rack from the same maker.
       */
      case 'sequencer':
      case 'percussion': {
        /**
         * The drum machine, as a module.
         *
         * Sixteen steps across the panel with three voice lamps above them,
         * which is the whole of what a rhythm module showed. The row is
         * deliberately the widest thing on the faceplate: a running position
         * light is the one detail that reads from the back of a room, and it is
         * what says this cabinet is producing the beat rather than merely
         * standing near it.
         *
         * The positions are stored as well as drawn, because the lit lamp is a
         * single mesh that gets parked on whichever step is current — sixteen
         * separately-lit meshes would be sixteen materials, and a `Bank` is one
         * instanced mesh with one material by construction.
         */
        const cols = Math.max(4, Math.min(MACHINE_STEPS,
          Math.floor((panel.w - 0.022) / STEP_PITCH)));
        const x0 = -((cols - 1) * STEP_PITCH) / 2;
        const vStep = free + 0.020;
        for (let c = 0; c < cols; c++) {
          const m = new Matrix4()
            .makeTranslation(x0 + c * STEP_PITCH, vStep, FACE + 0.002)
            .scale(new Vector3(0.013, 0.007, 0.005))
            .premultiply(panel.m);
          stepOff.add(m);
          stepAt.push(m.clone());
        }
        const vVoice = Math.min(top - 0.012, vStep + 0.040);
        if (kind === 'sequencer') {
          /**
           * A knob per step, above the step it sets.
           *
           * This is the whole difference between the two modules and it is the
           * right one to spend geometry on: a row of pots over a row of lamps
           * *is* what a step sequencer looks like, and it is the panel anybody
           * would recognise from the era's photographs.
           */
          knobGrid(panel, vVoice, 1);
          if (vVoice + KNOB_PITCH < top) knobGrid(panel, vVoice + KNOB_PITCH, 1);
        } else {
          for (let i = 0; i < 3; i++) {
            const m = new Matrix4()
              .makeTranslation((i - 1) * 0.042, vVoice, FACE + 0.002)
              .scale(new Vector3(0.012, 0.012, 0.005))
              .premultiply(panel.m);
            voiceOff.add(m);
            voiceAt.push(m.clone());
          }
          // A row of trim above them, so the bay is not a lamp panel with
          // nothing to set. Every module on a real one had something to turn.
          if (vVoice + 0.030 < top) knobGrid(panel, vVoice + 0.030, 1);
        }
        break;
      }
    }
    // A lamp on roughly one module in four. Two circuits: the free-running LFO,
    // and a gate lamp that answers the keyboard.
    if (rng.chance(0.26)) {
      const bank = rng.chance(0.5) ? lfoLamps : gateLamps;
      bank.box(
        panel.m, panel.w / 2 - 0.022, panel.h / 2 - 0.020, FACE + 0.003,
        0.013, 0.008, 0.006,
      );
    }
  }

  /** Split a bay row into modules of unequal width, which is what a rack is. */
  function split(width: number, count: number): number[] {
    const shares = Array.from({ length: count }, () => rng.float(0.72, 1.28));
    const total = shares.reduce((a, b) => a + b, 0);
    return shares.map((s) => (s / total) * width);
  }

  /**
   * Modules this frame has been asked to contain, taken before the random ones.
   *
   * A queue rather than a probability, because these are not texture: the band
   * either owns a rhythm machine this number or it does not, and that is
   * settled in the IR before this file is called. The widest bay gets it —
   * `fillRow` shifts the queue on its first panel, and the rows are filled
   * bottom-first from the wing level with the keyboard, so a requested module
   * lands where the player can actually reach it.
   */
  const pending: ModuleKind[] = [];
  if (opts.machine) {
    pending.push(opts.machine.kind === 'sequencer' ? 'sequencer' : 'percussion');
  }

  function fillRow(frame: Matrix4, yCentre: number, outZ: number, width: number, height: number): void {
    const count = width > 0.44 ? rng.int(2, 3) : 2;
    const widths = split(width, count);
    let x = -width / 2;
    for (const w of widths) {
      const panel: Panel = {
        m: frame.clone().multiply(new Matrix4().makeTranslation(x + w / 2, yCentre, outZ)),
        w,
        h: height,
      };
      module(panel, pending.shift() ?? rng.weighted([
        ['jacks', 3], ['knobs', 3], ['sliders', 2], ['mixed', 2],
      ] as const));
      x += w;
    }
  }

  // --- The keyboard shelf --------------------------------------------------
  //
  // The controller sits on a shelf that starts at the key line, runs back into
  // the console that carries it, and is caught at the ends by two poles. It is
  // deliberately plain: a 953 was a box with a glide knob and a ribbon on it,
  // and the moment this grows a control panel the inversion the whole rig is
  // built on stops reading.

  const railTop = kt - 0.020;
  carcass.box(new Matrix4(), 0, railTop - 0.043, kb + CLEAR + 0.10, shelfW, 0.086, 0.20);
  // The ribbon controller — flush, because everything on this shelf stays inside
  // the thickness of a key and so can never hide one from a camera that can see
  // the keyboard at all.
  caps.box(
    new Matrix4(), 0, railTop + 0.004, kb + CLEAR + 0.105,
    Math.min(0.40, shelfW * 0.3), 0.009, 0.028,
  );
  {
    // Glide and octave, at the *player's left*, which is `+x` — bass runs to
    // `+x` on every keyboard here, and the controls went beside the bass end.
    const glide = panelFrame(
      new Vector3(shelfW / 2 - 0.12, railTop, kb + CLEAR + 0.155),
      UP, new Vector3(0, 0, -1),
    );
    knobGrid({ m: glide, w: 0.14, h: 0.02 }, 0, 1);
  }
  for (const side of [1, -1]) {
    const h = railTop - 0.086;
    legs.add(scratch.makeTranslation(side * (shelfW / 2 - 0.09), h / 2, kb + CLEAR + 0.10)
      .scale(new Vector3(1, h, 1)));
  }

  // --- The console ---------------------------------------------------------
  //
  // Its highest point is 66 mm under the key plane, which is the whole argument:
  // a sightline that reaches a key from above cannot cross anything behind the
  // key line that is lower than the key, so the window between the wings stays a
  // window for every camera in the room. The panel is sloped 42° back toward the
  // player — the angle a console section is set at to be read standing over it.

  const conW = 0.88;
  const conFront = kb + 0.20;
  const conBack = kb + 0.70;
  const conTop = kt - 0.240;
  carcass.box(
    new Matrix4(), 0, (0.055 + conTop) / 2, (conFront + conBack) / 2,
    conW, conTop - 0.055, conBack - conFront,
  );
  // The kerb: a recessed plinth, so a cabinet this heavy does not look like it
  // is resting on the paint.
  carcass.box(
    new Matrix4(), 0, 0.0275, (conFront + conBack) / 2 + 0.02,
    conW - 0.06, 0.055, conBack - conFront - 0.08,
  );
  /**
   * The end cheeks sit 3 mm inside the carcass top and bottom and 3 mm proud of
   * its front and back, rather than matching it on all four.
   *
   * They are *inside* the carcass in x — a 22 mm strip of walnut let into the
   * end of an 880 mm case — so an identical height and depth put four of the
   * cheek's faces on four of the carcass's, down the full metre of the console
   * side. That is the largest fight on any instrument in the catalogue and it
   * is on the object a synth player stands behind all night. Cheeks are the
   * outer skin anyway: 2 mm proud at the end and at the face, short of the
   * arrises.
   */
  for (const side of [1, -1]) {
    wood.box(
      new Matrix4(), side * (conW / 2 - 0.011), (0.055 + conTop) / 2, (conFront + conBack) / 2,
      0.026, conTop - 0.055 - 0.006, conBack - conFront + 0.006,
    );
  }
  // The riser that carries the shelf. Without it the keyboard hangs in the air
  // over the console on two end legs, and a 30 kg controller does not do that.
  carcass.box(
    new Matrix4(), 0, (conTop + railTop - 0.086) / 2, conFront + 0.03,
    conW, railTop - 0.086 - conTop, 0.06,
  );
  {
    const tilt = 0.733; // 42°, from the horizontal.
    const slope = 0.26;
    const normal = new Vector3(0, Math.cos(tilt), -Math.sin(tilt));
    const up = new Vector3(0, Math.sin(tilt), Math.cos(tilt));
    const origin = new Vector3(0, conTop, conFront).addScaledVector(up, slope / 2);
    const frame = panelFrame(origin, normal, up);
    fillRow(frame, 0, 0, conW - 0.06, slope);
  }

  // --- Shelves for the extra boards ----------------------------------------
  //
  // A frame with several keyboards in it needs something under each of them,
  // and the seam says which side of the line that is: `synth.ts` owns the keys
  // and this owns everything holding them off the floor. So the layout arrives
  // as measurements — `SynthRigOptions.extraBoards` — and a shelf is built to
  // fit rather than a board being placed to fit a shelf.

  for (const board of opts.extraBoards ?? []) {
    const [bx, by, bz] = board.at;
    /**
     * The board's own frame, with the key plane at its origin so everything
     * below is written as a depth under the keys.
     *
     * `placeBoard` rather than a rotation composed here, because a tier is
     * pitched toward the player and a shelf built flat under a sloped keyboard
     * is a wedge of daylight along its front edge.
     */
    const frame = placeBoard(board, kt, kb).multiply(new Matrix4().makeTranslation(0, kt, 0));
    /** The same board *level*, which is what a leg standing on a floor wants. */
    const flat = new Matrix4().makeRotationY(board.yaw).setPosition(bx, kt + by, bz);
    /**
     * The tray, at the board's own height and a shade under it.
     *
     * `kt` is the key plane, so `kt + by` is where this board's keys are and the
     * tray sits below by the depth of a keybed's own case. Wide enough for a
     * 61-note board and no wider: this is a shelf a player bolted on, not a
     * piece of furniture.
     */
    const shelfWide = 0.90;
    carcass.box(frame, 0, -0.055, kb + 0.02, shelfWide, 0.055, 0.30);
    wood.box(frame, 0, -0.021, kb - 0.13, shelfWide + 0.02, 0.016, 0.05);

    /**
     * Two posts down to the boards, and their length is measured rather than
     * assumed: a wing at `by = 0.06` needs a metre of leg and a tier at 0.285
     * needs to reach only as far as the frame under it. Scaling one unit post
     * is what `Bank.box` is for.
     *
     * On the `flat` frame, and that is the one place the shelf and its legs part
     * company: a post takes its angle from the floor it stands on, not from the
     * tray it holds. Leaning them with a sloped board would walk their feet a
     * fifth of a radian's worth of a metre out from under it. They meet the
     * underside 2 cm from the line the tilt turns about, so the joint is a few
     * millimetres out and inside the tray.
     */
    const drop = kt + by - 0.083;
    if (drop > 0.05) {
      for (const side of [1, -1]) {
        legs.add(new Matrix4()
          .makeTranslation(side * (shelfWide / 2 - 0.07), -0.055 - drop / 2, kb + 0.02)
          .scale(new Vector3(1, drop, 1))
          .premultiply(flat));
      }
    }
  }

  // --- The wings -----------------------------------------------------------

  /**
   * Where the player stands, from the station offset `synth.ts` publishes.
   *
   * Derived rather than written down, because it is the same expression the
   * keyboard uses to place the body and the two must not drift.
   */
  const playerZ = kb - opts.whiteLength - 0.28;
  const chest = new Vector3(0, kt + 0.40, playerZ);

  /**
   * The wings stand **upstage of the player**, and this is the correction.
   *
   * They used to sit at `kb + 0.44` — which is 0.87 m *downstage* of the person,
   * because the player is at `kb − whiteLength − 0.28` and `+z` is toward the
   * audience. So the house was looking at the backs of two 1.7 m cabinets with
   * a player somewhere behind them, on both sides, all night. The rest of this
   * file's sightline argument was carefully right and pointed at the wrong side
   * of the instrument: the low console exists to keep a window open over the
   * top of gear that should never have been in the way to begin with.
   *
   * A modular stands behind its player. That is what every photograph of one
   * shows, and it is the only arrangement in which the thing worth looking at —
   * the patch bay — faces the room rather than the wall.
   *
   * `WING_BEHIND` is a body's clearance and no more: half a wing's depth is
   * 0.16 and a standing player is about 0.32 across, so 0.62 puts the cabinet
   * face 0.46 m behind the shoulder blades. Close enough to reach round to,
   * which is what those players did.
   */
  const WING_BEHIND = 0.62;
  const wingZ = playerZ - WING_BEHIND;
  const wingTop = kt + 0.77;

  /**
   * How far downstage of the player the wings are aimed.
   *
   * Aimed at the chest — which is what this did, and was the right instinct on
   * the wrong side of the stage — a wing from behind sits 51° off the house,
   * and the audience gets a patch bay in sharp profile. Aimed square downstage
   * it is a flat wall and the two cabinets read as one backdrop.
   *
   * So they are aimed at a point on the centre line well in front of the
   * player: 1.6 m gives about 19° of toe-in, which is a rack turned in toward
   * the person using it *and* a panel the room can read. The player still
   * stands inside the vee; it is just no longer a vee that the audience is
   * outside of.
   */
  const AIM_AHEAD = 1.6;
  const aimAt = new Vector3(0, 0, playerZ + AIM_AHEAD);

  for (const side of [1, -1]) {
    const centre = new Vector3(side * WING_X, 0, wingZ);
    const aim = new Vector3(aimAt.x - centre.x, 0, aimAt.z - centre.z).normalize();
    const yaw = Math.atan2(aim.x, aim.z);
    const frame = new Matrix4().makeRotationY(yaw).setPosition(centre);

    carcass.box(frame, 0, (0.055 + wingTop - 0.05) / 2, 0,
      WING_W - 0.048, wingTop - 0.105, WING_D - 0.03);
    carcass.box(frame, 0, 0.0275, 0, WING_W - 0.09, 0.055, WING_D - 0.06);
    for (const cheek of [1, -1]) {
      wood.box(frame, cheek * (WING_W / 2 - 0.012), (0.055 + wingTop - 0.05) / 2, 0,
        0.024, wingTop - 0.105, WING_D);
    }
    // The cornice, overhanging on three sides. A cabinet with a square top edge
    // reads as a flat card; a lip catches the top light and gives it a roof.
    carcass.box(frame, 0, wingTop - 0.025, 0, WING_W + 0.024, 0.05, WING_D + 0.024);
    // And the cap of the plinth, which is the only thing standing between the
    // lowest rack row and 0.9 m of unbroken dark.
    wood.box(frame, 0, kt - 0.045, 0.006, WING_W + 0.018, 0.036, WING_D + 0.012);

    // Three rack rows, the lowest starting level with the keyboard so the
    // player can read it without looking up. Three rather than two because a
    // modular is *visibly assembled* — the horizontal seams between bays are
    // half of what says "this is not one moulded thing".
    for (let row = 0; row < 3; row++) {
      fillRow(frame, kt + 0.095 + row * 0.251, WING_D / 2, WING_W - 0.05, 0.235);
    }
  }

  // --- Patch cables --------------------------------------------------------

  const palette = rng.shuffle([
    '#c8342c', '#2f6fd0', '#e3b32c', '#2f9e58', '#dcd8cc', '#e0731e', '#8f5fd0',
  ]).slice(0, rng.int(3, 4)).map((c) => new Color(c));

  const parts: BufferGeometry[] = [];
  const tints: Color[] = [];
  const taken = new Set<number>();
  const wanted = rng.int(15, 21);
  const minZ = kb + 0.03;

  for (let n = 0; n < wanted && sockets.length > 8; n++) {
    let a: Socket | undefined;
    let b: Socket | undefined;
    for (let attempt = 0; attempt < 8; attempt++) {
      const i = rng.int(0, sockets.length - 1);
      const j = rng.int(0, sockets.length - 1);
      if (i === j || taken.has(i) || taken.has(j)) continue;
      const d = sockets[i]!.p.distanceTo(sockets[j]!.p);
      // Short enough to be one lead, long enough to be worth drawing. A cable
      // between two jacks 4 cm apart is a smudge from the fourth row.
      if (d < 0.14 || d > 1.25) continue;
      taken.add(i);
      taken.add(j);
      a = sockets[i];
      b = sockets[j];
      break;
    }
    if (!a || !b) continue;

    const plugLen = 0.024;
    const end0 = a.p.clone().addScaledVector(a.n, plugLen);
    const end1 = b.p.clone().addScaledVector(b.n, plugLen);
    const lead = 0.05 + rng.float(0, 0.045);
    const c0 = end0.clone().addScaledVector(a.n, lead);
    const c1 = end1.clone().addScaledVector(b.n, lead);
    const chord = end0.distanceTo(end1);
    // A patch lead is about a metre whatever it is asked to span, and the slack
    // has to go somewhere. Growing the sag with the chord keeps a long cable
    // from reading as taut and a short one from touching the boards.
    const sag = 0.09 + 0.32 * chord + rng.float(0, 0.05);
    const belly = end0.clone().add(end1).multiplyScalar(0.5)
      .addScaledVector(a.n.clone().add(b.n).normalize(), 0.03 + rng.float(0, 0.05));
    belly.y -= sag;
    /**
     * Keep a cable out of the band the hands work in — but only on the side of
     * the player where hands are.
     *
     * This used to be an unconditional `max(p.z, minZ)`, which was right while
     * every panel on the rig stood downstage of the keys. Now that the wings are
     * upstage of the *player*, every one of their control points is about a
     * metre behind `minZ`, and clamping unconditionally would have dragged every
     * cable on both wings forward onto the keyboard — a rig whose leads all
     * reach for the keys like ivy.
     *
     * A wing-to-console lead cannot arise to be caught in between: the two are
     * over 1.25 m apart and the length filter above rejects them, as it does
     * wing-to-wing at 1.56 m.
     */
    for (const p of [c0, belly, c1]) {
      if (p.z > playerZ) p.z = Math.max(p.z, minZ);
    }

    const curve = new CatmullRomCurve3([a.p.clone(), c0, belly, c1, b.p.clone()]);
    parts.push(new TubeGeometry(curve, 14, 0.0032, 6, false));
    tints.push(rng.pick(palette));

    for (const end of [a, b]) {
      plugs.add(scratch.compose(
        end.p.clone().addScaledVector(end.n, plugLen / 2),
        new Quaternion().setFromUnitVectors(UP, end.n),
        ONE,
      ));
    }
  }

  if (parts.length > 0) {
    const cables = addTo(group, new Mesh(weld(parts, tints), cableMat));
    cables.name = 'modular:cables';
    cables.castShadow = true;
    // The tubes were only ever a way of describing the welded buffer.
    for (const p of parts) p.dispose();
  }

  // --- Materialise ---------------------------------------------------------

  plates.build(group, BOX, plateMat, 'modular:plates');
  carcass.build(group, BOX, carcassMat, 'modular:carcass');
  wood.build(group, BOX, woodMat, 'modular:cheeks');
  slots.build(group, BOX, darkMat, 'modular:slots');
  caps.build(group, BOX, capMat, 'modular:caps');
  pointers.build(group, BOX, pointerMat, 'modular:pointers');
  lfoLamps.build(group, BOX, lfoMat, 'modular:lfo-lamps');
  gateLamps.build(group, BOX, gateMat, 'modular:gate-lamps');
  stepOff.build(group, BOX, stepOffMat, 'modular:step-lamps');
  voiceOff.build(group, BOX, voiceOffMat, 'modular:voice-lamps');
  /**
   * The two lamps that move, and the runner that says where.
   *
   * Built after the banks so the dark rows are already in the scene to sit on
   * top of. `matrixAutoUpdate` is off because these are parked by matrix rather
   * than by position — a step lamp lives on a faceplate that is tilted, turned
   * and offset, and re-deriving that from a `position` every frame would be
   * three transforms to get one number wrong in.
   */
  const runner = opts.machine && stepAt.length
    ? createMachineRunner(
      opts.machine.events, opts.machine.beatsPerBar,
      // The bay counts sixteenths and wraps at the end of its own row, exactly
      // as the box on a stand does — a narrow module draws fewer lamps, and a
      // 3/4 bar uses fewer still. See `liveSteps`.
      liveSteps(stepAt.length, opts.machine.beatsPerBar), opts.machine.startedAt)
    : undefined;
  let stepLit: Mesh | undefined;
  let voiceLit: Mesh[] = [];
  if (runner) {
    stepLit = addTo(group, new Mesh(BOX, stepOnMat));
    stepLit.name = 'modular:step-lit';
    stepLit.matrixAutoUpdate = false;
    stepLit.matrix.copy(stepAt[0]!);
    voiceLit = voiceAt.map((m) => {
      const mat = new MeshStandardMaterial({
        color: '#ff5a4a', emissive: '#ff3b28', emissiveIntensity: 0, roughness: 0.35,
      });
      voiceOnMats.push(mat);
      const lamp = addTo(group, new Mesh(BOX, mat));
      lamp.matrixAutoUpdate = false;
      lamp.matrix.copy(m);
      lamp.visible = false;
      return lamp;
    });
  }

  /**
   * The rig's own output, on the back of the console.
   *
   * A cabinet full of jacks and not one of them is where the sound leaves: the
   * patch bay is signal *inside* this instrument, and a lead to the stage box
   * belongs on the back of the carcass with the mains, which is where a studio
   * cabinet put it. It is also the only face of this rig a lead can leave from
   * — the wings stand upstage of the player and the shelf is a keyboard on two
   * poles, so anything plugged in at the front would run back past a pair of
   * legs to get anywhere.
   */
  const outlet = mountOutlet(
    group, darkMat, new Vector3(conW * 0.33, conTop - 0.10, conBack),
  );

  legs.build(group, POST, chromeMat, 'modular:legs');
  jacks.build(group, JACK, darkMat, 'modular:jacks');
  knobs.build(group, KNOB, knobMat, 'modular:knobs');
  plugs.build(group, PLUG, darkMat, 'modular:plugs');

  // --- The two lamps -------------------------------------------------------

  /**
   * The LFO period, in beats, drawn once and deliberately not a musical
   * division of one. A 1972 LFO is a free-running oscillator with a knob on it:
   * it has never heard of the bar, and a lamp that blinks on the beat would be
   * claiming a sync that did not exist until MIDI. Drawn from the seed so two
   * of these on one stage drift against each other as well as against the band.
   */
  const lfoBeats = rng.float(0.53, 0.97);
  let gate = 0;
  let last = 0;
  let started = false;

  return {
    group,
    outlet,

    react(force: number, now: number): void {
      const f = force < 0 ? 0 : force > 1 ? 1 : force;
      gate = Math.min(1, gate + 0.45 + 0.55 * f);
      if (!started) { last = now; started = true; }
    },

    update(now: number): void {
      /**
       * The percussion bay first, because it answers to nothing on this rig.
       *
       * Every other moving thing here is a response to the keyboard being
       * played. This one is a machine running: it keeps going through the rests
       * and through the whole number, which is exactly what makes it read as
       * something nobody is driving.
       */
      if (runner && stepLit) {
        // …once a hand has started it, and not before. The bay is the same
        // machine as the one on a stand and answers to the same rule: a panel
        // stepping before anybody touched it is a machine that started itself.
        const live = runner.running(now);
        stepLit.visible = live;
        if (live) stepLit.matrix.copy(stepAt[runner.step(now)]!);
        for (let i = 0; i < voiceLit.length; i++) {
          // The same decay the box on a stand uses, from the same runner: a
          // hit's own brightness falling away rather than a lamp switching off.
          const level = live ? runner.level(i, now) : 0;
          voiceLit[i]!.visible = level > 0;
          voiceOnMats[i]!.emissiveIntensity = VOICE_GLOW * level;
        }
      }
      if (!started) { last = now; started = true; }
      const dt = Math.min(Math.max(now - last, 0), 0.4);
      last = now;

      const phase = now / lfoBeats - Math.floor(now / lfoBeats);
      const swell = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
      // Squared, because a filament lamp spends most of its cycle dark and the
      // eye reads a linear ramp as a glow rather than as a blink.
      lfoMat.emissiveIntensity = 0.12 + 2.3 * swell * swell;

      if (gate > 0.002) {
        gate *= Math.exp(-dt / 0.22);
        gateMat.emissiveIntensity = 0.2 + 2.6 * gate;
      } else if (gate !== 0) {
        gate = 0;
        gateMat.emissiveIntensity = 0.2;
      }
    },

    dispose(): void {
      disposeTree(group);
    },
  };
};
