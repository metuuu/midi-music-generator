/**
 * Drum fills — how the kit announces that the section is changing.
 *
 * There was one fill. Descending toms from the half-bar, then a crash, in every
 * genre, at every section boundary, at every tempo, regardless of what the
 * section was turning into. A tom roll is a dance-band gesture; a drummer plays
 * it into a chorus and would not dream of playing it into the head of a bebop
 * tune, where the fill is a cymbal and a couple of kicks and no toms at all.
 *
 * The old one also had a quiet bug: it walked `ht, mt, lt` and then clamped to
 * the end of the list, so a sixteenth-note fill played three toms and then five
 * repeats of the low one. That is not a roll, it is a stutter.
 *
 * Two things decide what gets played:
 *
 *  - **The idiom**, which is what makes a fill sound like it belongs to the
 *    music around it rather than to a drum-machine demo.
 *  - **What it is landing on.** A fill exists to deliver the next section, so
 *    its size is a property of the arrival, not of the departure. The biggest
 *    one in a song goes into the last chorus; the one into a quiet verse is two
 *    notes and a cymbal, and the most effective of all is often no fill at
 *    all — a bar of near-silence that makes the downbeat land twice as hard.
 *
 * ## …and a third, which is what the drummer is sitting at
 *
 * Every shape below named a trap kit in literals — snare, three toms, kick, a
 * ride and a crash — and so did `landing()`, and so does the kit half of
 * `playShot` in `generate/transition.ts`. That was the whole of the vocabulary
 * while every table in the catalogue was a kit table, and it stopped being when
 * `lp`/`mp`/`hp` arrived. `generateDrumSolo` was generalised off it last week
 * and this is the other half of the same job, from `docs/engine-gaps.md` §2.1.
 *
 * It is worse here than it was there, and the reason is the one thing a fill
 * has that a solo does not: **a solo is a section a genre can decline to
 * schedule, and a fill is not.** Indian took `drums` out of its rotation and set
 * `tradeFours: 0` rather than have a tabla chorus come out as a rock drum solo;
 * there is no equivalent short of `drumFills: false`, which is a style saying
 * *this music has no seam gesture at all* and is a much larger thing to say. So
 * a genre with no kit got kit strokes in the one place it could not refuse them,
 * and got them at every section join of every song.
 *
 * **Measured** across the catalogue, every genre at 40 songs and `strict`: 88 of
 * the 560 came out on a style table with no kit in it, and **1804 kit-tier
 * strokes were written into 55 of those 88 anyway**. Arabic is 32 of its 34, and
 * every one of the 32 conscripted a full acoustic kit onto the stage, because
 * `cast.ts` reads the events and the events said drum kit. With the station read
 * the same sweep is **98**, and all 98 are one gesture in a third file — the
 * `cr` + `bd` `landEnding` strikes on a button ending in `song.ts`, which is
 * this same literal written a third time and was not this wave's to move.
 *
 * **A later wave moved it**, and the sentence is kept in the past tense rather
 * than deleted because the count above is only legible beside it. `landEnding`
 * calls `seamOrchestration` and writes `station.land` and `station.weight`, so
 * on a table with no kit in it a button now lands on the drum: across every
 * indian style at eight seeds, both come back `lp` **192 times of 192**. That
 * closed the 98 and, with `playShot`'s level read after it, took the whole
 * fault to zero — see `docs/engine-gaps.md` §2.1.
 *
 * See `SeamOrchestration` for what the answer is, and for which six of the seven
 * shapes below survive the move.
 */

import type { Rng } from '../core/rng.js';
import { drumStations } from '../concert/instruments.js';
import type { DrumEvent, DrumVoice } from '../core/types.js';

/**
 * The seven, and the name of each is the kit's version of it.
 *
 * A shape is a *gesture*, not a set of voices — which is what makes six of the
 * seven playable on a drum with three strokes and one head. See
 * `SeamOrchestration`, where the argument for each is made one at a time.
 */
export type FillShape =
  | 'tom-roll'    // descending toms — the dance-band signature; a run down the drum
  | 'snare-roll'  // sixteenths on the snare, building; alternating fingers on a skin
  | 'snare-toms'  // snare on the beat, toms answering off it; state, then answer
  | 'cymbal'      // jazz: cymbal and kick, no toms anywhere. The one kit-only shape
  | 'rim'         // Latin: rim and percussion, a clave-ish figure — wood, not skin
  | 'lead-in'     // two or three hits on the last beat, and nothing else
  | 'drop';       // the kit stops; the silence is the fill

/**
 * Weighted fill vocabulary.
 *
 * One level below `TransitionPalette` in `generate/transition.ts`, which asks
 * *whether the drummer is the one announcing this join at all* — a fill is one
 * of four things that can happen at a seam, and the other three belong to the
 * band. This table is consulted only once that one has said `fill`, which for
 * every style in the catalogue is always.
 */
export type FillPalette = (readonly [FillShape, number])[];

export const DEFAULT_FILLS: FillPalette = [
  ['tom-roll', 4], ['snare-roll', 3], ['snare-toms', 3], ['lead-in', 2], ['drop', 1],
];

/**
 * Which voice does which job at a seam, once it is known what the player is
 * sitting at.
 *
 * The deliberate twin of `SoloOrchestration` in `generate/solo.ts`, and the
 * things it copies are the things that matter:
 *
 *  - **The tier is not decided here.** `STATION_OF` in `concert/instruments.ts`
 *    already answers *which object does this voice need*, in three tiers —
 *    `kit`, `hand`, and the `either` that covers the tambourine and the shaker
 *    standing at both — and `drumStations` is the seam casting, choreography,
 *    the solo generator and `npm run genres` all read. This is the fifth reader
 *    and it asks the same question; a second answer beside it is how the two
 *    would drift.
 *  - **The kit has first claim.** A third of the tables that write hand voices
 *    write kit voices in the same bar — funk's `congas`, latin's `cumbia-kit`,
 *    reggae's `roots-rockers` — and those are not one player choosing an
 *    instrument, they are two people. When both are on the stage the fill
 *    belongs to the drummer, and the percussionist keeps playing behind it.
 *  - **A gesture is a job, not an object.** Everything in `buildFill` below is
 *    written in terms of the jobs named here, and none of it names a voice.
 *
 * ## Two tables rather than one, and why they are not merged
 *
 * `SoloOrchestration` is not exported and this is not a copy of it under a new
 * name: the two have three fields in common and five that do not overlap,
 * because a solo and a seam ask a drum for different things. A solo needs a
 * `pulse` — the spare limb that keeps the form audible across sixteen bars with
 * no harmony under it — and a fill lasts one bar and has the bar to keep it. A
 * seam needs `wood`, `survives` and `shot`, none of which a chorus has any use
 * for. Merging them would mean one interface with eleven fields of which each
 * caller reads six, which is a worse statement of both.
 *
 * ## What generalises, and what does not
 *
 * The shapes are not the voices. **Six of the seven** in `FillShape` are about a
 * *drum* rather than about a kit, and come across intact:
 *
 *  - **A run down the drum** (`tom-roll`). `ht`→`mt`→`lt` is three drums in a
 *    row and `hp`→`mp`→`lp` is three places on one head, and `core/types.ts`
 *    says outright that the second was named to be the first one family over.
 *    The `ladder` is the same field the solo uses and holds the same voices.
 *  - **State, then answer** (`snare-toms`). The ordinary stroke on the beats,
 *    the surfaces beside it taking what falls between. Snare answered by toms;
 *    open tone answered by slap and doum. Identical gesture, different object.
 *  - **A roll** (`snare-roll`), and this is the one that has to be *re-read*
 *    rather than merely re-voiced. A kit roll is one surface struck over and
 *    over, so `roll` is a list of one and cycling it is a no-op. A hand drum
 *    has no such thing and never did: a roll there is a **tirakita**, a burst of
 *    alternating fingers, and the alternation is what produces the sustain that
 *    a stick produces by repetition. So the field is a cycle at both stations
 *    and only one of them has anything to cycle — which is why it is written as
 *    a list rather than as a voice, and why the kit's output is unchanged to the
 *    bit.
 *  - **A lead-in** (`lead-in`), which is two or three strokes of the ordinary
 *    voice on the last beat. Three teks into the downbeat is the same figure.
 *  - **Wood rather than skin** (`rim`). The gesture is a dry, unpitched,
 *    clave-ish figure and the point of it is that it is *not* the drum — a Latin
 *    fill is a cross-stick and a woodblock. A hand percussionist has that too,
 *    on the stand rather than on a snare rim: `either`-tier pieces, which is the
 *    tier that exists precisely because the riq and the woodblock are at both
 *    stations. This one matters more than its weight suggests — indian's palette
 *    is `drop` 6, `rim` 5, `lead-in` 3, `snare-roll` 1, so `rim` is the second
 *    commonest fill in a genre whose every table is three strokes of one drum.
 *  - **Silence** (`drop`), which is the same on any object, and is the one
 *    shape that was already right everywhere.
 *
 * **`cymbal` is the one that does not**, and it is the only shape in the
 * vocabulary named after an object rather than after a job. That is not
 * carelessness in the naming: the object *is* the gesture. A bebop drummer
 * setting up the next chorus strikes the ride and lets it ring across the
 * barline while the sticks do almost nothing, and what fills the bar is the
 * sustain. A skin does not ring — `generateDrumSolo` refuses the same
 * substitution for the same reason, and `landing()` below is the third place
 * this file has had to say it. Giving the slap the ride's slots would produce a
 * figure with the same onsets and none of the reason for them.
 *
 * So it is **re-aimed rather than dropped**, and that is where a fill and a solo
 * genuinely part company. A solo can leave a gesture out: it has four others and
 * sixteen bars to spend them in, and `SoloOrchestration.pulse` is optional for
 * exactly that reason. A fill has one bar and the seam is announced by it or by
 * nobody, so a palette that drew `cymbal` has to play *something*. What it plays
 * is `lead-in` — the other shape in the vocabulary that is sparse on purpose,
 * which is what the jazz fill has left once the ringing is taken out of it.
 *
 * **It has never once fired**, which is the finding rather than a
 * disappointment: `cymbal` appeared in two palettes in the catalogue, jazz's and
 * metal's, and every table in both was a kit. **There are three now** — rnb
 * wrote one at weight 1, on metal's reasoning rather than jazz's, and its own
 * comment says outright that a jazz drummer's fill is not what this stage has —
 * and the finding survived the arrival intact. Across the 58 styles those three
 * genres give a drum table, **58 resolve to a kit under every bank their eras
 * name**, so the fallthrough below is still reached zero times. The count is
 * kept rather than corrected in place because the shape of it is the point: this
 * line goes stale by a genre being added, not by the mechanism changing, and the
 * next author to add a fourth should re-run the same two counts. It is written
 * because the switch is total and because the first hand-drum genre to want a
 * sparse jazz seam should find an answer rather than a crash on a stage with no
 * cymbal on it.
 *
 * ## The kit is unchanged to the bit, and that is the acceptance test
 *
 * Every field of `TRAP_KIT` holds the literal the shape below used to name, in
 * the order it named it, so the kit path is the same arithmetic on the same
 * numbers — no draw moved, because nothing was added to or taken out of any
 * stream. Measured over 10 760 songs, every genre by every style by eight seeds
 * across five seed families: **34 styles changed and all 34 are hand-table
 * styles**, out of 54 hand-table styles among the 215 in the catalogue with a
 * drum table. Not one of the other 161 moved a single drum event.
 */
export interface SeamOrchestration {
  /** The stroke a figure is stated on: neutral, and the one there is most of. */
  ordinary: DrumVoice;
  /** The surfaces a run goes down, high to low. */
  ladder: readonly DrumVoice[];
  /**
   * The accent dropped underneath a figure.
   *
   * Read by `cymbal` alone, and it is worth saying what does *not* read it:
   * `generateDrums` plays the kick through a fill rather than clearing it, and
   * that exemption is written against `bd` by name. It should stay that way.
   * The exemption is about a **foot** — a drummer's right foot does not stop for
   * a fill because the fill is in their hands — and a hand drummer has no such
   * limb, so a doum going on under a tirakita would be a third hand. Naming this
   * field there would have generalised the wrong half of the sentence.
   */
  weight: DrumVoice;
  /**
   * The dry answer, cycled: wood and metal off the drum rather than on it.
   *
   * Two timbres alternating, because one repeated is a roll and this shape is a
   * figure. Both entries are `either`-tier at the hand station on purpose — see
   * `drumStations`, where an auxiliary piece follows whoever is standing there.
   */
  wood: readonly DrumVoice[];
  /** The run-in of a roll, cycled a slot at a time. One entry means a repeat. */
  roll: readonly DrumVoice[];
  /**
   * The cymbal a `cymbal` fill is made of, and absent where nothing rings.
   *
   * The only optional field here, and the only shape that reads it. See above.
   */
  ride?: DrumVoice;
  /** What marks a big arrival. */
  land: DrumVoice;
  /**
   * …and what marks a small one.
   *
   * Two voices on a kit, because a crash into a hushed verse announces the wrong
   * thing and an open hat is the same gesture at a tenth of the size. One voice
   * on a hand drum, because the instrument has one arrival stroke and the
   * difference between a big landing and a small one is how hard it is played —
   * which is what `landing()` was already doing with the velocity anyway.
   */
  landSoftly: DrumVoice;
  /**
   * What the drummer hits when the whole band hits a figure. See `playShot`.
   *
   * Two voices on a kit — a kick under a snare is a foot and a hand, and it is
   * what a drummer plays on a band figure. **One on a skin**, and that is the
   * `oneSkin` rule `SoloOrchestration` states at length: two voices written at
   * one instant on one head are two hands landing on the same spot, which is a
   * flam played by accident rather than an accent. The doum is the fullest
   * stroke the instrument has and it is what a tihai is struck with.
   */
  shot: readonly DrumVoice[];
  /**
   * What survives a bar this vocabulary rewrites from scratch.
   *
   * The crash on a kit, and **nothing at all on a skin**. `playShot` and
   * `playBreak` both empty the last bar before a seam, and the reason a crash is
   * spared is that it is the drummer *marking* something while everything else
   * in the bar is keeping time — a cymbal already struck is still sounding and
   * cannot be un-struck.
   *
   * That test needs the marking to be a different object from the timekeeping,
   * and on one head it is not: the doum that lands a phrase is the same doum the
   * pulse is made of, so there is nothing in the bar that can be told apart from
   * what is being replaced. An empty list is the honest answer rather than a
   * missing case.
   */
  survives: readonly DrumVoice[];
}

/** What every fill in this project was written for, and still is. */
const TRAP_KIT: SeamOrchestration = {
  ordinary: 'sd',
  ladder: ['ht', 'mt', 'lt'],
  weight: 'bd',
  wood: ['rim', 'perc', 'rim'],
  roll: ['sd'],
  ride: 'rd',
  land: 'cr',
  landSoftly: 'oh',
  shot: ['bd', 'sd'],
  survives: ['cr'],
};

/**
 * One drum, two hands, three strokes.
 *
 * The assignment is `HAND_DRUM` in `generate/solo.ts` verbatim wherever the two
 * tables share a job, and deliberately so — a drummer does not re-learn their
 * instrument between a fill and a chorus. `mp`, the open ringing tone, is the
 * ordinary stroke and what most of any phrase is made of; `hp`, the slap, is the
 * brightest and driest thing on the drum and is what a phrase ending wants;
 * `lp`, the doum, is the pulse of the bar and therefore both the weight under a
 * figure and the arrival at the end of one.
 *
 * The two fields the solo has no equivalent for are the two that leave the drum:
 *
 *  - **`wood`** is the percussionist's own stand — `perc` on it, answered by the
 *    slap. A darbuka player with a pair of sagat, a tabla player with a
 *    woodblock in the film session next door. `perc` is `either`-tier, so it
 *    follows whoever is standing there and can never conscript a kit; that is
 *    the whole reason the middle tier exists.
 *  - **`survives`** is empty, and the note on the field says why.
 *
 * Reaching for `perc` where the style's table never wrote one is the same
 * licence `DrumSoloOptions.table` documents at length: a style's table says what
 * is in the room and the vocabulary says what a player does with it, and a fill
 * reaching for a stroke the groove never used is a drummer, not a bug.
 */
const HAND_DRUM: SeamOrchestration = {
  ordinary: 'mp',
  ladder: ['hp', 'mp', 'lp'],
  weight: 'lp',
  wood: ['perc', 'hp', 'perc'],
  roll: ['mp', 'hp'],
  land: 'lp',
  landSoftly: 'lp',
  shot: ['lp'],
  survives: [],
};

/**
 * Which of the two, from a drum vocabulary and the bank behind it.
 *
 * The same one-line question `orchestrationFor` asks in `generate/solo.ts`, and
 * the same default: a caller that names no vocabulary gets a kit, which is what
 * every fill and every shot in this project was before this function existed.
 * That is what makes adding it safe — an untaught call site stages exactly the
 * kit it staged yesterday.
 *
 * **The bank is optional in the type and is passed at every call site**, which
 * is not where this started. It used to be genuinely omitted at one of them, on
 * a measurement: across all fourteen genres, every style with a drum table and
 * every bank any of their eras could roll, the bank did not change this answer
 * once. That was true and it was worthless, because on the day it was taken **no
 * era named a rack at all** — the whole question was being asked of a catalogue
 * in which the only possible answer was "kit".
 *
 * The style it was wrong about is latin's `joropo`, whose table is `perc sh`:
 * two `either`-tier voices and nothing else, which read as a kit on their own
 * and as a percussionist's bongo and cabasa the moment latin's eras named
 * `+congas`. The failure was visible and specific — the *solo* was orchestrated
 * for a hand drum and the *fills* for a trap kit, so 76 strokes came out on
 * toms, an open hat and a rim that nobody had been staged to play, and three
 * choruses ended on a crash. `npm run genres` caught all of it in one line.
 *
 * The lesson is worth more than the fix: a claim of the form *this parameter
 * never changes the answer* is only as good as the corpus it was measured over,
 * and a corpus that cannot express the case is not evidence. So the parameter is
 * threaded rather than argued about — `generateDrums` takes a `bank` and
 * `generateSong` fills it, which is exactly the two-line cost this note once
 * declined to pay.
 */
export function seamOrchestration(
  table?: Iterable<DrumVoice>, bank?: string,
): SeamOrchestration {
  if (!table) return TRAP_KIT;
  return drumStations(table, bank).kit ? TRAP_KIT : HAND_DRUM;
}

export interface FillOptions {
  /** Beat the fill's bar starts on. */
  barStart: number;
  beatsPerBar: number;
  slotsPerBar: number;
  rng: Rng;
  /** How hard this section is playing. */
  intensity: number;
  /**
   * How hard the *next* section plays. A fill is a delivery, so this is what
   * decides how much of one it needs to be.
   */
  arrival: number;
  palette: FillPalette;
  /**
   * What the drummer is sitting at. See `SeamOrchestration`.
   *
   * Resolved by the caller rather than taken as a raw table — which is where
   * this differs from `DrumSoloOptions`, and the reason is that `generateDrums`
   * needs the same answer twice: once here and once for `landing()` on the
   * downbeat this is aimed at. One resolution at the call site is one fact; two
   * resolutions from the same table would be two facts that agree today.
   *
   * Absent is the trap kit, which is what every caller meant before the field
   * existed.
   */
  station?: SeamOrchestration;
}

export interface Fill {
  events: DrumEvent[];
  /**
   * First slot the fill occupies. The pattern is silenced from here to the
   * barline, so the kit does not play through its own fill — which the old code
   * approximated with a hardcoded half-bar whatever the fill actually was.
   */
  fromSlot: number;
}

const SLOTS_PER_BEAT = 4;

export function buildFill(opts: FillOptions): Fill {
  const { barStart, beatsPerBar, slotsPerBar, rng, intensity, arrival, palette } = opts;
  const station = opts.station ?? TRAP_KIT;
  const shape = rng.weighted(palette);

  /**
   * How much of the bar the fill takes.
   *
   * Scaled by the arrival: a big landing earns a long run-up. Held to a whole
   * beat at minimum, because a fill shorter than that reads as a flam rather
   * than as an announcement.
   */
  const beats = arrival > 0.95 ? rng.weighted([[2, 3], [1, 2]] as const)
    : arrival > 0.8 ? rng.weighted([[2, 2], [1, 3]] as const)
      : 1;
  const span = Math.min(slotsPerBar, beats * SLOTS_PER_BEAT);
  const fromSlot = slotsPerBar - span;

  const events: DrumEvent[] = [];
  const at = (slot: number, voice: DrumVoice, velocity: number) => {
    events.push({
      beat: barStart + slot / SLOTS_PER_BEAT,
      voice,
      velocity: Math.max(0.05, Math.min(1, velocity)),
    });
  };

  // A fill crescendos into its landing — that is most of why it reads as one.
  const swellAt = (slot: number) => 0.62 + 0.34 * ((slot - fromSlot) / Math.max(1, span));
  const level = intensity;

  /**
   * Two or three strokes on the last beat and nothing else.
   *
   * Lifted out of its own case because `cymbal` lands here on a station with
   * nothing that rings — see `SeamOrchestration`. A function rather than a
   * fallthrough, because the two cases are not adjacent in the switch and
   * reordering them to make a fallthrough legal would put the vocabulary in an
   * order chosen by the compiler rather than by the music.
   */
  const leadIn = (): Fill => {
    const step = rng.pick([2, 1]);
    const from = slotsPerBar - SLOTS_PER_BEAT;
    for (let slot = from; slot < slotsPerBar; slot += step) {
      at(slot, station.ordinary, swellAt(slot) * level * 0.9);
    }
    return { events, fromSlot: from };
  };

  switch (shape) {
    case 'tom-roll': {
      // Cycle the toms properly rather than clamping to the lowest one.
      const toms = station.ladder;
      const step = rng.pick([2, 2, 4]);
      let i = 0;
      for (let slot = fromSlot; slot < slotsPerBar; slot += step) {
        at(slot, toms[i % toms.length]!, swellAt(slot) * level);
        i++;
      }
      break;
    }
    case 'snare-roll': {
      const step = span >= 8 ? rng.pick([2, 2, 1]) : rng.pick([2, 1]);
      // One surface struck over and over on a kit; alternating fingers on a
      // skin, which is what a roll is there. The cycle is a no-op for a list of
      // one, so the kit's roll is the snare roll it always was.
      let i = 0;
      for (let slot = fromSlot; slot < slotsPerBar; slot += step) {
        at(slot, station.roll[i++ % station.roll.length]!,
          swellAt(slot) * level * (slot % SLOTS_PER_BEAT === 0 ? 1 : 0.82));
      }
      break;
    }
    case 'snare-toms': {
      const toms = station.ladder;
      let i = 0;
      for (let slot = fromSlot; slot < slotsPerBar; slot += 2) {
        const onBeat = slot % SLOTS_PER_BEAT === 0;
        at(slot, onBeat ? station.ordinary : toms[i++ % toms.length]!, swellAt(slot) * level);
      }
      break;
    }
    case 'cymbal': {
      /**
       * The jazz answer. A drummer setting up the next chorus plays the cymbal
       * and drops a couple of kicks under it; the toms stay where they are. The
       * hits land off the beat because that is where a swung fill sits.
       *
       * The one shape that names an object, and the object is the gesture — so
       * a station with nothing that rings plays the sparsest thing it has
       * instead rather than miming this one. See `SeamOrchestration`.
       */
      if (!station.ride) return leadIn();
      at(fromSlot, station.ride, 0.72 * level);
      at(fromSlot + 2, station.weight, 0.66 * level);
      if (span >= 8) {
        at(fromSlot + 4, station.ride, 0.8 * level);
        at(fromSlot + 6, station.ordinary, 0.7 * level);
      }
      at(slotsPerBar - 2, station.ordinary, 0.85 * level);
      break;
    }
    case 'rim': {
      // A Latin fill is a wood sound, not a skin one — a cross-stick and a
      // woodblock on a kit, the percussionist's own stand where there is no kit
      // to carry them.
      const voices = station.wood;
      let i = 0;
      for (let slot = fromSlot; slot < slotsPerBar; slot += 2) {
        at(slot, voices[i++ % voices.length]!, swellAt(slot) * level * 0.9);
      }
      break;
    }
    case 'lead-in':
      return leadIn();
    case 'drop':
      // Nothing at all. The bar empties and the downbeat that follows lands
      // twice as hard for it — which is why this is in the vocabulary and not
      // an absence of one.
      return { events, fromSlot };
  }

  return { events, fromSlot };
}

/**
 * The cymbal on the downbeat the fill was aiming at.
 *
 * Deliberately separate: it belongs to the *next* section, sounds on its first
 * beat, and its weight comes from that section rather than from the one just
 * finished. A fill into something quiet gets an open hat instead, because a
 * crash into a hushed verse announces the wrong thing.
 *
 * Separate enough that a second caller found it: a seam `shot` vetoes the fill
 * and then wants this anyway, because the cymbal marks the *arrival* and the
 * fill was only ever one way of getting to it. See `playShot` in
 * `generate/transition.ts`, which reads `arrival` off the kit rather than being
 * handed it.
 *
 * **And it is the single loudest line in this file for a genre with no
 * cymbals.** One stroke, on the downbeat of the section it delivers — but a
 * chorus of `{cr lp mp hp}` files as a *kit* chorus to `drumStations`, which is
 * the question casting and the stage both ask, so one literal here decided what
 * object twenty-eight indian styles were seen to be playing. It cost 31 of 157
 * tani choruses across 400 songs before this took a station, and indian's own
 * `index.ts` had written the finding down and pointed at §2.1 rather than fix it
 * from outside. Re-measured wider — indian, arabic, latin and finnfolk at 100
 * songs each — it was 15 of the 60 choruses played on a table with no kit in it,
 * and it is 0 of 60 now. `npm run genres` asserts that as *a hand-drum genre
 * never sends for a kit*. `playBreak` makes the same argument about the same
 * cymbal in the same bar.
 */
export function landing(
  beat: number, arrival: number, station: SeamOrchestration = TRAP_KIT,
): DrumEvent {
  return {
    beat,
    voice: arrival > 0.82 ? station.land : station.landSoftly,
    velocity: Math.min(1, 0.6 + arrival * 0.35),
  };
}
