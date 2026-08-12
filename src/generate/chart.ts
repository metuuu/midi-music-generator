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
 *    that is an arrangement escalating rather than a coin landing differently. And
 *    the list can shorten as well as grow: `exits` takes the colour away for the
 *    song's last statement, which is the other direction and the commoner gesture.
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

/**
 * The layers an arrangement is allowed to take away.
 *
 * The same three `layersFor` already treats as optional, in the same order, and
 * that is not a coincidence worth hiding: the restraint clause at the bottom of
 * this file has been deleting the first of `brass`, `counter`, `pad` that a
 * section happens to have since before the chart existed. Everything else is the
 * band. A chart that removes the bass from the last chorus of a tanssilava foksi
 * has not arranged anything, it has sent someone home; the drums and the comp are
 * the same argument; and a section with no tune in it is not a thinner section, it
 * is a different kind of section, which is `layersFor`'s decision and not this
 * one's.
 */
const COLOUR: readonly LayerId[] = ['brass', 'counter', 'pad'];

/**
 * How often an arrangement strips at all.
 *
 * Low on purpose, and for the reason the device pool is small: a gesture that
 * fires in most songs is the texture of the catalogue rather than a property of
 * any song in it. At 0.3, 683 of 2800 numbers across fourteen genres — 24.4% —
 * come out thinner at the end than they went in. The other 2117 are the songs
 * they already were, to the note.
 *
 * The per-genre spread is 6.5% to 35% and every bit of it is earned rather than
 * declared. Ambient is the floor at 6.5% and indian sits just above it at 10.5%,
 * both because every style in both writes `requireLayers: ['pad']` — the drone
 * and the tanpura are the piece and neither can be taken away, so the only thing
 * either genre can ever drop is an answering line it does not often have. Iskelmä
 * tops it at 35%, because a humppa has four choruses, a full pavilion band and
 * something to spare in all of them. Nothing in this file had to know that.
 */
const STRIPS = 0.3;

export interface Chart {
  /** Which layers play in each kind of section. Constant across repeats, by design. */
  layers: Record<SectionKind, LayerId[]>;
  /**
   * The ordinal at which an optional layer first sounds, per kind's own count.
   * Absent means from the first one. This is the horns entering on the second
   * chorus — one of the oldest gestures there is, and previously inexpressible.
   */
  enters: Partial<Record<LayerId, number>>;
  /**
   * The ordinal at which a colour layer stops sounding, in the same units as
   * `enters` and read the same way. Absent means it never stops.
   *
   * The two together make `playing` a window rather than a threshold. They cannot
   * contradict one another because `planExits` never offers an exit to a layer
   * that has an entry — see the argument there, which is about players and not
   * about arithmetic.
   */
  exits: Partial<Record<LayerId, number>>;
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
 *
 * A window, and it used to be a threshold — `ordinal >= enters`, which is true
 * forever once it is true at all. That single comparison is why the engine could
 * build an arrangement and could not strip one.
 *
 * **The closing edge is only fitted to a section that states the tune**, and that
 * is a rule the measurement found rather than one the design foresaw. Dropping
 * back is a gesture *about* the melody: the band thins and the tune carries on
 * over the top of it, and the thinness is audible because there is still
 * something to be thin behind. A bridge or an intro has no tune in it, so taking
 * its colour away is not a drop-back at all — and in a `Soitto` kantele piece,
 * where the bass plays eight notes in three minutes and the comp sixteen, it left
 * a bridge with nothing sounding in it whatsoever. One silent section in 2800
 * songs, which is one too many: a section is a claim that something happens.
 */
export function playing(chart: Chart, kind: SectionKind, layer: LayerId, ordinal: number): boolean {
  const here = chart.layers[kind];
  if (!here.includes(layer)) return false;
  /**
   * The opening edge is the **chorus's**, because the chorus is what it was
   * decided from.
   *
   * `enters` is drawn against `layers.chorus` and counted in choruses — see
   * `planChart`, whose own comment says only the chorus is asked because it is
   * the only kind a song reliably has more than one of. Reading that number
   * against a verse's ordinal, or a bridge's, is a category error: it asks
   * "is this the second chorus?" of a section that is not a chorus, and any kind
   * the form states once answers no every time.
   *
   * **It was worth almost nothing to fix and had to be fixed anyway.** Measured
   * over 1,167 songs the scoping moves exactly one section in the whole
   * catalogue — 441 bridges with no melodic line become 440 — because a layer
   * held back from a first verse was mostly a layer the verse roster had not
   * offered in the first place. What changes is what the field can now be *used*
   * for: `peak` below sets an entry at the last chorus, and unscoped that would
   * silence the layer through the first two verses as well, for no reason any
   * listener could reconstruct.
   *
   * The closing edge stays cross-kind deliberately, and that asymmetry is not an
   * oversight: `planExits` counts `most` across every tune-bearing kind and
   * places the exit at the last of them, so a layer that leaves is leaving the
   * song rather than leaving the choruses.
   */
  if (kind === 'chorus' && ordinal < (chart.enters[layer] ?? 0)) return false;
  return !here.includes('melody') || ordinal < (chart.exits[layer] ?? Infinity);
}

export function planChart(args: {
  rng: Rng;
  style: Style;
  mood: Mood;
  density: number;
  beatsPerBar: number;
  /**
   * How many sections of each kind the form has. The one thing the chart is told
   * about the song rather than about the band, and it buys exactly one decision:
   * an exit is placed at a layer's *last* section rather than at a number drawn
   * blind. See `planExits`.
   */
  counts: Partial<Record<SectionKind, number>>;
  /** Genre-level weight overrides. A zero rules the device out of the idiom. */
  weights?: Partial<Record<Device, number>>;
}): Chart {
  const { rng, style, mood, density, beatsPerBar, counts } = args;

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

  /**
   * Somebody who arrives for the **last** chorus, and only for it.
   *
   * ## The fault
   *
   * The engine could build an arrangement and could strip one, and could not
   * make one *arrive*. `enters` above holds a layer back until the second
   * chorus, which is a real gesture and the wrong one for the end of a song: a
   * layer entering at chorus two is present for choruses two, three and four, so
   * the last chorus is exactly the second chorus again. Measured over 1,167
   * songs, **the last chorus of a song had the same number of players as the
   * first in 64% of them**, was louder by 1.6% of velocity — which is nothing —
   * and was actually *less* busy, by 0.09 onsets a beat. Nothing in the engine
   * had ever said "and then everyone comes in".
   *
   * That is the most recognisable gesture in recorded popular music and it is
   * the one thing a listener uses to know a song is ending rather than looping.
   *
   * ## Recruit before holding back
   *
   * Two ways to make a last chorus bigger, and the first is better. **Recruit**:
   * a colour layer the chorus roster has not got, added to the roster and given
   * an entry at the last one — a sound the song has genuinely not made before.
   * **Hold back**: a layer already in every chorus, kept out of all but the last
   * — the same players, arriving. The first is the stronger gesture, so it is
   * tried first, and the second is what a band with nobody spare does instead.
   *
   * Recruiting respects `excludeLayers` and nothing else needs guarding: a
   * roster is a claim about who is in the room, and `layersFor` has already
   * applied the style's veto to it. Holding back refuses a `requireLayers`
   * layer, because a style that has said a part must sound has not agreed to
   * three minutes without it.
   *
   * `planExits` skips any layer with an entry, so the one that arrives here is
   * never also the one that leaves — the two gestures stay one song apart by
   * construction rather than by a check.
   *
   * ## Why it runs before the devices are drawn
   *
   * A recruit joins `layers.chorus`, and `anywhere` reads that roster to decide
   * which devices this band is capable of — so placing this ahead of the draw
   * lets a recruited counter make `trade`, `harmony` and `unison` reachable, and
   * a recruited horn `riff` and `swell`.
   *
   * **It was moved after the draw and moved back, and the measurement is why.**
   * The argument for running last was that `available` asks *what kind of
   * ensemble is this*, and that a player heard for thirty seconds at the end is
   * not an answering line a whole arrangement can be built on. That reads well
   * and is worth nearly half the gesture: last-chorus-has-more-players measured
   * **63% running first against 35% running last**, mean layers +0.68 against
   * +0.29, and the last chorus came out *busier* than the first rather than
   * thinner. A recruit nobody may write a device for is a player standing at the
   * back holding an instrument.
   *
   * The concert checks that appeared to condemn the early ordering — an
   * accordion grasping seventeen semitones, one-armed drum figures at 0.49%
   * against a 0.4% bar — were a concurrent edit to `concert-check.ts` and the
   * drum models, not this. Run against a clean tree the early ordering reports
   * `graspable: none` and 0.28%, better than the 0.29% it started from.
   */
  const choruses = counts.chorus ?? 0;
  if (choruses >= 2 && rng.chance(0.55)) {
    const banned = new Set(style.excludeLayers ?? []);
    const required = new Set(style.requireLayers ?? []);
    const recruit = COLOUR.filter((l) => !layers.chorus.includes(l) && !banned.has(l));
    const holdBack = COLOUR.filter((l) => layers.chorus.includes(l)
      && enters[l] === undefined && !required.has(l));
    const pool = recruit.length ? recruit : holdBack;
    if (pool.length) {
      const layer = rng.pick(pool);
      if (!layers.chorus.includes(layer)) layers.chorus = [...layers.chorus, layer];
      enters[layer] = choruses - 1;
    }
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
    /**
     * Last in the literal, and that placement is the whole of why this was safe
     * to add.
     *
     * Object properties evaluate in source order, so every draw `planExits` makes
     * is taken after every draw the chart already made. A number whose
     * arrangement does not strip is therefore the number it was before, to the
     * note — the same layers, the same devices, the same riff — and the diff in
     * the catalogue is exactly the songs that gained the gesture. `layersFor`
     * ends with the same trick and says so for the same reason.
     */
    exits: planExits({ rng, style, layers, enters, counts }),
  };
}

/**
 * Where the arrangement takes something away.
 *
 * `enters` gave the chart a direction and it was the wrong one to have on its
 * own. A layer could hold back and arrive; it could not leave, because `playing`
 * compared the ordinal against one threshold and a threshold once passed is
 * passed for the rest of the song. So an arrangement could escalate and could not
 * strip — and **a last verse that drops back to the tune and the rhythm section
 * is the commonest arrangement gesture in popular music of any kind**, commoner
 * by a distance than the horns entering on the second chorus, which was the one
 * that could be said. A final chorus without the pad, and the whole back half of
 * a dub, went with it.
 *
 * Nobody reported this. Fourteen genres were written against a chart that only
 * builds, and fourteen authors wrote arrangements that only build, which is the
 * useful part: a missing direction does not present itself as a wall. It simply
 * never comes up.
 *
 * **This is the fault at the top of this file run backwards, and the difference
 * is monotonicity.** The measurement there is that the answering line was present
 * in some choruses and absent from others in 55% of jazz numbers — present,
 * absent, present — and that is an arrangement forgetting itself. A layer that
 * goes and stays gone says the opposite thing with the same silence: the song is
 * thinner at the end than it was at the start, in one direction, on purpose.
 * Flicker is the fault. A slope is an arrangement.
 *
 * **One draw for the whole gesture, not one per layer.** `enters` asks per layer
 * because arriving is a fact about a player — the horns come in for the second
 * chorus and the strings were always there. Leaving is a fact about the ending: a
 * band that drops back drops back together, and it is that dropping back, rather
 * than any one instrument's absence, that a listener hears. Three independent
 * coins at this rate would strip something in three songs out of four, which is
 * the tendency this file was written to stop being.
 *
 * **The ordinal is placed rather than drawn.** A blind draw from 1..3 would put
 * the exit past the end of a short form as often as not, and where it landed it
 * would mean *the layer played the opening and vanished* as readily as *the layer
 * sat out the last one* — two different pieces of music from one number. So the
 * chart is told the form's section counts and each layer leaves at the last
 * section of whichever tune-bearing kind it appears in most. That has a property
 * worth having for its own sake: because the count taken is the largest of those,
 * no kind can lose more than its final occurrence, and every kind the form has
 * fewer of keeps the layer from first bar to last. An intro and an outro are safe
 * whatever the form does — a section stated once has no last time to sit out.
 *
 * Four things are never taken, and each is a band breaking rather than an
 * arrangement thinning:
 *
 *  - **Anything outside `COLOUR`.** The rhythm section is not decoration and the
 *    tune is not decoration.
 *  - **A layer the style requires.** `requireLayers` exists because "the default
 *    arrangement rules treat `pad` as decoration" is "exactly backwards for music
 *    where the pad *is* the piece", and a genre that has said so has already
 *    answered this question. It is why ambient barely does this at all and never
 *    to the drone — which is right, for an idiom whose whole proposition is that
 *    sections arrive without being announced. A departure is an announcement.
 *  - **The pad, where nothing else is comping.** Seven styles across the
 *    catalogue put `comp` in `excludeLayers`; in those the pad is not colour, it
 *    is the harmony, and a section with no chord instrument left in it is not an
 *    arrangement decision.
 *  - **A layer that holds back.** Entering at the second chorus and leaving
 *    before the last is a player hired for the middle of the song, and `song.ts`
 *    already spends thirty lines on why a soloist heard for twelve seconds of
 *    three minutes is a fault rather than a texture. Forbidding the pair also
 *    makes `enters[l] < exits[l]` true by construction rather than by assertion:
 *    where an exit exists there is no entry, and every exit is at least 1.
 */
function planExits(args: {
  rng: Rng;
  style: Style;
  layers: Record<SectionKind, LayerId[]>;
  enters: Partial<Record<LayerId, number>>;
  counts: Partial<Record<SectionKind, number>>;
}): Partial<Record<LayerId, number>> {
  const { rng, style, layers, enters, counts } = args;
  const exits: Partial<Record<LayerId, number>> = {};
  if (!rng.chance(STRIPS)) return exits;

  // The kinds an exit can bite in at all — `playing` fits its closing edge only
  // to a section that states the tune, so counting the others would place the
  // gesture where nothing would come of it.
  const kinds = (Object.keys(layers) as SectionKind[]).filter((k) => layers[k].includes('melody'));
  const required = new Set(style.requireLayers ?? []);
  const comping = kinds.every((kind) => layers[kind].includes('comp'));
  for (const layer of COLOUR) {
    if (required.has(layer) || enters[layer] !== undefined) continue;
    if (layer === 'pad' && !comping) continue;
    const most = Math.max(
      0, ...kinds.filter((kind) => layers[kind].includes(layer)).map((kind) => counts[kind] ?? 0),
    );
    // Two is the least a gesture can be built from: one section to be heard in
    // and one to be missed in. A layer the form states once has no last time.
    if (most >= 2) exits[layer] = most - 1;
  }
  return exits;
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
