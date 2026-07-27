/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The concert page — boot, input, and the render loop.
 *
 * This is the app side of the line. Everything musical, every staging decision
 * and every gesture is computed in `src/concert/`, which is MIT and knows
 * nothing about three.js, Strudel or the DOM. This file owns three things and
 * nothing else: getting a WebGL context, turning pointer events into show
 * input, and calling `show.frame()` sixty times a second.
 *
 * The state machine, and every decision in it, lives in `show.ts`.
 */

import { Color, Fog, PCFShadowMap, Scene, WebGLRenderer } from 'three';

import type { ConcertOptions } from '../../concert/types.js';
import { initAudio } from '../audio.js';
import { createShow, type Show, type ShowState } from './show.js';

const canvas = document.getElementById('stage') as HTMLCanvasElement | null;
const overlay = document.getElementById('overlay')!;
const boot = document.getElementById('boot')!;

/**
 * No WebGL is a degraded experience rather than an error page: the programme
 * and the audio are the show's other half and both work without a stage.
 */
function degrade(reason: string): void {
  overlay.innerHTML = `<div id="fallback">
    <p><b>This browser cannot open the stage.</b> ${reason}</p>
    <p>The music does not need it — the <a href="/">radio</a> plays the same
    generator without any 3D.</p>
  </div>`;
  canvas?.remove();
}

/**
 * A concert is reproducible from its seed, so it is shareable from its URL.
 * `concert.html?seed=…&genre=jazz&vocals=instrumental` is the whole show.
 */
function optionsFromUrl(): ConcertOptions {
  const q = new URLSearchParams(location.search);
  const vocals = q.get('vocals');
  return {
    ...(q.get('seed') ? { seed: q.get('seed')! } : {}),
    ...(q.get('genre') ? { genre: q.get('genre')! } : {}),
    ...(q.get('era') ? { era: q.get('era')! } : {}),
    ...(vocals === 'instrumental' || vocals === 'mixed' || vocals === 'sung'
      ? { vocals }
      : {}),
  };
}

if (!canvas) {
  degrade('The page is missing its canvas.');
} else {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (err) {
    degrade(String(err));
    throw err;
  }

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  /**
   * Arm the audio stack now.
   *
   * `initAudioOnFirstClick` registers its listener synchronously and resolves
   * when that click arrives, so it has to be running before the user can reach
   * the showbill — otherwise it waits for the *second* click and the first
   * press appears to do nothing. The click that drops the bill is the gesture
   * it is waiting for.
   */
  void initAudio().catch((err) => {
    console.error('concert: audio failed to start', err);
    boot.textContent = 'The stage is up, but audio failed to start.';
  });

  const scene = new Scene();
  scene.background = new Color('#0b0908');

  let show: Show;
  try {
    show = createShow({ concert: optionsFromUrl(), onState: onState });
  } catch (err) {
    degrade(`The show could not be staged: ${String(err)}`);
    throw err;
  }
  scene.add(show.root);
  scene.fog = new Fog(new Color(show.concert.venue.palette.ambient).getHex(), 12, 40);

  function onState(state: ShowState): void {
    boot.style.opacity = state === 'bill' ? '0' : '1';
    boot.textContent = state === 'playing' || state === 'count-in'
      ? ''
      : state === 'bow' ? 'Thank you. Goodnight.' : '';
  }

  // --- Input -------------------------------------------------------------
  //
  // A click means three different things depending on the state — advance the
  // bill, or throw a tomato — and a drag always orbits. That has to be
  // unambiguous or the tomatoes feel broken, so the distinction is made once,
  // here, on distance travelled: a pointer that moved is a drag, and a pointer
  // that did not is a click.

  const ndc = (e: PointerEvent): [number, number] => [
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1,
  ];

  let down = false;
  let dragged = 0;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener('pointerdown', (e) => {
    down = true;
    dragged = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    const [x, y] = ndc(e);
    if (!down) { show.aim(x, y); return; }
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    dragged += Math.abs(dx) + Math.abs(dy);
    if (dragged > 6) show.drag(dx, dy);
    else show.aim(x, y);
  });

  canvas.addEventListener('pointerup', (e) => {
    down = false;
    if (dragged <= 6) {
      const [x, y] = ndc(e);
      show.click(x, y);
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') show.toggleProgramme();
  });

  // --- Frame loop --------------------------------------------------------

  function resize(): void {
    const w = canvas!.clientWidth;
    const h = canvas!.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    const cam = show.camera as { aspect?: number; updateProjectionMatrix?: () => void };
    if (cam.aspect !== undefined) {
      cam.aspect = w / Math.max(h, 1);
      cam.updateProjectionMatrix?.();
    }
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  /**
   * Frame time is for interpolation only. What beat it is comes from the audio
   * clock, sampled once inside `show.frame` — never accumulated here. See
   * `transport.ts` for why that distinction is the difference between a stage
   * that looks alive and one that looks like video playing behind a soundtrack.
   */
  let last = performance.now();
  function frame(now: number): void {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    show.frame(dt);
    renderer.render(scene, show.camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
