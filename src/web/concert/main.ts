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

import {
  AgXToneMapping, Color, FogExp2, PCFSoftShadowMap, Scene, WebGLRenderer,
} from 'three';

import type { ConcertOptions } from '../../concert/types.js';
import { STRICTNESS_LEVELS } from '../../core/rules.js';
import { HOOK_LEVELS } from '../../generate/hook.js';
import { CHAOS_LEVELS, readChaosMixing } from '../../genre/chaos.js';
import { initAudio } from '../audio.js';
import { createConsole, type StageConsole } from './console.js';
import { lightTheRoom } from './performer-assets.js';
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
 * `concert?seed=…&genre=jazz&vocals=instrumental` is the whole show.
 *
 * `single=1` means something narrower: the query does not describe a band that
 * will pick its own programme, it describes **one specific number**, and the
 * band plays that and goes home. The radio page links here that way, because
 * "watch this" has to mean the song you were listening to and not a different
 * one by the same band. It needs every field that steered the original —
 * a seed alone reproduces nothing, since `generateSong({ seed })` picks its own
 * genre — which is why the link is long.
 */
function optionsFromUrl(): ConcertOptions {
  const q = new URLSearchParams(location.search);
  const str = (key: string): string | undefined => q.get(key) || undefined;

  const vocals = q.get('vocals');
  const policy = vocals === 'instrumental' || vocals === 'mixed' || vocals === 'sung'
    ? vocals
    : undefined;

  /**
   * `chaos=<kinds>&spread=<0..1>` — a concert without borders.
   *
   * A comma-separated subset of `CHAOS_LEVELS`, or `all`. **Filtered rather than
   * rejected**, on the same reasoning as the two level controls below: a typo in
   * a hand-edited URL should cost the default, not the stage — which is the
   * opposite of `getChaosLevels`, the CLI's door, where a mistyped kind is a
   * mistake worth reporting. An out-of-range spread is clamped inside
   * `planChaos`, so only the kinds need looking up here.
   *
   * On a whole evening it makes every number its own chimera; on a `single=1`
   * link it is what stops the stage playing the *host's* song instead of the one
   * the radio was playing. See `ConcertOptions.chaos`.
   */
  const levels = (str('chaos') === 'all' ? [...CHAOS_LEVELS] : (str('chaos') ?? '').split(','))
    .map((id) => CHAOS_LEVELS.find((l) => l === id.trim()))
    .filter((l): l is (typeof CHAOS_LEVELS)[number] => !!l);
  // `mix=band:1,harmony:0.2` — the same rate per kind, for a link that came off
  // the radio's advanced panel. Filtered, not rejected, like everything else
  // here: a mistyped kind costs that kind its own rate and keeps `spread`.
  const mixing = readChaosMixing(str('mix') ?? '');
  const chaos = levels.length
    ? {
      levels,
      ...(str('spread') ? { spread: Number(str('spread')) } : {}),
      ...(Object.keys(mixing).length ? { mixing } : {}),
      // `chaosSeed=…` — the band's own seed. On a whole evening that is one
      // band playing the set rather than a new one every number, which is the
      // interesting thing to be able to link to.
      ...(str('chaosSeed') ? { seed: str('chaosSeed')! } : {}),
    }
    : undefined;

  const opts: ConcertOptions = {
    ...(str('seed') ? { seed: str('seed')! } : {}),
    ...(str('genre') ? { genre: str('genre')! } : {}),
    ...(str('era') ? { era: str('era')! } : {}),
    ...(policy ? { vocals: policy } : {}),
    ...(chaos ? { chaos } : {}),
  };
  /**
   * `piece=3` — just the third number of the evening named by the other params.
   *
   * Parsed only off the whole-show path: a `single=1` link already *is* one
   * number, described by style and mood rather than by setlist position, and
   * folding `piece` into it would invent a second meaning for the same flag.
   */
  const pieceRaw = q.get('piece');
  const piece = pieceRaw && /^\d+$/.test(pieceRaw) ? Number(pieceRaw) : undefined;
  if (q.get('single') !== '1') {
    return {
      ...opts,
      ...(piece !== undefined && piece > 0 ? { piece } : {}),
    };
  }

  // Both level controls are validated against their own tables rather than
  // cast: a typo in a hand-edited URL should cost the default, not the stage.
  const strictness = STRICTNESS_LEVELS.find((l) => l.id === str('strictness'))?.id;
  const hook = HOOK_LEVELS.find((l) => l.id === str('hook'))?.id;

  return {
    ...opts,
    song: {
      ...(str('seed') ? { seed: str('seed')! } : {}),
      ...(str('genre') ? { genre: str('genre')! } : {}),
      ...(str('era') ? { era: str('era')! } : {}),
      ...(str('style') ? { style: str('style')! } : {}),
      ...(str('mood') ? { mood: str('mood')! } : {}),
      ...(strictness ? { strictness } : {}),
      ...(hook ? { hook } : {}),
      ...(chaos ? { chaos } : {}),
      vocals: policy === 'sung',
    },
  };
}

/**
 * A flag typed into an address bar by hand.
 *
 * Presence is enough (`?debug`, `?debug=1`), because that is how such a thing is
 * written. `=0` and `=false` turn it off, so a link that carries one can be
 * handed back without it.
 *
 * Two of them, and neither is in `ConcertOptions` or in `shareUrl`. Both are
 * about *this page* rather than about the show — `?debug` labels every player
 * with the part they are playing, and `?metu` (or `?poppodi`, the same egg under
 * another name) dresses the whole band as one man — so neither belongs in a
 * link that means "the same show, for somebody else". The seed still reproduces
 * the concert; the flag is the reader's own.
 */
function flagFromUrl(key: string): boolean {
  const v = new URLSearchParams(location.search).get(key);
  return v !== null && v !== '0' && v !== 'false';
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
  renderer.shadowMap.type = PCFSoftShadowMap;

  /**
   * The transfer curve, and the reason the stage stopped looking like a
   * photocopy of itself.
   *
   * Without this the renderer is on `NoToneMapping`, which is not "no curve" —
   * it is a hard clamp at 1.0. Every fixture in `lights.ts` is tuned to land a
   * lit surface near 1.0 on its own, so anywhere two of them overlapped, the
   * result clipped: a face under the key and the wash came out the same flat
   * white as the face beside it under the key and the back light. There was no
   * gradient left in the top of the image to be lit *by*.
   *
   * AgX rather than ACES because this show is lit through gels. ACES walks
   * saturated colour toward the achromatic axis as it brightens, so a deep
   * blue wash at full turns pale and slightly cyan — the rig's own palette
   * tables stop meaning what they say. AgX desaturates too, but along a much
   * longer path, so a saturated lantern at full reads as a bright version of
   * its own colour instead of a wash of white.
   *
   * Numbers, on a surface at albedo 0.6 under a mid-level cue: linear 1.0 now
   * lands at 0.79 display instead of 1.0, 2.0 at 0.87 and 4.0 at 0.93. The
   * highlights compress into a ramp rather than a plateau, which is what
   * restores the modelling — and it is why every gain in `lights.ts` was
   * re-derived against this curve rather than left where it was.
   *
   * Exposure stays at 1.0. The place to make the show darker is the rig, where
   * a level means something to the score; a global exposure trim would darken
   * the cyclorama card and the emissive lamp lenses along with it, and those
   * are the two things that must not move.
   */
  renderer.toneMapping = AgXToneMapping;
  renderer.toneMappingExposure = 1.0;

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

  /**
   * Something for the metal to reflect, before anything metal is built.
   *
   * The stage is full of surfaces whose whole colour is a reflection — cymbals,
   * a trumpet, a chrome stand, and the sequinned or lamé jacket the wardrobe
   * reserves for whoever is fronting the number. A `MeshStandardMaterial` at
   * high metalness has no diffuse response, so without a `scene.environment`
   * those render as a bright dot on black and the lead is the darkest figure in
   * the house. `lightTheRoom` generates one; the same call, at the same
   * intensity, backs both benches, so what is checked on `/looks` is what
   * walks on here.
   *
   * The handle is held rather than dropped because the render target it owns
   * outlives the call. This page never tears its renderer down — the tab closing
   * is the teardown — so nothing calls `dispose`, and that is a decision the
   * binding makes visible instead of a resource with no owner.
   */
  const room = lightTheRoom(renderer, scene);
  void room;

  const debug = flagFromUrl('debug');
  let show: Show;
  try {
    show = createShow({
      concert: optionsFromUrl(),
      debug,
      metu: flagFromUrl('metu') || flagFromUrl('poppodi'),
      onState: onState,
      // Declared before the console exists, and read only when a label is
      // clicked — which cannot happen before the first frame. Reaching through
      // the binding rather than capturing it is what lets the two be built in
      // the order they have to be built in.
      onPick: (layer) => stageConsole?.select(layer),
    });
  } catch (err) {
    degrade(`The show could not be staged: ${String(err)}`);
    throw err;
  }
  scene.add(show.root);

  /**
   * The transport and the mixing desk, on the same flag as the labels.
   *
   * `?debug` has meant "diagnostics that change no staging, no timing and no
   * sound" up to now, and the console breaks the third of those on purpose —
   * moving a fader is the whole point of it. It shares the flag anyway rather
   * than taking a second one, because in practice the two are wanted together:
   * a label naming the part a player is holding and a strip saying how loud it
   * is are the same investigation, and a second flag would mostly be a thing to
   * forget. The show below is identical without it — nothing here is on the
   * path of a page that does not ask.
   */
  const stageConsole: StageConsole | undefined = debug ? createConsole(show) : undefined;
  /**
   * Air, rather than a ramp.
   *
   * Linear `Fog` does nothing at all for twelve metres and then climbs on a
   * straight line, which reads as a grey curtain hung at a fixed distance —
   * the near half of the room gets no depth cue and the far half gets a
   * uniform one. `FogExp2` starts immediately and falls off the way scattering
   * actually does, so distance is carried by a gradient across the whole
   * depth of the house instead of an edge partway into it.
   *
   * 0.035 is the linear pair transcribed: about 19% at the old near plane and
   * 90% at the old far one, so a room's sense of size does not change — only
   * the shape of the falloff between them.
   *
   * The colour is shaded because the fog is the one surface in the scene that
   * is not lit by the rig. At the palette's own `ambient` it was brighter than
   * the boards it hung in front of once the fills came down, which put the
   * back of every room in a haze paler than the stage — an unlit surface has
   * no business being the brightest thing upstage.
   */
  scene.fog = new FogExp2(
    new Color(show.concert.venue.palette.ambient).multiplyScalar(0.55).getHex(),
    0.035,
  );

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

  // A fourth meaning, on a phone: two fingers are a pinch. Which is why the
  // pointers are a map rather than a boolean — the count is the thing that
  // separates a drag from a zoom, and it has to be read on the move event
  // rather than guessed at on the way down.

  /** Every finger or button currently down, at its last known place. */
  const touching = new Map<number, { x: number; y: number }>();
  let dragged = 0;
  let lastX = 0;
  let lastY = 0;
  /** How far apart the two fingers were when the pinch was last measured. */
  let spread = 0;

  function pinchSpread(): number {
    const [a, b] = [...touching.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }

  /** The one finger left on the glass, if there is exactly one. */
  function only(): { x: number; y: number } | undefined {
    return touching.size === 1 ? [...touching.values()][0] : undefined;
  }

  canvas.addEventListener('pointerdown', (e) => {
    touching.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touching.size === 1) {
      dragged = 0;
      lastX = e.clientX;
      lastY = e.clientY;
    } else {
      // A second finger retires the click. Somebody pinching has not asked to
      // throw a tomato, and the first finger's travel is usually under the
      // threshold that would have said so.
      dragged = Infinity;
      spread = pinchSpread();
    }
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    const held = touching.get(e.pointerId);
    if (held) { held.x = e.clientX; held.y = e.clientY; }

    if (touching.size >= 2) {
      const now = pinchSpread();
      // Fingers apart is closer, which is what every map and every photograph
      // on the same device already does. `spread` is zero on the frame a pinch
      // starts or re-forms, and there is no ratio to take from that.
      if (spread > 0 && now > 0) show.zoom(spread / now);
      spread = now;
      return;
    }

    const [x, y] = ndc(e);
    if (!held) { show.aim(x, y); return; }
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    dragged += Math.abs(dx) + Math.abs(dy);
    if (dragged > 6) show.drag(dx, dy);
    else show.aim(x, y);
  });

  /**
   * A finger leaving. Two of them do not lift together, so the second half of
   * every pinch is a moment with one finger still down — and that finger is
   * nowhere near where the drag last had its hand. Re-seating `lastX/lastY` on
   * it is what stops the release of a pinch from whipping the camera round.
   */
  function lift(e: PointerEvent): void {
    touching.delete(e.pointerId);
    spread = 0;
    const rest = only();
    if (rest) { lastX = rest.x; lastY = rest.y; }
  }

  canvas.addEventListener('pointerup', (e) => {
    const wasLast = touching.size === 1 && touching.has(e.pointerId);
    lift(e);
    if (wasLast && dragged <= 6) {
      const [x, y] = ndc(e);
      show.click(x, y);
    }
  });

  canvas.addEventListener('pointercancel', lift);

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    /**
     * Out of the browser's unit before it is used. Chrome reports pixels,
     * Firefox reports lines and a trackpad's momentum arrives as a stream of
     * small pixel deltas; without this a notch of the same wheel is worth
     * sixteen times as much on one browser as on the other.
     */
    const px = e.deltaMode === 1 ? e.deltaY * 16
      : e.deltaMode === 2 ? e.deltaY * window.innerHeight
        : e.deltaY;
    // Exponential, so a notch is a fixed proportion of the distance rather
    // than a fixed number of metres — the same feel from a close-up as from
    // the wide shot.
    show.zoom(Math.exp(px * 0.0012));
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    // Bare presses only: ⌘P is the print dialog and always has been, and a page
    // that answers it with something else is a page that broke printing.
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    /**
     * The console gets first refusal, and only when there is one.
     *
     * It claims space, the arrows, `m` and the brackets; `p` and Escape are the
     * programme's and it does not offer for either. First rather than last
     * because space would otherwise scroll the page under a transport that
     * wanted it, and a key handled twice is worse than a key handled by the
     * wrong half.
     */
    if (stageConsole?.key(e)) { e.preventDefault(); return; }
    if (e.key === 'p' || e.key === 'P') show.toggleProgramme();
    // The programme is a dialog and Escape closes dialogs. The tab in the
    // corner and the × on the sheet are the other two ways out; the show never
    // stopped, so none of them resumes anything.
    else if (e.key === 'Escape') show.closeProgramme();
  });

  // --- Frame loop --------------------------------------------------------

  function resize(): void {
    /**
     * Three ways to ask how big the canvas is, because the first one lies.
     *
     * `clientWidth` is the CSS box, and it reads 0 whenever the element is
     * off-layout — a background tab, a preview pane mid-attach. The backing
     * store (`canvas.width`) is a real number even then, and the window is a
     * last resort. Taking the first non-zero answer keeps the camera's aspect
     * honest; without it every framing calculation downstream is solving for a
     * frame of zero width.
     */
    const w = canvas!.clientWidth || canvas!.width || window.innerWidth;
    const h = canvas!.clientHeight || canvas!.height || window.innerHeight;
    /**
     * A zero measurement is not a size, it is the absence of one.
     *
     * A canvas reports 0×0 while it is off-layout — a hidden tab, a display
     * that has not settled, an embedded preview mid-attach — and writing that
     * through gives the camera an aspect of zero. Nothing looks broken:
     * three.js renders happily, but every framing calculation downstream
     * divides by `tan(0)`, asks for an infinite distance, and collapses onto
     * whatever bound it hits. Keeping the last good size is correct, because
     * the last good size is the only real one there has been.
     */
    if (w <= 0 || h <= 0) return;
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
    // After the show, never before: it reads the position the frame just
    // settled, and a console painted first would be one frame behind all night.
    stageConsole?.frame();
    renderer.render(scene, show.camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
