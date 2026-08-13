/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The mallet instrument — a vibraphone, or a marimba.
 *
 * **Fourteen catalogue entries land here**, counted off `ARCHETYPE_OF`:
 * vibraphone, electricVibes, glockenspiel, tubularBells, musicBox, kalimba,
 * marimba, xylophone, balafon, timpani, dulcimer, steelDrums, agogo,
 * woodblock and melodicTom. Only some carry a `SCALE_OF` entry, so the rest
 * arrive at this model's one size.
 *
 * Every one of them used to arrive as three and a half octaves of aluminium
 * with a motor under it, and for a third of them that is the wrong material on
 * the one part of the instrument the audience is looking at. So this builds two
 * objects, off `InstrumentBuildOptions.bars`:
 *
 *  - **metal** — a vibraphone, which is what `ARCHETYPES.mallets` calls the
 *    archetype and what every caller gets by default. Bars in two rows laid out
 *    like a keyboard, a resonator under every one of them, a damper bar and a
 *    pedal, and the rotating discs that no other instrument on a stage has.
 *  - **wood** — a marimba, and the same instrument to every hand that plays it:
 *    the same rows, the same layout, the same work height, so `resolve` answers
 *    identically and the choreography never learns which one it is standing at.
 *    What changes is the half a marimba does not share. The bars are rosewood
 *    and half again as thick, they are dead inside a beat where a vibraphone
 *    bar rings for three, the resonators hang a good deal further toward the
 *    boards — and there is **no motor and no damper pedal**, because a marimba
 *    has never had either.
 *
 * The discs are the reason the metal build is worth building rather than
 * faking. They turn *all the time*, independently of anything being played, and
 * a thing that moves when nothing has happened is what separates a working
 * instrument from a prop. Their absence is the fastest way to read a marimba
 * from the twelfth row, which is the same argument from the other end.
 *
 * Layout follows every other keyboard here: naturals in the near row, sharps
 * raised behind them on the boundaries between their neighbours, low notes at
 * `+x` under the player's left hand and pitch rising toward `-x`.
 */

import {
  BoxGeometry, BufferGeometry, CylinderGeometry, Group, InstancedMesh, Material,
  Matrix4, Mesh, MeshStandardMaterial, Object3D, Quaternion, Vector3,
} from 'three';

import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import {
  addTo, type Contact, type InstrumentBuilder, type InstrumentModel,
} from './types.js';

const BLACK = [false, true, false, true, false, false, true, false, true, false, true, false];
const WHITE_AT = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];

/** F3..C7 — three and a half octaves, exactly what the archetype declares. */
const LOW = 53;
const HIGH = 96;

/** Bar-to-bar spacing across the naturals. A real vibe is about this wide. */
const PITCH = 0.052;
const NATURAL_W = 0.046;
const SHARP_W = 0.040;

const NATURAL_Y = 0.900;   // the archetype's workHeight
const SHARP_Y = 0.955;
const NATURAL_Z = -0.14;
const SHARP_Z = 0.11;

function whiteIndex(midi: number): number {
  return Math.floor(midi / 12) * 7 + WHITE_AT[midi % 12]!;
}
const NATURAL_COUNT = whiteIndex(HIGH) - whiteIndex(LOW) + 1;
const ROW_W = NATURAL_COUNT * PITCH;

function barU(midi: number): number {
  const i = whiteIndex(midi) - whiteIndex(LOW);
  return BLACK[midi % 12]! ? (i + 1) * PITCH : (i + 0.5) * PITCH;
}
function barX(midi: number): number {
  return ROW_W / 2 - barU(midi);
}
/** How far up the instrument a note is, 0 at the bottom bar and 1 at the top. */
function barT(midi: number): number {
  return (midi - LOW) / (HIGH - LOW);
}
/** Bars get shorter as they get higher, which is most of a vibraphone's shape. */
function barLength(midi: number): number {
  return 0.255 - 0.115 * barT(midi);
}

/**
 * What a struck bar does, from the bottom bar to the top, per material.
 *
 * A vibraphone's low bars are long, heavy and slow: an F3 rings for the better
 * part of ten seconds and its flex is something you can watch, while a C7 is a
 * finger-length of aluminium that ticks and is done. Every bar used to decay on
 * the same 1.1 beats with the same 5.5 mm dip at the same 2.4 Hz, which made a
 * strike say nothing at all about which note it was — the one piece of
 * information a mallet instrument has that a drum does not.
 *
 * **Rosewood is not slow aluminium, it is a different envelope.** The catalogue
 * has said so since the marimba was added — `decay: 0.9` against a vibraphone's
 * default, and the xylophone's 0.35 under it — and the picture said nothing.
 * A marimba bar is thick, stiff and heavily damped by its own material: it
 * takes a strike, moves less than a metal bar of the same pitch, twitches at
 * better than twice the rate and is still by the time a vibraphone's has
 * finished its first swing. Same shape of motion, four numbers apart.
 */
interface BarFeel {
  /** How long a struck bar keeps moving, in beats, at the bottom and the top. */
  ringLow: number;
  ringHigh: number;
  /** How far it dips, metres, over the same span. */
  dipLow: number;
  dipHigh: number;
  /** And how fast it flexes about its cords. A long bar wobbles slowly. */
  flexLow: number;
  flexHigh: number;
}

const FEEL: Record<'metal' | 'wood', BarFeel> = {
  metal: {
    ringLow: 2.0, ringHigh: 0.55, dipLow: 0.0085, dipHigh: 0.0030,
    flexLow: 1.7, flexHigh: 3.8,
  },
  wood: {
    ringLow: 0.60, ringHigh: 0.20, dipLow: 0.0055, dipHigh: 0.0020,
    flexLow: 3.6, flexHigh: 7.0,
  },
};

/**
 * Bar thickness, metres. A rosewood bar is half again a vibraphone bar's
 * aluminium, and it is the one proportion of this instrument that reads as a
 * material rather than as a colour: a marimba's low bars are planks.
 */
const BAR_THICK: Record<'metal' | 'wood', number> = { metal: 0.014, wood: 0.022 };

const mix = (lo: number, hi: number, t: number): number => lo + (hi - lo) * t;

class Hit {
  beat = -1e9;
  force = 0;
  fire(now: number, force: number): void {
    this.beat = now;
    this.force = force < 0 ? 0 : force > 1 ? 1 : force;
  }
  wobble(now: number, tau: number, hz: number): number {
    const age = now - this.beat;
    if (age < 0 || age > tau * 6) return 0;
    return this.force * Math.exp(-age / tau) * Math.cos(age * Math.PI * 2 * hz);
  }
  level(now: number, tau: number): number {
    const age = now - this.beat;
    if (age < 0 || age > tau * 6) return 0;
    return Math.exp(-age / tau);
  }
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
    if ((o as InstancedMesh).isInstancedMesh) (o as InstancedMesh).dispose();
  });
  for (const g of geometries) g.dispose();
  for (const m of materials) m.dispose();
  root.clear();
}

export const buildMallets: InstrumentBuilder = (opts) => {
  const wood = opts.bars === 'wood';
  const feel = FEEL[wood ? 'wood' : 'metal'];
  const barThick = BAR_THICK[wood ? 'wood' : 'metal'];
  const rng = new Rng(`mallets:${opts.seed}`);
  const root = new Group();
  root.name = wood ? 'mallets:wood' : 'mallets';

  /**
   * A wooden instrument gets a wooden frame, and it is not only a colour.
   * A vibraphone's rails are a painted steel trolley; a marimba's are a rail
   * frame in the same rosewood as the bars, and a balafon's are bamboo lashed
   * to a gourd rack. All three are warm and none of them is a dark grey box.
   */
  const frameColour = opts.finish ?? rng.pick(wood
    ? ['#5a3a22', '#6b4526', '#43301f']
    : ['#2a2c30', '#1d1f22', '#3a2a1c']);
  const frameMat = new MeshStandardMaterial({
    color: frameColour, roughness: wood ? 0.72 : 0.5, metalness: wood ? 0.05 : 0.3,
  });
  const barMat = new MeshStandardMaterial(wood
    ? { color: '#8a4f2c', roughness: 0.52, metalness: 0.02 }
    : { color: '#cfd6dc', roughness: 0.26, metalness: 0.82 });
  // The sharps are the darker row either way — a shade of aluminium on a vibe,
  // and on a marimba genuinely darker wood cut from further down the log.
  const sharpMat = new MeshStandardMaterial(wood
    ? { color: '#6f3d21', roughness: 0.52, metalness: 0.02 }
    : { color: '#b9c2ca', roughness: 0.26, metalness: 0.82 });
  // Both instruments hang aluminium tubes; a marimba's are matte where a
  // vibraphone's are polished, because a vibraphone's have to be a mirror for
  // the discs turning in their mouths.
  const tubeMat = new MeshStandardMaterial(wood
    ? { color: '#8d939a', roughness: 0.58, metalness: 0.5 }
    : { color: '#9aa4ad', roughness: 0.35, metalness: 0.7 });
  const discMat = new MeshStandardMaterial({ color: '#d8dde2', roughness: 0.3, metalness: 0.75 });
  const feltMat = new MeshStandardMaterial({ color: '#6d2029', roughness: 0.95, metalness: 0 });
  const cordMat = new MeshStandardMaterial({ color: '#22242a', roughness: 0.9, metalness: 0 });

  const naturals: number[] = [];
  const sharps: number[] = [];
  for (let m = LOW; m <= HIGH; m++) (BLACK[m % 12]! ? sharps : naturals).push(m);

  // --- Bars ----------------------------------------------------------------

  /**
   * Unit bars, stretched per instance. One geometry for the whole natural row
   * and one for the sharps; the length taper lives entirely in the matrices.
   */
  const naturalGeo = new BoxGeometry(NATURAL_W, barThick, 1);
  const sharpGeo = new BoxGeometry(SHARP_W, barThick, 1);
  const naturalMesh = addTo(root, new InstancedMesh(naturalGeo, barMat, naturals.length));
  const sharpMesh = addTo(root, new InstancedMesh(sharpGeo, sharpMat, sharps.length));
  naturalMesh.name = 'bars:natural';
  sharpMesh.name = 'bars:sharp';
  naturalMesh.castShadow = true;
  sharpMesh.castShadow = true;

  interface Bar {
    mesh: InstancedMesh; slot: number; home: Vector3; len: number; hit: Hit;
    /** This bar's own ring, dip and flex rate. See `RING_LOW` and friends. */
    ring: number; dip: number; flex: number;
  }
  const bars = new Map<number, Bar>();
  const scratch = new Matrix4();
  const noRot = new Quaternion();

  function seat(mesh: InstancedMesh, list: number[], y: number, z: number): void {
    list.forEach((midi, slot) => {
      const len = barLength(midi);
      const home = new Vector3(barX(midi), y, z);
      scratch.compose(home, noRot, new Vector3(1, 1, len));
      mesh.setMatrixAt(slot, scratch);
      const t = barT(midi);
      bars.set(midi, {
        mesh, slot, home, len, hit: new Hit(),
        ring: mix(feel.ringLow, feel.ringHigh, t),
        dip: mix(feel.dipLow, feel.dipHigh, t),
        flex: mix(feel.flexLow, feel.flexHigh, t),
      });
    });
    mesh.instanceMatrix.needsUpdate = true;
  }
  // The *top* of the bar is the playing surface and sits at the work height,
  // which is why the seat is half a thickness under it rather than at it. A
  // thicker bar therefore grows downward and a mallet lands in the same place.
  seat(naturalMesh, naturals, NATURAL_Y - barThick / 2, NATURAL_Z);
  seat(sharpMesh, sharps, SHARP_Y - barThick / 2, SHARP_Z);

  // --- Resonators ----------------------------------------------------------

  /**
   * A tube under every bar, tuned by length — which is why the row looks like
   * a pipe organ lying on its back and why a vibraphone reads as a vibraphone
   * from the side rather than only from above.
   *
   * **A marimba's hang much further down**, and it is the second silhouette
   * difference after the missing motor. A resonator is tuned to its bar, and a
   * marimba's bottom bars are lower than a vibraphone's *and* asked to speak
   * with more of the tube's help, so the low end of the row very nearly reaches
   * the boards — which is exactly the shape a player standing behind one is
   * standing behind. The tubes are fatter to match.
   */
  const tubeR = wood ? 0.028 : 0.024;
  const tubeGeo = new CylinderGeometry(tubeR, tubeR, 1, 10, 1, true);
  tubeGeo.translate(0, -0.5, 0);   // hang from the top
  const tubeLow = wood ? 0.62 : 0.50;
  /** Clear of the bar above it, whatever that bar is made of. */
  const tubeTop = 0.041 + barThick;
  function resonators(list: number[], topY: number, z: number): InstancedMesh {
    const mesh = addTo(root, new InstancedMesh(tubeGeo, tubeMat, list.length));
    list.forEach((midi, i) => {
      const len = Math.max(0.055, tubeLow * Math.pow(2, -(midi - LOW) / 12));
      scratch.compose(new Vector3(barX(midi), topY, z), noRot, new Vector3(1, len, 1));
      mesh.setMatrixAt(i, scratch);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    return mesh;
  }
  resonators(naturals, NATURAL_Y - tubeTop, NATURAL_Z);
  resonators(sharps, SHARP_Y - tubeTop, SHARP_Z);

  // --- Rotating discs ------------------------------------------------------

  /**
   * The motor. Two shafts, a disc at the mouth of every resonator, turning
   * whether or not anybody is playing. This is the only part of any model in
   * this family that moves without being struck, and it is worth the two
   * instanced meshes on its own.
   *
   * **Metal only.** The vibrato this drives is what the instrument is named
   * after and a marimba does not have it — no discs, no shafts, no motor
   * housing. Building them anyway and leaving them still would be worse than
   * building them and letting them turn: a row of stopped discs is a broken
   * vibraphone rather than a marimba.
   */
  const discGeo = new CylinderGeometry(0.023, 0.023, 0.0025, 10);
  const shafts: Group[] = [];
  function discRow(list: number[], y: number, z: number): void {
    const shaft = addTo(root, new Group());
    shaft.position.set(0, y, z);
    const mesh = addTo(shaft, new InstancedMesh(discGeo, discMat, list.length));
    list.forEach((midi, i) => {
      scratch.makeTranslation(barX(midi), 0, 0);
      mesh.setMatrixAt(i, scratch);
    });
    mesh.instanceMatrix.needsUpdate = true;
    const rod = addTo(shaft, new Mesh(new CylinderGeometry(0.005, 0.005, ROW_W + 0.12, 6), frameMat));
    rod.rotation.z = Math.PI / 2;
    shafts.push(shaft);
  }
  if (!wood) {
    discRow(naturals, NATURAL_Y - 0.034 - barThick, NATURAL_Z);
    discRow(sharps, SHARP_Y - 0.034 - barThick, SHARP_Z);
  }
  /** Cycles per beat. Slow enough to read as a wobble rather than as a strobe. */
  const DISC_RATE = rng.float(0.55, 0.85);

  // --- Damper --------------------------------------------------------------

  /**
   * The felt bar that sits against the naturals until the pedal drops it. Every
   * strike drops it, which is not strictly what a player does but is exactly
   * what the audience sees happen when the instrument starts ringing.
   *
   * **Metal only, and this is the half of the difference the eye reads as
   * motion rather than as colour.** A vibraphone is a sustaining instrument
   * with a pedal to sustain it; a marimba's bars stop by themselves, which is
   * why nobody ever put felt against one. Absent, so is the pedal below, and so
   * is the fall this instrument makes on every strike.
   */
  const damper = wood ? undefined : addTo(root, new Group());
  const damperHit = new Hit();
  const DAMPER_UP = NATURAL_Y - 0.045;
  if (damper) {
    damper.position.set(0, DAMPER_UP, NATURAL_Z - 0.09);
    addTo(damper, new Mesh(new BoxGeometry(ROW_W + 0.04, 0.016, 0.030), frameMat));
    const damperFelt = addTo(damper, new Mesh(new BoxGeometry(ROW_W + 0.04, 0.012, 0.034), feltMat));
    damperFelt.position.y = 0.013;
  }

  // --- Frame ---------------------------------------------------------------

  const railGeo = new CylinderGeometry(0.014, 0.014, 1, 8);
  function rail(a: Vector3, b: Vector3): void {
    const mesh = addTo(root, new Mesh(railGeo, frameMat));
    const dir = b.clone().sub(a);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.scale.set(1, Math.max(dir.length(), 1e-4), 1);
    mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
    mesh.castShadow = true;
  }
  const halfW = ROW_W / 2 + 0.05;
  for (const s of [1, -1]) {
    // End frames: an upright at each corner and a foot rail joining them.
    rail(new Vector3(s * halfW, 0.02, NATURAL_Z - 0.14), new Vector3(s * halfW, NATURAL_Y, NATURAL_Z - 0.14));
    rail(new Vector3(s * halfW, 0.02, SHARP_Z + 0.14), new Vector3(s * halfW, SHARP_Y, SHARP_Z + 0.14));
    rail(new Vector3(s * halfW, 0.02, NATURAL_Z - 0.14), new Vector3(s * halfW, 0.02, SHARP_Z + 0.14));
    rail(new Vector3(s * halfW, NATURAL_Y, NATURAL_Z - 0.14), new Vector3(s * halfW, SHARP_Y, SHARP_Z + 0.14));
  }
  rail(new Vector3(halfW, NATURAL_Y - 0.01, NATURAL_Z - 0.14), new Vector3(-halfW, NATURAL_Y - 0.01, NATURAL_Z - 0.14));
  rail(new Vector3(halfW, SHARP_Y - 0.01, SHARP_Z + 0.14), new Vector3(-halfW, SHARP_Y - 0.01, SHARP_Z + 0.14));
  rail(new Vector3(halfW, 0.06, 0), new Vector3(-halfW, 0.06, 0));

  // The suspension cord the bars hang on, at their nodes. Two thin lines, and
  // they are what stop the bars looking like they are floating.
  for (const [y, z] of [[NATURAL_Y - barThick, NATURAL_Z], [SHARP_Y - barThick, SHARP_Z]] as const) {
    for (const off of [-0.075, 0.075]) {
      const cord = addTo(root, new Mesh(new BoxGeometry(ROW_W + 0.06, 0.003, 0.003), cordMat));
      cord.position.set(0, y, z + off);
    }
  }

  // Pedal, at the player's feet. Nothing resolves against it — the archetype
  // declares only `key` and `rest` — but it is what the damper is attached to,
  // so it goes wherever the damper goes and a marimba has neither.
  if (damper) {
    const pedal = addTo(root, new Mesh(new BoxGeometry(0.16, 0.02, 0.16), frameMat));
    pedal.position.set(0, 0.06, NATURAL_Z - 0.30);
    pedal.castShadow = true;
    rail(new Vector3(0, 0.07, NATURAL_Z - 0.24), new Vector3(0, NATURAL_Y - 0.10, NATURAL_Z - 0.14));
  }

  const moving = new Set<Bar>();
  const UP = new Vector3(0, 1, 0);
  /**
   * Knuckles across the row, so a mallet lies along the bar rather than across
   * it. Same axis and same reason as every keyboard here; see `grand-piano.ts`.
   */
  const ACROSS = new Vector3(1, 0, 0);
  const scale = new Vector3();

  const model: InstrumentModel = {
    archetype: 'mallets',
    root,

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') {
        /**
         * Mallets held over the middle of the naturals — one answer for both
         * sticks, and **deliberately** one answer.
         *
         * This is the one place where declining to choose is the better model.
         * `resolve` is pure and time-invariant by contract, so it cannot know
         * which end of the row this number is being played at, and a stick
         * parked over a fixed third of a three-and-a-half octave instrument is
         * wrong for every part that does not happen to live there. The runtime
         * *does* know: `animate.ts` keeps a running mean of the bars each hand
         * has actually struck and idles that hand over them, and it only does
         * so for a model that gave the two hands the same point — see
         * `idleGoals` and `COINCIDENT`. Answering per stick here would switch
         * that off and replace a measurement with a guess.
         *
         * It used to be switched off in practice anyway, because a hand needs
         * three contacts of its own before its zone is trusted and `mallets`
         * ran through `keyboardPart`, which left one hand with none at all for
         * whole numbers. Both sticks now play — see `malletPart` — so both
         * zones fill and the pair idles over the register in hand.
         */
        return {
          position: new Vector3(0, NATURAL_Y + 0.10, NATURAL_Z),
          normal: UP.clone(),
          along: ACROSS.clone(),
        };
      }
      if (point.kind !== 'key') return undefined;
      const midi = point.midi;
      if (midi < LOW || midi > HIGH || !Number.isInteger(midi)) return undefined;
      const black = BLACK[midi % 12]!;
      // The centre of the bar, which is where a player aims and where the bar
      // actually speaks. The ends are nodes and sound dead.
      return {
        position: new Vector3(barX(midi), black ? SHARP_Y : NATURAL_Y, black ? SHARP_Z : NATURAL_Z),
        normal: UP.clone(),
        along: ACROSS.clone(),
      };
    },

    react(point: PlayPoint, force: number, now: number): void {
      if (point.kind !== 'key') return;
      const bar = bars.get(point.midi);
      if (!bar) return;
      bar.hit.fire(now, force);
      moving.add(bar);
      if (damper) damperHit.fire(now, force);
    },

    update(now: number): void {
      // The discs, always — and on a marimba there are none, so this is a loop
      // over an empty list rather than a branch.
      const angle = now * DISC_RATE * Math.PI * 2;
      for (const shaft of shafts) shaft.rotation.x = angle;

      if (moving.size > 0) {
        let naturalDirty = false;
        let sharpDirty = false;
        for (const bar of moving) {
          // A struck bar rings: it dips and then oscillates about its rest
          // height for a good deal longer than a drum head does — and it does
          // it at its own rate, because a bottom F and a top C are not the same
          // piece of metal. That is what makes a strike legible as a *pitch*
          // rather than merely as a strike.
          const d = bar.hit.wobble(now, bar.ring, bar.flex) * bar.dip;
          scale.set(1, 1, bar.len);
          scratch.compose(
            new Vector3(bar.home.x, bar.home.y - d, bar.home.z), noRot, scale,
          );
          bar.mesh.setMatrixAt(bar.slot, scratch);
          if (bar.mesh === naturalMesh) naturalDirty = true; else sharpDirty = true;
          if (Math.abs(d) < 1e-5 && now - bar.hit.beat > bar.ring) moving.delete(bar);
        }
        if (naturalDirty) naturalMesh.instanceMatrix.needsUpdate = true;
        if (sharpDirty) sharpMesh.instanceMatrix.needsUpdate = true;
      }

      if (damper) damper.position.y = DAMPER_UP - 0.035 * damperHit.level(now, 0.9);
    },

    station: { offset: new Vector3(0, 0, NATURAL_Z - 0.48), facing: 0, posture: 'stand' },

    dispose(): void {
      disposeTree(root);
    },
  };

  return model;
};
