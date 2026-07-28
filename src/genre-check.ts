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
import { generateLeftHand } from './generate/parts.js';
import { getGenre, GENRE_IDS } from './genre/index.js';
import { generateMelody } from './generate/melody.js';
import { comfortableLeap } from './generate/constraints.js';
import type { HookId } from './generate/hook.js';
import { chordPcs, parseRoman } from './core/chord.js';
import { pc } from './core/pitch.js';
import { melodicLine, type DrumVoice, type Song } from './core/types.js';
import { Rng } from './core/rng.js';
import { BANK_VOICES, resolveVoice } from './render/drum-banks.js';
import { HANDS, IDIOMS, type Idiom } from './style/instruments.js';

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

// --- The default mood ------------------------------------------------------
/**
 * A genre's *last* mood is the one every song gets unless someone asks for
 * another by name — `generateSong` passes it to `lookup` as the fallback, so an
 * unspecified mood does not draw at random. That makes the final entry of every
 * mood table load-bearing in a way nothing about it looks load-bearing, and it
 * is why all four genres end theirs with a neutral entry.
 *
 * Asserted because the failure is silent and looks like somebody else's fault.
 * `synth` shipped briefly with four strongly-opinionated moods and no neutral
 * one, so its last entry — `cosmos`, which biases `cinematic` 3.0 and `stalker`
 * 0.4 — became the default for every song. Over 200 songs it produced 98
 * cinematic and 6 stalker, and every symptom pointed at the style weights, which
 * were flat and innocent. One mood in one position, and nothing threw.
 *
 * Neutral means neutral: no style bias, no mode bias, and no thumb on tempo,
 * density, ornament, leap or restraint.
 */
console.log('\nDefault mood');
{
  const offenders: string[] = [];
  for (const gid of GENRE_IDS) {
    const moods = Object.values(getGenre(gid).moods);
    const last = moods[moods.length - 1];
    if (!last) { offenders.push(`${gid}: no moods at all`); continue; }
    const flat = Object.keys(last.styleBias).length === 0
      && last.modeBias.minor === 1 && last.modeBias.major === 1
      && last.tempo === 0 && last.density === 0
      && last.ornament === 1 && last.leap === 1 && last.restraint === 0;
    if (!flat) offenders.push(`${gid}: "${last.id}" biases the draw`);
  }
  check(
    "every genre's default mood is neutral",
    offenders.length === 0,
    offenders.length ? offenders.join('; ') : `${GENRE_IDS.length} genres`,
  );
}

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
/**
 * Pooled across seeds, not measured from one.
 *
 * All three modal comp patterns declare `voicing: 'quartal'`, so the property
 * is real — but it is statistical rather than absolute: register ceilings and
 * collision repair invert a stack now and then, and a fourth turned upside down
 * is a fifth. Measured per seed the rate runs 0.60 to 0.99 around a median of
 * 0.92, so a single-seed assertion at 0.8 passes or fails on which song it
 * happened to draw. It did exactly that, silently, until an unrelated change to
 * the option-resolution order moved the seed from the lucky side to the
 * unlucky one.
 *
 * Pooling every interval across two dozen songs is what the check meant all
 * along, and it is a stronger statement than the one it replaces.
 */
let fourths = 0, total = 0, modalSongs = 0;
for (let i = 0; i < 24; i++) {
  const song = generateSong({ seed: `md-${i}`, genre: 'jazz', style: 'modal' });
  const comp = song.tracks.find((t) => t.layer === 'comp');
  if (!comp) continue;
  modalSongs++;
  const byBeat = new Map<number, number[]>();
  for (const n of comp.notes) {
    const arr = byBeat.get(n.beat) ?? [];
    arr.push(n.midi);
    byBeat.set(n.beat, arr);
  }
  for (const v of byBeat.values()) {
    if (v.length < 3) continue;
    const sorted = v.slice().sort((a, b) => a - b);
    for (let i2 = 1; i2 < sorted.length; i2++) { total++; if (sorted[i2]! - sorted[i2 - 1]! === 5) fourths++; }
  }
}
check('modal comp stacks fourths', total > 0 && fourths / total > 0.8,
  `${((fourths / Math.max(1, total)) * 100).toFixed(0)}% of ${total} intervals across ${modalSongs} songs`);

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

// --- Synth -----------------------------------------------------------------
// Three claims. The first is the genre's central negative one, the second is
// the thing it was built for, and the third exists because two styles in this
// repo describe the same instrument and could quietly converge on the same
// music.
console.log('\nSynth');
{
  const synth = getGenre('synth');

  /**
   * 1. The raised seventh never sounds in a minor-key synth song.
   *
   * This is the line between this genre and iskelmä, whose `scaleForChord`
   * is otherwise the same rule: iskelmä substitutes harmonic minor under a
   * dominant and this one has no dominant in minor to substitute under. Where
   * another idiom writes `V`, this writes `bVII`, and the seventh stays natural.
   *
   * Checked on the *sounding notes* rather than on the tables, because that is
   * where it could break without anyone editing a progression: a chord-scale
   * rule that fell through to a guard clause returning harmonic minor, or a
   * melody generator reaching for a leading tone as a chromatic approach, would
   * both leave the tables innocent and the music wrong.
   */
  let raised = 0, minorNotes = 0, minorSections = 0;
  for (const style of Object.keys(synth.styles)) {
    for (let i = 0; i < 4; i++) {
      const song = generateSong({ seed: `syn-${style}-${i}`, genre: 'synth', style });
      for (const sec of song.sections) {
        if (sec.mode !== 'minor') continue;
        minorSections++;
        const tonic = ((song.meta.tonic + sec.transpose) % 12 + 12) % 12;
        const leadingTone = (tonic + 11) % 12;
        const from = sec.startBar * song.meta.beatsPerBar;
        const to = from + sec.lengthBars * song.meta.beatsPerBar;
        for (const track of song.tracks) {
          // Melodic layers only. A comp voicing takes its notes from the chord,
          // and a chord that legitimately contains the note is not the fault
          // being looked for here.
          if (track.layer !== 'melody' && track.layer !== 'counter') continue;
          for (const n of track.notes) {
            if (n.beat < from || n.beat >= to) continue;
            minorNotes++;
            if (((n.midi % 12) + 12) % 12 === leadingTone) raised++;
          }
        }
      }
    }
  }
  check(
    'no raised seventh in a minor-key song',
    raised === 0,
    `${raised} in ${minorNotes} notes across ${minorSections} minor sections`,
  );

  /**
   * 2. A ramp ramps, and only where it was asked for.
   *
   * Two halves, and the second is the one that would rot silently. `berlin`
   * declares `filter: { shape: 'ramp' }` and its sections must get measurably
   * brighter from their first quarter to their last — a filter opening across
   * sixteen bars is the gesture this genre exists to make, and a bug that
   * flattened it would produce a song that is merely duller rather than one
   * that is obviously broken.
   *
   * The other half is that the three genres with no filter profile carry **no
   * `brightness` at all** — not a brightness of 1. The distinction matters
   * because it is the difference between a renderer emitting nothing and a
   * renderer emitting a full-length grid of the number one per track, which is
   * the same sound and a much worse artefact.
   */
  let ramped = 0, flat = 0, fell = 0;
  for (let i = 0; i < 6; i++) {
    const song = generateSong({ seed: `ramp-${i}`, genre: 'synth', style: 'berlin' });
    const comp = song.tracks.find((t) => t.layer === 'comp');
    if (!comp) continue;
    for (const sec of song.sections) {
      const from = sec.startBar * song.meta.beatsPerBar;
      const span = sec.lengthBars * song.meta.beatsPerBar;
      const inSection = comp.notes.filter((n) => n.beat >= from && n.beat < from + span);
      if (inSection.length < 8) continue;
      const mean = (ns: typeof inSection): number =>
        ns.reduce((a, n) => a + (n.brightness ?? 1), 0) / Math.max(1, ns.length);
      const first = mean(inSection.filter((n) => n.beat < from + span * 0.25));
      const last = mean(inSection.filter((n) => n.beat >= from + span * 0.75));
      if (last < first) fell++;
      /**
       * The outro is exempt, and it is the one exemption worth having.
       *
       * It sits at the bottom of the genre's `kind` table because these records
       * end by shutting the filter, so its whole section quantises to a single
       * dark value — and that is the intended sound rather than a ramp that
       * failed to fire. A filter *opening* across an outro would be exactly
       * backwards: the piece would brighten as it ended.
       *
       * `fell` is checked over every section including this one, because a ramp
       * running backwards is a real bug in a way a flat outro is not.
       */
      if (sec.kind === 'outro') continue;
      if (last > first) ramped++; else flat++;
    }
  }
  check('a ramp opens across its section', flat === 0 && ramped > 0,
    `${ramped} sections opened, ${flat} did not (outros exempt)`);
  check('no section closes as it plays', fell === 0, `${fell} ran backwards`);

  let stray = 0, strayNotes = 0;
  for (const gid of ['iskelma', 'jazz', 'ambient']) {
    for (let i = 0; i < 4; i++) {
      const song = generateSong({ seed: `nofx-${gid}-${i}`, genre: gid });
      for (const t of song.tracks) {
        for (const n of t.notes) { strayNotes++; if (n.brightness !== undefined) stray++; }
      }
    }
  }
  check('genres without a filter profile carry no brightness', stray === 0,
    `${stray} of ${strayNotes} notes carried one`);

  /**
   * 3. `berlin` and `ambient/kosmische` are different music.
   *
   * They describe the same instrument doing two different jobs — a sequencer
   * over a drone that changes once a minute, and a sequencer over harmony that
   * moves every two bars — and nothing but the tables keeps them apart. If they
   * converge, one of them should not exist, and harmonic rhythm is the honest
   * discriminator because it is the thing that actually differs.
   */
  const changesPerEightBars = (genreId: string, styleId: string): number => {
    let changes = 0, bars = 0;
    for (let i = 0; i < 6; i++) {
      const song = generateSong({ seed: `hr-${styleId}-${i}`, genre: genreId, style: styleId });
      for (const sec of song.sections) {
        for (let b = 1; b < sec.chordLabels.length; b++) {
          if (sec.chordLabels[b] !== sec.chordLabels[b - 1]) changes++;
        }
        bars += sec.chordLabels.length;
      }
    }
    return (changes / Math.max(1, bars)) * 8;
  };
  const berlinRate = changesPerEightBars('synth', 'berlin');
  const kosmischeRate = changesPerEightBars('ambient', 'kosmische');
  check(
    'berlin moves faster than kosmische',
    berlinRate > kosmischeRate * 1.5,
    `berlin ${berlinRate.toFixed(1)} vs kosmische ${kosmischeRate.toFixed(1)} changes per 8 bars`,
  );
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
    const layer = sec.solo?.layer ?? 'melody';
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

// --- Brass -----------------------------------------------------------------
// It used to fire a three-note stab on the downbeat of alternate bars behind a
// coin flip. Every one of its notes was exactly half a beat long, and 79% of
// them sounded on top of the melody rather than around it.
console.log('\nBrass');
{
  let notes = 0, clashing = 0, sustained = 0, offBeat = 0;
  const lengths = new Set<string>();
  for (const gid of GENRE_IDS) {
    for (let i = 0; i < 50; i++) {
      const s = generateSong({ seed: `br-${i}`, genre: gid });
      const bpb = s.meta.beatsPerBar;
      const brass = s.tracks.find((t) => t.layer === 'brass')?.notes ?? [];
      const melody = s.tracks.find((t) => t.layer === 'melody')?.notes ?? [];
      for (const n of brass) {
        notes++;
        lengths.add(n.duration.toFixed(2));
        if (n.duration >= 1) sustained++;
        if (Math.abs(n.beat - Math.floor(n.beat / bpb) * bpb) > 1e-6) offBeat++;
        // A swell under a held note is meant to overlap; the fault is a short
        // stab landing on a melody note that is itself moving.
        const clash = melody.some((m) => m.beat < n.beat + n.duration
          && m.beat + m.duration > n.beat && n.duration < 1 && m.duration < 1);
        if (clash) clashing++;
      }
    }
  }
  check(
    'brass does more than one length of note',
    lengths.size > 6,
    `${lengths.size} distinct note lengths across ${notes} notes`,
  );
  check(
    'brass sustains as well as stabs',
    sustained / Math.max(1, notes) > 0.2,
    `${((sustained / Math.max(1, notes)) * 100).toFixed(0)}% held a beat or longer`,
  );
  check(
    'brass answers the tune rather than landing on it',
    clashing / Math.max(1, notes) < 0.2,
    `${((clashing / Math.max(1, notes)) * 100).toFixed(0)}% of stabs clash with a moving melody`,
  );
  check(
    'brass does not only play on the downbeat',
    offBeat / Math.max(1, notes) > 0.4,
    `${((offBeat / Math.max(1, notes)) * 100).toFixed(0)}% land off the barline`,
  );
}

// --- Drum fills ------------------------------------------------------------
// There used to be exactly one fill: descending toms into a crash, in every
// genre, at every boundary, whatever the section was turning into. A tom roll
// is a dance-band gesture and a bebop drummer would not play one into the head.
console.log('\nDrum fills');
{
  const fillVoices = (gid: string) => {
    const seen = new Map<string, number>();
    let bars = 0;
    for (let i = 0; i < 60; i++) {
      const s = generateSong({ seed: `fill-${i}`, genre: gid });
      const bpb = s.meta.beatsPerBar;
      for (const sec of s.sections) {
        const end = (sec.startBar + sec.lengthBars) * bpb;
        // The back half of a section's last bar is where a fill lives.
        const back = s.drums.events.filter((e) => e.beat >= end - bpb / 2 && e.beat < end);
        if (!back.length) continue;
        bars++;
        for (const v of new Set(back.map((e) => e.voice))) {
          seen.set(v, (seen.get(v) ?? 0) + 1);
        }
      }
    }
    const share = (v: string) => (seen.get(v) ?? 0) / Math.max(1, bars);
    return { toms: share('ht') + share('mt') + share('lt'), ride: share('rd'), bars };
  };
  const isk = fillVoices('iskelma');
  const jaz = fillVoices('jazz');
  check(
    'an iskelmä fill reaches for the toms',
    isk.toms > jaz.toms,
    `toms per fill bar: iskelmä ${isk.toms.toFixed(2)} vs jazz ${jaz.toms.toFixed(2)}`,
  );
  check(
    'a jazz fill reaches for the cymbal',
    jaz.ride > isk.ride,
    `ride per fill bar: jazz ${jaz.ride.toFixed(2)} vs iskelmä ${isk.ride.toFixed(2)}`,
  );
}

// --- Drum banks ------------------------------------------------------------
// `render/drum-banks.ts` stands in for voices a bank does not have, and this is
// the assertion that the substitution table actually covers what gets asked of
// it. Two failures it catches that nothing else does:
//
//  - **A bank nobody measured.** `resolveVoice` returns the voice unchanged for
//    a bank missing from `BANK_VOICES`, so an era table that names a new machine
//    gets no substitutions at all. That does not fail loudly, it fails the way
//    the original bug did: `sound <Bank>_<voice> not found` in the browser
//    console, at playback, where nobody is looking. `check-notation.ts` cannot
//    see it either — an unmeasured bank counts as neither substituted nor
//    dropped, so the sweep reports perfect health while the preview is broken.
//  - **A combination the weights never produce.** Era and style are independent
//    controls on the audition page, so a style an era weights at zero is one
//    click away and no randomly generated song will ever cover it. Both are
//    forced here rather than drawn.
console.log('\nDrum banks');
{
  /**
   * Every voice a genre can ask a bank for: the style tables read directly,
   * which is exhaustive over the patterns, plus what real songs add on top of
   * them — fills, their landing cymbal, drum solos — since that is where most
   * of the voices old machines lack come from.
   */
  const emitted = (gid: string): Set<DrumVoice> => {
    const genre = getGenre(gid);
    const voices = new Set<DrumVoice>();
    for (const style of Object.values(genre.styles)) {
      for (const pattern of style.drums) {
        for (const voice of Object.keys(pattern.voices) as DrumVoice[]) voices.add(voice);
      }
    }
    for (const era of Object.keys(genre.eras)) {
      for (const sid of Object.keys(genre.styles)) {
        for (let i = 0; i < 3; i++) {
          const song = generateSong({ seed: `bank-${gid}-${era}-${sid}-${i}`, genre: gid, era, style: sid });
          for (const e of song.drums.events) voices.add(e.voice);
        }
      }
    }
    return voices;
  };

  const unmeasured: string[] = [];
  const unplayable: string[] = [];
  let pairs = 0;
  for (const gid of GENRE_IDS) {
    const voices = emitted(gid);
    for (const era of Object.values(getGenre(gid).eras)) {
      for (const [bank] of era.drumBanks) {
        if (!BANK_VOICES[bank]) { unmeasured.push(`${gid}/${era.id}: ${bank}`); continue; }
        for (const voice of voices) {
          pairs++;
          if (!resolveVoice(bank, voice)) unplayable.push(`${bank} cannot play ${voice}`);
        }
      }
    }
  }
  check(
    'every bank an era names has been measured',
    unmeasured.length === 0,
    unmeasured.length ? unmeasured.join(', ') : `${Object.keys(BANK_VOICES).length} banks in the table`,
  );
  check(
    'every voice a genre plays resolves on all its banks',
    unplayable.length === 0,
    unplayable.length ? [...new Set(unplayable)].join(', ') : `${pairs} bank x voice pairs, substitutions included`,
  );

  // Substitution is acceptable for every voice but this one. A ride standing in
  // as a closed hat is fine in iskelmä, where it is decoration; in jazz the ride
  // *is* the pulse, and a bank without its own would pass the check above while
  // quietly making the genre impossible.
  const ridelessJazz = Object.values(getGenre('jazz').eras)
    .flatMap((era) => era.drumBanks.map(([bank]) => bank))
    .filter((bank) => resolveVoice(bank, 'rd') !== 'rd');
  check(
    'every jazz bank has a ride of its own',
    ridelessJazz.length === 0,
    ridelessJazz.length ? ridelessJazz.join(', ') : 'no jazz bank falls back to the hat',
  );
}

// --- Metre -----------------------------------------------------------------
// Two things about an asymmetric bar cannot be checked by listening to one song
// and cannot be derived from the notes afterwards: that the grouping adds up,
// and that the accents land on it. A grouping that does not sum to the bar
// produces a phrase whose accents drift a sixteenth per bar, which sounds like
// a fault in the swing rather than like the arithmetic error it is.
console.log('\nMetre');
{
  const wrong: string[] = [];
  let grouped = 0;
  for (const gid of GENRE_IDS) {
    for (const [sid, style] of Object.entries(getGenre(gid).styles)) {
      if (!style.groups) continue;
      grouped++;
      const sum = style.groups.reduce((a, b) => a + b, 0);
      const want = style.beatsPerBar * 4;
      if (sum !== want) wrong.push(`${gid}/${sid}: ${sum} vs ${want}`);
    }
  }
  check(
    'every grouping fills its own bar',
    wrong.length === 0,
    wrong.length ? wrong.join('; ') : `${grouped} grouped styles`,
  );

  /**
   * The accents follow the grouping, not the arithmetic.
   *
   * Measured on the kit, because that is where it is audible and because the
   * drum generator is the one that used to get it wrong: `accentOf` derived
   * strength by counting in fours, which in a 2+2+3 accents the weak eighth of
   * the first two groups and leaves the head of the third as an offbeat. So the
   * test is that the mean velocity on a group head beats the mean everywhere
   * else — a band playing 7/8 rather than a band playing 14/16.
   */
  for (const sid of ['odd', 'fusion']) {
    const style = getGenre('jazz').styles[sid]!;
    const heads = new Set<number>();
    let at = 0;
    for (const g of style.groups!) { heads.add(at); at += g; }
    let onHead = 0, onHeadN = 0, off = 0, offN = 0;
    for (let i = 0; i < 12; i++) {
      const s = generateSong({ seed: `mt-${i}`, genre: 'jazz', style: sid });
      const bar = s.meta.beatsPerBar;
      for (const e of s.drums.events) {
        const slot = Math.round(((e.beat % bar) + bar) % bar * 4);
        if (heads.has(slot)) { onHead += e.velocity; onHeadN++; }
        else { off += e.velocity; offN++; }
      }
    }
    const a = onHead / Math.max(1, onHeadN);
    const b = off / Math.max(1, offN);
    check(
      `${sid}: the kit accents the grouping`,
      a > b,
      `${a.toFixed(3)} on the ${style.groups!.length} group heads vs ${b.toFixed(3)} elsewhere`,
    );
  }

  /**
   * A cycle that is not the bar has to actually drift.
   *
   * The whole point of `cycle` is that the figure and the barline disagree, and
   * the failure mode if the generators ever go back to walking bars is silent:
   * the pattern still plays, it just lands in the same place every bar and
   * sounds like an ordinary riff. So the test is that the figure's onsets, taken
   * modulo the bar, land in more than one place.
   */
  {
    const style = getGenre('jazz').styles.fusion!;
    const drifting = style.drums.find((d) => d.cycle);
    const bars = 8;
    const slotsPerBar = style.beatsPerBar * 4;
    const landings = new Set<number>();
    if (drifting) {
      for (const slots of Object.values(drifting.voices)) {
        for (const at of slots ?? []) {
          for (let base = 0; base < bars * slotsPerBar; base += drifting.cycle!) {
            const slot = base + at;
            if (slot < bars * slotsPerBar) landings.add(slot % slotsPerBar);
          }
        }
      }
    }
    check(
      'a figure on its own cycle drifts against the bar',
      landings.size > 2,
      drifting ? `${drifting.name} lands on ${landings.size} slots of ${slotsPerBar}` : 'no cycled pattern',
    );
  }
}

// --- Two hands -------------------------------------------------------------
// A two-handed lead is one track carrying two parts, and everything that
// measures melody depends on being able to take them apart again — see
// `melodicLine`. Its rule is that a note sounding *alone* is the right hand, so
// a left hand that ever plays a single note is not merely voiced oddly, it is
// counted as the tune. That happened: an ostinato written one note at a time
// dropped the reported mean of the jazz melody line by four semitones, which was
// an accompaniment being read as a melody.
console.log('\nTwo hands');
{
  const missing: string[] = [];
  const figureless: string[] = [];
  for (const gid of GENRE_IDS) {
    for (const [sid, style] of Object.entries(getGenre(gid).styles)) {
      if (!style.twoHanded) continue;
      for (const [id] of style.twoHanded.instruments) {
        if (!HANDS[id]) missing.push(`${gid}/${sid}: ${id}`);
      }
      const offersOstinato = (style.twoHanded.modes ?? []).some(([m]) => m === 'ostinato');
      if (offersOstinato && !style.twoHanded.ostinato) figureless.push(`${gid}/${sid}`);
    }
  }
  check(
    'every two-handed lead has a hand to play with',
    missing.length === 0,
    missing.length ? missing.join('; ') : 'all leads have a HandSpec',
  );
  check(
    'a style that vamps has a figure to vamp on',
    figureless.length === 0,
    figureless.length ? figureless.join('; ') : 'every ostinato mode has its hits',
  );

  /**
   * The invariant, tested at the source rather than on the finished track.
   *
   * It cannot be checked downstream, and that is the whole difficulty: once the
   * two hands are merged into one track, a left-hand note sounding alone is
   * indistinguishable from a melody note sounding alone — `melodicLine` reads it
   * as the tune and is not wrong to, because nothing in the notes says
   * otherwise. So the property has to be asserted where the two parts still
   * exist separately, which is here, against `generateLeftHand` itself.
   *
   * What has to hold, for every mode: **a left-hand onset either sounds two or
   * more notes, or lands on a note of the line.** Two notes are a chord and read
   * as an accompaniment; landing on the line puts a melody note above it to be
   * recovered. One note in a hole is neither, and is the case that broke.
   */
  const style = getGenre('jazz').styles.trio!;
  const spec = HANDS.piano!;
  const chords = ['i7', 'iv7', 'bVImaj7', 'V7'].map((label) => parseRoman(label, 'minor'));
  let checked = 0;
  const orphans: string[] = [];
  for (const mode of ['answer', 'unison', 'block', 'ostinato'] as const) {
    for (let i = 0; i < 12; i++) {
      const rng = new Rng(`hand-${mode}-${i}`);
      const line = generateMelody({
        chords, beatsPerBar: 4, style, rng: new Rng(`hand-line-${i}`),
        tonic: 0, mode: 'minor', range: [65, 84], startBeat: 0,
        ornamentScale: 1, leapScale: 1, strictness: 1, agility: 1,
      });
      if (!line.length) continue;
      const onLine = new Set(line.map((n) => n.beat.toFixed(4)));
      const hand = generateLeftHand(
        { chords, beatsPerBar: 4, startBeat: 0, rng, style },
        line,
        {
          mode, spec, density: 0.9,
          ...(style.twoHanded?.ostinato ? { ostinato: style.twoHanded.ostinato } : {}),
        },
      );
      const byBeat = new Map<string, number>();
      for (const n of hand) {
        const at = n.beat.toFixed(4);
        byBeat.set(at, (byBeat.get(at) ?? 0) + 1);
      }
      for (const [at, count] of byBeat) {
        checked++;
        if (count === 1 && !onLine.has(at)) orphans.push(`${mode}@${at}`);
      }
    }
  }
  check(
    'the left hand never sounds a note by itself',
    orphans.length === 0,
    orphans.length ? orphans.slice(0, 4).join(', ') : `${checked} left-hand onsets across 4 modes`,
  );

  let octaves = 0, chordsPlayed = 0, songs = 0;
  for (const sid of ['trio', 'odd', 'fusion']) {
    for (let i = 0; i < 14; i++) {
      const s = generateSong({ seed: `th-${sid}-${i}`, genre: 'jazz', style: sid });
      const track = s.tracks.find((t) => t.layer === 'melody');
      if (!track?.twoHanded) continue;
      songs++;
      const byBeat = new Map<number, number[]>();
      for (const n of track.notes) {
        const at = byBeat.get(n.beat) ?? [];
        at.push(n.midi);
        byBeat.set(n.beat, at);
      }
      for (const group of byBeat.values()) {
        if (group.length === 2 && Math.abs(group[0]! - group[1]!) === 12) octaves++;
        if (group.length > 2) chordsPlayed++;
      }
    }
  }
  check(
    'the left hand doubles and chords, not just answers',
    octaves > 0 && chordsPlayed > 0,
    `${octaves} octave doublings and ${chordsPlayed} chords over ${songs} songs`,
  );
}

// --- Counter-melody --------------------------------------------------------
// The answer has to be a *line* and it has to be *independent*. Before it was
// rewritten it was neither: it restarted from the chord root nearest the
// instrument's centre in every bar and cycled root-third-fifth, which showed up
// as 53% thirds and 24% minor sixths, and it doubled the tune at the unison or
// octave on 29% of the notes where the two overlapped.
console.log('\nCounter-melody');
{
  let steps = 0, thirds = 0, moves = 0, overlap = 0, doubled = 0, multi = 0, figures = 0;
  for (const gid of GENRE_IDS) {
    for (let i = 0; i < 40; i++) {
      const s = generateSong({ seed: `cm-${i}`, genre: gid });
      const bpb = s.meta.beatsPerBar;
      // A solo section puts the *lead* on the counter instrument; those notes
      // are a melody, not an answer, and counting them measures the wrong thing.
      const answering = (beat: number) => s.sections.some((sec) => sec.solo?.layer !== 'counter'
        && beat >= sec.startBar * bpb && beat < (sec.startBar + sec.lengthBars) * bpb);
      const counter = (s.tracks.find((t) => t.layer === 'counter')?.notes ?? [])
        .filter((n) => answering(n.beat)).sort((a, b) => a.beat - b.beat);
      // The line, not the track. On a two-handed lead the track also carries
      // that player's own accompaniment, and an answer landing an octave above a
      // left-hand chord tone is not the answer doubling the tune — it is the
      // answer doing its job over a comp, which is what every other style in the
      // catalogue has a separate comp track for.
      const melodyTrack = s.tracks.find((t) => t.layer === 'melody');
      const melody = (melodyTrack ? melodicLine(melodyTrack) : [])
        .slice().sort((a, b) => a.beat - b.beat);
      if (!counter.length) continue;

      let figure = 0;
      for (let j = 0; j < counter.length; j++) {
        const n = counter[j]!;
        const prior = counter[j - 1];
        if (!prior || n.beat - prior.beat > 1.01) {
          if (figure) { figures++; if (figure > 1) multi++; }
          figure = 1;
        } else {
          figure++;
          const d = Math.abs(n.midi - prior.midi);
          if (d > 0) { moves++; if (d <= 2) steps++; else if (d <= 4) thirds++; }
        }
        const under = melody.find((m) => m.beat <= n.beat + 1e-6 && m.beat + m.duration > n.beat + 1e-6);
        if (under) { overlap++; if (Math.abs(under.midi - n.midi) % 12 === 0) doubled++; }
      }
      if (figure) { figures++; if (figure > 1) multi++; }
    }
  }
  const stepPct = (steps / Math.max(1, moves)) * 100;
  const thirdPct = (thirds / Math.max(1, moves)) * 100;
  check(
    'the answer is a line, not an arpeggio',
    stepPct > thirdPct,
    `${stepPct.toFixed(0)}% stepwise vs ${thirdPct.toFixed(0)}% thirds over ${moves} moves`,
  );
  check(
    'the answer is a phrase, not a blip',
    multi / Math.max(1, figures) > 0.6,
    `${((multi / Math.max(1, figures)) * 100).toFixed(0)}% of ${figures} figures have more than one note`,
  );
  check(
    'the answer never doubles the tune at the unison or octave',
    doubled === 0,
    `${doubled} of ${overlap} overlapping notes`,
  );
}

// --- Solos -----------------------------------------------------------------
/**
 * The five properties in `docs/concert-plan.md` §4.2, each one a thing a solo
 * *is* rather than a setting it happens to use.
 *
 * Before `generate/solo.ts` existed, a solo section was the melody engine with
 * `soloistic: true` pointed at the counter instrument, and a solo and a head
 * differed by nothing worth counting: 1.02 against 0.98 onsets per beat, 78%
 * against 80% stepwise motion. Every number below is one that separates the
 * two now, and none of them could have been measured then.
 *
 * Measured at **`strict`**, and that is the point of measuring it at all. The
 * concert lifts smoothness above jazz's `light` default (§6), so the vocabulary
 * has to carry the interest at the tight end of the axis rather than relying on
 * a loose constraint level. If these numbers only hold at `light`, the solo
 * engine is not doing the work the plan says it should.
 */
console.log('\nSolos');
{
  interface SoloStats {
    sections: number;
    notes: number;
    /** Chord changes the soloist plays a downbeat on, and how many were guide tones. */
    landings: number; guide: number; changes: number;
    /** Three-gram shape recurrence within one chorus. */
    grams: number; repeated: number;
    /** Silence as a fraction of the chorus, per section. */
    rest: number[];
    /** Onsets and mean velocity in each half of the arc. */
    early: number; late: number; vEarly: number; vEarlyN: number; vLate: number; vLateN: number;
    risingSections: number; arcSections: number;
    /** Choruses that came out byte-identical to another in the same song. */
    identical: number; pairs: number;
    layers: Map<string, number>;
    backings: Map<string, number>;
    /** Solo choruses where the same player also took the one before. */
    consecutive: number; handovers: number;
    /** Drum choruses: distinct kit voices, and whether the hand-off crashed. */
    kitVoices: number[]; kitLandings: number; kitSolos: number;
    /** Comp onsets per bar, behind a solo and behind the head. */
    compUnderSolo: number; barsUnderSolo: number; compUnderHead: number; barsUnderHead: number;
    /** Named soloists whose instrument does not match a track. */
    misnamed: number;
  }

  const measure = (gid: string, songs: number): SoloStats => {
    const m: SoloStats = {
      sections: 0, notes: 0, landings: 0, guide: 0, changes: 0, grams: 0, repeated: 0,
      rest: [], early: 0, late: 0, vEarly: 0, vEarlyN: 0, vLate: 0, vLateN: 0,
      risingSections: 0, arcSections: 0, identical: 0, pairs: 0,
      layers: new Map(), backings: new Map(),
      consecutive: 0, handovers: 0, kitVoices: [], kitLandings: 0, kitSolos: 0,
      compUnderSolo: 0, barsUnderSolo: 0, compUnderHead: 0, barsUnderHead: 0, misnamed: 0,
    };

    for (let i = 0; i < songs; i++) {
      const song = generateSong({ seed: `solo-${i}`, genre: gid, strictness: 'strict' });
      const bpb = song.meta.beatsPerBar;
      const comp = song.tracks.find((t) => t.layer === 'comp')?.notes ?? [];
      const onsetsIn = (notes: readonly { beat: number }[], from: number, to: number) =>
        new Set(notes.filter((n) => n.beat >= from && n.beat < to).map((n) => n.beat.toFixed(3))).size;

      const signatures: string[] = [];
      let previousSoloist: string | undefined;

      for (const sec of song.sections) {
        const from = sec.startBar * bpb;
        const to = from + sec.lengthBars * bpb;

        if (!sec.solo) {
          previousSoloist = undefined;
          if (sec.kind === 'verse' || sec.kind === 'chorus') {
            m.compUnderHead += onsetsIn(comp, from, to);
            m.barsUnderHead += sec.lengthBars;
          }
          continue;
        }

        m.sections++;
        /**
         * The name has to match the track, because outside the generator that
         * is the only way to find the player. A stage points a follow spot by
         * looking up `Section.solo.instrument` in the cast; a name that matches
         * nothing lights nobody. The kit is the one exception and it is not a
         * `Track` at all — see the note where `Section.solo` is set.
         */
        const named = sec.solo.layer === 'drums'
          ? sec.solo.instrument === 'drum kit'
          : song.tracks.some((t) => t.layer === sec.solo!.layer && t.instrument === sec.solo!.instrument);
        if (!named) m.misnamed++;
        m.layers.set(sec.solo.layer, (m.layers.get(sec.solo.layer) ?? 0) + 1);
        m.backings.set(sec.solo.backing, (m.backings.get(sec.solo.backing) ?? 0) + 1);
        if (previousSoloist !== undefined) {
          m.handovers++;
          if (previousSoloist === sec.solo.layer) m.consecutive++;
        }
        previousSoloist = sec.solo.layer;

        // Only where the comp is *comping*. Where the comp instrument is the
        // one soloing there are no chords to thin, and counting the solo line
        // as comping would measure the opposite of what this asks.
        if (sec.solo.backing === 'comping' && sec.solo.layer !== 'comp') {
          m.compUnderSolo += onsetsIn(comp, from, to);
          m.barsUnderSolo += sec.lengthBars;
        }

        if (sec.solo.layer === 'drums') {
          m.kitSolos++;
          const inSection = song.drums.events.filter((e) => e.beat >= from && e.beat < to);
          m.kitVoices.push(new Set(inSection.map((e) => e.voice)).size);
          // The hand-off: a crash on the downbeat the band comes back in on,
          // which belongs to the section after this one.
          if (song.drums.events.some((e) => e.voice === 'cr' && Math.abs(e.beat - to) < 0.26)) {
            m.kitLandings++;
          }
          continue;
        }

        const track = song.tracks.find((t) => t.layer === sec.solo!.layer);
        const notes = (track?.notes ?? [])
          .filter((n) => n.beat >= from - 1e-6 && n.beat < to - 1e-6)
          .sort((a, b) => a.beat - b.beat);
        if (!notes.length) continue;
        m.notes += notes.length;
        signatures.push(notes.map((n) => `${Math.round((n.beat - notes[0]!.beat) * 1000)}:${n.midi - notes[0]!.midi}`).join(' '));

        // 1. Guide tones on the changes. Roman numerals are read relative to
        //    the tonic, so the section's own transposition has to be put back.
        const chords = sec.chordLabels.map((l) => parseRoman(l, sec.mode));
        const localTonic = ((song.meta.tonic + sec.transpose) % 12 + 12) % 12;
        for (let bar = 0; bar < sec.lengthBars; bar++) {
          const here = chords[bar]!;
          const before = bar > 0 ? chords[bar - 1] : undefined;
          if (before && before.root === here.root && before.quality === here.quality) continue;
          m.changes++;
          const onset = notes.find((n) => Math.abs(n.beat - (from + bar * bpb)) < 0.13);
          if (!onset) continue;
          m.landings++;
          const pcs = chordPcs({ ...here, root: pc(here.root + localTonic) });
          if (pcs[1] === pc(onset.midi) || pcs[3] === pc(onset.midi)) m.guide++;
        }

        /**
         * 2. Motivic recurrence, as three-gram shapes.
         *
         * A shape is the inter-onset gap and the *direction* of the interval,
         * not its size — because a sequence bends to the changes by design, so
         * demanding identical semitones would only count the restatements that
         * happened to land over the same chord quality. Gap and direction is
         * what survives being sequenced, and it is what the ear tracks.
         */
        const shape: string[] = [];
        for (let j = 1; j < notes.length; j++) {
          shape.push(`${Math.round((notes[j]!.beat - notes[j - 1]!.beat) * 4)}${Math.sign(notes[j]!.midi - notes[j - 1]!.midi)}`);
        }
        const counts = new Map<string, number>();
        for (let j = 0; j + 3 <= shape.length; j++) {
          const g = shape.slice(j, j + 3).join(',');
          counts.set(g, (counts.get(g) ?? 0) + 1);
        }
        for (const c of counts.values()) { m.grams += c; if (c > 1) m.repeated += c; }

        /**
         * 3, 4. Space and the arc.
         *
         * Trading choruses are excluded from both. There the soloist genuinely
         * has only half the bars, so a rest fraction over the whole section
         * measures the trading rather than the phrasing, and the second half of
         * the "arc" is somebody else's four bars.
         */
        if (sec.solo.backing === 'trade') continue;

        /**
         * Silence counted in *beats with nothing starting in them*, not in
         * unfilled sixteenths.
         *
         * The sixteenth version measures articulation rather than space: a line
         * of swung eighths leaves a gap after every note by construction — the
         * swing shortens the offbeat and holds its end — and scored 47% "rest"
         * on a chorus that never stops playing. The rests a listener hears are
         * the beats the soloist sits out, which is what this counts.
         */
        const beats = Math.round(to - from);
        const played = new Set<number>();
        for (const n of notes) played.add(Math.floor(n.beat - from));
        m.rest.push(1 - played.size / Math.max(1, beats));

        // The last two bars are handed back deliberately, so the arc is
        // measured over what is left of the chorus rather than over all of it.
        const arcEnd = from + Math.max(1, sec.lengthBars - 2) * bpb;
        const mid = (from + arcEnd) / 2;
        let early = 0, late = 0;
        for (const n of notes) {
          if (n.beat >= arcEnd) continue;
          if (n.beat < mid) { early++; m.vEarly += n.velocity; m.vEarlyN++; }
          else { late++; m.vLate += n.velocity; m.vLateN++; }
        }
        if (early + late > 3) {
          m.arcSections++;
          m.early += early;
          m.late += late;
          if (late >= early) m.risingSections++;
        }
      }

      for (let a = 0; a < signatures.length; a++) {
        for (let b = a + 1; b < signatures.length; b++) {
          m.pairs++;
          if (signatures[a] === signatures[b]) m.identical++;
        }
      }
    }
    return m;
  };

  // More songs than the others need, because only about half the iskelmä forms
  // contain a break at all and the per-section arc rate is noisy below fifty.
  const isk = measure('iskelma', 60);
  const jaz = measure('jazz', 40);
  const amb = measure('ambient', 24);
  const pct = (a: number, b: number) => (a / Math.max(1, b)) * 100;
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

  // --- Ambient's negative claim ------------------------------------------
  // The genre has no solos and its forms contain none. Both halves matter:
  // a solo section with no profile would fall back to putting the lead on the
  // counter instrument, which is the behaviour this engine replaces.
  check(
    'ambient has no soloist anywhere',
    amb.sections === 0 && getGenre('ambient').solo === undefined,
    `${amb.sections} solo sections, profile ${getGenre('ambient').solo ? 'present' : 'absent'}`,
  );

  for (const [gid, m] of [['iskelma', isk], ['jazz', jaz]] as const) {
    check(
      `${gid}: the line lands on the guide tones`,
      pct(m.guide, m.landings) > 65 && pct(m.landings, m.changes) > 30,
      `${pct(m.guide, m.landings).toFixed(0)}% of ${m.landings} landings are the 3rd or 7th; the line plays ${pct(m.landings, m.changes).toFixed(0)}% of ${m.changes} changes`,
    );
    check(
      `${gid}: a figure comes back inside a chorus`,
      pct(m.repeated, m.grams) > 9,
      `${pct(m.repeated, m.grams).toFixed(1)}% of ${m.grams} three-gram shapes recur`,
    );
    check(
      `${gid}: the chorus leaves room`,
      mean(m.rest) > 0.15 && mean(m.rest) < 0.55,
      `${(mean(m.rest) * 100).toFixed(0)}% of ${m.rest.length} choruses is silence`,
    );
    check(
      `${gid}: the solo builds`,
      m.late > m.early && m.vLate / Math.max(1, m.vLateN) > m.vEarly / Math.max(1, m.vEarlyN)
        && pct(m.risingSections, m.arcSections) > 60,
      `${m.early} -> ${m.late} onsets, ${(m.vEarly / Math.max(1, m.vEarlyN)).toFixed(2)} -> ${(m.vLate / Math.max(1, m.vLateN)).toFixed(2)} velocity, rising in ${pct(m.risingSections, m.arcSections).toFixed(0)}% of ${m.arcSections} choruses`,
    );
    /**
     * The one that catches the worst failure. Two choruses of a solo that are
     * the same notes is not a solo taken twice, it is a loop — and it is what
     * every shortcut in this area produces, because the cheapest way to make a
     * solo section is to generate one and repeat it.
     */
    check(
      `${gid}: no two solo choruses are the same`,
      m.identical === 0,
      `${m.identical} identical of ${m.pairs} pairs, over ${m.sections} choruses`,
    );
  }

  check(
    'the named soloist is a player who exists',
    isk.misnamed === 0 && jaz.misnamed === 0,
    `${isk.misnamed + jaz.misnamed} of ${isk.sections + jaz.sections} choruses name an instrument no track carries`,
  );

  // --- Rotation ------------------------------------------------------------
  // Jazz only. Iskelmä's rotation has one entry in it on purpose — the break
  // belongs to the featured instrument and stays with it — so "never twice in
  // a row" is a claim about the genre that has more than one candidate.
  check(
    'jazz never gives one player two choruses in a row',
    jaz.consecutive === 0 && jaz.layers.size >= 3,
    `${jaz.consecutive} repeats over ${jaz.handovers} hand-offs; ${[...jaz.layers].map(([k, v]) => `${k} ${v}`).join(', ')}`,
  );
  check(
    'a tanssilava band never hands the break to the drummer',
    !isk.layers.has('drums') && !isk.backings.has('trade'),
    `${[...isk.layers.keys()].join(', ')} — backings ${[...isk.backings.keys()].join(', ')}`,
  );

  // --- Drum solos ----------------------------------------------------------
  // Two claims, and both are about it being a *solo*. A drum solo that stays on
  // one drum is a drum roll, and one that stops rather than handing back sounds
  // like it was interrupted — the hand-off is the part the audience hears.
  check(
    'a drum solo is orchestrated around the kit',
    jaz.kitSolos > 0 && Math.min(...jaz.kitVoices) >= 4,
    `${jaz.kitSolos} drum choruses, ${mean(jaz.kitVoices).toFixed(1)} voices each (fewest ${Math.min(...jaz.kitVoices)})`,
  );
  check(
    'a drum solo lands the band back in',
    jaz.kitSolos > 0 && jaz.kitLandings === jaz.kitSolos,
    `${jaz.kitLandings}/${jaz.kitSolos} ended on a crash on the returning downbeat`,
  );

  // --- Comping -------------------------------------------------------------
  // The change that most makes a solo sound like a solo rather than like a
  // different melody over the same accompaniment: the comp gets sparser and
  // later, answering the soloist instead of running its figure at them.
  const underSolo = jaz.compUnderSolo / Math.max(1, jaz.barsUnderSolo);
  const underHead = jaz.compUnderHead / Math.max(1, jaz.barsUnderHead);
  check(
    'the comp thins behind a jazz solo',
    underSolo < underHead * 0.8,
    `${underSolo.toFixed(2)} onsets/bar behind a solo vs ${underHead.toFixed(2)} behind the head`,
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
