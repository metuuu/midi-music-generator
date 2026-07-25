/**
 * Hook — how much the song repeats itself.
 *
 * This is the axis that decides whether a listener could hum the thing
 * afterwards. It is not a quality setting and it is emphatically not a second
 * name for smoothness: smoothness asks *is this note wrong*, hook asks *have I
 * heard this before*. The two are independent, and the corners prove it — a
 * high-hook, low-smoothness song is raw and catchy, which describes most pop
 * ever written, while low-hook and high-smoothness is polite wallpaper that
 * never resolves into a tune.
 *
 * The gap it closes is real. Without it the generator writes a fresh melody for
 * every section, so the three choruses of a song are three different tunes that
 * merely share a style. That is a defensible way to write jazz solos and a
 * hopeless way to write a chorus, because a chorus *is* the repetition.
 *
 * At the top of the range the music becomes simple on purpose. That is the
 * thing musicians sneer at pop for, and it is also the thing that makes pop
 * work: the fourth time you hear a phrase you are no longer decoding it, you
 * are recognising it. `earworm` is the setting that takes that seriously.
 */

import type { SectionKind } from '../core/types.js';

export type HookId = 'through' | 'loose' | 'standard' | 'catchy' | 'earworm';

export interface HookLevel {
  id: HookId;
  level: number;
  label: string;
  gloss: string;
  /**
   * Probability that a section replays the melody of an earlier section of the
   * same kind, transposed if the key has moved. The single biggest lever here:
   * this is what gives a song a chorus rather than three unrelated tunes.
   */
  recall: number;
  /**
   * Probability that a section reuses an earlier section's *chords* without its
   * tune. Cheaper and subtler than full recall — the ear notices that the
   * chorus always turns the same corner even when the melody is new.
   *
   * Melody recall implies this: a tune replayed over different harmony is not a
   * recollection, it is a mistake.
   */
  harmonyRecall: number;
  /** Multiplier on the style's own motif-sequence probability. */
  sequence: number;
  /**
   * How much to favour an *exact* restatement of a motif over a transposed one.
   *
   * The generator's default weights make an unchanged repeat the least likely
   * outcome, which is right for art music and wrong for a hook. Verbatim is the
   * whole point: "da-da-da-DAA" three times, unchanged.
   */
  exactRepeat: number;
  /**
   * Probability that a phrase runs on a single rhythm cell, varying only pitch.
   *
   * Rhythmic identity is what survives being hummed badly by someone who cannot
   * hold a pitch, which is most people, which is why it matters more than the
   * notes do.
   */
  rhythmLock: number;
  /**
   * How far the pitch vocabulary narrows within a phrase, 0..1. Pulls the line
   * back toward notes it has already sounded, and relaxes the generator's
   * standing distaste for repeating a note.
   */
  vocabulary: number;
  /**
   * May bar 2 of a phrase already restate bar 1? Off at the low levels, where
   * a restatement waits until bar 3 and reads as development rather than as a
   * refrain.
   */
  earlyRestate: boolean;
}

export const HOOK_LEVELS: HookLevel[] = [
  {
    id: 'through', level: 0, label: 'Through-composed',
    gloss: 'every section is new material — no tune ever comes back',
    recall: 0, harmonyRecall: 0, sequence: 1, exactRepeat: 0,
    rhythmLock: 0, vocabulary: 0, earlyRestate: false,
  },
  {
    id: 'loose', level: 1, label: 'Loose',
    gloss: 'sections of a kind share their harmony; motifs recur within a phrase',
    recall: 0, harmonyRecall: 0.5, sequence: 1.3, exactRepeat: 0.15,
    rhythmLock: 0.15, vocabulary: 0.1, earlyRestate: false,
  },
  {
    id: 'standard', level: 2, label: 'Standard',
    gloss: 'the chorus is a fixed tune that comes back each time',
    recall: 0.8, harmonyRecall: 1, sequence: 1.6, exactRepeat: 0.4,
    rhythmLock: 0.35, vocabulary: 0.25, earlyRestate: true,
  },
  {
    id: 'catchy', level: 3, label: 'Catchy',
    gloss: 'one rhythm per phrase, tighter vocabulary, every section recalled',
    recall: 1, harmonyRecall: 1, sequence: 2.2, exactRepeat: 0.8,
    rhythmLock: 0.7, vocabulary: 0.5, earlyRestate: true,
  },
  {
    id: 'earworm', level: 4, label: 'Earworm',
    gloss: 'maximum repetition — simple on purpose, and hard to shake',
    recall: 1, harmonyRecall: 1, sequence: 3, exactRepeat: 1,
    rhythmLock: 1, vocabulary: 0.8, earlyRestate: true,
  },
];

const BY_ID = new Map(HOOK_LEVELS.map((l) => [l.id, l]));

export function getHook(id: HookId | number): HookLevel {
  if (typeof id === 'number') {
    const found = HOOK_LEVELS.find((l) => l.level === id);
    if (!found) throw new Error(`Unknown hook level ${id}`);
    return found;
  }
  const found = BY_ID.get(id);
  if (!found) throw new Error(`Unknown hook "${id}". Known: ${[...BY_ID.keys()].join(', ')}`);
  return found;
}

export const HOOK_IDS = HOOK_LEVELS.map((l) => l.id);

/**
 * How eagerly each kind of section wants to be recalled.
 *
 * A chorus is defined by coming back unchanged, so it recalls hardest. A verse
 * usually keeps its tune and changes its words — which, in instrumental music,
 * means it keeps its tune — but a little variation there is welcome and costs
 * the listener nothing.
 *
 * `solo` is zero on principle rather than by tuning. A solo that replays an
 * earlier solo is not a solo, and this is what keeps a high hook setting from
 * ruining jazz: the head becomes properly recognisable, the blowing stays free,
 * and head–solos–head starts to mean what it says.
 *
 * Intros and outros are zero because they are the wrong length to match
 * anything anyway, and because an intro exists to introduce.
 */
export const RECALL_BIAS: Record<SectionKind, number> = {
  chorus: 1,
  bridge: 0.85,
  verse: 0.7,
  intro: 0,
  outro: 0,
  solo: 0,
};
