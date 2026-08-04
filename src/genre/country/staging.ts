/**
 * What this music stages: a wooden hall with a bar down one side and a floor.
 *
 * The room, the clothes and the programme copy. `Staging` in `genre/types.ts`
 * argues why a genre carries its own rather than the renderer holding a registry
 * of them; the instruction at the top of `iskelma/staging.ts` is the one worth
 * repeating, because these comments are not legible on their own. Read the
 * pavilion, the cellar, the black box and the lawn before this one — several of
 * the decisions below are made *against* them.
 *
 * The most important of those is the first, and it is made against the pavilion.
 * A tanssilava is outdoors because Finland has six weeks of summer; this room is
 * indoors, and it is indoors in every one of its four decades, because everything
 * that happens in it happens at night in weather nobody has consulted. It is a
 * dance in the same sense the lawn is — `seated: false`, and the density is high —
 * but the shape of the evening is different: a Jamaican lawn is a crowd facing a
 * speaker stack, and this is couples going round a floor anticlockwise with the
 * band at one end and the bar at the other.
 *
 * One room and four dressings of it, which is more of a stretch here than in any
 * other genre in the project and is worth admitting. A 1932 barn, a 1955
 * honky-tonk, a 1968 broadcast studio and a 1978 converted hall are genuinely four
 * buildings. What makes it one room anyway is the thing `web/concert/stage.ts`
 * actually builds from — the props — and all four of them have the same bones:
 * boards at one end, a wooden floor people are standing on, a low roof with
 * something structural showing, and drink for sale. The alternative was four rooms
 * with one style each, which is a registry wearing a genre's clothes.
 */

import type { Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE DANCE HALL — country.
 *
 * Ten and a half metres by six: wider than the pavilion, narrower than the lawn,
 * and the constraint is the same one the lawn's comment states. `chooseVenue` runs
 * before the cast exists, so the boards have to hold the largest band the genre can
 * produce — which is the western swing line-up, eleven or twelve people with a
 * fiddle section in it, and not the bluegrass one, which is five people who could
 * play in a lift.
 *
 * `riser` sits in the room's own props rather than in any era's `maybe`, and that
 * is a deliberate decision rather than a copied one. Seven of the twenty-four
 * styles here have no drum kit at all, which is the largest drumless block in the
 * project outside ambient, and it is tempting to make the platform probabilistic to
 * match. It would be wrong: `cast.ts` stands a drummer 0.4 m up whatever the
 * dressing says, so a probabilistic riser leaves them floating on the nights it
 * does not fire — and on the nights there is no drummer at all, an empty drum
 * platform at the back of a bluegrass stage is not a mistake in the picture, it is
 * what every one of those rooms looked like. The hall owned the riser; the band
 * brought the instruments.
 *
 * `bar` is the other genre-wide prop and it needs no argument in three of the four
 * decades. It survives into the 1932 barn because a barn dance had a table with
 * jars on it at the back, which is the same object with worse furniture.
 */
const DANCE_HALL: StageRoom = {
  id: 'dancehall',
  architecture: 'dancehall',
  names: [
    'Cedar Hall', 'The Silver Spur', 'Ridgeway Barn', 'Cottonwood Hall',
    'The Wagon Wheel', 'The Boot Heel',
  ],
  width: 10.5, depth: 6,
  audience: { rows: 8, density: 0.82, seated: false },
  props: ['riser', 'bar', 'dance-floor'],
  eras: {
    /**
     * 1932. A barn, or a schoolhouse, or somebody's front room with the furniture
     * against the wall. Beams overhead because there is no ceiling, hay because
     * this is a working building six days a week, and bunting because somebody's
     * aunt made it. Everything is tungsten and everything is the colour of pine.
     *
     * `moths`, for the same reason the pavilion has them: a warm lamp indoors in
     * July in Tennessee, with the doors open because it is thirty degrees.
     */
    stringband: {
      palette: {
        boards: '#b0854c',
        backdrop: '#2b2015',
        curtain: '#7a4a2c',
        proscenium: '#d8c49a',
        ambient: '#ffd79a',
      },
      props: [
        'beams', 'hay', 'bunting', 'fairy-lights', 'moths',
      ],
      maybe: [['paper-lanterns', 0.35], ['flowers', 0.3], ['railing', 0.25]],
      fog: 0.12,
    },
    /**
     * 1955. The honky-tonk: neon in the window, tables round three sides, a rug
     * under the drum riser because the floor is concrete, posters for next
     * Saturday, and a ceiling low enough to reach.
     *
     * `fog: 0.34` with no `haze` prop, and it is the same argument the lawn makes
     * from the opposite premise. What is in the air in a bar in 1955 is not a
     * smoke machine, it is two hundred cigarettes, and `fog` says that as a volume
     * without asking for a fixture nobody had installed. The palette goes cold in
     * the ambient and stays warm on the boards, which is what a room lit by beer
     * signs over a floor lit by nothing actually looks like.
     */
    honkytonk: {
      palette: {
        boards: '#8a6238',
        backdrop: '#1b1a20',
        curtain: '#6d1f2c',
        proscenium: '#c2a06a',
        ambient: '#ff9fc4',
      },
      props: [
        'neon', 'tables', 'low-ceiling', 'rug', 'posters', 'backline', 'wedges',
      ],
      maybe: [['mirror-ball', 0.25], ['candles', 0.35], ['flight-case', 0.25]],
      fog: 0.34,
      grow: [0.2, 0],
    },
    /**
     * 1968. The broadcast: a curtain, a carpet, a rail across the front of the
     * stage and a lighting rig somebody was paid to design. This is the one
     * dressing here that is not a room people are drinking in — it is the Opry
     * stage or a television studio done up to look like one, and the giveaway is
     * `carpet`, which no working dance hall in this genre has ever had.
     *
     * `railing` and not `crowd-barrier`: the rail in this room is on the stage
     * keeping the band on it, which is what a broadcast set has, rather than in the
     * house holding the front row off the boards, which is what an arena has. The
     * two objects look similar and are in different places.
     *
     * The palette is the warmest and the most even here, because everything in it
     * is lit for a camera and a camera in 1968 needed a great deal of light with
     * nothing dramatic in it.
     */
    nashville: {
      palette: {
        boards: '#9a7346',
        backdrop: '#232a33',
        curtain: '#7d2436',
        proscenium: '#d6bc86',
        ambient: '#ffe0b4',
      },
      props: [
        'drapes', 'carpet', 'railing', 'backline', 'wedges', 'bunting', 'posters',
      ],
      maybe: [['flowers', 0.4], ['truss', 0.35], ['flight-case', 0.3]],
      fog: 0.16,
      grow: [0.5, 0.4],
    },
    /**
     * 1978. A converted hall with a proper PA in it: brick walls, a wall of boxes
     * facing the audience, a barrier across the front, a truss, and the band's
     * flight cases still stacked at the side because they are driving to the next
     * one tonight.
     *
     * `brick` is the only room modifier used in this genre and it is used once. At
     * most one is allowed and this is where it earns the slot: the Austin rooms
     * that this decade happened in were old buildings with the plaster off — an
     * armoury, a skating rink, a furniture warehouse — and the sound of a brick
     * wall behind a band is half of why these records were made live.
     *
     * `pa-stack` and `backline` together, and the distinction is the whole look:
     * a backline faces the band and a PA stack faces the audience, so this is the
     * first era here with both.
     */
    outlaw: {
      palette: {
        boards: '#6f5436',
        backdrop: '#1a1611',
        curtain: '#5a2a1c',
        proscenium: '#8a6a44',
        ambient: '#ffb877',
      },
      props: [
        'brick', 'pa-stack', 'backline', 'wedges', 'truss', 'crowd-barrier',
        'neon', 'posters', 'flight-case',
      ],
      maybe: [['tables', 0.4], ['screen', 0.2], ['rug', 0.35]],
      fog: 0.4,
      grow: [0.9, 0.5],
    },
  },
  fallback: {
    palette: {
      boards: '#8a6238', backdrop: '#221c17', curtain: '#6d2430',
      proscenium: '#c2a06a', ambient: '#ffcf95',
    },
    props: ['beams', 'tables', 'backline', 'posters', 'wedges'],
    fog: 0.25,
  },
};

const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1932. Work clothes and one good shirt.
   *
   * `flannel` at the head of the fabric table, and its own comment in
   * `concert/types.ts` is the reason it is worth having: it is brushed until it has
   * no grain at all, so where corduroy's ribs catch a rim light in lines this
   * catches nothing. A follow spot crossing a room full of it finds five flat
   * shapes and one white shirt, which is exactly what the photographs of these
   * sessions look like.
   *
   * `uniform: 0.4` is a compromise between two truths. Nobody in a string band
   * owned a stage costume; but the Carter Family and every family band after them
   * dressed the same because they were dressed by the same person, and the
   * photographs are of people wearing the good version of what they wore anyway.
   * `sequinChance: 0` — the rhinestone suit is twenty years away and putting one
   * here would be the single most anachronistic object the wardrobe can produce.
   */
  stringband: {
    jackets: ['#4a4238', '#2f3a3f', '#5a4a35', '#6b5f4a', '#3a3a2e', '#7a6a52'],
    shirts: ['#ffffff', '#f2ecdc', '#d8d2c0', '#c9c2ae'],
    trousers: ['#3a3630', '#2b2b2b', '#4b4438', '#55503f'],
    accents: ['#8a2f2c', '#2f4a3a', '#b08a3c'],
    loud: ['#f2ecdc', '#b08a3c'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018', '#6b4423', '#8a6a3a'],
    hairStyles: [['short', 6], ['slick', 4], ['updo', 3], ['braids', 2], ['long', 1], ['bald', 1]],
    accessories: [['cowboyhat', 0.25], ['moustache', 0.2], ['bowtie', 0.15], ['flatcap', 0.2], ['beard', 0.12]],
    fabrics: [['flannel', 5], ['wool', 4], ['denim', 3], ['linen', 2], ['corduroy', 2]],
    /**
     * *Work clothes and one good shirt*, and the shapes are where that shows.
     *
     * `shirtsleeves` leads, which no other era in the project does, and it is
     * the only garment in the union that is about a person having taken
     * something off. Its braces are two dark straps over a pale field, and that
     * is the whole silhouette of a 1932 string band: five men who own one jacket
     * between them and are not wearing it because the barn is thirty degrees.
     *
     * `waistcoat` next, because the good version of what you wore anyway is a
     * vest over the same shirt — and it is the same object `finnfolk:pelimanni`
     * and `classical:baroque` reach for from two completely different
     * directions, which is the test a member of that union has to pass.
     *
     * The most important thing about this table is what it does *against*
     * `honkytonk` twenty-three years later. That era is a suit at 7 and this one
     * is a suit at 3, so the two rows on the bench differ in outline before they
     * differ in a single colour — which is the sentence the whole garment
     * exercise was started to be able to write.
     */
    garments: [['shirtsleeves', 5], ['waistcoat', 4], ['suit', 3]],
    loudFabric: 'wool', sequinChance: 0,
    matched: 0.45, uniform: 0.4, spotlight: 0.2,
  },
  /**
   * 1955. The Nudie suit, and it is the one moment in this project where the
   * `sequin` mechanism was built for a real garment rather than approximated.
   *
   * Nudie Cohn made western-cut suits in Los Angeles with embroidery and
   * rhinestones on them, and the important thing about them is that **one person
   * in the band wore one**. The rest of the group was in matching plain western
   * jackets; the man at the microphone was in cactuses and wagon wheels and about
   * two thousand stones. `Wardrobe`'s own comment puts it exactly — everybody in
   * sequins is a pantomime, one person in sequins in front of five is a band — and
   * `sequinChance: 0.45` against `spotlight: 0.5` is that arithmetic: about a
   * quarter of the nights, the lead is in the good suit.
   *
   * `cowboyhat` at 0.6 is the highest single accessory weight in the project, and
   * it is the correct number rather than a joke. Its own comment says it is read
   * from the outline rather than from the colour, brim two and a half heads across,
   * and that is what makes a band in one legible from the back of the room.
   * `EXCLUSIVE` in `cast.ts` allows one hat, so nothing else headwear-shaped is
   * weighted beside it — a second entry would buy nothing and waste a draw.
   */
  honkytonk: {
    jackets: ['#1f2a3f', '#7a2030', '#2f4a35', '#c9b47a', '#5a2a52', '#243036', '#8a5a2a'],
    shirts: ['#ffffff', '#fdf6e6', '#e8f0f6', '#ffe9c4'],
    trousers: ['#1f2430', '#2b2b2b', '#3a3630', '#4a3a2c'],
    accents: ['#d42b3a', '#f2c23c', '#2b8a5a', '#f0f0f0'],
    loud: ['#f2c23c', '#d42b3a', '#f5f0e2'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018', '#6b4423', '#a07a3a'],
    hairStyles: [['slick', 6], ['short', 4], ['updo', 3], ['curls', 2], ['beehive', 1], ['bald', 1]],
    accessories: [['cowboyhat', 0.6], ['tie', 0.35], ['bowtie', 0.15], ['moustache', 0.12], ['glasses', 0.15]],
    fabrics: [['wool', 5], ['satin', 3], ['denim', 2], ['linen', 2], ['flannel', 1]],
    /**
     * The Nudie suit is a *suit*, and the table says so at 7.
     *
     * This is the era where the garment vocabulary has the least to add and that
     * is the correct answer rather than a gap. A western-cut stage suit is a
     * lounge suit with two thousand rhinestones on it, and the rhinestones are
     * `sequin` — a fabric, already built, already reserved to the one person
     * fronting the number by `sequinChance` and `spotlight` above. Inventing a
     * ninth silhouette for it would be putting a costume in the union to say
     * something the fabric table says better.
     *
     * What the two low weights buy is the *band* behind that man. A honky-tonk
     * five-piece is not five Nudie suits; it is one, and four people in a vest
     * or in their shirt who have been on the road since Tuesday.
     */
    garments: [['suit', 7], ['waistcoat', 2], ['shirtsleeves', 1]],
    loudFabric: 'satin', sequinChance: 0.45,
    matched: 0.7, uniform: 0.55, spotlight: 0.5,
  },
  /**
   * 1968. The suit gets less western and the room gets more expensive.
   *
   * A dinner jacket rather than a Nudie suit, a gown rather than a shirt, and the
   * hat comes off — `cowboyhat` drops from 0.6 to 0.2, which is the visible half of
   * exactly the same decision the era table describes in instruments. Chet Atkins
   * took the fiddle and the steel off the record because they said *country* to a
   * radio programmer; the hat said it to a television audience and went the same
   * way.
   *
   * `uniform: 0.6` is the highest here and it is not a showband's number, it is a
   * *session* band's: these were eight men who worked together every day and were
   * dressed by the network. `beehive` and `updo` are weighted properly for the first
   * time in this genre because this is the era with women fronting the records —
   * Patsy Cline, Loretta Lynn, Tammy Wynette — which is a fact about the music and
   * not only about the clothes.
   */
  nashville: {
    jackets: ['#20242e', '#3a3f4c', '#e9e4d6', '#5a4a52', '#2f4038', '#7a6a52', '#8a2f4a'],
    shirts: ['#ffffff', '#fdf9ee', '#eef3f6', '#f6dce6'],
    trousers: ['#20242e', '#2b2b2b', '#3a3f4c', '#4a4038'],
    accents: ['#c02a3a', '#e8c458', '#2f6a9e', '#f0e6d2'],
    loud: ['#e8c458', '#f0e6d2', '#c02a3a'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018', '#6b4423', '#c2a35a'],
    hairStyles: [['slick', 5], ['updo', 4], ['beehive', 4], ['short', 4], ['bob', 2], ['curls', 2], ['bald', 1]],
    accessories: [['tie', 0.45], ['cowboyhat', 0.2], ['bowtie', 0.2], ['earrings', 0.25], ['glasses', 0.15]],
    fabrics: [['wool', 5], ['satin', 4], ['silk', 3], ['linen', 2], ['velvet', 1]],
    /**
     * *A dinner jacket rather than a Nudie suit, a gown rather than a shirt.*
     *
     * The era comment says both halves already and now both are drawable. `gown`
     * at 2 is the second clause, and it belongs to the same fact the hair table
     * is built on — this is the decade with women fronting the records, which
     * is why `beehive` is weighted at 4 up there and why a floor-length dress
     * belongs on this platform and on no other in the genre.
     *
     * `tails` at 1 is the network. An Opry broadcast in 1968 had somebody in the
     * house band in evening dress, usually the man conducting the strings, and
     * one in ten is about how often you see him.
     */
    garments: [['suit', 6], ['gown', 2], ['waistcoat', 1], ['tails', 1]],
    loudFabric: 'satin', sequinChance: 0.3,
    matched: 0.75, uniform: 0.6, spotlight: 0.45,
  },
  /**
   * 1978. Denim, leather, hair, and the rhinestones left in the case.
   *
   * `uniform: 0.1` is the lowest number in this file and the most accurate.
   * Nothing anybody in a 1975 Austin band is wearing matches anything anybody else
   * is wearing, and that was the entire point — the outlaw argument was about
   * production control and it was expressed in clothes before it was expressed in
   * anything else.
   *
   * `sequinChance: 0.06` and not zero, which is the joke the wardrobe is entitled
   * to make. Willie Nelson wore a Nudie suit for years before he grew the beard,
   * and about one night in twenty somebody still turns up in one.
   *
   * `mullet` is weighted properly here for the only time in the project, and its
   * own comment is why it is worth having: short everywhere the audience can see,
   * long behind. That is a silhouette the front row and the back row read
   * differently, which is a genuinely unusual property for a hairstyle to have.
   */
  outlaw: {
    jackets: ['#2b3a4a', '#4a3a2c', '#1f1a17', '#5a4030', '#3a4a35', '#6b4a2a', '#7a2a20'],
    shirts: ['#c9bfa0', '#8a9a7a', '#d8cfb8', '#6f5a44', '#b8a884', '#2b2b2b'],
    trousers: ['#2f3a4a', '#3a3630', '#1f1c19', '#4a4038'],
    accents: ['#b8452b', '#d4a72b', '#7a5a3a'],
    loud: ['#d4a72b', '#b8452b'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018', '#6b4423', '#a07a3a', '#9a9a92'],
    hairStyles: [['long', 5], ['mullet', 4], ['mane', 3], ['short', 3], ['bald', 1], ['slick', 1], ['braids', 1]],
    accessories: [['beard', 0.5], ['cowboyhat', 0.5], ['bandana', 0.35], ['moustache', 0.3], ['sunglasses', 0.25]],
    fabrics: [['denim', 6], ['flannel', 4], ['leather', 4], ['corduroy', 2], ['wool', 2]],
    /**
     * The denim vest over the shirt, which is what 1978 actually looks like.
     *
     * `waistcoat` and `suit` level at 4, and the vest is the one worth arguing.
     * It draws the sleeves from the *shirt* rather than the jacket, so a player
     * in one has shirt-coloured arms and a dark body — and with `denim` at the
     * head of the fabric table above that is a cut-off jacket over a work shirt
     * without either object having to be modelled. The same member that dresses
     * a Kaustinen fiddler and a 1720 harpsichordist dresses this, which is the
     * whole argument for a small union stated three ways.
     *
     * `shirtsleeves` only at 1. Braces are a 1932 object and this is the era
     * that spent its entire political capital on not looking like Nashville; one
     * night in ten in a hall in Texas is as far as that goes.
     */
    garments: [['suit', 4], ['waistcoat', 4], ['shirtsleeves', 1]],
    loudFabric: 'leather', sequinChance: 0.06,
    matched: 0.2, uniform: 0.1, spotlight: 0.3,
  },
};

/**
 * Country: a card on the door of a dance hall.
 *
 * The register is the house one — affectionate, dry, and never a critic's — and
 * there is one rule this genre needs that the others do not. **No accent, and no
 * dropped g's.** A bill written in a voice the writer does not have is an
 * impression, and an impression is the one thing that would make this table read as
 * somebody else's joke about the music rather than as the music's own. The lines
 * are in the same plain English as everything else in the project; what makes them
 * belong here is what they are *about* — the steel player, the bar, the number of
 * chords, and how far anybody in the band moves.
 *
 * Nothing here explains anything. A line telling the audience where the boom-chuck
 * is would be a lecture, and they are already dancing to it.
 */
const BLURBS: Blurb[] = [
  { text: 'nobody in this one is going to be all right', styles: ['murderballad'], moods: ['lonesome'] },
  { text: 'three chords, and the third is a formality', styles: ['bluegrass', 'breakdown'] },
  { text: 'the banjo player has not stopped since 1946', styles: ['bluegrass', 'newgrass'] },
  { text: 'everybody steps up to the microphone and then steps back', styles: ['bluegrass', 'duet'] },
  { text: 'played for a floor, and the floor knows it', styles: ['twostep', 'cajun'], moods: ['hoedown'] },
  { text: 'one two three, and try not to spill it', styles: ['waltz', 'bluegrasswaltz'] },
  { text: 'the steel player is doing the crying', styles: ['honkytonk', 'countrypolitan'] },
  { text: 'a full triplet, and a full glass', styles: ['honkytonk'], moods: ['barroom'] },
  { text: 'the horn section thinks this is a jazz date. they are not wrong', styles: ['westernswing'] },
  { text: 'the same four bars for six minutes, which is the idea', styles: ['trainsong'], moods: ['highway'] },
  { text: 'the bass player is standing on it again', styles: ['rockabilly'] },
  { text: 'somebody has brought a triangle and will not put it down', styles: ['cajun'] },
  { text: 'the rubboard is not optional', styles: ['zydeco'] },
  { text: 'strings, and not one of them apologises', styles: ['countrypolitan'], moods: ['heartbreak'] },
  { text: 'somebody is being sung about and they are not here', styles: ['ballad'], moods: ['heartbreak'] },
  { text: 'two voices, one of them a third up, all night', styles: ['duet'], moods: ['sunday'] },
  { text: 'no shuffle. that is the whole announcement', styles: ['bakersfield'] },
  { text: 'straight eighths and somewhere to be', styles: ['truckdriving', 'countryrock'], moods: ['highway'] },
  { text: 'nobody in this band has been told what to play', styles: ['outlaw', 'altcountry'], moods: ['hardluck'] },
  { text: 'the good suit stayed in the case', styles: ['outlaw'] },
  { text: 'up a semitone for the last one, and you will hear it coming', styles: ['countrypop'], slot: 'close' },
  { text: 'the bar is at the back and it is open', slot: 'open' },
  { text: 'hats off for this one', styles: ['gospel'], moods: ['sunday'] },
];

export const STAGING: Staging = {
  room: DANCE_HALL,
  wardrobe: WARDROBE,
  /**
   * Honky-tonk, when the era is one this genre has no clothes for. It is the
   * picture the word means to anybody who is not being careful — a hat, a steel
   * guitar and a bar — and the other three read as the approach to it and the
   * departure from it.
   */
  defaultEra: 'honkytonk',
  blurbs: BLURBS,
  /**
   * Just under the dance band, and above everything else here.
   *
   * The floor is as full as a tanssilava's and the couples on it are moving in the
   * same way, which argues for the pavilion's 1.0. What holds it back is that
   * `body` is a multiplier on the *players*, and this genre contains the single
   * most physically static band in the project: five people in a line, stepping to
   * one microphone to take a break and stepping away again, and moving exactly as
   * far as that and no further for two hours. A honky-tonk band moves; a bluegrass
   * band deliberately does not, and 0.95 is the honest average of a genre that
   * contains both.
   */
  body: 0.95,
};
