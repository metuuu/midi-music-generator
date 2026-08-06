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
 * `Voice` before the audition runs, which is the `voice` block below. The rhythm
 * section is post-processed precisely *because* it is pattern playback: no
 * candidate set, no judge, and a per-section pass over those same events already
 * exists to sit beside.
 *
 * **It modifies, it never authors.** No pattern banks, no note choices, no
 * harmony, no layers added or dropped. A proposal that needs its own bass figure
 * is a style, and that line is the only thing keeping the feel library from
 * growing into a second copy of the style table.
 *
 * Two fields do add an event — `ghost` and `subdivide` — and that is not the
 * exception it looks like. The invariant is that a feel never changes *what* is
 * played, and the note count was only ever standing in for it. A ghost repeats
 * the pitch of the note it leads into and a subdivision repeats the pitch it was
 * split from, so neither carries a pitch class that was not already sounding and
 * neither proposes anything about the harmony, the voicing or the figure. That
 * is where the boundary between "how" and "what" actually is, and it is asserted
 * in those terms in `genre-check.ts` rather than as a count.
 *
 * **It is genre-neutral, and that is the whole proposition.** `pocket` under an
 * iskelmä foksi and `pocket` under a jazz blues are the same object with the
 * same numbers in it. A feel only one genre could reach would be a style field,
 * which is what we already have and what does not work. Measured, now that both
 * exist: the bass lands 11.2 ms in front and the snare 18.0 ms behind under a
 * fusion, a blues and a foksi alike, to the millisecond, because the numbers are
 * in milliseconds and nothing about them consults the style.
 *
 * Three of the six entries carry a `voice` block and three do not, and the
 * absences are arguments rather than gaps — see `straight`, `pocket` and
 * `driving` below.
 */

import type { DrumVoice, LayerId } from '../core/types.js';

export type FeelId = 'straight' | 'pocket' | 'funk' | 'halftime' | 'driving' | 'laidback';

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
   * twice when it is applied, and the second normalisation is the one that does
   * the work — see `applyFeel`, which explains why an array of mean 1.0 is not
   * on its own enough to keep a feel from changing a section's *rank* as well as
   * its shape.
   *
   * Write the array with a mean already near 1.0 anyway, so that the numbers in
   * the table read as what they do rather than as what they do after being
   * rescaled.
   *
   * **Keep the shape metre-neutral.** A sixteen-long array is a statement about
   * a four-four bar, and this type is used under a bar of fourteen sixteenths
   * grouped 2+2+3 as readily as under one of sixteen grouped in fours. An array
   * whose peaks sit every four slots is asserting a backbeat that a 7/8 style
   * does not have. What survives the move is "the downbeat is the downbeat and
   * the sixteenths between the eighths are lighter", which is true in any metre;
   * anything sharper than that belongs to a style.
   *
   * Rhythm section only, and not the pad: a pad is a bed, its notes are long and
   * nearly all land on a downbeat, so a per-sixteenth accent applied to one is a
   * volume change wearing a groove's clothes.
   *
   * **A layer whose onsets all sit on the same kind of slot gets nothing from
   * this, and that is correct rather than a shortfall.** There is no weight to
   * redistribute inside a part that never visits a weak sixteenth; the second
   * normalisation then cancels the array exactly. Measured as velocity spread
   * over twelve songs: `laidback` moves a ballad's bass by −5% and its kit by
   * −5% and its comp by −0.3%, because that comp is on the one and the swung
   * offbeat and nowhere else. `halftime` on modal moves the bass +24% and the
   * kit +13%. If a feel wants to say something to a part that plays in one
   * place, `articulation` and `push` are the fields that can reach it.
   */
  accent?: number[];

  /**
   * Chance an eligible rest gains a ghosted snare or bass note, 0..1.
   *
   * **Snare and bass, and nothing else.** A ghost note is the one place a feel
   * comes closest to authoring, so it is scoped until it cannot: a ghost may
   * only land where its layer is already silent, a bass ghost must repeat the
   * pitch of the note it leads into — so it carries no new pitch class and no
   * harmonic information at all — and both are capped at a fraction of the
   * surrounding level, because a ghost that can be heard as a note is not a
   * ghost. What is played does not change; how it is played does.
   */
  ghost?: number;

  /**
   * Chance a sustained hit is broken into two shorter ones. Funk subdivides.
   *
   * Both halves keep the pitch and the footprint of the note they came from, so
   * this adds an articulation rather than a note: it is the difference between
   * a held chord and the same chord played twice, which is a bow stroke and not
   * a harmony. A comp chord is broken as a chord — every voice of one onset
   * splits at the same point, since half a chord re-struck is a different
   * voicing.
   *
   * **The comp only**, and the bass's absence is deliberate — a repeated bass
   * note is a different bass figure rather than a different articulation. See
   * `figureLayers` in `applyFeel`.
   */
  subdivide?: number;

  /**
   * Chance a weak-beat hit is displaced by a sixteenth.
   *
   * Displaced *early* and held through the beat it left, which is what an
   * anticipation is: the band arrives at the chord before the bar tells it to
   * and stays there. Late would be the same arithmetic and a different and much
   * worse thing — a hit that misses its beat and catches up reads as a mistake,
   * where one that arrives in front of it reads as a push.
   *
   * Only a hit that lands squarely *on* a beat is a candidate, and never the
   * downbeat: anticipating the downbeat means playing in the bar before, which
   * is a gesture at the section seam rather than inside a span.
   *
   * **The comp only**, again — a bass note moved off the beat it shares with the
   * kick reads as a flam rather than as a push. See `figureLayers` in
   * `applyFeel`.
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
   * The one place the two passes meet is an onset `applyFeel` moves off the
   * grid: assembly finds its offbeats by testing the fraction against exactly
   * 0.5, so a note that has been pushed is no longer found, and `applyFeel`
   * swings it itself before moving it. Both passes therefore have to agree about
   * what the swing *is*, which is why this is resolved once per span and handed
   * to both rather than read out of the style twice.
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
   * **This is the only part of a Feel that can change which tune wins**, which
   * is why it landed on its own rather than inside the batch of rhythm changes.
   * The audition scores two dozen candidates against the rules and a freshness
   * term; a multiplier that pushes the engine somewhere the judge dislikes comes
   * back as *worse* tunes rather than as different ones, and the only way to
   * know is to measure the styles it reaches. Every number below has been.
   *
   * **`straight` and `pocket` deliberately carry none**, and that is the line
   * this block is drawn against. A pocket is a rhythm-section phenomenon: the
   * band leans and the soloist floats over it, which is most of what makes a
   * pocket audible in the first place. Because those two are the whole of the
   * blues's and the foksi's tables, both of those styles compose exactly the
   * tune they always did, which is a free determinism check every time this
   * block is touched.
   */
  voice?: {
    /**
     * Multiplier on `Voice.syncopation`.
     *
     * Worth knowing what it reaches, because it is less than the name suggests
     * and it was measured rather than assumed. `syncopation` decides where a
     * note lands only for a voice with **no** `accents` table; where there is
     * one — which is every style in the catalogue that can currently draw a feel,
     * since `adapt.ts` derives a table from the style's own melody cells — this
     * moves the appetite for dotted values, the chance the figure accents a slot
     * the metre says nothing about, and the chance of a pickup. Real, and worth
     * about a point of off-beat share on its own. `accents` is the knob that
     * moves where the notes go.
     */
    syncopation?: number;
    /**
     * Multiplier on `Voice.accents`, per sixteenth, tiled. Absent leaves them
     * alone, and so does a present multiplier over an absent table — see
     * `adaptVoice` in `tune/adapt.ts` for why inventing one would fight the
     * derivation rather than scale it.
     *
     * Keep the shape **beat-relative** rather than bar-relative, for the reason
     * `accent` above gives at more length: a period of four slots is a statement
     * about a beat and survives any metre, where a period of sixteen is a
     * statement about a four-four bar and does not.
     *
     * And it can only lift what the style already visits. A voice whose table
     * came from cells that put every onset on a beat has the sixteenths at
     * `cellAccents`' floor of 0.08, and 1.4 times a floor is still a floor —
     * measured on the ballad, where an accent lift moved nothing at all. Same
     * shortfall as the one `accent` documents for a comp that plays in one
     * place, and the same answer: use the fields that can reach it.
     */
    accents?: number[];
    /**
     * Multiplier on `Voice.density`, in onsets per bar.
     *
     * The bluntest of the three and by some way the most reliable: it moves the
     * note count and, because the canvas does not change, the note *lengths*
     * with it. Two of the three feels that carry a block reach for it and reach
     * for nothing else, which is a fact about how narrow this vocabulary is
     * rather than about how alike those feels are.
     */
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
 * The library. Six entries, and the number of *styles* that may reach them is
 * what is being kept small.
 *
 * Six feels applied liberally across four genres would make everything sound
 * like the same band, which is the one way this idea fails. The mitigation is
 * not a short library — it is that `straight` is the default everywhere and
 * every style opts in by name, so the four added here **reached one style each
 * on the day they were added**. The entries are named for what they are rather
 * than for a genre, because that is the claim; `funk` is the one that would read
 * as a genre if it were overused, and it **was** enabled on exactly one style
 * for exactly that reason.
 *
 * Those two counts are kept in the past tense rather than deleted, because they
 * are the baseline the restraint has to be judged against and the restraint has
 * relaxed. Fifteen more genres have been written since, ten of them reaching a
 * feel table, and the enabling now stands at **`pocket` 45 styles, `laidback`
 * 32, `driving` 25, `funk` 24, `halftime` 19**, with `straight` named outright
 * by 85. `funk` is on 24 styles rather than one, and the check on whether that
 * has made everything sound like the same band is the per-feel measurement in
 * `npm run genres` rather than this paragraph.
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

  /**
   * Pocket plus the two things that make it funk: the chords stop being chords
   * and become stabs, and the weight goes onto the one.
   *
   * The separation from `pocket` is deliberate and is the reason both exist.
   * Pocket is what any competent rhythm section does and it says nothing about
   * the music; funk is pocket *and a specific articulation*, and articulation is
   * the largest audible difference between a funk comp and a swing comp — a
   * three-sixteenth stab and a one-sixteenth stab are the same pattern and two
   * different musics. Measured over ten songs with this installed on the blues:
   * mean comp duration falls from 0.71 beats to 0.22, which is 30%, and every
   * pitch in the result was already there.
   *
   * The blues rather than fusion, which is the style it actually ships on, and
   * that is a defect in the shipping rather than in the measurement: **fusion
   * has no comp layer at all.** Its comping is the two-handed lead's left hand,
   * which lives in the `melody` track, which a feel may not touch. So on the one
   * style entitled to play this, its defining half does nothing. See the note on
   * `fusion.feels`.
   *
   * The push is `pocket`'s own numbers rather than new ones, said out loud
   * because the temptation was to make funk lean harder. It should not: funk is
   * played *in* the pocket, and a band that leans further as it plays shorter is
   * a band rushing.
   *
   * `subdivide` and `ghost` are what fill the space the stabs leave. Both are
   * scoped so that they cannot author — see their comments on the type. 0.35
   * looks high for a probability and is not, because the eligible slots are few:
   * measured over twelve songs it comes out at 0.9 ghosted snares and 1.1 ghosted
   * bass notes per bar on fusion, 0.8 and 0.9 on the blues. That is a drummer
   * filling between the backbeats, not a drummer playing sixteenths.
   *
   * `displace` is small on purpose. An anticipated chord is the funk gesture and
   * a bar in which every weak beat is anticipated has no beats left to anticipate
   * against.
   *
   * ## And the one thing funk has to say to the tune
   *
   * A funk melody is not a swing melody played over a funk band: it lands
   * between the beats, it is busier, and its notes are shorter. All three of
   * those are sayable in the voice's own vocabulary, so all three are said, and
   * the third comes for free — the canvas is fixed, so more onsets on it are
   * necessarily shorter ones.
   *
   * Measured on fusion over thirty songs, against the same seeds under
   * `straight`: off-beat onsets 54.6% → 58.3%, onsets per bar 2.39 → 2.53, mean
   * melody note 0.85 → 0.79 beats. Each knob was measured alone as well, because
   * three numbers that only work together are three numbers nobody can reason
   * about: the accent lift is the strongest (54.6 → 56.9), density next (→ 55.5),
   * syncopation smallest (→ 55.2). Nothing the judge cares about got worse —
   * stepwise motion 51.8% → 52.4% and chord tone on the beat 84.7% → 84.6%,
   * which is to say the engine wrote funkier tunes rather than looser ones.
   */
  funk: {
    id: 'funk',
    label: 'Funk',
    description: 'Pocket, played short. Stabs where the chords were, weight on the one, and the sixteenths filled in underneath.',
    push: { bass: -12, sd: 18 },
    articulation: { comp: 0.45, bass: 0.5 },
    /**
     * The one, and then the sixteenths between the eighths held back. No peak
     * every four slots — see `Feel.accent` on why that would be a claim about
     * four-four that this style is not entitled to make, given that the one
     * style enabling it is in seven eight.
     */
    accent: [
      1.30, 0.90, 1.02, 0.90,
      1.06, 0.90, 1.02, 0.90,
      1.06, 0.90, 1.02, 0.90,
      1.06, 0.90, 1.02, 0.92,
    ],
    ghost: 0.35,
    subdivide: 0.4,
    displace: 0.2,
    voice: {
      syncopation: 1.35,
      density: 1.15,
      /**
       * On the beat, leave it; on the eighth between, a little; on the
       * sixteenths, half again. Periodic in the *beat* rather than in the bar,
       * so it says the same true thing under fusion's seven eight as it would
       * under a four-four — see `Feel.voice.accents`.
       */
      accents: [
        1.00, 1.50, 1.15, 1.50,
        1.00, 1.50, 1.15, 1.50,
        1.00, 1.50, 1.15, 1.50,
        1.00, 1.50, 1.15, 1.50,
      ],
    },
  },

  /**
   * The band stops counting in four and starts counting in two.
   *
   * **This is the entry the field list could not express, and the gap is worth
   * naming rather than papering over.** Half time, played, is the snare leaving
   * beats two and four and landing on three — and moving a hit from one beat to
   * another is rewriting the figure, which is a style and not a feel. `displace`
   * moves a sixteenth, not a beat, precisely so that it cannot do this.
   *
   * So what is here is half time said in the vocabulary that exists: the metre's
   * weight is *redistributed* onto one and three and away from two and four, the
   * notes are held about a third longer, everything sits behind, and the swing
   * is switched off. An ear reads weight on three as a half-time backbeat even
   * when the snare has not moved, which is most of the effect and all of it that
   * a modifier is allowed to claim. The snare genuinely moving is
   * `transition-plan.md`'s problem or a style's.
   *
   * The accent array here *is* four-four-shaped, unlike `funk`'s, and that is a
   * deliberate exception with a cost attached: it is enabled on one four-four
   * style and it would say something wrong under a valssi.
   *
   * The tune gets the same instruction in the only word that reaches it. A band
   * counting in two covers the same ground in half the gestures, so the line
   * broadens: fewer onsets over an unchanged canvas, which is longer notes by
   * arithmetic. That is the whole of it — "weight onto one and three" is a
   * statement about the *bar*, and `Voice.accents` is a statement about where a
   * note likes to land, so saying it there would be asserting a four-four
   * backbeat to a melody engine rather than redistributing a velocity.
   *
   * Measured on modal over thirty songs against the same seeds under `straight`:
   * onsets per bar 1.63 → 1.48, mean melody note 1.01 → 1.14 beats, chord tone
   * on the beat 81.6% → 83.0%, stepwise motion 53.6% → 52.3%. 0.75 was tried and
   * is not shipped: it takes another 0.05 off the same axis and 0.4 more points
   * off stepwise motion, which is the tune thinning past broad and into bare.
   */
  halftime: {
    id: 'halftime',
    label: 'Half time',
    description: 'Counted in two: weight onto one and three, everything long, everything behind, and the swing switched off.',
    swing: 0,
    voice: { density: 0.8 },
    push: { bass: 8, comp: 8, pad: 6, sd: 14 },
    articulation: { comp: 1.35, bass: 1.25, pad: 1.2, brass: 1.2 },
    accent: [
      1.18, 0.94, 1.00, 0.94,
      0.86, 0.94, 1.00, 0.94,
      1.14, 0.94, 1.00, 0.94,
      0.90, 0.94, 1.00, 0.98,
    ],
  },

  /**
   * The last chorus: the whole band a hair in front of the grid, playing short.
   *
   * The kit moves here, all of it, and that is the one place this disagrees with
   * `pocket` — where the argument for leaving the hats alone was that a kit whose
   * time-keeping hand has moved has not laid back, it has slowed down. Forward is
   * not symmetrical with backward. A band rushing into a last chorus rushes with
   * the ride hand first, and a drummer who pushed everything *except* the time
   * would be doing something no drummer does.
   *
   * No accent, no ghosts and no subdivision: this is a feel about urgency, and
   * urgency is timing and length. Adding notes to it would make it funk.
   *
   * ## And no `voice`, which is the same sentence pointed at the tune
   *
   * The one entry that was expected to want one and does not. Urgency is timing
   * and length, and a `Voice` can express neither — it has how busy, how far off
   * the beat, and where the beats are, and none of those is "in front of it".
   * The two candidates were tried on bebop over thirty songs and both are noise
   * or worse: `density: 1.15` moves onsets per bar from 1.90 to 1.91 and takes
   * stepwise motion from 58.6% to 57.1%, and `syncopation: 0.8` — the idea that
   * a driving line nails the beat — moves the off-beat share by a tenth of a
   * point, from 47.5% to 47.4%. What they would actually have shipped is a last
   * chorus with a *different* tune in it rather than the same tune played
   * harder, and the second of those is the thing a listener recognises as
   * driving.
   *
   * So the melody is left alone here on purpose, and the absence is the claim.
   */
  driving: {
    id: 'driving',
    label: 'Driving',
    description: 'The whole band a hair in front of the grid, playing short. The last chorus.',
    push: { bass: -10, comp: -7, brass: -7, drums: -6 },
    articulation: { comp: 0.8, bass: 0.85, brass: 0.85 },
  },

  /**
   * The mirror of `driving`, and not its negation: behind, long, and with the
   * metre allowed to go soft.
   *
   * The kit does *not* move as a kit — only the snare does, for `pocket`'s
   * reason, which forward playing escapes and backward playing does not. The
   * accent array is the only one in the library that runs against
   * `metricStrength` rather than with it: it lifts the offbeat sixteenths and
   * lets the strong ones down, so the bar stops announcing itself. That is what
   * "flattened" means as an instruction to a player, and it is the difference
   * between a band playing behind and a band playing quietly.
   *
   * ## The tune gets the "held long", and only that
   *
   * A player who is not pushing plays fewer notes and holds them, which is
   * `density` and lands on the ballad as onsets per bar 1.32 → 1.21 and mean
   * melody note 1.22 → 1.30 beats over thirty songs, with chord tone on the beat
   * up from 88.7% to 89.5% and stepwise motion unmoved.
   *
   * **`syncopation` was the obvious second number and it is not shipped.** The
   * reasoning for it was sound — behind the beat, composed, can only come out as
   * landing off it — and the measurement was not: `syncopation: 1.25` alone
   * moves the ballad's off-beat share by 1.1 points and takes 1.6 points off the
   * chord tone with it, and *alongside* the thinning it is invisible, 26.4%
   * against the 26.2% the thinning gives on its own. An accent lift is worse
   * still and for a reason the type already documents: this ballad's cells put
   * every onset on a beat, so its derived sixteenths sit at `cellAccents`' floor
   * and multiplying a floor leaves a floor.
   *
   * What that leaves is `halftime`'s number with a different multiplier on it,
   * and the near-collision is worth naming rather than dressing up. Two
   * different musical claims — the metre has halved, and the player is not
   * pushing — reach the tune through the same knob because it is the only knob
   * either of them can reach. That is the vocabulary being three numbers wide,
   * which is a deliberate limit, and it is the point at which a fourth would
   * start to look justified. It is not yet.
   */
  laidback: {
    id: 'laidback',
    label: 'Laid back',
    description: 'Everything behind the beat, held long, and the metre allowed to go soft.',
    voice: { density: 0.85 },
    push: { bass: 10, comp: 14, pad: 12, brass: 12, sd: 16 },
    articulation: { comp: 1.15, bass: 1.1, pad: 1.15, brass: 1.1 },
    accent: [
      0.90, 1.05, 1.00, 1.05,
      0.95, 1.05, 1.00, 1.05,
      0.92, 1.05, 1.00, 1.05,
      0.95, 1.05, 1.00, 1.06,
    ],
  },
};
