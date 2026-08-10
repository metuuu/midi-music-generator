/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Writing `at-ease.ts` back out, for the model bench's idle tuner.
 *
 * The tuner has a save button, and a browser cannot write a file — so the dev
 * server does it, and this is the half of that which is only string handling.
 * Both ends share it: the page renders the same entries into its copy box that
 * the server writes into the file, so what you read before saving is what lands.
 *
 * **No `node:` imports here, ever.** This module is in the browser's graph
 * because `gallery.ts` imports the formatters, and one `node:fs` at the top of
 * it would take the model bench down. The dev server's own half — reading the
 * file, writing it back, and deciding whether to — is a dozen lines in
 * `vite.config.ts`, where a dev-only middleware belongs.
 *
 * ## Why this edits source rather than generating a file
 *
 * Because `AT_EASE` is a table whose comments are most of it. Every entry is
 * two to forty lines of why that instrument comes down the way it does, read
 * off a real body, and a generated file would either lose all of that or force
 * it somewhere it does not belong. So the writer replaces the *value* of one
 * entry and touches nothing else on the way past — the prose above `violin`
 * survives a save that changes its pitch by a hundredth.
 *
 * `REST_TRIM` is the opposite and is treated as such: it is machine-written by
 * design, empty in the state it wants to be in, and its whole literal is
 * regenerated. Anything hand-written *inside* it is lost on the next save.
 */

import type { Archetype } from '../../concert/types.js';

import type { AtEasePose, RestTrim } from './at-ease.js';

export interface Tuning {
  atEase: Partial<Record<Archetype, AtEasePose>>;
  restTrim: Partial<Record<Archetype, RestTrim>>;
}

/** The file the tuner edits, relative to the repository root. */
export const AT_EASE_FILE = 'src/web/concert/at-ease.ts';

/** Where the page posts a save. Dev only; see `vite.config.ts`. */
export const SAVE_ROUTE = '/__idle-tuning';

/** The hands a trim can name, in the order they are written out. */
export const TRIM_HANDS = ['left-hand', 'right-hand', 'bow'] as const;

/** Short as the table writes them: three decimals, no trailing zeros. */
export function num(v: number): string {
  const s = v.toFixed(3).replace(/\.?0+$/, '');
  return s === '' || s === '-0' ? '0' : s;
}

/** Quoted only where an archetype id is not a bare identifier. */
export function keyOf(a: string): string {
  return /^[a-z][a-z0-9]*$/i.test(a) ? a : `'${a}'`;
}

/**
 * One `AT_EASE` value, in the field order `AtEasePose` declares.
 *
 * The two optional angles are omitted when they are zero, which is not
 * cosmetic: `turn` and `across` exist because one instrument needed each, and a
 * table that wrote `turn: 0` on all nine entries would say that every one of
 * them had an opinion about yaw.
 */
export function easeEntrySource(e: AtEasePose): string {
  const parts = [`pitch: ${num(e.pitch)}`, `roll: ${num(e.roll)}`];
  if (e.turn) parts.push(`turn: ${num(e.turn)}`);
  parts.push(`drop: ${num(e.drop)}`, `back: ${num(e.back)}`);
  if (e.across) parts.push(`across: ${num(e.across)}`);
  parts.push(`hands: [${num(e.hands[0])}, ${num(e.hands[1])}]`);
  return `{ ${parts.join(', ')} }`;
}

/** One `REST_TRIM` value, or empty where every axis of every hand is zero. */
export function trimEntrySource(trim: RestTrim): string {
  const parts = TRIM_HANDS.flatMap((h) => {
    const d = trim[h];
    if (!d || !d.some((v) => Math.abs(v) > 1e-9)) return [];
    return [`'${h}': [${d.map(num).join(', ')}]`];
  });
  return parts.length ? `{ ${parts.join(', ')} }` : '';
}

// --- reading the file ------------------------------------------------------
//
// A brace matcher rather than a regular expression, and the reason is one line
// of the file it has to read: the doc above `AT_EASE` contains the text
// `resolve({kind:'rest'})`. Any scan that does not know a comment from code
// counts that brace, loses the literal's end, and writes the table into the
// middle of a sentence. So comments and strings are skipped properly, which is
// most of what is below.

function endOfString(src: string, at: number): number {
  const quote = src[at];
  for (let i = at + 1; i < src.length; i++) {
    if (src[i] === '\\') { i++; continue; }
    if (src[i] === quote) return i;
  }
  throw new Error('unterminated string');
}

/** The index after whatever comment or string starts at `i`, or `i` itself. */
function skipTrivia(src: string, i: number): number {
  for (;;) {
    const c = src[i];
    if (c === undefined) return i;
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
    if (c === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i);
      i = nl < 0 ? src.length : nl + 1;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end < 0 ? src.length : end + 2;
      continue;
    }
    return i;
  }
}

/** The `{` that opens `export const <name>`'s literal, and its matching `}`. */
function literalSpan(src: string, name: string): { open: number; close: number } {
  const decl = `export const ${name}`;
  const at = src.indexOf(decl);
  if (at < 0) throw new Error(`${AT_EASE_FILE}: no ${decl}`);
  const open = src.indexOf('{', at + decl.length);
  if (open < 0) throw new Error(`${AT_EASE_FILE}: ${name} has no literal`);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i]!;
    if (c === '/' && (src[i + 1] === '/' || src[i + 1] === '*')) { i = skipTrivia(src, i) - 1; continue; }
    if (c === '"' || c === "'" || c === '`') { i = endOfString(src, i); continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return { open, close: i }; }
  }
  throw new Error(`${AT_EASE_FILE}: ${name} is unbalanced`);
}

interface Entry {
  key: string;
  /** The value expression alone — what a save replaces. */
  valueStart: number;
  valueEnd: number;
}

function entriesOf(src: string, open: number, close: number): Entry[] {
  const out: Entry[] = [];
  let i = skipTrivia(src, open + 1);
  while (i < close) {
    if (src[i] === '}') break;
    // The key: quoted where the id has a hyphen in it, bare otherwise.
    let key: string;
    if (src[i] === "'" || src[i] === '"') {
      const end = endOfString(src, i);
      key = src.slice(i + 1, end);
      i = end + 1;
    } else {
      const m = /^[A-Za-z0-9_$]+/.exec(src.slice(i));
      if (!m) throw new Error(`${AT_EASE_FILE}: unreadable key at ${i}`);
      key = m[0];
      i += key.length;
    }
    i = skipTrivia(src, i);
    if (src[i] !== ':') throw new Error(`${AT_EASE_FILE}: no ':' after ${key}`);
    i = skipTrivia(src, i + 1);
    const valueStart = i;
    let depth = 0;
    while (i < close) {
      const c = src[i]!;
      if (c === '/' && (src[i + 1] === '/' || src[i + 1] === '*')) { i = skipTrivia(src, i); continue; }
      if (c === '"' || c === "'" || c === '`') { i = endOfString(src, i) + 1; continue; }
      if (c === '{' || c === '[') { depth++; i++; continue; }
      if (c === '}' || c === ']') { if (depth === 0) break; depth--; i++; continue; }
      if (c === ',' && depth === 0) break;
      i++;
    }
    out.push({ key, valueStart, valueEnd: i });
    i = skipTrivia(src, src[i] === ',' ? i + 1 : i);
  }
  return out;
}

/**
 * `at-ease.ts` with these tables in it, and everything else exactly as it was.
 *
 * Entries are replaced from the back, so an edit never moves the offsets of one
 * not yet made. An archetype the table has never heard of is appended; one that
 * is tuned back to what the file already says is left alone rather than
 * rewritten with the same numbers formatted differently.
 */
export function writeTables(src: string, tuning: Tuning): string {
  let out = src;

  // `AT_EASE` in place, comment by comment.
  const ease = literalSpan(out, 'AT_EASE');
  const easeEntries = entriesOf(out, ease.open, ease.close);
  const edits: { start: number; end: number; text: string }[] = [];
  const appended: string[] = [];
  for (const [key, pose] of Object.entries(tuning.atEase)) {
    if (!pose) continue;
    const text = easeEntrySource(pose);
    const found = easeEntries.find((e) => e.key === key);
    if (found) edits.push({ start: found.valueStart, end: found.valueEnd, text });
    else appended.push(`  ${keyOf(key)}: ${text},\n`);
  }
  edits.sort((a, b) => b.start - a.start);
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  if (appended.length) {
    // Re-found, because the edits above have moved it.
    const close = literalSpan(out, 'AT_EASE').close;
    out = out.slice(0, close) + appended.join('') + out.slice(close);
  }

  // `REST_TRIM` wholesale. See the note at the top of this file.
  const trim = literalSpan(out, 'REST_TRIM');
  const lines = Object.entries(tuning.restTrim).flatMap(([key, t]) => {
    if (!t) return [];
    const text = trimEntrySource(t);
    return text ? [`  ${keyOf(key)}: ${text},`] : [];
  });
  const literal = lines.length ? `{\n${lines.join('\n')}\n}` : '{}';
  return out.slice(0, trim.open) + literal + out.slice(trim.close + 1);
}

// --- checking what arrived -------------------------------------------------
//
// This is a browser posting numbers that become source on somebody's disk, so
// nothing gets there without being read first. Every value is rebuilt from a
// parsed float rather than passed through, which is what makes the output
// unable to carry anything that is not a number, whatever was sent.

/** Wider than any pose and narrower than a mistake: radians, or metres. */
const SANE = 10;

function number(v: unknown, what: string): number {
  const n = typeof v === 'number' ? v : Number.NaN;
  if (!Number.isFinite(n) || Math.abs(n) > SANE) throw new Error(`${what}: not a number`);
  return n;
}

function archetypeKey(k: string): string {
  if (!/^[a-z][a-z0-9-]{0,31}$/.test(k)) throw new Error(`bad archetype '${k}'`);
  return k;
}

function triple(v: unknown, what: string): [number, number, number] {
  if (!Array.isArray(v) || v.length !== 3) throw new Error(`${what}: not three numbers`);
  return [number(v[0], what), number(v[1], what), number(v[2], what)];
}

/**
 * A posted body, rebuilt as a `Tuning` — or an exception naming what was wrong.
 *
 * Deliberately total rather than tolerant: an unknown field is a version skew
 * between the page and the server, and writing a file from half-understood
 * input is the one outcome worth refusing outright.
 */
export function readTuning(body: unknown): Tuning {
  if (!body || typeof body !== 'object') throw new Error('not an object');
  const raw = body as { atEase?: unknown; restTrim?: unknown };
  const atEase: Record<string, AtEasePose> = {};
  const restTrim: Record<string, RestTrim> = {};

  for (const [k, v] of Object.entries((raw.atEase ?? {}) as Record<string, unknown>)) {
    const key = archetypeKey(k);
    if (!v || typeof v !== 'object') throw new Error(`${key}: not a pose`);
    const p = v as Record<string, unknown>;
    const hands = p['hands'];
    if (!Array.isArray(hands) || hands.length !== 2) throw new Error(`${key}: bad hands`);
    atEase[key] = {
      pitch: number(p['pitch'], `${key}.pitch`),
      roll: number(p['roll'], `${key}.roll`),
      ...(p['turn'] ? { turn: number(p['turn'], `${key}.turn`) } : {}),
      drop: number(p['drop'], `${key}.drop`),
      back: number(p['back'], `${key}.back`),
      ...(p['across'] ? { across: number(p['across'], `${key}.across`) } : {}),
      hands: [number(hands[0], `${key}.hands`), number(hands[1], `${key}.hands`)],
    };
  }

  for (const [k, v] of Object.entries((raw.restTrim ?? {}) as Record<string, unknown>)) {
    const key = archetypeKey(k);
    if (!v || typeof v !== 'object') throw new Error(`${key}: not a trim`);
    const t = v as Record<string, unknown>;
    const built: RestTrim = {};
    for (const hand of TRIM_HANDS) {
      if (t[hand] === undefined) continue;
      built[hand] = triple(t[hand], `${key}.${hand}`);
    }
    restTrim[key] = built;
  }

  return { atEase, restTrim } as Tuning;
}
