/**
 * Genre correctness checks.
 *
 *   npm run genres
 *
 * Asserts the things that define each genre and that a refactor could silently
 * break: that every style generates in both modes, that the blues is twelve
 * bars, that swing swings and bossa does not, that a walking bass actually
 * walks, and that jazz melody follows the chord rather than the key.
 */

import { generateSong } from './generate/song.js';
import { getGenre, GENRE_IDS } from './genre/index.js';
import { generateMelody } from './generate/melody.js';
import { comfortableLeap } from './generate/constraints.js';
import { parseRoman } from './core/chord.js';
import { Rng } from './core/rng.js';

const problems: string[] = [];
const check = (label: string, pass: boolean, detail: string) => {
  console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${label.padEnd(42)} ${detail}`);
  if (!pass) problems.push(label);
};

// --- Every style, both modes, must generate ------------------------------
console.log('\nSmoke: every style in every mode');
let ok = 0;
for (const gid of GENRE_IDS) {
  const genre = getGenre(gid);
  for (const sid of Object.keys(genre.styles)) {
    for (const mode of ['major', 'minor'] as const) {
      for (let i = 0; i < 6; i++) {
        try {
          generateSong({ seed: `${gid}-${sid}-${mode}-${i}`, genre: gid, style: sid, mode });
          ok++;
        } catch (e) {
          problems.push(`${gid}/${sid}/${mode}`);
          console.log(`  FAIL  ${gid}/${sid}/${mode}: ${(e as Error).message}`);
        }
      }
    }
  }
}
check('all style x mode combinations generate', problems.length === 0, `${ok} songs`);

// --- Form ----------------------------------------------------------------
console.log('\nForm');
const bluesBars = new Set<number>();
for (let i = 0; i < 12; i++) {
  const s = generateSong({ seed: `b-${i}`, genre: 'jazz', style: 'blues' });
  for (const sec of s.sections) {
    if (sec.kind !== 'intro' && sec.kind !== 'outro') bluesBars.add(sec.lengthBars);
  }
}
check('blues choruses are twelve bars', bluesBars.size === 1 && bluesBars.has(12), `lengths: ${[...bluesBars].join(', ')}`);

// --- Feel ----------------------------------------------------------------
console.log('\nFeel');
const swingVal = generateSong({ seed: 'sw', genre: 'jazz', style: 'swing' }).meta.swing;
const bossaVal = generateSong({ seed: 'bo', genre: 'jazz', style: 'bossa' }).meta.swing;
check('swing has a triplet feel', swingVal > 0.3, `swing = ${swingVal}`);
check('bossa nova is straight, not swung', bossaVal === 0, `swing = ${bossaVal}`);

// --- Walking bass --------------------------------------------------------
// Only measure songs that actually drew the walking pattern: a two-feel bass
// leaps by design, and averaging the two together hides both.
console.log('\nWalking bass');
let steps = 0, moves = 0, walkingSongs = 0;
for (let i = 0; i < 25; i++) {
  const s = generateSong({ seed: `wb-${i}`, genre: 'jazz', style: 'swing' });
  const bass = s.tracks.find((t) => t.layer === 'bass');
  if (!bass || bass.notes.length / s.meta.totalBars < 3) continue;
  walkingSongs++;
  const n = bass.notes.slice().sort((a, b) => a.beat - b.beat);
  for (let j = 1; j < n.length; j++) {
    const d = Math.abs(n[j]!.midi - n[j - 1]!.midi);
    if (d === 0) continue;
    moves++;
    if (d <= 2) steps++;
  }
}
const stepPct = (steps / Math.max(1, moves)) * 100;
check('walking bass moves mostly by step', stepPct > 55, `${stepPct.toFixed(1)}% stepwise over ${walkingSongs} songs`);

// --- Chord-scale ---------------------------------------------------------
console.log('\nChord-scale mapping');
const jazz = getGenre('jazz');
const dorian = jazz.scaleForChord(0, 'minor', { root: 2, quality: 'min7', label: 'ii7', dominantFunction: false });
const altered = jazz.scaleForChord(0, 'major', { root: 7, quality: 'dom7b9', label: 'V7b9', dominantFunction: true });
const iskelma = getGenre('iskelma');
const harmonic = iskelma.scaleForChord(9, 'minor', { root: 4, quality: 'dom7', label: 'V7', dominantFunction: true });
check('jazz min7 takes dorian on the chord root', dorian.name === 'dorian' && dorian.tonic === 2, `${dorian.name} on ${dorian.tonic}`);
check('jazz altered dominant takes the altered scale', altered.name === 'melodicMinor' && altered.tonic === 8, `${altered.name} on ${altered.tonic}`);
check('iskelma dominant takes harmonic minor on the key', harmonic.name === 'harmonicMinor' && harmonic.tonic === 9, `${harmonic.name} on ${harmonic.tonic}`);

// --- Quartal voicing -----------------------------------------------------
console.log('\nModal voicing');
const modalSong = generateSong({ seed: 'md', genre: 'jazz', style: 'modal' });
const comp = modalSong.tracks.find((t) => t.layer === 'comp');
let fourths = 0, total = 0;
if (comp) {
  const byBeat = new Map<number, number[]>();
  for (const n of comp.notes) {
    const arr = byBeat.get(n.beat) ?? [];
    arr.push(n.midi);
    byBeat.set(n.beat, arr);
  }
  for (const v of byBeat.values()) {
    if (v.length < 3) continue;
    const sorted = v.slice().sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) { total++; if (sorted[i]! - sorted[i - 1]! === 5) fourths++; }
  }
}
check('modal comp stacks fourths', total > 0 && fourths / total > 0.8, `${((fourths / Math.max(1, total)) * 100).toFixed(0)}% of intervals are perfect fourths`);

// --- Smoothness must actually smooth --------------------------------------
// The regression this guards against: every vertical rule pushes the melody
// onto chord tones, which are a third apart, so raising strictness once made
// the line *less* smooth. Wide leaps must fall as the level rises.
console.log('\nSmoothness monotonicity');
{
  const wideAt = (level: string, genreId: string) => {
    let wide = 0, moves = 0;
    for (let i = 0; i < 25; i++) {
      const s = generateSong({ seed: `sm-${i}`, genre: genreId, strictness: level as never });
      const mel = s.tracks.find((t) => t.layer === 'melody');
      if (!mel) continue;
      const n = mel.notes.slice().sort((a, b) => a.beat - b.beat);
      for (let j = 1; j < n.length; j++) {
        const d = Math.abs(n[j]!.midi - n[j - 1]!.midi);
        if (d === 0) continue;
        moves++;
        if (d > 4) wide++;
      }
    }
    return (wide / Math.max(1, moves)) * 100;
  };
  for (const genreId of GENRE_IDS) {
    const free = wideAt('free', genreId);
    const strict = wideAt('strict', genreId);
    const polished = wideAt('polished', genreId);
    check(
      `${genreId}: wide leaps fall as strictness rises`,
      strict <= free && polished <= strict,
      `free ${free.toFixed(0)}% -> strict ${strict.toFixed(0)}% -> polished ${polished.toFixed(0)}%`,
    );
  }
}

// --- Instrument agility ----------------------------------------------------
// Tested by holding everything else fixed and varying only agility. Comparing
// real songs instead would be confounded: brass and vibraphone appear in
// different styles, and the style's own leap character swamps the instrument's.
console.log('\nInstrument awareness');
{
  const style = getGenre('iskelma').styles.tango!;
  const chords = ['i', 'iv', 'V7', 'i', 'i', 'iv', 'V7', 'i'].map((l) => parseRoman(l, 'minor'));
  const leapProfile = (agility: number) => {
    let wide = 0, moves = 0, widest = 0;
    for (let s2 = 0; s2 < 60; s2++) {
      const notes = generateMelody({
        chords, beatsPerBar: 4, style, rng: new Rng(`ag-${s2}`),
        tonic: 0, mode: 'minor', range: [60, 79], startBeat: 0,
        ornamentScale: 1, leapScale: 1, strictness: 2, agility,
      });
      for (let i = 1; i < notes.length; i++) {
        const d = Math.abs(notes[i]!.midi - notes[i - 1]!.midi);
        if (d === 0) continue;
        moves++;
        // Measure beyond a fifth: that is the range agility governs. Whether a
        // melody uses thirds at all is a property of the style, not the player.
        if (d > 7) wide++;
        widest = Math.max(widest, d);
      }
    }
    return { pct: (wide / Math.max(1, moves)) * 100, widest };
  };
  const trombone = leapProfile(0.4);
  const vibraphone = leapProfile(1.0);
  check(
    'a stiff instrument leaps less than an agile one',
    trombone.pct < vibraphone.pct,
    `trombone(0.4) ${trombone.pct.toFixed(1)}% vs vibraphone(1.0) ${vibraphone.pct.toFixed(1)}% leaps > a fifth`,
  );
  check(
    'a stiff instrument never reaches as far',
    trombone.widest < vibraphone.widest,
    `widest leap ${trombone.widest} vs ${vibraphone.widest} semitones`,
  );
  check(
    'comfortable leap scales with agility',
    comfortableLeap(0.4) < comfortableLeap(1.0),
    `${comfortableLeap(0.4)} vs ${comfortableLeap(1.0)} semitones`,
  );
}

console.log();
if (problems.length) {
  console.log(`${problems.length} check(s) failed.\n`);
  process.exit(1);
}
console.log('All genre checks passed.\n');
