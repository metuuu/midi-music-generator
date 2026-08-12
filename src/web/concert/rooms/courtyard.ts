/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The courtyard — a walled court, arcaded, paved, and open to the sky.
 *
 * Written second, as the proof that the seam in `./types.ts` is a seam and not
 * a wrapper. `courtyard` was picked out of the fourteen rooms for one reason:
 * it is the room that shares the *fewest* objects with a proscenium. It has no
 * arch, no tormentors, no masking above the header, no wings, no fly tower, no
 * curtain, no boarded house floor, and no ceiling. Six of the nine things
 * `proscenium.ts` builds are absent here. A courtyard that came out of a
 * proscenium builder with different colours is exactly the failure this work
 * was commissioned to fix, so if the seam only supported rooms that were nearly
 * prosceniums, the right thing to find out was here rather than later.
 *
 * The alternative candidate was `riihi`, a threshing barn, and it is a good
 * second — a pitched timber roof and no stage architecture at all. It exercises
 * less, though: a barn still has walls, still has a floor you can build from
 * boards, and its roof is a finite `headroom` of the kind the cellar already
 * proved. The courtyard removes the roof *and* the arch *and* the curtain in
 * one room, which puts all three of the contract's hardest questions on the
 * table at once — what bounds visibility with no proscenium, what lamps hang
 * from with no fly tower, and what `setCurtain` does with no cloth.
 *
 * ## What this room is
 *
 * A Cairo *beit*, a Damascene court, a riad: a paved rectangle with rooms round
 * it, an arcade on the inner faces of the walls, a strip of sky overhead and
 * lamps on a wire across it. The band is on a dais at one end, low, on a
 * carpet. The audience is on chairs on the flags, close, and — per
 * `arabic/staging.ts` — shouting.
 *
 * ## The arcade is on the sides, and that is not an aesthetic choice
 *
 * `stage-props.ts` already has an `arches` prop, and arabic names it on the
 * room rather than on any era. Its own comment draws the line this file has to
 * stay on: the prop is "an object standing on the boards", it arcades **the
 * back wall behind the band**, and it says in as many words that "arcading the
 * side walls of the house would not be — that is a wall, and it would belong
 * next to `brick`." That was written before there was anywhere for it to
 * belong. There is now, and the division is the seam's first real test: the
 * prop keeps the stage-end arcade and this file arcades the three walls of the
 * house. Two arcades of the same arch, drawn by two files, and neither draws
 * the other's — a courtyard that also arcaded its stage end would put a second
 * row of piers 0.2 m in front of the first, which is the kind of collision a
 * seam is supposed to make impossible rather than merely unlikely.
 *
 * ## Roofed or not, from one flag
 *
 * Three of arabic's four eras name `open-air` and the fourth deliberately does
 * not — its comment reads "the same court with a roof on it", which is what
 * happened to the music in the 1960s. So the sky is not a property of this
 * room, it is a property of the dressing, and the difference between the two is
 * a lid: open, `headroom` is `Infinity` and there is a dome; closed, both lids
 * come in at the wall head and a flat coffered ceiling spans the court.
 *
 * That is also what forced `RoomShape.houseLid` to exist. `houseLid()` used to
 * derive the house ceiling as `houseY + LOW_CEILING` for any room whose
 * `headroom` was finite — true of the cellar, and true of the cellar only, and
 * silently wrong for the first second room to grow a roof. A 4.6 m court would
 * have hung its chandelier at 3.6 m, a metre below its own plaster.
 */

import {
  DoubleSide, Group, InstancedMesh, Mesh, Object3D, TorusGeometry,
} from 'three';

import {
  blend, cellPlane, shade, tint, HEAD_BAND,
} from '../stage-kit.js';
import { skyDome } from './proscenium.js';
import {
  noCurtain, type RoomBuilder, type RoomContext, type RoomDatum, type RoomRig,
  type RoomShape,
} from './types.js';

/**
 * How far the dais stands above the flags.
 *
 * Not `STAGE_RISE`. A takht plays sitting on a carpet and a firqa plays on a
 * shallow platform somebody built for the evening; neither is 0.9 m of
 * proscenium stage, and the room reads wrong at that height in a way that is
 * hard to name and easy to see — a courtyard with a metre of stage in it is a
 * theatre that has lost its roof.
 *
 * 0.45 m rather than the cellar's 0.4 m, and the extra five centimetres is
 * bought for the same reason the cellar spent them: this house is **seated**,
 * ten rows of it at `density` 0.8, and a seated head is about 1.25 m off the
 * floor. At 0.45 m the front row's crowns sit just under a standing player's
 * waist, so the band clears the audience from the fixed camera at 2.4 m without
 * the dais ever reading as a stage. Below 0.4 m it does not, and the front row
 * is in front of the drummer.
 */
const DAIS_RISE = 0.45;

/** How far outside the house the court walls stand. `camera.ts`'s margin. */
const WALL_OUT = 0.6;

function shape(d: RoomDatum): RoomShape {
  const openAir = d.props.has('open-air');
  /**
   * The wall head, above the flags.
   *
   * A courtyard wall is one or two storeys of the house it belongs to, so it
   * scales with the court rather than being fixed — a 12 m court with a 4 m
   * wall is a yard, and the same wall round a 9 m court is a room. Clamped at
   * both ends because neither extreme is a courtyard: under 4.2 m the arcade
   * has no springing height left over the tallest player, and over 5.8 m the
   * lamps on the wire are too high to light anybody.
   */
  const wallH = Math.max(4.2, Math.min(d.width * 0.42, 5.8));
  const rise = DAIS_RISE;
  /**
   * The aperture is the **whole width of the dais**, and there is nothing
   * masking it.
   *
   * A proscenium takes 94 % because the outer 6 % is behind a tormentor. Here
   * there is no tormentor, no leg and no arch: a player standing on the corner
   * of the dais is seen, from every seat, which is what an open court means. So
   * the honest number is 1.0, and the rule in `RoomShape` — never narrower than
   * the playing area — is satisfied with the whole margin to spare.
   *
   * It is worth naming what this does *not* buy. `cast.ts` clamps players to
   * `min(width/2 - MARGIN_SIDE, width * 0.47)`, hardcoded, with no sight of
   * this file; below 16.7 m of stage the margin binds and the opening fraction
   * is dead weight. So the band stands in exactly the same place it would in a
   * proscenium and nobody gains a hand's breadth of stage. What changes is
   * everything hung: bunting, fairy lights, the cyclorama glow and the `arches`
   * prop's bay count all span the aperture, and in this room they span the
   * court rather than an arch that is not there.
   */
  const openingWidth = d.width;
  /** Above the boards — the wall head, less the dais the boards sit on. */
  const openingHeight = wallH - rise;
  return {
    rise,
    openingWidth,
    openingHeight,
    /**
     * Where a cloth would be if there were one, and `stage-props.ts` hangs
     * drapes, a truss and a mirror ball off it, so it has to be the front
     * of the room rather than a token. The dais has no lip moulding to clear
     * and no footlight trough behind it, so it sits a little further downstage
     * than a theatre's tabs: half a metre in from the front edge, which is
     * where the lamp wire is strung and where an awning would be tied off.
     */
    curtainZ: d.lipZ - 0.5,
    /** The wire, a handspan under the wall head. See `build`. */
    flyY: openingHeight - 0.25,
    headroom: openAir ? Infinity : wallH - rise,
    houseLid: openAir ? Infinity : wallH - rise,
    /**
     * The awning again, and this room is the control case for the whole field.
     *
     * `rigLid` was added because three rooms publish a `headroom` that is the
     * underside of a *member* with a surface behind it, so a motor drop trimmed
     * to it stops in mid-air. The coffered awning here is not that: it is one
     * plane at the wall head, and a ray fired straight up from `truss`'s pick at
     * `±(width / 2 − 0.4)` hits it at 4.632 m against a `headroom` of 4.632 —
     * **0.000 m**, the only lidded truss venue in the catalogue that was already
     * right. So the line is a copy, and it is the measurement that says it may
     * be one.
     *
     * Open, it is `Infinity` with the other two: there is sky over the court and
     * `truss` stands its lattice on legs.
     */
    rigLid: openAir ? Infinity : wallH - rise,
    /**
     * The limewashed wall behind the band, from the flags. Full height: unlike
     * a tanssilava's coping wall this is not something you are meant to see
     * over, it is the side of a building.
     */
    backdropHeight: wallH,
    /** Open to the sky and still walled on both sides — a courtyard is. */
    wallX: d.houseWidth / 2 + WALL_OUT,
  };
}

function build(c: RoomContext): RoomRig {
  const p = c.venue.palette;
  const m = c.m;
  const openAir = c.props.has('open-air');
  const rise = -m.houseY;
  const wallH = m.backdropHeight;
  /** The inner face of the court walls, and the outer edge of everything. */
  const halfX = m.houseWidth / 2 + WALL_OUT;
  /** Behind the last row, with the same 1.6 m of margin the proscenium keeps. */
  const houseBackZ = m.lipZ + m.houseDepth + 1.6;

  const root = new Group();
  root.name = `room:${c.venue.id}`;

  /**
   * The flags.
   *
   * Square cells rather than the proscenium's long ones, which is the whole of
   * the difference between paving and floorboards at this distance: a plank
   * reads from its length and a flagstone from being as wide as it is deep.
   * Same `cellPlane` trick, same one draw call, and it takes the stream name
   * the proscenium's floor takes so the two rooms stay comparable seed for
   * seed.
   *
   * Colour off `proscenium` rather than `boards` — the palette's `boards` entry
   * is the *dais*, which in this room is a wooden platform standing on stone,
   * and a stone court the colour of the platform on it is one flat field.
   * Pulled a third of the way toward `backdrop` and darkened, so it still sits
   * under the crowd rather than competing with the band.
   */
  const floorW = m.houseWidth + 8;
  /**
   * Paved from wall to wall, which it was not — and this room is where that
   * mattered most.
   *
   * The depth was `houseDepth + 8` centred on `lipZ + houseDepth / 2`, copied
   * from the proscenium along with the cell trick and the stream name. See that
   * room for the arithmetic; the short version is that it fixes the upstage
   * edge at `lipZ - 4` regardless of the building, so any venue deeper than
   * four metres has unpaved ground behind the dais. **All four of arabic's
   * dressings are, by 3.00 to 3.60 m** — and the walls this room raises
   * immediately below run the full plan, from `backZ - 0.1` to `houseBackZ`. So
   * the flagstones stopped three and a half metres inside a court that is
   * closed on all four sides, and the gap was between its own walls.
   *
   * A proscenium gets away with the same fault because its tormentors mask that
   * wedge front-on. **A courtyard has no masking anywhere** — its own wall
   * comment is written around a viewer swinging outside the room in the first
   * ten seconds — so here the black wedge is simply in the shot. Measured from
   * the building instead: 2 m past the rear wall of the stage, and the reach it
   * already had at the house end, which was never the part that was wrong.
   */
  const floorFrom = m.backZ - 2;
  const floorTo = m.lipZ + m.houseDepth + 4;
  const floorD = floorTo - floorFrom;
  const flags = new Mesh(
    c.kit.own(cellPlane({
      width: floorW, height: floorD,
      cols: Math.max(8, Math.round(floorW / 0.62)),
      rows: Math.max(8, Math.round(floorD / 0.62)),
      colour: shade(blend(p.proscenium, p.backdrop, 0.34), 0.42),
      jitter: 0.13, rng: c.rng('housefloor'),
    })),
    c.kit.solid('#ffffff', { vertexColors: true, rough: 0.93 }),
  );
  flags.rotation.x = -Math.PI / 2;
  flags.position.set(0, m.houseY, (floorFrom + floorTo) / 2);
  flags.receiveShadow = true;
  root.add(flags);

  // --- the walls of the court ---------------------------------------------
  /**
   * Limewash, and the same single-sided decision the proscenium's house walls
   * make for the same reason: orbit yaw is not clamped, swinging round the
   * outside of the room is a thing a viewer does in the first ten seconds, and
   * a solid wall answers that with a black screen. Looking straight in from
   * outside is the graceful version of the same failure.
   *
   * Four of them here rather than three, because a court is closed at both ends
   * — the wall behind the band is a wall of the same building and not a hung
   * cloth. It is the surface the `arches` prop stands its arcade against, so it
   * is deliberately plain: see the header.
   */
  const wallRng = c.rng('walls');
  const wallColour = tint(blend(p.proscenium, p.backdrop, 0.28), 0.1);
  const wallMat = c.kit.solid('#ffffff', { vertexColors: true, rough: 0.96 });
  const plaster = (w: number, h: number): Mesh => new Mesh(
    c.kit.own(cellPlane({
      width: w, height: h, cols: Math.max(4, Math.round(w / 1.6)),
      rows: Math.max(3, Math.round(h / 1.5)),
      colour: wallColour, jitter: 0.055, rng: wallRng,
    })),
    wallMat,
  );

  /**
   * Where the upstage end of the court is, and it is not `backZ`.
   *
   * The wall behind the band stands at `backZ - 0.1` — see below for why — and
   * the side walls used to start at `backZ`, a tenth of a metre downstage of
   * it. Four walls that do not meet on one plane leave a 0.1 m slot at each
   * upstage corner, floor to wall head, and a grazing ray goes straight out
   * through it. So the sides start where the wall they run into actually
   * stands. The extra 0.1 m of plaster is behind that wall and is never seen
   * from anywhere in the court.
   */
  const wallFrom = m.backZ - 0.1;
  const sideDepth = houseBackZ - wallFrom;
  for (const side of [-1, 1]) {
    const mesh = plaster(sideDepth, wallH);
    mesh.position.set(side * halfX, m.houseY + wallH / 2, wallFrom + sideDepth / 2);
    mesh.rotation.y = side * -Math.PI / 2;
    mesh.receiveShadow = true;
    root.add(mesh);
  }

  const rear = plaster(halfX * 2, wallH);
  rear.position.set(0, m.houseY + wallH / 2, houseBackZ);
  rear.rotation.y = Math.PI;
  rear.receiveShadow = true;
  root.add(rear);

  /**
   * The wall behind the band, and it is the fourth wall of the court rather
   * than a cloth hung across one end of it.
   *
   * **The full width of the court**, and not the `width * 1.2` this used to
   * take from the proscenium along with the cell trick and the stream name.
   * That factor is right for a *backdrop*: a panel behind a band inside an
   * arch, where the arch and its tormentors mask whatever is either side of it.
   * This room has no arch, no tormentor and no leg — `openingWidth` in `shape()`
   * is 1.0 for precisely that reason — so nothing masked the ends of it and
   * nothing ever will. Measured: a 14.52 m panel across a
   * 17.30 m court, leaving **1.39 m by 5.08 m of nothing at each upstage
   * corner** in the satellite dressing, and 1.50 x 4.62, 1.41 x 5.00 and
   * 1.46 x 4.79 in takht, firqa and shaabi — the shortfall is `2.6 - 0.1 *
   * width` per corner and every dressing this genre has is inside that band. A
   * 7200-ray sweep at eye height from the middle of the house left the building
   * through **9.10 to 10.30 degrees of azimuth** in all four eras, in two runs,
   * one per corner. Three of the four have a sky dome to escape into and the
   * fourth is roofed, so what the user reported from a screenshot is what it
   * is: a black void where the corner should be.
   *
   * `salon.ts` reached the same conclusion in a hall with the same absence of
   * masking, and the sentence there is the right one here: this is not a
   * backdrop, it is the end wall of the building, and an end wall goes wall to
   * wall.
   *
   * Set 0.1 m upstage of `backZ` so nothing standing on the back of the dais is
   * inside it — `wallFrom` above is that plane, and the side walls now run to
   * it. Double-sided, unlike the three house walls: the camera never gets
   * behind the other three, and it very much can get behind this one by
   * orbiting over the dais.
   */
  const backW = halfX * 2;
  const back = new Mesh(
    c.kit.own(cellPlane({
      width: backW, height: wallH,
      cols: Math.max(5, Math.round(backW / 1.4)),
      rows: Math.max(3, Math.round(wallH / 1.4)),
      colour: tint(wallColour, 0.06), jitter: 0.05, rng: wallRng,
    })),
    c.kit.solid('#ffffff', { vertexColors: true, rough: 0.96, side: DoubleSide }),
  );
  back.position.set(0, wallH / 2 - rise, wallFrom);
  back.receiveShadow = true;
  root.add(back);

  // --- the arcade ----------------------------------------------------------
  /**
   * A row of horseshoe arches standing in front of each of the three house
   * walls, and the object that makes this a courtyard rather than a yard.
   *
   * The geometry is deliberately the same three pieces `stage-props.ts` builds
   * for `arches` — piers, a horseshoe ring past a half turn, a lintel across
   * the top — because two arcades in one room that were not the same arch would
   * read as two buildings. What differs is where it stands and what it is for:
   * that one is scenery behind the band, on the boards, and this one is the
   * wall of the house. Sharing the *look* and not the code is the right trade
   * here; the prop's version is sized off the aperture and instanced once, and
   * a shared helper that could do both would take more parameters than either
   * has lines.
   *
   * Instanced in three meshes for the whole court rather than three per wall:
   * about forty arches at a hundred triangles each is nothing, and forty
   * `Mesh`es is a draw call each.
   *
   * They cast and do not receive. A pier is a chunky solid standing on a floor,
   * which is exactly the class of object the shadow policy says casts; the wall
   * behind it is already receiving, and a pier that also received would be
   * lighting its own recess.
   */
  const spring = Math.max(HEAD_BAND.hi - 0.15, 2.1);
  /** Past a half turn, which is what makes it a horseshoe rather than a viaduct. */
  const ARC = Math.PI * 1.16;
  const stone = c.kit.solid(tint(blend(p.proscenium, p.ambient, 0.22), 0.1), { rough: 0.9 });
  /** Runs of `[from, to]` along z on the sides, then along x across the rear. */
  const runs: { along: 'z' | 'x'; at: number; from: number; to: number; face: number }[] = [
    { along: 'z', at: -halfX, from: m.backZ, to: houseBackZ, face: 1 },
    { along: 'z', at: halfX, from: m.backZ, to: houseBackZ, face: -1 },
    { along: 'x', at: houseBackZ, from: -halfX, to: halfX, face: -1 },
  ];

  /**
   * How many bays a span gets at the 2.4 m nominal, forced odd so that an arch
   * and not a pier stands on the centre line. **Only the rear run asks.**
   */
  const bayOf = (span: number): number => {
    let bays = Math.max(2, Math.round(span / 2.4));
    if (bays % 2 === 0) bays += 1;
    return bays;
  };
  /**
   * One bay width for the whole court, taken from the *rear* run — and every
   * other run counts its bays in that module rather than in the nominal.
   *
   * Three runs of different lengths would otherwise give three different arch
   * radii, and an arcade whose arches change size as it turns a corner is the
   * one thing about an arcade anybody notices. The rear wall is the shortest
   * run and the one seen face-on from the stage, so it sets the module and the
   * longer sides take however many of it fit.
   *
   * "However many of it fit" is what this does now and is not what it did. Every
   * run took its *count* from `bayOf`, which measures against the 2.4 m nominal,
   * and then stepped by `bay`, which comes from the rear run. Two modules, so a
   * side run laid `bays * bay` metres of arcade along a wall that is not that
   * long and hung the surplus off both ends: **0.064 m per end in takht, 0.221
   * in shaabi, 0.393 in firqa and 0.471 in satellite, which stood a pier at
   * z = -4.271 against a court that begins at -3.80** — outside the building,
   * upstage of the wall behind the band, standing on nothing.
   *
   * `ceil` rather than `round`, because a run's own step must never come out
   * *wider* than the module: the ring below is one radius for the whole court
   * and is solved against `bay`, so a wider bay would spring its arch short of
   * its own pier and show the cut end in the opening. It costs nothing here —
   * all four dressings keep the nine bays a side they already had, at 2.300 to
   * 2.367 m instead of 2.314 to 2.471, and every run now ends exactly on the
   * corner of the court.
   */
  const rearSpan = Math.abs(runs[2]!.to - runs[2]!.from);
  const rearBays = bayOf(rearSpan);
  const bay = rearSpan / rearBays;
  const plan = runs.map((run, i) => {
    const span = Math.abs(run.to - run.from);
    const bays = i === 2 ? rearBays : Math.max(2, Math.ceil(span / bay));
    return { ...run, bays, step: span / bays };
  });
  const totalBays = plan.reduce((sum, run) => sum + run.bays, 0);
  const pierW = Math.min(0.44, bay * 0.28);
  /**
   * The ring's radius, and it is solved against the **pier** rather than
   * against the opening.
   *
   * It was `(bay - pierW) / 2`, the half-opening, which puts the tube's
   * *centreline* on the pier's inner face where the arch springs. The tube is
   * 0.30 m across, so half of it hung over the opening with no stone behind it;
   * and because the arc runs past a half turn, each end of it is a cut face
   * aimed down and outward — an open pipe end, in mid-air, at the springing
   * height of 1.80 m, which is where a camera down in the yard is looking.
   * Measured on the rear run of all four dressings, the inner corner of that cut
   * face stood **0.1747 to 0.1772 m inside the opening**, clear of the stone by
   * more than half the tube's width.
   *
   * The expression below is the one `stage-props.ts` arrived at for the same
   * three pieces, and it reads as: take the opening's half-width, lift it by the
   * tube radius in quadrature so the cut face's inner *corner* clears the pier
   * rather than its centreline landing on it, project that out along the
   * springing radius — the arc ends `ARC / 2 - PI / 2` past the horizontal,
   * 14.4 degrees here — and hand the tube radius back. Measured after, on the
   * same four rear runs: the cut end is buried **0.2437 m (takht), 0.2600
   * (firqa), 0.2509 (shaabi), 0.2636 (satellite)** below the pier top, with its
   * inner corner **0.0119, 0.0112, 0.0116 and 0.0110 m inside the pier**. The
   * side runs bury it deeper still, their step being the shorter one. Both ends
   * are stone on every face.
   */
  const r = Math.max(0.25, Math.hypot((bay - pierW) / 2, 0.15) / Math.cos(ARC / 2 - Math.PI / 2) + 0.15);

  const dummy = new Object3D();
  const piers = new InstancedMesh(
    c.kit.bevelBox(pierW, spring, 0.34, 0.03), stone, totalBays + plan.length);
  const rings = new InstancedMesh(
    c.kit.geometry(`court-arch|${r.toFixed(3)}`, () => new TorusGeometry(r, 0.15, 4, 10, ARC)),
    stone, totalBays);
  let pi = 0;
  let ri = 0;
  for (const run of plan) {
    const dir = Math.sign(run.to - run.from) || 1;
    /**
     * Centred on the run, and stepped by the run's own `step` rather than by
     * the court's module, so the end piers land **on** the corners rather than
     * within a few centimetres of them. See `bay`: they used to land up to
     * 0.471 m past them.
     */
    const mid = (run.from + run.to) / 2;
    const y0 = m.houseY;
    /**
     * The runs along z stand 0.02 m taller, which is the lintel's step again.
     *
     * "A corner pier lands within a few centimetres" is the comment above and
     * it is true — but the two piers that land there are the same box at the
     * same height, so their caps were one plane and the corner of the arcade
     * flickered at 1.8 m, which is eye level for a camera down in the yard. One
     * run coursed over the other settles it at the pier the same way it settles
     * it at the lintel, and the cap disappears into the ring above it either
     * way.
     */
    const overrun = run.along === 'z' ? 0.02 : 0;
    for (let i = 0; i <= run.bays; i++) {
      const along = mid + dir * (i - run.bays / 2) * run.step;
      dummy.position.set(
        run.along === 'z' ? run.at + run.face * 0.2 : along,
        y0 + (spring + overrun) / 2,
        run.along === 'z' ? along : run.at + run.face * 0.2,
      );
      dummy.rotation.set(0, run.along === 'z' ? Math.PI / 2 : 0, 0);
      dummy.scale.set(1, (spring + overrun) / spring, 1);
      dummy.updateMatrix();
      piers.setMatrixAt(pi++, dummy.matrix);
    }
    for (let i = 0; i < run.bays; i++) {
      const along = mid + dir * (i - (run.bays - 1) / 2) * run.step;
      dummy.position.set(
        run.along === 'z' ? run.at + run.face * 0.2 : along,
        y0 + spring,
        run.along === 'z' ? along : run.at + run.face * 0.2,
      );
      // The arc starts at angle zero, so swing it back by half the overshoot to
      // stand it symmetrically on its own two piers.
      dummy.rotation.set(0, run.along === 'z' ? Math.PI / 2 : 0, Math.PI / 2 - ARC / 2);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      rings.setMatrixAt(ri++, dummy.matrix);
    }
  }
  piers.castShadow = true;
  rings.castShadow = true;
  root.add(piers);
  root.add(rings);

  /**
   * The lintel over each run.
   *
   * The same argument the prop makes and it is worth restating because it is
   * the difference between an arcade and a croquet lawn: an arcade is a *wall
   * with holes in it*, so the arches have to carry something. One bar per run,
   * above the crown, tying the piers together.
   */
  const lintelY = m.houseY + spring + r + 0.34;
  for (const run of plan) {
    const span = Math.abs(run.to - run.from) + pierW;
    const lintel = new Mesh(c.kit.bevelBox(span, 0.32, 0.36, 0.03), stone);
    /**
     * The runs along z sit 0.02 m higher than the runs along x.
     *
     * Where two runs meet at a corner of the yard their lintels cross, and at
     * one height with one section they crossed *inside* each other — a shared
     * soffit and a shared top over the full 0.36 m square, at the corner, which
     * is where the arcade is most often seen against the sky. One lintel
     * passing over the other is how the corner of a real arcade is coursed.
     */
    lintel.position.set(
      run.along === 'z' ? run.at + run.face * 0.2 : (run.from + run.to) / 2,
      lintelY + (run.along === 'z' ? 0.02 : 0),
      run.along === 'z' ? (run.from + run.to) / 2 : run.at + run.face * 0.2,
    );
    lintel.rotation.y = run.along === 'z' ? Math.PI / 2 : 0;
    lintel.castShadow = true;
    root.add(lintel);
  }

  // --- the lid, or the lack of one ----------------------------------------
  if (openAir) {
    /**
     * The same three-band night the tanssilava gets, from the same palette
     * arithmetic — see `skyDome`. Smaller than the pavilion's, because nothing
     * in this room's dressing reaches past the court walls: there is no `lake`
     * and no `birch` in arabic's vocabulary, the furthest thing from the origin
     * is the rear wall at about 14 m, and a 40 m dome is comfortably outside
     * everything while staying well inside the camera's 120 m far plane.
     */
    root.add(skyDome(c, 40));
  } else {
    /**
     * The roof the 1960s put on it.
     *
     * A flat coffered ceiling at the wall head, spanning the whole court so it
     * terminates against all four walls — the failure the proscenium's house
     * walls were written after is a lid over a room with no walls, reading as a
     * slab hanging in space, and the inverse is just as bad: a lid that stops
     * short of a wall leaves a slot of nothing all round the room.
     *
     * It ran to `backZ` and the wall behind the band is at `wallFrom`, which is
     * 0.1 m upstage of that, so the sentence above was true of three walls and
     * false of the fourth. It reaches the same plane the walls do now. Nothing
     * about its height changes, which is the number `rigLid` is measured
     * against.
     *
     * `DoubleSide` and hung the same way up as the cellar's, which is the one
     * thing here worth copying rather than reasoning about afresh: a hemisphere
     * lights a single-sided plane from whichever face it has, and a ceiling lit
     * from its top is a ceiling the room cannot see. `stage-props.ts` settled
     * that for `low-ceiling` and this is the same object one room over.
     *
     * `cellPlane` for the same reason too, and it is the better half of the
     * argument: a hemisphere lights a flat plane to *one number*, so a lid whose
     * normal never changes gets identical light at every pixel and reads as a
     * hole rather than as a ceiling, however well the colour is chosen. Cells
     * give it a grain for nothing.
     *
     * Neither casts nor receives. It is above every fixture in the rig, so a
     * shadow on it would have to have been cast upward.
     */
    const lid = new Mesh(
      c.kit.own(cellPlane({
        width: halfX * 2, height: sideDepth,
        cols: Math.max(4, Math.round(halfX * 2 / 1.3)),
        rows: Math.max(4, Math.round(sideDepth / 1.3)),
        colour: shade(blend(p.proscenium, p.backdrop, 0.55), 0.3),
        jitter: 0.09, rng: c.rng('ceiling'),
      })),
      c.kit.solid('#ffffff', { vertexColors: true, rough: 0.98, side: DoubleSide }),
    );
    lid.rotation.x = -Math.PI / 2;
    lid.position.set(0, m.houseY + wallH, wallFrom + sideDepth / 2);
    root.add(lid);
  }

  // --- what the lamps hang on ---------------------------------------------
  /**
   * A wire across the court, and it is the whole of this room's answer to the
   * fly bar.
   *
   * There is no fly tower here and there is not going to be one — a courtyard
   * with a grid over it is a theatre. What a courtyard has is a cable strung
   * wall to wall with lamps clipped to it, which is also exactly what
   * `arabic/staging.ts` dresses three of its four eras with (`paper-lanterns`,
   * `fairy-lights`). So `flyBar` is a `Group` at `flyY` with a wire through it,
   * and `lights.ts` hangs its pars along the wire's local x without knowing or
   * caring that it is not a scaffold.
   *
   * The wire is drawn straight rather than sagging. A catenary would be
   * prettier and would be wrong: the fixtures `lights.ts` parents here are
   * placed at `y = 0` in this group's frame, so a bar that dipped in the middle
   * would have its lamps hanging in the air above it.
   */
  const flyBar = new Group();
  flyBar.name = 'fly-bar';
  flyBar.position.set(0, m.flyY, m.curtainZ - 1.1);
  const wire = new Mesh(
    c.kit.bevelBox(halfX * 2, 0.035, 0.035, 0.017),
    c.kit.solid(shade(p.proscenium, 0.78), { metal: 0.4, rough: 0.6 }),
  );
  flyBar.add(wire);
  root.add(flyBar);

  /**
   * No cloth, and therefore no curtain.
   *
   * See `RoomRig.curtain`: `noCurtain()` reports the cloth as being exactly
   * where the show asked for it, immediately, so `show.ts` never stalls waiting
   * for travel that will not happen and the band still stays hidden while it is
   * being staged. The reveal is a cut. In a walled court with the audience
   * already sitting in it, that is what happens — the band walks on.
   */
  const curtain = noCurtain();
  root.add(curtain.root);

  return { root, flyBar, curtain };
}

export const courtyard: RoomBuilder = { shape, build };
