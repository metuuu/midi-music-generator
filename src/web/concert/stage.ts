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
  Color, DoubleSide, Fog, Group, Mesh, type Object3D, PlaneGeometry,
  ShaderMaterial,
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
import { dressStage, readProps, type PropRig } from './stage-props.js';

export { SUPPORTED_PROPS } from './stage-props.js';
export { normaliseProp, unknownProps } from './stage-props.js';
export type { PropName } from './stage-props.js';
export type { Quality, StageMetrics } from './stage-kit.js';

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
  dressing: { placed: readonly string[]; ignored: readonly string[] };

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
   * Soft cards of air near the boards, for the fog the `Fog` cannot do: a
   * depth cue is not the same thing as smoke lying in a beam. Radial falloff
   * in the fragment shader rather than a texture, oriented at the house
   * because that is where the camera lives.
   */
  const hazeCards: { mesh: Mesh; drift: number; phase: number; x: number }[] = [];
  const cardCount = fogAmount < 0.08 && !extraHaze
    ? 0
    : (quality === 'low' ? 2 : quality === 'medium' ? 4 : 6);
  if (cardCount > 0) {
    const hazeMat = kit.own(new ShaderMaterial({
      uniforms: {
        uColour: { value: new Color(tint(fogColour, 0.35)) },
        uOpacity: { value: (0.1 + fogAmount * 0.26) * (extraHaze ? 1.5 : 1) },
      },
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColour; uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          vec2 d = vUv - 0.5;
          float r = length(vec2(d.x, d.y * 1.7)) * 2.0;
          float a = smoothstep(1.0, 0.1, r);
          gl_FragColor = vec4(uColour, a * a * uOpacity);
        }`,
    }));
    const cardGeo = kit.geometry(`haze|${width}`, () => new PlaneGeometry(width * 0.85, 2.6));
    const hazeRng = new Rng(`${venue.id}:haze`);
    for (let i = 0; i < cardCount; i++) {
      const mesh = new Mesh(cardGeo, hazeMat);
      const x = hazeRng.float(-width * 0.2, width * 0.2);
      mesh.position.set(x, hazeRng.float(0.5, 2.4), m.backZ + hazeRng.float(0.4, depth - 0.6));
      mesh.renderOrder = 4;
      root.add(mesh);
      hazeCards.push({ mesh, drift: hazeRng.float(0.02, 0.06), phase: hazeRng.float(0, 6.28), x });
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
    dressing: { placed: dressed.placed, ignored: dressed.ignored },

    setCurtain: (open) => curtain.setOpen(open),
    snapCurtain: (open) => curtain.snap(open),
    curtainOpen: () => curtain.open(),

    applaud: (intensity) => audience.applaud(intensity),
    gasp: () => audience.gasp(),
    setAttention: (level) => audience.setAttention(level),

    showRiser: (on) => dressed.showRiser(on),

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
        card.mesh.position.x = card.x + Math.sin(time * card.drift * 6 + card.phase) * 1.1 * idle;
        card.mesh.position.y += Math.sin(time * 0.2 + card.phase) * 0.0006 * idle;
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
