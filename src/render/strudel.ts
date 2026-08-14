/**
 * Song IR -> Strudel source code.
 *
 * This renderer exists to *audition* what the generator wrote: paste the output
 * into strudel.cc, or run it in the demo page, and you hear the arrangement
 * immediately. It is deliberately the only file in the project that knows
 * Strudel exists, which is what keeps the AGPL boundary clean — see README.
 *
 * Notes are laid out on a sixteenth-note grid, one cycle per bar, using
 * mini-notation `_` to sustain and `~` to rest. That produces code a human can
 * read and edit, rather than an opaque blob.
 *
 * Per-note velocity is carried as a parallel gain grid on the same slots as the
 * notes — mini-notation has no inline velocity, so a control pattern is the only
 * way. It is emitted only for parts that actually have dynamics to carry, which
 * keeps the output readable; see `dynamicGrid`.
 */

import { SLOTS_PER_BEAT, quantise, slotOf, tempoRange } from '../core/grid.js';
import { midiToNoteName, spellingFor } from '../core/pitch.js';
import { resolveDrumSample, type DrumSample } from './drum-banks.js';
import { levelOfDrum, levelOfSound } from './source-levels.js';
import {
  DUCK_BEATS, DUCK_ONSET_SECONDS, duckFloor, kickOnsets, sweptCutoff, tempoLabel,
} from '../core/types.js';
import type {
  DrumVoice, Effects, Envelope, LayerId, NoteEvent, Song, Track, Vowel,
} from '../core/types.js';
import {
  CONSONANTS, FORMANT_BANDWIDTHS, FORMANT_GAINS, VOICE_MIX, VOWEL_FORMANTS,
} from '../style/vocals.js';

export interface StrudelRenderOptions {
  /** Emit the `samples()` / soundfont preamble. Off when embedding in the demo page. */
  includePrebake?: boolean;
  /** Wrap in a `setcpm` + `stack(...)` block ready to paste into strudel.cc. */
  standalone?: boolean;
}

/**
 * One layer's music, as code that evaluates to a pattern on its own.
 *
 * The unit a live stage swaps. `code` is self-contained — a sung layer's
 * `voiceBinding` declarations travel inside it rather than sitting above the
 * whole stack — so it can go through `evaluate` by itself and the result is the
 * pattern for that layer and nothing else.
 */
export interface LayerPattern {
  layer: LayerId;
  code: string;
}

/**
 * A song split into the parts a running stage can replace one at a time.
 *
 * The reason this exists rather than everyone calling `renderStrudel`: a whole
 * song is 60–124 KB of generated JavaScript, and handing that to Strudel means
 * an acorn parse, a compile of a source string the engine has never seen, and a
 * pattern graph of several thousand combinators — all on the main thread, all
 * while the stage is trying to hold 60 fps. A tomato used to pay it twice, once
 * to mute the player and once to bring them back. Split up, muting costs no
 * evaluation whatever and a re-voice costs one layer's worth. See
 * `web/audio.ts`, which holds the layers behind `ref` so the running pattern
 * reads them at query time.
 */
export interface StrudelParts {
  /** Cycles per minute, for the scheduler. One bar is one cycle. */
  cpm: number;
  layers: LayerPattern[];
}

/**
 * One emitted block, and which player it belongs to.
 *
 * `defs` are statements that have to run before `code` and that only this layer
 * uses — the `const v0 = …` a sung part is filtered out of four times. They ride
 * with the part rather than sitting above the stack so that one layer can be
 * evaluated on its own. In the whole-song render they land exactly where they
 * always did, because nothing else writes to the file between `setcpm` and the
 * stack.
 */
interface Emitted {
  layer: LayerId;
  defs: string[];
  code: string;
}

export function renderStrudel(song: Song, opts: StrudelRenderOptions = {}): string {
  const { header, parts } = build(song, opts);
  const lines = [...header];
  for (const part of parts) {
    if (!part.defs.length) continue;
    lines.push(...part.defs, '');
  }
  const stacked = parts.map((p) => p.code).join(',\n\n');

  if (opts.standalone !== false) {
    lines.push('stack(');
    lines.push(stacked);
    lines.push(')');
  } else {
    lines.push(`stack(\n${stacked}\n)`);
  }

  return lines.join('\n') + '\n';
}

/**
 * The same song, one evaluable block per layer.
 *
 * Order is the emission order of `renderStrudel`, so a stack built from these in
 * sequence is the stack that function would have written — which matters, since
 * superdough's orbit numbers are handed out as parts are emitted and a layer
 * pulled out of sequence would duck against a bus that is not there.
 */
export function renderStrudelParts(song: Song, opts: StrudelRenderOptions = {}): StrudelParts {
  const { parts } = build(song, opts);
  const byLayer = new Map<LayerId, Emitted[]>();
  for (const part of parts) {
    const at = byLayer.get(part.layer) ?? [];
    at.push(part);
    byLayer.set(part.layer, at);
  }

  return {
    cpm: song.meta.bpm / song.meta.beatsPerBar,
    layers: [...byLayer].map(([layer, group]) => ({
      layer,
      code: [
        ...group.flatMap((p) => p.defs),
        `stack(\n${group.map((p) => p.code).join(',\n\n')}\n)`,
      ].join('\n'),
    })),
  };
}

function build(song: Song, opts: StrudelRenderOptions): { header: string[]; parts: Emitted[] } {
  const { meta } = song;
  const slotsPerBar = meta.beatsPerBar * SLOTS_PER_BEAT;
  const lines: string[] = [];

  lines.push(`// ${meta.title}`);
  lines.push(`// ${meta.styleLabel} · ${meta.eraLabel} · ${meta.keyLabel} · ${tempoLabel(meta)} BPM · mood: ${meta.mood}`);
  lines.push(`// seed: ${meta.seed}  —  regenerate this exact song with --seed ${meta.seed}`);
  lines.push(`// form: ${song.sections.map((s) => `${s.kind}${s.transpose ? `(+${s.transpose})` : ''}`).join(' → ')}`);
  lines.push('');

  if (opts.includePrebake) {
    for (const url of SAMPLE_MANIFESTS) lines.push(`await samples('${url}');`);
    lines.push('');
  }

  /**
   * The tempo — one number, and **the audition cannot ramp**.
   *
   * This is the plainest statement in the file and it is here rather than buried
   * in a report because a silent approximation is the worse failure. Strudel's
   * tempo is a property of the *scheduler*, not of the pattern:
   * `setcpm(n)` calls `scheduler.setCps(n / 60)` and that is the whole of the
   * interface. There is a `.cpm()` pattern method, and it is deprecated and is
   * `_fast(cpm / 60)` — a constant time-stretch of a pattern's contents, not a
   * tempo automation. Stretching a bar inside a cycle does not make the cycle
   * shorter, so a per-bar `fast` would bunch that bar's notes up and leave a gap
   * at the end of it. That is a rushed bar with a hole in it, which is a worse
   * lie than a flat playback.
   *
   * There is one further reason not to reach for a trick, and it is the decisive
   * one. `web/concert/transport.ts` finds the beat that is *sounding* by
   * inverting Strudel's own scheduling equation — `c(t) = C₀ + (t − T₀ − latency)
   * · cps` — which is exact by construction precisely because `cps` is constant
   * between tempo changes. Anything that made the audition's tempo move would
   * make every hand on the concert stage wrong, in a way that reads as "the
   * animation feels floaty" rather than as a clock bug. The audition and the
   * stage are one system and they are flat together.
   *
   * ## So what a ramping song sounds like here
   *
   * It plays at `meta.bpm` throughout, which is defined as the tempo the band
   * counts off — see the field's own note, where the mean was rejected for this
   * among other reasons. That makes the fallback *the opening of the piece,
   * held*, which is the one wrong answer a listener can recognise as an
   * excerpt rather than as a mistake. It also means the audition runs longer
   * than the file: `songDurationSeconds` is the written length, and the
   * audition's is `songDurationBeats / meta.bpm × 60`.
   *
   * The `.mid` is where the ramp lives, and that is the right way round. This
   * renderer already documents the same split in the other direction — delay,
   * drive, crush and phaser are **audition only** because General MIDI has no
   * controller for them, and `render/midi.ts` says so. A tempo ramp is the first
   * thing that is *shipping only*, and it is announced in the emitted source so
   * that somebody pasting this into strudel.cc and wondering why it does not
   * accelerate finds the answer in the file they are looking at.
   */
  const tempo = meta.tempo;
  if (tempo) {
    const [low, high] = tempoRange(tempo);
    const first = tempo[0]!.bpm;
    const last = tempo.at(-1)!.bpm;
    // The extremes only where the endpoints do not already state them, which on
    // a monotonic ramp they do. A drift that ends where it started needs them.
    const spread = low === Math.min(first, last) && high === Math.max(first, last)
      ? '' : ` (${low}–${high})`;
    lines.push(`// TEMPO RAMP — this audition plays flat at ${meta.bpm} BPM.`);
    lines.push(`// The piece is written to move ${first}→${last} BPM${spread}`
      + ` over ${tempo.length} tempo changes.`);
    lines.push('// Strudel\'s tempo is one global number per pattern, so the ramp cannot be');
    lines.push('// auditioned here. Render the .mid to hear it — see render/strudel.ts.');
  }
  // One cycle per bar: cycles-per-minute = beats-per-minute / beats-per-bar.
  lines.push(`setcpm(${(meta.bpm / meta.beatsPerBar).toFixed(4)});`);
  lines.push('');

  const parts: Emitted[] = [];
  /** Every emitted block belongs to somebody. `push` is where it is said. */
  const push = (layer: LayerId, code: string, defs: string[] = []) => {
    parts.push({ layer, code, defs });
  };

  const spelling = spellingFor(meta.tonic, meta.mode);
  const ducked = duckPlan(song);
  /**
   * Which bus each ducked part ended up on, assigned as the parts are actually
   * emitted rather than planned in advance.
   *
   * The ordering has to be this way round because a track can be planned and
   * then not written: the grid check a few lines below drops any part whose
   * notes all fall outside the song's own bars, and a bus number handed to a
   * part that never appears is a kick ducking an orbit that does not exist —
   * which superdough logs as an error and plays through, so the record comes
   * out sounding merely un-pumped. Numbering from 2 leaves superdough's default
   * orbit 1 to everything else.
   */
  const orbits = new Map<Track, number>();

  /**
   * How many sung tracks have been written, which is what names the next one.
   *
   * Counted here rather than taken from the track's index in `song.tracks`,
   * because the two must agree with what is actually emitted: the grid check
   * below drops a track whose notes all fall outside the song's bars, and a
   * gap in the numbering would be harmless while a name claimed by a dropped
   * track would not.
   */
  let sungTracks = 0;

  for (const track of song.tracks) {
    const { grid, divided } = buildNoteGrid(
      track.notes, song.meta.totalBars, slotsPerBar, spelling,
    );
    if (!grid.some((bar) => bar.some((slot) => slot !== '~'))) continue;

    // A sung track is bound to a name above the stack and then filtered three
    // times, so the note grid is written once rather than once per formant. The
    // name belongs to the track and not to the renderer — a style singing in
    // harmony arranges two of these, and one shared name is a redeclaration that
    // stops the whole pattern parsing. See `voiceBinding`.
    if (track.voice) {
      const binding = voiceBinding(sungTracks++);
      // The definition rides on the first of this voice's formants, so that a
      // layer lifted out on its own carries the name its parts refer to.
      const defs = voiceDefinition(
        track, binding, formatGrid(grid), meta.totalBars, slotsPerBar, meta.bpm, divided,
      );
      let first = true;
      for (const code of voiceParts(track, binding, meta.totalBars, slotsPerBar)) {
        push(track.layer, code, first ? defs : []);
        first = false;
      }
      const burst = consonantBurst(track, meta.totalBars, slotsPerBar, meta.bpm, divided);
      if (burst) push(track.layer, burst, first ? defs : []);
      continue;
    }

    /**
     * The soundfont's own trim, folded in here rather than into `track.gain`.
     *
     * It is a fact about webaudiofont's conversion of this particular program
     * and not about the part, so it must not reach the MIDI — which reads
     * `track.gain` straight into channel volume. See `render/source-levels.ts`.
     *
     * Per note rather than per track, because a soundfont's zones are separate
     * recordings and are not levelled against each other — so the trim belongs
     * to the note, in the same way the drum trim belongs to the sample that
     * sounds rather than to the kit.
     */
    const level = (note: NoteEvent) => levelOfSound(track.strudelSound, note.midi);
    /**
     * Per-note dynamics, as a gain grid laid on the same sixteenth slots as the
     * notes. Only emitted when the part actually has something to carry — a comp
     * that plays every chord at one level, on one zone of its font, gains
     * nothing from a second grid saying so, and the audition output stays
     * readable.
     */
    const dyn = dynamicGrid(track, meta.totalBars, slotsPerBar, level);
    /**
     * The same trick again for the filter: where a part's notes carry
     * brightness, the cutoff becomes a pattern on the note slots and takes the
     * place of the static `.lpf()` in the effect chain rather than joining it —
     * two `.lpf()` calls on one pattern is the second one winning silently.
     */
    const sweep = filterSweep(track, meta.totalBars, slotsPerBar);
    /**
     * And once more for the pitch. Where a part's notes travel, the pitch
     * envelope becomes a pattern on the note slots — and unlike the two above it
     * this one is emitted here rather than inside `effectChain`, because a part
     * can carry a glide without carrying any effects at all and `effectChain`
     * returns empty for a track with no `Effects`. It suppresses the static
     * `.penv()` there instead; see `pitchSlide`.
     */
    const slide = pitchSlide(track, meta.totalBars, slotsPerBar, meta.bpm);
    /**
     * And where the notes fall between the slots. Unlike the three above it this
     * one carries no musical decision of its own — it is the correction for what
     * `slotOf` rounded away, and a part written exactly on the grid emits none.
     * See `timingNudge`.
     */
    const nudged = timingNudge(track, meta.totalBars, slotsPerBar, meta.bpm, divided);
    const part = [
      `  // ${track.layer} — ${track.instrument}`,
      `  note(\`${formatGrid(grid)}\`)`,
      `    .sound('${track.strudelSound}')`,
      dyn
        ? `    .gain(\`${formatGrid(dyn)}\`)`
        : `    .gain(${(track.gain * level(track.notes[0]!)).toFixed(3)})`,
      ...envelopeChain(track.envelope),
      ...slide,
      ...nudged,
      ...effectChain(track.effects, song, sweep, slide.length > 0),
      /**
       * The sidechain's target end: a bus of its own for the kick to reach.
       *
       * A duck is the one effect in this renderer that is not a property of the
       * part at all — it is something done *to* the part by another part — so
       * it is the one that cannot be written in the effect chain above. See
       * `duckPlan`.
       */
      ...(ducked.targets.has(track) ? [`    .orbit(${orbits.size + 2})`] : []),
    ].join('\n');
    if (ducked.targets.has(track)) orbits.set(track, orbits.size + 2);
    push(track.layer, part);
  }

  // Drums: one pattern per voice so the per-voice mix survives.
  const byVoice = new Map<DrumVoice, DrumHit[][]>();
  for (const e of song.drums.events) {
    const bar = Math.floor(e.beat / meta.beatsPerBar);
    const slot = slotOf(e.beat - bar * meta.beatsPerBar);
    if (bar < 0 || bar >= meta.totalBars) continue;
    let grid = byVoice.get(e.voice);
    if (!grid) {
      grid = Array.from({ length: meta.totalBars }, () => [] as DrumHit[]);
      byVoice.set(e.voice, grid);
    }
    const placed = Math.min(slot, slotsPerBar - 1);
    grid[bar]!.push({
      slot: placed,
      velocity: e.velocity,
      roll: e.roll ?? 1,
      // Against the slot the stroke was actually filed under, including the clamp
      // above: a hit that rounded past the barline is played at the end of the bar
      // it belongs to, and the correction has to describe where it really went.
      nudge: (e.beat - bar * meta.beatsPerBar) - placed / SLOTS_PER_BEAT,
    });
  }

  for (const [voice, grid] of byVoice) {
    /**
     * Old machines do not have modern kits. Substitute what this bank actually
     * has — see `render/drum-banks.ts` — or drop the part entirely rather than
     * emit a sample name that does not resolve.
     *
     * The answer is a sample and an address rather than a voice, because a
     * hand-percussion rack can be riding on the machine and its samples are
     * addressed the other way round: bare names picked with `.n()`, where a
     * machine's are prefixed with `.bank()`. See `SAMPLE_RACKS`.
     */
    const played = resolveDrumSample(song.drums.bank, voice);
    if (!played) continue;
    /**
     * A slot is one stroke, unless the stroke said it was several.
     *
     * `DrumEvent.roll` — `docs/engine-gaps.md` §3.15, the trap and drill
     * retrigger — and this is the audition's whole half of it: a **nested
     * group**, `[hh*3]` standing where `hh` stood. Mini-notation divides a group
     * evenly among its slot, so the sixteenth is played three times inside itself
     * and nothing outside that slot moves by a sample.
     *
     * ## Established by querying the installed parser, not by reading about it
     *
     * The tempo ramp's answer to this question was *no*, and it says so in a
     * banner rather than faking one; `NoteBend`'s was *yes*, and only after
     * finding that the control named `slide` is dead and the live mechanism is a
     * pitch envelope with the anchor turned round. So the same standard applies
     * here, and the answer came out of `@strudel/mini` rather than out of a
     * memory of what mini-notation does. `<[hh hh ~ [hh*3]]>` queried over one
     * cycle returns five haps:
     *
     *     0.0000  0.2500  |  0.7500  0.8333  0.9167
     *
     * — the first two sixteenths where they were, a rest, and the fourth slot cut
     * in three at exactly 1/12 of the bar. `*4` gives 0.7500/0.8125/0.8750/0.9375
     * and `*6` gives sixths, so the count is a divisor rather than a suggestion,
     * and the arithmetic is rational rather than sampled — the same property that
     * made the piecewise-constant tempo map the only shape four consumers could
     * implement identically.
     *
     * ## The velocity grid needed nothing, and that is not luck
     *
     * `drumDynamics` emits one number per slot on a parallel pattern, so the
     * obvious worry is that a slot holding three strokes now wants three numbers
     * and would have to nest too — at which point a `_` in the next slot stretches
     * the *group* rather than holding its last value, and the two grids slide
     * apart by a 32nd. Measured, because that failure would be inaudible in the
     * text and obvious in the ear: `s("[hh*3] hh ~ hh").gain("0.5 0.9 0.9 0.4")`
     * queried directly gives all three of the first slot's strokes `gain: 0.5`.
     * A control pattern is applied **appLeft** — the structure is the sound's and
     * the value is sampled at each stroke's own onset — so a flat number covering
     * the slot reaches every stroke standing in it.
     *
     * Which is exactly the level rule `DrumEvent.roll` argues for on musical
     * grounds: every stroke of a roll is the velocity of the stroke it
     * subdivides, because a retriggered step has one velocity. The renderer wants
     * the same thing the music wants, so there is no second grid and no `_` to
     * get wrong.
     *
     * **The louder claim wins a shared slot**, which is the rule already sitting
     * ten lines down in `drumDynamics` — two strokes on one slot sound as one and
     * it is the harder of them that was asked for. Here the same collision is
     * between a plain stroke and a rolled one, from a fill landing on a figure's
     * own sixteenth, and the roll wins for the reason the sample grid is silent
     * about: the two strings are no longer identical, so somebody has to choose,
     * and a retrigger flattened back to one stroke is the gap this file is
     * closing.
     */
    const bars = grid.map((hits) => {
      const row: string[] = Array.from({ length: slotsPerBar }, () => '~');
      const rolls = new Map<number, number>();
      for (const h of hits) rolls.set(h.slot, Math.max(rolls.get(h.slot) ?? 1, h.roll));
      for (const h of hits) {
        const roll = rolls.get(h.slot)!;
        row[h.slot] = roll > 1 ? `[${played.sample}*${roll}]` : played.sample;
      }
      return row;
    });
    /**
     * Per-voice treatment costs nothing here, because the kit is already one
     * pattern per voice — the split `voiceGains` needed. It is what lets 1984
     * exist: gated reverb on the snare and nothing else, where a kit treated as
     * one object puts that same two-second tail on every hi-hat.
     */
    const perVoice = song.drums.voiceEffects?.[voice];
    const fx = perVoice ? { ...song.drums.effects, ...perVoice } : song.drums.effects;
    /**
     * Two different keys, and both are right. The fader is the voice the part
     * was *written* as, because a tom standing in for another tom is still
     * mixed as the tom it was written as; the trim is the voice that actually
     * sounds, because that is the sample whose level was measured. See
     * `render/source-levels.ts`.
     */
    const level = levelOfDrum(song.drums.bank, played.voice);
    const gain = song.drums.gain * (song.drums.voiceGains[voice] ?? 1) * level;
    /**
     * How hard each stroke was, on the same slots as the strokes themselves —
     * the drummer's half of the level, where everything above this line is the
     * engineer's.
     */
    const dyn = drumDynamics(grid, slotsPerBar, gain);
    /**
     * And where each of them landed, which for a ride is most of what the part
     * is saying. See `drumNudge`.
     */
    const shift = drumNudge(grid, slotsPerBar, meta.bpm);
    push('drums', [
      `  // drums — ${voice}${drumNote(song.drums.bank, voice, played)}`,
      `  s(\`${formatGrid(bars)}\`)`,
      played.bank !== undefined
        ? `    .bank('${played.bank}')`
        : `    .n(${played.n})`,
      dyn ? `    .gain(\`${formatGrid(dyn)}\`)` : `    .gain(${gain.toFixed(3)})`,
      ...(shift ? [`    .nudge(\`${formatGrid(shift)}\`)`] : []),
      ...effectChain(fx, song),
      // The sidechain's source end, on the kick and only on the kick. See
      // `duckPlan`; `kickOnsets` argues why it is `bd` by name.
      ...(voice === 'bd' ? ducked.controls(orbits) : []),
    ].join('\n'));
  }

  return { header: lines, parts };
}

/** Drum-machine sample set used by the audition render (verified reachable). */
export const DRUM_SAMPLES_URL =
  'https://raw.githubusercontent.com/felixroos/dough-samples/main/tidal-drum-machines.json';

/**
 * The Versilian Community Sample Library: 128 sets of real instruments,
 * recorded rather than synthesised.
 *
 * Two things in it that nothing else here can supply. **Percussion that is not a
 * drum machine** — darbuka, framedrum, conga, bongo, cajon, agogo, cabasa,
 * clave, guiro, cowbell, tambourine, shakers, vibraslap, woodblock, timpani,
 * gongs — which is the entire auxiliary rack that `tidal-drum-machines` does
 * not have, because a 1982 rhythm box did not have it either. And **acoustic
 * instruments a soundfont approximates badly**, which is the other half of why
 * this is being registered now: the melodic catalogue can point entries at these
 * names and get a recording instead of a 1990s soundcard's idea of one.
 *
 * Sample names here are bare — `darbuka`, `tambourine2`, `snare_modern` — with
 * no bank prefix, which is the opposite convention to the drum-machine pack and
 * is why the two cannot collide. That one difference is also why the percussion
 * half is reached by a `SAMPLE_RACKS` entry in `render/drum-banks.ts` rather
 * than by another row in `BANK_VOICES`: a bank name *is* a prefix, and these
 * names do not have one.
 */
export const VCSL_SAMPLES_URL =
  'https://raw.githubusercontent.com/felixroos/dough-samples/main/vcsl.json';

/**
 * Thirteen mridangam strokes, recorded on a real mridangam.
 *
 * `gumki ka nam ta ki dhin na chaapu dhum ardha thom dhi tha` — a Carnatic
 * drummer's own vocabulary, recorded stroke by stroke, which is the thing
 * `DrumVoice`'s `lp`/`mp`/`hp` are an abstraction *of*. Nothing else loaded here
 * has a South Indian drum in it at all.
 *
 * 4.8 kB of manifest for a genre that does not exist yet, which is the whole
 * argument for registering it now: an Indian style written against the three
 * strokes has somewhere real to land, and the cost of it being there in the
 * meantime is one small fetch. The landing is the `mridangam` rack in
 * `render/drum-banks.ts`, which reads `thom`, `na` and `ta` off this list.
 */
export const MRIDANGAM_SAMPLES_URL =
  'https://raw.githubusercontent.com/felixroos/dough-samples/main/mridangam.json';

/**
 * Every sample manifest the audition loads, in the order it loads them.
 *
 * One `samples()` call each, all three awaited together — see `web/audio.ts`.
 * They are separate constants above rather than a bare list because each one is
 * a different *kind* of thing and the reason it is here is not guessable from
 * the URL.
 *
 * Registering a manifest costs a JSON fetch and nothing else: `samples()` reads
 * a map of names to URLs and does not touch a single WAV until a pattern
 * triggers one. The three are 121 kB, 180 kB and 4.8 kB of *index*, fetched
 * together once at boot; the sounds nobody plays cost nothing at all.
 */
export const SAMPLE_MANIFESTS: readonly string[] = [
  DRUM_SAMPLES_URL, VCSL_SAMPLES_URL, MRIDANGAM_SAMPLES_URL,
];

/**
 * The note's amplitude shape, as superdough controls.
 *
 * Emitted on every played part, and it has to be, because leaving all four out
 * is not "no opinion" — it selects superdough's default of
 * `[0.001, 0.001, 1, 0.01]`, a gate. Which is why every instrument here used to
 * arrive sounding like the same cheap sampler: the soundfont loader loops any
 * zone that has loop points, so under a flat sustain a struck bar held for a bar
 * is a short slice of itself cycling at constant level, cut off in ten
 * milliseconds. The instruments that survived it were the ones that genuinely do
 * hold a note — organs, strings — which is exactly the set that sounded fine.
 *
 * Note that `clip`/`legato` is not the tool for a struck note's ring here, even
 * though it is the obvious one: `@strudel/soundfonts` takes its hold time
 * straight from the hap's duration and never reads `clip`, unlike the sampler
 * and synth paths. A struck note therefore rings for at most as long as it was
 * written, and `release` is what keeps that from being a click — see `Envelope`.
 */
function envelopeChain(env: Envelope | undefined): string[] {
  if (!env) return [];
  return [
    `    .attack(${env.attack}).decay(${env.decay})`
    + `.sustain(${env.sustain}).release(${env.release})`,
  ];
}

/**
 * What `Effects.drive` of 1 means, as a `.distort()` amount.
 *
 * The s-curve's small-signal gain is `e^d` for a `.distort(d)`, so this is
 * about 17 dB into the saturator. Past roughly 3 the curve stops sounding like
 * an amplifier being pushed and starts sounding like a fuzz box, and the IR's
 * `drive` is there to say that an electric violin has a pickup and an amp —
 * not that it has a pedalboard.
 */
const DRIVE_MAX = 2;

/**
 * How fast the phaser sweeps, in Hz. Fixed, because the IR carries a depth and
 * superdough needs a rate.
 *
 * One sweep every two and a half seconds. This effect is in the IR on period
 * grounds — a string machine through a phaser is the sound of 1976 — and that
 * sound is a slow one. Above about 2 Hz a phaser stops reading as a sweep and
 * starts reading as a tremolo, which belongs to a different decade entirely.
 */
const PHASER_RATE = 0.4;

/**
 * How long a glide takes, in seconds. Fixed, for the same reason `PHASER_RATE`
 * is: the IR carries the interval and superdough needs a time.
 *
 * Eighty milliseconds. A glide is heard as a slur into the note at this length
 * and as a separate pitch event above about a fifth of a second, and the
 * distinction is not subtle — the second one turns a lead line into a sequence
 * of sirens. Fixed rather than proportional to the note, because portamento on
 * the instruments this imitates is a knob setting in seconds and does not know
 * how long the note is going to be.
 */
const GLIDE_SECONDS = 0.08;

/**
 * How long a filter swell takes to open, in seconds.
 *
 * Long, and deliberately longer than any envelope in the `Envelope` table: this
 * is the gesture of leaning into a note that is already sounding, so it has to
 * be slow enough that the opening is audible *as* a change rather than as the
 * note's attack. At the tempi that ask for it — `cinematic` runs from 60 to 84
 * BPM — one and a half seconds is under half a bar.
 *
 * A note shorter than this simply gets the first part of the sweep, which is
 * the correct behaviour and the same one a real filter envelope has.
 */
const SWELL_SECONDS = 1.5;

/**
 * How fast a wah snaps open and how fast it shuts, in seconds.
 *
 * The other end of the same envelope, and the numbers are a physical box's
 * rather than a bar's — `GLIDE_SECONDS`' argument and `DUCK_ONSET_SECONDS`'. A
 * Mu-Tron III has no tempo control; it has a threshold and a peak switch, and
 * what it does to the eighth note at 92 BPM it does to the sixteenth at 126.
 *
 * **10 ms up**, against superdough's own filter default of 5. The gesture is the
 * *attack* — it has to land inside the note's own transient or the filter opens
 * after the ear has already decided what the note sounds like — and the reason
 * to be a little slower than the default is that the filter is downstream of a
 * *sampled* note whose transient is already recorded, so a step that fast is a
 * second attack rather than a shape on the first. It costs nothing: funk
 * generates 67–127 BPM, where a sixteenth runs 118–224 ms, so ten milliseconds
 * is under a twelfth of the shortest note in the genre.
 *
 * **140 ms down**, which is superdough's default decay exactly, and that is not
 * a coincidence worth hiding: the 150 ms open-and-shut that `SWELL_SECONDS`'
 * companions exist to *suppress* is a factory envelope filter. It also lands
 * where the music does. Against that same 118–224 ms sixteenth the filter is
 * home again by the next one, so the bar gets a separate event on every onset —
 * which is what makes this per note rather than a section sweep with a faster
 * clock. A note shorter than the two together gets the front of the shape and no
 * more, because `getParamADSR` squeezes the envelope into the note's own length,
 * and that is what the pedal does to a ghost note too.
 */
const WAH_ATTACK_SECONDS = 0.01;
const WAH_DECAY_SECONDS = 0.14;

/**
 * Effects, as superdough controls.
 *
 * Reverb and delay are *sends*: the size of the room and the length of the echo
 * come from `song.space` and are emitted identically on every part that sends
 * to them, so all of them land in one shared reverb rather than each conjuring
 * its own. That is both how a mixer works and how MIDI's CC91 works, which is
 * why the IR is shaped this way.
 *
 * `delaysync` rather than `delaytime`: superdough's `delaytime` is in seconds,
 * and an echo specified in seconds stops being a musical interval the moment
 * the tempo changes. `delaysync` is in cycles, and this renderer puts one bar
 * in a cycle — so a delay written in beats converts exactly.
 *
 * Drive, crush and phaser are written between the filters and the sends purely
 * so the chain reads as one sentence — filter, dirt, placement, sends.
 * superdough assembles its graph in a fixed order whatever order these are
 * called in, so nothing here depends on it. What does need saying is that only
 * one of the three takes the 0..1 the IR uses:
 *
 *  - **`.distort(d)` is not a wet/dry mix.** superdough raises it through
 *    `expm1(d)` into the shape coefficient of an s-curve whose small-signal
 *    gain works out to exactly `e^d` — so `d` is the drive stage's gain, 0 is
 *    an exact bypass, and the scale has no top (Strudel's own docs call 0..10
 *    useful). Full drive maps to `DRIVE_MAX`, ~17 dB into the saturator: an
 *    overdrive pedal rather than a fuzz box. Nothing compensates for the level
 *    it adds, because that level *is* the effect — the s-curve is unity at full
 *    scale and lifts everything below it, which is what a pushed amplifier
 *    sounds like. It follows that the grit is level-dependent, since
 *    superdough's gain stage runs before this one.
 *  - **`.crush(n)` is already in the IR's units**: n is the bit depth it
 *    quantises to, 1 drastic and 16 barely audible, and passes straight through.
 *  - **`.phaser(r)` is the sweep *rate* in Hz, not the depth.** It is an alias
 *    for `phaserrate`, and superdough builds no phaser at all unless it is set,
 *    so the IR's depth has to go to `.phaserdepth()` and the rate has to be
 *    supplied here. See `PHASER_RATE`.
 *
 * ## The two envelopes, and why they reach a soundfont at all
 *
 * `glide` and `filterEnv` are the only things in this chain that modulate a note
 * *while it sounds*, and the reason they can is worth stating because it is not
 * obvious from the outside: `@strudel/soundfonts` looks like a closed sampler,
 * but its `registerSound` hands its buffer source's `detune` to superdough's
 * own `getPitchEnvelope`, and the filter is built downstream of every source in
 * the shared chain. So a GM patch gets a pitch envelope and a filter envelope
 * on exactly the same terms a synthesised voice does.
 *
 *  - **`.penv(n)` is in semitones, and the sign is already the one wanted.**
 *    superdough anchors the envelope to its sustain level, which defaults to 1,
 *    so the detune runs from `-n` semitones up to zero across `pattack` and
 *    lands the note dead in tune. A positive `glide` therefore slides *up* onto
 *    the note, which is what the field says. `pcurve` is left at its linear
 *    default: an exponential ramp in cents cannot pass through zero, and zero
 *    is where every one of these has to finish.
 *  - **`.lpenv(n)` is in octaves, and the companions are what pick the
 *    gesture.** superdough's filter ADSR defaults to `[0.005, 0.14, 0, 0.1]`,
 *    so `lpenv` alone opens the filter and shuts it again inside 150 ms.
 *    `FilterEnvelope` has two shapes and this is exactly the knob between them.
 *    `lpsustain(1)` is what makes a **swell** stay open, and its decay is set
 *    short and harmless because with full sustain it has nothing to do;
 *    `lpsustain(0)` and a short attack are what make a **wah**, which is that
 *    same default said out loud rather than suppressed. `fanchor(1)` is the
 *    load-bearing one for both: it puts the envelope's *top* at the written
 *    cutoff and its bottom `n` octaves below, so the note reaches the brightness
 *    the era asked for instead of overshooting it into empty spectrum.
 *
 *    Emitted as **one line whichever shape it is**, and that is the point rather
 *    than a saving: superdough has one filter envelope per part, and a chain
 *    that could write two `.lpenv()` calls would be a chain where the second
 *    silently wins. See `FilterEnvelope` for why the IR makes that
 *    unrepresentable a level up.
 */
function effectChain(fx: Effects | undefined, song: Song, lpf?: string, bent?: boolean): string[] {
  if (!fx) return [];
  const { space, meta } = song;
  const out: string[] = [];
  // The note-by-note glide takes the whole pitch envelope when the part has one,
  // the same way `lpf` takes the filter — two `.penv()` calls on one pattern is
  // the second one winning silently. See `pitchSlide` for why the note wins.
  if (fx.glide && !bent) out.push(`    .penv(${fx.glide.toFixed(2)}).pattack(${GLIDE_SECONDS})`);
  // `lpf` is the note-by-note sweep when the part has one; see `filterSweep`.
  if (lpf !== undefined) out.push(`    .lpf(${lpf})`);
  else if (fx.lowpass !== undefined) out.push(`    .lpf(${Math.round(fx.lowpass)})`);
  // Inert without a cutoff to open from, and superdough builds no filter at all
  // in that case — so this is skipped rather than emitted and ignored.
  if (fx.filterEnv?.octaves && (lpf !== undefined || fx.lowpass !== undefined)) {
    const { octaves, shape } = fx.filterEnv;
    out.push(shape === 'swell'
      ? `    .lpenv(${octaves.toFixed(2)}).lpattack(${SWELL_SECONDS})`
        + `.lpdecay(0.01).lpsustain(1).fanchor(1)`
      : `    .lpenv(${octaves.toFixed(2)}).lpattack(${WAH_ATTACK_SECONDS})`
        + `.lpdecay(${WAH_DECAY_SECONDS}).lpsustain(0).fanchor(1)`);
  }
  if (fx.highpass !== undefined) out.push(`    .hpf(${Math.round(fx.highpass)})`);
  if (fx.resonance !== undefined) out.push(`    .resonance(${(fx.resonance * 20).toFixed(1)})`);
  if (fx.crush !== undefined) out.push(`    .crush(${fx.crush})`);
  if (fx.drive) out.push(`    .distort(${(fx.drive * DRIVE_MAX).toFixed(2)})`);
  if (fx.phaser) {
    out.push(`    .phaser(${PHASER_RATE}).phaserdepth(${fx.phaser.toFixed(2)})`);
  }
  if (fx.pan !== undefined) out.push(`    .pan(${((fx.pan + 1) / 2).toFixed(2)})`);
  if (fx.reverb) {
    out.push(`    .room(${fx.reverb.toFixed(2)}).roomsize(${space.reverbSize.toFixed(2)})`);
  }
  if (fx.delay) {
    const cycles = space.delayBeats / meta.beatsPerBar;
    out.push(
      `    .delay(${fx.delay.toFixed(2)}).delaysync(${cycles.toFixed(4)})`
      + `.delayfeedback(${space.delayFeedback.toFixed(2)})`,
    );
  }
  return out;
}

/**
 * The sidechain, as an orbit per ducked part and a set of controls on the kick.
 *
 * `docs/engine-gaps.md` §3.17 says sidechain compression is unsayable and that
 * the engine has no envelope follower. **The audition has had one the whole
 * time**, and it is not an approximation of the technique — Strudel's own
 * documentation for the control calls it *"a 'sidechain' like effect"*. Like
 * `NoteBend` before it, the answer came out of reading the installed packages
 * rather than out of a memory of what Strudel can do, and reading them was
 * worth it in both directions: the obvious candidate is dead and the live one
 * was not on the list.
 *
 * ## What does not work, checked first
 *
 * **`.compressor()` cannot do this and never could.** superdough builds a
 * `DynamicsCompressorNode` for it, and a Web Audio compressor has exactly one
 * input — there is nowhere to put a key signal. `voiceDefinition` below already
 * records the other half of that node's uselessness here, measured at a 33 dB
 * drop with no makeup gain. A compressor is the *device* a sidechain is built
 * out of and it is not the mechanism.
 *
 * **`.tremolosync()` is the near miss, and it is the interesting refusal.**
 * superdough will run an LFO on a part's amplitude at a rate given in cycles,
 * with `tremoloskew` to make it a sawtooth rather than a sine — which is a pad
 * pumping four times a bar, in one line, with no orbits and no second part
 * involved. It is refused because **an LFO is not keyed to anything**. It would
 * be right for the styles whose kick is on all four beats and wrong for every
 * other one in the same table: pop's own `kick-gap` figure puts the kick on
 * slots 0, 3, 6, 8 and 11, and a four-per-bar sine under that is a pulse that
 * agrees with the drums twice a bar and argues with them three times. A duck
 * that lands where the kick is not is worse than no duck, because it is a
 * *wrong* contour rather than a missing one — which is the exact distinction
 * the tempo ramp's banner turns on.
 *
 * ## What works
 *
 * `duckorbit`. An orbit is superdough's mixer bus: every part carrying
 * `.orbit(n)` sums into it, and a hap carrying `.duckorbit(n)` schedules a
 * ramp on **that bus's output gain** at its own onset time. So the kick reaches
 * across and pulls the pad down, which is the mechanism spelled exactly as the
 * gap entry describes it — *"one layer's gain is a function of another layer's
 * onsets"*.
 *
 * Three things make it the right shape rather than merely an available one:
 *
 *  - **It is not a `.gain()`, so the held note is not the limit.** A control
 *    pattern is applied appLeft — the fact `drumDynamics` relies on — so a
 *    pad's gain is sampled once at its onset and a supersaw held for four bars
 *    cannot pump inside it. That is exactly what `pop/index.ts` and
 *    `house/index.ts` both record as the reason the velocity workaround gets
 *    the comp and cannot get the pad. The duck runs on the bus, downstream of
 *    every note, and does not care whether anything was struck.
 *  - **It fires on the kick's real onsets**, including the strokes inside a
 *    `DrumEvent.roll`, because a rolled slot is a nested group and each stroke
 *    is a hap.
 *  - **It ducks the reverb too.** The ramp is on `Orbit.output`, which is
 *    downstream of the orbit's own reverb and delay sum — so a pad's tail
 *    breathes with the pad rather than filling in the hole the duck just made.
 *    That is what a sidechain across a bus does and what a per-voice gain
 *    cannot.
 *
 * ## What it costs, stated rather than discovered later
 *
 * An orbit owns its reverb and its delay. Moving a part onto orbit 2 therefore
 * gives it a *second* reverb node built to the same `roomsize` rather than a
 * send into the shared one, and `reverbGen` fills its impulse response with
 * `Math.random()`, so the two halls are the same size and not the same room.
 * `Space`'s docstring says one hall and each player further back in it, and
 * this is the first thing to bend that: a ducked part stands in an identical
 * room next door. It is the price of the bus and it is the same price a mixing
 * desk charges — a sidechained group goes through its own send.
 *
 * Orbit numbers start at 2 because superdough's default is 1, so **a song with
 * nothing ducked emits nothing at all** and is byte-identical to what it was.
 *
 * ## Depth, in superdough's units
 *
 * `duckdepth` is not a gain and not a ratio. superdough's floor works out to
 * `clamp(1 − √depth, 0.01, …)`, so the field is inverted, square-law, and has
 * no unit anybody sets a compressor in. `Effects.duck` is in decibels for that
 * reason and this is where the conversion happens — `(1 − floor)²` lands the
 * bus exactly on `duckFloor`, which is the same number `render/midi.ts` writes
 * into CC11. Neither renderer owns the arithmetic.
 *
 * ## Two parts are refused as targets
 *
 * **The kit itself**, because a kick keyed off its own bus is a compressor with
 * its output in its own sidechain, which oscillates rather than pumps.
 * `Effects.duck` says so and this is where it is enforced.
 *
 * **A sung part**, because the sung path emits five patterns — a body, three
 * formant bands and a consonant burst — that are one voice only by virtue of
 * summing at the output, and putting them on a bus would be four `.orbit()`
 * calls to say one thing. The musical answer agrees with the mechanical one and
 * is the reason it is not worth building: in this repertoire the vocal is what
 * the duck makes room *for*. A record that ducks its own singer under its own
 * kick has the compressor patched backwards.
 */
function duckPlan(song: Song): {
  targets: Map<Track, { depth: string; attack: string }>;
  controls: (orbits: Map<Track, number>) => string[];
} {
  const targets = new Map<Track, { depth: string; attack: string }>();
  const empty = { targets, controls: () => [] };
  /**
   * No kick, no duck, and no silent success. A style whose table has no `bd` in
   * it — or a bank with no kick to substitute — has nothing to key the
   * compressor off, and the honest result is a song with no sidechain in it
   * rather than one where the field was read and did nothing. `npm run check`
   * counts the parts that do duck for exactly this reason.
   */
  if (!kickOnsets(song.drums).length) return empty;
  if (!resolveDrumSample(song.drums.bank, 'bd')) return empty;

  for (const track of song.tracks) {
    const depth = track.effects?.duck;
    if (!depth || track.voice) continue;
    targets.set(track, {
      depth: ((1 - duckFloor(depth)) ** 2).toFixed(3),
      // Seconds, because `duckattack` is in seconds, from beats, because the IR
      // is. `meta.bpm` and not the tempo map, for `pitchSlide`'s reason: the
      // audition is flat by construction, so a recovery written against a tempo
      // nothing plays at would be the wrong length of hole.
      attack: ((track.effects?.duckBeats ?? DUCK_BEATS) * 60 / song.meta.bpm).toFixed(3),
    });
  }
  if (!targets.size) return empty;

  /**
   * The controls, built from the buses that were actually handed out.
   *
   * A function of the emitted orbits rather than of the plan, because the two
   * can differ: `renderStrudel` drops a part whose notes all fall outside the
   * song's bars, and a duck aimed at a part that was dropped is a `duckorbit`
   * pointing at an orbit nothing created. superdough logs that and carries on,
   * so the symptom would be a record that simply does not pump — which is
   * exactly the class of silent failure this whole feature had to be checked
   * for. Reading the map back means the ducker can only ever name buses that
   * exist.
   */
  return {
    targets,
    controls: (orbits) => {
      const live = [...orbits.keys()];
      if (!live.length) return [];
      /**
       * One value or a `:` list, which is superdough's own form for addressing
       * several orbits from one ducker — and it is a real list rather than a
       * string it splits later. The `:` is mini-notation's `op_tail`, which
       * folds its operand into an **array** (`@strudel/mini/mini.mjs`), and
       * `SuperdoughAudioController.duck` opens with `[targetOrbits].flat()` and
       * indexes the depth and attack lists alongside it. So `duckorbit("2:3")`
       * with `duckdepth("0.7:0.5")` is two buses at two depths from one kick,
       * which is two compressors and is what a desk would have.
       *
       * The single case is written as a bare number rather than as a
       * one-element list so that the commonest song emits code a reader
       * recognises, and so that it does not depend on the transpiler turning a
       * string into mini-notation to mean anything at all.
       */
      const list = (xs: string[]) => (xs.length === 1 ? xs[0]! : `\`${xs.join(':')}\``);
      return [
        `    .duckorbit(${list(live.map((t) => String(orbits.get(t))))})`,
        `    .duckdepth(${list(live.map((t) => targets.get(t)!.depth))})`,
        `    .duckonset(${DUCK_ONSET_SECONDS})`
        + `.duckattack(${list(live.map((t) => targets.get(t)!.attack))})`,
      ];
    },
  };
}

/**
 * Per-note velocity as a gain grid, or undefined when the part is flat.
 *
 * Strudel's mini-notation has no inline velocity, which is why dynamics used to
 * stop at the track level here and survive only in the MIDI. That was tolerable
 * while the generator had no dynamics worth carrying; now that a chorus is
 * measurably louder than the bridge before it, an audition tool that flattens
 * the difference is auditioning the wrong thing.
 *
 * The grid is laid on the same slots as the notes and holds its value with `_`
 * between onsets, so it costs roughly what the note grid costs and stays in
 * step with it. Velocity is folded into the track's own level here rather than
 * multiplied at playback, so the two paths cannot drift apart.
 */
function dynamicGrid(
  track: Track,
  totalBars: number,
  slotsPerBar: number,
  level: (note: NoteEvent) => number,
): string[][] | undefined {
  const velocities = track.notes.map((n) => n.velocity);
  if (velocities.length < 2) return undefined;
  const lo = Math.min(...velocities);
  const hi = Math.max(...velocities);
  /**
   * Two reasons to print a grid, and the second is not dynamics at all: a line
   * that crosses one of its font's zone boundaries changes level without
   * changing how hard it is played, and a single `.gain()` cannot say so. See
   * `REGISTER_LEVEL` in `render/source-levels.ts`.
   */
  const trims = track.notes.map(level);
  const trimSpread = Math.max(...trims) / Math.min(...trims);
  // Under half a dB there is nothing to hear and nothing worth printing.
  if (hi - lo < 0.06 && trimSpread < 1.06) return undefined;

  // The source trim rides along, so the two branches of the `.gain()` call
  // above cannot come to disagree about how loud this font is.
  return buildValueGrid(track.notes, totalBars, slotsPerBar,
    (n) => (track.gain * n.velocity * level(n)).toFixed(3));
}

/**
 * Why this line of the kit does not say what it was asked for, if it does not.
 *
 * Two different things get named, and a reader auditioning a genre needs both:
 * a substitution is a machine coming up short, and a rack is a second player
 * arriving — one of them is a compromise and the other is the point.
 */
function drumNote(bank: string, voice: DrumVoice, played: DrumSample): string {
  const swap = played.voice === voice ? '' : ` (as ${played.voice})`;
  if (played.bank === undefined) return `${swap} — ${played.sample}:${played.n}`;
  return played.voice === voice ? '' : ` (as ${played.voice}: ${bank} has no ${voice})`;
}

/** One stroke, placed in its bar. The drum equivalent of a `NoteEvent` onset. */
interface DrumHit {
  slot: number;
  velocity: number;
  /** How many even strokes fill the slot. 1 is the ordinary one. See `DrumEvent.roll`. */
  roll: number;
  /**
   * Beats between the slot this stroke was filed under and where it actually
   * falls. Signed, and never more than half a slot because `slotOf` rounds. See
   * `timingNudge` for why this is a control rather than a finer grid — a swung
   * ride and a dragged backbeat are the drummer's half of that entry.
   */
  nudge: number;
}

/**
 * Per-stroke velocity as a gain grid, or undefined when the part is flat.
 *
 * `dynamicGrid`'s twin, and it exists for the same reason: mini-notation has no
 * inline velocity, so the only way to say that one hit is harder than the next
 * is a second pattern on the same slots.
 *
 * It arrives late. Notes have carried their velocity here since dynamics were
 * worth carrying, but drums were emitted with a single constant `.gain()` and
 * the `velocity` the generator computes for every stroke — `accentOf` over the
 * metre, times the section's intensity, times a little humanising — was read
 * only by the MIDI renderer and dropped on the floor by this one. So the two
 * outputs disagreed about the one thing a kit is mostly made of, and the
 * audition was the one that was wrong.
 *
 * What that flattening sounds like is worth naming, because it was mistaken for
 * a mix fault more than once. `accentOf` returns 1 on the downbeat, 0.85 on a
 * beat and 0.68 elsewhere — so an unaccented render plays every offbeat stroke
 * 3.3 dB louder than it was written. On a kick that is barely audible, because
 * a kick lands on the strong slots anyway. On a ride keeping eighths through a
 * comp it is the whole difference between a cymbal being played and a cymbal
 * being triggered, and the ear reads the second one as *too loud* however far
 * the fader comes down — because what is wrong with it is not its level.
 *
 * **This makes the kit quieter, and that is the point.** Every other layer has
 * been multiplying its level by a velocity below 1 while the drums multiplied
 * by nothing, which is a systematic couple of dB in the kit's favour on every
 * song in the catalogue. Removing it moves the balance; `mix.drums` is where to
 * put it back if a genre now wants it, and that is a taste decision belonging in
 * a genre table rather than a silent unity here.
 */
function drumDynamics(
  bars: DrumHit[][],
  slotsPerBar: number,
  gain: number,
): string[][] | undefined {
  const velocities = bars.flat().map((h) => h.velocity);
  if (velocities.length < 2) return undefined;
  // The same half-decibel floor the melodic grid uses: a machine kit that plays
  // every stroke alike should still print one number.
  if (Math.max(...velocities) - Math.min(...velocities) < 0.06) return undefined;

  // Two strokes on one slot sound as one stroke, and it is the harder of them
  // that was asked for — the sample grid collapses them silently because there
  // the duplicates are the same string, and here they are not.
  const onsets = bars.map((hits) => {
    const row = new Map<number, number>();
    for (const h of hits) row.set(h.slot, Math.max(row.get(h.slot) ?? 0, h.velocity));
    return row;
  });

  // Whatever the part opens on also fills the bars before it starts, so the
  // held value is never the placeholder — same rule as `buildValueGrid`.
  let current = bars.flat()[0]!.velocity;
  return onsets.map((row) => Array.from({ length: slotsPerBar }, (_unused, slot) => {
    const found = row.get(slot);
    if (found !== undefined) current = found;
    // Slot 0 restates rather than extends: each bar is its own group, and a `_`
    // at the head of one has nothing inside it to hold.
    return found !== undefined || slot === 0 ? (gain * current).toFixed(3) : '_';
  }));
}

/**
 * Where each stroke actually falls, or undefined when the voice is on the grid.
 *
 * `timingNudge`'s drum half, and the half that carries the swing: the ride is
 * the instrument stating the feel, and a swung ride flattened to a dotted eighth
 * is a different genre. Same argument, same mechanism, and the same early return
 * so a machine kit programmed on the grid prints no second pattern.
 *
 * **The later stroke wins a shared slot**, where `drumDynamics` takes the louder
 * and the sample grid takes either. None of the three is arbitrary: two strokes
 * on one slot sound as one, so the level asked for is the harder, the sample is
 * whichever they agree on, and the placement is the one that is still moving —
 * a fill landing on a pattern's own sixteenth is the fill's timing, because the
 * fill is the gesture and the pattern is the floor under it.
 */
function drumNudge(
  bars: DrumHit[][],
  slotsPerBar: number,
  bpm: number,
): string[][] | undefined {
  if (!bars.flat().some((h) => Math.abs(h.nudge) > 0.05 / SLOTS_PER_BEAT)) return undefined;

  const seconds = 60 / bpm;
  const onsets = bars.map((hits) => {
    const row = new Map<number, number>();
    for (const h of hits) row.set(h.slot, h.nudge);
    return row;
  });

  // Whatever the part opens on also fills the bars before it starts, so the held
  // value is never the placeholder — same rule as `buildValueGrid`.
  let current = bars.flat()[0]!.nudge;
  return onsets.map((row) => Array.from({ length: slotsPerBar }, (_unused, slot) => {
    const found = row.get(slot);
    if (found !== undefined) current = found;
    // Slot 0 restates rather than extends: each bar is its own group, and a `_`
    // at the head of one has nothing inside it to hold.
    return found !== undefined || slot === 0 ? nudgeToken(current, seconds) : '_';
  }));
}


/**
 * Per-note brightness as a cutoff pattern, or undefined when the part has none.
 *
 * The argument to `.lpf()`, already formatted — a grid where the sweep moves,
 * and a plain number where it does not, so a part whose brightness never
 * changes costs no more output than one that has no brightness at all.
 *
 * `brightness` stands to `effects.lowpass` exactly as `velocity` stands to
 * `gain`: the track says where this instrument's tone sits in its decade and
 * the note says where in that range this moment sits. A track with no `lowpass`
 * therefore has nothing to sweep and is left alone — a brightness with no
 * cutoff to multiply is not a darker note, it is an underspecified one.
 *
 * The sung path never reaches here: it returns before the effect chain and
 * spends its own `.lpf()` on the first formant, which is the body of the voice
 * rather than a mix decision.
 */
function filterSweep(
  track: Track,
  totalBars: number,
  slotsPerBar: number,
): string | undefined {
  const cutoff = track.effects?.lowpass;
  if (cutoff === undefined) return undefined;
  if (!track.notes.some((n) => n.brightness !== undefined)) return undefined;

  const hzOf = (n: NoteEvent) => String(sweptCutoff(cutoff, n.brightness));
  // Asked in the domain that gets printed: if every note rounds to the same
  // hertz there is no sweep, whatever the underlying numbers did. A note with
  // no brightness is fully open, so this also collapses back to exactly the
  // static `.lpf()` `effectChain` would have emitted.
  const distinct = new Set(track.notes.map(hzOf));
  const [only] = distinct;
  if (distinct.size === 1) return only!;

  return `\`${formatGrid(buildValueGrid(track.notes, totalBars, slotsPerBar, hzOf))}\``;
}

/**
 * A part whose notes travel, as a pitch envelope patterned on the note slots.
 *
 * `NoteEvent.bend` is the first thing in the IR that makes a pitch a function of
 * time — `docs/engine-gaps.md` §3.16, five reports across three genres — and the
 * question this file had to answer was whether the audition could play it at all.
 * The tempo ramp's answer was no, and it says so in a banner. This one is yes,
 * and the difference is worth writing down because it was established by reading
 * the installed packages rather than by assuming, and assuming would have been
 * wrong in *both* directions.
 *
 * ## What Strudel does not have
 *
 * **`slide` is not a slide.** `@strudel/core/controls.mjs` registers one, which
 * is exactly the kind of thing that ends up in a renderer on the strength of its
 * name, and the line above it reads `// TODO: slide param for certain synths`
 * with `portamento` commented out beside it. Nothing in superdough reads it: the
 * only `slide` in that package is a variable inside `zzfx.mjs`, the toy synth,
 * which no sound this renderer emits goes anywhere near. An emitted `.slide()`
 * would have been a control the scheduler carries, no engine consumes, and no
 * error reports — a silent no-op, which is the failure mode this project spends
 * whole docstrings avoiding.
 *
 * ## What it does have, and why a soundfont can use it
 *
 * The **pitch envelope**. `@strudel/soundfonts/fontloader.mjs` hands its buffer
 * source's `detune` to superdough's `getPitchEnvelope`, so a GM patch gets one on
 * the same terms a synthesised voice does — the same fact `effectChain` relies on
 * for `Effects.glide`, in the other anchoring. The algebra in
 * `superdough/helpers.mjs` is four lines and all of it matters:
 *
 *     cents = penv * 100
 *     min   = -cents * panchor          // where the pitch starts
 *     max   =  cents * (1 - panchor)    // where the attack lands
 *
 * `panchor` defaults to `psustain`, which defaults to 1, giving `min = -cents`
 * and `max = 0`: the pitch arrives *at* the written note from below. That is a
 * scoop, it is what `Effects.glide` is, and it is the wrong anchoring here —
 * a bass note that starts a fifth flat and corrects itself is not a g-funk slide,
 * it is an out-of-tune bass.
 *
 * **`panchor(0)` is the whole trick**: `min` becomes 0 and `max` becomes the
 * written `penv`, so the note starts dead on its own pitch and travels the
 * signed distance from there. `psustain` is left at 1 so the sustain level *is*
 * the top of the attack and the note holds where it arrived rather than sliding
 * back. `pcurve` is left at its linear default, which is right twice over: linear
 * in cents is even in musical pitch, and it is what a MIDI bend is too, so the
 * two renderers draw the same line rather than two curves that agree at the ends.
 *
 * That is also why `NoteBend` puts the travel at the note's onset. This envelope
 * has an attack, a decay, a sustain and a release and **no delay** — the first
 * sample of the note is the first sample of the movement, and there is no
 * arrangement of the four that holds a pitch and then leaves it. A bend written
 * at the far end of a note would play there in the .mid and here at the front,
 * which is a different contour rather than a missing one.
 *
 * ## The two things it gets wrong, stated rather than hidden
 *
 *  - **The tail snaps back.** `getParamADSR` finishes with a ramp to `min` over
 *    `prelease`, and `min` is the written pitch, so the release of a note that has
 *    just slid down an octave returns through it. It is inside the amp release,
 *    which for the patches that will use this is short, and the alternative is an
 *    anchoring that puts the *written* pitch at the end of the glide — which would
 *    mean the note's `midi`, the thing every check and the concert stage read, is
 *    not the pitch the note is struck at. Wrong in the IR beats wrong in the tail.
 *  - **It takes the part's `Effects.glide` with it.** One pitch envelope per
 *    event, so a part cannot both scoop onto every note and travel off one. The
 *    note wins, on `filterSweep`'s precedent and for the stronger version of its
 *    reason: a glide switch is a setting and a bend is material.
 *
 * Emitted only where the part actually travels, which is what let this ship
 * inert: on the day it landed no style declared a `BassHit.glide` and every song
 * in the catalogue came out byte for byte as it had. That is no longer the state
 * of the world and the sentence is kept only to explain the guard — hiphop's
 * `drill` and `gfunk` were the first authors, and a bass onset in one of those
 * two travels 42 % and 35 % of the time.
 *
 * **Five more styles have adopted it since**, which is the whole of §3.16's
 * report list arriving: dnb's `techstep`, `neurofunk` and `jumpup` and house's
 * `acid` and `speedgarage`. Measured over 60 songs each, the share of bass
 * onsets carrying a bend runs `techstep` 76 %, `neurofunk` 51 %, `jumpup` 23 %,
 * `acid` 13 %, `speedgarage` 12 % — a Reese really is mostly movement and a 303
 * really does slide on a minority of its steps. The other 382 styles still write
 * no bend and still take the early return.
 */
function pitchSlide(
  track: Track,
  totalBars: number,
  slotsPerBar: number,
  bpm: number,
): string[] {
  if (!track.notes.some((n) => n.bend)) return [];

  // Seconds, because that is what `pattack` is in, from beats, because that is
  // what the IR is in. `meta.bpm` and not the tempo map: the audition is flat by
  // construction — see the banner at the top of this file — so the number the
  // scheduler was given is the number these times have to be computed against,
  // or a glide on a ramping song would be written for a tempo nothing plays at.
  const seconds = 60 / bpm;
  // Clamped against the note here as well as in `render/midi.ts`, because a
  // later pass can shorten a note after the figure was written. See `NoteBend`.
  const travel = (n: NoteEvent) => Math.min(n.bend?.beats ?? 0, n.duration);

  const depth = buildValueGrid(track.notes, totalBars, slotsPerBar,
    (n) => (n.bend?.semitones ?? 0).toFixed(2));
  const time = buildValueGrid(track.notes, totalBars, slotsPerBar,
    (n) => (travel(n) * seconds).toFixed(3));

  /**
   * A note that does not travel writes `penv` 0, which reaches
   * `getPitchEnvelope` as `cents = 0` and therefore `min = max = 0` — an
   * envelope that schedules two automation points at the note's own pitch and
   * moves nothing. Cheaper than the alternative, which is a second pattern
   * saying which slots are exempt, and identical in sound.
   */
  return [
    `    .penv(\`${formatGrid(depth)}\`)`,
    `    .pattack(\`${formatGrid(time)}\`)`,
    `    .panchor(0)`,
  ];
}

/**
 * Where the note actually falls, for a notation that can only write sixteenths.
 *
 * **The grid is not the music, and until this existed the renderer thought it
 * was.** Every onset went through `slotOf`, which *rounds*, and whatever it
 * rounded away was gone. Measured across nineteen genres, 19 % of all onsets sit
 * off the sixteenth grid — so nearly a fifth of every song was being moved to
 * somewhere nobody wrote before it was played.
 *
 * The worst of it was swing, because swing is not a rounding error, it is the
 * genre. `applySwing` delays the second eighth of a beat by `swing / 2` and
 * bakes that into `NoteEvent.beat`; a medium-swing jazz song therefore writes its
 * offbeats at beat fraction 0.665, and `slotOf(0.665 * 4)` is slot 3, which is
 * 0.750. **Triplet swing came out as a dotted-eighth shuffle**, on all 903 swung
 * events of the song this was measured on, and 0.665 and 0.750 collapsed to the
 * same token so the notation could not even express the difference. §3.19 records
 * pop approximating 12/8 as `swing: 0.28` and rnb's `doowop` as `0.33`, so the
 * flattening reached those too — an approximation, itself approximated away.
 *
 * `npm run genres` passed throughout, because it asserts `meta.swing > 0.3` — a
 * number on the metadata object, which was always right. Nothing was reading the
 * output.
 *
 * ## Why this is a control and not a finer grid
 *
 * The obvious repair is to subdivide, and it is the wrong one. Those 19 % are
 * mostly *microtiming* — `Feel.push`, `laidback`, the drag on a backbeat — and
 * the commonest offsets measured are 0.20, 0.10 and 0.92 of a slot, which are
 * not subdivisions of anything. Writing them as notated tuplets would claim the
 * music divides the beat in ways it does not, and would multiply every grid in
 * the file to say it. **A performer's placement is not a smaller note value**, and
 * the notation should keep saying sixteenth while the playback says otherwise.
 *
 * `nudge` is exactly that: superdough reads it as `start(eventTime + nudge)` —
 * seconds, added at scheduling, with no effect on the pattern's structure. So the
 * grid stays legible, the parallel grids stay column-aligned, and the offset is
 * exact rather than rounded to any resolution at all.
 *
 * This leaves a clean division of labour with `DrumEvent.roll` and its melodic
 * twin: **subdivision says how many events share a slot, and nudge says when each
 * one happens.** A slot that is subdivided writes nudge 0 and lets the group place
 * its strokes, which is right because a roll is even by construction.
 *
 * Bounded by construction: `slotOf` rounds, so the correction is never more than
 * half a slot — an eighth of a beat, 49 ms at 153 BPM — and it is as often
 * negative as positive. Strudel schedules with lookahead, so pulling an event
 * that far earlier is still comfortably in the future when superdough sees it.
 */
function timingNudge(
  track: Track,
  totalBars: number,
  slotsPerBar: number,
  bpm: number,
  divided: ReadonlySet<number>,
  indent = '    ',
): string[] {
  const moved = (n: NoteEvent) => offGrid(n.beat) && !divided.has(slotOf(n.beat));
  if (!track.notes.some(moved)) return [];

  // Seconds, because that is what `nudge` is in, from beats, because that is what
  // the IR is in — and `meta.bpm` rather than the tempo map for `pitchSlide`'s
  // reason: the audition plays flat, so these offsets have to be computed against
  // the tempo the scheduler was actually given.
  const seconds = 60 / bpm;
  const grid = buildValueGrid(track.notes, totalBars, slotsPerBar,
    (n) => (moved(n) ? nudgeToken(n.beat - quantise(n.beat), seconds) : '0'));
  return [`${indent}.nudge(\`${formatGrid(grid)}\`)`];
}

/**
 * Far enough off the grid to be worth a correction.
 *
 * A twentieth of a slot is about 3 ms at 153 BPM, which is below anything a
 * listener resolves and below the scheduler's own jitter. The threshold is here
 * so that a part whose onsets are all exact takes the early return and prints no
 * grid at all — the same readability rule `dynamicGrid` and `filterSweep` apply.
 */
function offGrid(beat: number): boolean {
  return Math.abs(beat - quantise(beat)) > 0.05 / SLOTS_PER_BEAT;
}

/**
 * One nudge value, in seconds, as short as it can be written.
 *
 * A part carries this grid because *some* of its notes are off the grid, and the
 * rest of them still need a slot each saying they are not — so the commonest
 * token by far is zero, and writing that as `0.0000` costs five characters per
 * slot to say nothing. The audition is meant to be read as well as played; the
 * same argument `dynamicGrid` makes for not emitting a flat grid at all applies
 * inside one that has to exist.
 */
function nudgeToken(beats: number, seconds: number): string {
  const value = beats * seconds;
  // Below the threshold `offGrid` already called inaudible, so it rounds to a
  // bare zero rather than to four decimal places of one.
  if (Math.abs(value) < 5e-5) return '0';
  return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

/** A note grid, and which of its slots hold more than one stroke. */
interface NoteGrid {
  grid: string[][];
  /**
   * Absolute slot indices that were cut up. `timingNudge` writes zero for these:
   * the group already places its strokes, and a nudge on top would move all of
   * them together — which on a trill is the one thing that would be heard, since
   * every stroke after the first would arrive at the wrong time relative to it.
   */
  divided: Set<number>;
}

/**
 * Lay notes onto a per-bar sixteenth grid.
 *
 * Simultaneous notes become a mini-notation chord `[c3,e3,g3]`; sustained notes
 * fill later slots with `_`.
 *
 * ## A slot may also hold more than one stroke
 *
 * This is `docs/engine-gaps.md` §3.15's melodic half, and it arrives long after
 * the drum half — `DrumEvent.roll` closed that side with `[hh*3]`, and the reason
 * it could is that a kit's grid is one voice per pattern, so a subdivided slot is
 * one sample struck n times and needs no second opinion about pitch. A melodic
 * line's does: a trill is two *different* notes alternating, so the group has to
 * name each stroke rather than multiply one. `[c4 d4]` where `c4` stood, and
 * `[c4 d4 c4 d4]` for twice the rate.
 *
 * **Read off `NoteEvent.trill` rather than inferred from the note positions**, and
 * the difference matters. Inference was tried first and is wrong in two directions
 * at once, both caused by `slotOf` rounding: a stroke exactly half a slot along
 * rounds *up* and lands in the next slot instead of the one it was filling, and a
 * stroke half a slot early rounds up into its principal's slot where the only
 * position left to give it is a late one. A declaration has neither problem
 * because there is nothing to recover — the count and the neighbour are stated,
 * and this function does arithmetic rather than archaeology.
 *
 * The division stays even, which is what mini-notation does to a group and what a
 * trill is anyway. Uneven placement belongs to `nudge`, which is exact at any
 * offset and costs no notation. The two mechanisms divide the work cleanly —
 * subdivision says *how many* strokes share a slot, nudge says *when* a stroke
 * happens — and neither can express the other's half.
 */
function buildNoteGrid(
  notes: NoteEvent[],
  totalBars: number,
  slotsPerBar: number,
  spelling: 'sharp' | 'flat',
): NoteGrid {
  const grid: string[][] = Array.from({ length: totalBars }, () =>
    Array.from({ length: slotsPerBar }, () => '~'),
  );
  const totalSlots = totalBars * slotsPerBar;

  const onsets = new Map<number, string[]>();
  /**
   * Each bar is its own mini-notation group, so `_` cannot carry a note across
   * a barline — a group starting with `_` is a parse error. Notes that span a
   * barline are therefore re-articulated at the downbeat.
   */
  const reonsets = new Map<number, string[]>();
  const holds = new Set<number>();
  /** Slot → the alternation filling it, already written out. */
  const trilled = new Map<number, string>();

  const addTo = (map: Map<number, string[]>, slot: number, name: string) => {
    const arr = map.get(slot) ?? [];
    arr.push(name);
    map.set(slot, arr);
  };

  for (const n of notes) {
    const start = slotOf(n.beat);
    if (start < 0 || start >= totalSlots) continue;
    const name = midiToNoteName(n.midi, spelling);
    const end = Math.min(totalSlots, Math.max(start + 1, slotOf(n.beat + n.duration)));

    /**
     * A trill occupies every slot the note covers, including the first — so it
     * replaces the onset and the holds behind it rather than decorating them. A
     * note trilled for its whole length has no plain stroke anywhere in it, which
     * is what distinguishes this from a mordent written as three short notes.
     *
     * `strokes` is clamped rather than trusted, per `NoteTrill`: a count under two
     * is not an alternation, and the note falls through to the ordinary path. So is
     * the note's remaining length — a later pass may have cut it below the two
     * strokes it was written for, and `strokesOf` in `render/midi.ts` declines on
     * exactly this arithmetic so the two renderers strike the same notes.
     */
    const strokes = n.trill ? Math.round(n.trill.strokes) : 0;
    if (n.trill && strokes >= 2
      && Math.round(n.duration * SLOTS_PER_BEAT * strokes) >= 2) {
      const other = midiToNoteName(n.midi + n.trill.semitones, spelling);
      const group = `[${Array.from({ length: strokes },
        (_unused, i) => (i % 2 ? other : name)).join(' ')}]`;
      for (let s = start; s < end; s++) trilled.set(s, group);
      continue;
    }

    addTo(onsets, start, name);
    for (let s = start + 1; s < end; s++) {
      if (s % slotsPerBar === 0) addTo(reonsets, s, name);
      else holds.add(s);
    }
  }

  const put = (slot: number, names: string[]) => {
    const unique = [...new Set(names)];
    grid[Math.floor(slot / slotsPerBar)]![slot % slotsPerBar] =
      unique.length === 1 ? unique[0]! : `[${unique.join(',')}]`;
  };

  for (const [slot, names] of reonsets) put(slot, names);
  // Real onsets win over re-articulations at the same slot.
  for (const [slot, names] of onsets) put(slot, names);

  for (const slot of holds) {
    const bar = Math.floor(slot / slotsPerBar);
    const col = slot % slotsPerBar;
    if (grid[bar]![col] === '~') grid[bar]![col] = '_';
  }

  // Last, so a trill owns its slots outright: an ordinary note may legitimately
  // sustain into one — the tune underneath does not stop — and a `_` left on top
  // of a group stretches the group rather than holding a pitch.
  for (const [slot, group] of trilled) {
    grid[Math.floor(slot / slotsPerBar)]![slot % slotsPerBar] = group;
  }

  return { grid, divided: new Set(trilled.keys()) };
}

/**
 * Name the nth sung pattern is bound to above the stack.
 *
 * A function of the track's position and not one fixed name, because a style
 * with `harmony.on: 'vocal'` puts a second singer over the first and both tracks
 * carry a `Track.voice` — so a single name means two `const voice` declarations
 * at top level. That is not a wrong sound but a dead file: `SyntaxError:
 * Identifier 'voice' has already been declared`, thrown before a note plays, in
 * the `.strudel.js` the CLI writes, the code the web page offers for copy-paste
 * and the pattern mix-lab actually evaluates. Measured across the 16 styles that
 * declare it, 62 of 64 songs failed to parse.
 *
 * The first singer keeps the bare name, so the ordinary one-voice audition —
 * every other style, and the great majority of the output — reads exactly as it
 * did before.
 */
const voiceBinding = (index: number) => (index === 0 ? 'voice' : `voice${index + 1}`);


/**
 * The source and articulation of a sung line, bound to a name so the three
 * formant bands below can share one copy of the notes.
 *
 * Ordering matters to the reader, not to Strudel: the envelope, then the two
 * cues that do most of the work — vibrato and the scoop into the note.
 */
function voiceDefinition(
  track: Track, binding: string, noteGrid: string, totalBars: number, slotsPerBar: number,
  bpm: number, divided: ReadonlySet<number>,
): string[] {
  const v = track.voice!;
  const attacks = buildValueGrid(track.notes, totalBars, slotsPerBar,
    (n) => String(CONSONANTS[n.consonant ?? 'none'].attack));
  return [
    `// ${track.layer} — ${track.instrument}. The source carries the body; the`,
    '// vowel is the three formant bands stacked on top of it below.',
    `const ${binding} = note(\`${noteGrid}\`)`,
    `  .sound('${track.strudelSound}')`,
    // Attack is patterned, not fixed: it is half of what makes a syllable's
    // consonant. A stop arrives in 3 ms and a nasal leans in over 70, and that
    // difference alone is most of "ta" versus "ma".
    `  .attack(\`${formatGrid(attacks)}\`)`,
    `  .decay(${v.decay}).sustain(${v.sustain}).release(${v.release})`,
    ...(v.noise ? [`  .noise(${v.noise})`] : []),
    // No compressor here, though a syllabic line is exactly the kind of peaky
    // signal that wants one: 0.66 peak against 0.08 RMS is 18 dB of crest, and
    // raising gain on that clips before the average moves. Strudel's
    // `.compressor()` cannot help, because a Web Audio DynamicsCompressorNode
    // only attenuates and superdough adds no makeup gain after it — at 8:1 it
    // measured a 33 dB *drop*. The crest is reduced at the source instead, by
    // holding the envelope's sustain high, which raises the average without
    // touching the peak.
    `  .vib(${v.vibRate}).vibmod(${v.vibDepth})`,
    /**
     * The singer swings with the band. This is on the binding rather than on the
     * four patterns below it, because the body and the three formant bands are
     * all derived from it and a correction applied here reaches every one of
     * them — where four copies could drift apart by a rounding digit and smear
     * the vowel across its own onset. `consonantBurst` is the one that has to
     * repeat it, being a pattern of its own rather than a filter of this one.
     */
    ...timingNudge(track, totalBars, slotsPerBar, bpm, divided, '  '),
    // `panchor(1)` puts the written note at the *top* of the pitch envelope, so
    // the voice starts `scoop` semitones underneath and arrives at the note
    // rather than beginning on it.
    `  .penv(${v.scoop}).panchor(1).pattack(${v.scoopTime});`,
  ];
}

/**
 * The noise burst at the front of every stop and fricative.
 *
 * This is the other half of a consonant, and the half that carries furthest: a
 * click of high noise before the pitch arrives is what the ear hears as /t/,
 * and it sits at 3–6 kHz where hearing is most sensitive, so it cuts through an
 * arrangement that the voice itself has to fight. Syllables that begin on a
 * nasal, a liquid or a bare vowel produce no burst and simply rest here.
 *
 * Takes no binding name, unlike `voiceDefinition` and `voiceParts`: it is built
 * from the track's own notes rather than from the sung pattern, so it names
 * nothing and two singers' bursts cannot collide.
 */
function consonantBurst(
  track: Track, totalBars: number, slotsPerBar: number, bpm: number,
  divided: ReadonlySet<number>,
): string | undefined {
  const shapeOf = (n: NoteEvent) => CONSONANTS[n.consonant ?? 'none'];
  const voiced = track.notes.filter((n) => shapeOf(n).burstFreq > 0);
  if (!voiced.length) return undefined;

  const hits = buildOnsetGrid(track.notes, totalBars, slotsPerBar,
    (n) => (shapeOf(n).burstFreq > 0 ? 'white' : undefined));
  const freqs = buildValueGrid(voiced, totalBars, slotsPerBar,
    (n) => String(shapeOf(n).burstFreq));
  const decays = buildValueGrid(voiced, totalBars, slotsPerBar,
    (n) => String(shapeOf(n).burstDecay));

  return [
    '  // consonants — a noise transient at each stop and fricative onset',
    `  s(\`${formatGrid(hits)}\`)`,
    `    .bpf(\`${formatGrid(freqs)}\`).bandq(1.6)`,
    `    .attack(0.001).decay(\`${formatGrid(decays)}\`).sustain(0).release(0.01)`,
    `    .gain(${(track.gain * VOICE_MIX * track.voice!.burstGain).toFixed(3)})`,
    // A pattern of its own, so it does not inherit the binding's correction and
    // has to repeat it. A /t/ landing a sixteenth away from the vowel it opens is
    // not a consonant, it is a second event.
    ...timingNudge(track, totalBars, slotsPerBar, bpm, divided),
  ].join('\n');
}

/**
 * The voice: the sampled source at full level, plus three formant bands riding
 * on top to colour it toward each note's vowel.
 *
 * The body has to be there. Sending only the bands — which is what an earlier
 * version did — keeps three slices of the spectrum and discards everything
 * between them, and the result is thin and far too quiet, because a vocal tract
 * puts *peaks* on a full spectrum rather than deleting the troughs.
 *
 * The bands are also deliberately not Strudel's own `.vowel()`. That control is
 * built from the same formant data, but it assigns each formant's bandwidth in
 * Hz straight into the filter's Q — and Q is a ratio, not a width, so a
 * bandwidth of 80 Hz at 660 Hz becomes a slit about 8 Hz wide. On the sustained
 * noisy source its documentation demonstrates it on, that survives. On a
 * pitched one it does not: whether a note sounds depends on whether one of its
 * harmonics happens to land inside the slit. Measured across eight notes the
 * output swung 27 dB. Passing the proper Q — centre over bandwidth — brings
 * that to 9 dB, which is what lets the emphasis track the line evenly.
 */
function voiceParts(
  track: Track, binding: string, totalBars: number, slotsPerBar: number,
): string[] {
  // The band levels below are a balance between themselves; `VOICE_MIX` is what
  // turns that balance into a level against the rest of the arrangement.
  const gain = track.gain * VOICE_MIX;
  const v = track.voice!;

  // The unfiltered source. Every formant of a dark vowel sits below 1.5 kHz, so
  // a voice made only of formant peaks has essentially nothing in the band the
  // ear is most sensitive to — measured at 0.1% of its energy above 1.5 kHz,
  // against 17% for the melody it was supposed to be louder than. This band is
  // the harmonic series the peaks are supposed to be sitting *on*.
  const parts = [[
    '  // body — the raw harmonic series the formants ride on',
    `  ${binding}.lpf(${v.bodyLpf}).gain(${(gain * v.bodyGain).toFixed(3)})`,
  ].join('\n')];

  parts.push(...FORMANT_BANDWIDTHS.map((bandwidth, i) => {
    const grid = buildFormantGrid(track.notes, i, totalBars, slotsPerBar);
    // Q is dimensionless: centre over width. Rounded because nobody hears a
    // formant's bandwidth to three decimal places.
    const restQ = VOWEL_FORMANTS.a[i]! / bandwidth;
    const level = (gain * FORMANT_GAINS[i]!).toFixed(3);

    // The first formant is a *resonant lowpass*, not a bandpass. That one
    // choice is what gives the voice a chest: it passes everything below F1
    // and peaks there, where a bandpass would keep the peak and throw the
    // fundamental away. A bandpass-only version of this sounded thin and
    // disembodied, because a vowel is a full spectrum with peaks on it — not
    // three slices of one.
    if (i === 0) {
      return [
        `  // formant 1 — resonant lowpass at F1: the body of the voice.`,
        `  // ${bandwidth} Hz wide, Q ≈ ${restQ.toFixed(1)} on /a/`,
        `  ${binding}`,
        `    .lpf(\`${formatGrid(grid.freqs)}\`)`,
        `    .resonance(\`${formatGrid(grid.qs)}\`)`,
        `    .gain(${level})`,
      ].join('\n');
    }
    return [
      `  // formant ${i + 1} — ${bandwidth} Hz wide, Q ≈ ${restQ.toFixed(1)} on /a/`,
      `  ${binding}`,
      `    .bpf(\`${formatGrid(grid.freqs)}\`)`,
      `    .bandq(\`${formatGrid(grid.qs)}\`)`,
      `    .gain(${level})`,
    ].join('\n');
  }));
  return parts;
}

/**
 * Centre frequency and Q for one formant, laid out on the note grid.
 *
 * Both take their structure from the note pattern and only supply values, so a
 * rest here would leave a note unfiltered rather than silent — every slot
 * therefore carries the value still in effect and `~` never appears. A
 * mini-notation group also cannot open with `_`, so the first slot of every bar
 * restates its value even when nothing has changed.
 */
function buildFormantGrid(
  notes: NoteEvent[],
  index: number,
  totalBars: number,
  slotsPerBar: number,
): { freqs: string[][]; qs: string[][] } {
  const freqOf = (n: NoteEvent) => VOWEL_FORMANTS[n.vowel ?? 'a'][index]!;
  const grid = (valueOf: (n: NoteEvent) => string) =>
    buildValueGrid(notes, totalBars, slotsPerBar, valueOf);
  return {
    freqs: grid((n) => String(effectiveF1(n, index, freqOf(n)))),
    qs: grid((n) => (effectiveF1(n, index, freqOf(n)) / FORMANT_BANDWIDTHS[index]!).toFixed(1)),
  };
}

/**
 * Keep the first formant at or above the note's own fundamental.
 *
 * A resonant lowpass at F1 is what gives the voice its body, but a closed vowel
 * puts F1 at 270 Hz and this voice sings up past 490 — and a lowpass below the
 * fundamental passes nothing at all. The note simply vanishes, which showed up
 * as a line that dropped out on its highest and most exposed syllables.
 *
 * Nudging F1 up to meet F0 is not a workaround, it is what singers do. A soprano
 * cannot sing /i/ at the top of her range either; the jaw opens and the vowel
 * migrates toward /a/ whether she wants it or not, for exactly this reason.
 * Only F1 is affected — F2 and F3 sit far above any fundamental here.
 */
function effectiveF1(note: NoteEvent, index: number, tableValue: number): number {
  if (index !== 0) return tableValue;
  const f0 = 440 * 2 ** ((note.midi - 69) / 12);
  return Math.round(Math.max(tableValue, f0 * 1.15));
}

/**
 * Shared machinery for any per-note value pattern that shadows the notes.
 *
 * The pattern takes its structure from the note pattern and only supplies
 * values, so a rest here would leave a note unfiltered rather than silent —
 * every slot therefore carries the value still in effect and `~` never appears.
 * A mini-notation group also cannot open with `_`, so the first slot of every
 * bar restates its value even when nothing has changed.
 */
function buildValueGrid(
  notes: NoteEvent[],
  totalBars: number,
  slotsPerBar: number,
  valueOf: (note: NoteEvent) => string,
): string[][] {
  const totalSlots = totalBars * slotsPerBar;

  const onsets = new Map<number, NoteEvent>();
  for (const n of notes) {
    const slot = slotOf(n.beat);
    if (slot < 0 || slot >= totalSlots) continue;
    onsets.set(slot, n);
  }

  // Whatever the line opens on also fills the bars before it starts.
  let current = notes[0];
  for (let s = 0; s < totalSlots; s++) {
    const found = onsets.get(s);
    if (found) { current = found; break; }
  }
  if (!current) return Array.from({ length: totalBars }, () =>
    Array.from({ length: slotsPerBar }, () => '_'));

  const grid: string[][] = Array.from({ length: totalBars }, () =>
    Array.from({ length: slotsPerBar }, () => '_'),
  );
  for (let s = 0; s < totalSlots; s++) {
    const found = onsets.get(s);
    if (found) current = found;
    const bar = Math.floor(s / slotsPerBar);
    const col = s % slotsPerBar;
    grid[bar]![col] = found || col === 0 ? valueOf(current) : '_';
  }
  return grid;
}

/**
 * A grid that sounds only where `tokenOf` returns something, and rests
 * everywhere else — for patterns that trigger on some syllables and not others.
 */
function buildOnsetGrid(
  notes: NoteEvent[],
  totalBars: number,
  slotsPerBar: number,
  tokenOf: (note: NoteEvent) => string | undefined,
): string[][] {
  const totalSlots = totalBars * slotsPerBar;
  const grid: string[][] = Array.from({ length: totalBars }, () =>
    Array.from({ length: slotsPerBar }, () => '~'),
  );
  for (const n of notes) {
    const token = tokenOf(n);
    if (!token) continue;
    const slot = slotOf(n.beat);
    if (slot < 0 || slot >= totalSlots) continue;
    grid[Math.floor(slot / slotsPerBar)]![slot % slotsPerBar] = token;
  }
  return grid;
}

/**
 * `<[bar] [bar] ...>` — angle brackets step one bar per cycle.
 *
 * Written out once per bar, and a song is 72 to 208 of them. That is the whole
 * cost of playing one: **compiling the emitted code into a pattern is 0.5–1.9
 * seconds of blocked main thread**, of which the drum layer alone is 60–65%,
 * and every one of those milliseconds is spent parsing bars that are usually
 * the same bar. Not the transpile — that is 4–12 ms — the mini-notation parse,
 * because every slot of every bar of every grid becomes its own step.
 *
 * So identical neighbours are folded into `[bar]!n`, and a grid whose bars are
 * *all* the same drops the alternation entirely and is emitted as one bar. Both
 * are exactly equal to what they replace: `x!n` is `x` repeated n times in the
 * same sequence, and `<x>` is `x`, so the same hap falls in the same place with
 * the same value. Verified rather than assumed — every layer of every genre was
 * queried over its whole length before and after, hap for hap, and the streams
 * are identical. The parse gets 7–9.5× faster on the layer that dominates it:
 * jazz drums 3.5 s → 0.5 s, house drums 3.6 s → 0.4 s.
 *
 * A gain grid that never changes is the extreme case and a common one — 184
 * copies of the same fourteen slots become fourteen — and it is *why* the
 * emitted file was 240 KB for a house track.
 */
function formatGrid(bars: string[][]): string {
  const rows = bars.map((slots) => `[${slots.join(' ')}]`);
  // Nothing to alternate between. Also catches the empty grid, which has no
  // bars to say anything about and is silence.
  if (rows.every((row) => row === rows[0])) return rows[0] ?? '~';

  const runs: { row: string; n: number }[] = [];
  for (const row of rows) {
    const last = runs[runs.length - 1];
    if (last?.row === row) last.n += 1;
    else runs.push({ row, n: 1 });
  }
  const lines = runs.map(({ row, n }) => `  ${row}${n > 1 ? `!${n}` : ''}`);
  return `<\n${lines.join('\n')}\n>`;
}
