/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Trumpet — and the fingering is the real one.
 *
 * A trumpet is three valves and a length of tubing, and which valves go down
 * for a given note is not a matter of taste: the open horn sounds a harmonic
 * series, the second valve lowers it a semitone, the first two, the third
 * three, and combinations sum. Given a pitch you can *derive* the fingering,
 * and `fingeringFor` below does. That derivation is the whole difference
 * between a trumpeter and a mime, and it costs about fifteen lines.
 *
 * ## What moves, and what does not
 *
 * `blown: true` means the note is made of air. The horn does not travel to
 * sound a pitch and the player's right hand does not move at all: it has one
 * contact and **the fingers move, and the air does the rest**. So `react`
 * carries the load here: the derived
 * valves go down, spring back, and the bell flares on a loud one. The horn
 * body itself never moves in `react`, because `resolve` is measured against it
 * and a model whose geometry drifts under its own contacts is a model that
 * lies to the hand it is placing.
 *
 * ## The wrap, which was wrong and is the reason this file was rebuilt
 *
 * A trumpet is not a bundle of parallel pipes. The air goes: mouthpiece →
 * leadpipe forward along the **bottom** → tuning-slide U at the front → back
 * along the middle to the valve block → out along the **top** and into the
 * bell. Three runs at three heights, joined at the ends, with the valve casings
 * hanging below the middle of the lot and the finger buttons on top of them.
 *
 * The previous layout put the bell tube *between* the leadpipe and the return,
 * 28 mm apart, and left the tuning crook at z = 0.145 — which is inside the
 * bell flare. Measured: a 72 mm loop standing across a 22 mm throat. On stage
 * that is a detached ring crossing a bundle of pipes, which is exactly what it
 * was reported as. Heights are now laid out from the three constants below and
 * the probe asserts that consecutive runs actually meet.
 *
 * ## Handedness
 *
 * `SIDE.right === -1` in `performer-look.ts`, so the player's right hand is at
 * local −x. The right hand fingers the valves from above; the left wraps the
 * casing block from the player's left. They are 10 cm apart and they are not
 * the same answer, which they were: `resolve` ignored `effector` entirely and
 * both hands were sent to one point on the buttons.
 *
 * ## Pitch convention
 *
 * `PlayPoint.midi` is **sounding** pitch, matching `NoteEvent.pitch` in the
 * Song IR — this file does the Bb transposition itself. `ARCHETYPES.trumpet.range`
 * is `[52, 86]`, which is exactly sounding E3 (written F#3, the lowest note on
 * the horn) to sounding D6, so the frozen table agrees.
 */

import {
  BoxGeometry, CylinderGeometry, DoubleSide, Group, LatheGeometry, Mesh,
  MeshStandardMaterial, TorusGeometry, Vector2, Vector3,
} from 'three';

import { ARCHETYPES } from '../../../concert/instruments.js';
import type { Effector, PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import { mouthFor } from './mouth.js';
import type {
  Contact, FingerCurl, InstrumentBuildOptions, InstrumentBuilder, InstrumentModel,
} from './types.js';
import { addTo, indexToCentre } from './types.js';

// ---------------------------------------------------------------------------
// The fingering
// ---------------------------------------------------------------------------

/**
 * Open-horn harmonics of a Bb trumpet, **sounding**, in semitones.
 *
 * The horn's nominal fundamental is Bb2 (MIDI 46); these are its partials
 * rounded to equal temperament. Partial 7 (a sounding Ab5, 31 cents flat) is
 * missing on purpose: players do not use it, and including it would hand back
 * a first-valve Bb5 where the chart says open-plus-one — the single most
 * common way a generated fingering betrays itself as fake.
 *
 * Partials 2..6, then 8, 9, 10. Nothing above D6, which is the top of the
 * archetype's declared range.
 */
const OPEN_HARMONICS: readonly number[] = [58, 65, 70, 74, 77, 82, 84, 86];

/**
 * Which valves lower the horn by n semitones.
 *
 * 2 → 1 semitone, 1 → 2, 3 → 3 (but 1+2 is the standard fingering for that
 * drop and 3 alone is the alternate), and combinations sum. This is the
 * trumpet fingering chart, and it is a table of seven entries because there
 * are only seven things three valves can do.
 */
const VALVES_FOR_DROP: readonly (readonly number[])[] = [
  [],          // 0 — open
  [2],         // 1
  [1],         // 2
  [1, 2],      // 3
  [2, 3],      // 4
  [1, 3],      // 5
  [1, 2, 3],   // 6
];

/**
 * The valves a trumpeter puts down for a sounding pitch, or `undefined` if the
 * horn cannot reach it.
 *
 * Take the lowest open harmonic at or above the note — which is also the
 * nearest one above, since they ascend — and lower to it. A drop of more than
 * six semitones means the note is below the horn entirely.
 *
 * Exported because the probe checks it against a real chart, and because the
 * choreographer might one day want to know how hard a passage is.
 */
export function fingeringFor(midi: number): readonly number[] | undefined {
  for (const harmonic of OPEN_HARMONICS) {
    if (harmonic < midi) continue;
    const drop = harmonic - midi;
    return drop <= 6 ? VALVES_FOR_DROP[drop]! : undefined;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Shared GPU resources
// ---------------------------------------------------------------------------

interface Disposable { dispose(): void }

/**
 * Geometry and material cache shared by every trumpet on the stage, refcounted
 * so the last model disposed is the one that frees the buffers. Two trumpets in
 * a section cost one set of vertices.
 */
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

const SPEC = ARCHETYPES.trumpet;

/**
 * The three runs of tubing, as heights off the horn's axis.
 *
 * Everything else is laid out from these, so a run cannot silently drift away
 * from the bow that is supposed to join it. Real spacing on a Bb trumpet is
 * about 35 mm between the leadpipe and the tuning-slide return, and about 70
 * between the leadpipe and the bell.
 */
const PIPE_Y = -0.040;
const RETURN_Y = -0.006;
const BELL_Y = 0.033;

/** Where the lips go: the mouthpiece **rim**, not the shank. */
const MOUTH_Z = -0.245;
/** Overall length, rim to bell rim, is this plus |MOUTH_Z|: a trumpet is 0.5 m. */
const BELL_START = 0.100;
const BELL_LEN = 0.155;
const BELL_R = 0.062;
/** Centre of the tuning-slide U at the front. Clear of the flare, which starts later. */
const CROOK_Z = 0.182;
/** The horn tips its bell down by six degrees, so the bell clears the eyeline. */
const TILT = 0.10;
/** Valve casing centres along the horn. Real spacing is about 47 mm. */
const VALVE_Z: readonly number[] = [-0.047, 0, 0.047];
/** The casing block hangs below the middle run and its top clears the bell. */
const CASING_LEN = 0.132;
const CASING_TOP = 0.048;
/** Top of a finger button at rest, above the horn's axis. */
const BUTTON_Y = 0.079;
/** How far a valve goes down: what a pressing fingertip travels, so the button stays under it. */
const VALVE_TRAVEL = 0.006;
/** Shank tip to rim of the mouthpiece mesh, which is laid out along −z. */
const MP_LEN = 0.035;
/**
 * How far in front of the lip point the mouthpiece rim sits.
 *
 * `mouthFor` returns the mouth as a point on the *surface* of the face — the
 * lip mesh's own front is within a millimetre of it — so a rim placed exactly
 * there has the whole 31 mm cup buried in the chin. Measured against the head
 * sphere before this existed: the mouthpiece mesh was 5 mm inside it, and the
 * rig is not a statue, so it was further in for most of every number (the head
 * alone tracks up to `headR × 1.3`, and the groove moves the torso under it).
 *
 * 25 mm is a brass rim resting *on* the lips rather than through them, and it
 * is small next to a 136 mm head — the horn still reads as being played, which
 * a horn floating a hand's width off the face would not.
 */
const LIP_STANDOFF = 0.025;

function bellProfile(len: number, r0: number, r1: number, steps: number): Vector2[] {
  const pts: Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Flare late. A cone reads as a traffic bollard; a trumpet stays narrow
    // for two thirds of its bell and then opens all at once.
    pts.push(new Vector2(r0 + (r1 - r0) * t ** 2.8, t * len));
  }
  return pts;
}

export const buildTrumpet: InstrumentBuilder = (opts: InstrumentBuildOptions): InstrumentModel => {
  live++;
  const rng = new Rng(`trumpet:${opts.seed}`);

  /**
   * This player's lips, solved once. Everything vertical hangs off it.
   *
   * Not `SPEC.workHeight` any more: casting draws heights over a 34 cm spread
   * and the archetype's single 1.5 is only right for a 1.69 m player. It is
   * still the fallback, for callers with no performer to ask.
   */
  const mouth = mouthFor(opts, SPEC.workHeight);

  // Finish varies per instance; nothing `resolve` reads varies at all.
  const brassHue = opts.finish ?? (rng.chance(0.25) ? '#d8d9dc' : '#c9a13c');
  const matBrass = shared(`brass:${brassHue}`, () => new MeshStandardMaterial({
    color: brassHue, roughness: 0.31, metalness: 0.88,
  }));
  /**
   * The same brass, drawn on both faces. For the bell and nothing else.
   *
   * A `LatheGeometry` has no caps, so the bell is a cone of one-sided
   * triangles with a hole at each end. Under the default `FrontSide` every
   * triangle you are looking at from *inside* the flare is culled, so pointing
   * a bell anywhere but straight at the camera opens a window through the horn
   * onto the stage behind it. That is the "you see through them and it looks
   * glitched" in the report, and it is one flag, not a modelling problem.
   *
   * Deliberately not applied to the rest of the horn. Every tube here is a
   * capped `CylinderGeometry` with no reachable back face, and blanket
   * double-siding would double their shadow-map and fill cost for nothing.
   */
  const matBore = shared(`bore:${brassHue}`, () => new MeshStandardMaterial({
    color: brassHue, roughness: 0.31, metalness: 0.88, side: DoubleSide,
  }));
  const matSilver = shared('silver', () => new MeshStandardMaterial({
    color: '#cfd4da', roughness: 0.22, metalness: 0.95,
  }));
  const matPearl = shared('pearl', () => new MeshStandardMaterial({
    color: '#efe7d6', roughness: 0.5, metalness: 0.05,
  }));

  /** Bottom run: mouthpiece to the tuning crook at the front. */
  const leadLen = CROOK_Z + 0.235;
  const geoLeadpipe = shared('leadpipe', () => new CylinderGeometry(0.0072, 0.0095, leadLen, 10).rotateX(Math.PI / 2));
  /** Middle run: the crook back into the third casing. */
  const returnLen = CROOK_Z - VALVE_Z[2]! + 0.008;
  const geoReturn = shared('return', () => new CylinderGeometry(0.0095, 0.0095, returnLen, 10).rotateX(Math.PI / 2));
  /** Top run: out of the valve block and forward to where the flare begins. */
  const bellTubeLen = BELL_START - VALVE_Z[0]! + 0.030;
  const geoBellTube = shared('belltube', () => new CylinderGeometry(0.0105, 0.0105, bellTubeLen, 10).rotateX(Math.PI / 2));
  /** The U that joins the bottom run to the middle one. Its radius *is* the gap. */
  const crookR = (RETURN_Y - PIPE_Y) / 2;
  const geoCrook = shared('crook', () => {
    const g = new TorusGeometry(crookR, 0.0085, 6, 12, Math.PI);
    // Stand the U up in the y-z plane, bulging toward the bell.
    g.rotateY(-Math.PI / 2);
    g.rotateX(Math.PI / 2);
    return g;
  });
  const geoBell = shared('bell', () => new LatheGeometry(bellProfile(BELL_LEN, 0.0105, BELL_R, 8), 14).rotateX(Math.PI / 2));
  /**
   * The bead round the bell's mouth, and the rotation it must **not** have.
   *
   * A `TorusGeometry` is already built round the z axis — flat in x/y, thin in
   * z — and the bell is lathed and then turned onto z as well, so the two
   * agree with no help. The `.rotateX(Math.PI / 2)` that used to be here is the
   * one the *lathe* needs, copied onto a shape that did not: it laid the ring
   * flat in the x-z plane, thin in y. Measured, the ring's bounding box was
   * 134 × 10 × 134 mm where the flare's mouth is 124 × 124 × 0 — a horizontal
   * hoop standing edge-on through the bell rather than a rim round it, which
   * is exactly the "wrongly aligned ring" in the report.
   *
   * Radius and position need nothing: `bellProfile` ends at `BELL_R` at
   * `t === 1`, so the mouth is a circle of `BELL_R` in the plane `z = BELL_LEN`
   * and the bead is centred on the edge it is rolled round.
   */
  const geoRim = shared('rim', () => new TorusGeometry(BELL_R, 0.005, 5, 16));
  const geoCasing = shared('casing', () => new CylinderGeometry(0.0195, 0.0195, CASING_LEN, 10));
  const geoStem = shared('stem', () => new CylinderGeometry(0.0055, 0.0055, 0.032, 6));
  const geoButton = shared('button', () => new CylinderGeometry(0.0125, 0.0125, 0.009, 10));
  const geoSlideU = shared('slideU', () => {
    const g = new TorusGeometry(0.015, 0.0046, 5, 8, Math.PI);
    g.rotateY(-Math.PI / 2);
    g.rotateX(-Math.PI / 2);
    return g;
  });
  const geoMouthpiece = shared('mouthpiece', () => new LatheGeometry([
    new Vector2(0.0055, 0), new Vector2(0.0060, 0.012), new Vector2(0.0090, 0.020),
    new Vector2(0.0150, 0.030), new Vector2(0.0155, 0.034), new Vector2(0.0110, MP_LEN),
  ], 10).rotateX(-Math.PI / 2));
  /** Stays: a trumpet's runs are braced to each other, so the model's are too. */
  const geoBrace = shared('brace', () => new BoxGeometry(0.008, BELL_Y - PIPE_Y, 0.012));

  // --- assembly ----------------------------------------------------------
  const root = new Group();
  root.name = 'trumpet';

  /**
   * The horn's own frame: +z runs mouthpiece to bell, +y is up off the axis.
   * Everything below is laid out in it, and the mouthpiece rim comes out at
   * the archetype's `workHeight` once the tilt is applied.
   */
  const horn = addTo(root, new Group());
  horn.rotation.x = TILT;
  // The rim, after the tilt, in the model's own frame. Both the horn's height
  // and the player's station are solved from it, so they cannot disagree.
  const rimY = PIPE_Y * Math.cos(TILT) - MOUTH_Z * Math.sin(TILT);
  const rimZ = PIPE_Y * Math.sin(TILT) + MOUTH_Z * Math.cos(TILT);
  horn.position.y = mouth.y - rimY;
  horn.updateMatrix();
  const hornMatrix = horn.matrix.clone();

  // The mesh is laid out along −z from its origin, so the origin goes a
  // mouthpiece's length in front of where the lips are.
  const mouthpiece = addTo(horn, new Mesh(geoMouthpiece, matSilver));
  mouthpiece.name = 'mouthpiece';
  mouthpiece.position.set(0, PIPE_Y, MOUTH_Z + MP_LEN);

  const leadpipe = addTo(horn, new Mesh(geoLeadpipe, matBrass));
  leadpipe.name = 'leadpipe';
  leadpipe.position.set(0, PIPE_Y, CROOK_Z - leadLen / 2);
  leadpipe.castShadow = true;

  const crook = addTo(horn, new Mesh(geoCrook, matBrass));
  crook.name = 'tuning-crook';
  crook.position.set(0, PIPE_Y + crookR, CROOK_Z);

  const back = addTo(horn, new Mesh(geoReturn, matBrass));
  back.name = 'return';
  back.position.set(0, RETURN_Y, CROOK_Z - returnLen / 2);
  back.castShadow = true;

  const bellTube = addTo(horn, new Mesh(geoBellTube, matBrass));
  bellTube.name = 'bell-tube';
  bellTube.position.set(0, BELL_Y, BELL_START - bellTubeLen / 2);

  /** The bell is its own group so a loud note can flare it without moving anything else. */
  const bellGroup = addTo(horn, new Group());
  bellGroup.position.set(0, BELL_Y, BELL_START);
  const bell = addTo(bellGroup, new Mesh(geoBell, matBore));
  bell.name = 'bell';
  bell.castShadow = true;
  bell.receiveShadow = true;
  const rim = addTo(bellGroup, new Mesh(geoRim, matBrass));
  rim.name = 'bell-rim';
  rim.position.z = BELL_LEN;

  // Stays between the bottom run and the top one, fore and aft of the valves.
  for (const z of [-0.150, 0.128]) {
    const brace = addTo(horn, new Mesh(geoBrace, matBrass));
    brace.name = 'stay';
    brace.position.set(0, (PIPE_Y + BELL_Y) / 2, z);
  }

  /** One group per valve; `react` slides it down its casing. */
  const valves: Group[] = [];
  for (let i = 0; i < 3; i++) {
    const z = VALVE_Z[i]!;
    const casing = addTo(horn, new Mesh(geoCasing, matBrass));
    casing.name = `casing-${i + 1}`;
    casing.position.set(0, CASING_TOP - CASING_LEN / 2, z);
    casing.castShadow = true;

    // The valve slides hang off the bottom of the casings, bulging back under
    // the player's hand — which is where a trumpeter's third-slide ring is.
    const slide = addTo(horn, new Mesh(geoSlideU, matBrass));
    slide.name = `valve-slide-${i + 1}`;
    slide.position.set(0, CASING_TOP - CASING_LEN, z);

    const valve = addTo(horn, new Group());
    valve.position.set(0, 0, z);
    const stem = addTo(valve, new Mesh(geoStem, matSilver));
    stem.name = `stem-${i + 1}`;
    stem.position.y = CASING_TOP + 0.016;
    const button = addTo(valve, new Mesh(geoButton, matPearl));
    button.name = `button-${i + 1}`;
    button.position.y = BUTTON_Y - 0.0045;
    valves.push(valve);
  }

  // --- contacts ----------------------------------------------------------
  /**
   * The right hand: one contact, and it never moves. The index sits on the
   * first button and the other two fall down the horn at the rig's spacing, so
   * the contact is the hand's centreline, `indexToCentre` toward the bell from
   * that button. The note is `Contact.fingers`, one valve one finger in order:
   * a finger on a pressed valve goes down with it and every other finger rests
   * on its button, since a trumpeter never lifts them. The little finger is
   * neutral too, which leaves it in the ring hook.
   *
   * `KEY_OFF` is measured, not derived: it puts a resting pad on its button and
   * a pressed one on the button it has pushed down.
   */
  const KEY_OFF = 0.004;
  /**
   * The `valve` pose splays the fingers to reach buttons 47 mm apart, and the
   * splay carries the index a further half of `indexToCentre` toward the
   * mouthpiece, so the hand's centreline sits that much nearer the bell.
   */
  const SPLAY = 1.47;
  const rightContact: Contact = {
    position: new Vector3(0.002, BUTTON_Y + KEY_OFF, VALVE_Z[0]! + SPLAY * indexToCentre(opts.height))
      .applyMatrix4(hornMatrix),
    // Up and a little out to the player's right, where the arm is; no lean
    // along the horn, so the knuckle line stays level with the three buttons.
    normal: new Vector3(-0.22, 1, 0).normalize().transformDirection(hornMatrix),
    // Toward the mouthpiece: that puts the wrist on the player's right and the
    // index on the first valve, because the rig seats a right hand's index at
    // the positive end of the knuckle line.
    along: new Vector3(0, 0, -1).transformDirection(hornMatrix),
  };
  /** A finger not on a pressed valve rests on its button, neither down nor lifted. */
  const fingersFor = (combo: readonly number[]): FingerCurl => [
    combo.includes(1) ? 1 : 0.5, combo.includes(2) ? 1 : 0.5, combo.includes(3) ? 1 : 0.5, 0.5,
  ];

  /**
   * The left hand, which does not finger anything.
   *
   * It wraps the casing block from the player's left, thumb through the first
   * valve slide, and it stays there for the whole number — so it is one
   * contact rather than seven. This is the half of the instrument the previous
   * model had no answer for at all: `resolve` ignored `effector`, both hands
   * were sent to the buttons, and the runtime's idle split pushed them 5 cm
   * apart sideways. Two hands stacked on one point is what a cluster of loose
   * fingers under the horn looks like.
   *
   * ## Why the x is inside the casing
   *
   * Because this is the hand the horn *hangs from*. `DEFAULT_HAND_POSES` gives
   * it `grip`, and a `touch: 0` pose puts the contact `0.62 R` behind the
   * palm's centre — `0.19 R`, about 13 mm, past the palm's own surface. So a
   * contact is where the palm's surface is asked to end up, and one placed
   * outside the object leaves the hand in the air beside it. At `x = 0.031`
   * against a casing of radius `0.0195` that was 25 mm of daylight, measured:
   * the trumpet stood at ease hanging off a hand that was visibly not touching
   * it, which is the "should be in hand" in the report. `0.007` puts the palm's
   * surface on the casing wall, which is what holding it means.
   */
  const leftContact: Contact = {
    position: new Vector3(0.007, -0.026, VALVE_Z[1]!).applyMatrix4(hornMatrix),
    normal: new Vector3(1, 0.22, -0.1).normalize().transformDirection(hornMatrix),
    along: new Vector3(0, 0, 1).transformDirection(hornMatrix),
  };

  function copy(c: Contact, fingers?: FingerCurl): Contact {
    return {
      position: c.position.clone(),
      normal: c.normal.clone(),
      ...(c.along ? { along: c.along.clone() } : {}),
      ...(fingers ? { fingers } : {}),
    };
  }

  /** `'right-hand'` and `'bow'` ask for the sounding hand. See `InstrumentModel`. */
  function fingers(effector?: Effector): boolean {
    return effector === undefined || effector === 'right-hand' || effector === 'bow';
  }

  // --- animation state ---------------------------------------------------
  const press = [0, 0, 0];
  const pressTarget = [0, 0, 0];
  let flare = 0;
  let lastBeat = Number.NaN;
  /** Guards a second `dispose`: `release` is refcounted across the stage. */
  let disposed = false;

  return {
    archetype: 'trumpet',
    root,
    station: {
      /**
       * Solved so the mouthpiece rim lands on *this* player's lips.
       *
       * `show.ts` puts a carried instrument's origin at `−offset` relative to
       * the player's feet, so this number is the only thing deciding whether
       * the horn is at the face or through it. The rim is at `rimZ` in the
       * model's frame and the mouth is `mouth.z` in front of the body, so the
       * origin belongs at the difference — which moves with the player's
       * height, because their face does.
       *
       * Less `LIP_STANDOFF`, because `mouth.z` is the *surface* of the face
       * and not a point a mouthpiece can occupy. See that constant.
       */
      offset: new Vector3(0, 0, rimZ - mouth.z - LIP_STANDOFF),
      facing: 0,
      posture: SPEC.posture,
    },

    resolve(point: PlayPoint, effector?: Effector): Contact | undefined {
      // The point is checked before the hand is chosen: a point this model
      // does not know is `undefined` for *both* hands, not a left hand parked
      // on a horn that is not playing anything it understands.
      if (point.kind === 'rest') {
        return copy(fingers(effector) ? rightContact : leftContact);
      }
      if (point.kind !== 'valve') return undefined;
      const combo = fingeringFor(point.midi);
      if (combo === undefined) return undefined;
      return fingers(effector) ? copy(rightContact, fingersFor(combo)) : copy(leftContact);
    },

    react(point: PlayPoint, force: number, _now: number): void {
      if (point.kind === 'rest') {
        pressTarget[0] = pressTarget[1] = pressTarget[2] = 0;
        return;
      }
      if (point.kind !== 'valve') return;
      const combo = fingeringFor(point.midi);
      if (!combo) return;
      for (let i = 0; i < 3; i++) {
        const down = combo.includes(i + 1);
        pressTarget[i] = down ? 1 : 0;
        // A valve is thrown, not eased: it is at the bottom of its casing
        // before the note has finished starting. The spring in `update` only
        // has to bring it back up.
        if (down) press[i] = 1;
      }
      // The bell opens on a loud note. It is a lie physically and the right
      // lie visually — it is where the eye goes when a horn player leans in.
      flare = Math.max(flare, 0.25 + 0.75 * Math.min(Math.max(force, 0), 1));
    },

    update(now: number): void {
      // A non-finite beat has to stop here. `dt` would be NaN, every eased
      // value in this method is `x += (target − x) * k`, and one NaN k turns
      // the whole instrument into NaN transforms permanently — three.js keeps
      // drawing it, at no position, for the rest of the show.
      if (!Number.isFinite(now)) return;
      const dt = Number.isFinite(lastBeat) ? Math.min(Math.max(now - lastBeat, 0), 0.5) : 0;
      lastBeat = now;
      if (dt === 0) return;

      // Valves spring back over about a sixteenth; the bell settles slower.
      const kValve = 1 - Math.exp(-dt / 0.05);
      const kFlare = 1 - Math.exp(-dt / 0.18);
      for (let i = 0; i < 3; i++) {
        press[i] = press[i]! + (pressTarget[i]! - press[i]!) * kValve;
        valves[i]!.position.y = -VALVE_TRAVEL * press[i]!;
      }
      flare += (0 - flare) * kFlare;
      const s = 1 + 0.055 * flare;
      bellGroup.scale.set(s, s, 1 + 0.02 * flare);
    },

    dispose(): void {
      // A second call would free the shared buffers out from under every
      // other one of these on the stage. That renders as nothing at all and
      // reports nothing, so it is guarded rather than left to be noticed.
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      root.clear();
      release();
    },
  };
};
