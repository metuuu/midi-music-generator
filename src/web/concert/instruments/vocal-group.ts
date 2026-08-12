/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * What a vocal group stands at: a ribbon microphone in a yoke, on a floor stand.
 *
 * ## This file is one singer's hardware, not the group's
 *
 * The archetype is three or four people and casting stages three or four
 * `Performer`s for it — see `ARCHETYPES['vocal-group']`, where that decision is
 * argued. So this builds **one** stand, the same way `singer.ts` builds one, and
 * the row is the cast's doing rather than this file's. It is worth stating
 * because the obvious alternative was tried on paper first: one performer, and a
 * model that drew the other three. The seam refuses it and rightly — see
 * `InstrumentBuildOptions`, which carries a height and a posture and deliberately
 * not a `Look` — so those three would have stood there in clothes nobody chose,
 * with faces nobody drew, perfectly still, beside a fourth who breathed. Bodies
 * belong to the performer rig; hardware belongs here. `singer.ts` opens with the
 * same sentence and this is the same split.
 *
 * ## Why it is not the singer's microphone
 *
 * The tempting answer was `buildSinger` reused as-is, and the height is not what
 * separates them — both stands are racked out to the player standing at them,
 * and the section below says why this one had to be argued back to that. What a
 * shared builder cannot do is the other half, and the other half is the whole
 * reason this archetype exists.
 *
 * `singer.ts` builds a ball-grille dynamic on a boom clip: a 1960s object, and
 * the right one for the act it stages. This archetype is reached from
 * `EARLY_ARCHETYPE_OF`, which fires only **before 1970** — a country string band
 * in 1932, a gospel quartet, a doo-wop group, the years in which a written choir
 * is people because no keyboard could make the sound yet.
 *
 * That year was written here as 1963 and was wrong, which is worth a line because
 * of *how* it was wrong: 1963 is `SYNTH_RIGS.polysynth.from`, and
 * `EARLY_ARCHETYPE_OF`'s own doc argues at length that the two numbers must not be
 * conflated — the first synthesiser existing is a different fact from a choir
 * patch being the ordinary way to get that sound. The gap between them is not
 * academic: country's nashville era is 1968, it stages the Jordanaires on **43 %
 * of
 * its pads** — 34.8 %, measured over 400 numbers against the palette as it now
 * stands, 123 vocal groups out of the 353 that had a pad at all — and a reader
 * of this paragraph would have concluded it could not. Staging those four
 * people at four modern vocal mics would put the anachronism back one object
 * along from where it was just taken out, which is the least useful possible
 * outcome of a fix. What a group sang into in those decades is a ribbon: a flat
 * slab hung in a chrome yoke, live on both faces, big enough to see from the back
 * of a hall and heavy enough to need a stand you could not knock over.
 *
 * So the object is its own, and the shared parts are shared as *conventions*
 * rather than as geometry — the same `mouthFor`, the same contact semantics, the
 * same shiver-and-swing pair, the same refcounted cache. A reader who knows
 * `singer.ts` knows this file.
 *
 * ## The height is this singer's, and the row is uneven because people are
 *
 * `singer.ts` racks its stand out to `mouthFor(opts, …)`, this player's own
 * mouth, and its note calls that the one instrument in the family where the fix
 * is the object's actual behaviour: setting the height is the first thing anybody
 * does to a microphone stand. This file does the same thing, and that is a
 * reversal — it used to drop `opts.height` on the floor and send every stand in
 * the row to `ARCHETYPES['vocal-group'].workHeight`, on the argument that four
 * stands at four heights read as a stepped fence rather than as one group.
 *
 * The argument was about the wrong object. A stand nobody adjusted does not
 * make the row even; it makes the *heads* uneven, because the mouth contact is
 * what the rig chases. `place('mouth', …)` moves the head until the lips reach
 * the point, so a fixed 1.55 m mouth against casting's 1.58–1.92 m draw pulls a
 * tall singer's head down by up to 15 cm and lifts a short one's — four people
 * at four unexplained neck angles, hunching at nothing, which is a far louder
 * fault than four shafts racked to four lengths. Bodies are the thing an
 * audience reads; a chrome tube 40 cm below the faces is not.
 *
 * So the stand goes where this singer's mouth is and the heads sit level on
 * their own shoulders. `SPEC.workHeight` stays as the fallback `mouthFor`
 * answers for a caller with no performer — the bench, a test — which is what
 * `InstrumentBuildOptions.height` documents it as.
 *
 * ## And they stand back off it
 *
 * `LEAN_IN` is 0.11 m against the soloist's 0.045 — the constant below says so;
 * this said 0.12. A ribbon is live on its face
 * over a wide angle and a group singing into one is blended by the room rather
 * than by the desk, so nobody has their lips on it — and four heads each 4 cm off
 * their own grille is four people leaning in, which is a solo mannerism. It is
 * also the only thing standing between a group's heads and their own stands: at
 * the soloist's distance a head placed on the capsule has the yoke arms through
 * the chin.
 */

import {
  BoxGeometry, CatmullRomCurve3, CylinderGeometry, Group, LatheGeometry, Mesh,
  MeshStandardMaterial, TorusGeometry, TubeGeometry, Vector2, Vector3,
} from 'three';

import { ARCHETYPES } from '../../../concert/instruments.js';
import type { PlayPoint } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import { mouthFor } from './mouth.js';
import type {
  Contact, InstrumentBuildOptions, InstrumentBuilder, InstrumentModel,
} from './types.js';
import { addTo } from './types.js';

// ---------------------------------------------------------------------------
// Shared GPU resources
// ---------------------------------------------------------------------------

interface Disposable { dispose(): void }

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

const SPEC = ARCHETYPES['vocal-group'];

/** How far off the live face the singers' lips sit. See the note at the top. */
const LEAN_IN = 0.11;
/**
 * How far the head's centre sits downstage of the column.
 *
 * A ribbon hangs *in* its yoke rather than out in front of one, so this is small
 * — it is the depth of the head plus the clearance to the arms, and no more. The
 * singers are upstage of it at −z; the live face is the −z face.
 */
const HEAD_Z = 0.012;
/**
 * How far below the lips the head hangs, and it is the number the bench found.
 *
 * The first version put the head's *centre* at mouth height, which is what "the
 * capsule goes where the mouth is" means on `singer.ts` and is exactly wrong
 * here. A ball-grille dynamic is 5 cm across and a face reads past it; this
 * thing is 18 cm tall and 11 wide, and at lip height it covered the singer's
 * face from the eyebrows down — a bench exhibit with no face on it, which is
 * the whole class of fault this page exists to catch.
 *
 * It is also what the object does in life. A large ribbon on a floor stand is
 * set with its **top at about the singer's chin** and sung down across, because
 * a slab that size in front of a face is in the way for the people in the room
 * as much as for a camera. So the head's top lands 4.5 cm under the lips and the
 * face is clear above it.
 */
const HEAD_DROP = 0.135;
/**
 * How far the head tips, and **the sign is the second thing the bench found.**
 *
 * It is `+`, tipping the top *downstage* — which is the opposite of the
 * soloist's `MIC_TILT` and is not a slip. A ball-grille dynamic is end-address:
 * it is aimed along its own stem, so leaning the stem back toward the singer
 * aims it at them. A ribbon is side-address, aimed normal to its face, and a
 * face that starts looking straight upstage tips *down* when the head leans
 * back. Written with the soloist's sign, the live face of a microphone hanging
 * below the lips pointed at the floor in front of it.
 *
 * So the top goes away from the singers and the face looks back and up at the
 * mouths above it, which is where they are.
 */
const HEAD_TILT = 0.20;
/** Half the head's width, and its height. A 44-series ribbon is about this. */
const HEAD_HALF_W = 0.053;
const HEAD_H = 0.180;
/**
 * How much of that half-width survives in `z`.
 *
 * The body is turned on a lathe and then squashed, because a ribbon is a slab
 * rather than a can: 10.6 cm across the face and 5.8 through. Modelling it as an
 * ellipse in section would need its own attribute pass for one silhouette; a
 * uniform scale on the mesh is the same shape for nothing.
 */
const HEAD_FLATTEN = 0.55;
/** Top of the fixed lower shaft, where the clutch grips. */
const CLUTCH_Y = 0.98;
/** How far the yoke's collar sits below the head's centre. */
const YOKE_DROP = 0.115;
/** Links in the swinging part of the cable. */
const CABLE_LINKS = 5;
const LINK_LEN = 0.055;

export const buildVocalGroup: InstrumentBuilder = (
  opts: InstrumentBuildOptions,
): InstrumentModel => {
  live++;
  const rng = new Rng(`vocal-group:${opts.seed}`);

  /**
   * This singer's own mouth — the stand is racked out to reach it.
   *
   * See the note at the top. Passing the height is what keeps the head where
   * the body put it: the rig places the lips on `resolve`'s contact, so a stand
   * set to anything but this player's mouth is paid for in neck.
   */
  const mouth = mouthFor(opts, SPEC.workHeight);
  /** The head's own centre, a chin's worth below the lips. See `HEAD_DROP`. */
  const headY = mouth.y - HEAD_DROP;
  /** The middle of the live face — the upstage skin of the slab. */
  const FACE = new Vector3(0, headY, HEAD_Z - HEAD_HALF_W * HEAD_FLATTEN);
  /**
   * Where a singer's lips go: at their own mouth height, back off the face.
   *
   * Stated rather than derived from the face along the normal, which is what
   * `singer.ts` does and is right there — a soloist's lips really are on the
   * axis of an end-address capsule. Here they are not: the head hangs below the
   * mouths and the group sings down across the top of it, so a contact placed
   * along the face's normal would sit 13 cm low, at the throat.
   */
  const LIPS = new Vector3(0, mouth.y, FACE.z - LEAN_IN);
  /** Where the yoke collar has to sit for the head to hang there. */
  const collarY = headY - YOKE_DROP;
  /** The upper shaft is racked out of the clutch until it reaches the collar. */
  const upperLen = Math.max(0.04, collarY - CLUTCH_Y);

  // The stand takes the venue's tint like the soloist's does — a nickelled one
  // in a barn dance and a black one under a proscenium — and falls back to
  // chrome more often than the soloist's does, because in these decades that is
  // what stands were.
  const standHue = opts.finish ?? (rng.chance(0.65) ? '#c6cbd1' : '#232527');
  const matStand = shared(`gstand:${standHue}`, () => new MeshStandardMaterial({
    color: standHue, roughness: 0.28, metalness: 0.85,
  }));
  const matYoke = shared('gyoke', () => new MeshStandardMaterial({
    color: '#cfd4da', roughness: 0.22, metalness: 0.9,
  }));
  const matHead = shared('ghead', () => new MeshStandardMaterial({
    color: '#3d4045', roughness: 0.5, metalness: 0.5,
  }));
  const matGrille = shared('ggrille', () => new MeshStandardMaterial({
    // Brighter than the body, for the same reason the soloist's grille is: on a
    // number this thing is what the eye is meant to find, and on this one there
    // are four of them making a line the audience reads as a group.
    color: '#a7aeb6', roughness: 0.6, metalness: 0.85,
  }));
  const matCable = shared('gcable', () => new MeshStandardMaterial({
    color: '#141414', roughness: 0.85, metalness: 0.0,
  }));

  /** A wide cast base. A group leans on this one; a soloist's is 3 cm smaller. */
  const geoBase = shared('gbase', () => new LatheGeometry([
    new Vector2(0.000, 0.000), new Vector2(0.162, 0.000), new Vector2(0.170, 0.012),
    new Vector2(0.160, 0.026), new Vector2(0.058, 0.036), new Vector2(0.036, 0.056),
    new Vector2(0.021, 0.060),
  ], 22));
  const geoLowerShaft = shared('glowershaft',
    () => new CylinderGeometry(0.0145, 0.0155, 0.93, 10).translate(0, 0.465, 0));
  const geoClutch = shared('gclutch', () => new CylinderGeometry(0.0225, 0.0225, 0.058, 12));
  // Keyed by its own length, as the soloist's is: two singers of different
  // heights are two lengths of shaft, and two of the same height still share
  // one buffer — which a row of four, drawn from one casting range, often does.
  const geoUpperShaft = shared(`guppershaft:${upperLen.toFixed(3)}`,
    () => new CylinderGeometry(0.0108, 0.0108, upperLen, 10).translate(0, upperLen / 2, 0));
  const geoCollar = shared('gcollar', () => new TorusGeometry(0.0235, 0.006, 5, 14));
  /** One arm of the yoke: a flat strap rising and cranking in to a trunnion. */
  const geoYokeArm = shared('gyokearm', () => new BoxGeometry(0.008, YOKE_DROP + 0.02, 0.016));
  const geoTrunnion = shared('gtrunnion', () => new CylinderGeometry(0.007, 0.007, 0.012, 8)
    .rotateZ(Math.PI / 2));

  /**
   * The head, as a lathe turned about its own vertical axis and then squashed.
   *
   * The profile is a half-width that rounds off top and bottom over the last
   * 3 cm, which is the ribbon silhouette: not a can, not a box, a slab with
   * radiused ends hanging between two arms.
   */
  const geoHeadBody = shared('gheadbody', () => new LatheGeometry([
    new Vector2(0.0000, -HEAD_H / 2),
    new Vector2(HEAD_HALF_W * 0.62, -HEAD_H / 2),
    new Vector2(HEAD_HALF_W * 0.94, -HEAD_H / 2 + 0.022),
    new Vector2(HEAD_HALF_W, -HEAD_H / 2 + 0.048),
    new Vector2(HEAD_HALF_W, HEAD_H / 2 - 0.048),
    new Vector2(HEAD_HALF_W * 0.94, HEAD_H / 2 - 0.022),
    new Vector2(HEAD_HALF_W * 0.62, HEAD_H / 2),
    new Vector2(0.0000, HEAD_H / 2),
  ], 20));

  /**
   * The live face: the same profile a hair proud, over the upstage half only.
   *
   * `phiStart` is measured from `+z` in a `LatheGeometry` — the vertex is
   * `(x·sin φ, y, x·cos φ)` — so half a turn beginning at a quarter puts the
   * whole of it in `z ≤ 0`, which is the side the singers are on. Getting this
   * backwards is the hood-and-wrap bug one directory up, where a face hole ended
   * over an ear because nobody checked which axis phi starts on; it is written
   * out here rather than found again.
   */
  const geoHeadFace = shared('gheadface', () => new LatheGeometry([
    new Vector2(HEAD_HALF_W * 0.60, -HEAD_H / 2 + 0.030),
    new Vector2(HEAD_HALF_W * 1.02, -HEAD_H / 2 + 0.050),
    new Vector2(HEAD_HALF_W * 1.02, HEAD_H / 2 - 0.050),
    new Vector2(HEAD_HALF_W * 0.60, HEAD_H / 2 - 0.030),
  ], 16, Math.PI / 2, Math.PI));

  const geoConnector = shared('gconnector', () => new BoxGeometry(0.020, 0.022, 0.020));
  const geoLink = shared('glink', () => new CylinderGeometry(0.0055, 0.0055, LINK_LEN, 6)
    .translate(0, -LINK_LEN / 2, 0));

  // --- assembly ----------------------------------------------------------
  const root = new Group();
  root.name = 'vocal-group';

  const base = addTo(root, new Mesh(geoBase, matStand));
  base.name = 'base';
  base.castShadow = true;
  base.receiveShadow = true;

  const lowerShaft = addTo(root, new Mesh(geoLowerShaft, matStand));
  lowerShaft.name = 'lower-shaft';
  lowerShaft.position.y = 0.05;
  lowerShaft.castShadow = true;

  const clutch = addTo(root, new Mesh(geoClutch, matStand));
  clutch.name = 'clutch';
  clutch.position.y = CLUTCH_Y;

  const upperShaft = addTo(root, new Mesh(geoUpperShaft, matStand));
  upperShaft.name = 'upper-shaft';
  upperShaft.position.y = CLUTCH_Y + 0.02;
  upperShaft.castShadow = true;

  /**
   * The yoke, and everything it holds. `yoke` is the pivot: the whole cradle
   * leans back into the singers rather than the head leaning inside a cradle
   * that does not, which is what a real trunnion mount does — the arms turn with
   * the head because the head is bolted through them.
   */
  const yoke = addTo(root, new Group());
  yoke.position.set(0, collarY, HEAD_Z);
  yoke.rotation.x = HEAD_TILT;

  const collar = addTo(yoke, new Mesh(geoCollar, matYoke));
  collar.name = 'yoke-collar';
  collar.rotation.x = Math.PI / 2;

  for (const side of [-1, 1]) {
    const arm = addTo(yoke, new Mesh(geoYokeArm, matYoke));
    arm.name = 'yoke-arm';
    arm.position.set(side * (HEAD_HALF_W + 0.014), (YOKE_DROP + 0.02) / 2 - 0.006, 0);
    arm.castShadow = true;
    const screw = addTo(yoke, new Mesh(geoTrunnion, matYoke));
    screw.name = 'trunnion';
    screw.position.set(side * (HEAD_HALF_W + 0.014), YOKE_DROP, 0);
  }

  /** The microphone itself. Its own group, so it can shiver on its mount. */
  const mic = addTo(yoke, new Group());
  mic.position.y = YOKE_DROP;
  const headBody = addTo(mic, new Mesh(geoHeadBody, matHead));
  headBody.name = 'head';
  headBody.scale.z = HEAD_FLATTEN;
  headBody.castShadow = true;
  // The family calls whatever the mouth arrives at the "mouthpiece", and the
  // model probe measures every one of them against the same lip distance. The
  // live face of a ribbon is one.
  const face = addTo(mic, new Mesh(geoHeadFace, matGrille));
  face.name = 'mouthpiece';
  face.scale.z = HEAD_FLATTEN;
  face.castShadow = true;
  const connector = addTo(mic, new Mesh(geoConnector, matHead));
  connector.name = 'connector';
  connector.position.y = -HEAD_H / 2 - 0.008;

  /**
   * The cable: a swinging loop off the head's tail, then a static run to the
   * boards and away toward the wings.
   *
   * Same argument as the soloist's, and it is worth four hundred triangles for
   * the same reason: a stand with no cable is a shop-window prop. In a row of
   * four it is worth rather more than that, because four identical stands with
   * four identical leads is the one place on this stage where a repeated object
   * is *right* — a group's gear matches, and the cables are what shows it.
   */
  const cable = addTo(root, new Group());
  cable.position.copy(yoke.position)
    .add(new Vector3(0, YOKE_DROP - HEAD_H / 2 - 0.018, 0).applyEuler(yoke.rotation));
  const links: Group[] = [];
  let hook: Group = cable;
  for (let i = 0; i < CABLE_LINKS; i++) {
    const link = addTo(hook, new Group());
    if (i > 0) link.position.y = -LINK_LEN;
    // A hanging cable is not straight: it drifts back toward the stand.
    link.rotation.x = i === 0 ? 0.24 : 0.06;
    addTo(link, new Mesh(geoLink, matCable));
    links.push(link);
    hook = link;
  }

  // Where the swinging part ends, at rest — the static run starts there.
  root.updateMatrixWorld(true);
  const chainEnd = new Vector3(0, -LINK_LEN, 0)
    .applyMatrix4(links[CABLE_LINKS - 1]!.matrixWorld);
  const runCurve = new CatmullRomCurve3([
    chainEnd.clone(),
    new Vector3(0.032, chainEnd.y - 0.30, 0.050),
    new Vector3(0.012, 0.34, 0.028),
    new Vector3(-0.062, 0.078, 0.010),
    new Vector3(-0.200, 0.010, -0.080),
    new Vector3(-0.400, 0.010, -0.190),
  ]);
  const geoRun = shared(
    `grun:${chainEnd.x.toFixed(3)}:${chainEnd.y.toFixed(3)}:${chainEnd.z.toFixed(3)}`,
    () => new TubeGeometry(runCurve, 22, 0.0055, 6, false),
  );
  addTo(root, new Mesh(geoRun, matCable));

  // --- contacts ----------------------------------------------------------
  /**
   * Out of the live face, toward the singers.
   *
   * A ribbon's axis of maximum sensitivity is normal to its face rather than up
   * its stem, which is the one place the geometry here differs from the
   * soloist's in a way that reaches `resolve`: `singer.ts` runs its normal up
   * the microphone's own tilted axis because a ball-grille dynamic is an
   * end-address capsule. This one is side-address, and the difference matters
   * because the normal is what a rig that wants the lips a few centimetres off
   * the mesh adds `gap` along.
   */
  const axis = new Vector3(0, 0, -1).applyEuler(yoke.rotation).normalize();
  const sungContact: Contact = {
    position: LIPS.clone(),
    normal: axis.clone(),
  };
  /**
   * A rest is a breath, and it is taken off the microphone — back and a little
   * down, in `z` rather than along the axis.
   *
   * The soloist's file records why: backing off along a leaning microphone's own
   * axis is mostly *upward*, so a singer answered by lifting their head 8 cm
   * every time they stopped. It is a smaller error here, because a ribbon on a
   * trunnion leans a quarter of what a clipped dynamic does — and it is the same
   * error, so it gets the same answer rather than a rediscovery of it.
   */
  const restContact: Contact = {
    position: sungContact.position.clone().add(new Vector3(0, -0.015, -0.09)),
    normal: axis.clone(),
  };

  function copy(c: Contact): Contact {
    return { position: c.position.clone(), normal: c.normal.clone() };
  }

  // --- animation state ---------------------------------------------------
  let shake = 0;
  let phase = 0;
  let swing = 0;
  let swingVel = 0;
  let lastBeat = Number.NaN;
  /** Guards a second `dispose`: `release` is refcounted across the stage. */
  let disposed = false;

  return {
    archetype: 'vocal-group',
    root,

    /** Where the static run stops, handed on so the lead reaches the same box. */
    outlet: new Vector3(-0.400, 0.010, -0.190),
    station: {
      /**
       * Just upstage of the stand, facing out — and further back than a soloist
       * stands, which is `LEAN_IN`'s doing rather than a second number.
       *
       * `mouth.z` is how far in front of their own axis this singer's lips are,
       * so subtracting it puts the *body* where the lips land on the contact.
       */
      offset: new Vector3(0, 0, sungContact.position.z - mouth.z),
      facing: 0,
      posture: SPEC.posture,
    },

    /**
     * The live face, whatever is being sung.
     *
     * `point.vowel` and `point.consonant` are not read, for the reason
     * `singer.ts` sets out at length: those two fields belong to the face, the
     * face is built by the performer rig, and a microphone has no opinion about
     * whether it is hearing an /a/ or an /u/. It is worth repeating here rather
     * than cross-referencing, because on this archetype every note is an /a/ —
     * a choir patch carries no vowels and `sungPart` supplies the default — and
     * a reader could reasonably wonder whether that is this file's doing. It is
     * not. It would answer the same for a whole libretto.
     */
    resolve(point: PlayPoint): Contact | undefined {
      if (point.kind === 'viseme') return copy(sungContact);
      if (point.kind === 'rest') return copy(restContact);
      return undefined;
    },

    react(point: PlayPoint, force: number, _now: number): void {
      if (point.kind !== 'viseme') return;
      const f = Math.min(Math.max(force, 0), 1);
      // A ribbon is a heavy thing on a trunnion rather than a light one in a
      // rubber clip, so it takes less from the same note and holds it longer —
      // see the decay constant in `update`.
      shake = Math.max(shake, 0.18 + 0.55 * f);
      swingVel += 0.9 * f * f;
    },

    update(now: number): void {
      // A non-finite beat has to stop here: `dt` would be NaN, every eased value
      // below is `x += (target − x) · k`, and one NaN k turns the whole
      // instrument into NaN transforms permanently. Three.js goes on drawing it,
      // at no position, for the rest of the show.
      if (!Number.isFinite(now)) return;
      const dt = Number.isFinite(lastBeat) ? Math.min(Math.max(now - lastBeat, 0), 0.5) : 0;
      lastBeat = now;
      if (dt === 0) return;

      // The head rocks in its yoke: slower and smaller than the soloist's
      // shiver, because a ribbon in a metal cradle is a pendulum rather than a
      // capsule on a rubber band. Capped well under a floating hand's tolerance,
      // so nothing placed against `resolve` drifts.
      phase += dt * 17;
      shake *= Math.exp(-dt / 0.26);
      const d = 0.0025 * shake * Math.sin(phase);
      mic.rotation.x = d * 2.2;
      mic.position.set(0, YOKE_DROP + d * 0.4, 0);

      // A pendulum, damped. The links share the angle unequally so the loop
      // bends rather than swinging as one rigid stick.
      swingVel -= swing * 34 * dt;
      swingVel *= Math.exp(-dt / 0.55);
      swing += swingVel * dt;
      for (let i = 0; i < CABLE_LINKS; i++) {
        const w = 0.5 + 0.5 * (i / (CABLE_LINKS - 1));
        links[i]!.rotation.z = swing * 0.055 * w;
      }
    },

    dispose(): void {
      // A second call would free the shared buffers out from under every other
      // one of these on the stage — and on this archetype there are always three
      // or four, so the guard is load-bearing rather than defensive.
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      root.clear();
      release();
    },
  };
};
