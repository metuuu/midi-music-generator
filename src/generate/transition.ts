/**
 * Transitions — what the *band* does at the seam between two sections.
 *
 * The drummer transitions; the band cuts. Everything that marks a section
 * boundary in this project today is either the kit or a step change:
 * `generate/fills.ts` gives the drummer seven shapes, a per-style palette and a
 * size scaled by the arrival, and every other layer simply stops playing one
 * thing and starts playing another at the barline. A listener hears the
 * arrangement change rather than arrive.
 *
 * ## A transition is an *edit* at assembly, not a *composition* at the seam
 *
 * That distinction is the whole of why this is cheap, and it is worth stating in
 * full because the obvious objection to any of this is already written down
 * twice in the tree and is correct both times:
 *
 *  - `tune/tune.ts` — *"A section's tune starts inside its section."* Pickup
 *    onsets before bar 0 are filtered at the seam, because the previous
 *    section's answering line was written without knowing the note would arrive.
 *  - `generate/song.ts` — *"Only the lead layer may write backwards across the
 *    section join"*, because a comp or bass pickup sounds on top of a chord that
 *    is still ringing and **nothing downstream would clear it**.
 *
 * Both of those are about a *generator writing notes into bars it cannot see*.
 * Neither is about moving, deleting or replacing notes that already exist. By
 * the time this pass runs, every layer is one array in one coordinate space and
 * both sides of every seam are in it, so the overlap that has no owner during
 * composition has an obvious one here: the note's own neighbour. The sealed seam
 * is not argued with, it is routed around, and the two constraints above should
 * stay exactly as they are.
 *
 * All four kinds are expressible that way, and none of them writes a note that
 * was not going to exist:
 *
 *  - **`fill`** — already an edit, and already made, inside `generateDrums`.
 *    See `applyTransitions`, which does nothing for it on purpose.
 *  - **`shot`** — replace what every layer holds in the last bar with a shared
 *    figure. `hitTogether` below is that edit, and it lives here rather than in
 *    `song.ts` because two callers now share it.
 *  - **`break`** — delete events in a span from every layer but one.
 *    `playBreak` below.
 *  - **`elide`** — move the first onset of each layer at the seam backwards by
 *    an eighth and clip what it lands on. *(wave 4)*
 *
 * ## Wave 1 was structure, and the structure was the deliverable
 *
 * What landed first was the vocabulary, the per-seam draw, and the call site at
 * the right point in the order. `fill` was the only kind any palette could
 * produce and it is implemented by delegation — the drummer's fill is what
 * `fill` *means*, and it is written where it always was. Nothing in the
 * catalogue moved: measured over 504 songs (every genre x style at eight seeds,
 * 200 unpinned, and both ends of the `--hook` axis at forty), the JSON of every
 * song was byte-identical to what it was before this file existed.
 *
 * ## Wave 2 is `shot`, and the whole of it is where the figure comes from
 *
 * A shot puts the *whole band including the kit* on one rhythmic figure in the
 * last bar before a seam, and the kit is what makes it land. The kit is
 * forbidden from the mid-section tutti in `song.ts`, and the reason is stated
 * there: that figure is the tune's, `--hook` is documented as an A/B control
 * that leaves drums alone at every level, and `genre-check.ts` asserts drum
 * events byte-identical between `through` and `earworm`.
 *
 * So the constraint was never *drums may not join a band figure*. It is:
 *
 * > **A drum event may not be derived from anything that changes with `--hook`.**
 *
 * `shotFigures` is the answer. A style's `shots` table is a static literal; the
 * fallback reads `beatsPerBar` and `groups` through `metricStrength`, which are
 * properties of the bar. Neither can move when the tune does, so the kit is
 * free. Everything else a shot's drum events are made of is invariant for the
 * same kind of reason and is called out where it is read: the seam's own
 * namespaced draw, the section boundaries, and the kit's *existing* velocities
 * in the bar being replaced — which are hook-invariant precisely because the
 * assertion above says they are.
 *
 * ### …and the figure was right while the instruments playing it were not
 *
 * `playShot` wrote `bd` + `sd` on every hit and spared a `cr`, in literals, and
 * `landing()` in `fills.ts` wrote the arrival cymbal in two more. Everything
 * above about *what* the band hits was station-independent from the first line
 * — a style table and a metre are facts about a bar, not about an object — and
 * none of it was worth anything to a band with no kit, because the delivery
 * named three instruments the music did not have.
 *
 * Indian is the measurement and it is the one that names the prize. Five of its
 * twenty-eight styles **declared** a transition palette, and `filmi`'s own
 * comment said why only five: *"`applyShot` writes its figure as a kick, a snare
 * and a crash, and this is one of the few rooms here that has all three in it."*
 * A **tihai** — a figure struck three times, calculated backwards so the last of
 * them lands on sam — is exactly a `shot`, and the twenty-three styles that
 * could not have one were not short of a figure. `shotFigures` above resolves
 * the group heads for free. They were short of a drum to play it on.
 *
 * **They have the drum now, and they took the gesture.** A later wave went back
 * through the genre once the delivery was fixed: **seventeen of the twenty-eight
 * declare a palette today**, twelve adopted and eleven refused on stated musical
 * grounds — four tālas with no cycle to land on, three arrivals that belong to
 * somebody who is not the ensemble, two forms that exist in order not to
 * display, and dhrupad and vilambit on ektāl, whose sixes give six onsets where
 * `bandHeads` defines a shot as two to four. The sentence quoted above no longer
 * exists in `filmi`, because the claim inside it stopped being true.
 * `indian/staging.ts` holds the other end of the same measurement: 0 of 300
 * numbers put anybody on the drum riser, which is exactly what this paragraph
 * predicted would follow from the shot no longer naming three instruments. The
 * five is kept in the past tense because the argument this whole section makes
 * is only legible against it.
 *
 * So the kit half of `playShot` reads a `SeamOrchestration` now, and so does
 * every drum event this file writes. **Where it reads it from is the whole of
 * the change**: `song.drums.events` and `song.drums.bank`, through
 * `drumStations`, which is the same question `cast.ts` asks of the same two
 * values to decide who is standing on the stage at all. Not the style table —
 * this pass has no style, and going to look for one would be a worse answer as
 * well as a new dependency. A shot is the *band* hitting a figure, so what it
 * needs to know is who is in the band, and the events are what casting will
 * read when it decides that.
 *
 * **What it comes out as**, measured over 120 songs in each of the five styles:
 * the shot bar used to contain `{bd hp lp mp sd}` and now contains `{hp lp mp}`,
 * which is three strokes of one drum, and it still lands on sam every time it
 * did before — 183/183, 209/209, 189/189, 185/185 and 166/168. The figure did
 * not move, because the figure never had anything wrong with it.
 *
 * **And on its own this change is nearly invisible**, which is worth writing
 * down because it is the strongest evidence for reading the events. Over 10 760
 * songs it moves 29 of them, in exactly two styles: reggae's `nyabinghi` and
 * latin's `columbia`, the only two in the catalogue whose percussion comes out
 * with no kit voice in it at all while the drummer has never written a fill. In
 * every other hand-drum song the fill had already put a crash in the bar, so
 * this read found the kit the fill had conscripted and agreed with it. The two
 * halves have to land together or neither does.
 *
 * ## Wave 3 is `break`, and the whole of it is who is left
 *
 * Stop-time. The band stops for the last bar before a seam and one voice carries
 * it, and the contrast is the gesture — the oldest way in this repertoire to
 * make an arrival land, and the cheapest thing in this file to build, because a
 * deletion composes nothing.
 *
 * The kit stops with everyone else, and that is the decision the gesture turns
 * on. A break the drummer plays through is not a break; it is the band resting
 * while the time goes on, which is a different and much quieter effect. So the
 * bar is emptied of kit outright and the drummer comes back in on the downbeat
 * they were aiming at — which has to be written here for the same reason
 * `playShot` writes it: the fill is vetoed at a seam that drew a gesture, and
 * `landing()` is only ever reached by `generateDrums` when it has written one.
 *
 * The one drum event this adds is the same cymbal `playShot` adds, from the same
 * input — the loudest velocity the kit already plays in the bar it lands on —
 * and it is hook-invariant for the same reason, which is that the assertion in
 * `genre-check.ts` says the kit is.
 *
 * ### The rule above was too weak, and this is the kind that proved it
 *
 * *A drum event may not be derived from anything that changes with `--hook`* was
 * written for `shot`, where the danger is a figure lifted off the tune. It let
 * this kind straight through, because a break derives nothing — it **deletes**.
 * A bar of kit that is emptied at one hook level and kept at another is exactly
 * as much a kit that moved with the tune as one whose figure came from it. So
 * the honest statement is the wider one:
 *
 * > **No drum event may be written, deleted or moved on the strength of anything
 * > that changes with `--hook`** — and *whether a break happens* is such a
 * > strength, because it is the thing that empties the bar.
 *
 * The first `playBreak` chose its carrier by asking which layer covered the last
 * bar in sounding time, which in practice asked whether the melody did, and
 * `--hook` is the one control that rewrites the melody. On a sparse arrangement,
 * where the tune sits near the threshold, the same seed then broke at one level
 * and not at another and took the kit with it: measured at 14 seeds in 200 on
 * arabic `fallahi`, 11 on `dabke`, 9 on `zaffa`, 7 on `longa`, and 0 on jazz
 * `swing` and `blues`, which are dense enough that the tune cleared the bar
 * every time. Two genre authors found it independently, and both dropped `break`
 * from their palettes rather than ship it — which is how the sparsest music in
 * the project came to have one seam gesture fewer than the densest.
 *
 * **Both took it back**, once the carrier stopped being searched for and started
 * being named, and that restoration is what the rest of this section is for. All
 * seventeen indian palettes weight `break` at 2 or 3, and all twenty-eight of
 * that genre's styles write `breakCarrier: 'pad'` — the śruti box, which is the
 * thing still ringing when everything else has stopped. Arabic took it back on
 * `dabke` alone, at weight 4, because that style's own header says the bass is
 * the loudest thing in the room. Indian's residual is the number that makes the
 * field worth having rather than merely safe: a tanpura writes six notes into
 * eight bars and has usually stopped three bars before the seam, so **43 of
 * 10517 drawn breaks came out silent** under the default `BREAK_CARRIER` of
 * `bass`, and 0 do under `pad`. The sentence above is kept because the fault it
 * records is exactly what `Style.breakCarrier` below was built to answer.
 *
 * ### …and what is left to decide from is the plan and the kit, and nothing else
 *
 * Not "not the melody". **No layer's notes at all.** `--hook` moves the harmony
 * as well as the tune — `recall`, `harmonyRecall` and `harmonicSimplicity` are
 * three of its four levers — and every pitched layer follows the chords: over 40
 * seeds per style the bass came out different at 39 or 40 of them in each of the
 * four arabic styles. The bass looks like the safe part to read and is not one.
 *
 * What does survive is the form and the arrangement. Measured over 7354 sections
 * — eleven styles, sixty seeds, all five hook levels — a section's kind, length,
 * transposition and solo assignment never moved once, and its `activeLayers`
 * never moved either except for the two layers that are written *against* the
 * finished tune: `counter`, which answers the melody's gaps, at 286, and `brass`
 * at 3. A carrier named out of that list is hook-invariant in the same way a
 * `shot` figure out of a style table is — not because anything checks it, but
 * because there is nothing in it for the tune to move. See `playBreak`.
 *
 * **And the name is the style's to give.** `Style.breakCarrier` is one optional
 * layer id, read and never drawn, defaulting to `BREAK_CARRIER`: a taqsim ends
 * on the qanun and a breakdown belongs to the guitars, and a static literal has
 * exactly the standing a `shots` table has under the rule above. The two layers
 * that would put the guarantee back at risk are the two that cannot be written —
 * `BreakCarrier` takes them out of `LayerId` at the type level, so the mistake
 * is a compile error rather than a measurement somebody has to remember to make.
 *
 * **A break is the one kind with a floor**, and `layersFor` is why. It decides
 * which layers exist before any of this runs, so a break dropped into a section
 * that is already two players is not a gesture, it is a bar where the music
 * thins out. `MIN_BREAK_LAYERS` is that floor, and it is applied at the *draw*
 * rather than at the edit — a break talked out of it late has already cost the
 * drummer the fill, which is the one way this mechanism can leave a seam worse
 * than it found it.
 *
 * See `docs/transition-plan.md`.
 */

import { Rng } from '../core/rng.js';
import { canVary } from '../core/types.js';
import type {
  DrumEvent, DrumSource, LayerId, NoteEvent, Section, Song, Track,
} from '../core/types.js';
import { landing, seamOrchestration, type SeamOrchestration } from './fills.js';
import { anticipate, metricStrength, SLOTS_PER_BEAT, thin } from './rhythm.js';

/**
 * What happens at one join.
 *
 * Four, and the fifth that is missing is deliberate: a `turnaround` — a ii–V or
 * a bVII sitting in the last bar to lean into the next section — is blocked
 * because harmonic rhythm here is one chord per bar, so it could only ever be a
 * *whole* bar, which is a progression edit rather than a transition.
 */
export type TransitionKind = 'fill' | 'shot' | 'break' | 'elide';

/** Weighted transition vocabulary. The same shape as `FillPalette`, deliberately. */
export type TransitionPalette = (readonly [TransitionKind, number])[];

/**
 * What a band that has not been asked the question does.
 *
 * `fill` at weight 1 is today's behaviour exactly, which is what makes every kind
 * after it additive: a style with no palette resolves to this **without drawing**
 * (see `planTransitions`), and a style that names `[['fill', 1]]` draws a number
 * from its own namespace and gets the same answer. Those two are the same music
 * and different statements, in the way `Style.feels` documents at length.
 */
export const DEFAULT_TRANSITIONS: TransitionPalette = [['fill', 1]];

/**
 * One join, and what is happening at it.
 *
 * Indexed by the section being *left*, so `seams[s]` is the join at the end of
 * section `s` and the final section has none — there is no seam after the last
 * bar, and a pass that pretended there was would be editing the ending.
 *
 * `bar` is the arriving section's downbeat rather than the departing section's
 * last bar, for the reason `fills.ts` already gives about fill size: a
 * transition is a *delivery*, so it is named by where it lands.
 */
export interface Seam {
  /** Index into `Song.sections` of the section being left. */
  section: number;
  /** Absolute bar the next section starts on — the downbeat this aims at. */
  bar: number;
  kind: TransitionKind;
  /**
   * What the band hits, in sixteenth slots from the top of the bar *before*
   * `bar`. Present on `shot` and on nothing else.
   *
   * On the IR rather than kept inside the pass, and that is not decoration: it
   * is what makes the hook guarantee checkable at its source. A shot's figure
   * is the one value in this mechanism that a drum event is derived from, so
   * `genre-check.ts` reads it straight off two songs that differ only in
   * `--hook` and compares — which fails on the *cause* rather than three layers
   * downstream in a JSON compare of the finished kit part.
   */
  figure?: number[];
  /**
   * Where a `shot` lands. Absent means at the seam, which is what a transition
   * is and what every other kind can only be.
   *
   * `inside` is the answer to *this could happen in the middle too*, and it is
   * one field rather than new machinery: the same edit, aimed two bars earlier.
   * It does **not** make this stop being a seam — the seam is still what drew
   * it and still what spends the song's gesture — but the drummer keeps their
   * fill, because the join is no longer the thing being announced. See
   * `fillAtEnd` in `song.ts`.
   *
   * Only a `shot` has one. A break in the middle of a section is a hole rather
   * than stop-time, and an elide needs a join to arrive early at.
   */
  anchor?: 'inside';
}

/**
 * Where a shot's figure comes from: a style's own table, or the bar itself.
 *
 * `Style` satisfies this structurally, so the call site passes the style.
 */
export interface ShotSource {
  beatsPerBar: number;
  /** Sixteenths per group where the bar does not divide evenly. See `Style.groups`. */
  groups?: readonly number[];
  /** Authored figures, weighted. See `Style.shots`. */
  shots?: readonly (readonly [number[], number])[];
  /**
   * The onsets the rhythm section is already playing — the drawn bass and comp
   * patterns' own slots. Preferred over the metre, outranked by a table.
   *
   * **Hook-invariant, which is the only reason the kit may play it.** The three
   * pattern draws happen before `hookRng` exists and before the section loop,
   * and the running stream inside that loop is deliberately kept aligned across
   * hook levels — `pickProgression` is drawn and thrown away rather than skipped
   * for exactly this reason. So a bass pattern cannot move when `--hook` moves,
   * and a figure derived from one has the same standing as a static table.
   *
   * **And it is the better figure.** The metre fallback is right where a bar has
   * a distinctive grouping and generic everywhere else: a tango, a foksi, a
   * bossa and a swing are all 4/4 with no `groups`, so all four would draw the
   * same two figures out of it. Widening `shot` across the catalogue on the
   * fallback alone would ship a new sameness into eighteen styles — the thing
   * `docs/rhythm-plan.md` exists to remove, arriving inside a new feature. The
   * band's own figure cannot do that, because it is different per style by
   * construction.
   *
   * It is also what the plan asked for in the first place: *a fusion break is
   * the rhythm section's own figure, and the horn plays over it or stops.*
   */
  band?: readonly number[];
}

/**
 * The figures this band would hit, weighted — the crux of the whole plan.
 *
 * **Not the tune, and that is the entire point.** See the note at the top of
 * this file: a figure taken from the tune moves with `--hook`, and a kit playing
 * it would break the A/B guarantee the repetition axis rests on. A style table
 * is a literal and a metre is a property of the bar; the kit may play either.
 *
 * The fallback is what makes the feature shippable without authoring eighteen
 * tables first, and it is the same argument `Voice.accents` already makes about
 * itself — *"serviceable, and the reason the whole catalogue does not have to be
 * authored before anything can be heard"*. It is also the *better* answer in an
 * asymmetric metre: `metricStrength` handed a grouping returns 3 at each group
 * head, so a 7/8 in 2+2+3 gives slots 0, 4, 8 — the character of the bar, and a
 * thing no generic table could find, because there is no formula that recovers
 * 2+2+3 from the number 14.
 *
 * Two entries, both the same figure: the heads as they stand, and the heads with
 * the last one anticipated by an eighth. The second is the more idiomatic band
 * shot — the push into the last group is what a rhythm section actually plays —
 * so it is weighted above the plain statement of the grouping, and the pair is
 * what stops one style having exactly one shot for the length of the catalogue.
 */
export function shotFigures(metre: ShotSource): readonly (readonly [number[], number])[] {
  if (metre.shots?.length) return metre.shots;

  const slotsPerBar = Math.round(metre.beatsPerBar * SLOTS_PER_BEAT);
  const heads = bandHeads(metre.band, slotsPerBar, metre.groups)
    ?? metreHeads(slotsPerBar, metre.groups);

  const pushed = heads.slice();
  const last = pushed.length - 1;
  const anticipated = pushed[last]! - SLOTS_PER_BEAT / 2;
  if (anticipated > pushed[last - 1]!) pushed[last] = anticipated;

  return pushed[last] === heads[last]
    ? [[heads, 1]]
    : [[heads, 2], [pushed, 3]];
}

/** The group heads of the bar, which is what a band with nothing to say hits. */
function metreHeads(slotsPerBar: number, groups?: readonly number[]): number[] {
  const heads: number[] = [];
  for (let slot = 0; slot < slotsPerBar; slot++) {
    // 3 is "group head", 4 is the downbeat. Below that is a beat or weaker, and
    // a figure on every beat is not a shot, it is time-keeping with the band's
    // name on it.
    if (metricStrength(slot, slotsPerBar, groups) >= 3) heads.push(slot);
  }
  // Only reachable for a bar of a single beat, which nothing in the catalogue
  // has. Two hits is the floor for a figure — one is an accent.
  if (heads.length < 2) heads.push(Math.max(1, slotsPerBar - SLOTS_PER_BEAT));
  return heads;
}

/**
 * The band's own figure, thinned until it is a shot rather than the part.
 *
 * A rhythm section's pattern is four to eight onsets and a shot is two to four:
 * the whole band playing a comp pattern in unison is not a shot, it is the band
 * playing. `thin` from `generate/rhythm.ts` is exactly the reduction wanted —
 * drop what the ear expects least, keep what it was already leaning on — and it
 * is metric rather than positional, so a 2+2+3 thins to its group heads instead
 * of to every other sixteenth.
 *
 * Returns nothing rather than a bad figure when the band has under two onsets to
 * offer, and the metre answers instead. A drone's bass is one note a bar.
 */
function bandHeads(
  band: readonly number[] | undefined,
  slotsPerBar: number,
  groups?: readonly number[],
): number[] | undefined {
  if (!band?.length) return undefined;
  const unique = [...new Set(
    band.map((s) => ((Math.round(s) % slotsPerBar) + slotsPerBar) % slotsPerBar),
  )].sort((a, b) => a - b);
  if (unique.length < 2) return undefined;

  let figure = unique;
  for (let keepAbove = 1; figure.length > 4 && keepAbove <= 4; keepAbove++) {
    const kept = thin(figure.map((at) => ({ at })), { slotsPerBar, groups, keepAbove })
      .map((h) => h.at);
    if (kept.length < 2) break;
    figure = kept;
  }
  return figure.length >= 2 ? figure : undefined;
}

/**
 * Draw a kind for every join in the song.
 *
 * **A style with no palette draws nothing at all** — not a draw that is made and
 * discarded. No `Rng` is constructed on that path, which is the single property
 * this whole mechanism has to preserve and the reason the plan is settled before
 * a note is written rather than beside the pass that consumes it. The lesson is
 * recorded at length beside `drumSource` in `song.ts`: one number taken out of a
 * shared stream moved every song in every genre and dropped a `npm run genres`
 * check from 66% to 59%, and the probe that settled it showed the songs moving
 * because a draw had been *consumed*, not because the draw mattered.
 *
 * One stream per seam rather than one per song, for the same reason the sections
 * have their own: adding a kind to one style's palette must not reshuffle the
 * seams after it, and a per-seam namespace is what makes the rate limiting in
 * wave 2 a filter over independent draws rather than a walk down a shared tape.
 *
 * Takes the seed rather than an `Rng` because the namespaces are per seam and
 * have to be derivable here — `planSolos` and `planChart` are handed a stream
 * because they each want exactly one.
 *
 * ## Two things a drawn kind still has to get past
 *
 * **The rate limit**, because the failure mode is novelty music and it arrives
 * fast. One expression carries both of the plan's rules: a gesture needs four
 * seams of clear air behind it, and the song's opening join counts as already
 * spent — so nothing happens at the first seam, for the reason a break before
 * the listener knows what is being broken is a stumble rather than a comment.
 * The bound that falls out is strictly under one seam in four, which is what
 * `npm run genres` asserts.
 *
 * **The box**, because a preset rhythm box has one pattern per button and
 * nobody's hands on it. `canVary` is false for exactly one source and it already
 * takes away the fill, the drum solo and the response to intensity; a band shot
 * is the same capability — a part that differs bar to bar — and it is taken away
 * here rather than at the edit, because the drummer's fill is vetoed off the
 * back of this answer and a seam that lost its fill to a shot the kit could not
 * play would arrive with nothing at all.
 *
 * ## …and two more that only a `break` has to get past
 *
 * **The floor**, from `MIN_BREAK_LAYERS`, read off the departing section's
 * `activeLayers`. **And the arriving section has to have been heard before**,
 * which is the third of the plan's rate rules and the one that only applies to
 * the kinds that take something away: a break is a comment on what is coming,
 * and a comment on a section nobody has heard yet is just a hole.
 *
 * Both are here rather than at the edit, and that placement is the whole reason
 * a rejected break costs nothing. The drummer's fill is vetoed off `kind` in the
 * section loop, so a break talked out of it *there* still takes the fill with it
 * and leaves the join announced by nobody. Talked out of it here, the seam is a
 * `fill` before the loop ever reads it and the song is the song it always was.
 * The floor is therefore stated against the layer plan rather than against the
 * notes — the honest number is not knowable until assembly, and by then it is
 * too late to be worth knowing.
 */
export function planTransitions(args: {
  sections: readonly Section[];
  /** Resolved style-over-genre. Absent or empty means no draw happens. */
  palette?: TransitionPalette;
  seed: string;
  /** Where a `shot`'s figure comes from. See `shotFigures`. */
  metre: ShotSource;
  /** What is making the drum sound. A preset box gets `fill` and nothing else. */
  drums: DrumSource;
  /**
   * Bars each section hands to the drummer alone, `[from, to)` and relative to
   * the section, keyed by section index. Only traded and full drum choruses have
   * any; everything else is absent from the map.
   *
   * Read from the solo *plan* rather than from `Section.solo`, which is the same
   * information and does not exist yet: the IR field is written inside the
   * section loop, and this runs before it. See `breakable`.
   */
  drumBars?: ReadonlyMap<number, readonly (readonly [number, number])[]>;
  /**
   * Who a `break` is handed to. Absent means `BREAK_CARRIER`, which is the bass.
   *
   * Read rather than drawn, so a style that names one takes no number out of any
   * stream and a style that does not plans the seams it always planned. See
   * `Style.breakCarrier`.
   */
  carrier?: BreakCarrier;
}): Seam[] {
  const { sections, palette, seed, metre, drums, drumBars } = args;
  const carrier = args.carrier ?? BREAK_CARRIER;
  const boxed = !canVary(drums);
  const seams: Seam[] = [];
  /**
   * The seam a gesture last landed on, starting at the join that has not
   * happened yet. Seam 0 is therefore never eligible, and the first that can be
   * is seam 4.
   */
  let spent = 0;
  for (let s = 0; s < sections.length - 1; s++) {
    // No palette, no stream: the property this whole mechanism rests on, and
    // the reason a `shot` could be added to one style without moving the other
    // twenty-seven. See above.
    const rng = palette?.length ? new Rng(`${seed}:transition:${s}`) : undefined;
    let kind: TransitionKind = rng ? rng.weighted(palette!) : 'fill';
    if (kind !== 'fill' && (boxed || s - spent < SEAMS_BETWEEN_GESTURES)) kind = 'fill';
    if (kind === 'break' && !breakable(sections, s, drumBars?.get(s), carrier)) kind = 'fill';
    if (kind === 'elide' && !elidable(sections, s)) kind = 'fill';
    if (kind !== 'fill') spent = s;
    // Drawn from the same per-seam stream, and after the rate limit rather than
    // before it, so a seam that was talked out of a gesture leaves the draw
    // unmade. Nothing else reads this namespace, so either order is safe; this
    // one is honest.
    const figure = kind === 'shot' ? rng!.weighted(shotFigures(metre)) : undefined;
    /**
     * …and whether it is aimed at the join or into the section behind it.
     *
     * Drawn for every shot rather than only where it can be honoured, so the
     * stream does not depend on how long a section happens to be. Rare on
     * purpose: the seam is this gesture's home and the middle of a section is
     * the variation on it, not the other way round.
     *
     * Four bars is the floor because below it `bars - 2` is the bar before the
     * join or the section's own first bar, and both of those are already spoken
     * for.
     */
    let anchor: Seam['anchor'];
    if (kind === 'shot' && rng!.chance(0.25) && (sections[s]?.lengthBars ?? 0) >= 4) {
      anchor = 'inside';
    }
    seams.push({
      section: s,
      bar: sections[s + 1]!.startBar,
      kind,
      ...(figure ? { figure: [...figure] } : {}),
      ...(anchor ? { anchor } : {}),
    });
  }
  return seams;
}

/**
 * Seams of clear air a non-`fill` gesture needs behind it.
 *
 * Four, from the plan's *at most one per four seams*, and the number is a guess
 * that is meant to be listened to rather than reasoned about further.
 */
const SEAMS_BETWEEN_GESTURES = 4;

/**
 * Layers a section needs before its seam may draw a break.
 *
 * Three, from the plan's §10, where it is named as the mitigation for the one
 * risk this kind carries: a break *silences layers*, and `layersFor` has already
 * decided which layers a section has, so a break dropped into a duo is not the
 * band stopping, it is the arrangement getting thinner for a bar.
 *
 * **And it has never once fired**, which is the finding rather than a
 * disappointment. Measured over 202 break candidates spanning every genre and
 * style with the palette forced, the smallest `activeLayers` at a candidate seam
 * was three and the distribution ran 3:14 4:40 5:101 6:38 7:9. `layersFor` does
 * not write two-layer sections at the kind of seam that can draw one, so the
 * guard as the plan specified it is inert.
 *
 * It is kept anyway, for two reasons and not out of deference. It is the only
 * statement in the file of *why* thinness matters, and deleting it would mean
 * re-deriving that argument the first time a genre ships a sparser chart —
 * ambient and `berlin` are exactly that, and wave 5 is where they get palettes.
 * And it costs one array length.
 *
 * What the plan got wrong is not the number, it is the population. The layer
 * plan is a claim about a whole section; the risk lives in one *bar* of it, and
 * a layer listed for the section can be resting in its last bar — measured, the
 * last bar before a seam has fewer than three layers sounding in it about a
 * quarter of the time, in a catalogue where the plan says three or more every
 * time. `playBreak` is where that gets answered, and it answers a different
 * question rather than this one restated. See the note there.
 */
const MIN_BREAK_LAYERS = 3;

/**
 * May this seam take the band out for a bar?
 *
 * Four questions, all answerable from the form alone and none of them about
 * notes, which is what lets them be asked here — see `planTransitions` for why
 * asking late would be worse than not asking.
 */
function breakable(
  sections: readonly Section[], s: number,
  drumBars: readonly (readonly [number, number])[] | undefined,
  carrier: BreakCarrier,
): boolean {
  const leaving = sections[s]!;
  const arriving = sections[s + 1]!;
  // Thin already: see `MIN_BREAK_LAYERS`.
  if (leaving.activeLayers.length < MIN_BREAK_LAYERS) return false;
  /**
   * …and somebody has to be left holding it.
   *
   * The carrier is named rather than found — by the style where it says so and
   * by `BREAK_CARRIER` where it does not — so whether this section *has* one is
   * a question about the layer plan, and a question about the layer plan is free
   * here.
   *
   * **It is no longer inert, and it was not the declared carrier that woke it
   * up.** The note that used to stand here said it had never fired over 2300
   * drawn breaks; re-measured across every genre and style at a forced palette,
   * 30 seeds each, it stands down 42 of the 16133 seams that reach it — 0.3%,
   * and every one of them is finnfolk's `piirileikki`, the one style in the
   * catalogue that writes `excludeLayers: ['bass', …]`. That is the guard doing
   * exactly what it was written for, in the sparse repertoire it was kept for.
   *
   * A declared carrier makes it the load-bearing one. `layersFor` puts a bass in
   * every section it writes and puts `pad` and `melody` into some section kinds
   * and not others, so the same forced sweep stands down 4.0% of seams on the
   * `comp` — jazz's `odd`, `fusion` and `trio`, where the piano is the lead
   * rather than the accompaniment — and 38.6% on the `pad`. A style that hands
   * its break to the wash gets `fill` at two seams in five, which is the right
   * answer and a cheap one: it is settled at the *draw*, so the drummer keeps a
   * fill that was never vetoed, and the seam is announced exactly as it always
   * was.
   */
  if (!leaving.activeLayers.includes(carrier)) return false;
  /**
   * …and the drummer does not already own the bar.
   *
   * Where a traded section hands the kit its last bars the band is already out
   * and the drummer is already alone in them: the break has happened, written by
   * somebody else, and there is nothing left for this to take away. `playBreak`
   * refuses the same case at the edit and has to — it deletes drum events, and
   * that one would be deleting a drum solo — but refusing it *here* is what makes
   * the refusal free. Measured over 200 fusion songs it was thirteen of the
   * eighteen breaks that were drawn and then did not happen, and each of those
   * had spent the song's one gesture on a bar where nothing could change.
   */
  const lastBar = leaving.lengthBars - 1;
  if (drumBars?.some(([a, b]) => lastBar >= a && lastBar < b)) return false;
  /**
   * …and the section being delivered has to be one the listener knows.
   *
   * The plan's third rate rule, and the same sentence the mid-section tutti in
   * `song.ts` already lives by: *reserved for a chorus that has already been
   * stated once, because the gesture is a comment on something the listener
   * knows*. Stopping the band to announce a section nobody has heard is a
   * stumble — there is nothing yet for the silence to be about.
   *
   * By kind rather than by identity, because that is what "stated" means here:
   * the second chorus is the same chorus coming round, and the form is a
   * sequence of kinds. Counted over everything up to and including the section
   * being left, so the arriving one is not allowed to count itself.
   */
  return sections.slice(0, s + 1).some((x) => x.kind === arriving.kind);
}

/**
 * May the band arrive early into this join?
 *
 * One rule, and it is about *harmony* rather than about rhythm. An elide moves
 * the arriving section's downbeat back an eighth, so the note sounds over the
 * departing section's last chord. Inside a key that is exactly what an
 * anticipation is and is the whole reason the gesture works: the new harmony
 * takes an eighth off the old one and the ear hears it arriving.
 *
 * Across the final chorus's semitone lift it is something else entirely — an
 * unprepared semitone clash, on the loudest bar of the song. That is the worst
 * bar this mechanism could produce and it costs one comparison to refuse.
 *
 * Here rather than at the edit, for the reason `breakable` gives at length: a
 * gesture talked out of it late has already cost the drummer the fill, and the
 * seam arrives announced by nobody.
 */
function elidable(sections: readonly Section[], s: number): boolean {
  const leaving = sections[s];
  const arriving = sections[s + 1];
  return !!leaving && !!arriving && leaving.transpose === arriving.transpose;
}

/**
 * Edit the assembled song at its seams.
 *
 * ## Where this runs, which is the least obvious thing in the design
 *
 * **After swing**, and that is not arbitrary. An `elide` lands its anticipation
 * on an eighth, and in a swung style the eighth is not where the grid says it
 * is; computing the target before swing puts the band's push a triplet away from
 * the drummer's, which sounds like a mistake rather than like a push. Running
 * last, this reads the actual sounding grid.
 *
 * **The plan said "after `applySwing`" and there is no such single moment**,
 * which is a correction worth writing down rather than discovering twice.
 * `applySwing` is called at four separate places in `song.ts` — the melody and
 * counter before their overlap trim, each left hand as it is merged in, every
 * other layer inside the track-building loop, and the kit in the `DrumTrack`
 * literal. The first point at which *every* layer is on its sounding grid is
 * therefore after `tracks` and `drums` exist, so this takes an assembled `Song`
 * and edits it in place, rather than taking `byLayer` as the plan's §4 assumed.
 *
 * **And before `landEnding`.** The ending rewrites the final bar and it is not
 * negotiable by a transition: a shot that re-timed the landing chord would be an
 * arrangement arguing with a full stop. The reverse order would let it.
 *
 * The one cost of running last: velocities have already been through
 * `applyDynamics`, so a shot's accent lands on top of the section's level rather
 * than underneath it. That is the right way round — a shot is an accent, not a
 * level — but it has to be capped, because `intensity` is allowed above 1.0 on a
 * final chorus.
 *
 * ## What it does
 *
 * `fill` is nothing, and that is the honest answer rather than a stub. A fill is
 * *already* an edit made in the right place: `generateDrums` writes it into the
 * last bar of the section during the section loop, sized by the arrival, and the
 * seam plan's only say over it is the veto wired at that call site. Moving it
 * out here was considered and rejected — it would have to be re-derived from
 * `arrival`, `machine`, `lastBarIsSolo` and the style's `FillPalette`, all of
 * which are section-loop locals, and the move would change no note while risking
 * every one of them.
 *
 * `shot` is `playShot`. Everything it needs is on the `Song` by this line — the
 * bar, the figure, every layer's notes and the kit's events, all in one
 * coordinate space — which is the same observation that made editing at
 * assembly the cheap design in the first place.
 *
 * The `never` in the default is what makes a fifth kind a compile error here
 * rather than a silent omission.
 */
export function applyTransitions(
  song: Song,
  seams: readonly Seam[],
  /**
   * The swing in force at a given beat, so an elide can find the eighth *as it
   * sounds*. Defaults to straight, which is what every caller but `song.ts`
   * wants and what a test rig means when it says nothing.
   */
  swingAt: (beat: number) => number = () => 0,
  /**
   * Who a `break` leaves holding the bar. Defaults to `BREAK_CARRIER`, which is
   * what every style that has not been asked the question means — see
   * `Style.breakCarrier`.
   *
   * A parameter rather than a field on `Seam`, and the two are not
   * interchangeable. `figure` is on the IR because it is *drawn* per seam and is
   * the one value a drum event is derived from, so `genre-check.ts` reads it off
   * two songs to check the hook guarantee at its source. A carrier is one static
   * value for the whole song; putting it on every seam would be publishing the
   * same literal three times and inviting a reader to believe it could differ.
   */
  carrier: BreakCarrier = BREAK_CARRIER,
): void {
  /**
   * What the drummer is sitting at, asked once for the song.
   *
   * Off the events and the bank rather than off a table, because that is the
   * question `cast.ts` asks of the same two values when it decides who is on
   * the stage — see the note at the top of this file. Once per song rather than
   * per seam: the percussion of a song is one band, and a pass that answered
   * this per bar would let the drummer change instrument at the fourth join.
   *
   * **Downstream of the drummer's own fills, and deliberately so.** The events
   * this reads already contain whatever `generateDrums` wrote at every seam that
   * drew `fill`, which is most of them — so a genre whose fills conscripted a
   * kit would hand one to the shot as well. That is not a coupling to be broken;
   * it is the same coupling casting has, and the two agreeing is the property
   * worth having. Both halves take their station from `generate/fills.ts`, so
   * there is one table and one answer.
   */
  const station = seamOrchestration(song.drums.events.map((e) => e.voice), song.drums.bank);
  for (const seam of seams) {
    switch (seam.kind) {
      case 'fill':
        // Delegated to `generateDrums`. See above.
        break;
      case 'shot':
        if (seam.figure?.length) playShot(song, seam, seam.figure, station);
        break;
      case 'break':
        playBreak(song, seam, carrier, station);
        break;
      case 'elide': {
        const landing = seam.bar * song.meta.beatsPerBar;
        /**
         * The eighth as it sounds, not as the grid draws it.
         *
         * `applySwing` moves an offbeat *later* by half the swing, so in a
         * shuffled style the note before a downbeat sits closer to it than a
         * plain eighth. Taking 0.5 regardless would put the band's push a
         * triplet away from the drummer's, which reads as sloppiness rather
         * than as a push — and is the entire reason this pass runs last.
         */
        const swing = Math.max(0, swingAt(landing - 0.5));
        playElide(song, seam, 0.5 * (1 - swing));
        break;
      }
      default: {
        const unreachable: never = seam.kind;
        return unreachable;
      }
    }
  }
}

/**
 * The whole band, including the kit, on one figure in the bar before a seam.
 *
 * Two halves, and they are deliberately not symmetrical.
 *
 * **The band** is `hitTogether`, unchanged from the tutti it was written for: it
 * takes one onset's worth of pitches per hit from what the part was already
 * holding, so a chord stays a chord and a bass line stays one note, and it
 * declines to do anything to a layer with fewer than two notes in the bar. That
 * last property does the work of a "is this layer sounding" test for free, and
 * it is also why a band hushed under a drum solo comes out untouched. A
 * sequenced part is skipped outright — a machine does not stop keeping time to
 * hit a figure with anybody, which is the same statement `Track.machine` already
 * makes about solos and fader rides.
 *
 * **The kit** is written from scratch, and every input to it is hook-invariant:
 * the figure (a table or the metre), the bar (the seam plan), and the level
 * (the kit's own velocities in the bar it is replacing). Nothing is read from
 * any `Track`, and that is a rule rather than an accident — note velocities have
 * been through the tune, `patchBand` and `applyDynamics`, and a drum event that
 * borrowed one would move with `--hook` and break the guarantee this whole
 * design exists to keep.
 *
 * What the drummer plays is what a drummer plays: the figure on kick and snare,
 * the ride and hats gone for its duration, the crash kept for the landing. That
 * last one has to be added here, because the crash belongs to `landing()` in
 * `fills.ts` and `generateDrums` only reaches it when it has written a fill —
 * which this seam has just vetoed. A shot that took the fill away and the cymbal
 * with it would arrive on nothing.
 *
 * **…and what a drummer plays depends on what they are sitting at.** The three
 * voices in that sentence are `SeamOrchestration.shot` and `.survives`, and on
 * one head they come out as one stroke and nothing spared: two voices written at
 * one instant on one skin are a flam played by accident, and a doum in the bar
 * being replaced is the pulse rather than a marking, so there is nothing in
 * there that can be told apart from what is going. A tihai is this edit exactly
 * — the figure struck two or three times in the bar before the join and the
 * arrival landing on sam, which `markTheLanding` puts there.
 *
 * **The figure is placed on the straight grid, and that is a live question the
 * moment this widens past `fusion`.** Running after swing is what lets an
 * `elide` land on the eighth the drummer is actually playing; a shot does not
 * move an onset, it writes one, and slot 6 of a swung bar is not where the
 * swung eighth sits. It is coherent as it stands — every layer including the kit
 * is placed by this same arithmetic, and everything they would have disagreed
 * with has just been deleted for the bar — so a shot in a shuffle reads as the
 * band playing the figure even, which is a real way to play one. Whether it is
 * the *right* way is a listening question, and `fusion` is straight, so it is
 * not yet an answered one.
 */
function playShot(
  song: Song, seam: Seam, figure: readonly number[], station: SeamOrchestration,
): void {
  const bpb = song.meta.beatsPerBar;
  const slotsPerBar = Math.round(bpb * SLOTS_PER_BEAT);
  const section = song.sections[seam.section];
  /**
   * The bar the band hits, which is the one before the join unless it was aimed
   * elsewhere.
   *
   * `bars - 2` for an `inside` shot, and *not* the bar-0-or-`bars - 2` pair the
   * mid-section tutti in `song.ts` draws between. The tutti can take bar 0
   * because it is bass and comp only; this one has the kit on it, and the first
   * bar of a section is the downbeat the previous seam just delivered — a shot
   * with a cymbal there is two arrivals in one bar.
   */
  const shotBar = seam.anchor === 'inside' && section
    ? section.startBar + Math.max(0, section.lengthBars - 2)
    : seam.bar - 1;
  const from = shotBar * bpb;
  const to = from + bpb;
  const beats = figure
    .filter((slot) => slot >= 0 && slot < slotsPerBar)
    .map((slot) => from + slot / SLOTS_PER_BEAT);
  // One hit is an accent, not a figure — and `hitTogether` would flatten a whole
  // bar onto it.
  if (beats.length < 2) return;

  for (const track of song.tracks) {
    if (track.machine) continue;
    track.notes = hitTogether(track.notes, from, to, beats);
  }

  /**
   * The drummer keeps their own bar.
   *
   * Where a traded section hands the kit the last bar, the drum solo generator
   * has already written an ending into it and `fillAtEnd` was already false.
   * Putting a band figure over that is two drummers announcing the same
   * downbeat — the objection `generateDrums` makes about its own fill, one
   * level up. The band above is unaffected: it was hushed for those bars, so
   * `hitTogether` found nothing to move.
   */
  const barInSection = shotBar - (section?.startBar ?? 0);
  if (section?.solo?.blocks?.drumBars.some(([a, b]) => barInSection >= a && barInSection < b)) {
    return;
  }

  const kit = song.drums.events;
  const inBar = (e: DrumEvent) => e.beat >= from - 1e-6 && e.beat < to - 1e-6;
  const bar = kit.filter(inBar);
  // No kit in this bar is a section the drummer is out of, and a band shot does
  // not bring them back in for one bar.
  if (!bar.length) return;

  /**
   * How hard, taken from what the kit was already doing here.
   *
   * The kick and the snare rather than the whole bar, because a hat median is a
   * time-keeping level and this is not that. A shot is an *accent* and lands on
   * top of the section's dynamics rather than underneath them — the cost of
   * running last — so it is nudged up and capped, since `intensity` is allowed
   * above 1.0 on a final chorus and anything on top of that clips.
   *
   * **Asked of the station rather than of a kit**, which is the last literal in
   * this file and the quietest of the four §2.1 named. It writes no stroke, so
   * it could never have staged an instrument or shown up in a count of wrong
   * voices — it only decided *how hard*. The two voices are `weight` and
   * `ordinary`, and on a skin they are the doum and the open tone: the pulse of
   * the bar and the stroke the figure is stated on, which is the same pair of
   * jobs `bd` and `sd` hold on a kit. What it excludes there is the riq and the
   * slap, and the sentence above is the reason — a riq median is a timekeeping
   * level in exactly the way a hat median is. The kit's answer is unchanged to
   * the bit, because `TRAP_KIT` names those two jobs `bd` and `sd`.
   *
   * The fallback to the whole bar carries the case neither pair covers: a
   * `riq-only` pattern, where the level of the bar is all there is to read.
   */
  const hits = bar.filter(
    (e) => e.voice === station.weight || e.voice === station.ordinary,
  );
  const level = median((hits.length ? hits : bar).map((e) => e.velocity));
  const velocity = Math.min(1, level * 1.12);

  // The crash is the only thing that survives the bar: it is the drummer
  // marking something, and everything else in here is keeping time. On a skin
  // that distinction has nothing to stand on and the list is empty — see
  // `SeamOrchestration.survives`.
  const kept = kit.filter((e) => !inBar(e) || station.survives.includes(e.voice));
  for (const beat of beats) {
    for (const voice of station.shot) kept.push({ beat, voice, velocity });
  }

  song.drums.events = markTheLanding(kit, kept, to, bpb, station);
}

/**
 * The cymbal on the downbeat the gesture was aiming at.
 *
 * Both kinds that rewrite a bar of kit need this and need it for the same
 * reason: the drummer's fill is vetoed at any seam that drew a gesture, and the
 * crash belongs to `landing()` in `fills.ts`, which `generateDrums` only reaches
 * when it has written one. A shot that took the fill away and the cymbal with
 * it, or a break that stopped the band and brought them back in on nothing,
 * would each arrive quieter than the plainest seam in the catalogue.
 *
 * `arrival` is read off the kit in the bar it lands on rather than passed in,
 * because the section's intensity is a section-loop local and this pass runs
 * long after it. The loudest thing the drummer plays on arriving is
 * `accentOf × intensity × jitter` with the accent at or near 1, so it is the
 * same number to within the jitter — and, unlike the intensity itself, it is
 * made of drum events, which is the one kind of value this file is allowed to
 * derive a drum event from.
 */
function markTheLanding(
  kit: readonly DrumEvent[], kept: DrumEvent[], to: number, bpb: number,
  station: SeamOrchestration,
): DrumEvent[] {
  const arriving = kit.filter((e) => e.beat >= to - 1e-6 && e.beat < to + bpb - 1e-6);
  const arrival = arriving.length ? Math.max(...arriving.map((e) => e.velocity)) : 0;
  /**
   * …unless the downbeat is already marked, which is asked of the station's own
   * arrival stroke rather than of a cymbal.
   *
   * It is a live question on a hand drum in a way it never was on a kit. A crash
   * on the first beat of a section could only have come from a landing; a doum
   * there is also the commonest single event in the whole vocabulary — the
   * groove's own downbeat, the first stroke of a phrase, the hand-off at the end
   * of a tani. So this now suppresses the arrival wherever the drummer was
   * already going to play one, which is the right answer and a much more
   * frequent one: an arrival is a stroke *placed* on the downbeat, and placing a
   * second one on top of a stroke that is already there is a flam.
   */
  const marked = kept.some((e) => e.voice === station.land && Math.abs(e.beat - to) < 1e-6);
  if (arrival > 0 && !marked) kept.push(landing(to, Math.min(1, arrival), station));
  return kept.sort((a, b) => a.beat - b.beat);
}

/**
 * Stop-time: the band out for the bar before a seam, one named layer carrying it.
 *
 * Every other kind in this file is a rewrite. This one is a deletion, and it is
 * the oldest gesture in the repertoire because it costs a band nothing and
 * costs a listener their footing — the time keeps going in their head and there
 * is nothing under it, so the downbeat that ends it lands harder than any fill
 * could make it land.
 *
 * ## The carrier is named, rather than found
 *
 * One layer, no list, and nothing read off a note. The top of this file argues
 * why nothing *can* be read off a note; what makes that cheap rather than a
 * concession is that the question had a better answer anyway.
 *
 * **"Whoever happened to fill the bar" was already the wrong answer, with no
 * `--hook` in sight.** A break is the rhythm section stopping and one voice
 * being left in the open, and which voice that is is a fact about the
 * arrangement, not about which part had notes in one bar. Deciding it from the
 * notes gave the same style a bass break in one song, an answering line in the
 * next and a comp chord in the third, for a reason no listener could name — and
 * it let a stray pickup win, which is how this kind produced the worst bar of
 * its own wave: a break carried by one thirty-second note 0.03 beats before the
 * arriving downbeat. `MIN_BREAK_COVER` was the patch for that, and it is gone
 * with the rest of the search, because naming the carrier answers the same
 * failure at the root — the bass either plays the bar or it does not, and it is
 * hardly ever a decoration in it. Measured over 1359 breaks with palettes forced
 * across eleven styles, the bass covers a median 75% of the bar it is handed and
 * sits in the 0–33% band that the old floor existed to reject in 0.4% of them.
 *
 * **And it is the voice a break wants.** The bass is the last one in this band
 * that can state time unaccompanied, which is the property a carrier actually
 * needs, and it is the one that is genuinely there: the tune covers a median 20%
 * of the same bars, because a tune ending a section has finished its phrase and
 * the bass has not. It is also where the old search mostly landed anyway — 585
 * of those 1359 bars, against 404 for the melody, 118 for the counter and 58 for
 * the comp — so this is a smaller change in the ear than it is in the diff.
 *
 * **The soloist was the plan's first choice and is not here**, which is the one
 * real loss. Handing a player the bar alone is what a break has always been
 * *for* — but that is a break the soloist plays *through*, and this engine
 * cannot write one: the seam plan is settled before a note exists, and the solo
 * is composed without knowing a break is coming. Over the 531 of those breaks
 * that end a solo chorus the soloist covers a median 19% of their own last bar,
 * so handing them the bar hands it to nobody more often than not. It wants the
 * solo generator told about the seam, which is a `song.ts` change and not this
 * one.
 *
 * ## …and the name is the style's to give
 *
 * The bass is the right default and it is not the right answer everywhere. A
 * taqsim ends on the qanun and a breakdown belongs to the guitars, and
 * `TransitionPalette` already let a style name the vocabulary it draws from
 * without letting it say who plays it. `Style.breakCarrier` is that second half
 * and this function's `carrier` argument is where it arrives, resolved
 * style-over-default in `generateSong` beside `transitions` itself.
 *
 * **It cannot reintroduce the hook-dependence the named carrier was written to
 * remove, and that is worth stating rather than assuming.** The rule at the top
 * of this file is that no drum event may be written, deleted or moved on the
 * strength of anything that changes with `--hook`, and *whether a break happens*
 * is such a strength. A style table is a literal: it is written once, read
 * rather than drawn, and identical at every one of the five hook levels, so a
 * carrier taken from one has exactly the standing a `shots` figure has and for
 * exactly the same reason. It also costs no draw — nothing is weighted, nothing
 * is picked — so a style that names one does not shift a single number for any
 * other style, and a style that names nothing generates the song it generated
 * before this argument existed, bit for bit.
 *
 * What *would* break the guarantee is a carrier whose presence in a section
 * moves with the tune, and there are exactly two of those. They are unnameable:
 * `BreakCarrier` takes `counter` and `brass` out of `LayerId` at the type level,
 * on the measurement `BAND_TAKEN_BY_A_BREAK` records below.
 *
 * ## Three refusals, and all three are about the arrangement
 *
 * A break has to take something away and leave somebody, and with the carrier
 * named rather than found, both halves of that are questions about the plan.
 * `breakable` asks the first two at the *draw*, where a refusal costs nothing —
 * `MIN_BREAK_LAYERS` is the coarse form of one and the carrier check is the
 * other. What is left for here is the same pair put to the arrangement that
 * actually got made, which is not the one the plan promised: a section listed
 * with five layers can reach its last bar as a duo, because a solo's backing
 * policy thinned it on the way. That gap is the whole reason they are worth
 * re-asking, and the cost is the honest one — the fill has already been vetoed,
 * so a seam refused here arrives announced by nobody.
 *
 *  - **The arrangement still lists the carrier.** Otherwise this is not a break,
 *    it is a rest with a crash on the end of it.
 *  - **There is still a band to take away.** `BAND_TAKEN_BY_A_BREAK` is that
 *    test, and its list is short for a reason given there.
 *  - **The carrier is not the one soloing.** A break under a bass solo is the
 *    band getting out of the way of a player it is already out of the way of: by
 *    the last bar the section is the bass and the drummer, and taking the drummer
 *    out leaves the bar to a soloist who has just finished their chorus. It is
 *    the refusal `breakable` already makes about a drummer's traded bars —
 *    somebody else has written this break — and it cannot be made up there,
 *    because `Section.solo` is written inside the section loop and the plan is
 *    drawn before it. Stated against the carrier rather than against the bass,
 *    so a style that hands the break to its guitars stops handing it to a
 *    guitarist who has just finished soloing on it.
 *
 * Together they stand down 4.3% of drawn breaks — measured over 2318 of them,
 * every genre at a forced palette — and take the bars that come out with nothing
 * sounding in them from 29 to 5. **Those five are real, and they are all one
 * shape**: a genre whose bass is a drone rather than a timekeeper — six notes in
 * an eight-bar section, none of them near the seam.
 *
 * **A declared carrier fixes them, and which name is declared is the whole of
 * it.** Re-measured wider — every genre and style at a forced palette, 30 seeds
 * each, 10517 drawn breaks against the 2318 above — the residual is 43 empty
 * bars, which is the same rate to within a factor of two and, more usefully, the
 * same single genre: every one of them is `indian`. The shape is exactly as
 * reported the first time. The tanpura writes six notes
 * into an eight-bar section, all of them in its first bar, and by the seam it
 * stopped three bars ago. What is still sounding there is the *śruti box* —
 * `pad` in that genre's palette, a reed organ or a string section holding one
 * note for the whole section — which is both the thing the music actually has
 * behind it and the thing nobody in this repertoire ever switches off.
 *
 * | carrier | empty bars, same sweep |
 * |---|---|
 * | `bass` (default) | 43, all `indian` |
 * | `comp` | 87 |
 * | `melody` | 1047 |
 * | `pad` | **0** |
 *
 * So the gap closes, and it closes for the whole catalogue rather than for the
 * genre that reported it — but only under the name that genre would actually
 * write, and the two names next to it make the count worse. `melody` is the
 * worst by twenty-four times, for the reason the paragraph above already
 * measured: a tune that has finished its phrase is precisely what is not there
 * at a seam. That is the argument for the field rather than against it. Nothing
 * visible from inside this pass separates a tanpura from a walking bass, and the
 * style knows which one it wrote.
 *
 * ## And the kit stops with everybody else
 *
 * The gesture does not survive a drummer keeping time through it — that is the
 * band resting, not the band stopping. So the bar is emptied outright, crashes
 * excepted, on exactly the reasoning `playShot` gives about the same bar: a
 * cymbal is the drummer *marking* something and everything else in there is
 * keeping time. In practice a section's last bar carries a crash only where the
 * section is one bar long and the crash belongs to the seam *before* this one,
 * which is a landing this pass has no business deleting.
 *
 * Which is `SeamOrchestration.survives`, and on a hand drum it is empty — the
 * bar goes whole. The exception was never about mercy, it was about a stroke
 * that goes on sounding after the hands have stopped, and a skin has none.
 */
function playBreak(
  song: Song, seam: Seam, carrier: BreakCarrier, station: SeamOrchestration,
): void {
  const bpb = song.meta.beatsPerBar;
  const from = (seam.bar - 1) * bpb;
  const to = seam.bar * bpb;

  /**
   * The drummer keeps their own bar, and here that ends the matter rather than
   * half of it.
   *
   * Where a traded section hands the kit the last bar the band is already out
   * and the drummer is already alone in it — the break has happened, written by
   * somebody else — and running this over the top would delete the drum ending
   * and leave the bar genuinely empty.
   *
   * `breakable` refuses the same case at the *draw*, which is where the cost is
   * saved rather than the damage prevented, so in practice this never fires
   * today. It stays because the two are answering different questions: that one
   * is deciding whether to spend a gesture, and this one is refusing to delete a
   * drum solo. A pass that edits a `Song` should be safe against the plan it is
   * handed rather than trusting that the plan was made here.
   */
  const section = song.sections[seam.section];
  const lastBar = (section?.lengthBars ?? 0) - 1;
  if (section?.solo?.blocks?.drumBars.some(([a, b]) => lastBar >= a && lastBar < b)) return;

  // The three refusals, in the order they are argued above. Every one of them is
  // a question about the layer plan and the solo assignment, which is to say
  // about things `--hook` has been measured not to move — and the carrier is a
  // style literal, which cannot move at all.
  if (!section?.activeLayers.includes(carrier)) return;
  if (!section.activeLayers.some(
    (layer) => layer !== carrier && BAND_TAKEN_BY_A_BREAK.includes(layer),
  )) return;
  if (section.solo?.layer === carrier) return;

  /**
   * Everybody out but the carrier — left hand, singer and all.
   *
   * **The singer goes with the tune**, because the singer *is* the tune: `vocal`
   * is the melody line doubled after swing, so it has no onset the melody did not
   * have and nothing of its own to carry.
   *
   * **And the singer stays with the tune**, which is the same sentence read the
   * other way and the one line a declared carrier needed. A style that hands the
   * break to `melody` is handing it to the tune, and a vocal hushed off the top
   * of a melody that is still playing would be the singer stopping mid-phrase
   * while their own doubling instrument carried on — the one thing `vocal` is
   * defined as not being. It costs a comparison and it is inert on the default
   * carrier, where the two go out together as they always did.
   *
   * **A two-handed lead goes whole**, in whichever direction the carrier sends
   * it. `generateLeftHand` writes the comping into the melody part and marks it,
   * so the track is one player doing two jobs and one decision covers both: they
   * stop together under a bass break and they carry it together under a `melody`
   * one, which is what a pianist left alone in a bar actually does. The old
   * carrier search had to know that — a bar where the
   * right hand rested and the left hand comped read as *the tune is playing* and
   * came out empty once the break had run, six bars in 200 fusion songs — and
   * with nothing being searched for, the trap is gone rather than avoided.
   *
   * **A sequencer is skipped rather than stopped**, for the reason
   * `Track.machine` gives everywhere else in this file: nobody's hands are on it,
   * so it neither stops nor plays a break. Where a style has one it runs through
   * the bar and the break is the band dropping out around it, which is what that
   * music does anyway.
   */
  const carried = (layer: LayerId) => layer === carrier
    || (carrier === 'melody' && layer === 'vocal');
  for (const track of song.tracks) {
    if (track.machine || carried(track.layer)) continue;
    track.notes = hush(track.notes, from, to);
  }

  const kit = song.drums.events;
  const inBar = (e: DrumEvent) => e.beat >= from - 1e-6 && e.beat < to - 1e-6;
  song.drums.events = markTheLanding(
    kit, kit.filter((e) => !inBar(e) || station.survives.includes(e.voice)), to, bpb, station,
  );
}

/**
 * Who a style may leave holding a break.
 *
 * `LayerId` with four values taken out of it, and none of the four is a matter
 * of taste — each is a failure this file has already measured, made unwritable
 * rather than documented. The house alternative is a runtime check nobody runs;
 * a union that will not compile is the same argument the `never` in
 * `applyTransitions`' default case makes about a fifth `TransitionKind`.
 *
 *  - **`drums`** is the layer a break takes away *by definition*. The bar is
 *    emptied of kit outright and the argument for that is at the top of
 *    `playBreak`: a break the drummer plays through is the band resting, which
 *    is a different and much quieter effect. Naming the kit would be asking for
 *    the gesture and its negation in one word.
 *  - **`counter` and `brass`** are the two layers whose membership of a
 *    section's `activeLayers` moves when `--hook` does — 286 and 3 of 7354
 *    sections, against zero for every other layer, because one answers the
 *    melody's gaps and the other is placed around it. Every refusal in
 *    `playBreak` and `breakable` is stated against `activeLayers`, so a carrier
 *    drawn from those two would put *whether the kit gets emptied* back on the
 *    wrong side of the guarantee — the exact bug the named carrier was
 *    introduced to close, returning through the door left open for the fix.
 *    `BAND_TAKEN_BY_A_BREAK` leaves them out on the same measurement.
 *  - **`vocal`** is never in `activeLayers` at all: `layersFor` in
 *    `generate/chart.ts` never puts it there, and the singer is the melody
 *    doubled after swing rather than a part with onsets of its own. A style
 *    naming it would get no break for the length of the catalogue while its
 *    table looked like it was working — the failure mode `TwoHandedKeys.ostinato`
 *    is asserted against. A style that wants the singer left holding the bar
 *    names `melody`, and the singer stays with the tune; see `playBreak`.
 *
 * What is left is the four parts that can be left alone in a bar and still be
 * the piece: the bass, the chords, the wash and the tune.
 */
export type BreakCarrier = Exclude<LayerId, 'drums' | 'counter' | 'brass' | 'vocal'>;

/**
 * Who is left holding a break when the style has not said.
 *
 * A layer id and not a search, which is the whole of the fix and is argued at
 * length in `playBreak`: the musical answer to *who carries the seam* is a role,
 * the role is the one that can state time on its own, and a role is a property
 * of the band rather than of one bar's notes. It is also the only kind of answer
 * available to a pass that may not read a note — see the top of this file.
 *
 * The bass, because it is the last voice in this band that can state time
 * unaccompanied and because it is the one that is genuinely there: over 1359
 * breaks with palettes forced across eleven styles it covered a median 75% of
 * the bar it was handed, against the tune's 20%. `Style.breakCarrier` overrides
 * it and costs no draw to do so, so this is a default in the ordinary sense —
 * what a band that has not been asked the question does, exactly as
 * `DEFAULT_TRANSITIONS` is above.
 */
const BREAK_CARRIER: BreakCarrier = 'bass';

/**
 * The band a break takes something away from, besides the kit and the carrier.
 *
 * Five layers rather than "everything else", and the two that are missing are
 * the point. `counter` and `brass` are the layers written *against* the finished
 * tune — one answers the melody's gaps, the other is placed around it — so they
 * are the two whose membership of a section's `activeLayers` moves when `--hook`
 * does: 286 and 3 of 7354 sections, against zero for every other layer. Counting
 * them here would make *whether the kit gets emptied* depend on the tune with a
 * layer plan worn as a disguise, which is precisely the bug this pass exists to
 * close. It is the same measurement that keeps them out of `BreakCarrier`.
 *
 * What is left is the band a listener would miss: the low end, the chords, the
 * wash and the tune. If a section has none of them by its last bar it is a
 * rhythm section playing on its own, and taking the drummer out of that is not
 * stop-time — it is the arrangement getting thinner for a bar, which is the
 * failure `MIN_BREAK_LAYERS` is written against, arriving after the plan
 * promised otherwise.
 *
 * **The carrier is filtered out at the call site rather than left out of the
 * list**, which is why `bass` is in it now and was not before. The list is *the
 * band*, and who is carrying is a separate fact; writing the carrier's absence
 * into the literal was only correct while there was exactly one carrier it could
 * be. On the default it is the same four names as ever and the same answer bar
 * for bar — but a style that hands its break to the `comp` is stopping a bass,
 * and a test that could not see a bass would have called that section a rhythm
 * section playing alone and refused the break it had already spent the fill on.
 */
const BAND_TAKEN_BY_A_BREAK: LayerId[] = ['bass', 'comp', 'pad', 'melody', 'vocal'];

/**
 * Take a part out for a span.
 *
 * Two edits and not one, because a rest is not the absence of an onset — it is
 * the absence of *sound*. Dropping what is struck inside the span leaves
 * anything that was already ringing sounding straight through it, and a pad
 * holding a whole note across the break is the difference between the band
 * stopping and the band merely not playing anything new. So the held note is cut
 * at the barline, which is where the player would have lifted.
 *
 * Shortening a note is still an edit rather than a composition — nothing is
 * written that was not going to exist, and the note's own end moves earlier,
 * never later, so nothing downstream inherits an overlap it did not have.
 *
 * **Exported for `generate/drop.ts`**, which is the same edit over a span of
 * bars rather than a bar at a seam. Shared rather than reimplemented for the
 * reason `anticipate` is shared between the seam elide and the phrase-end bass
 * push: two copies agree on the day they are written and drift by the second bug
 * fixed in one of them, and the way *this* one would drift is the held-note cut
 * above — the half nobody thinks of, and the half that is the difference between
 * the band stopping and the band merely not playing anything new.
 */
export function hush(notes: NoteEvent[], from: number, to: number): NoteEvent[] {
  const out: NoteEvent[] = [];
  for (const n of notes) {
    if (n.beat >= from - 1e-6 && n.beat < to - 1e-6) continue;
    else if (n.beat < from - 1e-6 && n.beat + n.duration > from + 1e-6) {
      out.push({ ...n, duration: from - n.beat });
    } else out.push(n);
  }
  return out;
}

/**
 * The band arrives an eighth early and holds through the downbeat it left.
 *
 * The one kind that touches notes on both sides of a join, and the one the plan
 * put last for that reason. It is still an *edit*: the note already existed, on
 * the beat it was written for, and what changes is when it is struck. Nothing is
 * composed across the seam and the two rules that forbid that stand untouched.
 *
 * ## `anticipate` does the work, and there is exactly one of it
 *
 * A seam elide and a phrase-end bass push are the same gesture at two scales —
 * arrive early, hold through — so they share one implementation in
 * `generate/rhythm.ts` rather than two that agree today. Two would drift, and
 * the way they would drift is a bar containing both, an eighth apart, which is
 * mush rather than two gestures.
 *
 * **They cannot in fact collide, and that is structural rather than lucky.** An
 * elide moves the arriving downbeat back into the *departing section's last
 * bar*, and `figureFor` in `generate/parts.ts` refuses to vary a section's last
 * bar — it is left to the drummer's fill and to this. So the guard the plan
 * asked for is already paid for by a rule written for another reason. Asserted
 * in `genre-check.ts` rather than assumed, because it is a property of two files
 * that do not know about each other.
 *
 * ## The kit does not move
 *
 * A drummer who anticipated with the band would be moving the barline, which is
 * a metric modulation and not an anticipation — the gesture *is* the band
 * arriving over a downbeat the kit still states. Leaving the kit alone also
 * keeps this trivially clear of the hook guarantee: no drum event is derived
 * from anything here, because no drum event is touched.
 *
 * A sequencer does not move either, for the reason `Track.machine` gives
 * everywhere else in this file: nobody's hands are on it.
 *
 * ## Nobody arrives early into a bar they then do not play
 *
 * The gesture is the band arriving *over a downbeat the kit still states*, and
 * the sentence above is load-bearing rather than colour: an anticipation needs
 * something left on the other side of the barline to be heard against. On every
 * ordinary section there is — the kit, and the section's own next forty onsets —
 * so the eighth taken off the front costs nothing.
 *
 * On the sparsest styles in the catalogue it is the whole section. A runo
 * performance or a kantele piece states one chord per section and lets it ring:
 * the arriving section's *only* attack is the downbeat, and there is no kit
 * behind it. Moving that one attack an eighth early moves a hundred percent of
 * the section's onsets into the section before it, and what is left is four bars
 * that nobody strikes a note in. It still *sounds* — the chord rings across the
 * join and holds to the end — but the section no longer plays anything, and
 * `activeLayers` is filtered on onsets at the bottom of `generateSong` precisely
 * so that it says who is playing. The section came out claiming nobody was.
 *
 * `landEnding` cannot repair it and should not try. It finds that chord still
 * ringing over the final bar and holds it, which is right; the `button` recall
 * that would otherwise re-strike the band is guarded on `!ringing`, which is
 * also right, because re-striking a string that has not stopped is a second
 * attack rather than a landing. Three correct decisions composing into a silent
 * section is what makes this the place to fix it: here the gesture is degenerate
 * on its own terms, and everywhere downstream it is merely inconvenient.
 *
 * Decided once for the whole band rather than per track, because a comp that
 * pushed while the bass stayed is not half a gesture, it is two.
 */
function playElide(song: Song, seam: Seam, eighth: number): void {
  if (eighth <= 0) return;
  const landing = seam.bar * song.meta.beatsPerBar;
  /**
   * How near the downbeat a note has to be to count as *on* it.
   *
   * Not an equality test, because a feel has already leaned on this layer by the
   * time this runs — `Feel.push` moves a whole layer by milliseconds — and a
   * downbeat eleven milliseconds early is still the downbeat. Comfortably under
   * the eighth being travelled, so nothing else in the bar can be mistaken for
   * it.
   */
  const NEAR = 0.125;

  /**
   * The whole edit, computed and not yet applied.
   *
   * Prepared rather than performed so the guard below can read the notes *as
   * they would be* instead of predicting them — `anticipate` is total and
   * declines the move on its own account when the push will not fit, and a guard
   * that second-guessed that would be a second copy of its rules.
   */
  const edits: { track: Track; notes: NoteEvent[] }[] = [];
  for (const track of song.tracks) {
    if (track.machine) continue;
    const attack = new Set(track.notes.filter((n) => Math.abs(n.beat - landing) < NEAR));
    if (!attack.size) continue;
    const moved = anticipate(
      // Snapped to the downbeat so the whole attack moves as one, which is what
      // `anticipate` means by an attack and what keeps a chord a chord. The lean
      // the feel put on it is spent: the note is being re-timed anyway.
      track.notes.map((n) => ({ at: attack.has(n) ? landing : n.beat, dur: n.duration, note: n })),
      { target: landing, by: eighth },
    );
    edits.push({ track, notes: moved.map((h) => ({ ...h.note, beat: h.at, duration: h.dur })) });
  }
  if (!edits.length) return;

  // Would anyone still be playing in the section being arrived at? Edited tracks
  // answer from the edit, everyone else from what they already hold, and the kit
  // counts because it is exactly the downbeat this gesture wants to arrive over.
  const arriving = song.sections[seam.section + 1];
  if (arriving) {
    const to = landing + arriving.lengthBars * song.meta.beatsPerBar;
    const inSection = (beat: number) => beat >= landing - 1e-6 && beat < to - 1e-6;
    const edited = new Set(edits.map((e) => e.track));
    const sounds = song.drums.events.some((e) => inSection(e.beat))
      || edits.some((e) => e.notes.some((n) => inSection(n.beat)))
      || song.tracks.some((t) => !edited.has(t) && t.notes.some((n) => inSection(n.beat)));
    if (!sounds) return;
  }

  for (const { track, notes } of edits) track.notes = notes;
}

function median(values: number[]): number {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

/**
 * Replace whatever a part was playing in one bar with the band's figure.
 *
 * The pitches are the part's own — a bass hit is still the bass note it would have
 * played, a comp hit is still that bar's voicing — because a tutti is a rhythmic
 * event, not a harmonic one. What changes is *when*, and that everyone changes it
 * together.
 *
 * **Two callers, and they stay two.** `song.ts` uses it for the mid-section
 * shout chorus, whose figure is the section's own hook and which the drummer
 * therefore cannot join; `playShot` above uses it at a seam, with a figure from
 * the style or the metre and the whole kit on it. *The band catching the tune*
 * and *the band playing its own figure* are two things a real group does, and
 * collapsing them would lose one. What they genuinely share is this: what to do
 * with the pitches.
 */
export function hitTogether(
  notes: NoteEvent[], from: number, to: number, beats: readonly number[],
): NoteEvent[] {
  const inBar = notes.filter((n) => n.beat >= from - 1e-6 && n.beat < to - 1e-6);
  if (inBar.length < 2) return notes;
  const kept = notes.filter((n) => n.beat < from - 1e-6 || n.beat >= to - 1e-6);

  // One onset's worth of pitches per hit, taken from what the part was already
  // holding, so a chord stays a chord and a bass line stays one note.
  const groups = new Map<number, NoteEvent[]>();
  for (const n of inBar) {
    const at = groups.get(n.beat) ?? [];
    at.push(n);
    groups.set(n.beat, at);
  }
  const voicings = [...groups.values()];

  const hits: NoteEvent[] = [];
  beats.forEach((beat, i) => {
    const next = beats[i + 1] ?? to;
    for (const n of voicings[Math.min(i, voicings.length - 1)]!) {
      hits.push({ ...n, beat, duration: Math.min(n.duration, Math.max(0.25, next - beat)), velocity: Math.min(1, n.velocity + 0.12) });
    }
  });
  return [...kept, ...hits].sort((a, b) => a.beat - b.beat);
}
