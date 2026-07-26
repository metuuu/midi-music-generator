/**
 * Syllables + a tune + a delivery -> a timed line the synth can play.
 *
 * This is where "talking" and "singing" stop being adjectives and become
 * scheduling. Three decisions happen here and they are the whole difference:
 *
 *  1. **Where the syllables land.** A sung line takes its rhythm from the tune,
 *     subdividing a long note into as many syllables as it can hold. A spoken
 *     one does not: speech runs at five to seven syllables a second regardless
 *     of what the band is doing, and quantising it to the beat grid is the
 *     fastest way to turn talking into rapping.
 *
 *  2. **Where the silence goes.** Not between syllables — between *words*. The
 *     syllables of one word run into each other continuously, divided by a dip
 *     in level and a consonant rather than by a gap. This is the single change
 *     that stops a synthetic voice sounding like a row of blips, and it is the
 *     reason the same machinery can now produce something that reads as a line
 *     of text rather than as a sequence of notes.
 *
 *  3. **Whether a syllable outlasts its note.** Melisma: one vowel gliding
 *     across two or three pitches with no re-attack. Speech never does it and
 *     singing does it constantly, so it is close to a definition of the
 *     difference. It goes on stressed syllables, because that is where a singer
 *     puts it — the emphasis is what earns the extra notes.
 *
 * Pitch comes out fractional on purpose. A recited line does not sit on
 * semitones, and rounding it to them is audible as a tune that nobody intended
 * to sing.
 */

import type { Rng } from '../core/rng.js';
import type { Consonant, Vowel } from '../core/types.js';
import type { Delivery } from '../style/delivery.js';
import type { VoiceSignature } from '../style/voices.js';
import { octaveFoldFor } from '../style/voices.js';
import type { PhoneticWord } from './phonetics.js';

/** A rest at least this long ends a phrase, and is therefore where breath goes. */
const PHRASE_GAP_BEATS = 1;

/** One note of the tune the voice is given to sing. */
export interface PitchNote {
  beat: number;
  duration: number;
  midi: number;
  velocity: number;
}

/** One sung syllable, placed in time. */
export interface SungSyllable {
  beat: number;
  /** Sounding length in beats. Equal to the gap to the next event when joined. */
  duration: number;
  /** Fractional on purpose — a recited line does not sit on semitones. */
  midi: number;
  velocity: number;
  vowel: Vowel;
  consonant: Consonant;
  /** Continues the previous syllable: no consonant, no re-attack, glide the pitch. */
  tie: boolean;
  /** Runs into the next event with no silence between them. */
  legatoToNext: boolean;
  stress: boolean;
  /** For display and for lip-sync — which word, and which syllable of it. */
  word: string;
  wordIndex: number;
  syllableIndex: number;
}

export interface UtteranceOptions {
  words: PhoneticWord[];
  /** The tune. May be ignored entirely — see `Delivery.flatten`. */
  tune: PitchNote[];
  delivery: Delivery;
  signature: VoiceSignature;
  bpm: number;
  rng: Rng;
  /** Keep going until the tune runs out, repeating the text. Off: stop at the end. */
  loopText?: boolean;
}

/** A place a syllable could go: one slot on whatever grid the delivery uses. */
interface Slot {
  beat: number;
  /** Beats until the next slot — the space this syllable has to fill. */
  span: number;
  /** The tune's pitch here, before flattening. */
  midi: number;
  velocity: number;
  /** A rest in the tune ended just before this slot. */
  phraseStart: boolean;
  /** This slot is a fresh note of the tune rather than a subdivision of one. */
  noteStart: boolean;
}

export function layOutUtterance(opts: UtteranceOptions): SungSyllable[] {
  const { words, delivery, signature, bpm, rng } = opts;
  if (!words.length || !opts.tune.length) return [];

  const shift = octaveFoldFor(opts.tune.map((n) => n.midi), signature);
  const tune = opts.tune.map((n) => ({ ...n, midi: n.midi + shift }));

  const slots = delivery.timing === 'speech'
    ? speechSlots(tune, delivery, bpm)
    : metricSlots(tune, delivery);
  if (!slots.length) return [];

  const stream = flattenWords(words);
  const total = opts.loopText === false ? Math.min(slots.length, stream.length) : slots.length;

  const out: SungSyllable[] = [];
  let cursor = 0;

  for (let i = 0; i < total; i++) {
    const slot = slots[i]!;
    const previous = out[out.length - 1];

    /**
     * Melisma: hold the previous syllable across this slot instead of taking a
     * new one. Only where there is a previous syllable to hold, only where the
     * pitch actually moves — holding a vowel across two identical pitches is
     * not a melisma, it is a note that failed to re-attack — and never across a
     * breath, because the whole point of a phrase break is that the voice stops.
     */
    const canTie = previous !== undefined
      && !slot.phraseStart
      && Math.abs(slot.midi - (previous.midi - 0)) > 0.01
      && delivery.melisma > 0;
    // Melisma sits on the stressed syllable — that is where a singer puts it,
    // because the emphasis is what earns the extra notes.
    const tieChance = delivery.melisma * (previous?.stress ? 1.8 : 0.6);
    if (canTie && rng.chance(Math.min(0.9, tieChance))) {
      out.push({
        ...previous!,
        beat: slot.beat,
        duration: slot.span,
        midi: slot.midi,
        velocity: previous!.velocity * 0.94,
        consonant: 'none',
        tie: true,
        legatoToNext: true,
      });
      continue;
    }

    const entry = stream[cursor % stream.length]!;
    cursor++;

    out.push({
      beat: slot.beat,
      duration: slot.span,
      midi: slot.midi,
      velocity: slot.velocity,
      vowel: entry.syllable.vowel,
      consonant: entry.syllable.onset,
      tie: false,
      legatoToNext: false,
      stress: entry.syllable.stress,
      word: entry.word,
      wordIndex: entry.wordIndex,
      syllableIndex: entry.syllableIndex,
    });
  }

  applyPitch(out, slots, delivery, signature);
  applyTiming(out, slots, delivery);
  return out;
}

/** The syllable stream, with enough context to know where words begin and end. */
interface StreamEntry {
  syllable: PhoneticWord['syllables'][number];
  word: string;
  wordIndex: number;
  syllableIndex: number;
  /** Last syllable of its word. */
  wordEnd: boolean;
  /** Punctuation followed — take a breath after this one. */
  breakAfter: boolean;
}

function flattenWords(words: PhoneticWord[]): StreamEntry[] {
  const out: StreamEntry[] = [];
  words.forEach((word, wordIndex) => {
    word.syllables.forEach((syllable, syllableIndex) => {
      const wordEnd = syllableIndex === word.syllables.length - 1;
      out.push({
        syllable,
        word: word.text,
        wordIndex,
        syllableIndex,
        wordEnd,
        breakAfter: wordEnd && word.breakAfter,
      });
    });
  });
  return out;
}

/**
 * Slots on the beat grid: every note of the tune, subdivided as far as it will
 * go at the delivery's syllable rate.
 *
 * A note shorter than one syllable still gets exactly one — you cannot sing
 * half a syllable — and a long note gets as many whole ones as it holds, which
 * is what turns a held note from a drone into a word being sung on it.
 */
function metricSlots(tune: PitchNote[], delivery: Delivery): Slot[] {
  const step = Math.max(0.05, delivery.syllableBeats);
  const out: Slot[] = [];
  let prevEnd = -Infinity;

  for (const note of tune) {
    const phraseStart = note.beat - prevEnd >= PHRASE_GAP_BEATS;
    prevEnd = note.beat + note.duration;
    const count = Math.max(1, Math.floor(note.duration / step + 1e-6));
    for (let k = 0; k < count; k++) {
      const beat = note.beat + k * step;
      const end = k === count - 1 ? note.beat + note.duration : beat + step;
      out.push({
        beat,
        span: end - beat,
        midi: note.midi,
        velocity: note.velocity,
        phraseStart: phraseStart && k === 0,
        noteStart: k === 0,
      });
    }
  }
  return out;
}

/**
 * Slots at a rate per second, ignoring the tune's rhythm entirely.
 *
 * This is what makes spoken delivery sound spoken. Speech is not in tempo with
 * anything; its syllables are near-isochronous at a rate set by the speaker,
 * and the tune underneath supplies only pitch (and even that only where
 * `flatten` is below 1). Laying talk on the sixteenth grid is instantly audible
 * as rap, which is a fine thing to be but not this thing.
 */
function speechSlots(tune: PitchNote[], delivery: Delivery, bpm: number): Slot[] {
  const first = tune[0]!;
  const last = tune[tune.length - 1]!;
  const start = first.beat;
  const end = last.beat + last.duration;
  const step = (bpm / 60) / Math.max(0.5, delivery.syllableRate); // beats per syllable

  const out: Slot[] = [];
  for (let beat = start; beat < end - 1e-6; beat += step) {
    // Whichever note of the tune is sounding here supplies the pitch. Past the
    // end of a note (the tune is sparser than speech is) the last one holds.
    let midi = first.midi;
    let velocity = first.velocity;
    for (const n of tune) {
      if (n.beat <= beat + 1e-6) { midi = n.midi; velocity = n.velocity; } else break;
    }
    out.push({
      beat,
      span: step,
      midi,
      velocity,
      phraseStart: out.length === 0,
      noteStart: true,
    });
  }
  return out;
}

/**
 * Blend the written pitch toward a recited one, and lay a speech contour on it.
 *
 * `flatten` is a straight interpolation between the tune and the voice's own
 * centre, so 0 sings the notes exactly and 1 discards them. The contour on top
 * is what stops a flattened line being a robot, and it is three effects, all of
 * them real and all of them cheap:
 *
 *  - **Declination.** Pitch drifts down across a phrase, because subglottal
 *    pressure falls as the breath runs out. Every language does it and nobody
 *    is taught it.
 *  - **Stress.** A stressed syllable is a little higher as well as a little
 *    longer and louder.
 *  - **The final fall.** A statement ends by dropping. Leaving it out is what
 *    makes synthesised speech sound like it has more to say.
 *
 * Plus a few cents of jitter, deterministic per syllable, because a pitch held
 * to the exact hertz is the one thing no larynx can do.
 */
function applyPitch(
  out: SungSyllable[], slots: Slot[], delivery: Delivery, signature: VoiceSignature,
): void {
  if (!out.length) return;
  const recite = signature.centre;

  // Phrase spans, for declination and for the final fall.
  const bounds: number[] = [];
  out.forEach((s, i) => { if (i === 0 || slots[i]?.phraseStart) bounds.push(i); });
  bounds.push(out.length);

  for (let b = 0; b < bounds.length - 1; b++) {
    const from = bounds[b]!;
    const to = bounds[b + 1]!;
    const len = Math.max(1, to - from - 1);
    for (let i = from; i < to; i++) {
      const s = out[i]!;
      const p = (i - from) / len;
      let midi = s.midi * (1 - delivery.flatten) + recite * delivery.flatten;

      if (delivery.intonation > 0) {
        const k = delivery.intonation;
        let contour = -0.45 * k * p;                       // declination
        if (s.stress) contour += 0.35 * k;                 // stress lifts
        if (i === to - 1) contour -= 0.55 * k;             // the final fall
        // A few cents of jitter, stable for a given syllable of a given word.
        contour += (((s.wordIndex * 31 + s.syllableIndex * 7) % 11) / 11 - 0.5) * 0.2 * k;
        midi += contour * delivery.flatten;
      }
      s.midi = midi;
    }
  }
}

/**
 * Turn each slot's span into a sounding length, and decide where the silence is.
 *
 * The rule the whole file exists for: silence at word and phrase boundaries,
 * none inside a word. `legato` scales how firmly that holds — at 1 a word is
 * one continuous sound whose syllables are marked only by the level dip and the
 * consonant, at 0 every syllable is cut short and you are back to blips.
 *
 * Stress lengthens, but only into space that is already there. A stressed
 * syllable that ran past its own slot would push the next one late, and the
 * grid is the one thing that has to stay put.
 */
function applyTiming(out: SungSyllable[], slots: Slot[], delivery: Delivery): void {
  for (let i = 0; i < out.length; i++) {
    const s = out[i]!;
    const next = out[i + 1];
    const span = next ? next.beat - s.beat : s.duration;

    // How this syllable relates to the one after it decides the gap.
    let joined: boolean;
    let gapFraction: number;
    if (!next) {
      // The last syllable of a line rings out. Clipping it to make room for a
      // breath nobody is going to take is backwards — real speech *lengthens*
      // its final syllable, and the envelope's release ends the line anyway.
      joined = false;
      gapFraction = 0;
    } else if (next.tie) {
      joined = true;
      gapFraction = 0;
    } else if (next.wordIndex === s.wordIndex && !slots[i + 1]?.phraseStart) {
      joined = true;
      gapFraction = 0;
    } else if (slots[i + 1]?.phraseStart) {
      joined = false;
      gapFraction = delivery.breathGap;
    } else {
      joined = false;
      gapFraction = delivery.wordGap;
    }

    let duration: number;
    if (joined) {
      // 0.6 rather than 0 at the bottom: even a fully detached delivery keeps
      // more than half its slot, because a syllable shorter than that is a
      // click rather than a vowel.
      duration = span * (0.6 + 0.4 * delivery.legato);
      /**
       * Past this point the syllables are *joined*, and the remaining sliver of
       * silence is removed rather than left in.
       *
       * The threshold exists because the two cases are qualitatively different
       * downstream, not merely different by a few percent: a joined boundary is
       * a dip in level inside a continuous sound, and a detached one is a stop
       * and a fresh attack. Leaving a 3% gap gets the worst of both — the ear
       * hears the re-attack of a detached syllable *and* the timing of a joined
       * one — so anything close enough to joined is snapped to it.
       */
      if (duration >= span * 0.92) duration = span;
    } else {
      // Capped well short of the whole slot: a gap is a breath, and a syllable
      // reduced to a third of its slot to make room for one is a stammer.
      const gap = Math.min(0.55, gapFraction * (1 - 0.35 * delivery.legato));
      duration = span * (1 - gap);
    }

    if (s.stress) {
      duration = Math.min(span, duration * (1 + delivery.stressLength * 0.5));
      s.velocity = Math.min(1, s.velocity * (1 + delivery.stressLevel));
    }

    s.duration = Math.max(0.03, duration);
    s.legatoToNext = next !== undefined && s.duration >= span - 1e-6;
  }
}

/** Total length of a laid-out line, in beats. */
export function utteranceLengthBeats(line: SungSyllable[]): number {
  if (!line.length) return 0;
  const last = line[line.length - 1]!;
  return last.beat + last.duration;
}
