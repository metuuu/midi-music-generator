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
  export interface StrudelRepl {
    /**
     * Compile and load. `autostart` defaults to true; passing false loads the
     * pattern without starting the clock, which is what lets a caller decide
     * when bar 1 happens — see `loadCode`/`startLoaded` in `web/audio.ts`.
     */
    evaluate(code: string, autostart?: boolean, hush?: boolean): Promise<unknown>;
    /** Start the clock on the loaded pattern, from cycle 0. */
    start(): Promise<void>;
    stop(): void;
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
}
