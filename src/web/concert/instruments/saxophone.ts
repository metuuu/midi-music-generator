/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Saxophone — one model, four horns.
 *
 * `opts.scale` snaps to a family member (soprano, alto, tenor, baritone) and
 * everything else follows from it: how long the body is, how low it hangs, how
 * wide the bell opens, and — the part that matters musically — how the horn
 * transposes. A tenor sounds a major ninth below what it reads; a baritone an
 * octave and a major sixth. The *fingering* is identical across all four,
 * which is the whole reason one saxophonist can pick up any of them, and it is
 * why one model at four sizes is the right shape for this file rather than a
 * compromise.
 *
 * ## Silhouette
 *
 * The curved bell and the neck crook. Nothing else about a saxophone reads at
 * stage distance — not the keywork, not the engraving — and a straight tube
 * with a flare on the end is a clarinet with ambitions. The soprano keeps the
 * curve here even though a real one is usually straight: curved sopranos exist,
 * and the alternative is a wind section where two players hold the same object.
 *
 * ## Fingering
 *
 * A saxophone shortens its air column from the bottom up: everything is closed
 * for the lowest note, and each semitone above opens one more hole from the
 * bell end. Twelve stations cover an octave, and the octave key repeats them.
 * That is the *simple-system* truth rather than the Boehm-derived truth — a
 * real sax has cross-fingerings and side keys — and it is the right lie at
 * this distance, because "the hand walks down the tube as the line falls" is
 * what an audience reads as playing, and a Boehm fingering chart would read as
 * flicker.
 *
 * ## Two stacks, two hands
 *
 * The twelve stations are not one row a single hand runs along: the top six
 * belong to the **left** hand and the bottom six to the **right**, and neither
 * hand ever crosses into the other's. That is why a saxophonist's hands look
 * like they are doing different jobs. `resolve` answers per `effector`
 * accordingly, and clamps the hand that is not on the speaking hole to the end
 * of its own stack, which is where those fingers actually sit — hovering over
 * their own keys, not following the other hand down the horn.
 *
 * Before this, `resolve` ignored `effector` and returned one contact, so both
 * hands were sent to the same key and the runtime nudged them 5 cm apart. Two
 * hands in one place, palms in the same direction, is what "a cluster of loose
 * fingers hanging off the instrument" looks like from the stalls.
 *
 * ## And the fingers themselves
 *
 * The twelve pads reconfigure on every note and the hands used to sit above them
 * in one frozen shape all night, which is the other half of the same complaint:
 * a saxophone that is visibly being fingered by nobody. `Contact.fingers`
 * carries the pattern out to the player — the same `station` `react` closes the
 * pads from, so the pads and the fingers cannot disagree — and `fingersOnStack`
 * shares it out over one hand's four. See both for the reasoning; what is here
 * is a table per hand and one extra argument to `copy`.
 *
 * ## Which side it hangs on
 *
 * `SIDE.right === −1` in `performer-look.ts`, so the player's right is local
 * −x. A sax hangs off the strap on the player's *right*, with the neck
 * crossing back to the centre so the mouthpiece is at the middle of the mouth.
 * The horn was previously built on +x, which put the whole instrument on the
 * wrong side of the body and the mouthpiece 6 cm past the corner of the lips.
 *
 * ## Which face the keys are on
 *
 * The rod, the twelve key cups and both hands live on the tube's **+z** face,
 * which is the one pointed at the house; the thumb rest, the strap ring and
 * the octave lever live on −z, against the player. That is the way round a
 * saxophone is. The thumbs are the only things behind the horn — the right
 * under its hook, the left on the octave touch — and the fingers curl round to
 * the far side of the tube, which is why a saxophonist's knuckles are the part
 * aimed at the audience.
 *
 * Every one of them was on −z, tucked between the tube and the chest. From the
 * stalls that is a bare gold pipe with no keywork on it at all and two hands
 * hidden behind it, which is what this file was reported as looking like.
 */

import {
  BoxGeometry, CatmullRomCurve3, CylinderGeometry, DoubleSide, Group,
  LatheGeometry, Mesh, MeshStandardMaterial, TorusGeometry, TubeGeometry,
  Vector2, Vector3,
} from 'three';

import { ARCHETYPES } from '../../../concert/instruments.js';
import type { Effector, PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import { BLOWN_MOUTH_Y, mouthFor } from './mouth.js';
import type {
  Contact, FingerCurl, InstrumentBuildOptions, InstrumentBuilder, InstrumentModel,
} from './types.js';
import { addTo, fingersOnStack } from './types.js';

// ---------------------------------------------------------------------------
// The family
// ---------------------------------------------------------------------------

interface Member {
  name: string;
  /** Where this member sits on `InstrumentBuildOptions.scale`, 0..1. */
  at: number;
  /** Semitones to add to a sounding pitch to get the written one. */
  transpose: number;
}

/** `scale` 0.6 is a tenor, as the interface's own comment promises. */
const FAMILY: readonly Member[] = [
  { name: 'soprano', at: 0.0, transpose: 2 },
  { name: 'alto', at: 0.35, transpose: 9 },
  { name: 'tenor', at: 0.6, transpose: 14 },
  { name: 'baritone', at: 1.0, transpose: 21 },
];

function memberFor(scale: number | undefined): Member {
  const s = Math.min(Math.max(scale ?? 0.6, 0), 1);
  let best = FAMILY[0]!;
  for (const m of FAMILY) if (Math.abs(m.at - s) < Math.abs(best.at - s)) best = m;
  return best;
}

/** Written Bb3 — the bottom of every saxophone, all holes closed. */
const WRITTEN_FLOOR = 58;
/** Stations round the tube before the octave key takes over. */
const STATIONS = 12;

function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

export interface Fingering {
  /** 0 (everything closed, lowest note) .. 11 (only the top hole closed). */
  station: number;
  /** 0 for the bottom register, 1 with the octave key, 2+ altissimo. */
  register: number;
}

/**
 * The fingering for a sounding pitch on a given member of the family.
 *
 * Note what does *not* happen here: nothing is clamped. A pitch below the
 * horn's own bottom still lands on a station, because the pattern repeats and
 * a hand has to go somewhere sensible. Whether the part should have been
 * written there at all is a casting question, and `npm run concert` already
 * asserts a rate on it — the geometry is the wrong place to raise it.
 */
export function fingeringFor(midi: number, member: Member): Fingering {
  const written = midi + member.transpose;
  return {
    station: mod(written - WRITTEN_FLOOR, STATIONS),
    register: Math.floor((written - WRITTEN_FLOOR) / STATIONS),
  };
}

/**
 * How far the model will answer.
 *
 * The union of `RANGE_OF`'s four saxophone entries, which is wider than
 * `ARCHETYPES.saxophone.range` at *both* ends — a low-A baritone reaches 37 and
 * an alto's altissimo reaches 89. Honouring only the archetype range would
 * leave real notes unresolved.
 */
const LO = 37;
const HI = 89;

// ---------------------------------------------------------------------------
// Shared GPU resources
// ---------------------------------------------------------------------------

interface Disposable { dispose(): void }

/** Refcounted, and keyed by size, so two tenors cost one set of vertices. */
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
// Build
// ---------------------------------------------------------------------------

const SPEC = ARCHETYPES.saxophone;
/**
 * Where the lips close on the mouthpiece, in the model's own frame.
 *
 * Only the z is a constant. The *height* is this player's mouth, from
 * `mouthFor`, because a saxophone hangs from a strap and the strap's only job
 * is to put the mouthpiece at the face — so the whole horn moves with the
 * player and nothing about its own proportions changes.
 *
 * `SPEC.workHeight` (1.2) is not that height and never was: it is where a sax's
 * *keywork* sits, which is most of a body-tube below the lips. It is still the
 * right fallback for a caller with no performer, because `mouthFor` only uses
 * it when nobody knows better — and see the note on `bowY` for what having a
 * real height finally makes expressible.
 */
const LIP_Z = -0.02;
/** Mouthpiece length, tip to cork. The beak points *back*, into the player. */
const MP_LEN = 0.068;
/** How far past the lips the tip pokes; the rest of the beak is in the mouth. */
const MP_BITE = 0.020;
/**
 * Body tube lean: bell end forward, top end back toward the player.
 *
 * This was −0.30, and it is the reason the horn was reported as overlapping
 * the body. A 0.54 m tube raked 17° carries its top 159 mm upstage of its
 * base, and the base was only 15 mm in front of the lip point to start with —
 * so the top of the tube finished on the player's own centreline. Measured
 * against the torso shell: the tube's axis was inside it from a third of the
 * way up, by as much as 142 mm; every key cup from `pad-8` upward was 130 to
 * 226 mm inside; and both hands, which sit *behind* the tube because the keys
 * face the player, were 58 and 156 mm inside the chest.
 *
 * −0.10 is close to what a saxophone actually does — the tube is near vertical
 * and the bell's own 0.55 rad is what makes the silhouette — and it leaves the
 * top of the tube 54 mm behind its base instead of 159. See `BODY_Z` for the
 * other half; neither is enough alone.
 *
 * (Both of those measurements were taken back when the hands sat behind the
 * tube. They now sit in front of it — see the note on which face the keys are
 * on — so the clearance is better than the numbers here say, not worse.)
 */
const BODY_TILT_X = -0.10;
/**
 * How far in front of the lip point the bottom of the body tube sits.
 *
 * Not `station.offset`, which is the obvious knob and the wrong one: it moves
 * the *whole* model, mouthpiece included, and the mouthpiece is the one part
 * that is already in the right place. The body group is the correct pivot
 * because `bodyMatrix` is taken from it — the key cups, the rod, the thumb
 * rest, the octave key, the bow, the bell and every `resolve` contact are all
 * expressed in that frame, so they move together and `resolve` stays honest.
 * The mouthpiece, the ligature and the neck's far end are pinned to `mouth`
 * and do not move at all; the neck curve simply reaches further, which is what
 * a real crook does.
 *
 * It was 0.015. 0.140 puts the tube's axis 210 to 285 mm in front of the body
 * axis over the keyed length, which is about the daylight a pair of hands needs
 * between the keywork and the shirt. Measured across the four members with the
 * hands still behind the tube, the worst contact cleared the chest by 83–96 mm
 * on the right and 15–54 mm on the left; the left was tightest at the top of
 * the upper stack on a baritone, which is a saxophonist's knuckles brushing
 * their own chest and is where the number stopped being worth chasing.
 *
 * The hands have since moved to the far side of the tube, which buys another
 * 50 to 90 mm and makes the tightest case comfortable. The value stays where it
 * is because the *tube* still has to stand off the chest on its own account,
 * and because more only floats the horn off the player.
 */
const BODY_Z = 0.140;
/** Negative leans the top of the tube toward +x, i.e. from the right hip in
 * toward the centreline, which is the only way the neck reaches the mouth. */
const BODY_TILT_Z = -0.09;
/** Stations 0..5 are the right hand's, 6..11 the left's. */
const STACK_SPLIT = 6;

function flareProfile(len: number, r0: number, r1: number, steps: number): Vector2[] {
  const pts: Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push(new Vector2(r0 + (r1 - r0) * t ** 2.4, t * len));
  }
  return pts;
}

export const buildSaxophone: InstrumentBuilder = (opts: InstrumentBuildOptions): InstrumentModel => {
  live++;
  /**
   * This player's lips. The strap length is whatever puts the horn there.
   *
   * `BLOWN_MOUTH_Y`, not `SPEC.workHeight`, for the reason the note on `LIP_Z`
   * gives: this archetype's declared 1.2 is its keywork.
   */
  const mouth = mouthFor(opts, BLOWN_MOUTH_Y);
  const member = memberFor(opts.scale);
  const s = member.at;
  const rng = new Rng(`saxophone:${opts.seed}`);

  // Proportions, all driven by the member so a "tenor" is always tenor-sized.
  const bodyLen = 0.36 + 0.30 * s;
  const rTop = 0.0125 + 0.009 * s;
  const rBot = 0.024 + 0.018 * s;
  const bowR = 0.045 + 0.030 * s;
  const bellR = 0.032 + 0.048 * s;
  const bellLen = 0.15 + 0.15 * s;
  /**
   * How low the horn hangs: a whole horn below the lips.
   *
   * A tenor measures about 0.75 m from the bottom of the bow to the top of the
   * mouthpiece in playing position, and the strap length is the only free
   * variable that sets it — the mouthpiece is pinned at the lips and the bow
   * is one body-tube below.
   *
   * Measuring **down from the mouth** rather than up from the boards is what
   * makes `ARCHETYPES.saxophone.workHeight` stop being a lie. One constant
   * cannot describe four horns on players of four heights: a baritone's keys
   * sit 15 cm below an alto's, and both sit higher on a tall player. Expressed
   * this way the keywork height falls out of `height` and `scale` together and
   * the archetype's 1.2 is simply what this produces for an alto on an average
   * player, which is all a single number was ever able to mean.
   */
  const bowY = mouth.y - (0.53 + 0.28 * s);
  const key = member.name;
  /** Which side of the player the horn hangs on: their right, which is −x. */
  const SIDE = -1;

  const lacquer = opts.finish ?? (rng.chance(0.22) ? '#b08d55' : '#c69a33');
  const matBody = shared(`body:${lacquer}`, () => new MeshStandardMaterial({
    color: lacquer, roughness: 0.34, metalness: 0.85,
  }));
  const matKeys = shared('keys', () => new MeshStandardMaterial({
    color: '#d9dde2', roughness: 0.2, metalness: 0.94,
  }));
  const matDark = shared('dark', () => new MeshStandardMaterial({
    color: '#1b1a18', roughness: 0.62, metalness: 0.06,
  }));
  /**
   * The same lacquer, drawn on both faces. For the bell and nothing else.
   *
   * A `LatheGeometry` is open at both ends, so the flare is a one-sided cone;
   * under the default `FrontSide` its inside is culled and you look through
   * the bell at the stage behind it. A saxophone's bell is turned up and out
   * toward the house, which is precisely the angle that shows the inside of it
   * to the audience, so this is the one on the stage you cannot miss.
   *
   * The body tube, the bow and the keywork are capped solids and stay
   * single-sided; there is nothing to see inside them and a second face on
   * every pad is a real cost in the shadow map.
   */
  const matBore = shared(`bore:${lacquer}`, () => new MeshStandardMaterial({
    color: lacquer, roughness: 0.34, metalness: 0.85, side: DoubleSide,
  }));

  const geoBody = shared(`tube:${key}`, () => new CylinderGeometry(rTop, rBot, bodyLen, 12)
    .translate(0, bodyLen / 2, 0));
  const geoBow = shared(`bow:${key}`, () => {
    const g = new TorusGeometry(bowR, rBot, 6, 12, Math.PI);
    g.rotateY(-Math.PI / 2);
    g.rotateX(Math.PI);
    return g;
  });
  const geoBell = shared(`bell:${key}`, () => new LatheGeometry(flareProfile(bellLen, rBot, bellR, 8), 16));
  /**
   * The bead round the bell's mouth, turned onto the bell's axis **here**.
   *
   * A `TorusGeometry` is built round z. This bell is lathed about `+y` and
   * left there — unlike the trumpet's and the trombone's, which are turned
   * onto z — so the ring genuinely does need a quarter turn about x to lie
   * flat in x-z, and this is it.
   *
   * There was a second, opposite `-Math.PI / 2` on the *mesh*, which cancelled
   * this one and stood the ring up through the mouth of the flare instead of
   * round it: measured on a tenor, a 133 × 133 × 10 mm ring cutting edge-on
   * across a 122 mm circular opening. Two rotations that undo each other are
   * how a misaligned rim survives being looked at in the source, so the
   * remaining one lives on the geometry where the bell's own axis is decided.
   */
  const geoBellRim = shared(`bellrim:${key}`, () => new TorusGeometry(bellR, 0.0055, 5, 20).rotateX(Math.PI / 2));
  const geoCup = shared(`cup:${key}`, () => new CylinderGeometry(0.013 + 0.006 * s, 0.013 + 0.006 * s, 0.005, 8));
  const geoRod = shared(`rod:${key}`, () => new CylinderGeometry(0.0035, 0.0035, bodyLen * 0.8, 6));
  const geoMouthpiece = shared('mouthpiece', () => new LatheGeometry([
    new Vector2(0.006, 0), new Vector2(0.012, 0.012), new Vector2(0.0155, 0.03),
    new Vector2(0.0155, 0.056), new Vector2(0.011, 0.068),
  ], 10));
  const geoLigature = shared('ligature', () => new TorusGeometry(0.0165, 0.0035, 4, 12));
  const geoOctave = shared('octave', () => new BoxGeometry(0.010, 0.030, 0.007));
  const geoThumb = shared('thumb', () => new BoxGeometry(0.020, 0.026, 0.008));
  const geoRing = shared('ring', () => new TorusGeometry(0.011, 0.0025, 4, 10));

  // --- assembly ----------------------------------------------------------
  const root = new Group();
  root.name = `saxophone:${member.name}`;

  /** The straight body tube. Its local +y runs from the bow up to the neck. */
  const body = addTo(root, new Group());
  body.position.set(SIDE * 0.055, bowY + 0.055, BODY_Z);
  body.rotation.set(BODY_TILT_X, 0, BODY_TILT_Z);
  body.updateMatrix();
  const bodyMatrix = body.matrix.clone();

  const tube = addTo(body, new Mesh(geoBody, matBody));
  tube.name = 'body';
  tube.castShadow = true;
  tube.receiveShadow = true;

  const rod = addTo(body, new Mesh(geoRod, matKeys));
  rod.name = 'rod';
  rod.position.set(SIDE * (0.021 + 0.008 * s), bodyLen * 0.5, rTop * 0.4);

  const bow = addTo(root, new Mesh(geoBow, matBody));
  bow.name = 'bow';
  bow.position.set(body.position.x, body.position.y, body.position.z + bowR);
  bow.castShadow = true;

  /** The bell: up and forward past the player's hip. Its own group, so it flares. */
  const bellGroup = addTo(root, new Group());
  bellGroup.position.set(body.position.x, body.position.y - 0.004, body.position.z + 2 * bowR);
  bellGroup.rotation.x = 0.55;
  const bell = addTo(bellGroup, new Mesh(geoBell, matBore));
  bell.name = 'bell';
  bell.castShadow = true;
  bell.receiveShadow = true;
  // No rotation on the mesh: `geoBellRim` is already turned onto the bell's
  // axis, and the `-Math.PI / 2` that used to be here undid it. See there.
  const bellRim = addTo(bellGroup, new Mesh(geoBellRim, matBody));
  bellRim.name = 'bell-rim';
  bellRim.position.y = bellLen;

  /** The strap hook, on the back of the tube where the strap can reach it. */
  const strapRing = addTo(body, new Mesh(geoRing, matKeys));
  strapRing.position.set(0, bodyLen * 0.66, -(rTop + 0.008));
  strapRing.rotation.x = Math.PI / 2;

  /**
   * The neck crook, from the top of the body across and back to the lips.
   *
   * It ends at the mouthpiece's **cork**, not at the lips — the beak is a
   * separate 68 mm and it points back into the player's mouth. Ending the
   * curve at the lip point and then growing the mouthpiece forward from there,
   * which is what this did, aims the beak at the audience and leaves the cork
   * between the player's teeth.
   */
  const corkZ = LIP_Z + MP_LEN - MP_BITE;
  const bodyTop = new Vector3(0, bodyLen, 0).applyMatrix4(bodyMatrix);
  const neckCurve = new CatmullRomCurve3([
    bodyTop.clone(),
    bodyTop.clone().add(new Vector3(0.004, 0.055, -0.012)),
    new Vector3(SIDE * 0.024, mouth.y - 0.012, corkZ + 0.055),
    new Vector3(0, mouth.y, corkZ + 0.006),
  ]);
  const geoNeck = shared(`neck:${key}:${bodyTop.x.toFixed(3)}:${bodyTop.y.toFixed(3)}:${bodyTop.z.toFixed(3)}`,
    () => new TubeGeometry(neckCurve, 14, rTop * 1.05, 8, false));
  const neck = addTo(root, new Mesh(geoNeck, matBody));
  neck.name = 'neck';
  neck.castShadow = true;

  const mouthpiece = addTo(root, new Mesh(geoMouthpiece, matDark));
  mouthpiece.name = 'mouthpiece';
  mouthpiece.position.set(0, mouth.y, corkZ);
  // −π/2 lays the lathe along −z, so the tip ends up in the player's mouth.
  mouthpiece.rotation.x = -Math.PI / 2 - 0.25;
  const ligature = addTo(root, new Mesh(geoLigature, matKeys));
  ligature.name = 'ligature';
  ligature.position.set(0, mouth.y - 0.004, corkZ - 0.014);
  ligature.rotation.x = 0.25;

  /**
   * The octave key and the thumb hook: the two things a saxophone puts on the
   * side of the tube facing the player, because thumbs are the only fingers
   * that stay behind the horn. Everything else is round the front.
   */
  const octave = addTo(body, new Group());
  octave.position.set(0, bodyLen * 0.94, -(rTop + 0.006));
  addTo(octave, new Mesh(geoOctave, matKeys)).name = 'octave-key';
  const thumb = addTo(body, new Mesh(geoThumb, matDark));
  thumb.name = 'thumb-rest';
  thumb.position.set(0, bodyLen * 0.5, -(rTop + 0.006));

  /**
   * One key cup per station, laid up the tube from the bow to the neck.
   *
   * Each one is its own group hinged on the rod, so `react` can lift the open
   * ones and drop the closed ones. Twelve pads reconfiguring on every note is
   * the whole visual payoff of a wind instrument at this distance.
   */
  const HOLE_T: readonly number[] = Array.from(
    { length: STATIONS }, (_, i) => 0.08 + (i / (STATIONS - 1)) * 0.84,
  );
  const cups: Group[] = [];
  for (const [i, t] of HOLE_T.entries()) {
    const r = rBot + (rTop - rBot) * t;
    const hinge = addTo(body, new Group());
    hinge.position.set(SIDE * (0.018 + 0.008 * s), t * bodyLen, r * 0.5);
    const cup = addTo(hinge, new Mesh(geoCup, matKeys));
    cup.name = `pad-${i}`;
    cup.position.set(-SIDE * (0.018 + 0.008 * s), 0, r * 0.5 + 0.006);
    cup.rotation.x = Math.PI / 2;
    cups.push(hinge);
  }

  // --- contacts ----------------------------------------------------------
  /**
   * The finger target for a station is the *lowest closed* hole — the last
   * finger still down. Walking that up the tube as the line rises is exactly
   * the motion an audience reads as playing a wind instrument.
   */
  /**
   * `side` backs a palm off toward its own end of the horn, and round to its
   * own side of it.
   *
   * A contact is where the **hand** goes, not where the fingertip goes. The
   * stations are about 40 mm apart on a tenor and a hand is 80 mm across, so
   * two palms on stations either side of the split overlap: measured at 28 mm
   * on a soprano before this existed. Half a hand each way is also simply
   * truer — the finger doing the work is at the end of the hand, not in the
   * middle of it.
   *
   * ## Both stacks face the house, and the hands arrive from both sides
   *
   * The rig builds a hand from `normal` and `along`, and the fingers come out
   * along `along × normal`. Handing both hands the same `along` therefore aims
   * both sets of fingers the same way round the tube, which puts both wrists on
   * the same side of the horn — on a saxophone, both of them out to the
   * player's left, with the right arm crossing in front of the keywork to get
   * there. Mirroring the axis is the whole fix: the left hand's fingers reach
   * right across the upper stack and the right hand's reach left across the
   * lower one, so each wrist stays on its own side. The knuckles still run the
   * length of the tube either way, which is what the keys need.
   *
   * The axis is `−side`, not `side`, and that sign is not free: the whole
   * keywork moved to the tube's far face, `normal` reversed with it, and a
   * cross product reverses when either input does. Leaving `along` alone would
   * have swapped the two hands round the horn again by a different route.
   *
   * `side` is `+1` for the left hand and `−1` for the right — `SIDE.right` is
   * local −x, as the note on which side the horn hangs already says.
   */
  const HAND = 0.032;
  /** How far round the tube from its centreline each wrist sits. */
  const WRAP = 0.013;

  /**
   * How far in front of the bore a fingertip goes: onto the pad, not over it.
   *
   * A cup is centred at `r + 0.006` and is 5 mm deep, so its front face is at
   * `r + 0.0085`. `keys` is a `touch: 1` pose and the contact is therefore the
   * pad of the index finger rather than the palm, so `r + 0.016` held every
   * finger 7.5 mm off the key it was pressing — an instrument being fingered
   * from just above.
   */
  const KEY_Z = 0.011;

  function contactAt(station: number, side: number): Contact {
    const t = HOLE_T[station]!;
    const r = rBot + (rTop - rBot) * t;
    return {
      position: new Vector3(side * WRAP, t * bodyLen + side * HAND, r + KEY_Z)
        .applyMatrix4(bodyMatrix),
      // The keys are on the far face of the tube, so a hand reaches round it
      // and comes at them from downstage, from whichever side its own arm is
      // on. `normal` is away from the instrument, hence +z.
      normal: new Vector3(side * 0.38, 0.1, 1).normalize().transformDirection(bodyMatrix),
      // Down the tube, mirrored per hand. See above for the sign.
      along: new Vector3(0, -side, 0).transformDirection(bodyMatrix),
    };
  }
  const rightContacts: Contact[] = HOLE_T.map((_, i) => contactAt(i, -1));
  const leftContacts: Contact[] = HOLE_T.map((_, i) => contactAt(i, 1));

  /**
   * Which of each hand's fingers are down, per speaking hole. See
   * `Contact.fingers`, and `fingersOnStack` for why the index takes the top of
   * the stack.
   *
   * Keyed by the **speaking** station and not by the contact's, which is the
   * whole reason this is a second table rather than a field of `contactAt`.
   * `stationFor` clamps a hand to its own six keys, so the right hand sits at
   * station 5 both for the F it is playing and for every note above it that
   * belongs to the left hand — one position, two completely different hands.
   * Keyed off the clamped station those would be the same four numbers, and a
   * saxophonist would keep three fingers down through the whole of the upper
   * register, which is the one part of a saxophone an audience can actually
   * check: on a high note the right hand comes off the horn.
   */
  const rightFingers = HOLE_T.map((_, s) => fingersOnStack(0, STACK_SPLIT - 1, s));
  const leftFingers = HOLE_T.map((_, s) => fingersOnStack(STACK_SPLIT, STATIONS - 1, s));

  /**
   * Which contact each hand takes for a given speaking hole.
   *
   * The hand that owns the hole is on it; the other sits at the end of its own
   * stack nearest the action — the left hand's little finger hovering over the
   * bottom of the upper stack, the right hand's index over the top of the
   * lower one. Neither hand ever leaves its six keys, which is the thing that
   * makes the two of them read as doing different work.
   */
  function stationFor(station: number, right: boolean): number {
    return right
      ? Math.min(station, STACK_SPLIT - 1)
      : Math.max(station, STACK_SPLIT);
  }

  /** Hands at rest sit over their own stacks, mid-horn. */
  const restRight = rightContacts[STACK_SPLIT - 2]!;
  const restLeft = leftContacts[STACK_SPLIT + 2]!;

  function copy(c: Contact, fingers?: FingerCurl): Contact {
    // `along` is copied. The previous version rebuilt the contact from
    // `position` and `normal` alone, which quietly discarded every knuckle
    // axis this file computes — the fingers then took whatever roll the
    // fallback produced and lay across the keys instead of down them.
    //
    // `fingers` is passed by reference on purpose: it is a frozen tuple off a
    // table nothing writes to, and there is no in-place transform for a caller
    // to perform on it the way there is on a vector.
    return {
      position: c.position.clone(),
      normal: c.normal.clone(),
      ...(c.along ? { along: c.along.clone() } : {}),
      ...(fingers ? { fingers } : {}),
    };
  }

  /** `'right-hand'` and `'bow'` ask for the sounding hand. See `InstrumentModel`. */
  function isRight(effector?: Effector): boolean {
    return effector === undefined || effector === 'right-hand' || effector === 'bow';
  }

  // --- animation state ---------------------------------------------------
  const closed: number[] = new Array<number>(STATIONS).fill(1);
  const closedTo: number[] = new Array<number>(STATIONS).fill(1);
  let octaveAt = 0;
  let octaveTo = 0;
  let flare = 0;
  let lastBeat = Number.NaN;
  /** Guards a second `dispose`: `release` is refcounted across the stage. */
  let disposed = false;

  return {
    archetype: 'saxophone',
    root,
    station: {
      /**
       * Straight behind the mouthpiece, which is on the model's centreline —
       * the horn does the sidestep, not the player. The z puts the lips 0.12 m
       * in front of the body axis, which is where the cast's mean mouth is.
       */
      offset: new Vector3(0, 0, LIP_Z - mouth.z),
      facing: 0,
      posture: SPEC.posture,
    },

    resolve(point: PlayPoint, effector?: Effector): Contact | undefined {
      const right = isRight(effector);
      if (point.kind === 'rest') return copy(right ? restRight : restLeft);
      if (point.kind !== 'hole') return undefined;
      if (point.midi < LO || point.midi > HI) return undefined;
      const { station } = fingeringFor(point.midi, member);
      const at = stationFor(station, right);
      return copy(
        (right ? rightContacts : leftContacts)[at]!,
        (right ? rightFingers : leftFingers)[station]!,
      );
    },

    react(point: PlayPoint, force: number, _now: number): void {
      if (point.kind === 'rest') {
        // Between phrases the hands stay over the keys and the octave key
        // lets go. A wind player does not reset to a neutral pose mid-tune.
        octaveTo = 0;
        return;
      }
      if (point.kind !== 'hole') return;
      if (point.midi < LO || point.midi > HI) return;
      const { station, register } = fingeringFor(point.midi, member);
      // Everything from the speaking hole up is closed; everything below it,
      // toward the bell, is open. That is the whole of how a wind works.
      for (let i = 0; i < STATIONS; i++) closedTo[i] = i >= station ? 1 : 0;
      octaveTo = register > 0 ? 1 : 0;
      flare = Math.max(flare, 0.2 + 0.8 * Math.min(Math.max(force, 0), 1));
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

      // Pads are light and fast; they snap rather than settle.
      const k = 1 - Math.exp(-dt / 0.035);
      for (let i = 0; i < STATIONS; i++) {
        closed[i] = closed[i]! + (closedTo[i]! - closed[i]!) * k;
        // Negative, because the cup now hangs off the hinge at +z. The pad has
        // to swing the same way it always did — up off its hole — and the sign
        // of that rotation follows the side of the tube the keywork is on.
        cups[i]!.rotation.x = -0.24 * (1 - closed[i]!);
      }
      octaveAt += (octaveTo - octaveAt) * k;
      octave.rotation.x = -0.5 * octaveAt;

      flare += (0 - flare) * (1 - Math.exp(-dt / 0.22));
      const g = 1 + 0.05 * flare;
      bellGroup.scale.set(g, 1 + 0.015 * flare, g);
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
