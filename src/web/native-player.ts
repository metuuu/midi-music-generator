/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * A native player for the IR, and the demo that decides whether the game goal
 * is reachable this way.
 *
 * ## Why this exists at all
 *
 * `docs/engine-gaps.md` §3.21: the audition cannot hold a note across a
 * barline. `buildNoteGrid` may not open a bar group with a sustain marker,
 * because that is a parse error in mini-notation, so a note that crosses a
 * barline is **re-stated** there instead of continued. Measured over 380 songs,
 * that re-articulates 50.5% of pad notes and changes the written length of
 * 95.7% of them; `ambient`/`drone` at seed `padproof` holds one chord for 64
 * beats and comes out as sixteen attacks.
 *
 * The layer the layered-ambient goal is built on is the layer the audition is
 * least faithful to, and the constraint belongs to mini-notation rather than to
 * this project — so it cannot be fixed in `render/strudel.ts`. It can only be
 * fixed by not going through text. That is this file.
 *
 * ## What it is not
 *
 * **Not a replacement for the audition, and not finished.** It plays notes,
 * shapes them with the track's own `Envelope`, and gives every layer a gain
 * that can be moved while the music is sounding. It does not do drums, effects,
 * reverb, delay, the duck, bends, rolls or the sung voice. Those are the second
 * demo; this one exists to answer three questions and stop.
 *
 * ## The one Strudel import, and why it is still here
 *
 * `getFontBufferSource` is 35 lines in `@strudel/soundfonts/fontloader.mjs`:
 * find the zone whose key range covers the pitch, set `playbackRate` from
 * `originalPitch`/`coarseTune`/`fineTune`, honour the loop points. Replacing it
 * is a scoped and separate ~80 lines — the assets are base64 MP3 inside
 * evaluated JavaScript rather than SF2, so a replacement is a fetch, a string
 * split, a decode and a zone lookup.
 *
 * It is deliberately **not** replaced here, because this demo is a test of the
 * *scheduler and the layer gains*, which are the parts nobody has proved. Using
 * the font loader that the audition already uses is also what makes the third
 * acceptance criterion meaningful: if the note comes out at a different pitch
 * or a different timbre, the fault is mine and not the sample's.
 *
 * ## What it must show
 *
 *  1. **A 64-beat drone sounds once.** One attack, not sixteen.
 *  2. **`setLayerGain('pad', 0, 1.5)` fades a pad that is already ringing**, in
 *     1.5 seconds, without touching the bass — not at the next bar, and without
 *     regenerating anything. This is the one the audition structurally cannot
 *     do: superdough triggers an independent voice per event, so swapping the
 *     pattern leaves everything already scheduled alone, and the orbit gain that
 *     could carry a fade is overwritten by `Orbit.duck` on every kick.
 *  3. **It sounds like the same instrument as the audition.** Same font, same
 *     zone, same `playbackRate`.
 *
 * ## The shape, and the one decision in it
 *
 * Two gain stages per layer, in series, and that is the whole architecture:
 *
 *     source → envelope gain → LAYER gain → master → limiter → out
 *
 * The envelope gain belongs to one note and dies with it. The **layer** gain
 * belongs to the layer and outlives every note through it, which is what makes
 * a fade audible on a sounding drone. Keeping them apart is also what lets a
 * duck ride a third node later without fighting either — the thing superdough
 * cannot offer, because there the duck and the mix share one param.
 */

import { getAudioContext, getSound } from '@strudel/webaudio';
import { getFontBufferSource } from '@strudel/soundfonts';
import GM_FONTS from '@strudel/soundfonts/gm.mjs';
import { secondsAt } from '../core/grid.js';
import { songTempo, type Envelope, type LayerId, type Song, type Track } from '../core/types.js';

/**
 * How far ahead to schedule, and how often to look.
 *
 * A note is handed to Web Audio with an absolute `AudioContext` time, so the
 * only job of the loop is to stay far enough ahead that a slow frame cannot
 * make it late. 200 ms of lookahead at a 50 ms tick is six chances to place
 * every note before it is due — generous, and cheap, because scheduling a note
 * is one buffer source and two gain nodes.
 *
 * Deliberately not one pass over the whole song at load: a piece runs to five
 * minutes and a `setLayerGain` has to be able to reach a note that has not been
 * created yet. A lookahead window is what makes the gain live rather than a
 * property of the schedule.
 */
const LOOKAHEAD_SECONDS = 0.2;
const TICK_MS = 50;

/**
 * The default envelope for a track that declares none.
 *
 * Struck rather than sustained, because the soundfont loader turns on
 * `src.loop` for any zone with loop points — so a held note with no envelope is
 * a slice of sample cycling at constant level, which is the failure
 * `core/types.ts` describes as a vibraphone becoming a small organ.
 */
const DEFAULT_ENVELOPE: Envelope = { attack: 0.01, decay: 0.2, sustain: 1, release: 0.1 };

interface Scheduled {
  /** Stopped on `stop()`; a note already sounding has to be reachable. */
  source: AudioBufferSourceNode;
  gain: GainNode;
  /** When the whole thing is finished and can be forgotten. */
  endsAt: number;
}

export class NativePlayer {
  private readonly ctx: AudioContext;
  private readonly master: GainNode;
  private readonly limiter: DynamicsCompressorNode;
  private readonly layers = new Map<LayerId, GainNode>();

  private song: Song | undefined;
  private timer: number | undefined;
  /** `AudioContext.currentTime` at beat 0. The clock, and the only one. */
  private origin = 0;
  /** Index into each track's notes, so the loop never rescans. */
  private cursor = new Map<Track, number>();
  private live: Scheduled[] = [];

  constructor() {
    this.ctx = getAudioContext();
    this.master = this.ctx.createGain();
    /**
     * The same brickwall the Strudel path installs, and for the same measured
     * reason: the mix peaks at 1.03–1.09, so something has to catch it. A
     * compressor at a 20:1 ratio on a 0 dB threshold with no knee is a limiter.
     */
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -1;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.1;
    this.master.connect(this.limiter).connect(this.ctx.destination);
  }

  /**
   * One gain per layer, made on demand and never destroyed.
   *
   * Never destroyed because `setLayerGain` may be called for a layer that is
   * silent at the time — a game ducking the pad before the pad has entered
   * should not be a no-op that becomes a surprise four bars later.
   */
  private layerGainNode(layer: LayerId): GainNode {
    let node = this.layers.get(layer);
    if (!node) {
      node = this.ctx.createGain();
      node.connect(this.master);
      this.layers.set(layer, node);
    }
    return node;
  }

  /**
   * Fetch and decode every note this song will ask for, before it asks.
   *
   * The same argument as `web/audio.ts`'s `warm`: nothing loads a sound until
   * it is triggered, so without this the opening of a number arrives while its
   * band is still on the wire. One request per distinct pitch per track, which
   * is what the font loader caches on.
   */
  async load(song: Song): Promise<void> {
    this.song = song;
    for (const track of song.tracks) {
      const font = GM_FONTS[track.strudelSound]?.[0];
      if (!font) {
        // A registered sample name rather than a soundfont. Touch it so the
        // fetch starts; see the same branch in `web/audio.ts`.
        try { getSound(track.strudelSound); } catch { /* not registered yet */ }
        continue;
      }
      await Promise.all(
        [...new Set(track.notes.map((n) => n.midi))]
          .map((midi) => getFontBufferSource(font, { note: midi }, this.ctx).catch(() => undefined)),
      );
    }
  }

  /** Layers this song actually carries, in IR order. */
  layerIds(): LayerId[] {
    return [...new Set((this.song?.tracks ?? []).map((t) => t.layer))];
  }

  start(): void {
    if (!this.song || this.timer !== undefined) return;
    this.origin = this.ctx.currentTime + 0.1;
    this.cursor = new Map();
    this.timer = window.setInterval(() => this.pump(), TICK_MS);
    this.pump();
  }

  stop(): void {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
    for (const s of this.live) {
      try { s.source.stop(); } catch { /* already finished */ }
    }
    this.live = [];
  }

  /**
   * Move a layer's gain, over `seconds`, from wherever it is now.
   *
   * **The whole game-facing surface, and the reason this file exists.** It
   * reaches notes that are already sounding, because the ramp is on the layer's
   * node rather than on any note's — which is the thing the audition cannot do
   * at any price.
   *
   * `linearRampToValueAtTime` needs a starting point the ramp can be measured
   * from, and `value` alone is not one while another ramp is in flight, so the
   * current value is pinned with `setValueAtTime` first. A zero target is legal
   * here where it would not be on an exponential ramp.
   */
  setLayerGain(layer: LayerId, gain: number, seconds = 0): void {
    const node = this.layerGainNode(layer);
    const now = this.ctx.currentTime;
    node.gain.cancelScheduledValues(now);
    node.gain.setValueAtTime(node.gain.value, now);
    if (seconds <= 0) node.gain.setValueAtTime(gain, now);
    else node.gain.linearRampToValueAtTime(gain, now + seconds);
  }

  layerGain(layer: LayerId): number {
    return this.layers.get(layer)?.gain.value ?? 1;
  }

  /** The beat that is sounding, inverted from the audio clock. */
  beat(): number {
    if (!this.song) return 0;
    const tempo = songTempo(this.song.meta);
    const elapsed = this.ctx.currentTime - this.origin;
    // Walk rather than search: the map is a dozen points and this is called
    // once per frame at most.
    let beat = 0;
    while (beat < 10_000 && secondsAt(tempo, beat + 1) < elapsed) beat += 1;
    return beat;
  }

  /**
   * Schedule everything now due, and forget everything finished.
   *
   * The cursor per track is what keeps this O(notes scheduled) rather than
   * O(notes in song) per tick — a five-minute ambient piece is a few hundred
   * notes and a 50 ms tick is twelve hundred ticks a minute.
   */
  private pump(): void {
    if (!this.song) return;
    const tempo = songTempo(this.song.meta);
    const horizon = this.ctx.currentTime + LOOKAHEAD_SECONDS;

    for (const track of this.song.tracks) {
      let i = this.cursor.get(track) ?? 0;
      while (i < track.notes.length) {
        const note = track.notes[i]!;
        const at = this.origin + secondsAt(tempo, note.beat);
        if (at > horizon) break;
        void this.fire(track, note.midi, note.velocity, at,
          secondsAt(tempo, note.beat + note.duration) - secondsAt(tempo, note.beat));
        i += 1;
      }
      this.cursor.set(track, i);
    }

    const now = this.ctx.currentTime;
    this.live = this.live.filter((s) => s.endsAt > now);
  }

  /**
   * One note: a buffer source, its own envelope gain, into the layer's gain.
   *
   * The envelope is the track's own — attack, decay to sustain, release at the
   * end. `sustain: 0` means struck, and a struck note ignores its written
   * length entirely, which is what `core/types.ts` says it is for: a mallet
   * rings out rather than being cut where the notation stopped.
   */
  private async fire(
    track: Track, midi: number, velocity: number, at: number, seconds: number,
  ): Promise<void> {
    const font = GM_FONTS[track.strudelSound]?.[0];
    if (!font) return;
    let source: AudioBufferSourceNode;
    try {
      source = await getFontBufferSource(font, { note: midi }, this.ctx);
    } catch {
      return;
    }
    // The await may have taken us past the moment; a note that is already late
    // is played now rather than dropped, which is what the ear expects.
    const start = Math.max(at, this.ctx.currentTime);

    const env = track.envelope ?? DEFAULT_ENVELOPE;
    const peak = Math.max(0.0001, velocity * track.gain);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + env.attack);

    let endsAt: number;
    if (env.sustain <= 0) {
      // Struck: decay to silence from its own attack, and pay no attention to
      // how long the note was written for.
      gain.gain.exponentialRampToValueAtTime(0.0001, start + env.attack + env.decay);
      endsAt = start + env.attack + env.decay;
    } else {
      const held = Math.max(env.attack + 0.01, seconds);
      gain.gain.linearRampToValueAtTime(peak * env.sustain, start + env.attack + env.decay);
      gain.gain.setValueAtTime(peak * env.sustain, start + held);
      gain.gain.linearRampToValueAtTime(0.0001, start + held + env.release);
      endsAt = start + held + env.release;
    }

    source.connect(gain).connect(this.layerGainNode(track.layer));
    source.start(start);
    source.stop(endsAt + 0.05);
    this.live.push({ source, gain, endsAt });
  }
}
