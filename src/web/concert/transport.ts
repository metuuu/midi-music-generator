/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * What beat is it?
 *
 * Every other system on this stage depends on the answer, to within a few
 * milliseconds, on every frame — and getting it wrong is the single most likely
 * way for the whole thing to look cheap. A drummer whose stick lands 80ms after
 * the snare does not look "slightly off"; it looks like a video playing behind
 * a soundtrack, which is exactly what it is.
 *
 * ## The geometry of the problem
 *
 * `render/strudel.ts` emits the song as one pattern of `<bar bar bar …>`, which
 * steps one bar per cycle, and sets `setcpm(bpm / beatsPerBar)`. So the mapping
 * is unusually clean:
 *
 *     cycle == bar        beat = cycle * beatsPerBar
 *     cps = bpm / 60 / beatsPerBar
 *
 * ## Why not `scheduler.now()`
 *
 * Strudel exposes one, and it is the obvious thing to reach for. It reports the
 * position being *queried*, not the position being *heard*: haps are handed to
 * Web Audio with a fixed `latency` (0.1s by default) so that the browser has
 * time to actually play them. Animating from `now()` would put every hand a
 * tenth of a second early — visible on every single drum hit, and the sort of
 * error that gets diagnosed as "the animation feels floaty" rather than as a
 * clock bug.
 *
 * So we invert Strudel's own scheduling formula instead. It schedules a hap at
 * cycle `c` for audio time
 *
 *     t(c) = (c - C0) / cps + T0 + latency
 *
 * where `C0`/`T0` are the cycle and audio-clock time at the last tempo change.
 * Solving for `c` gives the cycle currently *sounding*:
 *
 *     c(t) = C0 + (t - T0 - latency) * cps
 *
 * That is exact by construction rather than approximate, because it is the same
 * equation the audio came out of, run backwards.
 *
 * ## Rules
 *
 * - **One clock, and it is the audio clock.** Position derives from
 *   `AudioContext.currentTime`, never from accumulated `requestAnimationFrame`
 *   deltas. Frame time is for interpolation only.
 * - **Sample it once per frame.** The frame takes one `beat()` at the top and
 *   passes that number to every system. Two systems sampling independently
 *   within a frame will disagree by a fraction of a millisecond, which is
 *   harmless, and will keep disagreeing in a way that is impossible to debug.
 * - **Anticipation is a lookahead, not a latency hack.** A stick has to be up
 *   before the hit, so the animation reads the *future* — see `Gesture.prep`.
 *   Do not try to solve that here by biasing the clock; a clock that lies makes
 *   every system that reads it wrong in a different way.
 */

import { getAudioContext } from '@strudel/webaudio';

import type { Song } from '../../core/types.js';
import { initAudio } from '../audio.js';

export type TransportState = 'stopped' | 'playing';

export interface Transport {
  /**
   * Position within the number that is sounding, in beats, fractional.
   *
   * Wrapped to the song's length, because Strudel loops the pattern and the
   * visuals must follow what is actually audible rather than what a counter
   * says. See `elapsed()` for the un-wrapped figure.
   */
  beat(): number;
  /** Beats since this number began, un-wrapped. What "are we done yet" reads. */
  elapsed(): number;
  state(): TransportState;
  /**
   * The latency being compensated for, in seconds. Exposed for diagnostics —
   * if the stage ever looks early or late, this is the number to print.
   */
  readonly lag: number;
}

export interface ConcertTransport extends Transport {
  /**
   * Bind to a number that is about to play.
   *
   * **The scheduler must have been stopped first.** Strudel's cycle counter is
   * global and `<a b c>` indexes it with `floor(cycle) mod n`, so swapping
   * patterns on a running clock at cycle 137.4 starts a 32-bar song at bar 9
   * rather than bar 0. A full stop resets the counter, and there is applause
   * between numbers anyway, so it costs nothing.
   *
   * **`song` is always the whole number, and `fromBar` is where the pattern
   * was cut.** That pairing is the whole of how a jump works here: the
   * scheduler is given a slice (see `sliceSong`) and reports zero at the cut,
   * while everything that reads this transport — the cue timeline, the camera
   * plan, the gesture lists, all of them built against the uncut number at
   * staging time — needs the position in the *piece*. So the offset is added
   * back here, once, and no other system learns that a jump ever happened.
   */
  begin(song: Song, fromBar?: number): void;
  end(): void;
  /**
   * Which bar of `song` the scheduler's own bar zero is. 0 unless jumped.
   *
   * Read by anything that has to turn a position in the *piece* back into a
   * position in the *pattern* — the scrub bar, and the singer, whose phrases
   * are placed against the scheduler rather than against the score.
   */
  offsetBars(): number;
}

export function createTransport(): ConcertTransport {
  let song: Song | undefined;
  /** Cached so a frame that fires before the scheduler exists reads 0, not NaN. */
  let lag = 0.1;
  /** The bar of `song` that the scheduler is calling bar zero. See `begin`. */
  let offset = 0;

  function audibleCycle(): number {
    if (!song) return 0;
    const repl = currentRepl();
    const ctx = audioContext();
    if (!repl || !ctx || !repl.scheduler.started) return 0;

    const s = repl.scheduler;
    lag = s.latency ?? 0.1;
    // Before the first tempo change is registered these are undefined, and the
    // pattern is not sounding yet either. Zero is the honest answer.
    if (s.seconds_at_cps_change === undefined || !s.cps) return 0;

    const cycle = s.num_cycles_at_cps_change
      + (ctx.currentTime - s.seconds_at_cps_change - lag) * s.cps;
    // The pattern has been evaluated but its first cycle has not arrived.
    return cycle > 0 ? cycle : 0;
  }

  return {
    begin(next, fromBar = 0) {
      song = next;
      offset = Math.max(0, Math.min(Math.floor(fromBar), next.meta.totalBars - 1));
    },
    end() { song = undefined; offset = 0; },
    offsetBars: () => offset,

    beat() {
      if (!song) return 0;
      const { totalBars, beatsPerBar } = song.meta;
      /**
       * The loop is the *slice's*, not the piece's.
       *
       * Strudel wraps `<a b c>` at the length of the pattern it was given, and
       * after a jump that pattern is `totalBars - offset` long. Wrapping the
       * raw cycle at `totalBars` instead — which is what this did before there
       * was an offset, correctly, because the two were the same number — would
       * have the visuals carry straight on through a loop the ear had already
       * taken, and drift by a whole slice every time round.
       */
      const bars = Math.max(1, totalBars - offset);
      const bar = audibleCycle() % bars;
      return (offset + ((bar % bars) + bars) % bars) * beatsPerBar;
    },

    elapsed() {
      // Un-wrapped and offset, so "are we done yet" is still asked of the whole
      // number: at the end of the slice this reaches `totalBars * beatsPerBar`
      // exactly, whatever bar the jump started from.
      return song ? (offset + audibleCycle()) * song.meta.beatsPerBar : 0;
    },

    state() {
      const repl = currentRepl();
      return repl?.scheduler.started ? 'playing' : 'stopped';
    },

    get lag() { return lag; },
  };
}

// ---------------------------------------------------------------------------

/**
 * The repl, if it has finished booting.
 *
 * `initAudio()` is a promise and a frame cannot await one, so this keeps the
 * resolved instance to hand and reports "not yet" rather than blocking. A few
 * frames of a stationary stage while the soundfonts load is the correct
 * behaviour — nothing is sounding yet either.
 */
let repl: Awaited<ReturnType<typeof initAudio>> | undefined;
void initAudio().then((r) => { repl = r; }).catch(() => { /* main.ts reports it */ });
const currentRepl = () => repl;

let ctx: AudioContext | undefined;
function audioContext(): AudioContext | undefined {
  if (!ctx) {
    try { ctx = getAudioContext(); } catch { return undefined; }
  }
  return ctx;
}
