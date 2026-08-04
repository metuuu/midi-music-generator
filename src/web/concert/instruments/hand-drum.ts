/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The hand drum — one skin, two bare hands, and a tray of small things.
 *
 * This is the object that was missing. `DrumVoice` grew `lp`/`mp`/`hp` so that
 * a darbuka, a tabla and a set of congas could be *written*, and for a while
 * nothing was built to receive them: they resolved through the drum kit's
 * layout to three points out past the floor tom where no drum stood, and a
 * seated drummer reached into the air beside their own kit once a bar. Arabic
 * is the worst of it — a `maqsum` is hand strokes and a riq and nothing else,
 * so an entire acoustic kit was staged for a part that used none of it.
 *
 * **Which way round.** Same frame and same conventions as the kit: the player
 * sits at `-z` facing `+z` toward the audience, so their *right* hand is toward
 * `-x`. The trap table is therefore at `-x`, which is where a percussionist
 * puts one — under the hand that reaches for a tambourine while the other stays
 * on the skin.
 *
 * **What it is not.** Not a smaller drum kit. There are no pedals, no sticks
 * and no cymbals, `ARCHETYPES.handdrum` says `points: ['drum', 'rest']`, and
 * the choreographer never places a foot here. The one thing this model shares
 * with `drumkit.ts` is the split between `react` and `update`: the hand
 * arriving and the skin moving because of it are deliberately on opposite sides
 * of the interface.
 */

import {
  CircleGeometry, CylinderGeometry, DoubleSide, Group, LatheGeometry, Material, Mesh,
  MeshStandardMaterial, Object3D, SphereGeometry, Vector2, Vector3,
} from 'three';

import type { PlayPoint, Posture } from '../../../concert/types.js';
import { Rng } from '../../../core/rng.js';
import type { DrumVoice } from '../../../core/types.js';
import {
  addTo, type Contact, type InstrumentBuilder, type InstrumentModel,
} from './types.js';

const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// The layout
// ---------------------------------------------------------------------------

/** Head radius. A goblet drum is narrower than this; a djembe is wider. */
const HEAD_R = 0.145;

/**
 * How high this object stands, which is a fact about the player and not about
 * the drum.
 *
 * Three heights, because three things have to come down together or the object
 * pulls itself apart: the head the hands are on, the board the small pieces
 * stand on, and the point in front of the sternum where two hands meet for a
 * clap. Everything else in the file is derived from those.
 *
 * **A chair and a carpet are not one drum translated.** The body of a goblet
 * drum runs from the head to the boards — see `bodyLength` — so lowering the
 * head shortens the instrument rather than sinking it, and the trap table beside
 * it grows shorter legs rather than shorter ones buried in the deck. That is why
 * this is a build-time choice rather than a `position.y` on the root, and it is
 * the whole of what `InstrumentBuildOptions.posture` is for.
 *
 * The floor figures are the object at rest on a carpet in front of somebody
 * cross-legged: a tabla on its ring, a mridangam across the shins, a darbuka
 * over a thigh — all of them put a head at about a third of a metre. It lines up
 * with the body it has to meet without either being fitted to the other:
 * `handRests` in `performer-look.ts` idles a floor-seated player's hands at
 * `hipY + 0.34 × torsoH`, which is 0.285 m, and the shoulder is at 0.65. A head
 * at 0.32 is under the hands where they already are.
 */
interface Seat {
  /** The centre of the head. */
  head: number;
  /** The top face of the trap table's board. */
  table: number;
  /** Where two hands meet for a clap, in front of the sternum. */
  clap: number;
}

/** Between the knees of somebody on a chair. The archetype's own posture. */
const ON_A_CHAIR: Seat = { head: 0.72, table: 0.70, clap: 0.99 };
/** On the carpet in front of somebody cross-legged. See `Posture.floor`. */
const ON_THE_FLOOR: Seat = { head: 0.32, table: 0.30, clap: 0.59 };

const seatFor = (posture: Posture | undefined): Seat =>
  (posture === 'floor' ? ON_THE_FLOOR : ON_A_CHAIR);

/**
 * Which way "off the skin" points.
 *
 * The tilt is toward the player, as every normal on the kit is, and for the
 * same reason — it is what stops each prep being a vertical lift. On a hand
 * drum it is also simply true: a drum held between the knees leans back, and one
 * lying on a carpet in front of crossed legs leans back further if anything.
 */
const HEAD_UP = new Vector3(0, 0.985, -0.17).normalize();

/**
 * Downstage along the skin: the in-plane direction the strokes are spaced out
 * along, derived from `HEAD_UP` rather than written a second time.
 *
 * Writing it twice is the bug `stand` exists to prevent over in `drumkit.ts`,
 * one file along — a surface and the points on it disagreeing about which way
 * the surface faces. Here the edge strokes are *defined* as a step across the
 * head, so a change of tilt moves them without being told.
 */
const HEAD_ALONG = new Vector3(0, 0, 1)
  .addScaledVector(HEAD_UP, -HEAD_UP.z).normalize();

/** How far out from the centre an edge stroke lands. */
const EDGE = HEAD_R * 0.72;

/** The trap table: where it stands beside the player, and how thick it is. */
const TABLE_X = -0.40;
const TABLE_Z = 0.02;
const TABLE_THICK = 0.018;

/** How far behind the head a clap lands. Its height is `Seat.clap`. */
const CLAP_Z = -0.16;

/**
 * How tall each small piece is, and therefore where its struck face is.
 *
 * The contacts below are derived as *table top plus piece height* rather than
 * written as coordinates, because writing them out is how a piece ends up
 * standing through the board it is meant to be resting on: a shaker eleven
 * centimetres tall whose strike point was a hand's width above the table had
 * its base four centimetres under it. One number per piece, read by both the
 * mesh and the point, and the two cannot disagree.
 */
const PIECE = { tb: 0.045, sh: 0.110, perc: 0.052, cb: 0.100 } as const;

/** A point on the instrument: where it is, and which way it faces. */
interface Spot { at: Vector3; up: Vector3 }

/**
 * Where each voice this player can own is struck, and where the objects that
 * carry them stand.
 *
 * One table, read by `resolve` and used to place the geometry, so a hand and
 * the thing it lands on cannot drift apart — the same contract the kit's
 * `LAYOUT` holds itself to. Built per instrument rather than declared once,
 * because the *height* of every entry in it is the player's rather than the
 * drum's — see `Seat` — and a second table for the second height is exactly the
 * duplication this one exists to prevent.
 *
 * `points` is deliberately *not* total over `DrumVoice`. A hand drummer has no
 * snare, no hi-hat and no kick, and `drumStations` in `concert/instruments.ts`
 * is what guarantees none of those ever reaches this model: kit voices go to a
 * kit, and a part that has any is cast with a drummer behind one. A `Partial`
 * record that says so is more honest than eleven entries pointing at the same
 * skin.
 */
interface Layout {
  headAt: Vector3;
  tableAt: Vector3;
  tableTop: number;
  points: Partial<Record<DrumVoice, Spot>>;
  /** Hands at rest, hovering just off the skin. */
  rest: Spot;
}

function layoutFor(seat: Seat): Layout {
  const headAt = new Vector3(0, seat.head, 0);
  const tableAt = new Vector3(TABLE_X, seat.table, TABLE_Z);
  const tableTop = tableAt.y + TABLE_THICK / 2;
  const flat = () => new Vector3(0, 1, 0);

  return {
    headAt,
    tableAt,
    tableTop,
    points: {
      /** *Dum*: the palm in the middle of the head, which is the low one. */
      lp: { at: headAt.clone(), up: HEAD_UP.clone() },
      /** The near rim, under the hand that is already there. */
      mp: { at: headAt.clone().addScaledVector(HEAD_ALONG, -EDGE), up: HEAD_UP.clone() },
      /** *Tek*: the far rim, fingertips, and the high one. */
      hp: { at: headAt.clone().addScaledVector(HEAD_ALONG, EDGE), up: HEAD_UP.clone() },

      /**
       * The riq, lying on the table where a frame drum lies when it is not in
       * the air. Arabic writes `tb` in the same bar as every `lp` it writes, and
       * it means a riq rather than a tambourine bolted to a hi-hat stand — which
       * is exactly why `STATION_OF` files the auxiliary voices as `either`
       * rather than as the kit's property.
       */
      tb: { at: new Vector3(tableAt.x + 0.06, tableTop + PIECE.tb, tableAt.z + 0.04), up: flat() },
      sh: { at: new Vector3(tableAt.x - 0.10, tableTop + PIECE.sh, tableAt.z - 0.08), up: flat() },
      perc: { at: new Vector3(tableAt.x - 0.09, tableTop + PIECE.perc, tableAt.z + 0.11), up: flat() },
      cb: { at: new Vector3(tableAt.x + 0.04, tableTop + PIECE.cb, tableAt.z + 0.15), up: flat() },

      /**
       * A clap, which is the one point on this instrument that is not on an
       * object — and therefore the one whose height is unmistakably the
       * *player's*, since it is in front of their sternum. See `Seat.clap`.
       *
       * The kit answers `cp` by growing a rubber pad, because a drummer holding
       * two sticks has no way to clap. A percussionist has bare hands and needs
       * no prop, so this is simply where they meet: in front of the sternum,
       * above and behind the drum, clear of the skin.
       *
       * One hand is sent here, not two, and that is a constraint rather than a
       * preference: `npm run concert` asserts one sounding gesture per written
       * note, so a clap that moved both arms would count twice and fail. The
       * free hand is idling on the skin a few centimetres below, which reads as
       * a percussionist clapping with one hand busy — the same compromise the
       * kit makes by growing a pad, and visible in the same way.
       */
      cp: { at: new Vector3(0, seat.clap, CLAP_Z), up: new Vector3(0, 0.64, -0.77) },
    },
    rest: {
      at: headAt.clone().addScaledVector(HEAD_UP, 0.11).addScaledVector(HEAD_ALONG, -0.04),
      up: HEAD_UP.clone(),
    },
  };
}

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

/**
 * One impulse, remembered as *when* rather than as a running value — the same
 * primitive `drumkit.ts` uses, and for the same reason: the pose is recomputed
 * from `now - beat` every frame, so a seek or a dropped frame lands in the
 * right place instead of leaving something half-displaced.
 */
class Hit {
  private beat = -1e9;
  private force = 0;

  fire(now: number, force: number): void {
    this.beat = now;
    this.force = force < 0 ? 0 : force > 1 ? 1 : force;
  }

  wobble(now: number, tau: number, hz: number): number {
    const age = now - this.beat;
    if (age < 0 || age > tau * 6) return 0;
    return this.force * Math.exp(-age / tau) * Math.cos(age * TAU * hz);
  }
}

/**
 * How far a full-force stroke squashes the head's dome, as a fraction of its
 * height — and, as on the kit, **the one thing this number may not do is reach
 * 1**. At `scale.y = 0` the head's model matrix is singular, three.js hands the
 * shader a zero normal matrix, and the skin renders black or not at all for
 * every frame the oscillation is near the crossing. See `HEAD_DISH` in
 * `drumkit.ts`, where that was found.
 */
const HEAD_DISH = 0.8;

// ---------------------------------------------------------------------------
// The model
// ---------------------------------------------------------------------------

function disposeTree(root: Object3D): void {
  const geometries = new Set<{ dispose(): void }>();
  const materials = new Set<Material>();
  root.traverse((o) => {
    const mesh = o as Partial<Mesh>;
    if (mesh.geometry) geometries.add(mesh.geometry);
    const m = mesh.material;
    if (Array.isArray(m)) for (const one of m) materials.add(one);
    else if (m) materials.add(m);
  });
  for (const g of geometries) g.dispose();
  for (const m of materials) m.dispose();
  root.clear();
}

/**
 * A shallow dome, its rim at the local origin — the kit's head, one size down.
 *
 * **Walked rim-first, and it has to be.** `LatheGeometry` takes its normal from
 * the direction of travel along the profile, as `(dy, -dx)`, so a profile
 * walked apex-to-rim — which is the order the angle naturally comes out in —
 * has every normal pointing at the floor. See the note on `cymbalGeometry` in
 * `drumkit.ts`, where the same mistake made all three cymbals invisible: with a
 * `FrontSide` material, normals pointing down are back faces from every camera
 * we have. So the angle counts down, from the rim up to the apex.
 */
function headGeometry(radius: number, seg = 20): LatheGeometry {
  const phi = 0.13;
  const R = radius / Math.sin(phi);
  const points: Vector2[] = [];
  for (let i = 6; i >= 0; i--) {
    const a = (i / 6) * phi;
    points.push(new Vector2(R * Math.sin(a), R * Math.cos(a) - R * Math.cos(phi)));
  }
  return new LatheGeometry(points, seg);
}

/**
 * The goblet profile, as a lathe: a wide bowl under the head, a waist, and a
 * flared foot.
 *
 * It is the whole silhouette of the object and the only thing that tells an
 * audience this is not a floor tom that wandered off. Written as radius/height
 * pairs from the rim down, because that is the way the shape reads on the page
 * — and then **reversed before it is handed to the lathe**, because that is not
 * the way `LatheGeometry` wants it. Its normal is `(dy, -dx)` along the
 * direction of travel, so a wall walked downward has its normals pointing into
 * the drum, and the body renders as the inside of itself: see `headGeometry`
 * just above, and `cymbalGeometry` in `drumkit.ts` for where this was first
 * paid for.
 */
function bodyGeometry(radius: number, height: number): LatheGeometry {
  const bowl: Array<[number, number]> = [
    [1.00, 1.00], [1.00, 0.94], [0.90, 0.84], [0.72, 0.70],
    [0.52, 0.54], [0.40, 0.40], [0.38, 0.22], [0.46, 0.10],
    [0.62, 0.02], [0.62, 0.00],
  ];
  return new LatheGeometry(
    bowl.reverse().map(([r, y]) => new Vector2(r * radius, y * height)), 20,
  );
}

export const buildHandDrum: InstrumentBuilder = (opts) => {
  const { seed, finish } = opts;
  const rng = new Rng(`handdrum:${seed}`);
  const root = new Group();

  /**
   * How high the whole object stands, and therefore where every point on it is.
   *
   * The only thing in this file that reads the player. See `Seat`, and see
   * `InstrumentBuildOptions.posture` for why a model is allowed to be told.
   */
  const seat = seatFor(opts.posture);
  const L = layoutFor(seat);

  const shellMat = new MeshStandardMaterial({
    color: finish ?? ['#6b4a2f', '#7d5334', '#513828', '#8a6a3c'][rng.int(0, 3)]!,
    roughness: 0.62, metalness: 0.06,
  });
  const skinMat = new MeshStandardMaterial({ color: '#e6dcc6', roughness: 0.85, metalness: 0 });
  const hoopMat = new MeshStandardMaterial({ color: '#b9bec6', roughness: 0.42, metalness: 0.7 });
  const brassMat = new MeshStandardMaterial({ color: '#c9a227', roughness: 0.35, metalness: 0.85 });
  const woodMat = new MeshStandardMaterial({ color: '#8a6a3c', roughness: 0.8, metalness: 0 });
  const darkMat = new MeshStandardMaterial({ color: '#17171a', roughness: 0.7, metalness: 0.1 });

  // --- The drum ------------------------------------------------------------

  /**
   * The body hangs off the head rather than the other way round: the head is
   * the surface every gesture in the choreography is aimed at, so it is the
   * thing whose position is fixed and the shell is what has to follow it.
   */
  const drum = addTo(root, new Group());
  drum.position.copy(L.headAt);
  drum.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), HEAD_UP);

  /**
   * How long the body has to be for its foot to land on the boards.
   *
   * Not `L.headAt.y`, which is the answer for a drum standing straight up. This
   * one leans, so its foot ring meets the floor on one edge and the far edge
   * lifts — and a body cut to the head's height instead pushes the near edge
   * about half a centimetre through the deck. Derived from the same `HEAD_UP`
   * the tilt comes from, so leaning the drum further cannot sink it.
   */
  const lean = Math.acos(HEAD_UP.y);
  const bodyLength = (L.headAt.y - HEAD_R * 0.62 * Math.sin(lean)) / Math.cos(lean);

  const body = addTo(drum, new Mesh(bodyGeometry(HEAD_R, bodyLength), shellMat));
  body.position.y = -bodyLength;
  body.castShadow = true;

  const skin = addTo(drum, new Mesh(headGeometry(HEAD_R), skinMat));
  skin.receiveShadow = true;

  const hoop = addTo(drum, new Mesh(
    new CylinderGeometry(HEAD_R * 1.03, HEAD_R * 1.03, 0.020, 20, 1, true), hoopMat,
  ));
  hoop.position.y = -0.006;

  // The tuning lugs, which are what makes a bare cylinder read as a tensioned
  // skin. Small enough that six is plenty and instancing would not pay.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.4;
    const lug = addTo(drum, new Mesh(new CylinderGeometry(0.006, 0.006, 0.075, 6), hoopMat));
    lug.position.set(Math.cos(a) * HEAD_R * 0.99, -0.048, Math.sin(a) * HEAD_R * 0.99);
  }

  const skinHit = new Hit();

  // --- The trap table ------------------------------------------------------

  /**
   * A percussionist's table, and it carries exactly the pieces this part calls
   * for — see `InstrumentBuildOptions.aux`, and the kit's `carries`, which this
   * is the other half of.
   *
   * The auxiliary voices reach this player only when there is no kit on the
   * stage to claim them, so in a funk number the drummer keeps the tambourine
   * and there is nothing for this table to hold. Then it does not stand there:
   * a bare table beside a darbuka is stage furniture nobody put there on
   * purpose, and it reads as a prop somebody forgot to strike.
   */
  const carries = (voice: keyof typeof PIECE): boolean =>
    opts.aux === undefined || opts.aux.includes(voice);
  const wantsTable = (['tb', 'sh', 'perc', 'cb'] as const).some(carries);

  if (wantsTable) {
    const table = addTo(root, new Mesh(
      new CylinderGeometry(0.20, 0.20, TABLE_THICK, 16), darkMat,
    ));
    table.position.copy(L.tableAt);
    table.castShadow = true;
    table.receiveShadow = true;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + 0.6;
      const leg = addTo(root, new Mesh(new CylinderGeometry(0.010, 0.010, L.tableAt.y, 8), hoopMat));
      leg.position.set(
        L.tableAt.x + Math.cos(a) * 0.07, L.tableAt.y / 2, L.tableAt.z + Math.sin(a) * 0.07,
      );
    }
  }

  /**
   * Each piece is backed off its own point by half its height, so its struck
   * face lands exactly there and its base lands exactly on the board — the
   * arithmetic `drumkit.ts` calls `stand`, with `PIECE` supplying the one
   * number both ends of it need.
   */
  function place(piece: Object3D, voice: keyof typeof PIECE): number {
    const spec = L.points[voice]!;
    piece.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), spec.up.clone().normalize());
    piece.position.copy(spec.at).addScaledVector(spec.up.clone().normalize(), -PIECE[voice] / 2);
    piece.traverse((o) => { (o as Mesh).castShadow = true; });
    return piece.position.y;
  }

  /**
   * The riq: a shallow frame with a skin, and jingles hanging in the frame.
   *
   * **Two-sided, like the kit's tambourine and for the same reason.** A frame
   * drum is a hoop four centimetres deep with a skin over one end — a wall with
   * no thickness in a model — so under the default `FrontSide` the near half of
   * the frame and the underside of the head simply are not there, and what is
   * left reads as a broken ring. The jingles straddle the hoop rather than
   * sitting inside it, because on a real one they hang in slots cut through the
   * frame and it is the half standing proud that catches a light.
   */
  const riq = addTo(root, new Group());
  if (carries('tb')) {
    const riqR = 0.10;
    const frameMat = woodMat.clone();
    frameMat.side = DoubleSide;
    const headMat = skinMat.clone();
    headMat.side = DoubleSide;
    addTo(riq, new Mesh(new CylinderGeometry(riqR, riqR, PIECE.tb, 18, 1, true), frameMat));
    const riqSkin = addTo(riq, new Mesh(new CircleGeometry(riqR, 18), headMat));
    riqSkin.rotation.x = -Math.PI / 2;
    riqSkin.position.y = PIECE.tb / 2;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + 0.5;
      for (const side of [1, -1]) {
        const j = addTo(riq, new Mesh(new CylinderGeometry(0.019, 0.019, 0.002, 8), brassMat));
        j.position.set(
          Math.cos(a) * riqR - Math.sin(a) * side * 0.009, 0,
          Math.sin(a) * riqR + Math.cos(a) * side * 0.009,
        );
        j.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(-Math.sin(a), 0, Math.cos(a)));
      }
    }
  }

  const shaker = addTo(root, new Group());
  if (carries('sh')) {
    addTo(shaker, new Mesh(new CylinderGeometry(0.026, 0.030, PIECE.sh, 12), woodMat));
  }
  const block = addTo(root, new Group());
  if (carries('perc')) {
    addTo(block, new Mesh(new CylinderGeometry(0.028, 0.028, PIECE.perc, 10), woodMat));
  }
  const bell = addTo(root, new Group());
  if (carries('cb')) {
    addTo(bell, new Mesh(new CylinderGeometry(0.030, 0.042, PIECE.cb, 8), brassMat));
  }

  const aux: Record<'tb' | 'sh' | 'perc' | 'cb', { piece: Object3D; hit: Hit; base: number }> = {
    tb: { piece: riq, hit: new Hit(), base: place(riq, 'tb') },
    sh: { piece: shaker, hit: new Hit(), base: place(shaker, 'sh') },
    perc: { piece: block, hit: new Hit(), base: place(block, 'perc') },
    cb: { piece: bell, hit: new Hit(), base: place(bell, 'cb') },
  };

  // --- The interface -------------------------------------------------------

  function contact(spec: { at: Vector3; up: Vector3 }): Contact {
    return { position: spec.at.clone(), normal: spec.up.clone().normalize() };
  }

  const model: InstrumentModel = {
    archetype: 'handdrum',
    root,

    resolve(point: PlayPoint): Contact | undefined {
      switch (point.kind) {
        case 'drum': {
          // A piece the table was not given has no point on it, exactly as on
          // the kit: `LAYOUT` says where a riq lies, `carries` says whether
          // there is one, and a hand may only be sent to a point that has both.
          if (point.voice in PIECE && !carries(point.voice as keyof typeof PIECE)) {
            return undefined;
          }
          const spec = L.points[point.voice];
          return spec ? contact(spec) : undefined;
        }
        case 'rest':
          return contact(L.rest);
        default:
          // No pedals, and `ARCHETYPES.handdrum` says so before anything asks.
          return undefined;
      }
    },

    react(point: PlayPoint, force: number, now: number): void {
      if (point.kind !== 'drum') return;
      const f = force < 0 ? 0 : force > 1 ? 1 : force;
      const voice = point.voice;
      if (voice === 'lp' || voice === 'mp' || voice === 'hp') {
        // An edge stroke is a fingertip and a centre stroke is the whole palm,
        // so the skin gives far less to a *tek* than to a *dum* at the same
        // written velocity. That difference is most of what tells the two
        // apart from the back of a room.
        skinHit.fire(now, voice === 'lp' ? f : f * 0.45);
        return;
      }
      const a = aux[voice as keyof typeof aux];
      if (a) a.hit.fire(now, f);
    },

    update(now: number): void {
      skin.scale.y = 1 - skinHit.wobble(now, 0.20, 3.4) * HEAD_DISH;
      for (const id of ['tb', 'sh', 'perc', 'cb'] as const) {
        const a = aux[id];
        a.piece.position.y = a.base - a.hit.wobble(now, 0.30, 4) * 0.012;
      }
    },

    /**
     * Close in, and whichever way this player is sitting.
     *
     * `straddle` because the drum is between the knees, which is that posture's
     * whole reason for existing; `floor` where the tradition puts the player
     * cross-legged on a carpet with the drum in front of them. Both are close —
     * a kit's thirty-odd centimetres of clearance would have this player an
     * arm's length from their own skin — and the floor is six centimetres less
     * close, for a reason that is a measurement rather than a feeling.
     *
     * A `straddle` player's shins go *down* from the knees and take up no floor
     * in front of them, so the drum can stand where their feet are not. A
     * cross-legged player's shins are folded flat across the ground and their
     * shoes reach `0.12 × height` forward — 0.34 m on the tallest player casting
     * draws — which is exactly where the goblet's flared foot ring was landing.
     * At 0.40 the ring's near edge clears the longest toe by four centimetres,
     * and the hands are 0.56 m from the shoulder, which is under the 0.61 m this
     * archetype already reaches for its own trap table.
     */
    station: {
      offset: new Vector3(0, 0, opts.posture === 'floor' ? -0.40 : -0.34), facing: 0,
      posture: opts.posture === 'floor' ? 'floor' : 'straddle',
    },

    dispose(): void {
      disposeTree(root);
    },
  };

  return model;
};
