/**
 * What hiphop stages: a club with a rig in it that is too big for the room.
 *
 * The room, the clothes and the programme copy for this genre. `Staging` in
 * `genre/types.ts` has the argument for why a genre carries its own rather than
 * the renderer holding a registry, and `venue.ts` states the rule this file
 * obeys: **genre dresses the room, era shifts the palette and the fixtures.**
 *
 * Read the other genres' staging before touching this one. Half of what follows
 * is chosen *against* a neighbour — the small stage is the exact inverse of the
 * ballroom funk needs for nine people, the near-absent uniform after 1991 is
 * what the tanssilava's argument looks like taken to its limit, and the `chain`
 * probability in 2001 is set against every other accessory number in the project
 * rather than against anything in this file. None of that is legible from here.
 *
 * ## The staging fact this genre has to confront: much of this music has no band
 *
 * From 1991 onward the `drumSources` tables in `eras.ts` are `programmed`-led
 * and by 2015 there is nothing else in them — so what `cast.ts` puts on the
 * boards is a machine with somebody minding it, which is correct and is a
 * smaller picture than the music is. The honest description of a hiphop stage is
 * *two people and a rig*: one at a table with headphones on, one at the front
 * with a microphone, and a wall of speakers that cost more than everything else
 * in the building. Two of those three are expressible here and the third is not.
 *
 * **What the engine could not be told.** The person at the front is the act, and
 * this project has no object for them. `Genre.vocals` produces a `vocal` layer
 * that doubles the melody, so the singer casts as a *doubling* of an
 * instrumental line rather than as the thing everybody came to see; there is no
 * `Archetype` for a person holding a microphone and nothing else, and the
 * nearest available fact — that the vocal layer exists — puts them in the row
 * with the keyboard players. So the stage below is dressed for the band this
 * genre *records* with rather than the one it performs with, and the difference
 * is the whole of what a hiphop concert looks like. `hiphop/vocals.ts` makes the
 * same complaint about the sound.
 *
 * `riser` is in the room's own props even so, and the reason is mechanical
 * rather than musical: `cast.ts` stands a drummer 0.4 m up whatever the dressing
 * says, so a probabilistic platform leaves them floating on the seeds where it
 * does not fire. Two of the four eras here can draw a `kit`, which is enough.
 * On the other two the empty platform at the back is not a mistake in the
 * picture — a club owns its riser and the act brings a laptop.
 */

import type { Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE CLUB — hiphop.
 *
 * A flat-floored room with a low stage at one end and a bar down the side: the
 * community hall this music started in, the four-hundred-capacity club it spent
 * the nineties in, and the same building with a truss over it later. `dancehall`
 * rather than `ballroom`, which is the room next door and holds nine people: the
 * distinguishing fact here is not the shape but the *scale*, and this is the
 * smallest room in the project outside the jazz cellar.
 *
 * **9.6 by 5.6 metres**, against funk's 11.5 by 7 and country's 10.5 by 6, and
 * the size is a claim rather than an economy. `chooseVenue` runs before the cast
 * exists, so a room has to hold the largest band its genre can produce — and the
 * largest band this genre can produce is six, most of whom are standing at
 * tables. A stage sized for a horn section with three people on it photographs
 * as an empty stage, which is a different music.
 *
 * `pa-stack` is in the genre's own props and it belongs there rather than in any
 * era. Everything else in this file changed between 1980 and 2015; the speaker
 * stack did not, because it is the one object without which none of this music
 * exists — the whole idiom begins with somebody deciding the rig mattered more
 * than the band. `venue.ts` draws the distinction between this and `backline`
 * exactly right, and **this genre never has a backline at all**, in any era,
 * which is the shortest way to say what kind of stage it is.
 *
 * The audience stands, at a density of 0.88, and it is a shade under funk's 0.9
 * for one reason: the room is smaller, so the same crowd is closer.
 */
const CLUB: StageRoom = {
  id: 'club',
  architecture: 'dancehall',
  names: [
    'The Annex', 'Unit 12', 'The Basement', 'Hall C', 'The Loading Bay',
    'The Rec Room', 'The Back Room',
  ],
  width: 9.6, depth: 5.6,
  audience: { rows: 9, density: 0.88, seated: false },
  // The rig, the platform and the gaffer tape. None of them is a decade's
  // decision and all three are on every stage this genre has ever had.
  props: ['pa-stack', 'riser'],
  eras: {
    /**
     * 1980. A community hall with the chairs stacked at the back, a rig somebody
     * borrowed, and string lights because whoever booked it wanted it to look
     * like an occasion. Warm tungsten, brown boards, and a bar at the side that
     * is a table with a cloth on it.
     *
     * `bunting` and `fairy-lights` are the pavilion's objects and they are here
     * on purpose: this is the one era of this genre that is a *party thrown by
     * somebody* rather than a show put on by a promoter, and it should read as
     * the same kind of evening as a village dance in a different country.
     */
    parkjam: {
      palette: {
        boards: '#6b5133',
        backdrop: '#2a2118',
        curtain: '#7b3a24',
        proscenium: '#c4a468',
        ambient: '#ffcf92',
      },
      props: ['fairy-lights', 'bunting', 'posters', 'dance-floor', 'wedges'],
      maybe: [['bar', 0.5], ['mirror-ball', 0.4], ['tables', 0.3], ['moths', 0.2]],
      fog: 0.18,
    },
    /**
     * 1991. A low black room with a lid on it. `low-ceiling` is the era's
     * defining prop and the dancehall builder answers it — a metre of headroom
     * over the players and the boards dropped to a kerb, which is what a
     * four-hundred-capacity club is and is why every photograph of this decade
     * is lit from below.
     *
     * `flight-case` arrives and never leaves. From here on the gear is somebody's
     * hired equipment rather than somebody's own, and the boxes stay on the stage
     * because there is nowhere else in the building to put them.
     */
    golden: {
      palette: {
        boards: '#3d3630',
        backdrop: '#161513',
        curtain: '#3a2f2a',
        proscenium: '#6e6459',
        ambient: '#e8b268',
      },
      props: ['low-ceiling', 'posters', 'bar', 'flight-case', 'wedges', 'neon'],
      maybe: [['haze', 0.5], ['rug', 0.35], ['tables', 0.3]],
      fog: 0.34,
    },
    /**
     * 2001. The lid comes off, a truss goes up, and a barrier appears across the
     * front of the house — the moment the audience stops being a room and starts
     * being a crowd, which is the same sentence funk's 1980 dressing makes about
     * a different decade and a different reason.
     *
     * Chrome, magenta and a lot of light. The room has grown by two thirds of a
     * metre and the act has shrunk to three people, which is this decade in one
     * line.
     */
    southern: {
      palette: {
        boards: '#453f3c',
        backdrop: '#12141c',
        curtain: '#5c2148',
        proscenium: '#8d8a86',
        ambient: '#ff9ad0',
      },
      props: ['truss', 'crowd-barrier', 'neon', 'bar', 'wedges', 'flight-case'],
      maybe: [['haze', 0.6], ['screen', 0.35], ['mirror-ball', 0.2]],
      fog: 0.4,
      grow: [0.7, 0.3],
    },
    /**
     * 2015. Cold white, an LED wall and almost nothing on the boards. `screen`
     * rather than `projection`: the first is a lit rectangle made of diodes and
     * the second is film on a cloth, and the thirty-five years between them is
     * the distance this era has travelled from the top of this table.
     *
     * The largest stage this genre has and the fewest objects standing on it,
     * which is exactly what `modern` in `eras.ts` says about the arrangement.
     */
    modern: {
      palette: {
        boards: '#2c2e33',
        backdrop: '#0c0f14',
        curtain: '#1a2029',
        proscenium: '#5a626c',
        ambient: '#cfe6ff',
      },
      props: ['truss', 'screen', 'crowd-barrier', 'wedges', 'flight-case'],
      maybe: [['haze', 0.7]],
      fog: 0.44,
      grow: [1.1, 0.5],
    },
  },
  fallback: {
    palette: {
      boards: '#3d3630', backdrop: '#161513', curtain: '#3a2f2a',
      proscenium: '#6e6459', ambient: '#e8b268',
    },
    props: ['posters', 'bar', 'wedges', 'flight-case'],
    fog: 0.34,
  },
};

const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1980. A crew, and a crew in this decade matched on purpose — the early
   * groups dressed as a *unit*, in leather or in the same colour, because they
   * had come out of the same revue tradition funk's 1968 band did and had not
   * yet decided to stop. `uniform: 0.45` is the highest this genre ever gets and
   * it is still only half a dance band's.
   *
   * `loudFabric: 'leather'` rather than `sequin` or `lame`, and it is the only
   * genre in the project that names it. The lead here is not brighter than the
   * band, they are *harder* — a black leather suit under a follow spot is a
   * single moving highlight on a matte body, which is the opposite of what a
   * sequinned jacket does and is the correct photograph.
   */
  parkjam: {
    jackets: ['#1a1a1a', '#7b1f2b', '#1e3a5c', '#5c3a1e', '#d8d2c4', '#3c3f2f'],
    shirts: ['#ffffff', '#f2e6d0', '#ffd54f', '#e0e0e0'],
    trousers: ['#1a1a1a', '#2b2b2b', '#26364f'],
    accents: ['#d4af37', '#c62828', '#00897b', '#ffb300'],
    loud: ['#d4af37', '#1a1a1a', '#c0c0c0'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025'],
    hairStyles: [['afro', 4], ['braids', 3], ['short', 3], ['curls', 2], ['slick', 2], ['bald', 1]],
    accessories: [
      ['ballcap', 0.4], ['chain', 0.35], ['sunglasses', 0.3], ['hoops', 0.25],
      ['bandana', 0.2], ['moustache', 0.2],
    ],
    fabrics: [['leather', 4], ['denim', 4], ['nylon', 3], ['satin', 2], ['wool', 1]],
    /**
     * A crew in matching jackets, and two people who are not.
     *
     * `suit` at 6 is the leather jacket and the tracksuit top — both are
     * hip-length bodies with sleeves and both read as this garment. `waistcoat`
     * at 2 is the vest over a shirt, which is the one shape a DJ standing behind
     * a table for two hours actually wants. `shirtsleeves` at 2 is late in the
     * evening, and it is the same sentence funk's 1968 table makes with the same
     * weight — the difference being that here it is the norm by 1991 rather than
     * a joke about a long night.
     */
    garments: [['suit', 6], ['waistcoat', 2], ['shirtsleeves', 2]],
    loudFabric: 'leather', sequinChance: 0.1,
    matched: 0.4, uniform: 0.45, spotlight: 0.6,
  },
  /**
   * 1991. The crew stops matching and never starts again. `uniform: 0.15` is
   * near the bottom of the project, and it is a different absence from ambient's
   * — there nobody is trying to be looked at, and here everybody is dressed
   * *specifically*, in things that identify them, which is the opposite problem
   * arriving at the same number.
   *
   * The palette goes to what a hooded top and a pair of jeans are actually
   * coloured, which is not much. This is the drabbest wardrobe in the project by
   * some distance and it is correct: the visual signature of this decade is a
   * grey sweatshirt, and a genre that brightened it would be dressing a
   * different one.
   */
  golden: {
    jackets: ['#2b2f33', '#1f2a3a', '#3d3a33', '#6b2f28', '#1a1a1a', '#4a5240'],
    shirts: ['#ffffff', '#d8d8d8', '#2b2f33', '#c9c2b4'],
    trousers: ['#2f3d52', '#1a1a1a', '#3d3a33', '#5a6472'],
    accents: ['#d4af37', '#c62828', '#f0f0f0', '#2e7d32'],
    loud: ['#d4af37', '#c0c0c0', '#c62828'],
    hair: ['#101010', '#1a1a1a', '#22160f', '#3a2416'],
    /**
     * `hood` at 3 is the era, and it is a *hair* value rather than a garment —
     * `HairStyle` calls it outerwear in the jacket's colour, which is exactly
     * what it is and exactly where the renderer needs it, because a hood sits on
     * the head and everything else about a hooded top is the jacket underneath.
     * It is the single most identifiable silhouette this genre has ever had.
     */
    hairStyles: [
      ['short', 4], ['braids', 3], ['hood', 3], ['bald', 3], ['dreadlocks', 2],
      ['afro', 2], ['curls', 1],
    ],
    accessories: [
      ['ballcap', 0.55], ['chain', 0.4], ['headphones', 0.25], ['beanie', 0.25],
      ['hoops', 0.2], ['sunglasses', 0.2], ['beard', 0.15],
    ],
    fabrics: [['denim', 5], ['nylon', 4], ['knit', 3], ['leather', 2], ['corduroy', 1]],
    /**
     * The flattest three-way table in the project after funk's 1975, and it
     * arrives from the opposite direction. There the point was nine people all
     * trying to look different; here it is four people who got dressed without
     * thinking about it, and the three shapes are the three things somebody
     * owns. `shirtsleeves` at 4 is a tee and nothing over it. `waistcoat` at 3 is
     * the sleeveless body over a shirt, which is a basketball jersey over a
     * long-sleeved tee and is the decade's other silhouette. `suit` at 4 is the
     * varsity jacket and the padded coat.
     *
     * Nothing here is above 4, deliberately. Funk's staging records that a row
     * is eight players drawn at the same index of eight correlated streams and
     * that a weight of 3 put six robes on one stage; a table whose largest entry
     * is 4 out of 11 cannot produce a uniform whatever the correlation does,
     * which is the point of a wardrobe sitting under `uniform: 0.15`.
     */
    garments: [['shirtsleeves', 4], ['suit', 4], ['waistcoat', 3]],
    loudFabric: 'leather', sequinChance: 0.08,
    matched: 0.2, uniform: 0.15, spotlight: 0.5,
  },
  /**
   * 2001. Everything gets bigger, brighter and more expensive, and one accessory
   * does most of the work.
   *
   * **`chain` at 0.6 is the highest single accessory probability in the
   * project**, and it is set against the whole table rather than against
   * anything in this file. Three in five players wearing one is not a costume
   * decision, it is what the photographs of this decade contain; the nearest
   * comparable number anywhere is funk's `tie` at 0.6 in 1968, which is the same
   * observation about a different object — the one thing that is on because it
   * would be strange to be without it.
   *
   * `spotlight: 0.75` and `uniform: 0.12`. The front of this stage is dressed
   * against the back of it as hard as funk's 1975, and for a reason a stylist
   * would recognise: there is one person who is the record and four who are
   * being paid.
   */
  southern: {
    jackets: ['#ffffff', '#1a1a1a', '#c62828', '#1e3a8a', '#e0e0e0', '#7b1fa2'],
    shirts: ['#ffffff', '#f5f5f5', '#1a1a1a', '#e3f2fd'],
    trousers: ['#3f5b8c', '#1a1a1a', '#ffffff', '#4a4a4a'],
    accents: ['#d4af37', '#c0c0c0', '#00e5ff', '#ff2d95'],
    loud: ['#d4af37', '#c0c0c0', '#ffffff'],
    hair: ['#101010', '#1a1a1a', '#22160f', '#3a2416'],
    hairStyles: [
      ['braids', 5], ['bald', 4], ['short', 3], ['dreadlocks', 2], ['curls', 1],
      ['afro', 1],
    ],
    accessories: [
      ['chain', 0.6], ['wraparounds', 0.4], ['ballcap', 0.35], ['bandana', 0.25],
      ['hoops', 0.25], ['beard', 0.25], ['earrings', 0.2],
    ],
    fabrics: [['denim', 5], ['nylon', 4], ['satin', 3], ['leather', 2], ['vinyl', 2]],
    /**
     * The long white tee, and it is a garment rather than a colour.
     *
     * `shirtsleeves` at 5 leads a wardrobe table for the first time in this genre
     * and only country does it elsewhere, for a completely different reason — a
     * band that has been on the road since Tuesday against a room where the shirt
     * *is* the outfit and is deliberately three sizes too large. `waistcoat` at 3
     * is the throwback jersey, which is the one garment this decade added to the
     * vocabulary and which the union happens to be able to draw. `gown` at 1 is
     * the person singing the hook, who is on about one record in six and is
     * dressed by somebody else's stylist.
     */
    garments: [['shirtsleeves', 5], ['suit', 3], ['waistcoat', 3], ['gown', 1]],
    loudFabric: 'lame', sequinChance: 0.2,
    matched: 0.25, uniform: 0.12, spotlight: 0.75,
  },
  /**
   * 2015. Black, technical and expensive-looking without being bright, and the
   * lowest `uniform` in the project at 0.1 — below ambient's, below funk's 1975,
   * and for a third reason again: there is no band to be uniform *with*. What is
   * on this stage is one person, one person minding a laptop, and on a good night
   * a keyboard player.
   *
   * `nylon` leads the fabrics and it is the decade in one material. `Fabric` calls
   * it an anorak with a slight sheen and *the wrong kind of sheen*, which is a
   * criticism everywhere else in this project and is the correct description of
   * a four-hundred-pound technical jacket.
   */
  modern: {
    jackets: ['#151515', '#22252b', '#3a3f45', '#7a1f2b', '#0f2a1f', '#d8d8d8'],
    shirts: ['#151515', '#e0e0e0', '#2b2f36', '#4a4a4a'],
    trousers: ['#151515', '#1c1f24', '#33383f'],
    accents: ['#d4af37', '#c0c0c0', '#00e5ff', '#ff1744'],
    loud: ['#d4af37', '#c0c0c0'],
    hair: ['#101010', '#1a1a1a', '#22160f', '#5c1f2b', '#c9a86a'],
    hairStyles: [
      ['dreadlocks', 5], ['braids', 4], ['short', 3], ['hood', 2], ['bald', 2],
      ['curls', 1], ['mohawk', 1],
    ],
    accessories: [
      ['chain', 0.5], ['wraparounds', 0.35], ['hoops', 0.3], ['beanie', 0.3],
      ['earrings', 0.3], ['ballcap', 0.25], ['headphones', 0.15],
    ],
    fabrics: [['nylon', 5], ['knit', 4], ['denim', 3], ['leather', 3], ['flannel', 2]],
    /**
     * The tee stays and a long coat arrives.
     *
     * `coat` at 2 is the one shape this genre adds in thirty-five years and it is
     * worth the entry: `Garment` calls it knee-length and skirted with a standing
     * collar, which is a long technical parka seen from ten metres and is a
     * silhouette nothing else in this file produces. It is held at 2 rather than
     * 3 for the reason funk's staging measured — correlated draws across a row
     * turn a 3 into most of the stage, and a band all in floor-length coats is a
     * different genre entirely, one that already has a `shed` to play in.
     */
    garments: [['shirtsleeves', 5], ['suit', 3], ['coat', 2], ['waistcoat', 1], ['gown', 1]],
    loudFabric: 'lame', sequinChance: 0.25,
    matched: 0.3, uniform: 0.1, spotlight: 0.85,
  },
};

/**
 * Hiphop: a club bill.
 *
 * The register is the house one — affectionate, dry, never a critic's — and this
 * genre's own joke about itself is that the most confident music anybody makes
 * is assembled out of four bars of somebody else's. So the lines are about
 * borrowing, about how little is on the record, and about the rig. None of them
 * says what a loop is.
 */
const BLURBS: Blurb[] = [
  { text: 'two bars, and we are keeping them', styles: ['boombap'] },
  { text: 'somebody else played this in 1969 and got nothing for it', styles: ['jazzrap', 'soulloop'] },
  { text: 'the strings are borrowed. so is the room', styles: ['soulloop'] },
  { text: 'one horn, half a second, four hundred times', styles: ['hornloop'] },
  { text: 'the top has been taken off on purpose', styles: ['hardcore', 'lofi'] },
  { text: 'four bars of drums and a queue at the door', styles: ['breaks'], moods: ['dusty'] },
  { text: 'a band, this once', styles: ['oldschool'] },
  { text: 'nobody is in the room, and that is the arrangement', styles: ['trap', 'drill'] },
  { text: 'most of tonight is the space between the kick and the snare', styles: ['minimal', 'trap'] },
  { text: 'bring something that reproduces below forty hertz', styles: ['miami', 'dirtysouth'], moods: ['trunk'] },
  { text: 'the cowbell is not a mistake', styles: ['phonk'] },
  { text: 'at seventy per cent, and no apology', styles: ['chopped'], moods: ['hazy'] },
  { text: 'nothing here lands where the bar thinks it should', styles: ['abstract'] },
  { text: 'the loop is fine. it is the second half you will notice', styles: ['abstract', 'gfunk'] },
  { text: 'somebody shouts, everybody shouts back', styles: ['party', 'bounce'] },
  { text: 'this one had a budget', styles: ['clubrap'] },
  { text: 'played through a machine nobody has cleaned', styles: ['lofi'], moods: ['dusty'] },
  { text: 'the hats are doing the talking', styles: ['trap', 'dirtysouth'] },
  { text: 'a rig, a table, and two people', slot: 'open' },
  { text: 'we start when the tape does', slot: 'open' },
  { text: 'the one they will still be doing at the bus stop', slot: 'close' },
  { text: 'the speakers are the expensive part' },
];

export const STAGING: Staging = {
  room: CLUB,
  wardrobe: WARDROBE,
  /**
   * The golden era. Handed a decade this genre has no clothes for, the picture
   * to fall back on is the low black room in 1991 — the sampler, the hooded top
   * and the lid a metre overhead is what the whole genre is a photograph of, and
   * 1980 and 2015 are the two directions away from it rather than the thing
   * itself.
   */
  defaultEra: 'golden',
  blurbs: BLURBS,
  /**
   * 0.72, and the low number is a limitation being reported rather than a claim
   * about the music.
   *
   * `body` multiplies the groove score, which is how much the *players* move.
   * Iskelmä's 1.0 is a dance band watching a floor of couples and funk's 0.95 is
   * a band moving as much as its audience. By that measure this genre is close to
   * the bottom of the project, because on most of these stages a third of the
   * cast is standing at a table with headphones on and physically does not move
   * — which is true, and is the least interesting true thing about a hiphop show.
   *
   * The thing that is moving is the person at the front with a microphone and the
   * four hundred people in front of them, and neither is something this number
   * ranges over: the first has no archetype (see the header) and the second is
   * `Venue.audience`, which is furniture. So the honest value is a low one with
   * this note under it, rather than a high one that would be measuring something
   * the engine is not looking at.
   */
  body: 0.72,
};
