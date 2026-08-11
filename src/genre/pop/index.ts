/**
 * Pop — the single, 1963 to now.
 *
 * # Why this is a genre and not a set of styles belonging to iskelmä and synth
 *
 * The objection has to be answered first because it is a good one, and because
 * `docs/synth.md` already established the honest form of the answer: **it is the
 * one genre here that is not a new answer to the question, and it earns its
 * place elsewhere.** That sentence applies to this file word for word, and the
 * rest of this header is the "elsewhere".
 *
 * Start by conceding everything worth conceding.
 *
 * `Genre` exists because of `scaleForChord`, and there are three genuine answers
 * to it: follow the key, follow the chord, follow the drone. **This genre's
 * answer is follow the key**, which is iskelmä's answer and synth's answer, and
 * pretending otherwise would be the kind of overstatement that gets found out
 * later. The rule below is iskelmä's rule with the harmonic-minor substitution
 * moved from the genre to seven named styles. That is a real refinement and it is
 * not a fourth answer to anything.
 *
 * The overlap is worse than that, because it is not only structural. Iskelmä
 * *is* Finnish pop and it already contains a style called `iskelmapop`, whose
 * own description reads "1980s radio iskelmä: straight eighths, drum machine,
 * synth strings" — which is a fair description of four of the twenty-four styles
 * in this file. Synth covers the instrumental electronic end and would have
 * taken `synthpop` and `electropop` without complaint. Rock has `beat`, `jangle`
 * and `newwave`, and would have taken `merseybeat`, `powerpop` and `indiepop`.
 * Nine of the genres in this project are arguably pop music, and two more are
 * being written this week.
 *
 * So the case has to be made on the other fields, and there are three of them.
 *
 * ## 1. The span. Sixty-three years, and nothing else here has one
 *
 * Every other genre in this project is a *period*. Iskelmä runs 1955–1990 in two
 * eras; synth is 1972–1990 and its own file says the three eras are "three
 * musics that happen to share a lineage"; jazz, funk, reggae, metal are each two
 * or three decades. This one runs from a Brill Building cubicle in 1962 to a
 * marimba drop in 2016, and it is continuous — every style here descends
 * traceably from the one before it, the ♭VII that `merseybeat` borrows in 1964 is
 * still load-bearing in `dancepop` in 2010, and the same four chords underlie the
 * first and last entries in `styles.ts`.
 *
 * A genre that spanned that and *changed answer* would be two genres. This one
 * does not change answer, which is exactly why the span is evidence rather than
 * sprawl: it is one continuous practice, and the practice has a name.
 *
 * ## 2. The form. A chorus that arrives and a bridge that leaves
 *
 * `forms` below is the sharpest structural claim in the file. Every entry has
 * **three choruses**, and that is not an aesthetic preference — it is the
 * minimum at which the genre's defining arrangement gesture becomes reachable at
 * all. `planExits` places a colour layer's exit at the *last* section of the kind
 * it appears in most and needs at least two of them, so a form with three
 * choruses is a form whose last chorus can strip back. The `forms` literal below
 * argues it in full.
 *
 * The bridge is the other half. Iskelmä has a bridge in one of its four forms;
 * jazz has none at all, because head–solos–head has no room for one; synth's
 * bridges are eight bars long and its own file describes them as departures that
 * must not outstay their welcome. Here the bridge is in every form, it is where
 * the key moves when it moves anywhere but the last chorus, and half the styles
 * in the file have a dedicated bridge progression that goes somewhere the verse
 * and chorus tables never go. A repertoire built around *the eight bars that are
 * not the chorus* is a real formal claim and no other genre here makes it.
 *
 * ## 3. The production is the composition, and only this genre claims it
 *
 * This is the load-bearing one. Every genre in this project has production
 * decisions in it and most of them are *about* the music. Reggae's `dub` is the
 * one prior style anywhere in the catalogue whose treatment is the piece, and
 * `Style.effects` was added for it — the docstring calls that claim "the rarest".
 *
 * Here it is not rare, it is the organising principle. The era ids in `eras.ts`
 * are `twotrack`, `multitrack`, `gated` and `sidechain`: four **recording
 * situations**, not four scenes. That naming is a testable claim rather than a
 * flourish — it says that what changes across sixty years of a music whose
 * forms, keys and harmonic vocabulary barely move is *the desk*, and that the
 * arrangement follows the desk rather than the other way round. A bass playing a
 * countermelody is only worth writing once twenty-four tracks exist to hear it
 * on. A gated snare is not a mix decision applied to `stadium`, it is what that
 * style is. **Five** styles here reach `Style.effects` — `girlgroup`,
 * `newromantic`, `stadium`, `jangle` and `dreampop` — which is more than any
 * other genre in the catalogue, and every one of them would be a different piece
 * of music without it.
 *
 * That read *four … more than any genre except reggae*, and both halves have to
 * go. `jangle` was left out of the list while declaring a three-layer table of
 * its own, and reggae has exactly **one** declarer, `dub` — the style the field
 * was built for, which is presumably how it got remembered as the leader.
 * Counted across all nineteen genres: pop 5, hiphop 4, rnb and house 2 each,
 * reggae and dnb 1 each, and **zero** in the other thirteen. This is the field's
 * heaviest user, which is the stronger version of what the paragraph was
 * reaching for.
 *
 * ## Where this comes out weaker than expected, stated plainly
 *
 * Two places.
 *
 * **The `iskelmapop` overlap is not resolved, it is accepted.** `synthpop` and
 * `hinrg` here and `iskelmapop` there are the same music in two languages, and
 * the only real distinction is that one is sung in Finnish in a pavilion. That
 * is a distinction the tables cannot express and the staging can, which is a
 * thinner answer than it looks like at first glance.
 *
 * **The last era is the one that most wanted a fifth answer to `scaleForChord`
 * and does not get one.** From about 2005 the melodic practice of this
 * repertoire stops being scale-derived at all: the tune is a fixed pitch set
 * dragged across a moving loop, closer to what `jazz/blues` does with its tonic
 * scale than to what the other twenty-two styles here do. `Style.scaleForChord`
 * would have supported it, `blues` is precedent, and it was not written because
 * the honest version needs measurement this pass did not do. Named here rather
 * than discovered later.
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
 * Forms — verse/chorus, four of them, and **every one has three choruses**.
 *
 * That is the one hard rule this table follows and it is mechanical rather than
 * aesthetic. `planExits` in `generate/chart.ts` is the newest arrangement device
 * in the engine and it places a colour layer's departure at the last section of
 * whichever tune-bearing kind it appears in most — and it needs *two* of that
 * kind at minimum, because "one section to be heard in and one to be missed in"
 * is the least a gesture can be built from. A form with two choruses can lose the
 * second; a form with three can lose the last while the first two carry the
 * arrangement, which is the difference between an arrangement that thins and one
 * that simply stops.
 *
 * **A last chorus that strips back is the commonest arrangement gesture in
 * popular music of any kind** — `planExits` says so in those words — and this is
 * the genre that gesture belongs to. Fourteen genres were written against a chart
 * that could only build. This one is the first written after it could strip, and
 * the form table is where that shows.
 *
 * Measured over 900 charts built with this genre's section counts: **30.1% of
 * arrangements strip something**, which is `STRIPS` exactly, and the layer taken
 * is the pad in 264 of them against the counter's 125 and the brass's 79. That
 * distribution is the gesture this genre wanted — the strings, or the supersaw,
 * playing every chorus but the last one.
 *
 * **What is not reachable, and it is half of what a pop arrangement does.** A
 * bridge that drops the band cannot be built this way. `layersFor` gives a bridge
 * `['drums', 'bass', 'comp', 'pad']` and no melody, and `playing` fits its closing
 * edge only to a section that states the tune — for the good reason given there,
 * that thinning behind nothing is not a drop-back but an empty bar. A bridge also
 * occurs once in every form here, and a section stated once has no last time to
 * sit out. So the gesture this genre gets is the last chorus, and the bridge drop
 * is a real absence rather than something these tables declined to use.
 *
 * The four differ in what happens *before* the last chorus:
 *
 *  - the standard single, with a bridge at 2/3;
 *  - the double-verse opening, which is the 1963 shape — two verses before the
 *    chorus arrives, because the chorus was still a payoff rather than the point;
 *  - the instrumental break form, which is the only place `solo` appears;
 *  - the long one, with a bridge *and* a final chorus pair, which is the ballad's
 *    shape and the only form with four choruses in it.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  // The single. Sixteen-bar choruses because a pop chorus is two eight-bar
  // phrases and the second is the one with the title in it.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'bridge', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 6],
  // 1963: two verses before anybody gets to the chorus.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'bridge', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'outro', bars: 4 },
  ], 4],
  // The break. Eight bars of somebody else playing the tune, which in this
  // repertoire is a saxophone in 1965 and a synthesiser in 1985 and is the same
  // eight bars either way.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'solo', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 4],
  // The ballad. Four choruses, and the last two are the key change: the third
  // states it in the new key and the fourth is the one everybody waits for.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'bridge', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'outro', bars: 4 },
  ], 3],
];

export const pop: Genre = {
  /**
   * **True**, and this is the load-bearing decision in the file.
   *
   * Synth and reggae both set this false, and their reasoning is sound and is
   * quoted in `Genre.preparedModulation`: modal pop after 1970 has no leading
   * tone in minor, so an applied dominant in front of the last chorus would
   * sound like a dance band had walked in, and `npm run genres` asserts on
   * synth's sounding notes that the raised seventh never appears.
   *
   * This genre needs both halves of that argument to be true at once, because it
   * contains both repertoires. A 1963 girl-group side and a Broadway-descended
   * ballad have functional dominants; a 1985 synthpop chorus does not. And the
   * final-chorus lift is one of the most characteristic gestures in the whole
   * sixty-three years — it cannot simply be turned off.
   *
   * ## How to have both, and why it costs nothing
   *
   * The two questions turn out to be *separable*, and the separation is the
   * interesting finding rather than a workaround.
   *
   * **The raised seventh comes from `scaleForChord`, not from the pivot.** A
   * pivot is an applied dominant of the key being moved *to* — `V7/bII` for a
   * semitone lift, `V7/II` for a tone — and neither contains the home key's
   * leading tone. In A minor those are F7 (F A C E♭) and F♯7 (F♯ A♯ C♯ E); the
   * note the modal claim is about is G♯, and it is in neither of them. So a
   * prepared modulation does not put a leading tone in a modal minor song. What
   * would put one there is a genre-level rule returning harmonic minor under a
   * dominant-function chord, and this genre's rule does not do that.
   *
   * **So the leading tone is a style decision and it is made twenty-four times.**
   * `Style.scaleForChord` is the seam — the field whose docstring says it is
   * absent on every style but one, and that the blues is why it exists. Seven
   * styles here name `functional` in `styles.ts`: `brill`, `girlgroup`,
   * `baroque`, `ballad`, `torch`, `chamber` and `newromantic`. The first six are
   * all pre-1970 and descend from Tin Pan Alley and the theatre pit; the seventh
   * is a synthesiser band in 1981 whose writers had been to musical theatre, and
   * it is the one the measurement found rather than the reading. The other
   * seventeen take the genre rule and never raise the seventh.
   *
   * The division is checkable rather than declared, and the invariant is worth
   * stating because it is exactly the kind of thing that rots in silence: **a
   * style writes `V` in a minor progression if and only if it names
   * `functional`.** Over 220 songs four styles broke it — `newromantic` gained
   * the substitution, and `merseybeat`, `discopop` and `powerpop` had their minor
   * `V` taken away, because in those three the aeolian reading is the right one
   * and the `V` was the error. That is the actual shape of the repertoire, stated
   * once per style rather than averaged into a single boolean that would be wrong
   * for half the file whichever way it went.
   *
   * **And `keyChangeChance` per era carries the rest.** The rate is 0.34 in
   * `twotrack` — the highest in the genre, and deliberately not where a reader
   * expects it, because the gear change is remembered as an eighties cliché and
   * was a Brill Building device first. 0.3 in `gated`, where the lift is just as
   * common and arrives over a chromatic chord rather than a functional one. 0.2
   * in `multitrack`, where the singer-songwriter half of the decade wrote songs
   * that end where they started. 0.08 in `sidechain`, which is the honest number:
   * a modern pop record is a four-bar loop that is identical in the verse and the
   * chorus, and transposing the last chorus would break the one thing the
   * arrangement is made of. It is not zero because the ballad survived.
   */
  preparedModulation: true,
  id: 'pop',
  label: 'Pop',
  description:
    'The single, 1963 to now — girl groups, Brill Building, soft rock, disco pop, synthpop, stadium, europop and the drop.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,

  /**
   * Singer's keys, and the constraint is not the one the other genres use.
   *
   * Synth picks for register, because nothing there is played by hand and the
   * question is where a bass figure sits on a small speaker. Iskelmä picks for
   * the accordion and the guitar. This genre picks for **the voice**, which is
   * the only instrument on the record that cannot transpose: a chorus is written
   * to land on a specific high note, that note is at the top of somebody's range,
   * and the key is whatever puts it there.
   *
   * So the tables lean flat and toward the middle of the circle — C, F, G, B♭,
   * E♭ in major; A, E, D, F♯ in minor — which is what a pop lead sheet actually
   * looks like and is a long way from the guitar keys rock lives in. F♯ minor is
   * unusually high in the minor table for one reason: it is where an enormous
   * amount of this repertoire's minor-key material sits, because its relative
   * major is A and the relative-major chorus is this genre's core lift.
   */
  keys: {
    minor: [[9, 6], [4, 5], [2, 4], [6, 4], [11, 3], [7, 3], [0, 2], [5, 2]],
    major: [[0, 6], [5, 5], [7, 4], [10, 4], [3, 3], [2, 3], [9, 2], [8, 2]],
  },

  /**
   * It buttons.
   *
   * The fade is the more famous pop ending and it is not the one to choose here,
   * which is worth arguing because the instinct runs the other way. A fade is a
   * *record* ending — it exists because a producer had four bars of vamp and
   * nowhere to put them, and it is what happens on a piece of vinyl rather than
   * on a stage. Every other thing this genre does is aimed at being performed:
   * the form has a bridge so there is somewhere to walk to, the last chorus lifts
   * so the audience knows it is the last one, and `countIn` below is true because
   * a band standing in front of people has to start together. A genre gets one
   * answer here, and the one that agrees with the other three fields is the
   * button.
   */
  ending: 'button',
  countIn: true,

  /**
   * The band leans into the chorus, and the two entries beside `fill` are the
   * two things this repertoire does at a seam.
   *
   * `shot` is the whole band catching a figure into the last chorus, which is
   * what a pop arrangement does instead of a drum fill about a third of the time
   * — and `Style.shots` is read only by this, so the figures `discopop` and
   * `stadium` write have somewhere to be played. `elide` is the chorus arriving
   * an eighth early, which is the single most common small gesture in the genre
   * and was previously reachable only by accident.
   *
   * **`break` is deliberately absent from the genre table and present on exactly
   * one style.** A pop band stopping dead is a specific and rather grand
   * gesture: it belongs to the ballad, two bars before the last chorus, with the
   * singer left alone — and `ballad` declares it with `breakCarrier: 'melody'`,
   * which is what `BreakCarrier` allows `melody` for. Putting it in the genre
   * table would have given it to `bubblegum`, which does not stop for anything.
   */
  transitions: [['fill', 6], ['shot', 3], ['elide', 3]],

  defaultStrictness: 'standard',

  /**
   * `catchy`, and the argument for **not** going to `earworm` is the interesting
   * half.
   *
   * `docs/hook.md` has the axis and pop has the strongest claim to the top of it
   * of anything in this project — the doc's own table calls the high-hook,
   * high-smoothness corner "most pop ever written". Iskelmä sits at `standard`,
   * jazz at `loose`, ambient and synth at `catchy`. This genre sits at `catchy`
   * too, and reaches `earworm` on six styles, which is more than any other genre
   * pushes there.
   *
   * It does not go to `earworm` genre-wide, and the reason is the form table
   * above. At `earworm` every section is recalled and the harmony collapses to
   * the plainest progression available on almost every draw — which is a
   * description of a *loop*, and it is why ambient's `drone`, synth's `machine`
   * and synth's `stalker` are the styles that live there. A pop song is not a
   * loop. It is a form with a bridge in it, and the bridge exists precisely so
   * that the chorus is not the only thing that ever happens; a setting that
   * recalls the bridge as hard as it recalls the chorus has deleted the one
   * section whose job is to be different.
   *
   * So the six that go to `earworm` are the six where the loop really is the
   * song — `bubblegum`, `hinrg`, `europop`, `teen`, `dancepop`, `tropical` — and
   * **nine** go the other way to `standard`, where the craft is that the second
   * half is not the first half again: `brill`, `baroque`, `ballad`, `torch`,
   * `chamber`, `newromantic`, `jangle`, `dreampop` and `indiepop`. That named
   * *four* and listed four, and the five it dropped are the ones that make the
   * claim interesting — `ballad` and `newromantic` are the styles this genre
   * argues hardest about elsewhere, and `jangle`, `dreampop` and `indiepop` are
   * the whole of its late-eighties corner. Nine of twenty-four sit at `standard`
   * against six at `earworm`, so the genre leans away from the loop rather than
   * toward it, which is the opposite of the shape the old count implied.
   *
   * That spread reaches **three** of the axis's five levels — `standard`,
   * `catchy` and `earworm` — and it is **not** the widest in the project, which
   * this used to claim. `HookId` has five levels and nothing here touches
   * `through` or `loose`; classical and metal reach all five, and six other
   * genres also reach three. The honest version is the one the next clause
   * already gives without the superlative: a repertoire that contains both the
   * Archies and
   * Randy Newman.
   */
  defaultHook: 'catchy',

  // A pop arrangement does not thin out behind the break. The eight bars where
  // the saxophone plays the tune are eight bars with the whole record still
  // going, because the break is a feature of the arrangement rather than a
  // conversation between players.
  soloBacking: 'full',

  /**
   * What a pop arrangement is built from.
   *
   * `harmony` highest of anything in the project, and it is the genre's own
   * device: a line in thirds under the second half of the chorus is on a
   * genuinely enormous fraction of these records, from the girl groups through
   * the Beach Boys through every eighties duo to a stacked vocal in 2010. Nothing
   * else here can claim it that hard — iskelmä puts it at 5 and says it is on
   * almost every record in *its* repertoire, which is the right neighbour to be
   * a step above.
   *
   * `riff` is next, because the answering figure that comes round every second
   * bar is how a pop arrangement fills the holes the singer leaves. `unison` is
   * raised because the synthesiser doubling the vocal line an octave down is the
   * whole texture of three of this genre's four decades.
   *
   * **`trade` at 1.** Handing a phrase from one player to another is a gesture
   * between two people who can hear each other, and almost nothing in this
   * repertoire was played in the same room at the same time after 1970. It stays
   * available at a weight that keeps it rare, which is the same call synth makes
   * for the same reason.
   *
   * `tutti` is left at the pool's default rather than weighted, because `shots`
   * in `transitions` above already gives the band a way to hit a figure together
   * and two mechanisms doing one job is how the wrong one gets tuned.
   */
  arrangement: { harmony: 7, riff: 5, unison: 4, trade: 1 },

  /**
   * Two overrides, and both are about the same thing: this genre's harmony is
   * pentatonic more often than its chord symbols suggest.
   *
   * The first is the one `core/scale.ts` warns about against the pentatonic rows
   * and `funk/index.ts` is the worked example of. `augmented-second` vetoes any
   * one-step, three-semitone move from strictness 1 upward, which is correct in
   * harmonic minor — it is the accident of reaching for the raised seventh over a
   * dominant. In the **major pentatonic** it fires on the third-to-fifth step,
   * and in the minor pentatonic on tonic-to-♭3 and fifth-to-♭7. Those are not
   * hazards in this music, they are what a pop hook is made of: the melodic
   * material of `tropical`, `dancepop` and `teen` is a five-note set walked in
   * exactly those intervals, and half of `merseybeat` and `powerpop` is the
   * major pentatonic with a passing note.
   *
   * Softened rather than disabled, which is where this differs from funk. There
   * the rule is wrong at every level because every bass figure in the genre walks
   * one of those intervals. Here seven styles take `functional` and genuinely do
   * have harmonic minor under a dominant, and in those the rule is catching the
   * thing it was written for. `minLevel: 4` leaves it working at the strictest
   * setting and out of the way everywhere else.
   */
  ruleOverrides: {
    'augmented-second': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.8 },

    /**
     * A hanging fourth is the sound of the last twenty-five years of this genre
     * and about half of the eighties.
     *
     * `sus2` and `sus4` are not suspensions inside the harmony here, they are the
     * harmony — a chord with no third in it is the one voicing that survives
     * being played by a synthesiser, two guitars and a room at once, which is the
     * argument `stadium` makes in its own header. Synth disables this rule
     * outright for the Vangelis version of the same fact. Softened here rather
     * than disabled, because `brill` and `baroque` are writing 4–3 suspensions
     * that genuinely do resolve and the rule should still notice when one does
     * not.
     */
    'avoid-fourth': { minLevel: 3, vetoLevel: RULE_DISABLED, penalty: 0.75 },

    /**
     * `unresolved-leading-tone` is deliberately **not** here, and neither is
     * `chromatic-leading-tone-in-minor`.
     *
     * Synth vetoes the second from the first level because its whole position is
     * that the note is not in the music. This genre's position is that the note
     * is in *seven styles* of the music and not in the other seventeen, and a
     * genre-level veto cannot say that. What happens instead is what synth's own
     * note describes as the better outcome: in the seventeen modal styles the rule is
     * simply inert, because their chord scale never produces a raised seventh for
     * it to catch, and in the **seven** functional ones it is doing exactly the
     * job it was written for. Seven, matching the *seven styles* three lines above
     * and the list `styles.ts` gives in full — `girlgroup`, `brill`, `baroque`,
     * `ballad`, `torch`, `chamber` and `newromantic`. This read *six*, against its
     * own paragraph, which is the cheapest kind of wrong number to leave behind
     * and the easiest to read straight past.
     *
     * The residual is named rather than hidden. The soloist's `chromatic`
     * appetite offers the semitone either side of wherever the line is, so a
     * modal-minor pop song *can* acquire a leading tone in a solo section the
     * same way seventeen synth songs in two hundred did — measured over 220 songs
     * at **24 notes in 22,955** across the seventeen modal styles, against 186 in
     * the seven functional ones, which is the split the design predicts and is
     * 0.1% of the modal material. The difference
     * from synth is that this genre does not assert the note never happens, so it
     * is a colour rather than a broken promise — and `chromatic` is set to 0.09
     * below, which is where synth left it after making the opposite decision.
     */
  },

  /**
   * The voice is on top, and everything else is arranged under it.
   *
   * `vocal` is the loudest layer here and it is the only genre in the project
   * where that is true — `vocals.ts` argues it at length and the short version is
   * that a pop vocal is never balanced against the arrangement, it is placed on
   * top of it. The melody layer sits just under, because on a great many of these
   * records the melody layer *is* a synthesiser doubling the vocal, and a
   * doubling mixed level with what it doubles is a flam.
   *
   * `pad` at 0.6 is the number that would be wrong in half the other genres here.
   * In this one the pad is a string section in 1965 and a supersaw in 2010, and
   * in neither case is it material — it is the thing that makes the chorus feel
   * bigger than the verse, which is a job done by *arriving* rather than by being
   * loud. `Chart.exits` is the other half of that sentence, and the `forms`
   * literal above is where it is argued.
   */
  mix: {
    vocal: 1.1,
    melody: 0.95,
    comp: 0.7,
    bass: 0.85,
    pad: 0.6,
    counter: 0.55,
    drums: 0.72,
  },

  /**
   * The kick and the backbeat, and the backbeat is whatever is playing it.
   *
   * `cp` at 0.85 is the highest handclap weight in the project and it is not a
   * garnish here: from about 1968 to about 2016 the clap is a *co-equal* backbeat
   * voice, layered on the snare rather than decorating it, and half the styles in
   * `styles.ts` write both on slots 4 and 12. Mixing it as percussion would put
   * the genre's second-most-recognisable sound behind its least.
   *
   * `tb` at 0.62 is the other one worth naming. The tambourine is a first-class
   * `DrumVoice` now and its own docstring lists "the sleigh-bell shimmer over a
   * pop bridge" as one of the parts that wanted it — this genre is where that
   * part lives, and thirteen of the twenty-four styles write one — `girlgroup`,
   * `merseybeat`, `brill`, `bubblegum`, `sunshine`, `discopop`, `powerpop`,
   * `chamber`, `synthpop`, `jangle`, `teen`, `indiepop` and `tropical`. This said
   * *eleven*, and the correction strengthens the point rather than denting it:
   * the tambourine is on a **majority** of this catalogue, which no other genre
   * here can say.
   */
  drumMix: {
    bd: 0.95, sd: 0.9, rim: 0.6, hh: 0.5, oh: 0.5, cp: 0.85,
    cr: 0.5, rd: 0.45, sh: 0.42, perc: 0.6, cb: 0.55, tb: 0.62,
    lt: 0.75, mt: 0.75, ht: 0.75,
  },

  /**
   * The default plan, with one change.
   *
   * `offsets` is left alone — the arranger's dance-band stratification is right
   * here, because unlike synth this genre genuinely does have a tune on top and
   * accompaniment underneath, and the pad's default drop of a minor third is
   * exactly what stops it voicing the same notes as the comp.
   *
   * What moves is `response`. The pad swings further than anything else at 0.9,
   * because in this repertoire the string section or the supersaw is *the*
   * dynamic instrument: it is barely there in the first verse and it is the
   * loudest thing in the last chorus, and that curve is how a pop arrangement
   * gets bigger. The drums move less than the default at 0.55, which is the
   * opposite statement and the correct one — a drum machine plays a chorus at the
   * same velocity it plays a verse, and even the live half of this genre is
   * compressed hard enough that the kit is the most level thing on the record.
   */
  layerPlan: {
    response: { pad: 0.9, counter: 0.8, drums: 0.55, bass: 0.5 },
  },

  /**
   * The break, which is not improvisation and is barely a solo.
   *
   * Eight bars in the middle of the record where somebody who is not the singer
   * plays the tune. `paraphrase: 0.45` is the field that buys it — the solo
   * engine lifts its material from the head's own contour rather than inventing
   * over the changes, so the break is recognisably the song. Iskelmä sets the
   * same field to 0.33 and its note explains why not higher: a break made
   * entirely of literal bars of the tune has no figure of its own to develop, and
   * motivic recurrence collapses. This sits a little above that because a pop
   * break quotes harder than a tanssilava one does — the audience is following a
   * melody they were sold, and a break that changed the subject would be a
   * different record.
   *
   * The rotation is `counter` first and `melody` second, which is a real
   * distinction rather than a formality: in 1965 the break is the saxophone
   * player standing up, and by 1985 it is the same synthesiser that has been
   * playing the tune all along taking eight bars of its own. `comp` gets a small
   * weight for the one case that is neither — a piano break, which happens.
   *
   * **Never the drums**, for the reason iskelmä gives and one more: a drum solo
   * on a pop single is a thing that has happened perhaps four times.
   */
  solo: {
    rotation: [['counter', 5], ['melody', 4], ['comp', 2]],
    tradeFours: 0,
    quoteMotto: 0.6,
    backing: { counter: 'full', melody: 'full', comp: 'full' },
    vocabulary: {
      // An eighth-note gait, near enough. A pop break is busier than the tune it
      // is quoting, because the point of it is that somebody is showing off
      // inside a record that otherwise does not let anybody.
      gait: 0.6,
      doubleTime: 0.12,
      offbeatAccent: 0.2,
      enclosure: 0.15,
      // See the note on `unresolved-leading-tone` above: this is where the
      // residual chromaticism in the modal styles actually comes from, and 0.09
      // is a trickle of colour rather than a vocabulary.
      chromatic: 0.09,
      ornament: 0.3,
      develop: 0.7,
      displace: 0.2,
      space: 0.25,
      // Three semitones across the section. The break rises into the last
      // chorus and everybody knows it is going to.
      climb: 3,
      paraphrase: 0.45,
      // The highest in the project, and it is the whole reason the break is
      // eight bars before a chorus rather than anywhere else. This gesture is
      // what the section exists to deliver.
      liftIntoReturn: 0.9,
    },
  },

  /**
   * How long a single is.
   *
   * Two minutes to four and a half, which is the tightest duration band in the
   * project and is the one number here that is a fact about the *format* rather
   * than about the music. A 1965 single had about 2:30 of playing time before the
   * groove pitch started costing volume; a 2010 single is three and a half
   * minutes because that is what a playlist rewards. Sixty years, one constraint,
   * arrived at twice for unrelated reasons.
   */
  duration: [125, 265],

  /**
   * The dance-band vocabulary with the balance moved.
   *
   * `tom-roll` still leads — the fill into the chorus is a tom roll in every
   * decade of this genre — but `drop` is weighted much higher than iskelmä's 1,
   * and that is the programmed half of the repertoire. From 1982 onward the
   * commonest thing that happens in the bar before a chorus is that everything
   * stops, and `drop`'s own gloss is exactly right about why it counts as a fill:
   * the silence *is* the announcement.
   */
  fills: [
    ['tom-roll', 5], ['drop', 4], ['snare-roll', 3], ['snare-toms', 3], ['lead-in', 3],
  ],

  /**
   * What a pop tune is made of.
   *
   * Three keys and only three, because they are the three `voiceForStyle`
   * cannot derive. The six it can — density, leap, ornament, compass,
   * syncopation, accents — stay each style's own, and here that spread is the
   * point: derived density runs 1.93 onsets a bar on `dreampop` to 5.83 on
   * `tropical`, and one genre number would say a torch song and a marimba drop
   * move at the same speed.
   *
   * **No style in this file has an authored voice**, so this governs all
   * twenty-four. `iskelmapop` is registered by id over in iskelmä and is not
   * this genre's `synthpop`, whatever the header concedes about them being the
   * same music in two languages — and that claim is cashed under the subsets
   * below, which is where the two tables had come to say the same thing.
   *
   * ## The archetypes: three declared, three left alone, and one line between
   *
   * `mergeArchetypes` is by key, so an archetype this table does not name keeps
   * the weight derivation gave it, per style. The three named are the three
   * where derivation has nothing left to say — one is flat across all
   * twenty-four, one is clipped at the archetype's floor in twenty of them, and
   * one is reading a field that does not mean what its name means. The three
   * unnamed are ranking all twenty-four off fields that do mean it.
   *
   * `descending-sequence` **to 1.2**, and it is the entry that moves the most
   * notes. `archetypesFor` reads `melody.sequence` into it and this genre writes
   * the highest sequence numbers in the file, 0.68 to 0.76. The result is
   * checkable and it is exact: **the only six styles whose derived
   * `descending-sequence` clears the flat `arch-hook` 3 are the six at
   * `hook: 'earworm'`** — `bubblegum`, `hinrg`, `europop`, `teen`, `dancepop`,
   * `tropical`, at 3.04 to 3.28. What those tables mean by a high `sequence` is
   * *the figure comes back*, not *the figure walks down the scale*, and the
   * archetype's own entry puts its high point at 0.08–0.25 of the section — a
   * tune falling away from its first bar, which is the opposite of every form in
   * `FORMS` above. It goes to the floor.
   *
   * `arch-hook` **to 5**, because its gloss is this genre in one line: *rise to
   * one high point, with a figure that keeps coming back*. It flattens nothing —
   * `archetypesFor` hands all twenty-four a flat 3 — and the three numbers under
   * it are all above. Three of the four forms have three choruses and the ballad
   * has four, every one of them eight bars; `SHAPES.chorus.favour` lifts this
   * archetype by 1.8 and nothing else by more; and `liftIntoReturn: 0.9`, which
   * no genre in the project exceeds. (The *sixteen-bar* choruses in the comment
   * three lines above `FORMS` are eight in the literal underneath it. That line
   * belongs to whoever owns the form table; this paragraph counts the bars.)
   *
   * `long-note` **to 1**, off the floor and no further, and it is the one entry
   * here that overrides live numbers. The derivation is 0.4 plus 1.4 for every
   * onset a bar under three, and **twenty of the twenty-four are above three
   * onsets a bar**, so for them that term is zero and the reading is bottoming
   * out rather than measuring. Against that, `[16]` or `[8,8]` tops the
   * `cadenceCells` in 23 of 24 — the exception is `tropical`, which has no sung
   * line to end. A pop phrase *ends* long without being built out of long notes,
   * and 1 against `arch-hook`'s 5 is that much appetite and no more. **The four
   * styles derivation did rank pay for it**: `stadium` 0.62, `ballad` 0.85,
   * `torch` 1.6 and `dreampop` 1.9 — the largest `long-note` in the genre, on
   * the style this block opened with as its density floor. Cutting 1.9 to 1 is
   * wrong about `dreampop`, and the fix is a `Style.voice` delta in wave 2
   * rather than a reason to leave the other twenty clipped at 0.4.
   *
   * **`riff-response`, `chant` and `wide-interval` are left derived, and that is
   * a decision rather than an omission.** Each is ranking all twenty-four off
   * the field that means what the archetype means, and the flat numbers that
   * stood here — 3, 2 and 2.5 — each deleted a spread this block's own first
   * paragraph refuses to flatten.
   *
   *  - `riff-response` derives 0.6 on `torch` and 5.08 on `tropical`, the widest
   *    band any archetype has here, off density and ornament. The 3 rested on
   *    `arrangement.riff: 5` — but that is an *accompaniment* weight, the
   *    answering figure another player fills the singer's holes with, where this
   *    archetype is a form for the tune itself; iskelmä's voice draws the same
   *    line for the same entry. Its other witness was a girl-group lead with the
   *    group answering behind it, and no such claim exists in `girlgroup`'s
   *    block: what is there is the line in thirds, which is
   *    `arrangement.harmony: 7` and a second singer rather than an answer. The
   *    flat 3 cut `tropical` — "the chorus stopped being sung and became a
   *    marimba figure", the one style in the catalogue that really is a figure
   *    and its answer — by 41%.
   *  - `chant` derives 0.5 to 2.68, off density again, and the count that used
   *    to settle it — nine `standard` against six `earworm` in `defaultHook` —
   *    is the section-recall axis `docs/hook.md` describes, not a claim about a
   *    tune being one note repeated with a tail. The two are related by intuition
   *    and by no table in this file. Density already puts `tropical`, `bubblegum`
   *    and `hinrg` on top and `torch` and `dreampop` at the bottom, which is the
   *    answer this paragraph would have written by hand.
   *  - `wide-interval` derives 1.5 to 2.2 off `melody.leap`, which is interval
   *    width itself. The 2.5 was argued from `keys` — "a chorus is written to
   *    land on a specific high note, that note is at the top of somebody's
   *    range" — and that is tessitura and where the peak sits, which is
   *    `arch-hook`'s `peakAt` and `SHAPES.chorus.register: 2`, both already in
   *    force. There is no genre-level correction to make either: these styles
   *    leap 0.2 to 0.34 and 279 of the project's 391 styles sit inside that band,
   *    so a flat number above 2.2 would have claimed pop leaps further than any
   *    table here says it does.
   *
   * ## The subsets, which this genre already argues for in the wrong field
   *
   * `ruleOverrides` softens `augmented-second` because "the melodic material of
   * `tropical`, `dancepop` and `teen` is a five-note set walked in exactly those
   * intervals, and half of `merseybeat` and `powerpop` is the major pentatonic
   * with a passing note". That is a `subsets` claim made in a rule override for
   * want of anywhere else to put it, while every style here took the generic six
   * weighted defaults.
   *
   * Three, and all three keep the third. `stadium` is the one style whose chord
   * symbols leave it out — `Isus2` and `IVsus2` in four rows, the only `sus`
   * anywhere in this genre's progressions, with `newromantic` wanting the same
   * voicing in prose without writing one — and `avoid-fourth` was softened on
   * `stadium`'s own argument. Where the chord has no third, the singer has it.
   *
   *  - **1 2 3 5 6**, the major pentatonic, which is the set that paragraph
   *    names.
   *  - **1 3 4 5 7**, a different set in each mode at the same weight, which is
   *    deliberate: `modeBias` runs 0.35–2.6 major against 0.4–3.0 minor and 52%
   *    of style-and-mood pairs come out major, so an argument that holds in one
   *    key is an argument about half the songs. In minor it is the minor
   *    pentatonic and its top degree is the ♭7 the seventeen modal styles cadence
   *    on — `VII` is the commonest chord in the 176 minor progression rows this
   *    file writes, 320 against `i`'s 300, and it stands in 139 of them. Under
   *    the seven that name `functional` a dominant fetches harmonic minor through
   *    `scaleForChord` and that degree becomes the raised seventh: "in A minor
   *    these records play E7 and the melody sings G♯ over it", which is
   *    `styles.ts`'s own sentence for why those seven exist. In major it is the
   *    tonic triad plus 7̂ and 4̂, the two notes of the tritone that resolves into
   *    it, and this genre writes `V7` 180 times — the canonical table's
   *    "yearning in major" is exactly that, a line that is always leaning on one
   *    of the two.
   *  - **the full diatonic**, for the Tin Pan Alley half: changes that move
   *    every bar in `brill`, a 4–3 suspension over `baroque`'s harpsichord.
   *
   * **A fourth set stood here and is gone** — the pentatonic with 7̂ put back and
   * 4̂ left out, at 2, for `sunshine`'s maj7 with a ninth on top. Its second
   * reason, that in minor the ♭7 is what the ♭VII–IV–I family walks on, is wrong
   * in both modes: `bVII` appears 28 times in `styles.ts` and every one of them
   * is in a major-key block, where index 6 of that set is ♮7 — the one note ♭VII
   * contradicts — while the minor family this file actually writes is
   * i–VI–III–VII, whose ♭7 the second set already carries at 4. And its own
   * witness argues the other way: `sunshine`'s header gives its two cadences as
   * `IVmaj7 → I` and `bVII → I`, and 4̂ is in both. Three sets that survive their
   * own argument beat four that do not.
   *
   * **This is the key that separates pop from finnfolk**, which sits 0.116 away
   * on a fingerprint of duration classes, interval classes, density and turn
   * rate, against a 0.382 mean across all 171 genre pairs. Both are sung,
   * diatonic, mid-density music in even metres. The two already differ by half
   * again on derived ornament appetite — 0.76 against 1.18 at the medians — and
   * are still that close, so nothing derivation carries will do it. What does is
   * that the two repertoires argue about different note sets: finnfolk's whole
   * `scaleForChord` ladder is a choice among *sevens* that stops before the
   * leading tone, and this genre's own case above is a *five*. Dropping 4̂ and 7̂
   * turns two step-pairs into a minor third, so a pentatonic hook and a modal
   * strain with the same contour do not have the same interval histogram.
   *
   * **The nearer neighbour is iskelmä, and no fingerprint says so.** That is the
   * genre this file's header spends forty lines conceding overlap with, and the
   * collision was here rather than in any derived number: `iskelmapop` in
   * `voice.ts` declares four subsets, and what stood above was the same four in
   * the same order, 5/4/3/2 against its 4/3/3/2 — normalised, a rounding error
   * apart. Three sets led by the pentatonic is a different table. The other
   * separation is free and is in the ops below: left derived, `ornament` puts
   * `synthpop` at 0.64 where `iskelmapop` declares 1.2, which is what "not this
   * genre's `synthpop`" has to mean if it means anything.
   *
   * ## The ops, which is what happens to a figure when the chorus arrives
   *
   * Two of the three are operators derivation never touches, so they flatten no
   * per-style spread at all.
   *
   *  - **`expand` up.** "Same contour, wider intervals" is what a chorus here
   *    does to a verse figure, and `opsFor`'s `lift` intent is where it lives —
   *    two of that intent's three options are keyed on it, against a plain
   *    transpose. Derivation reads `melody.leap` and lands every style between
   *    1.00 and 1.28: a narrow spread read off the wrong number, how leapy the
   *    line is rather than whether the second time round is bigger.
   *  - **`invert` down.** Nobody sings a pop hook upside down. It is the
   *    heaviest option in the `answer` intent at 3 of 7, and the answer in this
   *    repertoire is the same figure a step lower or the same figure ending
   *    differently — both already in that draw.
   *  - **`reharmonise` down**, on the header's own admission about the last era:
   *    "the tune is a fixed pitch set dragged across a moving loop". A four-chord
   *    turnaround plays one hook over four harmonies and the hook does not
   *    refit, which is also why the pentatonic sets above work at all. The
   *    ceiling is one option in one intent, so this is a statement more than a
   *    lever, and it is written down for the reader rather than for the draw.
   *
   * `ornament` is deliberately left alone and it is the one jazz had to invert.
   * The operator writes a diatonic neighbour figure, which is exactly what
   * `torch` at 0.3 and `tropical` at 0.05 are disagreeing about, so derivation
   * means what it says here — the appetite comes out 0.55 to 1.30 with the
   * median at 0.76. `sequence` and `transpose` likewise, and the number to name
   * is the field rather than the operator: `melody.sequence` runs 0.34 to 0.76
   * across the file, which lands the two operators at 1.18–2.02 and 1.11–1.61.
   * The tables are right about which styles restate.
   *
   * **The canvas stays at two bars, and it was never open.** `derivedVoice`
   * hands four bars to any style under 1.7 onsets a bar and the floor here is
   * `dreampop` at 1.93, so nothing in this genre takes it — a genre-level four
   * would be a claim about twenty-three styles made for one. That one is 0.23
   * from flipping, which is where wave 2 should look and not this table.
   */
  voice: {
    archetypes: [
      ['arch-hook', 5],
      ['descending-sequence', 1.2],
      ['long-note', 1],
    ],
    subsets: [
      [[0, 1, 2, 4, 5], 5],          // 1 2 3 5 6 — the major pentatonic
      // 1 3 4 5 7 — pentatonic in minor, ♯7 under `functional`; in major the
      // tonic triad plus the two notes of the tritone that resolves into it
      [[0, 2, 3, 4, 6], 4],
      [[0, 1, 2, 3, 4, 5, 6], 3],    // the whole scale, for the seven that cadence
    ],
    ops: { expand: 1.6, reharmonise: 0.4, invert: 0.3 },
  },

  /**
   * The scale rule: follow the key, and let seven styles raise the seventh.
   *
   * Seven rather than the six this line used to say — `scaleForChord: functional`
   * is set by `girlgroup`, `brill`, `baroque`, `ballad`, `torch`, `chamber` and
   * `newromantic`, which is the list `styles.ts` gives in full.
   *
   * Two lines, and the second one is the whole of what this genre states at the
   * genre level. Natural minor throughout and plain major in major — which is
   * iskelmä's rule with its one substitution removed, and is therefore also
   * synth's rule without the borrowed-chord search.
   *
   * **The borrowed-chord search is deliberately not here**, and that is the one
   * place this differs from synth in a way worth stating. Synth bends the tonic
   * scale outward to admit whatever chord arrives — `bVII` in major fetches
   * mixolydian, `bII` in minor fetches phrygian — because that music has very few
   * chords and each one is an event. Pop has a great many chords and they go past
   * quickly: a borrowed `iv` in the fourth bar of a ballad verse is a *colour*,
   * lasting one bar, and re-orienting the melody's whole scale onto it would make
   * the tune follow the chord, which is jazz's answer and not this one's. So an
   * out-of-scale chord tone here is left as what it is — a note in the harmony
   * that the tune passes over or does not — and the line stays in the key.
   *
   * `Style.scaleForChord` carries the rest. `functional` in `styles.ts` is this
   * rule plus the harmonic-minor substitution, named by seven styles, and its own
   * header both argues them and states the invariant that keeps the two groups
   * apart.
   */
  scaleForChord: (tonic, mode) => makeScale(tonic, mode === 'minor' ? 'minor' : 'major'),

  /**
   * A medium plate and a dotted-eighth echo.
   *
   * The delay length is the convention ambient and synth both state and it
   * arrives here through the eighties guitar rather than through the tape unit:
   * three sixteenths against a four-beat bar never lands where the beat does. The
   * feedback is low — an echo that repeats twice is a production decision and one
   * that repeats six times is a second instrument, which is the other genres'
   * business rather than this one's.
   *
   * `reverbSize` at 0.55 is the genre-wide floor and the eras move it a long way
   * in both directions: 1965 is a chamber the whole band shares and 1985 is a
   * plate on the snare and nothing else.
   */
  space: {
    reverbSize: 0.55,
    delayBeats: 0.375,
    delayFeedback: 0.24,
  },

  /**
   * Standing production notes, refined by each era and overridden by five styles.
   *
   * Five, not the four this line used to name: `jangle` declares a table too. See
   * the header, which counts them.
   *
   * Deliberately thin. `Style.effects` merges over the era's, which merges over
   * this, and the argument in that docstring is that a genre says what is true of
   * the music *whatever decade it claims to be from* — which for this genre is
   * almost nothing, because the decade is the subject. What survives at this
   * level is the bass staying dry, which is true in every one of these sixty
   * years for the reason it is true everywhere: reverb on a sustained low tone
   * arrives while the note is still sounding and the two beat against each other.
   *
   * And the vocal being the wettest layer, which is this genre's own. Every era
   * below puts more reverb on the voice than on the instruments around it, and
   * that is not a taste — it is what makes a close-miked, heavily compressed
   * signal sit in a picture at all. A dry pop vocal sounds like a voicemail.
   */
  effects: {
    bass: { reverb: 0.03 },
    vocal: { reverb: 0.34 },
  },

  /**
   * The theatre, the four wardrobes and the variety bill. See `staging.ts`, which
   * also records that the room this genre actually plays is a television studio
   * and that there is not one.
   */
  staging: STAGING,
};
