/**
 * What drum and bass stages: an industrial unit, a rig, and almost nobody.
 *
 * The room, the clothes and the programme copy for this genre. `Staging` in
 * `genre/types.ts` has the argument for why a genre carries its own rather than
 * the renderer holding a registry, and `venue.ts` states the rule this file
 * obeys: **genre dresses the room, era shifts the palette and the fixtures.**
 *
 * Read the other genres' staging before touching this one. Half of what follows
 * is chosen *against* a neighbour — the shallow stage is the inverse of funk's
 * ballroom, the fog numbers are set against every other genre's rather than
 * against anything in this file, and the `headphones` probability in 1995 is at
 * the top of the project and is meaningless except next to the ones it beats.
 * None of that is legible from here.
 *
 * ## The staging fact this genre has to confront: there is no band at all
 *
 * hiphop's file opens by saying that from 1991 onward its `drumSources` tables
 * are `programmed`-led and by 2015 there is nothing else in them. **This genre
 * starts there.** Two of the four eras in `eras.ts` are single-entry
 * `[['programmed', 10]]` tables and the other two admit a person one draw in
 * ten, so what `cast.ts` puts on the boards is a machine with somebody minding
 * it, in every era, for the whole thirty years.
 *
 * The honest description of a drum and bass stage is **two people and a wall**:
 * one behind a table with one headphone cup against an ear, one at the front
 * with a microphone, and a speaker stack that costs more than everything else in
 * the building. Exactly one of those three is expressible here.
 *
 * **What the engine could not be told.** The person at the front is the act, and
 * this project has no object for them — `Genre.vocals` produces a `vocal` layer
 * that doubles the melody, so a front person casts as a *doubling of an
 * instrumental line* and stands in the row with the keyboard players.
 * `docs/engine-gaps.md` §3.20 records the want and hiphop reported it first. The
 * version of it here is sharper in one respect: an MC is a **live-only** role.
 * They are not on the record at all, so a genre that stages the band it *records*
 * with does not merely mis-place them, it has no reason to know they exist. The
 * stage below is therefore dressed for a room that has, most nights, one person
 * standing in it, and the difference between that and what the photographs
 * contain is the whole of what a drum and bass night looks like.
 *
 * `riser` is in the room's own props even so, and the reason is mechanical
 * rather than musical: `cast.ts` stands a drummer 0.4 m up whatever the dressing
 * says, so a probabilistic platform leaves them floating on the seeds where it
 * does not fire. Two of the four eras can draw `electronic-kit`. That is a low
 * rate and it is not zero, and the empty platform at the back on the other seeds
 * is not a mistake in the picture — the building owns its riser and the act
 * brings a bag.
 */

import type { Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE UNIT — drum and bass.
 *
 * A portal-framed industrial hall with a rig at one end: the warehouse this
 * music started in, the railway arch it spent the nineties under, and the
 * purpose-built room with a truss in it later. `shed` rather than `dancehall`,
 * which is hiphop's club next door, and the two are worth reading together
 * because the same architecture is doing opposite work. metal takes `shed`
 * because the band fills it; this takes `shed` because **the room is the
 * instrument** — hard surfaces, visible structure, no soft furnishing anywhere,
 * and a low deck, all of which are the conditions under which a note at 40 Hz is
 * still a note by the time it reaches the back.
 *
 * **10.4 by 5.2 metres, and the depth is the claim.** Only house's warehouse is
 * shallower, at 5.0, and the two rooms arrive there from the same fact: hiphop's
 * club is 5.6 deep and funk's ballroom is 7, and both of those have a band in
 * them. Here there is *nothing upstage*. A rig-and-table setup puts
 * everything across the front in one line: two tables, a stack either side, and
 * a wall behind. A stage sized for a band standing in rows would photograph as
 * an empty stage with two people on the lip of it, which is a different music
 * and a worse picture of this one.
 *
 * `pa-stack` and `cables` are in the genre's own props rather than in any era.
 * Everything else in this file changed between 1992 and 2012; those two did not,
 * because they are the objects without which none of this exists — a music whose
 * entire lower two octaves are inaudible on a domestic speaker is a music about
 * the rig before it is about anything else. **This genre never has a `backline`
 * in any era**, which `venue.ts` distinguishes from `pa-stack` precisely so a
 * room can say which kind of stage it is.
 *
 * The audience stands, at a density of 0.92 — second only to metal's 0.94, and
 * above funk's 0.9 and hiphop's 0.88. It is a smaller crowd fact than it looks,
 * because what is being described is not enthusiasm but a room with no seating
 * in it at all and a bar that people have already left.
 */
const UNIT: StageRoom = {
  id: 'unit',
  architecture: 'shed',
  names: [
    'Unit 7', 'The Arch', 'Bay 3', 'The Depot', 'The Warehouse', 'Sub Level',
    'The Loading Dock', 'Block C',
  ],
  width: 10.4, depth: 5.2,
  // The rig, the wiring and the platform nobody stands on. None of them is a
  // decade's decision.
  props: ['pa-stack', 'cables', 'riser', 'flight-case'],
  audience: { rows: 10, density: 0.92, seated: false },
  eras: {
    /**
     * 1992. A brick shell somebody has hired for the night, with a rig at one
     * end and nothing else in the building. `brick` bonds the walls and the
     * backdrop, which is the modifier doing the most work in this file: what
     * this room is *is* an unfinished interior, and the absence of a surface
     * treatment is the whole visual proposition.
     *
     * `fog: 0.5`, and the reason is not atmosphere. A rave is lit with beams and
     * a beam is only visible in smoke; the haze is not decorating the light, it
     * is the reason anybody can see there is any.
     *
     * **This note said *above every genre except ambient, house and synth*, and
     * the three names are right about the wrong quantity.** They are exactly the
     * genres whose *opening* era is foggier than this one — ambient 0.68, house
     * 0.6, synth 0.55, and this 0.5, fourth of nineteen. They are not the only
     * genres carrying a bigger number than 0.5: metal's `extreme` writes 0.62
     * and its `thrash` writes 0.5 flat. Counted the way the `design` era below
     * counts, which is one number against every other number in the project,
     * there is a fourth exception. Counted by opening era there is none, and
     * that is what the sentence had measured without saying so.
     *
     * `mirror-ball` at 0.25 is the one soft object in the era and it is a
     * borrowed one — half of these buildings had been something else, and some
     * of them had been a disco.
     */
    rave: {
      palette: {
        boards: '#3a332c',
        backdrop: '#1a1614',
        curtain: '#2a2420',
        proscenium: '#6b5a48',
        ambient: '#7be3c8',
      },
      props: ['brick', 'haze', 'dance-floor', 'wedges', 'posters'],
      maybe: [['bar', 0.45], ['mirror-ball', 0.25], ['neon', 0.3], ['moths', 0.15]],
      fog: 0.5,
    },
    /**
     * 1995. A railway arch with a lid on it. `low-ceiling` fits two lids and
     * drops the boards to a kerb, which is what a two-hundred-capacity room
     * under a viaduct is, and it is the reason every photograph of this era is
     * lit from below and from the side.
     *
     * The palette goes almost monochrome with one sodium colour in it. This is
     * the drabbest room in the project after hiphop's 1991 and it is the same
     * observation about the same years from a different city: the visual
     * signature of the decade is a dark room with one orange light in it, and a
     * genre that brightened it would be dressing a different one.
     */
    dubplate: {
      palette: {
        boards: '#2e2b28',
        backdrop: '#121110',
        curtain: '#211d1a',
        proscenium: '#4e463c',
        ambient: '#ffa64d',
      },
      props: ['brick', 'low-ceiling', 'haze', 'posters', 'bar', 'wedges'],
      maybe: [['neon', 0.4], ['rug', 0.2], ['tables', 0.2], ['dance-floor', 0.3]],
      fog: 0.62,
    },
    /**
     * 2002. The lid comes off, a truss goes up and a barrier appears across the
     * front — the moment the audience stops being a room and becomes a crowd,
     * which is the same sentence hiphop's 2001 dressing makes about the same
     * three years and a different scene.
     *
     * Cold blue, chrome and a great deal of light. The building has grown by
     * most of a metre and the act has shrunk to two people, which is this decade
     * in one line.
     */
    studio: {
      palette: {
        boards: '#38383c',
        backdrop: '#101319',
        curtain: '#1b2029',
        proscenium: '#7d8188',
        ambient: '#7fc4ff',
      },
      props: ['truss', 'crowd-barrier', 'haze', 'neon', 'wedges', 'bar'],
      maybe: [['screen', 0.4], ['brick', 0.3], ['dance-floor', 0.25]],
      fog: 0.68,
      grow: [0.8, 0.2],
    },
    /**
     * 2012. `black-box` blacks every surface and drops the ornament, an LED wall
     * goes up behind, and there is nothing on the deck at all except a table.
     *
     * `fog: 0.72` is the highest number outside ambient's and house's 0.85 and
     * synth's 0.75, and the room is the emptiest this genre has ever had, which is exactly what `design` in
     * `eras.ts` says about the arrangement: nothing on it, and the expensive
     * part is how little.
     */
    design: {
      palette: {
        boards: '#232529',
        backdrop: '#08090c',
        curtain: '#12151a',
        proscenium: '#474b52',
        ambient: '#dbe9ff',
      },
      props: ['black-box', 'truss', 'screen', 'haze', 'crowd-barrier', 'wedges'],
      maybe: [['neon', 0.35], ['bar', 0.3]],
      fog: 0.72,
      grow: [1.2, 0.4],
    },
  },
  fallback: {
    palette: {
      boards: '#2e2b28', backdrop: '#121110', curtain: '#211d1a',
      proscenium: '#4e463c', ambient: '#ffa64d',
    },
    props: ['brick', 'haze', 'posters', 'wedges', 'bar'],
    fog: 0.62,
  },
};

const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1992. Sportswear, and it is the brightest wardrobe in this genre by a long
   * way — white, orange and cyan against a brick wall. This is the one era where
   * anybody dressed *up* for it, and what they dressed up in was a shell suit.
   *
   * `loudFabric: 'nylon'`. **This note claimed no other genre in the project
   * names it for the loud jacket, and two do** — ambient's `sampler` wardrobe
   * and house's `rave` wardrobe. Counted over the 71 wardrobes that name a loud
   * fabric at all, nylon is 3 of 71. Only three of the fourteen fabrics in use
   * are rarer — linen and flannel at 1 each, denim at 2 — and knit and wool are
   * level with it, against `satin` and `lame` at 11 apiece. So it is rare and
   * it is not sole, and the three uses have nothing in common but the decade —
   * a bedroom-electronics anorak, a warehouse tracksuit, and this shell suit.
   * `Fabric` describes it as an anorak with a slight sheen and *the
   * wrong kind of sheen*, which is a criticism everywhere else and is here the
   * exactly correct description of the object: the person at the front is not
   * brighter than everybody else, they are *shinier*, and it is the wrong shine.
   * `sequinChance: 0.04` is nearly off, because there is no version of this
   * where anybody is in sequins.
   *
   * `uniform: 0.1` from the first era and it never rises. Every other genre in
   * this project has at least one decade where the players matched; this one
   * does not, because there were never enough of them at once to match.
   */
  rave: {
    jackets: ['#f2f2f2', '#ff6b1a', '#00b8c4', '#1a1a1a', '#ffd400', '#2f5fd0'],
    shirts: ['#ffffff', '#f2f2f2', '#ffe680', '#cfe9ff'],
    trousers: ['#1a1a1a', '#2b2b2b', '#3a4a5c', '#e0e0e0'],
    accents: ['#ff2d6f', '#00e5a0', '#ffd400', '#ffffff'],
    loud: ['#ff6b1a', '#00e5a0', '#ffffff'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#c9a86a'],
    hairStyles: [
      ['short', 4], ['curls', 3], ['bald', 2], ['braids', 2], ['long', 2],
      ['dreadlocks', 2], ['mohawk', 1],
    ],
    accessories: [
      ['ballcap', 0.45], ['bandana', 0.3], ['sunglasses', 0.25], ['beanie', 0.2],
      ['headphones', 0.3], ['hoops', 0.2],
    ],
    fabrics: [['nylon', 6], ['denim', 3], ['knit', 2], ['satin', 2], ['leather', 1]],
    /**
     * A t-shirt, and a jacket that is not a jacket.
     *
     * `shirtsleeves` at 6 is a tee and nothing over it, which is what a room at
     * this temperature produces by the second hour. `suit` at 3 is the shell-suit
     * top and the bomber — both are hip-length bodies with sleeves and both read
     * as this garment. `waistcoat` at 1 is the one person in a gilet, and it is
     * held at 1 for the reason funk's staging measured: correlated draws across
     * a row turn a 3 into most of the stage.
     */
    garments: [['shirtsleeves', 6], ['suit', 3], ['waistcoat', 1]],
    loudFabric: 'nylon', sequinChance: 0.04,
    matched: 0.2, uniform: 0.1, spotlight: 0.35,
  },
  /**
   * 1995. Everything goes dark and stays dark for twenty years. Black, olive,
   * charcoal and one flash of sodium orange borrowed from the room's own
   * lighting.
   *
   * **`headphones` at 0.5 is the highest in the project**, level with house's
   * warehouse and above ambient's 0.45, and it is set against the whole table
   * rather than against anything here — the nearest comparable single-accessory
   * number anywhere is hiphop's `chain` at 0.6 in 2001. It is not a fashion
   * statement and it is not a joke: on this stage there is always somebody
   * cueing the next record, one cup against one ear, and the object is on
   * because taking it off would mean the night had ended.
   *
   * `hood` at 4 leads the hair table, which only hiphop's 1991 approaches. It is
   * a `HairStyle` rather than a garment — `HairStyle` calls it outerwear in the
   * jacket's colour, which is exactly what it is and exactly where the renderer
   * needs it, since everything else about a hooded top is the jacket underneath.
   */
  dubplate: {
    jackets: ['#1a1a1a', '#242a24', '#2b2f33', '#3a3a33', '#1f2733', '#4a4238'],
    shirts: ['#e8e8e8', '#1a1a1a', '#2b2f33', '#c9c2b4'],
    trousers: ['#1a1a1a', '#2a2f2a', '#232a33', '#3a3a33'],
    accents: ['#ffa64d', '#d4af37', '#7be3c8', '#c62828'],
    loud: ['#ffa64d', '#c0c0c0', '#d4af37'],
    hair: ['#101010', '#1a1a1a', '#22160f', '#3a2416'],
    hairStyles: [
      ['hood', 4], ['dreadlocks', 4], ['short', 3], ['braids', 3], ['bald', 2],
      ['curls', 1],
    ],
    accessories: [
      ['headphones', 0.5], ['ballcap', 0.4], ['beanie', 0.3], ['chain', 0.2],
      ['bandana', 0.2], ['beard', 0.15],
    ],
    fabrics: [['nylon', 5], ['denim', 4], ['knit', 3], ['leather', 2], ['corduroy', 1]],
    /**
     * Four people who got dressed without thinking about it, and the three
     * shapes are the three things somebody owns. Nothing above 5 and nothing
     * below 1 — a table whose largest entry is 5 out of 10 cannot produce a
     * uniform whatever the correlated draws do, which is the point of a wardrobe
     * sitting under `uniform: 0.08`.
     */
    garments: [['shirtsleeves', 5], ['suit', 4], ['coat', 2], ['waistcoat', 1]],
    loudFabric: 'leather', sequinChance: 0.05,
    matched: 0.18, uniform: 0.08, spotlight: 0.4,
  },
  /**
   * 2002. The same clothes with money in them. Black and grey with a metallic
   * accent, better cut, and the first appearance in this file of anything
   * anybody would call a jacket.
   *
   * `spotlight: 0.55` and `uniform: 0.08`. The front of this stage is dressed
   * against the back of it, but nothing like as hard as hiphop's 2001 — there
   * the argument is that one person is the record and four are being paid, and
   * here there are two people and one of them is holding the microphone. A
   * spotlight much above a half would be dressing a hierarchy that does not
   * exist.
   */
  studio: {
    jackets: ['#151515', '#22252b', '#33383f', '#1e2a3a', '#4a4a4a', '#e8e8e8'],
    shirts: ['#ffffff', '#151515', '#d8d8d8', '#2b2f36'],
    trousers: ['#151515', '#1c1f24', '#2f3540'],
    accents: ['#c0c0c0', '#7fc4ff', '#d4af37', '#ff2d6f'],
    loud: ['#c0c0c0', '#7fc4ff', '#e8e8e8'],
    hair: ['#101010', '#1a1a1a', '#22160f', '#3a2416', '#5c1f2b'],
    hairStyles: [
      ['short', 4], ['bald', 4], ['dreadlocks', 3], ['braids', 3], ['curls', 2],
      ['mohawk', 1],
    ],
    accessories: [
      ['headphones', 0.45], ['ballcap', 0.3], ['chain', 0.3], ['wraparounds', 0.3],
      ['beard', 0.25], ['earrings', 0.2],
    ],
    fabrics: [['nylon', 5], ['denim', 3], ['leather', 3], ['knit', 2], ['vinyl', 2]],
    garments: [['shirtsleeves', 5], ['suit', 4], ['coat', 2], ['waistcoat', 1]],
    loudFabric: 'vinyl', sequinChance: 0.08,
    matched: 0.24, uniform: 0.08, spotlight: 0.55,
  },
  /**
   * 2012. Black, technical, and expensive without being visible.
   *
   * `uniform: 0.06` is the lowest in this genre and within a hair of the lowest
   * anywhere — rock, finnfolk and house each have a 0.05 — and it is a third
   * reason again for the same number. Ambient's
   * is that nobody is trying to be looked at; hiphop's is that there is barely a
   * band to be uniform with. Here **there is one person**, and a uniform of one
   * is a contradiction rather than a low probability.
   *
   * `coat` rises to 3 and this is the one silhouette the genre adds in twenty
   * years. `Garment` calls it knee-length and skirted with a standing collar,
   * which from ten metres is a long technical parka, which is what everybody on
   * this stage is wearing and has been since about 2010.
   */
  design: {
    jackets: ['#111111', '#191c21', '#2a2e35', '#0f1f1a', '#3a3f45', '#d0d0d0'],
    shirts: ['#111111', '#e0e0e0', '#252a31', '#3f4550'],
    trousers: ['#111111', '#181b20', '#2a2e35'],
    accents: ['#c0c0c0', '#dbe9ff', '#00e5a0', '#ff1744'],
    loud: ['#c0c0c0', '#dbe9ff'],
    hair: ['#101010', '#1a1a1a', '#22160f', '#5c1f2b', '#c9a86a'],
    hairStyles: [
      ['short', 4], ['bald', 4], ['dreadlocks', 3], ['hood', 3], ['braids', 3],
      ['curls', 1],
    ],
    accessories: [
      ['headphones', 0.4], ['beanie', 0.35], ['chain', 0.25], ['wraparounds', 0.25],
      ['earrings', 0.25], ['ballcap', 0.2],
    ],
    fabrics: [['nylon', 6], ['knit', 4], ['leather', 2], ['denim', 2], ['flannel', 1]],
    garments: [['shirtsleeves', 5], ['coat', 3], ['suit', 3], ['waistcoat', 1]],
    loudFabric: 'vinyl', sequinChance: 0.06,
    matched: 0.3, uniform: 0.06, spotlight: 0.6,
  },
};

/**
 * Drum and bass: a flyer rather than a programme.
 *
 * The register is the house one — affectionate, dry, never a critic's — and this
 * genre's joke about itself is that the most physically overwhelming music
 * anybody makes is produced by one person in a bedroom and delivered in a bag.
 * So the lines are about the rig, about how little is on the record, about the
 * fact that nobody can see anything, and about the plate. None of them explains
 * what a break is.
 */
const BLURBS: Blurb[] = [
  { text: 'six seconds of somebody else, for four hundred pounds an hour', styles: ['jungle', 'drumfunk'] },
  { text: 'the drums are the tune. there is no other tune', styles: ['drumfunk', 'breakcore'] },
  { text: 'one plate, cut this afternoon, and no second copy', styles: ['jungle', 'ragga', 'hardstep'] },
  { text: 'nothing above the shins is going to reach you', styles: ['minimal', 'deep'] },
  { text: 'the piano is still allowed, this year only', styles: ['hardcore'], moods: ['roughneck'] },
  { text: 'somebody dropped a horror film into the sampler', styles: ['darkcore', 'techstep'] },
  { text: 'a chord, once, and then eleven minutes of not one', styles: ['autonomic', 'minimal'] },
  { text: 'this is the one they will pull back twice', styles: ['jungle', 'revival'], moods: ['wheelup'] },
  { text: 'the bass has learned to say words. it will not say them here', styles: ['neurofunk'] },
  { text: 'four bars of nothing, and then the reason you came', styles: ['dancefloor', 'techstep'] },
  { text: 'we are told there is a melody. we have not found it', styles: ['neurofunk', 'minimal'] },
  { text: 'jazz, at twice the speed, without asking', styles: ['jazzstep', 'liquid'] },
  { text: 'somebody has brought congas. nobody knows whose', styles: ['sambass'] },
  { text: 'a bassline you can do an impression of', styles: ['jumpup'], moods: ['roughneck'] },
  { text: 'the hats are at full speed and everything else has given up', styles: ['halftime'] },
  { text: 'played entirely through the wall of the next room', styles: ['dubwise', 'deep'] },
  { text: 'first hour. nobody has taken their coat off', styles: ['liquid', 'deep'], moods: ['deepend'] },
  { text: 'the smoke is not for effect. it is so you can see the lights', slot: 'open' },
  { text: 'bring nothing. the room has everything', slot: 'open' },
  { text: 'if you can hear the top of it you are standing too far back', slot: 'close' },
  { text: 'the speakers are the expensive part, and the rest is a laptop' },
  { text: 'everything here is somebody else\'s drums and one note' },
];

export const STAGING: Staging = {
  room: UNIT,
  wardrobe: WARDROBE,
  /**
   * 1995. Handed a decade this genre has no clothes for, the picture to fall
   * back on is the low arch with the lid a metre overhead — the sampler, the
   * hood and the one orange light is what the whole genre is a photograph of,
   * and 1992 and 2012 are the two directions away from it rather than the thing
   * itself.
   */
  defaultEra: 'dubplate',
  blurbs: BLURBS,
  /**
   * 0.55, and the low number is a limitation being reported rather than a claim
   * about the music.
   *
   * `body` multiplies the groove score, which is how much the *players* move.
   * Iskelmä's 1.0 is a dance band watching a floor of couples and funk's 0.95 is
   * a band moving as much as its audience. By that measure this genre sits with
   * indian at 0.55, above only classical's 0.45 and ambient's 0.4, because on
   * every one of these stages the entire cast is standing behind a table and
   * physically does not move —
   * which is true, and is the least interesting true thing about a drum and bass
   * night.
   *
   * What is moving is the person at the front with a microphone and the four
   * hundred people in front of them, and neither is something this number ranges
   * over: the first has no archetype at all (see the header) and the second is
   * `Venue.audience`, which is furniture. So the honest value is a low one with
   * this note under it, rather than a high one that would be measuring something
   * the engine is not looking at. hiphop's 0.72 makes the same complaint with
   * one third of a cast still playing something.
   */
  body: 0.55,
};
