/**
 * Melody -> sung line.
 *
 * The voice does not get its own tune. It doubles the melody, which is what
 * makes this cheap and also what makes it correct: in the arrangements this
 * generator is imitating, the singer and the lead instrument are playing the
 * same line, and the instrument is there to hold the tune up.
 *
 * What this file adds is everything *except* the notes: the octave the line has
 * to be folded into to be singable at all, a vowel for each syllable, and —
 * the part that actually matters — the syllables themselves.
 *
 * Singing is not sustained tone, it is *articulated* tone. Hand a held half
 * note to any synthesised voice and it produces a wordless pad; the ear hears
 * an instrument, or worse, a choir patch wobbling on a vibrato. What makes the
 * ear hear a person is the re-attack: a mouth opening and closing at syllable
 * rate, each syllable scooping into its pitch. That is also exactly the
 * Undertale/Animal Crossing trick — the voice reads as a voice because it is
 * chopped, not because the timbre is convincing.
 *
 * So a note here is not one sound. It is one *or more* syllables, spaced on the
 * beat grid, each one short enough to leave a gap before the next.
 */

import { Rng } from '../core/rng.js';
import type { Consonant, NoteEvent, Track, Vowel } from '../core/types.js';
import { VOWEL_OPENNESS, type VocalProfile } from '../style/vocals.js';

/**
 * A gap this long or longer ends a phrase — which is to say, it is where the
 * breath goes, and therefore where the vowel is allowed to change no matter
 * what the profile's `hold` says.
 */
const PHRASE_GAP_BEATS = 1;

/** How much worse it is to sit below a voice's floor than above its ceiling. */
const BELOW_RANGE_WEIGHT = 3;

function sq(x: number): number {
  return x * x;
}

/** One syllable, before it has been given a vowel. */
interface Syllable {
  beat: number;
  duration: number;
  midi: number;
  velocity: number;
  /** First syllable after a breath — the vowel is always re-chosen here. */
  phraseStart: boolean;
}

export function generateVocalTrack(
  melody: NoteEvent[],
  profile: VocalProfile,
  rng: Rng,
): Track | undefined {
  if (!melody.length) return undefined;

  const shift = octaveFold(melody, profile);
  const base = weightedMeanOpenness(profile.vowels);
  const syllables = syllabify(melody, shift, profile);

  const notes: NoteEvent[] = [];
  let vowel: Vowel | undefined;
  let consonant: Consonant | undefined;
  let sinceChange = 0;

  for (const syl of syllables) {
    if (vowel === undefined || syl.phraseStart || sinceChange >= profile.hold) {
      vowel = chooseVowel(syl, base, profile, vowel, rng);
      sinceChange = 0;
    }
    sinceChange++;
    // A consonant every syllable, unlike the vowel — the onset is what the ear
    // uses to tell one syllable from the next, so it has to keep moving even
    // where the vowel is being held across a phrase.
    consonant = chooseConsonant(profile, consonant, rng);
    notes.push({
      beat: syl.beat,
      duration: syl.duration,
      midi: syl.midi,
      velocity: syl.velocity,
      vowel,
      consonant,
    });
  }

  return {
    layer: 'vocal',
    instrument: profile.name,
    gmProgram: profile.gm,
    strudelSound: profile.strudel,
    notes,
    gain: profile.gain,
    voice: profile.voice,
  };
}

/**
 * Cut the melody into syllables.
 *
 * A note shorter than one syllable becomes one syllable. A longer one is
 * re-attacked on the syllable grid for as long as it lasts, which is what turns
 * a held note from a drone into someone singing "la-la-la" on it. Each syllable
 * is then shortened to leave a gap before the next, because the silence is not
 * a detail — it is the mouth closing, and without it the re-attacks smear back
 * into the drone they were meant to break up.
 *
 * The grid is in beats rather than seconds so the syllables land musically. A
 * singer subdivides in time with the band, not at a fixed rate per second.
 */
function syllabify(melody: NoteEvent[], shift: number, profile: VocalProfile): Syllable[] {
  const { syllableBeats, blipBeats } = profile.voice;
  const out: Syllable[] = [];
  let prevEnd = -Infinity;

  for (const note of melody) {
    const phraseStart = note.beat - prevEnd >= PHRASE_GAP_BEATS;
    prevEnd = note.beat + note.duration;

    // A syllable has to fit: the count is however many whole ones the note can
    // hold, and never fewer than one however short the note is.
    const count = Math.max(1, Math.floor(note.duration / syllableBeats + 1e-6));
    for (let k = 0; k < count; k++) {
      const beat = note.beat + k * syllableBeats;
      const remaining = note.beat + note.duration - beat;
      out.push({
        beat,
        duration: Math.max(0.05, Math.min(blipBeats, remaining)),
        midi: note.midi + shift,
        // The syllable that carries the note's own attack keeps its weight; the
        // repeats behind it are softer, the way a held word decays as it runs on.
        velocity: k === 0 ? note.velocity : note.velocity * 0.82,
        phraseStart: phraseStart && k === 0,
      });
    }
  }
  return out;
}

/**
 * Move the whole line by whole octaves so it lands where the voice can sing it.
 *
 * It has to be the whole line and it has to be octaves: shifting notes
 * individually to fit a range would rewrite the melody's contour and its
 * intervals, and the contour is the tune. This matters more than it sounds
 * like — the melody instrument might be a flute centred at C6, which is a pitch
 * nobody sings.
 *
 * Folding by the mean alone is not enough. A line with a wide span can average
 * out to a comfortable pitch while its bottom notes sit below anything a voice
 * produces, so candidates are scored on how far they push notes *outside* the
 * range, squared, and only tie-broken on the mean. Where the melody's own span
 * is wider than the voice's range no shift can win outright, and this picks the
 * least bad one — the alternative is rewriting the tune, which is not on offer.
 */
function octaveFold(melody: NoteEvent[], profile: VocalProfile): number {
  const [lo, hi] = profile.range;
  const mean = melody.reduce((sum, n) => sum + n.midi, 0) / melody.length;

  let best = 0;
  let bestCost = Infinity;
  for (const shift of [-24, -12, 0, 12, 24]) {
    let cost = 0;
    for (const n of melody) {
      const midi = n.midi + shift;
      // Asymmetric, because the two failures are not the same failure. Reaching
      // above the top of a voice strains and thins the tone, which singers do
      // deliberately and listeners accept as effort. Below the bottom the folds
      // simply stop closing and there is no note at all — so a fold that leaves
      // the line hanging under the floor is much worse than one that makes it
      // reach, even when the excursion measures the same.
      cost += BELOW_RANGE_WEIGHT * sq(Math.max(0, lo - midi)) + sq(Math.max(0, midi - hi));
    }
    // Scaled well below one semitone of excursion, so this only ever separates
    // shifts that are otherwise equally singable.
    cost += Math.abs(mean + shift - profile.centre) * 0.01;
    if (cost < bestCost) { bestCost = cost; best = shift; }
  }
  return best;
}

/** The openness the profile sits at on average, before pitch and length move it. */
function weightedMeanOpenness(vowels: (readonly [Vowel, number])[]): number {
  let total = 0;
  let sum = 0;
  for (const [v, w] of vowels) {
    total += w;
    sum += VOWEL_OPENNESS[v] * w;
  }
  return total > 0 ? sum / total : 0.5;
}

/**
 * Pick a vowel for one note.
 *
 * The profile's weights say what this genre sings on; the note says how open it
 * wants to be. Multiplying a gaussian around the target into the weights lets
 * both have a say, rather than the pitch rule overriding the genre outright.
 */
function chooseVowel(
  syl: Syllable,
  base: number,
  profile: VocalProfile,
  previous: Vowel | undefined,
  rng: Rng,
): Vowel {
  // Up high everything opens toward /a/, and the effect is asymmetric: a voice
  // low in its range can still sing a bright closed vowel, so the floor is much
  // shallower than the ceiling.
  const pitchLift = clamp((syl.midi - profile.centre) / 12, -0.35, 0.5);
  // Longer syllables open up too, for the same reason — you cannot hold /i/.
  const lengthLift = clamp((syl.duration - 0.5) * 0.3, -0.12, 0.3);
  const target = clamp(base + pitchLift + lengthLift, 0, 1);

  const spread = Math.max(0.05, profile.spread);
  const weighted = profile.vowels.map(([v, w]) => {
    const d = (VOWEL_OPENNESS[v] - target) / spread;
    let weight = w * Math.exp(-0.5 * d * d);
    // On a scat line, back-to-back identical syllables read as a stutter rather
    // than as singing. Discourage without forbidding — "doo-doo-ba" is fine.
    if (v === previous) weight *= 0.25;
    return [v, weight] as const;
  });

  const total = weighted.reduce((a, [, w]) => a + w, 0);
  // Every candidate can be vanishingly unlikely if the target sits well outside
  // the profile's range. Fall back on the nearest rather than dividing by zero.
  if (total <= 1e-9) {
    return profile.vowels.reduce((best, [v]) =>
      Math.abs(VOWEL_OPENNESS[v] - target) < Math.abs(VOWEL_OPENNESS[best] - target) ? v : best,
    profile.vowels[0]![0]);
  }
  return rng.weighted(weighted);
}

/**
 * Pick how this syllable starts.
 *
 * The only rule beyond the genre's weights is that a manner does not repeat
 * immediately. Three /t/ sounds in a row is a stutter, not a word, and the
 * whole reason consonants are here is to stop consecutive syllables sounding
 * identical — letting the same one through twice defeats the point.
 */
function chooseConsonant(
  profile: VocalProfile,
  previous: Consonant | undefined,
  rng: Rng,
): Consonant {
  const weighted = profile.consonants.map(([c, w]) =>
    [c, c === previous ? w * 0.15 : w] as const);
  return rng.weighted(weighted);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
