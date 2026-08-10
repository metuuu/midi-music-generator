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
  DUCK_BEATS, DUCK_ONSET_SECONDS, duckDepthDb, kickOnsets,
  songTempo, sweptCutoff, tempoLabel, timeSignature,
  type DrumVoice, type Effects, type NoteEvent, type Song, type Track,
} from '../core/types.js';
import { SLOTS_PER_BEAT } from '../core/grid.js';
import type { Midi } from '../core/pitch.js';

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
  // any song that holds its tempo, which was every song in the catalogue when
  // this landed and is now every song but dnb's `breakcore` — the one style that
  // names a `tempoRamp`, which draws a real map on 44 of 200 songs and is the
  // only thing in the catalogue this line is doing any work for.
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
    for (const [tick, value] of duckStream(track, song)) {
      events.push({ tick, order: 0, bytes: [0xb0 | ch, 11, value] });
    }

    const bend = bendStream(track);
    if (bend) {
      /**
       * The bend range, as RPN 0, before anything bends.
       *
       * A device powers up at ±2 semitones and three of the five figures that
       * asked for this travel a fifth or an octave, so without these six
       * controllers a g-funk slide comes out as a fifth of the interval it was
       * written as — the right gesture at a quarter strength, which is a worse
       * failure than none because it sounds like a mix decision.
       *
       * Six messages and not four: `101/100` select the parameter, `6/38` are
       * its coarse and fine halves, and `101/100 = 127` **nulls the selection**
       * afterward so that a later data-entry — a DAW's, or another file's, after
       * a merge — cannot land on this parameter by inheritance. That is the one
       * part of the RPN protocol people leave out and it is the part that makes
       * the file safe to concatenate.
       */
      events.push({ tick: 0, order: 0, bytes: [0xb0 | ch, 101, 0] });
      events.push({ tick: 0, order: 0, bytes: [0xb0 | ch, 100, 0] });
      events.push({ tick: 0, order: 0, bytes: [0xb0 | ch, 6, bend.range] });
      events.push({ tick: 0, order: 0, bytes: [0xb0 | ch, 38, 0] });
      events.push({ tick: 0, order: 0, bytes: [0xb0 | ch, 101, 127] });
      events.push({ tick: 0, order: 0, bytes: [0xb0 | ch, 100, 127] });
      for (const [tick, value] of bend.points) {
        events.push({ tick, order: 0, bytes: [0xe0 | ch, value & 0x7f, (value >> 7) & 0x7f] });
      }
      /**
       * The one thing this file cannot say, said in the file rather than
       * swallowed.
       *
       * `render/strudel.ts` prints a banner when the audition cannot play a
       * tempo ramp, and `docs/engine-gaps.md` §6 calls that the first
       * shipping-only feature. This is the mirror image and the first
       * audition-only *contour*: a pitch bend addresses a channel, so if a part
       * sounds two notes while one of them is travelling, the .mid moves both.
       * The generator never writes that — `BassHit.glide` is the only author and
       * the bass is monophonic — so this marker is for a `Song` that arrived from
       * somewhere else, and a person opening the track in a DAW and hearing a
       * chord slide should find the reason on the track it happened on.
       */
      if (bend.smeared) {
        events.push({ tick: 0, order: 0, bytes: [0xff, 0x01, ...textBytes(
          'pitch bend is per channel — this part sounds chords while bending, so the whole voicing moves',
        )] });
      }
    }

    const struck = { ...track, notes: track.notes.flatMap(strokesOf) };
    const handOver = handOverTicks(struck);
    for (const note of struck.notes) {
      const key = clamp7(note.midi);
      const on = beatsToTicks(note.beat);
      const written = Math.max(on + 1, beatsToTicks(note.beat + note.duration));
      // Off the key before anything strikes it again. See `handOverTicks`.
      const off = Math.min(written, handOver.get(key)?.get(on) ?? written);
      const vel = clamp7(Math.round(note.velocity * 110) + 10);
      events.push({ tick: on, order: 1, bytes: [0x90 | ch, key, vel] });
      events.push({ tick: off, order: 0, bytes: [0x80 | ch, key, 0x40] });
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
    /**
     * A sixteenth, in ticks, and the number that makes `DrumEvent.roll` free
     * here.
     *
     * `PPQ` is 480, so a slot is **120 ticks** and 2, 3, 4, 5, 6, 8, 10 and 12
     * all divide it exactly. A trap triplet inside a sixteenth is 40 ticks, a
     * pair of 32nds is 60, a run of 64ths is 30 — integers, every one, with no
     * rounding and therefore no drift across a four-minute number. This is the
     * rare case where the shipping file is the *more* faithful of the two
     * renderers by construction rather than by effort: `beatsToTicks` rounds, and
     * on these divisions it has nothing to round.
     */
    const ROLL_SLOT_TICKS = PPQ / 4;
    for (const e of song.drums.events) {
      const on = beatsToTicks(e.beat);
      const key = GM_DRUM_MAP[e.voice];
      // The whole kit shares one channel, so per-voice balance has nowhere to
      // go but the velocity. The Strudel render has always applied this; doing
      // it here too is what stops the audition and the shipping file
      // disagreeing about how loud the hats are.
      const vel = clamp7(Math.round(e.velocity * (song.drums.voiceGains[e.voice] ?? 1) * 110) + 10);
      /**
       * The retrigger, and the one thing about it that is not free.
       *
       * The gate has always been a flat `PPQ / 8` — a 32nd, long enough to be a
       * note and short enough never to matter, because on channel 10 a key is a
       * one-shot and most devices ignore the off entirely. It matters the moment
       * one key is struck twice inside that window: a roll of three puts the
       * second stroke 40 ticks in and the first stroke's off at 60, so a reader
       * that honours note-offs receives on/on/off/off/on and kills the middle
       * stroke of the roll. Not a wrong sound — a **missing** one, in the file
       * this feature exists to make correct, and invisible to anything that
       * counts note-ons.
       *
       * So the gate is the spacing where the spacing is shorter, and the ordering
       * does the rest: `buildTrack` sorts an off before an on at the same tick, so
       * consecutive strokes hand the key over cleanly instead of overlapping by
       * one tick. At `roll: 1` this is `Math.min(60, 120)` and the file is
       * byte-identical to what it always was.
       *
       * Every stroke carries the same velocity, for the reason `DrumEvent.roll`
       * gives at length and the audition arrives at from the other end: a step
       * drawn into a machine has one level, and a taper written here would be a
       * fourth opinion about loudness in an engine that already has three.
       */
      const strokes = Math.max(1, Math.round(e.roll ?? 1));
      const step = ROLL_SLOT_TICKS / strokes;
      // Rounded, because a tick is an integer and the delta encoding has no
      // fractions in it. `Math.min(60, 120)` on an unrolled stroke is already
      // one, so no existing file moves a byte.
      const gate = Math.max(1, Math.round(Math.min(PPQ / 8, step)));
      for (let k = 0; k < strokes; k++) {
        const at = on + Math.round(k * step);
        events.push({ tick: at, order: 1, bytes: [0x99, key, vel] });
        events.push({ tick: at + gate, order: 0, bytes: [0x89, key, 0x40] });
      }
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
 *  - **The fields `Effects` marks audition only have no GM controller at all**
 *    and are simply absent here. Inventing a CC for them would produce a .mid
 *    that plays back correctly on exactly the synth it was tested against — and
 *    the undefined controllers are not free real estate either, since a
 *    manufacturer is entitled to map them to anything at all. Which fields those
 *    are is written on the fields themselves, in `core/types.ts`, and is not
 *    listed again here: a second copy of the membership in this docstring is a
 *    copy nothing updates, and it spent a long release saying five. The .mid is
 *    the dry performance, and a driven, bit-crushed, phased version of it is a
 *    mix that happens downstream of this file.
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

/**
 * How coarse the duck staircase is allowed to be, in decibels and in ticks.
 *
 * The same two-limit structure `BEND_STEP_CENTS` and `BEND_STEP_TICKS` use
 * below, and for the identical reason: a level ramp in a .mid is a staircase,
 * and a step is heard as a step when the jump is large *and* the dwell is long,
 * so bounding one alone bounds nothing.
 *
 *  - **A decibel and a half.** The just-noticeable level change is about 1 dB on
 *    an isolated tone and nearer 2 on programme material in a mix, and this is a
 *    step *inside a level that is already moving*, where it is further masked —
 *    the same allowance `BEND_STEP_CENTS` takes when it sets a quarter tone
 *    against a pitch JND ten times finer. It makes the stream as long as the
 *    duck is *deep* rather than as long as the note, which is `rampMap`'s
 *    argument transplanted a second time: a 6 dB duck is four steps down and
 *    four back, a 12 dB duck is eight. At 1 dB the .mid was half again as large
 *    and the recovery moved 25 times a second instead of 17, which is past the
 *    point where anything is listening.
 *  - **A thirty-second note**, which is the longest a single step may last, in a
 *    note value rather than in milliseconds so that it means the same thing at
 *    every tempo. It is what would catch a very slow shallow recovery that the
 *    decibel bound sleeps through; on everything the catalogue actually writes
 *    the decibel bound is the tighter of the two and this one never fires.
 *
 * The cost is real and is stated here rather than found later. Measured on a
 * 128-bar dance-pop record ducking two layers at four kicks to the bar: the
 * expression streams are the largest single thing in the file after the notes.
 * It is the same price `BEND_STEP_CENTS` charges for the same reason — a
 * continuous parameter in a format built for discrete ones — and a duck, unlike
 * a glide, is on every beat of every bar by definition. A record that pumps is
 * asking for an automation lane and should expect to be charged like one.
 */
const DUCK_STEP_DB = 1.5;
const DUCK_STEP_TICKS = PPQ / 8;

/**
 * The part's sidechain as a stream of CC11 changes.
 *
 * `docs/engine-gaps.md` §3.17 — *"`Effects` has no envelope follower, so
 * sidechain compression is unsayable"* — and this is the shipping half of the
 * answer. It came out the same way round as `NoteBend` rather than the same way
 * round as the tempo ramp, which was not obvious in advance and is the finding
 * worth stating: **both renderers play this contour, and neither has to lie
 * about it.** The audition has a real bus-level duck keyed off the kick's own
 * events (see `duckPlan` in `render/strudel.ts`); this file has an automation
 * lane. They are different mechanisms drawing the same line, which is the
 * standard §6 sets — *between a shape both renderers play identically and a
 * shape one of them lies about, take the first.*
 *
 * ## CC11, and why it is the right controller rather than merely a free one
 *
 * **Expression is GM level 1**, which puts it in the small set with reverb send
 * and pan rather than with CC74 and CC71 — every device that plays a .mid at
 * all implements it. That matters more here than it did for the filter sweep,
 * because a device that ignores a brightness stream plays a slightly wrong
 * *timbre* while a device that ignored this would play a record with its pulse
 * missing.
 *
 * **And it is defined as a percentage of channel volume, not as a replacement
 * for it.** CC7 already carries `track.gain` — the layer's mix level, written
 * once at tick 0 — and a duck written there would have to know that number and
 * multiply it, so a later change to the mix would silently change how deep the
 * record pumps. Expression rides underneath: this stream is *the duck and
 * nothing else*, and the fader stays the fader. That is the same separation
 * `dynamicGrid` keeps in the audition between the engineer's level and the
 * player's, one layer further down.
 *
 * ## The curve, which is superdough's and not this file's
 *
 * The audition ramps the bus with `exponentialRampToValueAtTime`, and an
 * exponential ramp in amplitude is a **straight line in decibels** — so the
 * contour is: fall from 0 dB to `−duck` over `DUCK_ONSET_SECONDS`, climb back
 * to 0 over `duckBeats`, hold. Sampled here at `DUCK_STEP_DB`, which makes this
 * a staircase on a line the other renderer draws continuously, exactly as the
 * pitch bend is a staircase on a line the pitch envelope draws continuously.
 *
 * A kick arriving before the recovery has finished **restarts the fall from
 * wherever the level had climbed to**, because that is what
 * `cancelScheduledValues` followed by a fresh ramp does in the audition. It is
 * not a detail: it is what makes a busy kick figure sound compressed rather
 * than sound like a sequence of separate dips.
 *
 * ## Decibels to a controller value, which is a decision and not a conversion
 *
 * MIDI's volume and expression controllers are not linear in amplitude. The MMA
 * curve, which is also SoundFont 2.04's default modulator for both CC7 and
 * CC11, is `attenuation dB = 40·log₁₀(cc/127)` — amplitude proportional to the
 * *square* of the controller. So a −9 dB duck is cc 76 and not cc 45, and
 * writing the naive linear value would produce a duck half as deep in dB as the
 * one the audition plays. FluidSynth implements the standard curve; a device
 * that uses a linear taper instead will duck by half the written depth, which
 * is a shallower version of the right gesture rather than a wrong one.
 *
 * ## One thing it does that the audition does not
 *
 * Expression scales the voice, so the signal *entering* the reverb ducks and
 * the tail already ringing in it does not. The audition ducks the orbit's
 * output, which is downstream of that orbit's reverb, so its tail breathes too.
 * A wetter part therefore pumps very slightly less here than it does in the
 * audition. It is a difference in how much of the hole the room fills in, not a
 * difference in where the hole is, and there is no message in the format that
 * would close it — the reverb is the synth's single global unit and CC91 is a
 * send level into it.
 */
function duckStream(track: Track, song: Song): [tick: number, value: number][] {
  /**
   * A sung part is never a duck target, and the guard is here as well as in the
   * audition rather than only where it is convenient. `duckPlan` refuses one
   * because the sung path emits five patterns that are one voice only by
   * summing, and because in this repertoire the vocal is what the duck makes
   * room *for*. This file has neither constraint — a voice is a channel like
   * any other here — so without this line a genre writing `vocal: { duck }`
   * would get a pumping singer in the `.mid` and a still one in the audition,
   * which is the exact disagreement both renderers are written to avoid.
   */
  if (!track.effects?.duck || track.voice) return [];
  const kicks = kickOnsets(song.drums);
  if (!kicks.length) return [];

  /**
   * The depth, through the shared clamp rather than read from the field.
   *
   * It looks like a detour and it is the thing that keeps the two renderers
   * equal at the extremes: `duckDepthDb` bounds at 40 dB, because that is where
   * MIDI's expression controller runs out and where superdough's own
   * `clamp(…, 0.01, …)` stops. Reading `effects.duck` raw here would mean a
   * table writing 60 got 43 dB in the file and 40 in the audition. The audition
   * reaches the same bound through `duckFloor`, which is the same function one
   * step further on, so neither renderer can be clamped differently from the
   * other because there is only one clamp.
   */
  const depth = duckDepthDb(track.effects.duck);
  const onsetBeats = (DUCK_ONSET_SECONDS * song.meta.bpm) / 60;
  const release = track.effects?.duckBeats ?? DUCK_BEATS;

  /**
   * `127 · 10^(dB/40)`, which is the MMA curve inverted. The multiplier is 127
   * rather than 128 so that 0 dB lands exactly on 127: a part that ducks must
   * return to precisely the level a part that does not ducks from, or every
   * pumping layer in the catalogue would ship a fraction of a decibel quiet.
   */
  const cc = (db: number): number => clamp7(127 * 10 ** (db / 40));

  const out: [number, number][] = [];
  let last = 127;
  const push = (beat: number, db: number) => {
    const value = cc(db);
    if (value === last) return;
    last = value;
    out.push([beatsToTicks(beat), value]);
  };
  /**
   * One straight line in decibels, sampled. Both limits apply and the finer of
   * the two wins — see `DUCK_STEP_DB`. The head of a segment is not emitted,
   * because it is the tail of the one before it.
   */
  const ramp = (from: number, to: number, at: number, beats: number) => {
    if (beats <= 0) return;
    const steps = Math.max(
      1,
      Math.ceil(Math.abs(to - from) / DUCK_STEP_DB),
      Math.ceil(beatsToTicks(beats) / DUCK_STEP_TICKS),
    );
    for (let k = 1; k <= steps; k++) push(at + (k * beats) / steps, from + ((to - from) * k) / steps);
  };

  /**
   * The two segments, per kick, each clipped at the next kick.
   *
   * Sampling the window as one run was the first version and it was wrong in a
   * way the emitted file showed and the code did not: the fall is a fiftieth of
   * the recovery's length, so a step size that reads the whole window steps
   * clean over it and the .mid drops 9 dB in a single message. That is the
   * click `DUCK_ONSET_SECONDS` exists to prevent, written by the renderer that
   * was supposed to be honouring it.
   */
  let level = 0;
  for (let i = 0; i < kicks.length; i++) {
    const start = kicks[i]!;
    const until = (kicks[i + 1] ?? Infinity) - start;
    const fall = Math.min(onsetBeats, until);
    // A kick landing inside the previous fall takes the level it had reached.
    const bottom = level + ((-depth - level) * fall) / onsetBeats;
    ramp(level, bottom, start, fall);
    level = bottom;
    const climb = Math.min(release, until - fall);
    if (climb <= 0) continue;
    const top = bottom + ((0 - bottom) * climb) / release;
    ramp(bottom, top, start + fall, climb);
    level = top;
  }
  // Back to unity at the end, so a file that stops mid-recovery does not leave
  // the channel attenuated for whatever plays after it.
  if (last !== 127) push(kicks[kicks.length - 1]! + onsetBeats + release, 0);
  return out;
}

/**
 * Where each note has to be off its key, because something else is about to
 * strike it: the next onset of the *same key on the same track*, per onset tick.
 *
 * A track owns a channel — see `nextChannel` — and on a channel a note is a key,
 * not a voice. So a part that sounds one pitch again before the previous one has
 * finished writes a note-on for a key that is already open, and then one
 * note-off for two note-ons. There is no reading of that a device can get right:
 * a synth that retriggers kills the first note and then releases the second on
 * the first one's off, so the second note comes out as long as the *overlap*
 * instead of as long as it was written; a synth that stacks voices leaves one of
 * them hanging until the second off, and which one is implementation-defined.
 * The first is the common behaviour and it is the dangerous one, because what it
 * produces is a **missing sound** rather than a wrong one — the note is in the
 * file, it is in every count of note-ons, and it is not in the air.
 *
 * ## It is not rare and it is not benign
 *
 * Measured over 228 songs in all nineteen genres — 1,198 pitched tracks, 420,755
 * notes: **2,206 same-pitch overlaps, 0.52 % of notes, in 63 of the 228 songs**.
 * Concentrated rather than spread, which is the shape of a mechanism and not of
 * noise: hiphop 834, rnb 732, dnb 297, funk 127, jazz 115, arabic 93, and eleven
 * genres at or near zero.
 *
 * What it costs is the number that settles it. The second note is truncated to
 * the overlap, and the **median overlap is a fifth of the note it truncates**:
 * 1,143 of the 2,206 come out under a quarter of their written length and 395
 * under a tenth. hiphop's `crunk` is the clearest case and the worst — an 808
 * pedal written 25 % longer than its own spacing, so every note of it after the
 * first is a note-on onto an open key, and a line written as a held pedal ships
 * as a stutter at 40 % duty. 464 of those in one genre's bass alone.
 *
 * ## The three innocent readings, checked
 *
 * All three were plausible and all three are small:
 *
 *  - **A drone re-articulating**, which `BassPattern.sustain` exists to merge
 *    away. It is not this: the genres built on that field are the ones with *no*
 *    overlaps — ambient 0, indian 0, classical 0, pop 0 — which is the merge
 *    working rather than missing. The overlaps are in loop-shaped material, which
 *    is what the genre ranking says on its face.
 *  - **A note overhanging a section edge**, cut by `generate/transition.ts` or
 *    `generate/drop.ts`. 159 of 2,206, 7 %.
 *  - **Two voices of a chord landing on one pitch**, which is a voicing question
 *    and not a rendering one. That is real, and it is 14 — and it is the one part
 *    of this a renderer genuinely cannot fix, because both note-ons are on the
 *    same tick and no ordering separates them. Those 14 are left alone.
 *
 * The remaining 2,192 are two mechanisms, and both are the music being right. A
 * chordal part (1,537) writes a voicing that rings past its own bar and then
 * states the next chord, which shares pitches with it — that overhang is what a
 * comper's hands do. A monophonic part (669 — bass, and a sung line) writes a
 * note longer than the gap to its own next onset, which is what legato is. The
 * lengths are not the fault. The file is.
 *
 * ## Why here rather than in `generate/`
 *
 * Because shortening the note would be the fix for a problem that does not
 * exist. A comp voicing that rings over the barline and an 808 that overlaps its
 * own next hit are both correct, and both are what `Feel.laidback` and
 * `Style.swing` and every duration pass wrote them as. Editing a length to suit
 * the wire format would be a second pass rewriting the first pass's bar, which
 * `docs/engine-gaps.md` §6 records as how the double-swing bug happened. The
 * note is fine. What is wrong is a file claiming a key is struck twice and
 * released once.
 *
 * ## This is what the audition already plays, which is what makes it safe
 *
 * `render/strudel.ts` never had this problem and never argued about it — it
 * falls out of `buildNoteGrid`. A note is laid on a sixteenth grid and its
 * sustain is written as `_` **only into slots that are still rests**, so a
 * re-onset of the same pitch takes its slot and the note before it simply stops
 * there. Read off the emitted source for `overlap-jazz-0`, whose comp organ
 * holds a chord for four beats under an anticipation 0.39 beats before it ends:
 *
 *     [bb3,d4,f4,ab4] _ _ _ _ _ _ _ _ _ _ _ _ _ [bb3,d4,eb4,g4] _
 *
 * — one bb3, then the next, with nothing overlapping. The .mid for the same bar
 * emits two note-ons for key 58 and one note-off between them. So the two
 * renderers already disagree about what is heard, and the audition is the one
 * that is right; §6's rule is *between a shape both renderers play identically
 * and a shape one of them lies about, take the first*, and this is the cheapest
 * possible version of taking the first — the audition needs no change at all.
 *
 * ## The mechanism, and why it costs nothing
 *
 * Clamped to *exactly* the next onset rather than a tick before it, because
 * `buildTrack` sorts an off before an on at the same tick: the key is handed
 * over cleanly with no silence in between, which is the same trick and the same
 * sentence as the drum gate in `renderMidi` above. That gate solved this
 * problem for one key struck twice inside a single `DrumEvent.roll`, and the
 * pitched half of it was never written; this is that argument generalised to the
 * case where the two strikes are two notes.
 *
 * Keyed by the **emitted** key rather than by `note.midi`, because `clamp7`
 * folds every pitch above 127 onto one key and two of those collide on the wire
 * whatever the IR thinks they are.
 *
 * One thing it deliberately does not reach. Channel 10 has the same hazard from
 * a different direction — two separate `DrumEvent`s on one voice inside the
 * gate, 693 of them across the same 228 songs — and the kit's hand-over is
 * per-event, so it does not see them. That is left as it is rather than folded
 * in here, because on channel 10 a key is a one-shot and most devices ignore the
 * off entirely, which is the whole reason the gate could be a flat 32nd for as
 * long as it was. It is written down so that the next person to read this
 * paragraph knows it is a decision and not an oversight.
 */
/**
 * A trilled note, written out as the notes that are actually struck.
 *
 * `NoteTrill` is a declaration — a neighbour and a count per sixteenth — and each
 * renderer expands it in whatever its own medium can hold. The audition nests a
 * mini-notation group inside the slot and lets the parser divide it; a .mid has no
 * grid to nest inside, so the strokes have to become note-ons, and this is where
 * that happens. Both do the same arithmetic, which is the point of stating the
 * gesture as a count rather than as a rate: `npm run check` compares the two
 * renderers and they have to agree on where every stroke went.
 *
 * Everything else about the note carries through untouched — velocity, hand,
 * layer — except `bend`, which is dropped: a pitch envelope belongs to one struck
 * note travelling somewhere, and a trill is the note being struck again. Nothing
 * writes both today, and if something does the trill is the louder statement.
 *
 * An untrilled note is returned as itself, in a one-element array, so the caller
 * is one `flatMap` and not a branch.
 */
function strokesOf(note: NoteEvent): NoteEvent[] {
  const trill = note.trill;
  if (!trill || trill.strokes < 2) return [note];

  const each = 1 / (SLOTS_PER_BEAT * Math.round(trill.strokes));
  /**
   * A note with no room left for two strokes is played plain.
   *
   * `ornament` only ever trills a note of a beat or more, so this is not about the
   * generator's taste — it is about what happens to the note *afterwards*.
   * `trimOverlaps` shortens a line's notes to clear its seams and both
   * `generate/transition.ts` and `generate/drop.ts` cut one at an edge, exactly as
   * `NoteBend.beats` warns they do. A trill that kept its stroke count through that
   * would run past the note it belongs to and strike the key again underneath
   * whatever came next — which `npm run genres` sees as a double note-on the IR
   * cannot account for, because in the IR a trill is still one note.
   *
   * `render/strudel.ts` declines on the same arithmetic, and it has to: the two
   * renderers are compared stroke for stroke.
   */
  const count = Math.round(note.duration / each);
  if (count < 2) return [note];

  return Array.from({ length: count }, (_unused, i) => {
    const { trill: _dropped, bend: _also, ...rest } = note;
    return {
      ...rest,
      beat: note.beat + i * each,
      // The last stroke takes whatever rounding left over, so the figure ends
      // where the note it replaced ended rather than a few ticks inside it.
      duration: i === count - 1 ? Math.max(each, note.beat + note.duration - (note.beat + i * each)) : each,
      midi: (i % 2 ? note.midi + trill.semitones : note.midi) as Midi,
    };
  });
}

function handOverTicks(track: Track): Map<number, Map<number, number>> {
  const onsets = new Map<number, Set<number>>();
  for (const note of track.notes) {
    const key = clamp7(note.midi);
    const ticks = onsets.get(key) ?? new Set<number>();
    ticks.add(beatsToTicks(note.beat));
    onsets.set(key, ticks);
  }

  const out = new Map<number, Map<number, number>>();
  for (const [key, ticks] of onsets) {
    const sorted = [...ticks].sort((a, b) => a - b);
    const next = new Map<number, number>();
    for (let i = 0; i + 1 < sorted.length; i++) next.set(sorted[i]!, sorted[i + 1]!);
    out.set(key, next);
  }
  return out;
}

/**
 * How coarse the bend staircase is allowed to be, in cents and in ticks.
 *
 * A pitch bend is an event at a tick and the value holds until the next one, so
 * a glide in a .mid is a staircase in exactly the sense `core/grid.ts` argues a
 * tempo map is — and the step size gets chosen here, once, for the same reason.
 *
 * **Two limits, and the tighter one wins**, because a single limit is wrong at
 * one end of the range whichever end it is written for. A step is heard as a
 * step when the jump is large *and* the dwell is long, so bounding one alone
 * bounds nothing:
 *
 *  - **A quarter tone**, which is the coarsest jump that is never audible as a
 *    jump inside a pitch that is already moving. It makes the stream as long as
 *    the gesture is *big* rather than as long as the note, which is `rampMap`'s
 *    argument transplanted: a tone is eight events and an octave is forty-eight.
 *    Alone it would be wrong for a slow one — a tone spread over two seconds is
 *    eight events a quarter-second apart, which is a chromatic run.
 *  - **A sixty-fourth note**, which is the longest a single step may last. In a
 *    note value rather than in milliseconds so that it means the same thing at
 *    every tempo, which is how `Space.delayBeats` and `delaysync` are written for
 *    the same reason. It is 20 ms at 180 BPM and 60 ms at 60 BPM, and it is what
 *    catches the slow small glide the cents bound sleeps through.
 *
 * Below both, the tick grid takes over: two points landing on one tick collapse
 * to one, so a very fast glide costs what the file's resolution allows and not a
 * byte more.
 *
 * These are not free and the cost is stated here rather than discovered later.
 * Measured, on a 208-bar house record whose bass glides on two hits of every bar,
 * one of them by an octave: **15,834 bend events, and the .mid goes from 45 kB to
 * 107 kB.** The glides cost more than the entire rest of the song. That is the
 * price of a continuous parameter in a format built for discrete ones — it is
 * what a DAW's own pitch automation exports too — and it is worth paying for the
 * one gesture five styles said they could not do without. A figure that glides on
 * *every* hit is a siren rather than a bass line and should expect to be charged
 * like one.
 */
const BEND_STEP_CENTS = 25;
const BEND_STEP_TICKS = PPQ / 16;

/**
 * The part's glides as a stream of pitch-bend events, and the range they need.
 *
 * `NoteEvent.bend` is the first thing in the IR that makes a note's pitch a
 * function of time — `docs/engine-gaps.md` §3.16, five reports across three
 * genres — and it is worth being as blunt here as the effects table above is
 * about what survives the trip, because the answer came out the opposite way
 * round from the tempo ramp:
 *
 *  - **Pitch bend is GM level 1.** Every device that plays a .mid at all
 *    implements it, at 14 bits, which is a resolution of a fifth of a cent even
 *    at the widest range this emits. Unlike delay, drive, crush and phaser, this
 *    is not something invented for one synth we tested against.
 *  - **RPN 0 is GM level 1 too**, which is the fact the whole feature rests on.
 *    A bend is a fraction of a *range*, the range is a per-channel setting, and
 *    the setting defaults to ±2 semitones — so a glide of a fifth is not
 *    expressible until the range is widened, and the message that widens it is
 *    in the same spec as the bend itself.
 *  - **A track has a channel to itself** — see `nextChannel` — which is what
 *    makes any of this safe. The bass bends and nothing else on the file moves.
 *
 * What a bend cannot do is address one note, and that limit is structural: it is
 * a channel message. On a monophonic part the distinction does not exist, and
 * every part that asked for this is monophonic. `smeared` reports the other case
 * rather than letting it happen quietly.
 *
 * ## The range, and why it is per part rather than fixed
 *
 * The smallest whole number of semitones that covers the widest glide in this
 * part. A fixed ±12 would have been simpler and is worse in the one situation
 * that matters: a device is entitled to clamp the RPN to its own maximum, and a
 * part claiming an octave when its music travels a tone is asking to be clamped
 * for nothing. Asking for exactly what is used means a device that cannot follow
 * mis-tunes by as little as the part allows, and always in the right direction —
 * the glide arrives short rather than arriving somewhere else.
 *
 * ## Returning to centre
 *
 * The channel is left bent after a glide, so every following note would sound at
 * the destination. It is returned to centre at the *onset of the next note*
 * rather than at the end of the glide's own note, so the release tail of a note
 * that has just slid down an octave is not snapped back up through it while it
 * is still ringing. `order: 0` puts that reset ahead of the note-on at the same
 * tick, which is the same ordering `brightnessSweep` relies on and for the same
 * reason: a controller landing after its own note-on is heard on the note after.
 */
function bendStream(
  track: Track,
): { range: number; points: [tick: number, value: number][]; smeared: boolean } | undefined {
  const notes = [...track.notes].sort((a, b) => a.beat - b.beat);
  if (!notes.some((n) => n.bend)) return undefined;

  const widest = notes.reduce((m, n) => Math.max(m, Math.abs(n.bend?.semitones ?? 0)), 0);
  /**
   * One to twenty-four. The floor is because a range of zero is a channel that
   * cannot bend at all and RPN coarse is a whole number of semitones; the
   * ceiling is where devices stop agreeing — two octaves is the widest value in
   * common use, and a glide larger than that is not a portamento, it is a tape
   * stop.
   */
  const range = Math.max(1, Math.min(24, Math.ceil(widest)));

  const points: [number, number][] = [];
  /**
   * The bend as a 14-bit value, 8192 at centre.
   *
   * Asymmetric on purpose: there are 8192 steps below centre and 8191 above it,
   * because 8192 is the centre of a 0..16383 range rather than its midpoint by
   * division. Scaling both directions by 8192 and clamping — which is what most
   * code does — puts full upward bend one step short of the top and is wrong by
   * a fifth of a cent, which nobody can hear; it is written correctly here
   * because the correct version is the same length as the wrong one.
   */
  const value = (semitones: number): number => {
    const span = semitones >= 0 ? 8191 : 8192;
    return 8192 + Math.round((semitones / range) * span);
  };

  let pending = 0;
  for (const note of notes) {
    const on = beatsToTicks(note.beat);
    if (pending !== 0) {
      points.push([on, 8192]);
      pending = 0;
    }
    if (!note.bend) continue;
    /**
     * Clamped against the note, which `NoteBend.beats` asks for and does not
     * get for free: `generate/transition.ts` truncates a part into a break and
     * `generate/drop.ts` cuts one at a drop's edge, both of them long after
     * `generateBass` wrote the figure. A ramp allowed to outlive its own note
     * would leave the channel mid-climb with nothing sounding, and the next
     * note would arrive somewhere between two pitches.
     */
    const travel = Math.min(note.bend.beats, note.duration);
    const end = Math.max(on, beatsToTicks(note.beat + travel));
    const cents = Math.abs(note.bend.semitones) * 100;
    const steps = Math.max(
      1,
      Math.ceil(cents / BEND_STEP_CENTS),
      Math.ceil((end - on) / BEND_STEP_TICKS),
    );
    let last = -1;
    for (let i = 1; i <= steps; i++) {
      const p = i / steps;
      const tick = Math.round(on + p * (end - on));
      // Collapsed onto the tick grid, except for the arrival: a glide that lands
      // a step short of where it was written to go has not arrived.
      if (tick === last && i < steps) continue;
      last = tick;
      points.push([tick, value(note.bend.semitones * p)]);
    }
    pending = note.bend.semitones;
  }
  if (pending !== 0) {
    const last = notes[notes.length - 1]!;
    points.push([Math.max(1, beatsToTicks(last.beat + last.duration)), 8192]);
  }

  /**
   * Whether the channel bend is telling the truth about the notes on it. See
   * the marker in `renderMidi`.
   */
  const smeared = notes.some((n, i) => n.bend && notes.some(
    (m, j) => j !== i && m.beat < n.beat + n.duration && n.beat < m.beat + m.duration,
  ));

  return { range, points, smeared };
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
