/**
 * Groove — what a body does while the music happens, whether or not it is
 * playing.
 *
 * This is a separate track from the note gestures and it is separate on
 * purpose. Playing an instrument and feeling a pulse are different behaviours
 * with different sources: one comes from *this* player's notes, the other from
 * what the *band* is doing. Fold them together and a player with eight bars'
 * rest has nothing to do — which is the difference between a band and a rack of
 * animatronics, and it is visible from the back of the room.
 *
 * Three claims are doing the work here, and each of them is the answer to a way
 * this system could look cheap:
 *
 *  1. **The pulse is read off the drums, not off the metre.** Deriving it from
 *     `beatsPerBar` would give a humppa and a jazz ballad the same nod, which is
 *     wrong about both — they are both 4/4 and one is felt in a fast two at
 *     150 bpm while the other is felt in slow half notes at 68. Where the kick
 *     lands is the pulse; where the snare lands is the backbeat. Measured over
 *     24 songs of each style:
 *
 *         humppa      2 beats, 24/24   0.81 s   from the kick
 *         swing       2 beats, 24/24   0.79 s   from the ride
 *         ballad      2 beats, 24/24   1.76 s   from the ride
 *         bebop       2 beats, 24/24   0.50 s   from the ride
 *         aquatic     1 beat,  21/24   0.54 s   from the kick
 *         drone       4 beats, 24/24   4.29 s   from the bar
 *
 *     Every one of those is what a musician would say by hand, and no two of
 *     them are what the metre alone would have said.
 *  2. **Nobody is in phase with anybody.** A band nodding in perfect unison is
 *     the single most robotic thing this file could produce, and the fix is a
 *     per-performer offset drawn from the performer id. It is expressed in
 *     *seconds* and converted, because how far apart two people drift is a fact
 *     about people and not about tempo.
 *  3. **Amplitude comes from the form.** `generate/dynamics.ts` already knows
 *     that a chorus is bigger than an intro and that records build; a body
 *     obeys the same curve, so the two cannot disagree.
 *
 * Nothing here emits geometry. A `head-nod` is a period and an amplitude, and
 * how far a head actually travels is the renderer's business.
 */

import { SLOTS_PER_BEAT, quantise, slotOf } from '../core/grid.js';
import { Rng } from '../core/rng.js';
import type { DrumVoice, LayerId, Section, Song } from '../core/types.js';
import { sectionIntensity } from '../generate/dynamics.js';
import { GENRES } from '../genre/index.js';
import { playerFor } from './cast.js';
import type {
  Cast, GrooveBehaviour, GroovePart, GrooveScore, Performer, Span,
} from './types.js';

// ---------------------------------------------------------------------------
// Constants, all of them physical rather than musical
// ---------------------------------------------------------------------------

/**
 * How completely a metrical level has to be articulated before the body will
 * feel it there.
 *
 * Not 1.0, and the missing quarter is the point. A `linn-backbeat` kick sits on
 * 1 and the *and* of 3, which articulates none of the four beats cleanly; add
 * the snare on 2 and 4 and three of the four are struck. At a threshold of 1.0
 * that pattern falls all the way through to the bar and the band sways once
 * every two seconds to an eighties pop song. At 0.75 it nods on the beat, which
 * is what anybody in the room would do.
 */
const LEVEL_COVERAGE = 0.75;

/**
 * The fastest a head will nod, in seconds per nod.
 *
 * A humppa at 150 bpm with a four-on-the-floor kick articulates the beat
 * perfectly well, and a head going 150 times a minute is a woodpecker. Real
 * bodies pick a slower metrical level when the fast one gets silly, so the
 * detected pulse is folded up — always by whole levels, so the nod stays in
 * phase with the bar it came from.
 */
const NOD_FLOOR_SECONDS = 0.42;

/** A foot goes faster than a head. Only bebop tempos ever reach this. */
const TAP_FLOOR_SECONDS = 0.28;

/**
 * How far out of phase two players' bodies sit, at the extreme.
 *
 * In seconds, not beats, and that is the substantive choice. Two people
 * standing next to each other drift apart by some tens of milliseconds whatever
 * the tempo is; expressing it in beats would make a ballad look tight and a
 * bebop head look sloppy, which is exactly backwards — at 280 bpm a band is
 * *more* locked, not less.
 */
const PHASE_SECONDS = 0.06;

/**
 * How much of its own slice a player may wander within. See `phaseCentres`.
 *
 * Under a half, so two neighbouring players can never swap or meet: at 0.5 the
 * slices would touch and the guarantee would be arithmetic luck again.
 */
const PHASE_JITTER = 0.35;

/**
 * How much of the section-energy range the body actually uses.
 *
 * `sectionIntensity` spans roughly 0.55 to 1.06. Mapping that straight onto
 * 0..1 would make an intro nearly motionless, and a player who stops moving
 * reads as a dropped frame rather than as a quiet passage. The floor is what
 * keeps an intro alive.
 */
const AMPLITUDE_FLOOR = 0.18;

/**
 * How much body a genre has, when it has not said.
 *
 * The number itself is staging rather than mixing, and it is the same axis §8.4
 * dresses the band on: a tanssilava band is playing for a full dance floor, a
 * jazz quintet is playing for people at tables, and half an ambient act is
 * behind a table not making eye contact. Applied as a multiplier so the *shape*
 * of the energy curve survives — an ambient chorus is still bigger than an
 * ambient intro.
 *
 * Which is exactly why the per-genre numbers are not here any more. They were a
 * four-entry `Record` keyed by genre id, and a genre added without an entry took
 * this default silently — the number below is a shade under a dance band, so an
 * unstated genre moves like iskelmä with the volume off rather than like
 * anything anybody chose. Each genre now states its own: `Staging.body`.
 *
 * This stays, and it is not a stub. A genre that has declared no staging at all
 * should still have bodies on the stage, and a default in the middle is the only
 * honest answer to "how much does music we know nothing about move".
 */
const GENRE_BODY_DEFAULT = 0.9;

/**
 * The kick is the pulse; the backbeat completes it where the kick is
 * syncopated; a cymbal keeps time where there is no kick at all.
 *
 * The order is the order a listener resolves them in. The cymbals are tried one
 * at a time rather than as a group because they are not interchangeable: on
 * `brushes-ballad` the ride plays 1 and 3 and the brush swirls every beat, and
 * unioning them would put the ballad's nod on the beat instead of on the half
 * note. The ride is what the drummer is *keeping time on*; the swirl is
 * texture.
 */
const KICK: DrumVoice[] = ['bd'];
const BACKBEAT_VOICES: DrumVoice[] = ['sd', 'rim', 'cp'];
const TIMEKEEPERS: DrumVoice[][] = [['rd'], ['hh'], ['oh'], ['sh']];

// ---------------------------------------------------------------------------
// Reading the pulse off the pattern
// ---------------------------------------------------------------------------

/** Where the pulse came from. Reported by the verifier; nothing else reads it. */
export type PulseSource =
  | 'kick' | 'kick+backbeat' | 'ride' | 'hats' | 'kit' | 'bass' | 'bar';

export interface Pulse {
  pulseBeats: number;
  backbeats: number[];
  source: PulseSource;
}

/** Which bars a set of onsets touches at all. The denominator below. */
function barsTouched(beats: number[], barBeats: number): number {
  const slotsPerBar = Math.round(barBeats * SLOTS_PER_BEAT);
  const bars = new Set<number>();
  for (const beat of beats) {
    if (beat >= 0) bars.add(Math.floor(slotOf(beat) / slotsPerBar));
  }
  return bars.size;
}

/**
 * The positions within a bar that a set of onsets actually keeps returning to.
 *
 * A histogram rather than a reading of the style table, for two reasons. The
 * style table is not reachable from a `Song` — only the events are, which is
 * the whole architectural claim of this directory — and the events carry things
 * the table does not: the drum fill at the end of every section, the landing
 * crash on the next downbeat, and whichever bars the arrangement left the kit
 * out of. Requiring a position to recur in half the bars strips all three,
 * because a fill happens once per section and the pattern happens every bar.
 *
 * **The denominator is the whole kit's bars, not this voice's**, and getting
 * that wrong produced the one genuinely misleading answer this file has given.
 * A `ride-swing` song has no snare in its pattern at all; the only snares in it
 * are fill snares, in fourteen bars out of a hundred and four. Counted against
 * its own fourteen bars the commonest fill position cleared 50% and was
 * reported as the backbeat — a whole band leaning on a hit that happens once a
 * chorus. Counted against the hundred and four it is 7% and disappears, while
 * the hi-hat on 2 and 4 stands at 77% and is exactly what it looks like.
 *
 * Quantised through `core/grid.ts` first, so a swung offbeat lands where the
 * audio will actually play it rather than a third of a slot earlier — which
 * also collects the float noise `applySwingDrums` leaves behind onto one slot.
 */
function recurringPositions(beats: number[], barBeats: number, bars: number): number[] {
  if (bars <= 0) return [];
  const slotsPerBar = Math.round(barBeats * SLOTS_PER_BEAT);
  const bySlot = new Map<number, Set<number>>();

  for (const beat of beats) {
    if (beat < 0) continue;
    const slot = slotOf(beat);
    const bar = Math.floor(slot / slotsPerBar);
    const within = ((slot % slotsPerBar) + slotsPerBar) % slotsPerBar;
    let seen = bySlot.get(within);
    if (!seen) { seen = new Set(); bySlot.set(within, seen); }
    seen.add(bar);
  }

  const needed = Math.min(bars, Math.max(2, Math.ceil(bars * 0.5)));
  return [...bySlot.entries()]
    .filter(([, seen]) => seen.size >= needed)
    .map(([slot]) => slot / SLOTS_PER_BEAT)
    .sort((a, b) => a - b);
}

/**
 * The metrical levels a bar of this length can be divided into, coarsest first.
 *
 * Restricted to divisors of the bar. A pulse that does not divide the bar drifts
 * against the music — a 1.5-beat nod over 4/4 is a hemiola, and a band does not
 * accidentally play one — and restricting the candidates is also what keeps a
 * beguine's kick on 1, the *and* of 2 and 4 from being read as a pulse in
 * dotted quarters.
 */
function candidateLevels(barBeats: number): number[] {
  const slotsPerBar = Math.round(barBeats * SLOTS_PER_BEAT);
  const out: number[] = [];
  for (let parts = 2; parts <= slotsPerBar; parts++) {
    if (slotsPerBar % parts === 0) out.push(barBeats / parts);
  }
  return out;
}

/**
 * The finest level these onsets articulate.
 *
 * Finest rather than coarsest, because every pattern with a downbeat
 * articulates the bar perfectly and the bar is the answer we already had. What
 * is worth knowing is how far *down* the pattern commits, and that is the level
 * the body picks up.
 */
function levelFrom(positions: number[], barBeats: number): number | undefined {
  if (positions.length < 2) return undefined;
  const struck = new Set(positions.map((p) => slotOf(p)));
  const levels = candidateLevels(barBeats);
  for (let i = levels.length - 1; i >= 0; i--) {
    const period = levels[i]!;
    const count = Math.round(barBeats / period);
    let hit = 0;
    for (let k = 0; k < count; k++) if (struck.has(slotOf(k * period))) hit++;
    if (hit / count >= LEVEL_COVERAGE) return period;
  }
  return undefined;
}

/** Fold a period up by whole metrical levels until a body could keep it. */
function slowToHuman(period: number, barBeats: number, bpm: number, floor: number): number {
  const levels = [...candidateLevels(barBeats), barBeats].sort((a, b) => a - b);
  let out = period;
  while (seconds(out, bpm) < floor) {
    // Prefer doubling; take the next level up where doubling is not available,
    // which is what 3/4 needs — there is no 2-beat level in a waltz, so a fast
    // waltz goes to one-in-a-bar rather than to a hemiola.
    const next = levels.find((l) => l > out * 1.5);
    if (next === undefined) break;
    out = next;
  }
  return out;
}

function seconds(beats: number, bpm: number): number {
  return (beats * 60) / bpm;
}

/**
 * The backbeat, which is a different question from the pulse.
 *
 * Two rules, and both exist because of a specific pattern that would otherwise
 * lie. Backbeat positions must land on a beat: `ride-bop` puts a snare on the
 * *and* of 3, which is a comping bomb rather than a backbeat, and reporting it
 * as one would have half the band leaning on a syncopation. And where the snare
 * has nothing to say, a hi-hat with no more than two positions in the bar is
 * read instead: in every jazz pattern here the backbeat is the left foot on the
 * hats on 2 and 4, and a hi-hat playing eighths is timekeeping rather than a
 * backbeat, which is what the count guard separates.
 */
function readBackbeats(byVoice: Map<DrumVoice, number[]>, barBeats: number): number[] {
  const onBeat = (positions: number[]): number[] =>
    positions.filter((p) => p > 0 && Number.isInteger(p));

  const struck = BACKBEAT_VOICES.flatMap((v) => byVoice.get(v) ?? []);
  const primary = onBeat([...new Set(struck)].sort((a, b) => a - b));
  if (primary.length) return primary;

  for (const voice of ['hh', 'oh'] as DrumVoice[]) {
    const positions = byVoice.get(voice) ?? [];
    if (!positions.length || positions.length > barBeats / 2) continue;
    const beats = onBeat(positions);
    if (beats.length) return beats;
  }
  return [];
}

/** The bass line's own recurring onsets, counted against its own bars. */
function bassPositions(song: Song, barBeats: number): number[] {
  const beats = song.tracks.find((t) => t.layer === 'bass')?.notes.map((n) => n.beat) ?? [];
  return recurringPositions(beats, barBeats, barsTouched(beats, barBeats));
}

/**
 * Where the band feels it.
 *
 * The fallback chain is ordered by how directly each source states a pulse, and
 * every step of it earns its place on some style in the shipping tables:
 *
 *  - **kick** — the ordinary case, and the one the plan describes.
 *  - **kick + backbeat** — a syncopated kick states no level on its own; the
 *    kick-and-snare skeleton between them does. This is what an eighties
 *    backbeat and a beguine need.
 *  - **a cymbal** — jazz. `ride-swing` puts the kick on the downbeat only, which
 *    is a bar marker and not a pulse: one onset per cycle cannot establish a
 *    period, it can only confirm the one you already knew. The ride's
 *    spang-a-lang states the half note and that is where a swing band feels it.
 *  - **the whole kit** — `distant-metal` and `slow-machine`, which are two
 *    struck objects a bar and not a kit at all.
 *  - **the bass** — much of ambient has no drums by design
 *    (`excludeLayers: ['drums']`), and the bass is then the only thing with
 *    onsets in it.
 *  - **the bar** — a drone. Nothing states anything faster, and inventing a
 *    pulse for a piece that has none would be worse than a slow sway.
 */
export function readPulse(song: Song): Pulse {
  const barBeats = song.meta.beatsPerBar;
  const { bpm } = song.meta;

  const kitBars = barsTouched(song.drums.events.map((e) => e.beat), barBeats);
  const byVoice = new Map<DrumVoice, number[]>();
  const grouped = new Map<DrumVoice, number[]>();
  for (const e of song.drums.events) {
    let arr = grouped.get(e.voice);
    if (!arr) { arr = []; grouped.set(e.voice, arr); }
    arr.push(e.beat);
  }
  for (const [voice, beats] of grouped) {
    byVoice.set(voice, recurringPositions(beats, barBeats, kitBars));
  }

  const union = (voices: DrumVoice[]): number[] =>
    [...new Set(voices.flatMap((v) => byVoice.get(v) ?? []))].sort((a, b) => a - b);

  const backbeats = readBackbeats(byVoice, barBeats);

  const sources: [PulseSource, number[]][] = [
    ['kick', union(KICK)],
    ['kick+backbeat', union([...KICK, ...BACKBEAT_VOICES])],
    ...TIMEKEEPERS.map((group) =>
      [group[0] === 'rd' ? 'ride' : 'hats', union(group)] as [PulseSource, number[]]),
    ['kit', union([...byVoice.keys()])],
    ['bass', bassPositions(song, barBeats)],
  ];

  for (const [source, positions] of sources) {
    const level = levelFrom(positions, barBeats);
    if (level === undefined) continue;
    return {
      pulseBeats: slowToHuman(level, barBeats, bpm, NOD_FLOOR_SECONDS),
      backbeats,
      source,
    };
  }
  return { pulseBeats: barBeats, backbeats, source: 'bar' };
}

// ---------------------------------------------------------------------------
// Amplitude over the song
// ---------------------------------------------------------------------------

interface EnergySpan {
  fromBeat: number;
  toBeat: number;
  /** 0..1, the section energy already normalised into an amplitude. */
  energy: number;
  section: Section;
  /** True inside a `solo` section, which is where the arc lives. */
  soloing: boolean;
}

/**
 * How many pieces a solo section is cut into so its build is visible.
 *
 * The plan asks for the biggest groove at the *end* of a solo, which is the
 * same arc `generate/dynamics.ts` applies between sections applied within one.
 * Four spans is enough to read as a build and few enough that the span list
 * stays printable.
 */
const SOLO_STEPS = [0.86, 0.97, 1.1, 1.24];

/**
 * The section energy curve, as amplitude spans.
 *
 * Read straight out of `generate/dynamics.ts` rather than re-derived, so a
 * change to what a chorus means moves the bodies with it. The placement fields
 * are rebuilt the way `generate/song.ts` builds them — index, total and which
 * instance of its own kind this is — because that is what the curve is a
 * function of and the `Section` does not carry it.
 */
function energyProfile(song: Song): EnergySpan[] {
  const barBeats = song.meta.beatsPerBar;
  const seen = new Map<string, number>();
  const out: EnergySpan[] = [];

  song.sections.forEach((section, index) => {
    const ordinal = seen.get(section.kind) ?? 0;
    seen.set(section.kind, ordinal + 1);
    const intensity = sectionIntensity({
      kind: section.kind, index, total: song.sections.length, ordinal,
    });
    // `sectionIntensity` runs 0.55..1.06 and is deliberately allowed above 1.
    const level = AMPLITUDE_FLOOR
      + (1 - AMPLITUDE_FLOOR) * clamp01((intensity - 0.55) / (1.06 - 0.55));

    const from = section.startBar * barBeats;
    const to = (section.startBar + section.lengthBars) * barBeats;
    const soloing = section.kind === 'solo';

    if (!soloing) {
      out.push({ fromBeat: quantise(from), toBeat: quantise(to), energy: level, section, soloing });
      return;
    }
    const step = (to - from) / SOLO_STEPS.length;
    SOLO_STEPS.forEach((scale, k) => {
      out.push({
        fromBeat: quantise(from + k * step),
        toBeat: quantise(from + (k + 1) * step),
        energy: clamp01(level * scale),
        section,
        soloing,
      });
    });
  });
  return out;
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

interface SoloSpan {
  fromBeat: number;
  toBeat: number;
  performerId: string;
}

/**
 * Which performer is soloing where.
 *
 * `Section.solo` names the layer and the instrument, which is enough to find
 * the player without re-deriving the "solo means counter" rule three files used
 * to each carry their own copy of. Matched on the layer, with the instrument
 * name as a tiebreak for a cast that has doubled a layer.
 *
 * A section can have two soloists in it. Trading fours is one chorus handed
 * back and forth, and a section-long span would say the tenor player owns all
 * thirty-two bars of it — so the whole band stands there watching somebody who
 * stopped playing four bars ago while the drummer answers them in the dark.
 * `SoloAssignment.blocks` is the arrangement's own statement about who has
 * which bars, and reading it is the only way to get the alternation right: the
 * blocks are not always fours and, in a full drum chorus, do not alternate at
 * all. That degenerate case comes out of the same code path — `soloBars` is
 * empty, `drumBars` is the section, and the drummer's own lookup returns the
 * soloist — which is why the name is never tested here.
 */
function soloSpans(song: Song, cast: Cast): SoloSpan[] {
  const barBeats = song.meta.beatsPerBar;
  // Through `playerFor` rather than by layer, so a line somebody is covering
  // as their second one still has a soloist. See `Performer.doubles`.
  const kit = playerFor(cast, 'drums');
  const out: SoloSpan[] = [];

  for (const section of song.sections) {
    if (!section.solo) continue;
    const performer = playerFor(cast, section.solo.layer, section.solo.instrument);
    if (!performer) continue;
    const at = (bar: number): number => quantise((section.startBar + bar) * barBeats);
    const { blocks } = section.solo;

    if (!blocks) {
      out.push({ fromBeat: at(0), toBeat: at(section.lengthBars), performerId: performer.id });
      continue;
    }
    for (const [from, to] of blocks.soloBars) {
      out.push({ fromBeat: at(from), toBeat: at(to), performerId: performer.id });
    }
    // A traded chorus behind a drum machine has nobody to turn to for the
    // answering bars, and a head aimed at the person who has stopped would be
    // the fault this whole branch exists to fix. Nothing is the honest answer:
    // the band goes back to its own idle until the soloist comes in again.
    if (!kit) continue;
    for (const [from, to] of blocks.drumBars) {
      out.push({ fromBeat: at(from), toBeat: at(to), performerId: kit.id });
    }
  }

  // In time order, because a trade interleaves two players and the order the
  // spans are emitted in decides the order the `watch` behaviours are written
  // in — which is the order two equal amplitudes are settled in downstream.
  return out.sort((a, b) => a.fromBeat - b.fromBeat);
}

// ---------------------------------------------------------------------------
// Nobody is in phase with anybody
// ---------------------------------------------------------------------------

/**
 * How tightly a layer is expected to keep time, lowest first.
 *
 * Not a stylistic preference. The rhythm section's job *is* the time, and a
 * drummer who wandered as far off centre as the horn player does would not be a
 * drummer. This ranking doubles as the order the band is stacked in around the
 * beat — see below.
 */
function timeRank(layer: LayerId): number {
  if (layer === 'drums') return 0;
  if (layer === 'bass') return 1;
  if (layer === 'comp') return 2;
  return 3;
}

/**
 * Where each player sits relative to the beat, as a fraction of the spread.
 *
 * Independent draws per performer were the obvious implementation and they are
 * wrong twice over. They collide — six draws rounded to three decimals over a
 * range of a tenth of a beat put two players in unison about once in twenty
 * songs, and two players in unison is precisely the failure this whole
 * mechanism exists to prevent. And even when they do not collide they *clump*,
 * because independent draws do: three players a millisecond apart and one miles
 * away reads as a mistake rather than as a band.
 *
 * So the range is sliced into one lane per player and each player is given a
 * lane, with their own id choosing where in it they sit. Separation stops being
 * probable and becomes structural, in the same spirit as the archetype table
 * being a total `Record` rather than a lookup with a default.
 *
 * Lanes are handed out from the centre outward in `timeRank` order, which
 * expresses the musical fact directly: **the drummer is the middle of the beat
 * and the band is arranged around them.**
 */
function phaseCentres(cast: Cast): Map<string, number> {
  const order = [...cast.performers].sort((a, b) =>
    timeRank(a.layer) - timeRank(b.layer)
    || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const n = Math.max(1, order.length);
  const lanes = Array.from({ length: n }, (_, i) => (i + 0.5) / n - 0.5)
    .sort((a, b) => Math.abs(a) - Math.abs(b) || a - b);
  const out = new Map<string, number>();
  order.forEach((performer, k) => out.set(performer.id, lanes[k]!));
  return out;
}

// ---------------------------------------------------------------------------
// The score
// ---------------------------------------------------------------------------

export function scoreGroove(song: Song, cast: Cast, seed: string): GrooveScore {
  const pulse = readPulse(song);
  const energy = energyProfile(song);
  const solos = soloSpans(song, cast);
  const centres = phaseCentres(cast);
  const parts: Record<string, GroovePart> = {};

  for (const performer of cast.performers) {
    parts[performer.id] = groovePart(performer, song, pulse, energy, solos, seed, {
      centre: centres.get(performer.id) ?? 0,
      lanes: Math.max(1, cast.performers.length),
    });
  }

  return { pulseBeats: pulse.pulseBeats, backbeats: pulse.backbeats, parts };
}

function groovePart(
  performer: Performer,
  song: Song,
  pulse: Pulse,
  energy: EnergySpan[],
  solos: SoloSpan[],
  seed: string,
  lane: { centre: number; lanes: number },
): GroovePart {
  const barBeats = song.meta.beatsPerBar;
  const { bpm } = song.meta;
  const rng = new Rng(`${seed}:groove:${performer.id}`);
  const genreBody = GENRES[song.meta.genre]?.staging?.body ?? GENRE_BODY_DEFAULT;

  const jitter = PHASE_JITTER / lane.lanes;
  const phase = (lane.centre + rng.float(-jitter, jitter))
    * 2 * ((PHASE_SECONDS * bpm) / 60);
  const looseness = clamp01(
    rng.float(0.2, 0.9) * (performer.layer === 'drums' ? 0.3
      : performer.layer === 'bass' ? 0.6 : 1),
  );

  const ownSolos = solos.filter((s) => s.performerId === performer.id);
  // Overlap rather than containment: a trade's blocks are four bars and the
  // energy profile is cut into quarters of a section, so on a long chorus one
  // is not nested inside the other in either direction. Anywhere else the two
  // tests agree, because there the window *is* the section.
  const inOwnSolo = (span: EnergySpan): boolean =>
    ownSolos.some((s) => span.fromBeat < s.toBeat && span.toBeat > s.fromBeat);

  /**
   * A player whose layer is resting has more body available, not less.
   *
   * The runtime blends groove *under* the note gestures (§8.11), so a busy
   * player's sway is being overwritten by their hands anyway. Lifting the
   * amplitude where the layer is out of the arrangement is what makes eight
   * bars' rest look like listening rather than like a paused animation.
   */
  const restBonus = (span: EnergySpan): number =>
    span.section.activeLayers.includes(performer.layer) ? 1 : 1.15;

  const spans = (base: number, scale?: (span: EnergySpan) => number): Span[] =>
    energy.map((span) => ({
      fromBeat: span.fromBeat,
      toBeat: span.toBeat,
      value: round3(clamp01(
        base * span.energy * genreBody * restBonus(span) * (scale ? scale(span) : 1),
      )),
    }));

  /**
   * The same curve for a `watch`, cut *at* its windows instead of sampled by
   * them.
   *
   * Every other behaviour can ask "is this energy span inside the window",
   * because every other window is a whole section and the profile is cut by
   * section. A trade is the exception: it hands the chorus over in four-bar
   * blocks while the profile is cut into quarters of the section regardless, so
   * on a thirty-two bar trade one energy span straddles two blocks and a
   * containment test answers no for *both* players — a whole chorus with the
   * band watching nobody. Cutting the other way keeps the section's build and
   * puts the head turn on the block boundary, which is where the follow spot
   * goes too.
   *
   * Outside the windows the value is a flat zero rather than a small number, so
   * the runtime can tell "not watching" from "watching faintly" — see
   * `watching` in `web/concert/animate.ts`, which reads these steps as a
   * decision rather than as a size.
   */
  const watchSpans = (base: number, windows: SoloSpan[]): Span[] => {
    const out: Span[] = [];
    for (const span of energy) {
      const value = round3(clamp01(base * span.energy * genreBody * restBonus(span)));
      const cuts = [span.fromBeat, span.toBeat];
      for (const w of windows) {
        for (const edge of [w.fromBeat, w.toBeat]) {
          if (edge > span.fromBeat && edge < span.toBeat) cuts.push(edge);
        }
      }
      cuts.sort((a, b) => a - b);
      for (let i = 0; i + 1 < cuts.length; i++) {
        const [fromBeat, toBeat] = [cuts[i]!, cuts[i + 1]!];
        if (toBeat - fromBeat < 1e-6) continue;
        const on = windows.some((w) => fromBeat >= w.fromBeat && toBeat <= w.toBeat);
        out.push({ fromBeat, toBeat, value: on ? value : 0 });
      }
    }
    return out;
  };

  const behaviours: GrooveBehaviour[] = [];

  /**
   * The nod, on the pulse.
   *
   * The drummer's is the biggest of anybody's: their head follows their own
   * hands, which is a stronger and faster motion than feeling a pulse from the
   * outside. The soloist's all but stops while they are soloing — a player in
   * the middle of a phrase is leaning into it, not counting it, and the two
   * behaviours would fight for the same head.
   */
  behaviours.push({
    kind: 'head-nod',
    effector: 'head',
    periodBeats: pulse.pulseBeats,
    amplitude: spans(performer.layer === 'drums' ? 1 : 0.85,
      (span) => (inOwnSolo(span) ? 0.22 : 1)),
  });

  /**
   * The sway, at bar or two-bar level.
   *
   * Deliberately several times slower than the nod so the two read as separate
   * layers of feel rather than as one bounce — which is the failure this
   * behaviour exists to avoid, and the reason it is not simply a bigger nod.
   * Ambient always takes the slower of the two: a genre with no foreground does
   * not have a one-bar body either.
   */
  const swayBars = song.meta.genre === 'ambient' || rng.chance(0.4) ? 2 : 1;
  behaviours.push({
    kind: 'body-sway',
    effector: 'body',
    periodBeats: barBeats * swayBars,
    amplitude: spans(0.7),
  });

  /**
   * The foot, on the beat — and only where there is a foot going spare.
   *
   * A drummer's feet are on the hi-hat and the kick pedals and are already
   * choreographed as gestures; a third tapping foot is a bug rather than a
   * flourish. `posture` is the honest test, because it is the staging system's
   * own statement about what the player is standing behind: `kit` has both feet
   * occupied and `sit`/`stool` have a pedal or a bench under them. The
   * archetype guard is belt and braces — a drummer staged as `stand` would be a
   * casting bug, and it should not become a visible one here.
   */
  if (performer.station.posture === 'stand' && performer.archetype !== 'drumkit') {
    behaviours.push({
      kind: 'foot-tap',
      // People tap one foot, and which one is personal.
      effector: rng.chance(0.5) ? 'left-foot' : 'right-foot',
      periodBeats: slowToHuman(1, barBeats, bpm, TAP_FLOOR_SECONDS),
      amplitude: spans(0.6),
    });
  }

  // The soloist leans into the phrase instead of counting it. Zero everywhere
  // else, so the runtime can blend it in and out without a special case.
  if (ownSolos.length) {
    behaviours.push({
      kind: 'lean',
      effector: 'body',
      // A phrase, not a pulse — this is the slowest thing a body does here.
      periodBeats: barBeats * 2,
      amplitude: spans(1, (span) => (inOwnSolo(span) ? 1 : 0)),
    });
  }

  /**
   * The bassist has their eyes shut.
   *
   * From §8.4, where it is a jazz costume note, and it belongs here rather than
   * in the look because it is a thing a player *does* and it varies over the
   * song: deepest in the quiet sections, where a bass player has the least to
   * look at and the most to listen to.
   */
  if (performer.layer === 'bass') {
    behaviours.push({
      kind: 'eyes-shut',
      effector: 'head',
      // Nominal: this is a held pose, and the period is how often it refreshes.
      periodBeats: barBeats * 4,
      amplitude: energy.map((span) => ({
        fromBeat: span.fromBeat,
        toBeat: span.toBeat,
        value: round3(clamp01(0.95 - 0.4 * span.energy)),
      })),
    });
  }

  /**
   * Everybody else watches the soloist.
   *
   * One behaviour per distinct soloist rather than one with a switching target,
   * because `targetPerformerId` is a single field — which is right, since a
   * head can only be turned toward one person. A song whose solos rotate
   * therefore produces two `watch` behaviours whose spans do not overlap, and a
   * chorus traded between a soloist and the drummer produces two that alternate
   * every four bars.
   */
  const targets = [...new Set(solos.filter((s) => s.performerId !== performer.id)
    .map((s) => s.performerId))];
  for (const target of targets) {
    behaviours.push({
      kind: 'watch',
      effector: 'head',
      periodBeats: barBeats * 2,
      targetPerformerId: target,
      amplitude: watchSpans(0.9, solos.filter((s) => s.performerId === target)),
    });
  }

  return {
    performerId: performer.id,
    // Four places rather than three. A phase is a tenth of a beat at most, and
    // rounding it as coarsely as an amplitude would collapse two adjacent lanes
    // back into the unison the lanes exist to prevent.
    phase: Math.round(phase * 1e4) / 1e4,
    looseness: round3(looseness),
    behaviours,
  };
}

/**
 * Three decimals everywhere.
 *
 * The IR is printable and diffable by design — `npm run concert` asserts a seed
 * produces a byte-identical `Concert` — and a full-precision float carries
 * fifteen digits of information about the RNG and none about the performance.
 */
function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
