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
 * is the only part anybody reads twice. So the blurb tables below are written
 * rather than computed, one per genre, and everything else that a metadata dump
 * would have printed is deliberately absent: **the era belongs in the
 * typography and the paper, not in a caption saying 1974**, and the key and the
 * tempo belong to the band.
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
import type { BillEntry } from './types.js';

// ---------------------------------------------------------------------------
// The copy
// ---------------------------------------------------------------------------

/** Where in the set a line belongs. Absent means anywhere. */
type Slot = 'open' | 'close';

interface Blurb {
  text: string;
  /** Style ids this line is about. */
  styles?: string[];
  /** Mood ids this line is about. */
  moods?: string[];
  slot?: Slot;
}

/**
 * Iskelmä: a tanssilava bill.
 *
 * The register to aim for is the one the genre uses about itself — affectionate
 * and unsentimental at the same time. Finnish popular song is extremely good at
 * being sad on purpose and knows it, so the lines are allowed to be dry about
 * the melancholy without sneering at it. Dance instructions are fair game; the
 * floor is the actual subject of most of this music.
 */
const ISKELMA: Blurb[] = [
  { text: 'for the last dance of the evening', styles: ['tango'], moods: ['kaihoisa', 'haikea'], slot: 'close' },
  { text: 'somebody is not going to be talked out of it', styles: ['tango'] },
  { text: 'three minutes of magnificent self-pity', styles: ['tango'], moods: ['dramaattinen', 'kaihoisa'] },
  { text: 'nobody in this one has forgiven anybody', styles: ['tango'] },
  { text: 'quick, and not gentle about it', styles: ['humppa'] },
  { text: 'the floor fills whether it wants to or not', styles: ['humppa', 'jenkka'], moods: ['iloinen', 'tanssittava'] },
  { text: 'two minutes, and every one of them at speed', styles: ['humppa', 'jenkka'] },
  { text: 'one two three, and do not look at your feet', styles: ['valssi'] },
  { text: 'three to a bar, and the room goes round with it', styles: ['valssi'] },
  { text: 'hold on and keep turning', styles: ['valssi'], moods: ['romanttinen'] },
  { text: 'for the ones who came to sweat', styles: ['jenkka'] },
  { text: 'smooth, and slightly pleased with itself', styles: ['foksi'] },
  { text: 'a slow circuit of the floor, and back to your seat', styles: ['foksi'] },
  { text: 'nobody is in a hurry, least of all the bass player', styles: ['foksi', 'beguine'], moods: ['rento'] },
  { text: 'a warm night on a borrowed island', styles: ['beguine'] },
  { text: 'big hair, bigger key change', styles: ['iskelmapop'] },
  { text: 'wistful in the way that still rhymes', moods: ['haikea'] },
  { text: 'the long way home, in a minor key', moods: ['kaihoisa'] },
  { text: 'as remembered, which is not quite as it was', moods: ['nostalginen'] },
  { text: 'to get everybody up, which is the whole job', moods: ['iloinen', 'tanssittava'], slot: 'open' },
  { text: 'the one they will hum in the car park', slot: 'close' },
  { text: 'played every summer since, and not worn out yet' },
];

/**
 * Jazz: a club card.
 *
 * Understatement, and a house-band's view of the repertoire rather than a
 * critic's. The genre's own jokes are about tempo, about how hard the easy
 * things are, and about the size of the audience — so those are the jokes.
 * Nothing here calls anything "sophisticated", which is what a bill written
 * from outside the music would do.
 */
const JAZZ: Blurb[] = [
  { text: 'medium, and it stays medium — that is the hard part', styles: ['swing'] },
  { text: 'the tempo everyone can play and almost nobody plays well', styles: ['swing'], moods: ['swinging'] },
  { text: 'the one the whole book is built on', styles: ['swing'] },
  { text: 'count it in and hold on', styles: ['bebop'] },
  { text: 'the head twice, then every man for himself', styles: ['bebop'], moods: ['hot'] },
  { text: 'the one where the drummer picks up the brushes', styles: ['ballad'] },
  { text: 'take your time. the band certainly will', styles: ['ballad', 'modal'] },
  { text: 'quiet enough that you can hear the room', styles: ['ballad', 'bossa'] },
  { text: 'played for about eleven people, all of them listening', styles: ['ballad'], moods: ['smoky'] },
  { text: 'warm, quiet, and secretly very difficult', styles: ['bossa'] },
  { text: 'twelve bars. no further questions', styles: ['blues'] },
  { text: 'the same twelve bars as everyone else, played better', styles: ['blues'], moods: ['bluesy'] },
  { text: 'two chords and a great deal of nerve', styles: ['modal'] },
  { text: 'nowhere in particular to be, harmonically', styles: ['modal'], moods: ['dreamy', 'cool'] },
  { text: 'all downstrokes and no mercy', styles: ['gypsy'] },
  { text: 'for the last set, once the room has thinned out', moods: ['smoky'] },
  { text: 'nothing is rushed and nothing is missing', moods: ['cool'] },
  { text: 'something to play while the room settles', slot: 'open' },
  { text: 'the one they came for, kept until last', slot: 'close' },
  { text: 'somebody will take four choruses and nobody will mind' },
];

/**
 * Ambient: a gallery handout.
 *
 * The trap here is reverence — this music attracts writing that is entirely
 * adjectives, and a bill made of adjectives is unreadable. So the lines are
 * flat, slightly deadpan, and factual about things that are not quite facts.
 * The genre is funnier than its press, and a handout is allowed to know that.
 */
const AMBIENT: Blurb[] = [
  { text: 'half-remembered, and not by anyone here', styles: ['hauntology'] },
  { text: 'taped off the television in about 1979', styles: ['hauntology'], moods: ['warm'] },
  { text: 'nothing lives here and it is quite beautiful', styles: ['wasteland'] },
  { text: 'cold, and in no hurry to warm up', styles: ['wasteland'], moods: ['bleak'] },
  { text: 'the tape kept running after everyone had left', styles: ['wasteland', 'hauntology'] },
  { text: 'one chord, held until it means something', styles: ['drone'] },
  { text: 'nothing changes, and then it has', styles: ['drone', 'choral'] },
  { text: 'it does not begin so much as become audible', styles: ['drone'], moods: ['weightless'], slot: 'open' },
  { text: 'a sequencer, and a long way to go', styles: ['kosmische'] },
  { text: 'something is running underneath and it will not stop', styles: ['kosmische'], moods: ['pulse'] },
  { text: 'voices, and a room that is much too large', styles: ['choral'] },
  { text: 'for a building that was never built', styles: ['choral'], moods: ['sacred'] },
  { text: 'heard from underneath', styles: ['aquatic'] },
  { text: 'everything arrives slightly late and slightly bent', styles: ['aquatic'], moods: ['submerged'] },
  { text: 'no pulse, and no plans to acquire one', moods: ['weightless'] },
  { text: 'the room is being tuned rather than the band', slot: 'open' },
  { text: 'the long one. sit down', slot: 'close' },
  { text: 'best heard from the back, or from the corridor' },
];

const BLURBS: Record<string, Blurb[]> = {
  iskelma: ISKELMA,
  jazz: JAZZ,
  ambient: AMBIENT,
};

/** Last resort, and it should never be reached — a new genre needs its own table. */
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
  // twice reads as a bug, and with sixteen lines per genre against five numbers
  // there is no reason to allow it.
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
  const table = BLURBS[song.meta.genre];
  if (!table || !table.length) return HOUSE_BLURB;

  const slot: Slot | undefined = index === 0 ? 'open' : index === total - 1 ? 'close' : undefined;
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
