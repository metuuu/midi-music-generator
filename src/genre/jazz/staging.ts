/**
 * What jazz stages: a brick cellar, smaller than the band deserves.
 *
 * The room, the clothes and the programme copy for this genre, moved out of
 * `concert/venue.ts`, `concert/cast.ts` and `concert/showbill.ts` with every
 * value unchanged. `Staging` in `genre/types.ts` has the argument for why a
 * genre now carries these rather than the renderer holding a registry of them.
 *
 * This is the genre with three wardrobes and three dressings of one room, which
 * makes it the best worked example of the distinction `venue.ts` states and the
 * one to copy: **genre dresses the room, era shifts the palette and the
 * fixtures.** The building does not change between 1938 and 1968. The gilt comes
 * off it, the smoke thickens and then thins, the suits stop matching, and the
 * band that walks in is a different band — all of that is era, and none of it is
 * a second room.
 */

import type { BillHouse, Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE CELLAR — jazz.
 *
 * Low, brick, and smaller than the band deserves. Tables right up to the stage
 * and candles on them, which is the only warm light in the room and therefore
 * the thing the whole palette is built around. Smoke is `fog`, not a prop: it
 * is a volume the beams pass through, and the beams are what a jazz room is
 * for.
 */
const CELLAR: StageRoom = {
  id: 'jazz-cellar',
  names: ['The Blue Alcove', 'Cellar Nine', 'Club Meridian', 'The Ivy Room', 'The Vault', 'Room Twelve'],
  width: 8.8, depth: 5.4,
  audience: { rows: 6, density: 0.86, seated: true },
  eras: {
    // 1930s–40s. Gilt, burgundy and tungsten; the one era here that still has
    // some money in the room.
    swingera: {
      palette: {
        boards: '#5b4632',
        backdrop: '#4a2b23',
        curtain: '#5c1a1f',
        proscenium: '#b08a3e',
        ambient: '#ffb46b',
      },
      props: [
        'low-ceiling', 'brick', 'tables', 'candles', 'bar', 'haze',
        'chandelier', 'riser',
      ],
      maybe: [['posters', 0.5], ['rug', 0.3]],
      fog: 0.32,
    },
    // 1950s–60s. Darker, smokier, and stripped of the gilt. Bop happened in
    // rooms nobody had decorated since the war.
    bop: {
      palette: {
        boards: '#4a3b2c',
        backdrop: '#3d2a26',
        curtain: '#4a1520',
        proscenium: '#8f7238',
        ambient: '#ffc07a',
      },
      props: [
        'low-ceiling', 'brick', 'tables', 'candles', 'bar', 'haze',
        'posters', 'riser',
      ],
      maybe: [['rug', 0.4], ['flight-case', 0.25]],
      fog: 0.42,
    },
    // 1960s–70s. Cooler and greyer, hard-edged par cans, and the smoke starts
    // to thin because the room is now a listening room rather than a bar.
    modern: {
      palette: {
        boards: '#3f3a33',
        backdrop: '#33302c',
        curtain: '#2e3a3a',
        proscenium: '#6f6a5e',
        ambient: '#ffd0a0',
      },
      props: [
        'low-ceiling', 'brick', 'tables', 'candles', 'bar', 'posters',
        'rug', 'riser', 'wedges',
      ],
      maybe: [['haze', 0.6], ['pa-stack', 0.4]],
      fog: 0.3,
      grow: [0.4, 0.2],
    },
  },
  fallback: {
    palette: {
      boards: '#4a3b2c', backdrop: '#3d2a26', curtain: '#4a1520',
      proscenium: '#8f7238', ambient: '#ffc07a',
    },
    props: ['low-ceiling', 'brick', 'tables', 'candles', 'bar', 'haze', 'riser'],
    fog: 0.35,
  },
};

const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1930s–40s swing. Dark suits and a tie on everybody, hair oiled flat. The
   * most uniform band in the project, because that is what a swing group in a
   * gilt room was — a *section*, dressed as one.
   */
  swingera: {
    jackets: ['#20242e', '#2b2b2b', '#3b3226', '#4a4f5c', '#e9e6dd'],
    shirts: ['#ffffff', '#fdf9ee'],
    trousers: ['#20242e', '#2b2b2b', '#3b3226'],
    accents: ['#7b1e2b', '#1b4d3e', '#8a6d3b', '#2f3e7a'],
    loud: ['#e9e6dd', '#8a6d3b'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#cfcac2'],
    hairStyles: [['slick', 6], ['short', 4], ['curls', 1], ['bald', 1]],
    accessories: [['tie', 0.85], ['moustache', 0.25], ['glasses', 0.2], ['bowtie', 0.2], ['porkpie', 0.15]],
    // Wool, and very nearly only wool. That is the genre, in three eras.
    fabrics: [['wool', 9], ['satin', 1]],
    /**
     * Nine to one, and the one is the man out front.
     *
     * The same shape as `classical:romantic`'s table with the two entries
     * swapped, and the pair is worth reading together because they are the two
     * ends of the same argument. An orchestra is forty people who are all the
     * tailcoat and one deputy who is not; a swing band in a gilt room is
     * fourteen people who are all the dark suit and one leader who has dressed
     * for a different evening than the section behind him. `uniform: 0.85` above
     * says the colours agree, and this says the shapes agree too, except once.
     *
     * `tails` is also the only member of the union that is invisible from the
     * front, which suits this era better than any other in the genre: from a
     * table on the floor the leader is a dark suit like the rest of the stand,
     * and it is only when he turns to bring the brass in that the two panels
     * behind his knees say he is not. That is a fact about how these rooms were
     * looked at, and it is why the garment gets weighted here rather than in
     * `bop`, where nobody was looking at the clothes at all.
     */
    garments: [['suit', 9], ['tails', 1]],
    loudFabric: 'satin', sequinChance: 0,
    matched: 0.85, uniform: 0.85, spotlight: 0.3,
  },
  /**
   * 1950s–60s bop. The suits stay dark and the ties get narrow; glasses and a
   * porkpie appear, and so does the first facial hair in the genre. A quintet
   * in a room nobody had redecorated since the war.
   */
  bop: {
    jackets: ['#1c1f27', '#262626', '#333a33', '#3a3340', '#454b57'],
    shirts: ['#ffffff', '#f2f2ee', '#d8dbe0'],
    trousers: ['#1c1f27', '#262626', '#2e2e2e'],
    accents: ['#8e2b2b', '#1f5c4a', '#b08a3e', '#2f3e7a', '#5a3d7a'],
    loud: ['#b08a3e', '#d8dbe0'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#cfcac2'],
    hairStyles: [['short', 5], ['slick', 4], ['bald', 2], ['curls', 2]],
    accessories: [['tie', 0.8], ['glasses', 0.35], ['porkpie', 0.3], ['beard', 0.3], ['sunglasses', 0.12]],
    fabrics: [['wool', 9], ['satin', 1]],
    /**
     * The suit stays; the jacket comes off in the room the suit is worn in.
     *
     * A quintet in a cellar nobody had redecorated since the war is the era
     * comment's own phrase, and the thing it leaves out is that such a room is
     * about thirty degrees by the second set. `waistcoat` at 2 is the tenor
     * player who has hung his jacket on the piano and is playing in the vest and
     * the tie he had on under it — which is half the photographs anybody has of
     * this music, and which the wardrobe could not previously say at all.
     *
     * It is deliberately the *same* two shapes as `country:honkytonk` three
     * years earlier and it means something completely different in each: there
     * it is a road band who have been in a station wagon since Tuesday, here it
     * is a man who is too hot. A silhouette does not carry a reason, and the
     * eight in the union are only worth having because each of them can be
     * borrowed by a genre that means the opposite by it.
     */
    garments: [['suit', 8], ['waistcoat', 2]],
    loudFabric: 'wool', sequinChance: 0,
    matched: 0.8, uniform: 0.72, spotlight: 0.25,
  },
  /**
   * 1960s–70s modern. Where the suit comes off: polo necks, earth colours, a
   * flat cap, and the band stops matching. The era's palette is Rhodes and
   * flute rather than trumpet and clarinet, and this is the same loosening.
   */
  modern: {
    jackets: ['#2f3a33', '#3a3630', '#232323', '#4a3f52', '#5c4a34'],
    shirts: ['#1c1c1c', '#5c5347', '#7a6f5e', '#c9bfa8'],
    trousers: ['#2b2b2b', '#3c3a33', '#4a4438'],
    accents: ['#c56a2b', '#3f7a6a', '#8a5a9e', '#b8a13c'],
    loud: ['#c56a2b', '#b8a13c'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#8d6a3f', '#cfcac2'],
    hairStyles: [['curls', 4], ['short', 4], ['long', 3], ['bald', 2], ['slick', 1]],
    accessories: [['sunglasses', 0.35], ['beard', 0.35], ['tie', 0.25], ['flatcap', 0.2], ['scarf', 0.15]],
    // The suit comes apart here along with everything else: corduroy, knit and
    // the occasional velvet jacket, and wool stops being the whole answer.
    fabrics: [['wool', 5], ['corduroy', 3], ['knit', 2], ['velvet', 1], ['denim', 1]],
    /**
     * *Where the suit comes off*, and the third entry is the one to defend.
     *
     * The first two are the era comment said plainly. A suit at 5 rather than 9
     * is a band that has stopped matching — barely ahead of the thing that is
     * not a suit, which is the narrowest lead any garment holds in this file and
     * is the point — and `waistcoat` at 4 is the polo neck
     * and the earth colours arriving as a *shape* rather than as a swatch: the
     * shell and the sleeves both go to the shirt colour, so a player in this
     * garment reads as somebody wearing a knitted thing with something over it
     * instead of a jacket over a white shirt, which is the difference between
     * 1969 and 1959 in one silhouette.
     *
     * `robe` at 2 is the honest one, and it is not a costume. The floor-length
     * column with wide sleeves is the garment this era's musicians actually put
     * on when they stopped wearing suits — the same object `arabic:takht` calls
     * a galabeya and `indian:carnatic` calls a full-cut kurtā, worn on an
     * American stage from about 1967 as a deliberate statement about where the
     * music was being traced back to. One in ten, and the number was set on the
     * bench rather than reasoned to: at 2 this era drew three of them in a
     * seven-piece and the row stopped being a jazz group and became a costume
     * party, which is the failure the whole union is supposed to be steering
     * around. At 1 the same seven-piece draws two, which is a septet with a
     * couple of people in it who have been to Africa — and nought would have
     * left the era looking like `bop` in a browner suit.
     */
    garments: [['suit', 5], ['waistcoat', 4], ['robe', 1]],
    loudFabric: 'velvet', sequinChance: 0,
    matched: 0.45, uniform: 0.4, spotlight: 0.2,
  },
};

/**
 * Jazz: a club card.
 *
 * Understatement, and a house-band's view of the repertoire rather than a
 * critic's. The genre's own jokes are about tempo, about how hard the easy
 * things are, and about the size of the audience — so those are the jokes.
 * Nothing here calls anything "sophisticated", which is what a bill written
 * from outside the music would do.
 */
const BLURBS: Blurb[] = [
  { text: 'medium, and it stays medium — that is the hard part', styles: ['swing'] },
  { text: 'the tempo everyone can play and almost nobody plays well', styles: ['swing'], moods: ['swinging'] },
  { text: 'the one the whole book is built on', styles: ['swing'] },
  { text: 'count it in and hold on', styles: ['bebop'] },
  { text: 'the head twice, then every man for himself', styles: ['bebop'], moods: ['hot'] },
  { text: 'the one where the drummer picks up the brushes', styles: ['ballad'] },
  { text: 'take your time. the band certainly will', styles: ['ballad', 'modal'] },
  { text: 'quiet enough that you can hear the room', styles: ['ballad', 'bossa'] },
  { text: 'played for about eleven people, all of them listening', styles: ['ballad'], moods: ['smoky'] },
  { text: 'warm, quiet, and secretly very difficult', styles: ['bossa'] },
  { text: 'twelve bars. no further questions', styles: ['blues'] },
  { text: 'the same twelve bars as everyone else, played better', styles: ['blues'], moods: ['bluesy'] },
  { text: 'two chords and a great deal of nerve', styles: ['modal'] },
  { text: 'nowhere in particular to be, harmonically', styles: ['modal'], moods: ['dreamy', 'cool'] },
  { text: 'all downstrokes and no mercy', styles: ['gypsy'] },
  { text: 'for the last set, once the room has thinned out', moods: ['smoky'] },
  { text: 'nothing is rushed and nothing is missing', moods: ['cool'] },
  { text: 'something to play while the room settles', slot: 'open' },
  { text: 'the one they came for, kept until last', slot: 'close' },
  { text: 'somebody will take four choruses and nobody will mind' },
];

/**
 * THE BILL — a card, four decades of it, left on the table.
 *
 * All four eras take `card`: hard against the left margin, the number hanging
 * outside the text block, title and duration on one line. That is what fits on
 * something small enough to be left on a table with a drink on it, and every
 * decade of this music has been played in a room where that is the furniture.
 * The word is **Tonight**, which is what a club prints when the bill changes
 * every night and the audience did not come for a particular one.
 *
 * The papers are the argument. 1938 is buff card, deco double rules and a
 * didone at small sizes with a lot of air — the blue is the second colour of
 * the period's jobbing printing and it is not there to be noticed. 1957 is
 * Reid Miles and nothing else: off-white, a grotesque hard against the margin,
 * one hairline in the ink itself and a lot of nerve. 1968 is the same press
 * having calmed down — warm grey, larger and looser, and lowercase, because
 * the decade stopped shouting.
 *
 * **1974 is the era that had no bill at all** and printed the bop card instead,
 * which was wrong in the specific way this whole field exists to fix: electric
 * jazz is the one decade of this music that was sold as a *record sleeve*
 * rather than as a night out, and the sleeves were airbrushed, warm and
 * rounded. So it is oxide and tan, set in a geometric sans with the title in
 * lowercase, and it is the only jazz paper here that does not have a rule
 * under the masthead — a fusion sleeve did not rule anything, it faded it.
 */
const BILL: Record<string, BillHouse> = {
  swingera: {
    layout: 'card', word: 'Tonight', numeral: 'roman', aged: true,
    stock: '#e9dbba',
    grain: 'repeating-linear-gradient(90deg, rgba(90, 70, 40, .035) 0 1px, transparent 1px 3px)',
    ink: '#251d13', inkDim: '#756244', hair: '#b6a179', accent: '#1d4463',
    face: "'Iowan Old Style', Georgia, 'Times New Roman', serif",
    display: "Didot, 'Bodoni 72', 'Playfair Display', Georgia, serif",
    displayWeight: 700,
    venue: { size: '1.28em', track: '.34em', case: 'uppercase' },
    title: { size: '1.6em', track: '.1em', case: 'uppercase' },
    head: {
      pad: '.7em', rule: '1px solid var(--hair)',
      shadow: '0 4px 0 -3px var(--hair)', align: 'center',
    },
  },
  bop: {
    layout: 'card', word: 'Tonight', numeral: 'arabic',
    stock: '#eae7df',
    ink: '#15161a', inkDim: '#6d6e73', hair: '#c3c1b9', accent: '#c1471c',
    face: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    display: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    displayWeight: 700,
    venue: { size: '1.35em', track: '-.02em', case: 'uppercase' },
    title: { size: '1.7em', track: '-.03em', case: 'uppercase' },
    head: { pad: '.7em', rule: '2px solid var(--ink)' },
  },
  modern: {
    layout: 'card', word: 'Tonight', numeral: 'arabic',
    stock: '#ddd7cb',
    grain: 'linear-gradient(180deg, rgba(255, 255, 255, .35), rgba(0, 0, 0, .04))',
    ink: '#1e1c18', inkDim: '#6f6a5f', hair: '#b3ac9e', accent: '#3c7d68',
    face: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    display: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    displayWeight: 500,
    venue: { size: '1.3em', track: '.02em', case: 'lowercase' },
    title: { size: '1.9em', track: '-.02em', case: 'lowercase' },
    head: { pad: '.9em' },
  },
  electric: {
    layout: 'card', word: 'Tonight', numeral: 'arabic',
    stock: '#e4d3b6',
    grain: 'radial-gradient(120% 90% at 18% 0%, rgba(255, 236, 196, .85), rgba(196, 142, 74, .22) 62%, rgba(120, 74, 32, .16))',
    ink: '#2a1c10', inkDim: '#8a6b46', hair: '#c1a074', accent: '#b4551a',
    face: "'Avenir Next', Avenir, 'Trebuchet MS', ui-sans-serif, sans-serif",
    display: "'Century Gothic', Futura, 'Avenir Next', ui-sans-serif, sans-serif",
    displayWeight: 500,
    venue: { size: '1.32em', track: '.1em', case: 'lowercase' },
    title: { size: '1.86em', track: '.01em', case: 'lowercase' },
    head: { pad: '.95em' },
  },
};

export const STAGING: Staging = {
  room: CELLAR,
  wardrobe: WARDROBE,
  bill: BILL,
  /**
   * Bop. The quintet in the room nobody had redecorated is what this genre
   * looks like when you are not told which decade it is.
   */
  defaultEra: 'bop',
  blurbs: BLURBS,
  /**
   * A shade under the dance band. These players are seated or standing still,
   * playing for people at tables — but they are swinging, which a body does
   * visibly, and the only genre here with less movement is the one with no
   * foreground at all.
   */
  body: 0.85,
};
