/**
 * The Genre abstraction.
 *
 * A genre owns everything that is *culturally* specific: which dances or
 * grooves exist, which instruments and production eras, what moods mean, what
 * songs are called, how they are structured, and — importantly — how a melody
 * relates to the harmony underneath it.
 *
 * That last point is the one that forced this abstraction to exist, and there
 * are now three genuinely different answers to it:
 *
 *  - **iskelmä** follows the *key* — natural minor throughout, harmonic minor
 *    at cadences;
 *  - **jazz** follows the *chord* — every chord quality implies its own scale,
 *    and the line re-orients bar by bar;
 *  - **ambient** follows the *drone* — one scale rooted on the tonic for the
 *    whole piece, bent to absorb whatever the chord underneath happens to be,
 *    so the tonal centre never moves at all.
 *
 * Those are not three settings of one system. Pretending otherwise would
 * produce jazz that sounds like iskelmä with extensions bolted on, and ambient
 * that sounds like a very slow ballad.
 */

import type { Chord } from '../core/chord.js';
import type { Pc } from '../core/pitch.js';
import type { Rng } from '../core/rng.js';
import type { Mode, Scale } from '../core/scale.js';
import type { DrumVoice, Effects, LayerId, SectionKind, Space } from '../core/types.js';
import type { RuleOverrides, StrictnessId } from '../generate/constraints.js';
import type { HookId } from '../generate/hook.js';
import type { EraProfile, Mood, Style } from '../style/types.js';
import type { VocalProfile } from '../style/vocals.js';

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

  /**
   * How this genre sings, when asked to. Opt-in via `vocals: true` — the
   * station is instrumental by default.
   */
  vocals: VocalProfile;

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
   * Repetition level that suits the idiom by default.
   *
   * This is one of the sharper distinctions between the two genres here.
   * Iskelmä is verse/chorus pop and its chorus is meant to be the same tune
   * every time. Jazz states a head and then leaves it, and a form that recalled
   * its solos would not be jazz at all.
   */
  defaultHook: HookId;

  /**
   * Adjustments to the shared rule table. The rules encode faults classical
   * and jazz practice largely agree on — but not entirely, and a rule applied
   * to a genre that does not hold it produces music that is correct and wrong.
   */
  ruleOverrides?: RuleOverrides;

  /**
   * Which scale the melody should draw on for a given chord.
   * Key-relative for iskelmä, chord-relative for jazz, drone-relative for
   * ambient.
   */
  scaleForChord(tonic: Pc, mode: Mode, chord: Chord): Scale;

  /**
   * Per-layer mix overrides, 0..1, `drums` included. Omitted layers keep the
   * default dance-band balance — melody loudest, pad furthest back. Ambient
   * inverts that, which is a statement about the music rather than a taste in
   * mixing: there the pad is the piece and the kit, when there is one, is
   * barely present.
   */
  mix?: Partial<Record<LayerId, number>>;

  /**
   * Per-voice balance inside the kit, 0..1. Merged over `DEFAULT_DRUM_MIX`.
   * A genre that wants its hats further back than everyone else's says so
   * here rather than by writing quieter patterns.
   */
  drumMix?: Partial<Record<DrumVoice, number>>;

  /**
   * The room. Merged over `DEFAULT_SPACE`; an era may refine it further.
   */
  space?: Partial<Space>;

  /**
   * Filtering, reverb send and stereo position per layer. Merged under the
   * era's, because production is mostly an era decision — but a genre-wide
   * statement belongs here: ambient wants a dry bass and a drenched pad
   * whichever decade it is pretending to be from.
   */
  effects?: Partial<Record<LayerId, Effects>>;

  /** Length in seconds a track of this genre should aim for. */
  duration: [number, number];
}
