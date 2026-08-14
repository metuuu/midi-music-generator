/**
 * What this music stages: a fenced yard with a wall of speakers in it.
 *
 * The room, the clothes and the programme copy. `Staging` in `genre/types.ts`
 * argues why a genre carries its own rather than the renderer holding a registry
 * of them; the instruction at the top of `iskelma/staging.ts` is the one worth
 * repeating, because these comments are not legible on their own. Read the
 * pavilion, the cellar and the black box before this one — several of the
 * decisions below are made *against* them, and the most important of them is the
 * first: this room is outdoors, like the pavilion and unlike the other two, and
 * for the opposite reason. A tanssilava is outdoors because Finland has six weeks
 * of summer. A lawn is outdoors because a sound system is a lorry-load of speaker
 * boxes and there is no building in the neighbourhood that would hold it.
 */

import type { BillHouse, Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE LAWN — reggae.
 *
 * A fenced open yard with a bar along one side, strings of bulbs overhead, and a
 * stack of speaker boxes taller than anybody in the band. It is a **dance**, so
 * `seated` is false and the density is the third highest in the project: nine rows
 * at 0.9 is a crowd with no gaps in it, which is what these rooms were and is the
 * single fact the picture has to get right.
 *
 * **That said *the highest* and it is now third.** Metal took 0.94 in the same
 * commit this file landed in — ten genres written in parallel, so neither author
 * could see the other's number — and dnb took 0.92 two days later; funk sits level
 * at 0.9. The sentence is kept because 0.9 is not doing comparative work: a crowd
 * with no gaps in it is a floor description, and three rooms reaching it is the
 * expected result rather than a collision.
 *
 * Eleven metres wide, which is joint fifth of the nineteen rooms, and the reason
 * is the band rather than the audience. This read *the widest room here* and was
 * wrong on arrival for the same parallel-authorship reason: classical and metal
 * are 12, funk is 11.5, latin is 11.4, and arabic, house, rnb and rock all sit at
 * 11 alongside this one. A roots line-up is drums, bass, two guitars, an organ,
 * three horns and a singer, and `chooseVenue` runs before the cast exists so the
 * boards have to hold the largest one the genre can produce. Nothing below 8.5 has
 * been tried and this needs more than that.
 *
 * `pa-stack` is in every era's props and `backline` joins it from 1967, and the
 * distinction is the whole look of the room: a backline faces the band and a PA
 * stack faces the audience, so a sound-system dance is a *wall* of the second kind
 * with the first kind behind it. `crowd-barrier` rather than `railing` for the
 * same reason — the rail in this room is in the house, holding the front row off
 * the boards, not on the stage keeping the band on it.
 *
 * `riser` sits in the room's own props rather than in any era's `maybe`, because
 * `cast.ts` stands the drummer 0.4 m up whatever the dressing says, and a
 * probabilistic riser would leave them floating half the time.
 */
const LAWN: StageRoom = {
  id: 'lawn',
  architecture: 'lawn',
  names: ['Pioneer Lawn', 'The Success Club', 'Jubilee Gardens', 'Maxfield Lawn', 'The Tiles', 'Sunset Yard'],
  width: 11, depth: 6.5,
  audience: { rows: 9, density: 0.9, seated: false },
  // Two props belong to the genre rather than to any decade of it: the drum
  // platform, and the bar that is the reason half the room came.
  props: ['riser', 'bar'],
  eras: {
    /**
     * 1963. A dance under bunting and bare bulbs, with one small PA and a band
     * in matching suits standing in front of it. Tungsten everything, and the
     * moths that a warm lamp outdoors at midnight always has in it — the same
     * argument the pavilion makes about a Finnish July, and true of Kingston for
     * rather more of the year.
     */
    ska: {
      palette: {
        boards: '#c2925a',
        backdrop: '#16281f',
        curtain: '#8a2f2c',
        proscenium: '#e6dcc0',
        ambient: '#ffd9a0',
      },
      props: [
        'open-air', 'fairy-lights', 'bunting', 'dance-floor', 'pa-ground', 'moths',
      ],
      maybe: [['paper-lanterns', 0.45], ['posters', 0.5]],
      fog: 0.14,
    },
    /**
     * 1967. The same yard, one amplifier louder, and the suits get sharper as the
     * music gets slower. Deeper colours than the era before it — this is the
     * point where the dance stops being an evening out and starts being a
     * territory, and the palette should be a shade less friendly.
     */
    rocksteady: {
      palette: {
        boards: '#a87c4a',
        backdrop: '#12231d',
        curtain: '#6d2440',
        proscenium: '#d8ceb2',
        ambient: '#ffcf95',
      },
      props: [
        'open-air', 'fairy-lights', 'dance-floor', 'pa-ground', 'backline',
        'posters', 'moths',
      ],
      maybe: [['neon', 0.4], ['paper-lanterns', 0.3]],
      fog: 0.2,
      grow: [0.2, 0],
    },
    /**
     * 1975. The sound system has eaten the room: a wall of boxes down one side, a
     * barrier across the front, and a rig on the boards that arrived in a van.
     * Green, gold and a burnt red, kept muted on purpose — the tricolour is
     * genuinely what the posters of this decade looked like, and a saturated
     * version of it would be a costume rather than a room.
     *
     * `fog` is up to 0.35 without a `haze` prop, and that is deliberate rather
     * than an oversight. At most one room modifier is allowed and `open-air` has
     * it; what is in the air out here is not a smoke machine, it is a warm night
     * and several hundred people, and `fog` says that as a volume without asking
     * for a fixture that does not exist in a yard.
     */
    roots: {
      palette: {
        boards: '#8f6b3e',
        backdrop: '#0f2418',
        curtain: '#7a2320',
        proscenium: '#b9903c',
        ambient: '#ffc27a',
      },
      props: [
        'open-air', 'pa-ground', 'dance-floor', 'crowd-barrier', 'backline',
        'neon', 'posters', 'wedges', 'moths',
      ],
      maybe: [['fairy-lights', 0.5], ['flight-case', 0.3]],
      fog: 0.35,
      grow: [0.4, 0.2],
    },
    /**
     * 1985. Neon and a lighting truss, and a stage that is mostly equipment —
     * because by now the band is a keyboard and a drum machine, and the thing the
     * audience is looking at is the rig rather than the players. The palette goes
     * cold at the top and stays warm on the boards, which is what a yard lit by
     * tubes over a floor lit by nothing actually looks like.
     */
    digital: {
      palette: {
        boards: '#6b5a45',
        backdrop: '#101822',
        curtain: '#8f1f5c',
        proscenium: '#7f8fa0',
        ambient: '#8fd8ff',
      },
      props: [
        'open-air', 'pa-ground', 'neon', 'dance-floor', 'crowd-barrier',
        'backline', 'wedges', 'truss', 'posters',
      ],
      maybe: [['flight-case', 0.45], ['mirror-ball', 0.25]],
      fog: 0.3,
      grow: [0.6, 0.3],
    },
  },
  fallback: {
    palette: {
      boards: '#a87c4a', backdrop: '#12231d', curtain: '#7a2320',
      proscenium: '#c9a05c', ambient: '#ffc98a',
    },
    props: ['open-air', 'pa-ground', 'dance-floor', 'fairy-lights', 'moths'],
    fog: 0.25,
  },
};

const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1963. Matching suits, and they matched harder than any band in this project
   * except the swing group in the cellar. The men who played ska had been through
   * a music school and dressed like it; `uniform: 0.8` is the same number jazz's
   * swing era carries and it is true here for the same reason — this is a
   * *section*, dressed as one.
   *
   * The porkpie is the one loose thread, and it is the rude boy arriving at the
   * edge of the picture two years early.
   */
  ska: {
    jackets: ['#20242e', '#3a3f4c', '#e9e4d6', '#5a4a35', '#2f4038', '#7a6a52'],
    shirts: ['#ffffff', '#fdf9ee', '#eef3f6'],
    trousers: ['#20242e', '#2b2b2b', '#3a3f4c'],
    accents: ['#8a1f2b', '#1b6d4d', '#c08a2b', '#2f4a8a'],
    loud: ['#e9e4d6', '#c08a2b'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018', '#6b4423'],
    hairStyles: [['short', 6], ['slick', 4], ['curls', 2], ['bald', 1]],
    accessories: [['tie', 0.7], ['sunglasses', 0.3], ['porkpie', 0.25], ['moustache', 0.2]],
    fabrics: [['wool', 7], ['satin', 2], ['linen', 2]],
    /**
     * Nine to one, and the era comment above earned it.
     *
     * *They matched harder than any band in this project except the swing group
     * in the cellar* — and that band's table, two genres over, is now `suit` at
     * 9 as well. The two rows sit at opposite ends of the bench and are the same
     * two numbers, which is the strongest thing the garment vocabulary can say
     * about a claim the prose was already making: these were men who had been
     * through a music school and dressed like a section because that is what a
     * section did, in Kingston in 1963 exactly as in a gilt room in 1938.
     *
     * The one is `waistcoat` rather than `tails`, and that is the difference
     * between the two rooms. A swing band had a leader who dressed for a
     * different evening; a ska band had a trombone player who was too hot.
     */
    garments: [['suit', 9], ['waistcoat', 1]],
    loudFabric: 'satin', sequinChance: 0,
    matched: 0.8, uniform: 0.8, spotlight: 0.35,
  },
  /**
   * 1967. The rude boy suit: narrower, sharper, and worn with dark glasses
   * indoors and out. The band stops matching quite so hard — `uniform` drops from
   * 0.8 to 0.6 — which is the visible half of a change that is also happening in
   * the music, where a big band with a horn section out front is becoming a
   * rhythm section with three horns behind a singer.
   */
  rocksteady: {
    jackets: ['#1c1f27', '#33383f', '#d9d3c2', '#4a3a52', '#3d4a3d', '#6e5a3c'],
    shirts: ['#ffffff', '#f4efe2', '#d6e2ea'],
    trousers: ['#1c1f27', '#2b2b2b', '#3d3a33'],
    accents: ['#a8241f', '#0f6b52', '#d4a02b', '#3a4f9e'],
    loud: ['#d9d3c2', '#d4a02b'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018'],
    hairStyles: [['short', 5], ['afro', 3], ['slick', 3], ['curls', 2], ['bald', 1]],
    accessories: [['sunglasses', 0.45], ['tie', 0.5], ['porkpie', 0.3], ['moustache', 0.2]],
    fabrics: [['wool', 5], ['satin', 3], ['linen', 3]],
    /**
     * The rude boy suit is a *suit*, and this table refuses to pretend otherwise.
     *
     * Narrower and sharper is a tailoring note, not a silhouette: a 1967 suit
     * and a 1963 suit are the same four objects at slightly different widths,
     * and `Garment`'s own test throws that out on sight. So the honest change
     * between this row and the one above it is one weight — a suit at 8 rather
     * than 9 — and everything else the era did is in the colours, the
     * sunglasses at 0.45 and the `uniform` falling from 0.8 to 0.6.
     *
     * That restraint is the point. Two adjacent eras four years apart *should*
     * be nearly the same row, and a wardrobe that invented a difference to
     * justify having been edited would be lying about the thing the bench exists
     * to check.
     */
    garments: [['suit', 8], ['waistcoat', 2]],
    loudFabric: 'satin', sequinChance: 0,
    matched: 0.65, uniform: 0.6, spotlight: 0.4,
  },
  /**
   * 1975. Where the suit goes.
   *
   * `dreadlocks` at the top of the hair table, and the type's own comment says why
   * it is a hairstyle worth having rather than a texture: it is built as ten
   * separate ropes, so backlight passes between them and the silhouette reads as a
   * comb rather than as a slab. That distinction is the whole reason a band of six
   * people in this era is legible from the back of the yard.
   *
   * The tam over them is `turban` — wound bulk above the skull, which is what the
   * object is — and it is the only hat weighted here. `EXCLUSIVE` in `cast.ts`
   * allows one hat per player, so weighting a beanie and a flatcap beside it would
   * buy nothing and waste two draws.
   *
   * `uniform: 0.15` is the lowest number in the file and the most accurate. Nobody
   * in a roots band is wearing what anybody else in it is wearing; denim, khaki
   * and knitwear, and none of it reflects anything.
   */
  roots: {
    jackets: ['#3f4a35', '#5a4a35', '#2f3a42', '#6b5b3f', '#4a3a2c', '#7a6a4a'],
    shirts: ['#c9bfa0', '#8a9a7a', '#b8a884', '#6f7d6a', '#d4c8a8'],
    trousers: ['#3a3a2e', '#4b4438', '#2f3540', '#55503f'],
    accents: ['#b8452b', '#1f7a4a', '#d4a72b'],
    loud: ['#d4a72b', '#b8452b'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018', '#6b4423'],
    hairStyles: [['dreadlocks', 7], ['afro', 4], ['braids', 2], ['short', 2], ['bald', 1], ['long', 1]],
    accessories: [['beard', 0.5], ['turban', 0.45], ['sunglasses', 0.25], ['chain', 0.15]],
    fabrics: [['denim', 4], ['knit', 4], ['linen', 3], ['corduroy', 2], ['wool', 1]],
    /**
     * *Where the suit goes*, and this is the row that says it.
     *
     * The heading above has claimed since it was written that this era is where
     * the suit goes, and until there were garments the sentence had nothing but
     * a khaki palette to carry it — the figures were still five lounge suits,
     * in olive. `robe` at the head of the table is the sentence arriving: a
     * floor-length column with wide sleeves, which is the garment worn on a
     * roots stage by people who had thought hard about what they were wearing
     * and concluded that a European tailor had nothing to do with it.
     *
     * It pairs with the hair table rather than competing with it. That table
     * weights `dreadlocks` at 7 for the reason its own note gives — ten separate
     * ropes that backlight passes between — and a comb of hair over a column of
     * cloth is one silhouette. A suit under the same hair was two good ideas
     * arguing.
     *
     * `waistcoat` at 3 is the knitted sleeveless thing over a shirt, worn by
     * about half of everybody in a yard in 1975. No `shirtsleeves` anywhere in
     * this table, and that is a deliberate exclusion rather than an oversight:
     * its braces are a specific object with a specific century attached to them,
     * and putting a pair on a roots band would be a costume decision made by the
     * renderer's convenience rather than by the genre.
     *
     * `suit` survives at 3 because a horn player who came up through the ska
     * bands still owns one and still wears it, and the whole point of a
     * `uniform: 0.15` band is that the man from 1963 is standing next to the man
     * who has never owned a jacket.
     */
    garments: [['robe', 4], ['waistcoat', 3], ['suit', 3]],
    loudFabric: 'knit', sequinChance: 0,
    matched: 0.25, uniform: 0.15, spotlight: 0.3,
  },
  /**
   * 1985. Leather, satin and a chain, and the one person out front is dressed
   * considerably better than the machine behind them.
   *
   * `spotlight: 0.5` is the highest here by a distance, and it is the decade's own
   * argument: the record is a preset that anybody could buy, so what distinguishes
   * one release from another is entirely the person on the microphone, and the
   * clothes agree with that. `sequinChance` stays small — this is a yard, not a
   * variety show, and a fully sequinned lead in a dancehall reads as somebody who
   * has come to the wrong booking.
   */
  digital: {
    jackets: ['#1a1a1e', '#2b2f4a', '#7a1f4a', '#3f4a2b', '#5a2b1f', '#c9c2b4'],
    shirts: ['#ffffff', '#ffe9a0', '#d6f0ff', '#2b2b2b'],
    trousers: ['#1a1a1e', '#2b2f3a', '#3f3a2b'],
    accents: ['#ffd23c', '#ff2d7a', '#2be0c8', '#7a4aff'],
    loud: ['#ffd23c', '#ff2d7a'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018'],
    hairStyles: [['short', 4], ['dreadlocks', 4], ['braids', 3], ['afro', 2], ['bald', 2], ['curls', 1]],
    accessories: [['chain', 0.5], ['wraparounds', 0.35], ['beanie', 0.3], ['beard', 0.25], ['hoops', 0.2]],
    fabrics: [['leather', 4], ['satin', 3], ['denim', 3], ['nylon', 2], ['knit', 1]],
    /**
     * The machine wears nothing, so the wardrobe is entirely about the front.
     *
     * `spotlight: 0.5` above is the highest in the file and its argument is that
     * the record is a preset anybody could buy, so the only thing that
     * distinguishes one release from another is the person on the microphone.
     * The garment table agrees by putting the only two non-jacket shapes on the
     * two people most likely to be that person: `gown` for the singer the yard
     * came to see, `waistcoat` for whoever is toasting beside her.
     *
     * `robe` drops out entirely, ten years after leading the table. That is the
     * era rather than an omission — a dancehall in 1985 is a different building
     * with a different argument in it, and a garment carried forward out of
     * politeness would blur the one boundary in this genre that is genuinely
     * sharp.
     */
    garments: [['suit', 6], ['waistcoat', 2], ['gown', 2]],
    loudFabric: 'leather', sequinChance: 0.1,
    matched: 0.3, uniform: 0.2, spotlight: 0.5,
  },
};

/**
 * Reggae: a handbill for a dance.
 *
 * The register is the house one — affectionate, dry, and never a critic's — and
 * there is one extra rule this genre needs that the others do not. **No patois.**
 * A bill written in an accent the writer does not have is an impression, and an
 * impression is the one thing that would make this table read as somebody else's
 * joke about the music rather than as the music's own. So the lines are in the
 * same plain English as the rest of the project, and what makes them belong here
 * is what they are *about*: the bass player, the missing downbeat, the size of the
 * speakers, and how long a version can go on for.
 *
 * Nothing here explains anything. A line that told the audience where beat three
 * is would be a lecture, and they can hear it.
 */
const BLURBS: Blurb[] = [
  { text: 'the horns have been up since six', styles: ['ska', 'horns'] },
  { text: 'quick, and dressed better than you', styles: ['ska', 'shuffle'], moods: ['jump'] },
  { text: 'a banjo, and a man sitting on the bass', styles: ['mento'] },
  { text: 'the year the band slowed down and never sped up again', styles: ['rocksteady'] },
  { text: 'somebody is being sung at, and it is not going well', styles: ['rocksteady', 'lovers'] },
  { text: 'the bass player is the featured artist and nobody announced it', styles: ['onedrop', 'rocksteady', 'rubadub'] },
  { text: 'there is no beat one. do not go looking for it', styles: ['onedrop', 'dub'] },
  { text: 'the kick is on all four and it means it', styles: ['steppers'], moods: ['heavy'] },
  { text: 'militant, and still militant in eight minutes', styles: ['steppers', 'rockers'], moods: ['heavy', 'conscious'] },
  { text: 'the hi-hat has been listening to philadelphia', styles: ['flyers'] },
  { text: 'three drums, and nobody in any hurry to stop', styles: ['nyabinghi'] },
  { text: 'for the ones who came to think about it', styles: ['roots', 'dubpoetry'], moods: ['conscious'] },
  { text: 'the singer has left the building. the echo has not', styles: ['dub'], moods: ['echo'] },
  { text: 'half the band is here at any given moment', styles: ['dub'], moods: ['echo'] },
  { text: 'somebody at the back is talking over it on purpose', styles: ['dubpoetry'] },
  { text: 'the organ player has both hands busy and no chords to show for it', styles: ['bubble', 'skinhead'] },
  { text: 'slow, major, and entirely unashamed', styles: ['lovers'], moods: ['sweet'] },
  { text: 'made in coventry, which is further from kingston than it sounds', styles: ['twotone'] },
  { text: 'one preset, and an entire industry', styles: ['slengteng'] },
  { text: 'one chord. that is the whole harmonic argument', styles: ['ragga', 'dancehall'], moods: ['rough'] },
  { text: 'the speakers are stacked higher than the band', slot: 'open' },
  { text: 'wind it back and play it again, which they will', slot: 'close' },
  { text: 'nobody has left the bar and nobody is going to' },
];

/**
 * THE BILL — a dance poster, and it was on a wall.
 *
 * `poster`, shared with iskelmä, and the two are the same document for the same
 * reason: neither was ever handed to anybody. A sound-system dance was
 * advertised by a hand-set sheet pasted to a wall a week before, so the title
 * is enormous, the number sits on a line of its own above it, and the whole
 * thing is centred because a poster read from across a road has no left margin.
 * The word is **Dance**, which is what the sheet said, and it is a noun rather
 * than an instruction.
 *
 * Four decades of one printer getting hold of different ink. 1964 is
 * yellow-cream stock with a slab face and green, hand-set and slightly
 * over-inked. 1968 is the same press in coral and a serif, because rocksteady
 * slowed everything down including the advertising. 1975 is kraft and gold and
 * heavy sans — roots is the decade this music got serious about itself. 1987 is
 * a photocopy in magenta, which is what the digital era was: cheaper, faster,
 * and printed the afternoon of the dance.
 */
const BILL: Record<string, BillHouse> = {
  ska: {
    layout: 'poster', word: 'Dance', numeral: 'arabic', aged: true,
    stock: '#f2e6b6',
    grain: 'repeating-linear-gradient(0deg, rgba(120, 100, 40, .05) 0 1px, transparent 1px 5px)',
    ink: '#1e2a1c', inkDim: '#6e7355', hair: '#c2b787', accent: '#17703c',
    face: "Georgia, 'Iowan Old Style', serif",
    display: "Rockwell, 'Courier New', Georgia, serif",
    displayWeight: 700,
    venue: { size: '1.3em', track: '.24em', case: 'uppercase' },
    title: { size: '1.72em', track: '.06em', case: 'uppercase' },
    head: { pad: '.75em', rule: '3px double var(--hair)' },
  },
  rocksteady: {
    layout: 'poster', word: 'Dance', numeral: 'arabic', aged: true,
    stock: '#f0d9cd',
    grain: 'repeating-linear-gradient(0deg, rgba(140, 80, 60, .04) 0 1px, transparent 1px 4px)',
    ink: '#2a1c18', inkDim: '#87675c', hair: '#cfae9e', accent: '#b2382a',
    face: "Georgia, 'Iowan Old Style', serif",
    display: "'Iowan Old Style', Georgia, 'Times New Roman', serif",
    displayWeight: 700,
    venue: { size: '1.24em', track: '.28em', case: 'uppercase' },
    title: { size: '1.68em', track: '.1em', case: 'uppercase' },
    head: { pad: '.75em', rule: '1px solid var(--hair)' },
  },
  roots: {
    layout: 'poster', word: 'Dance', numeral: 'arabic', aged: true,
    stock: '#ddc9a5',
    grain: 'repeating-linear-gradient(90deg, rgba(90, 66, 30, .05) 0 1px, transparent 1px 3px)',
    ink: '#231a0e', inkDim: '#7e6a44', hair: '#b39a6c', accent: '#a86a12',
    face: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    display: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    displayWeight: 800,
    venue: { size: '1.2em', track: '.2em', case: 'uppercase' },
    title: { size: '1.8em', track: '-.02em', case: 'uppercase' },
    head: { pad: '.7em', rule: '.35em solid var(--accent)' },
  },
  digital: {
    layout: 'poster', word: 'Dance', numeral: 'arabic',
    stock: '#f2f2ea',
    ink: '#1b1b1f', inkDim: '#74747c', hair: '#cfcfc6', accent: '#d2266b',
    face: "'Avenir Next', Avenir, ui-sans-serif, sans-serif",
    display: "'Century Gothic', Futura, 'Avenir Next', ui-sans-serif, sans-serif",
    displayWeight: 800,
    venue: { size: '1.16em', track: '.16em', case: 'uppercase' },
    title: { size: '1.86em', track: '-.03em', case: 'uppercase' },
    head: { pad: '.7em', rule: '.4em solid var(--accent)' },
  },
};

export const STAGING: Staging = {
  room: LAWN,
  wardrobe: WARDROBE,
  bill: BILL,
  /**
   * Roots, when the era is one this genre has no clothes for. It is the decade
   * the word means to anybody who is not being careful, and the other three are
   * legible as the approach to it and the departure from it.
   */
  defaultEra: 'roots',
  blurbs: BLURBS,
  /**
   * Just under the dance band, and above everything else here.
   *
   * The floor is as full as a tanssilava's and it is moving more, which argues for
   * 1.0 — but `body` is a multiplier on the *players*, and a reggae rhythm section
   * is the most economical group of people in this project. The whole discipline
   * of the style is that nobody adds anything: the drummer plays two strokes a
   * bar, the guitarist plays four, and neither of them is selling it. 0.9 is a
   * band absolutely locked in and not showing you that it is.
   */
  body: 0.9,
};
