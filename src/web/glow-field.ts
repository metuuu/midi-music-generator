import { mountTitleCloud, type TitleCloud } from './title-cloud.js';

export interface GlowCensus {
  line: Float32Array;
  ready: Float32Array;
  age: Float32Array;
}

export interface GlowField {
  setKey(hue: number, hue2: number): void;
  setPlaying(playing: boolean): void;
  /**
   * Whether there is anywhere brighter than white to go on the screen the
   * window is on at this moment — the browser having the switch and the
   * display having the range. Asked rather than stored, because dragging the
   * window to another monitor changes the answer.
   */
  hdrReady(): boolean;
  /** Whether to use that range, when there is any. Ignored where there is none. */
  setHdr(on: boolean): void;
  setSpectrumMode(mode: SpectrumMode): void;
  census(): GlowCensus | null;
  /**
   * The title's particles, which are drawn in this field's buffer and are
   * therefore lit by its resolve. Null where the field never started.
   */
  title(): TitleCloud | null;
  pump(ms: number): void;
  destroy(): void;
}

/**
 * What the music does to the bar.
 *
 * `bands` reads level: every column is pushed up by how loud its band is, so
 * the bar carries the shape of the spectrum and rides above its rest line.
 * `flux` reads change: a column goes up when its band is louder than it has
 * lately been and down when it is quieter, so the bar waves about its rest line
 * instead of leaving it.
 */
export type SpectrumMode = 'bands' | 'flux';

export interface GlowFieldOptions {
  onLost?: () => void;
  playing?: boolean;
  /** What was chosen last time. Defaults to taking the range where it exists. */
  hdr?: boolean;
  keepTouch?: string;
  /**
   * Where the music comes from, polled rather than passed, because the audio
   * chain is built on the first click and the bar is on the page before that.
   * Returning null is the ordinary state until then, and turns the drive off.
   */
  spectrum?: () => AnalyserNode | null;
  spectrumMode?: SpectrumMode;
  /**
   * A tap on the bar, as opposed to a drag across it. The field reports it
   * because it is the only thing that knows where the bar is; what a tap means
   * is not its business.
   */
  onTap?: () => void;
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

interface HdrCanvas {
  configureHighDynamicRange(options: { mode: 'default' | 'extended' }): void;
}

interface HdrContext {
  drawingBufferStorage(sizedFormat: GLenum, width: number, height: number): void;
  drawingBufferToneMapping: { mode: 'standard' | 'extended' };
}

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
const ALPHA_RIM = 0.032;
const ALPHA_BLOOM = 0.0068;
const WANDER_CORE = 0.25;
const WANDER_K1 = 7.5;
const WANDER_K2 = 19;
const HEAT_GAIN = 3.2;
const GROW = 0.25;
const GAS_GROW = 4.5;

const HEADROOM = 2.0;

/**
 * The same, for a solid element the field is lighting rather than the bar.
 *
 * Far lower than the bar's, and the reason is area. The bar is five pixels of
 * light with a hand's breadth of dark either side of it, so a stop above white
 * reads as something glowing across the room; a four-rem disc at that ceiling
 * is a lamp pointed at the reader. Brightness is judged against what surrounds
 * it, and these two have nothing in common there.
 *
 * The amber's own brightest channel is .878, so 1.14 is where the disc merely
 * reaches white and everything above that is the range being spent. This is
 * about a tenth of a stop past it — enough to read as lit rather than painted,
 * which is the whole of what it is for.
 */
const BUTTON_HEADROOM = 1.1;

/**
 * And the same again for the title, which is deliberately the same figure.
 *
 * The name and the button are the two things on the page that are *the record
 * playing* rather than scenery around it, so they lift together or the lift
 * means nothing. Type is nearly all edge and takes even less than the disc
 * does: a tenth of a stop is a name that looks lit from behind, and anything
 * past that is a notification.
 */
const TITLE_HEADROOM = 1.1;

/** How wide the lit disc's edge is softened, in device pixels. */
const DISC_EDGE = 1.3;

/** What the lamp's canvas carries past the element, for that edge to fade in. */
const SPILL = 1;

const CELL = 10;
const GRID_MAX = 180;
const VISC = 0.55;
const ITERS = 24;
const GRAB = 40;
const BLOB = 46;
const BLOB_SLOW = 160;
const STIR_SPEED = 26;
const STIR_GRIP = 0.35;
const STIR_WAVES = 6;
const STIR_LONG = 520;
const STIR_CHURN = 40;

const K_LINK = 1400;
const SMOOTH = 9000;
const YARN = 4200;
const K_HOME = 560;
const HOT_HOLD = 0.06;
const DRAG = 6;
const DRAG_COLD = 0.12;
const DRAG_HOT = 1.9;
const DRAG_FREE = 1.6;

const HALO_LIFE = 2.0;
const HALO_SHED = 0.65;
const BLOOM_SHED = 0.25;
const HALO_GONE = 0.45;
const HALO_DRIFT = 2.0;
const BLAST = 6;
const LOOSE_GRIP = 4;
const HALO_IN = 0.18;
const HALO_OUT = 0.35;

const EMIT_RATE = 1.6;
const SWIRL_RATE = 1.1;
const CORE_ROWS = Math.ceil(W_CORE * STRANDS - 0.5);
const DAMP_BOUND = 7.5;
const DAMP_FREE = 0.8;
const BREAK = 20;
const BREAK_EDGE = 0.7;
const BREAK_HURT = 0.18;
const RELINK_KEEP = 0.6;
const TEAR_HURT = 0.4;
const MEND_HOLD = 0.5;
const MEND_FALL = 3;
const CUT_WAIT = 0.5;
/**
 * How much of a column has to be back before it stops holding the wound open.
 *
 * Read off the same share of the same strands as `WHOLE`, and set above it, so
 * that a column counts as a hole for a little longer than it counts as gap —
 * anything measured against a wider population waits on gas the line ignores.
 */
const MENDED = 0.95;
const EDGE_BITE = 2.5;
const REACH = [2, 5, 9, 14];
const ISLAND = 0.5;
const RELINK = 2.5;
const RELINK_COOL = 0.85;
const COOL = 0.85;
/**
 * How much of a piece of gas's life its glow is given, as a share of it.
 *
 * The bar cools on `COOL`, which is slower than most gas lives: a strand torn
 * off it is therefore still lit when its life curve runs out, and a bright
 * thing reaching zero is read as taken away rather than as gone out. Gas gets
 * its own clock so that the glow is spent early and what is left is an ordinary
 * particle with most of its drift still ahead of it.
 */
const GLOW_KEEP = 0.3;
const HEAT_SLOW = 520;
const HEAT_FAST = 1900;

const TEAR_AWAY = 86;
const KNIFE = 0.2;
const HEAL_V = 350;
const HEAL_HEAT = 0.8;
const BEND_KEEP = 0.9;
const END_ALONE = 0.4;
const HASTE_FULL = 3;
/**
 * What is left of the wait when haste is full, and it is a floor rather than a
 * figure. The wait is also how long gas is visible for, so anything much under
 * a half is a cloud that is deleted rather than one that goes: a hole standing
 * open anywhere on the bar arms this, which is most of the time once somebody
 * is drawing across it, and every strand torn while it is armed gets whatever
 * is set here as its whole life.
 */
const HASTE_WAIT = 0.45;
const HASTE_HEAL = 1.7;
const HASTE_GAS = 0.25;
const LEAP = 8;
const LIMB = 0.25;
const SHED_SHARE = 0.6;
const SHED_LIFE = 1.6;
const FREE_LIFE = 0.9;
const WHOLE = 0.75;
const GAS_TAIL = 1.6;
const TAIL_KEEP = 0.15;
/**
 * The least of its span a piece of gas can take to go, against a full one.
 *
 * A kept strand's span is the line's schedule and not the particle's: every one
 * of them waits the same, so they are all torn on one stroke and all reach the
 * end of it on one frame, and a cloud that goes out together goes out like a
 * light being switched. Spread only downwards, because the light has to be out
 * before the strand is allowed home.
 */
const GONE_SPREAD = 0.45;
const RISE_V = 40;
const SWIRL_V = 46;
const SWIRL_WAVES = 4;
const SWIRL_LONG = 190;
const SWIRL_CHURN = 55;

/**
 * Thirty-two bands and no more, because the bar cannot carry finer detail.
 *
 * `SMOOTH` drags every node towards the midpoint of its two neighbours at a
 * strength that beats the home spring for anything narrower than roughly forty
 * columns, so a bump that fine is flattened before it is ever drawn. Thirty-two
 * log-spaced bands puts a bump every twenty-four columns, which is about the
 * sharpest shape the yarn will actually hold.
 */
const SPEC_BANDS = 32;
const SPEC_LOW = 40;
const SPEC_HIGH = 12000;
/**
 * The two ends of the band scale, in dBFS, measured rather than guessed.
 *
 * These are per-bin levels off a 4096-point analyser, not mix levels: a record
 * peaking a decibel under full scale spreads that across two thousand bins, so
 * the window sits far below where a mix's own does.
 *
 * Set off both ends of what the stations play. A loud hiphop record averages a
 * third of the scale here and peaks in the low eighties without clipping; a
 * quiet ambient one peaks around four tenths. Widening the window instead of
 * simply lowering it is what keeps the top of the scale for transients rather
 * than spending it on the bed.
 */
const SPEC_FLOOR = -63;
const SPEC_CEIL = -11;
/**
 * Decibels of lift per octave, so that a mix reads level along the bar.
 *
 * Music is not flat: energy falls away roughly 3-6 dB per octave above the low
 * mids, so a straight reading of the bins leaves the left end of the bar always
 * bright and the right end always dark, whatever is playing. The tilt is the
 * standard analyser fix and it is what makes the whole length of the bar worth
 * looking at.
 */
const SPEC_TILT = 4;
const SPEC_RISE = 26;
const SPEC_FALL = 7;
/**
 * What a full band is worth in heat, held under `RELINK_COOL` on purpose.
 *
 * Heat is the channel the cursor already writes, and it drives four things at
 * once: brightness through `HEAT_GAIN`, slack in the home spring, drag, and
 * whether a cut is allowed to knit back together. The last is the reason for
 * the ceiling — a loud record must not hold a cut open.
 */
const SPEC_HEAT = 0.5;
const SPEC_LIFT = 4800;
/** How much of each end of the bar the lift fades out across. */
const SPEC_ANCHOR = 0.06;
const SPEC_QUIET = 0.02;
const SPEC_UNIT = 5;
/**
 * How fast the average a band is judged against follows the band itself.
 *
 * Slow enough that a hi-hat is a spike against its own recent history rather
 * than something the average has already absorbed, fast enough that a section
 * change resets what counts as normal within a bar or two.
 */
const SPEC_SLOW = 0.7;
const SPEC_FLUX = 3.5;

/**
 * What separates a tap on the bar from a cut across it.
 *
 * The reach is far tighter than the one that arms a cut, because a cut wants to
 * be felt coming and a tap has to be aimed. Slip and hold are what keep the two
 * apart: a drag has left the spot by the time it lifts, and a press held on the
 * line is somebody leaning on it, not choosing something.
 */
const TAP_REACH = 26;
const TAP_SLIP = 6;
const TAP_HOLD = 500;
const SPEC_MS = 400;

const SETTLE_MS = 5400;
const IDLE_MS = 90;
const AIR_MS = 1200;
const GAS_MS = (SHED_LIFE + GROW + HALO_LIFE) * 1000;
const EMIT_MS = HALO_LIFE * (1.4 + 1) * 1000;
/**
 * How long the bar takes to turn to a new record's key.
 *
 * The same figure as the `--hue` transition in `radio.html`, and it has to be:
 * the page hands both this and the stylesheet the same two hues at the same
 * moment, so that a machine drawing the field and a machine drawing the CSS
 * fallback are drawing one sweep. It is the length of a whole changeover —
 * `LINES_MS` in `web/radio.ts` — because that is what the sweep keeps time with:
 * it begins as the old title leaves and lands as the new one settles.
 */
const KEY_MS = 590;
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

const SEG = `
#define BLOB ${BLOB.toFixed(1)}
#define BLOB_SLOW ${BLOB_SLOW.toFixed(1)}
#define HEAT_SLOW ${HEAT_SLOW.toFixed(1)}
#define HEAT_FAST ${HEAT_FAST.toFixed(1)}

uniform vec2 uFrom;
uniform vec2 uTo;
uniform vec2 uCursorV;
uniform float uCursorOn;

float segDist(vec2 p) {
  vec2 ab = uTo - uFrom;
  float L = dot(ab, ab);
  float t = L > 1e-4 ? clamp(dot(p - uFrom, ab) / L, 0.0, 1.0) : 0.0;
  return distance(p, uFrom + ab * t);
}

float blobNow() {
  return mix(BLOB_SLOW, BLOB, smoothstep(HEAT_SLOW, HEAT_FAST, length(uCursorV)));
}`;

const ADVECT_FS = `#version 300 es
precision highp float;
${SEG}
#define VISC ${VISC.toFixed(3)}
#define GRAB ${GRAB.toFixed(2)}
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

  if (uCursorOn > 0.5) {
    float d = segDist(p) / blobNow();
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
  return texelFetch(uPrs, c, 0).x;
}

void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  ivec2 n = ivec2(textureSize(uPrs, 0));
  // Held at zero the whole way round, and the solve does not survive without
  // it. Reflect at every edge instead and pressure is only fixed up to a
  // constant with nothing to pin that constant down; each frame starts from the
  // last one's answer, so any imbalance left in the divergence walks the field
  // away from zero and keeps walking until the numbers stop fitting.
  if (c.x == 0 || c.y == 0 || c.x == n.x - 1 || c.y == n.y - 1) {
    oPrs = 0.0;
    return;
  }
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

  if (c.x == 0 || c.y == 0 || c.x == n.x - 1 || c.y == n.y - 1) {
    oVel = vec2(0.0);
    return;
  }
  vec2 v = texelFetch(uVel, c, 0).xy;
  v.x -= (at(c + ivec2(1, 0)) - at(c - ivec2(1, 0))) / (2.0 * CELL);
  v.y -= (at(c + ivec2(0, 1)) - at(c - ivec2(0, 1))) / (2.0 * CELL);
  oVel = v;
}`;

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
#define CORE_ROWS ${CORE_ROWS}
#define WHOLE ${WHOLE.toFixed(3)}
#define ISLAND ${ISLAND.toFixed(3)}
#define REACH1 ${REACH[0]}
#define REACH2 ${REACH[1]}
#define REACH3 ${REACH[2]}
#define REACH4 ${REACH[3]}
#define SHED_SHARE ${SHED_SHARE.toFixed(3)}
#define SHED_LIFE ${SHED_LIFE.toFixed(3)}
#define FREE_LIFE ${FREE_LIFE.toFixed(3)}
#define HALO_LIFE ${HALO_LIFE.toFixed(3)}
#define HALO_SHED ${HALO_SHED.toFixed(3)}
#define BLOOM_SHED ${BLOOM_SHED.toFixed(3)}
#define HALO_GONE ${HALO_GONE.toFixed(3)}
#define HALO_DRIFT ${HALO_DRIFT.toFixed(3)}
#define GAS_TAIL ${GAS_TAIL.toFixed(3)}
#define HASTE_FULL ${HASTE_FULL.toFixed(3)}
#define HASTE_WAIT ${HASTE_WAIT.toFixed(3)}
#define TAIL_KEEP ${TAIL_KEEP.toFixed(3)}
#define GONE_SPREAD ${GONE_SPREAD.toFixed(3)}

uniform vec3 uBar;

uint hashU(uint x) {
  x ^= x >> 16; x *= 0x7feb352du;
  x ^= x >> 15; x *= 0x846ca68bu;
  x ^= x >> 16; return x;
}
float rnd(uint i, uint k) {
  return float(hashU(i * 9781u + k) & 0xffffffu) / 16777216.0;
}

bool keptStrand(int y) {
  return rnd(uint(y), 71u) >= SHED_SHARE;
}

float shedLifeOf(int y) {
  return SHED_LIFE * (0.3 + 1.1 * rnd(uint(y), 75u));
}

/**
 * How long a torn strand is gas for, which is the same figure as how long it
 * waits before it may knit back, so that it is always out of sight by the time
 * it is allowed home.
 */
float gasSpanOf(int y, float ease) {
  float wait = FREE_LIFE * ease;
  return keptStrand(y) ? wait : max(shedLifeOf(y), wait);
}

/** How much of that span this one takes to go, so that no two end together. */
float gasGoneOf(uint i) {
  return GONE_SPREAD + (1.0 - GONE_SPREAD) * rnd(i, 76u);
}

/** Where in that span the gas begins to go, as a share of it. */
float gasTailOf(int y) {
  return keptStrand(y) ? TAIL_KEEP : max(1.0 - GAS_TAIL / shedLifeOf(y), TAIL_KEEP);
}

/**
 * Gas is drawn against how far through its span it is rather than how many
 * seconds it has been out, because haste shortens that span underneath it: a
 * count in seconds is measured against a length that has changed since, and the
 * whole cloud steps through its fade at once.
 */
float gasFade(float t, float tail) {
  return 1.0 - smoothstep(tail, 1.0, t);
}

float haloLifeOf(uint i) {
  return HALO_LIFE * (0.6 + 0.8 * rnd(i, 61u));
}

float flungLifeOf(uint i, int pop) {
  float shed = pop == 2 ? BLOOM_SHED : HALO_SHED;
  return (rnd(i, 66u) < shed ? HALO_DRIFT : HALO_GONE) * (0.45 + 1.0 * rnd(i, 67u));
}

vec2 homeOf(ivec2 c, out float t, out int pop) {
  uint s = uint(c.y);
  float sv = (float(c.y) + 0.5) / float(STRANDS);
  float u = (float(c.x) + rnd(s, 11u)) / float(COLS);
  t = u;

  float off;
  if (sv < W_CORE) {
    pop = 0;
    off = ((sv / W_CORE) * 2.0 - 1.0) * (BAR_H * 0.5);

    off += (sin(u * WANDER_K1 + rnd(s, 21u) * 6.28318530718) * 0.62
      + sin(u * WANDER_K2 + rnd(s, 22u) * 6.28318530718) * 0.38) * WANDER_CORE;
  } else {

    pop = sv < W_RIM ? 1 : 2;
    off = 0.0;
  }

  float r = BAR_H * 0.5;
  float o = min(abs(off), r);
  float cap = r - sqrt(max(r * r - o * o, 0.0));
  return vec2(mix(uBar.x + cap, uBar.y - cap, u), uBar.z + off);
}`;

const CENSUS_FS = `#version 300 es
precision highp float;
precision highp int;
${HOME}

uniform sampler2D uSt;
uniform sampler2D uPos;

out vec4 oCol;

void main() {
  int x = int(gl_FragCoord.x);

  if (int(gl_FragCoord.y) == 1) {
    vec2 sum = vec2(0.0);
    float bound = 0.0;
    for (int y = 0; y < CORE_ROWS; y++) {
      ivec2 m = ivec2(x, y);
      if (texelFetch(uSt, m, 0).w != 0.0) continue;
      float mt;
      int mp;
      sum += texelFetch(uPos, m, 0).xy - homeOf(m, mt, mp);
      bound += 1.0;
    }
    oCol = vec4(bound > 0.0 ? sum / bound : vec2(0.0), bound, 0.0);
    return;
  }

  float kept = 0.0;
  float here = 0.0;
  float ready = 0.0;
  float aged = 0.0;
  for (int y = 0; y < CORE_ROWS; y++) {
    if (!keptStrand(y)) continue;
    kept += 1.0;

    vec4 s = texelFetch(uSt, ivec2(x, y), 0);
    if (s.w == 0.0) {
      here += 1.0;
      ready += 1.0;
      aged += s.z;
    } else if (s.w >= 1.0) {
      ready += 1.0;
    }
  }
  float n = max(kept, 1.0);
  oCol = vec4(here / n, ready / n, here > 0.0 ? aged / here : 0.0, 0.0);
}`;

const GAP_FS = `#version 300 es
precision highp float;
precision highp int;
#define COLS ${COLS}
#define MID ${COLS >> 1}
#define WHOLE ${WHOLE.toFixed(3)}
#define MENDED ${MENDED.toFixed(3)}
#define MEND_HOLD ${MEND_HOLD.toFixed(3)}
#define MEND_FALL ${MEND_FALL.toFixed(3)}
#define CUT_WAIT ${CUT_WAIT.toFixed(3)}
#define HASTE_FULL ${HASTE_FULL.toFixed(3)}

uniform sampler2D uWhole;
uniform sampler2D uPrev;
uniform float uDt;

out vec4 oGap;

void main() {
  float l = float(COLS);
  float r = float(COLS);
  float mid = float(COLS);
  float holes = 0.0;
  float gone = 0.0;
  for (int x = 0; x < COLS; x++) {
    if (texelFetch(uWhole, ivec2(x, 0), 0).x > WHOLE) {
      l = min(l, float(x));
      r = min(r, float(COLS - 1 - x));
      mid = min(mid, abs(float(x - MID)));
    } else {
      gone += 1.0;
    }
    if (texelFetch(uWhole, ivec2(x, 0), 0).x < MENDED) {
      holes += 1.0;
    }
  }

  vec4 was = texelFetch(uPrev, ivec2(0, 0), 0);

  if (int(gl_FragCoord.x) == 1) {
    float turn = texelFetch(uPrev, ivec2(1, 0), 0).x;
    // Each emptying takes the other turn: in from the ends, then out of the middle.
    if (gone > float(COLS) - 0.5 && was.x < float(COLS) - 0.5) turn = 1.0 - turn;
    oGap = vec4(turn, mid, 0.0, 0.0);
    return;
  }

  float run = gone > 0.5 ? min(was.z + uDt, HASTE_FULL) : 0.0;
  float sore = holes > 0.5
    ? min(was.w + uDt, CUT_WAIT + MEND_HOLD)
    : max(was.w - uDt * MEND_FALL, 0.0);
  oGap = vec4(l, r, run, sore);
}`;

const SIM_FS = `#version 300 es
precision highp float;
precision highp int;
${HOME}
${SEG}
#define K_LINK ${K_LINK.toFixed(2)}
#define SMOOTH ${SMOOTH.toFixed(2)}
#define YARN ${YARN.toFixed(2)}
#define K_HOME ${K_HOME.toFixed(2)}
#define HOT_HOLD ${HOT_HOLD.toFixed(3)}
#define DRAG ${DRAG.toFixed(3)}
#define DRAG_COLD ${DRAG_COLD.toFixed(3)}
#define DRAG_HOT ${DRAG_HOT.toFixed(3)}
#define DRAG_FREE ${DRAG_FREE.toFixed(3)}
#define EMIT_RATE ${EMIT_RATE.toFixed(3)}
#define BLAST ${BLAST.toFixed(3)}
#define LOOSE_GRIP ${LOOSE_GRIP.toFixed(3)}
#define SWIRL_RATE ${SWIRL_RATE.toFixed(3)}
#define DAMP_BOUND ${DAMP_BOUND.toFixed(3)}
#define DAMP_FREE ${DAMP_FREE.toFixed(3)}
#define BREAK ${BREAK.toFixed(3)}
#define BREAK_EDGE ${BREAK_EDGE.toFixed(3)}
#define BREAK_HURT ${BREAK_HURT.toFixed(3)}
#define RELINK_KEEP ${RELINK_KEEP.toFixed(3)}
#define TEAR_HURT ${TEAR_HURT.toFixed(3)}
#define CUT_WAIT ${CUT_WAIT.toFixed(3)}
#define RELINK ${RELINK.toFixed(3)}
#define RELINK_COOL ${RELINK_COOL.toFixed(3)}
#define COOL ${COOL.toFixed(3)}
#define TEAR_AWAY ${TEAR_AWAY.toFixed(1)}
#define HEAL_V ${HEAL_V.toFixed(2)}
#define HASTE_HEAL ${HASTE_HEAL.toFixed(3)}
#define HASTE_GAS ${HASTE_GAS.toFixed(3)}
#define HEAL_HEAT ${HEAL_HEAT.toFixed(3)}
#define BEND_KEEP ${BEND_KEEP.toFixed(3)}
#define END_ALONE ${END_ALONE.toFixed(3)}
#define MID ${COLS >> 1}
#define LEAP ${LEAP}
#define LIMB ${LIMB.toFixed(3)}
#define KNIFE ${KNIFE.toFixed(3)}
#define GROW ${GROW.toFixed(3)}
#define RISE_V ${RISE_V.toFixed(2)}
#define SWIRL_V ${SWIRL_V.toFixed(2)}
#define SWIRL_WAVES ${SWIRL_WAVES}
#define SWIRL_LONG ${SWIRL_LONG.toFixed(1)}
#define SWIRL_CHURN ${SWIRL_CHURN.toFixed(1)}
#define GLOW_KEEP ${GLOW_KEEP.toFixed(3)}
#define SPEC_HEAT ${SPEC_HEAT.toFixed(3)}
#define SPEC_LIFT ${SPEC_LIFT.toFixed(1)}
#define SPEC_ANCHOR ${SPEC_ANCHOR.toFixed(3)}

uniform sampler2D uPos;
uniform sampler2D uSt;
uniform sampler2D uVel;
uniform sampler2D uSpec;
uniform float uSpecOn;

uniform sampler2D uWhole;
uniform sampler2D uGap;
uniform vec2 uGrid;
uniform float uDt;
uniform float uTime;
uniform float uRest;
uniform float uInit;

uniform float uEmit;

layout(location = 0) out vec4 oPos;
layout(location = 1) out vec4 oSt;

vec2 colAt(int x) {
  if (x < 0 || x > COLS - 1) return vec2(1.0, 2.0);
  vec4 c = texelFetch(uWhole, ivec2(x, 0), 0);
  return vec2(c.x, c.z);
}

float lineAt(int x) {
  return colAt(x).x > WHOLE ? 1.0 : 0.0;
}

float reach(int x, int dir) {
  return (lineAt(x + dir * REACH1) + lineAt(x + dir * REACH2)
    + lineAt(x + dir * REACH3) + lineAt(x + dir * REACH4)) * 0.25;
}

bool anchored(int x) {
  return max(reach(x, -1), reach(x, 1)) >= ISLAND;
}

/**
 * Whether the strand of this row at that column is home and can be grown out of.
 *
 * Asked of the row rather than of the column, because the two disagree: a column
 * reads as line on its kept strands alone, and the shed ones come due a second
 * behind them, into a neighbourhood that already looks whole.
 */
bool faceAt(int x, int y) {
  return texelFetch(uSt, ivec2(clamp(x, 0, COLS - 1), y), 0).w == 0.0;
}

vec2 grewFrom(ivec2 c, float knit, out bool seeded) {
  vec2 gap = texelFetch(uGap, ivec2(0, 0), 0).xy;
  vec2 turn = texelFetch(uGap, ivec2(1, 0), 0).xy;
  float alone = float(COLS) * END_ALONE;
  bool ends = turn.x > 0.5;
  bool endL = ends && gap.x > alone;
  bool endR = ends && gap.y > alone;
  bool core = !ends && turn.y > alone;
  seeded = false;
  bool doneL = false;
  bool doneR = false;
  for (int d = 1; d <= LEAP; d++) {
    int l = c.x - d;
    int r = c.x + d;
    if (!doneL && (l >= 0 || endL)) {
      bool sown = core && l == MID;
      bool over = l < 0;
      vec2 w = sown ? vec2(1.0, 2.0) : colAt(l);
      // Kept looking rather than given up on, or a strand whose own row is still
      // out at the nearest face roots on a face that can never hand it anything
      // and waits there for good.
      if (w.x > WHOLE && (sown || over || faceAt(l, c.y))) {
        doneL = true;
        if (w.y >= float(d) * knit && (sown || anchored(l))) {
          seeded = sown || over;
          return vec2(float(-d), w.y - float(d) * knit);
        }
      }
    }
    if (!doneR && (r <= COLS - 1 || endR)) {
      bool sown = core && r == MID;
      bool over = r > COLS - 1;
      vec2 w = sown ? vec2(1.0, 2.0) : colAt(r);
      if (w.x > WHOLE && (sown || over || faceAt(r, c.y))) {
        doneR = true;
        if (w.y >= float(d) * knit && (sown || anchored(r))) {
          seeded = sown || over;
          return vec2(float(d), w.y - float(d) * knit);
        }
      }
    }
    if (doneL && doneR) break;
  }
  return vec2(0.0);
}

vec3 bundleAt(int x) {
  vec4 b = texelFetch(uWhole, ivec2(x, 1), 0);
  return vec3(b.xy, b.z);
}

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

    float born = uEmit < 0.0 ? HALO_LIFE * 2.0 : rnd(i, 61u) * HALO_LIFE;
    oSt = vec4(0.0, 1.0, 2.0, pop == 0 ? 0.0 : born);
    return;
  }

  vec4 P = texelFetch(uPos, c, 0);
  vec4 S = texelFetch(uSt, c, 0);
  vec2 p = P.xy, v = P.zw;
  float heat = S.x, linkN = S.y, age = S.z, torn = S.w;
  float gate = smoothstep(HEAT_SLOW, HEAT_FAST, length(uCursorV));
  float blob = blobNow();
  float rush = clamp(texelFetch(uGap, ivec2(0, 0), 0).z / HASTE_FULL, 0.0, 1.0);

  // Sampled, not fetched: thirty-two bands read across the bar as one curve.
  // Level lights the bar, drive moves it, and only drive is allowed a sign.
  vec2 spec = uSpecOn > 0.5 ? texture(uSpec, vec2(t, 0.5)).xy : vec2(0.0);
  float band = spec.x;
  float drive = spec.y;

  vec2 fluid = texture(uVel, clamp(p / uGrid, vec2(0.0), vec2(1.0))).xy;

  if (pop != 0) {
    float spread = pop == 1 ? RIM_SIGMA : BLOOM_SIGMA;
    float life = haloLifeOf(i);

    ivec2 src = ivec2(c.x, int(rnd(i, 62u) * float(CORE_ROWS)));
    vec4 line = texelFetch(uPos, src, 0);
    vec4 sst = texelFetch(uSt, src, 0);
    vec2 drift = S.yz;

    bool loose = torn < 0.0;
    float age = abs(torn) + uDt;
    float ang = rnd(i, 63u) * 6.28318530718;
    vec2 dir = vec2(cos(ang), sin(ang));

    float span = loose ? flungLifeOf(i, pop) : life;
    bool back = sst.w == 0.0;
    // An open line bleeds: more of the halo tears loose the longer the cut stays open.
    bool vent = rnd(i, 68u) < HASTE_GAS * rush;
    bool born = uEmit > rnd(i, 65u) * HALO_LIFE;
    if (age > span && born && back) {

      age = 0.0;
      loose = false;
      drift = vec2(0.0);
      p = line.xy;
      v = vec2(0.0);
      heat = max(heat, sst.x);
    } else if (age > span) {

      age = span;
    }

    if (!loose && (!back || vent)) {
      loose = true;

      age = 1e-3;
      v = line.zw + dir * (spread * EMIT_RATE * BLAST);
      heat = max(heat, sst.x);
    }

    if (loose) {
      vec2 want = fluid + swirl(p) * (spread * SWIRL_RATE);
      v += (want - v) * min(LOOSE_GRIP * uDt, 1.0);
      p += v * uDt;
    } else {

      vec2 away = dir
        * (spread * EMIT_RATE * (0.35 + 1.3 * rnd(i, 64u)) * (1.0 - age / life));

      if (age < life) drift += (away + swirl(p) * (spread * SWIRL_RATE)) * uDt;
      p = line.xy + drift;
      v = vec2(0.0);
    }

    if (uCursorOn > 0.5) {
      float d = segDist(p) / blob;
      heat = max(heat, exp(-d * d) * gate);
    }
    heat *= exp(-(loose ? 1.0 / (flungLifeOf(i, pop) * GLOW_KEEP) : COOL) * uDt);

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

  float free = torn > 0.0 ? 1.0 : 0.0;

  // The line only. Halo and bloom take their heat from the strand they were
  // thrown off, the way they already take the cursor's, so the gas carries what
  // the music was when it left rather than lighting the whole cloud at once.
  heat = max(heat, band * SPEC_HEAT);

  vec2 pN = texelFetch(uPos, ivec2(min(c.x + 1, COLS - 1), c.y), 0).xy;
  vec2 pP = texelFetch(uPos, ivec2(max(c.x - 1, 0), c.y), 0).xy;
  float lenN = c.x < COLS - 1 ? distance(pN, p) : 0.0;
  float lenP = c.x > 0 ? distance(pP, p) : 0.0;
  vec4 sP = c.x > 0 ? texelFetch(uSt, ivec2(c.x - 1, c.y), 0) : vec4(0.0);
  vec4 sN = c.x < COLS - 1 ? texelFetch(uSt, ivec2(c.x + 1, c.y), 0) : vec4(0.0);
  float linkP = sP.y;

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

    if (c.x > 0 && c.x < COLS - 1 && linkN > 0.5 && linkP > 0.5) {
      F += (pN + pP - 2.0 * p) * SMOOTH;
    }

    vec3 bundle = bundleAt(c.x);
    if (bundle.z > 1.0) F += (bundle.xy - (p - home)) * YARN;

    float cold = mix(HOT_HOLD, 1.0, (1.0 - heat) * (1.0 - heat));
    F += toHome * (K_HOME * cold);
    // Up, and only up. The yarn binds every strand to its column's mean, so a
    // column rides a push as one and a swell that parts the strands is pulled
    // flat before it can be seen.
    //
    // The two ends are the anchors. The lift fades out into them, so the bar
    // stays pinned where it meets the page and only its span rides the music.
    F.y -= drive * SPEC_LIFT * smoothstep(0.0, SPEC_ANCHOR, min(t, 1.0 - t));
    grip = DRAG * (DRAG_COLD + DRAG_HOT * heat);
  } else {

    fluid += swirl(p) * (SWIRL_V * (0.5 + rnd(i, 72u)));
    fluid.y -= RISE_V * (0.3 + 1.4 * rnd(i, 73u));
    grip = DRAG * DRAG_FREE * (0.55 + 0.9 * rnd(i, 74u));
  }
  F += (fluid - v) * grip;

  v += F * uDt;
  v *= exp(-mix(DAMP_BOUND, DAMP_FREE, free) * uDt);
  p += v * uDt;

  if (uCursorOn > 0.5) {
    float d = segDist(p) / blob;
    heat = max(heat, exp(-d * d) * gate);
  }

  float edge = clamp(abs(home.y - uBar.z) / (BAR_H * 0.5), 0.0, 1.0);
  bool cut = texelFetch(uGap, ivec2(0, 0), 0).w > CUT_WAIT;
  float hurt = cut ? BREAK_HURT : 1.0;
  float away = cut ? TEAR_AWAY * TEAR_HURT : TEAR_AWAY;
  float brk = BREAK * uRest * mix(1.0, BREAK_EDGE, edge) * hurt;

  if (free < 0.5 && c.x < COLS - 1) {
    if (linkN > 0.5 && lenN > brk) {
      linkN = 0.0;
    } else if (linkN < 0.5 && lenN < RELINK * uRest * max(hurt, RELINK_KEEP)
      && heat < RELINK_COOL && tornN == 0.0) {
      linkN = 1.0;
    }
  }

  float span = gasSpanOf(c.y, mix(1.0, HASTE_WAIT, rush));
  // Cooled on the life the strand would have had at rest rather than the
  // hurried one, because haste is the line's business and not the light's: tie
  // the two and holding a cut open takes the glow out of everything thrown off
  // it.
  float glow = gasSpanOf(c.y, 1.0) * GLOW_KEEP;
  heat *= exp(-(free > 0.5 ? 1.0 / glow : COOL) * uDt);
  age = min(age + uDt, 2.0);

  bool tied = (c.x < COLS - 1 && linkN > 0.5) || (c.x > 0 && linkP > 0.5);

  bool fresh = age < LIMB;

  vec2 col = texelFetch(uWhole, ivec2(c.x, 0), 0).xy;
  if (free < 0.5) {
    bool shred = col.x <= WHOLE;
    bool island = max(reach(c.x, -1), reach(c.x, 1)) < ISLAND;

    if (hm > away || shred || island || (!tied && !fresh)) {
      torn = 1e-3;
      linkN = 0.0;
    }
  } else {
    torn = min(torn + uDt / span, 1.0);
  }

  bool due = torn >= 1.0;
  float knit = uRest / (HEAL_V * mix(1.0, HASTE_HEAL, rush));
  bool seeded = false;
  vec2 grew = due ? grewFrom(c, knit, seeded) : vec2(0.0);
  int from = int(grew.x);
  bool rooted = from != 0;
  bool ready = col.y > 0.999;

  ivec2 face = ivec2(clamp(c.x + from, 0, COLS - 1), c.y);
  vec4 sF = texelFetch(uSt, face, 0);
  bool held = rooted && !seeded && sF.w == 0.0;
  bool edged = rooted && seeded;

  float blade = segDist(home) / blob;
  bool calm = uCursorOn < 0.5 || exp(-blade * blade) * gate < KNIFE;
  if ((due && (held || edged) && ready && calm) || !(dot(p, p) < 1e12)) {

    float nt;
    int np;
    p = home;
    v = vec2(0.0);
    heat = 0.0;
    if (held) {
      vec4 F = texelFetch(uPos, face, 0);
      p = home + (F.xy - homeOf(face, nt, np));
      v = F.zw;
      heat = min(sF.x, HEAL_HEAT);
    }

    vec2 off = p - home;
    float far = length(off);
    float cap = away * BEND_KEEP;
    if (far > cap) p = home + off * (cap / far);

    if (!(dot(p, p) < 1e12)) {
      p = home;
      v = vec2(0.0);
      heat = 0.0;
    }
    torn = 0.0;

    age = min(grew.y, knit);
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
#define GAS_GROW ${GAS_GROW.toFixed(3)}

#define HALO_IN ${HALO_IN.toFixed(3)}
#define HALO_OUT ${HALO_OUT.toFixed(3)}
#define EDGE_BITE ${EDGE_BITE.toFixed(3)}
#define BAR_H2 ${(BAR_H * 0.5).toFixed(3)}

uniform sampler2D uPos;
uniform sampler2D uSt;
uniform vec2 uView;
uniform vec2 uHue;
uniform float uDpr;

out vec3 vColor;

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
  float sprite = pop == 0 ? SPRITE_CORE : (pop == 1 ? SPRITE_RIM : SPRITE_BLOOM);
  float fade;
  float size;
  if (pop == 0) {

    float went = min(S.w / gasGoneOf(i), 1.0);
    fade = smoothstep(0.0, 1.0, clamp(S.z / GROW, 0.0, 1.0)) * gasFade(went, gasTailOf(c.y));

    size = sprite + GAS_GROW * went;

    if (S.w == 0.0) {
      float l = (barAt(c.x - REACH1, c.y) + barAt(c.x - REACH2, c.y)
        + barAt(c.x - REACH3, c.y) + barAt(c.x - REACH4, c.y)) * 0.25;
      float r = (barAt(c.x + REACH1, c.y) + barAt(c.x + REACH2, c.y)
        + barAt(c.x + REACH3, c.y) + barAt(c.x + REACH4, c.y)) * 0.25;
      float edge = clamp(abs(home.y - uBar.z) / BAR_H2, 0.0, 1.0);
      fade *= pow(min(l, r), mix(1.0, EDGE_BITE, edge));
    }
  } else {

    float life = haloLifeOf(i);
    float age = abs(S.w);
    if (S.w < 0.0) {

      float span = flungLifeOf(i, pop);
      float went = clamp(age / span, 0.0, 1.0);
      fade = gasFade(went, max(1.0 - GAS_TAIL / span, TAIL_KEEP));
      size = sprite + GAS_GROW * went;
    } else {

      vec4 sst = texelFetch(uSt, ivec2(c.x, int(rnd(i, 62u) * float(CORE_ROWS))), 0);
      fade = smoothstep(0.0, life * HALO_IN, age)
        * (1.0 - smoothstep(life * HALO_OUT, life, age))
        * smoothstep(0.0, 1.0, clamp(sst.z / GROW, 0.0, 1.0));
      size = sprite * (0.5 + 0.5 * fade);
    }
  }

  vec3 rgb = hsl2rgb(mix(uHue.x, uHue.y, t), 0.85, 0.56);
  float a = pop == 0 ? ALPHA_CORE : (pop == 1 ? ALPHA_RIM : ALPHA_BLOOM);
  if (pop == 0) a *= 0.7 + 0.6 * rnd(i, 15u);
  vColor = rgb * (a * fade * (1.0 + HEAT_GAIN * S.x));

  gl_PointSize = size * uDpr;
  vec2 ndc = (p / uView) * 2.0 - 1.0;
  gl_Position = vec4(ndc.x, -ndc.y, 0.0, 1.0);
}`;

const DRAW_FS = `#version 300 es
precision highp float;
in vec3 vColor;
uniform float uCeil;
out vec4 oColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float f = max(0.0, 1.0 - dot(d, d) * 4.0);
  vec3 c = vColor * f * f;
  oColor = vec4(c, max(c.r, max(c.g, c.b)) * uCeil);
}`;

const RESOLVE_FS = `#version 300 es
precision highp float;
uniform sampler2D uAcc;
out vec4 oColor;
void main() {
  vec4 acc = texelFetch(uAcc, ivec2(gl_FragCoord.xy), 0);
  float peak = max(acc.r, max(acc.g, acc.b));
  // Each emitter wrote the ceiling it wanted into the alpha channel, weighted
  // by the light it put here, so this is a per-pixel figure and two of them
  // overlapping meet in between. Below one is allowed and meant: it is how a
  // solid element holds its own colour on a screen with nothing above white,
  // where the particles ask for exactly one and get what they always got.
  float ceiling = max(acc.a / max(peak, 1e-4), 1e-3);
  float cover = 1.0 - exp(-peak);
  float lit = ceiling * (1.0 - exp(-peak / ceiling));
  oColor = vec4(acc.rgb * (lit / max(peak, 1e-4)), cover);
}`;

function half(raw: ArrayLike<number>, at: number, isHalf: boolean): number {
  const h = raw[at] ?? 0;
  if (!isHalf) return h;
  const s = h & 0x8000 ? -1 : 1;
  const e = (h >> 10) & 0x1f;
  const m = h & 0x3ff;
  if (e === 0) return s * m * 2 ** -24;
  if (e === 31) return m ? NaN : s * Infinity;
  return s * (1 + m / 1024) * 2 ** (e - 15);
}

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

/**
 * Everything a canvas has to do to be allowed above white, in one place
 * because there are two canvases on this page that want it.
 *
 * Both halves are asked for by name: a buffer that can hold a number above one
 * and a switch saying the number above one means brighter than white. Missing
 * either, `range` is null and the caller stays at a ceiling of one, which is
 * the picture every display got before any of this.
 */
function hdrPlumbing(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext): {
  range: MediaQueryList | null;
  extend(on: boolean): void;
  size(w: number, h: number, on: boolean): void;
} {
  const hc = canvas as HTMLCanvasElement & Partial<HdrCanvas>;
  const hg = gl as WebGL2RenderingContext & Partial<HdrContext>;
  // RGBA16F is not a drawing-buffer format until one of these is enabled, and
  // asking for it without them is refused rather than reported: the buffer
  // stays at eight bits and every channel clips at white independently, which
  // walks an amber to yellow as the ceiling rises and then to white. Cheap
  // insurance against reading that as a colour bug — it is a format bug.
  const float = !!gl.getExtension('EXT_color_buffer_float')
    || !!gl.getExtension('EXT_color_buffer_half_float');
  const can = float
    && typeof hg.drawingBufferStorage === 'function'
    && ('drawingBufferToneMapping' in hg
      || typeof hc.configureHighDynamicRange === 'function');
  return {
    range: can ? window.matchMedia?.('(dynamic-range: high)') ?? null : null,
    extend(on: boolean): void {
      if (!can) return;
      if ('drawingBufferToneMapping' in hg) {
        hg.drawingBufferToneMapping = { mode: on ? 'extended' : 'standard' };
      } else {
        hc.configureHighDynamicRange?.({ mode: on ? 'extended' : 'default' });
      }
    },
    size(w: number, h: number, on: boolean): void {
      canvas.width = w;
      canvas.height = h;
      if (can) hg.drawingBufferStorage!(on ? gl.RGBA16F : gl.RGBA8, w, h);
    },
  };
}

const LAMP_FS = `#version 300 es
precision highp float;
#define EDGE ${DISC_EDGE.toFixed(3)}

uniform vec2 uCentre;
uniform float uRadius;
uniform vec3 uColor;
uniform float uCeil;

out vec4 oColor;

void main() {
  float cov = clamp((uRadius - distance(gl_FragCoord.xy, uCentre)) / EDGE + 0.5, 0.0, 1.0);
  if (cov <= 0.0) discard;
  oColor = vec4(uColor * uCeil * cov, cov);
}`;

export interface Lamp {
  /** Whether the screen this window is on has anywhere above white to go. */
  hdrReady(): boolean;
  setHdr(on: boolean): void;
  /** Whether there is a record on, which is what the range is spent on. */
  setPlaying(on: boolean): void;
  destroy(): void;
}

/**
 * The one bright control on the page, lit rather than filled.
 *
 * A canvas of its own, laid over the element's own fill and under its glyph,
 * and the reasons are all about what it is *not* sharing. It is not in the
 * glow field, which carries a grayscale-and-fade for a stopped radio and a
 * six-second breath for a playing one — both written for scenery, and a button
 * is not scenery. It is not replacing the CSS circle either, only covering it,
 * so a machine without WebGL2 and a canvas that never draws both leave the
 * button exactly as it has always been, with nothing to switch and nothing to
 * fall back to.
 *
 * Being the element's own child is the rest of it: the press dip and the slow
 * breath of a loading station are transforms and opacity on the button, and a
 * child wears both without being told either.
 */
export function mountLamp(
  host: HTMLElement, opts: { hdr?: boolean; playing?: boolean } = {},
): Lamp | null {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;display:block;pointer-events:none;';

  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  });
  if (!gl) return null;

  const hdr = hdrPlumbing(canvas, gl);
  let prog: WebGLProgram;
  try {
    prog = link(gl, QUAD_VS, LAMP_FS);
  } catch (err) {
    // The button draws its own circle and always has. Nothing to put back.
    console.warn('glow-field: no lamp', err);
    return null;
  }
  const vao = gl.createVertexArray();
  const uCentre = gl.getUniformLocation(prog, 'uCentre');
  const uRadius = gl.getUniformLocation(prog, 'uRadius');
  const uColor = gl.getUniformLocation(prog, 'uColor');
  const uCeil = gl.getUniformLocation(prog, 'uCeil');

  let wanted = opts.hdr ?? true;
  let playing = opts.playing ?? false;
  let red = 0;
  let green = 0;
  let blue = 0;

  // Read from the element rather than from a constant, so the button and the
  // light on it cannot come to disagree about what colour it is.
  function readColour(): void {
    const m = getComputedStyle(host).backgroundColor.match(/(\d+(?:\.\d+)?)/g);
    if (!m || m.length < 3 || (m.length > 3 && Number(m[3]) === 0)) return;
    red = Number(m[0]) / 255;
    green = Number(m[1]) / 255;
    blue = Number(m[2]) / 255;
  }

  /**
   * Above white only while something is playing.
   *
   * The range is what the record is spending, so a stopped radio has no claim
   * on it: the button is then a shape saying press me, and a shape that is
   * brighter than the page it is sitting on is asking rather than offering.
   */
  function ceiling(): number {
    return playing && wanted && hdr.range?.matches ? BUTTON_HEADROOM : 1;
  }

  /**
   * Drawn on a change and not a frame sooner. Nothing here moves on its own:
   * the press, the breath and the fade are all the element's, and it takes the
   * canvas with it.
   */
  function paint(): void {
    // Laid out rather than measured: `offsetWidth` is the box the stylesheet
    // gave the element, where a client rect is that box with the press dip
    // already applied to it. Sizing from the dip would put the dip in twice —
    // once in the canvas, and again in the transform that carries it.
    const across = Math.min(host.offsetWidth, host.offsetHeight);
    if (across < 2) return;

    // A canvas is a replaced element, so a pair of insets cannot stretch it —
    // with no width of its own it takes the size of its buffer and hangs off
    // the corner. The box is therefore set here, in the same pass that decides
    // what goes in it.
    const border = parseFloat(getComputedStyle(host).borderTopWidth) || 0;
    const boxW = host.offsetWidth + SPILL * 2;
    const boxH = host.offsetHeight + SPILL * 2;
    canvas.style.left = `${-(border + SPILL)}px`;
    canvas.style.top = `${-(border + SPILL)}px`;
    canvas.style.width = `${boxW}px`;
    canvas.style.height = `${boxH}px`;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.round(boxW * dpr));
    const h = Math.max(2, Math.round(boxH * dpr));
    const lit = ceiling() > 1;
    hdr.size(w, h, lit);
    hdr.extend(lit);
    readColour();
    gl!.viewport(0, 0, w, h);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.useProgram(prog);
    gl!.bindVertexArray(vao);
    gl!.uniform2f(uCentre, w / 2, h / 2);
    // The element's own circle, edge for edge. What the canvas carries beyond
    // it is room for the edge to soften into, not disc.
    gl!.uniform1f(uRadius, (across / 2) * dpr);
    gl!.uniform3f(uColor, red, green, blue);
    gl!.uniform1f(uCeil, ceiling());
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  readColour();
  host.prepend(canvas);
  paint();

  const ro = new ResizeObserver(paint);
  ro.observe(host);
  hdr.range?.addEventListener('change', paint);

  return {
    hdrReady(): boolean {
      return !!hdr.range?.matches;
    },
    setHdr(on: boolean): void {
      if (on === wanted) return;
      wanted = on;
      paint();
    },
    setPlaying(on: boolean): void {
      if (on === playing) return;
      playing = on;
      paint();
    },
    destroy(): void {
      ro.disconnect();
      hdr.range?.removeEventListener('change', paint);
      canvas.remove();
    },
  };
}

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

  const hdrCanvas = canvas as HTMLCanvasElement & Partial<HdrCanvas>;
  const hdrGl = gl as WebGL2RenderingContext & Partial<HdrContext>;
  const canHdr = typeof hdrGl.drawingBufferStorage === 'function'
    && ('drawingBufferToneMapping' in hdrGl
      || typeof hdrCanvas.configureHighDynamicRange === 'function');
  const hdrRange = canHdr ? window.matchMedia?.('(dynamic-range: high)') ?? null : null;
  let headroom = 1;
  let hdrWanted = opts.hdr ?? true;

  function extendRange(on: boolean): void {
    if ('drawingBufferToneMapping' in hdrGl) {
      hdrGl.drawingBufferToneMapping = { mode: on ? 'extended' : 'standard' };
    } else {
      hdrCanvas.configureHighDynamicRange?.({ mode: on ? 'extended' : 'default' });
    }
  }

  let advectProg: WebGLProgram | undefined;
  let divProg: WebGLProgram | undefined;
  let jacobiProg: WebGLProgram | undefined;
  let projectProg: WebGLProgram | undefined;
  let censusProg: WebGLProgram | undefined;
  let gapProg: WebGLProgram | undefined;
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
  let whole: Target | undefined;
  let gaps: [Target, Target] | undefined;
  let gapFront: 0 | 1 = 0;
  let acc: Target | undefined;
  let specTex: WebGLTexture | undefined;

  let dpr = 1;
  let viewW = 1;
  let viewH = 1;
  let gridW = 0;
  let gridH = 0;
  let barX0 = 0;
  let barX1 = 0;
  let barY = 0;

  const vao = gl.createVertexArray();
  let cloud: TitleCloud | null = null;

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

  function sizeBuffer(w: number, h: number): void {
    canvas.width = w;
    canvas.height = h;
    if (canHdr) hdrGl.drawingBufferStorage!(headroom > 1 ? gl!.RGBA16F : gl!.RGBA8, w, h);
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
    if (!sameSize) sizeBuffer(w, h);
    viewW = Math.max(1, box.width);
    viewH = Math.max(1, box.height);
    measureBar();
    if (sameSize && barX0 === wasX0 && barX1 === wasX1 && barY === wasY) return false;

    if (!simProg) {
      advectProg = link(gl!, QUAD_VS, ADVECT_FS);
      divProg = link(gl!, QUAD_VS, DIV_FS);
      jacobiProg = link(gl!, QUAD_VS, JACOBI_FS);
      projectProg = link(gl!, QUAD_VS, PROJECT_FS);
      censusProg = link(gl!, QUAD_VS, CENSUS_FS);
      gapProg = link(gl!, QUAD_VS, GAP_FS);
      simProg = link(gl!, QUAD_VS, SIM_FS);
      drawProg = link(gl!, DRAW_VS, DRAW_FS);
      resolveProg = link(gl!, QUAD_VS, RESOLVE_FS);
      locate(advectProg, ['uVel', 'uGrid', 'uDt', 'uTime',
        'uFrom', 'uTo', 'uCursorV', 'uCursorOn']);
      locate(divProg, ['uVel']);
      locate(jacobiProg, ['uPrs', 'uDiv']);
      locate(projectProg, ['uVel', 'uPrs']);
      locate(censusProg, ['uSt', 'uPos', 'uBar']);
      locate(gapProg, ['uWhole', 'uPrev', 'uDt']);
      locate(simProg, ['uPos', 'uSt', 'uVel', 'uWhole', 'uGap', 'uGrid', 'uDt', 'uTime', 'uRest',
        'uInit', 'uEmit', 'uBar', 'uFrom', 'uTo', 'uCursorV', 'uCursorOn', 'uSpec', 'uSpecOn']);
      locate(drawProg, ['uPos', 'uSt', 'uView', 'uHue', 'uDpr', 'uBar', 'uCeil']);
      locate(resolveProg, ['uAcc']);
      pools = [makePool(), makePool()];
      // Smooth, so the shader reads one curve rather than thirty-two steps.
      specTex = makeTex(gl!.RG16F, SPEC_BANDS, 1, true);
      whole = makeTarget(gl!.RGBA16F, COLS, 2);
      gaps = [makeTarget(gl!.RGBA16F, 2, 1), makeTarget(gl!.RGBA16F, 2, 1)];
      gapFront = 0;
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
      // Full floats, unlike everything else here, because pressure is the one
      // field whose numbers are not a picture: it runs to roughly the cursor's
      // speed times the width of its blob, which a half float cannot hold.
      prss = [makeTarget(gl!.R32F, gw, gh), makeTarget(gl!.R32F, gw, gh)];
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
    if (!simProg || !censusProg || !gapProg || !pools || !whole || !gaps || !vels || !specTex) {
      return;
    }
    const [gx, gy] = span();
    const rest = Math.max(barX1 - barX0, 1) / COLS;

    if (!init) {
      pass(censusProg, whole.fbo, COLS, 2);
      bindTex(censusProg, 'uSt', 0, pools[front].st);
      bindTex(censusProg, 'uPos', 1, pools[front].pos);
      gl!.uniform3f(u(censusProg, 'uBar'), barX0, barX1, barY);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);

      const gb = gapFront === 0 ? 1 : 0;
      pass(gapProg, gaps[gb].fbo, 2, 1);
      bindTex(gapProg, 'uWhole', 0, whole.tex);
      bindTex(gapProg, 'uPrev', 1, gaps[gapFront].tex);
      gl!.uniform1f(u(gapProg, 'uDt'), dt);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      gapFront = gb;
    }

    const back = front === 0 ? 1 : 0;
    pass(simProg, pools[back].fbo, COLS, STRANDS);
    bindTex(simProg, 'uPos', 0, pools[front].pos);
    bindTex(simProg, 'uSt', 1, pools[front].st);
    bindTex(simProg, 'uVel', 2, vels[velFront].tex);
    bindTex(simProg, 'uWhole', 3, whole.tex);
    bindTex(simProg, 'uGap', 4, gaps[gapFront].tex);
    bindTex(simProg, 'uSpec', SPEC_UNIT, specTex);
    gl!.uniform1f(u(simProg, 'uSpecOn'), specLive ? 1 : 0);
    gl!.uniform3f(u(simProg, 'uBar'), barX0, barX1, barY);
    gl!.uniform2f(u(simProg, 'uGrid'), gx, gy);
    gl!.uniform1f(u(simProg, 'uDt'), dt);
    gl!.uniform1f(u(simProg, 'uTime'), simTime);
    gl!.uniform1f(u(simProg, 'uRest'), rest);
    gl!.uniform1f(u(simProg, 'uInit'), init ? 1 : 0);
    gl!.uniform1f(u(simProg, 'uEmit'), playing ? simTime - emitAt : -1);
    bindStroke(simProg);
    if (init) gl!.uniform1f(u(simProg, 'uCursorOn'), 0);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    front = back;

    // The same velocity field the bar is drawn in, so gas let go of a title
    // drifts on whatever the cursor has already stirred up.
    cloud?.step(dt, simTime, vels[velFront].tex, gx, gy);
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
    gl!.uniform1f(u(drawProg, 'uCeil'), headroom);
    gl!.drawArrays(gl!.POINTS, 0, COLS * STRANDS);

    // The title's own ceiling, and the one thing that decides it: a name is
    // lit while the record is playing and is page white when it is not.
    cloud?.draw(viewW, viewH, playing && headroom > 1 ? TITLE_HEADROOM : 1);

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

  let playing = opts.playing ?? true;
  let emitAt = 0;

  let spec: AnalyserNode | null = null;
  let bins: Float32Array<ArrayBuffer> | undefined;
  let edges: Int32Array | undefined;
  let tilt: Float32Array | undefined;
  const bands = new Float32Array(SPEC_BANDS);
  /** What each band has lately been, which is what `flux` reads it against. */
  const slow = new Float32Array(SPEC_BANDS);
  /** Level and drive interleaved, in the layout the two-channel upload wants. */
  const pack = new Float32Array(SPEC_BANDS * 2);
  let mode: SpectrumMode = opts.spectrumMode ?? 'bands';
  let specLive = false;
  /** Seconds of music the averages have seen, which is what warms them up. */
  let specAge = 0;

  /**
   * Which bins each band owns, worked out once the analyser is there to ask.
   *
   * Log-spaced because pitch is. Linear bins put the whole of the bass in the
   * first column and a half of the bar and give half their number to everything
   * above 12 kHz, where there is nothing to look at.
   *
   * Every band is forced at least one bin of its own. At the bottom the bands
   * are narrower than a bin is wide, so without that the lowest few would all
   * read the same bin and move as one.
   */
  function planBands(rate: number, count: number): void {
    edges = new Int32Array(SPEC_BANDS + 1);
    tilt = new Float32Array(SPEC_BANDS);
    const width = rate / (count * 2);
    const span = SPEC_HIGH / SPEC_LOW;
    let at = 1;
    for (let b = 0; b <= SPEC_BANDS; b++) {
      const f = SPEC_LOW * Math.pow(span, b / SPEC_BANDS);
      at = Math.max(at, Math.min(count - 1, Math.round(f / width)));
      edges[b] = at;
      at += 1;
      if (b < SPEC_BANDS) tilt[b] = SPEC_TILT * Math.log2(Math.pow(span, (b + 0.5) / SPEC_BANDS));
    }
  }

  /**
   * The music, folded to what the bar can hold, and true while it is worth
   * running for.
   *
   * Loudest bin per band rather than the mean: a band is mostly noise floor and
   * averaging buries the one partial that is actually sounding in it.
   *
   * Rising fast and falling slow is the whole difference between a bar that
   * moves with the music and one that flickers. `AnalyserNode` cannot do it —
   * its own smoothing is a single symmetric constant — so the levels arrive raw
   * and are shaped here.
   *
   * Level is the same in both modes and is always positive, because it lights
   * the bar. Only the drive channel differs, and only it may go negative.
   */
  function readSpectrum(dt: number): boolean {
    if (!spec) spec = opts.spectrum?.() ?? null;
    const on = !!spec && playing;
    if (on && spec) {
      const n = spec.frequencyBinCount;
      if (!bins || bins.length !== n) {
        bins = new Float32Array(n);
        planBands(spec.context.sampleRate, n);
      }
      spec.getFloatFrequencyData(bins);
    }
    const rise = 1 - Math.exp(-SPEC_RISE * dt);
    const fall = 1 - Math.exp(-SPEC_FALL * dt);
    specAge = on ? specAge + dt : 0;
    // The mean of the music heard so far, while that is the faster of the two,
    // so a band is read against a level it has actually had rather than against
    // the zero the average starts from.
    const drift = Math.max(1 - Math.exp(-SPEC_SLOW * dt), specAge > 0 ? dt / specAge : 1);
    const range = SPEC_CEIL - SPEC_FLOOR;
    let loud = 0;
    for (let b = 0; b < SPEC_BANDS; b++) {
      let want = 0;
      if (on && bins && edges && tilt) {
        const lo = edges[b] ?? 0;
        const hi = edges[b + 1] ?? lo;
        let db = -Infinity;
        for (let i = lo; i < hi; i++) db = Math.max(db, bins[i] ?? -Infinity);
        want = Math.min(Math.max((db + (tilt[b] ?? 0) - SPEC_FLOOR) / range, 0), 1);
      }
      const was = bands[b] ?? 0;
      const now = was + (want - was) * (want > was ? rise : fall);
      bands[b] = now;

      // Read against the average as it was before this frame moved it, or a
      // band would be compared with a figure it has already been folded into.
      //
      // Pinned to the band on the frames either side of the music, though: a
      // pause is the app stopping rather than the music getting quieter, and a
      // start is not every band swelling at once.
      const avg = on && specAge > dt ? (slow[b] ?? 0) : now;
      slow[b] = avg + (now - avg) * drift;
      pack[b * 2] = now;
      // Compressed rather than clipped, so a loud change keeps the shape of the
      // spectrum instead of flattening every band onto one ceiling.
      pack[b * 2 + 1] = mode === 'flux' ? Math.tanh((now - avg) * SPEC_FLUX) : now;

      if (now > loud) loud = now;
    }
    const live = loud > SPEC_QUIET;
    if ((live || specLive) && specTex) {
      // On its own unit, so the upload cannot leave a binding somewhere a later
      // pass would read.
      gl!.activeTexture(gl!.TEXTURE0 + SPEC_UNIT);
      gl!.bindTexture(gl!.TEXTURE_2D, specTex);
      gl!.texSubImage2D(gl!.TEXTURE_2D, 0, 0, 0, SPEC_BANDS, 1, gl!.RG, gl!.FLOAT, pack);
    }
    specLive = live;
    return live;
  }

  let pointerOn = false;
  let pointerNear = false;
  let touchId = -1;
  let gasUntil = 0;
  let pointerX = 0;
  let pointerY = 0;
  let lastX = 0;
  let lastY = 0;
  let cursorVX = 0;
  let cursorVY = 0;
  let tapOn = false;
  let tapX = 0;
  let tapY = 0;
  let tapAt = 0;
  let strokeFromX = 0;
  let strokeFromY = 0;
  let strokeToX = 0;
  let strokeToY = 0;

  function onPointer(e: PointerEvent): void {
    if (!playing) return;
    const x = e.clientX;
    const y = e.clientY;
    const r = BLOB_SLOW + TEAR_AWAY * 2;
    pointerNear = Math.abs(y - barY) <= r && x >= barX0 - r && x <= barX1 + r;
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

  function onTouchDown(e: PointerEvent): void {
    if (!playing) return;
    if ((e.target as Element | null)?.closest(keep)) return;

    tapOn = Math.abs(e.clientY - barY) <= TAP_REACH
      && e.clientX >= barX0 && e.clientX <= barX1;
    tapX = e.clientX;
    tapY = e.clientY;
    tapAt = performance.now();

    if (e.pointerType === 'mouse') return;
    touchId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    pointerX = e.clientX;
    pointerY = e.clientY;
    pointerNear = true;
    pointerOn = true;
    wake(SETTLE_MS);
  }

  function onTouchUp(e: PointerEvent): void {
    if (tapOn) {
      const slip = Math.hypot(e.clientX - tapX, e.clientY - tapY);
      tapOn = false;
      // Cancelled counts as lifted for the arming, and as nothing for the tap.
      if (e.type === 'pointerup' && slip <= TAP_SLIP
        && performance.now() - tapAt <= TAP_HOLD) {
        opts.onTap?.();
      }
    }
    if (e.pointerType === 'mouse' || e.pointerId !== touchId) return;
    touchId = -1;
    onPointerGone();
  }

  function onTouchDrag(e: TouchEvent): void {
    if (touchId >= 0) e.preventDefault();
  }

  let raf = 0;
  let idleAt = 0;
  let busyUntil = 0;
  let last = 0;
  let simTime = 0;
  let pumpAt = 0;

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
      if (pointerNear && speed > HEAT_SLOW) gasUntil = performance.now() + GAS_MS;
    } else {
      cursorVX = 0;
      cursorVY = 0;
    }
    strokeFromX = pointerX - dx;
    strokeFromY = pointerY - dy;
    strokeToX = pointerX;
    strokeToY = pointerY;
    lastX = pointerX;
    lastY = pointerY;

    /**
     * Music holds the field awake on its own. Nothing else does — the frame
     * loop drops to a 90 ms tick the moment the cursor and the last cut are
     * done with it, and a bar that only redraws nine times a second is not
     * showing anybody a spectrum. That tick is also what brings it back: it
     * keeps sampling, so a record starting is felt within one of them.
     */
    if (readSpectrum(dt)) busyUntil = Math.max(busyUntil, ts + SPEC_MS);
    // Asked rather than left to the wake the cloud arms for itself, because a
    // compile can outlast that wake and the title would stop mid-throw.
    if (cloud?.busy()) busyUntil = Math.max(busyUntil, ts + 120);

    if (dt > 0) {
      stepFluid(dt);
      const n = Math.max(1, Math.min(SUB_MAX, Math.ceil(dt / SUB)));
      for (let s = 0; s < n; s++) stepParticles(dt / n);
    }

    draw();
    if (ts < busyUntil) {
      raf = requestAnimationFrame(frame);
    } else {
      // Cleared, and it has to be: `wake` and `idleTick` both take a set `raf`
      // to mean a frame is already coming, and the one left here has already
      // been and gone. Held, the field could not be started again by anything
      // short of the tab being hidden and shown — a resize while nothing was
      // playing left the title's points wherever the last frame had put them.
      raf = 0;
      armIdle();
    }
  }

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

  /**
   * The ceiling, from the two things that decide it: what the screen can show
   * and what the listener asked for. Both changes arrive here — a window
   * dragged to another monitor and a switch thrown in the settings — so there
   * is one path to the buffer's format and one to the shader.
   */
  function applyHdr(): void {
    const on = !!hdrRange?.matches && hdrWanted;
    if (on === (headroom > 1)) return;
    headroom = on ? HEADROOM : 1;
    extendRange(on);
    sizeBuffer(canvas.width, canvas.height);
    draw();
  }

  function onLost(e: Event): void {
    e.preventDefault();
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    opts.onLost?.();
  }

  applyHdr();
  document.body.appendChild(canvas);
  try {
    resize();
  } catch (err) {
    canvas.remove();
    console.warn('glow-field: would not start', err);
    return null;
  }
  /**
   * Failing here costs the title its particles and nothing else — the page
   * keeps painting its own text, and the bar carries on.
   */
  try {
    cloud = mountTitleCloud({
      gl, link: (vs, fs) => link(gl!, vs, fs), locate, u, bindTex, pass, wake,
      acc: () => acc?.fbo ?? null,
    });
  } catch (err) {
    console.warn('glow-field: the title keeps its own pixels', err);
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
  hdrRange?.addEventListener('change', applyHdr);

  function readCensus(): GlowCensus | null {
    if (!gl || !whole) return null;
    gl.bindFramebuffer(gl.FRAMEBUFFER, whole.fbo);
    const type = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE) as number;
    const raw = type === gl.HALF_FLOAT
      ? new Uint16Array(COLS * 4)
      : new Float32Array(COLS * 4);
    gl.readPixels(0, 0, COLS, 1, gl.RGBA, type, raw as unknown as ArrayBufferView);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (gl.getError() !== gl.NO_ERROR) return null;
    const line = new Float32Array(COLS);
    const ready = new Float32Array(COLS);
    const age = new Float32Array(COLS);
    for (let x = 0; x < COLS; x++) {
      line[x] = half(raw, x * 4, type === gl.HALF_FLOAT);
      ready[x] = half(raw, x * 4 + 1, type === gl.HALF_FLOAT);
      age[x] = half(raw, x * 4 + 2, type === gl.HALF_FLOAT);
    }
    return { line, ready, age };
  }

  return {
    setKey(nextHue: number, nextHue2: number): void {
      fromHue = hue;
      fromHue2 = hue2;
      toHue = nextHue;
      toHue2 = nextHue2;
      keyAt = performance.now();
      wake(KEY_MS + 60);
    },
    census(): GlowCensus | null {
      return readCensus();
    },
    title(): TitleCloud | null {
      return cloud;
    },
    hdrReady(): boolean {
      return !!hdrRange?.matches;
    },
    setHdr(on: boolean): void {
      hdrWanted = on;
      applyHdr();
    },
    pump(ms: number): void {
      pumpAt = (pumpAt || performance.now()) + ms;
      frame(pumpAt);
    },
    setSpectrumMode(next: SpectrumMode): void {
      if (next === mode) return;
      // No reset: the averages a switch to `flux` reads against have been kept
      // up to date all along, whichever mode was being drawn.
      mode = next;
      wake(SPEC_MS);
    },
    setPlaying(next: boolean): void {
      if (next === playing) return;
      playing = next;
      if (playing) {
        emitAt = performance.now() / 1000;
      } else {
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
      hdrRange?.removeEventListener('change', applyHdr);
      if (raf) cancelAnimationFrame(raf);
      if (idleAt) clearTimeout(idleAt);
      idleAt = 0;
      canvas.remove();
      drop(acc);
      drop(divT);
      drop(whole);
      if (specTex) gl!.deleteTexture(specTex);
      if (gaps) for (const g of gaps) drop(g);
      if (vels) for (const v of vels) drop(v);
      if (prss) for (const p of prss) drop(p);
      if (pools) for (const p of pools) dropPool(p);
      cloud?.destroy();
      cloud = null;
    },
  };
}
