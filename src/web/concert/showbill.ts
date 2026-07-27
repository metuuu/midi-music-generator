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
 *    playing and how far through it is, and it carries the seed, the share link
 *    and the instrumental-only switch. **The music does not stop.** It is an
 *    overlay, not a pause, and a programme you can open mid-show without the
 *    band noticing is a thing real theatres have.
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
 * decides anything about the show. It reports clicks and option changes; the
 * state machine decides what they mean. See `BillView` for each method.
 */

import { Rng } from '../../core/rng.js';
import { billDuration, billHouse, billTime } from '../../concert/showbill.js';
import type { BillEntry, ConcertOptions, Venue, VocalPolicy } from '../../concert/types.js';

// ---------------------------------------------------------------------------
// The public surface
// ---------------------------------------------------------------------------

export type BillMode = 'hidden' | 'opening' | 'programme';

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

  /** `P` behaviour: open the programme, or close it if it is already up. */
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
   * The audience changed a switch on the programme.
   *
   * Reports the *whole* desired `ConcertOptions`, not a delta, because the only
   * sane response to "instrumental only" is to rebuild the concert from the
   * same seed — and the caller needs every field to do that. The bill does not
   * rebuild itself; it waits to be re-rendered with the new one.
   */
  onOptions(fn: (next: ConcertOptions) => void): void;

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
 * `opts` is the concert's own options and is used for three things: the seed
 * and the share link on the programme, the state of the instrumental switch,
 * and — when they are set — the genre and era that choose the house style.
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
  const root = el('div', 'billhouse');
  root.hidden = true;
  root.dataset.mode = 'hidden';

  const scrim = el('div', 'billhouse__scrim');
  root.append(scrim);

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
  const rows = bill.map((entry, i) => {
    const li = el('li', 'bill__item');
    const meter = el('i', 'bill__meter');
    li.append(
      text('span', 'bill__num', numeral(i + 1, house.numeral)),
      text('span', 'bill__title', entry.title),
      text('span', 'bill__time', billTime(entry.seconds)),
      text('span', 'bill__style', entry.styleLabel),
      text('span', 'bill__blurb', entry.blurb),
      meter,
    );
    // The singer is a fact about the evening — they walk on for this one and
    // off again after — so it is marked, once, quietly, and never explained.
    if (entry.sung) li.append(text('span', 'bill__sung', 'sung'));
    list.append(li);
    return { li, meter };
  });
  sheet.append(list);

  const foot = el('footer', 'bill__foot');
  foot.append(text('span', 'bill__total', `${bill.length} numbers · ${billTime(billDuration(bill))}`));
  const cue = text('span', 'bill__cue', '');
  foot.append(cue);
  sheet.append(foot);

  // --- Options -----------------------------------------------------------
  /**
   * The show's controls live on the programme rather than in a HUD.
   *
   * Two reasons and the second is the better one: the stage stays clean, and a
   * programme is where a person already expects to find out what they are
   * watching. Clicks inside this block never reach the start handler, or
   * ticking "instrumental only" on the opening bill would also raise the
   * curtain.
   */
  const optionsBox = el('div', 'bill__opts');
  optionsBox.addEventListener('click', (e) => e.stopPropagation());

  const vocalToggle = document.createElement('input');
  vocalToggle.type = 'checkbox';
  vocalToggle.id = `bill-instrumental-${Math.random().toString(36).slice(2, 8)}`;
  vocalToggle.checked = opts.vocals === 'instrumental';
  const vocalLabel = document.createElement('label');
  vocalLabel.className = 'bill__switch';
  vocalLabel.htmlFor = vocalToggle.id;
  vocalLabel.append(vocalToggle, document.createTextNode('instrumental only'));

  const link = document.createElement('a');
  link.className = 'bill__link';
  link.textContent = 'share this concert';
  link.href = shareUrl(opts, house.genre);
  link.rel = 'noopener';

  const copy = el('button', 'bill__copy');
  copy.type = 'button';
  copy.textContent = 'copy link';

  optionsBox.append(
    text('span', 'bill__seed', seed ? `seed ${seed}` : 'unseeded'),
    vocalLabel,
    link,
    copy,
  );
  sheet.append(optionsBox);

  // --- Behaviour ---------------------------------------------------------
  const starters: (() => void)[] = [];
  const dismissers: (() => void)[] = [];
  const optioners: ((next: ConcertOptions) => void)[] = [];
  /** So unticking the switch restores what the show was doing, not a guess. */
  let lastSung: VocalPolicy = opts.vocals && opts.vocals !== 'instrumental' ? opts.vocals : 'mixed';
  let mode: BillMode = 'hidden';
  let markedAt = -1;
  let markedTo = -1;

  const setMode = (next: BillMode): void => {
    if (next === mode) return;
    const was = mode;
    mode = next;
    root.hidden = next === 'hidden';
    root.dataset.mode = next;
    cue.textContent = next === 'opening'
      ? 'click anywhere to begin'
      : next === 'programme' ? 'press P or Escape to go back' : '';
    if (next === 'programme') sheet.focus({ preventScroll: true });
    if (next === 'hidden' && was === 'programme') for (const fn of dismissers) fn();
  };

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

  const onVocals = (): void => {
    const vocals: VocalPolicy = vocalToggle.checked ? 'instrumental' : lastSung;
    if (!vocalToggle.checked) lastSung = vocals;
    const next: ConcertOptions = { ...opts, vocals };
    link.href = shareUrl(next, house.genre);
    for (const fn of optioners) fn(next);
  };
  vocalToggle.addEventListener('change', onVocals);

  const onCopy = (): void => {
    const url = link.href;
    const done = (ok: boolean): void => {
      copy.textContent = ok ? 'copied' : url;
      window.setTimeout(() => { copy.textContent = 'copy link'; }, 1600);
    };
    // No clipboard permission, no problem: show the URL so it can be selected.
    navigator.clipboard?.writeText(url).then(() => done(true), () => done(false)) ?? done(false);
  };
  copy.addEventListener('click', onCopy);

  let unbind: (() => void) | undefined;

  const view: BillView = {
    el: root,
    mode: () => mode,
    show: (m) => setMode(m),
    hide: () => setMode('hidden'),
    toggleProgramme: () => setMode(mode === 'programme' ? 'hidden' : 'programme'),
    mark(index, progress) {
      const clamped = index >= 0 && index < rows.length ? index : -1;
      if (clamped !== markedAt) {
        rows[markedAt]?.li.classList.remove('is-playing');
        rows[markedAt]?.li.classList.add('is-done');
        rows[clamped]?.li.classList.add('is-playing');
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
    onOptions: (fn) => { optioners.push(fn); },
    bindKeys(target = window) {
      unbind?.();
      const onKey = (e: Event): void => {
        const ev = e as KeyboardEvent;
        if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
        const on = ev.target as HTMLElement | null;
        if (on && (on.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(on.tagName))) return;
        if (ev.key === 'p' || ev.key === 'P') {
          ev.preventDefault();
          // The opening bill is not a programme and P must not dismiss it —
          // there is no show behind it to go back to.
          if (mode !== 'opening') view.toggleProgramme();
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
      root.removeEventListener('click', onRootClick);
      close.removeEventListener('click', onClose);
      vocalToggle.removeEventListener('change', onVocals);
      copy.removeEventListener('click', onCopy);
      starters.length = dismissers.length = optioners.length = 0;
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
 * `concert.html?seed=…&genre=…&vocals=…` — the same show, for somebody else.
 *
 * Built from the current location rather than from a hard-coded path, so it
 * survives being served from a subdirectory. The era is only included when the
 * caller pinned it: normally the seed decides, and a link that spells out every
 * derived field is a link that stops working the day a default changes.
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
  padding: clamp(.75rem, 3vw, 2.5rem);
  cursor: pointer;
}
.billhouse[hidden] { display: none; }
.billhouse__scrim {
  position: absolute; inset: 0; background: rgba(6, 4, 3, 0);
  transition: background .35s ease;
}
/* The programme dims the show behind it. The opening bill does not — there is a
   closed curtain back there and it is worth looking at. */
.billhouse[data-mode="programme"] .billhouse__scrim { background: rgba(6, 4, 3, .62); }

.bill {
  position: relative; cursor: default;
  width: min(38rem, 100%); max-height: 100%;
  overflow: auto; overscroll-behavior: contain;
  padding: clamp(1.4rem, 4vw, 2.6rem) clamp(1.2rem, 4vw, 2.8rem) clamp(1rem, 3vw, 1.8rem);
  color: var(--ink);
  font-family: var(--face);
  background-color: var(--stock);
  background-image: var(--foxing, none), var(--grain, none);
  box-shadow: 0 1.6rem 3.5rem rgba(0, 0, 0, .55), 0 .2rem .5rem rgba(0, 0, 0, .35);
  transform: rotate(var(--tilt, 0deg));
  transition: transform .3s ease;
}
.billhouse[data-mode="programme"] .bill { transform: rotate(0deg); }
.bill:focus { outline: none; }
.bill::selection, .bill *::selection { background: var(--accent); color: var(--stock); }

.bill__close {
  position: absolute; top: .5rem; right: .6rem;
  width: 1.9rem; height: 1.9rem; padding: 0;
  border: 1px solid var(--hair); border-radius: 50%;
  background: transparent; color: var(--ink-dim);
  font: inherit; font-size: 1.1rem; line-height: 1; cursor: pointer;
  display: none;
}
.billhouse[data-mode="programme"] .bill__close { display: block; }
.bill__close:hover { color: var(--ink); border-color: var(--accent); }

.bill__head { text-align: inherit; margin-bottom: 1.4rem; }
.bill__venue {
  font-family: var(--display); font-size: var(--venue-size);
  letter-spacing: var(--venue-track); text-transform: var(--venue-case);
  font-weight: var(--display-weight); line-height: 1.1;
}
.bill__word {
  margin-top: .45rem; font-size: .68rem; letter-spacing: .28em;
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
  font-size: .6rem; letter-spacing: .2em; text-transform: uppercase;
  color: var(--accent); border: 1px solid var(--accent);
  padding: .05rem .3rem; border-radius: .1rem; white-space: nowrap;
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

.bill__foot {
  margin-top: 1.6rem; padding-top: .7rem; border-top: 1px solid var(--hair);
  display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
  font-size: .68rem; letter-spacing: .1em; text-transform: uppercase;
  color: var(--ink-dim);
}
.bill__cue { color: var(--accent); }

.bill__opts {
  margin-top: .9rem; padding-top: .8rem; border-top: 1px dashed var(--hair);
  display: none; align-items: center; gap: .5rem 1rem; flex-wrap: wrap;
  font-size: .72rem; color: var(--ink-dim); cursor: default;
}
.billhouse[data-mode="programme"] .bill__opts { display: flex; }
/* Worth having on the opening bill too: choosing instrumental-only before the
   curtain goes up is a legitimate thing to want, and the share link is most
   useful pointing at a show you have not spoiled for yourself yet. */
.billhouse[data-mode="opening"] .bill__opts { display: flex; }
.bill__seed { font-family: var(--mono); }
.bill__switch { display: inline-flex; align-items: center; gap: .35rem; cursor: pointer; }
.bill__switch input { accent-color: var(--accent); margin: 0; cursor: pointer; }
.bill__link { color: var(--accent); text-decoration: none; border-bottom: 1px solid currentColor; }
.bill__copy {
  font: inherit; font-size: .72rem; cursor: pointer; color: var(--ink-dim);
  background: transparent; border: 1px solid var(--hair); border-radius: .15rem;
  padding: .15rem .45rem;
}
.bill__copy:hover { color: var(--ink); border-color: var(--accent); }

/* --- Layout: the poster ------------------------------------------------- */
/* A dance-pavilion bill is centred, symmetrical and shouts the title. The
   ornament between numbers is doing the job a rule would do on a card. */
.bill--poster { text-align: center; }
.bill--poster .bill__item { padding: .8rem 0 .9rem; }
.bill--poster .bill__item + .bill__item { border-top: 1px solid var(--hair); }
.bill--poster .bill__num { display: block; font-size: .72rem; letter-spacing: .3em; margin-bottom: .35rem; }
.bill--poster .bill__title { display: block; }
.bill--poster .bill__time::before { content: '· '; }
.bill--poster .bill__time::after { content: ' ·'; }
.bill--poster .bill__time, .bill--poster .bill__style {
  display: inline; font-size: .82rem; letter-spacing: .06em;
}
.bill--poster .bill__blurb { display: block; margin-top: .5rem; font-size: .86rem; font-style: italic; }
.bill--poster .bill__sung { display: inline-block; margin-top: .55rem; }
.bill--poster .bill__foot { justify-content: center; }

/* --- Layout: the club card ---------------------------------------------- */
/* Left margin, hard. The number hangs outside the text block and the title,
   duration and style sit on one line, which is what fits on a card small
   enough to be left on a table. */
.bill--card .bill__item {
  display: grid; grid-template-columns: 2.1rem minmax(0, 1fr) 2.9rem;
  column-gap: .8rem; align-items: baseline; padding: .85rem 0;
}
.bill--card .bill__item + .bill__item { border-top: 1px solid var(--hair); }
.bill--card .bill__num { grid-column: 1; font-size: .8rem; }
.bill--card .bill__title { grid-column: 2; }
.bill--card .bill__time { grid-column: 3; font-size: .85rem; text-align: right; }
.bill--card .bill__style { grid-column: 2 / 4; font-size: .78rem; margin-top: .15rem; }
.bill--card .bill__blurb { grid-column: 2 / 4; font-size: .84rem; margin-top: .3rem; font-style: italic; }
.bill--card .bill__sung { grid-column: 2 / 4; justify-self: start; margin-top: .45rem; }

/* --- Layout: the gallery handout ---------------------------------------- */
/* Almost nothing. No rules, no capitals, generous space, the duration set
   right and small. A genre that refuses to have a foreground gets a bill that
   refuses to have a headline. */
.bill--handout .bill__item {
  display: grid; grid-template-columns: minmax(0, 1fr) 2.6rem; column-gap: 1.2rem;
  padding: 1.35rem 0 0;
}
.bill--handout .bill__num { grid-column: 1; font-size: .66rem; letter-spacing: .2em; opacity: .6; }
.bill--handout .bill__title { grid-column: 1; }
.bill--handout .bill__time { grid-column: 2; grid-row: 2; font-size: .74rem; align-self: end; }
.bill--handout .bill__style { grid-column: 1; font-size: .72rem; margin-top: .2rem; font-style: normal; }
.bill--handout .bill__blurb { grid-column: 1 / 3; font-size: .8rem; margin-top: .45rem; opacity: .8; }
.bill--handout .bill__sung { grid-column: 1; justify-self: start; margin-top: .45rem; border: 0; padding: 0; }
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
  --venue-size: clamp(1.05rem, 3.2vw, 1.4rem); --venue-track: .3em; --venue-case: uppercase;
  --title-size: clamp(1.2rem, 4.6vw, 1.72rem); --title-track: .13em; --title-case: uppercase;
}
.paper--lava .bill__head { padding-bottom: .8rem; border-bottom: 3px double var(--hair); }

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
  --venue-size: clamp(.95rem, 3vw, 1.25rem); --venue-track: .18em; --venue-case: uppercase;
  --title-size: clamp(1.25rem, 4.8vw, 1.8rem); --title-track: -.01em; --title-case: uppercase;
}
.paper--neon .bill__head { padding-bottom: .8rem; border-bottom: .4rem solid var(--accent); }

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
  --venue-size: clamp(1rem, 3.2vw, 1.28rem); --venue-track: .34em; --venue-case: uppercase;
  --title-size: clamp(1.15rem, 4.4vw, 1.6rem); --title-track: .1em; --title-case: uppercase;
}
.paper--buff .bill__head {
  text-align: center; padding-bottom: .7rem;
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
  --venue-size: clamp(1rem, 3.4vw, 1.35rem); --venue-track: -.02em; --venue-case: uppercase;
  --title-size: clamp(1.2rem, 4.8vw, 1.7rem); --title-track: -.03em; --title-case: uppercase;
}
.paper--bop .bill__head { padding-bottom: .7rem; border-bottom: 2px solid var(--ink); }

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
  --venue-size: clamp(1rem, 3.4vw, 1.3rem); --venue-track: .02em; --venue-case: lowercase;
  --title-size: clamp(1.3rem, 5.2vw, 1.9rem); --title-track: -.02em; --title-case: lowercase;
}
.paper--modern .bill__head { padding-bottom: .9rem; }

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
  --venue-size: .82rem; --venue-track: .22em; --venue-case: uppercase;
  --title-size: clamp(.95rem, 3.6vw, 1.15rem); --title-track: .08em; --title-case: uppercase;
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
  --venue-size: .8rem; --venue-track: .16em; --venue-case: lowercase;
  --title-size: clamp(1rem, 3.8vw, 1.2rem); --title-track: .01em; --title-case: lowercase;
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
  --venue-size: .76rem; --venue-track: .3em; --venue-case: lowercase;
  --title-size: clamp(.95rem, 3.4vw, 1.1rem); --title-track: .06em; --title-case: lowercase;
}

/* A calmed camera and a calmed programme. The tilt is decoration and the
   transitions are decoration; neither survives being asked not to move. */
@media (prefers-reduced-motion: reduce) {
  .billhouse__scrim, .bill, .bill__meter { transition: none; }
  .bill { transform: none; }
}
@media (max-width: 30rem) {
  .bill--card .bill__item { grid-template-columns: 1.6rem 1fr auto; column-gap: .5rem; }
}
`;
