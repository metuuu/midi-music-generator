/**
 * The singing face — vowels to mouth shapes.
 *
 * This is the clearest case in the whole feature of the Song IR having been
 * built right. `NoteEvent.vowel` and `NoteEvent.consonant` are on every sung
 * note, and `VoiceSettings.syllableBeats` and `blipBeats` already say how often
 * the mouth re-opens and how long it stays open — so the face is a *re-reading
 * of the same numbers the synthesiser uses*, not a second system that has to be
 * kept in sync with it. Lips and voice cannot drift apart because there is only
 * one set of numbers and it is used twice.
 *
 * Three continuous parameters rather than fifteen poses, mirroring how the
 * voice itself is modelled. That is not only a rendering convenience: the
 * fifteen vowels in `style/vocals.ts` are already *coordinates* rather than
 * categories — `VOWEL_OPENNESS` and `VOWEL_FRONTNESS` are computed from the
 * formant table precisely so nothing has to hand-maintain a parallel list — and
 * a mouth is the same two-dimensional object seen from the front. Snapping
 * between fifteen poses would be throwing away a continuum the data already
 * has.
 *
 * The three parameters have to actually separate the vowels or none of this is
 * worth anything. Measured as Euclidean distance in (open, round, spread), the
 * three cardinal shapes land 1.26 to 1.37 apart on a scale whose maximum is
 * √2 ≈ 1.41 — /a/ at (1.00, 0.00, 0.00), /u/ at (0.16, 0.94, 0.00), /i/ at
 * (0.10, 0.00, 1.00). They are very nearly the corners of the triangle.
 *
 * The one thing this file does *not* do is put words in the mouth. The voice is
 * wordless by design (§5) and the face must not drift toward mouthing language
 * it is not singing — which it cannot, because the only inputs are a vowel, a
 * manner of articulation and a rate.
 */

import { quantise } from '../core/grid.js';
import type { Consonant, Song, Vowel } from '../core/types.js';
import { CONSONANTS, VOWEL_FORMANTS, VOWEL_OPENNESS } from '../style/vocals.js';
import type { Span, Viseme, VisemeTrack } from './types.js';

// ---------------------------------------------------------------------------
// Vowel to mouth
// ---------------------------------------------------------------------------

/** Jaw openness, lip rounding, lip spreading — 0..1 each. */
export interface MouthShape {
  open: number;
  round: number;
  spread: number;
}

/**
 * How far the lips are pushed forward and drawn in, on a 0 (rounded) .. 1
 * (spread) axis, derived from F2 *and* F3 together.
 *
 * Frontness alone — which is F2 alone, and which `VOWEL_FRONTNESS` already
 * computes — is not the same question. It is very nearly right at the ends of
 * the palette, because in most languages the back vowels are the rounded ones:
 * /u/ and /o/ have the lowest F2 in the table and the most pursed lips, /i/ and
 * /e/ the highest and the most spread. It goes wrong in the middle, on the
 * front-rounded vowels the Finnish palette actually uses — /ue/ (ü), /oe/ (ö)
 * and /y/ have a *front* tongue and *rounded* lips, and F2 alone reports them
 * as three-quarters spread, which is the wrong face.
 *
 * The correction is the standard acoustic correlate: **rounding lowers F2 and
 * F3 together**, because pursing the lips lengthens the tract and drops every
 * resonance above the first. Averaging log F2 and log F3 therefore separates
 * /ue/ from /i/ — they share an F1 and an F2 within 25% of each other, and
 * their F3s are 850 Hz apart — while leaving /u/, /o/, /a/ and /i/ exactly
 * where F2 alone put them.
 *
 * Logarithmic for the same reason `VOWEL_FRONTNESS` is: 870 → 1090 Hz and
 * 1750 → 2290 Hz are comparable steps to the ear though the second spans twice
 * the hertz.
 *
 * **What this still cannot do**, said plainly: no function of a spectrum
 * separates lip rounding from tongue backness completely, because they are
 * partly redundant cues to the same acoustic result — that is the classic
 * ambiguity between a front rounded /y/ and a back unrounded /ɯ/. The
 * front-rounded vowels come out half round and half spread rather than
 * emphatically pursed. That is a real error, it is confined to three vowels
 * carrying about a tenth of the weight in the two palettes that use them at
 * all, and the alternative — hand-tabulating fifteen mouths — buys a better
 * /ö/ at the price of a table that can silently disagree with the voice it is
 * supposed to be a picture of. Agreement is worth more than /ö/.
 */
const APERTURE: Record<Vowel, number> = (() => {
  const lipAxis = (f: readonly [number, number, number]): number =>
    (Math.log2(f[1]) + Math.log2(f[2])) / 2;
  const all = Object.values(VOWEL_FORMANTS).map(lipAxis);
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  return Object.fromEntries(
    Object.entries(VOWEL_FORMANTS).map(([v, f]) => [v, (lipAxis(f) - lo) / (hi - lo)]),
  ) as Record<Vowel, number>;
})();

/**
 * The lowest the jaw goes on a *sung* vowel.
 *
 * Not zero. A closed vowel is closed relative to /a/, not relative to a shut
 * mouth — a singer on /i/ still has the jaw a finger's width down, and a face
 * that clamps shut on every /i/ reads as a hinge rather than as a person.
 */
const JAW_FLOOR = 0.1;

/**
 * The fifteen vowels on the triangle: /a/ open and neutral, /u/ closed and
 * round, /i/ closed and spread.
 *
 * The whole mapping is one idea — **the jaw and the lips trade off**. A wide
 * jaw leaves the lips no shape to make, which is why /a/ is neutral rather than
 * either rounded or spread; as the jaw closes the lips take over, and which way
 * they go is the aperture axis above. So openness scales the lip pair, and the
 * lip pair splits by aperture:
 *
 *     open   = jaw floor .. 1, from F1
 *     spread = (1 - openness) * aperture
 *     round  = (1 - openness) * (1 - aperture)
 *
 * Computed at load rather than written out, exactly as `VOWEL_OPENNESS` is, so
 * it cannot drift from the formant table the voice is synthesised through.
 */
export const VOWEL_MOUTH: Record<Vowel, MouthShape> = (() => {
  const out = {} as Record<Vowel, MouthShape>;
  for (const vowel of Object.keys(VOWEL_FORMANTS) as Vowel[]) {
    const openness = VOWEL_OPENNESS[vowel];
    const lips = 1 - openness;
    out[vowel] = {
      open: round3(JAW_FLOOR + (1 - JAW_FLOOR) * openness),
      round: round3(lips * (1 - APERTURE[vowel])),
      spread: round3(lips * APERTURE[vowel]),
    };
  }
  return out;
})();

/** The mouth for one vowel. Exported for the performer rig, which blends poses. */
export function mouthFor(vowel: Vowel): MouthShape {
  return VOWEL_MOUTH[vowel];
}

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

/**
 * How long the jaw takes to shut, in seconds.
 *
 * Seconds rather than beats, for the same reason `Viseme.onsetSeconds` is:
 * closing a mouth is a physical motion and it does not get quicker because the
 * band does. This is the *minimum* silence between two syllables — the gap that
 * `blipBeats` exists to create, enforced again here because quantising a beat
 * can move a syllable a thirty-second closer to the one before it and a mouth
 * that never quite shuts is the difference between singing and a hinge.
 */
const MOUTH_CLOSE_SECONDS = 0.06;

/** A mouth is never open for less than this, however crowded the syllables. */
const MIN_HOLD_BEATS = 0.05;

/**
 * A gap this long or longer is a phrase break, and therefore where the breath
 * goes.
 *
 * The same number as `PHRASE_GAP_BEATS` in `generate/vocals.ts`, which is where
 * the vowel is allowed to change for the same reason — a singer re-chooses a
 * vowel when they re-fill their lungs. It is duplicated rather than imported
 * because it is not exported there, and the two being one beat apart would be
 * visible as a face that breathes in the wrong places.
 */
const PHRASE_GAP_BEATS = 1;

/** An inhale, in seconds: the short one before a short phrase, the long before a long. */
const INHALE_SECONDS: [number, number] = [0.28, 0.6];

// ---------------------------------------------------------------------------
// The track
// ---------------------------------------------------------------------------

/**
 * The mouth track for a sung number, or `undefined`.
 *
 * `undefined` is the common case and it has to be cheap: under the default
 * `mixed` vocal policy most numbers are instrumental, and an instrumental is a
 * first-class mode rather than a degraded one (§5). A number with no vocal
 * track has no singer on stage and nothing here to do.
 *
 * One viseme per sung note, no more and no fewer — `npm run concert` asserts
 * both directions. That is exact rather than approximate because the vocal
 * track's notes *are* the syllables: `generate/vocals.ts` has already cut every
 * held note into `syllableBeats` pieces and clipped each to `blipBeats`, so
 * there is nothing left here to re-derive and no opportunity to disagree.
 */
export function visemesFor(song: Song, performerId: string): VisemeTrack | undefined {
  const track = song.tracks.find((t) => t.layer === 'vocal' && t.voice);
  if (!track?.voice || !track.notes.length) return undefined;

  const { bpm } = song.meta;
  const closeBeats = (MOUTH_CLOSE_SECONDS * bpm) / 60;
  const notes = [...track.notes].sort((a, b) => a.beat - b.beat);

  const visemes: Viseme[] = [];
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]!;
    const beat = quantise(note.beat);
    /**
     * A vowel is always present on this layer — the generator sets one on every
     * note it writes. `uh` is the neutral fallback rather than a throw: a face
     * stuck open is a worse failure than a face on the wrong schwa, and this is
     * the sort of thing that would only ever be reached by a hand-built Song.
     */
    const vowel: Vowel = note.vowel ?? 'uh';
    const onset: Consonant = note.consonant ?? 'none';
    const shape = VOWEL_MOUTH[vowel];

    /**
     * The mouth closes between syllables, because `blipBeats` says it does.
     *
     * Three limits, and the tightest wins: the profile's own blip, the note's
     * length (a viseme must never outlast the sound it is a picture of), and
     * whatever room is left before the next syllable minus the time it takes to
     * shut. That gap is the whole reason a sung line reads as a person; without
     * it the re-attacks smear back into the drone they were meant to break up,
     * and the face does the same thing.
     */
    const nextBeat = i + 1 < notes.length ? quantise(notes[i + 1]!.beat) : Infinity;
    const hold = Math.max(
      MIN_HOLD_BEATS,
      Math.min(track.voice.blipBeats, note.duration, nextBeat - beat - closeBeats),
    );

    visemes.push({
      beat,
      holdBeats: round3(hold),
      open: shape.open,
      round: shape.round,
      spread: shape.spread,
      onset,
      /**
       * Straight from the table the synthesiser reads. `stop` is 3 ms and
       * `nasal` is 70 ms — a twentyfold spread, and it is what makes a /t/ pop
       * the lips open and an /m/ hum into the note. Nothing here rescales it.
       */
      onsetSeconds: CONSONANTS[onset].attack,
    });
  }

  return { performerId, visemes, breaths: breathsFor(notes, bpm) };
}

/**
 * Visible inhales, in the rests.
 *
 * A singer who never breathes is a machine, and this is the one place the face
 * does something the audio does not — the voice simply stops during a rest, and
 * a body that merely stops with it looks switched off. The rests are already in
 * the data: the same one-beat gap that `generate/vocals.ts` treats as a phrase
 * break, which is where it lets the vowel change.
 *
 * The breath is placed at the *end* of the gap rather than the start, because
 * an inhale belongs to the phrase it is about to power. Its depth comes from
 * how long that phrase is — a singer takes a bigger breath before a longer
 * line, and that is the cue that makes the following phrase look intended
 * rather than merely resumed.
 */
function breathsFor(
  notes: { beat: number; duration: number }[],
  bpm: number,
): Span[] {
  const out: Span[] = [];
  const beatsOf = (s: number): number => (s * bpm) / 60;

  // Phrase starts, and where each phrase ends, in one pass.
  const starts: number[] = [0];
  for (let i = 1; i < notes.length; i++) {
    const gap = notes[i]!.beat - (notes[i - 1]!.beat + notes[i - 1]!.duration);
    if (gap >= PHRASE_GAP_BEATS) starts.push(i);
  }

  for (let p = 0; p < starts.length; p++) {
    const first = starts[p]!;
    const lastIndex = (p + 1 < starts.length ? starts[p + 1]! : notes.length) - 1;
    const last = notes[lastIndex]!;
    const phraseBeats = last.beat + last.duration - notes[first]!.beat;
    // Deep enough to see on anything, and saturating around four bars of line.
    const depth = clamp01(0.35 + phraseBeats / 24);

    const to = quantise(notes[first]!.beat);
    const inhale = beatsOf(INHALE_SECONDS[0] + (INHALE_SECONDS[1] - INHALE_SECONDS[0]) * depth);
    const previous = first > 0
      ? notes[first - 1]!.beat + notes[first - 1]!.duration
      : 0;
    const from = Math.max(0, previous, to - inhale);
    if (to - from < MIN_HOLD_BEATS) continue;

    out.push({ fromBeat: quantise(from), toBeat: to, value: round3(depth) });
  }
  return out;
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
