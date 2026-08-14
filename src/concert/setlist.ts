/**
 * The setlist — which numbers get played, and in what order.
 *
 * The generator makes songs one at a time and has no notion of a set. That is
 * correct for a radio station, where the next track is simply the next track,
 * and wrong for a concert: five foxtrots in a row is not a programme, it is a
 * loop. So a concert gets a *plan* before it gets any music.
 *
 * The plan is deliberately cheap. Nothing here generates notes or evaluates
 * them; it picks the style, mood, key, length and smoothness of each number
 * from tables that already exist, and hands those to `generateSong`. All the
 * musical work stays where it was. What this file adds is the thing a band
 * knows and a track generator cannot: that a set has a shape.
 *
 * ## Repertoire first, order last
 *
 * The obvious implementation is to generate six songs, score them, keep four
 * and sort them by tempo. It is also the wrong one — it wastes most of the
 * generation, and it can only order what it happened to be given, so a set with
 * no slow number in it stays a set with no slow number in it.
 *
 * Instead the *repertoire* is decided first: draw as many distinct styles as
 * there are numbers, from the ones this era actually plays, give each one a mood
 * it suits — and then shuffle. The set has no programmed shape, and that is a
 * decision rather than an omission.
 *
 * It used to have one. An earlier version of this file programmed the arc every
 * band knows — strong opener, something slower third, the biggest number last —
 * and filled each position to a target speed drawn from `Style.bpm` and
 * `Mood.tempo`. It worked exactly as designed, and that was the problem: **a
 * position with a target is naming a style, not choosing one.** Measured over
 * 250 concerts a genre, the closer was a valssi 93% of the time, 89% of synth
 * ballad slots were `cinematic` or `stalker`, and `cinematic` never once opened
 * a set. Nothing was wrong with the draw. The genre tables put one style at each
 * end of each speed range — a valssi runs 50–63 bars per minute where nothing
 * else in iskelmä clears 42.5 — so asking for the fastest thing on the bill has
 * one answer, and no reweighting of a draw invents a second one.
 *
 * Shuffling gives up the shape and gets back the catalogue. Refresh the page
 * twice and the two evenings are different evenings, which is what a generator
 * is for; the shape was the same shape every time.
 *
 * ## Contrast is the whole point
 *
 * Three axes, and they are enforced rather than hoped for:
 *
 *  - **style**, by exclusion — the evening's styles are drawn without
 *    replacement, so a tango follows a humppa rather than another tango;
 *  - **mood**, by penalty, more gently — moods overlap more than styles do, and
 *    a genre with five of them owes a five-number set no promise;
 *  - **key**, by exclusion — every number is in a different key. A band that
 *    plays four numbers in A minor sounds like one long number, and this is the
 *    axis an audience notices without being able to name.
 *
 * Tempo is no longer on that list and no longer needs to be. Distinct styles
 * *are* distinct tempos — the styles are where the speed lives — so contrast
 * along that axis now falls out of the style draw instead of being programmed
 * on top of it.
 *
 * Genre is *not* an axis. One genre for the whole concert: a band does not
 * change idiom mid-set, and the venue, the clothes and the bill are all built
 * on the assumption that it does not. The era is fixed for the same reason —
 * this is one band on one night, not a compilation.
 */

import type { Pc } from '../core/pitch.js';
import { Rng } from '../core/rng.js';
import type { Mode } from '../core/scale.js';
import type { Song } from '../core/types.js';
import type { StrictnessId } from '../core/rules.js';
import { generateSong, type GenerateOptions } from '../generate/song.js';
import { GENRE_IDS, getGenre, type Genre } from '../genre/index.js';
import type { EraProfile, Mood, Style } from '../style/types.js';
import type { ConcertOptions, VocalPolicy } from './types.js';

// ---------------------------------------------------------------------------
// The two policies the plan hands down
// ---------------------------------------------------------------------------

/**
 * Smoothness for a concert number: the top half of the scale, never the bottom.
 *
 * Smoothness filters melodic and vertical roughness (`core/rules.ts`)
 * and the low end of the scale exists so that the axis means something at both
 * ends — `free` is a real sound, not an absence of care. But a concert is
 * *watched* as well as heard, under a follow spot, by an audience that can see
 * whose hands played the note. A rough line is exactly the wrong thing to put
 * there, and a polished band is what a stage implies.
 *
 * This overrides a genre default that is lower, and jazz is the case that
 * matters: `defaultStrictness: 'light'`, and bebop overrides even that to
 * `free`. Lifting them is a real tension and it is resolved deliberately rather
 * than by accident — **a solo takes its interest from the solo engine's own
 * vocabulary, not from loosening the filter.** Chromatic enclosures and
 * rhythmic displacement are things `generate/solo.ts` does on purpose; they are
 * not the same thing as the constraint level letting an ugly leap through
 * because nobody was checking. If the jazz here sounds tame the fix is in the
 * solo generator, and dropping back to `light` would only hide the problem
 * behind noise.
 *
 * Weighted toward `strict` rather than pinned to it, because smoothness is
 * itself a contrast axis and a set where one number is noticeably tighter than
 * the last is a set with something going on in it.
 */
const CONCERT_SMOOTHNESS: readonly (readonly [StrictnessId, number])[] = [
  ['standard', 3],
  ['strict', 6],
  ['polished', 2],
];

/** The floor this file guarantees. `npm run concert` asserts it. */
export const MIN_CONCERT_STRICTNESS: StrictnessId = 'standard';

/**
 * How long the whole evening should run, in seconds.
 *
 * The one number in this file that is a taste judgement rather than a
 * derivation. Eleven minutes is long enough to have a shape — an opener, a
 * change of pace, an ending that means something — and short enough that the
 * audience is still throwing tomatoes at the end of it rather than having
 * wandered off to another tab.
 */
const TARGET_SET_SECONDS = 660;

/**
 * How many numbers, when the caller does not say.
 *
 * **A set is measured in minutes, not in numbers**, and this is where the three
 * genres stop being interchangeable. An iskelmä number is a little over two
 * minutes and an ambient one is closer to five, so "four numbers" is a
 * comfortable evening in one genre and a long sit in the other. Dividing the
 * target running time by what this genre's numbers actually cost gives three
 * ambient pieces and five dance numbers, which is what the two idioms do
 * anyway: a tanssilava band plays a lot of short things and a drone act plays
 * a few long ones.
 *
 * Clamped to the 3–5 the plan asks for, and drawn around the ideal rather than
 * pinned to it, so two shows of the same genre are not the same length.
 * `ConcertOptions.numbers` overrides all of it — one number is a soundcheck and
 * the type says so — and nothing above six, past which the bill stops fitting
 * on a sheet of paper.
 */
function planCount(genre: Genre, rng: Rng): number {
  const [lo, hi] = concertLengths(genre);
  const ideal = Math.round(TARGET_SET_SECONDS / ((lo + hi) / 2));
  const fit = (n: number): number => Math.max(3, Math.min(5, n));
  return rng.weighted([[fit(ideal - 1), 2], [fit(ideal), 5], [fit(ideal + 1), 2]]);
}

// ---------------------------------------------------------------------------
// The shape of a number
// ---------------------------------------------------------------------------

interface Slot {
  /** Where in the genre's length band this number sits, 0..1. */
  length: number;
  sung: boolean;
}

/**
 * What is left of a slot once the arc is gone: how long the number runs, and
 * whether anybody sings it.
 *
 * Length is drawn per number rather than assigned by position. The old plan gave
 * the closer 0.72 of the genre's length band and the opener 0.3, because the
 * closer was the big one and the opener was the hook; with no position claiming
 * to be either, a length that varies freely is what keeps five numbers from all
 * running the same three minutes. It stops short of both ends of the band on
 * purpose: `concertLengths` has already pulled the ceiling in for a set rather
 * than an album, and a number sitting exactly on its genre's floor is a
 * fragment.
 */
function planSlots(count: number, sung: boolean[], rng: Rng): Slot[] {
  const slots: Slot[] = [];
  for (let i = 0; i < count; i++) {
    slots.push({ length: rng.float(0.22, 0.78), sung: sung[i] ?? false });
  }
  return slots;
}

/**
 * Chance one number is sung, per genre. `mixed` reads this and nothing else.
 *
 * ## Why a chance rather than a count
 *
 * This used to deal a fixed quota — a third of the bill, rounded, never the
 * opener — and both halves of that were wrong in the same way. **A quota makes
 * the evening a property of its own length**: a four-number set had exactly one
 * sung number and a five-number set exactly two, every time, so the only
 * question left was which slots drew the short straw. And the opener rule made
 * *position* answer a question position has no business answering — the second
 * number of a set was measurably likelier to be sung than the first, which is a
 * fact about an `i > 0` and not about a band. A number is now sung because this
 * genre sings, and for no other reason; slot 1 and slot 5 draw the same coin.
 *
 * The price is that the count is no longer guaranteed. A whole evening can come
 * out instrumental — at the table's mean rate a four-number set has nobody
 * singing in it about a quarter of the time — and that is the intended reading
 * rather than a degenerate case. Instrumental is a first-class mode here, and
 * the staging, the lighting and the bill were all built to work with nobody at
 * the centre mic.
 *
 * ## Why the numbers are this low
 *
 * They are deliberately not the real world's. A pop concert is sung start to
 * finish and a country one nearly so; scored honestly, half the catalogue would
 * be a singer with a backing band every night. **In this engine a voice is an
 * instrument** — it sings an invented language, it takes the melody line, and a
 * set that always has one is a set that never gets to be about the guitar
 * player. So the table keeps the *ordering* real and shrinks the whole scale:
 * pop and rnb sing four numbers in ten, ambient one, and no genre reaches a
 * coin-flip. An evening with a singer stays an event rather than a default.
 *
 * The ordering is the part worth arguing with. It runs from song-led idioms —
 * pop, rnb, hiphop, iskelmä, country, whose repertoire *is* the vocal line —
 * through the ones that hold both a sung and a played tradition — rock, latin,
 * arabic, finnfolk, indian, metal, reggae — down to the ones whose records are
 * mostly instrumental and whose voice, when it appears, is a texture: funk and
 * jazz to house and dnb, then synth, classical and ambient, where a choir patch
 * is scenery.
 *
 * Every genre has an entry and `npm run concert` asserts it, so the default
 * below is a runtime floor rather than a design: a genre that reaches it is a
 * genre somebody forgot, and the check says so by name.
 */
export const SUNG_CHANCE: Record<string, number> = {
  pop: 0.40,
  rnb: 0.40,
  hiphop: 0.40,
  iskelma: 0.38,
  country: 0.36,
  reggae: 0.34,
  rock: 0.32,
  arabic: 0.32,
  finnfolk: 0.32,
  latin: 0.30,
  indian: 0.30,
  metal: 0.28,
  funk: 0.24,
  jazz: 0.20,
  house: 0.20,
  dnb: 0.16,
  synth: 0.14,
  classical: 0.12,
  ambient: 0.10,
};

/** What an unlisted genre sings at. See `SUNG_CHANCE` — nothing should use it. */
export const DEFAULT_SUNG_CHANCE = 0.25;

/**
 * Nothing in the table may reach a coin-flip. `npm run concert` asserts it, and
 * it is the one line of this policy that is a promise rather than a taste: more
 * of any genre's evenings are instrumental than sung.
 */
export const MAX_SUNG_CHANCE = 0.5;

/**
 * Which numbers are sung: one independent draw per number, at the genre's rate.
 *
 * `instrumental` and `sung` are the caller overriding the draw outright — the
 * two modes a page needs when it is showing something specific — and neither
 * consumes the stream, so a show does not shift underneath the toggle.
 *
 * The voice sings an invented language rather than a real one, and nobody ever
 * sees the words — a lexicon per song, spelled to that genre's phonotactics and
 * heard only as syllables. That is a property of `generate/vocals.ts` and this
 * file does not get a vote, which is exactly how it should stay.
 */
function planVocals(count: number, genre: Genre, policy: VocalPolicy, rng: Rng): boolean[] {
  if (policy === 'instrumental') return new Array<boolean>(count).fill(false);
  if (policy === 'sung') return new Array<boolean>(count).fill(true);

  const chance = SUNG_CHANCE[genre.id] ?? DEFAULT_SUNG_CHANCE;
  const sung: boolean[] = [];
  // One draw per slot, in slot order, and the slot index is not consulted: that
  // is the whole of "position does not decide". See `SUNG_CHANCE`.
  for (let i = 0; i < count; i++) sung.push(rng.chance(chance));
  return sung;
}

// ---------------------------------------------------------------------------
// The repertoire
// ---------------------------------------------------------------------------

/**
 * The evening's styles: as many distinct ones as there are numbers.
 *
 * Weighted by the era and by nothing else. Mood affinity deliberately does not
 * enter here, though it used to: folding `Mood.styleBias` into the style draw
 * meant a style that happens to suit six of a genre's moods was programmed more
 * often than one that suits two, which is a fact about how the mood table was
 * written and not a fact about what the band plays. The era weight is the one
 * statement in the tables that is actually about repertoire — a zero means the
 * band does not know the style, and there were no iskelmäpop numbers at a 1968
 * tanssilava — so it is the only thing consulted.
 *
 * Without replacement, so an evening is `count` different things rather than
 * `count` draws that might collide. The pool refills when it runs dry rather
 * than throwing: an era that knows four styles and a set that wants five has to
 * repeat one, and repeating one is better than a short set.
 *
 * **The order this returns is not a playing order.** A weighted draw without
 * replacement tends to surface the heaviest weight first, so using it as-is
 * would hand the first number to the era's signature style nearly every time —
 * the same wall in a new place. The caller shuffles.
 */
function drawStyles(genre: Genre, era: EraProfile, count: number, rng: Rng): Style[] {
  const playable = Object.values(genre.styles).filter((s) => (era.styleWeights[s.id] ?? 0) > 0);
  if (!playable.length) throw new Error(`No style is playable in era "${era.id}"`);

  const out: Style[] = [];
  let pool = playable;
  for (let i = 0; i < count; i++) {
    if (!pool.length) pool = playable;
    const style = rng.weightedBy(pool, (s) => era.styleWeights[s.id]!);
    out.push(style);
    pool = pool.filter((s) => s !== style);
  }
  return out;
}

/**
 * A mood for one style, leaning away from the moods already heard tonight.
 *
 * A penalty rather than an exclusion, and a mild one. Moods overlap far more
 * than styles do — two numbers can both be `kaihoisa` and sound nothing alike if
 * one is a tango and the other a jenkka — and a genre with five moods owes a
 * five-number set no promise it can keep.
 *
 * `styleBias` carries zeros, meaning a pairing the genre does not make. Under
 * the old draw that only cost the pairing its weight, because style and mood
 * were drawn together; now the style is already chosen, so a style whose every
 * mood is ruled out would have no draw at all. It falls back to an unweighted
 * pick rather than throwing — a pairing the tables never anticipated is a table
 * to fix, not a concert to cancel.
 */
function drawMood(genre: Genre, style: Style, used: Set<string>, rng: Rng): Mood {
  const moods = Object.values(genre.moods);
  const weight = (m: Mood): number =>
    (m.styleBias[style.id] ?? 1) * (used.has(m.id) ? 0.25 : 1);
  if (moods.every((m) => weight(m) <= 0)) return rng.pick(moods);
  return rng.weightedBy(moods, weight);
}

/**
 * A key nobody has played yet tonight.
 *
 * Mode is drawn the way `generate/song.ts` draws it, from the style's own
 * leaning bent by the mood's, and the tonic then comes from that mode's table —
 * the two are not independent, and a tonic drawn from the minor table under a
 * major mode gives a key the genre does not live in.
 *
 * Both are forced rather than left to the song, because key contrast is the
 * axis the generator has no way to see: each song is written alone and has no
 * idea what preceded it.
 *
 * Whoever draws first picks from the whole weighted table and whoever draws last
 * picks from what is left, so the draw order is worth something and no position
 * has a claim on it. Left to run in playing order it drifted down the table:
 * mean rank 2.19, 2.50, 2.64, 2.50 across a four-number iskelmä set, the back of
 * the bill quietly in the odder keys. The caller shuffles instead.
 */
function drawKey(
  genre: Genre, style: Style, mood: Mood, used: Set<Pc>, rng: Rng,
): { tonic: Pc; mode: Mode } {
  const mode = rng.weighted([
    ['minor', style.modeWeights.minor * mood.modeBias.minor],
    ['major', style.modeWeights.major * mood.modeBias.major],
  ] as const) as Mode;
  const table = mode === 'minor' ? genre.keys.minor : genre.keys.major;
  const free = table.filter(([pc]) => !used.has(pc));
  return { tonic: rng.weighted(free.length ? free : table), mode };
}

// ---------------------------------------------------------------------------
// The set
// ---------------------------------------------------------------------------

/**
 * One number, and the exact options that produced it.
 *
 * The recipe is carried rather than re-derived because a live re-voice has to
 * regenerate this song mid-performance and `SongMeta` is not enough to do it
 * with: it records the key and the tempo that came *out*, but not
 * `targetSeconds`, and reconstructing the call from what it does record put the
 * band back in a different key on 30 numbers out of 32. See `revoiceNumber`.
 */
export interface SetlistNumber {
  song: Song;
  recipe: GenerateOptions;
}

/**
 * Pick and order the numbers for one concert.
 *
 * Deterministic: the same options give byte-identical songs, and each number's
 * own seed is derived from the concert's, so `song.meta.seed` alone identifies
 * a number within a show. Everything else in `src/concert/` keys off these
 * songs, so this is the first thing that runs and the only thing that decides
 * what the evening consists of.
 */
export function buildSetlist(opts: ConcertOptions = {}): SetlistNumber[] {
  /**
   * A number the caller already chose skips everything below.
   *
   * Not "the set with one slot" — there is no repertoire to cover, no contrast
   * to enforce and no key to keep clear of, because all three are properties of
   * a *sequence* and this is one piece of music. Every table below stays out of
   * it: the song is generated from exactly the options handed in, so it is the
   * same song those options produce anywhere else, note for note.
   */
  if (opts.song) return [{ song: generateSong(opts.song), recipe: opts.song }];

  const seed = String(opts.seed ?? Math.floor(Math.random() * 1e9));
  // Its own stream, so the cast, the venue and the lighting can share the
  // concert seed without any of them shifting when another one changes.
  const rng = new Rng(`${seed}:setlist`);

  /**
   * Genre and era are *drawn first and overridden second*, exactly as
   * `generate/song.ts` draws its own four. The waste is the point.
   *
   * A short-circuit — `opts.genre ?? rng.pick(…)` — spends one fewer random
   * number when the option is supplied, which shifts every later draw and hands
   * back a different evening. That made the showbill's own share link a lie:
   * `shareUrl` writes the genre and era it is looking at into the URL, so
   * opening that URL passed them back as options and rebuilt the concert from a
   * stream that had moved. Seed `evening` bare opened with Turquoise Aerial; the
   * same seed with the genre it had just drawn opened with Telmir Works. Anyone
   * following a shared link arrived at a different concert from the one the
   * person sharing it was watching.
   *
   * So both draws run unconditionally and the option overrides the result. A
   * concert's own reported genre and era are now enough to reproduce it, which
   * is the same property `SongMeta` has one level down.
   */
  const drawnGenre = rng.pick(GENRE_IDS);
  const genre = getGenre(opts.genre ?? drawnGenre);
  // One era for the set. Every visual system downstream — clothes, fixtures,
  // the paper the bill is printed on — takes the era as a single fact about the
  // evening, and a band that plays 1968 and then 1985 has no era at all.
  //
  // Drawn from *this* genre's eras, after the override above has settled which
  // genre that is: era ids are genre-local, so the draw has nothing to pick from
  // until the genre is known. That the list differs per genre costs nothing —
  // `Rng.pick` spends one number whatever the length — so overriding the genre
  // moves which era comes out without moving where the stream ends up, which is
  // what lets a caller pass the genre alone and still get this same evening.
  const drawnEra = rng.pick(Object.keys(genre.eras));
  const era = opts.era ? lookupEra(genre, opts.era) : genre.eras[drawnEra]!;

  const count = opts.numbers === undefined
    ? planCount(genre, rng)
    : Math.max(1, Math.min(6, Math.round(opts.numbers)));
  const slots = planSlots(count, planVocals(count, genre, opts.vocals ?? 'mixed', rng), rng);

  const usedMoods = new Set<string>();
  const usedKeys = new Set<Pc>();
  const [shortest, longest] = concertLengths(genre);

  /**
   * The whole repertoire first, then a mood each. Nothing is generated inside
   * this loop: the draws are what the evening *is*, and settling them before any
   * music exists is what lets the style draw see the whole set at once and hand
   * out `count` different styles rather than `count` independent guesses.
   *
   * `drawStyles` returns its own draw order, which is weighted; shuffling is
   * what turns it into a playing order. See `drawStyles`.
   */
  const picks = rng.shuffle(drawStyles(genre, era, count, rng)).map((style) => {
    const mood = drawMood(genre, style, usedMoods, rng);
    usedMoods.add(mood.id);
    return { style, mood };
  });

  /** Keys second, in their own shuffled order. See `drawKey`. */
  const keys = new Array<{ tonic: Pc; mode: Mode }>(slots.length);
  for (const i of rng.shuffle(slots.map((_, n) => n))) {
    const { style, mood } = picks[i]!;
    const key = drawKey(genre, style, mood, usedKeys, rng);
    usedKeys.add(key.tonic);
    keys[i] = key;
  }

  const songs: SetlistNumber[] = [];
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]!;
    const { style, mood } = picks[i]!;
    const { tonic, mode } = keys[i]!;

    /**
     * Built as a value rather than passed inline, because it is kept.
     *
     * `SetlistNumber.recipe` is the only record of what this song was asked
     * for, and it has to be the *identical object* that was handed to
     * `generateSong` — a recipe reassembled later from the result is exactly
     * the mistake this replaced.
     */
    const recipe: GenerateOptions = {
      // A number's seed says which show it belongs to and where in it. That is
      // worth more than opacity: a bug report can name `abc/3` and be exact.
      seed: `${seed}/${i + 1}`,
      genre: genre.id,
      era: era.id,
      style: style.id,
      mood: mood.id,
      tonic,
      mode,
      strictness: rng.weighted(CONCERT_SMOOTHNESS),
      vocals: slot.sung,
      targetSeconds: shortest + (longest - shortest) * slot.length + rng.float(-8, 8),
      /**
       * …and a different band from everywhere, on every number, if the caller
       * asked for one. See `ConcertOptions.chaos`.
       *
       * Handed down rather than drawn here, and it costs this file no random
       * number: each chimera is assembled from the number's own seed, on a
       * stream nothing else reads, so an evening with chaos on plays **the same
       * repertoire, in the same keys, in the same moods, in the same room** as
       * the evening with it off. Genre is still not an axis of this setlist —
       * the crossing happens inside a number.
       *
       * Lengths and tempos do move, from `figures` up, and that is the feature
       * rather than a leak: a chimera narrows its tempo band to what every band
       * that wrote a figure in it can play, and the form is fitted to the target
       * seconds at whatever speed comes out. See `compatible` in `genre/chaos.ts`.
       */
      ...(opts.chaos ? { chaos: opts.chaos } : {}),
    };
    songs.push({ song: generateSong(recipe), recipe });
  }

  // No reordering pass. There used to be one — `chooseTempo` jitters by up to a
  // quarter of the style's band, so a number planned as the ballad could come
  // out faster than its neighbour and the swap cost nothing. With no plan for it
  // to violate, the order the styles were shuffled into is the order they play.
  return songs;
}

/**
 * How long a concert number is allowed to run, as opposed to a radio track.
 *
 * The genre's own band is the floor and most of the ceiling, but the top of it
 * gets pulled in: **a set is not an album.** Length is the least interesting way
 * to make a number feel big — the key change, the last chorus and the follow
 * spot all do it better and none of them costs the audience another ninety
 * seconds.
 *
 * Ambient is the case this exists for, at 190–340 seconds against iskelmä's
 * 105–185. Five ambient numbers at the top of that band is a half-hour show,
 * and a stage full of people you are meant to be throwing tomatoes at is not
 * where a listener wants a half-hour show. Capping the *spread* rather than the
 * ceiling leaves each genre its own floor, which is the part that carries the
 * idiom: a drone needs its four minutes and gets them.
 *
 * The generator only ever grows a form to reach a target and never shrinks one
 * below its template, so this is an upper bound on ambition rather than a
 * promise. Ambient numbers still overrun it, by design of `buildForm`.
 */
function concertLengths(genre: Genre): [number, number] {
  const [lo, hi] = genre.duration;
  return [lo, Math.min(hi, lo + 80)];
}

function lookupEra(genre: Genre, id: string): EraProfile {
  const era = genre.eras[id];
  if (!era) {
    throw new Error(
      `Unknown era "${id}" for genre "${genre.id}". Known: ${Object.keys(genre.eras).join(', ')}`,
    );
  }
  return era;
}
