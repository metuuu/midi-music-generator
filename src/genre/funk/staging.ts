/**
 * What funk stages: a ballroom with the chairs taken out.
 *
 * The room, the clothes and the programme copy for this genre. `Staging` in
 * `genre/types.ts` has the argument for why a genre carries its own rather than
 * the renderer holding a registry, and `venue.ts` states the rule this file
 * obeys: **genre dresses the room, era shifts the palette and the fixtures.**
 *
 * Read the other genres' staging before touching this one. Half of what follows
 * is chosen *against* a neighbour — the standing crowd is the pavilion's dancing
 * one moved indoors, the spotlight probability is the tanssilava's argument taken
 * one step further, and the near-absence of a uniform after 1975 is the exact
 * inverse of what the jazz cellar does across its three decades. None of that is
 * legible from this file alone.
 */

import type { Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE BALLROOM — funk.
 *
 * A flat-floored hall with a stage at one end: the theatre circuit this music
 * toured, the civic halls and armouries it played when it outgrew them, and the
 * one building that plausibly holds all four of these decades. It is the largest
 * room in the project at 11.5 by 7 metres and it needs to be — this genre fields
 * the biggest bands here, nine players and a percussion section, and the
 * paragraph in `venue.ts` about a stage too small producing a solver that spreads
 * the band to the tormentors is a warning written for exactly this case.
 *
 * **The audience stands**, and it is not the same standing as ambient's. There
 * the crowd is a field of silhouettes in a black box with nothing to look at;
 * here it is a floor of people dancing at a band that is watching them do it,
 * which is the pavilion's proposition indoors and with a PA. `density: 0.9` is
 * the highest in the project. A funk band in a half-empty room is a soundcheck.
 *
 * `backline` in three of the four dressings and `pa-stack` in three: the
 * distinction between the two is the one `venue.ts` draws and it is worth
 * respecting, since a wall of the band's own cabinets facing the way the band
 * faces is a different object from a stack of speakers facing the house, and this
 * genre's stage acquires the second between 1968 and 1975 without losing the
 * first.
 */
const BALLROOM: StageRoom = {
  id: 'ballroom',
  names: [
    'The Starlite', 'The Crown Ballroom', 'Hall 88', 'The Chevron Room',
    'The Sundown', 'The Aquarius',
  ],
  width: 11.5, depth: 7,
  audience: { rows: 10, density: 0.9, seated: false },
  /**
   * The riser belongs to the genre rather than to any decade of it, and it is in
   * the always-props rather than in a `maybe` for a mechanical reason: `cast.ts`
   * stands the drummer 0.4 m up regardless, so a probabilistic draw would float
   * them on half the seeds. `venue.ts` says the same thing about the same prop.
   */
  props: ['riser'],
  eras: {
    /**
     * 1968. A theatre with a red house curtain and gilt somebody stopped
     * repainting in about 1954, lit by tungsten and a couple of follow spots. No
     * PA to speak of — the band's own amplifiers are the whole rig, which is why
     * `backline` is here and `pa-stack` is not.
     */
    jb: {
      palette: {
        boards: '#6f5233',
        backdrop: '#2b1d24',
        curtain: '#7a1f2b',
        proscenium: '#c2a05a',
        ambient: '#ffcf92',
      },
      props: ['drapes', 'backline', 'dance-floor', 'posters', 'wedges'],
      maybe: [['bar', 0.5], ['tables', 0.3], ['chandelier', 0.25]],
      fog: 0.24,
    },
    /**
     * 1975. The gilt goes, the truss arrives, and the room turns purple. This is
     * the era with the most *equipment* in it relative to the number of people —
     * a PA facing the house as well as the backline facing the band, and a
     * mirror ball because the floor is now the show.
     *
     * The haze is a `maybe` at 0.7 rather than a certainty, because a hazed room
     * and a clear one are two genuinely different photographs of the same stage
     * and this era should produce both.
     */
    pfunk: {
      palette: {
        boards: '#5c4630',
        backdrop: '#241634',
        curtain: '#5b1f6e',
        proscenium: '#b98b3e',
        ambient: '#ffb8e0',
      },
      props: ['backline', 'pa-stack', 'truss', 'mirror-ball', 'dance-floor', 'wedges'],
      maybe: [['haze', 0.7], ['neon', 0.3]],
      fog: 0.45,
      grow: [0.5, 0.2],
    },
    /**
     * 1980. Chrome and magenta, a bigger truss, and a barrier across the front
     * of the house for the first time — the moment the audience stops being a
     * dance floor and starts being a crowd. The room has grown almost a metre
     * wider than it was in 1968 and the band has got smaller, which is the
     * decade in one sentence.
     */
    boogie: {
      palette: {
        boards: '#4a4038',
        backdrop: '#181a2c',
        curtain: '#a1246b',
        proscenium: '#8f8a7a',
        ambient: '#ff9ad0',
      },
      props: [
        'backline', 'pa-stack', 'truss', 'mirror-ball', 'dance-floor',
        'neon', 'wedges',
      ],
      maybe: [['haze', 0.5], ['crowd-barrier', 0.4]],
      fog: 0.35,
      grow: [0.9, 0.4],
    },
    /**
     * 1984. Cold cyan, an LED wall, and no backline at all — there is nothing on
     * this stage to amplify. `screen` rather than `projection`: the first is a
     * lit rectangle made of diodes and the second is film on a cloth, and the
     * fifteen years between them is precisely the distance this era has travelled
     * from the one at the top of this table.
     */
    electro: {
      palette: {
        boards: '#2e3136',
        backdrop: '#0f141c',
        curtain: '#1b2c3a',
        proscenium: '#565f6b',
        ambient: '#7fe6ff',
      },
      props: [
        'pa-stack', 'truss', 'screen', 'crowd-barrier', 'dance-floor',
        'neon', 'wedges',
      ],
      maybe: [['haze', 0.6], ['flight-case', 0.3]],
      fog: 0.42,
      grow: [1.2, 0.5],
    },
  },
  fallback: {
    palette: {
      boards: '#5c4630', backdrop: '#241634', curtain: '#5b1f6e',
      proscenium: '#b98b3e', ambient: '#ffb8e0',
    },
    props: ['backline', 'pa-stack', 'dance-floor', 'wedges'],
    fog: 0.35,
  },
};

const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1968. A revue band in matching suits, and one person in front of them who is
   * not. `uniform` at 0.8 is nearly the swing band's, and for the same reason —
   * the horn section is a *section* and dresses as one — while `spotlight` at
   * 0.85 is the highest opening figure in the project, because this is the one
   * genre where the lead being visibly louder than the band is the format.
   *
   * `afro` appears here at a low weight and rises steeply across the next two
   * eras. In 1968 it is a statement rather than a default; by 1975 it is what
   * everybody on the stage has.
   */
  jb: {
    jackets: ['#1e2230', '#3a2b1e', '#5c1f2b', '#2f3f33', '#d9d2c0', '#4a4f5c'],
    shirts: ['#ffffff', '#fdf6e8', '#f2e6d0'],
    trousers: ['#1e2230', '#2b2b2b', '#3a2b1e'],
    accents: ['#c62828', '#ffb300', '#00897b', '#7b1fa2'],
    loud: ['#d4af37', '#c0c0c0', '#c62828'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025'],
    hairStyles: [['slick', 5], ['short', 4], ['afro', 3], ['curls', 2], ['bald', 1]],
    accessories: [
      ['tie', 0.6], ['moustache', 0.3], ['sunglasses', 0.2], ['bowtie', 0.15],
      ['towel', 0.15],
    ],
    fabrics: [['wool', 6], ['satin', 3], ['velvet', 1]],
    loudFabric: 'sequin', sequinChance: 0.35,
    matched: 0.8, uniform: 0.8, spotlight: 0.85,
  },
  /**
   * 1975. The suit comes apart completely and nothing matches anything.
   * `uniform` at 0.12 is lower than ambient's — which is a genuinely surprising
   * comparison and is right: an ambient act is not trying to be seen, and this
   * band is nine people all trying to be seen *differently*.
   *
   * `lame` is the loud fabric from here on and it is not the same object as
   * `sequin`. One continuous sheet of metal against a thousand separate points
   * of it: under a follow spot the first is a single moving highlight and the
   * second is a swarm, and this decade wore the first.
   */
  pfunk: {
    jackets: ['#6a1b9a', '#c2185b', '#f9a825', '#00838f', '#e64a19', '#ffffff'],
    shirts: ['#ffd54f', '#ce93d8', '#80deea', '#ffffff', '#ef9a9a'],
    trousers: ['#4a148c', '#e0e0e0', '#bf360c', '#1a237e'],
    accents: ['#ffd700', '#00e5ff', '#ff4081', '#76ff03'],
    loud: ['#ffd700', '#c0c0c0', '#ff4081'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#a83e2b'],
    hairStyles: [['afro', 7], ['mane', 3], ['braids', 2], ['curls', 2], ['bald', 1], ['slick', 1]],
    accessories: [
      ['sunglasses', 0.45], ['chain', 0.35], ['hoops', 0.3], ['beard', 0.3],
      ['moustache', 0.3], ['bandana', 0.2], ['towel', 0.2],
    ],
    fabrics: [['satin', 5], ['velvet', 4], ['denim', 2], ['leather', 2], ['vinyl', 1]],
    loudFabric: 'lame', sequinChance: 0.35,
    matched: 0.25, uniform: 0.12, spotlight: 0.95,
  },
  /**
   * 1980. Leather and vinyl, brighter and harder, and the band starts matching
   * again — not as a section this time but as a *look*, which is what happens
   * once there is a stylist. `matched` goes back up and `uniform` only halfway,
   * because the front person is still dressed against the band rather than with
   * it.
   */
  boogie: {
    jackets: ['#e91e63', '#00bcd4', '#212121', '#ffffff', '#7c4dff', '#ff6f00'],
    shirts: ['#ffffff', '#fce4ec', '#e0f7fa', '#212121'],
    trousers: ['#212121', '#ffffff', '#3949ab', '#880e4f'],
    accents: ['#ff2d95', '#00e5ff', '#ffe000', '#c0c0c0'],
    loud: ['#c0c0c0', '#ff2d95', '#ffe000'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#c9a86a'],
    hairStyles: [['curls', 5], ['braids', 3], ['afro', 3], ['slick', 3], ['bald', 2], ['mane', 1]],
    accessories: [
      ['wraparounds', 0.4], ['hoops', 0.35], ['chain', 0.3], ['moustache', 0.25],
      ['bandana', 0.15], ['towel', 0.15],
    ],
    fabrics: [['satin', 5], ['leather', 4], ['vinyl', 3], ['denim', 2], ['wool', 1]],
    loudFabric: 'lame', sequinChance: 0.45,
    matched: 0.35, uniform: 0.3, spotlight: 0.9,
  },
  /**
   * 1984. Black, chrome and a lot less of it. The band is three people and two
   * of them are behind keyboards, so the wardrobe stops being a revue and starts
   * being a uniform of a different kind — `matched` is the highest since 1968 and
   * for the opposite reason. Nobody is dressed as a section; everybody is dressed
   * the same because there is one idea and three people executing it.
   */
  electro: {
    jackets: ['#151515', '#2b2f3a', '#c62828', '#e0e0e0', '#4a148c'],
    shirts: ['#151515', '#e0e0e0', '#37474f'],
    trousers: ['#151515', '#212121', '#37474f'],
    accents: ['#00e5ff', '#c0c0c0', '#ff1744', '#76ff03'],
    loud: ['#c0c0c0', '#00e5ff'],
    hair: ['#101010', '#1a1a1a', '#22160f', '#3a2416'],
    hairStyles: [['short', 4], ['bald', 4], ['braids', 3], ['afro', 2], ['mohawk', 1], ['slick', 1]],
    accessories: [
      ['wraparounds', 0.5], ['chain', 0.35], ['ballcap', 0.25], ['hoops', 0.2],
      ['headphones', 0.15], ['bandana', 0.15],
    ],
    fabrics: [['vinyl', 5], ['leather', 4], ['denim', 3], ['nylon', 2], ['satin', 2]],
    loudFabric: 'lame', sequinChance: 0.3,
    matched: 0.5, uniform: 0.35, spotlight: 0.85,
  },
};

/**
 * Funk: a hall bill.
 *
 * The register is the house one — affectionate, dry, and never a critic's — with
 * the genre's own joke about itself running through it, which is that this music
 * takes an enormous amount of work to sound like nobody is trying. So the lines
 * are about labour, about the size of the band, and about how little the harmony
 * is going to do this evening. None of them says what a groove is.
 */
const BLURBS: Blurb[] = [
  { text: 'one chord. that is the whole plan', styles: ['vamp'] },
  { text: 'somebody counts it off and then nobody stops', styles: ['vamp', 'jbshuffle'], moods: ['raw'] },
  { text: 'the sixteenths lean, and so should you', styles: ['jbshuffle'] },
  { text: 'five people and a riff they refuse to let go of', styles: ['deepfunk'], moods: ['raw'] },
  { text: 'four horns, and not one of them is decoration', styles: ['horns'] },
  { text: 'the loudest thing in this one is the space', styles: ['memphis'] },
  { text: 'the bar line is around here somewhere', styles: ['swamp'] },
  { text: 'an organ, a guitar and a very long night', styles: ['souljazz'] },
  { text: 'three percussionists, one of them with a kit', styles: ['gogo', 'latin'] },
  { text: 'we stop when the hall does', styles: ['gogo'] },
  { text: 'nothing lands where you left it', styles: ['latin', 'afrofunk'] },
  { text: 'the amplifier counts as a member', styles: ['funkrock'] },
  { text: 'the four bars everybody else is going to borrow', styles: ['breakbeat'] },
  { text: 'slow, and working every bit as hard', styles: ['ballad'], moods: ['slink'] },
  { text: 'the long one, with the spaceship on the sleeve', styles: ['pfunk'], moods: ['cosmic'] },
  { text: 'a keyboard doing the drummer’s job', styles: ['clav'] },
  { text: 'chords, and people who can read them', styles: ['jazzfunk'] },
  { text: 'the kick is on all four now', styles: ['disco'] },
  { text: 'the bass player has been waiting all evening', styles: ['slap', 'boogie'] },
  { text: 'played to a machine, on purpose', styles: ['boogie', 'minneapolis', 'electro'] },
  { text: 'to get everybody off the wall', slot: 'open' },
  { text: 'the one they will still be doing in the car park', slot: 'close' },
  { text: 'bring a towel' },
];

export const STAGING: Staging = {
  room: BALLROOM,
  wardrobe: WARDROBE,
  /**
   * P-Funk. Handed an era this genre has no clothes for, the picture to fall
   * back on is 1975 — the nine-piece in the hazed purple room is what the whole
   * genre is a photograph of, and 1968 and 1984 are the two directions away from
   * it rather than the thing itself.
   */
  defaultEra: 'pfunk',
  blurbs: BLURBS,
  /**
   * The top of the range, and a shade under the dance band that defines it.
   *
   * Iskelmä's 1.0 is a band watching a floor of couples dance, and that is the
   * yardstick. This is not less than that in energy — it is more — but the
   * difference is where the movement *is*: a tanssilava band is playing for the
   * floor, and a funk band is moving as much as the floor is. The groove score
   * is a multiplier on how much a body moves, and the only reason this is not
   * 1.0 is that a third of the players are behind keyboards or a percussion
   * table and physically cannot.
   */
  body: 0.95,
};
