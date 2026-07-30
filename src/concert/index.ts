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

import type { LayerId, Song } from '../core/types.js';
import { generateSong, withCountIn, type GenerateOptions } from '../generate/song.js';
import { getGenre } from '../genre/index.js';

import { castSong, playerFor } from './cast.js';
import { choreograph } from './choreograph.js';
import { scoreGroove } from './groove.js';
import { scoreLighting } from './lighting.js';
import { buildSetlist } from './setlist.js';
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
  const songs = buildSetlist(resolved).map(withCountIn);
  if (!songs.length) throw new Error('buildConcert: the setlist came back empty');

  // Every number shares a genre and an era — a band is one band on one night,
  // and the venue, the wardrobe and the programme's typography all have to
  // agree about which night it is.
  const genre = songs[0]!.meta.genre;
  const era = songs[0]!.meta.era;
  /**
   * The decade, resolved here for the same reason the era is: one band, one
   * night. The stage needs it and cannot get it from `era`, whose ids are
   * genre-local — see `EraProfile.year`.
   */
  const year = getGenre(genre).eras[era]?.year ?? 1980;
  const venue = chooseVenue(genre, era, seed);

  const numbers = songs.map((song, i) => buildNumber(song, venue, `${seed}/${i + 1}`));

  return { seed, genre, era, year, venue, bill: buildBill(songs), numbers };
}

function buildNumber(song: Song, venue: Venue, seed: string): ConcertNumber {
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
 * **The options have to be rebuilt from `meta`, not just the seed.** A seed on
 * its own does not reproduce a song: `generateSong({ seed })` picks a genre at
 * random and would hand back a different piece of music entirely, in a
 * different key, while the band carried on playing the old one. Every field
 * that steered the original is recorded in `SongMeta` precisely so this is
 * possible — which is worth noticing, because it means the IR was already
 * carrying what a live re-voice needs before anyone asked it to.
 *
 * Two things are deliberately *not* done. The choreography is recomputed (it
 * has to be — the notes changed) but the cast is untouched: the same people are
 * on stage in the same clothes, because they are. And the groove, visemes and
 * lighting are kept, because none of them describes the notes of one layer.
 *
 * Note the arrangement caveat the solo engine turned up: varying `melody` also
 * moves `counter`, `brass`, `comp` and `pad`, because those layers answer the
 * tune or are pushed off it by collision repair. That is correct arrangement
 * behaviour rather than stream entanglement — but it means a tomatoed singer
 * changes more of the band than a tomatoed bassist does.
 */
export function revoiceNumber(
  number: ConcertNumber, layer: LayerId, attempt: number,
): ConcertNumber {
  const { meta } = number.song;
  const song = generateSong({
    seed: meta.seed,
    genre: meta.genre,
    era: meta.era,
    style: meta.style,
    mood: meta.mood,
    strictness: meta.strictness as GenerateOptions['strictness'],
    hook: meta.hook as GenerateOptions['hook'],
    vocals: number.song.tracks.some((t) => t.voice),
    variation: { [layer]: attempt },
  });
  /**
   * Counted in again, and this is load-bearing rather than tidy: this runs
   * *mid-number*, against a transport that is already playing the counted-in
   * version, and a song that came back a bar short would put every remaining
   * beat of the piece one bar away from the clock animating it.
   */
  const staged = withCountIn(song);
  return { ...number, song: staged, choreography: choreograph(staged, number.cast) };
}

/** Total running time of the show, in seconds. */
export function concertSeconds(concert: Concert): number {
  return concert.bill.reduce((total, entry) => total + entry.seconds, 0);
}
