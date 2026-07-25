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
  | 'brass';    // section stabs and swells

export const LAYER_ORDER: LayerId[] = ['drums', 'bass', 'comp', 'pad', 'brass', 'counter', 'melody'];

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
}

export interface DrumEvent {
  beat: number;
  /** Generic drum voice name; renderers map this to samples or GM notes. */
  voice: DrumVoice;
  velocity: number;
}

export type DrumVoice = 'bd' | 'sd' | 'rim' | 'hh' | 'oh' | 'cp' | 'lt' | 'mt' | 'ht' | 'cr' | 'rd' | 'perc' | 'cb';

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
