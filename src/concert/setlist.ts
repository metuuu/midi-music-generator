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
 * ## Programming to an arc rather than sorting afterwards
 *
 * The obvious implementation is to generate six songs, score them, keep four
 * and sort them by tempo. It is also the wrong one — it wastes most of the
 * generation, and it can only order what it happened to be given, so a set with
 * no slow number in it stays a set with no slow number in it.
 *
 * Instead the arc is decided first — strong opener, something slower third, the
 * biggest number last — and each slot is *filled to spec*. The style and mood
 * tables already carry everything needed to hit a target: `Style.bpm` and
 * `Mood.tempo` say how fast a pairing runs, `EraProfile.styleWeights` says
 * whether this band would play it at all, and `Mood.styleBias` says whether the
 * two belong together. Asking for "the slowest thing this band plays that it has
 * not played yet" is a weighted draw over that table, and it always succeeds.
 *
 * A short reordering pass afterwards catches the residue — the generator jitters
 * the tempo it was asked for, so occasionally the ballad is not the slowest
 * thing on the bill. It only ever permutes the middle of the set, because the
 * opener and the closer are the two positions where the plan is load-bearing.
 *
 * ## Contrast is the whole point
 *
 * Four axes, and they are enforced rather than hoped for:
 *
 *  - **tempo**, by construction — the slot's target energy drives the draw;
 *  - **style**, by exclusion — a style already used is heavily penalised, so a
 *    tango follows a humppa rather than another tango;
 *  - **mood**, likewise, more gently — moods overlap more than styles do;
 *  - **key**, by exclusion — every number is in a different key. A band that
 *    plays four numbers in A minor sounds like one long number, and this is the
 *    axis an audience notices without being able to name.
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
// The arc
// ---------------------------------------------------------------------------

type Role = 'opener' | 'middle' | 'slow' | 'closer';

interface Slot {
  role: Role;
  /**
   * Where this number should sit on the genre's own speed range: 0 is the
   * slowest, stillest thing this band plays, 1 is the fastest. Relative on
   * purpose — an ambient concert has an arc too, and it is not measured in the
   * same BPM as a humppa.
   */
  energy: number;
  /** Where in the genre's length band this number sits, 0..1. */
  length: number;
  sung: boolean;
}

/**
 * The shape of a set, in slots.
 *
 * Open strong — the first number's job is to get the room's attention, and it
 * is also the number playing while the audience is still deciding whether to
 * watch. Put the slow one third, or as close to third as the set length allows:
 * early enough that the room has not settled into one tempo, late enough that
 * it has earned the change. Finish with the biggest thing on the bill, which is
 * the one rule of set construction that no one argues about.
 *
 * The middles are the flexible part and they are deliberately not identical —
 * two numbers at the same energy either side of the ballad would make the arc
 * read as a dip rather than as a shape.
 */
function planSlots(count: number, sung: boolean[]): Slot[] {
  // With three numbers "third" is the closer, so the slow one moves to second.
  const slowAt = count >= 3 ? Math.min(2, count - 2) : -1;
  const slots: Slot[] = [];
  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    const role: Role = i === 0 ? 'opener' : isLast ? 'closer' : i === slowAt ? 'slow' : 'middle';
    slots.push({
      role,
      energy: role === 'opener' ? 0.78
        : role === 'closer' ? 0.95
          : role === 'slow' ? 0.08
            // Middles alternate around the centre so the set breathes rather
            // than sitting at one speed between its landmarks.
            : i < slowAt ? 0.52 : 0.66,
      length: role === 'closer' ? 0.72
        : role === 'slow' ? 0.52   // a ballad is allowed to take its time
          : role === 'opener' ? 0.3
            : 0.42,
      sung: sung[i] ?? false,
    });
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
// Filling a slot
// ---------------------------------------------------------------------------

interface Pairing {
  style: Style;
  mood: Mood;
  /** Style weight in this era times mood affinity. 0 means "not this band". */
  affinity: number;
  /** Felt speed, normalised across everything this band could play, 0..1. */
  energy: number;
}

/**
 * How fast a style/mood pairing *feels*, in bars per minute.
 *
 * Two decisions in one small function, both of which matter.
 *
 * It mirrors `chooseTempo` in `generate/song.ts` minus the jitter, so the
 * target this file aims at is the tempo the generator will actually produce.
 * Duplicating four lines is worth more than exporting them would be: if the
 * tempo rule changes, the arc should be re-derived deliberately rather than
 * silently following.
 *
 * And it divides by `beatsPerBar`, which is the part that is easy to get wrong.
 * A valssi at 170 BPM is three beats to a bar and a humppa at 150 is four, so
 * by the beat the valssi looks half again as fast — while on the floor they are
 * both a brisk dance and the valssi is the one you can talk over. Bars per
 * minute is what a body feels; beats per minute is what a metronome counts.
 */
function feltTempo(style: Style, mood: Mood, era: EraProfile): number {
  const [lo, hi] = style.bpm;
  const mid = (lo + hi) / 2;
  const half = (hi - lo) / 2;
  const bpm = clamp((mid + mood.tempo * half) * era.tempoScale, lo, hi);
  return bpm / style.beatsPerBar;
}

/**
 * Everything this band could plausibly play tonight, with its speed normalised.
 *
 * Normalising against the genre's own spread rather than against absolute BPM
 * is what lets one arc serve all three genres. An ambient set's "biggest number
 * last" is a kosmische sequence at 114, and its ballad is a drone at 52; the
 * slots ask for 0.95 and 0.08 in both cases and get the right answer in both.
 */
function pairings(genre: Genre, era: EraProfile): Pairing[] {
  const moods = Object.values(genre.moods);
  const raw: { style: Style; mood: Mood; affinity: number; felt: number }[] = [];
  for (const style of Object.values(genre.styles)) {
    const eraWeight = era.styleWeights[style.id] ?? 0;
    // An era that gives a style zero is saying the band does not know it —
    // there were no iskelmäpop numbers at a 1968 tanssilava.
    if (eraWeight <= 0) continue;
    for (const mood of moods) {
      raw.push({
        style,
        mood,
        affinity: eraWeight * (mood.styleBias[style.id] ?? 1),
        felt: feltTempo(style, mood, era),
      });
    }
  }
  if (!raw.length) throw new Error(`No style is playable in era "${era.id}"`);

  let lo = Infinity;
  let hi = -Infinity;
  for (const p of raw) {
    if (p.felt < lo) lo = p.felt;
    if (p.felt > hi) hi = p.felt;
  }
  const span = Math.max(hi - lo, 1e-6);
  return raw.map(({ style, mood, affinity, felt }) => ({
    style, mood, affinity, energy: (felt - lo) / span,
  }));
}

/**
 * Draw a style and mood for one slot.
 *
 * Weighted rather than greedy. Greedy would give the same opener every time a
 * given band plays, because the best-fitting pairing for "fast and bright" is a
 * property of the tables and not of the seed — and a concert whose programme is
 * a function of its genre is not worth generating twice. The fit is raised to a
 * power instead, which keeps the draw firmly in the right part of the range
 * while leaving the second and third choices reachable.
 *
 * The repeat penalties are the contrast rule, and they are penalties rather
 * than exclusions on purpose: a five-number set in an era that only knows four
 * styles has to repeat one, and repeating one is better than throwing.
 *
 * The style penalty is severe — a fortieth — because the ends of the energy
 * range are frequently owned by one style and a mild penalty loses to that.
 * Iskelmä is the case: on bars per minute the valssi is *far* faster than
 * anything else the genre has, so "the biggest number last" asks for a valssi,
 * and asks again for the opener, and a set that bookends itself with two
 * waltzes has thrown away its best contrast to gain a few BPM. Better a humppa
 * that is a shade slower than the plan wanted than a second waltz.
 */
function drawPairing(
  all: Pairing[], want: number, usedStyles: Set<string>, usedMoods: Set<string>, rng: Rng,
): Pairing {
  const weights = all.map((p) => {
    const fit = Math.max(1 - Math.abs(p.energy - want), 0.02);
    let w = p.affinity * fit * fit * fit;
    if (usedStyles.has(p.style.id)) w *= 0.025;
    if (usedMoods.has(p.mood.id)) w *= 0.25;
    return [p, w] as const;
  });
  return rng.weighted(weights);
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
   * Not "the arc with one slot" — there is no arc, no draw, no contrast to
   * enforce and no key to keep clear of, because all four are properties of a
   * *sequence* and this is one piece of music. Every table below stays out of
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
  const slots = planSlots(count, planVocals(count, opts.vocals ?? 'mixed', rng));

  const catalogue = pairings(genre, era);
  const usedStyles = new Set<string>();
  const usedMoods = new Set<string>();
  const usedKeys = new Set<Pc>();
  const [shortest, longest] = concertLengths(genre);

  const songs: Song[] = [];
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]!;
    const { style, mood } = drawPairing(catalogue, slot.energy, usedStyles, usedMoods, rng);
    usedStyles.add(style.id);
    usedMoods.add(mood.id);
    const { tonic, mode } = drawKey(genre, style, mood, usedKeys, rng);
    usedKeys.add(tonic);

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

  return settle(songs, slots);
}

/**
 * The reordering pass, which almost never has anything to do.
 *
 * `chooseTempo` jitters by up to a quarter of the style's band, so a number
 * planned as the ballad can come out faster than the number planned to sit
 * beside it. When that happens the arc is wrong in the one place an audience
 * would feel it, and the fix costs a swap.
 *
 * Only the middle of the set moves. The opener and the closer were chosen for
 * their positions and a set that reorders them has lost the plot — better a
 * slightly flat middle than a concert that ends on its quietest number.
 */
function settle(songs: Song[], slots: Slot[]): Song[] {
  const slowAt = slots.findIndex((s) => s.role === 'slow');
  if (slowAt < 0) return songs;

  const middles: number[] = [];
  for (let i = 1; i < songs.length - 1; i++) middles.push(i);
  if (middles.length < 2) return songs;

  const felt = (i: number): number => {
    const m = songs[i]!.meta;
    return m.bpm / m.beatsPerBar;
  };
  let slowest = middles[0]!;
  for (const i of middles) if (felt(i) < felt(slowest)) slowest = i;
  if (slowest !== slowAt) {
    const a = songs[slowAt]!;
    songs[slowAt] = songs[slowest]!;
    songs[slowest] = a;
  }
  return songs;
}

/**
 * How long a concert number is allowed to run, as opposed to a radio track.
 *
 * The genre's own band is the floor and most of the ceiling, but the top of it
 * gets pulled in: **a set is not an album.** The closer is the biggest number
 * on the bill, not the longest one, and length is the least interesting way to
 * make a number feel big — the key change, the last chorus and the follow spot
 * all do it better and none of them costs the audience another ninety seconds.
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

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
