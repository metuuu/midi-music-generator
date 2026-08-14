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
 * ## What a station locks, and what it lets go
 *
 * Nineteen stations, one per genre, would be the dropdown with better styling,
 * and it would also be the wrong cut. The rule underneath every entry below is
 * that **a station locks one or two axes hard and lets the rest float.** Which
 * axes it locks decides what kind of station it is, and there are three kinds —
 * two that work and one that does not.
 *
 *  - **Mood stations** lock a mood and a pace and let genre and date go.
 *    `longwave` spans 1720 to 2006 across three genres and nobody notices,
 *    because everything on it is slow and wide; `lateshift` puts a reggae
 *    `lovers` cut next to a `quietstorm` one, which on a station locked to
 *    rhythm would be an error and here is the point. These are the strongest
 *    entries, because mood and pace are what a listener is actually choosing.
 *    Nobody tunes in wanting 1982; they want something to work to.
 *  - **Sound stations** lock a production or an instrument and let mood go.
 *    `neon` is synthesizers across forty years, `eightyfive` is a gated snare
 *    across six genres, `overdrive` is distortion across three. The thread is
 *    sonic rather than emotional, and the mood range inside them is wide on
 *    purpose.
 *  - **Genre stations** lock the genre and float everything else. These are the
 *    filter, and there are none left. `The Dancehall` was `--genre reggae` and
 *    the iskelmä station was `--genre iskelma --era tanssilava` with a nicer
 *    name; both came off the dial, and their repertoire did not — reggae is now
 *    on three stations, each holding the half that means something there.
 *
 * The corollary is what keeps twelve stations distinct: **no two of them lock
 * the same axis at the same value.** Two stations may share a genre freely, and
 * most do.
 *
 * ## Nobody is stranded
 *
 * All nineteen genres play on a station of their own, and 68 of the catalogue's
 * 73 eras are drawn somewhere. That was not true before `carnival` and `porch`:
 * Latin, Arabic, Indian, Country and Finnish folk — five genres and some 125
 * styles — were reachable only as a 1-in-19 draw on `borderfm`, where the band
 * is borrowed from another genre anyway. A genre that only ever plays in
 * costume is not on the radio.
 *
 * The five eras still unplayed are `iskelma/tanssilava` (retired with its
 * station), `jazz/electric`, `arabic/takht`, `hiphop/southern` and
 * `house/warehouse` — that last one because `rewind` promises 1993 to 1995 and
 * a 1988 Chicago record would be the station keeping its coverage by breaking
 * its word.
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
 * Twelve, and the number is the grid's rather than a judgement.
 *
 * `radio.html` lays the list out at `minmax(8.5rem, 1fr)` in a 37rem panel, so
 * the dial is four columns wide and the count wants to be a multiple of four.
 * Twelve is 4 × 3 on a desktop and 2 × 6 in the phone sheet — measured, and the
 * sheet does not have to scroll to hold them.
 *
 * That constraint is doing real work. It was eight, and eight was chosen as a
 * number that fitted a phone without scrolling — but eight could not hold
 * nineteen genres, and five of them were never played. Letting the grid set the
 * count and then filling it honestly is a better rule than picking a number and
 * discovering afterwards what fell off the end.
 *
 * Nineteen stations, one per genre, is still not the answer — see the header.
 *
 * ## The order is the reading order
 *
 * Three rows of four, and they descend: the ones played by hands, the ones
 * played by machines, and then the small hours. `borderfm` is last because it
 * is the one that is not a promise.
 *
 * The first entry is what a listener hears before touching anything —
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
     * The single, as a *function* rather than as a genre.
     *
     * This entry used to be `--genre pop` across three eras, which is the
     * filter shape the header rejects. What it was reaching for was never pop:
     * it was the three-minute record with a chorus in it, cut to be played on
     * the radio between two others — and four genres were making that record
     * at the same time, in the same rooms, for the same charts.
     *
     * So the lock is `hook: 'earworm'` and a short `seconds`, and the genres
     * follow from it rather than the other way round. Motown and Stax
     * (`rnb/soul`), the Beat era (`rock/beat`) and JB's band in 1968
     * (`funk/jb`) are the same machine pointed at the same week's chart as
     * `pop/twotrack`. None of them is here as a genre; all of them are here as
     * a 45.
     */
    id: 'heavyrotation',
    name: 'Heavy Rotation',
    hook: 'earworm',
    seconds: [150, 210],
    sung: 0.45,
    sources: [
      /**
       * Three eras in one source, which none of the other multi-era entries on
       * the dial can do. `pop/eras.ts` is the one table here that zeroes
       * *nothing* — every style is offered in every era, at a weight — so the
       * usual anachronism split is unnecessary and a `sunshine` record can be
       * dated 1965 or 2010 without the table objecting.
       *
       * The four styles `eightyfive` takes under `gated` — `stadium`,
       * `newromantic`, `hinrg`, `jangle` — are deliberately absent, so the two
       * pop stations never produce the same record.
       */
      {
        genre: 'pop',
        styles: [
          'girlgroup', 'merseybeat', 'brill', 'bubblegum', 'sunshine', 'softrock',
          'discopop', 'powerpop', 'citypop', 'dancepop', 'europop', 'teen', 'electropop',
        ],
        eras: ['twotrack', 'multitrack', 'sidechain'],
        moods: ['single', 'summer', 'floor', 'heartbreak'],
        weight: 4,
      },
      /**
       * Only the styles both eras carry. `soul` and `philly` disagree about
       * half the catalogue in opposite directions — `doowop` is 6 in 1965 and 0
       * in 1974, `discosoul` is 0 and 8 — so the shared spine is what makes one
       * source legal, and the two dates argue about the production instead.
       */
      {
        genre: 'rnb',
        styles: ['motown', 'stax', 'girlgroup', 'crossover', 'gospelsoul', 'funksoul', 'ballad'],
        eras: ['soul', 'philly'],
        moods: ['shout', 'sweet'],
        weight: 3,
      },
      /**
       * 1965, and the only era of the genre that belongs on a singles station.
       * `overdrive` takes `hard` and `alt`; `eightyfive` takes `arena`. The
       * beat era is the one where a rock record *was* a 45 with a chorus, and
       * `rock/beat` zeroes thirteen of its twenty-four styles to say so.
       */
      {
        genre: 'rock',
        styles: ['beat', 'garage', 'surf', 'bluesrock'],
        eras: ['beat'],
        moods: ['bright', 'swagger', 'raw'],
        weight: 2,
      },
      {
        genre: 'funk',
        styles: ['jbshuffle', 'vamp', 'horns', 'memphis', 'deepfunk'],
        eras: ['jb'],
        moods: ['raw', 'strut'],
        weight: 1,
      },
    ],
  },
  {
    /**
     * Brass, hand percussion, and a floor that is outdoors.
     *
     * Four genres, and what they share is an *occasion* rather than a rhythm: a
     * wedding, a street, a saint's day. `latin/salsa`, `reggae/ska`,
     * `arabic/zaffa` and `indian/bhangra` disagree completely about where beat
     * one is and agree completely about what the music is for, which is the
     * mood-station shape the header describes — the lock is the room, and the
     * genres are free to be as far apart as they like inside it.
     *
     * It is also the largest single repair to the dial's coverage. Latin,
     * Arabic and Indian had never played on any station: three genres and 75
     * styles reachable only as a 1-in-19 draw on `borderfm`, where the band is
     * borrowed from somewhere else anyway.
     *
     * Every source here is split by era, because these tables refuse
     * anachronism harder than most on the dial: `reggae/ska` weights all but
     * three of its twenty-one styles at 0, and `latin/conjunto` zeroes
     * `chachacha` and `timba` outright.
     */
    id: 'carnival',
    name: 'Carnival',
    hook: 'catchy',
    seconds: [180, 300],
    sung: 0.40,
    sources: [
      {
        genre: 'latin',
        styles: ['mambo', 'chachacha', 'guaracha', 'bolero', 'danzon', 'son', 'samba', 'plena'],
        eras: ['orquesta'],
        moods: ['sabroso', 'bravo', 'carnaval'],
        weight: 2,
      },
      {
        genre: 'latin',
        styles: ['salsadura', 'cumbia', 'songo', 'merengue', 'timba', 'vallenato', 'partidoalto', 'bomba'],
        eras: ['salsa', 'moderno'],
        moods: ['sabroso', 'carnaval', 'rumbero', 'bravo'],
        weight: 2,
      },
      /**
       * The jump-up half of reggae, which is where `The Dancehall` went. That
       * station was `--genre reggae` and came off the dial; its repertoire did
       * not. The 1963 and 1967 records are here because a ska band is a horn
       * section playing for a street; `lovers` and `rubadub` went to
       * `lateshift`, and `ragga` and `slengteng` to `rewind`, each to the room
       * where it means something.
       */
      {
        genre: 'reggae',
        styles: ['ska', 'mento', 'shuffle'],
        eras: ['ska'],
        moods: ['jump', 'easy', 'rough'],
        weight: 1,
      },
      {
        genre: 'reggae',
        styles: ['rocksteady', 'skinhead', 'onedrop', 'bubble', 'horns'],
        eras: ['rocksteady'],
        moods: ['jump', 'sweet', 'easy'],
        weight: 1,
      },
      {
        genre: 'arabic',
        styles: ['dabke', 'zaffa', 'saidi', 'baladi', 'malfuf', 'maqsum', 'khaleeji', 'fallahi'],
        eras: ['firqa', 'shaabi', 'satellite'],
        moods: ['farah', 'raqs', 'sahra'],
        weight: 2,
      },
      {
        genre: 'indian',
        styles: ['bhangra', 'filmi', 'dhun', 'qawwali', 'ghazal', 'cabaret'],
        eras: ['filmi', 'fusion'],
        moods: ['utsav', 'shringara', 'vira'],
        weight: 2,
      },
    ],
  },
  {
    /**
     * A fiddle, a modal tune, and a hard winter — Appalachia and Karelia, which
     * turn out to be one station.
     *
     * The pairing is not a joke about latitude. These are the two genres here
     * built on a solo voice and a fiddle playing dance music for people who
     * worked outdoors, and their mood tables line up almost word for word:
     * `lonesome` against `murheinen`, `hoedown` against `vauhdikas`, `sunday`
     * against `harras`. Neither had ever been on the dial — country has 24
     * styles and four eras and had never been drawn.
     *
     * Split three ways on the country side and two on the Finnish, because both
     * tables date their repertoire hard: `country/stringband` zeroes ten styles
     * including `truckdriving` and `outlaw`, and `finnfolk/runo` zeroes sixteen
     * of twenty-four — a `polkka` in the rune-song era is not a rare record, it
     * is a wrong one.
     */
    id: 'porch',
    name: 'Porch',
    hook: 'catchy',
    seconds: [150, 260],
    sung: 0.50,
    sources: [
      {
        genre: 'country',
        styles: ['breakdown', 'bluegrass', 'bluegrasswaltz', 'cowboy', 'murderballad', 'gospel', 'duet', 'cajun'],
        eras: ['stringband'],
        moods: ['lonesome', 'hardluck', 'hoedown', 'sunday'],
        weight: 2,
      },
      {
        genre: 'country',
        styles: ['honkytonk', 'twostep', 'waltz', 'westernswing', 'trainsong', 'bakersfield', 'ballad', 'duet'],
        eras: ['honkytonk', 'nashville'],
        moods: ['barroom', 'heartbreak', 'lonesome', 'highway'],
        weight: 2,
      },
      {
        genre: 'country',
        styles: ['outlaw', 'countryrock', 'truckdriving', 'newgrass', 'zydeco', 'ballad'],
        eras: ['outlaw'],
        moods: ['highway', 'hardluck', 'barroom'],
        weight: 1,
      },
      {
        genre: 'finnfolk',
        styles: ['runolaulu', 'itkuvirsi', 'soitto', 'piirileikki', 'virsi', 'karjanhuuto'],
        eras: ['runo'],
        moods: ['arkainen', 'murheinen', 'harras'],
        weight: 1,
      },
      {
        genre: 'finnfolk',
        styles: ['polska', 'polkka', 'sottiisi', 'katrilli', 'masurkka', 'haavalssi', 'menuetti', 'marssi', 'rekilaulu'],
        eras: ['pelimanni', 'revival'],
        moods: ['vauhdikas', 'pyoriva', 'juhlava', 'murheinen'],
        weight: 2,
      },
      /**
       * The living end of the tradition, and it belongs on this station rather
       * than sounding like an exception to it. `contemporary` weights
       * `sahkopelimanni` and `karjalanlaulu` at 8 — an amplified fiddle band is
       * still a fiddle band, and the tunes are the ones in the entry above with
       * better microphones on them.
       */
      {
        genre: 'finnfolk',
        styles: ['sahkopelimanni', 'karjalanlaulu', 'poljento', 'konserttikantele', 'polska', 'hidasvalssi'],
        eras: ['contemporary'],
        moods: ['vauhdikas', 'murheinen', 'jykeva'],
        weight: 1,
      },
    ],
  },
  {
    /**
     * Hands moving fast, in public, to show you can.
     *
     * A Bach toccata, a bebop head and a Hindustani `jhala` are the same event
     * in three traditions: the player demonstrating what the hands can do,
     * inside a form the audience already knows well enough to be impressed by
     * the liberties. That is a mood, and it is one no table in `genre/` names.
     *
     * Nothing else on the dial is bright *and* fast. `longwave` takes
     * classical's slow corner — `nocturne`, `adagio`, `berceuse` — and
     * `nightjazz` takes jazz's smoky one, so the virtuoso half of both genres
     * had nowhere to be played. This is that half, and the third genre is what
     * turns the pairing from a compromise into an argument.
     *
     * It is also where the eighteenth century arrives. `classical/baroque` and
     * `classical/classical` had never been drawn on any station, and neither
     * had `indian/hindustani` or `indian/carnatic` — four eras holding most of
     * the notated music in the catalogue.
     */
    id: 'cadenza',
    name: 'Cadenza',
    hook: 'standard',
    seconds: [180, 300],
    sources: [
      {
        genre: 'classical',
        styles: ['fugue', 'toccata', 'gigue', 'passacaglia', 'chaconne', 'overture', 'gavotte', 'sarabande'],
        eras: ['baroque'],
        moods: ['brillante', 'giocoso', 'maestoso'],
        weight: 2,
      },
      /**
       * Split from the entry above rather than listed with it, and the table is
       * unusually blunt about why: `classical/baroque` weights `sonata`,
       * `scherzo` and `etude` at 0, and `classical/classical` does the same to
       * `prelude` and `barcarolle`. One source spanning both eras would offer
       * every pairing at equal odds and print a sonata dated 1720.
       */
      {
        genre: 'classical',
        styles: ['sonata', 'rondo', 'scherzo', 'etude', 'minuet', 'overture', 'march'],
        eras: ['classical'],
        moods: ['brillante', 'giocoso', 'agitato'],
        weight: 2,
      },
      /**
       * `bop` alone, and `swingera` deliberately not. Bebop in 1938 is the same
       * wrong date the entry above avoids — and `nightjazz` already holds
       * `swingera` for the ballads, so the two jazz stations divide the genre
       * by temperament rather than competing for it.
       */
      {
        genre: 'jazz',
        styles: ['bebop', 'gypsy', 'odd', 'blues'],
        eras: ['bop'],
        moods: ['hot', 'restless', 'swinging'],
        weight: 2,
      },
      /**
       * The display forms of both traditions in one source, because unlike the
       * classical entries above, `hindustani` and `carnatic` zero nothing —
       * they weight. A `varnam` under a Hindustani production is unusual rather
       * than impossible, and the table is content to let it happen rarely.
       */
      {
        genre: 'indian',
        styles: ['jhala', 'jor', 'tarana', 'gat', 'tanam', 'varnam', 'tillana', 'jugalbandi'],
        eras: ['hindustani', 'carnatic'],
        moods: ['vira', 'utsav', 'shanta'],
        weight: 2,
      },
    ],
  },
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
    id: 'rewind',
    name: 'Rewind',
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
      /**
       * 1992, the year before the rest of the station, as its own entry because
       * `dnb/rave` zeroes thirteen styles — every one of the names above except
       * `jungle`. What it does weight is `hardcore` at 9 and `darkcore` at 8,
       * which is the music the `dubplate` records were made *out of*, a year
       * earlier and half a step slower.
       */
      {
        genre: 'dnb',
        styles: ['hardcore', 'darkcore', 'bleep', 'jungle'],
        eras: ['rave'],
        moods: ['roughneck', 'darkside'],
        weight: 1,
      },
      /**
       * The lineage, stated rather than implied. `dnb/dubplate` weights `ragga`
       * at 9 and the style is named for what it samples: Jamaican vocals over
       * chopped breaks. Putting `reggae/digital` on the same station is not a
       * cross-genre gesture, it is the source material sitting next to the
       * record that used it — `slengteng` is a 1985 riddim and half of jungle
       * is built on it.
       */
      {
        genre: 'reggae',
        styles: ['ragga', 'slengteng', 'dancehall', 'dub', 'rubadub'],
        eras: ['digital'],
        moods: ['rough', 'jump', 'echo'],
        weight: 1,
      },
    ],
  },
  {
    /**
     * Distortion as a design decision.
     *
     * The lock is timbre rather than tempo — a sound station, like `neon` — and
     * the three genres on it disagree about speed by a factor of two without
     * the promise slipping. What a `thrash` guitar, a 1972 Marshall and a
     * `neurofunk` reece bass have in common is an engineer deliberately
     * ruining a signal and then spending a week tuning the ruin.
     *
     * ## Where neurofunk lives
     *
     * `rewind` above plays `dubplate` — chopped amen, ragga vocals, 1995 — and
     * the era tables put `neurofunk` at 2 there against 9 in `studio`, with the
     * moods inverting alongside: `wheelup` and `roughneck` on that station,
     * `darkside` and `deepend` on this one. So the genre's two halves sit on
     * two stations, and this is the one that shares its temperament, next to
     * `crushing` and `cold` rather than next to a party.
     *
     * Five sources for three genres, and the splits are all dates. `metal/heavy`
     * zeroes twelve styles including `thrash` and `death`; `rock/hard` zeroes
     * `grunge` and `alt`. A single wide source would have printed a death metal
     * record dated 1972.
     */
    id: 'overdrive',
    name: 'Overdrive',
    hook: 'loose',
    seconds: [200, 330],
    sources: [
      {
        genre: 'metal',
        styles: ['thrash', 'speed', 'crossover', 'groove', 'death', 'industrial', 'progressive'],
        eras: ['thrash'],
        moods: ['crushing', 'savage', 'technical'],
        weight: 2,
      },
      {
        genre: 'metal',
        styles: ['death', 'black', 'melodeath', 'techdeath', 'symphonic', 'gothic', 'postmetal', 'sludge'],
        eras: ['extreme'],
        moods: ['crushing', 'savage', 'cold'],
        weight: 2,
      },
      {
        genre: 'metal',
        styles: ['heavy', 'doom', 'stoner', 'progressive'],
        eras: ['heavy'],
        moods: ['crushing', 'epic', 'swagger'],
        weight: 1,
      },
      {
        genre: 'rock',
        styles: ['hard', 'riff', 'bluesrock', 'boogie', 'glam', 'prog', 'southern', 'psych', 'motorik'],
        eras: ['hard'],
        moods: ['heavy', 'raw', 'swagger'],
        weight: 2,
      },
      {
        genre: 'rock',
        styles: ['grunge', 'alt', 'indie', 'shoegaze', 'stoner', 'math', 'punk'],
        eras: ['alt'],
        moods: ['heavy', 'raw', 'hazy'],
        weight: 1,
      },
      {
        genre: 'dnb',
        styles: ['neurofunk', 'techstep', 'rollers', 'halftime', 'drumfunk', 'minimal'],
        eras: ['studio', 'design'],
        moods: ['darkside', 'deepend', 'roughneck'],
        weight: 2,
      },
    ],
  },
  {
    /**
     * A late bar, and the Latin entries are what make it a bar rather than a
     * jazz filter.
     *
     * `bossa` was already here, which is the tell: the station had one foot in
     * this repertoire and was calling it jazz. A `bolero` and a `danzón` are
     * the same hour of the same night played by the band that was booked
     * instead — slow, sung, and for couples — and `latin/conjunto` weights
     * `bolero` at 7 and `son` at 9 without needing a mood table to explain it.
     *
     * `carnival` takes the same genre's other half at three times the volume.
     * Nothing overlaps: that station is `salsa` and `moderno`, this one is the
     * two eras before them.
     */
    id: 'nightjazz',
    name: 'Night Jazz',
    hook: 'loose',
    seconds: [200, 330],
    sources: [
      /**
       * Split by era, and this fixes a fault the station had from the start.
       * One source listing five styles across all three eras offered `bossa`
       * and `modal` under `swingera`, and `jazz/eras.ts` weights both at 0 in
       * 1938 — bossa nova is twenty years later and modal jazz is thirty. The
       * station had been printing wrong dates on one record in seven.
       */
      {
        genre: 'jazz',
        styles: ['ballad', 'swing', 'blues', 'gypsy'],
        eras: ['swingera'],
        moods: ['smoky', 'bluesy', 'dreamy'],
        weight: 1,
      },
      {
        genre: 'jazz',
        styles: ['ballad', 'trio', 'bossa', 'modal', 'swing'],
        eras: ['bop', 'modern'],
        moods: ['smoky', 'cool', 'dreamy', 'bluesy'],
        weight: 3,
      },
      {
        genre: 'latin',
        styles: ['bolero', 'danzon', 'son', 'guajira'],
        eras: ['conjunto'],
        moods: ['romantico', 'campo'],
        weight: 1,
      },
    ],
  },
  {
    /**
     * Sweet, slow, and after midnight — and the two new entries are where the
     * "aren't reggae and funk both funky?" question comes out right.
     *
     * They are not. `reggae/index.ts` opens by saying that every other
     * repertoire in this project states the downbeat and that this one tells
     * the floor where beat one is *by refusing to play there*; funk is built on
     * the One. On a station locked to rhythm they would be opposites. This
     * station is locked to a mood, so the disagreement stops mattering and what
     * is left is the thing they actually share — `lovers` and `slink` are the
     * same hour as `quietstorm` and `lofi`, played by two bands who would argue
     * about the drums.
     *
     * That is the general rule, in one entry: a station gets to be wide on
     * every axis it did not lock.
     */
    id: 'lateshift',
    name: 'Late Shift',
    hook: 'standard',
    sources: [
      {
        genre: 'hiphop',
        styles: ['lofi', 'jazzrap', 'boombap', 'soulloop', 'abstract'],
        eras: ['golden', 'modern'],
        moods: ['dusty', 'hazy'],
        weight: 3,
      },
      {
        genre: 'rnb',
        styles: ['quietstorm', 'neosoul', 'slowjam', 'bedroom'],
        eras: ['newjack', 'neo'],
        moods: ['smoulder', 'ache', 'sweet'],
        weight: 3,
      },
      {
        genre: 'reggae',
        styles: ['lovers', 'rubadub', 'onedrop', 'dub', 'roots'],
        eras: ['roots', 'digital'],
        moods: ['sweet', 'easy', 'echo'],
        weight: 1,
      },
      {
        genre: 'funk',
        styles: ['ballad', 'jazzfunk', 'souljazz', 'clav', 'deepfunk'],
        eras: ['pfunk', 'boogie'],
        moods: ['slink', 'strut'],
        weight: 1,
      },
    ],
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
       *
       * `overdrive` is the other station with a distorted guitar on it and this
       * is not a candidate for it: the lock there is an engineer ruining a
       * signal on purpose, and this is a film composer quoting one.
       */
      {
        genre: 'synth',
        styles: ['darksynth'],
        eras: ['retrowave'],
        moods: ['dread'],
        weight: 1,
      },
      /**
       * The slow corner of the genre, and the boundary with `cadenza` is the
       * era rather than the taste: this takes `romantic` and `impressionist`,
       * that one takes `baroque` and `classical`. Between them the genre is
       * played whole for the first time.
       */
      {
        genre: 'classical',
        styles: ['nocturne', 'adagio', 'berceuse', 'prelude', 'barcarolle'],
        eras: ['romantic', 'impressionist'],
        moods: ['tranquillo', 'misterioso', 'cantabile'],
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
 * Derived rather than written, so it cannot disagree with the table above.
 *
 * ## Every genre is named, however many there are
 *
 * There is no width limit here and there should not be, because the page
 * already solved this: `fitStationLabels` in `radio.ts` measures each line
 * against its card and slides the ones that overflow, at a duration computed
 * from how far over they are — *"a reading speed rather than a fixed
 * duration"*. A six-genre station is a longer slide, not a different kind of
 * problem.
 *
 * Two earlier answers were worse. `all 19 genres` above three genres was
 * simply false for anything but `borderfm`. Replacing it with a count —
 * `6 genres` — was true and useless: a listener choosing a station wants to
 * know it has metal on it, and the number is the one fact about the contents
 * that answers nothing.
 *
 * `borderfm` keeps the summary, and only `borderfm`: nineteen labels is 180
 * characters and about ninety seconds of sliding, which is not a label any
 * more. Naming them would also tell the listener nothing the station's own
 * name does not.
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
