/**
 * Top-level song generation.
 *
 * Genre-agnostic: it picks a genre, then asks that genre for its styles, eras,
 * moods, forms, keys and chord-scale rule. Everything culturally specific lives
 * under `src/genre/`; this file only knows how to assemble a song from those
 * parts.
 *
 * Two structural devices are handled here because more than one genre uses
 * them, for different reasons:
 *  - a **solo section**, where the genre's rotation names a soloist, the solo
 *    engine writes them a chorus, and the rest of the band changes what it is
 *    playing underneath (a blowing chorus in jazz, an ornamented accordion
 *    break in iskelmä; ambient has no such thing and its forms contain none).
 *    See `generate/solo.ts` — this file only decides *where* the solo goes and
 *    what the backing policy does to the other layers,
 *  - and a **key change** for the final chorus, which is an iskelmä cliché,
 *    deliberately rare in jazz, and set to zero throughout ambient — each
 *    genre's eras set their own probability.
 */

import { CHORD_INTERVALS, parseRoman, type Chord } from '../core/chord.js';
import { keyLabel, type Pc } from '../core/pitch.js';
import { Rng } from '../core/rng.js';
import { makeScale, stepInScale, type Mode } from '../core/scale.js';
import {
  DEFAULT_DRUM_MIX, DEFAULT_SPACE, SEQUENCER_FROM, canVary, eligibleDrumSources,
  isPlayedByHand, melodicLine,
  type DrumEvent, type DrumTrack, type Effects, type LayerId, type NoteEvent,
  type Section, type SectionKind, type SequencedLayer, type Song, type Space,
  type Track,
} from '../core/types.js';
import {
  GENRES, getGenre, type EndingStyle, type FormStep, type Genre,
} from '../genre/index.js';
import {
  envelopeFor, foldIntoRange, HANDS, IDIOMS, INSTRUMENTS, rangeOfInstrument,
  type HandSpec, type Instrument, type InstrumentId,
} from '../style/instruments.js';
import type {
  EraProfile, LeftHandMode, Mood, Progression, Style, TwoHandedKeys,
} from '../style/types.js';
import { FEELS, type Feel, type FeelLayer, type FeelSpan } from '../style/feel.js';
import { planRegisters, resolveCollisions } from './arrange.js';
import { buildAccompaniment, getStrictness, resolveRules, type StrictnessId } from '../core/rules.js';
import { applyDynamics, punctuate, sectionIntensity, swell } from './dynamics.js';
import { applyFilter } from './filter.js';
import { DEFAULT_FILLS } from './fills.js';
import { applyTransitions, hitTogether, planTransitions, type Seam } from './transition.js';
import { getHook, RECALL_BIAS, type HookId } from './hook.js';
import { composeSectionTune } from '../tune/adapt.js';
import { planKeys } from '../tune/keyplan.js';
import { figureSlots, handOff, harmonise, joinIn, patchBand } from '../tune/band.js';
import { has, planChart, playing } from './chart.js';
import { varyRecall } from '../tune/tune.js';
import type { Signature } from '../tune/judge.js';
import { chooseMotto } from './motto.js';
import { SLOTS_PER_BEAT, trimOverlaps } from './rhythm.js';
import {
  compBehindSolo, drumsBehindSolo, generateDrumSolo, generateSolo, planSolos,
  type BarSpan, type SoloLayer,
} from './solo.js';
import { generateVocalTrack } from './vocals.js';
import {
  generateBass, generateBrass, generateComp, generateCounter, generateDrums,
  generateLeftHand, generatePad, planFigureVariation, planKitVariation,
  type PartContext, undoubleAgainst } from './parts.js';

export interface GenerateOptions {
  seed?: string | number;
  /** Genre id, e.g. 'iskelma' or 'jazz'. Picked at random when omitted. */
  genre?: string;
  era?: string;
  style?: string;
  mood?: string;
  /** Force a key, e.g. 9 for A. */
  tonic?: Pc;
  mode?: Mode;
  bpm?: number;
  /** Target song length in seconds; the form is stretched to fit. */
  targetSeconds?: number;
  /**
   * How hard to police the melody against known voice-leading faults.
   * Defaults to 'standard'. See `core/rules.ts`.
   */
  strictness?: StrictnessId | number;
  /**
   * How much the song repeats itself: whether a chorus is a fixed tune that
   * comes back, or fresh material every time. Independent of `strictness` —
   * one asks whether a note is wrong, the other whether it is familiar.
   * See `generate/hook.ts`.
   */
  hook?: HookId | number;
  /**
   * Add a sung line doubling the melody. Off by default — the station is
   * instrumental.
   *
   * It sings words, in an invented language nobody ever sees: `generate/vocals.ts`
   * makes up a lexicon per song and hands each section a line of it. Nothing
   * reaches the `Song` but syllables.
   *
   * This draws from its own RNG stream, so a seed produces the identical
   * instrumental arrangement whether or not vocals are on. That is what makes
   * the flag an A/B rather than a reroll.
   */
  vocals?: boolean;
  /**
   * Reroll one layer and nothing else.
   *
   * Every layer draws from its own named RNG stream, so salting one stream
   * gives back a song identical in form, key, tempo, instrumentation, groove
   * and every other part, with a different bass line — or melody, or comp.
   * `generateSong({ seed, variation: { melody: 1 } })` is a genuine
   * single-layer reroll rather than a new song that happens to share a seed.
   *
   * This exists for the concert stage, where a player hit by a tomato has to
   * stop and come back playing something else while the band carries on. It is
   * useful anywhere a part needs replacing without disturbing what surrounds
   * it, which is also how a game would revoice one stem at runtime.
   */
  variation?: Partial<Record<LayerId, number>>;
}

/**
 * Layers that draw an instrument from the era palette. Drums have their own
 * track shape, and the voice takes its sound from the genre rather than the
 * era — nobody's grandmother sang through a LinnDrum.
 */
type PlayedLayer = Exclude<LayerId, 'drums' | 'vocal'>;

/**
 * What an earlier section of a given kind left behind for later ones to recall.
 *
 * Only the *first* instance of each kind is ever stored, so every chorus
 * recalls the original statement rather than a copy of a copy. The melody is
 * kept relative to its section start and alongside the key it was written in,
 * because the final chorus frequently lifts a tone and a hook has to survive
 * that — a tune that fails to come back after the key change is the one place
 * where the device actively costs the listener something.
 */
interface Remembered {
  progression: Progression;
  tonic: Pc;
  melody?: NoteEvent[];
  /**
   * The hook this section was built on, as scale steps.
   *
   * Remembered alongside the notes so that a *recalled* section can still hand its
   * figure to the answering line. Without it the band quotes the tune in the chorus
   * that invents it and forgets it in the two that bring it back, which is exactly
   * backwards — the later ones are where a listener recognises the quotation.
   */
  hook?: number[];
  /** Its rhythm too, so a recalled section can still call the band in. */
  figure?: { at: number; dur: number }[];
}

export function generateSong(opts: GenerateOptions = {}): Song {
  const seed = String(opts.seed ?? Math.floor(Math.random() * 1e9));
  const rng = new Rng(seed);

  /**
   * Every choice below is *drawn first and overridden second*, even when the
   * caller has already said what it wants.
   *
   * The waste is deliberate, and it is the same argument that made the sections
   * draw their own streams — see the note further down. A short-circuit here
   * spends fewer random numbers when an option is supplied, which shifts every
   * later draw and hands back a different song. That makes `SongMeta`
   * *insufficient to reproduce the song it describes*: regenerating from the
   * seed, genre, era, style and mood a song reports produced a different form,
   * tempo and drum part.
   *
   * That was invisible while nothing needed to re-derive a song from its own
   * metadata. The concert stage does — a player hit by a tomato has to come
   * back with one layer rerolled and everything else identical — and it turned
   * the property into a requirement. It is worth having anyway: it is what
   * makes a `.mid` file's header enough to regenerate the piece.
   */
  const genre = getGenre(pick(rng.pick(Object.keys(GENRES)), opts.genre));
  const era = chooseEra(rng, genre, opts);
  const mood = lookup(genre.moods, opts.mood, 'mood', rng, Object.keys(genre.moods).slice(-1)[0]);
  const drawnStyle = chooseStyle(rng, genre, era, mood);
  const style = opts.style
    ? lookup(genre.styles, opts.style, 'style', rng, opts.style)
    : genre.styles[drawnStyle]!;
  const mode = pick(chooseMode(rng, style, mood), opts.mode);
  const tonic = pick(
    rng.weighted(mode === 'minor' ? genre.keys.minor : genre.keys.major), opts.tonic,
  );
  const bpm = pick(chooseTempo(rng, style, mood, era), opts.bpm);
  // Style overrides beat the genre default: bebop turns the rules off entirely.
  const strictness = getStrictness(opts.strictness ?? style.strictness ?? genre.defaultStrictness);
  const hook = getHook(opts.hook ?? style.hook ?? genre.defaultHook);
  /**
   * The same override shape as `strictness` and `hook`, and it is resolved here
   * rather than at each of the seven call sites so that there is one place to
   * read the answer off. The genre states the idiom's mapping; a style is
   * allowed to disagree about itself, and exactly one does — see
   * `Style.scaleForChord`.
   *
   * A function swap and nothing else: no draw, so every style that does not
   * override it generates the song it generated before this existed.
   */
  const scaleForChord = style.scaleForChord ?? genre.scaleForChord;
  /**
   * Which feels this band is willing to play, if any. See `style/feel.ts`.
   *
   * Resolved once, in the same shape and for the same reason as `scaleForChord`
   * above: the style's answer beats the genre's, and there is one place to read
   * it off. **Absent means no draw happens at all** — not a draw that is made
   * and discarded — which is what keeps every style that has not opted in
   * bit-identical to what it was. See the note on `Style.feels`, and the
   * `drumSource` note below for what the alternative cost last time.
   */
  const feelTable = style.feels ?? genre.feels;
  /**
   * …and what this band does at a section join. See `generate/transition.ts`.
   *
   * The same override in the same shape for the third time, and it carries the
   * same absent-means-no-draw rule: a style with no palette resolves to
   * `DEFAULT_TRANSITIONS` without taking a number, which is what makes wave 1 of
   * the transition work byte-identical to the catalogue it was written against.
   * Read in two places — the plan below, and the `meta` at the end, which
   * publishes the answer only where one was asked for.
   */
  const transitionTable = style.transitions ?? genre.transitions;
  /**
   * What the swing *is* over a span that has an opinion about it.
   *
   * Interpolated from the style's value rather than substituted for it, so that
   * `amount` means here what it means everywhere else in a feel: at 0 the style
   * is untouched, at 1 the feel's number wins outright, and half way is half way.
   * A straight bridge in a swung tune and a shuffled one in a straight tune are
   * the same expression with the two numbers swapped.
   */
  const swingOver = (feel: Feel, amount: number) => (feel.swing === undefined
    ? style.swing
    : style.swing + (feel.swing - style.swing) * amount);
  /**
   * …and the same interpolation for what a feel says to the *composed* layers.
   *
   * Every multiplier is pulled back toward 1 by `amount`, so a span played half
   * way toward funk asks the engine for half the extra syncopation, and a span
   * at 0 asks for nothing. Written as one expression beside `swingOver` because
   * a second place that decides what `amount` means is a second place that can
   * decide it differently.
   */
  const voiceOver = (feel: Feel, amount: number): NonNullable<Feel['voice']> | undefined => {
    const v = feel.voice;
    if (!v) return undefined;
    const toward = (m: number) => 1 + (m - 1) * amount;
    return {
      ...(v.syncopation !== undefined ? { syncopation: toward(v.syncopation) } : {}),
      ...(v.density !== undefined ? { density: toward(v.density) } : {}),
      ...(v.accents ? { accents: v.accents.map(toward) } : {}),
    };
  };

  const rules = resolveRules(genre.ruleOverrides);
  /**
   * Smoothness, seen by the arrangement rather than by the melody.
   *
   * The axis used to police the tune and nothing else, which left it unable to
   * fix the loudest source of sourness in the output — layers colliding in
   * register. It now also governs how far apart the layers are kept and how
   * strictly the low-interval limits apply. At 0 the band is allowed to pile
   * into one octave, which is a real sound and not merely an absence of care.
   */
  const clarity = strictness.level / 4;
  const density = clamp(era.density + mood.density, 0.25, 1);
  const instruments = chooseInstruments(rng, era, style);

  // ---- Form ------------------------------------------------------------
  const steps = buildForm(
    rng, genre, style, bpm,
    pick(rng.float(genre.duration[0], genre.duration[1]), opts.targetSeconds),
  );
  /**
   * Where the song changes key, and how it gets there. See `tune/keyplan.ts`.
   *
   * This used to be one roll and one field: if it came up, every section from the
   * last chorus onward went up a semitone or a tone, unannounced. The route can also
   * send a bridge to the subdominant or the dominant and bring it home, and it names
   * the applied dominant that belongs in the bar before each change — which is the
   * difference between a modulation and a splice.
   */
  const keys = planKeys({
    kinds: steps.map((step) => step.kind),
    chance: era.keyChangeChance,
    ...(genre.preparedModulation === false ? { prepared: false } : {}),
    rng,
  });

  /**
   * What this arrangement is made of — layers and devices both, drawn once.
   *
   * On its own stream so that adding a device cannot reshuffle the tune, the
   * groove or the instrumentation: the whole value of the chart is that two songs
   * differ in *what the band does*, and that is worth nothing if turning the knob
   * also rerolls everything else. See `generate/chart.ts`.
   *
   * It is handed the form's shape as well as the band's, and only for one
   * decision: a layer that leaves has to leave at its *last* section rather than
   * at a number drawn without knowing how many there are. `buildForm` has already
   * run and the counts cost no draw, so the chart stays what it was — a plan made
   * before a note is written — and the hook cannot reach it, because the form is
   * hook-invariant and `npm run genres` asserts exactly that.
   */
  const counts: Partial<Record<SectionKind, number>> = {};
  for (const step of steps) counts[step.kind] = (counts[step.kind] ?? 0) + 1;
  const chart = planChart({
    rng: new Rng(`${seed}:chart`),
    style, mood, density, counts,
    beatsPerBar: style.beatsPerBar,
    ...(genre.arrangement ? { weights: genre.arrangement } : {}),
  });

  const sections: Section[] = [];
  let bar = 0;
  const kindSoFar = new Map<SectionKind, number>();
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    const transpose = keys.transpose[i] ?? 0;
    /**
     * The same layers every time this kind of section comes round, unless the
     * chart says otherwise in so many words.
     *
     * Which is the whole point: a chorus that had horns and a repeat that does not
     * was happening in half of them and was nobody's decision. What `playing` reads
     * now is a window — `Chart.enters` lets a layer arrive late and `Chart.exits`
     * lets it sit out the last one — and the difference from the fault is that both
     * run one way only. Horns that enter on the second chorus and horns that lay
     * out for the last are two arrangements; horns that come and go are neither.
     */
    const nth = kindSoFar.get(step.kind) ?? 0;
    kindSoFar.set(step.kind, nth + 1);
    sections.push({
      kind: step.kind,
      startBar: bar,
      lengthBars: step.bars,
      transpose,
      mode,
      activeLayers: chart.layers[step.kind].filter((l) => playing(chart, step.kind, l, nth)),
      chordLabels: [],
    });
    bar += step.bars;
  }
  const totalBars = bar;

  /**
   * Which instrument answers for which layer. Needed before the section loop
   * now, because a solo section has to know who is soloing before it can decide
   * what register to write in — a bass solo and a trumpet solo do not share a
   * tessitura, and the arranger lays the section out before any of it is
   * written.
   */
  const layerInstruments: Record<PlayedLayer, Instrument> = {
    bass: instruments.bass,
    comp: instruments.comp,
    pad: instruments.pad,
    melody: instruments.melody,
    counter: instruments.counter,
    brass: instruments.brass,
  };

  /**
   * Who takes each chorus, settled for the whole song before a note is written.
   *
   * It has to be settled up front rather than per section, because the rotation
   * is a property of the *sequence*: "never the same player twice in a row" and
   * "trade fours on the last chorus" are both statements about what the other
   * choruses are, and a decision made one section at a time can only know about
   * the past. See `generate/solo.ts`.
   *
   * The stream is the song's, not a section's, for the same reason: the whole
   * plan is one draw and adding a solo section should not reshuffle the band.
   */
  const excludedLayers = new Set<LayerId>(style.excludeLayers ?? []);
  /**
   * Which parts are left to a sequencer rather than played by hand.
   *
   * Its own namespaced stream for the reason `drumSource` needed one: drawn
   * from the shared `rng` it would move every seed in the project, and the
   * probe that settled that showed the songs moving because a number had been
   * taken out of the stream rather than because anything about the draw
   * mattered.
   *
   * Two gates, in the order that makes them un-overridable. The year is hard
   * and runs first — no era table can put a sequencer behind a 1938 band. Then
   * the era's own chance per layer, which is where the period statement lives,
   * and which is absent for iskelmä and jazz because a pavilion orchestra and a
   * bop quintet had no such thing and would not have wanted one.
   */
  const sequencedRng = new Rng(`${seed}:sequenced`);
  const sequenced = new Set<SequencedLayer>();
  if (era.year >= SEQUENCER_FROM) {
    for (const layer of ['bass', 'counter'] as SequencedLayer[]) {
      const chance = era.sequenced?.[layer] ?? 0;
      if (chance > 0 && sequencedRng.chance(chance)) sequenced.add(layer);
    }
  }

  const soloPlan = planSolos({
    sections,
    profile: genre.solo,
    /**
     * A machine is never given a chorus.
     *
     * Not a taste: a solo is a player stepping forward, and a sequencer running
     * its figure while the band drops out behind it is a loop with everyone
     * politely waiting. It is also the one place a sequenced layer could still
     * have produced a follow spot pointed at nobody, since casting stages no
     * performer for it.
     */
    excluded: new Set([...excludedLayers, ...sequenced]),
    rng: new Rng(`${seed}:solo`),
    fallback: genre.soloBacking ?? 'full',
  });

  /**
   * A soloist is somebody who was already in the band.
   *
   * `planSolos` draws its player from the genre's rotation and `layersFor`
   * decides which layers sound in a verse, and the two have never spoken. Where
   * they disagreed the number grew a player who walks on, stands through the
   * head, takes one chorus and is never heard again: measured over 240 numbers,
   * 11 of the 105 with solos in them had one — a jazz alto sounding in 7 bars of
   * 96, a tango harp in 7 of 56. Always the counter, because the counter is the
   * one melodic layer a form can leave out.
   *
   * The stage cannot hide it either. `castSong` puts a body behind every track
   * that has notes in it and folds only keyboards into one another, so a horn
   * player stands at the front for three minutes and plays for twelve seconds.
   *
   * So the band makes the correction a band would make: whoever is taking a
   * chorus plays the head as well. Adding the layer to the sections that state
   * the tune costs no draw — every layer writes from its own named stream, and
   * this list is read rather than drawn from — so a number whose soloist was
   * already in the arrangement is unchanged to the note, and one whose soloist
   * was not gains an answering line through the heads and a player who has a
   * reason to be up there.
   *
   * The kit is exempt because a drummer is never not playing.
   */
  const soloistHeads = new Set<number>();
  for (const chorus of soloPlan.values()) {
    const layer: LayerId = chorus.layer;
    if (layer === 'drums') continue;
    /**
     * A verse or a chorus, and nothing else counts as being in the band.
     *
     * A bridge does not: it is the section the tune drops out of, so a player
     * down for the bridge and the solo and nothing between them is the very
     * thing this is here to stop — and `counterInBand` below reads the head the
     * same way, which is what keeps the two rules from arguing.
     */
    const inBand = sections.some((s) => (s.kind === 'verse' || s.kind === 'chorus')
      && s.activeLayers.includes(layer));
    sections.forEach((head, i) => {
      if (head.kind !== 'verse' && head.kind !== 'chorus') return;
      if (!inBand) head.activeLayers.push(layer);
      /**
       * Which heads the soloist has to be audible in — the promoted ones and the
       * ones they were already down for alike.
       *
       * The distinction matters for the answering line and for nothing else, which
       * is why only the counter is collected: every other layer writes whenever it
       * is listed, while the answer writes only where the tune leaves it room, so
       * "listed in the head" and "heard in the head" are the same statement for
       * the band and two different ones for this player. See where the set is read.
       */
      if (layer === 'counter' && head.activeLayers.includes(layer)) soloistHeads.add(i);
    });
  }

  /**
   * Whether the answering instrument is in this band or merely passing through.
   *
   * Read by `leadLayer` below, and the whole of what stops the bridge fix from
   * reinventing the fault above it. A bridge is the one section that can ask for
   * a counter and no melody, so a number whose counter is *only* down for the
   * bridge would stage a player for eight bars and nothing else — the same
   * stranger, introduced through a different door. 15 numbers in 240 were like
   * that, some of them four notes long.
   *
   * A bridge belongs to somebody who is already playing. Where nobody is, the
   * form's coin loses and the section stays as it always was, with the list
   * corrected at the end to say so.
   */
  const counterInBand = sections.some((s) => (s.kind === 'verse' || s.kind === 'chorus')
    && s.activeLayers.includes('counter'));

  // ---- Parts -----------------------------------------------------------
  const byLayer = new Map<LayerId, NoteEvent[]>();
  /**
   * The left hands, held aside rather than pushed into their layers.
   *
   * Each belongs in its own track and ends up there — see the merge after the
   * section loop — but none can go in yet, because a melodic layer is put
   * through `trimOverlaps` on the way out and that function's whole premise is
   * that the line it is clipping is *monophonic*. Handed a left-hand chord
   * sounding under a right-hand note it would read the two as one voice running
   * into the next and delete the chord, which is precisely the part being added.
   * Empty for every style whose players are horns and voices.
   *
   * Keyed by layer, because the lead is not the only person in the band with two
   * hands: an accordionist on the counter line has the same two, and in this
   * genre it is that accordionist who takes the break.
   */
  const leftHand = new Map<PlayedLayer, NoteEvent[]>();
  /**
   * Beat spans where a layer is carrying a solo rather than accompanying.
   *
   * Collected because a soloist was being mixed as whatever they normally are.
   * `Section.solo.layer` writes the chorus into the soloist's own layer — the
   * point of that design — and the track it lands in is then handed one gain
   * for the whole song, which is the *accompaniment* level of that layer. On
   * the default balance a counter solo played 4.6 dB under the tune it had
   * replaced and a comp solo 5.4 dB under, which is the opposite of what a solo
   * section is. See the assembly loop for what is done about it.
   */
  const soloSpans = new Map<PlayedLayer, [number, number][]>();
  const drumEvents: DrumEvent[] = [];
  for (const l of ['drums', 'bass', 'comp', 'pad', 'melody', 'counter', 'brass'] as LayerId[]) {
    byLayer.set(l, []);
  }

  // Fix the rhythm-section figures for the whole song — a band does not change
  // its comping pattern every eight bars.
  const bassPattern = rng.weightedBy(style.bass, (p) => p.weight);
  const compPattern = rng.weightedBy(style.comp, (p) => p.weight);
  const drumPattern = rng.weightedBy(style.drums, (p) => p.weight);
  const drumBank = rng.weighted(era.drumBanks);
  /**
   * What is making the percussion, as an object. See `DrumSource`.
   *
   * Drawn here with the other rhythm-section decisions and *before* a single
   * drum event is written, because it constrains what may be written: a preset
   * box has no fill, no drum solo and no response to how hard the section is
   * going. Choosing it afterwards would stage a machine miming music it has no
   * mechanism for — see the note on `DrumSource`.
   *
   * A style whose identity is the drummer's may veto the box outright. That is a
   * stronger statement than a weight and it belongs to the style rather than to
   * the decade: `bebop` in 1957 is a kit era anyway, but a style that *needed*
   * saying so should not have to hope the era table agrees.
   */
  /**
   * Its own stream, and that is not tidiness — it is the difference between
   * this field being additive and it rewriting the whole corpus.
   *
   * Drawn from `rng` it consumed one number and moved every draw after it, so
   * every song in every genre came out different. Measured: `npm run genres`
   * went from 66% to 59% on iskelmä's solo-arc check and failed it. The probe
   * that settled the cause is worth recording, because the answer is not the
   * obvious one — re-weighting the table from 8:2 to 400:1, which very nearly
   * removes the box, produced *bit-identical* numbers. Nothing the box did
   * mattered. The songs moved because one number had been taken out of the
   * stream in front of them.
   *
   * So it gets a namespace, like `${seed}:vocal` and `${seed}:solo:*` before it,
   * and every song this generator has ever written is unchanged unless it
   * actually has a machine in it.
   */
  const drumSource = new Rng(`${seed}:drums:source`).weighted(eligibleDrumSources(
    era.year,
    style.boxDrums === false
      ? era.drumSources?.filter(([source]) => source !== 'box')
      : era.drumSources,
  ));

  /**
   * What happens at each section join, settled before a note is written.
   *
   * Up here with `soloPlan` and `keys` rather than beside `applyTransitions`,
   * which is where it started, and the move is not tidiness: the section loop
   * has to be able to read it. A `fill` *is* the drummer's fill, and that is
   * written inside `generateDrums` while the section is being made — so the only
   * way a seam that has drawn something else can stop two arrangements
   * announcing the same downbeat is for `fillAtEnd` below to see the answer. A
   * plan resolved after the loop would leave the shot pass trying to unpick fill
   * events out of a merged `drumEvents` array, which is the shape of a bug
   * rather than of a pass.
   *
   * …and *below* `drumSource` rather than above it, which is the second half of
   * the same argument. A preset box gets `fill` and nothing else — it has one
   * pattern per button and no hands to play a figure — and that answer has to be
   * settled here, before the veto is read, rather than at the edit. Moving this
   * line down is free: nothing between the two touches a stream.
   *
   * **Absent means no draw at all** — see `planTransitions`, which is where that
   * is enforced and argued.
   *
   * The solo plan comes with it, and only for its drum bars. A `break` may not
   * land on a bar the drummer already has to themselves — the band is out and
   * the gesture has already happened — and `Section.solo` is the obvious place
   * to read that from and does not exist yet, since it is written inside the
   * loop below. `soloPlan` is the same answer, three hundred lines earlier.
   */
  /**
   * The figure the rhythm section is already playing, for a seam shot to hit.
   *
   * Hook-invariant by construction, which is the whole permission: these two
   * patterns were drawn above, before `hookRng` exists and before the section
   * loop, and the running stream inside that loop is deliberately kept aligned
   * across hook levels. A bass pattern cannot move when the tune does, so the
   * kit is free to play a figure made of one. See `ShotSource.band`.
   *
   * A cycled pattern is left out rather than folded in. Its slots are relative
   * to the figure and not to the bar — see `Cycle` in `style/types.ts` — so
   * reading them as bar positions would be arithmetic on two different
   * coordinate systems, and the metre is a better answer than a wrong one.
   */
  const bandFigure = [
    ...(bassPattern.cycle ? [] : bassPattern.hits.map((h) => h.at)),
    ...(compPattern.cycle ? [] : compPattern.hits.map((h) => h.at)),
  ];
  const seams: Seam[] = planTransitions({
    sections,
    seed,
    palette: transitionTable,
    metre: { ...style, ...(bandFigure.length ? { band: bandFigure } : {}) },
    drums: drumSource,
    drumBars: new Map([...soloPlan].map(([at, chorus]) => [at, chorus.drumBars])),
  });

  /**
   * The second sequencer, where the style has one — fixed for the song like
   * every other rhythm-section figure, because a machine that changed its
   * pattern at every section boundary would be somebody playing it.
   *
   * Drawn only when the style asks for `ostinato`, so that no style which does
   * not consumes a draw and shifts every seed after it.
   */
  const counterPattern = style.counterMode === 'ostinato' && style.counterPatterns?.length
    ? rng.weightedBy(style.counterPatterns, (p) => p.weight)
    : undefined;

  /**
   * The song's own figure, chosen once and quoted throughout in proportion to
   * `hook`. Drawn from its own stream so that adding it did not shift every
   * later decision — the same reason the band and the melody have separate
   * streams. See `generate/motto.ts`.
   */
  const motto = chooseMotto(new Rng(`${seed}:motto`), style, style.beatsPerBar * 4);

  /**
   * Every section draws from its own streams rather than from one running
   * stream shared by the whole song.
   *
   * This is what makes `--strictness` and `--hook` comparisons rather than
   * rerolls: whatever they do to the tune, the seed still fixes the form, the
   * key, the tempo, the instruments and the drums. On a single stream any
   * decision that consumed one more random number than before — a melody with
   * an extra note, a recalled chorus whose chords sent the comp down a
   * different path — shifted every later section's drum fills too, and the two
   * level controls stopped being A/B tests of anything.
   *
   * The band's *identity* is still fixed for the whole song: the bass, comp and
   * drum patterns are chosen once, above. What is per-section here is only the
   * variation within them.
   */
  const remembered = new Map<string, Remembered>();
  /**
   * Fingerprints of every tune this song has already written.
   *
   * Handed to each new section so the engine can score how unlike the rest of the
   * song a candidate is — the `freshness` term in `tune/judge.ts`. Without it a
   * verse and a chorus can legitimately converge on the same tune, since nothing
   * either of them is measured against knows the other exists.
   */
  const stated: Signature[] = [];
  const hookRng = new Rng(`${seed}:hook`);
  const seenKinds = new Map<SectionKind, number>();
  /**
   * The chord the piece finishes on, in concert pitch. See `landEnding`.
   *
   * Captured here rather than re-derived from `Section.chordLabels` at the end,
   * because a label is a roman numeral and reading one back means knowing the
   * section's mode *and* its transposition — which is exactly the pair of
   * things the final chorus's key change moves.
   */
  let finalChord: Chord | undefined;
  /**
   * How each stretch of the song is felt, collected as it is decided and handed
   * to the IR at the end. Empty — and therefore omitted from `meta` — for every
   * style that names no table.
   */
  const feels: FeelSpan[] = [];

  for (let s = 0; s < sections.length; s++) {
    const section = sections[s]!;
    const localTonic = ((tonic + section.transpose) % 12 + 12) % 12;

    /**
     * How this section is felt. Drawn here, applied in two places and at two
     * different moments, and the split is the load-bearing part of the design.
     *
     * One draw per section, from its own namespaced stream, and **only where
     * there is a table to draw from** — a style that has not opted in must not
     * consume a number here, or every song in the catalogue moves. See
     * `Style.feels`.
     *
     * Per section rather than per song because that is what a feel *is*: a
     * statement about a passage. Per bar would be a different feature and is
     * wave 5's; sections change at their boundary, which is where a band changes
     * anything.
     *
     * **It is drawn before a note exists**, which is why it is up here rather
     * than beside `applyFeel` where it started. The composed layers take their
     * half of a feel as multipliers into the `Voice`, before the audition runs,
     * and something the audition has to see cannot be decided after it. Moving
     * the draw costs nothing and could not: the stream is its own, so reading it
     * earlier changes no other draw in the song.
     */
    let felt: {
      feel: Feel;
      amount: number;
      /** The `voice` block, already pulled back by `amount`. Absent for most feels. */
      voice?: NonNullable<Feel['voice']>;
    } | undefined;
    if (feelTable?.length) {
      const feelBias = mood.feelBias;
      const feel = FEELS[new Rng(`${seed}:feel:${s}`).weighted(
        feelTable.map(([id, w]) => [id, w * (feelBias?.[id] ?? 1)] as const),
      )];
      /**
       * Whole-hearted, always, for now. A partial amount is how a break eases
       * in and out of half time, which is wave 5's problem; a section either is
       * or is not played in the pocket.
       */
      const amount = 1;
      const voice = voiceOver(feel, amount);
      felt = { feel, amount, ...(voice ? { voice } : {}) };
    }

    // Recall is keyed by kind *and* length: a twelve-bar blues chorus and an
    // eight-bar one are not the same section wearing different clothes.
    const memoryKey = `${section.kind}:${section.lengthBars}`;
    const prior = remembered.get(memoryKey);
    const bias = RECALL_BIAS[section.kind];
    const replayTune = prior?.melody !== undefined && hookRng.chance(hook.recall * bias);
    // A remembered tune has to arrive over the harmony it was written against;
    // replaying it over fresh chords is not a recollection, it is a mistake.
    const replayChords = prior !== undefined
      && (replayTune || hookRng.chance(hook.harmonyRecall * bias));

    // Drawn even when it is about to be discarded. The waste is deliberate:
    // keeping the band's stream aligned across hook levels is what stops a
    // recalled chorus from reshuffling every later section's comping.
    const fresh = pickProgression(rng, style, section.kind, mode, hook.harmonicSimplicity);
    const progression = replayChords && prior ? prior.progression : fresh;
    const chords = expandProgression(progression, section.lengthBars, mode);
    /**
     * The pivot into the next key, in the last bar of the section before it.
     *
     * Written as a roman numeral and parsed back, so the label and the chord agree by
     * construction: `V7/II` *is* the dominant of the key a tone up, and every tool
     * that reads `Section.chordLabels` — the showbill, the guide-tone check, the
     * strudel comments — reads the same chord the generator wrote.
     */
    const pivot = keys.pivots.get(s);
    if (pivot && chords.length) chords[chords.length - 1] = parseRoman(pivot, mode);
    section.chordLabels = chords.map((c) => c.label);

    // Install this section's memory before generating, so nothing recalls
    // itself, and so a kind whose first instance carries no melody still
    // contributes its harmony.
    let memory = prior;
    if (!memory && bias > 0) {
      memory = { progression, tonic: localTonic };
      remembered.set(memoryKey, memory);
    }

    // Roman numerals parse to offsets *from the tonic*, so shifting by the
    // local tonic is what actually puts the song in its key.
    const ctxBase = {
      chords: chords.map((c) => transposeChord(c, localTonic)),
      beatsPerBar: style.beatsPerBar,
      startBeat: section.startBar * style.beatsPerBar,
      style,
    };
    if (s === sections.length - 1) finalChord = ctxBase.chords[ctxBase.chords.length - 1];

    /**
     * One stream per layer per section, rather than one stream for the whole
     * band.
     *
     * The band used to share `${seed}:band:${s}`, drawing from it in the order
     * the parts happened to be written. That was already a level finer than a
     * single song-wide stream — see the note above about why sections are
     * separated — and it needs one level finer still, because a shared stream
     * means the layers are entangled: reroll the bass and the comp moves too,
     * since it is now reading different numbers off the same tape.
     *
     * Splitting it is what makes `variation` mean what it says. It is also the
     * same argument that separated the sections, applied to the other axis.
     */
    const salt = (layer: LayerId): string => {
      const v = opts.variation?.[layer];
      return v ? `:v${v}` : '';
    };
    const ctxFor = (layer: LayerId): PartContext => ({
      ...ctxBase,
      rng: new Rng(`${seed}:band:${s}:${layer}${salt(layer)}`),
    });

    /**
     * The soloist rewrites the section's layer list.
     *
     * `layersFor` builds a solo section from a template — drums, bass, comp,
     * pad, melody — which was correct when "solo" meant "the lead rests and the
     * counter instrument takes the tune" and is wrong now that a genre names a
     * player. Three corrections, and each of them is a thing the band actually
     * does:
     *
     *  - **the soloist's layer sounds**, whoever it is. The counter instrument
     *    was already being written into a section that did not list it, which
     *    left `Section.activeLayers` lying to everything downstream.
     *  - **the lead rests** unless the lead is the one soloing. That is what a
     *    solo section is for.
     *  - **the backing policy removes layers.** A jazz band under a blowing
     *    chorus is bass, drums and a comper; a sustained pad through it is a
     *    film cue. Iskelmä's `full` keeps everything, because there the pattern
     *    continuing exactly as written *is* the policy.
     *
     * Done here rather than inside `layersFor`, which draws from `rng` — a
     * change to the draws in there would reshuffle every song in the catalogue.
     */
    const solo = soloPlan.get(s);
    if (solo) {
      const layers = new Set(section.activeLayers);
      if (solo.layer !== 'drums') layers.add(solo.layer);
      if (solo.layer !== 'melody') layers.delete('melody');
      if (solo.whilePlaying === 'comping' || solo.whilePlaying === 'sparse') layers.delete('pad');
      if (solo.whilePlaying === 'sparse') layers.delete('comp');
      // A drum chorus: the band is not playing quietly, it is not playing.
      if (!solo.soloBars.length) {
        for (const l of ['bass', 'comp', 'pad'] as LayerId[]) layers.delete(l);
      }
      section.activeLayers = [...layers];
    }

    /** Whether a beat falls inside one of a solo's bar spans. */
    const inSpans = (beat: number, spans: readonly BarSpan[]): boolean => {
      const from = section.startBar * style.beatsPerBar;
      return spans.some(([a, b]) =>
        beat >= from + a * style.beatsPerBar - 1e-6 && beat < from + b * style.beatsPerBar - 1e-6);
    };

    const active = new Set(section.activeLayers);
    /**
     * How hard the band plays this section. Replaces a three-way guess that
     * only the drums ever saw — see `generate/dynamics.ts`.
     */
    const ordinal = seenKinds.get(section.kind) ?? 0;
    seenKinds.set(section.kind, ordinal + 1);
    const placement = {
      kind: section.kind, index: s, total: sections.length, ordinal,
    };
    const intensity = sectionIntensity(placement);

    /**
     * How far open the filter is, laid on the same section and the same
     * placement the dynamics use.
     *
     * A sibling of `applyDynamics` and applied alongside it, but the two are
     * independent gestures rather than one gesture in two units: an intro can be
     * quiet and open, and a closed filter over a loud chorus is a different
     * thing from a quiet one. Where the genre has no filter profile — which is
     * three of the four — this returns its argument untouched and no note ever
     * gains a `brightness`. See `generate/filter.ts`.
     */
    const filtered = (notes: NoteEvent[], layer: LayerId): NoteEvent[] => applyFilter(
      notes,
      layer,
      {
        ...(genre.filter ? { profile: genre.filter } : {}),
        ...(style.filter ? { sweep: style.filter } : {}),
        at: placement,
        startBeat: section.startBar * style.beatsPerBar,
        lengthBeats: section.lengthBars * style.beatsPerBar,
      },
    );

    /**
     * Where this section's drumming starts in the running list.
     *
     * The kit is the one part not held in a `section…` local: pattern, fill and
     * drum solo are pushed straight onto the song's own array as they are
     * written. The per-section passes at the foot of the loop still have to be
     * able to reach only this section's events, and an index into the array is
     * the cheapest honest way to say which those are.
     */
    const drumsFrom = drumEvents.length;

    if (active.has('drums')) {
      /**
       * A fill is a delivery, so how big it is belongs to the section it is
       * delivering rather than to the one just finishing. The largest fill in a
       * song is the one into the last chorus, and that is true even when the
       * verse before it was quiet.
       */
      const next = sections[s + 1];
      const arrival = next
        ? sectionIntensity({
          kind: next.kind,
          index: s + 1,
          total: sections.length,
          ordinal: seenKinds.get(next.kind) ?? 0,
        })
        : intensity;
      /**
       * The drummer's own bars are not the pattern.
       *
       * Where a solo hands the kit whole bars — a drum chorus, or the drummer's
       * half of a traded eight — the written pattern is silenced there and the
       * drum solo generator fills the hole. The fill at the section end goes
       * with it: the solo has its own ending, and a pattern fill on top of it
       * would be two drummers announcing the same downbeat.
       */
      /**
       * …and a rhythm box has no bars of its own, because it has no hands.
       *
       * `canVary` is false for exactly one source and it takes away exactly the
       * three things that source cannot do: the fill, the solo, and the velocity
       * that answers how hard the section is going. All three are the same
       * capability — a part that differs bar to bar — and a Mini Pops has one
       * pattern per button and a volume knob.
       */
      const machine = !canVary(drumSource);
      const kitSolo = !machine && solo?.drumBars.length ? solo.drumBars : undefined;
      const lastBarIsSolo = kitSolo !== undefined
        && kitSolo[kitSolo.length - 1]![1] >= section.lengthBars;
      /**
       * What the hand is doing this section. See `KitVariation`.
       *
       * Its own stream, and for the reason `boxDrums` above documents at
       * length: drawn from `ctxFor('drums')` this would consume numbers in
       * front of the fill and the per-hit jitter, and every drum part in the
       * catalogue would come out different whether or not the hand ever moved.
       * Namespaced, the only thing that changes is what this actually does.
       *
       * Salted like every other layer, so `variation: { drums }` rerolls the
       * hand along with the rest of the kit rather than leaving it pinned.
       *
       * A box gets none — one pattern per button, and no hand on the kit to
       * move. The same three-way rule `machine` already carries for the fill,
       * the drum solo and the intensity response.
       */
      const hand = machine ? undefined : planKitVariation(drumPattern, {
        intensity,
        rng: new Rng(`${seed}:kit:${s}${salt('drums')}`),
      });
      const pattern = generateDrums(ctxFor('drums'), drumPattern, {
        /**
         * …and the seam plan gets the last word, which is what makes the
         * drummer's fill the implementation of `fill` rather than a thing that
         * happens beside it.
         *
         * A veto and never a grant: where the plan says `fill` — which is every
         * seam in the catalogue today, and every seam in any style that has not
         * declared a palette — this reads exactly as it always did, and the
         * three existing conditions still decide. Where a later wave draws
         * `shot`, `break` or `elide`, the kit stops announcing the join twice.
         *
         * `?? 'fill'` covers the last section, which has no seam after it. That
         * is not a fallback dressed as one: a fill in the final bar of a song
         * whose last section is not an outro is delivering the ending rather
         * than a section, and nothing here is entitled to take it away.
         */
        // …and a gesture aimed *into* the section rather than at the join takes
        // nothing away, because the join is not what it is announcing. Without
        // this the drummer loses the fill to a shot two bars earlier and the
        // seam arrives with nobody on it. See `Seam.anchor`.
        fillAtEnd: !machine && section.kind !== 'outro'
          && style.drumFills !== false && !lastBarIsSolo
          && ((seams[s]?.kind ?? 'fill') === 'fill' || seams[s]?.anchor === 'inside'),
        intensity,
        arrival,
        machine,
        palette: style.fills ?? genre.fills ?? DEFAULT_FILLS,
        ...(hand ? { variation: hand } : {}),
      });

      const behind = kitSolo
        ? pattern.filter((e) => !inSpans(e.beat, kitSolo))
        : pattern;
      /**
       * …and it does not drop to brushes behind the sax, either.
       *
       * `drumsBehindSolo` moves the hand from the hat to the ride and, on the
       * sparse policy, swaps the whole kit for brushes at 0.62. Both are a
       * drummer listening to someone else play. A Mini Pops has a volume knob
       * and nobody's hand is on it, so the machine keeps time through the solo
       * exactly as it kept time through the verse — which is, incidentally, the
       * reason a rhythm box makes a soloist sound lonely, and is worth having
       * rather than smoothing away.
       *
       * Found by counting distinct velocities in a generated box part: three
       * were expected, from `accentOf`, and five turned up.
       */
      drumEvents.push(...(solo && !machine ? drumsBehindSolo(behind, solo.whilePlaying) : behind));

      if (kitSolo) {
        drumEvents.push(...generateDrumSolo({
          startBeat: section.startBar * style.beatsPerBar,
          beatsPerBar: style.beatsPerBar,
          bars: section.lengthBars,
          blocks: kitSolo,
          rng: new Rng(`${seed}:solo:${s}:kit`),
          intensity,
          // The crash the band comes back in on belongs to whoever is next —
          // unless somebody else is already playing there, in which case the
          // drummer is handing over inside the section rather than out of it.
          landing: lastBarIsSolo,
        }));
      }
    }

    /**
     * Who is out front, and in what register.
     *
     * `leadLayer` used to be a two-way guess — melody, or counter in a solo
     * section — which three separate files re-derived for themselves and which
     * a stage cannot use at all: a follow spot cannot be pointed at an implicit
     * convention. The genre's rotation names the player now, and this is only
     * the lookup.
     */
    const isSolo = section.kind === 'solo';
    const soloLayer: Exclude<SoloLayer, 'drums'> | undefined =
      solo && solo.layer !== 'drums' ? solo.layer : undefined;
    /**
     * …and where the form drops the tune but keeps the answer, the answer *is*
     * the tune.
     *
     * A bridge is `drums bass comp pad` plus a coin for the counter (see
     * `layersFor`), which says outright what a bridge is for: the singer stops
     * and the second instrument has the section. It never happened. The
     * answering line is written in the melody branch below, so a bridge that
     * asked for a counter and had no melody to hang it off wrote nothing at all
     * — 21 of the 44 sections in 160 numbers whose `activeLayers` claimed a
     * layer that never sounded, every one of them a bridge, every one of them
     * eight bars of accompaniment with no line over it.
     *
     * Naming the counter as the lead is the whole fix: the section then goes
     * down the path it should always have taken and is *composed*, in the
     * counter instrument's own register and idiom, rather than being fitted into
     * the holes of a tune that is not there.
     */
    const leadLayer: LayerId = soloLayer
      ?? (!active.has('melody') && active.has('counter') && counterInBand ? 'counter' : 'melody');
    const leadInstrument = layerInstruments[leadLayer as PlayedLayer];

    /**
     * Lay the section out in register *before* writing any of it.
     *
     * This is the stage that was missing. Every part used to take its register
     * from its own instrument and nothing else, so the comp and the pad voiced
     * themselves straight through the tune. See `generate/arrange.ts`.
     */
    const plan = planRegisters({
      leadCentre: leadInstrument.centre,
      span: style.melody.span,
      // A bass solo is the one line that must *not* push the accompaniment
      // underneath it: there is nothing underneath a bass. The `sparse` policy
      // has already taken the comp and pad away, and the solo is given the
      // bass's own register explicitly below.
      leadPresent: soloLayer ? soloLayer !== 'bass' : active.has('melody'),
      clarity,
      ...(genre.layerPlan?.offsets ? { offsets: genre.layerPlan.offsets } : {}),
      centres: {
        comp: instruments.comp.centre,
        pad: instruments.pad.centre,
        brass: instruments.brass.centre,
        counter: instruments.counter.centre,
      },
    });
    const limitFor = (layer: LayerId) => ({
      clarity,
      ...(plan.ceiling[layer] !== undefined ? { ceiling: plan.ceiling[layer]! } : {}),
    });

    /**
     * What the bass does differently at this section's phrase ends.
     *
     * **Its own stream, and that is the whole of why this is additive.** A style
     * that declares no `vary` never gets here, constructs no `Rng` and draws no
     * number, so its songs are what they were. A style that does draws from a
     * namespace nothing else reads — the lesson `drumSource` records above, and
     * the one `applyFeel` learned again more sharply: a per-section stream shared
     * with the band walks the bass first, the bass follows the tune, and the tune
     * is exactly what `--hook` moves.
     */
    const varyFor = (
      layer: 'bass' | 'comp',
      pattern: { hits: readonly { at: number; dur: number }[]; cycle?: number; arpeggio?: boolean },
    ) => (style.vary?.[layer]
      ? planFigureVariation(pattern, {
        chance: style.vary[layer]!,
        rng: new Rng(`${seed}:vary:${layer}:${s}${salt(layer)}`),
        slotsPerBar: style.beatsPerBar * 4,
        ...(style.groups ? { groups: style.groups } : {}),
      })
      : undefined);
    const bassVariation = varyFor('bass', bassPattern);
    const compVariation = varyFor('comp', compPattern);

    // Keep this section's accompaniment to hand: the melody is written last, so
    // it can be checked against what the band is actually holding underneath.
    // A soloist's own layer is skipped here — a bass taking a chorus is not
    // also walking behind it, and a pianist soloing is not also comping.
    let sectionBass = active.has('bass') && soloLayer !== 'bass'
      ? generateBass(ctxFor('bass'), bassPattern, {
        ...(bassVariation ? { variation: bassVariation } : {}),
      })
      : [];
    let sectionComp = active.has('comp') && soloLayer !== 'comp'
      ? generateComp(
        ctxFor('comp'), compPattern, instruments.comp.centre,
        (c) => scaleForChord(localTonic, mode, c),
        limitFor('comp'),
        // The comp layer only. Where the *counter* plays a chord pattern it is
        // playing a figure on purpose — a sequence, a riff — and the whole point
        // of those is that they do not vary. See `Genre.comping`.
        genre.comping,
        // …and the phrase-end gesture is the comp's alone for the same reason,
        // which is why it is passed here and not at the counter's call below.
        compVariation,
      )
      : [];
    let sectionPad = active.has('pad')
      ? generatePad(ctxFor('pad'), instruments.pad.centre, 4, limitFor('pad'))
      : [];
    // Brass is written *after* the melody, below: it answers the tune's gaps
    // and swells under its held notes, so it cannot be written before there is
    // a tune to answer.
    let sectionBrass: NoteEvent[] = [];

    /**
     * What the band does behind the soloist, applied before the line is written
     * so the vertical rules see the thinned version rather than the pattern.
     *
     * `comping` is the one that earns its keep. The comp gets sparser and
     * later — it answers the soloist instead of running its figure at them —
     * and that single transformation is what most makes a solo sound like a
     * solo rather than like a different melody over the same accompaniment.
     * `trade` is the other half: the band stops dead for the drummer's four and
     * comes back in on the downbeat, which is only a filter because the notes
     * were already written.
     */
    if (solo) {
      const backRng = new Rng(`${seed}:solo:${s}:back`);
      if (solo.whilePlaying === 'comping') sectionComp = compBehindSolo(sectionComp, backRng);
      if (solo.drumBars.length) {
        const hush = (notes: NoteEvent[]) => notes.filter((n) => !inSpans(n.beat, solo.drumBars));
        sectionBass = hush(sectionBass);
        sectionComp = hush(sectionComp);
        sectionPad = hush(sectionPad);
      }
    }

    const accompaniment = buildAccompaniment([sectionBass, sectionComp, sectionPad]);
    let sectionMelody: NoteEvent[] = [];
    /**
     * Held aside rather than pushed, so the collision pass can see it.
     *
     * The answering line is written against the tune and still ends up doubling it
     * occasionally — a note held across the section seam, a variation applied to a
     * recalled tune after the answer was placed, an escape search that ran out of
     * chord tones. `resolveCollisions` is the pass that already fixes exactly this
     * for the comp, the pad and the brass, and it runs after every part exists,
     * which is the only place the guarantee can actually be made.
     */
    let sectionCounter: NoteEvent[] = [];
    /**
     * The figure this section is about, held at section scope so the band can have
     * it. Freshly written where there is a new tune, remembered where the section is
     * a recollection — the later choruses are exactly where a quotation lands.
     */
    let sectionHook: { contour: number[]; onsets: { at: number; dur: number }[] } | undefined;

    if (solo && soloLayer && genre.solo) {
      /**
       * The chorus itself.
       *
       * Written into the soloist's own layer, which is what makes
       * `Section.solo.layer` mean something to everything downstream — the
       * spotlight, the hook report and the recall check all read it rather than
       * re-deriving "solo means counter" for themselves.
       *
       * A bass solo gets the neck rather than the arranger's lead window. A
       * bassist soloing plays in the octave above where they walk, and handing
       * them the horn's register would put the line where the instrument does
       * not exist.
       */
      const soloInstrument = layerInstruments[soloLayer as PlayedLayer];
      const range: [number, number] = soloLayer === 'bass'
        ? [soloInstrument.centre - 2, soloInstrument.centre + 20]
        : plan.lead;
      /**
       * The tune, for a genre whose break paraphrases rather than improvises.
       *
       * Taken from whatever the song has already stated at this length — the
       * chorus if there is one, otherwise the verse. `generate/solo.ts` reads
       * only its *contour*, in scale steps, so nothing has to be transposed and
       * a break after a key change still quotes the right shape.
       */
      const stated = genre.solo.vocabulary.paraphrase > 0
        ? remembered.get(`chorus:${section.lengthBars}`)
          ?? remembered.get(`verse:${section.lengthBars}`)
        : undefined;

      const line = generateSolo({
        chords: ctxBase.chords,
        beatsPerBar: style.beatsPerBar,
        startBeat: ctxBase.startBeat,
        rng: new Rng(`${seed}:solo:${s}${salt(soloLayer)}`),
        range,
        tonic: localTonic,
        mode,
        scaleForChord,
        vocabulary: genre.solo.vocabulary,
        blocks: solo.soloBars,
        chorus: solo.index,
        choruses: solo.total,
        intensity,
        strictness: strictness.level,
        rules,
        accompaniment,
        agility: soloInstrument.agility,
        idiom: IDIOMS[soloInstrument.idiom],
        motto,
        quoteMotto: genre.solo.quoteMotto ?? 0,
        swing: style.swing,
        ...(stated?.melody ? { theme: stated.melody } : {}),
        /**
         * Only the lead layer may write backwards across the section join.
         *
         * Coming in before the downbeat is the most characteristic entrance a
         * soloist has, and it is safe on the melody layer for the same reason
         * the melody engine's own anacrusis is: whatever it lands on top of is
         * that layer's previous cadence, and the concatenation trim clips it.
         *
         * It is not safe anywhere else, and the check caught it. A counter
         * pickup lands inside the previous section, where the *melody* is still
         * playing, and the two layers are never compared — 2.2% of overlapping
         * counter notes ended up doubling the tune at the unison or octave,
         * which `npm run genres` asserts must never happen. A comp or bass
         * pickup is worse still: it sounds on top of a chord that is still
         * ringing and nothing downstream would clear it.
         */
        pickupBeats: soloLayer === 'melody' ? 1 : 0,
      });
      applyDynamics(line, soloLayer, intensity, genre.layerPlan?.response);
      push(byLayer, soloLayer, filtered(line, soloLayer));
      // The whole section, not just `solo.soloBars`: the soloist's layer writes
      // nothing else here — see the `soloLayer !== …` guards on the
      // accompaniment above — so the section *is* the span it holds the floor.
      const from = section.startBar * style.beatsPerBar;
      const spans = soloSpans.get(soloLayer as PlayedLayer) ?? [];
      spans.push([from, from + section.lengthBars * style.beatsPerBar]);
      soloSpans.set(soloLayer as PlayedLayer, spans);
      sectionMelody = line;
    } else if (active.has(leadLayer)) {
      const range: [number, number] = plan.lead;
      /**
       * The tune.
       *
       * Either recalled from an earlier section of the same kind, or written from
       * scratch by the engine in `src/tune/` — which plans the whole section before
       * placing a note, writes it two dozen times, and keeps the one its own judge
       * scores highest. See `docs/tune-plan.md`.
       *
       * The stream tag is salted like every other layer. Without it
       * `variation: { melody }` was a no-op on the one layer it names, and a hit
       * singer came back playing exactly what they had been playing.
       */
      const written = replayTune && prior?.melody
        ? undefined
        : composeSectionTune({
          style,
          hook,
          kind: section.kind,
          chords: ctxBase.chords,
          startBeat: ctxBase.startBeat,
          tonic: localTonic,
          mode,
          range,
          scaleForChord,
          tag: `${seed}:tune:${s}${salt('melody')}`,
          strictness: strictness.level,
          rules,
          accompaniment,
          // The instrument actually playing this line. Agility says how far it can
          // reach; the idiom says what it plays — whether it breaks chords, runs up
          // scales, holds one note, or has to stop and breathe.
          agility: leadInstrument.agility,
          idiom: IDIOMS[leadInstrument.idiom],
          // Everything the song has already stated, so this section can be told
          // apart from it. Without this the freshness term has nothing to measure
          // and a verse and a chorus may legitimately converge on one tune.
          avoid: stated,
          mood: { leap: mood.leap, ornament: mood.ornament },
          /**
           * …and how the section is felt, in the same place and for the same
           * reason. This is the only door a feel has onto a composed part, and
           * it is deliberately on this side of the audition: the judge has to
           * score the tune the feel asked for, not a tune that was written
           * straight and then shoved off the beat afterwards.
           *
           * Absent for `straight` and `pocket` and for every style with no feel
           * table, so most songs pass `undefined` here and compose exactly what
           * they always did.
           */
          ...(felt?.voice ? { feel: felt.voice } : {}),
        });
      /**
       * A recalled tune comes back varied rather than pasted.
       *
       * How far varied is a property of *which* time this is, not of the hook
       * setting: an arrangement leaves the second chorus nearly alone and takes the
       * high note up on the last one. And a high hook setting wants *less*
       * variation, not more — at `earworm` the whole point is that it is the same
       * thing again. See `tune/tune.ts`.
       */
      const full = written
        ? written.notes
        : varyRecall({
          notes: replay(prior!.melody!, prior!.tonic, localTonic, ctxBase.startBeat, range),
          scale: makeScale(localTonic, mode),
          range,
          amount: Math.min(0.9, (0.2 + ordinal * 0.28) * (1.25 - hook.level * 0.18)),
          rng: new Rng(`${seed}:vary:${s}${salt('melody')}`),
        });
      /**
       * Trading a phrase: the lead states one and then stops, and somebody else has
       * the floor.
       *
       * The answering line otherwise lives in the holes of the tune — it finds the
       * largest silence in each bar and speaks into it, which is a fill however well
       * it is shaped. This is the other thing two melodic players do, and it is the
       * one an ear reads as a conversation. Only the drummer could do it before, and
       * only inside a solo.
       *
       * Never the first phrase and never the last: the tune has to be stated before
       * it can be handed over, and the section has to be landed by whoever owns it.
       * Freshly written sections only, because the phrase boundaries come from the
       * plan and a recalled tune arrives as notes.
       */
      const traded = written && active.has('counter') && leadLayer !== 'counter'
        && !counterPattern && !isSolo
        && section.lengthBars >= 8 && written.audition.plan.phrases.length >= 3
        /**
         * The chart's decision, at the chart's chosen chorus — not a coin at every
         * one of them.
         *
         * Handing a phrase over is a *surprise*, and the note beside `memory.melody`
         * below already says so: the gesture only means anything the once. A 45% roll
         * per section meant a song either never traded or traded three times, and
         * both of those are the same bug. `tradeAt` names the chorus, so an
         * arrangement that trades does it once, where it can be heard.
         */
        && has(chart, 'trade') && section.kind === 'chorus' && ordinal === chart.tradeAt
        ? tradedPhrase(written.audition.plan.phrases, section, style.beatsPerBar, ctxBase.startBeat,
          new Rng(`${seed}:trade:${s}:where`))
        : undefined;

      const melody = traded
        ? full.filter((n) => n.beat < traded.from - 1e-6 || n.beat >= traded.to - 1e-6)
        : full;

      // Only freshly written material joins the comparison set. A recalled chorus
      // resembling the chorus it recalls is the point of recalling it.
      if (written) stated.push(written.audition.signature);
      applyDynamics(melody, leadLayer, intensity, genre.layerPlan?.response);
      push(byLayer, leadLayer, filtered(melody, leadLayer));
      sectionMelody = melody;

      /**
       * The figure this section is made of, for the band to quote.
       *
       * From the freshly written plan where there is one, otherwise from what this
       * kind of section was remembered as being about.
       */
      const fresh = written?.audition.plan.motifs.find((m) => m.role === 'hook');
      if (fresh) {
        sectionHook = {
          contour: fresh.contour.slice(),
          onsets: fresh.gesture.onsets.map((o) => ({ at: o.at, dur: o.dur })),
        };
      } else if (prior?.hook) {
        sectionHook = { contour: prior.hook, onsets: prior.figure ?? [] };
      }
      const hookContour = sectionHook?.contour;

      // Solos are never remembered, so this only ever stores an actual tune.
      if (memory && !memory.melody && !isSolo) {
        // The *whole* tune, including any phrase handed away: a recalled chorus that
        // inherited the hole would trade in every chorus at once, and the gesture
        // only means anything the once.
        memory.melody = full.map((n) => ({ ...n, beat: n.beat - ctxBase.startBeat }));
        if (sectionHook) {
          memory.hook = sectionHook.contour.slice();
          memory.figure = sectionHook.onsets.slice();
        }
      }

      // …and not where the counter is the one stating it: a line does not answer
      // itself. See `leadLayer`.
      if (!isSolo && active.has('counter') && leadLayer !== 'counter') {
        const counterCtx: PartContext = {
          ...ctxBase,
          rng: new Rng(`${seed}:counter:${s}${salt('counter')}`),
        };
        /**
         * Two different parts share this layer, and which one is written is the
         * distinction `counterMode` exists to make.
         *
         * `answer` looks at the tune and plays where it is not. `ostinato` does
         * not look at the tune at all — it is a second machine running against
         * the first, and the Berlin-school texture is two sequencers at
         * different cycle lengths phasing against each other, which no
         * answering line can imitate because an answer by definition waits for
         * a gap and this music has none.
         *
         * It goes through `generateComp` rather than through anything of its
         * own, and that is the whole implementation: a figure with a `cycle`,
         * voiced against the harmony, walking a ladder one note at a time. The
         * only thing that made it a *counter* was which layer it lands in.
         */
        let answer = counterPattern
          ? generateComp(
            counterCtx, counterPattern, instruments.counter.centre,
            (c) => scaleForChord(localTonic, mode, c),
            limitFor('counter'),
          )
          : generateCounter(counterCtx, withTail(byLayer, 'melody', ctxBase.startBeat, melody), instruments.counter.centre, {
            range: plan.counter,
            idiom: IDIOMS[instruments.counter.idiom],
            scaleFor: (c) => scaleForChord(localTonic, mode, c),
            // The section's own figure, so the answer can quote the song rather than
            // echo the last four notes it heard. See `generateCounter`.
            ...(hookContour ? { quote: hookContour } : {}),
          });
        applyDynamics(answer, 'counter', intensity, genre.layerPlan?.response);
        /**
         * The last word on the one thing an answering line may never do.
         *
         * `generateCounter` already avoids the tune, note by note, as it writes — and
         * still cannot guarantee it, because three things happen outside its view: a
         * melody note held across the section seam, a variation applied to a recalled
         * tune, and its own escape search running out of chord tones. Checked here,
         * against the finished line, it is a guarantee rather than an effort.
         *
         * Not folded into `resolveCollisions`, which is where the comp, pad and brass
         * are kept off the tune: that pass only fixes octaves at high clarity,
         * because for a chordal layer doubling the tune is a matter of degree. For
         * the answer it is a rule at every setting.
         */
        /**
         * …and, once in a while, the answer stops answering and *joins in*.
         *
         * The arranger spends real effort keeping every part off the tune, and
         * `npm run genres` forbids the answering line from doubling it at the unison
         * or the octave outright. All of that is right about an accident and wrong
         * about a decision: two lines in thirds is one of the most characteristic
         * sounds in this repertoire, and the only thing separating it from mud is
         * that it is sustained and parallel rather than momentary and incidental.
         *
         * Thirds and sixths here; octaves are `joinIn` below, and the difference
         * between them is a difference of gesture rather than of nerve. A third is
         * two lines and an octave is one line with two players on it, so they belong
         * in different places in a form — this one adds a colour to a chorus already
         * heard, and that one states the head.
         *
         * One phrase, in a chorus that has been heard before, and never the last two
         * bars: the cadence is where the two parts most need to be two.
         */
        /**
         * `reach` is how much of the section the two of them are on together: one
         * phrase out of the middle of it, or the whole statement bar the cadence.
         * The first is the colour this was written for; the second is what a head
         * arranged for two players sounds like, and it is only asked for where the
         * phrase window came back empty — see the fallback below.
         */
        const withTheTune = (
          into: NoteEvent[], size: number, reach: 'phrase' | 'statement' = 'phrase',
        ): NoteEvent[] => {
          const half = reach === 'phrase' ? Math.floor(section.lengthBars / 2) : 0;
          const bars = reach === 'phrase'
            ? Math.min(4, section.lengthBars - half - 2)
            : Math.max(0, section.lengthBars - 2);
          const from = ctxBase.startBeat + half * style.beatsPerBar;
          const to = from + bars * style.beatsPerBar;
          const line = harmonise(
            melody, from, to, size,
            // The chord under *this* note rather than under the start of the span:
            // a window four bars wide is several chords, and a third measured off
            // the first of them is a third against the others.
            (midi, steps, beat) => stepInScale(
              scaleForChord(localTonic, mode, ctxBase.chords[Math.min(
                ctxBase.chords.length - 1,
                Math.max(0, Math.floor((beat - ctxBase.startBeat) / style.beatsPerBar)),
              )]!),
              midi, steps,
            ),
            plan.counter,
          );
          if (line.length < 3) return into;
          return [...into.filter((n) => n.beat < from - 1e-6 || n.beat >= to - 1e-6), ...line]
            .sort((a, b) => a.beat - b.beat);
        };

        if (has(chart, 'harmony') && section.kind === 'chorus' && ordinal >= 1
          && section.lengthBars >= 8) {
          answer = withTheTune(answer, chart.harmonyBelow);
        }

        /**
         * …and where the chart says these two players state the tune *together*.
         *
         * The other half of "playing together", and the half this project refused to
         * write: trumpet and tenor on the head in octaves, nobody harmonising
         * anybody. `harmonise` above was as close as it could get, and a third is a
         * genuinely different sound — it is two parts agreeing, where this is one
         * part with two players on it and twice the weight.
         *
         * The first half of the section rather than the second, and every statement
         * of the head rather than the repeats only. Both follow from what the gesture
         * is: the head is *stated* in unison and the second player then drops back to
         * answering, so it belongs at the front, and an arrangement whose horns state
         * the head together does that every time the head comes round. A version that
         * appeared in the third chorus and nowhere else would not be this device, it
         * would be an event.
         *
         * `joinIn` marks every note it writes, which is what keeps `undoubleAgainst`
         * and `npm run genres` from treating the arrangement as the fault they were
         * built to catch. See `NoteEvent.doubling`.
         */
        if (has(chart, 'unison') && !traded && !isSolo && section.lengthBars >= 8
          && (section.kind === 'chorus' || section.kind === 'verse')) {
          const half = Math.floor(section.lengthBars / 2);
          const from = ctxBase.startBeat;
          const to = from + half * style.beatsPerBar;
          const both = joinIn(melody, from, to, chart.unisonOctave, plan.counter);
          if (both.length >= 3) {
            answer = [...answer.filter((n) => n.beat < from - 1e-6 || n.beat >= to - 1e-6), ...both]
              .sort((a, b) => a.beat - b.beat);
          }
        }

        /**
         * …and where the tune leaves the answer nowhere to speak, it plays the tune.
         *
         * Only in a head the soloist has to be heard in — `soloistHeads` — and that
         * limit is the point. Everywhere else an answering line with nothing to say
         * says nothing, which is correct: it lives in the holes of the tune, and a
         * section with no holes in it is a section where a second line would be in
         * the way. But a player who is about to take a chorus cannot be introduced by
         * three minutes of standing still, and a tune dense enough to shut the answer
         * out of every head puts them straight back to being a guest.
         *
         * So the fallback is the other thing two melodic players do, and it is
         * already written: the same phrase in thirds or sixths, in the same half of
         * the section, off the cadence. A horn playing the head with the singer is
         * what the head sounds like on these records anyway.
         *
         * And if that window comes back empty too — `harmonise` wants three notes in
         * it and a ballad's half-phrase can hold two — the two of them take the whole
         * statement instead. A head arranged for two players is not a smaller version
         * of this gesture, it is the larger one, so widening is the right way to fail.
         * Over 240 numbers this catches 40 heads: 39 of them from the phrase window
         * and one that needed the whole statement, and none left silent.
         */
        if (!answer.length && soloistHeads.has(s)) {
          const size = new Rng(`${seed}:counter:${s}:join`).chance(0.65) ? 2 : 5;
          answer = withTheTune(answer, size);
          if (!answer.length) answer = withTheTune(answer, size, 'statement');
        }

        /**
         * …and where a phrase was traded, the answer takes it over outright.
         *
         * Placed after everything else the answering line does, and replacing it in
         * that span, because the two are different jobs: a fill goes around the tune
         * and this *is* the tune, in another voice, for two bars.
         */
        if (traded) {
          const taken = handOff(full, traded.from, traded.to, traded.from, plan.counter);
          if (taken.length >= 2) {
            answer = [...answer.filter((n) => n.beat < traded.from - 1e-6 || n.beat >= traded.to - 1e-6), ...taken]
              .sort((a, b) => a.beat - b.beat);
          }
        }

        sectionCounter = undoubleAgainst(
          answer,
          withTail(byLayer, 'melody', ctxBase.startBeat, melody),
          makeScale(localTonic, mode),
          plan.counter,
        );
      }
    }

    /**
     * The other hand, wherever the person holding the line has one.
     *
     * Written last of everything on this layer and against the finished line,
     * because that is the order the playing happens in: the left hand answers
     * what the right hand did, so it cannot be written until the right hand has
     * done it. It goes in for the head and for the player's own chorus alike —
     * a trio pianist comps for themselves in both, and the difference between a
     * stated melody and an improvised one is the right hand's business.
     *
     * **`leadLayer`, not `'melody'`.** This used to be pinned to the melody
     * layer, which was right about the piano trio it was written for and wrong
     * about every genre where the break belongs to somebody else. Iskelmä hands
     * the chorus to the *counter* instrument, and that instrument is an
     * accordion about a third of the time: the one section in the song where
     * that player is on their own, and the one section where they were playing
     * with one hand. What replaces the layer test is the thing the layer test
     * was standing in for — *does the instrument on this layer have two hands* —
     * which `handsFor` answers directly and which no longer accidentally
     * excludes the accordionist taking a solo.
     *
     * The bass keeps its exemption, and it is the same exemption as before: a
     * bassist's chorus fills `sectionMelody` too, and nothing about a bass is
     * two-handed in this sense.
     */
    const leadHands = leadLayer === 'bass' ? undefined : instruments.handsFor[leadLayer as PlayedLayer];
    if (style.twoHanded && leadHands && sectionMelody.length) {
      /**
       * Drawn per section, on its own stream.
       *
       * Per section rather than per song because a trio changing what the left
       * hand does at the top of a chorus is the clearest signal there is that an
       * arrangement was arranged — the same tune comes back and the texture
       * under it has moved. Per song it would be a setting; per phrase it would
       * be a player who cannot decide.
       */
      const left = generateLeftHand(ctxFor('comp'), sectionMelody, {
        mode: chooseLeftHandMode(
          new Rng(`${seed}:hand:${s}`), style.twoHanded, leadHands, isSolo,
        ),
        spec: leadHands,
        density: style.twoHanded.density,
        scaleFor: (c) => scaleForChord(localTonic, mode, c),
        clarity,
        ...(style.twoHanded.ostinato ? { ostinato: style.twoHanded.ostinato } : {}),
      });
      applyDynamics(left, 'comp', intensity, genre.layerPlan?.response);
      const held = leftHand.get(leadLayer as PlayedLayer) ?? [];
      held.push(...left);
      leftHand.set(leadLayer as PlayedLayer, held);
    }

    /**
     * Name the soloist on the section, and only where one is actually playing.
     *
     * The guard is the point. A solo section whose nominal soloist wrote no
     * notes — a style that excluded their layer, a block that got trimmed to
     * nothing — has no soloist, and claiming one would put a follow spot on
     * silence. That is a worse failure than no spotlight at all, which is the
     * whole reason this engine exists.
     */
    if (solo && (soloLayer ? sectionMelody.length > 0 : active.has('drums'))) {
      section.solo = {
        layer: solo.layer,
        /**
         * A drum kit is not a `Track`, so there is no `Track.instrument` for
         * this to match. `'drum kit'` is the honest human name and the one a
         * showbill would print; a bank name like "LinnDrum" is a sample set
         * rather than an instrument. See the note in `core/types.ts`.
         */
        instrument: soloLayer ? layerInstruments[soloLayer as PlayedLayer].name : 'drum kit',
        backing: solo.backing,
        // The plan already worked out who has which bars; surfacing it stops
        // every consumer from re-deriving "trading means fours" and being
        // wrong about a drum chorus, which trades nothing.
        ...(solo.backing === 'trade'
          ? {
            blocks: {
              soloBars: solo.soloBars.map((b) => [b[0], b[1]] as [number, number]),
              drumBars: solo.drumBars.map((b) => [b[0], b[1]] as [number, number]),
            },
          }
          : {}),
      };
    }

    /**
     * The horns, against the finished tune.
     *
     * Written here rather than after `resolveCollisions`, which is where it was and
     * which made the `brass` entry in that pass's layer map dead: the array handed
     * over was still the empty one this section started with, so the one layer whose
     * whole job is to sound *around* the tune was the one layer never checked against
     * it. Harmless while the horns fired two stabs a song into whatever hole they
     * found; not harmless now that `riff` can put a fixed figure in every second bar,
     * which is a figure that no longer moves out of the way by construction.
     *
     * It also has to precede the tutti below, because a band figure that the horns sit
     * out is a rhythm section figure.
     */
    if (active.has('brass')) {
      sectionBrass = generateBrass(ctxFor('brass'), instruments.brass.centre, limitFor('brass'), {
        melody: sectionMelody,
        intensity,
        // Both from the chart, so the horns play the same figure in the same way all
        // the way through a song rather than reinventing themselves every eight bars.
        ...(has(chart, 'riff') ? { figure: chart.riff, every: chart.riffEvery } : {}),
        ...(has(chart, 'swell') ? { swell: true } : {}),
      });
    }

    /**
     * The band, edited to agree with the tune that has just been written.
     *
     * Every other pass writes the melody around an accompaniment decided first; this
     * one runs the other way. Only where the section is making a point — a chorus, an
     * outro — and capped at a couple of moments, because a band that follows the tune
     * everywhere is a doubling rather than an arrangement. See `tune/band.ts`.
     */
    if (sectionMelody.length && (section.kind === 'chorus' || section.kind === 'outro')) {
      const bandRng = new Rng(`${seed}:band:${s}:figure`);
      const patch = patchBand({
        melody: sectionMelody,
        bass: sectionBass,
        comp: sectionComp,
        beatsPerBar: style.beatsPerBar,
        startBeat: ctxBase.startBeat,
        bars: section.lengthBars,
        // The last chorus is the one that gets arranged. Earlier ones state the tune.
        amount: Math.min(0.9, 0.25 + ordinal * 0.3) * intensity,
      });
      sectionBass = patch.bass;
      sectionComp = patch.comp;

      /**
       * The whole band on one figure, for a bar.
       *
       * Nothing in this project could say *everybody hit this together* — the shout
       * chorus, the tutti break, the bar where the rhythm section stops keeping time
       * and plays the tune's rhythm instead. It is one of the loudest signals there
       * is that a piece was arranged rather than assembled, and it needs three layers
       * to move at once, which is why it lives here rather than in any of the part
       * generators.
       *
       * The figure is the section's own hook, not an invention: a tutti playing
       * something nobody has heard is a fanfare, and a tutti playing *the hook* is an
       * arrangement. Reserved for a chorus that has already been stated once, because
       * the gesture is a comment on something the listener knows.
       *
       * **The drummer does not join, and that is a deliberate cost.** The figure comes
       * from the tune, so a kit that caught it would change with the tune — and
       * `--hook` is documented as an A/B control that leaves form, key, tempo,
       * instruments and drums alone at every level. Drums catching kicks is exactly
       * what would make this gesture land hardest, and it is not worth turning the
       * repetition axis back into a reroll to get it. The rhythm section hitting a
       * figure while the kit keeps time is its own real sound.
       *
       * **A seam `shot` does have the kit on it, and this caller stays as it is.**
       * The cost above is paid by *this* gesture and not by the mechanism: a shot
       * takes its figure from the style or the metre, which cannot move with the
       * tune, so the drummer is free there — see `generate/transition.ts`. The
       * function is shared and the two callers are not, because the band catching
       * the tune and the band playing its own figure are two different things a
       * group does, with two different drum answers. Collapsing them loses one.
       */
      const onsets = sectionHook?.onsets ?? [];
      const figure = has(chart, 'tutti') && ordinal >= 1 && onsets.length
        ? figureSlots(onsets, Math.round(style.beatsPerBar * SLOTS_PER_BEAT))
        : [];
      if (figure.length >= 2) {
        const hitBar = section.startBar + (bandRng.chance(0.6) ? 0 : Math.max(0, section.lengthBars - 2));
        const from = hitBar * style.beatsPerBar;
        const to = from + style.beatsPerBar;
        const beats = figure.map((slot) => from + slot / SLOTS_PER_BEAT);

        sectionBass = hitTogether(sectionBass, from, to, beats);
        sectionComp = hitTogether(sectionComp, from, to, beats);
        /**
         * …and the horns, where there are any.
         *
         * The layer this gesture was named after. A shout chorus is a *horn* figure
         * that the rhythm section joins, and it had been implemented as a rhythm
         * section figure the horns sat out — which is the one arrangement of those
         * three parts nobody has ever written.
         */
        sectionBrass = hitTogether(sectionBrass, from, to, beats);
      }
    }

    // The ceiling was a forecast; this is the correction. Now that the tune
    // exists, move whatever is still doubling it — see `generate/arrange.ts`.
    resolveCollisions({
      melody: sectionMelody,
      layers: new Map<LayerId, NoteEvent[]>([
        ['comp', sectionComp], ['pad', sectionPad], ['brass', sectionBrass],
      ]),
      clarity,
      floor: instruments.bass.centre + 10,
    });


    /**
     * The other half of the feel drawn at the top of the loop: what the *played*
     * layers do with it, as against what the *composed* ones were written to do.
     *
     * It runs immediately before the dynamics and that order is load-bearing.
     * `applyFeel` multiplies velocities, and intensity has to be the outermost
     * term — a chorus that was louder than its verse before feels existed stays
     * louder afterwards, whatever the feel says. A feel changes the shape of a
     * section's loudness and never its rank.
     *
     * The melody and the counter are absent from the call and cannot be added:
     * they were auditioned, and bending the gesture that won hands back one
     * nobody scored. They took their half of this feel at the top of the loop,
     * as multipliers into the `Voice` the audition ran against. See
     * `style/feel.ts`.
     */
    if (felt) {
      const { feel, amount } = felt;
      feels.push({
        from: section.startBar,
        to: section.startBar + section.lengthBars,
        feel,
        amount,
      });
      applyFeel({
        feel,
        amount,
        bpm,
        /**
         * The span's swing, resolved here rather than inside `applyFeel`, so
         * that this and `swingPlan` below are reading the same expression and a
         * note cannot be swung by one of them and then again by the other. See
         * `Feel.swing`.
         */
        swing: swingOver(feel, amount),
        beatsPerBar: style.beatsPerBar,
        /**
         * Its own stream, and one that is only drawn from by the fields a feel
         * actually declares — `pocket` states a push and nothing else, so a
         * pocket section takes exactly as many numbers out of this as `straight`
         * does, which is none.
         */
        rng: new Rng(`${seed}:feel:${s}:play`),
        kitRng: new Rng(`${seed}:feel:${s}:kit`),
        endsAt: (totalBars - 1) * style.beatsPerBar,
        layers: {
          bass: sectionBass, comp: sectionComp, pad: sectionPad, brass: sectionBrass,
        },
        /**
         * …and a rhythm box neither leans nor lays back, for the third time in
         * this file and for the same reason. `canVary` is false for exactly one
         * source and it takes away exactly what that source cannot do: a Mini
         * Pops has one pattern per button and a volume knob, and a preset that
         * dragged its backbeat would be somebody playing it.
         */
        ...(canVary(drumSource) ? { drums: { events: drumEvents, from: drumsFrom } } : {}),
      });
    }

    /**
     * Scale the whole section at once. Doing it here rather than inside each
     * part generator is what keeps the parts ignorant of the form: a comp
     * pattern should not have to know whether it is in a bridge.
     */
    const sectionBeats = section.lengthBars * style.beatsPerBar;
    applyDynamics(sectionBass, 'bass', intensity, genre.layerPlan?.response);
    applyDynamics(sectionComp, 'comp', intensity, genre.layerPlan?.response);
    applyDynamics(sectionPad, 'pad', intensity, genre.layerPlan?.response);
    applyDynamics(sectionBrass, 'brass', intensity, genre.layerPlan?.response);
    // Sustained parts get a swell on top, because a held chord at one fixed
    // level is the sound of a patch rather than of a player.
    swell(sectionPad, ctxBase.startBeat, sectionBeats, 0.35);
    swell(sectionComp, ctxBase.startBeat, sectionBeats, 0.12);
    // And the parts that punctuate get the other half of the same idea: a chord
    // standing on its own is played harder than one keeping time. Only these two
    // layers — a pad with space around it is a long note rather than a stab, and
    // the streams get their shape from the metre. See `punctuate`.
    punctuate(sectionComp);
    punctuate(sectionBrass);

    push(byLayer, 'counter', filtered(sectionCounter, 'counter'));
    push(byLayer, 'bass', filtered(sectionBass, 'bass'));
    push(byLayer, 'comp', filtered(sectionComp, 'comp'));
    push(byLayer, 'pad', filtered(sectionPad, 'pad'));
    push(byLayer, 'brass', filtered(sectionBrass, 'brass'));
  }

  // ---- Assemble --------------------------------------------------------
  /**
   * Swing, made span-aware — which is the whole of `Feel.swing`.
   *
   * Every other field of a feel is applied by `applyFeel`, to the rhythm section
   * only, because the melody and the counter were auditioned and bending them
   * afterwards hands back a gesture nobody scored. Swing is the exception and
   * the type says why: it is a property of the *grid* rather than a gesture, it
   * reaches every layer including the melody, and a tune that is swung is still
   * the tune that won. So it stays where it always was — here, at assembly — and
   * what changes is that it can now answer per bar instead of per song.
   *
   * A number unless some span actually carries an override, because that is not
   * an optimisation: `applySwing` returns the array untouched for a straight
   * style, and a song that never asked the question must be bit-for-bit what it
   * was. `swingOver` is the same expression `applyFeel` was handed for its own
   * pre-swing, so the two cannot drift apart.
   */
  const swung = feels.filter((f) => f.feel.swing !== undefined);
  const swingPlan: SwingPlan = swung.length
    ? (beat: number) => {
      const bar = Math.floor(beat / style.beatsPerBar + 1e-9);
      const span = swung.find((f) => bar >= f.from && bar < f.to);
      return span ? swingOver(span.feel, span.amount) : style.swing;
    }
    : style.swing;
  /**
   * The default balance is a dance-band balance: the tune on top, the pad a
   * long way behind it. A genre may say otherwise, and ambient does — there the
   * pad is the piece and the melody is the decoration, which is the same three
   * layers in the opposite order.
   *
   * ## Why these are not the numbers they used to be
   *
   * They are the same balance. `render/source-levels.ts` made a fader mean one
   * loudness whatever font is on it, and that necessarily moved every layer by
   * however far its own instrument pool sat from the catalogue median — the
   * bass fonts here are quiet ones, so calibrating them lifted the bass 3.2 dB
   * without anybody asking. Dividing each fader by its pool's mean trim puts
   * the average song back exactly where it was and keeps the consistency, which
   * is the whole point: the old numbers were right on average and wrong per
   * song, and only the second half was worth fixing.
   *
   * Measured over the pools iskelmä and jazz actually draw from — the two
   * genres that use these defaults; ambient and synth re-centre their own in
   * their own `genre/…/index.ts`. `brass` barely moved (0.994) and is left
   * alone.
   */
  /**
   * How hard a part on each layer is played, as the velocity its *typical* note
   * is normalised to. See the use site — this is level, not shape.
   *
   * The median note rather than the loudest one, because the median is what a
   * listener hears as the level of a part: matching peaks left a line with a
   * wide shape sitting 3 dB under a flat one that peaked identically. Each
   * number is the median that layer already wrote, measured over 240 songs
   * across all four genres, so this collapses the spread without moving the
   * average.
   */
  const LAYER_VELOCITY: Record<PlayedLayer, number> = {
    melody: 0.80,
    counter: 0.62,
    comp: 0.38,
    pad: 0.39,
    bass: 0.78,
    brass: 0.56,
  };

  const gains: Record<PlayedLayer, number> = {
    // was 0.9 — bass fonts run 1.44× quiet
    bass: 0.63,
    /**
     * was 0.62, then 0.51 once the fonts were measured — and then +3 dB, which
     * is the one number here that is an opinion rather than a measurement.
     *
     * Measured against the tune, a comping instrument was landing 11.5 dB back
     * in iskelmä and 11.2 in jazz, at the note and not only in the average. A
     * comping piano is not a pad: it is the harmony, it is played by somebody
     * the audience can see playing it, and at 11 dB under a saxophone with a
     * kit over the top it was inaudible as anything but texture. Eight decibels
     * back is still unmistakably accompaniment and is where these records
     * actually sit.
     */
    comp: 0.72,
    /**
     * was 0.45, then 0.44, then 0.52 — the fonts sit on the median, so that was
     * +1.5 dB of the same opinion the comp got and no more: a pad *is* a bed,
     * and the only claim was that a bed 13 dB down is furniture rather than a
     * bed.
     *
     * It did not go far enough. At 0.52 the pad came out 8.3 dB under the tune
     * in iskelmä and 8.7 in jazz — under the comp, under the answering line, and
     * in jazz under the *ride cymbal*, which is how a string section ends up
     * inaudible behind a drum machine. The strings are the only sustained thing
     * in these arrangements and everything over them is transient, so they lose
     * every masking argument they are in; a bed has to be a couple of decibels
     * louder than the arithmetic suggests before it reads as one. +2 dB, which
     * lands it around 6.5 dB down — still unmistakably behind the comp, and now
     * present when the tune leaves a gap.
     */
    pad: 0.66,
    // was 0.85 — melody fonts run 1.12× *hot*, so this one goes up
    melody: 0.95,
    counter: 0.56,
    brass: 0.60,
    ...genre.mix,
  };

  /**
   * Effects are resolved instrument-over-era-over-genre, per layer.
   *
   * The genre states what is true of the music whatever decade it claims to be
   * from — ambient's bass is dry and its pad is drenched in 1974 and in 2004
   * alike — and the era says how wet and how dark that decade's records
   * actually were.
   *
   * The instrument goes **last**, and it is last rather than first for a reason
   * the other two do not share: it is not describing the production at all. An
   * electric violin is a violin with a pickup and an amplifier, and a 1990s
   * mixing desk cannot un-electrify one any more than it can un-tune it. So a
   * catalogue entry that declares `drive` keeps it through every era, while the
   * era retains everything the instrument does not mention — which is nearly
   * all of it, since eras speak in `reverb` and `lowpass` and this speaks in
   * `drive` and `phaser`. See `Instrument.effects`.
   */
  const effectsFor = (layer: LayerId, instrument?: Instrument): Effects | undefined => {
    const merged = {
      ...genre.effects?.[layer], ...era.effects?.[layer], ...instrument?.effects,
    };
    return Object.keys(merged).length ? merged : undefined;
  };
  const space: Space = { ...DEFAULT_SPACE, ...genre.space, ...era.space };

  /**
   * Melodic layers are monophonic and are written a section at a time, so the
   * seams need clearing once they are concatenated. A phrase that begins with a
   * pickup writes *backwards* across a section boundary on purpose — see
   * `allowAnacrusis` in `generate/melody.ts` — and the note it lands on top of
   * belongs to the section before it, which the melody generator never saw.
   */
  for (const layer of ['melody', 'counter'] as LayerId[]) {
    const notes = byLayer.get(layer);
    if (!notes?.length) continue;
    // Swing *before* trimming, not after. Swing delays a note and holds its end
    // fixed, which on a note already shorter than the delay leaves a stub of a
    // few milliseconds — audible as a click and meaningless as a pitch. Trimming
    // afterwards is what removes them, and it can only do that if it runs last.
    byLayer.set(layer, trimOverlaps(
      applySwing(notes.filter((n) => n.beat >= 0), swingPlan),
    ));
  }

  /**
   * The answer against the finished tune, once there is a finished tune.
   *
   * Every earlier check of this ran a section at a time, and a section cannot see
   * what the section after it will write across the seam: a pickup, a variation
   * applied to a recalled chorus, a cadence held past the barline. `undoubleAgainst`
   * inside the loop catches almost all of it and cannot catch that, so this runs
   * where both layers are whole and trimmed. It is not the last word either — the
   * third call, below `applyTransitions`, is — but it is the cheap one: here the
   * answer is still a bare line, and every repair made here is one that does not
   * have to be made down there against a finished arrangement.
   */
  {
    const line = byLayer.get('melody') ?? [];
    const answer = byLayer.get('counter') ?? [];
    if (line.length && answer.length) {
      // The window is the part's own, widened by an octave, rather than a guess at
      // the instrument's. A guessed window that does not contain the note being
      // repaired rejects every candidate and silently returns the fault.
      const lo = Math.min(...answer.map((n) => n.midi)) - 12;
      const hi = Math.max(...answer.map((n) => n.midi)) + 12;
      byLayer.set('counter', undoubleAgainst(answer, line, makeScale(tonic, mode), [lo, hi]));
    }
  }

  /**
   * And now the left hands, into the layers they belong to.
   *
   * After the trim rather than before it, for the reason `leftHand` is declared
   * separately at all: this is the point at which a track stops being one voice,
   * and everything above assumes it is one. Swung on its own — the stabs land on
   * eighths and a left hand swings with the band — and merged by beat so the
   * track stays sorted, which `render/strudel.ts` and the choreographer both
   * read it as being.
   */
  for (const [layer, notes] of leftHand) {
    if (!notes.length) continue;
    const line = byLayer.get(layer) ?? [];
    byLayer.set(layer, [...line, ...applySwing(notes.filter((n) => n.beat >= 0), swingPlan)]
      .sort((a, b) => a.beat - b.beat || a.midi - b.midi));
  }

  /**
   * How long the repeating figure is, in beats, for a layer left to a machine.
   *
   * Read off the pattern the part was actually written from rather than
   * assumed, because that is the whole point of `Cycle`: a figure five
   * sixteenths long against a four-four bar is the device this genre is built
   * on, and a step row that showed four beats regardless would be displaying a
   * bar the machine is not playing. Absent `cycle` means the figure *is* the
   * bar, which is what most patterns are.
   */
  const cycleOf = (layer: PlayedLayer): number => {
    const slots = layer === 'counter'
      ? counterPattern?.cycle
      : layer === 'bass' ? bassPattern.cycle : undefined;
    return slots ? slots / SLOTS_PER_BEAT : style.beatsPerBar;
  };

  const tracks: Track[] = [];
  for (const [layer, instrument] of Object.entries(layerInstruments) as [PlayedLayer, Instrument][]) {
    const notes = byLayer.get(layer) ?? [];
    if (!notes.length) continue;

    /**
     * Put the part inside the instrument playing it.
     *
     * The register planner works in `centre`s — where a layer should *sit* —
     * and nothing until now knew where an instrument *stops*. So a clarinet
     * handed the pad layer got written down to C2 on 31% of its notes, and a
     * comping vibraphone went below its bottom F on 7%. Neither is audible as
     * an error, because a soundfont plays whatever it is sent; both are
     * audible as the instrument not sounding like itself, which is the entire
     * reason for having chosen it.
     *
     * Folding by octave rather than clamping keeps the harmony intact — an
     * octave transposition of a chord tone is still that chord tone, where
     * clamping would pile a voicing into a cluster on the lowest note.
     *
     * Done here, once, after every part is written and after collision repair
     * has had its say, so nothing downstream can push a note back out.
     */
    const range = rangeOfInstrument(instrument);
    for (const n of notes) n.midi = foldIntoRange(n.midi, range);

    notes.sort((a, b) => a.beat - b.beat || a.midi - b.midi);

    /**
     * Play every part on this layer as hard as every other part on this layer.
     *
     * Velocity was carrying two different things and only one of them belongs
     * to it. The shape — accents inside a bar, a section leaning in, a swell
     * across a held chord — is the part's own and is worth keeping to the note.
     * The *level* is not: it was whatever constant the figure that generated
     * these notes happened to be written with, and figures differ. A comping
     * pattern hands out 0.55, a two-note ostinato 0.42, a strummed guitar
     * figure closer to 0.8 — so on the same layer, at the same fader, a celesta
     * counter-line came out 8 dB under a jazz-guitar counter-line, for no
     * reason anybody chose. Measured across 240 songs the counter and comp
     * layers each spanned about 6 dB of written velocity, and the parts
     * measured up to 16 dB apart.
     *
     * Dividing the part by its own median and multiplying by the layer's puts
     * every part on the layer at the level the fader promises, and leaves every
     * relationship *inside* the part untouched, since one constant cannot bend
     * a shape. The scale is held back where it would push the part's loudest
     * note past full velocity, so a line with a big shape keeps its accents
     * instead of flattening them against the ceiling.
     *
     * Before the solo ride, which is a deliberate statement about level and has
     * to survive this; and not for machines, which have their own rule below
     * for a different reason.
     */
    if (!sequenced.has(layer as SequencedLayer) && notes.length) {
      const sorted = notes.map((n) => n.velocity).sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)]!;
      const peak = sorted.at(-1)!;
      if (median > 0) {
        const k = Math.min(LAYER_VELOCITY[layer] / median, 1 / peak);
        for (const n of notes) n.velocity = clamp(n.velocity * k, 0.08, 1);
      }
    }

    /**
     * Ride the fader up for the solo.
     *
     * A `Track` carries one gain for the whole song, and a layer that takes a
     * chorus needs two levels: its own when it is accompanying, and the lead's
     * when it is the piece. The only way to say that with one number is to set
     * the fader where the solo wants it and write everything else quieter,
     * which is what an engineer does with an automation lane and exactly what
     * the product `gain × velocity` lets us do here — the accompaniment comes
     * out where it always did, note for note, and the solo comes up.
     *
     * Never *down*: a bass already mixed above the tune is at lead level and a
     * bassist taking a chorus does not want it cut. Only the layers that sit
     * behind the melody move, which is the four that can be handed a solo.
     */
    /**
     * …and a sequencer never rides the fader up, because it never solos.
     *
     * `sequenced` layers are excluded from solo assignment upstream, so this
     * should be empty for them; reading it here as well is the belt to that
     * braces, and costs one condition. A machine taking a chorus is a loop with
     * the band politely waiting for it to finish.
     */
    const isMachine = sequenced.has(layer as SequencedLayer);
    const spans = isMachine ? undefined : soloSpans.get(layer);
    let gain = gains[layer];
    if (spans?.length && gains.melody > gain) {
      const back = gain / gains.melody;
      for (const n of notes) {
        const soloing = spans.some(([a, b]) => n.beat >= a - 1e-6 && n.beat < b - 1e-6);
        if (!soloing) n.velocity = clamp(n.velocity * back, 0.08, 1);
      }
      gain = gains.melody;
    }

    /**
     * A sequencer has one level per step and does not lean into a chorus.
     *
     * The velocities a part is written with carry two things at once: the
     * figure's own accents, and the section's intensity riding over them. A
     * machine has the first and cannot have the second — there is nobody to
     * lean — so the section's contribution is divided back out and the figure's
     * own shape is left alone. Flattening to a constant instead would have
     * thrown away the accents the pattern was written with, which is the part a
     * sequencer genuinely does have.
     */
    if (isMachine) {
      const loudest = Math.max(...notes.map((n) => n.velocity), 0.0001);
      for (const n of notes) n.velocity = clamp(n.velocity / loudest * 0.82, 0.08, 1);
    }

    const effects = effectsFor(layer, instrument);
    /**
     * The object's own trim, folded in last.
     *
     * `gains[layer]` says how far forward this *role* sits and knows nothing
     * about who is playing it; `Instrument.gain` says how this particular thing
     * sits whenever it plays. Multiplying rather than replacing keeps both
     * statements true — a genre that pushes its melody forward still pushes an
     * accordion forward, it just starts from where accordions start.
     *
     * Here rather than in the renderer because it is a musical judgement, so it
     * has to reach the MIDI too. See `Instrument.gain`.
     */
    const voiced = gain * (instrument.gain ?? 1);
    tracks.push({
      layer,
      instrument: instrument.name,
      gmProgram: instrument.gm,
      strudelSound: instrument.strudel,
      // Melodic layers were swung above, before their overlap trim.
      notes: layer === 'melody' || layer === 'counter' ? notes : applySwing(notes, swingPlan),
      gain: voiced,
      envelope: envelopeFor(instrument),
      ...(effects ? { effects } : {}),
      // Said out loud, because from here on nothing can tell by looking: a
      // pianist's two hands and a four-part comp are both just simultaneous
      // notes. See `melodicLine`, which is what the declaration is for.
      ...(leftHand.get(layer)?.length && instruments.handsFor[layer]
        ? { twoHanded: { gap: instruments.handsFor[layer]!.gap } }
        : {}),
      /**
       * …and the same kind of declaration for a part nobody is touching.
       *
       * A sequenced bass and a played bass are the same list of notes, and the
       * difference is not recoverable from them. See `Track.machine`.
       */
      ...(isMachine ? { machine: { cycle: cycleOf(layer) } } : {}),
    });
  }

  // The voice doubles the melody *after* swing has been applied, so it phrases
  // with the instrument it is singing alongside rather than against it. It also
  // inherits the melody's absence: in a solo section the lead moves to the
  // counter instrument, which is exactly where a singer stops singing.
  if (opts.vocals) {
    const melodyTrack = tracks.find((t) => t.layer === 'melody');
    if (melodyTrack) {
      // The sections come with it because the words do: a chorus sings the
      // same line every time it comes round, and that is the only thing making
      // a refrain a refrain. See `generate/vocals.ts`.
      const vocal = generateVocalTrack(
        // `melodicLine`, not `notes`: where the lead is a two-handed player the
        // track carries their accompaniment too, and a singer does not sing the
        // left hand.
        melodicLine(melodyTrack), genre.vocals, new Rng(`${seed}:vocal`),
        { sections, beatsPerBar: style.beatsPerBar },
      );
      if (vocal) tracks.push(vocal);
    }
  }

  drumEvents.sort((a, b) => a.beat - b.beat);
  const drumEffects = effectsFor('drums');
  const drums: DrumTrack = {
    bank: drumBank,
    source: drumSource,
    events: applySwingDrums(oneHatAtATime(drumEvents), swingPlan),
    /**
     * The kit is a layer like any other, so a genre that wants it barely
     * present says so in `mix` rather than by writing quieter patterns.
     *
     * Two moves from the 0.8 this sat at before the sources were measured, and
     * only the second is a matter of opinion. Re-centring for the banks these
     * genres roll (mean trim 1.07) gives 0.75, and then −2 dB on top of that,
     * because with every machine calibrated the kit was still playing its kick
     * 2.4 dB over the melody layer — and that figure flatters the drums, since
     * a 400 ms momentary window is generous to a sustained note and stingy with
     * an 80 ms transient. It leaves the tune a shade above the kick, which is
     * where a dance band wants it.
     *
     * A genre that states its own drum level keeps it, re-centred and with no
     * opinion of mine on top: ambient and synth both said what they wanted and
     * were entitled to.
     */
    gain: genre.mix?.drums ?? 0.59,
    voiceGains: { ...DEFAULT_DRUM_MIX, ...genre.drumMix },
    ...(drumEffects ? { effects: drumEffects } : {}),
  };

  const song: Song = {
    meta: {
      seed,
      title: genre.title(rng, { style, mood, bpm }),
      style: style.id,
      styleLabel: style.label,
      era: era.id,
      eraLabel: era.label,
      genre: genre.id,
      genreLabel: genre.label,
      mood: mood.id,
      strictness: strictness.id,
      strictnessLabel: strictness.label,
      hook: hook.id,
      hookLabel: hook.label,
      tonic,
      mode,
      keyLabel: keyLabel(tonic, mode),
      bpm,
      beatsPerBar: style.beatsPerBar,
      beatUnit: style.beatUnit,
      ...(style.groups ? { groups: style.groups } : {}),
      totalBars,
      swing: style.swing,
      // Omitted rather than empty where the style names no table, so a song that
      // was never asked the question does not carry an answer to it.
      ...(feels.length ? { feels } : {}),
      // The same rule for the seams, and the same sentence: `seams` is populated
      // on every song — every join resolves to something — but a song whose
      // style declared no palette resolved it without drawing, and publishing an
      // answer it was never asked would put a field on the whole catalogue in
      // the one wave whose deliverable is that nothing changed.
      ...(transitionTable ? { transitions: seams } : {}),
    },
    sections,
    tracks,
    drums,
    space,
  };

  /**
   * The band's answer to the seams, as an edit over the finished arrangement.
   *
   * Here rather than inside the section loop because a transition is not a
   * composition: by this line every layer is one array in one coordinate space,
   * on its sounding grid, and both sides of every join are in it — so moving,
   * deleting or replacing what is already there needs no knowledge a part
   * generator would have had to be given. `generate/transition.ts` argues that
   * at length, including why it dissolves the two sealed-seam rules rather than
   * relaxing them.
   *
   * After the tracks are built, because that is where the last `applySwing` runs
   * — there are four of them and this is downstream of all four. Before
   * `landEnding`, because the ending is not negotiable by an arrangement.
   *
   * A no-op today: `fill` is the only kind a palette can draw and the drummer
   * has already played it.
   */
  applyTransitions(song, seams, (beat) => (
    typeof swingPlan === 'number' ? swingPlan : swingPlan(beat)
  ));

  /**
   * The answer against the tune, once nothing else will move either of them.
   *
   * The pass above was made where both layers were whole, which was true and was
   * not enough, because a transition re-times what is already written. `playShot`
   * takes a bar of every part and lands it on one figure — keeping each part's own
   * pitches, because a tutti is a rhythmic event and not a harmonic one — and two
   * pitches that were never simultaneous become simultaneous. That is a harmonic
   * result out of a pass that declines to have harmonic opinions: on metal
   * `thrash`, seed `cm-26`, it put the answer's D5 onto the tune's D5 on the third
   * hit of bar 66, which was one note in the 5154 `npm run genres` samples and the
   * only accidental doubling left in the catalogue.
   *
   * So the guarantee is re-made here, and here is the last place it can be made:
   * after every `applySwing`, after the overlap trim, after each part is folded
   * into its instrument's range, after the arrangement's own edits. Before
   * `landEnding`, for the same reason the transitions run before it — a band
   * landing together on the final chord is a band landing, and moving a note off
   * that landing would be this pass overruling a full stop.
   *
   * The line, not the track: both layers may have a left hand merged into them by
   * now, and a left-hand chord tone an octave off the tune is neither the tune nor
   * the answer. `melodicLine` is the same reading `genre-check.ts` measures, and
   * what comes back is spliced in by identity so nothing else on the track moves.
   */
  {
    const melodyTrack = song.tracks.find((t) => t.layer === 'melody');
    const counterTrack = song.tracks.find((t) => t.layer === 'counter');
    const line = melodyTrack ? melodicLine(melodyTrack) : [];
    const answer = counterTrack ? melodicLine(counterTrack) : [];
    if (counterTrack && line.length && answer.length) {
      // The instrument's own range, which by this line every note is already
      // inside — the fold saw to that — so the window cannot fail to contain the
      // note being repaired, and no repair can push one back out of it.
      const repaired = undoubleAgainst(
        answer, line, makeScale(tonic, mode), rangeOfInstrument(layerInstruments.counter),
      );
      const moved = new Map<NoteEvent, NoteEvent>();
      answer.forEach((n, i) => { const to = repaired[i]!; if (to !== n) moved.set(n, to); });
      if (moved.size) counterTrack.notes = counterTrack.notes.map((n) => moved.get(n) ?? n);
    }
  }

  landEnding(song, genre.ending, finalChord);

  /**
   * `activeLayers` was a plan; now that the parts exist it is a claim, and a
   * claim has to be true.
   *
   * Two things make the plan optimistic, and only one of them was a bug. The
   * bug — a bridge asking for a counter and getting nothing — is fixed where
   * `leadLayer` is decided. What is left is the answering line doing exactly
   * what it is meant to: it speaks in the holes of the tune, one bar at a time,
   * and a section whose tune leaves no hole is a section where it has nothing to
   * say. Measured over 160 numbers, the sections it stayed out of averaged 1.3
   * bars with room in them against 4.7 for the sections it played.
   *
   * Silence there is the right answer musically and a lie in the IR, and
   * everything downstream reads the IR: the groove tells a player who is not
   * listed to move *more*, on the reasoning that they are not playing, and a
   * player listed but silent therefore mimes. Filtering here costs nothing —
   * not a note changes — and leaves the list saying what the number does.
   *
   * Onsets rather than sounding time, matching `soundsIn` in the concert
   * camera: a chord still ringing from the section before is not this section
   * playing.
   */
  for (const section of song.sections) {
    const from = section.startBar * style.beatsPerBar;
    const to = from + section.lengthBars * style.beatsPerBar;
    section.activeLayers = section.activeLayers.filter((layer) => (layer === 'drums'
      ? song.drums.events.some((e) => e.beat >= from - 1e-6 && e.beat < to - 1e-6)
      : song.tracks.some((t) => t.layer === layer
        && t.notes.some((n) => n.beat >= from - 1e-6 && n.beat < to - 1e-6))));
  }
  return song;
}

// ---------------------------------------------------------------------------
// The ending
// ---------------------------------------------------------------------------

/**
 * How far into the final bar an onset still counts as *the* landing, in beats.
 *
 * A band lands together, but not to the sample: a comp figure that stabs on the
 * "and" of one is playing the same arrival as the bass note on the downbeat,
 * and pulling it back onto the beat is what makes them one chord instead of two
 * events. Half a beat is the widest that stays true — anything later in the bar
 * is a *different* event, and the ending has already happened.
 */
const LAND_WINDOW = 0.5;

/**
 * How far back a layer may have stopped and still be brought into the ending.
 *
 * A part that dropped out two bars ago has finished; hauling it back for the
 * final chord would be re-orchestrating rather than ending. Measured in bars.
 */
const LAND_RECALL_BARS = 2;

/** Semitones a landing note may be moved to reach a chord tone. */
const LAND_SNAP = 2;

/** Slack for comparing beats that have been through swing and back. */
const EPS = 1e-6;

/**
 * Turn the last bar into an ending.
 *
 * The generator builds a form out of bars and then runs out of them, and
 * "running out of bars" is not an ending — it was the most audible unfinished
 * edge in the output. Whatever the pattern happened to be doing was cut at the
 * loop point: a comp figure sliced in half, a tune left standing on whatever
 * note the phrase was passing through, the kit still going.
 *
 * So the final bar stops being a bar of the arrangement. Three things happen to
 * it, and each is what a band does rather than what is convenient here:
 *
 *  - **everything lands on the downbeat and holds.** Onsets within
 *    `LAND_WINDOW` are pulled onto the beat and stretched across the bar;
 *    anything already ringing is held to the end rather than cut; anything
 *    later is dropped, because it would be playing after the ending.
 *  - **the landing is a chord tone.** The one detail that separates "it ends"
 *    from "it stops": a held note two semitones off the final chord is a fault
 *    the whole bar long, where the same note passing through is nothing. Only
 *    notes actually *struck* here are moved — bending one that has been
 *    sounding since the bar before would be a pitch change mid-note.
 *  - **a cymbal, or not.** `button` puts a crash and a kick under it and takes
 *    the rest of the kit out; `fade` adds nothing at all, because ambient does
 *    not finish, it stops being there.
 *
 * The show runner then has a whole bar of ringing chord to bring the house up
 * over, which is what applause is *for* — see `web/concert/show.ts`.
 */
function landEnding(song: Song, style: EndingStyle, chord: Chord | undefined): void {
  const { beatsPerBar, totalBars } = song.meta;
  if (totalBars < 2) return;

  /** The downbeat of the final bar, and the end of the piece. */
  const at = (totalBars - 1) * beatsPerBar;
  const end = totalBars * beatsPerBar;
  const tones = chord
    ? CHORD_INTERVALS[chord.quality].map((i) => ((chord.root + i) % 12 + 12) % 12)
    : [];

  for (const track of song.tracks) {
    /**
     * The one thing this track plays in the final bar, if anything.
     *
     * The *first* onset inside the window and no other — not everything within
     * half a beat of the downbeat pulled onto it. An arpeggio's next note is
     * not part of the landing chord, and stacking it on the first one turns a
     * line that plays one note at a time into one that does not, which is a
     * fault the ambient sequencer check catches by name.
     */
    let landAt = Number.POSITIVE_INFINITY;
    for (const note of track.notes) {
      if (note.beat < at - EPS || note.beat > at + LAND_WINDOW + EPS) continue;
      if (note.beat < landAt) landAt = note.beat;
    }

    const kept: NoteEvent[] = [];
    /** Notes struck on the landing, which are the ones worth snapping. */
    const struck: NoteEvent[] = [];
    /** Final-bar notes that are not part of it, in the order they were played. */
    const dropped: NoteEvent[] = [];
    let ringing = false;

    for (const note of track.notes) {
      if (note.beat < at - EPS) {
        // Still sounding when the ending lands: hold it rather than let it
        // stop somewhere inside the last bar.
        if (note.beat + note.duration > at + EPS) {
          note.duration = end - note.beat;
          ringing = true;
        }
        kept.push(note);
        continue;
      }
      // Everything else in the final bar goes. Including, when `landAt` is
      // infinite, a part whose only note there is halfway through it: the band
      // landed on the downbeat and that note would be playing after the end.
      if (!Number.isFinite(landAt) || note.beat > landAt + EPS) {
        dropped.push(note);
        continue;
      }
      // A button re-articulates on the beat; a fade leaves the attack where the
      // player put it and simply does not let go of it.
      if (style === 'button') {
        note.beat = at;
        note.velocity = clamp(note.velocity * 1.15 + 0.06, 0, 1);
        struck.push(note);
      }
      note.duration = end - note.beat;
      kept.push(note);
    }

    /**
     * A layer that was playing right up to the end but has nothing on the
     * landing gets its last voicing back, on the beat.
     *
     * This is what stops a button from being half a band. A comp whose figure
     * put its last stab on the "and" of four in the previous bar is a layer
     * that is *playing*, and dropping it from the final chord leaves a hole
     * exactly where the arrangement is at its thickest everywhere else. The
     * group is re-struck rather than a chord invented, so the voicing is the
     * one this instrument was already holding.
     *
     * The dropped notes are preferred as the source, when there are any: a
     * part whose last chord fell *inside* the final bar was written against
     * this very harmony, where anything further back was written against the
     * bar before it.
     */
    const source = dropped.length ? dropped : kept;
    if (style === 'button' && !struck.length && !ringing && source.length) {
      const last = source[source.length - 1]!;
      if (last.beat >= at - LAND_RECALL_BARS * beatsPerBar) {
        // The whole last simultaneity, so a chord comes back as a chord. Built
        // before anything is appended — `kept` is what is being added to.
        const group = source.filter((n) => n.beat >= last.beat - EPS);
        for (const note of group) {
          const copy: NoteEvent = {
            ...note,
            beat: at,
            duration: beatsPerBar,
            velocity: clamp(note.velocity * 1.15 + 0.06, 0, 1),
          };
          kept.push(copy);
          struck.push(copy);
        }
      }
    }

    if (tones.length) for (const note of struck) note.midi = snapToChord(note.midi, tones);
    track.notes = kept;
  }

  // The kit. Whatever it was playing in the last bar was a bar of pattern, and
  // the pattern is over.
  const hadDrums = song.drums.events.length > 0;
  song.drums.events = song.drums.events.filter((e) => e.beat < at - EPS);
  /**
   * A button ending is four people hitting the same beat, and a rhythm box is
   * not one of them.
   *
   * The line above is already the whole of a box's ending: the pattern stops.
   * That is what those records do — the band lands the chord and the machine
   * simply is not there any more, because somebody reached over and switched it
   * off. Giving it a crash would be the machine agreeing to a cue it has no way
   * of hearing.
   */
  if (style === 'button' && hadDrums && canVary(song.drums.source ?? 'kit')) {
    song.drums.events.push({ beat: at, voice: 'cr', velocity: 0.95 });
    song.drums.events.push({ beat: at, voice: 'bd', velocity: 0.9 });
  }
}

// ---------------------------------------------------------------------------
// The count-in
// ---------------------------------------------------------------------------

/** Bars of clicks. One, in any tempo — two is a rehearsal, not a performance. */
const COUNT_BARS = 1;

/**
 * The same song with the drummer counting it in.
 *
 * **Staging, not composition, which is why it is a separate call.** A record
 * does not count itself in — the radio plays songs and gets none of this — and
 * a band on a stage cannot start without it. So the concert applies this to
 * every number it stages and nothing else does; see `concert/index.ts`.
 *
 * What it produces is *ordinary music*: real drum events in a real section at
 * the front of the song, with everything else pushed back a bar. That is the
 * whole trick, and it is why this is fourteen lines rather than a subsystem —
 * the pattern renderer plays the clicks because they are drum events, the
 * choreographer animates the drummer hitting them because they are drum events,
 * the lighting score sees a bar it can bring the wash up over, and none of them
 * had to be told a count-in exists. `SongMeta.leadInBars` is the one thing they
 * cannot derive: where the music proper starts.
 *
 * Quarter-note clicks with an extra one on the last "and", swung with the song,
 * because the "and" is what tells a band what the eighths are going to feel
 * like. Silent for anything with no kit — there is nobody to click, and a bar
 * of silence in front of the music is the show runner's problem rather than the
 * generator's: the leader gives a visual cue instead. See `show.ts`.
 *
 * Idempotent, and it has to be: a player hit by a tomato comes back through
 * `revoiceNumber`, which regenerates the song mid-number, and a second count-in
 * would shift every beat in the piece a bar away from the clock still playing
 * it.
 */
export function withCountIn(song: Song): Song {
  if (song.meta.leadInBars) return song;
  if (!getGenre(song.meta.genre).countIn) return song;
  if (!song.drums.events.length) return song;
  /**
   * A machine does not count anybody in — somebody presses start.
   *
   * The clicks below are a person's: four rim shots, rising, the last one
   * placed late as the cue. A rhythm box has no gesture for that and no reason
   * to want one; its whole proposition is that it begins when it is switched on
   * and continues until it is switched off. So the numbers it plays begin at
   * bar one, and the *start* is the count-in — a hand on the front panel on beat
   * zero, which the stage animates because there is a machine and somebody
   * standing near it. See `DrumSource` and §4.3 of `docs/backline-plan.md`.
   */
  if (!isPlayedByHand(song.drums.source ?? 'kit')) return song;

  const { beatsPerBar, groups, swing } = song.meta;
  const shift = COUNT_BARS * beatsPerBar;

  /**
   * Where the clicks go: on the beats, or on the groups where the bar has them.
   *
   * A drummer counting a band into 7/8 does not count seven eighths and does not
   * count four quarters either — they give the three pulses, long-long-short,
   * because that is the information the band needs and the count-in exists to
   * deliver it. Counting quarters into an asymmetric bar would state a metre
   * nobody is about to play.
   */
  const beats: number[] = [];
  if (groups?.length) {
    let at = 0;
    for (const g of groups) { beats.push(at / SLOTS_PER_BEAT); at += g; }
  } else {
    for (let b = 0; b < beatsPerBar; b++) beats.push(b);
  }

  const clicks: DrumEvent[] = [];
  beats.forEach((beat, i) => {
    // Rising slightly, which is what a count-in does: the last one is the cue.
    clicks.push({ beat, voice: 'rim', velocity: 0.5 + 0.05 * i });
  });
  clicks.push({ beat: beatsPerBar - 0.5 + swing * 0.5, voice: 'rim', velocity: 0.72 });

  const count: Section = {
    kind: 'intro',
    startBar: 0,
    lengthBars: COUNT_BARS,
    transpose: 0,
    mode: song.meta.mode,
    activeLayers: ['drums'],
    // Nothing is playing it yet, but it is the harmony the count is in front
    // of, and a section with no chords at all reads downstream as a fault.
    chordLabels: Array.from({ length: COUNT_BARS },
      () => song.sections[0]?.chordLabels[0] ?? 'I'),
  };

  return {
    ...song,
    meta: {
      ...song.meta,
      totalBars: song.meta.totalBars + COUNT_BARS,
      leadInBars: COUNT_BARS,
    },
    sections: [count, ...song.sections.map((s) => ({ ...s, startBar: s.startBar + COUNT_BARS }))],
    tracks: song.tracks.map((t) => ({
      ...t,
      notes: t.notes.map((n) => ({ ...n, beat: n.beat + shift })),
    })),
    drums: {
      ...song.drums,
      events: [...clicks, ...song.drums.events.map((e) => ({ ...e, beat: e.beat + shift }))],
    },
  };
}

/**
 * The nearest pitch of `tones` (pitch classes) to `midi`, within `LAND_SNAP`.
 *
 * Nearest rather than "the root", because the note is part of a voicing the
 * arranger already balanced: dropping every layer onto the root would end the
 * piece on a unison. Ties go downward, which is where a resolution goes.
 */
function snapToChord(midi: number, tones: number[]): number {
  const has = (m: number): boolean => tones.includes(((m % 12) + 12) % 12);
  if (has(midi)) return midi;
  for (let d = 1; d <= LAND_SNAP; d++) {
    if (has(midi - d)) return midi - d;
    if (has(midi + d)) return midi + d;
  }
  return midi;
}

// ---------------------------------------------------------------------------

/**
 * The tune this section is answering, plus whatever is still ringing from the last
 * one.
 *
 * The answering line places itself in the holes of the melody it is handed, and it is
 * handed *this section's* melody — so a note held across the section boundary is
 * invisible to it, and the first hole of a section is exactly where such a note would
 * still be sounding. Two counter notes in 354 overlaps came out doubling the tune at
 * the octave that way, which `npm run genres` forbids outright and is right to.
 */
function withTail(
  byLayer: Map<LayerId, NoteEvent[]>, layer: LayerId, startBeat: number, notes: NoteEvent[],
): NoteEvent[] {
  const written = byLayer.get(layer) ?? [];
  const ringing = written.filter((n) => n.beat < startBeat && n.beat + n.duration > startBeat + 1e-6);
  if (!ringing.length) return notes;
  // Clipped where the new section's first note cuts it off, which is what the
  // concatenation trim will do to it anyway. Handed over untrimmed it claims to be
  // sounding under half the section and the answer avoids a note nobody can hear.
  const until = notes[0]?.beat ?? startBeat + 1e9;
  const clipped = ringing
    .map((n) => ({ ...n, duration: Math.min(n.duration, Math.max(0, until - n.beat)) }))
    .filter((n) => n.duration > 1e-6);
  return clipped.length ? [...clipped, ...notes] : notes;
}

/**
 * Which phrase gets handed over, as an absolute beat span.
 *
 * Drawn from the middle of the form — never the statement, never the arrival — and
 * measured off the plan rather than guessed from the notes, which is the whole reason
 * the tune engine keeps its phrases as data.
 */
function tradedPhrase(
  phrases: readonly { bars: number }[],
  section: Section,
  beatsPerBar: number,
  startBeat: number,
  rng: Rng,
): { from: number; to: number } | undefined {
  const starts: number[] = [];
  let bar = 0;
  for (const p of phrases) { starts.push(bar); bar += p.bars; }
  if (bar > section.lengthBars) return undefined;

  const choices = phrases
    .map((p, i) => ({ i, p }))
    .filter(({ i, p }) => i >= 1 && i < phrases.length - 1 && p.bars >= 2);
  if (!choices.length) return undefined;

  const { i, p } = rng.pick(choices);
  const from = startBeat + starts[i]! * beatsPerBar;
  return { from, to: from + p.bars * beatsPerBar };
}

function push(map: Map<LayerId, NoteEvent[]>, layer: LayerId, notes: NoteEvent[]): void {
  const arr = map.get(layer);
  if (arr) arr.push(...notes);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Replay a remembered melody at a new position, and in a new key if the song
 * has lifted since it was written.
 *
 * The range travels with the transposition rather than holding still, and that
 * detail is the whole point of the final-chorus key change: it exists to
 * deliver the hook one more time, higher and harder. Holding the ceiling fixed
 * clipped the top of the line — measurably, about 2% of notes, which was enough
 * to damage a quarter of all lifted choruses — and the notes it clipped were
 * always the peak of the phrase. A singer handed a lift sings above their
 * comfortable range and it strains; that strain *is* the effect.
 */
function replay(
  stored: NoteEvent[], from: Pc, to: Pc, startBeat: number, range: [number, number],
): NoteEvent[] {
  const shift = shortestShift(from, to);
  const shifted: [number, number] = [
    Math.min(range[0], range[0] + shift),
    Math.max(range[1], range[1] + shift),
  ];
  return stored.map((n) => ({
    ...n,
    beat: n.beat + startBeat,
    midi: fitToRange(n.midi + shift, shifted),
  }));
}

/** Semitones from one tonic to another, taking the shorter way round. */
function shortestShift(from: Pc, to: Pc): number {
  return ((to - from + 18) % 12) - 6;
}

/**
 * Keep a transposed note playable. Octave displacement first, since it at least
 * preserves the pitch class; clamping is the last resort and flattens contour.
 *
 * With the range moving alongside the transposition this should never fire —
 * it is a guard against a future caller that replays a line into a range it was
 * not written for, not part of the key-change path.
 */
function fitToRange(midi: number, [lo, hi]: [number, number]): number {
  if (midi > hi && midi - 12 >= lo) return midi - 12;
  if (midi < lo && midi + 12 <= hi) return midi + 12;
  return clamp(midi, lo, hi);
}

/** Look a table entry up by id, or pick one at random when unspecified. */
/**
 * Draw from the table, then let an explicit id win.
 *
 * The draw happens either way. See the note in `generateSong`: skipping it when
 * the caller already knows the answer is what made a song irreproducible from
 * its own metadata.
 */
/**
 * Which era the band is playing in.
 *
 * Uniform, except when the caller has named a style — in which case the era is
 * drawn from the ones that would actually have chosen that style. Asking for
 * fusion and getting a 1930s swing band with a clarinet and an upright bass is
 * not a compromise between the two requests; it is the style playing on
 * instruments that did not exist for it, and the era is the half nobody asked
 * about. It went unnoticed while the catalogue was eight styles that four eras
 * could all plausibly play, and stopped being tolerable the moment one of them
 * needed a Rhodes and an electric bass.
 *
 * Exactly one random number, whichever branch runs, because that is what keeps a
 * song reproducible from its own metadata — see the note at the top of
 * `generateSong`. Regenerating supplies both era and style, so what matters is
 * not which era the draw lands on but that the draw *happens* and consumes the
 * same amount of the stream either way.
 */
function chooseEra(rng: Rng, genre: Genre, opts: { era?: string; style?: string }): EraProfile {
  const ids = Object.keys(genre.eras);
  const wanted = opts.style
    ? ids.map((id) => [id, genre.eras[id]!.styleWeights[opts.style!] ?? 0] as const)
      .filter(([, w]) => w > 0)
    : [];
  const drawn = rng.weighted(wanted.length ? wanted : ids.map((id) => [id, 1] as const));
  const chosen = opts.era ?? drawn;
  const era = genre.eras[chosen];
  if (!era) {
    throw new Error(`Unknown era "${chosen}". Known: ${ids.join(', ')}`);
  }
  return era;
}

function lookup<T>(table: Record<string, T>, id: string | undefined, what: string, rng: Rng, fallback?: string): T {
  const key = fallback ?? rng.pick(Object.keys(table));
  if (id === undefined) return table[key]!;
  const found = table[id];
  if (!found) throw new Error(`Unknown ${what} "${id}". Known: ${Object.keys(table).join(', ')}`);
  return found;
}

/** The drawn value, unless the caller specified one. Both are always evaluated. */
function pick<T>(drawn: T, override: T | undefined): T {
  return override === undefined ? drawn : override;
}

function chooseStyle(rng: Rng, genre: Genre, era: EraProfile, mood: Mood): string {
  const options = Object.keys(genre.styles)
    .map((id) => {
      const eraW = era.styleWeights[id] ?? 0;
      const moodW = mood.styleBias[id] ?? 1;
      return [id, eraW * moodW] as const;
    })
    .filter(([, w]) => w > 0);
  if (!options.length) throw new Error('No style available for this era/mood combination');
  return rng.weighted(options);
}

function chooseMode(rng: Rng, style: Style, mood: Mood): Mode {
  const minor = style.modeWeights.minor * mood.modeBias.minor;
  const major = style.modeWeights.major * mood.modeBias.major;
  return rng.weighted([['minor', minor], ['major', major]] as const) as Mode;
}

function chooseTempo(rng: Rng, style: Style, mood: Mood, era: EraProfile): number {
  const [lo, hi] = style.bpm;
  const mid = (lo + hi) / 2;
  const half = (hi - lo) / 2;
  // Mood pushes toward one end of the band; a little jitter keeps it human.
  const target = mid + mood.tempo * half;
  const value = target + rng.float(-half * 0.25, half * 0.25);
  return Math.round(clamp(value * era.tempoScale, lo, hi));
}

/**
 * Assign one instrument per layer, keeping them distinct.
 *
 * Two layers on the same voice — a pad and a comp both on drawbar organ, say —
 * blur into one thick texture instead of reading as an arrangement. Roles are
 * filled in order of how much the choice matters, so the lead gets first pick
 * and the brass, which is sparse anyway, absorbs any collision that is left.
 */
function chooseInstruments(rng: Rng, era: EraProfile, style: Style) {
  const taken = new Set<string>();
  const ids = {} as Record<PlayedLayer, InstrumentId>;
  const pickId = (list: (readonly [InstrumentId, number])[]): InstrumentId => {
    const free = list.filter(([id]) => !taken.has(INSTRUMENTS[id].name));
    const id = rng.weighted(free.length ? free : list);
    taken.add(INSTRUMENTS[id].name);
    return id;
  };
  const pick = (layer: PlayedLayer, list: (readonly [InstrumentId, number])[]): Instrument => {
    const id = pickId(list);
    ids[layer] = id;
    return INSTRUMENTS[id];
  };
  /**
   * Drawn, and then moved to where this instrument plays a *tune*.
   *
   * The one place the distinction can be applied, because it is the one place
   * that knows which instrument is holding the line rather than filling a part.
   * A tenor sax on the counter-melody keeps the centre the catalogue gave it;
   * the same horn on the melody plays where a tenor plays a head. See
   * `Instrument.lead` for what the difference was costing — mostly not the tune,
   * which sounded fine an octave low, but the comp underneath it, which had
   * nowhere left to voice a chord.
   */
  const drawnRaw = pick('melody', era.palette.melody);
  const drawn = drawnRaw.lead !== undefined ? { ...drawnRaw, centre: drawnRaw.lead } : drawnRaw;
  /**
   * The two-handed lead is drawn here, before the rest of the band, so that it
   * can be *taken*.
   *
   * Drawing it last was the obvious order and produced a vibraphone trio whose
   * counter-melody was also on vibraphone — one instrument cast twice, which the
   * `taken` set exists to prevent and could not, because by the time the lead
   * was known the other five had already been picked around a lead that turned
   * out not to be playing. Order matters here and nowhere else in the function.
   *
   * A style with no list of its own draws nothing here and takes the lead the
   * palette already gave it. That costs no random number, so a table that adds
   * `twoHanded` without naming instruments does not reshuffle a single seed —
   * it only decides that the hands the drawn instrument has get used.
   */
  const lead = style.twoHanded?.instruments
    ? rng.weighted(style.twoHanded.instruments)
    : undefined;
  if (lead) taken.add(INSTRUMENTS[lead].name);
  const bass = pick('bass', era.palette.bass);
  const comp = pick('comp', era.palette.comp);
  const pad = pick('pad', era.palette.pad);
  const counter = pick('counter', era.palette.counter);
  const brass = pick('brass', era.palette.brass);

  /**
   * Who, of the whole band, has a second hand — not only the one out front.
   *
   * The lead was the only entry here for as long as the left hand was the lead's
   * private business, and that was wrong about the one section where two hands
   * matter most. In iskelmä the break belongs to the *counter* instrument, which
   * is drawn from a palette full of accordions; an accordion taking a chorus and
   * playing a single line with its right hand is not an accordion break, it is
   * half of one. See where `generateLeftHand` is called for what is done with
   * this.
   */
  const handsFor: Partial<Record<PlayedLayer, HandSpec>> = {};
  if (style.twoHanded) {
    for (const [layer, id] of Object.entries(ids) as [PlayedLayer, InstrumentId][]) {
      const spec = HANDS[id];
      if (spec) handsFor[layer] = spec;
    }
  }

  /**
   * A style that names its own leads overrides the draw *after* it has happened,
   * never instead of it.
   *
   * The same argument as the one at the top of `generateSong`, and the same
   * consequence if it is ignored: a branch that skipped `pick` would spend one
   * fewer random number and hand back a different form, tempo and drum part for
   * the same seed. So the flute is drawn and thrown away, and the seed still
   * reproduces the song its own metadata describes.
   *
   * The centre travels with the override because the two are one decision — see
   * `HandSpec.lead`. A piano is a piano wherever it is playing; a piano
   * *fronting a trio* is a piano an octave higher, and a vibraphone fronting one
   * is higher again, because the two instruments do not sit in the same place.
   */
  /**
   * The drawn lead gets the same lift a named one would.
   *
   * `HandSpec.lead` is not a preference about register, it is the room the left
   * hand needs: an accordion playing the tune where the catalogue puts it leaves
   * `handWindow` a couple of semitones to voice in, and a couple of semitones is
   * no window at all — the hand would fall silent through most of the song and
   * the style would look like it had merely asked for a sparse one. So the lift
   * travels with the hands rather than with the way they were chosen.
   */
  if (!lead) {
    return {
      melody: handsFor.melody ? { ...drawn, centre: handsFor.melody.lead } : drawn,
      counter, comp, pad, bass, brass, handsFor,
    };
  }
  // The named lead replaces the drawn one, so its hands replace the drawn one's
  // too — including when it has none, which is the table error `npm run genres`
  // reports and which must not leave the thrown-away instrument's spec behind.
  const hands = HANDS[lead];
  if (hands) handsFor.melody = hands;
  else delete handsFor.melody;
  return {
    melody: { ...INSTRUMENTS[lead], ...(hands ? { centre: hands.lead } : {}) },
    counter, comp, pad, bass, brass, handsFor,
  };
}

/**
 * What the left hand does in this section.
 *
 * Three things get filtered out before the draw rather than after, because a
 * mode that was chosen and then silently produced nothing would look — in the
 * audit, in the report, on the stage — exactly like a style whose left hand is
 * meant to be sparse:
 *
 *  - **`unison` needs a hand that can play a line.** An accordion's cannot; the
 *    button side sounds fixed chords. See `HandSpec.melodic`.
 *  - **`ostinato` needs a figure.** A style that offers the mode without writing
 *    one has a table error, which `npm run genres` reports; dropping it here is
 *    what keeps the song generating in the meantime.
 *  - **`stride` needs somewhere to put the bass note.** See `HandSpec.bass`, and
 *    the vibraphone, whose two mallets cannot be in two octaves at once.
 *
 * Filtering before the draw also keeps the weights meaning what they say. A
 * table asking for equal parts unison and answer on an accordion gets all
 * answer, not half a part missing.
 *
 * ## And a fourth filter, which is about the section rather than the hand
 *
 * `answer` is written to fall silent under a busy right hand — deliberately, and
 * correctly, because that is what a pianist's left hand does through a running
 * passage. A solo is a running passage from the first bar to the last, so a
 * chorus accompanied by `answer` is a chorus barely accompanied at all: the one
 * section where the player is alone with the rhythm section is the section their
 * other hand was quietest in. So where a solo has any other mode on offer,
 * `answer` steps aside for it — the vamp, the oom-pah and the locked chord all
 * keep playing regardless of how busy the line above them gets, which is the
 * whole reason a soloing pianist reaches for them.
 *
 * Not a re-weighting, because a re-weighting would be a taste. This is a mode
 * that cannot do the job the section needs, filtered the same way as the three
 * above it, and a style offering nothing else still gets it.
 */
function chooseLeftHandMode(
  rng: Rng, keys: TwoHandedKeys, spec: HandSpec, solo = false,
): LeftHandMode {
  const offered = keys.modes ?? [['answer', 1] as const];
  const eligible = offered.filter(([mode]) =>
    (mode !== 'unison' || spec.melodic)
    && (mode !== 'ostinato' || keys.ostinato)
    && (mode !== 'stride' || spec.bass !== undefined));
  const holdsUp = solo ? eligible.filter(([mode]) => mode !== 'answer') : eligible;
  const draw = holdsUp.length ? holdsUp : eligible;
  return draw.length ? rng.weighted(draw) : 'answer';
}

function buildForm(rng: Rng, genre: Genre, style: Style, bpm: number, targetSeconds: number): FormStep[] {
  const steps = rng.weighted(genre.forms).map((s) => ({ ...s }));

  // Styles built on a fixed chorus length (the twelve-bar blues) rewrite the
  // eight-bar units the templates are written in. Intros and outros keep their
  // own length — a four-bar intro is a four-bar intro in any form.
  if (style.chorusBars && style.chorusBars !== 8) {
    for (const step of steps) {
      if (step.kind === 'intro' || step.kind === 'outro') continue;
      step.bars = style.chorusBars;
      // A twelve-bar blues has no bridge — every chorus is the same twelve
      // bars. Fold any the template contributed back into the head.
      if (step.kind === 'bridge') step.kind = 'verse';
    }
  }

  const secondsPerBar = (style.beatsPerBar / bpm) * 60;

  /**
   * A fast waltz bar lasts about a second, so an eight-bar section is gone in
   * eight. Rather than pile on more sections — which produces a form no band
   * would play — double the section length. A fast 3/4 or a bebop head phrases
   * in sixteens anyway.
   */
  if (!style.chorusBars && secondsPerBar < 1.5) {
    for (const step of steps) {
      if (step.kind !== 'intro' && step.kind !== 'outro') step.bars *= 2;
    }
  }

  const duration = () => steps.reduce((a, s) => a + s.bars, 0) * secondsPerBar;
  const unit = steps.find((s) => s.kind !== 'intro' && s.kind !== 'outro')?.bars ?? 8;

  const MAX_SOLOS = 4;
  const MAX_SECTIONS = 14;
  let guard = 0;
  while (duration() < targetSeconds * 0.82 && guard++ < 8) {
    if (steps.length >= MAX_SECTIONS) break;
    // Where the form already blows — jazz, and iskelmä's solo-chorus templates
    // — add another *consecutive* solo, because that is what taking a second
    // chorus means. Alternating solo and head instead reads as indecision.
    const solos = steps.filter((s) => s.kind === 'solo').length;
    const lastSolo = steps.map((s) => s.kind).lastIndexOf('solo');
    if (lastSolo >= 0 && solos < MAX_SOLOS) {
      steps.splice(lastSolo + 1, 0, { kind: 'solo', bars: unit });
    } else {
      const insertAt = Math.max(2, steps.findIndex((s) => s.kind === 'chorus') + 1);
      steps.splice(insertAt, 0, { kind: 'verse', bars: unit }, { kind: 'chorus', bars: unit });
    }
  }

  // Trim from the middle only: index 0 is the intro and index 1 is the opening
  // statement of the head. Removing either leaves a song that begins on a
  // bridge or a solo.
  guard = 0;
  while (duration() > targetSeconds * 1.25 && steps.length > 5 && guard++ < 6) {
    const idx = steps.findIndex(
      (s, i) => i > 1 && i < steps.length - 2 && (s.kind === 'verse' || s.kind === 'solo'),
    );
    if (idx < 0) break;
    steps.splice(idx, 1);
  }
  return steps;
}

/**
 * How plain a progression is, 0..1.
 *
 * Two things make harmony easy to hear past: **few distinct chords**, and
 * **chords that belong to the key**. A ii–V into a secondary dominant is
 * beautiful and it costs the listener attention, which is attention not being
 * spent on the tune. The songs everyone can sing are built on three chords, and
 * that is not a coincidence or a limitation — it is what leaves room for the
 * melody to be the thing you remember.
 */
function plainness(prog: Progression): number {
  const distinct = new Set(prog.chords).size;
  const fewChords = Math.max(0, 1 - (distinct - 2) / 4);
  const borrowed = prog.chords.filter((c) => c.includes('/') || c.startsWith('b') || c.startsWith('#')).length;
  const diatonic = 1 - borrowed / Math.max(1, prog.chords.length);
  return clamp((fewChords * 0.6 + diatonic * 0.4), 0, 1);
}

function pickProgression(
  rng: Rng, style: Style, kind: SectionKind, mode: Mode, simplicity: number,
): Progression {
  // Roman numerals are read relative to the mode, so a major-key table read in
  // minor produces nonsense. Each style declares a table for its primary mode
  // and, where it can appear in both, an override for the other.
  const override = mode === 'major' ? style.majorProgressions : style.minorProgressions;
  const table = override?.[kind] ?? override?.verse ?? style.progressions[kind] ?? style.progressions.verse;

  const candidates = table.length ? table : style.progressions.verse;

  /**
   * Hook reaches the harmony, not only the tune.
   *
   * This is the half of repetition the generator was missing entirely. A song
   * can restate its melody perfectly and still be hard to hold onto if the
   * chords underneath keep asking for attention — and conversely, most of what
   * makes a hook feel inevitable is that the harmony has stopped surprising you
   * by the second chorus. At `earworm` the plainest progression available wins
   * almost every draw; at `through` the weighting is untouched.
   */
  return rng.weighted(candidates.map((p) => {
    let w = p.weight;
    if (simplicity > 0) w *= 1 + simplicity * 3 * plainness(p);
    // In minor, boost the chorus progressions that open on III or VI — the
    // relative-major region. That lift is the genre's core emotional device.
    if (kind === 'chorus' && mode === 'minor' && style.relativeMajorChorus > 0) {
      const first = p.chords[0] ?? '';
      if (first === 'III' || first === 'VI') w *= 1 + style.relativeMajorChorus * 2;
    }
    return [p, w] as const;
  }));
}

function expandProgression(prog: Progression, bars: number, mode: Mode): Chord[] {
  const out: Chord[] = [];
  for (let i = 0; i < bars; i++) {
    const label = prog.chords[i % prog.chords.length]!;
    out.push(parseRoman(label, mode));
  }
  return out;
}

function transposeChord(chord: Chord, semitones: number): Chord {
  if (!semitones) return chord;
  return { ...chord, root: ((chord.root + semitones) % 12 + 12) % 12 };
}

/**
 * Play a stretch of already-written music the way a feel says to.
 *
 * The sibling of `applyDynamics`, and it sits beside it for the reason that pass
 * gives for existing at all: doing this here rather than inside each part
 * generator is what keeps the parts ignorant of everything above them. A comp
 * pattern should not have to know whether it is in a bridge, and it should not
 * have to know whether the band is in the pocket either.
 *
 * **Rhythm section only.** The layers are named by the type — see `FeelLayer` —
 * and the melody and the counter are not among them, because those were
 * auditioned and moving them afterwards throws the audition away.
 *
 * ## The order the blocks run in, which is not arbitrary
 *
 * `subdivide`, `displace`, `accent`, `articulation`, `ghost`, `push`.
 *
 * Everything that reads a note's *position in the bar* runs before the one thing
 * that moves notes off the bar's grid, so `push` is last and every block above
 * it can round a beat to a sixteenth and be right. `ghost` sits between
 * articulation and push because a ghost's level and length are stated outright
 * rather than derived — it should not be re-accented or re-articulated — but it
 * should still lean with the rest of its layer, so it has to exist before the
 * push happens. `subdivide` runs first because the half it leaves behind is a
 * real note and everything after it should treat it as one.
 *
 * ## What each block may not do
 *
 * **A feel modifies, it never authors.** Two of these blocks add notes, which
 * looks like a contradiction and is not: the invariant is that a feel never
 * changes *what* is played. A subdivision repeats a pitch inside the footprint
 * of the note it came from; a ghost repeats the pitch of the note it leads into,
 * lands only where its layer is already silent, and is capped far below the
 * surrounding level. Neither carries a pitch class that was not already there,
 * which is where the boundary between "how" and "what" actually sits — see
 * `genre-check.ts`, where it is asserted in those terms.
 */
function applyFeel(args: {
  feel: Feel;
  /** How far toward the feel this span goes, 0..1. */
  amount: number;
  bpm: number;
  /**
   * The swing in force over this span: the style's, or the feel's override
   * interpolated by `amount`. Needed both to move a note without losing its
   * swing — see below — and so that this pass and assembly agree about what the
   * swing is, which is the whole of `Feel.swing`'s contract.
   */
  swing: number;
  /** The style's bar length, for reading a beat's position in its bar. */
  beatsPerBar: number;
  /** Its own stream. Drawn from only by the blocks that are actually present. */
  rng: Rng;
  /**
   * The kit's stream, and it has to be a second one.
   *
   * Everything this function does to the band is allowed to depend on the band.
   * Nothing it does to the *kit* is, because `npm run genres` asserts that drum
   * events are byte-identical at every `--hook` level — see `docs/hook.md`, and
   * see the same constraint stated at length on the shot figure in
   * `generate/transition.ts`.
   *
   * One stream broke that, and the path is worth recording because it is not
   * visible from either end. The ghost block walks the bass first and the snare
   * second; how many times it draws on the bass depends on how many bass onsets
   * clear the guards; the bass follows the tune, through `patchBand`; and the
   * tune is exactly what `--hook` moves. So a hook level that shifted one bass
   * note shifted every snare ghost after it, and the kit came out different
   * having been given no reason to. Only `funk` declares a ghost and only
   * `fusion` may play it, which is why twenty unpinned seeds never found it.
   *
   * A second stream is the whole fix: the kit's draws are then a function of the
   * seed and the section, and of nothing that the tune can reach.
   */
  kitRng: Rng;
  /**
   * The downbeat of the final bar. Nothing at or after it is touched.
   *
   * The last bar is not a bar of the arrangement, it is the ending — see
   * `landEnding` — and an ending is the one moment where the whole band lands on
   * the same beat on purpose. Leaving it out is not tidiness either; it was
   * measured. A bass onset twelve milliseconds early falls out of the landing
   * window, so the ending took the *next* pattern note as its landing and struck
   * it on the downbeat while the early one was held: a doubled attack on the
   * final chord, in three fusion songs out of forty. The kit had the mirror
   * fault, since the drums in the final bar are removed by comparing against the
   * same downbeat, and a snare pushed in front of it survived as a stray hit
   * under the crash.
   */
  endsAt: number;
  layers: Partial<Record<Exclude<FeelLayer, 'drums'>, NoteEvent[]>>;
  /**
   * The song's kit list, and the index this section's events start at. Absent
   * for a preset rhythm box.
   *
   * A window into the real array rather than a copy of it, which wave 3 did not
   * need and wave 4 does. The kit is the one part not held in a `section…` local
   * — see `drumsFrom` — so this used to be handed a `slice`, and a slice shares
   * its elements but not its length: every in-place edit landed and every
   * *added* event went into an array that was thrown away a line later. Silent,
   * and it cost a debugging session — funk's ghosted snares simply never
   * appeared, with no error and no missing hit to notice.
   */
  drums?: { events: DrumEvent[]; from: number };
}): void {
  const { feel, amount, bpm, rng, swing } = args;
  if (amount <= 0) return;

  const ending = (beat: number) => beat >= args.endsAt - 1e-6;

  /**
   * Milliseconds into beats, which is the conversion this whole field exists to
   * defer. A push is a fact about a player rather than about a tempo — see
   * `Feel.push` — so it stays in milliseconds everywhere except the one line
   * that has the song's tempo to hand, which is this one.
   */
  const toBeats = (ms: number) => (ms * bpm) / 60000 * amount;

  /** The second eighth of a beat, which is the only thing `applySwing` moves. */
  const offbeat = (beat: number) => Math.abs((beat - Math.floor(beat)) - 0.5) < 1e-6;

  const slotsPerBar = Math.round(args.beatsPerBar * SLOTS_PER_BEAT);
  /** Which sixteenth of its own bar a beat falls on. */
  const slotOf = (beat: number) => {
    const s = Math.round(beat * SLOTS_PER_BEAT) % slotsPerBar;
    return s < 0 ? s + slotsPerBar : s;
  };
  const barOf = (beat: number) => Math.floor(beat / args.beatsPerBar + 1e-9);
  const onGrid = (beat: number) =>
    Math.abs(beat * SLOTS_PER_BEAT - Math.round(beat * SLOTS_PER_BEAT)) < 1e-6;

  /** This section's kit events. The elements are the real ones; the list is not. */
  const kitHere = args.drums ? args.drums.events.slice(args.drums.from) : undefined;

  /**
   * `subdivide` and `displace` reach the comp and nothing else, and the bass's
   * absence is the interesting half of that.
   *
   * A pad is a bed and a bed broken in two is a bed with a hole in it; brass here
   * is written as stabs and answers that are already short and already placed.
   * Those two are easy. The bass is not, because both gestures are real on a bass
   * and both were tried:
   *
   *  - **Subdividing a bass note** is repeating it, and a repeated bass note is a
   *    different bass figure rather than a different articulation. A funk bass
   *    line's sixteenths come out of the pattern that was drawn for it — see
   *    `Style.bass` — and manufacturing them here is the feel library growing
   *    into a second style table, which is the one thing it must not do. On a
   *    comp the same edit is a bow stroke: a held chord and the same chord struck
   *    twice are one harmony played two ways.
   *  - **Anticipating a bass note** unlocks it from the kick. The bass and the
   *    bass drum land together and that lock is most of what a rhythm section
   *    *is*; moving one of them a sixteenth without the other does not read as a
   *    push, it reads as a flam. The comp has no such partner and can move alone.
   *
   * It also makes the boundary checkable rather than merely stated: with the two
   * note-adding gestures on disjoint layers, every note added to the bass is a
   * ghost and every note added to the comp is half of a note that was already
   * there, and `genre-check.ts` can assert each without having to guess which it
   * is looking at.
   */
  const figureLayers = ['comp'] as const;

  /**
   * Notes grouped by the onset they were struck on, in beat order.
   *
   * A comp chord is four simultaneous notes and it is *one hit*. Subdividing or
   * displacing one voice of it and leaving the other three would re-voice the
   * chord, which is authoring — so every block that moves or splits a hit works
   * on groups and moves all of a group together. Keyed on the beat rather than
   * on identity because that is what "struck together" means here.
   */
  const onsets = (notes: NoteEvent[]): [number, NoteEvent[]][] => {
    const map = new Map<number, NoteEvent[]>();
    for (const n of notes) {
      const key = Math.round(n.beat * 960);
      const at = map.get(key);
      if (at) at.push(n); else map.set(key, [n]);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  };

  /**
   * Break a sustained hit into two shorter ones.
   *
   * The split point is quantised to a sixteenth and both halves have to survive
   * as notes, which is what stops this from turning a dotted eighth into a
   * thirty-second and a click. The tail keeps the pitch, so the layer's bag of
   * pitches is exactly what it was — see the header on why that is the line
   * rather than the note count.
   */
  if (feel.subdivide) {
    const chance = feel.subdivide * amount;
    for (const layer of figureLayers) {
      const notes = args.layers[layer];
      if (!notes?.length) continue;
      const added: NoteEvent[] = [];
      for (const [, group] of onsets(notes)) {
        const head = group[0]!;
        if (ending(head.beat)) continue;
        // The shortest voice decides: a chord splits where all of it can.
        const shortest = Math.min(...group.map((n) => n.duration));
        const half = Math.round(shortest / 2 * SLOTS_PER_BEAT) / SLOTS_PER_BEAT;
        if (half < 0.25 || shortest - half < 0.25) continue;
        if (ending(head.beat + half)) continue;
        if (!rng.chance(chance)) continue;
        for (const n of group) {
          const rest = n.duration - half;
          n.duration = Math.max(0.05, half * 0.9);
          // Lighter on the repeat: a re-struck note is a re-struck note, not a
          // second attack of the same weight.
          added.push({ ...n, beat: n.beat + half, duration: Math.max(0.05, rest * 0.9), velocity: n.velocity * 0.86 });
        }
      }
      if (added.length) {
        notes.push(...added);
        notes.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
      }
    }
  }

  /**
   * Anticipate a weak beat by a sixteenth.
   *
   * Early and tied over, so the note still ends where it ended — the band gets
   * to the chord before the bar says to and stays there, which is an
   * anticipation. The duration grows here and `articulation` shortens it
   * afterwards, in that order deliberately: under `funk` the anticipation
   * becomes a stab a sixteenth in front of the beat, which is the gesture, and
   * under `laidback` it becomes a longer note that arrives early, which is also
   * the gesture.
   *
   * Only hits squarely on a beat, never the bar's downbeat, and only where the
   * sixteenth in front is genuinely empty — nothing struck there and nothing
   * sounding through it. That last test is what keeps a comp from anticipating
   * itself into a doubled voice.
   *
   * The restriction to on-beat hits is also what keeps this out of the swing's
   * way: neither a beat nor the sixteenth before it is the offbeat eighth that
   * `applySwing` moves, so a displaced note is swung exactly as often as it was
   * before, which is never.
   */
  if (feel.displace) {
    const chance = feel.displace * amount;
    for (const layer of figureLayers) {
      const notes = args.layers[layer];
      if (!notes?.length) continue;
      const struck = new Set(notes.map((n) => Math.round(n.beat * SLOTS_PER_BEAT)));
      let moved = 0;
      for (const [, group] of onsets(notes)) {
        const head = group[0]!;
        const slot = slotOf(head.beat);
        if (!onGrid(head.beat) || ending(head.beat)) continue;
        if (slot === 0 || slot % SLOTS_PER_BEAT !== 0) continue;
        const to = head.beat - 1 / SLOTS_PER_BEAT;
        if (to < 0 || struck.has(Math.round(to * SLOTS_PER_BEAT))) continue;
        if (notes.some((m) => m.beat < to - 1e-6 && m.beat + m.duration > to + 1e-6)) continue;
        if (!rng.chance(chance)) continue;
        struck.delete(Math.round(head.beat * SLOTS_PER_BEAT));
        struck.add(Math.round(to * SLOTS_PER_BEAT));
        moved++;
        for (const n of group) {
          n.beat -= 1 / SLOTS_PER_BEAT;
          n.duration += 1 / SLOTS_PER_BEAT;
        }
      }
      // Only when something actually moved. Re-sorting a list nothing happened
      // to is how a pass that declines to act still changes the output.
      if (moved) notes.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
    }
  }

  /**
   * Redistribute the weight inside the bar.
   *
   * ## Two normalisations, and the second is the one that works
   *
   * The plan asks for the array to be normalised to mean 1.0 so that a feel
   * changes the shape of a section's loudness and never its rank. That is
   * necessary and it is **not sufficient**, and the gap is not subtle: an array
   * of mean 1.0 only leaves the mean alone if the notes are spread evenly over
   * the bar's sixteenths, and no rhythm-section part in this project is. A bass
   * playing root and fifth on the strong beats collects the array's largest
   * entries on every note it plays.
   *
   * Measured with only the bar normalisation in place, over twelve songs per
   * style: `funk` lifts the blues bass 10.8% and the fusion kit 8.1%,
   * `halftime` lifts the modal comp 10.0%, and `laidback` drops every layer of
   * a ballad by 7 to 9%. Those are the size of the gap between a verse and a
   * chorus — so a feel drawn on one and not the other could invert the pair
   * while satisfying the letter of the rule, which is exactly the failure the
   * rule was written to prevent.
   *
   * So the array is normalised over the bar (which is what makes the numbers in
   * the table mean what they look like), and then the *factors actually applied*
   * are normalised over the notes they are applied to, per layer. After that the
   * layer's mean velocity is arithmetically unchanged and only its distribution
   * has moved, which is the property stated rather than an approximation of it.
   *
   * The bar window is built by tiling rather than by slicing, so a sixteen-long
   * array under fusion's fourteen-sixteenth bar normalises over the fourteen
   * entries that can actually sound instead of over two that cannot.
   */
  if (feel.accent?.length) {
    const table = feel.accent;
    const window: number[] = [];
    for (let i = 0; i < slotsPerBar; i++) window.push(table[i % table.length]!);
    const barMean = window.reduce((a, b) => a + b, 0) / window.length;
    if (barMean > 0) {
      const factorAt = (beat: number) => 1 + (window[slotOf(beat)]! / barMean - 1) * amount;
      /**
       * Not the pad — see `Feel.accent`. Its notes are long, few, and nearly all
       * on a downbeat, so a per-sixteenth accent on one is a fader move.
       */
      const accented: (NoteEvent[] | DrumEvent[])[] = [];
      for (const layer of ['bass', 'comp', 'brass'] as const) {
        const notes = args.layers[layer];
        if (notes?.length) accented.push(notes);
      }
      if (kitHere?.length) accented.push(kitHere);
      for (const events of accented) {
        const live = (events as { beat: number }[]).filter((e) => !ending(e.beat));
        if (!live.length) continue;
        const mean = live.reduce((sum, e) => sum + factorAt(e.beat), 0) / live.length;
        if (mean <= 0) continue;
        for (const e of events as { beat: number; velocity: number }[]) {
          if (ending(e.beat)) continue;
          e.velocity = clamp(e.velocity * factorAt(e.beat) / mean, 0.08, 1);
        }
      }
    }
  }

  for (const [layer, notes] of Object.entries(args.layers) as
    [Exclude<FeelLayer, 'drums'>, NoteEvent[] | undefined][]) {
    if (!notes?.length) continue;

    /**
     * Articulation is interpolated rather than scaled, so that `amount` means
     * the same thing here as it does for a push: at 0 the feel is not applied,
     * at 1 it is applied in full, and 0.5 is genuinely half way there. A raw
     * multiplication by `amount` would make every partial span staccato.
     */
    const art = feel.articulation?.[layer];
    if (art !== undefined && art !== 1) {
      const factor = 1 + (art - 1) * amount;
      for (const n of notes) {
        if (ending(n.beat)) continue;
        n.duration = Math.max(0.05, n.duration * factor);
      }
    }
  }

  /**
   * The notes that are not notes.
   *
   * A ghost is the softest thing on the record and it is what makes a rhythm
   * section sound busy without being loud: the snare stroke between the
   * backbeats that you feel rather than hear, and the bass note a sixteenth
   * before the real one that is mostly string noise. It is also the one gesture
   * in this file that adds an event, so it is scoped until it cannot say
   * anything new:
   *
   *  - **snare and bass only.** Nothing else. A ghosted comp chord is a comp
   *    chord and a ghosted pad is a mistake;
   *  - **a bass ghost repeats the pitch it leads into**, so the layer's bag of
   *    pitch classes is untouched and no harmony has been proposed;
   *  - **only where the layer is already silent** — nothing struck on the slot
   *    and, for the bass, nothing sounding through it;
   *  - **capped at a fraction of the surrounding level.** 0.22 of the mean in
   *    the same bar, against a check that allows 0.35: a ghost that can be heard
   *    as a note is not a ghost, and the reference is the bar rather than the
   *    section so that a quiet passage gets quiet ghosts.
   *
   * The snare's eligible rests are the sixteenths either side of a stroke it is
   * already playing, and not every empty weak sixteenth in the bar. Both are
   * defensible readings of "an eligible rest"; this one places the ghosts where
   * a drummer's stick actually is, and it makes the count a property of the
   * pattern rather than of the bar — eight candidates a bar at 0.35 would be
   * nearly three ghosts a bar whatever the figure was doing.
   *
   * **A ghost stays in the bar of the note it belongs to**, which costs a real
   * gesture and buys two things worth more. The gesture lost is the bass ghost
   * that leads across the barline into a downbeat, which is idiomatic and which
   * this cannot do. What it buys: the level a ghost is measured against always
   * exists, since the bar it lands in is the bar containing the note it came
   * from; and — the load-bearing one — the silence test cannot be wrong. This
   * pass only sees the section's own notes, so a ghost written before the
   * section's first onset would be tested for silence against a list that does
   * not contain the note it was about to collide with. Sections begin on
   * barlines, so staying inside the bar is staying inside the section.
   */
  if (feel.ghost) {
    const chance = feel.ghost * amount;
    /** The level a ghost is measured against: what this layer is playing here. */
    const levelIn = (events: { beat: number; velocity: number }[]) => {
      const sum = new Map<number, [number, number]>();
      for (const e of events) {
        const bar = barOf(e.beat);
        const at = sum.get(bar) ?? [0, 0];
        sum.set(bar, [at[0] + e.velocity, at[1] + 1]);
      }
      return (beat: number) => {
        const at = sum.get(barOf(beat));
        return at && at[1] ? at[0] / at[1] : 0;
      };
    };

    const bass = args.layers.bass;
    if (bass?.length) {
      const level = levelIn(bass);
      const added: NoteEvent[] = [];
      for (const [, group] of onsets(bass)) {
        const head = group[0]!;
        const at = head.beat - 1 / SLOTS_PER_BEAT;
        if (at < 0 || !onGrid(head.beat) || ending(head.beat)) continue;
        if (barOf(at) !== barOf(head.beat)) continue;
        if (bass.some((m) => Math.abs(m.beat - at) < 1e-6)) continue;
        if (bass.some((m) => m.beat < at - 1e-6 && m.beat + m.duration > at + 1e-6)) continue;
        if (!rng.chance(chance)) continue;
        // The pitch of the note it leads into, which is the whole licence for
        // this existing: it is the same note, played early and almost silently.
        added.push({
          ...head, beat: at, duration: 0.2, velocity: Math.max(0.05, level(at) * 0.22),
        });
      }
      if (added.length) {
        bass.push(...added);
        bass.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
      }
    }

    const snare = kitHere?.filter((e) => e.voice === 'sd') ?? [];
    if (args.drums && snare.length) {
      const level = levelIn(snare);
      const struck = new Set(snare.map((e) => Math.round(e.beat * SLOTS_PER_BEAT)));
      for (const e of snare) {
        for (const step of [-1, 1]) {
          // Offset from the stroke rather than snapped to the grid, so the ghost
          // inherits whatever humanising jitter `generateDrums` gave its
          // neighbour: one hand played both, a sixteenth apart.
          const at = e.beat + step / SLOTS_PER_BEAT;
          const key = Math.round(at * SLOTS_PER_BEAT);
          if (at < 0 || ending(at) || struck.has(key)) continue;
          if (barOf(at) !== barOf(e.beat)) continue;
          // The weak sixteenths only. A ghost on a beat is a quiet backbeat.
          if (slotOf(at) % 2 === 0) continue;
          // `kitRng`, not `rng` — see the field. A snare that drew after the bass
          // inherited the bass's position in the stream, and the bass follows the
          // tune.
          if (!args.kitRng.chance(chance)) continue;
          struck.add(key);
          // Onto the song's list, not onto the window — see `drums` above. The
          // whole list is sorted once at assembly, so the tail is the right place.
          args.drums.events.push({
            beat: at, voice: 'sd', velocity: Math.max(0.05, level(at) * 0.22),
          });
        }
      }
    }
  }

  /**
   * And last, the one block that takes notes off the grid.
   *
   * Everything above reads a beat's position in its bar, so this runs after all
   * of it — see the header. Within it, the subtlety is worth the three lines.
   * `applySwing` runs at assembly and finds its offbeats by testing the fraction
   * against exactly 0.5, so a note this pass has already nudged twelve
   * milliseconds is no longer at 0.5 and would quietly stop being swung —
   * arriving *earlier* than a straight note instead of a hair in front of a
   * swung one. That is a groove bug that reads as sloppiness rather than as a
   * fault, which is the worst kind. So an onset about to be moved off the grid
   * is swung here first, and assembly then correctly leaves it alone.
   *
   * `swing` is the span's swing and not the style's, which is what makes
   * `Feel.swing` safe: this pass and assembly are handed the same number, so a
   * note is swung by one of them and never by both.
   *
   * Clamped at zero because the song starts there: a bass leaning into the
   * first downbeat of the piece has nothing to lean out of.
   */
  for (const [layer, notes] of Object.entries(args.layers) as
    [Exclude<FeelLayer, 'drums'>, NoteEvent[] | undefined][]) {
    if (!notes?.length) continue;
    const offset = toBeats(feel.push?.[layer] ?? 0);
    if (!offset) continue;
    for (const n of notes) {
      if (ending(n.beat)) continue;
      if (swing > 0 && offbeat(n.beat)) {
        n.beat += swing * 0.5;
        n.duration = Math.max(0.05, n.duration - swing * 0.5);
      }
      n.beat = Math.max(0, n.beat + offset);
    }
  }

  if (args.drums && feel.push) {
    const kit = toBeats(feel.push.drums ?? 0);
    // Re-sliced rather than reusing `kitHere`, so that a ghost added above leans
    // with the stroke it was ghosting. A ghost that stayed on the grid while the
    // snare around it dragged would be the one hit in the bar playing straight.
    for (const e of args.drums.events.slice(args.drums.from)) {
      // The voice wins over the kit: `pocket` drags the snare and leaves the
      // hats where they were, which is the difference between a band laying
      // back and a band slowing down.
      const offset = feel.push[e.voice] !== undefined ? toBeats(feel.push[e.voice]!) : kit;
      if (!offset || ending(e.beat)) continue;
      if (swing > 0 && offbeat(e.beat)) e.beat += swing * 0.5;
      e.beat = Math.max(0, e.beat + offset);
    }
  }
}

/**
 * How much swing is in force at a given beat.
 *
 * A number for every song that has not asked the question, which is nearly all
 * of them and which is also the fast path: `applySwing` takes the same exit it
 * always took and a straight style is not walked at all. A function only where
 * some span carries `Feel.swing`, because that is the one field of a feel that
 * cannot be applied by `applyFeel` — swing reaches the melody too, and the
 * melody is auditioned, so it has to happen where swing already happens.
 */
type SwingPlan = number | ((beat: number) => number);

/**
 * Swing: delay the second eighth of each beat. Applied in the IR so both
 * renderers inherit it identically.
 *
 * A note is swung here exactly once or not at all. `applyFeel` swings an onset
 * itself when it is about to move it off the grid — otherwise the test below
 * would stop finding it — and takes its number from the same `SwingPlan`, so
 * the two passes cannot disagree and cannot both fire on the same note.
 */
function applySwing(notes: NoteEvent[], swing: SwingPlan): NoteEvent[] {
  if (typeof swing === 'number' && swing <= 0) return notes;
  const swingAt = typeof swing === 'number' ? () => swing : swing;
  return notes.map((n) => {
    const s = swingAt(n.beat);
    if (s <= 0) return n;
    const frac = n.beat - Math.floor(n.beat);
    if (Math.abs(frac - 0.5) < 1e-6) {
      return { ...n, beat: n.beat + s * 0.5, duration: Math.max(0.05, n.duration - s * 0.5) };
    }
    return n;
  });
}

/**
 * One pair of hats, and they are either open or shut.
 *
 * Nothing upstream knows the whole kit: a pattern can write both voices on the
 * same slot (`disco-shuffle` has hats on every eighth and an open hat on two of
 * them), a fill's landing puts an open hat on a downbeat the next section's
 * pattern is already chicking, and a drum solo's cymbal work meets the pattern
 * at the barline. Each of those is reasonable on its own and all of them come
 * out as one stick hitting one cymbal twice at once — which no drummer has ever
 * played and which reads on the kit as a hat that is open and closed together.
 *
 * The open hat wins, because it is the one carrying the accent wherever the two
 * collide. A closed hat *after* an open one is left alone: that is a drummer
 * shutting the pedal, and it is most of what makes an open hat sound open.
 */
function oneHatAtATime(events: DrumEvent[]): DrumEvent[] {
  const open = new Set(events.filter((e) => e.voice === 'oh').map((e) => Math.round(e.beat * 960)));
  if (!open.size) return events;
  return events.filter((e) => e.voice !== 'hh' || !open.has(Math.round(e.beat * 960)));
}

function applySwingDrums(events: DrumEvent[], swing: SwingPlan): DrumEvent[] {
  if (typeof swing === 'number' && swing <= 0) return events;
  const swingAt = typeof swing === 'number' ? () => swing : swing;
  return events.map((e) => {
    const s = swingAt(e.beat);
    if (s <= 0) return e;
    const frac = e.beat - Math.floor(e.beat);
    if (Math.abs(frac - 0.5) < 1e-6) return { ...e, beat: e.beat + s * 0.5 };
    return e;
  });
}
