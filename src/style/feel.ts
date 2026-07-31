/**
 * Feel — how the band plays what it is already playing.
 *
 * Everything else in `src/style` says *what* is played: which figures, which
 * chords, which cells, which instruments. Forty-odd fields of it, and not one of
 * them can say that the bass leans and the snare drags. Timing, note length,
 * accent and subdivision were fixed for the whole song in every genre, which is
 * the entire list of things a groove is made of — so "this chorus is funkier"
 * was not weakly supported, it was inexpressible, in the same way a three-beat
 * ostinato was inexpressible before `Cycle` existed.
 *
 * A Feel is a named bag of scalars applied to events that already exist, over a
 * span of bars. The same shape and the same size as two things that already work
 * — `Mood`, which is seven multipliers over a style, and `SoloVocabulary`, which
 * is twelve knobs over the solo engine. Neither of those authors anything
 * either.
 *
 * ## What a Feel is not
 *
 * **It never touches the melody or the counter, and the type below cannot name
 * them.** Not a convention: those parts are *auditioned*. `composeSectionTune`
 * writes a set of candidates, scores each against the rules and a freshness
 * term, and keeps the winner — so shoving the winner's notes around afterwards
 * hands back a gesture nobody scored, and `tune/judge.ts` never sees the result.
 * `tune/adapt.ts` already wrote this lesson down about mood: a calmer mood should
 * make the engine *want* to move by step, not write a leaping tune and then
 * flatten it. What a feel has to say to a composed part therefore goes into the
 * `Voice` before the audition runs, which is the `voice` block below and is a
 * later wave. The rhythm section is post-processed precisely *because* it is
 * pattern playback: no candidate set, no judge, and a per-section pass over
 * those same events already exists to sit beside.
 *
 * **It modifies, it never authors.** No pattern banks, no note choices, no
 * harmony, no layers added or dropped. A proposal that needs its own bass figure
 * is a style, and that line is the only thing keeping the feel library from
 * growing into a second copy of the style table.
 *
 * **It is genre-neutral, and that is the whole proposition.** `pocket` under an
 * iskelmä foksi and `pocket` under a jazz blues are the same object with the
 * same numbers in it. A feel only one genre could reach would be a style field,
 * which is what we already have and what does not work.
 *
 * Two of the fields are read today — `push` and `articulation`. The rest are
 * declared here so that the waves that implement them add behaviour instead of
 * churning this type, and each says so in its own comment.
 */

import type { DrumVoice, LayerId } from '../core/types.js';

export type FeelId = 'straight' | 'pocket';

/**
 * The layers a Feel may touch.
 *
 * Written as a subset of `LayerId` rather than as `LayerId` itself so that the
 * divide above is a compile error rather than a rule somebody remembers: there
 * is no way to spell `push: { melody: -12 }`. Violating that is silent — a bent
 * tune sounds merely sloppy — which is exactly the kind of mistake worth making
 * unrepresentable.
 */
export type FeelLayer = Extract<LayerId, 'bass' | 'comp' | 'pad' | 'brass' | 'drums'>;

export interface Feel {
  id: FeelId;
  label: string;
  /** One line, for the README and the audition page. */
  description: string;

  /**
   * Milliseconds each layer sits ahead of (−) or behind (+) the grid.
   *
   * In milliseconds and not in beats, for the same reason `concert/groove.ts`
   * expresses its per-performer offsets in seconds: how far ahead a bass player
   * leans is a fact about the player, not about the tempo. A pocket that scaled
   * with BPM would vanish at 180 and become a mistake at 60.
   *
   * This is the single field nothing in the project could express. `applySwing`
   * shifts offbeats only, uniformly, for the whole song.
   *
   * **A drum voice may be named instead of the kit**, which the original sketch
   * of this type could not do and which `pocket` is defined by: the snare drags
   * and the hats stay level, and one number for `drums` says neither. A voice
   * key wins over the `drums` key for that voice; naming neither means level,
   * which is why "hats level" appears in `pocket` as an absence.
   */
  push?: Partial<Record<FeelLayer | DrumVoice, number>>;

  /**
   * Multiplier on note duration, per layer. Below 1 is staccato.
   *
   * The largest audible difference between a funk comp and a swing comp is not
   * where the stabs are, it is how long they last. A three-sixteenth stab and a
   * one-sixteenth stab are the same pattern and two different musics.
   *
   * No drums: a kit event is a strike with no duration on it, and a shorter
   * cymbal is a different cymbal rather than a shorter note.
   */
  articulation?: Partial<Record<Exclude<FeelLayer, 'drums'>, number>>;

  /**
   * Velocity multiplier per sixteenth of the bar, cycled. `[1.3, .7, .8, .7, …]`
   * is weight on the one; the swing feel's is weight on the eighth-note upbeats.
   *
   * Multiplied *over* `metricStrength`, never replacing it — the metre is still
   * the metre, and a feel that overrode it would be a time signature. Normalised
   * to mean 1.0 when it is applied, so it redistributes weight inside a bar
   * without adding any: a feel changes the shape of a section's loudness and
   * never its rank.
   *
   * Rhythm section only. The melody's equivalent is `Voice.accents`, which
   * already exists and is already tiled; `voice` below scales it.
   *
   * Declared, not yet read — wave 4.
   */
  accent?: number[];

  /**
   * Chance an eligible rest gains a ghosted snare or bass note, 0..1.
   *
   * Declared, not yet read — wave 4.
   */
  ghost?: number;

  /**
   * Chance a sustained hit is broken into two shorter ones. Funk subdivides.
   *
   * Declared, not yet read — wave 4.
   */
  subdivide?: number;

  /**
   * Chance a weak-beat hit is displaced by a sixteenth.
   *
   * Declared, not yet read — wave 4.
   */
  displace?: number;

  /**
   * Overrides `Style.swing` for the span. A half-time shuffle inside a straight
   * tune, or a straight bridge in a swung one.
   *
   * The one field that crosses the divide: swing is applied to every layer at
   * assembly, melody included, and it is a grid property rather than a gesture,
   * so bending it does not invalidate a judged tune. It is resolved once per
   * span and applied where `applySwing` already runs — two passes shifting the
   * same offbeat is a double swing, which sounds like a mistake rather than like
   * more swing.
   *
   * Declared, not yet read — wave 4.
   */
  swing?: number;

  /**
   * What the *composed* layers get instead: multipliers folded into `Voice`
   * before the audition runs, exactly as `mood` already is.
   *
   * Deliberately three numbers and not a second field list. Everything a feel
   * wants to say to a melody is already sayable in the voice's own vocabulary —
   * how much it lands off the beat, where it likes to land, and how busy it is —
   * and a feel that needed a fourth is a feel that is trying to compose.
   *
   * Declared, not yet read — wave 4b, which is separate from wave 4 because this
   * is the only part of a Feel that can change which tune wins an audition.
   */
  voice?: {
    /** Multiplier on `Voice.syncopation`. */
    syncopation?: number;
    /** Multiplier on `Voice.accents`, per sixteenth. Absent leaves them alone. */
    accents?: number[];
    /** Multiplier on `Voice.density`. */
    density?: number;
  };
}

/**
 * A feel and the bars it covers.
 *
 * A span rather than a section, because the requirement is "some sections, and
 * in some cases single bars", and a section-shaped field cannot express the
 * second one. A one-bar break is not a special case here; it is a span of length
 * 1, drawn separately, and it is a later wave.
 *
 * Carried on the `Song` as `meta.feels`, so it is IR rather than a private
 * detail of the generator: the concert renderer and `score.ts` can both say what
 * is happening, and a span is inspectable the way `chordLabels` is.
 */
export interface FeelSpan {
  /** Absolute bar indices, half-open. */
  from: number;
  to: number;
  feel: Feel;
  /** How far toward the feel this span goes, 0..1. Scales every field. */
  amount: number;
}

/**
 * The library. Two entries, on purpose.
 *
 * Six feels applied liberally across four genres would make everything sound
 * like the same band, which is the one way this idea fails — so it ships with
 * the identity and the one gesture that any competent rhythm section makes, and
 * the rest arrive once these two have been listened to. Named for what they are
 * rather than for a genre, because that is the claim: `funk` is the entry that
 * would read as a genre if it were overused, and it is not here yet.
 */
export const FEELS: Record<FeelId, Feel> = {
  /**
   * The identity. Every field absent, so applying it is arithmetic nobody hears
   * and the code path is the same one every other feel takes.
   *
   * It is a real entry rather than `undefined` because a style's table has to be
   * able to *say* straight — a humppa that names `straight` alone is making a
   * statement about humppa, and it should read differently from a style that has
   * not thought about feel at all. Those two do generate identically, and that
   * is the point of the second one drawing nothing.
   */
  straight: {
    id: 'straight',
    label: 'Straight',
    description: 'On the grid. What every style in the catalogue did before feels existed.',
  },

  /**
   * The thing that makes a rhythm section sound like people rather than like a
   * sequencer: the bass a hair in front, the backbeat a hair behind, and the
   * time-keeping hand exactly where it always was.
   *
   * The two numbers are of the size the concert's own performer offsets are, and
   * they are small on purpose — this is under the threshold where a listener
   * hears "early" and above the one where they hear nothing. Beyond about 30 ms
   * at these tempos the snare stops dragging and starts being late, which is a
   * different and much worse thing.
   *
   * Only the snare is named. Pushing the whole kit would take the hats and the
   * ride with it, and a kit whose time-keeping hand has moved has not laid back,
   * it has slowed down.
   */
  pocket: {
    id: 'pocket',
    label: 'Pocket',
    description: 'Bass a hair ahead, backbeat a hair behind, hats level. A rhythm section breathing.',
    push: { bass: -12, sd: 18 },
  },
};
