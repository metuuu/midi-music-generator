/**
 * Arrangement — deciding which layer occupies which register, and keeping them
 * out of each other's way.
 *
 * Every part in this generator was individually correct and the result still
 * sounded muddled, for a reason that has nothing to do with harmony: the layers
 * were all writing in the same octave. Each part took its register from its own
 * instrument's centre and knew nothing about the others, so the comp routinely
 * voiced itself straight through the tune. Measured before this file existed,
 * **the melody was being played at unison by its own accompaniment on 21–34% of
 * its notes**, and the mean top note of the comp sat *above* the mean bottom
 * note of the melody.
 *
 * That is the single most destructive thing an arrangement can do. A melody
 * doubled at unison by a sustaining chord instrument stops being a melody — it
 * fuses into the chord and the ear hears texture where it should hear a tune.
 * No amount of work on the notes themselves can survive it, which is why this
 * file comes before the note-level rules rather than after them.
 *
 * Two mechanisms, deliberately overlapping:
 *
 *  1. **Register planning**, ahead of time. The lead's tessitura is reserved and
 *     every accompaniment layer is given a ceiling under it. This is what makes
 *     the texture *stratified* — bass, comp, pad, tune, in that order, the way a
 *     score is laid out.
 *  2. **Collision repair**, afterwards. A ceiling is a static guess, and the
 *     melody does not always sit where it was expected to. The repair pass sees
 *     the finished melody and moves whatever is still doubling it.
 *
 * Both are scaled by `clarity`, which comes from smoothness. At smoothness 0
 * the layers are allowed to pile into one octave, because that is a legitimate
 * raw sound and the axis is supposed to mean something at both ends.
 */

import type { Midi } from '../core/pitch.js';
import { pc } from '../core/pitch.js';
import { minInterval } from '../core/voicing.js';
import type { LayerId, NoteEvent } from '../core/types.js';
import { BASS_RANGE } from './parts.js';

/** Layers that must stay out of the lead's register. */
const ACCOMPANIMENT: LayerId[] = ['comp', 'pad', 'brass'];

/**
 * Semitones each accompaniment layer sits away from the shared ceiling, before
 * a genre says otherwise.
 *
 * Only the pad moves, and the reason is in `planRegisters` below: given the same
 * ceiling the pad and the comp produce the identical voicing, and two layers
 * playing the same notes are one layer at twice the volume. A minor third is
 * enough daylight to make the pair read as a bed with a rhythm part on it.
 *
 * It is a *default* rather than a rule because it is a dance band's answer.
 * Music where the pad is the piece wants it the other way up, and that is a
 * genre's statement to make — see `Genre.layerPlan`.
 */
const DEFAULT_OFFSETS: Partial<Record<LayerId, number>> = { pad: -3 };

/** How far below its own centre a layer may be pushed before it leaves its instrument. */
const DEFAULT_HEADROOM: Partial<Record<LayerId, number>> = { pad: 14 };
const HEADROOM = 9;

export interface RegisterPlan {
  /** The register the lead line is written in. */
  lead: [Midi, Midi];
  /**
   * Where the answering line sits.
   *
   * Unlike the chordal layers this one is *allowed* to overlap the lead, and
   * has to be: a counter-melody that answers a fifth below everything stops
   * sounding like a second voice and starts sounding like a harmony part. It
   * shares the lead's register and is kept independent in time instead — it
   * plays in the gaps — with the overlaps policed note by note.
   */
  counter: [Midi, Midi];
  /**
   * Highest note each accompaniment layer may reach, exclusive. Undefined means
   * unconstrained — which is what an instrumental section with no tune gets.
   */
  ceiling: Partial<Record<LayerId, Midi>>;
}

/**
 * Reserve the lead's register and push the accompaniment underneath it.
 *
 * The ceiling is set from the lead's *tessitura* rather than from its nominal
 * range. The two are very different: a range of a twelfth is declared, but the
 * phrase arc keeps the line inside the upper half of it almost all the time, so
 * a ceiling at the bottom of the declared range would shove the comp an octave
 * lower than it needs to go and hollow out the middle of the arrangement.
 *
 * `leadPresent` is false in sections with no tune, where the accompaniment is
 * the whole texture and should be allowed to fill the register it would
 * otherwise vacate. That contrast — the comp opening up when the tune drops out
 * and shrinking back when it returns — is most of what makes an arrangement
 * sound arranged.
 */
export function planRegisters(args: {
  leadCentre: Midi;
  /** The style's melodic span, in semitones. */
  span: number;
  leadPresent: boolean;
  /** 0 = layers may pile up, 1 = textbook separation. From smoothness. */
  clarity: number;
  /** Per-layer instrument centres, so no layer is pushed off its instrument. */
  centres: Partial<Record<LayerId, Midi>>;
  /** The genre's register statement, merged over `DEFAULT_OFFSETS`. */
  offsets?: Partial<Record<LayerId, number>>;
}): RegisterPlan {
  const { leadCentre, span, leadPresent, clarity, centres } = args;
  const offsets = { ...DEFAULT_OFFSETS, ...args.offsets };
  const top = Math.round(leadCentre + span * 0.6);
  const ceiling: Partial<Record<LayerId, Midi>> = {};
  const counterOf = (band: [Midi, Midi]): [Midi, Midi] => {
    // A third under the tune at the top, and a little further down at the
    // bottom, so the answer has somewhere to go that is not the tune's octave.
    const c = centres.counter ?? leadCentre - 4;
    return [Math.min(band[0] - 4, c + 8), Math.max(band[1] - 3, c - 8)] as [Midi, Midi];
  };
  if (!leadPresent) {
    const band: [Midi, Midi] = [Math.round(leadCentre - span * 0.6), top];
    return { lead: band, counter: counterOf(band), ceiling };
  }

  // Where the line actually lives, as opposed to where it is allowed to go.
  const tessituraLo = leadCentre - span * 0.35;
  // At full clarity the accompaniment stops where the tune starts; slackening
  // it lets the two interleave by up to a fourth.
  const overlap = (1 - clamp01(clarity)) * 5;
  const wanted = Math.round(tessituraLo + overlap);

  let highest = -Infinity;
  for (const layer of ACCOMPANIMENT) {
    /**
     * The pad sits lower than the comp, and wider.
     *
     * Given the same ceiling the two produce the *identical voicing* — same
     * chord, same window, same voice-leading rule — and two layers playing the
     * same notes are not two layers, they are one layer at twice the volume.
     * Dropping the pad a minor third and voicing it `spread` (see
     * `generatePad`) is what turns "chords, twice" into a bed with a rhythm
     * part on top of it.
     */
    const offset = offsets[layer] ?? 0;
    // Never push a layer so far down that it leaves its instrument's usable
    // register — a comp squeezed into the bass is worse than a little overlap.
    // A chord instrument comping nine semitones below its centre is ordinary.
    const floor = (centres[layer] ?? 60) - (DEFAULT_HEADROOM[layer] ?? HEADROOM);
    const c = Math.max(wanted + offset, floor);
    ceiling[layer] = c;
    highest = Math.max(highest, c);
  }

  /**
   * Raise the tune's floor to meet the accompaniment's ceiling.
   *
   * Without this the two windows overlap by design and the repair pass has to
   * clean up after every collision. Making them abut means the separation holds
   * by construction: the melody cannot descend into the chord because it has
   * nowhere to descend to.
   *
   * The floor is capped short of the lead's centre so a high-voiced comp cannot
   * squeeze the melody into a sliver at the top of its range.
   */
  /**
   * …and the cap is what the tune actually gets, so it has to be at least the span
   * the style asked for.
   *
   * The accompaniment's ceiling lands near `leadCentre - span × 0.35 + overlap`,
   * which is above this line in the ordinary case — so this cap, not the
   * accompaniment and not `leadCentre - span × 0.6` above it, is the melody's floor
   * in almost every song. At 0.3 that made the window `span × 0.9`: a style
   * declaring fourteen semitones of melodic span was handed twelve to write in, and
   * `planArc` then took a fraction of *that*. Measured across the catalogue the
   * median section covered ten semitones and the median whole song twelve, and
   * widening the arc alone moved it by two tenths of a semitone — because the arc
   * was never the thing binding.
   *
   * At 0.4 the window is the declared span exactly, which is the least this number
   * can mean. The melody's floor drops about a tenth of a span into the comp's
   * register and `resolveCollisions` below already runs on precisely that overlap.
   */
  const cap = Math.round(leadCentre - span * 0.4);
  const floor = Math.min(Math.max(Math.round(leadCentre - span * 0.6), highest), cap);
  /**
   * A tune needs an octave, and it needs a *whole* one.
   *
   * Below twelve semitones the window stops containing every pitch class, and
   * the cadence machinery quietly breaks: it aims at the tonic, finds no tonic
   * inside the range, and settles for whichever note the clamp happens to land
   * on. Sections closing on the tonic fell from 72% to 49% before this line
   * existed — a phrase that does not end where it was headed is the most
   * audible structural fault there is, and it showed up as a *narrowing*
   * problem rather than as a harmonic one.
   */
  const lead: [Midi, Midi] = [floor, Math.max(top, floor + 12)];
  return { lead, counter: counterOf(lead), ceiling };
}

/**
 * How low the octave-down repair may reach: two semitones under the top of
 * `BASS_RANGE`, which is where the bass part actually is.
 *
 * **A constant, and the constant is the point.** This was
 * `instruments.bass.centre + 10`, which read as "clear the bass's octave" and
 * was not: `generateBass` is never handed an instrument, so the written bass
 * line is identical whichever patch the palette deals, while that expression
 * moved with the patch's own tessitura. Almost every bass patch is centred at
 * 40 and the sum came to 50, so the mistake was invisible — until a palette
 * dealt one that was not, and then the floor rose above the notes it was
 * supposed to be protecting and the repair simply stopped happening.
 *
 * Measured over 1140 songs, as the share of collisions that ended in a thinned
 * voicing or an unrepaired unison rather than a clean octave displacement:
 *
 *     country/stringband   steel guitar (60)   100.0%  →  81.2%   upright bass 80.1%
 *     synth/polysynth      electric cello (52) 100.0%  →  77.0%   synth bass   62.0%
 *     funk/jb              baritone sax (48)    99.4%  →  77.1%   picked bass  84.3%
 *     jazz/swingera        baritone sax (48)    98.4%  →  59.3%   upright bass 63.2%
 *     classical/baroque    cello (52)           98.1%  →  75.0%   contrabass   73.0%
 *                          bassoon (50)         95.7%  →  70.8%
 *     finnfolk/pelimanni   cello (52)           91.7%  →  47.5%   contrabass   48.0%
 *
 * A steel guitar in the bass slot repaired *nothing*: every collision in the
 * comp, pad and brass was thinned out or left sounding as a unison, and nothing
 * reported it. The right-hand column is the same era's ordinary bass patch, and
 * landing on it is the whole of the fix — the patch stops being a variable in a
 * decision it was never entitled to a vote in.
 *
 * 50 and not `BASS_RANGE[1]` itself, which is the tempting tidy answer and is
 * worse. The two semitones of overlap are what nearly every song in the
 * catalogue has always had, and taking them away is not free: at a flat 52 the
 * failure rate rises across *every* bass patch — 71.4% to 75.6% overall, and up
 * on each of the thirteen rows individually — because the repair loses the last
 * whole tone it had to work with. Lower is likewise not better on its own. The
 * curve is monotonic (46 → 55.7%, 48 → 60.7%, 50 → 69.2%, 52 → 75.6%), so a
 * floor of 28 would "repair" everything by burying the accompaniment in the
 * bass's register, which is the fault this number exists to prevent. It is a
 * musical bound, not a score to maximise; 50 is the value the rest of the
 * arrangement was tuned against, and it is kept deliberately.
 *
 * Not a parameter. It was one, and the caller filled it in from the instrument.
 */
const REPAIR_FLOOR: Midi = BASS_RANGE[1] - 2;

/**
 * Move accompaniment notes that are doubling or grinding against the melody.
 *
 * Runs after the melody exists, on the layers whose notes sustain long enough
 * to fuse with it. Three faults, in descending order of how much damage they do:
 *
 *  - **unison** — the accompaniment is playing the melody's exact pitch. The
 *    tune disappears into the chord.
 *  - **octave** — audible as doubling rather than as a clash, and often wanted,
 *    so it is only touched at high clarity.
 *  - **minor ninth** — a semitone apart across an octave. Reliably sour.
 *
 * The repair is always downward by an octave, never sideways to another chord
 * tone: moving a voice to a different note changes the harmony, and an octave
 * displacement keeps the chord exactly as voiced while removing the collision.
 * When the octave down would break the voicing's own spacing, or would reach
 * below `REPAIR_FLOOR`, the note is left alone — one audible unison is better
 * than a manufactured cluster.
 */
export function resolveCollisions(args: {
  melody: readonly NoteEvent[];
  layers: Map<LayerId, NoteEvent[]>;
  clarity: number;
}): number {
  const { melody, layers, clarity } = args;
  if (!melody.length || clarity <= 0) return 0;

  // Index the melody by sixteenth so a sustained chord can be tested against
  // every note it overlaps, not just the one it started with.
  const RES = 4;
  const melodyAt = new Map<number, Midi[]>();
  for (const n of melody) {
    const from = Math.round(n.beat * RES);
    const to = Math.max(from + 1, Math.round((n.beat + n.duration) * RES));
    for (let s = from; s < to; s++) {
      const arr = melodyAt.get(s);
      if (arr) arr.push(n.midi);
      else melodyAt.set(s, [n.midi]);
    }
  }

  const fixOctaves = clarity >= 0.75;
  const drop = new Set<NoteEvent>();
  let moved = 0;

  for (const layer of ACCOMPANIMENT) {
    const notes = layers.get(layer);
    if (!notes?.length) continue;

    // Simultaneous notes form a voicing; a repair has to respect its spacing.
    const chordAt = new Map<number, NoteEvent[]>();
    for (const n of notes) {
      const k = Math.round(n.beat * RES);
      const arr = chordAt.get(k);
      if (arr) arr.push(n);
      else chordAt.set(k, [n]);
    }

    for (const n of notes) {
      const from = Math.round(n.beat * RES);
      const to = Math.max(from + 1, Math.round((n.beat + n.duration) * RES));
      let fault = false;
      for (let s = from; s < to && !fault; s++) {
        for (const m of melodyAt.get(s) ?? []) {
          const d = Math.abs(n.midi - m);
          if (d === 0) fault = true;
          else if (d === 13) fault = true;                 // minor ninth
          else if (fixOctaves && d === 12 && layer !== 'pad') fault = true;
        }
      }
      if (!fault) continue;

      const together = (chordAt.get(from) ?? []).filter((o) => o !== n);
      const lower = n.midi - 12;
      const safe = lower >= REPAIR_FLOOR && together.every((o) => {
        if (o.midi === lower) return false;
        const bottom = Math.min(o.midi, lower);
        return Math.abs(o.midi - lower) >= minInterval(bottom, clarity);
      });

      if (safe) {
        n.midi = lower;
        moved++;
        continue;
      }

      // Nowhere to put it. Thin the voicing instead — which is what an arranger
      // does when a voice is in the singer's way and cannot be moved. Only safe
      // when the note is a doubling or the chord can spare its top: dropping a
      // note that is carrying the chord's quality trades one fault for a worse
      // one.
      const doubled = together.some((o) => pc(o.midi) === pc(n.midi));
      const isTop = together.every((o) => o.midi < n.midi);
      if (together.length >= 2 && (doubled || (isTop && together.length >= 3))) {
        drop.add(n);
        moved++;
      }
    }

    if (drop.size) {
      for (let i = notes.length - 1; i >= 0; i--) {
        if (drop.has(notes[i]!)) notes.splice(i, 1);
      }
      drop.clear();
    }
  }
  return moved;
}

/**
 * Whether a pitch class is already carried by another voice of the same chord.
 * Used by the audit; kept here so the definition of "doubling" lives in one
 * place.
 */
export function doubles(voicing: readonly Midi[], midi: Midi): boolean {
  return voicing.filter((v) => pc(v) === pc(midi)).length > 1;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
