/**
 * The stations — what a listener tunes to.
 *
 * `concert/setlist.ts` is the precedent and the contrast. The generator writes
 * songs one at a time and has no notion of what comes next, so anything that
 * wants a *sequence* has to decide that for itself. A concert decides it as a
 * programme — contrast enforced along three axes, an evening with a shape. A
 * station decides it as a **promise**, which is weaker and is meant to be: not
 * what the next record is, but how far it is allowed to be from this one.
 *
 * Nothing here is browser-facing and nothing here imports Strudel, which is
 * deliberate — see the README's licence note. This is a table and a draw.
 *
 * ## Why this is not the genre dropdown with better styling
 *
 * Nineteen stations, one per genre, would be exactly that, and it would also be
 * the wrong cut. Four of the nine below draw from more than one genre, along
 * two different seams, and neither seam is a column in any table in `genre/`.
 *
 *  - **A mood.** `longwave` and `lateshift`: `ambient/drone`, `synth/stalker`
 *    and `classical/nocturne` are three genres' idea of the same hour of the
 *    night, and nothing in `genre/` can say so.
 *  - **A date.** `eightyfive` and `pirate`: an `EraProfile` decides the
 *    production rather than the notes — which drum machine, which instruments
 *    take the melody — so a station that selects on era selects exactly the
 *    thing a listener hears as "1985" or "1994". Six genres' 1980s share a
 *    LinnDrum and a gated snare across repertoires that share nothing else.
 *
 * That cross-cut is the whole argument for the file. A station that could be
 * expressed as `--genre x` did not need inventing — which is why the iskelmä
 * station that used to sit at the top of this list is gone. It was
 * `--genre iskelma --era tanssilava` with a nicer name; that era now reaches
 * the dial the way every other single-genre corner does, through `borderfm`
 * and through the main app.
 *
 * ## Nothing here is prose
 *
 * A station has an id, a name, and the tables it draws from. What the page
 * shows under a station's name is `sourceLabel` — the genres it actually
 * contains, derived from the entry rather than written about it. A description
 * would be a second copy of the table, in adjectives, going stale.
 *
 * ## What `wander` may and may not touch
 *
 * One slider, and it moves exactly two things: the hook level, by up to one
 * step either side of what the station declares, and how much the band is
 * borrowed from elsewhere. Both are *sameness*.
 *
 * It deliberately does **not** touch strictness. The README is emphatic that
 * the two axes are independent — smoothness asks whether a note is wrong, hook
 * asks whether it is familiar — and a single control wired to both would be a
 * control that means neither. A listener who wants more surprise has not asked
 * for more wrong notes.
 */

import { Rng } from './core/rng.js';
import { DEFAULT_SUNG_CHANCE, SUNG_CHANCE } from './concert/setlist.js';
import type { GenerateOptions } from './generate/song.js';
import { HOOK_LEVELS, type HookId } from './generate/hook.js';
import type { ChaosLevel } from './genre/chaos.js';
import { GENRE_IDS, getGenre } from './genre/index.js';

/** One genre's contribution to a station, narrowed to the part that fits. */
export interface StationSource {
  genre: string;
  /** Styles this station takes. All of the genre's when omitted. */
  styles?: readonly string[];
  eras?: readonly string[];
  moods?: readonly string[];
  /** Weight against this station's other sources. 1 when omitted. */
  weight?: number;
}

export interface Station {
  id: string;
  name: string;
  sources: readonly StationSource[];
  /** Where this station sits before the slider moves it. */
  hook: HookId;
  /**
   * Target length per record, in seconds, drawn inside the range. Omitted lets
   * the form come out at whatever length it wants, which is right for most of
   * them and wrong for the ones that are about duration.
   */
  seconds?: readonly [number, number];
  /**
   * Share of records that are sung when the listener has asked for a mix,
   * overriding the genre's own rate. Ignored under the other two policies —
   * see `VoicePolicy`.
   */
  sung?: number;
  /** Chaos this station always runs. `wander` scales it; it never turns it off. */
  chaos?: { levels: readonly ChaosLevel[]; spread: number };
}

/**
 * Nine, and the count is a judgement rather than a limit.
 *
 * Few enough that each one can be given a character instead of a filter. The
 * catalogue has 389 styles; a station list that tried to represent them would
 * be the `--help` output.
 *
 * It was eight, and eight was the number that fitted a phone without
 * scrolling. The ninth costs one row of the grid and no more: `radio.html`
 * lays the list out at `minmax(8.5rem, 1fr)`, which is four columns in the
 * 40 rem desktop panel and two in the phone sheet, so eight is 2 rows and 4,
 * nine is 3 and 5 — and a tenth would be free, since both counts round to the
 * same row. The sheet has been `overflow-y: auto` since it was written.
 *
 * The first entry is the one a listener hears before touching anything —
 * `radio.ts` opens on `STATIONS[0]` — so it is the most immediately legible
 * station rather than the most interesting one.
 *
 * Typed as a non-empty tuple rather than an array, so "the dial always has
 * something on it" is a fact the compiler holds rather than a `!` at each of
 * the two places that reach for the first one.
 */
export const STATIONS: readonly [Station, ...Station[]] = [
  {
    /**
     * The decade as a production, which is the one thing an era table is for.
     *
     * Named for a year rather than a sound because the sound is the argument:
     * six repertoires that agree about almost nothing agree about the drum
     * machine. What holds `metal/nwobhm` and `iskelma/eighties` on one station
     * is not a mood — it is that both were recorded through the same gate.
     *
     * **This is not Neon.** Neon is the eighties Roland made — `polysynth`,
     * `digital`, and the revival that quotes them — and there is deliberately
     * no synth source here at all. This is the half Neon cannot play: guitars,
     * horns, and a drummer competing with a LinnDrum. Between them they cover
     * the decade; either one alone reads as a wrong summary of it.
     *
     * Weights put rock and pop at 3 each and let `metal` in at 1 in 11. That
     * is the `darksynth` argument from `longwave` below, applied to a station
     * this side of the dial: the one number that wakes the listener up has to
     * be rare enough to still be a surprise on the fourth record.
     */
    id: 'eightyfive',
    name: '1985',
    hook: 'catchy',
    /**
     * Wide, because a station of *records* is what this is and the decade
     * disagreed about how long one runs. An arena ballad and a twelve-inch
     * electro edit are both here, and both are longer than the three-minute
     * single `heavyrotation` is built around.
     */
    seconds: [180, 280],
    sung: 0.45,
    sources: [
      {
        genre: 'rock',
        styles: ['arena', 'ballad', 'newwave', 'postpunk', 'glam', 'hard'],
        eras: ['arena'],
        moods: ['swagger', 'epic', 'bright', 'wistful'],
        weight: 3,
      },
      /**
       * The five pop styles the `gated` era weights highest, and *none* of the
       * nine on `heavyrotation`.
       *
       * The overlap you would expect between an eighties station and the
       * singles station is not there, and it is not luck: `heavyrotation` is
       * organised by what a chart record is — girl group, bubblegum, teen,
       * dancepop — and holds those across three eras. `stadium`,
       * `newromantic`, `hinrg` and `jangle` are organised by a year, they are
       * weighted 7 to 9 in `gated` alone, and nothing else on the dial plays
       * them.
       */
      {
        genre: 'pop',
        styles: ['stadium', 'newromantic', 'hinrg', 'jangle', 'dreampop'],
        eras: ['gated'],
        moods: ['single', 'floor', 'heartbreak', 'latenight'],
        weight: 3,
      },
      /**
       * Two eras rather than one, and they are four years and one machine
       * apart: `boogie` (1980) is still a band with a slap bass in it,
       * `electro` (1984) is a drum machine with a band standing behind it.
       * Both weight `minneapolis` and `talkbox` high, which is what makes the
       * pair one source instead of two.
       */
      {
        genre: 'funk',
        styles: ['boogie', 'slap', 'minneapolis', 'talkbox', 'electro', 'gogo'],
        eras: ['boogie', 'electro'],
        moods: ['strut', 'slink', 'cosmic'],
        weight: 2,
      },
      {
        genre: 'metal',
        styles: ['nwobhm', 'speed', 'glam', 'power'],
        eras: ['nwobhm'],
        moods: ['epic', 'soaring', 'swagger'],
        weight: 1,
      },
      /**
       * What is left of the station this one replaced, and the better half of
       * it. The pavilion era was a genre filter wearing a station's name; the
       * eighties era is a Finnish record made on the same LinnDrum as
       * everything else here, which is an argument for putting it beside them
       * rather than on a shelf of its own.
       */
      {
        genre: 'iskelma',
        styles: ['iskelmapop', 'tango', 'valssi'],
        eras: ['eighties'],
        moods: ['dramaattinen', 'haikea', 'tanssittava', 'romanttinen'],
        weight: 1,
      },
      /**
       * 1980, and the only era in the genre that belongs here. `lateshift`
       * plays `golden` and `modern`; `parkjam` weights `oldschool`, `breaks`
       * and `party` at 8 and 9 and is a different music — a break, a bassline
       * and a microphone, which is closer to the `electro` entry above than to
       * anything on the other station.
       */
      {
        genre: 'hiphop',
        styles: ['oldschool', 'electrorap', 'breaks', 'party'],
        eras: ['parkjam'],
        moods: ['trunk', 'hard', 'dusty'],
        weight: 1,
      },
    ],
  },
  {
    id: 'nightjazz',
    name: 'Night Jazz',
    hook: 'loose',
    seconds: [200, 330],
    sources: [{
      genre: 'jazz',
      styles: ['ballad', 'trio', 'bossa', 'modal', 'swing'],
      eras: ['swingera', 'bop', 'modern'],
      moods: ['smoky', 'cool', 'dreamy', 'bluesy'],
    }],
  },
  {
    /**
     * The one that is meant to be left on for hours, and the reason `seconds`
     * exists on a `Station` at all: three to five minutes is a record, and this
     * station is not playing records.
     */
    id: 'longwave',
    name: 'Long Wave',
    hook: 'loose',
    seconds: [300, 480],
    sources: [
      { genre: 'ambient', moods: ['warm', 'weightless', 'submerged', 'sacred'], weight: 3 },
      {
        genre: 'synth',
        styles: ['cinematic', 'stalker', 'cosmic'],
        moods: ['cosmos', 'neutral'],
        weight: 2,
      },
      /**
       * `darksynth` is on a station about long, slow, wide records, and it is
       * the fastest style in its genre. It is here because this station's other
       * synth entry is `cinematic` and `stalker` — the film-score half — and the
       * modern horror-synth records are the same repertoire made thirty years
       * later by people who say so on the sleeve. Its own weight is 1 against
       * that entry's 2, and `dread` is the only mood it is offered under, so it
       * arrives as the one number that wakes the listener up.
       */
      {
        genre: 'synth',
        styles: ['darksynth'],
        eras: ['retrowave'],
        moods: ['dread'],
        weight: 1,
      },
      {
        genre: 'classical',
        styles: ['nocturne', 'adagio', 'berceuse', 'prelude', 'barcarolle'],
        eras: ['romantic', 'impressionist'],
        moods: ['tranquillo', 'misterioso', 'cantabile'],
      },
    ],
  },
  {
    id: 'neon',
    name: 'Neon',
    hook: 'standard',
    /**
     * Declared because the two halves disagree about length, not because the
     * station is about duration. Left free, the draw ran 3.1 minutes at the
     * tenth percentile and 9.2 at the top — a Detroit track and then a Berlin
     * piece three times its length, inside one station.
     */
    seconds: [220, 400],
    sources: [
      {
        genre: 'synth',
        styles: ['berlin', 'machine', 'optical', 'cosmic'],
        eras: ['polysynth', 'digital'],
        moods: ['neon', 'motorway', 'cosmos', 'dread'],
        weight: 2,
      },
      /**
       * The revival, as its own entry rather than as three more names in the
       * list above — and the split is structural rather than tidy.
       *
       * `recordOptions` draws `style` and `era` from **independent** picks, so a
       * source listing six styles and three eras offers all eighteen pairings
       * whatever the genre's `styleWeights` say. Adding `outrun` to the entry
       * above would therefore have produced a night-drive record dated 1981,
       * which is the one thing `synth/eras.ts` refuses in as many words: those
       * three styles are weighted 0 in every vintage era because a weight there
       * *"would not stage an unusual evening, it would print a wrong date."*
       * Two entries make the pairing exact.
       *
       * `darksynth` is not here. It is on Long Wave above, beside `stalker`, for
       * the reason that station's own entry gives — a hundred and forty with a
       * distorted guitar on it is a different room from this one.
       */
      {
        genre: 'synth',
        styles: ['outrun', 'boulevard'],
        eras: ['retrowave'],
        moods: ['neon', 'motorway'],
        weight: 2,
      },
      {
        genre: 'house',
        styles: ['detroit', 'dubtechno', 'deep', 'microhouse', 'ambienthouse'],
        eras: ['superclub', 'afterhours'],
        moods: ['dark', 'warmup', 'neutral'],
      },
    ],
  },
  {
    /**
     * The other date cut, and the only breakbeat on the dial.
     *
     * 1993 to 1995 in three genres, which is the same construction as
     * `eightyfive` above at a quarter of the width: a `dubplate` dnb record, a
     * `rave` house record and a `sampler` ambient record are one scene's three
     * rooms — the pirate signal, the club it advertised, and the record you
     * put on after it.
     *
     * ## No neurofunk
     *
     * The obvious sibling of this station is the one that plays `studio` and
     * `design`, and it is a different station, which the era tables say
     * plainly. `jungle` and `ragga` are weighted 9 in `dubplate` and 3 in
     * `studio`; `neurofunk` is 2 and 9. Seven years, and the moods invert with
     * them — `wheelup` and `roughneck` here, `darkside` and `deepend` there.
     * Putting both on one station would be `arena` and `warehouse` on one
     * eighties station, which is the mistake `eightyfive` was built to avoid.
     *
     * It is also not a station this file could justify on its own terms.
     * `--genre dnb --era studio` is one source, one genre, one era: the shape
     * of the iskelmä station that came off the dial to make room for these
     * two. Neurofunk is better served as a dark corner of `neon`, which
     * already owns `machine`, `dubtechno` and `dread`.
     */
    id: 'pirate',
    name: 'Pirate',
    /**
     * `loose`, and it is the only setting that fits. A jungle record's hook is
     * a bassline and an edit; asking the hook table for a chorus you recognise
     * would be asking this repertoire for the one thing it is not doing.
     */
    hook: 'loose',
    seconds: [240, 360],
    sources: [
      {
        genre: 'dnb',
        styles: ['jungle', 'ragga', 'hardstep', 'jazzstep', 'atmospheric', 'drumfunk', 'dubwise'],
        eras: ['dubplate'],
        moods: ['wheelup', 'roughneck', 'deepend'],
        weight: 3,
      },
      /**
       * The rave end of the genre, not the club end. `neon` takes `superclub`
       * and `afterhours` and the styles that go with them; this takes `rave`,
       * where `bleep` and `ghetto` and `hardhouse` are weighted 6 to 8 and the
       * records were being cut for the same sound systems as the entry above.
       */
      {
        genre: 'house',
        styles: ['bleep', 'ghetto', 'hardhouse', 'acid', 'piano', 'garage'],
        eras: ['rave'],
        moods: ['peak', 'euphoria', 'dark'],
        weight: 2,
      },
      /**
       * One record in six, and it is the comedown. `longwave` takes ambient's
       * warm and weightless corner; this takes `wasteland` and `aquatic` out
       * of the same 1993 sampler the breaks above were chopped on.
       */
      {
        genre: 'ambient',
        styles: ['wasteland', 'aquatic', 'hauntology', 'drone'],
        eras: ['sampler'],
        moods: ['submerged', 'bleak', 'weightless'],
        weight: 1,
      },
    ],
  },
  {
    id: 'heavyrotation',
    name: 'Heavy Rotation',
    hook: 'earworm',
    seconds: [150, 210],
    sung: 0.40,
    sources: [{
      genre: 'pop',
      styles: [
        'girlgroup', 'powerpop', 'synthpop', 'dancepop', 'europop', 'teen',
        'discopop', 'bubblegum', 'citypop',
      ],
      eras: ['multitrack', 'gated', 'sidechain'],
      moods: ['single', 'summer', 'floor', 'heartbreak'],
    }],
  },
  {
    id: 'dancehall',
    name: 'The Dancehall',
    hook: 'catchy',
    sources: [{
      genre: 'reggae',
      styles: ['rocksteady', 'onedrop', 'rockers', 'steppers', 'roots', 'dub', 'lovers', 'rubadub', 'slengteng', 'dancehall'],
      eras: ['rocksteady', 'roots', 'digital'],
      moods: ['conscious', 'sweet', 'easy', 'echo', 'jump'],
    }],
  },
  {
    id: 'lateshift',
    name: 'Late Shift',
    hook: 'standard',
    sources: [
      {
        genre: 'hiphop',
        styles: ['lofi', 'jazzrap', 'boombap', 'soulloop', 'abstract'],
        eras: ['golden', 'modern'],
        moods: ['dusty', 'hazy'],
      },
      {
        genre: 'rnb',
        styles: ['quietstorm', 'neosoul', 'slowjam', 'bedroom'],
        eras: ['newjack', 'neo'],
        moods: ['smoulder', 'ache', 'sweet'],
      },
    ],
  },
  {
    /**
     * All nineteen, with the band borrowed from all nineteen on top of that.
     *
     * The host genre still keeps the bar, the room and the form — that is what
     * `chaos` means and why this is a station rather than noise — but who is
     * playing and what figures they play come from somewhere else.
     */
    id: 'borderfm',
    name: 'Border FM',
    hook: 'standard',
    chaos: { levels: ['band', 'performance', 'figures'], spread: 0.6 },
    sources: GENRE_IDS.map((genre) => ({ genre })),
  },
];

export function getStation(id: string): Station | undefined {
  return STATIONS.find((s) => s.id === id);
}

/**
 * What a station contains, in genre labels, for the line under its name.
 *
 * Derived rather than written, so it cannot disagree with the table above. A
 * station drawing from more than three genres is counted instead of named,
 * because naming six of them would be a paragraph in a card 8.5 rem wide.
 *
 * The count is the *station's* and not the catalogue's, which it was not
 * always. This used to answer `all 19 genres` to anything above three, on the
 * assumption that only `borderfm` would ever be above three; `eightyfive`
 * draws six and would have announced nineteen. "All" is now a claim the
 * function only makes when it is true.
 */
export function sourceLabel(station: Station): string {
  /**
   * Distinct *genres*, not source entries.
   *
   * A station may list one genre twice to offer two of its corners under
   * different weights — `neon` splits synth into the period records and the
   * revival, `longwave` splits it into the film-score half and `darksynth`.
   * Counting entries made `neon` read "Synth · Synth · House" and tipped
   * `longwave` over the limit into "all 19 genres", which was simply untrue.
   */
  const genres = [...new Set(station.sources.map((s) => s.genre))];
  if (genres.length === GENRE_IDS.length) return `all ${GENRE_IDS.length} genres`;
  if (genres.length > 3) return `${genres.length} genres`;
  return genres.map((id) => getGenre(id).label).join(' · ');
}

/**
 * Whether records are sung, as a listener's standing preference.
 *
 * Instrumental by default. The generator draws `vocals` from its own RNG
 * stream, so the instrumental arrangement is identical either way — which is
 * what lets this sit outside the record's reference string. A kept record
 * played back under a different policy is the same arrangement with or without
 * the voice on top, rather than a different record.
 */
export type VoicePolicy = 'instrumental' | 'mixed' | 'sung';

/** Where the slider sits until somebody moves it. */
export const DEFAULT_WANDER = 0.5;

/**
 * Above this the band starts being borrowed; below it, nothing is.
 *
 * Slightly above the middle rather than at it, so the default position is
 * unambiguously "this station, as described".
 */
const CHAOS_FROM = 0.55;

/**
 * A whole record from one string.
 *
 * Everything that distinguishes this record from the next one on the same
 * station — which genre it came from, which style, which era, which mood, how
 * long it runs, and the seed the generator itself draws on — comes out of
 * `token`. So a record is reproducible from `(station, wander, token)`, which
 * is what lets the page hand somebody a link to a song that does not exist
 * anywhere.
 *
 * The station and the wander are folded into the seed rather than left out of
 * it: the same token on two stations should be two records, not one record
 * filed twice.
 */
export function recordOptions(
  station: Station,
  wander: number,
  token: string,
  voice: VoicePolicy = 'instrumental',
): GenerateOptions {
  const rng = new Rng(`${station.id}:${wander.toFixed(2)}:${token}`);

  const source = rng.weightedBy(station.sources, (s) => s.weight ?? 1);
  const genre = getGenre(source.genre);

  const opts: GenerateOptions = {
    seed: `${station.id}:${token}`,
    genre: genre.id,
    style: rng.pick(source.styles ?? Object.keys(genre.styles)),
    era: rng.pick(source.eras ?? Object.keys(genre.eras)),
    mood: rng.pick(source.moods ?? Object.keys(genre.moods)),
  };

  /**
   * Hook, nudged one step either side of the station's own setting.
   *
   * Clamped rather than wrapped, and small on purpose. The slider's audible
   * work is done by the chaos below; this is the part that acts on a station
   * whose records are already close together, where a step of hook is the
   * difference between a chorus you recognise and one you do not.
   */
  const declared = HOOK_LEVELS.find((l) => l.id === station.hook)?.level ?? 2;
  const level = Math.round(declared + (DEFAULT_WANDER - wander) * 2);
  opts.hook = Math.min(HOOK_LEVELS.length - 1, Math.max(0, level));

  if (station.seconds) opts.targetSeconds = rng.int(station.seconds[0], station.seconds[1]);

  /**
   * The coin is spent whatever the policy says, so that switching the voice
   * setting does not shift the rest of the draw. `planVocals` takes the same
   * care for the same reason: a preference should not be a reroll.
   */
  const mixedWantsIt = rng.chance(station.sung ?? SUNG_CHANCE[genre.id] ?? DEFAULT_SUNG_CHANCE);
  opts.vocals = voice === 'mixed' ? mixedWantsIt : voice === 'sung';

  if (station.chaos) {
    opts.chaos = {
      levels: station.chaos.levels,
      spread: station.chaos.spread * (0.5 + wander * 0.5),
    };
  } else if (wander > CHAOS_FROM) {
    opts.chaos = {
      levels: ['band', 'figures'],
      spread: ((wander - CHAOS_FROM) / (1 - CHAOS_FROM)) * 0.8,
    };
  }

  return opts;
}

/** A fresh record's worth of randomness, short enough to live in a URL. */
export function newToken(): string {
  return Math.random().toString(36).slice(2, 8);
}
