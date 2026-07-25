/**
 * Hook calibration report.
 *
 *   npm run hook [songsPerLevel] [genre]
 *
 * Generates the *same songs* at every hook level and measures how much they
 * repeat themselves. As with the strictness report, the point is to show both
 * halves of the trade rather than only the flattering one: repetition should
 * rise with the level, and melodic variety should fall. If a level repeats
 * nothing, or repeats everything into a drone, this is where it shows.
 *
 * Everything here is measured from the finished Song IR rather than from the
 * generator's intentions, so a mechanism that quietly fails to fire cannot
 * report success.
 */

import { pc } from './core/pitch.js';
import type { NoteEvent, Song } from './core/types.js';
import { generateSong } from './generate/song.js';
import { HOOK_LEVELS } from './generate/hook.js';

/**
 * Quantise an offset to a stable integer tick.
 *
 * Not decorative. A swung offbeat lands on beat .665, and rounding that to two
 * decimals puts it exactly on a rounding boundary — so two bit-identical
 * melodies at different offsets in the song round to .67 and .66 and compare
 * unequal. Scaling first keeps the value away from any boundary, and the
 * difference showed up as a 7% shortfall in measured recall that the generator
 * was not actually responsible for.
 */
function tick(offset: number): number {
  return Math.round(offset * 1000);
}

/**
 * A bar's melodic shape, as text.
 *
 * Onsets are relative to the bar and pitches relative to the bar's first note,
 * so a figure restated a third lower still matches the original. That is the
 * point: a sequence is a repetition, and a measure that only counted verbatim
 * bars would miss most of what makes music feel familiar.
 */
function barSignature(notes: NoteEvent[], barStart: number): string {
  if (!notes.length) return '';
  const base = notes[0]!.midi;
  return notes
    .map((n) => `${tick(n.beat - barStart)}:${n.midi - base}`)
    .join(' ');
}

/** The same idea for a whole section, used to detect a recalled chorus. */
function sectionSignature(notes: NoteEvent[]): string {
  if (!notes.length) return '';
  const start = notes[0]!.beat;
  const base = notes[0]!.midi;
  return notes
    .map((n) => `${tick(n.beat - start)}:${n.midi - base}`)
    .join(' ');
}

interface Measurement {
  songs: number;
  bars: number;
  repeatedBars: number;
  /** Pairs of same-kind sections, and how many of those replay the first. */
  sectionPairs: number;
  recalledSections: number;
  chorusPairs: number;
  recalledChoruses: number;
  soloPairs: number;
  recalledSolos: number;
  intervals: number;
  repeatedNotes: number;
  pcsPerWindow: number;
  windows: number;
  distinctBarShapes: number;
  notes: number;
}

function empty(): Measurement {
  return {
    songs: 0, bars: 0, repeatedBars: 0, sectionPairs: 0, recalledSections: 0,
    chorusPairs: 0, recalledChoruses: 0, soloPairs: 0, recalledSolos: 0,
    intervals: 0, repeatedNotes: 0, pcsPerWindow: 0, windows: 0,
    distinctBarShapes: 0, notes: 0,
  };
}

function measure(song: Song, m: Measurement): void {
  const melody = song.tracks.find((t) => t.layer === 'melody');
  const counter = song.tracks.find((t) => t.layer === 'counter');
  if (!melody) return;
  m.songs++;

  const { beatsPerBar } = song.meta;
  const notes = melody.notes.slice().sort((a, b) => a.beat - b.beat);
  m.notes += notes.length;

  // --- Bar-level self-similarity ---
  const byBar = new Map<number, NoteEvent[]>();
  for (const n of notes) {
    const bar = Math.floor(n.beat / beatsPerBar + 1e-9);
    (byBar.get(bar) ?? byBar.set(bar, []).get(bar)!).push(n);
  }
  const seen = new Set<string>();
  for (const [bar, inBar] of [...byBar.entries()].sort((a, b) => a[0] - b[0])) {
    const sig = barSignature(inBar, bar * beatsPerBar);
    if (!sig) continue;
    m.bars++;
    if (seen.has(sig)) m.repeatedBars++;
    seen.add(sig);
  }
  m.distinctBarShapes += seen.size;

  // --- Note-level repetition ---
  for (let i = 1; i < notes.length; i++) {
    m.intervals++;
    if (notes[i]!.midi === notes[i - 1]!.midi) m.repeatedNotes++;
  }

  // --- Vocabulary, measured over four-bar windows ---
  // Four bars because that is the phrase length the narrowing is scoped to.
  // Counting per section would average two phrases together and converge on
  // the scale no matter what the setting did.
  const lastBar = Math.max(...notes.map((n) => Math.floor(n.beat / beatsPerBar + 1e-9)));
  for (let bar = 0; bar <= lastBar; bar += 4) {
    const from = bar * beatsPerBar;
    const to = from + 4 * beatsPerBar;
    const inWindow = notes.filter((n) => n.beat >= from && n.beat < to);
    if (inWindow.length < 4) continue;
    m.windows++;
    m.pcsPerWindow += new Set(inWindow.map((n) => pc(n.midi))).size;
  }

  // --- Section recall ---
  // Grouped by kind and length, exactly as the generator's memory is keyed.
  //
  // A solo moves the tune from the melody layer to the counter instrument, so
  // each kind has to be read off the layer that actually carries it. Reading
  // both layers together would fold in the counter's own per-section line and
  // make a genuinely recalled chorus register as new material.
  const firstOfKind = new Map<string, string>();
  for (const sec of song.sections) {
    const track = sec.kind === 'solo' ? counter : melody;
    if (!track) continue;
    const from = sec.startBar * beatsPerBar;
    const to = from + sec.lengthBars * beatsPerBar;
    const inSection = track.notes
      .filter((n) => n.beat >= from && n.beat < to)
      .sort((a, b) => a.beat - b.beat);
    if (!inSection.length) continue;

    const key = `${sec.kind}:${sec.lengthBars}`;
    const sig = sectionSignature(inSection);
    const first = firstOfKind.get(key);
    if (first === undefined) {
      firstOfKind.set(key, sig);
      continue;
    }
    if (sec.kind === 'solo') {
      m.soloPairs++;
      if (sig === first) m.recalledSolos++;
    } else {
      m.sectionPairs++;
      if (sig === first) m.recalledSections++;
      if (sec.kind === 'chorus') {
        m.chorusPairs++;
        if (sig === first) m.recalledChoruses++;
      }
    }
  }
}

function main(): void {
  const count = Number(process.argv[2] ?? 40);
  const genre = process.argv[3];
  const results = new Map<string, Measurement>();

  for (const level of HOOK_LEVELS) {
    const m = empty();
    for (let i = 0; i < count; i++) {
      measure(generateSong({
        seed: `hook-${i}`, hook: level.id, ...(genre ? { genre } : {}),
      }), m);
    }
    results.set(level.id, m);
  }

  console.log(`\nSame ${count} ${genre ?? 'mixed-genre'} seeds regenerated at each hook level.\n`);

  const row = (label: string, fn: (m: Measurement) => string) =>
    console.log(`  ${label.padEnd(30)}${HOOK_LEVELS.map((l) => `${fn(results.get(l.id)!).padStart(9)}  `).join('')}`);

  console.log('  ' + ' '.repeat(28) + HOOK_LEVELS.map((l) => l.id.padStart(11)).join(''));
  console.log('\nRepetition');
  row('choruses recalled %', (m) => pct(m.recalledChoruses, m.chorusPairs));
  row('all sections recalled %', (m) => pct(m.recalledSections, m.sectionPairs));
  row('bars restating an earlier bar %', (m) => pct(m.repeatedBars, m.bars));
  row('repeated notes %', (m) => pct(m.repeatedNotes, m.intervals));

  console.log('\nCost — variety given up');
  row('pitch classes / 4-bar phrase', (m) => (m.pcsPerWindow / Math.max(1, m.windows)).toFixed(2));
  row('distinct bar shapes / song', (m) => (m.distinctBarShapes / Math.max(1, m.songs)).toFixed(1));
  row('notes / song', (m) => (m.notes / Math.max(1, m.songs)).toFixed(0));

  console.log('\nSolos, which must never be recalled at any level');
  row('solos recalled %', (m) => pct(m.recalledSolos, m.soloPairs));
  console.log();
}

function pct(part: number, whole: number): string {
  return whole ? `${((part / whole) * 100).toFixed(1)}` : '·';
}

main();
