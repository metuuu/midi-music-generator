/**
 * The title, as ink.
 *
 * One job: turn whatever the browser has actually laid out inside an element
 * into a list of lit points, so something else can draw them as particles. The
 * element keeps its own pixels' worth of layout and its place in the
 * accessibility tree; this only reads.
 */

/** A title's lit points, in viewport CSS pixels. */
export interface TitleInk {
  /** Three floats per point: x, y, and the coverage the rasteriser found there. */
  pts: Float32Array;
  n: number;
  /** How far apart the samples came out, in device pixels. */
  step: number;
}

/**
 * How far apart the samples are, in device pixels, and how many there may be.
 *
 * One sample per device pixel is the whole of why a settled cloud is type and
 * not an impression of it — there is no crisp layer behind these points to fall
 * back on. The cap is half the cloud's pool, which is what one title has to
 * itself; two clamped lines inside a 24rem player do not come near it at any
 * pixel ratio this page draws at, and a title that did would be sampled coarser.
 */
const STEP = 1;
const MAX_PTS = 32768;
/** Below this coverage a device pixel is the shoulder of an edge, not ink. */
const INK = 0.06;

let pad: HTMLCanvasElement | undefined;
let ctx: CanvasRenderingContext2D | null = null;

/** One line the browser drew, and which characters it drew on it. */
interface Run {
  top: number;
  left: number;
  right: number;
  height: number;
  from: number;
  to: number;
}

/**
 * Whether the fonts the title will be measured against are the ones it will be
 * drawn in.
 *
 * Rasterising before this resolves bakes a fallback face into the cloud and
 * nothing repaints it, so every caller waits.
 */
export function inkReady(): Promise<void> {
  return document.fonts?.ready?.then(() => undefined) ?? Promise.resolve();
}

/**
 * Group a text node's characters into the lines the browser put them on.
 *
 * Read from the live layout rather than re-broken here, so a title wraps in the
 * cloud exactly where it wraps on the page — including the wrap that a font
 * this machine happens to have makes and another does not.
 */
function runsOf(node: Text): Run[] {
  const s = node.data;
  const range = document.createRange();
  const runs: Run[] = [];
  let cur: Run | undefined;
  for (let i = 0; i < s.length; i++) {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const box = range.getBoundingClientRect();
    // A space the browser collapsed at a wrap has no box, and belongs to
    // neither line.
    if (box.width === 0 && box.height === 0) continue;
    if (!cur || box.top - cur.top > 1) {
      cur = { top: box.top, left: box.left, right: box.right, height: box.height, from: i, to: i + 1 };
      runs.push(cur);
    } else {
      cur.to = i + 1;
      cur.left = Math.min(cur.left, box.left);
      cur.right = Math.max(cur.right, box.right);
    }
  }
  return runs;
}

/**
 * Read an element's rendered text back as points.
 *
 * Returns null when there is nothing laid out to read, which is every call
 * before the first record lands.
 */
export function readTitleInk(el: HTMLElement, dpr: number): TitleInk | null {
  const node = el.firstChild;
  if (!(node instanceof Text) || !node.data.trim()) return null;

  const cs = getComputedStyle(el);
  const size = parseFloat(cs.fontSize) || 16;

  /**
   * The lines, and the box drawn around what they actually cover.
   *
   * Taken off the character rects and not off the element, which cannot be
   * trusted for this: `.title` is a `-webkit-box` so that it can be clamped to
   * two lines, and a `-webkit-box` reports a zero-width border box in some
   * layouts. Read from the element, a perfectly good title measured as nothing
   * and the page quietly went back to painting its own words.
   */
  const all = runsOf(node);
  const clamp = parseInt(cs.webkitLineClamp, 10);
  const runs = Number.isFinite(clamp) && clamp > 0 ? all.slice(0, clamp) : all;
  if (!runs.length) return null;

  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  let widest = 0;
  for (const run of runs) {
    left = Math.min(left, run.left);
    right = Math.max(right, run.right);
    top = Math.min(top, run.top);
    bottom = Math.max(bottom, run.top + run.height);
    widest = Math.max(widest, run.right - run.left);
  }
  // Glyph ink overshoots its advance box — round tops, tails, an italic — and
  // what is being read back here is the ink.
  const PAD = 2;
  const box = {
    left: left - PAD, top: top - PAD,
    width: right - left + PAD * 2, height: bottom - top + PAD * 2,
  };
  if (box.width < 1 || box.height < 1) return null;

  if (!pad) {
    pad = document.createElement('canvas');
    ctx = pad.getContext('2d', { willReadFrequently: true });
  }
  if (!ctx || !pad) return null;

  const originX = Math.round(box.left * dpr);
  const originY = Math.round(box.top * dpr);
  const w = Math.max(1, Math.ceil(box.width * dpr));
  const h = Math.max(1, Math.ceil(box.height * dpr));
  if (pad.width !== w || pad.height !== h) {
    pad.width = w;
    pad.height = h;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, box.width, box.height);
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = cs.letterSpacing;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  // Coverage is the only thing read back, so the colour is whatever writes a
  // full alpha channel.
  ctx.fillStyle = '#fff';

  /**
   * A character rect's top is the font's content box, so the baseline is that
   * plus the ascent — one reading, needing neither the line height nor the
   * element's own box, both of which this used to go through.
   */
  const asc = ctx.measureText('Hxg').fontBoundingBoxAscent || size * 0.8;

  const s = node.data;
  const clipped = runs.length < all.length;
  runs.forEach((run, line) => {
    let text = s.slice(run.from, run.to);
    let x = run.left - box.left;
    // The clamp shortens the last line and re-centres what is left of it, and
    // the character rects describe the line before it was shortened.
    if (clipped && line === runs.length - 1) {
      while (text && ctx!.measureText(`${text}…`).width > widest) text = text.slice(0, -1);
      text = `${text}…`;
      x = cs.textAlign === 'center' ? (box.width - ctx!.measureText(text).width) / 2 : x;
    }
    ctx!.fillText(text, x, run.top - box.top + asc);
  });

  const data = ctx.getImageData(0, 0, w, h).data;
  // Coarser only when a title would otherwise overrun the pool, and then by
  // whole device pixels so the samples stay on a grid.
  let step = STEP;
  let pts: Float32Array | undefined;
  let n = 0;
  for (;;) {
    const room = Math.ceil(w / step) * Math.ceil(h / step);
    pts = new Float32Array(Math.min(room, MAX_PTS) * 3);
    n = 0;
    for (let py = 0; py < h && n < MAX_PTS; py += step) {
      for (let px = 0; px < w && n < MAX_PTS; px += step) {
        const a = data[(py * w + px) * 4 + 3]! / 255;
        if (a < INK) continue;
        // Centres, not corners: a point sprite is placed by its middle, and
        // half a device pixel out is the difference between type and a blur.
        pts[n * 3] = (originX + px + 0.5) / dpr;
        pts[n * 3 + 1] = (originY + py + 0.5) / dpr;
        pts[n * 3 + 2] = a;
        n++;
      }
    }
    if (n < MAX_PTS) break;
    step++;
  }

  return { pts: pts.subarray(0, n * 3), n, step };
}
