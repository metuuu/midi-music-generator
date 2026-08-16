/**
 * The glow bar, as gas.
 *
 * The bar is not a drawn shape and not a displaced string. It is a few tens of
 * thousands of particles strung into filaments, sitting in a real fluid.
 *
 * Three things, and everything visible falls out of them:
 *
 * **A fluid.** A velocity field on a coarse grid, solved the standard way —
 * semi-Lagrangian advection, then a Jacobi pressure solve that projects the
 * field divergence-free. The cursor drags the fluid along with it. That is the
 * whole of the cursor's involvement: it never touches a particle directly.
 * Dragging a blob through a fluid leaves a counter-rotating vortex pair
 * straddling its path, and that is what curls the torn ends of the bar back on
 * themselves. Nothing scripts the hook; it is what the projection does.
 *
 * **Filaments.** The bar itself is chains of particles linked to their
 * neighbours along its length. A link stretched past `BREAK` is cut, and stays
 * cut. That is a real cut: no force is left across it, so the gap holds open
 * and the two ends move independently. The version before this faked it by
 * dimming particles while a string still spanned the gap, which is why it
 * never felt severed.
 *
 * **A halo it gives off.** The glow is not a cloud the bar wears, it is gas the
 * bar emits: each halo particle is born on the line, drifts out, fades, and is
 * born on the line again. That holds a steady soft glow in which nothing is
 * standing still, and it needs no rule to make it follow the bar — a source has
 * no resting place of its own, so wherever the line goes the glow leaves from
 * there, and a stretch torn away emits nothing and goes dark.
 *
 * **Heat.** One number per particle, deciding whether it belongs to the bar or
 * to the air. Hot particles let go of their rest position and grip the fluid;
 * cold ones are held to the bar and barely feel it. The cursor heats what it
 * sweeps past, in proportion to its speed — so a resting hand does nothing — and
 * a snapping link heats both its ends. Heat decays, so a torn piece drifts,
 * cools, comes home under a speed-capped spring, and re-links. The bar puts
 * itself back together without anything having to remember it was ever a bar.
 *
 * Units are CSS pixels throughout, velocities included. The device pixel ratio
 * is applied once, at draw time; nothing in the simulation knows about it.
 */

export interface GlowField {
  setKey(hue: number, hue2: number): void;
  /**
   * Whether the bar is a live thing or scenery. A stopped bar gives off no gas
   * and takes no notice of the cursor.
   */
  setPlaying(playing: boolean): void;
  destroy(): void;
}

export interface GlowFieldOptions {
  onLost?: () => void;
  /** What the transport is doing at the moment the field is mounted. */
  playing?: boolean;
  /**
   * What a finger may be doing that is not cutting — anything there to be
   * pressed, dragged or scrolled. A touch landing inside one of these is left
   * entirely alone; everywhere else on the page is somewhere a cut can start.
   */
  keepTouch?: string;
}

interface Target {
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
}

interface Pool {
  pos: WebGLTexture;
  st: WebGLTexture;
  fbo: WebGLFramebuffer;
}

// ── the band ──────────────────────────────────────────────────────────────
const COLS = 768;
const STRANDS = 96;
const BAR_H = 5;
const RIM_SIGMA = 3.2;
const BLOOM_SIGMA = 9;
const W_CORE = 0.62;
const W_RIM = 0.86;

const SPRITE_CORE = 1.6;
const SPRITE_RIM = 4.5;
const SPRITE_BLOOM = 11;
const ALPHA_CORE = 0.19;
// Brighter per particle than a standing cloud needed, because an emitted one
// spends much of its life faded in or out rather than at full strength.
const ALPHA_RIM = 0.032;
const ALPHA_BLOOM = 0.0068;
const WANDER_CORE = 0.25;
const WANDER_K1 = 7.5;
const WANDER_K2 = 19;
const HEAT_GAIN = 3.2;
const GROW = 0.35;

// ── the fluid ─────────────────────────────────────────────────────────────
const CELL = 10;
const GRID_MAX = 180;
const VISC = 0.55;
const ITERS = 24;
const GRAB = 40;
const BLOB = 46;
const STIR_SPEED = 26;
const STIR_GRIP = 0.35;
const STIR_WAVES = 6;
const STIR_LONG = 520;
const STIR_CHURN = 40;

// ── the filaments ─────────────────────────────────────────────────────────
const K_LINK = 1400;
/**
 * What stops the line folding to a point.
 *
 * Links hold neighbours apart but say nothing about the angle between them, so
 * a chain of them can turn a corner in a single node — and nothing made of gas
 * has a corner like that in it. Resisting the second difference along the
 * strand turns a kink into an arc.
 *
 * Sized against `K_HOME`, which sets how far down it bites: features shorter
 * than about `sqrt(SMOOTH / K_HOME)` nodes get rounded away, four here, a
 * couple of pixels, roughly the thickness of the bar. Everything longer is
 * untouched — a hand's-breadth bend spans thousands of nodes and does not feel
 * this at all — which is why it smooths corners without stiffening the line.
 */
const SMOOTH = 9000;
const K_HOME = 560;
const HOT_HOLD = 0.06;
const DRAG = 6;
const DRAG_COLD = 0.12;
const DRAG_HOT = 1.9;
const DRAG_FREE = 1.6;

/**
 * The halo, which the bar emits rather than wears.
 *
 * Every halo particle is born on the line, drifts outward, and fades out; when
 * it is spent it is born on the line again. Held steady that adds up to the
 * same soft glow as a fixed cloud would, except that nothing in it is standing
 * still — which is the difference between a picture of a glow and a glow.
 *
 * Being emitted is also what keeps it *attached*. A cloud with its own resting
 * place has its own life, and drifts around looking unrelated to the bar; gas
 * has no resting place, only a source, so wherever the bar goes — bent,
 * dragged, torn open — the glow comes off it there and the gap in a cut is a
 * gap in the glow too. It follows without being told to.
 *
 * Emitting in every direction is what rounds the ends, as well: a line seen
 * through gas it is giving off in all directions is a capsule, with no special
 * case needed for where it stops.
 */
const HALO_LIFE = 2.0;
/**
 * How much harder a stirred-up piece of bar throws its gas off.
 *
 * This is what carries a tear now. The line lets go of a scrap for a moment and
 * has it back almost at once; what is seen flying is the halo, flung outward
 * where the bar is hot and then drifting and fading on `HALO_LIFE`, which the
 * healing never consults. Lengthen it and gas hangs about longer with the bar
 * knitting shut exactly as fast as before.
 */
const BLAST = 6;
/** How readily gas out on its own takes up the flow it is drifting in. */
const LOOSE_GRIP = 4;
const HALO_IN = 0.18;
const HALO_OUT = 0.35;
const EMIT_RATE = 1.6;
const SWIRL_RATE = 1.1;
/**
 * A note on why the halo has no physics of its own at all.
 *
 * Three ways of making the glow answer the mouse like the line all failed, and
 * they failed for one reason: the glow was answering the mouse.
 *
 * Matching drag cannot work, because the gap is not drag — the bar has a spring
 * holding it somewhere and gas has nothing, so any flow settles them at
 * different speeds. Carrying the glow at the line's speed and then blowing it
 * with the wind *past* the line cannot work either, though it looks as if it
 * should: the two terms add back up to exactly the speed it had before. And
 * giving the glow the bar's own spring, aimed at a point that moves with the
 * bar, is worst of all — the target is itself on a spring, so it is two
 * oscillators chained together, and it bounces like one.
 *
 * So the glow has no springs, no drag and no damping. It stores one point: how
 * far it has drifted from the strand that made it, which grows as it ages and
 * is all the movement of its own it has. Where it is drawn is that strand, plus
 * that. It bends, flings and springs back on precisely the same rubber as the
 * bar, because it is riding the bar rather than imitating it.
 */
const CORE_ROWS = Math.ceil(W_CORE * STRANDS - 0.5);
const DAMP_BOUND = 7.5;
const DAMP_FREE = 0.8;
// Multiples of the link's rest length, which is the bar's width over COLS —
// so both of these have to move if COLS does, or the bar tears at a different
// width than it used to.
const BREAK = 8;
/**
 * How much sooner a strand at the outside of the band parts than one down its
 * middle.
 *
 * A cut is otherwise a flat wall with two square corners, because every strand
 * gives way at much the same place. The bar's own ends are rounded — each
 * strand starts and stops a little short of the one inside it — and this is
 * that same shape, except cut by the tear rather than drawn in: the outer
 * strands part under less strain, so more of them goes, and the face left
 * behind is blunt.
 */
const BREAK_EDGE = 0.55;
/**
 * How much harder the outside of the band fades back from a cut than its
 * middle, which is what rounds the corners off the face a cut leaves.
 *
 * The face is otherwise square in the only way that matters: the last particle
 * before a gap is at full brightness and the next one is not there at all, so
 * the edge is sharp in *opacity*, over half a pixel, and moving particles about
 * cannot soften something that is sharp for that reason. What does is letting a
 * particle be as present as there is strand around it — dark at the face,
 * whole again a few pixels in — and fading the outer strands over a longer run
 * than the middle ones, so the taper is deeper at the top and bottom of the
 * band than down its centre.
 */
const EDGE_BITE = 2.5;
const RELINK = 2.5;
// How far a cut has to have cooled before it will knit. Paired with COOL: a
// piece coming back is exempt from being called adrift for about GROW, and it
// has to be able to knit inside that, or it leaves again and cycles.
const RELINK_COOL = 0.85;
const COOL = 0.85;
const HEAT_SLOW = 520;
const HEAT_FAST = 1900;
/**
 * How long a returning piece lies dark before it starts to show, randomised
 * per particle.
 *
 * This is where the unevenness in a healing cut belongs, and the reason is
 * which clock it is on. A piece counts as bar the instant it is back, so the
 * next one along may follow it immediately whether this one has appeared yet
 * or not: the waiting is in how it *looks*, never in how fast the line comes
 * back. Putting the same unevenness in the gas — holding a piece out there for
 * a randomised while before letting it return — stalls the front behind
 * whichever piece drew the longest life, which is gas deciding the pace of the
 * bar and is not its business.
 */
const WAIT = 0.2;

// ── torn off, and on its way out ──────────────────────────────────────────
const TEAR_AWAY = 58;
/**
 * How long a cut lies open before it knits shut — the bar's own clock, and the
 * point of it is what it is not tied to.
 *
 * The gas life served as this, so the drifting scraps set the pace of the
 * healing: ask for debris that hangs about for two seconds and the line took
 * two seconds to come back, which is none of the debris's business.
 *
 * They cannot simply be separated, though, because a piece has to have faded
 * before it can be put back — it is the same particle in both places, and one
 * still bright would be seen to jump. So the piece that leaves only flashes and
 * goes (`FREE_LIFE`, which has to land inside this), and what actually flies is
 * the halo, thrown clear by the heat of the tear and living out its own life
 * well after the bar it came off has closed over. Different particles: that is
 * the only way to have both.
 */
const HEAL_WAIT = 0.22;
/**
 * How much more readily an end left by a cut gives way than bar with
 * neighbours on both sides.
 *
 * A slice leaves the two remaining ends tapering to a spike, because the tear
 * follows the cursor's rounded reach and its outermost fringe barely parts at
 * all. A spike is the pointiest thing on the screen and the last thing gas
 * would do. An exposed end is the most stretched part of what is left, so
 * letting it go first erodes the taper back to where the bar is whole and the
 * cut ends up blunt.
 */
const FRAY = 0.35;
/**
 * Two kinds of strand, and a cut heals in two passes because of them.
 *
 * The bar cannot both hold its material out in the air and have it back at
 * once — it is the same particle in both places. But it does not need *all* of
 * it back to look like a bar. So some strands are kept and some are given up:
 * the kept ones flash and are back inside `HEAL_WAIT`, closing the cut, and the
 * given-up ones fly properly and stay out for `SHED_LIFE`, filling the bar back
 * to full some time after it already reads as whole.
 *
 * Which matters because debris has to be made of bar to look like anything.
 * Throwing the halo instead was worth about a fourteenth of the brightness —
 * it is the faint glow, not the bright line, and no share of it adds up to a
 * cut's worth of material.
 *
 * Each strand is its own chain, so a given-up one healing slowly never holds a
 * kept one up. `FREE_HOLD` is a fraction of whichever life applies rather than
 * a time, or a two-second scrap would spend a tenth of a second bright and the
 * rest fading.
 */
const SHED_SHARE = 0.45;
const SHED_LIFE = 2;
const FREE_LIFE = 0.18;
const FREE_HOLD = 0.3;
const RISE_V = 40;
const SWIRL_V = 46;
const SWIRL_WAVES = 4;
const SWIRL_LONG = 190;
const SWIRL_CHURN = 55;

const SETTLE_MS = 5400;
const IDLE_MS = 90;
const AIR_MS = 1200;
const GAS_MS = (SHED_LIFE + WAIT + GROW + HALO_LIFE) * 1000;
/**
 * Frames to run for after the transport changes, which is the one thing that
 * happens to this field with nobody's hand near it.
 *
 * Long enough for the whole halo to have gone or the whole halo to have come
 * back: the longest life a particle can be partway through when the emitting
 * stops, and on the way in the longest wait one can be given before it starts
 * living that life. Short of this the drain would finish on the idle
 * heartbeat, a ninth of the frame rate, which is plenty for a slow drift and
 * not for a fade with an end to it.
 */
const EMIT_MS = HALO_LIFE * (1.4 + 1) * 1000;
const KEY_MS = 1800;
const MAX_DT = 1 / 30;
const SUB = 1 / 200;
const SUB_MAX = 6;
const JUMP_MAX = 900;
const CURSOR_MAX = 5500;

const QUAD_VS = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

/** How near a point is to the cursor's whole path across this frame. */
const SEG = `
uniform vec2 uFrom;
uniform vec2 uTo;
uniform vec2 uCursorV;
uniform float uCursorOn;

float segDist(vec2 p) {
  vec2 ab = uTo - uFrom;
  float L = dot(ab, ab);
  float t = L > 1e-4 ? clamp(dot(p - uFrom, ab) / L, 0.0, 1.0) : 0.0;
  return distance(p, uFrom + ab * t);
}`;

const ADVECT_FS = `#version 300 es
precision highp float;
${SEG}
#define VISC ${VISC.toFixed(3)}
#define GRAB ${GRAB.toFixed(2)}
#define BLOB ${BLOB.toFixed(1)}
#define STIR_SPEED ${STIR_SPEED.toFixed(2)}
#define STIR_GRIP ${STIR_GRIP.toFixed(3)}
#define STIR_WAVES ${STIR_WAVES}
#define STIR_LONG ${STIR_LONG.toFixed(1)}
#define STIR_CHURN ${STIR_CHURN.toFixed(1)}

uniform sampler2D uVel;
uniform vec2 uGrid;
uniform float uDt;
uniform float uTime;

out vec2 oVel;

/**
 * The room's own air. Each term is a sinusoid pushed along its own
 * perpendicular, which is divergence-free by construction — so the pressure
 * solve has nothing to correct in it and the ambient drift survives projection.
 */
vec2 stir(vec2 p) {
  vec2 f = vec2(0.0);
  for (int n = 0; n < STIR_WAVES; n++) {
    float fn = float(n);
    float k = 6.28318530718 / (STIR_LONG / (1.0 + fn * 0.7));
    float ang = fn * 2.39996 + 0.61;
    vec2 d = vec2(cos(ang), sin(ang));
    float amp = 1.0 / (0.8 + fn);
    float drift = mod(fn, 2.0) < 0.5 ? -STIR_CHURN : STIR_CHURN;
    f += (amp * cos(dot(d, p) * k + fn * 5.13 + uTime * k * drift)) * vec2(d.y, -d.x);
  }
  return f * 0.6;
}

void main() {
  vec2 cell = gl_FragCoord.xy;
  vec2 size = vec2(textureSize(uVel, 0));
  vec2 p = cell * (uGrid / size);
  vec2 v = texture(uVel, cell / size).xy;

  v = texture(uVel, (p - v * uDt) / uGrid).xy;
  v *= exp(-VISC * uDt);
  v += (stir(p) * STIR_SPEED - v) * min(STIR_GRIP * uDt, 1.0);

  // A still cursor drags the air to a standstill, which is what a still hand
  // in the way of a draught actually does.
  if (uCursorOn > 0.5) {
    float d = segDist(p) / BLOB;
    v += (uCursorV - v) * (exp(-d * d) * min(GRAB * uDt, 1.0));
  }
  oVel = v;
}`;

const DIV_FS = `#version 300 es
precision highp float;
#define CELL ${CELL.toFixed(2)}
uniform sampler2D uVel;
out float oDiv;

vec2 at(ivec2 c) {
  ivec2 n = ivec2(textureSize(uVel, 0));
  return texelFetch(uVel, clamp(c, ivec2(0), n - 1), 0).xy;
}

void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  oDiv = (at(c + ivec2(1, 0)).x - at(c - ivec2(1, 0)).x
    + at(c + ivec2(0, 1)).y - at(c - ivec2(0, 1)).y) / (2.0 * CELL);
}`;

const JACOBI_FS = `#version 300 es
precision highp float;
#define CELL ${CELL.toFixed(2)}
uniform sampler2D uPrs;
uniform sampler2D uDiv;
out float oPrs;

float at(ivec2 c) {
  ivec2 n = ivec2(textureSize(uPrs, 0));
  return texelFetch(uPrs, clamp(c, ivec2(0), n - 1), 0).x;
}

void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  float d = texelFetch(uDiv, c, 0).x;
  oPrs = (at(c - ivec2(1, 0)) + at(c + ivec2(1, 0))
    + at(c - ivec2(0, 1)) + at(c + ivec2(0, 1)) - CELL * CELL * d) * 0.25;
}`;

const PROJECT_FS = `#version 300 es
precision highp float;
#define CELL ${CELL.toFixed(2)}
uniform sampler2D uVel;
uniform sampler2D uPrs;
out vec2 oVel;

float at(ivec2 c) {
  ivec2 n = ivec2(textureSize(uPrs, 0));
  return texelFetch(uPrs, clamp(c, ivec2(0), n - 1), 0).x;
}

void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  ivec2 n = ivec2(textureSize(uVel, 0));
  // The border holds still, or the whole field slides off toward one corner.
  if (c.x == 0 || c.y == 0 || c.x == n.x - 1 || c.y == n.y - 1) {
    oVel = vec2(0.0);
    return;
  }
  vec2 v = texelFetch(uVel, c, 0).xy;
  v.x -= (at(c + ivec2(1, 0)) - at(c - ivec2(1, 0))) / (2.0 * CELL);
  v.y -= (at(c + ivec2(0, 1)) - at(c - ivec2(0, 1))) / (2.0 * CELL);
  oVel = v;
}`;

/** The rest layout of the band, shared by the simulation and the draw pass. */
const HOME = `
#define COLS ${COLS}
#define STRANDS ${STRANDS}
#define BAR_H ${BAR_H.toFixed(2)}
#define RIM_SIGMA ${RIM_SIGMA.toFixed(2)}
#define BLOOM_SIGMA ${BLOOM_SIGMA.toFixed(2)}
#define W_CORE ${W_CORE.toFixed(3)}
#define W_RIM ${W_RIM.toFixed(3)}
#define WANDER_CORE ${WANDER_CORE.toFixed(3)}
#define WANDER_K1 ${WANDER_K1.toFixed(3)}
#define WANDER_K2 ${WANDER_K2.toFixed(3)}

uniform vec3 uBar;

uint hashU(uint x) {
  x ^= x >> 16; x *= 0x7feb352du;
  x ^= x >> 15; x *= 0x846ca68bu;
  x ^= x >> 16; return x;
}
float rnd(uint i, uint k) {
  return float(hashU(i * 9781u + k) & 0xffffffu) / 16777216.0;
}
/**
 * Where a particle belongs when nothing has disturbed it.
 *
 * The two populations are laid out on opposite principles, because they are
 * different kinds of thing.
 *
 * **The core is the bar.** It has to hold together, stretch and tear, so it is
 * built of filaments: one offset per strand, held for the strand's length, with
 * the strands stratified at even steps so none of them can double up. They are
 * a twelfth of a pixel apart, which is a solid slab.
 *
 * **The halo has no rest position at all**, so there is nothing to lay out: it
 * is emitted, and this only says where it first appears. That is also why it
 * cannot read as ghost lines — a chain draws a curve, and a curve is a line
 * whether straight or woven, but gas leaving a source in every direction has
 * no row to line up in.
 */
vec2 homeOf(ivec2 c, out float t, out int pop) {
  uint s = uint(c.y);
  float sv = (float(c.y) + 0.5) / float(STRANDS);
  float u = (float(c.x) + rnd(s, 11u)) / float(COLS);
  t = u;

  float off;
  if (sv < W_CORE) {
    pop = 0;
    off = ((sv / W_CORE) * 2.0 - 1.0) * (BAR_H * 0.5);
    // Slow enough along the strand that the link springs do not fight it.
    off += (sin(u * WANDER_K1 + rnd(s, 21u) * 6.28318530718) * 0.62
      + sin(u * WANDER_K2 + rnd(s, 22u) * 6.28318530718) * 0.38) * WANDER_CORE;
  } else {
    // The halo has no resting place — it is emitted from the line and drifts.
    // This is only where it first appears, before its first breath.
    pop = sv < W_RIM ? 1 : 2;
    off = 0.0;
  }

  // Rounded ends: a strand sitting off-centre starts and stops a little short.
  float r = BAR_H * 0.5;
  float o = min(abs(off), r);
  float cap = r - sqrt(max(r * r - o * o, 0.0));
  return vec2(mix(uBar.x + cap, uBar.y - cap, u), uBar.z + off);
}`;

const SIM_FS = `#version 300 es
precision highp float;
precision highp int;
${HOME}
${SEG}
#define K_LINK ${K_LINK.toFixed(2)}
#define SMOOTH ${SMOOTH.toFixed(2)}
#define K_HOME ${K_HOME.toFixed(2)}
#define HOT_HOLD ${HOT_HOLD.toFixed(3)}
#define DRAG ${DRAG.toFixed(3)}
#define DRAG_COLD ${DRAG_COLD.toFixed(3)}
#define DRAG_HOT ${DRAG_HOT.toFixed(3)}
#define DRAG_FREE ${DRAG_FREE.toFixed(3)}
#define HALO_LIFE ${HALO_LIFE.toFixed(3)}
#define EMIT_RATE ${EMIT_RATE.toFixed(3)}
#define BLAST ${BLAST.toFixed(3)}
#define LOOSE_GRIP ${LOOSE_GRIP.toFixed(3)}
#define SWIRL_RATE ${SWIRL_RATE.toFixed(3)}
#define CORE_ROWS ${CORE_ROWS}
#define DAMP_BOUND ${DAMP_BOUND.toFixed(3)}
#define DAMP_FREE ${DAMP_FREE.toFixed(3)}
#define BREAK ${BREAK.toFixed(3)}
#define BREAK_EDGE ${BREAK_EDGE.toFixed(3)}
#define RELINK ${RELINK.toFixed(3)}
#define RELINK_COOL ${RELINK_COOL.toFixed(3)}
#define COOL ${COOL.toFixed(3)}
#define HEAT_SLOW ${HEAT_SLOW.toFixed(1)}
#define HEAT_FAST ${HEAT_FAST.toFixed(1)}
#define BLOB ${BLOB.toFixed(1)}
#define WAIT ${WAIT.toFixed(3)}
#define TEAR_AWAY ${TEAR_AWAY.toFixed(1)}
#define HEAL_WAIT ${HEAL_WAIT.toFixed(3)}
#define SHED_SHARE ${SHED_SHARE.toFixed(3)}
#define SHED_LIFE ${SHED_LIFE.toFixed(3)}
#define FRAY ${FRAY.toFixed(3)}
#define FREE_LIFE ${FREE_LIFE.toFixed(3)}
#define GROW ${GROW.toFixed(3)}
#define RISE_V ${RISE_V.toFixed(2)}
#define SWIRL_V ${SWIRL_V.toFixed(2)}
#define SWIRL_WAVES ${SWIRL_WAVES}
#define SWIRL_LONG ${SWIRL_LONG.toFixed(1)}
#define SWIRL_CHURN ${SWIRL_CHURN.toFixed(1)}

uniform sampler2D uPos;
uniform sampler2D uSt;
uniform sampler2D uVel;
uniform vec2 uGrid;
uniform float uDt;
uniform float uTime;
uniform float uRest;
uniform float uInit;
/**
 * How long the line has been emitting, in seconds, or a negative number if it
 * is not emitting at all.
 *
 * Both halves of that are needed and one number carries them, because what the
 * halo has to do on the way back in is not the opposite of what it does on the
 * way out. Stopping is easy: nothing is born again, and the glow drains as its
 * particles live out the lives they were already in. Starting cannot simply be
 * that switch thrown back, or every particle that had been waiting would be
 * born in the same frame and the whole halo would breathe in and out as one
 * pulse from then on — the very thing the initial spread of ages exists to
 * prevent. So a particle waits its own share of a lifetime before it is allowed
 * back, and the elapsed time is what it measures that against. The halo comes
 * up the way it was first laid down.
 */
uniform float uEmit;

layout(location = 0) out vec4 oPos;
layout(location = 1) out vec4 oSt;

vec2 posAt(int x, int y) {
  return texelFetch(uPos, ivec2(x, y), 0).xy;
}

/**
 * Detail the grid cannot hold.
 *
 * The solver smooths everything down to its cell size, which leaves a plume
 * moving as one smooth body — the mushroom. This is the structure that was lost:
 * a few short-wavelength divergence-free terms, evaluated per particle and
 * turning over in time, so the cloud is folded and drawn out into wisps instead
 * of swelling uniformly. Divergence-free matters — it stirs without inflating.
 */
vec2 swirl(vec2 p) {
  vec2 f = vec2(0.0);
  for (int n = 0; n < SWIRL_WAVES; n++) {
    float fn = float(n);
    float k = 6.28318530718 / (SWIRL_LONG / (1.0 + fn * 0.65));
    float ang = fn * 2.39996 + 1.7;
    vec2 d = vec2(cos(ang), sin(ang));
    float amp = 1.0 / (0.7 + fn);
    float drift = mod(fn, 2.0) < 0.5 ? -SWIRL_CHURN : SWIRL_CHURN;
    f += (amp * cos(dot(d, p) * k + fn * 3.71 + uTime * k * drift)) * vec2(d.y, -d.x);
  }
  return f * 0.62;
}

void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  float t;
  int pop;
  vec2 home = homeOf(c, t, pop);

  uint i = uint(c.y) * uint(COLS) + uint(c.x);

  if (uInit > 0.5) {
    oPos = vec4(home, 0.0, 0.0);
    // Halo particles start partway through a life of their own, or the whole
    // glow would breathe in and out together as one pulse. On a bar that is not
    // emitting they start spent instead, so a stopped page lays out a bare line
    // rather than a halo it then has to be seen draining away.
    float born = uEmit < 0.0 ? HALO_LIFE * 2.0 : rnd(i, 61u) * HALO_LIFE;
    oSt = vec4(0.0, 1.0, 2.0, pop == 0 ? 0.0 : born);
    return;
  }

  vec4 P = texelFetch(uPos, c, 0);
  vec4 S = texelFetch(uSt, c, 0);
  vec2 p = P.xy, v = P.zw;
  float heat = S.x, linkN = S.y, age = S.z, torn = S.w;
  float gate = smoothstep(HEAT_SLOW, HEAT_FAST, length(uCursorV));
  // Both halves want this now: the bar is dragged by it, and gas that has come
  // loose rides it.
  vec2 fluid = texture(uVel, clamp(p / uGrid, vec2(0.0), vec2(1.0))).xy;

  // ── the halo: gas the line gives off ─────────────────────────────────────
  if (pop != 0) {
    float spread = pop == 1 ? RIM_SIGMA : BLOOM_SIGMA;
    float life = HALO_LIFE * (0.6 + 0.8 * rnd(i, 61u));
    // The strand this one came off, and keeps an eye on for its whole life,
    // plus how far it has drifted from it while nobody was interfering.
    ivec2 src = ivec2(c.x, int(rnd(i, 62u) * float(CORE_ROWS)));
    vec4 line = texelFetch(uPos, src, 0);
    vec4 sst = texelFetch(uSt, src, 0);
    vec2 drift = S.yz;
    /**
     * A negative age means it has come loose.
     *
     * Riding a strand is what keeps the glow married to the line, but it is
     * also what stops the glow ever leaving: whatever the strand does the gas
     * does, so when the strand is put back the gas is dragged back with it, and
     * nothing can be thrown off a bar that takes it all home again. There is
     * no channel to spare for saying which of the two a particle is doing, so
     * the sign of its age says it.
     */
    bool loose = torn < 0.0;
    float age = abs(torn) + uDt;
    float ang = rnd(i, 63u) * 6.28318530718;
    vec2 dir = vec2(cos(ang), sin(ang));

    // Whether the line will have this one back: it emits while the radio plays
    // and not otherwise, and each particle waits out its own share of a
    // lifetime after playback resumes so they do not all return together.
    bool born = uEmit > rnd(i, 65u) * HALO_LIFE;
    if (age > life && born) {
      // Born again on the line as it stands now, off one of the core rows, so
      // the glow leaves the bar wherever the bar has got to — and a stretch
      // that has been torn away emits nothing, leaving the gap dark.
      //
      // It leaves already as stirred up as the bar it came off, standing on it
      // and not yet drifted anywhere.
      age = 0.0;
      loose = false;
      drift = vec2(0.0);
      p = line.xy;
      v = vec2(0.0);
      heat = max(heat, sst.x);
    } else if (age > life) {
      // Spent, with nothing emitting it back. Held at the end of its life
      // rather than left to run on: the draw has already faded it to nothing
      // there, and an age that kept climbing would have it drifting inward —
      // the outward push is scaled by the life it has left, and past the end
      // that figure is negative.
      age = life;
    }

    // The strand it came off has been torn out of the bar. It does not go home
    // with it: it keeps where it is, takes up the speed the tear was carrying
    // and a shove of its own, and lives the rest of its life out in the air.
    // This is what flies when the bar is cut, and it is on nobody's clock but
    // its own — the line closes over long before it is done.
    if (!loose && sst.w > 0.0) {
      loose = true;
      // A fresh life — it was somewhere in the middle of one when the tear took
      // it, and half a life left is half a puff. Not zero, though: the sign of
      // the age is what says it has come loose, and negative zero is not
      // negative. Store that and the flag is gone on the very next step, the
      // particle reads as still attached, and it snaps back onto the line
      // instead of flying.
      age = 1e-3;
      v = line.zw + dir * (spread * EMIT_RATE * BLAST);
      heat = max(heat, sst.x);
    }

    if (loose) {
      vec2 want = fluid + swirl(p) * (spread * SWIRL_RATE);
      v += (want - v) * min(LOOSE_GRIP * uDt, 1.0);
      p += v * uDt;
    } else {
      // Its own movement: out along its own bearing, easing off with age so the
      // cloud thins with distance, wandering as it goes. Added to the strand's
      // position — no spring, no drag, nothing of its own to bounce on, so bend
      // the bar and the glow bends, fling it and the glow is flung with it.
      vec2 away = dir
        * (spread * EMIT_RATE * (0.35 + 1.3 * rnd(i, 64u)) * (1.0 - age / life));
      // Spent and waiting on a line that is not emitting: it holds where it
      // died instead of wandering off invisibly for as long as the radio is
      // stopped, which is the only way an age of exactly a life is reached.
      if (age < life) drift += (away + swirl(p) * (spread * SWIRL_RATE)) * uDt;
      p = line.xy + drift;
      v = vec2(0.0);
    }

    if (uCursorOn > 0.5) {
      float d = segDist(p) / BLOB;
      heat = max(heat, exp(-d * d) * gate);
    }
    heat *= exp(-COOL * uDt);

    if (!(dot(p, p) < 1e12)) {
      p = line.xy;
      v = vec2(0.0);
      drift = vec2(0.0);
      age = 0.0;
      loose = false;
    }
    oPos = vec4(p, v);
    oSt = vec4(heat, drift, loose ? -age : age);
    return;
  }

  // ── the bar ──────────────────────────────────────────────────────────────
  float free = torn > 0.0 ? 1.0 : 0.0;
  // Both ends of a link measure it on the same snapshot, so the two of them
  // never disagree about whether it has just broken.
  vec2 pN = posAt(min(c.x + 1, COLS - 1), c.y);
  vec2 pP = posAt(max(c.x - 1, 0), c.y);
  float lenN = c.x < COLS - 1 ? distance(pN, p) : 0.0;
  float lenP = c.x > 0 ? distance(pP, p) : 0.0;
  vec4 sP = c.x > 0 ? texelFetch(uSt, ivec2(c.x - 1, c.y), 0) : vec4(0.0);
  vec4 sN = c.x < COLS - 1 ? texelFetch(uSt, ivec2(c.x + 1, c.y), 0) : vec4(0.0);
  float linkP = sP.y;
  // Never knit back onto a neighbour that is off being gas — it would drift
  // out of reach again a frame later, dragging a thread behind it.
  float tornN = sN.w;

  vec2 toHome = home - p;
  float hm = length(toHome);

  vec2 F = vec2(0.0);
  float grip;
  if (free < 0.5) {
    if (linkN > 0.5 && lenN > 1e-4) {
      F += ((pN - p) / lenN) * (K_LINK * (lenN - uRest));
    }
    if (linkP > 0.5 && lenP > 1e-4) {
      F += ((pP - p) / lenP) * (K_LINK * (lenP - uRest));
    }
    // Held straight against sharp turns only. See SMOOTH: this is invisible at
    // the scale of a bend and decisive at the scale of a kink.
    if (c.x > 0 && c.x < COLS - 1 && linkN > 0.5 && linkP > 0.5) {
      F += (pN + pP - 2.0 * p) * SMOOTH;
    }
    // A plain spring, harder the further it is pulled. Nothing caps it: past
    // TEAR_AWAY the particle is gas and this force is gone anyway, so within
    // the bar's range the pull can stay honestly proportional — which is what
    // snaps a stretched line back and lets it overshoot instead of creeping.
    // Some of it survives being hot, so the line stays taut under the drag.
    float cold = mix(HOT_HOLD, 1.0, (1.0 - heat) * (1.0 - heat));
    F += toHome * (K_HOME * cold);
    grip = DRAG * (DRAG_COLD + DRAG_HOT * heat);
  } else {
    // Gas. It rides the air, plus turbulence the grid is too coarse to carry.
    // Lift and grip vary per particle, so what set off together comes apart on
    // the way rather than travelling as one body.
    fluid += swirl(p) * (SWIRL_V * (0.5 + rnd(i, 72u)));
    fluid.y -= RISE_V * (0.3 + 1.4 * rnd(i, 73u));
    grip = DRAG * DRAG_FREE * (0.55 + 0.9 * rnd(i, 74u));
  }
  F += (fluid - v) * grip;

  v += F * uDt;
  v *= exp(-mix(DAMP_BOUND, DAMP_FREE, free) * uDt);
  p += v * uDt;

  if (uCursorOn > 0.5) {
    float d = segDist(p) / BLOB;
    heat = max(heat, exp(-d * d) * gate);
  }

  // Where along the band this strand sits: nothing at the middle, one at the
  // outside. A tear takes more of the outside, which is what blunts the cut.
  float edge = clamp(abs(home.y - uBar.z) / (BAR_H * 0.5), 0.0, 1.0);
  float brk = BREAK * uRest * mix(1.0, BREAK_EDGE, edge);
  if (free < 0.5) {
    if (c.x < COLS - 1) {
      if (linkN > 0.5 && lenN > brk) {
        linkN = 0.0;
        heat = 1.0;
      } else if (linkN < 0.5 && lenN < RELINK * uRest && heat < RELINK_COOL && tornN == 0.0) {
        linkN = 1.0;
      }
    }
    // The neighbour cuts the link on its side; this end only takes the heat.
    if (c.x > 0 && linkP > 0.5 && lenP > brk) heat = 1.0;
  }

  heat *= exp(-COOL * uDt);
  age = min(age + uDt, 2.0);

  /**
   * Two ways to stop being part of the bar.
   *
   * Carried this far off it, or cut on both sides and holding on to nothing.
   * Either way it lets go of its neighbours and of home, and from here it only
   * drifts, thins out and goes dark. A piece severed at both ends is no longer
   * bar in any sense worth keeping: leaving it sprung to a place in a line it
   * has been cut out of is what made stranded fragments snap back into
   * formation, which is the least living thing the whole field did.
   *
   * Only once it has finished growing in, or a piece coming back would find
   * itself briefly linked to nothing and leave again before its neighbour had
   * the chance to take hold of it.
   */
  bool tied = (c.x < COLS - 1 && linkN > 0.5) || (c.x > 0 && linkP > 0.5);
  // Whole bar, as against an end a cut has exposed. The bar's own two ends
  // count as whole — they are where it stops, not where it was broken.
  bool whole = (c.x == COLS - 1 || linkN > 0.5) && (c.x == 0 || linkP > 0.5);
  if (free < 0.5) {
    if (hm > TEAR_AWAY * (whole ? 1.0 : FRAY) || (!tied && age > GROW)) {
      torn = 1e-3;
      linkN = 0.0;
    }
  } else {
    torn += uDt;
  }

  /**
   * Coming back, and only where there is something to come back onto.
   *
   * A piece waits until the neighbour it would join is bar again, so a gap
   * closes from its two edges inward — each returning particle giving the next
   * one in something to attach to — rather than the whole length of it
   * reappearing at once. The ends of the bar count as attached to begin with,
   * or a gap that reached one would have nothing to grow from.
   *
   * A piece still waiting its turn has long since faded out, so the queue is
   * invisible: what shows is the two edges knitting toward each other.
   */
  bool rooted = c.x == 0 || c.x == COLS - 1 || sP.w == 0.0 || sN.w == 0.0;
  // Kept strands are back as soon as the bar wants them; given-up ones stay out
  // until they have finished burning off. Either way it has to have faded
  // first, being the same particle here as the one drifting out there.
  float gasLife = rnd(uint(c.y), 71u) < SHED_SHARE ? SHED_LIFE : FREE_LIFE;
  if ((torn > max(HEAL_WAIT, gasLife) && rooted) || !(dot(p, p) < 1e12)) {
    p = home;
    v = vec2(0.0);
    heat = 0.0;
    torn = 0.0;
    age = -WAIT * rnd(i, 33u);
  }

  oPos = vec4(p, v);
  oSt = vec4(heat, linkN, age, torn);
}`;

const DRAW_VS = `#version 300 es
precision highp float;
precision highp int;
${HOME}
#define ALPHA_CORE ${ALPHA_CORE.toFixed(5)}
#define ALPHA_RIM ${ALPHA_RIM.toFixed(5)}
#define ALPHA_BLOOM ${ALPHA_BLOOM.toFixed(5)}
#define SPRITE_CORE ${SPRITE_CORE.toFixed(2)}
#define SPRITE_RIM ${SPRITE_RIM.toFixed(2)}
#define SPRITE_BLOOM ${SPRITE_BLOOM.toFixed(2)}
#define HEAT_GAIN ${HEAT_GAIN.toFixed(3)}
#define GROW ${GROW.toFixed(3)}
#define FREE_HOLD ${FREE_HOLD.toFixed(3)}
#define FREE_LIFE ${FREE_LIFE.toFixed(3)}
#define SHED_SHARE ${SHED_SHARE.toFixed(3)}
#define SHED_LIFE ${SHED_LIFE.toFixed(3)}
#define HALO_LIFE ${HALO_LIFE.toFixed(3)}
#define HALO_IN ${HALO_IN.toFixed(3)}
#define HALO_OUT ${HALO_OUT.toFixed(3)}
#define CORE_ROWS ${CORE_ROWS}
#define EDGE_BITE ${EDGE_BITE.toFixed(3)}
#define BAR_H2 ${(BAR_H * 0.5).toFixed(3)}

uniform sampler2D uPos;
uniform sampler2D uSt;
uniform vec2 uView;
uniform vec2 uHue;
uniform float uDpr;

out vec3 vColor;

/**
 * Whether there is still bar at this column of this strand — gas does not
 * count, it has left. Past either end of the bar counts as bar, because that
 * is where it stops rather than where it was cut.
 */
float barAt(int x, int y) {
  if (x < 0 || x > COLS - 1) return 1.0;
  return texelFetch(uSt, ivec2(x, y), 0).w > 0.0 ? 0.0 : 1.0;
}

vec3 hsl2rgb(float h, float s, float l) {
  h = fract(h / 360.0);
  vec3 k = mod(vec3(0.0, 8.0, 4.0) + h * 12.0, 12.0);
  return l - s * min(l, 1.0 - l) * clamp(min(k - 3.0, 9.0 - k), -1.0, 1.0);
}

void main() {
  ivec2 c = ivec2(gl_VertexID % COLS, gl_VertexID / COLS);
  float t;
  int pop;
  vec2 home = homeOf(c, t, pop);
  uint i = uint(c.y) * uint(COLS) + uint(c.x);

  vec2 p = texelFetch(uPos, c, 0).xy;
  vec4 S = texelFetch(uSt, c, 0);
  float fade;
  if (pop == 0) {
    // Grown in where it belongs, thinning to nothing once it is adrift.
    float gasLife = rnd(uint(c.y), 71u) < SHED_SHARE ? SHED_LIFE : FREE_LIFE;
    fade = smoothstep(0.0, 1.0, clamp(S.z / GROW, 0.0, 1.0))
      * (1.0 - smoothstep(gasLife * FREE_HOLD, gasLife, S.w));
    // As present as there is strand around it. Sampled a little way along in
    // both directions and taking the poorer side, so a particle at a cut face
    // is dark and one a few pixels in is whole, and the edge a cut leaves is
    // a taper rather than a wall. Only for bar — gas has left and takes its
    // brightness with it.
    if (S.w == 0.0) {
      float l = (barAt(c.x - 2, c.y) + barAt(c.x - 5, c.y)
        + barAt(c.x - 9, c.y) + barAt(c.x - 14, c.y)) * 0.25;
      float r = (barAt(c.x + 2, c.y) + barAt(c.x + 5, c.y)
        + barAt(c.x + 9, c.y) + barAt(c.x + 14, c.y)) * 0.25;
      float edge = clamp(abs(home.y - uBar.z) / BAR_H2, 0.0, 1.0);
      fade *= pow(min(l, r), mix(1.0, EDGE_BITE, edge));
    }
  } else {
    // Struck alight as it leaves the line and dying away as it drifts. The
    // long tail is most of the halo: brightest just off the bar, thinning as
    // it goes, which is the shape of a glow.
    float life = HALO_LIFE * (0.6 + 0.8 * rnd(i, 61u));
    float age = abs(S.w);
    float dying = 1.0 - smoothstep(life * HALO_OUT, life, age);
    if (S.w < 0.0) {
      // Thrown clear, and answering to nothing — out in the air on its own
      // clock. No striking up from nothing either: it was alight when the tear
      // took it, and its life was restarted only so it has one to burn.
      fade = dying;
    } else {
      // Riding a strand: lit as it leaves and never brighter than the piece of
      // bar giving it off, so the glow grows back in step with the line rather
      // than ahead of it.
      vec4 sst = texelFetch(uSt, ivec2(c.x, int(rnd(i, 62u) * float(CORE_ROWS))), 0);
      fade = smoothstep(0.0, life * HALO_IN, age) * dying
        * smoothstep(0.0, 1.0, clamp(sst.z / GROW, 0.0, 1.0));
    }
  }

  vec3 rgb = hsl2rgb(mix(uHue.x, uHue.y, t), 0.85, 0.56);
  float a = pop == 0 ? ALPHA_CORE : (pop == 1 ? ALPHA_RIM : ALPHA_BLOOM);
  if (pop == 0) a *= 0.7 + 0.6 * rnd(i, 15u);
  vColor = rgb * (a * fade * (1.0 + HEAT_GAIN * S.x));

  float sprite = pop == 0 ? SPRITE_CORE : (pop == 1 ? SPRITE_RIM : SPRITE_BLOOM);
  gl_PointSize = sprite * uDpr * (0.5 + 0.5 * fade);
  vec2 ndc = (p / uView) * 2.0 - 1.0;
  gl_Position = vec4(ndc.x, -ndc.y, 0.0, 1.0);
}`;

const DRAW_FS = `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 oColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float f = max(0.0, 1.0 - dot(d, d) * 4.0);
  oColor = vec4(vColor * f * f, 0.0);
}`;

const RESOLVE_FS = `#version 300 es
precision highp float;
uniform sampler2D uAcc;
out vec4 oColor;
void main() {
  vec3 acc = texelFetch(uAcc, ivec2(gl_FragCoord.xy), 0).rgb;
  float peak = max(acc.r, max(acc.g, acc.b));
  float roll = 1.0 - exp(-peak);
  oColor = vec4(acc * (roll / max(peak, 1e-4)), roll);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new Error('no shader');
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(`glow-field: ${gl.getShaderInfoLog(sh) ?? 'shader would not compile'}`);
  }
  return sh;
}

function link(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram();
  if (!p) throw new Error('no program');
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(`glow-field: ${gl.getProgramInfoLog(p) ?? 'program would not link'}`);
  }
  return p;
}

const ease = (t: number): number => t * t * (3 - 2 * t);

export function mountGlowField(host: HTMLElement, opts: GlowFieldOptions = {}): GlowField | null {
  const keep = opts.keepTouch ?? 'button, a, input, select, textarea, dialog';
  const canvas = document.createElement('canvas');
  canvas.className = 'glow-field';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;'
    + 'display:block;pointer-events:none;z-index:-1;';

  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: true,
    powerPreference: 'low-power',
  });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) return null;

  let advectProg: WebGLProgram | undefined;
  let divProg: WebGLProgram | undefined;
  let jacobiProg: WebGLProgram | undefined;
  let projectProg: WebGLProgram | undefined;
  let simProg: WebGLProgram | undefined;
  let drawProg: WebGLProgram | undefined;
  let resolveProg: WebGLProgram | undefined;
  const U = new Map<WebGLProgram, Record<string, WebGLUniformLocation | null>>();

  let vels: [Target, Target] | undefined;
  let velFront: 0 | 1 = 0;
  let divT: Target | undefined;
  let prss: [Target, Target] | undefined;
  let prsFront: 0 | 1 = 0;
  let pools: [Pool, Pool] | undefined;
  let front: 0 | 1 = 0;
  let acc: Target | undefined;

  let dpr = 1;
  let viewW = 1;
  let viewH = 1;
  let gridW = 0;
  let gridH = 0;
  let barX0 = 0;
  let barX1 = 0;
  let barY = 0;

  const vao = gl.createVertexArray();

  function locate(prog: WebGLProgram, names: string[]): void {
    const map: Record<string, WebGLUniformLocation | null> = {};
    for (const n of names) map[n] = gl!.getUniformLocation(prog, n);
    U.set(prog, map);
  }

  function u(prog: WebGLProgram, name: string): WebGLUniformLocation | null {
    return U.get(prog)?.[name] ?? null;
  }

  function makeTex(format: number, w: number, h: number, smooth: boolean): WebGLTexture {
    const tex = gl!.createTexture();
    if (!tex) throw new Error('glow-field: no texture');
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.texStorage2D(gl!.TEXTURE_2D, 1, format, w, h);
    const f = smooth ? gl!.LINEAR : gl!.NEAREST;
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, f);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, f);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    return tex;
  }

  function makeTarget(format: number, w: number, h: number, smooth = false): Target {
    const tex = makeTex(format, w, h, smooth);
    const fbo = gl!.createFramebuffer();
    if (!fbo) throw new Error('glow-field: no target');
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, tex, 0);
    if (gl!.checkFramebufferStatus(gl!.FRAMEBUFFER) !== gl!.FRAMEBUFFER_COMPLETE) {
      throw new Error('glow-field: float targets are not renderable here');
    }
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    return { tex, fbo };
  }

  function makePool(): Pool {
    const pos = makeTex(gl!.RGBA32F, COLS, STRANDS, false);
    const st = makeTex(gl!.RGBA16F, COLS, STRANDS, false);
    const fbo = gl!.createFramebuffer();
    if (!fbo) throw new Error('glow-field: no pool');
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, pos, 0);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT1, gl!.TEXTURE_2D, st, 0);
    gl!.drawBuffers([gl!.COLOR_ATTACHMENT0, gl!.COLOR_ATTACHMENT1]);
    if (gl!.checkFramebufferStatus(gl!.FRAMEBUFFER) !== gl!.FRAMEBUFFER_COMPLETE) {
      throw new Error('glow-field: float targets are not renderable here');
    }
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    return { pos, st, fbo };
  }

  function drop(t: Target | undefined): void {
    if (!t) return;
    gl!.deleteTexture(t.tex);
    gl!.deleteFramebuffer(t.fbo);
  }

  function dropPool(p: Pool | undefined): void {
    if (!p) return;
    gl!.deleteTexture(p.pos);
    gl!.deleteTexture(p.st);
    gl!.deleteFramebuffer(p.fbo);
  }

  function measureBar(): void {
    const r = host.getBoundingClientRect();
    barX0 = r.left;
    barX1 = r.right;
    barY = r.top + r.height / 2;
  }

  function bindTex(prog: WebGLProgram, name: string, unit: number, tex: WebGLTexture): void {
    gl!.activeTexture(gl!.TEXTURE0 + unit);
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.uniform1i(u(prog, name), unit);
  }

  function pass(prog: WebGLProgram, target: WebGLFramebuffer | null, w: number, h: number): void {
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, target);
    gl!.viewport(0, 0, w, h);
    gl!.disable(gl!.BLEND);
    gl!.useProgram(prog);
    gl!.bindVertexArray(vao);
  }

  /** The fluid domain in CSS px — a whole number of cells, covering the view. */
  function span(): [number, number] {
    return [gridW * CELL, gridH * CELL];
  }

  function resize(): boolean {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const box = canvas.getBoundingClientRect();
    const w = Math.max(2, Math.round(box.width * dpr));
    const h = Math.max(2, Math.round(box.height * dpr));
    const wasX0 = barX0, wasX1 = barX1, wasY = barY;
    const sameSize = w === canvas.width && h === canvas.height && !!simProg;
    if (!sameSize) {
      canvas.width = w;
      canvas.height = h;
    }
    viewW = Math.max(1, box.width);
    viewH = Math.max(1, box.height);
    measureBar();
    if (sameSize && barX0 === wasX0 && barX1 === wasX1 && barY === wasY) return false;

    if (!simProg) {
      advectProg = link(gl!, QUAD_VS, ADVECT_FS);
      divProg = link(gl!, QUAD_VS, DIV_FS);
      jacobiProg = link(gl!, QUAD_VS, JACOBI_FS);
      projectProg = link(gl!, QUAD_VS, PROJECT_FS);
      simProg = link(gl!, QUAD_VS, SIM_FS);
      drawProg = link(gl!, DRAW_VS, DRAW_FS);
      resolveProg = link(gl!, QUAD_VS, RESOLVE_FS);
      locate(advectProg, ['uVel', 'uGrid', 'uDt', 'uTime',
        'uFrom', 'uTo', 'uCursorV', 'uCursorOn']);
      locate(divProg, ['uVel']);
      locate(jacobiProg, ['uPrs', 'uDiv']);
      locate(projectProg, ['uVel', 'uPrs']);
      locate(simProg, ['uPos', 'uSt', 'uVel', 'uGrid', 'uDt', 'uTime', 'uRest', 'uInit',
        'uEmit', 'uBar', 'uFrom', 'uTo', 'uCursorV', 'uCursorOn']);
      locate(drawProg, ['uPos', 'uSt', 'uView', 'uHue', 'uDpr', 'uBar']);
      locate(resolveProg, ['uAcc']);
      pools = [makePool(), makePool()];
      front = 0;
    }

    const gw = Math.max(24, Math.min(GRID_MAX, Math.round(viewW / CELL)));
    const gh = Math.max(24, Math.min(GRID_MAX, Math.round(viewH / CELL)));
    if (gw !== gridW || gh !== gridH) {
      gridW = gw;
      gridH = gh;
      if (vels) for (const v of vels) drop(v);
      if (prss) for (const p of prss) drop(p);
      drop(divT);
      vels = [makeTarget(gl!.RG16F, gw, gh, true), makeTarget(gl!.RG16F, gw, gh, true)];
      prss = [makeTarget(gl!.R16F, gw, gh), makeTarget(gl!.R16F, gw, gh)];
      divT = makeTarget(gl!.R16F, gw, gh);
      velFront = 0;
      prsFront = 0;
    }

    if (!sameSize || !acc) {
      drop(acc);
      acc = makeTarget(gl!.RGBA16F, w, h);
    }
    stepParticles(0, true);
    return true;
  }

  function bindStroke(prog: WebGLProgram): void {
    gl!.uniform2f(u(prog, 'uFrom'), strokeFromX, strokeFromY);
    gl!.uniform2f(u(prog, 'uTo'), strokeToX, strokeToY);
    gl!.uniform2f(u(prog, 'uCursorV'), cursorVX, cursorVY);
    gl!.uniform1f(u(prog, 'uCursorOn'), pointerOn ? 1 : 0);
  }

  function stepFluid(dt: number): void {
    if (!advectProg || !divProg || !jacobiProg || !projectProg || !vels || !prss || !divT) return;
    const [gx, gy] = span();

    const vb = velFront === 0 ? 1 : 0;
    pass(advectProg, vels[vb].fbo, gridW, gridH);
    bindTex(advectProg, 'uVel', 0, vels[velFront].tex);
    gl!.uniform2f(u(advectProg, 'uGrid'), gx, gy);
    gl!.uniform1f(u(advectProg, 'uDt'), dt);
    gl!.uniform1f(u(advectProg, 'uTime'), simTime);
    bindStroke(advectProg);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    velFront = vb;

    pass(divProg, divT.fbo, gridW, gridH);
    bindTex(divProg, 'uVel', 0, vels[velFront].tex);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);

    // Pressure carries over from the last frame instead of starting cold, so
    // these sweeps go further than the same count would from zero.
    for (let k = 0; k < ITERS; k++) {
      const pb = prsFront === 0 ? 1 : 0;
      pass(jacobiProg, prss[pb].fbo, gridW, gridH);
      bindTex(jacobiProg, 'uPrs', 0, prss[prsFront].tex);
      bindTex(jacobiProg, 'uDiv', 1, divT.tex);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      prsFront = pb;
    }

    const vc = velFront === 0 ? 1 : 0;
    pass(projectProg, vels[vc].fbo, gridW, gridH);
    bindTex(projectProg, 'uVel', 0, vels[velFront].tex);
    bindTex(projectProg, 'uPrs', 1, prss[prsFront].tex);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    velFront = vc;
  }

  function stepParticles(dt: number, init = false): void {
    if (!simProg || !pools || !vels) return;
    const [gx, gy] = span();
    const back = front === 0 ? 1 : 0;
    pass(simProg, pools[back].fbo, COLS, STRANDS);
    bindTex(simProg, 'uPos', 0, pools[front].pos);
    bindTex(simProg, 'uSt', 1, pools[front].st);
    bindTex(simProg, 'uVel', 2, vels[velFront].tex);
    gl!.uniform3f(u(simProg, 'uBar'), barX0, barX1, barY);
    gl!.uniform2f(u(simProg, 'uGrid'), gx, gy);
    gl!.uniform1f(u(simProg, 'uDt'), dt);
    gl!.uniform1f(u(simProg, 'uTime'), simTime);
    gl!.uniform1f(u(simProg, 'uRest'), Math.max(barX1 - barX0, 1) / COLS);
    gl!.uniform1f(u(simProg, 'uInit'), init ? 1 : 0);
    gl!.uniform1f(u(simProg, 'uEmit'), playing ? simTime - emitAt : -1);
    bindStroke(simProg);
    if (init) gl!.uniform1f(u(simProg, 'uCursorOn'), 0);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    front = back;
  }

  function draw(): void {
    if (!drawProg || !resolveProg || !pools || !acc) return;

    pass(drawProg, acc.fbo, canvas.width, canvas.height);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.ONE, gl!.ONE);
    bindTex(drawProg, 'uPos', 0, pools[front].pos);
    bindTex(drawProg, 'uSt', 1, pools[front].st);
    gl!.uniform3f(u(drawProg, 'uBar'), barX0, barX1, barY);
    gl!.uniform2f(u(drawProg, 'uView'), viewW, viewH);
    gl!.uniform2f(u(drawProg, 'uHue'), hue, hue2);
    gl!.uniform1f(u(drawProg, 'uDpr'), dpr);
    gl!.drawArrays(gl!.POINTS, 0, COLS * STRANDS);

    pass(resolveProg, null, canvas.width, canvas.height);
    bindTex(resolveProg, 'uAcc', 0, acc.tex);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  let hue = 32;
  let hue2 = 8;
  let fromHue = 32;
  let fromHue2 = 8;
  let toHue = 32;
  let toHue2 = 8;
  let keyAt = -Infinity;

  /**
   * Whether the radio is playing, which is the whole of what the field is for.
   *
   * A stopped bar is scenery: it emits nothing and does not answer the cursor.
   * The second half matters as much as the first — a grey bar that still tears
   * open and flings gas about is claiming to be the live thing it is drawn as
   * not being, and it would be doing it with a halo that is no longer there to
   * throw. It is passed in rather than assumed, because the field is mounted
   * whenever the listener asks for it — which is as likely to be a stopped page
   * as the middle of a song, and the first thing the layout does is hand every
   * halo particle a life to be partway through.
   */
  let playing = opts.playing ?? true;
  /** When the line last started emitting, on the clock `simTime` runs on. */
  let emitAt = 0;

  let pointerOn = false;
  let pointerNear = false;
  /** The finger drawing a cut, or -1. */
  let touchId = -1;
  let gasUntil = 0;
  let pointerX = 0;
  let pointerY = 0;
  let lastX = 0;
  let lastY = 0;
  let cursorVX = 0;
  let cursorVY = 0;
  let strokeFromX = 0;
  let strokeFromY = 0;
  let strokeToX = 0;
  let strokeToY = 0;

  function onPointer(e: PointerEvent): void {
    if (!playing) return;
    const x = e.clientX;
    const y = e.clientY;
    const r = BLOB + TEAR_AWAY * 2;
    pointerNear = Math.abs(y - barY) <= r && x >= barX0 - r && x <= barX1 + r;
    /**
     * Torn-off gas drifts a long way from the bar, and a cursor swept through
     * it should scatter it — the cursor stirs the fluid, and free particles
     * ride the fluid, so this only needs the pointer to count as live out
     * there. It does while there is anything in the air to stir: `gasUntil`
     * outlives the last stroke fast enough to have torn something by one full
     * lifetime of gas. Near the bar is what wakes the field from idle; the far
     * field can only carry on something already running, so waving around the
     * rest of the page never spins the simulation up on its own.
     */
    const live = pointerNear || performance.now() < gasUntil;
    if (!live) {
      if (pointerOn) {
        pointerOn = false;
        wake(SETTLE_MS);
      }
      return;
    }
    if (!pointerOn) {
      lastX = x;
      lastY = y;
    }
    pointerOn = true;
    pointerX = x;
    pointerY = y;
    wake(pointerNear ? SETTLE_MS : AIR_MS);
  }

  function onPointerGone(): void {
    if (!pointerOn) return;
    pointerOn = false;
    wake(SETTLE_MS);
  }

  /**
   * A finger landing on the bar.
   *
   * Captured, so the rest of the stroke keeps arriving however far off the
   * strip it travels — which is the entire point of a fling, and without it the
   * cut would stop at the edge of the grip. The position is seeded here as
   * well: a touch appears from nowhere, and taking its first move against
   * wherever the last one ended would read as one enormous flick.
   */
  function onTouchDown(e: PointerEvent): void {
    if (!playing) return;
    if (e.pointerType === 'mouse') return;
    if ((e.target as Element | null)?.closest(keep)) return;
    touchId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    pointerX = e.clientX;
    pointerY = e.clientY;
    pointerNear = true;
    pointerOn = true;
    wake(SETTLE_MS);
  }

  /**
   * And lifting off. A mouse leaves by going somewhere else, which `onPointer`
   * sees; a finger simply stops existing, and nothing else would ever tell us —
   * the field would go on stirring the air at the last place it was touched.
   */
  function onTouchUp(e: PointerEvent): void {
    if (e.pointerType === 'mouse' || e.pointerId !== touchId) return;
    touchId = -1;
    onPointerGone();
  }

  /**
   * Holding the page still for the length of a cut.
   *
   * A finger that moves means scroll the page, and the browser will take the
   * gesture and cancel the stroke unless told otherwise. `touch-action` cannot
   * do it here — it is read where the touch lands, and a cut may start
   * anywhere — so the refusal has to be made move by move. Only while a cut is
   * actually under way: a touch that began on something scrollable never set
   * `touchId`, and scrolls exactly as it always did.
   */
  function onTouchDrag(e: TouchEvent): void {
    if (touchId >= 0) e.preventDefault();
  }

  let raf = 0;
  let idleAt = 0;
  let busyUntil = 0;
  let last = 0;
  let simTime = 0;

  function frame(ts: number): void {
    raf = 0;
    const dt = Math.min(Math.max((ts - last) / 1000, 0), MAX_DT);
    last = ts;
    simTime = ts / 1000;

    const k = ease(Math.min(Math.max((ts - keyAt) / KEY_MS, 0), 1));
    hue = fromHue + (toHue - fromHue) * k;
    hue2 = fromHue2 + (toHue2 - fromHue2) * k;

    let dx = pointerOn ? pointerX - lastX : 0;
    let dy = pointerOn ? pointerY - lastY : 0;
    if (Math.hypot(dx, dy) > JUMP_MAX) {
      dx = 0;
      dy = 0;
    }
    if (dt > 0) {
      const speed = Math.hypot(dx, dy) / dt;
      const s = speed > CURSOR_MAX ? CURSOR_MAX / speed : 1;
      cursorVX = (dx / dt) * s;
      cursorVY = (dy / dt) * s;
      // Fast enough over the bar to have heated something off it, so assume
      // there is gas in the air for one lifetime — which is what lets the
      // cursor go on stirring it once it has drifted clear.
      if (pointerNear && speed > HEAT_SLOW) gasUntil = performance.now() + GAS_MS;
    } else {
      cursorVX = 0;
      cursorVY = 0;
    }
    // The whole sweep since the last frame, not the point it ended at. Both the
    // fluid and the heating take it as a segment, so a fast flick lays down one
    // continuous stroke instead of a dotted line of impulses.
    strokeFromX = pointerX - dx;
    strokeFromY = pointerY - dy;
    strokeToX = pointerX;
    strokeToY = pointerY;
    lastX = pointerX;
    lastY = pointerY;

    if (dt > 0) {
      stepFluid(dt);
      const n = Math.max(1, Math.min(SUB_MAX, Math.ceil(dt / SUB)));
      for (let s = 0; s < n; s++) stepParticles(dt / n);
    }

    draw();
    if (ts < busyUntil) raf = requestAnimationFrame(frame);
    else armIdle();
  }

  /**
   * The heartbeat, once the cursor is gone and the physics has settled.
   *
   * It runs a whole frame, not just a redraw, because the movement in the glow
   * is real: the halo is riding the room's drift, and that has to be stepped to
   * happen. It is affordable because the simulation is the cheap half — the
   * fluid grid is a few thousand cells and the particle pass a few hundred
   * thousand, against millions of fragments for the draw that happens either
   * way. Dropping to a ninth of the frame rate is what keeps the whole thing
   * small, and a drift this slow has nothing to gain from running faster.
   */
  function idleTick(): void {
    idleAt = 0;
    if (document.hidden || raf || performance.now() < busyUntil) return;
    raf = requestAnimationFrame(frame);
  }

  function armIdle(): void {
    if (idleAt || document.hidden) return;
    idleAt = window.setTimeout(idleTick, IDLE_MS);
  }

  function wake(ms: number): void {
    busyUntil = Math.max(busyUntil, performance.now() + ms);
    if (!raf && !document.hidden) {
      measureBar();
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  function onVisibility(): void {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (idleAt) clearTimeout(idleAt);
      idleAt = 0;
    } else {
      wake(50);
    }
  }

  function onResize(): void {
    if (resize()) draw();
  }

  function onLost(e: Event): void {
    e.preventDefault();
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    opts.onLost?.();
  }

  document.body.appendChild(canvas);
  try {
    resize();
  } catch (err) {
    canvas.remove();
    console.warn('glow-field: would not start', err);
    return null;
  }
  draw();
  armIdle();

  const ro = new ResizeObserver(onResize);
  ro.observe(host);
  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('pointerdown', onTouchDown);
  window.addEventListener('pointerup', onTouchUp);
  window.addEventListener('pointercancel', onTouchUp);
  window.addEventListener('touchmove', onTouchDrag, { passive: false });
  window.addEventListener('pointerleave', onPointerGone);
  window.addEventListener('blur', onPointerGone);
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onLost);

  return {
    setKey(nextHue: number, nextHue2: number): void {
      fromHue = hue;
      fromHue2 = hue2;
      toHue = nextHue;
      toHue2 = nextHue2;
      keyAt = performance.now();
      wake(KEY_MS + 60);
    },
    setPlaying(next: boolean): void {
      if (next === playing) return;
      playing = next;
      if (playing) {
        emitAt = performance.now() / 1000;
      } else {
        /**
         * The cursor is let go of here rather than left to lapse on its own.
         *
         * `onPointer` is the only thing that ever clears these, and it is now
         * refusing to run — so a hand resting over the bar when the music
         * stopped would leave `pointerOn` set, and the field would go on being
         * stirred at that spot by a cursor it could no longer see move. The
         * gas clock goes with it: whatever is still in the air is finishing,
         * not being tended.
         */
        pointerOn = false;
        pointerNear = false;
        touchId = -1;
        gasUntil = 0;
      }
      wake(EMIT_MS);
    },
    destroy(): void {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onTouchDown);
      window.removeEventListener('pointerup', onTouchUp);
      window.removeEventListener('pointercancel', onTouchUp);
      window.removeEventListener('touchmove', onTouchDrag);
      window.removeEventListener('pointerleave', onPointerGone);
      window.removeEventListener('blur', onPointerGone);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      if (raf) cancelAnimationFrame(raf);
      if (idleAt) clearTimeout(idleAt);
      idleAt = 0;
      canvas.remove();
      drop(acc);
      drop(divT);
      if (vels) for (const v of vels) drop(v);
      if (prss) for (const p of prss) drop(p);
      if (pools) for (const p of pools) dropPool(p);
    },
  };
}
