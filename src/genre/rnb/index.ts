/**
 * Rhythm and blues, 1960–2002.
 *
 * Motown and Stax, the Philadelphia arrangements, the quiet-storm format, new
 * jack swing, and the neo-soul records that spent real money making a machine
 * sound like a drummer. Four decades that are usually filed as four musics and
 * are one, because the same question runs through all of them: **there is a
 * singer, and everybody else is deciding how to get out of the way.**
 *
 * ## The load-bearing decision: `scaleForChord`, and this genre is split
 *
 * Five answers to "where does the melody get its notes" existed before this.
 * Iskelmä follows the *key*; jazz follows the *chord*; ambient follows the
 * *drone*; synth follows the key without the leading tone; funk follows a fixed
 * tonic scale and does not read the chord at all. This genre's honest answer is
 * that **it is two of those at once, and which one is in force is not a property
 * of the style.**
 *
 * A Motown side is a pop song with functional harmony. `I vi IV V`, four chords,
 * and a singer whose line is *the key* from the first bar to the last — the same
 * claim iskelmä makes, and correct here for the same reason: there is nothing to
 * re-orient onto, because every chord is a member of one scale and a line that
 * announced each of them would be sight-reading rather than singing.
 *
 * A quiet-storm ballad or a neo-soul record is the opposite instrument. The
 * chords are `maj9`, `min11` and `dom7sus4`, they are borrowed as often as not,
 * they sit for two bars each, and a line over them re-orients bar by bar exactly
 * the way a jazz line does — because in that music a chord is not a step on the
 * way somewhere, it is a place the record has gone and intends to stay.
 *
 * ### One rule with a bias, and the bias is a test rather than a weight
 *
 * The obvious construction is a genre rule plus a list of styles that override
 * it. That was tried on paper and it is wrong, for a reason worth stating because
 * it is what makes the rule below interesting: **the split does not fall on the
 * style boundary.** A Motown tune with a `V7/ii` in front of its bridge wants the
 * line to follow that one chord out of the key and come back, and a neo-soul
 * record sitting on `i11` for eight bars wants no re-orientation at all. A
 * per-style flag gets both of those backwards.
 *
 * What the two halves of the repertoire actually differ in is a property of the
 * *chord*, and it is a single bit: **has it left the key?** So that is the test,
 * and it is one line:
 *
 *     every chord tone is in the key's diatonic scale  →  the key's scale
 *     otherwise                                        →  the chord's own
 *
 * The result is that the same rule produces both behaviours without being told
 * which it is doing, because the input it reads is exactly the thing the two
 * halves of the genre disagree about. Twelve of the styles in `styles.ts` are
 * written on diatonic changes and the rule never fires once in them — those songs
 * are iskelmä's, note for note. Four of them are written on modal interchange and
 * it fires in half their bars — those are jazz's. And the four in between, which
 * are the ones a per-style flag could not have described at all, get the key
 * everywhere except over the borrowed chord, which is precisely what a soul
 * singer does with a minor plagal cadence.
 *
 * Some worked cases, because the whole argument rests on them coming out right:
 *
 * | key | chord | in key? | line takes |
 * |---|---|---|---|
 * | C major | `IVmaj7` | yes | C major blues |
 * | C major | `bVII` | no | mixolydian on B♭ — **which is C mixolydian** |
 * | C major | `iv` (borrowed) | no | dorian on F — **which is C aeolian** |
 * | C major | `V7/V` | no | mixolydian on D, and the F♯ arrives |
 * | C minor | `iv7` | yes | C aeolian |
 * | C minor | `IV` (dorian) | no | mixolydian on F — **which is C dorian** |
 * | C minor | `bVImaj7` | yes | C aeolian |
 *
 * The three bold rows are the ones that make the design work. Re-orienting onto a
 * borrowed chord does not throw the line out of the key at all — it lands it in
 * exactly the mode the borrowing implies, one degree at a time, which is what a
 * singer hears and what a chord-quality table can compute. `chordScale` in
 * `styles.ts` argues the four entries that produce it.
 *
 * ### Three styles override anyway, and they override in opposite directions
 *
 * Which is the shape jazz and funk already have *between* them — jazz follows the
 * chord and its blues style overrides to a tonic scale; funk follows the tonic and
 * its jazz-funk style overrides to the chord. This genre has both of those
 * arguments inside itself:
 *
 *  - **`deepsoul` fixes the scale to the tonic and never reads the chord.** Its
 *    progressions *do* leave the key — that is what a borrowed minor fourth is —
 *    and the singer does not follow, because a deep-soul vocal over a gospel band
 *    is a blues singer working in front of an arrangement they did not write.
 *  - **`quietstorm`, `neosoul` and `offgrid` always read the chord**, diatonic or
 *    not. In that music a `IVmaj9` is a colour rather than a step, and half of
 *    their progressions are modal interchange anyway — so the genre rule would
 *    re-orient on the borrowed bars and not on the diatonic ones, which is a line
 *    changing its mind about which system it is in every other bar. Off entirely
 *    is more consistent than on halfway.
 *
 * ## The blue third, which is the other half of the brief
 *
 * `majorBlues` — `[0, 2, 3, 4, 7, 9]`, the major pentatonic with the ♭3 added and
 * **both thirds available in one phrase** — is this genre's major scale. Not a
 * colour reached for at cadences, not something the soloist borrows: the row, as
 * the default, in every major-key song in the catalogue that is not `deepsoul`
 * (which reaches the same row by a different route) or one of the three
 * chord-following styles.
 *
 * That is a stronger claim than country or rock made of the same row and it is
 * the correct one here. The blue third over a major chord is not an inflection in
 * this repertoire, it is *the sound of the singing* — a soul vocal slides between
 * the two thirds inside one syllable, which is why the scale needs both and why
 * a generator given plain major produces something that is recognisably the sheet
 * music and not the record. `core/scale.ts` argues the row's existence; this is
 * the genre it existed for.
 *
 * **In minor there is no blue third to add**, because the third is already flat,
 * and the answer is plain aeolian rather than a pentatonic. The blue note in a
 * minor soul line is the ♭5, it is a note the voice passes *through* rather than
 * a degree it lands on, and it arrives the way funk's does — through the
 * soloist's `chromatic` appetite and through `chromatic-tone` being softened
 * below. `minorPentatonic` was considered and rejected: a funk riff never lands
 * on the second or the sixth and a soul line lands on both constantly, so the two
 * degrees a pentatonic removes are two this genre needs.
 *
 * ## `Chart.exits`, and why almost nothing here declares `requireLayers`
 *
 * The last chorus that strips back to the voice and the rhythm section is the
 * commonest gesture in this repertoire and the one thing that was unreachable
 * until `exits` existed. It is not a genre field — it fires from `chart.ts` at a
 * fixed rate, on `brass`, `counter` and `pad`, and it refuses any layer a style
 * has *required*. So the way a genre uses it is by deciding what to protect, and
 * this one protects almost nothing:
 *
 *  - **The strings are strippable**, on all six styles built around them. That
 *    looks like a genre declining to state its own identity and is the opposite:
 *    a Philadelphia record whose last chorus drops the string section is not a
 *    broken arrangement, it is the arrangement.
 *  - **`bedroom` is the one style with a `requireLayers`**, and it is `comp`
 *    rather than anything decorative — that style has already excluded the brass
 *    and the counter, so without it a section could come out with no chord
 *    instrument at all, which for a record that is one person and a keyboard is
 *    not thin, it is empty.
 *  - **The forms below carry three choruses wherever they can.** `planExits`
 *    places the ordinal from the form's own section counts rather than drawing
 *    it, and a layer leaves at the last section of the kind it appears in most —
 *    so a form with three choruses loses its colour on the third and keeps it on
 *    the first two, which is a slope rather than a flicker.
 */

import { makeScale, SCALE_STEPS } from '../../core/scale.js';
import { chordPcs } from '../../core/chord.js';
import { pc } from '../../core/pitch.js';
import { RULE_DISABLED } from '../../core/rules.js';
import type { Genre, FormStep } from '../types.js';
import { STYLES, chordScale } from './styles.js';
import { ERAS } from './eras.js';
import { MOODS } from './moods.js';
import { VOCALS } from './vocals.js';
import { generateTitle } from './titles.js';
import { STAGING } from './staging.js';

/**
 * Forms.
 *
 * Verse and chorus, and the chorus comes round three times. That is the shape of
 * nearly everything in this repertoire and it is different from both of its
 * neighbours in the same way: funk's unit is a chorus of the vamp and arrives
 * because the horns came in, jazz's is a chorus of the changes and arrives
 * because it is somebody else's turn, and this one arrives because *the words got
 * to the part everybody knows*.
 *
 * **Three choruses is a decision rather than an average**, and the reason is
 * `Chart.exits` — see the header. An exit is placed at the last section of the
 * kind a layer appears in most, so a two-chorus form loses its strings from the
 * *second of two*, which is half the record, and a three-chorus form loses them
 * from the third of three, which is the gesture. Four of the six forms below
 * carry three; the two that do not are the short single and the revue
 * instrumental, where two is honest and the thinner exit is right anyway.
 *
 * The sixteen-bar chorus is the late-period form and it is here rather than as
 * `Style.chorusBars` on the styles that want it. That field is for a form built
 * on a *fixed* chorus length — twelve for the blues — and a 1999 ballad is not
 * that: it has an eight-bar verse and a sixteen-bar chorus, which is a form with
 * a long section in it and not a form made of one repeated length.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  // The single. Two verses, three choruses, a middle eight, and out — the shape
  // of the great majority of these records.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'bridge', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 7],
  // The album side. A saxophone gets eight bars before the last chorus, which is
  // where a soul solo actually goes — after the bridge and before the payoff.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'bridge', bars: 8 }, { kind: 'solo', bars: 8 },
    { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 8 },
  ], 5],
  // The long chorus. A late-period ballad: eight bars of verse and sixteen of the
  // thing everybody bought it for. See the header for why this is a form rather
  // than a `chorusBars`.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 16 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 16 },
    { kind: 'bridge', bars: 8 }, { kind: 'chorus', bars: 16 },
    { kind: 'outro', bars: 4 },
  ], 4],
  // The loop side. Four verses and three choruses, no bridge, and nothing that
  // develops — which is what a record built on two bars of somebody else's tape
  // actually is.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 4],
  // The revue instrumental. Two choruses and a solo in the middle, because
  // somebody has to have a feature and it is not going to be the singer.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'solo', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 3],
  // The short single. Two and a half minutes, which is what a 1965 label thought
  // a record was.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 3],
];

export const rnb: Genre = {
  id: 'rnb',
  label: 'R&B',
  description:
    'Soul, sweet soul and the machines after it — Motown and Stax, Philadelphia strings, quiet storm, new jack swing and neo-soul, 1960 to 2002.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,

  /**
   * Prepared, and this is the one genre in the project where saying so is a
   * musical claim rather than a default being accepted.
   *
   * Funk sets this false and argues that an applied dominant would announce that
   * somebody had written an arrangement, which in that idiom is an admission.
   * Here somebody *had* written an arrangement, they were paid for it, and their
   * name is on the label. The `V7/ii` in front of a Motown bridge, the `V7/IV` a
   * gospel organist reaches for as a reflex, and the whole last chorus going up a
   * semitone under a singer already at the top of their range are three of the
   * most reliable gestures in this repertoire — and the third of them is why
   * `keyChangeChance` in `eras.ts` runs from 0.15 down to 0.05 rather than sitting
   * near zero the way it does next door.
   */
  preparedModulation: true,

  /**
   * Flat keys, and the reason is neither the guitar's nor quite the horns'.
   *
   * Jazz lives in flats because the trumpet and the tenor transpose; funk lives in
   * E, A and D because the riff is a shape under a hand on a fingerboard. Both
   * arguments are partly true here — there is a horn section on half these records
   * and a bass guitar on all of them — and neither is the deciding one, because in
   * this genre **the key is chosen for the singer**. A soul side is cut in
   * whatever key puts the top of the chorus at the top of somebody's range, which
   * is why the catalogue is full of records in E♭ and A♭ that no guitarist would
   * have picked, and why the same song exists in three keys on three labels.
   *
   * What that produces is a flatter distribution than any other genre here — the
   * top weight is 6 and the bottom is 2, where funk's runs 6 to 2 across seven
   * *guitar* keys and jazz's clusters hard in the flats. E♭ and B♭ lead because
   * the horn section still has to read it, and C and G survive at real weight
   * because the Rhodes has no opinion at all.
   */
  keys: {
    minor: [[0, 5], [7, 5], [2, 4], [5, 4], [9, 3], [10, 3], [4, 2]],
    major: [[3, 6], [10, 6], [5, 5], [0, 4], [8, 3], [7, 3], [2, 2]],
  },

  /**
   * It buttons, and the interesting part is that this is the genre with the best
   * excuse not to.
   *
   * More records in this repertoire physically fade than in any other in the
   * project — the last chorus repeats, the engineer pulls the fader down over
   * eight bars, and that is the ending on a startling proportion of the catalogue.
   * Funk's file makes the standard argument against honouring it (the fade is a
   * mastering decision made after the band went home) and that argument is true
   * here too, but it is not the one that decides it.
   *
   * The one that decides it is `Chart.exits`. What a listener hears in a soul fade
   * is not the level going down, it is the *arrangement thinning* — the strings
   * stop, the horns stop, and what is left is a voice and a rhythm section going
   * round. That gesture is now a composed thing rather than a mixing one: it fires
   * on 30% of songs, it is placed on the last chorus, and it leaves the band
   * playing. So the ending does not have to fake it any more, and what the band
   * does at the end of the number is what a revue band has always done, which is
   * land on the downbeat together with a cymbal over it.
   */
  ending: 'button',

  /**
   * Counted in. A soul band counts itself in, the count is audible on more of
   * these records than anybody expects, and — unlike funk, where the shouted count
   * is vocabulary — here it is simply what happens when eight people have to start
   * at the same time and one of them is standing at a microphone rather than
   * looking at the drummer.
   */
  countIn: true,

  /**
   * `light`, matching jazz and funk, and for the reason those two share: the
   * notes this table exists to suppress — the blue third against a major chord,
   * the seventh that never resolves, the eleventh sitting in the voicing — are
   * this idiom's vocabulary rather than defects in it. The overrides below do the
   * genre-specific work and the first of them is not a preference.
   */
  defaultStrictness: 'light',

  /**
   * The chorus is meant to be the same tune every time.
   *
   * `catchy` locks the rhythm and recalls each section, which is what a verse and
   * chorus song *is*, and this genre is more comfortable with it than anything
   * else in the project — five styles push further to `earworm`, and only
   * `deepsoul` goes the other way, because at fifty-eight dotted quarters a
   * minute the singer has run out of words and what is left is not a tune being
   * restated.
   */
  defaultHook: 'catchy',

  /**
   * The band does not get out of the way, and here the reason is neither jazz's
   * nor funk's.
   *
   * Jazz thins out under a soloist because comping is a conversation; funk stays
   * `full` because the vamp is what the solo is over. This genre is `full` because
   * **the solo is eight bars long and it is a feature rather than an
   * improvisation** — the arrangement carries straight on underneath because the
   * arrangement is where the record lives, and a rhythm section that dropped back
   * for eight bars of saxophone would be treating a decoration as the subject.
   */
  soloBacking: 'full',

  /**
   * Who solos, and the two entries that are unusual are both unusual by being
   * small.
   *
   * **The drummer at 0.4 is the lowest in the project**, and it is a real
   * statement about the repertoire rather than an omission. There is essentially
   * no such thing as a soul drum solo: the whole aesthetic of the drumming here is
   * that the part is a frame around a voice, and a drummer who took a chorus would
   * be doing the one thing the style was built to prevent. Funk's is at 2.5 for
   * the mirror-image reason — there the four bars of kit alone is the part of the
   * record everybody remembers.
   *
   * **The bass at 0.8** is the same sentence about a different player, and it is
   * the sadder one. The bass parts on these records are the most famous in popular
   * music and the men who played them never got a feature; a genre that handed the
   * floor to the bass would be correcting history rather than describing it.
   *
   * The vocabulary is a saxophone player's rather than a keyboard player's, and
   * two numbers separate it from every other genre here. `ornament` at 0.6 is the
   * highest in the project, because the soloist in this music is imitating the
   * singer and the singer is decorating everything. `paraphrase` at 0.4 is
   * likewise high and is the same fact: a soul saxophone solo is very often *the
   * tune*, played with more notes in it, and a chorus of fresh material over the
   * changes would be a jazz record breaking out in the middle of a single.
   */
  solo: {
    rotation: [['melody', 5], ['comp', 4], ['counter', 3], ['bass', 0.8], ['drums', 0.4]],
    // Almost never. Trading is a conversation between equals and there are no
    // equals on this stage — there is a singer, and eight bars where they are not
    // singing.
    tradeFours: 0.1,
    quoteMotto: 0.55,
    backing: {
      melody: 'full', counter: 'full', comp: 'full',
      // The two rare ones, and both thin out rather than stopping, because a
      // section that dropped out entirely for a bass feature would be a funk
      // breakdown in the wrong genre.
      bass: 'comping',
      drums: 'comping',
    },
    vocabulary: {
      gait: 0.45,
      doubleTime: 0.12,
      offbeatAccent: 0.5,
      // Low. An enclosure is a bebop device for arriving at a guide tone, and this
      // soloist is arriving at the note the singer would have sung.
      enclosure: 0.18,
      // The blue notes, and specifically the ♭5 in minor, which is not a degree of
      // the scale this genre hands out. See the header.
      chromatic: 0.4,
      // The highest in the project. See above — the soloist is imitating a singer
      // who decorates every note they hold.
      ornament: 0.6,
      develop: 0.5,
      displace: 0.28,
      space: 0.35,
      climb: 4,
      // High, and deliberately. A soul solo is frequently the tune with more notes
      // in it rather than a fresh chorus over the changes.
      paraphrase: 0.4,
      liftIntoReturn: 0.5,
    },
  },

  /**
   * The comper breathes, and sits between the two genres either side of it.
   *
   * Jazz is at 0.18 / 0.3 / 0.25 because a comper who plays the same bar twice is
   * more audible as a machine than any wrong note. Funk is at 0.04 / 0.14 / 0.05
   * because the figure is the song. Both arguments are half-true here and the
   * split runs along the three fields rather than between them.
   *
   * `rest` at 0.1 is nearer funk's than jazz's, because a soul comp figure is
   * written and the guitar's backbeat chop in particular is a part rather than a
   * suggestion — but it is more than double funk's, because the holes are where
   * the singer is and a keyboard player who filled all of them would be sent home.
   *
   * `anticipate` at 0.16 is the largest of the three and is the one number here
   * above jazz's on any axis except that one. The chord arriving an eighth before
   * the barline and ringing through it is the single most characteristic thing a
   * soul keyboard player does — it is how the backbeat gets its lift — and it is
   * the gesture the whole repertoire shares from 1965 to 2002.
   *
   * `displace` at 0.07 is nearly off, and for funk's reason rather than jazz's: a
   * written figure nudged a sixteenth is a written figure played wrong.
   */
  comping: { rest: 0.1, anticipate: 0.16, displace: 0.07 },

  /**
   * Where this genre disagrees with the shared rule table.
   *
   * The first entry is the one that matters and it is not a preference: without it
   * the generator silently refuses the most characteristic interval in the
   * repertoire, with no error and nothing in the output to say what happened.
   */
  ruleOverrides: {
    /**
     * **The one that would have broken this genre in silence.**
     *
     * `augmented-second` vetoes any move of one scale step and three semitones
     * from strictness level 1 upward. In harmonic minor that is correct. In
     * `majorBlues` — `[0, 2, 3, 4, 7, 9]`, this genre's major scale — it fires on
     * two of the scale's six steps: **the natural third to the fifth** is one step
     * and three semitones, and **the sixth to the octave** is one step and three
     * semitones. The first of those is the most common melodic move in soul
     * singing and the second is how a phrase gets home. This genre ships at
     * `light`, which is level 1, so the rule would have refused both in every song
     * it ever generated and produced lines that were correct, legal and had the
     * genre taken out of them.
     *
     * Disabled outright rather than softened, because there is no level at which
     * it is right here. `core/scale.ts` warns about exactly this against the
     * pentatonic rows and `majorBlues` is one of them; funk's file records the
     * same disabling for the minor pentatonic, and this is the third genre to
     * find it.
     *
     * **`wide-leap` is deliberately left alone**, which is where this genre and
     * funk part. Funk softened it because in the minor pentatonic one step can be
     * three semitones and *two* steps is a perfect fifth, past the rule's
     * threshold. In `majorBlues` the same arithmetic runs out one degree earlier:
     * the widest two-step move is the natural third to the sixth, which is five
     * semitones and exactly a perfect fourth, so the rule is calibrated correctly
     * for this scale and every note it catches is a genuine leap. One row over,
     * and the same rule needs opposite treatment.
     */
    'augmented-second': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * The blue fifth is chromatic by construction, and in minor it is the only
     * blue note there is.
     *
     * In major this genre put the ♭3 *into* the scale, which is the whole point of
     * `majorBlues`, so the rule is not policing the important one. In minor the
     * third is already flat and the note that carries the affect is the ♭5 between
     * the fourth and the fifth — a note the voice passes through rather than lands
     * on, and one that plain aeolian has no room for.
     *
     * Softened rather than disabled, which is the difference between this genre
     * and funk. There the chord scale is five notes and everything characteristic
     * is outside it; here the scale already contains most of what matters, so a
     * chromatic tone is genuinely more often a fault than a feature and the rule
     * should keep saying so — just not at strictness 1, and never as a veto.
     */
    'chromatic-tone': { minLevel: 3, vetoLevel: RULE_DISABLED, penalty: 0.7 },

    /**
     * A seventh in a chord that is not going anywhere resolves nowhere.
     *
     * The rule assumes a seventh is a dissonance under pressure, which is true
     * where the harmony is moving and false across a third of this catalogue: a
     * `min11` held for two bars, a `maj9` that is the destination rather than the
     * route, and the `I7` a Memphis side sits on for eight bars are all chords
     * where the seventh is a *colour of the root*. Softened rather than disabled,
     * because the styles with real cadences in them — and there are a dozen — have
     * sevenths that genuinely owe something.
     */
    'unresolved-seventh': { minLevel: 3, vetoLevel: RULE_DISABLED, penalty: 0.8 },

    /**
     * The eleventh is the chord.
     *
     * `min11` appears in five style tables and `dom7sus4` in four, and the whole
     * point of both is that the fourth is sitting in the voicing rather than
     * resolving out of it. The rule is right for a singable diatonic idiom and
     * right for jazz, which tightens it; here it would file off the extension that
     * defines the last quarter of the repertoire. Softened rather than disabled,
     * because over a plain `I` in a Motown chorus the fourth is still an avoid note
     * and still sounds like one.
     */
    'avoid-fourth': { minLevel: 3, vetoLevel: RULE_DISABLED, penalty: 0.7 },

    /**
     * A vocal group moves in parallel because a vocal group is one instrument, and
     * so does a horn section.
     *
     * The prohibition is choral in origin and it is about two *independent* voices
     * fusing into one. Four people round a microphone singing a chord in parallel
     * are not independent and are supposed to fuse — that is what a doo-wop group
     * is — and the horn section behind them has exactly the same defence. This
     * genre has more of both than anything else in the project.
     *
     * Kept as a mild preference rather than disabled, because the melody and the
     * bass genuinely can fuse and that is still a fault wherever it happens.
     */
    'parallel-perfects': { minLevel: 3, vetoLevel: RULE_DISABLED, penalty: 0.65 },
  },

  /**
   * Which devices this band uses, and the two that are raised are the two nothing
   * else here raises.
   *
   * `harmony` at 8 is the highest weight given to any device by any genre in the
   * project, and it is the correct answer twice over: this music has a *vocal
   * group* behind the lead on half its catalogue and a horn section writing in
   * thirds behind that, and both of those are the same gesture — a second line
   * that is the first line's harmony rather than its answer. `swell` at 7 is the
   * string section, which is the layer six of these styles are built around, and
   * it comes up from the pool for the exact reason funk brought it down.
   *
   * `riff` comes down, which looks odd for a genre with `funksoul` in it and is
   * right for the other twenty-three: a repeated figure stated by the horns is a
   * funk arrangement, and what the horns do here is answer the singer. `trade`
   * stays low for the reason `solo.tradeFours` is low — there is nobody on this
   * stage to trade with.
   *
   * ## Why the 8 stays a device, and no style here declares `Style.harmony`
   *
   * `HarmonyProfile` places a second voice in **scale steps**, and this genre's
   * major scale is `majorBlues` — six degrees whose own gaps are 2, 1, 1, 3, 2, 3
   * semitones, because the whole point of the row is that both thirds are in it
   * and they are next to each other. A step count is not an interval in a scale
   * shaped like that. Forced onto `doowop` at `amount: 1` over 60 seeds, two steps
   * under the tune came out a **perfect fourth 53.3%** of the time, a third 29.8%,
   * and a **whole tone 17.0%** — the lead on the ♮3 and the second voice on the
   * 2̂, which is the degree the row puts next door. `girlgroup` and `contemporary`
   * measure the same within two points. Five steps is worse: 66.6% sevenths
   * against 33.0% sixths.
   *
   * In minor it is exact — plain aeolian has seven degrees, and the same
   * declaration comes out 99.4% thirds at two steps and 98.4% sixths at five. That
   * does not rescue it, because the styles with a group standing in front of the
   * band are the major-key ones: over 20 seeds each, `doowop` is in major 18
   * times, `gospelsoul` 19 and `girlgroup` 15, against 59.4% for the genre.
   *
   * Those two step counts are the device's own — `Chart.harmonyBelow` is 2 or 5 —
   * so a fourth under the tune is what the weight above already writes, and one
   * phrase of one repeat chorus is a colour that survives being one. A standing
   * property is the texture of every section it names, and a table saying *five
   * people round one microphone sing in thirds* while producing a fourth half the
   * time and a cluster one note in six describes a different record. `doowop`,
   * `girlgroup` and `contemporary` are the three that would say it — the group,
   * the group, and the eight backing vocals — and they stay silent until the
   * interval can be spelled in semitones, or until `writeLine` corrects on the
   * distance to the tune rather than on membership of the scale. A note the row
   * puts a whole tone under the lead is *in* the scale, which is exactly why rule
   * 2 leaves it there.
   */
  arrangement: { harmony: 8, swell: 7, tutti: 5, unison: 4, riff: 3, trade: 2 },

  /**
   * The top of the record is the record, which is the exact inverse of the genre
   * next door.
   *
   * Every number is stated against the shared defaults rather than against another
   * genre, since those are what an omitted layer gets. `vocal` at 1.0 is the whole
   * mix statement and the rest of the table exists to make room for it: the comp
   * comes *down* from 0.72 to 0.62 and the pad sits at 0.58, and both of those are
   * a keyboard and a string section being asked to be quieter than they would be
   * anywhere else so that a person can be heard over them.
   *
   * **The pad at 0.58 is the highest in the project**, which reads as a
   * contradiction of the sentence above and is the real claim. Funk puts it at
   * 0.34 and says in as many words that the layer barely belongs; here the pad is
   * eighteen violins that somebody was paid session rates to play, arranged by
   * somebody whose name is on the sleeve, and it is a third of what a listener
   * bought the record for. It is quiet against the voice and loud against every
   * other genre's, and those are both true at once.
   *
   * The bass at 0.74 is well above the default and well below funk's 0.86. The
   * bass parts on these records are famous; they are also underneath a singer, and
   * the difference between 0.74 and 0.86 is the difference between a countermelody
   * and a subject.
   */
  mix: {
    vocal: 1.0,
    melody: 0.88,
    bass: 0.74,
    drums: 0.66,
    brass: 0.7,
    comp: 0.62,
    pad: 0.58,
    counter: 0.5,
  },

  /**
   * The kit, and the one number that is this genre's signature.
   *
   * **`tb` at 0.78.** The shared default is 0.45 and funk pulls it *down* to 0.36,
   * with the reason stated in `DEFAULT_DRUM_MIX` itself: a tambourine playing
   * sixteenths at anything higher is all anyone hears. That is correct for a genre
   * where it plays sixteenths and it is exactly backwards here, where the
   * tambourine plays **two and four** and is the single most identifying sound in
   * the repertoire. Doubling the snare rather than filling between it, at 0.78 it
   * is what a listener recognises the label by; at 0.36 it is a shaker somebody
   * left on.
   *
   * `cp` at 0.72 is the same argument for the decade after — from 1985 the clap is
   * not a garnish on the snare, it is beside it on every backbeat in the file. The
   * snare itself is at 0.95 and the kick at 0.86, which is the other inversion
   * worth naming: this is the one genre in the project where the backbeat is
   * louder than the downbeat, because in this music the bar is *counted* on two
   * and four rather than on one, and a kit mixed the other way round makes a soul
   * record sound like a funk one.
   *
   * The ride comes down to 0.3 — it appears in three patterns across
   * twenty-four styles — and the three hand-drum strokes take the shared curve
   * unchanged, since those numbers were set against the physics of the instrument
   * rather than against any genre and a conga under `chicago` is the same object
   * it is anywhere.
   */
  drumMix: {
    bd: 0.86, sd: 0.95, rim: 0.72, hh: 0.4, oh: 0.46, cp: 0.72,
    lt: 0.68, mt: 0.68, ht: 0.68, cr: 0.5, rd: 0.3, perc: 0.55, cb: 0.45,
    sh: 0.4, tb: 0.78, lp: 0.8, mp: 0.6, hp: 0.5,
  },

  /**
   * Register and response, and both halves are stated against funk because that is
   * where the interesting disagreement is.
   *
   * The pad drops two semitones rather than the default's three and funk's five.
   * That is a statement about what the layer *is*: a string section arranged over
   * a song sits close under the tune and is meant to be heard as a countermelody,
   * where an organ pad under nine people is meant to be felt. The comp drops three,
   * which is more than funk's two and for the opposite reason — a chank has to cut
   * and a Rhodes has to not, so it is voiced down out of the singer's way.
   *
   * `response` is where this genre says the thing funk says backwards. **A soul
   * arrangement absolutely does play the chorus harder**, and the pad and the brass
   * swing widest of all at 0.9 because those two layers *are* the arrival — the
   * strings come in on the second chorus and the horns answer the last one. The
   * rhythm section moves less than a dance band's and more than a funk band's: 0.35
   * on the bass and 0.4 on the comp is a band leaning into a chorus without anybody
   * getting visibly louder, which is what a session rhythm section does when there
   * is a singer to leave room for.
   */
  layerPlan: {
    offsets: { pad: -2, comp: -3 },
    response: { bass: 0.35, comp: 0.4, drums: 0.5, brass: 0.9, pad: 0.9 },
  },

  /**
   * A chamber, and a tape slap behind the voice.
   *
   * `reverbSize` at 0.44 is nearly twice funk's 0.24 and it is the same physical
   * fact read the other way. That genre keeps the room dry because a long tail on
   * a sixteenth-note guitar part smears the sixteenths together and the separation
   * between them is the music; this one has almost nothing playing sixteenths and
   * a great deal of held singing, and the tail is what a voice sounds like in a
   * room somebody built for it. Two of the studios this repertoire came out of had
   * a purpose-made echo chamber and it is on the records.
   *
   * `delayBeats` at 0.5 — an eighth rather than the dotted-eighth three other
   * genres here settle on — because the repeat this music uses is a *slap* on the
   * vocal rather than a rhythmic figure, and an eighth at these tempos arrives
   * close enough behind the syllable to thicken it instead of answering it. The
   * feedback at 0.18 is one and a bit repeats, which is a tape machine rather than
   * an effect.
   */
  space: {
    reverbSize: 0.44,
    delayBeats: 0.5,
    delayFeedback: 0.18,
  },

  /**
   * Standing production notes, refined by each era and overruled by four styles.
   *
   * The vocal is the wettest thing here and the only layer in the project sent
   * this far to both the plate and the tape — 0.34 and 0.16 — which is what a lead
   * vocal on these records actually is. `lowpass` at 9 kHz keeps the breath and
   * the consonants that `vocals.ts` spends its whole file arguing for; rolling off
   * lower takes away the effort and leaves a nice tone.
   *
   * The pad is at 0.5 reverb and 4.5 kHz, which is a string section recorded in a
   * hall and then sent to a plate on top of that. It is the only layer here that
   * is wetter than the voice and it is the reason the two do not fight: they are
   * in different rooms.
   *
   * The bass is dry and dark for the reason it is everywhere — reverb on a
   * sustained low note arrives while the note is still sounding — and at 1800 Hz
   * rather than funk's 1600, because a Jamerson line has to be *followed* and the
   * upper harmonics are how a listener does that.
   */
  effects: {
    vocal: { reverb: 0.34, delay: 0.16, lowpass: 9000 },
    melody: { reverb: 0.28, delay: 0.1, lowpass: 8500 },
    counter: { reverb: 0.3, delay: 0.12, lowpass: 8000 },
    comp: { reverb: 0.2, lowpass: 7500 },
    bass: { reverb: 0.04, lowpass: 1800 },
    drums: { reverb: 0.2, lowpass: 11000 },
    brass: { reverb: 0.26, lowpass: 7500 },
    pad: { reverb: 0.5, lowpass: 4500 },
  },

  // Two and a half to four and a half minutes. The single is under three and the
  // quiet-storm side runs over four, and the range covers both without the middle
  // being empty.
  duration: [155, 265],

  /**
   * What the drummer plays into a section, and here it genuinely is a tom roll.
   *
   * Funk's file argues that a descending roll round the kit is a dance-band gesture
   * and close to the opposite of what a funk drummer does. That is true, and this
   * is the genre it was true *against*: the four-beat roll down the toms into the
   * chorus is on an enormous number of these records, it is what the fill is *for*
   * — announcing that the part everybody is waiting for is about to start — and a
   * genre built on verse-and-chorus form wants exactly that. So `tom-roll` is at
   * the top, where it is at the bottom next door.
   *
   * `drop` is low rather than absent. Stopping dead is a real gesture here and it
   * belongs to the slow half of the catalogue, where it is the band leaving the
   * singer alone rather than the band making a hole for the downbeat. `cymbal` is
   * the lowest — that is a jazz drummer's fill, and there is not one of those on
   * this stage.
   */
  fills: [
    ['tom-roll', 6], ['snare-toms', 5], ['lead-in', 4], ['snare-roll', 3],
    ['drop', 2], ['cymbal', 1],
  ],

  /**
   * What the tune is made of, and every weight below is the sentence this file
   * opens with: **there is a singer, and everybody else is deciding how to get
   * out of the way.**
   *
   * Three keys, and the six scalars are deliberately not among them. `melody`
   * runs `ornament` from 0.18 on `stomper` to 0.75 on `contemporary` and `span`
   * from 10 on `crossover` to 15 on `ballad`; a genre-level number would be the
   * average of a hundred-and-forty-a-minute dance side and a record whose own
   * comment says the run is the hook.
   *
   * ## The archetypes
   *
   * **`wide-interval` at 5**, above everything, and it is the one derivation
   * structurally cannot reach: `archetypesFor` computes it from `melody.leap`,
   * which is a per-note appetite, and tops out at 2.2. *"A singer's tune — it
   * leaps out and steps home"* is a claim about a whole section. The evidence is
   * the `keys` table above, where this catalogue sits in E♭ and A♭ because the
   * key is picked for whatever "puts the top of the chorus at the top of
   * somebody's range" — a genre that chooses its keys by where one phrase peaks
   * writes its tunes out of that phrase. `ballad` states it in one line: span 15,
   * the widest in the file with `contemporary`, so that somebody can cross their
   * whole range inside one phrase.
   *
   * **`arch-hook` at 4.** `FORMS` above says the chorus arrives "because the
   * words got to the part everybody knows", `defaultHook: 'catchy'` locks the
   * tune and recalls it with five styles pushing to `earworm`, and the semitone
   * key change exists to put the last chorus above a singer already at the top of
   * their range. That is an arch with a late high point, stated three times.
   * Derivation hands every style in the project a flat 3 here and the lift is
   * small because `SHAPES` does the rest — a chorus multiplies it by 1.8.
   *
   * **`long-note` at 2.5**, above every derived value in the genre — the ceiling
   * is `deepsoul`'s 2.03 — and against a floor of 0.4 on twelve of the
   * twenty-four styles. `space` below argues this genre's reverb from exactly the
   * same fact — "almost nothing playing sixteenths and a great deal of held
   * singing" — and the cells agree wherever they are slow enough to say so:
   * `deepsoul` weights `[24]` and `[12, 12]` at 5 each under a note that this
   * singer holds a note across a beat and a half more often than they change one,
   * and `quietstorm` is built on a chord that has "arrived and intends to stay for
   * two bars".
   *
   * Those twelve at the floor are the fast half, and since every archetype here
   * is named `mergeArchetypes` hands them 2.5 as well — a sixth of the draw
   * before `SHAPES` weighs in, on `stomper`, whose own header says there "is not
   * a hole anywhere in any of the tables below". That is intended rather than an
   * oversight, because
   * the archetype is *relative*: `wantDensity` is the style's own cell density
   * times `ARCHETYPES['long-note'].density` of 0.45, so a long-note section on
   * `stomper` still asks for 2.0 onsets a bar against its cells' 4.5, where on
   * `deepsoul` it asks 0.8 against 1.8. It tells a fast style to halve rather than
   * to stop — a singer holding across the bar while the band does not, which is
   * this file's opening sentence with the tambourine still going.
   *
   * **`riff-response` down to 1.5**, and this is what separates the genre from
   * funk playing the same instruments in the same decade. The answering half of
   * this music is *a second layer*: `arrangement` above pushes `riff` down to 3
   * because "a repeated figure stated by the horns is a funk arrangement, and what
   * the horns do here is answer the singer", and `solo.tradeFours` is 0.1 because
   * the one thing nobody on this stage does is answer another player in the same
   * line. The answer is scored for somebody else, so the tune does not contain it.
   * Derivation cannot see that — it reads `motown`, `stomper`, `funksoul` and
   * `newjack` at 2.6 to 3.1 purely because their cells are the four busiest in the
   * genre, which is a Detroit cell table mistaken for a vamp.
   *
   * **`descending-sequence` down to 1.2**, below every derived value in the genre
   * — the floor is `deepsoul`'s 1.45 — and below `riff-response` for a reason:
   * call and response is at least a gesture this music makes constantly and
   * merely scores for another player, where a descending sequence is against the
   * arrangement itself. Its `ARCHETYPES` entry puts the peak at 0.08–0.25 and
   * spends the rest of the section falling away from it, and this repertoire is
   * built the other way up: `FORMS` above carries three choruses wherever it can
   * so that the last one is the arrival, and `preparedModulation` sends that one
   * up a semitone "under a singer already at the top of their range". A tune whose
   * high point is in its first eighth is that record read backwards.
   *
   * **`chant` down to 0.8.** A chant is one note repeated with a tail and its own
   * judge weights halve `interest` and `motion` so that it is allowed to stall.
   * This soloist carries `ornament` at 0.6, the highest in the project, "because
   * the soloist in this music is imitating the singer and the singer is
   * decorating everything" — and there is nothing on a stalled note to decorate.
   * It is 0.8 rather than 0 because `hiphopsoul` is a two-bar loop with the
   * harmony almost stopped, and a repeated note over one is the record.
   *
   * ## The subsets, and this genre subsets the scale before the voice sees it
   *
   * `scaleForChord` below hands the tune `majorBlues` — six degrees, 1 2 ♭3 ♮3 5
   * 6 — where every other genre hands it seven. The generic `SUBSETS` rows are
   * indices into a seven-degree mode and `snapToSubset` *drops* a degree the
   * scale has not got, so `[0,1,2,4,5]` and `[0,1,2,4,5,6]` are the same five
   * notes here and the table means something other than what it says. That is the
   * reason to replace it rather than a preference.
   *
   * **The whole mode at 5**, which is a no-op — `snapToSubset` hands the note
   * back untouched once the surviving degrees cover the scale — and it is this
   * genre's own answer in both modes. In major the six degrees of `majorBlues`
   * *are* the brief: both thirds available in one phrase, and a subset dropping
   * either is the sheet music rather than the record. In minor the header says it
   * outright — the answer "is plain aeolian rather than a pentatonic", because a
   * soul line lands on the second and the sixth constantly and those are the two
   * a pentatonic removes. It is also what protects `quietstorm`, `neosoul` and
   * `offgrid`, where the mode arriving from `chordScale` is itself the colour and
   * a subset over the top of it is a second opinion about a settled chord.
   *
   * **`[0,1,2,4,5]` at 3** — one row with three correct readings, which is the
   * shape the scale rule's own table has. In `majorBlues` it is 1 2 ♭3 5 6: the
   * blue third kept, the natural one dropped, a singer on the flat side of a
   * major chord for a whole section. In aeolian it is 1 2 ♭3 5 ♭6, the second and
   * the sixth the header insists on. In `deepsoul`'s `blues` it removes the ♭5
   * and nothing else, which is that note being passed through rather than landed
   * on — the distinction `chromatic-tone` above is softened for, arriving here as
   * a degree the line does not stop on.
   *
   * **`[0,1,2,3,4,6]` at 2**, its mirror. In `majorBlues` it keeps both thirds
   * and drops only the sixth, the tightest statement of the brief this table can
   * make; in aeolian it keeps the fourth — the eleventh `min11` and `dom7sus4`
   * are built on and that `avoid-fourth` above is softened for — and drops the
   * ♭6, which is one of the two degrees the header refuses to lose. It is a
   * different loss from the pentatonic's, and that is the whole answer to the
   * header: that row takes the second *and* the sixth and what is left is a funk
   * riff's five notes, where this one keeps the second and what is left — 1 2 ♭3
   * 4 5 ♭7 — is the set aeolian and dorian agree on. Declining to say which sixth
   * is in force is what a singer does over a vamp whose `IV` the worked table in
   * the header sends to dorian and whose `iv` it leaves in aeolian. Below the row
   * above because in `deepsoul`'s minor it is the one reading that comes out
   * wrong, leaving the ♭5 in and taking the ♭7 out — and at 2 of 10, one section
   * in five, which is a colour rather than the row the genre hands out.
   *
   * `[0,2,3,4,6]` is absent although in `majorBlues` it is this genre's four best
   * notes. In minor it is the minor pentatonic exactly, and the header rejects
   * that row by name.
   *
   * ## The ops
   *
   * Only the ones derivation never touches. It already writes `sequence`,
   * `transpose`, `ornament`, `diminish`, `displace` and `expand` from the style's
   * own numbers, and `ops` merges by key — so naming one would replace
   * twenty-four readings with an average, which for `ornament` means collapsing
   * `motown`'s 1.0 and `contemporary`'s 2.65 into a single figure. The run in
   * this music is `ornament` splitting a held note anyway, not `diminish`
   * replaying a figure at double speed, and derivation reads the highest ornament
   * column in the file straight into it.
   *
   * `invert` at 0.5. `opsFor` draws it at weight 3 for an `answer`, and it is the
   * one derivation of a phrase a listener cannot hear as the same phrase — which
   * `defaultHook: 'catchy'` says is the point of a chorus here.
   *
   * `augment` at 1.7 and `fragment` at 1.3, which do not compound, because
   * `appetite` multiplies an option by the appetite for its *first* operator only
   * — the fact `extend` below turns on. `close`'s four options lead with
   * `fragment`, `fragment`, `augment` and `reharmonise` at 3, 3, 2 and 1, so what
   * the pair buys is 96.6% of closes being a stretch of some kind against 88.9%
   * at flat weights — the held ending `long-note` is weighted from — with the
   * whole-figure stretch growing from 22.2% to 29.3% and the keep-the-head pair
   * staying at about two thirds. Moving the stretch toward the whole figure
   * is the intent rather than the price: the last phrase of a soul chorus broadens
   * all the way through, where keeping a head and hanging a long note off it is
   * the more written gesture of the two. `fragment` is raised the less because it
   * also leads two of `develop`'s six options, one of them a fragment sequenced
   * down the scale, which is the archetype this voice has just pushed to the
   * bottom.
   *
   * `reharmonise` at 0.4 is `scaleForChord` below stated as an operator. It sets
   * `resnap`, forcing strong beats onto the tones of whichever chord has arrived,
   * and this genre's scale rule is that twelve of its styles never re-orient at
   * all — `deepsoul` says a line that dutifully followed each borrowing "would be
   * a line that had read the chart". Doing it in the scale and again in the
   * operator is doing it twice.
   *
   * `extend` is unnamed for a mechanical reason rather than a musical one: it
   * never stands first in an `opsFor` choice and `appetite` reads only the first
   * operator, so a weight on it would change nothing.
   */
  voice: {
    archetypes: [
      ['wide-interval', 5],
      ['arch-hook', 4],
      ['long-note', 2.5],
      ['riff-response', 1.5],
      ['descending-sequence', 1.2],
      ['chant', 0.8],
    ],
    subsets: [
      [[0, 1, 2, 3, 4, 5, 6], 5],
      [[0, 1, 2, 4, 5], 3],
      [[0, 1, 2, 3, 4, 6], 2],
    ],
    ops: { augment: 1.7, fragment: 1.3, invert: 0.5, reharmonise: 0.4 },
  },

  /**
   * The scale rule. One test, two answers, and the chord is a parameter it reads
   * exactly once.
   *
   * See the header for the whole argument, the worked table, and the three styles
   * that override it in two directions. The test is *has this chord left the key*,
   * the diatonic set is the plain major or minor scale on the tonic, and the answer
   * when it has not is `majorBlues` in major — the blue third as a degree rather
   * than an inflection — and aeolian in minor, where there is no blue third to add.
   */
  scaleForChord: (tonic, mode, chord) => {
    // Widened to `number[]`, because `SCALE_STEPS` is inferred as a tuple of
    // literals and `includes` would otherwise only accept the seven numbers that
    // happen to be in the row it was written from.
    const diatonic: readonly number[] = SCALE_STEPS[mode === 'minor' ? 'minor' : 'major'];
    const inKey = chordPcs(chord).every((p) => diatonic.includes(pc(p - tonic)));
    if (!inKey) return chordScale(chord);
    return makeScale(tonic, mode === 'minor' ? 'minor' : 'majorBlues');
  },

  /** The ballroom, the matched suits and the gown. See `staging.ts`. */
  staging: STAGING,
};
