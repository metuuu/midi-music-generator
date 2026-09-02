/**
 * Accompaniment generation: bass, chordal comping, pads, brass, counter-melody
 * and drums.
 *
 * These are pattern-driven rather than search-driven — which is correct for the
 * genre. A dance band's rhythm section plays a figure and keeps playing it; the
 * interest comes from the harmony moving underneath it and from the
 * arrangement adding and removing layers. The one place real decision-making
 * happens is voice leading in the comp, and approach notes in the bass.
 */

import type { Chord } from '../core/chord.js';
import { chordPcs } from '../core/chord.js';
import { voiceChord } from '../core/voicing.js';
import type { Midi, Pc } from '../core/pitch.js';
import { clampToRange, nearestPc, pc } from '../core/pitch.js';
import type { Rng } from '../core/rng.js';
// The three-tier kit/hand/either split, read here for the same reason the solo
// generator and the fill vocabulary read it. See `HandStation`.
import { drumStations } from '../concert/instruments.js';
import type { DrumEvent, DrumVoice, NoteBend, NoteEvent, SectionKind } from '../core/types.js';
import { isInScale, scaleStepsBetween, stepInScale, type Scale } from '../core/scale.js';
import {
  buildFill, DEFAULT_FILLS, landing, seamOrchestration, type FillPalette,
} from './fills.js';
import { IDIOMS, INSTRUMENT_RANGE, type HandSpec, type IdiomProfile } from '../style/instruments.js';
import type {
  BassHit, BassPattern, BassTone, CompHit, CompingProfile, CompPattern, DrumPattern, LeftHandMode,
  Style,
} from '../style/types.js';
import { anticipate, metricStrength, SLOTS_PER_BEAT, subdivide, thin } from './rhythm.js';

export interface PartContext {
  chords: Chord[];
  beatsPerBar: number;
  startBeat: number;
  rng: Rng;
  style: Style;
}

/**
 * Where a bass part lives: E1 to E3.
 *
 * A *register* rather than an instrument — the two octaves a bass line sits in
 * so that it sounds like the floor of the arrangement rather than like a cello
 * with a cold. Every note this file writes for the bass layer is decided against
 * it, and for an outline that is the whole of the requirement: a root, a fifth,
 * a third, a walking approach are each chosen by asking the harmony, and any
 * octave of the answer is still the answer.
 *
 * Exported because it is the *only* honest answer to "where is the bass?".
 * `generateBass` is never handed an instrument — whichever patch the palette
 * deals, the written line is placed against this and comes out identical. Any
 * other part of the program that needs to reason about the bass's register has
 * to read it from here; asking the instrument gives a number about the patch's
 * own tessitura, which the bass line has never once been placed against. See
 * `REPAIR_FLOOR` in `arrange.ts` for the pass that learnt this the hard way.
 */
export const BASS_RANGE: [Midi, Midi] = [28, 52];

/** Where a root sits before anything pulls it: E2, the middle of the register. */
const BASS_HOME: Midi = 40;

/**
 * How far above that register a **shape** may reach, and the number is the
 * instrument's rather than anybody's taste.
 *
 * A shape is the opposite of an outline. The interval *is* the figure — see
 * `BassTone` — so the octave a note lands in is not free, and a register window
 * applied to one does not move the note, it deletes the interval: two shape
 * notes fold onto the same pitch, every pitch class survives, and the riff comes
 * out with the same one over every chord. `BASS_RANGE` is 24 semitones wide and
 * an octave of the root has to fit inside it *twice over* for the placement
 * below to have a free choice, so the widest shape that fitted at every root was
 * a **thirteenth** — measured, not estimated, and one semitone worse than the
 * "about a twelfth" this was thought to be. Past that it failed at some roots
 * and not others, which is worse than a flat restriction because it is
 * chord-dependent: the same figure is intact in G and folded in B♭.
 *
 * Three genres narrowed real figures to live inside that, and a fourth did not
 * notice it had to. Latin's `tumbao-octava` is the root, the fifth and the
 * octave *below* — a nineteenth — and `timba-line` reaches a twenty-second;
 * eight figures across seven styles, all of them folded at five roots in twelve
 * and none of them ever reported, because they carry a `cycle` and the check in
 * `genre-check.ts` skips a cycled figure on the perfectly good grounds that its
 * per-bar span is a moving target. A cycle is not a narrower shape. It was the
 * measurement that could not see them, not the fault that spared them.
 *
 * So a shape gets a second, wider window, and 63 is where the electric bass
 * stops. `fingerBass`, `pickBass`, `slapBass`, `slapBass2` and `fretlessBass`
 * all end at D♯4 and they are the shortest instruments an era can hand the bass
 * layer; every other candidate reaches further — tuba 65, contrabass and the
 * upright 67, bassoon 75, cello 81 — so a shape kept under 63 is playable by
 * whoever turns up. Taken from the table rather than typed in, because the day
 * one of those five is re-ranged this has to move with it.
 *
 * There would be no point reaching higher anyway. `generateSong` runs every
 * finished part through `foldIntoRange` against the instrument it actually drew,
 * so a note past the ceiling is folded back by an octave — the same flattening
 * this window exists to prevent, arriving one stage later, with nothing left
 * that could notice and no shape information left to notice it with.
 *
 * **Upward only, and the floor does not move.** 28 is the open E of every bass
 * in that list and there is nothing underneath it. It is also the right
 * asymmetry musically: the figure this whole mechanism is for is the
 * octave-displaced riff, which is rooted at the bottom and reaches up. A bass
 * figure wanting twenty semitones *below* its root is asking for a root at C4,
 * which is not a bass part.
 */
const SHAPE_CEILING: Midi = Math.min(
  INSTRUMENT_RANGE.fingerBass[1],
  INSTRUMENT_RANGE.pickBass[1],
  INSTRUMENT_RANGE.slapBass[1],
  INSTRUMENT_RANGE.slapBass2[1],
  INSTRUMENT_RANGE.fretlessBass[1],
);

/**
 * The tones that ask the harmony where they are.
 *
 * `BassTone`'s own doc calls its named members chord functions, and four of them
 * are: `third`, `fifth` and `seventh` each get a different answer as the quality
 * changes, and `approach` asks the *next* chord. Those four are placed by
 * `nearestPc` near the root and are free to be folded into the register, because
 * an octave of a chord tone is the same chord tone.
 *
 * The other two names are not questions at all. `root` is the root and `octave`
 * is the root plus twelve, both computed as literal displacements exactly the
 * way a number is — which is the distinction this type draws and the one the
 * generator has to act on, since it is the literal ones that a fold destroys.
 */
type ChordTone = Exclude<BassTone, number | 'root' | 'octave'>;

function asksTheChord(tone: BassTone): tone is ChordTone {
  return typeof tone === 'string' && tone !== 'root' && tone !== 'octave';
}

/** How far above the root, for the tones that do not ask. */
function displacementOf(tone: Exclude<BassTone, ChordTone>): number {
  return tone === 'root' ? 0 : tone === 'octave' ? 12 : tone;
}

/**
 * How far above and below the root a figure's shape notes reach.
 *
 * Both zero for a pattern written entirely in chord functions, which is what
 * keeps the placement below free for them: every octave of the root scores the
 * same and the root is the root it has always been.
 *
 * A shape needs more than clamping. `clampToRange` applied to the top note of a
 * riff *flattens* it — two notes land on the same pitch and the figure the
 * numeric spelling exists to protect is gone. So the root is placed to hold the
 * whole span instead and the shape arrives entire, which is what `arpOctaves`
 * already does to a voicing that will not fit above the line. See `BassTone`.
 *
 * **`octave` counts, and finding that it did not was the fault's silent half.**
 * §1.3 of `docs/engine-gaps.md` was reported by three genres who all wrote their
 * riffs in numbers, and the check measures the numbers, so the same figure
 * spelled `tone: 'octave'` was folding in the open with nothing looking at it.
 * Counted over the whole catalogue before this line changed: **57 figures in
 * nine genres**, every one of them folding at exactly six of the twelve root
 * positions, because a shape reaching a twelfth needs the root at or under MIDI
 * 40 and `nearestPc(root, 40)` puts it above that half the time. In those keys
 * the octave *was the root* — a `boom-run` whose boom and whose run are one
 * note, a `tumbao-octava` whose two events do not separate in register, an
 * ambient `drone-octave` sounding one pitch twice. Reggae's `steppers-octave`
 * writes the same gesture as `tone: 12` and was placed correctly all along,
 * which is the whole argument: two spellings of one figure had two behaviours.
 *
 * The worst of it was in `sustain` patterns, where the collision also defeated
 * `mergeHeld`: root and octave landed in one pitch group, their onsets
 * interleaved, and the end-to-end chain the merge walks was broken at every
 * join. `ambient/wasteland` came out with **80 re-articulated notes on one pitch
 * where the figure asks for two held tones** — a pulse where the whole point of
 * `BassPattern.sustain` is a drone.
 *
 * Lifted out of `generateBass`, where it was written inline, so that
 * `unplaceableRoots` can ask the question the generator asks rather than a
 * paraphrase of it. That is the same argument that lifted `place` out of the
 * loop further down, and it avoids the same fault: two copies of this would be
 * two spellings of one figure with two behaviours, which is precisely the fault
 * whose cost `BassTone`'s own note records at 57 figures in nine genres.
 */
function spanOf(hits: readonly BassHit[]): { lo: number; hi: number } {
  return hits.reduce(
    (span, h) => {
      /**
       * **A glide destination counts toward the span**, and it has to for the
       * reason the paragraph above is about: `placeRoot` chooses the octave that
       * holds the whole figure, and a figure that *travels* to a twelfth reaches
       * a twelfth whether or not it strikes one. Left out, a `glide: 12` would
       * be clamped against `SHAPE_CEILING` at exactly the roots where the shape
       * did not fit — the same silent, chord-dependent fold §1.3 describes, on a
       * note the ear is following rather than one it is merely hearing.
       *
       * Written as a loop over one or two tones rather than as a second reduce so
       * that a pattern with no glide walks the identical sequence of comparisons
       * it walked before this existed. See `BassHit.glide`.
       */
      let out = span;
      for (const tone of h.glide === undefined ? [h.tone] : [h.tone, h.glide]) {
        if (asksTheChord(tone)) continue;
        const at = displacementOf(tone);
        out = { lo: Math.min(out.lo, at), hi: Math.max(out.hi, at) };
      }
      return out;
    },
    { lo: 0, hi: 0 },
  );
}

/**
 * Which octave of the root this bar's figure stands on.
 *
 * This replaces two `while` loops that walked the root away from
 * `nearestPc(root, 40)` an octave at a time and stopped at the first position
 * the shape fitted in. They were right about the remedy — **move the root, do
 * not clamp the notes** — and wrong about the search twice over. They only ever
 * asked *does it fit here*, so where nothing fitted they gave up where they
 * started and let the clamp fold the figure; and they asked it of one end of the
 * shape at a time, which is not a question about the shape.
 *
 * Which octave a figure fits in is a property of the whole span, so every octave
 * of the root is scored and the cheapest wins. Three costs, and the order is the
 * argument:
 *
 *  1. **Notes the bass cannot play.** Below `BASS_RANGE[0]` or above
 *     `SHAPE_CEILING`, which is the only hard wall here — see `SHAPE_CEILING`.
 *     Anything with a cheaper answer available is not considered further.
 *  2. **Notes above the register.** A shape may spend the reach, but only when
 *     it has to. A figure spanning a twelfth fits inside `BASS_RANGE` at every
 *     root and there is nothing to buy by pushing it up into the cello's
 *     octave, so it never is: this term is what keeps a bass sounding like one
 *     and keeps the reach a relief valve rather than a wider range.
 *  3. **Distance from home, counted twice, plus distance from the bar before.**
 *     `near` is the previous bar's root, so a root a semitone away is taken a
 *     semitone away rather than an eleventh off, while the heavier pull towards
 *     E2 keeps a progression from leading the line to either end of the register.
 *
 * A bar's root can still land an octave from its neighbour's, and that is real
 * damage rather than a free win — a riff an octave under the bar before it has
 * come apart between the bars even though each bar is right. It is the lesser
 * damage, which is the same judgement the loops were making, and the second cost
 * is what keeps it rare: an octave is only spent to buy a note, never to buy
 * tidiness.
 *
 * Two octaves either side is enough to reach every position: `home` is within a
 * tritone of 40 and the reach runs 28 to 63, so the five candidates cover it
 * from anywhere. Nothing here is drawn — the whole decision is arithmetic on the
 * root and the span — so no figure this touches costs the song a random number.
 */
function placeRoot(root: Pc, shape: { lo: number; hi: number }, near?: Midi): Midi {
  const home = nearestPc(root, BASS_HOME);
  const cost = (at: Midi): readonly number[] => [
    Math.max(0, BASS_RANGE[0] - (at + shape.lo)) + Math.max(0, at + shape.hi - SHAPE_CEILING),
    Math.max(0, at + shape.hi - BASS_RANGE[1]),
    2 * Math.abs(at - BASS_HOME) + (near === undefined ? 0 : Math.abs(at - near)),
  ];
  let best = home;
  let lowest = cost(home);
  for (let at = home - 24; at <= home + 24; at += 12) {
    const c = cost(at);
    const differs = c.findIndex((v, i) => v !== lowest[i]!);
    if (differs >= 0 && c[differs]! < lowest[differs]!) {
      best = at;
      lowest = c;
    }
  }
  return best;
}

/**
 * The roots at which a figure has nowhere to stand.
 *
 * Empty for every one of the catalogue's 1,034 bass figures — 497 of which
 * carry a shape at all — and that emptiness is the entire point of asking.
 *
 * §1.3 of `docs/engine-gaps.md` was reported by genres who never compared
 * notes, and every one of them found it the same way: write a figure, hear it
 * come out flat in some keys and not others, narrow the figure until it stops.
 * Reggae's `steppers-octave` gave up a fifth below the root, metal's `fifths`
 * gave up the octave above — folding 8 bars per style across 11 styles on the
 * way to finding out — and funk's `octave-drop` moved its ♭7 to the far side of
 * the root to save two semitones. **All three have the note back**, at spans of
 * 17, 17 and 14, and the thirteen further funk figures that share the ♭7
 * spelling — §1.3 counted eleven, because it counted the ones with a comment —
 * were re-read one at a time and kept, because none of them is that gesture.
 * Latin never found out at all — its tumbaos carry a `cycle`, the check skips a
 * cycled figure, and `timba-line` has been the widest shape in the project at 22
 * semitones with nothing watching it.
 *
 * **The wall is real, and it is nowhere near where they were told.** The reach
 * is `SHAPE_CEILING - BASS_RANGE[0]`, 35 semitones, and the candidate placements
 * `placeRoot` scores are an octave apart — so a shape spanning `S` may stand
 * anywhere in a window `35 - S` wide, and a window 11 wide or more always
 * contains one of them. Every span up to **24 — two octaves exactly** — fits at
 * all twelve roots. Past that the failure arrives one root at a time: 25 folds
 * at one root in twelve, 30 at six, 36 nowhere at all. Measured across every
 * lo/hi split the catalogue writes, the curve is identical, because only the
 * width enters the arithmetic and never where the shape sits around its root.
 *
 * That gradual onset is why this is a check and not a comment. The first figure
 * over the line is intact in eleven keys and broken in the twelfth, which is
 * exactly the fault an author auditions past.
 *
 * Asked of the hits through `spanOf`, so it is the generator's own question
 * rather than a paraphrase: a `cycle`, a chord function mixed in among the
 * numbers, a `tone: 'octave'` and a glide destination all count here because
 * they all count there. **That totality is the whole of the fix.** The check
 * that came first — *"a riff is the same shape over every chord quality"* —
 * compares rendered bars against a declared span, which it can only do for a
 * figure that is uncycled and numeric throughout: 287 of the 497. The 210 it
 * skips include all eight of the widest in the project.
 */
export function unplaceableRoots(hits: readonly BassHit[]): readonly Pc[] {
  const shape = spanOf(hits);
  const out: Pc[] = [];
  for (let root = 0; root < 12; root++) {
    const at = placeRoot(root, shape);
    if (at + shape.lo < BASS_RANGE[0] || at + shape.hi > SHAPE_CEILING) out.push(root);
  }
  return out;
}

/**
 * Every slot a repeating figure lands on across a whole section, paired with the
 * bar it lands in.
 *
 * One helper for all three pattern generators, because "walk the section in
 * figures rather than in bars" is the same sentence in each of them and getting
 * it subtly different in three places is how a cycle ends up drifting in the
 * bass and not in the drums.
 *
 * The bar is carried alongside the slot because the harmony is still bar-shaped
 * — see `Cycle` in `style/types.ts`. A figure that straddles a barline takes the
 * chord it lands in, one hit at a time, which is what a player reading a chart
 * does and is the whole reason an ostinato over moving changes sounds like
 * music rather than like a sequencer left running.
 *
 * The last partial cycle is played rather than dropped. A three-beat figure in a
 * four-bar phrase does not stop five beats early because the maths ran out; it
 * plays until the section does, and the tail lands wherever the drift put it.
 */
function* cycleHits<T extends { at: number }>(
  hits: readonly T[],
  opts: { cycle: number; bars: number; slotsPerBar: number },
): Generator<{ hit: T; bar: number; slot: number }> {
  const total = opts.bars * opts.slotsPerBar;
  const cycle = Math.max(1, Math.round(opts.cycle));
  for (let base = 0; base < total; base += cycle) {
    for (const hit of hits) {
      const slot = base + hit.at;
      if (slot >= total) continue;
      yield { hit, bar: Math.floor(slot / opts.slotsPerBar), slot };
    }
  }
}

/**
 * What a player does differently at the end of a phrase.
 *
 * Two gestures rather than four, and the two the operator library offers that a
 * *bass player* actually reaches for: arrive early and hold, or put two notes
 * where the figure has one. `thin` exists in `generate/rhythm.ts` and is not
 * drawn here — thinning belongs to how loud a section is rather than to where a
 * phrase turns over, and `shotFigures` is the caller that wanted it.
 */
export interface FigureVariation {
  kind: 'push' | 'fill';
  /** The onset it happens to, in sixteenths from the top of the bar. */
  at: number;
}

/**
 * The two or three figures a song's rhythm section actually has, and which
 * section each belongs to.
 *
 * ## The fault this exists to fix
 *
 * `song.ts` drew one bass figure and one comp figure per song, with a comment
 * saying a band does not change its comping pattern every eight bars. That is
 * true of a band and false of a *song*, and the difference was audible: measured
 * over the whole catalogue at eight songs a style, **147 of 387 styles played a
 * bass line with four or fewer distinct bar shapes in it from beginning to
 * end**, and 195 of 387 produced two songs whose bass was note-for-note the same
 * set of bars. A hundred-bar Berlin school piece was one bar of root-root-root-
 * root repeated a hundred times, and the only thing separating one such piece
 * from the next was which of six rows won a single weighted draw.
 *
 * So the figure was not too repetitive — repetition is the idiom — it was
 * repetitive at the wrong *rate*. A rhythm section repeats within a section and
 * changes between them, and there was no mechanism in the engine that could
 * express the second half of that sentence.
 *
 * ## Three roles, and why not more
 *
 * `home` is the band's identity: the verse, the intro, the outro, and anything
 * unlabelled. `lift` is the chorus. `drop` is the bridge and the solo. A song
 * with eight sections therefore states each figure several times, which is the
 * point — a cast of eight figures heard once each is the failure this was
 * supposed to avoid, not a richer version of the fix. Three is the largest
 * number where every figure still gets repeated enough to be recognised.
 *
 * Repeat sections of a kind get the *same* figure, so the second chorus is the
 * first chorus's floor rather than a third idea.
 *
 * ## The two contrast figures are not drawn flat
 *
 * A chorus whose bass thins out and a bridge whose bass gets busier are both
 * arrangements in reverse. `lift` is drawn from the rows at least as dense as
 * `home` and `drop` from the rows no denser, counting onsets per bar, so the
 * cast reads as a shape across the song rather than as a shuffle. Where a table
 * cannot supply one — every row the same density, a two-row table — the pool
 * falls back to everything but the figures already cast, because a contrast in
 * the wrong direction is still a contrast and no contrast is what this replaces.
 *
 * Both draws stay weighted by the table's own weights, so a rare colour is still
 * rare in the chorus. What the cast changes is *how many* of a style's figures
 * one song is allowed to hold, not which of them the idiom prefers.
 *
 * ## What it moved, measured the way the fault was
 *
 * Same probe, same eight songs a style, this and `DEFAULT_VARY` together:
 * **147 styles under four distinct bass bar shapes fell to 83**, and the 195
 * that wrote two identical songs fell to 88. The comp, which was already
 * healthy, went from 18 styles with a repeat to 13. On the styles this was
 * reported against, over 24 songs each: `synth/berlin` 16 distinct bass lines
 * of 24 to 24 of 24, `reggae/roots` 15 to 24, `house/disco` 15 to 24.
 *
 * The floor that is left is the tables, not the mechanism. A style holding one
 * rhythm spelled twice has nothing to cast, which is what `derive` is for and
 * what widening those tables is for; see the note there for the count.
 */
export interface FigureCast<P> {
  /** Verse, intro, outro — and the fallback for everything. */
  home: P;
  /** The chorus, where the style has a second figure to give it. */
  lift?: P;
  /** The bridge and the solo. */
  drop?: P;
}

/**
 * How readily a rhythm section changes figure between sections, per layer.
 *
 * The fallback for a style and a genre that both say nothing, and it is
 * deliberately *on*: the measurement above is a statement about the catalogue as
 * it stands, so a default of zero would fix nothing and leave 387 tables to
 * edit by hand. A style built on one unbroken machine — a dub plate, a minimal
 * techno track, a sequencer piece whose whole subject is that it does not stop —
 * says `swap: { bass: 0 }` and gets exactly what it had.
 *
 * The bass is likelier to move than the comp because the comp already moves on
 * its own: its voicings follow the harmony and its arpeggio ladders drift
 * against the bar, and it measured healthy where the bass did not — 8 of 382
 * styles under four distinct bar shapes against the bass's 147.
 */
export const DEFAULT_SWAP: Readonly<Record<'bass' | 'comp', number>> = { bass: 0.7, comp: 0.45 };

/**
 * …and how often it plays the figure it has differently where a phrase turns
 * over. The fallback for `Style.vary`, and the same argument in the smaller key.
 *
 * `vary` has been a good mechanism nobody switched on: **37 styles of 389
 * declare it**, and the other 352 are not a considered decision that a bass
 * player should lean into a phrase end exactly never — they are what a field
 * added late looks like. Rock declares it at 0.05 to 0.12 across twenty styles
 * and iskelmä at 0.3 to 0.45, so the range that has been listened to is wide,
 * and a middling default sits inside it.
 *
 * Lower than `DEFAULT_SWAP` because the two gestures are not the same size: a
 * swap is a section-long decision heard once per section, and this fires in one
 * bar and is gone. Held at a level where a listener meets it about every other
 * phrase — often enough that the loop breathes, rarely enough that its landing
 * is still an event.
 *
 * A style that means never says `vary: { bass: 0 }`, which reads exactly as it
 * should and which the guard in `song.ts` treats as the absence it is.
 *
 * **It is the larger half of the pair, measured.** The cast alone took the 147
 * styles under four distinct bass bar shapes to 113 and the 195 duplicate-song
 * styles to 129; switching this on took them to 83 and 88. That order is not a
 * surprise once stated: a cast changes the figure eight times in a song and this
 * changes how it is played at every phrase end, which is four times as often.
 */
export const DEFAULT_VARY: Readonly<Record<'bass' | 'comp', number>> = { bass: 0.35, comp: 0.25 };

/**
 * …and how often a song composes its own version of the figure it drew, rather
 * than playing the table row verbatim. See `planSignature`.
 *
 * The highest of the three, and it is the one aimed at the complaint the other
 * two missed. `swap` and `vary` both make a song vary *within itself*, which
 * measured well and left two songs of a style sharing a dominant bassline 36% of
 * the time; this is the only one of the three that can make two songs *different
 * from each other*, because it is the only one that changes the figure occupying
 * most of the track.
 *
 * Bass over comp again, and by more than before. A bass figure is a line and one
 * altered note is audible as this song's line; a comp figure is a rhythm carrying
 * whole voicings, whose pitches already move with the harmony, so the same edit
 * says much less and risks more — a chank whose slots have shifted stops locking
 * with the kit.
 */
export const DEFAULT_SIGNATURE: Readonly<Record<'bass' | 'comp', number>> = { bass: 0.75, comp: 0.2 };

/** How many onsets this figure puts in a bar, cycle length allowed for. */
function density(p: { hits: readonly { at: number }[]; cycle?: number }, slotsPerBar: number): number {
  return p.cycle ? (p.hits.length * slotsPerBar) / p.cycle : p.hits.length;
}

/** Two figures that land on exactly the same slots are one rhythm in two spellings. */
function sameShape(
  a: { hits: readonly { at: number }[]; cycle?: number },
  b: { hits: readonly { at: number }[]; cycle?: number },
): boolean {
  return a.cycle === b.cycle
    && a.hits.length === b.hits.length
    && a.hits.every((h, i) => h.at === b.hits[i]!.at);
}

/**
 * **This song's** version of the style's figure — one edit, held from the first
 * bar to the last.
 *
 * ## The fault, and it is the one `FigureCast` did not fix
 *
 * The cast made a song vary *internally* and measured well at it: the share of a
 * track spent on its one dominant bar fell from 0.75 to 0.52, and the number of
 * songs whose chorus bass differs from their verse bass went from 15% to 71%.
 * It did nothing at all for the complaint it was written for. Over the same
 * fixture, the odds that two songs of one style share the same **dominant**
 * bassline went 39% to 36% — inside the noise — and their *profile* similarity,
 * how much of their playing time is spent on the same material, went the wrong
 * way: 0.41 to 0.47.
 *
 * That second number is the cast's own doing and it is worth stating plainly.
 * With two or three rows in a table, a song that reaches for more of the table
 * is a song that overlaps more with the next one. `latin/son` has two rows and
 * went from 0.51 to 0.85: before, one song played row A and another row B; after,
 * both play both. Richer songs, less distinguishable from each other.
 *
 * The root cause is that **nothing in the engine has ever composed a bass
 * figure** — it draws one, verbatim, out of a table of two. Two songs that draw
 * the same row are the same bassline, and no amount of arranging *around* that
 * row changes it.
 *
 * ## What this is not
 *
 * It is not per-bar randomisation. A figure whose notes move about is not a
 * bassline with character, it is a bassline with a fault, and the whole appeal
 * of a rhythm-section figure is that it is the same one every time round. So
 * exactly **one** edit is chosen, once, and the *same* edited figure plays for
 * the whole song. What that buys is the thing a record has and a table cannot:
 * this song's bassline, recognisably the idiom and recognisably not the last
 * one's.
 *
 * ## The four edits, and why these
 *
 * Each is a thing a player does to a figure they have been handed, and each
 * leaves it recognisable as the figure:
 *
 *  - **`push`** — one onset arrives an eighth early and holds through where it
 *    was. The anticipation, and the most common single alteration there is.
 *  - **`hole`** — one onset removed. The gap is what turns a pattern into a
 *    riff; `thin` will not do this because it is metric, and the point here is
 *    that the hole is *this song's*, in a place the metre did not choose.
 *  - **`echo`** — one onset repeated a sixteenth later, softly. The stutter, and
 *    the same payload, so nothing is proposed about the harmony.
 *  - **`reach`** — one onset's tone raised to the octave, fifth or seventh. The
 *    note that lifts a floor into a line. The only edit that touches pitch, it
 *    can only reach a tone the chord already contains, and it only lifts a
 *    root: a figure's own fifth is a line already, and an octave in its place
 *    turns a two-beat into a disco bounce.
 *
 * The downbeat is never the target. It is the figure's anchor, the thing that
 * says which bar this is, and a signature that moved it would be a different
 * figure rather than the same one with a hand on it.
 *
 * `hole` declines a figure of fewer than three onsets, because two notes minus
 * one is not a riff with a gap in it.
 *
 * ## The fifth edit, for the figure the other four cannot touch
 *
 * "Never the downbeat" leaves a figure whose *only* onset is the downbeat with
 * nothing to work on — and those are not a curiosity, they are the entire low
 * end of a genre. A drum-and-bass sub is one note a bar; so is a hiphop 808, a
 * scherzo's bass and a lament's drone. Every one of them came out of the first
 * four edits untouched, and they are exactly the styles that measured worst
 * afterwards: **19 styles still collided over half the time and 12 of them were
 * one-note figures**, `dnb/revival` and `dnb/jungle` at 80%, `finnfolk/itkuvirsi`
 * at 100%.
 *
 *  - **`tail`** — a second, shorter note in the back half of the bar, on a tone
 *    the chord already contains. What a sub-bass line actually varies is not its
 *    rhythm, which is one note, but whether that note is answered before the bar
 *    turns over, and by what.
 *
 * **A `sustain` figure declines it**, and that field is exactly the right gate
 * because it is already the author's declaration that this is a held note rather
 * than a struck one. A drone answered halfway through the bar is not a drone —
 * `ambient/drone` and `finnfolk/itkuvirsi` both say `sustain: true` and both keep
 * what they had, while `dnb`'s subs, which do not, get a line.
 */
export type Signature = { kind: 'push' | 'hole' | 'echo'; at: number }
  | { kind: 'reach'; at: number; tone: BassTone }
  | { kind: 'tail'; at: number; tone: BassTone; dur: number };

/**
 * Choose one, or none. Drawn from a stream of its own, so a style that declines
 * constructs nothing and its songs are what they were.
 *
 * A walking bass is declined outright — `generateBass` hands it to
 * `generateWalkingBass` and never reads its `hits` at all.
 *
 * ## A cycled figure takes `reach` and nothing else
 *
 * `derive` and `planFigureVariation` both refuse a cycled figure whole, on the
 * argument that a figure carrying a cycle is meant to drift against the bar and
 * that changing it fights the thing it was written to do. That argument is about
 * **onsets**, and only three of the five edits here touch one: `push` moves an
 * onset, `hole` removes one, `tail` adds one, and any of those changes the drift
 * itself rather than the figure riding on it.
 *
 * `reach` changes a *pitch* and leaves every onset exactly where the author put
 * it. The cycle it comes home on, the bar it lands across, the phase against the
 * harmony — all identical. So refusing it was over-broad, and expensively: the
 * styles built entirely on cycled figures are a fifth of the ones still
 * measuring worst, and they are two whole idioms. Every latin bass is a tumbao
 * or a variant, every drum-and-bass sub is a two-bar cycle, and both of those
 * genres *do* vary which note the figure sits on — a tumbao walking root–fifth
 * and one walking root–flat-seventh are the same tumbao, and a bass player who
 * only ever played the first would be a sequencer.
 */
export function planSignature(
  figure: {
    hits: readonly { at: number; dur?: number; tone?: BassTone }[];
    cycle?: number; walking?: boolean; sustain?: boolean;
  },
  opts: {
    chance: number; rng: Rng; slotsPerBar: number; groups?: readonly number[];
    /**
     * Whether this layer's hits carry a `tone` — the bass's do and the comp's do
     * not, because a comp hit sounds a whole voicing and there is no one note in
     * it to raise. `reach` and `tail` are ruled out where they do not.
     */
    pitched: boolean;
  },
): Signature | undefined {
  const { chance, rng, slotsPerBar, groups, pitched } = opts;
  if (chance <= 0 || figure.walking) return undefined;
  if (!rng.chance(chance)) return undefined;

  const movable = figure.hits.filter((h) => h.at > 0);

  if (figure.cycle) {
    // Pitch only, per the header. A cycled figure whose hits are all on the
    // downbeat of the cycle has nothing to reach for and keeps what it had.
    if (!pitched || !movable.length) return undefined;
    const late = movable.filter((h) => h.at >= slotsPerBar / 2);
    const target = rng.pick(late.length ? late : movable);
    return {
      kind: 'reach',
      at: target.at,
      tone: rng.weighted([['octave', 4], ['fifth', 3], ['seventh', 2]] as const),
    };
  }

  if (!movable.length) {
    /**
     * Nothing but the downbeat, so the only edit available is what comes after
     * it. See `tail` in the header.
     *
     * Placed on the half bar, the last beat or the last eighth — the three
     * places a one-note bass answers itself — and never where the head is still
     * sounding is not a constraint, because `signFigure` shortens the head to
     * meet it. A tone the chord contains, so the answer is harmony rather than
     * an invention.
     */
    if (!pitched || figure.sustain) return undefined;
    const head = figure.hits[0];
    if (!head) return undefined;
    const at = rng.weighted([
      [Math.round(slotsPerBar / 2), 4],
      [Math.round(slotsPerBar * 0.75), 3],
      [slotsPerBar - 2, 2],
    ] as const);
    if (at <= head.at + 1 || at >= slotsPerBar) return undefined;
    return {
      kind: 'tail',
      at,
      tone: rng.weighted([['fifth', 4], ['seventh', 3], ['octave', 2], ['root', 2]] as const),
      dur: Math.max(2, Math.min(slotsPerBar - at - 1, rng.weighted([[4, 3], [2, 3], [6, 2]] as const))),
    };
  }

  /**
   * Weighted, and `reach` carries the most because it is the one edit that gives
   * the figure a *note* rather than a rhythm — which is what a listener hums,
   * and what two songs off one root-only table most need to tell them apart.
   */
  const floor = movable.filter((h) => h.tone === 'root' || h.tone === 0);
  const kinds: (readonly [Signature['kind'], number])[] = [
    ['reach', pitched && floor.length ? 4 : 0], ['push', 3], ['echo', 3],
    ['hole', figure.hits.length >= 3 ? 2 : 0],
  ];
  const kind = rng.weighted(kinds);

  if (kind === 'reach') {
    // The back half of the figure, where a bass line turns rather than lands.
    const late = floor.filter((h) => h.at >= slotsPerBar / 2);
    const target = rng.pick(late.length ? late : floor);
    return { kind, at: target.at, tone: rng.weighted([['octave', 4], ['fifth', 3], ['seventh', 2]] as const) };
  }
  if (kind === 'push') {
    // Only where there is room in front of it: `anticipate` refuses to land on
    // the attack ahead, and a signature that silently did nothing would be a
    // song whose identity depends on which figure it drew.
    const room = movable.filter((h) => !figure.hits.some((o) => o.at >= h.at - 2 && o.at < h.at));
    if (!room.length) return undefined;
    return { kind, at: rng.pick(room).at };
  }
  if (kind === 'echo') {
    const room = movable.filter((h) => (h.dur ?? 0) >= 2
      && !figure.hits.some((o) => o.at > h.at && o.at <= h.at + 1));
    if (!room.length) return undefined;
    return { kind, at: rng.pick(room).at };
  }
  // `hole`, and never the metrically strongest onset the figure has: removing
  // that is not a gap, it is the figure falling over.
  const strength = (h: { at: number }) => metricStrength(h.at, slotsPerBar, groups);
  const top = Math.max(...figure.hits.map(strength));
  const weak = movable.filter((h) => strength(h) < top);
  if (!weak.length) return undefined;
  return { kind: 'hole', at: rng.pick(weak).at };
}

/**
 * Apply the song's signature to whichever figure is about to be played.
 *
 * Returns the figure untouched where the slot it names is not in it, which is
 * the case a cast makes reachable: the signature is planned against the *home*
 * figure, and a lift drawn from another table row need not land on the same
 * slots. That is the right answer rather than a missed one — the signature is
 * the song's mark on its own figure, and a chorus that plays a different figure
 * is playing the style's, not this song's.
 *
 * `tail` is the exception to that test, and has to be: it names the slot it is
 * *adding*, which by definition the figure has not got. It declines instead on
 * finding anything already sounding there.
 */
export function signFigure<
  H extends { at: number; dur: number; vel?: number; tone?: BassTone },
  P extends { hits: readonly H[] },
>(figure: P, sig: Signature): P {
  const hits = figure.hits;
  if (sig.kind === 'tail') {
    const head = hits[0];
    if (!head || hits.length !== 1 || sig.at <= head.at) return figure;
    return {
      ...figure,
      hits: [
        // The head gives way to the answer rather than ringing under it: a sub
        // that overlapped its own tail would be two notes at once, which on this
        // layer is mud rather than harmony.
        { ...head, dur: Math.max(1, Math.min(head.dur, sig.at - head.at - 1)) },
        { ...head, at: sig.at, dur: sig.dur, tone: sig.tone, vel: (head.vel ?? 0.85) * 0.86 },
      ] as unknown as readonly H[],
    };
  }
  if (!hits.some((h) => h.at === sig.at)) return figure;
  switch (sig.kind) {
    case 'push':
      return { ...figure, hits: anticipate(hits, { target: sig.at }) };
    case 'hole':
      return { ...figure, hits: hits.filter((h) => h.at !== sig.at) };
    case 'echo': {
      const out: H[] = [];
      for (const h of hits) {
        if (h.at !== sig.at) { out.push(h); continue; }
        // The struck note gives up its last sixteenth to the repeat, so the
        // figure gains an onset and not a beat of length.
        const head = Math.max(1, h.dur - 1);
        out.push({ ...h, dur: head });
        out.push({ ...h, at: h.at + head, dur: 1, vel: (h.vel ?? 0.8) * 0.6 });
      }
      return { ...figure, hits: out.sort((a, b) => a.at - b.at) };
    }
    case 'reach':
      return { ...figure, hits: hits.map((h) => (h.at === sig.at ? { ...h, tone: sig.tone } : h)) };
  }
}

/**
 * The style's figure, played busier or sparser — for the tables that cannot cast
 * a contrast because they have not got one.
 *
 * ## Why a table cannot always be the answer
 *
 * Casting from the table is the better mechanism and it is drawn beside this
 * one, but it has a floor: measured over the catalogue, **169 of 387 styles hold
 * one or two distinct bass rhythms** and 210 hold three, so only ten styles in
 * the whole project have more than three figures to be cast from. A style with
 * one rhythm spelled twice — `countrypolitan`, `shuffle`, `cowboy`, `bebop` —
 * has nothing to swap to at all, and no amount of drawing fixes that.
 *
 * Widening those tables is the right long answer and it is a different job: it
 * is 169 acts of composition, one style at a time, and doing it badly is worse
 * than not doing it. Three have been done — `house/trance`, `house/hardgroove`
 * and `house/techhouse`, the three that measured worst on how many of eight
 * songs came out distinct — and the rest are still two rows apiece. This is what
 * makes the mechanism reach them in the meantime.
 *
 * ## Two operators, and they are the two already trusted here
 *
 * `subdivide` puts two notes where the figure has one, carrying the same payload
 * so the pitch does not move; `thin` drops the onsets the ear expects least,
 * metrically rather than positionally, and guarantees it never leaves a hole.
 * `planFigureVariation` reaches for the same two at a phrase end. The difference
 * is scope, and it is the whole point: a phrase-end gesture happens in one bar,
 * and this is held for the entire section, so it reads as *the figure this
 * section is playing* rather than as a flourish.
 *
 * Neither operator can invent a note the figure did not have or move one to a
 * pitch the harmony did not offer, so a derived figure is exactly as safe as the
 * one it came from: `thin` only removes hits and `subdivide` only duplicates a
 * payload at a later slot, so the declared span never grows and every figure
 * `unplaceableRoots` cleared stays cleared.
 *
 * ## What it declines
 *
 * **A cycled figure**, for `planFigureVariation`'s reason: a figure that carries
 * a cycle is supposed to drift against the bar, and changing how many onsets it
 * has changes the drift itself rather than the figure. Those are also the
 * patterns that measured healthiest, so they are the ones least in need of it.
 *
 * **A walking bass**, whose `hits` are not played at all — `generateBass` hands
 * it to `generateWalkingBass` and never looks at them.
 */
function derive<P extends { hits: readonly { at: number; dur?: number }[]; cycle?: number; walking?: boolean }>(
  home: P,
  dir: 'busier' | 'sparser',
  opts: { rng: Rng; slotsPerBar: number; groups?: readonly number[] },
): P | undefined {
  if (home.cycle || home.walking) return undefined;
  const { rng, slotsPerBar, groups } = opts;

  if (dir === 'sparser') {
    // Climb the threshold until something actually goes. A figure already made
    // of nothing but downbeats is not thinnable, and returning it unchanged
    // would be casting a second copy of the home figure.
    for (const keepAbove of [2, 3, 4]) {
      const out = thin(home.hits, { slotsPerBar, ...(groups ? { groups } : {}), keepAbove });
      if (out.length < home.hits.length) return { ...home, hits: out } as P;
    }
    return undefined;
  }

  /**
   * Longest first, because the longest note is the one with room in it. One
   * split most of the time and two occasionally: the point is a busier bar, and
   * a figure with every long note halved is a different part rather than the
   * same part played harder.
   */
  const targets = [...new Set(home.hits.filter((h) => (h.dur ?? 0) >= 2).map((h) => h.at))]
    .sort((a, b) => Math.max(...home.hits.filter((h) => h.at === b).map((h) => h.dur ?? 0))
      - Math.max(...home.hits.filter((h) => h.at === a).map((h) => h.dur ?? 0)));
  if (!targets.length) return undefined;
  let hits = home.hits;
  for (const at of targets.slice(0, rng.chance(0.35) ? 2 : 1)) hits = subdivide(hits, { target: at });
  return hits.length > home.hits.length ? { ...home, hits } as P : undefined;
}

/**
 * Cast a song's figures for one layer.
 *
 * `home` is passed in rather than drawn here, and that is the whole reason this
 * change is additive. It is still the draw `song.ts` has always made off the
 * main stream in the position it has always made it, so every song keeps its
 * form, key, tempo, instruments, melody and drums exactly — see the note on
 * `drumSource` in `song.ts` for what one number taken out of that stream cost
 * the last time. The draws below come from a stream of this layer's own, so a
 * style that declares `swap: 0` constructs nothing and consumes nothing.
 *
 * ## Where the contrast comes from
 *
 * Two sources, and they are peers rather than a fallback chain. The table's own
 * rows are searched first — a row that both contrasts in rhythm with home and
 * moves the right way (denser for the lift, sparser for the drop), or failing
 * that any row that contrasts in rhythm at all, because a contrast in the wrong
 * direction is still a contrast and no contrast is what this replaces. Then the
 * home figure *derived*, per `derive`.
 *
 * **A fallback chain was tried first and measured nearly dead.** Deriving only
 * where the table had nothing left fired for 15 styles out of 387 — every other
 * table has some second rhythm in it — and moved the catalogue by four styles.
 * The derived figure is not a worse answer than a second table row, it is a
 * different kind of answer: a band playing its own figure harder, rather than
 * the band playing its other figure. Both are things that happen on records, so
 * both are drawn, and a third of the time it is the derived one.
 *
 * Where neither source has anything, a **same-rhythm row** is the last resort,
 * kept because it is not nothing: `berlin`'s `octave-pulse` lands on the same
 * four slots as its `eighth-pulse` and walks root–octave–fifth–octave where the
 * other stands on the root, and a chorus that does that has lifted.
 */
export function castFigures<
  P extends {
    weight: number; hits: readonly { at: number; dur?: number }[]; cycle?: number; walking?: boolean;
  },
>(
  table: readonly P[],
  home: P,
  opts: {
    rng: Rng; swap: number; slotsPerBar: number; groups?: readonly number[];
    /**
     * The table row `home` came from, where a signature has made the two
     * different objects. Without it the unsigned original is still in the pool
     * and is the likeliest thing drawn against it — a chorus playing the same
     * figure with the song's own mark rubbed off, which is the one contrast
     * worth less than none. Defaults to `home`, which is right whenever no
     * signature was applied. See `planSignature`.
     */
    origin?: P;
  },
): FigureCast<P> {
  const { rng, swap, slotsPerBar } = opts;
  if (swap <= 0) return { home };

  const origin = opts.origin ?? home;
  const others = table.filter((p) => p !== home && p !== origin && p.weight > 0);
  const homeDensity = density(home, slotsPerBar);
  const weighted = (pool: readonly P[]): P | undefined =>
    (pool.length ? rng.weightedBy(pool, (p) => p.weight) : undefined);

  /**
   * How often the derived figure wins over the table row, and it is a function
   * of how much table there is.
   *
   * **A flat third was measured and it made songs converge.** Reaching into the
   * table for a contrast means a song plays more of the table, and on a table of
   * two or three that means every song plays nearly all of it: `latin/son` has
   * two rows and its profile similarity — how much of two songs' playing time is
   * spent on the same material — went from 0.51 to 0.85, richer songs that were
   * *less* distinguishable from each other. Over the whole catalogue the
   * three-row bucket went 0.39 to 0.47 and the four-plus bucket 0.21 to 0.29,
   * while the two-row bucket held at 0.70 because it was already saturated.
   *
   * So the thinner the table, the more the contrast should come from the song's
   * own figure rather than from the shared vocabulary. Two rows derives four
   * times in five; six rows derives one time in five and spends the table it
   * has, which is what a table that large is for.
   */
  const deriveOdds = Math.max(0.2, Math.min(0.8, 1.4 / Math.max(1, table.length)));

  /** The search above, for one role. */
  const cast = (pool: readonly P[], dir: 'busier' | 'sparser', wanted: (d: number) => boolean) => {
    const fromTable = weighted(pool.filter((p) => !sameShape(p, home) && wanted(density(p, slotsPerBar))))
      ?? weighted(pool.filter((p) => !sameShape(p, home)));
    const derived = derive(home, dir, {
      rng, slotsPerBar, ...(opts.groups ? { groups: opts.groups } : {}),
    });
    if (fromTable && derived) return rng.chance(deriveOdds) ? derived : fromTable;
    return fromTable ?? derived ?? weighted(pool);
  };

  const lift = rng.chance(swap) ? cast(others, 'busier', (d) => d >= homeDensity) : undefined;
  /**
   * A shade less likely than the lift, because a bridge is the section a form is
   * likeliest not to have and a solo is the one a listener is likeliest to hear
   * as the same music with somebody blowing over it. A song that gets a lift and
   * no drop is a normal arrangement; the reverse is rarer and this makes it so.
   */
  const left = others.filter((p) => p !== lift);
  const drop = rng.chance(swap * 0.75)
    ? cast(left, 'sparser', (d) => d <= homeDensity)
    : undefined;

  // Both roles are drawn from `others` or derived, so neither can be the home
  // figure itself; the one thing left to refuse is the drop repeating the lift,
  // which a two-row table would otherwise produce.
  return {
    home,
    ...(lift ? { lift } : {}),
    ...(drop && drop !== lift ? { drop } : {}),
  };
}

/** Which of the cast plays this section. */
export function sectionFigure<P>(cast: FigureCast<P>, kind: SectionKind): P {
  if (kind === 'chorus') return cast.lift ?? cast.home;
  if (kind === 'bridge' || kind === 'solo') return cast.drop ?? cast.home;
  return cast.home;
}

/**
 * The phrase length this file *prefers*, which for eighteen genres out of
 * nineteen is simply the answer.
 *
 * Measured over all 649 form steps in the nineteen genres: 375 are eight bars,
 * 135 sixteen, 100 four, 25 thirty-two, one twenty-four, and **thirteen are
 * not a multiple of four** — nine six-bar steps and four two-bar ones, every one
 * of them indian, whose own header says its unit is four to eight bars where
 * every other genre's is eight to sixteen. So four is a preference rather than a
 * fact, and `phraseBars` below is what turns it into one section's answer.
 */
const PHRASE_BARS = 4;

/**
 * How many bars **this section** turns over in.
 *
 * A phrase-end gesture is a boundary marker, and the whole of its meaning is
 * that the ear was already arriving somewhere and the player agreed with it. So
 * there is exactly one requirement on this number: the section has to divide by
 * it. A gesture on bar four of a six-bar section — which is what a constant
 * produced — marks nothing, because bar four is not a boundary of anything. It
 * is a figure varied in the middle of a phrase, which is not wrong output and is
 * not the gesture either.
 *
 * Hence **the longest phrase no longer than four that the section divides
 * into**: four wherever four divides it, which is every form step in the
 * catalogue but thirteen; three in a six-bar section; two in a two-bar one.
 *
 * Longest rather than shortest, because a phrase end is meant to be rare. Six
 * divides by two as well as by three, and in twos it would put two gestures
 * inside a six-bar section; in threes it puts one, on the section's own
 * midpoint, which is the strongest division a six-bar section has and the only
 * one a listener is counting toward.
 *
 * ## Both refusals are the rule that is already there
 *
 * `figureFor` declines the section's last bar, and that one clause answers both
 * awkward lengths without a second guard being written for either:
 *
 *  - **A two-bar section gets nothing.** Its phrase is two, so its only phrase
 *    end is bar two, which is the last bar. That is the sentence `figureFor`
 *    already writes about a four-bar intro — one phrase, no phrase end inside
 *    it — arriving at a different length, and it is the right answer on the
 *    music. A two-bar intro is a single gesture; varying its opening bar would
 *    be varying the figure before it has finished being stated, and firing once
 *    in two bars is worse than not firing.
 *  - **A section that no phrase divides gets nothing.** A length that is prime
 *    and over four returns itself, so its one candidate is again the last bar.
 *    No form in the catalogue is such a length; what matters is that the
 *    fallback is silence rather than an invented division.
 *
 * ## Why this is derived where `Style.dropBars` is declared
 *
 * The drop gesture asks what looks like the same question and answers it the
 * other way, so the difference is worth stating rather than leaving as an
 * inconsistency somebody has to reconcile. A drop is a **span**: four bars is
 * what a dub is on the records whether the section around it is eight bars or
 * sixteen, so its length is half a statement about the idiom, and the idiom half
 * is not derivable from anything the engine knows — which is exactly why
 * `dropBars` had to be a field.
 *
 * This is not a span, it is a **position**, and a position is right precisely
 * when it lands on a boundary the section has. That is arithmetic on a number
 * the caller already passes, so a declared phrase here would add a second table
 * to go stale beside a fact the section is already carrying, and could only ever
 * be wrong in a way nothing would catch.
 *
 * ## Blast radius, measured
 *
 * Every multiple of four returns four, so nothing that phrases in fours moves —
 * and measured over 7,435 sections generated across the nineteen genres, **every
 * section that can reach this function is a multiple of four**. The 213 that are
 * not (177 six-bar, 36 two-bar) are all indian, and no indian style declares
 * `vary`, so `planFigureVariation` returns nothing for them and `figureHits`
 * delegates to `cycleHits` without ever calling here. Confirmed rather than
 * argued: 760 songs across the nineteen genres, MIDI and Strudel hashed either
 * side of this function, **all 760 byte-identical**.
 *
 * So what this removes is a fault that is latent, and the measurement that shows
 * it is worth keeping because nothing else can see it. Forcing `vary` on for
 * every style in every genre and generating the same 760 songs, `figureFor`
 * fires 81,720 times, and exactly one line of the tally moves: the **60
 * variations that land in six-bar sections go from bar four to bar three**, off
 * the middle of the section and onto its midpoint. Eight-, twelve-, sixteen-,
 * twenty-four-, thirty-two- and forty-eight-bar sections keep every landing they
 * had, down to the count; three indian songs change bytes and no song in any
 * other genre does. Two-bar sections fire zero times before and zero after —
 * unchanged output, for a changed reason, which is the point of the two-bar
 * paragraph above.
 *
 * That is the argument for making the change now rather than later: the fault is
 * reachable only through a table edit, and it is cheaper to remove while nothing
 * is standing on it.
 */
function phraseBars(bars: number): number {
  for (let n = PHRASE_BARS; n >= 2; n--) if (bars % n === 0) return n;
  return bars;
}

/**
 * What this section's player does, or nothing.
 *
 * The same shape as `planKitVariation` immediately below it, and drawn the same
 * way: once per section, from a stream of its own. A style that declares no
 * `vary` never reaches this and never constructs the stream, which is what keeps
 * the change additive — see the note on `drumSource` in `song.ts` for what one
 * number taken out of a shared stream cost the last time.
 */
export function planFigureVariation(
  pattern: {
    hits: readonly { at: number; dur: number }[];
    cycle?: number;
    /** See the `fill` guard below. */
    arpeggio?: boolean;
  },
  opts: { chance: number; rng: Rng; slotsPerBar: number; groups?: readonly number[] },
): FigureVariation | undefined {
  const { chance, rng, slotsPerBar, groups } = opts;
  // A figure that carries a cycle is *supposed* to drift against the bar, and
  // bending one bar of it fights the thing it was written to do. `Cycle` in
  // `style/types.ts` makes the same argument from the other side.
  if (chance <= 0 || pattern.cycle) return undefined;
  if (!rng.chance(chance)) return undefined;

  // Never the downbeat: pushing bar one's first note means writing into the bar
  // before it, which is composition across a barline and is not this function's
  // business. Otherwise a gesture lands on something the ear was already waiting
  // for, which is what `metricStrength` is for.
  const strong = pattern.hits.filter(
    (h) => h.at > 0 && metricStrength(h.at, slotsPerBar, groups) >= 2,
  );
  if (!strong.length) return undefined;

  /**
   * `fill` adds an onset, and an arpeggio counts them.
   *
   * `generateComp` carries `step` across the barline on purpose — the figure and
   * the bar drifting out of phase is the whole appeal of a sequenced pattern —
   * so one extra note at bar three re-indexes the ladder for bars four to eight.
   * That is a different part from there on rather than a gesture at a phrase
   * end, and it would make the placement this function exists to guarantee
   * false. `push` moves an onset without adding one and is safe on anything.
   */
  const fillable = pattern.arpeggio ? [] : strong.filter((h) => h.dur >= 2);
  const kind: FigureVariation['kind'] = fillable.length && rng.chance(0.4) ? 'fill' : 'push';
  const pool = kind === 'fill' ? fillable : strong;
  return { kind, at: rng.pick(pool).at };
}

/**
 * The figure as this bar plays it.
 *
 * Phrase ends only, and never the section's last bar — that one already has the
 * drummer's fill on it and is where a seam transition lands, and three gestures
 * in one bar is not an arrangement. A four-bar intro therefore gets nothing at
 * all, which is correct: an intro is one phrase and has no phrase end inside it.
 *
 * How long a phrase is comes from `phraseBars`, off the section's own length, so
 * the sentence above holds at every length rather than only at the one the
 * catalogue mostly uses — a two-bar intro is one phrase too, and gets nothing
 * for the same reason and through the same clause.
 */
function figureFor<T extends { at: number; dur?: number }>(
  hits: readonly T[],
  bar: number,
  bars: number,
  v: FigureVariation,
): readonly T[] {
  if ((bar + 1) % phraseBars(bars) !== 0 || bar >= bars - 1) return hits;
  return v.kind === 'push'
    ? anticipate(hits, { target: v.at })
    : subdivide(hits, { target: v.at });
}

/**
 * Every slot the figure lands on, varied where the phrase turns over.
 *
 * Delegates to `cycleHits` untouched when nothing is varying, which is what
 * makes a style that declares no `vary` byte-identical rather than merely
 * similar. The bar walk below and `cycleHits` agree exactly when the cycle is
 * the bar, and `planFigureVariation` guarantees that by declining to vary a
 * pattern that carries one.
 */
function* figureHits<T extends { at: number; dur?: number }>(
  hits: readonly T[],
  opts: {
    cycle: number; bars: number; slotsPerBar: number; variation?: FigureVariation;
  },
): Generator<{ hit: T; bar: number; slot: number }> {
  if (!opts.variation) {
    yield* cycleHits(hits, opts);
    return;
  }
  for (let bar = 0; bar < opts.bars; bar++) {
    for (const hit of figureFor(hits, bar, opts.bars, opts.variation)) {
      yield { hit, bar, slot: bar * opts.slotsPerBar + hit.at };
    }
  }
}

export function generateBass(
  ctx: PartContext,
  pattern: BassPattern,
  opts: { variation?: FigureVariation; walkup?: WalkupOptions } = {},
): NoteEvent[] {
  if (pattern.walking) return generateWalkingBass(ctx);
  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const slotsPerBar = beatsPerBar * SLOTS_PER_BEAT;
  const out: NoteEvent[] = [];

  /**
   * How far above and below the root this figure reaches — see `spanOf`.
   *
   * Asked through the same helper `unplaceableRoots` asks, so the wall a figure
   * is measured against at authoring time is the wall it is placed against here.
   * A second copy of this arithmetic would be two spellings of one figure with
   * two behaviours, which is the fault that cost 57 figures in nine genres.
   */
  const shape = spanOf(pattern.hits);
  const roots: Midi[] = [];
  for (let bar = 0; bar < chords.length; bar++) roots.push(placeRoot(chords[bar]!.root, shape, roots[bar - 1]));
  const bounce = bounceSlots(pattern.hits);
  const walks = opts.walkup && !pattern.cycle && !pattern.sustain
    ? planWalkups(pattern.hits, chords, roots, {
      slotsPerBar,
      ...opts.walkup,
      after: placeRoot(opts.walkup.tonic, shape, roots[roots.length - 1]),
    })
    : new Map<number, Walkup>();

  for (const { hit, bar, slot } of figureHits(pattern.hits, {
    cycle: pattern.cycle ?? slotsPerBar,
    bars: chords.length,
    slotsPerBar,
    ...(opts.variation ? { variation: opts.variation } : {}),
  })) {
    const walk = walks.get(bar);
    const inBar = slot - bar * slotsPerBar;
    if (walk && inBar >= walk.start) continue;
    const chord = chords[bar]!;
    const nextRoot = roots[bar + 1] ?? roots[0]!;
    const pcs = chordPcs(chord);
    const rootMidi = roots[bar]!;

    {
      /**
       * One table of answers, asked once per pitch this hit names.
       *
       * Lifted out of the body it used to be written inline in so that a glide
       * destination resolves by *exactly* the rules an arrival does — `'fifth'`
       * asks the harmony where the fifth is whether it is where the note starts
       * or where it is going, and a number is semitones from the chord root
       * taken literally in both positions. Two copies of this would have been two
       * spellings of one figure with two behaviours, which is the fault
       * `BassTone`'s own note records costing 57 figures in nine genres.
       */
      const place = (tone: BassTone): Midi => {
        if (!asksTheChord(tone)) {
          // A shape, not an outline: the interval *is* the figure, and the chord
          // does not get a say in it. `placeRoot` has already found the octave
          // that holds the span, so this arrives whole; the clamp is against
          // `SHAPE_CEILING` rather than the register because a figure the
          // placement had to spend the reach on must be allowed to *use* it, and
          // clamping it back would undo the placement in the one bar it was made
          // for. It remains a net and it still folds a figure wider than two
          // octaves — which no instrument in the bass palette can play whole.
          //
          // Nothing reaching this line should ever be folding, and that is now
          // asserted rather than hoped: `npm run genres` names any figure the
          // placement cannot hold before it is ever generated. It did not used
          // to. The check it used to be left to skips a cycled or mixed figure,
          // which is 210 of the catalogue's 497 shapes and every one of the
          // widest eight. See `unplaceableRoots`, which is also where the number
          // two octaves is derived rather than guessed. See `BassTone`.
          return clampToRange(rootMidi + displacementOf(tone), BASS_RANGE[0], SHAPE_CEILING);
        }
        // An outline. The harmony answers, `nearestPc` puts the answer next to
        // the root, and the register has the last word — an octave of a chord
        // tone is the same chord tone, so folding one costs nothing.
        let midi: Midi;
        switch (tone) {
          case 'fifth':
            // A fifth the figure bounces on sits below a high root, as a hand on a bass does.
            midi = bounce.has(hit.at) && rootMidi >= BASS_HOME ? rootMidi - 5 : rootMidi + 7;
            break;
          case 'third':
            midi = nearestPc(pcs[1] ?? chord.root, rootMidi + 2);
            break;
          case 'seventh':
            midi = nearestPc(pcs[3] ?? pc(chord.root + 10), rootMidi + 2);
            break;
          case 'approach':
            midi = approachNote(rootMidi, nextRoot, rng);
            break;
        }
        return clampToRange(midi, BASS_RANGE[0], BASS_RANGE[1]);
      };

      const midi = place(hit.tone);
      const velocity = (hit.vel ?? 0.85) * rng.float(0.94, 1.0);
      out.push({
        beat: startBeat + slot / SLOTS_PER_BEAT,
        // A note the walk takes over from gives way to it rather than ringing under it.
        duration: (walk ? Math.min(hit.dur, walk.start - inBar) : hit.dur) / SLOTS_PER_BEAT,
        midi,
        velocity,
        ...bendOf(hit, midi, place),
      });
    }
  }
  for (const [bar, walk] of walks) {
    for (const { slot, midi, velocity } of walk.notes) {
      out.push({
        beat: startBeat + (bar * slotsPerBar + slot) / SLOTS_PER_BEAT,
        duration: walk.dur / SLOTS_PER_BEAT,
        midi,
        velocity,
      });
    }
  }
  out.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
  return pattern.sustain ? mergeHeld(out) : out;
}

/** What a bass walks into a chord change with, and the stream it draws that from. */
export interface WalkupOptions {
  /** Chance per bar whose root changes, 0..1. */
  chance: number;
  rng: Rng;
  scale: (chord: Chord) => Scale;
  /** The section's key, which its last bar walks towards: the next section is not written yet. */
  tonic: Pc;
  /** The song ends with this section, so its last bar has nothing to walk into. */
  final?: boolean;
}

/** One bar's walk: the figure stops at `start` and these notes arrive on the next root. */
interface Walkup {
  start: number;
  dur: number;
  notes: { slot: number; midi: Midi; velocity: number }[];
}

/**
 * The slots at which a `fifth` is a bounce off the root rather than a step in a
 * line: both neighbours in the figure are the root, so the fifth may sit below.
 */
function bounceSlots(hits: readonly BassHit[]): Set<number> {
  const sorted = [...hits].sort((a, b) => a.at - b.at);
  const grounded = (h: BassHit): boolean => h.tone === 'root' || h.tone === 0 || h.tone === 'approach';
  const out = new Set<number>();
  const n = sorted.length;
  // An echo of the fifth is the same note, so the neighbour is the nearest hit on another tone.
  const beside = (i: number, dir: 1 | -1): BassHit | undefined => {
    for (let k = 1; k < n; k++) {
      const h = sorted[(((i + dir * k) % n) + n) % n]!;
      if (h.tone !== 'fifth') return h;
    }
    return undefined;
  };
  sorted.forEach((h, i) => {
    if (h.tone !== 'fifth' || h.glide !== undefined) return;
    const prev = beside(i, -1);
    const next = beside(i, 1);
    if (!prev || !next) return;
    // Struck together with the root it is a voicing, and the root stays the floor.
    if (prev.at === h.at || next.at === h.at) return;
    if (grounded(prev) && grounded(next)) out.add(h.at);
  });
  return out;
}

/** The scale steps climbing to a root from below it. */
function turnaround(scale: Scale, to: Midi, steps: number): Midi[] {
  if (!isInScale(scale, to)) return [];
  const out: Midi[] = [];
  for (let n = steps; n >= 1; n--) {
    const midi = stepInScale(scale, to, -n);
    if (midi >= BASS_RANGE[0]) out.push(midi);
  }
  return out;
}

/** The scale steps strictly between two roots, or the chromatic neighbour when they are a tone apart. */
function walkLine(scale: Scale, from: Midi, to: Midi): Midi[] {
  if (!isInScale(scale, from) || !isInScale(scale, to)) return [];
  const steps = scaleStepsBetween(scale, from, to);
  const dir = Math.sign(steps);
  const out: Midi[] = [];
  for (let n = 1; n < Math.abs(steps); n++) out.push(stepInScale(scale, from, n * dir));
  if (!out.length && Math.abs(to - from) === 2) out.push(to - dir);
  return out;
}

/**
 * Where the bass walks into the next chord, and with what.
 *
 * The walk takes the last beats of the bar at the figure's own pulse, never
 * faster than eighths or slower than quarters, and never the downbeat. It is
 * declined where either root is outside the scale, so a chromatic chord keeps
 * the figure's own approach. A phrase end on an unchanged chord walks up to
 * the root from below instead, which is the turnaround every two-beat player
 * has.
 */
function planWalkups(
  hits: readonly BassHit[],
  chords: readonly Chord[],
  roots: readonly Midi[],
  opts: WalkupOptions & { slotsPerBar: number; after: Midi },
): Map<number, Walkup> {
  const { slotsPerBar, chance, rng, scale } = opts;
  const out = new Map<number, Walkup>();
  if (!hits.length) return out;
  const sorted = [...hits].sort((a, b) => a.at - b.at);
  const gaps = sorted.slice(1).map((h, i) => h.at - sorted[i]!.at);
  const pulse = Math.max(2, Math.min(4, gaps.length ? Math.min(...gaps) : 4));
  const room = Math.min(4, slotsPerBar / pulse - 1);
  if (slotsPerBar % pulse !== 0 || room <= 0) return out;
  const dur = Math.min(pulse, Math.max(...hits.map((h) => h.dur)));
  const late = hits.filter((h) => h.at > 0);
  const vel = late.length ? late.reduce((a, h) => a + (h.vel ?? 0.85), 0) / late.length : 0.8;
  const bars = opts.final ? chords.length - 1 : chords.length;
  for (let bar = 0; bar < bars; bar++) {
    const from = roots[bar]!;
    const to = roots[bar + 1] ?? opts.after;
    const phraseEnd = (bar + 1) % phraseBars(chords.length) === 0;
    const same = pc(from) === pc(to);
    if (same && !phraseEnd) continue;
    // A phrase end is where a player most wants to be heard arriving.
    if (!rng.chance(Math.min(1, chance * (phraseEnd ? 1.5 : 1)))) continue;
    const key = scale(chords[bar]!);
    const line = same
      ? turnaround(key, to, Math.min(room, 3))
      : walkLine(key, from, to).slice(-room);
    if (!line.length) continue;
    // One note is an approach the figure may already have; two is a walk.
    if (line.length === 1 && room >= 2) line.unshift(from);
    const start = slotsPerBar - line.length * pulse;
    out.set(bar, {
      start,
      dur,
      notes: line.map((midi, i) => ({ slot: start + i * pulse, midi, velocity: vel * rng.float(0.94, 1.0) })),
    });
  }
  return out;
}

/**
 * The travelling half of a hit, or nothing at all.
 *
 * Spread into the note rather than assigned, so a hit with no `glide` produces a
 * `NoteEvent` with no `bend` key on it — not one with `bend: undefined`. That
 * distinction is invisible to every consumer and visible to `JSON.stringify`,
 * and this project ships an IR that other things read.
 *
 * Two ways a declared glide comes back empty, and both are right:
 *
 *  - **The destination resolved to the pitch the note is already on.** A
 *    `glide: 'fifth'` over a chord whose fifth is where the shape already put
 *    the note is a note that does not move, and publishing a zero bend to say so
 *    would put a field on a note to record a decision with no consequence —
 *    `planRamp` returns `undefined` for a drawn `none` on exactly this argument.
 *  - **`glideTime` is clamped into `0..1`,** so the bend can never outlive the
 *    note it is written on. `NoteBend.beats` asks renderers to clamp as well and
 *    they do, because two later passes shorten notes after this runs; this is the
 *    near end of the same guarantee, where the figure is still in view.
 *
 * The destination is resolved *after* the velocity draw, which is not
 * housekeeping. `place` reaches `rng` for one tone — `'approach'` — so resolving
 * a destination can cost a number; taking it after velocity means every hit that
 * does not glide walks the identical stream it walked before this file changed,
 * and the cost falls only on the style that asked.
 */
function bendOf(
  hit: BassHit,
  midi: Midi,
  place: (tone: BassTone) => Midi,
): { bend?: NoteBend } {
  if (hit.glide === undefined) return {};
  const to = place(hit.glide);
  if (to === midi) return {};
  const share = Math.min(1, Math.max(0, hit.glideTime ?? 1));
  return { bend: { semitones: to - midi, beats: (hit.dur / SLOTS_PER_BEAT) * share } };
}

/**
 * Join notes that are the same pitch and meet end to end into one long note.
 *
 * The difference between a pedal and a pulse, and audible long before it is
 * theoretical: at 60 BPM a re-articulated whole note is an attack every four
 * seconds, which the ear reads as a part being played. Held through, the same
 * pitches are one sustained tone that the rest of the arrangement moves over.
 *
 * Grouped by pitch before merging, because the parts that most want this are
 * chordal: a four-note voicing repeated bar after bar is four independent held
 * tones, and a scan that only ever compared each note to the one before it in
 * time would never find its own pitch again through the three notes stacked on
 * top of it.
 *
 * The tolerance is a sixteenth of a beat, so a pattern that leaves a deliberate
 * breath — a `dur` short of the full bar — keeps it.
 */
function mergeHeld(notes: NoteEvent[]): NoteEvent[] {
  const byPitch = new Map<Midi, NoteEvent[]>();
  for (const n of notes) {
    const arr = byPitch.get(n.midi);
    if (arr) arr.push({ ...n });
    else byPitch.set(n.midi, [{ ...n }]);
  }

  const out: NoteEvent[] = [];
  for (const voice of byPitch.values()) {
    voice.sort((a, b) => a.beat - b.beat);
    let held: NoteEvent | undefined;
    for (const note of voice) {
      /**
       * **A travelling note neither absorbs nor is absorbed.** This merge
       * matches on written pitch and end-to-end contact, and a note carrying a
       * `bend` is not on its written pitch when it finishes — extending one
       * would hold a destination the figure never asked to sustain, and letting
       * one be swallowed would delete the arrival the glide exists to reach.
       *
       * It fires where `sustain` and `glide` meet, which is not a hypothetical
       * pairing: a Reese is a held bass note that moves, so the first style to
       * want both is the one this feature was built for.
       */
      if (held && !held.bend && !note.bend
        && Math.abs(held.beat + held.duration - note.beat) < 0.0625) {
        held.duration = note.beat + note.duration - held.beat;
        continue;
      }
      out.push(note);
      held = note;
    }
  }
  return out.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
}

/**
 * A true walking bass line.
 *
 * The fixed-degree patterns cannot produce one: a walking line is defined by
 * *connection*, not by which chord tone lands on which beat. The rules a bass
 * player actually follows are —
 *
 *  - beat 1 is the chord root, so the harmony is unambiguous,
 *  - the last beat approaches the next root by a semitone (or a fifth above it),
 *  - and the beats in between move mostly by step toward that approach note,
 *    preferring chord tones but taking scale tones freely.
 *
 * The result is a line that walks somewhere rather than outlining a chord in
 * place, which is the whole point.
 */
function generateWalkingBass(ctx: PartContext): NoteEvent[] {
  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const out: NoteEvent[] = [];
  let previous: Midi | undefined;

  for (let bar = 0; bar < chords.length; bar++) {
    const chord = chords[bar]!;
    const next = chords[bar + 1] ?? chords[0]!;
    const barStart = startBeat + bar * beatsPerBar;
    const tones = chordPcs(chord);

    // Beat 1: the root, kept near where the previous bar left off.
    const root = clampToRange(
      previous === undefined ? nearestPc(chord.root, BASS_HOME) : nearestPc(chord.root, previous),
      BASS_RANGE[0], BASS_RANGE[1],
    );
    const beats = Math.max(1, Math.round(beatsPerBar));
    const line: Midi[] = [root];

    // Final beat: approach the next root, usually chromatically from below.
    const nextRoot = nearestPc(next.root, root);
    const approach = clampToRange(
      rng.weighted([
        [nextRoot - 1, 5],
        [nextRoot + 1, 3],
        [nearestPc(pc(next.root + 7), root), 2],
      ] as const),
      BASS_RANGE[0], BASS_RANGE[1],
    );

    // Middle beats: step from the root toward the approach note.
    for (let b = 1; b < beats - 1; b++) {
      const from = line[line.length - 1]!;
      const remaining = beats - 1 - b;
      const gap = approach - from;
      const ideal = from + Math.round(gap / (remaining + 1));
      const candidates: (readonly [Midi, number])[] = [];
      for (let semi = -4; semi <= 4; semi++) {
        const cand = from + semi;
        if (cand < BASS_RANGE[0] || cand > BASS_RANGE[1] || cand === from) continue;
        const stepSize = Math.abs(semi);
        // A walking line walks: the overwhelming majority of its motion is by
        // semitone or tone, with the one real leap saved for the arrival on the
        // next root. Pulling too hard toward the target turns every beat into a
        // leap, so the target is a lean rather than a destination.
        let w = stepSize <= 2 ? 7 : stepSize === 3 ? 1.2 : stepSize === 4 ? 0.6 : 0.15;
        w *= Math.exp(-Math.abs(cand - ideal) / 5);
        if (tones.includes(pc(cand))) w *= 2.2;
        candidates.push([cand, w]);
      }
      line.push(candidates.length ? rng.weighted(candidates) : from);
    }
    if (beats > 1) line.push(approach);

    for (let b = 0; b < line.length; b++) {
      out.push({
        beat: barStart + b,
        duration: 0.92,
        midi: line[b]!,
        velocity: (b === 0 ? 0.95 : 0.82) * rng.float(0.95, 1.02),
      });
    }
    previous = line[line.length - 1];
  }
  return out;
}

/**
 * Walk into the next chord's root from a semitone or whole tone away.
 * The chromatic approach from below is the strongest and most common.
 */
function approachNote(from: Midi, target: Midi, rng: Rng): Midi {
  const options: (readonly [Midi, number])[] = [
    [target - 1, 4],
    [target + 1, 2],
    [target - 2, 2],
    [nearestPc(pc(target + 7), from), 2],
  ];
  return rng.weighted(options);
}

/**
 * The rungs an arpeggio walks, in the order it walks them.
 *
 * Built from a voicing rather than from a chord, so it inherits the voice
 * leading: the ladder for bar two sits where bar one's ladder left off, and the
 * figure moves as little as the harmony did. That is the whole reason this
 * takes a voicing and not a `Chord`.
 *
 * `updown` and `downup` drop the turn-round notes rather than repeating them —
 * four rungs give six steps, not eight. Repeating the top and the bottom is
 * what a cheap arpeggiator does and it puts an accidental accent on both ends
 * of the figure; a sequencer with the same six steps punched into it does not.
 * The length is the point as much as the shape: six against a sixteen-step bar
 * comes back round every three bars, where four came back round every one.
 *
 * A two-rung ladder has no turn-round to drop, so the up-and-down modes fall
 * back to the plain walk rather than emitting a one-note figure.
 */
function arpLadder(voicing: Midi[], pattern: CompPattern): Midi[] {
  const octaves = Math.max(1, Math.round(pattern.arpOctaves ?? 1));
  const rungs: Midi[] = [];
  for (let o = 0; o < octaves; o++) for (const midi of voicing) rungs.push(midi + o * 12);
  const fold = (up: Midi[]) => (up.length > 2 ? [...up, ...up.slice(1, -1).reverse()] : up);
  switch (pattern.arpDirection ?? 'up') {
    case 'down': return rungs.slice().reverse();
    case 'updown': return fold(rungs);
    case 'downup': return fold(rungs.slice().reverse());
    default: return rungs;
  }
}

export function generateComp(
  ctx: PartContext,
  pattern: CompPattern,
  centre: Midi,
  /** Needed for quartal voicings, which draw on the scale rather than the chord. */
  scaleFor?: (chord: Chord) => Scale,
  /** Register discipline from the arranger — see `generate/arrange.ts`. */
  limits: { ceiling?: Midi; clarity?: number } = {},
  /** How far this player departs from the figure. Absent means they do not. */
  comping?: CompingProfile,
  /**
   * What this section's comper does at its phrase ends. See `FigureVariation`.
   *
   * Read in both places the figure is walked, and it has to be: the first builds
   * the set of slots the pattern occupies so an anticipated chord does not land
   * on one twice, and a set built from the plain figure would be wrong about the
   * varied one — which is a flam rather than a rounding error.
   */
  variation?: FigureVariation,
): NoteEvent[] {
  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const slotsPerBar = beatsPerBar * SLOTS_PER_BEAT;
  const out: NoteEvent[] = [];
  // A multi-octave arpeggio needs somewhere to climb *to*, and the one place it
  // must not climb into is the melody's register — which is exactly what the
  // arranger's ceiling is there to protect. So the extra octaves are bought by
  // voicing the chord lower rather than by letting the figure rise higher: the
  // top of the ladder ends up where the top of a one-octave figure would have
  // been, and the pattern gets its span without spending the tune's headroom.
  const climb = pattern.arpeggio ? (Math.max(1, Math.round(pattern.arpOctaves ?? 1)) - 1) * 12 : 0;
  // With a ceiling in force the window is anchored to it rather than to the
  // instrument's centre: a comp given five semitones to voice a seventh chord
  // in has no choice but to make a cluster, so it is given a proper octave and
  // a bit underneath the tune instead.
  const hi = (limits.ceiling ?? centre + 12) - climb;
  const lo = limits.ceiling !== undefined ? Math.min(centre - 10 - climb, hi - 17) : centre - 10 - climb;
  // Runs across barlines on purpose — see `arpeggio` in style/types.ts.
  let step = 0;

  /**
   * Every bar's voicing, decided before a hit is placed.
   *
   * Voicings are led bar to bar — each one is chosen to move as little as
   * possible from the one before — and a cycle that straddles a barline needs
   * two of them in the same breath. Building the chain up front keeps the voice
   * leading a property of the *harmony*, where it belongs, rather than of the
   * order the figure happened to visit the bars in.
   */
  const voicings: Midi[][] = [];
  let previous: Midi[] | undefined;
  for (const chord of chords) {
    const voicing = voiceChord(chord, {
      voices: pattern.voices,
      centre,
      lo,
      hi,
      style: pattern.voicing ?? 'tertian',
      ...(limits.clarity !== undefined ? { clarity: limits.clarity } : {}),
      ...(scaleFor ? { scale: scaleFor(chord) } : {}),
      ...(previous ? { previous } : {}),
    });
    voicings.push(voicing);
    previous = voicing;
  }
  /**
   * What the comper does with the figure, bar by bar. See `CompingProfile`.
   *
   * Drawn up front, one set of decisions per bar, for the same reason the
   * voicings are: these are choices a *player* makes about a bar, and drawing
   * them inside the hit loop would make them choices about a hit — two stabs in
   * the same bar, one anticipated and one not, which is not a comper varying
   * their figure, it is two compers.
   *
   * Never on an arpeggiated pattern. Those are sequencer figures whose whole
   * appeal is that they do not vary — a resting bar in a Berlin-school sequence
   * is a fault, not a gesture — and no style that has one declares a profile
   * anyway. The guard is here so that stays true if one ever does.
   */
  const plan = comping && !pattern.arpeggio
    ? chords.map((_, bar) => ({
      /**
       * …except the bar the section lands on, which is never dropped.
       *
       * A comper leaves holes in the middle of a chorus and is *there* for the
       * cadence — the last bar is where the section arrives, and a rhythm
       * section that sat it out would sound like it had lost its place rather
       * than like it was leaving space.
       *
       * It also keeps this gesture out of the ending's way, which is not a
       * coincidence but the same fact seen from the other end. The final bar of
       * the piece is not a bar of the arrangement at all — see `EndingStyle` —
       * and the button is built by recalling whatever the layer was last
       * holding. Resting there changed which note that was, and under a feel
       * that lengthens notes it became one already ringing through the landing,
       * which suppresses the recall: the band's last chord came out as a single
       * held note. `npm run genres` caught it as a feel losing four notes.
       */
      rest: bar < chords.length - 1 && rng.chance(comping.rest),
      anticipate: rng.chance(comping.anticipate),
      /**
       * Which way, decided once for the bar. Zero leaves the figure alone.
       *
       * **A whole beat, not an eighth**, and that is not a musical preference —
       * it is the rule `Feel.displace` already writes down for itself. An offbeat
       * eighth is the one position `applySwing` moves; nudge a stab off it and
       * the note stops being swung, so whether it is swung now depends on which
       * feel is in force. Measured with an eighth: four comp notes went missing
       * between a felt song and its plain twin, and `npm run genres` reports that
       * as a feel losing notes, which is exactly what it should report.
       *
       * A beat keeps the parity — an offbeat stab stays an offbeat stab — and it
       * is the better gesture anyway. Half an eighth either way is a nudge nobody
       * hears; the same stab arriving on the and of one instead of the and of two
       * is a comper playing a different bar.
       */
      displace: rng.chance(comping.displace) ? (rng.chance(0.5) ? SLOTS_PER_BEAT : -SLOTS_PER_BEAT) : 0,
    }))
    : undefined;

  /**
   * The slots an anticipation has taken over, so the figure can leave them free.
   *
   * The last eighth of a bar is where a comp pattern most often already has a
   * hit — `shuffle-stabs` and every other charleston-shaped figure put one on
   * the "and of four" — so an anticipation added there would sound the previous
   * bar's chord and the next bar's chord together, which is not a push, it is
   * two chords at once. Working the slots out before either pass runs is what
   * lets the hit loop simply skip them.
   */
  const anticipated = new Set<number>();
  /** Downbeats the anticipation has already stated, so the bar does not restate them. */
  const landed = new Set<number>();
  /**
   * Every slot the figure already lands on, so a displacement cannot land on one.
   *
   * Two hits moved onto the same slot are two chords struck together — the same
   * chord twice, since they share the bar's voicing — which is a duplicated note
   * at every pitch rather than a variation. It is inaudible as a gesture and very
   * audible downstream: the duplicates travel through the feel passes as one
   * onset group, and a felt song ended up with fewer notes than its plain twin,
   * which `npm run genres` reports as a feel losing notes.
   */
  const occupied = new Set<number>();
  if (plan) {
    for (const { slot } of figureHits(pattern.hits, {
      cycle: pattern.cycle ?? slotsPerBar, bars: chords.length, slotsPerBar,
      ...(variation ? { variation } : {}),
    })) occupied.add(slot);
  }
  if (plan) {
    for (let bar = 1; bar < chords.length; bar++) {
      const play = plan[bar]!;
      if (play.rest || !play.anticipate) continue;
      anticipated.add(bar * slotsPerBar - SLOTS_PER_BEAT / 2);
      /**
       * …and the downbeat itself, which is the half of the gesture that is easy
       * to forget. A chord *anticipated* has arrived; a comper who pushes it
       * ahead of the barline and then hits it again on beat one has not
       * anticipated anything, they have played it twice. On a charleston-shaped
       * figure that is exactly what happened — the push rang into an identical
       * restrike, which the ensemble audit reported as voices doubled at the
       * unison and which is audible as a flam.
       */
      landed.add(bar * slotsPerBar);
    }
  }

  // Built per bar because the voicing is, but the *length* is a property of the
  // pattern rather than of the harmony, so the walk keeps its phase across the
  // whole section — which is the entire reason `step` survives the barline.
  const ladders = pattern.arpeggio ? voicings.map((v) => arpLadder(v, pattern)) : [];

  for (const { hit, bar, slot } of figureHits(pattern.hits, {
    cycle: pattern.cycle ?? slotsPerBar, bars: chords.length, slotsPerBar,
    ...(variation ? { variation } : {}),
  })) {
    const voicing = voicings[bar]!;
    const ladder = ladders[bar];
    const sounding = ladder ? [ladder[step++ % ladder.length]!] : voicing;
    const play = plan?.[bar];
    // A bar the comper sits out. Taken before the hit is placed rather than by
    // filtering afterwards, so a rested bar costs no other decision.
    if (play?.rest) continue;
    // Ceded to the next bar's anticipation — see below. The old chord does not
    // get played *and* pushed aside; the whole gesture is that the new harmony
    // takes that eighth off it.
    if (anticipated.has(slot) || landed.has(slot)) continue;

    let at = slot;
    if (play?.displace && slot % slotsPerBar !== 0) {
      // Moved, but it stays in its own bar and never lands on the downbeat: a
      // stab pushed onto beat one is not a displaced comp, it is a different
      // figure, and one pushed into the next bar is the wrong harmony.
      const moved = slot + play.displace;
      const bar0 = bar * slotsPerBar;
      const free = !occupied.has(moved) && !anticipated.has(moved) && !landed.has(moved);
      if (moved > bar0 && moved < bar0 + slotsPerBar && free) at = moved;
    }

    for (const midi of sounding) {
      out.push({
        beat: startBeat + at / SLOTS_PER_BEAT,
        duration: hit.dur / SLOTS_PER_BEAT,
        midi,
        velocity: (hit.vel ?? 0.65) * rng.float(0.92, 1.0),
      });
    }
  }

  /**
   * The anticipations, added rather than moved.
   *
   * An anticipation is *this* bar's harmony sounding at the end of the bar
   * before it, and that is a chord the figure does not contain — so nudging an
   * existing hit cannot produce one. The first attempt did exactly that, moving
   * a downbeat hit an eighth earlier, and it fired on almost nothing: the blues
   * patterns this was written for state their hits on the second and fourth
   * offbeats and have no downbeat hit to move. A pattern's own rhythm is not
   * where the gesture lives.
   *
   * Placed on the last eighth and held through the barline, which is what makes
   * it read as a push rather than as a stab in a hole. A shade louder for the
   * same reason.
   *
   * Never before bar zero: that lands in the previous section, where the comp
   * from *that* section is still sounding and nothing downstream would clear the
   * overlap. Only the lead layer writes backwards across a seam — see the pickup
   * rules in `generateSong`.
   */
  for (const at of anticipated) {
    const voicing = voicings[Math.round((at + SLOTS_PER_BEAT / 2) / slotsPerBar)]!;
    if (!voicing || voicing.length < 2) continue;
    const velocity = 0.62 * rng.float(0.94, 1.06);
    for (const midi of voicing) {
      // Through the barline and a little past it. An eighth that let go before
      // the bar arrived would be a grace note rather than a push; a whole beat
      // rings into the figure's own next hit and thickens into it.
      out.push({ beat: startBeat + at / SLOTS_PER_BEAT, duration: 0.75, midi, velocity });
    }
  }
  out.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
  return pattern.sustain ? mergeHeld(out) : out;
}

/**
 * The other hand.
 *
 * Everything else in this file writes a part for a *player*. This writes one for
 * a **hand** — the left one, under a line the same person is playing with their
 * right — and that is the only structural idea in it. The notes go into the same
 * layer as the line, so the Song IR carries one track with two things happening
 * in it at once, which is what a piano is.
 *
 * ## Five things, not one
 *
 * This function had one behaviour for as long as there was one style using it,
 * and the behaviour was good enough that it took a second instrument to notice
 * it was also the *only* one. A left hand that exclusively answers in the holes
 * is a real and recognisable sound — it is post-war comping — but a player who
 * did nothing else for four minutes would sound like a player with a tic. See
 * `LeftHandMode` for what the five are and why they are drawn per section.
 *
 * Four of them voice a chord somewhere and the fifth plays a bass line, which
 * is the split worth knowing: `stride` is the only one that reaches below the
 * hand's comping floor, and the only one whose left hand can carry a section
 * with no bass player in it.
 *
 * ## What every mode has in common
 *
 * **It stays out of the right hand's way, by more than a hand's width.**
 * `HandSpec.gap` semitones of daylight, which is three rules at once: it is why
 * a real pianist does not voice there, it is why `keyboardPart` splits the group
 * into two hands on stage, and it is how `melodicLine` gets the tune back out of
 * a track that has an accompaniment interleaved with it. A mode that voiced
 * closer would not merely sound wrong — it would make the part unmeasurable.
 *
 * **It is written against the finished line**, which is the order the playing
 * happens in and the reason this cannot be a second independent generator: the
 * left hand knows what the right hand did, thins out where the right hand is
 * busy, and shuts up entirely when the right hand has the whole bar.
 *
 * **Its anatomy comes from the instrument, not the style.** How low it goes,
 * how many notes it holds and how it stacks them are `HandSpec` — see
 * `style/instruments.ts`, where the piano's rootless shell, the vibraphone's two
 * mallets and the accordion's stradella triad are three different sets of
 * numbers for what used to be one hardcoded hand.
 */
export function generateLeftHand(
  ctx: PartContext,
  /** What the right hand is playing. Already written; this answers it. */
  line: readonly NoteEvent[],
  opts: LeftHandOptions,
): NoteEvent[] {
  const notes = (() => {
    switch (opts.mode) {
      case 'unison': return unisonHand(ctx, line, opts);
      case 'block': return blockHand(ctx, line, opts);
      case 'ostinato': return ostinatoHand(ctx, opts);
      case 'stride': return strideHand(ctx, line, opts);
      default: return answeringHand(ctx, line, opts);
    }
  })();
  /**
   * And say so, once, here.
   *
   * *Being the left hand* is what this function returns, not something any one
   * mode decides — a montuno and a block chord are different gestures and equally
   * the left hand. Marking at the boundary means a mode added later is marked
   * before it is written, which is the failure the earlier modes have already had in
   * a different form: `ostinato` shipped playing single notes and was silently
   * counted as melody for as long as it took someone to notice the jazz line's
   * mean had dropped four semitones. See `NoteEvent.hand`.
   */
  for (const note of notes) note.hand = 'left';
  return notes;
}

export interface LeftHandOptions {
  /** What this hand is doing in this section. See `LeftHandMode`. */
  mode: LeftHandMode;
  /** The instrument's anatomy. See `HandSpec`. */
  spec: HandSpec;
  /**
   * How much the hand speaks, 0..1.
   *
   * Read by `answer` and `block`, which choose whether to place each chord, and
   * ignored by `unison` and `ostinato`, which cannot use it: a unison line that
   * dropped out for one bar in five is not a sparser unison, it is a mistake,
   * and the same is true of a vamp with holes in it. Sparseness in those two is
   * a property of the figure, which is where it belongs.
   *
   * `stride` reads it for half of itself. The chords thin out; the bass notes
   * never do, for the same reason the vamp does not — see `strideHand`.
   */
  density: number;
  /** Needed where the genre voices from the chord scale. */
  scaleFor?: (chord: Chord) => Scale;
  clarity?: number;
  /** The figure, for `ostinato`. Ignored by every other mode. */
  ostinato?: { cycle: number; hits: CompHit[] };
}

/**
 * Where the hand can be, in a bar whose line reaches down to `lineFloor`.
 *
 * From the *lowest* note the right hand touches in the bar rather than from the
 * nearest one, because a hand does not re-voice between two stabs a beat apart:
 * it finds a position for the bar and works in it, which is also why the voice
 * leading has anything to lead.
 *
 * Daylight wins over width where the two conflict. A window squeezed to nothing
 * is a right hand playing in the basement, and the honest answer there is that
 * the left hand has nowhere to go and says nothing — which `roomToVoice` is what
 * the callers ask.
 */
function handWindow(spec: HandSpec, lineFloor: Midi): [Midi, Midi] {
  const hi = Math.min(spec.ceiling, lineFloor - spec.gap);
  return [Math.max(spec.floor, hi - spec.window), hi];
}

/** Below this a "voicing" is a cluster on the bottom note. See `handWindow`. */
function roomToVoice([lo, hi]: [Midi, Midi]): boolean {
  return hi - lo >= 4;
}

/**
 * Is this a chord, or is it one note?
 *
 * `voiceChord` drops voices rather than clustering when the window is tight —
 * correctly, because two notes a semitone apart at A2 is mud and one note is
 * not — so a hand squeezed low enough comes back holding a single pitch. That
 * is fine as a voicing and fatal as a *left hand*: `melodicLine` recovers the
 * tune from a two-handed track by reading a note sounding alone as the right
 * hand, so a lone accompaniment note is not merely thin, it is counted as
 * melody. Measured before this guard: one onset in roughly six hundred, always
 * in the bars where the tune had dropped low enough to squeeze the hand.
 *
 * Silence is the honest answer. A player whose left hand has nowhere to voice
 * does not play half a chord there; they wait for the next bar.
 */
function isChord(voicing: readonly Midi[]): boolean {
  return voicing.length >= 2;
}

/** One chord for the hand, in the window, led from where it last was. */
function handVoicing(
  chord: Chord, [lo, hi]: [Midi, Midi], opts: LeftHandOptions, previous?: Midi[],
): Midi[] {
  // The hand's own clarity wins over the style's where it has one, because it is
  // a fact about the buttons rather than a preference about the arrangement. See
  // `HandSpec.clarity`.
  const clarity = opts.spec.clarity ?? opts.clarity;
  return voiceChord(chord, {
    voices: opts.spec.voices,
    centre: Math.round((lo + hi) / 2),
    lo,
    hi,
    style: opts.spec.voicing,
    ...(clarity !== undefined ? { clarity } : {}),
    ...(opts.scaleFor ? { scale: opts.scaleFor(chord) } : {}),
    ...(previous ? { previous } : {}),
  });
}

/**
 * ANSWER — punctuate where the line has stopped.
 *
 * Not what the comp generator does. A comp pattern is a *figure*: it states two
 * or four hits and repeats them bar after bar, which is right for a rhythm
 * guitar and is the one thing a pianist accompanying themselves never does. This
 * hand is reactive. It punctuates where the right hand has stopped, it pushes
 * ahead of a phrase, and it says nothing at all through a busy passage — because
 * there is only one player and their attention is on the line.
 *
 * Two rules produce that, and each is a thing the alternative gets wrong:
 *
 *  - **It answers, or it punches, and it prefers the offbeat.** Where the line
 *    has stopped, a chord goes in the hole; where the line attacks, a chord can
 *    land *with* it and make the accent. Both are real and the second one is the
 *    one worth insisting on: a left hand that only ever played in the gaps would
 *    alternate with the right hand for four minutes and the two would never once
 *    be seen doing something together, which is not what a piano looks like.
 *  - **It thins out where the right hand is busy**, which is the one thing a
 *    two-part texture written by two independent generators can never do: a bar
 *    of running eighths gets one chord and a bar with air in it gets two.
 */
function answeringHand(
  ctx: PartContext, line: readonly NoteEvent[], opts: LeftHandOptions,
): NoteEvent[] {
  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const out: NoteEvent[] = [];
  const sorted = line.slice().sort((a, b) => a.beat - b.beat);
  let previous: Midi[] | undefined;

  for (let bar = 0; bar < chords.length; bar++) {
    const chord = chords[bar]!;
    const barStart = startBeat + bar * beatsPerBar;
    const barEnd = barStart + beatsPerBar;
    const inBar = sorted.filter((n) => n.beat < barEnd && n.beat + n.duration > barStart);

    const lineFloor = inBar.length ? Math.min(...inBar.map((n) => n.midi)) : opts.spec.lead;
    const window = handWindow(opts.spec, lineFloor);
    if (!roomToVoice(window)) continue;
    const [lo, hi] = window;

    /**
     * How much of the bar the right hand is actually sounding, 0..1.
     *
     * The one number that makes this a part for a *hand* rather than a second
     * player. A generator that did not have it would comp identically through a
     * held whole note and through a bar of running eighths, and the second of
     * those is where a pianist's left hand goes quiet — not out of taste, but
     * because the same person is playing both and the line is where they are.
     */
    // As the *union* of the notes, not the sum of their lengths. The line is
    // written a section at a time and its overlaps are only cleared once it has
    // been concatenated — see `trimOverlaps` — so a plain sum reads a phrase of
    // eighths as more than a bar of sound and pins this to 1, which silenced
    // the left hand almost everywhere. `inBar` is sorted, so one sweep does it.
    let sounding = 0;
    let covered = barStart;
    for (const n of inBar) {
      const from = Math.max(n.beat, covered);
      const to = Math.min(n.beat + n.duration, barEnd);
      if (to > from) { sounding += to - from; covered = to; }
    }
    const busy = Math.max(0, Math.min(1, sounding / beatsPerBar));

    const voicing = handVoicing(chord, [lo, hi], opts, previous);
    previous = voicing;
    if (!isChord(voicing)) continue;

    /**
     * How many chords this bar gets: nought, one, or two.
     *
     * Two is for a bar with room in it. The `busy` term is what takes the second
     * one away as the line fills up, and takes the first one away too once the
     * right hand has the whole bar — at which point the left hand has nothing to
     * say and a real one says nothing.
     */
    if (!rng.chance(opts.density * (1 - busy * 0.25))) continue;
    const want = rng.chance(0.5 * (1 - busy * 0.6)) ? 2 : 1;

    /**
     * Every eighth in the bar, weighted, and the weights are the whole idiom.
     *
     * **Metrically**, the offbeat wins by a wide margin. A left-hand chord on
     * the downbeat lands with the bass and the ride and adds nothing to either;
     * the same chord an eighth later is the anticipation that makes a rhythm
     * section sound like it is listening to itself.
     *
     * **Against the line**, all three relationships are worth having and they
     * are worth different amounts. A hole is the best of them — that is an
     * answer. An attack is next: both hands together, which is the accent and,
     * not incidentally, the only moment the audience sees a pianist play a
     * chord and a note at once. Under a note that is merely sustaining is the
     * quietest of the three and still idiomatic — it is a fill under a held
     * tone — so it is kept and weighted last rather than excluded.
     */
    const slots: (readonly [number, number])[] = [];
    for (let at = barStart; at < barEnd - 1e-6; at += 0.5) {
      const onBeat = Math.abs(at - Math.round(at)) < 1e-6;
      const attacks = inBar.some((n) => Math.abs(n.beat - at) < 1e-6);
      const under = !attacks && inBar.some((n) => n.beat < at && n.beat + n.duration > at + 1e-6);
      const metric = onBeat ? (Math.abs(at - barStart) < 1e-6 ? 1 : 2) : 5;
      slots.push([at, metric * (attacks ? 1.6 : under ? 0.7 : 2.2)]);
    }

    let free = slots;
    for (let k = 0; k < want && free.length; k++) {
      const at = rng.weighted(free);
      // A hand does not play two chords an eighth apart; the next one, if there
      // is one, goes somewhere else in the bar.
      free = free.filter(([b]) => Math.abs(b - at) >= 1);
      const duration = Math.min(
        rng.weighted([[0.5, 5], [0.75, 3], [1.5, 2], [0.25, 2]] as const),
        barEnd - at,
      );
      if (duration < 0.25) continue;
      const velocity = 0.5 * rng.float(0.86, 1.06);
      for (const midi of voicing) out.push({ beat: at, duration, midi, velocity });
    }
  }
  return out.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
}

/**
 * UNISON — both hands playing the same line, an octave apart.
 *
 * The gesture this whole union was built to reach. It is the sound of Corea and
 * of everyone who learned it from him, it is most of what anyone means by
 * "complicated piano jazz", and it was not merely missing before — it was
 * unreachable, because the only thing the left hand could do was voice a chord
 * somewhere, and this is not a chord at all.
 *
 * An octave, not two. Two puts the left hand in the bass player's register and
 * the effect stops being a doubled line and starts being a bass part in the
 * wrong place. Where even one octave will not fit — a line already low, or an
 * instrument whose other hand cannot reach — the note is simply not doubled,
 * which is what a player does with the bottom of a run.
 *
 * The dynamic is the tell. A doubling is played *under* the line rather than
 * with it: a shade quieter, so the octave reads as weight rather than as two
 * people playing.
 */
function unisonHand(
  ctx: PartContext, line: readonly NoteEvent[], opts: LeftHandOptions,
): NoteEvent[] {
  const { spec } = opts;
  const out: NoteEvent[] = [];
  for (const note of line) {
    const midi = note.midi - 12;
    if (midi < spec.floor || midi > spec.ceiling) continue;
    out.push({
      beat: note.beat,
      duration: note.duration,
      midi,
      velocity: note.velocity * 0.82,
    });
  }
  return out.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
}

/**
 * BLOCK — a chord struck *with* the line rather than around it.
 *
 * Locked hands, in the sense that matters: the two move together, so a phrase
 * arrives as a series of harmonised events instead of a tune with comping
 * scattered through it. It is the other half of the post-bop piano vocabulary
 * and the one that makes a passage sound emphatic rather than conversational.
 *
 * **Not full locked-hands harmony**, which would put the melody note in the top
 * of a five-part voicing with chord tones a second and a third below it. That is
 * genuinely how Shearing and Garland voiced it, and it would break the one thing
 * the rest of the system relies on: `melodicLine` recovers the tune from a
 * two-handed track by finding the note standing `gap` above the rest, and a
 * harmonisation that close leaves no daylight to find it by. So this is a left
 * hand locked to the line's rhythm, which is the same gesture from the audience
 * and keeps the part measurable.
 *
 * Only the notes worth landing on. Every attack in a running passage would be a
 * chord on every eighth, which no one plays and which would bury the line it is
 * supposed to be supporting; the accented and the longer notes get the chord,
 * and the rest of the line is left alone.
 */
function blockHand(
  ctx: PartContext, line: readonly NoteEvent[], opts: LeftHandOptions,
): NoteEvent[] {
  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const out: NoteEvent[] = [];
  const sorted = line.slice().sort((a, b) => a.beat - b.beat);
  const slotsPerBar = beatsPerBar * SLOTS_PER_BEAT;
  let previous: Midi[] | undefined;

  for (let bar = 0; bar < chords.length; bar++) {
    const chord = chords[bar]!;
    const barStart = startBeat + bar * beatsPerBar;
    const barEnd = barStart + beatsPerBar;
    const inBar = sorted.filter((n) => n.beat >= barStart - 1e-6 && n.beat < barEnd - 1e-6);
    if (!inBar.length) continue;

    const lineFloor = Math.min(...inBar.map((n) => n.midi));
    const window = handWindow(opts.spec, lineFloor);
    if (!roomToVoice(window)) continue;

    const voicing = handVoicing(chord, window, opts, previous);
    previous = voicing;
    if (!isChord(voicing)) continue;

    for (const note of inBar) {
      const slot = Math.round((note.beat - barStart) * SLOTS_PER_BEAT);
      const strength = metricStrength(slot, slotsPerBar, ctx.style.groups);
      /**
       * Long notes and strong ones. A held note is where a chord has room to
       * sound, and an accented one is where the emphasis was going anyway — so
       * the two together are exactly the passing notes' complement.
       */
      const worth = (note.duration >= 0.75 ? 0.55 : 0) + strength * 0.16;
      if (!rng.chance(Math.min(0.95, opts.density * worth * 1.6))) continue;
      const duration = Math.min(note.duration, barEnd - note.beat);
      if (duration < 0.25) continue;
      for (const midi of voicing) {
        out.push({ beat: note.beat, duration, midi, velocity: note.velocity * 0.72 });
      }
    }
  }
  return out.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
}

/**
 * OSTINATO — a figure that repeats regardless of what the right hand is doing.
 *
 * The montuno, the vamp, the riff the whole band is sitting on. It is the one
 * mode that does not read the line at all, and that indifference is the point:
 * `answer` correctly falls silent under a busy right hand, which is right for
 * conversation and leaves the texture thin in exactly the passage — a long
 * blowing chorus over two chords — where a real trio is at its densest. A vamp
 * does not care that the soloist is busy. That is what a vamp is for.
 *
 * Its window is fixed rather than taken from the bar, for the same reason: a
 * figure that re-voiced itself around whatever the line happened to be doing
 * would not be a repeating figure. It sits under where the line *lives*, which
 * is `HandSpec.lead`, and stays there.
 *
 * The cycle is usually not the bar — see `Cycle` in `style/types.ts`. A montuno
 * that came back round on every downbeat would be a comp pattern with extra
 * steps; the drift against the barline is the whole gesture.
 */
function ostinatoHand(ctx: PartContext, opts: LeftHandOptions): NoteEvent[] {
  const figure = opts.ostinato;
  if (!figure?.hits.length) return [];

  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const slotsPerBar = beatsPerBar * SLOTS_PER_BEAT;
  const window = handWindow(opts.spec, opts.spec.lead);
  if (!roomToVoice(window)) return [];

  const voicings: Midi[][] = [];
  let previous: Midi[] | undefined;
  for (const chord of chords) {
    const voicing = handVoicing(chord, window, opts, previous);
    voicings.push(voicing);
    previous = voicing;
  }

  /**
   * Two notes of the voicing per hit, walking up through it.
   *
   * A montuno is a *shape* made out of a chord rather than the chord struck
   * repeatedly — that is what separates it from a comp figure, and the walking
   * index is the same mechanism as `arpeggio` on a comp pattern, carried across
   * barlines for the same reason.
   *
   * Two rather than one, and this is not a stylistic preference — it is the
   * invariant the whole two-handed IR rests on. `melodicLine` takes a track that
   * has one player's two hands interleaved in it and gets the tune back out by
   * reading **a note sounding alone as the right hand**; a left hand playing
   * single notes in the holes would be read, correctly by that rule and wrongly
   * in fact, as the melody. Measured when this mode first played one note at a
   * time: the reported mean low note of the jazz melody line fell four semitones
   * overnight, which was not a melody that had moved but an accompaniment being
   * counted as one.
   *
   * A dyad costs nothing musically. A left-hand vamp on a piano is a shell — two
   * notes — far more often than it is a single line, and on a vibraphone the
   * left hand *is* two mallets and could not play one note if it wanted to.
   */
  const out: NoteEvent[] = [];
  let step = 0;
  for (const { hit, bar, slot } of cycleHits(figure.hits, {
    cycle: figure.cycle, bars: chords.length, slotsPerBar,
  })) {
    const voicing = voicings[bar]!;
    if (!isChord(voicing)) continue;
    const at = step++ % voicing.length;
    const pair = [voicing[at]!, voicing[(at + 1) % voicing.length]!];
    const beat = startBeat + slot / SLOTS_PER_BEAT;
    const velocity = (hit.vel ?? 0.55) * rng.float(0.9, 1.05);
    for (const midi of new Set(pair)) {
      out.push({ beat, duration: hit.dur / SLOTS_PER_BEAT, midi, velocity });
    }
  }
  return out.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
}

/**
 * STRIDE — the bass note, then the chord, then the bass note again.
 *
 * The oom-pah. The stradella button side, the stride pianist's left hand, the
 * boom-chuck under every dance band that ever played a hall — one gesture with
 * four names, and the only mode here that plays a *bass line*. Every other one
 * finds a chord and puts it somewhere; this one alternates two different things
 * in two different registers, which is why it needed a second register on the
 * instrument (`HandSpec.bass`) before it could exist at all.
 *
 * ## Why it is the mode a solo wants
 *
 * `answer` and `block` are both written against the line, and both correctly
 * thin out as the line fills up — a pianist's left hand really does go quiet
 * through a busy passage. A solo is a busy passage from end to end, so a break
 * accompanied by those two is a break accompanied by almost nothing, which is
 * the opposite of what the left hand is for when the right one is improvising.
 * Stride does not read the line. It keeps the time and states the harmony while
 * the right hand does whatever it likes on top, which is exactly the division of
 * labour that lets one player sound like two.
 *
 * ## The oom is a dyad, not a note
 *
 * The root with its fifth on top. Musically it is the plainest bass gesture
 * there is — a bare fifth is the "oom" of every polka ever charted — and it is
 * also load-bearing: a left hand sounding a *single* note in a hole is read as
 * the melody by the rule `melodicLine` falls back on, so a lone bass note would
 * not merely be thin, it would be counted as the tune. See `isChord`, which is
 * the same fact arriving from the other direction, and `npm run genres`, which
 * asserts it across every mode.
 *
 * ## Which beats are oom and which are pah
 *
 * Two, and the metre picks between them. In four, the bass takes one and three
 * and the chord takes two and four — the humppa, the foxtrot, the march. In
 * three, the bass takes the downbeat alone and the chords take the rest, which
 * is the waltz and is not the same pattern with a beat removed. Everything else
 * alternates from the downbeat and lands somewhere reasonable.
 */
function strideHand(
  ctx: PartContext, line: readonly NoteEvent[], opts: LeftHandOptions,
): NoteEvent[] {
  const bassFloor = opts.spec.bass;
  if (bassFloor === undefined) return [];

  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const out: NoteEvent[] = [];
  const sorted = line.slice().sort((a, b) => a.beat - b.beat);
  const beats = Math.max(1, Math.round(beatsPerBar));
  let previous: Midi[] | undefined;
  /**
   * Root, fifth, root, fifth — across the whole section, not the bar.
   *
   * The alternation is what stops a bass line being a pedal, and it belongs to
   * the *hand* rather than to the bar: a player who reset to the root at every
   * barline would be playing root-fifth-root-fifth in four and root-root-root
   * in three, where what a waltz bass actually does is walk root, fifth, root
   * across three bars. Carried past the barline, like `step` in the comp.
   */
  let alternate = 0;

  for (let bar = 0; bar < chords.length; bar++) {
    const chord = chords[bar]!;
    const barStart = startBeat + bar * beatsPerBar;
    const barEnd = barStart + beatsPerBar;
    const inBar = sorted.filter((n) => n.beat < barEnd && n.beat + n.duration > barStart);

    /**
     * From where the line is, exactly as the answering hand does it.
     *
     * The chord half still has to keep out of the right hand's way — the daylight
     * rule is not relaxed for a mode that also plays a bass note — and the bass
     * half is below the chord by construction, so one window does for both.
     */
    const lineFloor = inBar.length ? Math.min(...inBar.map((n) => n.midi)) : opts.spec.lead;
    const window = handWindow(opts.spec, lineFloor);
    if (!roomToVoice(window)) continue;

    const voicing = handVoicing(chord, window, opts, previous);
    previous = voicing;
    /**
     * A bar whose chord will not voice still gets its bass line.
     *
     * Every other mode returns nothing here and is right to — a hand with
     * nowhere to put a chord has nothing to say. This one does: the bass note is
     * not a voicing and does not need room to be one, and a player whose chord
     * button is unreachable keeps marking the beat with the other row. Written
     * as a `continue` on the chord half rather than on the bar because the
     * accordion needs it in about one bar in three, and an oom-pah that stopped
     * dead in those bars would not be sparse, it would be broken.
     */
    const pah = isChord(voicing) ? voicing : undefined;

    for (let beat = 0; beat < beats; beat++) {
      const at = barStart + beat;
      if (at >= barEnd - 1e-6) break;
      const bass = beats === 3 ? beat === 0 : beat % 2 === 0;

      if (bass) {
        /**
         * The root in the hand's own bass octave, and the fifth seven above it.
         *
         * `clampToRange` over exactly twelve semitones, so the pitch class always
         * survives — a narrower window folds to whatever is nearest and hands
         * back the wrong note, which on a bass line is not a voicing detail but a
         * wrong chord. That is also why the dyad is not pushed below the chord it
         * alternates with: squeezing it under a voicing that has already been
         * placed leaves too little room to keep the octave honest, and on the
         * accordion no room at all. `HandSpec.bass` puts the root under the
         * chord's floor by construction and lets the fifth sit where it likes,
         * which is what the button rows actually do.
         */
        const tone = alternate++ % 2 === 0 ? chord.root : pc(chord.root + 7);
        const root = clampToRange(nearestPc(tone, bassFloor + 6), bassFloor, bassFloor + 11);
        const fifth = root + 7;
        const velocity = 0.6 * rng.float(0.94, 1.04);
        for (const midi of [root, fifth]) {
          out.push({ beat: at, duration: Math.min(0.9, barEnd - at), midi, velocity });
        }
        continue;
      }

      /**
       * The chord, on the offbeat of the pair, and shorter than the bass.
       *
       * Short is the whole character: the "pah" is a stab that gets out of the
       * way before the next bass note, and a chord held to the following beat
       * turns an oom-pah into a pad with a bass line under it. `density` takes
       * the odd one away — the bass never goes, because a bass line with holes
       * in it is a mistake rather than a sparser bass line, which is the same
       * argument `unison` and `ostinato` make about themselves.
       */
      if (!pah || !rng.chance(opts.density)) continue;
      const velocity = 0.46 * rng.float(0.9, 1.06);
      for (const midi of pah) {
        out.push({ beat: at, duration: Math.min(0.55, barEnd - at), midi, velocity });
      }
    }
  }
  return out.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
}

/**
 * Sustained chords, merged across repeated harmony so the pad breathes.
 *
 * Voiced `spread` rather than close. A pad in close position occupies the same
 * few semitones as the comp playing the same chord, and the two stop reading as
 * two layers — the pad becomes thickness rather than colour. Opening the stack
 * out is what gives it its own place in the texture.
 */
export function generatePad(
  ctx: PartContext,
  centre: Midi,
  voices = 4,
  limits: { ceiling?: Midi; clarity?: number } = {},
): NoteEvent[] {
  const { chords, beatsPerBar, startBeat } = ctx;
  const out: NoteEvent[] = [];
  const hi = limits.ceiling ?? centre + 14;
  const lo = limits.ceiling !== undefined ? Math.min(centre - 10, hi - 22) : centre - 10;
  let previous: Midi[] | undefined;

  let bar = 0;
  while (bar < chords.length) {
    const chord = chords[bar]!;
    let span = 1;
    while (
      bar + span < chords.length &&
      chords[bar + span]!.label === chord.label
    ) span++;

    const voicing = voiceChord(chord, {
      voices, centre, lo, hi, style: 'spread',
      ...(limits.clarity !== undefined ? { clarity: limits.clarity } : {}),
      ...(previous ? { previous } : {}),
    });
    previous = voicing;

    for (const midi of voicing) {
      out.push({
        beat: startBeat + bar * beatsPerBar,
        duration: span * beatsPerBar - 0.05,
        midi,
        velocity: 0.42,
      });
    }
    bar += span;
  }
  return out;
}

/**
 * Brass — punctuation, not a third melody.
 *
 * What was here fired a three-note stab on the downbeat of alternate bars
 * behind a coin flip, plus one pickup in the last bar. Measured across 68 songs
 * that carried the layer: **every one of its 1325 notes was exactly half a beat
 * long**, 72% landed on the downbeat and 25% on beat four, and **79% sounded on
 * top of the melody** rather than around it. A brass section that only ever
 * plays eighth-note stabs, always in the same two places, always over the tune,
 * is a sample library demonstrating itself.
 *
 * Brass in this music does three things, and the choice between them belongs to
 * what the melody is doing at that moment:
 *
 *  - **Stabs** in the tune's gaps. Short, often off the beat, answering. This
 *    is the call-and-response gesture the layer exists for, and it has to be in
 *    a *gap* — a stab over a sustained vocal line is a collision, not an answer.
 *  - **Swells** underneath a held note. Where the tune stops moving, the brass
 *    is what stops the arrangement going with it: a long chord that grows under
 *    a held melody note is the oldest trick in dance-band scoring.
 *  - **Punctuation** into the next section, which is the one gesture the old
 *    code had, and it kept it.
 *
 * And, most of the time, nothing at all. A brass section that plays in every
 * bar has no punctuation left to give.
 */
export function generateBrass(
  ctx: PartContext,
  centre: Midi,
  limits: { ceiling?: Midi; clarity?: number } = {},
  opts: {
    /** What the tune is doing. Brass works around it, so it has to know. */
    melody?: readonly NoteEvent[];
    /** How busy this section is; drives how often the brass speaks at all. */
    intensity?: number;
    /**
     * The section's riff, as beat offsets inside a bar, from `Chart.riff`.
     *
     * When the arrangement drew the `riff` device this replaces the search for a
     * hole: the horns play the *same* figure every `every` bars, which is the
     * whole difference between a section that has a horn part and one where a
     * horn section keeps having ideas. Empty means the old behaviour, which is
     * still the right answer for an arrangement whose horns are punctuation.
     */
    figure?: readonly number[];
    /** How often the figure comes round, in bars. */
    every?: number;
    /**
     * Whether this arrangement swells under the tune's long notes.
     *
     * Gated rather than always-on because it is a *device*, drawn per song in
     * `planChart`. Horns that both punctuate and swell in every number are horns
     * with no character; horns that only ever swell are a string section, and
     * that is a describable arrangement rather than an accident.
     */
    swell?: boolean;
  } = {},
): NoteEvent[] {
  const { chords, beatsPerBar, startBeat, rng } = ctx;
  const out: NoteEvent[] = [];
  const hi = limits.ceiling ?? centre + 12;
  const lo = limits.ceiling !== undefined ? Math.min(centre - 9, hi - 15) : centre - 9;
  const melody = (opts.melody ?? []).slice().sort((a, b) => a.beat - b.beat);
  const intensity = opts.intensity ?? 0.9;
  let previous: Midi[] | undefined;

  for (let bar = 0; bar < chords.length; bar++) {
    const chord = chords[bar]!;
    const barStart = startBeat + bar * beatsPerBar;
    const barEnd = barStart + beatsPerBar;
    const isLast = bar === chords.length - 1;

    const voicing = voiceChord(chord, {
      voices: 3, centre, lo, hi,
      ...(limits.clarity !== undefined ? { clarity: limits.clarity } : {}),
      ...(previous ? { previous } : {}),
    });
    previous = voicing;

    const sound = (beat: number, duration: number, velocity: number) => {
      for (const midi of voicing) out.push({ beat, duration, midi, velocity });
    };

    if (isLast) {
      /**
       * Punctuation into whatever comes next — the one gesture worth keeping.
       *
       * Held rather than clipped where the arrangement swells, and that is the
       * same decision as the swell itself rather than a second one: a horn section
       * whose vocabulary is long notes ends a section by leaning into the seam,
       * and one whose vocabulary is stabs ends it by hitting the seam and
       * stopping. Both are punctuation. They are different punctuation.
       */
      const length = opts.swell ? beatsPerBar * 0.9 : 0.75;
      sound(barStart + beatsPerBar - Math.min(2, length), length, 0.7 * intensity);
      continue;
    }

    // Where is the tune resting, and where is it holding?
    const inBar = melody.filter((n) => n.beat < barEnd && n.beat + n.duration > barStart);
    /**
     * A note long enough to be worth growing underneath, wherever in the bar it
     * starts.
     *
     * It used to have to begin in the bar's first beat, which meant the tune had to
     * hold from the downbeat before the horns would answer it — and the note this
     * gesture is *for* is the one a singer lands on at the end of a phrase, three
     * beats in. Half the swells in the repertoire were unreachable.
     */
    const held = inBar.find((n) => n.duration >= 1.5 && n.beat + n.duration >= barStart + 2);

    /**
     * The riff, where the arrangement has one.
     *
     * Played on its own schedule rather than wherever the tune leaves a hole,
     * because that is what makes it recognisable as the same figure coming
     * round — a riff that moved to fit each bar's gaps would be a well-behaved
     * accompaniment and nobody would be able to hum it.
     *
     * What it does yield is *which* of its attacks sound. A horn section playing a
     * figure under a singer who is in the middle of a line drops the notes that
     * would land on top of them and plays the rest, and the figure survives that
     * intact — a riff is recognised from its shape, and three attacks with the
     * second one missing is still the same three attacks.
     *
     * A moving melody note is what gets yielded to; a *held* one is not. The horns
     * playing a figure underneath a long note is the whole gesture, not a
     * collision, and treating those two cases alike is what made this land on the
     * tune a third of the time in the first version.
     */
    const figure = opts.figure ?? [];
    if (figure.length && bar % Math.max(1, opts.every ?? 2) === 0) {
      let played = 0;
      figure.forEach((offset, i) => {
        const at = barStart + offset;
        if (at >= barEnd - 0.05) return;
        const next = figure[i + 1] !== undefined ? barStart + figure[i + 1]! : barEnd;
        const duration = Math.min(0.75, next - at);
        const moving = melody.some((n) => n.duration < 1
          && n.beat < at + duration - 1e-6 && n.beat + n.duration > at + 1e-6);
        if (moving) return;
        const under = inBar.some((n) => n.beat <= at + 1e-6 && n.beat + n.duration > at + 1e-6);
        sound(at, duration, (under ? 0.58 : 0.74) * intensity);
        played++;
      });
      if (played) continue;
    }

    /**
     * The inner coin is high because the outer gate now carries the decision.
     *
     * At 0.45 this was one of two independent rolls — the layer's, and the bar's —
     * which is the stacking the chart exists to remove. An arrangement that drew
     * `swell` has *said* its horns hold under the tune; the only question left is
     * whether this particular long note wants it, and the answer is usually yes.
     */
    if (opts.swell && held && rng.chance(0.8 * intensity)) {
      /**
       * A swell under a held note. Length follows the note it is supporting,
       * so the brass arrives with the tune's long note and leaves with it —
       * which is what makes it read as support rather than as a second part.
       */
      const from = Math.max(barStart, held.beat);
      const length = Math.min(held.beat + held.duration, barEnd) - from;
      if (length >= 1) {
        sound(from, length * 0.94, 0.5 * intensity);
        continue;
      }
    }

    // Otherwise look for a hole to answer into.
    let cursor = barStart;
    let gapStart = barStart;
    let gapLen = 0;
    for (const n of inBar) {
      const gap = n.beat - cursor;
      if (gap > gapLen) { gapLen = gap; gapStart = cursor; }
      cursor = Math.max(cursor, n.beat + n.duration);
    }
    if (barEnd - cursor > gapLen) { gapLen = barEnd - cursor; gapStart = cursor; }

    /**
     * A section whose horns swell does not also pepper the bar with stabs.
     *
     * The stab is the default gesture and the right one for an arrangement whose
     * horns are punctuation. Where the chart drew `swell` instead, it is a
     * *fallback* — the bars with no long note in them — and a horn section that
     * spends the held notes growing underneath the tune and every other bar
     * jabbing at it has no character at all, it has both characters. Halved rather
     * than removed, because a section of pure sustain with nothing ever articulated
     * is a string pad, and these are horns.
     */
    if (gapLen < 0.75 || !rng.chance((opts.swell ? 0.18 : 0.4) * intensity)) continue;

    /**
     * Place the stab off the beat where there is room for it. A brass hit on
     * the downbeat doubles the accent the rhythm section is already making; one
     * an eighth after it is the thing that makes a chart sound scored.
     */
    const onBarline = Math.abs(gapStart - barStart) < 1e-6;
    const offset = gapLen >= 1.5
      ? rng.weighted([[0.5, 5], [1.5, 3], [1, 2], [0, onBarline ? 0 : 3]] as const)
      // A short hole still gets pushed off the barline: a brass hit on the
      // downbeat only thickens the accent the rhythm section already made,
      // where one an eighth later is what makes a chart sound scored.
      : rng.weighted([[0.5, onBarline ? 5 : 2], [0, onBarline ? 1 : 4]] as const);
    const at = gapStart + Math.min(offset, Math.max(0, gapLen - 0.5));
    const duration = rng.weighted([[0.5, 4], [0.25, 3], [0.75, 2], [1.5, 1]] as const);
    sound(at, Math.min(duration, barEnd - at), 0.72 * intensity);
  }
  return out;
}

/**
 * Counter-melody — the line that answers the tune.
 *
 * Call and response between the singer and the accordion (or the sax, or the
 * vibraphone) is a signature of every arrangement style here, and the reason it
 * works is that the answer is *about* the call. What was here before was not:
 * it found a hole in the melody, started on the chord root nearest the
 * instrument's centre, and walked root–third–fifth. Every bar. The same figure
 * from the same starting note, with no memory across barlines and no
 * relationship to the phrase it was supposedly answering. It was decoration,
 * and the ear hears decoration as filler.
 *
 * Three things make it an answer instead:
 *
 *  - **Imitation.** The figure echoes the shape of the lead notes immediately
 *    before the gap, held as scale steps so it transposes onto the current
 *    chord. Sometimes inverted, which is a real device and has the useful side
 *    effect of guaranteeing contrary motion.
 *  - **Continuity.** The line carries across barlines instead of resetting to
 *    the instrument's centre, so it reads as one part rather than as a series
 *    of unrelated fills.
 *  - **Independence where it overlaps.** When the answer does sound against a
 *    held melody note — rare, since it lives in the gaps — it must not double
 *    it at the unison or octave, and must not move in parallel fifths with it.
 *    Two lines moving together are one line.
 *
 * How fast the answer moves is the style's business. An eighth-note figure is
 * right for anything danced to and absurd in ambient, where the holes are bars
 * long and the answer should be a bell, not a run. Everything is expressed in
 * multiples of `counterSpacing` so both come out of the same code.
 */
export function generateCounter(
  ctx: PartContext,
  melody: NoteEvent[],
  centre: Midi,
  opts: {
    /** Where this line may sit. Kept under the lead by the arranger. */
    range?: [Midi, Midi];
    /** The answering instrument's figuration. See `style/instruments.ts`. */
    idiom?: IdiomProfile;
    /** Needed to transpose an imitated shape onto the current harmony. */
    scaleFor?: (chord: Chord) => Scale;
    /**
     * The section's hook, as scale steps.
     *
     * The answer otherwise takes its shape from the lead notes immediately before the
     * gap — the *surface* of the phrase it is answering. That is a real device and it
     * is the smaller one: an answer built from the last four notes echoes whatever
     * just happened, and an answer built from the hook says *I know what this song is
     * about*. Now that the tune has a motif with a shape of its own, the second is
     * available for the first time; before the rewrite there was nothing to quote.
     */
    quote?: readonly number[];
  } = {},
): NoteEvent[] {
  const { chords, beatsPerBar, startBeat, rng, style } = ctx;
  const out: NoteEvent[] = [];
  const [lo, hi] = opts.range ?? [centre - 9, centre + 9];
  const spacing = style.counterSpacing ?? 0.5;
  const idiom = opts.idiom ?? IDIOMS.vocal;

  const sortedMelody = melody.slice().sort((a, b) => a.beat - b.beat);
  /** The melody note sounding at a given beat, if any. */
  const melodyAt = (beat: number): NoteEvent | undefined =>
    sortedMelody.find((n) => n.beat <= beat + 1e-6 && n.beat + n.duration > beat + 1e-6);

  // Carried across bars: this is what makes it a part rather than a series of
  // fills, and it costs one variable.
  let prev: Midi | undefined;
  let prevMelody: Midi | undefined;

  for (let bar = 0; bar < chords.length; bar++) {
    const barStart = startBeat + bar * beatsPerBar;
    const barEnd = barStart + beatsPerBar;
    const inBar = sortedMelody.filter((n) => n.beat >= barStart && n.beat < barEnd);

    /**
     * Find the largest silent window in this bar.
     *
     * The cursor starts wherever the *previous* bar's music stops rather than at
     * the barline, and the difference is a note held across it. `inBar` cannot see
     * one — it selects on the onset — so a tune sustaining into this bar left the
     * whole span before its next onset counted as silence, and the answer was
     * written straight underneath it. Rare while melody notes mostly ended where
     * the next one began; not rare once figures could hold over a barline, which
     * is when it showed up as 58% of answer notes sounding under the tune against
     * 52% before, with the answer doing nothing different.
     */
    let cursor = barStart;
    for (const n of sortedMelody) {
      if (n.beat < barStart && n.beat + n.duration > cursor) cursor = n.beat + n.duration;
    }
    cursor = Math.min(cursor, barEnd);
    let bestStart = cursor;
    let bestLen = 0;
    for (const n of inBar) {
      const gap = n.beat - cursor;
      if (gap > bestLen) { bestLen = gap; bestStart = cursor; }
      cursor = Math.max(cursor, n.beat + n.duration);
    }
    if (barEnd - cursor > bestLen) { bestLen = barEnd - cursor; bestStart = cursor; }

    // Two notes' worth of room is the price of admission, whatever a note costs
    // in this style.
    if (bestLen < spacing * 2 || !rng.chance(0.45)) continue;

    const chord = chords[bar]!;
    const scale = opts.scaleFor?.(chord);
    const tones = chordPcs(chord);
    /**
     * How many notes the answer gets, and how long they last.
     *
     * Dividing the gap by *two* note-lengths gave a single note in almost every
     * hole, and a single note cannot be an answer — there is no shape to it, so
     * the imitation below had nothing to work with and never fired. The right
     * count is however many fit, given that each occupies nine tenths of its
     * slot and only the last one needs room to finish.
     */
    const count = Math.min(4, Math.max(1, Math.floor(bestLen / spacing + 0.1)));
    /**
     * When only one note fits, hold it.
     *
     * A lone short note dropped into a hole is a blip — the ear files it as a
     * stray attack rather than as a reply. Sustained across the gap it becomes
     * a countersubject, which is what a second part holding one note under a
     * moving line has always been.
     */
    const held = count === 1 ? Math.max(spacing * 0.9, bestLen * 0.8) : spacing * 0.9;

    /**
     * The shape to answer with.
     *
     * Taken from the lead notes immediately before the gap — literally the
     * phrase being answered — as scale steps, and inverted about half the time.
     * An inverted answer is the oldest trick in counterpoint and it is worth the
     * line of code: it makes the two parts move apart, which is the only way the
     * ear keeps hearing two of them.
     */
    const call = sortedMelody.filter((n) => n.beat < bestStart && n.beat >= bestStart - beatsPerBar * 2);
    const shape: number[] = [];
    const quoting = opts.quote && opts.quote.length >= 2 && rng.chance(0.45);
    if (quoting && opts.quote) {
      // The hook, fragmented to what fits the hole and inverted about half the time.
      // Its first entry is always zero — the figure arrives wherever it is put — so
      // it is dropped rather than played as a repeated note.
      const invert = rng.chance(0.5) ? -1 : 1;
      const steps = opts.quote.slice(1);
      for (let i = 0; i < count - 1; i++) shape.push((steps[i % steps.length] ?? 0) * invert);
    } else if (scale && call.length >= 2) {
      const invert = rng.chance(0.5) ? -1 : 1;
      for (let i = Math.max(1, call.length - count); i < call.length; i++) {
        shape.push(scaleStepsBetween(scale, call[i - 1]!.midi, call[i]!.midi) * invert);
      }
    }

    // Start on a chord tone, near where the line last was rather than near the
    // instrument's centre.
    const anchor = prev ?? centre;
    let midi = clampToRange(nearestPc(tones[0]!, anchor), lo, hi);

    for (let i = 0; i < count; i++) {
      const beat = bestStart + i * spacing;
      if (i > 0) {
        const step = shape[i - 1];
        midi = step !== undefined && scale
          ? clampToRange(stepInScale(scale, midi, step), lo, hi)
          // No call to answer: fall back to the chord, moving as little as
          // possible, and arpeggiate only as far as the instrument wants to.
          : clampToRange(nearestPc(tones[(i + 1) % tones.length]!, midi), lo, hi);
      }
      midi = avoidClash(
        midi, melodyAt(beat)?.midi, prevMelody, prev, tones, [lo, hi], idiom, scale?.pcs,
      );
      out.push({
        beat,
        duration: held,
        midi,
        velocity: 0.5 * rng.float(0.9, 1.05),
      });
      prevMelody = melodyAt(beat)?.midi ?? prevMelody;
      prev = midi;
    }
  }
  return out.filter((n) => n.beat + n.duration <= startBeat + chords.length * beatsPerBar);
}

/**
 * Keep the answer independent of the tune where the two overlap.
 *
 * Only three faults matter here, and all three are ways of stopping the ear
 * hearing two parts: doubling at the unison or octave, and moving in parallel
 * fifths or octaves. The repair is a step through the chord rather than a
 * semitone nudge, because a counter-line is chord-based and a chromatic
 * correction would read as a wrong note rather than as a different one.
 *
 * **Two tiers, and the second one is what makes the first one safe.** Staying
 * under the tune is a preference; not doubling it is a rule. Enforced together
 * they can contradict each other outright — when the melody drops into the
 * bottom of its range, *every* pitch the answer can reach is above it, so a
 * search that vetoed both would find nothing and return the note it came in
 * with, which is the octave it was called to remove. Measured: one doubling in
 * 138 overlaps, every one of them a melody note below the counter's floor. So
 * the register rule is dropped on the second pass and the independence rules
 * are not, which is the correct order to give way in — an answer sitting above
 * a low tune is ordinary counterpoint, and an answer doubling it is the one
 * thing this function exists to prevent.
 */
function avoidClash(
  midi: Midi,
  melodyNow: Midi | undefined,
  melodyPrev: Midi | undefined,
  prev: Midi | undefined,
  tones: readonly number[],
  [lo, hi]: [Midi, Midi],
  idiom: IdiomProfile,
  scalePcs?: readonly number[],
): Midi {
  if (melodyNow === undefined) return midi;

  /** Doubling and parallel motion: the two the ear hears as one part. */
  const clashes = (cand: Midi): boolean => {
    if (Math.abs(cand - melodyNow) % 12 === 0) return true;   // unison or octave
    if (prev !== undefined && melodyPrev !== undefined) {
      const now = ((melodyNow - cand) % 12 + 12) % 12;
      const before = ((melodyPrev - prev) % 12 + 12) % 12;
      const perfect = (n: number) => n === 0 || n === 7;
      const moved = cand !== prev && melodyNow !== melodyPrev;
      if (moved && perfect(now) && now === before
        && Math.sign(cand - prev) === Math.sign(melodyNow - melodyPrev)) return true;
    }
    return false;
  };
  /** And the preference: the answer sits under the tune where it can. */
  const bad = (cand: Midi): boolean => clashes(cand) || cand > melodyNow;

  if (!bad(midi)) return midi;
  // Try the chord tones either side, nearest first. A mallet will happily take
  // the one further away; a wind instrument would rather stay put.
  const spread = idiom.arpeggio > 0.5 ? 8 : 5;
  const nearest = (reject: (cand: Midi) => boolean): Midi | undefined => {
    for (let d = 1; d <= spread; d++) {
      for (const dir of [-1, 1]) {
        const cand = midi + d * dir;
        if (cand < lo || cand > hi) continue;
        if (!tones.includes(((cand % 12) + 12) % 12)) continue;
        if (!reject(cand)) return cand;
      }
    }
    return undefined;
  };
  /**
   * Third tier: any pitch at all, rather than the doubling.
   *
   * The chord-tone search can genuinely come up empty — a triad offers three pitch
   * classes and the octave of the melody note is one of them often enough that
   * within a fifth either way there may be nothing else. Falling back to `midi` then
   * returns the very note this function was called to remove. A non-chord tone in an
   * answering line is ordinary counterpoint; doubling the tune is the one thing this
   * exists to prevent, so the chord is what gives way last.
   *
   * The *scale* does not give way, though, and the first attempt at this got that
   * wrong: allowing any pitch at all put two leading tones into a minor-key synth
   * song, which is the one thing that genre asserts never happens. A chord tone is a
   * preference and a scale tone is the floor.
   */
  const scaleTone = (): Midi | undefined => {
    if (!scalePcs?.length) return undefined;
    // The whole register, not a neighbourhood of it. A note further from where the
    // line wanted to be is a compromise; doubling the tune is a failure.
    for (let d = 1; d <= hi - lo; d++) {
      for (const dir of [-1, 1]) {
        const cand = midi + d * dir;
        if (cand < lo || cand > hi) continue;
        if (!scalePcs.includes(((cand % 12) + 12) % 12)) continue;
        if (!clashes(cand)) return cand;
      }
    }
    return undefined;
  };
  return nearest(bad) ?? nearest(clashes) ?? scaleTone() ?? midi;
}

/**
 * Move any answer note that doubles the tune at the unison or octave.
 *
 * A guarantee rather than a preference, and it has to be checked after both parts
 * exist. `avoidClash` does the same test while the answer is being written and cannot
 * see everything: a melody note held across a section boundary is not in the notes it
 * was handed, and a recalled tune may be varied after the answer was placed.
 *
 * Called three times in `song.ts` and the last one is the guarantee — see it. The
 * two before it exist because a repair made while the answer is still a bare line
 * is cheaper and better placed than one made against a finished arrangement; what
 * they cannot see is that a transition re-times both parts after they have run.
 *
 * Repaired through the *scale* rather than by a semitone, and downward first — an
 * answer sits under the tune where it can, so the first place to look for room is
 * below.
 *
 * Notes carrying `doubling: 'lead'` are left exactly where they are. That mark is
 * only ever set by `joinIn`, over a whole phrase, by an arrangement that drew the
 * `unison` device — so it means "the two players are stating this together", and
 * repairing it would be this pass overruling the arranger. Everything unmarked is
 * treated as it always was, which is the point of marking the exception rather
 * than the rule.
 */
export function undoubleAgainst(
  counter: NoteEvent[],
  melody: readonly NoteEvent[],
  scale: Scale,
  // Readonly because the last caller hands it an instrument's own range straight
  // out of the table, and a window is read here and never written.
  [lo, hi]: readonly [Midi, Midi],
): NoteEvent[] {
  if (!counter.length || !melody.length) return counter;
  /**
   * The *latest* note still sounding, not the first one found.
   *
   * A line is monophonic, so at most one note sounds at a time — but the array handed
   * in is a concatenation, and a note carried over from the section before is at the
   * front of it. Taking the first match therefore compared the answer against a note
   * that had already been cut off, and let the note actually sounding go unchecked.
   */
  const sounding = (beat: number): NoteEvent | undefined => {
    let best: NoteEvent | undefined;
    for (const m of melody) {
      if (m.beat > beat + 1e-6 || m.beat + m.duration <= beat + 1e-6) continue;
      if (!best || m.beat > best.beat) best = m;
    }
    return best;
  };

  return counter.map((n) => {
    if (n.doubling) return n;
    const under = sounding(n.beat);
    if (!under || Math.abs(under.midi - n.midi) % 12 !== 0) return n;
    for (let d = 1; d <= 6; d++) {
      for (const dir of [-1, 1]) {
        const cand = stepInScale(scale, n.midi, d * dir);
        if (cand < lo || cand > hi) continue;
        if (Math.abs(under.midi - cand) % 12 === 0) continue;
        return { ...n, midi: cand };
      }
    }
    return n;
  });
}

/**
 * ## What the drummer's hand does, which the pattern does not say
 *
 * One drum pattern is drawn for the whole song — see the note beside that draw
 * in `generate/song.ts`, and it is right: a band does not change its groove
 * every eight bars. What a band *does* change is the hand. The hat rides on
 * quarters through a verse and on eighths in the chorus; it moves to the ride
 * cymbal when the record lifts; it opens on the offbeat. None of that is a
 * different pattern and all of it was inexpressible, so the kit played sixteen
 * identical slots for a hundred and ten bars and the only thing separating a
 * verse from a last chorus was a gain multiplier and a fill at the seam.
 *
 * **This is deliberately not a second draw.** Redrawing from `Style.drums` per
 * section would move the backbeat — `gated-backbeat` puts the snare on slot 8
 * and `sixteenth-hats` puts it on 4 and 12 — and a song whose backbeat moves at
 * the chorus is not a band varying a groove, it is two bands. What varies here
 * is the timekeeping voice and how many hits it plays. Everything else in the
 * pattern is untouchable, which `npm run genres` asserts rather than trusting.
 *
 * **And it is not `Feel` either**, though they are neighbours and were nearly
 * one thing. A feel bends events that exist: it pushes them off the grid,
 * scales them per sixteenth, ghosts a snare into a rest. It cannot say *which
 * voice* a hit sounds on, because a voice is not a scalar — `accent` can make
 * the hat quieter on the offbeats and there is no number that turns it into a
 * ride. The two compose: a feel decides how the hand plays, this decides what
 * it plays on.
 */
export interface KitVariation {
  /** The timekeeping voice being varied. */
  on: DrumVoice;
  /** Where the hand moved, if it moved at all. */
  to?: DrumVoice;
  /**
   * Keep every other hit of the hand.
   *
   * Uniformly the right thinning, which is why it is a flag rather than a
   * density: halving sixteenths gives eighths, halving eighths gives quarters,
   * and halving a swung ride of `[0, 6, 8, 14]` gives `[0, 8]` — the sparse
   * version of each of those figures, and in every case the one a drummer
   * actually drops to. Thinning by "keep the hits on beats" would be the same
   * answer for the first two and nonsense for the third.
   */
  thin?: boolean;
  /**
   * Indices into the hand's surviving hits that sound as something else, and
   * what that something is.
   *
   * Indices rather than slots because a pattern may carry a `cycle`, in which
   * case its slots are relative to the figure and not to the bar — see `Cycle`.
   * The hand's own hit list is the one space both readings agree on.
   *
   * **One object rather than two fields**, and that is the shape of the fix
   * rather than tidiness. This used to be a bare index list and `varyPattern`
   * named `oh` for itself — the fourth and last of the hard-coded kit literals
   * `docs/engine-gaps.md` §2.1 is about. Splitting the voice off into a second
   * optional field beside it would make "set both or neither" a rule a reader
   * has to keep; one optional object is the same rule with nowhere left to
   * break it. The voice comes from `HandStation.lift`.
   */
  open?: { at: number[]; as: DrumVoice };
}

/**
 * What a hand keeps time on, and what a loud section does with it, once it is
 * known what the drummer is standing at.
 *
 * The third of these tables and the last one §2.1 was waiting on.
 * `SoloOrchestration` in `generate/solo.ts` answers the question for a chorus
 * and `SeamOrchestration` in `generate/fills.ts` for a seam; all three resolve
 * through the one `drumStations` split casting reads, so the sound and the
 * picture cannot come apart over what is on the stage. Three tables rather than
 * one for the reason the second states at length: a solo needs a spare limb
 * keeping the form audible over sixteen bars, a seam needs a piece of wood, and
 * neither has the least use for a list of candidates.
 *
 * ## This site's fault was silence, which is why it outlived the other two
 *
 * `playShot` and `buildFill` wrote a kick, a snare and a crash into music with
 * none of those objects in it, and that is *loud*: 1804 kit strokes across 55
 * hand-table songs, one of which wheeled a full acoustic kit onto an arabic
 * stage to play a single crash. Both are fixed and `npm run genres` has held
 * *a hand-drum genre never sends for a kit* green since.
 *
 * It was green with this file untouched, and that is the trap. `HAND_VOICES`
 * was `rd sh hh oh`; `handOf` needs its winner *present* and busiest, and a
 * table of `lp mp hp tb` has none of the four in it. So this never wrote a kit
 * stroke anywhere and never could — it returned `undefined` for every section
 * of every song in every genre with no kit, and a check that counts wrong
 * strokes cannot see a gesture that never happened. **54 of the 335 styles with
 * a drum table are hand tables, and all 54 played one figure from the first bar
 * to the last** while every kit style in the catalogue got a verse thinner than
 * its chorus. (The denominator read 389, which is every style in the catalogue
 * rather than every style with a drum table — the two populations differ by the
 * styles that write no drum voices at all. The numerator is the
 * number that carries the argument and it is unaffected: 54, counted with no
 * bank, which is what `fills.ts` and `docs/engine-gaps.md` both report.)
 *
 * ## What a hand is, stated once and true at both stations
 *
 * `keeps` is not a list of the voices that happen to be busy. On a kit it is the
 * cymbals and the brushes, and it excludes the kick, the snare and the toms,
 * because thinning a backbeat is not a drummer varying a groove — it is a
 * second band, which is the whole safety claim `npm run genres` asserts as
 * *varying the hand moves nothing else*.
 *
 * At a hand station the same sentence picks out **the pieces on the stand and
 * never the drum**. One head carries the figure and the rhythm's identity is in
 * it: `core/types.ts` says the doum is the pulse of the bar the way a kick is,
 * and `SeamOrchestration` calls the open tone the stroke a figure is *stated*
 * on. Take alternate strokes out of a tīntāl theka and the result is not a
 * sparser tīntāl, it is not tīntāl. The riq counting sixteenths over that figure
 * is a second pair of hands, and halving it to eighths through an intro is
 * precisely what that player does.
 *
 * **The catalogue says the same thing in numbers**, which is why the rule is
 * written this way rather than the tempting way. Over the 54 hand tables, a row
 * of four or more auxiliary strokes is **evenly spaced 40 times out of 50**;
 * a row of four or more strokes on the skin is evenly spaced **39 times out of
 * 129**, and averages 3.2 strokes against the auxiliary's 5.2. The piece on the
 * stand is a subdivision layer and the drum is a figure, in four genres written
 * by four authors who never discussed it.
 *
 * So **22 of the 54 hand tables now get a hand and 32 do not**, and the 32 are
 * the finding rather than the shortfall: they are every indian theka, every
 * finnfolk frame drum and reggae's nyabinghi — one drum and nothing beside it,
 * with nothing on the stage whose removal leaves the rhythm's name intact. A
 * kit table reaches the same dead end often enough that it needs no special
 * pleading: `waltz-light` rides three quarters over a bar of twelve and
 * `handOf` has always declined to thin it.
 *
 * ## …and no station but the kit has a loud gesture
 *
 * `lift` is optional because the kit is the only object in the catalogue with
 * anything to lift *to*. Moving to the ride is a second cymbal and opening the
 * hat is a surface that rings on demand; a riq player at full tilt has neither,
 * and what they actually do is play harder and add strokes, which is the one
 * direction this mechanism cannot go — it removes and re-aims, it never adds.
 * Miming it with a slap would be `cymbal`'s mistake one file over: the same
 * onsets and none of the reason for them. A hand station therefore thins in the
 * quiet sections and does nothing in the loud ones, which is one honest gesture
 * rather than three approximated.
 */
export interface HandStation {
  /**
   * The voices a hand keeps time on, in the order ties are broken.
   *
   * On the kit, `rd` first because a pattern carrying both a ride and something
   * else is a jazz pattern and the ride is the pulse of it; `hh` below `sh`
   * because where a brush pattern also has a hat, the hat is the foot. At the
   * hand station, `tb` first for the same reason `rd` leads the kit — a riq is
   * the pulse of a takht and everything else on the stand is colour beside it.
   */
  keeps: readonly DrumVoice[];
  /**
   * What a section at full intensity does with the hand, and the one voice it
   * may do it to. Absent where the station has no such gesture at all.
   *
   * One voice rather than a predicate, because the two hand voices the kit
   * declines are declined for stated reasons: a hand already on the ride has
   * nowhere to go, and brushes moved to a cymbal are a different pair of sticks
   * rather than a lift.
   */
  lift?: {
    from: DrumVoice;
    /** Where the whole hand moves to. */
    to: DrumVoice;
    /** …or what one or two of its hits sound as instead. */
    accent: DrumVoice;
  };
}

/** What every section of every song in this project varied, and still does. */
const TRAP_KIT: HandStation = {
  keeps: ['rd', 'sh', 'hh', 'oh'],
  lift: { from: 'hh', to: 'rd', accent: 'oh' },
};

/**
 * The percussionist's own stand, and nothing that is the drum.
 *
 * `perc` earns its place on a measurement rather than on the tier it sits in:
 * latin's `bachata` writes `perc: 12` under a bongo figure of four, which is a
 * güira playing straight sixteenths and is the most obviously thinnable row in
 * the catalogue. `cp` and `cb` are deliberately out — a clap is a backbeat
 * marker and a bell plays a bell *pattern*, and both are figures somebody would
 * miss a stroke of.
 */
const HAND_DRUM: HandStation = { keeps: ['tb', 'sh', 'perc'] };

/**
 * Which of the two, from a drum vocabulary and the bank behind it.
 *
 * The same one-line question `seamOrchestration` and `orchestrationFor` ask, in
 * the same words and with the same default: a caller naming no vocabulary gets
 * a kit, which is what every call to `planKitVariation` meant before this
 * existed. That default is what makes the change safe rather than merely
 * correct — an untaught call site varies exactly the kit it varied yesterday.
 *
 * The **bank** is threaded rather than argued about, and `seamOrchestration`'s
 * own note says why at length: latin's `joropo` is `perc sh` and nothing else,
 * two `either`-tier voices that read as a kit alone and as a percussionist's
 * bongo and cabasa the moment an era names `+congas`. A claim that a parameter
 * cannot change an answer is only as good as the corpus it was measured over.
 */
export function handStation(
  table?: Iterable<DrumVoice>, bank?: string,
): HandStation {
  if (!table) return TRAP_KIT;
  return drumStations(table, bank).kit ? TRAP_KIT : HAND_DRUM;
}

/**
 * Which voice is keeping time, or nothing if the pattern does not say clearly.
 *
 * Derived rather than declared, because declaring it means authoring a field
 * onto every drum pattern in the catalogue to record something every one of
 * them already shows: the hand is the busiest of the voices the station says it
 * may be. That was seventy-six entries when this was written and is **951
 * now**, of which the derivation elects a hand for 640 — which is the argument
 * getting stronger rather than the sentence going stale, since the cost of the
 * alternative grew by a factor of twelve and a half and the derivation cost
 * nothing. (The count read 1005 here and in `docs/rhythm.md` until §3.6
 * re-measured it. **1005 was right when it was written**, and it was not a
 * double count: the 54 placeholder drum tables were deleted one commit earlier
 * — each a single row that existed only so `rng.weightedBy` would not throw —
 * and 1005 − 54 is 951. The re-measurement was correct about the number and
 * wrong about the cause, which is worth leaving here because *falsified by the
 * commit before* and *always wrong* want different responses: the first needs
 * the number re-run, the second needs the method distrusted. 640 was
 * re-measured at the same time and is unchanged.) The two guards are what make
 * the derivation safe rather than
 * merely usually right —
 *
 *  - **strictly busier than anything not in `keeps`**, which is what keeps jazz
 *    honest. `ride-swing` writes `hh: [4, 12]`, and that is the *foot* on two
 *    and four — the backbeat of the style. Thinning or opening it would be
 *    varying the one thing this must never touch. The ride outnumbers it four
 *    to two and wins.
 *
 *    The same guard does a second job at the hand station, unaltered: indian's
 *    `jhala` theka writes `lp: 12` against `hp: 8`, so the doum outnumbers the
 *    ka and the answer is *no hand at all*. That is right — the tāl is in the
 *    doum — and it falls out of a rule written for a hi-hat five genres away,
 *    because both rules are the one sentence about not touching the groove.
 *  - **at least four hits**, below which there is nothing to thin. `waltz-light`
 *    rides three quarters over a bar of twelve; halving that is not a sparser
 *    hand, it is a hole.
 *
 * **Struck hits only, and `DrumPattern.ghosts` is deliberately not counted.**
 * The question here is which voice is keeping *time*, and a ghost is not
 * evidence about the pulse — it is the hand filling in between it, played under
 * the level precisely so that nobody counts along with it. A snare with six
 * ghosts under two backbeats is still not the timekeeper, and letting a ghost
 * list elect the hand would make it one. Whichever voice wins takes its ghosts
 * with it either way; see `varyPattern`.
 */
function handOf(pattern: DrumPattern, keeps: readonly DrumVoice[]): DrumVoice | undefined {
  const count = (v: DrumVoice) => pattern.voices[v]?.length ?? 0;
  let hand: DrumVoice | undefined;
  for (const v of keeps) {
    if (count(v) > (hand ? count(hand) : 0)) hand = v;
  }
  if (!hand || count(hand) < 4) return undefined;
  for (const v of Object.keys(pattern.voices) as DrumVoice[]) {
    if (!keeps.includes(v) && count(v) >= count(hand)) return undefined;
  }
  return hand;
}

/**
 * What the hand does in a section this hard.
 *
 * The structural half is read straight off the intensity and the ornamental
 * half is drawn, which is the same division `fills.ts` already makes and it is
 * deliberate: *that* a quiet section plays a sparser kit is an arrangement rule
 * and should hold in every song, where *which* offbeat the hat opens on is a
 * detail nobody would notice repeating and everybody would notice being the
 * same in every song ever generated.
 *
 * The lifts are exclusive. A hand that moves to the ride *and* opens the hat is
 * playing two cymbals at once, which is a different pattern rather than a
 * louder one.
 */
export function planKitVariation(
  pattern: DrumPattern,
  opts: {
    intensity: number;
    rng: Rng;
    /**
     * What this band's percussion is, so the hand is the one in front of the
     * player. See `HandStation`, and `DrumSoloOptions.table`, which takes the
     * same value for the same reason.
     *
     * **The whole style table, not this section's pattern**, which is the read
     * the solo generator and `generateDrums`' own fill both make: a variation
     * that leaves the toms alone for eight bars has not wheeled the kit off the
     * stage, and a station derived from the bar it happens to be varying would
     * change instrument at the chorus.
     *
     * Absent is the trap kit, which is what every caller meant before the field
     * existed.
     */
    table?: Iterable<DrumVoice>;
    /** The percussion bank, since a sampled rack is half the answer. */
    bank?: string;
  },
): KitVariation | undefined {
  const station = handStation(opts.table, opts.bank);
  const on = handOf(pattern, station.keeps);
  if (!on) return undefined;
  const hits = pattern.voices[on]!;
  const { intensity, rng } = opts;

  /**
   * Quiet sections thin. The threshold sits above what an intro and an outro
   * are worth and below a verse, so the arrangement that falls out of it is the
   * one a band plays without discussing it: **the table's pattern is the verse**,
   * the ends of the record are sparser than the middle, and the chorus is the
   * only place the hand does something extra. See `KIND_LEVEL`.
   */
  if (intensity < 0.72) return { on, thin: true };

  /**
   * Loud ones lift, and only from the voice the station says can — the closed
   * hat on a kit, because a hand already on the ride has nowhere to go and
   * brushes moved to a cymbal are a different pair of sticks rather than a lift.
   *
   * A station with no `lift` at all falls straight through to `undefined`, and
   * takes no random number on the way: `station.lift` is read before `rng` is
   * touched, so a hand drum that thins in the quiet sections spends nothing in
   * the loud ones. That is not an optimisation — a draw taken and discarded here
   * would shift every later number in the stream and hand back a different song.
   */
  const lift = station.lift;
  if (intensity > 0.9 && lift && on === lift.from) {
    if (rng.chance(0.45)) return { on, to: lift.to };
    const offbeats = hits
      .map((slot, i) => [slot, i] as const)
      .filter(([slot]) => slot % SLOTS_PER_BEAT !== 0)
      .map(([, i]) => i);
    if (offbeats.length) {
      // One or two in the bar. A hat open on every offbeat is a disco pattern,
      // which is a thing to write in a table and not a thing to arrive at by
      // varying something else.
      const wanted = Math.min(offbeats.length, rng.chance(0.4) ? 2 : 1);
      const at = rng.shuffle(offbeats).slice(0, wanted).sort((a, b) => a - b);
      return { on, open: { at, as: lift.accent } };
    }
  }
  return undefined;
}

/**
 * The pattern as this section's hand plays it.
 *
 * A new `DrumPattern` rather than a pass over the events, so everything
 * downstream — the cycle walk, `accentOf`, the fill's clearing, the per-hit
 * jitter — reads the varied figure without being told any of this exists.
 */
function varyPattern(pattern: DrumPattern, v: KitVariation): DrumPattern {
  const hits = pattern.voices[v.on];
  if (!hits?.length) return pattern;

  /**
   * A hand on its own clock keeps it, and cannot be poured into a row that has
   * another one. See `DrumPattern.cycles`.
   *
   * Thinning is safe at any cycle — half the strokes of a seven is still a seven
   * — so the only question this asks is about the two gestures that *move*
   * hits: a lift to the ride, and an open hat. Both merge one row into another,
   * and two figures of different lengths summed into one row is not a hand
   * varying a groove, it is a third pattern with a beat frequency in it.
   *
   * Declined rather than repaired, and rather than guarded further upstream. The
   * plan has already been drawn by the time this runs, so returning the pattern
   * unvaried costs no random number and hands back exactly the figure the plan
   * was made against — the same thing this function already does when the hand
   * turns out to have no hits. Repairing it would mean choosing which of the two
   * clocks the merged row is on, and there is no answer to that question: the
   * style wrote both of them on purpose.
   *
   * `pattern.cycle` is the comparison's floor on both sides, so a voice that
   * names nothing is compared at the kit's own length and a kit that names
   * nothing compares `undefined` to `undefined`. A destination that is neither
   * struck nor named in `cycles` has no clock to disagree with and simply takes
   * the hand's; a destination named in `cycles` and struck nowhere is a table
   * typo, and it is cheaper to let it refuse the lift than to let the merge be
   * the first place it means anything.
   */
  const clockOf = (voice: DrumVoice) => pattern.cycles?.[voice] ?? pattern.cycle;
  const occupied = (voice: DrumVoice) =>
    Boolean(pattern.voices[voice]?.length) || pattern.cycles?.[voice] !== undefined;
  const dests = [v.to ?? v.on, ...(v.open ? [v.open.as] : [])];
  if (pattern.cycles && dests.some((d) => d !== v.on && occupied(d)
    && clockOf(d) !== clockOf(v.on))) return pattern;

  const kept = v.thin ? hits.filter((_, i) => i % 2 === 0) : hits;
  const opened = new Set(v.open?.at ?? []);
  const hand: number[] = [];
  const open: number[] = [];
  kept.forEach((slot, i) => (opened.has(i) ? open : hand).push(slot));

  const voices: Partial<Record<DrumVoice, number[]>> = { ...pattern.voices };
  delete voices[v.on];
  const merge = (voice: DrumVoice, slots: number[]) => {
    if (!slots.length) return;
    voices[voice] = [...new Set([...(voices[voice] ?? []), ...slots])].sort((a, b) => a - b);
  };
  merge(v.to ?? v.on, hand);
  // …and the accented hits onto whatever the station said they sound as, which
  // is the last voice this file used to name for itself. See `KitVariation.open`.
  if (v.open) merge(v.open.as, open);

  /**
   * The hand's ghosts are the hand's, and they go where it goes.
   *
   * A varied pattern that silently dropped them would be a bug visible in some
   * sections and not others, which is the worst shape a bug can have here — but
   * carrying them is not merely defensive. A hand that has moved to the ride and
   * left its light strokes on the hat is two hands on two cymbals, and a hand
   * thinned to eighths under an unthinned row of ghosted sixteenths is a
   * drummer playing quieter *and* busier, which is nobody.
   *
   * **Never opened.** `open` turns a hand hit into an open hat, and an open hat
   * is the loudest thing that hand does — it is what carries the accent
   * wherever it collides with a closed one, which is why `oneHatAtATime` in
   * `song.ts` lets it win. An opened ghost is a contradiction, and it falls out
   * rather than being guarded: `KitVariation.open` indexes into the hand's
   * struck hits and there is no index that reaches this list.
   */
  const varied: DrumPattern = { ...pattern, voices };

  const ghosted = pattern.ghosts?.[v.on];
  if (ghosted?.length) {
    const ghosts: Partial<Record<DrumVoice, number[]>> = { ...pattern.ghosts };
    delete ghosts[v.on];
    const moved = v.thin ? ghosted.filter((_, i) => i % 2 === 0) : ghosted;
    const to = v.to ?? v.on;
    if (moved.length) {
      ghosts[to] = [...new Set([...(ghosts[to] ?? []), ...moved])].sort((a, b) => a - b);
    }
    varied.ghosts = ghosts;
  }

  /**
   * …and so does the hand's clock, for the first of the two reasons above.
   *
   * A hand that has moved to the ride and left its own figure length behind on
   * the hat is playing a different figure on a different cymbal, which is the
   * two-hands-on-two-cymbals fault two paragraphs up wearing a `cycle`. The
   * guard at the top of this function has already refused the only case where
   * the destination could disagree, so this is a move rather than a merge and
   * there is nothing here to reconcile. See `DrumPattern.cycles`.
   */
  const clock = pattern.cycles?.[v.on];
  if (clock !== undefined) {
    const cycles: Partial<Record<DrumVoice, number>> = { ...pattern.cycles };
    delete cycles[v.on];
    for (const d of dests) if (voices[d]?.length) cycles[d] = clock;
    varied.cycles = cycles;
  }

  /**
   * …and so do the hand's rolls, for the first of the two reasons above and not
   * for the second.
   *
   * A hand that moves to the ride takes its retriggers with it, and a hand
   * thinned to eighths drops the rolls that stood on the hits it just dropped —
   * both fall out of walking the **surviving closed hits** rather than the
   * written ones, so there is no separate rule for either.
   *
   * **An opened hit loses its roll**, which is the one place this differs from
   * the ghosts above, and it is a musical claim rather than an accident of the
   * indexing. `KitVariation.open` turns a closed stroke into an open hat, and an
   * open hat is a surface deliberately left ringing; a retrigger is the same
   * surface re-struck three times inside 107 ms. Asking for both is asking for a
   * ring that is interrupted twice by its own beginning, which is not a louder
   * hat and not a busier one — it is a third sound nobody wrote. So `open` is
   * simply not walked.
   */
  const rolled = pattern.rolls?.[v.on];
  if (!rolled) return varied;
  const rolls: Partial<Record<DrumVoice, Record<number, number>>> = { ...pattern.rolls };
  delete rolls[v.on];
  const onto = v.to ?? v.on;
  const moved: Record<number, number> = { ...rolls[onto] };
  for (const slot of hand) {
    const strokes = rolled[slot];
    if (strokes !== undefined) moved[slot] = strokes;
  }
  if (Object.keys(moved).length) rolls[onto] = moved;
  varied.rolls = rolls;
  return varied;
}

export function generateDrums(
  ctx: PartContext,
  pattern: DrumPattern,
  opts: {
    fillAtEnd: boolean;
    intensity: number;
    /** How hard the section this fill delivers plays. See `generate/fills.ts`. */
    arrival?: number;
    palette?: FillPalette;
    /**
     * Whether a preset rhythm box is playing this, in which case the pattern is
     * the pattern and nothing bends it. See `DrumSource`.
     *
     * It takes away the two things below the fill: the section intensity, and
     * the per-hit jitter. Both are a player responding to the room, and a box
     * has no mechanism for either — the whole reason the sound is recognisable
     * is that bar 64 is bit-identical to bar 1. What survives is `accentOf`,
     * because a preset *pattern* genuinely does accent: a Mini Pops bossa nova
     * has a shape, it just has the same shape every time.
     *
     * **And it takes away `DrumPattern.ghosts`**, joining the list `song.ts`
     * already keeps for a box — the fill, the drum solo, the intensity response
     * and the drummer's hand. Not for the bit-identity reason — a fixed fraction of a fixed velocity is
     * as repeatable as anything else on this path — but because the gesture is
     * a *stick* technique: a stroke let down onto the head from an inch away
     * with the fingers, at a quarter of the level of the one either side of it.
     * A Rhythm Ace has one level per voice per step and an accent bit worth a
     * few per cent; nothing in that box can play a quarter-level snare, and a
     * box that did would be a sound that never existed. What it plays instead
     * is the figure with the ghost row taken off, which is precisely the figure
     * a style author would have written before this field existed.
     */
    machine?: boolean;
    /**
     * Whether a machine somebody drew this pattern into a step at a time is
     * playing it — `DrumSource` of `programmed`, and the one source that may
     * sound `DrumPattern.rolls`.
     *
     * A second boolean beside `machine` rather than the `DrumSource` itself,
     * which is the ugly choice and is the right one. Handing this function the
     * enum would put the question *what is this source able to do* inside a
     * pattern generator, where it would be asked again and answered again every
     * time a value was added; `canVary` and `isPlayedByHand` exist in
     * `core/types.ts` precisely so that the answer is given a name once and read
     * everywhere. Both booleans are that read, taken at the call site in
     * `song.ts` alongside the fill's and the hand's.
     *
     * The two are not opposites and must not be collapsed. `machine` says *no
     * hands*, and it is true of the one source that has a start button and false
     * of the two that have people behind them **and** of this one. This says *a
     * programmer, a step at a time*, which is a strictly narrower claim: a preset
     * box is a machine that cannot roll, because a roll is a step written into a
     * memory and a Rhythm Ace has no memory to write into.
     */
    programmed?: boolean;
    /**
     * What this section's hand is doing. See `KitVariation` — and note that a
     * box never gets one, for the same reason it gets no fill.
     */
    variation?: KitVariation;
    /**
     * The percussion bank, so a sampled rack named on it is part of the answer
     * to which object this fill is played on. `DrumTrack.bank`; see
     * `seamOrchestration`.
     *
     * That function's own note used to say the bank could not change its answer
     * — measured across every style and every bank the eras could roll, it
     * never did once — and the measurement was honest and vacuous, because on
     * the day it was taken no era named a rack at all. The style it warned about
     * is latin's `joropo`, whose table is `perc sh` and nothing else: two
     * `either`-tier voices, which read as a kit on their own and as a
     * percussionist's bongo and cabasa the moment the era's bank says `+congas`.
     * Without this the solo was orchestrated for the hand drum and the *fills*
     * for a trap kit, so the same chorus rolled down three toms nobody had
     * staged.
     */
    bank?: string;
  },
): DrumEvent[] {
  const { chords, beatsPerBar, startBeat, rng, style } = ctx;
  const figure = opts.variation ? varyPattern(pattern, opts.variation) : pattern;
  const slotsPerBar = beatsPerBar * SLOTS_PER_BEAT;
  const bars = chords.length;
  const out: DrumEvent[] = [];
  const arrival = opts.arrival ?? opts.intensity;

  /**
   * The fill belongs to the last *bar*, whatever the figure's cycle is.
   *
   * A drummer setting up the next section plays into the barline, not into
   * whatever point a three-beat ostinato happens to have reached. So the fill is
   * still bar-shaped, and the cycle is what has to give way around it.
   */
  const lastBarStart = startBeat + (bars - 1) * beatsPerBar;
  /**
   * What the drummer is sitting at, which decides what a fill is made of. See
   * `SeamOrchestration` in `generate/fills.ts`.
   *
   * **The whole style table, not this section's pattern**, which is the read
   * `generateDrumSolo` already makes and for the same reason: a groove that does
   * not touch the toms for eight bars has not wheeled the kit off the stage.
   * The vocabulary is derived here rather than taken as an option, because
   * `ctx.style` is where a drum vocabulary lives and it is already in scope.
   * Resolved once because it is wanted twice: the fill is made of it, and so is
   * the stroke on the downbeat the fill is aimed at.
   *
   * The **bank** is the one half that has to be handed in, since a style knows
   * what it plays and only the song knows what it is played on. See
   * `opts.bank`: a table of nothing but auxiliary voices is a kit or a
   * percussionist depending entirely on whether the era named a rack, and this
   * is the site that answered the question wrong for as long as it could not
   * see one.
   */
  const station = seamOrchestration(
    style.drums.flatMap((p) => Object.keys(p.voices) as DrumVoice[]),
    opts.bank,
  );
  const fill = opts.fillAtEnd && bars > 0
    ? buildFill({
      barStart: lastBarStart, beatsPerBar, slotsPerBar, rng,
      intensity: opts.intensity,
      arrival,
      palette: opts.palette ?? DEFAULT_FILLS,
      station,
      // The fill is entitled to the same fact the figure above it already has.
      // `buildFill` reads it nowhere yet, so this changes no note in any genre
      // and `npm run genres` staying green is the expected result rather than
      // evidence of anything. See `FillOptions.programmed` for what it is for
      // and what it deliberately is not.
      programmed: opts.programmed,
    })
    : undefined;
  const clearFrom = fill ? (bars - 1) * slotsPerBar + fill.fromSlot : Infinity;

  /**
   * The struck figure, and then the ghosts underneath it.
   *
   * One list of rows walked by one loop, rather than a second loop beside the
   * first, and that is the whole implementation of *"read exactly like
   * `voices`"* — the cycle walk, the fill's clearing, `accentOf` and the
   * per-hit jitter reach a ghost because there is no other path for it to take.
   * A second loop would be four rules restated, and the failure mode of
   * restating them is a ghosted figure that drifts differently from the figure
   * it belongs to, which nobody would hear as a bug.
   *
   * The struck rows come first and in their original order, so a pattern with
   * no ghosts draws from `rng` exactly the numbers it always drew, in exactly
   * the order it always drew them. Every committed style therefore generates
   * bit-for-bit identical music, which is the acceptance test for this field
   * rather than a nicety — see the `drumSource` note in `song.ts` for what one
   * number taken out of a shared stream cost the last time.
   *
   * A slot that is both struck and ghosted on the same voice is **struck**. One
   * hand cannot hit one drum twice at once, and the two events would arrive on
   * the same beat on the same voice a quarter apart in level, which is the
   * doubled attack `oneHatAtATime` exists to prevent wearing different clothes.
   */
  const rows = (Object.entries(figure.voices) as [DrumVoice, number[]][])
    .map(([voice, slots]) => ({ voice, slots, ghost: false }));
  if (figure.ghosts && !opts.machine) {
    for (const [voice, slots] of Object.entries(figure.ghosts) as [DrumVoice, number[]][]) {
      const struck = new Set(figure.voices[voice] ?? []);
      const kept = slots.filter((at) => !struck.has(at));
      if (kept.length) rows.push({ voice, slots: kept, ghost: true });
    }
  }

  /**
   * Which written slots are struck more than once. See `DrumPattern.rolls`.
   *
   * Read off the *figure* rather than the pattern, so a varied hand's rolls have
   * already moved with it, and keyed by the figure's own slot rather than by the
   * absolute one, so a roll in a 48-slot cycle repeats where the cycle repeats
   * instead of once every three bars. That is `cycleHits` carrying the hit it
   * came from, which it has always done for the bass and which this is the first
   * drum row to need.
   *
   * The gate is one condition and it is the whole of the mechanism's safety: no
   * hand and no preset box ever sees this map, so a rolled stroke cannot reach a
   * staged drummer and `concert/choreograph.ts` needed no change at all.
   *
   * It costs no random number, which is the acceptance test rather than a
   * nicety. `roll` is placed and never drawn, so a style that writes none
   * generates bit-for-bit what it always did and a style that writes some pulls
   * exactly the same numbers in the same order as the figure underneath it.
   */
  const rolls = opts.programmed ? figure.rolls : undefined;

  for (const { voice, slots, ghost } of rows) {
    const rolled = rolls?.[voice];
    /**
     * How long *this row's* figure is. See `DrumPattern.cycles`.
     *
     * The whole of that feature is this expression, and the reason it is one
     * expression is that `rows` above is already a list of one row per voice —
     * a ghost row carries the voice it belongs to, so it resolves to the same
     * number as the strokes it sits under and drifts with them, which is what
     * `ghosts` promises in as many words.
     *
     * Three fallbacks rather than two, and the order is the claim: a voice that
     * names its own length gets it, a kit that names one length gets that, and
     * everything else is the bar. So a pattern writing no `cycles` hands this
     * loop the identical number it was handed before the field existed, at every
     * voice of every figure in the catalogue.
     */
    const cycle = figure.cycles?.[voice] ?? figure.cycle ?? slotsPerBar;
    for (const { hit, slot } of cycleHits(slots.map((at) => ({ at })), {
      cycle, bars, slotsPerBar,
    })) {
      // Clear exactly as much of the bar as the fill actually occupies — which
      // used to be hardcoded to half a bar whatever was played there. The kick
      // keeps going: a drummer's right foot does not stop for a fill. A ghosted
      // kick keeps going with it — the fill takes the hands away, and the
      // exemption was always about the foot rather than about how hard it plays.
      //
      // A foot on its own `cycles` entry needs exactly this and gets it for
      // free: a drifting figure that stopped for the fill and restarted after it
      // would come back in the wrong phase, and would come back in a *different*
      // wrong phase in every section, which is the one thing a two-clock kit
      // cannot survive. The voice this field was asked for is the voice that has
      // been exempt since before it existed.
      if (slot >= clearFrom && voice !== 'bd') continue;
      const inBar = slot % slotsPerBar;
      const strength = accentOf(inBar, slotsPerBar, style.groups);
      const struck = opts.machine
        ? strength
        : Math.min(1, strength * opts.intensity * rng.float(0.92, 1.05));
      const roll = rolled?.[hit.at];
      out.push({
        beat: startBeat + slot / SLOTS_PER_BEAT,
        voice,
        velocity: ghost ? struck * GHOST_LEVEL : struck,
        ...(roll !== undefined && roll > 1 ? { roll } : {}),
      });
    }
  }

  if (fill) {
    out.push(...fill.events);
    out.push(landing(lastBarStart + beatsPerBar, arrival, station));
  }
  return out.sort((a, b) => a.beat - b.beat);
}

/**
 * How hard a kit voice hits, by where in the bar it lands.
 *
 * The old arithmetic — downbeat, then every fourth slot, then everything else —
 * is right in 4/4 and silently wrong the moment a bar groups asymmetrically: in
 * a 2+2+3 it accents slot 12, which is the *weak* eighth of the last group,
 * two groups, and leaves the head of the third group as an offbeat. A drummer
 * playing that is not playing 7/8, and no amount of writing better patterns in
 * the table fixes an accent applied after the fact.
 *
 * So the grouping decides it where there is one. `metricStrength` already knows
 * how; this only maps its five levels onto the three velocities a kit uses.
 */
function accentOf(slot: number, slotsPerBar: number, groups?: readonly number[]): number {
  const strength = metricStrength(slot, slotsPerBar, groups);
  if (strength === 4) return 1;
  return strength >= 2 ? 0.85 : 0.68;
}

/**
 * How much of a stroke a ghost is. See `DrumPattern.ghosts`.
 *
 * **A fraction of the stroke that would have stood on the same slot**, rather
 * than a velocity of its own, and the difference is the whole design. Level in
 * this engine is decided by position, by the section and by the feel; a flat
 * number written here would be a fourth opinion that outranked all three, and a
 * ghost would stop responding to the metre in a bar that has one. Scaling the
 * struck value instead means a ghost accents with `groups`, thins with a quiet
 * section, jitters like a hand and leans with `Feel.accent`, because it is
 * arrived at by the same arithmetic and then let down.
 *
 * It also fixes the *ratio*, which is what a ghost actually is. A drummer plays
 * the e and the a at a quarter of the backbeat beside them, not at a quarter of
 * the loudest thing in the bar — so a flat number would come out relatively
 * loudest exactly where the figure is quietest, which is backwards.
 *
 * ## The number
 *
 * `accentOf` gives 1 on the downbeat, 0.85 on a beat or a half-bar and 0.68
 * elsewhere. On the figure this field exists for — backbeats on 4 and 12, ghosts
 * on the e and the a — a written ghost therefore lands at 0.68 × 0.28 = **0.190**
 * of intensity, which is 22% of the 0.85 backbeat beside it and 19% of a downbeat
 * kick. That is the quarter the repertoire means and a little under the third the
 * `breakbeat` header in funk asked for, which is the right side to err on: a
 * ghost that can be heard as a note is not a ghost.
 *
 * 0.28 is not a round number because it was solved for rather than picked.
 * `applyFeel` puts a *drawn* ghost at 0.22 of the mean snare velocity in its
 * bar, which on that same figure is 0.22 × 0.85 = 0.187 — so at 0.28 the two
 * mechanisms agree to within 2% on the one figure both of them are aimed at.
 * A section that has a ghosted figure *and* a ghosting feel therefore has one
 * ghost level in it rather than two, which is what composing means here.
 *
 * The scaling happens after the clamp that `generateDrums` applies, so a ghost
 * in a section loud enough to push its strokes to the ceiling is 0.28 of the
 * ceiling rather than 0.28 of a number nobody heard. At the other end the
 * arrangement's floor intensity of 0.45 puts the quietest written ghost at about
 * 0.079, a hair under the 0.08 floor `applyFeel`'s accent block clamps kit
 * velocities to — which is the only thing anywhere that lifts one, and it lifts
 * it by a thousandth.
 */
const GHOST_LEVEL = 0.28;
