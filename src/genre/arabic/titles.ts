/**
 * Arabic title generation.
 *
 * ## The one family this repertoire actually uses, and why it is not here
 *
 * An instrumental piece in this tradition is named **form plus maqam**, and
 * almost nothing else: *Longa Nahawand*, *Sama'i Bayati*, *Bashraf Hijazkar*,
 * *Dulab Rast*. That is the title convention, it is the most informative one in
 * any repertoire this project has written, and it is **unavailable** — because
 * `TitleContext` carries the style, the mood and the tempo, and the maqam is a
 * function of the *key*, which is not in it. A title that named a maqam would be
 * naming one at random, and `TitleContext`'s own docstring says exactly what
 * that costs: an announcement that disagrees with the music is worse than no
 * announcement at all. *Longa Nahawand* over a piece in Hijaz is not a poetic
 * liberty, it is a wrong label on a box.
 *
 * So the form titles below take a **place or a manner** where the maqam should
 * be, which is the second commonest real convention — *Sama'i Sharqi*, *Longa
 * Riyad* — and the sung styles take the other four families, which are what
 * Arabic popular song is actually called:
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

/** Where the maqam's name would go. A region, a school, or a manner. */
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

export function generateTitle(rng: Rng, ctx: TitleContext): string {
  const form = FORMS[ctx.style.id];
  const pool = nouns(ctx.mood.id);
  const noun = () => rng.pick(pool);

  /**
   * A form is announced and a song is evoked, and the two families barely
   * overlap. A `longa` called *Ya Leil Ya Ein* would be a vocal number, and the
   * style has no singer in it — so the form styles take the announcement almost
   * always, with a small share of plain nouns for the ones that carried a name
   * rather than a category.
   */
  if (form) {
    const shape = rng.weighted([
      ['form-epithet', 7],
      ['form-place', 4],
      ['form-plain', 2],
      ['bare-noun', 2],
    ] as const);
    switch (shape) {
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
