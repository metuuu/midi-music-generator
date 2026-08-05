/**
 * Drum and bass title generation.
 *
 * Ambient titles name a place, synth titles name a thing that moves or measures,
 * iskelmä titles name a feeling, funk titles give an instruction and hiphop
 * titles name a thing and then argue about which version of it this is. **Drum
 * and bass titles name one object, flatly, and then say which cut of it you are
 * holding.**
 *
 * The parenthetical is here for the same structural reason it is in hiphop and
 * it means something different, which is the interesting part. There it came
 * from the twelve-inch carrying a vocal, an instrumental and an a cappella, so
 * the title had to be qualified before it identified anything. Here it comes
 * from the **dubplate**: a one-off acetate cut for one DJ, so that the version
 * being played in a room is provably not the version anybody can buy. `(VIP)` is
 * the producer's own alternative cut, made for their own set and often never
 * pressed at all. Those are not variants of a record — they are the reason the
 * record has a following, and the qualifier is doing sociology rather than
 * bookkeeping.
 *
 * Six families cover nearly all of it —
 *
 *  - **the bare noun**: one flat word, no article. The commonest shape in the
 *    genre by a distance, and the joke is that a music this physical labels
 *    itself like a piece of laboratory equipment.
 *  - **the definite noun**, the same thing with `the` in front.
 *  - **the compound**: an adjective and a noun, both of them cold.
 *  - **the sector**: a word and a number, which is this repertoire's version of
 *    hiphop's block — a coordinate rather than a place, and never a city.
 *  - **the technical term**: one word borrowed from a manual.
 *  - **the white label**, which is the shape a record has when it has no title
 *    at all: a plate number and a side. Half of what got played in 1995 was
 *    known this way and some of it still is.
 *
 * ## Why the tags are filtered
 *
 * `TitleContext` exists because an announcement that disagrees with the music is
 * worse than no announcement — the type's own doc says so about a bossa called a
 * swing. `(Amen Mix)` is a factual claim about which break is on the record, so
 * it is available only to the sixteen styles that sample one; `(Halftime Mix)`
 * claims the drums are at half speed, which is true of one style and false of
 * twenty-three; and `(Dubplate)` is anachronistic on anything after about 2005,
 * which the tempo cannot detect and the style can. `(VIP)` and `(Remix)` are the
 * two that are available everywhere, because those two are true of anything.
 *
 * The **white label** family is struck for the styles that are self-consciously
 * commercial. A dancefloor record with a marketing budget did not go out as an
 * untitled plate, and a title claiming it did would be the same kind of error as
 * a screwed tag on a 140 BPM record.
 *
 * Nothing here reproduces an actual title. Every vocabulary is deliberately one
 * word to the side of the famous ones, so an output reads as belonging to this
 * repertoire without having been taken from it.
 */

import type { Rng } from '../../core/rng.js';
import type { TitleContext } from '../types.js';

/** One flat word. The commonest shape in the genre. */
const NOUNS = [
  'terminus', 'lattice', 'ordnance', 'meridian', 'ballast', 'aperture',
  'quarantine', 'substrate', 'vector', 'foundry', 'reservoir', 'cortex',
  'flux', 'threshold', 'radiant', 'undertow', 'archive', 'relay', 'monolith',
  'sediment', 'filament', 'anchorage', 'corrosion', 'pressure',
];

/** Adjectives for the compound. None of them is warm. */
const ADJECTIVES = [
  'cold', 'iron', 'dark', 'blunt', 'low', 'hollow', 'grey', 'deep', 'blind',
  'wet', 'sunken', 'quiet', 'narrow', 'raw', 'sheer', 'still', 'hard', 'far',
];

/** …and the noun it lands on. Concrete, and never a person. */
const COMPOUND_NOUNS = [
  'weather', 'signal', 'harbour', 'circuit', 'district', 'machine', 'water',
  'traffic', 'science', 'transit', 'city', 'season', 'engine', 'silence',
  'geometry', 'winter', 'orbit', 'current', 'iron', 'glass',
];

/** A coordinate rather than a place. Never a city. */
const SECTORS = [
  'sector', 'quadrant', 'level', 'zone', 'block', 'grid', 'unit', 'phase',
  'stage', 'depot', 'corridor', 'chamber', 'bay',
];

const NUMBERS = ['two', 'three', 'four', 'five', 'six', 'seven', 'nine', 'twelve', 'zero'];

/** One word borrowed from a manual. */
const TECHNICAL = [
  'attenuation', 'resonance', 'hysteresis', 'parallax', 'saturation',
  'coefficient', 'tolerance', 'inertia', 'aperture', 'diffusion', 'transient',
  'amplitude', 'decay', 'threshold', 'displacement', 'convection',
];

/** What a plate is called when nobody has named it. */
const PLATE_SIDES = ['A1', 'A2', 'B1', 'B2', 'AA'];

/**
 * The parenthetical, and the three pools are three different kinds of claim.
 *
 * `NEUTRAL_TAGS` are true of anything. `BREAK_TAGS` claim which drums are on the
 * record. `PERIOD_TAGS` claim how it was cut, and are struck after 2005 for the
 * same reason hiphop strikes `(Screwed)` above 100 BPM.
 */
const NEUTRAL_TAGS = ['VIP', 'Remix', 'Refix', 'Original Mix', 'Rework'];
const BREAK_TAGS = ['Amen Mix', 'Roller Mix', 'Edit'];
const PERIOD_TAGS = ['Dubplate', 'Test Press', 'Acetate'];

/** The sixteen styles whose drums are a recording of a person. See `styles.ts`. */
const SAMPLES_A_BREAK = new Set([
  'hardcore', 'darkcore', 'jungle', 'ragga', 'hardstep', 'jazzstep',
  'atmospheric', 'intelligent', 'drumfunk', 'liquid', 'rollers', 'sambass',
  'breakcore', 'dubwise', 'deep', 'revival',
]);

/** The styles that were never going out as an untitled plate. */
const HAD_A_BUDGET = new Set(['dancefloor', 'jumpup', 'bleep', 'liquid']);

function capitalise(s: string): string {
  return s.replace(/(^|[ -])([a-z])/g, (_, sep: string, c: string) => sep + c.toUpperCase());
}

export function generateTitle(rng: Rng, ctx: TitleContext): string {
  const plated = !HAD_A_BUDGET.has(ctx.style.id);

  const base = rng.weighted([
    ['bare-noun', 8],
    ['the-noun', 5],
    ['compound', 6],
    ['sector', 4],
    ['technical', 4],
    ['white-label', plated ? 3 : 0],
  ] as const);

  const title = ((): string => {
    switch (base) {
      // One flat word, no article. See the header on why the flatness is the
      // joke.
      case 'bare-noun':
        return capitalise(rng.pick(NOUNS));
      case 'the-noun':
        return capitalise(`the ${rng.pick(NOUNS)}`);
      case 'compound':
        return capitalise(`${rng.pick(ADJECTIVES)} ${rng.pick(COMPOUND_NOUNS)}`);
      // A coordinate. Never a city.
      case 'sector':
        return capitalise(`${rng.pick(SECTORS)} ${rng.pick(NUMBERS)}`);
      case 'technical':
        return capitalise(rng.pick(TECHNICAL));
      // What a record is called when it has no title: a plate number and a side.
      case 'white-label':
        return `Plate ${rng.int(1, 40)}${rng.chance(0.5) ? '' : ` ${rng.pick(PLATE_SIDES)}`}`;
    }
  })();

  /**
   * …and then which cut of it this is.
   *
   * A third of the time, which is roughly the rate at which a catalogue of this
   * music consists of somebody's alternative version of somebody's record. The
   * white-label titles never take one, because a plate number and a mix name in
   * the same line is two ways of saying the record has no name.
   */
  if (base === 'white-label') return title;

  const pool = [
    ...NEUTRAL_TAGS,
    ...(SAMPLES_A_BREAK.has(ctx.style.id) ? BREAK_TAGS : []),
    ...(ctx.style.id === 'halftime' ? ['Halftime Mix'] : []),
    ...(plated && ctx.bpm < 178 ? PERIOD_TAGS : []),
  ];
  return rng.chance(0.33) ? `${title} (${rng.pick(pool)})` : title;
}
