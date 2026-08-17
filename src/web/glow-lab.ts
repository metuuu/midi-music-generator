/**
 * A bench for the glow bar, because the bar cannot be debugged by looking at it.
 *
 * What the eye gets is a soft line a few pixels tall behind a fade-in, and every
 * question worth asking about a cut is about the state underneath: which columns
 * count as line, which are gas still waiting, how long the line that is there has
 * stood. Three rounds of this were lost to guessing at that from a description of
 * what it looked like, so here it is measured instead.
 *
 * Two halves, and both matter.
 *
 * **Scripted gestures.** A cut is a pointer moving at a speed, and doing one by
 * hand is neither repeatable nor describable. `GESTURES` are laid down in pixels
 * a second along the bar and played out through real pointer events, so the field
 * is driven through exactly the path it is driven through in the page — the same
 * jump clamp, the same speed gate, the same stroke segment.
 *
 * The field is stepped by hand between events rather than left to the display —
 * see `GlowField.pump`. Partly for repeatability, since a gesture then has the
 * same shape whatever the frame rate; mostly because a page nobody is looking at
 * gets no frames at all, so a bench that waited for them would sit there
 * measuring a simulation that had not moved. Which it did, for one round.
 *
 * **The census, over time.** After each gesture the bar is watched for a couple
 * of seconds and the census sampled every frame. What comes out is a timeline: a
 * row per sample, a character per bucket of columns, so a heal reads as a shape
 * on the screen. A front closing from both edges looks like one; a front that
 * arrives everywhere at once looks like another; a tip that grows and is thrown
 * away looks like a fringe that flickers and never advances, which is the whole
 * reason this file exists.
 *
 * `run()` returns the timeline as data as well as drawing it, so it can be read
 * from a console or a driver rather than from a screenshot.
 */
import { mountGlowField, type GlowField } from './glow-field.js';

/** Columns per character in the timeline. The bar is 768 columns wide. */
const BUCKET = 8;
/** How much of a bucket has to be line for it to read as line. */
const SOLID = 0.5;

/**
 * A stroke, in the bar's own frame: x as a fraction of its width, y in pixels
 * from its centre line.
 *
 * Both ends, rather than a span along the length, because which way a stroke goes
 * decides whether it cuts at all. The cursor never touches a particle — it heats
 * the line and stirs the air, and what tears the bar is being dragged away from
 * home. A stroke that runs *along* the bar drags it lengthwise, which the links
 * simply pass along, and it comes out barely cut. Crossing the line is what cuts
 * it. That cost a first run reporting no damage at all, from a bench that was
 * working perfectly.
 */
interface Gesture {
  name: string;
  what: string;
  /** Pixels a second. */
  speed: number;
  from: [number, number];
  to: [number, number];
  /** Seconds to watch afterwards. */
  watch: number;
  /**
   * Seconds to let the cut heal before striking again along the same path.
   *
   * The one gesture that cannot be done by hand twice the same way, and the one
   * that matters most: a swipe through a cut that is halfway healed. What it is
   * looking for is line carrying on growing in the middle of a gap that has just
   * been emptied — growth out of something the swipe left behind rather than out
   * of a face.
   */
  again?: number;
}

const GESTURES: Gesture[] = [
  {
    name: 'sweep',
    what: 'one fast swing crossing the whole bar end to end, then let go',
    speed: 3200,
    from: [-0.15, -70],
    to: [1.15, 70],
    watch: 2.5,
  },
  {
    name: 'chop',
    what: 'a fast stroke straight through the middle',
    speed: 2600,
    from: [0.5, -90],
    to: [0.5, 90],
    watch: 2,
  },
  {
    name: 'notch',
    what: 'a short fast diagonal, a nick rather than a cut',
    speed: 2600,
    from: [0.44, -40],
    to: [0.56, 40],
    watch: 2,
  },
  {
    name: 'crawl',
    what: 'the same swing as sweep, too slow to tear anything',
    speed: 260,
    from: [-0.15, -70],
    to: [1.15, 70],
    watch: 1.2,
  },
  {
    name: 'recut',
    what: 'a notch, then the same notch again while it is halfway healed',
    speed: 2600,
    from: [0.44, -40],
    to: [0.56, 40],
    again: 0.25,
    watch: 2,
  },
];

interface Sample {
  /** Milliseconds since the gesture ended. */
  at: number;
  /** One character per bucket: line, part line, or gas. */
  row: string;
  /** How many columns are line. */
  line: number;
  /** How far in from each end the line runs unbroken. */
  fromLeft: number;
  fromRight: number;
  /**
   * Runs of line that touch neither end of the bar — a chip standing on its own
   * in a gap. Anything growing has to grow out of a face or out of an end, so a
   * loose run is either something a swipe failed to take away or the beginning of
   * a heal that is starting from the middle of nowhere. Each is [from, to].
   */
  loose: [number, number][];
}

interface Run {
  gesture: string;
  what: string;
  samples: Sample[];
  /** What the run says about itself, in a sentence per finding. */
  notes: string[];
}

const host = document.querySelector<HTMLElement>('.glow');
const out = document.querySelector<HTMLElement>('#out');
const runBtn = document.querySelector<HTMLButtonElement>('#run');
const pickers = document.querySelectorAll<HTMLInputElement>('input[name="gesture"]');

let field: GlowField | undefined;

function say(text: string): void {
  if (out) out.textContent += text + '\n';
}

/** One simulated frame. The field's own substepping happens inside this. */
const STEP = 1000 / 60;

function step(): void {
  field?.pump(STEP);
}

/**
 * Hand the page back for a moment, so a long run does not lock the tab up while
 * somebody is watching it.
 *
 * Nobody is watching a hidden tab, and a hidden tab is exactly where yielding
 * costs the most: a background timer is clamped to a second whatever it asks for,
 * so a run that pauses a dozen times to be polite takes a dozen seconds to do a
 * tenth of a second of simulation. Driven rather than watched, it runs straight
 * through.
 */
function breathe(): Promise<void> {
  if (document.hidden) return Promise.resolve();
  return new Promise((go) => setTimeout(go, 0));
}

/** A pointer event the field will believe, at a point on the page. */
function poke(type: string, x: number, y: number): void {
  window.dispatchEvent(new PointerEvent(type, {
    clientX: x,
    clientY: y,
    bubbles: true,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
  }));
}

/**
 * Play a stroke out, a simulated frame at a time.
 *
 * The pointer is moved by one frame's worth of travel and the field is then
 * stepped by one frame, so the speed the field sees is the speed asked for,
 * exactly, and the same on any machine.
 */
async function stroke(g: Gesture): Promise<void> {
  if (!host) return;
  const r = host.getBoundingClientRect();
  const mid = r.top + r.height / 2;
  const x0 = r.left + r.width * g.from[0];
  const y0 = mid + g.from[1];
  const x1 = r.left + r.width * g.to[0];
  const y1 = mid + g.to[1];
  const len = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.round((len / g.speed) * 1000 / STEP));

  poke('pointermove', x0, y0);
  step();
  for (let k = 1; k <= steps; k++) {
    const t = k / steps;
    poke('pointermove', x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
    step();
    if (k % 30 === 0) await breathe();
  }
  // Off the bar, and stepped once so the field sees a frame with the cursor gone
  // before anything is measured — otherwise the first sample is taken with the
  // knife still in the cut. See KNIFE in the field.
  poke('pointermove', r.left + r.width / 2, mid - 500);
  step();
}

function bucketRow(line: Float32Array, whole: number): string {
  let row = '';
  for (let b = 0; b < line.length; b += BUCKET) {
    let sum = 0;
    for (let x = b; x < b + BUCKET && x < line.length; x++) {
      sum += (line[x] ?? 0) > whole ? 1 : 0;
    }
    const share = sum / BUCKET;
    row += share >= 0.999 ? '#' : share >= SOLID ? '+' : share > 0 ? '-' : '.';
  }
  return row;
}

/** Every run of line that touches neither end of the bar. See `Sample.loose`. */
function looseRuns(line: Float32Array, whole: number): [number, number][] {
  const runs: [number, number][] = [];
  let from = -1;
  for (let x = 0; x <= line.length; x++) {
    const on = x < line.length && (line[x] ?? 0) > whole;
    if (on && from < 0) from = x;
    if (!on && from >= 0) {
      if (from > 0 && x - 1 < line.length - 1) runs.push([from, x - 1]);
      from = -1;
    }
  }
  return runs;
}

function runFrom(line: Float32Array, whole: number, dir: 1 | -1): number {
  const n = line.length;
  let count = 0;
  for (let k = 0; k < n; k++) {
    const x = dir === 1 ? k : n - 1 - k;
    if ((line[x] ?? 0) > whole) count++;
    else break;
  }
  return count;
}

/**
 * The reading of the timeline, which is the part worth having.
 *
 * Three things are asked of it, and each is a shape the eye would have to be
 * told to look for. Whether the line ever came back at all. Whether it came back
 * from the two ends inward, which is a run that grows monotonically from each
 * side. And whether anything grew and was then taken away again, which is the
 * failure this bench was built for: a front that goes forward and back is a tip
 * being thrown away as fast as it arrives.
 */
function read(samples: Sample[]): string[] {
  const notes: string[] = [];
  if (!samples.length) return ['no samples'];
  const last = samples[samples.length - 1]!;
  const cols = 768;

  /**
   * The bottom of the cut, which is not the first sample.
   *
   * A stroke stops before its damage does: the draught it left goes on pulling
   * for a few frames, so the gap is still opening when the watching starts.
   * Measuring the cut at the first sample called a chop that took two dozen
   * columns a moment later "no damage", and — worse — counted the gap's own
   * appearance as the ends losing ground, which is the exact thing this run is
   * supposed to detect. Everything below is measured from the worst of it.
   */
  let deep = 0;
  samples.forEach((s, k) => {
    if (s.line < samples[deep]!.line) deep = k;
  });
  const first = samples[deep]!;

  notes.push(`cut ${cols - first.line} columns at its worst, ${
    Math.round(first.at)}ms in`);
  notes.push(`after ${Math.round(last.at)}ms: ${last.line} of ${cols} columns are line`);

  let backwards = 0;
  let worstL = 0;
  let worstR = 0;
  for (let k = deep + 1; k < samples.length; k++) {
    const a = samples[k - 1]!;
    const b = samples[k]!;
    if (b.fromLeft < a.fromLeft) {
      backwards++;
      worstL = Math.max(worstL, a.fromLeft - b.fromLeft);
    }
    if (b.fromRight < a.fromRight) {
      backwards++;
      worstR = Math.max(worstR, a.fromRight - b.fromRight);
    }
  }
  notes.push(backwards === 0
    ? 'both ends only ever grew — no ground given back'
    : `ends lost ground ${backwards} times (worst: ${worstL} columns left, ${worstR} right)`);

  /**
   * Line standing loose in a gap, which is the whole question for a re-cut.
   * Reported as the widest one seen and the count, because one column of it is a
   * straggler and thirty is a heal that has started in mid-air.
   */
  let mostLoose = 0;
  let widest = 0;
  let when = 0;
  samples.slice(deep).forEach((s) => {
    if (s.loose.length > mostLoose) mostLoose = s.loose.length;
    for (const [a, b] of s.loose) {
      if (b - a + 1 > widest) {
        widest = b - a + 1;
        when = s.at;
      }
    }
  });
  notes.push(widest === 0
    ? 'nothing ever grew loose in the gap — every column came off a face or an end'
    : `line stood loose in the gap: up to ${widest} columns of it, ${
      mostLoose} run(s) at once, worst at ${Math.round(when)}ms`);

  // Timed to when it finished rather than over the whole watch, or a heal that
  // was done in half a second is reported at the speed of the time spent waiting.
  const whole = samples.slice(deep).find((s) => s.line >= cols);
  const grew = last.line - first.line;
  if (whole) {
    const secs = (whole.at - first.at) / 1000;
    notes.push(`whole again after ${Math.round(whole.at)}ms — ${
      secs > 0 ? Math.round((cols - first.line) / secs) : '∞'} columns/s`);
  } else if (grew > 0) {
    const secs = (last.at - first.at) / 1000;
    notes.push(`still short by ${cols - last.line} columns after ${
      Math.round(last.at)}ms — ${Math.round(grew / secs)} columns/s`);
  } else {
    notes.push('nothing healed at all');
  }
  return notes;
}

async function play(g: Gesture): Promise<Run> {
  const samples: Sample[] = [];
  await stroke(g);
  if (g.again !== undefined) {
    // Let it get halfway back, then strike the same place again.
    for (let k = 0; k < Math.round((g.again * 1000) / STEP); k++) step();
    await stroke(g);
  }
  const steps = Math.round((g.watch * 1000) / STEP);
  for (let k = 0; k <= steps; k++) {
    const c = field?.census();
    if (!c) break;
    let line = 0;
    for (let x = 0; x < c.line.length; x++) if ((c.line[x] ?? 0) > 0.75) line++;
    samples.push({
      at: k * STEP,
      row: bucketRow(c.line, 0.75),
      line,
      fromLeft: runFrom(c.line, 0.75, 1),
      fromRight: runFrom(c.line, 0.75, -1),
      loose: looseRuns(c.line, 0.75),
    });
    step();
    if (k % 30 === 0) await breathe();
  }
  return { gesture: g.name, what: g.what, samples, notes: read(samples) };
}

async function run(only?: string): Promise<Run[]> {
  if (out) out.textContent = '';
  const wrong = sane();
  if (wrong) {
    say(`cannot run: ${wrong}`);
    return [];
  }
  const runs: Run[] = [];
  for (const g of GESTURES) {
    if (only && g.name !== only) continue;
    say(`── ${g.name}: ${g.what}`);
    // Let the bar settle to whole before the next gesture, or a run inherits the
    // last one's damage and measures two cuts at once. Stepped rather than
    // waited: nothing heals in a page that is getting no frames.
    for (let k = 0; k < 240; k++) {
      step();
      if (k % 30 === 0) await breathe();
    }
    const r = await play(g);
    // Every third sample: sixty rows a second is more than the shape needs, and
    // a timeline has to fit on a screen to be read at a glance.
    for (let k = 0; k < r.samples.length; k += 3) {
      const s = r.samples[k]!;
      say(`${String(Math.round(s.at)).padStart(5)}ms ${s.row}`);
    }
    for (const n of r.notes) say(`   → ${n}`);
    say('');
    runs.push(r);
  }
  return runs;
}

if (host) {
  field = mountGlowField(host, { playing: true }) ?? undefined;
  if (!field) say('no field: this machine has no WebGL2, or the shaders would not build');
  else document.body.classList.add('glow-live');
}

/**
 * Whether the bar is laid out at a size worth measuring.
 *
 * Checked, and loudly, because the failure is silent otherwise: a host with no
 * width mounts a two-pixel field whose entire bar sits under the cursor's own
 * radius, so every gesture misses it and every run reports an untouched line.
 * Which reads exactly like a field that has stopped tearing.
 */
function sane(): string | null {
  if (!field) return 'no field mounted';
  const w = host?.getBoundingClientRect().width ?? 0;
  if (w < 200) return `the bar is ${Math.round(w)}px wide — nothing measured here means anything`;
  const c = field.census();
  if (!c) return 'the census could not be read back off the card';
  return null;
}

runBtn?.addEventListener('click', () => {
  let only: string | undefined;
  pickers.forEach((p) => {
    if (p.checked && p.value !== 'all') only = p.value;
  });
  runBtn.disabled = true;
  void run(only).finally(() => {
    runBtn.disabled = false;
  });
});

/**
 * The driver's way in.
 *
 * `run('sweep')` hands back the whole timeline as data. The rest is for taking a
 * heal apart a step at a time: `cut` lays one down, `step` advances a single
 * frame, and `at` prints a stretch of columns with the age of each — which is the
 * only way to see whether a front is leaping as far as it is entitled to, or
 * whether it is leaving holes behind it.
 */
Object.assign(window, {
  glowLab: {
    run,
    gestures: GESTURES,
    cut: (name: string) => {
      const g = GESTURES.find((x) => x.name === name) ?? GESTURES[0]!;
      return stroke(g);
    },
    settle: (frames = 240) => {
      for (let k = 0; k < frames; k++) step();
    },
    step: (frames = 1) => {
      for (let k = 0; k < frames; k++) step();
    },
    /**
     * A step of any length. Ask for four milliseconds and the field takes a
     * single substep, which is the granularity a front actually advances at and
     * the only way to see how far it goes per step rather than per frame.
     */
    pump: (ms: number) => field?.pump(ms),
    at: (from: number, to: number) => {
      const c = field?.census();
      if (!c) return null;
      const line: number[] = [];
      const age: number[] = [];
      const ready: number[] = [];
      for (let x = from; x < to; x++) {
        line.push(Number((c.line[x] ?? 0).toFixed(2)));
        age.push(Math.round((c.age[x] ?? 0) * 1000));
        ready.push(Number((c.ready[x] ?? 0).toFixed(2)));
      }
      return { line, ageMs: age, ready };
    },
  },
});
