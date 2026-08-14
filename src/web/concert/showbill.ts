/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The bill, printed.
 *
 * Two things wear the same sheet of paper, and that is the design rather than a
 * saving:
 *
 *  - the **opening bill**, hanging in front of a closed curtain. Clicking it is
 *    what starts the show — and, conveniently, the gesture Web Audio has been
 *    waiting for since the page loaded.
 *  - the **programme**, reachable at any point mid-show. It marks the number
 *    playing and how far through it is, and it carries the seed, the link to
 *    this evening, and a copy control on each row for that number alone. **The
 *    music does not stop.** It is an overlay, not a pause, and a programme you
 *    can open mid-show without the band noticing is a thing real theatres have.
 *
 * Which is why the paper never quite leaves: once the show has started, a
 * corner of it stays in the bottom of the frame — the **tab** — and touching it
 * brings the programme back. A key nobody was told about is not a way in, and
 * on a phone it is not even that; the programme in your lap is.
 *
 * One implementation, because they are one object: the audience is looking at
 * the same piece of paper the second time, and building two would guarantee
 * they drifted apart.
 *
 * ## Era in the paper, genre in the layout
 *
 * A 1968 tanssilava bill and a 1997 ambient handout are not the same document
 * with different words in it, and printing "1974" in a caption is the laziest
 * possible way to say when something is from — it tells the reader a fact
 * instead of giving them an impression. So the era chooses the **paper and the
 * face**: cream stock and a letterpressed serif for the dance pavilion, buff
 * card and deco rules for the swing era, a photocopied manila sheet in
 * typewriter type for the tape years. The genre chooses the **layout**: a
 * poster is centred and shouts, a club card is a tight left-aligned list, a
 * gallery handout is mostly empty space.
 *
 * Nothing external: system font stacks only, backgrounds built from gradients,
 * no fetches. A programme that needs the network to look right is a programme
 * that looks wrong on the one night the network is bad.
 *
 * ## What the show runner gets
 *
 * `renderBill()` returns a `BillView` and that is the entire surface. It never
 * touches the document on its own — the caller appends `view.el` — and it never
 * decides anything about the show. It reports clicks; the state machine decides
 * what they mean. See `BillView` for each method.
 */

import { Rng } from '../../core/rng.js';
import { billDuration, billHouse, billTime } from '../../concert/showbill.js';
import type { BillEntry, ConcertOptions, Venue } from '../../concert/types.js';
import { formatChaosMixing } from '../../genre/chaos.js';

// ---------------------------------------------------------------------------
// The public surface
// ---------------------------------------------------------------------------

export type BillMode = 'hidden' | 'opening' | 'programme';

/**
 * How far `fitToWindow` may shrink the paper before it gives up and scrolls.
 *
 * A little over half size, which on the smallest sheet here is around seven
 * point — the size of the small print on a real theatre programme, and about
 * where one stops being a document you read and becomes one you squint at. A
 * window short enough to need less than this is a window the bill should be
 * scrolled in.
 */
const MIN_FIT = 0.55;

/**
 * A rendered bill, and everything the show runner may do to it.
 *
 * Deliberately small. Every method is either "show me" or "here is what
 * changed"; none of them knows what a curtain is.
 */
export interface BillView {
  /**
   * The root element, `position: fixed` and covering the viewport. Append it
   * once, anywhere — `#overlay` is the natural home. It starts hidden.
   *
   * "Hidden" means the paper is down, not that the element is gone: once the
   * show has begun the root keeps the tab in the corner, and it lets every
   * click through everywhere else, so the stage underneath still catches
   * tomatoes.
   */
  readonly el: HTMLElement;

  /** What is on screen right now. */
  mode(): BillMode;

  /**
   * Put the bill up.
   *
   * `'opening'` hangs it in front of the curtain: no dimming behind it, a
   * slight tilt, and a click anywhere on it fires `onStart`. `'programme'`
   * dims the stage behind it, shows the close control and the running marker,
   * and a click on the sheet does *not* start anything.
   */
  show(mode: 'opening' | 'programme'): void;

  /** Take it down. Fires `onDismiss` if it was the programme. */
  hide(): void;

  /**
   * `P` behaviour: open the programme, or close it if it is already up.
   *
   * Does nothing while the opening bill is hanging. There is no show behind it
   * to go back to, and a key that turned the opening bill into a programme
   * would take the start click away with it.
   */
  toggleProgramme(): void;

  /**
   * Mark the number playing and how far through it is, `progress` 0..1.
   *
   * Safe and cheap to call every frame — it writes only when something has
   * actually changed, so the common case is two comparisons. Pass `-1` to mark
   * nothing, which is what the interval between numbers looks like.
   */
  mark(index: number, progress: number): void;

  /** The click that starts the show. Only ever fires in `opening` mode. */
  onStart(fn: () => void): void;

  /** The programme was dismissed. The show never stopped, so nothing resumes. */
  onDismiss(fn: () => void): void;

  /**
   * Bind `P` to toggle and `Escape` to close, on `window` by default.
   *
   * Offered rather than assumed: input routing belongs to the show runner, and
   * a page that binds keys behind its owner's back is a page with a bug in it
   * later. Returns the unbind. Ignores keystrokes aimed at a text field.
   */
  bindKeys(target?: EventTarget): () => void;

  /** Remove the element and drop every listener. */
  destroy(): void;
}

/**
 * Print a bill.
 *
 * `opts` is the concert's own options and is used for two things: the seed and
 * the link on the programme, and — when they are set — the genre and era that
 * choose the house style.
 * When they are not set, the house is recovered from the bill's own era labels
 * by `billHouse`, so a bill printed from a random seed still knows what decade
 * it is from.
 */
export function renderBill(
  bill: BillEntry[], venue: Venue, opts: ConcertOptions = {},
): BillView {
  injectStyles();

  const found = billHouse(bill);
  const house = houseStyle(opts.genre || found.genre, opts.era || found.era);
  const seed = String(opts.seed ?? '');

  // --- Structure ---------------------------------------------------------
  /**
   * The stock is named on the root as well as on the sheet, because the tab is
   * a corner of the same paper and has to be printed in the same ink. Nothing
   * else on the root draws, so the class costs a cascade and no pixels.
   */
  const root = el('div', `billhouse paper--${house.paper}`);
  root.dataset.mode = 'hidden';

  const scrim = el('div', 'billhouse__scrim');
  root.append(scrim);

  /**
   * The corner of the programme, left showing.
   *
   * It appears only once the bill has been up and come down — before that the
   * paper is the whole screen and a tab of it would be a tab of itself.
   */
  const tab = el('button', 'bill__tab');
  tab.type = 'button';
  tab.setAttribute('aria-label', 'Open the programme');
  tab.append(text('span', 'bill__tabword', 'programme'));
  root.append(tab);

  const sheet = el('article', `bill bill--${house.layout} paper--${house.paper}`);
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-label', `Programme — ${venue.label}`);
  sheet.tabIndex = -1;
  /**
   * The one place the seed reaches the paper.
   *
   * A programme that comes off the press perfectly square every time reads as a
   * screenshot of a programme. A degree of tilt and a couple of foxing marks
   * cost nothing and are the difference between "a panel" and "a thing someone
   * printed" — and being seeded, this evening's bill is crooked in exactly the
   * same way every time you reload it, which is the whole promise of the page.
   */
  const paperRng = new Rng(`${seed}:paper`);
  sheet.style.setProperty('--tilt', `${paperRng.float(-0.9, 0.9).toFixed(2)}deg`);
  if (house.aged) sheet.style.setProperty('--foxing', foxing(paperRng));
  root.append(sheet);

  const close = el('button', 'bill__close');
  close.type = 'button';
  close.setAttribute('aria-label', 'Back to the show');
  close.textContent = '×';
  sheet.append(close);

  const head = el('header', 'bill__head');
  head.append(
    text('div', 'bill__venue', venue.label),
    text('div', 'bill__word', house.word),
  );
  sheet.append(head);

  // --- The numbers -------------------------------------------------------
  const list = el('ol', 'bill__list');
  /**
   * Per-row copy is for an evening the setlist drew. A `song`-staged bill is
   * already one exact number from somewhere else (the radio), and a `piece=`
   * link would point at a different piece under the same seed.
   */
  const canCopyPiece = !opts.song;
  const rows = bill.map((entry) => {
    const li = el('li', 'bill__item');
    const meter = el('i', 'bill__meter');
    li.append(
      text('span', 'bill__num', numeral(entry.number, house.numeral)),
      text('span', 'bill__title', entry.title),
      text('span', 'bill__time', billTime(entry.seconds)),
      text('span', 'bill__style', entry.styleLabel),
      text('span', 'bill__blurb', entry.blurb),
      meter,
    );
    // The singer is a fact about the evening — they walk on for this one and
    // off again after — so it is marked, once, quietly, and never explained.
    if (entry.sung) li.append(text('span', 'bill__sung', 'sung'));
    if (canCopyPiece) {
      const pieceCopy = el('button', 'bill__piece-copy');
      pieceCopy.type = 'button';
      pieceCopy.textContent = 'copy';
      pieceCopy.setAttribute('aria-label', `Copy link to number ${entry.number}`);
      // Same reason the imprint stops the bubble: a click on the opening bill
      // is otherwise "begin", and a click on the programme sheet is fine but
      // must not also be read as a click on the scrim behind it.
      pieceCopy.addEventListener('click', (e) => {
        e.stopPropagation();
        const link = pieceShareUrl(opts, house.genre, entry.number);
        const done = (ok: boolean): void => {
          pieceCopy.textContent = ok ? 'copied' : 'copy';
          window.setTimeout(() => { pieceCopy.textContent = 'copy'; }, 1600);
        };
        navigator.clipboard?.writeText(link).then(() => done(true), () => done(false)) ?? done(false);
      });
      li.append(pieceCopy);
    }
    list.append(li);
    return { li, meter };
  });
  sheet.append(list);

  // --- The imprint -------------------------------------------------------
  /**
   * The colophon: how long the evening is, which evening it is, and how to hand
   * it to somebody else.
   *
   * The seed sits opposite the running time because that is where a printer
   * puts the plate number — small, in the margin of the last rule — and the
   * copy button sits against it because the seed is the thing it copies. Two
   * halves of one sentence, printed as one.
   *
   * It is a button and not a link: a link to the show you are already watching
   * is a link that reloads it, which is the one thing the audience did not ask
   * for; what they want is the address in their clipboard. Clicks inside the
   * imprint never reach the start handler, or copying the link off the opening
   * bill would also raise the curtain.
   */
  const share = shareUrl(opts, house.genre);

  const copy = el('button', 'bill__copy');
  copy.type = 'button';
  copy.textContent = 'copy link';

  const imprint = el('div', 'bill__imprint');
  imprint.addEventListener('click', (e) => e.stopPropagation());
  imprint.append(text('span', 'bill__seed', seed ? `seed ${seed}` : 'unseeded'), copy);

  const foot = el('footer', 'bill__foot');
  foot.append(
    text('span', 'bill__total', `${bill.length} numbers · ${billTime(billDuration(bill))}`),
    imprint,
  );
  sheet.append(foot);

  /**
   * The one line on the paper that is not printed on it.
   *
   * "Click anywhere to begin" is an instruction to the audience, not part of
   * the bill, so it goes where an usher's card goes: on its own, centred,
   * under everything else, in the accent the house prints its ink in. It is
   * last in the sheet because it is the last thing you should read.
   */
  const cue = text('div', 'bill__cue', '');
  sheet.append(cue);

  // --- Behaviour ---------------------------------------------------------
  const starters: (() => void)[] = [];
  const dismissers: (() => void)[] = [];
  let mode: BillMode = 'hidden';
  let markedAt = -1;
  let markedTo = -1;

  /**
   * Shrink the sheet until it fits the window.
   *
   * The stylesheet already scales the paper with the viewport, and on its own
   * that is not enough, because the one thing it cannot see is how long
   * tonight's bill is: three ambient pieces and five dance numbers are the same
   * document at very different heights, and the second one runs off the bottom
   * of a 1080-line screen while the first has room to spare. A rule written for
   * the worst case would print the short bill in tiny type for no reason.
   *
   * So the sheet is measured rather than guessed. `--fit` multiplies the one
   * knob everything else is set in, so the whole thing — type, margins, rules,
   * width — comes down together, exactly as if it had been printed smaller.
   *
   * Three passes, because the estimate is a ratio of heights and the paper is
   * not quite linear in it: smaller type rewraps the long titles onto fewer
   * lines, so one pass always lands a few pixels over and a few pixels over is
   * a scrollbar. It converges in two and the third is insurance; the pass aims
   * a pixel inside the room it has for the same reason.
   *
   * There is a floor. Past a certain point a programme has stopped being
   * readable and scrolling it is the better failure, which is what
   * `overflow: auto` is still there for.
   */
  const fitToWindow = (): void => {
    if (mode === 'hidden') return;
    let scale = 1;
    sheet.style.setProperty('--fit', '1');
    for (let pass = 0; pass < 3; pass++) {
      const room = sheet.clientHeight;
      const need = sheet.scrollHeight;
      if (room <= 0 || need <= room) break;
      scale = Math.max(MIN_FIT, (scale * (room - 1)) / need);
      sheet.style.setProperty('--fit', scale.toFixed(3));
    }
  };

  const setMode = (next: BillMode): void => {
    if (next === mode) return;
    const was = mode;
    mode = next;
    root.dataset.mode = next;
    // The tab is the way back, so there has to be somewhere to go back to: it
    // is printed only after a bill has been on screen once and come down.
    if (was !== 'hidden') root.classList.add('is-begun');
    cue.textContent = next === 'opening'
      ? 'click anywhere to begin'
      : next === 'programme' ? 'press P or Escape to go back' : '';
    // After the mode is on the element, not before: the close control and the
    // options block are printed by mode, so the sheet is a different height in
    // each and measuring the old one fits the wrong document.
    if (next !== 'hidden') fitToWindow();
    if (next === 'programme') sheet.focus({ preventScroll: true });
    if (next === 'hidden' && was === 'programme') for (const fn of dismissers) fn();
  };

  /**
   * Refit when the window changes shape.
   *
   * On `root`, which is `inset: 0` and therefore the window, rather than on the
   * sheet — the sheet is what this writes to, and an observer that watches what
   * it changes is a loop.
   */
  const resizer = new ResizeObserver(fitToWindow);
  resizer.observe(root);

  const onRootClick = (e: MouseEvent): void => {
    if (mode === 'opening') {
      for (const fn of starters) fn();
      return;
    }
    // In programme mode only the surround dismisses. Clicking the paper itself
    // does nothing, because reading a programme should not close it.
    if (mode === 'programme' && !sheet.contains(e.target as Node)) setMode('hidden');
  };
  root.addEventListener('click', onRootClick);

  const onClose = (e: MouseEvent): void => {
    e.stopPropagation();
    setMode('hidden');
  };
  close.addEventListener('click', onClose);

  /**
   * Stopped, or the same click reaches the root a moment later with the mode
   * already switched to `programme`, finds itself outside the sheet, and takes
   * the programme straight back down again.
   */
  const onTab = (e: MouseEvent): void => {
    e.stopPropagation();
    setMode('programme');
  };
  tab.addEventListener('click', onTab);

  const onCopy = (): void => {
    const done = (ok: boolean): void => {
      copy.textContent = ok ? 'copied' : share;
      window.setTimeout(() => { copy.textContent = 'copy link'; }, 1600);
    };
    // No clipboard permission, no problem: show the URL so it can be selected.
    navigator.clipboard?.writeText(share).then(() => done(true), () => done(false)) ?? done(false);
  };
  copy.addEventListener('click', onCopy);

  let unbind: (() => void) | undefined;

  const view: BillView = {
    el: root,
    mode: () => mode,
    show: (m) => setMode(m),
    hide: () => setMode('hidden'),
    toggleProgramme() {
      if (mode === 'opening') return;
      setMode(mode === 'programme' ? 'hidden' : 'programme');
    },
    mark(index, progress) {
      const clamped = index >= 0 && index < rows.length ? index : -1;
      if (clamped !== markedAt) {
        rows[markedAt]?.li.classList.remove('is-playing');
        rows[markedAt]?.li.removeAttribute('aria-current');
        rows[markedAt]?.li.classList.add('is-done');
        rows[clamped]?.li.classList.add('is-playing');
        // The colour and the mark in the margin say "this one" to the eye;
        // this is the same sentence said to a screen reader.
        rows[clamped]?.li.setAttribute('aria-current', 'true');
        markedAt = clamped;
        markedTo = -1;
      }
      const row = rows[clamped];
      if (!row) return;
      // Whole percent. A meter redrawn on every sub-pixel of a three-minute
      // number is sixty layout passes a second to say nothing new.
      const pct = Math.round(Math.min(Math.max(progress, 0), 1) * 100);
      if (pct !== markedTo) {
        row.meter.style.width = `${pct}%`;
        markedTo = pct;
      }
    },
    onStart: (fn) => { starters.push(fn); },
    onDismiss: (fn) => { dismissers.push(fn); },
    bindKeys(target = window) {
      unbind?.();
      const onKey = (e: Event): void => {
        const ev = e as KeyboardEvent;
        if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
        const on = ev.target as HTMLElement | null;
        if (on && (on.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(on.tagName))) return;
        if (ev.key === 'p' || ev.key === 'P') {
          ev.preventDefault();
          view.toggleProgramme();
        } else if (ev.key === 'Escape' && mode === 'programme') {
          ev.preventDefault();
          setMode('hidden');
        }
      };
      target.addEventListener('keydown', onKey);
      unbind = () => {
        target.removeEventListener('keydown', onKey);
        unbind = undefined;
      };
      return unbind;
    },
    destroy() {
      unbind?.();
      resizer.disconnect();
      root.removeEventListener('click', onRootClick);
      close.removeEventListener('click', onClose);
      tab.removeEventListener('click', onTab);
      copy.removeEventListener('click', onCopy);
      starters.length = dismissers.length = 0;
      root.remove();
    },
  };
  return view;
}

// ---------------------------------------------------------------------------
// House style
// ---------------------------------------------------------------------------

interface House {
  genre: string;
  /** How the programme is set out. */
  layout: 'poster' | 'card' | 'handout';
  /** Which stock it is printed on, and therefore which face it is set in. */
  paper: string;
  /** The word above the list. A tanssilava does not say "Programme". */
  word: string;
  numeral: 'roman' | 'arabic' | 'none';
  /** Aged stock gets foxing marks. Coated and digital-era stock does not. */
  aged: boolean;
}

/**
 * Eight house styles, one per genre-and-era the generator can produce.
 *
 * The pairs are what the tables already say and this only translates them into
 * print. A 1968 dance pavilion advertised itself on a cream poster in a
 * letterpressed serif with the numbers in Roman; a 1985 iskelmäpop bill is
 * glossy, geometric and magenta; a swing-era club printed deco rules on buff
 * card; Blue Note put a grotesque hard against the left margin and threw the
 * rest away; ambient stopped printing anything at all and handed out a sheet of
 * A5 with lowercase type in the corner of it.
 *
 * An unrecognised pair falls back to a plain card rather than to nothing, so a
 * fourth genre gets a legible bill on the day it is added and a slightly dull
 * one until somebody writes it a house.
 */
function houseStyle(genre: string, era: string): House {
  const key = `${genre}:${era}`;
  const houses: Record<string, House> = {
    'iskelma:tanssilava': { genre, layout: 'poster', paper: 'lava', word: 'Ohjelma', numeral: 'roman', aged: true },
    'iskelma:eighties': { genre, layout: 'poster', paper: 'neon', word: 'Ohjelma', numeral: 'arabic', aged: false },
    'jazz:swingera': { genre, layout: 'card', paper: 'buff', word: 'Tonight', numeral: 'roman', aged: true },
    'jazz:bop': { genre, layout: 'card', paper: 'bop', word: 'Tonight', numeral: 'arabic', aged: false },
    'jazz:modern': { genre, layout: 'card', paper: 'modern', word: 'Tonight', numeral: 'arabic', aged: false },
    'ambient:tape': { genre, layout: 'handout', paper: 'manila', word: 'programme', numeral: 'arabic', aged: true },
    'ambient:sampler': { genre, layout: 'handout', paper: 'gloss', word: 'programme', numeral: 'arabic', aged: false },
    'ambient:hybrid': { genre, layout: 'handout', paper: 'pale', word: 'programme', numeral: 'none', aged: false },
  };
  return houses[key]
    ?? { genre, layout: 'card', paper: 'bop', word: 'Programme', numeral: 'arabic', aged: false };
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

function numeral(n: number, style: House['numeral']): string {
  if (style === 'none') return '';
  if (style === 'roman') return ROMAN[n] ?? String(n);
  return `${n}.`;
}

/** A few age spots, as radial gradients. Seeded, so the paper is always this paper. */
function foxing(rng: Rng): string {
  const spots: string[] = [];
  for (let i = 0; i < 4; i++) {
    spots.push(
      `radial-gradient(circle at ${rng.int(4, 96)}% ${rng.int(4, 96)}%, `
      + `rgba(120, 88, 40, ${(rng.float(0.025, 0.055)).toFixed(3)}) 0, `
      + `rgba(120, 88, 40, 0) ${rng.int(6, 16)}%)`,
    );
  }
  return spots.join(', ');
}

/**
 * `concert?seed=…&genre=…&vocals=…` — the same show, for somebody else.
 *
 * Built from the current location rather than from a hard-coded path, so it
 * survives being served from a subdirectory. The era is only included when the
 * caller pinned it: normally the seed decides, and a link that spells out every
 * derived field is a link that stops working the day a default changes.
 *
 * **The chimera is not derived and has to be spelled out.** A chaos evening
 * plays the host genre's repertoire in the host's room — that is the whole
 * design — so a link without `chaos` reproduces a real, coherent, *different*
 * show rather than failing, and nobody would notice they had been handed the
 * plain one. The kinds go in as the comma list `optionsFromUrl` reads back.
 *
 * `spread` follows the era's rule rather than the kinds': it is emitted only
 * when the caller set it, because an omitted spread means the same default at
 * both ends of the link and writing it out would pin today's 0.5 into every
 * share.
 *
 * `piece` is never written here. The imprint is the evening; a single number
 * is copied from its own row via `pieceShareUrl`.
 */
function shareUrl(opts: ConcertOptions, genre: string): string {
  const url = new URL(window.location.href);
  url.search = '';
  if (opts.seed) url.searchParams.set('seed', String(opts.seed));
  const g = opts.genre || genre;
  if (g) url.searchParams.set('genre', g);
  if (opts.era) url.searchParams.set('era', opts.era);
  if (opts.vocals) url.searchParams.set('vocals', opts.vocals);
  if (opts.numbers) url.searchParams.set('numbers', String(opts.numbers));
  if (opts.chaos?.levels?.length) {
    url.searchParams.set('chaos', opts.chaos.levels.join(','));
    if (opts.chaos.spread !== undefined) url.searchParams.set('spread', String(opts.chaos.spread));
    // Per-kind rates on the same rule as the spread: written only when the
    // caller set them, so a plain chaos link stays a plain chaos link.
    if (opts.chaos.mixing) url.searchParams.set('mix', formatChaosMixing(opts.chaos.mixing));
    if (opts.chaos.seed) url.searchParams.set('chaosSeed', String(opts.chaos.seed));
  }
  return url.toString();
}

/** The same evening, stopped at one programme number. */
function pieceShareUrl(opts: ConcertOptions, genre: string, piece: number): string {
  const url = new URL(shareUrl(opts, genre));
  url.searchParams.set('piece', String(piece));
  return url.toString();
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K, className: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  return node;
}

function text<K extends keyof HTMLElementTagNameMap>(
  tag: K, className: string, content: string,
): HTMLElementTagNameMap[K] {
  const node = el(tag, className);
  node.textContent = content;
  return node;
}

// ---------------------------------------------------------------------------
// The press
// ---------------------------------------------------------------------------

const STYLE_ID = 'concert-bill-style';

/**
 * All of it, injected once.
 *
 * A stylesheet rather than inline styles because half of what makes a bill look
 * printed is what happens between the elements — the rule under a title, the
 * space above a blurb, the way the numbers hang in the margin — and none of
 * that can be said in a `style` attribute. Everything is namespaced under
 * `.billhouse` so it cannot leak into the page that hosts it.
 */
function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.append(style);
}

const CSS = `
.billhouse {
  position: fixed; inset: 0; z-index: 40;
  display: flex; align-items: center; justify-content: center;
  /* vmin rather than vw: on a wide monitor the margin that runs out first is
     the one above and below the paper, and 3vw of a 32:9 screen is a hand's
     width of nothing on each side while the sheet is overflowing vertically. */
  padding: clamp(.5rem, 2.4vmin, 2.5rem);
  cursor: pointer;
}
/* Down, not gone. The root stays in the page to carry the tab, so everywhere
   except the tab it has to be a hole: a fixed sheet of glass over the stage
   would swallow every tomato thrown for the rest of the evening. */
.billhouse[data-mode="hidden"] { pointer-events: none; }
.billhouse[data-mode="hidden"] .billhouse__scrim,
.billhouse[data-mode="hidden"] .bill { display: none; }

/* --- The tab -------------------------------------------------------------- */
/* Not a tab: a corner of the programme itself, slid half out of the bottom
   right of the frame the way it slides off your knee. The whole sheet is there
   — same stock, same ink, a few degrees askew — and two of its edges are off
   the screen, so what you see is a corner and the word printed on it. Reaching
   for it pulls it a little further into the room.

   It is the only piece of furniture the show puts on top of the picture, so it
   sits in the corner away from the exit link, carries one word, and stays quiet
   until looked at: a hairline of a shadow to lift it off the stage, and nothing
   else printed on it.

   Sized in \`rem\`, alone on the sheet: everything else scales with \`--fit\`,
   which is a measurement of the paper, and this corner is not on the paper. */
.bill__tab {
  position: fixed; display: none; pointer-events: auto;
  /* How much of the sheet is off the screen, said in the offsets rather than in
     a transform: past the frame by 3rem across and 4rem down. What is left
     is a band of stock a little larger than the word printed on it, which is
     the whole of what this has to be — enough paper to read PROGRAMME off, and
     not a scrap more taken from the stage. It was a \`translate\` first and that
     was a trap: a translation after a rotation runs along the rotated axes, so
     the numbers in it are not the gap they produce, and the word ended up below
     the bottom of the screen.

     \`fixed\`, against the viewport, and that is the point of it. An absolute
     child is placed against the root's padding box, so the offsets had to undo
     that padding — and the padding is \`vmin\`, which starts tracking the width
     the moment a window is narrower than it is tall. The corner rose as the
     page was squeezed, which is a strange thing for a piece of paper to do.
     The 1.1rem that padding used to be worth on a desktop is folded into the
     numbers above, so the corner shows what it showed on a wide screen and goes
     on showing exactly that at every other shape. */
  right: calc(env(safe-area-inset-right, 0px) - 3rem);
  bottom: calc(env(safe-area-inset-bottom, 0px) - 4rem);
  width: 12.5rem; height: 6rem; padding: 1rem 0 0 1.45rem;
  /* Flex, and not for layout: a \`button\` centres its own content in its box
     whatever the padding says, and the word has to sit at the top left of the
     sheet — the part of it that is on screen. */
  align-items: flex-start; justify-content: flex-start;
  border: 0; text-align: left;
  /* The title face at the title's weight: this word is the heading of the sheet
     it is a corner of, and setting it in the text face made it read as a label
     stuck on the paper rather than something printed with it. */
  font-family: var(--display); font-weight: var(--display-weight);
  font-size: .72rem; line-height: 1;
  letter-spacing: .24em; text-transform: uppercase;
  color: var(--ink-dim); background: var(--stock); cursor: pointer;
  box-shadow: -.05rem -.15rem .9rem rgba(0, 0, 0, .28);
  /* Tilted about the corner it is leaving through, and clockwise: the far edge
     rises into the room, which is what opens the wedge. Anticlockwise drops it
     back towards the frame and takes the visible band with it. */
  transform-origin: 100% 100%;
  transform: rotate(5deg);
  transition: transform .28s ease, color .28s ease;
}
.billhouse.is-begun[data-mode="hidden"] .bill__tab { display: flex; }
.bill__tab:hover, .bill__tab:focus-visible {
  color: var(--ink); transform: rotate(5deg) translate(-.5rem, -.7rem);
}

.billhouse__scrim {
  position: absolute; inset: 0; background: rgba(6, 4, 3, 0);
  transition: background .35s ease;
}
/* The programme dims the show behind it. The opening bill does not — there is a
   closed curtain back there and it is worth looking at. */
.billhouse[data-mode="programme"] .billhouse__scrim { background: rgba(6, 4, 3, .62); }

/* One knob, and the whole sheet is set in \`em\` off it.
   A programme is a physical object and it scales like one: the type, the
   margins, the rules and the width all move together, or it stops being a piece
   of paper and becomes a panel whose text happens to have got smaller. The
   viewport term handles a phone; \`--fit\`, written by \`fitToWindow\`, handles the
   case CSS cannot see — how many numbers are on tonight's bill. */
.bill {
  position: relative; cursor: default;
  font-size: calc(clamp(.62rem, 2.15vw + .2rem, 1rem) * var(--fit, 1));
  width: min(38em, 100%); max-height: 100%;
  overflow: auto; overscroll-behavior: contain;
  padding: 2.6em 2.8em 1.8em;
  color: var(--ink);
  font-family: var(--face);
  background-color: var(--stock);
  background-image: var(--foxing, none), var(--grain, none);
  box-shadow: 0 1.6em 3.5em rgba(0, 0, 0, .55), 0 .2em .5em rgba(0, 0, 0, .35);
  transform: rotate(var(--tilt, 0deg));
  transition: transform .3s ease;
}
.billhouse[data-mode="programme"] .bill { transform: rotate(0deg); }
.bill:focus { outline: none; }
.bill::selection, .bill *::selection { background: var(--accent); color: var(--stock); }

.bill__close {
  position: absolute; top: .45em; right: .55em;
  width: 1.7em; height: 1.7em; padding: 0;
  border: 1px solid var(--hair); border-radius: 50%;
  background: transparent; color: var(--ink-dim);
  font: inherit; font-size: 1.1em; line-height: 1; cursor: pointer;
  display: none;
}
.billhouse[data-mode="programme"] .bill__close { display: block; }
.bill__close:hover { color: var(--ink); border-color: var(--accent); }

.bill__head { text-align: inherit; margin-bottom: 1.4em; }
.bill__venue {
  font-family: var(--display); font-size: var(--venue-size);
  letter-spacing: var(--venue-track); text-transform: var(--venue-case);
  font-weight: var(--display-weight); line-height: 1.1;
}
/* Spacing on an element that also sets its own \`font-size\` is divided through
   by it — \`em\` on such an element measures against the size it just took, not
   against the sheet — so the printed result is what it always was and only the
   knob moves it. */
.bill__word {
  margin-top: .66em; font-size: .68em; letter-spacing: .28em;
  text-transform: uppercase; color: var(--accent);
}

.bill__list { list-style: none; margin: 0; padding: 0; }
.bill__item { position: relative; }
.bill__num {
  font-family: var(--display); color: var(--ink-dim);
  font-variant-numeric: tabular-nums;
}
.bill__title {
  font-family: var(--display); font-weight: var(--display-weight);
  font-size: var(--title-size); letter-spacing: var(--title-track);
  text-transform: var(--title-case); line-height: 1.12;
  /* Generated titles run long — "Half-remembered transmitter", "Study for four
     waterlines" — and without a floor of zero the grid column sizes itself to
     the longest word, walks the title off the paper and takes the duration with
     it. break-word rather than anywhere, on purpose: anywhere also shrinks the
     intrinsic minimum, so the column collapses and every long title is broken
     mid-syllable into "MONTM / ARTRE", which looks far worse than the overflow
     it was fixing. */
  min-width: 0; overflow-wrap: break-word;
}
.bill__time { font-variant-numeric: tabular-nums; color: var(--ink-dim); }
.bill__style { color: var(--ink-dim); font-style: italic; }
.bill__blurb { color: var(--ink); }
.bill__blurb::before { content: '\\201C'; }
.bill__blurb::after { content: '\\201D'; }
.bill__sung {
  font-size: .6em; letter-spacing: .2em; text-transform: uppercase;
  color: var(--accent); border: 1px solid var(--accent);
  padding: .08em .5em; border-radius: .17em; white-space: nowrap;
}
/* How far through the number we are. A hairline under the row, not a widget:
   the programme is telling you where you are, not offering you a scrub bar. */
.bill__meter {
  position: absolute; left: 0; bottom: 0; height: 2px; width: 0;
  background: var(--accent); opacity: 0; transition: width .25s linear;
}
.bill__item.is-playing .bill__meter { opacity: .85; }
.bill__item.is-playing .bill__title { color: var(--accent); }
.bill__item.is-done { opacity: .5; }
/* Which one is going on right now.
   A tick in the margin, the mark a person makes on their own programme with a
   thumbnail. It runs the height of the number rather than sitting at a fixed
   offset down it, so it lands correctly on all three layouts and on a row that
   has wrapped onto four lines — there is no line to align to that they agree
   on. It breathes, slowly, because the meter beneath it only says how far
   through we are and something in the margin should say that we are still
   going. Everything else on the sheet is already saying which number this is;
   this only has to be enough to find. */
.bill__item::before {
  content: ''; position: absolute; left: -1em; top: .5em; bottom: .5em;
  width: 2px; background: var(--accent);
  opacity: 0; transition: opacity .45s ease;
}
.bill__item.is-playing::before { opacity: .8; animation: bill-breathe 2.8s ease-in-out infinite; }
@keyframes bill-breathe { 50% { opacity: .3; } }

/* Baseline, not stretch and not centre. Left to itself the running time hangs
   from the top of a row whose height is set by a button, which is taller than
   type; centring the boxes instead puts it two pixels low, because the seed
   beside it is set in mono and a mono face does not divide its line the way a
   text face does. Two words on one line look level when they sit on one
   baseline, so that is what they are given.

   The gap is the distance the two ends keep when the sheet is narrow enough to
   bring them together — at that point they are one line of small caps running
   into another, and they need more air between them than a word space. */
.bill__foot {
  margin-top: 2.35em; padding-top: 1.03em; border-top: 1px solid var(--hair);
  display: flex; justify-content: space-between; align-items: baseline;
  gap: .6em 2.6em; flex-wrap: wrap;
  font-size: .68em; letter-spacing: .1em; text-transform: uppercase;
  color: var(--ink-dim);
}
/* The plate number in the margin. Mono, and never uppercased: a seed is a
   string somebody may read off the paper and type back in, and shouting it
   would change what it says. */
.bill__seed { font-family: var(--mono); text-transform: none; letter-spacing: .04em; }

/* The usher's line. Centred under everything, on its own, in the house ink,
   under the dashed rule that used to sit over the controls — the instruction is
   not part of the bill and the rule is what says so.

   The colophon sits between two rules and sits between them evenly. Both
   elements are set at the same size, so the same number would be the same
   distance — but the foot's 1.03em is measured from the far side of its own
   rule, and the ink is what a reader compares, so this is that 1.03em plus the
   hairline and the sliver of line box the other gap gets for free. Measured,
   not guessed: 12.3px of stage above the row and 12.3 below. */
.bill__cue {
  margin-top: 1.3em; padding-top: 1.6em; border-top: 1px dashed var(--hair);
  text-align: center;
  font-size: .68em; letter-spacing: .18em; text-transform: uppercase;
  color: var(--accent);
}
.bill__cue:empty { display: none; }

/* The seed and the button that copies it, set as one item so the foot's
   \`space-between\` puts the pair against the right margin and the running time
   against the left, rather than spreading three things across the page. */
/* Baseline inside as well as outside, and that is load-bearing rather than
   tidy: a flex container hands its parent the baseline of its first item, and
   only if that item is baseline-aligned itself — centre the contents and the
   box has no baseline to give, so the foot falls back to the imprint's bottom
   edge and drops the running time a line-descent below the seed. */
.bill__imprint {
  display: inline-flex; align-items: baseline; gap: .9em;
  cursor: default;
}
/* Not uppercased, for the same reason the seed is not: when the clipboard is
   refused this button prints the URL itself, and a shouted address reads as a
   broken one. */
.bill__copy {
  font: inherit; text-transform: none; letter-spacing: .02em;
  cursor: pointer; color: var(--ink-dim);
  background: transparent; border: 1px solid var(--hair); border-radius: .21em;
  padding: .21em .63em;
}
.bill__copy:hover { color: var(--ink); border-color: var(--accent); }

/* A quieter twin of the imprint's copy: one number, not the evening. It sits
   at the bottom-right of its row — under the duration, opposite the sung pill —
   and stays off the paper until the row is hovered. Always-visible chrome on
   every number reads as UI on a programme. */
.bill__piece-copy {
  position: absolute; right: .45em; bottom: .85em; z-index: 1;
  font: inherit; font-size: .72em; letter-spacing: .04em; text-transform: none;
  cursor: pointer; color: var(--ink-dim);
  background: transparent; border: 1px solid var(--hair); border-radius: .21em;
  padding: .15em .5em; margin: 0;
  opacity: 0; pointer-events: none;
  transition: opacity .08s ease;
}
.bill__item:hover .bill__piece-copy,
.bill__item:focus-within .bill__piece-copy {
  opacity: 1; pointer-events: auto;
}
.bill__piece-copy:hover { color: var(--ink); border-color: var(--accent); }
/* Touch has no hover: keep the control findable without planting four buttons
   in the eye. Dim until the row is focused or tapped into. */
@media (hover: none) {
  .bill__piece-copy { opacity: .4; pointer-events: auto; }
  .bill__item:focus-within .bill__piece-copy { opacity: 1; }
}

/* --- Layout: the poster ------------------------------------------------- */
/* A dance-pavilion bill is centred, symmetrical and shouts the title. The
   ornament between numbers is doing the job a rule would do on a card. */
.bill--poster { text-align: center; }
.bill--poster .bill__item { padding: .8em 0 .9em; }
.bill--poster .bill__item + .bill__item { border-top: 1px solid var(--hair); }
.bill--poster .bill__num { display: block; font-size: .72em; letter-spacing: .3em; margin-bottom: .49em; }
.bill--poster .bill__title { display: block; }
.bill--poster .bill__time::before { content: '· '; }
.bill--poster .bill__time::after { content: ' ·'; }
.bill--poster .bill__time, .bill--poster .bill__style {
  display: inline; font-size: .82em; letter-spacing: .06em;
}
.bill--poster .bill__blurb { display: block; margin-top: .58em; font-size: .86em; font-style: italic; }
.bill--poster .bill__sung { display: inline-block; margin-top: .92em; }
.bill--poster .bill__foot { justify-content: center; }

/* --- Layout: the club card ---------------------------------------------- */
/* Left margin, hard. The number hangs outside the text block and the title,
   duration and style sit on one line, which is what fits on a card small
   enough to be left on a table. */
.bill--card .bill__item {
  display: grid; grid-template-columns: 2.1em minmax(0, 1fr) 2.9em;
  column-gap: .8em; align-items: baseline; padding: .85em 0;
}
.bill--card .bill__item + .bill__item { border-top: 1px solid var(--hair); }
.bill--card .bill__num { grid-column: 1; font-size: .8em; }
.bill--card .bill__title { grid-column: 2; }
.bill--card .bill__time { grid-column: 3; font-size: .85em; text-align: right; }
.bill--card .bill__style { grid-column: 2 / 4; font-size: .78em; margin-top: .19em; }
.bill--card .bill__blurb { grid-column: 2 / 4; font-size: .84em; margin-top: .36em; font-style: italic; }
.bill--card .bill__sung { grid-column: 2 / 4; justify-self: start; margin-top: .75em; }

/* --- Layout: the gallery handout ---------------------------------------- */
/* Almost nothing. No rules, no capitals, generous space, the duration set
   right and small. A genre that refuses to have a foreground gets a bill that
   refuses to have a headline. */
.bill--handout .bill__item {
  display: grid; grid-template-columns: minmax(0, 1fr) 2.6em; column-gap: 1.2em;
  padding: 1.35em 0 0;
}
.bill--handout .bill__num { grid-column: 1; font-size: .66em; letter-spacing: .2em; opacity: .6; }
.bill--handout .bill__title { grid-column: 1; }
.bill--handout .bill__time { grid-column: 2; grid-row: 2; font-size: .74em; align-self: end; }
.bill--handout .bill__style { grid-column: 1; font-size: .72em; margin-top: .28em; font-style: normal; }
.bill--handout .bill__blurb { grid-column: 1 / 3; font-size: .8em; margin-top: .56em; opacity: .8; }
.bill--handout .bill__sung { grid-column: 1; justify-self: start; margin-top: .75em; border: 0; padding: 0; }
.bill--handout .bill__foot { border-top-color: transparent; }

/* --- Paper: 1960s–70s tanssilava ---------------------------------------- */
/* Cream stock, brown-black ink, poster red. The face is a text serif set far
   too large with far too much tracking, which is exactly what a jobbing
   printer did with the type he had. */
.paper--lava {
  --stock: #efe2c4;
  --grain: repeating-linear-gradient(0deg, rgba(120, 96, 56, .05) 0 1px, transparent 1px 4px);
  --ink: #2c2318; --ink-dim: #7a6a50; --hair: #b9a680; --accent: #96301f;
  --face: Georgia, 'Iowan Old Style', 'Times New Roman', serif;
  --display: Georgia, 'Iowan Old Style', 'Times New Roman', serif;
  --mono: ui-monospace, Menlo, Consolas, monospace;
  --display-weight: 700;
  --venue-size: 1.4em; --venue-track: .3em; --venue-case: uppercase;
  --title-size: 1.72em; --title-track: .13em; --title-case: uppercase;
}
.paper--lava .bill__head { padding-bottom: .8em; border-bottom: 3px double var(--hair); }

/* --- Paper: 1980s iskelmäpop -------------------------------------------- */
/* Coated, glossy, and printed in two colours because that was now cheap.
   Geometric sans, tight, with a bar of accent instead of a rule. */
.paper--neon {
  --stock: #fbf6f8;
  --grain: linear-gradient(158deg, rgba(255, 255, 255, .9), rgba(233, 214, 231, .55));
  --ink: #1d1a22; --ink-dim: #766e80; --hair: #d8c8d6; --accent: #cf1f6e;
  --face: 'Avenir Next', Avenir, 'Trebuchet MS', ui-sans-serif, sans-serif;
  --display: 'Avenir Next', Avenir, 'Century Gothic', 'Futura', ui-sans-serif, sans-serif;
  --mono: ui-monospace, Menlo, Consolas, monospace;
  --display-weight: 800;
  --venue-size: 1.25em; --venue-track: .18em; --venue-case: uppercase;
  --title-size: 1.8em; --title-track: -.01em; --title-case: uppercase;
}
.paper--neon .bill__head { padding-bottom: .8em; border-bottom: .4em solid var(--accent); }

/* --- Paper: 1930s–40s swing --------------------------------------------- */
/* Buff card, deco double rules, a didone at small sizes with a lot of air
   around it. The blue is the second colour of the period's printing. */
.paper--buff {
  --stock: #e9dbba;
  --grain: repeating-linear-gradient(90deg, rgba(90, 70, 40, .035) 0 1px, transparent 1px 3px);
  --ink: #251d13; --ink-dim: #756244; --hair: #b6a179; --accent: #1d4463;
  --face: 'Iowan Old Style', Georgia, 'Times New Roman', serif;
  --display: Didot, 'Bodoni 72', 'Playfair Display', Georgia, serif;
  --mono: ui-monospace, Menlo, Consolas, monospace;
  --display-weight: 700;
  --venue-size: 1.28em; --venue-track: .34em; --venue-case: uppercase;
  --title-size: 1.6em; --title-track: .1em; --title-case: uppercase;
}
.paper--buff .bill__head {
  text-align: center; padding-bottom: .7em;
  border-bottom: 1px solid var(--hair); box-shadow: 0 4px 0 -3px var(--hair);
}

/* --- Paper: 1950s–60s bop ------------------------------------------------ */
/* Off-white, a grotesque hard against the left margin, one hairline and a lot
   of nerve. Reid Miles is the whole reference and he was mostly right. */
.paper--bop {
  --stock: #eae7df;
  --grain: none;
  --ink: #15161a; --ink-dim: #6d6e73; --hair: #c3c1b9; --accent: #c1471c;
  --face: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --display: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --mono: ui-monospace, Menlo, Consolas, monospace;
  --display-weight: 700;
  --venue-size: 1.35em; --venue-track: -.02em; --venue-case: uppercase;
  --title-size: 1.7em; --title-track: -.03em; --title-case: uppercase;
}
.paper--bop .bill__head { padding-bottom: .7em; border-bottom: 2px solid var(--ink); }

/* --- Paper: 1960s–70s modern -------------------------------------------- */
/* Warm grey, larger and looser, lowercase. The decade stopped shouting. */
.paper--modern {
  --stock: #ddd7cb;
  --grain: linear-gradient(180deg, rgba(255, 255, 255, .35), rgba(0, 0, 0, .04));
  --ink: #1e1c18; --ink-dim: #6f6a5f; --hair: #b3ac9e; --accent: #3c7d68;
  --face: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --display: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --mono: ui-monospace, Menlo, Consolas, monospace;
  --display-weight: 500;
  --venue-size: 1.3em; --venue-track: .02em; --venue-case: lowercase;
  --title-size: 1.9em; --title-track: -.02em; --title-case: lowercase;
}
.paper--modern .bill__head { padding-bottom: .9em; }

/* --- Paper: 1970s–80s tape ----------------------------------------------- */
/* A photocopy of a typewritten sheet, on whatever was in the tray. */
.paper--manila {
  --stock: #ded5bf;
  --grain: repeating-linear-gradient(0deg, rgba(70, 60, 40, .03) 0 2px, transparent 2px 5px);
  --ink: #3b362c; --ink-dim: #857d6c; --hair: #b8ae97; --accent: #6b5f45;
  --face: ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;
  --display: ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;
  --mono: ui-monospace, Menlo, Consolas, monospace;
  --display-weight: 400;
  --venue-size: .82em; --venue-track: .22em; --venue-case: uppercase;
  --title-size: 1.15em; --title-track: .08em; --title-case: uppercase;
}

/* --- Paper: 1990s sampler ------------------------------------------------ */
/* Bright, cold, tiny type in the corner of a large sheet. */
.paper--gloss {
  --stock: #edf0f1;
  --grain: none;
  --ink: #1e2329; --ink-dim: #79828b; --hair: #ccd3d7; --accent: #4f7d95;
  --face: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --display: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --mono: ui-monospace, Menlo, Consolas, monospace;
  --display-weight: 400;
  --venue-size: .8em; --venue-track: .16em; --venue-case: lowercase;
  --title-size: 1.2em; --title-track: .01em; --title-case: lowercase;
}

/* --- Paper: 2000s hybrid ------------------------------------------------- */
/* Almost not there. No numbers, hairlines, and type set as small as it can be
   and remain a document. */
.paper--pale {
  --stock: #eceef0;
  --grain: linear-gradient(180deg, #f2f4f5, #e5e8ea);
  --ink: #262a2e; --ink-dim: #8a9199; --hair: #d6dade; --accent: #7d8b96;
  --face: ui-sans-serif, 'Helvetica Neue', Arial, sans-serif;
  --display: ui-sans-serif, 'Helvetica Neue', Arial, sans-serif;
  --mono: ui-monospace, Menlo, Consolas, monospace;
  --display-weight: 300;
  --venue-size: .76em; --venue-track: .3em; --venue-case: lowercase;
  --title-size: 1.1em; --title-track: .06em; --title-case: lowercase;
}

/* --- One column, always -------------------------------------------------- */
/* A wide monitor used to get a centre spread: two columns of numbers, which
   halved the height and kept the foot above the fold. It was the tidier
   arrangement and the wrong one. A bill is a list you read straight down, and
   the moment it breaks in the middle the reader has to find where it went — on
   a programme that is also marking, in the margin, which number is playing, the
   mark can be halfway up the far side of the sheet with a header between it and
   the eye.

   So the numbers run top to bottom whatever shape the window is. When the list
   is longer than the screen the paper shrinks to fit, and past \`MIN_FIT\` it
   scrolls, which is what one does with a long programme. */

/* A calmed camera and a calmed programme. The tilt is decoration and the
   transitions are decoration; neither survives being asked not to move. */
@media (prefers-reduced-motion: reduce) {
  .billhouse__scrim, .bill, .bill__meter, .bill__tab, .bill__item::before,
  .bill__piece-copy { transition: none; }
  .bill { transform: none; }
  /* The tick stays — it is the indicator, not the decoration. It just stops
     breathing and sits at the steady end of its own range. */
  .bill__item.is-playing::before { animation: none; opacity: .8; }
}
@media (max-width: 30rem) {
  .bill--card .bill__item { grid-template-columns: 1.6em 1fr auto; column-gap: .5em; }
}
`;
