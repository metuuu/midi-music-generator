/**
 * Chimera correctness checks.
 *
 *   npm run chaos
 *
 * Everything a chaos song can get wrong is a *silent degradation* rather than a
 * crash, which is the whole reason this file exists. A figure hosted in the
 * wrong bar wraps instead of failing. A progression read in a mode it was not
 * written for produces chords, just not the ones the tune is picking notes over.
 * A borrowed `excludeLayers` removes the band and leaves a song with a pad in
 * it. None of those throws, and none of them is distinguishable from "chaos" by
 * listening once — so if they are only checked by ear, they are not checked.
 *
 * The assertions come in three kinds:
 *
 *  - **Gates.** The things `genre/chaos.ts` refuses to mix. Every borrowed
 *    figure must come from a style that agrees with the host about the bar and
 *    can be played at the song's tempo; the mode drawn must have a progression
 *    table written for it; required and excluded layers must not contradict.
 *  - **The A/B.** With `band` alone selected nothing the engine composes from has
 *    moved, so key, tempo and form must come out identical to the plain song of
 *    the same seed — and at `spread: 0` the whole song must, byte for byte. The
 *    five kinds must also be genuinely independent: what one borrows alone is
 *    what it borrows alongside the other four, donor for donor.
 *  - **Coverage.** Every trait must actually fire somewhere. A trait whose `take`
 *    always returns false is a property nobody can borrow and looks exactly like
 *    one nobody happened to draw.
 */

import { GENRES, GENRE_IDS } from './genre/index.js';
import {
  CHAOS_LEVELS, donorCounts, layerConflict, planChaos, type ChaosLevel,
} from './genre/chaos.js';
import { generateSong } from './generate/song.js';
import { getGenre } from './genre/index.js';
import { buildConcert } from './concert/index.js';
import { DRESSED_BY, wardrobeFor } from './concert/cast.js';
import { SYNTH_RIGS } from './concert/instruments.js';
import { renderMidi } from './render/midi.js';
import { renderStrudel } from './render/strudel.js';
import type { Song } from './core/types.js';
import type { Style } from './style/types.js';
import { depthSummary, seeds } from './depth.js';

let failures = 0;
let checks = 0;

function check(ok: boolean, what: string, detail?: string): void {
  checks++;
  if (ok) return;
  failures++;
  console.error(`  ✗ ${what}${detail ? `\n      ${detail}` : ''}`);
}

function section(title: string): void {
  console.log(`\n${title}`);
}

/** Every style in the catalogue, by `genre:style`, for resolving a recipe. */
const STYLES = new Map<string, { genre: string; style: Style }>();
for (const [gid, genre] of Object.entries(GENRES)) {
  for (const style of Object.values(genre.styles)) STYLES.set(`${gid}:${style.id}`, { genre: gid, style });
}

/** The traits that move slot tables, and therefore need a metre-compatible donor. */
const FIGURE_TRAITS = new Set([
  'bass', 'comp', 'drums', 'melody-cells', 'counter-line', 'band-shots', 'two-hands',
]);

/**
 * Chaos is a property suite — a chimera must regenerate from its own recipe, a
 * spread of zero must be byte-identical, a kind at full must borrow what it
 * borrows alone. One counter-example settles any of them, so the standard pass
 * searches a twelfth as hard and the quick one a forty-eighth — a weaker search
 * rather than a wrong answer.
 * The one loop left at full size is the wardrobe sweep, whose assertion is that
 * a trait *ever* fires — thin that and it fails on a draw nobody made.
 */
const S = (full: number) => seeds(full, Math.max(2, Math.round(full / 12)), Math.max(1, Math.round(full / 48)));

const SEEDS = S(200);

// ---------------------------------------------------------------------------
// 1. Gates
// ---------------------------------------------------------------------------

section('Gates — what a chimera refuses to mix');

{
  /**
   * The bar, and the tempo.
   *
   * Read off the recipe rather than off the notes, deliberately: a wrapped
   * figure is *audible* and not *detectable* — the events it produces are legal
   * events at legal slots, and nothing downstream can tell them from a figure
   * that was written that way. The recipe names the donor, the donor's table
   * states its own metre, and that comparison is exact.
   */
  let figureDonors = 0;
  for (let i = 0; i < SEEDS; i++) {
    const song = generateSong({ seed: `gate${i}`, chaos: { levels: CHAOS_LEVELS, spread: 1 } });
    const recipe = song.meta.chaos!;
    const host = getGenre(recipe.host.genre).styles[recipe.host.style]!;
    for (const [trait, from] of Object.entries(recipe.borrowed)) {
      if (!FIGURE_TRAITS.has(trait)) continue;
      const donor = STYLES.get(from);
      check(!!donor, `recipe names a style that exists (${from})`);
      if (!donor) continue;
      figureDonors++;
      check(
        donor.style.beatsPerBar === host.beatsPerBar,
        `figure donor agrees about the bar (seed gate${i}, ${trait})`,
        `host ${recipe.host.genre}:${host.id} is ${host.beatsPerBar} beats, ${from} is ${donor.style.beatsPerBar}`,
      );
      check(
        (donor.style.groups?.join('+') ?? '') === (host.groups?.join('+') ?? ''),
        `figure donor agrees about the grouping (seed gate${i}, ${trait})`,
        `host [${host.groups?.join('+') ?? 'even'}] vs [${donor.style.groups?.join('+') ?? 'even'}]`,
      );
      check(
        song.meta.bpm >= donor.style.bpm[0] && song.meta.bpm <= donor.style.bpm[1],
        `the tempo suits every band that wrote a figure (seed gate${i}, ${trait})`,
        `${song.meta.bpm} BPM against ${from}'s ${donor.style.bpm[0]}–${donor.style.bpm[1]}`,
      );
    }
  }
  console.log(`  ${figureDonors} borrowed figures across ${SEEDS} seeds, all metre- and tempo-checked`);
}

{
  /**
   * The mode has a table written for it.
   *
   * `pickProgression` falls back to `Style.progressions` when the drawn mode has
   * no override, and `progressions` is written for the style's *primary* mode —
   * so a chimera drawing minor from one donor's weights and major numerals from
   * another's table would harmonise the whole song against the wrong scale
   * degrees. `soundModeWeights` is what prevents it; this is what proves it did.
   */
  let harmonyBorrowed = 0;
  for (let i = 0; i < SEEDS; i++) {
    const song = generateSong({ seed: `mode${i}`, chaos: { levels: ['harmony'], spread: 1 } });
    const recipe = song.meta.chaos!;
    const from = recipe.borrowed['harmony'];
    if (!from) continue;
    harmonyBorrowed++;
    const donor = STYLES.get(from)!.style;
    const primary = donor.modeWeights.minor >= donor.modeWeights.major ? 'minor' : 'major';
    const override = song.meta.mode === 'major' ? donor.majorProgressions : donor.minorProgressions;
    check(
      song.meta.mode === primary || !!override?.verse?.length,
      `the drawn mode has a progression table (seed mode${i})`,
      `${from} is primarily ${primary}, song is ${song.meta.mode}, no ${song.meta.mode} verse table`,
    );
  }
  console.log(`  ${harmonyBorrowed}/${SEEDS} songs borrowed their harmony; every drawn mode had a table`);
}

{
  /**
   * A band with something in it.
   *
   * Two ways a chimera could empty the stage, and both are cheap to rule out:
   * a `layers` donor whose two lists contradict each other, and a style that
   * excludes everything the arranger would otherwise have written.
   */
  for (let i = 0; i < SEEDS; i++) {
    const song = generateSong({ seed: `band${i}`, chaos: { levels: CHAOS_LEVELS, spread: 1 } });
    check(
      song.tracks.length > 0 || song.drums.events.length > 0,
      `the band is not empty (seed band${i})`,
      `${song.meta.chaos!.borrowed['layers'] ?? 'no layers borrowed'}`,
    );
  }
  for (const [id, { style }] of STYLES) {
    check(layerConflict(style).length === 0, `no style requires a layer it excludes (${id})`);
  }
  console.log(`  ${SEEDS} chimeras, none with an empty stage; ${STYLES.size} styles free of layer contradictions`);
}

// ---------------------------------------------------------------------------
// 2. The A/B
// ---------------------------------------------------------------------------

section('The A/B — what a chimera leaves alone');

{
  /**
   * `spread: 0` is the identity.
   *
   * The strongest statement this feature can make, and the one that costs
   * nothing to check: asked for chaos and given a rate of zero, the generator
   * must hand back the song it would have written anyway — every note, every
   * seam, every field but the recipe itself. It is the same claim `feels`,
   * `transitions` and `drops` each make about a style that names no palette, and
   * it is what proves the traits are the *only* thing this file changes.
   */
  const strip = (song: Song) => {
    const { chaos, ...meta } = song.meta;
    return JSON.stringify({ ...song, meta });
  };
  const IDENTICAL = S(60);
  for (let i = 0; i < IDENTICAL; i++) {
    const plain = generateSong({ seed: `zero${i}` });
    const quiet = generateSong({ seed: `zero${i}`, chaos: { levels: CHAOS_LEVELS, spread: 0 } });
    check(
      strip(plain) === strip(quiet),
      `spread 0 is the plain song (seed zero${i})`,
      `${plain.meta.genre}:${plain.meta.style}`,
    );
    check(
      Object.keys(quiet.meta.chaos!.borrowed).length === 0,
      `spread 0 borrows nothing (seed zero${i})`,
    );
  }
  console.log(`  ${IDENTICAL} seeds at spread 0, byte-identical to the plain song`);
}

{
  /**
   * `band` alone keeps the piece and changes the players.
   *
   * Everything deciding the key, the tempo and the form is drawn before an
   * instrument is chosen, and no table any of it reads moves for this kind — so
   * this is exact, and it is what makes `--chaos band` an A/B rather than a
   * reroll.
   *
   * It stops here on purpose. Note-identity is **not** claimed and is not true:
   * a lead with a `HandSpec` writes a left hand and one without it does not, so
   * swapping the instrument moves every draw after the first section. The piece
   * is the same piece; the performance is a different performance.
   */
  const shape = (song: Song) => JSON.stringify({
    bars: song.meta.totalBars,
    bpm: song.meta.bpm,
    tonic: song.meta.tonic,
    mode: song.meta.mode,
    sections: song.sections.map((s) => [s.kind, s.lengthBars, s.transpose]),
  });
  let moved = 0;
  for (let i = 0; i < SEEDS; i++) {
    const plain = generateSong({ seed: `ab${i}` });
    const wild = generateSong({ seed: `ab${i}`, chaos: { levels: ['band'], spread: 1 } });
    check(
      shape(plain) === shape(wild),
      `band alone keeps key, tempo and form (seed ab${i})`,
      `${plain.meta.genre}:${plain.meta.style} — ${shape(plain)} vs ${shape(wild)}`,
    );
    const players = (s: Song) => s.tracks.map((t) => t.instrument).join(',');
    if (players(plain) !== players(wild) || plain.drums.bank !== wild.drums.bank) moved++;
  }
  console.log(`  ${SEEDS} seeds: form, key and tempo held; the band changed on ${moved} of them`);

  /**
   * …and a band seed of its own keeps that promise while changing the answer.
   *
   * Two claims in one loop, because separately neither is worth much. The piece
   * must be **untouched** — same key, same tempo, same form, by the same
   * argument as above, since `ChaosOptions.seed` moves a stream the main draw
   * never reads. And the borrowings must actually **differ** from the song's own
   * seed, or the control is decorative: a seed field that quietly changed
   * nothing would be the worst version of this feature, and it is the one a
   * typo in the stream name would produce.
   */
  let redrawn = 0;
  for (let i = 0; i < SEEDS; i++) {
    const own = generateSong({ seed: `ab${i}`, chaos: { levels: ['band'], spread: 1 } });
    const elsewhere = generateSong({
      seed: `ab${i}`,
      chaos: { levels: ['band'], spread: 1, seed: `elsewhere${i}` },
    });
    check(
      shape(own) === shape(elsewhere),
      `a band seed of its own leaves the piece alone (seed ab${i})`,
      `${shape(own)} vs ${shape(elsewhere)}`,
    );
    check(
      elsewhere.meta.chaos!.seed === `elsewhere${i}`,
      `the recipe names the band's seed (seed ab${i})`,
    );
    if (JSON.stringify(own.meta.chaos!.borrowed) !== JSON.stringify(elsewhere.meta.chaos!.borrowed)) {
      redrawn++;
    }
  }
  check(
    redrawn > SEEDS * 0.9,
    'a different band seed draws a different band',
    `only ${redrawn}/${SEEDS} seeds borrowed anything different`,
  );
  console.log(`  ${SEEDS} seeds under a foreign band seed: the piece held, the borrowings moved on ${redrawn}`);
}

{
  /**
   * The recipe is enough to get the song back.
   *
   * `SongMeta` is meant to be sufficient to reproduce the song it describes, and
   * a chimera is the one case where the genre, era and style are not — they name
   * the host. This is the check that `chaos` closes that gap rather than merely
   * describing it.
   */
  const REGENERATED = S(60);
  for (let i = 0; i < REGENERATED; i++) {
    // A different subset each time: single kinds, then adjacent pairs, then the
    // lot — so the round trip is exercised on combinations rather than only on
    // the two ends of the range.
    const levels: ChaosLevel[] = i % 3 === 0
      ? [CHAOS_LEVELS[i % CHAOS_LEVELS.length]!]
      : i % 3 === 1
        ? [CHAOS_LEVELS[i % CHAOS_LEVELS.length]!, CHAOS_LEVELS[(i + 2) % CHAOS_LEVELS.length]!]
        : [...CHAOS_LEVELS];
    // …and every fourth of them mixed per kind rather than evenly, because a
    // rate the recipe forgot to record would reproduce as `spread` and the song
    // would come back *nearly* right — which is the failure this catches and
    // the only kind `mixing` can cause.
    const mixing = i % 4 === 3
      ? { band: 1, figures: 0.15, harmony: 0.9, staging: 0 }
      : undefined;
    // …and every fifth drawn from a band seed of its own, which the recipe has
    // to carry for the same reason: reproduced from the song's seed instead, it
    // would come back as a different band playing the right piece.
    const chaosSeed = i % 5 === 4 ? `band${i}` : undefined;
    const first = generateSong({
      seed: `rep${i}`,
      chaos: {
        levels, spread: 0.6, ...(mixing ? { mixing } : {}), ...(chaosSeed ? { seed: chaosSeed } : {}),
      },
    });
    const again = generateSong({
      seed: first.meta.seed,
      genre: first.meta.genre,
      era: first.meta.era,
      style: first.meta.style,
      mood: first.meta.mood,
      chaos: {
        levels: first.meta.chaos!.levels,
        spread: first.meta.chaos!.spread,
        ...(first.meta.chaos!.mixing ? { mixing: first.meta.chaos!.mixing } : {}),
        ...(first.meta.chaos!.seed ? { seed: first.meta.chaos!.seed } : {}),
      },
    });
    check(
      JSON.stringify(first) === JSON.stringify(again),
      `a chimera regenerates from its own metadata (seed rep${i}, ${levels.join('+')})`,
    );
  }
  console.log(`  ${REGENERATED} chimeras over single kinds, pairs and the full set, each regenerated exactly from its recipe`);
}

// ---------------------------------------------------------------------------
// 3. Coverage
// ---------------------------------------------------------------------------

section('Coverage — every kind and every trait reachable');

{
  /**
   * A trait that never fires is a property nobody can borrow, and it is
   * indistinguishable from one nobody happened to draw — which is the failure
   * mode `docs/engine-gaps.md` §7 names as worse than an absence: generality
   * nothing uses. Every trait must appear in some recipe.
   */
  const seen = new Map<string, number>();
  const COVER = S(400);
  for (let i = 0; i < COVER; i++) {
    const song = generateSong({ seed: `cover${i}`, chaos: { levels: CHAOS_LEVELS, spread: 1 } });
    for (const trait of Object.keys(song.meta.chaos!.borrowed)) {
      seen.set(trait, (seen.get(trait) ?? 0) + 1);
    }
  }
  // Named here rather than exported from `chaos.ts`: a check that reads the
  // list it is checking would pass for a table with one entry in it.
  const expected = [
    'melody-instrument', 'counter-instrument', 'comp-instrument', 'pad-instrument',
    'bass-instrument', 'brass-instrument', 'drum-machine', 'sequencing',
    'ensemble-weight', 'feels', 'swing', 'fills', 'transitions', 'drops', 'tempo-ramp',
    'techniques', 'effects', 'drum-effects', 'filter', 'room', 'balance', 'comping',
    'soloing', 'ornament', 'figure-freedom', 'arrangement',
    'bass', 'comp', 'drums', 'melody-cells', 'melody-character', 'phrasing',
    'counter-line', 'band-shots', 'two-hands', 'layers', 'layer-plan',
    'harmony', 'second-voice', 'modulation',
    'form', 'ending', 'repetition', 'title', 'voice',
    'body', 'programme', 'clothes',
    'jacket-colour', 'shirt-colour', 'accent-colour', 'hair-colour',
  ];
  /**
   * Reachability is counted, not sampled — see `donorCounts`.
   *
   * The sampling below is real end-to-end evidence and stays, but it cannot be
   * the assertion: `tempo-ramp` has one donor in 389 styles, so whether it turns
   * up in four hundred chimeras is a coin flip, and this check went red on it the
   * first time the trait list was reordered. What it should have been asking is
   * whether anything in the catalogue *has* the property to lend.
   */
  const counts = donorCounts({
    genre: getGenre('iskelma'),
    era: Object.values(getGenre('iskelma').eras)[0]!,
    style: Object.values(getGenre('iskelma').styles)[0]!,
  });
  for (const trait of expected) {
    check(
      (counts.get(trait) ?? 0) > 0,
      `trait "${trait}" is reachable`,
      'no style in the catalogue has this property to lend',
    );
  }
  const scarce = expected
    .map((t) => [t, counts.get(t) ?? 0] as const)
    .filter(([, n]) => n > 0 && n < 20)
    .sort((a, b) => a[1] - b[1]);
  if (scarce.length) {
    console.log(`  scarce properties — ${scarce.map(([t, n]) => `${t}=${n}`).join(' ')} donor tables of ${
      [...counts.values()].reduce((m, n) => Math.max(m, n), 0)}`);
  }
  for (const trait of seen.keys()) {
    check(expected.includes(trait), `trait "${trait}" is in this check's list`, 'add it to `expected`');
  }
  const rarest = [...seen].sort((a, b) => a[1] - b[1]).slice(0, 4);
  console.log(`  ${seen.size} traits fired over ${COVER} chimeras; rarest ${rarest.map(([t, n]) => `${t}=${n}`).join(' ')}`);
}

{
  /**
   * **The kinds are independent, and this is the assertion that makes the
   * control usable.**
   *
   * Tick one box, note what moved; tick all five, and the first box's borrowings
   * must be *identical* — same properties, same donor for each. If they were not,
   * every comparison a user makes with these controls would be a lie: turning on
   * `harmony` to hear what it does would also silently redraw the instruments,
   * and nothing could be A/B'd against anything.
   *
   * It holds because `planChaos` spends a coin and a donor draw on **every**
   * trait, including the ones the selection excludes — see the loop there. This
   * is the check that keeps that deliberate waste honest, and it is why it is
   * worth the draws.
   *
   * The union is checked too, in the other direction: the full set must borrow
   * exactly what the five singles borrow between them, so no trait is reachable
   * only in combination.
   */
  const KINDS = S(40);
  for (let i = 0; i < KINDS; i++) {
    const all = generateSong({ seed: `kinds${i}`, chaos: { levels: CHAOS_LEVELS, spread: 1 } })
      .meta.chaos!.borrowed;
    const union: Record<string, string> = {};
    for (const level of CHAOS_LEVELS) {
      const solo = generateSong({ seed: `kinds${i}`, chaos: { levels: [level], spread: 1 } })
        .meta.chaos!.borrowed;
      for (const [trait, donor] of Object.entries(solo)) {
        union[trait] = donor;
        check(
          all[trait] === donor,
          `"${level}" alone borrows what it borrows alongside the others (seed kinds${i})`,
          `${trait}: ${donor} alone, ${all[trait] ?? 'not borrowed'} together`,
        );
      }
    }
    const extra = Object.keys(all).filter((t) => !(t in union));
    check(
      extra.length === 0,
      `no trait is reachable only in combination (seed kinds${i})`,
      `${extra.join(', ')}`,
    );
  }
  console.log(`  ${KINDS} seeds: each of ${CHAOS_LEVELS.join(', ')} borrows the same things alone as together`);
}

{
  /**
   * **Per-kind mixing is the same control, once per kind** — the two claims
   * `ChaosOptions.mixing` makes, each asserted against something already known
   * to be true rather than against itself.
   *
   * *A uniform mix is the spread.* Every kind set to 0.7 by hand must produce
   * the song `spread: 0.7` produces, note for note and donor for donor. If it
   * did not, the advanced control would be a second mechanism wearing the same
   * name, and the simple one would stop being the special case of it.
   *
   * *One kind at full and the rest at nothing is that kind alone.* Which is the
   * sharper of the two, because it is the independence check one axis over: the
   * kinds already borrow the same things alone as together, so if turning the
   * others down to zero leaves the first one's borrowings untouched, then a rate
   * moves what its own kind takes and nothing else — which is the whole reason
   * to hand somebody six sliders rather than one.
   *
   * The recipe's own rate fields are normalised away before comparing, because
   * they are exactly what differs by construction: two settings that describe
   * the same song describe it differently, and it is the *song* that has to
   * match.
   */
  const withoutRates = (song: Song): string => JSON.stringify({
    ...song,
    meta: { ...song.meta, chaos: { ...song.meta.chaos!, spread: 0, mixing: undefined } },
  });
  const flat = (rate: number) => Object.fromEntries(CHAOS_LEVELS.map((l) => [l, rate]));

  const MIXES = S(30);
  for (let i = 0; i < MIXES; i++) {
    const plain = generateSong({ seed: `mix${i}`, chaos: { levels: CHAOS_LEVELS, spread: 0.7 } });
    const spelled = generateSong({
      seed: `mix${i}`,
      chaos: { levels: CHAOS_LEVELS, spread: 0.2, mixing: flat(0.7) },
    });
    check(
      withoutRates(plain) === withoutRates(spelled),
      `every kind mixed at 0.7 is spread 0.7 (seed mix${i})`,
    );

    for (const level of CHAOS_LEVELS) {
      const solo = generateSong({ seed: `mix${i}`, chaos: { levels: [level], spread: 1 } })
        .meta.chaos!.borrowed;
      const loud = generateSong({
        seed: `mix${i}`,
        chaos: { levels: CHAOS_LEVELS, mixing: { ...flat(0), [level]: 1 } },
      }).meta.chaos!.borrowed;
      check(
        JSON.stringify(solo) === JSON.stringify(loud),
        `"${level}" at 1 with the rest at 0 borrows exactly what it borrows alone (seed mix${i})`,
        `alone ${JSON.stringify(solo)}\n      mixed ${JSON.stringify(loud)}`,
      );
    }
  }
  console.log(`  ${MIXES} seeds: a flat mix is the spread, and one kind at full silences into ${CHAOS_LEVELS.length} solos`);
}

{
  /**
   * Every host in the catalogue can be a chimera.
   *
   * 389 styles, one seed each, at the top rung. The interesting ones are the
   * metres with no company — `arabic:jurjina` is alone in 2.5/16 and must come
   * out as a perfectly ordinary jurjina with a foreign band on it rather than
   * as an error — and the genres whose `scaleForChord` is a maqam or a rāga.
   */
  const perMetre = new Map<string, number>();
  let borrowedFigures = 0;
  for (const gid of GENRE_IDS) {
    const genre = getGenre(gid);
    for (const style of Object.values(genre.styles)) {
      const key = `${style.beatsPerBar}${style.groups ? `[${style.groups.join('+')}]` : ''}`;
      perMetre.set(key, (perMetre.get(key) ?? 0) + 1);
      let song: Song | undefined;
      try {
        song = generateSong({ seed: `all:${gid}:${style.id}`, genre: gid, style: style.id, chaos: { levels: CHAOS_LEVELS, spread: 1 } });
      } catch (err) {
        check(false, `${gid}:${style.id} can host a chimera`, String(err));
        continue;
      }
      check(song.meta.chaos!.host.style === style.id, `${gid}:${style.id} stays the host`);
      check(song.meta.beatsPerBar === style.beatsPerBar, `${gid}:${style.id} keeps its bar`);
      if (Object.keys(song.meta.chaos!.borrowed).some((t) => FIGURE_TRAITS.has(t))) borrowedFigures++;
    }
  }
  console.log(`  ${STYLES.size} styles hosted a chimera; ${borrowedFigures} of them found somebody to trade figures with`);
  console.log(`  ${perMetre.size} distinct metres in the catalogue, largest ${
    [...perMetre].sort((a, b) => b[1] - a[1])[0]!.join(' × ')} styles`);
}

// ---------------------------------------------------------------------------
// 4. Playable, and stageable
// ---------------------------------------------------------------------------

section('Playable — a chimera is a song like any other');

{
  /**
   * Both renderers, at the top rung, with vocals on a third of them.
   *
   * The renderers are where a chimera would fail *late*: an instrument the
   * soundfont map has never been asked for, a drum voice missing from a
   * borrowed bank, a technique on a part that cannot take it. All of it is
   * reachable in an ordinary song too — but only through combinations a genre
   * author chose, and the whole business of this feature is producing the ones
   * nobody chose.
   */
  let midi = 0;
  let strudel = 0;
  const RENDERED = S(40);
  for (let i = 0; i < RENDERED; i++) {
    const song = generateSong({ seed: `render${i}`, chaos: { levels: CHAOS_LEVELS, spread: 1 }, vocals: i % 3 === 0 });
    try {
      midi += renderMidi(song).length;
    } catch (err) {
      check(false, `a chimera renders to MIDI (seed render${i})`, String(err));
    }
    try {
      strudel += renderStrudel(song).length;
    } catch (err) {
      check(false, `a chimera renders to Strudel (seed render${i})`, String(err));
    }
    checks += 2;
  }
  console.log(`  ${RENDERED} chimeras rendered — ${Math.round(midi / 1024)} kB of MIDI, ${Math.round(strudel / 1024)} kB of Strudel`);
}

{
  /**
   * …and the stage, which is the half that was never told any of this exists.
   *
   * The claim being checked is not that the show is good but that nothing under
   * `src/concert/` needed a line: the venue, the year and the wardrobe resolve
   * off `meta.genre` and `meta.era`, and a chimera keeps both. An evening with
   * chaos on must therefore play **the same repertoire in the same room** as the
   * evening without it — same styles, same keys, same moods, same building.
   * Lengths and tempos are allowed to move, and do, because a chimera narrows
   * its tempo band to what every band that wrote a figure in it can play.
   */
  const EVENINGS = S(4);
  for (let i = 0; i < EVENINGS; i++) {
    const plain = buildConcert({ seed: `show${i}` });
    const wild = buildConcert({ seed: `show${i}`, chaos: { levels: ['figures'], spread: 0.8 } });
    const programme = (c: typeof plain) => JSON.stringify(
      c.numbers.map((n) => [n.song.meta.style, n.song.meta.keyLabel, n.song.meta.mood]),
    );
    check(programme(plain) === programme(wild), `the chaos evening plays the same repertoire (seed show${i})`);
    check(plain.venue.label === wild.venue.label, `…in the same room (seed show${i})`);
    check(plain.year === wild.year, `…in the same decade (seed show${i})`);
    for (const number of wild.numbers) {
      check(!!number.song.meta.chaos, `every number is a chimera (seed show${i})`);
      check(
        number.cast.performers.length > 0,
        `somebody is on stage (seed show${i}, ${number.song.meta.title})`,
      );
    }
  }
  console.log(`  ${EVENINGS} evenings staged with chaos on: same repertoire, same room, same decade, a chimera per number`);
}

{
  /**
   * …and the band is dressed by whoever lent them their instruments.
   *
   * The cast follows a borrowed instrument on its own — an `Archetype` is
   * derived from the track, so the object, the posture and the headcount all
   * change without anything being told. The *clothes* are the half that had to
   * be wired, and `wardrobeForPlayer` wires it by re-reading the published
   * recipe. This asserts the two ways it could silently do nothing.
   *
   * **The link is a string.** `DRESSED_BY` maps a layer to a trait *name*, so a
   * trait renamed in `genre/chaos.ts` would leave every player in the house's
   * clothes and nothing would fail. Checking the names against the traits that
   * actually fire is the only thing standing between that and a silent revert.
   *
   * **And the clothes must actually be the donor's.** A jacket is checked
   * against that genre's own palette — or the house's, since the band uniform is
   * still drawn from the host and a guest may put it on. That is a weaker
   * statement than "the donor's palette" and a much stronger one than nothing:
   * it rules out all seventeen other genres.
   *
   * `loud` is part of a palette and the first version of this check left it out,
   * which failed 15 times on the `melody` layer and nowhere else — the front
   * person's jacket comes from `Wardrobe.loud` when `spotlight` fires, and the
   * lead is the one player that reaches it. The check was wrong rather than the
   * clothes, and the shape of the failure said so: a fault in the wiring would
   * not have picked out exactly the layer with a second palette.
   */
  const palette = (w: ReturnType<typeof wardrobeFor>) => [...w.jackets, ...w.loud];
  const traitNames = new Set<string>();
  for (let i = 0; i < 40; i++) {
    const song = generateSong({ seed: `dress${i}`, chaos: { levels: CHAOS_LEVELS, spread: 1 } });
    for (const name of Object.keys(song.meta.chaos!.borrowed)) traitNames.add(name);
  }
  for (const [layer, trait] of Object.entries(DRESSED_BY)) {
    check(
      traitNames.has(trait),
      `the trait dressing "${layer}" exists (${trait})`,
      'no chimera ever borrowed it — the name is stale and that layer silently keeps the house clothes',
    );
  }

  let dressed = 0;
  for (let i = 0; i < S(8); i++) {
    const concert = buildConcert({ seed: `dress${i}`, chaos: { levels: ['band'], spread: 1 } });
    for (const number of concert.numbers) {
      const recipe = number.song.meta.chaos!;
      const house = wardrobeFor(recipe.host.genre, number.song.meta.era);
      for (const performer of number.cast.performers) {
        const trait = DRESSED_BY[performer.layer];
        const from = trait ? recipe.borrowed[trait] : undefined;
        if (!from) continue;
        dressed++;
        const donor = wardrobeFor(from.split(':')[0]!, number.song.meta.era);
        check(
          palette(donor).includes(performer.look.outfit.jacket)
            || palette(house).includes(performer.look.outfit.jacket),
          `a borrowed player wears the lender's colours (seed dress${i}, ${performer.layer})`,
          `${performer.look.outfit.jacket} is in neither ${from.split(':')[0]}'s palette nor the house's`,
        );
      }
    }
  }
  console.log(`  ${dressed} players across 8 evenings dressed by the genre that lent them their instrument`);
}

{
  /**
   * The year still gates the gear, on a stage chaos has put strange things on.
   *
   * `concert-check` already asserts that every synthesiser existed in the year
   * it is staged in, and that assertion has teeth — it caught a polysynth in
   * 1780 once. Chaos makes the case it was written for reachable in a way plain
   * songs never make it: borrowing a 1990s palette into a 1938 tanssilava puts a
   * `synth` archetype in a decade where no genre would have drawn one, and
   * `rigPoolFor` has to have a rig for it.
   *
   * Nothing here randomises the year, deliberately. It is a *gate* rather than a
   * palette — `eligibleDrumSources`, `SEQUENCER_FROM` and `rigPoolFor` all refuse
   * what the year is too early for — so mixing it would subtract options rather
   * than add strangeness, and would read on stage as gear going missing.
   */
  let keyboards = 0;
  let anachronistic = 0;
  const notes: string[] = [];
  for (const genre of GENRE_IDS) {
    const concert = buildConcert({
      seed: `year-${genre}`, genre, chaos: { levels: CHAOS_LEVELS, spread: 1 },
    });
    for (const number of concert.numbers) {
      for (const performer of number.cast.performers) {
        if (performer.archetype !== 'synth' || !performer.rig) continue;
        keyboards++;
        const spec = SYNTH_RIGS[performer.rig];
        if (concert.year < spec.from || concert.year > spec.to) {
          anachronistic++;
          if (notes.length < 4) {
            notes.push(`${genre} ${concert.year}: ${performer.rig} (${spec.from}–${spec.to})`);
          }
        }
      }
    }
  }
  check(
    anachronistic === 0,
    'every synthesiser chaos stages existed in the year it is staged in',
    notes.join('; '),
  );
  console.log(`  ${keyboards} synths staged under full chaos, every one of its own decade`);
}

// ---------------------------------------------------------------------------

console.log(`\n${checks} checks, ${failures} failure(s)${depthSummary()}`);
if (failures) process.exit(1);

// Keeps `planChaos` and `ChaosLevel` honest at the type level even though this
// file reaches them through `generateSong`: a signature change should break the
// check that guards the feature, not only the feature.
export type { ChaosLevel };
export { planChaos };
