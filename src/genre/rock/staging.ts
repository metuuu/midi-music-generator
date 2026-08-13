/**
 * What this music stages: a raised stage with a standing floor in front of it
 * and a wall of the band's own amplifiers behind them.
 *
 * The room, the clothes and the programme copy. `Staging` in `genre/types.ts`
 * argues why a genre carries its own rather than the renderer holding a registry
 * of them; the instruction at the top of `iskelma/staging.ts` is the one worth
 * repeating, because none of these comments is legible on its own. Read the
 * pavilion, the cellar, the black box and the lawn before this one — several of
 * the decisions below are made against them.
 *
 * The one that matters most is the first. `backline` is in this room's own props
 * rather than in any era's, and `venue.ts` says why in one line: a backline and
 * a PA stack are both walls of speaker boxes and *only one of them makes a rock
 * stage*. A PA faces the audience and is the promoter's; a backline faces the
 * band, is theirs, and arrived in the van. Every era below has both, which is
 * true of no other genre here, and the pair of them facing opposite ways is the
 * whole silhouette.
 */

import type { Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE CIRCUIT — rock.
 *
 * A proscenium theatre with the seats taken out of the stalls, which is what a
 * ballroom, a civic hall, a town hall and a converted cinema all are, and what
 * every band in this genre played in for the whole of the beat and hard eras. It
 * grows into an arena for one decade and comes back down.
 *
 * `seated: false` and eight rows at 0.85 — a standing floor, dense but not the
 * crush the lawn is, because a theatre has a rail and a fire officer and the
 * lawn has neither. The rail is `crowd-barrier` rather than `railing`, and the
 * distinction is which side of the boards it stands on: `railing` is on the
 * stage keeping the band on it, and what is in this room is in the house,
 * holding the front row off.
 *
 * Eleven metres wide before any growth, and the reason is the band rather than
 * the audience. An arena-era line-up is drums, bass, two guitars, a keyboard, a
 * singer and a horn section, and `chooseVenue` runs before the cast exists — so
 * the boards have to hold the largest one the genre can produce. Nothing below
 * 8.5 has been tried and this needs more than that.
 *
 * `riser` sits in the room's own props rather than in any era's `maybe`, because
 * `cast.ts` stands the drummer 0.4 m up whatever the dressing says, and a
 * probabilistic riser would leave them floating half the time.
 *
 * **No room modifier before 1978 and none after 1987.** At most one is allowed
 * and the two middle eras spend theirs on `haze`, because in those two decades
 * there genuinely was smoke in the air and the lighting was designed around it.
 * The beat era gets the plain proscenium — a 1965 ballroom is a lit room with a
 * band at one end and nothing atmospheric about it — and the alternative era
 * gets it back, with `low-ceiling` and `bar` and `posters` doing the work of
 * making it read as a club without claiming a different building.
 */
const CIRCUIT: StageRoom = {
  id: 'circuit',
  architecture: 'circuit',
  names: ['The Regal', 'The Empire', 'Civic Hall', 'The Locarno', 'Corn Exchange', 'The Palace'],
  width: 11, depth: 6.5,
  audience: { rows: 8, density: 0.85, seated: false },
  /**
   * Two props belong to the genre rather than to any decade of it: the drum
   * platform, and the wall of amplifiers that is the reason anybody can hear
   * this at all.
   */
  props: ['riser', 'backline'],
  eras: {
    /**
     * 1965. A ballroom with the tables pushed back: a mirror ball, a sprung
     * floor, two columns of PA on poles that between them do about a hundred
     * watts, and a band in matching jackets standing in a lit room. Warm
     * tungsten everywhere, because that is what was in the fixtures, and a
     * saturated palette because these rooms were decorated in the fifties and
     * nobody had repainted them.
     */
    beat: {
      palette: {
        boards: '#8a6238',
        backdrop: '#2a1f2e',
        curtain: '#7d1f2b',
        proscenium: '#d8c49a',
        ambient: '#ffd6a0',
      },
      props: ['dance-floor', 'pa-stack', 'mirror-ball', 'drapes'],
      maybe: [['posters', 0.5], ['railing', 0.3], ['chandelier', 0.2]],
      fog: 0.06,
    },
    /**
     * 1972. The same building, four times as loud, with the house lights off for
     * the first time. The stack has arrived and so has the smoke — `haze` is the
     * era's one room modifier and it is spent here rather than on the arena
     * because this is the decade the *lighting* was designed for it: a beam is
     * only visible in smoke, and the whole idea of a lit rock show starts in a
     * theatre full of it in about 1970.
     *
     * The palette goes cold and deep. A 1972 stage is lit in saturated primaries
     * from a handful of parcans and nothing else in the room is lit at all.
     */
    hard: {
      palette: {
        boards: '#5c452c',
        backdrop: '#141019',
        curtain: '#4a1520',
        proscenium: '#8a6a3e',
        ambient: '#c07ad8',
      },
      props: [
        'haze', 'pa-stack', 'wedges', 'drapes', 'posters',
      ],
      maybe: [['flight-case', 0.5], ['dance-floor', 0.3], ['railing', 0.25]],
      fog: 0.42,
      grow: [0.5, 0.3],
    },
    /**
     * 1982. The building has been replaced by a much larger one.
     *
     * `truss`, `screen` and `crowd-barrier` together, which is the arena set as
     * `venue.ts` lists it, and `screen` rather than `projection` — an LED wall
     * and a film loop on a cloth are two different decades and the second one is
     * upstairs in the psychedelic era. `grow: [2.5, 1.5]` is the largest in the
     * project and it is the only place a room in this repo becomes a different
     * size of room rather than a differently dressed one.
     *
     * The palette is cold steel and magenta, which is what a stage lit by a
     * hundred fixtures on a truss actually looks like from row forty: the warmth
     * is gone because the lamps are further away and there are far more of them.
     */
    arena: {
      palette: {
        boards: '#3f4048',
        backdrop: '#0d1018',
        curtain: '#2a2f3f',
        proscenium: '#8f98a8',
        ambient: '#ff4fa8',
      },
      props: [
        'haze', 'truss', 'screen', 'crowd-barrier', 'pa-stack', 'wedges',
        'flight-case',
      ],
      maybe: [['mirror-ball', 0.2], ['drapes', 0.35]],
      fog: 0.45,
      grow: [2.5, 1.5],
    },
    /**
     * 1993. Back down to a room with a bar in it.
     *
     * `low-ceiling`, `bar`, `posters` and `neon` are the club set from
     * `venue.ts`, used without the `brick` modifier — the modifier would rebuild
     * the architecture, and the claim this dressing is making is smaller and
     * more accurate than that: it is the *same* circuit, with the band playing
     * the small room again on purpose. `circuit.ts` builds it as the same
     * anonymous room the other three eras get, only small, with the lid down
     * and the rig cut back to one bar under the soffit, which is the joke.
     *
     * The palette is the flattest here. A nineties club stage is lit by six
     * fixtures in two colours and mostly from the front, and the whole aesthetic
     * of the decade is a refusal to look expensive.
     */
    alt: {
      palette: {
        boards: '#4a4238',
        backdrop: '#1a1c1a',
        curtain: '#3a2f2a',
        proscenium: '#6e6455',
        ambient: '#e8b878',
      },
      props: [
        'low-ceiling', 'bar', 'posters', 'neon', 'pa-stack', 'wedges',
      ],
      maybe: [['flight-case', 0.4], ['rug', 0.3], ['crowd-barrier', 0.2]],
      fog: 0.24,
      grow: [0.8, 0.4],
    },
  },
  fallback: {
    palette: {
      boards: '#5c452c', backdrop: '#141019', curtain: '#4a1520',
      proscenium: '#8a6a3e', ambient: '#d88a5a',
    },
    props: ['pa-stack', 'wedges', 'drapes'],
    fog: 0.3,
  },
};

const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1965. Matching collarless jackets and narrow trousers, and the band matched
   * because the manager made them.
   *
   * `uniform: 0.75` — high, and it is the second-highest in the project after
   * the swing group in the cellar. That is a fact about *management* rather than
   * about taste: a beat group was a product with a suit budget, and the two or
   * three that refused are the ones everybody remembers for refusing.
   *
   * `tie` is the only neck item weighted, and `glasses` the only eyewear.
   * `EXCLUSIVE` in `cast.ts` allows one of each group per player, so a table
   * listing a tie and a scarf buys one and wastes the other draw.
   */
  beat: {
    jackets: ['#1e2028', '#3a3f4c', '#6b2b32', '#2f4038', '#8a7a5c', '#c9c2b4'],
    shirts: ['#ffffff', '#fdf9ee', '#eef3f6', '#f4e8d0'],
    trousers: ['#1e2028', '#2b2b2b', '#3a3f4c'],
    accents: ['#8a1f2b', '#1b6d4d', '#c08a2b', '#2f4a8a'],
    loud: ['#c9c2b4', '#c08a2b'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018', '#6b4423', '#8a6a3a'],
    hairStyles: [['short', 6], ['slick', 3], ['bob', 3], ['curls', 2], ['bald', 1]],
    accessories: [['tie', 0.6], ['glasses', 0.15], ['moustache', 0.1]],
    fabrics: [['wool', 6], ['corduroy', 2], ['satin', 2], ['linen', 1]],
    /**
     * Nine to one, because the manager bought nine of them.
     *
     * `uniform: 0.75` above says a beat group was a product with a suit budget,
     * and the garment table has nothing to add to that except agreement. The
     * collarless jacket the era comment names is a lounge suit with the lapels
     * left off, which is four centimetres of cloth and fails `Garment`'s own
     * ten-metre test on sight — the union declined to grow a member for it and
     * that decision is correct here rather than merely convenient.
     *
     * The one that is not a suit is `waistcoat`, and it is the rhythm guitarist
     * in the group photograph who is wearing the waistcoat from a different
     * suit. Every beat group has one. It is also, deliberately, the same shape
     * the next two eras build their entire wardrobe out of, so the genre's
     * arrival at the cut-off has a first appearance rather than a jump cut.
     */
    garments: [['suit', 9], ['waistcoat', 1]],
    loudFabric: 'satin', sequinChance: 0,
    matched: 0.75, uniform: 0.75, spotlight: 0.3,
  },
  /**
   * 1972. Where the suit goes.
   *
   * `mane` at the head of the hair table, and the type's own note is why it is
   * worth having rather than reusing `long`: a mane falls past the shoulder
   * blades *and* forward over the collarbones, which `long`'s curtains never do,
   * and the forward half is the entire silhouette of this decade seen from the
   * front. A guitarist bent over the neck with hair on both sides of the face is
   * the image, and `long` cannot make it.
   *
   * `uniform: 0.08` is the lowest number in this file. Nobody in a 1972 band is
   * wearing what anybody else in it is wearing, and `spotlight: 0.55` says where
   * that budget went instead: one person in satin in front of four in denim.
   * `sequinChance: 0.12` is glam arriving — small, because a fully sequinned
   * band is a pantomime and one sequinned singer is a Top of the Pops booking.
   */
  hard: {
    jackets: ['#3a2b1f', '#5a2b3a', '#2f3a4a', '#6b5b3f', '#7a2b20', '#4a4a3a'],
    shirts: ['#d8c49a', '#8a2f4a', '#e8e0c8', '#3f5a6b', '#c07a3a'],
    trousers: ['#2f3a52', '#3a3a2e', '#4b3828', '#55503f'],
    accents: ['#d4a72b', '#b8452b', '#7a3ab8', '#1f7a4a'],
    loud: ['#d4a72b', '#b8452b', '#7a3ab8'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018', '#6b4423', '#a07840'],
    hairStyles: [['mane', 6], ['long', 5], ['curls', 3], ['afro', 2], ['short', 2], ['bald', 1]],
    accessories: [['moustache', 0.35], ['scarf', 0.35], ['sunglasses', 0.25], ['beard', 0.2]],
    fabrics: [['denim', 4], ['satin', 3], ['velvet', 3], ['corduroy', 2], ['leather', 2]],
    /**
     * *Where the suit goes* — one weight down from 9 to 5 in seven years, which
     * is the largest single move any genre makes in this project.
     *
     * `uniform: 0.08` above is the lowest number in the file and it has never
     * had a shape to be un-uniform *in*: five people in five colours of the same
     * jacket is a band that matches, whatever the swatches say. This is the row
     * where that finally stops being true.
     *
     * `waistcoat` at 4 is the cut-off, arriving in the genre a decade before
     * `metal:nwobhm` builds a wardrobe on it and from the same place — a denim
     * jacket with the sleeves off, which the union already had a member for. It
     * pairs with `mane` at 6 in the hair table for the reason that table gives
     * about itself: a mane falls forward over the collarbones, and the thing it
     * falls over should be a bare shoulder rather than a padded one.
     *
     * `robe` at 1 is the kaftan. One man in a five-piece, in 1972, in a garment
     * that reaches the floor, is not a costume decision — it is the single most
     * photographed thing about this decade of this music, and the member that
     * draws it is the same one `arabic:takht` uses for a galabeya, which is
     * where the fashion came from and is not a coincidence.
     */
    garments: [['suit', 5], ['waistcoat', 4], ['robe', 1]],
    loudFabric: 'satin', sequinChance: 0.12,
    matched: 0.2, uniform: 0.08, spotlight: 0.55,
  },
  /**
   * 1982. Leather, and a towel.
   *
   * `mullet` and `mane` at the top together, which is the decade exactly — short
   * everywhere the audience can see and long behind, or long everywhere, and
   * nothing in between. `bandana` is the only hat weighted and `wraparounds` the
   * only eyewear, for the `EXCLUSIVE` reason given above.
   *
   * `towel` is the interesting one, and it is here rather than `chain` because
   * the neck group only pays out once. The accessory list's own note says a
   * towel is *the one thing here that says the performer is working* — and that
   * is precisely what this decade's staging is about: a two-hour show in a
   * building with no ventilation, and the towel is the honest object.
   */
  arena: {
    jackets: ['#16161a', '#2b2f4a', '#7a1f3a', '#3f3a2b', '#8a2b1f', '#c9c2b4'],
    shirts: ['#ffffff', '#16161a', '#d6f0ff', '#ffe9a0', '#7a1f3a'],
    trousers: ['#16161a', '#2b2b30', '#3a3f4c'],
    accents: ['#ff2d7a', '#ffd23c', '#2be0c8', '#7a4aff'],
    loud: ['#ff2d7a', '#ffd23c'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018', '#6b4423', '#c2a05a'],
    hairStyles: [['mullet', 5], ['mane', 5], ['long', 3], ['curls', 2], ['short', 2], ['bald', 1]],
    accessories: [['bandana', 0.4], ['wraparounds', 0.35], ['towel', 0.3], ['hoops', 0.22], ['moustache', 0.18]],
    fabrics: [['leather', 4], ['denim', 3], ['satin', 3], ['vinyl', 2], ['nylon', 1]],
    /**
     * Six to four, and this row is *supposed* to look like `metal:nwobhm`.
     *
     * The two tables are the same two members at the same two weights, and that
     * is a claim rather than a copy: an arena rock band and a NWOBHM band in
     * 1982 were wearing the same clothes, played the same buildings, and were
     * told apart by the tempo. A wardrobe that manufactured a difference here
     * would be inventing a distinction the photographs do not support, and the
     * bench is exactly where that lie would have been visible.
     *
     * Where they do differ is everything else on the row — this genre's accent
     * list is magenta and cyan against metal's red and gold, `towel` is weighted
     * here and nowhere in that file, and `spotlight` is 0.6 against 0.45. The
     * garment is the one thing 1982 did not let them disagree about.
     */
    garments: [['waistcoat', 6], ['suit', 4]],
    loudFabric: 'leather', sequinChance: 0.08,
    matched: 0.15, uniform: 0.05, spotlight: 0.6,
  },
  /**
   * 1993. Flannel, and nobody out front.
   *
   * `spotlight: 0.15` is the lowest in the project and it is the decade's whole
   * argument about itself: the singer is dressed exactly like the bass player,
   * on purpose, and a band with a visibly designated frontman was the thing this
   * music was defined against. `sequinChance: 0` for the same reason, and it is
   * the only era here that is flat zero.
   *
   * `flannel` heads the fabric table, and the type's own note is why it earns a
   * row rather than being corduroy in another colour: corduroy's ribs catch a
   * rim light in lines and flannel is brushed until it catches nothing at all.
   * A stage full of it under six lamps reads as matte, which is exactly right.
   */
  alt: {
    jackets: ['#4a2f2b', '#2f4a3a', '#3a3f52', '#6b4a2b', '#5a5a4a', '#7a3a3a'],
    shirts: ['#8a4a3a', '#3f5a4a', '#c9bfa0', '#4a4f6b', '#6b6b5a', '#2b2b2b'],
    trousers: ['#2f3a52', '#3a3a35', '#4a4438'],
    accents: ['#b8452b', '#d4a72b', '#3f7a5a'],
    loud: ['#b8452b', '#d4a72b'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018', '#6b4423', '#a8863f'],
    /**
     * `emo` at 2, and the name on the value is six years ahead of this era
     * while the *picture* is not.
     *
     * What the renderer draws is a fringe swept across the face with one eye
     * behind it, and on a 1991 stage that is shoegaze — the genre is named after
     * what a band does with its head, and `styleWeights` puts it at 7 here,
     * level with `indie`. Dating a wardrobe to the year is not what these tables
     * do anyway; `metal:thrash` puts `flannel` in two years before anybody in
     * Seattle made it famous and says so. A haircut whose whole argument is that
     * the player is not looking at you belongs on the one bill in the project
     * with `spotlight: 0.15`.
     *
     * At 2 against a table of 20 it is one player in ten, which is a guitarist
     * at stage left and never the band.
     */
    hairStyles: [
      ['long', 5], ['short', 4], ['mane', 3], ['curls', 2], ['bald', 2],
      ['emo', 2], ['mohawk', 1], ['dreadlocks', 1],
    ],
    accessories: [['beanie', 0.35], ['glasses', 0.25], ['beard', 0.3], ['chain', 0.15]],
    fabrics: [['flannel', 5], ['denim', 4], ['knit', 3], ['corduroy', 2], ['leather', 1]],
    /**
     * Nobody out front, so nobody in anything.
     *
     * `spotlight: 0.15` is the lowest in the project and the era comment says
     * why: a band with a visibly designated frontman was the thing this music
     * defined itself against. A garment table is where that is easiest to break
     * by accident — one `gown` at weight 2 and the row has a singer in it — so
     * there is not one, and the absence is the entry.
     *
     * `coat` at 2 is the charity-shop greatcoat, and it is the only thing in
     * this table that is here for its own sake. A knee-length skirted column
     * with a stand collar over trousers is a 1993 object as exactly as it is a
     * 1720 one, which is the third genre to reach for that member from a
     * direction none of the others would recognise.
     *
     * `waistcoat` at 2 is the open flannel over a t-shirt seen from ten metres
     * away, which is the distance the union is judged from. It is deliberately
     * lower than the two eras above it: this decade took the cut-off *off*, and
     * a genre whose weights only ever rise is not describing anything.
     */
    garments: [['suit', 6], ['waistcoat', 2], ['coat', 2]],
    loudFabric: 'denim', sequinChance: 0,
    matched: 0.1, uniform: 0.05, spotlight: 0.15,
  },
};

/**
 * Rock: a bill pasted on a wall.
 *
 * The register is the house one — affectionate, dry, and never a critic's,
 * which for this genre takes some doing, because rock is the one repertoire
 * here that has been written about more than it has been played and every
 * available adjective already belongs to somebody's review. So none of these
 * lines evaluates anything. They are about the *objects*: the volume, the
 * amplifiers, the length of the solo, how long the band has been in the van.
 *
 * Nothing here explains anything either. A line that told the audience where the
 * backbeat is would be a lecture, and they have been clapping on it since they
 * arrived.
 */
const BLURBS: Blurb[] = [
  { text: 'two and a half minutes, and not one of them wasted', styles: ['beat', 'punk'] },
  { text: 'four lads, one van, and a manager who bought the jackets', styles: ['beat'] },
  { text: 'recorded in an afternoon for eighty dollars', styles: ['garage'], moods: ['raw'] },
  { text: 'the fuzz box was a mistake and they kept it', styles: ['garage', 'psych'] },
  { text: 'no singer. the guitar has it and is not giving it back', styles: ['surf'] },
  { text: 'six strings ringing and nothing damped', styles: ['jangle', 'indie'] },
  { text: 'twelve bars, and the third one takes a while', styles: ['bluesrock'] },
  { text: 'one riff. they will be a few minutes', styles: ['boogie', 'riff'], moods: ['heavy', 'swagger'] },
  { text: 'the amplifiers arrived before the band did', styles: ['hard', 'arena'], moods: ['heavy'] },
  { text: 'somebody has flattened the fifth on purpose', styles: ['riff', 'stoner'] },
  { text: 'stamp along. that is what the gap is for', styles: ['glam'], moods: ['swagger'] },
  { text: 'seven beats to the bar, and they will count it out loud', styles: ['prog', 'math'] },
  { text: 'two guitars playing the same thing a third apart', styles: ['southern'] },
  { text: 'one chord, and eight minutes to get comfortable in it', styles: ['motorik', 'psych'], moods: ['hazy'] },
  { text: 'slower than you think, and then slower again', styles: ['stoner'], moods: ['heavy'] },
  { text: 'all downstrokes, and the drummer is not slowing down for anyone', styles: ['punk'] },
  { text: 'the bass player has the tune and nobody announced it', styles: ['postpunk'] },
  { text: 'a lighting rig with a band underneath it', styles: ['arena'], moods: ['epic'] },
  { text: 'the quiet bit lasts sixteen bars. brace', styles: ['ballad', 'grunge'] },
  { text: 'the vocal is in there somewhere and that is the arrangement', styles: ['shoegaze'], moods: ['hazy'] },
  { text: 'they have decided not to be loud, and they mean it', styles: ['indie'], moods: ['wistful'] },
  { text: 'doors at seven, and the support are already loading in', slot: 'open' },
  { text: 'one more, and then the lights come up', slot: 'close' },
];

export const STAGING: Staging = {
  room: CIRCUIT,
  wardrobe: WARDROBE,
  /**
   * The hard era, when the era is one this genre has no clothes for. It is the
   * decade the word means to anybody who is not being careful about it, and the
   * other three read as the approach to it and the departure from it.
   */
  defaultEra: 'hard',
  blurbs: BLURBS,
  /**
   * The most body of anything here except the dance band, and it is the players
   * rather than the floor that earns it.
   *
   * The floor is standing rather than dancing, which argues for less than the
   * pavilion's 1.0 — but `body` is a multiplier on the *players*, and this is
   * the most physically demonstrative group of musicians in the project by a
   * long way. A reggae rhythm section is locked in and refusing to show you; a
   * rock band's entire performance vocabulary is showing you. 0.95 is a band
   * moving as much as it is playing.
   */
  body: 0.95,
};
