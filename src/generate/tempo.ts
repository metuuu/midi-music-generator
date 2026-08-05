/**
 * The tempo ramp — what the band does when it does not play to a click.
 *
 * `bpm` was a range drawn once per song and used as a scalar everywhere after,
 * and `docs/engine-gaps.md` §1.1 has been the largest open blocker on that list
 * since it was written. Its evidence is the strongest kind this project
 * collects, which is two authors finding the same wall without conferring:
 *
 *  - **A qawwāli accelerates across its length.** Not as an effect at the end —
 *    across the whole of it, gathering, and that is what the form *is*. Indian
 *    wrote the compromise down.
 *  - **The pelimanni repertoire does the same thing**, more modestly, and finnish
 *    folk wrote the same comment.
 *  - **A build in house or dnb is a tempo-and-density ramp** with half of it
 *    unavailable, which is one of the two reasons those genres are still
 *    unwritten.
 *  - **A hip-hop record that drifts is a different record** from one that does
 *    not, which hiphop asked for as a texture rather than as a structure.
 *
 * ## Three gestures, one mechanism, and what is actually built here
 *
 * Those four reports are **three different musical gestures** and it would have
 * been easy to build them as one feature and get all three slightly wrong:
 *
 *  - a **whole-piece accelerando**, monotonic, slow, and the point of the form;
 *  - a **build**, which ramps over a fixed number of bars and *arrives* at a
 *    drop, and is therefore section-shaped rather than piece-shaped;
 *  - a **drift**, which is a band not playing to a click, and is a texture with
 *    no destination at all.
 *
 * What is built here is the **whole-piece accelerando**, and the choice is
 * deliberately the one that carries the other two rather than the one that
 * covers the most ground. Nine tenths of this feature is not the curve; it is
 * `TempoMap` reaching `render/midi.ts`, `render/strudel.ts`, the clock in
 * `core/grid.ts` and the concert, each of which had its own idea of what a tempo
 * is. An accelerando exercises every one of them at full blast radius — the
 * tempo is different at every point of the piece, so any consumer that quietly
 * divided by one number is wrong from the first bar rather than in one section
 * somebody might not check. A build would have exercised them over eight bars,
 * and a drift by a percent.
 *
 * With the map in the IR the other two are **new planners and nothing else**.
 * Both are argued below, under *What is not built*, including the concrete
 * reason a build cannot be planned in this file and where it must go instead.
 *
 * ## Who declares one
 *
 * `Style.tempoRamp`, a weighted palette, with no `Genre` half and no `Mood`
 * bias. `Style.drops` settled this seam hours before this file was written and
 * the argument transfers exactly: a palette that falls back to a genre table —
 * `fills`, `transitions`, `feels` — is a claim about *how a band in this idiom
 * plays*, and travels across every style in the idiom; a claim about *one
 * piece's shape* does not. Whether a piece accelerates is the second kind, and
 * the counter-example is inside a single genre rather than between two: indian
 * holds both the qawwāli, which gathers speed as its whole design, and the
 * ālāp, which has no pulse to accelerate. A genre-level answer is wrong for one
 * of any such pair whichever way it is written.
 *
 * No `Mood` bias either, and here the argument is different from a drop's rather
 * than the same one. Mood *already* moves the tempo: `chooseTempo` reads
 * `mood.tempo` to push the drawn figure toward one end of the style's band. A
 * mood bias on the ramp would be that same temperament spoken twice in two
 * units, and the two would compound — a driving mood picking the top of the
 * range *and* the steepest climb is a piece that starts fast and ends
 * ridiculous.
 *
 * ## Determinism
 *
 * **A style with no `tempoRamp` palette takes no number out of any stream**, and
 * `planRamp` returns before its first draw for that reason. This is the property
 * the whole wave is judged on; `Style.feels` defends it at length and
 * `generate/song.ts`'s `drumSource` note records what one casually consumed draw
 * cost the last time — every song in every genre, and a check falling from 66%
 * to 59%.
 *
 * A style that *does* opt in draws once, from `${seed}:tempo`, a stream nothing
 * else reads — the same isolation `${seed}:drop` has. So opting one style in
 * cannot move another style's songs, and inside an opted-in song the ramp cannot
 * reshuffle the tune, the groove or the instrumentation.
 *
 * There is one honest exception and it is worth stating plainly, because it is
 * the only way this feature reaches a note. An opted-in song's **form** is
 * built to a different bar count — see `effectiveBpm`. That is not a stream
 * moving; it is the form generator being told the truth about how long a bar
 * lasts, which it has always been told and was always told correctly before a
 * piece could change speed.
 */

import { type TempoMap } from '../core/grid.js';
import type { Rng } from '../core/rng.js';

/**
 * The shapes a ramp can take. Two, plus the identity.
 *
 * Two because the evidence names two curves, not because two is a tidy number.
 * `style/feel.ts` states the risk a library like this runs and it is not that
 * the list is short: it is that a long list gets applied liberally until every
 * genre sounds like the same record.
 */
export type RampId = 'none' | 'accelerando' | 'gathering';

export interface Ramp {
  id: RampId;
  label: string;
  /** One line, for the README and the audition page. */
  description: string;
  /**
   * How much faster the last bar is than the first, as a multiplier.
   *
   * 1 is the identity. **Below 1 is a decelerando and works**, because the curve
   * below is a shape rather than a direction — a style writing `tempoRise: 0.9`
   * gets the same gesture running the other way, which is a real thing a
   * ceremonial or funereal piece does. It is not offered as a named shape for
   * the reason given under *What is not built*: the one deceleration everybody
   * wants is the one at the end, and the end already has an owner.
   *
   * Overridable per style — see `Style.tempoRise` — for the reason
   * `Style.dropBars` exists: the shape says what the gesture *is* and the style
   * says how far its own music takes it. A dance band pushing a polska and a
   * qawwāli party are the same curve at very different amounts, and a library
   * that had to pick one number would be wrong for the other by a factor of
   * four.
   */
  rise: number;
  /**
   * The curve, as the fraction of `rise` reached at progress `p` through the
   * piece. `curve(0)` is 0 and `curve(1)` is 1 for every entry.
   *
   * A function rather than a table of points, which is the one place this file
   * disagrees with `core/grid.ts`'s argument against functions — and the
   * disagreement is the point. A `TempoMap` is *data crossing a seam*: four
   * consumers read it, none may sample it differently from the others, so it is
   * breakpoints. This is a *library entry read once, in this file, by the
   * function directly below it*, and it never leaves. Nothing downstream can
   * disagree about a curve it never sees.
   */
  curve: (p: number) => number;
}

/**
 * Which ramps a style's band plays, weighted, drawn once per song.
 *
 * The `none` entry carries *how often*, and it is a real member of the table
 * rather than a separate `chance` field for the reason `style/feel.ts` gives
 * about `straight` and `Style.drops` repeats: a weighted table is the units a
 * style already writes its answers in.
 *
 * **Absent is not the same statement as `[['none', 1]]`.** A style naming `none`
 * alone has been asked and said no; a style with no palette has not been asked,
 * draws nothing, and generates the song it generated before this file existed,
 * bit for bit. Both make identical music. Only the second takes no number out of
 * the stream.
 */
export type TempoPalette = (readonly [RampId, number])[];

/**
 * The library.
 *
 * Two gestures and an identity. Both are whole-piece and monotonic, both were
 * reported by a named genre that had written the compromise down, and the
 * difference between them is not the amount — that is `rise`, and a style sets
 * it — but **where in the piece the speed arrives**, which is the thing a genre
 * author cannot express any other way.
 */
export const RAMPS: Record<RampId, Ramp> = {
  /**
   * The identity. Nothing moves, so drawing it costs a number and produces the
   * song the style produced before it had a palette.
   *
   * It exists so a style whose answer is "sometimes" writes one table rather
   * than a table and a probability, exactly as `DROPS.none` and `straight` do.
   */
  none: {
    id: 'none',
    label: 'None',
    description: 'One tempo, held. What every song in the catalogue does.',
    rise: 1,
    curve: () => 0,
  },

  /**
   * An even push, first bar to last.
   *
   * The dance-band shape, and the one finnish folk reported for the pelimanni
   * repertoire: a polska or a schottische played for dancers gets faster because
   * the room does, steadily, and nobody in the band decides to do it. Linear
   * because that is what *nobody deciding* sounds like — an even few percent per
   * minute, present from the first phrase and never dramatic at any point in it.
   *
   * The default `rise` is small on purpose. A dance set that ends a tenth faster
   * than it started is already at the top of what a band will admit to; the same
   * curve at 1.4 is not a livelier band, it is a rushing one, and a style that
   * genuinely wants that says so in `tempoRise` and owns it.
   */
  accelerando: {
    id: 'accelerando',
    label: 'Accelerando',
    description: 'An even push from the first bar to the last. A dance band getting faster because the room is.',
    rise: 1.1,
    curve: (p) => p,
  },

  /**
   * Nothing for a long time, and then it goes.
   *
   * The qawwāli shape, and the reason it is a separate entry rather than a
   * steeper `accelerando`: in a devotional form the acceleration is *structural*
   * and the structure is that the opening is patient. A linear climb from the
   * first bar has already lost the opening — by a quarter of the way in it is a
   * quarter faster, which is exactly the thing a qawwāli spends its first
   * section not doing. Squared puts a sixteenth of the rise at the quarter mark
   * and half of it in the last third, which is where a listener actually hears
   * the party arrive.
   *
   * The default `rise` is large for the same structural reason. Where an
   * accelerando is a band's honesty about a room, this is the piece's design,
   * and a design that moves the tempo by a tenth is a design nobody would
   * notice. Half again is at the modest end of what the records do.
   */
  gathering: {
    id: 'gathering',
    label: 'Gathering',
    description: 'Patient, then it goes: half the speed arrives in the last third. What a qawwāli is built on.',
    rise: 1.5,
    curve: (p) => p * p,
  },
};

/**
 * Whether this piece ramps, and how far.
 *
 * One draw, and then nothing but arithmetic — the division `Chart.exits` and
 * `planDrop` both make, for the reason `planDrop` states: **what** the gesture
 * is comes out of the style's table, and **where** it goes is placed from the
 * form. Here the placement is not even a choice, because the gesture covers the
 * whole piece; realising it is `rampMap`, which draws nothing.
 *
 * Returns `undefined` — having drawn nothing at all — for a style with no
 * palette, which is every style in the catalogue today. That early return is
 * the whole acceptance criterion of this wave and it is deliberately the first
 * statement in the function.
 *
 * It also returns `undefined` for a drawn `none`, which *has* cost a number.
 * The two absences are indistinguishable downstream and that is correct: a band
 * that considered speeding up and did not is a band that played it straight, and
 * publishing `tempo: [{ beat: 0, bpm: 108 }]` to say so would put a field on a
 * song to record a decision with no consequence.
 */
export function planRamp(args: {
  rng: Rng;
  palette: TempoPalette | undefined;
  /**
   * How far this style's own music takes the gesture, overriding the shape's
   * default. Read, never drawn — see `Style.tempoRise`.
   */
  rise?: number;
}): Ramp | undefined {
  const { rng, palette } = args;
  // Before the first draw. See the determinism note at the top of the file.
  if (!palette?.length) return undefined;

  const ramp = RAMPS[rng.weighted(palette)];
  if (ramp.rise === 1 && args.rise === undefined) return undefined;

  /**
   * Clamped, and the bounds are where the *other* systems stop being able to
   * follow rather than where the music stops being interesting.
   *
   * Half and double are already extreme — doubling means the last chorus is in
   * cut time against the first — and past them two concrete things break. The
   * form generator is handed one effective tempo for the whole piece (see
   * `effectiveBpm`) and a piece spanning more than an octave of tempo has no
   * single number that describes how long its bars are, so the duration target
   * stops meaning anything. And `Style.bpm` is a declared band that the drawn
   * tempo is clamped into; a style is allowed to leave its own range on purpose,
   * which is what opting in means, but a range left by a factor of three is a
   * style that has mis-stated where its music sits.
   */
  const rise = Math.min(2, Math.max(0.5, args.rise ?? ramp.rise));
  return rise === 1 ? undefined : { ...ramp, rise };
}

/**
 * The ramp, realised over a form whose length is finally known.
 *
 * Separated from `planRamp` for the reason `planDrop` separates drawing from
 * placing, and here the separation is forced rather than chosen: `totalBars`
 * comes out of `buildForm`, `buildForm` needs to know how long a bar lasts, and
 * how long a bar lasts is what this function computes. The knot is cut by
 * drawing the shape first, handing `buildForm` the one number it needs
 * (`effectiveBpm`), and realising the map afterward. No random numbers cross the
 * cut in either direction.
 *
 * ## Why the breakpoints are bar lines
 *
 * Because that is where a band changes speed. Nobody accelerates through the
 * third beat of a bar; a player leans on a downbeat and the next bar is quicker,
 * and a section leader's whole vocabulary for this is *from the top of the
 * next*. A tempo map with a breakpoint inside a bar would be describing a
 * machine's ramp rather than a band's, and would be describing it to consumers —
 * the drummer's arms, the count-in, the lighting cues — that are all written in
 * bars.
 *
 * ## Why the resolution is one whole bpm
 *
 * `core/grid.ts` argues that a tempo map is a staircase because MIDI's set-tempo
 * is a step and every DAW that draws a smooth line exports one. This is where
 * the step size gets chosen, and it is chosen at **the smallest step MIDI can
 * carry recognisably**: `TempoPoint.bpm` is a whole number so that the
 * microseconds-per-quarter it becomes converts back to the number that was
 * written, and 113 does not reappear in a tempo lane as 113.40003.
 *
 * The musical consequence is better than the mechanical one, which is the sign
 * it is the right choice rather than a convenient one. **A point is emitted only
 * where the rounded tempo moves**, so the map is as long as the ramp is *big*
 * rather than as long as the piece: a gentle push across a hundred bars is a
 * dozen breakpoints, one a bar or two, each a step of about one percent landing
 * on a downbeat. That is under the threshold at which a step is heard as a step
 * and over the threshold at which a hundred of them are heard as a ramp. A
 * ninety-nine-entry map with a breakpoint at every bar line, most of them
 * repeating the previous tempo, would say the same thing at ten times the size
 * and be much harder to read in a diff.
 *
 * Returns `undefined` where nothing moved after rounding — a rise so small
 * against a piece so short that no bar earns a different tempo. Downstream that
 * is the same absence as a style that never opted in, which is right: a map that
 * describes one tempo is one tempo.
 */
export function rampMap(args: {
  ramp: Ramp;
  /** The drawn tempo, which is the tempo of the first bar. */
  bpm: number;
  totalBars: number;
  beatsPerBar: number;
}): TempoMap | undefined {
  const { ramp, bpm, totalBars, beatsPerBar } = args;
  if (totalBars < 2) return undefined;

  const points: { beat: number; bpm: number }[] = [];
  let last = 0;
  for (let bar = 0; bar < totalBars; bar++) {
    // Over `totalBars - 1` rather than `totalBars`, so the *last bar* is played
    // at the target rather than approaching it and stopping a bar short. The
    // difference is invisible on a long form and is a third of the whole gesture
    // on a sixteen-bar one.
    const p = bar / (totalBars - 1);
    const at = Math.round(bpm * (1 + (ramp.rise - 1) * ramp.curve(p)));
    if (at === last) continue;
    last = at;
    points.push({ beat: bar * beatsPerBar, bpm: at });
  }
  return points.length > 1 ? points : undefined;
}

/**
 * The one tempo that makes a ramping piece the right *length*.
 *
 * `buildForm` fits a form to `Genre.duration` by dividing seconds by a
 * seconds-per-bar computed from the tempo, and it has to run before the ramp can
 * be realised because the ramp is defined over the form it produces. Handed the
 * opening tempo, it would build a form for a piece that then plays faster than
 * that for all but its first bar: a style rising by a half would come out around
 * a fifth short of the duration its genre asked for, every time, and the report
 * that eventually noticed would blame the genre's `duration` range.
 *
 * So it is handed this instead — **the harmonic mean of the curve**, which is
 * the tempo a piece of the same bar count would have to hold to last exactly as
 * long. Harmonic and not arithmetic, because what adds up over a piece is
 * *seconds per bar* and that is the reciprocal of tempo: a bar at 60 and a bar
 * at 120 take three seconds a beat between them, which is 80 bpm on average and
 * not 90. The arithmetic mean would leave a rising piece short by a smaller
 * amount and would still be wrong.
 *
 * Sampled rather than integrated. The closed form exists for both shapes here
 * and is a logarithm for one of them, which is precisely the arithmetic
 * `core/grid.ts` refuses to have two copies of — and this number does not need
 * that accuracy. It decides how many eight-bar sections fit in three minutes, an
 * answer that is an integer and that `buildForm` then adjusts in whole sections
 * anyway. Sixty-four samples put it far inside the rounding that follows it.
 *
 * Takes no random numbers, which is what allows it to be called before the form
 * exists without moving anything.
 */
export function effectiveBpm(ramp: Ramp, bpm: number): number {
  const SAMPLES = 64;
  let reciprocal = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const p = i / (SAMPLES - 1);
    reciprocal += 1 / (bpm * (1 + (ramp.rise - 1) * ramp.curve(p)));
  }
  return SAMPLES / reciprocal;
}

/**
 * ## What is not built, and where it goes
 *
 * `generate/drop.ts` shipped two shapes and a documented rejection, on the
 * reasoning that the refusal is the more useful record. Three here, and the
 * first is the one a genre author is most likely to come looking for.
 *
 * ### A build cannot be planned in this file
 *
 * A build is the gesture `dnb` and `house` are blocked on, and it is *not* a
 * short accelerando. It is a ramp over a fixed number of bars that **arrives at
 * a drop** — the tempo and the density climb together, everything leaves, and
 * the return is the landing. `Drop.removes` already says as much in its own
 * comment: a staggered return is a build, half of a build is a tempo ramp, and
 * writing one there would have been claiming the gesture in the file that cannot
 * finish it.
 *
 * This file cannot finish it either, and the reason is an ordering constraint
 * rather than a preference. Everything here runs **before the form exists**,
 * because `buildForm` divides by the tempo to fit `Genre.duration`. `planDrop`
 * runs about four hundred lines later, after the section list, the layer plan
 * and the solo plan are all settled — and its own comment explains why it must:
 * it has to be on the far side of the soloist's rewrite of `activeLayers` and on
 * the near side of the onset filter. A build planned here would have to guess
 * which bar the drop lands on, and a build that arrives two bars after the
 * bottom drops out is not a build, it is a tempo change nobody asked for.
 *
 * **What actually works**, and it needs nothing from the IR: a second planner,
 * beside `planDrop`, where `DropSpan.from` is already a number. It appends
 * points to the map this file produced — a `TempoMap` is a list, a build is more
 * entries in it over the bars before the drop, and the four consumers are
 * already reading the list. That is the property the piecewise-constant shape
 * was chosen for. It composes with `Style.drops` in the literal sense of reading
 * its output, which is what §1.2's author asked for and could not have.
 *
 * ### Drift is expressible and was not built
 *
 * A band that is not playing to a click wanders — a percent or two, without
 * direction, coming home as often as not. It is a per-bar random walk over the
 * same map, on the same `${seed}:tempo` stream, and it is perhaps fifteen lines.
 *
 * It is not built because **nobody said how much**, and a drift's entire content
 * is how much. Hiphop reported it as a texture — *a record that drifts is a
 * different thing from one that does not* — with no figure attached, and unlike
 * the accelerando there is no second genre's independent report to calibrate
 * against. This document's own bar is that an entry found once is a taste and an
 * entry found twice is a gap. Building it to a number picked here would be
 * inventing the number and then maintaining it.
 *
 * It is also the one shape whose default would have to be *small enough to be
 * inaudible in the audition*, since the audition cannot ramp at all and would
 * play it flat — see `render/strudel.ts`. An accelerando has an obvious and
 * honest fallback there. A drift's fallback is that it silently does not happen,
 * which is a worse thing to ship than the absence.
 *
 * ### A ritardando at the end, written and rejected
 *
 * The most requested tempo gesture in music, and the one shape here that a
 * reader will be surprised is missing. `rise` below 1 already gives a whole-piece
 * deceleration; what this rejects is the *final* slow-down over the last few
 * bars.
 *
 * **The ending already has an owner.** `Genre.ending` and `landEnding` decide
 * what happens in the last bar — a button struck on the downbeat, or a fade —
 * and `generate/transition.ts` and `generate/drop.ts` both refuse to touch a bar
 * another pass is editing, citing the same precedent: two passes editing the
 * same bar is how the double-swing bug in `Feel.swing` happened. A ritardando is
 * exactly a second opinion about the last four bars.
 *
 * The musical half of the argument is why the mechanical half is not a
 * compromise. A ritardando changes nothing in beat space — the button still
 * lands on the last downbeat, the fade still covers the same bars — so its
 * entire content is that the final seconds get longer. That makes it the one
 * gesture in this file whose whole substance lives in the renderer that plays
 * it, and the audition plays it flat. A shape whose only audible form is in the
 * shipped file and whose only visible form on stage is nothing at all is a shape
 * to add when the stage can hear it, together with the transition machinery that
 * owns the bars it wants.
 */
