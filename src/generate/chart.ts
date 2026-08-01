/**
 * The chart — what *this* arrangement is made of, decided once for the whole song.
 *
 * Every device in this engine that makes a band sound arranged already existed
 * before this file: phrases handed from the lead to the second horn, a line in
 * thirds under the tune, the whole rhythm section catching the hook for a bar,
 * brass punctuating the holes. Each one was also an independent coin flip taken
 * fresh in every section, and that produced two faults at once, opposite in
 * direction and identical in cause.
 *
 * **Inside a song, nothing held.** Measured over 400 jazz numbers with more than
 * one chorus, the answering line was present in some choruses and absent from
 * others in 55% of them, and the brass in 48% — against 0% for the comp, the pad
 * and the tune, which are all drawn once and stay drawn. The same eight bars came
 * back with the same melody, the same changes and the same comping pattern, and
 * the horn section had wandered off. That is not sparseness. It is an arrangement
 * forgetting itself between one chorus and the next.
 *
 * **Across songs, everything was the same.** Six devices at roughly even odds
 * apiece means every number gets about half of them, so no number is *about* any
 * of them. A piece where the two horns state the head together and never trade is
 * a different piece from one built on trading, and rolling both at 50% produces
 * neither — it produces the average of the two, once per song, forever.
 *
 * So the chart is drawn before a note is written, and it says two things:
 *
 *  - **Which layers play, per section kind.** Not per section. A second chorus may
 *    bring the horns in where the first did not — `enters` says so explicitly, and
 *    that is an arrangement escalating rather than a coin landing differently.
 *  - **Which devices this arrangement is built from**, as a small subset. Most
 *    songs get two. The ones not drawn do not fire at reduced probability; they do
 *    not fire.
 *
 * A device, once drawn, is *placed* rather than re-rolled. Some recur — a harmony
 * line is a colour and belongs in every chorus that earns it. Some happen once —
 * handing a phrase over is a surprise, and a surprise that arrives on schedule
 * four times is a texture. `tradeAt` names the chorus it happens in, and that is
 * the whole difference between an arrangement and a tendency.
 */

import type { LayerId, SectionKind } from '../core/types.js';
import type { Rng } from '../core/rng.js';
import type { Mood, Style } from '../style/types.js';

/**
 * The gestures an arrangement can be built from.
 *
 * Each names a mechanism that already exists in `tune/band.ts` or in the part
 * generators. Nothing here is a new sound; what is new is that a song either has
 * the gesture or does not, rather than having a 45% chance of it eight times.
 */
export type Device =
  /** The lead states a phrase and stops; the second instrument takes it over. */
  | 'trade'
  /** The answering line stops answering and joins the tune in thirds or sixths. */
  | 'harmony'
  /** Two players state the tune *together*, in octaves. See `joinIn`. */
  | 'unison'
  /** The whole band drops the groove and plays the hook's rhythm for a bar. */
  | 'tutti'
  /** The horns answer with one figure, restated, instead of fresh stabs. */
  | 'riff'
  /** The horns sustain underneath the tune's long notes. */
  | 'swell';

export const DEVICES: readonly Device[] = ['trade', 'harmony', 'unison', 'tutti', 'riff', 'swell'];

/** Which layer a device needs before it can be drawn at all. */
const NEEDS: Partial<Record<Device, LayerId>> = {
  trade: 'counter', harmony: 'counter', unison: 'counter', riff: 'brass', swell: 'brass',
};

/**
 * Default odds — flat by intent, and unequal on the page because a weight is not
 * an outcome.
 *
 * The interesting variation is *which* devices a song draws rather than which one
 * is likeliest, so the target is a roughly even spread of appearances. Two things
 * stop equal weights producing that, and both corrections are measured rather than
 * guessed:
 *
 *  - **`tutti` is drawable in every song**, needing no layer beyond a rhythm
 *    section, where the others need horns or an answering line and are therefore
 *    available in about half. At 4 it appeared in 36% of jazz numbers against
 *    13–23% for everything else, purely on availability. At 3 it sits with them.
 *  - **`swell` produces fewer notes than it is asked about.** It fires only on the
 *    tune's long notes, so an arrangement that draws it still spends most of its
 *    bars elsewhere, and the layer as a whole read 4% sustained where a horn
 *    section's vocabulary should be nearer a quarter. The weight buys frequency
 *    to make up for a device that is quiet by construction.
 *
 * A genre that wants a different answer says so in `Genre.arrangement` rather than
 * by nudging these.
 */
const POOL: Record<Device, number> = {
  trade: 4, harmony: 4, unison: 3, tutti: 3, riff: 3, swell: 8,
};

/**
 * How many devices an arrangement is built from.
 *
 * Two, usually. One is a number with a single idea in it, which is a real and
 * common thing; three is a chart. Zero is left in at low weight on purpose —
 * a head, some solos and a head, with nothing written around it, is most of the
 * records this repertoire is made of, and a generator that cannot produce a plain
 * arrangement has not made the other ones mean anything.
 */
const COUNT: (readonly [number, number])[] = [[0, 1], [1, 3], [2, 5], [3, 4], [4, 2]];

export interface Chart {
  /** Which layers play in each kind of section. Constant across repeats, by design. */
  layers: Record<SectionKind, LayerId[]>;
  /**
   * The ordinal at which an optional layer first sounds, per kind's own count.
   * Absent means from the first one. This is the horns entering on the second
   * chorus — one of the oldest gestures there is, and previously inexpressible.
   */
  enters: Partial<Record<LayerId, number>>;
  devices: ReadonlySet<Device>;
  /** Which chorus the phrase is handed over in. Once per song, never twice. */
  tradeAt: number;
  /** Scale steps below the tune the harmony line sits: 2 is thirds, 5 is sixths. */
  harmonyBelow: number;
  /** Whether the unison is at the octave rather than at pitch. */
  unisonOctave: boolean;
  /** The riff, as beat offsets inside a bar. Empty unless `riff` was drawn. */
  riff: readonly number[];
  /** How often the riff comes round, in bars. */
  riffEvery: number;
}

export function has(chart: Chart, device: Device): boolean {
  return chart.devices.has(device);
}

/**
 * Whether a layer sounds in this section, given the chart and how many sections
 * of the kind have already gone by.
 */
export function playing(chart: Chart, kind: SectionKind, layer: LayerId, ordinal: number): boolean {
  if (!chart.layers[kind].includes(layer)) return false;
  return ordinal >= (chart.enters[layer] ?? 0);
}

export function planChart(args: {
  rng: Rng;
  style: Style;
  mood: Mood;
  density: number;
  beatsPerBar: number;
  /** Genre-level weight overrides. A zero rules the device out of the idiom. */
  weights?: Partial<Record<Device, number>>;
}): Chart {
  const { rng, style, mood, density, beatsPerBar } = args;

  const kinds: SectionKind[] = ['intro', 'verse', 'chorus', 'bridge', 'solo', 'outro'];
  const layers = {} as Record<SectionKind, LayerId[]>;
  for (const kind of kinds) layers[kind] = layersFor(kind, style, density, mood, rng);

  /**
   * Where an optional layer holds back.
   *
   * Only the chorus is asked, because it is the only kind a song reliably has
   * more than one of — an entry rule on a bridge that occurs once is a coin flip
   * with extra steps.
   */
  const enters: Partial<Record<LayerId, number>> = {};
  for (const layer of ['brass', 'counter'] as LayerId[]) {
    if (layers.chorus.includes(layer) && rng.chance(0.4)) enters[layer] = 1;
  }

  const anywhere = (layer: LayerId): boolean => kinds.some((k) => layers[k].includes(layer));
  const weights = { ...POOL, ...args.weights };
  const available = DEVICES.filter((d) => {
    if ((weights[d] ?? 0) <= 0) return false;
    const need = NEEDS[d];
    return need === undefined || anywhere(need);
  });

  /**
   * Drawn from the whole pool, and a draw that lands on something this band cannot
   * do is *spent* rather than redirected.
   *
   * The obvious version — draw only from what is available — quietly hands an
   * absent device's odds to whatever is left, and the smaller the band the worse
   * it gets. Measured that way, `tutti` landed in 46% of jazz numbers against 20%
   * for everything else, for no better reason than that it is the one device
   * needing neither horns nor an answering line: any song without those two had a
   * pool of exactly one, and a pool of one is drawn from every time.
   *
   * Spending the draw instead says the true thing. A quartet with no second horn
   * does not compensate by hitting more figures together; it plays a plainer
   * arrangement, and the plainness is the point.
   */
  const devices = new Set<Device>();
  const wanted = rng.weighted(COUNT);
  const bag = DEVICES.filter((d) => (weights[d] ?? 0) > 0).map((d) => [d, weights[d]!] as const);
  for (let i = 0; i < wanted; i++) {
    const left = bag.filter(([d]) => !devices.has(d));
    if (!left.length) break;
    const drawn = rng.weighted(left);
    if (available.includes(drawn)) devices.add(drawn);
  }

  return {
    layers,
    enters,
    devices,
    // The second chorus if there is one, which is where a hand-over lands: the
    // tune has been stated once, so there is something to hand over.
    tradeAt: rng.chance(0.7) ? 1 : 2,
    harmonyBelow: rng.chance(0.65) ? 2 : 5,
    unisonOctave: rng.chance(0.6),
    riff: devices.has('riff') ? riffFigure(rng, beatsPerBar) : [],
    riffEvery: rng.weighted([[2, 5], [4, 4]] as const),
  };
}

/**
 * A rhythmic figure for the horns, in beats from the top of a bar.
 *
 * Two or three attacks, none of them on the downbeat. The reasoning is the one
 * already in `generateBrass`: a brass hit on beat one thickens an accent the
 * rhythm section has already made, and the same hit an eighth later is what makes
 * a chart sound scored. What is new is only that it is the *same* figure every
 * time it comes round, which is the difference between a riff and a habit.
 */
function riffFigure(rng: Rng, beatsPerBar: number): number[] {
  const slots: number[] = [];
  for (let b = 0; b < beatsPerBar; b++) { slots.push(b + 0.5); if (b > 0) slots.push(b); }
  const pool = slots.filter((s) => s > 0).sort((a, b) => a - b);
  const count = rng.weighted([[2, 5], [3, 3]] as const);
  const chosen = new Set<number>();
  for (let i = 0; i < count && chosen.size < pool.length; i++) {
    chosen.add(rng.weightedBy(pool, (s) => (Number.isInteger(s) ? 1 : 3)));
  }
  return [...chosen].sort((a, b) => a - b);
}

/**
 * Which layers a kind of section is made of.
 *
 * Moved here from `song.ts` unchanged in its odds and changed entirely in when it
 * runs: once per *kind* rather than once per section. Every draw it makes is now a
 * statement about the song instead of about eight bars of it.
 */
function layersFor(
  kind: SectionKind, style: Style, density: number, mood: Mood, rng: Rng,
): LayerId[] {
  const base: Record<SectionKind, LayerId[]> = {
    intro: ['drums', 'bass', 'comp'],
    verse: ['drums', 'bass', 'comp', 'melody'],
    chorus: ['drums', 'bass', 'comp', 'pad', 'melody'],
    bridge: ['drums', 'bass', 'comp', 'pad'],
    solo: ['drums', 'bass', 'comp', 'pad', 'melody'],
    outro: ['drums', 'bass', 'comp', 'pad'],
  };
  const layers = new Set(base[kind]);

  const add = (layer: LayerId, p: number): void => { if (rng.chance(p)) layers.add(layer); };

  if (kind === 'verse') add('pad', density * 0.7);
  if (kind === 'chorus') { add('brass', density * 0.8); add('counter', density * 0.7); }
  if (kind === 'verse') add('counter', density * 0.45);
  if (kind === 'bridge') add('counter', density * 0.5);
  if (kind === 'intro') { add('pad', density); add('melody', 0.35); }
  if (kind === 'outro') { add('melody', 0.5); add('brass', density * 0.4); }

  // Restrained moods thin the texture out.
  if (mood.restraint > 0 && rng.chance(mood.restraint * 0.35)) {
    for (const candidate of ['brass', 'counter', 'pad'] as LayerId[]) {
      if (layers.has(candidate)) { layers.delete(candidate); break; }
    }
  }

  // The style's own veto and guarantee, applied last so they always win — and
  // applied after every `rng` draw above, so adding them to a style cannot
  // shift the stream for any style that does not use them.
  for (const layer of style.excludeLayers ?? []) layers.delete(layer);
  for (const layer of style.requireLayers ?? []) layers.add(layer);
  return [...layers];
}
