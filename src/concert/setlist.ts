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
import { generateSong } from '../generate/song.js';
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
 * Which numbers are sung.
 *
 * `mixed` is the default and means roughly a third — one of three or four, two
 * of five — and **never the opener**. Two reasons, and the second is the real
 * one: a set that opens with the singer has nowhere to go when they walk off,
 * and the band is more interesting to look at first. `instrumental` is a
 * first-class mode rather than a degraded one; most of this repertoire is
 * instrumental and the staging, the lighting and the bill all have to work with
 * no singer present.
 *
 * The voice stays wordless — vowels and manner-of-articulation consonants, no
 * language. That is a property of `generate/vocals.ts` and this file does not
 * get a vote, which is exactly how it should stay.
 */
function planVocals(count: number, policy: VocalPolicy, rng: Rng): boolean[] {
  if (policy === 'instrumental') return new Array<boolean>(count).fill(false);
  if (policy === 'sung') return new Array<boolean>(count).fill(true);

  const sung = new Array<boolean>(count).fill(false);
  // Eligible = everything but the opener. A one-number set therefore has no
  // sung number under `mixed`, which is right: it is a soundcheck.
  const eligible: number[] = [];
  for (let i = 1; i < count; i++) eligible.push(i);
  const wanted = Math.min(Math.max(1, Math.round(count / 3)), eligible.length);
  for (const i of rng.shuffle(eligible).slice(0, wanted)) sung[i] = true;
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
 * Pick and order the numbers for one concert.
 *
 * Deterministic: the same options give byte-identical songs, and each number's
 * own seed is derived from the concert's, so `song.meta.seed` alone identifies
 * a number within a show. Everything else in `src/concert/` keys off these
 * songs, so this is the first thing that runs and the only thing that decides
 * what the evening consists of.
 */
export function buildSetlist(opts: ConcertOptions = {}): Song[] {
  /**
   * A number the caller already chose skips everything below.
   *
   * Not "the set with one slot" — there is no repertoire to cover, no contrast
   * to enforce and no key to keep clear of, because all three are properties of
   * a *sequence* and this is one piece of music. Every table below stays out of
   * it: the song is generated from exactly the options handed in, so it is the
   * same song those options produce anywhere else, note for note.
   */
  if (opts.song) return [generateSong(opts.song)];

  const seed = String(opts.seed ?? Math.floor(Math.random() * 1e9));
  // Its own stream, so the cast, the venue and the lighting can share the
  // concert seed without any of them shifting when another one changes.
  const rng = new Rng(`${seed}:setlist`);

  const genre = getGenre(opts.genre ?? rng.pick(GENRE_IDS));
  // One era for the set. Every visual system downstream — clothes, fixtures,
  // the paper the bill is printed on — takes the era as a single fact about the
  // evening, and a band that plays 1968 and then 1985 has no era at all.
  const era = opts.era
    ? lookupEra(genre, opts.era)
    : genre.eras[rng.pick(Object.keys(genre.eras))]!;

  const count = opts.numbers === undefined
    ? planCount(genre, rng)
    : Math.max(1, Math.min(6, Math.round(opts.numbers)));
  const slots = planSlots(count, planVocals(count, opts.vocals ?? 'mixed', rng), rng);

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

  const songs: Song[] = [];
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]!;
    const { style, mood } = picks[i]!;
    const { tonic, mode } = keys[i]!;

    songs.push(generateSong({
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
    }));
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
