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

import type { DrumVoice, Song } from '../core/types.js';

const PPQ = 480;

/** Generic drum voices -> GM percussion key numbers (channel 10). */
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
  const usPerQuarter = Math.round(60_000_000 / meta.bpm);
  conductor.push({ tick: 0, order: 0, bytes: [0xff, 0x51, 0x03, (usPerQuarter >> 16) & 0xff, (usPerQuarter >> 8) & 0xff, usPerQuarter & 0xff] });
  conductor.push({ tick: 0, order: 0, bytes: [0xff, 0x58, 0x04, meta.beatsPerBar, Math.log2(meta.beatUnit), 24, 8] });
  conductor.push({ tick: 0, order: 0, bytes: [0xff, 0x03, ...textBytes(meta.title)] });
  conductor.push({ tick: 0, order: 0, bytes: [0xff, 0x01, ...textBytes(`${meta.styleLabel} · ${meta.eraLabel} · ${meta.keyLabel} · ${meta.bpm} BPM · seed ${meta.seed}`)] });
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
    for (const e of song.drums.events) {
      const on = beatsToTicks(e.beat);
      const key = GM_DRUM_MAP[e.voice];
      const vel = clamp7(Math.round(e.velocity * 110) + 10);
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
