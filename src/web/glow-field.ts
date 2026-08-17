export interface GlowCensus {
  line: Float32Array;
  ready: Float32Array;
  age: Float32Array;
}

export interface GlowField {
  setKey(hue: number, hue2: number): void;
  setPlaying(playing: boolean): void;
  census(): GlowCensus | null;
  pump(ms: number): void;
  destroy(): void;
}

export interface GlowFieldOptions {
  onLost?: () => void;
  playing?: boolean;
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

const HEADROOM = 1.8;

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
const HALO_SHED = 0.45;
const HALO_GONE = 0.2;
const HALO_DRIFT = 1.3;
const BLAST = 6;
const LOOSE_GRIP = 4;
const HALO_IN = 0.18;
const HALO_OUT = 0.35;
const EMIT_RATE = 1.6;
const SWIRL_RATE = 1.1;
const CORE_ROWS = Math.ceil(W_CORE * STRANDS - 0.5);
const DAMP_BOUND = 7.5;
const DAMP_FREE = 0.8;
const BREAK = 8;
const BREAK_EDGE = 0.55;
const EDGE_BITE = 2.5;
const REACH = [2, 5, 9, 14];
const ISLAND = 0.5;
const RELINK = 2.5;
const RELINK_COOL = 0.85;
const COOL = 0.85;
const HEAT_SLOW = 520;
const HEAT_FAST = 1900;

const TEAR_AWAY = 58;
const HEAL_WAIT = 0.22;
const KNIFE = 0.2;
const HEAL_V = 350;
const HEAL_HEAT = 0.8;
const BEND_KEEP = 0.9;
const END_ALONE = 0.4;
const LEAP = 8;
const LIMB = 0.25;
const SHED_SHARE = 0.34;
const SHED_LIFE = 1.2;
const FREE_LIFE = 0.18;
const WHOLE = 0.75;
const FREE_HOLD = 0.3;
const RISE_V = 40;
const SWIRL_V = 46;
const SWIRL_WAVES = 4;
const SWIRL_LONG = 190;
const SWIRL_CHURN = 55;

const SETTLE_MS = 5400;
const IDLE_MS = 90;
const AIR_MS = 1200;
const GAS_MS = (SHED_LIFE + GROW + HALO_LIFE) * 1000;
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
#define HALO_GONE ${HALO_GONE.toFixed(3)}
#define HALO_DRIFT ${HALO_DRIFT.toFixed(3)}

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

float gasLifeOf(int y) {
  return keptStrand(y) ? FREE_LIFE : SHED_LIFE * (0.6 + 0.8 * rnd(uint(y), 75u));
}

float haloLifeOf(uint i) {
  return HALO_LIFE * (0.6 + 0.8 * rnd(i, 61u));
}

float flungLifeOf(uint i) {
  return (rnd(i, 66u) < HALO_SHED ? HALO_DRIFT : HALO_GONE) * (0.6 + 0.8 * rnd(i, 67u));
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
#define HEAL_WAIT ${HEAL_WAIT.toFixed(3)}

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
    } else if (s.w > HEAL_WAIT) {
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
#define WHOLE ${WHOLE.toFixed(3)}

uniform sampler2D uWhole;

out vec2 oGap;

void main() {
  float l = float(COLS);
  float r = float(COLS);
  for (int x = 0; x < COLS; x++) {
    if (texelFetch(uWhole, ivec2(x, 0), 0).x > WHOLE) {
      l = min(l, float(x));
      r = min(r, float(COLS - 1 - x));
    }
  }
  oGap = vec2(l, r);
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
#define RELINK ${RELINK.toFixed(3)}
#define RELINK_COOL ${RELINK_COOL.toFixed(3)}
#define COOL ${COOL.toFixed(3)}
#define HEAT_SLOW ${HEAT_SLOW.toFixed(1)}
#define HEAT_FAST ${HEAT_FAST.toFixed(1)}
#define BLOB ${BLOB.toFixed(1)}
#define TEAR_AWAY ${TEAR_AWAY.toFixed(1)}
#define HEAL_WAIT ${HEAL_WAIT.toFixed(3)}
#define HEAL_V ${HEAL_V.toFixed(2)}
#define HEAL_HEAT ${HEAL_HEAT.toFixed(3)}
#define BEND_KEEP ${BEND_KEEP.toFixed(3)}
#define END_ALONE ${END_ALONE.toFixed(3)}
#define LEAP ${LEAP}
#define LIMB ${LIMB.toFixed(3)}
#define KNIFE ${KNIFE.toFixed(3)}
#define GROW ${GROW.toFixed(3)}
#define RISE_V ${RISE_V.toFixed(2)}
#define SWIRL_V ${SWIRL_V.toFixed(2)}
#define SWIRL_WAVES ${SWIRL_WAVES}
#define SWIRL_LONG ${SWIRL_LONG.toFixed(1)}
#define SWIRL_CHURN ${SWIRL_CHURN.toFixed(1)}

uniform sampler2D uPos;
uniform sampler2D uSt;
uniform sampler2D uVel;

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

vec2 grewFrom(int x, float knit) {
  vec2 gap = texelFetch(uGap, ivec2(0, 0), 0).xy;
  float alone = float(COLS) * END_ALONE;
  bool endL = gap.x > alone;
  bool endR = gap.y > alone;
  bool doneL = false;
  bool doneR = false;
  for (int d = 1; d <= LEAP; d++) {
    int l = x - d;
    int r = x + d;
    if (!doneL && (l >= 0 || endL)) {
      vec2 c = colAt(l);
      if (c.x > WHOLE) {
        doneL = true;
        if (c.y >= float(d) * knit && anchored(l)) {
          return vec2(float(-d), c.y - float(d) * knit);
        }
      }
    }
    if (!doneR && (r <= COLS - 1 || endR)) {
      vec2 c = colAt(r);
      if (c.x > WHOLE) {
        doneR = true;
        if (c.y >= float(d) * knit && anchored(r)) {
          return vec2(float(d), c.y - float(d) * knit);
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

    float span = loose ? flungLifeOf(i) : life;
    bool back = sst.w == 0.0;
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

    if (!loose && !back) {
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

  float free = torn > 0.0 ? 1.0 : 0.0;

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
    float d = segDist(p) / BLOB;
    heat = max(heat, exp(-d * d) * gate);
  }

  float edge = clamp(abs(home.y - uBar.z) / (BAR_H * 0.5), 0.0, 1.0);
  float brk = BREAK * uRest * mix(1.0, BREAK_EDGE, edge);

  if (free < 0.5 && c.x < COLS - 1) {
    if (linkN > 0.5 && lenN > brk) {
      linkN = 0.0;
    } else if (linkN < 0.5 && lenN < RELINK * uRest && heat < RELINK_COOL && tornN == 0.0) {
      linkN = 1.0;
    }
  }

  heat *= exp(-COOL * uDt);
  age = min(age + uDt, 2.0);

  bool tied = (c.x < COLS - 1 && linkN > 0.5) || (c.x > 0 && linkP > 0.5);

  bool fresh = age < LIMB;

  vec2 col = texelFetch(uWhole, ivec2(c.x, 0), 0).xy;
  if (free < 0.5) {
    bool shred = col.x <= WHOLE;
    bool island = max(reach(c.x, -1), reach(c.x, 1)) < ISLAND;

    if (hm > TEAR_AWAY || shred || island || (!tied && !fresh)) {
      torn = 1e-3;
      linkN = 0.0;
    }
  } else {
    torn += uDt;
  }

  float gasLife = gasLifeOf(c.y);
  bool due = torn > max(HEAL_WAIT, gasLife);
  float knit = uRest / HEAL_V;
  vec2 grew = due ? grewFrom(c.x, knit) : vec2(0.0);
  int from = int(grew.x);
  bool rooted = from != 0;
  bool ready = col.y > 0.999;

  int at = c.x + from;
  bool over = at < 0 || at > COLS - 1;
  ivec2 face = ivec2(clamp(at, 0, COLS - 1), c.y);
  vec4 sF = texelFetch(uSt, face, 0);
  bool held = rooted && !over && sF.w == 0.0;
  bool edged = rooted && over;

  float blade = segDist(home) / BLOB;
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
    float cap = TEAR_AWAY * BEND_KEEP;
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
#define FREE_HOLD ${FREE_HOLD.toFixed(3)}
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
  float fade;
  if (pop == 0) {

    float gasLife = gasLifeOf(c.y);
    fade = smoothstep(0.0, 1.0, clamp(S.z / GROW, 0.0, 1.0))
      * (1.0 - smoothstep(gasLife * FREE_HOLD, gasLife, S.w));

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

      float gone = flungLifeOf(i);
      fade = 1.0 - smoothstep(gone * HALO_OUT, gone, age);
    } else {

      vec4 sst = texelFetch(uSt, ivec2(c.x, int(rnd(i, 62u) * float(CORE_ROWS))), 0);
      fade = smoothstep(0.0, life * HALO_IN, age)
        * (1.0 - smoothstep(life * HALO_OUT, life, age))
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
uniform float uPeak;
out vec4 oColor;
void main() {
  vec3 acc = texelFetch(uAcc, ivec2(gl_FragCoord.xy), 0).rgb;
  float peak = max(acc.r, max(acc.g, acc.b));
  float cover = 1.0 - exp(-peak);
  float lit = uPeak * (1.0 - exp(-peak / uPeak));
  oColor = vec4(acc * (lit / max(peak, 1e-4)), cover);
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
  let gapT: Target | undefined;
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
      locate(gapProg, ['uWhole']);
      locate(simProg, ['uPos', 'uSt', 'uVel', 'uWhole', 'uGap', 'uGrid', 'uDt', 'uTime', 'uRest',
        'uInit', 'uEmit', 'uBar', 'uFrom', 'uTo', 'uCursorV', 'uCursorOn']);
      locate(drawProg, ['uPos', 'uSt', 'uView', 'uHue', 'uDpr', 'uBar']);
      locate(resolveProg, ['uAcc', 'uPeak']);
      pools = [makePool(), makePool()];
      whole = makeTarget(gl!.RGBA16F, COLS, 2);
      gapT = makeTarget(gl!.RG16F, 1, 1);
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
    if (!simProg || !censusProg || !gapProg || !pools || !whole || !gapT || !vels) return;
    const [gx, gy] = span();
    const rest = Math.max(barX1 - barX0, 1) / COLS;

    if (!init) {
      pass(censusProg, whole.fbo, COLS, 2);
      bindTex(censusProg, 'uSt', 0, pools[front].st);
      bindTex(censusProg, 'uPos', 1, pools[front].pos);
      gl!.uniform3f(u(censusProg, 'uBar'), barX0, barX1, barY);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);

      pass(gapProg, gapT.fbo, 1, 1);
      bindTex(gapProg, 'uWhole', 0, whole.tex);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }

    const back = front === 0 ? 1 : 0;
    pass(simProg, pools[back].fbo, COLS, STRANDS);
    bindTex(simProg, 'uPos', 0, pools[front].pos);
    bindTex(simProg, 'uSt', 1, pools[front].st);
    bindTex(simProg, 'uVel', 2, vels[velFront].tex);
    bindTex(simProg, 'uWhole', 3, whole.tex);
    bindTex(simProg, 'uGap', 4, gapT.tex);
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
    gl!.uniform1f(u(resolveProg, 'uPeak'), headroom);
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

  function onTouchUp(e: PointerEvent): void {
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

    if (dt > 0) {
      stepFluid(dt);
      const n = Math.max(1, Math.min(SUB_MAX, Math.ceil(dt / SUB)));
      for (let s = 0; s < n; s++) stepParticles(dt / n);
    }

    draw();
    if (ts < busyUntil) raf = requestAnimationFrame(frame);
    else armIdle();
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

  function onRange(): void {
    const on = !!hdrRange?.matches;
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

  onRange();
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
  hdrRange?.addEventListener('change', onRange);

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
    pump(ms: number): void {
      pumpAt = (pumpAt || performance.now()) + ms;
      frame(pumpAt);
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
      hdrRange?.removeEventListener('change', onRange);
      if (raf) cancelAnimationFrame(raf);
      if (idleAt) clearTimeout(idleAt);
      idleAt = 0;
      canvas.remove();
      drop(acc);
      drop(divT);
      drop(whole);
      drop(gapT);
      if (vels) for (const v of vels) drop(v);
      if (prss) for (const p of prss) drop(p);
      if (pools) for (const p of pools) dropPool(p);
    },
  };
}
