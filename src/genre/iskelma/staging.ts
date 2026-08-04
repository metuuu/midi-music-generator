/**
 * What iskelmä stages: a lakeside pavilion, in July, with the floor full.
 *
 * The room, the clothes and the programme copy for this genre. All three were
 * entries in three registries in `concert/` — keyed by genre id, with a fallback
 * for anything not listed — and every value here is the value that was there.
 * `Staging` in `genre/types.ts` argues the move at length; the short version is
 * that a table sixteen genre authors have to edit is not a table, it is a
 * registry, and the newest genre proved it by never being added to any of them.
 *
 * One thing the move genuinely costs, and it is worth naming rather than
 * pretending away. These comments were written for a reader looking at three
 * rooms and eight wardrobes at once, and half of them argue against a neighbour:
 * the pavilion's dancing crowd is the counter-example the cellar's seated one
 * was chosen against, and this wardrobe's sequins are the thing ambient's
 * anoraks refuse. Nothing here is legible on its own. Read the other genres'
 * staging before writing a new one.
 */

import type { Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE PAVILION — iskelmä.
 *
 * A Finnish tanssilava: a roofed wooden dance floor at the edge of a lake, open
 * on all sides, hot in July and full of insects. The audience is *dancing*,
 * which is the single most important fact about this room and the reason
 * `seated` is false — a tanssilava crowd facing the band in rows would be a
 * different kind of evening entirely.
 */
const PAVILION: StageRoom = {
  id: 'pavilion',
  names: ['Koivulahti', 'Kesäranta', 'Kaislaranta', 'Peurasaari', 'Ilolahti', 'Sorsaniemi'],
  width: 10, depth: 6,
  audience: { rows: 10, density: 0.82, seated: false },
  // Bunting is the one prop that belongs to the *genre* rather than to either
  // era of it: a tanssilava has pennants strung across the front whether it is
  // 1968 or 1985, and the eighties table would otherwise have had to repeat it.
  props: ['bunting'],
  eras: {
    // 1960s–70s. Painted cream timber, tungsten everything, and the beams full
    // of moths — which are not decoration. A warm lamp outdoors at midnight in
    // July has insects in it, and their absence is one of those things nobody
    // can name but everybody notices.
    tanssilava: {
      palette: {
        boards: '#c99b5c',
        backdrop: '#1b2a45',
        curtain: '#8f2f2c',
        proscenium: '#e8dfc8',
        ambient: '#ffd9a0',
      },
      props: [
        'open-air', 'birch', 'lake', 'railing', 'dance-floor',
        'fairy-lights', 'paper-lanterns', 'moths', 'riser',
      ],
      maybe: [['flowers', 0.6], ['chandelier', 0.2]],
      fog: 0.1,
    },
    // 1980s. The same building, re-varnished, with a mirror ball bolted to the
    // roof beams and a par can rig that arrived on a trailer. The era's own
    // tables say `keyChangeChance: 0.7` and `density: 0.78`; this is what that
    // sounds like as a room.
    eighties: {
      palette: {
        boards: '#a9793f',
        backdrop: '#141d33',
        curtain: '#a8246b',
        proscenium: '#d9d2c2',
        ambient: '#ffcf9a',
      },
      props: [
        'open-air', 'birch', 'lake', 'railing', 'dance-floor',
        'fairy-lights', 'mirror-ball', 'moths', 'riser', 'pa-stack', 'wedges',
      ],
      maybe: [['flowers', 0.3], ['haze', 0.4]],
      fog: 0.16,
      grow: [0.6, 0.3],
    },
  },
  fallback: {
    palette: {
      boards: '#c08a4e', backdrop: '#1b2a45', curtain: '#8f2f2c',
      proscenium: '#e0d6c0', ambient: '#ffd6a0',
    },
    props: ['open-air', 'birch', 'lake', 'dance-floor', 'fairy-lights', 'moths', 'riser'],
    fog: 0.12,
  },
};

const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1960s–70s tanssilava. Pale summer suits, an enormous amount of hair, and
   * one person in sequins. The era's own table is full of accordions and
   * tremolo guitar; this is that in cloth.
   */
  tanssilava: {
    jackets: ['#efe6d2', '#bcd0e0', '#cfe0c8', '#d8d2c4', '#e6cfae', '#c8b9d6'],
    shirts: ['#ffffff', '#fdf6e3', '#f6ead6'],
    trousers: ['#2f3345', '#4a4436', '#6a6357'],
    accents: ['#c62828', '#ffb300', '#00897b', '#8e24aa', '#e91e63'],
    loud: ['#c0c0c0', '#d4af37', '#e8a0c0'],
    hair: ['#2b1b12', '#4a2f1b', '#6b4423', '#8d6a3f', '#c9a86a', '#a83e2b', '#d9d4cc'],
    hairStyles: [['beehive', 4], ['bob', 3], ['long', 3], ['slick', 4], ['curls', 3], ['short', 2]],
    accessories: [['tie', 0.7], ['moustache', 0.3], ['earrings', 0.25], ['glasses', 0.15], ['bowtie', 0.12]],
    fabrics: [['wool', 7], ['satin', 2], ['velvet', 1]],
    /**
     * A suit band with a woman at the microphone who is not in a suit.
     *
     * Eight to two, and the eight is not laziness. The era comment above says
     * *pale summer suits* and it is right: a tanssilava band in 1968 is five men
     * in matching cream, and a genre whose whole picture is that should not be
     * given a costume box just because one exists now. What the garment table
     * buys here is one figure, and it is the one the room is arranged around —
     * the singer in a floor-length dress, which is the only silhouette on the
     * boards that is not a jacket and a pair of trousers.
     *
     * `gown` is also the only member that reaches the floor without wide sleeves
     * or a shoulder band, and that matters at a lakeside pavilion in July: a
     * robe would have put a Finnish dance-band singer in something with a metre
     * of cloth hanging off each arm.
     */
    garments: [['suit', 8], ['gown', 2]],
    loudFabric: 'sequin', sequinChance: 0.35,
    matched: 0.7, uniform: 0.75, spotlight: 0.8,
  },
  /**
   * 1980s iskelmäpop. The same pavilion, lit by par cans, and the palette goes
   * saturated: white, electric blue, magenta. Bigger hair than the sixties,
   * which takes some doing.
   */
  eighties: {
    jackets: ['#e8e6e1', '#1f6fb2', '#c2185b', '#00838f', '#f4a3c1', '#3c3f58'],
    shirts: ['#ffffff', '#ffe9f2', '#dff3ff'],
    trousers: ['#1c1c22', '#e8e6e1', '#3c3f58'],
    accents: ['#00e5ff', '#ff2d95', '#ffe000', '#7cff5a'],
    loud: ['#c0c0c0', '#ff2d95', '#ffe000'],
    hair: ['#101010', '#2b1b12', '#6b4423', '#c9a86a', '#e8dcae', '#a83e2b', '#d9d4cc'],
    hairStyles: [['long', 5], ['curls', 5], ['bob', 3], ['slick', 2], ['short', 2], ['beehive', 1]],
    accessories: [['earrings', 0.45], ['sunglasses', 0.3], ['tie', 0.3], ['moustache', 0.2]],
    // The decade of the shiny shirt. Satin overtakes wool, and the jacket is
    // as likely to be leather as to be tailored.
    fabrics: [['satin', 5], ['wool', 3], ['velvet', 2], ['leather', 1]],
    /**
     * The same two shapes as 1968, plus one man who has had enough.
     *
     * `gown` holds at 2 rather than climbing, and holding is the accurate move
     * even though `spotlight` goes up from 0.8 to 0.85 across these two eras. A
     * dance band has one singer in both decades; what changed between them is
     * how much of the lighting rig is pointed at her, and `spotlight` is already
     * the field that says so. Raising the weight as well would have put five
     * floor-length dresses in an eight-piece — which is what it did, on the
     * bench, before this number came back down — and five singers is not a
     * louder version of one singer, it is a different band.
     *
     * `shirtsleeves` at 1, and it is about the room rather than the fashion.
     * This is the same open-sided wooden building as 1968 — see `PAVILION`, one
     * room and two eras — in July, with a par can rig on it that the sixties did
     * not have and a roof full of moths. Somebody has taken their jacket off,
     * and it is going to be the drummer. One in ten is roughly how often you can
     * see that in a photograph of the inside of a tanssilava.
     */
    garments: [['suit', 7], ['gown', 2], ['shirtsleeves', 1]],
    loudFabric: 'sequin', sequinChance: 0.45,
    matched: 0.35, uniform: 0.5, spotlight: 0.85,
  },
};

/**
 * Iskelmä: a tanssilava bill.
 *
 * The register to aim for is the one the genre uses about itself — affectionate
 * and unsentimental at the same time. Finnish popular song is extremely good at
 * being sad on purpose and knows it, so the lines are allowed to be dry about
 * the melancholy without sneering at it. Dance instructions are fair game; the
 * floor is the actual subject of most of this music.
 */
const BLURBS: Blurb[] = [
  { text: 'for the last dance of the evening', styles: ['tango'], moods: ['kaihoisa', 'haikea'], slot: 'close' },
  { text: 'somebody is not going to be talked out of it', styles: ['tango'] },
  { text: 'three minutes of magnificent self-pity', styles: ['tango'], moods: ['dramaattinen', 'kaihoisa'] },
  { text: 'nobody in this one has forgiven anybody', styles: ['tango'] },
  { text: 'quick, and not gentle about it', styles: ['humppa'] },
  { text: 'the floor fills whether it wants to or not', styles: ['humppa', 'jenkka'], moods: ['iloinen', 'tanssittava'] },
  { text: 'two minutes, and every one of them at speed', styles: ['humppa', 'jenkka'] },
  { text: 'one two three, and do not look at your feet', styles: ['valssi'] },
  { text: 'three to a bar, and the room goes round with it', styles: ['valssi'] },
  { text: 'hold on and keep turning', styles: ['valssi'], moods: ['romanttinen'] },
  { text: 'for the ones who came to sweat', styles: ['jenkka'] },
  { text: 'smooth, and slightly pleased with itself', styles: ['foksi'] },
  { text: 'a slow circuit of the floor, and back to your seat', styles: ['foksi'] },
  { text: 'nobody is in a hurry, least of all the bass player', styles: ['foksi', 'beguine'], moods: ['rento'] },
  { text: 'a warm night on a borrowed island', styles: ['beguine'] },
  { text: 'big hair, bigger key change', styles: ['iskelmapop'] },
  { text: 'wistful in the way that still rhymes', moods: ['haikea'] },
  { text: 'the long way home, in a minor key', moods: ['kaihoisa'] },
  { text: 'as remembered, which is not quite as it was', moods: ['nostalginen'] },
  { text: 'to get everybody up, which is the whole job', moods: ['iloinen', 'tanssittava'], slot: 'open' },
  { text: 'the one they will hum in the car park', slot: 'close' },
  { text: 'played every summer since, and not worn out yet' },
];

export const STAGING: Staging = {
  room: PAVILION,
  wardrobe: WARDROBE,
  /**
   * Tanssilava, when the era is one this genre has no clothes for. The sixties
   * pavilion is the picture the whole genre is of, and the eighties are the
   * variation on it rather than the other way round.
   */
  defaultEra: 'tanssilava',
  blurbs: BLURBS,
  /**
   * The most body of any genre here, and the yardstick the others are set
   * against: this band is playing for a floor of people who are dancing, and it
   * is watching them do it.
   */
  body: 1,
};
