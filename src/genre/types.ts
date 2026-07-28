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
import type {
  BackingPolicy, DrumVoice, Effects, LayerId, SectionKind, Space,
} from '../core/types.js';
import type { RuleOverrides, StrictnessId } from '../generate/constraints.js';
import type { HookId } from '../generate/hook.js';
import type { EraProfile, Mood, Style } from '../style/types.js';
import type { VocalProfile } from '../style/vocals.js';
import type { FillPalette } from '../generate/fills.js';
import type { SoloProfile } from '../generate/solo.js';

export interface FormStep {
  kind: SectionKind;
  bars: number;
}

/**
 * How the last bar of a piece lands.
 *
 * A generated form runs out of bars; that is not the same thing as ending, and
 * the difference is the most audible unfinished edge this generator had. The
 * final bar used to be an ordinary bar of the pattern, cut wherever the loop
 * point fell — a comp figure sliced mid-figure, a tune left on whatever note
 * the phrase happened to be passing through.
 *
 * So the last bar is not a bar of the arrangement any more. It is the ending,
 * and there are exactly two of them in this repertoire:
 *
 *   button  everybody lands the final chord together on the downbeat and holds
 *           it, with a cymbal under it. What a dance band does, what a jazz
 *           head does on the way out, and what an audience claps at.
 *   fade    the chord that is already sounding is simply held and let go, with
 *           nothing struck on top of it. Ambient does not finish, it stops
 *           being there, and a crash on the end of a drone is a joke.
 */
export type EndingStyle = 'button' | 'fade';

/**
 * What the piece turned out to be, so that its title can avoid claiming
 * otherwise.
 *
 * Titles in all three of these repertoires are half imagery and half
 * announcement — "Sodium Corridor" only pictures something, but "Midnight
 * Swing", "Satumaan valssi" and "Blue Harlem Blues" also say what the band is
 * playing. An announcement that disagrees with the music is worse than no
 * announcement at all: a bossa called a swing reads as a mistake, not as a
 * poetic liberty. So the word pools are filtered against the piece before
 * anything is drawn from them.
 */
export interface TitleContext {
  style: Style;
  mood: Mood;
  /** The tempo actually chosen, not the style's band. */
  bpm: number;
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
  title(rng: Rng, ctx: TitleContext): string;

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

  /** How a piece in this genre finishes. See `EndingStyle`. */
  ending: EndingStyle;

  /**
   * Whether a live band counts this music in.
   *
   * A *staging* fact rather than a musical one, and the only one of those in
   * this table — which is why it is here rather than inferred on the stage: the
   * concert is a renderer of the IR and does not get to invent bars of music.
   * Applied by `withCountIn`, and only ever to a number a band is playing in
   * front of people. The radio never counts anything in; a record that counted
   * itself in would be a demo.
   *
   * False for music that has no pulse to count. An ambient piece does not
   * begin, it is found already happening, and four clicks in front of it would
   * be four clicks in front of the wrong music.
   */
  countIn: boolean;

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
  /** Default fill vocabulary for the genre's styles. See `generate/fills.ts`. */
  fills?: FillPalette;

  /**
   * What the band plays underneath a solo section. Defaults to `full`.
   *
   * Whether the rhythm section carries on unchanged, thins out and answers, or
   * stops dead for four bars is a *genre* fact — a tanssilava band never stops,
   * and a jazz rhythm section that never reacts is not comping. This is the
   * fallback; `solo.backing` may name a different policy per soloist, because
   * what the band does behind a bass solo is not what it does behind a horn.
   */
  soloBacking?: BackingPolicy;

  /**
   * Who solos, over what, and in what language. Absent means the genre has no
   * solos and its forms contain no `solo` sections — which is a statement about
   * the music rather than an omission. See `generate/solo.ts`.
   *
   * This is the largest genre-owned table after the styles themselves, and it
   * has to be genre-owned for the same reason `scaleForChord` does: a jazz
   * chorus and an iskelmä instrumental break are not two settings of one
   * system. One is improvisation over the changes and the other is the tune
   * with more notes in it, and generating the second by turning the first down
   * would be wrong about the genre rather than merely tame.
   */
  solo?: SoloProfile;

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
