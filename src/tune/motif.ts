/**
 * Material, and what can be done to it.
 *
 * Two jobs, and they are two halves of one idea. The first is to invent a small
 * figure — a rhythm and a shape — that a listener can hold after one hearing. The
 * second is the **operator algebra**: the transformations that turn one figure
 * into a phrase, a phrase into its answer, and a verse into a chorus.
 *
 * The second half is what the old engine had no way to express, and its absence
 * is why sections were either replayed verbatim or invented fresh. Those are the
 * two things a composer almost never does. What a composer does is *change one
 * thing*, and every entry in `Op` is one thing to change.
 *
 * Nothing here samples from a bag of bar-length cells. A figure is built by
 * choosing durations against an accent template — where this style likes notes to
 * land — which is what lets a rhythm be complicated and still sound intended. A
 * complicated rhythm that disagrees with the groove is the definition of noise.
 */

import type { Rng } from '../core/rng.js';
import { SLOTS_PER_BEAT } from '../core/grid.js';
import type {
  Archetype, Gesture, Idiom, Motif, MotifRole, Onset, Op, ShapeId, Slot, Voice,
} from './types.js';

/** What a line sounds like when nothing has said who is playing it. */
export const NEUTRAL_IDIOM: Idiom = {
  arpeggio: 0.3, run: 0.6, repeat: 0.5, breath: 0.3, detache: 0.08,
};

// ---------------------------------------------------------------------------
// The accent template
// ---------------------------------------------------------------------------

/**
 * Where this style likes a note to land, per sixteenth of the canvas.
 *
 * An explicit table in the voice is tiled across the canvas: sixteen entries are
 * a one-bar statement stated twice, thirty-two are a two-bar statement, and a
 * two-bar statement is what a clave or a tango accent actually is. Without one,
 * the template is derived from the metre and the style's appetite for the offbeat,
 * which is serviceable and is the reason the whole catalogue does not have to be
 * authored before anything can be heard.
 *
 * The second bar's downbeat is deliberately weaker than the first's. A two-bar
 * figure has one head, and treating both barlines as equally strong is most of
 * what makes a generated line sound like two bars rather than one gesture.
 */
export function accentTemplate(
  voice: Voice, slotsPerBar: number, span: Slot, groups?: readonly number[],
): number[] {
  const out: number[] = [];
  if (voice.accents?.length) {
    for (let s = 0; s < span; s++) out.push(voice.accents[s % voice.accents.length]!);
    return out;
  }

  const sync = voice.syncopation;
  for (let s = 0; s < span; s++) {
    const inBar = s % slotsPerBar;
    const bar = Math.floor(s / slotsPerBar);
    let w: number;
    if (inBar === 0) w = 1;
    else if (groups?.length && isGroupHead(inBar, groups)) w = 0.82;
    else if (!groups?.length && slotsPerBar % 2 === 0 && inBar === slotsPerBar / 2) w = 0.86;
    else if (inBar % SLOTS_PER_BEAT === 0) w = 0.7;
    else if (inBar % 2 === 0) w = 0.3 + sync * 0.45;
    else w = 0.1 + sync * 0.5;
    // The head of the canvas outranks the head of its second bar.
    out.push(bar > 0 && inBar === 0 ? w * 0.92 : w);
  }
  return out;
}

function isGroupHead(inBar: number, groups: readonly number[]): boolean {
  let at = 0;
  for (const g of groups) {
    at += g;
    if (at === inBar) return true;
    if (at > inBar) return false;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Gesture
// ---------------------------------------------------------------------------

/**
 * Durations a figure is built from, weighted by what the style is made of.
 *
 * The dotted pair — 6 and 2, or 3 and 1 — is not a rhythmic ornament in this
 * repertoire, it is the identity of half of it: the tango lilt and the
 * schottische snap are both a long tied to a short. So dotted values rise with
 * the style's appetite for the offbeat rather than being sprinkled evenly.
 */
function durationMenu(voice: Voice, density: number, slotsPerBar: number): (readonly [Slot, number])[] {
  const sync = voice.syncopation;
  // The duration a note would have if the figure were even. Weighting each value
  // by its distance from that is what makes density mean what it says: the old
  // engine's menu was fixed, so "busy" and "spacious" drew from the same bag and
  // differed only in how many notes they asked for.
  const want = Math.max(1, slotsPerBar / Math.max(0.5, density));
  const near = (d: Slot) => 1 / (1 + Math.abs(Math.log2(d / want)) * 1.6);
  return [
    [1, near(1) * 0.7],
    [2, near(2) * 3],
    [3, near(3) * (0.5 + sync * 2)],
    [4, near(4) * 3],
    [6, near(6) * (0.8 + sync * 1.6)],
    [8, near(8) * 2],
    [12, near(12) * 0.6],
    [16, near(16) * 0.4],
  ];
}

export interface GestureOptions {
  span: Slot;
  slotsPerBar: number;
  /** Onsets per bar this figure is aiming at. */
  density: number;
  /** Fraction of the canvas the figure covers before it stops. */
  extent: number;
  /** May the figure start before the canvas does? */
  pickup: boolean;
  /** How badly the player needs air, 0..1. */
  breath: number;
  groups?: readonly number[];
}

/**
 * Build one figure.
 *
 * Durations are chosen one at a time, and each candidate is weighted by how
 * attractive the slot it *lands on* is — so the accent template shapes the rhythm
 * rather than merely judging it afterwards. That ordering is the whole trick: a
 * figure whose notes fall where the style puts its accents reads as intentional at
 * any level of complexity, and one whose notes fall anywhere reads as a mistake at
 * the mildest.
 */
export function makeGesture(rng: Rng, voice: Voice, opts: GestureOptions): Gesture {
  const { span, slotsPerBar, density, extent } = opts;
  const accents = accentTemplate(voice, slotsPerBar, span, opts.groups);
  const reach = Math.max(SLOTS_PER_BEAT, Math.round(span * extent));
  const wanted = Math.max(2, Math.round(density * (reach / slotsPerBar)));

  const onsets: Onset[] = [];
  let at: Slot = 0;

  // A pickup is taken from in front of the canvas rather than out of the first
  // note, which is the other way round from how the old engine did it and is the
  // reason this one can put a pickup on a figure that starts with a short note.
  if (opts.pickup) {
    const unit = rng.chance(0.6) ? 2 : 1;
    const count = rng.weighted([[1, 5], [2, 2]] as const);
    for (let i = 0; i < count; i++) {
      onsets.push({ at: -(count - i) * unit, dur: unit, accent: 0.4 });
    }
  }

  const menu = durationMenu(voice, density, slotsPerBar);
  while (onsets.filter((o) => o.at >= 0).length < wanted && at < reach) {
    const room = reach - at;
    // A sixteenth started against the wall is a stub rather than a note. Stopping
    // one short leaves the figure a rest, which is a better last word.
    if (room < 2 && onsets.some((o) => o.at >= 0)) break;
    const choices = menu
      .filter(([d]) => d <= Math.max(1, room))
      .map(([d, w]) => {
        const lands = at + d;
        // How good the *next* note's position is, which is what this duration
        // actually decides. The last note of the figure has no next, so it is
        // judged on filling the room instead.
        const fit = lands >= reach ? 0.8 : accents[lands % span] ?? 0.5;
        return [d, w * (0.15 + fit)] as const;
      });
    if (!choices.length) break;
    const dur = rng.weighted(choices);
    onsets.push({ at, dur, accent: 0 });
    at += dur;
  }

  if (!onsets.some((o) => o.at >= 0)) onsets.push({ at: 0, dur: SLOTS_PER_BEAT, accent: 0 });

  // The last note takes what is left, up to a limit. A figure that ends on a long
  // note sounds finished; one that ends on a sixteenth sounds interrupted. The
  // ceiling is a bar: past that it stops being the end of a figure and becomes a
  // pedal, and a figure whose last note lasts longer than everything before it
  // put together is not a figure with a long note, it is a long note.
  //
  // Measured against the canvas rather than against `extent`, which is a target
  // for where the *onsets* stop and not a wall the sound has to stay behind. A
  // figure held over the line it stopped writing at is what a singer does.
  const last = onsets[onsets.length - 1]!;
  const tail = Math.min(span - last.at, last.dur * 3, slotsPerBar);
  if (tail > last.dur) last.dur = tail;

  breathe(onsets, reach, opts.breath, rng);
  return { onsets: accentuate(onsets, accents, span, voice, rng), span };
}

/**
 * Let the player breathe.
 *
 * A line that never stops is playable on a keyboard and impossible on anything
 * blown, and the ear knows the difference long before it can name it: a flute part
 * with no gap in it reads as synthetic rather than as virtuosic. The gap is taken by
 * *shortening* the note that arrives at the figure's end rather than by deleting
 * anything, so the figure keeps every one of its onsets.
 */
function breathe(onsets: Onset[], reach: Slot, breath: number, rng: Rng): void {
  if (breath <= 0 || !onsets.length) return;
  const body = onsets.filter((o) => o.at >= 0);
  if (!body.length) return;

  // Where a player would actually take one: at the end of the figure, and — if they
  // need air badly — halfway through it as well.
  const points = breath > 0.55 ? [reach, Math.round(reach / 2)] : [reach];
  for (const at of points) {
    if (!rng.chance(breath)) continue;
    let before: Onset | undefined;
    for (const o of body) if (o.at < at && (!before || o.at > before.at)) before = o;
    if (!before) continue;
    if (before.at + before.dur <= at - 2) continue;  // already air here
    const gap = before.dur >= 8 ? 4 : before.dur >= 6 ? 3 : 2;
    const trimmed = Math.min(before.dur, at - before.at) - gap;
    if (trimmed < 1) continue;
    before.dur = trimmed;
  }
}

/**
 * Decide what the figure leans on.
 *
 * Position is the starting point and not the answer. A figure gets its head
 * accented because it is the head; its longest note accented because length reads
 * as weight; and — where the style has the appetite — one note accented precisely
 * where the metre says nothing should be, because that is what a syncopation *is*.
 * Deriving accent from position alone, which is what the old engine's
 * `metricStrength` did, makes that last case unsayable.
 */
function accentuate(
  onsets: Onset[], accents: number[], span: Slot, voice: Voice, rng: Rng,
): Onset[] {
  const out = onsets.map((o) => ({
    ...o,
    accent: clamp01(0.5 + (accents[((o.at % span) + span) % span] ?? 0.5) * 0.45),
  }));
  const body = out.filter((o) => o.at >= 0);
  if (!body.length) return out;

  body[0]!.accent = clamp01(body[0]!.accent + 0.18);
  const longest = body.reduce((a, b) => (b.dur > a.dur ? b : a));
  longest.accent = clamp01(longest.accent + 0.15);

  if (rng.chance(voice.syncopation)) {
    const weak = body.filter((o) => (accents[o.at % span] ?? 1) < 0.35);
    if (weak.length) rng.pick(weak).accent = 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Contour
// ---------------------------------------------------------------------------

/**
 * The shapes worth building a tune on, as scale steps from each note to the next.
 *
 * Each is a way of moving that the ear can hold after one hearing, which is the
 * only test that matters. A random walk is not on the list, because a random walk
 * is precisely what a listener cannot remember — and it is what a note-by-note
 * scorer produces however carefully its weights are set.
 */
export function contourFor(rng: Rng, shape: ShapeId, n: number, leap: number): number[] {
  const wide = leap > 0.3 ? 3 : 2;
  const half = Math.max(1, Math.floor((n - 1) / 2));
  const c = ((): number[] => {
    switch (shape) {
      case 'rise': return fill(n, () => 1);
      case 'fall': return fill(n, () => -1);
      case 'arch': return fill(n, (i) => (i <= half ? 1 : -1));
      case 'valley': return fill(n, (i) => (i <= half ? -1 : 1));
      case 'turn': return fill(n, (i) => (i === 0 ? 0 : i <= half ? 1 : -1));
      case 'repeat-tail': return fill(n, (i) => (i < n - 1 ? 0 : rng.chance(0.7) ? -1 : 1));
      case 'leap-home': return fill(n, (i) => (i === 1 ? wide : -1));
      case 'thirds': return fill(n, () => (rng.chance(0.7) ? -2 : 2));
      case 'neighbour': return fill(n, (i) => (i % 2 === 1 ? 1 : -1));
      // A leap out and the gap walked back in. The most characteristic opening
      // gesture in sung music, and the one the old engine could only stumble into.
      case 'gap-fill': return fill(n, (i) => (i === 1 ? wide + 1 : -1));
      case 'climb-hold': return fill(n, (i) => (i === n - 1 ? 0 : 1));
      case 'plateau': return fill(n, (i) => (i === Math.floor(n / 2) ? 1 : 0));
    }
  })();
  // The first note is wherever the phrase puts it — that is the skeleton's
  // business. Leaving a step here would make every restatement begin one note
  // above wherever the previous phrase happened to stop.
  c[0] = 0;
  return c;
}

function fill(n: number, f: (i: number) => number): number[] {
  return Array.from({ length: Math.max(1, n) }, (_, i) => f(i));
}

// ---------------------------------------------------------------------------
// Motifs
// ---------------------------------------------------------------------------

export interface MotifOptions {
  voice: Voice;
  archetype: Archetype;
  slotsPerBar: number;
  span: Slot;
  /** Who is playing it. Defaults to `NEUTRAL_IDIOM`. */
  idiom?: Idiom;
  groups?: readonly number[];
}

/**
 * The archetype's shapes, re-weighted by what the instrument actually plays.
 *
 * A mallet breaks chords, so `thirds` and `leap-home` rise with `arpeggio`. A wind
 * instrument runs, so `rise` and `fall` rise with `run`. Anything that
 * re-articulates freely can hold one note and make the rhythm the idea, so
 * `plateau` and `repeat-tail` rise with `repeat`. The archetype still says what kind
 * of tune this is; the idiom says who is singing it.
 */
export function shapesFor(archetype: Archetype, idiom: Idiom): readonly (readonly [ShapeId, number])[] {
  const bump: Partial<Record<ShapeId, number>> = {
    thirds: 1 + idiom.arpeggio * 2,
    'leap-home': 1 + idiom.arpeggio * 1.2,
    'gap-fill': 1 + idiom.arpeggio * 0.8,
    rise: 1 + idiom.run * 1.4,
    fall: 1 + idiom.run * 1.4,
    plateau: 1 + idiom.repeat * 1.6,
    'repeat-tail': 1 + idiom.repeat * 1.3,
  };
  return archetype.shapes.map(([id, w]) => [id, w * (bump[id] ?? 1)] as const);
}

export function makeMotif(rng: Rng, role: MotifRole, opts: MotifOptions): Motif {
  const { voice, archetype, slotsPerBar, span } = opts;
  const density = voice.density * archetype.density * (role === 'tag' ? 0.7 : 1);
  const extent = role === 'tag'
    ? rng.float(0.3, 0.5)
    : rng.weighted([[0.5, 3], [0.66, 4], [0.82, 3], [1, 2]] as const);

  const idiom = opts.idiom ?? NEUTRAL_IDIOM;
  const draw = () => makeGesture(rng, voice, {
    span,
    slotsPerBar,
    density,
    extent,
    pickup: role === 'hook' && rng.chance(voice.syncopation * 0.5 + 0.12),
    breath: idiom.breath,
    ...(opts.groups ? { groups: opts.groups } : {}),
  });

  /**
   * A hook with two notes is not a hook and one with nine is a run.
   *
   * Redrawn rather than repaired, because the count is a property of the whole
   * figure: lengthening a two-note figure into a four-note one by subdividing it
   * produces a two-note figure with ornaments, which is a different thing and
   * audibly a worse one.
   */
  let gesture = draw();
  if (role === 'hook') {
    for (let tries = 0; tries < 6; tries++) {
      const n = gesture.onsets.filter((o) => o.at >= 0).length;
      if (n >= 3 && n <= 6) break;
      gesture = draw();
    }
  }

  const shape = rng.weighted(shapesFor(archetype, idiom));
  const contour = idiomise(
    contourFor(rng, shape, gesture.onsets.length, voice.leap * archetype.leap), idiom, rng,
  );
  return { gesture, contour, role, shift: 0 };
}

/**
 * The player's hand, applied to the shape itself.
 *
 * Re-weighting which shapes are *drawn* is not enough on its own — a mallet and a
 * flute given the same six shapes at slightly different odds produce lines that
 * differ by two percent, which is what the old engine's problem was before idiom
 * existed. This is the direct statement: an instrument that breaks chords turns a
 * step into a third, and one that runs turns a third into a step. That is what those
 * two words mean.
 */
function idiomise(contour: number[], idiom: Idiom, rng: Rng): number[] {
  return contour.map((s, i) => {
    if (i === 0 || s === 0) return s;
    if (Math.abs(s) === 1 && rng.chance(idiom.arpeggio * 0.85)) return Math.sign(s) * 2;
    if (Math.abs(s) === 2 && rng.chance(idiom.run * 0.7)) return Math.sign(s);
    return s;
  });
}

/**
 * The song's material: two or three figures that are relatives rather than
 * strangers.
 *
 * The answer is derived from the hook — inverted, fragmented, turned around —
 * rather than invented separately, and that is the difference between a tune with
 * two ideas in it and a tune with one idea and a reply. The old engine drew one
 * motto and nothing else, so a phrase either quoted it or had no relation to
 * anything in the song at all.
 */
export function motifFamily(rng: Rng, opts: MotifOptions): Motif[] {
  const hook = makeMotif(rng, 'hook', opts);

  const answerOps: Op[][] = [
    [{ op: 'invert' }],
    [{ op: 'invert' }, { op: 'transpose', steps: -1 }],
    [{ op: 'fragment', keep: Math.max(2, hook.contour.length - 1) }, { op: 'extend', with: 'step' }],
    [{ op: 'displace', by: 2 }],
    [{ op: 'expand', factor: 1.6 }],
  ];
  const answer = { ...applyOps(hook, rng.pick(answerOps), rng), role: 'answer' as const };

  const tag = {
    ...applyOps(hook, [{ op: 'fragment', keep: 2 }, { op: 'augment', factor: 2 }], rng),
    role: 'tag' as const,
  };

  return [hook, answer, tag];
}

// ---------------------------------------------------------------------------
// The operators
// ---------------------------------------------------------------------------

export function applyOps(motif: Motif, ops: readonly Op[], rng: Rng): Motif {
  let m = motif;
  for (const op of ops) m = applyOp(m, op, rng);
  return align(m);
}

function applyOp(m: Motif, op: Op, rng: Rng): Motif {
  switch (op.op) {
    case 'transpose':
      return { ...m, shift: m.shift + op.steps };

    case 'invert':
      return { ...m, contour: m.contour.map((s, i) => (i === 0 ? 0 : -s)) };

    case 'augment': {
      const onsets = m.gesture.onsets
        .map((o) => ({ ...o, at: Math.round(o.at * op.factor), dur: Math.max(1, Math.round(o.dur * op.factor)) }))
        .filter((o) => o.at < m.gesture.span);
      return { ...m, gesture: { ...m.gesture, onsets }, contour: m.contour.slice(0, onsets.length) };
    }

    case 'diminish': {
      const onsets = m.gesture.onsets.map((o) => ({
        ...o,
        at: Math.round(o.at / op.factor),
        dur: Math.max(1, Math.round(o.dur / op.factor)),
      }));
      return { ...m, gesture: { ...m.gesture, onsets: despace(onsets) } };
    }

    case 'fragment': {
      // The pickup is not one of the notes being counted. "Keep three" of a figure
      // that starts before the bar means three notes *of the figure*, or a
      // fragment of a figure with a two-note pickup is a pickup and one note.
      const lead = m.gesture.onsets.filter((o) => o.at < 0).length;
      const keep = Math.max(1, Math.min(op.keep + lead, m.gesture.onsets.length));
      return {
        ...m,
        gesture: { ...m.gesture, onsets: m.gesture.onsets.slice(0, keep) },
        contour: m.contour.slice(0, keep),
      };
    }

    case 'extend': {
      const onsets = m.gesture.onsets.slice();
      const last = onsets[onsets.length - 1];
      if (!last) return m;
      const at = last.at + last.dur;
      if (at >= m.gesture.span) return m;
      const dur = Math.min(last.dur, m.gesture.span - at);
      onsets.push({ at, dur, accent: last.accent * 0.9 });
      const dir = lastDirection(m.contour);
      const step = op.with === 'repeat' ? 0 : op.with === 'leap' ? 3 * dir : dir;
      return { ...m, gesture: { ...m.gesture, onsets }, contour: [...m.contour, step] };
    }

    case 'displace': {
      const onsets = m.gesture.onsets
        .map((o) => ({ ...o, at: o.at + op.by }))
        .filter((o) => o.at >= -SLOTS_PER_BEAT && o.at < m.gesture.span);
      const dropped = m.gesture.onsets.length - onsets.length;
      return {
        ...m,
        gesture: { ...m.gesture, onsets },
        contour: dropped > 0 ? m.contour.slice(0, onsets.length) : m.contour,
      };
    }

    case 'sequence': {
      const first = m.gesture.onsets[0];
      const last = m.gesture.onsets[m.gesture.onsets.length - 1];
      if (!first || !last) return m;
      // Restatements land on a beat. A sequence placed at the figure's exact
      // length drifts off the grid and stops reading as a restatement — the ear
      // hears the *interval between entries* as much as the figure itself.
      const raw = last.at + last.dur - Math.min(0, first.at);
      const step = Math.max(SLOTS_PER_BEAT, Math.ceil(raw / SLOTS_PER_BEAT) * SLOTS_PER_BEAT);
      const rise = m.contour.reduce((a, b) => a + b, 0);

      const onsets = m.gesture.onsets.slice();
      const contour = m.contour.slice();
      for (let k = 1; k < op.times; k++) {
        const shifted = m.gesture.onsets.map((o) => ({ ...o, at: o.at + k * step }));
        if (shifted.some((o) => o.at >= m.gesture.span)) break;
        onsets.push(...shifted);
        // The joint: from the previous copy's last note to this copy's first.
        contour.push(op.steps - rise, ...m.contour.slice(1));
      }
      return { ...m, gesture: { ...m.gesture, onsets }, contour };
    }

    case 'expand':
      return {
        ...m,
        contour: m.contour.map((s, i) => {
          if (i === 0 || s === 0) return s;
          return Math.sign(s) * Math.max(1, Math.round(Math.abs(s) * op.factor));
        }),
      };

    case 'ornament': {
      let out = m;
      const splits = Math.max(1, Math.round(op.amount * 2));
      for (let k = 0; k < splits; k++) out = ornamentOnce(out, rng);
      return out;
    }

    case 'reharmonise':
      return { ...m, resnap: true };
  }
}

/**
 * Split the longest note into a note and its neighbour.
 *
 * The contour bookkeeping is the whole of it: the inserted note takes a step `d`
 * from the note before it, and the note *after* it has to give that step back, or
 * the figure ends up transposed by an ornament.
 */
function ornamentOnce(m: Motif, rng: Rng): Motif {
  const onsets = m.gesture.onsets;
  let idx = -1;
  let best = 3;
  for (let i = 0; i < onsets.length; i++) {
    if (onsets[i]!.dur > best) { best = onsets[i]!.dur; idx = i; }
  }
  if (idx < 0) return m;

  const target = onsets[idx]!;
  const half = Math.max(1, Math.floor(target.dur / 2));
  const d = rng.chance(0.6) ? 1 : -1;

  const nextOnsets = onsets.slice();
  nextOnsets[idx] = { ...target, dur: half };
  nextOnsets.splice(idx + 1, 0, {
    at: target.at + half,
    dur: target.dur - half,
    accent: target.accent * 0.75,
  });

  const contour = m.contour.slice();
  contour.splice(idx + 1, 0, d);
  if (contour[idx + 2] !== undefined) contour[idx + 2] = contour[idx + 2]! - d;

  return { ...m, gesture: { ...m.gesture, onsets: nextOnsets }, contour };
}

// ---------------------------------------------------------------------------
// Invariants
// ---------------------------------------------------------------------------

/**
 * One contour entry per onset, onsets in order, and no note running into the
 * next.
 *
 * Enforced after every derivation rather than trusted, because six operators can
 * each break it in their own way and a figure whose contour is one entry short
 * silently loses its last note somewhere much later.
 */
export function align(m: Motif): Motif {
  // Half the canvas is the ceiling on a single note. `augment` on a fragment can
  // otherwise turn a quarter into a whole note, and a tag made of two whole notes
  // is not a cadential figure, it is the tune giving up.
  const cap = Math.max(SLOTS_PER_BEAT, Math.floor(m.gesture.span / 2));
  const capped = m.gesture.onsets.map((o) => (o.dur > cap ? { ...o, dur: cap } : o));
  const onsets = despace(capped.slice().sort((a, b) => a.at - b.at));
  const contour = onsets.map((_, i) => m.contour[i] ?? 0);
  contour[0] = 0;
  return { ...m, gesture: { ...m.gesture, onsets }, contour };
}

/** Clip durations so a monophonic figure stays monophonic. */
function despace(onsets: Onset[]): Onset[] {
  const out = onsets.slice().sort((a, b) => a.at - b.at);
  for (let i = 0; i < out.length - 1; i++) {
    const room = out[i + 1]!.at - out[i]!.at;
    if (room <= 0) { out.splice(i + 1, 1); i--; continue; }
    if (out[i]!.dur > room) out[i] = { ...out[i]!, dur: room };
  }
  return out;
}

function lastDirection(contour: number[]): number {
  for (let i = contour.length - 1; i >= 0; i--) {
    if (contour[i]) return Math.sign(contour[i]!);
  }
  return -1;
}

/** Sixteenths from the figure's first onset to the end of its last. */
export function extentOf(g: Gesture): Slot {
  if (!g.onsets.length) return 0;
  const first = g.onsets[0]!.at;
  const last = g.onsets[g.onsets.length - 1]!;
  return last.at + last.dur - first;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
