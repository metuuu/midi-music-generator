/**
 * The vocal layer, sung by `voice-synth.ts` instead of played by Strudel.
 *
 * A bridge between two clocks that both already exist and have never met. It is
 * a file of its own because it belongs to neither: `web/audio.ts` owns the
 * Strudel transport and is the project's whole AGPL surface, `web/voice-synth.ts`
 * is an MIT voice that knows nothing about songs, and putting this in either
 * would be putting it in a file whose stated job is something else.
 *
 * ## Why bridge at all
 *
 * Two things the vocal line asks for cannot be expressed in Strudel, and they
 * are not decorations — they are most of the difference between a voice and a
 * row of blips:
 *
 *  - **Legato.** Strudel schedules one independent event per note, each with its
 *    own envelope, so there is no way to run two syllables together with no
 *    silence and no re-attack. Inside a word a mouth does not stop; the level
 *    dips as the tract constricts and comes back as it opens, and that dip *is*
 *    the syllable boundary. Replacing it with a gap is what makes a line read as
 *    a row of one-syllable words.
 *  - **Ties.** A long vowel or a melisma is one vowel carried across a pitch
 *    change with no fresh attack. A per-note voice can only start and stop.
 *
 * And one more that is simply absent from the IR's Strudel path: a **coda**.
 * `NoteEvent.coda` has been written since the words landed and nothing has ever
 * sounded one, because one attack per event leaves nowhere to put a consonant at
 * the far end.
 *
 * ## The clock
 *
 * Strudel schedules a hap at cycle `c` for audio time
 *
 *     t(c) = (c - C0) / cps + T0 + latency
 *
 * where `C0`/`T0` are the cycle and audio-clock time at the last tempo change.
 * `concert/transport.ts` inverts that to answer "what beat is it"; this runs it
 * *forwards* to answer "when does this beat happen", which is the same equation
 * and therefore exact rather than approximate. Everything else here follows:
 * one cycle is one bar, seconds per beat comes from the scheduler's own `cps`
 * rather than from the song's bpm, and the latency term is included because
 * leaving it out would put the voice a tenth of a second ahead of the band.
 *
 * ## Scheduling
 *
 * `speak()` lays out an entire utterance against the audio clock in one go,
 * which is exactly what makes legato and coarticulation possible and exactly
 * what makes it unable to run as a per-event callback. So the line is cut into
 * **phrases** at the breaths, and a pump hands each phrase over shortly before
 * it is due. A phrase is an utterance; a breath is a phrase boundary; the
 * arithmetic in between is Strudel's own.
 */

import { getAudioContext, getSuperdoughAudioController } from '@strudel/webaudio';

import type { NoteEvent, Song, Track } from '../core/types.js';
import { DELIVERIES, type Delivery } from '../style/delivery.js';
import { VOICE_SIGNATURES, type VoiceSignature } from '../style/voices.js';
import { initAudio, pieceLoops } from './audio.js';
import { VoiceSynth, type SynthEvent, type VoicePatch } from './voice-synth.js';

/**
 * A rest at least this long ends a phrase — the same beat of silence
 * `generate/vocals.ts` and `concert/visemes.ts` both call a breath. Three
 * places agreeing by using the same number is worth more than one of them
 * exporting it, because the two that are not this file are in the generator and
 * this one is in a renderer.
 */
const PHRASE_GAP_BEATS = 1;

/** How far ahead a phrase is handed to the synth, in seconds. */
const LOOKAHEAD = 0.9;

/**
 * How often the pump looks.
 *
 * Comfortably inside the lookahead, so a tick that is late by a whole period
 * still leaves `speak()` room — it refuses to schedule closer than 60 ms out and
 * silently slides anything nearer, which would be a syllable arriving late with
 * no error anywhere.
 */
const TICK_MS = 220;

/**
 * How loud the voice is against a band it is no longer mixed with.
 *
 * The Strudel path emits the voice as five stacked patterns and scales them by
 * `VOICE_MIX`; none of that applies here, because this is one signal through one
 * cascade. What is left is `Track.gain`, which is on the same 0..1 scale as every
 * other layer's, and a constant that puts the synth's own output where those
 * gains expect a layer to sit. Measured against whole songs rather than guessed:
 * at 1.0 the voice sat well over the band, because `voice-synth.ts` is already
 * internally levelled to peak near 0.7 on its own.
 */
const VOICE_LEVEL = 0.55;

/** Reverb send. A dry synthetic voice sits in front of the speakers. */
const VOICE_REVERB = 0.28;

/** Consonant bursts, relative to the voice. */
const CONSONANT_LEVEL = 0.4;

export interface SungVoice {
  /**
   * Take over the vocal layer of this song.
   *
   * Call it around the same time the pattern is evaluated; nothing sounds until
   * the scheduler starts, because every phrase is placed by the scheduler's own
   * clock and there is no clock until then.
   */
  begin(song: Song): void;
  /** Silence and forget. Safe to call when nothing is playing. */
  end(): void;
  /**
   * Move her fader while she is singing, as a multiplier over what `begin` was
   * given. 1 is the level the song asked for.
   *
   * The band has this for nothing — every layer is read through a `ref` at
   * query time, so a fader is a map write. The singer is not in that stack: her
   * level was captured into a patch at `begin` and the only way to change it was
   * to `begin` again, which restarts the phrasing and is audible as a cut in the
   * middle of a word.
   *
   * So it rides `VoiceSynth.setLevel`, which is a ramp on the master and
   * therefore reaches the phrase that is already sounding. Writing it onto the
   * patch instead — which is what this did — only reached the phrases not yet
   * handed over, and a phrase is a *breath*, not a bar: `speak` schedules a
   * whole one against the audio clock in one call, so a fader moved a syllable
   * into a long line was inaudible until the singer next drew breath, seconds
   * later. A fader nobody can hear is what sends people back to `begin`.
   */
  setTrim(trim: number): void;
  /** Whether this song had a vocal layer for it to take over at all. */
  readonly singing: boolean;
}

/** One breath-to-breath run of syllables, ready to be spoken as one utterance. */
interface Phrase {
  /** Beat of its first syllable, from song start. */
  beat: number;
  events: SynthEvent[];
}

/**
 * Strip the vocal layer, for the Strudel render that plays alongside this.
 *
 * Both would otherwise sound, and two voices singing the same line a hair apart
 * is worse than either alone. Kept here rather than at the call sites so that
 * the decision to take the layer over and the decision to mute it are the same
 * decision in the same file.
 */
export function withoutSungVoice(song: Song): Song {
  if (!song.tracks.some(isSung)) return song;
  return { ...song, tracks: song.tracks.filter((t) => !isSung(t)) };
}

function isSung(track: Track): boolean {
  return track.layer === 'vocal' && Boolean(track.voice);
}

export function createSungVoice(): SungVoice {
  let synth: VoiceSynth | undefined;
  let timer: number | undefined;
  let phrases: Phrase[] = [];
  let patch: VoicePatch | undefined;
  let bars = 0;
  /** Next phrase to hand over, and which time round the loop it belongs to. */
  let cursor = 0;
  let pass = 0;
  /** The level the song asked for, before any fader. See `setTrim`. */
  let written = 0;
  /** …and the fader over it. */
  let trim = 1;

  /**
   * The synth, attached to Strudel's context and its master gain.
   *
   * Both matter. The context is what puts the voice on the same clock as the
   * band — a second `AudioContext` has its own `currentTime` and no fixed
   * relationship to this one, so the voice would drift. The master gain is what
   * puts it inside `installLimiter`'s brickwall, so the voice counts toward the
   * same ceiling as everything else instead of being added on top of a mix that
   * is already at it.
   *
   * Fails soft, exactly as the limiter does: if Strudel's output is not the
   * shape expected, the voice goes to the context's destination unlimited
   * rather than not at all.
   */
  function ensure(): VoiceSynth | undefined {
    if (synth) return synth;
    let ctx: AudioContext;
    try { ctx = getAudioContext(); } catch { return undefined; }
    if (!ctx) return undefined;
    let master: AudioNode | undefined;
    try { master = getSuperdoughAudioController()?.output?.destinationGain ?? undefined; } catch { /* soft */ }
    synth = new VoiceSynth(ctx, master);
    // A fader moved before the first phrase was pumped — during the count-in,
    // say — has nothing to write to and would otherwise be forgotten.
    synth.setLevel(trim, 0);
    return synth;
  }

  /**
   * When, on the audio clock, does this beat of this pass through the loop
   * sound? `undefined` until the scheduler has a tempo, which is also until
   * nothing is sounding.
   */
  function timeOf(beat: number, beatsPerBar: number, round: number): number | undefined {
    const repl = current();
    const s = repl?.scheduler;
    if (!s?.started || s.seconds_at_cps_change === undefined || !s.cps) return undefined;
    const cycle = beat / beatsPerBar + round * bars;
    return (cycle - s.num_cycles_at_cps_change) / s.cps + s.seconds_at_cps_change + (s.latency ?? 0.1);
  }

  /** Seconds per beat, from the scheduler rather than from the song. */
  function secondsPerBeat(beatsPerBar: number): number | undefined {
    const s = current()?.scheduler;
    return s?.cps ? 1 / (s.cps * beatsPerBar) : undefined;
  }

  function tick(song: Song): void {
    const voice = ensure();
    if (!voice || !patch || !phrases.length) return;
    const ctx = voice.context;
    const { beatsPerBar } = song.meta;
    if (!ctx) return;
    const spb = secondsPerBeat(beatsPerBar);
    if (spb === undefined) return;

    const horizon = ctx.currentTime + LOOKAHEAD;
    // Bounded rather than `while (true)`: a scheduler reporting a wild cps would
    // otherwise spin here forever rather than merely sounding wrong.
    for (let n = 0; n < 64; n++) {
      const phrase = phrases[cursor];
      /**
       * The end of the line: round again with the band, or stop with it.
       *
       * She has to be told, because she is not in the pattern and so `playOnce`
       * cannot cut her — and she is the one who would be caught worst by the
       * loop. `LOOKAHEAD` is 0.9 s against Strudel's 0.3, and `speak` lays a
       * whole phrase down on the audio clock in one call, so a line that opens
       * the piece would be handed over before the end of it and then sung over
       * the ending in full, seconds of it, with the band already stopped.
       */
      if (!phrase) {
        if (!pieceLoops()) return;
        cursor = 0; pass++; continue;
      }
      const at = timeOf(phrase.beat, beatsPerBar, pass);
      if (at === undefined) return;
      if (at > horizon) return;
      /**
       * A phrase already gone by is dropped rather than sung late.
       *
       * It happens on the first tick after the pattern starts — the scheduler
       * has been running for a fraction of a second before the pump's first
       * look — and a syllable pushed forward to "now" would land on the wrong
       * beat, which is worse than a syllable that does not sound.
       */
      if (at > ctx.currentTime + 0.06) voice.speak(scale(phrase.events, spb), patch, at);
      cursor++;
    }
  }

  /**
   * Phrase-relative seconds.
   *
   * Held until here rather than baked in at `begin`, because seconds per beat
   * comes from the scheduler and the scheduler does not exist yet at `begin`.
   */
  function scale(events: SynthEvent[], spb: number): SynthEvent[] {
    return events.map((e) => ({ ...e, time: e.time * spb, duration: e.duration * spb }));
  }

  return {
    get singing() { return phrases.length > 0; },

    begin(song) {
      this.end();
      const track = song.tracks.find(isSung);
      if (!track?.voice || !track.notes.length) return;

      bars = song.meta.totalBars;
      phrases = phrasesOf(track.notes);
      const signature: VoiceSignature =
        VOICE_SIGNATURES[track.voice.signature ?? 'male'] ?? VOICE_SIGNATURES.male;
      const delivery: Delivery =
        DELIVERIES[track.voice.delivery ?? 'sung'] ?? DELIVERIES.sung;
      written = track.gain * VOICE_LEVEL;
      patch = {
        signature,
        delivery,
        // The song's own level only. The fader is on the synth's master and
        // survives every `begin` and `end` there is — see `setTrim` — so
        // multiplying it in here as well would apply it twice.
        gain: written,
        reverb: VOICE_REVERB,
        consonantGain: CONSONANT_LEVEL,
      };
      cursor = 0;
      pass = 0;
      timer = window.setInterval(() => tick(song), TICK_MS);
    },

    setTrim(next) {
      trim = Number.isFinite(next) && next >= 0 ? next : 1;
      synth?.setLevel(trim);
    },

    end() {
      if (timer !== undefined) { window.clearInterval(timer); timer = undefined; }
      synth?.stop();
      phrases = [];
      patch = undefined;
      cursor = 0;
      pass = 0;
      // `trim` deliberately survives. There is one of these per show and it is
      // ended and begun again at every number, at every jump, and every time a
      // tomato lands — none of which is a reason to undo a fader somebody
      // moved. The song's own level is `written`, and `begin` replaces that.
    },
  };
}

/**
 * Cut the line at the breaths.
 *
 * A phrase is one utterance, and an utterance is one continuous voice — which
 * is the unit `speak()` is built around and the reason it can do legato at all.
 * Cutting anywhere else would be cutting inside a breath, and the join would be
 * audible as a re-attack in the middle of a word.
 *
 * Times come out in **beats** and are converted to seconds at the last moment,
 * because the tempo lives on the scheduler and the scheduler is not running
 * when this is called.
 */
function phrasesOf(notes: NoteEvent[]): Phrase[] {
  const sorted = [...notes].sort((a, b) => a.beat - b.beat);
  const out: Phrase[] = [];
  let current: NoteEvent[] = [];
  let prevEnd = -Infinity;

  const flush = () => {
    if (!current.length) return;
    const start = current[0]!.beat;
    out.push({
      beat: start,
      events: current.map((n, i) => ({
        time: n.beat - start,
        duration: n.duration,
        midi: n.midi,
        velocity: n.velocity,
        vowel: n.vowel ?? 'uh',
        consonant: n.consonant ?? 'none',
        coda: n.coda ?? 'none',
        tie: n.tie === true,
        // The last note of a phrase is never legato, whatever the mark says: it
        // is followed by a breath, and there is no next event to run into.
        legatoToNext: n.legatoToNext === true && i < current.length - 1,
      })),
    });
    current = [];
  };

  for (const note of sorted) {
    if (note.beat - prevEnd >= PHRASE_GAP_BEATS) flush();
    current.push(note);
    prevEnd = note.beat + note.duration;
  }
  flush();
  return out;
}

// ---------------------------------------------------------------------------

/**
 * The repl, if it has finished booting — the same trick `concert/transport.ts`
 * plays, for the same reason: `initAudio()` is a promise and a timer callback
 * cannot await one, so the resolved instance is kept to hand and the pump says
 * "not yet" rather than blocking. A few silent ticks while the band loads is
 * correct; nothing is sounding then either.
 */
let repl: Awaited<ReturnType<typeof initAudio>> | undefined;
void initAudio().then((r) => { repl = r; }).catch(() => { /* the page reports it */ });
const current = () => repl;
