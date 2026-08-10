/**
 * Funk, 1968–1986.
 *
 * James Brown's band, the Meters, Parliament, the Hammond trios, the Linn
 * records and the 808 ones. A repertoire the project could not previously hold,
 * and not because of the instruments — every one of them was already in the
 * catalogue — but because of what it does with harmony, which is nothing.
 *
 * ## The load-bearing decision: `scaleForChord`
 *
 * Four answers to "where does the melody get its notes" existed before this.
 * Iskelmä follows the *key*; jazz follows the *chord*; ambient follows the
 * *drone*; synth follows the key without the leading tone. This genre's honest
 * answer is close kin to ambient's in mechanism and nothing like it in effect,
 * and the reason is one fact about the repertoire:
 *
 * **the harmony frequently does not move at all.**
 *
 * A JB side is one chord for four minutes. Twenty of the twenty-two style tables
 * in `styles.ts` open with a verse progression that is the same numeral eight
 * times. There is nothing for a chord-relative rule to re-orient *onto* — and in
 * the corner of the genre where the harmony does move, re-orienting is the wrong
 * answer for a different reason: a line that follows the changes over a vamp is a
 * bebop line over a vamp, which is a real and different music that already lives
 * in `jazz/`.
 *
 * So the rule below is one line and the chord is not a parameter it reads. The
 * scale is rooted on the tonic, fixed for the whole song, and chosen by mode:
 *
 *     minor  →  minorPentatonic     five notes and no leading tone
 *     major  →  mixolydian          the flat seventh, and the fourth
 *
 * ### Why the two halves are different sizes, which looks like an inconsistency
 *
 * It is the sharpest real division in the repertoire. The minor-key half is
 * *riff* music — the tune is a bass figure moved up an octave, and a bass figure
 * has five notes in it because a hand on a fingerboard has five notes under it in
 * one position. Adding the second and the sixth to that scale does not enrich the
 * line, it dilutes it: the two degrees a pentatonic leaves out are exactly the two
 * a riff never lands on, and a generator that still has them in the table keeps
 * landing on them. The major-key half is *horn-chart* music, and a written horn
 * line needs its fourth and its sixth — take those out of a Memphis chart and
 * what is left is a bass riff played by four wind instruments.
 *
 * The ♭3 that mixolydian leaves out is not lost in major. It arrives as the blue
 * third, through the soloist's `chromatic` appetite and through `chromatic-tone`
 * being disabled below, which is where a blue note belongs: it is a note you bend
 * *to*, not a degree of the scale, and once it is in the table the engine starts
 * holding it for a beat and a half. `core/scale.ts` makes the same argument about
 * why `minorPentatonic` and `blues` are two rows.
 *
 * ### The one style that overrides it, and why exactly one
 *
 * `jazzfunk`. Its changes are the content — a `min11` on the ♭III and a
 * `dom7sus4` on the ♭VII are two colours the player is aiming at, and a tonic
 * pentatonic dragged across both hears neither. It is the mirror image of what
 * jazz does: jazz follows the chord and its `blues` style overrides to a tonic
 * scale; funk follows the tonic and its jazz-funk style overrides to the chord.
 * Two genres, opposite directions, one style each. That is what the field is
 * for — a claim a style makes about *itself* rather than about its genre — and
 * widening it to the four or five styles here that could half-argue for it
 * would turn a claim into a setting.
 *
 * **This used to call jazz's the "only other use of `Style.scaleForChord` in
 * the project", and that stopped being true several genres ago.** Sixty-six
 * styles across fourteen genres override the field now — indian on all
 * twenty-eight, because a rāga pair *is* a style-level scale claim; rock on
 * eight, pop on seven, country on five. The pairing with jazz survives, because
 * it is a pairing about *direction* and that is still the only one of its kind:
 * everywhere else the override narrows or colours the genre's rule, and only
 * these two invert it. The count was never the argument, and it is corrected
 * rather than deleted because the old sentence read as though the field were
 * rare — a field a sixth of the catalogue uses is not, and a style author
 * weighing an override should know that.
 */

import { makeScale } from '../../core/scale.js';
import { RULE_DISABLED } from '../../core/rules.js';
import type { Genre, FormStep } from '../types.js';
import { STYLES } from './styles.js';
import { ERAS } from './eras.js';
import { MOODS } from './moods.js';
import { VOCALS } from './vocals.js';
import { generateTitle } from './titles.js';
import { STAGING } from './staging.js';

/**
 * Forms.
 *
 * Short sections, and more of them than anywhere else here. Nothing in this
 * repertoire has a sixteen-bar verse: the unit is eight bars because the unit is
 * a *chorus of the vamp*, and what makes a section arrive is that the horns came
 * in or the band stopped, not that the harmony got somewhere.
 *
 * The `solo` sections are load-bearing rather than decorative. Half of what makes
 * a funk record long is somebody blowing over the same chord for two choruses,
 * and it is the one place in this genre where anything is improvised at all.
 *
 * The long form is the P-Funk side and it is the only one with sixteen-bar
 * sections in it. A record that runs nine minutes needs somewhere to put them,
 * and it is the shape that gets cut across two sides of a single — which is why
 * a fifth of this genre's titles have a part number on them.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  // The vamp side. Eight-bar units, a solo in the middle, and the chorus is the
  // eight bars where the chord finally moves.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'solo', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 6],
  // Part One and Part Two: two choruses of blowing in the middle, and the whole
  // thing long enough to need cutting in half.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'solo', bars: 8 }, { kind: 'solo', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 5],
  // The single. The only form here with a bridge in it, and the only one that
  // could be three minutes.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'bridge', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 5],
  // The long side. Sixteen-bar sections, which nothing else here has, because a
  // nine-minute record has to put the length somewhere.
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 16 },
    { kind: 'solo', bars: 16 }, { kind: 'bridge', bars: 8 },
    { kind: 'verse', bars: 16 }, { kind: 'chorus', bars: 16 },
    { kind: 'outro', bars: 8 },
  ], 3],
  // Barely a form: the groove, four times, with somebody taking a chorus in the
  // middle of it. What a great many of these records actually are.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'solo', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 3],
];

export const funk: Genre = {
  id: 'funk',
  label: 'Funk',
  description:
    'One-chord vamps, chanked sixteenths and written bass riffs — JB, the Meters, P-Funk, boogie and electro, 1968 to 1986.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,

  /**
   * Direct, never prepared — and here that is almost a formality rather than a
   * claim, because there is barely a dominant in the genre to prepare with.
   *
   * Where another idiom writes `V`, twenty of these twenty-two styles write
   * `IV`, `♭VII` or nothing at all. An applied dominant in front of a lifted
   * final chorus would be the one leading tone on the record and would announce
   * that somebody had written an arrangement — which in this music is an
   * admission rather than a flourish. `keyChangeChance` is under 0.05 in three of
   * the four eras anyway, so the field is mostly answering a question nobody
   * asks; it is set because the one era that does lift (`boogie`, at 0.12) is
   * exactly the one where the wrong answer would be audible.
   */
  preparedModulation: false,

  /**
   * Guitar keys, and the reason is the fingerboard rather than the horns.
   *
   * Jazz lives in flats because the trumpet and the tenor are transposing
   * instruments. This music lives in E, A, D and G because the bass riff came
   * first and a riff is a *shape* — the open strings and the first position are
   * where it fits under a hand, and a funk line transposed to D♭ stops being
   * playable in the way that made it a riff.
   *
   * B♭ and E♭ are here at real weight even so, because the horn-driven end of
   * this repertoire was arranged by people who wrote for the section rather than
   * for the guitarist, and a Memphis chart in B♭ is as characteristic as a JB
   * vamp in E.
   */
  keys: {
    minor: [[4, 6], [9, 6], [2, 5], [7, 4], [0, 3], [10, 2], [5, 2]],
    major: [[4, 5], [9, 5], [2, 4], [7, 4], [10, 3], [3, 3], [0, 2]],
  },

  /**
   * It buttons, and the button is The One.
   *
   * A great many funk records physically fade, and the fade is a mastering
   * decision made after the band went home — the tape runs on and the engineer
   * pulls it down, which is a fact about the format rather than about the
   * performance. What the band does is stop: the bandleader calls it, everybody
   * lands on the downbeat together and the drummer crashes over it. This genre's
   * whole gravitational claim is that beat one carries the bar, and a genre that
   * said so for four minutes and then dissolved would be contradicting itself in
   * the last eight seconds.
   */
  ending: 'button',

  /**
   * Counted in, out loud, and often on the record.
   *
   * Not merely a staging fact here. The count-in is *vocabulary* in this
   * repertoire — the shouted count is on the released side of more of these
   * records than of any other genre in the project — and it is the same gesture
   * as the band hitting The One together, which is the thing the whole idiom is
   * organised around. See `withCountIn`; the radio still never counts anything
   * in, and that remains right.
   */
  countIn: true,

  /**
   * `light`, matching jazz and for a related reason: the blue notes and the
   * unresolved sevenths that the rule table exists to suppress are the
   * *vocabulary* here rather than defects in it. The overrides below do the
   * genre-specific work, and the biggest of them is a rule that would otherwise
   * silently refuse the most characteristic interval in the repertoire.
   */
  defaultStrictness: 'light',

  /**
   * The figure comes back the same. `catchy` locks the rhythm and recalls each
   * section, which is what a vamp is; six styles push further to `earworm`,
   * which is the honest setting for a record whose entire proposition is the
   * same bar again. Only `souljazz` and `jazzfunk` go the other way, and both of
   * them improvise for a living.
   */
  defaultHook: 'catchy',

  /**
   * The band does not get out of the way.
   *
   * Jazz thins out under a soloist because comping is a conversation. Here the
   * vamp running underneath *is* what the solo is over — a rhythm section that
   * dropped back would take away the thing the tenor is climbing on top of — so
   * the default is `full` and the exceptions below are two.
   */
  soloBacking: 'full',

  /**
   * Who solos, and the two entries that are unusual.
   *
   * **The bass takes a chorus more often than anywhere else in this project**, at
   * a weight of 3 against jazz's 1.5, and `slap` is a whole style built around
   * it. Larry Graham invented the technique to replace a drummer and it made the
   * instrument a front-line one; a funk band in which the bass never gets the
   * floor is a funk band that has not noticed what happened in 1969.
   *
   * **So does the drummer**, at 2.5, and for a reason no other genre has: the
   * breakbeat. Four bars of kit alone is not a novelty here, it is the part of
   * the record everybody remembers, and `breakbeat` in `styles.ts` is the style
   * that exists because of it.
   *
   * The vocabulary is a horn player's rather than a keyboard player's.
   * `offbeatAccent` at 0.75 is high but below jazz's 0.9, because a funk accent
   * lands on a *sixteenth* off the beat rather than on a swung eighth, and the
   * two are different gestures. `develop` at 0.65 is what stops two choruses over
   * an unmoving chord from being a hundred unrelated licks. `paraphrase` at 0.15
   * is small and non-zero: unlike jazz, the tune here is often a riff everybody
   * knows, and a soloist quoting it is playing to the room rather than changing
   * the subject.
   */
  solo: {
    rotation: [['melody', 5], ['comp', 4], ['counter', 3], ['bass', 3], ['drums', 2.5]],
    // Rare. Trading fours is a jazz convention that funk borrowed for the drum
    // break and then mostly stopped bothering with — the break here is a whole
    // section rather than an alternation.
    tradeFours: 0.2,
    quoteMotto: 0.45,
    backing: {
      melody: 'full', counter: 'full', comp: 'full',
      // The two exceptions to `full`, and both of them are the same gesture: the
      // band drops out and one person is left. That is what a funk breakdown is,
      // and it is the only thing in this genre that stops the groove.
      bass: 'sparse',
      drums: 'trade',
    },
    vocabulary: {
      gait: 0.5,
      doubleTime: 0.18,
      offbeatAccent: 0.75,
      // Low. An enclosure is a bebop device for arriving at a guide tone, and
      // over one chord for four minutes there is no guide tone to arrive at.
      enclosure: 0.15,
      // The blue notes live here, since the chord scale is a five-note one and
      // has no room for them. This is where the ♭3 over a major-key vamp and the
      // ♭5 between the fourth and the fifth actually come from.
      chromatic: 0.35,
      ornament: 0.3,
      develop: 0.65,
      displace: 0.4,
      space: 0.28,
      // Two semitones. A funk solo works the same register rather than climbing
      // out of it — the climb is a device for a line that has somewhere to get to.
      climb: 2,
      paraphrase: 0.15,
      // Low. The head comes back on a groove that never stopped, so there is
      // nothing to deliver it into: the band was already there.
      liftIntoReturn: 0.15,
    },
  },

  /**
   * The comper barely departs from the figure, and that is the genre's central
   * disagreement with jazz.
   *
   * `CompingProfile` was built for a jazz pianist, and the numbers there are 0.18
   * / 0.3 / 0.25 because a comper who plays the same bar twice is more audible as
   * a machine than any wrong note. Read the doc and then read it against this
   * music, and the argument inverts cleanly: **the figure is the song.** A chank
   * is not a suggestion about the harmony, it is a written part with the holes
   * already in it, and a guitarist who started varying it would be making the
   * record harder to dance to — which is the same sentence `Genre.comping` uses
   * about a tanssilava band, arrived at from a completely different direction.
   *
   * So `rest` is 0.04 against jazz's 0.18, a quarter of it, and it is not zero
   * for one reason: a hand playing sixteen sixteenths a bar for four minutes
   * occasionally does not connect, and the bar where the guitar is not there is
   * how you know it was a person. `anticipate` is the largest of the three at
   * 0.14, because pushing a chord an eighth ahead of the barline is the one
   * gesture this idiom shares with jazz and it is what makes The One land — the
   * chord arrives early so the downbeat has something to be the answer to.
   * `displace` is the smallest and nearly off: a funk figure nudged a sixteenth
   * is a funk figure played wrong.
   */
  comping: { rest: 0.04, anticipate: 0.14, displace: 0.05 },

  /**
   * Where this genre disagrees with the shared rule table.
   *
   * The first entry is the one that matters and it is not a preference: without
   * it the generator silently refuses the most characteristic interval in the
   * repertoire, with no error and nothing in the output to say what happened.
   */
  ruleOverrides: {
    /**
     * **The one that would have broken this genre in silence.**
     *
     * `augmented-second` vetoes any move of one scale step and three semitones,
     * from strictness level 1 upward. In harmonic minor that is correct — it is
     * the accident of reaching for the raised seventh over a dominant. In the
     * *minor pentatonic* it fires on two of the scale's four steps: tonic to ♭3
     * is one step and three semitones, and fifth to ♭7 is one step and three
     * semitones. Those two intervals are not a hazard in this music, they are
     * what a riff is made of — every bass figure in `styles.ts` walks one of them
     * — and the rule would have refused both at every strictness level this genre
     * ships at, producing lines that were correct, legal, and had the funk taken
     * out of them.
     *
     * Disabled outright rather than softened, because there is no level at which
     * it is right here. `core/scale.ts` warns about exactly this against the
     * pentatonic rows, and this is the entry that warning is for.
     */
    'augmented-second': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * The blue notes are chromatic by construction, and they have to be.
     *
     * The chord scale here is five notes, so the ♭5 that a line slides through
     * between the fourth and the fifth and the ♭3 that sits on top of a major-key
     * vamp are both outside it by definition. That is the *right* place for them
     * — see `core/scale.ts` on why `blues` and `minorPentatonic` are two rows —
     * and it means the rule that polices notes outside the prevailing scale is
     * policing this genre's vocabulary.
     */
    'chromatic-tone': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * A seventh over a one-chord vamp resolves nowhere, because there is nowhere
     * for it to go.
     *
     * The rule assumes a seventh is a dissonance under pressure, which is true
     * where the chord is going somewhere. On a `i7` held for eight bars the ♭7 is
     * a *colour of the tonic* — it is degree four of the minor pentatonic, it is
     * in the bass figure, and it is where half the riffs in this file come to
     * rest. Softened rather than disabled: a seventh in a moving line still owes
     * something, and `jazzfunk` and `ballad` are two styles where the chords
     * genuinely move.
     */
    'unresolved-seventh': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.75 },

    /**
     * A funk line repeats one note more than any rule expects.
     *
     * The extreme case in this repertoire is a horn figure that is *entirely* one
     * pitch, rhythmicised — which is a real and much-copied thing, and which
     * `repeated-note-run` vetoes outright at strictness 2 as three identical
     * notes in a row. Both softened to a preference at the top level. The rules
     * exist to catch a line that has stalled and this music can still stall; it
     * simply does it much later than everything else here.
     */
    'static-repetition': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.8 },
    'repeated-note-run': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.85 },

    /**
     * The eleventh is the chord, not an avoid note.
     *
     * `dom7sus4` appears in five style tables here and a `9` chord with the fourth
     * sitting over it is the default funk keyboard voicing. The rule is right for
     * a singable idiom and right for jazz, which tightens it; here it would file
     * off the one extension this music reaches for most.
     */
    'avoid-fourth': { minLevel: 4, vetoLevel: RULE_DISABLED },

    /**
     * A horn section moves in parallel because a horn section is one instrument.
     *
     * The prohibition is choral and it is about two independent voices fusing
     * into one. Four horns playing a written figure in fourths are not two
     * independent voices and are *supposed* to fuse — that is what makes them a
     * section rather than four soloists — and the guitar's double-stop, which is
     * two strings a fourth apart moved up the neck as a shape, has the same
     * defence. Kept as a mild preference at the smoothest setting rather than
     * disabled, since the melody and the bass genuinely can fuse and that is
     * still a fault.
     */
    'parallel-perfects': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.6 },

    /**
     * A five-note scale makes the threshold wrong by a whole degree.
     *
     * `wide-leap` vetoes anything past a perfect fourth, and it was calibrated
     * against a seven-note scale where one step is a tone or a semitone. In the
     * minor pentatonic one step is up to a minor third, so **two steps is a
     * perfect fifth** — ordinary stepwise motion by the scale in force, and
     * exactly what a pentatonic line is for. Left as a penalty at the top two
     * levels so the rule still catches a genuine jump, and the counterweight it
     * exists to provide is not lost: `leap-beyond-third` is untouched and still
     * vetoes at `polished`.
     */
    'wide-leap': { minLevel: 3, vetoLevel: 4, penalty: 0.5 },
  },

  /**
   * Which devices this band uses, and the two that are raised.
   *
   * `tutti` and `riff` are the genre's own gestures and the pool's defaults do
   * not reflect that. The whole band catching one figure is the single loudest
   * thing a funk arrangement does — the stop, the hit, the four beats of nothing
   * after it — and the horns answering with the *same* figure restated rather
   * than with fresh stabs is what makes a section a section rather than three
   * people improvising. `swell` comes down from the pool's 8 for the opposite
   * reason: a horn pad under a held melody note is a ballad device, and this
   * genre has one ballad style out of twenty-two.
   *
   * `trade` stays low. Handing a phrase from one player to another is a
   * conversation, and this band is not having one — it is playing a figure at the
   * same time as everybody else, which is `tutti`.
   */
  arrangement: { tutti: 7, riff: 7, swell: 3, harmony: 4, trade: 2, unison: 2 },

  /**
   * The bottom of the record is the record.
   *
   * Every number here is stated against the shared defaults rather than against
   * another genre, since those are what an omitted layer gets. The bass goes from
   * 0.63 to 0.86 and the drums from 0.59 to 0.75, and between them that is the
   * whole mix statement: in this repertoire the rhythm section is not holding
   * anything up, it is the subject, and the tune is a thing happening on top of
   * it. Every other genre in this project mixes the other way round and is right
   * to.
   *
   * The comp comes *down* slightly, from 0.72, and that is the least obvious
   * number here. A chank is sixteen events a bar and the ear counts events: at
   * the shared level the guitar wins every masking argument it is in and the bass
   * figure — four events a bar, which is the thing worth hearing — disappears
   * underneath it. It is not accompaniment being demoted; it is a part with four
   * times the density of anything else being levelled against it.
   *
   * The pad drops furthest, to 0.34, and it is close to a statement that the
   * layer does not belong. There are no strings on a JB side and no pad on a
   * Meters one; where this genre has a sustained bed at all it is an organ
   * holding one chord behind nine other people, and it should be felt rather than
   * heard.
   */
  mix: {
    bass: 0.86,
    drums: 0.75,
    comp: 0.66,
    melody: 0.92,
    brass: 0.72,
    counter: 0.52,
    pad: 0.34,
  },

  /**
   * The kit, balanced for a music that is mostly kit.
   *
   * Two departures from the shared table and both are about the top end. The
   * **tambourine** sits at 0.36, below the default's 0.45 and below the hi-hat,
   * because in this repertoire it is playing *sixteenths* rather than a backbeat
   * — `DEFAULT_DRUM_MIX` says in as many words that a tambourine in sixteenths at
   * anything higher is all anyone hears, and this genre is the one that puts it
   * there. The **clap** goes up to 0.75, because from 1980 onward it is not a
   * garnish on the snare, it is the snare.
   *
   * The ride comes down again to 0.28. It is barely used here — three drum
   * patterns in twenty-two styles reach for it — and where it appears it is a
   * soul-jazz drummer keeping time on it, which is a quieter job than a bebop
   * drummer's. The three hand-drum strokes take the shared curve unchanged: those
   * numbers were set against the physics of the instrument rather than against
   * any genre, and a conga trio in a funk band is the same object it is anywhere.
   */
  drumMix: {
    bd: 1.0, sd: 0.9, rim: 0.68, hh: 0.42, oh: 0.46, cp: 0.75,
    lt: 0.7, mt: 0.7, ht: 0.7, cr: 0.5, rd: 0.28, perc: 0.6, cb: 0.55,
    sh: 0.38, tb: 0.36, lp: 0.8, mp: 0.6, hp: 0.5,
  },

  /**
   * Register and response, and the second half is the interesting one.
   *
   * The pad drops five semitones rather than the default's three, for the same
   * reason its level is the lowest here: it is a bed under nine people and it
   * should be under them. The comp drops two, which is small and deliberate — a
   * chank lives in the same octave as the tune and *should*, because a rhythm
   * guitar voiced down out of the way stops cutting and becomes mud. Two
   * semitones is enough for the voicings not to collide and not enough to move
   * the part.
   *
   * `response` is where this genre says something the others do not. **A funk
   * rhythm section does not play the chorus harder.** It plays exactly the same,
   * and the chorus arrives because the horns came in, or the second guitar
   * started, or the singer stopped. So the bass and the comp barely breathe — 0.2
   * and 0.25 against a default response that assumes a band leaning into an
   * arrival — while the brass swings wide at 0.9, because that layer *is* the
   * arrival. The kit sits between them: a drummer does dig in, but a groove that
   * got visibly louder every sixteen bars would be a groove somebody was
   * managing.
   */
  layerPlan: {
    offsets: { pad: -5, comp: -2 },
    response: { bass: 0.2, comp: 0.25, drums: 0.55, brass: 0.9, pad: 0.5 },
  },

  /**
   * A small room, and an echo nobody would call an effect.
   *
   * `reverbSize` at 0.24 is the driest in the project by a distance. These
   * records were cut in rooms the size of a shop with the band in one space and
   * the tape running, and the reason it matters is rhythmic rather than tonal: a
   * long tail on a sixteenth-note part smears the sixteenths together, and the
   * separation between them is the entire music. Ambient is at the other end of
   * this same number and for the mirror-image reason.
   *
   * `delayBeats` at 0.75 — three sixteenths against a four-beat bar — is the
   * convention two other genres here already state, and it is the one production
   * choice this music shares with them. The feedback is the lowest anywhere:
   * a single repeat, arriving in the hole between two chank accents, which is a
   * tape slap rather than an echo.
   */
  space: {
    reverbSize: 0.24,
    delayBeats: 0.75,
    delayFeedback: 0.14,
  },

  /**
   * Standing production notes, refined by each era.
   *
   * The bass is dry for the reason it is everywhere — reverb on a sustained low
   * note arrives while the note is still sounding and the two beat against each
   * other — and it is *dark*, at 1600 Hz, because a flatwound Precision through a
   * valve amp has no top on it and the top is where the chank lives.
   *
   * The comp is the one that carries the genre's signature and it is the opposite
   * of every other genre's: **bright and almost completely dry.** A palm-muted
   * guitar at 9 kHz with no send on it is a percussion instrument, which is what
   * the part is; run through the plate that suits a synth sequencer it becomes a
   * wash of chords and the sixteenths vanish into each other. The drums take the
   * same treatment for the same reason.
   */
  /**
   * The chank, which is the one guitar sound this genre cannot be without.
   *
   * A funk guitarist's hand runs sixteenths continuously and lets most of them
   * land on damped strings; the two or three that ring are the part. That is
   * `strum` with the fast hand — hence the profile correction, which is the
   * case `TECHNIQUES.strum` names in its own comment as the reason a genre must
   * be able to say this. `muted` sits under it for the single-note and
   * double-stop parts, which are the other half of the idiom.
   *
   * Genre-wide rather than per style, because it is true of all twenty-two of
   * them — see `Genre.techniques`. `slap` is not here and is deliberately left
   * to the instruments: a slap bass slaps because it is a slap bass, and the one
   * style whose *identity* is the technique says so itself.
   */
  techniques: {
    comp: [['strum', 6], ['muted', 4], ['plectrum', 2]],
  },
  techniqueProfiles: {
    // Sixteenths, and half the empty ones touched: the hand is a hi-hat.
    strum: { dead: { step: 1, chance: 0.5, level: 0.16, length: 1 } },
  },
  effects: {
    comp: { reverb: 0.08, lowpass: 9000 },
    bass: { reverb: 0.02, lowpass: 1600 },
    drums: { reverb: 0.12, lowpass: 11000 },
    brass: { reverb: 0.22, lowpass: 7000 },
    melody: { reverb: 0.2, delay: 0.12, lowpass: 8500 },
    counter: { reverb: 0.22, delay: 0.14, lowpass: 8000 },
    pad: { reverb: 0.45, lowpass: 4200 },
    vocal: { reverb: 0.24, delay: 0.1, lowpass: 8000 },
  },

  // Two and a half to four and a half minutes. Longer than a dance band's and
  // shorter than a synth side's: long enough for a vamp to establish, for
  // somebody to blow over it and for the band to come back, and short enough
  // that the version being generated is the single rather than the album cut.
  duration: [150, 280],

  /**
   * What the drummer plays into a section, and it is not a tom roll.
   *
   * A descending roll round the kit is a dance-band gesture — it announces the
   * next section by getting louder across four beats — and it is close to the
   * opposite of what happens here. A funk fill is *snare*: sixteenths across the
   * head with the accents moved, which is the same vocabulary as the groove
   * rather than a departure from it. `drop` is at the top with it, and that is
   * the genre's own answer: the loudest thing available to this drummer is
   * stopping, because the bar of nothing is what makes The One that follows it
   * land. `tom-roll` stays in at the bottom, since the horn-driven end of this
   * repertoire is a show band and show bands roll.
   */
  fills: [
    ['snare-toms', 5], ['drop', 5], ['snare-roll', 4], ['lead-in', 3], ['tom-roll', 1],
  ],

  /**
   * The scale rule, and the chord is not a parameter it reads.
   *
   * See the header for the whole argument. One line, no branch on the chord, and
   * the tonic follows a key change if there is one — which there rarely is.
   */
  scaleForChord: (tonic, mode) =>
    makeScale(tonic, mode === 'minor' ? 'minorPentatonic' : 'mixolydian'),

  /** The ballroom, the lamé jacket and the hall bill. See `staging.ts`. */
  staging: STAGING,
};
