/**
 * The Song IR — the hand-off point between "musical decisions" and "how it
 * gets heard".
 *
 * Nothing below this line knows about Strudel, MIDI, or WebAudio. That is the
 * whole point: the generator is MIT-licensed and portable, and Strudel is one
 * interchangeable renderer sitting behind it.
 */

import type { Midi } from './pitch.js';
import type { Mode } from './scale.js';

/**
 * Named layers. A game can duck, mute or crossfade these independently, which
 * is also the hook for the layered-ambient work later on.
 */
export type LayerId =
  | 'drums'
  | 'bass'
  | 'comp'      // accordion / guitar / e-piano chordal rhythm
  | 'pad'       // sustained strings or organ
  | 'melody'    // the "vocal" line, played by an instrument
  | 'counter'   // answering phrases in the melody's gaps
  | 'brass'     // section stabs and swells
  | 'vocal';    // wordless sung line doubling the melody

export const LAYER_ORDER: LayerId[] = [
  'drums', 'bass', 'comp', 'pad', 'brass', 'counter', 'melody', 'vocal',
];

export type SectionKind = 'intro' | 'verse' | 'chorus' | 'bridge' | 'solo' | 'outro';

export interface Section {
  kind: SectionKind;
  /** Bar index where this section starts (0-based, absolute in the song). */
  startBar: number;
  lengthBars: number;
  /** Semitone transposition applied to this section relative to the base key. */
  transpose: number;
  /** Local mode — choruses frequently lift into the relative major. */
  mode: Mode;
  /** Which layers sound in this section. Drives the arrangement dynamics. */
  activeLayers: LayerId[];
  /** Chord per bar, as roman numeral text (for display/debug). */
  chordLabels: string[];
}

export interface NoteEvent {
  /** Absolute position from song start, in beats. */
  beat: number;
  /** Duration in beats. */
  duration: number;
  midi: Midi;
  /** 0..1. Renderers scale this into their own velocity/gain domain. */
  velocity: number;
  /**
   * Which vowel this note is sung on. Only the `vocal` layer sets it; every
   * other layer leaves it undefined and renderers that cannot sing ignore it.
   */
  vowel?: Vowel;
  /** How the syllable is started. Only the `vocal` layer sets it. */
  consonant?: Consonant;
}

/**
 * Consonant classes, by how they are made rather than by letter.
 *
 * Each is a manner of articulation, and the point of grouping them this way is
 * that a manner is *synthesisable* where a letter is not: a stop is a burst of
 * noise and a sudden vowel, a nasal is a soft rise with no burst at all. Four
 * classes plus bare vowel onset is enough to stop every syllable sounding like
 * the last one, which is the entire job here — nobody is going to mistake this
 * for language, and it should not try to be.
 *
 *   none       a vowel with no attack consonant — "ah"
 *   stop       t d k p b — a click, then the vowel arrives instantly
 *   fricative  s sh f — a longer rush of noise leading into the vowel
 *   nasal      m n — no burst, the voice swells in through the nose
 *   liquid     l r — no burst either, but quicker than a nasal
 */
export type Consonant = 'none' | 'stop' | 'fricative' | 'nasal' | 'liquid';

/**
 * The vowels a renderer is expected to be able to produce.
 *
 * Five cardinal vowels, six front-rounded and central ones, and four
 * nasalised — the set a five-band formant filter covers, and a reasonable
 * working alphabet for a native implementation too. Deliberately spelled in
 * ASCII: `oe` rather than `ö`, `ue` rather than `ü`, so the strings survive
 * every file format and notation this project passes them through.
 */
export type Vowel =
  | 'a' | 'e' | 'i' | 'o' | 'u'
  | 'ae' | 'aa' | 'oe' | 'ue' | 'y' | 'uh'
  | 'un' | 'en' | 'an' | 'on';

/**
 * How a sung line is articulated.
 *
 * These are synthesis parameters, not Strudel parameters — an envelope, a
 * vibrato and a pitch scoop are things any engine implements, so this stays on
 * the renderer-agnostic side of the line. The Strudel renderer maps them onto
 * its controls; a native engine reads the same numbers.
 */
export interface VoiceSettings {
  /**
   * How often the mouth re-opens, in beats. A note longer than this is
   * re-attacked for as long as it lasts instead of being held.
   *
   * This is the single most important number here. Without it a sung line is a
   * pad; with it the ear hears syllables, and syllables are what it recognises
   * as a person rather than an instrument.
   */
  syllableBeats: number;
  /**
   * How long one syllable sounds, in beats. Must be shorter than
   * `syllableBeats` — the gap is the mouth closing, and it is what stops the
   * re-attacks from smearing back into a drone.
   */
  blipBeats: number;
  /**
   * Level of the unfiltered source, relative to the formant bands.
   *
   * Small on purpose, and the small number was expensive to learn. A vowel is
   * not three peaks — it is a harmonic series *with* peaks on it — so some
   * unfiltered source has to be there or the voice is hollow. But this band is
   * the one part of the signal that is identical for every vowel, so any more
   * than a trace of it drowns out the differences the formants exist to create.
   * At 0.5 the spectral distance between /a/, /u/ and /i/ measured 3.5 dB and
   * every syllable sounded the same; at 0.15 it measures 6.4 dB.
   *
   * The tension is real and it is a consequence of building this out of
   * *parallel* filters. A vocal tract is a cascade — each resonance multiplies
   * the whole spectrum, so it can be bright and strongly coloured at once.
   * Parallel bands have to trade one against the other. A native engine should
   * chain resonators in series and will not need this compromise.
   */
  bodyGain: number;
  /** Lowpass on that body, in Hz — takes the fizz off a raw sawtooth. */
  bodyLpf: number;
  /**
   * Level of the consonant noise bursts relative to the voice, 0..1.
   *
   * These sit at 3–6 kHz, where hearing is most sensitive, so they carry a long
   * way — a burst mixed as loud as the voice reads as a snare, not a consonant.
   */
  burstGain: number;
  /** ADSR, seconds. `attack` is the default; a consonant overrides it per syllable. */
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  /**
   * Breath: broadband noise mixed into the source, 0..1.
   *
   * Only meaningful to an engine that synthesises its own source. Strudel's
   * sampler ignores it, and the preview uses a sampled voice — which has real
   * breath in it already.
   */
  noise: number;
  /** Vibrato rate in Hz. Around 5–6 is human; much faster reads as a synth LFO. */
  vibRate: number;
  /** Vibrato depth in semitones. */
  vibDepth: number;
  /**
   * The scoop: how far below the note the voice starts, in semitones, and how
   * long it takes to arrive. The single strongest "this is a person" cue there
   * is — a voice reaches a pitch, an organ is simply already on it.
   */
  scoop: number;
  scoopTime: number;
}

export interface DrumEvent {
  beat: number;
  /** Generic drum voice name; renderers map this to samples or GM notes. */
  voice: DrumVoice;
  velocity: number;
}

export type DrumVoice =
  | 'bd' | 'sd' | 'rim' | 'hh' | 'oh' | 'cp'
  | 'lt' | 'mt' | 'ht' | 'cr' | 'rd' | 'perc' | 'cb'
  /** Shaker — stands in for brushes, which jazz kits need and drum machines lack. */
  | 'sh';

export interface Track {
  layer: LayerId;
  /** Human name, e.g. "accordion". */
  instrument: string;
  /** General MIDI program number, 0-based. */
  gmProgram: number;
  /** Strudel soundfont name, e.g. "gm_accordion". */
  strudelSound: string;
  notes: NoteEvent[];
  /** Mix level 0..1, applied on top of per-note velocity. */
  gain: number;
  /**
   * Set on the `vocal` layer only. Its presence is what tells a renderer this
   * track is sung rather than played, and that the notes carry vowels.
   */
  voice?: VoiceSettings;
}

export interface DrumTrack {
  /** Strudel drum-machine bank, e.g. "LinnDrum". */
  bank: string;
  events: DrumEvent[];
  gain: number;
}

export interface SongMeta {
  seed: string;
  title: string;
  /** Style id, e.g. "tango". */
  style: string;
  styleLabel: string;
  era: string;
  eraLabel: string;
  mood: string;
  /** Genre id, e.g. 'iskelma' or 'jazz'. */
  genre: string;
  genreLabel: string;
  /** Constraint strictness id, e.g. 'standard'. */
  strictness: string;
  strictnessLabel: string;
  tonic: number;
  mode: Mode;
  keyLabel: string;
  bpm: number;
  /** Beats per bar. */
  beatsPerBar: number;
  /** Which note value gets the beat (4 = quarter). */
  beatUnit: number;
  totalBars: number;
  /** Swing amount 0..0.33; 0 = straight. */
  swing: number;
}

export interface Song {
  meta: SongMeta;
  sections: Section[];
  tracks: Track[];
  drums: DrumTrack;
}

export function songDurationBeats(song: Song): number {
  return song.meta.totalBars * song.meta.beatsPerBar;
}

export function songDurationSeconds(song: Song): number {
  return (songDurationBeats(song) / song.meta.bpm) * 60;
}
