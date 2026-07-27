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
  ConeGeometry, CylinderGeometry, DataTexture, DoubleSide, LatheGeometry,
  LinearFilter, Material, MeshStandardMaterial, PlaneGeometry, RGBAFormat,
  SRGBColorSpace, SphereGeometry, TorusGeometry, Vector2,
} from 'three';

import { Rng } from '../../core/rng.js';

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
        // The pool made the texture too, so the pool disposes it.
        const m = entry.value as Material & { map?: { dispose(): void } | null };
        m.map?.dispose();
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
 * Sphere of diameter 1, at three resolutions.
 *
 * The split is worth the three keys: a head is a silhouette the audience reads
 * from the back of the room, a palm is a blob, and an iris is four pixels. At
 * 352 / 192 / 80 triangles they are 5 kB of vertex data between them and they
 * take about 2000 triangles per performer off the frame.
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

/** Capsule of diameter 1 and total length 2, centred. Feet, limbs, lips. */
export const pill = (l: Leases): CapsuleGeometry =>
  l.geometry('pill', () => new CapsuleGeometry(0.5, 1, 2, 8));

/** Cylinder of diameter 1 and height 1. Hat crowns, brims, ear cups. */
export const tube = (l: Leases): CylinderGeometry =>
  l.geometry('tube', () => new CylinderGeometry(0.5, 0.5, 1, 14));

/** Cone of diameter 1 and height 1. A beehive is a cone and always was. */
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
 * A hood: a sphere with a face-sized bite out of the front.
 *
 * `phiLength` short of a full turn is the whole trick — the opening is a hole
 * in the geometry rather than a hole in a texture, which is the only version
 * that survives being lit from the side.
 */
export const hoodShell = (l: Leases): SphereGeometry =>
  l.geometry('hood', () => new SphereGeometry(
    0.5, 16, 12, Math.PI * 0.30, Math.PI * 1.40, 0, Math.PI * 0.78,
  ));

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

export interface Finish {
  roughness?: number;
  metalness?: number;
  /** For open shells — a hood seen from inside is still a hood. */
  doubleSide?: boolean;
  opacity?: number;
}

function materialKey(colour: string, f: Finish): string {
  return [
    colour, f.roughness ?? 0.8, f.metalness ?? 0, f.doubleSide ? 'd' : 's',
    f.opacity ?? 1,
  ].join('|');
}

export function surface(l: Leases, colour: string, f: Finish = {}): MeshStandardMaterial {
  const key = materialKey(colour, f);
  return l.material(key, () => new MeshStandardMaterial({
    color: new Color(colour),
    roughness: f.roughness ?? 0.8,
    metalness: f.metalness ?? 0,
    ...(f.doubleSide ? { side: DoubleSide } : {}),
    transparent: (f.opacity ?? 1) < 1,
    opacity: f.opacity ?? 1,
  }));
}

export const skinSurface = (l: Leases, colour: string): MeshStandardMaterial =>
  surface(l, colour, { roughness: 0.62, metalness: 0 });

export const hairSurface = (l: Leases, colour: string): MeshStandardMaterial =>
  surface(l, colour, { roughness: 0.72, metalness: 0.03 });

/**
 * Cloth, with its sheen derived from how loud the colour is.
 *
 * A defensible piece of rendering licence rather than a costume decision: the
 * IR gives four colours and no fabric, and a sequinned tanssilava jacket and a
 * matte wool suit are the same four fields. Saturation is the one signal
 * already in the data that separates them — nobody makes a matte jacket in that
 * pink — so bright colours get a little metalness and dull ones stay flat. The
 * genre still chose the colour; this only decides what light does to it.
 */
export function clothSurface(l: Leases, colour: string): MeshStandardMaterial {
  const hsl = { h: 0, s: 0, l: 0 };
  new Color(colour).getHSL(hsl);
  const loud = Math.max(0, hsl.s - 0.25) / 0.75;
  return surface(l, colour, {
    roughness: 0.88 - 0.42 * loud,
    metalness: 0.03 + 0.42 * loud,
  });
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
