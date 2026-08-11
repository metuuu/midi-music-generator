/**
 * Indian classical, filmī and fusion — and the genre with the deepest mismatch
 * against this engine of any so far.
 *
 * `Genre` exists because of one question: where does the melody get its notes?
 * There were three answers before this file. Iskelmä follows the *key*, jazz
 * follows the *chord*, ambient follows the *drone* — one scale on the tonic,
 * bent to absorb whatever passes underneath. This is a fourth, and it is the
 * strictest of the four: the melody follows the **rāga**, there is one rāga for
 * the whole piece, and the line never leaves it. `scaleForChord` below does not
 * consult the chord at all.
 *
 * ## The honest problem, which is worth stating before anything else
 *
 * **This music has no harmony.** Not "simple harmony", not "static harmony" —
 * none. There is a drone, which is the tonic and the fifth sounded continuously
 * by an instrument nobody is playing in any musical sense, and everything else
 * is one melodic line and one rhythmic cycle against it. There is no chord
 * anywhere. There is no word for chord. The vertical dimension that the whole
 * of Western practice is organised around, and that a large fraction of this
 * codebase is organised around, is simply not a dimension this music has.
 *
 * And `Song` has a harmony track. Bars carry chords, `generateComp` voices them,
 * `generateBass` outlines them, and the rule table in `core/rules.ts` asks of
 * nearly every note *what does this do to the chord underneath it*. None of that
 * can be switched off, and none of it should be — the IR is shared and a genre
 * does not get to redefine it.
 *
 * So the job is to make the harmony track **harmless**, and there are four
 * places it is done. Ambient solved the same problem one step less severely and
 * its comments say how; this goes further in every direction:
 *
 *  1. **The progressions are one chord.** Nearly every style states `Isus4` or
 *     `Isus2` and holds it for the length of the piece — Sa–Ma–Pa and Sa–Re–Pa,
 *     which are the two tunings a tanpura's fourth string actually takes. No
 *     third in either, because a drone that stated a third would be a chord.
 *     The exceptions are the four filmī styles, and that is a fact about filmī
 *     rather than a compromise: a Bombay film song of 1958 has a string section
 *     playing real chords under a real rāga, and it is the one place in this
 *     genre where the two systems were made to coexist on purpose.
 *  2. **`sustain` on the bass and on the comp.** `BassPattern.sustain`'s own
 *     docstring makes the argument — a note re-struck on every downbeat is a
 *     pulse and a note held through is a drone — and here it is more than a
 *     texture decision. A tanpura is not played *to* the music; the player sits
 *     behind everybody and cycles four strings for forty minutes with no
 *     reference to what is happening. Anything that re-attacks in time is a
 *     part, and a part is a second musician.
 *  3. **`scaleForChord` ignores its chord.** Below.
 *  4. **The rule table is told that the vertical questions do not apply.** The
 *     overrides are the longest in the project and every one of them is the
 *     same sentence in a different place: *the rule is asking what this note
 *     does to the chord, and there is no chord.*
 *
 * ## And the other honest problem: twelve notes
 *
 * The scope decision is equal temperament, and `styles.ts` sets out at length
 * what that costs — no shrutis, so no distinction between two komal gandhars a
 * comma apart; and, more importantly, **a rāga is not a scale.** It is an
 * ascent, a descent, a vādī, a set of characteristic phrases and a time of day,
 * and what is modelled here is the pitch set alone. Three of the rāgas the brief
 * asked for cannot be built at all, for a reason that is in `core/scale.ts`
 * rather than here. All of that is in the rāga block at the top of `styles.ts`,
 * which is the first thing to read.
 */

import type { Chord } from '../../core/chord.js';
import type { Pc } from '../../core/pitch.js';
import { makeScale, type Mode, type Scale } from '../../core/scale.js';
import { RULE_DISABLED } from '../../core/rules.js';
import type { Genre, FormStep } from '../types.js';
import { STYLES } from './styles.js';
import { ERAS } from './eras.js';
import { MOODS } from './moods.js';
import { VOCALS } from './vocals.js';
import { generateTitle } from './titles.js';
import { STAGING } from './staging.js';

/**
 * The shape of a performance, in this engine's section kinds.
 *
 * A Hindustani recital runs ālāp → jor → jhālā → gat, and a Carnatic one runs
 * ālāpana → tānam → kṛti → svara kalpana, and both of those are *whole
 * concerts* built out of what this catalogue calls styles. What a single
 * generated track is, therefore, is one item from that programme — and the
 * section kinds map onto the inside of an item better than they have any right
 * to:
 *
 *   intro    the short ālāp before the composition, on this rāga, no drum
 *   verse    the **sthāyī** — the first strain, sitting in the lower and middle
 *            octave, and the one carrying the mukhḍā
 *   chorus   the **antarā** — the second strain, which climbs to the upper Sa
 *            and is where a bandish gets its lift from
 *   solo     the improvisation, taken between statements of the composition
 *   outro    the last statement, landing on sam
 *
 * The sthāyī/antarā reading is the one worth arguing for, because it is not an
 * analogy. A bandish genuinely has two strains, the second genuinely goes up an
 * octave, and the arranger's register plan is what makes `chorus` do that here
 * without being told. In the South the same shape is pallavi and anupallavi.
 *
 * **Bar counts are small on purpose.** A cycle of teentāl at 100 BPM is nearly
 * four seconds and a cycle of vilambit ektāl is nine, so an eight-bar section in
 * this genre is between half a minute and a minute and a quarter of music. The
 * unit here is four to eight bars where every other genre's is eight to sixteen,
 * and the form fitter in `generate/song.ts` adds or trims from there.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  // The classical shape: a short exposition, the composition, improvisation,
  // the composition again.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 6 }, { kind: 'chorus', bars: 6 },
    { kind: 'solo', bars: 6 },
    { kind: 'verse', bars: 6 },
    { kind: 'outro', bars: 4 },
  ], 5],
  // Two improvisations against one statement of the composition — which is the
  // real proportion, and the one a rotation cannot afford much more of.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 },
    { kind: 'solo', bars: 8 }, { kind: 'solo', bars: 8 },
    { kind: 'verse', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 5],
  // The one with the antarā doing the work: up to the upper Sa twice, with the
  // improvisation hung between them.
  [[
    { kind: 'intro', bars: 2 },
    { kind: 'verse', bars: 6 }, { kind: 'chorus', bars: 6 },
    { kind: 'solo', bars: 6 },
    { kind: 'chorus', bars: 6 }, { kind: 'verse', bars: 6 },
    { kind: 'outro', bars: 2 },
  ], 4],
  // The song shape, with no exposition and no improvisation: a bhajan, a
  // ghazal, a film number. Two strains, alternating, and out.
  [[
    { kind: 'intro', bars: 2 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 2 },
  ], 4],
];

export const indian: Genre = {
  id: 'indian',
  label: 'Indian',
  description: 'Hindustani and Carnatic classical, filmī playback and 1970s fusion — one rāga, one tāla, and a drone that never moves.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,

  /**
   * Where Sa is.
   *
   * Every other genre's key pool is about instruments: jazz lives in flats
   * because the tenor and the trumpet transpose, ambient chooses for the
   * fundamental's register. This one is about **the soloist's own pitch**, which
   * is the only thing that decides it — a singer's Sa is wherever their voice
   * sits and the tanpura is retuned to them before every concert, so there is no
   * such thing as a key this music is written in.
   *
   * What weights the pool is the instruments that *cannot* be retuned far. A
   * sitar is usually at C♯ and a sarod at C; a bansuri is a fixed tube and the
   * commonest ones are at C, D and E; a tabla's smaller drum is tuned to the Sa
   * and a set only covers a few semitones. So C♯ and D lead, C is close behind,
   * and the pool thins out fast either side. Both modes take the same list,
   * which follows from the whole design — the mode chooses which of a style's
   * two rāgas is in force, not which key it is in.
   */
  keys: {
    major: [[1, 6], [2, 6], [0, 5], [3, 3], [7, 3], [5, 2], [10, 2]],
    minor: [[1, 6], [2, 6], [0, 5], [3, 3], [7, 3], [5, 2], [10, 2]],
  },

  /**
   * `fade`, and it was `button` first, which is the more interesting half.
   *
   * A performance ends with a **tihai**: a phrase played three times, spaced so
   * the third repetition lands its last stroke exactly on sam, with the soloist
   * and the drummer arriving on it together. That is a `button` by the
   * definition in `EndingStyle` — everybody hits the downbeat — and it was the
   * obvious pick. Two things took it back out.
   *
   * **What a button used to add was a cymbal and a kick**, hard-coded in the
   * ending pass, and neither instrument exists in this music. A tihai delivered
   * by a crash is not a landing rendered imperfectly, it is a different band
   * walking on for one beat.
   *
   * **That reason has since evaporated and is kept because the second one has
   * not.** `landEnding` resolves its strokes through `seamOrchestration` now,
   * the same `drumStations` read the shot and the fill take, so a button on
   * these tables lands on a doum: measured over every style in this genre at
   * eight seeds, `land` and `weight` both come back `lp` **192 times out of
   * 192**, and the remaining 32 draws have no drums at all. The literal that
   * made this paragraph true was the fourth and last site of the fault
   * `docs/engine-gaps.md` §2.1 tracks, and it is gone.
   *
   * The ending stays `fade` regardless, on the argument below, which never
   * depended on the delivery.
   *
   * **And the tanpura does not stop.** This is the part that makes `fade` right
   * rather than merely less wrong: the item ends, the soloist and the drum
   * land, and the drone is still sounding — the applause happens over it,
   * because nobody switches a tanpura off. `EndingStyle` describes `fade` as
   * *the chord that is already sounding is simply held and let go, with nothing
   * struck on top of it*, which is a more exact description of the end of a
   * khyāl than anybody writing it had in mind.
   *
   * The button also had a measurable cost. Its last pass snaps every struck
   * note onto the final chord's tones — and this genre's final chord has
   * **three** pitch classes, one of which the drone is already doubling. Two
   * melodic parts snapped into that produce a unison or an octave far more often
   * than in a genre ending on a ninth chord: five collisions in two hundred
   * songs, against one for every other cause combined, and `npm run genres`
   * asserts the answer never doubles the tune by accident. A three-note drone is
   * exactly the thing this genre is *for*, so the ending was the thing that had
   * to give.
   *
   * `countIn: false`, and the reason is the same fact from the other end.
   * Nothing here is counted in, ever. The soloist begins alone and the tabla
   * joins when it joins, which may be several minutes later; the tāla is
   * established *by the theka itself* rather than announced before it. Four
   * clicks in front of an ālāp would be four clicks in front of a piece that has
   * no beat yet.
   */
  ending: 'fade',
  countIn: false,

  /**
   * No modulation, prepared or otherwise.
   *
   * `keyChangeChance` is 0 in all four eras, so nothing ever asks — and this is
   * set anyway, because the two say different things. The era tables say this
   * genre does not happen to change key; this says that if anything ever made it,
   * announcing the new key with its dominant would be doubly wrong. There is no
   * dominant in this music to announce anything with, and there is no new key to
   * go to: a rāga is not a key that could be left and returned to, it is the
   * piece.
   */
  preparedModulation: false,

  /**
   * `light`, which is one step below ambient's and two below the strictest thing
   * here, and the argument is about *what the rules are for*.
   *
   * The table in `core/rules.ts` is a table of faults, and it is a good one — a
   * seventh leap is unplayable in any idiom on earth. But most of its entries are
   * about the relationship between a note and a chord, and this music has no
   * chord; and the entries that are not are calibrated against a repertoire whose
   * melodies are made of leaps and cadences. A rāga phrase is made of steps and
   * ornaments, so it passes the melodic rules by construction and gains nothing
   * from being policed harder.
   *
   * The two unmetred styles override this upward. `alap` and `alapana` set
   * `strict` because a note that lasts eight seconds is exposed in a way nothing
   * in a fast piece is, and the smoothness rules are exactly what a slow line
   * needs. The relaxations below mean `strict` there adds the leap ceiling and
   * subtracts nothing the rāga wants.
   */
  defaultStrictness: 'light',

  /**
   * `loose`: the composition returns, the improvisation does not.
   *
   * This is the same claim jazz makes with the same word and it is arrived at
   * from a different direction. A jazz head is a tune you leave; a bandish is a
   * tune you keep landing on, and the entire architecture of a khyāl is that
   * every improvised passage is aimed at putting the mukhḍā back on sam. So the
   * *harmony* — such as it is — and the composition are fixed, and the material
   * between them is never played twice.
   *
   * Six styles override it. `bhajan` and `bhangra` take `earworm` because both
   * are four-bar tunes meant to be sung back by people who did not rehearse;
   * `svara`, `jugalbandi`, `fusiongat` and `alap` take `through`, because
   * repeating anything is the one thing each of those four is defined by not
   * doing.
   */
  defaultHook: 'loose',

  /**
   * The band does not react to the soloist, and that is not a lack of
   * sensitivity.
   *
   * `full` is jazz's opposite and it is correct here for a reason a jazz reader
   * will find strange: the accompaniment in this music is a *drone and a cycle*,
   * and both are supposed to be invariant. A tanpura that got quieter under an
   * improvisation would have stopped being a reference pitch; a tabla that
   * thinned out would have stopped keeping the tāla, which is what the soloist is
   * counting against. The reaction that does happen is the drummer's, and it
   * happens by *taking the bar* rather than by getting quieter in it — see
   * `tradeFours` below, which is no longer zero. A tani and a sawāl-jawāb are
   * both `trade`, which is the band stopping dead and coming back on a downbeat;
   * that is a different gesture from an arrangement thinning, and it is the only
   * one this music makes.
   */
  soloBacking: 'full',

  /**
   * Improvisation, which in this genre is not a section of the piece but very
   * nearly the whole of it.
   *
   * Every other genre here treats a solo as an episode inside a composition. In
   * Hindustani and Carnatic music the composition is the episode: a forty-minute
   * khyāl contains perhaps ninety seconds of bandish, restated, with everything
   * else invented on the night. So this profile is doing more work than jazz's,
   * and four of its numbers are at the extreme end of their range for reasons
   * that are specific rather than enthusiastic:
   *
   *  - **`chromatic: 0`, and it is the most important number here.** A note
   *    outside the scale is a colour in jazz and a passing tone in iskelmä. Here
   *    it is *a different rāga*. There is no such thing as an out-of-rāga note
   *    that is merely spicy; playing one is the single error a performance can
   *    make that everybody in the hall will notice. Zero, and it is the only
   *    zero in this table that is a prohibition rather than a preference.
   *  - **`develop: 0.88`, the highest in the project.** Rāga improvisation has a
   *    name for its method — *baḍhat*, the unfolding — and it is exactly this:
   *    state a phrase, extend it by one swara, restate it, extend it again,
   *    climbing the octave over minutes. A solo here that invented a fresh idea
   *    every eight bars would not be a weak solo, it would be a different
   *    practice.
   *  - **`climb: 6`, double jazz's.** Same reason. The improvisation's shape *is*
   *    a register climb: it starts in the lower tetrachord and ends on the upper
   *    Sa, and the piece is over when it gets there.
   *  - **`ornament: 0.55`, where jazz has zero.** A bebop player's decoration is
   *    a chromatic approach note, which this genre has just ruled out; what is
   *    left is the ornament proper — kan, murki, gamak — which is where all of
   *    this music's surface detail lives.
   *
   * `quoteMotto: 0.7` and `liftIntoReturn: 0.55` are the two halves of the
   * mukhḍā. Every improvised passage aims at the composition's first phrase
   * landing on sam, so the top of a chorus quoting it and the end of one running
   * up into it are not gestures the soloist sometimes makes — they are the frame
   * the whole passage is built inside. This is as close as the engine gets, and
   * it is not very close: what it cannot express is that the *arrival* is
   * rhythmically calculated backwards from sam, which is the thing an audience
   * applauds.
   *
   * ## The drummer is back in the rotation
   *
   * `drums` was absent and `tradeFours` was 0, and both of those deleted real and
   * central things. A *tani āvartanam* is a listed item on a Carnatic programme —
   * the mridangam plays alone for ten minutes while everybody else puts their
   * instrument down — and *sawāl-jawāb*, the soloist and the tabla trading
   * phrases that shorten until they are swapping a cycle each, is one of the two
   * or three moments a live audience comes for. `tradeFours` describes the second
   * of those almost exactly.
   *
   * They were off because `generateDrumSolo` was a **kit** generator that could
   * not be told otherwise: a figure stated on the snare, answered on three toms,
   * punctuated with the kick, a hi-hat underneath and a crash on the end — five
   * literals in a genre whose entire percussion vocabulary is three strokes of
   * one drum. That is fixed. The function now reads the style's own drum table
   * through `drumStations`, the same three-tier `kit`/`hand`/`either` split
   * casting uses, and every table in `styles.ts` is `lp`/`mp`/`hp` with a `cp`
   * in seven of them — all twenty-four that have a drummer read as **hand**, none
   * as kit. So the chorus comes out orchestrated on the drum that is actually in
   * the room: **nā states the figure, tin answers and closes the phrase, ge
   * carries the weight under it and lands the band back in.** Measured the way
   * `npm run genres` measures arabic's — voices in the section, an `lp` within a
   * beat of the downbeat the band returns on — a tani here is **three voices,
   * every time, and lands on a doum 126 times out of 126.** No crash on it,
   * because a skin does not ring.
   *
   * **One kit stroke used to get into the chorus, and it was not the solo's.**
   * In the five styles with fills, the seam *before* a chorus landed a `cr` or
   * an `oh` on its first downbeat, because `generate/fills.ts` wrote its landing
   * cymbal from a literal. That was loud in a `drumStations` read — a chorus of
   * `{cr lp mp hp}` filed as a *kit* chorus, 31 of 157 across 400 songs — and it
   * is the half of the hand-drum work `docs/engine-gaps.md` §2.1 had open.
   *
   * **It is closed.** `landing()` takes a `SeamOrchestration` now and answers
   * `lp` on a skin, and the same 400-song probe run again says: 168 choruses,
   * **0 filed as a kit chorus**, three voices in every one of them, and the band
   * landed back in on a doum **168 times out of 168**. The voices on the
   * returning downbeat across all of them are `lp` 323, `mp` 85, `hp` 18 — three
   * strokes of one drum, and nothing that rings. Nought kit strokes anywhere in
   * the 400 songs, which is the number the `transitions` note below re-measures
   * from the other end.
   *
   * **`['drums', 2]`, which puts the drummer above the harmonium and below the
   * sārangī**, and that ordering is the claim rather than the number. The comp in
   * this music is a reference pitch and takes a chorus almost never; the counter
   * is a violin or a sārangī shadowing the line and is a soloist in its own
   * right; the tabla is neither — it is the other half of the performance, which
   * is the same fact `mix.drums` below is set on. Two of fourteen.
   *
   * **Where a tani can land is decided by the form rather than by this number**,
   * and the three placements that most needed preventing are already prevented
   * by tables that were here before. `planSolos` will not let the kit open the
   * blowing — a drum chorus before anyone has stated anything is a solo with
   * nothing to be a solo *from* — so the drummer is never the first voice heard
   * improvising. The song shape above, which is the bhajan and the ghazal and
   * the film number, has no `solo` section at all: **22.2% of songs stop for
   * nothing**, measured over 1344. And the four drumless styles — `alap`, `jor`,
   * `alapana`, `tanam`, the expositions that happen before the drummer joins —
   * declare `excludeLayers: ['drums']`, so an ālāp with no tabla in it cannot be
   * handed a tabla solo; measured, the four of them take none between them.
   *
   * What that leaves is more improvisation than the form table suggests, and it
   * is worth writing down because it is the number that decides how often this
   * happens. `buildForm` grows the blowing to reach the target duration and will
   * stack up to `MAX_SOLOS` **consecutive** choruses; this genre's sections are
   * four to eight bars where every other genre's are eight to sixteen, so it
   * reaches that ceiling often — 62% of songs come out with four. The drummer
   * therefore gets up to three chances at the weight above rather than one.
   * Measured over 1344 songs, one per style per era: the drummer takes **506 of
   * 3794 choruses, 13.3%**, which is the 2-in-14 the table asks for; **34.1% of
   * songs contain a drum chorus**, 12.8% trade, and 4.5% do both. A third of the
   * items on this programme having a passage where the tabla plays alone is
   * close to right for a repertoire where the drummer is a co-performer, and it
   * is the number to revisit first if it turns out not to be.
   *
   * **What cannot be said is per-style.** `SoloProfile` hangs off `Genre`, so
   * this weight is one number for twenty-eight styles: a `kriti` and a `cabaret`
   * draw the drummer at the same rate, and a film club number occasionally stops
   * for a tabla chorus that no film club number ever stopped for. The only
   * style-level lever is `excludeLayers`, which does not mean *this style does not
   * hand the drummer a chorus*, it means *this style has no drummer* — and
   * spending it on `filmi` would delete the dholak to prevent a solo. A rotation
   * on `Style`, merged over the genre's the way `transitions` already is, is the
   * missing field; the weight above is chosen low partly because it is being
   * asked to be right for the whole catalogue at once.
   *
   * **What the programme prints was the other thing that could not be said, and
   * it can be said now.** `Section.solo.instrument` was the literal
   * `'drum kit'`, so every tani generated here was announced on the showbill as
   * a drum kit — the one number on the bill where the object is the point, and
   * the object the bill got wrong. It is resolved from the style's own table
   * and the bank now, and measured over this genre's catalogue every drum solo
   * prints `mridangam`. See its note in `core/types.ts`, and §2.3 of
   * `docs/engine-gaps.md`, which is closed.
   *
   * One residue, and it belongs to the machine rather than to the drum: where
   * an era draws a programmed source there is no tabla player on the stage at
   * all, and the bill names the box — `RolandTR808+mridangam` — because that is
   * the only object in the room. Which is right, and is worth reading twice
   * before anyone decides it is a bug.
   *
   * `tradeFours: 0.5` — as often as not, below jazz's 0.6 and clearly above
   * arabic's 0.3. The exchange is more central here than in a takht and less
   * ubiquitous than in a bop set: sawāl-jawāb is the thing the audience is
   * waiting for, and a performance where it never happens is still a
   * performance. Half the songs draw it and 12.8% get it, because the draw is
   * the easy half: trading also needs two choruses and a last one of at least
   * eight bars, and this genre's bar counts are small enough that most last
   * choruses are six.
   * It lands on the last chorus and takes the kit out of the candidates there,
   * so that chorus is either traded or the drummer's and never both — an earlier
   * one can still be a tani, and 4.5% of songs get one of each.
   */
  solo: {
    rotation: [['melody', 8], ['counter', 3], ['comp', 1], ['drums', 2]],
    tradeFours: 0.5,
    quoteMotto: 0.7,
    backing: {
      melody: 'full', counter: 'full', comp: 'full',
      /**
       * The one place `soloBacking: 'full'` above is wrong, and it is wrong by
       * definition: a tani is everybody else putting their instrument down. The
       * field is a statement rather than a lever — `planSolos` forces `trade` for
       * a drum chorus whatever this says — and it is written because a table that
       * left it out would read as *the band plays through the drum solo*, which
       * is the one thing a tani is not.
       */
      drums: 'trade',
    },
    vocabulary: {
      // A note every two mātrās at rest, since one mātrā is an eighth. A taan
      // runs at four to eight times that, which is what `doubleTime` is for.
      gait: 0.5,
      doubleTime: 0.42,
      // Nothing is accented off the beat. The accent in this music is sam, and
      // sam is a downbeat.
      offbeatAccent: 0.05,
      // The kan swara — a grace note lifted from the swara above or below — is
      // real and is not an enclosure: it comes from inside the rāga, and an
      // enclosure is chromatic by construction. Low, and non-zero only because
      // the two gestures overlap where the neighbour happens to be in the scale.
      enclosure: 0.12,
      chromatic: 0,
      ornament: 0.55,
      develop: 0.88,
      // Low. A phrase that arrived a beat late would have missed sam, and
      // missing sam is the error the whole form is organised to avoid.
      displace: 0.12,
      space: 0.16,
      climb: 6,
      // The improvisation is bound to the bandish and keeps returning to it,
      // which is neither jazz's zero nor iskelmä's ornamented tune. A third of
      // the material is the composition, seen from a different angle.
      paraphrase: 0.35,
      liftIntoReturn: 0.55,
    },
  },

  /**
   * **No genre-wide transition palette**, and the absence is still a decision
   * rather than an omission — `Genre.transitions` says that absent means
   * `DEFAULT_TRANSITIONS` *and means no draw is made*. It is per style here
   * because the eleven styles that refuse a gesture refuse it for eleven
   * different reasons, and a genre-level table would have to be argued down
   * eleven times instead of up seventeen.
   *
   * The gesture this genre wanted is the **tihai**: a figure spaced so its last
   * stroke lands on sam, with the whole ensemble arriving together. That is a
   * `shot` — and `shotFigures` resolves the figure for free here, because a bar
   * with no authored table falls back to its group heads and in this genre the
   * group heads *are the vibhāgs*, which is why no `shots` tables are authored
   * anywhere in `styles.ts`.
   *
   * ## The delivery was wrong for three years and is not wrong now
   *
   * This comment used to say the palette could only be declared on five styles,
   * because `applyShot` wrote its figure as `bd` + `sd` with a `cr` on the
   * landing — three voices that do not exist in this music. That was true when
   * it was written. It is false now: the function is `playShot`, it resolves
   * `SeamOrchestration` from `song.drums.events` through `drumStations`, and on
   * a hand table the shot voice is `['lp']` and the survives list is empty.
   *
   * **Measured before a line of this was changed**, because the document that
   * recorded the fix is not the source and this project has been caught
   * believing it before. Every one of the twenty-eight styles, palette forced to
   * a single kind, sixty seeds each:
   *
   *  - `shot` — 3 246 shot bars, **0 kit strokes anywhere in any of them**.
   *  - `fill` — every seam a fill in all twenty-eight, **0 kit strokes**. The
   *    strokes that do arrive are `lp mp hp`, plus `cp` where the theka has a
   *    clap in it and `perc` from the percussionist's own stand — all hand or
   *    `either` tier, none of which can conscript a kit.
   *  - `break` — 1 912 break bars, **0 kit strokes**, and **0 of them empty**,
   *    which is the number `breakCarrier: 'pad'` was set for and which has not
   *    moved.
   *
   * A shot bar contains exactly `{lp}` — the doum, three or four of them,
   * nothing else. Over 120 seeds: bandish 121 pure-doum bars out of 137,
   * jugalbandī 323 of 333, filmī 307 of 319. **The bars that are not pure are
   * not impure**: they are the ones where the drummer already had that bar as a
   * tani āvartanam block, and `playShot` reads `solo.blocks.drumBars` and
   * returns rather than write a band figure over a chorus. And **the landing is
   * intact** — 100% of shot bars are followed by a stroke on the arriving
   * downbeat. The figure lands on sam, which is the only thing about a tihai
   * that is not negotiable.
   *
   * ## Which twelve of the twenty-three, and why not the other eleven
   *
   * The adoption is one field per style and the sort is a musical judgement, so
   * it is made at the entries rather than here; each of the twenty-three says
   * its own sentence in `styles.ts`. What the sort turns on is one question —
   * **does this form land a figure with the whole ensemble at a structural
   * join** — and the four shapes of *no* are worth naming together, because
   * three of them are about the music and one is about the mechanism:
   *
   *  - **There is no cycle to land on.** `alap`, `jor`, `alapana` and `tanam`
   *    are unmetred and have no drum. A shot there is not a no-op — the band
   *    half of `playShot` still hits the pitched layers, and it moved the tracks
   *    in 14, 28, 23 and 32 of 40 songs when it was tried — so the refusal is
   *    load-bearing rather than tidy.
   *  - **The arrival belongs to somebody who is not the ensemble.** `ghazal`
   *    gives it to the radīf, `padam` to the dancer, `thumri` to the bend inside
   *    the phrase.
   *  - **The form exists in order not to display.** `bhajan` is sung back by a
   *    room that has not rehearsed and `dhun` is the item everybody relaxes to.
   *    A tihai is arithmetic performed at an audience.
   *  - **And the one mechanical refusal left**, which is the only place this
   *    genre still wants something the engine does not do: `dhrupad` and
   *    `vilambit` are on ektāl, whose twelve mātrās group 2+2+2+2+2+2, so
   *    `metreHeads` returns **six** slots — `[0,4,8,12,16,20]`. `bandHeads` in
   *    the same file defines a shot as two to four onsets and says why: more
   *    than that is the band playing rather than the band hitting something.
   *    Six evenly spaced strokes across a chautāl is the pakhāwaj marking the
   *    vibhāgs it is already marking. A `shots` literal would fix it — the field
   *    exists and takes a table — but the honest figure to put in one is a real
   *    chautāl tihai and neither of us has measured what that should be, so it
   *    stays unwritten rather than invented.
   *
   * **`elide` is absent from all seventeen, and that absence is the strongest
   * statement here.** An elide arrives an eighth early. Sam is not negotiable —
   * the whole architecture of a tāla is that everybody knows where beat one is
   * and lands on it — and a section that started before it would not be an
   * anticipation, it would be a mistake with a name.
   *
   * **And `drumFills: false` stays on every style that is not a film number**,
   * which reads like a leftover and is the opposite. It was set when a fill
   * meant a tom roll; the fill vocabulary was generalised in the same wave as
   * the shot and a fill on a hand table is hand strokes now. It stays because of
   * what it says about this music rather than about the engine: **the gesture a
   * tabla player makes at a seam is a figure landed on sam, not a run into it.**
   * The theka does not thin out approaching a join. So `fill` in these palettes
   * is the weight on *nothing happening*, which is the correct third option and
   * the commonest thing that happens at a seam in a recital.
   *
   * **`break` is in all seventeen, and the way it came back is the useful
   * part.** The tabla dropping out for a cycle is one of the commonest things in
   * this music and means something specific — the soloist is going somewhere the
   * cycle cannot follow. It was in the original five palettes and came out again,
   * because `applyBreak` used to pick the voice that carries the bar by asking
   * whether the **melody** covered a third of it, falling back to the answering
   * line and then the bass; the melody is the one part `--hook` is allowed to
   * change, so a break happened at `through` and did not at `earworm` on the same
   * seed, and the kit differed between them. `npm run genres` asserts the
   * opposite in as many words: *the kit is deaf to the tune.* Three seeds in
   * sixty tripped it, and dropping the kind was the only fix available from
   * inside a genre folder.
   *
   * **The carrier is named now rather than searched for**, and a name in a style
   * table is a literal — written once, read rather than drawn, identical at all
   * five hook levels, with nothing in it for the tune to move. Nothing pitched
   * was ever hook-invariant, which is why the fix could not be *look harder at
   * the bar*; it had to be *do not read a note at all*. So the kind is safe here
   * for the same reason `shot` always was.
   *
   * And the name this genre gives is not the default. See `breakCarrier` in
   * `styles.ts`, where it is set on all twenty-eight: the bass in this music is
   * a tanpura that stated its six notes in the section's first bar and has been
   * ringing ever since, so handing it the seam hands the seam to nobody — 9 of
   * 622 drawn breaks came out with the bar empty, which was nine of the ten the
   * whole catalogue produced. The śruti box is what is still sounding, `pad` is
   * where it lives, and under that name the count is 0.
   */

  /**
   * The devices, and this genre disagrees with the pool more than any other.
   *
   * `harmony` is **zero**, and it is the only hard zero in the table. Two
   * players in thirds is the single most Western thing an arranger can do and
   * there is no thirds-and-sixths anywhere in this music at all — it is the
   * absence that a listener notices first when a film arranger puts it in.
   *
   * `unison` is weighted highest, and it is not an effect here, it is the
   * accompaniment. A sārangī shadows a khyāl singer note for note a fraction
   * behind; a Carnatic violin plays the kṛti with the vocalist. That relationship
   * — one line, two instruments, no harmony — is what the ensemble *is*.
   *
   * `trade` is sawāl-jawāb again, at the phrase level rather than the section
   * level, and `jugalbandi` is a whole style built on it. `tutti` is kept low and
   * not zeroed: the moment the whole group lands a tihai together is real, and
   * it is already `transitions` above doing most of that work.
   *
   * `riff` and `swell` are left where they are. Both need a horn section, and
   * only one style in the genre has one.
   */
  arrangement: { harmony: 0, unison: 8, trade: 5, tutti: 2, riff: 1, swell: 1 },

  /**
   * What the melodies are made of. The derivation is not blank here, it is wrong
   * in two specific places: it has the *sign* of the sequence backwards, and it
   * measures how fast this music moves against the wrong denominator.
   *
   * `archetypesFor` in `adapt.ts` gives `arch-hook` a flat 3 and builds
   * `descending-sequence` out of `melody.sequence` at `1 + sequence * 3`. The
   * twenty-eight entries in `styles.ts` declare 0.45 to 0.72, so it derives
   * **second** at 2.35 to 3.16 — top in only two styles, `bhajan` at 3.10 and
   * `bhangra` at 3.16, and in the four unmetred ones not even second, because
   * `long-note` derives 2.86 there. So the derivation does not have the winning
   * shape backwards. It has *this* shape backwards, and second place is still too
   * high for it.
   *
   * Half the reading is right: this music does develop one figure, obsessively,
   * and the practice has a name — *baḍhat*, the unfolding, which is what
   * `develop: 0.88` above is and the highest number in the project. The sign is
   * wrong. A descending sequence puts its high point in the first quarter of the
   * section — `peakAt: [0.08, 0.25]` — and falls away from it for the rest;
   * `climb: 6` is double jazz's because the shape of an improvisation here is the
   * opposite fact: it starts in the lower tetrachord, ends on the upper Sa, and
   * the piece is over when it gets there.
   *
   * ## Which kinds of tune
   *
   *  - **`arch-hook`, 4**, over a derived flat 3, so this is a lean and not a
   *    replacement. *"Rise to one high point, with a figure that keeps coming
   *    back"* is the bandish read literally. The figure is the mukhḍā, and
   *    `quoteMotto: 0.7` and `liftIntoReturn: 0.55` above are the whole
   *    improvisation aiming at it. The high point has to be argued at the same
   *    scale the field works at: `peakAt` is 0.55–0.72 **of a section**, which is
   *    where a vistār turns for sam, not where the antarā sits. The antarā is a
   *    whole section, and its lift comes from `SectionShape.register: 2` through
   *    `registerFor` — a different mechanism, which this field does not touch.
   *  - **`chant`, 3.5**, against a derived 0.5–1.28. The derived term is
   *    `0.5 + max(0, density - 2.2) * 0.6`, which is a busyness term, and a chant
   *    is not busy — it is *repetitive*. The two rule overrides below are this
   *    archetype argued for at length before it had a name here:
   *    `static-repetition` and `repeated-note-run` are both relaxed because a
   *    line dwelling on one swara is the method rather than a stall — sounded,
   *    left, returned to, until the ear accepts it as home. Neither argument is
   *    about tempo. The tarānā is the gloss word for word, sung on the tabla's
   *    own bols so the hook *is* the rhythm, and it is one of the busier styles
   *    in the genre at 3.13 onsets a bar.
   *  - **`long-note`, 3**, and this is the entry that costs something, so it owes
   *    a denominator. `cellDensity` counts onsets **per bar**; what a held note is
   *    heard in is seconds. Across the nineteen genres this one runs 1.03 onsets
   *    per second, third-slowest after ambient and synth and 40% under the
   *    catalogue's 1.72 — but 2.49 per *bar*, which `0.4 + max(0, 3 - density) *
   *    1.4` barely notices. What comes out is anti-correlated with the rate it is
   *    trying to describe. `vilambit` is the ninth-slowest style in the whole
   *    catalogue at 0.40 onsets a second — the eight below it derive `long-note`
   *    between 2.62 and 3.01, and it derives the **floor**, 0.4. Six more styles
   *    here sit on that floor while `cabaret`, three and a half times faster at
   *    1.48, derives 1.29. So the authored 3 is not invented: it is the band the
   *    derivation itself pays at this speed everywhere it can see the speed,
   *    including at `alap`, `jor`, `alapana` and `tanam`, whose bars are sparse
   *    per bar as well as per second and which therefore derive 2.86.
   *    **The cost, named.** `long-note` is 3 of 14.6, so about a section in five
   *    everywhere, and three styles here genuinely run at or above the
   *    catalogue's own rate — `fusiongat` 2.01, `tillana` 1.91, `svara` 1.72.
   *    Those three are where a style delta belongs; the other twenty-five are
   *    slower than the mean piece of music in this project.
   *  - **`riff-response`, 2.5.** Sawāl-jawāb, at the phrase level. `tradeFours`
   *    is 0.5 and `trade` is 5 in the table above, `jugalbandi` is an entire
   *    style whose form is one player answering the other, and the ālāpana is
   *    distinguished from the ālāp in its own entry by the violin answering every
   *    phrase where the North has a monologue.
   *  - **`descending-sequence`, 1.** Down from the 2.35–3.16 the derivation
   *    hands it, and deliberately not to zero: the avarohaṇa is half of every one
   *    of the fourteen rāgas and a phrase walking down through it is a real
   *    phrase. What is wrong is the *section's* peak sitting at the start.
   *  - **`wide-interval`, 0.6.** The `leap` figures in `styles.ts` run 0.08 to
   *    0.24, mean 0.152 — the **second**-lowest genre in the project, not the
   *    lowest: arabic is 0.128 with a 0.18 ceiling, and finnfolk's floor is 0.07.
   *    Arabic reaches the same 0.6 from the same sentence, which `styles.ts`
   *    states as a rule rather than a tendency: a rāga phrase walks, and the
   *    ornament is what happens between the steps. `tritone-leap` below is the
   *    only override in this genre that keeps a **veto** at all — every other one
   *    sets `RULE_DISABLED` on both levels, and two of them (`static-repetition`
   *    0.6, `repeated-note-run` 0.75) keep penalties larger than its 0.4.
   *
   * ## Which degrees — and the answer is *the rāga*, which is the point
   *
   * `scaleForChord` has already chosen the subset. That is what a rāga is, and a
   * second subset drawn per section would be the engine picking a rāga inside the
   * rāga, which is the one thing this music does not do. So the full set carries
   * this at nearly half the weight.
   *
   * The other three are **colours and not registers**, and the distinction is the
   * machinery's rather than a nicety: `snapToSubset` fills `allowed` from
   * `scale.pcs[d]` and tests `allowed.has(pc(midi))`, so a subset is a pitch-class
   * set and cannot put a line anywhere in particular — it says which swaras the
   * line may stop on, in every octave at once. Where to cut is the drone's
   * decision: `Isus4` is Sa–Ma–Pa and `Isus2` is Sa–Re–Pa, so degrees 0 and 4 are
   * the two notes already sounding under everything, and a set bounded by them is
   * a set bounded by what the tanpura is holding.
   *
   * The generic table this replaces is wrong here in a way that can be stated:
   * two of its six entries drop the fourth degree, 5 of 14 by weight. Ma is a
   * swara — `avoid-fourth` is disabled below in as many words — and a subset
   * table that removed it in a third of sections would be doing by draw what the
   * rule table refuses to do by rule.
   *
   *  - **`[0,1,2,3,4]`, 3** — S R G M P, the two swaras both drone tunings hold
   *    with everything between them. The bhajan's entry says its tune sits in a
   *    fifth so a room that has not rehearsed can sing it back, and it declares
   *    the smallest `span` in the file, 11, to prove it; the qawwāli's back row is
   *    the same fact with more people.
   *  - **`[0,4,5,6]`, 2** — P D N S, the same two swaras the other way round, and
   *    the only entry that admits Dha and Ni. It is the one draw in which those
   *    two carry a phrase instead of being passed through on the way somewhere.
   *  - **`[0,1,2,3]`, 2** — S R G M, the ālāp before Pa has been admitted: its
   *    entry's method as a pitch set, *one swara at a time, dwelling on each until
   *    it has been established*. Two things it is not, both worth saying. On the
   *    ālāp's own pair — Yaman and Simhendramadhyamam, this file's two **tīvra
   *    Ma** rāgas — degree 3 is Ma♯, so the set's outer interval is the tritone,
   *    and the one leap it offers across its own span is the move `tritone-leap`
   *    still vetoes at level 3, which is exactly `alap`'s and `alapana`'s
   *    `strict`. And on the pentatonics its surviving degrees are S R G P, which
   *    contains the fifth and is not a lower tetrachord at all.
   *
   * **On Bhoopali and Dhani this whole field is nearly inert, which is right.**
   * `snapToSubset` returns the note untouched when the surviving pitch classes
   * are all of them or fewer than three, and a five-degree scale has no degrees 5
   * or 6: `[0,1,2,3,4,5,6]` and `[0,1,2,3,4]` both cover the scale, and `[0,4,5,6]`
   * collapses to Sa and the fifth degree — two classes, under the floor. That is
   * 11 of 13 by weight handing the note straight back. A rāga that is already five
   * notes has done its own subsetting; Bhoopali has no Ma and no Ni to withhold
   * and Dhani no Re and no Dha.
   *
   * ## What it does to a figure
   *
   * Four named, and two of them are operators `adapt.ts` never reaches at all.
   *
   *  - **`diminish: 1.5`** — the taan, against a derived 0.45–0.75. `gait: 0.5` is
   *    a note every two mātrās and `doubleTime: 0.42` says a taan runs at four to
   *    eight times that; the varṇam states the rāga's phrases *at two speeds*,
   *    which is diminution named in a style comment.
   *  - **`displace: 0.3`**, against a derived 0.52–0.98. The solo vocabulary sets
   *    `displace: 0.12` and gives the reason — a phrase that arrived a beat late
   *    would have missed sam, and missing sam is the error the whole form is
   *    organised to avoid. `offbeatAccent: 0.05` is the same sentence about
   *    accents rather than about figures.
   *  - **`invert: 0.25`** — the ārohaṇa and the avarohaṇa are two different lines
   *    with different notes in different orders, which is the first thing the
   *    rāga block in `styles.ts` says a rāga is. A rāga is recognised in three
   *    notes, by its pakaḍ, and Yaman's Ni–Re–Ga upside down is not a variation
   *    of Yaman.
   *  - **`reharmonise: 0.15`** — *"made to fit new changes"*, and there are no
   *    changes: twenty-four of the twenty-eight hold one chord for the length of
   *    the piece. Where there are chords it is worse than a no-op, because it
   *    sets `Motif.resnap` and forces strong beats onto chord tones — over a
   *    three-note drone that is the line collapsing onto Sa, Ma and Pa, which is
   *    the exact failure `unprepared-dissonance` below was relaxed to prevent.
   *
   * **`extend` is the operator this genre most wants and the one it cannot buy.**
   * *"Add a note on the end"* is baḍhat written as an operator — state a phrase,
   * extend it by one swara, restate it, extend it again — and a weight for it
   * would change no draw. `opsFor` scales each choice by the appetite for
   * `ops[0].op`, the *first* operator of the pair, and both routes to `extend`
   * have it second: `[transpose 0, extend step]` under `repeat` and
   * `[fragment 3, extend leap]` under `answer`. Every one of the other ten op
   * kinds leads at least one choice; `extend` leads none, so 1.8 and 0.1 and
   * absent are the same generated music, and it was 1.8 here until this was
   * measured. arabic reaches the same figure through `fragment`, which is first
   * in five entries including that second one. Not taken here: `fragment` also
   * leads two of the six `develop` choices, carrying 6 of that intent's 17.5, and
   * lifting it takes weight off the two `diminish` pairs that hold 8 of the same
   * 17.5 — which is the taan, bought two bullets up on purpose.
   *
   * **`sequence` and `ornament` are left unnamed on purpose.** Both are derived
   * from each style's own `melody` block and the spread there is real and
   * correct — ornament 0.22 in the cabaret against 0.55 in a vilambit khyāl,
   * sequence 0.45 in svara kalpana against 0.72 in bhangra. A genre-wide number
   * would flatten a distinction the tables already state.
   *
   * ## Two neighbours, near in different fields
   *
   * **arabic, on `subsets`, and this field cannot be asked to separate them.**
   * Its top two entries are these two sets in this order — `[0,1,2,3,4,5,6]` then
   * `[0,1,2,3,4]` — reached by the same argument, that the scale *is* the
   * character and a phrase which has not left home lives in the lower pentachord.
   * Since the full set is a no-op in `snapToSubset`, the most frequent *active*
   * subset is `[0,1,2,3,4]` in both genres, and `wide-interval: 0.6` is the same
   * number in both files. What separates them is the archetype table:
   * `descending-sequence` 1 here against 3.25 there, `chant` 3.5 against 1,
   * `arch-hook` 4 against 2.5 — and `diminish: 1.5` here against no `diminish`
   * there, which is the difference between a taan and a taqsim.
   *
   * **reggae, on the generated surface.** Fingerprinted on duration classes,
   * interval classes, density and turn rate over every style at three seeds — when
   * both genres still took the derived subset table — reggae and indian sat 0.106
   * apart where the mean of all 171 genre pairs is 0.382. `subsets` is where they
   * part, and the gap has widened since reggae authored its own: `[0,2,3,4,6]` at
   * 5, the full seven at 3, `[0,1,2,4,5]` at 2, so gapped sets are 7 of 10 by
   * weight there against 0 of 13 here. A snap there lands the line on thirds.
   * Every entry here is *contiguous* round the octave, Sa Re Ga Ma and Pa Dha Ni
   * Sa, so a snap lands on seconds — `styles.ts`'s sentence about a rāga phrase
   * walking, expressed as an interval histogram. `ops` does the other half:
   * `diminish` at 1.5 puts taan sixteenths into a genre that sets the same
   * operator to 0.4 and writes every horn line as a quarter-note figure.
   */
  voice: {
    archetypes: [
      ['arch-hook', 4],
      ['chant', 3.5],
      ['long-note', 3],
      ['riff-response', 2.5],
      ['descending-sequence', 1],
      ['wide-interval', 0.6],
    ],
    subsets: [
      [[0, 1, 2, 3, 4, 5, 6], 6],
      [[0, 1, 2, 3, 4], 3],
      [[0, 1, 2, 3], 2],
      [[0, 4, 5, 6], 2],
    ],
    ops: { diminish: 1.5, displace: 0.3, invert: 0.25, reharmonise: 0.15 },
  },

  /**
   * Where this genre disagrees with the shared rule table, and it disagrees
   * more than any other.
   *
   * Every override below is one sentence said in a different place: **the rule is
   * asking what this note does to the chord, and there is no chord.** The table
   * was written from classical voice-leading and jazz arranging, both of which
   * are theories of vertical relationship. Applied to a line over a drone they do
   * not produce wrong music so much as produce *European* music, which is worse,
   * because it is confident.
   */
  ruleOverrides: {
    /**
     * The one that would have silently gutted the genre.
     *
     * `augmented-second` vetoes any one-step three-semitone move from strictness
     * 1, and this genre's default is 1, so it would have been vetoing at the
     * floor. Six of the fourteen rāgas are built on exactly that interval:
     * Bhairav has two of them, ♭2→♮3 and ♭6→♮7, one on each side of the fifth;
     * Charukesi and Kirwani have one; Simhendramadhyamam has two in different
     * places; and **both pentatonics hit it as ordinary adjacent steps** —
     * Bhoopali's Ga→Pa and Dhani's Sa→ga are each one scale step and three
     * semitones. Bhairav without its augmented seconds is not a smoothed
     * Bhairav, it is nothing; and a pentatonic that may not move from its third
     * to its fifth cannot move at all.
     *
     * `core/scale.ts` warns about exactly this at the head of its non-Western
     * block, and the failure mode is what makes it worth two paragraphs: the
     * veto is silent. Nothing throws, nothing logs, the melody simply declines
     * every characteristic interval the scale exists to make and comes out
     * sounding like a cautious minor key.
     */
    'augmented-second': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * There is no leading tone here, because there is nothing to lead to.
     *
     * The rule fires when a ♮7 under a dominant-function chord fails to rise.
     * Four rāgas have a ♮7 — Yaman, Bhairav, Kirwani, Simhendramadhyamam — and in
     * all four it is a swara like any other: **Yaman's most characteristic phrase
     * is Ni–Re–Ga**, which starts on the seventh, goes *up past* the tonic
     * without touching it, and is the single gesture by which the rāga is
     * recognised. A rule that made the Ni resolve to Sa would delete Yaman's
     * signature and replace it with a cadence.
     */
    'unresolved-leading-tone': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * The largest one by effect, and the least obvious.
     *
     * `unprepared-dissonance` penalises any non-chord tone arrived at by leap. In
     * a genre with one three-note chord for the length of the piece, **four of a
     * seven-note rāga's swaras are non-chord tones at all times** — so at
     * `standard` this multiplies the weight of over half the scale by 0.2 on
     * every leap, and the line collapses onto Sa, Ma and Pa. That is not a
     * cautious melody, it is an outline of the drone.
     *
     * Kept as a mild preference at the top level, where it still does its real
     * job of stopping a line jumping into somewhere it cannot get out of.
     */
    'unprepared-dissonance': { minLevel: 3, vetoLevel: RULE_DISABLED, penalty: 0.7 },

    /**
     * The same argument on the beat rather than in the leap. A "non-chord tone on
     * a strong beat" here means *any swara that is not Sa, Ma or Pa landing on
     * sam*, which is most of the rāga most of the time and is what a nyāsa swara
     * is. Pushed to the top level and never vetoed.
     */
    'non-chord-tone-on-strong-beat': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.6 },

    /**
     * The komal Re against the drone is the sound of the morning rāgas.
     *
     * `flat-nine` catches a held note a semitone above the chord root, which is
     * exactly Bhairav's and Bhairavi's second degree sitting on a Sa that never
     * stops. It is the most recognisable interval in the repertoire and the
     * reason those two rāgas are the ones everybody can identify. Ambient makes
     * the same argument about its ♭II over a pedal; here it is not a colour at
     * the dark end of the genre, it is six styles' entire identity.
     */
    'flat-nine': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.5 },

    /**
     * And the same interval seen from the band's side. `semitone-clash` fires on
     * any held note a semitone from something sounding, and the thing sounding is
     * always the drone. Every komal-Re rāga would trip it on its second degree
     * and every ♮7 rāga on its seventh, at `strict` — which is the setting the
     * two unmetred styles use, and the two styles where the drone is most
     * exposed. Relaxed to a preference at the smoothest level only.
     */
    'semitone-clash': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.6 },

    /**
     * Ma is a swara, not an avoid note.
     *
     * `avoid-fourth` is a jazz idea about a sustained eleventh over a major
     * third, and it is a good one there. Here the fourth degree is śuddh Ma, it
     * is a nyāsa swara in half the rāgas that have it, and in several — Yaman
     * above all — the whole rāga is organised around whether Ma is natural or
     * sharpened. It is also, in `Isus4`, a note of the drone itself.
     */
    'avoid-fourth': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * Sa–Ma♯ is not a slip.
     *
     * The melodic tritone is forbidden everywhere for a good reason and there are
     * two rāgas here where it is a defining move: Yaman and Simhendramadhyamam
     * both have **tīvra Ma**, the sharpened fourth, and in both the leap from Sa
     * to it is a phrase people know. Kept as a real penalty rather than disabled —
     * it should stay rare, and it should stay possible.
     */
    'tritone-leap': { vetoLevel: 3, penalty: 0.4 },

    /**
     * A repeated Sa is how a rāga establishes its tonic.
     *
     * `static-repetition` exists to catch a melody that has stalled, and its own
     * description says so. What it cannot tell apart is a line dwelling on one
     * swara, which in an ālāp is not stalling — it is the method: the note is
     * sounded, left, returned to and sounded again until the ear accepts it as
     * home, and only then is the next one admitted. Relaxed rather than disabled,
     * because a stalled line is still a real thing that can happen.
     */
    'static-repetition': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.6 },
    'repeated-note-run': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.75 },
  },

  /**
   * The soloist is the piece, and everything else is furniture that happens to
   * be in tune.
   *
   * The numbers below are almost exactly the default dance-band balance with two
   * changes, and both are statements about the music rather than about mixing.
   *
   * **The comp and the pad come down together.** In a dance band the comp is the
   * harmony and the pad is the bed; here they are a harmonium and a tanpura, and
   * both of them are *reference pitches* — things present so the soloist and the
   * audience know where Sa is. A harmonium as loud as a comping piano would be
   * the second-loudest thing in a room that only has one thing in it.
   *
   * **The drums go up**, which no other genre here does. A tabla is not
   * timekeeping. It is the other half of the performance: it answers phrases, it
   * lands tihais, it takes solos, and the sawāl-jawāb between the soloist and the
   * drummer is one of the reasons people come. A tabla mixed like a hi-hat would
   * be a co-performer treated as a click.
   *
   * The counter is up too, for the same reason at one remove: it is a sārangī or
   * a violin shadowing the line, and a shadow you cannot hear is not a shadow.
   */
  mix: {
    melody: 0.95,
    counter: 0.66,
    comp: 0.52,
    pad: 0.5,
    bass: 0.58,
    drums: 0.72,
  },

  /**
   * The three hand strokes are the kit, and the rest of the kit is barely there.
   *
   * `DEFAULT_DRUM_MIX` already puts `lp` at 0.8, `mp` at 0.6 and `hp` at 0.5, and
   * its own note explains why: those are set by how the ear hears them rather
   * than by how hard the drum is hit, so the crack gets the smallest fader
   * despite being the hardest stroke. That reasoning holds here and the numbers
   * are nudged rather than rewritten.
   *
   * What is rewritten is everything else. A kick, a snare and a hi-hat appear in
   * this genre only in the filmī and fusion eras and never in a classical style;
   * the values below keep them playable and stop a fill or a substitution from
   * arriving louder than the theka it interrupted. `cp` stays high on purpose —
   * in a qawwāli the clap is a section of the ensemble, not a percussion
   * overdub, and it should be as present as the drum.
   */
  drumMix: {
    lp: 0.85, mp: 0.7, hp: 0.58,
    cp: 0.72, perc: 0.6, rim: 0.6,
    bd: 0.8, sd: 0.6, hh: 0.34, oh: 0.38,
    lt: 0.55, mt: 0.55, ht: 0.55,
    cr: 0.4, rd: 0.28, sh: 0.34, cb: 0.4, tb: 0.4,
  },

  /**
   * A hall with a hard floor and soft walls, and a short delay that is nearly
   * inaudible.
   *
   * The reverb is the smallest of any genre here and the constraint that decides
   * it is specific: **a damped tabla stroke has to stay legible.** Half the
   * information in a theka is in the difference between *tin* and *te* and *ka*,
   * which are three dry high sounds separated by their envelopes; put a hall on
   * them and they become one sound with a tail. A sabhā is a room built to let a
   * tabla be heard, which means a room that is drier than it looks.
   *
   * `delayBeats: 1` — a whole beat rather than the dotted eighth every other
   * genre reaches for. Three sixteenths against four is chosen precisely so an
   * echo never lands where the beat does, which is the right instinct in music
   * with a backbeat and the wrong one here: this genre's bars are 5, 7, 10, 12
   * and 16 beats long and an echo that avoided the grid would be a second
   * drummer disagreeing with the first. On the beat, and quiet enough not to be
   * one.
   */
  space: {
    reverbSize: 0.42,
    delayBeats: 1,
    delayFeedback: 0.15,
  },

  /**
   * The genre's standing production notes, true in every one of the four eras.
   *
   * **The drone is dry and dark.** The same argument ambient's bass makes and
   * more so: a sustained low tone with a reverb tail beats against itself, and
   * this one never stops, so the beating never resolves into anything.
   *
   * **The tabla is dry and bright**, which is the inverse and the more unusual
   * of the two. Every other genre in this project filters its kit downward; here
   * the top of the drum is where the pattern lives, and a lowpass anywhere near
   * where a rock kit wants one would take the damped strokes out entirely.
   */
  effects: {
    pad: { reverb: 0.55, lowpass: 5200 },
    comp: { reverb: 0.4, lowpass: 5200 },
    melody: { reverb: 0.35, lowpass: 8500 },
    counter: { reverb: 0.42, lowpass: 7000 },
    bass: { reverb: 0.06, lowpass: 1000 },
    drums: { reverb: 0.18, lowpass: 9000 },
    vocal: { reverb: 0.45, lowpass: 7000 },
  },

  /**
   * Three to five minutes, and it is the most violent compression in the
   * project.
   *
   * A khyāl is forty minutes and a Carnatic rāgam–tānam–pallavi can be an hour.
   * What is generated here is not a shortened performance, it is **one item off a
   * programme**, and the difference is worth stating rather than apologising for:
   * the material that gets cut is the baḍhat, the slow unfolding, which is the
   * part that needs twenty minutes to be anything at all. What survives is the
   * composition, an improvisation and a landing, which is a real shape and is
   * roughly what a 78 held.
   */
  duration: [165, 285],

  /**
   * **The rāga rule: the chord is ignored, completely.**
   *
   * This is a two-line function and it is the whole argument of the genre, so it
   * is worth being exact about what it refuses to do rather than about what it
   * does.
   *
   * Iskelmä's rule reads the chord to decide whether to raise the seventh. Jazz's
   * reads it to pick a mode for that chord's root. Ambient's reads it to choose
   * which mode *of the tonic* can absorb it — the tonal centre never moves, but
   * the scale still bends to admit what is passing underneath. **This one does
   * not read it at all.** The parameter is accepted because the interface has it
   * and is never touched.
   *
   * That is a stronger claim than ambient's and it is the correct one, because
   * the thing ambient is bending to accommodate does not exist here. A rāga is
   * not a scale chosen to fit a harmony; it is the material, fixed before the
   * performance begins, and the drone is *derived from it* rather than the other
   * way round. A line that recoloured itself because a chord had changed would
   * have changed rāga, and changing rāga mid-piece is the one thing this music
   * does not do.
   *
   * The tonic is always the tonic, for the same reason and one further one: Sa is
   * where the tanpura is tuned, the tanpura is not retuned during a performance,
   * and every degree the melody engine counts is counted from the scale's own
   * tonic. `core/scale.ts` says why that matters more than the pitch classes do
   * — the note a phrase comes to rest on is the half that carries the idiom.
   *
   * **Every style overrides this**, which makes the genre-level implementation a
   * fallback rather than a behaviour. It is Khamaj against Kafi — mixolydian and
   * dorian, the two plainest seven-note sets on either side — because a style
   * that somehow reached here should get a rāga that will not fight whatever
   * chord it was given, and those two have the fewest sharp edges in the list.
   */
  scaleForChord: (tonic: Pc, mode: Mode, _chord: Chord): Scale =>
    makeScale(tonic, mode === 'minor' ? 'dorian' : 'mixolydian'),

  /**
   * A tabla player does not play a tom roll into the antarā.
   *
   * Twenty-two of the twenty-eight styles set `drumFills: false` outright, so
   * this palette is reached mostly by the filmī and fusion styles that have a kit
   * on them — and even there the gesture wanted is small. `drop` leads because
   * the commonest way this music marks a join is the drum simply not being there
   * for a moment; `rim` is next because it lands on the dry strokes the hand
   * drum already has. `tom-roll` and `cymbal` are absent, not down-weighted:
   * there are no toms in this music and a crash in the middle of a tihai would be
   * the loudest possible way of getting it wrong.
   */
  fills: [
    ['drop', 6], ['rim', 5], ['lead-in', 3], ['snare-roll', 1],
  ],

  /** The sabhā, the sherwani and a programme that will not be reverent. */
  staging: STAGING,
};
