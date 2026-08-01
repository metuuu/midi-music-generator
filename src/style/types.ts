/**
 * Vocabulary for describing an iskelmä dance rhythm.
 *
 * Everything is expressed on a sixteenth-note grid: a 4/4 bar is 16 slots, a
 * 3/4 bar is 12. Positive numbers in a rhythm cell are sounding notes, negative
 * numbers are rests, and the absolute value is the length in sixteenths.
 */

import type {
  DrumSource, DrumVoice, Effects, LayerId, SectionKind, SequencedLayer, Space,
} from '../core/types.js';
import type { InstrumentId } from './instruments.js';
import type { FeelId } from './feel.js';
import type { Chord } from '../core/chord.js';
import type { Pc } from '../core/pitch.js';
import type { Mode, Scale } from '../core/scale.js';
import type { VoicingStyle } from '../core/voicing.js';
import type { StrictnessId } from '../core/rules.js';
import type { HookId } from '../generate/hook.js';
import type { FillPalette } from '../generate/fills.js';
import type { TransitionPalette } from '../generate/transition.js';

/** One bar of melodic rhythm. `[6, 2, 8]` = dotted quarter, eighth, half. */
export type RhythmCell = number[];

export interface WeightedCell {
  cell: RhythmCell;
  weight: number;
}

/** A chord progression, one roman numeral per bar. */
export interface Progression {
  chords: string[];
  weight: number;
  /** Optional note about why this progression is idiomatic — surfaced in docs. */
  note?: string;
}

export type BassTone = 'root' | 'fifth' | 'third' | 'seventh' | 'octave' | 'approach';

export interface BassHit {
  /** Slot index within the bar, in sixteenths. */
  at: number;
  /** Duration in sixteenths. */
  dur: number;
  tone: BassTone;
  vel?: number;
}

export interface BassPattern {
  name: string;
  weight: number;
  hits: BassHit[];
  /**
   * The length of the repeating figure in sixteenths, where it is not the bar.
   * See `Cycle`.
   */
  cycle?: number;
  /**
   * Generate a proper walking line instead of following `hits` literally:
   * quarter notes that connect one chord root to the next by step, with a
   * chromatic approach on beat 4. The signature sound of a jazz rhythm
   * section, and not something a fixed pattern can fake.
   */
  walking?: boolean;
  /**
   * Merge a note into the one before it when they are the same pitch and meet
   * end to end, instead of re-articulating.
   *
   * This is what separates a pedal from a pulse. Eight bars of one chord at
   * 60 BPM re-attacked on every downbeat is a bass playing a slow crotchet
   * figure; held through, it is a drone, and a drone is what ambient is built
   * on. The pad already merges this way, and for the same reason.
   */
  sustain?: boolean;
}

export interface CompHit {
  at: number;
  dur: number;
  vel?: number;
}

/**
 * How far the comper departs from the figure they are playing.
 *
 * Every chordal part in this generator is a `CompPattern` — a figure, stated and
 * repeated — and for a dance band that is not an approximation, it is the job. A
 * humppa piano plays the oom-pah on every bar of every chorus and a tango guitar
 * plays the same two stabs all night, because what those parts are *for* is a
 * floor full of people knowing where beat one is.
 *
 * A jazz comper is the opposite instrument. Measured before this existed: where
 * a blues chorus repeats a chord in consecutive bars, the piano played a
 * **note-for-note identical bar 79% of the time**, and a twelve-bar section
 * averaged 2.24 distinct bar-rhythms. That is not a sparse comper or a tasteful
 * one, it is a loop — and a comper who never varies is more audible as a machine
 * than any wrong note would be.
 *
 * So this is the amount of *not playing the figure*, and it is absent by default
 * because absent is correct for most of the catalogue. Three gestures, and each
 * one is a thing a comper does rather than a knob:
 *
 *  - **Rest.** The most important and the least obvious. A comper who plays every
 *    bar is accompanying nothing; the holes are what make the chords land.
 *  - **Anticipate.** The chord arrives an eighth before the barline and rings
 *    through it — the single most characteristic gesture in the idiom, and the
 *    one thing a figure repeated on the grid can never produce.
 *  - **Displace.** An offbeat stab nudged an eighth either way, so two bars of
 *    the same figure are not the same bar twice.
 *
 * Not line-aware, deliberately. The comp is written before the melody — see the
 * order in `generateSong` — so it cannot answer a phrase it has not heard. What
 * reacts to the finished tune is `patchBand` and the solo backing policy, which
 * already exist and already do that job.
 */
export interface CompingProfile {
  /** Chance a bar is left out altogether, 0..1. */
  rest: number;
  /** Chance a bar's chord also sounds an eighth ahead of its own barline. */
  anticipate: number;
  /** Chance an offbeat hit in a bar is nudged an eighth either way. */
  displace: number;
}

export interface CompPattern {
  name: string;
  weight: number;
  voices: number;
  hits: CompHit[];
  /**
   * The length of the repeating figure in sixteenths, where it is not the bar.
   * See `Cycle`.
   */
  cycle?: number;
  /** How the chord is stacked. Defaults to `tertian`. */
  voicing?: VoicingStyle;
  /**
   * Play one note of the voicing per hit instead of the whole chord, walking a
   * ladder built from the voicing and carrying the position across barlines.
   *
   * A comp pattern sounds the entire voicing at once, which is what a pianist
   * does and the opposite of what a sequencer does. Carrying the index across
   * bars is the important half: a four-note figure against a four-beat bar
   * would otherwise land identically every bar, and the whole appeal of a
   * Berlin-school sequence is that the pattern and the bar drift out of phase.
   *
   * See `arpDirection` and `arpOctaves` for the shape of the ladder, and
   * `arpLadder` in `generate/parts.ts` for how it is built.
   */
  arpeggio?: boolean;
  /**
   * Which way the figure walks its voicing. Defaults to `up`.
   *
   * For a long time this was not a field and the answer was always `up`, which
   * meant every arpeggio in the repo — six sequencer patterns across two
   * styles, a broken chord, a slow ambient figure — had the *same contour*.
   * That is not a small sameness: voicings are led to move as little as
   * possible from bar to bar, so a rising walk through consecutive chords
   * produces very nearly the same shape over and over, and the only thing
   * distinguishing one sequence from another was its step count.
   *
   * `updown` and `downup` are the ones worth reaching for, and not because
   * they are prettier. They make the ladder **longer than the voicing** — four
   * notes become six rungs — so a figure whose step count already disagreed
   * with the bar now disagrees with the ladder too, and the pattern takes
   * three times as long to come back round to where it started.
   */
  arpDirection?: 'up' | 'down' | 'updown' | 'downup';
  /**
   * How many octaves the ladder spans. Defaults to 1 — the voicing as voiced.
   *
   * The octave jump is the signature of a step sequencer and was unreachable:
   * a walk through a four-note voicing spans a tenth at most, where the figure
   * everyone remembers off a Berlin-school side climbs two octaves and drops
   * back. Asking for 2 does not push the part into the melody's register — the
   * voicing is placed an octave *lower* to make room, so the figure occupies
   * the same span it always did and starts from further down. See
   * `generateComp`.
   */
  arpOctaves?: number;
  /**
   * Merge a chord into the one before it when the harmony has not moved,
   * instead of re-striking the whole voicing on every downbeat. The same
   * mechanism as `sustain` on a bass pattern, and wanted for the same reason:
   * a chord restruck every bar is a pulse, and a drone has no pulse.
   *
   * Only meaningful on a pattern that already fills its bar. On one that leaves
   * a gap, the gap is the pattern.
   */
  sustain?: boolean;
}

export interface DrumPattern {
  name: string;
  weight: number;
  /** Slot indices per drum voice, in sixteenths. */
  voices: Partial<Record<DrumVoice, number[]>>;
  /**
   * The length of the repeating figure in sixteenths, where it is not the bar.
   * See `Cycle`.
   */
  cycle?: number;
}

/**
 * ## Cycle — the figure that is not the bar
 *
 * Every pattern in this file used to be read as "one bar, repeated", and the
 * repeat was not a property of the table but of the loop that read it: the bass,
 * comp and drum generators walked bars and applied the hits inside each one. So
 * a figure three beats long over a four-beat bar — the single most common device
 * in anything anyone calls progressive — was not merely absent from the tables,
 * it was **inexpressible**, and no amount of writing new patterns would have
 * produced one.
 *
 * `cycle` says how long the figure actually is, in sixteenths, and the
 * generators walk cycles rather than bars. A `cycle` of 12 against a 4/4 bar is
 * a three-beat ostinato that arrives on a different beat every bar and comes
 * back round every three; a `cycle` of 20 against a 7/8 bar takes ten bars to
 * return. That drift is the whole point and is what separates an ostinato from a
 * riff.
 *
 * Three things stay bar-shaped no matter what the cycle is, because they are
 * properties of the harmony rather than of the figure:
 *
 *  - **Chords change on the barline.** A hit halfway through a cycle that
 *    straddles a barline takes the chord it lands in, which is what a player
 *    reading a chart does.
 *  - **Voicings are led per bar.** A comp finds a position for the bar and
 *    stays in it; see `generateComp`.
 *  - **Drum fills belong to the last bar**, not to the last cycle.
 *
 * Absent means the figure is the bar, which is what almost every dance rhythm
 * in the catalogue actually is. Leave it absent unless the drift is the idea.
 */

/**
 * What the left hand is *doing*, as opposed to where it is.
 *
 * The first version of this had one behaviour and no name for it, which is the
 * usual shape of a missing abstraction: the left hand answered in the holes the
 * right hand left, always, and that is one of the five things a two-handed
 * player does rather than the definition of playing two-handed. A pianist who
 * only ever answered would be a pianist with a tic.
 *
 * These are chosen per *section*, not per song. That is the load-bearing half:
 * a trio changing what the left hand does at the top of a chorus is the single
 * clearest signal that an arrangement was arranged, and it costs one draw.
 */
export type LeftHandMode =
  /**
   * Punctuate where the line has stopped. The rootless post-war comping sound,
   * and what this generator did exclusively before the others existed.
   */
  | 'answer'
  /**
   * Double the line, an octave down, note for note.
   *
   * The two-hand unison line — Corea, Hiromi, half of what anyone means by
   * "complicated piano jazz" — and the mode that made the union necessary,
   * because it is not a chord at all. Every other mode voices a chord somewhere
   * under the tune; this one plays the tune.
   */
  | 'unison'
  /**
   * A chord struck *with* the line rather than around it: same onsets, held
   * under the note.
   *
   * Written as a left hand under the melody rather than as full locked-hands
   * harmony, which would put chord tones a second below the tune and break the
   * one invariant the IR relies on to get the line back out again — see
   * `melodicLine` and `HandSpec.gap`.
   */
  | 'block'
  /**
   * A figure that repeats regardless of what the right hand is doing.
   *
   * The montuno, the vamp, the riff the whole band is sitting on. It ignores the
   * line entirely — which is exactly why it works under a busy one, where
   * `answer` correctly falls silent and leaves the texture thin.
   */
  | 'ostinato'
  /**
   * A bass note, then the chord, then the bass note again.
   *
   * Stride, oom-pah, the stradella button side, boom-chuck — the same left hand
   * under four names, and the only one of these modes that plays a **bass line**
   * rather than voicing a chord somewhere. It is what a pianist does when there
   * is nobody else to state the root and what an accordionist does whether there
   * is or not: the bass buttons and the chord buttons are two different rows,
   * and playing them alternately is the instrument's entire left-hand idiom.
   *
   * Missing for as long as this list had four entries, and the absence was
   * loudest on the two instruments most associated with it. A humppa accordion
   * comping in the holes is a jazz pianist's left hand on the wrong instrument;
   * the oom-pah is not a decoration on that style, it is the style.
   *
   * Like `unison` it needs something from the instrument that not every hand has
   * — somewhere to put the bass note, `HandSpec.bass` — and like `unison` it is
   * filtered out of the draw where that is missing rather than chosen and then
   * quietly producing nothing.
   */
  | 'stride';

/**
 * The lead is a keyboard — or a vibraphone, or an accordion — and it plays with
 * both hands.
 *
 * Every other lead in this generator is one line: a horn plays the tune, the
 * comp instrument plays the chords, and they are two players in two layers. A
 * pianist fronting a trio is not that. The right hand has the tune and then the
 * chorus; the left hand answers it, doubles it, locks with it or vamps under it;
 * and the two are **one part played by one person**, which is the whole reason
 * this exists as a declaration rather than as a second track.
 *
 * That distinction is load-bearing all the way to the stage. Two tracks would
 * cast two pianists standing at two pianos. One track carrying notes two
 * octaves apart is a single performer whose chord splits across both hands by
 * itself — `keyboardPart` in `concert/choreograph.ts` already divides a group at
 * its widest interval, and the widest interval in a bar of this is exactly the
 * gap between the left hand's voicing and the right hand's line. Nothing on the
 * staging side had to be told about any of this, and nothing had to be told
 * about the vibraphone or the accordion either: `malletPart` and the accordion's
 * button split were both already there, waiting for a generator that would write
 * something for the other hand to do.
 *
 * **Where the physical facts live.** Not here. How low a left hand goes, how
 * many notes it can hold and how it stacks them are facts about the instrument,
 * not about the style — a vibraphonist's left hand holds two mallets in a bebop
 * head and in a ballad alike. Those live in `HandSpec`, keyed by instrument, in
 * `style/instruments.ts`. What is left here is what genuinely is the style's
 * business: which instruments are eligible, how much the left hand speaks, and
 * which of the five things it does.
 */
export interface TwoHandedKeys {
  /**
   * Eligible leads, weighted, overriding the era's palette for the lead layer.
   *
   * A style may name its leads here and nowhere else, and only because this
   * particular style *is* the instrument: a piano trio with a flute on the tune
   * is not a piano trio. The draw still happens — see `chooseInstruments` — so
   * a seed reproduces the same song either way.
   *
   * Every id listed must have a `HandSpec`, or there is no left hand to write.
   * `npm run genres` asserts it.
   *
   * **Optional, and the empty case is the commoner one.** A style that omits it
   * says something weaker and much more widely true: *whoever ends up playing,
   * if they have two hands, they use them.* A tango is not defined by having an
   * accordion out front the way a piano trio is defined by the piano — the
   * palette may hand it a saxophone — but on the nights it does draw the
   * accordion, that accordion plays its own bass and chords, because that is
   * what the instrument does. Seizing the palette to get the left hand would
   * have meant a genre of accordion tangos and nothing else.
   */
  instruments?: (readonly [InstrumentId, number])[];
  /** Chance the left hand speaks at any given opportunity, 0..1. */
  density: number;
  /**
   * What the left hand does, weighted, drawn once per section. Defaults to
   * `answer` alone, which is what this was before it could do anything else.
   */
  modes?: (readonly [LeftHandMode, number])[];
  /**
   * The figure, for `ostinato`. Cycles like any other pattern, and the cycle is
   * usually the point — see `Cycle`.
   *
   * Required if `ostinato` can be drawn; asserted by `npm run genres`, because
   * a style that draws a mode it has no figure for would silently fall back to
   * answering and the table would look like it was working.
   */
  ostinato?: { cycle: number; hits: CompHit[] };
}

export interface Style {
  id: string;
  label: string;
  /** Short explanation of the rhythm, used in the README and the demo UI. */
  description: string;
  /**
   * Quarter-note beats in a bar. Fractional where the metre is written in
   * eighths: 7/8 is 3.5, which is 14 sixteenths and divides exactly.
   *
   * The engine's beat is always a quarter — `beatUnit` is notation, read only by
   * the MIDI time-signature event — so a metre in eighths is spelled by how much
   * of a quarter-note bar it fills. That is arithmetic rather than a lie: 7/8
   * genuinely is three and a half quarters, and every slot index in the tables
   * below stays an honest sixteenth.
   */
  beatsPerBar: number;
  beatUnit: number;
  /**
   * How the bar groups, in sixteenths, where it does not group evenly.
   *
   * `[4, 4, 6]` is the 2+2+3 of a 7/8; `[12, 8]` is the 3+2 of a 5/4. Absent
   * means the bar divides into equal beats, which is true of everything that
   * gets danced to and false of most of what gets called progressive.
   *
   * This has to be declared because it cannot be derived. `metricStrength`
   * computes accent from slot arithmetic — divide by four, land on a beat — and
   * that arithmetic is *correct* for 4/4 and *confidently wrong* for 7/8, where
   * it puts a half-bar accent on an odd sixteenth in the middle of the second
   * group. There is no formula that recovers 2+2+3 from the number 14; the
   * grouping is a compositional choice, and 2+2+3 is a different piece of music.
   *
   * Must sum to `beatsPerBar * 4`. `npm run genres` asserts it, because the
   * failure mode of a grouping that does not add up is a phrase whose accents
   * drift a sixteenth per bar, which sounds like a bug in the swing.
   */
  groups?: number[];
  bpm: [number, number];
  /** 0 = straight. Foxtrot and some 60s material shuffle lightly. */
  swing: number;
  /** Relative likelihood of the song being in minor vs major. */
  modeWeights: Record<Mode, number>;
  /**
   * Does the chorus lift into the relative major? A defining iskelmä move:
   * melancholy verse in i, hopeful chorus in III.
   */
  relativeMajorChorus: number;
  /**
   * Progressions for the style's *primary* mode — minor for tango and modal
   * jazz, major for humppa and swing. Whichever mode a style mostly lives in.
   */
  progressions: Partial<Record<SectionKind, Progression[]>> & {
    verse: Progression[];
    chorus: Progression[];
  };
  /**
   * Overrides for the other mode. Roman numerals are read relative to the
   * mode, so a major-key table read in minor produces nonsense — a style that
   * can appear in both modes needs the table for each.
   */
  majorProgressions?: Partial<Record<SectionKind, Progression[]>>;
  minorProgressions?: Partial<Record<SectionKind, Progression[]>>;
  melodyCells: WeightedCell[];
  /** Cells reserved for phrase endings — longer, more settled. */
  cadenceCells: WeightedCell[];
  bass: BassPattern[];
  comp: CompPattern[];
  drums: DrumPattern[];
  /**
   * Layers this style never uses, regardless of arrangement density. A drone
   * has no drum kit and no brass section, and no amount of density should
   * conjure one.
   */
  excludeLayers?: LayerId[];
  /**
   * Layers this style always uses, regardless of section kind or density.
   *
   * The mirror of `excludeLayers`, and ambient is why it exists. The default
   * arrangement rules treat `pad` as decoration added when there is room for
   * it — true for a dance band, exactly backwards for music where the pad *is*
   * the piece and everything else is decoration on it.
   */
  requireLayers?: LayerId[];
  /**
   * Does this style end its sections with a drum fill? Defaults to true.
   *
   * A tom roll into a crash is how a dance band signposts the next section. In
   * ambient it is the single most out-of-place thing the drum generator can
   * do — the idiom's whole proposition is that sections arrive without being
   * announced.
   */
  drumFills?: boolean;
  /**
   * May a preset rhythm box play this style at all? Defaults to true.
   *
   * The era decides how likely a box is; this decides whether it is *possible*,
   * and the two are different questions. A decade can be full of Mini Pops and
   * still contain one style whose identity is a person behind a kit — a shuffle
   * whose whole character is the swing between the hands, a march that has to
   * accelerate. Those cannot be expressed as a low weight, because a low weight
   * still fires sometimes and the result is not a quiet version of the style, it
   * is the style with its subject removed.
   *
   * Set it false and the box is struck from this style's pool before the draw.
   * The era's other sources take up the weight; nothing else changes.
   */
  boxDrums?: boolean;
  /**
   * Which fill shapes this style's drummer reaches for. Falls back to the
   * genre's palette, then to a dance-band default.
   *
   * A tom roll is a dance-band gesture. It is not what a bebop drummer plays
   * into the head, and it is not what a bossa drummer plays into anything —
   * see `generate/fills.ts`.
   */
  fills?: FillPalette;
  /**
   * What this band does at a section join, weighted, drawn once per seam.
   * Overrides the genre's palette where present. See `generate/transition.ts`.
   *
   * A fill is one entry here rather than the whole vocabulary, which is the
   * point: today every section boundary in the catalogue is announced by the
   * drummer and nobody else, and `shot`, `break` and `elide` are the three
   * things the rest of the band does about a join.
   *
   * **Absent means `DEFAULT_TRANSITIONS` and means no draw**, exactly as `feels`
   * below documents at length and for exactly the same cost — and here the two
   * statements a palette can make are unusually close together, because
   * `[['fill', 1]]` *is* `DEFAULT_TRANSITIONS`. A style that writes it out has
   * thought about its seams and said "the drummer, as ever"; a style with no
   * palette has not been asked, and generates the song it generated before this
   * file mentioned transitions, bit for bit. Both produce identical music. Only
   * the second one takes no number out of the stream, and that is the one that
   * matters — see the `drumSource` note in `generate/song.ts` for what one
   * consumed draw cost the last time.
   */
  transitions?: TransitionPalette;
  /**
   * Beats between successive notes of a counter-melody figure. Defaults to
   * 0.5 — an eighth note, which is right for anything danced to.
   *
   * The counter answers in the lead's gaps, and in ambient those gaps are
   * bars rather than beats. Answering an eight-second silence with a burst of
   * eighth notes reads as a different piece of music breaking in.
   */
  counterSpacing?: number;
  /**
   * What the counter layer *is*. Defaults to `answer`.
   *
   * `answer` is a second player replying in the lead's gaps, which is what a
   * counter-melody has been everywhere in this project so far. `ostinato` is not
   * a reply at all — it is a second figure running continuously alongside the
   * first, and the Berlin-school texture is two of them at different cycle
   * lengths, phasing against each other.
   *
   * The distinction has to be declared rather than inferred, because the two
   * want opposite treatment from the arranger: an answering line is *supposed*
   * to be moved out of the melody's way note by note, and an ostinato moved note
   * by note has stopped being an ostinato. See `avoidClash`.
   */
  counterMode?: 'answer' | 'ostinato';
  /**
   * The figures for `counterMode: 'ostinato'`, drawn like any other pattern.
   * Their `cycle` is usually the point — see `Cycle`.
   */
  counterPatterns?: CompPattern[];
  /**
   * How the filter moves. Absent means it does not, which is what every style
   * in the project did before this existed.
   *
   * `depth` is how far the sweep closes at its darkest, 0..1, scaled against the
   * track's own cutoff. `shape` is whether the movement happens *across* a
   * section or *at* its edges:
   *
   *   ramp   the filter opens over the section's bars. The Berlin-school
   *          gesture, and the reason this field exists — a sixteen-bar opening
   *          is the composition, not a mix move.
   *   step   one value per section, held. What a style wants when it needs the
   *          chorus brighter than the verse and nothing more athletic.
   *
   * There is deliberately no `gate`. The gated sound in this repertoire is
   * amplitude rather than filter, and `CompHit.vel` already carries it.
   */
  filter?: { depth: number; shape: 'ramp' | 'step' };
  /**
   * Override the genre's default constraint level. Bebop wants `free`: the
   * chromatic approach notes and unprepared dissonances the rules exist to
   * suppress are precisely what the idiom is made of.
   */
  strictness?: StrictnessId;
  /**
   * Override the genre's default repetition level. How much a style repeats
   * itself is one of the things that distinguishes styles inside a genre:
   * humppa is relentless where tango develops, and bebop is the extreme case
   * of a music whose whole value proposition is never playing it twice.
   */
  hook?: HookId;
  /**
   * Where this style's melody gets its notes, overriding the genre's answer.
   *
   * Absent on every style but one, and that is the point: the genre's mapping is
   * the idiom's mapping, and a style that overrides it is making a claim about
   * itself rather than about its genre.
   *
   * The blues is why this exists. Jazz follows the *chord* — each quality implies
   * its own scale and the line re-orients bar by bar — and that is correct for
   * every jazz style in the catalogue except the one whose entire sound is a
   * fixed tonic scale dragged across moving changes. A blues line that
   * re-orients onto each dominant is a bebop line over blues changes, which is a
   * real and different music.
   */
  scaleForChord?(tonic: Pc, mode: Mode, chord: Chord): Scale;
  /**
   * How this style's sections may be *felt*, weighted, drawn once per section.
   * Overrides the genre's table where present. See `style/feel.ts`.
   *
   * Absent is not the same statement as `[['straight', 1]]`, and the difference
   * is the one constraint this whole mechanism has to respect. A style that
   * names `straight` alone has thought about it and said no; a style with no
   * table has not been asked, **draws nothing**, and generates the song it
   * generated before feels existed, bit for bit. That is not tidiness — the
   * `drumSource` note in `generate/song.ts` records what one number taken out of
   * a shared stream costs, which was every song in every genre and a check
   * dropping from 66% to 59%.
   *
   * Six styles carry one today, out of twenty-three, and each names at most two
   * entries beside `straight`. Six feels applied liberally across four genres
   * would make everything sound like the same band, so the library grew and the
   * enabling did not: every table is a decision about one style, made once, with
   * the reason written beside it.
   */
  feels?: (readonly [FeelId, number])[];
  /**
   * Bars per chorus when the form is built on a fixed chorus length rather
   * than eight-bar units. 12 for the blues.
   */
  chorusBars?: number;
  /**
   * The lead plays with both hands. Absent on any style whose lead is a horn or
   * a voice, which is most of them — see `TwoHandedKeys`.
   */
  twoHanded?: TwoHandedKeys;
  /** Melodic character knobs. */
  melody: {
    /** Probability of a leap (>2 semitones) at any given non-cadential note. */
    leap: number;
    /** Probability of adding a grace/passing ornament. */
    ornament: number;
    /** Preferred melodic span in semitones. */
    span: number;
    /** Probability that a phrase repeats its motif as an exact sequence. */
    sequence: number;
    /**
     * Appetite for rhythm that crosses the barline: pickups, anticipated
     * downbeats, notes tied through the bar. 0 keeps every figure inside its
     * own bar, which is what the generator used to do everywhere and is right
     * almost nowhere. Defaults to 0.3.
     *
     * This belongs to the style rather than to smoothness. A tango pushes its
     * downbeats because that is what a tango is, not because its voice leading
     * is being policed loosely.
     */
    syncopation?: number;
  };
}

export interface EraProfile {
  id: string;
  label: string;
  description: string;
  /**
   * The year this era is standing in — roughly the middle of the window it
   * covers.
   *
   * Here because the *visual* side needs a decade and cannot use `id`. Era ids
   * are genre-local: ambient's are `tape`/`sampler`/`hybrid`, this genre's are
   * `modular`/`polysynth`/`digital`, and iskelmä's are `tanssilava`/`eighties`.
   * A stage model that branched on the id would have to learn all four
   * vocabularies and would be wrong the moment a fifth genre appeared.
   *
   * A year is genre-neutral and is what actually decides the question being
   * asked. What a synthesiser *looks like* is not a fact about ambient or about
   * this genre — it is a fact about 1974, when the instrument was a wall of
   * patch cables, versus 1987, when it was a plastic slab with no knobs on it.
   * Two genres whose eras land in the same decade should stage the same object,
   * and with a year they do so without either knowing the other exists.
   *
   * Nothing audible reads this. It is production metadata that happens to be
   * true, which is the same standing `label` and `description` already have.
   */
  year: number;
  /** Strudel drum-machine banks, weighted. */
  drumBanks: (readonly [string, number])[];
  /**
   * What is *producing* the percussion, weighted. See `DrumSource`.
   *
   * Deliberately not derivable from `drumBanks`, which is a sample library and
   * says nothing about the room — this era's own banks are the sound, and this
   * is the object making it.
   *
   * Absent means a kit, which is what every era staged before this existed, so
   * a genre with nothing to say here says nothing. The weights are only ever
   * consulted for sources the era's `year` can actually have: the gate in
   * `eligibleDrumSources` runs first and is not overridable from here, so a
   * table listing a Simmons kit in 1938 gets a drummer rather than an argument.
   */
  drumSources?: (readonly [DrumSource, number])[];
  /**
   * How often a part is left to a sequencer rather than played, by layer.
   *
   * A chance per layer rather than a weighted choice, because these are
   * independent: a band may sequence its bass, its counter figure, both or
   * neither, and those are four real arrangements. `DrumSource` is a weighted
   * draw because a number has exactly one thing making the percussion.
   *
   * Absent means never, which is what iskelmä and jazz mean — a pavilion
   * orchestra and a bop quintet had no sequencer and would not have wanted one.
   * The year gate in `SEQUENCER_FROM` runs first and is not overridable from
   * here.
   */
  sequenced?: Partial<Record<SequencedLayer, number>>;
  /** Instrument choices per layer, weighted. */
  palette: {
    melody: (readonly [InstrumentId, number])[];
    counter: (readonly [InstrumentId, number])[];
    comp: (readonly [InstrumentId, number])[];
    pad: (readonly [InstrumentId, number])[];
    bass: (readonly [InstrumentId, number])[];
    brass: (readonly [InstrumentId, number])[];
  };
  /** Style weights — some dances belong more to one era than the other. */
  styleWeights: Record<string, number>;
  /** Multiplier applied to the style's tempo range. */
  tempoScale: number;
  /** How likely the final chorus lifts by a semitone or tone. */
  keyChangeChance: number;
  /** Overall arrangement density 0..1, nudges how many layers play at once. */
  density: number;
  /**
   * The room this era records in. Merged over the genre's, which is merged
   * over `DEFAULT_SPACE`.
   */
  space?: Partial<Space>;
  /**
   * Per-layer filtering, reverb send and stereo position, merged *over* the
   * genre's. This is the natural home for effects: the era already decides
   * which drum machine and which instruments, and how wet and how dark the
   * result is belongs in exactly the same sentence. A 1990s sampler score and
   * a 2000s hybrid one differ far more in reverb and filtering than they do in
   * their choice of patches.
   */
  effects?: Partial<Record<LayerId, Effects>>;
}

export interface Mood {
  id: string;
  label: string;
  /** English gloss for UI. */
  gloss: string;
  /** Per-style multipliers applied on top of the era's style weights. */
  styleBias: Record<string, number>;
  /** Multipliers on the style's own mode weights. */
  modeBias: { minor: number; major: number };
  /** -1 = bottom of the tempo band, +1 = top. */
  tempo: number;
  /** Added to the era density, clamped to [0.25, 1]. */
  density: number;
  /** Multiplier on the style's ornament probability. */
  ornament: number;
  /** Multiplier on melodic leap probability — calmer moods move by step. */
  leap: number;
  /** Bias on how often the arrangement drops to a sparse texture. */
  restraint: number;
  /**
   * Multipliers on the per-section feel draw, exactly as `styleBias` already
   * works over the era's style weights.
   *
   * A mood biases how a passage is felt; it cannot introduce a feel the style
   * has not named, because the style's table is the list of things this band
   * would do and a mood is not entitled to add to it. Partial rather than
   * complete — a mood with an opinion about one feel should not have to restate
   * 1.0 for every other, and the library is expected to grow.
   */
  feelBias?: Partial<Record<FeelId, number>>;
}
