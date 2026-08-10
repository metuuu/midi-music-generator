/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The lighting rig — a `LightingScore` turned into fixtures, beams and one
 * shadow.
 *
 * The score half of §8.8 lives in `src/concert/lighting.ts`, is MIT, and reads
 * the *form*: a chorus is bigger than a verse, a key change is a push, a solo
 * isolates, ambient refuses to have a foreground. This file knows none of that
 * and must not learn it. **There is no genre switch anywhere below.** Every
 * level, every gel, every fade length and every decision about who is favoured
 * comes out of `LightingScore`; every dimension, colour and volume of air comes
 * out of `Venue` and `StageRig.metrics`. If the pavilion and the black box look
 * like different rooms — and they do — it is because `concert/lighting.ts` and
 * `concert/venue.ts` said different numbers, not because this file asked what
 * genre it was.
 *
 * What is genuinely the rig's, because the IR cannot express it:
 *
 *  - **Where the beam physically is**, and therefore how late it gets there.
 *    See `lights-follow.ts`; the score argues at length about why lateness is
 *    positional and cannot live in a cue.
 *  - **What the air does to the light.** `haze` is a density; a cone of visible
 *    scattering is geometry. See `lights-beams.ts`.
 *  - **Which one light casts the shadow**, which is a budget, not a look.
 *
 * ## What the show runner drives
 *
 * ```ts
 * const lights = buildLightRig(concert.venue, stage);
 * scene.add(lights.root);              // the fly-bar fixtures go on themselves
 *
 * lights.setSubjects(performerRoots);  // Map<performerId, Object3D>, feet-height
 * lights.begin(number.lighting);       // a new number: recomputes the cue timeline
 * lights.setHouse(1);                  // BILL / APPLAUSE / BOW. Not the score's.
 *
 * lights.update(beat, dt);             // once a frame, with the one clock
 * lights.setQuality('medium');
 * lights.dispose();
 * ```
 *
 * `update` never samples anything. `beat` is the number `transport.beat()`
 * returned once at the top of the frame, and `dt` is seconds of wall time for
 * interpolation only — the split the plan's §7 insists on. Everything cued is a
 * pure function of `beat`; everything physical (the follow spot's lag, its
 * tremor) runs on `dt`, because a reaction time is a physical constant and does
 * not get quicker when the band counts the tune off faster.
 *
 * ## The one shadow
 *
 * The budget is one shadow-casting light in the whole scene, and it is the
 * **key**. Three reasons, in order of how much they mattered:
 *
 *  1. The key is up in every genre and every section, so the band has contact
 *     shadows on the boards *at all times*. A player with no shadow floats, and
 *     a floating player reads as broken far more loudly than a missing dramatic
 *     shadow reads as tasteful.
 *  2. It is a `DirectionalLight`, so one orthographic map covers the whole
 *     stage at uniform texel density. A follow spot's perspective map spends
 *     most of its resolution on empty boards and swims as the beam pans, which
 *     on a 1024 map is worse than no shadow.
 *  3. Ambient never raises the `spot` at all — by design, §4.3 — so a
 *     spot-carried shadow would leave an entire genre unshadowed.
 *
 * `opts.shadow` moves it to the spot or turns it off, because Wave 3 will want
 * to A/B exactly this and a one-line switch is cheaper than a rebuild.
 *
 * ## Lights, and why the set never changes
 *
 * Seven fixtures, wired to eight three.js lights and one drawn card. Two of the
 * lights are light-probe lights (`HemisphereLight`), which three folds into
 * spherical harmonics and which cost nothing per fragment. The six that cost
 * something are four directionals, the follow spot, and the warm's point
 * source. `cyc` is not a light at all — see `buildCycGlow`.
 *
 * They are all created up front and **never made invisible to save time**.
 * Changing the number of visible lights changes the material's shader defines
 * and forces every program in the scene to recompile, which is a multi-frame
 * stall — precisely the wrong thing to do at the moment a fixture fades out. A
 * fixture that is out sits at `intensity: 0` and stays in the loop. The only
 * deliberate recompiles are on `setQuality`, which is rare and user-driven.
 */

import {
  Color, CylinderGeometry, DirectionalLight, Group, HemisphereLight, Mesh,
  MeshBasicMaterial, Object3D, PointLight, SphereGeometry, SpotLight,
  SRGBColorSpace, Vector3,
} from 'three';

import { Rng } from '../../core/rng.js';
import type { FixtureId, LightingScore, Venue } from '../../concert/types.js';
import { beamDensity, buildBeam, buildCycGlow, type Beam } from './lights-beams.js';
import {
  blankState, buildTimeline, evaluate, FIXTURES,
  type FixtureState, type Timeline,
} from './lights-cues.js';
import { FollowSpot, OPERATOR, STEADY } from './lights-follow.js';
import { HEAD_BAND, houseLid, Kit, shade, tint, type Quality } from './stage-kit.js';
import type { StageRig } from './stage.js';

export type { Quality } from './stage-kit.js';
export { OPERATOR, STEADY, type FollowTuning } from './lights-follow.js';

// ---------------------------------------------------------------------------
// The public shape
// ---------------------------------------------------------------------------

export interface LightRigOptions {
  quality?: Quality;
  /**
   * Override `prefers-reduced-motion`. Headless callers must pass it — there
   * is no `matchMedia` outside a browser.
   *
   * What it changes: no fade is shorter than a quarter beat (the score's fill
   * bumps can snap), the follow spot stops overshooting and stops trembling,
   * and the lamps stop flickering. The beam still follows the soloist; deleting
   * that would remove the feature rather than calm it.
   */
  reducedMotion?: boolean;
  /**
   * Metres above a subject's origin that beams aim at. Default 1.15.
   *
   * `setSubjects` is expected to be handed performer *roots*, which sit at the
   * feet — the same objects `camera.ts` takes. This lifts the aim to chest and
   * face height, which is where a follow spot actually points.
   */
  aimHeight?: number;
  /** Which fixture carries the one shadow map. Default `'key'`; see the header. */
  shadow?: 'key' | 'spot' | 'none';
}

/** What one fixture is doing, in the score's own units. */
export interface FixtureReading {
  /** 0..1 exactly as the cue meant it, before the rig's gain. */
  intensity: number;
  /** `#rrggbb`, as printable as the IR it came from. */
  colour: string;
  /** Whom the running cue names. `spot` and `warm` only. */
  follow?: string;
}

/**
 * Everything the rig is doing this frame.
 *
 * Diagnostic rather than load-bearing — `concert-check` reads it, a HUD could,
 * and the camera director could reasonably want to know where the beam is so a
 * close shot can agree with it. Allocates; do not call it in a hot loop.
 */
export interface LightRigState {
  /** The beat last passed to `update`. */
  beat: number;
  /** The house level, as the fader has actually reached it. */
  house: number;
  /** The grand master, likewise. 1 unless the show runner has dimmed it. */
  master: number;
  /** `LightingScore.haze` of the running number. */
  haze: number;
  quality: Quality;
  fixtures: Record<FixtureId, FixtureReading>;
  /** World point the follow spot is actually lighting. */
  spotAim: [number, number, number];
  /** Where the score is asking it to be. Same as `spotAim` when nothing is cued. */
  spotWanted: [number, number, number];
  /** Metres between the two — the operator's lateness, measured. */
  spotError: number;
  /** World point the `warm` fixture is favouring. */
  warmAim: [number, number, number];
  /** Lights in this rig that cast a shadow. The budget says at most one. */
  shadowCasters: number;
}

export interface LightRig {
  /**
   * The lights, the beams and the floor fixtures. Add it to the scene.
   *
   * Not quite everything: the fly-bar fixtures are parented to `stage.flyBar`
   * so that a bar which flies takes its lanterns with it. `dispose()` removes
   * both, so the caller still only has to add this one object.
   */
  root: Group;

  /** A new number. Recomputes the cue timeline; the beam stays where it is. */
  begin(score: LightingScore): void;

  /**
   * Where the follow spot can point. Call whenever the cast changes.
   *
   * Keyed by `Performer.id`, valued with the object whose **world position** is
   * the player's feet — a performer rig's `root`. The rig reads the world
   * position every frame, so a player who moves is followed.
   */
  setSubjects(subjects: Map<string, Object3D>): void;

  /** One call per frame. `beat` from the one clock; `dt` in seconds. */
  update(beat: number, dt: number): void;

  /**
   * House lights, 0..1. The show runner's, not the score's.
   *
   * A separate probe light that only ever *adds*, so it cannot fight a cue: the
   * score fades to an ember rather than to black precisely so that the house
   * has somewhere to come up from. Bring it up for BILL, APPLAUSE and BOW.
   *
   * `seconds` is a fade. Omit it and the change is instant, which is what a
   * work light does and *not* what a house does — the audience is looking at
   * the house lights when they go, so a snap there is the one lighting change
   * everybody in the room notices. See `setMaster`.
   */
  setHouse(level: number, seconds?: number): void;

  /**
   * The grand master over everything the *score* is doing, 0..1.
   *
   * Not a cue and not part of the score: it is the fader the whole rig hangs
   * off, and the reason it exists is the moment before a number starts. The
   * timeline is evaluated from beat 0, so `begin` puts every fixture at its
   * opening level immediately — behind a closed curtain, with the house still
   * up, which reads as the room being far too bright and then abruptly
   * changing when the tabs move.
   *
   * A theatre does it the other way round: the house goes out, *then* the
   * stage comes up, and the curtain opens onto a lit set. That ordering is
   * three calls with this and impossible without it, because nothing in a
   * lighting score can say "not yet".
   *
   * The house is deliberately outside it. Dimming the house with the same
   * fader would mean the pre-show had no light at all.
   */
  setMaster(level: number, seconds?: number): void;

  setQuality(q: Quality): void;

  /** Diagnostics; see `LightRigState`. */
  readState(): LightRigState;

  /**
   * Roughly how much light is arriving at a world point, in the same units the
   * light intensities carry. Ignores surfaces, normals and the shadow map — it
   * answers "is this player lit", which is what an isolation test wants and
   * what an auto-exposure would want.
   */
  measure(point: Vector3): number;

  dispose(): void;
}

// ---------------------------------------------------------------------------
// Tuning
// ---------------------------------------------------------------------------

/**
 * Cue intensity 0..1 to three.js intensity.
 *
 * The directionals are irradiance and live near 1. The two punctual fixtures
 * are in candela and run with `decay` well under the physical 2 — the follow
 * spot at 1, the warm at 0.5. A theatrical lantern is a lens and a reflector
 * throwing a near-collimated beam across ten metres, not a bare point source,
 * and inverse-square across that distance would make the front of a solo four
 * times hotter than the back of it for no reason anybody in the room would
 * recognise. The gains absorb the resulting scale, which is why the two
 * punctual numbers look nothing like the rest.
 *
 * ## The split inside `wash`, which is the whole look
 *
 * `wash` is one number in the score and two fixtures in the rig: a hemisphere
 * probe for cover and a soft top light for modelling. How its energy divides
 * between them is not a detail — it is the difference between a lit stage and
 * a flat one, because the probe reaches every normal equally and the top light
 * only reaches the ones facing it.
 *
 * It used to sit at 1.30 probe against 0.55 top: seven parts cover to three
 * parts shape. Measured on a surface at albedo 0.6 under a mid cue, that plus
 * the environment put the *shaded* side of a face at 0.394 linear against
 * 0.591 lit — a ratio of 1.5 to 1, which is about the contrast of an overcast
 * afternoon and is what "bright and flat" actually was.
 *
 * The split is now inverted, 0.55 probe against 1.30 top, and the fills behind
 * it are down. Same surface, same cue: 0.149 shaded against 0.484 lit, a ratio
 * of 3.25 to 1. The score's `wash` level still means the same thing — how much
 * cover is up — but the light arrives from somewhere now.
 *
 * `key` and `back` climbed with it. They are the two fixtures that carry
 * direction, so they are the two that had to grow once the directionless
 * sources shrank; leaving them alone would have produced a darker flat stage
 * rather than a lit one.
 */
const GAIN = {
  washHemi: 0.55,
  washTop: 1.30,
  key: 2.60,
  back: 2.40,
  foot: 1.05,
  spot: 26,
  warm: 2.0,
  /** The cyc is a card, not a lantern; this is its alpha rather than a candela. */
  cyc: 0.9,
  /**
   * The house is the one fixture allowed to be flat — a room with the working
   * light on genuinely is — so this stays a probe. It comes down only because
   * everything around it did, and a house light that still read as full would
   * now be brighter than the show.
   */
  house: 1.60,
} as const;

/**
 * Cone half-angles, radians.
 *
 * `spot` is 0.09 — about a 1.8 m circle at a ten-metre throw, which is one
 * person and their instrument and nothing else. There is no `cyc` angle: the
 * backdrop wash is a card, not a lantern.
 */
const SPOT_ANGLE = 0.09;

/**
 * The `warm` fixture has no cone at all, and that is the whole design.
 *
 * The obvious build is a wide, soft spot — and it does not work, for a reason
 * worth writing down because it is not intuitive. A lantern on the fly bar is
 * only three or four metres from a standing player, and at that range a cone
 * *cannot* cover a twelve-metre stage: two players eight metres apart subtend
 * about 75°, so a fixture aimed at one of them leaves the other outside the
 * beam entirely. Measured, a 0.6 rad flood put two hundred times as much light
 * on the favoured player as on the rest of the band. That is not a warm. That
 * is a follow spot with a soft edge, which is exactly the thing `FixtureId`
 * says this fixture must not be.
 *
 * So the light is a **point source hung over the player**: a bare warm lamp of
 * the kind a black box with a projection in it actually has. It used to say *on
 * a drop* here, and that was the whole of the authority for hanging the drawn
 * lantern a third of a metre upstage of its own bar — there was never a drop,
 * and the fixture is clamped to the pipe with the pars now. See `warmPos`. A
 * point light has no edge to fall outside of, so "it never isolates" is
 * structural rather than tuned — no amount of retuning can turn it into a
 * follow spot, because it has no beam to narrow. `decay` is cut to 0.5 so the
 * gradient across the boards is gentle, and the gain is low enough that the
 * fixture is a lift rather than a source.
 *
 * Measured on the real ambient scores: the favoured player ends up at most 1.8×
 * as lit *by this fixture* as the rest of the band, and under 1.3× as lit in
 * total. A follow spot at full is two to four times in total, and its beam is
 * hundreds of times hotter on the soloist than on anybody else. The two are not
 * the same fixture with different numbers.
 *
 * What the audience sees is the beam, not the illuminance, and that stays a
 * cone: a wide, soft column of haze from the lantern on the bar down onto the
 * player. Somewhere to look, with nothing claimed about it.
 */
const WARM_LAMP_HEIGHT = 3.2;
const WARM_BEAM_ANGLE = 0.5;

/** Per-fixture beam density, relative to `beamDensity(haze)`. */
const BEAM_SCALE = { spot: 1.0, warm: 0.5, par: 0.42, back: 0.55 } as const;

interface Tier {
  /** Lanterns on the fly bar, and how many of them show a beam. */
  pars: number;
  parBeams: number;
  /** Bulbs along the lip. Bodies only; the footlight fixture is a directional. */
  foots: number;
  /** Upstage back-light beams. The bodies are always both there. */
  backBeams: number;
  /** Cone tessellation. */
  segments: number;
  /** Shadow map edge; 0 turns the shadow off entirely. */
  shadowMap: number;
  /** The soft top light that models the wash. Folded into the probe at `low`. */
  washTop: boolean;
}

const TIERS: Record<Quality, Tier> = {
  high: { pars: 6, parBeams: 6, foots: 8, backBeams: 2, segments: 16, shadowMap: 2048, washTop: true },
  medium: { pars: 4, parBeams: 4, foots: 6, backBeams: 2, segments: 12, shadowMap: 1024, washTop: true },
  low: { pars: 2, parBeams: 0, foots: 4, backBeams: 0, segments: 8, shadowMap: 0, washTop: false },
};

const MAX_PARS = 6;
const MAX_FOOTS = 8;

/** Reduced motion floors every fade here, so nothing in the rig snaps. */
const CALM_MIN_FADE = 0.25;

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A level that travels: the house, and the grand master.
 *
 * Both are the show runner's rather than the score's, and neither can go
 * through the cue timeline — that is indexed by *beat*, and the two moments
 * these exist for are precisely the ones where there is no music playing.
 *
 * Linear, because a dimmer is linear. An eased console fade reads as somebody
 * riding the fader rather than as the lights changing.
 */
interface Fader {
  value: number;
  target: number;
  /** Units per second; `Infinity` is a snap. */
  rate: number;
}

function makeFader(value: number): Fader {
  return { value, target: value, rate: Number.POSITIVE_INFINITY };
}

function setFader(f: Fader, level: number, seconds: number | undefined): void {
  const to = Number.isFinite(level) ? Math.max(0, Math.min(1, level)) : 0;
  f.target = to;
  f.rate = seconds && seconds > 0
    ? Math.abs(to - f.value) / seconds
    : Number.POSITIVE_INFINITY;
  if (!Number.isFinite(f.rate) || f.rate <= 0) f.value = to;
}

function stepFader(f: Fader, dt: number): number {
  if (f.value === f.target) return f.value;
  if (!Number.isFinite(f.rate)) { f.value = f.target; return f.value; }
  const step = f.rate * dt;
  f.value = f.value < f.target
    ? Math.min(f.target, f.value + step)
    : Math.max(f.target, f.value - step);
  return f.value;
}

// ---------------------------------------------------------------------------

export function buildLightRig(
  venue: Venue,
  stage: StageRig,
  opts: LightRigOptions = {},
): LightRig {
  let quality: Quality = opts.quality ?? 'high';
  const reduced = opts.reducedMotion ?? prefersReducedMotion();
  const aimHeight = opts.aimHeight ?? 1.15;
  const shadowOn = opts.shadow ?? 'key';

  const kit = new Kit();
  const m = stage.metrics;
  const p = venue.palette;

  const root = new Group();
  root.name = `lights:${venue.id}`;

  /**
   * Fixtures hang on the pipe, so they are parented to it rather than placed
   * near it. `stage.ts` exposes `flyBar` for exactly this and adds no lights of
   * its own.
   */
  const flyRig = new Group();
  flyRig.name = 'lights:fly';
  stage.flyBar.add(flyRig);

  const flyWorld = stage.flyBar.getWorldPosition(new Vector3());

  // --- where things hang --------------------------------------------------

  /**
   * The two lids, or `Infinity` twice in a room with nothing overhead.
   *
   * Every fixture in this rig was hung off `m.openingHeight`, which is the
   * height of the *arch* — a fine proxy for "up in the air" right up until a
   * room got a ceiling lower than its own opening. Then the whole rig was
   * inside the plaster: the bar and its pars over the stage, the back light
   * upstage, and the follow spot 1.75 m above the house lid, all of them
   * throwing beams that began somewhere the audience cannot see.
   *
   * A lantern is not dressing and does not answer to `HANG_FLOOR`; what it
   * answers to is the surface it is bolted to. So each of these clamps to the
   * lid it hangs from, and `Math.min` against `Infinity` leaves every other
   * room exactly as it was.
   */
  const stageLid = m.headroom;
  const roomLid = houseLid(m);

  /**
   * How far a can slings below the pipe, and under a soffit it slings less.
   *
   * The bar is now a handspan under the plaster, so the old 0.24 m yoke drop
   * put the bottom of every can at 2.32 m — 0.08 m *inside* `HEAD_BAND.hi`,
   * which is a par on the scroll of a double bass on the riser. Short-yoked at
   * 0.10 m it sits at 2.49 m and clears, and clamped tight to the pipe is how a
   * rig bolted to a ceiling looks anyway: there is no room to sling anything.
   *
   * It lives up here rather than beside the par loop because it is now every
   * can on the bar's, the warm's included, and `warmPos` twenty lines down is
   * solved from it. Nothing else changed with the move — it reads `stageLid`
   * and nothing else, as it always did.
   */
  const barDrop = Number.isFinite(stageLid) ? -0.10 : -0.24;

  /**
   * The follow spot lives front of house, above and behind the audience, which
   * is where a follow spot has always lived: it is the only position from which
   * a beam can find a face without the beam itself being in the shot.
   *
   * In the cellar it comes down to a bracket under the house plaster, which
   * flattens its angle onto the stage — and that is what a follow spot in a
   * basement actually looks like. There is no rostrum to put it on.
   *
   * **The bracket is drawn now**, and until it was this paragraph was the only
   * place it existed: the fixture was a can, a lens and a hook with nothing
   * above the hook. Measured air between the top of that hook and the nearest
   * thing over it — 0.09 m in the salon, 0.10 in the sabha and the riihi, 0.11
   * in the dancehall, 0.15 in the shed — which is close enough that the gap
   * reads as a mistake rather than as distance, and those are the low rooms
   * where the fixture is 6 to 20° off the lens axis in the wide shot. In the
   * four rooms with no plaster at all it was a lantern six metres up in open
   * sky. See the stem by `lantern` at the bottom of this section.
   */
  const fohPos = new Vector3(
    0,
    Math.min(m.openingHeight + 1.35, roomLid - 0.3),
    m.lipZ + Math.max(2.6, m.houseDepth * 0.42),
  );

  /**
   * The warm lantern, on the bar with the pars.
   *
   * This was `flyWorld.z - 0.35` with no comment defending the number, and the
   * fixture was detached from its own bar in all twelve architectures — 0.17 to
   * 0.21 m of clear air between the can and the nearest member of the pipe it
   * is supposed to be clamped to, which is the 0.35 less the can's 0.12 half
   * depth less half the pipe's. The yoke hook made it worse rather than better:
   * on a 0.24 m can its top stands 0.24 m over the body, which put it at
   * `flyY + 0.12` — 0.07 m *above* the top of the pipe it is meant to clamp to,
   * so the fixture read as a can gripping air a handspan from the bar. Two
   * architectures escaped by luck — `hall`'s ladder truss has an upstage chord
   * the can happened to intersect, and `dancehall`'s bar sits close enough
   * under the plaster that the hook nearly touched it.
   *
   * Two ways to close it: draw the drop the note on `WARM_LAMP_HEIGHT` used to
   * promise, or hang the lantern where the same note *also* says it is — "the
   * lantern on the bar". Nothing in the file ever argued for the offset, so it
   * goes, and the can takes `barDrop` at local x and z of zero like every par.
   * The centre of the pipe is free to take it: `parSpan` is 3.34 m in the
   * narrowest opening in the set, so the nearest par centre is 0.2 of that
   * away — 0.67 m, against the 0.22 m the two cans need between them.
   *
   * Only `warmBeam.aim` reads this, so the beam's origin comes 0.35 m
   * downstage with the body. It is a 0.5 rad column pointed straight down; the
   * move is not visible in it.
   */
  const warmPos = new Vector3(flyWorld.x, flyWorld.y + barDrop, flyWorld.z);

  /** Where a beam points when nothing has told it to point anywhere. */
  const park = new Vector3(0, aimHeight, -0.3);

  // --- probe lights (free: three folds these into the light probe) ---------

  const washHemi = new HemisphereLight('#ffffff', '#ffffff', 0);
  washHemi.position.set(0, m.openingHeight, 0);
  root.add(washHemi);

  /**
   * The house is a second probe rather than a brighter wash, so that
   * `setHouse` can only ever add. A house light that reached into the cue
   * state would make "the house does not fight the score" a matter of care
   * instead of a matter of structure.
   */
  const houseHemi = new HemisphereLight(
    tint(p.ambient, 0.45),
    shade(p.boards, 0.35),
    0,
  );
  root.add(houseHemi);

  // --- directionals -------------------------------------------------------

  const washTop = new DirectionalLight('#ffffff', 0);
  washTop.position.set(1.2, m.openingHeight + 3, m.lipZ * 0.6 + 2);
  washTop.target.position.set(0, 1.2, -0.4);
  root.add(washTop, washTop.target);

  const key = new DirectionalLight('#ffffff', 0);
  key.position.set(3.2, m.openingHeight + 1.4, m.lipZ + 5.5);
  key.target.position.set(0, 1.35, -0.6);
  root.add(key, key.target);

  /** Rim from upstage: the fixture that separates a player from the backdrop. */
  const back = new DirectionalLight('#ffffff', 0);
  back.position.set(-1.8, m.openingHeight + 2.4, m.backZ - 3.2);
  back.target.position.set(0.4, 1.1, m.lipZ * 0.3);
  root.add(back, back.target);

  /** Up from the boards. A pavilion has these; the score decides whether. */
  const foot = new DirectionalLight('#ffffff', 0);
  foot.position.set(0, -0.55, m.lipZ + 1.2);
  foot.target.position.set(0, 2.3, -1.0);
  root.add(foot, foot.target);

  // --- spots --------------------------------------------------------------

  const spot = new SpotLight('#ffffff', 0, 0, SPOT_ANGLE, 0.35, 1);
  spot.position.copy(fohPos);
  spot.target.position.copy(park);
  root.add(spot, spot.target);

  const warm = new PointLight('#ffffff', 0, 0, 0.5);
  warm.position.set(park.x, park.y + WARM_LAMP_HEIGHT, park.z);
  root.add(warm);

  /**
   * The backdrop wash is drawn on the cloth rather than thrown at it. See
   * `buildCycGlow` for why every version of it built as a lantern floodlit the
   * drummer.
   */
  /**
   * ...and it is only as tall as the cloth is.
   *
   * Sized from the opening, which is a fine assumption in any room whose
   * backdrop reaches the top of the arch and a badly wrong one outdoors. A
   * tanssilava's backdrop is a 2.4 m wall you are meant to see over, so a
   * 4.7 m glow put three metres of lit rectangle in the night sky above it:
   * the brightest thing in the frame, hard-edged, hanging off nothing, and
   * covering the view the low wall exists to leave open.
   */
  const cycHeight = Math.min(m.openingHeight * 1.06, m.backdropHeight - 0.1);
  const cycGlow = buildCycGlow(kit, m.openingWidth * 1.02, cycHeight);
  cycGlow.mesh.position.set(0, cycHeight / 2 - 0.85, m.backZ - 0.07);
  root.add(cycGlow.mesh);

  // --- the shadow ---------------------------------------------------------

  function applyShadow(): void {
    const size = TIERS[quality].shadowMap;
    const wants = size > 0 ? shadowOn : 'none';

    key.castShadow = wants === 'key';
    spot.castShadow = wants === 'spot';

    if (key.castShadow) {
      /**
       * Spend the one map on the only place anything casts.
       *
       * The frustum was sized from the *room* — `max(width, depth) / 2 + 4` —
       * which in a large hall is a 28 m square rendered into 2048 px: about 73
       * texels per metre, so a forearm is six texels across and a hand is two.
       * That is why the one shadow in the show read as a soft grey bruise
       * rather than as a person. Almost all of that square was house floor,
       * and the house floor has nothing standing on it.
       *
       * Sizing it to the playing area instead — the opening's width by the
       * boards' depth, plus enough margin for a shadow to fall downstage of
       * whoever throws it — roughly halves the edge and so quadruples the
       * texel density on the only geometry that casts. `Math.min` is the
       * guarantee that this can only ever tighten the frustum: a room whose
       * stage genuinely is the whole floor keeps what it had.
       *
       * Outside the frustum is unshadowed, not wrongly shadowed — three's
       * `frustumTest` returns full light past the edge — so the audience loses
       * shadows it did not have and gains no artefact.
       */
      const playing = Math.max(m.openingWidth, Math.abs(m.lipZ - m.backZ));
      const reach = Math.min(Math.max(m.width, m.depth) / 2 + 4, playing / 2 + 3.5);
      const cam = key.shadow.camera;
      cam.left = -reach;
      cam.right = reach;
      cam.top = reach;
      cam.bottom = -reach;
      cam.near = 1;
      cam.far = key.position.length() + reach * 2;
      cam.updateProjectionMatrix();
      key.shadow.mapSize.set(size, size);
      key.shadow.bias = -0.0008;
      // A texel covers less ground than it did, so the offset that stopped the
      // surface shadowing itself can shrink with it. Left at 0.03 against the
      // tighter map it lifts the shadow off the foot that casts it.
      key.shadow.normalBias = 0.02;
    }
    if (spot.castShadow) {
      spot.shadow.camera.near = 1;
      spot.shadow.camera.far = fohPos.length() + Math.max(m.width, m.depth) + 6;
      spot.shadow.mapSize.set(size, size);
      spot.shadow.bias = -0.0009;
      spot.shadow.normalBias = 0.03;
    }
  }

  // --- fixture bodies -----------------------------------------------------

  const housing = kit.solid(shade(p.proscenium, 0.72), { metal: 0.55, rough: 0.42 });
  const yoke = kit.solid(shade(p.proscenium, 0.82), { metal: 0.6, rough: 0.5 });

  /** One lens material per fixture, mutated every frame to the cue's colour. */
  const lensMat = (id: string) => kit.material(
    `lens|${id}`,
    () => new MeshBasicMaterial({ color: 0x000000 }),
  );
  const parLens = lensMat('par');
  const backLens = lensMat('back');
  const footLens = lensMat('foot');
  const spotLens = lensMat('spot');
  const warmLens = lensMat('warm');

  const lensGeo = (r: number, d: number) => kit.geometry(
    `lens|${r.toFixed(3)}|${d.toFixed(3)}`,
    () => new CylinderGeometry(r, r, d, 12, 1, false),
  );

  /**
   * A lantern: a bevelled can, a stubby yoke, and a lens that glows.
   *
   * `at` is in the parent's space; `aimAt` is in **world** space, because
   * `Object3D.lookAt` is — which is also why the body is hung on its parent
   * before it is aimed. A fixture aimed while it is still parentless takes its
   * bar-local position for a world one and ends up pointing somewhere else.
   *
   * On a plain `Object3D`, `lookAt` puts local **+z** on the target (it is
   * cameras and lights that face -z). The can is modelled along -y with the
   * lens at its foot, so a quarter turn back about x brings the lens round
   * from -y onto +z, and the housing points where the beam goes.
   */
  function lantern(
    parent: Object3D, at: Vector3, aimAt: Vector3, size: number, lens: MeshBasicMaterial,
  ): void {
    const can = new Mesh(kit.bevelBox(size, size * 1.15, size, size * 0.28), housing);
    const disc = new Mesh(lensGeo(size * 0.4, size * 0.06), lens);
    disc.position.y = -size * 0.6;
    const hook = new Mesh(kit.bevelBox(size * 0.22, size * 0.5, size * 0.22, size * 0.08), yoke);
    hook.position.y = size * 0.75;

    const body = new Group();
    body.add(can, disc, hook);
    parent.add(body);
    body.position.copy(at);
    body.lookAt(aimAt);
    body.rotateX(-Math.PI / 2);
  }

  // Fly bar: the pars. Local coordinates, because they are children of the bar.
  // How far under the pipe they hang is `barDrop`, up by the lids, because the
  // warm hangs off the same number.
  const parSpan = Math.max(1, m.openingWidth / 2 - 0.8);
  const parLocal: Vector3[] = [];
  const parWorld: Vector3[] = [];
  const parTarget: Vector3[] = [];
  for (let i = 0; i < MAX_PARS; i++) {
    const f = (i / (MAX_PARS - 1)) * 2 - 1;
    const local = new Vector3(f * parSpan, barDrop, 0);
    parLocal.push(local);
    const world = stage.flyBar.localToWorld(local.clone());
    parWorld.push(world);
    const target = new Vector3(f * parSpan * 0.72, 0.02, flyWorld.z - 1.9);
    parTarget.push(target);
    lantern(flyRig, local, target, 0.2, parLens);
  }

  /**
   * Upstage back light: two lanterns high behind the band, on sidearms off the
   * wall — and the sidearm is the fix.
   *
   * `lantern()` draws a can, a lens and a yoke hook and nothing else, so for as
   * long as these were dropped straight into `root` they were two cans in open
   * air with no parent geometry anywhere near them. Measured to the nearest
   * surface in *any* direction: 0.55 m in the hall, 0.50 in the circuit and the
   * ballroom, 0.34 in the salon, 0.27 in the concert hall, 0.21 in the
   * proscenium and on the lawn, 0.14 in the courtyard; in the four that came
   * out at 0.00–0.01 what they were touching was a roof-tie prop only some eras
   * draw. They are the most visible of this rig's floating parts — 5 to 19°
   * above the lens axis and 11 to 17° off centre in the wide shot, directly
   * over the band, in every architecture.
   *
   * The arm is 0.80 m and it is *buried* 0.2 m in the wall rather than butted
   * to it, because the wall's downstage face lands anywhere from `backZ - 0.17`
   * to `backZ + 0.10` depending on the room: an arm cut exactly at `backZ` ends
   * in air in half of them, and one that overshoots is hidden by the thing it
   * pierces. Its downstage end dies inside the can for the same reason — an
   * overlapping join is a join at any float precision. Where a room hangs a
   * cloth upstage (`backZ + 0.25` in the proscenium and on the lawn, `+ 0.39`
   * in the courtyard and the sabha) or an arcade across the back wall, the arm
   * goes through that too, which is what a bracket behind a border looks like.
   *
   * That last 0.11 m inside the can is also the only part of the arm that
   * crosses `playingArea().backZ`, and it does so in the five low-ceiling
   * dressings where the *can* already crosses it by 0.30 m: at a 2.85 m soffit
   * the fixture lands at 2.35 m with its lens at 2.19, which is 0.21 m under
   * `HEAD_BAND.hi`. That is the room being 2.85 m tall and not this bracket —
   * the fixture cannot both clear a head and stay under that ceiling at this z,
   * and moving it upstage far enough to clear the band in z instead would walk
   * it into the drapes and the arcade the paragraph above is already dodging.
   *
   * `backY` gets a third clamp and it is the one that does the work. The soffit
   * term has never once bound — `openingHeight - 0.5` wins in all twelve, by
   * 0.15 m in the dancehall and 0.55 in the hall — so "under the soffit where
   * there is one" described a guard rather than a decision, and the fixture was
   * parked half a metre under the top of the arch whether or not the wall
   * behind it reached that high. `m.backdropHeight` is measured from the *house
   * floor*, which is why it takes `+ m.houseY` to compare with anything else
   * here; in board space the walls run 0.5 m (concert hall, courtyard,
   * dancehall) to 3.2 m (jazz cellar) above the fixture and the clamp is idle,
   * except on the lawn, where the zinc backing tops out at 3.55 m against a
   * fixture at 3.90 and the arm would otherwise be a bracket into the sky.
   *
   * Where even the clamped height is under `HANG_FLOOR` the bodies are not
   * built at all, and the pavilion is the room that means: its back wall is a
   * 1.5 m thing you are meant to see over, there is no roof and nothing else
   * upstage of the band, and lowering a lantern to 1.25 m to meet the wall
   * would put it behind the drummer's head instead of over it. The two beams
   * still throw. A cone coming out of the dark above an open-air stage reads as
   * a lamp out of frame, which is honest; a can nailed to the night sky reads
   * as broken. Same call as the follow spot's below, for the same reason.
   */
  const backPos: Vector3[] = [];
  const backTarget: Vector3[] = [];
  /** Board space; see above. `backdropHeight` is measured from the ground. */
  const backWall = m.backdropHeight + m.houseY;
  /**
   * `stage-props.ts`'s `HANG_FLOOR`, which is private to that file. Restated
   * from the constant it is itself derived from, for the same reason
   * `HEAD_BAND` is restated from `cast.ts`: it is one addition either way, and
   * the alternative is this file importing the dressing.
   *
   * The lids twenty lines up say a lantern does not answer to `HANG_FLOOR`, and
   * that still holds — this asks it of the **wall**, not of the fixture. Can
   * this room carry a lantern above the band's heads at all? Where it cannot
   * there is nothing to bolt to, which is a different question from how low a
   * bolted fixture may hang.
   */
  const hangFloor = HEAD_BAND.hi + 0.25;
  const onWall = backWall - 0.25 >= hangFloor;
  const backY = Math.min(
    m.openingHeight - 0.5,
    stageLid - 0.35,
    onWall ? backWall - 0.25 : Infinity,
  );
  for (const side of [-1, 1]) {
    const at = new Vector3(side * m.width * 0.3, backY, m.backZ + 0.6);
    const to = new Vector3(side * m.width * 0.12, 0.1, m.lipZ * 0.25);
    backPos.push(at);
    backTarget.push(to);
    if (!onWall) continue;
    lantern(root, at, to, 0.22, backLens);
    const arm = new Mesh(kit.bevelBox(0.06, 0.06, 0.8, 0.02), yoke);
    arm.position.set(at.x, backY, m.backZ + 0.2);
    root.add(arm);
  }

  // Footlights: bulbs in a row along the lip.
  const bulbGeo = kit.geometry('bulb', () => new SphereGeometry(0.055, 8, 6));
  const footBodies: Mesh[] = [];
  for (let i = 0; i < MAX_FOOTS; i++) {
    const f = (i / (MAX_FOOTS - 1)) * 2 - 1;
    const bulb = new Mesh(bulbGeo, footLens);
    bulb.position.set(f * (m.width / 2 - 0.5), 0.10, m.lipZ - 0.24);
    root.add(bulb);
    footBodies.push(bulb);
    const shell = new Mesh(kit.bevelBox(0.17, 0.13, 0.1, 0.04), housing);
    shell.position.set(bulb.position.x, 0.065, m.lipZ - 0.16);
    root.add(shell);
  }

  /**
   * The follow spot's body, and the stem that carries it — see `fohPos`.
   *
   * `roomLid + 0.6` rather than `roomLid`, and the overshoot is load-bearing
   * rather than slack: `houseLid` is the *clear* height, not the plaster. The
   * hall publishes 5.10 because its ribs hang to 5.12, while the slab behind
   * them is at 5.52 and the ribs are a rib-gap apart, so a stem cut to the lid
   * ends 0.42 m short of anything wherever it lands between two of them. A stem
   * buried in a ceiling is invisible from below; a stem cut short is the bug
   * being fixed. It comes to exactly 0.90 m wherever `roomLid - 0.3` picks the
   * height — the cellars, the dancehall, the riihi, the sabha, the salon, the
   * shed, the hall, the roofed courtyard — and where `openingHeight + 1.35`
   * wins instead it is 1.05 to 1.55 m in the ballroom and 2.99 m in the concert
   * hall, against a 9.24 m plaster. The long one is a drop pipe, which is what
   * a follow spot under a very high ceiling actually hangs on.
   *
   * With no plaster there is nothing to draw and nothing to draw it *to*, so
   * the can is not built either. `spot` and `spotBeam` read `fohPos` directly
   * and neither of them cares, so what an open-sky room loses is one body it
   * had no business hanging: six metres up over the audience with 0.99 m of air
   * to the nearest object in the circuit, 2.41 m in the proscenium, 4.93 on the
   * lawn and 5.24 in the courtyard. Putting it on structure the room does have
   * — the `chandelier` precedent in `stage-props.ts`, fly height when the sky
   * is open — was the other candidate, and it buys a fixture at the wrong angle
   * to be a follow spot at all.
   */
  if (Number.isFinite(roomLid)) {
    lantern(root, fohPos, park, 0.3, spotLens);
    const stem = roomLid + 0.6 - fohPos.y;
    const drop = new Mesh(kit.bevelBox(0.07, stem, 0.07, 0.02), yoke);
    drop.position.set(fohPos.x, fohPos.y + stem / 2, fohPos.z);
    root.add(drop);
  }

  // The warm, on the pipe at centre. `warmPos` is the same point in world
  // space, for the beam.
  lantern(flyRig, new Vector3(0, barDrop, 0), new Vector3(warmPos.x, 0, warmPos.z), 0.24, warmLens);

  // --- beams --------------------------------------------------------------

  const segments = TIERS[quality].segments;
  const spotBeam = buildBeam(kit, segments, { sharpness: 2.1 });
  const warmBeam = buildBeam(kit, segments, { sharpness: 1.25 });
  const parBeams: Beam[] = [];
  for (let i = 0; i < MAX_PARS; i++) parBeams.push(buildBeam(kit, segments, { sharpness: 1.7 }));
  const backBeams: Beam[] = [];
  for (let i = 0; i < 2; i++) backBeams.push(buildBeam(kit, segments, { sharpness: 1.8 }));
  const allBeams: Beam[] = [spotBeam, warmBeam, ...parBeams, ...backBeams];
  for (const b of allBeams) root.add(b.mesh);

  // --- state --------------------------------------------------------------

  const rng = new Rng(`${venue.id}:lights`);
  const follow = new FollowSpot(reduced ? STEADY : OPERATOR, rng);
  follow.snap(park);

  /** Deterministic lamp flicker, one phase per par. Off under reduced motion. */
  const flickerPhase = parLocal.map(() => rng.float(0, Math.PI * 2));
  const flickerRate = parLocal.map(() => rng.float(0.7, 1.9));

  const subjects = new Map<string, Object3D>();
  let timeline: Timeline = buildTimeline(
    { cues: [], haze: 0, preset: 0 }, reduced ? CALM_MIN_FADE : 0,
  );
  let haze = 0;
  let density = beamDensity(0);
  const houseFader = makeFader(0);
  const masterFader = makeFader(1);
  let beat = 0;
  let elapsed = 0;

  const state = {} as Record<FixtureId, FixtureState>;
  for (const f of FIXTURES) state[f] = blankState();

  const warmAim = park.clone();
  const spotWanted = park.clone();

  const colour = new Color();
  const tmpA = new Vector3();
  const tmpB = new Vector3();
  const tmpC = new Vector3();
  const tmpD = new Vector3();
  const beamEnd = new Vector3();
  const measureA = new Vector3();
  const measureB = new Vector3();
  const measureC = new Vector3();

  applyShadow();

  // --- helpers ------------------------------------------------------------

  /** The point a beam should aim at for a performer, or `undefined`. */
  function subjectPoint(id: string | undefined, out: Vector3): Vector3 | undefined {
    if (!id) return undefined;
    const obj = subjects.get(id);
    if (!obj) return undefined;
    obj.getWorldPosition(out);
    out.y += aimHeight;
    return out;
  }

  function applyColour(target: Color, s: FixtureState): Color {
    return target.setRGB(s.colour.r, s.colour.g, s.colour.b, SRGBColorSpace);
  }

  /**
   * Carry a beam past its subject and onto the boards.
   *
   * A cone that stops at the player's chest ends in mid-air, which is the one
   * thing a real beam never does. Extending it to the floor also puts the hot
   * spot of the cone where an audience expects to see it — on the deck, sliding
   * as the operator catches up.
   */
  function toFloor(from: Vector3, through: Vector3, out: Vector3): Vector3 {
    out.copy(through).sub(from);
    let t = 1;
    if (out.y < -1e-3) t = (0.03 - from.y) / out.y;
    t = Math.max(1, Math.min(t, 3));
    return out.multiplyScalar(t).add(from);
  }

  function smoothstep(t: number): number {
    const x = t < 0 ? 0 : t > 1 ? 1 : t;
    return x * x * (3 - 2 * x);
  }

  function hex(s: FixtureState): string {
    const to255 = (v: number) => Math.max(0, Math.min(255, Math.round(v * 255)));
    return `#${((1 << 24) | (to255(s.colour.r) << 16) | (to255(s.colour.g) << 8)
      | to255(s.colour.b)).toString(16).slice(1)}`;
  }

  // --- the frame ----------------------------------------------------------

  function update(now: number, dt: number): void {
    beat = Number.isFinite(now) ? now : beat;
    const d = Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.1)) : 0;
    elapsed += d;

    for (const f of FIXTURES) evaluate(timeline[f], beat, state[f]!);

    const tier = TIERS[quality];
    /**
     * The grand master, applied to every fixture the score drives and to
     * nothing else. `state[f].intensity` stays exactly as the cue meant it, so
     * `readState` still reports the score rather than the fader — see
     * `FixtureReading`.
     */
    const master = stepFader(masterFader, d);

    // -- wash: a probe for the cover, a soft top light for the modelling ----
    const w = state.wash!;
    applyColour(colour, w);
    washHemi.color.copy(colour);
    washHemi.groundColor.copy(colour).multiplyScalar(0.28);
    // At `low` the top light is gone, so its energy folds into the probe rather
    // than the stage simply going darker when somebody picks the fast tier.
    washHemi.intensity = w.intensity * GAIN.washHemi * (tier.washTop ? 1 : 1.28) * master;
    washTop.color.copy(colour);
    washTop.intensity = tier.washTop ? w.intensity * GAIN.washTop * master : 0;
    washTop.visible = tier.washTop;

    const k = state.key!;
    key.color.copy(applyColour(colour, k));
    key.intensity = k.intensity * GAIN.key * master;

    const bk = state.back!;
    back.color.copy(applyColour(colour, bk));
    back.intensity = bk.intensity * GAIN.back * master;

    const ft = state.footlights!;
    foot.color.copy(applyColour(colour, ft));
    foot.intensity = ft.intensity * GAIN.foot * master;

    const cy = state.cyc!;
    cycGlow.set(applyColour(colour, cy), cy.intensity * GAIN.cyc * master);

    // -- the follow spot ---------------------------------------------------
    //
    // The score names a performer; where that performer is, and therefore how
    // long the beam takes to get there, is entirely this rig's. When the cue
    // names nobody — a release cue deliberately carries no id — the beam holds
    // its last position, because an operator whose cue has gone out takes their
    // hands off the lantern rather than swinging it back to centre.
    const sp = state.spot!;
    const wantSpot = subjectPoint(sp.follow, tmpA);
    if (wantSpot) spotWanted.copy(wantSpot);
    follow.update(d, spotWanted, wantSpot ? sp.follow : undefined);
    spot.color.copy(applyColour(colour, sp));
    spot.intensity = sp.intensity * GAIN.spot * master;
    spot.target.position.copy(follow.aim);
    spot.target.updateMatrixWorld();

    // -- the warm ----------------------------------------------------------
    //
    // Deliberately *not* the same mechanism. It interpolates between the player
    // it was on and the player the cue names, in beat space, over the cue's own
    // `fadeBeats` — which ambient sets to twelve. No lag, no overshoot, no
    // tremor: it is a console fade that happens to move, and at 60 BPM it takes
    // twelve seconds, which is slower than anybody can watch happening. A
    // follow spot it is not, and cannot become by being retuned.
    const wm = state.warm!;
    if (!wm.follow) {
      // Nothing is being favoured, so there is nothing to remember either. A
      // fixture that held its last aim across a seek would make the warm's
      // position depend on history, and the whole point of doing its travel in
      // beat space is that it does not.
      warmAim.copy(park);
    } else {
      const to = subjectPoint(wm.follow, tmpB);
      // A named subject the cast no longer contains: hold rather than swing to
      // the middle of an empty stage.
      if (to) {
        const fromPoint = subjectPoint(wm.fromFollow, tmpC) ?? park;
        warmAim.copy(fromPoint).lerp(to, smoothstep(wm.progress));
      }
    }
    warm.color.copy(applyColour(colour, wm));
    warm.intensity = wm.intensity * GAIN.warm * master;
    warm.position.set(warmAim.x, warmAim.y + WARM_LAMP_HEIGHT, warmAim.z);
    warm.updateMatrixWorld();

    // -- lamps -------------------------------------------------------------
    //
    // Emissive bodies are what make a rig read as a rig rather than as light
    // arriving from nowhere, and they are three small meshes each.
    const parDrive = Math.min(1, w.intensity * 0.55 + k.intensity * 0.65) * master;
    applyColour(colour, w);
    parLens.color.copy(colour).multiplyScalar(0.05 + 0.95 * parDrive);
    backLens.color.copy(applyColour(colour, bk)).multiplyScalar(0.05 + 0.95 * bk.intensity * master);
    footLens.color.copy(applyColour(colour, ft)).multiplyScalar(0.05 + 0.95 * ft.intensity * master);
    spotLens.color.copy(applyColour(colour, sp)).multiplyScalar(0.05 + 0.95 * sp.intensity * master);
    warmLens.color.copy(applyColour(colour, wm)).multiplyScalar(0.05 + 0.95 * wm.intensity * master);

    for (let i = 0; i < MAX_FOOTS; i++) footBodies[i]!.visible = i < tier.foots;

    // -- beams -------------------------------------------------------------
    const spotAlpha = density * BEAM_SCALE.spot * sp.intensity * master;
    spotBeam.aim(fohPos, toFloor(fohPos, follow.aim, beamEnd), SPOT_ANGLE * 1.25);
    spotBeam.set(applyColour(colour, sp), spotAlpha);

    warmBeam.aim(warmPos, toFloor(warmPos, warmAim, beamEnd), WARM_BEAM_ANGLE);
    warmBeam.set(applyColour(colour, wm), density * BEAM_SCALE.warm * wm.intensity * master);

    applyColour(colour, w);
    for (let i = 0; i < MAX_PARS; i++) {
      const b = parBeams[i]!;
      if (i >= tier.parBeams) { b.set(colour, 0); continue; }
      // A tenth of a stop of wander on each lamp, out of phase. Tungsten in a
      // room with people moving through it is never perfectly steady, and a rig
      // in which every lantern is identical reads as rendered.
      const fl = reduced ? 1 : 1 + Math.sin(elapsed * flickerRate[i]! + flickerPhase[i]!) * 0.035;
      b.aim(parWorld[i]!, parTarget[i]!, 0.2);
      b.set(colour, density * BEAM_SCALE.par * parDrive * fl);
    }

    applyColour(colour, bk);
    for (let i = 0; i < backBeams.length; i++) {
      const b = backBeams[i]!;
      if (i >= tier.backBeams) { b.set(colour, 0); continue; }
      b.aim(backPos[i]!, backTarget[i]!, 0.22);
      b.set(colour, density * BEAM_SCALE.back * bk.intensity * master);
    }

    // -- the house ---------------------------------------------------------
    houseHemi.intensity = stepFader(houseFader, d) * GAIN.house;
  }

  // --- measurement --------------------------------------------------------

  /**
   * A punctual light's contribution at a point, following three's own falloff:
   * `1 / d^decay`, windowed by `distance`, times the spot cone where there is
   * one. No normal, no shadow test — it answers "is this player lit", which is
   * what an isolation test and an auto-exposure both want.
   */
  function punctual(s: SpotLight | PointLight, at: Vector3): number {
    if (s.intensity <= 0) return 0;
    const from = s.getWorldPosition(measureA);
    const dir = measureB.copy(at).sub(from);
    const dist = dir.length();
    if (dist < 1e-4) return s.intensity;
    dir.divideScalar(dist);

    let cone = 1;
    if ((s as SpotLight).isSpotLight) {
      const sp = s as SpotLight;
      const axis = measureC.copy(sp.target.getWorldPosition(tmpD)).sub(from);
      if (axis.lengthSq() < 1e-8) return 0;
      axis.normalize();
      const cosAngle = Math.cos(sp.angle);
      const cosPenumbra = Math.cos(sp.angle * (1 - sp.penumbra));
      const c = dir.dot(axis);
      if (cosPenumbra <= cosAngle) {
        cone = c >= cosAngle ? 1 : 0;
      } else {
        const t = Math.max(0, Math.min(1, (c - cosAngle) / (cosPenumbra - cosAngle)));
        cone = t * t * (3 - 2 * t);
      }
      if (cone <= 0) return 0;
    }

    let falloff = 1 / Math.max(Math.pow(dist, s.decay), 0.01);
    if (s.distance > 0) {
      const wnd = Math.max(0, Math.min(1, 1 - Math.pow(dist / s.distance, 4)));
      falloff *= wnd * wnd;
    }
    return s.intensity * cone * falloff;
  }

  // --- the rig ------------------------------------------------------------

  const rig: LightRig = {
    root,

    begin(score: LightingScore): void {
      timeline = buildTimeline(score, reduced ? CALM_MIN_FADE : 0);
      haze = Math.max(0, Math.min(1, score.haze));
      density = beamDensity(haze);
      beat = 0;
      for (const f of FIXTURES) evaluate(timeline[f], 0, state[f]!);
      // The beam is not re-parked. Between numbers the operator's lantern is
      // wherever they left it, and the first pickup of the next number should
      // travel from there — which is also the only way the audience sees it
      // travel at all on a number whose first solo is early.
    },

    setSubjects(next: Map<string, Object3D>): void {
      subjects.clear();
      for (const [id, obj] of next) subjects.set(id, obj);
    },

    update,

    setHouse(level: number, seconds?: number): void {
      setFader(houseFader, level, seconds);
      houseHemi.intensity = houseFader.value * GAIN.house;
    },

    setMaster(level: number, seconds?: number): void {
      setFader(masterFader, level, seconds);
    },

    setQuality(q: Quality): void {
      if (q === quality) return;
      quality = q;
      const tier = TIERS[q];
      for (const b of allBeams) b.setSegments(tier.segments);
      // Bodies for lanterns that are not lit at this tier stay hanging: an
      // empty bar is a stranger sight than a dark lantern, and they are three
      // triangles' worth of silhouette either way.
      applyShadow();
      update(beat, 0);
    },

    readState(): LightRigState {
      const fixtures = {} as Record<FixtureId, FixtureReading>;
      for (const f of FIXTURES) {
        const s = state[f]!;
        fixtures[f] = { intensity: s.intensity, colour: hex(s), follow: s.follow };
      }
      return {
        beat,
        house: houseFader.value,
        master: masterFader.value,
        haze,
        quality,
        fixtures,
        spotAim: [follow.aim.x, follow.aim.y, follow.aim.z],
        spotWanted: [follow.wanted.x, follow.wanted.y, follow.wanted.z],
        spotError: follow.error(),
        warmAim: [warmAim.x, warmAim.y, warmAim.z],
        shadowCasters: (key.castShadow ? 1 : 0) + (spot.castShadow ? 1 : 0),
      };
    },

    measure(point: Vector3): number {
      let sum = washHemi.intensity * 0.5 + houseHemi.intensity * 0.5;
      for (const d of [washTop, key, back, foot]) {
        if (d.visible) sum += d.intensity;
      }
      sum += punctual(spot, point) + punctual(warm, point);
      return sum;
    },

    dispose(): void {
      root.removeFromParent();
      flyRig.removeFromParent();
      for (const node of [root, flyRig]) {
        node.traverse((obj) => {
          const mesh = obj as Partial<Mesh>;
          if (mesh.geometry) mesh.geometry.dispose();
          const mat = mesh.material;
          if (Array.isArray(mat)) for (const one of mat) one.dispose();
          else if (mat) mat.dispose();
        });
      }
      // Shadow maps are render targets and are not reachable by traversal.
      key.shadow.dispose();
      spot.shadow.dispose();
      kit.dispose();
      root.clear();
      flyRig.clear();
    },
  };

  return rig;
}
