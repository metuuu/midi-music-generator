/**
 * Melody -> sung line.
 *
 * The voice does not get its own tune. It doubles the melody, which is what
 * makes this cheap and also what makes it correct: in the arrangements this
 * generator is imitating, the singer and the lead instrument are playing the
 * same line, and the instrument is there to hold the tune up.
 *
 * What this file adds is everything *except* the notes: the octave the line has
 * to be folded into to be singable at all, the syllables the melody is cut
 * into, and the words those syllables come from.
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
 *
 * ### Words
 *
 * The vowels and consonants used to be drawn per syllable from the profile's
 * weights, and they now come from **invented words** that nobody ever sees.
 *
 * That distinction is the whole of it. A weighted draw per syllable produces a
 * sequence with no memory: every syllable is as likely as every other, so no
 * figure ever comes back and the line is heard as texture. It cannot be fixed
 * by choosing better weights, because the problem is the independence rather
 * than the distribution. Language is not distributed that way — it is a small
 * vocabulary, reused, and the reuse is what a listener hears first.
 *
 * So the song gets a lexicon of twenty invented words and a line per section.
 * Every chorus is handed the *same* line, so the second chorus comes back on
 * the same handful of words as the first — verbatim where the two choruses got
 * the same number of syllables out of the tune, and phase-shifted onto the same
 * vocabulary where they did not. Either way it is recognisably the refrain, and
 * there is no way at all to get one out of a random draw.
 *
 * The words are never rendered, never serialised and never leave this file:
 * what goes on the `Track` is syllables, as it always was. `generate/phonetics.ts`
 * carries the rules — vowel harmony, syllable weight, which letters this voice
 * can say — and `docs/voice.md` the reasoning.
 */

import { Rng } from '../core/rng.js';
import type { NoteEvent, Section, SectionKind, Track } from '../core/types.js';
import type { VocalProfile } from '../style/vocals.js';
import {
  inventLexicon, syllableWeight,
  type PhoneticStyle, type PhoneticWord, type Syllable as Phoneme,
} from './phonetics.js';

/**
 * A gap this long or longer ends a phrase — which is to say, it is where the
 * breath goes, and therefore where the line is made to start a fresh word
 * rather than continue one across the silence.
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

/** What the line hands back for one slot of the melody. */
interface Sung {
  phoneme: Phoneme;
  /** A continuation of the syllable before it rather than a fresh one. */
  tie: boolean;
  /** Which word it belongs to. Only ever compared with its neighbour's. */
  word: number;
}

/** Where the song's sections are, so a line can be given to one. */
export interface LyricContext {
  sections: Section[];
  beatsPerBar: number;
}

export function generateVocalTrack(
  melody: NoteEvent[],
  profile: VocalProfile,
  rng: Rng,
  lyric: LyricContext,
): Track | undefined {
  if (!melody.length) return undefined;

  const line = oneNoteAtATime(melody);
  const shift = octaveFold(line, profile);
  const syllables = syllabify(line, shift, profile);
  const write = writer(profile, lyric, rng);

  const notes: NoteEvent[] = [];
  const sung = syllables.map(write);
  const joined: boolean[] = [];

  syllables.forEach((syl, i) => {
    const s = sung[i]!;
    const next = sung[i + 1];
    /**
     * Joined to the next note when the next note is part of the same word, and
     * only then. That is the rule the whole vocal layer turns on: silence goes
     * between words, never inside one, and a listener reads a silence inside a
     * word as a word boundary — so a line with silence everywhere is heard as a
     * line of one-syllable words however good the vowels are.
     *
     * A phrase break wins over it. The next syllable beginning after a breath
     * is a new word by construction, but the melody can also simply stop, and
     * two notes a bar apart are not legato whatever the words say.
     */
    joined[i] = next !== undefined
      && next.word === s.word
      && syllables[i + 1]!.beat - syl.beat < PHRASE_GAP_BEATS + 1e-6;

    /**
     * A tie only counts if the note before it actually runs into it.
     *
     * The line hands out the second half of a long vowel as soon as the next
     * slot comes round, and the melody decides when that is — which can be two
     * beats and a rest later, if the tune is sparse. Holding a vowel across
     * that is not a long vowel, it is a portamento with a gap in the middle, so
     * the mark comes off and what is left is an ordinary syllable that happens
     * to repeat the vowel.
     */
    const held = s.tie && joined[i - 1] === true;

    notes.push({
      beat: syl.beat,
      duration: syl.duration,
      midi: syl.midi,
      velocity: syl.velocity,
      vowel: s.phoneme.vowel,
      consonant: s.phoneme.onset,
      ...(s.phoneme.coda !== 'none' ? { coda: s.phoneme.coda } : {}),
      ...(held ? { tie: true as const } : {}),
      ...(joined[i] ? { legatoToNext: true as const } : {}),
    });
  });

  return {
    layer: 'vocal',
    instrument: profile.name,
    gmProgram: profile.gm,
    strudelSound: profile.strudel,
    notes,
    gain: profile.gain,
    // The song has to carry its own voice: a renderer is handed a `Song` and
    // nothing else, so a tract it would have to look up by genre is a tract it
    // cannot reconstruct.
    voice: { ...profile.voice, signature: profile.signature, delivery: profile.delivery },
  };
}

/**
 * One note at a time, because that is how many a person can sing.
 *
 * The melody track is not always a melody. A two-handed player's accompaniment
 * rides on it under `hand: 'left'` — `melodicLine` strips that, and the caller
 * has already done so — but a lead can still be doubled at the octave on
 * purpose (`doubling: 'lead'`), and some genres write the tune in stacked
 * notes. Every one of those arrives here as two or three notes on the same
 * beat, and the voice was singing all of them: three syllables at beat 0, then
 * three more at beat 2, consuming the words three times faster than the tune
 * moves and scrambling the line into something with no word boundaries in it.
 *
 * The top note, because the tune is the one on top — the same rule
 * `melodicLine` uses to pick a right hand out of a keyboard part.
 */
function oneNoteAtATime(melody: NoteEvent[]): NoteEvent[] {
  const top = new Map<number, NoteEvent>();
  for (const n of melody) {
    const at = top.get(n.beat);
    if (!at || n.midi > at.midi) top.set(n.beat, n);
  }
  return [...top.values()].sort((a, b) => a.beat - b.beat);
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


// ---------------------------------------------------------------------------
// The words
// ---------------------------------------------------------------------------

/**
 * Twenty words per song.
 *
 * Enough that no two lines come out identical, few enough that the reuse is
 * audible — which is the entire reason there are words at all. A vocabulary of
 * two hundred would be indistinguishable from the random draw this replaced.
 */
const LEXICON_SIZE = 20;

/**
 * Words per line, before the line starts repeating itself inside a section.
 *
 * A chorus gets fewer, because a hook is short. That is not a stylistic
 * preference so much as what the word "hook" means: the figure has to come
 * round often enough inside its own section to be recognised by the time the
 * section ends, and a line as long as the section comes round once.
 */
const LINE_WORDS: readonly number[] = [4, 5, 5, 6, 6, 7, 8];
const HOOK_WORDS: readonly number[] = [2, 3, 3, 4];

/**
 * How this voice pronounces what it just invented.
 *
 * The profile already carries two thirds of a `PhoneticStyle` — its vowels and
 * its consonants are exactly the palettes the pronunciation wants — so this is
 * mostly a re-labelling. The two fields that are not:
 */
function phoneticsFor(profile: VocalProfile): PhoneticStyle {
  const w = profile.words;
  return {
    vowels: profile.vowels,
    consonants: profile.consonants,
    spelling: w.spelling,
    /**
     * `spread` is this profile's existing statement about how freely its vowels
     * are allowed to move, and separation is that same statement in the plane
     * the phonetics measure in. Clamped at the top because the vocoder's 0.9
     * would ask for a distance no palette contains, at which point the rule
     * relaxes itself to nothing anyway and the clamp merely says so honestly.
     */
    separation: Math.min(0.4, Math.max(0.1, profile.spread)),
    onsetDensity: w.onsetDensity,
    interiorDensity: w.interiorDensity,
    /**
     * Codas are written onto the note and sounded by whoever can.
     *
     * `NoteEvent.coda` carries it; the Web Audio voice articulates it at the
     * end of the syllable, and Strudel — one attack per event, no way to put a
     * consonant at the far end of one — ignores it and hears the syllable's
     * length without its closing consonant. Both are real pronunciations of the
     * same word, and the one that loses the consonant is the floating one this
     * project has always wanted, so nothing has to be decided here.
     */
    codaDensity: w.codaDensity,
    maxSyllables: w.maxSyllables,
  };
}

/** One syllable of a line, with enough context to know where the words begin. */
interface Beat {
  syllable: Phoneme;
  wordStart: boolean;
}

function flatten(words: PhoneticWord[]): Beat[] {
  return words.flatMap((w) => w.syllables.map((syllable, i) => ({
    syllable, wordStart: i === 0,
  })));
}

/**
 * A line, drawn from the lexicon.
 *
 * Immediate repetition is discouraged and not forbidden, because a line that
 * says the same word twice running is a real thing a lyric does and a line that
 * never can sounds shuffled.
 */
function makeLine(lexicon: PhoneticWord[], rng: Rng, hook: boolean): PhoneticWord[] {
  const out: PhoneticWord[] = [];
  const count = rng.pick(hook ? HOOK_WORDS : LINE_WORDS);
  for (let i = 0; i < count; i++) {
    const weighted = lexicon.map((w) => [w, w === out[out.length - 1] ? 0.15 : 1] as const);
    out.push(rng.weighted(weighted));
  }
  return out;
}

/**
 * Which line each section sings.
 *
 * Every chorus gets the same one. That is the single decision this whole file
 * turns on: a chorus repeats a tune, and a chorus that repeats a tune with
 * different words on it is a verse.
 *
 * How exactly it repeats is left to the tune rather than forced here. The line
 * is laid onto whatever syllable slots the melody offers, so two choruses built
 * on the same phrases come out identical syllable for syllable, and two that
 * are varied come out on the same words at a different offset. Forcing the
 * second case to match would mean constraining the melody from inside the vocal
 * generator, which is not this file's to do.
 *
 * Everything else gets a fresh line per occurrence, for the same reason in
 * reverse: verses are supposed to differ.
 */
function lineKey(kind: SectionKind, nth: number): string {
  return kind === 'chorus' ? 'chorus' : `${kind}:${nth}`;
}

/** Beat span of each section, with the line it has been given. */
interface Span {
  to: number;
  key: string;
}

function spansOf(lyric: LyricContext): Span[] {
  const seen = new Map<SectionKind, number>();
  return lyric.sections.map((s) => {
    const nth = seen.get(s.kind) ?? 0;
    seen.set(s.kind, nth + 1);
    return {
      to: (s.startBar + s.lengthBars) * lyric.beatsPerBar,
      key: lineKey(s.kind, nth),
    };
  });
}

/**
 * A closure that hands out one syllable per slot of the melody.
 *
 * Stateful because a line is: where it has got to, and whether the syllable it
 * is in the middle of is a long one that has not finished yet.
 */
function writer(
  profile: VocalProfile, lyric: LyricContext, rng: Rng,
): (syl: Syllable) => Sung {
  const phonetics = phoneticsFor(profile);
  const lexicon = inventLexicon(profile.words, phonetics, rng.fork('lexicon'), LEXICON_SIZE);
  const spans = spansOf(lyric);
  const lines = new Map<string, Beat[]>();

  // A word with nothing behind it, for the degenerate cases: an empty palette,
  // or a melody running past the last section. A bare `a` is a worse syllable
  // than any real one and a better outcome than a throw.
  const fallback: Phoneme = {
    onset: 'none', vowel: profile.vowels[0]?.[0] ?? 'a',
    coda: 'none', heavy: false, stress: false,
  };

  const lineFor = (key: string): Beat[] => {
    let line = lines.get(key);
    if (!line) {
      line = flatten(makeLine(lexicon, rng.fork(`line:${key}`), key === 'chorus'));
      lines.set(key, line);
    }
    return line;
  };

  let span = -1;
  let line: Beat[] = [];
  let cursor = 0;
  /** Slots the syllable being sung still owes itself, because it is heavy. */
  let owed = 0;
  let last: Phoneme = fallback;
  /**
   * Which word is being sung, counting up and never reset.
   *
   * Only ever compared for equality with its neighbour, which is all
   * `legatoToNext` needs: the syllables of one word run together and the space
   * between two words is where the silence goes. Counting rather than naming
   * keeps the words out of the `Track` — see the note at the top of the file.
   */
  let word = 0;

  return (syl: Syllable): Sung => {
    // Sections are in order and so are the notes, so this only ever walks
    // forward — but it is written as a search so that a melody starting before
    // the first section or running past the last still lands somewhere.
    let i = 0;
    while (i < spans.length - 1 && syl.beat >= spans[i]!.to - 1e-6) i++;
    if (i !== span) {
      span = i;
      line = lineFor(spans[i]?.key ?? 'x');
      cursor = 0;
      // Whatever was being held is cut off at the section boundary. A syllable
      // that ran across one would be a word straddling a key change.
      owed = 0;
    }
    if (!line.length) return { phoneme: fallback, tie: false, word };

    /**
     * The second slot of a heavy syllable — a long vowel or a closed one.
     *
     * It keeps the vowel and drops the consonant, so what the renderers see is
     * a re-attack with no onset on the same vowel: audibly one syllable held
     * rather than two. When the voice goes through `voice-synth.ts` this is the
     * event that becomes a tie and stops being a re-attack at all.
     */
    if (owed > 0) {
      owed--;
      // The coda waits for the last slot of the syllable, because that is where
      // a mouth puts it: `suus` is a long /u/ and *then* the /s/.
      return {
        phoneme: { ...last, onset: 'none', coda: owed === 0 ? last.coda : 'none' },
        tie: true,
        word,
      };
    }

    // A phrase begins on a word, never in the middle of one. The breath is
    // where a listener hears the boundary, so putting one inside a word is the
    // fastest way to unmake the word.
    if (syl.phraseStart) {
      for (let n = 0; n < line.length && !line[cursor % line.length]!.wordStart; n++) cursor++;
    }

    const beat = line[cursor % line.length]!;
    cursor++;
    owed = syllableWeight(beat.syllable) - 1;
    last = beat.syllable;
    if (beat.wordStart) word++;
    return {
      phoneme: owed === 0 ? beat.syllable : { ...beat.syllable, coda: 'none' },
      tie: false,
      word,
    };
  };
}
