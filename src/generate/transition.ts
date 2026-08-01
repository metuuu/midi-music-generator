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
 *  - **`break`** — delete events in a span from every layer but one. *(wave 3)*
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
 * See `docs/transition-plan.md`.
 */

import { Rng } from '../core/rng.js';
import { canVary } from '../core/types.js';
import type {
  DrumEvent, DrumSource, NoteEvent, Section, Song,
} from '../core/types.js';
import { landing } from './fills.js';
import { metricStrength, SLOTS_PER_BEAT } from './rhythm.js';

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
  const heads: number[] = [];
  for (let slot = 0; slot < slotsPerBar; slot++) {
    // 3 is "group head", 4 is the downbeat. Below that is a beat or weaker, and
    // a figure on every beat is not a shot, it is time-keeping with the band's
    // name on it.
    if (metricStrength(slot, slotsPerBar, metre.groups) >= 3) heads.push(slot);
  }
  // Only reachable for a bar of a single beat, which nothing in the catalogue
  // has. Two hits is the floor for a figure — one is an accent.
  if (heads.length < 2) heads.push(Math.max(1, slotsPerBar - SLOTS_PER_BEAT));

  const pushed = heads.slice();
  const last = pushed.length - 1;
  const anticipated = pushed[last]! - SLOTS_PER_BEAT / 2;
  if (anticipated > pushed[last - 1]!) pushed[last] = anticipated;

  return pushed[last] === heads[last]
    ? [[heads, 1]]
    : [[heads, 2], [pushed, 3]];
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
}): Seam[] {
  const { sections, palette, seed, metre, drums } = args;
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
export function applyTransitions(song: Song, seams: readonly Seam[]): void {
  for (const seam of seams) {
    switch (seam.kind) {
      case 'fill':
        // Delegated to `generateDrums`. See above.
        break;
      case 'shot':
        if (seam.figure?.length) playShot(song, seam, seam.figure);
        break;
      case 'break':  // wave 3 — stop-time, with a three-layer floor
      case 'elide':  // wave 4 — the seam-crosser, with the key-change guard
        break;
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

  /**
   * …and the cymbal on the downbeat it was aiming at.
   *
   * `arrival` is read off the kit in the bar it lands on rather than passed in,
   * because the section's intensity is a section-loop local and this pass runs
   * long after it. The loudest thing the drummer plays on arriving is
   * `accentOf × intensity × jitter` with the accent at or near 1, so it is the
   * same number to within the jitter — and, unlike the intensity itself, it is
   * made of drum events, which is the one kind of value this function is allowed
   * to derive a drum event from.
   */
  const arriving = kit.filter((e) => e.beat >= to - 1e-6 && e.beat < to + bpb - 1e-6);
  const arrival = arriving.length ? Math.max(...arriving.map((e) => e.velocity)) : 0;
  const marked = kept.some((e) => e.voice === 'cr' && Math.abs(e.beat - to) < 1e-6);
  if (arrival > 0 && !marked) kept.push(landing(to, Math.min(1, arrival)));

  song.drums.events = kept.sort((a, b) => a.beat - b.beat);
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
