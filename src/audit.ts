/**
 * Musical audit.
 *
 *   npx tsx src/audit.ts [count]
 *
 * Generates a batch and measures whether the output actually obeys the rules
 * the style tables claim to encode. Structural validity (does it parse, does it
 * play) is necessary but not sufficient — these checks are about whether it is
 * plausibly *iskelmä*.
 */

import { chordPcs, parseRoman } from './core/chord.js';
import { pc } from './core/pitch.js';
import { makeScale } from './core/scale.js';
import type { Song } from './core/types.js';
import { generateSong } from './generate/song.js';
import { renderMidi } from './render/midi.js';

interface Stats {
  songs: number;
  strongBeatNotes: number;
  strongBeatChordTones: number;
  intervals: number[];
  leaps: number;
  steps: number;
  repeats: number;
  melodyNotes: number;
  keyChanges: number;
  minorSongs: number;
  cadenceOnTonic: number;
  cadences: number;
  ranges: number[];
  overlaps: number;
  outOfRange: number;
  styleCount: Record<string, number>;
  leadingToneOverV: number;
  vChordBars: number;
}

function audit(song: Song, s: Stats): void {
  s.songs++;
  s.styleCount[song.meta.style] = (s.styleCount[song.meta.style] ?? 0) + 1;
  if (song.meta.mode === 'minor') s.minorSongs++;
  if (song.sections.some((sec) => sec.transpose > 0)) s.keyChanges++;

  const { beatsPerBar } = song.meta;
  const melody = song.tracks.find((t) => t.layer === 'melody');
  if (!melody) return;

  // Rebuild the harmony timeline so melody notes can be checked against it.
  const chordAtBar = new Map<number, ReturnType<typeof parseRoman>>();
  for (const sec of song.sections) {
    const localTonic = ((song.meta.tonic + sec.transpose) % 12 + 12) % 12;
    for (let i = 0; i < sec.lengthBars; i++) {
      const label = sec.chordLabels[i];
      if (!label) continue;
      const chord = parseRoman(label, sec.mode);
      chordAtBar.set(sec.startBar + i, { ...chord, root: pc(chord.root + localTonic) });
    }
  }

  const notes = melody.notes.slice().sort((a, b) => a.beat - b.beat);
  let prevMidi: number | undefined;
  let lo = Infinity;
  let hi = -Infinity;

  for (let i = 0; i < notes.length; i++) {
    const n = notes[i]!;
    s.melodyNotes++;
    lo = Math.min(lo, n.midi);
    hi = Math.max(hi, n.midi);

    const bar = Math.floor(n.beat / beatsPerBar);
    const beatInBar = n.beat - bar * beatsPerBar;
    const chord = chordAtBar.get(bar);

    if (chord && Number.isInteger(beatInBar)) {
      s.strongBeatNotes++;
      if (chordPcs(chord).includes(pc(n.midi))) s.strongBeatChordTones++;
    }

    // Leading tone: over a dominant chord in minor, is the raised 7th present?
    if (chord?.dominantFunction && song.meta.mode === 'minor') {
      s.vChordBars++;
      const scale = makeScale(((song.meta.tonic) % 12 + 12) % 12, 'harmonicMinor');
      if (pc(n.midi) === scale.pcs[6]) s.leadingToneOverV++;
    }

    if (prevMidi !== undefined) {
      const iv = Math.abs(n.midi - prevMidi);
      s.intervals.push(iv);
      if (iv === 0) s.repeats++;
      else if (iv <= 2) s.steps++;
      else s.leaps++;
    }

    // Hanging/overlapping notes within a monophonic line are a bug.
    const next = notes[i + 1];
    if (next && n.beat + n.duration > next.beat + 1e-6) s.overlaps++;

    prevMidi = n.midi;
  }

  if (lo < 40 || hi > 96) s.outOfRange++;
  if (Number.isFinite(lo)) s.ranges.push(hi - lo);

  // Does each section's final melody note land on the tonic?
  for (const sec of song.sections) {
    const end = (sec.startBar + sec.lengthBars) * beatsPerBar;
    const start = sec.startBar * beatsPerBar;
    const inSec = notes.filter((n) => n.beat >= start && n.beat < end);
    if (!inSec.length) continue;
    s.cadences++;
    const last = inSec[inSec.length - 1]!;
    const localTonic = ((song.meta.tonic + sec.transpose) % 12 + 12) % 12;
    if (pc(last.midi) === localTonic) s.cadenceOnTonic++;
  }
}

function pct(a: number, b: number): string {
  return b === 0 ? 'n/a' : `${((a / b) * 100).toFixed(1)}%`;
}

function main(): void {
  const count = Number(process.argv[2] ?? 60);
  const genre = process.argv[3];
  const s: Stats = {
    songs: 0, strongBeatNotes: 0, strongBeatChordTones: 0, intervals: [], leaps: 0,
    steps: 0, repeats: 0, melodyNotes: 0, keyChanges: 0, minorSongs: 0,
    cadenceOnTonic: 0, cadences: 0, ranges: [], overlaps: 0, outOfRange: 0,
    styleCount: {}, leadingToneOverV: 0, vChordBars: 0,
  };

  let midiBytes = 0;
  for (let i = 0; i < count; i++) {
    const song = generateSong({ seed: `audit-${i}`, ...(genre ? { genre } : {}) });
    audit(song, s);
    midiBytes += renderMidi(song).length;
  }

  const motion = s.steps + s.leaps + s.repeats;
  const avgRange = s.ranges.reduce((a, b) => a + b, 0) / Math.max(1, s.ranges.length);

  console.log(`\nAudited ${s.songs} ${genre ?? 'mixed-genre'} songs (${s.melodyNotes} melody notes, ${(midiBytes / 1024).toFixed(0)} KB of MIDI)\n`);
  console.log('Harmony');
  console.log(`  chord tone on the beat        ${pct(s.strongBeatChordTones, s.strongBeatNotes)}   (want > 70%)`);
  console.log(`  leading tone used over V      ${pct(s.leadingToneOverV, s.vChordBars)}   (some presence expected)`);
  console.log('\nMelodic motion');
  console.log(`  stepwise (<= 2 semitones)     ${pct(s.steps, motion)}   (want 55-70%)`);
  console.log(`  leaps (> 2 semitones)         ${pct(s.leaps, motion)}`);
  console.log(`  repeated notes                ${pct(s.repeats, motion)}`);
  const buckets = [0, 1, 2, 3, 4, 5, 7, 12];
  const hist = new Map<string, number>();
  for (const iv of s.intervals) {
    const label = iv === 0 ? 'unison' : iv <= 2 ? '2nd' : iv <= 4 ? '3rd'
      : iv <= 5 ? '4th' : iv <= 7 ? '5th' : iv <= 11 ? '6th-7th' : 'octave+';
    hist.set(label, (hist.get(label) ?? 0) + 1);
  }
  void buckets;
  for (const label of ['unison', '2nd', '3rd', '4th', '5th', '6th-7th', 'octave+']) {
    const v = hist.get(label) ?? 0;
    console.log(`    ${label.padEnd(10)} ${pct(v, s.intervals.length).padStart(6)}  ${'▁'.repeat(Math.round((v / s.intervals.length) * 50))}`);
  }
  console.log(`  average melodic range         ${avgRange.toFixed(1)} semitones   (want 10-19)`);
  console.log('\nForm');
  console.log(`  sections closing on the tonic ${pct(s.cadenceOnTonic, s.cadences)}`);
  console.log(`  songs with a final key change ${pct(s.keyChanges, s.songs)}`);
  console.log(`  songs in a minor key          ${pct(s.minorSongs, s.songs)}`);
  console.log('\nIntegrity');
  console.log(`  overlapping melody notes      ${s.overlaps}   (want 0)`);
  console.log(`  songs outside singable range  ${s.outOfRange}   (want 0)`);
  console.log('\nStyle spread');
  for (const [k, v] of Object.entries(s.styleCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(14)} ${String(v).padStart(3)}  ${'█'.repeat(Math.round((v / s.songs) * 40))}`);
  }
  console.log();
}

main();
