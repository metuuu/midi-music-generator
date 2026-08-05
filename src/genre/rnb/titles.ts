/**
 * R&B title generation.
 *
 * Ambient titles name a place, synth titles name a thing that measures, iskelmä
 * titles name a feeling, funk titles give an instruction. **These are addressed
 * to somebody**, and that is the whole difference: nearly every family below has a
 * second person in it, either spoken to directly or implied by the pronoun, and
 * the ones that do not are the ones where the singer is describing what the other
 * person did.
 *
 * ## The bracket, which is this repertoire's Part Two
 *
 * Funk's titling has one structural habit that separates it from everything else
 * in the project — a fifth of its records are numbered, because a nine-minute
 * groove was cut across both sides of a single. This genre has exactly one habit
 * of the same standing and it is **the parenthetical subtitle**: a phrase in
 * brackets in front of or behind the hook, because the line everybody sings and
 * the line the publisher registered were frequently not the same line, and the
 * label printed both. It is on a startling proportion of these sleeves, it is on
 * almost nothing outside this repertoire and its neighbours, and it is weighted
 * here accordingly.
 *
 * Seven families cover nearly all the rest —
 *
 *  - the **address**: a term of endearment and a clause aimed at it. The single
 *    commonest shape and the one the bracket most often wraps.
 *  - the **pledge**, which is the address with the verb moved to the front and
 *    the singer promising something they may not be able to deliver.
 *  - the **abstract**, an adjective and an uncountable noun. This is where soul
 *    titling and iskelmä titling touch, and they touch and part in the adjective:
 *    both name a feeling, and only one of them names it as something being *done
 *    to* the singer.
 *  - the **contradiction**, two words that disagree. A real and much-used shape
 *    here and almost nowhere else, because the subject of a soul record is
 *    frequently a thing that is good and bad at once.
 *  - the **time and place**, which is always an hour or a room and never a
 *    country.
 *  - the **body**, and specifically the heart, the hands and the eyes — the three
 *    parts of a person this repertoire is willing to name.
 *  - the **report**, in the third person: what she did, what he said. The one
 *    family with no second person in it, and the one that produces the story
 *    songs.
 *
 * ## The mood filter, and why it is a mood rather than a tempo
 *
 * `TitleContext` exists because an announcement that disagrees with the music is
 * worse than no announcement — the type's own doc says so about a bossa called a
 * swing, and funk's file strikes its imperatives below 88 BPM on the same
 * grounds. Tempo is the wrong instrument here and the reason is specific: this
 * genre contains a 128 BPM gospel shout and a 128 BPM disco-soul record, and the
 * first one is a plea while the second one is an invitation. What separates them
 * is not how fast anybody is playing, it is **who is being addressed** — which is
 * exactly the axis `moods.ts` sorts on. So the invitation families are struck
 * under `ache` and `smoulder`, and the plea families are struck under `sweet`,
 * with tempo used only for the one case where it genuinely is the deciding
 * fact — nothing under 76 BPM invites anybody to dance.
 *
 * Nothing here reproduces an actual title. Every vocabulary is deliberately one
 * word to the side of the famous ones — the neighbouring endearment, the
 * neighbouring hour — so an output reads as belonging to this repertoire without
 * having been taken from it.
 */

import type { Rng } from '../../core/rng.js';
import type { TitleContext } from '../types.js';

/** What the singer calls the person they are singing at. */
const ENDEARMENTS = [
  'baby', 'darling', 'sugar', 'honey', 'sweetness', 'angel', 'lover',
  'pretty one', 'my love', 'sweet thing', 'girl', 'boy',
];

/** …and the clause aimed at it. Second person throughout. */
const CLAUSES = [
  'come back', 'stay a while', 'hold on', 'don’t go', 'take your time',
  'let me try', 'you know better', 'it’s not over', 'call me', 'be good to me',
  'you had it all', 'wait for me', 'let it be me', 'i can wait', 'talk to me',
  'you were right', 'come on home', 'i still would',
];

/** The pledge. A promise the record may not be able to keep. */
const PLEDGES = [
  'i’ll never', 'i would', 'you’ll always', 'we could', 'nobody could',
  'i couldn’t', 'you’d still', 'i’d rather', 'she never', 'i always',
];

const PLEDGE_TAILS = [
  'let you down', 'walk away', 'be enough', 'find the words', 'change my mind',
  'ask for more', 'get it back', 'say it twice', 'stop trying', 'make it right',
  'come that far', 'be the one',
];

/** Adjectives for a feeling that is being done to somebody. */
const ADJECTIVES = [
  'sweet', 'tender', 'quiet', 'slow', 'heavy', 'gentle', 'restless', 'patient',
  'foolish', 'stubborn', 'ordinary', 'careless', 'faithful', 'borrowed',
  'unfinished', 'reckless', 'hopeless', 'stolen', 'honest', 'lonesome',
];

/** …and the uncountable noun it is happening to. */
const FEELINGS = [
  'persuasion', 'devotion', 'satisfaction', 'affection', 'foolishness',
  'confusion', 'temptation', 'forgiveness', 'company', 'attention', 'patience',
  'weakness', 'inspiration', 'reassurance', 'consolation', 'longing',
  'understanding', 'trouble',
];

/** Two words that disagree. The shape this genre uses and nobody else does. */
const CONTRARIES = [
  ['bitter', 'sweetness'], ['cruel', 'kindness'], ['quiet', 'thunder'],
  ['cold', 'fire'], ['sweet', 'trouble'], ['gentle', 'ruin'],
  ['loud', 'silence'], ['soft', 'punishment'], ['kind', 'lie'],
  ['warm', 'winter'], ['patient', 'hunger'], ['tender', 'wound'],
] as const;

/** An hour, never a date. */
const HOURS = [
  'midnight', 'quarter to three', 'sunday morning', 'saturday night',
  'closing time', 'first light', 'friday night', 'the small hours',
  'four in the morning', 'last call',
];

/** A room or a way out of one. Never a country. */
const PLACES = [
  'the back porch', 'the corner booth', 'the kitchen table', 'the front step',
  'the last bus', 'the hallway', 'the parking lot', 'the coast road',
  'the fire escape', 'the record store', 'the church steps', 'the long way home',
];

/** The three parts of a person this repertoire will name. */
const BODY = [
  'heart', 'hands', 'eyes', 'shoulder', 'arms', 'voice', 'good name', 'letter',
];

/** What the third person did, for the story songs. */
const REPORTS = [
  'she never said', 'he took the long road', 'she kept the ring',
  'he wrote it down', 'she waited up', 'he never called', 'she paid the rent',
  'he sold the car', 'she knew all along', 'he came back tuesday',
];

/**
 * The bracket. Always a fragment rather than a sentence — the line the audience
 * shouts, printed beside the line the publisher registered.
 */
const BRACKETS = [
  'and i mean it', 'don’t you know', 'part of me', 'come on', 'every time',
  'like you used to', 'all over again', 'if you let me', 'one more time',
  'that’s all', 'so they tell me', 'while i still can', 'again',
];

function capitalise(s: string): string {
  return s.replace(/(^|[ -])([a-z])/g, (_, sep: string, c: string) => sep + c.toUpperCase());
}

/** The phrase a bracket gets attached to. Any of the plain families will do. */
function hook(rng: Rng): string {
  return rng.weighted([
    [`${rng.pick(ADJECTIVES)} ${rng.pick(FEELINGS)}`, 4],
    [rng.pick(CLAUSES), 4],
    [`${rng.pick(PLEDGES)} ${rng.pick(PLEDGE_TAILS)}`, 3],
    [`${rng.pick(ENDEARMENTS)}, ${rng.pick(CLAUSES)}`, 2],
    [`my ${rng.pick(BODY)}`, 2],
  ] as const);
}

export function generateTitle(rng: Rng, ctx: TitleContext): string {
  /**
   * Who is being addressed, which is the axis this genre's moods sort on and
   * therefore the one worth filtering titles by. See the header for why this is
   * not a tempo test the way it is next door.
   *
   * `inviting` is a record aimed at a room. `pleading` is one aimed at a person
   * who has left. `sweet` is the only mood that is neither, which is exactly what
   * an arranged radio single is, so both families thin out under it rather than
   * one of them winning.
   */
  const inviting = ctx.mood.id !== 'ache' && ctx.mood.id !== 'smoulder' && ctx.bpm >= 76;
  const pleading = ctx.mood.id !== 'sweet';

  const pattern = rng.weighted([
    // The bracket. This genre's structural habit, and the reason it is at the
    // top of the table rather than in it — see the header.
    ['bracketed', 7],
    ['address', inviting ? 6 : 4],
    ['pledge', pleading ? 6 : 3],
    ['abstract', 6],
    ['contradiction', 4],
    ['time-place', 4],
    ['body', pleading ? 4 : 2],
    ['report', 3],
    ['clause', pleading ? 3 : 2],
    ['possessive-feeling', 3],
    ['invitation', inviting ? 4 : 0],
  ] as const);

  switch (pattern) {
    /**
     * A phrase and a fragment in brackets, either way round. Both orders are
     * genuine and the leading bracket is the rarer and more characteristic one,
     * which is why it is a third of the draw rather than half.
     */
    case 'bracketed': {
      const h = capitalise(hook(rng));
      const b = rng.pick(BRACKETS);
      return rng.weighted([[`${h} (${capitalise(b)})`, 2], [`(${capitalise(b)}) ${h}`, 1]] as const);
    }
    case 'address':
      return capitalise(`${rng.pick(ENDEARMENTS)}, ${rng.pick(CLAUSES)}`);
    case 'pledge':
      return capitalise(`${rng.pick(PLEDGES)} ${rng.pick(PLEDGE_TAILS)}`);
    case 'abstract':
      return capitalise(`${rng.pick(ADJECTIVES)} ${rng.pick(FEELINGS)}`);
    // Two words that disagree. See the header — the subject of a soul record is
    // frequently a thing that is good and bad at the same time.
    case 'contradiction': {
      const [a, b] = rng.pick(CONTRARIES);
      return capitalise(`${a} ${b}`);
    }
    case 'time-place':
      return rng.weighted([
        [capitalise(rng.pick(HOURS)), 3],
        [capitalise(rng.pick(PLACES)), 3],
        [capitalise(`${rng.pick(HOURS)} on ${rng.pick(PLACES)}`), 1],
      ] as const);
    case 'body':
      return capitalise(`${rng.pick(ADJECTIVES)} ${rng.pick(BODY)}`);
    // The one family with no second person in it, and the one that produces the
    // story songs.
    case 'report':
      return capitalise(rng.pick(REPORTS));
    case 'clause':
      return capitalise(rng.pick(CLAUSES));
    case 'possessive-feeling':
      return capitalise(`your ${rng.pick(FEELINGS)}`);
    // Aimed at a room rather than at a person, and struck entirely under the two
    // moods where there is only one other person in it.
    case 'invitation':
      return capitalise(`${rng.pick(ADJECTIVES)} ${rng.pick(HOURS)}`);
  }
}
