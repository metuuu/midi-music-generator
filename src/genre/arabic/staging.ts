/**
 * What this genre stages: a courtyard with an arcade round it, and everybody
 * sitting down.
 *
 * Read `iskelma/staging.ts`, `jazz/staging.ts` and `ambient/staging.ts` before
 * touching anything here — the register of the blurbs is a house voice rather
 * than each genre's own, and half of every room's argument is made against a
 * neighbour that now lives in another folder. This room in particular is a
 * counter-example to two of them at once: it is open to the sky like the
 * pavilion and seated like the cellar, and neither of those genres would
 * recognise the combination.
 *
 * **The audience sits, and it is not a quiet audience.** That is the one thing
 * about this room a picture has to get right. A tanssilava crowd is dancing and
 * a black-box crowd is standing very still; this one is on chairs, close, in
 * rows, and it is *shouting* — the whole apparatus of tarab is a listener who
 * calls out when a phrase lands and asks for it again. `seated: true` and a
 * density of 0.8 is a full house of people who came to listen at somebody, and
 * `web/concert/stage-audience.ts` builds the rake and the row spacing from that
 * one flag.
 */

import type { Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE COURTYARD — arabic.
 *
 * A walled court with an arcade along the back of it, open to the night, with a
 * carpet laid over the flags for the players to sit on. It is the house the
 * repertoire was made in — a Cairo *beit*, a Damascene courtyard, a riad — and
 * it survives into every era below as the same building differently dressed:
 * roofed and gilded for the orchestra, hung with cheap lights for the wedding,
 * and finally lit for television with a truss over it.
 *
 * `arches` is the one prop that belongs to the *genre* rather than to any era of
 * it, so it lives on the room. `riser` is the other, and it is there for a
 * mechanical reason rather than a scenic one: `cast.ts` stands a drummer 0.4 m
 * up whether or not the room has a platform, so a `riser` drawn from `maybe`
 * would leave the percussion floating half the time. Every era here has a
 * drummer — `drumSources` says so four times over — so the platform is always.
 *
 * 11 by 7 metres, which is generous for a takht and necessary for a firqa. The
 * boards have to hold the largest band the genre can produce rather than the
 * characteristic one; see `concert/venue.ts`, which also records that nothing
 * below 8.5 m wide has been tried.
 */
const COURTYARD: StageRoom = {
  id: 'courtyard',
  names: ['Beit el Sitt', 'Dar el Nil', 'Riad Zitouna', 'Qasr el Andalus', 'Beit el Oud', 'Dar el Harawi'],
  width: 11, depth: 7,
  audience: { rows: 10, density: 0.8, seated: true },
  props: ['arches', 'riser'],
  eras: {
    /**
     * 1930s–50s takht. Lamplight on limewash, a carpet on the flags, and the
     * sky. The palette is the warmest here and the fog is the lowest — this is
     * an evening outdoors rather than a lit stage, and haze in a courtyard is
     * weather rather than production.
     */
    takht: {
      palette: {
        boards: '#b08d5e',
        backdrop: '#1d2436',
        curtain: '#7a2f2a',
        proscenium: '#e0d3b4',
        ambient: '#ffcf94',
      },
      props: ['open-air', 'paper-lanterns', 'carpet', 'candles'],
      maybe: [['flowers', 0.5], ['tables', 0.35]],
      fog: 0.12,
    },
    /**
     * 1960s–70s firqa. The same court with a roof on it: this is the decade the
     * music moved indoors, into broadcast halls and cinemas, and the room gains
     * the two objects that say so — raked seating and a chandelier. `open-air`
     * is gone, which is the whole visual difference and is why the arcade is on
     * the room rather than in here: the arches stay and the sky does not.
     *
     * Bigger, too. Forty players need the extra metre.
     */
    firqa: {
      palette: {
        boards: '#8f6a3c',
        backdrop: '#151b2c',
        curtain: '#6d1f24',
        proscenium: '#d8c9a4',
        ambient: '#ffdcae',
      },
      props: ['carpet', 'drapes', 'chandelier', 'stalls'],
      maybe: [['flowers', 0.4], ['candles', 0.2]],
      fog: 0.2,
      grow: [0.9, 0.5],
    },
    /**
     * 1980s–90s shaabi. Outdoors again, and it is a wedding hall or a street
     * rather than a house: strung bulbs, a hired PA, a tangle of cable and a
     * mirror ball that somebody bolted to a pole. The saturated end of the
     * palette, because the light is now coloured gel rather than a flame.
     */
    shaabi: {
      palette: {
        boards: '#7c6142',
        backdrop: '#121a2e',
        curtain: '#8c1f56',
        proscenium: '#cbb894',
        ambient: '#ffb35c',
      },
      props: ['open-air', 'fairy-lights', 'tables', 'pa-stack', 'wedges', 'cables'],
      maybe: [['mirror-ball', 0.45], ['neon', 0.35], ['flowers', 0.3]],
      fog: 0.26,
      grow: [0.4, 0.2],
    },
    /**
     * 2000s satellite. A television studio pretending to be the courtyard: the
     * arcade is now a set, there is an LED wall where the sky was, and a truss
     * over the whole thing. `screen` rather than `projection` — film on a cloth
     * belongs to a different decade, and this era's whole point is that the
     * picture is being made rather than the room.
     */
    satellite: {
      palette: {
        boards: '#6b5c4e',
        backdrop: '#0f1522',
        curtain: '#2c3550',
        proscenium: '#b9ae9c',
        ambient: '#cbd8ff',
      },
      props: ['screen', 'truss', 'drapes', 'carpet', 'cables'],
      maybe: [['pa-stack', 0.45], ['haze', 0.4]],
      fog: 0.3,
      grow: [1.1, 0.6],
    },
  },
  fallback: {
    palette: {
      boards: '#a8865c', backdrop: '#1a2032', curtain: '#75282a',
      proscenium: '#dbcdac', ambient: '#ffd39c',
    },
    props: ['open-air', 'paper-lanterns', 'carpet'],
    fog: 0.16,
  },
};

const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1930s–50s takht. Cairo in a dark suit, and a *tarboosh* on top of it.
   *
   * The hat is the era in one object and the union has no fez, so it is
   * `turban` — the entry's own gloss is "wound bulk above the skull", which is
   * a fez's silhouette from ten metres away and is as close as the vocabulary
   * gets. `wrap` is the other cloth here and it is the singer's rather than the
   * band's: a headscarf falling to the shoulders, over the hair rather than on
   * top of it.
   *
   * Very high `uniform`, because a takht genuinely dressed alike — five men in
   * the same dark suit sitting in a row is the photograph — and very high
   * `spotlight`, because the sixth person is the entire reason the other five
   * are there. `brocade` is the loud fabric rather than sequin: it is the only
   * fabric in the union that changes a player's *shape*, adding a placket and a
   * hem border, and an embroidered coat is exactly a shape rather than a shine.
   */
  takht: {
    jackets: ['#26262c', '#2f3038', '#3c3a35', '#1f2430', '#4a443a'],
    shirts: ['#f2ece0', '#ffffff', '#e8dcc6'],
    trousers: ['#22222a', '#2f3038', '#3a3730'],
    accents: ['#8c1f2a', '#8a6a22', '#2f5d55'],
    loud: ['#8a6a22', '#7a2130', '#c9a227'],
    hair: ['#101010', '#1e1410', '#332014', '#4a3120', '#8a7f74'],
    hairStyles: [['slick', 5], ['short', 4], ['updo', 3], ['wrap', 3], ['bald', 1]],
    accessories: [['moustache', 0.65], ['turban', 0.45], ['tie', 0.4], ['glasses', 0.25]],
    fabrics: [['wool', 6], ['linen', 3], ['silk', 2], ['brocade', 1]],
    loudFabric: 'brocade', sequinChance: 0,
    matched: 0.8, uniform: 0.85, spotlight: 0.85,
  },
  /**
   * 1960s–70s firqa. Black tie for forty people, and one beaded gown.
   *
   * The orchestra is the most uniformly dressed band this genre has, and one of
   * the most uniformly dressed anywhere in the catalogue — a broadcast firqa
   * wore evening dress and was filmed doing it, so `uniform` sits at 0.9 against
   * a tanssilava band's 0.75. `sequinChance` is the other
   * extreme and is not a tanssilava joke borrowed: the gowns really were beaded,
   * heavily, and they are half of what anybody who saw one remembers.
   */
  firqa: {
    jackets: ['#1c1c22', '#242830', '#2e2a2a', '#1a2130', '#35302a'],
    shirts: ['#ffffff', '#f6f2e8', '#eae4d6'],
    trousers: ['#16161c', '#22242c', '#2b2822'],
    accents: ['#a8182c', '#c9a227', '#1f5f6b', '#6b2f7a'],
    loud: ['#c9a227', '#d8d0c0', '#a8182c'],
    hair: ['#101010', '#1e1410', '#332014', '#4a3120', '#6b5a4a', '#b9b2a8'],
    hairStyles: [['updo', 5], ['slick', 5], ['short', 3], ['long', 2], ['bald', 1]],
    accessories: [['tie', 0.7], ['moustache', 0.35], ['glasses', 0.3], ['earrings', 0.3]],
    fabrics: [['wool', 6], ['satin', 3], ['silk', 2], ['brocade', 1]],
    loudFabric: 'sequin', sequinChance: 0.5,
    matched: 0.85, uniform: 0.9, spotlight: 0.9,
  },
  /**
   * 1980s–90s shaabi. Four people who arrived in one car, in whatever they own.
   *
   * `uniform` collapses here and that is the era: this is not a band anybody
   * dressed, it is a keyboard player, a percussionist and a singer with a hired
   * PA. The colours go saturated and the fabrics go synthetic, and the one loud
   * jacket is still there because the singer is still the reason for the
   * evening — the spotlight barely moves between the firqa and this.
   */
  shaabi: {
    jackets: ['#c0392b', '#1f6fa8', '#2e2e34', '#7a5aa8', '#0f7a6b', '#d4a017'],
    shirts: ['#ffffff', '#ffe6b8', '#dff1ff', '#f7d4e2'],
    trousers: ['#1a1a20', '#3b3b44', '#5a4a3a'],
    accents: ['#ff2d6b', '#00c2c7', '#ffd400', '#7cff5a'],
    loud: ['#ffd400', '#ff2d6b', '#c0c0c0'],
    hair: ['#101010', '#1e1410', '#332014', '#4a3120', '#7a6a58'],
    hairStyles: [['curls', 4], ['long', 3], ['mullet', 3], ['slick', 3], ['short', 2], ['wrap', 2]],
    accessories: [['moustache', 0.6], ['sunglasses', 0.35], ['chain', 0.3], ['earrings', 0.3]],
    fabrics: [['satin', 5], ['wool', 2], ['denim', 2], ['leather', 2], ['nylon', 1]],
    loudFabric: 'sequin', sequinChance: 0.35,
    matched: 0.3, uniform: 0.3, spotlight: 0.8,
  },
  /**
   * 2000s satellite. Everybody in near-black, and one person lit.
   *
   * Television wardrobe: the band is dressed *down* so the camera has one place
   * to go, and the one place is wearing lamé. `lame` rather than `sequin` for
   * the loud jacket, which is a small and specific difference — one continuous
   * sheet of metal against a thousand separate points of it — and under a
   * modern key light the sheet is what reads.
   */
  satellite: {
    jackets: ['#1a1a1e', '#24262c', '#2f2f36', '#3a3038', '#20272e'],
    shirts: ['#ffffff', '#e9e9ee', '#c9ccd4', '#1c1c20'],
    trousers: ['#141418', '#1f2026', '#2a2a30'],
    accents: ['#c9a227', '#7ad0ff', '#e0407a', '#9a8fff'],
    loud: ['#c9a227', '#e6e2d8', '#e0407a'],
    hair: ['#101010', '#1e1410', '#332014', '#4a3120', '#8a6a3f', '#c9bfae'],
    hairStyles: [['slick', 4], ['long', 4], ['short', 3], ['updo', 3], ['bob', 2], ['wrap', 2]],
    accessories: [['beard', 0.4], ['earrings', 0.35], ['sunglasses', 0.25], ['chain', 0.25]],
    fabrics: [['satin', 4], ['wool', 3], ['silk', 3], ['linen', 2], ['vinyl', 1]],
    loudFabric: 'lame', sequinChance: 0.3,
    matched: 0.55, uniform: 0.5, spotlight: 0.9,
  },
};

/**
 * Arabic: a courtyard bill.
 *
 * The trap for this one is not reverence, it is *travelogue* — this repertoire
 * attracts writing full of spices and moonlight, and a programme that reads like
 * a brochure has told the audience nothing and patronised them on the way. So
 * these are flat, practical and slightly fond, and every one of them is about
 * the evening rather than about the region: what the room will do, how long it
 * will take, and who is going to shout.
 */
const BLURBS: Blurb[] = [
  { text: 'four bars to tell you where we are', styles: ['dulab'], slot: 'open' },
  { text: 'nobody is counting this one in', styles: ['taqsim'], slot: 'open' },
  { text: 'one player, no drum, no hurry', styles: ['taqsim'] },
  { text: 'the same line, six times, better each time', styles: ['wahda'], moods: ['tarab'] },
  { text: 'somebody in row three has already shouted', moods: ['tarab'] },
  { text: 'the encore is this again, at greater length', moods: ['tarab'], slot: 'close' },
  { text: 'the bride is on her way', styles: ['zaffa'], moods: ['farah'] },
  { text: 'played walking, so keep up', styles: ['zaffa'] },
  { text: 'the doors open on this one', styles: ['malfuf'], slot: 'open' },
  { text: 'hold the shoulder in front of you', styles: ['dabke'] },
  { text: 'stand up, or be stood up', styles: ['dabke', 'khaleeji'], moods: ['farah'] },
  { text: 'ten of them. count if you like, nobody else is', styles: ['samai'] },
  { text: 'it will not wait for you to find the one', styles: ['aqsaq', 'dawrhindi', 'jurjina'] },
  { text: 'the quick one at the end, as ever', styles: ['longa'], slot: 'close' },
  { text: 'this is the showing-off', styles: ['longa'], moods: ['sahra'] },
  { text: 'older than the building', styles: ['muwashshah'] },
  { text: 'everybody sings it and nobody harmonises', styles: ['muwashshah'] },
  { text: 'for the accordion player, who has waited all night', styles: ['baladi'] },
  { text: 'from further up the river, at speed', styles: ['saidi', 'fallahi'] },
  { text: 'and it goes on. that is the arrangement', styles: ['ayyub'] },
  { text: 'late, and nobody is dancing', moods: ['sahra'] },
  { text: 'the floor belongs to the dancer, not to you', moods: ['raqs'] },
  { text: 'the tuning takes as long as it takes', slot: 'open' },
];

export const STAGING: Staging = {
  room: COURTYARD,
  wardrobe: WARDROBE,
  /**
   * Takht. The small ensemble in the courtyard is the picture the whole genre
   * is of, and the other three eras are things that happened to it.
   */
  defaultEra: 'takht',
  /**
   * Between jazz and iskelmä, and the number is a compromise between two true
   * things. The rhythms are dance rhythms and half the styles here exist to
   * move a room; the *players* are sitting cross-legged on a carpet with an
   * instrument in their lap, and a seated takht swaying like a pavilion band
   * would be a lie about who is doing the moving. The audience is the animated
   * half of this room and the audience is not on the groove score.
   */
  body: 0.8,
};
