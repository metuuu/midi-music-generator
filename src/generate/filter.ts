/**
 * Filter — how far open the tone is on every note, and why that is material.
 *
 * `Track.effects.lowpass` is one number per track: what this instrument sounded
 * like in this decade, fixed for the length of the song. That is the truth
 * about a dance band, where the cutoff is the microphone, the room and the
 * tape. It is exactly wrong about sequencer music. There the notes deliberately
 * do not change — two bars of arpeggio repeated forty times is an honest
 * description of the material and no description at all of the piece — and the
 * entire event is a filter opening over them across sixteen bars. Take the
 * sweep out of Berlin-school and nothing happens for six minutes.
 *
 * So brightness is generated here, next to the notes, rather than set in the
 * mix. The relationship is the one `NoteEvent.brightness` states: the track
 * says where this instrument's tone sits in this decade, the note says where in
 * that range this moment sits, and the note can only ever be darker.
 *
 * This file is deliberately the sibling of `generate/dynamics.ts`, and its
 * first three inputs are that file's three, asked about colour instead of
 * level:
 *
 *  1. **What kind of section this is.** An intro is dark and a chorus is open.
 *  2. **Where it falls in the form.** Records build, the last statement is the
 *     brightest, and the outro is the one place that closes back down.
 *  3. **How much the layer responds.** A sequencer comp swings the whole range;
 *     a bass barely moves, for a reason given at `LAYER_RESPONSE`.
 *
 * And one input dynamics has no way to express, which is why this is a separate
 * file rather than three more columns in that one:
 *
 *  4. **The shape of the movement.** `applyDynamics` assigns one value per
 *     section per layer. A ramp is movement *inside* a section, and a sixteen-
 *     bar opening cannot be written as a per-section constant no matter how
 *     many constants you are allowed.
 *
 * Three of the four genres here say nothing about the filter, and this file
 * says nothing back — see the no-op in `applyFilter`. A quartet, a tanssilava
 * band and a drone are not played on the filter, and a static cutoff is the
 * truth about all three.
 */

import type { LayerId, NoteEvent, SectionKind } from '../core/types.js';
import type { Genre } from '../genre/types.js';
import type { Style } from '../style/types.js';
import type { SectionPlacement } from './dynamics.js';

/** `Genre.filter`, present. Which sections are dark and which layers move. */
export type FilterProfile = NonNullable<Genre['filter']>;

/** `Style.filter`, present. How far the sweep goes and whether it ramps. */
export type FilterSweep = NonNullable<Style['filter']>;

/**
 * Base openness per section kind, 0..1, for the kinds a genre leaves out.
 *
 * The structural gap here is intro-to-chorus, where for level it is
 * chorus-to-bridge. Loudness separates the sections that compete with each
 * other; brightness separates the ones that arrive from the ones that are
 * already there.
 *
 * An intro at 0.30 is genuinely dark — the sequence reads as a pulse before it
 * reads as notes, which is what a Berlin-school opening is doing. A chorus at
 * 1.00 is not brightened, it is merely unfiltered: the brightest a note is
 * allowed to be is whatever the era already decided the track's cutoff is.
 *
 * The bridge sits above the verse, the opposite of what the level table does
 * with it. A bridge drops back in volume so it cannot compete with the chorus,
 * but the thing a bridge is *for* is a change of colour, and taking the colour
 * away as well leaves a verse that is merely quieter.
 *
 * The outro closes a little further than the intro opened. An ending that
 * stopped at the intro's brightness sounds like it is about to begin again.
 */
const KIND_OPEN: Record<SectionKind, number> = {
  intro: 0.30,
  verse: 0.58,
  chorus: 1.00,
  bridge: 0.70,
  solo: 0.92,
  outro: 0.26,
};

/**
 * How far each layer swings between its darkest and its brightest, for the
 * layers a genre leaves out.
 *
 * The comp gets the whole range because in this repertoire the comp is the
 * sequencer, and the sequencer is what the sweep is about.
 *
 * The bass is at the bottom of the table for a reason worth stating, because
 * the obvious move is to sweep the whole band together and it is wrong. A
 * lowpass closing on a part whose entire content already sits below the cutoff
 * does not darken that part, it removes it. A filtered bass does not sound
 * distant, it sounds absent — and the arrangement loses its floor at exactly
 * the moment an intro is trying to establish one.
 *
 * The voice is low for the neighbouring reason. Consonants live in the band a
 * lowpass takes first, and a voice with its consonants filtered off does not
 * read as a darker voice, it reads as a fault in the recording. Drums are lower
 * still: a kit is mostly noise, and closing a filter over noise changes which
 * kit it is rather than how far away it is.
 */
const LAYER_RESPONSE: Record<LayerId, number> = {
  drums: 0.20,
  bass: 0.12,
  comp: 1.00,
  pad: 0.70,
  melody: 0.55,
  counter: 0.85,
  brass: 0.50,
  vocal: 0.30,
};

/**
 * Where a ramp starts, as a fraction of where it ends.
 *
 * 0.55 rather than 0, because a sweep that begins fully closed begins in
 * silence, and sixteen bars of a sequence nobody can hear yet is not an opening
 * — it is a late start. The figure has to be audible from the first bar and
 * merely dull, so that what opens is a part the listener is already following.
 */
const RAMP_FLOOR = 0.55;

/**
 * Steps the emitted value is quantised to. Sixteen, and this is not cosmetic.
 *
 * The Strudel renderer writes per-note values into a mini-notation grid, one
 * token per onset, and repeated values collapse. An unquantised float per note
 * never repeats, so every track would carry a full-length grid of distinct
 * numbers — the sweep would cost more characters than the notes it is applied
 * to. Sixteenths keep everything audible about the movement, since the ear does
 * not resolve a 6% step in cutoff underneath a sweep that is already moving.
 *
 * The divisor is 16 rather than 15 for the same reason: 1/16 is exact in
 * binary, so two notes that land on the same step compare equal instead of
 * differing somewhere in the last decimal place and printing as two tokens.
 */
const STEPS = 16;

/** One section, as the filter sees it. */
export interface FilterSection {
  /**
   * The genre's `filter`. Absent means this genre's filter does not move, which
   * is the case for most of them.
   */
  profile?: FilterProfile;
  /** The style's `filter`. Absent means this style does not sweep. */
  sweep?: FilterSweep;
  /** Where the section falls in the form — the same placement dynamics uses. */
  at: SectionPlacement;
  /** Absolute beat the section starts on. */
  startBeat: number;
  /** How long the section is, in beats. Ramps are measured against this. */
  lengthBeats: number;
}

/**
 * How open the filter is over this section, 0..1, before layer or style scaling.
 *
 * `build` is the whole distance between the first statement and the last, and
 * it is split two ways: two thirds from where the section falls in the form,
 * one third from how many times its kind has already been heard. Position
 * dominates because the shape of a record is the shape of a record even when
 * nothing returns — a form with one chorus in it still gets brighter on the way
 * to the end.
 */
export function sectionOpenness(at: SectionPlacement, profile: FilterProfile): number {
  const base = profile.kind[at.kind] ?? KIND_OPEN[at.kind];
  const build = profile.build ?? 0;

  // Spread over the form rather than over the clock, so a long piece and a
  // short one arc the same shape.
  const through = at.total > 1 ? at.index / (at.total - 1) : 0;
  const returns = Math.min(at.ordinal, 3) / 3;

  // The outro is the one section that undoes the build. Everything else is on
  // the way somewhere; the outro is on the way out. It takes back half the
  // build rather than all of it because the kind table has already put it at
  // the bottom, and subtracting the whole arc on top of that would close the
  // ending into silence.
  const arc = at.kind === 'outro'
    ? -0.5 * build
    : build * (0.65 * through + 0.35 * returns);

  return clamp(base + arc, 0, 1);
}

/**
 * Set `brightness` on one layer's notes for one section.
 *
 * Returns a new array rather than writing through the notes the way
 * `applyDynamics` does, and the no-op below is the reason. "This genre's filter
 * does not move" has to mean the notes come back with no `brightness` field at
 * all, not with 1 written on every one of them; handing back the same array
 * makes that literal instead of a convention.
 */
export function applyFilter(
  notes: NoteEvent[],
  layer: LayerId,
  section: FilterSection,
): NoteEvent[] {
  const { profile, sweep, startBeat, lengthBeats } = section;
  /**
   * Nothing to say, so nothing is said.
   *
   * A genre with no filter profile, a style with no sweep, a depth of zero and
   * a layer nothing moves are four statements of the same fact at four levels,
   * and they take the same exit: the notes come back untouched and `brightness`
   * stays absent, which every renderer already reads as all the way open.
   *
   * Writing 1 here instead would be the same sound and a much worse artefact —
   * a grid of the number one, per track, describing a filter that does not
   * exist.
   */
  if (!profile || !sweep) return notes;
  const depth = clamp(sweep.depth, 0, 1);
  const response = clamp(profile.response[layer] ?? LAYER_RESPONSE[layer], 0, 1);
  if (depth <= 0 || response <= 0) return notes;

  const open = sectionOpenness(section.at, profile);

  return notes.map((n) => {
    /**
     * One pass across the whole section.
     *
     * The tempting alternative is to ramp per bar, because the pattern repeats
     * per bar and the arithmetic is easier. That is an LFO at bar rate, which
     * is a different effect with a different name, and it is the one thing this
     * gesture must not be mistaken for. The sweep crosses the bar lines; that
     * is what makes it structure rather than modulation.
     */
    const t = lengthBeats > 0 ? clamp((n.beat - startBeat) / lengthBeats, 0, 1) : 1;
    // Smoothstep, because a linear ramp arrives at the top and stops dead and
    // the ear hears the corner. This one leaves and arrives.
    const eased = t * t * (3 - 2 * t);
    const moment = sweep.shape === 'ramp'
      ? open * (RAMP_FLOOR + (1 - RAMP_FLOOR) * eased)
      : open;

    /**
     * Both scalings have the same shape as the one in `applyDynamics`: at 0 the
     * note is left fully open, at 1 it gets the whole movement. Written this
     * way the result can only come out at or below 1 — which is the contract on
     * `NoteEvent.brightness`, since a sweep that opened past the track's own
     * cutoff would let a style out-bright its decade.
     */
    const lit = 1 - response * (1 - moment);
    const value = 1 - depth * (1 - lit);
    return { ...n, brightness: clamp(Math.round(value * STEPS) / STEPS, 0, 1) };
  });
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
