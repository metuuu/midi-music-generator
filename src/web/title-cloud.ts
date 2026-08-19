/**
 * The title, as gas.
 *
 * A record changing is one title evaporating off the flow the field is already
 * running, and the next one condensing out of that same flow behind it. No
 * point travels between the two titles and none is thrown anywhere: the words
 * let go in patches and drift away, and the next words are drawn in out of the
 * air upstream of where they belong. What was let go outlives the changeover by
 * some way, and more than one record's worth of it can be adrift at once. It draws into the glow field's own
 * accumulation buffer rather than onto a canvas of its own — see
 * `mountTitleCloud` for why that is the whole design and not an optimisation.
 *
 * There is no other layer: settled, the words are these points, one per device
 * pixel, carrying the coverage the rasteriser found. Anything crisper drawn
 * underneath them is a second title to hand the pixels back to, and the handing
 * back is what the eye catches.
 */

import type { TitleInk } from './title-ink.js';

/**
 * The pool, and the ring of generations it is read as.
 *
 * A title has a generation to itself and keeps it after it has been replaced,
 * because what it left behind goes on drifting for a good while after the next
 * one has landed. Records take the generations in turn, so the one being reused
 * is always the oldest — with four of them, three titles can arrive inside one
 * lifetime of gas before the faintest of it has to give up its slots.
 *
 * A generation is exactly `MAX_PTS` in `web/title-ink.ts` and has to stay it: a
 * title sampled finer than one holds would be cut off mid-word.
 */
const POOL_W = 256;
const POOL_H = 512;
const POOL = POOL_W * POOL_H;
const GENS = 4;
const SLOTS = POOL / GENS;
/** Rows one generation owns, which is what an upload writes. */
const GEN_ROWS = POOL_H / GENS;

/**
 * How long the new words take to condense, counted from the moment their ink is
 * handed over rather than from the press.
 *
 * The two halves of a changeover run on their own clocks and always did — a
 * title lets go when somebody asks for another record, and the next one can
 * only begin condensing once the element it is read out of holds it. Between
 * those is a fader and a compile, measured at 190–500 ms, and tying the words
 * to the far end of it is what made a skip feel like it had not registered.
 */
export const CLOUD_MS = 810;
/**
 * How long what evaporated goes on drifting, which is well past that.
 *
 * The gas off the old title has nothing to do with the new one and no reason to
 * be gone by the time it lands: it thins out in its own time, under and around
 * words that are already there. Only the changeover is what the page waits for,
 * so this length is nobody's business but the field's — see `CLOUD_MS` in
 * `web/radio.ts`, which is what a compile may not run through.
 */
const GHOST_MS = 2600;

/**
 * Evaporating: when a point lets go of its letter, how long it takes to stop
 * being held, and how long it then takes to be gone.
 *
 * Spread over a third of the run rather than happening at once, which is the
 * difference between a word evaporating and a word being switched off.
 */
const GO_FROM = 0.008;
const GO_TO = 0.131;
const RELEASE = 0.023;
/**
 * How a point fades, on its own longer clock: quickly down to a share of
 * itself, and then the long way to nothing.
 *
 * One fall to nothing made a point's whole life a departure, and the words were
 * still bright halfway through it. The drop is a fade-out and reads as one — a
 * third of a second, down to a tenth — and everything after it is a haze at
 * that tenth, drifting and thinning, which is the thing worth keeping.
 */
const GO_DROP = 0.13;
const GO_HOLD = 0.11;
const GO_FADE = 0.86;
/**
 * Where every point has finished dropping and none has begun its tail, which is
 * where a generation is held while it waits to be replaced.
 *
 * A record that takes its time to arrive — a slow compile, a band still coming
 * over the wire — used to outlast the gas that was covering the wait, and the
 * page went to an empty title box and sat there. Held at the plateau the haze
 * keeps drifting and keeps its tenth, and picks its fade up where it left off
 * the moment something lands.
 */
const GO_HELD = GO_TO + GO_DROP;
/**
 * Condensing: when a point shows up out of the flow, how long it takes to be
 * fully there, and where every one of them is home.
 *
 * The first of them appears while the old words are still going, so the two are
 * one movement in the same gas rather than a gap with a title on each side. It
 * cannot come before .19, which is `LINES_OUT_MS` in `web/radio.ts` as a share
 * of the run: nothing can condense before the element it is read out of has
 * been given the new words.
 */
const COME_FROM = 0.05;
const COME_TO = 0.3;
const COME_FADE = 0.6;
/**
 * How a point comes up: to a tenth of itself at once, and the rest of the way
 * only as it lands.
 *
 * The inverse of how the last title left, and for the same reason. One straight
 * fade had a point half lit half way in, so a title condensed out of a sheet of
 * grey that was already title-shaped before any of it was legible. Showing up
 * faint and staying faint, what crosses the screen is gas, and the words happen
 * at the end of it.
 */
const COME_LIFT = 0.06;
const COME_HOLD = 0.12;
const COME_CURVE = 3.4;
const GATHERED = 0.9;
/**
 * How much of either schedule is the point's own, the rest being where it
 * stands.
 *
 * Entirely its own, a word thins out evenly and reads as a dissolve; entirely
 * positional, whole letters switch on and off. Between the two the words go and
 * come in drifting patches with fizz inside them, and where between is a
 * title's own: the same name fizzes one record and goes in slabs the next.
 */
const SCATTER_LO = 0.22;
const SCATTER_HI = 0.68;
/**
 * What a changeover has of its own, drawn once per title: how it turns the
 * field the patches are read out of, how far it rolls it, and how broad it
 * reads it.
 *
 * The patches are a field sampled at the words' own place on the screen, and
 * the words sit in the same box every record — sampled the same way every time,
 * every title lets go in the same holes in the same order, which is the thing
 * you see three records in and cannot stop seeing.
 */
const BAND_TIGHT = 1.15;
const BAND_BROAD = 0.2;
const BAND_ROLL = 90;
/**
 * How far a title's release may be a sweep across the words rather than patches
 * opening all over them.
 *
 * One axis and not two: a field too broad to vary across the words is a sweep
 * already, so the number that broadens the field is the number that brings the
 * sweep up behind it.
 */
const SWEEP = 0.85;

/**
 * Where a point waits before it appears, in pixels from where it is going.
 *
 * Upstream of its own letter in the flow it will be carried by, and scattered
 * around that — so the words are not assembled out of a ring at one radius but
 * arrive along the streamlines, from wherever each was coming from.
 */
const SPAWN_NEAR = 14;
const SPAWN_FAR = 90;
const SPAWN_SCATTER = 0.5;
/** How far out a title's own words may condense from, on top of that. */
const REACH_VARY = 0.35;

/** How hard a shape holds its points, and how hard it draws them back in. */
const K_HOLD = 900;
const K_CATCH = 2400;
/**
 * Damping as a ratio of whichever spring is in force, a shade over critical.
 *
 * One fixed figure can only be right for one of the two, and under it the
 * gathering rang: points crossed their own letters, came back, and the words
 * assembled out of a wobble. Over critical nothing can cross, so a point runs
 * from where the flow left it onto its pixel and stops.
 */
const DAMP = 1.05;
/** What the air costs a loose point on top of what the flow already costs it. */
const DRAG_FREE = 0.4;
/**
 * The curl a loose point drifts in, as a speed it is dragged up to rather than
 * a push it is given, and how fast it gets there.
 *
 * Pushed, the curl only bends a path something else decided. Dragged into it, a
 * point has no path of its own at all — it goes where the gas goes, which is
 * the whole of what these two halves are meant to look like.
 *
 * What it is dragged into is the bar's own fluid plus this, in that order, and
 * the order is the point: weighed as a second target against the curl instead,
 * a swipe through the gas moved it by a seventh of what the same swipe moves
 * the bar by. It is how `web/glow-field.ts` moves its own loose particles.
 */
const FLOW_V = 210;
const FLOW_GRIP = 4;
/**
 * How far a title may turn the whole curl, and how big its eddies are.
 *
 * `swirl` is three waves at angles written into it, and each one pushes along
 * one fixed direction: the strongest of them, at twice the next, points
 * bottom-left to top-right, so every record's gas left towards the same two
 * corners and now and then straight up where the second one won. Turned by the
 * seed the field is the same field, pointing somewhere else.
 */
const EDDY_TIGHT = 1.5;
const EDDY_BROAD = 0.6;
/** A drift of its own on top of the flow, so no two points trace one line. */
const PUFF = 60;
/** The rise of it, which is the one direction the flow does not decide. */
const RISE = 55;
/**
 * And how much of the drift is the title's rather than the point's: a lean off
 * the rise, and a spread on the rise and the curl.
 *
 * One title's gas goes straight up and thins where it stands, the next one's
 * leans away and is carried off — the same air, read differently by what is in
 * it.
 */
const LEAN = 34;
const RISE_VARY = 0.5;
const CURL_VARY = 0.35;

/** Device pixels a sample grows by once it is loose. */
const GAS_GROW = 3;
/**
 * How far a loose sample's size and brightness may be its own, either way.
 *
 * A field of identical dots is read as a screen door however it moves. Given a
 * spread, the same points read as something with depth in it.
 */
const GAS_VARY = 0.65;
/**
 * How far from home a sample is still gas, in CSS pixels.
 *
 * Softness belongs to the distance and not to the clock: run off the schedule,
 * a point was still spread over three pixels after the spring had put it on
 * one, so the words arrived and then resolved. Off the distance, a point lifting
 * away hardens the moment it lands and blurs the moment it leaves.
 */
const GAS_REACH = 12;

const HASH = `
#define TAU 6.28318530718
uint hash(uint x) {
  x ^= x >> 16; x *= 0x7feb352du;
  x ^= x >> 15; x *= 0x846ca68bu;
  x ^= x >> 16;
  return x;
}
float rnd(uint i, uint salt) {
  return float(hash(i * 0x9e3779b9u + salt)) / 4294967296.0;
}
vec2 swirl(vec2 p, float t) {
  vec2 f = vec2(0.0);
  for (int n = 0; n < 3; n++) {
    float fn = float(n);
    float k = TAU / (230.0 / (1.0 + fn * 0.9));
    float a = fn * 2.39996 + 0.7;
    vec2 d = vec2(cos(a), sin(a));
    f += vec2(-d.y, d.x) * sin(dot(p, d) * k + t * (0.7 + fn * 0.45)) / (1.0 + fn);
  }
  return f;
}`;

/**
 * When each point goes and when each one comes, which both shaders read.
 *
 * The two have to agree exactly or a point is drawn on a schedule it is not
 * moving on. A generation carries two numbers: how far into its own drift it
 * is, and how much of its arrival it had made when it was replaced — a point
 * that was only half up when the next record landed leaves from half rather
 * than snapping to a whole one to start fading out again.
 */
const SCHEDULE = `
#define SLOTS ${SLOTS}u
#define GENS ${GENS}
#define GO_FROM ${GO_FROM.toFixed(5)}
#define GO_TO ${GO_TO.toFixed(5)}
#define GO_DROP ${GO_DROP.toFixed(5)}
#define GO_HOLD ${GO_HOLD.toFixed(5)}
#define GO_FADE ${GO_FADE.toFixed(5)}
#define SCATTER_LO ${SCATTER_LO.toFixed(5)}
#define SCATTER_HI ${SCATTER_HI.toFixed(5)}
#define BAND_TIGHT ${BAND_TIGHT.toFixed(5)}
#define BAND_BROAD ${BAND_BROAD.toFixed(5)}
#define BAND_ROLL ${BAND_ROLL.toFixed(1)}
#define SWEEP ${SWEEP.toFixed(5)}
#define RELEASE_G ${RELEASE.toFixed(5)}
#define COME_FROM ${COME_FROM.toFixed(5)}
#define COME_TO ${COME_TO.toFixed(5)}
#define COME_FADE ${COME_FADE.toFixed(5)}
#define COME_LIFT ${COME_LIFT.toFixed(5)}
#define COME_HOLD ${COME_HOLD.toFixed(5)}
#define COME_CURVE ${COME_CURVE.toFixed(3)}
#define GATHERED ${GATHERED.toFixed(5)}

uniform float uPhase;
/** Which generation is the title, and where the rest of them have got to. */
uniform float uLive;
uniform vec2 uGen[GENS];
/**
 * The one number each generation's changeover is drawn from, and the box its
 * words actually cover.
 *
 * Everything a title does differently comes off the seed. The box is what a
 * sweep is measured against, so it takes the same share of the run whether the
 * name is one short word or two full lines.
 */
uniform float uSeed[GENS];
uniform vec4 uBox[GENS];

int genOf(uint i) { return int(i / SLOTS); }
uint seedOf(uint i) { return uint(uSeed[genOf(i)]); }
mat2 turn(float a) { float c = cos(a); float s = sin(a); return mat2(c, -s, s, c); }

/** Where a point stands across the words along one direction, edge to edge. */
float across(int g, vec2 home, float ang) {
  vec4 b = uBox[g];
  vec2 d = vec2(cos(ang), sin(ang));
  float reach = abs(d.x) * b.z + abs(d.y) * b.w;
  return clamp(0.5 + dot(home - b.xy, d) / (2.0 * max(reach, 1.0)), 0.0, 1.0);
}

/**
 * One slow field over the words, turned, rolled and scaled to this title, so
 * both halves go and come in patches that are this record's and no other's.
 */
float shapeAt(uint i, vec2 home, float scale, uint salt) {
  int g = genOf(i);
  uint s = seedOf(i);
  float broad = rnd(s, salt);
  vec2 p = turn(rnd(s, salt + 1u) * TAU) * home * (scale * mix(BAND_TIGHT, BAND_BROAD, broad));
  float band = clamp(0.5 + 0.62 * swirl(p, rnd(s, salt + 2u) * BAND_ROLL).x, 0.0, 1.0);
  return mix(band, across(g, home, rnd(s, salt + 3u) * TAU), SWEEP * broad);
}

/** When a point lets go, and when it shows up: where it stands, plus its fizz. */
float goAt(uint i, vec2 home) {
  uint s = seedOf(i);
  float own = fract(rnd(i, 3u) + rnd(s, 121u));
  return mix(GO_FROM, GO_TO, mix(shapeAt(i, home, 0.75, 101u), own,
    mix(SCATTER_LO, SCATTER_HI, rnd(s, 122u))));
}
float comeAt(uint i, vec2 home) {
  uint s = seedOf(i);
  float own = fract(rnd(i, 5u) + rnd(s, 123u));
  return mix(COME_FROM, COME_TO, mix(shapeAt(i, home, 0.55, 111u), own,
    mix(SCATTER_LO, SCATTER_HI, rnd(s, 124u))));
}

/**
 * What a retired point is still worth, and how much of its letter still has it,
 * both on its own generation's clock.
 *
 * Every generation runs its own age, which is the whole of why several titles'
 * worth of gas can be adrift at once and none of them has to be cut short — and
 * why letting go does not have to wait for anything to arrive.
 */
float ghostAt(float go, float age) {
  return mix(1.0, GO_HOLD, smoothstep(go, go + GO_DROP, age))
    * (1.0 - smoothstep(go + GO_DROP, go + GO_FADE, age));
}
float ghostHold(float go, float age) {
  return 1.0 - smoothstep(go, go + RELEASE_G, age);
}
/** And what an arriving one is worth, which is next to nothing for most of it. */
float rise(float come, float at) {
  return mix(COME_HOLD, 1.0, pow(smoothstep(come, come + COME_FADE, at), COME_CURVE))
    * smoothstep(come, come + COME_LIFT, at);
}
float riseAt(float come) { return rise(come, clamp(uPhase, 0.0, 1.0)); }

/**
 * How much of its arrival a retired point had actually made, read off the same
 * two curves so an interrupted point leaves from exactly where it was drawn.
 */
float wasHeld(float come, float froze) {
  return froze >= 1.0 ? 1.0 : smoothstep(come, GATHERED, froze);
}
float wasUp(float come, float froze) {
  return froze >= 1.0 ? 1.0 : rise(come, froze);
}`;

/**
 * What a loose point is carried by, and where one that has not appeared waits.
 *
 * Both shaders need `stream` — the drawing does not, but the placing of a point
 * that is about to appear does, and that happens in the same pass as the rest.
 */
const FLOW = `
#define FLOW_V ${FLOW_V.toFixed(1)}
#define PUFF ${PUFF.toFixed(1)}
#define RISE ${RISE.toFixed(1)}
#define SPAWN_NEAR ${SPAWN_NEAR.toFixed(1)}
#define SPAWN_FAR ${SPAWN_FAR.toFixed(1)}
#define SPAWN_SCATTER ${SPAWN_SCATTER.toFixed(3)}
#define LEAN ${LEAN.toFixed(1)}
#define RISE_VARY ${RISE_VARY.toFixed(3)}
#define CURL_VARY ${CURL_VARY.toFixed(3)}
#define REACH_VARY ${REACH_VARY.toFixed(3)}
#define EDDY_TIGHT ${EDDY_TIGHT.toFixed(3)}
#define EDDY_BROAD ${EDDY_BROAD.toFixed(3)}

/** The air one title's gas drifts in: the curl, turned and scaled to it. */
vec2 air(uint i, vec2 p, float t) {
  uint s = seedOf(i);
  float a = rnd(s, 151u) * TAU;
  return turn(a) * swirl(turn(-a) * p * mix(EDDY_TIGHT, EDDY_BROAD, rnd(s, 152u)), t);
}

vec2 stream(uint i, vec2 p, float t) {
  uint s = seedOf(i);
  float own = rnd(i, 7u) * TAU;
  float curl = FLOW_V * mix(0.55, 1.45, rnd(i, 37u))
    * mix(1.0 - CURL_VARY, 1.0 + CURL_VARY, rnd(s, 131u));
  float up = RISE * mix(0.3, 1.7, rnd(i, 71u))
    * mix(1.0 - RISE_VARY, 1.0 + RISE_VARY, rnd(s, 132u));
  return air(i, p, t) * curl
    + vec2(cos(own), sin(own)) * PUFF
    + vec2((rnd(s, 133u) * 2.0 - 1.0) * LEAN, -up);
}

vec2 spawn(uint i, vec2 home, float t) {
  vec2 f = air(i, home, t);
  float d = mix(SPAWN_NEAR, SPAWN_FAR, rnd(i, 13u))
    * mix(1.0 - REACH_VARY, 1.0 + REACH_VARY, rnd(seedOf(i), 141u));
  float a = rnd(i, 19u) * TAU;
  return home - f / max(length(f), 1e-3) * d + vec2(cos(a), sin(a)) * (d * SPAWN_SCATTER);
}`;

const SIM_FS = `#version 300 es
precision highp float;
precision highp int;
${HASH}
${SCHEDULE}
${FLOW}
#define POOL_W ${POOL_W}
#define K_HOLD ${K_HOLD.toFixed(1)}
#define K_CATCH ${K_CATCH.toFixed(1)}
#define DAMP ${DAMP.toFixed(3)}
#define DRAG_FREE ${DRAG_FREE.toFixed(3)}
#define FLOW_GRIP ${FLOW_GRIP.toFixed(3)}

uniform sampler2D uPos;
uniform sampler2D uSpot;
uniform sampler2D uVel;
uniform vec2 uGrid;
uniform float uDt;
uniform float uTime;
uniform float uPlace;

out vec4 oPos;

void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  uint i = uint(c.y * POOL_W + c.x);
  vec4 S = texelFetch(uSpot, c, 0);
  vec2 home = S.xy;
  float ph = clamp(uPhase, 0.0, 1.0);
  int g = genOf(i);
  bool living = float(g) == uLive;
  vec2 gen = uGen[g];

  // A slot no title is using, and a generation whose gas is spent.
  if (S.z <= 0.0 || (!living && gen.x >= 1.0)) {
    oPos = vec4(home, 0.0, 0.0);
    return;
  }

  /**
   * The one pass that puts a title's points somewhere rather than moving them:
   * on the shape for a title that is simply appearing — the page's first
   * record, a window resized, a listener who has asked for less movement — and
   * upstream in the flow for one that is going to condense out of it.
   *
   * The second of those cannot be left to the schedule below. A frame carries
   * however long the thread was away, so the first one after a stall can
   * already be past the moment a point was due to appear; a point that has
   * never been placed then integrates from whatever the texture happened to
   * hold, which for a generation nothing has used yet is the origin. That is a
   * title built in the top-left corner and dragged across the screen.
   */
  if (living && uPlace > 0.5) {
    if (uPlace > 1.5) {
      vec2 at = spawn(i, home, uTime);
      oPos = vec4(at, stream(i, at, uTime));
    } else {
      oPos = vec4(home, 0.0, 0.0);
    }
    return;
  }

  float hold = 0.0;
  float take = 0.0;
  if (living) {
    float come = comeAt(i, home);
    if (ph < come) {
      /**
       * A point that has not appeared yet is not integrated at all: it waits
       * upstream at the speed of the flow there, and starts moving on the frame
       * it becomes visible.
       *
       * Which is what makes the arrival honest — nothing crosses the screen to
       * get into position, because there is no position to get into until it is
       * time.
       */
      vec2 at = spawn(i, home, uTime);
      oPos = vec4(at, stream(i, at, uTime));
      return;
    }
    take = smoothstep(come, GATHERED, ph);
  } else {
    // The arrival is only worth reading back on the one generation that was
    // interrupted partway through its own; the rest had all of it.
    float come = gen.y >= 1.0 ? 0.0 : comeAt(i, home);
    hold = wasHeld(come, gen.y) * ghostHold(goAt(i, home), gen.x);
  }

  vec4 P = texelFetch(uPos, c, 0);
  vec2 p = P.xy;
  vec2 v = P.zw;

  float free = clamp(1.0 - hold - take, 0.0, 1.0);

  float k = K_HOLD * hold + K_CATCH * take;
  vec2 a = (home - p) * k;
  // The one velocity a loose point is drawn into: whatever the cursor has
  // stirred up in the bar's fluid, with the curl and the rise added on top of
  // it rather than set against it.
  vec2 flow = texture(uVel, clamp(p / uGrid, vec2(0.0), vec2(1.0))).xy;
  a += (flow + stream(i, p, uTime) - v) * (FLOW_GRIP * free);

  // Damped against whichever spring is pulling, so the harder it is drawn in the
  // harder it is stopped, and it lands on its pixel without ever crossing it.
  v += a * uDt;
  v *= exp(-(DRAG_FREE + DAMP * 2.0 * sqrt(k)) * uDt);
  oPos = vec4(p + v * uDt, v);
}`;

const DRAW_VS = `#version 300 es
precision highp float;
precision highp int;
${HASH}
${SCHEDULE}
#define POOL_W ${POOL_W}
#define GAS_GROW ${GAS_GROW.toFixed(2)}
#define GAS_VARY ${GAS_VARY.toFixed(3)}
#define GAS_REACH ${GAS_REACH.toFixed(1)}

uniform sampler2D uPos;
uniform sampler2D uSpot;
uniform vec2 uView;
uniform float uStep;

out float vCov;
out float vSoft;

void main() {
  uint i = uint(gl_VertexID);
  ivec2 c = ivec2(gl_VertexID % POOL_W, gl_VertexID / POOL_W);
  vec4 S = texelFetch(uSpot, c, 0);
  int g = genOf(i);
  bool living = float(g) == uLive;
  vec2 gen = uGen[g];
  // A slot no title is using, and a generation whose gas is spent. Both are off
  // before a single field is read for them.
  if (S.z <= 0.0 || (!living && gen.x >= 1.0)) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }

  vec2 home = S.xy;
  float ph = clamp(uPhase, 0.0, 1.0);
  float cov = 0.0;
  float hold = 0.0;
  float take = 0.0;
  if (living) {
    float come = comeAt(i, home);
    cov = S.z * riseAt(come);
    take = smoothstep(come, GATHERED, ph);
  } else {
    float come = gen.y >= 1.0 ? 0.0 : comeAt(i, home);
    float go = goAt(i, home);
    cov = S.z * wasUp(come, gen.y) * ghostAt(go, gen.x);
    hold = wasHeld(come, gen.y) * ghostHold(go, gen.x);
  }
  if (cov <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }

  float free = clamp(1.0 - hold - take, 0.0, 1.0);

  vec2 p = texelFetch(uPos, c, 0).xy;
  // Loose says nothing is holding it, and the reach says it is not on its pixel.
  // A point is gas only while both are true, so one that has landed is its own
  // pixel whatever the schedule says, and one that has lifted away is gas.
  float soft = min(free, clamp(distance(p, home) / GAS_REACH, 0.0, 1.0));

  // The spread is spent on the gas alone: settled, every sample is worth
  // exactly the coverage the rasteriser found under it.
  vCov = cov * mix(1.0, mix(1.0 - GAS_VARY, 1.0 + GAS_VARY, rnd(i, 53u)), soft);
  vSoft = soft;

  gl_PointSize = uStep + GAS_GROW * soft * mix(1.0 - GAS_VARY, 1.0 + GAS_VARY, rnd(i, 41u));
  vec2 ndc = (p / uView) * 2.0 - 1.0;
  gl_Position = vec4(ndc.x, -ndc.y, 0.0, 1.0);
}`;

/**
 * Coverage in, coverage out.
 *
 * The colour is multiplied up by the figure that undoes the resolve's rolloff,
 * so a sample that was a fifth covered in the rasteriser resolves to a fifth
 * here — which is the whole of why a settled cloud reads as type rather than as
 * something type-shaped.
 */
const DRAW_FS = `#version 300 es
precision highp float;
uniform vec3 uInk;
uniform float uCeil;
uniform float uFade;
in float vCov;
in float vSoft;
out vec4 oColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float cov = vCov * mix(1.0, max(0.0, 1.0 - dot(d, d) * 4.0), vSoft);
  cov = clamp(cov, 0.0, 0.995);
  if (cov <= 0.0) discard;
  // The reveal is taken off the coverage, because coverage is what the resolve
  // hands back: a scaled peak comes back as one minus the rolloff to the power
  // of the fade, so the body of the type stood at half opacity an eighth of the
  // way through and the genre line under it trailed the whole reveal. Asked for
  // this way the pixel resolves to cov times the fade, which is the fade the
  // element's own text would have run. What it costs is a pixel carrying two
  // points coming up fast, and a settled cloud is one point per pixel.
  float peak = -log(1.0 - cov * uFade);
  if (peak <= 0.0) discard;
  vec3 c = uInk * peak;
  oColor = vec4(c, max(c.r, max(c.g, c.b)) * uCeil);
}`;

/**
 * `cubic-bezier(.85, 0, .45, 1)` solved for its y, which is the curve the
 * stylesheet fades the three lines on and the one figure the reveal here was
 * missing. Newton from the straight line as a first guess, which this curve is
 * monotone enough in x for four passes to land inside a step of brightness.
 */
const REVEAL_X1 = 0.85;
const REVEAL_X2 = 0.45;
function revealCurve(x: number): number {
  let t = x;
  for (let i = 0; i < 4; i += 1) {
    const u = 1 - t;
    const dx = 3 * u * u * REVEAL_X1 + 6 * u * t * (REVEAL_X2 - REVEAL_X1) + 3 * t * t * (1 - REVEAL_X2);
    if (dx <= 1e-6) break;
    t -= (3 * u * u * t * REVEAL_X1 + 3 * u * t * t * REVEAL_X2 + t * t * t - x) / dx;
  }
  const c = Math.min(1, Math.max(0, t));
  // y1 is 0 and y2 is 1, so those two terms are all that is left of the cubic.
  return 3 * (1 - c) * c * c + c * c * c;
}

export interface TitleCloud {
  /**
   * Let go of whatever is up, now.
   *
   * Called the instant somebody asks for another record rather than when one
   * is ready to take its place — the gas is what covers the wait, so it cannot
   * be on the far side of it.
   */
  release(): void;
  /** Hand over what is to condense, once that exists to be measured. */
  arrive(ink: TitleInk | null): void;
  /** Whether a changeover is still running, so the field knows to stay awake. */
  busy(): boolean;
  /**
   * Bring a title that is simply there up from nothing, which is the page's own
   * reveal rather than a changeover — see `reveal` in the implementation.
   */
  reveal(delayMs: number, durMs: number): void;
  step(dt: number, time: number, vel: WebGLTexture, gridW: number, gridH: number): void;
  /**
   * `ceil` is how far above page white the words may go, and the field decides
   * it — the range belongs to the record that is playing, not to the name.
   */
  draw(viewW: number, viewH: number, ceil: number): void;
  destroy(): void;
}

/**
 * What the cloud borrows from the field it draws inside.
 *
 * All of it already exists there, and none of it is worth a second copy: the
 * context, the four helpers every pass in that file is written against, the
 * accumulation target, and the way it is kept awake.
 */
export interface CloudHost {
  gl: WebGL2RenderingContext;
  link(vs: string, fs: string): WebGLProgram;
  locate(prog: WebGLProgram, names: string[]): void;
  u(prog: WebGLProgram, name: string): WebGLUniformLocation | null;
  bindTex(prog: WebGLProgram, name: string, unit: number, tex: WebGLTexture): void;
  pass(prog: WebGLProgram, target: WebGLFramebuffer | null, w: number, h: number): void;
  acc(): WebGLFramebuffer | null;
  wake(ms: number): void;
}

/**
 * A cloud of title particles, drawn into a buffer somebody else owns.
 *
 * It adds its points to the field's accumulation target, and that is what buys
 * it the field's tone map: the title's pixels go through the one resolve, so
 * they can be brighter than page white on a screen with the range for it and
 * are the same image as before on one without.
 */
export function mountTitleCloud(host: CloudHost): TitleCloud {
  const { gl, link, locate, u, bindTex, pass, acc, wake } = host;
  const simProg = link(
    `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`,
    SIM_FS,
  );
  const drawProg = link(DRAW_VS, DRAW_FS);
  locate(simProg, ['uPos', 'uSpot', 'uVel', 'uGrid', 'uDt', 'uTime',
    'uPhase', 'uLive', 'uGen[0]', 'uSeed[0]', 'uBox[0]', 'uPlace']);
  locate(drawProg, ['uPos', 'uSpot', 'uView', 'uInk', 'uStep', 'uCeil',
    'uPhase', 'uLive', 'uGen[0]', 'uSeed[0]', 'uBox[0]', 'uFade']);

  function makeTex(): WebGLTexture {
    const tex = gl.createTexture();
    if (!tex) throw new Error('title-cloud: no texture');
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, POOL_W, POOL_H);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  function target(tex: WebGLTexture): WebGLFramebuffer {
    const fbo = gl.createFramebuffer();
    if (!fbo) throw new Error('title-cloud: no target');
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('title-cloud: float targets are not renderable here');
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return fbo;
  }

  const posTex = [makeTex(), makeTex()];
  const posFbo = [target(posTex[0]!), target(posTex[1]!)];
  /** Where each point belongs and what it is worth: home in x and y, coverage in z. */
  const spotTex = makeTex();
  let front = 0;

  const spot = new Float32Array(SLOTS * 4);
  /**
   * What each generation's changeover is drawn from, and the box that
   * generation's words cover: centre in x and y, half of the extent in z and w.
   */
  const seed = new Float32Array(GENS);
  const boxes = new Float32Array(GENS * 4);

  /** Which generation holds the title, and which one the next record takes. */
  let liveGen = -1;
  let ring = 0;
  /** Whether a title has been let go of and nothing has arrived in its place. */
  let awaiting = false;
  /** The generation that is waiting, whose fade is held while it does. */
  let heldGen = -1;
  /**
   * When each generation stopped being the title, and how much of its own
   * arrival it had made by then. Handed to both shaders every frame as `uGen`.
   */
  const retiredAt = new Array<number>(GENS).fill(-1);
  const frozeAt = new Array<number>(GENS).fill(1);
  const gen = new Float32Array(GENS * 2);
  /** Whether any title has ever been read into the pool. */
  let anyInk = false;
  /**
   * One pass that puts a title's points somewhere rather than moving them:
   * 1 on the shape itself, 2 upstream in the flow to condense out of.
   */
  let placing = 0;
  /**
   * Wall milliseconds, counted here rather than read, and honestly.
   *
   * It was frame time for a while, so that a changeover beginning into a
   * blocked thread could not be half over by the first frame anybody saw of it.
   * That is now handled where it belongs — the words are let go of at the press
   * and `painted` in `web/radio.ts` hands the screen a frame before the compile
   * takes the thread, so the gesture is always seen to start. What frame time
   * cost was everything else: the genre and era beside these words fade on the
   * compositor, which goes on running through a blocked thread, and a title
   * that could not drifted a whole compile's worth behind them.
   *
   * Counted straight, the pair cannot come apart. A stall costs both of them
   * the same frames and both pick up in the same place.
   */
  let clock = 0;
  let wallAt = 0;
  let startedAt = 0;
  let running = false;
  /** When the whole cloud is up, and over how long it came up. */
  let revealAt = -Infinity;
  let revealMs = 0;
  let step = 1;

  /** Write one title into one generation of the pool. */
  function upload(ink: TitleInk, into: number): void {
    spot.fill(0);
    const n = Math.min(SLOTS, ink.n);
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (let i = 0; i < n; i++) {
      const a = i * 4;
      const j = i * 3;
      const x = ink.pts[j]!;
      const y = ink.pts[j + 1]!;
      spot[a] = x;
      spot[a + 1] = y;
      spot[a + 2] = ink.pts[j + 2]!;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    // Off the lit points rather than off the element, which is the only box that
    // says where the words are and not where they were allowed to go.
    const b = into * 4;
    boxes[b] = n > 0 ? (x0 + x1) / 2 : 0;
    boxes[b + 1] = n > 0 ? (y0 + y1) / 2 : 0;
    boxes[b + 2] = n > 0 ? Math.max(1, (x1 - x0) / 2) : 1;
    boxes[b + 3] = n > 0 ? Math.max(1, (y1 - y0) / 2) : 1;
    gl.bindTexture(gl.TEXTURE_2D, spotTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, into * GEN_ROWS,
      POOL_W, GEN_ROWS, gl.RGBA, gl.FLOAT, spot);
    step = ink.step;
    anyInk = true;
  }

  function phase(): number {
    if (!running) return 1;
    return Math.min(1, (clock - startedAt) / CLOUD_MS);
  }

  /**
   * Every generation's age and interrupted arrival, for the shaders.
   *
   * An age at 2 is a generation with nothing in it or nothing left of it, which
   * is what both shaders cull on before they read a field for it.
   */
  function genState(): Float32Array {
    for (let g = 0; g < GENS; g++) {
      const at = retiredAt[g]!;
      gen[g * 2] = at < 0 ? 2 : Math.min(2, (clock - at) / GHOST_MS);
      gen[g * 2 + 1] = frozeAt[g]!;
    }
    return gen;
  }

  /** Whether any generation still has gas of its own on the screen. */
  function drifting(): boolean {
    for (let g = 0; g < GENS; g++) {
      const at = retiredAt[g]!;
      if (at >= 0 && clock - at < GHOST_MS) return true;
    }
    return false;
  }

  /**
   * The whole cloud's own opacity, which only the first title ever spends.
   *
   * It is the fade the page would have run on its own text, run here instead —
   * the placeholder bars still narrow onto the words, and what comes up under
   * them is particles rather than the element, so the pixels are never the
   * element's to begin with.
   *
   * On the stylesheet's curve and not a straight ramp, because the genre and
   * era lines beside it are on that curve: taken straight, the name was a third
   * of the way up while the two lines under it were still at a fortieth, and
   * the reveal came apart into the title arriving and then everything else.
   */
  function revealed(): number {
    if (revealMs <= 0) return 1;
    const x = (performance.now() - revealAt) / revealMs;
    return revealCurve(Math.min(1, Math.max(0, x)));
  }

  return {
    release(): void {
      // Nothing is up, or it has already been let go of — a skip lets go at the
      // press and the changeover asks again on the downbeat, and the second ask
      // must not restart anything.
      if (liveGen < 0) return;
      // The title retires into a generation of its own and drifts there on its
      // own clock, which is why nothing has to arrive for this to happen. Taken
      // over from wherever the last changeover had got to rather than
      // restarted: a point still on its way up leaves from however far up it
      // had got.
      retiredAt[liveGen] = clock;
      frozeAt[liveGen] = running ? phase() : 1;
      heldGen = liveGen;
      liveGen = -1;
      awaiting = true;
      running = false;
      wake(GHOST_MS + 200);
    },
    arrive(ink: TitleInk | null): void {
      if (!ink) return;
      if (liveGen < 0) {
        liveGen = ring;
        ring = (ring + 1) % GENS;
        // It is the title now, and whatever it was carrying is written over.
        retiredAt[liveGen] = -1;
        frozeAt[liveGen] = 1;
        // The one draw a whole changeover is shaped by, taken here and not on
        // release: a reflow hands the same words back and must not reshape a
        // gathering already halfway through.
        seed[liveGen] = Math.floor(Math.random() * 65536);
      }
      if (awaiting) {
        // Something was let go of and this is what replaces it. The condensing
        // is clocked from here, which is the moment there is anything to
        // condense — not from whenever the asking happened; and the gas that
        // was covering the wait picks its own fade up from where it was held.
        awaiting = false;
        heldGen = -1;
        startedAt = clock;
        running = true;
        placing = 2;
      } else {
        /**
         * A title arriving with nothing let go of is simply put where it
         * belongs: there is no wait for it to condense across, so every point
         * is placed on the shape rather than drawn onto it.
         *
         * It is how the page's first title goes up, how a window being resized
         * reflows, and how a changeover reads for somebody who has asked for
         * less movement.
         */
        placing = 1;
      }
      upload(ink, liveGen);
      wake(running ? CLOUD_MS + 200 : 200);
    },
    busy(): boolean {
      // Nothing has ever been read into the pool, so nothing is going to move
      // the clock the other two are read against — see `clock`.
      if (!anyInk) return false;
      return (running && phase() < 1) || drifting() || revealed() < 1;
    },
    reveal(delayMs: number, durMs: number): void {
      revealAt = performance.now() + delayMs;
      revealMs = durMs;
      wake(delayMs + durMs + 60);
    },
    step(dt: number, time: number, vel: WebGLTexture, gridW: number, gridH: number): void {
      if (!anyInk) return;
      // See `clock`. Substeps of one frame read the same instant, so only the
      // first of them carries anything.
      const now = performance.now();
      clock += wallAt === 0 ? 0 : now - wallAt;
      wallAt = now;
      // The waiting generation is carried along rather than aged. See `GO_HELD`.
      if (heldGen >= 0) {
        const pin = clock - GO_HELD * GHOST_MS;
        if (retiredAt[heldGen]! < pin) retiredAt[heldGen] = pin;
      }
      if (running && phase() >= 1) running = false;
      const back = front === 0 ? 1 : 0;
      pass(simProg, posFbo[back]!, POOL_W, POOL_H);
      bindTex(simProg, 'uPos', 0, posTex[front]!);
      bindTex(simProg, 'uSpot', 1, spotTex);
      bindTex(simProg, 'uVel', 2, vel);
      gl.uniform2f(u(simProg, 'uGrid'), gridW, gridH);
      gl.uniform1f(u(simProg, 'uDt'), dt);
      gl.uniform1f(u(simProg, 'uTime'), time);
      gl.uniform1f(u(simProg, 'uPhase'), phase());
      gl.uniform1f(u(simProg, 'uLive'), liveGen);
      gl.uniform2fv(u(simProg, 'uGen[0]'), genState());
      gl.uniform1fv(u(simProg, 'uSeed[0]'), seed);
      gl.uniform4fv(u(simProg, 'uBox[0]'), boxes);
      gl.uniform1f(u(simProg, 'uPlace'), placing);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      front = back;
      // One pass is all a placing takes, and every substep after it would be
      // the same write.
      placing = 0;
    },
    draw(viewW, viewH, ceil): void {
      if (!anyInk) return;
      const target = acc();
      if (!target) return;
      const up = revealed();
      if (up <= 0) return;
      pass(drawProg, target, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      bindTex(drawProg, 'uPos', 0, posTex[front]!);
      bindTex(drawProg, 'uSpot', 1, spotTex);
      gl.uniform2f(u(drawProg, 'uView'), viewW, viewH);
      // `--ink`, and it does not move. A title changing colour as it comes
      // apart says the name is changing into something; it is only changing.
      gl.uniform3f(u(drawProg, 'uInk'), 0.949, 0.918, 0.882);
      gl.uniform1f(u(drawProg, 'uStep'), Math.max(1, step));
      // Page white on a screen with nothing above it, and a tenth of a stop
      // over on one that has — but only while a record is on. See the call.
      gl.uniform1f(u(drawProg, 'uCeil'), ceil);
      gl.uniform1f(u(drawProg, 'uPhase'), phase());
      gl.uniform1f(u(drawProg, 'uLive'), liveGen);
      gl.uniform2fv(u(drawProg, 'uGen[0]'), genState());
      gl.uniform1fv(u(drawProg, 'uSeed[0]'), seed);
      gl.uniform4fv(u(drawProg, 'uBox[0]'), boxes);
      gl.uniform1f(u(drawProg, 'uFade'), up);
      gl.drawArrays(gl.POINTS, 0, POOL);
    },
    destroy(): void {
      for (const t of posTex) gl.deleteTexture(t);
      for (const f of posFbo) gl.deleteFramebuffer(f);
      gl.deleteTexture(spotTex);
      gl.deleteProgram(simProg);
      gl.deleteProgram(drawProg);
    },
  };
}
