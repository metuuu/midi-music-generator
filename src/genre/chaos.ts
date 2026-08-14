/**
 * The chimera — one band assembled out of nineteen.
 *
 * A *chaos concert* is a piece whose properties are drawn from more than one
 * genre: a humppa played by a metal band, a bebop head over a dub bass, a rāg
 * whose drummer learned the part off a Roland. This file builds the `Genre` and
 * `Style` that produce it, and **builds nothing else** — the whole feature is a
 * value handed to `generateSong`, which is what `genre/index.ts` has claimed
 * from the beginning: adding a genre means adding a folder, and nothing in
 * `generate/` or `render/` needs to change. Nothing in either does.
 *
 * ## Not a genre in `GENRES`, deliberately
 *
 * A chimera is drawn per song, so it cannot be a static table, and putting a
 * nineteenth-and-a-half entry in the registry would put it in the random genre
 * draw and in every check that walks `GENRE_IDS`. Instead this is a *transform*:
 * `generateSong` draws a genre, an era, a style and a mood exactly as it always
 * has, hands the first three here as the **host**, and gets back copies with the
 * properties named below replaced by properties from other genres' tables. The
 * ids are untouched, so the song is still filed where it was drawn.
 *
 * Keeping the three ids is what makes the rest of the project not need telling.
 * `chooseVenue`, the wardrobe, the showbill and `buildConcert`'s year lookup all
 * key off `meta.genre` and `meta.era` and all of them go on working, because
 * those still name a real genre and a real era. The room is the host's room —
 * which is right: a chaos concert is a band on one stage on one night playing
 * material from everywhere, not a building that keeps changing.
 *
 * ## Two knobs, and why not one
 *
 * `levels` says *which kinds* of property may be borrowed and `spread` says *how
 * many of them* actually move. The two are different questions and one knob
 * answering both would be answering neither: the interesting settings are "the
 * whole band is foreign but the music is ours" (`band`, spread 1) and "one thing
 * about this piece is from somewhere else" (everything, spread 0.1), and a
 * single 0..1 dial cannot reach either.
 *
 * `mixing` is the third knob and it is the second one again, per kind: a rate
 * for `band` that is not the rate for `harmony`. It exists because the two
 * questions above are asked *per kind* in practice — "a completely foreign band
 * playing our own chords, with one thing about the form from elsewhere" is
 * `band: 1, harmony: 0, form: 0.2`, and with a single rate it is three songs
 * none of which is the one that was wanted. A kind with no entry in `mixing`
 * falls back to `spread`, so the simple control is the advanced control with
 * nothing said.
 *
 * The five kinds are **independently selectable**, not a ladder. Each is a claim
 * about a different part of the music, and none of them presupposes another:
 *
 *  - **`band`** — who is playing. Instrument palettes per layer, the drum bank
 *    and what is producing it. The music is the host's, note for note.
 *  - **`performance`** — how they play it. Feels, fills, seams, drops,
 *    techniques, effects, the mix, how far a comper departs from the figure.
 *  - **`figures`** — what they play. Bass, comp and drum patterns, melodic
 *    cells, the counter-line, the layer plan. **Metre- and tempo-gated**; see
 *    `compatible`.
 *  - **`harmony`** — what it is played over. Progressions, mode tables and the
 *    chord–scale rule, which travel *together* from one donor and never apart.
 *  - **`form`** — what shape it is. Forms, length, ending, count-in, the title.
 *  - **`staging`** — what it *looks* like. The clothes, their colours, how much
 *    a body moves, and what the programme says about the piece.
 *
 * ## The staging kind is read by nobody in `generate/`
 *
 * The other five move properties the engine composes from. `staging` moves
 * properties **only `src/concert/` reads**, and it reaches them by a different
 * road: `groove.ts`, `showbill.ts` and `cast.ts` all look their answers up as
 * `GENRES[song.meta.genre].staging.…`, straight out of the registry, so writing
 * a chimera's own `staging` would change nothing. What those three read instead
 * is `SongMeta.chaos.borrowed` — the recipe was published so a person could see
 * why there is a sitar in the humppa, and it turns out to be exactly what the
 * stage needs to dress one.
 *
 * So a `staging` trait's `take` moves nothing and only reports whether the donor
 * has the thing at all. That is honest rather than a stub: the borrowing happens
 * where the property is read, and the recipe is the channel.
 *
 * Some of the visuals were never in this kind and never needed to be. **The cast
 * follows the music by itself** — an `Archetype` is derived from the track, so
 * borrowing ambient's pad palette puts a four-person choir on stage where
 * iskelmä had one violinist, under `band`, with nothing told about staging.
 *
 * ## What is never mixed, whatever is selected
 *
 * **The bar.** `beatsPerBar`, `beatUnit` and `groups` stay the host's, because
 * every pattern in every table is a list of slot indices in sixteenths and
 * `cycleHits` reads them against `pattern.cycle ?? slotsPerBar` — the *host's*
 * `slotsPerBar`. A sixteen-slot figure hosted in a twelve-slot bar does not
 * fail; it wraps, and its last four strokes collide with the next repetition's
 * first four. That is not chaos, it is a bug that sounds like one. So figures
 * move only between styles that agree about the bar, which costs less than it
 * sounds: **305 of the 389 styles are plain 4/4 with no grouping**, so the pool
 * for four-four hosts is 78% of the catalogue. It costs a great deal at the
 * other end — `arabic:jurjina` is the only style in the project in 2.5/16
 * [3+2+2+3] and has nobody at all to trade figures with — and that is the
 * correct answer for it rather than a shortfall.
 *
 * **The mode's table.** Roman numerals are read relative to the mode, so a
 * major-key table read in minor is nonsense; `Style.progressions` documents
 * this and `pickProgression` implements the fallback that hides it. A chimera
 * that drew a mode its progression table cannot serve would produce that
 * nonsense reliably rather than occasionally, so `soundModeWeights` runs on
 * every chimera and zeroes the weight of a mode with no `verse` table for it.
 * That is a repair the host style gets for free and is the one place this file
 * makes a chaos song *better* than a plain one rather than stranger.
 *
 * **Layer requirements**, which move as a pair or not at all: a donor that
 * excludes the kit and another that requires a pad, unioned, is a band nobody
 * assembled. One donor states both or neither.
 *
 * ## Reproducibility
 *
 * Every draw here comes from `${seed}:chaos`, which nothing else reads, and the
 * main stream is untouched — the host is drawn before this file is called and
 * this file draws nothing from that stream. `Rng.weighted` spends one number
 * whatever the weights are, so **a chaos song and a plain song from the same
 * seed make the same decisions in the same order**, with different tables
 * answering them.
 *
 * With `band` alone selected that gives an exact invariant, and `npm run chaos`
 * asserts it over 200 seeds: **same key, same tempo, same form**, down to each
 * section's kind and length. Everything deciding those is drawn before an
 * instrument is chosen, and no table any of it reads has moved.
 *
 * It does **not** give note-identity, and the reason is worth knowing because it
 * is the honest limit of the whole A/B. Choosing an instrument is a fixed number
 * of draws, but *playing* one is not: a lead with a `HandSpec` writes a left
 * hand and a lead without one does not, and that draws inside the section loop.
 * So a piano swapped for a melodica moves everything after it. The piece is the
 * same piece; the performance is a different performance.
 *
 * And the recipe is published. `SongMeta.chaos` names the host, the kinds, the
 * spread and every property that moved with the style it came from, which is
 * what keeps `SongMeta` sufficient to regenerate the song it describes.
 */

import { Rng } from '../core/rng.js';
import type { ChaosRecipe, LayerId, PlayedLayer } from '../core/types.js';
import type { EraProfile, Style } from '../style/types.js';
import { GENRES, GENRE_IDS } from './index.js';
import type { Genre } from './types.js';

/**
 * The five kinds of property a band can borrow, listed in the order they are
 * applied.
 *
 * **Independent, not a ladder.** Any combination is sayable, including ones that
 * sound contrary — `['band', 'harmony']` is the host's own figures played on
 * foreign instruments over somebody else's chord system, and `['figures']` alone
 * is the host's band playing somebody else's patterns. Both are real requests
 * and neither is reachable from a cumulative reach.
 *
 * It began as a ladder, and the argument for changing it is that the ladder was
 * never in the mechanism. The gate was `index <= reach` over this array, the
 * traits already carried a tier each, and the ordering the ladder implied — that
 * you cannot want a foreign harmony without also wanting foreign instruments —
 * is not a fact about music. What the order here still does is decide *when* a
 * property is applied, which matters in one place only: a figure donor narrows
 * the tempo band, so `figures` runs before `harmony` and `form` read anything.
 */
export const CHAOS_LEVELS = ['band', 'performance', 'figures', 'harmony', 'form', 'staging'] as const;
export type ChaosLevel = typeof CHAOS_LEVELS[number];

export interface ChaosOptions {
  /**
   * Which kinds of property may be borrowed. Defaults to `band`, `performance`
   * and `figures` — the three that change what a piece *sounds* like without
   * touching what it is built on.
   *
   * An empty array borrows nothing, which is a plain song and is spelled that
   * way rather than by leaving the option off, so a UI with every box unticked
   * has something honest to send.
   */
  levels?: readonly ChaosLevel[];
  /**
   * The share of eligible properties that actually move, 0..1. Defaults to 0.5.
   *
   * Drawn per property, so this is a rate rather than a count: at 0.2 a piece
   * gets two or three foreign things and stays recognisable, at 1 everything
   * the selected kinds allow is somebody else's.
   *
   * The rate for every kind that has no rate of its own. See `mixing`.
   */
  spread?: number;
  /**
   * That share again, per kind, for the kinds named. Overrides `spread`.
   *
   * A kind set to 0 here is *not* the same as leaving it out of `levels`: it
   * borrows nothing either way, but it still spends its coins, so a kind can be
   * turned down to nothing and back up without disturbing what the others took.
   * Which is the invariant the whole control rests on and it now holds along
   * both axes — **moving one kind's rate never changes what another kind
   * borrowed**, because `Rng.chance` spends one number whatever the probability
   * is and every trait draws whether or not it is allowed to move. `npm run
   * chaos` asserts it.
   *
   * Entries for kinds that are not selected are read and have no effect, so a
   * UI may send all six and let the selection decide, rather than keeping the
   * two lists in step.
   */
  mixing?: Partial<Record<ChaosLevel, number>>;
  /**
   * Which genres may donate. All nineteen when omitted. The host is not
   * excluded — a humppa borrowing a jenkka's bass line is a small chaos and a
   * real one.
   */
  donors?: string[];
}

/**
 * Read a comma-separated list of level ids — `band,harmony`, or `all`.
 *
 * Throws on an unknown name rather than dropping it. This is the CLI's door and
 * a mistyped rung there should say so; the *URL's* door validates by filtering
 * instead, because a hand-edited query string should cost the default rather
 * than the page. Two doors, two policies, on purpose.
 */
export function getChaosLevels(spec: string): ChaosLevel[] {
  if (spec === 'all') return [...CHAOS_LEVELS];
  const wanted = spec.split(',').map((s) => s.trim()).filter(Boolean);
  return wanted.map((id) => {
    const found = CHAOS_LEVELS.find((l) => l === id);
    if (!found) throw new Error(`Unknown chaos level "${id}". Known: ${CHAOS_LEVELS.join(', ')}, all`);
    return found;
  });
}

/**
 * Read a per-kind mixing spec — `band:1,harmony:0.2`.
 *
 * Strict, like `getChaosLevels` and for the same reason: this is the door the
 * CLI and a hand-written `--chaos-mixing` come through, and a mistyped kind or
 * an out-of-range rate there is a mistake worth reporting rather than a default
 * to fall back to. The *URL's* door filters instead — see `readChaosMixing`.
 *
 * `:` rather than `=` because the same spelling has to survive a query string,
 * where `=` comes out as `%3D` and a link stops being readable by a person.
 */
export function getChaosMixing(spec: string): Partial<Record<ChaosLevel, number>> {
  const out: Partial<Record<ChaosLevel, number>> = {};
  for (const part of spec.split(',').map((s) => s.trim()).filter(Boolean)) {
    const [id, value] = part.split(':').map((s) => s.trim());
    const found = CHAOS_LEVELS.find((l) => l === id);
    if (!found) throw new Error(`Unknown chaos kind "${id}". Known: ${CHAOS_LEVELS.join(', ')}`);
    const rate = Number(value);
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
      throw new Error(`Chaos mixing for "${found}" must be 0..1, got "${value ?? ''}"`);
    }
    out[found] = rate;
  }
  return out;
}

/**
 * The same spec, lenient: unknown kinds and unreadable rates are dropped.
 *
 * The URL's door. A typo in a hand-edited link should cost that one kind its
 * override, not the page — which is the policy `optionsFromUrl` already applies
 * to the kinds themselves, and this is the same argument one field along.
 */
export function readChaosMixing(spec: string): Partial<Record<ChaosLevel, number>> {
  const out: Partial<Record<ChaosLevel, number>> = {};
  for (const part of spec.split(',').map((s) => s.trim()).filter(Boolean)) {
    const [id, value] = part.split(':').map((s) => s.trim());
    const found = CHAOS_LEVELS.find((l) => l === id);
    const rate = Number(value);
    if (!found || !Number.isFinite(rate)) continue;
    out[found] = Math.max(0, Math.min(1, rate));
  }
  return out;
}

/** …and back to a spec, for a share link or a `Watch on stage` hop. */
export function formatChaosMixing(mixing: Partial<Record<ChaosLevel, number>>): string {
  return CHAOS_LEVELS
    .filter((l) => mixing[l] !== undefined)
    .map((l) => `${l}:${mixing[l]}`)
    .join(',');
}

const DEFAULT_LEVELS: readonly ChaosLevel[] = ['band', 'performance', 'figures'];

/** Everything this file can borrow. The "full chaos" setting. */
export const ALL_CHAOS_LEVELS: readonly ChaosLevel[] = CHAOS_LEVELS;
const DEFAULT_SPREAD = 0.5;

// ---------------------------------------------------------------------------
// Donors
// ---------------------------------------------------------------------------

/**
 * One place to borrow from: a style, the genre it belongs to, and one of that
 * genre's eras.
 *
 * The era is drawn at the moment of borrowing rather than once per chimera, so
 * two properties taken from the same genre may come from two decades of it.
 * That is deliberate and it is most of what the `band` tier is for — the era is
 * where the instruments live, and a band whose bass is from 1974 and whose lead
 * is from 1938 is a stranger and better band than one that is uniformly 1974.
 */
interface Donor {
  genre: Genre;
  style: Style;
  era: EraProfile;
}

/**
 * Whether a style may hand this host its *figures*.
 *
 * Two gates, and both are properties of the tables rather than of the song, so
 * they can be settled before a note exists.
 *
 * **The bar**, argued at the head of this file: same quarter-note count and the
 * same grouping, or the slot indices mean something else on arrival.
 *
 * **The tempo**, which is softer and still worth enforcing. The catalogue runs
 * from 40 BPM to 280. An amen break at 60 is not an amen break and a valssi
 * figure at 190 is a blur, so a donor has to share some tempo with the host —
 * and when one donates, `Draft.bpm` narrows to the overlap, so the piece is
 * played at a speed that suits everyone who wrote a figure in it.
 */
function compatible(host: Style, other: Style, bpm: readonly [number, number]): boolean {
  if (other.beatsPerBar !== host.beatsPerBar) return false;
  if ((other.groups?.join('+') ?? '') !== (host.groups?.join('+') ?? '')) return false;
  return other.bpm[0] <= bpm[1] && bpm[0] <= other.bpm[1];
}

function donorStyles(ids: readonly string[], host: Style): { genre: Genre; style: Style }[] {
  const out: { genre: Genre; style: Style }[] = [];
  for (const id of ids) {
    const genre = GENRES[id];
    if (!genre) throw new Error(`Unknown chaos donor "${id}". Known: ${GENRE_IDS.join(', ')}`);
    for (const style of Object.values(genre.styles)) {
      if (style !== host) out.push({ genre, style });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// The draft
// ---------------------------------------------------------------------------

/**
 * The three objects a property can land on, plus the tempo band.
 *
 * All three are needed because the engine resolves most things across tiers:
 * effects are merged genre-under-era-under-style, techniques are style-over-
 * genre, the palette is the era's and the preference is the style's. A property
 * borrowed at only one of those tiers would be half-borrowed, with the host's
 * opinion still showing through — so every trait below takes the *whole chain*
 * from one donor.
 */
interface Draft {
  genre: Genre;
  style: Style;
  era: EraProfile;
  bpm: [number, number];
}

/**
 * One borrowable property of a band.
 *
 * Granular on purpose: `spread` is a per-trait coin, so thirty small traits give
 * a dial with thirty positions where six large ones would give six. Where two
 * fields cannot be separated without producing something incoherent they are
 * one trait — `harmony` is the largest of those and the reason the type has a
 * `take` rather than a field name.
 */
interface Trait {
  name: string;
  tier: ChaosLevel;
  /** Needs a donor that agrees about the bar and the tempo. See `compatible`. */
  metre?: true;
  /** Move it. Returns false when this donor has nothing to give. */
  take(draft: Draft, from: Donor): boolean;
}

/** Copy a layer's instrument list, and stop the host style vetoing it. */
function takeInstrument(layer: PlayedLayer): Trait {
  return {
    name: `${layer}-instrument`,
    tier: 'band',
    take(draft, from) {
      const list = from.era.palette[layer];
      if (!list?.length) return false;
      draft.era = { ...draft.era, palette: { ...draft.era.palette, [layer]: list } };
      /**
       * …and drop the host's preference for this layer.
       *
       * `chooseInstruments` *intersects* `Style.instruments` with the era's
       * palette and falls back to the palette when the intersection is empty —
       * which is right for a real style and would silently undo half of this:
       * a host naming three instruments it likes would either veto the foreign
       * list or, more often, be ignored and leave the reader unable to tell
       * which happened. Removing the row says the borrowed palette is the
       * whole answer for this layer.
       */
      if (draft.style.instruments?.[layer]) {
        const rest = { ...draft.style.instruments };
        delete rest[layer];
        draft.style = { ...draft.style, instruments: Object.keys(rest).length ? rest : undefined };
      }
      return true;
    },
  };
}

const TRAITS: Trait[] = [
  // ---- band: who is playing --------------------------------------------
  ...(['melody', 'counter', 'comp', 'pad', 'bass', 'brass'] as PlayedLayer[]).map(takeInstrument),
  {
    /**
     * The kit, the sample library and the decade that gates them.
     *
     * `year` travels with the bank because it is the thing that decides whether
     * the bank can be played at all: `eligibleDrumSources` refuses a machine an
     * era is too early for, so a 1985 drum box borrowed into a 1938 era would be
     * a table entry the engine throws away. Borrowing the year with it says *the
     * drummer is from 1985*, which is the statement that was wanted.
     *
     * Nothing on the stage moves with it — `buildConcert` reads the year off the
     * real host genre's era table, so the room stays in its own decade and only
     * the percussion crosses.
     */
    name: 'drum-machine',
    tier: 'band',
    take(draft, from) {
      if (!from.era.drumBanks.length) return false;
      draft.era = {
        ...draft.era,
        drumBanks: from.era.drumBanks,
        drumSources: from.era.drumSources,
        year: from.era.year,
      };
      return true;
    },
  },
  {
    /**
     * The singer — what language the invented words are built from, and how the
     * voice is delivered. See `Genre.vocals`.
     *
     * At `band` because a singer is one of the people playing, and split out of
     * `title` for that reason: bundled together, the only way to borrow a voice
     * was to borrow a title with it, and those are not the same request. It is
     * also what dresses the singer — `DRESSED_BY` in `concert/cast.ts` maps the
     * vocal layer to this trait, so a borrowed voice arrives in that genre's
     * clothes.
     */
    name: 'voice',
    tier: 'band',
    take(draft, from) {
      draft.genre = { ...draft.genre, vocals: from.genre.vocals };
      return true;
    },
  },
  {
    name: 'sequencing',
    tier: 'band',
    take(draft, from) {
      if (!from.era.sequenced) return false;
      draft.era = { ...draft.era, sequenced: from.era.sequenced };
      return true;
    },
  },

  // ---- performance: how they play it -----------------------------------
  {
    /**
     * How thick the arrangement is and how the era leans on the tempo band.
     *
     * At `performance` and not at `band`, though it lives on the era beside the
     * palette, because it is the one era field that reaches a *draw the engine
     * makes about the music*: `density` decides how many layers play and
     * `tempoScale` moves the count-off. `band` is the one kind where nothing the
     * engine composes from has moved, and these two would break that.
     */
    name: 'ensemble-weight',
    tier: 'performance',
    take(draft, from) {
      draft.era = { ...draft.era, density: from.era.density, tempoScale: from.era.tempoScale };
      return true;
    },
  },
  {
    name: 'feels',
    tier: 'performance',
    take(draft, from) {
      const table = from.style.feels ?? from.genre.feels;
      if (!table?.length) return false;
      draft.style = { ...draft.style, feels: table };
      return true;
    },
  },
  {
    name: 'swing',
    tier: 'performance',
    take(draft, from) {
      if (from.style.swing === draft.style.swing) return false;
      draft.style = { ...draft.style, swing: from.style.swing };
      return true;
    },
  },
  {
    name: 'fills',
    tier: 'performance',
    take(draft, from) {
      const table = from.style.fills ?? from.genre.fills;
      if (!table?.length) return false;
      draft.style = { ...draft.style, fills: table, drumFills: from.style.drumFills };
      return true;
    },
  },
  {
    /**
     * What the band does at a seam, and who is left holding a stop-time.
     *
     * `breakCarrier` comes with the palette rather than separately: a break is
     * one voice in the open and which voice is a fact about *this* band's
     * texture, so a palette that can draw a break and a carrier chosen by
     * somebody else is two bands disagreeing about the same bar.
     */
    name: 'transitions',
    tier: 'performance',
    take(draft, from) {
      const table = from.style.transitions ?? from.genre.transitions;
      if (!table?.length) return false;
      draft.style = {
        ...draft.style, transitions: table, breakCarrier: from.style.breakCarrier,
      };
      return true;
    },
  },
  {
    name: 'drops',
    tier: 'performance',
    take(draft, from) {
      if (!from.style.drops?.length) return false;
      draft.style = { ...draft.style, drops: from.style.drops, dropBars: from.style.dropBars };
      return true;
    },
  },
  {
    name: 'tempo-ramp',
    tier: 'performance',
    take(draft, from) {
      if (!from.style.tempoRamp?.length) return false;
      draft.style = {
        ...draft.style, tempoRamp: from.style.tempoRamp, tempoRise: from.style.tempoRise,
      };
      return true;
    },
  },
  {
    name: 'techniques',
    tier: 'performance',
    take(draft, from) {
      if (!from.style.techniques && !from.genre.techniques) return false;
      draft.genre = {
        ...draft.genre,
        techniques: from.genre.techniques,
        techniqueProfiles: from.genre.techniqueProfiles,
      };
      draft.style = {
        ...draft.style,
        techniques: from.style.techniques,
        techniqueProfiles: from.style.techniqueProfiles,
      };
      return true;
    },
  },
  {
    /**
     * The whole effects chain, all three tiers of it.
     *
     * `effectsFor` merges genre under era under style per layer, so taking one
     * tier would leave the host's reverb sitting under the donor's filter and
     * produce a room neither genre has. Three assignments, one donor.
     */
    name: 'effects',
    tier: 'performance',
    take(draft, from) {
      if (!from.genre.effects && !from.era.effects && !from.style.effects) return false;
      draft.genre = { ...draft.genre, effects: from.genre.effects };
      draft.era = { ...draft.era, effects: from.era.effects };
      draft.style = { ...draft.style, effects: from.style.effects };
      return true;
    },
  },
  {
    name: 'drum-effects',
    tier: 'performance',
    take(draft, from) {
      if (!from.genre.voiceEffects && !from.era.voiceEffects && !from.style.voiceEffects) return false;
      draft.genre = { ...draft.genre, voiceEffects: from.genre.voiceEffects };
      draft.era = { ...draft.era, voiceEffects: from.era.voiceEffects };
      draft.style = { ...draft.style, voiceEffects: from.style.voiceEffects };
      return true;
    },
  },
  {
    /** The sweep and the shape it sweeps — genre states one, style the other. */
    name: 'filter',
    tier: 'performance',
    take(draft, from) {
      if (!from.genre.filter && !from.style.filter) return false;
      draft.genre = { ...draft.genre, filter: from.genre.filter };
      draft.style = { ...draft.style, filter: from.style.filter };
      return true;
    },
  },
  {
    name: 'room',
    tier: 'performance',
    take(draft, from) {
      if (!from.genre.space && !from.era.space) return false;
      draft.genre = { ...draft.genre, space: from.genre.space };
      draft.era = { ...draft.era, space: from.era.space };
      return true;
    },
  },
  {
    name: 'balance',
    tier: 'performance',
    take(draft, from) {
      if (!from.genre.mix && !from.genre.drumMix) return false;
      draft.genre = { ...draft.genre, mix: from.genre.mix, drumMix: from.genre.drumMix };
      return true;
    },
  },
  {
    name: 'comping',
    tier: 'performance',
    take(draft, from) {
      if (!from.genre.comping) return false;
      draft.genre = { ...draft.genre, comping: from.genre.comping };
      return true;
    },
  },
  {
    name: 'soloing',
    tier: 'performance',
    take(draft, from) {
      if (!from.genre.solo) return false;
      draft.genre = {
        ...draft.genre, solo: from.genre.solo, soloBacking: from.genre.soloBacking,
      };
      return true;
    },
  },
  {
    name: 'ornament',
    tier: 'performance',
    take(draft, from) {
      if (from.genre.decorate === undefined) return false;
      draft.genre = { ...draft.genre, decorate: from.genre.decorate };
      return true;
    },
  },
  {
    /** How readily the rhythm section departs from what is in front of it. */
    name: 'figure-freedom',
    tier: 'performance',
    take(draft, from) {
      draft.genre = {
        ...draft.genre, vary: from.genre.vary, swap: from.genre.swap, signature: from.genre.signature,
      };
      draft.style = {
        ...draft.style, vary: from.style.vary, swap: from.style.swap, signature: from.style.signature,
      };
      return true;
    },
  },
  {
    name: 'arrangement',
    tier: 'performance',
    take(draft, from) {
      if (!from.genre.arrangement) return false;
      draft.genre = { ...draft.genre, arrangement: from.genre.arrangement };
      return true;
    },
  },

  // ---- figures: what they play -----------------------------------------
  {
    name: 'bass',
    tier: 'figures',
    metre: true,
    take(draft, from) {
      if (!from.style.bass.length) return false;
      draft.style = { ...draft.style, bass: from.style.bass };
      return true;
    },
  },
  {
    name: 'comp',
    tier: 'figures',
    metre: true,
    take(draft, from) {
      if (!from.style.comp.length) return false;
      draft.style = { ...draft.style, comp: from.style.comp };
      return true;
    },
  },
  {
    /**
     * The kit's figures, and whether a preset box is allowed to play them.
     *
     * `boxDrums: false` is a claim about a *pattern* — a shuffle whose subject
     * is the swing between the hands cannot be a step sequence — so it travels
     * with the patterns rather than with the bank.
     */
    name: 'drums',
    tier: 'figures',
    metre: true,
    take(draft, from) {
      if (!from.style.drums.length) return false;
      draft.style = { ...draft.style, drums: from.style.drums, boxDrums: from.style.boxDrums };
      return true;
    },
  },
  {
    /** What the tune is made of, rhythmically — and how it ends its phrases. */
    name: 'melody-cells',
    tier: 'figures',
    metre: true,
    take(draft, from) {
      if (!from.style.melodyCells.length || !from.style.cadenceCells.length) return false;
      draft.style = {
        ...draft.style,
        melodyCells: from.style.melodyCells,
        cadenceCells: from.style.cadenceCells,
      };
      return true;
    },
  },
  {
    name: 'melody-character',
    tier: 'figures',
    take(draft, from) {
      draft.style = { ...draft.style, melody: from.style.melody };
      return true;
    },
  },
  {
    /** The genre's account of what a line is made of. See `Genre.voice`. */
    name: 'phrasing',
    tier: 'figures',
    take(draft, from) {
      if (!from.genre.voice && !from.style.voice) return false;
      draft.genre = { ...draft.genre, voice: from.genre.voice };
      draft.style = { ...draft.style, voice: from.style.voice };
      return true;
    },
  },
  {
    name: 'counter-line',
    tier: 'figures',
    metre: true,
    take(draft, from) {
      if (!from.style.counterPatterns?.length && from.style.counterMode === undefined) return false;
      draft.style = {
        ...draft.style,
        counterPatterns: from.style.counterPatterns,
        counterMode: from.style.counterMode,
        counterSpacing: from.style.counterSpacing,
      };
      return true;
    },
  },
  {
    name: 'band-shots',
    tier: 'figures',
    metre: true,
    take(draft, from) {
      if (!from.style.shots?.length) return false;
      draft.style = { ...draft.style, shots: from.style.shots };
      return true;
    },
  },
  {
    /**
     * The two hands of a keyboard player, taken whole.
     *
     * Never merged field by field. `TwoHandedKeys` carries invariants that
     * `npm run genres` asserts — every named instrument has a `HandSpec`, and a
     * table that can draw `ostinato` has a figure for it — and those hold for a
     * donor's declaration and for nothing assembled out of two.
     */
    name: 'two-hands',
    tier: 'figures',
    metre: true,
    take(draft, from) {
      if (!from.style.twoHanded) return false;
      draft.style = { ...draft.style, twoHanded: from.style.twoHanded };
      return true;
    },
  },
  {
    /**
     * Which layers exist at all — and the two fields move together or not at
     * all. A donor that excludes the kit and another that requires a pad,
     * unioned, is a band nobody assembled.
     */
    name: 'layers',
    tier: 'figures',
    take(draft, from) {
      if (!from.style.excludeLayers?.length && !from.style.requireLayers?.length) return false;
      draft.style = {
        ...draft.style,
        excludeLayers: from.style.excludeLayers,
        requireLayers: from.style.requireLayers,
      };
      return true;
    },
  },
  {
    /** How the texture is stacked in register and how it breathes. */
    name: 'layer-plan',
    tier: 'figures',
    take(draft, from) {
      if (!from.genre.layerPlan) return false;
      draft.genre = { ...draft.genre, layerPlan: from.genre.layerPlan };
      return true;
    },
  },

  // ---- harmony: what it is played over ---------------------------------
  {
    /**
     * Everything about the chords, from one donor, in one move.
     *
     * This is the largest trait in the file and it is one trait for the reason
     * the head of this file gives: the numerals, the mode tables and the rule
     * that decides *which notes are available over a chord* are a single system.
     * All 113 numerals in the catalogue parse under any genre, so a mismatch
     * here does not fail — it produces a tune picking notes from a scale that
     * has nothing to do with the progression underneath it, reliably, for the
     * whole song. `scaleForChord` is resolved down from the donor's style-or-
     * genre answer so the pairing survives even when only the style overrides.
     *
     * `relativeMajorChorus` comes too, because it is a thumb on the scale of
     * *these* chorus progressions — it boosts the ones opening on III or VI —
     * and means nothing applied to somebody else's table.
     */
    name: 'harmony',
    tier: 'harmony',
    take(draft, from) {
      draft.style = {
        ...draft.style,
        progressions: from.style.progressions,
        majorProgressions: from.style.majorProgressions,
        minorProgressions: from.style.minorProgressions,
        modeWeights: from.style.modeWeights,
        relativeMajorChorus: from.style.relativeMajorChorus,
        scaleForChord: from.style.scaleForChord ?? from.genre.scaleForChord,
      };
      draft.genre = { ...draft.genre, keys: from.genre.keys };
      return true;
    },
  },
  {
    /** Whether the music is two-voiced as a standing fact. */
    name: 'second-voice',
    tier: 'harmony',
    take(draft, from) {
      if (!from.style.harmony && !from.genre.harmony) return false;
      draft.genre = { ...draft.genre, harmony: from.genre.harmony };
      draft.style = { ...draft.style, harmony: from.style.harmony };
      return true;
    },
  },
  {
    name: 'modulation',
    tier: 'harmony',
    take(draft, from) {
      draft.era = {
        ...draft.era,
        keyChangeChance: from.era.keyChangeChance,
        bridgeKeyChangeChance: from.era.bridgeKeyChangeChance,
      };
      draft.genre = { ...draft.genre, preparedModulation: from.genre.preparedModulation };
      return true;
    },
  },

  // ---- form: what shape it is ------------------------------------------
  {
    /** The shape and the length, which are one decision in two fields. */
    name: 'form',
    tier: 'form',
    take(draft, from) {
      if (!from.genre.forms.length) return false;
      draft.genre = { ...draft.genre, forms: from.genre.forms, duration: from.genre.duration };
      draft.style = { ...draft.style, chorusBars: from.style.chorusBars };
      return true;
    },
  },
  {
    name: 'ending',
    tier: 'form',
    take(draft, from) {
      draft.genre = {
        ...draft.genre, ending: from.genre.ending, countIn: from.genre.countIn,
      };
      draft.style = {
        ...draft.style, ending: from.style.ending, countIn: from.style.countIn,
      };
      return true;
    },
  },
  {
    name: 'repetition',
    tier: 'form',
    take(draft, from) {
      draft.genre = {
        ...draft.genre,
        defaultHook: from.genre.defaultHook,
        defaultStrictness: from.genre.defaultStrictness,
        ruleOverrides: from.genre.ruleOverrides,
      };
      draft.style = { ...draft.style, hook: from.style.hook, strictness: from.style.strictness };
      return true;
    },
  },
  {
    /**
     * The title generator, which is a pure function of an rng and a context and
     * is therefore the one property here that cannot go wrong. A name is how a
     * piece announces what it is, and a chimera announcing itself in the wrong
     * language is the joke landing rather than a fault.
     *
     * `Genre.vocals` used to travel with it and does not any more. A singer is
     * *who is playing*, not what shape the piece is, and bundling the two meant
     * the only way to borrow a voice was to borrow a title as well. See `voice`.
     */
    name: 'title',
    tier: 'form',
    take(draft, from) {
      draft.genre = { ...draft.genre, title: from.genre.title };
      return true;
    },
  },

  // ---- staging: what it looks like -------------------------------------
  {
    /**
     * How much this music moves a body, as a multiplier on the groove score.
     *
     * Read by `scoreGroove` off the registry, so this records rather than
     * writes — see the head of this file. An ambient act's stillness arriving in
     * a dance number is the most visible thing in this kind and the cheapest.
     */
    name: 'body',
    tier: 'staging',
    take: (_draft, from) => from.genre.staging?.body !== undefined,
  },
  {
    /** What the programme says about the piece. Read by `buildBill`. */
    name: 'programme',
    tier: 'staging',
    take: (_draft, from) => !!from.genre.staging?.blurbs?.length,
  },
  {
    /**
     * The band's clothes, for every player whose instrument was *not* itself
     * borrowed.
     *
     * `cast.ts` already dresses a player by whoever lent them their instrument,
     * which is `band`'s doing and stays first. This is the rest of the stage —
     * the singer, and anybody on a layer the draw left alone — so a number can
     * look foreign without the whole band having changed hands.
     */
    name: 'clothes',
    tier: 'staging',
    take: (_draft, from) => !!from.genre.staging?.wardrobe,
  },
  {
    /**
     * …and the colours off a fourth, fifth and sixth rail.
     *
     * A `Wardrobe` is a set of palettes — jackets, shirts, trousers, accents,
     * the one loud colour a front person is allowed — and dressing a player from
     * one donor gives them that genre's whole look. These take one palette each
     * from a genre of its own, so a player can be in a metal cut, a country
     * jacket colour and a disco accent at once.
     *
     * Three rails and not five, and the two left out are the reason it works.
     * `trousers` follows the jacket through `Wardrobe.matched`, and `loud`
     * belongs with the jacket because `spotlight` swaps one for the other on the
     * front person — splitting either would produce a player whose two halves
     * are arguing rather than one wearing borrowed clothes.
     */
    name: 'jacket-colour',
    tier: 'staging',
    take: (_draft, from) => !!from.genre.staging?.wardrobe,
  },
  {
    name: 'shirt-colour',
    tier: 'staging',
    take: (_draft, from) => !!from.genre.staging?.wardrobe,
  },
  {
    name: 'accent-colour',
    tier: 'staging',
    take: (_draft, from) => !!from.genre.staging?.wardrobe,
  },
  {
    /** Hair colour, on the same rails and from a genre of its own. */
    name: 'hair-colour',
    tier: 'staging',
    take: (_draft, from) => !!from.genre.staging?.wardrobe,
  },
];

// ---------------------------------------------------------------------------
// Building one
// ---------------------------------------------------------------------------

/**
 * Silence a mode this style cannot actually harmonise.
 *
 * `pickProgression` reads `majorProgressions`/`minorProgressions` for the drawn
 * mode and falls back to `progressions` when there is none — and `progressions`
 * is written for the style's *primary* mode, so the fallback is a major-key
 * table read in minor or the reverse. `Style.progressions` says as much in its
 * own doc: *"a major-key table read in minor produces nonsense"*.
 *
 * In the catalogue that is a handful of styles drawing a mode they have no table
 * for. In a chimera it would be systematic, because the mode weights and the
 * progressions can arrive from different donors — so the weight of a mode with
 * no `verse` table for it goes to zero, and `chooseMode` stops offering it.
 *
 * The primary mode keeps its weight whatever happens: a style whose tables serve
 * neither mode by this test is a style whose `progressions` *is* the answer for
 * its primary, which is exactly the arrangement 323 styles in the project have.
 */
function soundModeWeights(style: Style): Style {
  const primary = style.modeWeights.minor >= style.modeWeights.major ? 'minor' : 'major';
  const serves = (mode: 'minor' | 'major') => mode === primary
    || !!(mode === 'major' ? style.majorProgressions : style.minorProgressions)?.verse?.length;
  const weights = {
    minor: serves('minor') ? style.modeWeights.minor : 0,
    major: serves('major') ? style.modeWeights.major : 0,
  };
  if (weights.minor <= 0 && weights.major <= 0) return style;
  return { ...style, modeWeights: { ...style.modeWeights, ...weights } };
}

/**
 * Build the band.
 *
 * The host is handed in already resolved — `generateSong` draws the genre, era,
 * style and mood the ordinary way and only then calls this, so a chimera is the
 * song that seed always produced with a different band on it rather than a
 * different song. That ordering is also what makes the recipe sufficient to
 * reproduce the piece: nothing here short-circuits a draw when a caller names a
 * genre, because there is no draw here to short-circuit.
 *
 * Returns the three objects `generateSong` reads from, each a copy of the host's
 * with the borrowed properties written over it, and the recipe saying what moved.
 */
export function planChaos(
  seed: string,
  host: { genre: Genre; era: EraProfile; style: Style },
  chaos: ChaosOptions = {},
): { genre: Genre; era: EraProfile; style: Style; recipe: ChaosRecipe } {
  const levels = new Set(chaos.levels ?? DEFAULT_LEVELS);
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const spread = clamp(chaos.spread ?? DEFAULT_SPREAD);
  /**
   * One rate per kind, resolved before the loop so a trait's tier is the whole
   * of the lookup. Every kind gets one, selected or not, because every trait
   * spends a coin either way — see the loop.
   */
  const rates = Object.fromEntries(
    CHAOS_LEVELS.map((l) => [l, clamp(chaos.mixing?.[l] ?? spread)]),
  ) as Record<ChaosLevel, number>;

  // Its own stream, read by nothing else, so a chaos song spends the same
  // numbers in the same places as the plain song of the same seed.
  const rng = new Rng(`${seed}:chaos`);

  const pool = donorStyles(chaos.donors ?? GENRE_IDS, host.style);

  const draft: Draft = {
    genre: host.genre,
    style: host.style,
    era: host.era,
    bpm: [host.style.bpm[0], host.style.bpm[1]],
  };
  const borrowed: Record<string, string> = {};

  for (const trait of TRAITS) {
    /**
     * Every trait draws its coin and its donor, **including the ones this song
     * is not allowed to borrow**, and the waste is the whole point.
     *
     * It is the same argument `generateSong` makes about drawing a genre it is
     * about to throw away, one level down. Skipping the draws for an unselected
     * kind would make the stream depend on which boxes are ticked, so ticking
     * `harmony` would silently redraw the instruments — and then no two settings
     * could be compared, which is the only reason anybody ticks a box twice.
     * Spending them regardless buys the property that makes the control usable:
     * **opening one kind never changes what the others borrowed.**
     *
     * `npm run chaos` asserts it directly rather than trusting this paragraph —
     * each kind on its own, then all five, and every donor must match.
     *
     * The one thing that legitimately does move is a *figure* donor's pool,
     * because a figure narrows the tempo band and only figures read it. That
     * stays inside `figures`, which is where it belongs: it is one band making
     * room for another, not a setting leaking across.
     *
     * The rate the coin is weighted by is this trait's *kind's* rate, and that
     * costs the argument nothing: `Rng.chance` spends one number whatever the
     * probability is, so turning `harmony` down to a tenth leaves every draw
     * `band` made in exactly the place it was. See `ChaosOptions.mixing`.
     */
    const coin = rng.chance(rates[trait.tier]);
    const eligible = trait.metre
      ? pool.filter(({ style }) => compatible(host.style, style, draft.bpm))
      : pool;
    if (!eligible.length) continue;

    const { genre, style } = rng.pick(eligible);
    const eraIds = Object.keys(genre.eras);
    const from: Donor = { genre, style, era: genre.eras[rng.pick(eraIds)]! };

    if (!coin || !levels.has(trait.tier)) continue;
    if (!trait.take(draft, from)) continue;
    borrowed[trait.name] = `${genre.id}:${style.id}`;
    /**
     * A figure donor narrows the tempo band to what both bands can play.
     *
     * `compatible` has already guaranteed the overlap is non-empty, and it is
     * checked against the *narrowed* band rather than the host's, so the third
     * donor has to suit the first two as well.
     */
    if (trait.metre) {
      draft.bpm = [Math.max(draft.bpm[0], style.bpm[0]), Math.min(draft.bpm[1], style.bpm[1])];
    }
  }

  /**
   * The mode repair runs only where the chaos created the risk.
   *
   * `harmony` is the one trait that can separate a mode weight from the table
   * that serves it, so that is the one case this reaches into. A host style with
   * a gap of its own keeps it — that is a fact about the catalogue and belongs
   * to whoever owns the table, not to a mode that happens to be reading it — and
   * leaving it alone is also what keeps `band` exact: nothing the engine draws
   * from has moved there, so nothing may move here either.
   */
  const style = borrowed['harmony']
    ? soundModeWeights({ ...draft.style, bpm: draft.bpm })
    : { ...draft.style, bpm: draft.bpm };

  /**
   * The rates worth writing down: a *selected* kind whose rate is not `spread`.
   *
   * Both halves of that earn their place. An unselected kind's rate changed
   * nothing — its coins were spent and thrown away — and recording it would put
   * a number in the recipe that cannot be heard. A kind sitting on `spread`
   * already has its rate published one field up. What is left is exactly what a
   * reader needs to see and what regeneration needs to be handed back, which is
   * the standard `SongMeta.chaos` is held to.
   */
  const mixing: Partial<Record<ChaosLevel, number>> = {};
  for (const level of CHAOS_LEVELS) {
    if (levels.has(level) && rates[level] !== spread) mixing[level] = rates[level];
  }

  return {
    // The host's identity, and the host's staging with it. A chaos concert is
    // one band in one room, whatever the band turns out to be made of — and
    // `meta.genre` naming a real genre is what keeps the venue, the wardrobe and
    // `buildConcert`'s year lookup working with nothing to tell them.
    genre: { ...draft.genre, id: host.genre.id, label: host.genre.label, staging: host.genre.staging },
    era: draft.era,
    style,
    recipe: {
      // In the array's own order rather than the caller's, so two recipes that
      // asked for the same kinds compare equal however they were typed.
      levels: CHAOS_LEVELS.filter((l) => levels.has(l)),
      spread,
      ...(Object.keys(mixing).length ? { mixing } : {}),
      host: { genre: host.genre.id, era: host.era.id, style: host.style.id },
      borrowed,
    },
  };
}

/**
 * How many places in the catalogue could donate each property.
 *
 * Exported for `npm run chaos`, and it replaced a sampling loop that was
 * measuring the wrong thing. Reachability is a fact about the *tables* — does
 * anything, anywhere, have this property to lend — and asking it by generating
 * four hundred chimeras and seeing what turned up made it a fact about the
 * draw instead. That check went red the first time the trait list was reordered,
 * on `tempo-ramp`, which has **one** donor in 389 styles: the expected number of
 * hits in 400 chimeras is about one, so a pass was luck and a failure said
 * nothing. This counts, exactly, and cannot flake.
 *
 * The count is worth having in its own right rather than only as a boolean. A
 * property with one donor is reachable and, in practice, nearly never reached,
 * and that is a thing an author should be told rather than left to discover.
 *
 * Each `take` is called against a throwaway draft which is then discarded, so
 * this measures precisely what the loop in `planChaos` would: whether the donor
 * has anything to give. The metre gate is not applied — that is a fact about a
 * particular host, and this is a fact about the catalogue.
 */
export function donorCounts(host: { genre: Genre; era: EraProfile; style: Style }): Map<string, number> {
  const counts = new Map<string, number>();
  for (const trait of TRAITS) {
    let n = 0;
    for (const id of GENRE_IDS) {
      const genre = GENRES[id]!;
      for (const style of Object.values(genre.styles)) {
        for (const era of Object.values(genre.eras)) {
          const draft: Draft = {
            genre: host.genre,
            style: host.style,
            era: host.era,
            bpm: [host.style.bpm[0], host.style.bpm[1]],
          };
          if (trait.take(draft, { genre, style, era })) n++;
        }
      }
    }
    counts.set(trait.name, n);
  }
  return counts;
}

/**
 * Which layers a chimera has decided it does not have.
 *
 * Exported for `npm run chaos`, which asserts that borrowing `layers` cannot
 * produce a band with nothing in it — see the check for the argument.
 */
export function layerConflict(style: Style): LayerId[] {
  const excluded = new Set(style.excludeLayers ?? []);
  return (style.requireLayers ?? []).filter((l) => excluded.has(l));
}
