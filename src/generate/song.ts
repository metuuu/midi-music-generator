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
 *  - a **solo section**, where the lead instrument rests and the counter
 *    instrument takes the tune (an accordion break in iskelmä, a blowing
 *    chorus in jazz; ambient has no such thing and its forms contain none),
 *  - and a **key change** for the final chorus, which is an iskelmä cliché,
 *    deliberately rare in jazz, and set to zero throughout ambient — each
 *    genre's eras set their own probability.
 */

import { parseRoman, type Chord } from '../core/chord.js';
import { keyLabel, type Pc } from '../core/pitch.js';
import { Rng } from '../core/rng.js';
import type { Mode } from '../core/scale.js';
import {
  DEFAULT_DRUM_MIX, DEFAULT_SPACE,
  type DrumEvent, type DrumTrack, type Effects, type LayerId, type NoteEvent,
  type Section, type SectionKind, type Song, type Space, type Track,
} from '../core/types.js';
import { GENRES, getGenre, type FormStep, type Genre } from '../genre/index.js';
import { IDIOMS, INSTRUMENTS, type Instrument, type InstrumentId } from '../style/instruments.js';
import type { EraProfile, Mood, Progression, Style } from '../style/types.js';
import { planRegisters, resolveCollisions } from './arrange.js';
import { buildAccompaniment, getStrictness, resolveRules, type StrictnessId } from './constraints.js';
import { applyDynamics, sectionIntensity, swell } from './dynamics.js';
import { getHook, RECALL_BIAS, type HookId } from './hook.js';
import { generateMelody } from './melody.js';
import { chooseMotto } from './motto.js';
import { trimOverlaps } from './rhythm.js';
import { generateVocalTrack } from './vocals.js';
import {
  generateBass, generateBrass, generateComp, generateCounter, generateDrums, generatePad,
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
   * Defaults to 'standard'. See `generate/constraints.ts`.
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

  const genre = getGenre(opts.genre ?? rng.pick(Object.keys(GENRES)));
  const era = lookup(genre.eras, opts.era, 'era', rng);
  const mood = lookup(genre.moods, opts.mood, 'mood', rng, Object.keys(genre.moods).slice(-1)[0]);
  const style = opts.style
    ? lookup(genre.styles, opts.style, 'style', rng)
    : genre.styles[chooseStyle(rng, genre, era, mood)]!;
  const mode = opts.mode ?? chooseMode(rng, style, mood);
  const tonic = opts.tonic ?? rng.weighted(mode === 'minor' ? genre.keys.minor : genre.keys.major);
  const bpm = opts.bpm ?? chooseTempo(rng, style, mood, era);
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
  const instruments = chooseInstruments(rng, era);

  // ---- Form ------------------------------------------------------------
  const steps = buildForm(
    rng, genre, style, bpm,
    opts.targetSeconds ?? rng.float(genre.duration[0], genre.duration[1]),
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

  // ---- Parts -----------------------------------------------------------
  const byLayer = new Map<LayerId, NoteEvent[]>();
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
  const hookRng = new Rng(`${seed}:hook`);
  const seenKinds = new Map<SectionKind, number>();

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
    const ctx: PartContext = {
      chords: chords.map((c) => transposeChord(c, localTonic)),
      beatsPerBar: style.beatsPerBar,
      startBeat: section.startBar * style.beatsPerBar,
      rng: new Rng(`${seed}:band:${s}`),
      style,
    };

    const active = new Set(section.activeLayers);
    /**
     * How hard the band plays this section. Replaces a three-way guess that
     * only the drums ever saw — see `generate/dynamics.ts`.
     */
    const ordinal = seenKinds.get(section.kind) ?? 0;
    seenKinds.set(section.kind, ordinal + 1);
    const intensity = sectionIntensity({
      kind: section.kind, index: s, total: sections.length, ordinal,
    });

    if (active.has('drums')) {
      drumEvents.push(...generateDrums(ctx, drumPattern, {
        fillAtEnd: section.kind !== 'outro' && style.drumFills !== false,
        intensity,
      }));
    }

    // In a solo section the "voice" rests and the counter instrument takes the
    // tune — which is exactly how these arrangements work.
    const isSolo = section.kind === 'solo';
    const leadLayer: LayerId = isSolo ? 'counter' : 'melody';
    const leadInstrument = isSolo ? instruments.counter : instruments.melody;

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
      leadPresent: active.has('melody'),
      clarity,
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
    const sectionBass = active.has('bass') ? generateBass(ctx, bassPattern) : [];
    const sectionComp = active.has('comp')
      ? generateComp(
        ctx, compPattern, instruments.comp.centre,
        (c) => genre.scaleForChord(localTonic, mode, c),
        limitFor('comp'),
      )
      : [];
    const sectionPad = active.has('pad')
      ? generatePad(ctx, instruments.pad.centre, 4, limitFor('pad'))
      : [];
    const sectionBrass = active.has('brass')
      ? generateBrass(ctx, instruments.brass.centre, limitFor('brass'))
      : [];

    const accompaniment = buildAccompaniment([sectionBass, sectionComp, sectionPad]);
    let sectionMelody: NoteEvent[] = [];

    if (active.has('melody')) {
      const range: [number, number] = plan.lead;
      const melody = replayTune && prior?.melody
        ? replay(prior.melody, prior.tonic, localTonic, ctx.startBeat, range)
        : generateMelody({
          chords: ctx.chords,
          beatsPerBar: style.beatsPerBar,
          style,
          rng: new Rng(`${seed}:melody:${s}`),
          tonic: localTonic,
          mode,
          range,
          startBeat: ctx.startBeat,
          ornamentScale: mood.ornament,
          leapScale: mood.leap,
          soloistic: isSolo,
          strictness: strictness.level,
          hook,
          motto,
          accompaniment,
          scaleForChord: genre.scaleForChord,
          rules,
          // The instrument actually playing this line — the counter instrument
          // takes over in solo sections. Its idiom decides whether the line
          // breaks chords, runs up scales, or stops to breathe; its agility
          // decides how far it can reach.
          agility: leadInstrument.agility,
          idiom: IDIOMS[leadInstrument.idiom],
        });
      applyDynamics(melody, leadLayer, intensity);
      push(byLayer, leadLayer, melody);
      sectionMelody = melody;

      // Solos are never remembered, so this only ever stores an actual tune.
      if (memory && !memory.melody && !isSolo) {
        memory.melody = melody.map((n) => ({ ...n, beat: n.beat - ctx.startBeat }));
      }

      if (!isSolo && active.has('counter')) {
        const counterCtx: PartContext = { ...ctx, rng: new Rng(`${seed}:counter:${s}`) };
        const answer = generateCounter(counterCtx, melody, instruments.counter.centre, {
          range: plan.counter,
          idiom: IDIOMS[instruments.counter.idiom],
          scaleFor: (c) => genre.scaleForChord(localTonic, mode, c),
        });
        applyDynamics(answer, 'counter', intensity);
        push(byLayer, 'counter', answer);
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
     * Scale the whole section at once. Doing it here rather than inside each
     * part generator is what keeps the parts ignorant of the form: a comp
     * pattern should not have to know whether it is in a bridge.
     */
    const sectionBeats = section.lengthBars * style.beatsPerBar;
    applyDynamics(sectionBass, 'bass', intensity);
    applyDynamics(sectionComp, 'comp', intensity);
    applyDynamics(sectionPad, 'pad', intensity);
    applyDynamics(sectionBrass, 'brass', intensity);
    // Sustained parts get a swell on top, because a held chord at one fixed
    // level is the sound of a patch rather than of a player.
    swell(sectionPad, ctx.startBeat, sectionBeats, 0.35);
    swell(sectionComp, ctx.startBeat, sectionBeats, 0.12);

    push(byLayer, 'bass', sectionBass);
    push(byLayer, 'comp', sectionComp);
    push(byLayer, 'pad', sectionPad);
    push(byLayer, 'brass', sectionBrass);
  }

  // ---- Assemble --------------------------------------------------------
  const layerInstruments: Record<PlayedLayer, Instrument> = {
    bass: instruments.bass,
    comp: instruments.comp,
    pad: instruments.pad,
    melody: instruments.melody,
    counter: instruments.counter,
    brass: instruments.brass,
  };

  /**
   * The default balance is a dance-band balance: the tune on top, the pad a
   * long way behind it. A genre may say otherwise, and ambient does — there the
   * pad is the piece and the melody is the decoration, which is the same three
   * layers in the opposite order.
   */
  const gains: Record<PlayedLayer, number> = {
    bass: 0.9, comp: 0.62, pad: 0.45, melody: 0.85, counter: 0.55, brass: 0.6,
    ...genre.mix,
  };

  /**
   * Effects are resolved era-over-genre, per layer. The genre states what is
   * true of the music whatever decade it claims to be from — ambient's bass is
   * dry and its pad is drenched in 1974 and in 2004 alike — and the era says
   * how wet and how dark that decade's records actually were.
   */
  const effectsFor = (layer: LayerId): Effects | undefined => {
    const merged = { ...genre.effects?.[layer], ...era.effects?.[layer] };
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

  const tracks: Track[] = [];
  for (const [layer, instrument] of Object.entries(layerInstruments) as [PlayedLayer, Instrument][]) {
    const notes = byLayer.get(layer) ?? [];
    if (!notes.length) continue;
    notes.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
    const effects = effectsFor(layer);
    tracks.push({
      layer,
      instrument: instrument.name,
      gmProgram: instrument.gm,
      strudelSound: instrument.strudel,
      // Melodic layers were swung above, before their overlap trim.
      notes: layer === 'melody' || layer === 'counter' ? notes : applySwing(notes, style.swing),
      gain: gains[layer],
      ...(effects ? { effects } : {}),
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
    events: applySwingDrums(drumEvents, style.swing),
    // The kit is a layer like any other, so a genre that wants it barely
    // present says so in `mix` rather than by writing quieter patterns.
    gain: genre.mix?.drums ?? 0.8,
    voiceGains: { ...DEFAULT_DRUM_MIX, ...genre.drumMix },
    ...(drumEffects ? { effects: drumEffects } : {}),
  };

  return {
    meta: {
      seed,
      title: genre.title(rng),
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
      totalBars,
      swing: style.swing,
    },
    sections,
    tracks,
    drums,
    space,
  };
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
function lookup<T>(table: Record<string, T>, id: string | undefined, what: string, rng: Rng, fallback?: string): T {
  if (id) {
    const found = table[id];
    if (!found) throw new Error(`Unknown ${what} "${id}". Known: ${Object.keys(table).join(', ')}`);
    return found;
  }
  const key = fallback ?? rng.pick(Object.keys(table));
  return table[key]!;
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
function chooseInstruments(rng: Rng, era: EraProfile) {
  const taken = new Set<string>();
  const pick = (list: (readonly [InstrumentId, number])[]): Instrument => {
    const free = list.filter(([id]) => !taken.has(INSTRUMENTS[id].name));
    const instrument = INSTRUMENTS[rng.weighted(free.length ? free : list)];
    taken.add(instrument.name);
    return instrument;
  };
  const melody = pick(era.palette.melody);
  const bass = pick(era.palette.bass);
  const comp = pick(era.palette.comp);
  const pad = pick(era.palette.pad);
  const counter = pick(era.palette.counter);
  const brass = pick(era.palette.brass);
  return { melody, counter, comp, pad, bass, brass };
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

function applySwingDrums(events: DrumEvent[], swing: number): DrumEvent[] {
  if (swing <= 0) return events;
  return events.map((e) => {
    const frac = e.beat - Math.floor(e.beat);
    if (Math.abs(frac - 0.5) < 1e-6) return { ...e, beat: e.beat + swing * 0.5 };
    return e;
  });
}
