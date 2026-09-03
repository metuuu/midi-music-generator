/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Standing down: everything about a player who is not playing.
 *
 * These numbers used to be private to `animate.ts`, which was true of where
 * they are *read* and false about where they can be *judged*. A pose is right
 * or wrong by the picture, and the picture only ever existed on a stage that
 * had to be running, in a band that happened to include the instrument, in a
 * gap long enough for anyone to stand down. So the table went untuned: half the
 * catalogue has no entry here at all and hangs wherever its strap left it,
 * which is the correct answer for a guitar and was never checked for anything
 * else.
 *
 * Gathering them here is what lets the model bench put a player at ease and
 * scrub the whole way into it — see `gallery.ts`, which drives exactly these
 * functions rather than a second version of them that would have to be kept in
 * agreement. A pose dialled in on the bench is the pose the show takes, because
 * it is the same arithmetic on the same table.
 *
 * Three separable things live here, and it is worth saying which is which
 * before reading the tables:
 *
 *  1. **Where the instrument goes** — `AT_EASE`, per archetype. A trumpet comes
 *     down to the waist; a saxophone on a strap barely moves.
 *  2. **Where the hands go** — the model's own `resolve({kind:'rest'})`, plus
 *     `REST_TRIM` for correcting it without opening twenty-four files.
 *  3. **What they must not end up inside** — `keepOutParts` and `escapeFrom`,
 *     which are about the body meeting the furniture and have no table.
 */

import { Box3, Euler, Matrix4, Object3D, Quaternion, Vector3 } from 'three';

import type { Archetype, Effector } from '../../concert/types.js';

import type { Contact, InstrumentModel } from './instruments/types.js';
import type { PerformerRig } from './performer.js';

/**
 * Where a carried instrument goes when its player stands down.
 *
 * Angles are in the *torso's* frame — the one frame that means the same thing
 * for every model, since a trumpet, a violin and a Telecaster do not agree
 * about which way their own local axes point and do agree about which way is
 * down. `pitch` is about the player's lateral axis, so a bell swings down;
 * `roll` is about their forward axis, so an instrument held across the body
 * tips and hangs; `turn` is about their up axis. `drop` and `back` then move
 * the whole thing, in metres.
 *
 * All three are needed or none are. Two angles reach only a surface of
 * orientations, and which surface depends on where the instrument started — for
 * anything lowered straight down the front of the body that is plenty, and for
 * the one instrument that starts on a shoulder it is not. See `violin` below,
 * where the missing axis was the difference between a violin hanging face-out
 * and the same violin hanging face-in.
 *
 * ## The pivot, which is the part that was wrong
 *
 * The rotation is about **the point the player holds the instrument by** —
 * `resolve({kind:'rest'})`, which is where the model says a hand goes. That is
 * not a refinement: rotating about the model's own origin instead put the
 * pivot on the boards, because `show.ts` stages a carried model with its
 * origin at floor level and only the geometry up at chest height. Pitching
 * 0.8 rad about a point a metre and a half below the horn threw a trumpet
 * **1.2 m downstage** — measured — so the band stood at ease with their
 * instruments hanging in the air out over the front row.
 *
 * ## Why a table and not a formula
 *
 * Because "at ease" is a different physical act per instrument and the picture
 * is the only judge. A trumpet comes down to the waist with the bell toward
 * the floor. A saxophone barely moves — it is on a neck strap, and all that
 * changes is that the mouthpiece leaves the lips. A violin comes off the chin
 * and hangs from the left hand by the hip, which is a roll rather than a
 * pitch. Anything carried on a strap and *not* here — a guitar, a bass, an
 * accordion — stays exactly where it hangs, because that is what those do.
 *
 * Every figure below was measured against the body it belongs to. The comments
 * give the resulting bounding box in the player's own frame, y from the
 * boards, for a mean-height cast member.
 *
 * ## And the lengths scale with the player
 *
 * The angles are angles and belong to every body; the three lengths are metres
 * measured against **one** body, and `makeLook` draws a height from 1.58 to
 * 1.92. So they are scaled by the player's own height in `lowerAtEase`, which
 * leaves a mean-height cast member exactly where they were measured and stops
 * the ends of the range drifting: a fixed drop put a 1.92 m violinist's grip
 * 6 cm above their own hip and a 1.58 m one's 6 cm below it, and since the arm
 * scales too, that is an arm at 0.80 of its reach on the one and past full
 * stretch on the other. Scaled, both hold the violin at 0.88–0.93 of a reach,
 * like the mean.
 */
export interface AtEasePose {
  pitch: number;
  roll: number;
  /**
   * Yaw, about the player's up axis. Optional: it is the middle term of the
   * `ZYX` Euler in `lowerAtEase`, which was written as a literal zero because
   * nothing needed it until an instrument had to be turned over rather than
   * tipped.
   */
  turn?: number;
  drop: number;
  back: number;
  /**
   * How far it also moves along the player's lateral axis, positive to their
   * left. Optional, because only one instrument is not carried in front of the
   * body.
   *
   * `drop` and `back` are the whole motion for anything held at the chest and
   * lowered to the waist — a trumpet, a flute, a clarinet all come straight
   * down the front. A violin does not start there: it is up on the *left
   * shoulder*, so the hand holding its neck begins half a metre out from the
   * player's midline, and lowering it in `y` and `z` alone leaves that arm held
   * out to the side for the length of the rest. Coming down means coming in as
   * well, and there was no axis to say so in.
   */
  across?: number;
  /**
   * How far each hand lets go of the instrument, `[left, right]`: 0 stays on
   * it, 1 goes to the hip.
   *
   * The instrument coming down and the hands going to the hips were two
   * independent motions, and an instrument nobody is holding is what that looks
   * like — a flute floating down to the waist while both hands set off for the
   * pockets, arriving at neither the flute nor the body on the way. Something
   * has to be carrying it.
   *
   * So each pose says which hands stay. A clarinet, a flute and a saxophone are
   * held in *both* hands at rest, near enough where they play; a trumpet and a
   * trombone hang from the hand that was already taking their weight while the
   * other arm drops; a violin hangs from the left hand by its neck with the bow
   * arm down. The small non-zero values on the two-handed ones are the fingers
   * coming off the keys without the hands leaving the instrument.
   *
   * Anything not in this table is unchanged — both hands go to the hips, which
   * is right for a guitar or an accordion on a strap.
   */
  hands: readonly [number, number];
}

/**
 * The body every length in `AT_EASE` was measured against.
 *
 * The centre of `makeLook`'s own bell, so the scaling is a correction at the
 * ends of the cast rather than a change to the middle of it. Written out here
 * and in the two models that need it — `instruments/mouth.ts` and
 * `instruments/sitar.ts` — rather than shared, because each is a statement
 * about a different measurement.
 */
export const NOMINAL_HEIGHT = 1.75;

export const AT_EASE: Partial<Record<Archetype, AtEasePose>> = {
  // Bell to the floor, held in front of the waist: y 0.90–1.40, z 0.17–0.41
  // against a chest front at 0.19. Was y 1.49–1.68 at the lips.
  // The left hand keeps the casing; the right comes off the valves.
  trumpet: { pitch: 1.35, roll: 0, drop: 0.42, back: 0.14, hands: [0.08, 0.75] },
  // Long, so it needs the room: bell down by the shin, slide up at the chest.
  // y 0.40–1.30. The left hand is the one holding it and always was.
  trombone: { pitch: 1.10, roll: 0, drop: 0.44, back: 0.06, hands: [0.08, 0.70] },
  // On its strap, and that is the whole point — it hangs where it hangs and
  // only comes off the face. Ten centimetres of daylight under the lips.
  saxophone: { pitch: 0.38, roll: 0, drop: 0.10, back: 0, hands: [0.18, 0.18] },
  // Straight down the front of the body, tight in: z 0.16–0.23.
  clarinet: { pitch: 0.55, roll: 0, drop: 0.22, back: 0.02, hands: [0.18, 0.18] },
  // Off the lip plate and down to the waist: y 1.06–1.28, from 1.57–1.69.
  flute: { pitch: 0.60, roll: 0, drop: 0.46, back: 0.02, hands: [0.20, 0.20] },
  // A harp weighs nothing and comes down in one hand, so this is mostly the
  // 42 cm from the lips to the waist: y ~1.49 to ~1.07 on a mean-height cast
  // member. The roll is the shape of that — the pivot is the left hand on the
  // low end, so the far end dips under it and the thing reads as *held* rather
  // than as a level object translated downward. Nothing at all was here
  // before, which for a `held` archetype means the harmonica hung at the lips
  // of a player whose hands had both gone to their hips.
  harmonica: { pitch: 0.20, roll: 0.50, drop: 0.42, back: 0.05, hands: [0.05, 0.85] },
  // Off the chin and hanging straight down by the left hip: y 0.37–1.00.
  //
  // ## Why three angles and why these three
  //
  // A violin at rest turns rather than tips: the pivot is the hand on the neck
  // and the body swings down under it, which is only true if that hand is still
  // on the neck — so it is the one that does not let go.
  //
  // Turning it *far enough* took the third axis. The instrument has to end up
  // with two things true at once, and with `turn` pinned at zero only the first
  // was reachable: the scroll points **up**, because the hand holds the neck
  // and the body is the heavy end, and the belly faces **out**, away from the
  // player. The second is not a detail about the pretty side of the wood. The
  // contact normal is the belly's, so it is also which side of the neck the
  // hand is on: face-in put the hand between the violin and the thigh with the
  // palm turned outward, which is an arm held in supination for the whole rest.
  // Face-out is the hand outboard, palm in, arm hanging.
  //
  // So the target is stated as a basis and the angles are solved for it, rather
  // than dialled in: the build frame's `+x` (bridge → nut) onto the player's
  // `+y`, its `+y` (out of the belly) onto the player's `+x`. That is a proper
  // rotation — the third axis falls out as the player's `−z` — and decomposing
  // `[ŷ x̂ −ẑ] · Mᵀ` in `ZYX` gives exactly the numbers below. The pitch is a
  // hair off 180°, which is the sense in which this pose is the old one turned
  // over.
  //
  // ## The lengths, which are the arm's problem and not the violin's
  //
  // They are read against where that hand goes when it is holding nothing at
  // all — `restPosition`, (0.354, 0.910, 0.150) on a mean-height player — because
  // that is what the eye compares the pose to. Dropping 0.34 and nothing else
  // left the grip at (0.52, 1.21, 0.39), seventeen centimetres out and thirty in
  // front of a hanging arm, so the violinist spent every rest holding the
  // instrument out in front of them at chest height.
  //
  // The next set landed it at (0.29, 1.06, 0.07) and that was still 15 cm above
  // the hand's own resting height, which does not sound like much and is the
  // whole of the "elbow changes side" report. The hand grips the neck from
  // behind — the fingers are the contact and the cuff is a hand's length back
  // along them — so a grip 15 cm high leaves the *wrist* barely a quarter of a
  // metre below the shoulder, and an arm folded to 0.55 of its reach has to
  // stand its elbow 23 cm off the shoulder→wrist line. That line is vertical, so
  // all 23 cm of it goes sideways: the elbow sat 26 cm behind the shoulder and
  // level with it, which is where a wing goes and not an elbow, and it swung the
  // whole way round to the front and back again every time the player stood down
  // and took up again.
  //
  // These put the grip within a centimetre of the hip at every height in the
  // cast — (0.39, 0.88, 0.15) at mean — with the arm at 0.88–0.93 of its reach
  // against a hanging arm's own 0.91, and the elbow 15 cm behind the shoulder and
  // 22 cm below it, which is the shape that arm has when it is holding nothing.
  // The lengths are unchanged by the turn above: the rotation is about the grip,
  // so it moves the instrument around the hand without moving the hand.
  violin: {
    pitch: 2.83, turn: -0.48, roll: 1.82,
    drop: 0.66, back: 0.15, across: -0.05, hands: [0.0, 0.85],
  },
};

/**
 * A model whose bow is held rather than parked, and can therefore be handed to
 * the hand that holds it.
 *
 * Structural, like `HasSoundingContact` in `instruments/index.ts` and for the
 * same reason: two of the **twenty-two** models have a bow and `InstrumentModel`
 * should not grow a member the other twenty must ignore. Three archetypes later
 * the numerator is unchanged — the violin and the cello are still the only bows
 * on the stage — and the denominator is twenty-five, so the members that would
 * have to ignore it are twenty-three. See `Animator.carryBow`, and `gallery.ts`,
 * which hands the bow over the same way so that a bench pose is a stage pose.
 */
export interface CarriesBow {
  carryBow(down: number, hand: Vector3): void;
}

/**
 * A correction to where a model says its own hands rest, in the model's own
 * frame and in metres.
 *
 * ## Why a second place is allowed to say this
 *
 * `instruments/types.ts` is firm that a model owns its geometry and that a
 * hand placed by anything else is a bug, and every word of that stands for a
 * *gesture*: a stick five centimetres off the snare misses it, and there is no
 * table anywhere that gets to say otherwise. This is the one point where the
 * argument does not carry, and the reason is that a rest contact is not
 * answering a question with a right answer. Where the fingers stop a string is
 * a fact about the instrument. Where a player's hands hang when they are not
 * playing is a **judgement**, and the model was never in a position to make it,
 * because it cannot see the body: the hand it is placing belongs to somebody
 * with a shoulder, an elbow and a reach, and half of what makes a rest look
 * wrong is an arm folded at 0.55 of its extension rather than the contact
 * being a centimetre out.
 *
 * The practical half matters too and is worth stating plainly rather than
 * dressing up. The twenty-five models derive their rest from twenty-five
 * different expressions — `contactAt(IDLE_X, FINGER_HEIGHT + 0.035, …)`,
 * a `restLeft` vector, `pluckAt(40, 0.05, 0.09)` — so tuning one meant opening
 * a file, working out which local constant was load-bearing and rebuilding,
 * per hand, per instrument, with the picture a stage away. Nobody did it, which
 * is why the poses are what they are. One table that the bench can write and
 * the show reads turns that into a slider.
 *
 * **Empty is the correct state, and the goal.** Every entry here is a model
 * that should eventually be corrected at source; the trim is where the answer
 * is found, not where it is meant to live forever. See `gallery.ts`, which
 * prints entries ready to paste.
 */
/**
 * One hand's correction: where it goes, and which way it is turned there.
 *
 * **Both, because a rest is a pose and not a point.** `position` fixes where a
 * palm is and says nothing about which way it faces, and half the faults worth
 * fixing here are the second kind — see the two commits before this one, `Hang
 * the flautist's hands under the flute, not on top of it` and `Turn the
 * flautist's left palm toward the player, not the room`. Neither of those moved
 * a hand a centimetre; both turned one over. A trim that could only translate
 * would have been unable to express either of the last two things anybody
 * actually wanted to change.
 */
export interface HandTrim {
  /** Metres in the model's own frame, added to `Contact.position`. */
  move?: readonly [number, number, number];
  /**
   * Radians, `XYZ`, turning `Contact.normal` and `Contact.along` — the way the
   * palm faces and the line the knuckles run along — in the model's own frame.
   *
   * The normal and the knuckle axis and not the position: a hand turning is a
   * hand turning *where it is*, which is what a wrist does. Anything that also
   * needs to move is two corrections and this table has room for both.
   */
  turn?: readonly [number, number, number];
}

export interface RestTrim {
  'left-hand'?: HandTrim;
  'right-hand'?: HandTrim;
  /** The bow hand, where the model answers it separately. */
  bow?: HandTrim;
}

export const REST_TRIM: Partial<Record<Archetype, RestTrim>> = {};

/**
 * Which trim a given effector reads.
 *
 * `resolve`'s own contract — omitted means the stopping hand — so an
 * unqualified ask takes the left hand's correction, and every effector that is
 * not a hand takes none. A mouth resting ten centimetres off a microphone
 * grille is the singer model's business and has never been the thing anyone
 * complained about.
 */
function trimFor(trim: RestTrim, effector: Effector | undefined): HandTrim | undefined {
  if (effector === 'right-hand') return trim['right-hand'];
  if (effector === 'bow') return trim.bow ?? trim['right-hand'];
  if (effector === undefined || effector === 'left-hand') return trim['left-hand'];
  return undefined;
}

/**
 * Wrap a model so its rest contacts read `REST_TRIM`.
 *
 * Applied in `buildInstrumentFor`, *after* `withSoundingContact`, so that the
 * bow and the right hand have already been routed to whichever contact is
 * theirs before either is corrected — otherwise a guitarist's picking-hand trim
 * would land on the fretting hand's answer.
 *
 * The lookup is inside the closure rather than captured at build time, and that
 * is deliberate rather than careless: the bench edits this table live and
 * expects the model standing in front of it to move. It costs one property
 * index on a rest resolve, which happens two or three times per player per
 * frame, and nothing at all on a gesture.
 *
 * `resolve`'s contract survives intact. This is pure, cheap, and constant for
 * the life of a number — the only thing that ever writes the table is a page
 * with no show running on it.
 */
export function trimRest(model: InstrumentModel): InstrumentModel {
  const inner = model.resolve.bind(model);
  model.resolve = (point, effector) => {
    const contact = inner(point, effector);
    if (!contact || point.kind !== 'rest') return contact;
    const trim = REST_TRIM[model.archetype];
    const d = trim && trimFor(trim, effector);
    if (!d || (!d.move && !d.turn)) return contact;
    const out: Contact = { ...contact };
    if (d.move) {
      out.position = contact.position.clone().add(SCRATCH.d.set(d.move[0], d.move[1], d.move[2]));
    }
    if (d.turn) {
      SCRATCH.e.set(d.turn[0], d.turn[1], d.turn[2], 'XYZ');
      out.normal = contact.normal.clone().applyEuler(SCRATCH.e);
      if (contact.along) out.along = contact.along.clone().applyEuler(SCRATCH.e);
    }
    return out;
  };
  return model;
}

const SCRATCH = {
  d: new Vector3(),
  q: new Quaternion(),
  e: new Euler(),
  local: new Vector3(),
  back: new Vector3(),
  dir: new Vector3(),
};

/**
 * Put a carried instrument where `ease` says, `down` of the way.
 *
 * `carryPos`, `carryQuat` and `carryPivot` are where the thing was staged and
 * the grip it turns about — read once, before anything has had a chance to move
 * it, and unchanged for the life of the number. `height` is this player's, for
 * the reason in `AtEasePose`.
 *
 * Turn about the grip, then move the grip. Expanding "rotate a rigid body about
 * a point that is not its origin" gives the position as the pivot plus the
 * rotated offset from it — which is the whole of the fix for an origin that
 * sits on the boards.
 */
export function lowerAtEase(
  root: Object3D, ease: AtEasePose, down: number, height: number,
  carryPos: Vector3, carryQuat: Quaternion, carryPivot: Vector3,
): void {
  root.position.copy(carryPos);
  root.quaternion.copy(carryQuat);
  if (down <= 0) return;
  SCRATCH.q.setFromEuler(SCRATCH.e.set(
    ease.pitch * down, (ease.turn ?? 0) * down, ease.roll * down, 'ZYX',
  ));
  root.quaternion.premultiply(SCRATCH.q);
  root.position.sub(carryPivot).applyQuaternion(SCRATCH.q).add(carryPivot);
  // The lengths against this player rather than against the one they were
  // measured on. An angle is the same on everybody; a drop is not, because
  // what it is being read against — the hip it ends at, the arm that has to
  // reach it — is a body. See `AT_EASE`.
  const size = down * height / NOMINAL_HEIGHT;
  root.position.y -= ease.drop * size;
  root.position.z -= ease.back * size;
  if (ease.across) root.position.x += ease.across * size;
}

/**
 * How far this hand has let go of the instrument, 0..1, given how far the
 * player has stood down.
 *
 * A flautist at ease is still holding the flute and a violinist is still
 * holding the violin by its neck, so those hands ride the instrument down
 * instead of setting off for a hip — see `AtEasePose.hands`. Everything with no
 * at-ease pose keeps the whole stand-down, which is the behaviour a guitarist
 * on a strap wants.
 *
 * `side` is 0 for the left hand and 1 for the right, matching `handSideOf`.
 */
export function letGo(ease: AtEasePose | undefined, down: number, side: number): number {
  if (down <= 0) return 0;
  const hands = ease?.hands;
  return hands ? down * (hands[side] ?? 1) : down;
}

/**
 * How far an at-ease hand may be pulled back to get out of the instrument.
 *
 * The body's own idle puts a standing player's hands a few centimetres in
 * front of their hips, which is where hands go and is *inside the key bed* for
 * anybody standing at a keyboard: measured, a synth player's right hand rests
 * 5 cm inside the model and an electric piano's left hand 8 cm. So an at-ease
 * hand backs up until it is clear of the thing it is standing at.
 *
 * Capped, and deliberately not a collision system. It resolves along one axis,
 * against one box, for players who are standing at something in front of them.
 * A seated pianist's hands land in their lap and a drummer's inside a cubic
 * metre of mostly air, and pulling either of those backwards would be worse
 * than the overlap — so neither is asked.
 */
export const KEEP_OUT_PUSH = 0.18;
/** Clearance to leave once out, so a hand does not graze the case. */
export const KEEP_OUT_MARGIN = 0.03;
/**
 * How far into the stand-down the escape reaches full strength.
 *
 * A hand that is still playing must never be pushed off what it is playing —
 * a contact sits on the surface and therefore inside the mesh's box — so the
 * correction ramps in rather than switching on. Short, because the first tenth
 * of a stand-down is also the last tenth of a note and neither wants to wait.
 */
export const KEEP_OUT_GATE = 0.10;
/** How far above and below the resting hands a part still counts, in metres. */
const KEEP_OUT_BAND = 0.28;

/**
 * The parts of an instrument that an at-ease hand could end up inside, each as
 * a box in the model's **own** frame.
 *
 * `Box3.setFromObject` cannot be used for any of this: it answers in world
 * space, and a world box of a turned model is already inflated before anything
 * else touches it. So each mesh's own geometry box is carried up through the
 * transforms *between that mesh and the model root* — the mesh's world matrix
 * with the root's taken back off — where everything is axis-aligned and tight.
 *
 * Then thrown away unless it is near the hands. That prune is what makes a
 * per-mesh test affordable at all, and it is honest rather than merely cheap:
 * a hand at ease sits at one height, and a cymbal a metre above it or a
 * pedalboard a metre below it can never be the thing it is inside.
 *
 * Once per performer per number, at bind time.
 */
/**
 * One mesh a hand may not idle inside.
 *
 * A mesh lathed from `CylinderGeometry` carries its taper too: the bounding box
 * of a tall frustum is a block the size of its fat end for the whole run, and a
 * harp's soundbox read that way covers the player's lap.
 */
export interface KeepOutPart {
  box: Box3;
  cone?: { toMesh: Matrix4; rTop: number; rBottom: number; halfH: number };
}

const CONE_Q = new Vector3();

function inCone(c: NonNullable<KeepOutPart['cone']>, local: Vector3): boolean {
  const q = CONE_Q.copy(local).applyMatrix4(c.toMesh);
  if (Math.abs(q.y) > c.halfH) return false;
  const r = c.rBottom + (c.rTop - c.rBottom) * ((q.y + c.halfH) / (2 * c.halfH));
  return Math.hypot(q.x, q.z) <= r;
}

export function keepOutParts(model: InstrumentModel, rig: PerformerRig): KeepOutPart[] | undefined {
  const root = model.root;
  root.updateWorldMatrix(true, true);
  const inv = new Matrix4().copy(root.matrixWorld).invert();

  // The band, from where this body's own hands actually come to rest.
  const left = rig.restPosition('left-hand', new Vector3()).applyMatrix4(inv);
  const right = rig.restPosition('right-hand', new Vector3()).applyMatrix4(inv);
  const lo = Math.min(left.y, right.y) - KEEP_OUT_BAND;
  const hi = Math.max(left.y, right.y) + KEEP_OUT_BAND;

  const parts: KeepOutPart[] = [];
  const rel = new Matrix4();
  root.traverse((o) => {
    const mesh = o as {
      isMesh?: boolean;
      geometry?: {
        type: string;
        parameters?: { radiusTop: number; radiusBottom: number; height: number };
        boundingBox: Box3 | null;
        computeBoundingBox(): void;
      };
      matrixWorld: Matrix4;
    };
    if (!mesh.isMesh || !mesh.geometry) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const g = mesh.geometry.boundingBox;
    if (!g) return;
    rel.multiplyMatrices(inv, mesh.matrixWorld);
    const box = g.clone().applyMatrix4(rel);
    if (box.isEmpty() || box.max.y < lo || box.min.y > hi) return;
    const p = mesh.geometry.parameters;
    const cone = mesh.geometry.type === 'CylinderGeometry' && p
      ? { toMesh: rel.clone().invert(), rTop: p.radiusTop, rBottom: p.radiusBottom, halfH: p.height / 2 }
      : undefined;
    parts.push(cone ? { box, cone } : { box });
  });
  return parts.length ? parts : undefined;
}

/**
 * Push a world point out of whatever part of the instrument it is inside.
 *
 * Applied to the *blended* position rather than only to the at-ease target,
 * which is the difference between guarding a destination and guarding a
 * journey. A cellist's right hand leaves the strings and arrives beside
 * their hip, and both ends are fine; the straight line between them goes
 * through the front of the cello, and it is on that line for the better part
 * of two seconds. Correcting only the endpoint left that untouched.
 *
 * `gate` is how far this hand has stood down, and it exists so that a hand
 * *playing* the instrument is never pushed off it. A contact is on the
 * surface by definition and often just inside a mesh's box; shoving it out
 * would be this file breaking the one invariant it has. It ramps in over the
 * first fraction of the stand-down, so there is no frame where it switches on.
 *
 * `rigQuat` is the player's world orientation, `modelQuatInv` the model's
 * inverted, and `modelInv` the model root's inverse world matrix — the same
 * conversion every cached contact goes through, so it is already correct for a
 * model that has been moved.
 */
export function escapeFrom(
  parts: readonly KeepOutPart[] | undefined, point: Vector3, gate: number,
  rigQuat: Quaternion, modelQuatInv: Quaternion, modelInv: Matrix4,
): Vector3 {
  if (!parts || gate <= 0) return point;
  const local = SCRATCH.local.copy(point).applyMatrix4(modelInv);

  // Out along the player's own backward, expressed in the instrument's frame.
  // Horizontal only: a hand pushed up goes into the keys and a hand pushed down
  // goes through the boards, and neither is an escape.
  const back = SCRATCH.back.set(0, 0, -1).applyQuaternion(rigQuat);
  const dir = SCRATCH.dir.copy(back).applyQuaternion(modelQuatInv);

  // The furthest any one part demands, so a hand between two of them leaves
  // both. Taking the first, or the nearest, moves it out of one and leaves it
  // in the next.
  let push = 0;
  for (let i = 0; i < parts.length; i++) {
    const { box, cone } = parts[i]!;
    if (!box.containsPoint(local)) continue;
    if (cone && !inCone(cone, local)) continue;
    let exit = Number.POSITIVE_INFINITY;
    if (Math.abs(dir.x) > 1e-6) {
      exit = Math.min(exit, (dir.x > 0 ? box.max.x - local.x : box.min.x - local.x) / dir.x);
    }
    if (Math.abs(dir.z) > 1e-6) {
      exit = Math.min(exit, (dir.z > 0 ? box.max.z - local.z : box.min.z - local.z) / dir.z);
    }
    if (Number.isFinite(exit) && exit > push) push = exit;
  }
  if (push <= 0) return point;

  // Capped rather than guaranteed. Some instruments wrap further round their
  // player than a hand can back out of, and half a metre of reversing would put
  // the hands behind the body, which is a worse picture than a hand brushing
  // the thing it belongs to.
  const ramp = gate < KEEP_OUT_GATE ? gate / KEEP_OUT_GATE : 1;
  return point.addScaledVector(back, Math.min(push + KEEP_OUT_MARGIN, KEEP_OUT_PUSH) * ramp);
}

/**
 * How close two idle answers have to be before the runtime decides the model
 * gave it one answer twice rather than two answers that happen to be near.
 *
 * Deliberately tiny. The condition being detected is not "these hands are
 * close", it is "this model ignored the `effector` parameter and built the same
 * contact twice", which comes back as the identical floats and a distance of
 * exactly zero. Four millimetres is slack for two separately constructed
 * vectors and nothing else.
 *
 * A larger threshold would be the more *helpful*-looking number and would be
 * wrong: an instrument whose two hands genuinely sit two centimetres apart has
 * an opinion, and overriding it puts a flautist's hands on the wrong sides of
 * the tube. Every string model has answered per hand since `withSoundingContact`
 * and every wind, brass and free-reed model now does too, so the set this
 * catches is exactly the models that never needed to choose — a drum is struck
 * where it is struck.
 */
export const COINCIDENT = 0.004;

/**
 * How far a hand is pulled from the model's rest toward the part of the
 * instrument that hand actually plays, when the model gave one answer for both.
 *
 * This is the other half of "the drummer's hands are on top of each other", and
 * the half that makes the result look deliberate rather than merely
 * non-overlapping. A drum kit's `rest` is one point in front of the drummer;
 * pushing two hands apart from it puts them somewhere neither of them plays. But
 * the runtime already knows where each hand plays — it has been resolving that
 * hand's contacts all number — so the mean of them is available for free, and it
 * is exactly "over the part of it that hand plays": the left stick hovers over
 * the snare and hats, the right over the ride and toms.
 */
export const ZONE_PULL = 0.75;

/** How far a hand hovers off a surface it plays but is not playing now, metres. */
export const IDLE_HOVER = 0.05;
