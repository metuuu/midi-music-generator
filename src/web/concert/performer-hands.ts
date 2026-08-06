/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Hands, which are most of what an audience actually watches.
 *
 * The art direction deletes the hard problem — a hand is *placed*, so there is
 * no IK solution to find and nothing to put through the ribs; the arm that
 * `performer-arms.ts` fits afterwards is downstream of this and never argues
 * with it — but it does not delete the *interesting* one. A hand placed on a
 * snare and shaped like a starfish still reads as a bug. So the position comes
 * from the instrument model and the **shape comes from here**: a fist around a
 * stick, a flat palm on a key bed, fingers spread across a fretboard.
 *
 * Eighteen poses, blended rather than switched. A pose is nine numbers — four
 * finger curls, a second-joint fold, a splay, two thumb values and a palm
 * arch — so blending two poses is `lerp` on each, and asking for "halfway to a
 * fist" is a meaningful request rather than a special case. Two hands never
 * snap between shapes; they ease over about a tenth of a second, which is
 * roughly what a real hand does and is short enough that a sixteenth-note
 * passage still reads.
 *
 * ## Three things on top of the pose, and why they are not poses
 *
 * **The wrist follows the arm.** A placed hand takes its whole orientation from
 * the contact normal, which leaves the wrist perfectly square to the instrument
 * whatever the body is doing. `setWrist` breaks it toward the forearm — an
 * imaginary one when this was written, the drawn one now. That cannot be a pose,
 * because it changes for a reason the pose knows nothing about: where the hand
 * happens to have been put.
 *
 * The traffic runs the other way too, and `HandPose.align` is that direction: a
 * bow hold *demands* a straight wrist, which is a demand about the elbow, so the
 * shape states it and the arm obeys. A shape may say how the arm has to arrive.
 * It may not say where the hand is.
 *
 * **The two hands are never identical.** Each carries a fixed, tiny `HandBias`
 * drawn from the performer's id, so "both hands to `stick`" produces two
 * slightly different hands rather than one hand and its mirror. That also
 * cannot be a pose, because it must survive every pose.
 *
 * **The fingers play the note.** A pose is the shape of the *job*, held for as
 * long as the player is doing it: a saxophonist's hands are `wrap` from the
 * first bar to the last. What they are not is still, and until `setFingers`
 * they were — one frozen curve over a horn whose twelve pads were reconfiguring
 * underneath it, which is the "played completely wrong" this channel exists to
 * answer. It cannot be a pose either, and for the plainest of the three
 * reasons: there are as many fingerings as there are notes, and a named table
 * of shapes is a vocabulary rather than a keyboard. So the fingering comes from
 * the instrument, as `Contact.fingers`, and lands here as four closures added
 * on top of whatever `curl` the shape asked for. See `FINGER_THROW`.
 *
 * ## Why the fingers are cheap
 *
 * Each bone is one mesh, not a group holding a mesh. The shared `bone` geometry
 * has its origin at the base rather than the centre, so the mesh *is* the
 * pivot: a knuckle is `rotation.x` and the next bone is a child at `y = 1`.
 * That halves the object count of a hand, and object count is the budget that
 * actually binds when six of these are on stage.
 *
 * Everything articulated is uniformly scaled. A finger inherits its parent's
 * scale, and a non-uniform parent would shear every rotated child — a hand
 * flattened in `y` with skewed fingers is the exact failure this rule exists to
 * prevent. The palm, which has no children, is free to be squashed.
 */

import { Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';

import type { Archetype } from '../../concert/types.js';

import { Leases, bone, collar, orb, pip, rod, surface } from './performer-assets.js';
import type { Proportions } from './performer-look.js';

/** The named shapes. Anything outside this list is a blend of two of them. */
export type HandPoseId =
  | 'relax'   // hanging, fingers loosely curled. The default idle.
  | 'fist'    // closed on nothing — a clenched hand, and rarely what you want
  | 'grip'    // round a cylinder: a mic, a bass neck, a trombone slide
  | 'stick'   // a matched grip: index and thumb pinch, the other three wrap
  | 'bowhold' // draped over a frog, thumb bent underneath
  | 'flat'    // fingers straight and together — a palm mute, a wave
  | 'keys'    // curved and slightly spread, over a key bed
  | 'press'   // one finger down on a key, the rest lifted
  | 'reach'   // stretched across a chord: thumb and little finger at the ends
  | 'spread'  // splayed, stopping strings on a fretboard
  | 'strap'   // flat under an accordion's bass strap, fingers on the buttons
  | 'pluck'   // thumb and index pinched, the rest folded
  | 'point'   // index out; a cue, a count-in
  | 'open'    // fingers straight and fanned — a singer's free hand
  | 'wrap'    // round a vertical tube, fingertips on the far face of it
  | 'arch'    // over a tube held sideways, thumb underneath
  | 'valve'   // three fingertips on three buttons, thumb under the leadpipe
  | 'cupped'; // a shell round the end of a harmonica

export interface HandPose {
  /** Fold at the knuckle, index to little, 0 straight .. 1 into the palm. */
  curl: [number, number, number, number];
  /** Fold at the second joint, applied to all four. */
  tip: number;
  /** Fan, 0 together .. 1 splayed. */
  spread: number;
  thumbCurl: number;
  /** 0 tucked alongside the index .. 1 fully abducted. */
  thumbOut: number;
  /** Palm arch. A cupped palm is what makes a grip read as holding something. */
  cup: number;
  /**
   * Wrist pitch. **Negative lifts the fingers, positive drops them.**
   *
   * Stated by what it does rather than by an "up/down" that has to be resolved
   * against three.js's rotation sense every time it is read: `flex.rotation.x`
   * is positive, and a positive rotation about `+x` sends the fingers, which
   * are `+z`, toward `-y`. So a pianist's hand over a keybed is positive and a
   * fretting hand reaching up at a neck is negative.
   */
  wrist: number;

  /**
   * Which part of the hand the instrument's contact belongs under: **0 the
   * palm, 1 the fingertips.**
   *
   * A `Contact` says where the hand *touches*, and until this existed the rig
   * answered that with the centre of the palm for every pose. On anything
   * played with the fingers that is out by the length of a finger: at adult
   * scale the pad of an index finger sits about nine centimetres ahead of the
   * palm's centre and three below it, so a pianist's palm lay on the keys with
   * the fingers hanging past the far edge of them, a saxophonist's palm sat on
   * the key stack, and a guitarist's fretting hand covered the fret it was
   * supposed to be stopping instead of resting a finger on it. That is the
   * "palm fisting the precision areas" the report names.
   *
   * It cannot be one rule for every hand, which is why this is a pose field
   * rather than a constant in the rig. A hand closed round a stick, a
   * microphone or a trombone slide really does meet the instrument at the
   * palm — its fingertips are curled back *under* it — and moving that hand
   * onto its fingertips would take the fist off the thing it is holding. So
   * each shape says which part of itself does the work, and `buildHand` solves
   * for where that part actually is.
   */
  touch: number;

  /**
   * For a hand holding an implement: **how far out along it the contact runs.**
   * 0 is the hand's own `touch` point, 1 the working end — a stick's bead, a
   * mallet's ball. Ignored entirely by a hand holding nothing.
   *
   * This is `touch` continued past the fingers, and it exists for the same
   * reason: the rig places a hand by the part of it that meets the instrument,
   * and for a drummer that part is twenty-eight centimetres beyond the fist.
   * With no such field the palm went to the snare and the stick — once there
   * was one — went through it.
   *
   * A separate number rather than `touch: 1.4`, because the two ends of the
   * scale answer to different things. `touch` is a fact about the shape of the
   * hand and is true whether or not it is carrying anything; this one is a
   * fact about whether the shape is *aiming* the thing it holds. Only `stick`
   * says yes, so a drummer standing down — whose hands ease toward `relax` —
   * eases the aim off at the same rate, and the sticks go from working to
   * merely held without a second timer to keep in step.
   */
  tool: number;

  /**
   * How much this shape dictates where the arm is: **0 the elbow hangs wherever
   * it falls, 1 the wrist stays straight and the elbow goes wherever that puts
   * it.**
   *
   * The third of the family `touch` and `tool` started, and the same kind of
   * fact: where the hand meets the world, how far past itself it works, and now
   * how the arm has to arrive. All three belong to the shape rather than to the
   * instrument, which is what makes them pose fields — a bow hold is a bow hold
   * on a violin or a cello, and its wrist is straight either way.
   *
   * The number is a claim about technique, so it is worth saying which technique
   * each one is. `bowhold` is the whole reason the field exists: a bow arm's
   * wrist is straight, the forearm continues the back of the hand, and the elbow
   * lifts out behind the frog to make that true — an elbow left to hang there
   * instead has to break the wrist to reach, which is the single thing a bow arm
   * may not do. A pianist's forearm is level with the back of the hand and an
   * accordionist's runs straight in behind the bass strap, so those insist too,
   * though less. A hand hanging at rest insists on nothing at all, and neither
   * does a fist: there is no such thing as the correct elbow for a clenched
   * hand.
   *
   * `performer-arms.ts` reads it, blends the two elbows it implies, and scales
   * the whole thing by whether the hand is actually working — technique is
   * something a player does to an instrument, not a posture they hold all
   * evening.
   */
  align: number;
}

/**
 * The vocabulary. Eighteen shapes, and the ones added last are always the ones
 * the earlier list was quietly approximating.
 *
 *  - **`fist` is not how anyone holds a stick.** A matched grip has the stick
 *    running across the first joint of the index and held against the thumb
 *    pad; the other three fingers wrap it loosely and do most of the rebound.
 *    A drummer with two clenched fists reads as someone about to hit the kit
 *    rather than someone playing it, and that is what was on stage.
 *  - **A bow hold is not a grip.** The hand hangs off the frog — thumb bent
 *    underneath, fingers draped over, little finger curved on top — and the
 *    difference between that and a closed fist around a stick is most of what
 *    a string player's right hand looks like.
 *  - **An accordion's left hand holds nothing at all.** It is behind a strap,
 *    flat against the casing, and only the fingers move onto the buttons. It
 *    was `grip`, which is the shape for a microphone, and it made the bass
 *    hand look like it was strangling the instrument.
 *  - **`press` is one finger, not five.** A whole hand at `keys` descending on
 *    a key is a hand playing a cluster.
 *  - **`keys` is not a wind instrument.** It is a hand hovering flat over a
 *    horizontal bed with the thumb abducted out to the side to play notes with,
 *    and it was on the saxophone, the clarinet, the flute and the trumpet — four
 *    instruments with no bed, no horizontal and no thumb that plays anything.
 *    Every one of them is instead partly *held* by its thumbs, which is what
 *    `wrap`, `arch` and `valve` are mostly about; see each.
 */
export const HAND_POSES: Record<HandPoseId, HandPose> = {
  relax: { curl: [0.34, 0.40, 0.43, 0.46], tip: 0.50, spread: 0.18, thumbCurl: 0.30, thumbOut: 0.35, cup: 0.25, wrist: -0.06, touch: 0.35, tool: 0.00, align: 0.00 },
  fist: { curl: [1.00, 1.00, 1.00, 1.00], tip: 1.00, spread: 0.00, thumbCurl: 0.55, thumbOut: 0.12, cup: 0.65, wrist: 0.00, touch: 0.00, tool: 0.00, align: 0.00 },
  grip: { curl: [0.72, 0.76, 0.76, 0.72], tip: 0.86, spread: 0.05, thumbCurl: 0.34, thumbOut: 0.58, cup: 0.48, wrist: 0.00, touch: 0.00, tool: 0.00, align: 0.25 },
  /**
   * The one shape in the table that is *working* something rather than merely
   * closed on it — see `HandPose.tool`. Everything else holds at 0, including
   * `grip` and `bowhold`, whose instruments meet the world at the hand itself.
   *
   * Its `wrist` is flat, and that is a decision rather than an omission: this
   * is the one pose whose attitude is already being set by something else.
   * `followForearm` pitches a drummer's hand about twenty degrees down at the
   * kit all by itself — the shoulder is above and behind the hand and the wrist
   * breaks to meet it — and that is exactly the angle a stick should make with
   * a head. Anything asked for here would be added to it. See `IMPLEMENT_AIM`.
   */
  stick: { curl: [0.58, 0.78, 0.86, 0.92], tip: 0.80, spread: 0.06, thumbCurl: 0.44, thumbOut: 0.28, cup: 0.58, wrist: 0.00, touch: 0.00, tool: 1.00, align: 0.40 },
  /**
   * `align` is 0.30 and it was 1.00, which is the number a bow hold deserves and
   * cannot have here.
   *
   * The straight wrist is real and the elbow that follows from it is not: both
   * bowed models pin the hand's roll off `Contact.along`, the bow stick, and the
   * axis that comes out of that runs *up* out of the back of a cellist's hand.
   * Asked for in full, the arm turned its bend to match and drew an elbow level
   * with the shoulder with the forearm hanging vertically out of it — which is
   * the broken wrist this field exists to prevent, arrived at from the other
   * side. At 0.30 the fall keeps the bow elbow down and near the ribs, where a
   * cellist's is, and the hand leans the last of the way.
   *
   * The honest fix is in the models: a bow contact whose `along` faces the other
   * way would give an axis an arm can follow, and would also reverse the stroke.
   * See `REACH_MIN` in `performer-arms.ts`, which catches the violin's version
   * of the same disagreement.
   */
  bowhold: { curl: [0.44, 0.52, 0.60, 0.70], tip: 0.60, spread: 0.24, thumbCurl: 0.68, thumbOut: 0.42, cup: 0.34, wrist: -0.12, touch: 0.00, tool: 0.00, align: 0.30 },
  flat: { curl: [0.00, 0.00, 0.00, 0.00], tip: 0.00, spread: 0.02, thumbCurl: 0.00, thumbOut: 0.22, cup: 0.00, wrist: 0.00, touch: 0.35, tool: 0.00, align: 0.30 },
  keys: { curl: [0.42, 0.46, 0.46, 0.44], tip: 0.56, spread: 0.32, thumbCurl: 0.18, thumbOut: 0.62, cup: 0.30, wrist: 0.10, touch: 1.00, tool: 0.00, align: 0.55 },
  press: { curl: [0.66, 0.28, 0.30, 0.32], tip: 0.74, spread: 0.26, thumbCurl: 0.20, thumbOut: 0.56, cup: 0.34, wrist: 0.14, touch: 1.00, tool: 0.00, align: 0.55 },
  /**
   * A hand opened out across a chord.
   *
   * Not `spread`, which is the fretting shape and lifts the fingers at the
   * wrist to reach up at a neck; this one keeps the pianist's flat wrist and
   * opens sideways. The tell is the thumb: a hand taking a tenth abducts it
   * completely and *straightens the fingers*, because a curled finger is a
   * shorter finger and the span is the whole problem. The palm flattens out of
   * its arch for the same reason.
   */
  reach: { curl: [0.20, 0.24, 0.25, 0.22], tip: 0.24, spread: 1.00, thumbCurl: 0.06, thumbOut: 1.00, cup: 0.06, wrist: 0.08, touch: 1.00, tool: 0.00, align: 0.55 },
  spread: { curl: [0.30, 0.36, 0.38, 0.34], tip: 0.34, spread: 1.00, thumbCurl: 0.10, thumbOut: 0.86, cup: 0.10, wrist: -0.16, touch: 1.00, tool: 0.00, align: 0.45 },
  strap: { curl: [0.50, 0.58, 0.56, 0.48], tip: 0.68, spread: 0.22, thumbCurl: 0.22, thumbOut: 0.08, cup: 0.14, wrist: 0.24, touch: 0.85, tool: 0.00, align: 0.50 },
  pluck: { curl: [0.84, 0.54, 0.60, 0.66], tip: 0.90, spread: 0.10, thumbCurl: 0.70, thumbOut: 0.50, cup: 0.52, wrist: 0.00, touch: 1.00, tool: 0.00, align: 0.30 },
  point: { curl: [0.00, 1.00, 1.00, 1.00], tip: 1.00, spread: 0.00, thumbCurl: 0.60, thumbOut: 0.18, cup: 0.55, wrist: 0.00, touch: 1.00, tool: 0.00, align: 0.35 },
  open: { curl: [0.05, 0.05, 0.08, 0.10], tip: 0.05, spread: 0.76, thumbCurl: 0.00, thumbOut: 0.82, cup: 0.00, wrist: -0.10, touch: 0.80, tool: 0.00, align: 0.10 },
  /**
   * Round a vertical tube, fingertips over the far face of it, thumb behind.
   *
   * A saxophone and a clarinet, both hands, and the shape it replaces was
   * `keys`. On a saxophone there is no key bed and no side to hold a thumb out
   * to: the tube is near vertical, the pearls are on the face of it aimed at
   * the house, the fingers come *round* it to reach them, and the thumbs are
   * the only two digits behind the horn — the right hooked under its rest
   * carrying most of the weight, the left flat on the octave touch.
   * `thumbOut: 0.14` against `keys`' 0.62 is the single biggest number in this
   * entry: a saxophonist's thumbs point at their own chest.
   *
   * `spread` is the other half, 0.10 where `keys` is 0.32. Piano fingers fan
   * across a bed; these are stacked in a column down the tube, one behind the
   * next, and the rig's own knuckle spacing nearly gets there unaided — `0.46 R`
   * is 32 mm on a mean player against a tenor's 41 mm stations, so a tenth of
   * the splay closes the rest of it. Fanned any further the hand reads as laid
   * *across* the keywork rather than on it, which is the other thing that was
   * wrong with borrowing a pianist's shape.
   *
   * The wrist barely breaks. It cannot do much on this instrument: the contact
   * normal already turns the palm to face the tube and the arm arrives on its
   * own side of it, so what is left for the pose to say is that the knuckles
   * ride a shade above the pearls and the fingers hook down onto them.
   */
  wrap: { curl: [0.54, 0.58, 0.60, 0.64], tip: 0.72, spread: 0.10, thumbCurl: 0.45, thumbOut: 0.14, cup: 0.52, wrist: 0.05, touch: 1.00, tool: 0.00, align: 0.35 },
  /**
   * Arched over a tube held sideways, thumb underneath taking the weight.
   *
   * The flute, both hands — and the two hands of a flautist are famously *not*
   * alike. The left comes from behind with the forearm supinated hard and the
   * fingers reaching away from the player; the right stands over the tube from
   * in front with the fingers curling back toward it. That difference is real,
   * and it is deliberately not in this table: `flute.ts` already mirrors
   * `Contact.along` per hand and the rig derives the finger direction from
   * `along × normal`, so the roll arrives from the geometry. A second pose
   * asserting the same thing could only ever disagree with it, and the field
   * that would have to carry it — `wrist` — is a pitch and not a roll, so it
   * could not carry it anyway.
   *
   * What a flute needs from the *shape* is what both its hands share and no
   * other instrument here does. The fingers come straight down onto a row of
   * cups from above, so they are flatter than `wrap`'s and far flatter than
   * `grip`'s; the thumbs are *under* the tube rather than opposing the fingers
   * across it, so `thumbOut` is nearly nothing; and the palm is a shallow arch
   * rather than a cup, because there is nothing to close round. A flute is
   * balanced on three points, not held, and a hand that looked like it had hold
   * of one would be the wrong instrument.
   */
  arch: { curl: [0.40, 0.44, 0.46, 0.50], tip: 0.58, spread: 0.14, thumbCurl: 0.20, thumbOut: 0.08, cup: 0.22, wrist: 0.14, touch: 1.00, tool: 0.00, align: 0.40 },
  /**
   * Three fingertips standing on three buttons, thumb hooked under the
   * leadpipe.
   *
   * The trumpet's right hand. `keys` was the nearest thing in the table and
   * still wrong in the way that shows: a pianist's thumb is abducted out to
   * play notes with, and a trumpeter's thumb plays nothing whatever. It goes
   * *under* the leadpipe, between the pipe and the first casing, opposite the
   * fingers — and it is half of what holds a trumpet up, the left hand round the
   * casing block being the other half.
   *
   * `spread` goes the other way from `wrap`'s and further than `keys`', to
   * 0.44. The valve buttons are 47 mm apart down the horn where these knuckles
   * sit about 32 mm apart, so the hand has to open out along the casing block
   * to stand on all three at once — the one blown instrument here whose keys
   * are *wider* apart than the fingers that play them.
   *
   * The little finger is curled further than the other three and articulates
   * not at all. It is not on a button: it rests over the hook and stays there,
   * which is why `trumpet.ts` hands it the neutral 0.5.
   */
  valve: { curl: [0.46, 0.48, 0.50, 0.60], tip: 0.66, spread: 0.44, thumbCurl: 0.32, thumbOut: 0.20, cup: 0.34, wrist: 0.06, touch: 1.00, tool: 0.00, align: 0.45 },
  /**
   * Two hands closed into a shell round the ends of a harmonica.
   *
   * `grip` was near enough to survive a long time, and it is a fist round a
   * cylinder: fingers folded hard, thumb well out to the side. A harmonica is
   * not gripped. It is *cupped* — the harp pinched between the left thumb and
   * the side of the left index, the fingers of both hands closing behind it
   * into a chamber the player opens and shuts for the wah. So the fingers
   * barely fold, the thumbs run alongside them rather than out, and the palm
   * takes the deepest arch in the table, because here the arch is the
   * instrument's resonating volume rather than a detail of a grip.
   *
   * `spread` is the only zero in the table and that is the point: a cup with
   * gaps in it is a pair of hands waving.
   *
   * `touch` stays at 0 exactly as `grip` had it, which is a decision and not an
   * inheritance. `harmonica.ts` measures its contacts to land the *palm's
   * surface* on the end plate — see `GRIP_X` there, which is `0.19 R` inside it
   * for precisely this reason — so a shape that met the world at its fingertips
   * would take both hands a finger's length off the harp, which is the bug that
   * file already fixed once.
   */
  cupped: { curl: [0.40, 0.44, 0.46, 0.48], tip: 0.52, spread: 0.00, thumbCurl: 0.24, thumbOut: 0.10, cup: 0.85, wrist: -0.05, touch: 0.00, tool: 0.00, align: 0.20 },
};

/**
 * What each archetype's hands do when nothing else is asked of them.
 *
 * A `Record` over the frozen union rather than a lookup with a default, for the
 * same reason `ARCHETYPE_OF` is: a new archetype should fail the build here
 * rather than arrive on stage with starfish hands. Left and right differ
 * wherever the instrument is asymmetric, which is most of them — a guitarist's
 * left hand is spread across a fretboard and their right is picking.
 *
 * ## "This hand is holding something" is load-bearing outside this file
 *
 * `animate.ts` reads this table to decide which hands are *holding* something,
 * which is what lets it blend a bowed player's right hand toward `pluck` for a
 * pizzicato section and leave every other hand alone. That test used to be an
 * equality against `grip`, so a default changed away from `grip` silently lost
 * the blend — which is why the violin and cello right hands sat in a closed
 * fist long after `bowhold` existed to describe them.
 *
 * It is `HOLDING_POSES` over there now, a named set with `bowhold` in it, so
 * the favour is no longer owed and the two string players hold their bows the
 * way a bow is held: draped off the frog, thumb bent underneath, little finger
 * curved on top. A fist round a bow is the single most visible thing wrong with
 * a string player, because the bow arm is the one an audience watches.
 */
export const DEFAULT_HAND_POSES: Record<Archetype, { left: HandPoseId; right: HandPoseId }> = {
  drumkit: { left: 'stick', right: 'stick' },
  /**
   * `flat`, and this is the one archetype where the pose *is* the instrument's
   * identity. A hand drum is played with the palm and the fingertips — a
   * percussionist holding two invisible sticks over a darbuka would read as a
   * drummer whose kit had been taken away. `flat` also puts `tool` at zero, so
   * the hand is placed by the hand rather than by the end of something it is
   * holding, which is exactly right when the skin is struck by the hand itself.
   */
  handdrum: { left: 'flat', right: 'flat' },
  'grand-piano': { left: 'keys', right: 'keys' },
  'electric-piano': { left: 'keys', right: 'keys' },
  organ: { left: 'keys', right: 'keys' },
  synth: { left: 'keys', right: 'keys' },
  accordion: { left: 'strap', right: 'keys' },
  harmonica: { left: 'cupped', right: 'cupped' },
  'acoustic-guitar': { left: 'spread', right: 'pluck' },
  'electric-guitar': { left: 'spread', right: 'pluck' },
  'upright-bass': { left: 'spread', right: 'pluck' },
  'electric-bass': { left: 'spread', right: 'pluck' },
  harp: { left: 'pluck', right: 'pluck' },
  sitar: { left: 'spread', right: 'pluck' },
  violin: { left: 'spread', right: 'bowhold' },
  cello: { left: 'spread', right: 'bowhold' },
  mallets: { left: 'stick', right: 'stick' },
  /**
   * The blown family, which was six archetypes borrowing two shapes that
   * describe neither a horn nor a hand on one.
   *
   * `keys` — a pianist's — was on the saxophone, the clarinet, the flute and
   * the trumpet's fingering hand, and `wrap`, `arch` and `valve` are what those
   * four actually are; each entry in `HAND_POSES` says how it differs and why
   * it had to. The harmonica's `grip` was a fist round a microphone and is now
   * `cupped`.
   *
   * The trombone keeps `grip` on both hands, and that is the one entry here
   * left alone on purpose. A trombonist's right hand really is closed round a
   * slide brace and their left really is closed round the bell tube — a rod and
   * a pipe, which is what `grip` is for. Both contacts in `trombone.ts` are
   * measured against `grip`'s `touch: 0` besides, so there is nothing to gain
   * and a hand's length to lose. It is also the one blown instrument with
   * nothing to finger, which is why it is the one with no `Contact.fingers`.
   */
  trumpet: { left: 'grip', right: 'valve' },
  trombone: { left: 'grip', right: 'grip' },
  saxophone: { left: 'wrap', right: 'wrap' },
  clarinet: { left: 'wrap', right: 'wrap' },
  flute: { left: 'arch', right: 'arch' },
  // A singer's hands are free, and that is most of what a singer's body says.
  singer: { left: 'relax', right: 'open' },
  /**
   * `relax` on both, where the soloist gets one of each — and the asymmetry is
   * exactly what a group must not have.
   *
   * A singer's open right hand is a gesture: it is the hand that comes up on a
   * held note, and it reads as *this person is performing*. Three or four people
   * doing it at once, at the same moment, off the same gesture stream, is a
   * chorus line rather than a group — the one place on this stage where four
   * copies of a good idea is worse than four copies of a plain one. A vocal
   * group stands still and sings, hands down, and the whole of the movement is
   * in the faces. So both hands take the quiet pose.
   */
  'vocal-group': { left: 'relax', right: 'relax' },
};

// ---------------------------------------------------------------------------
// Things the hands hold
// ---------------------------------------------------------------------------

/**
 * Something a hand *works with* rather than merely holds.
 *
 * The distinction is where the instrument gets touched, and it is the whole
 * reason this is in the hand rather than in the instrument model. A microphone,
 * a bass neck and a trombone slide are held, and the hand itself is the contact;
 * a violin's bow is held, and the *model* owns it because the bow lies on the
 * strings whether or not anybody is holding it. A drumstick is neither. It has
 * no resting place on the kit — a stick that is not in a hand is a stick on the
 * floor — and the drum is struck twenty-eight centimetres past the fist.
 *
 * So the hand carries it, and the hand reports its working end as the point the
 * rig should place. Two archetypes, and the eye goes straight to both of them:
 * the drummer's hands were bare fists landing on the heads, and the vibraphone
 * was being played by somebody patting it.
 */
export type HeldImplement = 'drumstick' | 'mallet';

/**
 * Which archetypes put something in the player's hands.
 *
 * Partial, unlike `DEFAULT_HAND_POSES`, and the asymmetry is deliberate: every
 * archetype needs a hand shape, so a missing entry there is a bug worth a
 * compile error, while holding nothing is what twenty of the twenty-two do and
 * a table of twenty `undefined`s would say nothing.
 */
export const IMPLEMENT_OF: Partial<Record<Archetype, HeldImplement>> = {
  drumkit: 'drumstick',
  mallets: 'mallet',
};

/**
 * One implement, in hand radii — because a stick has to look right *in the
 * hand that is holding it* and these hands are deliberately oversized.
 *
 * The lengths are honest metres, though: a 5A is 40 cm whoever picks it up, and
 * at `handR = 0.04 × height` that is what `length` works out to on a player of
 * mean height. The thicknesses are the compromise. Scaled truthfully against a
 * cartoon palm a drumstick would be an inch across, so these sit between the
 * real ratio and the real millimetre and read as sticks either way.
 */
interface ImplementSpec {
  /** Butt to working end. */
  length: number;
  /** Where the fulcrum sits along it: 0 the butt, 1 the working end. */
  grip: number;
  /** Shaft diameter at the butt. `rod` tapers it toward the tip. */
  thick: number;
  /** Radius of the bead or ball on the end. */
  bead: number;
  shaft: string;
  head: string;
  /** The head's finish — lacquered hickory and wound yarn are not alike. */
  headRough: number;
}

const IMPLEMENTS: Record<HeldImplement, ImplementSpec> = {
  /**
   * Hickory, a third of the way up from the butt, acorn tip — and now really a
   * third, where it used to say 0.28 and mean a shade over a quarter.
   *
   * The fulcrum is where a drummer's grip *is*, so it was worth correcting on
   * its own, but it also pays for itself twice over: everything in front of it
   * is reach the rig spends parking the fist behind the contact, so a couple of
   * centimetres moved behind the hand is a couple of centimetres the fist does
   * not have to take out of the drummer's own chest. See `IMPLEMENT_AIM`.
   */
  drumstick: {
    length: 5.60, grip: 0.33, thick: 0.24, bead: 0.16,
    shaft: '#c6a068', head: '#c6a068', headRough: 0.45,
  },
  /** Rattan and wound yarn, held nearer the butt and much softer on the end. */
  mallet: {
    length: 5.40, grip: 0.24, thick: 0.17, bead: 0.23,
    shaft: '#d8c191', head: '#3f5f9e', headRough: 0.96,
  },
};

/**
 * Where the shaft crosses the hand and which way it runs, in the hand's own
 * frame — palm in the `xz` plane facing `-y`, fingers along `+z`.
 *
 * A matched grip lies diagonally: in at the heel of the hand on the little
 * finger's side, out between the thumb pad and the first joint of the index. So
 * the fulcrum sits **against the underside of the palm** rather than in the
 * middle of it, and the aim runs mostly forward with a lean toward the thumb
 * (`x` is signed by the side, which is what makes a drummer's two tips converge
 * rather than run parallel) and only a little way down.
 *
 * **A stick barely leaves the palm's plane, and that is the whole of the fix.**
 * The shaft used to run a third of a right angle below it, which is roughly the
 * angle a stick makes with a *drum head* — and it is why nobody was holding
 * one and why every stick pointed at the floor. Both follow from the same
 * mistake: the aim is written in the hand's frame, so an angle put here is an
 * angle between the stick and the palm, not between the stick and the drum.
 *
 * What it cost, in order. A shaft at thirty degrees to a palm this size has to
 * enter the hand somewhere and leave it somewhere: it went in through the back
 * of the wrist and out through the middle of the palm's underside, in front of
 * the fingers, so the stick was skewered through the fist rather than gripped
 * by it, with four fingers curled shut under it round nothing. And it stacked:
 * the hand is *already* pitched at the kit by `followForearm`, about twenty
 * degrees of it at a snare, because the shoulder is above and behind the hand
 * and the wrist breaks to meet it. Thirty more on top left a stick stabbing
 * down at half a right angle from a hand that was not aligned with it.
 *
 * So the angle at the drum is the *arm's*, and it is left to the arm. What is
 * here is the five degrees a matched grip really has, and the fulcrum sits
 * against the underside of the palm at the little-finger side of the heel so
 * that the shaft runs along the palm and out through the curled fingers between
 * the thumb pad and the first joint of the index, which is where a stick goes.
 *
 * The lean across is untouched at twenty degrees, because it answers to
 * something else: `x` is signed by the side, so it is what makes a drummer's
 * two tips converge rather than run parallel, and it is also most of the
 * clearance the fists have. The rig places a hand by the end of what it holds,
 * so this direction is where the fist ends up — a stick straight out of the
 * knuckles would park the hand a stick's length back along the kit's own
 * forward, and a snare sits between the player's knees by definition.
 */
const IMPLEMENT_AT = { x: 0.25, y: -0.54, z: 0.15 } as const;
const IMPLEMENT_AIM = { x: 0.34, y: -0.09, z: 0.94 } as const;

/** `rod` and `bone` both run along `+y`; this is what aims one somewhere else. */
const UP = new Vector3(0, 1, 0);

export function blendPoses(a: HandPose, b: HandPose, t: number): HandPose {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  const mix = (x: number, y: number): number => x + (y - x) * k;
  return {
    curl: [
      mix(a.curl[0], b.curl[0]), mix(a.curl[1], b.curl[1]),
      mix(a.curl[2], b.curl[2]), mix(a.curl[3], b.curl[3]),
    ],
    tip: mix(a.tip, b.tip),
    spread: mix(a.spread, b.spread),
    thumbCurl: mix(a.thumbCurl, b.thumbCurl),
    thumbOut: mix(a.thumbOut, b.thumbOut),
    cup: mix(a.cup, b.cup),
    wrist: mix(a.wrist, b.wrist),
    touch: mix(a.touch, b.touch),
    tool: mix(a.tool, b.tool),
    align: mix(a.align, b.align),
  };
}

// ---------------------------------------------------------------------------

export interface HandRig {
  /**
   * The placement node. Its position and orientation belong to the runtime;
   * everything under it belongs to the pose.
   *
   * Local frame: the palm lies in the `xz` plane, the palm *faces* `-y`, and
   * the fingers point along `+z`. So orienting a hand to a `Contact` is
   * "point local `+y` along the surface normal", which is one `setFromUnitVectors`
   * and no special cases for a snare versus a fretboard.
   */
  group: Group;
  /**
   * Where this hand currently touches the world, in `group`'s own frame.
   *
   * The point a `Contact` should end up on, which is the palm for a hand
   * holding something and a fingertip for a hand playing something — see
   * `HandPose.touch`. Solved from the shape the hand is actually in this
   * frame, wrist included, so it is correct mid-blend rather than only at the
   * ends of one.
   *
   * **Live and owned by the rig.** Read it, transform a copy of it, never
   * retain or mutate it: the next `update` overwrites it in place.
   */
  readonly touchPoint: Vector3;
  /**
   * Where the forearm meets this hand, in `group`'s own frame — the cuff.
   *
   * `touchPoint`'s opposite number, and it exists for the same reason: the arm
   * has to end where the hand actually begins, and that is not the placement
   * node. It is carried through the wrist break, so a hand bent hard at the
   * wrist has its cuff where the cuff is drawn rather than where it would have
   * been if the wrist were square, which is a couple of centimetres and exactly
   * the couple of centimetres that would show as a gap.
   *
   * **Live and owned by the rig**, on the same terms as `touchPoint`.
   */
  readonly wristPoint: Vector3;
  /**
   * How much this hand's shape dictates where its elbow is, right now.
   *
   * The eased `HandPose.align` — the target, not the pose that was asked for —
   * so an arm reads a hand that is halfway out of a bow hold as halfway out of
   * bow-arm discipline. See `performer-arms.ts`, which is the only caller.
   */
  readonly align: number;
  /** Target shape. The hand eases toward it; see `update`. */
  setPose(pose: HandPose): void;
  /** Target shape, immediately. For the first frame and for a hard cut. */
  snapPose(pose: HandPose): void;
  /**
   * How far each finger is down, index to little — `Contact.fingers`, straight
   * off the instrument. `undefined` means the pose decides, which is what every
   * hand that is not on a wind instrument says.
   *
   * Additive on `HandPose.curl` and eased on its own clock, because it changes
   * for a different reason and at a different rate: the shape is the job and
   * the fingering is the note. See `FINGER_THROW`.
   */
  setFingers(close: ArrayLike<number> | undefined): void;
  /**
   * Where the forearm is, as two angles in the hand's own frame — extension
   * and deviation, radians, both clamped internally.
   *
   * There is no forearm, and that is exactly why this exists. A hand placed on
   * a contact takes its whole orientation from the surface normal, so an
   * accordionist reaching across to the bass buttons and a drummer's hand flat
   * on a snare end up with identically axis-aligned wrists — and a wrist that
   * never breaks is the single most puppet-like thing left once the fingers are
   * right. The rig knows where the shoulder is, so it can say which way the
   * arm *would* run, and the wrist bends to meet it. It is additive on top of
   * `HandPose.wrist`, so a pose's own attitude survives.
   */
  setWrist(extend: number, deviate: number): void;
  update(dt: number): void;
}

/** How long a hand takes to change shape. A tenth of a second, like a hand. */
const POSE_TAU = 0.085;

/** How long the wrist takes to follow the arm. Slower: a wrist is heavier. */
const WRIST_TAU = 0.12;

/** How far the wrist will break to meet the forearm, radians. */
const WRIST_LIMIT = 0.42;

/**
 * How much of the curl range a fingering is allowed to move a finger.
 *
 * The pose is the hand at rest over its own keys, and this is what a finger
 * adds to that going down and takes off it coming up: a fully pressed finger is
 * half of this more curled than the shape asked for, a lifted one half of it
 * less. **A swing about the pose, not a range from it** — so a model with
 * nothing to say about a finger says the middle of it and moves nothing, which
 * is how a trumpeter's little finger stays in the ring hook while the other
 * three work. See `Contact.fingers`.
 *
 * Under a third of the range, which is about 17° each way at the knuckle and,
 * once the second joint has multiplied it, a good two centimetres at the
 * fingertip on a hand this size. A saxophone key lifts four millimetres. This
 * is the same lie the models tell with their pads and it is told for the same
 * reason: what is being drawn is not the key travel, it is that a finger moved,
 * and at ten metres a truthful four millimetres is a still hand.
 *
 * It is added *after* `aimTouch` has solved, deliberately — see there.
 */
const FINGER_THROW = 0.32;

/** How long a finger takes to arrive. Quicker than the hand: a key is thrown. */
const FINGER_TAU = 0.045;

/** Neither down nor lifted: the shape the pose already describes. */
const FINGER_NEUTRAL = 0.5;

/**
 * A per-hand constant offset, applied to every pose this hand ever takes.
 *
 * Two hands asked for the same shape at the same instant should not *be* the
 * same shape: real pairs of hands are never in agreement to three decimal
 * places, and a band of drummers whose ten fingers move as one is uncanny in a
 * way that is hard to point at and impossible to unsee. Deterministic per
 * performer per side, tiny — a twentieth of the range at most — and applied at
 * the point of use so the frozen poses in `HAND_POSES` are never touched.
 */
export interface HandBias {
  curl: [number, number, number, number];
  tip: number;
  spread: number;
  cup: number;
  wrist: number;
}

export const NO_BIAS: HandBias = { curl: [0, 0, 0, 0], tip: 0, spread: 0, cup: 0, wrist: 0 };

export function buildHand(
  side: 'left' | 'right', p: Proportions, skin: MeshStandardMaterial,
  cuffColour: string, l: Leases, bias: HandBias = NO_BIAS,
  implement?: HeldImplement,
): HandRig {
  const R = p.handR;
  // Which way the thumb points. The right hand lives at -x and its thumb
  // reaches across the body toward +x; the left is the mirror.
  const thumbSign = side === 'right' ? 1 : -1;

  const group = new Group();
  group.name = `${side}-hand`;

  /** Wrist flex, so `group` can stay purely a placement node. */
  const flex = new Group();
  group.add(flex);

  const palm = new Mesh(orb(l), skin);
  palm.scale.set(R * 2.0, R * 0.86, R * 1.75);
  palm.castShadow = true;
  flex.add(palm);

  // A sleeve cuff at the wrist. It costs one mesh and it is the difference
  // between a floating hand and a floating hand that belongs to a jacket.
  const cuff = new Mesh(collar(l), surface(l, cuffColour, { roughness: 0.9 }));
  cuff.scale.set(R * 1.55, R * 1.15, R * 1.10);
  cuff.position.set(0, 0, -R * 1.02);
  flex.add(cuff);

  const boneGeo = bone(l);

  interface Finger { base: Mesh; tip: Mesh; fan: number; length: number }
  const fingers: Finger[] = [];
  const LENGTHS = [1.0, 1.08, 1.0, 0.84];
  /** The index finger's bone length. `aimTouch` solves on that one alone. */
  const INDEX = R * 0.62 * (LENGTHS[0] ?? 1);
  for (let i = 0; i < 4; i++) {
    const length = R * 0.62 * (LENGTHS[i] ?? 1);
    const base = new Mesh(boneGeo, skin);
    base.scale.setScalar(length);
    base.position.set(thumbSign * (1.5 - i) * R * 0.46, 0, R * 0.78);
    flex.add(base);

    const tip = new Mesh(boneGeo, skin);
    tip.scale.setScalar(0.80);
    tip.position.set(0, 0.88, 0);
    base.add(tip);

    fingers.push({ base, tip, fan: 1.5 - i, length });
  }

  /**
   * The stick, and where its working end is in `flex`'s frame.
   *
   * Under `flex` rather than under `group`, so it rides the wrist with the
   * fingers — a stick that stayed square to the placement node while the wrist
   * broke would swing out of the fist that is supposed to be holding it.
   *
   * The pivot sits at the fulcrum, so the butt hangs back past the heel of the
   * hand and the tip runs out past the fingers off one rotation. `undefined`
   * when the hand holds nothing, which is what `aimTouch` tests.
   */
  let toolTip: Vector3 | undefined;
  if (implement) {
    const spec = IMPLEMENTS[implement];
    const aim = new Vector3(
      thumbSign * IMPLEMENT_AIM.x, IMPLEMENT_AIM.y, IMPLEMENT_AIM.z,
    ).normalize();

    const held = new Group();
    held.name = `${side}-${implement}`;
    held.position.set(
      thumbSign * IMPLEMENT_AT.x * R, IMPLEMENT_AT.y * R, IMPLEMENT_AT.z * R,
    );
    held.quaternion.setFromUnitVectors(UP, aim);
    flex.add(held);

    const length = spec.length * R;
    const butt = length * spec.grip;
    const reach = length - butt;
    const bead = spec.bead * R;

    // `rod` runs from its own base along `+y`, so the whole shaft is one
    // position and one scale. Non-uniform, and allowed to be: it is a leaf.
    const shaft = new Mesh(rod(l), surface(l, spec.shaft, { roughness: 0.55 }));
    shaft.position.y = -butt;
    shaft.scale.set(spec.thick * R, length, spec.thick * R);
    shaft.castShadow = true;
    held.add(shaft);

    // Centred a radius short of the end, so the ball's far surface is exactly
    // the point the rig will place on the drum. Anything else either buries the
    // bead in the head or floats the stick above it.
    const tip = new Mesh(pip(l), surface(l, spec.head, { roughness: spec.headRough }));
    tip.position.y = reach - bead;
    tip.scale.setScalar(bead * 2);
    held.add(tip);

    toolTip = held.position.clone().addScaledVector(aim, reach);
  }

  const thumbBase = new Mesh(boneGeo, skin);
  thumbBase.scale.setScalar(R * 0.58);
  thumbBase.position.set(thumbSign * R * 0.82, -R * 0.08, -R * 0.04);
  flex.add(thumbBase);
  const thumbTip = new Mesh(boneGeo, skin);
  thumbTip.scale.setScalar(0.84);
  thumbTip.position.set(0, 0.86, 0);
  thumbBase.add(thumbTip);

  const current: HandPose = { ...HAND_POSES.relax, curl: [...HAND_POSES.relax.curl] };
  let target: HandPose = HAND_POSES.relax;
  let settled = false;

  // The fingering channel: where each finger is being asked to go, and where it
  // has got to. Held beside the pose rather than inside it because it is not a
  // shape — see the header — and initialised to neutral, so a hand nobody ever
  // calls `setFingers` on is exactly the hand this rig drew before the channel
  // existed.
  const fingerTo = [FINGER_NEUTRAL, FINGER_NEUTRAL, FINGER_NEUTRAL, FINGER_NEUTRAL];
  const fingerAt = [FINGER_NEUTRAL, FINGER_NEUTRAL, FINGER_NEUTRAL, FINGER_NEUTRAL];

  // The forearm channel. Held separately from the pose because it changes for a
  // different reason and on a different clock: the pose is a decision, this is
  // a consequence of where the hand was put.
  let wantExtend = 0;
  let wantDeviate = 0;
  let extend = 0;
  let deviate = 0;

  // The contact point, before and after the wrist. `touchLocal` is what the
  // pose decided; `touchPoint` is that carried through the flex, which the
  // rig reads. Two vectors held for the life of the hand rather than built
  // per frame: this is on the placement path for twelve hands at 60 Hz.
  const touchLocal = new Vector3();
  const touchPoint = new Vector3();

  // And the other end. The cuff is where the arm arrives; unlike the contact it
  // is a fixed point on the hand, so only the flex ever moves it.
  const wristLocal = new Vector3(0, 0, -R * 1.02);
  const wristPoint = new Vector3();

  function applyFlex(): void {
    flex.rotation.set(clamp(current.wrist + bias.wrist, -1, 1) * 0.55 + extend, deviate, 0);
    // The wrist moves the fingers, so it moves where they touch. Written here
    // rather than in `apply` because the flex is re-evaluated every frame
    // while the pose is settled, and a contact point that stopped tracking the
    // wrist would drift off the instrument exactly when a player stops moving.
    touchPoint.copy(touchLocal).applyEuler(flex.rotation);
    wristPoint.copy(wristLocal).applyEuler(flex.rotation);
  }

  /**
   * Solve where this shape touches, into `touchLocal`.
   *
   * The same forward kinematics `apply` has just performed, run once for the
   * index finger and nothing else. Reading it back off the meshes would need a
   * matrix update per finger per frame; re-deriving it is four trig calls.
   *
   * The index rather than a mean of the four, because the index is the finger
   * that actually meets a key, a fret, a valve or a string, and the mean is
   * wrong precisely where the fingers disagree — `point` is one extended
   * finger and three folded ones, and its mean is a fist.
   *
   * `bone` runs along `+y` from its own base and `+π/2` is what lays it along
   * `+z`, so a segment at angle θ about `x` contributes `(0, L cos θ, L sin θ)`
   * and the whole finger is two of those from the knuckle at `z = 0.78 R`.
   *
   * ## The fingering is not in here, and that is the whole of why it works
   *
   * `FINGER_THROW` moves the drawn index by up to a sixth of the curl range and
   * this solve deliberately does not see it. The rig places a hand by subtracting
   * `touchPoint` from the contact, so anything that moves the touch point moves
   * the *hand*: a saxophonist lifting an index finger off a pearl would have had
   * the whole hand shunted a finger's length back up the horn to keep the
   * fingertip on the key it had just come off. Inverted, and every note.
   *
   * So the hand is placed by where the model says the *station* is, and the
   * fingers move relative to that. A pressed finger goes a few millimetres into
   * the key it is pressing, which is about what a key does, and a lifted one
   * lifts — which is the only one of the two anybody was ever going to notice.
   */
  function aimTouch(pose: HandPose, cup: number, tip: number): void {
    const curl = clamp((pose.curl[0] ?? 0) + (bias.curl[0] ?? 0), 0, 1);
    const t1 = Math.PI / 2 + curl * 1.75 + cup * 0.16;
    const t2 = t1 + tip * curl * 1.45;
    // The proximal bone reaches its child joint at 0.88 of its length; the pad
    // of the fingertip is about six tenths along the bone beyond it, which is
    // the fleshy part rather than the cap at the very end.
    const l1 = INDEX * 0.88;
    const l2 = INDEX * 0.62;
    const tipY = l1 * Math.cos(t1) + l2 * Math.cos(t2);
    const tipZ = R * 0.78 + l1 * Math.sin(t1) + l2 * Math.sin(t2);

    // `touch === 0` reproduces the placement this rig made before poses could
    // say otherwise — half a palm back along the surface normal — so every
    // hand that holds something is left exactly where it was.
    const k = clamp(pose.touch, 0, 1);
    touchLocal.set(0, -R * 0.62 + (tipY + R * 0.62) * k, tipZ * k);

    // And out along whatever the hand is holding, if it is holding anything.
    // Same lerp, one stage further out: `touch` runs the contact from the palm
    // to the fingertips and `tool` runs it from there to the end of the stick.
    if (toolTip) touchLocal.lerp(toolTip, clamp(pose.tool, 0, 1));
  }

  function apply(pose: HandPose): void {
    const cup = clamp(pose.cup + bias.cup, 0, 1);
    const spread = clamp(pose.spread + bias.spread, 0, 1);
    const tip = clamp(pose.tip + bias.tip, 0, 1);
    for (let i = 0; i < fingers.length; i++) {
      const f = fingers[i];
      if (!f) continue;
      const curl = clamp(
        (pose.curl[i] ?? 0) + (bias.curl[i] ?? 0)
          // The fingering, on top of the shape. Toward the palm is toward the
          // instrument for every hand placed by a contact normal — the palm
          // faces `-normal` by construction — so one sign is right for a key
          // cup on the far side of a saxophone, a pad on top of a flute and a
          // valve button on top of a trumpet alike.
          + ((fingerAt[i] ?? FINGER_NEUTRAL) - FINGER_NEUTRAL) * FINGER_THROW,
        0, 1,
      );
      // `+π/2` lays the bone along `+z`; anything beyond that folds it toward
      // the palm, which is `-y`. One angle does the whole knuckle.
      f.base.rotation.set(
        Math.PI / 2 + curl * 1.75 + cup * 0.16,
        0,
        -thumbSign * f.fan * spread * 0.24,
      );
      f.tip.rotation.x = tip * curl * 1.45;
    }
    thumbBase.rotation.set(
      Math.PI / 2 - 0.22 + pose.thumbCurl * 1.30,
      0,
      -thumbSign * (0.42 + 0.62 * pose.thumbOut),
    );
    thumbTip.rotation.x = pose.thumbCurl * 1.10;
    // The palm arches as it closes. Small, but it is what stops a fist looking
    // like four fingers folded onto a plank.
    palm.scale.set(R * 2.0 * (1 - cup * 0.10), R * 0.86 * (1 + cup * 0.22), R * 1.75);
    aimTouch(pose, cup, tip);
    applyFlex();
  }

  apply(current);

  /**
   * In place, because this runs twelve times a frame with six on stage.
   *
   * Two rates: `k` for the shape and `fk`, the faster, for the fingering. See
   * `FINGER_TAU`, and the tail of this function for why they share a method.
   */
  function ease(k: number, fk: number): number {
    let moved = 0;
    for (let i = 0; i < 4; i++) {
      const to = target.curl[i] ?? 0;
      const d = (to - (current.curl[i] ?? 0)) * k;
      current.curl[i] = (current.curl[i] ?? 0) + d;
      moved += Math.abs(d);
    }
    const step = (key: Exclude<keyof HandPose, 'curl'>): void => {
      const d = (target[key] - current[key]) * k;
      current[key] += d;
      moved += Math.abs(d);
    };
    step('tip'); step('spread'); step('thumbCurl');
    step('thumbOut'); step('cup'); step('wrist');
    // Eased like everything else, so a hand crossfading from a fist round a
    // stick to fingers on a key bed slides its contact point across rather
    // than teleporting the whole hand a finger's length on one frame.
    //
    // **Both of them**, and `tool` is the one that was missing. `current` is
    // born a copy of `relax`, so a channel no step ever touches is a channel
    // pinned at `relax`'s value for the life of the hand — every pose's `tool`
    // read as 0, `aimTouch`'s lerp out along the shaft never ran, and a hand
    // holding a stick was placed by its palm. That put the drummer's fists flat
    // on the heads with a stick's length of hickory continuing on through the
    // drum and out the far side, which is a stick pointing the wrong way for
    // exactly as long as it takes to notice the hand is where the bead should
    // be. The two fields are one journey in two stages — palm to fingertip,
    // fingertip to bead; see `HandPose.tool` — so they step together.
    step('touch'); step('tool');
    // On the same clock as the shape, and that is the point of easing it here
    // rather than reading the target: the elbow of a player coming off a bow
    // hold is halfway out of bow-arm discipline exactly when the hand is
    // halfway out of the shape, with no second time constant to keep in step.
    step('align');

    // And the fingering, on `fk` rather than `k`. It is here rather than in its
    // own method precisely because `moved` is one number: the settle test below
    // is what stops `apply` running on a hand that has arrived, and a hand whose
    // shape has arrived while its fingers are still travelling has not arrived.
    for (let i = 0; i < 4; i++) {
      const at = fingerAt[i] ?? FINGER_NEUTRAL;
      const d = ((fingerTo[i] ?? FINGER_NEUTRAL) - at) * fk;
      fingerAt[i] = at + d;
      moved += Math.abs(d);
    }
    return moved;
  }

  return {
    group,
    touchPoint,
    wristPoint,
    get align(): number { return current.align; },
    setPose(pose: HandPose): void {
      target = pose;
      settled = false;
    },
    snapPose(pose: HandPose): void {
      target = pose;
      ease(1, 1);
      apply(current);
      settled = true;
    },
    setFingers(close: ArrayLike<number> | undefined): void {
      for (let i = 0; i < 4; i++) {
        const raw = close === undefined ? FINGER_NEUTRAL : close[i];
        // A non-finite closure has to become neutral rather than propagate: the
        // ease below is `x += (target − x) * k`, and one NaN in a target is a
        // finger that is never drawn again for the rest of the show.
        const want = typeof raw === 'number' && Number.isFinite(raw)
          ? clamp(raw, 0, 1) : FINGER_NEUTRAL;
        if (want === fingerTo[i]) continue;
        fingerTo[i] = want;
        settled = false;
      }
    },
    setWrist(e: number, d: number): void {
      wantExtend = clamp(Number.isFinite(e) ? e : 0, -WRIST_LIMIT, WRIST_LIMIT);
      wantDeviate = clamp(Number.isFinite(d) ? d : 0, -WRIST_LIMIT, WRIST_LIMIT);
    },
    update(dt: number): void {
      // The wrist is eased and written every frame, outside the `settled`
      // short-circuit: the pose can be finished for minutes while the hand is
      // still being moved around the instrument, and a wrist that only updated
      // when the fingers did would lock the moment a player settled into a
      // groove — which is the exact moment anyone is looking at it.
      const wk = 1 - Math.exp(-dt / WRIST_TAU);
      extend += (wantExtend - extend) * wk;
      deviate += (wantDeviate - deviate) * wk;

      if (settled) {
        applyFlex();
        return;
      }
      const moved = ease(1 - Math.exp(-dt / POSE_TAU), 1 - Math.exp(-dt / FINGER_TAU));
      apply(current);
      if (moved < 1e-4) settled = true;
    },
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
