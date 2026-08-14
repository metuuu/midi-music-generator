/**
 * Song IR → Performance IR. The whole of `src/concert/` in one call.
 *
 * Everything below is deterministic and browser-free: give it a seed and it
 * gives back a complete show — the set, the room, who is on stage, what every
 * limb does, what the lights do, and the programme — as plain data. Nothing
 * here has seen three.js, Strudel or the DOM, which is what makes the stage a
 * *renderer* of this rather than the place it happens.
 *
 * The ordering below is a dependency order, not a preference:
 *
 *   setlist → venue → per number: cast → solos → choreography, groove,
 *                                 visemes, lighting → bill
 *
 * Casting has to come first within a number because everything after it needs
 * performer ids, and lighting has to come last because a follow spot needs to
 * know both who is soloing and that they exist.
 */

import type { LayerId, Song, Track } from '../core/types.js';
import { generateSong, withCountIn } from '../generate/song.js';
import { GENRE_IDS, getGenre } from '../genre/index.js';
import { Rng } from '../core/rng.js';

import { castSong, playerFor } from './cast.js';
import { choreograph } from './choreograph.js';
import { scoreGroove } from './groove.js';
import { scoreLighting } from './lighting.js';
import { buildSetlist, type SetlistNumber } from './setlist.js';
import { buildBill } from './showbill.js';
import { chooseVenue } from './venue.js';
import { visemesFor } from './visemes.js';
import type {
  Cast, Concert, ConcertNumber, ConcertOptions, SoloSpot, Venue,
} from './types.js';

export * from './types.js';
export { ARCHETYPES, ARCHETYPE_OF, archetypeForTrack, specFor } from './instruments.js';
export { MIN_CONCERT_STRICTNESS } from './setlist.js';
export { billDuration, billTime } from './showbill.js';
export { soundingEffectors } from './choreograph.js';
export { DEFAULT_CAMERA } from './cast.js';

export function buildConcert(opts: ConcertOptions = {}): Concert {
  /**
   * Resolve the seed here rather than letting the setlist invent one.
   *
   * `buildSetlist` falls back to `Math.random()` when given nothing, which is
   * correct for it and useless to everyone else: the programme prints the seed
   * and the share link contains it, so a show whose seed only exists inside a
   * song's metadata cannot be shared or reproduced. One resolution, at the top,
   * and every subsystem downstream derives from it.
   *
   * A show staged from one exact number falls back to that number's seed, so
   * the venue, the cast and the lights are reproducible from the same string
   * the song is.
   */
  const seed = opts.seed
    ?? (opts.song?.seed !== undefined ? String(opts.song.seed) : String(Math.floor(Math.random() * 1e9)));
  const resolved: ConcertOptions = { ...opts, seed };

  /**
   * The setlist, counted in.
   *
   * This is the one place a concert's music differs from the same music on the
   * radio, and it is a difference about *performance* rather than composition:
   * a band on a stage does not start by telepathy. `withCountIn` puts the
   * drummer's four clicks at the front as ordinary bars of music, so the
   * choreographer animates them, the lighting score sees them and the
   * programme's running times include them — see `generate/song.ts`. It is a
   * no-op for a genre that does not count itself in, and for any number with
   * no kit to count on; those get the leader's silent cue instead, which is the
   * show runner's business rather than the generator's.
   *
   * Before `buildBill`, deliberately: the bill prints durations, and a
   * programme that disagreed with the clock by a bar per number would be wrong
   * about the length of the evening.
   */
  const allSongs = buildSetlist(resolved)
    .map((entry) => ({ ...entry, song: withCountIn(entry.song) }));
  if (!allSongs.length) throw new Error('buildConcert: the setlist came back empty');

  /**
   * One number off the evening, kept as that number rather than renumbered.
   *
   * The setlist runs in full first so slot N still draws the key, length and
   * seed it would have had in the shared show; only then is everything else
   * dropped. `pieceAt` is the printed programme position and the `/${n}` on
   * the cast seed — both have to stay, or a copied row would stage a different
   * band in a different key under a bill that said "3".
   */
  let songs = allSongs;
  let pieceAt: number | undefined;
  if (!resolved.song && resolved.piece !== undefined) {
    pieceAt = Math.max(1, Math.min(allSongs.length, Math.round(resolved.piece)));
    songs = [allSongs[pieceAt - 1]!];
  }

  // Every number shares a genre and an era — a band is one band on one night,
  // and the venue, the wardrobe and the programme's typography all have to
  // agree about which night it is.
  const genre = songs[0]!.song.meta.genre;
  const era = songs[0]!.song.meta.era;
  /**
   * The decade, resolved here for the same reason the era is: one band, one
   * night. The stage needs it and cannot get it from `era`, whose ids are
   * genre-local — see `EraProfile.year`.
   */
  const year = getGenre(genre).eras[era]?.year ?? 1980;
  /**
   * …and the building, which on a chaos evening may belong to somebody else.
   *
   * The one staging decision that cannot be a per-number trait: a band does not
   * move between songs, so it is drawn here, once, on a stream nothing else
   * reads. Everything else `staging` borrows — the clothes, their colours, the
   * body, the programme copy — is per number and rides on each song's own
   * recipe. See `chooseVenue` and `genre/chaos.ts`.
   *
   * Derived from the concert seed and the options, so a shared link reproduces
   * the room without carrying a field for it.
   */
  const roomGenre = resolved.chaos?.levels?.includes('staging')
    ? new Rng(`${seed}:chaos:room`).pick(GENRE_IDS)
    : genre;
  const venue = chooseVenue(genre, era, seed, roomGenre);

  const numbers = songs.map((entry, i) => {
    const n = pieceAt ?? i + 1;
    return buildNumber(entry, venue, `${seed}/${n}`);
  });

  return {
    seed, genre, era, year, venue,
    bill: buildBill(songs.map((entry) => entry.song), pieceAt),
    numbers,
  };
}

function buildNumber(entry: SetlistNumber, venue: Venue, seed: string): ConcertNumber {
  const { song, recipe } = entry;
  const cast = castSong(song, venue, seed);
  const solos = resolveSolos(song, cast);

  /**
   * The vocal track belongs to whoever is singing, and only one performer can
   * be. `visemesFor` returns `undefined` on an instrumental number, which is
   * most of them — see the plan's §5, where instrumental is a first-class mode
   * rather than an absence.
   */
  const singer = cast.performers.find((p) => p.layer === 'vocal');
  const visemes = singer ? visemesFor(song, singer.id) : undefined;

  return {
    song,
    recipe,
    cast,
    choreography: choreograph(song, cast),
    groove: scoreGroove(song, cast, seed),
    ...(visemes ? { visemes } : {}),
    lighting: scoreLighting(song, cast, solos, seed),
    solos,
  };
}

/**
 * Turn the generator's named soloists into something a stage can point at.
 *
 * `Section.solo` says a *layer* is soloing; a follow spot needs a *person*.
 * Doing the join once, here, is what stops the lighting score, the camera
 * director and the animation runtime each re-deriving it and disagreeing at the
 * edges — which is the same argument that put `Section.solo` in the Song IR in
 * the first place.
 *
 * A solo whose layer nobody is playing is dropped rather than guessed at. The
 * generator already guards against naming a soloist who wrote no notes, so this
 * should never fire; if it ever does, a missing spotlight is a far better
 * failure than a spotlight on the wrong player.
 *
 * "Nobody is playing" means nobody's hands, not nobody's `layer` — see
 * `playerFor`. A keyboard player carrying the bass in their left hand is who a
 * bass solo belongs to, and matching layers directly would have dropped the spot
 * on the grounds that the person playing it was cast as something else.
 */
export function resolveSolos(song: Song, cast: Cast): SoloSpot[] {
  const { beatsPerBar } = song.meta;
  const spots: SoloSpot[] = [];

  for (let i = 0; i < song.sections.length; i++) {
    const section = song.sections[i]!;
    const solo = section.solo;
    if (!solo) continue;
    const performer = playerFor(cast, solo.layer, solo.instrument);
    if (!performer) continue;

    spots.push({
      sectionIndex: i,
      fromBeat: section.startBar * beatsPerBar,
      toBeat: (section.startBar + section.lengthBars) * beatsPerBar,
      performerId: performer.id,
      layer: solo.layer,
      backing: solo.backing,
    });
  }
  return spots;
}

/**
 * Regenerate one layer of a number and splice it back in.
 *
 * The tomato seam. `variation` salts that layer's RNG streams and nothing
 * else's, so the song comes back identical in form, key, tempo, groove and
 * every other part, with a different line for the player who was hit.
 *
 * **The song is regenerated from the recipe it was built with, and `SongMeta`
 * is not that recipe.** This used to reassemble the call out of what the IR
 * records — genre, era, style, mood, strictness, hook — which looks complete
 * and is not: `targetSeconds` is nowhere in `SongMeta`, and `tonic` and `mode`
 * are in it but were not being passed back. `generateSong` therefore drew a
 * fresh key. Measured over 32 numbers, the band came back in a **different key
 * on 30 of them**, a different mode on 13, and a different length on 16 — three
 * of those shorter, which ends the number early, because `show.ts` runs the
 * piece until `elapsed >= songDurationBeats(current.song)`. A tomato modulated
 * the band mid-song. So `ConcertNumber.recipe` carries the original call and
 * this makes it again with one field changed.
 *
 * Two things are deliberately *not* done. The choreography is recomputed (it
 * has to be — the notes changed) but the cast is untouched: the same people are
 * on stage in the same clothes, because they are. And the groove, visemes and
 * lighting are kept, because none of them describes the notes of one layer.
 *
 * ## Only the player who was hit
 *
 * `variation` salts one layer's streams, but the band is *written in an order*
 * and the later parts read the earlier ones: the counter answers the tune note
 * by note, the horns take it as an argument, `patchBand` moves the bass onto
 * its anticipations, and collision repair shoves comp, pad and brass off
 * anything doubling it. Measured, varying `melody` moved up to four other
 * parts. All of that is correct arrangement behaviour and none of it is wanted
 * here: a tomato is one player sulking, not the band rewriting the chart around
 * them.
 *
 * So the whole song is regenerated and then **only the hit player's tracks are
 * kept**. Everything else stays the object it already was. Isolation by
 * construction rather than by trusting the dependency graph — which matters
 * doubly once `chaos` is in the call, because a chimera rewrites parts this has
 * no intention of handing over.
 *
 * The choreography is rebuilt from the spliced song rather than patched.
 * `choreograph` seeds per performer — `${seed}:choreo:${performer.id}` — so
 * everybody whose notes did not move gets byte-identical gestures back.
 */
export function revoiceNumber(
  number: ConcertNumber, layer: LayerId, attempt: number,
): ConcertNumber {
  const { salted, tracks: group } = revoiceGroup(layer);
  const song = generateSong({ ...number.recipe, variation: { [salted]: attempt } });
  /**
   * Counted in again, and this is load-bearing rather than tidy: this runs
   * *mid-number*, against a transport that is already playing the counted-in
   * version, and a song that came back a bar short would put every remaining
   * beat of the piece one bar away from the clock animating it.
   */
  const staged = withCountIn(song);
  const spliced = spliceLayers(number.song, staged, group);
  // The fresh song did not fit the one on stage. See `spliceLayers`.
  if (!spliced) return number;
  return { ...number, song: spliced, choreography: choreograph(spliced, number.cast) };
}

/**
 * Which tracks one hit re-voices, and whose stream it salts.
 *
 * Almost always the player's own layer and nothing else. The exception is the
 * singer, and it is not a special case so much as an admission about what the
 * vocal layer *is*: `generateVocalStack` syllabifies the melody, so the sung
 * line and the tune are one line performed by two people. Splicing `melody`
 * alone would leave the singer on the tune nobody is playing any more.
 *
 * It also gives a tomatoed singer a consequence at all. `salt('vocal')` is read
 * by no stream in the generator — the vocal is derived rather than drawn — so
 * `variation: { vocal: n }` is a no-op and she used to come back singing exactly
 * what she had been singing. Salting `melody` is what "sing something else"
 * actually means.
 */
function revoiceGroup(layer: LayerId): { salted: LayerId; tracks: LayerId[] } {
  return layer === 'melody' || layer === 'vocal'
    ? { salted: 'melody', tracks: ['melody', 'vocal'] }
    : { salted: layer, tracks: [layer] };
}

/**
 * `into` with `group`'s parts taken from `from`, or `undefined` if they do not fit.
 *
 * The fit check is the whole safety of this. A spliced part is written against
 * *its own* song's form — its bars, its metre, its section seams — and dropped
 * into another one it is simply notes at the wrong beats. The recipe is pinned,
 * so a plain re-voice always fits; a `chaos` re-voice may not, because a chimera
 * narrows its tempo band from the figures it borrowed and refits the form to the
 * target seconds at whatever speed comes out.
 *
 * `undefined` rather than a throw or a partial splice: the caller's answer is to
 * leave the number alone, and a player who comes back playing what they were is
 * a disappointment where a player whose bar lines have moved is a wreck.
 */
function spliceLayers(into: Song, from: Song, group: LayerId[]): Song | undefined {
  if (into.meta.totalBars !== from.meta.totalBars) return undefined;
  if (into.meta.beatsPerBar !== from.meta.beatsPerBar) return undefined;
  if (into.meta.bpm !== from.meta.bpm) return undefined;
  if (into.sections.length !== from.sections.length) return undefined;
  for (let i = 0; i < into.sections.length; i++) {
    const a = into.sections[i]!;
    const b = from.sections[i]!;
    if (a.startBar !== b.startBar || a.lengthBars !== b.lengthBars) return undefined;
  }

  // The kit is not a `Track`, so it is spliced as itself.
  const drums = group.includes('drums') ? from.drums : into.drums;

  /**
   * Positional, and the counts have to agree.
   *
   * A layer is not always one track — a vocal stack is two, and the lead is
   * first by a convention `visemesFor` and `web/sung-voice.ts` both rely on. So
   * the n-th track of a layer is replaced by the n-th of that layer in the fresh
   * song, and a run that produced a different number of them is a run this
   * cannot splice: appending would put an uncast singer on the stage and
   * dropping would silence a cast one.
   */
  const spare = new Map<LayerId, Track[]>();
  for (const layer of group) spare.set(layer, from.tracks.filter((t) => t.layer === layer));
  for (const [layer, fresh] of spare) {
    if (fresh.length !== into.tracks.filter((t) => t.layer === layer).length) return undefined;
  }

  const taken = new Map<LayerId, number>();
  const tracks = into.tracks.map((track) => {
    const fresh = spare.get(track.layer);
    if (!fresh) return track;
    const n = taken.get(track.layer) ?? 0;
    taken.set(track.layer, n + 1);
    return fresh[n] ?? track;
  });

  return { ...into, tracks, drums };
}

/** Total running time of the show, in seconds. */
export function concertSeconds(concert: Concert): number {
  return concert.bill.reduce((total, entry) => total + entry.seconds, 0);
}
