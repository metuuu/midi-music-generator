/**
 * Drum and bass, 1990–2018 — and the jungle it came from.
 *
 * A break at 174 with a sine wave under it. One of the last two of nineteen, and
 * one of the two that were waiting on a mechanism rather than on an author:
 * `docs/engine-gaps.md` has named `dnb` and `house` as unwritten in every
 * revision since it was made, and the two things it said they were waiting for —
 * the drop and the tempo ramp — both landed in the day before this file was
 * written. **This and `house` are the first genres written with the whole of §1
 * closed**, which mostly means the compromises recorded below are new ones
 * rather than inherited ones.
 *
 * ## The thing to say first, because two tables are downstream of it
 *
 * **The tempo is a lie and everybody involved knows it.** The bar is 174 BPM and
 * nothing in the music is at 174: the kick is on beat one and the snare is on
 * beat three, which is a backbeat at 87, and that is the tempo a body moves at.
 * Everything above the snare — the hats, the ghost lattice, the shaker — runs at
 * the written speed, and everything at or below it runs at half.
 *
 * That split has no field. `Style.beatsPerBar` is 4 in all twenty-four tables,
 * `bpm` is one range, and the drum table and the bass table simply agree with
 * each other style by style. It is the largest unstated thing in this genre and
 * it is not a gap in the type system so much as an observation that the type
 * system has one tempo where this music has two. A reader editing one of those
 * tables has to edit the other.
 *
 * ## The load-bearing decision: `scaleForChord`
 *
 * Six answers existed before this. Iskelmä follows the *key*; jazz follows the
 * *chord*; ambient follows the *drone*; synth follows the key without the
 * leading tone; rnb tests whether the chord has left the key; funk and hiphop
 * name a fixed tonic scale and **do not read the chord at all**.
 *
 * **This genre's answer is hiphop's shape, and it is worth saying so plainly
 * rather than inventing a difference to justify a seventh row.** The rule is one
 * line, the chord is not a parameter, the scale is rooted on the tonic and fixed
 * for the song. The reason is nearly hiphop's too, arrived at from a different
 * direction: there the harmony is a loop and the loop is somebody else's, so a
 * line that re-oriented onto each chord would re-orient identically every two
 * bars for four minutes. Here the harmony is usually **one chord**, and where it
 * is four they are four bars of a pad that was drawn once and copied —
 * **seventeen of the twenty-four styles' leading verse table is a single chord
 * for eight bars** and three more are two chords alternating. A chord-relative
 * rule over that is a fixed pattern arrived at expensively.
 *
 *     minor  →  minor            seven notes, no leading tone
 *     major  →  majorPentatonic  five notes, no fourth and no seventh
 *
 * ### Where it genuinely differs from hiphop's, and the asymmetry is the point
 *
 * Hiphop's minor half is `minorPentatonic` — five notes, on the argument that a
 * pentatonic is *the scale that cannot be wrong about a chord it has not been
 * told about*. That argument is exactly right for that genre and it is wrong for
 * this one on the minor side, for a reason that is a fact about the repertoire:
 * **the minor half of this catalogue is the composed half.** The ♭6 is not a
 * colour here, it is the record — it is what an atmospheric pad is made of, what
 * a Reese leans on, and what separates the 1993 turn from the eighteen months
 * before it. `minorPentatonic` is 0, 3, 5, 7, 10; there is no ♭6 in it and no
 * second either, and a genre whose entire emotional apparatus is the flattened
 * sixth cannot be handed a scale that omits it.
 *
 * The major half is the other way round and it is hiphop's argument unchanged,
 * because the major-key corner of this music is the **sampled** corner: the 1992
 * piano riff, the chopped soul vocal, the Brazilian guitar. The two degrees
 * `majorPentatonic` leaves out are the fourth and the seventh, which are
 * precisely the two that can disagree with what is underneath — the fourth is
 * the avoid note over the `maj9` the pad almost certainly is, and the seventh is
 * a semitone from wherever the loop lands next.
 *
 * So the minor half gets seven notes and the major half gets five, which is the
 * mirror image of funk's split and of hiphop's, and the asymmetry says something
 * true: this genre writes its dark music and samples its bright music.
 *
 * ### The two styles that override it, and why exactly two
 *
 * `darkcore` to `harmonicMinor` and `techstep` to `phrygian`. Both are the same
 * shape of rule with a different scale in it — **neither reads the chord** —
 * which is what every other `Style.scaleForChord` in the project is: jazz
 * follows the chord and its blues style overrides to a tonic scale; funk and
 * hiphop follow the tonic and override to something else, one style each.
 *
 * Two rather than one, and the pairing is the argument. Each names **one
 * interval that the genre's own scale structurally cannot spell** and that the
 * style in question is recognised by — the augmented second between the ♭6 and
 * the ♮7 in a sampled horror-string stab, and the ♭2 in a two-note bass motif.
 * Both intervals are borrowed from film scoring rather than from any dance
 * idiom, which is the actual historical fact about both styles, and neither is
 * reachable from the natural minor by any weighting. Everything else in the
 * catalogue takes the genre rule, including `neurofunk`, where it would have
 * been easy and wrong to add a third: that style's melodic content is a bass
 * patch's upper harmonics, and giving it a scale would be dressing an absence.
 *
 * ## What was taken from the new mechanisms, and what was not
 *
 * **`Style.drops`, ten styles, both shapes, and `breakdown` finally has
 * authors.** §7 of `docs/engine-gaps.md` records that the shape had none in the
 * whole catalogue and states its requirements exactly: *a dance record with a
 * wash, on a form long enough for three four-bar phrases*. That is a description
 * of `dancefloor`, `liquid`, `atmospheric`, `techstep` and `deep`. `dub` — the
 * bass out, the kit keeping time — goes to `jungle`, `ragga`, `rollers`,
 * `dubwise` and `drumfunk`, and it is not an analogy: those producers were
 * making dubplates in the same rooms, for the same sound systems, as the reggae
 * engineers the shape is named after.
 *
 * **`dropBars: 8` on all ten, and the reason is the opposite of funk's.** Funk
 * `minneapolis` needed `dropBars: 2` because its sections were eight bars long
 * and a four-bar drop needs twelve. This genre has the opposite problem: at 174
 * BPM `buildForm` doubles every non-intro section, so a chorus is **thirty-two
 * bars** and four bars of silence is five and a half seconds, which is a
 * stumble. Eight bars is eleven seconds, which is a breakdown.
 *
 * **Measured, 200 songs per style.** With the palette forced to the shape alone,
 * all ten place a drop in **200 of 200 at `dropBars: 8`** — and also in 200 of
 * 200 at the shipped default of 4, which is the more useful half of the result:
 * on this genre's forms a drop *cannot* fail to place, so `dropBars` here is a
 * change of scale rather than the rescue it was for funk. As shipped, with
 * `none` in the palette, the rate is simply the weight: 64 to 81 of 200 at
 * `[['none', 2], [shape, 1]]`, and 95 and 99 of 200 for `dubwise` and
 * `dancefloor`, which write one in two. The longest section in every one of
 * those 2000 songs is 32 bars.
 *
 * **Four styles were considered for a drop and refused**, which is the more
 * useful list. `neurofunk` wants `breakdown` and its own bass *is* the wash, so
 * the shape would remove its witness — it excludes nothing and would simply
 * place badly. `halftime` wants it and neither length works: its sections are
 * already at half speed, so eight bars is twenty-two seconds of held pad, and
 * writing `dropBars: 4` would claim its phrases are shorter than the rest of the
 * genre's, which is false. `minimal` has nothing to take away — `breakdown`
 * removes the kit and the bass, and in that style those two are the entire
 * record. `revival` was refused on the mannerism ground §7 names: it is
 * `jungle`'s restatement and `jungle` already has the dub.
 *
 * **`Style.tempoRamp`, one style, and twenty-three refusals with one reason.**
 * `breakcore` takes `accelerando` at one draw in four. Everything else in this
 * genre declines, and not stylistically: **these records exist to be
 * beatmatched.** A DJ holds two of them against each other for ninety seconds,
 * and the eight-bar intro, the sixteen-bar outro and the whole functional
 * apparatus of the form exist so that the two decks agree. A record whose tempo
 * moves cannot be held against anything. Breakcore is the one style here made by
 * people who had stopped caring about that, and it is also the one that is not
 * played in a mix.
 *
 * **The build, which is the loudest thing this genre could not have.** On the
 * records, the eight bars before a drop are a snare roll accelerating into a
 * riser, and that is *a tempo ramp arriving at a drop*. `generate/tempo.ts` says
 * in as many words that it cannot be built: everything in that file runs before
 * the form exists, because `buildForm` divides by the tempo to fit
 * `Genre.duration`, while `planDrop` runs four hundred lines later. And the
 * return is deliberately unmarked — `generate/drop.ts` refuses to write a crash
 * on the bar the band comes back, on the ground that an edit pass may not author
 * an event the composition did not contain. Both refusals are right and together
 * they remove the single most recognisable gesture in this music.
 *
 * So what the tables do instead is **put the announcement at the seam**, which
 * is the one place the engine is allowed to make one. `fills` leads with `drop`
 * — the bar where everything stops — the transition palettes weight `break` and
 * `shot` above `fill` in the drop-shaped styles, and `shots` are whole-band
 * stabs. That is the same gesture moved half a phrase, and it is the honest
 * thing available rather than a substitute nobody would notice.
 *
 * **`DrumPattern.ghosts`, sixteen styles of twenty-four.** More of this music is
 * ghost strokes than of any other genre in the catalogue: a chopped break has
 * four loud strokes in it and about eleven quiet ones, and writing only the four
 * produces a drum machine playing a rock beat. `styles.ts` has the whole
 * argument, including why the eight that write none are making a claim rather
 * than an omission, and why the dividing line runs down the middle of the
 * genre's history rather than across its map.
 *
 * ## The ceilings, named because they shaped the tables
 *
 * **Something subdivides below a sixteenth now, and three styles have taken
 * it** — §3.15, built as `DrumEvent.roll` and `DrumPattern.rolls`. At 174 BPM a
 * written sixteenth is 86 ms and a chopped amen's internal detail wants 43,
 * which is `roll: 2`; hiphop hit this first at 140, filed the arithmetic, and
 * adopted it in `trap` and `drill`.
 *
 * The sentence that stood here — *the stutter, the retriggered fragment and the
 * thirty-second roll into a drop are all simply absent, and no arrangement of
 * these tables produces one* — has now come apart into three claims with three
 * different answers, and that is the most useful thing this entry can record.
 *
 * **The stutter is written.** `jungle`, `drumfunk` and `breakcore` roll —
 * **117,408 rolled strokes over 600 songs of those three, against 0 over the
 * other twenty-one styles' 4,200 and 0 reaching a pair of hands anywhere.** The
 * gate was no obstacle, exactly as this paragraph predicted: `rolls` is read
 * only where the source is `programmed`, all four eras below are `programmed` at
 * 9 or 10 out of 10, and the 2 to 8% of these three styles' songs that draw the
 * `electronic-kit` instead simply hear the figure underneath — which is the era
 * table doing its job rather than the field failing, and is the same sentence
 * `DrumPattern.rolls` writes about a live drummer playing a trap figure.
 * `styles.ts` carries the arithmetic; the short version is that a sixteenth here
 * is 86 ms against trap's 107, so `roll: 2` reaches 43 ms where hiphop needed
 * `roll: 3` to reach 36.
 *
 * The standing proof is thinner than it should be and is worth saying so.
 * `npm run check` prints a rolled-slot count over the whole catalogue and this
 * adoption moved it from 235 to 323, so a silent regression here would show up
 * there. But `npm run genres`' *"no hand is asked to play a roll"* is scoped to
 * `trap` and `drill` by name, and its own comment explains why it was written
 * that way — a check that passes because nothing is happening is the failure §7
 * keeps naming. It now under-covers: nothing asserts that this genre's 117,408
 * strokes exist or that none of them reaches a drummer, and widening that loop
 * to the adopting styles is a change to `src/genre-check.ts` rather than to
 * anything under `genre/dnb`.
 *
 * **The retriggered fragment is written, and it is not trap's figure.** A trap
 * roll is a hi-hat run-in inside one sixteenth at the end of a bar. What is
 * written below is a snare covering a **whole beat** — four consecutive
 * sixteenths, each a pair of 32nds, eight strokes across 345 ms — which is the
 * shape the field spells as four rolled strokes in a row rather than as one
 * `roll: 4`, and which cost both adopting figures four new written snare hits to
 * carry. That is the difference between a change to the part and an ornament on
 * it, and it is why writing this by analogy with `trap-kit` would have satisfied
 * the field and not the music.
 *
 * `drumfunk`'s `edit` takes a third shape that hiphop structurally could not
 * have reported: **two of its eleven ghosts are rolled**, 20,557 strokes at a
 * measured mean velocity of 0.16 against the struck rush's 0.58–0.94. The
 * subdivision happens *under* audibility, which is where most of a chopped break
 * lives, and `trap` and `drill` write no ghost row at all — there was nothing
 * quiet next door to subdivide.
 *
 * **The thirty-second roll into a drop is still absent, and the reason has
 * moved.** It is no longer that nothing subdivides below a sixteenth; it is that
 * the gesture is a *fill* and a fill cannot carry the field. `generate/fills.ts`
 * builds `snare-roll` by stepping one or two whole slots at a time — sixteenths
 * and eighths, nothing shorter — and no `FillShape` in that file writes
 * `DrumEvent.roll` at all, so the eight bars before a drop still accelerate only
 * as far as the grid goes.
 *
 * A `DrumPattern` cannot stand in for it either: a figure repeats, and a build
 * is by definition the bar that does not. Two refusals already documented above
 * meet here — `generate/tempo.ts` cannot ramp into a drop, and `generate/drop.ts`
 * will not mark the return — and this is the third face of the same missing
 * gesture rather than a fourth problem. Nothing in `genre/dnb` can fix it.
 *
 * ### Twenty-one styles refuse, and the line they draw is not the ghost line
 *
 * Three of twenty-four, where hiphop took two of twelve, and the refusals are
 * worth as much as the adoptions — `docs/engine-gaps.md` §7 spends a section on
 * exactly this, where a mechanism sprayed across the styles that never asked for
 * it becomes a mannerism. The line here is **whose hands are on the sampler**:
 * the retrigger goes to the three styles where the break is being *operated* in
 * front of you, and it stops there.
 *
 * That is nearly, but not quite, the `boxDrums: false` line, and the near-miss
 * is instructive. `hardstep` writes `boxDrums: false` for the same reason
 * `drumfunk` does and still refuses, because its proposition is the opposite
 * one: the chop has been thrown out and what is left is one kick and one snare
 * layered until they land like furniture. A stutter is the chop coming back.
 *
 * Seven of the twenty-one are worth naming, because each is a style somebody
 * would reasonably have expected to adopt:
 *
 *  - **`techstep`, `neurofunk` and `jumpup`** — the three styles that reported
 *    §3.16 and spent it, so they are demonstrably not shy of a new field. They
 *    refuse this one for the reason `styles.ts` already gives for their empty
 *    ghost rows: a techstep snare is one sample triggered once at one velocity,
 *    and a second copy of it 43 ms later is not a subdivision, it is a second
 *    snare. Everything these styles retrigger, they retrigger on the bass, which
 *    is where their edits have always been.
 *  - **`jazzstep`** — the most interesting refusal, and it is about the field's
 *    shape rather than the style's. What a jazz drummer plays fast is a *press
 *    roll*: a buzz that swells and decays, shaped stroke by stroke. `DrumEvent.roll`
 *    refuses shape on purpose and at length — every stroke is the velocity of the
 *    stroke it subdivides, because a retriggered step has one level. So the one
 *    fast gesture this style wants is precisely the one the field declines to
 *    spell, and an even eight-stroke burst in its place would be a machine
 *    imitating a brush.
 *  - **`halftime`** — where the analogy would have been easiest and therefore
 *    proves least. Its own header says it is a trap beat with a drum and bass hat
 *    over it, and its `dotted-hat` is `cycle: 12`, which is `hiphop/drill`'s
 *    `dotted-drill` note for note. That figure refused a roll next door on the
 *    ground that a retrigger inside a dotted-eighth chain is a second
 *    cross-rhythm asking to be counted alongside the first; the same sentence
 *    holds here, and rolling the plain figure beside it would be importing
 *    `trap-kit` under a different style name.
 *  - **`ragga`** — the same break as `jungle` with a dancehall bassline on it,
 *    and its own header says the one respect in which it differs is the bass. So
 *    the edit belongs to the entry above; a second copy of it here would add no
 *    claim, and adding no claim is the definition of the mannerism.
 *  - **`rollers`** — named for a groove rather than a drum roll, and its thesis
 *    is a figure that does not change for four minutes. A stutter is a change.
 *
 * The remaining fourteen fall into two groups and neither needs an argument
 * longer than a sentence. `bleep`, `hardcore` and `darkcore` predate the edit —
 * in 1992 the break is sampled whole, pitched up and looped, which is the era
 * table's own description, and there is no operator to hear. `atmospheric`,
 * `intelligent`, `liquid`, `deep`, `dubwise`, `autonomic`, `minimal`,
 * `dancefloor`, `sambass`, `hardstep` and `revival` are styles where the drums
 * keep time under something else — a pad, a Rhodes, a bassline, a desk, a
 * batucada — and a retrigger is the drums asking to be listened to.
 *
 * **A bass note can slide now** — §3.16, and this genre was the strongest
 * evidence the document had: three independent reports inside one genre, against
 * a document whose own standard is two. A Reese moves in pitch under a filter, a
 * wobble moves under an LFO, and both *are* the movement. `techstep`,
 * `neurofunk` and `jumpup` wrote struck notes where the record has one note that
 * travels; all three write `BassHit.glide` instead, sixteen of their thirty-eight
 * bass onsets travel, and not one of them writes a `glideTime`. The default is
 * the whole note, and a Reese that arrives early and waits is a note with a
 * smear on the front. `styles.ts` has the two things the field still cannot do.
 *
 * **The bass fold, which was never where this file said it was** — §1.3, and
 * closed. `placeRoot` scores every octave of the root against the whole span,
 * the reach is 35 semitones, and every span up to **24** stands at all twelve
 * roots; the twelfth this header used to quote was six genres' shared guess and
 * it was half the real number. Nothing in `styles.ts` moved, because nothing in
 * it wanted to: the gesture here is the sub dropping an octave under the drop,
 * that is twelve semitones from either end, and the octave is still written
 * upward from the root so the root stays on the bottom note where a sub belongs.
 * **Where a note travels to counts the same way**: a glide destination goes into
 * the same span reduce as a struck tone, so no row here reaches anywhere it did
 * not already reach. See `unplaceableRoots`, which is where the number comes
 * from, and which `npm run genres` now asserts over every figure in the project.
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
 * **The chorus comes first, and one other genre in this project does that.**
 * This note said *no* other genre, and that was wrong when it was written
 * rather than overtaken later — arabic has opened on its refrain since it was
 * built, six genres before this one, and nobody checked. Measured over every
 * style at eight seeds, taking the first section after the `intro`: **dnb
 * 192/192, arabic 101/168**, and 0 in each of the other seventeen. So the
 * distinctive fact is not the gesture, it is that this genre never does
 * anything else; arabic reaches it in two of its four form tables and the
 * other two open on a ghusn.
 *
 * The two arrive at it from opposite ends, which is the part worth keeping.
 * An Arabic song opens on the **mazhab** because the audience is being handed
 * the tune, and everything after it is a departure from something they already
 * have. A drum and bass record's first event is the *drop*: sixteen bars of
 * drums for the mix, and then the whole arrangement arrives at once — nobody is
 * being given a tune, they are being given the record. Everywhere else the
 * opening statement after the intro is a verse, because everywhere else a song
 * establishes something and then lifts it. What follows the drop here is the
 * roll — which is this genre's verse, a long section where the record simply
 * runs — and the breakdown is a `bridge` in the middle of it.
 *
 * `buildForm`'s trim rule protects index 0 and index 1, so putting the chorus at
 * index 1 is safe as well as correct: it is the section the form is not allowed
 * to lose.
 *
 * **The sections below double.** `buildForm` doubles every non-intro, non-outro
 * step where a bar lasts under 1.5 seconds, which at 4/4 means anything above
 * 160 BPM — twenty-one of the twenty-four styles here. So a sixteen-bar chorus
 * written below is a **thirty-two bar** chorus in twenty-one of the styles and a
 * sixteen-bar one in `bleep`, `hardcore` and `darkcore`, whose tempos are lower.
 * That is not an accident being tolerated, it is the right answer twice: the
 * 1992 records phrase in sixteens and the 174 records phrase in thirty-twos, and
 * the mechanism arrives at both from one table.
 *
 * **The intro and the outro are sixteen bars and stay sixteen**, because
 * `buildForm` leaves them alone. That is exactly what they should be. Those two
 * sections are not music, they are *tools*: sixteen bars of drums and one bass
 * note at either end so that a DJ has somewhere to put the other record. At 174
 * that is twenty-two seconds each, which is about a mix.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  // The standard shape: in, drop, roll, breakdown, drop, roll, out. About half
  // of everything anybody has pressed in this idiom.
  [[
    { kind: 'intro', bars: 16 },
    { kind: 'chorus', bars: 16 }, { kind: 'verse', bars: 16 },
    { kind: 'bridge', bars: 8 },
    { kind: 'chorus', bars: 16 }, { kind: 'verse', bars: 16 },
    { kind: 'outro', bars: 16 },
  ], 6],
  // Two breakdowns and two drops — the symmetrical one, and what a track with a
  // vocal on it usually is.
  [[
    { kind: 'intro', bars: 16 },
    { kind: 'chorus', bars: 16 }, { kind: 'verse', bars: 16 },
    { kind: 'bridge', bars: 8 }, { kind: 'chorus', bars: 16 },
    { kind: 'bridge', bars: 8 }, { kind: 'chorus', bars: 16 },
    { kind: 'outro', bars: 16 },
  ], 4],
  /**
   * The roller: no breakdown anywhere. The record starts, does not stop, and
   * ends — which sounds like a failure of nerve and is the most useful object a
   * DJ owns, because a track with nothing in it is a track that can be played
   * under anything.
   */
  [[
    { kind: 'intro', bars: 16 },
    { kind: 'chorus', bars: 16 }, { kind: 'verse', bars: 16 },
    { kind: 'chorus', bars: 16 }, { kind: 'verse', bars: 16 },
    { kind: 'outro', bars: 16 },
  ], 5],
  /**
   * The one with the drum workout in the middle of it. Sixteen bars where the
   * bass drops and somebody's edits are the whole record — this genre's only
   * improvised-sounding section and the reason `solo` appears in the profile
   * below at all.
   */
  [[
    { kind: 'intro', bars: 16 },
    { kind: 'chorus', bars: 16 }, { kind: 'verse', bars: 16 },
    { kind: 'solo', bars: 16 }, { kind: 'chorus', bars: 16 },
    { kind: 'verse', bars: 16 },
    { kind: 'outro', bars: 16 },
  ], 4],
  // The short edit, with a working intro and a working outro and not much in
  // between. What goes on a compilation.
  [[
    { kind: 'intro', bars: 8 },
    { kind: 'chorus', bars: 16 }, { kind: 'verse', bars: 16 },
    { kind: 'bridge', bars: 8 }, { kind: 'chorus', bars: 16 },
    { kind: 'outro', bars: 8 },
  ], 3],
];

export const dnb: Genre = {
  id: 'dnb',
  label: 'Drum and bass',
  description:
    'A break at 174 and a sine wave under it — the warehouse, the chopped amen, the Reese and the designed bass, 1990 to 2018.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,

  /**
   * Never prepared, and here it is barely a claim: there is almost nothing to
   * prepare *with*.
   *
   * Across twenty-four style tables the dominant appears **nowhere**. The
   * harmony is `i`, `VI`, `VII` and `♭II`, and where it is richer it is `i9`,
   * `VImaj7` and `iv9` — modal, not functional, and borrowed from the jazz
   * records the samples came off rather than from any cadence. An applied
   * dominant in front of a drop would be the one leading tone in the genre.
   *
   * `keyChangeChance` is 0.01 in every era anyway, so this is mostly answering a
   * question nobody asks. It is set because the wrong answer would be audible in
   * the one style — `dancefloor` — whose major-key table has a `V` in it.
   */
  preparedModulation: false,

  /**
   * The keys are set by the loudspeaker and by nothing else, and this is the
   * most concentrated table in the project.
   *
   * Every other genre's key list is a compromise between what an instrument is
   * comfortable in and what a singer can reach. Neither applies here. There is
   * no instrument — the bottom of the record is a sine wave with a pitch
   * envelope, which is equally happy anywhere — and the singer, where there is
   * one, is a sample that gets pitched to fit. What decides the key is **which
   * fundamental a rig reproduces**, and that is a fact about ported cabinets:
   * F, F♯, G and E put the tonic between 41 and 49 Hz, which is where a
   * fifteen-inch driver in a horn-loaded box is loudest and where the note is
   * still a pitch rather than a thud.
   *
   * So the minor list is four keys carrying two thirds of the weight, and the
   * major list — which about a sixth of this catalogue ever reaches — is
   * inherited rather than chosen: those are the keys the sampled records were
   * in, which is to say the keys horn sections play in.
   */
  keys: {
    minor: [[5, 7], [6, 6], [7, 5], [4, 5], [0, 4], [9, 3], [2, 3], [10, 2], [3, 2]],
    major: [[5, 5], [10, 4], [3, 3], [0, 3], [7, 3], [8, 2], [2, 2]],
  },

  /**
   * It fades, and here that is not even a stylistic decision — it is what the
   * outro is *for*.
   *
   * Funk buttons: the band lands The One together and the drummer crashes over
   * it, because a genre organised around the downbeat cannot dissolve. Every
   * clause of that is false here twice over. There is no band to land together;
   * there is nothing for a final chord to be the arrival of, since the harmony
   * has been one chord since bar one; and, decisively, **the last sixteen bars
   * of one of these records are designed to be inaudible.** They exist so that a
   * DJ has somewhere to bring the next record in, and what happens to them is
   * that somebody turns the fader down. A crash on the end would be a crash
   * underneath somebody else's intro.
   */
  ending: 'fade',

  /**
   * Never counted in. There is nobody to count and nothing to count them into —
   * the intro is sixteen bars of drums that were already running before the
   * needle went down, and the first thing a listener hears is a loop mid-cycle.
   * Four clicks in front of that would announce a band that does not exist. See
   * `withCountIn`.
   */
  countIn: false,

  /**
   * `light`, matching jazz, funk and hiphop, and for the same underlying reason:
   * the intervals the rule table exists to suppress are this idiom's vocabulary
   * rather than defects in it. The overrides below do the genre-specific work,
   * and the first of them would otherwise have refused an interval two of these
   * styles are named for.
   */
  defaultStrictness: 'light',

  /**
   * `earworm`, and this genre is the second in the project whose *default* is
   * the top of the scale — hiphop was the first and the argument transfers with
   * one thing added.
   *
   * There the loop does not develop, so a generator that let the hook wander
   * would be writing a different piece over the same two bars. Here that is true
   * and there is a functional reason on top of it: a DJ mixing two of these
   * records together is relying on the second half of one being predictable from
   * its first half. A track that developed would be a track that could not be
   * mixed out of. **Six styles step down to `catchy`** — `jazzstep`,
   * `atmospheric`, `intelligent`, `liquid`, `sambass` and `deep` — and every one
   * of them has a progression underneath for a tune to be about.
   */
  defaultHook: 'earworm',

  /**
   * The loop does not get out of the way, because the loop is what the edits are
   * over.
   *
   * The same answer funk and hiphop give. A rhythm section that dropped back
   * under a solo here would be taking away the record. The two exceptions are
   * below and both are the same gesture — everything stops and one thing is
   * left, which is what the drum workout in the fourth form is.
   */
  soloBacking: 'full',

  /**
   * Who solos, and the answer is **the drums, by a margin no other genre comes
   * close to.**
   *
   * `drums` at 7 against hiphop's 5, which was itself the highest in the
   * project. Sixteen bars of kit alone is not a novelty in this music, it is the
   * thing the music is named after — `drumfunk` in `styles.ts` is a style that
   * exists because of it, and the section it fills in the fourth form is called
   * a *drum workout* by everybody who has ever played one.
   *
   * `comp` at 3 is the person at the table, and it is the nearest this project
   * gets to naming them: what happens in those bars is that somebody cuts the
   * loop, doubles it back and brings it in late, and the layer holding the loop
   * is the comp. The engine will render it as a keyboard solo. That is the
   * compromise and it is smaller than it sounds, because a chopped comp figure
   * over a running beat is structurally what the gesture is.
   *
   * `melody` and `counter` are near the bottom, which inverts every other genre
   * in the project. There is nothing here for a lead instrument to say at
   * length; a sixteen-bar melodic solo over a two-step is a different music, and
   * one this catalogue has a word for.
   *
   * `quoteMotto` at 0.7 is joint second in the project, level with indian's and
   * under finnfolk's 0.75. Cutting the hook back in over itself is what the
   * technique *is*, and a section that failed to restate the figure would be
   * somebody improvising, which nobody in this music does.
   * `tradeFours` at 0.05 is nearly off: trading is a conversation between two
   * players and there is at most one.
   */
  solo: {
    rotation: [['drums', 7], ['comp', 3], ['bass', 2], ['melody', 1.5], ['counter', 1]],
    tradeFours: 0.05,
    quoteMotto: 0.7,
    backing: {
      melody: 'full', counter: 'full', comp: 'full',
      // The two exceptions, and both are the same edit: everything goes and one
      // thing carries on.
      bass: 'sparse',
      drums: 'trade',
    },
    vocabulary: {
      gait: 0.35,
      // Above hiphop's 0.25, which was the previous high. A double-time run over
      // a half-time backbeat is not an escalation in this music, it is the
      // resting state — the hats are already there and the line joining them is
      // the gesture.
      doubleTime: 0.3,
      offbeatAccent: 0.72,
      // Nearly off. An enclosure is a bebop device for arriving at a guide tone,
      // and over one chord for thirty-two bars there is no guide tone to arrive
      // at.
      enclosure: 0.06,
      chromatic: 0.22,
      ornament: 0.12,
      develop: 0.45,
      displace: 0.6,
      // High, and higher than hiphop's. The gaps are the part of this music a
      // listener can actually describe.
      space: 0.45,
      // Two semitones. This line works one register; a climb is for a line with
      // somewhere to get to.
      climb: 2,
      paraphrase: 0.4,
      // Nearly off. The hook comes back over a beat that never stopped.
      liftIntoReturn: 0.08,
    },
  },

  /**
   * **The lowest comping numbers in the project, under hiphop's, and the reason
   * is one step further along the same line.**
   *
   * `CompingProfile` was written for a jazz pianist and its 0.18 / 0.3 / 0.25
   * exist because a comper who plays the same bar twice is more audible as a
   * machine than any wrong note. Funk inverts that at 0.04 / 0.14 / 0.05, on the
   * ground that the figure is the song. Hiphop goes further at 0.02 / 0.05 /
   * 0.02, because its comp layer is frequently a recording. **Here it is
   * frequently a single held chord that was drawn with a mouse**, and the
   * distinction from hiphop is real: a sampled loop at least contains a
   * performance somebody once gave, and a pad drawn into a piano roll contains
   * nothing that ever varied.
   *
   * `rest` at 0.015 is not zero for one reason, and it is the same one funk and
   * hiphop give with a third explanation: the bar the chord is *muted* is how
   * you know there is a hand on the desk. `anticipate` at 0.03 belongs to the
   * five styles that still have a keyboard player in them. `displace` at 0.01 is
   * as near off as this file gets — a sampled stab nudged a sixteenth is a
   * sampled stab with the timing wrong, and at 86 ms a sixteenth that is a
   * mistake sounds like a mistake.
   */
  comping: { rest: 0.015, anticipate: 0.03, displace: 0.01 },

  /**
   * Where this genre disagrees with the shared rule table.
   *
   * Eight entries. The first is the one that matters and it is not a preference:
   * without it the generator silently refuses an interval two styles here are
   * recognised by, with no error and nothing in the output to say what happened.
   */
  ruleOverrides: {
    /**
     * **The one that would have broken this genre in silence — twice, in
     * opposite directions.**
     *
     * `augmented-second` vetoes any move of one scale step and three semitones,
     * from strictness level 1 upward. It fires here on both halves of
     * `scaleForChord` and for unrelated reasons.
     *
     * In **`majorPentatonic`** it is arithmetic. The scale is 0, 2, 4, 7, 9, so
     * the third to the fifth is one step and three semitones, and so is the
     * sixth to the octave. Those are ordinary stepwise motion in the scale in
     * force, and the rule would have refused them at every strictness level this
     * genre ships at. Funk and hiphop both wrote this same paragraph about the
     * minor pentatonic.
     *
     * In **`harmonicMinor`** — which is `darkcore`'s override — the rule is
     * doing precisely what it was designed to do, and it is aimed at the one
     * interval that style exists for. A darkcore string stab sounds like a
     * threat rather than like a chord *because* of the augmented second between
     * the ♭6 and the ♮7; the rule correctly identifies it as the accident of
     * reaching for a raised seventh, and here it is not an accident.
     *
     * Disabled outright rather than softened, because there is no level at which
     * it is right in either place. `core/scale.ts` warns about exactly this
     * against the pentatonic rows.
     */
    'augmented-second': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    /**
     * Softened rather than disabled, and the difference from funk and hiphop is
     * deliberate.
     *
     * Both of those disable `chromatic-tone` outright, and both are right to:
     * their chord scale is five notes, so the blue notes they are built on are
     * outside it by construction. **Half of this genre's answer is seven notes.**
     * Over the natural minor the rule has something real to police — a note
     * outside the aeolian in a liquid tune is usually a mistake rather than a
     * colour — and it is only the major-pentatonic half where it misfires. So it
     * comes down to a preference at the top level rather than off, which is the
     * one setting that is honest about both halves.
     */
    'chromatic-tone': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.5 },

    /**
     * **A loop repeats more than any rule was built to expect, and this genre is
     * the extreme case in the project.**
     *
     * `repeated-note-run` vetoes three identical notes in a row at strictness 2.
     * `rollers` and `minimal` both write `melody.sequence: 0.94` — a hair under
     * the catalogue's highest — and `rollers`' own header says the melodic
     * content is a two-note motif restated ninety times; `neurofunk` is at
     * 0.92. Both rules are softened to a preference at the top level rather than
     * disabled, because a line here can still stall — it simply does so about
     * five times later than anywhere else.
     */
    'static-repetition': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.88 },
    'repeated-note-run': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.92 },

    /**
     * A seventh over a chord that lasts thirty-two bars resolves nowhere.
     *
     * The rule assumes a seventh is a dissonance under pressure, which is true
     * where the chord is going somewhere. On an `i9` that is the entire harmonic
     * content of a section the ♭7 is a *colour of the tonic*: it is in the pads,
     * it is where half the bass figures in `styles.ts` come to rest, and there is
     * nothing after it. Softened rather than disabled — `liquid`, `jazzstep` and
     * `intelligent` have real progressions and a seventh in one of those still
     * owes something.
     */
    'unresolved-seventh': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.8 },

    /**
     * The eleventh is the chord rather than an avoid note.
     *
     * `min11` appears in six style tables here and a sus voicing is the default
     * shape of a pad sitting over a sub — the fourth is what makes a chord read
     * as *wide* rather than as minor, which is most of what an atmospheric pad
     * is for. The rule is right for a singable idiom and right for jazz, which
     * tightens it; here it would file off the one extension this music reaches
     * for most.
     */
    'avoid-fourth': { minLevel: 4, vetoLevel: RULE_DISABLED },

    /**
     * **A pitched-up sample moves in parallel by definition.**
     *
     * The prohibition is choral and it is about two independent voices fusing
     * into one. Hiphop's defence is arithmetic — a chopped chord played up a
     * fourth is every voice in it moved up a fourth, because it is one recording
     * with the playback rate changed — and this genre's is the same statement
     * with a bigger number in it: the defining production move of 1992 is taking
     * a break *and the chord over it* up by a fifth of its own speed. Fifths,
     * fourths and octaves between consecutive fragments are not a voice-leading
     * decision that could have gone another way.
     *
     * Kept as a mild preference at the smoothest setting rather than disabled,
     * since the melody and the sub genuinely can fuse and that is still a fault
     * — and in this genre it is a worse one, because a melody that has fused
     * with a sine wave at 45 Hz has disappeared.
     */
    'parallel-perfects': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.5 },

    /**
     * A five-note scale makes the threshold wrong by a whole degree.
     *
     * `wide-leap` vetoes anything past a perfect fourth and was calibrated
     * against a seven-note scale where one step is a tone or a semitone. In
     * `majorPentatonic` one step is up to a minor third, so **two steps is a
     * perfect fifth** — ordinary stepwise motion by the scale in force. Left as
     * a penalty at the top two levels so a genuine jump is still caught, and the
     * counterweight is untouched: `leap-beyond-third` still vetoes at `polished`.
     */
    'wide-leap': { minLevel: 3, vetoLevel: 4, penalty: 0.5 },

    /**
     * The hook and the chord were not written at the same time, and frequently
     * not by the same person.
     *
     * `non-chord-tone-on-strong-beat` assumes the person writing the line knows
     * what is underneath it, which is the normal case and is false here by
     * construction: `scaleForChord` deliberately hands out a scale that does not
     * read the chord. The sixth landing on the downbeat of a `min11` is not a
     * lapse, it is why a fixed tonic scale was chosen. Softened at the top level
     * rather than disabled, because the six styles with real changes should
     * still be held to something.
     */
    'non-chord-tone-on-strong-beat': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.8 },
  },

  /**
   * Which devices this band uses, and `riff` is at the ceiling for the same
   * reason hiphop put it there.
   *
   * The pool describes `riff` as *the horns answer with one figure, restated,
   * instead of fresh stabs* — and here that is the mechanism the music is made
   * on rather than an arranging option. A sampler restating a figure is what a
   * sampler does, and there is no version of these records where the answer is
   * fresh material, because fresh material would have had to be played.
   *
   * `tutti` stays high because the drop *is* a tutti: everything arriving on one
   * downbeat is the single loudest event in the idiom. `trade` and `harmony`
   * come down hardest: handing a phrase from one player to another is a
   * conversation and there is one object on this stage.
   *
   * **`swell` keeps the pool's own 8**, which is the one weight here that was
   * written low and then corrected by measurement. The temptation is to read it
   * as hiphop does — a horn pad under a held melody note is a ballad device and
   * this catalogue has no ballad — and that reading is wrong about this genre by
   * the width of a whole section. The brass layer here is not a horn section; it
   * is the **string swell in the breakdown**, held under the tune while the kit
   * and the bass are gone, and it is on a very large fraction of the records
   * `atmospheric`, `liquid` and `dancefloor` are written from.
   *
   * `generateBrass` gives a punctuating note 0.75 beats and a swell
   * `beatsPerBar * 0.9`, so this weight is very nearly the whole of what
   * `npm run genres` measures as *"brass sustains as well as stabs"*. At
   * `swell: 2` this genre wrote **1% of its brass notes a beat or longer** — the
   * lowest figure in the project on the largest brass sample in it, which is how
   * one genre's arrangement table drags a catalogue-wide check under its
   * threshold.
   *
   * **The other half of that fix was in `styles.ts`, and it is the more honest
   * one.** Thirteen of the twenty-four styles now write `excludeLayers: ['brass']`,
   * because they do not have a brass layer in any sense — the object a listener
   * would call a stab in `techstep`, `jungle` or `jumpup` is a **chord**, and a
   * chord is the comp. The eleven that keep it are the ones where a horn section
   * or a string section is genuinely on the record. That took this genre from
   * being the largest brass emitter in the project to one of the smallest, which
   * is the correct description of a music with no horns in it, and it is a
   * better answer than writing sustain into a section that is not there.
   *
   * ## `harmony: 2` is the whole of the answer — there is no `HarmonyProfile`
   * here or on any of the twenty-four styles
   *
   * Half the device pool's own default of 4, in the lowest band in the project:
   * indian 0 by decision, arabic 1, then ambient, house and this at 2. A
   * `Style.harmony` **replaces** that draw rather than joining it, so declaring
   * one spends a weight deliberately written near the floor in order to assert
   * something stronger than the weight says — and both carriers
   * `HarmonyProfile.on` can currently name are wrong here for reasons already in
   * these tables.
   *
   * **`counter` in this genre is a sparkle rather than a second player.** The
   * celesta is in all four eras' counter palettes and leads three of them, and
   * the rest of the list is the glockenspiel, the kalimba, the harp, the music
   * box and the vibraphone. `mix.counter` is 0.42, the lowest in the project
   * after ambient's 0.24 — metal, whose `power` calls itself twin guitars in
   * thirds and weights this device at 8, mixes the same layer at 0.76 —
   * `solo.rotation` puts it last at 1 against the drums' 7, and
   * `EraProfile.sequenced` hands it to a sequencer in 0.2 to 0.45 of songs as
   * the eras run on.
   *
   * **And the scale would be wrong by an order.** A declaration covers the
   * statement rather than one phrase; `buildForm` doubles every non-intro
   * section above 160 BPM, so a chorus here is thirty-two bars; and **18 of the
   * 24 styles write `melody.sequence` at 0.8 or above**, `rollers` and `minimal`
   * at 0.94 over what their own headers call a two-note motif restated ninety
   * times. A parallel third under that for thirty-two bars is not a second
   * voice, it is a chorus pedal on the first.
   *
   * **`vocal` here is one fragment, not two singers.** `vocals.ts` settles what
   * sings in this music — a soul phrase cut at the syllable, pitched and
   * triggered, with the words removed by the editing rather than by the engine —
   * and `on: 'vocal'` writes a second line over the lead's own syllables, which
   * is a duet and is the one thing a chop is not. What that file actually asks
   * for is the opposite gesture and it records that no field spells it: *one
   * syllable, four times, on four different pitches*. Declaring it would also
   * cost the instrumental renderings something for nothing, since
   * `GenerateOptions.vocals` is absent by default and the draw above would be
   * switched off in every one of them.
   *
   * **What would have to be true.** `on` would have to name the brass layer. The
   * one place two sustained lines genuinely lie across each other on these
   * records is the string swell held under the tune in a breakdown — the
   * paragraph above, and the whole reason `swell` keeps its 8 — and
   * `generateBrass` opens by calling itself punctuation rather than a third
   * melody. Arabic's `zaffa` reached that same wall from the other side. What
   * looks two-voiced anywhere else here is a chord: the stab in `techstep`,
   * `jungle` or `jumpup` is the comp by the paragraph above, and the 1992 move
   * of taking a break *and the chord over it* up a fifth is one sampler moving,
   * which `parallel-perfects` argues at length in `ruleOverrides`.
   */
  arrangement: { riff: 8, tutti: 6, unison: 3, harmony: 2, trade: 1, swell: 8 },

  /**
   * **The bass and the drums are both above the tune. Hiphop is the only other
   * genre in the project where that is true of both at once, and by a much
   * narrower margin — 0.73 and 0.82 over a 0.62 melody, against 0.74 and 0.9
   * over 0.52 here.**
   *
   * Every number is stated against the shared defaults rather than against
   * another genre, since those are what an omitted layer gets. `bass` goes from
   * 0.50 to 0.74 — level with reggae's and joint highest in the project — and
   * `drums` from 0.59 to 0.9, which is the highest kit level anywhere and the
   * number that separates this genre from hiphop's 0.82. Hiphop's kit sits at 0.82 under a voice; here the name of the music
   * is the two loudest things in it, in that order, and there is no voice.
   *
   * `melody` comes down to 0.66, the lowest lead level in the catalogue outside
   * ambient's 0.54. That is not a mix preference, it is a description: the melodic
   * content of most of these records is a two-note fragment whose job is to
   * imply a key, and in the three neuro styles it is a bass patch's upper
   * harmonics wearing a melody layer's clothes.
   *
   * `pad` at 0.44 is above the seven genres that treat the wash as decoration —
   * funk at 0.34, then finnfolk, hiphop, latin, reggae, metal and arabic — level
   * with rock and below everything
   * else, and it is the one number here that goes *up* against hiphop. Six
   * styles in this catalogue are built on a wash, `atmospheric` and `deep`
   * require it outright, and `DROPS.breakdown` listens for it — a pad mixed as
   * decoration would make the genre's defining gesture inaudible.
   */
  mix: {
    // `melody` and `bass` carry the catalogue's 2 dB trim; see `gains` in generate/song.ts
    bass: 0.74,
    drums: 0.9,
    melody: 0.52,
    comp: 0.6,
    pad: 0.44,
    counter: 0.42,
    brass: 0.5,
  },

  /**
   * The kit, balanced for a music that is a kit and a sine wave.
   *
   * Four departures from the shared table. The **snare goes to 1.0**, level with
   * the kick, which no other genre does — in a two-step the snare on beat three
   * is the only event telling a listener where the bar is, and everything else
   * in the pattern is measured from it. The **hats go up to 0.62** from 0.5: at
   * 174 BPM sixteen of them a bar is the fastest layer in the project, and a
   * hat pattern mixed politely at that speed becomes a hiss rather than a
   * pattern.
   *
   * The **ride comes down to 0.2**, the lowest in the project, below hiphop's
   * 0.24. Two figures in twenty-four reach for it and both are in the jazzstep
   * corner; elsewhere a ride cymbal is an object this music does not own, and on
   * `MPC1000` — one of the era table's own machines — it does not exist at all
   * and resolves to an open hat, which is the right answer.
   *
   * The **crash comes down to 0.3**. A crash is how a band announces a section
   * and there is no band; where one appears in `styles.ts` it is a *reverse*
   * cymbal on the source recording, which is a wash rather than a hit, and it
   * should be felt rather than counted.
   *
   * The three hand-drum strokes take the shared curve unchanged. Those numbers
   * were set against the physics of the instrument rather than against any
   * genre, and the one style here that reaches them is `sambass`.
   */
  drumMix: {
    bd: 1.0, sd: 1.0, rim: 0.62, hh: 0.62, oh: 0.58, cp: 0.72,
    lt: 0.55, mt: 0.55, ht: 0.55, cr: 0.3, rd: 0.2, perc: 0.6, cb: 0.55,
    sh: 0.5, tb: 0.48, lp: 0.8, mp: 0.6, hp: 0.5,
  },

  /**
   * Register and response, and the second half says something no other genre in
   * the project does.
   *
   * The pad drops five semitones and the comp four. Both are further down than
   * hiphop's −4 and −3 and for a different reason: there the loop lives in the
   * same octave as the hook and has to be nudged out of the way; here the
   * problem is at the other end. A pad voiced low in this music collides with
   * the *sub*, and a chord tone at 60 Hz sitting on top of a sine at 45 does not
   * sound rich, it sounds out of tune — so the accompaniment is pushed down away
   * from the tune and then the whole stack sits above a bass that has the bottom
   * two octaves entirely to itself.
   *
   * `response` is where this is unusual. **`bass: 0.08` is the lowest number in
   * this field anywhere in the project** and it is not restraint, it is the
   * object: a sub is one sample triggered at one velocity and it does not know
   * which section it is in. `drums: 0.55` is high by comparison, which inverts
   * hiphop's ordering — the kit here really does change between the roll and the
   * drop, because a producer with sixteen samples on a drum bus rides them.
   */
  layerPlan: {
    offsets: { pad: -5, comp: -4 },
    response: { bass: 0.08, comp: 0.25, drums: 0.55, pad: 0.5, brass: 0.85 },
  },

  /**
   * A large room and a repeat that is part of the arrangement.
   *
   * `reverbSize` at 0.34 is well above hiphop's 0.2 and funk's 0.24, and the
   * disagreement is worth stating because it is the same argument reaching an
   * opposite conclusion. Both of those genres are dry because a tail on a
   * sixteenth-note hi-hat smears the sixteenths together. That is equally true
   * here and at twice the speed — and it is overruled, because **this music was
   * made for a warehouse** and the reverb is not an effect on the record, it is
   * the room the record was written for. The eras and the styles then pull
   * against it in both directions: `studio` and `design` take it back down for a
   * club system, and `dubwise` doubles it.
   *
   * The second half of hiphop's argument stands unchanged and is the reason this
   * is 0.34 rather than 0.5: **reverb and sub-bass cannot share a record.** A
   * tail under a note at 45 Hz is a note at 45 Hz that has not finished when the
   * next one starts, and the per-layer `effects` below take the bass out of the
   * room entirely.
   *
   * `delayBeats` at 0.75 — three sixteenths against a four-beat bar — is the
   * convention four other genres here already state, and at 174 BPM it is 259
   * ms, which is a slapback rather than an echo. The feedback is 0.3, which is
   * high for a dance genre and well under reggae's 0.55: the delay in this music
   * is inherited directly from dub and is a *compositional* object rather than a
   * room, but it is inherited at two and a half times the tempo, and a repeat
   * that survives four cycles at 174 has filled the bar.
   */
  space: {
    reverbSize: 0.34,
    delayBeats: 0.75,
    delayFeedback: 0.3,
  },

  /**
   * Standing production notes, refined by each era, and two of them are the
   * genre in one line each.
   *
   * **`lowpass: 700` on the bass, with no reverb and no delay at all.** The
   * darkest and driest bass treatment in the project. A sub is a sine wave with
   * a pitch envelope; everything above its second harmonic is the click of the
   * trigger, and everything in a reverb tail is the previous note still
   * sounding. Hiphop arrives at 900 for the same object and this goes lower,
   * because an 808 is a *drum* that happens to be pitched and this is a bass
   * that happens to have no attack.
   *
   * **`highpass: 120` on the drums**, which no genre in this project has ever
   * put on a kit. It is the mirror of hiphop's high-passed comp and it exists
   * for the same reason from the other side: the break already contains a kick,
   * because it is four bars of a finished record, and a sub is about to be put
   * underneath it. Two bass sources in the same octave is not a balance problem
   * that a fader solves — it is two notes disagreeing about what the root is. So
   * the bottom is taken off the drums, the sub takes the space, and what is left
   * of the break is its middle. That is the operation performed on every record
   * in this genre and it is why the drums sound the way they do from the waist
   * down.
   *
   * The comp and the pad are wet and dark; the melody and counter get a delay,
   * because a two-note fragment in this much space needs a repeat to read as an
   * event rather than as a mistake.
   */
  effects: {
    bass: { reverb: 0.0, lowpass: 700 },
    drums: { reverb: 0.12, highpass: 120, lowpass: 12000 },
    comp: { reverb: 0.3, delay: 0.16, lowpass: 8000 },
    melody: { reverb: 0.36, delay: 0.26, lowpass: 9000 },
    counter: { reverb: 0.42, delay: 0.3, lowpass: 8500 },
    pad: { reverb: 0.62, lowpass: 5000 },
    brass: { reverb: 0.3, lowpass: 8000 },
    vocal: { reverb: 0.44, delay: 0.24, lowpass: 7500 },
  },

  /**
   * The filter moves, and this genre is the third in the project to say so.
   *
   * Funk declined the field outright and gave the right reason for itself: its
   * gesture is a *wah*, which moves per note. Hiphop's is a hand on a low-pass
   * held for sixteen bars. This genre's is the same object as hiphop's with one
   * difference that matters — **it is the announcement of the drop.** The
   * breakdown comes in with everything filtered down to a murmur and the whole
   * record opens on one downbeat, and since `generate/drop.ts` will not mark the
   * return with a crash and `generate/tempo.ts` cannot ramp into it, this field
   * is carrying more of that gesture here than it carries anywhere else.
   *
   * `kind` puts the bridge at 0.3, which is the lowest single number any genre
   * writes in this table. That is the breakdown, and it is meant to sound like
   * somebody has their hand on the filter. The chorus is 1.0 — the drop is
   * wide open, always, with nothing held back — and the intro sits at 0.45
   * because a DJ intro is deliberately dull.
   *
   * `response` is where the field earns its place. **The comp and the pad swing
   * furthest and the bass does not move at all.** Closing a low-pass on a part
   * already below the cutoff removes it rather than darkening it, and a filtered
   * sub does not sound distant, it sounds absent — which would take the floor
   * out from under the exact section that is establishing one. `synth/berlin`
   * measured that and wrote it down; hiphop applied it to an 808 at `bass: 0.05`
   * and this goes to 0.02, because the object here is lower again.
   *
   * `build` at 0.3 is above hiphop's 0.22 and level with rock's and metal's. The
   * second drop being brighter than the first is not subtle in this music — it
   * is the arrangement — and this is one of the few places the engine can say so.
   */
  filter: {
    kind: {
      intro: 0.45, verse: 0.85, chorus: 1.0, bridge: 0.3, solo: 0.9, outro: 0.5,
    },
    response: {
      comp: 0.7, pad: 0.65, melody: 0.35, counter: 0.4, brass: 0.3,
      drums: 0.2, bass: 0.02,
    },
    build: 0.3,
  },

  /**
   * Four and a half to nearly seven minutes, and the second-longest band in the
   * project after house's.
   *
   * The bottom is set by the form rather than by taste. The shortest shape above
   * is seventy-two written bars, and twenty-one of the twenty-four styles double
   * every non-intro section, so that is a hundred and twenty-eight bars — at 174
   * BPM, a little under three minutes before the growth loop adds anything, and
   * it always adds. Measured over 192 songs the catalogue comes out at 221 to
   * 416 seconds, mean 314, on forms of 136 to 304 bars.
   *
   * That length is functional rather than indulgent. Two of those seven minutes
   * are the intro and the outro, which exist so that a DJ can spend a minute
   * bringing this record in and a minute taking it out, and a four-minute drum
   * and bass record is one that somebody has already edited for radio.
   */
  duration: [265, 405],

  /**
   * What the drummer plays into a section, and the loudest thing available is
   * silence.
   *
   * **`tom-roll` is absent entirely**, which only hiphop does elsewhere and here
   * the reasons stack up three deep. A descending run round the toms is a
   * dance-band gesture that announces the next section by getting louder across
   * four beats; nothing in this music has toms, nobody is playing them, and at
   * 174 BPM four beats is 1.4 seconds, which is not long enough for a run to be
   * heard as one.
   *
   * `drop` leads at 6 and it is doing more work in this genre than in any other.
   * The bar where everything stops is what makes the section after it land, and
   * with the mid-section return deliberately unmarked and the build unbuildable,
   * **this is the engine's only way to announce anything at all.** See the
   * header. `snare-roll` is second at 5 rather than at hiphop's 4, because the
   * roll into a drop is the one borrowed gesture this music kept and it is on
   * every record in the catalogue.
   */
  fills: [
    ['drop', 6], ['snare-roll', 5], ['lead-in', 3], ['snare-toms', 2],
  ],

  /**
   * What the tune is made of, and it is read against `scaleForChord` below.
   *
   * Three keys only — which *kinds* of tune, which *degrees*, and what this
   * music does to a figure. The six numbers `voiceForStyle` derives are left
   * where they are, because they are per-style here in a way the genre cannot
   * improve on: `melody.span` runs 10 in `neurofunk` and `minimal` to 17 in
   * `intelligent` and `sambass`, and `melody.sequence` runs 0.5 to 0.94. A
   * genre-level density or compass would erase the distinction those tables
   * were written to make. All twenty-four styles take this; none of them shares
   * an id with one of the three authored voices.
   *
   * ## The derivation reads this genre's loudest number backwards
   *
   * `archetypesFor` sets `descending-sequence` to `1 + melody.sequence * 3` and
   * `chant` to `0.5 + max(0, density - 2.2) * 0.6`. Run that over `rollers` —
   * cell density 1.35, `sequence` 0.94 — and it hands the style whose own
   * header says *the melodic content is a two-note motif restated ninety times*
   * a `descending-sequence` weight of **3.82, the highest of its six**, and a
   * `chant` weight of **0.5, which is the formula's floor**. That is exactly
   * inverted, and it is inverted for the eighteen styles at `sequence >= 0.8`,
   * because in this genre `melody.sequence` does not mean *a figure walked down
   * the scale*. It means *the fragment comes back unchanged*. Thirteen of the
   * twenty-four sit at 0.85 or above; the six at 0.5 to 0.7 — `jazzstep` and
   * `intelligent` joint low at 0.5, then `atmospheric`, `sambass`, `liquid`,
   * `deep` — are the composed corner, and they are the styles whose headers
   * claim a melody that answers itself instead of repeating.
   *
   * So `chant` leads and `descending-sequence` goes to the floor.
   * `ARCHETYPES.chant` is this music restated as an archetype — the gloss is
   * *one note repeated with a tail, the hook is the rhythm* — and its `judge`
   * lifts `figure` to 1.9 and `economy` to 1.7 while dropping `interest` to 0.5,
   * which is the same veto `ruleOverrides` lifts one layer down. **That override
   * is corroboration and not evidence.** Funk, finnfolk, hiphop, house, indian
   * and synth all soften `static-repetition` and `repeated-note-run` together,
   * and house's 0.9 / 0.92 is within a hair of the 0.88 / 0.92 here — the same
   * pair is cited under house's own `chant: 5`. What is this genre's alone is the
   * size of the object being repeated: `mix.melody: 0.52` above is argued as *a
   * two-note fragment whose job is to imply a key*, `rollers` says ninety
   * restatements in as many words, and ten of the twenty-four tables lead
   * `melodyCells` with the bare `[16]`, `minimal` weighting it 8 against a 4 and
   * a 3.
   *
   * `riff-response` is second, against a derived 0.60 to 2.22, and **the reason
   * it is not `arrangement.riff: 8` is that that weight is not about a tune.**
   * `NEEDS.riff` in `chart.ts` is the `brass` layer, thirteen styles here write
   * `excludeLayers: ['brass']` — including `jungle`, `rollers`, `neurofunk`,
   * `techstep`, `drumfunk` and `minimal` — so it cannot fire in over half the
   * genre, and where it does fire it draws a horn figure rather than the lead's
   * form. What argues the lift is `ARCHETYPES['riff-response'].judge`: `figure`
   * 1.8, `economy` 1.5, `freshness` **0.8** — a scoring profile that pays a
   * phrase for answering out of material it already has and declines to pay it
   * for finding new. `solo.quoteMotto: 0.7` is that as a section, and it is what
   * puts this above house's 3: the field defaults to 0 and house leaves it
   * unset, so a house solo never opens on the tune where seven in ten of these
   * do.
   *
   * `long-note` is third on the cells rather than on the prose: **fourteen
   * styles' `melodyCells` lead with `[16]` or `[-8, 8]`** — one note filling the
   * bar, or half a bar of rest and then one note — ten with the first and four
   * with the second, and `neurofunk`'s whole table is those two and `[-12, 4]`.
   * `deep`'s header says the melody is one note a bar.
   *
   * **2.5 is a cut at the sparse end and a lift at the dense one, and the lift is
   * the half that needs defending.** `minimal` derives `long-note` at 3.20 of a
   * 13.26 table and gets 2.5 of 14.9 — 24% of the draw down to 17%. The rise
   * lands on `hardcore`, `sambass`, `intelligent`, `jazzstep` and `liquid`, which
   * derive 0.40 to 0.57 off densities of 2.88 to 3.75. It is affordable because
   * `Archetype.density` is a multiplier on the style's own: at 0.45 against those
   * densities the archetype asks for **1.3 to 1.7 onsets a bar**, which is a held
   * note every beat and a half rather than an empty bar. Emptiness was never the
   * risk here — where it would have been, at `neurofunk` and `minimal`'s 1.0, the
   * genre weight is taking `long-note` *away*.
   *
   * `arch-hook` comes down from the derivation's flat 3. `dancefloor` writes a
   * hook everybody knows by the second listen and six styles step to
   * `hook: 'catchy'`, so it is real — but an arch rises to one high point and
   * comes off it, which is development, and `defaultHook: 'earworm'` above is
   * set precisely because a track that developed would be a track that could not
   * be mixed out of.
   *
   * `wide-interval` at 0.6 sits below every derived value in the genre, which run
   * 1.30 to 2.60, so it overrules rather than adjusts and **the style it costs is
   * `bleep`**: `leap: 0.42` is the highest in the file and its span of 16 is
   * second only to `intelligent`'s and `sambass`'s 17, so it derives 2.60 and is
   * held here at under a quarter of that. That is accepted, not
   * unnoticed — the archetype is glossed *a singer's tune, it leaps out and steps
   * home*, there is no singer on any of these records, and `solo.vocabulary.climb`
   * is 2 for the same reason: this line works one register. `jumpup` at 0.36 / 14
   * / 2.30 is the second-worst on paper and the cheapest in fact, because the
   * thing that leaps there is *a bassline that bounces in the octave above the
   * sub*, and no bass table reads this one.
   *
   * ## The twins, and they are separated by different keys
   *
   * This genre sits closest in the catalogue to **house** (0.095 on a
   * fingerprint of duration classes, interval classes, density and turn rate,
   * against a mean pairwise 0.382) and second-closest to **ambient** (0.116).
   *
   * **`subsets` separates it from house**, because that is the axis the two do
   * not already share. Both are 4/4 electronic dance music whose lead writes few
   * long notes, so duration and density are common by construction and neither
   * is a field this tier may set. What is not common is colour: a house tune is
   * a piano or organ figure over changes, and this one is a fragment over a
   * static `i`. **The two `scaleForChord`s are mirror images** — house is
   * `minorPentatonic` / `mixolydian`, five notes on the minor half and seven on
   * the major, and this file is the reverse — so an identical degree index means
   * a different note in each, and the separation is genuine rather than
   * typographical. Written against one scale the two tables would look closer
   * than they are.
   *
   * **The archetype table agrees with house at both ends, and that is a
   * description rather than an oversight.** `chant: 5` and
   * `descending-sequence: 0.8` are the same numbers in both files, reached
   * independently by reading the same derivation backwards on the same kind of
   * evidence; inventing a difference into them so the two tables looked separate
   * is the mannerism `docs/engine-gaps.md` §7 keeps naming. What the table does
   * carry is the middle — `riff-response` 4 against 3, `long-note` 2.5 against 4,
   * `arch-hook` 2 against 1.2, `wide-interval` 0.6 against 1.5 — and the largest
   * of those is `long-note`, held down here for the reason the next paragraph
   * gives.
   *
   * **`archetypes` separates it from ambient**, and it is one entry. Both write
   * a small number of long notes; the difference is that an ambient line has no
   * figure and this one is a figure restated. `chant` at the top over `long-note`
   * held at 2.5 is that sentence — held rather than raised, because `long-note`
   * is where the two genres genuinely agree and raising it would close the gap
   * the cells already open.
   *
   * ## The degrees, and the ♭6 decides all four
   *
   * The header's argument for handing the minor half seven notes is that
   * `minorPentatonic` has no ♭6 in it and *a genre whose entire emotional
   * apparatus is the flattened sixth cannot be handed a scale that omits it*.
   * That argument does not stop at the scale. **Three of the generic `SUBSETS`
   * omit degree 5 — the ♭6 in minor — and they carry 6 of that table's 14
   * weight**, so 43% of sections in this genre currently draw a colour the
   * header spent a paragraph refusing. Every entry below keeps it — and keeps
   * degree 6 with it, which leaves `darkcore`'s augmented second intact under all
   * four, since `harmonicMinor` puts the ♭6 and the ♮7 at exactly those indices.
   *
   * **What each entry does to the major half is not what it does to the minor
   * half, and it has to be written down.** `majorPentatonic` has five degrees, so
   * indices 5 and 6 do not exist and `snapToSubset` keeps only the survivors; its
   * floor is three pitch classes rather than five, so a five-degree subset over a
   * five-note scale does *not* go inert. **Entry one is the hardest collapse in
   * the table, at its heaviest weight**: `{0, 2, 4}` = 1̂ 3̂ 6̂, three pitch
   * classes and no fifth. Entry three keeps 1̂ 3̂ 5̂ 6̂ and entry four keeps
   * 1̂ 5̂ 6̂. **Entry two is the no-op** — all five survive,
   * `allowed.size >= scale.pcs.length`, and the note comes back untouched.
   *
   * That thinning is the right answer for a lead the mix note above calls a
   * two-note fragment whose job is to imply a key, and it is priced rather than
   * unnoticed: the mean minor share across the twenty-four `modeWeights` is
   * 0.799, so this lands on about a fifth of songs, times 4 of the 10.5 weight
   * below.
   */
  voice: {
    archetypes: [
      ['chant', 5],
      ['riff-response', 4],
      ['long-note', 2.5],
      ['arch-hook', 2],
      // The correction. Derived at 3.40 to 3.82 for the eighteen styles at
      // `sequence >= 0.8`, off a number that means restatement here rather than
      // a staircase.
      ['descending-sequence', 0.8],
      ['wide-interval', 0.6],
    ],
    subsets: [
      // 1 ♭3 5 ♭6 ♭7 — the pentatonic this genre would have had: five notes,
      // the fourth given up for the one degree the header says it cannot lose.
      // Leads because the melodic content is a fragment and a fragment lives in
      // five notes; the scale is seven so the ♭6 exists at all, not so the tune
      // uses everything. In major this is 1̂ 3̂ 6̂ and nothing else — see above.
      [[0, 2, 4, 5, 6], 4],
      // All seven. The header's minor-half decision unchanged, and the one entry
      // `snapToSubset` hands straight back over `majorPentatonic`.
      [[0, 1, 2, 3, 4, 5, 6], 3],
      // 1 ♭3 4 5 ♭6 ♭7 — everything but the second. `avoid-fourth` and
      // `unresolved-seventh` above are two arguments that the 4 and the ♭7 are
      // colours of the tonic here. The second is the degree with the least said
      // about it rather than one nothing wants: the header names it alongside the
      // ♭6 when it refuses `minorPentatonic`, and in `techstep`'s `phrygian`
      // override index 1 is the ♭2 that style is recognised by. The cost is
      // bounded, because that ♭2 is in a two-note *bass* motif and no bass table
      // reads `scaleForChord` or this.
      [[0, 2, 3, 4, 5, 6], 2.5],
      // 1 4 5 ♭6 ♭7 — no third, so no mode. **Not the `i11` pad's notes**:
      // `min11` is [0, 3, 7, 10, 17], which has the ♭3 this drops and lacks the
      // ♭6 this keeps. It is `autonomic`'s quartal stab and a lead that has
      // declined to say which mode it is in, which is why it is lowest — a corner
      // of the catalogue rather than its centre.
      [[0, 3, 4, 5, 6], 1],
    ],
    /**
     * `opsFor` weights these *within* an intent, so this table decides which
     * flavour of a development happens rather than whether one happens at all —
     * that is the archetypes' job, above.
     *
     * `displace` and `fragment` lead together because they are the two edits a
     * sampler performs. `jungle`'s header describes a break cut into sixteen
     * pieces and reassembled, with all three drum rows putting their displaced
     * snare in the second bar *because that is where a listener is told the
     * drums are being operated rather than played*; `solo.vocabulary.space` is
     * 0.45 and its note says the gaps are the part of this music a listener can
     * describe. Moving a figure and cutting it short are the only two ways this
     * music varies something without composing a second thing.
     *
     * **`displace: 1.8` has to answer `comping.displace: 0.01` a hundred lines
     * up, because that field is argued with the opposite instinct** — *a sampled
     * stab nudged a sixteenth is a sampled stab with the timing wrong*. Two
     * things differ and both are in the code. The comping number moves by a
     * sixteenth, 86 ms, which is inside the note and reads as a mistake; `opsFor`
     * only ever asks for `{ op: 'displace', by: 2 }`, an eighth at 172 ms, which
     * reads as a placement. And the op moves the lead's *whole figure*, where the
     * comping field moves one chord underneath a figure that stayed put.
     *
     * `diminish` is the genre's headline fact as an operator. The tempo is two
     * tempos — everything at or below the snare runs at 87 and everything above
     * it at 174 — and the melody cells sit on the slow side, at half and whole
     * notes. Halving them is the tune joining the hats, which
     * `solo.vocabulary.doubleTime: 0.3` calls the resting state rather than an
     * escalation.
     *
     * `transpose` is the one *up* that looks like a development and is not. Over
     * one chord for thirty-two bars a figure moved a scale step is the same
     * object at a different height, and it is the appetite the verbatim slot of
     * a `repeat` reads.
     *
     * Down: **`ornament`, and the mechanism sets the number rather than the
     * taste.** `ornamentOnce` inserts nothing — it takes the longest onset with
     * `dur > 3` and splits it in half — and `splits = max(1, round(amount * 2))`
     * over a `voice.ornament` that carries `melody.ornament` straight through at
     * 0.04 to 0.30 (`vary` floors it at 0.3) is **exactly one pass, every time**.
     * So on this genre's cells the op rewrites `[16]` as `[8, 8]` and `[8, 8]` as
     * `[4, 4, 8]`, which are rows those same tables already contain at weights
     * they already chose. It does not decorate the lead here; it re-draws the bar
     * as a cell the style deliberately ranked lower. Consistent with that, the
     * shortest note it can produce is 2 slots — an eighth, 172 ms at 174 — which
     * is the shortest positive value anywhere in the twenty-four tables. It
     * cannot write a sixteenth even once.
     *
     * `expand`, because the drop is not a wider version of the roll, it is the
     * same object arriving at once.
     *
     * **`invert`, and the number is smaller than its reach.** `motifFamily` picks
     * the answer motif from five op lists with `rng.pick` — unweighted, never
     * reading `voice.ops` — and two of those five are inversions, so the loudest
     * place this genre inverts anything is out of this table entirely. What 0.5
     * governs is `opsFor`'s `answer` and `develop` slots, and the argument there
     * is not that an inversion is fresh material: `motif.ts` says the opposite in
     * as many words, that the answer is derived from the hook *inverted,
     * fragmented, turned around — rather than invented separately*. It is that of
     * those three derivations, inversion is the one a listener cannot hear as the
     * same object — `fragment` at 1.8 keeps the notes and drops some, `displace`
     * keeps all of them and moves them, and an inverted contour keeps neither
     * pitch nor direction. Under `mix.melody: 0.52`, with a two-note fragment
     * doing all the identifying, that is the derivation nearest to composing a
     * second thing.
     *
     * `sequence`, for the reason `descending-sequence` is at 0.8.
     *
     * `reharmonise` is nearly off and the reason is airtight twice over. There
     * are no new changes to fit — seventeen of twenty-four styles' leading verse
     * table is a single chord for eight bars, and `scaleForChord` below does not
     * read the chord at all. And the op is inert catalogue-wide rather than only
     * here: it sets `Motif.resnap` and **nothing in `src/` reads that field**,
     * which jazz, classical, arabic and country have each recorded separately.
     * 0.2 rather than 0 because on the day it is wired up this genre still wants
     * it last.
     *
     * **`extend` is unreadable and `augment` is a decision**, and lumping the two
     * would hide that. `opsFor` multiplies by `voice.ops[ops[0].op]` — the
     * *first* op of an alternative — and `extend` never leads one, so any number
     * here would be a weight on nothing; `classical/index.ts:752` states the same.
     * `augment` does lead, at 2 in `close`, and it keeps the fallback of 1
     * deliberately: the other two `close` alternatives lead with `fragment`,
     * which this table already lifts to 1.8, so the cadence here is a *shortened*
     * figure rather than a stretched one and raising `augment` would spend one
     * instinct twice. The cells agree — they are already whole and half notes,
     * and `augment` scales `at` as well as `dur` and drops what lands past the
     * span, so on `[16]` it deletes rather than lengthens.
     */
    ops: {
      displace: 1.8,
      fragment: 1.8,
      diminish: 1.5,
      transpose: 1.4,
      invert: 0.5,
      expand: 0.5,
      ornament: 0.45,
      sequence: 0.4,
      reharmonise: 0.2,
    },
  },

  /**
   * The scale rule, and the chord is not a parameter it reads.
   *
   * See the header for the whole argument — including why the minor half is the
   * *larger* scale where hiphop's is the smaller one, and why two styles
   * override it rather than one or three. One line, no branch on the chord, and
   * the tonic follows a key change if there is one, which at a
   * `keyChangeChance` of 0.01 there almost never is.
   */
  scaleForChord: (tonic, mode) =>
    makeScale(tonic, mode === 'minor' ? 'minor' : 'majorPentatonic'),

  /** The unit, the rig and the flyer. See `staging.ts`. */
  staging: STAGING,
};
