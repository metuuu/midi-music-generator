/**
 * Vocabulary for describing an iskelmä dance rhythm.
 *
 * Everything is expressed on a sixteenth-note grid: a 4/4 bar is 16 slots, a
 * 3/4 bar is 12. Positive numbers in a rhythm cell are sounding notes, negative
 * numbers are rests, and the absolute value is the length in sixteenths.
 */

import type { DrumVoice, LayerId, SectionKind } from '../core/types.js';
import type { Mode } from '../core/scale.js';

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
  progressions: Partial<Record<SectionKind, Progression[]>> & {
    verse: Progression[];
    chorus: Progression[];
  };
  /** Progressions keyed by mode where the two differ substantially. */
  majorProgressions?: Partial<Record<SectionKind, Progression[]>>;
  melodyCells: WeightedCell[];
  /** Cells reserved for phrase endings — longer, more settled. */
  cadenceCells: WeightedCell[];
  bass: BassPattern[];
  comp: CompPattern[];
  drums: DrumPattern[];
  /** Layers this style never uses, regardless of arrangement density. */
  excludeLayers?: LayerId[];
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
