/**
 * Ensemble audit — how the layers sound *together*.
 *
 *   npx tsx src/ensemble-report.ts [count] [genre]
 *
 * `audit.ts` measures the melody as a line. This measures the vertical: whether
 * the accompaniment voicings are playable chords or clusters, whether the comp
 * and pad stay out of the tune's register, and whether the harmony states its
 * own quality. A melody can pass every horizontal check and still be buried
 * under a comp that doubles it in unison — which is most of what "sounds off"
 * turns out to mean.
 */

import { parseRoman, chordPcs } from './core/chord.js';
import { pc } from './core/pitch.js';
import { melodicLine } from './core/types.js';
import type { NoteEvent, Song } from './core/types.js';
import { generateSong } from './generate/song.js';

interface Stats {
  songs: number;
  chords: number;
  clusterLow: number;      // interval <= 2 semitones below C4
  clusterAny: number;      // any interval <= 2 semitones inside a voicing
  doubledUnison: number;   // two voices on the identical pitch
  missingThird: number;    // voicing omits the chord's third
  missingSeventh: number;  // seventh chord voiced without its seventh
  seventhChords: number;

  melNotes: number;
  melUnderComp: number;    // melody note at/below the comp's top voice
  melUnison: number;       // melody note doubled at unison by comp or pad
  melUnisonHeld: number;   // ...by a note held a beat or longer — the damaging kind
  melSemitone: number;     // melody a semitone from a sounding accompaniment note

  compTopSpan: number[];   // how high the comp reaches
  melLow: number[];
}

const has = (pcs: number[], p: number) => pcs.includes(((p % 12) + 12) % 12);

/** Group simultaneous notes into voicings. */
function voicings(notes: NoteEvent[]): Map<number, number[]> {
  const at = new Map<number, number[]>();
  for (const n of notes) {
    const k = Math.round(n.beat * 4);
    const arr = at.get(k);
    if (arr) arr.push(n.midi);
    else at.set(k, [n.midi]);
  }
  for (const v of at.values()) v.sort((a, b) => a - b);
  return at;
}

/**
 * What is sounding at each sixteenth, with each note's length carried along.
 *
 * The length matters more than the pitch here. A comp stab that happens to hit
 * the melody's note for an eighth is what a pianist does all night and nobody
 * hears a fault; a pad *holding* that note for four bars swallows the tune. The
 * two need counting separately or the number says nothing.
 */
function sounding(notes: NoteEvent[]): Map<number, { midi: number; dur: number }[]> {
  const at = new Map<number, { midi: number; dur: number }[]>();
  for (const n of notes) {
    const from = Math.round(n.beat * 4);
    const to = Math.max(from + 1, Math.round((n.beat + n.duration) * 4));
    for (let s = from; s < to; s++) {
      const entry = { midi: n.midi, dur: n.duration };
      const arr = at.get(s);
      if (arr) arr.push(entry);
      else at.set(s, [entry]);
    }
  }
  return at;
}

function audit(song: Song, s: Stats): void {
  s.songs++;
  const { beatsPerBar: bpb, tonic, mode } = song.meta;

  const chordAtBar = new Map<number, ReturnType<typeof parseRoman>>();
  for (const sec of song.sections) {
    const localTonic = ((tonic + sec.transpose) % 12 + 12) % 12;
    for (let i = 0; i < sec.lengthBars; i++) {
      const label = sec.chordLabels[i];
      if (!label) continue;
      const c = parseRoman(label, mode);
      chordAtBar.set(sec.startBar + i, { ...c, root: pc(c.root + localTonic) });
    }
  }

  const melodyTrack = song.tracks.find((t) => t.layer === 'melody');
  // The line, not the track: a `twoHanded` piano interleaves its own comping.
  const melody = melodyTrack ? melodicLine(melodyTrack) : [];
  const comp = song.tracks.find((t) => t.layer === 'comp')?.notes ?? [];
  const pad = song.tracks.find((t) => t.layer === 'pad')?.notes ?? [];

  for (const notes of [comp, pad]) {
    for (const [slot, v] of voicings(notes)) {
      if (v.length < 2) continue;
      s.chords++;
      let cluster = false;
      let clusterLow = false;
      for (let i = 1; i < v.length; i++) {
        const d = v[i]! - v[i - 1]!;
        if (d === 0) { s.doubledUnison++; continue; }
        if (d <= 2) { cluster = true; if (v[i - 1]! < 60) clusterLow = true; }
      }
      if (cluster) s.clusterAny++;
      if (clusterLow) s.clusterLow++;

      const bar = Math.floor(slot / 4 / bpb);
      const chord = chordAtBar.get(bar);
      if (!chord) continue;
      const pcs = chordPcs(chord);
      const vp = v.map(pc);
      const third = pcs[1];
      if (third !== undefined && !has(vp, third)) s.missingThird++;
      if (pcs.length >= 4) {
        s.seventhChords++;
        if (!has(vp, pcs[3]!)) s.missingSeventh++;
      }
    }
  }

  const compSound = sounding(comp);
  const padSound = sounding(pad);
  const compTops: number[] = [];
  for (const v of voicings(comp).values()) compTops.push(Math.max(...v));
  if (compTops.length) s.compTopSpan.push(compTops.reduce((a, b) => a + b, 0) / compTops.length);

  const melPitches: number[] = [];
  for (const n of melody) {
    s.melNotes++;
    melPitches.push(n.midi);
    const slot = Math.round(n.beat * 4);
    const under = compSound.get(slot) ?? [];
    const padUnder = padSound.get(slot) ?? [];
    if (under.length && n.midi <= Math.max(...under.map((o) => o.midi))) s.melUnderComp++;
    const band = [...under, ...padUnder];
    if (band.some((o) => o.midi === n.midi)) s.melUnison++;
    if (band.some((o) => o.midi === n.midi && o.dur >= 1)) s.melUnisonHeld++;
    if (band.some((o) => Math.abs(o.midi - n.midi) === 1)) s.melSemitone++;
  }
  if (melPitches.length) s.melLow.push(Math.min(...melPitches));
}

const pct = (a: number, b: number) => (b === 0 ? 'n/a' : `${((a / b) * 100).toFixed(1)}%`);
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function main(): void {
  const count = Number(process.argv[2] ?? 40);
  const genre = process.argv[3];
  const s: Stats = {
    songs: 0, chords: 0, clusterLow: 0, clusterAny: 0, doubledUnison: 0,
    missingThird: 0, missingSeventh: 0, seventhChords: 0,
    melNotes: 0, melUnderComp: 0, melUnison: 0, melUnisonHeld: 0, melSemitone: 0,
    compTopSpan: [], melLow: [],
  };
  for (let i = 0; i < count; i++) {
    audit(generateSong({ seed: `audit-${i}`, ...(genre ? { genre } : {}) }), s);
  }

  console.log(`\nEnsemble audit — ${s.songs} ${genre ?? 'mixed'} songs, ${s.chords} voicings\n`);
  console.log('Voicing quality');
  console.log(`  contains a 2nd or smaller     ${pct(s.clusterAny, s.chords).padStart(6)}   (colour above C4, so not a fault)`);
  console.log(`  ...below middle C            ${pct(s.clusterLow, s.chords).padStart(6)}   (want ~0% — this is mud)`);
  console.log(`  two voices on the same note   ${pct(s.doubledUnison, s.chords).padStart(6)}   (want ~0% — a wasted voice)`);
  console.log(`  omits the chord's third       ${pct(s.missingThird, s.chords).padStart(6)}   (want < 15% — no quality)`);
  console.log(`  7th chord without its 7th     ${pct(s.missingSeventh, s.seventhChords).padStart(6)}`);
  console.log('\nRegister separation');
  console.log(`  melody at/below comp's top    ${pct(s.melUnderComp, s.melNotes).padStart(6)}   (want < 25%)`);
  console.log(`  melody doubled at unison      ${pct(s.melUnison, s.melNotes).padStart(6)}   (want < 8%)`);
  console.log(`  ...by a held note (swallowed) ${pct(s.melUnisonHeld, s.melNotes).padStart(6)}   (want ~0% — this is the bad one)`);
  console.log(`  melody a semitone from band   ${pct(s.melSemitone, s.melNotes).padStart(6)}`);
  console.log(`  mean comp top / mean mel low  ${avg(s.compTopSpan).toFixed(1)} / ${avg(s.melLow).toFixed(1)} MIDI`);
  console.log();
}

main();
