/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Shared geometry and materials for the performer rig.
 *
 * Six performers on stage is the design target, and the naive version of this
 * file does not exist at all: every rig calls `new SphereGeometry(...)` for its
 * own head and the GPU ends up holding six identical vertex buffers, six
 * identical hand palms, and sixty identical finger capsules. Nothing about that
 * is visible — it is simply memory and upload bandwidth spent on nothing.
 *
 * So every geometry here is a **unit** geometry: a sphere of diameter 1, a box
 * of side 1, a capsule of length 1. Proportion is expressed as `mesh.scale`,
 * which costs nothing and lets a 1.55 m accordionist and a 1.92 m bassist share
 * one vertex buffer. The single rule that follows from that, and the only one
 * worth remembering while reading the rig:
 *
 *   **A node with children has uniform scale.**
 *
 * Non-uniform scale on a parent shears any rotated child — a hand whose palm is
 * flattened in `y` will visibly skew its own curled fingers. Every squashed
 * thing in this system is therefore a leaf, and every articulated thing is a
 * group scaled evenly or not at all.
 *
 * Materials are pooled by *value* rather than per rig, so two players in the
 * same dark suit share one material and one shader program. Clothing colours
 * come from `Look`, so a per-performer material is expected and fine; what is
 * not fine is a per-performer *geometry*.
 *
 * Everything is reference counted. A rig takes out a `Leases` book, and
 * `releaseAll()` on dispose drops its counts; the pool disposes a geometry only
 * when the last rig holding it has gone. That is what makes `dispose()` on a
 * single performer honest without breaking the five still on stage.
 */

import {
  BoxGeometry, BufferGeometry, CapsuleGeometry, CircleGeometry, Color,
  ConeGeometry, CylinderGeometry, DataTexture, DoubleSide, Float32BufferAttribute,
  LatheGeometry, LinearFilter, Material, MeshPhysicalMaterial, MeshStandardMaterial,
  PMREMGenerator, PlaneGeometry, RGBAFormat, RepeatWrapping, SRGBColorSpace,
  type Scene, SphereGeometry, TorusGeometry, Vector2, type WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import { Rng } from '../../core/rng.js';
import type { Fabric } from '../../concert/types.js';

// ---------------------------------------------------------------------------
// The pool
// ---------------------------------------------------------------------------

interface Entry<T> { value: T; refs: number }

const GEOMETRIES = new Map<string, Entry<BufferGeometry>>();
const MATERIALS = new Map<string, Entry<Material>>();

/**
 * One rig's borrowings from the shared pool.
 *
 * Counts rather than a set, because a rig legitimately takes the same finger
 * capsule ten times and must give back exactly ten.
 */
export class Leases {
  private readonly geo = new Map<string, number>();
  private readonly mat = new Map<string, number>();

  geometry<T extends BufferGeometry>(key: string, make: () => T): T {
    let entry = GEOMETRIES.get(key);
    if (!entry) {
      entry = { value: make(), refs: 0 };
      GEOMETRIES.set(key, entry);
    }
    entry.refs++;
    this.geo.set(key, (this.geo.get(key) ?? 0) + 1);
    return entry.value as T;
  }

  material<T extends Material>(key: string, make: () => T): T {
    let entry = MATERIALS.get(key);
    if (!entry) {
      entry = { value: make(), refs: 0 };
      MATERIALS.set(key, entry);
    }
    entry.refs++;
    this.mat.set(key, (this.mat.get(key) ?? 0) + 1);
    return entry.value as T;
  }

  releaseAll(): void {
    for (const [key, n] of this.geo) {
      const entry = GEOMETRIES.get(key);
      if (!entry) continue;
      entry.refs -= n;
      if (entry.refs <= 0) {
        entry.value.dispose();
        GEOMETRIES.delete(key);
      }
    }
    this.geo.clear();
    for (const [key, n] of this.mat) {
      const entry = MATERIALS.get(key);
      if (!entry) continue;
      entry.refs -= n;
      if (entry.refs <= 0) {
        // The pool made the textures too, so the pool disposes them. Both slots,
        // because a garment is a colour *and* a weave: `clothSurface` hangs a
        // generated normal map on corduroy, denim, knit and flannel, and a
        // release that only knew about `map` would leak one 48 kB texture per
        // distinct cloth colour for the life of the tab. Each material owns its
        // own copy rather than sharing one per weave, which is what makes this
        // one line correct instead of a double free.
        const m = entry.value as Material & {
          map?: { dispose(): void } | null;
          normalMap?: { dispose(): void } | null;
        };
        m.map?.dispose();
        m.normalMap?.dispose();
        entry.value.dispose();
        MATERIALS.delete(key);
      }
    }
    this.mat.clear();
  }
}

/** For tests: what the pool is still holding. Should be empty after a strike. */
export function poolSize(): { geometries: number; materials: number } {
  return { geometries: GEOMETRIES.size, materials: MATERIALS.size };
}

// ---------------------------------------------------------------------------
// Unit geometries
// ---------------------------------------------------------------------------

/**
 * Sphere of diameter 1, at **three resolutions** — four, since `pip` was added
 * between `orb` and `bead` and this paragraph was not.
 *
 * The split is worth the keys: a head is a silhouette the audience reads
 * from the back of the room, a palm is a blob, and an iris is four pixels. At
 * 352 / 192 / **120** / 80 triangles they are a few kB of vertex data between
 * them and they take about 2000 triangles per performer off the frame.
 */
export const ball = (l: Leases): SphereGeometry =>
  l.geometry('ball', () => new SphereGeometry(0.5, 16, 12));

/** Mid. Palms, hair, torso masses — anything with a shape but no detail. */
export const orb = (l: Leases): SphereGeometry =>
  l.geometry('orb', () => new SphereGeometry(0.5, 12, 9));

/** Cheap. Noses, curls, studs, irises. */
export const pip = (l: Leases): SphereGeometry =>
  l.geometry('pip', () => new SphereGeometry(0.5, 10, 7));

/** Cheapest. Anything the eye reads as a dot. */
export const bead = (l: Leases): SphereGeometry =>
  l.geometry('bead', () => new SphereGeometry(0.5, 8, 6));

/** Cube of side 1. Lapels, brims, brows — anything flat. */
export const slab = (l: Leases): BoxGeometry =>
  l.geometry('slab', () => new BoxGeometry(1, 1, 1));

/**
 * A finger bone: capsule of total length 1 along `+y`, **origin at the base**.
 *
 * Origin at the base rather than the centre is what removes a `Group` per
 * finger joint: the mesh is its own pivot, so a knuckle is `rotation.x` on the
 * mesh and the next bone is a child at `y = 1`. Ten fingers become ten objects
 * instead of twenty-five.
 */
export const bone = (l: Leases): CapsuleGeometry =>
  l.geometry('bone', () => {
    const g = new CapsuleGeometry(0.26, 0.48, 1, 6);
    g.translate(0, 0.5, 0);
    return g;
  });

/**
 * A stick: diameter 1 at the butt tapering to 0.62 at the far end, length 1
 * along `+y`, **origin at the butt**.
 *
 * Origin at the butt for the same reason `bone` has it at the base — the mesh
 * is its own pivot, so a thing held at a fulcrum is one position and one scale
 * rather than a group wrapping a centred cylinder. The taper is what separates
 * a drumstick from a dowel at ten metres; on a mallet's thin shaft it is
 * invisible, which is why one geometry serves both.
 */
export const rod = (l: Leases): CylinderGeometry =>
  l.geometry('rod', () => {
    const g = new CylinderGeometry(0.31, 0.5, 1, 8);
    g.translate(0, 0.5, 0);
    return g;
  });

/** Capsule of diameter 1 and total length 2, centred. Feet, limbs, lips. */
export const pill = (l: Leases): CapsuleGeometry =>
  l.geometry('pill', () => new CapsuleGeometry(0.5, 1, 2, 8));

/** Cylinder of diameter 1 and height 1. Hat crowns, brims, ear cups. */
export const tube = (l: Leases): CylinderGeometry =>
  l.geometry('tube', () => new CylinderGeometry(0.5, 0.5, 1, 14));

/**
 * Cone of diameter 1 and height 1. **A beehive is a cone and always was** —
 * and is not one any more: `performer-hair.ts` rebuilt the tower out of `orb`
 * precisely because "a `spike` cannot be blunt, and a beehive that comes to a
 * point is a party hat". What is left on this geometry is a mohawk's fins and a
 * flared skirt, which is two callers and both of them want the point.
 */
export const spike = (l: Leases): ConeGeometry =>
  l.geometry('spike', () => new ConeGeometry(0.5, 1, 14));

/** Disc of diameter 1 in the xy plane, facing `+z`. Lenses. */
export const disc = (l: Leases): CircleGeometry =>
  l.geometry('disc', () => new CircleGeometry(0.5, 16));

/** Unit quad in the xy plane, facing `+z`. Splat decals. */
export const quad = (l: Leases): PlaneGeometry =>
  l.geometry('quad', () => new PlaneGeometry(1, 1));

/** Torus of outer diameter 1 in the xy plane. Spectacle rims, headphone band. */
export const hoop = (l: Leases): TorusGeometry =>
  l.geometry('hoop', () => new TorusGeometry(0.44, 0.06, 5, 14));

/** Torus with a fat tube. Scarves and collars. */
export const collar = (l: Leases): TorusGeometry =>
  l.geometry('collar', () => new TorusGeometry(0.38, 0.14, 5, 14));

/**
 * A torso: unit height, unit width at the shoulders, hip at `y = 0`.
 *
 * A lathe rather than a capsule because the shoulder line is the whole
 * silhouette. Shoulders at `y = 0.86` are the widest point, the waist pulls in
 * at 0.36, and the top rolls over so there is something for the head to float
 * above. Max radius is exactly 0.5, so `scale.x` is the shoulder width in
 * metres and `scale.y` is hip-to-shoulder.
 */
export const torsoShell = (l: Leases): LatheGeometry =>
  l.geometry('torso', () => new LatheGeometry([
    new Vector2(0.0001, 0.00),
    new Vector2(0.30, 0.00),
    new Vector2(0.38, 0.07),
    new Vector2(0.37, 0.24),
    new Vector2(0.36, 0.42),
    new Vector2(0.41, 0.60),
    new Vector2(0.47, 0.76),
    new Vector2(0.50, 0.87),
    new Vector2(0.45, 0.96),
    new Vector2(0.30, 1.00),
    new Vector2(0.0001, 1.00),
  ], 14));

/**
 * What goes **on** a head: a shell with two walls, a hem, and a fall.
 *
 * This replaces `hoodShell`, which was a bare `SphereGeometry` with a wedge left
 * out of it, and which was a *surface* — and a surface is not a thing. It had no
 * thickness, so its edge was a knife and it was only visible at all because the
 * material was `doubleSide`; and because a sphere can only be concentric with
 * the head, it could be *near* a skull but never on one, which is what made a
 * hood look like a bubble with somebody loose inside. Every complaint about hair
 * or cloth floating round a head came back to those two facts, and neither was
 * fixable by choosing better numbers — three.js has no primitive for this shape.
 *
 * So this builds one. Two concentric shells joined at every open edge, cut to
 * the same head, which gives three things a sphere cannot:
 *
 * **It is placed against the head rather than near it.** `wall` is given in
 * multiples of the head's own radius, and the geometry is meant to be scaled by
 * exactly the skull's own scale, so both surfaces are stated *as* the head:
 * `[1.03, 1.19]` is four millimetres of air under two and a half centimetres of
 * hair, and `[0.98, x]` would bury the inner surface in the scalp. The point is
 * not that one of those is right — hair wants a little air under it and a
 * bathing cap does not — it is that the amount is a number somebody chose and
 * can read back, where a sphere near a head has an offset that varies from the
 * crown to the nape and is nobody's decision at all.
 *
 * **It has an edge.** The hem and the two sides of the face opening are walls
 * with area, so a cut reads as a cut from any angle and takes its own shading.
 *
 * **It can hang.** Below `hem` the profile leaves the sphere and drops straight,
 * which is what hair and cloth actually do — they follow the skull to its widest
 * point and then fall. An ellipsoid curves back in under the jaw instead, which
 * is the one silhouette this whole family of shapes must not have.
 *
 * ## Where `phi = 0` is, which is the one thing here worth getting wrong once
 *
 * three.js builds a sphere as
 *
 *     x = −r·cos(phi)·sin(theta)      z = r·sin(phi)·sin(theta)
 *
 * — note the minus on `x` — so `phi = 0` is **−x**, the performer's right ear,
 * and the front of the face is `phi = π/2`. An opening centred on the face is
 * therefore an arc that *starts* past π/2 and comes back round to just before
 * it: `[0.80π, 2.20π]` leaves 0.20π…0.80π open, symmetric about the face.
 *
 * The tempting near-miss is to name the centre of the hole rather than the edge
 * of the cloth, and the two differ by half the gap. The predecessor of this
 * geometry shipped with its opening centred on `phi = 0`, so every hooded player
 * on the project's stage was a featureless egg from the front with its face-hole
 * over one ear — for months, because from the stalls an egg with two eyebrows
 * over the rim reads as a person who is merely far away. Turn a head to `front`
 * and `side` on the costume bench before believing any arithmetic here, this
 * comment's included.
 */
export interface HeadShell {
  /** Start and end of the covered arc, in radians. See the note above. */
  phi: readonly [number, number];
  /**
   * How far down the head the shell reaches at each end of the arc, as an
   * angle from the crown. Equal ends give a level hem; unequal ends give a
   * diagonal, which is what a swept fringe is.
   */
  hem: readonly [number, number];
  /** Inner and outer surface, in multiples of the head's own radius. */
  wall: readonly [number, number];
  /**
   * How far it falls below the hem, in head radii, at the start, middle and end
   * of the arc — a quadratic through the three, so one spec covers the shapes
   * that actually occur.
   *
   * `[0, x, 0]` is a hood: nothing at the face, everything down the back.
   * `[x, y, x]` with `y` smaller is a haircut: long beside the face, short
   * behind, which is the difference between layers and a bowl. `[0, y, x]` is
   * one-sided, which is what the long half of a swept fringe is.
   */
  fall?: readonly [number, number, number];
  /**
   * The ellipse the fall lands on, as the share of the hem's own width and
   * depth it keeps — `[1, 1]` is plumb.
   *
   * Two numbers rather than one because a head is rounder than a body: a hem
   * that drops plumb arrives 0.89 R out at the ears, which is about right for a
   * shoulder, and 0.85 R behind the skull, which is a hand's width off a back.
   * A cowl that has to *land* on someone needs the two axes pulled by different
   * amounts, and one number can only ever get one of them right.
   */
  land?: readonly [number, number];
}

export const headShell = (l: Leases, spec: HeadShell): BufferGeometry => {
  const key = `shell:${spec.phi.join()}:${spec.hem.join()}:${spec.wall.join()}`
    + `:${(spec.fall ?? [0, 0, 0]).join()}:${(spec.land ?? [1, 1]).join()}`;
  return l.geometry(key, () => buildHeadShell(spec));
};

/**
 * 20 × 9 quads a surface, and 3 more rows if it falls.
 *
 * Measured: 1048 triangles for a shell that falls and 796 for a patch that does
 * not, so a whole head of hair or cloth is two of them and about 1850 — five
 * `ball`s, for the thing an audience looks at most and the thing that used to be
 * a sphere with a hole in it. It buys the mesh *count* back: `emo` went from six
 * meshes to two and `wrap` from three. The pole is a fan of degenerate quads, as
 * it is on every sphere in three.js, and costs nothing.
 */
function buildHeadShell(spec: HeadShell): BufferGeometry {
  const [phi0, phi1] = spec.phi;
  const [hem0, hem1] = spec.hem;
  const [rIn, rOut] = spec.wall;
  const [fa, fb, fc] = spec.fall ?? [0, 0, 0];
  const [landX, landZ] = spec.land ?? [1, 1];
  // Quadratic Bézier whose control point is chosen so the curve passes through
  // `fb` at the middle of the arc rather than merely being pulled toward it.
  const mid = 2 * fb - (fa + fc) / 2;
  const fallAt = (u: number): number =>
    fa * (1 - u) ** 2 + 2 * mid * u * (1 - u) + fc * u ** 2;
  const span = Math.max(fa, fb, fc);
  const NP = 20;
  const NT = 9;
  const NF = fa + fb + fc > 0 ? 3 : 0;
  const rows = NT + 1 + NF;

  const xyz: number[] = [];
  const put = (x: number, y: number, z: number): number => {
    xyz.push(x, y, z);
    return xyz.length / 3 - 1;
  };
  // One flat array a surface, indexed `i * rows + j`: `NP + 1` columns of `rows`
  // vertices each, running from the crown down the profile. Flat rather than
  // nested because every read below is a corner of a quad, and four
  // `grid[side][i][j]` a quad is where an off-by-one hides.
  const surfaceOf = (r: number): number[] => {
    const out: number[] = [];
    for (let i = 0; i <= NP; i++) {
      const u = i / NP;
      const phi = phi0 + (phi1 - phi0) * u;
      const hem = hem0 + (hem1 - hem0) * u;
      const drop = 0.5 * Math.max(0, fallAt(u));
      for (let j = 0; j <= NT; j++) {
        const theta = hem * (j / NT);
        const s = Math.sin(theta);
        out.push(put(-r * Math.cos(phi) * s, r * Math.cos(theta), r * Math.sin(phi) * s));
      }
      const s = Math.sin(hem);
      const hx = -r * Math.cos(phi) * s;
      const hz = r * Math.sin(phi) * s;
      const hy = r * Math.cos(hem);
      // `land` is scaled by how far *this* column actually falls, not just by
      // how far down the fall we are. Otherwise a column at the ear, which
      // drops half as far as the one at the nape, would still swing the whole
      // way out — and a cowl that spreads to its full width in half the drop is
      // a flange sticking out over an ear.
      const reach = span > 0 ? fallAt(u) / span : 0;
      for (let k = 1; k <= NF; k++) {
        const t = (k / NF) * reach;
        out.push(put(
          hx * (1 + (landX - 1) * t),
          hy - drop * (k / NF),
          hz * (1 + (landZ - 1) * t),
        ));
      }
    }
    return out;
  };
  const outer = surfaceOf(0.5 * rOut);
  const inner = surfaceOf(0.5 * rIn);
  const O = (i: number, j: number): number => outer[i * rows + j] ?? 0;
  const I = (i: number, j: number): number => inner[i * rows + j] ?? 0;

  // Wound so that `a → b → c → d` runs down the profile and then along the arc,
  // which for the outer surface is anticlockwise seen from outside.
  //
  // **Signed volume does not check this**, and believing it did cost a round.
  // The hem was wound the other way, and a bottom ring facing up out of a shell
  // whose other thousand triangles face out still leaves the total volume
  // positive — so the mesh measured "outward" and had no bottom. A back-facing
  // ring is culled, so from anywhere below the jaw you looked straight through
  // the hem into the inside of the head.
  //
  // The test that does catch it is the manifold one: weld coincident vertices,
  // then walk every triangle's three directed edges. On a closed, consistently
  // wound surface each directed edge occurs exactly once and its reverse occurs
  // exactly once. The flipped ring showed up as forty-two directed edges used
  // twice and forty-two edges with only one face — a hole and a fold, which is
  // exactly what it was. Run that before believing any winding here, this
  // comment's included.
  const idx: number[] = [];
  const quad = (a: number, b: number, c: number, d: number): void => {
    idx.push(a, b, c, a, c, d);
  };
  for (let i = 0; i < NP; i++) {
    for (let j = 0; j < rows - 1; j++) {
      quad(O(i, j), O(i, j + 1), O(i + 1, j + 1), O(i + 1, j));
      quad(I(i, j), I(i + 1, j), I(i + 1, j + 1), I(i, j + 1));
    }
    // The hem, and the two sides of the opening: the walls that give the cut an
    // edge with area instead of a knife edge that vanishes at a grazing angle.
    // Outer → inner → along the arc, so the ring faces *down* off the hem.
    quad(O(i, rows - 1), I(i, rows - 1), I(i + 1, rows - 1), O(i + 1, rows - 1));
  }
  for (let j = 0; j < rows - 1; j++) {
    quad(O(0, j), I(0, j), I(0, j + 1), O(0, j + 1));
    quad(O(NP, j), O(NP, j + 1), I(NP, j + 1), I(NP, j));
  }

  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(xyz, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

export interface Finish {
  roughness?: number;
  metalness?: number;
  /** For open shells — a hood seen from inside is still a hood. */
  doubleSide?: boolean;
  opacity?: number;
  /** A generated grain, for the cloths whose identity is a surface. See `WEAVES`. */
  weave?: WeaveId;
  /**
   * Retroreflection off a raised pile, which is a thing `MeshStandardMaterial`
   * cannot express — asking for it upgrades the material to
   * `MeshPhysicalMaterial`. Velvet and flannel are what it is here for.
   */
  sheen?: number;
}

function materialKey(colour: string, f: Finish): string {
  return [
    colour, f.roughness ?? 0.8, f.metalness ?? 0, f.doubleSide ? 'd' : 's',
    f.opacity ?? 1, f.weave ?? '-', f.sheen ?? 0,
  ].join('|');
}

/**
 * How much brighter a metal's room is than everyone else's.
 *
 * A stage is not a physically plausible place. The venue lights in this project
 * run at intensities of two and three, and every diffuse surface gets all of
 * that plus an ambient fill; a metal gets none of it, because a metal has no
 * diffuse term — its colour is only what it reflects. So a room bright enough to
 * put the sequinned lead level with the wool suits beside her is a room bright
 * enough to wash the wool suits out, and `scene.environmentIntensity` cannot
 * tell the two cases apart.
 *
 * `envMapIntensity` can: it scales one material's helping of the environment.
 * Sloping it with `metalness` means the reflection is boosted exactly in
 * proportion to how much of the surface's appearance it is responsible for, so
 * `wool` at 0.03 is barely touched and `lame` at 0.90 reflects a much brighter
 * room than the one in the render target. That is a licence and worth naming as
 * one, but the alternative was measured on the bench and it is a lead singer in
 * lamé who is the darkest object in the house.
 *
 * ## Why 7.5 and not 3.0
 *
 * This number is a counterweight, so it only means anything paired with the
 * `ROOM_INTENSITY` it is pulling against — and that came down from 0.45 to
 * 0.16 to stop the environment flattening the stage. Held at 3.0, the cut
 * would have taken the metals with it and undone exactly the bug this constant
 * exists for.
 *
 * 7.5 is what keeps the two moving independently. A full metal at 0.90 sees
 * `0.16 x (1 + 0.9 x 7.5)` = 1.24 against the 1.67 it saw before: three
 * quarters of its reflection kept. Wool at 0.03 sees `0.16 x 1.23` = 0.20
 * against 0.49, barely a third. Which is the shape of the whole change — the
 * diffuse world gets dark enough for the lanterns to model it, and the cloths
 * that have nothing *but* reflection stay lit.
 */
const METAL_ROOM_GAIN = 7.5;

/**
 * One material, pooled by every value that went into it.
 *
 * The `sheen` branch is the only place in the rig that leaves
 * `MeshStandardMaterial` behind, and it is deliberately a branch rather than a
 * blanket upgrade: `MeshPhysicalMaterial` compiles a longer shader and every
 * skin, hair, lens and drum shell on stage would pay for a term two garments
 * use. `MeshPhysicalMaterial` extends `MeshStandardMaterial`, so the return type
 * is honest and no caller has to know which it got.
 */
export function surface(l: Leases, colour: string, f: Finish = {}): MeshStandardMaterial {
  const key = materialKey(colour, f);
  return l.material(key, () => {
    const common = {
      color: new Color(colour),
      roughness: f.roughness ?? 0.8,
      metalness: f.metalness ?? 0,
      ...(f.doubleSide ? { side: DoubleSide } : {}),
      transparent: (f.opacity ?? 1) < 1,
      opacity: f.opacity ?? 1,
    };
    const m = f.sheen
      ? new MeshPhysicalMaterial({
        ...common,
        sheen: f.sheen,
        // Tight rather than broad, so the term lands where a pile actually
        // catches the light — the grazing edge. At 0.8 it spreads over the whole
        // garment and does nothing but lift it, which turned velvet, the cloth
        // that is supposed to be the darkest thing on the stage, into the
        // lightest one in the dark-coat row.
        sheenRoughness: 0.40,
        // Warm-white rather than the garment's own colour: a pile catches the
        // light rather than the dye, which is why a black velvet lapel has a
        // grey edge and a black wool one has none.
        sheenColor: new Color('#d8d2c8'),
      })
      : new MeshStandardMaterial(common);
    m.envMapIntensity = 1 + (f.metalness ?? 0) * METAL_ROOM_GAIN;
    if (f.weave) {
      m.normalMap = makeWeaveTexture(f.weave);
      m.normalScale = new Vector2(WEAVES[f.weave].depth, WEAVES[f.weave].depth);
    }
    return m;
  });
}

export const skinSurface = (l: Leases, colour: string): MeshStandardMaterial =>
  surface(l, colour, { roughness: 0.62, metalness: 0 });

export const hairSurface = (l: Leases, colour: string): MeshStandardMaterial =>
  surface(l, colour, { roughness: 0.72, metalness: 0.03 });

/**
 * What light does to a garment, taken from what the garment is made of.
 *
 * This used to derive sheen from how *saturated* the colour was, and the
 * comment defended it as rendering licence on the grounds that "the IR gives
 * four colours and no fabric". That was true when it was written and stopped
 * being true some time ago: `Look.outfit.fabric` has been in the IR all along,
 * every wardrobe in the project sets it deliberately, and nothing read it.
 *
 * The saturation heuristic is not merely a weaker signal than the real one, it
 * is the specific failure `Fabric` was declared to prevent — its own doc comment
 * says a renderer asked to infer sheen from saturation "ends up deciding that
 * any loud colour is shiny, which makes a bright red wool jacket glitter and a
 * silver knit jumper look like a mirror". Both of those were happening. A
 * tanssilava band's cream wool suits came out matte because they are pale, and
 * the one player in sequins came out shiny because sequins are drawn in silver
 * and gold — so it looked approximately right in the one genre it was tuned
 * against, and wrong everywhere the colours were loud for another reason.
 *
 * `fabric` is required rather than optional, and the saturation path is gone
 * rather than kept as a fallback. Every one of the **six call sites** already
 * has
 * the `Look` in hand, so there is no caller a fallback would serve — and a
 * required parameter is what makes this change atomic. It is ten call sites now,
 * six in `performer-garments.ts` and four in `performer-look.ts`, and the
 * argument is the one that held: not one of them had to go looking for a
 * `Fabric` it did not already have. Torso, sleeves and legs
 * are one garment, and half-wiring them would open a sheen seam at every
 * shoulder and hip, which is worse than the uniform wrongness it replaces.
 */
interface Cloth {
  /** Specular lobe width. The axis the table used to be entirely about. */
  roughness: number;
  metalness: number;
  /**
   * Multiplier on the garment's own lightness, in **sRGB** and not the working
   * linear space — the point is a perceptual step, and a linear multiply is
   * roughly half the size it looks like it is asking for.
   */
  tone: number;
  /** Multiplier on saturation. Below 1 for the cloths that scatter their dye. */
  chroma: number;
  weave?: WeaveId;
  sheen?: number;
}

/**
 * What light does to a garment, taken from what the garment is made of.
 *
 * ## Why the table has five columns and not two
 *
 * It had two, and nine of its fifteen rows were the same fabric. `wool velvet
 * corduroy denim knit nylon silk linen flannel` were all roughness 0.88–1.00 at
 * metalness ≤ 0.03, which is one grey lit one way; put side by side on the
 * costume bench's fabric view they were literally indistinguishable, and the
 * whole reason `Fabric` exists — per its own doc comment, that a wool suit and a
 * knit jumper are different objects — was not being served by the only file that
 * reads it.
 *
 * Every one of those two-column values was defensible on its own and that was
 * the trap: roughness is a statement about the *width of a specular highlight*,
 * and the concert camera sits at `[0, 2.4, 11]`, where a performer's torso is
 * some tens of pixels across. A highlight two pixels wider than its neighbour's
 * is not a difference at that distance. So the table now moves the things that
 * do survive ten metres:
 *
 *   - **`tone`** — how light the cloth renders its own dye. This is the load
 *     bearing column. It is albedo, not a highlight, so it reads at any size,
 *     and it is not a cheat: a velvet and a linen cut from one bolt of dye are
 *     genuinely not the same lightness, because a pile traps light between its
 *     fibres and a smooth crisp weave throws it back.
 *   - **`chroma`** — how much of the dye survives. Napped and scattering cloths
 *     go chalky. Invisible on the bench's near-grey control coats, which is
 *     correct: it is there for the wardrobe view, where jackets are saturated.
 *   - **`weave`** — a generated normal map, for the four cloths whose identity
 *     is a surface rather than a sheen. See `WEAVES`.
 *   - **`sheen`** — retroreflection off a raised pile. It brightens the
 *     *silhouette*, and a silhouette is the one part of a small figure that is
 *     guaranteed to be several pixels wide, so of everything here it is the
 *     effect that degrades most gracefully with distance.
 *
 * ## What each row is for, and the pair it was set against
 *
 * `tone` runs velvet 0.74 → denim 0.83 → leather 0.88 → knit 0.90 → vinyl 0.94
 * → corduroy 0.95 → **wool 1.00** → nylon 1.01 → satin 1.02 → flannel 1.05 →
 * silk 1.09 → linen 1.15, so the matte cluster alone spans two fifths of a stop
 * and no two neighbours in it are closer than 0.05. Where two rows do sit close
 * in `tone` they are far apart in gloss, and vice versa — that is the whole
 * layout of the table:
 *
 *   - **wool** is the reference and moves for nobody. 1.00 tone, 1.00 chroma.
 *   - **velvet / wool** — the pair the old table failed hardest. Velvet is now
 *     the darkest cloth on the stage (0.74) with a grazing sheen on top, so it
 *     is a deep body with a lit edge where wool is flat all over. The sheen is
 *     only 0.35, and the reason is a bench finding: a rounded figure is mostly
 *     grazing angles, so a larger one lifted the whole garment and made velvet
 *     the *lightest* thing in the dark-coat row — the opposite of the fault it
 *     was put there to fix.
 *   - **flannel / wool** — flannel was `[1.0, 0]` and wool `[0.88, 0.03]`, which
 *     is nothing. It is now the chalky one: lifted (1.05), badly desaturated
 *     (0.68), napped, and half a sheen.
 *   - **flannel / linen** — the two pale ones. Linen is paler still (1.15) but
 *     *crisp*: roughness 0.90 against flannel's 0.99, no nap, no sheen.
 *   - **corduroy / velvet** — same pile family, so they are separated by tone
 *     (0.95 against 0.74) and by corduroy being the only cloth with ribs.
 *   - **knit / corduroy** — both matte and both textured, so: knit is darker
 *     (0.90), totally matte (1.00), and lumpy where corduroy is lined.
 *   - **denim / wool** — denim is deeper (0.83), much more saturated (1.28) and
 *     glossier (0.80), which together is a hard-wearing dyed twill.
 *   - **nylon / silk** — the two sheens that are not lustre. Nylon's is small,
 *     hard and slightly desaturated (0.54 / 0.90); silk's is broad and rich
 *     (0.34 / 1.10) and it is much the lighter of the two.
 *   - **silk / satin** — satin keeps its hard bright line: glossier (0.22) and
 *     properly metallic (0.18) where silk is neither.
 *   - **leather / vinyl** — unchanged reflectances, separated further by tone:
 *     leather is a dark hide (0.88), vinyl a lighter plastic (0.94) with a tiny
 *     mirror highlight.
 *   - **brocade / satin** — brocade carries metal thread through the weave
 *     (0.30) and is rougher for it (0.50), plus the extra chroma of a woven
 *     pattern.
 *   - **sequin / lamé** — both keep the metalness they always had, because what
 *     was wrong with them was never that: a metal with no environment to
 *     reflect renders black, and nothing set one. See `lightTheRoom`. Sequin's
 *     *roughness* did move, 0.22 → 0.42, and that is the pair's whole
 *     distinction made honest — a thousand differently-tilted facets average
 *     to a blurred mirror, one continuous sheet stays a sharp one.
 *
 * ## What this replaced
 *
 * Before the two-column table there was no table at all: sheen was derived from
 * how *saturated* the colour was, which is the specific failure `Fabric` was
 * declared to prevent — a renderer that infers sheen from saturation "ends up
 * deciding that any loud colour is shiny, which makes a bright red wool jacket
 * glitter and a silver knit jumper look like a mirror". `fabric` is required
 * rather than optional and there is no fallback path, because torso, sleeves and
 * legs are one garment and half-wiring them opens a seam at every shoulder.
 */
const FABRIC: Record<Fabric, Cloth> = {
  // A suit. The reference the rest of the table is read against.
  wool: { roughness: 0.86, metalness: 0.03, tone: 1.00, chroma: 1.00 },
  // A thousand separate points of metal, each tilted a different way — which
  // in aggregate is a *blurred* mirror, not a sharp one. Hence roughness 0.42
  // against lamé's 0.15: a sharp metal reflects the room's dark corners as
  // dark patches and the jacket comes out mottled and dim, where a blurred one
  // samples the room's average and reads as an evenly bright garment. That is
  // also what it looks like from the stalls.
  sequin: { roughness: 0.42, metalness: 0.75, tone: 1.00, chroma: 1.00 },
  satin: { roughness: 0.22, metalness: 0.18, tone: 1.02, chroma: 1.06 },
  // The pile traps light between its fibres, so it is the darkest cloth here —
  // and throws it back off the tips at a grazing angle, which is the sheen.
  velvet: {
    roughness: 0.96, metalness: 0.02, tone: 0.74, chroma: 1.16, sheen: 0.35,
  },
  // The same pile, cut into ribs and one stop lighter for it.
  corduroy: {
    roughness: 0.92, metalness: 0.02, tone: 0.95, chroma: 1.08,
    weave: 'rib', sheen: 0.14,
  },
  // Indigo-dyed twill: deeper and louder than wool, and slightly harder.
  denim: {
    roughness: 0.80, metalness: 0.02, tone: 0.83, chroma: 1.28, weave: 'twill',
  },
  leather: { roughness: 0.42, metalness: 0.10, tone: 0.88, chroma: 1.02 },
  // Nothing reflects. The ambient rooms are built on this row.
  knit: {
    roughness: 1.00, metalness: 0, tone: 0.90, chroma: 0.96,
    weave: 'loop', sheen: 0.28,
  },
  // An anorak: slight sheen, and the wrong kind of sheen.
  nylon: { roughness: 0.54, metalness: 0.08, tone: 1.01, chroma: 0.90 },
  // Broad and soft where satin's lustre is a hard bright line.
  silk: { roughness: 0.34, metalness: 0.06, tone: 1.09, chroma: 1.10 },
  // Matte, but pale and crisp — it throws light back rather than eating it.
  linen: { roughness: 0.90, metalness: 0, tone: 1.15, chroma: 0.80 },
  // Metal thread through the weave, not a coating over it.
  brocade: { roughness: 0.50, metalness: 0.30, tone: 1.00, chroma: 1.12 },
  // Lamé: one continuous sheet of metal, where sequin is a thousand points.
  lame: { roughness: 0.15, metalness: 0.90, tone: 1.00, chroma: 1.00 },
  // A small hard plastic highlight. Leather's is soft and wide.
  vinyl: { roughness: 0.08, metalness: 0.25, tone: 0.94, chroma: 1.00 },
  // Brushed until the nap stands up: pale, chalky and grainless, where
  // corduroy's ribs catch a rim light in lines.
  flannel: {
    roughness: 0.99, metalness: 0, tone: 1.05, chroma: 0.68,
    weave: 'nap', sheen: 0.40,
  },
};

/**
 * Bend a colour toward what the cloth does to a dye.
 *
 * `SRGBColorSpace` on both ends is not decoration. `Color` holds working-space
 * (linear) values, and `getHSL`/`setHSL` default to that space — a `tone` of
 * 0.74 applied there is a far bigger jump than 0.74 of perceived lightness, and
 * the table was tuned by eye against what the bench shows. Asking for sRGB makes
 * the number in the table mean the thing it is read as meaning.
 *
 * Returns a hex string rather than a `Color` so the result still pools: two
 * players in the same velvet jacket share one material, exactly as they did
 * before the table grew columns.
 */
function dye(colour: string, tone: number, chroma: number): string {
  if (tone === 1 && chroma === 1) return colour;
  const c = new Color(colour);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl, SRGBColorSpace);
  c.setHSL(
    hsl.h,
    Math.min(1, hsl.s * chroma),
    Math.min(1, Math.max(0, hsl.l * tone)),
    SRGBColorSpace,
  );
  return `#${c.getHexString()}`;
}

export function clothSurface(
  l: Leases, colour: string, fabric: Fabric,
): MeshStandardMaterial {
  const f = FABRIC[fabric];
  return surface(l, dye(colour, f.tone, f.chroma), {
    roughness: f.roughness,
    metalness: f.metalness,
    ...(f.weave ? { weave: f.weave } : {}),
    ...(f.sheen ? { sheen: f.sheen } : {}),
  });
}

// ---------------------------------------------------------------------------
// Weaves
// ---------------------------------------------------------------------------

export type WeaveId = 'rib' | 'twill' | 'loop' | 'nap';

/**
 * The four cloths that are a *surface* rather than a sheen, as height fields.
 *
 * Generated, never loaded: the same argument as the tomato splat one section
 * down — a `DataTexture` exists in Node, so the whole rig stays probe-able
 * headlessly, and it is deterministic, so a corduroy jacket has the same ribs in
 * every run of every show.
 *
 * **Every count here is chosen against the ten-metre view and is coarser than
 * the real cloth.** A torso at the concert camera's distance is a few dozen
 * pixels across; corduroy's real rib pitch is a few millimetres, which at that
 * size is a quarter of a pixel and averages to flat grey — or worse, crawls. So
 * `rib` puts twelve ribs round the whole body, about five across the visible
 * front, which is the finest thing that still resolves. The others are finer
 * only because they are not meant to be counted, just to break the surface up.
 *
 * `height` is sampled on the unit tile and must be periodic in both axes or the
 * seam up the back of the torso lathe becomes a visible stripe. `depth` is the
 * `normalScale`, i.e. how much of the effect survives into the shading.
 */
const WEAVES: Record<WeaveId, { depth: number; height(u: number, v: number): number }> = {
  // Vertical ribs. Twelve round the body, so about five face the audience.
  rib: { depth: 0.75, height: (u) => Math.cos(u * Math.PI * 2 * 12) },
  // Diagonal twill. Equal counts in both axes is what makes it run at 45°.
  twill: {
    depth: 0.55,
    height: (u, v) => Math.cos((u * 20 + v * 20) * Math.PI * 2),
  },
  // Bobbles. Two cosines multiplied is a grid of rounded lumps, and the counts
  // differ because a knitted stitch is wider than it is tall.
  loop: {
    depth: 0.50,
    height: (u, v) => Math.cos(u * Math.PI * 2 * 14) * Math.cos(v * Math.PI * 2 * 18),
  },
  // Nap: no direction at all, which is the point. Seeded value noise summed
  // over a few frequencies, so it is grain rather than a pattern.
  nap: {
    depth: 0.30,
    height: (u, v) => napAt(u, v),
  },
};

/** How wide the tile is. 64² is 48 kB of normal and finer than the eye needs. */
const WEAVE_N = 64;

/**
 * Value noise on a fixed 16×16 lattice, wrapped, so the nap tiles seamlessly.
 *
 * A lattice rather than a hash per texel because per-texel noise at this size is
 * white noise, and white noise in a normal map is a shimmer under a moving
 * light rather than a fabric. The lattice is built once from a fixed seed for
 * the same reason the splat is: the same flannel jacket every show.
 */
const NAP_LATTICE = 16;
const NAP: number[] = (() => {
  const rng = new Rng('flannel-nap');
  return Array.from({ length: NAP_LATTICE * NAP_LATTICE }, () => rng.float(-1, 1));
})();

function napAt(u: number, v: number): number {
  const x = u * NAP_LATTICE;
  const y = v * NAP_LATTICE;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  // Smoothstep, so the lattice does not show as a grid of diamonds.
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const at = (i: number, j: number): number =>
    NAP[((j % NAP_LATTICE) + NAP_LATTICE) % NAP_LATTICE * NAP_LATTICE
      + (((i % NAP_LATTICE) + NAP_LATTICE) % NAP_LATTICE)]!;
  const a = at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx;
  const b = at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx;
  return a * (1 - sy) + b * sy;
}

/**
 * A tangent-space normal map from a height field, by central difference.
 *
 * One texture per *material* rather than one per weave, and that is deliberate:
 * the pool disposes a material's `normalMap` along with it, and a texture shared
 * between two pooled materials would be freed by whichever died first while the
 * other was still drawing with it. 48 kB per distinct cloth colour is the price
 * of that invariant staying a one-liner, and there are perhaps a dozen.
 */
function makeWeaveTexture(id: WeaveId): DataTexture {
  const { height } = WEAVES[id];
  const N = WEAVE_N;
  const data = new Uint8Array(N * N * 4);
  const step = 1 / N;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = (x + 0.5) / N;
      const v = (y + 0.5) / N;
      const du = (height(u + step, v) - height(u - step, v)) / (2 * step);
      const dv = (height(u, v + step) - height(u, v - step)) / (2 * step);
      // The scale on the slope is what turns "how fast the height changes over
      // the whole tile" into a normal that leans by a sane number of degrees.
      const nx = -du * 0.02;
      const ny = -dv * 0.02;
      const len = Math.hypot(nx, ny, 1);
      const o = (y * N + x) * 4;
      data[o] = Math.round(255 * (nx / len * 0.5 + 0.5));
      data[o + 1] = Math.round(255 * (ny / len * 0.5 + 0.5));
      data[o + 2] = Math.round(255 * (1 / len * 0.5 + 0.5));
      data[o + 3] = 255;
    }
  }
  const tex = new DataTexture(data, N, N, RGBAFormat);
  // A normal map is a vector, not a colour: it must not be decoded as sRGB.
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------
// The room every metal reflects
// ---------------------------------------------------------------------------

/**
 * How much of the generated room the scene is allowed to see.
 *
 * One number, shared by the concert and by both benches, because the entire
 * value of a bench is that it does not disagree with the stage. Setting it
 * higher on a bench to "see the fabric better" would mean the fabric table was
 * tuned against a room the audience never gets.
 *
 * `RoomEnvironment` is a bright white studio box, and an environment is the
 * most directionless light there is: a diffuse surface gets very nearly the
 * same helping of it whichever way it faces. Every unit here is therefore a
 * unit that actively erases modelling, and it is spent before a single lantern
 * has been turned on.
 *
 * 0.45 was picked as "less than 1.0" and it was still too much. Measured
 * against the rig it was competing with, on a surface at albedo 0.6 under a
 * mid-level cue, the environment was contributing about 0.27 of diffuse — more
 * than the key light's 0.17 and the hemisphere's 0.12. The brightest,
 * flattest, most shadowless source in the scene was the one nothing in
 * `lights.ts` could see or control, and it was winning. That is the whole
 * reason a dark venue rendered as an evenly lit grey room.
 *
 * 0.16 leaves the environment doing the one job only it can do — filling the
 * shadow side with something other than black, and giving a metal a world to
 * be made of — and hands the rest of the stage back to the fixtures. The
 * metals do not go down with it: see `METAL_ROOM_GAIN`, which was re-derived
 * against this number so that a lamé jacket keeps three quarters of its
 * reflection while the wool beside it loses two thirds of its fill.
 */
const ROOM_INTENSITY = 0.16;

/**
 * Give a scene something for its metals to reflect.
 *
 * A `MeshStandardMaterial` at high metalness has, by construction, **no diffuse
 * response at all** — a metal's colour is entirely the reflection of what is
 * around it. Direct lights only produce a specular lobe, which is a small bright
 * spot and nothing else, so with `scene.environment` unset the rest of the
 * surface falls to black. Nothing in `src/web/concert/` set one, and the
 * measured consequence was that the *reserved* fabrics were the darkest things
 * in the house: `lame` (metalness 0.90) rendered charcoal on a pale coat and
 * near-black on a dark one, `sequin` (0.75) the same, `vinyl` and `brocade`
 * muddied. Those are exactly the cloths `loudFabric` hands to whoever is
 * fronting the number — iskelmä, funk in three eras, latin, arabic — so the lead
 * in the sequinned jacket was the dimmest figure on the stage.
 *
 * Generated rather than loaded, for the same reason nothing else here ships an
 * asset: `RoomEnvironment` is a few boxes and area lights built in code, so
 * there is no HDR to fetch, no CORS, no licence and no second copy of the show
 * that only works online.
 *
 * ## The disposal, which is the part worth reading
 *
 * Three GPU resources exist for a moment here and only one of them survives:
 *
 *   - the `RoomEnvironment` scene's own geometry and materials — thrown away as
 *     soon as it has been photographed, hence `room.dispose()`;
 *   - the `PMREMGenerator`'s blur materials, LOD meshes and ping-pong target —
 *     `pmrem.dispose()`, and it is safe here because `fromScene` allocates the
 *     target it returns *separately* from the ping-pong one it reuses;
 *   - the cube-UV render target itself, which is what `scene.environment` then
 *     points at. That one outlives the call, so its `dispose` is what comes
 *     back to the caller.
 *
 * This directory leases everything else it touches — see `Leases` here and `Kit`
 * in `stage-kit.ts` — and a render target quietly retained for the life of the
 * tab would be the one exception. Returning a handle keeps it honest: a page
 * that tears its renderer down has something to call, and a page that does not
 * has said so by holding the handle for as long as it holds the scene.
 *
 * `three/examples/jsm/*` imports `three` by bare specifier, which is why
 * `vite.config.ts` dedupes it; two copies of three would give the PMREM output a
 * different `Texture` class from the one the renderer checks for, and the
 * failure looks like nothing happening.
 */
export function lightTheRoom(
  renderer: WebGLRenderer, scene: Scene,
): { dispose(): void } {
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  // Blurred, and more than the three.js example uses. The room is a handful of
  // flat-shaded boxes: reflected sharply, a lamé jacket shows their corners and a
  // sequinned one comes out mottled with the room's dark patches. A quarter of a
  // radian of pre-blur is enough that what a metal samples is the room's *average*
  // brightness, which is the thing a garment at ten metres is actually made of.
  const target = pmrem.fromScene(room, 0.25);
  room.dispose();
  pmrem.dispose();

  scene.environment = target.texture;
  scene.environmentIntensity = ROOM_INTENSITY;

  return {
    dispose(): void {
      if (scene.environment === target.texture) scene.environment = null;
      target.dispose();
    },
  };
}

/** Shift a colour toward black or white. Returns a hex string, so it pools. */
export function shade(colour: string, amount: number): string {
  const c = new Color(colour);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + amount)));
  return `#${c.getHexString()}`;
}

// ---------------------------------------------------------------------------
// The tomato
// ---------------------------------------------------------------------------

/**
 * One splat texture, generated as raw bytes rather than through a canvas.
 *
 * A `DataTexture` costs 16 kB and, unlike `document.createElement('canvas')`,
 * exists in Node — which is what lets the whole rig be probed headlessly. It is
 * also deterministic from a fixed seed, so the splat has the same silhouette in
 * every run of every show; per-hit variety comes from rotating and scaling the
 * quad, which is free.
 */
function makeSplatTexture(): DataTexture {
  const N = 64;
  const data = new Uint8Array(N * N * 4);
  const rng = new Rng('tomato-splat');
  const blobs: { x: number; y: number; r: number }[] = [{ x: 0.5, y: 0.5, r: 0.28 }];
  for (let i = 0; i < 7; i++) {
    const a = rng.float(0, Math.PI * 2);
    const d = rng.float(0.16, 0.30);
    blobs.push({ x: 0.5 + Math.cos(a) * d, y: 0.5 + Math.sin(a) * d, r: rng.float(0.07, 0.16) });
  }
  for (let i = 0; i < 11; i++) {
    const a = rng.float(0, Math.PI * 2);
    const d = rng.float(0.32, 0.46);
    blobs.push({ x: 0.5 + Math.cos(a) * d, y: 0.5 + Math.sin(a) * d, r: rng.float(0.015, 0.05) });
  }
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = (x + 0.5) / N;
      const v = (y + 0.5) / N;
      let f = 0;
      for (const b of blobs) {
        const dx = u - b.x;
        const dy = v - b.y;
        const t = 1 - Math.sqrt(dx * dx + dy * dy) / b.r;
        if (t > f) f = t;
      }
      const alpha = f <= 0 ? 0 : Math.min(1, f * 5);
      // Darker at the rim, so the mark has a skin rather than being a blot.
      const lit = 0.5 + 0.5 * Math.min(1, f * 2.4);
      const o = (y * N + x) * 4;
      data[o] = Math.round(255 * (0.20 + 0.72 * lit));
      data[o + 1] = Math.round(255 * 0.14 * lit);
      data[o + 2] = Math.round(255 * 0.10 * lit);
      data[o + 3] = Math.round(255 * alpha);
    }
  }
  const tex = new DataTexture(data, N, N, RGBAFormat);
  tex.colorSpace = SRGBColorSpace;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * The one material every splat on every performer shares.
 *
 * `depthWrite: false` plus a polygon offset keeps a decal pressed against a
 * curved body without z-fighting, and `alphaTest` keeps it out of the
 * transparency sort — a stage with thirty splats on it should not reorder
 * itself when the camera cuts.
 */
export function splatSurface(l: Leases): MeshStandardMaterial {
  return l.material('splat', () => new MeshStandardMaterial({
    map: makeSplatTexture(),
    transparent: true,
    alphaTest: 0.04,
    depthWrite: false,
    roughness: 0.35,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
    side: DoubleSide,
  }));
}
