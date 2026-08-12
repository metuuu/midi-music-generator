/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Shared workshop for the stage builders — materials, chunky geometry, colour
 * arithmetic, and the one thing that actually matters for a scene this size:
 * somewhere to put resources so `dispose()` can find them again.
 *
 * Two rules run through all of it.
 *
 * **Nothing is global.** The caches live on a `Kit` owned by one rig, not in
 * module scope. A module-level material cache means striking one number
 * disposes the materials another rig is still drawing with, and that bug is
 * invisible until the second concert.
 *
 * **Colour comes from the venue.** Every shade here is derived from a
 * `Venue.palette` entry by lightening, darkening or nudging the hue. There is
 * no colour constant in this directory that is not either black, white, or a
 * function of the palette — a stage that hardcodes its look cannot be dressed
 * by the IR, and dressing it from the IR is the entire point of `venue.ts`.
 */

import {
  BufferAttribute, BufferGeometry, Color, DoubleSide, Material, MeshBasicMaterial,
  MeshStandardMaterial, Vector3,
  type Side,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

import type { Rng } from '../../core/rng.js';
// Type-only, and it has to be: `stage-audience.ts` imports this file for its
// materials, so anything but `import type` here is a runtime cycle.
import type { CrowdExtent } from './stage-audience.js';

/**
 * How much the stage is allowed to cost.
 *
 * The audience is the only thing that moves with it in bulk; everything else
 * is a handful of triangles either way. `low` is the integrated-graphics floor
 * and still has a crowd in it, because a stage with no crowd is a rehearsal.
 */
export type Quality = 'low' | 'medium' | 'high';

/**
 * The dimensions everything else on the app side wants to know about, worked
 * out once from `Venue` and handed round.
 *
 * All of it is in the coordinate system `concert/types.ts` fixes: metres,
 * origin at stage centre **on the boards**, `+z` downstage toward the
 * audience. So `lipZ` is positive, `backZ` is negative, and `houseY` is
 * negative because the house floor is below the stage, not on it.
 */
export interface StageMetrics {
  /** `Venue.width` and `Venue.depth`, unmodified. */
  width: number;
  depth: number;
  /** z of the downstage edge of the boards. */
  lipZ: number;
  /** z of the backdrop. */
  backZ: number;
  /** y of the house floor. Negative — the boards are raised above it. */
  houseY: number;
  /**
   * **The aperture** — clear width and height of the gap the audience sees the
   * band through, above the boards.
   *
   * This meant "the proscenium opening" for as long as every room had a
   * proscenium. It does not any more, and the definition had to widen rather
   * than the field split, because every one of the dozen call sites that hangs
   * something off it in `stage-props.ts` and `lights.ts` wants the same thing
   * under either reading: bunting spans it, the cyclorama glow fills it, a
   * lantern hangs inside it. In a theatre it is the arch; in a courtyard it is
   * the clear span between the walls; in a barn it is the gable. See
   * `RoomShape` in `rooms/types.ts`, which owns both numbers and states the one
   * rule — never narrower than the playing area.
   */
  openingWidth: number;
  openingHeight: number;
  /** z of the curtain line, just upstage of the arch. */
  curtainZ: number;
  /** y of the fly bar. */
  flyY: number;
  /** How far downstage the house extends. */
  houseDepth: number;
  /** How wide the house is; wider than the stage. */
  houseWidth: number;
  /**
   * y of the lowest thing hanging over the house, or `Infinity` under an open
   * sky. The camera stands underneath it — see `camera.ts`.
   */
  headroom: number;
  /**
   * y of the lowest thing over the *house* specifically, or `Infinity`.
   *
   * The other half of `headroom`, and read through `houseLid()` rather than
   * directly. See that function for what the two are for and why this had to
   * become a published number rather than a derived one.
   */
  houseLid: number;
  /**
   * y of the surface a hanger over the *boards* is shackled to, or `Infinity`.
   *
   * The third lid, and it is not a clearance plane — see `RoomShape.rigLid`,
   * which owns the number and argues it at length. `headroom` and `houseLid`
   * both answer "what is in my way"; this answers "what does a drop end on",
   * and in a room whose roof is sloped, coffered or framed those are different
   * heights because the lowest thing is a member and the surface is behind it.
   * Forwarded here because `stage-props.ts` is where the drops are, and a prop
   * cannot see a `RoomShape`.
   */
  rigLid: number;
  /**
   * How tall the thing behind the band is, measured from the house floor.
   *
   * A full-height cloth indoors; a low wall on an open-air stage, where the
   * whole point is that you can see over it. `lights.ts` needs it because a
   * cyclorama glow is a glow *on* something — sized from the opening instead,
   * it hung three metres of lit rectangle in the night sky above a tanssilava's
   * back wall, which is the brightest thing in the frame and attached to
   * nothing.
   */
  backdropHeight: number;
  /**
   * x of the inner face of the side wall, or `Infinity` where there is none.
   *
   * Read it before mounting anything to the side of the room: `houseWidth / 2`
   * is where the *house floor* stops and the wall stands somewhere outboard of
   * that, by an amount only the room knows. See `RoomShape.wallX`.
   */
  wallX: number;
  /**
   * The volume the audience fills, for anything solved from framing rather
   * than from the room. See `crowdExtent` in `stage-audience.ts`.
   */
  crowd: CrowdExtent;
}

/**
 * How far the boards sit above the house floor, in a room that has not said
 * otherwise.
 *
 * `Venue` does not carry a stage height and it does not need to: it is not a
 * musical decision and nothing else in the show depends on it. It is very much
 * a decision about what kind of *building* this is, though, so it is a default
 * here rather than a constant — see `RoomShape.rise`, and `CELLAR_RISE` in
 * `rooms/proscenium.ts` for the room that spends half of it on headroom.
 *
 * Fixed in one place so the audience, the apron and the house floor agree.
 * 0.9 m is a proscenium house, which puts the band above a standing crowd.
 */
export const STAGE_RISE = 0.9;

/**
 * How far above the house floor a low ceiling hangs.
 *
 * Owned twice, like the drum riser: `stage-props.ts` draws the lid and
 * `stage.ts` publishes it as `StageMetrics.headroom` for the camera to keep
 * under. If those two ever disagree the symptom is the one this constant was
 * written after — a camera above the ceiling of the room it is filming.
 *
 * It was 2.9 m, which is an honest cellar and half a metre too low for anything
 * to be shot in. `camera.ts` starts its wide shot at 2.3 m and lifts with
 * distance to 3.6 m, so **every** wide shot in the jazz room was taken from
 * above the lid; and because the plane was single-sided it did not even
 * occlude, it simply stopped existing overhead and left its own leading edge
 * and its two pipes drawn as a hard horizontal band across the middle of the
 * crowd. The complaint was that the crowd had a plane through it. The cause was
 * that the room had a ceiling the camera could not fit under.
 *
 * 3.3 m was where both could be right, and the sentence written here to justify
 * it was the bug: *the room visibly cannot contain its own stage opening*, said
 * approvingly, as if a lid a metre and a half below the top of the arch were a
 * sense of scale rather than an impossibility. It is an impossibility. A lid
 * that stops at the lip and an opening that carries on up past it is not a low
 * room, it is a shelf ending in mid-air over a void, and no amount of colour or
 * texture on the shelf fixes what is wrong above it. That is what
 * `STAGE_SOFFIT` is for, and this constant now only has to be the *house* half
 * of a ceiling that covers the whole room.
 *
 * 3.6 m, and it can afford to go up because it is no longer the only thing
 * holding the room down — the soffit over the stage is what says cellar now, at
 * the place where the eye has the arch to compare it against. Over the house,
 * where there is nothing to compare it to, height only buys the camera room:
 * the lens gets 2.25 m once `LENS_GAP` and the soffit have had their share,
 * against 1.8 m before, in a house whose floor also came up half a metre.
 */
export const LOW_CEILING = 3.6;

/**
 * How far above the *boards* the ceiling comes down over the stage.
 *
 * The other half of the lid, and the half that makes the cellar a cellar. Rooms
 * like this have a downstand at the proscenium line — a beam, a duct run, the
 * underside of the stairs to the street — and the stage is tucked under it. So
 * the ceiling steps: `LOW_CEILING` over the house, this over the boards, and a
 * fascia at the lip joining the two. `stage-props.ts` draws all three;
 * `stage.ts` publishes the lower of them as `headroom`, because a camera that
 * clears the house lid and not the soffit is back to filming through a ceiling.
 *
 * 2.85 m sets everything else in the room. `HEAD_BAND.hi` is 2.4 m, so it
 * leaves the tallest thing the band can be 0.45 m of air — tight, and meant to
 * be: a cellar stage where the trumpet player has room to spare overhead is a
 * theatre. That clearance is also the whole reason the boards came down to
 * `CELLAR_RISE`; at the old 0.9 m rise there was no height here to give.
 *
 * It hides the top of the arch, the fly bar and the upper backdrop, and that is
 * the point rather than a cost. Those are what a cellar does not have, and they
 * were only ever visible because nothing was in front of them.
 */
export const STAGE_SOFFIT = 2.85;

/**
 * The plaster over the *house*, or `Infinity` where there is none.
 *
 * `headroom` cannot answer this any more. It publishes the lower of the two
 * lids so the camera gets the worst case, which is right for a lens and wrong
 * for everything hung in the room: dressing solved against it hangs at the
 * height of a ceiling that is somewhere else, and a chandelier 0.35 m below the
 * plaster with a 0.08 m stem is the floating-lamp bug this file has already had
 * once. Ask for the surface you are fixing to.
 *
 * **It reads a published number now rather than deriving one.** This used to be
 * `Number.isFinite(m.headroom) ? m.houseY + LOW_CEILING : Infinity` — i.e. *any
 * room with something over the stage has a cellar's plaster over its house* —
 * and that was true for exactly as long as the cellar was the only room with a
 * lid on it. The first second room to grow a roof breaks it silently and in the
 * direction nobody checks: a 4.6 m courtyard would have hung its chandelier at
 * 3.6 m, a metre below its own ceiling, with the arithmetic all correct. The
 * room states both lids in `RoomShape` and this reads the one it is asked for.
 *
 * Kept as a function rather than replaced by the field at every call site so
 * that `stage-props.ts` and `lights.ts` did not have to change at all, and so
 * that the pair of them still reads as a question with two answers rather than
 * as two fields somebody has to remember are related.
 */
export function houseLid(m: StageMetrics): number {
  return m.houseLid;
}

/**
 * How far under `StageMetrics.headroom` the lens keeps.
 *
 * `camera.ts` obeys it, and the dressing has to know it: the band of height
 * between the ceiling and the lens is the one place in the house where a light
 * fitting can hang without ever crossing a player, because everything on stage
 * projects *below* the horizon and anything above the lens projects above it.
 * A fitting that hangs into this gap instead is the chandelier bug — an object
 * at exactly camera height, in front of the band, drifting in and out of frame
 * with the window's aspect ratio.
 *
 * 0.6 m. This was 0.3 m, which cleared the ceiling arithmetically and did not
 * clear it to look at: a lens 0.3 m under a lid is *at* the lid, the ceiling
 * starts at the top of the picture and stays there, and the shot reads as taken
 * by somebody with their head against the plaster. Twice that much puts the
 * lens at **1.8 m in the cellar** — a person standing on the floor of the room
 * rather than pressed into its ceiling. That number is the one `LOW_CEILING`
 * seventy lines up records itself as having replaced: the lid went to 3.6 m and
 * the boards came down to `CELLAR_RISE`, so the lens gets `STAGE_SOFFIT` less
 * this, which is **2.25 m in board space**, 2.65 m above the cellar's own floor.
 * The clearance the height was bought for still holds and is smaller than it was
 * claimed to be: jazz's seated house tops out at 1.44 m in the same frame, so
 * the gap is 0.81 m rather than the metre stated here.
 *
 * It costs the dressing nothing to widen: everything hung is built *downward
 * from the ceiling* to fit inside this band, so a deeper band is more room to
 * hang in, not less.
 */
export const LENS_GAP = 0.6;

// ---------------------------------------------------------------------------
// The sightline
// ---------------------------------------------------------------------------

/**
 * Where the band's heads are, so that nothing hangs in front of one.
 *
 * The stage cannot see the cast — that is the whole point of the split, and it
 * is not going to be given a back channel. So the rule that keeps a lantern off
 * a drummer's face has to be geometric, and this is it: a box over the boards
 * that hanging dressing stays out of.
 *
 * The numbers are `concert/cast.ts`'s, restated rather than imported because
 * importing them would make the stage depend on the casting system to know how
 * big a room is. If they ever disagree the symptom is a paper lantern parked in
 * front of somebody's nose, which is exactly what this was written after: a
 * festoon sagged to 2.08 m over the front line and a lantern hung with its
 * bottom at 2.30 m directly over the drum riser, and from a camera down in the
 * house both sat squarely on a player's face.
 *
 *  - `lo` is a seated player's chin. Below it is furniture's problem, not ours.
 *  - `hi` is a tall player's crown **plus the 0.4 m drum riser** — `cast.ts`
 *    puts the drummer up on one, and forgetting that is how the lantern got
 *    there in the first place.
 *  - the x and z margins are `MARGIN_SIDE`, `MARGIN_UP` and `MARGIN_DOWN`: the
 *    band is never placed outside them, so outside them is safe.
 *
 * Dressing satisfies the rule by clearing the band in **y** (over their heads),
 * or by clearing it in **z** — downstage of the front line or upstage of the
 * backline. Either is enough; both is better.
 */
export const HEAD_BAND = { lo: 1.3, hi: 2.4 } as const;

/** Bounds of the boards the cast can be standing on. See `HEAD_BAND`. */
export interface PlayingArea {
  /** Half-width. Nobody stands outside ±this. */
  halfX: number;
  /** Upstage limit — the backline. Nothing is placed upstage of it. */
  backZ: number;
  /** Downstage limit — the front line. Nothing is placed downstage of it. */
  frontZ: number;
}

const MARGIN_SIDE = 0.5;
const MARGIN_UP = 0.5;
const MARGIN_DOWN = 0.7;

export function playingArea(m: StageMetrics): PlayingArea {
  return {
    halfX: m.width / 2 - MARGIN_SIDE,
    backZ: m.backZ + MARGIN_UP,
    frontZ: m.lipZ - MARGIN_DOWN,
  };
}

/** Whether a hanging box would sit in somebody's face. The one test. */
export function inSightline(
  area: PlayingArea,
  box: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number },
): boolean {
  return box.maxY > HEAD_BAND.lo && box.minY < HEAD_BAND.hi
    && box.maxX > -area.halfX && box.minX < area.halfX
    && box.maxZ > area.backZ && box.minZ < area.frontZ;
}

// ---------------------------------------------------------------------------
// Colour
// ---------------------------------------------------------------------------

/** Toward black. `amount` 0 leaves it alone, 1 is black. */
export function shade(hex: string, amount: number): string {
  const c = new Color(hex);
  c.multiplyScalar(Math.max(0, 1 - amount));
  return `#${c.getHexString()}`;
}

/** Toward white. */
export function tint(hex: string, amount: number): string {
  const c = new Color(hex);
  c.lerp(new Color(1, 1, 1), Math.max(0, Math.min(1, amount)));
  return `#${c.getHexString()}`;
}

/** Straight blend of two palette entries. */
export function blend(a: string, b: string, t: number): string {
  const c = new Color(a);
  c.lerp(new Color(b), Math.max(0, Math.min(1, t)));
  return `#${c.getHexString()}`;
}

/**
 * Rotate the hue and optionally push the saturation.
 *
 * Bunting and flowers want a colour that is *related* to the venue rather than
 * one of its five entries repeated. Rotating the curtain's hue keeps the room
 * coherent while giving the dressing something of its own.
 */
export function hueShift(hex: string, degrees: number, satBoost = 0): string {
  const c = new Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(
    (hsl.h + degrees / 360 + 1) % 1,
    Math.max(0, Math.min(1, hsl.s + satBoost)),
    hsl.l,
  );
  return `#${c.getHexString()}`;
}

// ---------------------------------------------------------------------------
// Resource ownership
// ---------------------------------------------------------------------------

export interface SolidOptions {
  rough?: number;
  metal?: number;
  emissive?: string;
  emissiveIntensity?: number;
  side?: Side;
  opacity?: number;
  flat?: boolean;
  vertexColors?: boolean;
}

/**
 * Every geometry and material the stage owns, and the only thing that can free
 * them.
 *
 * Cached by key so that fourteen bevelled boxes of the same size are one
 * geometry and one draw setup rather than fourteen. `own()` is the escape
 * hatch for one-offs that still have to be released.
 */
export class Kit {
  private readonly mats = new Map<string, Material>();
  private readonly geos = new Map<string, BufferGeometry>();
  private readonly extras: { dispose(): void }[] = [];

  material<T extends Material>(key: string, make: () => T): T {
    const found = this.mats.get(key);
    if (found) return found as T;
    const made = make();
    this.mats.set(key, made);
    return made;
  }

  geometry<T extends BufferGeometry>(key: string, make: () => T): T {
    const found = this.geos.get(key);
    if (found) return found as T;
    const made = make();
    this.geos.set(key, made);
    return made;
  }

  /** Track something uncacheable — a one-off geometry, a shader material. */
  own<T extends { dispose(): void }>(thing: T): T {
    this.extras.push(thing);
    return thing;
  }

  /** A lit, flat-coloured surface. The default look of everything here. */
  solid(colour: string, o: SolidOptions = {}): MeshStandardMaterial {
    const key = `s|${colour}|${JSON.stringify(o)}`;
    return this.material(key, () => {
      const mat = new MeshStandardMaterial({
        color: colour,
        roughness: o.rough ?? 0.82,
        metalness: o.metal ?? 0,
        emissive: o.emissive ?? '#000000',
        emissiveIntensity: o.emissiveIntensity ?? 1,
        transparent: o.opacity !== undefined && o.opacity < 1,
        opacity: o.opacity ?? 1,
        flatShading: o.flat ?? false,
        vertexColors: o.vertexColors ?? false,
      });
      /**
       * Hold the chrome still while the room goes dark.
       *
       * `scene.environment` came down from 0.45 to 0.16 because it was the
       * flattest source on the stage — see `ROOM_INTENSITY` in
       * `performer-assets.ts`. A cymbal, a trumpet bell and a mic stand are
       * exactly the surfaces that cut hurts most: at high `metalness` a
       * `MeshStandardMaterial` has no diffuse term, so the environment is not
       * part of their appearance, it *is* their appearance, and nothing else
       * in the scene would have lit them back up.
       *
       * The slope pays it back in proportion to how much of the surface is
       * reflection. A full metal at 0.90 gets `1 + 0.9 x 2` = 2.8, and
       * `0.16 x 2.8` is the 0.45 it had before — chrome unchanged. Paint at 0
       * gets 1.0 and takes the cut in full, which is the point.
       *
       * The wardrobe runs a steeper version of the same slope for a different
       * target; see `METAL_ROOM_GAIN`, which is documented against the same
       * arithmetic.
       */
      const metal = o.metal ?? 0;
      if (metal > 0) mat.envMapIntensity = 1 + metal * 2;
      if (o.side !== undefined) mat.side = o.side;
      return mat;
    });
  }

  /**
   * Unlit flat colour — silhouettes, glowing bulbs, flames.
   *
   * The audience uses this for a reason beyond cost: a crowd that responds to
   * the stage lighting stops being a foreground silhouette and starts being a
   * hundred badly lit people.
   */
  basic(colour: string, o: { opacity?: number; side?: Side; fog?: boolean } = {}): MeshBasicMaterial {
    const key = `b|${colour}|${JSON.stringify(o)}`;
    return this.material(key, () => {
      const mat = new MeshBasicMaterial({
        color: colour,
        transparent: o.opacity !== undefined && o.opacity < 1,
        opacity: o.opacity ?? 1,
        fog: o.fog ?? true,
      });
      if (o.side !== undefined) mat.side = o.side;
      return mat;
    });
  }

  /** A chunky box with a generous bevel. The house style, in one call. */
  bevelBox(w: number, h: number, d: number, radius = 0.05): RoundedBoxGeometry {
    const r = Math.max(0.005, Math.min(radius, Math.min(w, Math.min(h, d)) * 0.49));
    const key = `bx|${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${r.toFixed(3)}`;
    return this.geometry(key, () => new RoundedBoxGeometry(w, h, d, 1, r));
  }

  dispose(): void {
    for (const m of this.mats.values()) m.dispose();
    for (const g of this.geos.values()) g.dispose();
    for (const e of this.extras) e.dispose();
    this.mats.clear();
    this.geos.clear();
    this.extras.length = 0;
  }
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/**
 * A plane divided into cells, each cell a slightly different colour.
 *
 * This is the whole texturing strategy of the stage. Boards, brick and parquet
 * are all the same trick: one geometry, one draw call, per-cell vertex colours
 * from the palette, and a crisp seam wherever two cells meet because the
 * geometry is non-indexed and nothing interpolates across the join. No image,
 * nothing sampled through a UV, no mip chain, and it survives being lit by a
 * moving spotlight in a way a tiled photograph does not.
 *
 * `stagger` lays alternate courses half a cell over, which turns a grid into a
 * bond and a grid of squares into a brick wall. **A shifted course is one cell
 * longer than a straight one**, and that is the whole of what was wrong here:
 * the cell pushed past the far jamb is *cut*, and the offcut belongs at the
 * near jamb. Both pieces keep the colour of the cell they were cut from,
 * because they are one brick — so the bond costs no extra draw from `rng`, and
 * a wall's colours do not depend on how its ends were finished.
 *
 * It used to shift and clamp — `Math.max(-half, Math.min(half, x + shift))`
 * with `shift` never negative, so the lower clamp could not fire. Only the far
 * edge was ever cut and the near half-cell of every odd course was not drawn at
 * all. That is a hole rather than a bond: `cellW / 2` wide by `height / rows`
 * tall, stacked into a crenellation up one end of the plane, and a wall here is
 * a single plane so there is nothing behind it to see instead. Measured over
 * the catalogue before the fix — 68 staggered planes in 17 venues (the jazz
 * cellar's house walls, the shed's blockwork, the dance hall's brick), 1117
 * courses, **532 gaps**, one per shifted course, roughly 0.21 m square and
 * never over 0.22, 24.04 m² of missing wall in total. A ray fired along the
 * wall normal through the middle of each of the 532 hit nothing at all, where
 * 8 of 8 control probes fired the same way into solid cells on the same planes
 * stopped at the wall. They stack 5 to 15 high at each corner of the room, and
 * those walls stand seven-odd metres from the middle of the house, so each
 * stack is a column of whatever is outside the building about 1.5° wide. After:
 * 0 gaps, 0 rays through, every course spans the full width of its plane, and
 * the outline of all 68 is the same rectangle it was, to the last bit.
 *
 * Written into its buffers directly rather than by shifting a `PlaneGeometry`
 * about, because a grid has exactly one quad per cell and the bond needs one
 * more in every shifted course. Cell order, winding, the six-vertex quad layout
 * and the count of `rng` draws are `PlaneGeometry`'s and the old loop's,
 * unchanged and measured against a frozen copy of the tree with only this
 * function swapped: of the 3279 geometries in the 72 scenes, **3211 are
 * byte-for-byte what they were**, position and colour both; the 68 that are not
 * are the staggered planes, which gained 532 quads, lost none, and did not
 * change the colour of a single cell. The one thing that does move is a shifted
 * course's x, by at most one float32 ulp — 9.5e-7 m out at the end of a 19 m
 * wall — because `x + shift` is now rounded to float32 once where it used to be
 * stored, added to and stored again.
 */
export function cellPlane(opts: {
  width: number;
  height: number;
  cols: number;
  rows: number;
  colour: string;
  jitter: number;
  rng: Rng;
  stagger?: boolean;
}): BufferGeometry {
  const { width, height, cols, rows, colour, jitter, rng } = opts;
  const stagger = opts.stagger ?? false;
  const cellW = width / cols;
  const cellH = height / rows;
  const halfW = width / 2;
  const halfH = height / 2;

  // One quad per cell, plus the offcut each shifted course carries back to the
  // near jamb — `Math.floor(rows / 2)` of them, since course 0 never moves.
  const quads = cols * rows + (stagger ? Math.floor(rows / 2) : 0);
  const xyz = new Float32Array(quads * 18);
  const uv = new Float32Array(quads * 12);
  const rgb = new Float32Array(quads * 18);

  const base = new Color(colour);
  const c = new Color();
  let v = 0;

  const vertex = (x: number, y: number): void => {
    xyz[v * 3] = x;
    xyz[v * 3 + 1] = y;
    rgb[v * 3] = c.r;
    rgb[v * 3 + 1] = c.g;
    rgb[v * 3 + 2] = c.b;
    uv[v * 2] = (x + halfW) / width;
    uv[v * 2 + 1] = (y + halfH) / height;
    v++;
  };

  /** One cell, wound the way `PlaneGeometry` winds one: (a,b,d) then (b,c,d). */
  const cell = (x0: number, x1: number, y0: number, y1: number): void => {
    vertex(x0, y0); vertex(x0, y1); vertex(x1, y0);
    vertex(x0, y1); vertex(x1, y1); vertex(x1, y0);
  };

  for (let iy = 0; iy < rows; iy++) {
    // Negated rather than `halfH - iy * cellH`, which is the same number in
    // every case but one: a course line that lands exactly on y = 0 gets `-0`
    // this way and `+0` the other, and `-0` is what `PlaneGeometry` wrote.
    // Nothing downstream can tell them apart — but it is a different bit, on
    // 358 of the catalogue's 3279 geometries, and writing it the way the file
    // already had it is what lets the diff say the bond is all that changed.
    const y0 = -(iy * cellH - halfH);
    const y1 = -((iy + 1) * cellH - halfH);
    const shift = stagger && iy % 2 === 1 ? cellW * 0.5 : 0;
    for (let ix = 0; ix < cols; ix++) {
      const k = 1 + (rng.next() - 0.5) * 2 * jitter;
      c.copy(base).multiplyScalar(k);
      const x0 = ix * cellW - halfW + shift;
      const x1 = (ix + 1) * cellW - halfW + shift;
      if (shift !== 0 && ix === cols - 1) {
        // The far jamb cuts the last cell of a shifted course in two. Told by
        // the index rather than by testing `x1 > halfW`, because `cols * cellW`
        // is not exactly `width` in float and a straight course would then cut
        // its last cell too, one ulp wide, at random across the catalogue.
        cell(x0, halfW, y0, y1);
        cell(-halfW, -halfW + shift, y0, y1);
      } else {
        cell(x0, x1, y0, y1);
      }
    }
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(xyz, 3));
  // Nothing samples this today — every material these geometries are drawn with
  // is `vertexColors` and mapless — but `PlaneGeometry` supplied one, and a
  // material that later grows a map would have nothing to sample without it.
  // Linear across the plane, so a cut cell maps to its own share of the span.
  geo.setAttribute('uv', new BufferAttribute(uv, 2));
  geo.setAttribute('color', new BufferAttribute(rgb, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Points along a hanging line. A sine sag rather than a cosh — identical to
 * the eye over three metres and it does not need a solver.
 */
export function sagLine(
  a: Vector3, b: Vector3, sag: number, steps: number,
): Vector3[] {
  const out: Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    out.push(new Vector3(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t - sag * Math.sin(Math.PI * t),
      a.z + (b.z - a.z) * t,
    ));
  }
  return out;
}

/** Both sides, for cloth and flags that are seen from behind. */
export const CLOTH_SIDE: Side = DoubleSide;
