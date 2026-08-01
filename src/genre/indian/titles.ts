/**
 * Indian title generation.
 *
 * A piece in this repertoire is announced rather than named. What comes over
 * the microphone before a recital is *Rāg Yaman — vilambit ektāl, followed by a
 * drut teentāl*, which is a scale, a tempo and a cycle in that order and no
 * poetry at all. Records inherited it: a 78 of a khyāl has the rāga and the
 * tāla on the label and nothing else, because there is nothing else to say —
 * the piece is not a composition with a name, it is this rāga done today.
 *
 * That makes this the one genre here where a title is largely *derived* rather
 * than invented, and `TitleContext` turns out to carry almost exactly what the
 * announcement needs. `style` gives the tāla and the form, because in this
 * genre those are the same fact — `styles.ts` sorts by rāga against tāla, so a
 * style id **is** a cycle. And `bpm` gives the lay: under about 124 mātrās a
 * minute is *vilambit*, up to about 236 is *madhya*, above that is *drut*.
 * Those are the three words a musician uses and they are a tempo band, which is
 * the field this context already has.
 *
 * ## What cannot be announced, and why the rāga is missing from every title
 *
 * The rāga is the first word of a real announcement and it is absent from every
 * title this file produces. `TitleContext` carries `style`, `mood` and `bpm`,
 * and **not the mode** — and mode is the only thing that decides which of a
 * style's two rāgas the song is actually in, because that is the single lever
 * `scaleForChord` has (see the pairing rule in `styles.ts`). Naming one of the
 * two would be right half the time, and a piece announced as Yaman that is in
 * Simhendramadhyamam is not a poetic liberty, it is a mislabelled record. The
 * whole reason `TitleContext` exists is stated in `genre/types.ts` — *an
 * announcement that disagrees with the music is worse than no announcement at
 * all* — so the rāga is left out rather than guessed.
 *
 * The other half of the pool is imagery, and it stays domestic on purpose:
 * courtyards, lamps, rain, a terrace, the hour before light. The failure mode
 * this genre invites is the travel poster — elephants, temples, mysticism — and
 * the corrective is that a rāga is named after a time of day and the weather,
 * which are the least exotic subjects there are. The words below are the ones
 * the poetry this music sets actually uses.
 */

import type { Rng } from '../../core/rng.js';
import type { TitleContext } from '../types.js';

/**
 * Which cycle each style is in, for the announcement.
 *
 * A duplicate of the `Tala` each style spreads, and deliberately a duplicate
 * rather than a lookup: the tables in `styles.ts` carry slot arrays and beat
 * counts, and there is nothing in them a cycle is *called*. Dhrupad's entry is
 * why the map cannot be derived from `beatsPerBar` either — it shares ektāl's
 * twelve beats and is announced as chautāl, because it is played on a pakhāwaj
 * and that is a different tāla with the same length.
 *
 * A style missing from here has no cycle, which is a real statement about four
 * of them: an ālāp is not in a tāla, so it cannot be announced as being in one.
 */
const TALA: Record<string, string> = {
  jhala: 'Teentāl', bandish: 'Teentāl', mujra: 'Teentāl',
  dhrupad: 'Chautāl',
  vilambit: 'Ektāl',
  gat: 'Rupak', fusiongat: 'Rupak',
  tarana: 'Jhaptāl', jugalbandi: 'Jhaptāl',
  thumri: 'Dādrā', ghazal: 'Dādrā',
  bhajan: 'Keherwā', qawwali: 'Keherwā', dhun: 'Keherwā', filmi: 'Keherwā',
  cabaret: 'Keherwā', bhangra: 'Keherwā', ragarock: 'Keherwā',
  varnam: 'Ādi Tāla', kriti: 'Ādi Tāla', santoor: 'Ādi Tāla',
  tillana: 'Misra Chāpu',
  padam: 'Khaṇḍa Chāpu', svara: 'Khaṇḍa Chāpu',
};

/**
 * The lay — the tempo class — from the printed BPM.
 *
 * One mātrā is one eighth note throughout this genre (the argument is at the
 * top of `styles.ts`), so the mātrā rate is twice the BPM and the thresholds
 * below are 124 and 236 mātrās a minute in the units this context actually
 * hands over. The boundaries are soft in practice and these are the middle of
 * where people put them.
 */
function lay(bpm: number): string {
  if (bpm < 62) return 'Vilambit';
  if (bpm < 118) return 'Madhya';
  return 'Drut';
}

/** The hour a piece belongs to. Rāgas are assigned times of day; titles follow. */
const TIMES = [
  'dawn', 'first light', 'morning', 'midday', 'afternoon', 'evening',
  'dusk', 'midnight', 'late', 'the last hour', 'the hour before light',
];

/** Domestic and weather nouns — the subjects the sung poetry actually has. */
const PLACES = [
  'courtyard', 'terrace', 'threshold', 'window', 'garden', 'road', 'well',
  'river', 'doorway', 'stair', 'roof', 'field', 'orchard', 'gate', 'bank',
  'crossing', 'veranda', 'lane', 'shade', 'ferry',
];

const THINGS = [
  'rain', 'lamp', 'jasmine', 'dust', 'smoke', 'kite', 'peacock', 'lotus',
  'ash', 'moon', 'thread', 'bangle', 'anklet', 'mirror', 'flute', 'boat',
  'letter', 'monsoon', 'cloud', 'honey',
];

/** Adjectives of waiting and weather. Split so a fast piece is not called slow. */
const STILL_STATES = [
  'unlit', 'flooded', 'still', 'far', 'half-open', 'unswept', 'cool',
  'waiting', 'returning', 'slow', 'empty', 'quiet',
];

const BRIGHT_STATES = [
  'burning', 'high', 'turning', 'open', 'crowded', 'running', 'bright',
  'gathering', 'rising', 'loud',
];

const SEASONS = ['monsoon', 'spring', 'the hot months', 'the cold months', 'harvest'];

const COUNTS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];

/**
 * Syllables for a coined proper noun.
 *
 * Kept away from the rāga names on purpose — a coinage that lands on a real
 * rāga would be announcing a rāga again, and this file has just spent a
 * paragraph explaining why it cannot. So the codas are drawn from the
 * *place-name* end of the vocabulary rather than the mode-name end, which is
 * where -pur, -garh and -bad live, and the result reads as somewhere rather
 * than as something to play.
 */
const ONSETS = [
  'chan', 'dhan', 'gau', 'hem', 'jal', 'kal', 'mal', 'nan', 'pra', 'sam',
  'tar', 'vas', 'nir', 'vin', 'sar', 'ban', 'ind', 'meh', 'raj', 'som',
];

const CODAS = [
  'pur', 'garh', 'bad', 'khand', 'kot', 'nagar', 'ghat', 'vada', 'palli',
  'kunda', 'sarai', 'mahal', 'bagh', 'tola',
];

function capitalise(s: string): string {
  return s.replace(/(^|[ -])([a-z])/g, (_, sep: string, c: string) => sep + c.toUpperCase());
}

/**
 * The mood decides which half of the adjective pool is legal, which is the same
 * filtering `TitleContext` was built for and the cheapest possible version of
 * it: an utsav number called "Unlit Courtyard" and a karuṇā ālāp called "Loud
 * Rain" are both the mistake this parameter exists to prevent.
 */
function states(mood: string): string[] {
  if (mood === 'vira' || mood === 'utsav') return BRIGHT_STATES;
  if (mood === 'shanta' || mood === 'karuna') return STILL_STATES;
  return [...STILL_STATES, ...BRIGHT_STATES];
}

export function generateTitle(rng: Rng, ctx: TitleContext): string {
  const tala = TALA[ctx.style.id];
  const state = () => rng.pick(states(ctx.mood.id));

  const pattern = rng.weighted([
    // The announcement, which is what a real programme prints and is therefore
    // weighted above everything else — but only where there is a cycle to
    // announce. An ālāp draws these at zero and gets imagery instead.
    ['lay-tala', tala ? 7 : 0],
    ['form-tala', tala ? 5 : 0],
    ['form-alone', tala ? 0 : 6],
    ['time-place', 5],
    ['state-place', 4],
    ['thing-place', 4],
    ['coined', 4],
    ['the-time', 3],
    ['season-thing', 3],
    ['prahar', 2],
    ['state-thing', 2],
  ] as const);

  switch (pattern) {
    // "Drut Teentāl". Three words, no article, and exactly what is on the label
    // of a 78.
    case 'lay-tala':
      return `${lay(ctx.bpm)} ${tala}`;
    // "Tarānā in Jhaptāl" — the form and the cycle, which is what a programme
    // prints when the same rāga is being kept across two items.
    case 'form-tala':
      return `${ctx.style.label} in ${tala}`;
    // No cycle to name, so the form has to carry it alone. An ālāp announced as
    // an ālāp is a complete announcement.
    case 'form-alone':
      return `${ctx.style.label}`;
    case 'time-place':
      return capitalise(`${rng.pick(TIMES)} ${rng.pick(PLACES)}`);
    case 'state-place':
      return capitalise(`${state()} ${rng.pick(PLACES)}`);
    case 'thing-place':
      return capitalise(`${rng.pick(THINGS)} ${rng.pick(PLACES)}`);
    case 'coined':
      return capitalise(`${rng.pick(ONSETS)}${rng.pick(CODAS)}`);
    case 'the-time':
      return capitalise(`the ${rng.pick(TIMES)}`);
    case 'season-thing':
      return capitalise(`${rng.pick(SEASONS)} ${rng.pick(THINGS)}`);
    // The day is eight watches of three hours and every rāga belongs to one of
    // them. Naming the watch says what time of day the piece is without
    // claiming which rāga it is.
    case 'prahar':
      return capitalise(`${rng.pick(COUNTS)} prahar`);
    case 'state-thing':
      return capitalise(`${state()} ${rng.pick(THINGS)}`);
  }
}
