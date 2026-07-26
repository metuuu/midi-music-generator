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
import type { HookId } from './generate/hook.js';
import { chordPcs, parseRoman } from './core/chord.js';
import { pc } from './core/pitch.js';
import type { Song } from './core/types.js';
import { Rng } from './core/rng.js';
import { IDIOMS, type Idiom } from './style/instruments.js';

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

// Ambient's answer is neither: the scale is always rooted on the *tonic*, and
// only its mode bends to admit whatever chord is underneath. These four are
// the cases the rule exists to produce.
const ambientGenre = getGenre('ambient');
// Roman numerals parse to an offset from the tonic; the generator shifts them
// into the key before the melody ever sees them, so the test has to as well.
const inKey = (label: string, mode: 'major' | 'minor', tonic: number) => {
  const chord = parseRoman(label, mode);
  return { ...chord, root: pc(chord.root + tonic) };
};
const bend = (tonic: number, mode: 'major' | 'minor', label: string) =>
  ambientGenre.scaleForChord(tonic as never, mode, inKey(label, mode, tonic));
const flatSeven = bend(0, 'major', 'bVII');
const flatSix = bend(0, 'major', 'bVI');
const majorFour = bend(9, 'minor', 'IV');
const flatTwo = bend(9, 'minor', 'bII');
check('ambient ♭VII bends a major drone to mixolydian', flatSeven.name === 'mixolydian' && flatSeven.tonic === 0, `${flatSeven.name} on ${flatSeven.tonic}`);
check('ambient ♭VI bends a major drone to aeolian', flatSix.name === 'minor' && flatSix.tonic === 0, `${flatSix.name} on ${flatSix.tonic}`);
check('ambient IV bends a minor drone to dorian', majorFour.name === 'dorian' && majorFour.tonic === 9, `${majorFour.name} on ${majorFour.tonic}`);
check('ambient ♭II bends a minor drone to phrygian', flatTwo.name === 'phrygian' && flatTwo.tonic === 9, `${flatTwo.name} on ${flatTwo.tonic}`);

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

// --- Ambient ---------------------------------------------------------------
// Four claims, each of which is a thing the genre *is* rather than a setting it
// happens to use, and each of which an innocent-looking edit could undo.
console.log('\nAmbient');
{
  const ambient = getGenre('ambient');

  // 1. Every chord the tables contain must be *reachable* — some mode of the
  //    tonic has to hold all of it, or the rule falls through to its guard and
  //    the melody is left drawing on a scale that omits the notes underneath
  //    it. This is what keeps "the drone absorbs the chord" from quietly
  //    degrading into "the drone ignores the chord".
  //    Each numeral is collected against the mode it is actually *read* in. A
  //    roman numeral means different notes in the two modes, and a style's
  //    minor table is never read in major — testing every label in both would
  //    fail on chords the generator cannot build.
  const labels = new Set<string>();
  for (const style of Object.values(ambient.styles)) {
    for (const mode of ['major', 'minor'] as const) {
      const table = (mode === 'major' ? style.majorProgressions : style.minorProgressions)
        ?? style.progressions;
      for (const progressions of Object.values(table)) {
        for (const p of progressions) for (const c of p.chords) labels.add(`${mode}:${c}`);
      }
    }
  }
  let unreachable = 0, dominants = 0;
  const offenders: string[] = [];
  for (const entry of labels) {
    const [mode, label] = entry.split(':') as ['major' | 'minor', string];
    if (parseRoman(label, mode).dominantFunction) dominants++;
    // Three keys well apart, to catch anything that only works at C.
    for (const tonic of [0, 5, 9] as const) {
      const chord = inKey(label, mode, tonic);
      const scale = ambient.scaleForChord(tonic, mode, chord);
      const held = chordPcs(chord).every((p) => scale.pcs.includes(p));
      if (!held || scale.tonic !== tonic) { unreachable++; offenders.push(entry); }
    }
  }
  check(
    'every chord is reachable without moving the drone',
    unreachable === 0,
    unreachable === 0 ? `${labels.size} distinct chords` : `${[...new Set(offenders)].join(', ')}`,
  );
  // The genre's central negative claim: no dominant function anywhere, so
  // nothing ever asks to resolve.
  check('no chord in the genre has dominant function', dominants === 0, `${dominants} dominant-function chords found`);

  // 2. Styles that exclude the drums must actually have none, and nothing in
  //    the genre may end a section with a crash — the fill is the single most
  //    out-of-place gesture available here.
  let silentKits = 0, crashes = 0, ambientSongs = 0;
  for (const style of Object.keys(ambient.styles)) {
    for (let i = 0; i < 6; i++) {
      const song = generateSong({ seed: `amb-${style}-${i}`, genre: 'ambient', style });
      ambientSongs++;
      const excluded = ambient.styles[style]!.excludeLayers?.includes('drums') ?? false;
      if (excluded && song.drums.events.length === 0) silentKits++;
      else if (excluded) silentKits--;
      if (song.drums.events.some((e) => e.voice === 'cr')) crashes++;
    }
  }
  check('drumless styles generate no drums', silentKits === 12, `${silentKits}/12 drumless renders were silent`);
  check('no section ends with a fill', crashes === 0, `${crashes} crashes across ${ambientSongs} songs`);

  // 3. The bass pedals rather than pulses. Measured on the two styles built on
  //    a drone: a note shorter than a bar there means `sustain` has stopped
  //    merging, which turns the floor of the music back into a part.
  let pedalled = 0, droneSongs = 0;
  for (const style of ['drone', 'wasteland']) {
    for (let i = 0; i < 8; i++) {
      const song = generateSong({ seed: `ped-${style}-${i}`, genre: 'ambient', style });
      const bass = song.tracks.find((t) => t.layer === 'bass');
      if (!bass) continue;
      droneSongs++;
      const mean = bass.notes.reduce((a, n) => a + n.duration, 0) / bass.notes.length;
      if (mean >= song.meta.beatsPerBar) pedalled++;
    }
  }
  check('the drone bass holds for at least a bar', pedalled === droneSongs, `${pedalled}/${droneSongs} songs`);

  // 4. A sequencer plays one note at a time. Every kosmische comp pattern is an
  //    arpeggio, so any simultaneity there means the arpeggiator has silently
  //    reverted to striking whole chords.
  let stacked = 0, sequencerNotes = 0;
  for (let i = 0; i < 8; i++) {
    const song = generateSong({ seed: `seq-${i}`, genre: 'ambient', style: 'kosmische' });
    const comp = song.tracks.find((t) => t.layer === 'comp');
    if (!comp) continue;
    const byBeat = new Map<number, number>();
    for (const n of comp.notes) byBeat.set(n.beat, (byBeat.get(n.beat) ?? 0) + 1);
    sequencerNotes += comp.notes.length;
    for (const count of byBeat.values()) if (count > 1) stacked++;
  }
  check('the sequencer plays one note at a time', stacked === 0, `${stacked} stacked onsets in ${sequencerNotes} notes`);
}

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

// --- Hook must actually repeat --------------------------------------------
// Three separate claims, because the axis can fail three ways: by not
// repeating, by repeating the one thing that must never repeat, and by faking
// repetition through playing fewer notes.
console.log('\nHook');
{
  // Onsets are quantised by scaling *then* rounding. A swung offbeat sits on
  // beat .665, which is exactly on the boundary at two decimal places, so two
  // identical melodies at different offsets in the song can round apart.
  const tick = (offset: number) => Math.round(offset * 1000);

  /** A section's tune, relative to its own start, so a transposed replay matches. */
  const signature = (song: Song, sec: Song['sections'][number]): string => {
    const layer = sec.kind === 'solo' ? 'counter' : 'melody';
    const track = song.tracks.find((t) => t.layer === layer);
    if (!track) return '';
    const from = sec.startBar * song.meta.beatsPerBar;
    const to = from + sec.lengthBars * song.meta.beatsPerBar;
    const notes = track.notes.filter((n) => n.beat >= from && n.beat < to)
      .sort((a, b) => a.beat - b.beat);
    /**
     * Drop the pickup into whatever comes next.
     *
     * A phrase that begins with an anacrusis writes its first notes *before* its
     * own downbeat, so they sound inside the previous section. They are not that
     * section's tune, and counting them here made an identically recalled chorus
     * compare unequal purely because the section after it differed.
     */
    while (notes.length && to - notes[notes.length - 1]!.beat <= 1) notes.pop();
    if (!notes.length) return '';
    const base = notes[0]!.midi;
    const start = notes[0]!.beat;
    return notes.map((n) => `${tick(n.beat - start)}:${n.midi - base}`).join(' ');
  };

  const recallProfile = (level: HookId, kind: string) => {
    let pairs = 0, recalled = 0, notes = 0, songs = 0;
    for (let i = 0; i < 40; i++) {
      const song = generateSong({ seed: `hk-${i}`, hook: level });
      const mel = song.tracks.find((t) => t.layer === 'melody');
      if (!mel) continue;
      songs++;
      notes += mel.notes.length;
      const first = new Map<string, string>();
      for (const sec of song.sections) {
        if (sec.kind !== kind) continue;
        const sig = signature(song, sec);
        if (!sig) continue;
        const key = `${sec.kind}:${sec.lengthBars}`;
        const prior = first.get(key);
        if (prior === undefined) { first.set(key, sig); continue; }
        pairs++;
        if (sig === prior) recalled++;
      }
    }
    return { pct: (recalled / Math.max(1, pairs)) * 100, pairs, notesPerSong: notes / Math.max(1, songs) };
  };

  const off = recallProfile('through', 'chorus');
  const mid = recallProfile('standard', 'chorus');
  const max = recallProfile('earworm', 'chorus');
  check(
    'a chorus comes back as hook rises',
    off.pct === 0 && mid.pct > off.pct && max.pct > 95,
    `through ${off.pct.toFixed(0)}% -> standard ${mid.pct.toFixed(0)}% -> earworm ${max.pct.toFixed(0)}% of ${max.pairs} pairs`,
  );

  // The one thing a high hook setting must not do to jazz. A solo that replays
  // an earlier solo is not a solo.
  const solos = recallProfile('earworm', 'solo');
  check(
    'a solo is never recalled, even at earworm',
    solos.pct === 0,
    `${solos.pct.toFixed(0)}% of ${solos.pairs} solo pairs`,
  );

  // Guards the cheap way to score well on the metric above: a line that repeats
  // because it has stopped playing is not a hook, it is a rest.
  check(
    'repetition does not come from playing less',
    Math.abs(max.notesPerSong - off.notesPerSong) / off.notesPerSong < 0.15,
    `${off.notesPerSong.toFixed(0)} notes/song at through vs ${max.notesPerSong.toFixed(0)} at earworm`,
  );

  // The property the per-section streams exist to provide: hook is an A/B
  // control, so everything that is not the tune must survive it untouched.
  //
  // Instruments are compared per layer rather than as a track list, because a
  // track legitimately disappears when it falls silent — the counter answers
  // the melody's gaps, and a recalled melody leaves different gaps.
  let stable = true;
  const differing: string[] = [];
  for (let i = 0; i < 20; i++) {
    const a = generateSong({ seed: `hs-${i}`, hook: 'through' });
    const b = generateSong({ seed: `hs-${i}`, hook: 'earworm' });
    const instrumentOf = (song: Song) =>
      new Map(song.tracks.map((t) => [t.layer, t.instrument]));
    const ia = instrumentOf(a), ib = instrumentOf(b);
    const palettesAgree = [...ia].every(([layer, name]) => !ib.has(layer) || ib.get(layer) === name);
    const same =
      a.meta.style === b.meta.style && a.meta.era === b.meta.era
      && a.meta.bpm === b.meta.bpm && a.meta.keyLabel === b.meta.keyLabel
      && a.meta.totalBars === b.meta.totalBars
      && a.drums.bank === b.drums.bank
      && JSON.stringify(a.drums.events) === JSON.stringify(b.drums.events)
      && JSON.stringify(a.sections.map((s) => s.kind)) === JSON.stringify(b.sections.map((s) => s.kind))
      && palettesAgree;
    if (!same) { stable = false; differing.push(`hs-${i}`); }
  }
  check(
    'hook leaves form, key, tempo, instruments and drums alone',
    stable,
    stable ? '20 seeds identical apart from the tune' : `differed: ${differing.join(', ')}`,
  );
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

  /**
   * Idiom, which is a different question from agility.
   *
   * Agility says how far an instrument can reach; idiom says what it actually
   * plays. Before idiom existed these were the same question and the answer was
   * always "a wordless singer" — a harp and a trombone handed identical chords
   * produced statistically identical lines, 68-72% steps and 2% arpeggiation
   * apiece, differing only in the widest interval either would take.
   */
  const idiomProfile = (idiom: Idiom) => {
    const inst = IDIOMS[idiom];
    let thirds = 0, moves = 0, gaps = 0, bars = 0;
    for (let s2 = 0; s2 < 60; s2++) {
      const notes = generateMelody({
        chords, beatsPerBar: 4, style, rng: new Rng(`id-${s2}`),
        tonic: 0, mode: 'minor', range: [60, 79], startBeat: 0,
        ornamentScale: 1, leapScale: 1, strictness: 2, agility: 0.9, idiom: inst,
      });
      bars += 8;
      for (let i = 1; i < notes.length; i++) {
        const d = Math.abs(notes[i]!.midi - notes[i - 1]!.midi);
        if (notes[i]!.beat - (notes[i - 1]!.beat + notes[i - 1]!.duration) >= 0.45) gaps++;
        if (d === 0) continue;
        moves++;
        if (d === 3 || d === 4) thirds++;
      }
    }
    return { thirds: (thirds / Math.max(1, moves)) * 100, gaps: gaps / Math.max(1, bars) };
  };
  const mallet = idiomProfile('mallet');
  const wind = idiomProfile('wind');
  const keyboard = idiomProfile('keyboard');
  const brass = idiomProfile('brass');
  check(
    'a mallet breaks chords where a wind instrument runs',
    mallet.thirds > wind.thirds * 1.2,
    `thirds: mallet ${mallet.thirds.toFixed(0)}% vs wind ${wind.thirds.toFixed(0)}%`,
  );
  check(
    'an instrument that has to breathe leaves more air',
    brass.gaps > keyboard.gaps * 1.3,
    `gaps per bar: brass ${brass.gaps.toFixed(2)} vs keyboard ${keyboard.gaps.toFixed(2)}`,
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
