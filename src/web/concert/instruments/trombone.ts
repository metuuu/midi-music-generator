/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Trombone — a slide, not valves.
 *
 * It resolves the same `{ kind: 'valve', midi }` point the trumpet does, which
 * is the frozen contract's way of saying "a brass player is fingering a pitch",
 * and then it does something completely different with it: seven positions,
 * each one semitone lower than the last, and the slide actually travels there.
 *
 * This is the most legible instrument on a stage. A slide moving to the right
 * place is instantly readable at forty feet; a slide moving to the wrong place
 * is instantly *wrong*, in a way that a fake trumpet fingering is not. So the
 * positions are derived from real acoustics rather than laid out evenly:
 *
 *   offset(p) = L · (2^((p−1)/12) − 1) / 2
 *
 * — the tube has to get 6% longer per semitone and the slide is a double
 * tube, so it moves half that. The result is the spacing every trombonist
 * knows: 1st to 2nd is 8 cm and 6th to 7th is 11, positions crowding at the
 * near end and stretching at the far one. Even spacing would be a spreadsheet's
 * idea of a trombone.
 *
 * ## The low register, and the one note that is not there
 *
 * `ARCHETYPES.trombone.range` starts at 34 (Bb1). Between the pedal Bb1 and E2
 * a plain tenor has nothing — the famous gap — so this model has an **F
 * attachment**, which is what a modern tenor-bass carries and exactly what the
 * gap exists to be filled by. The thumb trigger drops the horn a fourth and
 * the same seven positions cover 35..40.
 *
 * B1 (35) still needs an F-side seventh position, which does not fit on a real
 * slide; that is precisely the note a bass trombone's second valve exists for.
 * The model puts the slide at full extension with the trigger down, which is
 * the closest a real horn gets, and this comment is the honest record of it.
 */

import {
  BoxGeometry, CylinderGeometry, Group, LatheGeometry, Mesh,
  MeshStandardMaterial, TorusGeometry, Vector2, Vector3,
} from 'three';

import { ARCHETYPES } from '../../../concert/instruments.js';
import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import type {
  Contact, InstrumentBuildOptions, InstrumentBuilder, InstrumentModel,
} from './types.js';
import { addTo } from './types.js';

// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------

/**
 * Open-horn harmonics of a Bb tenor, sounding, rounded to equal temperament.
 *
 * Fundamental Bb1 = 34, so partial 1 is the pedal and everything else follows.
 * Partial 7 is left out for the same reason it is on the trumpet — 31 cents
 * flat, and the chart says Ab4 is third position on partial 8, which is what
 * players do. Partials 13 and 14 *are* in, because the top of the register is
 * where a trombonist takes whatever partial is nearest and lips it; leaving
 * them out would put Gb5 in fourth position, which no chart says.
 */
const OPEN_PARTIALS: readonly number[] = [34, 46, 53, 58, 62, 65, 70, 72, 74, 77, 78, 80];

/** The same horn with the thumb down: fundamental F1 = 29, a fourth lower. */
const TRIGGER_PARTIALS: readonly number[] = [29, 41, 48, 53, 57, 60, 65, 67, 69, 72];

/** Effective tube length of a Bb tenor, in metres. */
const L_BB = 2.75;
/** With the F attachment engaged. A perfect fourth is 5 semitones of tubing. */
const L_F = L_BB * 2 ** (5 / 12);

/** How far the slide is out in position `p` (1..7) on a horn of length `l`. */
function slideOffset(p: number, l: number): number {
  return (l * (2 ** ((p - 1) / 12) - 1)) / 2;
}

/**
 * Mechanical limit of the slide, in metres.
 *
 * A tenor's seventh position is 57 cm out; the F side needs more per position
 * because its tube is longer, and only about five and a half of its positions
 * fit. This is why `ARCHETYPES.trombone.footprint` is 0.9 and a trumpet's 0.6.
 */
const SLIDE_MAX = 0.62;

export interface SlidePosition {
  /** 1..7. */
  position: number;
  /** Whether the thumb trigger is down. */
  trigger: boolean;
  /** Metres the slide is out from first position. */
  offset: number;
}

/**
 * The slide position for a sounding pitch, or `undefined` off the horn.
 *
 * Open horn first — a trombonist reaches for the trigger only when the open
 * horn cannot get there. Within each horn, the lowest partial at or above the
 * note, which since partials ascend is also the nearest one above.
 *
 * Exported so the probe can print the chart and check it against a real one.
 */
export function positionFor(midi: number): SlidePosition | undefined {
  for (const partial of OPEN_PARTIALS) {
    if (partial < midi) continue;
    const drop = partial - midi;
    if (drop > 6) break;
    return { position: drop + 1, trigger: false, offset: slideOffset(drop + 1, L_BB) };
  }
  for (const partial of TRIGGER_PARTIALS) {
    if (partial < midi) continue;
    const drop = partial - midi;
    if (drop > 6) break;
    return {
      position: drop + 1,
      trigger: true,
      offset: Math.min(slideOffset(drop + 1, L_F), SLIDE_MAX),
    };
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Shared GPU resources
// ---------------------------------------------------------------------------

interface Disposable { dispose(): void }

/** Refcounted cache: a two-trombone section costs one set of vertices. */
const CACHE = new Map<string, Disposable>();
let live = 0;

function shared<T extends Disposable>(key: string, make: () => T): T {
  const hit = CACHE.get(key) as T | undefined;
  if (hit) return hit;
  const made = make();
  CACHE.set(key, made);
  return made;
}

function release(): void {
  if (--live > 0) return;
  for (const res of CACHE.values()) res.dispose();
  CACHE.clear();
}

// ---------------------------------------------------------------------------
// Proportions
// ---------------------------------------------------------------------------

const SPEC = ARCHETYPES.trombone;

/**
 * The outer slide's own length.
 *
 * It has to exceed the travel or the slide comes off the inner tubes at
 * seventh position, which is why a real one is about 72 cm and why a trombone
 * is such a large object for the note it plays. Everything else along the horn
 * is laid out from this number.
 */
const OUTER_LEN = 0.72;
/** Mouthpiece at the lips. Negative because the origin is *not* at the player. */
const MOUTH_Z = -0.62;
/** Front of the slide in first position: the far end of the outer slide. */
const CROOK_Z = MOUTH_Z + 0.05 + OUTER_LEN;
/** The grip brace, a hand's width behind the crook. */
const BRACE_Z = CROOK_Z - 0.13;
/** Far end of the fixed inner tubes: inside the crook, past seventh position. */
const INNER_FAR = 0.13;
const INNER_NEAR = MOUTH_Z + 0.02;
/** The horn points slightly down, the way one hangs off a standing player. */
const TILT = 0.09;
/** Half the gap between the two slide tubes. */
const SLIDE_X = 0.036;
/** Height of the slide tubes off the horn's axis. */
const SLIDE_Y = -0.022;

function bellProfile(len: number, r0: number, r1: number, steps: number): Vector2[] {
  const pts: Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push(new Vector2(r0 + (r1 - r0) * t ** 2.6, t * len));
  }
  return pts;
}

export const buildTrombone: InstrumentBuilder = (opts: InstrumentBuildOptions): InstrumentModel => {
  live++;
  const rng = new Rng(`trombone:${opts.seed}`);

  const brassHue = opts.finish ?? (rng.chance(0.2) ? '#d6d8dc' : '#c19a36');
  const matBrass = shared(`brass:${brassHue}`, () => new MeshStandardMaterial({
    color: brassHue, roughness: 0.33, metalness: 0.88,
  }));
  const matSlide = shared('slide', () => new MeshStandardMaterial({
    // The slide is chrome, and it is the part of a trombone that catches a
    // spotlight. Polished harder than the rest on purpose.
    color: '#d8dde3', roughness: 0.12, metalness: 0.97,
  }));
  const matDark = shared('dark', () => new MeshStandardMaterial({
    color: '#26221c', roughness: 0.7, metalness: 0.1,
  }));

  const geoMouthpiece = shared('mouthpiece', () => new LatheGeometry([
    new Vector2(0.0072, 0), new Vector2(0.0080, 0.014), new Vector2(0.0115, 0.024),
    new Vector2(0.0185, 0.036), new Vector2(0.0190, 0.041), new Vector2(0.0135, 0.042),
  ], 10).rotateX(-Math.PI / 2));
  const geoReceiver = shared('receiver', () => new CylinderGeometry(0.0125, 0.0115, 0.05, 10).rotateX(Math.PI / 2));
  const geoBackBow = shared('backbow', () => {
    const g = new TorusGeometry(0.062, 0.011, 6, 12, Math.PI);
    g.rotateY(-Math.PI / 2);
    g.rotateX(-Math.PI / 2);
    return g;
  });
  const geoBellTube = shared('belltube', () => new CylinderGeometry(0.0125, 0.017, 0.24, 10).rotateX(Math.PI / 2));
  const geoBell = shared('bell', () => new LatheGeometry(bellProfile(0.22, 0.017, 0.103, 8), 16).rotateX(Math.PI / 2));
  const geoBellRim = shared('bellrim', () => new TorusGeometry(0.103, 0.006, 5, 20).rotateX(Math.PI / 2));
  const geoInner = shared('inner', () => new CylinderGeometry(0.0072, 0.0072, INNER_FAR - INNER_NEAR, 8).rotateX(Math.PI / 2));
  const geoOuter = shared('outer', () => new CylinderGeometry(0.0098, 0.0098, OUTER_LEN, 10).rotateX(Math.PI / 2));
  const geoCrook = shared('crook', () => new TorusGeometry(SLIDE_X, 0.0095, 6, 12, Math.PI).rotateX(Math.PI / 2));
  const geoBrace = shared('brace', () => new BoxGeometry(0.072, 0.012, 0.016));
  const geoGrip = shared('grip', () => new CylinderGeometry(0.014, 0.014, 0.05, 8).rotateZ(Math.PI / 2));
  const geoRotor = shared('rotor', () => new CylinderGeometry(0.030, 0.030, 0.044, 12));
  const geoLever = shared('lever', () => new BoxGeometry(0.010, 0.008, 0.085));
  const geoStay = shared('stay', () => new BoxGeometry(0.012, 0.10, 0.014));

  // --- assembly ----------------------------------------------------------
  const root = new Group();
  root.name = 'trombone';

  /** Horn frame: +z runs mouthpiece to bell and out along the slide. */
  const horn = addTo(root, new Group());
  horn.rotation.x = TILT;
  // Solve the height so the mouthpiece lands on the archetype's workHeight.
  horn.position.y = SPEC.workHeight
    - (SLIDE_Y * Math.cos(TILT) - MOUTH_Z * Math.sin(TILT));
  horn.updateMatrix();
  const hornMatrix = horn.matrix.clone();

  const mouthpiece = addTo(horn, new Mesh(geoMouthpiece, matSlide));
  mouthpiece.position.set(0, SLIDE_Y, MOUTH_Z);
  const receiver = addTo(horn, new Mesh(geoReceiver, matBrass));
  receiver.position.set(0, SLIDE_Y, MOUTH_Z + 0.06);

  // The bell section wraps back behind the player's shoulder and comes
  // forward again above the slide. That doubling back is the silhouette.
  const backBow = addTo(horn, new Mesh(geoBackBow, matBrass));
  backBow.position.set(0, SLIDE_Y + 0.062, MOUTH_Z - 0.04);
  const bellTube = addTo(horn, new Mesh(geoBellTube, matBrass));
  bellTube.position.set(0, SLIDE_Y + 0.124, MOUTH_Z + 0.08);
  bellTube.castShadow = true;

  const bellGroup = addTo(horn, new Group());
  bellGroup.position.set(0, SLIDE_Y + 0.124, MOUTH_Z + 0.20);
  const bell = addTo(bellGroup, new Mesh(geoBell, matBrass));
  bell.castShadow = true;
  bell.receiveShadow = true;
  const bellRim = addTo(bellGroup, new Mesh(geoBellRim, matBrass));
  bellRim.position.z = 0.218;

  // The F attachment: a rotor on the bell section and a thumb lever.
  const rotor = addTo(horn, new Mesh(geoRotor, matBrass));
  rotor.position.set(0.028, SLIDE_Y + 0.09, MOUTH_Z - 0.01);
  rotor.rotation.z = Math.PI / 2;
  const trigger = addTo(horn, new Group());
  trigger.position.set(0.012, SLIDE_Y + 0.062, MOUTH_Z + 0.01);
  const lever = addTo(trigger, new Mesh(geoLever, matDark));
  lever.position.z = 0.04;

  // Stays holding the bell section to the slide section.
  const stay = addTo(horn, new Mesh(geoStay, matBrass));
  stay.position.set(0, SLIDE_Y + 0.062, MOUTH_Z + 0.14);

  for (const x of [-SLIDE_X, SLIDE_X]) {
    const inner = addTo(horn, new Mesh(geoInner, matSlide));
    inner.position.set(x, SLIDE_Y, (INNER_NEAR + INNER_FAR) / 2);
  }

  /** The part that actually travels. Everything else on the horn is still. */
  const slide = addTo(horn, new Group());
  for (const x of [-SLIDE_X, SLIDE_X]) {
    const outer = addTo(slide, new Mesh(geoOuter, matSlide));
    outer.position.set(x, SLIDE_Y, CROOK_Z - OUTER_LEN / 2);
    outer.castShadow = true;
  }
  const crook = addTo(slide, new Mesh(geoCrook, matSlide));
  crook.position.set(0, SLIDE_Y, CROOK_Z);
  const brace = addTo(slide, new Mesh(geoBrace, matSlide));
  brace.position.set(0, SLIDE_Y, BRACE_Z);
  const grip = addTo(slide, new Mesh(geoGrip, matDark));
  grip.position.set(0, SLIDE_Y, BRACE_Z);

  // --- contacts ----------------------------------------------------------
  /**
   * Where the right hand goes: the slide brace, at the offset for that
   * position. The hand *is* the slide on this instrument, so unlike every
   * other wind in this family the contact travels half a metre.
   *
   * `resolve` is pure: it reads the derived offset for the requested pitch,
   * not wherever the slide happens to be. `react` then moves the slide to meet
   * the hand — see the note on that method.
   */
  function braceContact(offset: number): Contact {
    return {
      position: new Vector3(0, SLIDE_Y + 0.012, BRACE_Z + offset).applyMatrix4(hornMatrix),
      // Up and back: the grip is taken from above and behind, thumb over.
      normal: new Vector3(0, 0.82, -0.57).normalize().transformDirection(hornMatrix),
    };
  }
  const openContacts = [1, 2, 3, 4, 5, 6, 7].map((p) => braceContact(slideOffset(p, L_BB)));
  const triggerContacts = [1, 2, 3, 4, 5, 6, 7]
    .map((p) => braceContact(Math.min(slideOffset(p, L_F), SLIDE_MAX)));
  /** First position, thumb up: where the hand waits. */
  const restContact = openContacts[0]!;

  function copy(c: Contact): Contact {
    return { position: c.position.clone(), normal: c.normal.clone() };
  }

  const [LO, HI] = SPEC.range;

  // --- animation state ---------------------------------------------------
  let slideAt = 0;
  let slideTo = 0;
  let triggerAt = 0;
  let triggerTo = 0;
  let flare = 0;
  let lastBeat = Number.NaN;

  return {
    archetype: 'trombone',
    root,
    station: {
      /**
       * The player is three quarters of a metre upstage of the origin, which
       * is a lot and is correct. The convention puts the origin at the
       * instrument's centre, and a trombone's centre is out over the slide:
       * seventh position is 1.3 m in front of the player's face. Centring the
       * swept volume is the only way the whole instrument fits inside the
       * declared 0.9 m footprint at all.
       */
      offset: new Vector3(0, 0, MOUTH_Z - 0.12),
      facing: 0,
      posture: SPEC.posture,
    },

    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'rest') return copy(restContact);
      if (point.kind !== 'valve') return undefined;
      if (point.midi < LO || point.midi > HI) return undefined;
      const p = positionFor(point.midi);
      if (!p) return undefined;
      const table = p.trigger ? triggerContacts : openContacts;
      return copy(table[p.position - 1]!);
    },

    /**
     * Move the slide to where the note is.
     *
     * Worth being explicit about a limitation of the frozen interface here: a
     * model is told about a note when it happens, but the *hand* is placed by
     * the runtime reading ahead into `Gesture.prep`. So on a note the hand is
     * already at the brace's target position and the slide has to catch up.
     * The chase below is fast — most of the way inside a thirty-second — which
     * reads as a slide arriving rather than as a slide lagging, and if the
     * runtime ever calls `react` at the start of the prep window instead, the
     * slide is simply in place on the beat and this comment becomes moot.
     */
    react(point: PlayPoint, force: number, _now: number): void {
      if (point.kind === 'rest') {
        triggerTo = 0;
        return;
      }
      if (point.kind !== 'valve') return;
      const p = positionFor(point.midi);
      if (!p) return;
      slideTo = p.offset;
      triggerTo = p.trigger ? 1 : 0;
      flare = Math.max(flare, 0.2 + 0.8 * Math.min(Math.max(force, 0), 1));
    },

    update(now: number): void {
      const dt = Number.isFinite(lastBeat) ? Math.min(Math.max(now - lastBeat, 0), 0.5) : 0;
      lastBeat = now;
      if (dt === 0) return;

      // Ease, then cap the speed: a slide is heavy and a teleporting one looks
      // like a texture swap. 3.5 m per beat is about as fast as a real
      // glissando, and it is only ever reached across six positions.
      const want = slideAt + (slideTo - slideAt) * (1 - Math.exp(-dt / 0.055));
      const cap = 3.5 * dt;
      slideAt += Math.max(-cap, Math.min(cap, want - slideAt));
      slide.position.z = slideAt;

      triggerAt += (triggerTo - triggerAt) * (1 - Math.exp(-dt / 0.04));
      trigger.rotation.x = -0.34 * triggerAt;
      rotor.rotation.y = 0.5 * triggerAt;

      flare += (0 - flare) * (1 - Math.exp(-dt / 0.2));
      const s = 1 + 0.045 * flare;
      bellGroup.scale.set(s, s, 1 + 0.015 * flare);
    },

    dispose(): void {
      root.removeFromParent();
      root.clear();
      release();
    },
  };
};
