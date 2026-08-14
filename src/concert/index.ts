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
import type { ChaosLevel, ChaosOptions } from '../genre/chaos.js';
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
 *
 * ## And they come back playing somebody else's music
 *
 * `variation` alone is a weak answer to a tomato. It rerolls the *draws* on one
 * stream, which on a layer that draws heavily is a new part and on a layer that
 * barely draws is a shrug — measured, 29 re-voices out of 113 changed nothing
 * whatever, because a generator that makes no random choices has none to reroll.
 * `pad` cannot be varied at all.
 *
 * So the re-voice runs under `chaos`, which is a different lever: it swaps the
 * *material* — which figure, which instrument, whose feel — rather than
 * rerolling a choice. A player who was hit comes back playing some other genre's
 * line over this genre's chart, which is the joke the mechanic is for, and it
 * works on a layer with no randomness in it at all.
 *
 * Only `band`, `performance` and `figures`, which `genre/chaos.ts` describes as
 * the three that change what a piece sounds like without touching what it is
 * built on. `harmony` and `form` are precisely what a band mid-song cannot move,
 * and `staging` is not about notes.
 *
 * ## Asking for less until it fits
 *
 * Even those three can move the form. A chimera borrowing a figure in another
 * metre is a song in another metre, and `spliceLayers` rightly refuses it: at
 * full spread that took out classical and metal entirely — 17 re-voices of 113
 * refused, against 4 at the mildest step, so the *harder* you were pelted the
 * more likely the band was to come back playing exactly what they had been.
 *
 * So the spread is a request rather than a setting. Ask for the escalated one,
 * and on a refusal ask for half of it, and then for none — which is a plain
 * `variation` re-voice against the recipe's own form and cannot fail to fit.
 * Only the refusals pay for the extra generation; the common path is one call.
 */
export function revoiceNumber(
  number: ConcertNumber, layer: LayerId, attempt: number,
): ConcertNumber {
  const { salted, tracks: group } = revoiceGroup(layer);
  const wanted = Math.min(1, CHAOS_PER_TOMATO * attempt);
  /**
   * The most different part found so far, and how different it was.
   *
   * The ladder returns early on anything convincing, so this is only ever used
   * where no rung managed it — a layer with little to vary. Best-of is right
   * there rather than first-of: if every answer is weak, the least weak one is
   * still the one to play.
   */
  let weak: ConcertNumber | undefined;
  let best = 0;

  /**
   * Ask a different band, not the same band louder.
   *
   * This is the axis that was missing and it is worth being explicit about why,
   * because two plausible ones came first and neither worked.
   *
   * `spread` does not work, because every rung shared one chimera: `planChaos`
   * reads `${seed}:chaos`, so turning the rate up only asks the *same* borrowed
   * band for more of itself. And the `figures` tier — the one that lends a
   * foreign bass line at all — **moves the form**. Measured on the rock/jangle
   * number that reported this: the host plays nine sections with sixteen-bar
   * verses, the chimera came back with fourteen sections of eight, 97 bars
   * against 89, and `spliceLayers` rightly refused it. So every rung that could
   * have changed the notes was thrown away and what survived was the one that
   * moved 87 pitches of 610 and not one onset — a wrong note here and there in a
   * line the audience would swear had not changed.
   *
   * `ChaosOptions.seed` is the fix. It draws the *band* from a stream of its
   * own, so each rung is a different set of donors rather than a different
   * amount of one, and whether a donor's figure happens to refit the form is an
   * independent roll each time. On that same bass, twelve band seeds: ten fitted
   * and scored 0.54–0.90 where the old ladder's best was 0.33.
   *
   * The seed is derived rather than drawn — the number's own seed, the layer and
   * the attempt — so a replayed show throws identical tomatoes and gets identical
   * bands back, and two tomatoes at the same player never meet the same one.
   */
  const bandSeed = (k: number) => `${number.song.meta.seed}:tomato:${layer}:${attempt}:${k}`;
  const ladder: { chaos: ChaosOptions; salt: number }[] = [
    /**
     * Four different bands, each asked for its own figure outright.
     *
     * `mixing: { figures: 1 }` forces the borrow whatever the spread, and costs
     * nothing: `spliceLayers` keeps one layer and throws the rest of the song
     * away, so the only figure that survives is the hit player's. Four because
     * roughly one band in six brings a form this song cannot take, and four
     * independent rolls of that is a corner nobody will meet.
     */
    ...[0, 1, 2, 3].map((k) => ({
      chaos: {
        levels: REVOICE_CHAOS, spread: wanted, mixing: { figures: 1 }, seed: bandSeed(k),
      } as ChaosOptions,
      salt: attempt,
    })),
    /**
     * Then the host's own band, twice, on two different draws.
     *
     * Reached only where no chimera fitted, and it is the right thing to fall
     * back to rather than a fifth foreign band: if four of them all moved the
     * form, this song's form is the unusual one and asking a fifth is unlikely
     * to help. `variation` alone against the recipe's own form cannot fail to
     * fit. The salt offsets are primes so a second tomato at the same player
     * never lands on a draw the first one used — attempts 1–5 take 12–16 and
     * 24–28, and none overlap.
     */
    { chaos: { levels: [], spread: 0 }, salt: attempt + 11 },
    { chaos: { levels: [], spread: 0 }, salt: attempt + 23 },
  ];

  for (const { chaos: rung, salt } of ladder) {
    const song = generateSong({
      ...number.recipe,
      /**
       * Pinned, and this is what makes a chaotic re-voice splice at all.
       *
       * A chimera narrows its tempo band to what every band that lent it a
       * figure can play, and then fits the form to `targetSeconds` at whatever
       * speed comes out — so the fresh song arrives at a different tempo with a
       * different number of bars. Measured over the nineteen genres at three
       * escalation steps: **9 of 57 fit without this line and 57 of 57 with
       * it.** The ladder above is for what it does not catch.
       *
       * It costs no determinism. `generateSong` draws the tempo and *then*
       * applies the override — `pick(chooseTempo(rng, …), opts.bpm)` — so
       * pinning it spends the same random numbers as leaving it off, and a
       * plain re-voice comes back byte-identical either way.
       */
      bpm: number.song.meta.bpm,
      variation: { [salted]: salt },
      chaos: {
        // Donors the caller narrowed stay narrowed. The caller's own `mixing`
        // does not survive: a per-kind rate would pin the spread this escalates.
        ...(number.recipe.chaos?.donors ? { donors: number.recipe.chaos.donors } : {}),
        ...rung,
      },
    });
    /**
     * Counted in again, and this is load-bearing rather than tidy: this runs
     * *mid-number*, against a transport that is already playing the counted-in
     * version, and a song that came back a bar short would put every remaining
     * beat of the piece one bar away from the clock animating it.
     */
    const spliced = spliceLayers(number.song, withCountIn(song), group);
    if (!spliced) continue;
    /**
     * And it has to be different *enough*. This is the rung the loop is for.
     *
     * Everything above is a probability: a rate that usually moves a figure, a
     * chimera that usually has something else to say. A tomato is not a
     * probability — somebody threw it, watched the player stop, and is waiting
     * to hear what they do differently. So the answer is measured rather than
     * assumed.
     *
     * A boolean was the first version of this and it is not enough either. It
     * accepted anything that was not byte-identical, and what the ladder kept
     * finding was a part with the same rhythm and a handful of pitches moved —
     * 87 notes of 610, none of them off the beat they were on. Technically a
     * different line; heard as the same one. So it is a *share* now, and the
     * ladder goes on climbing until enough of the part has actually moved.
     */
    const moved = movedShare(number.song, spliced, group);
    if (moved >= STRONG_ENOUGH) {
      return withVisemes({
        ...number, song: spliced, choreography: choreograph(spliced, number.cast),
      });
    }
    if (moved > best) {
      best = moved;
      weak = { ...number, song: spliced, choreography: choreograph(spliced, number.cast) };
    }
  }

  /**
   * No rung managed a convincing part, so the least weak one plays.
   *
   * Still worth returning: the feel and the dynamics moved even where the notes
   * barely did, and the alternative is a player who visibly sulks and
   * demonstrably does not react. Some layers cannot do better — `generatePad`
   * draws no random numbers at all, so a pad has nothing to reroll and no figure
   * table to borrow from. `concert-check.ts` counts these rather than failing.
   *
   * `number` itself, finally, if not even one rung produced a song that fitted.
   * That means a different number of tracks on this layer — a variation that
   * silenced a part somebody is cast on, or gave them a second one — and a stage
   * where the notes and the bodies disagree about who is on it is a wreck.
   */
  return weak ? withVisemes(weak) : number;
}

/**
 * How much of this part actually moved, 0..1.
 *
 * **Onsets and pitches, not velocity.** A re-voice that changes only how hard
 * the notes are struck is the same part played a hair louder, and everything
 * that compared parts by serialising them whole was counting that as a change.
 *
 * Onsets are weighted over pitches because that is what a listener hears first:
 * a line with the same rhythm and a few notes moved is heard as the same line
 * with a wrong note in it, where a line that lands somewhere else is heard as a
 * different line. A part that grew or lost notes has already moved its rhythm,
 * which the onset set catches without a special case.
 */
function movedShare(before: Song, after: Song, group: LayerId[]): number {
  const onsets = (beats: number[]): Set<string> => new Set(beats.map((b) => b.toFixed(4)));
  const share = (a: Set<string>, b: Set<string>): number => {
    const union = new Set([...a, ...b]);
    if (!union.size) return 0;
    let common = 0;
    for (const k of a) if (b.has(k)) common++;
    return 1 - common / union.size;
  };

  if (group.includes('drums')) {
    const hits = (s: Song) => new Set(s.drums.events.map((e) => `${e.beat.toFixed(4)}:${e.voice}`));
    return share(hits(before), hits(after));
  }

  const notesOf = (s: Song) => s.tracks
    .filter((t) => group.includes(t.layer))
    .flatMap((t) => t.notes);
  const a = notesOf(before);
  const b = notesOf(after);
  const rhythm = share(onsets(a.map((n) => n.beat)), onsets(b.map((n) => n.beat)));
  const pitches = share(
    new Set(a.map((n) => `${n.beat.toFixed(4)}:${n.midi}`)),
    new Set(b.map((n) => `${n.beat.toFixed(4)}:${n.midi}`)),
  );
  return Math.max(rhythm, pitches * PITCH_WEIGHT);
}

/**
 * How much of a part has to move before it is a different part.
 *
 * Read off the failures rather than chosen. The re-voice this threshold exists
 * to reject moved 87 pitches of 610 and not one onset — a share of 0.14 by the
 * pitch measure and 0 by the rhythm one, which is a wrong note here and there in
 * a line the audience would swear had not changed. The ones that read as a new
 * part measured 0.6 and above. A third is comfortably clear of the first and
 * reachable by the second.
 */
const STRONG_ENOUGH = 0.34;

/**
 * Moving a pitch counts for less than moving a beat. See `movedShare`.
 *
 * Not zero, because a line that keeps its rhythm and re-pitches most of its
 * notes *is* a different line — a bassist walking somewhere else over the same
 * feel. It has to move most of them to clear the bar, which is the intent.
 */
const PITCH_WEIGHT = 0.6;

/**
 * The singer's mouth, redrawn for whatever she is singing now.
 *
 * Cheap and easy to forget, and forgetting it is what was reported: the sung
 * line changed and the face went on shaping the old one, because `visemes` was
 * carried across with the groove and the lighting as though it did not describe
 * the notes of one layer. It describes exactly that — `visemesFor` walks the
 * vocal track's vowels and consonants — so it has to be rebuilt whenever the
 * vocal track can have moved.
 *
 * Keyed on the singer being cast at all rather than on which layer was hit: an
 * instrumental number has no singer and no visemes, and on a sung one this is a
 * single pass over one track.
 */
function withVisemes(number: ConcertNumber): ConcertNumber {
  const singer = number.cast.performers.find((p) => p.layer === 'vocal');
  if (!singer) return number;
  const visemes = visemesFor(number.song, singer.id);
  return visemes ? { ...number, visemes } : number;
}

/**
 * What a re-voice is allowed to borrow. See `revoiceNumber`.
 *
 * Named rather than left off, because the default is a property of
 * `genre/chaos.ts` and this list is a claim about what a band can survive
 * without stopping. If a fourth kind is ever added to that file it must not
 * arrive here by inheritance.
 *
 * Two of the six are impossible and a third is merely wrong. `harmony` and
 * `form` are what a band mid-song cannot move — the chart and the bar count are
 * what the transport, the choreographer and the lighting score are all counting
 * against. `band` is the one this list used to include: it is `takeInstrument`,
 * `drum-machine`, `voice` and `sequencing`, which is to say *who is playing*,
 * and a tomato does not change who is playing. `spliceLayers` refuses an
 * instrument change outright, so leaving `band` in would only have written parts
 * for instruments nobody on this stage is holding.
 *
 * What is left says the thing worth saying: **the same players, playing
 * something else**. `figures` is what they play — the bass line, the comp
 * pattern, the drum figure, the melodic cells — and `performance` is how they
 * play it, down to the pedals and the desk.
 */
const REVOICE_CHAOS: ChaosLevel[] = ['performance', 'figures'];

/**
 * How much further into somebody else's genre each tomato pushes a player.
 *
 * Three good hits and they are playing it entirely — `spread` clamps at 1. That
 * is the same count the band's patience ladder is measured in, so the music and
 * the body language escalate together: by the time the drummer is staring at the
 * house, the bassist who got the first one is on a foreign figure.
 */
const CHAOS_PER_TOMATO = 0.35;

/**
 * Which tracks one hit re-voices, and whose stream it salts.
 *
 * The player's own layer, always — one tomato, one player. What varies is which
 * *stream* has to be salted to make that layer move, and the singer is the one
 * case where the two are not the same name.
 *
 * ## The singer and the tune are two people
 *
 * `generateVocalStack` syllabifies the melody, so the sung line and the played
 * one are the same line by construction, and the generator has no way to ask for
 * one without the other. This used to splice both together on the grounds that
 * they are one line performed by two people — which is true of a band nobody has
 * thrown anything at, and wrong the moment somebody has: a tomato at the
 * guitarist would put the singer on a new tune she was not hit for, and a tomato
 * at the singer would drag the guitarist along with her.
 *
 * So the salt and the splice are separated. Both are generated from a freshly
 * salted `melody` stream — that is the only way to get a different sung line at
 * all, since `salt('vocal')` is read by no stream in the generator and
 * `variation: { vocal: n }` is a plain no-op — and then **only the hit player's
 * tracks are kept**. They come out of it doubling each other no longer: the one
 * who was hit has a new line and the other is still playing what they were,
 * which is a descant against the tune rather than a unison with it, and it is
 * the honest reading of what happened. The singer keeps her own part when the
 * guitarist is hit, and the guitarist keeps his when she is.
 */
function revoiceGroup(layer: LayerId): { salted: LayerId; tracks: LayerId[] } {
  return layer === 'melody' || layer === 'vocal'
    ? { salted: 'melody', tracks: [layer] }
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
 *
 * ## Notes only. The player keeps their instrument
 *
 * What is taken from `from` is `notes`, and nothing else. `instrument`,
 * `gmProgram`, `strudelSound`, `voice`, `gain` and the whole effect chain stay
 * as they are on the stage.
 *
 * Because the person does not change. A tomato does not hand the accordionist a
 * Rhodes and it does not give the singer somebody else's voice — they are stood
 * there holding the thing they were holding, in the clothes they were cast in,
 * and `revoiceNumber` keeps the cast for exactly that reason. A part that came
 * back on a different soundfont would be a different player, heard but not seen,
 * and the picture would be the one telling the truth.
 *
 * Dropping `band` from `REVOICE_CHAOS` is not sufficient on its own and was the
 * first thing tried: measured over the nineteen genres at two escalation steps,
 * `band,performance,figures` moved an instrument, a kit or a voice on 37 splices
 * of 38, `performance,figures` on 16, and `figures` alone still on 11 — because
 * a chimera substitutes the style and the era that `chooseInstruments` draws
 * from, whichever tier asked for it. Taking the notes and leaving the timbre is
 * the only version that cannot be got round.
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

  /**
   * The kit is not a `Track`, so it is spliced as itself — and only its events.
   *
   * `bank` and `source` are the drum machine and the object it is: a LinnDrum on
   * a table, or a mridangam across somebody's shins. Same argument as the
   * instruments below, and the same answer.
   */
  const drums = group.includes('drums') ? { ...into.drums, events: from.drums.events } : into.drums;

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
    const part = fresh[n];
    return part ? { ...track, notes: part.notes } : track;
  });

  return { ...into, tracks, drums };
}

/** Total running time of the show, in seconds. */
export function concertSeconds(concert: Concert): number {
  return concert.bill.reduce((total, entry) => total + entry.seconds, 0);
}
