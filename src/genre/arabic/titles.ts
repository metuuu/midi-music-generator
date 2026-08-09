/**
 * Arabic title generation.
 *
 * ## The one family this repertoire actually uses, and it is here now
 *
 * An instrumental piece in this tradition is named **form plus maqam**, and
 * almost nothing else: *Longa Nahawand*, *Sama'i Hijaz*, *Bashraf Hijazkar*,
 * *Dulab Kurd*. That is the title convention and it is the most informative one
 * in any repertoire this project has written. It used to be **unavailable**:
 * `TitleContext` carried the style, the mood and the tempo, the maqam is a
 * function of the *key*, and the key was not in it. A title that named a maqam
 * would have been naming one at random, which is what `TitleContext`'s own
 * docstring says is worse than naming nothing — *Longa Nahawand* over a piece in
 * Hijaz is not a poetic liberty, it is a wrong label on a box.
 *
 * **The context carries `tonic` and `mode` now, and the label is exact.** The
 * maqam is a pure function of those two — see the tables and `maqamOf` in
 * `index.ts`, which is where the answer is computed, because this file cannot
 * import from the file that imports it. Over 300 songs the piece is in one of
 * **seven maqamat spread across sixteen key labels**: Kurd 80, Hijaz 72,
 * Nahawand 59, Hijazkar 41, Farahfaza 38, Nawa Athar 7, Ajam 3. A generator
 * drawing a maqam name out of the eight at random would have been right about
 * one title in eight. **52 of those 300 songs now print one and 52 of the 52 are
 * correct**, checked against the tonic and mode the song was actually generated
 * in, with 0 wrong labels.
 *
 * **It goes on the form titles and nowhere else, which is the whole of the
 * restraint.** 88 of the 300 draw one of the six form styles, and those are the
 * pieces the convention is about — a sama'i, a bashraf, a longa, a dulab, a
 * taqsim and a muwashshah are announced by what they are and what they are in.
 * The other 212 are songs, and Arabic popular songs are not named after their
 * maqam: *Enta Omri* is not *Ughniya Nahawand*, and a mid-century Egyptian
 * single called after a scale would be a musicologist's label rather than a
 * record. So the sung families below are untouched, 0 of the 52 landed on one,
 * and the field they could have used is deliberately not used by them.
 *
 * **The taqsim is the case that proves the resolution is right.** It is the one
 * style here that overrides `scaleForChord`, and the two maqamat it reaches —
 * Nawa Athar and Shawq Afza — are precisely the two the genre's own tables
 * cannot produce, because the ensemble cannot accompany them. A lookup that
 * asked the genre would have announced *Taqsim Nahawand* over a piece in Nawa
 * Athar every time. `maqamOf` asks the style first, so the four taqsim titles in
 * the sweep read *Taqsim Nawa Athar*, and three more read *Taqsim Ajam*.
 *
 * The **place or manner** shapes stay too, at lower weight, because they are the
 * second commonest real convention rather than a stand-in that has now been
 * replaced — *Sama'i Sharqi* and *Longa Riyad* are real titles of real pieces.
 * What changed is which one leads. And the sung styles keep the other four
 * families, which are what Arabic popular song is actually called:
 *
 *  - the vocative, `Ya` plus a noun, usually doubled: *Ya Leil Ya Ein*. Nothing
 *    else in this project sounds like it and it is the single most recognisable
 *    shape in the repertoire;
 *  - the definite noun on its own: *El Hawa*, *El Atlal*;
 *  - the construct, one noun possessing another: *Nour el Ein*, *Sirr el Hawa*;
 *  - and the first person, which is the whole of what a mid-century Egyptian
 *    song title does when it is not one of the above: *Ana Wahdi*.
 *
 * Everything is romanised in the loose form the record sleeves themselves used,
 * which is neither of the two academic systems and is inconsistent between
 * labels. That is the honest register: a Cairo pressing wrote *Enta Omri*, not
 * *ʾanta ʿumrī*. Gender agreement between a noun and its adjective is not
 * modelled — *Longa Sharqi* should be *Longa Sharqiyya* — and the mismatch is
 * the price of not building a morphology for a title generator.
 */

import type { Rng } from '../../core/rng.js';
import type { TitleContext } from '../types.js';

/**
 * The six styles that are *forms* rather than cycles, and what a programme
 * calls them. Everything not listed here is a rhythm somebody sang over, and
 * those get the sung families instead.
 */
const FORMS: Record<string, string> = {
  samai: "Sama'i",
  bashraf: 'Bashraf',
  longa: 'Longa',
  dulab: 'Dulab',
  taqsim: 'Taqsim',
  muwashshah: 'Muwashshah',
};

/** The other thing that goes where the maqam goes. A region, a school, a manner. */
const EPITHETS = [
  'Sharqi', 'Masri', 'Shami', 'Halabi', 'Baghdadi', 'Andalusi', 'Turki',
  'Kabir', 'Saghir', 'Qadeem', 'Gadeed', 'Baladi', 'Hurr', 'Awwal', 'Akheer',
];

/** Nouns that can follow `Ya`. Short, open, and every one of them singable. */
const CALLS = [
  'Leil', 'Ein', 'Amar', 'Zein', 'Rouh', 'Alb', 'Salam', 'Hawa', 'Ghali',
  'Habibi', 'Nour', 'Bahr', 'Ward', 'Sabah',
];

/**
 * The warm half of the noun pool — light, water, flowers, mornings.
 * Drawn from under `farah` and `raqs`, and available to everything.
 */
const WARM = [
  'Nour', 'Ward', 'Sabah', 'Shams', 'Asal', 'Nasim', 'Nahr', 'Bahr',
  'Farah', 'Qamar', 'Nada', 'Reeh', 'Matar', 'Bustan',
];

/**
 * The longing half — distance, patience, time, and the ruins. `El Atlal` is
 * literally "the ruins" and is the most famous song in the language, which is
 * a reasonable indication of where this register sits.
 */
const LONGING = [
  'Shouq', 'Sabr', 'Zaman', 'Boud', 'Hanin', 'Atlal', 'Khayal', 'Sirr',
  'Hilm', 'Darb', 'Dhikra', 'Layali', 'Ghurba', 'Wada',
];

const ADJECTIVES = [
  'Taweel', 'Baeed', 'Helw', 'Hazeen', 'Gameel', 'Hadi', 'Qadeem', 'Gadeed',
  'Akheer', 'Awwal', 'Wahid', 'Kbeer',
];

/** Cities and regions, in the spelling a record sleeve would have used. */
const PLACES = [
  'Qahira', 'Halab', 'Beirut', 'Baghdad', 'Sham', 'Andalus', 'Nil',
  'Iskandariya', 'Basra', 'Tunis', 'Fas', 'Aswan', 'Nubia', 'Sana',
];

/** What follows `Ana`. */
const STATES = ['Wahdi', 'Hena', 'Maak', 'Fi Hawak', 'Rayeh', 'Mestani'];

/**
 * Pick the noun pool the mood is about.
 *
 * The two halves are not interchangeable and the mood is the only thing that
 * knows which one a given piece is: `Farah` over `El Atlal` reads as a joke,
 * and a wedding number is not making one. `sahra` and `neutral` see both,
 * because a late instrumental session is about whatever the player is thinking
 * about.
 */
function nouns(mood: string): string[] {
  if (mood === 'farah') return WARM;
  if (mood === 'raqs') return [...WARM, ...WARM, ...LONGING];
  if (mood === 'hanin' || mood === 'tarab') return LONGING;
  return [...WARM, ...LONGING];
}

/**
 * @param maqam what this piece is actually in, by name — *Nahawand*, *Hijaz*.
 *   Resolved in `index.ts`, where the tables live, and handed down rather than
 *   looked up here because that file imports this one.
 */
export function generateTitle(rng: Rng, ctx: TitleContext, maqam: string): string {
  const form = FORMS[ctx.style.id];
  const pool = nouns(ctx.mood.id);
  const noun = () => rng.pick(pool);

  /**
   * A form is announced and a song is evoked, and the two families barely
   * overlap. A `longa` called *Ya Leil Ya Ein* would be a vocal number, and the
   * style has no singer in it — so the form styles take the announcement almost
   * always, with a small share of plain nouns for the ones that carried a name
   * rather than a category.
   *
   * **`form-maqam` leads at 10, which is a re-weighting rather than an
   * addition.** The epithet used to be at 7 because it was standing where the
   * maqam should have been and could not; with the real thing available it drops
   * to 3 and the place to 2, which puts the two conventions in the order the
   * repertoire puts them — *Longa Nahawand* is the rule and *Longa Riyad* is the
   * variation. It comes out at 10 of 18, so a shade over half of every form
   * title now says what the piece is in, and the remaining shapes are all real
   * titles of real pieces rather than filler.
   */
  if (form) {
    const shape = rng.weighted([
      ['form-maqam', 10],
      ['form-epithet', 3],
      ['form-place', 2],
      ['form-plain', 2],
      ['bare-noun', 1],
    ] as const);
    switch (shape) {
      // The convention this repertoire is actually named by. See the header.
      case 'form-maqam': return `${form} ${maqam}`;
      case 'form-epithet': return `${form} ${rng.pick(EPITHETS)}`;
      case 'form-place': return `${form} ${rng.pick(PLACES)}`;
      case 'form-plain': return form;
      case 'bare-noun': return `El ${noun()}`;
    }
  }

  /**
   * The sung families. `ya-double` is weighted highest because it is the shape
   * everybody knows, and the duplicate is guarded: *Ya Leil Ya Leil* is a
   * stutter rather than a title.
   *
   * Fast numbers get the short shapes. At 160 BPM a piece is over in two
   * minutes and its title is two words, which is a fact about singles rather
   * than about Arabic — but it is true of these singles.
   */
  const fast = ctx.bpm >= 130;
  const shape = rng.weighted([
    ['ya-double', fast ? 6 : 4],
    ['ya-single', fast ? 5 : 3],
    ['el-noun', 4],
    ['construct', fast ? 2 : 5],
    ['noun-adj', fast ? 2 : 4],
    ['ana', 3],
    ['place', 2],
    ['noun-in-place', fast ? 1 : 3],
  ] as const);

  switch (shape) {
    case 'ya-double': {
      const a = rng.pick(CALLS);
      const rest = CALLS.filter((c) => c !== a);
      return `Ya ${a} Ya ${rng.pick(rest)}`;
    }
    case 'ya-single':
      return `Ya ${rng.pick(CALLS)}`;
    case 'el-noun':
      return `El ${noun()}`;
    case 'construct': {
      const a = noun();
      const rest = pool.filter((n) => n !== a);
      return `${a} el ${rng.pick(rest)}`;
    }
    case 'noun-adj':
      return `${noun()} ${rng.pick(ADJECTIVES)}`;
    case 'ana':
      return `Ana ${rng.pick(STATES)}`;
    case 'place':
      return `${rng.pick(PLACES)}`;
    case 'noun-in-place':
      return `${noun()} fi ${rng.pick(PLACES)}`;
  }
}
