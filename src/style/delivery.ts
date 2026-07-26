/**
 * Delivery — how the voice performs, as opposed to who it is.
 *
 * The signature is the instrument; this is the playing. The same person can
 * recite, mutter, croon or belt, and none of those change their vocal tract by
 * a millimetre. Keeping the two apart means seven signatures times seven
 * deliveries is forty-nine voices to audition rather than forty-nine tables to
 * write.
 *
 * Three fields here carry nearly all of the difference between "talking" and
 * "singing", and it is worth naming them because the intuitive answer is wrong.
 * The intuitive answer is *pitch* — singing is on notes and talking is not. But
 * a monotone chant is unmistakably singing and an excited question rises a
 * fifth, so pitch cannot be it. What actually separates them:
 *
 *  - **`legato`** — where the silence goes. Speech has no silence between the
 *    syllables of a word; the mouth moves through them continuously and the
 *    consonants do the dividing. Put a gap between every syllable and you get
 *    "duu du du duu" no matter how good the vowels are, because that is not how
 *    any mouth works. This is the field that fixes it, and it is the reason a
 *    voice can sound sung rather than played.
 *  - **`melisma`** — whether a syllable is allowed to outlast its note. Speech
 *    never does this and singing does it constantly; one vowel gliding across
 *    three pitches is the most purely *musical* thing a voice does, and no
 *    instrument doubling the same line can imitate it.
 *  - **`flatten`** — how much of the written tune survives. At 0 the voice
 *    sings the notes. At 1 it ignores them entirely and recites on its own
 *    centre with a speech intonation contour on top, which is what talking is.
 *    Everything between is Sprechgesang, and the interesting settings are
 *    nearer 1 than you would guess.
 */

export type DeliveryId =
  | 'sung' | 'ballad' | 'syllabic' | 'talk-sing' | 'spoken' | 'chant' | 'whisper';

export interface Delivery {
  id: DeliveryId;
  label: string;
  gloss: string;
  /**
   * `metric` puts syllables on the beat grid, subdividing the written notes.
   * `speech` ignores the written rhythm entirely and lays syllables at a rate
   * per second, because speech is not in tempo with anything and quantising it
   * to a grid is instantly audible as a rap rather than as talking.
   */
  timing: 'metric' | 'speech';
  /** Metric timing: how often the mouth re-opens, in beats. */
  syllableBeats: number;
  /** Speech timing: syllables per second. Conversation runs about 5 to 7. */
  syllableRate: number;
  /**
   * How joined syllables are *inside a word*, 0..1.
   *
   * At 1 there is no silence at all and the syllable boundary is a dip in
   * level plus the consonant — which is what a mouth does. At 0 every syllable
   * is cut short and the line is a row of blips.
   */
  legato: number;
  /** Silence at a word boundary, as a fraction of one syllable slot. */
  wordGap: number;
  /** Silence at a phrase boundary — the breath. Fraction of a slot. */
  breathGap: number;
  /** 0 = sing the written pitches; 1 = ignore them and recite on the centre. */
  flatten: number;
  /**
   * Span of the speech intonation contour, in semitones.
   *
   * Only audible where `flatten` is doing something. A recited line still moves
   * — stresses lift, the pitch drifts down across a phrase, and the last
   * syllable of a statement falls. Take that away and you get a robot, which is
   * the other way a synthetic voice announces itself.
   */
  intonation: number;
  /** Chance a syllable is held across the next note instead of a new one. */
  melisma: number;
  /** How far below the note the voice starts, in semitones, and for how long. */
  scoop: number;
  scoopTime: number;
  /** Multiplies the signature's vibrato depth. Speech has essentially none. */
  vibrato: number;
  /** Extra duration and level on a stressed syllable, as fractions. */
  stressLength: number;
  stressLevel: number;
  /** Amplitude envelope, seconds (sustain is a level, 0..1). */
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  /**
   * How far the level dips at a joined syllable boundary, 0..1 — 1 is no dip.
   *
   * This is the articulation that replaces the silence when `legato` is high.
   * A syllable boundary inside a word is a real event even though nothing goes
   * quiet: the mouth constricts, the level drops a few dB, and it comes back.
   * Without it a legato word is one long smeared vowel.
   */
  articulation: number;
  /**
   * How long the formants take to move to the next vowel, seconds.
   *
   * The mouth has mass. Fast speech glides in about 30 ms and a held sung vowel
   * takes 100, and the glide is not a defect to be minimised — it is the
   * diphthong, and it is most of why connected speech sounds connected.
   */
  glide: number;
  /**
   * How much of the source is voiced, 0..1. Below about 0.15 the folds are not
   * closing and the result is a whisper: the vowels are still perfectly
   * intelligible, because the tract is still shaping them, but there is no
   * pitch to sing with.
   */
  voiced: number;
}

const DELIVERY_LIST: Delivery[] = [
  {
    id: 'sung',
    label: 'Sung',
    gloss: 'On the notes, joined inside each word, with room for a syllable to run across a note.',
    timing: 'metric',
    syllableBeats: 1,
    syllableRate: 3,
    legato: 0.9,
    wordGap: 0.35,
    breathGap: 0.7,
    flatten: 0,
    intonation: 0,
    melisma: 0.28,
    scoop: 1.1,
    scoopTime: 0.07,
    vibrato: 1,
    stressLength: 0.25,
    stressLevel: 0.18,
    attack: 0.016,
    decay: 0.09,
    sustain: 0.9,
    release: 0.09,
    articulation: 0.55,
    glide: 0.07,
    voiced: 1,
  },
  {
    id: 'ballad',
    label: 'Ballad',
    gloss: 'Half the syllable rate, twice the melisma. One long line per breath.',
    timing: 'metric',
    syllableBeats: 2,
    syllableRate: 2,
    legato: 0.97,
    wordGap: 0.25,
    breathGap: 0.6,
    flatten: 0,
    intonation: 0,
    melisma: 0.45,
    scoop: 0.9,
    scoopTime: 0.11,
    vibrato: 1.3,
    stressLength: 0.3,
    stressLevel: 0.14,
    attack: 0.045,
    decay: 0.18,
    sustain: 0.95,
    release: 0.3,
    articulation: 0.7,
    glide: 0.11,
    voiced: 1,
  },
  {
    id: 'syllabic',
    label: 'Syllabic',
    gloss: 'A gap after every syllable — the blipped, wordless sound the song engine makes today.',
    timing: 'metric',
    syllableBeats: 1,
    syllableRate: 3,
    legato: 0.1,
    wordGap: 0.3,
    breathGap: 0.5,
    flatten: 0,
    intonation: 0,
    melisma: 0,
    scoop: 1.2,
    scoopTime: 0.07,
    vibrato: 1,
    stressLength: 0.1,
    stressLevel: 0.15,
    attack: 0.015,
    decay: 0.09,
    sustain: 0.9,
    release: 0.06,
    articulation: 0.4,
    glide: 0.05,
    voiced: 1,
  },
  {
    id: 'talk-sing',
    label: 'Talk-sing',
    gloss: 'Half the tune, half the speech contour, faster syllables. Sprechgesang.',
    timing: 'metric',
    syllableBeats: 0.5,
    syllableRate: 4.5,
    legato: 0.85,
    wordGap: 0.45,
    breathGap: 0.9,
    flatten: 0.5,
    intonation: 3.5,
    melisma: 0.06,
    scoop: 0.5,
    scoopTime: 0.04,
    vibrato: 0.3,
    stressLength: 0.4,
    stressLevel: 0.3,
    attack: 0.01,
    decay: 0.06,
    sustain: 0.82,
    release: 0.05,
    articulation: 0.45,
    glide: 0.045,
    voiced: 1,
  },
  {
    id: 'spoken',
    label: 'Spoken',
    gloss: 'Off the grid entirely: syllables per second, own intonation, no tune at all.',
    timing: 'speech',
    syllableBeats: 0.5,
    syllableRate: 5.6,
    legato: 0.92,
    wordGap: 0.4,
    breathGap: 1.4,
    flatten: 1,
    intonation: 4.5,
    melisma: 0,
    scoop: 0.35,
    scoopTime: 0.025,
    vibrato: 0.06,
    stressLength: 0.5,
    stressLevel: 0.35,
    attack: 0.008,
    decay: 0.05,
    sustain: 0.78,
    release: 0.04,
    articulation: 0.35,
    glide: 0.03,
    voiced: 1,
  },
  {
    id: 'chant',
    label: 'Chant',
    gloss: 'One reciting tone, joined all the way through, barely any contour. Liturgical.',
    timing: 'metric',
    syllableBeats: 0.5,
    syllableRate: 3.5,
    legato: 1,
    wordGap: 0.2,
    breathGap: 1.2,
    flatten: 0.9,
    intonation: 1.2,
    melisma: 0.12,
    scoop: 0.2,
    scoopTime: 0.05,
    vibrato: 0.35,
    stressLength: 0.2,
    stressLevel: 0.12,
    attack: 0.03,
    decay: 0.1,
    sustain: 0.95,
    release: 0.22,
    articulation: 0.7,
    glide: 0.06,
    voiced: 1,
  },
  {
    id: 'whisper',
    label: 'Whisper',
    gloss: 'Folds open, tract still shaping. Every vowel intelligible, no pitch behind it.',
    timing: 'speech',
    syllableBeats: 0.5,
    syllableRate: 4.8,
    legato: 0.95,
    wordGap: 0.4,
    breathGap: 1.5,
    flatten: 1,
    intonation: 2,
    melisma: 0,
    scoop: 0,
    scoopTime: 0.02,
    vibrato: 0,
    stressLength: 0.45,
    stressLevel: 0.3,
    attack: 0.02,
    decay: 0.06,
    sustain: 0.8,
    release: 0.08,
    articulation: 0.4,
    glide: 0.035,
    voiced: 0.04,
  },
];

export const DELIVERIES: Record<DeliveryId, Delivery> = Object.fromEntries(
  DELIVERY_LIST.map((d) => [d.id, d]),
) as Record<DeliveryId, Delivery>;

export const DELIVERY_ORDER: DeliveryId[] = DELIVERY_LIST.map((d) => d.id);

export function getDelivery(id: string): Delivery {
  const found = DELIVERIES[id as DeliveryId];
  if (!found) throw new Error(`Unknown delivery: ${id}`);
  return found;
}
