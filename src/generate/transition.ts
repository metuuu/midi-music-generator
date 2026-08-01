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
 * Deleting kit events is free of the hook guarantee by construction: nothing is
 * *derived*, so nothing can be derived from the tune. The one drum event this
 * adds is the same cymbal `playShot` adds, from the same input — the loudest
 * velocity the kit already plays in the bar it lands on — and it is hook-
 * invariant for the same reason, which is that the assertion in `genre-check.ts`
 * says the kit is.
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
import { landing } from './fills.js';
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
}): Seam[] {
  const { sections, palette, seed, metre, drums, drumBars } = args;
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
    if (kind === 'break' && !breakable(sections, s, drumBars?.get(s))) kind = 'fill';
    if (kind === 'elide' && !elidable(sections, s)) kind = 'fill';
    if (kind !== 'fill') spent = s;
    // Drawn from the same per-seam stream, and after the rate limit rather than
    // before it, so a seam that was talked out of a gesture leaves the draw
    // unmade. Nothing else reads this namespace, so either order is safe; this
    // one is honest.
    const figure = kind === 'shot' ? rng!.weighted(shotFigures(metre)) : undefined;
    seams.push({
      section: s,
      bar: sections[s + 1]!.startBar,
      kind,
      ...(figure ? { figure: [...figure] } : {}),
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
 * Two questions, both answerable from the form alone and neither of them about
 * notes, which is what lets them be asked here — see `planTransitions` for why
 * asking late would be worse than not asking.
 */
function breakable(
  sections: readonly Section[], s: number,
  drumBars: readonly (readonly [number, number])[] | undefined,
): boolean {
  const leaving = sections[s]!;
  const arriving = sections[s + 1]!;
  // Thin already: see `MIN_BREAK_LAYERS`.
  if (leaving.activeLayers.length < MIN_BREAK_LAYERS) return false;
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
): void {
  for (const seam of seams) {
    switch (seam.kind) {
      case 'fill':
        // Delegated to `generateDrums`. See above.
        break;
      case 'shot':
        if (seam.figure?.length) playShot(song, seam, seam.figure);
        break;
      case 'break':
        playBreak(song, seam);
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
function playShot(song: Song, seam: Seam, figure: readonly number[]): void {
  const bpb = song.meta.beatsPerBar;
  const slotsPerBar = Math.round(bpb * SLOTS_PER_BEAT);
  const from = (seam.bar - 1) * bpb;
  const to = seam.bar * bpb;
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
  const section = song.sections[seam.section];
  const lastBar = (section?.lengthBars ?? 0) - 1;
  if (section?.solo?.blocks?.drumBars.some(([a, b]) => lastBar >= a && lastBar < b)) return;

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
   */
  const hits = bar.filter((e) => e.voice === 'bd' || e.voice === 'sd');
  const level = median((hits.length ? hits : bar).map((e) => e.velocity));
  const velocity = Math.min(1, level * 1.12);

  // The crash is the only thing that survives the bar: it is the drummer
  // marking something, and everything else in here is keeping time.
  const kept = kit.filter((e) => !inBar(e) || e.voice === 'cr');
  for (const beat of beats) {
    kept.push({ beat, voice: 'bd', velocity });
    kept.push({ beat, voice: 'sd', velocity });
  }

  song.drums.events = markTheLanding(kit, kept, to, bpb);
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
): DrumEvent[] {
  const arriving = kit.filter((e) => e.beat >= to - 1e-6 && e.beat < to + bpb - 1e-6);
  const arrival = arriving.length ? Math.max(...arriving.map((e) => e.velocity)) : 0;
  const marked = kept.some((e) => e.voice === 'cr' && Math.abs(e.beat - to) < 1e-6);
  if (arrival > 0 && !marked) kept.push(landing(to, Math.min(1, arrival)));
  return kept.sort((a, b) => a.beat - b.beat);
}

/**
 * Stop-time: the band out for the bar before a seam, one voice carrying it.
 *
 * Every other kind in this file is a rewrite. This one is a deletion, and it is
 * the oldest gesture in the repertoire because it costs a band nothing and
 * costs a listener their footing — the time keeps going in their head and there
 * is nothing under it, so the downbeat that ends it lands harder than any fill
 * could make it land.
 *
 * ## Who carries it, in order, and why the list ends where it does
 *
 * **The soloist first**, where the departing section has one, because handing a
 * player the bar alone is what a break has always been *for*. **Then the tune,
 * then the answering line** — the plan's "lead layer", spelled out, since the
 * lead is a section-loop local that no longer exists by the time this runs and
 * re-deriving it from `activeLayers` would be re-deriving a guess.
 *
 * **Then the bass, and that is the answer to the section whose melody is
 * silent.** The plan did not have one and the case is not rare: measured over
 * 1093 fusion seams the tune has no onset in the last bar at roughly one seam in
 * five. A bass break is completely idiomatic — the band stops and the bass walks
 * the bar on its own — and it is the last voice in the band that can state time
 * unaccompanied, which is the property the carrier actually needs.
 *
 * The list stops there on purpose. A comp or a pad alone is not a voice carrying
 * a break, it is a chord hanging in the air; nothing about it says *the band
 * stopped*, and a break nobody can hear as one is worse than the plain cut this
 * seam would otherwise have got. Where none of the four plays in the bar, this
 * does nothing at all, which is the one honest answer available at this point in
 * the pipeline.
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
 */
function playBreak(song: Song, seam: Seam): void {
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

  const struckIn = (n: NoteEvent) => n.beat >= from - 1e-6 && n.beat < to - 1e-6;

  /**
   * What survives the break on a given layer, which is not the same as what is
   * written on it.
   *
   * Two qualifications, and the second was a measured bug rather than a
   * precaution. Not a sequencer, for the reason `Track.machine` gives everywhere
   * else — nobody's hands are on it, so it neither stops nor plays a break;
   * nothing in the one style that draws these has a machine in it, and the rule
   * is here so that widening the palette does not quietly ask a sequencer to
   * perform.
   *
   * And **not the left hand**, which is the one that bit. A two-handed lead is a
   * single track whose comping is marked and is silenced below along with the
   * rest of the band, so a bar where the pianist's right hand rests and only the
   * left hand moves reads as *the tune is playing* to anything that counts onsets
   * on the track, and comes out empty once the break has run. Six break bars in
   * 200 fusion songs were exactly that, and every one of them was a hole rather
   * than a break — the failure check 7 exists to catch, arrived at from the one
   * direction the check could not have predicted.
   */
  const heard = (t: Track) => (n: NoteEvent) => !(t.twoHanded && n.hand === 'left');
  const onLayer = (layer: LayerId) => song.tracks
    .filter((t) => t.layer === layer && !t.machine)
    .flatMap((t) => t.notes.filter(heard(t)));

  /**
   * Who is left, and the test is whether they are *carrying* the bar rather than
   * merely present in it.
   *
   * The plan says the lead layer and stops there, and a first pass took it at its
   * word: the highest-priority layer with any onset in the span. That is the rule
   * that produced the worst bar this wave generated — a break whose surviving
   * bass plays one 32nd note 0.03 beats before the arriving downbeat, over an
   * otherwise empty bar. Nothing about it is stop-time. It is a bar of silence
   * with a pickup on the end, and it is exactly the "reads as a dropout" failure
   * that decides whether this kind is worth shipping.
   *
   * So a candidate has to hold the bar for `MIN_BREAK_COVER` of its length, and
   * the priority list runs over the candidates that do. Sounding time and not
   * onsets, because the two answers differ in both directions and only one of
   * them is what a listener hears: a single held note across the bar is a break
   * anybody would recognise, and four thirty-seconds bunched under the barline is
   * not, whatever the onset count says.
   *
   * **The soloist first**, where the departing section has one, because handing a
   * player the bar alone is what a break has always been *for*. **Then the tune,
   * then the answering line** — the plan's "lead layer", spelled out, since the
   * lead is a section-loop local that no longer exists by the time this runs and
   * re-deriving it from `activeLayers` would be re-deriving a guess.
   *
   * **Then the bass, and that is the answer to the section whose melody is
   * silent.** The plan did not have one, and the case is not the exception — it
   * is the common one. Over 200 fusion songs the bass carries 37 of the 59
   * breaks that happen, against 13 for the tune and 9 for the answering line,
   * because a tune ending a section has usually finished its phrase and the bass
   * has not. A bass break is completely idiomatic, and the bass is the last voice
   * in the band that can state time unaccompanied, which is the property a
   * carrier actually needs and the reason the fallback is not a consolation.
   *
   * The list stops there on purpose. A comp or a pad alone is not a voice
   * carrying a break, it is a chord hanging in the air; nothing about it says
   * *the band stopped*.
   */
  const soloist = section?.solo && section.solo.layer !== 'drums' ? section.solo.layer : undefined;
  const carrier = ([...(soloist ? [soloist] : []), 'melody', 'counter', 'bass'] as LayerId[])
    .find((layer) => {
      const notes = onLayer(layer);
      return notes.some(struckIn) && covers(notes, from, to) >= MIN_BREAK_COVER;
    });
  if (!carrier) return;

  /**
   * The singer goes with the tune, because the singer *is* the tune.
   *
   * `vocal` is the melody line doubled after swing — see the caller in
   * `song.ts` — so silencing it under a melody break would take the voice off
   * the one line that is meant to be exposed, and keeping it under any other
   * carrier is moot, since it has no onset the melody did not have.
   */
  const carried = (t: Track) => t.layer === carrier || (carrier === 'melody' && t.layer === 'vocal');

  const kit = song.drums.events;
  const inBar = (e: DrumEvent) => e.beat >= from - 1e-6 && e.beat < to - 1e-6;
  /**
   * …and there has to be a band to take out.
   *
   * **Not `MIN_BREAK_LAYERS` again**, and the difference is the correction wave 3
   * had to make to its own plan. The floor is a rule about *drawing* a break —
   * "at least three sounding layers before drawing one" — and it is applied where
   * drawing happens, in `planTransitions`, because that is the only point at
   * which rejecting is free. Repeating the same number here, against the notes,
   * looked like the same rule stated honestly and was in fact a second and much
   * harsher gate: it stood down two breaks in five over 200 fusion songs, and
   * every one of those seams had already given up its fill to a gesture that then
   * did not happen.
   *
   * What is left is the invariant rather than the taste: a break must take
   * something away and leave somebody. One other voice struck in the bar — a
   * layer or the kit — is exactly that, and it is not a weaker version of the
   * floor, it is the other question. A bar with the bass and the drummer in it
   * becomes a bar with the bass alone, and a listener hears the drummer stop,
   * which is the gesture. A bar with nobody but the carrier in it becomes the
   * same bar, and the pass leaves it untouched.
   *
   * Struck rather than sounding, for the same reason the carrier has to be:
   * cutting a pad that was already decaying is not what anybody means by the
   * band stopping.
   */
  const taken = new Set<LayerId>(song.tracks
    .filter((t) => !t.machine && !carried(t) && t.notes.some((n) => heard(t)(n) && struckIn(n)))
    .map((t) => t.layer));
  if (kit.some(inBar)) taken.add('drums');
  if (!taken.size) return;

  for (const track of song.tracks) {
    if (track.machine) continue;
    /**
     * The carrier's own left hand is part of the band that stopped.
     *
     * A two-handed lead is one track — `generateLeftHand` writes the comping
     * into the melody part and marks it — so a break that spared the whole track
     * would leave the pianist comping underneath their own break, which is the
     * one thing nobody does. The mark is read rather than `melodicLine`'s gap
     * inference, deliberately: the inference is documented as fragile, and here
     * it would be guessing which notes to *delete*.
     */
    track.notes = carried(track)
      ? (track.twoHanded ? hush(track.notes, from, to, (n) => n.hand !== 'left') : track.notes)
      : hush(track.notes, from, to);
  }

  song.drums.events = markTheLanding(kit, kit.filter((e) => !inBar(e) || e.voice === 'cr'), to, bpb);
}

/**
 * How much of a break bar its surviving voice has to be sounding for.
 *
 * A third, and it is the number that decides whether this kind is a gesture or a
 * dropout. A break is silence with a voice in it; past some point it stops being
 * that and becomes silence with a *decoration* in it, and the pass has no way to
 * tell the difference except by asking how long the voice is actually there.
 *
 * A third is low on purpose. Measured over 200 fusion songs the lead layer covers
 * 64% of an ordinary bar and this is meant to reject the tail rather than
 * legislate a density: the bars it stands a break down over are the ones covered
 * 0–20%, which are a pickup under the barline or a single short note, and both of
 * those are what the failure sounded like. Raising it to a half would also reject
 * a held note with air on either side of it, which is the most idiomatic break in
 * the repertoire.
 */
const MIN_BREAK_COVER = 1 / 3;

/**
 * How much of a span a part is sounding for, 0..1.
 *
 * Sounding rather than struck, and the union rather than the sum, because the
 * question is what a listener hears: two notes overlapping is one continuous
 * sound and a chord is one sound, and a count of onsets says three where the
 * answer is one. Clamped to the span at both ends, so a note that started before
 * it counts for the part inside and a note ringing past the barline does not
 * borrow the next bar's time.
 */
function covers(notes: readonly NoteEvent[], from: number, to: number): number {
  const spans = notes
    .map((n) => [Math.max(from, n.beat), Math.min(to, n.beat + n.duration)] as const)
    .filter(([a, b]) => b > a)
    .sort((a, b) => a[0] - b[0]);
  let total = 0;
  let end = from;
  for (const [a, b] of spans) {
    if (b <= end) continue;
    total += b - Math.max(a, end);
    end = b;
  }
  return to > from ? total / (to - from) : 0;
}

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
 */
function hush(
  notes: NoteEvent[], from: number, to: number, spare: (n: NoteEvent) => boolean = () => false,
): NoteEvent[] {
  const out: NoteEvent[] = [];
  for (const n of notes) {
    if (spare(n)) out.push(n);
    else if (n.beat >= from - 1e-6 && n.beat < to - 1e-6) continue;
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
    track.notes = moved.map((h) => ({ ...h.note, beat: h.at, duration: h.dur }));
  }
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
