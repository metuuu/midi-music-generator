/**
 * Structural tones — the two to four pitches a phrase is actually about.
 *
 * This is the pass the old engine had no equivalent of, and its absence is the
 * reason its melodies were correct and went nowhere. There, pitch was chosen one
 * note at a time by a weighted score with a soft pull toward a height target, and
 * a first-order chooser cannot express a destination: every note was a reasonable
 * next note and no note was *the note the phrase was heading for*.
 *
 * Here the backbone is chosen first. A phrase gets one anchor per bar — placed on
 * a note the figure actually plays, not on an abstract beat — and the surface pass
 * then has to *get from one to the next*. That single reordering is what makes a
 * line sound like it is going somewhere.
 *
 * Two properties are worth stating because they are what the old engine could not
 * have:
 *
 *  - **One arc per section, not one per phrase.** `melody.ts` gave every phrase
 *    its own rise-to-two-thirds-and-fall, jittered, in every section of every
 *    song. Four phrases each with their own little hill is not a shape, it is a
 *    texture. A section has one high point and the phrases are at different
 *    heights on the way to it and away from it.
 *  - **A derived phrase inherits its model's backbone.** "A′ is A up a third"
 *    moves the *targets*, so the whole phrase is a third higher rather than
 *    starting a third higher and wandering back to where it always went.
 */

import { chordPcs, type Chord } from '../core/chord.js';
import type { Midi } from '../core/pitch.js';
import { clampToRange, pc } from '../core/pitch.js';
import type { Rng } from '../core/rng.js';
import type { Scale } from '../core/scale.js';
import { scaleStepsBetween, snapToScale, stepInScale } from '../core/scale.js';
import type { Archetype, Cadence, Motif, Skeleton, Slot, Target } from './types.js';

/**
 * The section's height plan: one high point, and everything else on the way to it
 * or away from it.
 *
 * Where the high point sits is the archetype's business rather than a constant.
 * An arch puts it two-thirds through; a descending sequence puts it in the first
 * bar and spends the section falling away from it, which is not an arch with a
 * different parameter, it is a different kind of tune.
 *
 * The fall is steeper than the rise, because that is how sung phrases behave: you
 * climb to the note you meant and then come down off it.
 */
export function planArc(
  rng: Rng, arch: Archetype, range: [Midi, Midi], compass: number,
): (pos: number) => Midi {
  const [lo, hi] = range;
  const centre = (lo + hi) / 2;
  const peak = rng.float(arch.peakAt[0], arch.peakAt[1]);
  const lift = Math.min(compass * 0.7, (hi - lo) * 0.6);
  const base = centre - lift * 0.42;
  // Where the tune sits once it has come down. Not back at the bottom: a phrase
  // that ends exactly where it started has not been anywhere.
  const rest = rng.float(0.1, 0.3);

  return (pos: number): number => {
    const p = Math.max(0, Math.min(1, pos));
    const shape = p <= peak
      ? ease(p / Math.max(0.001, peak))
      : 1 - (1 - rest) * ease((p - peak) / Math.max(0.001, 1 - peak));
    return base + lift * shape;
  };
}

/** Smooth in and out, so the arc has no corner at its peak. */
function ease(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

export interface SkeletonOptions {
  /** The figure this phrase is made of, already derived. */
  figure: Motif;
  /** Bars of the phrase. */
  bars: number;
  slotsPerBar: number;
  cadence: Cadence;
  /** Chord under each bar of the phrase. */
  chords: Chord[];
  /** Scale for a given bar of the phrase. */
  scaleAt: (barInPhrase: number) => Scale;
  /** The key's own scale, for cadence degrees. */
  baseScale: Scale;
  /** Degrees the tune is living in, 0-based. */
  subset: readonly number[];
  range: [Midi, Midi];
  archetype: Archetype;
  /** Height the section wants at a given fraction of *this phrase*. */
  arc: (posInPhrase: number) => Midi;
  /** The model's backbone, when this phrase derives from another. */
  model?: Skeleton;
  /** Scale steps this phrase sits above its model. */
  shift: number;
  /** True when the section's high point falls inside this phrase. */
  carriesPeak: boolean;
  rng: Rng;
}

/**
 * Choose the phrase's backbone.
 *
 * Anchors are placed on the figure's own most-accented onset in each bar, which
 * matters more than it sounds: a structural tone that does not coincide with a note
 * the rhythm actually plays is a structural tone nobody can hear. The old engine's
 * height target had exactly that problem — it pulled at every note equally and
 * therefore landed on none of them.
 */
export function skeletonFor(opts: SkeletonOptions): Skeleton {
  const { figure, bars, slotsPerBar, chords, range, rng } = opts;
  const phraseSlots = bars * slotsPerBar;
  const anchors = anchorSlots(figure, bars, slotsPerBar);
  if (!anchors.length) return { targets: [] };

  /**
   * Heights first, pitches second.
   *
   * Two passes rather than one because the peak is a *comparison*: it is the anchor
   * this phrase wants highest, and you cannot know which one that is until every
   * height is known. Deciding it while walking left to right marked whichever anchor
   * happened to sit nearest the arc's local maximum, which in the phrase that
   * carries the section's high point is usually not the high note at all.
   */
  const positions = anchors.map((at) => (phraseSlots > 0 ? Math.max(0, at) / phraseSlots : 0));
  const arcHeights = positions.map((pos) => opts.arc(pos));

  /**
   * The peak is picked from the arc, not from the heights.
   *
   * Picking it from the heights was circular: in every form but `period` the phrase
   * carrying the section's high point is a *derived* phrase, so its heights are
   * inherited from its model, so the highest of them is wherever the model happened
   * to be — and the section ended up with no high point at all.
   */
  const candidate = anchors.length > 1
    ? arcHeights.slice(0, -1).reduce((best, h, i) => (h > arcHeights[best]! ? i : best), 0)
    : -1;
  // …and only if that anchor is genuinely near the top. Where the arc's maximum
  // falls on the phrase's *arrival*, the highest anchor available is whichever one
  // is least low, and marking it the peak puts the section's high point at the
  // bottom of a rising phrase. The cadence is a destination and needs no help.
  const peakIndex = opts.carriesPeak && candidate >= 0
    && arcHeights[candidate]! >= Math.max(...arcHeights) - 1.5
    ? candidate
    : -1;

  const wanted = anchors.map((at, i) => {
    const pos = positions[i]!;
    const barInPhrase = Math.max(0, Math.min(bars - 1, Math.floor(Math.max(0, at) / slotsPerBar)));
    const chord = chords[Math.min(chords.length - 1, barInPhrase)]!;
    const height = opts.model ? blend(opts, pos, arcHeights[i]!) : arcHeights[i]!;
    if (i === anchors.length - 1) return cadenceTarget(opts, height, chord);
    // The section outranks the derivation at the one note the section is for.
    if (i === peakIndex) return arcHeights[i]!;
    return height;
  });

  const targets: Target[] = [];
  let prev: Midi | undefined;

  for (let i = 0; i < anchors.length; i++) {
    const at = anchors[i]!;
    const barInPhrase = Math.max(0, Math.min(bars - 1, Math.floor(Math.max(0, at) / slotsPerBar)));
    const chord = chords[Math.min(chords.length - 1, barInPhrase)]!;
    const scale = opts.scaleAt(barInPhrase);
    const last = i === anchors.length - 1;
    const role: Target['role'] = last ? 'arrival' : i === peakIndex ? 'peak' : 'anchor';

    /**
     * An inherited height is exact; a fresh one has freedom.
     *
     * The asymmetry is the whole reason this reads as composition. A derivation is a
     * claim about *this* interval — "a third above what you just heard" — and a
     * weighted draw around it turns the claim into a tendency, which is inaudible. A
     * statement has no such claim to keep, so the harmony may argue with the arc and
     * win.
     */
    /**
     * …except at the peak, where the section outranks the derivation.
     *
     * The high point is a claim about the *section*, and the phrase that carries it
     * is usually a derived one — in an arch form it is always a derived one. Left to
     * `settle`, the peak inherits its model's height and the section quietly has no
     * high point at all. Letting one note climb is also the most idiomatic variation
     * there is: the restated phrase that takes its top note higher.
     */
    const midi = last || (opts.model && role !== 'peak')
      ? clampToRange(settle(wanted[i]!, chord, scale, range), range[0], range[1])
      : chooseAnchor({
        ...opts,
        wanted: wanted[i]!,
        chord,
        scale,
        prev,
        role,
        ...(wanted[i + 1] !== undefined ? { next: wanted[i + 1]! } : {}),
      });

    targets.push({ at, midi, role });
    prev = midi;
  }

  return { targets };
}

/**
 * The nearest note that belongs here: a chord tone within a tone, else a scale tone.
 *
 * Used where the pitch is already decided and only needs to be made legal — a
 * cadence, or an inherited target. Dragging such a note a third to reach a chord
 * tone would destroy the thing it was chosen for.
 */
function settle(want: Midi, chord: Chord, scale: Scale, range: [Midi, Midi]): Midi {
  const rounded = Math.round(want);
  const tones = chordPcs(chord);
  for (let d = 0; d <= 2; d++) {
    for (const cand of [rounded - d, rounded + d]) {
      if (cand >= range[0] && cand <= range[1] && tones.includes(pc(cand))) return cand;
    }
  }
  return snapToScale(scale, rounded);
}

/**
 * One anchor per bar, on the note the figure leans on hardest in that bar.
 *
 * A phrase longer than four bars gets an anchor every other bar instead. Past that
 * the backbone stops being a backbone and becomes the tune — and the whole point of
 * separating them is that the surface has room to move between the bones.
 */
function anchorSlots(figure: Motif, bars: number, slotsPerBar: number): Slot[] {
  const body = figure.gesture.onsets.filter((o) => o.at >= 0 && o.at < bars * slotsPerBar);
  if (!body.length) return [];

  const every = bars > 4 ? 2 : 1;
  const out: Slot[] = [];
  for (let bar = 0; bar < bars; bar += every) {
    const from = bar * slotsPerBar;
    const to = Math.min(bars, bar + every) * slotsPerBar;
    const inBar = body.filter((o) => o.at >= from && o.at < to);
    if (!inBar.length) continue;
    const best = inBar.reduce((a, b) => (b.accent > a.accent + 1e-9 ? b : a));
    out.push(best.at);
  }

  // The figure's last note is the phrase's arrival whether or not it is the
  // loudest thing in its bar, because arrival is a matter of position.
  const lastOnset = body[body.length - 1]!.at;
  if (out[out.length - 1] !== lastOnset) out.push(lastOnset);
  return [...new Set(out)].sort((a, b) => a - b);
}

/**
 * How much of its model's height a derived phrase keeps.
 *
 * The whole of it when the derivation says something about height, and only half
 * when it does not. `transpose +3` is a claim — *a third above what you just heard*
 * — and a claim splits the difference with nothing. `fragment` and `diminish` are
 * claims about the figure and say nothing at all about where it sits, and a phrase
 * whose height is inherited by default leaves the section's arc governing only the
 * one phrase that states material. In `chain` and `sentence` that is three phrases
 * out of four taking their height from a decision nobody made.
 */
function blend(opts: SkeletonOptions, pos: number, arcHeight: Midi): Midi {
  const inherited = inherit(opts, pos);
  if (opts.shift !== 0) return inherited;
  return inherited + (arcHeight - inherited) * 0.5;
}

/** Height taken from the model's backbone at the same point, moved by the shift. */
function inherit(opts: SkeletonOptions, pos: number): Midi {
  const targets = opts.model?.targets ?? [];
  if (!targets.length) return opts.arc(pos);
  const span = targets[targets.length - 1]!.at || 1;
  // Proportional rather than by index: a fragment has fewer anchors than what it
  // came from, and matching them up by number would map its second note onto the
  // model's second note when it belongs at the model's end.
  const wantAt = pos * span;
  let best = targets[0]!;
  for (const t of targets) {
    if (Math.abs(t.at - wantAt) < Math.abs(best.at - wantAt)) best = t;
  }
  return stepInScale(opts.baseScale, best.midi, opts.shift);
}

/** Is this anchor the one that should carry the section's high point? */
function isTop(opts: SkeletonOptions, pos: number): boolean {
  // The arc's own maximum inside this phrase, found by sampling — cheaper and more
  // honest than re-deriving the peak position the arc closed over.
  let bestPos = 0;
  let bestHeight = -Infinity;
  for (let i = 0; i <= 8; i++) {
    const h = opts.arc(i / 8);
    if (h > bestHeight) { bestHeight = h; bestPos = i / 8; }
  }
  return Math.abs(pos - bestPos) <= 0.2;
}

interface AnchorArgs extends SkeletonOptions {
  wanted: Midi;
  chord: Chord;
  scale: Scale;
  prev?: Midi;
  /** Where the *following* anchor is heading, when that is already known. */
  next?: Midi;
  role: Target['role'];
}

/**
 * The best chord tone for an anchor.
 *
 * Chord tones, not scale tones, and this is the one place the old engine's instinct
 * was right — a structural note wants to belong to the harmony holding it up. What
 * was wrong there was applying it to *every* strong beat, which left no room for a
 * suspension. Applied to the backbone only, it is the difference between a line
 * that is in the chords and a line that is merely near them.
 */
function chooseAnchor(args: AnchorArgs): Midi {
  const { chord, wanted, range, archetype, prev, rng } = args;
  const [lo, hi] = range;
  const tones = chordPcs(chord);

  const candidates: Midi[] = [];
  for (let m = lo; m <= hi; m++) {
    if (tones.includes(pc(m))) candidates.push(m);
  }
  if (!candidates.length) return clampToRange(Math.round(wanted), lo, hi);

  const scored = candidates.map((m) => {
    // Distance from where the arc (or the model) wants this note.
    const off = Math.abs(m - wanted);
    // Tight on purpose. A gentle falloff makes every chord tone within an octave a
    // plausible anchor, and an arc that any note satisfies is not an arc.
    let w = Math.exp(-(off * off) / (2 * 2.6 * 2.6));

    if (prev !== undefined) {
      const steps = Math.abs(scaleStepsBetween(args.scale, prev, m));
      // Strides are how far this kind of tune moves between structural notes. Both
      // failure modes are audible: a backbone that inches produces a line with no
      // shape, and one that leaps every time produces a line with no line.
      w *= Math.exp(-((steps - archetype.stride) ** 2) / 8);
      if (m === prev) w *= 0.35;
      if (Math.abs(m - prev) > 12) w *= 0.05;
    }
    /**
     * A backbone has to go somewhere, and it is the pair of anchors that decides
     * whether it does.
     *
     * Looking only backwards lets an anchor land on the note the *next* one is
     * already committed to — most often the cadence, which is fixed before any of
     * this runs. The phrase then has a flat backbone, and a figure whose shape
     * descends gets bent into a shape that does not, because the surface pass has
     * no distance to spend. Two anchors on the same pitch is the one arrangement of
     * a phrase that cannot be sung as a phrase.
     */
    if (args.next !== undefined) {
      const ahead = Math.abs(scaleStepsBetween(args.scale, m, args.next));
      w *= Math.exp(-((ahead - archetype.stride) ** 2) / 12);
      if (Math.round(m) === Math.round(args.next)) w *= 0.4;
    }
    if (args.role === 'peak') {
      // The peak is the one note the section is for. Push it to the top of what
      // the range allows rather than merely near the arc's maximum.
      w *= 1 + ((m - lo) / Math.max(1, hi - lo)) * 3;
    }
    return [m, Math.max(1e-6, w)] as const;
  });

  return rng.weighted(scored);
}

/**
 * Where the phrase lands.
 *
 * `closed` is the tonic and means the tune has finished saying this. `open` hangs
 * on 5̂ or 2̂. `half` stops on the root of whatever chord is under it, which is how a
 * stop can be a real arrival and obviously the middle of something at the same
 * time — the thing the old engine's two-way open/closed alternation could not say.
 * `suspended` sits on 4̂ or 7̂ and asks to be continued.
 */
function cadenceTarget(opts: SkeletonOptions, near: Midi, chord: Chord): Midi {
  const { rng, baseScale } = opts;
  const wants: readonly (readonly [number, number])[] = opts.cadence === 'closed'
    ? [[0, 7], [2, 1]]
    : opts.cadence === 'open'
      ? [[4, 5], [1, 3], [2, 2]]
      : opts.cadence === 'suspended'
        ? [[3, 3], [6, 2]]
        : [];
  if (!wants.length) return nearestPcTo(chord.root, near);

  /**
   * A cadence lands on a note the harmony is holding.
   *
   * Without the filter the degree is chosen from the key and then dragged onto the
   * nearest chord tone afterwards, which quietly turns every cadence into whatever
   * the last chord happened to contain — a "closed" phrase over a dominant ended on
   * the dominant's fifth and the plan still called it closed. Filtering first keeps
   * the plan honest: where the harmony cannot support the ending the form asked for,
   * the ending becomes the chord's own root, which is what a half cadence *is*.
   */
  const tones = chordPcs(chord);
  const available = wants.filter(([deg]) => tones.includes(baseScale.pcs[deg % baseScale.pcs.length]!));
  if (!available.length) return nearestPcTo(chord.root, near);
  return nearestPcTo(baseScale.pcs[rng.weighted(available)!]!, near);
}

function nearestPcTo(target: number, reference: Midi): Midi {
  const base = Math.floor(reference / 12) * 12 + ((target % 12) + 12) % 12;
  let best = base;
  let bestDist = Math.abs(base - reference);
  for (const cand of [base - 12, base + 12]) {
    const d = Math.abs(cand - reference);
    if (d < bestDist) { best = cand; bestDist = d; }
  }
  return best;
}

/** One line per target, for a printed plan. */
export function describeSkeleton(skeleton: Skeleton, slotsPerBar: number): string {
  return skeleton.targets
    .map((t) => `${(t.at / slotsPerBar + 1).toFixed(2)}:${t.midi}${t.role === 'peak' ? '^' : t.role === 'arrival' ? '.' : ''}`)
    .join('  ');
}
