/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The stage — boards, apron, lip, riser, props, audience, air. And a room round
 * them, built by somebody else.
 *
 * `Venue` in, a scene graph out. This file makes no decision the Performance
 * IR could have made instead: every dimension comes from `venue.width` and
 * `venue.depth`, every colour from `venue.palette`, every piece of dressing
 * from `venue.props`, the crowd from `venue.audience` and the air from
 * `venue.fog`.
 *
 * Everything that is random — where a plank's colour lands, which seats are
 * taken, where a flight case sits — draws from `Venue.id` through
 * `core/rng.ts`, in a named stream per subsystem. Same venue, same room, down
 * to the last moth. Adding a prop cannot reshuffle the audience.
 *
 * ## Why there is a room seam now, having deliberately not had one
 *
 * This file used to say, with some pride, that there was no genre switch
 * anywhere in the directory: a lakeside pavilion and a black box differed only
 * in the numbers and strings `venue.ts` chose, and that was what made the two
 * halves separable. It was true and it was the right call while three genres
 * shared one building. It stopped being true at fourteen.
 *
 * A `StageRoom` could say two dimensions, five colours, a fog number, an
 * audience and a list of props, and four of the props changed how the room was
 * *built* — `black-box`, `open-air`, `brick`, `low-ceiling`. Everything else a
 * room could be was paint. So a concert hall, a walled courtyard, a threshing
 * barn, an arena and a dancehall came out architecturally identical, and they
 * read as reskins because they *were* reskins. Ten genre authors wrote data
 * because data was all the system could accept, and the missing thing was a
 * seam rather than effort.
 *
 * So the building moved out to `rooms/`, one file per architecture, on the
 * model `instruments/` has used since it had two models in it. What did not
 * move is everything below, and the line between them is argued at length in
 * `rooms/types.ts`. In one sentence: **the stage is the part of the picture
 * some other file already has an opinion about, and the room is the part
 * nothing else has an opinion about.** `cast.ts` stands people on the boards,
 * `cables.ts` routes leads inside them, `show.ts` raises the riser, `camera.ts`
 * frames the crowd — none of them can see the scene graph and several of them
 * restate this file's constants by hand, so the boards, the apron, the lip, the
 * props, the audience and the air are a *datum* and no room may argue with
 * them. The walls, the ceiling, the backdrop, the arch, the masking, the pipe
 * and the cloth are things nothing outside asks a question about, and they are
 * handed over whole.
 *
 * A `StageRoom` that names no architecture gets `proscenium`, which is this
 * file as it stood, lifted out unchanged. That fallback is load-bearing, and it
 * used to be load-bearing for almost everything: **thirteen of the fourteen
 * rooms still use it** was true on the day the seam was cut and has been
 * overtaken twice, by eleven room authors and by five more genres. Counted now,
 * three of the nineteen genre rooms name no architecture — ambient's black box,
 * iskelmä's pavilion and jazz's cellar — plus `venue.ts`'s own `HOUSE`, which no
 * genre reaches. Nine of the catalogue's seventy-two venue dressings come out of
 * this file. The sentence is kept because the *reason* has not moved an inch: a
 * genre added in a hurry still stages, and three rooms that never asked for a
 * builder still get the one they were written against.
 *
 * ## What the show runner drives
 *
 * ```ts
 * const stage = buildStage(concert.venue);
 * scene.add(stage.root);
 * scene.fog = stage.fog;              // venue.fog, not the lighting haze
 * lights.hangFrom(stage.flyBar);      // the rig owns fixtures; this is the pipe
 *
 * stage.setCurtain(1);                // gathers over ~3s; poll curtainOpen()
 * stage.applaud(0.8);                 // between numbers
 * stage.setAttention(1);              // a solo — the house leans in
 * stage.gasp();                       // a tomato lands
 *
 * stage.update(beat, dt);             // once a frame, with the one clock
 * stage.dispose();                    // strike
 * ```
 *
 * ## Lights and shadows
 *
 * This file adds no lights — the lighting rig owns all of them, including the
 * single shadow-casting spot the budget allows. What it does is decide what
 * casts and what receives: the boards, the backdrop and the risers receive;
 * chunky floor props cast; the curtain and the audience do neither. A curtain
 * that casts a shadow needs its vertex displacement duplicated into the depth
 * material for no visible gain, and an audience that receives one stops being
 * a silhouette.
 *
 * That policy is now half in a file this one does not own, because the backdrop
 * and the walls went to `rooms/`. It could not be enforced from here — three.js
 * takes the flags off the meshes, so there is nothing to check and nothing to
 * collect — so it is stated in `rooms/types.ts` as a rule a room obeys, in the
 * same terms, and it is the first thing a room author is told to read.
 */

import {
  type Camera, Color, DoubleSide, Fog, Group, Mesh, type Object3D,
  type PerspectiveCamera, PlaneGeometry, ShaderMaterial, Vector3,
} from 'three';

import { Rng } from '../../core/rng.js';
import type { Venue } from '../../concert/types.js';
import { roomFor } from './rooms/index.js';
import type { RoomDatum, RoomRig } from './rooms/types.js';
import { buildAudience, crowdExtent, rowGap, type AudienceRig } from './stage-audience.js';
import {
  blend, cellPlane, shade, tint,
  Kit, type Quality, type StageMetrics,
} from './stage-kit.js';
import { dressStage, readProps, type PropRig, type PropSolid } from './stage-props.js';

export { SUPPORTED_PROPS } from './stage-props.js';
export { normaliseProp, unknownProps } from './stage-props.js';
export type { PropName, PropSolid } from './stage-props.js';
export type { Quality, StageMetrics } from './stage-kit.js';

/**
 * One beam, as the air sees it: a cone with a colour on it.
 *
 * The light rig builds these; see `StageRig.setAir`. Nothing here knows what
 * fixture it came from, and it does not need to — a cone and a gel is the whole
 * of what haze can answer to.
 */
export interface AirBeam {
  /** Apex, world space. */
  from: Vector3;
  /** Unit vector down the throw. */
  dir: Vector3;
  /** Cosine of the half angle. Compared against, never taken an acos of. */
  cos: number;
  /** The gel, already scaled by how hard the fixture is running. Black is off. */
  colour: Color;
}

/**
 * How many of them the haze will look at. The rig has a dozen beams and sends
 * its two punctual ones, which are the two that are *shaped* — a par wash
 * covers the stage evenly enough that lighting the fog by it would only tint
 * everything, which is not what a shaft is.
 */
const AIR_BEAMS = 2;

/**
 * How hard a bank of haze falls off from the middle to its rim.
 *
 * A chord through a sphere is `sqrt(1 - d^2)`, which stands almost straight up
 * at the rim and would give the fog an edge you can point at. The flat cards
 * this replaces used `smoothstep(1.0, 0.1, d)` squared instead, with no
 * geometric justification and a much softer shoulder, and it looked like fog.
 * `(1 - d^2)` raised to this power is that curve to within 0.03 across the
 * whole of it, which is the closest a term with the volume in it gets to what
 * was being looked at before.
 */
const HAZE_SOFT = 3.55;

export interface StageOptions {
  quality?: Quality;
  /**
   * Override the `prefers-reduced-motion` query. Headless callers must pass
   * it, since there is no `matchMedia` outside a browser.
   */
  reducedMotion?: boolean;
}

export interface StageRig {
  /** Everything the stage owns. Add it to the scene; nothing else touches it. */
  root: Group;
  /**
   * Atmospheric fog from `venue.fog`, ready to assign to `scene.fog`. Separate
   * from the lighting haze by design — this is how far away the back wall
   * feels, not whether you can see the beams.
   */
  fog: Fog;
  /**
   * The pipe over the stage. The lighting rig hangs its fixtures on this.
   *
   * Built by the room, because what a lamp is bolted to is architecture — a
   * theatre flies it, a cellar bolts it to the soffit, a courtyard strings a
   * wire wall to wall. It is present in every room, including the ones with
   * nothing to fly from, so `lights.ts` never has to ask which kind it is. See
   * `RoomRig.flyBar`.
   */
  flyBar: Object3D;
  /** Dimensions worked out from the venue; the camera and tomatoes want these. */
  metrics: StageMetrics;
  /** Props recognised and placed, and the strings that were ignored. */
  dressing: {
    placed: readonly string[];
    ignored: readonly string[];
    /**
     * Every solid piece of dressing, for anything that has to collide with
     * the furniture. See `PropRig.solids`.
     */
    solids: readonly PropSolid[];
  };

  /**
   * Where the curtain should be: 0 closed, 1 fully gathered.
   *
   * A *target*, not a pose. The cloth takes about three seconds over a full
   * traverse and eases at both ends, because a curtain has weight and the
   * hem trails the track. Driving it every frame with your own ramp also
   * works — it will track with a small lag, which still looks right.
   *
   * In a room with no curtain it lands instantly and `curtainOpen()` reports
   * the target on the same frame, so a caller polling for the reveal never
   * stalls. See `RoomRig.curtain` — the runner does not branch, and it should
   * not start.
   */
  setCurtain(open: number): void;
  /** Jump there. For resetting between numbers, not for showing anybody. */
  snapCurtain(open: number): void;
  /** Where the cloth actually is. Poll it to know when the reveal has landed. */
  curtainOpen(): number;

  /** A burst of applause, 0..1, which rises fast and dies over a few seconds. */
  applaud(intensity: number): void;
  /** The tomato reaction: a recoil that travels back through the house. */
  gasp(): void;
  /** Sustained: a solo leans the house in and stills it. 0 relaxed, 1 rapt. */
  setAttention(level: number): void;

  /**
   * Whether the drum platform is standing, for the number about to go on.
   *
   * The room owns the riser and the cast owns the drummer, so only the runner
   * knows whether the two agree — call it from wherever the band is staged,
   * with `true` when somebody on this number has `Station.riser` above zero.
   * A room without a riser in its props ignores it. See `stage-props.ts`.
   */
  showRiser(on: boolean): void;

  /**
   * Which ground-stacked PA columns are standing, for the number about to go
   * on. Same bargain as `showRiser` one prop over: the room owns the stack and
   * the cast owns the floor it is standing in, and only the runner sees both.
   *
   * Pass where every performer is and how much room they take — `r` is the gear
   * and not the body, because a modular is a metre of cabinets and is the one
   * thing that ever wants this corner. A room without `pa-ground` in its props
   * ignores it. See `stage-props.ts`.
   */
  showPa(cast: readonly { x: number; z: number; r: number }[]): void;

  /**
   * Where the light is in the air, so the haze can be in it.
   *
   * The banks are drawn, not lit — nothing in the scene's lighting reaches
   * them — which left one sitting in the middle of the follow spot exactly as
   * grey as one in the wings. This is the light rig telling the air what it is
   * doing: the beams are read at the point each pixel looks through, and where
   * that point is inside a cone the haze picks up the gel. Fog outside every
   * cone is untouched, so a rig doing nothing leaves the banks as they were.
   *
   * Call it every frame, after the beams have been aimed. At most `AIR_BEAMS`
   * are read and the rest ignored; the array and its contents are copied, so
   * the caller can keep one and rewrite it.
   */
  setAir(beams: readonly AirBeam[]): void;

  /** Audience size, haze card count. Cheap to change at any time. */
  setQuality(q: Quality): void;
  /** How many people are being drawn. */
  audienceCount(): number;

  /** Once a frame. `now` is song position in beats, from the one clock. */
  update(now: number, dt: number): void;
  dispose(): void;
}

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function buildStage(venue: Venue, opts: StageOptions = {}): StageRig {
  const quality: Quality = opts.quality ?? 'high';
  const reducedMotion = opts.reducedMotion ?? prefersReducedMotion();
  const kit = new Kit();
  const p = venue.palette;
  const props = readProps(venue.props);
  const extraHaze = props.has('haze');

  const width = Math.max(4, venue.width);
  const depth = Math.max(3, venue.depth);
  const rows = Math.max(1, Math.min(16, Math.round(venue.audience.rows)));

  /**
   * The stage, before the room has been asked anything.
   *
   * Every number here is a function of `Venue` alone, and none of them is a
   * room's to argue with — these are what `cast.ts`, `cables.ts` and
   * `camera.ts` have already committed to, from the other side of a boundary
   * none of them can see across. See `RoomDatum`.
   */
  const datum: RoomDatum = {
    venue,
    width,
    depth,
    lipZ: depth / 2,
    backZ: -depth / 2,
    houseDepth: 2.6 + rows * rowGap(venue.audience.seated),
    houseWidth: width + 4,
    props,
  };

  /**
   * Ask the building what shape it is, before building anything.
   *
   * This has to happen in two steps and the reason is `crowd`: the audience is
   * solved from the house floor, the house floor is a stage height below the
   * boards, and how high the boards stand is a room decision — a cellar puts
   * the band on a kerb and a theatre puts them on a stage. So the metrics
   * cannot be finished until the room has spoken, and the room cannot be built
   * until the metrics are finished. `shape()` is pure and builds nothing, which
   * is what lets the sequence be that way round rather than handing a room a
   * half-filled `StageMetrics` with a note about which fields are not real yet.
   */
  const room = roomFor(venue.architecture);
  const shape = room.shape(datum);
  const rise = shape.rise;

  const m: StageMetrics = {
    width,
    depth,
    lipZ: datum.lipZ,
    backZ: datum.backZ,
    houseY: -rise,
    openingWidth: shape.openingWidth,
    openingHeight: shape.openingHeight,
    curtainZ: shape.curtainZ,
    flyY: shape.flyY,
    houseDepth: datum.houseDepth,
    houseWidth: datum.houseWidth,
    /**
     * The lid, published so the camera can stay under it. `Infinity` is not a
     * cop-out here: most of these rooms genuinely have nothing overhead, and a
     * height nobody can reach is the honest way to say so — every consumer of
     * this wants a `Math.min` and gets the right answer for free.
     *
     * A room with two ceilings publishes the **lower** of them. A camera solved
     * against the house lid would clear it and then put its lens through the
     * soffit the moment the shot moved over the boards, which is the original
     * bug with an extra step in it. Every consumer wanting the worst case is
     * exactly why one number can still say this — and why `houseLid` beside it
     * has to be a second number rather than a guess made from this one.
     */
    headroom: shape.headroom,
    houseLid: shape.houseLid,
    rigLid: shape.rigLid,
    backdropHeight: shape.backdropHeight,
    wallX: shape.wallX,
    crowd: crowdExtent(venue.audience, -rise, depth / 2),
  };

  const root = new Group();
  root.name = `stage:${venue.id}`;

  // --- the boards --------------------------------------------------------
  // One geometry, per-plank vertex colours, a crisp seam at every join and no
  // texture anywhere. See `cellPlane` — this is the whole texturing strategy.
  const boardRng = new Rng(`${venue.id}:boards`);
  const planks = Math.max(8, Math.round(width / 0.42));
  const boards = new Mesh(
    kit.own(cellPlane({
      width, height: depth, cols: planks, rows: 1,
      colour: p.boards, jitter: 0.085, rng: boardRng,
    })),
    /**
     * Sealed timber, not chalk.
     *
     * At 0.86 the deck had no specular lobe worth the name, so the largest
     * surface in every shot returned nothing but flat diffuse — the same value
     * whichever fixture was up and wherever the camera stood. A stage floor is
     * varnished or sealed, and the smeared reflection of the rig along it is
     * one of the few cues in a concert image that says the lights are *in* the
     * room rather than painted onto the people.
     *
     * 0.52 is broad enough to stay a sheen rather than a mirror: the boards
     * pick up the key, the back light and the follow spot as soft elongated
     * pools, and pick up the environment barely at all now that it is at 0.16.
     * The apron below keeps its 0.9 — that face is painted, and usually black.
     */
    kit.solid('#ffffff', { vertexColors: true, rough: 0.52 }),
  );
  boards.rotation.x = -Math.PI / 2;
  boards.receiveShadow = true;
  root.add(boards);

  // The apron: the face of the stage below the lip, and the reason the house
  // reads as being *below* the band rather than on the same floor.
  const apron = new Mesh(
    kit.bevelBox(width, rise, depth, 0.04),
    kit.solid(shade(p.boards, 0.55), { rough: 0.9 }),
  );
  apron.position.set(0, -rise / 2 - 0.006, 0);
  apron.receiveShadow = true;
  root.add(apron);

  const lip = new Mesh(
    kit.bevelBox(width + 0.12, 0.09, 0.2, 0.035),
    kit.solid(shade(p.proscenium, 0.25), { rough: 0.6 }),
  );
  lip.position.set(0, -0.02, m.lipZ + 0.04);
  root.add(lip);

  // --- the room ----------------------------------------------------------
  /**
   * The building, handed over whole.
   *
   * Everything above this line is the datum — the boards a solver stood a band
   * on, the apron that makes the house read as below them, the lip. Everything
   * the room owns is inside its own group, added here, in the place the
   * architecture used to be built: after the boards and before the audience, so
   * a room's walls sort exactly where the walls always sorted.
   *
   * It shares the `Kit`, so a wall and a backdrop of the same colour are one
   * material and one `dispose()` frees both. It gets the finished metrics
   * rather than deriving its own, so it cannot disagree with the numbers the
   * rest of the show is already using. And its RNG streams are named off
   * `venue.id` in the same flat namespace this file uses — `rooms/types.ts`
   * lists which tags are taken, because keeping `housefloor`, `backdrop` and
   * `walls` spelled as they always were is the whole reason **thirteen rooms
   * come out unchanged**. That was the count on the day of the cut and it is
   * three now, ambient, iskelmä and jazz being the rooms that still name no
   * architecture; the spellings are kept anyway, because the argument was never
   * about how many rooms it saved. Reseeding a stream is not a refactor, it is a
   * different building.
   */
  const built: RoomRig = room.build({
    ...datum,
    kit,
    m,
    quality,
    reducedMotion,
    rng: (tag: string) => new Rng(`${venue.id}:${tag}`),
  });
  root.add(built.root);
  const curtain = built.curtain;

  // --- the house ---------------------------------------------------------
  const audience: AudienceRig = buildAudience({
    kit,
    venue,
    houseY: m.houseY,
    lipZ: m.lipZ,
    houseWidth: m.houseWidth,
    quality,
    reducedMotion,
  });
  root.add(audience.root);

  // --- dressing ----------------------------------------------------------
  const dressed: PropRig = dressStage({ kit, venue, metrics: m, quality, reducedMotion });
  root.add(dressed.root);

  // --- air ---------------------------------------------------------------
  const fogAmount = Math.max(0, Math.min(1, venue.fog));
  const fogColour = shade(blend(p.ambient, p.backdrop, 0.55), 0.35);
  const fog = new Fog(fogColour, 14 - 12 * fogAmount, 78 - 56 * fogAmount);

  /**
   * Banks of air near the boards, for the fog the `Fog` cannot do: a depth cue
   * is not the same thing as smoke lying in a beam.
   *
   * Each one is an **ellipsoid**, solved per fragment the way `lights-beams.ts`
   * solves its cones: the alpha is how far the view ray travels inside the
   * volume, so it thickens through the middle and thins to nothing at the rim
   * from wherever it is looked at.
   *
   * It used to be a quad and no volume: a card facing the house, because that
   * is where the camera lives. It lives there most of the time. The times it
   * does not were a flat sheet of paper hanging over the drummer, thinning as
   * it turned and gone edge-on, and the fog going with it.
   *
   * The quad is still there and is now a proxy and nothing else — something to
   * rasterise, whose only job is to be at least as big on screen as the volume
   * behind it. **The shader never reads where it is**: the centre comes in as a
   * uniform, so `face()` can put the quad wherever it has to and none of that
   * reaches the picture. Which is the whole trick, because a quad hung on the
   * bank stops being able to cover it once the camera is close enough, and a
   * quad pinned across the frustum covers it from anywhere but has no business
   * being anywhere else. `face()` switches between them and the switch is
   * invisible: same volume, same ray, same answer, drawn on a different screen.
   *
   * The ellipsoid is wide, low and deep enough to read from the side, which is
   * the shape smoke pooled on boards actually has, and it is *not* turned by
   * `face()`: haze lies where the room puts it whatever the camera does. Seen
   * from the house it is the ellipse the card was, to the same falloff —
   * `HAZE_SOFT` is fitted to the old `smoothstep` — so the shot this was tuned
   * in is the one shot that did not change.
   */
  const hazeCards: { mesh: Mesh; centre: Vector3; drift: number; phase: number; x: number }[] = [];
  const cardCount = fogAmount < 0.08 && !extraHaze
    ? 0
    : (quality === 'low' ? 4 : quality === 'medium' ? 7 : 10);
  /** Set below when there is haze to light. A room with none ignores the rig. */
  let takeAir: ((beams: readonly AirBeam[]) => void) | undefined;
  if (cardCount > 0) {
    /**
     * Half-axes, and the count above is the other half of them: ten smaller
     * banks rather than six large ones, which took three goes to arrive at.
     *
     * A card is a plane, so the first pass kept its width and gave it just
     * enough depth to be a bank — four times longer than deep, which put a
     * quarter as much fog on screen from the wings as from the house. Rounding
     * that out fixed the wings and broke something worse: a bank big enough to
     * read from every side is big enough to stand in, and across the camera's
     * own envelope — 1.4 to 3.6 m up, one to eight metres out — the lens was
     * *inside* one in 18% of shots, six at once at worst. Every one of those is
     * a proxy pinned to the frustum, which is haze that stops respecting depth
     * and reads as fog appearing out of nowhere when a shot pushes in.
     *
     * Smaller and lower is what has none of the three problems. Round enough to
     * hold up side-on, low enough to be under the lens rather than round it —
     * which is where haze belongs anyway, since it pools — and enough of them
     * that the stage still reads as hazy. Measured over the same envelope, the
     * camera is inside one in 2% of shots, and never inside more than two.
     *
     * Both spans are cut from the room, because a bank deeper than the boards
     * it lies on has nowhere to sit that is not around the camera.
     */
    const semi = new Vector3(width * 0.20, 0.6, Math.min(1.6, depth * 0.25));
    const air = {
      from: Array.from({ length: AIR_BEAMS }, () => new Vector3()),
      dir: Array.from({ length: AIR_BEAMS }, () => new Vector3(0, -1, 0)),
      // Cosine of nothing: a zero-width cone contains no point, so an untouched
      // slot is off rather than lighting the whole stage.
      cos: Array.from({ length: AIR_BEAMS }, () => 1),
      colour: Array.from({ length: AIR_BEAMS }, () => new Color(0, 0, 0)),
    };
    /**
     * One material per bank, because each needs its own `uCentre` and the quad
     * can no longer carry it. Everything else is the same uniform *object* in
     * all of them, so the rig writes the beams once and three compiles the one
     * program; the cost of the split is six uploads of numbers that are already
     * in hand.
     */
    const shared = {
      uColour: { value: new Color(tint(fogColour, 0.35)) },
      // Up a third on the flat cards' number, because ten of these hold about
      // three fifths of the air six of the first banks did and a ray crosses
      // fewer of them. The one number here that is a guess rather than a
      // measurement, and the one to turn if the house shot reads thin.
      uOpacity: { value: (0.135 + fogAmount * 0.35) * (extraHaze ? 1.5 : 1) },
      uSemi: { value: semi },
      uAirFrom: { value: air.from },
      uAirDir: { value: air.dir },
      uAirCos: { value: air.cos },
      uAirCol: { value: air.colour },
    };
    const hazeMat = (centre: Vector3): ShaderMaterial => kit.own(new ShaderMaterial({
      uniforms: { ...shared, uCentre: { value: centre } },
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      vertexShader: /* glsl */ `
        varying vec3 vWorld;
        void main() {
          vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColour; uniform float uOpacity; uniform vec3 uSemi;
        uniform vec3 uCentre;
        uniform vec3 uAirFrom[${AIR_BEAMS}];
        uniform vec3 uAirDir[${AIR_BEAMS}];
        uniform float uAirCos[${AIR_BEAMS}];
        uniform vec3 uAirCol[${AIR_BEAMS}];
        varying vec3 vWorld;
        void main() {
          // Divide out the half-axes and the ellipsoid is the unit sphere, so
          // the chord is what it always is on a sphere: 1 - d^2 under a root,
          // d being how close to the centre the ray passes.
          vec3 o = (cameraPosition - uCentre) / uSemi;
          vec3 dir = normalize((vWorld - cameraPosition) / uSemi);
          float mid = -dot(o, dir);
          float off = max(1.0 - (dot(o, o) - mid * mid), 0.0);
          // Shaped to what the flat card's falloff looked like, which is a good
          // deal softer at the rim than bare haze would be. ${HAZE_SOFT.toFixed(2)} is a fit.
          float a = pow(off, ${HAZE_SOFT.toFixed(2)});
          // Only the part of that chord in front of the camera is in the
          // picture. Without this a bank the camera has drawn level with holds
          // full strength on the pixels where half of it is already behind.
          float reach = sqrt(off);
          a *= reach > 0.0 ? clamp((mid + reach) / (2.0 * reach), 0.0, 1.0) : 0.0;

          // Where this pixel looks through the bank, in world space: one sample
          // standing for the whole crossing, taken at its middle. Every beam
          // holding that point adds its gel, so the shaft is drawn where the
          // cone actually is, not over the bank as a whole. Softened over the
          // outer part of the cone, because smoke has no edge.
          vec3 held = (o + mid * dir) * uSemi + uCentre;
          vec3 lit = vec3(0.0);
          for (int i = 0; i < ${AIR_BEAMS}; i++) {
            vec3 v = held - uAirFrom[i];
            float along = dot(v, uAirDir[i]);
            float cosOff = along / max(length(v), 1e-4);
            lit += uAirCol[i] * step(0.0, along)
              * smoothstep(uAirCos[i], mix(uAirCos[i], 1.0, 0.4), cosOff);
          }
          gl_FragColor = vec4(uColour + lit, a * uOpacity);
        }`,
    }));
    takeAir = (beams): void => {
      for (let i = 0; i < AIR_BEAMS; i++) {
        const beam = beams[i];
        if (!beam) { air.colour[i]!.setRGB(0, 0, 0); continue; }
        air.from[i]!.copy(beam.from);
        air.dir[i]!.copy(beam.dir);
        air.cos[i] = beam.cos;
        air.colour[i]!.copy(beam.colour);
      }
    };
    const cardGeo = kit.geometry('haze', () => new PlaneGeometry(1, 1));
    const hazeRng = new Rng(`${venue.id}:haze`);
    const right = new Vector3(), up = new Vector3(), fwd = new Vector3();
    const eye = new Vector3(), look = new Vector3();

    /**
     * Where the hung proxy gives out, as a multiple of the distance from the
     * bank's centre to its near tip. 1 is the surface; the correction below is
     * `r / (r - 1)`, so this is also the cap: 1.06 needs a quad 17.7 times the
     * flat silhouette, and past it the arithmetic runs away rather than
     * degrading. Under it the frustum proxy takes over.
     */
    const HUNG_TO = 1.06, HUNG_CAP = HUNG_TO / (HUNG_TO - 1);
    /**
     * Nearest the frustum proxy may come to the lens. It otherwise stands at
     * the bank's own near surface, which is the whole of why: a quad at the
     * near plane is in front of the entire scene and the haze on it lays over
     * everyone standing between the camera and the fog, while a quad at the
     * surface is only in front of what the fog is in front of. This number is
     * reached when that surface is behind the lens, which is to say when the
     * camera is in the bank, and then laying over everything is the picture.
     */
    const PINNED_NEAREST = 0.25;

    /**
     * Put the proxy where it can be rasterised, which is one of two places.
     *
     * **Hung on the bank**, sized to its silhouette: the half-width along a
     * screen axis is the volume's own extent along it, times the perspective
     * the flat projection leaves out. That correction is the ratio of the
     * distance to the centre and the distance to the near tip — 17% on a bank
     * seen from the house, 270% on one seen end-on from the wings, where five
     * of its ten metres are between the camera and its middle — and it goes to
     * infinity at the surface, which is the whole difficulty.
     *
     * **Pinned across the frustum** once it does: a quad in front of the camera
     * covering everything the camera can see. The volume is unchanged and every
     * pixel still solves the same ray against the same ellipsoid, so nothing in
     * the picture moves at the switch — the bank simply keeps being drawn, at
     * whatever thickness the ray says, right through the camera passing into
     * it. This is what used to be a fade to nothing, and a fade to nothing is
     * what a bank of fog does least.
     *
     * The one thing given up is depth: pinned, the quad is nearer than the
     * scene, so the haze lays over anything standing between the camera and the
     * bank instead of behind it. That is only ever true within a few
     * centimetres of the volume, where the honest picture is a camera in the
     * smoke and everything veiled by it anyway.
     *
     * Frustum culling comes off with all of it: the proxy is a unit quad until
     * this runs, so three would size the test off a scale that is a frame stale
     * and cut banks at the edge of frame. Six meshes are not worth testing.
     *
     * Positions here are the room's and the camera's is the world's, which is
     * the same space: `root` carries no transform and the shader relies on that
     * too, comparing `uCentre` against `cameraPosition` directly. Move the stage
     * root and the fog is what breaks.
     */
    const face = (mesh: Mesh, centre: Vector3, camera: Camera): void => {
      camera.matrixWorld.extractBasis(right, up, fwd);
      eye.setFromMatrixPosition(camera.matrixWorld);
      mesh.quaternion.copy(camera.quaternion);

      const reach = eye.distanceTo(centre);
      look.copy(eye).sub(centre).divideScalar(Math.max(reach, 1e-4));
      const tip = Math.hypot(semi.x * look.x, semi.y * look.y, semi.z * look.z);

      if (reach > tip * HUNG_TO) {
        const grow = Math.min(reach / Math.max(reach - tip, 1e-3), HUNG_CAP);
        const span = (v: Vector3): number =>
          Math.hypot(semi.x * v.x, semi.y * v.y, semi.z * v.z) * 2 * grow;
        mesh.position.copy(centre);
        mesh.scale.set(span(right), span(up), 1);
      } else {
        // `fwd` is the camera's third basis vector, which points *out* of the
        // screen, so the quad goes the other way.
        const at = Math.max(reach - tip, PINNED_NEAREST);
        mesh.position.copy(eye).addScaledVector(fwd, -at);
        const lens = camera as PerspectiveCamera;
        const tall = 2 * at * Math.tan((lens.fov ?? 60) * (Math.PI / 180) * 0.5);
        mesh.scale.set(tall * (lens.aspect ?? 1.8) * 1.05, tall * 1.05, 1);
      }
      mesh.updateMatrixWorld();
    };
    for (let i = 0; i < cardCount; i++) {
      const x = hazeRng.float(-width * 0.2, width * 0.2);
      const centre = new Vector3(
        x, hazeRng.float(0.4, 1.2), m.backZ + hazeRng.float(0.4, depth - 0.6),
      );
      const mesh = new Mesh(cardGeo, hazeMat(centre));
      mesh.renderOrder = 4;
      mesh.frustumCulled = false;
      mesh.onBeforeRender = (_r, _s, camera) => face(mesh, centre, camera);
      root.add(mesh);
      hazeCards.push({
        mesh, centre, drift: hazeRng.float(0.02, 0.06), phase: hazeRng.float(0, 6.28), x,
      });
    }
  }

  // --- frame -------------------------------------------------------------
  let time = 0;
  const idle = reducedMotion ? 0.2 : 1;

  const rig: StageRig = {
    root,
    fog,
    flyBar: built.flyBar,
    metrics: m,
    dressing: { placed: dressed.placed, ignored: dressed.ignored, solids: dressed.solids },

    setCurtain: (open) => curtain.setOpen(open),
    snapCurtain: (open) => curtain.snap(open),
    curtainOpen: () => curtain.open(),

    applaud: (intensity) => audience.applaud(intensity),
    gasp: () => audience.gasp(),
    setAttention: (level) => audience.setAttention(level),

    showRiser: (on) => dressed.showRiser(on),
    showPa: (cast) => dressed.showPa(cast),

    setAir: (beams) => takeAir?.(beams),

    setQuality(q: Quality): void {
      audience.setQuality(q);
    },
    audienceCount: () => audience.count(),

    update(now: number, dt: number): void {
      // A tab that has been in the background hands back a delta measured in
      // seconds. Clamping it here means one lost frame, not a curtain that
      // teleports open and an audience that jumps.
      const d = Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.1)) : 0;
      time += d;
      curtain.update(d);
      audience.update(now, d);
      dressed.update(time, d);
      built.update?.(time, d);
      for (const card of hazeCards) {
        // The bank drifts, not the quad standing in for it: `face()` owns the
        // proxy's position and rewrites it every frame from wherever this puts
        // the volume.
        card.centre.x = card.x + Math.sin(time * card.drift * 6 + card.phase) * 1.1 * idle;
        card.centre.y += Math.sin(time * 0.2 + card.phase) * 0.0006 * idle;
      }
    },

    dispose(): void {
      root.removeFromParent();
      root.traverse((obj) => {
        const mesh = obj as Partial<Mesh>;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) for (const one of mat) one.dispose();
        else if (mat) mat.dispose();
      });
      kit.dispose();
      root.clear();
    },
  };

  return rig;
}
