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
import type { Mode } from '../core/scale.js';
import {
  DEFAULT_DRUM_MIX, DEFAULT_SPACE, SEQUENCER_FROM, canVary, eligibleDrumSources,
  isPlayedByHand,
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
import { planRegisters, resolveCollisions } from './arrange.js';
import { buildAccompaniment, getStrictness, resolveRules, type StrictnessId } from '../core/rules.js';
import { applyDynamics, sectionIntensity, swell } from './dynamics.js';
import { applyFilter } from './filter.js';
import { DEFAULT_FILLS } from './fills.js';
import { getHook, RECALL_BIAS, type HookId } from './hook.js';
import { composeSectionTune } from '../tune/adapt.js';
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
  generateLeftHand, generatePad,
  type PartContext,
} from './parts.js';

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
   * Add a wordless sung line doubling the melody. Off by default — the station
   * is instrumental.
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
  const liftAt = rng.chance(era.keyChangeChance) ? lastChorusIndex(steps) : -1;
  const lift = liftAt >= 0 ? rng.weighted([[1, 3], [2, 2]] as const) : 0;

  const sections: Section[] = [];
  let bar = 0;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    const transpose = liftAt >= 0 && i >= liftAt ? lift : 0;
    sections.push({
      kind: step.kind,
      startBar: bar,
      lengthBars: step.bars,
      transpose,
      mode,
      activeLayers: layersFor(step.kind, style, density, mood, rng),
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

  // ---- Parts -----------------------------------------------------------
  const byLayer = new Map<LayerId, NoteEvent[]>();
  /**
   * The lead keyboard's left hand, held aside rather than pushed into its layer.
   *
   * It belongs in the melody track and ends up there — see the merge after the
   * section loop — but it cannot go in yet, because the melody layer is put
   * through `trimOverlaps` on the way out and that function's whole premise is
   * that the line it is clipping is *monophonic*. Handed a left-hand chord
   * sounding under a right-hand note it would read the two as one voice running
   * into the next and delete the chord, which is precisely the part being added.
   * Empty for every style whose lead is a horn or a voice.
   */
  const leftHand: NoteEvent[] = [];
  /**
   * The anatomy of the hand doing it, and what it does with the section.
   *
   * `hands` is absent where the style is not two-handed, and — deliberately —
   * also where it names a lead the catalogue has no `HandSpec` for. That
   * combination is a table error rather than a runtime one, so `npm run genres`
   * asserts against it; here it simply means no second hand, which is the safe
   * reading.
   */
  const hands = instruments.hands;
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

  for (let s = 0; s < sections.length; s++) {
    const section = sections[s]!;
    const localTonic = ((tonic + section.transpose) % 12 + 12) % 12;

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
      if (solo.feel === 'comping' || solo.feel === 'sparse') layers.delete('pad');
      if (solo.feel === 'sparse') layers.delete('comp');
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
      const pattern = generateDrums(ctxFor('drums'), drumPattern, {
        fillAtEnd: !machine && section.kind !== 'outro'
          && style.drumFills !== false && !lastBarIsSolo,
        intensity,
        arrival,
        machine,
        palette: style.fills ?? genre.fills ?? DEFAULT_FILLS,
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
      drumEvents.push(...(solo && !machine ? drumsBehindSolo(behind, solo.feel) : behind));

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
    const leadLayer: LayerId = soloLayer ?? 'melody';
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

    // Keep this section's accompaniment to hand: the melody is written last, so
    // it can be checked against what the band is actually holding underneath.
    // A soloist's own layer is skipped here — a bass taking a chorus is not
    // also walking behind it, and a pianist soloing is not also comping.
    let sectionBass = active.has('bass') && soloLayer !== 'bass'
      ? generateBass(ctxFor('bass'), bassPattern) : [];
    let sectionComp = active.has('comp') && soloLayer !== 'comp'
      ? generateComp(
        ctxFor('comp'), compPattern, instruments.comp.centre,
        (c) => genre.scaleForChord(localTonic, mode, c),
        limitFor('comp'),
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
      if (solo.feel === 'comping') sectionComp = compBehindSolo(sectionComp, backRng);
      if (solo.drumBars.length) {
        const hush = (notes: NoteEvent[]) => notes.filter((n) => !inSpans(n.beat, solo.drumBars));
        sectionBass = hush(sectionBass);
        sectionComp = hush(sectionComp);
        sectionPad = hush(sectionPad);
      }
    }

    const accompaniment = buildAccompaniment([sectionBass, sectionComp, sectionPad]);
    let sectionMelody: NoteEvent[] = [];

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
        scaleForChord: genre.scaleForChord,
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
    } else if (active.has('melody')) {
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
          scaleForChord: genre.scaleForChord,
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
        });
      const melody = written
        ? written.notes
        : replay(prior!.melody!, prior!.tonic, localTonic, ctxBase.startBeat, range);
      // Only freshly written material joins the comparison set. A recalled chorus
      // resembling the chorus it recalls is the point of recalling it.
      if (written) stated.push(written.audition.signature);
      applyDynamics(melody, leadLayer, intensity, genre.layerPlan?.response);
      push(byLayer, leadLayer, filtered(melody, leadLayer));
      sectionMelody = melody;

      // Solos are never remembered, so this only ever stores an actual tune.
      if (memory && !memory.melody && !isSolo) {
        memory.melody = melody.map((n) => ({ ...n, beat: n.beat - ctxBase.startBeat }));
      }

      if (!isSolo && active.has('counter')) {
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
        const answer = counterPattern
          ? generateComp(
            counterCtx, counterPattern, instruments.counter.centre,
            (c) => genre.scaleForChord(localTonic, mode, c),
            limitFor('counter'),
          )
          : generateCounter(counterCtx, melody, instruments.counter.centre, {
            range: plan.counter,
            idiom: IDIOMS[instruments.counter.idiom],
            scaleFor: (c) => genre.scaleForChord(localTonic, mode, c),
          });
        applyDynamics(answer, 'counter', intensity, genre.layerPlan?.response);
        push(byLayer, 'counter', filtered(answer, 'counter'));
      }
    }

    /**
     * The other hand, where the style says the lead has one.
     *
     * Written last of everything on this layer and against the finished line,
     * because that is the order the playing happens in: the left hand answers
     * what the right hand did, so it cannot be written until the right hand has
     * done it. It goes in for the head and for the pianist's own chorus alike —
     * a trio pianist comps for themselves in both, and the difference between a
     * stated melody and an improvised one is the right hand's business.
     *
     * `leadLayer === 'melody'` is doing real work rather than restating the
     * type. A bass solo also fills `sectionMelody`, and a piano left hand under
     * a bass chorus would be both the wrong instrument and — since the piano is
     * not sounding in that section at all — a track playing by itself.
     */
    if (style.twoHanded && hands && leadLayer === 'melody' && sectionMelody.length) {
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
        mode: chooseLeftHandMode(new Rng(`${seed}:hand:${s}`), style.twoHanded, hands),
        spec: hands,
        density: style.twoHanded.density,
        scaleFor: (c) => genre.scaleForChord(localTonic, mode, c),
        clarity,
        ...(style.twoHanded.ostinato ? { ostinato: style.twoHanded.ostinato } : {}),
      });
      applyDynamics(left, 'comp', intensity, genre.layerPlan?.response);
      leftHand.push(...left);
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

    if (active.has('brass')) {
      sectionBrass = generateBrass(ctxFor('brass'), instruments.brass.centre, limitFor('brass'), {
        melody: sectionMelody,
        intensity,
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

    push(byLayer, 'bass', filtered(sectionBass, 'bass'));
    push(byLayer, 'comp', filtered(sectionComp, 'comp'));
    push(byLayer, 'pad', filtered(sectionPad, 'pad'));
    push(byLayer, 'brass', filtered(sectionBrass, 'brass'));
  }

  // ---- Assemble --------------------------------------------------------
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
  const gains: Record<PlayedLayer, number> = {
    // was 0.9 — bass fonts run 1.44× quiet
    bass: 0.63,
    // was 0.62 — comp fonts 1.21× quiet
    comp: 0.51,
    // was 0.45 — pad fonts sit on the median already
    pad: 0.44,
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
      applySwing(notes.filter((n) => n.beat >= 0), style.swing),
    ));
  }

  /**
   * And now the left hand, into the melody layer it belongs to.
   *
   * After the trim rather than before it, for the reason `leftHand` is declared
   * separately at all: this is the point at which the melody track stops being
   * one voice, and everything above assumes it is one. Swung on its own — the
   * stabs land on eighths and a left hand swings with the band — and merged by
   * beat so the track stays sorted, which `render/strudel.ts` and the
   * choreographer both read it as being.
   */
  if (leftHand.length) {
    const line = byLayer.get('melody') ?? [];
    byLayer.set('melody', [...line, ...applySwing(leftHand.filter((n) => n.beat >= 0), style.swing)]
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
    tracks.push({
      layer,
      instrument: instrument.name,
      gmProgram: instrument.gm,
      strudelSound: instrument.strudel,
      // Melodic layers were swung above, before their overlap trim.
      notes: layer === 'melody' || layer === 'counter' ? notes : applySwing(notes, style.swing),
      gain,
      envelope: envelopeFor(instrument),
      ...(effects ? { effects } : {}),
      // Said out loud, because from here on nothing can tell by looking: a
      // pianist's two hands and a four-part comp are both just simultaneous
      // notes. See `melodicLine`, which is what the declaration is for.
      ...(layer === 'melody' && hands && leftHand.length
        ? { twoHanded: { gap: hands.gap } }
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
      const vocal = generateVocalTrack(melodyTrack.notes, genre.vocals, new Rng(`${seed}:vocal`));
      if (vocal) tracks.push(vocal);
    }
  }

  drumEvents.sort((a, b) => a.beat - b.beat);
  const drumEffects = effectsFor('drums');
  const drums: DrumTrack = {
    bank: drumBank,
    source: drumSource,
    events: applySwingDrums(oneHatAtATime(drumEvents), style.swing),
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
    },
    sections,
    tracks,
    drums,
    space,
  };

  landEnding(song, genre.ending, finalChord);
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
  const pick = (list: (readonly [InstrumentId, number])[]): Instrument => {
    const free = list.filter(([id]) => !taken.has(INSTRUMENTS[id].name));
    const instrument = INSTRUMENTS[rng.weighted(free.length ? free : list)];
    taken.add(instrument.name);
    return instrument;
  };
  const drawn = pick(era.palette.melody);
  /**
   * The two-handed lead is drawn here, before the rest of the band, so that it
   * can be *taken*.
   *
   * Drawing it last was the obvious order and produced a vibraphone trio whose
   * counter-melody was also on vibraphone — one instrument cast twice, which the
   * `taken` set exists to prevent and could not, because by the time the lead
   * was known the other five had already been picked around a lead that turned
   * out not to be playing. Order matters here and nowhere else in the function.
   */
  const lead = style.twoHanded ? rng.weighted(style.twoHanded.instruments) : undefined;
  if (lead) taken.add(INSTRUMENTS[lead].name);
  const bass = pick(era.palette.bass);
  const comp = pick(era.palette.comp);
  const pad = pick(era.palette.pad);
  const counter = pick(era.palette.counter);
  const brass = pick(era.palette.brass);

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
  if (!lead) return { melody: drawn, counter, comp, pad, bass, brass, hands: undefined };
  const hands = HANDS[lead];
  return {
    melody: { ...INSTRUMENTS[lead], ...(hands ? { centre: hands.lead } : {}) },
    counter, comp, pad, bass, brass, hands,
  };
}

/**
 * What the left hand does in this section.
 *
 * Two things get filtered out before the draw rather than after, because a mode
 * that was chosen and then silently produced nothing would look — in the audit,
 * in the report, on the stage — exactly like a style whose left hand is meant to
 * be sparse:
 *
 *  - **`unison` needs a hand that can play a line.** An accordion's cannot; the
 *    button side sounds fixed chords. See `HandSpec.melodic`.
 *  - **`ostinato` needs a figure.** A style that offers the mode without writing
 *    one has a table error, which `npm run genres` reports; dropping it here is
 *    what keeps the song generating in the meantime.
 *
 * Filtering before the draw also keeps the weights meaning what they say. A
 * table asking for equal parts unison and answer on an accordion gets all
 * answer, not half a part missing.
 */
function chooseLeftHandMode(rng: Rng, keys: TwoHandedKeys, spec: HandSpec): LeftHandMode {
  const offered = keys.modes ?? [['answer', 1] as const];
  const eligible = offered.filter(([mode]) =>
    (mode !== 'unison' || spec.melodic) && (mode !== 'ostinato' || keys.ostinato));
  return eligible.length ? rng.weighted(eligible) : 'answer';
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

function lastChorusIndex(steps: FormStep[]): number {
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i]!.kind === 'chorus') return i;
  }
  return -1;
}

function layersFor(kind: SectionKind, style: Style, density: number, mood: Mood, rng: Rng): LayerId[] {
  const base: Record<SectionKind, LayerId[]> = {
    intro: ['drums', 'bass', 'comp'],
    verse: ['drums', 'bass', 'comp', 'melody'],
    chorus: ['drums', 'bass', 'comp', 'pad', 'melody'],
    bridge: ['drums', 'bass', 'comp', 'pad'],
    solo: ['drums', 'bass', 'comp', 'pad', 'melody'],
    outro: ['drums', 'bass', 'comp', 'pad'],
  };
  const layers = new Set(base[kind]);

  const add = (layer: LayerId, p: number) => { if (rng.chance(p)) layers.add(layer); };

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
 * Swing: delay the second eighth of each beat. Applied in the IR so both
 * renderers inherit it identically.
 */
function applySwing(notes: NoteEvent[], swing: number): NoteEvent[] {
  if (swing <= 0) return notes;
  return notes.map((n) => {
    const frac = n.beat - Math.floor(n.beat);
    if (Math.abs(frac - 0.5) < 1e-6) {
      return { ...n, beat: n.beat + swing * 0.5, duration: Math.max(0.05, n.duration - swing * 0.5) };
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

function applySwingDrums(events: DrumEvent[], swing: number): DrumEvent[] {
  if (swing <= 0) return events;
  return events.map((e) => {
    const frac = e.beat - Math.floor(e.beat);
    if (Math.abs(frac - 0.5) < 1e-6) return { ...e, beat: e.beat + swing * 0.5 };
    return e;
  });
}
