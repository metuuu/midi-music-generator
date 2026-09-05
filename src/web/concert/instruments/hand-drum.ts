/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The hand drum — bare hands, a tray of small things, and one to three skins.
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
 * **One archetype, three objects.** The file was built as a darbuka and stayed
 * one for every rack until latin and funk named `+congas`; it now builds the
 * goblet drum, a set of congas on a stand, or the mridangam's two-headed barrel,
 * from the rack the bank names. See `Shape`, where the argument is set out — it
 * is `SAMPLE_RACKS`' own, and it is that a darbuka's three strokes are three
 * places on one head while a conga's are three different drums.
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

import { HAND_DRUM_SHAPE_OF, type HandDrumShape } from '../../../concert/instruments.js';
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

/**
 * Which of the family is standing here, and why one archetype is three objects.
 *
 * `handdrum` was built as a darbuka and staged as one for every rack, which was
 * defensible only while no genre named a rack: an unlabelled hand drum is a drum
 * between somebody's knees and that is the commonest picture. It stopped being
 * defensible the moment latin and funk named `+congas`, and the reason is in
 * `SAMPLE_RACKS` rather than in anybody's taste — the darbuka entry describes
 * `lp`/`mp`/`hp` as *a palm in the middle of the head, a ringing finger stroke
 * at the edge, and a pinched crack*, three places on one skin, while the conga
 * entry describes *the tumba, the conga and the quinto, all on the open tone*,
 * three drums with measured fundamentals 138, 164 and 214 Hz. Those are not one
 * object at two sizes. The hands travel a hand's breadth in the first case and
 * most of a metre in the second, and a choreography aimed at one played on the
 * other is the same class of error as the point in the air beside the floor tom.
 *
 *  - `goblet` — the darbuka. One head, three places on it. The default, and
 *    what an unnamed hand drum has always been.
 *  - `pair` — the congas. Three drums in a row on a stand, low at the player's
 *    left, and the only member of the family the player stands up at.
 *  - `barrel` — the mridangam. One drum lying across the shins with a head at
 *    each end: the left is the bass `thom`, the right carries `na` and `ta`.
 *
 * Named for what the silhouette is rather than for the rack, because the rack is
 * a sample library and this is a shape. A tabla would be two `barrel`s standing
 * upright, and a djembe a `goblet` one size up; neither is in the library yet and
 * both would map here rather than adding a fourth case. The rack-to-shape table
 * is `HAND_DRUM_SHAPE_OF` in `concert/instruments.ts`, because the choreographer
 * reads it too: which hand a stroke gets depends on which drum it is on.
 */
type Shape = HandDrumShape;

/** The rack's silhouette; a rack nobody has drawn is the goblet. */
const shapeFor = (rack: string | undefined): Shape =>
  (rack ? HAND_DRUM_SHAPE_OF[rack] ?? 'goblet' : 'goblet');

/** Head radius. A goblet drum is narrower than this; a djembe is wider. */
const HEAD_R = 0.145;

/**
 * The three conga heads, as a fraction of `HEAD_R` and a step sideways in
 * metres.
 *
 * Real shells, because the ratios are what makes three drums read as three
 * drums: a tumbadora is 12.5 inches across the head, a conga 11.75 and a quinto
 * 11, which against the 11.75 this model calls 1.0 is 1.06 and 0.94. They stand
 * about 32 cm apart on a double stand, which is a shade over one head's width
 * and is why a player's hands can cross two of them without the elbow moving.
 *
 * Low at `+x` and high at `-x`: the player sits at `-z` facing the audience, so
 * `-x` is their right, and the quinto goes under the strong hand exactly as the
 * trap table does. `SAMPLE_RACKS` calls the quinto the small drum standing in
 * for a slap, which is the hand that plays it.
 */
const CONGA: Record<'lp' | 'mp' | 'hp', { r: number; x: number }> = {
  lp: { r: 1.06, x: 0.32 },
  mp: { r: 1.00, x: 0.00 },
  hp: { r: 0.94, x: -0.30 },
};

/**
 * The mridangam's two heads, along the barrel.
 *
 * A concert instrument is about 60 cm end to end, so each head sits some 30 cm
 * from the middle — which is the whole reason this shape cannot be faked with a
 * goblet: the left hand and the right hand are at opposite ends of an object
 * lying across the player, not a palm's width apart on one skin. The right head
 * is the smaller of the two and carries both `na` and `ta`, the ringing open
 * stroke and the rim crack, and those two *are* a step across one head.
 */
const MRIDANGAM = {
  /** Half the shell's length: how far each head is from the middle. */
  reach: 0.29,
  /** The valanthalai, at the player's right — which is `-x`. See `HEAD_UP`. */
  rightR: 0.86,
  /** The thoppi, at their left, and the one with the bass in it. */
  leftR: 1.02,
  /** How far in from the rim the `ta` crack lands, as a fraction of the head. */
  rim: 0.68,
};

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
 * drum runs from the head to the boards — see `toFloor` — so lowering the
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

/**
 * How far off the deck a conga's shell stops and its stand begins.
 *
 * The number that keeps three drums at a playable height without three shells a
 * metre long. A real double stand holds the drums about 20 cm up so a seated
 * player's hands fall on the heads; the shells above it are then the 75 cm they
 * actually are rather than being stretched to the floor.
 */
const CONGA_STAND = 0.20;

/**
 * The trap table: how wide the board is, how far downstage, and how thick.
 *
 * A percussionist's table — the small round stand at the player's right holding
 * the pieces their hands leave the skin for: the riq, the shaker, the woodblock
 * and the cowbell. It is at `-x` because that is the player's right, under the
 * hand that reaches for a tambourine while the other stays on the drum, and it
 * is only there when the part actually calls for one of the four. See
 * `wantsTable`, and `PIECE`, which is what stands on it.
 *
 * **Where it stands is `tableXFor`, and it used to be a constant.** That
 * constant was -0.40, which is a darbuka's 0.145 m head plus `TABLE_CLEAR` plus
 * `TABLE_R` — the arithmetic below, done once by hand at the moment this file
 * built one shape, and then left alone while it grew two more. Congas reach
 * 0.44 m to that side and the mridangam's shell 0.29, so both stood *through*
 * the board: from most angles the drum was sitting on the table.
 */
const TABLE_R = 0.20;
const TABLE_Z = 0.02;
const TABLE_THICK = 0.018;
/** Knuckle room between the outermost drum and the board's near edge. */
const TABLE_CLEAR = 0.055;

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
 * Which skins each member of the family has, and which strokes are on each.
 *
 * The three cases are three readings of `SAMPLE_RACKS`, and the mapping is that
 * table's own sentences rather than an invention here:
 *
 *  - **goblet** — *a palm in the middle of the head, a ringing finger stroke at
 *    the edge, and a pinched crack*. One skin, three places on it, and the whole
 *    ladder fits inside a hand's breadth.
 *  - **pair** — *the tumba, the conga and the quinto, all on the open tone, all
 *    one articulation so the three sound like one pair of hands*. Three skins,
 *    one stroke each, low at the player's left.
 *  - **barrel** — *one drum, two heads*. `thom` is the left-hand bass head;
 *    `na` and `ta` share the right, which is the one case where a single skin
 *    carries two of the three and they really are a step apart on it.
 */
function headsFor(seat: Seat, shape: Shape): Head[] {
  const y = seat.head;
  if (shape === 'pair') {
    /**
     * Three drums in a row, and every one of them tilted toward the player for
     * the same reason the darbuka is: it is what stops each prep being a
     * vertical lift, and a conga on a stand really does lean back a few degrees.
     */
    return (['lp', 'mp', 'hp'] as const).map((voice) => ({
      at: new Vector3(CONGA[voice].x, y, 0),
      up: HEAD_UP.clone(),
      r: HEAD_R * CONGA[voice].r,
      // One shell each. Unlike the mridangam's, these are three objects.
      shell: 'conga' as const,
      of: [voice as DrumVoice],
    }));
  }
  if (shape === 'barrel') {
    /**
     * The right head first, because it is the one the hands live on — see
     * `Layout.rest` — and because the shell is built by whichever head comes
     * first and there is only one shell between the two.
     *
     * **Each head is the end of the barrel and faces straight out along it.**
     * These read `(∓0.62, 0.78, -0.09)` — 38° up off the axis — while the shell
     * was laid flat along `x`, and the two are the same axis written twice. So
     * the skins stood at 38° to the ends they are stretched over, one rim
     * lifting off the shell and the opposite one sinking into it, on the single
     * drum in this family whose heads an audience sees edge-on.
     *
     * `HEAD_UP`'s lean is a true thing about a drum held between the knees and
     * it is not transferable: a mridangam's heads are the two ends of a barrel
     * lying across the shins, so they point left and right and have no freedom
     * of their own. The tilt that reads as a mridangam is the barrel's, and the
     * barrel does not have one — it lies flat.
     */
    const axis = new Vector3(1, 0, 0);
    return [
      {
        at: new Vector3(-MRIDANGAM.reach, y, 0),
        up: axis.clone().negate(),
        r: HEAD_R * MRIDANGAM.rightR,
        shell: 'barrel',
        of: ['mp', 'hp'],
      },
      {
        at: new Vector3(MRIDANGAM.reach, y, 0),
        up: axis.clone(),
        r: HEAD_R * MRIDANGAM.leftR,
        shell: 'none',
        of: ['lp'],
      },
    ];
  }
  return [{
    at: new Vector3(0, y, 0), up: HEAD_UP.clone(), r: HEAD_R, shell: 'goblet',
    of: ['lp', 'mp', 'hp'],
  }];
}

/**
 * Where one stroke lands on the skin that carries it.
 *
 * Derived from the head rather than written per shape, so moving a drum moves
 * its strokes — the same rule the file already holds `HEAD_ALONG` to. A head
 * carrying one voice is struck at the near edge, which is where an open tone is
 * played and where the hand already is; a head carrying the whole ladder spreads
 * it across the skin, centre for the low one and the two rims for the others.
 */
function strokeOn(head: Head, voice: DrumVoice): Spot {
  const along = new Vector3(0, 0, 1)
    .addScaledVector(head.up, -head.up.z).normalize();
  const edge = head.r * 0.72;
  const at = head.at.clone();
  if (head.of.length === 1) {
    // The open tone: at the rim nearest the player, not in the middle of the
    // head. A palm in the centre of a conga is a muted bass tone and is not what
    // `SAMPLE_RACKS` measured.
    at.addScaledVector(along, -head.r * 0.55);
  } else if (head.of.length === 2) {
    // The mridangam's right head. `na` rings in the middle, `ta` cracks on the
    // rim — the one place in this file where two of the three strokes are a step
    // across one skin rather than two objects.
    if (voice === 'hp') at.addScaledVector(along, -head.r * MRIDANGAM.rim);
  } else {
    if (voice === 'mp') at.addScaledVector(along, -edge);
    if (voice === 'hp') at.addScaledVector(along, edge);
  }
  return { at, up: head.up.clone() };
}

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
  /**
   * Every skin standing here, in the order the shapes below build them.
   *
   * One entry for a darbuka, three for a set of congas, two for the mridangam's
   * pair of ends. `Head.of` is what closes the loop that the old single-skin
   * model got for free: a stroke has to squash *the head it landed on*, and with
   * three drums in a row "the head" is no longer a question with one answer.
   */
  heads: Head[];
  tableAt: Vector3;
  tableTop: number;
  points: Partial<Record<DrumVoice, Spot>>;
  /** Hands at rest, hovering just off the skin. */
  rest: Spot;
}

/** One skin: where it is, which way it faces, how big it is, what hangs off it. */
interface Head {
  at: Vector3;
  up: Vector3;
  r: number;
  /**
   * The shell under it. `goblet` is a lathed bowl and waist reaching the boards;
   * `conga` a tapered barrel on a stand; `barrel` is the mridangam's shell,
   * which is one object between two heads and is therefore built once, by the
   * *first* of its heads, with the second passing `none`.
   */
  shell: 'goblet' | 'conga' | 'barrel' | 'none';
  /** Which voices land on this skin, so a stroke knows what to move. */
  of: DrumVoice[];
}

/**
 * How far the board stands from the player's centre line, given what is beside
 * it.
 *
 * The drums' own reach rather than a number per shape, for the reason
 * `HEAD_ALONG` is derived from `HEAD_UP`: a table placed by a constant is a
 * constant that is right for whichever drum was standing there when it was
 * measured, and this family gained two more.
 *
 * A head is a disc with a normal, so how much of its radius counts *along `x`*
 * is the radius foreshortened by how far that head is turned to face along `x`
 * — all of it for a darbuka or a conga, which face the ceiling, and none of it
 * for the mridangam's, which face along the barrel and present their edge. The
 * shells swell a centimetre past that at the widest and the clearance absorbs
 * it; a darbuka comes out at exactly the -0.40 this used to be written as.
 */
function tableXFor(heads: readonly Head[]): number {
  let reach = 0;
  for (const h of heads) {
    reach = Math.min(reach, h.at.x - h.r * Math.sqrt(Math.max(0, 1 - h.up.x * h.up.x)));
  }
  return reach - TABLE_CLEAR - TABLE_R;
}

function layoutFor(seat: Seat, shape: Shape): Layout {
  const heads = headsFor(seat, shape);
  const tableAt = new Vector3(tableXFor(heads), seat.table, TABLE_Z);
  const tableTop = tableAt.y + TABLE_THICK / 2;
  const flat = () => new Vector3(0, 1, 0);

  /** Every stroke on every skin, gathered from the heads that carry them. */
  const skins: Partial<Record<DrumVoice, Spot>> = {};
  for (const head of heads) for (const voice of head.of) skins[voice] = strokeOn(head, voice);

  /**
   * Where the hands idle, which is over the drum the player is most often on.
   *
   * The middle head: the darbuka's only one, the conga proper between its two
   * neighbours, and — for the mridangam — the right-hand head, which is the one
   * carrying two of the three strokes. Backed off the skin so the pose reads as
   * hovering rather than resting a palm on a live head.
   */
  const home = heads[shape === 'barrel' ? 0 : Math.floor(heads.length / 2)]!;

  return {
    heads,
    tableAt,
    tableTop,
    points: {
      ...skins,

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
      at: home.at.clone().addScaledVector(home.up, 0.11).addScaledVector(HEAD_ALONG, -0.04),
      up: home.up.clone(),
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

/**
 * The conga profile: a long shell that swells below the head and draws in to a
 * narrow foot.
 *
 * The same rim-down notation and the same reversal as `bodyGeometry`, because
 * the lathe wants the same thing of both. What differs is the shape and it is
 * the shape that carries the identity: a conga's widest point is a hand's
 * breadth *below* the head rather than at it, which is the belly you see from
 * the front and the thing that separates the silhouette from a floor tom's
 * straight cylinder.
 */
function congaGeometry(radius: number, height: number): LatheGeometry {
  const shell: Array<[number, number]> = [
    [1.00, 1.00], [1.06, 0.90], [1.07, 0.78], [1.04, 0.62],
    [0.96, 0.44], [0.86, 0.26], [0.78, 0.10], [0.76, 0.02], [0.76, 0.00],
  ];
  return new LatheGeometry(
    shell.reverse().map(([r, y]) => new Vector2(r * radius, y * height)), 20,
  );
}

/**
 * The mridangam's shell: a barrel with a head at each end and a belly in the
 * middle, lying on its side.
 *
 * Lathed along its own axis like everything else here and then laid down by the
 * caller, rather than modelled horizontally — the lathe only knows how to spin
 * a profile around `y`, and fighting that would mean writing the profile twice.
 * The two ends are deliberately different radii: `SAMPLE_RACKS` has the right
 * head carrying a ringing `na` and a cracking `ta` and the left a bass `thom`,
 * and the reason those sound the way they do is that the left head is the wider
 * of the two.
 *
 * **Written from `y = 0` upward, and both halves of that are load-bearing.**
 * This profile was the one of the three written the way the shape reads on the
 * page — the far end first, counting down — and then handed to the lathe
 * unreversed, which cost it twice over:
 *
 *  - Every normal pointed *into* the shell, by `(dy, -dx)` along a descending
 *    walk. Under `FrontSide` that is the barrel rendered as the inside of
 *    itself, which is the fault `bodyGeometry` and `congaGeometry` both carry a
 *    `.reverse()` against and the note on `headGeometry` above describes. It
 *    survived because the mridangam is the one member of this family that no
 *    exhibit on the model bench could be made to draw.
 *  - And the ends were swapped. The caller stands this at the **right** head and
 *    lays local `+y` toward the far one, so `y = 0` is the right end — while the
 *    profile put `right` at `y = 1`. The shell met a 0.125 m skin with a 0.148 m
 *    mouth at one end and the reverse at the other, 2.3 cm proud of its own hoop.
 *
 * Both are the same mistake about which way the profile runs, so the fix is the
 * one change: `y` now counts up from the head that builds it.
 */
function barrelGeometry(left: number, right: number, length: number): LatheGeometry {
  const belly = Math.max(left, right) * 1.16;
  const shell: Array<[number, number]> = [
    [right, 0.00], [right * 1.04, 0.06], [belly, 0.34],
    [belly, 0.60], [left * 1.04, 0.93], [left, 1.00],
  ];
  return new LatheGeometry(
    shell.map(([r, y]) => new Vector2(r, y * length)), 20,
  );
}

/**
 * The cradle a conga stands in, drawn in the root's frame.
 *
 * Three legs and a ring, and it is deliberately *not* parented to the drum: a
 * stand rests on the boards and the drum rests in the stand, so a leg that
 * inherited the shell's lean would splay by that lean and stand on one toe. The
 * ring goes where the shell's foot ends up, which is derived from the same
 * length the shell was built with rather than measured again.
 */
function standUnder(
  root: Group, head: Head, shellLength: number, lean: number, mat: MeshStandardMaterial,
): void {
  const foot = head.at.clone().addScaledVector(head.up, -shellLength);
  const ring = addTo(root, new Mesh(
    new CylinderGeometry(head.r * 0.80, head.r * 0.80, 0.014, 14, 1, true), mat,
  ));
  ring.position.copy(foot);
  ring.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), head.up);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.5;
    const leg = addTo(root, new Mesh(
      new CylinderGeometry(0.009, 0.009, foot.y, 8), mat,
    ));
    // Splayed a little, and the splay is the stand's rather than the drum's —
    // hence `foot` for the top and a plain vertical leg under it.
    leg.position.set(
      foot.x + Math.cos(a) * head.r * 0.62,
      foot.y / 2,
      foot.z + Math.sin(a) * head.r * 0.62,
    );
    leg.rotation.z = Math.sin(a) * 0.05 - lean * 0.2;
  }
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
  /**
   * Which of the family this is, and therefore what gets built.
   *
   * The second thing in this file that reads something outside the drum, and it
   * is a fact about the object rather than about the player — see
   * `InstrumentBuildOptions.rack`, and `Shape` for why one archetype has to be
   * three silhouettes.
   */
  const shape = shapeFor(opts.rack);
  const L = layoutFor(seat, shape);

  const shellMat = new MeshStandardMaterial({
    color: finish ?? ['#6b4a2f', '#7d5334', '#513828', '#8a6a3c'][rng.int(0, 3)]!,
    roughness: 0.62, metalness: 0.06,
  });
  const skinMat = new MeshStandardMaterial({ color: '#e6dcc6', roughness: 0.85, metalness: 0 });
  const hoopMat = new MeshStandardMaterial({ color: '#b9bec6', roughness: 0.42, metalness: 0.7 });
  const brassMat = new MeshStandardMaterial({ color: '#c9a227', roughness: 0.35, metalness: 0.85 });
  const woodMat = new MeshStandardMaterial({ color: '#8a6a3c', roughness: 0.8, metalness: 0 });
  const darkMat = new MeshStandardMaterial({ color: '#17171a', roughness: 0.7, metalness: 0.1 });

  // --- The drums -----------------------------------------------------------

  /**
   * One of these per skin, and everything about a drum hangs off its head.
   *
   * The head is the surface every gesture in the choreography is aimed at, so it
   * is the thing whose position is fixed and the shell is what has to follow —
   * which is what the single-drum version of this file already said, and is why
   * generalising it to three was mostly a matter of putting the same block in a
   * loop. Each group is *oriented by its own head's normal*, so the squash below
   * is a scale along local `y` whatever direction that head actually faces: the
   * mridangam's two heads face outward along `±x` and take exactly the same code
   * as a darbuka's, which faces the ceiling.
   */
  const skins: { mesh: Mesh; hit: Hit; of: DrumVoice[] }[] = [];

  for (const head of L.heads) {
    const drum = addTo(root, new Group());
    drum.position.copy(head.at);
    drum.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), head.up);

    /**
     * How long a standing shell has to be for its foot to land on the boards.
     *
     * Not `head.at.y`, which is the answer for a drum standing straight up.
     * These lean, so the foot ring meets the floor on one edge and the far edge
     * lifts — and a body cut to the head's height instead pushes the near edge
     * about half a centimetre through the deck. Derived from the head's own
     * normal, so leaning a drum further cannot sink it.
     */
    const lean = Math.acos(head.up.y);
    const toFloor = (rise: number): number =>
      (head.at.y - rise - head.r * 0.62 * Math.sin(lean)) / Math.cos(lean);

    if (head.shell === 'goblet') {
      const length = toFloor(0);
      const body = addTo(drum, new Mesh(bodyGeometry(head.r, length), shellMat));
      body.position.y = -length;
      body.castShadow = true;
    } else if (head.shell === 'conga') {
      /**
       * A conga stands on a stand, not on the deck — which is not decoration:
       * a shell long enough to reach the boards would put the head at a
       * seated player's chin. `CONGA_STAND` is where the shell stops and the
       * legs take over.
       */
      const length = toFloor(CONGA_STAND);
      const body = addTo(drum, new Mesh(congaGeometry(head.r, length), shellMat));
      body.position.y = -length;
      body.castShadow = true;
      standUnder(root, head, length, lean, hoopMat);
    } else if (head.shell === 'barrel') {
      /**
       * The one shell serving two heads, so it is built by the first of them
       * and laid along `x` rather than dropped down `-y`.
       *
       * Built in the *root's* frame instead of this head's, because it does not
       * belong to this head — it spans both, and hanging it off one of them
       * would tilt it by that head's normal and pull the other end out of its
       * own skin.
       */
      const other = L.heads.find((h) => h !== head)!;
      const barrel = addTo(root, new Mesh(
        barrelGeometry(other.r, head.r, MRIDANGAM.reach * 2), shellMat,
      ));
      barrel.position.copy(head.at);
      /**
       * Lathed up `y` and laid down along the line **between the two heads** —
       * read off them rather than written as `+x` a second time. Two places
       * naming one axis is how the skins came to stand at 38° to the shell they
       * cap; there is one axis now and both ends of the drum read it.
       */
      barrel.quaternion.setFromUnitVectors(
        new Vector3(0, 1, 0), new Vector3().subVectors(other.at, head.at).normalize(),
      );
      barrel.castShadow = true;
      /**
       * **And it lies on the player, so nothing is drawn under it.**
       *
       * There was a small dark cylinder here, on the argument that "a barrel
       * drawn resting on nothing rolls in the eye even when it is still". The
       * argument is sound and the object was not: it stood at `head.at.y -
       * head.r * 0.92`, which was the underside of a shell that had no belly
       * when the line was written. Measured against the shell this file
       * actually builds, it spanned 0.180–0.230 m while the barrel's underside
       * is at 0.148 — wholly *inside* the drum, never once drawn, and 18 cm
       * clear of the carpet it was standing in for.
       *
       * Nothing replaces it, because the thing it was standing in for is the
       * player. `MRIDANGAM` puts the shell across the shins at either seat —
       * 0.148 m off the boards cross-legged, 0.548 on a chair — and both of
       * those are a lap. The two drums either side of this branch reach the
       * boards, by their own foot and by a stand; this one does not, and that
       * is what a drum played in the lap is.
       */
    }

    const skin = addTo(drum, new Mesh(headGeometry(head.r), skinMat));
    skin.receiveShadow = true;
    skins.push({ mesh: skin, hit: new Hit(), of: head.of });

    const hoop = addTo(drum, new Mesh(
      new CylinderGeometry(head.r * 1.03, head.r * 1.03, 0.020, 20, 1, true), hoopMat,
    ));
    hoop.position.y = -0.006;

    // The tuning lugs, which are what makes a bare cylinder read as a tensioned
    // skin. Small enough that six is plenty and instancing would not pay.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.4;
      const lug = addTo(drum, new Mesh(new CylinderGeometry(0.006, 0.006, 0.075, 6), hoopMat));
      lug.position.set(Math.cos(a) * head.r * 0.99, -0.048, Math.sin(a) * head.r * 0.99);
    }
  }

  /** Which skin a voice moves, resolved once rather than searched per stroke. */
  const skinOf = new Map<DrumVoice, typeof skins[number]>();
  for (const s of skins) for (const v of s.of) skinOf.set(v, s);

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
      new CylinderGeometry(TABLE_R, TABLE_R, TABLE_THICK, 16), darkMat,
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
      const struck = skinOf.get(voice);
      if (struck) {
        /**
         * An edge stroke is a fingertip and a centre stroke is the whole palm,
         * so the skin gives far less to a *tek* than to a *dum* at the same
         * written velocity. That difference is most of what tells the two apart
         * from the back of a room.
         *
         * Asked of the *stroke's place on its own head* rather than of the
         * voice, which is the distinction three drums forced. `hp` is a
         * fingertip on a darbuka's rim and a full open palm on a quinto — the
         * same name, two hands — so the softening belongs to a stroke that is
         * sharing a skin with a lower one, not to the letter it is written as.
         */
        const centre = struck.of[0] === voice;
        struck.hit.fire(now, centre ? f : f * 0.45);
        return;
      }
      const a = aux[voice as keyof typeof aux];
      if (a) a.hit.fire(now, f);
    },

    update(now: number): void {
      for (const s of skins) s.mesh.scale.y = 1 - s.hit.wobble(now, 0.20, 3.4) * HEAD_DISH;
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
     *
     * **And a conga player needs ten centimetres more of it.** Three drums on a
     * stand are an object the player sits *behind* rather than between, so the
     * shells need the room the knees were using — far enough back that the
     * middle drum's belly, the widest point of the widest shell at
     * `HEAD_R × 1.07`, is clear of a knee. What sets the number is the reach
     * rather than the shell: the quinto is 0.30 m across and 0.44 m away on the
     * diagonal, which is inside the 0.61 m this archetype already asks of its
     * own trap table, and is why three drums do not need a wider stance.
     *
     * The **posture** stays the archetype's for all three, and that is a
     * deliberate refusal rather than an oversight. A conga player sits rather
     * than straddles, and this model is not the thing that gets to say so:
     * nothing reads `InstrumentModel.station.posture`, the body is posed from
     * `Performer.station.posture`, and that comes from `postureFor` in
     * `cast.ts` — which reads `ArchetypeSpec` and, by the header of
     * `concert/instruments.ts`, may not know geometry. Answering `sit` here
     * would have been a model quietly contradicting the cast about a player it
     * does not pose. Making it true means teaching `concert/` which racks sit,
     * which is a table of shapes in a directory that is not allowed one.
     */
    station: {
      offset: new Vector3(
        0, 0, shape === 'pair' ? -0.44 : opts.posture === 'floor' ? -0.40 : -0.34,
      ),
      facing: 0,
      posture: opts.posture === 'floor' ? 'floor' : 'straddle',
    },

    dispose(): void {
      disposeTree(root);
    },
  };

  return model;
};
