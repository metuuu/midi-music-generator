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
const CLOUD_IN_MS = 560;
export const CLOUD_MS = CLOUD_OUT_MS + CLOUD_IN_MS;

/**
 * The gathering begins the instant the throwing stops, and there is no third
 * part between them.
 *
 * With a pause in the middle the words went out to an exploded shape, hung
 * there as a thing in its own right, and came back — two gestures with a stop
 * between. Butted together the whole changeover is one arc: the points are
 * thrown, their own momentum carries them out against a spring that starts at
 * nothing, and they are drawn in from wherever that got them.
 */
const OUT_END = CLOUD_OUT_MS / CLOUD_MS;
const IN_START = OUT_END;
/** Where a split-off has fully faded up, and the two coverages have swapped. */
const HANDOVER = OUT_END + (1 - IN_START) * 0.25;

/** How hard a shape holds its particles, and how hard the next one takes them. */
const K_HOLD = 900;
const K_CATCH = 760;
const DRAG_HELD = 54;
const DRAG_FREE = 1.0;
/**
 * The shove that throws the letters apart, and the drift of what it let go.
 *
 * Each particle's own direction and no shared one, which is what makes it an
 * ejection in every direction rather than a title blooming outwards from its
 * middle.
 */
const EJECT = 2400;
const WANDER = 90;
const RISE = 14;
const FLUID_GRIP = 1.6;
/** How fast a particle split off another leaves it, in pixels per second. */
const SPLIT_V = 70;
/** Device pixels a sample grows by once it is loose. */
const GAS_GROW = 2.4;

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
#define HANDOVER ${HANDOVER.toFixed(5)}

uniform float uPhase;

float holdAt(float ph) { return 1.0 - smoothstep(0.0, OUT_END, ph); }
float catchAt(float ph) { return smoothstep(IN_START, 1.0, ph); }
float looseAt(float ph) { return clamp(1.0 - holdAt(ph) - catchAt(ph), 0.0, 1.0); }`;



const SIM_FS = `#version 300 es
precision highp float;
precision highp int;
${HASH}
${GRIPS}
#define POOL_W ${POOL_W}
#define K_HOLD ${K_HOLD.toFixed(1)}
#define K_CATCH ${K_CATCH.toFixed(1)}
#define DRAG_HELD ${DRAG_HELD.toFixed(2)}
#define DRAG_FREE ${DRAG_FREE.toFixed(3)}
#define EJECT ${EJECT.toFixed(1)}
#define SPLIT_V ${SPLIT_V.toFixed(1)}
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
uniform float uFromN;

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

  float ph = clamp(uPhase, 0.0, 1.0);
  // A particle the old title never had has no shape to be held by, and a
  // particle the new one has no room for is never taken.
  float home = S.y > 0.5 ? holdAt(ph) : 0.0;
  float take = S.z > 0.5 ? catchAt(ph) : 0.0;
  float loose = looseAt(ph);

  /**
   * A slot the last title did not fill is not conjured out of the air near
   * where it is wanted — it is split off one that is already flying, taking
   * that one's place and speed and then leaving it at its own angle.
   *
   * Which is the only honest way to make one: every particle in the new title
   * came out of the old title, and the ones there were not enough of came out
   * of it twice.
   */
  if (float(i) >= uPlace) {
    if (uFromN > 0.5) {
      int par = int(mod(float(i), uFromN));
      vec4 PP = texelFetch(uPos, ivec2(par % POOL_W, par / POOL_W), 0);
      float split = rnd(i, 23u) * 6.28318530718;
      oPos = vec4(PP.xy, PP.zw + vec2(cos(split), sin(split)) * SPLIT_V);
    } else {
      oPos = vec4(A.zw, 0.0, 0.0);
    }
    return;
  }

  vec4 P = texelFetch(uPos, c, 0);
  vec2 p = P.xy;
  vec2 v = P.zw;

  vec2 a = (A.xy - p) * (K_HOLD * home) + (A.zw - p) * (K_CATCH * take);

  // Its own way and no other, so the words go out in every direction rather
  // than swelling away from their middle.
  float kick = exp(-pow((ph - OUT_END * 0.55) / (OUT_END * 0.5 + 1e-4), 2.0));
  float ang = rnd(i, 11u) * 6.28318530718;
  a += vec2(cos(ang), sin(ang)) * (EJECT * kick);

  // Loose, it is gas: it rises, it wanders, and it goes where the cursor has
  // already pushed the fluid the bar is drawn in.
  vec2 fluid = texture(uVel, clamp(p / uGrid, vec2(0.0), vec2(1.0))).xy;
  a += (fluid - v) * (FLUID_GRIP * loose);
  a += swirl(p, uTime) * (WANDER * loose);
  a.y -= RISE * loose;

  v += a * uDt;
  v *= exp(-mix(DRAG_FREE, DRAG_HELD, pow(max(home, take), 2.0)) * uDt);
  oPos = vec4(p + v * uDt, v);
}`;

const DRAW_VS = `#version 300 es
precision highp float;
precision highp int;
${HASH}
${GRIPS}
#define POOL_W ${POOL_W}
#define GAS_GROW ${GAS_GROW.toFixed(2)}

uniform sampler2D uPos;
uniform sampler2D uSt;
uniform vec2 uView;
uniform float uStep;
uniform float uFade;

out float vCov;
out float vSoft;

void main() {
  ivec2 c = ivec2(gl_VertexID % POOL_W, gl_VertexID / POOL_W);
  vec4 S = texelFetch(uSt, c, 0);
  if (max(S.x, S.w) <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }

  float ph = clamp(uPhase, 0.0, 1.0);
  float loose = looseAt(ph);
  // Split off another at the moment the words came apart, so it fades up from
  // there; or it is what the new title had no room for, and goes out well
  // before the new one is legible.
  float fade = (S.y > 0.5 ? 1.0 : smoothstep(OUT_END, HANDOVER, ph))
    * (S.z > 0.5 ? 1.0 : 1.0 - smoothstep(OUT_END, 0.85, ph));

  vec2 p = texelFetch(uPos, c, 0).xy;
  // The two titles antialiased their edges differently, and a sample carries
  // both figures so the change of hands happens while the words are apart
  // rather than as a step at the moment they are swapped.
  vCov = mix(S.x, S.w, smoothstep(OUT_END, HANDOVER, ph)) * fade * uFade;
  vSoft = loose;

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
uniform vec3 uInk;
uniform float uCeil;
in float vCov;
in float vSoft;
out vec4 oColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float cov = vCov * mix(1.0, max(0.0, 1.0 - dot(d, d) * 4.0), vSoft);
  cov = clamp(cov, 0.0, 0.995);
  if (cov <= 0.0) discard;
  float peak = -log(1.0 - cov);
  vec3 c = uInk * peak;
  oColor = vec4(c, max(c.r, max(c.g, c.b)) * uCeil);
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
  /**
   * Bring a title that is simply there up from nothing, which is the page's own
   * reveal rather than a changeover — see `reveal` in the implementation.
   */
  reveal(delayMs: number, durMs: number): void;
  step(dt: number, time: number, vel: WebGLTexture, gridW: number, gridH: number): void;
  draw(viewW: number, viewH: number): void;
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
    'uPhase', 'uPlace', 'uFromN']);
  locate(drawProg, ['uPos', 'uSt', 'uView', 'uInk', 'uStep', 'uCeil', 'uPhase', 'uFade']);

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
  /** How many the outgoing title had, which is what the new ones are split off. */
  let fromCount = 0;
  let startedAt = 0;
  let running = false;
  /** When the whole cloud is up, and over how long it came up. */
  let revealAt = -Infinity;
  let revealMs = 0;
  let step = 1;

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
      let leaving = 0;
      let landing = 0;
      if (fromInk && i < fromN) {
        const j = ((i * 7919) % fromN) * 3;
        anchor[a] = fromInk.pts[j]!;
        anchor[a + 1] = fromInk.pts[j + 1]!;
        leaving = fromInk.pts[j + 2]!;
        st[a + 1] = 1;
      }
      if (toInk && i < toN) {
        const j = ((i * 7919) % toN) * 3;
        anchor[a + 2] = toInk.pts[j]!;
        anchor[a + 3] = toInk.pts[j + 1]!;
        landing = toInk.pts[j + 2]!;
        st[a + 2] = 1;
      }
      st[a] = leaving || landing;
      st[a + 3] = landing || leaving;
    }

    gl.bindTexture(gl.TEXTURE_2D, anchorTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, POOL_W, POOL_H, gl.RGBA, gl.FLOAT, anchor);
    gl.bindTexture(gl.TEXTURE_2D, stTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, POOL_W, POOL_H, gl.RGBA, gl.FLOAT, st);

    if (toInk ?? fromInk) step = (toInk ?? fromInk)!.step;
    liveN = live;
    fromCount = Math.min(POOL, fromN);
  }

  function phase(): number {
    if (!running) return 1;
    return Math.min(1, (performance.now() - startedAt) / CLOUD_MS);
  }

  /**
   * The whole cloud's own opacity, which only the first title ever spends.
   *
   * It is the fade the page would have run on its own text, run here instead —
   * the placeholder bars still narrow onto the words, and what comes up under
   * them is particles rather than the element, so the pixels are never the
   * element's to begin with.
   */
  function revealed(): number {
    if (revealMs <= 0) return 1;
    return Math.min(1, Math.max(0, (performance.now() - revealAt) / revealMs));
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
      if (running) {
        // The slots this adds on top of the outgoing title have never held a
        // particle, so they are the ones the next step places.
        placed = Math.min(placed, liveN);
      } else {
        /**
         * A title arriving with nothing thrown is simply put where it belongs:
         * there is no flight for it to join, so every point is placed on the
         * new shape rather than sliding onto it from the last one.
         *
         * It is how the page's first title goes up, how a window being resized
         * reflows, and how a changeover reads for somebody who has asked for
         * less movement.
         */
        fromInk = null;
        placed = 0;
      }
      toInk = ink;
      upload();
      wake(running ? CLOUD_MS : 120);
    },
    live(): boolean {
      return !!(fromInk || toInk);
    },
    busy(): boolean {
      return (running && phase() < 1) || revealed() < 1;
    },
    reveal(delayMs: number, durMs: number): void {
      revealAt = performance.now() + delayMs;
      revealMs = durMs;
      wake(delayMs + durMs + 60);
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
      gl.uniform1f(u(simProg, 'uDt'), dt);
      gl.uniform1f(u(simProg, 'uTime'), time);
      gl.uniform1f(u(simProg, 'uPhase'), phase());
      gl.uniform1f(u(simProg, 'uPlace'), placed);
      gl.uniform1f(u(simProg, 'uFromN'), fromCount);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      front = back;
      // Everything the last upload named has a position now.
      placed = POOL;
    },
    draw(viewW, viewH): void {
      if (!fromInk && !toInk) return;
      const target = acc();
      if (!target) return;
      pass(drawProg, target, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      bindTex(drawProg, 'uPos', 0, posTex[front]!);
      bindTex(drawProg, 'uSt', 1, stTex);
      gl.uniform2f(u(drawProg, 'uView'), viewW, viewH);
      // `--ink`, and it does not move. A title changing colour as it comes
      // apart says the name is changing into something; it is only changing.
      gl.uniform3f(u(drawProg, 'uInk'), 0.949, 0.918, 0.882);
      gl.uniform1f(u(drawProg, 'uStep'), Math.max(1, step));
      // Page white exactly, on every screen. The ceiling written here is the
      // one number that would let a title go above it, and a name lit brighter
      // than the words under it is a notification rather than a name.
      gl.uniform1f(u(drawProg, 'uCeil'), 1);
      gl.uniform1f(u(drawProg, 'uPhase'), phase());
      gl.uniform1f(u(drawProg, 'uFade'), revealed());
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
