/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * What every instrument model must be, and nothing more.
 *
 * This is the geometry half of the seam described in `concert/types.ts`. The
 * choreographer says `{ kind: 'drum', voice: 'ht' }` — it knows a high tom is
 * being hit and has no idea where one is. A model answers "there, at that
 * angle" and has no idea what a bar is. Neither has to exist for the other to
 * be written or tested, which is the only reason the models can be built in
 * parallel with the thing that drives them.
 *
 * The interface is deliberately four members wide. Every temptation to add a
 * fifth — "let the model know what section it is" — is the same temptation to
 * let the visuals reach back into the music, and the answer is always that the
 * IR should carry it instead.
 */

import type { Group, Object3D, Vector3 } from 'three';

import type {
  Archetype, Effector, GestureKind, PlayPoint, Posture,
} from '../../../concert/types.js';

/** Where an effector has to be, and which way it should be pointing. */
export interface Contact {
  /** World-space position, in metres, in the model's own local frame. */
  position: Vector3;
  /**
   * Surface normal at that point — which way is "away from the instrument".
   *
   * This is what lets a hand approach a snare from above and a fretboard from
   * the side without either being special-cased. A stick rises *along the
   * normal*; without it every prep is a vertical lift and a guitarist looks
   * like they are typing.
   */
  normal: Vector3;
}

/** Where the player belongs relative to the instrument's own origin. */
export interface PlayerStation {
  offset: Vector3;
  /** Radians, relative to the instrument's facing. Usually 0. */
  facing: number;
  posture: Posture;
}

export interface InstrumentModel {
  archetype: Archetype;
  /** Added to the stage. The model owns everything under it. */
  root: Group;

  /**
   * Where to put an effector to play this point.
   *
   * Must be **pure and cheap**: it is called several times per performer per
   * frame, for gestures in a lookahead window, and it must return the same
   * answer for the same point regardless of what has been played. Anything
   * that changes over time belongs in `react` or `update`.
   *
   * A point the model does not recognise returns `undefined` rather than a
   * guess. A hand that visibly does not know where to go is a bug worth
   * seeing; a hand placed at a plausible default is a bug that ships.
   *
   * ## Two hands, one point
   *
   * `effector` exists because a string instrument needs *two* answers for the
   * same note: where the note is stopped, and where it is sounded. A guitarist
   * frets at the ninth fret and picks over the soundhole, and both come from
   * `{kind:'string', string, fret}`. Without this parameter the runtime would
   * place the picking hand on the fretboard, which is the single most obviously
   * wrong thing a string player can do.
   *
   * Omitted, or any effector other than a sounding one, means **the stopping
   * hand** — it is the one that moves with the note, so it is the sensible
   * default. `'right-hand'` and `'bow'` ask for the sounding contact.
   *
   * A model with only one answer may ignore the parameter entirely; a drum is
   * struck where it is struck. See `withSoundingContact` in `./index.ts`, which
   * adapts the string models rather than making all 22 implement this.
   */
  resolve(point: PlayPoint, effector?: Effector): Contact | undefined;

  /**
   * The instrument's own response to being played — a drum head dishing, a
   * string blurring, a bell flaring, a key going down.
   *
   * This is most of what makes a model read as "good quality fun" rather than
   * as a prop: the hand arriving is only half of a hit, and the half the eye
   * actually reads is the thing that moves *because* of it.
   *
   * `now` is the song position in beats, from the one clock. Do not keep your
   * own.
   */
  react(point: PlayPoint, force: number, now: number, kind?: GestureKind): void;

  /** Per-frame settling — decay whatever `react` displaced. Beats, again. */
  update(now: number): void;

  /** Where the player stands or sits. */
  station: PlayerStation;

  /** Release GPU resources when a number is struck. */
  dispose(): void;
}

/**
 * Every model is built by one of these, and the registry maps archetype to
 * builder. `scale` exists because a soprano and a baritone sax are one model at
 * two sizes — see `concert/instruments.ts`, where that decision is made.
 */
export type InstrumentBuilder = (opts: InstrumentBuildOptions) => InstrumentModel;

export interface InstrumentBuildOptions {
  /**
   * 0..1 within the archetype's family, where 0 is the smallest member and 1
   * the largest. A tenor sax is around 0.6.
   */
  scale?: number;
  /**
   * Deterministic per-performer, so two guitars on one stage are not the same
   * object twice. Vary finish and small proportions with it — never anything
   * `resolve` depends on, or the choreography and the geometry disagree.
   */
  seed: number;
  /** Body colour hint from the venue palette. Models may ignore it. */
  finish?: string;
}

/** A convenience for models that have nothing to settle. */
export const NO_UPDATE = (): void => {};

/** Attach a child and return it, for terse builders. */
export function addTo<T extends Object3D>(parent: Object3D, child: T): T {
  parent.add(child);
  return child;
}
