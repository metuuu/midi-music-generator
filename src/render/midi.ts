/**
 * Song IR -> Standard MIDI File (format 1). Zero dependencies.
 *
 * This is the delivery format for a native engine. From a .mid you can:
 *  - render to WAV/OGG offline with FluidSynth and any GM soundfont,
 *  - import into a DAW to sweeten before shipping,
 *  - or drive a runtime GM sampler in Unity/Godot directly.
 *
 * Per-note velocity is preserved here (unlike the Strudel audition render),
 * because this is the output that actually ships.
 */

import {
  songTempo, sweptCutoff, tempoLabel, timeSignature,
  type DrumVoice, type Effects, type Song, type Track,
} from '../core/types.js';

const PPQ = 480;

/**
 * Generic drum voices -> GM percussion key numbers (channel 10).
 *
 * Every voice gets a key of its own, because on channel 10 a key *is* the
 * instrument and two voices sharing one are two parts a listener cannot tell
 * apart in the file that ships. That constraint is what decided the low hand
 * stroke below, and it is the only interesting decision in the table.
 */
const GM_DRUM_MAP: Record<DrumVoice, number> = {
  bd: 36,   // Bass Drum 1
  sd: 38,   // Acoustic Snare
  rim: 37,  // Side Stick
  hh: 42,   // Closed Hi-Hat
  oh: 46,   // Open Hi-Hat
  cp: 39,   // Hand Clap
  lt: 45,   // Low Tom
  mt: 47,   // Low-Mid Tom
  ht: 50,   // High Tom
  cr: 49,   // Crash Cymbal 1
  rd: 51,   // Ride Cymbal 1
  perc: 64, // Low Conga
  cb: 56,   // Cowbell
  sh: 82,   // Shaker — the closest GM voice to a brush
  tb: 54,   // Tambourine — GM has the real thing
  /**
   * The hand drum's three strokes, and the one place this table had to
   * compromise.
   *
   * GM's congas are already a stroke set rather than three drums: 62 is the
   * muted high conga and 63 the open high one, which is exactly the slap and
   * the ring of `hp` and `mp`, on the same drum, in the right order. Nothing
   * needed inventing for those two.
   *
   * 64, Low Conga, is the doum — and `perc` has held it since this project's
   * first commit. Moving `perc` would have been the tidier map and would also
   * have rewritten the drum track of every .mid this generator has ever
   * produced, so it stays where it is and the low stroke goes to 87 instead:
   * Open Surdo, the only other large hand-struck membrane General MIDI names,
   * and one of the six drums `lp` exists to serve. A surdo is a shade heavier
   * and slower than a darbuka, which is the wrong end of the trade in Cairo and
   * the right one in Rio; what matters more is that a pattern using both the
   * low stroke and the catch-all comes out of the file as two sounds.
   */
  lp: 87,   // Open Surdo
  mp: 63,   // Open High Conga
  hp: 62,   // Mute High Conga
};

interface MidiEvent {
  tick: number;
  /** Note-offs must sort before note-ons at the same tick. */
  order: number;
  bytes: number[];
}

export function renderMidi(song: Song): Uint8Array {
  const { meta } = song;
  const tracks: Uint8Array[] = [];

  // ---- Conductor track -------------------------------------------------
  const conductor: MidiEvent[] = [];
  /**
   * The tempo, as a stream of set-tempo events — **the one place a ramp
   * survives intact**.
   *
   * This used to be one event at tick 0 and it was the honest shape for a song
   * that held one tempo. It is also the reason `docs/engine-gaps.md` §1.1 called
   * the tempo the largest remaining blocker by blast radius: the tempo reaches
   * the IR, both renderers and the concert clock, and each of the four had a
   * different idea of what a tempo *is*.
   *
   * This consumer's idea is the one the IR was shaped around. A MIDI file
   * carries tempo as `set-tempo` meta events at ticks and the tempo is constant
   * between them, so a tempo map is not something this renderer *approximates* —
   * it is the same object, written in a different unit. `core/grid.ts` argues
   * the piecewise-constant choice at length and this is the half of the argument
   * that is a fact rather than a preference: a DAW that draws a smooth tempo
   * line exports a staircase, because a staircase is all the format has. Choosing
   * interpolation in the IR would have meant choosing a semantics the shipping
   * format has to sample, at a resolution nobody outside the renderer could see.
   *
   * So there is no resolution decision here at all, which is the sign it was
   * made in the right place. `generate/tempo.ts` emits a breakpoint per bar line
   * where the whole bpm moves, and every one of them becomes exactly one event
   * at exactly the tick it names. Round-tripping is why `TempoPoint.bpm` is an
   * integer: 113 goes out as 530973 µs and comes back as 113, where 113.4 comes
   * back as a number nobody typed.
   *
   * On the conductor track and nowhere else, which is what format 1 is for — a
   * set-tempo on an instrument track is legal to write and undefined to read,
   * and half the sequencers in the world ignore it.
   */
  for (const point of songTempo(meta)) {
    const usPerQuarter = Math.round(60_000_000 / point.bpm);
    conductor.push({
      tick: beatsToTicks(point.beat),
      order: 0,
      bytes: [0xff, 0x51, 0x03,
        (usPerQuarter >> 16) & 0xff, (usPerQuarter >> 8) & 0xff, usPerQuarter & 0xff],
    });
  }
  // Written as a notator would rather than as the engine counts. See `timeSignature`.
  const [numerator, denominator] = timeSignature(meta);
  conductor.push({ tick: 0, order: 0, bytes: [0xff, 0x58, 0x04, numerator, Math.log2(denominator), 24, 8] });
  conductor.push({ tick: 0, order: 0, bytes: [0xff, 0x03, ...textBytes(meta.title)] });
  // `tempoLabel` rather than `meta.bpm`, because this line is what a person
  // reads in a DAW's file info and "92 BPM" on a piece that ends at 138 is the
  // header lying about the track it is attached to. It is the exact string for
  // any song that holds its tempo, which is every song in the catalogue.
  conductor.push({ tick: 0, order: 0, bytes: [0xff, 0x01, ...textBytes(`${meta.styleLabel} · ${meta.eraLabel} · ${meta.keyLabel} · ${tempoLabel(meta)} BPM · seed ${meta.seed}`)] });
  tracks.push(buildTrack(conductor));

  // ---- Instrument tracks ----------------------------------------------
  // Channel 9 is reserved for percussion; skip it when assigning.
  let channel = 0;
  const nextChannel = () => {
    if (channel === 9) channel = 10;
    if (channel > 15) channel = 15;
    return channel++;
  };

  for (const track of song.tracks) {
    const ch = nextChannel();
    const events: MidiEvent[] = [];
    events.push({ tick: 0, order: 0, bytes: [0xff, 0x03, ...textBytes(`${track.layer} — ${track.instrument}`)] });
    events.push({ tick: 0, order: 0, bytes: [0xc0 | ch, track.gmProgram] });
    // Channel volume from the layer's mix gain.
    events.push({ tick: 0, order: 0, bytes: [0xb0 | ch, 7, clamp7(Math.round(track.gain * 127))] });
    for (const [cc, value] of controllersFor(track.effects)) {
      events.push({ tick: 0, order: 0, bytes: [0xb0 | ch, cc, value] });
    }
    for (const [tick, value] of brightnessSweep(track)) {
      events.push({ tick, order: 0, bytes: [0xb0 | ch, 74, value] });
    }

    for (const note of track.notes) {
      const on = beatsToTicks(note.beat);
      const off = Math.max(on + 1, beatsToTicks(note.beat + note.duration));
      const vel = clamp7(Math.round(note.velocity * 110) + 10);
      events.push({ tick: on, order: 1, bytes: [0x90 | ch, clamp7(note.midi), vel] });
      events.push({ tick: off, order: 0, bytes: [0x80 | ch, clamp7(note.midi), 0x40] });
    }
    tracks.push(buildTrack(events));
  }

  // ---- Drums (channel 10) ---------------------------------------------
  if (song.drums.events.length) {
    const events: MidiEvent[] = [];
    events.push({ tick: 0, order: 0, bytes: [0xff, 0x03, ...textBytes(`drums — ${song.drums.bank}`)] });
    events.push({ tick: 0, order: 0, bytes: [0xb9, 7, clamp7(Math.round(song.drums.gain * 127))] });
    // `voiceEffects` is not readable from here and cannot be. A controller
    // addresses a *channel*, the whole kit is on channel 10, and there is no
    // sixteenth of a channel to give the snare — so gated reverb on the snare
    // alone is not something a .mid can say, in the same way and for the same
    // reason that delay and drive are not. The Strudel render, which emits one
    // pattern per voice, carries it; this file emits the kit's own effects and
    // the audition is where that production sound lives.
    for (const [cc, value] of controllersFor(song.drums.effects)) {
      events.push({ tick: 0, order: 0, bytes: [0xb9, cc, value] });
    }
    for (const e of song.drums.events) {
      const on = beatsToTicks(e.beat);
      const key = GM_DRUM_MAP[e.voice];
      // The whole kit shares one channel, so per-voice balance has nowhere to
      // go but the velocity. The Strudel render has always applied this; doing
      // it here too is what stops the audition and the shipping file
      // disagreeing about how loud the hats are.
      const vel = clamp7(Math.round(e.velocity * (song.drums.voiceGains[e.voice] ?? 1) * 110) + 10);
      events.push({ tick: on, order: 1, bytes: [0x99, key, vel] });
      events.push({ tick: on + PPQ / 8, order: 0, bytes: [0x89, key, 0x40] });
    }
    tracks.push(buildTrack(events));
  }

  // ---- File ------------------------------------------------------------
  const header = new Uint8Array([
    0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6,
    0, 1,
    (tracks.length >> 8) & 0xff, tracks.length & 0xff,
    (PPQ >> 8) & 0xff, PPQ & 0xff,
  ]);

  const total = header.length + tracks.reduce((a, t) => a + t.length, 0);
  const out = new Uint8Array(total);
  out.set(header, 0);
  let offset = header.length;
  for (const t of tracks) {
    out.set(t, offset);
    offset += t.length;
  }
  return out;
}

/**
 * Effects as control-change messages, emitted once at tick 0.
 *
 * What survives the trip and what does not is worth being blunt about:
 *
 *  - **CC91 reverb send** is GM level 1. Every soundfont player honours it, so
 *    this is the one effect that genuinely ships.
 *  - **CC10 pan** is also GM1 and equally safe.
 *  - **CC74 brightness and CC71 resonance** are GM2/GS, not GM1. FluidSynth
 *    honours them; a strict GM1 device ignores them and you get an unfiltered
 *    patch — wrong, but not broken. They are also defined *relative* to the
 *    patch's own filter, with 64 meaning "as the patch has it", which is why
 *    the mapping below only ever darkens and never brightens: claiming to open
 *    a filter we did not close would change every patch differently.
 *  - **Delay, highpass, drive, crush and phaser have no GM controller at all**
 *    and are simply absent here. Inventing a CC for them would produce a .mid
 *    that plays back correctly on exactly the synth it was tested against — and
 *    the undefined controllers are not free real estate either, since a
 *    manufacturer is entitled to map them to anything at all. All five are
 *    marked **audition only** in the IR for this reason; the .mid is the dry
 *    performance, and a driven, bit-crushed, phased version of it is a mix that
 *    happens downstream of this file.
 */
function controllersFor(fx: Effects | undefined): [number, number][] {
  if (!fx) return [];
  const out: [number, number][] = [];
  if (fx.reverb !== undefined) out.push([91, clamp7(fx.reverb * 127)]);
  if (fx.pan !== undefined) out.push([10, clamp7(64 + fx.pan * 63)]);
  if (fx.lowpass !== undefined) out.push([74, brightnessCC(fx.lowpass)]);
  if (fx.resonance !== undefined) out.push([71, clamp7(64 + fx.resonance * 63)]);
  return out;
}

/**
 * A cutoff in Hz as a CC74 value.
 *
 * 8 kHz is treated as "open", i.e. the patch's own setting, and every octave
 * below that takes 16 off. 500 Hz bottoms out at 0.
 *
 * One function rather than two copies of the expression because the track's
 * opening setting and the per-note sweep have to sit on the same curve: if they
 * disagreed about where the track's own cutoff lands, the first swept note
 * would jump rather than move.
 */
function brightnessCC(hz: number): number {
  return clamp7(Math.min(64, 64 + 16 * Math.log2(hz / 8000)));
}


/**
 * The part's brightness as a stream of CC74 changes, one per onset that moves.
 *
 * `NoteEvent.brightness` is to `effects.lowpass` what velocity is to gain, and
 * velocity already survives this renderer — a filter sweep that stopped at the
 * audition would mean the shipping file is not the song. So it is emitted, and
 * emitted as controller changes, because there is nowhere else in a .mid to put
 * a continuous parameter.
 *
 * The docstring above records what makes this safe: CC74 is defined relative to
 * the patch's own filter, so this renderer only ever uses it to darken. Since
 * `brightness` is at most 1, the swept cutoff is at most the track's own — the
 * stream can never claim to open a filter it did not close. That holds by
 * construction rather than by a clamp, which is why there is no clamp.
 *
 * Only changes are emitted, seeded from the value `controllersFor` already put
 * at tick 0, so a part that dips once costs one controller and not one per
 * note. `order: 0` puts each change ahead of the note-on it belongs to; a
 * change landing after its own note-on would be heard on the note after it, and
 * the note it was written for would sound at the previous note's cutoff.
 */
function brightnessSweep(track: Track): [tick: number, value: number][] {
  const cutoff = track.effects?.lowpass;
  if (cutoff === undefined) return [];
  if (!track.notes.some((n) => n.brightness !== undefined)) return [];

  const out: [number, number][] = [];
  let last = brightnessCC(cutoff);
  for (const note of [...track.notes].sort((a, b) => a.beat - b.beat)) {
    const value = brightnessCC(sweptCutoff(cutoff, note.brightness));
    if (value === last) continue;
    last = value;
    out.push([beatsToTicks(note.beat), value]);
  }
  return out;
}

function beatsToTicks(beat: number): number {
  return Math.round(beat * PPQ);
}

function clamp7(v: number): number {
  return Math.max(0, Math.min(127, Math.round(v)));
}

function textBytes(s: string): number[] {
  const bytes = Array.from(new TextEncoder().encode(s));
  return [...writeVarLen(bytes.length), ...bytes];
}

function buildTrack(events: MidiEvent[]): Uint8Array {
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const body: number[] = [];
  let last = 0;
  for (const e of events) {
    body.push(...writeVarLen(e.tick - last), ...e.bytes);
    last = e.tick;
  }
  body.push(0x00, 0xff, 0x2f, 0x00); // end of track

  const out = new Uint8Array(8 + body.length);
  out.set([0x4d, 0x54, 0x72, 0x6b], 0);
  out[4] = (body.length >>> 24) & 0xff;
  out[5] = (body.length >>> 16) & 0xff;
  out[6] = (body.length >>> 8) & 0xff;
  out[7] = body.length & 0xff;
  out.set(body, 8);
  return out;
}

function writeVarLen(value: number): number[] {
  let v = Math.max(0, Math.round(value));
  const buffer: number[] = [v & 0x7f];
  v >>= 7;
  while (v > 0) {
    buffer.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return buffer;
}
