/**
 * The showbill — what the programme says.
 *
 * The bill is where the show tells you what it is before a note is played, and
 * it is also the show's menu: reachable mid-performance, marking the number
 * playing, carrying the seed and the share link. Both jobs are served by the
 * same six fields, and this file fills them.
 *
 * ## The copy is the point
 *
 * A bill that reads
 *
 * > **KAKSI VARJOA** · 3:14 · tango · 1974 · A minor · 118 BPM · standard
 *
 * has told the audience nothing they wanted to know. It is a dump of
 * `SongMeta`, and `SongMeta` is a debugging aid. What a real programme prints
 * is a *promise*:
 *
 * > **KAKSI VARJOA** · 3:14 · *tango* — "for the last dance of the evening"
 *
 * Nothing in that line is information the show could not survive losing, and it
 * is the only part anybody reads twice. So the blurb tables are written rather
 * than computed, one per genre and kept by the genre — see
 * `Genre.staging.blurbs` — and everything else that a metadata dump would have
 * printed is deliberately absent: **the era belongs in the typography and the
 * paper, not in a caption saying 1974**, and the key and the tempo belong to the
 * band.
 *
 * Restraint is doing most of the work here. Every line is short, every line is
 * lowercase, and no line explains the music — it either sets an expectation or
 * makes a small joke at the band's expense. A blurb that describes what you are
 * about to hear is a programme note; a blurb that tells you why you should stay
 * for it is a bill.
 *
 * ## How a line is chosen
 *
 * Style, mood and position in the set, in that order of influence. A line
 * tagged with the style that is playing beats a generic one; a line tagged
 * `close` is reserved for the last number, where "the long one, sit down"
 * lands and would be a lie anywhere else. The draw is weighted rather than
 * greedy, so the same tango does not get the same sentence in every show, and
 * it is seeded from the song, so it gets the same sentence in the same show.
 */

import { songDurationSeconds, type Song } from '../core/types.js';
import { Rng } from '../core/rng.js';
import { GENRES } from '../genre/index.js';
import type { BlurbSlot } from '../genre/types.js';
import type { BillEntry } from './types.js';

// ---------------------------------------------------------------------------
// The copy
// ---------------------------------------------------------------------------

/**
 * Last resort, and it should never be reached — a new genre needs its own table.
 *
 * **It was being reached.** Three tables lived in this file, one per genre, and a
 * fourth genre had been added without one, so every synth number in the
 * catalogue printed this line: the fallback doing precisely its job, and a bill
 * nobody had written. That is the argument for the copy living where the copy is
 * about something — `Genre.staging.blurbs`, in the genre folder, next to the
 * styles and moods each line is tagged against.
 *
 * Everything about *how* a line is chosen stayed here, because none of it is any
 * one genre's business: the weighting, the spend list, the slot rules and the
 * argument for all three above.
 */
const HOUSE_BLURB = 'a new one, and nobody has decided about it yet';

// ---------------------------------------------------------------------------
// Building the bill
// ---------------------------------------------------------------------------

/**
 * Print the programme.
 *
 * One entry per number, in performance order. Nothing here re-derives anything
 * musical — the songs already know how long they are, what they are and whether
 * they are sung — so a bill is always in agreement with the set it was printed
 * from. `npm run concert` asserts the durations against
 * `songDurationSeconds`, which is the only place the two could ever drift.
 */
export function buildBill(songs: Song[]): BillEntry[] {
  // Lines already spent. A bill that says "twelve bars, no further questions"
  // twice reads as a bug, and with at least eighteen lines per genre against
  // five numbers there is no reason to allow it.
  //
  // That read "sixteen lines per genre", which was true of the tables when they
  // lived in this file and is short of every one of them now: measured over the
  // registry, the nineteen genres carry 429 blurbs between them, from ambient's
  // eighteen to finnfolk's twenty-seven, averaging 22.6. The floor is the number
  // worth quoting rather than the average, because the argument is about
  // exhaustion — `fresh` below only falls back to the whole table when the spent
  // set has eaten it, and eighteen lines against a five-number bill means that
  // never happens.
  const spent = new Set<string>();

  return songs.map((song, i) => {
    const sung = song.tracks.some((t) => t.layer === 'vocal' && t.notes.length > 0);
    return {
      number: i + 1,
      title: song.meta.title,
      seconds: Math.round(songDurationSeconds(song)),
      styleLabel: shortStyle(song.meta.styleLabel),
      // The full era label, which the renderer reads and does not print: it
      // selects the paper and the face. See `web/concert/showbill.ts`.
      eraLabel: song.meta.eraLabel,
      blurb: chooseBlurb(song, i, songs.length, spent),
      sung,
    };
  });
}

/**
 * A style name a programme would print.
 *
 * The catalogue labels carry a gloss for the UI — "Tango (suomalainen tango)",
 * "Valssi (waltz)" — which is exactly right in a dropdown next to a genre
 * selector and exactly wrong on a bill, where the parenthesis is the sound of a
 * programme explaining itself. Lowercase, because a bill sets its own case and
 * a renderer that wants capitals can ask CSS for them; going the other way
 * loses the difference between "bossa nova" and "Kosmische".
 */
function shortStyle(label: string): string {
  return label.replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase();
}

function chooseBlurb(song: Song, index: number, total: number, spent: Set<string>): string {
  /**
   * The copy comes from whoever lent it, on a chimera — see `genre/chaos.ts`.
   *
   * The blurbs below are matched to a style and a mood by name, and a foreign
   * table knows neither, so a borrowed line lands on the genre-wide entries
   * rather than the specific ones. That is the fallback working rather than
   * failing: what a programme says about a chaos number should be a sentence
   * about *that idiom*, not a claim about a tango it has never heard.
   */
  const from = song.meta.chaos?.borrowed['programme']?.split(':')[0] ?? song.meta.genre;
  const table = GENRES[from]?.staging?.blurbs;
  if (!table || !table.length) return HOUSE_BLURB;

  const slot: BlurbSlot | undefined = index === 0 ? 'open' : index === total - 1 ? 'close' : undefined;
  // Spent lines are removed rather than merely discouraged. A weight low enough
  // to make a repeat rare is still a weight, and "rare" over a few hundred
  // shows means somebody will read a bill that says the same thing twice —
  // which is the one failure that makes the whole programme look generated.
  // Only when the table is exhausted does a line come round again.
  const fresh = table.filter((b) => !spent.has(b.text));
  const weights = (fresh.length ? fresh : table).map((b) => {
    // A line written for this style is worth several written for the mood, and
    // a line written for neither is still worth having — the generic lines are
    // what stop the bill sounding like a lookup table.
    //
    // The mismatch penalties are savage rather than merely discouraging,
    // because a tagged line put against the wrong number is not a duller bill,
    // it is a *wrong* one: "big hair, bigger key change" under a 1968 waltz is
    // the programme lying about what is coming next, and one of those does more
    // damage than a dozen bland lines.
    let w = 1;
    if (b.styles) w *= b.styles.includes(song.meta.style) ? 7 : 0.03;
    if (b.moods) w *= b.moods.includes(song.meta.mood) ? 4 : 0.06;
    // Slot lines are close to useless out of position: "sit down, this is the
    // long one" printed against number two is simply wrong.
    if (b.slot) w *= b.slot === slot ? 3 : 0.02;
    return [b, w] as const;
  });

  const picked = new Rng(`${song.meta.seed}:bill`).weighted(weights);
  spent.add(picked.text);
  return picked.text;
}

// ---------------------------------------------------------------------------
// Reading a bill back
// ---------------------------------------------------------------------------

/**
 * Which genre and era a bill was printed for.
 *
 * The renderer needs both — the era chooses the paper and the face, the genre
 * chooses the layout — and `BillEntry` carries neither as an id. It carries
 * `eraLabel`, and era labels happen to be unique across the whole registry
 * ("1960s–70s tanssilava", "1950s–60s bop", "1990s sampler" …), so the pair is
 * recoverable without a change to the frozen contract or a second argument
 * threaded through every caller.
 *
 * That is a lookup rather than a design, and it is written down here rather
 * than in the renderer so that the day `BillEntry` gains an `eraId` there is
 * exactly one place to delete. Returns empty strings for a bill it cannot
 * place, which the renderer treats as "print it plainly".
 */
export function billHouse(bill: readonly BillEntry[]): { genre: string; era: string } {
  const label = bill[0]?.eraLabel;
  if (label) {
    for (const genre of Object.values(GENRES)) {
      for (const era of Object.values(genre.eras)) {
        if (era.label === label) return { genre: genre.id, era: era.id };
      }
    }
  }
  return { genre: '', era: '' };
}

/** `3:14`. The one piece of formatting both the bill and the stage agree on. */
export function billTime(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/** Total running time of the set, in seconds. Printed at the foot of the bill. */
export function billDuration(bill: readonly BillEntry[]): number {
  return bill.reduce((sum, e) => sum + e.seconds, 0);
}
