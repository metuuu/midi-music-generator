export interface GlowField {
  setKey(hue: number, hue2: number): void;
  destroy(): void;
}

interface Target {
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
}

interface Pool {
  pos: WebGLTexture;
  life: WebGLTexture;
  fbo: WebGLFramebuffer;
}

export interface GlowFieldOptions {
  onLost?: () => void;
}

const BAR_H = 5;
const RIM_SIGMA = 3.2;
const BLOOM_SIGMA = 9;

const W_CORE = 0.72;
const W_RIM = 0.2;

const SPRITE_CORE = 1.6;
const SPRITE_RIM = 4.5;
const SPRITE_BLOOM = 11;
const ALPHA_CORE = 0.075;
const ALPHA_RIM = 0.01;
const ALPHA_BLOOM = 0.003;

const MASS_CORE = 1;
const MASS_RIM = 0.7;
const MASS_BLOOM = 0.45;

const K_HOME = 340;
const DAMP = 7;
const FOLLOW_RIM = 0.94;
const FOLLOW_BLOOM = 0.82;

const PUSH_R = 52;
const PUSH_FLAT = 0.25;
const PUSH = 2400;
const COUPLE = 36;
const COUPLE_SPREAD = 1.5;
const CURSOR_MAX = 4000;

const ESCAPE_SPEED = 1100;
const ESCAPE_SPREAD = 1.2;
const FLING_FAN = 1;
const FLING_SPREAD = 0.75;
const FREE_DRAG = 1.6;
const FREE_CURL = 1.4;
const FREE_LIFE = 1.1;
const FREE_SPREAD = 0.8;
const WAIT_MAX = 0.45;
const SPAWN_R = 26;
const SPAWN_PULL = 0.2;
const GROW = 0.6;

const STR_N = 192;
const WAVE_BARS = 1;
const WAVE_TENSION = (WAVE_BARS * STR_N) ** 2;
const WAVE_STIFF = 80;
const WAVE_DAMP = 2.4;
const WAVE_CONTACT = 600;
const WAVE_DRAG = 3.5;
const WAVE_LONG = 0.35;
const WAVE_SUB = 1 / 720;

const SETTLE_MS = 3800;
const KEY_MS = 1800;

const MAX_DT = 1 / 30;

const SUBSTEP = 1 / 180;
const SUBSTEP_SPAN = 0.3;
const SUBSTEP_MAX = 10;

const PRELUDE = (side: number): string => `
precision highp int;

#define SIDE ${side}
#define BAR_H ${BAR_H.toFixed(1)}
#define RIM_SIGMA ${RIM_SIGMA.toFixed(2)}
#define BLOOM_SIGMA ${BLOOM_SIGMA.toFixed(2)}
#define W_CORE ${W_CORE.toFixed(3)}
#define W_RIM ${W_RIM.toFixed(3)}
#define MASS_CORE ${MASS_CORE.toFixed(3)}
#define MASS_RIM ${MASS_RIM.toFixed(3)}
#define MASS_BLOOM ${MASS_BLOOM.toFixed(3)}
#define FREE_LIFE ${FREE_LIFE.toFixed(3)}
#define FREE_SPREAD ${FREE_SPREAD.toFixed(3)}
#define GROW ${GROW.toFixed(3)}

uniform vec3 uBar;
uniform float uScale;

uint hashU(uint x) {
  x ^= x >> 16; x *= 0x7feb352du;
  x ^= x >> 15; x *= 0x846ca68bu;
  x ^= x >> 16; return x;
}
float rnd(uint i, uint k) {
  return float(hashU(i * 9781u + k) & 0xffffffu) / 16777216.0;
}
float gauss(float u1, float u2) {
  return sqrt(-2.0 * log(max(u1, 1e-6))) * cos(6.28318530718 * u2);
}

float massOf(int pop) {
  return pop == 0 ? MASS_CORE : (pop == 1 ? MASS_RIM : MASS_BLOOM);
}

float freeLifeOf(uint i) {
  return FREE_LIFE * (1.0 - FREE_SPREAD * 0.5 + FREE_SPREAD * rnd(i, 32u));
}

float fadeOf(float phase, float age, uint i) {
  if (phase > 1.5) return 0.0;
  if (phase > 0.5) {
    float f = max(0.0, 1.0 - age / freeLifeOf(i));
    return f * f;
  }
  return smoothstep(0.0, 1.0, clamp(age / GROW, 0.0, 1.0));
}

vec2 homeOf(ivec2 c, out float t, out int pop) {
  uint i = uint(c.y) * uint(SIDE) + uint(c.x);
  float which = rnd(i, 4u);
  float off, along;
  if (which < W_CORE) {
    pop = 0;
    off = (rnd(i, 2u) - 0.5) * BAR_H * uScale;
    along = 0.0;
  } else {
    pop = which < W_CORE + W_RIM ? 1 : 2;
    float sg = (pop == 1 ? RIM_SIGMA : BLOOM_SIGMA) * uScale;
    off = gauss(rnd(i, 2u), rnd(i, 3u)) * sg;
    along = gauss(rnd(i, 8u), rnd(i, 9u)) * sg;
  }

  float r = BAR_H * 0.5 * uScale;
  float cap = r - sqrt(max(r * r - min(abs(off), r) * min(abs(off), r), 0.0));
  float u = (float(c.x) + rnd(i, 13u)) / float(SIDE);
  float x = mix(uBar.x + cap, uBar.y - cap, u) + along;
  t = clamp((x - uBar.x) / max(uBar.y - uBar.x, 1.0), 0.0, 1.0);
  return vec2(x, uBar.z + off);
}
`;

const QUAD_VS = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const WAVE_FS = `#version 300 es
precision highp float;
precision highp int;

#define N ${STR_N}
#define TENSION ${WAVE_TENSION.toFixed(1)}
#define STIFF ${WAVE_STIFF.toFixed(2)}
#define WDAMP ${WAVE_DAMP.toFixed(3)}
#define CONTACT ${WAVE_CONTACT.toFixed(2)}
#define WDRAG ${WAVE_DRAG.toFixed(3)}
#define LONG ${WAVE_LONG.toFixed(3)}
#define PUSH_R ${PUSH_R.toFixed(1)}

uniform sampler2D uStr;
uniform vec3 uBar;
uniform float uScale;
uniform float uDt;
uniform vec2 uCursor;
uniform vec2 uCursorV;
uniform float uCursorOn;

out vec4 oStr;

vec2 nodeAt(int i) {
  return texelFetch(uStr, ivec2(i, 0), 0).xy;
}

void main() {
  int i = int(gl_FragCoord.x);
  if (i == 0 || i == N - 1) { oStr = vec4(0.0); return; }

  vec4 s = texelFetch(uStr, ivec2(i, 0), 0);
  vec2 d = s.xy, v = s.zw;

  vec2 lap = nodeAt(i - 1) + nodeAt(i + 1) - 2.0 * d;
  vec2 acc = lap * TENSION - d * STIFF - v * WDAMP;

  if (uCursorOn > 0.5) {
    float u = float(i) / float(N - 1);
    vec2 home = vec2(mix(uBar.x, uBar.y, u), uBar.z);
    vec2 away = home + d - uCursor;
    float dm = length(away);
    float r = PUSH_R * uScale;
    if (dm < r) {
      vec2 dir = dm > 1e-4 ? away / dm : vec2(0.0, 1.0);
      dir.x *= LONG;
      float w = 1.0 - dm / r;
      acc += dir * (CONTACT * (r - dm));
      acc += (uCursorV - v) * (WDRAG * w);
    }
  }

  v += acc * uDt;
  d += v * uDt;
  if (!(dot(d, d) < 1e12)) { d = vec2(0.0); v = vec2(0.0); }
  oStr = vec4(d, v);
}`;

const SIM_FS = (side: number): string => `#version 300 es
precision highp float;
${PRELUDE(side)}
#define K_HOME ${K_HOME.toFixed(1)}
#define DAMP ${DAMP.toFixed(2)}
#define FOLLOW_RIM ${FOLLOW_RIM.toFixed(3)}
#define FOLLOW_BLOOM ${FOLLOW_BLOOM.toFixed(3)}
#define PUSH_R ${PUSH_R.toFixed(1)}
#define PUSH_FLAT ${PUSH_FLAT.toFixed(3)}
#define PUSH ${PUSH.toFixed(1)}
#define COUPLE ${COUPLE.toFixed(2)}
#define COUPLE_SPREAD ${COUPLE_SPREAD.toFixed(3)}
#define ESCAPE_SPEED ${ESCAPE_SPEED.toFixed(1)}
#define ESCAPE_SPREAD ${ESCAPE_SPREAD.toFixed(3)}
#define FLING_FAN ${FLING_FAN.toFixed(3)}
#define FLING_SPREAD ${FLING_SPREAD.toFixed(3)}
#define FREE_DRAG ${FREE_DRAG.toFixed(3)}
#define FREE_CURL ${FREE_CURL.toFixed(3)}
#define WAIT_MAX ${WAIT_MAX.toFixed(3)}
#define SPAWN_R ${SPAWN_R.toFixed(1)}
#define SPAWN_PULL ${SPAWN_PULL.toFixed(3)}
#define STR_N ${STR_N}

uniform sampler2D uPos;
uniform sampler2D uLife;
uniform sampler2D uStr;
uniform vec2 uField;
uniform float uDt;
uniform float uInit;
uniform vec2 uCursor;
uniform vec2 uCursorV;
uniform float uCursorOn;

layout(location = 0) out vec4 oPos;
layout(location = 1) out vec4 oLife;

vec4 bendAt(float t) {
  float f = t * float(STR_N - 1);
  int i0 = clamp(int(floor(f)), 0, STR_N - 1);
  int i1 = min(i0 + 1, STR_N - 1);
  vec4 a = texelFetch(uStr, ivec2(i0, 0), 0);
  vec4 b = texelFetch(uStr, ivec2(i1, 0), 0);
  return mix(a, b, f - float(i0));
}

bool outside(vec2 p) {
  float m = 80.0 * uScale;
  return p.x < -m || p.y < -m || p.x > uField.x + m || p.y > uField.y + m;
}

void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  uint i = uint(c.y) * uint(SIDE) + uint(c.x);
  float t;
  int pop;
  vec2 rest = homeOf(c, t, pop);
  float follow = pop == 0 ? 1.0 : (pop == 1 ? FOLLOW_RIM : FOLLOW_BLOOM);
  vec4 bend = bendAt(t);
  vec2 home = rest + bend.xy * follow;
  vec2 homeV = bend.zw * follow;

  if (uInit > 0.5) {
    oPos = vec4(home, 0.0, 0.0);
    oLife = vec4(0.0, 4.0, 0.0, 0.0);
    return;
  }

  vec4 s = texelFetch(uPos, c, 0);
  vec2 p = s.xy, v = s.zw;
  vec2 st = texelFetch(uLife, c, 0).xy;
  float phase = st.x, age = st.y;
  float mass = massOf(pop);

  if (phase > 1.5) {
    age += uDt;
    if (age < 0.0) {
      oPos = vec4(home, 0.0, 0.0);
      oLife = vec4(2.0, age, 0.0, 0.0);
      return;
    }
    ivec2 hop = ivec2(1 + int(rnd(i, 34u) * 2.0), 1 + int(rnd(i, 35u) * 2.0));
    if (rnd(i, 36u) < 0.5) hop.x = -hop.x;
    if (rnd(i, 37u) < 0.5) hop.y = -hop.y;
    ivec2 nc = clamp(c + hop, ivec2(0), ivec2(SIDE - 1));
    vec2 np = texelFetch(uPos, nc, 0).xy;
    bool near = texelFetch(uLife, nc, 0).x < 0.5
      && distance(np, home) < SPAWN_R * uScale;
    oPos = vec4(near ? mix(np, home, SPAWN_PULL) : home, 0.0, 0.0);
    oLife = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }

  if (phase > 0.5) {
    float sp = length(v);
    if (sp > 1e-4) {
      vec2 dir = v / sp;
      float curl = (rnd(i, 31u) - 0.5) * 2.0 * FREE_CURL;
      v += vec2(-dir.y, dir.x) * (curl * sp * uDt);
    }
    v *= exp(-FREE_DRAG * uDt / mass);
    p += v * uDt;
    age += uDt;
    if (age > freeLifeOf(i) || outside(p) || !(dot(p, p) < 1e12)) {
      oPos = vec4(home, 0.0, 0.0);
      oLife = vec4(2.0, -WAIT_MAX * rnd(i, 33u), 0.0, 0.0);
    } else {
      oPos = vec4(p, v);
      oLife = vec4(1.0, age, 0.0, 0.0);
    }
    return;
  }

  vec2 force = (home - p) * K_HOME;

  if (uCursorOn > 0.5) {
    vec2 away = p - uCursor;
    float dm = length(away);
    float r = PUSH_R * uScale;
    if (dm < r) {
      float w = 1.0 - smoothstep(PUSH_FLAT, 1.0, dm / r);
      if (dm > 1e-4) force += (away / dm) * (PUSH * uScale * w);
      float grip = 1.0 - COUPLE_SPREAD * 0.5 + COUPLE_SPREAD * rnd(i, 21u);
      force += (uCursorV - v) * (COUPLE * w * grip);
    }
  }

  v += (force / mass) * uDt;
  v *= exp(-DAMP * uDt / mass);
  p += v * uDt;
  age = min(age + uDt, 4.0);

  if (!(dot(p, p) < 1e12)) {
    oPos = vec4(home, 0.0, 0.0);
    oLife = vec4(0.0, 4.0, 0.0, 0.0);
    return;
  }

  float esc = ESCAPE_SPEED * uScale
    * (1.0 - ESCAPE_SPREAD * 0.5 + ESCAPE_SPREAD * rnd(i, 22u));
  vec2 rel = v - homeV;
  if (age >= GROW && length(rel) > esc && dot(rel, p - home) > 0.0) {
    float a = (rnd(i, 23u) - 0.5) * FLING_FAN;
    float ca = cos(a), sa = sin(a);
    float gain = 1.0 - FLING_SPREAD * 0.5 + FLING_SPREAD * rnd(i, 24u);
    oPos = vec4(p, mat2(ca, sa, -sa, ca) * v * gain);
    oLife = vec4(1.0, 0.0, 0.0, 0.0);
    return;
  }

  oPos = vec4(p, v);
  oLife = vec4(0.0, age, 0.0, 0.0);
}`;

const DRAW_VS = (side: number): string => `#version 300 es
precision highp float;
${PRELUDE(side)}
#define ALPHA_CORE ${ALPHA_CORE.toFixed(5)}
#define ALPHA_RIM ${ALPHA_RIM.toFixed(5)}
#define ALPHA_BLOOM ${ALPHA_BLOOM.toFixed(5)}
#define SPRITE_CORE ${SPRITE_CORE.toFixed(2)}
#define SPRITE_RIM ${SPRITE_RIM.toFixed(2)}
#define SPRITE_BLOOM ${SPRITE_BLOOM.toFixed(2)}

uniform sampler2D uPos;
uniform sampler2D uLife;
uniform vec2 uField;
uniform vec2 uHue;

out vec3 vColor;

vec3 hsl2rgb(float h, float s, float l) {
  h = fract(h / 360.0);
  vec3 k = mod(vec3(0.0, 8.0, 4.0) + h * 12.0, 12.0);
  return l - s * min(l, 1.0 - l) * clamp(min(k - 3.0, 9.0 - k), -1.0, 1.0);
}

void main() {
  ivec2 c = ivec2(gl_VertexID % SIDE, gl_VertexID / SIDE);
  float t;
  int pop;
  homeOf(c, t, pop);
  vec2 p = texelFetch(uPos, c, 0).xy;
  vec2 st = texelFetch(uLife, c, 0).xy;

  uint i = uint(c.y) * uint(SIDE) + uint(c.x);
  float fade = fadeOf(st.x, st.y, i);
  vec3 rgb = hsl2rgb(mix(uHue.x, uHue.y, t), 0.85, 0.56);
  float a = pop == 0 ? ALPHA_CORE : (pop == 1 ? ALPHA_RIM : ALPHA_BLOOM);
  if (pop == 0) a *= 0.7 + 0.6 * rnd(i, 15u);
  vColor = rgb * a * fade;

  float sprite = pop == 0 ? SPRITE_CORE : (pop == 1 ? SPRITE_RIM : SPRITE_BLOOM);
  gl_PointSize = sprite * uScale * (0.45 + 0.55 * fade);
  vec2 ndc = (p / uField) * 2.0 - 1.0;
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

  let side = 0;
  let count = 0;
  let simProg: WebGLProgram | undefined;
  let drawProg: WebGLProgram | undefined;
  let resolveProg: WebGLProgram | undefined;
  let waveProg: WebGLProgram | undefined;
  let simU: Record<string, WebGLUniformLocation | null> = {};
  let drawU: Record<string, WebGLUniformLocation | null> = {};
  let resolveU: Record<string, WebGLUniformLocation | null> = {};
  let waveU: Record<string, WebGLUniformLocation | null> = {};
  let pools: [Pool, Pool] | undefined;
  let front: 0 | 1 = 0;
  let strs: [Target, Target] | undefined;
  let strFront: 0 | 1 = 0;
  let acc: Target | undefined;
  let scale = 1;
  let barX0 = 0;
  let barX1 = 0;
  let barY = 0;

  const vao = gl.createVertexArray();

  function makeTex(format: number, w: number, h: number): WebGLTexture {
    const tex = gl!.createTexture();
    if (!tex) throw new Error('glow-field: no texture');
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.texStorage2D(gl!.TEXTURE_2D, 1, format, w, h);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.NEAREST);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.NEAREST);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    return tex;
  }

  function makeTarget(format: number, w: number, h: number): Target {
    const tex = makeTex(format, w, h);
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

  function makePool(n: number): Pool {
    const pos = makeTex(gl!.RGBA32F, n, n);
    const life = makeTex(gl!.RGBA16F, n, n);
    const fbo = gl!.createFramebuffer();
    if (!fbo) throw new Error('glow-field: no pool');
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, pos, 0);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT1, gl!.TEXTURE_2D, life, 0);
    gl!.drawBuffers([gl!.COLOR_ATTACHMENT0, gl!.COLOR_ATTACHMENT1]);
    if (gl!.checkFramebufferStatus(gl!.FRAMEBUFFER) !== gl!.FRAMEBUFFER_COMPLETE) {
      throw new Error('glow-field: float targets are not renderable here');
    }
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    return { pos, life, fbo };
  }

  function drop(t: Target | undefined): void {
    if (!t) return;
    gl!.deleteTexture(t.tex);
    gl!.deleteFramebuffer(t.fbo);
  }

  function dropPool(p: Pool | undefined): void {
    if (!p) return;
    gl!.deleteTexture(p.pos);
    gl!.deleteTexture(p.life);
    gl!.deleteFramebuffer(p.fbo);
  }

  function measureBar(): void {
    const r = host.getBoundingClientRect();
    barX0 = r.left * scale;
    barX1 = r.right * scale;
    barY = (r.top + r.height / 2) * scale;
  }

  function resize(): boolean {
    scale = Math.min(window.devicePixelRatio || 1, 2);
    const box = canvas.getBoundingClientRect();
    const w = Math.max(2, Math.round(box.width * scale));
    const h = Math.max(2, Math.round(box.height * scale));
    const wasX0 = barX0, wasX1 = barX1, wasY = barY;
    const sameSize = w === canvas.width && h === canvas.height && !!simProg;
    if (!sameSize) {
      canvas.width = w;
      canvas.height = h;
    }
    measureBar();
    if (sameSize && barX0 === wasX0 && barX1 === wasX1 && barY === wasY) return false;
    if (sameSize) return true;

    const barW = Math.max(1, barX1 - barX0);
    const next = Math.max(200, Math.min(420, Math.round(Math.sqrt(barW * 230))));
    if (next !== side || !simProg) {
      side = next;
      count = side * side;
      simProg = link(gl!, QUAD_VS, SIM_FS(side));
      drawProg = link(gl!, DRAW_VS(side), DRAW_FS);
      resolveProg ??= link(gl!, QUAD_VS, RESOLVE_FS);
      waveProg ??= link(gl!, QUAD_VS, WAVE_FS);
      simU = {};
      drawU = {};
      resolveU = {};
      waveU = {};
      for (const n of ['uPos', 'uLife', 'uStr', 'uBar', 'uScale', 'uField',
        'uDt', 'uInit', 'uCursor', 'uCursorV', 'uCursorOn']) {
        simU[n] = gl!.getUniformLocation(simProg, n);
      }
      for (const n of ['uPos', 'uLife', 'uBar', 'uScale', 'uField', 'uHue']) {
        drawU[n] = gl!.getUniformLocation(drawProg, n);
      }
      for (const n of ['uStr', 'uBar', 'uScale', 'uDt', 'uCursor', 'uCursorV', 'uCursorOn']) {
        waveU[n] = gl!.getUniformLocation(waveProg, n);
      }
      resolveU.uAcc = gl!.getUniformLocation(resolveProg, 'uAcc');
      if (pools) for (const p of pools) dropPool(p);
      pools = [makePool(side), makePool(side)];
      front = 0;
    }
    if (!strs) {
      strs = [makeTarget(gl!.RGBA32F, STR_N, 1), makeTarget(gl!.RGBA32F, STR_N, 1)];
      strFront = 0;
    }
    drop(acc);
    acc = makeTarget(gl!.RGBA16F, w, h);
    stepParticles(0, 0, 0, true);
    return true;
  }

  function bindShape(u: Record<string, WebGLUniformLocation | null>): void {
    gl!.uniform3f(u.uBar ?? null, barX0, barX1, barY);
    gl!.uniform1f(u.uScale ?? null, scale);
  }

  function stepWave(dt: number, cx: number, cy: number): void {
    if (!waveProg || !strs) return;
    const back = strFront === 0 ? 1 : 0;
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, strs[back].fbo);
    gl!.viewport(0, 0, STR_N, 1);
    gl!.disable(gl!.BLEND);
    gl!.useProgram(waveProg);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, strs[strFront].tex);
    gl!.uniform1i(waveU.uStr ?? null, 0);
    bindShape(waveU);
    gl!.uniform1f(waveU.uDt ?? null, dt);
    gl!.uniform2f(waveU.uCursor ?? null, cx, cy);
    gl!.uniform2f(waveU.uCursorV ?? null, cursorVX, cursorVY);
    gl!.uniform1f(waveU.uCursorOn ?? null, pointerOn ? 1 : 0);
    gl!.bindVertexArray(vao);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    strFront = back;
  }

  function stepParticles(dt: number, cx: number, cy: number, init = false): void {
    if (!simProg || !pools || !strs) return;
    const back = front === 0 ? 1 : 0;
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, pools[back].fbo);
    gl!.viewport(0, 0, side, side);
    gl!.disable(gl!.BLEND);
    gl!.useProgram(simProg);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, pools[front].pos);
    gl!.uniform1i(simU.uPos ?? null, 0);
    gl!.activeTexture(gl!.TEXTURE1);
    gl!.bindTexture(gl!.TEXTURE_2D, pools[front].life);
    gl!.uniform1i(simU.uLife ?? null, 1);
    gl!.activeTexture(gl!.TEXTURE2);
    gl!.bindTexture(gl!.TEXTURE_2D, strs[strFront].tex);
    gl!.uniform1i(simU.uStr ?? null, 2);
    bindShape(simU);
    gl!.uniform2f(simU.uField ?? null, canvas.width, canvas.height);
    gl!.uniform1f(simU.uDt ?? null, dt);
    gl!.uniform1f(simU.uInit ?? null, init ? 1 : 0);
    gl!.uniform2f(simU.uCursor ?? null, cx, cy);
    gl!.uniform2f(simU.uCursorV ?? null, cursorVX, cursorVY);
    gl!.uniform1f(simU.uCursorOn ?? null, !init && pointerOn ? 1 : 0);
    gl!.bindVertexArray(vao);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    front = back;
  }

  function draw(): void {
    if (!drawProg || !resolveProg || !pools || !acc) return;

    gl!.bindFramebuffer(gl!.FRAMEBUFFER, acc.fbo);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.ONE, gl!.ONE);
    gl!.useProgram(drawProg);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, pools[front].pos);
    gl!.uniform1i(drawU.uPos ?? null, 0);
    gl!.activeTexture(gl!.TEXTURE1);
    gl!.bindTexture(gl!.TEXTURE_2D, pools[front].life);
    gl!.uniform1i(drawU.uLife ?? null, 1);
    bindShape(drawU);
    gl!.uniform2f(drawU.uField ?? null, canvas.width, canvas.height);
    gl!.uniform2f(drawU.uHue ?? null, hue, hue2);
    gl!.bindVertexArray(vao);
    gl!.drawArrays(gl!.POINTS, 0, count);

    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.disable(gl!.BLEND);
    gl!.useProgram(resolveProg);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, acc.tex);
    gl!.uniform1i(resolveU.uAcc ?? null, 0);
    gl!.bindVertexArray(vao);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  let hue = 32;
  let hue2 = 8;
  let fromHue = 32;
  let fromHue2 = 8;
  let toHue = 32;
  let toHue2 = 8;
  let keyAt = -Infinity;

  let pointerOn = false;
  let pointerX = 0;
  let pointerY = 0;
  let lastX = 0;
  let lastY = 0;
  let cursorVX = 0;
  let cursorVY = 0;

  function onPointer(e: PointerEvent): void {
    const x = e.clientX * scale;
    const y = e.clientY * scale;
    const r = (PUSH_R + 60) * scale;
    const near = Math.abs(y - barY) <= r && x >= barX0 - r && x <= barX1 + r;
    if (!near) {
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
    wake(SETTLE_MS);
  }

  function onPointerGone(): void {
    if (!pointerOn) return;
    pointerOn = false;
    wake(SETTLE_MS);
  }

  let raf = 0;
  let busyUntil = 0;
  let last = 0;

  function frame(ts: number): void {
    raf = 0;
    const dt = Math.min(Math.max((ts - last) / 1000, 0), MAX_DT);
    last = ts;

    const k = ease(Math.min(Math.max((ts - keyAt) / KEY_MS, 0), 1));
    hue = fromHue + (toHue - fromHue) * k;
    hue2 = fromHue2 + (toHue2 - fromHue2) * k;

    let dx = pointerOn ? pointerX - lastX : 0;
    let dy = pointerOn ? pointerY - lastY : 0;
    if (dt > 0) {
      const capped = CURSOR_MAX * scale * dt;
      const moved = Math.hypot(dx, dy);
      if (moved > capped) {
        dx *= capped / moved;
        dy *= capped / moved;
      }
      cursorVX = dx / dt;
      cursorVY = dy / dt;
    } else {
      cursorVX = 0;
      cursorVY = 0;
    }
    const fromX = pointerX - dx;
    const fromY = pointerY - dy;
    lastX = pointerX;
    lastY = pointerY;

    const travel = Math.hypot(dx, dy);
    const n = Math.max(1, Math.min(SUBSTEP_MAX, Math.ceil(Math.max(
      dt / SUBSTEP,
      travel / (SUBSTEP_SPAN * PUSH_R * scale),
    ))));
    const h = dt / n;
    const m = Math.max(1, Math.ceil(h / WAVE_SUB));
    for (let s = 0; s < n; s++) {
      for (let q = 0; q < m; q++) {
        const a = (s + (q + 0.5) / m) / n;
        stepWave(h / m, fromX + dx * a, fromY + dy * a);
      }
      const a = (s + 0.5) / n;
      stepParticles(h, fromX + dx * a, fromY + dy * a);
    }

    draw();
    if (ts < busyUntil) raf = requestAnimationFrame(frame);
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

  const ro = new ResizeObserver(onResize);
  ro.observe(host);
  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onPointer, { passive: true });
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
    destroy(): void {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerleave', onPointerGone);
      window.removeEventListener('blur', onPointerGone);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      if (raf) cancelAnimationFrame(raf);
      canvas.remove();
      drop(acc);
      if (pools) for (const p of pools) dropPool(p);
      if (strs) for (const s of strs) drop(s);
    },
  };
}
