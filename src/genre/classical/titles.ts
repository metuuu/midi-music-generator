/**
 * Title generation.
 *
 * This repertoire titles itself in two registers and both of them are
 * *announcements* rather than images, which is unusual — iskelmä and jazz both
 * lean on imagery and only sometimes say what the band is playing. Almost every
 * piece here says what it is:
 *
 *   **The catalogue title.** The name of the form, and an opus number.
 *   *Gavotte*, *Fugue*, *Nocturne, Op. 27 No. 2*. The form is the title, which is
 *   why the pool below is keyed on style id and every style has an entry —
 *   where iskelmä's dance words are a special case covering four styles out of
 *   seven, here they are the rule.
 *
 *   **The tempo-and-character marking.** *Andante cantabile*, *Allegro con
 *   brio*, *Lento e mesto*. This is the other half of how the repertoire names
 *   itself, and it is the register that uses exactly the two things
 *   `TitleContext` carries: the tempo actually chosen, and the mood.
 *
 * ## Why the tempo word has to be computed rather than looked up
 *
 * `ctx.bpm` is in **quarter notes**, and a tempo marking describes the beat
 * anybody is counting, which in compound metre is a dotted quarter and in cut
 * time is a half. A gigue at 152 to the quarter is *Allegro* at 101 dotted
 * quarters and would be marked *Prestissimo* by anything that read the number
 * literally — and a wrong tempo word is exactly the error iskelmä's file guards
 * against with its dance names: "Satumaan valssi" in 4/4 is not a poetic
 * liberty, it is a mistake, and so is *Presto* on a sarabande.
 *
 * So the pulse is derived from the style's own grouping. A style whose groups
 * are all six sixteenths is counted in dotted quarters, so the felt pulse is
 * `bpm / 1.5`; one grouped in eights is cut time, so it is `bpm / 2`; anything
 * else is counted in quarters. Every style in the catalogue is one of those
 * three, and the fallback is the quarter.
 *
 * ## What is deliberately absent
 *
 * **The key.** Half the real titles in this repertoire name one — *Prelude in
 * C minor* — and `TitleContext` carries `style`, `mood` and `bpm` and not the
 * tonic. That is a gap in the context rather than in the pool, and it is not
 * worth widening a shared interface for: a title that names the wrong key would
 * be worse than one that names none, and adding the field would put a spelling
 * decision (is it C♯ or D♭?) into a type that has managed four genres without
 * one.
 */

import type { Rng } from '../../core/rng.js';
import type { TitleContext } from '../types.js';

/**
 * The form's own name, keyed by style id. Every style has one; that is what
 * makes this genre's titles different from every other genre's here.
 *
 * `article` is the French or Italian form where the repertoire uses it, and it
 * is used by the character-title pattern only — *Deux Arabesques* is not a
 * pattern this generates, but *La Sarabande* would be wrong and *Sarabande* is
 * right, so the field carries the piece's own preference rather than a rule.
 */
const FORMS: Record<string, string> = {
  minuet: 'Minuet',
  gavotte: 'Gavotte',
  sarabande: 'Sarabande',
  gigue: 'Gigue',
  passacaglia: 'Passacaglia',
  chaconne: 'Chaconne',
  fugue: 'Fugue',
  chorale: 'Chorale Prelude',
  toccata: 'Toccata',
  overture: 'Overture',
  aria: 'Aria',
  pavane: 'Pavane',
  sonata: 'Sonata',
  rondo: 'Rondo',
  adagio: 'Adagio',
  scherzo: 'Scherzo',
  march: 'March',
  nocturne: 'Nocturne',
  waltz: 'Waltz',
  mazurka: 'Mazurka',
  polonaise: 'Polonaise',
  barcarolle: 'Barcarolle',
  berceuse: 'Berceuse',
  etude: 'Étude',
  lacrimosa: 'Lacrimosa',
  prelude: 'Prelude',
};

/**
 * Tempo words, as a ladder of floors in *felt* beats per minute.
 *
 * Read from the top down and the first floor the pulse clears wins. The bands
 * are the conventional ones and the boundaries are where the argument always
 * is — 108 for *Allegretto* and 120 for *Allegro* are Maelzel's, near enough,
 * and nobody has ever agreed about *Andante*.
 */
const TEMPI: (readonly [number, string])[] = [
  [168, 'Presto'],
  [148, 'Vivace'],
  [120, 'Allegro'],
  [104, 'Allegretto'],
  [88, 'Moderato'],
  [70, 'Andante'],
  [58, 'Adagio'],
  [46, 'Largo'],
  [0, 'Grave'],
];

/**
 * The character word that follows the tempo, per mood.
 *
 * Two or three each, because the pair *tempo + character* is the whole pattern
 * and a mood with one qualifier would produce the same title every time. Every
 * one of these is a marking somebody has actually written at the top of a score.
 */
const CHARACTERS: Record<string, string[]> = {
  maestoso: ['maestoso', 'con maestà', 'pomposo'],
  cantabile: ['cantabile', 'espressivo', 'dolce'],
  giocoso: ['giocoso', 'scherzando', 'con grazia'],
  mesto: ['mesto', 'dolente', 'lagrimoso'],
  agitato: ['agitato', 'con fuoco', 'appassionato'],
  brillante: ['brillante', 'con brio', 'risoluto'],
  tranquillo: ['tranquillo', 'sereno', 'placido'],
  misterioso: ['misterioso', 'velato', 'sospeso'],
  ordinario: ['ma non troppo', 'semplice', 'sostenuto'],
};

/**
 * The number a piece is filed under.
 *
 * Opus numbers in this repertoire run roughly 1–120 and the low ones are far
 * commoner than the high ones, because most composers died before they got
 * there. Weighted to match rather than drawn flat, which costs one line and is
 * the difference between *Op. 9* and *Op. 113* being equally likely.
 */
function opus(rng: Rng): number {
  const band = rng.weighted([[1, 5], [2, 4], [3, 2], [4, 1]] as const);
  return rng.int(1, 30) + (band - 1) * 30;
}

/**
 * The beat somebody is actually counting, in beats per minute.
 *
 * See the header. `groups` is the only thing that can answer this: a bar of
 * three quarters grouped `[6, 6]` is 6/8 and is counted in two, and no amount of
 * looking at `beatsPerBar` recovers that.
 */
function feltPulse(ctx: TitleContext): number {
  const groups = ctx.style.groups;
  if (!groups?.length) return ctx.bpm;
  const first = groups[0]!;
  // Every group the same length, or the grouping says nothing about the pulse.
  if (!groups.every((g) => g === first)) return ctx.bpm;
  // A group is measured in sixteenths; four of them is a quarter note.
  return ctx.bpm / (first / 4);
}

function tempoWord(ctx: TitleContext): string {
  const pulse = feltPulse(ctx);
  for (const [floor, word] of TEMPI) if (pulse >= floor) return word;
  return 'Grave';
}

type Pattern = 'form' | 'form-opus' | 'form-opus-no' | 'marking' | 'form-marking';

export function generateTitle(rng: Rng, ctx: TitleContext): string {
  const form = FORMS[ctx.style.id] ?? 'Piece';
  const tempo = tempoWord(ctx);
  const character = rng.pick(CHARACTERS[ctx.mood.id] ?? CHARACTERS.ordinario!);

  /**
   * The plain form name carries real weight and is not a fallback.
   *
   * *Sarabande* is a complete title and always has been — it is what is printed
   * over the movement in a suite, and adding an opus number to it would be
   * claiming the piece is a standalone publication rather than the fourth
   * movement of one.
   */
  const patterns: (readonly [Pattern, number])[] = [
    ['form', 5],
    ['form-opus', 4],
    ['form-opus-no', 3],
    ['marking', 4],
    ['form-marking', 3],
  ];

  switch (rng.weighted(patterns)) {
    case 'form':
      return form;
    case 'form-opus':
      return `${form}, Op. ${opus(rng)}`;
    case 'form-opus-no':
      return `${form}, Op. ${opus(rng)} No. ${rng.int(1, 6)}`;
    case 'marking':
      return `${tempo} ${character}`;
    case 'form-marking':
      return `${form} (${tempo} ${character})`;
  }
}
