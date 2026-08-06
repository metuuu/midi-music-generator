/**
 * The drop — what the band takes away for four bars in the middle of a section.
 *
 * Everything this engine can already say about *who is playing* is said at the
 * granularity of a section or coarser. `Style.excludeLayers` is a fact about the
 * whole catalogue entry; `Chart.layers` is a fact about a kind of section;
 * `Chart.enters` and `Chart.exits` move a layer in and out across the song's
 * sections, in one direction each, by an ordinal that is deliberately an integer
 * over sections and not a fraction inside one. Between them they can build an
 * arrangement and strip one, and neither can say **stop, and come back**.
 *
 * That sentence is a whole idiom's worth of music:
 *
 *  - **A dub.** Bass out for four bars, everything back — the single defining
 *    gesture of the form, and reggae's `dub` had to approximate it with a
 *    `break` transition at a seam it did not want, a filter ramp and a mood's
 *    `restraint`. Funk's `minneapolis` wanted the same thing and settled for
 *    one-onset bass tables, which is a thinner bass part rather than a bass part
 *    that stops.
 *  - **A drop in house or dnb**, which is this and `Chart.exits` in one gesture:
 *    the floor leaves, the wash carries, and the floor comes back all at once.
 *    Neither genre can be written honestly without it.
 *  - **And the thing the layered-ambient goal is made of.** The way to make
 *    music thin out under speech is to mute layers rather than pull a master
 *    fader, and the audition page's layer chips already do that at *playback*.
 *    What was missing was the *composition* being able to say so.
 *
 * ## A drop is an edit at assembly, not a hole in the composition
 *
 * The same line `generate/transition.ts` draws in its first paragraph, and drawn
 * here for the same reason. Nothing below writes a note, moves a note to a beat
 * it was not written for, or asks a part generator to leave a gap. Every layer
 * is one array in one coordinate space by the time this runs, so taking a span
 * out of one is `hush` — the pass a `break` already uses, imported rather than
 * copied, because two implementations of "take a part out for a span" would
 * agree today and drift by the second bug fixed in one of them.
 *
 * The consequence worth naming is that **the return is not marked**. No crash
 * lands on the bar the band comes back in, because writing one would be
 * authoring an event that was not going to exist, which is the one thing an edit
 * pass may not do. The return is heard because everything arrives at once, on a
 * phrase boundary, which is how it is heard on the records.
 *
 * ## Who declares one, and why it is the style and nothing else
 *
 * `Style.drops`, a weighted palette, with no `Genre` half and no `Mood` bias.
 * Three fields already answer the genre ← style ← mood merge and they answer it
 * three different ways, so the seam is a choice rather than a convention:
 *
 *  - `fills` and `transitions` fall back to a genre palette, because a fill
 *    vocabulary and a seam vocabulary are claims about *how a band in this idiom
 *    plays*, and those travel across every style in the idiom.
 *  - `feels` falls back to a genre table for the same reason at one remove.
 *  - `breakCarrier` has **no** genre half, and its comment says exactly why: *"a
 *    palette is a claim about a band's vocabulary and travels well; a carrier is
 *    a claim about one piece's texture and does not."*
 *
 * A drop is the second kind. A dub *is* a style — King Tubby did not mute the
 * bass because that is what reggae does, he did it because that is what a dub
 * is, and the same genre contains `nyabinghi`, which would be vandalised by it.
 * Finnish folk makes the same point structurally: one genre holding both
 * `hidasvalssi`, whose bass states every downbeat, and `piirileikki`, which
 * declares `excludeLayers: ['bass', …]` and has no bass to take away. A
 * genre-level answer is wrong for one of any such pair whichever way it is
 * written.
 *
 * And no `Mood` bias, which is the one that had to be argued rather than
 * inherited. `mood.feelBias` exists because how hard a band leans is a matter of
 * temperament; a drop is not a temperament, it is a *form gesture*, and the
 * thing restraint already does to a texture it does through `layersFor`, once,
 * for the whole song. A restrained mood that also dropped more would be saying
 * the same thing twice in two units.
 *
 * ## One per song
 *
 * `generate/chart.ts` settled this argument for the whole engine and it applies
 * here unchanged: *"a surprise that arrives on schedule four times is a
 * texture."* A band that drops out of every chorus has not made a gesture, it
 * has an arrangement with holes in it — which is `Chart.layers` and is already
 * sayable. So the draw is one draw, for the whole song, and where it lands is
 * *placed* rather than drawn. See `planDrop`.
 *
 * ## Determinism
 *
 * **A style with no `drops` palette takes no number out of any stream**, which
 * is the property the whole wave is judged on and the reason `planDrop` returns
 * before its first draw. `Style.feels` spends a paragraph defending exactly this
 * and `generate/song.ts`'s `drumSource` note records what one consumed draw cost
 * the last time somebody was casual about it: every song in every genre, and a
 * check falling from 66% to 59%.
 *
 * A style that *does* opt in draws once, from `${seed}:drop`, a stream nothing
 * else reads. So opting one style in cannot move another style's songs either,
 * and inside an opted-in song the drop cannot reshuffle the tune, the groove or
 * the instrumentation — it only removes what those wrote.
 */

import type { LayerId, Section, Song } from '../core/types.js';
import type { Rng } from '../core/rng.js';
import { hush } from './transition.js';

/**
 * The shapes a drop can take. Two, plus the identity.
 *
 * Kept to the gestures that were actually reported, on `style/feel.ts`'s
 * reasoning about its own library: the risk is not a short list, it is a long
 * one applied liberally until every genre sounds like the same record. Each
 * entry names what it takes away and what it is heard against, and those two
 * lists are the whole of it.
 */
export type DropId = 'none' | 'dub' | 'breakdown';

/**
 * The layers a drop may take away.
 *
 * `LayerId` minus the tune and its double, written as a type so that
 * `removes: ['melody']` is a compile error rather than a rule somebody
 * remembers — the same device `FeelLayer` and `BreakCarrier` use, and for the
 * same reason both of those give: the failure is silent when it happens.
 *
 *  - **`melody`** is what a drop is heard *against*. The band thins and the tune
 *    carries on over the top of it, and the thinness is audible because there is
 *    still something to be thin behind. A span with the tune taken out of it is
 *    not a drop, it is an instrumental passage, and which sections have a tune in
 *    them is `layersFor`'s decision rather than this one's.
 *  - **`vocal`** is the melody doubled after swing — it has no onset the melody
 *    did not have. Naming it separately could only ever mean *the singer stops
 *    while the instrument playing their line carries on*, which is the one thing
 *    `vocal` is defined as not being. It goes wherever the tune goes, and the
 *    tune does not go.
 */
export type DropLayer = Exclude<LayerId, 'melody' | 'vocal'>;

/**
 * What a drop is heard against — the witness, and the safety rule.
 *
 * This is `Chart.exits`' melody guard, generalised, and the generalisation is
 * the load-bearing part of this file. That guard reads
 * `here.includes('melody')`: a layer may only be taken away where something else
 * is guaranteed to sound, and there the only guaranteed something available was
 * the tune. It came out of measurement rather than design — without it a
 * finnfolk kantele piece lost its pad from a melody-less bridge and the section
 * went completely silent, one silent section in 2800 songs, which is one too
 * many because a section is a claim that something happens.
 *
 * **A drop hits that wall much harder**, for two reasons at once: it removes
 * layers for bars rather than for sections, so the surviving part has to be
 * sounding *in those particular bars*; and it may remove several layers at once,
 * so "the rest of the band" is not an answer. Four bars is a long time for a
 * tune that plays eight notes in three minutes.
 *
 * So the rule splits in two, and the split is the point:
 *
 *  - **the witness** — a named layer, per shape, that must be in the section's
 *    `activeLayers`. Named rather than searched, exactly as `Style.breakCarrier`
 *    is named rather than searched, and for the reason argued at length there:
 *    from inside a pass that may not read a note, a tanpura drone and a walking
 *    bass are both `bass` with some notes in it, and the table that wrote the
 *    style knows which one it is. Different drops are heard against different
 *    things — a dub against the kit and the skank, a breakdown against the wash
 *    — so one hard-coded answer would be wrong for one of them.
 *  - **the tune rule**, kept verbatim from `exits` and now doing a *musical*
 *    job rather than a safety one: the section has to state the tune. See
 *    `planDrop`.
 *
 * The union excludes three values, and each exclusion is somebody else's
 * measurement rather than a taste:
 *
 *  - **`counter` and `brass`** are the only two layers whose membership of a
 *    section's `activeLayers` moves when `--hook` does — 286 and 3 of 7354
 *    sections, against zero for every other layer, because one answers the
 *    melody's gaps and the other is placed around it. Every question this file
 *    asks is stated against `activeLayers`, and a witness drawn from those two
 *    would put *whether the drop happens at all* on the wrong side of the
 *    guarantee that `--hook` is an A/B control. `genre-check.ts` asserts drum
 *    events byte-identical between `through` and `earworm`, and a `breakdown`
 *    removes drums, so this is not a stylistic worry — it is the difference
 *    between a green check and a red one.
 *  - **`vocal`** never appears in a layer plan at all. A style naming it would
 *    get no drop for the length of the catalogue while its table looked like it
 *    was working, which is the failure mode `BreakCarrier` excludes it against.
 *
 * `drums` **is** allowed here, which is the one place this union is wider than
 * `BreakCarrier`'s. A break silences the kit by definition, so naming the kit
 * there would be asking for a gesture and its negation in one word; a drop makes
 * no such promise, and the thing a dub is heard against is precisely the one
 * drop and the hats carrying on while the bass is gone.
 */
export type DropWitness = Exclude<LayerId, 'counter' | 'brass' | 'vocal'>;

export interface Drop {
  id: DropId;
  label: string;
  /** One line, for the README and the audition page. */
  description: string;
  /**
   * Which layers leave. Empty is the identity — see `none`.
   *
   * They leave together and they come back together. A staggered return is a
   * *build*, which is a different gesture wanting a different mechanism: half of
   * a build is a tempo ramp, and `docs/engine-gaps.md` §1.1 recorded that the
   * tempo **was** a scalar drawn once per song and reached the IR, both
   * renderers and the concert clock.
   *
   * **That half has since been built**, and the sentence is kept in the past
   * tense because the conclusion outlived its reason. §1.1 is closed;
   * `SongMeta.tempo` is a `TempoMap`, a list of breakpoints, and `meta.bpm`
   * means *the tempo the band counts off*. What still stops a build being
   * written here is an **ordering** constraint rather than an expressiveness
   * one, and it is the sharper of the two: everything in `generate/tempo.ts`
   * runs before the form exists, because `buildForm` divides by the tempo to fit
   * `Genre.duration` — `planRamp` draws, `buildForm` runs, `rampMap` realises
   * the curve once `totalBars` is known — and `planDrop` runs some three hundred
   * lines after that, because it has to be on the far side of the soloist's
   * rewrite of `activeLayers`. A build has to *arrive at* the drop, so it wants
   * a second planner beside `planDrop` appending points to the map that is by
   * then already made, which is exactly what a list-shaped IR was chosen for.
   * Writing a half-build here would still be claiming the gesture in a file that
   * cannot finish it. See *A build cannot be planned in this file* in
   * `generate/tempo.ts`, which states the same ordering from the other end.
   */
  removes: readonly DropLayer[];
  /**
   * The layer this drop is heard against, which must be sounding in the section
   * for the drop to be placed at all. See `DropWitness`.
   */
  under: DropWitness;
  /**
   * How long the band is out, in bars — and, because both edges of the span are
   * aligned to it, the phrase length this gesture is counted in.
   *
   * Four in both shapes below, which is what a dub is on the records and is the
   * shortest span at which a listener stops hearing *somebody dropped a bar* and
   * starts hearing a decision.
   *
   * **It is also the field most likely to be wrong**, because it is half a
   * statement about the idiom and half a statement about the *form the engine
   * builds*, and only the first half belongs in a library. `planDrop` needs
   * three of these inside one section — a phrase of band, the drop, a phrase of
   * band back — so four bars means a twelve-bar floor. Measured by opting styles
   * in one at a time over 200 songs each: a sixteen-bar form places one in
   * essentially every song (reggae `dub` 200/200, jazz `bebop` 200/200, synth
   * `berlin` 197/200), and **a style whose sections are all eight bars places
   * none at all** — funk `minneapolis` 0/200, iskelmä `humppa` 0/200.
   *
   * `minneapolis` is named in `docs/engine-gaps.md` §1.2 as one of the two
   * styles that asked for this, so a shape that cannot reach it is a mechanism
   * that looks like it works and does nothing, which is the failure mode
   * `BreakCarrier` excludes `vocal` against. That is what `Style.dropBars` is
   * for: the shape says what a dub *is*, and the style says how long a phrase is
   * in the music it actually writes.
   */
  bars: number;
}

/**
 * Which drops a style's band plays, weighted, drawn once per song.
 *
 * The `none` entry is what carries *how often*, and it is a real member of the
 * table rather than a separate `chance` field for the reason `style/feel.ts`
 * gives about `straight`: a weighted table is the units a style already writes
 * its answer in, and `[['none', 3], ['dub', 1]]` says "one number in four is a
 * dub" without introducing a second kind of number that has to be kept
 * consistent with the first.
 *
 * **Absent is not the same statement as `[['none', 1]]`.** A style that names
 * `none` alone has been asked and said no; a style with no palette has not been
 * asked, draws nothing, and generates the song it generated before this file
 * existed, bit for bit. Both make identical music. Only the second takes no
 * number out of the stream.
 */
export type DropPalette = (readonly [DropId, number])[];

/**
 * A drop and the bars it covers.
 *
 * The same shape as `FeelSpan`, deliberately, because it is the same kind of
 * statement — half-open absolute bar indices, so `score.ts`, the concert
 * renderer and anything else reading the IR can say what is happening at bar 12
 * the way it already can with `chordLabels` and `feels`. A span rather than a
 * section is the entire content of this feature: `Chart` already owns the
 * section-shaped answer and its ordinal is an ordinal over sections, which is
 * the right thing for it to be and the reason it cannot express this.
 *
 * The layers are carried resolved rather than left to be read back out of
 * `drop.removes`, because what a section actually loses is the removal list
 * intersected with what was playing, and a reader wanting to draw a mute
 * automation lane wants the second one.
 */
export interface DropSpan {
  /** Absolute bar indices, half-open. */
  from: number;
  to: number;
  drop: Drop;
  /** Which layers this section actually loses — `removes` ∩ `activeLayers`. */
  layers: LayerId[];
}

/**
 * The library.
 *
 * Two gestures and an identity, and the shortness is the argument rather than a
 * placeholder. `docs/engine-gaps.md` §1.2 was assembled from ten genre authors
 * reporting what they could not express, and it names exactly two — the dub and
 * the dance-record drop. A third invented here would be a shape nobody asked
 * for, enabled by nobody, measured against nothing, and it would still have to
 * be maintained.
 *
 * **One shape was written, tried and deliberately left out**, because the
 * refusal is the more useful record. *Stop-time* — everything out but the tune
 * for two bars, which is `break`'s gesture moved off the seam and into the
 * middle of a section — is a real thing bands do and it is the one entry whose
 * witness could only be `melody`. That is measurably the worst witness there is:
 * `playBreak` counted the bars that come out with nothing sounding at all over
 * 10517 drawn breaks, and `melody` produced 1047 of them against `pad`'s 0,
 * because *a tune that has finished its phrase is precisely what is not there*.
 * A break survives that by being one bar at a seam, where the arrangement is
 * about to change anyway. A four-bar hole in the middle of a section does not.
 * The shape wants the tune's actual onsets consulted, and this pass may not read
 * a note — see `DropWitness`.
 */
export const DROPS: Record<DropId, Drop> = {
  /**
   * The identity. Nothing leaves, so applying it is a no-op down the same code
   * path every other entry takes.
   *
   * It exists so that a palette can say *how often* in the units a palette
   * already has, and so that a style whose answer is "rarely" writes one table
   * rather than a table and a probability. `straight` in `style/feel.ts` is the
   * same object for the same reason, with one difference worth admitting: a
   * humppa naming `straight` is making a positive claim about humppa, and a
   * style naming `none` is only saying *not this time*. The identity earns its
   * place here on the arithmetic rather than on the musicology.
   */
  none: {
    id: 'none',
    label: 'None',
    description: 'The band plays the section through. What every style in the catalogue did before drops existed.',
    removes: [],
    under: 'melody',
    bars: 4,
  },

  /**
   * The bass goes and the kit keeps time.
   *
   * The gesture `docs/engine-gaps.md` calls the canonical case, and the one the
   * catalogue has already tried twice to fake. What makes it a dub rather than a
   * thin bar is that the *floor* is still there: one drop, hats, and the skank
   * on the offbeats, with the hole where the root was. That is why the witness is
   * `drums` and not `comp` — a reggae style can exclude the comp layer outright,
   * and none of them excludes the kit.
   *
   * Four bars, which is the length it is on the records, and it is also the
   * shortest span at which a listener stops hearing *the bass player dropped a
   * bar* and starts hearing a decision. Two bars of missing bass under a walking
   * line reads as a mistake; four reads as the mix.
   */
  dub: {
    id: 'dub',
    label: 'Dub',
    description: 'The bass drops out for four bars and the kit keeps time. The hole where the root was.',
    removes: ['bass'],
    under: 'drums',
    bars: 4,
  },

  /**
   * The floor goes and the wash carries.
   *
   * The dance-record gesture, and the reason it is `drums` *and* `bass` rather
   * than either alone: what leaves in a breakdown is the thing you dance to,
   * which is those two as one object. Take only the kit and the bass line
   * carries on stating the time, which is a different and much smaller gesture;
   * take only the bass and it is a dub.
   *
   * The witness is `pad`, which is the strongest one available and is what
   * `playBreak`'s measurement already showed: over 10517 drawn breaks the pad was
   * the only carrier that never left a bar with nothing in it. A wash is long
   * notes on downbeats — it is sounding at every point in the span almost by
   * construction, which is what a witness has to be when the span is four bars
   * instead of one. The tune is over the top of it as well, because the tune rule
   * in `planDrop` guarantees that separately, but the tune is not what is being
   * relied on.
   *
   * `comp` deliberately stays. A breakdown with the chords still moving is what
   * a house record does under the filter, and taking those as well would leave a
   * pad and a tune, which is not a breakdown, it is an ambient interlude.
   */
  breakdown: {
    id: 'breakdown',
    label: 'Breakdown',
    description: 'The kit and the bass leave together for four bars; the wash and the tune carry, and everything returns at once.',
    removes: ['drums', 'bass'],
    under: 'pad',
    bars: 4,
  },
};

/**
 * Where the band drops out, if it does.
 *
 * One draw and then arithmetic, and the division is the same one `Chart.exits`
 * made: **what** the gesture is comes out of the style's table, and **where** it
 * goes is placed from the form rather than drawn. `planExits` states the reason
 * and it is stronger here, not weaker — a blind draw over a section's bars would
 * put a drop in the first phrase as readily as the penultimate one, and *the
 * band has not started yet* and *the band drops back before the last phrase* are
 * two different pieces of music out of one number. It also keeps the property
 * that made `exits` safe to add: the placement consumes no random number, so the
 * only draw in the whole feature is the one that picks the shape.
 *
 * ## Where it may land
 *
 * A drop that can start anywhere is a drop that will start in the wrong place.
 * Four rules, and each removes a specific way of being wrong:
 *
 *  - **Inside one section, never across a seam.** A span crossing a join is two
 *    gestures — the arrangement changing, which every section boundary does
 *    anyway, and the band leaving — and a listener cannot separate them.
 *  - **Both edges on the phrase grid.** The span starts at a multiple of
 *    `drop.bars` from the section's own start and is `drop.bars` long. A drop
 *    that begins on the third bar of a four-bar phrase is not syncopation, it is
 *    a tape edit.
 *  - **A whole phrase of band before it.** The gesture is subtraction, and
 *    subtraction needs a minuend: the band has to have been heard playing this
 *    section before it can be heard leaving it. Starting at bar 0 would also put
 *    the edge exactly on the seam the transition machinery owns, which is the
 *    next rule.
 *  - **A whole phrase of band after it, inside the same section.** This is the
 *    important one, and it is the answer to *whether the return may coincide
 *    with a seam*. **It may not**, for two reasons that point the same way.
 *
 *    The mechanical one: every transition kind edits the last bar before a join —
 *    `playShot` replaces it, `playBreak` empties it, `playElide` moves the first
 *    onset across it — and two passes editing the same bar is how the double
 *    swing bug in `Feel.swing` happened. Ending the drop a full phrase early
 *    means the two can never meet, structurally rather than by a check.
 *
 *    The musical one is the reason the mechanical one is not a compromise. A
 *    return that lands on a section boundary is inaudible *as a return*, because
 *    the arrangement changes there in every song ever generated by this engine —
 *    the layer plan is per section kind, the dynamics step, the drummer fills.
 *    The band coming back is only heard as the band coming back if what comes
 *    back is what was already playing, into a section that is still running. So
 *    the drop is the penultimate phrase and the return is the last one, which is
 *    also where it is on the records.
 *
 * Together those put a floor of `3 × drop.bars` on a section's length, and where
 * a section clears it by more than one phrase they leave several legal starts.
 * The **latest** is taken rather than drawn between, which is the second half of
 * placing instead of drawing: a drop is a back-half gesture, the phrase after it
 * is the last one in the section, and a number picked from the legal set would
 * be saying that those starts are interchangeable. They are not — a drop in the
 * second phrase of a thirty-two-bar chorus and a drop in the seventh are the
 * same edit and two different pieces of music.
 *
 * ## Which section
 *
 * The **last** eligible one, placed for `exits`' reason — a drop is a back-half
 * gesture and the return is the lift into the end of the record — and eligible
 * means four things, all of them asked of the layer plan and the form and none
 * of them of a note:
 *
 *  - **The witness is playing.** `DropWitness` argues this at length; it is the
 *    melody guard's safety half, named per shape.
 *  - **The section states the tune.** The melody guard's other half, kept
 *    verbatim from `playing()` in `chart.ts`, and here it is a musical rule
 *    rather than a safety one: a drop is a gesture *about* the melody, the tune
 *    carries on over the top of it, and a bridge or an intro with no tune in it
 *    is not a section the band can be heard dropping out of. It is also free
 *    insurance — two independent layers are then guaranteed to be listed.
 *  - **Nobody is soloing.** A section with a chorus in it already has a written
 *    answer to *what the rest of the band does underneath*, which is
 *    `SoloAssignment.whilePlaying` and `Genre.soloBacking`, and it is the same
 *    question this file is answering. Two mechanisms subtracting layers from the
 *    same bars would be arguing, and the soloist's own layer could be one of the
 *    ones removed. Cheap to refuse and there is no case for allowing it.
 *  - **It is long enough**, per the phrase rules above.
 *
 * Every one of those is hook-invariant. `--hook` is documented and asserted to
 * be an A/B control on the tune; the four questions here are about
 * `activeLayers` membership for layers measured never to move with it, about
 * `Section.lengthBars`, and about the solo plan, which is drawn before the tune
 * exists. That matters concretely rather than tidily: a `breakdown` deletes drum
 * events, and `genre-check.ts` asserts drum events byte-identical across hook
 * levels.
 *
 * Returns `undefined` — having drawn nothing at all — for a style with no
 * palette, which **was** every style in the catalogue on the day this shipped
 * and is 360 of the 389 now. The twenty-nine are reggae's `dub` and funk's
 * `minneapolis`, the two that reported the gap, plus ten dnb styles and
 * seventeen house ones written later against a mechanism that already existed.
 * The sentence is kept in the past tense rather than deleted because the
 * before-the-first-draw `return` above is what the determinism note at the top
 * of this file is judged on, and the 360 are the ones still proving it.
 */
export function planDrop(args: {
  rng: Rng;
  palette: DropPalette | undefined;
  /**
   * How long a phrase is in this style, overriding the shape's own. Read, never
   * drawn — see `Style.dropBars`, which is where the argument for it lives.
   */
  phrase?: number;
  sections: readonly Section[];
  /** Indices of sections somebody is soloing over. */
  soloAt: ReadonlySet<number>;
}): DropSpan | undefined {
  const { rng, palette, sections, soloAt } = args;
  // Before the first draw, and that placement is the whole of the acceptance
  // criterion for this wave. See the determinism note at the top of the file.
  if (!palette?.length) return undefined;

  const drop = DROPS[rng.weighted(palette)];
  if (!drop.removes.length) return undefined;

  // Floored at one rather than trusted, because every arithmetic rule below is
  // stated in multiples of it and a zero would divide the phrase grid by
  // nothing. A style asking for less than a bar is asking for an articulation,
  // which is `Feel`'s half of the project.
  const bars = Math.max(1, Math.floor(args.phrase ?? drop.bars));
  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i]!;
    if (soloAt.has(i)) continue;
    if (section.lengthBars < bars * 3) continue;
    if (!section.activeLayers.includes(drop.under)) continue;
    if (!section.activeLayers.includes('melody')) continue;

    /**
     * What this section actually loses, which is not always what the shape asks
     * for. A style may exclude a layer, the chart may never have put one in this
     * kind of section, and `Chart.exits` may have taken one away several
     * sections ago — so the removal list is intersected with the layer plan
     * before it is published, and a section with nothing to lose is not a place
     * a drop can happen.
     *
     * This is the one place the intersection is read for a *decision*, and it is
     * safe for the reason `DropWitness` gives about `counter` and `brass`:
     * neither appears in any shape's `removes`, so nothing here can move when
     * `--hook` does. A shape that named one would still be correct in its edit —
     * removing a layer that is not there removes nothing — and would put this
     * `continue` on the wrong side of the guarantee. Keep them out of `removes`.
     */
    const layers = drop.removes.filter((l) => section.activeLayers.includes(l));
    if (!layers.length) continue;

    // The latest phrase-aligned start with a phrase of band on each side of it.
    // The length gate above is exactly the condition that this is at least
    // `bars`, so there is no empty case to handle.
    const start = Math.floor((section.lengthBars - bars * 2) / bars) * bars;
    const from = section.startBar + start;
    return { from, to: from + bars, drop, layers };
  }
  return undefined;
}

/**
 * Take the band out for the span, and put it back.
 *
 * "Put it back" is not a step: the parts were written whole and only the span is
 * removed, so what happens at `span.to` is the arrangement resuming exactly as
 * it was written. That is the property that makes this cheap and it is also the
 * musical claim — the return is the same band playing the same figure, which is
 * what a listener recognises, and anything reconstructed at the boundary would
 * be a different band arriving.
 *
 * ## A sequencer goes out with everybody else
 *
 * The one place this disagrees with `playBreak`, which skips `Track.machine` on
 * the reasoning that *nobody's hands are on it, so it neither stops nor plays a
 * break*. That is right about a break, which is the band stopping — a human act
 * that a machine is not party to.
 *
 * A drop is not that act. It is a channel being muted, and the hand doing it is
 * the engineer's: King Tubby did not ask the bass player to stop, he pulled the
 * bass fader on somebody else's tape. That hand reaches a sequencer's channel
 * exactly as it reaches a bass amp's, and a drop that left the machine running
 * would be a drop with the arpeggio still in it — which is precisely the thing
 * the gesture exists to remove in the two genres that asked for it.
 *
 * ## The kit is emptied outright
 *
 * No `SeamOrchestration.survives` exception, unlike a break's single bar. That
 * exception is about a stroke that goes on sounding after the hands have
 * stopped, and it is worth having across one bar at a seam where the cymbal
 * belongs to the landing that just happened. Across four bars in the middle of a
 * section there is no landing to spare, and a cymbal ringing on into a
 * breakdown's second bar is a drummer who has not stopped.
 */
export function applyDrop(song: Song, span: DropSpan): void {
  const bpb = song.meta.beatsPerBar;
  const from = span.from * bpb;
  const to = span.to * bpb;
  const gone = new Set<LayerId>(span.layers);

  for (const track of song.tracks) {
    if (!gone.has(track.layer)) continue;
    track.notes = hush(track.notes, from, to);
  }
  if (gone.has('drums')) {
    song.drums.events = song.drums.events.filter(
      (e) => !(e.beat >= from - 1e-6 && e.beat < to - 1e-6),
    );
  }
}
