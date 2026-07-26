/**
 * Vocabulary for describing an iskelmä dance rhythm.
 *
 * Everything is expressed on a sixteenth-note grid: a 4/4 bar is 16 slots, a
 * 3/4 bar is 12. Positive numbers in a rhythm cell are sounding notes, negative
 * numbers are rests, and the absolute value is the length in sixteenths.
 */

import type { DrumVoice, Effects, LayerId, SectionKind, Space } from '../core/types.js';
import type { InstrumentId } from './instruments.js';
import type { Mode } from '../core/scale.js';
import type { VoicingStyle } from '../core/chord.js';
import type { StrictnessId } from '../generate/constraints.js';
import type { HookId } from '../generate/hook.js';

/** One bar of melodic rhythm. `[6, 2, 8]` = dotted quarter, eighth, half. */
export type RhythmCell = number[];

export interface WeightedCell {
  cell: RhythmCell;
  weight: number;
}

/** A chord progression, one roman numeral per bar. */
export interface Progression {
  chords: string[];
  weight: number;
  /** Optional note about why this progression is idiomatic — surfaced in docs. */
  note?: string;
}

export type BassTone = 'root' | 'fifth' | 'third' | 'seventh' | 'octave' | 'approach';

export interface BassHit {
  /** Slot index within the bar, in sixteenths. */
  at: number;
  /** Duration in sixteenths. */
  dur: number;
  tone: BassTone;
  vel?: number;
}

export interface BassPattern {
  name: string;
  weight: number;
  hits: BassHit[];
  /**
   * Generate a proper walking line instead of following `hits` literally:
   * quarter notes that connect one chord root to the next by step, with a
   * chromatic approach on beat 4. The signature sound of a jazz rhythm
   * section, and not something a fixed pattern can fake.
   */
  walking?: boolean;
  /**
   * Merge a note into the one before it when they are the same pitch and meet
   * end to end, instead of re-articulating.
   *
   * This is what separates a pedal from a pulse. Eight bars of one chord at
   * 60 BPM re-attacked on every downbeat is a bass playing a slow crotchet
   * figure; held through, it is a drone, and a drone is what ambient is built
   * on. The pad already merges this way, and for the same reason.
   */
  sustain?: boolean;
}

export interface CompHit {
  at: number;
  dur: number;
  vel?: number;
  /** Number of voices in the chord for this hit. Defaults to the pattern value. */
  voices?: number;
}

export interface CompPattern {
  name: string;
  weight: number;
  voices: number;
  hits: CompHit[];
  /** How the chord is stacked. Defaults to `tertian`. */
  voicing?: VoicingStyle;
  /**
   * Play one note of the voicing per hit instead of the whole chord, cycling
   * upward and carrying the cycle across barlines.
   *
   * A comp pattern sounds the entire voicing at once, which is what a pianist
   * does and the opposite of what a sequencer does. Carrying the index across
   * bars is the important half: a four-note figure against a four-beat bar
   * would otherwise land identically every bar, and the whole appeal of a
   * Berlin-school sequence is that the pattern and the bar drift out of phase.
   */
  arpeggio?: boolean;
  /**
   * Merge a chord into the one before it when the harmony has not moved,
   * instead of re-striking the whole voicing on every downbeat. The same
   * mechanism as `sustain` on a bass pattern, and wanted for the same reason:
   * a chord restruck every bar is a pulse, and a drone has no pulse.
   *
   * Only meaningful on a pattern that already fills its bar. On one that leaves
   * a gap, the gap is the pattern.
   */
  sustain?: boolean;
}

export interface DrumPattern {
  name: string;
  weight: number;
  /** Slot indices per drum voice, in sixteenths. */
  voices: Partial<Record<DrumVoice, number[]>>;
}

export interface Style {
  id: string;
  label: string;
  /** Short explanation of the rhythm, used in the README and the demo UI. */
  description: string;
  beatsPerBar: number;
  beatUnit: number;
  bpm: [number, number];
  /** 0 = straight. Foxtrot and some 60s material shuffle lightly. */
  swing: number;
  /** Relative likelihood of the song being in minor vs major. */
  modeWeights: Record<Mode, number>;
  /**
   * Does the chorus lift into the relative major? A defining iskelmä move:
   * melancholy verse in i, hopeful chorus in III.
   */
  relativeMajorChorus: number;
  /**
   * Progressions for the style's *primary* mode — minor for tango and modal
   * jazz, major for humppa and swing. Whichever mode a style mostly lives in.
   */
  progressions: Partial<Record<SectionKind, Progression[]>> & {
    verse: Progression[];
    chorus: Progression[];
  };
  /**
   * Overrides for the other mode. Roman numerals are read relative to the
   * mode, so a major-key table read in minor produces nonsense — a style that
   * can appear in both modes needs the table for each.
   */
  majorProgressions?: Partial<Record<SectionKind, Progression[]>>;
  minorProgressions?: Partial<Record<SectionKind, Progression[]>>;
  melodyCells: WeightedCell[];
  /** Cells reserved for phrase endings — longer, more settled. */
  cadenceCells: WeightedCell[];
  bass: BassPattern[];
  comp: CompPattern[];
  drums: DrumPattern[];
  /**
   * Layers this style never uses, regardless of arrangement density. A drone
   * has no drum kit and no brass section, and no amount of density should
   * conjure one.
   */
  excludeLayers?: LayerId[];
  /**
   * Layers this style always uses, regardless of section kind or density.
   *
   * The mirror of `excludeLayers`, and ambient is why it exists. The default
   * arrangement rules treat `pad` as decoration added when there is room for
   * it — true for a dance band, exactly backwards for music where the pad *is*
   * the piece and everything else is decoration on it.
   */
  requireLayers?: LayerId[];
  /**
   * Does this style end its sections with a drum fill? Defaults to true.
   *
   * A tom roll into a crash is how a dance band signposts the next section. In
   * ambient it is the single most out-of-place thing the drum generator can
   * do — the idiom's whole proposition is that sections arrive without being
   * announced.
   */
  drumFills?: boolean;
  /**
   * Beats between successive notes of a counter-melody figure. Defaults to
   * 0.5 — an eighth note, which is right for anything danced to.
   *
   * The counter answers in the lead's gaps, and in ambient those gaps are
   * bars rather than beats. Answering an eight-second silence with a burst of
   * eighth notes reads as a different piece of music breaking in.
   */
  counterSpacing?: number;
  /**
   * Override the genre's default constraint level. Bebop wants `free`: the
   * chromatic approach notes and unprepared dissonances the rules exist to
   * suppress are precisely what the idiom is made of.
   */
  strictness?: StrictnessId;
  /**
   * Override the genre's default repetition level. How much a style repeats
   * itself is one of the things that distinguishes styles inside a genre:
   * humppa is relentless where tango develops, and bebop is the extreme case
   * of a music whose whole value proposition is never playing it twice.
   */
  hook?: HookId;
  /**
   * Bars per chorus when the form is built on a fixed chorus length rather
   * than eight-bar units. 12 for the blues.
   */
  chorusBars?: number;
  /** Melodic character knobs. */
  melody: {
    /** Probability of a leap (>2 semitones) at any given non-cadential note. */
    leap: number;
    /** Probability of adding a grace/passing ornament. */
    ornament: number;
    /** Preferred melodic span in semitones. */
    span: number;
    /** Probability that a phrase repeats its motif as an exact sequence. */
    sequence: number;
  };
}

export interface EraProfile {
  id: string;
  label: string;
  description: string;
  /** Strudel drum-machine banks, weighted. */
  drumBanks: (readonly [string, number])[];
  /** Instrument choices per layer, weighted. */
  palette: {
    melody: (readonly [InstrumentId, number])[];
    counter: (readonly [InstrumentId, number])[];
    comp: (readonly [InstrumentId, number])[];
    pad: (readonly [InstrumentId, number])[];
    bass: (readonly [InstrumentId, number])[];
    brass: (readonly [InstrumentId, number])[];
  };
  /** Style weights — some dances belong more to one era than the other. */
  styleWeights: Record<string, number>;
  /** Multiplier applied to the style's tempo range. */
  tempoScale: number;
  /** How likely the final chorus lifts by a semitone or tone. */
  keyChangeChance: number;
  /** Overall arrangement density 0..1, nudges how many layers play at once. */
  density: number;
  /**
   * The room this era records in. Merged over the genre's, which is merged
   * over `DEFAULT_SPACE`.
   */
  space?: Partial<Space>;
  /**
   * Per-layer filtering, reverb send and stereo position, merged *over* the
   * genre's. This is the natural home for effects: the era already decides
   * which drum machine and which instruments, and how wet and how dark the
   * result is belongs in exactly the same sentence. A 1990s sampler score and
   * a 2000s hybrid one differ far more in reverb and filtering than they do in
   * their choice of patches.
   */
  effects?: Partial<Record<LayerId, Effects>>;
}

export interface Mood {
  id: string;
  label: string;
  /** English gloss for UI. */
  gloss: string;
  /** Per-style multipliers applied on top of the era's style weights. */
  styleBias: Record<string, number>;
  /** Multipliers on the style's own mode weights. */
  modeBias: { minor: number; major: number };
  /** -1 = bottom of the tempo band, +1 = top. */
  tempo: number;
  /** Added to the era density, clamped to [0.25, 1]. */
  density: number;
  /** Multiplier on the style's ornament probability. */
  ornament: number;
  /** Multiplier on melodic leap probability — calmer moods move by step. */
  leap: number;
  /** Bias on how often the arrangement drops to a sparse texture. */
  restraint: number;
}
