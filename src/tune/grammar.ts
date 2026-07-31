/**
 * Form — how the phrases of a section relate to each other.
 *
 * This is the level the old engine had nothing at. It knew about bars (a motif
 * could be restated inside its own phrase) and it knew about sections (a chorus
 * could be replayed verbatim). Between those two it had a fixed four-bar phrase
 * grid alternating an open ending with a closed one, forever, in every section of
 * every song. The large-scale rhythm of every tune in the catalogue is therefore a
 * metronome: question, answer, question, answer.
 *
 * A form here is a list of phrases where each one is either a **statement** of
 * some material or a named **derivation** of an earlier phrase. That is all it is,
 * and it is enough to express the difference between a sentence, a period, an
 * aaba chorus and a riff with a response — which is most of the difference between
 * kinds of tune.
 *
 * Two properties are deliberate:
 *
 *  - **Phrase length is not fixed.** Two, three, four or six bars, decided by the
 *    template and the section length together.
 *  - **The derivation is data.** A phrase records which phrase it came from and
 *    what was done to it, so a printed plan explains the tune. The old engine's
 *    equivalent decision lived inside a weighted draw and left no trace.
 */

import type { Rng } from '../core/rng.js';
import type { Archetype, FormId, Op, PhraseNode, Voice } from './types.js';

/**
 * What one phrase does to another, before it is resolved into operators.
 *
 * The indirection is what lets a style have an opinion. `develop` means the same
 * thing in every form — *take this apart and make something of the pieces* — and
 * what it resolves to differs between a tango and a riff-driven synth line.
 */
export type Intent =
  | 'repeat'
  | 'answer'
  /** Restate a step or two away. Which way is the archetype's call, not the form's. */
  | 'sequence'
  | 'develop'
  | 'lift'
  | 'close'
  | 'vary';

interface Slot {
  /** Label within the template. Rendered into the phrase id. */
  label: string;
  /** Relative length. Scaled so the template fills the section. */
  weight: number;
  /** Absent means this phrase states material rather than deriving it. */
  from?: { label: string; intent: Intent };
  motif?: 'hook' | 'answer' | 'tag';
  cadence: PhraseNode['cadence'];
}

interface FormTemplate {
  id: FormId;
  label: string;
  gloss: string;
  /** Bars this form naturally occupies. Sections longer than this tile it. */
  bars: number;
  slots: Slot[];
}

/**
 * The forms.
 *
 * Each is a claim about where a listener is in the tune at any moment, and the
 * claims are different. A **period** says *question, then the same question
 * answered*. A **sentence** says *idea, idea again, take it apart, land*. An
 * **aaba** says *the thing, the thing, something else, the thing*. A **chain**
 * never stops climbing until it stops. Those are not four settings of one
 * parameter, which is why they are four templates rather than a weight.
 */
const FORMS: FormTemplate[] = [
  {
    id: 'period',
    label: 'Period',
    gloss: 'a question and the same question answered',
    bars: 8,
    slots: [
      { label: 'A', weight: 1, motif: 'hook', cadence: 'half' },
      { label: "A'", weight: 1, from: { label: 'A', intent: 'repeat' }, cadence: 'closed' },
    ],
  },
  {
    id: 'sentence',
    label: 'Sentence',
    gloss: 'idea, idea again a step up, taken apart, landed',
    bars: 8,
    slots: [
      { label: 'A', weight: 1, motif: 'hook', cadence: 'open' },
      { label: "A'", weight: 1, from: { label: 'A', intent: 'sequence' }, cadence: 'open' },
      { label: 'B', weight: 1, from: { label: 'A', intent: 'develop' }, cadence: 'half' },
      { label: 'C', weight: 1, from: { label: 'A', intent: 'close' }, cadence: 'closed' },
    ],
  },
  {
    id: 'aaba',
    label: 'aaba',
    gloss: 'the thing, the thing, something else, the thing',
    bars: 8,
    slots: [
      { label: 'A', weight: 1, motif: 'hook', cadence: 'open' },
      { label: "A'", weight: 1, from: { label: 'A', intent: 'repeat' }, cadence: 'half' },
      { label: 'B', weight: 1, motif: 'answer', cadence: 'open' },
      { label: "A''", weight: 1, from: { label: 'A', intent: 'close' }, cadence: 'closed' },
    ],
  },
  {
    id: 'chain',
    label: 'Chain',
    gloss: 'a figure walked up the scale until it has to stop',
    bars: 8,
    slots: [
      { label: 'A', weight: 1, motif: 'hook', cadence: 'open' },
      { label: "A'", weight: 1, from: { label: 'A', intent: 'sequence' }, cadence: 'open' },
      { label: "A''", weight: 1, from: { label: "A'", intent: 'sequence' }, cadence: 'half' },
      { label: 'C', weight: 1, from: { label: 'A', intent: 'close' }, cadence: 'closed' },
    ],
  },
  {
    id: 'riff-response',
    label: 'Riff and response',
    gloss: 'a short figure and the thing that answers it, twice',
    bars: 8,
    slots: [
      { label: 'R', weight: 1, motif: 'hook', cadence: 'open' },
      { label: 'X', weight: 1, motif: 'answer', cadence: 'open' },
      { label: "R'", weight: 1, from: { label: 'R', intent: 'repeat' }, cadence: 'open' },
      { label: 'Y', weight: 1, from: { label: 'X', intent: 'close' }, cadence: 'closed' },
    ],
  },
  {
    id: 'arch-form',
    label: 'Arch',
    gloss: 'out, up to the high point, and home',
    bars: 8,
    slots: [
      { label: 'A', weight: 1, motif: 'hook', cadence: 'open' },
      { label: 'B', weight: 1, from: { label: 'A', intent: 'lift' }, cadence: 'open' },
      { label: 'C', weight: 1, from: { label: 'B', intent: 'develop' }, cadence: 'half' },
      { label: "A'", weight: 1, from: { label: 'A', intent: 'close' }, cadence: 'closed' },
    ],
  },
];

const BY_ID = new Map(FORMS.map((f) => [f.id, f]));

export function formLabel(id: FormId): string {
  return BY_ID.get(id)?.label ?? id;
}

export interface FormOptions {
  bars: number;
  archetype: Archetype;
  voice: Voice;
  /**
   * How much this section should lean on repeating itself, 0..1.
   *
   * The one number the old `HookLevel` was nine numbers for. It biases the choice
   * of form, whether a `repeat` is verbatim or ornamented, and whether a tiled
   * section varies its material or restates it.
   */
  repetition: number;
  rng: Rng;
}

/**
 * Choose the form and lay the phrases out.
 *
 * Sections longer than the form **tile** it rather than stretching it, because a
 * sixteen-bar chorus is two eight-bar statements and not one statement with
 * eight-bar phrases. Sections shorter than the form **scale** it, because a
 * four-bar intro is a real thing and a period of two-bar phrases is what it is.
 */
export function planPhrases(opts: FormOptions): { form: FormId; phrases: PhraseNode[] } {
  const { bars, archetype, rng, repetition } = opts;

  /**
   * A form whose phrases would scale below one bar is not that form any more, and
   * one whose phrases are much shorter than the figure they are made of throws the
   * figure away.
   *
   * The second half matters for the slow styles. A voice with a four-bar canvas —
   * Berlin school, where the harmony moves every two bars and the lead holds still
   * — handed a four-phrase template over eight bars gets two-bar phrases, and half
   * of every figure is clipped off unheard. Weighting toward phrase lengths near the
   * canvas is what makes `canvasBars` mean anything.
   */
  const want = opts.voice.canvasBars ?? 2;
  const candidates = archetype.forms
    .filter(([id]) => {
      const t = BY_ID.get(id);
      return t !== undefined && bars / t.slots.length >= 1;
    })
    .map(([id, w]) => {
      const t = BY_ID.get(id)!;
      const perPhrase = bars / t.slots.length;
      return [id, w / (1 + Math.abs(perPhrase - want) * 0.6)] as const;
    });
  const form = rng.weighted(candidates.length ? candidates : archetype.forms);
  const template = BY_ID.get(form) ?? FORMS[0]!;

  const tiles = bars >= template.bars * 2 && bars % template.bars === 0
    ? bars / template.bars
    : 1;
  const perTile = Math.floor(bars / tiles);

  const phrases: PhraseNode[] = [];
  for (let t = 0; t < tiles; t++) {
    const lengths = shareOut(perTile, template.slots.map((s) => s.weight));
    const last = t === tiles - 1;

    template.slots.forEach((slot, i) => {
      const id = slot.label + (t > 0 ? String(t + 1) : '');
      const cadence = i === template.slots.length - 1
        ? (last ? 'closed' : rng.chance(0.6) ? 'half' : 'open')
        : slot.cadence;

      // A tile after the first restates the previous tile's material rather than
      // stating fresh material: that is what makes a sixteen-bar chorus one
      // chorus. Whether it restates or varies is the repetition setting's call.
      if (!slot.from && t > 0) {
        const model = slot.label + (t > 1 ? String(t) : '');
        const intent: Intent = rng.chance(repetition) ? 'repeat' : 'vary';
        phrases.push({
          id, bars: lengths[i]!, cadence,
          from: { id: model, ops: opsFor(intent, opts) },
        });
        return;
      }

      if (slot.from) {
        phrases.push({
          id, bars: lengths[i]!, cadence,
          from: {
            id: slot.from.label + (t > 0 ? String(t + 1) : ''),
            ops: opsFor(slot.from.intent, opts),
          },
        });
        return;
      }

      phrases.push({ id, bars: lengths[i]!, cadence, motif: slot.motif ?? 'hook' });
    });
  }

  return { form, phrases };
}

/**
 * Divide `total` bars among slots by weight, giving whole bars and handing the
 * remainder to the phrases that carry the cadences.
 */
function shareOut(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const out = weights.map((w) => Math.max(1, Math.floor((total * w) / sum)));
  let spare = total - out.reduce((a, b) => a + b, 0);
  for (let i = out.length - 1; spare > 0; i = i === 0 ? out.length - 1 : i - 1) {
    out[i]! += 1;
    spare--;
  }
  // Over-allocated (every slot floored to 1 on a short section): trim from the
  // front, since the phrase that lands is the one that must keep its room.
  for (let i = 0; spare < 0 && i < out.length; i++) {
    while (spare < 0 && out[i]! > 1) { out[i]! -= 1; spare++; }
  }
  return out;
}

/**
 * Resolve an intent into operators.
 *
 * The weights are where a style's temperament lives. `develop` on a tango is a
 * fragment sequenced up the scale; on a Berlin-school synth line it is the same
 * figure at double speed, because that is what those records do with a figure.
 */
export function opsFor(intent: Intent, opts: FormOptions): Op[] {
  const { rng, voice, archetype, repetition } = opts;
  const appetite = (kind: Op['op']) => voice.ops?.[kind] ?? 1;
  const pick = (choices: readonly (readonly [Op[], number])[]): Op[] =>
    rng.weighted(choices.map(([ops, w]) => [ops, w * appetite(ops[0]?.op ?? 'transpose')] as const));

  switch (intent) {
    case 'repeat':
      // Verbatim is the point of a repeat, and the old engine's weights made it
      // the *least* likely outcome — right for art music, wrong for a chorus.
      // Repetition buys it its weight here rather than fighting for it.
      return pick([
        [[], 2 + repetition * 8],
        [[{ op: 'ornament', amount: voice.ornament }], 2],
        [[{ op: 'transpose', steps: 0 }, { op: 'extend', with: 'step' }], 1],
      ] as const);

    case 'answer':
      return pick([
        [[{ op: 'invert' }], 3],
        [[{ op: 'transpose', steps: -1 }], 2],
        [[{ op: 'fragment', keep: 3 }, { op: 'extend', with: 'leap' }], 2],
      ] as const);

    case 'sequence': {
      // The direction belongs to the kind of tune. A `chain` template walked
      // upward under every archetype that used it, which made a descending
      // sequence ascend — the one thing its name forbids.
      const up = rng.chance((archetype.sequenceDir + 1) / 2) ? 1 : -1;
      return pick([
        [[{ op: 'transpose', steps: up }], 4],
        [[{ op: 'transpose', steps: 2 * up }], 3],
        [[{ op: 'sequence', times: 2, steps: up }], 2 + archetype.stride],
      ] as const);
    }

    /**
     * Taking a figure apart is the one intent that may change how fast it moves.
     *
     * The double-time option is weighted where it used to be an also-ran, and the
     * reason is that it was the engine's only route to a fast passage and it was
     * effectively closed. Measured across the catalogue, 2% of sections contained a
     * run of three consecutive sixteenths and the mean section's longest such run
     * was a fifth of a note — there were, in practice, no fast passages anywhere.
     * That is not a stylistic choice this project made; it is what happens when the
     * one operator that can halve a note is drawn at weight 2 out of 11.5, inside an
     * intent that only two of the six forms use, times a style appetite most voices
     * set below 1.
     *
     * A development that moves at the same speed as its model is a transposition
     * with extra steps. Speed is what "take it apart" means to a player.
     */
    case 'develop':
      return pick([
        [[{ op: 'fragment', keep: 2 }, { op: 'sequence', times: 3, steps: -1 }], 3],
        [[{ op: 'fragment', keep: 3 }, { op: 'sequence', times: 2, steps: 1 }], 3],
        [[{ op: 'diminish', factor: 2 }, { op: 'sequence', times: 2, steps: 0 }], 5],
        [[{ op: 'diminish', factor: 2 }, { op: 'sequence', times: 2, steps: 1 }], 3],
        [[{ op: 'displace', by: 2 }, { op: 'invert' }], 2],
        [[{ op: 'invert' }, { op: 'expand', factor: 1.5 }], 1.5],
      ] as const);

    case 'lift':
      return pick([
        [[{ op: 'expand', factor: 1.6 }, { op: 'transpose', steps: 2 }], 3],
        [[{ op: 'transpose', steps: 3 }], 2],
        [[{ op: 'expand', factor: 2 }], 1.5],
      ] as const);

    case 'close':
      // The cadential phrase is shorter-breathed and more settled than what it
      // came from. Augmenting the fragment is what makes it sound like an ending
      // rather than like the tune stopping.
      return pick([
        [[{ op: 'fragment', keep: 3 }, { op: 'augment', factor: 1.5 }], 3],
        [[{ op: 'fragment', keep: 2 }, { op: 'augment', factor: 2 }], 3],
        [[{ op: 'augment', factor: 1.5 }], 2],
        [[{ op: 'reharmonise' }], 1],
      ] as const);

    case 'vary':
      return pick([
        [[{ op: 'ornament', amount: Math.max(0.3, voice.ornament) }], 3],
        [[{ op: 'expand', factor: 1.4 }], 2],
        [[{ op: 'displace', by: 2 }], 1.5],
        [[{ op: 'transpose', steps: 1 }, { op: 'ornament', amount: voice.ornament }], 1.5],
        // The second half of a tiled section is the other place a player doubles
        // up, and it is the only one available to the four forms that have no
        // `develop` slot at all. Without it, a sixteen-bar chorus repeats itself at
        // exactly one speed however many times it comes round.
        [[{ op: 'diminish', factor: 2 }, { op: 'sequence', times: 2, steps: 0 }], 2],
      ] as const);
  }
}

/** One line per phrase, for printing a plan. See `docs/tune-plan.md` §4.6. */
export function describePhrases(phrases: readonly PhraseNode[]): string[] {
  return phrases.map((p) => {
    const how = p.from
      ? `${p.from.id} + ${p.from.ops.map(describeOp).join(', ') || 'verbatim'}`
      : `state ${p.motif ?? 'hook'}`;
    return `${p.id.padEnd(5)} ${String(p.bars).padStart(2)}b  ${p.cadence.padEnd(9)} ${how}`;
  });
}

export function describeOp(op: Op): string {
  switch (op.op) {
    case 'transpose': return op.steps === 0 ? 'transpose 0' : `transpose ${op.steps > 0 ? '+' : ''}${op.steps}`;
    case 'sequence': return `sequence ×${op.times} @${op.steps > 0 ? '+' : ''}${op.steps}`;
    case 'fragment': return `fragment ${op.keep}`;
    case 'augment': return `augment ×${op.factor}`;
    case 'diminish': return `diminish ÷${op.factor}`;
    case 'displace': return `displace ${op.by > 0 ? '+' : ''}${op.by}`;
    case 'expand': return `expand ×${op.factor}`;
    case 'extend': return `extend ${op.with}`;
    case 'ornament': return `ornament ${op.amount.toFixed(2)}`;
    default: return op.op;
  }
}
