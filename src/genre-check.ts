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
import { generateDrums, generateLeftHand, planKitVariation } from './generate/parts.js';
import { getGenre, GENRE_IDS } from './genre/index.js';
import { composeSectionTune } from './tune/adapt.js';
import { getHook } from './generate/hook.js';
import { comfortableLeap, EMPTY_ACCOMPANIMENT, RULES } from './core/rules.js';
import type { HookId } from './generate/hook.js';
import { chordPcs, parseRoman, type Chord } from './core/chord.js';
import { makeScale } from './core/scale.js';
import { pc } from './core/pitch.js';
import { canVary, melodicLine, type DrumVoice, type Song } from './core/types.js';
import { Rng } from './core/rng.js';
import { BANK_VOICES, resolveVoice } from './render/drum-banks.js';
import { HANDS, IDIOMS, type Idiom, type IdiomProfile } from './style/instruments.js';
import type { Style } from './style/types.js';
import type { TransitionPalette } from './generate/transition.js';
import { FEELS, type FeelId } from './style/feel.js';

const problems: string[] = [];
const check = (label: string, pass: boolean, detail: string) => {
  console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${label.padEnd(42)} ${detail}`);
  if (!pass) problems.push(label);
};

/**
 * One melodic line, with everything but the thing under test held fixed.
 *
 * The instrument checks below have to compare lines that differ *only* in agility or
 * idiom, which no real song can give you: brass and vibraphone appear in different
 * styles and the style's own character swamps the player's. So they go through the
 * tune engine directly.
 *
 * `attempts: 1` on purpose. The audition would otherwise select for the judge's
 * taste rather than the instrument's, and the judge does not know who is playing —
 * a hundred tries at a trombone line, scored on how interesting it is, quietly
 * measures the scoring rather than the trombone.
 */
const probeLine = (args: {
  style: Style;
  chords: Chord[];
  tag: string;
  range: [number, number];
  strictness: number;
  agility: number;
  idiom?: IdiomProfile;
}) => composeSectionTune({
  style: args.style,
  hook: getHook('standard'),
  kind: 'verse',
  chords: args.chords,
  startBeat: 0,
  tonic: 0,
  mode: 'minor',
  range: args.range,
  scaleForChord: (t, _m, chord) => makeScale(t, chord.dominantFunction ? 'harmonicMinor' : 'minor'),
  tag: args.tag,
  strictness: args.strictness,
  rules: RULES,
  accompaniment: EMPTY_ACCOMPANIMENT,
  agility: args.agility,
  attempts: 1,
  ...(args.idiom ? { idiom: args.idiom } : {}),
}).notes;

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

/**
 * Blue notes, sampled by the chord sounding underneath them.
 *
 * `blues` is the only style in the catalogue that overrides `Genre.scaleForChord`
 * (see `jazz/styles.ts`), and this is the measurement that forced it. Under the
 * genre's chord-scale mapping every dom7 took mixolydian on its own root, so a
 * blues in F played F mixolydian over I7 and B♭ mixolydian over IV7 — and over
 * 25 major-key blues songs that put the ♭3 on 1.4% of melody notes over I7
 * against 17.5% for the ♮3. The one place the ♭3 did appear was over IV7, where
 * it is that chord's own ♭7 and has no friction in it at all.
 *
 * Both numbers are shares of melody notes in bars carrying that numeral, with
 * the section's own transposition put back first — a roman numeral is read
 * against the tonic, so a degree means nothing until it is.
 */
{
  const tally = {
    I7: { n: 0, flat3: 0, nat3: 0, flat5: 0 },
    IV7: { n: 0, flat3: 0, nat3: 0, flat5: 0 },
  };
  for (let i = 0; i < 25; i++) {
    const song = generateSong({ seed: `bn-${i}`, genre: 'jazz', style: 'blues', mode: 'major' });
    const melody = song.tracks.find((t) => t.layer === 'melody');
    if (!melody) continue;
    const bpb = song.meta.beatsPerBar;
    for (const sec of song.sections) {
      const localTonic = ((song.meta.tonic + sec.transpose) % 12 + 12) % 12;
      for (let bar = 0; bar < sec.lengthBars; bar++) {
        const label = sec.chordLabels[bar];
        if (label !== 'I7' && label !== 'IV7') continue;
        const from = (sec.startBar + bar) * bpb;
        const t = tally[label];
        for (const note of melody.notes) {
          if (note.beat < from - 1e-6 || note.beat >= from + bpb - 1e-6) continue;
          t.n++;
          const deg = ((note.midi - localTonic) % 12 + 12) % 12;
          if (deg === 3) t.flat3++;
          if (deg === 4) t.nat3++;
          if (deg === 6) t.flat5++;
        }
      }
    }
  }
  const share = (hits: number, of: number) => (100 * hits) / Math.max(1, of);
  const flat3 = share(tally.I7.flat3, tally.I7.n);
  const nat3 = share(tally.I7.nat3, tally.I7.n);

  /**
   * The bar is 5%, and the plan asked for 10% *and* for the ♭3 to outnumber the
   * ♮3. It now outnumbers it, and it took two changes rather than one.
   *
   * The chord scale was the first and could not finish the job on its own: with
   * the tonic blues scale in place the ♭3 went up more than fivefold and the ♮3
   * barely moved, 17.5% → 17.2%, because `chooseAnchor` and `settle` in
   * `tune/skeleton.ts` built the backbone out of `chordPcs` alone and the I7's
   * major third is a chord tone. 82% of those ♮3s landed on a beat, which is what
   * a structural note looks like from here. Filtering the structural passes to
   * chord tones the prevailing scale also holds — wave 2, and a general change
   * rather than a blues one — halved it: ♭3 8.3% against ♮3 8.2%.
   *
   * The threshold stays at 5% rather than being tightened to `flat3 > nat3`. The
   * two are a tenth of a point apart, so asserting the ordering would be asserting
   * noise. 5% is aimed at the override: drop that and the ♭3 falls to 1.4%. The
   * filter's half of the work is the ♮3 printed beside it, which nothing asserts —
   * lose the filter and the ♭3 stays at 7.9% and passes while the ♮3 doubles, so
   * that is the number to read when this line looks fine and the blues does not.
   */
  check(
    'the blue third reaches the I7',
    flat3 > 5,
    `♭3 ${flat3.toFixed(1)}% vs ♮3 ${nat3.toFixed(1)}% of ${tally.I7.n} notes on I7`,
  );

  /**
   * The tonic scale holds: the line does not re-orient onto each chord.
   *
   * Both blue notes over both chords is the operative form of "one scale across
   * all twelve bars". Under the genre mapping the ♭5 sat at 1.2% over I7 and
   * 0.6% over IV7 — it is in no scale that switch can return, so it was nowhere
   * — and the ♭3 was 1.4% over I7 against 15.7% over IV7, which is not one
   * tonic scale but two chord scales that happen to share a note.
   *
   * §8 of the plan wrote this as a subset test: the pitch classes used over IV7
   * inside those used over I7. That version should still not be written, though
   * for less of a reason than it was. It used to fail on the skeleton — the two
   * commonest notes over IV7 were IV's own root and its major third, both anchors
   * straight out of `chordPcs` and both rare over I7, so the set difference
   * measured where the backbone landed rather than which scale was in force. Once
   * the structural passes started asking the scale, IV's major third stopped being
   * an anchor and fell to 5.4%, and the two commonest notes over IV7 became IV's
   * root and the key's own ♭3 — which is the tonic scale holding, said in the
   * histogram. Shares remain the right instrument for saying so: a set test would
   * still turn on a handful of chromatic approach notes either side.
   */
  const blue = [
    ['♭3/I7', share(tally.I7.flat3, tally.I7.n)],
    ['♭5/I7', share(tally.I7.flat5, tally.I7.n)],
    ['♭3/IV7', share(tally.IV7.flat3, tally.IV7.n)],
    ['♭5/IV7', share(tally.IV7.flat5, tally.IV7.n)],
  ] as const;
  check(
    'the tonic scale holds across the changes',
    blue.every(([, pct]) => pct >= 3),
    blue.map(([id, pct]) => `${id} ${pct.toFixed(1)}%`).join('  '),
  );
}

// --- Feel ----------------------------------------------------------------
console.log('\nFeel');
const swingVal = generateSong({ seed: 'sw', genre: 'jazz', style: 'swing' }).meta.swing;
const bossaVal = generateSong({ seed: 'bo', genre: 'jazz', style: 'bossa' }).meta.swing;
check('swing has a triplet feel', swingVal > 0.3, `swing = ${swingVal}`);
check('bossa nova is straight, not swung', bossaVal === 0, `swing = ${bossaVal}`);

/**
 * ## The per-section feel — `style/feel.ts`
 *
 * Every measurement below generates the same song twice: once as the style's
 * table says, and once with the table taken away. That is the only way to ask
 * the question, because there is no `--feel none` and because the claim being
 * tested is about the *call site* rather than about `applyFeel` — handing the
 * function a probe melody would prove nothing about whether the section loop
 * hands it one. Taking the table away removes the draw and nothing else, since
 * the draw has its own namespaced stream, so the second song is what this style
 * generated before feels existed.
 *
 * What that cannot assert, and what therefore is not asserted here: that the
 * *rest* of the catalogue is unmoved. That is a statement about two versions of
 * the repo rather than about one run of it, and pinning it would mean checking a
 * hash of every song in the project into the repo. It was measured instead —
 * every genre × style over six seeds in two passes, hashed with the tables on and
 * with them off, and the off pass is bit-identical to the off pass taken before
 * any of this existed. Exactly the six styles that carry a table move, and the
 * property that makes that hold is the one asserted below: a style with no table
 * draws nothing.
 *
 * The list spans two genres on purpose. `pocket` under an iskelmä foksi and
 * `pocket` under a jazz blues are meant to be the same object with the same
 * numbers in it, and a check that only ever looked at jazz would let that claim
 * rot without noticing.
 */
const feltStyles = [
  ['jazz', 'blues'], ['jazz', 'fusion'], ['jazz', 'bebop'],
  ['jazz', 'ballad'], ['jazz', 'modal'], ['iskelma', 'foksi'],
] as const;

/**
 * Run something with the *composed* half of every feel taken out of the library.
 *
 * A feel reaches the band through two doors that open at different moments: the
 * `voice` block multiplies the `Voice` before the audition runs, and everything
 * else post-processes the rhythm section afterwards. Every measurement below is
 * about the second door, and every one of them works by generating the same song
 * with the feel table on and off — so with both doors open the baseline moves for
 * two reasons at once and the measurement means nothing. A different tune is not
 * merely a different melody: `resolveCollisions` repairs the comp against it and
 * `generateCounter` writes into its holes, so the whole arrangement shifts.
 *
 * Holding the composed half out is what makes those pairs a controlled
 * comparison again. It is not a gap, because the composed half is not
 * unmeasured — it has its own check further down, which is the only one that
 * generates with the library exactly as it ships.
 */
const withoutVoice = <T>(run: () => T): T => {
  const saved = (Object.keys(FEELS) as FeelId[]).map((id) => [id, FEELS[id].voice] as const);
  for (const [id] of saved) delete FEELS[id].voice;
  try {
    return run();
  } finally {
    for (const [id, voice] of saved) if (voice) FEELS[id].voice = voice;
  }
};

const feelPairs: { style: string; seed: string; felt: Song; plain: Song }[] = withoutVoice(() => {
  const pairs: { style: string; seed: string; felt: Song; plain: Song }[] = [];
  for (const [genreId, styleId] of feltStyles) {
    const style = getGenre(genreId).styles[styleId]!;
    const table = style.feels;
    /**
     * The seams are held out of both sides, for the whole of this fixture.
     *
     * Every check built on these pairs asks what a *feel* did, and answers it by
     * pairing each note with the note it became. A seam `shot` replaces a whole
     * bar of every layer with one figure, and it does so out of what the layer
     * was holding — so the two songs get different shots, the pairing sees a
     * bass note added and another lost, and the check reports the feel doing
     * something it did not do. `fusion` is the only style that draws one and it
     * is also the probe style for `pocket` and `funk`, so this is not
     * hypothetical: it read as a 0.94-velocity ghost against a 0.25 cap.
     *
     * Held out rather than measured around, because a transition is a third
     * thing happening at the same moment and these checks are a two-way
     * comparison. What a shot does is asserted in `Transitions` below.
     */
    const seams = style.transitions;
    style.transitions = undefined;
    for (let i = 0; i < 12; i++) {
      const seed = `fl-${i}`;
      style.feels = table;
      const felt = generateSong({ seed, genre: genreId, style: styleId });
      style.feels = undefined;
      const plain = generateSong({ seed, genre: genreId, style: styleId });
      style.feels = table;
      pairs.push({ style: `${genreId}/${styleId}`, seed, felt, plain });
    }
    style.transitions = seams;
  }
  return pairs;
});

/** Beats a given feel covers, from the spans the song carries on its IR. */
const feelBeats = (song: Song, id: string): [number, number][] =>
  (song.meta.feels ?? []).filter((f) => f.feel.id === id)
    .map((f) => [f.from * song.meta.beatsPerBar, f.to * song.meta.beatsPerBar]);
const inside = (beat: number, spans: [number, number][]) =>
  spans.some(([a, b]) => beat >= a - 1e-9 && beat < b);

/**
 * Pair each event of the plain song with the event it became in the felt one.
 *
 * Wave 3 could do this by index, because nothing a feel did changed how many
 * events there were. Wave 4 adds two gestures that do — a ghosted note and a
 * subdivided chord — so an index is no longer an identity and every measurement
 * below that says "how far did this move" needs one that is.
 *
 * Same pitch (or same kit voice), and **globally nearest first** rather than in
 * list order. That is not fastidiousness: taking each plain note in turn and
 * giving it its nearest free partner mispairs wherever two candidates are close
 * together, and a drum fill under `halftime` is exactly that case — the swing
 * goes off, the offbeat sixteenth slides back 0.15 of a beat toward the
 * sixteenth in front of it, and greedy-in-order hands the earlier hit the later
 * one's partner and then reports the later one as lost and a new one as added.
 * It produced 21 phantom losses and three phantom ghosts on modal before the
 * order was fixed, all of them notes sitting exactly where they should be.
 *
 * The tolerance is pinned from both ends and neither end has any slack in it:
 *
 *  - it has to be **above 0.17 beats**, because `halftime` switches the swing
 *    off and a modal offbeat that was delayed by `swing * 0.5 = 0.165` in the
 *    plain song is not delayed at all in the felt one. That is the same note;
 *  - it has to be **below 0.25 beats**, because a ghost sits exactly one
 *    sixteenth in front of the note it repeats and has the same pitch. Any wider
 *    and a ghost is paired with its own target and reported as the target having
 *    moved a whole sixteenth.
 *
 * The two never occur in the same song — `halftime` is modal's and `ghost` is
 * funk's — but the tolerance has to satisfy both, and the fact that it barely can
 * is worth knowing before a third gesture is added.
 */
const PAIR_TOLERANCE = 0.2;
interface Timed { beat: number; velocity: number }
function pairUp<T extends Timed>(
  felt: readonly T[], plain: readonly T[], key: (e: T) => number | string,
): { pairs: [T, T][]; added: T[]; lost: T[] } {
  const buckets = new Map<number | string, T[]>();
  for (const e of felt) {
    const k = key(e);
    const at = buckets.get(k);
    if (at) at.push(e); else buckets.set(k, [e]);
  }
  for (const list of buckets.values()) list.sort((x, y) => x.beat - y.beat);
  // Every pairing that is even possible, then settle them in order of how
  // certain each one is. A window into the sorted bucket keeps this linear in
  // the number of events rather than quadratic.
  const candidates: [number, T, T][] = [];
  for (const p of plain) {
    const list = buckets.get(key(p));
    if (!list) continue;
    let lo = 0; let hi = list.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (list[mid]!.beat < p.beat - PAIR_TOLERANCE) lo = mid + 1; else hi = mid;
    }
    for (let i = lo; i < list.length && list[i]!.beat < p.beat + PAIR_TOLERANCE; i++) {
      candidates.push([Math.abs(list[i]!.beat - p.beat), list[i]!, p]);
    }
  }
  candidates.sort((x, y) => x[0] - y[0]);
  const usedFelt = new Set<T>();
  const usedPlain = new Set<T>();
  const pairs: [T, T][] = [];
  for (const [, f, p] of candidates) {
    if (usedFelt.has(f) || usedPlain.has(p)) continue;
    usedFelt.add(f); usedPlain.add(p);
    pairs.push([f, p]);
  }
  return {
    pairs,
    added: felt.filter((f) => !usedFelt.has(f)),
    lost: plain.filter((p) => !usedPlain.has(p)),
  };
}

/**
 * Mean velocity per bar, which is the level a ghost is measured against.
 *
 * The part's own mean where a bar has nothing in it. `applyFeel` keeps a ghost
 * inside the bar of the note it came from, so that bar always has at least that
 * note — but a push of eighteen milliseconds can carry a ghost written at the
 * very end of a bar over the barline without carrying its parent, and the
 * fallback is what stops that arithmetic from reading as a violation.
 */
const levelByBar = (events: readonly Timed[], beatsPerBar: number) => {
  const sum = new Map<number, [number, number]>();
  let all = 0;
  for (const e of events) {
    const bar = Math.floor(e.beat / beatsPerBar + 1e-9);
    const at = sum.get(bar) ?? [0, 0];
    sum.set(bar, [at[0] + e.velocity, at[1] + 1]);
    all += e.velocity;
  }
  const overall = events.length ? all / events.length : 0;
  return (beat: number) => {
    const at = sum.get(Math.floor(beat / beatsPerBar + 1e-9));
    return at && at[1] ? at[0] / at[1] : overall;
  };
};

{
  /**
   * **The pocket exists**, and it is the one thing nothing in this project could
   * express: `applySwing` shifts offbeats only, uniformly, for the whole song.
   *
   * Measured against the same song without the feel rather than against the
   * grid, because the grid is not where the answer is — a swung offbeat is off
   * the grid by design and a twelve-millisecond lean is not. The final bar is
   * excluded on both sides: it is the ending, and `applyFeel` deliberately does
   * not touch it.
   */
  let bassSum = 0; let bassN = 0; let snareSum = 0; let snareN = 0; let hatMoved = 0;
  let mismatched = 0;
  for (const { felt, plain } of feelPairs) {
    const spans = feelBeats(felt, 'pocket');
    if (!spans.length) continue;
    const ms = 60000 / felt.meta.bpm;
    const last = (felt.meta.totalBars - 1) * felt.meta.beatsPerBar;

    const a = felt.tracks.find((t) => t.layer === 'bass')?.notes ?? [];
    const b = plain.tracks.find((t) => t.layer === 'bass')?.notes ?? [];
    const bass = pairUp(a, b, (n) => n.midi);
    mismatched += bass.lost.length;
    for (const [f, p] of bass.pairs) {
      if (p.beat >= last || !inside(p.beat, spans)) continue;
      bassSum += (f.beat - p.beat) * ms; bassN++;
    }

    for (const voice of ['sd', 'hh'] as DrumVoice[]) {
      const kit = pairUp(
        felt.drums.events.filter((e) => e.voice === voice),
        plain.drums.events.filter((e) => e.voice === voice),
        () => voice,
      );
      mismatched += kit.lost.length;
      for (const [f, p] of kit.pairs) {
        if (p.beat >= last || !inside(p.beat, spans)) continue;
        const moved = (f.beat - p.beat) * ms;
        if (voice === 'sd') { snareSum += moved; snareN++; } else if (Math.abs(moved) > 1e-9) hatMoved++;
      }
    }
  }
  const bassMs = bassSum / Math.max(1, bassN);
  const snareMs = snareSum / Math.max(1, snareN);
  const inBand = (v: number) => Math.abs(v) >= 5 && Math.abs(v) <= 30;
  check(
    'the pocket exists: bass ahead, backbeat behind',
    bassN > 0 && snareN > 0 && bassMs < 0 && snareMs > 0 && inBand(bassMs) && inBand(snareMs)
      && hatMoved === 0 && mismatched === 0,
    `bass ${bassMs.toFixed(1)} ms over ${bassN}, snare +${snareMs.toFixed(1)} ms over ${snareN}, hats moved ${hatMoved}`,
  );
}

{
  /**
   * **The tune was composed, not bent.** The melody and the counter are
   * auditioned — a set of candidates written, scored and one kept — so a feel
   * that moved them afterwards would hand back a gesture nobody scored, and
   * `tune/judge.ts` would never see the result. Note for note, including
   * velocity: the melodic half of a feel goes into the `Voice` before the
   * audition, never into the notes after it.
   *
   * And the rhythm section: **a feel modifies, it never authors.**
   *
   * ## Why this assertion is narrower than the one wave 3 shipped
   *
   * Wave 3 asserted the multiset of pitches per layer, unchanged, which is the
   * same sentence as "the note count never moves". Wave 4 adds a ghosted note
   * and a subdivided chord, and both add notes, so the old form and the new
   * fields collide head-on. Neither was dropped, because the collision is with
   * the *proxy* rather than with the invariant: what a feel must never change is
   * **what is played**, and the note count was standing in for that.
   *
   * So the boundary between "how" and "what" is drawn where it actually is —
   * **at the pitch class**. A ghost repeats the pitch of the note it leads into,
   * a subdivision repeats the pitch it was split from, and neither proposes a
   * note that was not already sounding. Nothing about the harmony, the voicing
   * or the figure has been altered by either; only the surface has. A feel that
   * introduced one new pitch class would be composing, whatever it called
   * itself, and that is the line worth defending.
   *
   * The count, having stopped being the invariant, becomes three narrower ones
   * that say exactly what the two gestures are allowed to do:
   *
   *  - **nothing is ever removed**, and notes appear only on `bass`, on `comp`
   *    and on the `sd` voice — the two layers `Feel.ghost` names plus the one
   *    `Feel.subdivide` names, which are disjoint on purpose so that each added
   *    note's provenance is structural rather than guessed;
   *  - **every ghost is under the cap.** 0.35 of the mean level in its own bar,
   *    against a construction that aims at 0.22. A ghost that can be heard as a
   *    note is not a ghost, and it is the one place a feel could smuggle in
   *    something audible while satisfying every other rule here;
   *  - **every subdivision repeats a pitch that survived**, which is what makes
   *    it half of a note rather than a new one.
   */
  const cap = 0.35;
  /** `trimOverlaps`' own floor, below which it deletes rather than clips. */
  const MIN_AUDIBLE = 0.125;
  let bent = 0; let melodyNotes = 0; let rhythmNotes = 0; let regridded = 0;
  let authored = 0; let lost = 0; let wrongLayer = 0; let tooLoud = 0;
  let ghosts = 0; let splits = 0;
  const loud: string[] = [];
  for (const { style, seed, felt, plain } of feelPairs) {
    /**
     * The swing in force in a given bar, which is the one thing a feel may say
     * to a composed part — see `Feel.swing`. Read off the IR rather than off the
     * style, so this measures what the song claims about itself.
     */
    const spanSwing = (beat: number) => {
      const bar = Math.floor(beat / felt.meta.beatsPerBar + 1e-9);
      const span = (felt.meta.feels ?? []).find(
        (f) => bar >= f.from && bar < f.to && f.feel.swing !== undefined,
      );
      return span
        ? felt.meta.swing + (span.feel.swing! - felt.meta.swing) * span.amount
        : felt.meta.swing;
    };
    const base = plain.meta.swing;
    for (const layer of ['melody', 'counter'] as const) {
      const a = felt.tracks.find((t) => t.layer === layer)?.notes ?? [];
      const b = plain.tracks.find((t) => t.layer === layer)?.notes ?? [];
      melodyNotes += b.length;
      /**
       * A re-gridded line may not have the same number of notes, and that is
       * `trimOverlaps` rather than a bend.
       *
       * This check used to read a count difference as proof of a bend, which is
       * the right instinct and was passing on luck. `Feel.swing` moves an onset
       * and shortens the note it delays; `trimOverlaps` then runs against a line
       * whose gaps have changed and *drops* anything left under `MIN_AUDIBLE`.
       * So the same tune, gridded two ways, can legitimately come out two notes
       * apart. Found on `jazz/modal` `fl-0`, where `halftime` switches swing off
       * over bars 12–28 and 60–76: at beat 53.5 the unswung line keeps a note of
       * 0.15 beats that the swung line pushes to 53.665, clips, and deletes. Two
       * notes across the catalogue, both of them that.
       *
       * The licence is therefore narrowed rather than dropped, because "the tune
       * has the same number of notes" was never the claim — the claim is that
       * every note the tune won its audition with is still there, at the grid the
       * span asks for. A surplus note is forgiven only where it is a note the
       * *other* grid is entitled to have deleted, and that is arithmetic rather
       * than a tolerance: `applySwing` delays the second eighth of a beat and
       * takes `swing / 2` off its length, flooring at 0.05, and `trimOverlaps`
       * drops whatever is left under `MIN_AUDIBLE`. So the test is whether the
       * note, swung, would have fallen through that floor — 0.15 beats against
       * modal's 0.33 swing gives 0.05, and 0.05 is gone. It is licensed in that
       * direction only: un-swinging *lengthens*, so a note that survives the
       * swung grid has no excuse for vanishing from the straight one.
       */
      const overridden = (felt.meta.feels ?? []).some(
        (f) => f.feel.swing !== undefined && f.feel.swing !== base);
      if (a.length !== b.length) {
        if (!overridden || a.length < b.length) {
          bent += Math.abs(a.length - b.length);
          continue;
        }
        let unpaired = 0;
        for (const n of a) {
          if (b.some((m) => m.midi === n.midi && Math.abs(m.beat - n.beat) < 0.25)) continue;
          unpaired++;
          const frac = n.beat - Math.floor(n.beat);
          const onOffbeat = Math.abs(frac - 0.5) < 1e-6;
          const swungDuration = Math.max(0.05, n.duration - base * 0.5);
          if (onOffbeat && swungDuration < MIN_AUDIBLE) regridded++; else bent++;
        }
        // The count gap has to be explained by those notes and nothing else.
        if (unpaired !== a.length - b.length) bent += a.length - b.length;
        continue;
      }
      for (let k = 0; k < a.length; k++) {
        const x = a[k]!; const y = b[k]!;
        if (x.midi !== y.midi || Math.abs(x.velocity - y.velocity) > 1e-9) { bent++; continue; }
        /**
         * The one licensed difference, and the reason this check is not simply
         * "identical". `Feel.swing` is applied at assembly, to every layer, the
         * melody included — it is a property of the *grid* and not a gesture, so
         * a tune re-gridded is still the tune that won its audition. What is
         * asserted is that the note is on the grid the span asks for and nowhere
         * else: an onset the plain song swung by `base / 2` is expected to be
         * swung by the span's own figure instead, exactly, and every other note
         * is expected not to have moved at all.
         *
         * The duration is only compared where nothing moved. Swing shortens the
         * note it delays and `trimOverlaps` then runs against a line whose gaps
         * have changed, so a re-gridded tune's durations are a consequence of
         * both and not a fact this check can predict.
         */
        const frac = y.beat - Math.floor(y.beat);
        const swung = base > 0 && Math.abs(frac - (0.5 + base * 0.5)) < 1e-6;
        const shift = swung ? (spanSwing(y.beat) - base) * 0.5 : 0;
        if (Math.abs(x.beat - (y.beat + shift)) > 1e-9) { bent++; continue; }
        if (shift !== 0) { regridded++; continue; }
        if (Math.abs(x.duration - y.duration) > 1e-9) bent++;
      }
    }
    const bpb = felt.meta.beatsPerBar;
    for (const layer of ['bass', 'comp', 'pad', 'brass'] as const) {
      const a = felt.tracks.find((t) => t.layer === layer)?.notes ?? [];
      const b = plain.tracks.find((t) => t.layer === layer)?.notes ?? [];
      rhythmNotes += b.length;
      const classes = (ns: readonly { midi: number }[]) =>
        [...new Set(ns.map((n) => n.midi % 12))].sort((x, y) => x - y).join(',');
      if (classes(a) !== classes(b)) authored++;
      if (a.length < b.length) lost += b.length - a.length;
      const grown = a.length - b.length;
      if (grown > 0 && layer !== 'bass' && layer !== 'comp') { wrongLayer += grown; continue; }
      if (grown <= 0) continue;

      /**
       * The bass pairs cleanly — nothing on it moves by a sixteenth and nothing
       * on it is split — so whatever is left over is a ghost by construction.
       * The comp does not pair cleanly, because a displaced chord moves by
       * exactly the sixteenth a subdivision sits at, so it is asserted
       * structurally instead of by pairing.
       */
      if (layer === 'bass') {
        const level = levelByBar(pairUp(a, b, (n) => n.midi).pairs.map(([f]) => f), bpb);
        for (const g of pairUp(a, b, (n) => n.midi).added) {
          ghosts++;
          const ref = level(g.beat);
          if (!(ref > 0 && g.velocity <= ref * cap)) {
            tooLoud++;
            if (loud.length < 3) loud.push(`${style}/${seed} bass ${g.velocity.toFixed(3)} vs ${(ref * cap).toFixed(3)}`);
          }
        }
      } else {
        // Each surplus comp note has to be a pitch that is still there.
        const survive = new Set(b.map((n) => n.midi));
        splits += grown;
        for (const n of a) if (!survive.has(n.midi)) wrongLayer++;
      }
    }
    rhythmNotes += plain.drums.events.length;
    const voices = (song: Song) =>
      [...new Set(song.drums.events.map((e) => e.voice))].sort().join(',');
    if (voices(felt) !== voices(plain)) authored++;
    // The kit is unambiguous: `subdivide` never touches it, so every event a
    // feel leaves behind here is a ghosted snare.
    const kit = pairUp(felt.drums.events, plain.drums.events, (e) => e.voice);
    lost += kit.lost.length;
    const snareLevel = levelByBar(
      kit.pairs.map(([f]) => f).filter((e) => e.voice === 'sd'), bpb,
    );
    for (const g of kit.added) {
      if (g.voice !== 'sd') { wrongLayer++; continue; }
      ghosts++;
      const ref = snareLevel(g.beat);
      if (!(ref > 0 && g.velocity <= ref * cap)) {
        tooLoud++;
        if (loud.length < 3) loud.push(`${style}/${seed} sd ${g.velocity.toFixed(3)} vs ${(ref * cap).toFixed(3)}`);
      }
    }
  }
  check(
    'a feel never bends the tune',
    bent === 0 && regridded > 0,
    `${bent} of ${melodyNotes} melody and counter notes moved; ${regridded} re-gridded by a swing override, which is the only thing allowed to`,
  );
  check(
    'a feel modifies, it never authors: no new pitch class',
    authored === 0 && lost === 0,
    `${authored} layers changed their pitch classes, ${lost} notes lost, over ${rhythmNotes} rhythm-section notes`,
  );
  check(
    'a ghost stays a ghost: snare and bass only, under the cap',
    tooLoud === 0 && wrongLayer === 0 && ghosts > 0,
    tooLoud || wrongLayer
      ? `${loud.join('; ')}${wrongLayer ? ` — ${wrongLayer} on a layer that may not have them` : ''}`
      : `${ghosts} ghosts all under ${cap} of their bar, ${splits} comp notes added, none anywhere else`,
  );
}

{
  /**
   * **Funk is short**, which is the claim that separates it from `pocket`.
   *
   * ## Measured on the blues, and the reason is a finding rather than a detail
   *
   * `funk` ships enabled on `fusion` and on nothing else, and **fusion cannot
   * answer this question, because fusion has no comp layer.** It is a two-handed
   * keyboard style: the comping is the lead's left hand, `generateLeftHand`
   * writes it into the `melody` track, and a feel may not touch that track by
   * design — it was auditioned. Measured over six seeds, `jazz/fusion`,
   * `jazz/trio` and `jazz/odd` produce zero notes on `comp` between them.
   *
   * So on the style it is enabled on, the half of `funk` that makes it funk —
   * `articulation: { comp: 0.45 }`, `subdivide`, `displace` — is inert, and what
   * fusion actually receives is pocket plus an accent plus ghosts. That is a
   * real gesture and it is not this one. The check therefore installs the feel
   * on a style that has a comp to shorten, because the alternative is a check
   * that passes by measuring nothing.
   *
   * Both halves of the sentence are asserted: the comp gets shorter, and the
   * notes `subdivide` adds are halves of notes that were already there rather
   * than notes of their own — every added pitch is one that survived, which is
   * what makes a subdivision an articulation.
   */
  const style = getGenre('jazz').styles.blues!;
  const table = style.feels;
  // Articulation is a rhythm-section measurement, so the composed half is held
  // out here for the same reason it is held out of `feelPairs` above: funk's
  // `voice` block would move the melody, and a moved melody moves the comp with
  // it through `resolveCollisions`.
  const run = (id: 'funk' | 'straight') => withoutVoice(() => {
    style.feels = [[id, 1]];
    const songs = [...Array(10).keys()].map(
      (i) => generateSong({ seed: `fk-${i}`, genre: 'jazz', style: 'blues' }),
    );
    style.feels = table;
    return songs;
  });
  const funk = run('funk');
  const straight = run('straight');
  const comps = (songs: Song[]) =>
    songs.flatMap((s) => s.tracks.find((t) => t.layer === 'comp')?.notes ?? []);
  const meanDur = (songs: Song[]) => {
    const notes = comps(songs);
    return notes.reduce((sum, n) => sum + n.duration, 0) / Math.max(1, notes.length);
  };
  const shortened = meanDur(funk) / meanDur(straight);

  let added = 0; let orphan = 0;
  for (let i = 0; i < funk.length; i++) {
    const a = funk[i]!.tracks.find((t) => t.layer === 'comp')?.notes ?? [];
    const b = straight[i]!.tracks.find((t) => t.layer === 'comp')?.notes ?? [];
    added += Math.max(0, a.length - b.length);
    const survive = new Set(b.map((n) => n.midi));
    for (const n of a) if (!survive.has(n.midi)) orphan++;
  }
  /**
   * And the anticipations, counted rather than asserted, because the number is
   * the point. `displace` only takes a hit that lands squarely on a beat that is
   * not the downbeat, and a swung comp barely has any: this comping sits on the
   * one and on the swung offbeat, and a swung offbeat is not on the sixteenth
   * grid so a sixteenth in front of it means nothing. Roughly 20 anticipations
   * in seven thousand notes. The field wants a straight-sixteenth style with a
   * comp layer and the catalogue has not got one — fusion is straight and has no
   * comp, the blues has a comp and is swung — so it is shipped exercised and
   * essentially unheard. Printed so that stays visible.
   */
  const anticipations = (songs: Song[]) => comps(songs)
    .filter((n) => Math.abs((n.beat % 1) - 0.75) < 1e-6).length;
  check(
    'funk is short: the chords become stabs',
    shortened < 0.6 && added > 0 && orphan === 0,
    `mean comp duration ${(shortened * 100).toFixed(0)}% of straight (${meanDur(straight).toFixed(2)} → ${meanDur(funk).toFixed(2)} beats), ${added} notes added by subdivision, ${orphan} carrying a pitch that was not there, ${anticipations(funk) - anticipations(straight)} anticipations`,
  );
}

{
  /**
   * **A box does not groove.** Decision 6 of the plan, and the third statement
   * of it in the codebase: a Mini Pops has one pattern per button and a volume
   * knob, and a preset that dragged its backbeat would be somebody playing it.
   *
   * Every feel, not just the ones the style ships with, because the gate is
   * `canVary(drumSource)` and it has to hold for whatever a table later names.
   * Foksi is the probe because it is the only style in the catalogue with both a
   * feel table and an era that can draw a box — the jazz eras never do, over 60
   * seeds each.
   *
   * The assertion is on the kit alone. The band around the box still leans; a
   * bass player does not stop playing in the pocket because the drummer is a
   * machine, and it is the machine that cannot lean.
   */
  const style = getGenre('iskelma').styles.foksi!;
  const table = style.feels;
  let boxed = 0; let moved = 0; let felt = 0;
  for (const id of Object.keys(FEELS) as FeelId[]) {
    style.feels = [[id, 1]];
    for (let i = 0; i < 60; i++) {
      const song = generateSong({ seed: `bx-${i}`, genre: 'iskelma', style: 'foksi' });
      if (song.drums.source !== 'box') continue;
      style.feels = undefined;
      const plain = generateSong({ seed: `bx-${i}`, genre: 'iskelma', style: 'foksi' });
      style.feels = [[id, 1]];
      boxed++;
      if (id !== 'straight') felt++;
      const a = song.drums.events; const b = plain.drums.events;
      if (a.length !== b.length) { moved += Math.abs(a.length - b.length); continue; }
      for (let k = 0; k < a.length; k++) {
        if (Math.abs(a[k]!.beat - b[k]!.beat) > 1e-9 || a[k]!.voice !== b[k]!.voice
          || Math.abs(a[k]!.velocity - b[k]!.velocity) > 1e-9) moved++;
      }
    }
  }
  style.feels = table;
  check(
    'a box does not groove',
    moved === 0 && felt > 0,
    `${moved} kit events altered over ${boxed} preset-box songs across ${Object.keys(FEELS).length} feels`,
  );
}

{
  /**
   * **Intensity still outranks feel.** `applyFeel` runs *before* `applyDynamics`
   * precisely so that the section's own level is the outermost term: a feel may
   * change the shape of a section's loudness and never its rank. This is the
   * check that catches that order being got wrong, and it is written now, while
   * nothing in a feel touches velocity at all, because the wave that adds
   * `accent` is the wave that will break it.
   *
   * Per layer rather than over the whole band, which is what the plan asked for
   * and is wrong: the mean over every layer at once moves with which layers are
   * *playing*, so a chorus carrying more pad — the quietest thing in the mix —
   * reads as quieter than its verse for reasons that have nothing to do with
   * dynamics. Measured: 3 of 36 songs fail that way today, before feels do
   * anything. Per layer it is clean, and it is also the sharper statement, since
   * `applyDynamics` scales one layer at a time.
   *
   * ## And over the notes the feel did not add, which is not a loophole
   *
   * The mean velocity of a layer's notes stopped being a measure of how loud a
   * section is the moment a feel could add a ghost to it. Measured on
   * `jazz/fusion` seed `fl-6`: a funk chorus came out at 0.449 against a pocket
   * verse at 0.487 and read as an inversion, and the whole of the difference was
   * 23 ghost notes at a fifth of the level dragging the average down. Its loud
   * notes were louder than the verse's and there were more of them — 0.519
   * against 0.487 once the ghosts are set aside — so the section was not quieter
   * by any definition a listener would recognise. Averaging in a note that
   * exists to be inaudible measures how many ghosts there are, not how hard the
   * band is playing.
   *
   * So the comparison is over the notes present in *both* songs: the same
   * material, played two ways, which is the only thing the word "rank" can
   * sensibly range over. It is also the stricter reading — nothing a feel adds
   * can flatter the number in either direction.
   */
  let compared = 0; let inverted = 0; let multi = 0;
  const detail: string[] = [];
  for (const { style, seed, felt, plain } of feelPairs) {
    const ids = new Set((felt.meta.feels ?? []).map((f) => f.feel.id));
    if (ids.size < 2) continue;
    multi++;
    const bpb = felt.meta.beatsPerBar;
    const bars = (kind: string) => felt.sections.filter((s) => s.kind === kind)
      .map((s) => [s.startBar * bpb, (s.startBar + s.lengthBars) * bpb] as [number, number]);
    for (const layer of ['bass', 'comp', 'pad'] as const) {
      const notes = pairUp(
        felt.tracks.find((t) => t.layer === layer)?.notes ?? [],
        plain.tracks.find((t) => t.layer === layer)?.notes ?? [],
        (n) => n.midi,
      ).pairs.map(([f]) => f);
      const mean = (kind: string) => {
        const spans = bars(kind);
        const hit = notes.filter((n) => inside(n.beat, spans));
        return hit.length ? hit.reduce((sum, n) => sum + n.velocity, 0) / hit.length : NaN;
      };
      const chorus = mean('chorus'); const verse = mean('verse');
      if (Number.isNaN(chorus) || Number.isNaN(verse)) continue;
      compared++;
      if (chorus <= verse) {
        inverted++;
        if (detail.length < 3) detail.push(`${style}/${seed} ${layer} ${chorus.toFixed(3)} <= ${verse.toFixed(3)}`);
      }
    }
  }
  check(
    'intensity outranks feel: the chorus is still the loudest',
    inverted === 0 && compared > 0,
    inverted ? detail.join('; ') : `${compared} layer comparisons over ${multi} songs with more than one feel`,
  );
}

{
  /**
   * **The composed half: a feel that reaches the melody reaches it by writing a
   * different one.** `Feel.voice` multiplies the `Voice` before `auditionTune`
   * scores a single candidate, so the tune that wins is the tune the feel asked
   * for. The last check that generates with the library exactly as it ships, and
   * the only one that may see a melody move at all.
   *
   * Three assertions, and the third is the one that keeps the divide honest.
   *
   * **What the block claims, it moves.** Read off the table rather than written
   * out here, so a number edited without being re-measured fails rather than
   * passing quietly: a `density` multiplier has to move onsets per bar its own
   * way, and an `accents` lift has to put more of the tune on the sixteenths it
   * lifts.
   *
   * The bar for `density` is one percent, which looks slack and is not, because
   * **the knob is not linear and is not close to it.** Half time asks for 20%
   * fewer onsets and gets 12%; funk asks for 15% more and gets 2%. The engine
   * rounds a figure's onset count to a whole number, and the archetype and the
   * section shape both scale it again after the feel has spoken, so a multiplier
   * near 1 is mostly rounded away and a multiplier further from it is not. One
   * percent is set against the *smallest real move* rather than against the
   * largest: funk came out between 1.9% and 6.0% over sixteen seed sets and
   * never once the wrong way, so this fails the entry that has stopped saying
   * anything without failing the entry that says the least.
   *
   * ## Why the second statistic is the odd sixteenth and not "off the beat"
   *
   * Measured rather than assumed, and the obvious phrasing loses. Funk's lift is
   * on the *odd* slots — the sixteenths between the eighths — and the share of
   * onsets landing there rose in all twelve seed sets tried, by between 1.3 and
   * 3.4 points. The share landing anywhere off the beat is the same effect
   * diluted by the eighth-note upbeats, which fusion's melody was already full
   * of, and over twelve songs it came out anywhere between +0.7 and +4.7 points.
   * Both say the same thing about the music; only one of them says it every
   * time. Twenty-four songs a side for the same reason: the audition is a
   * lottery over two dozen candidates, so one seed's tune is not evidence about
   * anything and the sample has to be big enough to see past that.
   *
   * `syncopation` is deliberately not gated on its own. It is worth about half a
   * point of off-beat share on these styles — below what this sample can
   * separate — because a voice with an `accents` table does not consult it about
   * where notes land at all. What it does reach is documented on the field.
   *
   * **`pocket` composes nothing.** Under `pocket` the blues's melody is the
   * melody it writes under `straight`, note for note — the band leans and the
   * soloist floats, which is decision, not accident, and it is what keeps
   * `jazz/blues` and `iskelma/foksi` bit-identical to what they were before this
   * wave.
   *
   * **Nothing was bent on the way out.** Every melody onset still lands on the
   * sixteenth grid or on the span's own swung offbeat. A tune that had been
   * pushed by a feel after the audition would sit at some millisecond fraction
   * instead, and that is the failure this whole design exists to make
   * impossible — silent, and it sounds merely sloppy.
   */
  const voiced = [
    ['jazz', 'fusion', 'funk'], ['jazz', 'modal', 'halftime'],
    ['jazz', 'ballad', 'laidback'],
  ] as const;
  /** The melody alone: a `twoHanded` fusion keyboard interleaves its own comping. */
  const lead = (song: Song) => {
    const track = song.tracks.find((t) => t.layer === 'melody');
    return track ? melodicLine(track).slice().sort((a, b) => a.beat - b.beat) : [];
  };
  const shape = (songs: Song[]) => {
    let onsets = 0; let odd = 0; let bars = 0;
    for (const song of songs) {
      bars += song.meta.totalBars;
      for (const n of lead(song)) {
        onsets++;
        // The sixteenths between the eighths, which is the slot an `accents`
        // lift is written to reach.
        const frac = (n.beat - Math.floor(n.beat)) * 4;
        if (Math.abs(frac - Math.round(frac)) < 1e-6 && Math.round(frac) % 2 === 1) odd++;
      }
    }
    return { odd: (odd / Math.max(1, onsets)) * 100, perBar: onsets / Math.max(1, bars) };
  };
  const SONGS = 24;
  const cache = new Map<string, Song[]>();
  const under = (genreId: 'jazz' | 'iskelma', styleId: string, id: FeelId) => {
    const key = `${genreId}/${styleId}/${id}`;
    const had = cache.get(key);
    if (had) return had;
    const style = getGenre(genreId).styles[styleId]!;
    const table = style.feels;
    style.feels = [[id, 1]];
    const songs = [...Array(SONGS).keys()].map(
      (i) => generateSong({ seed: `vc-${i}`, genre: genreId, style: styleId }),
    );
    style.feels = table;
    cache.set(key, songs);
    return songs;
  };

  const said: string[] = [];
  const missed: string[] = [];
  // Every claim the table makes, counted from the table, so that adding a knob
  // to a feel and forgetting to measure it cannot leave this check reporting
  // that everything it looked at passed.
  let claims = 0;
  for (const [genreId, styleId, id] of voiced) {
    const block = FEELS[id].voice!;
    const felt = shape(under(genreId, styleId, id));
    const plain = shape(under(genreId, styleId, 'straight'));
    if (block.density !== undefined) {
      claims++;
      const ratio = felt.perBar / plain.perBar;
      const moved = block.density > 1 ? ratio > 1.01 : ratio < 0.99;
      (moved ? said : missed).push(
        `${id} ${plain.perBar.toFixed(2)}→${felt.perBar.toFixed(2)}/bar`,
      );
    }
    if (block.accents) {
      claims++;
      (felt.odd - plain.odd > 0.8 ? said : missed).push(
        `${id} ${plain.odd.toFixed(1)}→${felt.odd.toFixed(1)}% on the odd sixteenths`,
      );
    }
  }
  check(
    'a feel composes the melody it asked for',
    missed.length === 0 && claims > 0 && said.length === claims,
    missed.length ? `no measurable move: ${missed.join('; ')}` : said.join(', '),
  );

  const pocket = under('jazz', 'blues', 'pocket').map(lead);
  const flat = under('jazz', 'blues', 'straight').map(lead);
  let differed = 0; let compared = 0;
  for (let i = 0; i < pocket.length; i++) {
    const a = pocket[i]!; const b = flat[i]!;
    compared += b.length;
    if (a.length !== b.length) { differed += Math.abs(a.length - b.length); continue; }
    for (let k = 0; k < a.length; k++) {
      if (a[k]!.midi !== b[k]!.midi || Math.abs(a[k]!.beat - b[k]!.beat) > 1e-9) differed++;
    }
  }
  check(
    'the band leans, the soloist floats: pocket composes nothing',
    differed === 0 && compared > 0,
    `${differed} of ${compared} blues melody notes differ between pocket and straight`,
  );

  let offGrid = 0; let onGrid = 0;
  for (const [genreId, styleId, id] of voiced) {
    for (const song of under(genreId, styleId, id)) {
      const spanSwing = (beat: number) => {
        const bar = Math.floor(beat / song.meta.beatsPerBar + 1e-9);
        const span = (song.meta.feels ?? []).find(
          (f) => bar >= f.from && bar < f.to && f.feel.swing !== undefined,
        );
        return span
          ? song.meta.swing + (span.feel.swing! - song.meta.swing) * span.amount
          : song.meta.swing;
      };
      for (const n of lead(song)) {
        onGrid++;
        const frac = n.beat - Math.floor(n.beat);
        const sixteenth = Math.abs(frac * 4 - Math.round(frac * 4)) < 1e-6;
        const swung = Math.abs(frac - (0.5 + spanSwing(n.beat) * 0.5)) < 1e-6;
        if (!sixteenth && !swung) offGrid++;
      }
    }
  }
  check(
    'a composed feel still leaves the tune on the grid',
    offGrid === 0 && onGrid > 0,
    `${offGrid} of ${onGrid} melody onsets off the sixteenth grid and off the span's swing`,
  );
}

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
  /**
   * A hundred and twenty seeds, and every one of them is load-bearing.
   *
   * Strictness does not merely tighten a line, it changes *which* of two dozen
   * auditioned tunes wins — so the three columns are three different tunes per seed
   * rather than three renderings of one, and the sampling error is a point or two.
   * At twenty-five seeds synth read 21 → 19 → 22, and sixty was thought to be
   * enough because it read 22 → 19 → 19.
   *
   * It was not. Those last two columns were the same number to two significant
   * figures and the sign between them was a coin: giving `cinematic` a left hand
   * changed six songs in that sample of sixty and synth came back 22.11 → 18.50 →
   * 18.91, failing by four tenths of a point on an axis that moves three and a
   * half between its first two columns. The same seeds at 120 read 23.06 → 19.29 →
   * 18.77 and at 240 read 23.77 → 20.33 → 19.27, so the ordering is real and sixty
   * was measuring it through noise of its own size.
   *
   * The threshold is untouched — what a well-behaved axis looks like is not a
   * matter of how hard it is to see. Only the sample grew, which is the same
   * correction this check already made once.
   */
  const wideAt = (level: string, genreId: string) => {
    let wide = 0, moves = 0;
    for (let i = 0; i < 120; i++) {
      const s = generateSong({ seed: `sm-${i}`, genre: genreId, strictness: level as never });
      const mel = s.tracks.find((t) => t.layer === 'melody');
      if (!mel) continue;
      /**
       * `melodicLine`, not `mel.notes`, and this check was the sixth tool to get it
       * wrong — see the note on `Track.twoHanded`. Where the lead is a two-handed
       * keyboard the track interleaves the pianist's left-hand voicings with the
       * tune, so walking the raw notes reads a chord tone as a leap: jazz measured
       * 67% of its intervals wider than a major third and synth 73%, against 22%
       * for the actual line. The ordering the check is about was being asserted
       * over noise.
       */
      const n = melodicLine(mel).slice().sort((a, b) => a.beat - b.beat);
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
    /**
     * The line, not the track.
     *
     * On a two-handed lead the track also carries that player's own accompaniment,
     * and the left hand is drawn per section on purpose — a trio changing what it
     * does at the top of a chorus is the clearest signal there is that an
     * arrangement was arranged. Compared raw, two choruses of the *same tune* with
     * different comping under them read as two different tunes, and the recall rate
     * for every two-handed style collapses. What comes back is the melody.
     */
    const notes = melodicLine(track).filter((n) => n.beat >= from && n.beat < to)
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

  /** Fraction of the shorter signature's tokens the two share, in order-free terms. */
  const overlap = (a: string, b: string) => {
    const xs = a.split(' ');
    const ys = new Set(b.split(' '));
    const shared = xs.filter((t) => ys.has(t)).length;
    return shared / Math.max(1, Math.min(xs.length, ys.size));
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
        // Similar, not identical. A recalled chorus now comes back *varied* — an
        // added ornament, the top note taken up, the arrival held — and demanding
        // byte identity would count every one of those as a failure to recall.
        // Five in six of the onset-and-interval tokens shared is well beyond what two
        // freshly written choruses reach, which is what the `through` row measures —
        // and it stays at zero, so the threshold is doing its job at both ends.
        if (sig === prior || overlap(sig, prior) >= 0.85) recalled++;
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

// ---------------------------------------------------------------------------
// The drummer's hand
// ---------------------------------------------------------------------------
//
// `KitVariation` moves the timekeeping voice and thins it, and the entire
// safety of the idea rests on one claim: **nothing else in the pattern moves.**
// A hand that varies is a drummer; a backbeat that varies is a second band, and
// the difference between the two is the assertion below rather than the care of
// whoever writes the next feature.
//
// Written against `generateDrums` twice over the same pattern — once plain,
// once varied — rather than over generated songs, because a song has fills,
// drum solos, feels that ghost the snare and feels that push the whole kit off
// the grid, and every one of those legitimately moves an event the invariant
// does not range over. Two calls with the fill off isolate exactly the thing
// under test.
console.log("\nThe drummer's hand");
{
  const chords = [parseRoman('i', 'minor'), parseRoman('iv', 'minor'),
    parseRoman('V7', 'minor'), parseRoman('i', 'minor')];
  const LEVELS = [0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 1.0, 1.06];

  let planned = 0; let thinned = 0; let rode = 0; let opened = 0;
  let compared = 0; let moved = 0;
  const detail: string[] = [];

  for (const gid of GENRE_IDS) {
    for (const style of Object.values(getGenre(gid).styles)) {
      for (const pattern of style.drums) {
        for (const level of LEVELS) {
          for (let k = 0; k < 4; k++) {
            const hand = planKitVariation(pattern, {
              intensity: level, rng: new Rng(`${style.id}:${pattern.name}:${level}:${k}`),
            });
            if (!hand) continue;
            planned++;
            if (hand.thin) thinned++;
            if (hand.to === 'rd') rode++;
            if (hand.open?.length) opened++;

            const ctx = () => ({
              chords, beatsPerBar: style.beatsPerBar, startBeat: 0, style,
              rng: new Rng(`${style.id}:kit`),
            });
            const opts = { fillAtEnd: false, intensity: level };
            const plain = generateDrums(ctx(), pattern, opts);
            const varied = generateDrums(ctx(), pattern, { ...opts, variation: hand });

            /**
             * Everything the hand is not. `oh` is excluded because opening the
             * hat is the gesture: those hits are hand hits wearing another
             * voice, and they came out of the count `on` lost.
             */
            const untouched = (events: typeof plain) => events
              .filter((e) => e.voice !== hand.on && e.voice !== hand.to && e.voice !== 'oh')
              .map((e) => `${e.voice}@${e.beat.toFixed(3)}`).join(' ');
            compared++;
            if (untouched(plain) !== untouched(varied)) {
              moved++;
              if (detail.length < 3) detail.push(`${style.id}/${pattern.name}@${level}`);
            }
          }
        }
      }
    }
  }

  check(
    'varying the hand moves nothing else',
    moved === 0 && compared > 0,
    `${moved} of ${compared} varied patterns disturbed another voice${detail.length ? ` — ${detail.join(', ')}` : ''}`,
  );
  check(
    'the hand thins, rides and opens',
    thinned > 0 && rode > 0 && opened > 0,
    `${planned} plans: ${thinned} thinned, ${rode} to the ride, ${opened} opened`,
  );

  /**
   * And a box has no hand at all.
   *
   * The guard for this lives at the call site in `song.ts`, next to the ones
   * that take away the fill and the drum solo — so this is the check that the
   * fourth thing a machine cannot do stays taken away when somebody moves that
   * line. A preset box plays one pattern per button: the *set* of voices it
   * sounds is the same in every section, and a hand that varied would put a
   * ride or an open hat into one of them and nothing into the others.
   */
  let boxes = 0; let varying = 0;
  for (const gid of GENRE_IDS) {
    for (let i = 0; i < 40; i++) {
      const song = generateSong({ seed: `box-${gid}-${i}`, genre: gid });
      // `canVary` and not "is it a machine": a programmed box and a set of
      // electronic pads are both machines and both have somebody deciding what
      // they do bar to bar. Exactly one source has a start button.
      if (canVary(song.drums.source ?? 'kit') || !song.drums.events.length) continue;
      boxes++;
      const bpb = song.meta.beatsPerBar;
      const sets = song.sections.map((sec) => {
        const from = sec.startBar * bpb;
        const to = from + sec.lengthBars * bpb;
        return [...new Set(song.drums.events
          .filter((e) => e.beat >= from && e.beat < to).map((e) => e.voice))].sort().join(',');
      }).filter((s) => s.length);
      if (new Set(sets).size > 1) varying++;
    }
  }
  check(
    'a box keeps one hand on one button',
    varying === 0 && boxes > 0,
    `${varying} of ${boxes} preset-box songs changed kit voices between sections`,
  );
}

// --- Transitions -----------------------------------------------------------
// A fill is one of four things that can happen at a section join, and the only
// one the catalogue can currently draw — see `generate/transition.ts`. Two
// claims are asserted here, and the second is the one the whole mechanism rests
// on.
console.log('\nTransitions');
{
  /**
   * The music of a song, with the seam plan held out.
   *
   * Compared as JSON rather than by any measurement, because the claim being
   * tested is not "similar" — it is that a style which writes out
   * `[['fill', 1]]` gets back the identical arrangement to one that says nothing
   * at all, note for note and event for event, while consuming one number per
   * seam from a stream nothing else reads.
   *
   * `meta.transitions` is excluded on purpose: it is the one thing that *is*
   * supposed to differ, since a song that declared a palette publishes its
   * answer and a song that was never asked does not.
   */
  const music = (song: Song) => JSON.stringify({
    meta: { ...song.meta, transitions: undefined },
    sections: song.sections,
    tracks: song.tracks,
    drums: song.drums,
  });

  const SEEDS = 12;
  let identical = 0, differing = 0, drawn = 0;
  let recorded = 0, misplaced = 0, notFill = 0, leaked = 0;
  const offenders: string[] = [];
  // One style per genre, including ambient — which announces nothing today and
  // is the genre this field will eventually be used to silence outright.
  for (const [gid, sid] of [
    ['iskelma', 'tango'], ['jazz', 'fusion'], ['synth', 'berlin'], ['ambient', 'drone'],
  ] as const) {
    const style = getGenre(gid).styles[sid]!;
    const table = style.transitions;
    const run = () => [...Array(SEEDS).keys()].map(
      (i) => generateSong({ seed: `tr-${i}`, genre: gid, style: sid }),
    );
    // Both sides are set rather than one, because `fusion` now declares a real
    // palette and the claim under test is about the two statements a style can
    // make *here*: nothing at all, against `[['fill', 1]]`. Read off whatever
    // the style happens to say today it would be testing that instead.
    style.transitions = undefined;
    const silent = run();
    style.transitions = [['fill', 1]];
    const declared = run();
    style.transitions = table;

    for (let i = 0; i < SEEDS; i++) {
      const a = silent[i]!, b = declared[i]!;
      if (music(a) === music(b)) identical++;
      else { differing++; if (offenders.length < 3) offenders.push(`${gid}/${sid} tr-${i}`); }

      // A song that was never asked carries no answer.
      if (a.meta.transitions !== undefined) leaked++;

      const seams = b.meta.transitions;
      if (!seams || seams.length !== b.sections.length - 1) { recorded++; continue; }
      drawn += seams.length;
      seams.forEach((seam, s) => {
        if (seam.section !== s || seam.bar !== b.sections[s + 1]!.startBar) misplaced++;
        if (seam.kind !== 'fill') notFill++;
      });
    }
  }

  check(
    'a declared fill palette is the identity',
    differing === 0 && identical > 0,
    differing
      ? `${differing} of ${identical + differing} songs moved — ${offenders.join(', ')}`
      : `${identical} songs bit-identical with and without [['fill', 1]], over ${drawn} drawn seams`,
  );
  check(
    'the seam plan is on the IR, and only where asked',
    recorded === 0 && misplaced === 0 && notFill === 0 && leaked === 0 && drawn > 0,
    recorded || misplaced || notFill || leaked
      ? `${recorded} songs recorded no plan, ${misplaced} seams misindexed, ${notFill} not a fill, ${leaked} unasked songs carrying one`
      : `${drawn} seams, each naming the section it leaves and the bar it lands on`,
  );

  /**
   * The claim the whole of `shot` rests on, asserted at its source.
   *
   * `hook leaves form, key, tempo, instruments and drums alone` above already
   * compares drum events byte for byte, and it is the gate. It is also a *sample*
   * — twenty unpinned seeds, of which roughly one is a fusion song — so it can
   * only catch a leak by luck. This pins the style that has shots and reads the
   * figures straight off the IR at every hook level: if a shot's rhythm ever
   * came from the tune, the figure lists differ here, on the cause, rather than
   * three layers downstream in a JSON compare of a finished kit part.
   *
   * The kit is compared too, over the bars a shot rewrites and the downbeat it
   * lands on, because the figure being stable is necessary and not sufficient:
   * the level a shot is played at is read off the kit's own velocities and the
   * bar comes from the section boundaries, so all three have to hold and only
   * one of them is obviously so.
   *
   * **Those bars and not the whole part**, which is a narrowing with a reason
   * rather than a convenience. Comparing the entire kit fails here, and it fails
   * identically with every shot removed: `funk` — which only `fusion` may
   * play — walks the *bass* for ghost candidates before the snare, from one
   * stream, so a tune that puts a different number of onsets under the bass
   * moves every snare ghost after it. That is a real breach of the same
   * guarantee, it predates this file, and the twenty unpinned seeds the gate
   * above uses catch it only if one of them lands on fusion. Fixing it belongs
   * to `applyFeel`; asserting it here would report someone else's bug against
   * this one's name.
   */
  const HOOKS = ['through', 'loose', 'standard', 'catchy', 'earworm'] as const;
  let pinned = 0, figuresMoved = 0, kitMoved = 0, shotBars = 0;
  for (let i = 0; i < 20; i++) {
    const at = HOOKS.map((hook) => generateSong({
      seed: `shot-${i}`, genre: 'jazz', style: 'fusion', hook,
    }));
    const shots = (song: Song) => (song.meta.transitions ?? []).filter((s) => s.kind === 'shot');
    const figuresOf = (song: Song) => JSON.stringify(shots(song).map((s) => [s.bar, s.figure]));
    // The rewritten bar, up to and including the cymbal on the downbeat it aims
    // at. Nothing else in the song is this pass's to answer for.
    const kitOf = (song: Song) => {
      const bpb = song.meta.beatsPerBar;
      const spans = shots(song).map((s) => [(s.bar - 1) * bpb, s.bar * bpb] as const);
      return JSON.stringify(song.drums.events.filter((e) => spans.some(
        ([from, to]) => e.beat >= from - 1e-6 && e.beat <= to + 1e-6,
      )));
    };
    shotBars += shots(at[0]!).length;
    pinned++;
    for (const song of at.slice(1)) {
      if (figuresOf(song) !== figuresOf(at[0]!)) figuresMoved++;
      if (kitOf(song) !== kitOf(at[0]!)) kitMoved++;
    }
  }
  check(
    'a shot is the same figure at every hook level',
    figuresMoved === 0 && kitMoved === 0 && shotBars > 0,
    figuresMoved || kitMoved
      ? `${figuresMoved} figure lists and ${kitMoved} shot bars of kit moved with --hook`
      : `${shotBars} shots over ${pinned} fusion songs, identical across all ${HOOKS.length} levels, kit included`,
  );

  /**
   * The same guarantee over the *whole* kit, on the one style that can break it.
   *
   * `hook leaves form, key, tempo, instruments and drums alone` already compares
   * drum events byte for byte — but over twenty songs drawn from the whole
   * catalogue, and the only feel that writes a drum event is `funk`, which only
   * `fusion` may play. So the general check sampled the failure at a few percent
   * and passed on luck for two waves, exactly the way the genre-wide leading-tone
   * assertion did before it was pinned to a style.
   *
   * Pinning it to fusion is what makes it a check rather than a lottery: every
   * song here is one that actually draws ghosts. It is what caught `applyFeel`
   * drawing its snare ghosts from the stream the bass had already walked — see
   * `kitRng` in `generate/song.ts` for why that is a hook dependency and not a
   * detail of ordering.
   */
  let kitDiffered = 0;
  for (let i = 0; i < 24; i++) {
    const at = HOOKS.map((hook) => generateSong({
      seed: `fk-${i}`, genre: 'jazz', style: 'fusion', hook,
    }));
    const kit = (song: Song) => JSON.stringify(song.drums.events);
    if (at.slice(1).some((song) => kit(song) !== kit(at[0]!))) kitDiffered++;
  }
  check(
    'the kit is deaf to the tune, on the one style that could hear it',
    kitDiffered === 0,
    kitDiffered
      ? `${kitDiffered} of 24 fusion songs changed their drums with --hook`
      : '24 fusion songs, drum events identical across all 5 hook levels',
  );

  /**
   * The rate limiter, and the box gate, over a catalogue talked into shots.
   *
   * Every style is handed `fill 1, shot 3` for the length of this block —
   * ambient included, which is not an endorsement but the point: what is being
   * measured is the limiter, and it has to hold whatever a palette asks for. The
   * raw draw is three seams in four; the plan allows one gesture per four seams
   * and none at the first, and the bound that falls out of stating both as one
   * rule is strictly under a quarter.
   *
   * A preset box gets `fill` and nothing else in the same sweep. `canVary` is
   * false for exactly one source and it already takes away the fill, the drum
   * solo and the response to intensity; a band figure is the same capability,
   * and a machine with one pattern per button cannot play one.
   */
  const saved = new Map<Style, TransitionPalette | undefined>();
  for (const gid of GENRE_IDS) {
    for (const style of Object.values(getGenre(gid).styles)) {
      saved.set(style, style.transitions);
      style.transitions = [['fill', 1], ['shot', 3]];
    }
  }
  let seamsSeen = 0, gestures = 0, atFirst = 0, boxSongs = 0, boxGestures = 0, handSongs = 0;
  for (const gid of GENRE_IDS) {
    for (let i = 0; i < 40; i++) {
      const song = generateSong({ seed: `rate-${gid}-${i}`, genre: gid });
      const plan = song.meta.transitions ?? [];
      const box = !canVary(song.drums.source ?? 'kit');
      const nonFill = plan.filter((s) => s.kind !== 'fill').length;
      seamsSeen += plan.length;
      gestures += nonFill;
      if (plan[0] && plan[0].kind !== 'fill') atFirst++;
      if (box) { boxSongs++; boxGestures += nonFill; } else if (nonFill) handSongs++;
    }
  }
  for (const [style, table] of saved) style.transitions = table;

  check(
    'a gesture waits four seams, and never opens',
    seamsSeen > 0 && gestures / seamsSeen < 0.25 && atFirst === 0,
    `${gestures} of ${seamsSeen} seams (${(gestures / seamsSeen * 100).toFixed(1)}%) drawn from a 75% table, ${atFirst} at the first seam`,
  );
  check(
    'a preset box only ever fills',
    boxSongs > 0 && boxGestures === 0 && handSongs > 0,
    `${boxGestures} band figures across ${boxSongs} box songs, against ${handSongs} played ones that got at least one`,
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
      // A style with no list of its own takes whatever the palette gives it, and
      // whether that instrument has hands is a fact about the catalogue rather
      // than a claim this table is making. Nothing to check.
      for (const [id] of style.twoHanded.instruments ?? []) {
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
  for (const mode of ['answer', 'unison', 'block', 'ostinato', 'stride'] as const) {
    for (let i = 0; i < 12; i++) {
      const rng = new Rng(`hand-${mode}-${i}`);
      const line = probeLine({
        style, chords, tag: `hand-line-${i}`, range: [65, 84], strictness: 1, agility: 1,
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
    orphans.length ? orphans.slice(0, 4).join(', ') : `${checked} left-hand onsets across 5 modes`,
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
//
// **Two different parts land on this layer and they have to be counted apart.**
// `counterMode: 'ostinato'` puts a running sequencer figure here instead of an
// answering line, and every property below inverts between them by design — see
// `counterMode` in `style/types.ts`. Pooled, they measured a mixture and
// therefore nothing: the ostinato's 671 arpeggiated moves swamped the answer's
// 220 stepwise ones and both of the original claims read as broken while the
// answer itself was untouched. Split, each half is checked for what it is, and
// the split is not a loosening — the ostinato picks up two claims of its own
// below, and the one thing both parts must do is stated for both.
console.log('\nCounter-melody');
{
  let steps = 0, thirds = 0, moves = 0, overlap = 0, doubled = 0, multi = 0, figures = 0;
  /**
   * The `unison` device, counted apart from the fault it looks identical to.
   *
   * An answer note on the tune at the octave is a fault everywhere except where an
   * arrangement drew `unison` and `joinIn` wrote it, and the only thing telling
   * those apart is `NoteEvent.doubling`. Checking the mark alone would be circular
   * — anything could set it — so what is checked is the property the mark is
   * *claiming*: that this is a phrase and not a collision. Deliberate doublings
   * come in runs; a fault is one note wide. `joinIn` refuses to write fewer than
   * three notes, so a run shorter than that means something else set the mark.
   */
  let joined = 0, joinRuns = 0, shortRuns = 0;
  /** The `ostinato` half: notes, how many sound under the tune, and stacks. */
  let ostNotes = 0, ostUnder = 0, ostStacked = 0, ostSongs = 0;
  /** The same overlap fraction for the answer, so the contrast is measured
   *  rather than asserted against a number somebody chose. */
  let ansNotes = 0, ansUnder = 0;
  for (const gid of GENRE_IDS) {
    for (let i = 0; i < 40; i++) {
      const s = generateSong({ seed: `cm-${i}`, genre: gid });
      const isOstinato = getGenre(gid).styles[s.meta.style]?.counterMode === 'ostinato';
      const bpb = s.meta.beatsPerBar;
      // A solo section puts the *lead* on the counter instrument; those notes
      // are a melody, not an answer, and counting them measures the wrong thing.
      const answering = (beat: number) => s.sections.some((sec) => sec.solo?.layer !== 'counter'
        && beat >= sec.startBar * bpb && beat < (sec.startBar + sec.lengthBars) * bpb);
      // The line on this side too, and for the same reason it is the line on the
      // other. The counter instrument is drawn from a palette full of accordions
      // and its own left hand now goes into its own track, so `.notes` here was
      // charging the answer with every left-hand chord tone that happened to sit
      // an octave off the tune — 346 of 1274 overlaps, none of them an answer.
      const counterTrack = s.tracks.find((t) => t.layer === 'counter');
      const counter = (counterTrack ? melodicLine(counterTrack) : [])
        .filter((n) => answering(n.beat)).sort((a, b) => a.beat - b.beat);
      // The line, not the track. On a two-handed lead the track also carries
      // that player's own accompaniment, and an answer landing an octave above a
      // left-hand chord tone is not the answer doubling the tune — it is the
      // answer doing its job over a comp, which is what every other style in the
      // catalogue has a separate comp track for.
      //
      // …and the whole line, because there is no longer anything ambiguous in it.
      // This used to count only the onsets where a single note sounded, to work
      // around `melodicLine` reading a wide left-hand voicing — a root and a
      // seventh, eleven semitones on a track whose gap is ten — as a right hand
      // over a left hand and charging the answer with doubling a note that was
      // never the tune. Two of them in 351 overlaps. The left hand now says which
      // notes are its own, so the filter was discarding real overlaps to hide two
      // false ones and every note here is the tune.
      const melodyTrack = s.tracks.find((t) => t.layer === 'melody');
      const melody = (melodyTrack ? melodicLine(melodyTrack) : [])
        .slice().sort((a, b) => a.beat - b.beat);
      if (!counter.length) continue;

      /**
       * A sequencer sounds one note at a time and does not care what the tune
       * is doing. Both are measured here rather than in the answer's loop
       * below, because the answer's loop is about phrase shape and an ostinato
       * has no phrases in it — it never stops.
       */
      if (isOstinato) {
        ostSongs++;
        const byBeat = new Map<number, number>();
        for (const n of counter) byBeat.set(n.beat, (byBeat.get(n.beat) ?? 0) + 1);
        for (const count of byBeat.values()) if (count > 1) ostStacked++;
        ostNotes += counter.length;
        for (const n of counter) {
          if (melody.some((m) => m.beat <= n.beat + 1e-6 && m.beat + m.duration > n.beat + 1e-6)) ostUnder++;
        }
        continue;
      }
      ansNotes += counter.length;
      for (const n of counter) {
        if (melody.some((m) => m.beat <= n.beat + 1e-6 && m.beat + m.duration > n.beat + 1e-6)) ansUnder++;
      }

      let figure = 0;
      /** Length of the run of deliberate doublings currently open. */
      let run = 0;
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
        if (under && !n.doubling) { overlap++; if (Math.abs(under.midi - n.midi) % 12 === 0) doubled++; }
        if (n.doubling) { joined++; run++; }
        else if (run) { joinRuns++; if (run < 3) shortRuns++; run = 0; }
      }
      if (figure) { figures++; if (figure > 1) multi++; }
      if (run) { joinRuns++; if (run < 3) shortRuns++; }
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
    'the answer never doubles the tune at the unison or octave by accident',
    doubled === 0,
    `${doubled} of ${overlap} unmarked overlapping notes`,
  );
  /**
   * …and where it doubles the tune on purpose, it does it for a phrase.
   *
   * The claim `NoteEvent.doubling` makes is not "this note is allowed on the tune",
   * it is "these two players are stating this together" — and that is a property of
   * a *span*, so it is a span that gets checked. One marked note between unmarked
   * ones would be exactly the fault above wearing the exemption, which is the only
   * way the mark could make the music worse.
   */
  check(
    'and where it doubles it on purpose, it does so for a whole phrase',
    joinRuns > 0 && shortRuns === 0,
    `${joinRuns} spans, ${joined} notes, ${shortRuns} shorter than three notes`,
  );
  // The second sequencer. Its whole claim is that it is *not* an answer, so the
  // checks are the two properties an answer could never have.
  const ostPct = (ostUnder / Math.max(1, ostNotes)) * 100;
  const ansPct = (ansUnder / Math.max(1, ansNotes)) * 100;
  check(
    'the second sequencer plays one note at a time',
    ostSongs > 0 && ostStacked === 0,
    `${ostStacked} stacked onsets in ${ostNotes} notes over ${ostSongs} songs`,
  );
  check(
    'the second sequencer runs under the tune, not in its gaps',
    ostNotes > 0 && ostPct > ansPct * 1.5,
    `${ostPct.toFixed(0)}% of ostinato notes sound under a melody note vs ${ansPct.toFixed(0)}% of answers`,
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

        /**
         * The line, not the track — the third place in this file to need saying
         * so, and the first where the two-handed player is not the lead.
         *
         * Every measurement below is about what the soloist *played*: whether
         * the line lands on the guide tones, whether it leaves room, whether it
         * builds. A soloist who comps for themselves puts chord tones on the
         * changes and notes in the holes by construction, so counting the whole
         * track would mark their own accompaniment as a solo that never rests
         * and always lands right.
         */
        const track = song.tracks.find((t) => t.layer === sec.solo!.layer);
        const notes = (track ? melodicLine(track) : [])
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
      const notes = probeLine({
        style, chords, tag: `ag-${s2}`, range: [60, 79], strictness: 2, agility,
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
      const notes = probeLine({
        style, chords, tag: `id-${s2}`, range: [60, 79], strictness: 2,
        agility: 0.9, idiom: inst,
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
