/**
 * What R&B stages: a theatre with the seats still in it.
 *
 * The room, the clothes and the programme copy for this genre. `Staging` in
 * `genre/types.ts` has the argument for why a genre carries its own rather than
 * the renderer holding a registry, and `venue.ts` states the rule this file
 * obeys: **genre dresses the room, era shifts the palette and the fixtures.**
 *
 * Read the other genres' staging before touching this one, and read funk's first,
 * because half of what follows is chosen against it. The two genres name the same
 * `architecture` and are not the same picture: that one is a flat floor with the
 * chairs taken out and nine people in mismatched satin, and this one is the same
 * building with the audience sitting down in rows, in ties, watching five men in
 * matching suits do a step. The difference is legible in exactly three fields —
 * `audience.seated`, `uniform`, and `garments` — and in nothing else, which is
 * itself the finding: two genres can share a building and share a decade and still
 * be different photographs, and what carries it is what the people are doing
 * rather than what the room is made of.
 */

import type { Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE THEATRE — R&B.
 *
 * A tired revue house on a touring circuit: a shallow arch, a gallery, a flat
 * house floor with seats bolted to it, and a cloth that has been up since before
 * anybody currently on the payroll was born. `architecture: 'ballroom'`, which is
 * the same builder funk names — and `StageRoom.architecture` says in as many
 * words that two rooms *should* name the same architecture where the building is
 * the same building, because the alternative is one of them importing the other's
 * geometry. A revue theatre and a civic ballroom are one big room with a stage at
 * one end, dressed two ways, and the twelve room builders exist so that the
 * dressing can carry the difference — twelve, not the eleven this said, which is
 * the count `RoomStyle`'s own docstring gives beside the nineteen rooms standing
 * on them.
 *
 * **The audience is seated, and that is the whole argument with the neighbour.**
 * Funk's crowd stands at density 0.9 and the comment there says a funk band in a
 * half-empty room is a soundcheck. This crowd is in rows at 0.86 with the seats
 * still bolted down, because a soul revue was a *show* — several acts, a compère,
 * a house band, two performances a night — and people bought tickets for a seat
 * number. That single boolean does more to separate the two pictures than any
 * colour in this file.
 *
 * 11 by 6.8 metres, a little smaller than the ballroom next door and still large.
 * The bands are big — a rhythm section, four horns, a string section in two of the
 * eras and a vocal group in front of all of it — and `venue.ts`'s warning about a
 * stage too small producing a solver that spreads the band to the tormentors
 * applies here as much as it does there.
 *
 * The arc across the four dressings is the thing worth reading them for, and it is
 * not the usual one. The room gets bigger and colder for twenty-four years —
 * theatre, then equipment, then a barrier and a truss — and then in 1998 it goes
 * *back into a small room with candles on the tables*, which is what that end of
 * this genre actually did on purpose.
 */
const THEATRE: StageRoom = {
  id: 'theatre',
  architecture: 'ballroom',
  names: [
    'The Regency', 'The Uptown', 'The Paramount', 'The Royal',
    'The Apollo Rooms', 'The Casino', 'The Fox',
  ],
  width: 11, depth: 6.8,
  // Seated, in rows, and nearly full. See the header — this is the field that
  // separates this picture from funk's more than any colour does.
  audience: { rows: 12, density: 0.86, seated: true },
  /**
   * The riser belongs to the genre rather than to any decade of it, and it is in
   * the always-props rather than in a `maybe` for a mechanical reason: `cast.ts`
   * stands the drummer 0.4 m up regardless, so a probabilistic draw would float
   * them on half the seeds. `venue.ts` says the same thing about the same prop,
   * and there is a drummer on every style in this genre.
   */
  props: ['riser'],
  eras: {
    /**
     * 1965. Red plush, gilt that stopped being repainted around 1948, tungsten
     * from the front of house and a follow spot from the gallery. `stalls` is
     * here and in no other dressing in this file: the seats are the room, the
     * audience is looking at a stage rather than standing on a floor, and the
     * building's other trade is a variety bill on a Tuesday.
     *
     * No PA to speak of. The band's own amplifiers and a house system that was
     * installed for speech, which is why `backline` is here and `pa-stack` is
     * not.
     */
    soul: {
      palette: {
        boards: '#6b4f31',
        backdrop: '#2a1a1f',
        curtain: '#8a1f2a',
        proscenium: '#c9a862',
        ambient: '#ffd39a',
      },
      props: ['drapes', 'backline', 'stalls', 'posters', 'wedges'],
      maybe: [['chandelier', 0.4], ['bar', 0.3], ['tables', 0.2]],
      fog: 0.2,
    },
    /**
     * 1974. The gilt goes warm rather than away, a truss arrives, and the room
     * turns amber and rose — this is the sweetest-looking era in the genre and it
     * should be, because it is the one with a string section on the stage and a
     * mirror ball over a floor that has just appeared where the front stalls
     * were.
     *
     * `dance-floor` and `stalls` are deliberately not both here. The seats came
     * out of the first six rows in about 1973 and that is the decade in one prop.
     */
    philly: {
      palette: {
        boards: '#5e4632',
        backdrop: '#2b1c2a',
        curtain: '#7d2a4a',
        proscenium: '#c19a4e',
        ambient: '#ffbe8f',
      },
      props: ['drapes', 'backline', 'pa-stack', 'truss', 'mirror-ball', 'dance-floor', 'wedges'],
      maybe: [['haze', 0.6], ['chandelier', 0.3], ['bar', 0.35]],
      fog: 0.38,
      grow: [0.4, 0.2],
    },
    /**
     * 1989. Chrome, magenta and a barrier across the front, which is the moment
     * the audience stops being a room of people who bought seats and starts being
     * a crowd. The cloth is finally gone — `drapes` drops out here for the first
     * time — and what is behind the band is a wall of speakers and a lighting
     * truss instead.
     *
     * The room has grown almost a metre wider than it was in 1965 and the band
     * has shrunk to four people and a machine, which is the twenty-four years in
     * one sentence.
     */
    newjack: {
      palette: {
        boards: '#3f3a36',
        backdrop: '#161a28',
        curtain: '#8e1f5e',
        proscenium: '#8d8677',
        ambient: '#ff8fd0',
      },
      props: [
        'pa-stack', 'truss', 'crowd-barrier', 'dance-floor', 'neon', 'wedges',
        'flight-case',
      ],
      maybe: [['haze', 0.65], ['screen', 0.35], ['mirror-ball', 0.2]],
      fog: 0.42,
      grow: [0.9, 0.4],
    },
    /**
     * 1998, and the room goes backwards.
     *
     * Every other genre in this project ends its era table in a bigger, colder,
     * more equipped building than it started in, because that is what happened to
     * live music. This one does not, and the reversal is the point: the neo-soul
     * end of this repertoire deliberately went back into a small room with tables
     * and candles in it, played to two hundred people, and made a virtue of the
     * fact that you could hear the bass amp. So the crowd barrier goes, the truss
     * goes, the drapes come back, and there is a rug on the boards.
     *
     * `low-ceiling` is the prop doing the heavy lifting: it fits two lids and
     * lowers the boards to a kerb, which turns a revue house into a club without
     * needing a twelfth room builder.
     */
    neo: {
      palette: {
        boards: '#4a3b2c',
        backdrop: '#1d1a18',
        curtain: '#5c3324',
        proscenium: '#8a7050',
        ambient: '#ffcb8a',
      },
      props: ['drapes', 'low-ceiling', 'rug', 'tables', 'candles', 'backline', 'wedges'],
      maybe: [['bar', 0.55], ['haze', 0.3], ['posters', 0.3]],
      fog: 0.26,
      grow: [-0.8, -0.4],
    },
  },
  fallback: {
    palette: {
      boards: '#5e4632', backdrop: '#2b1c2a', curtain: '#7d2a4a',
      proscenium: '#c19a4e', ambient: '#ffbe8f',
    },
    props: ['drapes', 'backline', 'pa-stack', 'wedges'],
    fog: 0.3,
  },
};

const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1965. Five men in the same suit doing the same step, and one person in front
   * of them who is not.
   *
   * `uniform: 0.88` is the highest figure in the project and it is not a
   * generalisation about the decade — it is the *format*. A vocal group in this
   * repertoire is a matched set by definition; the suits were bought together,
   * altered together and worn on the same night, and a group in which one man had
   * chosen his own jacket would have been a group with a problem. Funk's own 1968
   * entry is at 0.8 and its comment calls that nearly the swing band's; this is
   * above both, because a horn section dressing as a section is a convention and
   * a vocal group dressing as one is the act.
   *
   * `slick` leads the hair table and it is doing something specific: this is the
   * decade of the processed conk, which reads as an oiled flat silhouette from ten
   * metres and is exactly what `slick` is for. `beehive` at 3 is the other half of
   * the year and belongs entirely to `girlgroup`.
   */
  soul: {
    jackets: ['#1b2033', '#3d2a1c', '#5c1f2b', '#2c3b31', '#d8cfba', '#4b505d', '#7a6a3f'],
    shirts: ['#ffffff', '#fdf7ea', '#f1e5cf'],
    trousers: ['#1b2033', '#2a2a2a', '#3d2a1c'],
    accents: ['#c62828', '#ffb300', '#00897b', '#7b1fa2', '#d4af37'],
    loud: ['#d4af37', '#c0c0c0', '#f5f0dc'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025'],
    hairStyles: [
      ['slick', 6], ['short', 4], ['beehive', 3], ['updo', 3], ['curls', 2],
      ['afro', 1], ['bald', 1],
    ],
    accessories: [
      ['tie', 0.7], ['hoops', 0.25], ['earrings', 0.2], ['bowtie', 0.2],
      ['moustache', 0.2], ['glasses', 0.12],
    ],
    fabrics: [['wool', 6], ['satin', 3], ['silk', 2], ['velvet', 1]],
    /**
     * A matched set, and the two small weights are the front of the bill.
     *
     * `suit` at 8 is the only defensible head of this table given `uniform: 0.88`
     * above — the whole proposition of a 1965 vocal group is that five people are
     * one object. What the tails and the gown buy is the *bill* rather than the
     * band: `tails` at 1 is the compère, who is in evening dress and is the one
     * person on this stage who spends the night turned sideways, and `gown` at 2
     * is the woman fronting the number, which is where `spotlight: 0.82` lands.
     *
     * Deliberately below the weight the picture wants, and the reason is recorded
     * in funk's `pfunk` entry rather than rediscovered here: a row is eight players
     * drawn at the same index of eight correlated streams, so a tail weight of 3
     * against a head of 6 drew six of eight and the page showed a choir. At 2
     * against 8 it draws one or two, which is what a front is.
     */
    garments: [['suit', 8], ['gown', 2], ['tails', 1]],
    loudFabric: 'sequin', sequinChance: 0.4,
    matched: 0.88, uniform: 0.88, spotlight: 0.82,
  },
  /**
   * 1974. The suit stays and the silhouette opens out: wide lapels, a floor-length
   * dress on anybody fronting the number, and colours a 1965 wardrobe department
   * would have refused to order.
   *
   * `uniform` drops to 0.45 and that number is the decade. The vocal groups still
   * match — they are still vocal groups — but there are now twelve other people on
   * the stage who do not, because a string section wears its own clothes and a
   * percussionist wears whatever they like. Funk's 1975 entry is at 0.12 for the
   * opposite reason: there nine people are all trying to be seen *differently*,
   * and here five people are trying to be seen as one in front of twelve who are
   * not trying at all.
   *
   * `lame` from here on rather than `sequin`, and they are not the same object: one
   * continuous sheet of metal against a thousand separate points of it. Under a
   * follow spot the first is a single moving highlight and the second is a swarm,
   * and the gowns of this decade were the first.
   */
  philly: {
    jackets: ['#6a1b9a', '#c2185b', '#e8a33d', '#00838f', '#b34a19', '#f5f0e6', '#2b4c8c'],
    shirts: ['#ffd9a0', '#f3c9e0', '#bfe6ee', '#ffffff', '#efb2b2'],
    trousers: ['#4a148c', '#e8e0d0', '#8c3b1a', '#1a237e', '#f5f0e6'],
    accents: ['#ffd700', '#00e5ff', '#ff4081', '#b8e986'],
    loud: ['#ffd700', '#c0c0c0', '#ff7ab8'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#8a5a2b'],
    hairStyles: [
      ['afro', 6], ['updo', 4], ['mane', 3], ['curls', 3], ['slick', 2],
      ['braids', 2], ['bald', 1],
    ],
    accessories: [
      ['hoops', 0.4], ['sunglasses', 0.3], ['chain', 0.3], ['earrings', 0.25],
      ['moustache', 0.25], ['scarf', 0.2], ['beard', 0.2],
    ],
    fabrics: [['satin', 5], ['silk', 4], ['velvet', 3], ['brocade', 2], ['wool', 2]],
    /**
     * The gown arrives properly, and it is the one garment this genre needed a
     * table for.
     *
     * A matched vocal group and a floor-length dress are both this repertoire and
     * they are different *shapes* — which is the sentence `Wardrobe.garments`
     * exists to make expressible, and before it existed both of them were a lounge
     * suit in a different colour. At 3 against a head of 6 this draws two or three
     * of an eight-piece, which is a front line rather than a chorus; the note on
     * the 1965 entry above has the arithmetic and the failure it comes from.
     *
     * `coat` at 1 is the knee-length skirted thing with a standing collar that
     * turns up on exactly one photograph per act in this decade, and `waistcoat` at
     * 1 is the rhythm section, who have taken their jackets off and not gone as far
     * as shirtsleeves.
     */
    garments: [['suit', 6], ['gown', 3], ['coat', 1], ['waistcoat', 1]],
    loudFabric: 'lame', sequinChance: 0.4,
    matched: 0.55, uniform: 0.45, spotlight: 0.95,
  },
  /**
   * 1989. Black, leather, and a band that is four people and a rack.
   *
   * `uniform: 0.4` looks like a rise from the decade before and is a different
   * thing entirely: nobody here is dressed as a section, they are dressed as a
   * *group*, which is a stylist's decision rather than a bandleader's. The
   * distinction is the one funk's 1980 entry draws in the same year and this genre
   * arrives at nine years later, because it kept a horn section for longer.
   *
   * `mohawk` at 1 is standing in for the hi-top fade, which is the era's real
   * silhouette and has no entry of its own. It is the closest object in the union
   * — mostly skull with a raised crest — and it is at 1 rather than higher because
   * a table full of them would be reading a caricature back at the decade.
   */
  newjack: {
    jackets: ['#151515', '#2b2f3a', '#8c1c1c', '#e8e4dc', '#3d2a5c', '#0f3d3a'],
    shirts: ['#ffffff', '#151515', '#37474f', '#e8d9c0'],
    trousers: ['#151515', '#212121', '#37474f', '#e8e4dc'],
    accents: ['#d4af37', '#00e5ff', '#ff1744', '#c0c0c0'],
    loud: ['#d4af37', '#c0c0c0', '#ff1744'],
    hair: ['#101010', '#1a1a1a', '#22160f', '#3a2416'],
    hairStyles: [
      ['braids', 4], ['curls', 4], ['short', 3], ['bald', 2], ['updo', 2],
      ['slick', 1], ['mohawk', 1],
    ],
    accessories: [
      ['sunglasses', 0.4], ['chain', 0.4], ['hoops', 0.35], ['earrings', 0.25],
      ['ballcap', 0.2], ['wraparounds', 0.2], ['moustache', 0.15],
    ],
    fabrics: [['leather', 4], ['satin', 4], ['denim', 3], ['silk', 2], ['nylon', 2], ['vinyl', 1]],
    /**
     * The stylist's group, and the jacket comes off halfway through.
     *
     * `shirtsleeves` at 2 is the first real weight this genre gives it and it is a
     * change in what a performance *is*: 1965 was a revue where the jacket stayed
     * on for ninety minutes and 1989 is four people doing choreography for forty,
     * which nobody has ever done in wool. `waistcoat` at 2 is the other half of
     * the same body — a dark sleeveless shell over a white shirt, which under a
     * follow spot on `leather` at weight 4 is a black panel with the arms lit.
     *
     * `gown` at 2 survives from the decade before and lands where `spotlight: 0.85`
     * puts it, on one or two people out of five.
     */
    garments: [['suit', 6], ['shirtsleeves', 2], ['waistcoat', 2], ['gown', 2]],
    loudFabric: 'lame', sequinChance: 0.3,
    matched: 0.5, uniform: 0.4, spotlight: 0.85,
  },
  /**
   * 1998, and the wardrobe goes backwards with the room.
   *
   * `uniform: 0.08` is the lowest figure in this file and lower than funk's
   * mismatched nine-piece, which sounds like an overclaim and is the correct
   * description of a different thing. That band was nine people all trying to be
   * seen differently; this one is six people who are not trying to be seen at all —
   * a bass player in a linen shirt, a drummer in a T-shirt, and a singer in a wrap
   * and a floor-length dress who is the only person on the stage the lighting is
   * pointed at.
   *
   * `spotlight: 0.6` is the lowest in the project for the same reason. This end of
   * the repertoire made a virtue of not being a show, and a follow spot on the
   * front person four nights out of five is as far as that goes before it stops
   * being a concert.
   *
   * `wrap` and `dreadlocks` both carry real weight here and neither did in any
   * earlier era, which is the clearest single thing separating this picture from
   * 1965's. The head-wrap in particular is an *outline* change rather than a
   * texture one, which is the test `HairStyle` sets for the whole union.
   */
  neo: {
    jackets: ['#3b3128', '#1f2a2a', '#6b4a2e', '#8a6a3f', '#2c2c2c', '#d8cbb4'],
    shirts: ['#f2ece0', '#d8cbb4', '#b5a68d', '#2c2c2c', '#7a6a52'],
    trousers: ['#2c2c2c', '#3b3128', '#4a4034', '#d8cbb4'],
    accents: ['#c8912f', '#7a9e5b', '#a8452f', '#d4b483'],
    loud: ['#c8912f', '#d4b483', '#a8452f'],
    hair: ['#101010', '#1a1a1a', '#22160f', '#3a2416', '#5c4025'],
    hairStyles: [
      ['braids', 5], ['afro', 4], ['dreadlocks', 3], ['wrap', 3], ['short', 2],
      ['bald', 2], ['updo', 1],
    ],
    accessories: [
      ['hoops', 0.4], ['beard', 0.3], ['earrings', 0.28], ['scarf', 0.25],
      ['glasses', 0.22], ['turban', 0.12],
    ],
    fabrics: [['linen', 5], ['silk', 4], ['knit', 3], ['denim', 3], ['velvet', 2], ['corduroy', 1]],
    /**
     * Nobody is in a jacket, and one person is in a dress.
     *
     * The flattest head in this file at 6 out of 13, and the shape is chosen
     * against the arithmetic rather than against the distribution — funk's `pfunk`
     * note records what happens when a tail weight goes to 3 against a head of 6,
     * and this table keeps the tails at 2 and 1 for exactly that reason. What it
     * buys is a stage where four people are in shirtsleeves, one or two are in a
     * dark suit that does not match anybody's, one is in a floor-length gown, and
     * occasionally somebody is in a robe.
     *
     * `robe` at 1 is the same member `funk:pfunk` and `reggae:roots` both lead
     * with, arrived at from a third direction and twenty-five years later — which
     * is a small argument for the union being right: three genres, three
     * continents, one silhouette.
     */
    garments: [['shirtsleeves', 6], ['suit', 4], ['gown', 2], ['robe', 1]],
    loudFabric: 'silk', sequinChance: 0.08,
    matched: 0.2, uniform: 0.08, spotlight: 0.6,
  },
};

/**
 * R&B: a revue bill.
 *
 * The register is the house one — affectionate, dry, and never a critic's — with
 * this genre's own joke about itself running through it, which is that everybody
 * on the stage is working extremely hard to make one person sound effortless. So
 * the lines are about the people nobody claps for: the tambourine player, the
 * string section, the man who wrote the bass part, the second and third voices.
 * None of them says what soul is.
 */
const BLURBS: Blurb[] = [
  { text: 'somebody has to hit the tambourine, and it is not the drummer', styles: ['motown'] },
  { text: 'the snare arrives when it is ready', styles: ['stax'], moods: ['shout'] },
  { text: 'five people, one microphone, four chords', styles: ['doowop'] },
  { text: 'more percussion than the room strictly needs', styles: ['girlgroup'] },
  { text: 'a country band who have been to church', styles: ['southern'] },
  { text: 'this one is slow because it has to be', styles: ['deepsoul'], moods: ['ache'] },
  { text: 'clap on the ones you can find', styles: ['gospelsoul'] },
  { text: 'they learned it off the record, and then some', styles: ['blueeyed'] },
  { text: 'nobody sits down for this one', styles: ['stomper'] },
  { text: 'the bass player has heard what is happening next door', styles: ['funksoul'] },
  { text: 'eighteen violins, and every one of them on the payroll', styles: ['philly', 'ballad'] },
  { text: 'played at half the volume, on purpose', styles: ['chicago'] },
  { text: 'the kick is on all four from here on', styles: ['discosoul'] },
  { text: 'written for a format that had just been invented', styles: ['crossover', 'contemporary'] },
  { text: 'the strings leave before the end. they always do', styles: ['ballad', 'philly'] },
  { text: 'later than you think, and quieter', styles: ['quietstorm', 'slowjam'], moods: ['smoulder'] },
  { text: 'a machine, and somebody who missed drummers', styles: ['newjack', 'synthsoul'] },
  { text: 'two bars, borrowed, and a very good singer', styles: ['hiphopsoul'] },
  { text: 'the quantise is off and that was the plan', styles: ['neosoul', 'offgrid'] },
  { text: 'one person made all of this in a bedroom', styles: ['bedroom'] },
  { text: 'ladies and gentlemen, and we mean it', slot: 'open' },
  { text: 'the one they will be humming on the bus', slot: 'close' },
  { text: 'the horn section would like a word about the parking' },
];

export const STAGING: Staging = {
  room: THEATRE,
  wardrobe: WARDROBE,
  /**
   * 1965. Handed an era this genre has no clothes for, the picture to fall back on
   * is the revue — the matched suits, the seated house and the tambourine — because
   * that is what the whole genre is a photograph of, and the other three eras are
   * directions away from it rather than the thing itself.
   */
  defaultEra: 'soul',
  blurbs: BLURBS,
  /**
   * A shade under the dance band, and above the jazz quintet.
   *
   * Iskelmä's 1.0 is a band watching a floor of couples dance and funk's 0.95 is a
   * band moving as much as the floor is. This is 0.9 and the two halves of the
   * stage are pulling it in opposite directions: the front of it is four people
   * doing a *choreographed step*, which is more organised movement than anything
   * else in the project, and the back of it is a string section reading off stands,
   * which is the least. The number is what those average to, and the reason it is
   * not higher is that in two of the four eras a third of the players are seated
   * with a bow in their hand.
   */
  body: 0.9,
};
