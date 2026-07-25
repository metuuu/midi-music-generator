/**
 * The Genre abstraction.
 *
 * A genre owns everything that is *culturally* specific: which dances or
 * grooves exist, which instruments and production eras, what moods mean, what
 * songs are called, how they are structured, and — importantly — how a melody
 * relates to the harmony underneath it.
 *
 * That last point is the one that forced this abstraction to exist. In iskelmä
 * the melody follows the *key*: natural minor throughout, harmonic minor at
 * cadences. In jazz the melody follows the *chord*: every chord quality
 * implies its own scale, and the line re-orients bar by bar. Those are not two
 * settings of one system, they are two different systems, and pretending
 * otherwise would produce jazz that sounds like iskelmä with extensions bolted
 * on.
 */

import type { Chord } from '../core/chord.js';
import type { Pc } from '../core/pitch.js';
import type { Rng } from '../core/rng.js';
import type { Mode, Scale } from '../core/scale.js';
import type { SectionKind } from '../core/types.js';
import type { RuleOverrides, StrictnessId } from '../generate/constraints.js';
import type { EraProfile, Mood, Style } from '../style/types.js';

export interface FormStep {
  kind: SectionKind;
  bars: number;
}

export interface Genre {
  id: string;
  label: string;
  /** One line, shown in the CLI and the audition page. */
  description: string;

  styles: Record<string, Style>;
  eras: Record<string, EraProfile>;
  moods: Record<string, Mood>;

  /** Song-title generator. */
  title(rng: Rng): string;

  /**
   * Song forms, weighted. Iskelmä is verse/chorus; jazz is head–solos–head
   * over a fixed chorus length, which is why this cannot be shared.
   */
  forms: (readonly [FormStep[], number])[];

  /** Keys the genre actually lives in, weighted. */
  keys: {
    minor: (readonly [Pc, number])[];
    major: (readonly [Pc, number])[];
  };

  /** Constraint level that suits the idiom by default. */
  defaultStrictness: StrictnessId;

  /**
   * Adjustments to the shared rule table. The rules encode faults classical
   * and jazz practice largely agree on — but not entirely, and a rule applied
   * to a genre that does not hold it produces music that is correct and wrong.
   */
  ruleOverrides?: RuleOverrides;

  /**
   * Which scale the melody should draw on for a given chord.
   * Key-relative for iskelmä, chord-relative for jazz.
   */
  scaleForChord(tonic: Pc, mode: Mode, chord: Chord): Scale;

  /** Length in seconds a track of this genre should aim for. */
  duration: [number, number];
}
