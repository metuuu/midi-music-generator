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
 * The other reason is the filter topology, and it is the bigger win.
 *
 * **A vowel is not where the spectrum peaks. It is where the spectrum falls.**
 *
 * That sentence is the whole of this file's second half, and getting it wrong
 * produces a very specific failure: vowels that read as an EQ wobble in the
 * treble rather than as a mouth changing shape. Two earlier versions had it.
 *
 *  - **Parallel bandpasses** keep three slices of the spectrum and throw the
 *    rest away. Thin, quiet, and no makeup gain restores what is gone — hence
 *    the unfiltered "body" channel that had to be mixed underneath to make it
 *    sound like anything, and which then had to be kept tiny because it is
 *    identical for every vowel and drowns the differences out.
 *  - **Cascaded peaking filters** fix the thinness — they multiply the whole
 *    spectrum — but they can only ever *add* narrow bumps to a flat response.
 *    Measured: the entire tract response for /a/ spanned 3.8 dB, and above
 *    1 kHz /a/ and /i/ differed by under 4 dB. Since the source rolls off
 *    steeply, the only place those bumps were audible at all was up where the
 *    source was weak. Which is exactly what a listener reports as "the vowels
 *    are just an annoying high-frequency change".
 *
 * What a tube actually does is **resonate and then roll off**. Above each
 * resonance the response falls at 12 dB/octave until the next one lifts it, so
 * a real /i/ has a canyon roughly 30 dB deep between 300 Hz and 2 kHz, and that
 * canyon is most of what makes it /i/. No arrangement of boosts can dig one.
 *
 * So the tract here is what a tract is: an **all-pole cascade**. Five resonant
 * lowpass biquads in series, one per formant, each unity below its resonance,
 * peaked at it, and falling above it. The relative loudness of the formants is
 * then not something to be dialled in — it falls out of the frequencies and
 * bandwidths, which is the entire point of Klatt's cascade model and why it
 * sounds like a person rather than like a filter bank.
 *
 *   tract response for /a/    spans 80 dB, against 3.8 dB for the peaking version
 *   |/a/ − /i/| at 700 Hz     37.8 dB, against 9 dB, and now in the low-mid
 *                             where the body of the voice is, not the treble
 *   spectral distance         10–20 dB RMS between cardinal vowels, against 4–8
 *
 * The source changes with it. An all-pole tract must be driven by the glottal
 * flow *derivative* including lip radiation — glottal flow falls at
 * -12 dB/octave, radiation from the lips is a differentiator worth +6, so the
 * excitation is about -6 dB/octave. The previous -12 was glottal flow with the
 * radiation term missing, which double-counted the darkness and pushed every
 * audible difference further into the treble.
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
 * Bandwidths in Hz, F1…F5 — how wide each resonance is, and therefore how
 * sharply it peaks. Real measured formants run 50–200 Hz and widen as they
 * rise; these sit inside that, chosen by fitting the model's output against
 * measured vowel spectra (see `formantQ`).
 */
const BANDWIDTHS = [80, 100, 140, 220, 280] as const;

/**
 * Higher-pole correction: a broad lift above 900 Hz, in dB.
 *
 * A real tract has infinitely many resonances and this one has five, so the
 * spectrum above the modelled poles comes out too dark — the missing poles all
 * sit up there and all of them contribute a rising trend. Klatt's cascade
 * synthesiser corrects for exactly this, and a high shelf is the cheap version
 * of it.
 *
 * Not a taste setting. Fitted: with the shelf off, the second formant measures
 * 4–8 dB weaker than published vowel spectra say it should across the whole
 * palette, and with it every vowel's F2 lands within 3 dB of the reference. F2
 * is where vowel identity lives, so that error is not cosmetic.
 */
const HIGHER_POLE_HZ = 900;
const HIGHER_POLE_DB = 10;

/**
 * Web Audio's lowpass `Q` is **in decibels**, unlike its bandpass `Q` — which
 * is easy to miss and produces a filter about eight times too sharp if you pass
 * a linear ratio. Measured: Q = 18 gives exactly 18 dB of peak gain.
 *
 * A resonator's sharpness is centre over bandwidth, so this is that ratio
 * expressed the way the node wants it. It has to be recomputed whenever the
 * formant moves, or the bandwidth drifts with the vowel.
 */
function formantQ(freq: number, bandwidth: number): number {
  return 20 * Math.log10(Math.max(1.05, freq / bandwidth));
}

/**
 * How much each vowel has to be lifted to come out at the same power, /a/ = 1.
 *
 * A cascade does not pass every vowel at the same level, and it should not: /i/
 * puts its first resonance at 270 Hz and then rolls everything above it away,
 * so it carries far less energy than /a/, whose F1 and F2 sit close together
 * and high. Measured through the model, /i/ arrives about 10 dB under /a/.
 *
 * But 10 dB is roughly twice what a real speaker produces, because a real
 * speaker *compensates* — that is what "equal effort" means, and it is why a
 * word does not lurch in volume from syllable to syllable. Every formant
 * synthesiser since Klatt has had a per-segment amplitude control for exactly
 * this reason. Equalising the power is therefore the natural choice rather than
 * the artificial one.
 *
 * It deliberately equalises *power* and not loudness. What is left over after
 * this — /i/ still sounding a little softer than /a/ at the same RMS, because
 * its energy sits where the ear is less sensitive — is the real residual, and
 * flattening that too would be erasing a cue rather than restoring one.
 *
 * Computed from the same resonator maths the graph uses, so it cannot drift
 * from it. The analog two-pole prototype is close enough to the digital biquad
 * for a level estimate, and tract length very nearly cancels out of the ratio,
 * so this is computed once at the reference scale rather than per signature.
 */
const VOWEL_GAIN: Record<Vowel, number> = (() => {
  const magnitude = (vowel: Vowel, f: number): number => {
    let m = 1;
    for (let i = 0; i < 5; i++) {
      const f0 = i < 3 ? VOWEL_FORMANTS[vowel][i]! : UPPER_FORMANTS[i - 3]!;
      const q = f0 / BANDWIDTHS[i]!;
      const r = f / f0;
      m /= Math.sqrt((1 - r * r) ** 2 + (r / q) ** 2);
    }
    const g = 10 ** (HIGHER_POLE_DB / 20);
    const x = f / HIGHER_POLE_HZ;
    return m * Math.sqrt((1 + g * g * x * x) / (1 + x * x));
  };
  // Source amplitude falls as 1/f, so its power falls as 1/f². Integrated in
  // log frequency across the band a voice occupies.
  const power = (vowel: Vowel): number => {
    let sum = 0;
    for (let k = 0; k < 400; k++) {
      const f = 90 * (6500 / 90) ** (k / 399);
      sum += (magnitude(vowel, f) * (100 / f)) ** 2;
    }
    return sum;
  };
  const reference = power('a');
  return Object.fromEntries((Object.keys(VOWEL_FORMANTS) as Vowel[]).map(
    (v) => [v, Math.min(2.2, Math.sqrt(reference / power(v)))],
  )) as Record<Vowel, number>;
})();

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
 * The source: glottal flow derivative, with lip radiation folded in.
 *
 * Harmonic n at amplitude 1/nᵖ, and p ≈ 1 rather than the 2 you get by reading
 * "a glottal pulse falls at -12 dB/octave" and stopping there. The tract is
 * driven by the *derivative* of the glottal flow, and what leaves the lips is
 * differentiated again by the radiation itself — two +6 dB/octave terms against
 * the flow's -12, leaving about -6 dB/octave, which is p = 1: a sawtooth. This
 * is also why every classic formant synthesiser drives its resonators with a
 * sawtooth or an impulse train and no one thinks to explain why.
 *
 * Getting this wrong is not subtle. At p = 2 the source is 6 dB/octave too dark
 * everywhere, so the only region with enough energy left to hear a formant move
 * in is the top — and the vowels stop being vowels and become a treble wobble.
 *
 * The exponent stays a signature parameter because varying it around 1 is what
 * separates a pressed, bright voice from a soft, dark one, and that does more
 * for character than any filter setting.
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

    // The tract: five resonators in series. Each is unity below its resonance,
    // peaks at it, and falls at 12 dB/octave above it — so the response between
    // two formants *descends*, which is the part a bank of boosts can never
    // produce and the part that carries the vowel.
    const formants = BANDWIDTHS.map((bw, i) => {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      const rest = (i < 3 ? VOWEL_FORMANTS.a[i]! : UPPER_FORMANTS[i - 3]!) * sig.formantScale;
      f.frequency.value = rest;
      f.Q.value = formantQ(rest, bw * sig.formantScale);
      return f;
    });

    // The resonances above the five that are modelled. See HIGHER_POLE_DB.
    const higherPoles = ctx.createBiquadFilter();
    higherPoles.type = 'highshelf';
    higherPoles.frequency.value = HIGHER_POLE_HZ * sig.formantScale;
    higherPoles.gain.value = HIGHER_POLE_DB;

    // The singer's formant: one peak around 2.8 kHz where the ear is most
    // sensitive and an orchestra has least energy. It is why an unamplified
    // voice can be heard over eighty players, and — more usefully here — most
    // of the audible difference between someone talking and someone singing.
    const ring = ctx.createBiquadFilter();
    ring.type = 'peaking';
    ring.frequency.value = 2850 * sig.formantScale;
    ring.Q.value = 2.2;
    ring.gain.value = sig.ring;

    const env = ctx.createGain();
    env.gain.value = 0;

    const out = ctx.createGain();
    /**
     * Makeup, measured rather than guessed.
     *
     * The cascade is unity below F1, so most of the source passes at the level
     * it went in — but the F1 resonance adds about 19 dB on top of that, and at
     * these fundamentals a harmonic lands on it constantly, taking the peak
     * with it. Measured over whole lines in all seven signatures, this keeps
     * the peak between 0.53 and 0.74 at the default level and leaves the
     * limiter with nothing to do until the level slider is pushed near its top.
     */
    out.gain.value = 0.08 * patch.gain;

    let chain: AudioNode = mix.connect(hp);
    for (const f of formants) chain = chain.connect(f);
    chain.connect(higherPoles).connect(ring).connect(env).connect(out);

    const send = ctx.createGain();
    send.gain.value = patch.reverb;
    out.connect(this.master);
    out.connect(send).connect(this.reverb);

    // --- schedule -------------------------------------------------------
    const envRamp = new Ramp(env.gain, t0);
    const pitch = new Ramp(osc.frequency, t0);
    // Only the first three move — F4 and F5 carry voice quality rather than
    // vowel identity and barely shift as the tongue does. Q travels with the
    // frequency, or the resonance would widen and narrow as the vowel changes.
    const tract: FormantBand[] = formants.slice(0, 3).map((f, i) => ({
      freq: new Ramp(f.frequency, t0),
      q: new Ramp(f.Q, t0),
      bandwidth: BANDWIDTHS[i]! * sig.formantScale,
    }));

    const scale = sig.formantScale;
    let previous: SynthEvent | undefined;

    for (const e of events) {
      const t = t0 + e.time;
      const freq = 440 * 2 ** ((e.midi - 69) / 12);
      const level = Math.max(0.02, e.velocity);
      // The voice is compensated per vowel; the consonant burst is not. A /t/
      // does not get louder because the vowel behind it happens to be closed.
      const voiceLevel = level * VOWEL_GAIN[e.vowel];
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
        envRamp.to(voiceLevel * del.sustain, t + 0.04);
      } else {
        schedulePitch(pitch, freq, t, del, previous);
        scheduleOnset(envRamp, e, previous, voiceLevel, attack, t, del);
      }

      if (!e.legatoToNext) {
        const tEnd = Math.max(t + attack + del.decay + 0.005, t + e.duration);
        envRamp.set(voiceLevel * del.sustain, tEnd);
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
  tract: FormantBand[], e: SynthEvent, freq: number, scale: number, t: number, glide: number,
): void {
  const [f1, f2, f3] = VOWEL_FORMANTS[e.vowel];
  /**
   * Keep F1 at or above the fundamental.
   *
   * This matters far more in a cascade than it did in a bank of boosts. A
   * resonant lowpass sitting under F0 does not merely fail to emphasise the
   * first formant — it attenuates *the entire signal*, fundamental included, at
   * 12 dB/octave. A closed vowel sung high would simply disappear.
   *
   * Nudging F1 up to meet F0 is not a workaround for that; it is what singers
   * do, for the same physical reason. A soprano cannot sing /i/ at the top of
   * her range either: the jaw opens and the vowel migrates toward /a/ whether
   * she intends it or not.
   */
  const targets = [Math.max(f1 * scale, freq * 1.1), f2 * scale, f3 * scale];
  const tau = Math.max(0.004, glide / 3);
  const lead = t - glide * 0.4;

  if (!e.tie) {
    if (e.consonant === 'nasal') {
      // The murmur: sound comes out of the nose, the mouth is closed, and the
      // tract is a fixed shape with a low first resonance and little above it.
      moveBand(tract[0], 260 * scale, lead - 0.05, 0.015);
      moveBand(tract[1], 1100 * scale, lead - 0.05, 0.015);
      moveBand(tract[2], 2400 * scale, lead - 0.05, 0.015);
    } else if (e.consonant === 'liquid') {
      // /l/ and /r/ between them: a low F2 and a distinctly lowered F3, which
      // is the single cue that makes an English /r/ recognisable.
      moveBand(tract[1], 1000 * scale, lead - 0.03, 0.012);
      moveBand(tract[2], 2000 * scale, lead - 0.03, 0.012);
    }
  }

  targets.forEach((target, i) => moveBand(tract[i], target, lead, tau));
}

/** One formant of the tract: where it sits, and how sharp it is there. */
interface FormantBand {
  freq: Ramp;
  q: Ramp;
  bandwidth: number;
}

/**
 * Move a resonance, keeping its bandwidth constant.
 *
 * Q has to travel with the frequency because Web Audio specifies sharpness as a
 * ratio rather than a width. Left alone while the formant moves, a resonance
 * that is 80 Hz wide on /u/ becomes 220 Hz wide on /a/ — the peak flattens out
 * exactly on the open vowels that most need it.
 */
function moveBand(band: FormantBand | undefined, hz: number, time: number, tau: number): void {
  if (!band) return;
  band.freq.glide(hz, time, tau);
  band.q.glide(formantQ(hz, band.bandwidth), time, tau);
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
