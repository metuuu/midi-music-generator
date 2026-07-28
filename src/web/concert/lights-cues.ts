/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Cue playback — a `LightingScore` read as a fixture state at a beat.
 *
 * The whole of this file exists to make one property true: **the state of the
 * rig at beat *b* is a pure function of *b* and the cue list.** Nothing is
 * integrated, nothing accumulates, and no frame's answer depends on the
 * previous frame's. Seek backwards and you get exactly what you got on the way
 * out; drop three hundred frames and the light is where the score says it is
 * rather than three hundred frames behind.
 *
 * That is not fussiness. The show runner seeks — the programme overlay, a
 * restart, a number that loops (`transport.beat()` wraps) — and a rig that
 * integrates its way forward has to be told about every one of those, which
 * means a rig that is wrong the first time somebody adds a fourth way to move
 * the playhead.
 *
 * ## Console semantics
 *
 * `LightCue` says it and `concert/lighting.ts` argues it: a cue is **taken at
 * `beat`** and **completes at `beat + fadeBeats`**. So at any moment a fixture
 * is somewhere on the fade belonging to the last cue whose beat has passed, and
 * `fadeBeats: 0` is a snap. Fixtures start **black**, except where the score
 * asks for a preset — a fixture whose first cue is the opening one starts at
 * `LightingScore.preset` of it, because the audience is looking at the stage
 * before the downbeat and has to be looking at something.
 *
 * The one thing that is not obvious: when a cue is taken while the previous
 * fade is still running, the new fade starts from **wherever the fixture
 * actually is**, not from the level the previous cue was heading for. That is
 * what a real console does, and it is the reason this file precomputes an
 * explicit `from` for every step in one forward pass at `begin()` rather than
 * asking the question again at every frame. After that pass, evaluation is a
 * binary search and one lerp.
 *
 * Fades are **linear in level**. A console fader is linear and an eased fade
 * would be the rig inventing dynamics the score did not ask for — the score
 * already chose the fade lengths, and every one of them is argued for in
 * `concert/lighting.ts`. Movement is a different matter and is eased where it
 * happens (see `warm` in `lights.ts`), because a motor accelerates and a
 * dimmer does not.
 *
 * ## Colour
 *
 * `LightCue.colour` is optional, and absent means *unchanged* — the fixture
 * keeps the gel it was last given. A fixture that has never been gelled burns
 * white, which is what an instrument with an empty gel frame does. The score
 * leaves `key` and `footlights` uncoloured throughout, so those two are white
 * lamps lifting a stage the `wash` has already coloured, which is how a rig
 * with one colour scroller and several plain lanterns actually behaves.
 *
 * Colours are carried as sRGB 0..1 triples rather than `Color`, so this module
 * stays arithmetic and the one conversion into three.js's working space happens
 * in `lights.ts` where the light objects are.
 */

import type { FixtureId, LightingScore } from '../../concert/types.js';

/** Every fixture the contract names. Order is only for stable iteration. */
export const FIXTURES: readonly FixtureId[] = [
  'wash', 'key', 'back', 'cyc', 'footlights', 'warm', 'spot',
];

export interface Rgb { r: number; g: number; b: number }

/** What one fixture is doing at a beat. Mutated in place; never allocated per frame. */
export interface FixtureState {
  /** 0..1, exactly as the score means it. The rig applies its own gain. */
  intensity: number;
  /** sRGB 0..1. */
  colour: Rgb;
  /** Whom the cue now running names. `spot` and `warm` only. */
  follow?: string;
  /** Whom the *previous* cue named. What a moving fixture is travelling from. */
  fromFollow?: string;
  /** Beat the cue now running was taken at. `-Infinity` before the first. */
  takenAt: number;
  /** That cue's fade length, in beats, after any reduced-motion flooring. */
  fadeBeats: number;
  /** 0..1 through that fade; 1 once it has completed. */
  progress: number;
}

/** One cue, with the level and gel it starts from already worked out. */
interface Step {
  beat: number;
  fade: number;
  from: number;
  to: number;
  fromColour: Rgb;
  toColour: Rgb;
  follow?: string;
  fromFollow?: string;
}

export type Timeline = Readonly<Record<FixtureId, Step[]>>;

const WHITE: Rgb = { r: 1, g: 1, b: 1 };

/**
 * Fold a score into one step list per fixture.
 *
 * `minFade` floors every fade, and exists for `prefers-reduced-motion`: the
 * score's fill bumps can be `fadeBeats: 0`, which is a snap and is the one
 * thing in the whole rig that could read as a flash. Flooring it at a quarter
 * beat keeps the accent and removes the edge. Zero everywhere else.
 */
export function buildTimeline(score: LightingScore, minFade = 0): Timeline {
  const out = {} as Record<FixtureId, Step[]>;
  for (const f of FIXTURES) out[f] = [];
  const preset = clamp01(score.preset);

  // The score promises sorted cues; sorting again costs nothing and means a
  // hand-written or spliced cue list cannot produce a silently wrong fade.
  const cues = [...score.cues].sort((a, b) => a.beat - b.beat);

  for (const cue of cues) {
    const steps = out[cue.fixture];
    // A fixture id from a newer contract than this rig knows about. Ignoring it
    // loses a light; throwing loses the show.
    if (!steps) continue;

    const prev = steps[steps.length - 1];
    const to = clamp01(cue.intensity);
    const toColour = cue.colour ? parseHex(cue.colour) : (prev ? prev.toColour : WHITE);

    /**
     * Where this fixture is coming from.
     *
     * Black, unless this is the fixture's first cue *and* it is taken at the
     * top, in which case the fixture was on the preset — the board has been
     * holding it since before the house went out, and the score's opening state
     * settles it rather than creating it. `preset` is a fraction of the level
     * the cue is heading for, so this needs no second look at the score.
     *
     * The test is `beat <= 0` rather than "the first step", because a follow
     * spot's first cue is a pickup in the middle of a number and a spot already
     * burning at three quarters, on a player who is not soloing yet, is a worse
     * bug than the one this fixes.
     */
    let from = !prev && cue.beat <= 0 ? to * preset : 0;
    let fromColour = toColour;
    if (prev) {
      const t = prev.fade > 0 ? clamp01((cue.beat - prev.beat) / prev.fade) : 1;
      from = prev.from + (prev.to - prev.from) * t;
      fromColour = lerpRgb(prev.fromColour, prev.toColour, t);
    }

    steps.push({
      beat: cue.beat,
      fade: Math.max(0, Math.max(cue.fadeBeats, minFade)),
      from,
      to,
      fromColour,
      toColour,
      follow: cue.followPerformerId,
      fromFollow: prev?.follow,
    });
  }

  return out;
}

/**
 * Where a fixture is at `beat`. Writes into `out` and returns it.
 *
 * Before the first cue the answer is black, which is the contract's own
 * starting condition and the reason a score with no `spot` cue in it — every
 * ambient number — produces no follow spot rather than a dark one that could be
 * turned on by accident later.
 */
export function evaluate(steps: readonly Step[], beat: number, out: FixtureState): FixtureState {
  const i = lastAtOrBefore(steps, beat);
  if (i < 0) {
    out.intensity = 0;
    out.colour = WHITE;
    out.follow = undefined;
    out.fromFollow = undefined;
    out.takenAt = -Infinity;
    out.fadeBeats = 0;
    out.progress = 1;
    return out;
  }

  const s = steps[i]!;
  const t = s.fade > 0 ? clamp01((beat - s.beat) / s.fade) : 1;
  out.intensity = s.from + (s.to - s.from) * t;
  out.colour = t >= 1 ? s.toColour : lerpRgb(s.fromColour, s.toColour, t);
  out.follow = s.follow;
  out.fromFollow = s.fromFollow;
  out.takenAt = s.beat;
  out.fadeBeats = s.fade;
  out.progress = t;
  return out;
}

export function blankState(): FixtureState {
  return {
    intensity: 0, colour: WHITE, follow: undefined, fromFollow: undefined,
    takenAt: -Infinity, fadeBeats: 0, progress: 1,
  };
}

/** Index of the last step taken at or before `beat`, or -1. */
function lastAtOrBefore(steps: readonly Step[], beat: number): number {
  let lo = 0;
  let hi = steps.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (steps[mid]!.beat <= beat) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

export function parseHex(s: string): Rgb {
  const n = parseInt(s.slice(1), 16);
  if (!Number.isFinite(n)) return WHITE;
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
