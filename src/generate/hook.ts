/**
 * Hook — how much the song repeats itself.
 *
 * Nine fields once, six of them gone. They described mechanisms inside the melody
 * engine that no longer exists — a motif's chance of exact restatement, a phrase's
 * chance of locking to one rhythm cell, how far a phrase's pitch vocabulary
 * narrowed — and every one of them is now a consequence of the derivation the tune
 * engine writes rather than a probability applied to a walk. `sequence` is the one
 * worth naming: it was authored in every level and read by nothing, because there
 * was no code that developed a motif.
 *
 * What is left is what the axis always meant. `recall` and `harmonyRecall` are
 * *arrangement* decisions — does this section come back, and over what chords — and
 * they belong here because they are about the song rather than about the tune. The
 * level itself reaches the tune engine as one number per section; see
 * `tune/adapt.ts`.
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
  /**
   * How far to bias the harmony toward the plainest progressions available,
   * 0..1.
   *
   * A hook is not only a melodic property. The songs everybody can sing are
   * built on three or four chords, and they are singable partly *because* the
   * harmony stops asking for attention — the ear has spare capacity for the
   * tune. Turning this up narrows the chord vocabulary and favours
   * progressions that return to the tonic.
   */
  harmonicSimplicity: number;
}

export const HOOK_LEVELS: HookLevel[] = [
  {
    id: 'through', level: 0, label: 'Through-composed',
    gloss: 'every section is new material — no tune ever comes back',
    recall: 0, harmonyRecall: 0, harmonicSimplicity: 0,
  },
  {
    id: 'loose', level: 1, label: 'Loose',
    gloss: 'sections of a kind share their harmony; a figure recurs inside a phrase',
    recall: 0, harmonyRecall: 0.5, harmonicSimplicity: 0.15,
  },
  {
    id: 'standard', level: 2, label: 'Standard',
    gloss: 'the chorus is a fixed tune that comes back each time',
    recall: 0.8, harmonyRecall: 1, harmonicSimplicity: 0.4,
  },
  {
    id: 'catchy', level: 3, label: 'Catchy',
    gloss: 'one figure carries a section, and every section is recalled',
    recall: 1, harmonyRecall: 1, harmonicSimplicity: 0.7,
  },
  {
    id: 'earworm', level: 4, label: 'Earworm',
    gloss: 'maximum repetition — simple on purpose, and hard to shake',
    recall: 1, harmonyRecall: 1, harmonicSimplicity: 0.9,
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
