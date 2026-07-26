/**
 * A singing voice, in plain Web Audio. No Strudel, no samples, no licence.
 *
 * This is the reference implementation of the thing the rest of the project
 * only describes: `VoiceSettings` and the formant tables have always been
 * written as synthesis parameters that "a native engine reads the same numbers"
 * from, and this is that engine, at browser scale. It is MIT like everything
 * outside `web/audio.ts`, and it is deliberately built from primitives that
 * exist in every audio stack — oscillator, biquad, noise, envelope — so porting
 * it to a game engine is transcription rather than redesign.
 *
 * It exists because the Strudel path cannot do the two things this is for.
 * Strudel schedules one independent event per note, so there is no way to hold
 * a vowel across a pitch change (melisma) or to run two syllables together with
 * no silence and no re-attack (legato) — each note is its own sampler voice
 * with its own envelope. Both of those are the difference between a voice and a
 * row of blips, so they cannot be given up.
 *
 * The other reason is the filter topology, and it is the bigger win:
 *
 *   **A vocal tract is a cascade, not a parallel bank.** Each resonance
 *   multiplies the *whole* spectrum, so the harmonics between the formants are
 *   attenuated but present. Three parallel bandpasses instead keep three slices
 *   and discard everything else, which is why that version needed an unfiltered
 *   "body" channel mixed underneath to sound like anything at all — and why the
 *   body then had to be kept tiny, because it is identical for every vowel and
 *   drowns out the differences the formants exist to create. Chained peaking
 *   filters have no such tension: they put peaks on a full spectrum, which is
 *   what a tube does. Vowels come out both fuller and more distinct, and the
 *   compromise disappears rather than being tuned.
 */

import type { Consonant, Vowel } from '../core/types.js';
import type { Delivery } from '../style/delivery.js';
import type { VoiceSignature } from '../style/voices.js';
import { CONSONANTS, VOWEL_FORMANTS } from '../style/vocals.js';

/** One syllable to be sung, in seconds relative to the start of the utterance. */
export interface SynthEvent {
  time: number;
  duration: number;
  /** Fractional MIDI — spoken lines do not sit on semitones. */
  midi: number;
  velocity: number;
  vowel: Vowel;
  consonant: Consonant;
  /** Continues the previous syllable: no onset, no re-attack, glide the pitch. */
  tie: boolean;
  /** Runs into the next event with no silence — dip and rise instead of stop and start. */
  legatoToNext: boolean;
}

export interface VoicePatch {
  signature: VoiceSignature;
  delivery: Delivery;
  /** Overall level, 0..1. */
  gain: number;
  /** Reverb send, 0..1. */
  reverb: number;
  /** Level of the consonant noise bursts relative to the voice, 0..1. */
  consonantGain: number;
}

/**
 * The two formants above the vowel table, in Hz for the reference tract.
 *
 * F4 and F5 carry no vowel identity at all — they barely move as the tongue
 * does — which is exactly why they are constants here. What they carry is
 * *voice*: their absence is audible as a thin, hollow quality, because a real
 * tract has resonances all the way up and a synthetic one that stops at F3
 * sounds like it stops at F3.
 */
const UPPER_FORMANTS = [3500, 4500] as const;

/**
 * Bandwidths in Hz, F1…F5. Real measured formants run 50–200 Hz wide and widen
 * as they rise; these are close to measured, which is affordable here in a way
 * it was not with parallel bandpasses. A narrow *peaking* filter that finds no
 * harmonic simply boosts nothing, where a narrow *bandpass* that finds no
 * harmonic outputs silence — so the cascade can be as sharp as the real thing.
 */
const BANDWIDTHS = [90, 110, 160, 250, 320] as const;

/**
 * Boost at each formant, dB.
 *
 * F2 gets the most, which looks upside down against a measured vowel spectrum
 * where F1 is strongest. Two reasons, both about being heard rather than about
 * being accurate: loudness is spectral rather than RMS, and hearing peaks
 * around 2–5 kHz, so energy under 700 Hz is worth far less than the meter says.
 * And F2 is where the vowel lives — the difference between /a/ and /i/ is
 * almost entirely F2, so under-mixing it means choosing vowels correctly and
 * then throwing them away.
 */
const FORMANT_DB = [10, 13, 9, 6, 4] as const;

/** Two seconds is plenty to loop without an audible period. */
function makeNoiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/**
 * A synthetic room: exponentially decaying noise as an impulse response.
 *
 * Not a real space, and it does not need to be. What a voice wants from reverb
 * here is not realism but *distance* — a dry synthetic voice sits in front of
 * the speaker with nothing around it, which is the most artificial thing about
 * it, and almost any tail fixes that.
 */
function makeImpulse(ctx: BaseAudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** decay;
    }
  }
  return buf;
}

/**
 * The glottal source.
 *
 * Harmonic n at amplitude 1/nᵖ. A real glottal pulse rolls off at about
 * -12 dB/octave, which is p = 2; the exponent is a signature parameter because
 * varying it is what separates a pressed, bright voice from a soft, dark one,
 * and that difference does more for character than any filter setting.
 *
 * Sixty-four harmonics: at a fundamental of 100 Hz that reaches 6.4 kHz, past
 * every formant that matters, and above 200 Hz the top ones fold away on their
 * own because the oscillator band-limits them.
 */
function makeGlottalWave(ctx: BaseAudioContext, rolloff: number): PeriodicWave {
  const n = 64;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let i = 1; i < n; i++) imag[i] = 1 / i ** rolloff;
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

/**
 * Automation that cannot schedule into the past.
 *
 * Consonants schedule *backwards* — a stop's closure is 30 ms before its
 * vowel, a fricative's noise starts 50 ms before it — so two adjacent
 * syllables can easily ask for events out of order, and Web Audio's response to
 * that is to silently reorder or throw depending on the browser. Clamping every
 * time to at least the last one scheduled makes the whole thing safe by
 * construction: a consonant that has no room to articulate is compressed rather
 * than being allowed to corrupt the line.
 */
class Ramp {
  private cursor: number;

  constructor(private readonly param: AudioParam, start: number) {
    this.cursor = start;
  }

  private at(time: number): number {
    this.cursor = Math.max(this.cursor, time);
    return this.cursor;
  }

  set(value: number, time: number): void {
    this.param.setValueAtTime(value, this.at(time));
  }

  to(value: number, time: number): void {
    this.param.linearRampToValueAtTime(value, this.at(time));
  }

  glide(value: number, time: number, tau: number): void {
    this.param.setTargetAtTime(value, this.at(time), Math.max(0.001, tau));
  }

  /** Exponential ramps cannot pass through zero; callers guarantee positivity. */
  bend(value: number, time: number): void {
    this.param.exponentialRampToValueAtTime(Math.max(1e-4, value), this.at(time));
  }
}

interface Utterance {
  nodes: AudioScheduledSourceNode[];
  end: number;
}

export class VoiceSynth {
  private readonly noise: AudioBuffer;
  private readonly reverb: ConvolverNode;
  private readonly master: GainNode;
  private readonly waves = new Map<number, PeriodicWave>();
  private active: Utterance[] = [];

  constructor(private readonly ctx: AudioContext, destination?: AudioNode) {
    this.noise = makeNoiseBuffer(ctx);
    this.master = ctx.createGain();
    this.master.gain.value = 1;

    /**
     * A safety net, not a sound.
     *
     * Five cascaded peaking filters can add 40 dB where their skirts overlap,
     * and where they land relative to the harmonics depends on the note — so
     * the peak level of this voice varies by note in a way no fixed makeup gain
     * can predict. A gentle limiter at the very end costs nothing audible at
     * sane settings and stops an unlucky vowel on an unlucky pitch clipping the
     * output. It deliberately does not shape the voice: the crest of a syllabic
     * line is dealt with at the source, by keeping the envelope's sustain high.
     */
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 6;
    limiter.ratio.value = 8;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.15;
    this.master.connect(limiter).connect(destination ?? ctx.destination);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = makeImpulse(ctx, 2.4, 2.6);
    this.reverb.connect(this.master);
  }

  /** Glottal waves are shared per rolloff — building one is not free. */
  private wave(rolloff: number): PeriodicWave {
    const key = Math.round(rolloff * 20);
    let w = this.waves.get(key);
    if (!w) {
      w = makeGlottalWave(this.ctx, key / 20);
      this.waves.set(key, w);
    }
    return w;
  }

  /**
   * Schedule a whole line as a single continuous voice, and return when it ends.
   *
   * One oscillator and one filter chain for the entire utterance, rather than
   * one per note. That is the architectural decision the whole file turns on:
   * legato, melisma and coarticulation are all *relationships between
   * neighbouring syllables*, and they can only be expressed by a voice that
   * persists across them. A per-note voice can only ever start and stop.
   */
  speak(events: SynthEvent[], patch: VoicePatch, when?: number): number {
    const { ctx } = this;
    const { signature: sig, delivery: del } = patch;
    if (!events.length) return ctx.currentTime;

    const t0 = Math.max(when ?? 0, ctx.currentTime + 0.06);
    const last = events[events.length - 1]!;
    const tail = t0 + last.time + last.duration + del.release + 0.4;

    // --- source ---------------------------------------------------------
    const osc = ctx.createOscillator();
    osc.setPeriodicWave(this.wave(sig.rolloff));

    const voiced = ctx.createGain();
    voiced.gain.value = del.voiced;
    osc.connect(voiced);

    // Aspiration. Every voice has some — an oscillator with no noise in it
    // reads as an organ — and a whisper is nothing but this, the tract still
    // shaping vowels over a source that has no pitch at all.
    const air = ctx.createBufferSource();
    air.buffer = this.noise;
    air.loop = true;
    const airBand = ctx.createBiquadFilter();
    airBand.type = 'bandpass';
    airBand.frequency.value = 1400 * sig.formantScale;
    airBand.Q.value = 0.6;
    const airGain = ctx.createGain();
    // The second term is makeup for whispering, and it has to be generous:
    // noise through a formant cascade comes out far quieter than a periodic
    // source of the same nominal level, because the cascade's peaks only find
    // a fraction of a flat spectrum where they find whole harmonics of a
    // pitched one. Without it a whisper measures 13 dB under a sung line.
    airGain.gain.value = sig.breath * 0.5 + (1 - del.voiced) * 1.1;
    air.connect(airBand).connect(airGain);

    // --- vibrato and drift ----------------------------------------------
    const vib = ctx.createOscillator();
    vib.frequency.value = sig.vibRate;
    const vibDepth = ctx.createGain();
    vibDepth.gain.value = sig.vibDepth * del.vibrato * 100;   // semitones -> cents
    vib.connect(vibDepth).connect(osc.detune);

    // A slow wander a few cents wide. A pitch held to the exact hertz is the
    // one thing no larynx can do, and its absence is most of what "synthetic"
    // means when the rest is right.
    const drift = ctx.createOscillator();
    drift.frequency.value = 0.37;
    const driftDepth = ctx.createGain();
    driftDepth.gain.value = 7;
    drift.connect(driftDepth).connect(osc.detune);

    // --- the tract ------------------------------------------------------
    const mix = ctx.createGain();
    voiced.connect(mix);
    airGain.connect(mix);

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 70;

    const formants = BANDWIDTHS.map((bw, i) => {
      const f = ctx.createBiquadFilter();
      f.type = 'peaking';
      const rest = i < 3 ? VOWEL_FORMANTS.a[i]! : UPPER_FORMANTS[i - 3]!;
      f.frequency.value = rest * sig.formantScale;
      f.Q.value = (rest * sig.formantScale) / (bw * sig.formantScale);
      f.gain.value = FORMANT_DB[i]!;
      return f;
    });

    // The singer's formant: one peak around 2.8 kHz where the ear is most
    // sensitive and an orchestra has least energy. It is why an unamplified
    // voice can be heard over eighty players, and — more usefully here — most
    // of the audible difference between someone talking and someone singing.
    const ring = ctx.createBiquadFilter();
    ring.type = 'peaking';
    ring.frequency.value = 2850 * sig.formantScale;
    ring.Q.value = 2.2;
    ring.gain.value = sig.ring;

    const tilt = ctx.createBiquadFilter();
    tilt.type = 'lowpass';
    tilt.frequency.value = 5200 * sig.formantScale;
    tilt.Q.value = 0.6;

    const env = ctx.createGain();
    env.gain.value = 0;

    const out = ctx.createGain();
    // The cascade adds up to 40 dB of boost across five peaks; this is the
    // makeup that keeps a voice at velocity 1 under the ceiling.
    out.gain.value = 0.22 * patch.gain;

    let chain: AudioNode = mix.connect(hp);
    for (const f of formants) chain = chain.connect(f);
    chain.connect(ring).connect(tilt).connect(env).connect(out);

    const send = ctx.createGain();
    send.gain.value = patch.reverb;
    out.connect(this.master);
    out.connect(send).connect(this.reverb);

    // --- schedule -------------------------------------------------------
    const envRamp = new Ramp(env.gain, t0);
    const pitch = new Ramp(osc.frequency, t0);
    const tract = formants.slice(0, 3).map((f) => new Ramp(f.frequency, t0));

    const scale = sig.formantScale;
    let previous: SynthEvent | undefined;

    for (const e of events) {
      const t = t0 + e.time;
      const freq = 440 * 2 ** ((e.midi - 69) / 12);
      const level = Math.max(0.02, e.velocity);
      const shape = CONSONANTS[e.tie ? 'none' : e.consonant];
      // The consonant sets the shape of the arrival and the delivery sets how
      // crisp everything is, so they multiply rather than one overriding the
      // other: a nasal is still slow in clipped speech, just less slow.
      const attack = Math.max(0.002, shape.attack * (del.attack / 0.015));

      scheduleTract(tract, e, freq, scale, t, del.glide);

      if (e.tie) {
        // Melisma. The pitch glides and nothing else happens — no onset, no
        // re-attack, the same vowel carried onto a new note. This is the one
        // gesture that is unambiguously singing rather than speech.
        pitch.glide(freq, t, Math.max(0.012, del.glide * 0.5));
        envRamp.to(level * del.sustain, t + 0.04);
      } else {
        schedulePitch(pitch, freq, t, del, previous);
        scheduleOnset(envRamp, e, previous, level, attack, t, del);
      }

      if (!e.legatoToNext) {
        const tEnd = Math.max(t + attack + del.decay + 0.005, t + e.duration);
        envRamp.set(level * del.sustain, tEnd);
        envRamp.to(0, tEnd + del.release);
      }

      if (!e.tie && shape.burstFreq > 0) {
        this.burst(e, shape.burstFreq * scale, shape.burstDecay, t, level * patch.consonantGain, out);
      }

      previous = e;
    }

    for (const node of [osc, air, vib, drift]) {
      node.start(t0);
      node.stop(tail);
    }
    const utterance: Utterance = { nodes: [osc, air, vib, drift], end: tail };
    this.active.push(utterance);
    osc.onended = () => {
      this.active = this.active.filter((u) => u !== utterance);
      out.disconnect();
      send.disconnect();
    };

    return tail;
  }

  /**
   * The noise transient at the front of a stop or a fricative.
   *
   * Routed past the formant cascade rather than through it. A real burst is
   * shaped by the tract too, but it is shaped by the tract in its *closed*
   * position, which is a different filter from the vowel about to follow — and
   * running it through the vowel's formants is audibly worse than running it
   * through none, because it colours every /t/ with the vowel behind it.
   */
  private burst(
    e: SynthEvent, freq: number, decay: number, t: number, level: number, dest: AudioNode,
  ): void {
    const { ctx } = this;
    // A fricative leads its vowel — the noise is most of the sound and it
    // happens before the folds start. A stop is simultaneous: the release of
    // the closure *is* the start of the vowel.
    const start = Math.max(ctx.currentTime, t - (decay > 0.05 ? 0.05 : 0));

    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;

    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = freq;
    band.Q.value = 1.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + 0.002);
    gain.gain.exponentialRampToValueAtTime(1e-4, start + 0.002 + decay);

    src.connect(band).connect(gain).connect(dest);
    src.start(start);
    src.stop(start + 0.002 + decay + 0.05);
    src.onended = () => gain.disconnect();
  }

  stop(): void {
    const now = this.ctx.currentTime;
    for (const u of this.active) {
      for (const node of u.nodes) {
        try { node.stop(now); } catch { /* already stopped */ }
      }
    }
    this.active = [];
  }

  get busy(): boolean {
    return this.active.some((u) => u.end > this.ctx.currentTime);
  }
}

/**
 * Move the first three formants to this syllable's vowel.
 *
 * The glide starts *before* the syllable does, because the mouth does:
 * anticipatory coarticulation is why "coo" and "key" have audibly different /k/
 * sounds, and it is a large part of why connected speech sounds connected
 * rather than concatenated. A consonant that shapes the tract gets an
 * intermediate target first — the murmur of a nasal, the low F3 of a liquid —
 * and then glides on into the vowel, which is exactly what those consonants
 * *are*: not events, but places the tract passes through.
 */
function scheduleTract(
  tract: Ramp[], e: SynthEvent, freq: number, scale: number, t: number, glide: number,
): void {
  const [f1, f2, f3] = VOWEL_FORMANTS[e.vowel];
  // A resonance below the fundamental has no harmonic to amplify, so a closed
  // vowel simply loses its F1 up high. Nudging it up to meet F0 is not a
  // workaround: it is vowel modification, and a soprano has no choice about it
  // either — every vowel migrates toward /a/ at the top of the range.
  const targets = [Math.max(f1 * scale, freq * 1.05), f2 * scale, f3 * scale];
  const tau = Math.max(0.004, glide / 3);
  const lead = t - glide * 0.4;

  if (!e.tie) {
    if (e.consonant === 'nasal') {
      // The murmur: sound comes out of the nose, the mouth is closed, and the
      // tract is a fixed shape with a low first resonance and little above it.
      tract[0]?.glide(260 * scale, lead - 0.05, 0.015);
      tract[1]?.glide(1100 * scale, lead - 0.05, 0.015);
      tract[2]?.glide(2400 * scale, lead - 0.05, 0.015);
    } else if (e.consonant === 'liquid') {
      // /l/ and /r/ between them: a low F2 and a distinctly lowered F3, which
      // is the single cue that makes an English /r/ recognisable.
      tract[1]?.glide(1000 * scale, lead - 0.03, 0.012);
      tract[2]?.glide(2000 * scale, lead - 0.03, 0.012);
    }
  }

  targets.forEach((target, i) => tract[i]?.glide(target, lead, tau));
}

/**
 * Arrive at the pitch.
 *
 * The scoop — starting under the note and reaching it — is the strongest "this
 * is a person" cue available, because a voice *reaches* a pitch where an organ
 * is simply already on it. It only applies to a detached onset: inside a word
 * the voice is already sounding, so the move to the next pitch is a short
 * portamento instead, which is what a mouth that never stopped does.
 */
function schedulePitch(
  pitch: Ramp, freq: number, t: number, del: Delivery, previous: SynthEvent | undefined,
): void {
  if (previous?.legatoToNext) {
    pitch.glide(freq, t - 0.01, 0.008);
    return;
  }
  if (del.scoop > 0) {
    pitch.set(freq * 2 ** (-del.scoop / 12), t);
    pitch.bend(freq, t + del.scoopTime);
    return;
  }
  pitch.set(freq, t);
}

/**
 * Start the syllable — and the whole point is the middle branch.
 *
 * A syllable inside a word does not begin from silence. The voice is already
 * sounding; the level dips as the tract constricts and comes back as it opens,
 * and that dip is the entire perceptual event. Replacing it with a stop and a
 * restart is what makes a synthetic line read as "duu du du" rather than as a
 * word — the ear hears the silence as a word boundary, so a line with silence
 * everywhere is heard as a line of one-syllable words.
 */
function scheduleOnset(
  env: Ramp,
  e: SynthEvent,
  previous: SynthEvent | undefined,
  level: number,
  attack: number,
  t: number,
  del: Delivery,
): void {
  // A stop *is* a silence followed by a release. Without the closure it is only
  // a click, and a click at the start of a note is a synthesiser artefact
  // rather than a consonant.
  if (e.consonant === 'stop') {
    env.to(0, t - 0.028);
    env.set(0, t - 0.003);
  } else if (previous?.legatoToNext) {
    env.to(level * del.sustain * del.articulation, t);
  } else {
    env.set(0, t);
  }
  env.to(level, t + attack);
  env.to(level * del.sustain, t + attack + del.decay);
}
