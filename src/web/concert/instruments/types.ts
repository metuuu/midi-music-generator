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

import type { DrumVoice } from '../../../core/types.js';

import type {
  Archetype, Effector, GestureKind, PlayPoint, Posture, SynthRigId,
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
  /**
   * How far each finger of the hand taking this contact is down: **index,
   * middle, ring, little — 0 lifted clear of its key, 1 pressed home.**
   *
   * ## Why this is allowed to be here
   *
   * The rule at the top of this file refuses every widening that lets the
   * visuals reach back into the music, and this is not one of those. It is the
   * same kind of fact `along` already is, one step further along the same
   * thought: `position` says where the hand goes, `along` says which way it
   * lies there, and this says what it is *doing*. All three answer "what is the
   * shape of a hand that is here", and nothing but the model can answer it —
   * the runtime does not learn what a bar is, how loud it is or which section it
   * is in. It learns that a saxophone shortens its air column from the bell up,
   * and it learns it as four numbers without ever being told the rule.
   *
   * It has to come from this side, because the alternative is a runtime that
   * knows a clarinet repeats at the twelfth and a trumpet has three valves.
   * That is the seam inverted. The fingering system belongs to the object and is
   * already written down once per file, in `fingeringFor`, where `react` reads
   * it to close the pads — so this is the same answer read a second time, by the
   * hand instead of by the instrument, which is precisely why the two can never
   * drift apart.
   *
   * `resolve`'s purity is untouched: a fingering is a function of the point and
   * of nothing else, so every one of these comes off a table built once.
   *
   * **The middle of the range means "leave it".** A finger this instrument's
   * fingering says nothing about — a trumpeter's little finger, which sits in
   * the ring hook all night — should keep whatever shape the pose put it in, and
   * `0.5` is how a hand says so. Omit the field entirely and every finger says
   * it, which is the right answer for a drum, a fretboard and a bow.
   *
   * Held as a frozen tuple rather than cloned per call, unlike the vectors
   * above: a caller has nothing to transform in place here, so there is nothing
   * for a shared reference to break.
   */
  fingers?: FingerCurl;
}

/** Four closures, index to little. See `Contact.fingers`. */
export type FingerCurl = readonly [number, number, number, number];

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
   * adapts the string models rather than making all **22** — twenty-four, since
   * `singer` and `vocal-group` — implement this.
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

  /**
   * Where a lead leaves this instrument, in its own frame. Absent on anything
   * that has never had one, which is most of them.
   *
   * ## Why this is allowed to be here
   *
   * The rule at the top of this file is that every temptation to widen the seam
   * is the temptation to let the visuals reach back into the music, and it is
   * refused. `shift` is the one thing that ever passed, and only because it
   * says nothing whatever about music — it is geometry the runtime cannot
   * otherwise see. This passes the same test and for the same reason: where the
   * socket is on a Rhodes is a fact about the object, no different in kind from
   * where its keys are, and nothing that reads it learns what a bar is.
   *
   * Absent is a real answer and the common one. A cello with a lead running to
   * the back of the stage would be wrong for every era in the pool, so an
   * acoustic model simply does not have this and gets no cable — see §8.4 of
   * `docs/backline-plan.md`.
   *
   * Held instruments are the interesting case. A guitar's socket moves with the
   * guitar, so what hangs off it has to live in this frame too; `buildTail` in
   * `cables.ts` is that, and the run along the boards starts from the slack at
   * the player's feet rather than from the jack. That is not an approximation
   * of a guitar lead — it is what one does.
   */
  outlet?: Vector3;

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
  /**
   * Which auxiliary pieces this part actually calls for. Percussion only.
   *
   * A drummer with no tambourine part does not have a tambourine clamped to
   * their hi-hat rod. The kit used to grow all three of its bracket pieces —
   * cowbell, woodblock, tambourine — in every number regardless, so most
   * drummers sat behind two or three objects nobody would touch all night, and
   * the tambourine is the conspicuous one: it is the largest of them and it
   * hangs out over the hats where the eye already is.
   *
   * It passes the same narrowness test `electronic` does, and it is worth being
   * precise about why, because "which voices are in this part" sounds like
   * exactly the sort of thing this seam refuses. What is passed is not a
   * pattern, a section, a dynamic or a count — it is the *set of objects the
   * player has*, which does not vary across a bar or across a number, and which
   * is the one question a model of a kit is entitled to answer. A caller that
   * omits it gets the whole rack, which is what the gallery wants: an
   * instrument shown as an instrument, not as one number's subset of it.
   *
   * Absent pieces are absent from `resolve` too. A voice whose object was not
   * built must answer `undefined`, or the omission becomes a hand reaching for
   * something that is no longer there — which is the bug this whole corner of
   * the file exists to make impossible.
   */
  aux?: readonly DrumVoice[];
  /**
   * Which drum this percussionist is playing. Hand drum only; every other model
   * ignores it.
   *
   * The rack half of `DrumTrack.bank` — `darbuka`, `congas`, `mridangam` — from
   * `readBankName`. See `SAMPLE_RACKS` in `render/drum-banks.ts`, which is the
   * table that names them and measures what each one is.
   *
   * It passes the narrowness test the three fields around it are held to, and on
   * the plainest sentence of it: this is not a fact about a performance at all,
   * it is *which object is standing there*. It cannot vary across a bar, a
   * number or a show, because the era drew one bank before a note existed.
   *
   * **And it is the field that stops one archetype from being one drum.**
   * `handdrum` covers a family — a goblet drum between the knees, three barrel
   * drums on a stand, a two-headed barrel across the shins — and until this
   * existed a conga player was staged holding a darbuka. That is not a small
   * licence like a viola drawn as a violin: `SAMPLE_RACKS` says in as many words
   * that a darbuka's three strokes are three places on *one head* while a
   * conga's are three *different drums*, so the two are not the same object seen
   * at different sizes and the hands do not travel the same distances.
   *
   * A caller that omits it, or names a rack this file has never heard of, gets
   * the goblet — the object this archetype was built as and the commonest of the
   * three across the catalogue.
   */
  rack?: string;
  /**
   * What this tuned percussion instrument's bars are made of. Mallets only;
   * every other model ignores it.
   *
   * It is `rack` one archetype along, and it is here for the same reason: an
   * archetype that covers a family needs one fact to say which member of it is
   * standing there. `handdrum` could not tell a conga from a darbuka; `mallets`
   * could not tell a marimba from a vibraphone, and staged fourteen catalogue
   * entries as three and a half octaves of aluminium with a motor under it.
   * Nine of those entries are not metal and three of them are unambiguously
   * wood — the marimba, the xylophone and the balafon — which between them
   * reach twelve genres.
   *
   * The narrowness test `year`, `electronic` and `rack` are held to is passed on
   * the same sentence all three pass it on: this says nothing whatever about the
   * music. It cannot vary across a bar, a number or a show, because the
   * catalogue entry was drawn before a note existed. It is a fact about the
   * object, which is precisely what a model is entitled to know.
   *
   * **And it does not move a single contact.** Rosewood bars sit in the same
   * keyboard layout at the same work height, so `resolve` answers exactly what
   * it answered before and the choreography is untouched — the difference is
   * the material, the resonators, and the two pieces of a vibraphone a marimba
   * has never had: the motor and the damper pedal. See `BARS_OF` in
   * `./index.ts`, which is where a catalogue entry's answer comes from.
   *
   * Omitted means metal, which is what every caller got before this existed and
   * what the archetype's own label still says it is.
   */
  bars?: 'metal' | 'wood';
  /**
   * How the player at this object is arranged, from `Station.posture`.
   *
   * Omit and a model builds itself for the posture its own `ArchetypeSpec`
   * declares, which is what every caller got before this existed and what the
   * gallery bench still wants.
   *
   * It passes the narrowness test `year` and `electronic` are held to, and it is
   * worth saying which sentence of that test it passes on, because "how is the
   * player sitting" sounds like something about a performance. It is not: it
   * does not vary across a show, a number or a bar, it says nothing about what
   * is being played, and it is settled before a single note is looked at. It is
   * the same kind of fact as `height` two fields up — *how tall is the person
   * this object has to meet* — asked about the other end of them.
   *
   * **Only the two objects whose geometry actually moves read it.** A hand drum
   * on a carpet has its head at 0.32 m and one between the knees of somebody on
   * a chair has it at 0.72, and the difference is not a translation of the whole
   * model: the body has to shorten so its foot still lands on the boards, and
   * the trap table beside it has to come down with legs to match. That is what
   * this field buys and it is the whole of what it buys. The sitar needs it even
   * less — its posture is `floor` in every tradition, so it reads its own spec
   * and ignores this.
   */
  posture?: Posture;
  /**
   * Which synthesiser this is. Keyboards only; every other model ignores it.
   *
   * From `Performer.rig`, and it replaces the year this model used to branch
   * on. The reason is the reason `Performer.rig` exists: which object a player
   * stands behind is a decision about the *band* — one modular is a centrepiece
   * and three are a trade stand — and a year cannot tell those apart because it
   * cannot count. `year` is still passed and still means what it meant; it is
   * simply no longer what decides this.
   */
  rig?: SynthRigId;
  /**
   * How many keyboards this player is standing at. Absent means one.
   *
   * From `Performer.boards`, and the layout for a given count is `boardsFor` in
   * `concert/instruments.ts` — which both this model and the choreographer read,
   * so the keys and the travel budget cannot disagree about where a board is.
   */
  boards?: number;
  /**
   * A machine this instrument *contains*, where the band's is mounted in it.
   *
   * See `SynthRigOptions.machine` and `StageMachine.mount`. Only reaches a rig
   * that has a bay for one; every other model ignores it, and the machine is
   * drawn as its own mounted object instead.
   */
  machine?: {
    kind: 'box' | 'programmed' | 'sequencer';
    events: readonly { beat: number; velocity: number }[];
    beatsPerBar: number;
  };
}

/** A convenience for models that have nothing to settle. */
export const NO_UPDATE = (): void => {};

/**
 * How far the rig's touch point sits from the index finger along the knuckle
 * line, metres. `buildHand` seats the knuckles 0.46 R apart about the hand's
 * centreline and `aimTouch` solves on that centreline, so a contact meant for
 * the index goes this far toward the little finger.
 */
export function indexToCentre(height: number | undefined): number {
  return 1.5 * 0.46 * 0.04 * Math.min(Math.max(height ?? 1.75, 1.35), 2.10);
}

/** Attach a child and return it, for terse builders. */
export function addTo<T extends Object3D>(parent: Object3D, child: T): T {
  parent.add(child);
  return child;
}
