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

import { midiToNoteName, spellingFor } from '../core/pitch.js';
import type { DrumVoice, Effects, NoteEvent, Song, Track, Vowel } from '../core/types.js';
import {
  CONSONANTS, FORMANT_BANDWIDTHS, FORMANT_GAINS, VOWEL_FORMANTS,
} from '../style/vocals.js';

const SLOTS_PER_BEAT = 4;

export interface StrudelRenderOptions {
  /** Emit the `samples()` / soundfont preamble. Off when embedding in the demo page. */
  includePrebake?: boolean;
  /** Wrap in a `setcpm` + `stack(...)` block ready to paste into strudel.cc. */
  standalone?: boolean;
}

export function renderStrudel(song: Song, opts: StrudelRenderOptions = {}): string {
  const { meta } = song;
  const slotsPerBar = meta.beatsPerBar * SLOTS_PER_BEAT;
  const lines: string[] = [];

  lines.push(`// ${meta.title}`);
  lines.push(`// ${meta.styleLabel} · ${meta.eraLabel} · ${meta.keyLabel} · ${meta.bpm} BPM · mood: ${meta.mood}`);
  lines.push(`// seed: ${meta.seed}  —  regenerate this exact song with --seed ${meta.seed}`);
  lines.push(`// form: ${song.sections.map((s) => `${s.kind}${s.transpose ? `(+${s.transpose})` : ''}`).join(' → ')}`);
  lines.push('');

  if (opts.includePrebake) {
    lines.push(`await samples('${DRUM_SAMPLES_URL}');`);
    lines.push('');
  }

  // One cycle per bar: cycles-per-minute = beats-per-minute / beats-per-bar.
  lines.push(`setcpm(${(meta.bpm / meta.beatsPerBar).toFixed(4)});`);
  lines.push('');

  const parts: string[] = [];

  const spelling = spellingFor(meta.tonic, meta.mode);

  for (const track of song.tracks) {
    const grid = buildNoteGrid(track.notes, song.meta.totalBars, slotsPerBar, spelling);
    if (!grid.some((bar) => bar.some((slot) => slot !== '~'))) continue;

    // A sung track is bound to a name above the stack and then filtered three
    // times, so the note grid is written once rather than once per formant.
    if (track.voice) {
      lines.push(...voiceDefinition(track, formatGrid(grid), meta.totalBars, slotsPerBar));
      lines.push('');
      parts.push(...voiceParts(track, meta.totalBars, slotsPerBar));
      const burst = consonantBurst(track, meta.totalBars, slotsPerBar);
      if (burst) parts.push(burst);
      continue;
    }

    /**
     * Per-note dynamics, as a gain grid laid on the same sixteenth slots as the
     * notes. Only emitted when the part actually has dynamics to carry — a comp
     * that plays every chord at one level gains nothing from a second grid
     * saying so, and the audition output stays readable.
     */
    const dyn = dynamicGrid(track, meta.totalBars, slotsPerBar);
    parts.push([
      `  // ${track.layer} — ${track.instrument}`,
      `  note(\`${formatGrid(grid)}\`)`,
      `    .sound('${track.strudelSound}')`,
      dyn ? `    .gain(\`${formatGrid(dyn)}\`)` : `    .gain(${track.gain.toFixed(2)})`,
      ...effectChain(track.effects, song),
    ].join('\n'));
  }

  // Drums: one pattern per voice so the per-voice mix survives.
  const byVoice = new Map<DrumVoice, number[][]>();
  for (const e of song.drums.events) {
    const bar = Math.floor(e.beat / meta.beatsPerBar);
    const slot = Math.round((e.beat - bar * meta.beatsPerBar) * SLOTS_PER_BEAT);
    if (bar < 0 || bar >= meta.totalBars) continue;
    let grid = byVoice.get(e.voice);
    if (!grid) {
      grid = Array.from({ length: meta.totalBars }, () => [] as number[]);
      byVoice.set(e.voice, grid);
    }
    grid[bar]!.push(Math.min(slot, slotsPerBar - 1));
  }

  for (const [voice, grid] of byVoice) {
    const bars = grid.map((slots) => {
      const row: string[] = Array.from({ length: slotsPerBar }, () => '~');
      for (const s of slots) row[s] = voice;
      return row;
    });
    parts.push(
      [
        `  // drums — ${voice}`,
        `  s(\`${formatGrid(bars)}\`)`,
        `    .bank('${song.drums.bank}')`,
        `    .gain(${(song.drums.gain * (song.drums.voiceGains[voice] ?? 1)).toFixed(2)})`,
        ...effectChain(song.drums.effects, song),
      ].join('\n'),
    );
  }

  if (opts.standalone !== false) {
    lines.push('stack(');
    lines.push(parts.join(',\n\n'));
    lines.push(')');
  } else {
    lines.push(`stack(\n${parts.join(',\n\n')}\n)`);
  }

  return lines.join('\n') + '\n';
}

/** Drum-machine sample set used by the audition render (verified reachable). */
export const DRUM_SAMPLES_URL =
  'https://raw.githubusercontent.com/felixroos/dough-samples/main/tidal-drum-machines.json';

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
 */
function effectChain(fx: Effects | undefined, song: Song): string[] {
  if (!fx) return [];
  const { space, meta } = song;
  const out: string[] = [];
  if (fx.lowpass !== undefined) out.push(`    .lpf(${Math.round(fx.lowpass)})`);
  if (fx.highpass !== undefined) out.push(`    .hpf(${Math.round(fx.highpass)})`);
  if (fx.resonance !== undefined) out.push(`    .resonance(${(fx.resonance * 20).toFixed(1)})`);
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
): string[][] | undefined {
  const velocities = track.notes.map((n) => n.velocity);
  if (velocities.length < 2) return undefined;
  const lo = Math.min(...velocities);
  const hi = Math.max(...velocities);
  // Under a couple of dB there is nothing to hear and nothing worth printing.
  if (hi - lo < 0.06) return undefined;

  return buildValueGrid(track.notes, totalBars, slotsPerBar,
    (n) => (track.gain * n.velocity).toFixed(2));
}

/**
 * Lay notes onto a per-bar sixteenth grid.
 * Simultaneous notes become a mini-notation chord `[c3,e3,g3]`; sustained notes
 * fill later slots with `_`.
 */
function buildNoteGrid(
  notes: NoteEvent[],
  totalBars: number,
  slotsPerBar: number,
  spelling: 'sharp' | 'flat',
): string[][] {
  const grid: string[][] = Array.from({ length: totalBars }, () =>
    Array.from({ length: slotsPerBar }, () => '~'),
  );
  const totalSlots = totalBars * slotsPerBar;
  const slotOf = (beat: number) => Math.round(beat * SLOTS_PER_BEAT);

  const onsets = new Map<number, string[]>();
  /**
   * Each bar is its own mini-notation group, so `_` cannot carry a note across
   * a barline — a group starting with `_` is a parse error. Notes that span a
   * barline are therefore re-articulated at the downbeat.
   */
  const reonsets = new Map<number, string[]>();
  const holds = new Set<number>();

  const addTo = (map: Map<number, string[]>, slot: number, name: string) => {
    const arr = map.get(slot) ?? [];
    arr.push(name);
    map.set(slot, arr);
  };

  for (const n of notes) {
    const start = slotOf(n.beat);
    if (start < 0 || start >= totalSlots) continue;
    const name = midiToNoteName(n.midi, spelling);
    addTo(onsets, start, name);

    const end = Math.min(totalSlots, Math.max(start + 1, slotOf(n.beat + n.duration)));
    for (let s = start + 1; s < end; s++) {
      if (s % slotsPerBar === 0) addTo(reonsets, s, name);
      else holds.add(s);
    }
  }

  const write = (slot: number, names: string[]) => {
    const bar = Math.floor(slot / slotsPerBar);
    const col = slot % slotsPerBar;
    const unique = [...new Set(names)];
    grid[bar]![col] = unique.length === 1 ? unique[0]! : `[${unique.join(',')}]`;
  };

  for (const [slot, names] of reonsets) write(slot, names);
  // Real onsets win over re-articulations at the same slot.
  for (const [slot, names] of onsets) write(slot, names);

  for (const slot of holds) {
    const bar = Math.floor(slot / slotsPerBar);
    const col = slot % slotsPerBar;
    if (grid[bar]![col] === '~') grid[bar]![col] = '_';
  }

  return grid;
}

/** Name the sung pattern is bound to above the stack. */
const VOICE_BINDING = 'voice';


/**
 * The source and articulation of a sung line, bound to a name so the three
 * formant bands below can share one copy of the notes.
 *
 * Ordering matters to the reader, not to Strudel: the envelope, then the two
 * cues that do most of the work — vibrato and the scoop into the note.
 */
function voiceDefinition(
  track: Track, noteGrid: string, totalBars: number, slotsPerBar: number,
): string[] {
  const v = track.voice!;
  const attacks = buildValueGrid(track.notes, totalBars, slotsPerBar,
    (n) => String(CONSONANTS[n.consonant ?? 'none'].attack));
  return [
    `// ${track.layer} — ${track.instrument}. The source carries the body; the`,
    '// vowel is the three formant bands stacked on top of it below.',
    `const ${VOICE_BINDING} = note(\`${noteGrid}\`)`,
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
 */
function consonantBurst(
  track: Track, totalBars: number, slotsPerBar: number,
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
    `    .gain(${(track.gain * track.voice!.burstGain).toFixed(3)})`,
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
function voiceParts(track: Track, totalBars: number, slotsPerBar: number): string[] {
  const { gain } = track;
  const v = track.voice!;

  // The unfiltered source. Every formant of a dark vowel sits below 1.5 kHz, so
  // a voice made only of formant peaks has essentially nothing in the band the
  // ear is most sensitive to — measured at 0.1% of its energy above 1.5 kHz,
  // against 17% for the melody it was supposed to be louder than. This band is
  // the harmonic series the peaks are supposed to be sitting *on*.
  const parts = [[
    '  // body — the raw harmonic series the formants ride on',
    `  ${VOICE_BINDING}.lpf(${v.bodyLpf}).gain(${(gain * v.bodyGain).toFixed(3)})`,
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
        `  ${VOICE_BINDING}`,
        `    .lpf(\`${formatGrid(grid.freqs)}\`)`,
        `    .resonance(\`${formatGrid(grid.qs)}\`)`,
        `    .gain(${level})`,
      ].join('\n');
    }
    return [
      `  // formant ${i + 1} — ${bandwidth} Hz wide, Q ≈ ${restQ.toFixed(1)} on /a/`,
      `  ${VOICE_BINDING}`,
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
    const slot = Math.round(n.beat * SLOTS_PER_BEAT);
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
    const slot = Math.round(n.beat * SLOTS_PER_BEAT);
    if (slot < 0 || slot >= totalSlots) continue;
    grid[Math.floor(slot / slotsPerBar)]![slot % slotsPerBar] = token;
  }
  return grid;
}

/** `<[bar] [bar] ...>` — angle brackets step one bar per cycle. */
function formatGrid(bars: string[][]): string {
  const rows = bars.map((slots) => `  [${slots.join(' ')}]`);
  return `<\n${rows.join('\n')}\n>`;
}
