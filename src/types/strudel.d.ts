/**
 * Minimal ambient declarations for the Strudel packages we touch.
 *
 * Only the entry points the audition page uses are typed. Keeping this surface
 * deliberately tiny is part of the swappability story: if Strudel is ever
 * dropped, this file plus `render/strudel.ts` and `web/audio.ts` are the only
 * things that go with it.
 *
 * Note we use the *granular* packages rather than the bundled `@strudel/web`.
 * `@strudel/web` inlines its own copy of `@strudel/core`, so soundfonts
 * registered via `@strudel/soundfonts` would land in a different registry and
 * simply never play.
 */

declare module '@strudel/core' {
  export function evalScope(...modules: unknown[]): Promise<void>;
  export const controls: Record<string, unknown>;
  export function repl(options: Record<string, unknown>): StrudelRepl;
  /**
   * A pattern, opaque. Nothing here inspects one — they are made by `evaluate`,
   * combined by `stack`, and handed to the scheduler.
   */
  export interface Pattern { readonly __pattern: unique symbol }
  /** The pattern that plays nothing, for a player who has been taken out. */
  export const silence: Pattern;
  /** Everything at once. */
  export function stack(...patterns: Pattern[]): Pattern;
  /**
   * A pattern that asks `accessor` what it is on every query.
   *
   * The whole of how a running band changes one player without being rebuilt:
   * the scheduler holds a stack of these, and swapping what the accessor returns
   * needs no transpile, no evaluation and no `setPattern`. Strudel's own note on
   * it is "exposes a custom value at query time. basically allows mutating state
   * without evaluation". See `loadBand` in `web/audio.ts`.
   */
  export function ref(accessor: () => Pattern): Pattern;
  /**
   * Code to pattern, with no scheduler involved.
   *
   * The half of `StrudelRepl.evaluate` that does the work, without the half that
   * installs the result as *the* pattern — which is what lets one layer be
   * compiled while the band goes on playing.
   */
  export function evaluate(
    code: string, transpiler?: unknown, options?: unknown,
  ): Promise<{ pattern: unknown }>;
  export interface StrudelRepl {
    /**
     * Compile and load. `autostart` defaults to true; passing false loads the
     * pattern without starting the clock, which is what lets a caller decide
     * when bar 1 happens — see `loadCode`/`startLoaded` in `web/audio.ts`.
     */
    evaluate(code: string, autostart?: boolean, hush?: boolean): Promise<unknown>;
    /** Install an already-built pattern, skipping the transpiler entirely. */
    setPattern(pattern: Pattern, autostart?: boolean): Promise<unknown>;
    /** Cycles per second. `setcpm(n)` in evaluated code is this with `n / 60`. */
    setCps(cps: number): void;
    /** Start the clock on the loaded pattern, from cycle 0 — or from wherever
     * `pause` left it, which is the difference between the two ways of
     * stopping below. */
    start(): Promise<void>;
    /** Stop and rewind: the scheduler's tick and phase both go back to zero. */
    stop(): void;
    /** Stop and hold: the timer is cleared and the phase is kept, so `start`
     * resumes the bar rather than the song. See `pausePlayback`. */
    pause(): void;
    scheduler: StrudelScheduler;
  }
  /**
   * The clock, as far as we need it.
   *
   * `now()` is the cycle position currently being *queried*, which is not the
   * one being heard: haps are scheduled `latency` seconds into the future. The
   * concert reads the last three fields instead and inverts Strudel's own
   * scheduling formula, which gives the audible position exactly rather than
   * approximately. See `web/concert/transport.ts`.
   */
  export interface StrudelScheduler {
    now(): number;
    started: boolean;
    cps: number;
    /** Fixed offset, in seconds, between scheduling a hap and hearing it. */
    latency: number;
    /** Cycle position at the last tempo change. */
    num_cycles_at_cps_change: number;
    /** Audio-clock time, in seconds, at that same moment. */
    seconds_at_cps_change: number;
  }
}

declare module '@strudel/mini' {}
declare module '@strudel/tonal' {}

declare module '@strudel/transpiler' {
  export const transpiler: unknown;
}

declare module '@strudel/webaudio' {
  import type { StrudelRepl } from '@strudel/core';
  export function webaudioRepl(options?: Record<string, unknown>): StrudelRepl;
  export function initAudioOnFirstClick(options?: Record<string, unknown>): Promise<void>;
  export function getAudioContext(): AudioContext;
  export function registerSynthSounds(): void;
  export function registerZZFXSounds(): void;
  export function samples(url: string | Record<string, unknown>, base?: string): Promise<void>;
  export const webaudioOutput: unknown;
  /**
   * One sound, scheduled directly. `t` is absolute time on the audio clock —
   * superdough warns and drops anything already past — and `hapDuration` is how
   * long the note is held, in seconds, before its release begins.
   *
   * This is what the pattern engine calls per event, so a note played through
   * it takes exactly the path a generated song takes.
   */
  export function superdough(
    value: Record<string, unknown>,
    t: number,
    hapDuration: number,
    cps?: number,
  ): Promise<void>;
  /**
   * The object that owns the path from the orbit buses to the speakers.
   *
   * Typed only as far as the one node we need to splice into — see the master
   * limiter in `web/audio.ts` — and every field is optional on purpose, because
   * this is the one place here that reaches past Strudel's documented surface
   * and a version bump is allowed to take it away without taking the audio too.
   */
  export function getSuperdoughAudioController(): {
    output?: { destinationGain?: GainNode | null };
  };
  /**
   * A registered sound, under the name the trigger path looks it up by — which
   * for a banked sample is `bank_name`, lower case. `data.samples` is the bank
   * `samples()` resolved: the URLs, absolute, in `.n()` order.
   */
  export function getSound(name: string): { data?: { samples?: unknown } } | undefined;
  /**
   * Fetch and decode the sample a hap would play, into the sampler's own cache.
   *
   * The half of `onTriggerSample` that touches the network, without the half
   * that schedules a node — which is exactly what preloading wants. See
   * `preloadSounds` in `web/audio.ts`.
   */
  export function getSampleBuffer(
    value: Record<string, unknown>, bank: unknown,
  ): Promise<{ buffer: AudioBuffer; playbackRate: number }>;
}

declare module '@strudel/soundfonts/gm.mjs' {
  /** GM soundfont name (`gm_vibraphone`) to the banks registered for it. */
  const gm: Record<string, string[]>;
  export default gm;
}

declare module '@strudel/soundfonts' {
  export function registerSoundfonts(): void;
  /** Point the loader at a self-hosted copy of the soundfont data. */
  export function setSoundfontUrl(url: string): void;
  /**
   * Fetch, decode and cache one pitch of one soundfont, returning a source
   * ready to be started.
   *
   * The loader caches by font and pitch and holds the *promise*, so calling
   * this ahead of time is what makes the trigger's own call free — it discards
   * the node and keeps the cache. See `preloadSounds` in `web/audio.ts`.
   */
  export function getFontBufferSource(
    font: string, value: { note: number }, ctx: BaseAudioContext,
  ): Promise<AudioBufferSourceNode>;
}
