/**
 * The door onto the style tables — the one file inside `src/tune/` allowed to see
 * `style/` and `genre/`, and written last on purpose.
 *
 * The engine was built with no access to the old vocabulary so that it could not
 * inherit the old assumptions, which live in types rather than in opinions: import
 * `RhythmCell` and rhythm is bar-shaped again, import `HookLevel` and repetition is
 * nine scalars instead of a derivation. Now that the model exists, reading those
 * tables is safe — the translation runs one way.
 *
 * Two translations, and the first is the interesting one.
 *
 * **A style's melody cells become its accent table.** The cells are where that
 * style puts its notes, stated as durations that must fill a bar. Read as a
 * histogram of onset positions they are exactly the thing a `Voice` needs and
 * cannot otherwise get: a tango's cells put notes on the eighth after a dotted
 * quarter, a jenkka's on the sixteenth after a dotted eighth, and both facts
 * survive the translation even though the bar-filling contract does not. The same
 * histogram gives density, for free and honestly, as the weighted mean number of
 * onsets per bar.
 *
 * **`melody.sequence` is finally read.** It was authored in every style in the
 * project and consumed by nothing, because there was no code that developed a
 * motif. Here it is the appetite for `sequence` and `transpose`, which is what it
 * always said it was.
 */

import { SLOTS_PER_BEAT } from '../core/grid.js';
import type { Chord } from '../core/chord.js';
import type { Midi, Pc } from '../core/pitch.js';
import type { Mode, Scale } from '../core/scale.js';
import type { Accompaniment, Rule } from '../core/rules.js';
import type { NoteEvent, SectionKind } from '../core/types.js';
import type { Feel } from '../style/feel.js';
import type { IdiomProfile } from '../style/instruments.js';
import type { Style, WeightedCell } from '../style/types.js';
import type { HookLevel } from '../generate/hook.js';
import { Rng } from '../core/rng.js';
import type { Signature } from './judge.js';
import { applyOps, motifFamily } from './motif.js';
import { auditionTune, type Audition } from './tune.js';
import type { ArchetypeId, Motif, Op, Voice } from './types.js';
import { ARCHETYPES, SUBSETS, archetypeWeights, getVoice, hasVoice, sectionShape } from './voice.js';

/**
 * How many tunes to write per section before choosing one.
 *
 * Twenty-four rather than the two hundred the audition can obviously afford,
 * because this runs inside a generator that writes forty songs in a batch and eight
 * hundred in a report. The measured gain flattens well before this — the terms that
 * separate a good tune from a poor one are mostly satisfied or not by the *plan*,
 * and a plan is drawn in full before a note is placed.
 */
const ATTEMPTS = 24;

/**
 * Keyed on the `Style` **object**, and it holds the **derived** voice only —
 * never a voice with a genre or style delta folded into it.
 *
 * The second half is the whole reason the derivation is a separate function
 * below. A cache of finished voices would bake whichever genre asked first into
 * an object every later caller reads, and the tier would silently stop working.
 *
 * ## The first half was a live bug, and the key is the fix rather than a repair
 *
 * This was keyed on `style.id`, and **a style id is not unique**: 365 distinct
 * ids over 389 styles, 19 of them shared by two or more genres — `ballad` by
 * six (jazz, funk, rock, country, pop, rnb), `minimal` by three, `deep`,
 * `bleep`, `garage`, `chicago`, `girlgroup` and thirteen more by two. Every one
 * of those pairs derives a genuinely different voice, so in any process that
 * touches more than one genre — which is every batch, every report and every
 * check in this project — whichever style derived first handed its voice to all
 * the others wearing its name. `house/bleep` declares a span of 24 semitones and
 * a leap appetite of 0.6, the widest in the catalogue, and was playing
 * `dnb/bleep`'s 16 and 0.42; `house/minimal` asks for a syncopation of 0.15 and
 * was given `hiphop/minimal`'s 0.55.
 *
 * **A `WeakMap` on the object makes the collision unsayable rather than
 * handled.** The alternative — a composite string key of id and tables — fixes
 * the same 43 styles and leaves the shape that caused it in place, so the next
 * field added to `Style` is a chance to forget it. Style objects are
 * module-level singletons in each genre's `styles.ts`, so identity is stable; a
 * caller that builds a `Style` on the fly simply misses the cache and derives
 * again, which costs a few microseconds and cannot be wrong.
 *
 * Renaming the colliding styles was the other candidate and is worse: the ids
 * are what `--style` takes, what the manifests carry and what every seed in
 * every report is written against, and `pop/ballad` and `rnb/ballad` are both
 * correctly named. The id was never meant to be a global key; the cache was
 * wrong to use it as one.
 */
const CACHE = new WeakMap<Style, Voice>();

/**
 * The voice for a style: authored where one exists, declared where a genre or a
 * style has an opinion, derived for the rest.
 *
 * Deriving is not a placeholder that sounds like nothing. It reads the style's own
 * numbers and its own cells, so an unauthored jenkka is snappier than an unauthored
 * valssi for the same reason the old engine's were — the tables say so. What it
 * cannot do is have an *opinion*, which is what the authored three have and the
 * other seventeen are owed. See `docs/tune-plan.md` §13 and `docs/voices-plan.md`
 * §3.2.
 *
 * The base is authored where one exists and derived otherwise, and then two
 * declarations are applied over it in order of how specific they are:
 *
 * 1. **`Genre.voice` is refused over an authored base.** `tango`, `iskelmapop`
 *    and `berlin` are whole statements about one style, and a genre default
 *    reaching into one would be overruling the more specific claim with the less.
 * 2. **`Style.voice` is honoured over either base**, and that asymmetry is the
 *    point rather than an oversight. A style delta *is* the more specific claim,
 *    so the argument that protects an authored voice from its genre is the same
 *    argument that hands it to its own style. Refusing it here was the first
 *    version and it failed silently, which is the worst way to fail: `Style.voice`
 *    is the wave-2 mechanism in `docs/voices-plan.md` §3.4, so the first author to
 *    give `tango` a delta would have got no note change, no type error and no
 *    complaint.
 * 3. **`ops` and `archetypes` merge by key** instead of replacing. Both are
 *    tables over a closed vocabulary, and a genre that wants chants twice as
 *    likely is saying one thing about one entry, not silently ruling out the
 *    five it did not name. Replacement would make the shortest useful
 *    declaration the most destructive one. `subsets` does replace, because a
 *    subset list is one whole statement about colour rather than a table of
 *    independent entries.
 *
 * Where neither declaration exists the base is returned **by identity**, so a
 * catalogue that has not opted in cannot move a note.
 */
export function voiceForStyle(style: Style, genreVoice?: Partial<Voice>): Voice {
  /**
   * …and tier 1 reads `style.id`, which is not unique — see `CACHE` above.
   *
   * Latent rather than live: none of `tango`, `iskelmapop` or `berlin` is among
   * the 19 ids two genres share. It is worth naming because the failure would be
   * worse than the one the `WeakMap` just fixed rather than the same size — a
   * future `latin/tango` would take iskelmä's *authored* voice **and**, by rule 1
   * above, bypass latin's genre voice on the way. The registry is keyed by id
   * because an authored voice is written against a style by name; the guard is
   * that the three names in it stay unique, and nothing enforces that yet.
   */
  const authored = hasVoice(style.id) ? getVoice(style.id) : undefined;
  const base = authored ?? derivedVoice(style);
  const over = authored ? undefined : genreVoice;
  const delta = style.voice;
  if (!over && !delta) return base;
  return {
    ...base,
    ...over,
    ...delta,
    // The style's own name, not a genre's. `Partial<Voice>` cannot forbid `id`,
    // and a genre delta that set one would rename every style in the genre at
    // once. Nothing on this path reads `Voice.id` today — the two readers are
    // `registerVoice` and `tune-lab`, both of which take an authored voice
    // straight from the registry — so this is a guard against a field that can
    // be set rather than against a consumer that exists.
    id: base.id,
    archetypes: mergeArchetypes(base.archetypes, over?.archetypes, delta?.archetypes),
    ops: { ...base.ops, ...over?.ops, ...delta?.ops },
  };
}

/**
 * A partial archetype table applied over a full one: named ids take the declared
 * weight, unnamed ids keep the derived one.
 *
 * **In the base table's order, and the order is load-bearing.** `Rng.weighted`
 * walks the array subtracting as it goes, so where two entries sit decides which
 * one a given draw lands on even when the weights are identical. Rebuilding in
 * the declaration's order would make the order a genre happened to type its
 * overrides in a hidden weight, and would move every style in that genre for a
 * reason nobody wrote down.
 */
function mergeArchetypes(
  base: readonly (readonly [ArchetypeId, number])[],
  ...deltas: (readonly (readonly [ArchetypeId, number])[] | undefined)[]
): readonly (readonly [ArchetypeId, number])[] {
  const named = new Map<ArchetypeId, number>();
  for (const d of deltas) for (const [id, w] of d ?? []) named.set(id, w);
  if (named.size === 0) return base;
  const merged = base.map(([id, w]) => [id, named.get(id) ?? w] as const);
  // Every archetype is already in the derived table, so this appends nothing
  // today. It is here so that adding a seventh `ArchetypeId` cannot silently
  // drop a genre's weight for it while the derivation is being taught the new one.
  const seen = new Set(base.map(([id]) => id));
  return [...merged, ...[...named].filter(([id]) => !seen.has(id))];
}

function derivedVoice(style: Style): Voice {
  const cached = CACHE.get(style);
  if (cached) return cached;

  const slotsPerBar = Math.round(style.beatsPerBar * SLOTS_PER_BEAT);
  const m = style.melody;
  const derived: Voice = {
    id: style.id,
    archetypes: archetypesFor(style, cellDensity(style.melodyCells, slotsPerBar)),
    subsets: SUBSETS,
    density: cellDensity(style.melodyCells, slotsPerBar),
    leap: m.leap,
    ornament: m.ornament,
    compass: m.span,
    syncopation: m.syncopation ?? 0.3,
    accents: cellAccents(style.melodyCells, slotsPerBar),
    // A style whose lead plays two notes a bar wants a longer canvas: four bars of
    // half notes is a phrase, and two bars of them is a fragment.
    ...(cellDensity(style.melodyCells, slotsPerBar) < 1.7 ? { canvasBars: 4 } : {}),
    ops: {
      sequence: 0.5 + m.sequence * 2,
      transpose: 0.7 + m.sequence * 1.2,
      ornament: 0.4 + m.ornament * 3,
      diminish: 0.3 + (m.syncopation ?? 0.3),
      displace: 0.3 + (m.syncopation ?? 0.3) * 1.5,
      expand: 0.6 + m.leap * 2,
    },
  };
  CACHE.set(style, derived);
  return derived;
}

/** Weighted mean onsets per bar across the style's own cells. */
function cellDensity(cells: readonly WeightedCell[], slotsPerBar: number): number {
  let weight = 0;
  let onsets = 0;
  for (const c of cells) {
    const n = c.cell.filter((d) => d > 0).length;
    const bars = Math.max(1, c.cell.reduce((a, b) => a + Math.abs(b), 0) / slotsPerBar);
    weight += c.weight;
    onsets += c.weight * (n / bars);
  }
  return weight > 0 ? onsets / weight : 3;
}

/**
 * The cells read as a histogram of where notes land.
 *
 * A negative entry in a cell is a rest, so it advances the position without
 * contributing an onset — which is what makes the table say *where notes are* rather
 * than *where events are*. The downbeat is pinned at 1 regardless of what the cells
 * happen to contain, because it is the one position no style is ambivalent about.
 */
function cellAccents(cells: readonly WeightedCell[], slotsPerBar: number): number[] {
  const hits = new Array<number>(slotsPerBar).fill(0);
  let peak = 0;
  for (const c of cells) {
    let at = 0;
    for (const entry of c.cell) {
      if (entry > 0 && at >= 0) {
        const slot = at % slotsPerBar;
        hits[slot] = (hits[slot] ?? 0) + c.weight;
        peak = Math.max(peak, hits[slot]!);
      }
      at += Math.abs(entry);
    }
  }
  if (peak <= 0) return hits.map((_, i) => (i === 0 ? 1 : 0.3));
  // A floor, because a position no cell happens to use is unusual rather than
  // forbidden, and a template of hard zeroes makes a figure unable to pass through
  // one on its way somewhere.
  return hits.map((h, i) => (i === 0 ? 1 : Math.max(0.08, h / peak)));
}

/**
 * Which kinds of tune a style reaches for, from what its numbers say.
 *
 * Four readings, each of which is a sentence the tables are already making. A style
 * that sequences is a style that walks figures down the scale. A style that leaps is
 * a singer's style. A style with two notes a bar is holding them. A style with a
 * busy, unornamented lead is riffing.
 */
function archetypesFor(style: Style, density: number): readonly (readonly [ArchetypeId, number])[] {
  const m = style.melody;
  const weights: Record<ArchetypeId, number> = {
    'arch-hook': 3,
    'descending-sequence': 1 + m.sequence * 3,
    'riff-response': 0.6 + Math.max(0, density - 2.6) * 1.2 + (0.2 - Math.min(0.2, m.ornament)) * 4,
    'long-note': 0.4 + Math.max(0, 3 - density) * 1.4,
    chant: 0.5 + Math.max(0, density - 2.2) * 0.6,
    'wide-interval': 0.5 + m.leap * 5,
  };
  return (Object.keys(weights) as ArchetypeId[]).map((id) => [id, weights[id]] as const);
}

/**
 * How much a section should repeat itself: the hook axis, times the kind of section.
 *
 * `HookLevel` had nine fields for this and six of them are gone — they described
 * mechanisms inside an engine that no longer exists. What survives is the level
 * itself, which is what the axis always meant, and it is multiplied by the section's
 * own appetite. A chorus at `through` still repeats more than a bridge at `through`,
 * because a chorus is a chorus.
 */
export function repetitionFor(hook: HookLevel, kind: SectionKind): number {
  const shape = sectionShape(kind);
  return clamp01(shape.repetition * (0.4 + 0.9 * (hook.level / 4)));
}

/**
 * The lead window, moved to where this kind of section actually sings.
 *
 * **`SectionShape.register` was authored six times and read by nothing** — the
 * same failure `melody.sequence` had before `adapt.ts` existed, and the type says
 * plainly what it is for: *semitones the lead window moves for this kind of
 * section*. A chorus that sits two semitones above the verse and a bridge that
 * sits between them is the most audible register contrast in popular music and
 * costs nothing to state; without it every section of every song was written in
 * one band, which is a large part of why `SectionShape` could describe a chorus as
 * denser and more repetitive and still not make one sound like a chorus.
 *
 * It also does something no single section can do for itself. `planRegisters`
 * hands the melody a window the width of the style's declared span and the tune
 * fills most of it; the *song's* range can only be wider than one section's if the
 * sections sit at different heights. Measured across the catalogue, the median
 * song covered thirteen semitones and the median section twelve — the whole piece
 * was one section's worth of register.
 *
 * Bounded by what the instrument can play, because the shift is a musical
 * preference and the horn's top note is not. A window that would end up too narrow
 * to hold an octave is refused outright, for the reason `planRegisters` gives: the
 * cadence machinery needs every pitch class inside the range or it stops landing
 * on the tonic.
 */
export function registerFor(
  kind: SectionKind, range: [Midi, Midi], playable: readonly [Midi, Midi],
): [Midi, Midi] {
  const shift = sectionShape(kind).register;
  if (!shift) return range;
  const lo = Math.max(playable[0], range[0] + shift);
  const hi = Math.min(playable[1], range[1] + shift);
  return hi - lo >= 12 ? [lo, hi] : range;
}

export interface SectionTuneOptions {
  style: Style;
  hook: HookLevel;
  kind: SectionKind;
  /** One chord per bar, already in concert pitch. */
  chords: Chord[];
  startBeat: number;
  tonic: Pc;
  mode: Mode;
  range: [Midi, Midi];
  scaleForChord: (tonic: Pc, mode: Mode, chord: Chord) => Scale;
  /** RNG stream tag. Attempt *k* of the audition draws from `${tag}:${k}`. */
  tag: string;
  strictness: number;
  rules: Rule[];
  accompaniment: Accompaniment;
  agility: number;
  /** What the instrument actually plays. Mapped from `style/instruments.ts`. */
  idiom?: IdiomProfile;
  /**
   * `Genre.voice` — what the genre says its melodies are made of, under the
   * style's own delta and over the derived voice. See `voiceForStyle`.
   *
   * The voice and not the genre, and that is the smaller of the two ways to get
   * this here. `voiceForStyle` reads one optional field of `Genre`, so taking
   * the whole interface would buy nothing and would cost the first import of
   * `genre/` anywhere under `src/tune/` — the door this file's header is about.
   * It also lets `genre-check`'s instrument probes, which hold a style fixed and
   * are not generating a song, pass a voice without inventing a genre.
   */
  genreVoice?: Partial<Voice>;
  /** The song's other sections, so this one can be told apart from them. */
  avoid?: readonly Signature[];
  /**
   * The material this whole song is made of, where the caller has drawn one.
   *
   * Absent means this section invents its own, which is what every section did
   * until now and what the tune lab and the instrument probes still do. See
   * `Subject`.
   */
  subject?: Subject;
  attempts?: number;
  /**
   * The mood's multipliers on leap and ornament.
   *
   * Applied to the voice rather than to the notes, which is the only place they can
   * do their job: a calmer mood should make the engine *want* to move by step, not
   * write a leaping tune and then flatten it. Same two numbers the old engine took
   * as `leapScale` and `ornamentScale`.
   */
  mood?: { leap: number; ornament: number };
  /**
   * How the section is *felt*, in the three terms a feel is allowed to say to a
   * composed part. See `Feel.voice`.
   *
   * The same door as `mood` above, for the same reason and with more force: the
   * melody is not merely generated here, it is *auditioned*. `auditionTune`
   * writes two dozen candidates, scores each against the rules and a freshness
   * term, and keeps the winner — so a feel that pushed those notes around
   * afterwards would hand back a gesture nobody scored. A funkier section has to
   * be a section the engine *wanted* to write funkier.
   *
   * Already scaled by the span's `amount` when it arrives, so `1` here is
   * genuinely "leave it alone" whatever the span said.
   */
  feel?: NonNullable<Feel['voice']>;
}

export interface SectionTune {
  notes: NoteEvent[];
  audition: Audition;
}

/**
 * The style's voice with the song's mood and the section's feel folded in.
 *
 * One object, built once, because the two are the same kind of statement: a bag
 * of multipliers over a vocabulary that already exists. Neither may add a field
 * to `Voice` — if a modifier needs a knob the voice has not got, it is composing
 * rather than modifying and belongs somewhere else entirely.
 *
 * ## The absent accent table, which is the one real decision here
 *
 * `Voice.accents` is optional, and absent means *"derived from `syncopation` and
 * the metre"* — a derivation that also needs the canvas span and the style's own
 * beat groups, neither of which exists at this altitude. So a multiplier here
 * has nothing to multiply, and it deliberately does nothing rather than
 * materialising a table to scale: any array written here would *replace* the
 * derivation instead of scaling it, which would move the tune even at 1.0 and
 * would assert a four-four backbeat under a style grouped 2+2+3.
 *
 * That is not the feel losing its voice on such a style. The derivation reads
 * `syncopation`, and `syncopation` is the first field in this block — so a feel
 * that wants the offbeats lifted on a voice with no table says it through the
 * door the type already provides, and the metre stays intact on the way through.
 * Every style in the catalogue that can currently draw a feel has a table
 * anyway, derived from its own melody cells by `cellAccents` above — 87 styles
 * can draw a feel and **0 of the 87 arrive here without one**, so the branch
 * that deliberately does nothing has never once been taken by a feel that could
 * have used it.
 *
 * The absent case was written down as *the three authored voices*. **Two of the
 * three have since been given an accent table** — tango's dotted lilt and
 * iskelmäpop's, sixteen slots each — so it is now exactly **one style in 389**:
 * `berlin`, whose own note says the lead is not the piece and earns its place by
 * holding still while the machine moves, which is a voice with nothing to lean
 * on. `DEFAULT_VOICE` carries none either and no style in the catalogue reaches
 * it — `voiceForStyle` derives one from the cells for every unauthored style.
 * So the honest statement of the absent case is *an authored voice that has
 * chosen not to have one*, and whatever is authored next.
 */
function adaptVoice(
  base: Voice, mood?: { leap: number; ornament: number }, feel?: NonNullable<Feel['voice']>,
): Voice {
  if (!mood && !feel) return base;
  const accents = feel?.accents && base.accents
    ? base.accents.map((a, i) => Math.max(0, a * feel.accents![i % feel.accents!.length]!))
    : base.accents;
  return {
    ...base,
    ...(mood ? {
      leap: clamp01(base.leap * mood.leap),
      ornament: clamp01(base.ornament * mood.ornament),
    } : {}),
    ...(feel?.syncopation !== undefined
      ? { syncopation: clamp01(base.syncopation * feel.syncopation) } : {}),
    // Onsets per bar, so a count rather than an appetite: floored just above
    // silence instead of clamped to one, and left uncapped upward because the
    // archetype and the section shape both scale it again downstream.
    ...(feel?.density !== undefined
      ? { density: Math.max(0.4, base.density * feel.density) } : {}),
    ...(accents ? { accents } : {}),
  };
}

/**
 * The material a whole song is made out of.
 *
 * ## The fault
 *
 * `composeSectionTune` is called once per section and every call invented its own
 * archetype, its own subset and its own family of motifs. Measured over 1,167
 * songs as the overlap of interval three-grams between one section's tune and
 * another's: **0.581 between two choruses and 0.025 between a verse and a
 * chorus.** The first number is the recall machinery working — a chorus is meant
 * to be the same tune each time. The second is the finding: a verse and a chorus
 * of the same song are, statistically, two unrelated tunes. A song was two or
 * three separate pieces of music sharing a key, a tempo and a bassline.
 *
 * Real songs are made of one idea. The bridge is built out of the chorus, the
 * solo quotes the tune, the outro is the hook slowed down. That is what makes
 * three minutes feel like one thing rather than a medley, and the engine had no
 * way to say it: `motifFamily` builds exactly this — a hook with an answer and a
 * tag derived from it — and it was being rebuilt from scratch eight times a song.
 *
 * ## Derivation, not repetition
 *
 * Handing every section the identical three motifs would be the failure the user
 * warned about from the other side: a song that states one idea eight times is
 * not a song with a subject, it is a loop. So each *kind* of section gets the
 * family put through its own operators — the chorus states it, the verse takes a
 * fragment of it, the bridge inverts it, the outro augments it. Same material,
 * different treatment, which is what development means.
 *
 * Everything downstream of the material still belongs to the section: the phrase
 * plan, the arc, which figure lands in which slot, the surface realisation and
 * the judge. Two sections handed one subject do not come out as one tune — they
 * come out as two tunes about the same thing.
 */
export interface Subject {
  /** The kind of tune this song is, fixed once so every section agrees. */
  archetype: ArchetypeId;
  /** The song's figures, before any section has had them. */
  motifs: readonly Motif[];
}

/**
 * How each kind of section treats the subject.
 *
 * The chorus is deliberately absent, which means *untouched*: the chorus is
 * where a song states its idea plainly, and every other kind is heard against
 * that. The verse takes a piece of it; the bridge turns it upside down, which is
 * the oldest way there is of writing a middle eight that contrasts without
 * changing the subject; the intro and outro stretch it, because a frame is the
 * tune at half speed.
 *
 * `solo` is absent too, and for a different reason: a soloist quoting the head
 * is playing the head, and `Section.solo` already routes that section through
 * its own generator.
 */
const TREATMENT: Partial<Record<SectionKind, Op[]>> = {
  verse: [{ op: 'fragment', keep: 3 }, { op: 'extend', with: 'step' }],
  bridge: [{ op: 'invert' }],
  intro: [{ op: 'fragment', keep: 2 }, { op: 'augment', factor: 2 }],
  outro: [{ op: 'augment', factor: 2 }],
};

/**
 * Draw the song's subject once.
 *
 * Its own stream, so a caller that does not ask for one draws nothing and its
 * songs are what they were — the rule `AuditionOptions` states and the reason
 * `composeTune` keeps drawing a family it is about to discard.
 */
export function planSubject(opts: {
  style: Style;
  rng: Rng;
  genreVoice?: Partial<Voice>;
  idiom?: IdiomProfile;
  mood?: { leap: number; ornament: number };
}): Subject {
  const voice = adaptVoice(voiceForStyle(opts.style, opts.genreVoice), opts.mood);
  const slotsPerBar = opts.style.beatsPerBar * SLOTS_PER_BEAT;
  const archetype = opts.rng.weighted(archetypeWeights(voice));
  return {
    archetype,
    motifs: motifFamily(opts.rng, {
      voice,
      archetype: ARCHETYPES[archetype],
      slotsPerBar,
      span: slotsPerBar * (voice.canvasBars ?? 2),
      ...(opts.idiom ? { idiom: opts.idiom } : {}),
      ...(opts.style.groups ? { groups: opts.style.groups } : {}),
    }),
  };
}

/**
 * The song's material as this kind of section takes it. See `TREATMENT`.
 *
 * ## The feel has to arrive here, because the subject took its old door away
 *
 * A feel's `voice` block scales the composing `Voice` — how dense, how
 * syncopated — and `composeTune` used to hand that scaled voice to
 * `motifFamily`, so the figures a felt section was built from were *themselves*
 * denser. A subject is drawn once for the whole song and cannot be, since the
 * feel belongs to one section. Supplying the family without replacing that path
 * silently unhooked it: `a feel composes the melody it asked for` went from a
 * measurable move to none at all — funk 2.72 against 2.74 onsets a bar, where it
 * had been asking for a third more.
 *
 * So the feel becomes a treatment, in the same vocabulary as the rest. Denser is
 * `diminish`, which compresses the figure so more of it fits the phrase; sparser
 * is `augment`, which stretches it until some of it falls off the canvas. That
 * is what those two operators have always meant, and it puts the feel back where
 * it was — changing the material rather than editing notes after the fact, which
 * is the distinction `Feel.voice` exists to draw.
 */
function treat(
  subject: Subject, kind: SectionKind, rng: Rng, density?: number,
): readonly Motif[] {
  const ops: Op[] = [...(TREATMENT[kind] ?? [])];
  // A hair either side of 1 is a feel that declared nothing worth hearing, and
  // an operator applied at factor 1.02 is churn in the stream for no sound.
  if (density !== undefined && Math.abs(density - 1) > 0.05) {
    ops.push(density > 1
      ? { op: 'diminish', factor: density }
      : { op: 'augment', factor: 1 / density });
  }
  if (!ops.length) return subject.motifs;
  // The hook is transformed and its relatives are left alone, so a section keeps
  // an unaltered reply to answer its own altered statement with.
  return subject.motifs.map((m, i) => (i === 0 ? { ...applyOps(m, ops, rng), role: m.role } : m));
}

/** Write one section's tune. */
export function composeSectionTune(opts: SectionTuneOptions): SectionTune {
  const base = voiceForStyle(opts.style, opts.genreVoice);
  const shape = sectionShape(opts.kind);
  const voice = adaptVoice(base, opts.mood, opts.feel);
  const subject = opts.subject
    ? treat(opts.subject, opts.kind, new Rng(`${opts.tag}:treat`), opts.feel?.density)
    : undefined;

  const { best } = auditionTune({
    tag: opts.tag,
    attempts: opts.attempts ?? ATTEMPTS,
    voice,
    shape,
    repetition: repetitionFor(opts.hook, opts.kind),
    density: shape.density,
    strictness: opts.strictness,
    rules: opts.rules,
    accompaniment: opts.accompaniment,
    agility: opts.agility,
    ...(subject ? { subject, archetype: opts.subject!.archetype } : {}),
    ...(opts.idiom ? { idiom: opts.idiom } : {}),
    ctx: {
      chords: opts.chords,
      beatsPerBar: opts.style.beatsPerBar,
      startBeat: opts.startBeat,
      tonic: opts.tonic,
      mode: opts.mode,
      range: opts.range,
      scaleForChord: opts.scaleForChord,
      ...(opts.style.groups ? { groups: opts.style.groups } : {}),
    },
    ...(opts.avoid ? { avoid: opts.avoid } : {}),
  });

  return { notes: best.notes, audition: best };
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
