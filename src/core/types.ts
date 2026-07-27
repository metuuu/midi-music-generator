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

/**
 * What the rest of the band does underneath a solo.
 *
 * A band that drops out under every solo sounds like a demo, and in most of
 * this repertoire the rhythm section carrying on *is* the idiom — so this is
 * stated per section rather than left to whichever layers happened to be
 * active.
 *
 *   full     the arrangement continues exactly as written. Iskelmä: this is
 *            dance music, the floor is full, and a rhythm section that gets
 *            clever behind the break has forgotten its job.
 *   comping  the comp thins and syncopates, the drums move to the ride, the
 *            bass keeps walking. The band answers the soloist instead of
 *            running its pattern. Jazz.
 *   sparse   comp out, drums to brushes — the contrast a bass solo needs to be
 *            audible at all.
 *   trade    the section is shared, and `SoloAssignment.blocks` says how. The
 *            band stops dead for the drummer's bars and comes back in on the
 *            downbeat. This also covers the degenerate case of a full drum
 *            chorus, where the drummer has every bar and nothing alternates —
 *            read `blocks`, never the name, or a drum chorus reads as trading
 *            the spotlight between the drummer and the drummer.
 */
export type BackingPolicy = 'full' | 'comping' | 'sparse' | 'trade';

/**
 * Who is soloing, and over what.
 *
 * Before this existed, "solo" was inferred: the lead rested and the counter
 * instrument took the tune, and every consumer that cared re-derived that rule
 * for itself. Naming the soloist makes the section say what it means — which
 * matters most to the things outside the generator, since a stage cannot point
 * a follow spot at an inference.
 */
export interface SoloAssignment {
  /** Which layer takes the solo. `drums` is a drum solo. */
  layer: LayerId;
  /**
   * Human name of the instrument soloing, matching `Track.instrument`.
   *
   * One exception, and it is unavoidable: a drum kit is a `DrumTrack`, not a
   * `Track`, so it has no instrument name to match. Drum solos carry
   * `'drum kit'` — the name a showbill would print. A bank name like
   * "LinnDrum" would be wrong; that is a sample set, not an instrument.
   */
  instrument: string;
  /** What the band plays underneath. */
  backing: BackingPolicy;
  /**
   * Who has which bars, when the section is shared.
   *
   * Only present on `trade`. Without it, "the spot alternates every four bars"
   * is an assumption each consumer has to hard-code — and two of them did,
   * independently, before this field existed. Trading is not always fours and
   * the blocks are not always even, so the section has to say.
   *
   * `soloBars` and `drumBars` are `[fromBar, toBar)` **relative to the section**
   * and together cover it. A full drum chorus — the band out for the whole
   * section rather than genuinely alternating — is the degenerate case where
   * `soloBars` is empty and `drumBars` is the entire section.
   */
  blocks?: { soloBars: [number, number][]; drumBars: [number, number][] };
}

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
  /**
   * Set on `solo` sections only. Absent everywhere else, and absent on a solo
   * section whose nominal soloist is not actually sounding.
   */
  solo?: SoloAssignment;
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

/**
 * Relative level of each drum voice within the kit, 0..1.
 *
 * A kit is not one instrument at one level. A closed hi-hat struck as hard as a
 * kick is roughly twice as loud to the ear, because hearing peaks exactly where
 * a hat lives and bottoms out where a kick does — so a kit mixed by velocity
 * alone is all cymbals. These numbers are the balance an engineer would set on
 * the faders, and a genre may override any of them.
 *
 * This used to live in the Strudel renderer, where MIDI could not see it, which
 * meant the audition and the shipping file disagreed about the drum balance.
 */
export const DEFAULT_DRUM_MIX: Record<DrumVoice, number> = {
  bd: 1.0, sd: 0.85, rim: 0.7, hh: 0.45, oh: 0.5, cp: 0.7,
  lt: 0.7, mt: 0.7, ht: 0.7, cr: 0.55, rd: 0.5, perc: 0.6, cb: 0.5, sh: 0.4,
};

/**
 * Per-track effects.
 *
 * These are a *mix* decision rather than a musical one everywhere except
 * ambient, where they are the composition: a Boards of Canada track is a
 * filtered, saturated, reverberant object and the dry notes underneath are not
 * the piece. That is the same argument as "the pad is the piece", and it is why
 * this sits in the IR rather than in a renderer.
 *
 * Only what survives to a real delivery format is expressed here. Two fields
 * are audition-only and say so — a native engine is free to implement them, and
 * MIDI simply has nowhere to put them.
 */
export interface Effects {
  /** Send to the song's reverb, 0..1. MIDI CC91 — GM level 1, universal. */
  reverb?: number;
  /**
   * Send to the song's delay, 0..1. **Audition only**: MIDI has no standard
   * delay controller, and inventing one would mean a .mid that only plays back
   * correctly on the synth we happened to test.
   */
  delay?: number;
  /**
   * Lowpass cutoff in Hz. MIDI CC74, which is GM2/GS rather than GM1 and is
   * defined *relative* to the patch's own filter — so the MIDI render only ever
   * uses it to darken, never to brighten. FluidSynth honours it; a bare GM1
   * device ignores it and you get the unfiltered patch, which is wrong but not
   * broken.
   */
  lowpass?: number;
  /** Highpass cutoff in Hz. **Audition only** — GM has no highpass. */
  highpass?: number;
  /** Filter resonance, 0..1. MIDI CC71, same GM2 caveat as `lowpass`. */
  resonance?: number;
  /** Stereo position, -1 hard left … +1 hard right. MIDI CC10. */
  pan?: number;
}

/**
 * The space every track sends into.
 *
 * Reverb size and delay time belong to the *room*, not to the instrument
 * standing in it — one hall, and each player further forward or further back in
 * it. That is how a mixer works and, not coincidentally, how MIDI works: CC91
 * is a send level to the synth's single global reverb, and there is no
 * per-channel reverb to give a size to.
 */
export interface Space {
  /** Reverb decay and size, 0..1. */
  reverbSize: number;
  /** Delay time in *beats*, so it stays musical across tempos. */
  delayBeats: number;
  /** Delay feedback, 0..1. */
  delayFeedback: number;
}

export const DEFAULT_SPACE: Space = {
  reverbSize: 0.5,
  delayBeats: 1,
  delayFeedback: 0.3,
};

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
  /** Filtering, reverb send and stereo position. Absent means dry and centred. */
  effects?: Effects;
}

export interface DrumTrack {
  /** Strudel drum-machine bank, e.g. "LinnDrum". */
  bank: string;
  events: DrumEvent[];
  gain: number;
  /** Relative level of each voice within the kit. See `DEFAULT_DRUM_MIX`. */
  voiceGains: Record<DrumVoice, number>;
  effects?: Effects;
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
  /** Repetition level id, e.g. 'catchy'. */
  hook: string;
  hookLabel: string;
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
  /** The reverb and delay every track's send level refers to. */
  space: Space;
}

export function songDurationBeats(song: Song): number {
  return song.meta.totalBars * song.meta.beatsPerBar;
}

export function songDurationSeconds(song: Song): number {
  return (songDurationBeats(song) / song.meta.bpm) * 60;
}
