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
 *    figure. `hitTogether` in `song.ts` is already this function. *(wave 2)*
 *  - **`break`** — delete events in a span from every layer but one. *(wave 3)*
 *  - **`elide`** — move the first onset of each layer at the seam backwards by
 *    an eighth and clip what it lands on. *(wave 4)*
 *
 * ## Wave 1 is structure, and the structure is the deliverable
 *
 * What exists here now is the vocabulary, the per-seam draw, and the call site
 * at the right point in the order. `fill` is the only kind any palette can
 * currently produce and it is implemented by delegation — the drummer's fill is
 * what `fill` *means*, and it is written where it always was. Nothing in the
 * catalogue moves: measured over 504 songs (every genre x style at eight seeds,
 * 200 unpinned, and both ends of the `--hook` axis at forty), the JSON of every
 * song is byte-identical to what it was before this file existed.
 *
 * See `docs/transition-plan.md`.
 */

import { Rng } from '../core/rng.js';
import type { Section, Song } from '../core/types.js';

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
 */
export function planTransitions(args: {
  sections: readonly Section[];
  /** Resolved style-over-genre. Absent or empty means no draw happens. */
  palette?: TransitionPalette;
  seed: string;
}): Seam[] {
  const { sections, palette, seed } = args;
  const seams: Seam[] = [];
  for (let s = 0; s < sections.length - 1; s++) {
    seams.push({
      section: s,
      bar: sections[s + 1]!.startBar,
      kind: palette?.length
        ? new Rng(`${seed}:transition:${s}`).weighted(palette)
        : 'fill',
    });
  }
  return seams;
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
 * ## What it does today
 *
 * Nothing, and that is the honest wave-1 answer rather than a stub. `fill` is
 * the only kind a palette can currently produce, and a fill is *already* an edit
 * made in the right place: `generateDrums` writes it into the last bar of the
 * section during the section loop, sized by the arrival, and the seam plan's
 * only say over it is the veto wired at that call site. Moving it out here was
 * considered and rejected — it would have to be re-derived from `arrival`,
 * `machine`, `lastBarIsSolo` and the style's `FillPalette`, all of which are
 * section-loop locals, and the move would change no note while risking every
 * one of them.
 *
 * So what this is for is the shape: a seam list, a kind per seam, and one place
 * for waves 2–4 to add cases. The `never` in the default is what makes a fifth
 * kind a compile error here rather than a silent omission.
 */
export function applyTransitions(song: Song, seams: readonly Seam[]): void {
  for (const seam of seams) {
    switch (seam.kind) {
      case 'fill':
        // Delegated to `generateDrums`. See above.
        break;
      case 'shot':   // wave 2 — `hitTogether` with a figure that is not the tune
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
