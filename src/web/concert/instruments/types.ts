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
 * The interface is deliberately narrow. Every temptation to widen it — "let the
 * model know what section it is" — is the same temptation to let the visuals
 * reach back into the music, and the answer is always that the IR should carry
 * it instead. `shift` is the one addition that passed that test, and only
 * because it says nothing about music: it is geometry the runtime cannot see.
 */

import type { Group, Matrix4, Object3D, Vector3 } from 'three';

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
  /**
   * Which way the knuckles run, if the instrument cares.
   *
   * `normal` fixes two of the three axes of a hand and leaves the *roll* about
   * it free, which is fine on a drum head — a fist round a stick looks the same
   * either way — and wrong on anything the fingers lie along. A saxophone's
   * keys run down the tube, so the knuckle line has to run down the tube too;
   * without a reference the hand takes whatever roll the fallback happens to
   * produce and the fingers end up across the keys instead of on them.
   *
   * Give the axis the hand should lie along, in the same frame as `position`.
   * It is orthogonalised against `normal`, so it need not be exactly
   * perpendicular. Omit it and the previous behaviour stands.
   */
  along?: Vector3;
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
   * How far the part of this instrument `effector` works on has moved since
   * `resolve` answered, as a displacement in the model's own frame, into `out`.
   * `false` — or no method at all — means nothing under that effector moves,
   * which is true of every instrument here but one.
   *
   * This is not a fifth thing the seam knows about music; it is the honest
   * statement of a geometric fact `resolve`'s purity would otherwise have to
   * lie about. An accordion's bass side rides the bellows, so the buttons under
   * the left hand are not where they were a beat ago. `resolve` cannot say so —
   * it is required to be pure and time-invariant, and rightly — so it answers
   * where the buttons are on a box at rest and this says where that box has got
   * to. Composed by the runtime every frame, so the hand and the thing it is
   * pressing move as one object at one speed, which is the only way it reads as
   * the hand doing the work rather than trailing it.
   *
   * `now` is the song position in beats, from the one clock, as in `react`.
   * Must be cheap and must not allocate: this runs per live gesture per frame.
   * Whatever it reports has to be the same motion `update` draws, from the same
   * expression — two derivations of one movement drift the moment either is
   * touched.
   */
  shift?(effector: Effector, now: number, out: Matrix4): boolean;

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
   *
   * `hold` is how long the effector stays on this point, in beats — the
   * gesture's own follow-through, which for the sustaining kinds *is* the note
   * length. It exists because the two halves of a sustained motion were
   * estimating it separately and disagreeing: the runtime runs a bow hand out
   * along `tau / release`, and the violin model had to guess the same span from
   * the gap since the previous note, so a long note's bow finished its stroke
   * a beat early and a short one's was still going. Anything that has to move
   * *for the length of a note* — a bow, a key that stays down, a bellows —
   * needs this and cannot derive it. Omitted, a model must fall back to
   * whatever it did before.
   */
  react(
    point: PlayPoint, force: number, now: number, kind?: GestureKind, hold?: number,
  ): void;

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
  /**
   * How tall the player is, in metres. Optional; omit and a model assumes the
   * archetype's `workHeight`.
   *
   * This exists because a horn is held *to a face*, and faces are not all at
   * the same height. Casting draws a performer's height across a 1.58–1.92 m
   * spread, the rig puts the mouth at about `0.886 × height`, and a mouthpiece
   * anchored to the archetype's single `workHeight` is therefore correct for
   * the mean and up to 15 cm out at the ends — the horn floating below the lips
   * of a tall player and pushed through the chin of a short one.
   *
   * Only instruments that meet the body at a specific point need it: the blown
   * family, and anything else whose contact height is dictated by the player
   * rather than by the floor. A drum kit stands on the boards and should ignore
   * this entirely.
   */
  height?: number;
  /**
   * The year the show is standing in, from `Concert.year`. Omit and a model
   * assumes whatever it looked like before this existed.
   *
   * This is the one piece of show-level context the seam carries, and it passes
   * the narrowness test above for a reason worth stating: it says nothing about
   * the music. It is not "which section is this" or "how loud is the chorus" —
   * it does not vary across a show, across a number, or across a bar. It is a
   * fact about the *object on the stand*, and a model is exactly the thing that
   * should know it. A synthesiser in 1974 is a wall of patch cables with a
   * keyboard in front of it; in 1987 it is a plastic slab with no knobs at all.
   * Those are different props, not one prop in two moods.
   *
   * A year rather than an era id, because era ids are genre-local and a model
   * that branched on them would have to learn four vocabularies to answer a
   * question about a decade. See `EraProfile.year`.
   */
  year?: number;
  /**
   * Whether this kit's heads are pads. Percussion only; every other model
   * ignores it.
   *
   * It passes the same narrowness test `year` does, and for the same reason: it
   * says nothing whatsoever about the music. It does not vary across a show, a
   * number or a bar, and it is not "how loud is the chorus" — it is a fact
   * about the object standing on the boards, which is exactly what a model is
   * entitled to know. `DrumTrack.source` is where it comes from, and the two
   * values that set it are the two with a drummer behind them.
   *
   * Note what it deliberately does *not* change: the layout. A drummer on a
   * Simmons kit sits at the same throne and reaches to the same places, so
   * `LAYOUT`, `resolve` and every gesture in the choreography are identical.
   * The pads are shallower and hexagonal and the hoops are gone; the drummer is
   * playing the same kit.
   */
  electronic?: boolean;
}

/** A convenience for models that have nothing to settle. */
export const NO_UPDATE = (): void => {};

/** Attach a child and return it, for terse builders. */
export function addTo<T extends Object3D>(parent: Object3D, child: T): T {
  parent.add(child);
  return child;
}
