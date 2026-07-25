/**
 * Deterministic seeded RNG.
 *
 * The whole generator must be reproducible: a given seed always yields the
 * identical song. That lets a game ship "station playlists" as a list of seeds
 * instead of audio, and lets us reproduce a bug from a single number.
 */

/** mulberry32 — small, fast, good enough distribution for musical choices. */
export class Rng {
  private state: number;

  constructor(seed: number | string) {
    this.state = typeof seed === 'string' ? hashString(seed) : seed >>> 0;
    // Discard the first few outputs; mulberry32 is weak on the very first draw
    // for small integer seeds, which matters because we often seed with 1,2,3.
    for (let i = 0; i < 4; i++) this.next();
  }

  /** Uniform float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Uniform float in [min, max). */
  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Uniform pick from a non-empty array. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: empty array');
    return items[Math.floor(this.next() * items.length)]!;
  }

  /**
   * Weighted pick. Accepts either `[item, weight]` tuples or objects carrying a
   * `weight` field (defaulting to 1). Style tables use this heavily so that
   * "idiomatic" options dominate while rarer colours still surface occasionally.
   */
  weighted<T>(items: readonly (readonly [T, number])[]): T {
    let total = 0;
    for (const [, w] of items) total += w;
    if (total <= 0) throw new Error('Rng.weighted: total weight must be > 0');
    let r = this.next() * total;
    for (const [item, w] of items) {
      r -= w;
      if (r < 0) return item;
    }
    return items[items.length - 1]![0];
  }

  weightedBy<T>(items: readonly T[], weightOf: (item: T) => number): T {
    return this.weighted(items.map((i) => [i, weightOf(i)] as const));
  }

  /** Fisher-Yates, returns a new array. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j]!, out[i]!];
    }
    return out;
  }

  /** Derive an independent child stream, so adding a layer can't reshuffle others. */
  fork(tag: string): Rng {
    return new Rng(hashString(tag + ':' + this.int(0, 0x7fffffff)));
  }
}

export function hashString(s: string): number {
  // FNV-1a
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
