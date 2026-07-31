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
 *
 * **How far out the hats are is a fact about the drummer's left leg**, and that
 * is why it changed. The stand carries the pedal, the pedal carries the foot,
 * and the foot is the far end of a leg whose other end is on a throne at
 * `z = −0.95`. At `x = 0.56` the hip-to-ankle span came out a shade *longer*
 * than the leg — `performer-legs.ts` stretches a leg by a percent rather than
 * open a gap at the ankle — so the left leg was pulled dead straight and
 * splayed out sideways for the whole number, with no knee in it at all. Every
 * twelve centimetres in is about eight degrees of knee back, and 0.44 puts the
 * span at nine tenths of the leg: bent, and still a reach.
 */
const HAT_AT = [0.44, 0.980, -0.34] as const;
const CRASH_AT = [0.52, 1.235, 0.12] as const;
const RIDE_AT = [-0.60, 1.050, -0.02] as const;

/**
 * The clap pad, on its own boom — and *forward* of the hats rather than beside
 * them, which is where it used to be and where the left foot now is. Its post
 * ran from the boards at `z = −0.68`, straight up through the middle of the
 * hi-hat's heel plate.
 */
const PAD_AT = [0.62, 0.786, -0.18] as const;

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
 * How far the hats bounce apart on a foot press, and how long that takes to
 * settle, in beats.
 *
 * Without this a chick played on already-shut hats is a gesture with nothing at
 * the end of it: the gap is set to the number it is already at, so the board
 * does not turn, the cymbals do not move, and the leg pumps a pedal that is
 * nailed flat. That is the one drum voice whose whole performance is the foot,
 * and it was the only one you could not see.
 *
 * A rebound rather than a lift, because the lift happens before the beat and
 * `react` does not arrive until the beat — the model is told what was played,
 * never what is about to be. It is also what a shut hi-hat actually does under
 * a foot: the cymbals clash, part a few millimetres off each other, and settle.
 * A third of the open gap is enough to read across a stage and small enough
 * that the board's end of it stays under the sole.
 */
const HAT_CHICK = 0.016;
const HAT_CHICK_TAU = 0.10;

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
   *
   * *Where* along the board is the same question the hi-hat's `HAT_FOOT_ALONG`
   * asks, with the same answer. At `z = −0.22` the shoe hung five centimetres
   * off the toe end of a board that is thirty-two long, and the right leg came
   * out fractionally longer than a leg — dead straight, stretched, and the
   * mirror of the complaint about the left. Back at the board's own pivot the
   * whole shoe is on it, the sole barely moves as the board flattens, which is
   * why the pivot is where it is, and the knee has something to bend.
   */
  bd: { at: [-0.09, 0.045, -0.30], up: [0, 0.993, -0.118] },
  /**
   * The batter head, and both numbers moved once the drummer had a stick in
   * their hand: four centimetres further out, and raked over half as far.
   *
   * A hand is placed by the end of what it holds, so a stick's length of the
   * drummer's reach is now spent behind the strike point rather than in front
   * of it — and the snare is the one drum that sits between the player's own
   * knees, with nowhere for that length to go. Fourteen degrees of rake made it
   * worse again by aiming the retreat downward as well as backward, into the
   * lap. Eight is what a real snare tilts anyway.
   */
  sd: { at: [0.12, 0.745, -0.46], up: [0, 0.99, -0.14] },
  /**
   * The hoop of the same drum, on the forward-left quarter of it.
   *
   * The *near* hoop is where a cross-stick is really struck and it is the one
   * place on this kit a stick cannot reach: thirty centimetres in front of the
   * throne, which puts the fist through the player's stomach. Round the front
   * is the same hoop, at the same angle, within a hand's width of where the
   * cross-stick hand rests — and reachable.
   */
  rim: { at: [0.244, 0.757, -0.336], up: [0.12, 0.96, -0.25] },
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
  cp: { at: [PAD_AT[0], PAD_AT[1] + 0.014, PAD_AT[2]], up: [0, 1, 0] },
  /**
   * The shaker stands in for brushes (`core/types.ts` says so), and brushes
   * live on the snare. Resolving it just above the batter head means a jazz
   * kit's hand goes where a jazz player's hand goes, rather than into the air.
   */
  sh: { at: [0.18, 0.815, -0.42], up: [0, 0.99, -0.14] },
  /** Woodblock, clamped to the bass drum hoop on the player's right. */
  perc: { at: [-0.26, 1.103, 0.234], up: [0, 0.92, -0.40] },
  /** Cowbell, on the same bracket, struck on the shoulder. */
  cb: { at: [0.02, 1.160, 0.242], up: [0, 0.80, -0.60] },
};

/**
 * Sticks at rest, hovering over the middle of the kit.
 *
 * The *tips*, now that there are sticks — the rig places a drummer's hand by
 * the end of what it is holding (`HandPose.tool`), so this point is where the
 * beads park and the fists sit a stick's reach behind it. It moved forward by
 * sixteen centimetres for exactly that reason: at `z = −0.52` the hands landed
 * inside the drummer's own chest.
 */
const REST = { at: [0.10, 0.98, -0.36] as const, up: [0, 1, 0] as const };

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
 * Where the corners of a pad's hexagon sit.
 *
 * A hexagon has two orientations and only one of them is a Simmons: flats top
 * and bottom, corners out to the sides. That matters most on the kick, which is
 * the one hexagon on the kit an audience gets square to, and `CylinderGeometry`
 * starts a corner at `+z` — which, on a shell tipped onto its side, is a corner
 * pointing at the ceiling and a ridge running the length of the top of it.
 *
 * `CircleGeometry` starts a corner a quarter turn round from that, and a
 * quarter turn is this phase for a six-sided thing, so the head and the bottom
 * moulding are already here and the shell is the one that has to be told. All
 * three read it from one place because they have to agree: a shell half a
 * segment off its own caps is a twelve-pointed star at the rim, which is what
 * the kick was.
 */
const HEX_PHASE = Math.PI / 6;

/**
 * The same surface for a pad: hexagonal, and flat.
 *
 * A drum head is a membrane under tension and domes; a pad is a sheet of rubber
 * on a plastic moulding and does not. Built as a six-sided disc at the local
 * origin so it drops into `drum()` exactly where `headGeometry` does, on the
 * phase `CircleGeometry` hands it — see `HEX_PHASE`.
 */
function padGeometry(radius: number, seg = 6): BufferGeometry {
  const g = new CircleGeometry(radius * 0.94, seg);
  g.rotateX(-Math.PI / 2);
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
 *
 * `dome` is how much of that curve survives, and it is the difference between a
 * cymbal and a cymbal pad. A bronze cymbal is hammered and lathed into a shape
 * that catches a light differently at every radius; a pad is rubber laid on a
 * flat plastic disc with a boss in the middle for the bolt, and its profile is
 * a straight line. Flattening it is half of why the pad kit's plates stop
 * reading as metal — the other half is what they are made of, which is the
 * caller's business.
 *
 * `flip` turns the whole bow over, and the one piece on the kit that wants it
 * is the bottom hi-hat plate: two cymbals domed the same way are a pair of
 * parasols stacked on a rod, with the lower one's rim falling away from the
 * upper one's. Turned over, the two bows close on each other and the rims meet,
 * which is the shape a shut hi-hat actually has. The flip is a rotation rather
 * than a negated profile so the lathe's winding — and with it every normal the
 * comment above exists to protect — survives it, and the piece is dropped by
 * its own thickness afterwards so that the rim's upper face stays at `y = 0`:
 * that plane is what `HAT_SHUT` is measured from, so moving it would be a
 * hi-hat that closed through itself.
 */
function cymbalGeometry(radius: number, seg = 20, dome = 1, flip = false): BufferGeometry {
  const bell = radius * 0.16;
  /** Rim first, then inward and up to the bell. */
  const bow: ReadonlyArray<readonly [number, number]> = [
    [radius, 0],
    [radius * 0.55, bell * 0.10 * dome],
    [bell, bell * 0.24 * dome],
    [bell * 0.5, bell * 0.5 * dome],
    [0.0001, bell * 0.55 * dome],
  ];
  const points = bow.map(([r, y]) => new Vector2(r, y));
  for (let i = bow.length - 1; i >= 0; i--) {
    points.push(new Vector2(bow[i]![0], bow[i]![1] - CYMBAL_THICK));
  }
  points.push(new Vector2(radius, 0));   // up the rim, closing the loop
  const g = new LatheGeometry(points, seg);
  if (flip) {
    g.rotateX(Math.PI);
    g.translate(0, -CYMBAL_THICK, 0);
  }
  return g;
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
  /**
   * A drummer on pads is still a drummer, and this is the whole of the
   * difference. See `InstrumentBuildOptions.electronic`.
   *
   * Everything `resolve` answers is untouched — same throne, same layout, same
   * gestures — because that is what a Simmons kit was: a drummer's kit with the
   * shells replaced. What changes is the object, in three ways, and they are
   * the three a camera can resolve at six metres. It is hexagonal, it is flat,
   * and it does not shine.
   */
  const pads = opts.electronic === true;

  const shellHue = opts.finish ?? rng.pick(pads
    // Simmons sold them in black with one coloured edge, and the black is the
    // read. A sparkle-red pad kit would be an acoustic kit that had lost its
    // depth rather than a different instrument.
    ? ['#1a1a1e', '#141418', '#20202a', '#241a22', '#1a2028']
    : ['#8c2f26', '#1d2a3a', '#3d2a1b', '#6d6257', '#2b2b2e']);
  const sparkle = !pads && rng.chance(0.5);

  /**
   * A pad is injection-moulded plastic and there is no such thing as a gloss on
   * it. `metalness` was already zero and it was not enough: a hexagon is six
   * flat panels, and a flat panel takes a light in one piece, so at 0.82 the
   * whole side of a pad lit at once and held it — which is how a sheet of
   * anodised metal behaves, not a moulding, and it is what makes the plates
   * read as metal even with no metal in the material.
   */
  const shellMat = new MeshStandardMaterial({
    color: shellHue,
    roughness: pads ? 0.97 : sparkle ? 0.28 : 0.55,
    metalness: pads ? 0 : sparkle ? 0.35 : 0.05,
  });
  /**
   * Mylar is off-white and catches the lights; a playing surface is black
   * rubber and eats them. Getting this one material wrong is most of what would
   * make a pad kit read as an acoustic kit in the dark — and the playing
   * surface is the flattest panel on the object, so it is the one that showed
   * the sheen first.
   */
  const headMat = new MeshStandardMaterial(pads
    ? { color: '#232327', roughness: 1, metalness: 0 }
    : { color: '#efe7d8', roughness: 0.75, metalness: 0 });
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

  /**
   * A tripod under a cymbal or a snare: three splayed legs and a post.
   *
   * `phase` turns the legs about the post, and the hi-hat is the reason it is a
   * parameter. Three legs at 120° always put one within 60° of any direction
   * you care about, and at the default the hi-hat's third leg came back at the
   * player and landed inside the shoe on the footboard. Pointing one leg
   * straight down the kit puts the other two at ±30° off the back, which is a
   * pedal arriving between two legs — which is how a hi-hat stand is built.
   */
  function tripod(at: Vector3, top: number, phase = 0.4): void {
    strut(tubeSlots, new Vector3(at.x, 0.02, at.z), new Vector3(at.x, top, at.z));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + phase;
      strut(legSlots, new Vector3(at.x, 0.30, at.z), new Vector3(
        at.x + Math.cos(a) * 0.26, 0.01, at.z + Math.sin(a) * 0.26,
      ));
    }
  }

  // --- Drums ---------------------------------------------------------------

  const shells: Record<ShellId, { head: Mesh; hit: Hit }> = {} as never;
  /**
   * Where each pad's surface rests, in its own drum's local frame.
   *
   * Only populated for a pad kit, and only because a pad is depressed rather
   * than dished — so `update` needs a datum to return it to. The acoustic kit
   * scales its dome instead and never reads this. Local rather than world on
   * purpose: `stand` has already rotated the drum, so local `y` is along the
   * pad's own normal, which is the direction a stick actually pushes it.
   */
  const padRestY: Partial<Record<ShellId, number>> = {};

  /**
   * One drum, built about its own centre with the batter head at `+y`. The
   * kick is the same object rotated onto its side, which is what a kick is.
   */
  function drum(id: ShellId, radius: number, depth: number): Group {
    const g = addTo(root, new Group());

    /**
     * Six sides on a pad kit and twenty on an acoustic one, which is the same
     * lathe doing both jobs — a hexagon *is* a cylinder with six segments, and
     * the hexagonal shell is the single most recognisable thing about the
     * object. Which six, though, is `HEX_PHASE`: at twenty segments the start
     * angle is invisible and at six it is the difference between a Simmons and
     * a hex nut. `open: true` stays either way: the top is the head and the
     * bottom is capped by `back` below.
     */
    const shell = addTo(g, new Mesh(
      new CylinderGeometry(
        radius, radius, depth, pads ? 6 : 20, 1, true, pads ? HEX_PHASE : 0,
      ), shellMat,
    ));
    shell.castShadow = true;
    shell.receiveShadow = true;

    // No hoops on a pad: there is no head to tension, and a chrome ring round
    // a Simmons pad is the detail that would give the whole thing away.
    if (!pads) {
      for (const side of [1, -1]) {
        const hoop = addTo(g, new Mesh(
          new CylinderGeometry(radius * 1.04, radius * 1.04, 0.024, 20, 1, true), chromeMat,
        ));
        hoop.position.y = (side * depth) / 2;
      }
    }

    const head = addTo(g, new Mesh(
      pads ? padGeometry(radius) : headGeometry(radius), headMat,
    ));
    head.name = `head:${id}`;
    head.position.y = depth / 2;
    head.receiveShadow = true;

    // An acoustic drum has a resonant head on the bottom; a pad has a moulding.
    const back = addTo(g, new Mesh(
      new CircleGeometry(radius, pads ? 6 : 20), pads ? shellMat : headMat,
    ));
    back.name = `shell:${id}`;
    back.rotation.x = Math.PI / 2;
    back.position.y = -depth / 2;

    if (pads) padRestY[id] = head.position.y;
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

  /**
   * Stand a drum up so that its batter head *is* the contact `LAYOUT` names.
   *
   * The tilt used to be written a second time, as a `rotation.x` per drum, and
   * the second copy had the sign backwards: the drummer sits at `z = −0.95`
   * (see `station`) and every normal in `LAYOUT` leans that way — negative
   * `z`, uphill toward the player, as the header says — while a positive
   * `rotation.x` tilts a head toward `+z`. So the rack toms were raked over to
   * face the audience, and the hands went on lying on the surface the table
   * described, which is not the surface anybody could see.
   *
   * Deriving both from the one entry is what makes that class of bug
   * impossible rather than merely fixed. The head sits at `depth / 2` up the
   * drum's own axis, so backing the centre off by that much along the normal
   * lands the head exactly on the strike point, which the hand-written
   * positions were also missing by about a centimetre each.
   *
   * The kick is not in here on purpose: `LAYOUT.bd` is the *pedal board*, not
   * a head, and a kick lies on its side by definition.
   */
  function stand(g: Object3D, voice: DrumVoice, depth: number): Vector3 {
    const spec = LAYOUT[voice];
    const up = new Vector3(spec.up[0], spec.up[1], spec.up[2]).normalize();
    g.quaternion.setFromUnitVectors(yUp, up);
    g.position.set(spec.at[0], spec.at[1], spec.at[2]).addScaledVector(up, -depth / 2);
    return g.position.clone();
  }

  /**
   * How deep a pad is, whatever drum it is standing in for.
   *
   * The one number that makes a pad kit read as a pad kit from the side: a
   * Simmons pad is a hexagonal biscuit about six centimetres thick, where the
   * floor tom it replaces is thirty-six. Depth has to go through `stand` as
   * well as `drum` — that function backs the shell off along its own normal by
   * half its depth so the *head* lands on the contact `LAYOUT` names — so a pad
   * that were shallow in one and not the other would put every gesture on this
   * kit a centimetre or two off its surface.
   */
  const PAD_DEEP = 0.055;
  const deep = (acoustic: number): number => (pads ? PAD_DEEP : acoustic);

  // Snare: 14x5.5, tilted a little toward the player.
  const snareD = deep(0.135);
  const snare = drum('snare', 0.175, snareD);
  const sdAt = stand(snare, 'sd', snareD);
  tripod(new Vector3(sdAt.x, 0.60, sdAt.z), 0.60);

  const htD = deep(0.20);
  const mtD = deep(0.22);
  const ht = drum('high', 0.155, htD);
  const mt = drum('mid', 0.175, mtD);
  const htAt = stand(ht, 'ht', htD);
  const mtAt = stand(mt, 'mt', mtD);

  // The rack toms hang off one post out of the bass drum, the way they do. The
  // arms end at the shells rather than near them, so that moving a tom moves
  // the thing holding it up.
  strut(tubeSlots, new Vector3(0.02, 0.55, 0.15), new Vector3(0.02, 1.02, 0.18));
  strut(tubeSlots, new Vector3(0.02, 0.95, 0.16), htAt);
  strut(tubeSlots, new Vector3(0.02, 0.95, 0.16), mtAt);

  const ltD = deep(0.36);
  const lt = drum('floor', 0.205, ltD);
  const ltAt = stand(lt, 'lt', ltD);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.7;
    strut(legSlots, new Vector3(ltAt.x + Math.cos(a) * 0.20, 0.60, ltAt.z + Math.sin(a) * 0.20),
      new Vector3(ltAt.x + Math.cos(a) * 0.23, 0.01, ltAt.z + Math.sin(a) * 0.23));
  }

  // The clap pad: a small rubber disc on a short boom by the hats — and six
  // sided on a pad kit, where it is the only round pad on a rack of hexagons.
  const padGeo = new CylinderGeometry(
    0.075, 0.075, 0.028, pads ? 6 : 16, 1, false, pads ? HEX_PHASE : 0,
  );
  const pad = addTo(root, new Mesh(padGeo, pads ? headMat : darkMat));
  pad.name = 'head:pad';
  pad.position.set(PAD_AT[0], PAD_AT[1], PAD_AT[2]);
  pad.castShadow = true;
  shells['pad'] = { head: pad, hit: new Hit() };
  strut(tubeSlots,
    new Vector3(PAD_AT[0], 0.02, PAD_AT[2]),
    new Vector3(PAD_AT[0], PAD_AT[1] - 0.016, PAD_AT[2]));

  // Lugs are the detail that makes a shell read as a drum, and forty separate
  // draw calls for them would be a poor trade. One instanced mesh for the kit,
  // placed through each drum's own matrix so the kick's lie on their side too.
  //
  // A pad has none of them, for the reason it has no hoops: a lug tensions a
  // head, and there is no head here. They were also the last bright thing left
  // on a pad kit — thirty-four chrome blocks, each one standing the full depth
  // of the pad it was bolted to and eight of them ringing the face of the kick
  // — so a moulded black hexagon came out studded in metal, which is the one
  // finish it cannot have.
  if (!pads) {
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

  /**
   * A pad kit's cymbals are cymbal *pads*, and they were the brightest thing
   * left on the object: three discs of `brassMat` at `metalness: 0.9` hanging
   * over a kit with no metal anywhere else on it, which is a Simmons rack
   * someone had hung real bronze on.
   *
   * Both halves of a cymbal's read change. `dome` takes the hammered bow out —
   * a pad is a flat disc with a boss for the bolt — and the surface becomes the
   * same black rubber as the heads, because on an electronic kit it is the same
   * black rubber as the heads. The thickness does not change: `CYMBAL_THICK` is
   * what `HAT_SHUT` is measured in, so a fatter plate would be a hi-hat that
   * closed through itself.
   */
  const plateMat = pads ? headMat : brassMat;
  const PLATE_DOME = pads ? 0.18 : 1;

  function cymbal(id: CymbalId, radius: number, at: readonly [number, number, number], lean: number): Mesh {
    const mesh = addTo(root, new Mesh(cymbalGeometry(radius, 20, PLATE_DOME), plateMat));
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

  // Hi-hat: two cymbals, and the gap between them is the whole point — which is
  // why the lower one is turned over (`flip`) rather than being a second copy
  // of the upper. Two bows domed the same way part at the rim and touch nowhere.
  const hatBottom = addTo(root, new Mesh(cymbalGeometry(0.17, 20, PLATE_DOME, true), plateMat));
  hatBottom.name = 'cymbal:hatBottom';
  hatBottom.position.set(HAT_AT[0], HAT_AT[1], HAT_AT[2]);
  hatBottom.rotation.z = -0.10;
  hatBottom.receiveShadow = true;
  const hatTop = cymbal('hatTop', 0.175, HAT_AT, -0.10);
  // One leg down the kit, two splayed off the back with the pedal between them.
  tripod(new Vector3(HAT_AT[0], 0.40, HAT_AT[2]), HAT_AT[1] - 0.01, Math.PI / 2);

  cymbal('crash', 0.21, CRASH_AT, -0.20);
  tripod(new Vector3(0.60, 0.60, 0.22), 1.10);
  strut(tubeSlots, new Vector3(0.60, 1.10, 0.22), new Vector3(CRASH_AT[0], CRASH_AT[1] - 0.005, CRASH_AT[2]));

  cymbal('ride', 0.26, RIDE_AT, 0.17);
  tripod(new Vector3(-0.66, 0.50, 0.10), 1.00);
  strut(tubeSlots, new Vector3(-0.66, 1.00, 0.10), new Vector3(RIDE_AT[0], RIDE_AT[1] - 0.005, RIDE_AT[2]));

  // --- Cowbell and woodblock, on a bracket off the tom post ----------------

  /**
   * Two more pads, on a pad kit, because a cowbell is a lump of cast steel and
   * a woodblock is a lump of rosewood and neither of them is a thing an
   * electronic kit has. What it has instead is another trigger on the same
   * bracket, and a Simmons trigger is a small hexagon whatever it is called in
   * the part of the arrangement that hits it — which is exactly the trade the
   * whole `pads` flag makes: the kit answers the same, and the object is
   * different.
   *
   * Half-height is the one number the rest of the section needs off them, and
   * it is the one that changes: a biscuit is not as tall as a cowbell. It is
   * what `stand` backs each piece off its contact by, and what `underside`
   * reaches up into to find the end of its arm — so the bracket follows the
   * swap without being told about it.
   */
  const auxPad = (radius: number): BufferGeometry =>
    new CylinderGeometry(radius, radius, PAD_DEEP, 6, 1, false, HEX_PHASE);
  const bellHalf = pads ? PAD_DEEP / 2 : 0.05;
  const blockHalf = pads ? PAD_DEEP / 2 : 0.025;

  const bell = addTo(root, new Mesh(
    pads ? auxPad(0.058) : new BoxGeometry(0.055, 0.10, 0.075), pads ? headMat : brassMat,
  ));
  bell.castShadow = true;
  const block = addTo(root, new Mesh(
    pads ? auxPad(0.068) : new BoxGeometry(0.16, 0.05, 0.055), pads ? headMat : woodMat,
  ));
  block.castShadow = true;

  /**
   * Both pieces hang the way a drum stands: off the contact that names them.
   *
   * Their tilts were written here instead, as a `rotation.x` each, and both had
   * the sign backwards — the second-opinion bug `stand` exists to end, in the
   * one corner of the kit that never went through it. `LAYOUT.cb.up` leans at
   * the player, the way every normal in that table does; `rotation.x = 0.5`
   * leans at the audience. On a brass box nobody could tell, and the hand
   * landing on the far face of a cowbell reads as a hand landing on a cowbell.
   * A hexagonal pad is a *face*, and a face put the wrong way round is a pad
   * turned to play to the crowd, which is what was reported.
   *
   * The positions go with it and had to: the contact is a point on the struck
   * surface, so a piece that turned in place would have left its own strike
   * point hanging in the air off the front edge. `stand` backs the centre off
   * along the normal by half the piece to land the surface on the point — half
   * a drum's depth there, half a biscuit's height here, doubled on the way in
   * because it is the same arithmetic and there is no sense in a second copy of
   * it.
   */
  const bellBase = stand(bell, 'cb', bellHalf * 2).y;
  const blockBase = stand(block, 'perc', blockHalf * 2).y;

  /**
   * Where a mounted piece's underside is: the centre of the bottom face of its
   * box, carried through the piece's own tilt, and then sunk a little way into
   * the wood, the brass, or the moulding that stands in for both.
   *
   * The inset is not cosmetic. Both pieces bob on a hit and the bob is a signed
   * oscillation, so a tip that merely touched the bottom face at rest would
   * part from it on the up-swing. Sinking it further than the amplitude means
   * the joint can only ever be tighter than it looks, never open.
   */
  function underside(mesh: Mesh, halfHeight: number): Vector3 {
    return mesh.position.clone().add(
      new Vector3(0, -halfHeight + 0.016, 0).applyEuler(mesh.rotation),
    );
  }

  /**
   * Both pieces used to hang off the end of one diagonal tube that ran past
   * them rather than to them: the cowbell floated about eight centimetres clear
   * of the bracket and the woodblock was out beyond its far end entirely.
   *
   * So the arms now end on the pieces. The cowbell is a topper straight off the
   * head of the tom post, which is where a spare bell goes on a real kit, and
   * the woodblock is out on a boom from the same clamp with a short riser under
   * it — an L, the shape a percussion arm actually is. Both ends are derived
   * from the mesh transforms above, so moving a piece moves its mount.
   */
  const POST_TOP = new Vector3(0.02, 1.02, 0.18);
  const blockFoot = underside(block, blockHalf);
  const elbow = new Vector3(blockFoot.x, POST_TOP.y, blockFoot.z);
  strut(tubeSlots, POST_TOP, underside(bell, bellHalf));
  strut(tubeSlots, POST_TOP, elbow);
  strut(tubeSlots, elbow, blockFoot);
  const aux: Record<'cb' | 'perc', { mesh: Mesh; hit: Hit; base: number }> = {
    cb: { mesh: bell, hit: new Hit(), base: bellBase },
    perc: { mesh: block, hit: new Hit(), base: blockBase },
  };

  // --- Pedals --------------------------------------------------------------

  /**
   * A footboard: heel plate on the boards at the player's end, toe end raised
   * toward the drum, and pressing flattens it — about the heel or about the
   * middle, which is `pedal`'s argument and its own paragraph.
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
  const PEDAL_THICK = 0.016;

  /**
   * `pivot` is where the board turns, and the two pedals want different
   * answers because their feet do.
   *
   * The kick's foot is aimed at one contact by every stroke — `LAYOUT.bd`, a
   * point on the board at rest — so its board has to stay under that point:
   * turning about its middle moves the sole's end of it by millimetres, which
   * is a pedal going down without a shoe hovering off it. The hat's foot is
   * placed at *two* contacts, up and down, so its board turns where a real one
   * is hinged, and the two and a half centimetres its toe travels are exactly
   * the two and a half centimetres the leg does.
   *
   * Either way the rest pose is the same board in the same place: the pivot is
   * placed by walking back along the board's own axis, so moving it does not
   * move the geometry.
   */
  function pedal(
    id: 'kick' | 'hat', x: number, toeZ: number, heelZ: number,
    pivot: 'heel' | 'middle',
  ): { hinge: Group; hit: Hit; tilt: number } {
    const len = toeZ - heelZ;
    // Negative pitch lifts the `+z` end, and `+z` is the toe on both pedals.
    const tilt = -Math.atan2(PEDAL_TOE_Y - PEDAL_HEEL_Y, len);
    const back = pivot === 'heel' ? len / 2 : 0;
    const hinge = addTo(root, new Group());
    hinge.position.set(
      x,
      (PEDAL_HEEL_Y + PEDAL_TOE_Y) / 2 + Math.sin(tilt) * back,
      (heelZ + toeZ) / 2 - Math.cos(tilt) * back,
    );
    hinge.rotation.x = tilt;
    const board = addTo(hinge, new Mesh(new BoxGeometry(0.10, PEDAL_THICK, len), darkMat));
    board.name = `pedal:${id}`;
    board.position.z = back;
    board.castShadow = true;
    const plate = addTo(root, new Mesh(new BoxGeometry(0.13, 0.012, 0.10), chromeMat));
    plate.position.set(x, 0.008, heelZ - 0.03);
    return { hinge, hit: new Hit(), tilt };
  }

  // Toe toward the drum, heel toward the throne — the drummer sits at `-z`.
  //
  // The hat board is placed off `HAT_AT` rather than beside it, because a
  // footboard that did not move with its own stand is a pedal connected to
  // nothing: the rod comes out of the toe end of it.
  const kickPedal = pedal('kick', -0.09, -0.12, -0.44, 'middle');
  const hatPedal = pedal('hat', HAT_AT[0], HAT_AT[2] - 0.02, HAT_AT[2] - 0.32, 'heel');

  /**
   * Where the sole of the left shoe sits, with the hat board at `angle`.
   *
   * Derived rather than written down, because there are now two of them and
   * they have to be the same two positions the board actually takes: the
   * contact is a point on the board's top face, `HAT_FOOT_ALONG` from the
   * hinge, carried by the hinge. A hand-written pair would be a second opinion
   * about the same hinge, and the first one to be edited would be right.
   */
  /**
   * How far up the board the sole sits.
   *
   * A hi-hat's hinge is at the *back* of its board, so a whole foot laid on it
   * from the heel forward puts the ankle about here. It was 0.20, which hung
   * the toe six centimetres off the front of a thirty-centimetre board and
   * bought another two of reach for a leg that had none to spare.
   */
  const HAT_FOOT_ALONG = 0.15;
  function hatFoot(angle: number): Contact {
    const s = Math.sin(angle), c = Math.cos(angle), t = PEDAL_THICK / 2;
    return {
      position: new Vector3(
        hatPedal.hinge.position.x,
        hatPedal.hinge.position.y + t * c - HAT_FOOT_ALONG * s,
        hatPedal.hinge.position.z + t * s + HAT_FOOT_ALONG * c,
      ),
      normal: new Vector3(0, c, s),
    };
  }
  /** Pedal down, hats shut; pedal up, hats parted. Both are geometry. */
  const HAT_FOOT_DOWN = hatFoot(0);
  const HAT_FOOT_UP = hatFoot(hatPedal.tilt);

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
  /** The foot's own mark on the hats, on top of whatever state they are in. */
  const hatChick = new Hit();

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
          // Two places, not one — see `PlayPoint.shut`. A foot that only ever
          // had the board's rest position to stand on could not open a hi-hat,
          // and the cymbals parted with the leg holding still under them.
          if (point.which === 'hat') return point.shut === false ? HAT_FOOT_UP : HAT_FOOT_DOWN;
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
          // The foot coming off is the whole of an open hat, and it makes no
          // sound; the foot going down chicks.
          if (point.shut === false) hatGap.set(now, HAT_OPEN);
          else {
            hatGap.set(now, HAT_SHUT);
            cymbals.hatTop.hit.fire(now, f * 0.3);
            // The press itself, which the gap alone cannot carry: shutting hats
            // that are already shut is a change of nothing. See `HAT_CHICK`.
            hatChick.fire(now, f);
          }
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
        /**
         * A membrane inverts and a pad does not. `scale.y` on the dome is what
         * dishing a head *is*, and applying it to a flat disc scales zero by a
         * number and moves nothing at all — so a pad kit would have been a kit
         * with no response in it, which is the failure the whole `react`/`update`
         * split exists to avoid. Rubber over plastic gives about a millimetre,
         * so the pad drops instead, exactly as the clap pad beside it already
         * did for the same reason.
         */
        if (id === 'pad') s.head.position.y = PAD_AT[1] - d * 0.010;
        else if (pads) s.head.position.y = padRestY[id]! - d * 0.004;
        else s.head.scale.y = 1 - d * 2.2;
      }

      // Cymbals rock, and they have to rock *visibly* or a struck crash reads
      // as a painted disc. Each one gets its own swing and its own ring: a
      // crash is a sail on a stick and flaps for a bar, a ride is stiffer and
      // shorter, and the hats are two cymbals clamped together and barely move
      // at all. The vertical bob is small but it is what sells the hit from
      // straight on, where a rotation about the stand is nearly invisible.

      // The gap, once, for everything made of it. The eased state is where the
      // foot is holding the hats; the chick is the press that put it there, and
      // a press onto hats that were already shut is *only* the second term.
      const gap = hatGap.value(now) + HAT_CHICK * hatChick.decay(now, HAT_CHICK_TAU);

      for (const id of ['hatTop', 'crash', 'ride'] as CymbalId[]) {
        const c = cymbals[id];
        const m = CYMBAL_MOTION[id];
        const w = c.hit.wobble(now, m.tau, m.hz);
        c.mesh.rotation.z = c.tilt + w * m.swing;
        c.mesh.rotation.x = w * m.swing * 0.55;
        c.mesh.position.y = c.baseY + w * m.swing * 0.04
          + (id === 'hatTop' ? gap : 0);
      }

      // A pressed board flattens onto the boards; it does not swing past them.
      kickPedal.hinge.rotation.x = kickPedal.tilt * (1 - kickPedal.hit.decay(now, 0.22));

      // The hat board is not driven by its own hits at all: it is drawn from
      // the gap, because the gap is *made of* the board. A pedal that rose on
      // its own while the hats stayed shut would be a hi-hat held closed by
      // nothing, and a stick-played open hat would part two cymbals over a
      // pedal that never moved. One number, drawn twice — the chick included,
      // which is why it is a term in `gap` rather than a second opinion here —
      // and the same number the choreography sent the foot to, so the leg, the
      // board and the daylight between the cymbals cannot disagree.
      const open = (gap - HAT_SHUT) / (HAT_OPEN - HAT_SHUT);
      hatPedal.hinge.rotation.x = hatPedal.tilt * (open < 0 ? 0 : open > 1 ? 1 : open);

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
