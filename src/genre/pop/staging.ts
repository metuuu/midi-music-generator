/**
 * What pop stages: a variety theatre, dressed four ways.
 *
 * The room, the clothes and the programme copy for this genre. `Staging` in
 * `genre/types.ts` has the argument for why a genre carries its own rather than
 * the renderer holding a registry, and `venue.ts` states the rule this file
 * obeys: **genre dresses the room, era shifts the palette and the fixtures.**
 *
 * Read the other genres' staging before touching this one. Half of what follows
 * is chosen *against* a neighbour and is illegible from this file alone: the
 * 1965 wardrobe is the most uniformed stage in the project and is set against
 * jazz's dark suits, which look similar and mean the opposite; the 1975 one is
 * funk's `pfunk` argument with the volume turned down; and the room is
 * deliberately not the arena, which is rock's.
 */

import type { BillHouse, Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE VARIETY THEATRE — pop.
 *
 * ## The room this genre actually plays is a television studio, and there isn't one
 *
 * Worth saying first, because everything below is a second choice made in the
 * open. Sixty years of this repertoire have their canonical image in a
 * television light entertainment studio: no proscenium, no audience arch, a
 * cyclorama, three cameras on pedestals, marked spots on a painted floor, and a
 * band miming. `RoomStyle` has **twelve** members and none of them is that, and
 * `StageRoom.architecture` is explicit that adding a thirteenth means writing
 * `web/concert/rooms/<name>.ts` — which this pass is not doing, and which is the
 * one thing worth asking for if anybody writes another room.
 *
 * **That read *eleven* and *a twelfth*, and the way it went wrong is worth one
 * line, because it is not the usual way.** The twelfth member is `ballroom`,
 * added the day before this file was written — and it is the one this room
 * chooses two paragraphs down. So the sentence was never true here: its author
 * counted the union as it stood in the genre they copied the shape from, while
 * picking the member that count omits. The lesson is the one `docs/engine-gaps.md`
 * §7 draws from three authors at once — read the source, not the sibling.
 *
 * ## So: `ballroom`, and against `circuit` on purpose
 *
 * The two plausible existing rooms are the touring arena and the tired revue
 * theatre, and each is right for half of this genre's four decades. The arena is
 * 1985 and 2010; the theatre is 1963 and 1975. Two-all, and the tiebreak is not
 * a coin toss:
 *
 *  - **The arena already belongs to rock**, which named `circuit` and argues it
 *    from a repertoire whose whole trajectory is toward it. Pop's trajectory is
 *    not toward the arena, it is toward the *camera*, and staging it in rock's
 *    building would be saying the two genres end up in the same place.
 *  - **The shallow arch and the cloth are the thing.** `ballroom` is described
 *    as a flat floor, a gallery, a shallow arch and a cloth, and the cloth is
 *    what makes it right: pop is the one genre here whose stage has a curtain
 *    that goes up, and whose performers walk out onto it and stand on a mark.
 *    Every other room in the catalogue that fits this genre's later decades has
 *    no arch and no cloth, which is architecturally exact and gets the picture
 *    wrong.
 *
 * Funk names the same architecture, and `StageRoom.architecture` says at length
 * that two rooms should — a ballroom, a dancehall and a salon are one big room
 * with a floor in it. The two are dressed apart everywhere else: funk's is 11.5
 * by 7 metres for a nine-piece and stands its audience at density 0.9; this is
 * smaller and seats them, because the picture here is a package tour at the
 * Odeon and a light entertainment recording, not a floor of people dancing.
 *
 * **The audience is seated and it thins across the decades.** `density` runs
 * 0.75 in 1965 and the room grows a metre and a half by 2010, which is the one
 * fact about this genre's venues that is true of no other: pop stages got bigger
 * while pop *bands* got smaller, and by the last era the picture is three people
 * and a great deal of equipment in a room built for twenty.
 */
const VARIETY: StageRoom = {
  id: 'variety',
  architecture: 'ballroom',
  names: [
    'The Regal', 'The Astoria', 'Studio Two', 'The Gaumont', 'The Pavilion Theatre',
    'The Coliseum', 'The Hippodrome',
  ],
  width: 10, depth: 6.4,
  audience: { rows: 12, density: 0.75, seated: true },
  /**
   * The riser belongs to the genre rather than to any decade of it, and it is in
   * the always-props rather than in a `maybe` for a mechanical reason: `cast.ts`
   * stands the drummer 0.4 m up regardless, so a probabilistic draw would float
   * them on half the seeds. `venue.ts` says the same thing about the same prop,
   * and it applies here in all four eras — even the last one, where the drummer
   * is a machine two thirds of the time and the riser is what the machine
   * stands on.
   */
  props: ['riser'],
  eras: {
    /**
     * 1965. A cine-variety house with a red house tab and gilt that stopped
     * being repainted before the war, lit by tungsten and two follow spots. No
     * PA worth the name: the band's own amplifiers are the entire rig, which is
     * why `backline` is here and `pa-stack` is not, and why the room is the
     * smallest it will ever be — it did not need to be bigger, because nothing
     * on the stage could fill anything bigger.
     *
     * `posters` rather than `screen`: the bill outside is the only place the
     * act's name appears, and there are six other acts on it.
     */
    twotrack: {
      palette: {
        boards: '#6a4f33',
        backdrop: '#2a2029',
        curtain: '#8e1f2c',
        proscenium: '#c8a95e',
        ambient: '#ffd39c',
      },
      props: ['drapes', 'backline', 'posters'],
      maybe: [['chandelier', 0.45], ['carpet', 0.5], ['bar', 0.25]],
      fog: 0.18,
    },
    /**
     * 1975. The gilt is painted over, a PA appears facing the house, and the
     * room grows for the first time. This is the era with the most *people* on
     * the stage relative to the equipment — a studio band is eight players and
     * a string section, and they are all still amplified through one stack.
     *
     * The mirror ball is a `maybe` at 0.35 rather than a certainty, because this
     * decade contains both `discopop` and `chamber` and a glitter ball over a
     * string quartet is a photograph of the wrong evening.
     */
    multitrack: {
      palette: {
        boards: '#5f4a33',
        backdrop: '#2b2434',
        curtain: '#7b3a2c',
        proscenium: '#a98f56',
        ambient: '#ffc27f',
      },
      props: ['drapes', 'backline', 'pa-stack', 'wedges'],
      maybe: [['truss', 0.5], ['mirror-ball', 0.35], ['dance-floor', 0.3], ['carpet', 0.3]],
      fog: 0.3,
      grow: [0.6, 0.3],
    },
    /**
     * 1985. Truss, haze, a barrier across the front, and the moment the light
     * stops being white. The cloth is still there — this is a theatre — but
     * there is now more rigging above the stage than there is band on it, which
     * is the decade in one sentence and is the exact inverse of the era above.
     *
     * `screen` at 0.45 rather than in the always-props: half of this era's
     * picture is a projection behind the act and half of it is a lit cloth, and
     * the room should produce both.
     */
    gated: {
      palette: {
        boards: '#3f3a3a',
        backdrop: '#171b2b',
        curtain: '#3c1f52',
        proscenium: '#7c7386',
        ambient: '#9fc8ff',
      },
      props: ['pa-stack', 'truss', 'backline', 'wedges', 'crowd-barrier', 'drapes'],
      maybe: [['haze', 0.7], ['screen', 0.45], ['mirror-ball', 0.25]],
      fog: 0.44,
      grow: [1, 0.4],
    },
    /**
     * 2010. No backline at all, because there is nothing on this stage to
     * amplify — the band is a laptop, a pad controller and two singers. What
     * fills the space instead is an LED wall and a lighting rig, and the room is
     * a metre and a half wider than it was in 1965 with a third of the people on
     * it.
     *
     * `screen` rather than `projection`, which is the distinction funk's own
     * table draws and is the right way round here too: the first is a lit
     * rectangle made of diodes and the second is film on a cloth. Forty-five
     * years separate this stage from the top of this table and the two props are
     * how far it has come.
     */
    sidechain: {
      palette: {
        boards: '#2c2f34',
        backdrop: '#0e1219',
        curtain: '#1c2836',
        proscenium: '#5d6672',
        ambient: '#8ce8ff',
      },
      props: ['pa-stack', 'truss', 'screen', 'crowd-barrier', 'wedges'],
      maybe: [['haze', 0.75], ['flight-case', 0.35]],
      fog: 0.42,
      grow: [1.5, 0.5],
    },
  },
  fallback: {
    palette: {
      boards: '#5f4a33', backdrop: '#2b2434', curtain: '#7b3a2c',
      proscenium: '#a98f56', ambient: '#ffc27f',
    },
    props: ['drapes', 'backline', 'pa-stack', 'wedges'],
    fog: 0.3,
  },
};

const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1965. **The most uniformed stage in the project**, and it is not the same
   * uniform jazz wears.
   *
   * `uniform: 0.92` and `matched: 0.92` are both the highest here. A jazz
   * quintet in dark suits is five men who each own a dark suit; a beat group in
   * 1965 is four men in *the same* collarless jacket, bought together, because
   * the manager decided, and a girl group is three women in one dress made three
   * times. That is a genuinely different fact about a stage and it is the one
   * thing this era's picture has to get right.
   *
   * `spotlight: 0.6` is correspondingly the *lowest* of the four, which reads
   * backwards until the uniform number above is taken into account: this is the
   * one era where the act is a group rather than a front person, and one person
   * in a louder jacket would be undoing the whole point of the other two
   * numbers.
   */
  twotrack: {
    jackets: ['#1c2233', '#2f2f2f', '#5c1f2b', '#3a3f2e', '#d8d0bc', '#6b4a2e'],
    shirts: ['#ffffff', '#fdf6e8', '#f0e4cc'],
    trousers: ['#1c2233', '#2f2f2f', '#3a3f2e'],
    accents: ['#c62828', '#1565c0', '#f9a825', '#00695c'],
    loud: ['#d4af37', '#c62828', '#ffffff'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#a8763f'],
    hairStyles: [['bob', 5], ['short', 5], ['beehive', 4], ['slick', 4], ['updo', 2], ['curls', 2]],
    accessories: [
      ['tie', 0.5], ['earrings', 0.3], ['glasses', 0.2], ['bowtie', 0.15],
      ['hoops', 0.15],
    ],
    fabrics: [['wool', 6], ['satin', 3], ['silk', 2], ['brocade', 1]],
    /**
     * Two shapes and nothing else, which is the flattest-but-one table in this
     * file and is the opposite kind of statement from funk's `pfunk`.
     *
     * There the flat table is nine people all trying to be seen *differently*.
     * Here it is bimodal on purpose: a 1965 bill is groups of men in identical
     * suits and groups of women in identical gowns, and there is very little in
     * between. Six to four rather than eight to two because the two halves of
     * this era's repertoire — `merseybeat` and `girlgroup` — are weighted almost
     * equally in `eras.ts`, and the wardrobe should not quietly decide that one
     * of them is the real one.
     *
     * `waistcoat` at 1 is the man at the piano who took his jacket off, and it
     * is the only concession here to anybody being an individual.
     */
    garments: [['suit', 6], ['gown', 4], ['waistcoat', 1]],
    loudFabric: 'sequin', sequinChance: 0.3,
    matched: 0.92, uniform: 0.92, spotlight: 0.6,
  },
  /**
   * 1975. The uniform dissolves completely, and unlike funk's version of the
   * same year it does not turn into a costume.
   *
   * `uniform: 0.15` is close to funk's 0.12 and means something quieter: these
   * are session players in their own clothes because nobody told them what to
   * wear, rather than nine people competing to be looked at. The palette is
   * where that shows — earth, denim, cream and one loud colour, against `pfunk`'s
   * magenta and cyan.
   *
   * `silk` leads the fabric table and it is the era's whole surface: a broad soft
   * lustre that moves with the drape, where satin's is a hard bright line. Under
   * a tungsten follow spot in a room with the gilt painted over, that is 1975 and
   * nothing else is.
   */
  multitrack: {
    jackets: ['#6d5334', '#8d6b3f', '#4a5568', '#b5a179', '#7a3b3b', '#e8e0cc'],
    shirts: ['#f4ecd8', '#e8c9a0', '#c9d6c1', '#ffffff', '#d9b8c4'],
    trousers: ['#3f4a5c', '#6d5334', '#8a7a5c', '#2f2f2f'],
    accents: ['#c1660f', '#7b6b21', '#8e4b8b', '#2e7d6b'],
    loud: ['#d4af37', '#c0c0c0', '#c1660f'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#a8763f', '#c9a86a'],
    hairStyles: [['long', 5], ['mane', 4], ['curls', 4], ['short', 3], ['bob', 2], ['slick', 2]],
    accessories: [
      ['moustache', 0.35], ['beard', 0.3], ['glasses', 0.3], ['scarf', 0.25],
      ['hoops', 0.25], ['sunglasses', 0.2],
    ],
    fabrics: [['silk', 5], ['denim', 4], ['corduroy', 3], ['wool', 3], ['satin', 2], ['knit', 2]],
    /**
     * Four shapes, and the flattest table in this file. Nobody on this stage is
     * dressed as anything in particular.
     *
     * `shirtsleeves` at 3 is the highest weight that garment gets anywhere here
     * and it is exactly right: the picture of 1975 pop is a keyboard player with
     * their sleeves rolled up, because this is the decade the *studio* became
     * the venue and a studio is somewhere you are working rather than appearing.
     *
     * The tail weights are 2 and 1 rather than 3 and 3, and the reason is the
     * one funk's table records for whoever dresses the next genre: a row is
     * eight players drawn at the same index of eight correlated streams, so a
     * weight of 3 on `gown` puts most of a band in one, and a wardrobe with
     * `uniform: 0.15` above it that produces eight identical silhouettes has
     * failed at the one thing it was set up to do.
     */
    garments: [['suit', 4], ['shirtsleeves', 3], ['gown', 2], ['waistcoat', 1]],
    loudFabric: 'lame', sequinChance: 0.25,
    matched: 0.3, uniform: 0.15, spotlight: 0.85,
  },
  /**
   * 1985. The stylist arrives, and this is the era where the *silhouette* is the
   * idea rather than the colour.
   *
   * `coat` at 3 is the entry this whole wardrobe was worth writing for. A
   * knee-length skirted coat with a standing collar is the new romantic outline
   * and there is no way to reach it by choosing a nicer dye — which is the
   * complaint `Garment` opens with, stated about the one era in this genre where
   * it bites hardest. Every other decade here is a suit or a dress in different
   * cloth; 1985 is a different shape.
   *
   * `uniform` comes back up to 0.4 but stays well under 1965's, and the reason
   * is the same one funk gives for its `boogie` era: the band matches as a
   * *look* now rather than as a section, and a look is a much narrower thing
   * than a manager buying four of the same jacket. `spotlight: 0.95` is the
   * highest here, because this is the era the act is definitively one person
   * with a band behind them.
   */
  gated: {
    jackets: ['#1a1a22', '#c2185b', '#00838f', '#e0e0e0', '#5e35b1', '#ff6f00'],
    shirts: ['#ffffff', '#f8bbd0', '#b2ebf2', '#1a1a22'],
    trousers: ['#1a1a22', '#37474f', '#e0e0e0', '#4a148c'],
    accents: ['#ff2d95', '#00e5ff', '#ffe000', '#c0c0c0'],
    loud: ['#c0c0c0', '#ff2d95', '#d4af37'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#c9a86a', '#a83e2b'],
    hairStyles: [['mane', 5], ['mullet', 4], ['curls', 4], ['bob', 3], ['updo', 3], ['slick', 3], ['short', 2]],
    accessories: [
      ['earrings', 0.4], ['sunglasses', 0.3], ['wraparounds', 0.25], ['scarf', 0.25],
      ['hoops', 0.25], ['chain', 0.2],
    ],
    fabrics: [['satin', 5], ['leather', 4], ['silk', 3], ['brocade', 2], ['vinyl', 2], ['wool', 2]],
    garments: [['suit', 5], ['coat', 3], ['gown', 2], ['waistcoat', 1]],
    loudFabric: 'lame', sequinChance: 0.4,
    matched: 0.4, uniform: 0.4, spotlight: 0.95,
  },
  /**
   * 2010. Everybody behind the front person is in black, and the front person is
   * not.
   *
   * `uniform: 0.6` is the second highest here and it is a completely different
   * mechanism from 1965's 0.92. There a manager bought four identical jackets;
   * here there are two musicians, both dressed in black by instruction so that
   * they disappear against the backdrop, which is also black. The band is
   * uniform because the band is *scenery* — and `spotlight: 0.95` on top of it
   * is what makes the picture legible at all.
   *
   * The fabric table is the coldest in the file: vinyl, nylon and leather, all
   * three of which take a hard specular highlight from an LED rig and none of
   * which does anything under tungsten. That is the lighting change of the last
   * twenty years stated as cloth.
   */
  sidechain: {
    jackets: ['#141414', '#1e2229', '#ffffff', '#c62828', '#37474f', '#d4af37'],
    shirts: ['#141414', '#ffffff', '#263238'],
    trousers: ['#141414', '#1a1a1a', '#263238'],
    accents: ['#00e5ff', '#ff1744', '#c0c0c0', '#76ff03'],
    loud: ['#c0c0c0', '#d4af37', '#ffffff'],
    hair: ['#101010', '#1a1a1a', '#22160f', '#3a2416', '#c9a86a', '#b0b0b0'],
    /**
     * `emo` at 2, and it is in a *pop* table because the two genres it belongs
     * to stop before it happens. The style is a 2003 object — a flat-ironed
     * fringe swept over one eye — and rock's last era ends in 1997 and metal's
     * in 2000. Several tables here do reach the 2000s, but they are dnb, house,
     * hiphop, ambient and arabic satellite pop, and none of those rooms is one
     * this haircut ever stood in. What is left is the bill that takes whatever
     * is on the radio, which is what this genre is for.
     *
     * A weight of 2 against a table of 23 is about one player in twelve: a bill
     * with somebody on it rather than a bill *about* it. The first two hair
     * colours are `#101010` and `#1a1a1a` already, so the dye job needs nothing
     * added — this era's palette was black before the fringe arrived.
     */
    hairStyles: [
      ['long', 5], ['bob', 4], ['updo', 3], ['short', 3], ['slick', 3],
      ['braids', 2], ['emo', 2], ['bald', 1],
    ],
    accessories: [
      ['earrings', 0.35], ['wraparounds', 0.3], ['headphones', 0.25], ['chain', 0.2],
      ['ballcap', 0.15], ['hoops', 0.2],
    ],
    fabrics: [['vinyl', 5], ['leather', 4], ['nylon', 3], ['satin', 3], ['silk', 2], ['wool', 1]],
    garments: [['suit', 5], ['gown', 3], ['shirtsleeves', 2]],
    loudFabric: 'sequin', sequinChance: 0.45,
    matched: 0.6, uniform: 0.6, spotlight: 0.95,
  },
};

/**
 * Pop: a variety bill.
 *
 * The register is the house one — affectionate, dry, and never a critic's — with
 * this genre's own joke about itself running through it, which is that an
 * enormous amount of professional effort goes into something everybody agrees is
 * disposable. So the lines are about the trade: the writers, the session, the
 * key change, the running order, and how many people it took to make three
 * minutes sound easy. None of them says what a chorus is.
 */
const BLURBS: Blurb[] = [
  { text: 'somebody wrote this in a room with a piano and a deadline', styles: ['brill'] },
  { text: 'four of them, in the same jacket, at the same time', styles: ['merseybeat'] },
  { text: 'a wall of it, and one girl in front', styles: ['girlgroup'] },
  { text: 'no bridge, no shame, out in two minutes', styles: ['bubblegum'] },
  { text: 'there is a harpsichord and nobody is going to explain why', styles: ['baroque'] },
  { text: 'four people singing one chord', styles: ['sunshine'] },
  { text: 'the band were hired, and it shows in the good way', styles: ['softrock'] },
  { text: 'the slow one. lights down, and mind the key change', styles: ['ballad'], moods: ['slowdance'] },
  { text: 'one voice, one accompanist, and no eye contact', styles: ['torch'], moods: ['heartbreak'] },
  { text: 'the strings arrive in bar nine and stay', styles: ['discopop', 'chamber'] },
  { text: 'a 1965 single, made again with better microphones', styles: ['powerpop'] },
  { text: 'there is an oboe. it has a part', styles: ['chamber'], moods: ['bside'] },
  { text: 'the drummer is a suitcase', styles: ['synthpop', 'hinrg'] },
  { text: 'everybody has been to the theatre and it did not help', styles: ['newromantic'] },
  { text: 'written for the back row of somewhere much larger than this', styles: ['stadium'] },
  { text: 'twelve strings, and no reverb on any of them', styles: ['jangle'], moods: ['bside'] },
  { text: 'a song, put behind a great deal of weather', styles: ['dreampop'], moods: ['latenight'] },
  { text: 'four bars, twenty-eight times, and you will not mind', styles: ['europop'] },
  { text: 'every line starts on the and of four', styles: ['teen'] },
  { text: 'the chorus is not sung. it is played, and it is louder', styles: ['dancepop', 'tropical'] },
  { text: 'four people in a room, in a decade that had stopped needing one', styles: ['indiepop'] },
  { text: 'to get everybody looking the same way', slot: 'open' },
  { text: 'the one nobody will admit to knowing all the words to', slot: 'close' },
];

/**
 * THE BILL — a card, because pop is a variety bill and always was.
 *
 * `card`, shared with jazz, funk and the revue, and the reason is the room: a
 * variety theatre hands you something at the door with a running order on it,
 * six acts long, and expects you to follow along. Left margin, number hanging
 * outside it, title and duration on one line. The word is **Programme** and it
 * is the plainest heading in this file, which is correct — pop is the genre
 * that does not need a special word for what it is doing.
 *
 * The four papers are four production eras of the same industry. 1965 is cream
 * and rose and a heavy grotesque, printed cheaply in quantity. 1975 is warm,
 * amber, lowercase and rounded — the decade the sleeve got soft. 1985 is
 * coated, glossy and blue, set in a geometric sans at its heaviest, and it is
 * the loudest of the four by a distance. 1998 is cold white and pink and set
 * light, because by then the design was done in a browser and the browser had
 * opinions.
 */
const BILL: Record<string, BillHouse> = {
  twotrack: {
    layout: 'card', word: 'Programme', numeral: 'arabic', aged: true,
    stock: '#efe9dc',
    grain: 'repeating-linear-gradient(0deg, rgba(110, 90, 60, .035) 0 1px, transparent 1px 4px)',
    ink: '#1f1a18', inkDim: '#7a7069', hair: '#c4b9ae', accent: '#b03a5c',
    face: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    display: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    displayWeight: 700,
    venue: { size: '1.24em', track: '.1em', case: 'uppercase' },
    title: { size: '1.64em', track: '-.02em', case: 'uppercase' },
    head: { pad: '.7em', rule: '2px solid var(--ink)' },
  },
  multitrack: {
    layout: 'card', word: 'Programme', numeral: 'arabic',
    stock: '#eee6d6',
    grain: 'radial-gradient(120% 100% at 26% 0%, rgba(255, 250, 236, .9), rgba(190, 150, 90, .18))',
    ink: '#251f16', inkDim: '#867a64', hair: '#c9bda2', accent: '#b1741f',
    face: "'Avenir Next', Avenir, ui-sans-serif, sans-serif",
    display: "'Century Gothic', Futura, 'Avenir Next', ui-sans-serif, sans-serif",
    displayWeight: 500,
    venue: { size: '1.2em', track: '.14em', case: 'lowercase' },
    title: { size: '1.76em', track: '.01em', case: 'lowercase' },
    head: { pad: '.9em' },
  },
  gated: {
    layout: 'card', word: 'Programme', numeral: 'arabic',
    stock: '#f4f2f6',
    grain: 'linear-gradient(158deg, rgba(255, 255, 255, .95), rgba(214, 214, 232, .55))',
    ink: '#191a22', inkDim: '#74757f', hair: '#cfcfda', accent: '#2f57c4',
    face: "'Avenir Next', Avenir, 'Trebuchet MS', ui-sans-serif, sans-serif",
    display: "'Avenir Next', Avenir, 'Century Gothic', ui-sans-serif, sans-serif",
    displayWeight: 800,
    venue: { size: '1.22em', track: '.22em', case: 'uppercase' },
    title: { size: '1.8em', track: '-.01em', case: 'uppercase' },
    head: { pad: '.7em', rule: '.4em solid var(--accent)' },
  },
  sidechain: {
    layout: 'card', word: 'Programme', numeral: 'arabic',
    stock: '#f4f2f3',
    ink: '#1b1e24', inkDim: '#7b828b', hair: '#d6d2d4', accent: '#d8306a',
    face: "ui-sans-serif, 'Helvetica Neue', Arial, sans-serif",
    display: "ui-sans-serif, 'Helvetica Neue', Arial, sans-serif",
    displayWeight: 500,
    venue: { size: '1.06em', track: '.3em', case: 'lowercase' },
    title: { size: '1.68em', track: '-.02em', case: 'lowercase' },
    head: { pad: '.9em' },
  },
};

export const STAGING: Staging = {
  room: VARIETY,
  wardrobe: WARDROBE,
  bill: BILL,
  /**
   * 1985. Handed an era this genre has no clothes for, the picture to fall back
   * on is the gated one — not because it is the best of the four but because it
   * is the most *legible*: a truss, haze, one person in front of a band in the
   * dark. 1965 and 2010 are the two ends of the argument and neither of them is
   * what somebody who has not been told anything about pop pictures when the
   * word is said.
   */
  defaultEra: 'gated',
  blurbs: BLURBS,
  /**
   * 0.85, and it is deliberately not the top.
   *
   * Iskelmä's 1.0 is a band watching a floor of couples dance and funk's 0.95 is
   * a band moving as much as the floor is. This genre is neither, and the reason
   * is the seated audience two hundred lines above: the canonical pop
   * performance is *presented* rather than joined in with. A front person moves a
   * great deal and everybody behind them is standing still on a mark hitting
   * their cue, which averages out to a shade under a jazz quintet at tables —
   * and jazz's 0.85 is the right neighbour to sit beside for exactly that
   * reason, arrived at from the opposite direction.
   */
  body: 0.85,
};
