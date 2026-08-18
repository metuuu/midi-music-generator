/**
 * The title, as gas.
 *
 * A record changing is one title coming apart into particles, drifting, and the
 * next one condensing out of the same particles. It draws into the glow field's
 * own accumulation buffer rather than onto a canvas of its own — see
 * `mountTitleCloud` for why that is the whole design and not an optimisation.
 */

import type { TitleInk } from './title-ink.js';

/** Where the pool's points live, and how many there are. */
const POOL_W = 256;
const POOL_H = 128;
const POOL = POOL_W * POOL_H;

/**
 * The three parts of a changeover, in milliseconds.
 *
 * The first is `LINES_OUT_MS` in `web/radio.ts` and has to stay it: the genre
 * and era lines fade over exactly that, so a title coming apart faster or
 * slower than they leave reads as two things happening rather than one.
 */
export const CLOUD_OUT_MS = 190;
const CLOUD_FLOAT_MS = 230;
const CLOUD_IN_MS = 400;
export const CLOUD_MS = CLOUD_OUT_MS + CLOUD_FLOAT_MS + CLOUD_IN_MS;

const OUT_END = CLOUD_OUT_MS / CLOUD_MS;
const IN_START = (CLOUD_OUT_MS + CLOUD_FLOAT_MS) / CLOUD_MS;

/** How hard a shape holds its particles, and how hard the next one takes them. */
const K_HOLD = 900;
const K_CATCH = 780;
const DRAG_HELD = 54;
const DRAG_FREE = 1.4;
/** The puff that breaks the letters, and the drift of what it let go. */
const BURST = 900;
const WANDER = 190;
const RISE = 34;
const FLUID_GRIP = 2.6;
/** How much wider than the title box the loose gas is scattered. */
const SPREAD_X = 0.6;
const SPREAD_Y = 1.7;
/** Device pixels a sample grows by once it is gas. */
const GAS_GROW = 5.5;
/** How far the gas is allowed towards the record's key, and above white. */
const KEY_PULL = 0.8;
const GAS_HEADROOM = 1.7;

const HASH = `
uint hash(uint x) {
  x ^= x >> 16; x *= 0x7feb352du;
  x ^= x >> 15; x *= 0x846ca68bu;
  x ^= x >> 16;
  return x;
}
float rnd(uint i, uint salt) {
  return float(hash(i * 0x9e3779b9u + salt)) / 4294967296.0;
}`;

/**
 * The shared reading of where a particle is in the changeover.
 *
 * `hold` is what the old shape still has of it, `catchUp` what the new one has
 * taken, and `loose` the gap between them where it is nobody's and behaves like
 * gas. Both shaders need the identical three or the drawing disagrees with the
 * motion.
 */
const GRIPS = `
#define OUT_END ${OUT_END.toFixed(5)}
#define IN_START ${IN_START.toFixed(5)}

uniform float uPhase;

float holdAt(float ph) { return 1.0 - smoothstep(0.0, OUT_END, ph); }
float catchAt(float ph) { return smoothstep(IN_START, 1.0, ph); }
float looseAt(float ph) { return clamp(1.0 - holdAt(ph) - catchAt(ph), 0.0, 1.0); }`;

const SCATTER = `
#define SPREAD_X ${SPREAD_X.toFixed(3)}
#define SPREAD_Y ${SPREAD_Y.toFixed(3)}

uniform vec4 uBox;

/** Somewhere in the air around the title, for a particle with no shape to be in. */
vec2 scatterOf(uint i) {
  float a = rnd(i, 3u) * 6.28318530718;
  float r = sqrt(rnd(i, 7u));
  return uBox.xy + uBox.zw * 0.5
    + vec2(cos(a) * uBox.z * SPREAD_X, sin(a) * uBox.w * SPREAD_Y) * r;
}`;

const SIM_FS = `#version 300 es
precision highp float;
precision highp int;
${HASH}
${GRIPS}
${SCATTER}
#define POOL_W ${POOL_W}
#define K_HOLD ${K_HOLD.toFixed(1)}
#define K_CATCH ${K_CATCH.toFixed(1)}
#define DRAG_HELD ${DRAG_HELD.toFixed(2)}
#define DRAG_FREE ${DRAG_FREE.toFixed(3)}
#define BURST ${BURST.toFixed(1)}
#define WANDER ${WANDER.toFixed(1)}
#define RISE ${RISE.toFixed(1)}
#define FLUID_GRIP ${FLUID_GRIP.toFixed(3)}

uniform sampler2D uPos;
uniform sampler2D uAnchor;
uniform sampler2D uSt;
uniform sampler2D uVel;
uniform vec2 uGrid;
uniform float uDt;
uniform float uTime;
uniform float uPlace;

out vec4 oPos;

vec2 swirl(vec2 p, float t) {
  vec2 f = vec2(0.0);
  for (int n = 0; n < 3; n++) {
    float fn = float(n);
    float k = 6.28318530718 / (230.0 / (1.0 + fn * 0.9));
    float a = fn * 2.39996 + 0.7;
    vec2 d = vec2(cos(a), sin(a));
    f += vec2(-d.y, d.x) * sin(dot(p, d) * k + t * (0.7 + fn * 0.45)) / (1.0 + fn);
  }
  return f;
}

void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  uint i = uint(c.y * POOL_W + c.x);
  vec4 A = texelFetch(uAnchor, c, 0);
  vec4 S = texelFetch(uSt, c, 0);

  vec2 src = S.y > 0.5 ? A.xy : scatterOf(i);
  vec2 dst = S.z > 0.5 ? A.zw : scatterOf(i ^ 40503u);

  // A slot that was not in use before this record cannot be moved from where it
  // was; it has to be put somewhere first.
  if (float(i) >= uPlace) {
    oPos = vec4(src, 0.0, 0.0);
    return;
  }

  vec4 P = texelFetch(uPos, c, 0);
  vec2 p = P.xy;
  vec2 v = P.zw;

  float ph = clamp(uPhase, 0.0, 1.0);
  float hold = holdAt(ph);
  float grab = catchAt(ph);
  float loose = looseAt(ph);

  vec2 a = (src - p) * (K_HOLD * hold) + (dst - p) * (K_CATCH * grab);

  // Outwards from the middle of the title and a little of its own way, so the
  // words come apart rather than swelling.
  float kick = exp(-pow((ph - OUT_END * 0.55) / (OUT_END * 0.5 + 1e-4), 2.0));
  float ang = rnd(i, 11u) * 6.28318530718;
  vec2 away = normalize(src - (uBox.xy + uBox.zw * 0.5) + vec2(1e-3));
  a += (away * 0.5 + vec2(cos(ang), sin(ang))) * (BURST * kick);

  // Loose, it is gas: it rises, it wanders, and it goes where the cursor has
  // already pushed the fluid the bar is drawn in.
  vec2 fluid = texture(uVel, clamp(p / uGrid, vec2(0.0), vec2(1.0))).xy;
  a += (fluid - v) * (FLUID_GRIP * loose);
  a += swirl(p, uTime) * (WANDER * loose);
  a.y -= RISE * loose;

  v += a * uDt;
  v *= exp(-mix(DRAG_FREE, DRAG_HELD, max(hold, grab)) * uDt);
  oPos = vec4(p + v * uDt, v);
}`;

const DRAW_VS = `#version 300 es
precision highp float;
precision highp int;
${HASH}
${GRIPS}
${SCATTER}
#define POOL_W ${POOL_W}
#define GAS_GROW ${GAS_GROW.toFixed(2)}
#define KEY_PULL ${KEY_PULL.toFixed(3)}

uniform sampler2D uPos;
uniform sampler2D uSt;
uniform vec2 uView;
uniform vec2 uHue;
uniform vec3 uInk;
uniform float uStep;
uniform float uCeil;

out vec3 vColor;
out float vCov;
out float vSoft;
out float vCeil;

vec3 hsl2rgb(float h, float s, float l) {
  h = fract(h / 360.0);
  vec3 k = mod(vec3(0.0, 8.0, 4.0) + h * 12.0, 12.0);
  return l - s * min(l, 1.0 - l) * clamp(min(k - 3.0, 9.0 - k), -1.0, 1.0);
}

void main() {
  ivec2 c = ivec2(gl_VertexID % POOL_W, gl_VertexID / POOL_W);
  vec4 S = texelFetch(uSt, c, 0);
  if (S.w <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }

  float ph = clamp(uPhase, 0.0, 1.0);
  float loose = looseAt(ph);
  // Nothing to come from, so it arrives out of the air; nothing to go to, so it
  // is what is left over and goes out with the gas.
  float fade = (S.y > 0.5 ? 1.0 : smoothstep(0.0, IN_START, ph))
    * (S.z > 0.5 ? 1.0 : 1.0 - smoothstep(OUT_END, 1.0, ph));

  vec2 p = texelFetch(uPos, c, 0).xy;
  float t = clamp((p.x - uBox.x) / max(uBox.z, 1.0), 0.0, 1.0);
  vColor = mix(uInk, hsl2rgb(mix(uHue.x, uHue.y, t), 0.85, 0.62), loose * KEY_PULL);
  vCov = S.w * fade;
  vSoft = loose;
  // Above white only while it is gas. A page's title is page white by
  // definition, and a headline lit brighter than the words under it is a
  // notification, not a name.
  vCeil = mix(1.0, uCeil, loose);

  gl_PointSize = uStep + GAS_GROW * loose;
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
in vec3 vColor;
in float vCov;
in float vSoft;
in float vCeil;
out vec4 oColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float cov = vCov * mix(1.0, max(0.0, 1.0 - dot(d, d) * 4.0), vSoft);
  cov = clamp(cov, 0.0, 0.995);
  if (cov <= 0.0) discard;
  float peak = -log(1.0 - cov);
  vec3 c = vColor * peak;
  oColor = vec4(c, max(c.r, max(c.g, c.b)) * vCeil);
}`;

export interface TitleCloud {
  /** Begin a changeover from what is on the screen now. */
  leave(ink: TitleInk | null): void;
  /** Hand over what it is condensing into, once that exists to be measured. */
  arrive(ink: TitleInk | null): void;
  /** Whether there is anything to paint, which decides who owns the pixels. */
  live(): boolean;
  /** Whether a changeover is still running, so the field knows to stay awake. */
  busy(): boolean;
  step(dt: number, time: number, vel: WebGLTexture, gridW: number, gridH: number): void;
  draw(viewW: number, viewH: number, hue: number, hue2: number, ceil: number): void;
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
  locate(simProg, ['uPos', 'uAnchor', 'uSt', 'uVel', 'uGrid', 'uDt', 'uTime',
    'uPhase', 'uPlace', 'uBox']);
  locate(drawProg, ['uPos', 'uSt', 'uView', 'uHue', 'uInk', 'uStep', 'uCeil',
    'uPhase', 'uBox']);

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
  const anchorTex = makeTex();
  const stTex = makeTex();
  let front = 0;

  const anchor = new Float32Array(POOL * 4);
  const st = new Float32Array(POOL * 4);

  let fromInk: TitleInk | null = null;
  let toInk: TitleInk | null = null;
  /** How many slots the last upload named, which is what already has a place. */
  let liveN = 0;
  /** The index from which this step must place particles rather than move them. */
  let placed = 0;
  let startedAt = 0;
  let running = false;
  let step = 1;
  let boxX = 0;
  let boxY = 0;
  let boxW = 1;
  let boxH = 1;

  /**
   * Write both anchor sets into the pool and hand them to the GPU.
   *
   * Shuffled by a stride that steps through the whole list, so that a title with
   * fewer points than the one before it loses them evenly across the words
   * rather than losing its ending.
   */
  function upload(): void {
    const fromN = fromInk?.n ?? 0;
    const toN = toInk?.n ?? 0;
    const live = Math.min(POOL, Math.max(fromN, toN));
    anchor.fill(0);
    st.fill(0);
    for (let i = 0; i < live; i++) {
      const a = i * 4;
      if (fromInk && i < fromN) {
        const j = ((i * 7919) % fromN) * 3;
        anchor[a] = fromInk.pts[j]!;
        anchor[a + 1] = fromInk.pts[j + 1]!;
        st[a + 1] = 1;
      }
      if (toInk && i < toN) {
        const j = ((i * 7919) % toN) * 3;
        anchor[a + 2] = toInk.pts[j]!;
        anchor[a + 3] = toInk.pts[j + 1]!;
        st[a + 2] = 1;
        st[a + 3] = toInk.pts[j + 2]!;
      } else if (fromInk && i < fromN) {
        const j = ((i * 7919) % fromN) * 3;
        st[a + 3] = fromInk.pts[j + 2]!;
      }
    }

    gl.bindTexture(gl.TEXTURE_2D, anchorTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, POOL_W, POOL_H, gl.RGBA, gl.FLOAT, anchor);
    gl.bindTexture(gl.TEXTURE_2D, stTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, POOL_W, POOL_H, gl.RGBA, gl.FLOAT, st);

    const ink = toInk ?? fromInk;
    if (ink) {
      step = ink.step;
      boxX = ink.x;
      boxY = ink.y;
      boxW = ink.w;
      boxH = ink.h;
    }
    liveN = live;
  }

  function phase(): number {
    if (!running) return 1;
    return Math.min(1, (performance.now() - startedAt) / CLOUD_MS);
  }

  return {
    leave(ink: TitleInk | null): void {
      // Taken over from wherever it had got to rather than restarted: the slots
      // already in flight keep their positions, and only the ones this record
      // adds are put anywhere.
      placed = liveN;
      fromInk = ink ?? toInk;
      toInk = null;
      startedAt = performance.now();
      running = true;
      upload();
      wake(CLOUD_MS + 60);
    },
    arrive(ink: TitleInk | null): void {
      // The slots this adds on top of the outgoing title have never held a
      // particle, so they are the ones the next step puts in the air.
      placed = Math.min(placed, liveN);
      toInk = ink;
      upload();
    },
    live(): boolean {
      return !!(fromInk || toInk);
    },
    busy(): boolean {
      return running && phase() < 1;
    },
    step(dt: number, time: number, vel: WebGLTexture, gridW: number, gridH: number): void {
      if (!fromInk && !toInk) return;
      if (running && phase() >= 1) running = false;
      const back = front === 0 ? 1 : 0;
      pass(simProg, posFbo[back]!, POOL_W, POOL_H);
      bindTex(simProg, 'uPos', 0, posTex[front]!);
      bindTex(simProg, 'uAnchor', 1, anchorTex);
      bindTex(simProg, 'uSt', 2, stTex);
      bindTex(simProg, 'uVel', 3, vel);
      gl.uniform2f(u(simProg, 'uGrid'), gridW, gridH);
      gl.uniform4f(u(simProg, 'uBox'), boxX, boxY, boxW, boxH);
      gl.uniform1f(u(simProg, 'uDt'), dt);
      gl.uniform1f(u(simProg, 'uTime'), time);
      gl.uniform1f(u(simProg, 'uPhase'), phase());
      gl.uniform1f(u(simProg, 'uPlace'), placed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      front = back;
      // Everything the last upload named has a position now.
      placed = POOL;
    },
    draw(viewW, viewH, hue, hue2, ceil): void {
      if (!fromInk && !toInk) return;
      const canvasW = gl.drawingBufferWidth;
      const canvasH = gl.drawingBufferHeight;
      pass(drawProg, acc(), canvasW, canvasH);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      bindTex(drawProg, 'uPos', 0, posTex[front]!);
      bindTex(drawProg, 'uSt', 1, stTex);
      gl.uniform2f(u(drawProg, 'uView'), viewW, viewH);
      gl.uniform2f(u(drawProg, 'uHue'), hue, hue2);
      gl.uniform3f(u(drawProg, 'uInk'), 0.949, 0.918, 0.882);
      gl.uniform4f(u(drawProg, 'uBox'), boxX, boxY, boxW, boxH);
      gl.uniform1f(u(drawProg, 'uStep'), Math.max(1, step));
      gl.uniform1f(u(drawProg, 'uCeil'), ceil > 1 ? GAS_HEADROOM : 1);
      gl.uniform1f(u(drawProg, 'uPhase'), phase());
      gl.drawArrays(gl.POINTS, 0, POOL);
    },
    destroy(): void {
      for (const t of posTex) gl.deleteTexture(t);
      for (const f of posFbo) gl.deleteFramebuffer(f);
      gl.deleteTexture(anchorTex);
      gl.deleteTexture(stTex);
      gl.deleteProgram(simProg);
      gl.deleteProgram(drawProg);
    },
  };
}
