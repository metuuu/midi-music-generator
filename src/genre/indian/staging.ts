/**
 * What this genre stages: a carpeted hall with four people sitting on the floor
 * of it.
 *
 * Read `iskelma/staging.ts`, `jazz/staging.ts` and `ambient/staging.ts` before
 * this one — all three say so, and they are right: the pavilion's dancing crowd,
 * the cellar's tables and the black box's refusal to have a focus are the three
 * points this room is being placed between, and none of the arguments below are
 * legible on their own.
 *
 * Where it lands is roughly where the cellar is and for opposite reasons. A jazz
 * club is small because the room is a bar that music happens in; a sabhā is
 * small because the music is one person at conversational volume and a hall that
 * could not hear a damped tabla stroke is the wrong hall. Both end up with the
 * audience close. The difference is that nobody here is drinking, nobody is
 * dancing, and everybody in the front row is counting the tāla on their own knee.
 *
 * ## The posture, and what the room still has to carry
 *
 * **This music is performed sitting on the floor**, cross-legged, on a carpet,
 * with the instrument in the lap or resting on the boards. That is not a
 * stylistic preference; a sitar is played with its gourd on the left foot and a
 * mridangam lies across the player's shins. `Posture` says `floor` now, and it
 * is a conjunction of two facts held in two places: `ArchetypeSpec.lap` says
 * the object can be played from a carpet, `FLOOR_SEATED` in `cast.ts` names
 * this genre as one that sits on one, and `postureFor` is where they meet. The
 * sitar player and the tabla player are on the boards rather than half a metre
 * above them on furniture nobody in this tradition owns.
 *
 * The `carpet` did not become decoration when that landed, for two reasons. It
 * is what these players are sitting on, corner to corner. And the flag left a
 * residue it is honest about — most of the objects that reach this stage are
 * borrowed ones a floor-seated player could not use, a sarangi staged as a
 * violin and a santoor as a vibraphone, and those are still standing up. See
 * `lap` in `concert/types.ts`, which argues at length why they must.
 */

import type { BillHouse, Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE SABHĀ — a music hall for one soloist.
 *
 * Wide rather than deep, carpeted end to end, with the audience close and
 * seated. The proportions are the one thing here that is a compromise rather
 * than a description: a real baithak is a room in a house with thirty people in
 * it and no stage at all, and this is ten metres by six and a half because
 * `chooseVenue` runs before the cast exists and the boards have to hold the
 * largest band the genre can produce — which is the filmī era's, and which is an
 * orchestra. The intimacy is carried by the audience being ten rows at 0.8
 * density rather than by cramping the players, exactly as `concert/venue.ts`
 * advises.
 *
 * **The audience sits.** Not for the reason a concert hall's does — this is not
 * a room where an audience is furniture — but because a rasika listens with
 * their hands: the tāla is counted on the thigh, and the response to a good
 * phrase is a raised palm and a noise, both of which need somebody sitting to
 * make sense.
 *
 * `carpet` and `riser` are the room's own props rather than any era's, and they
 * are there for different reasons. The carpet is the floor of every one of these
 * four eras and repeating it four times would be noise.
 *
 * **The riser is not the tabla player's**, and this comment used to say it was —
 * that `cast.ts` stood every drafted drummer 0.4 m up and a floor-seated
 * percussionist was therefore stuck on a rock platform. That is fixed:
 * `handdrum` declares `lap`, this genre is in `FLOOR_SEATED`, and `postureFor`
 * seats them. The hand drummer is at riser 0 on the carpet, off to one side and
 * level with the comp rather than on the back line, because a player whose head
 * is 0.84 m up cannot be seen over the shoulders in front of them and has to
 * come forward by as much as they have lost in height.
 *
 * **The platform is empty, and this comment used to explain why it was not.**
 * It said that `filmi`, `cabaret`, `bhangra`, `ragarock` and `fusiongat` were
 * the five styles declaring `transitions`, that `applyShot` wrote its figure as
 * a kick, a snare and a crash, and that `drumStations` therefore answered *kit*
 * and stood a session drummer beside the dholak player in roughly two filmī
 * numbers in five. Every step of that is now false. The shot resolves its voices
 * from the events instead of naming three, so on these tables it writes doum
 * strokes; the events stay `lp mp hp cp perc`, all hand or `either` tier; and
 * `drumStations` answers *hand*. **Measured: 0 of 300 numbers put any performer
 * on the riser** — and seventeen styles declare `transitions` now, not five, so
 * it is not for want of gestures being drawn.
 *
 * The prop stays anyway, and the reason it stays is the reason it was put on the
 * room rather than on an era in the first place: `showRiser` stands the platform
 * when somebody is on it and takes it away when nobody is, so an unoccupied
 * riser costs nothing and an era-level one would have had to be edited every
 * time the composing side changed its mind — which it has now done twice. What
 * would put a drummer back up there is a style writing a kit voice into its own
 * *table*, which is a claim about what is in the room and is the only kind of
 * claim that should be able to stage an instrument. No style here makes one.
 *
 * That is worth stating as a loss as well as a fix. `filmi`'s note says a film
 * session had a dholak player and a session drummer sitting next to each other,
 * and the stage no longer shows the second man. It showed him for the wrong
 * reason — a seam gesture conscripting an instrument nobody had cast — and the
 * right way to get him back is four voices in `KEHERWA`, not a delivery that
 * guesses.
 */
const SABHA: StageRoom = {
  id: 'sabha',
  architecture: 'sabha',
  names: [
    'The Gandharva Hall', 'Sabhā Room Two', 'The Music Circle',
    'Kalā Mandir', 'The Baithak', 'Academy Hall',
  ],
  width: 10,
  depth: 6.5,
  audience: { rows: 10, density: 0.8, seated: true },
  props: ['carpet', 'riser'],
  eras: {
    /**
     * Hindustani. Ochre, cream and marigold, lit warm and evenly — a recital
     * room in a hall somebody's grandfather endowed, with an arcade across the
     * back of it. Almost no fog: the only genre-wide reason to put smoke in a
     * room is to see beams in it, and there are no beams here because nothing is
     * being pointed at anybody. One follow spot on one soloist is what this
     * room does instead.
     */
    hindustani: {
      palette: {
        boards: '#8f6b3f',
        backdrop: '#3d2a1c',
        curtain: '#6b2320',
        proscenium: '#c9a86a',
        ambient: '#ffd39a',
      },
      props: ['flowers', 'drapes', 'arches'],
      maybe: [['candles', 0.5], ['chandelier', 0.25]],
      fog: 0.08,
    },
    /**
     * Carnatic. White, gold and temple green, and brighter than anything else
     * in this project — a December concert in Madras happens in a hall with the
     * house lights half up and a garlanded portrait at the back, and the whole
     * room is legible at once. `stalls` rather than `tables`: the audience is in
     * rows, has a programme, and is there for the music and nothing else.
     */
    carnatic: {
      palette: {
        boards: '#a88a52',
        backdrop: '#2f3a2c',
        curtain: '#7a1f24',
        proscenium: '#e0cf9a',
        ambient: '#fff0c8',
      },
      props: ['flowers', 'stalls', 'chandelier'],
      maybe: [['drapes', 0.4], ['candles', 0.2]],
      fog: 0.06,
      grow: [0.3, 0.2],
    },
    /**
     * Filmī. The same hall taken over by a studio: saturated, hard-lit, a PA
     * because there are fifty people to balance, and the first fog in the
     * genre. This is the era that is actually an era, and it is dressed like
     * one.
     */
    filmi: {
      palette: {
        boards: '#8a5f3a',
        backdrop: '#2a2140',
        curtain: '#9c1f4a',
        proscenium: '#d9b45e',
        ambient: '#ffc48a',
      },
      props: ['drapes', 'stalls', 'pa-stack', 'chandelier', 'flowers'],
      maybe: [['candles', 0.2]],
      fog: 0.28,
      grow: [0.8, 0.4],
    },
    /**
     * Fusion. The carpet stays and everything else becomes a 1975 concert
     * stage — cables taped across it, monitors facing the band, haze in the
     * beams. The carpet staying is the whole joke and it is a true one: these
     * players sat down on the floor in front of a PA stack and nobody thought
     * it was odd.
     */
    fusion: {
      palette: {
        boards: '#6b5238',
        backdrop: '#232630',
        curtain: '#3a2f4a',
        proscenium: '#8a7a5e',
        ambient: '#e8b887',
      },
      props: ['drapes', 'pa-stack', 'wedges'],
      maybe: [['haze', 0.55], ['projection', 0.3], ['flowers', 0.3]],
      fog: 0.38,
      grow: [0.6, 0.3],
    },
  },
  fallback: {
    palette: {
      boards: '#8f6b3f', backdrop: '#3d2a1c', curtain: '#6b2320',
      proscenium: '#c9a86a', ambient: '#ffd39a',
    },
    props: ['flowers', 'drapes'],
    fog: 0.1,
  },
};

const WARDROBE: Record<string, Wardrobe> = {
  /**
   * Hindustani. Kurtā and churidār, or a sherwani for whoever is fronting it,
   * in cream and ivory with one deep colour among them.
   *
   * `brocade` as the loud fabric is the reason the fabric list exists in the
   * shape it does — it is the only entry that reaches the renderer as
   * *geometry* rather than as a sheen, an accent placket and a hem border, which
   * is precisely what distinguishes a sherwani from a kurtā at ten metres. So
   * the soloist gets a garment with a shape and everybody else gets silk and
   * linen, and the difference reads without anybody being in costume.
   *
   * `sequinChance: 0` in three of these four wardrobes. There is no sequin in
   * this music outside a film studio, and the one wardrobe that has any is the
   * one with a film studio in it.
   */
  hindustani: {
    jackets: ['#f2ead6', '#e8ddc4', '#d8c9a8', '#7a2d24', '#2f3f5c', '#5a4a2a'],
    shirts: ['#ffffff', '#fbf5e6', '#f0e6cf'],
    trousers: ['#fbf5e6', '#e8ddc4', '#3a3226'],
    accents: ['#c85a1e', '#8f1d24', '#b8912f', '#2e6b4a'],
    loud: ['#b8912f', '#8f1d24'],
    hair: ['#0d0d0d', '#1c1410', '#2b1b12', '#4a3020', '#8a7f74', '#cfcac2'],
    hairStyles: [['short', 5], ['long', 3], ['wrap', 3], ['bald', 2], ['updo', 2], ['braids', 2]],
    accessories: [
      ['turban', 0.3], ['beard', 0.3], ['moustache', 0.25], ['glasses', 0.25],
      ['hoops', 0.2], ['chain', 0.15],
    ],
    fabrics: [['silk', 5], ['linen', 4], ['brocade', 2], ['wool', 1]],
    /**
     * Kurtā and churidār, which is `coat` — and the comment above finally gets
     * to mean what it says.
     *
     * It has claimed since it was written that `brocade` is *what distinguishes
     * a sherwani from a kurtā at ten metres*, and that was the best available
     * reading of a wardrobe with one silhouette in it: the fabric's placket and
     * hem border were the only shape anything could have. They are still the
     * difference between the two — but only now that both are the same
     * *garment*, a knee-length skirted coat closing at the centre under a stand
     * collar, with the embroidery on top of it or not. Before this the sentence
     * was describing a band down the front of a lounge suit.
     *
     * `robe` at 3 is the fuller-cut kurtā that reaches the ankle, and `drape` at
     * 2 is the one player in a sari — a tanpura accompanist as often as not, and
     * a hall in which nobody is ever in one is not a hall anybody has been to.
     * `suit` survives at 1: there is always one man on the platform who has come
     * straight from an office.
     */
    garments: [['coat', 6], ['robe', 3], ['drape', 2], ['suit', 1]],
    loudFabric: 'brocade', sequinChance: 0,
    matched: 0.35, uniform: 0.25,
    /**
     * Half. High for a genre with no showmanship in it, and the number is about
     * hierarchy rather than glamour: in a recital there is exactly one soloist
     * and three accompanists, everybody in the hall knows which is which before
     * a note is played, and the accompanists would not dress to compete.
     */
    spotlight: 0.5,
  },
  /**
   * Carnatic. White and gold, and more uniform than the North — a Madras
   * concert has a genuine dress code and everybody on the platform is inside
   * it. Braids and updos carry more weight here for a plain reason: the
   * plaited hair with jasmine strung through it is a silhouette, and `flowers`
   * is a prop rather than something a player can wear.
   */
  carnatic: {
    jackets: ['#fbf7ea', '#f2ecd8', '#e6d9b0', '#6e1f22', '#1f4a3a', '#c9a23f'],
    shirts: ['#ffffff', '#fdf9ee', '#f5efdd'],
    trousers: ['#fdf9ee', '#f2ecd8', '#2b2b28'],
    accents: ['#b8912f', '#8f1d24', '#1f6b4a', '#c85a1e'],
    loud: ['#c9a23f', '#8f1d24'],
    hair: ['#0d0d0d', '#1c1410', '#2b1b12', '#3f2a1c', '#8a7f74', '#d6d1c8'],
    hairStyles: [['braids', 5], ['short', 4], ['updo', 3], ['bald', 2], ['long', 2]],
    accessories: [
      ['hoops', 0.35], ['glasses', 0.3], ['earrings', 0.25], ['beard', 0.2],
      ['moustache', 0.2], ['chain', 0.15],
    ],
    fabrics: [['silk', 7], ['linen', 3], ['brocade', 2]],
    /**
     * The dress code the era comment describes, said in shapes.
     *
     * `drape` leads here and nowhere else in the project. A Madras December
     * platform is the one room in this catalogue where the sari is the *default*
     * rather than the exception, and the garment's own note says why it is worth
     * having as a member at all — it is the only asymmetric cloth in the rig, a
     * band across the torso from one shoulder, and asymmetry is the cheapest
     * strong read there is at the back of a hall.
     *
     * It also pairs with the hair table above rather than fighting it. That
     * table weights `braids` at 5 for the plaited hair with jasmine in it, and a
     * plait falling over a shoulder band is one silhouette rather than two
     * separate good ideas.
     *
     * No `suit`. This is the only wardrobe among the four that refuses it, and
     * the refusal is the dress code: the platform has one, everybody on it is
     * inside it, and a lounge suit is the thing that is not.
     */
    garments: [['drape', 5], ['coat', 4], ['robe', 3]],
    loudFabric: 'silk', sequinChance: 0,
    matched: 0.55, uniform: 0.45, spotlight: 0.45,
  },
  /**
   * Filmī. The studio arrives and the palette goes saturated: turquoise,
   * magenta, gold, and the first satin in the genre. The `spotlight` is the
   * highest here and the `uniform` nearly the lowest, which between them are a
   * fair description of a playback session — one person at the microphone who
   * is the record, and forty players behind them in whatever they came in.
   */
  filmi: {
    jackets: ['#f0e8d6', '#1f7a8c', '#a8236b', '#c9a23f', '#2b2f45', '#8a2b2b'],
    shirts: ['#ffffff', '#fdf3e0', '#ffe9f2', '#dff3ff'],
    trousers: ['#232430', '#3a3a3a', '#f0e8d6'],
    accents: ['#ff5a2b', '#e0246b', '#ffd23f', '#2ea8a0'],
    loud: ['#ffd23f', '#e0246b', '#c0c0c0'],
    hair: ['#0d0d0d', '#1c1410', '#2b1b12', '#4a3020', '#7a6a58', '#d6d1c8'],
    hairStyles: [['updo', 4], ['long', 4], ['short', 4], ['braids', 3], ['bob', 2], ['slick', 2]],
    accessories: [
      ['earrings', 0.4], ['moustache', 0.3], ['glasses', 0.25], ['hoops', 0.2],
      ['sunglasses', 0.15], ['tie', 0.15],
    ],
    fabrics: [['silk', 5], ['satin', 4], ['brocade', 3], ['wool', 2], ['linen', 1]],
    /**
     * A playback session, so all four at once and none of them agreeing.
     *
     * This is the flattest garment table anywhere in the four genres dressed so
     * far, and flat is the accurate shape for it. The era comment above says a
     * studio floor is one person at a microphone and forty players behind them
     * in whatever they came in — so the suit the string section wears, the coat
     * the shehnai player wears, the sari the singer wears and the gown the
     * playback star wears are all on the same stage on the same afternoon,
     * which no other era in this project can say.
     */
    garments: [['suit', 4], ['drape', 3], ['coat', 3], ['gown', 2]],
    loudFabric: 'sequin', sequinChance: 0.3,
    matched: 0.4, uniform: 0.35, spotlight: 0.85,
  },
  /**
   * Fusion. 1975, so: denim below, silk above, hair past the shoulders, and the
   * lowest `uniform` in the genre. These were bands assembled out of two
   * traditions and a jazz rhythm section, and looking like one band was never
   * the idea.
   */
  fusion: {
    jackets: ['#3a4a5c', '#6b4a2a', '#7a2d3a', '#e8ddc4', '#4a4a3a', '#8a6b2f'],
    shirts: ['#f0e8d6', '#d8c9a8', '#c85a1e', '#2e6b6b'],
    trousers: ['#2f3a4a', '#3a3226', '#4a4a4a'],
    accents: ['#c85a1e', '#2ea8a0', '#b8912f', '#8a3f6b'],
    loud: ['#c85a1e', '#8a3f6b'],
    hair: ['#0d0d0d', '#1c1410', '#2b1b12', '#4a3020', '#6b5a3f', '#cfcac2'],
    hairStyles: [['long', 5], ['mane', 3], ['curls', 3], ['short', 3], ['wrap', 2], ['bald', 1]],
    accessories: [
      ['beard', 0.4], ['chain', 0.3], ['sunglasses', 0.25], ['hoops', 0.25],
      ['moustache', 0.2], ['glasses', 0.2],
    ],
    fabrics: [['silk', 4], ['denim', 4], ['corduroy', 2], ['velvet', 2], ['linen', 2]],
    /**
     * *Denim below, silk above*, which the fabric table already said and which
     * this makes visible: `shirtsleeves` is the jazz rhythm section, `coat` is
     * the two people who came from the other tradition, and neither is dressed
     * for the other's gig.
     *
     * `uniform: 0.1` says the colours do not match. This says the shapes do not
     * either, and the second claim is the one that survives a photograph in
     * black and white — which is what a stage at three metres and one par can
     * effectively is.
     */
    garments: [['shirtsleeves', 4], ['suit', 3], ['coat', 3], ['drape', 2]],
    loudFabric: 'velvet', sequinChance: 0,
    matched: 0.2, uniform: 0.1, spotlight: 0.4,
  },
};

/**
 * A concert programme.
 *
 * Three traps here rather than the usual one, and all three are about who is
 * writing. **Mysticism** is the first and worst: this music attracts copy about
 * cosmic vibration and eternal truth, none of which any working musician has
 * ever said about a Tuesday evening's work. **Exoticism** is the second — a
 * line that finds the room itself remarkable is a line written by a visitor.
 * And **reverence** is the third, which is jazz's trap too: the register that
 * calls everything profound.
 *
 * So these are written from inside: the jokes are about length, about the
 * tuning taking a while, about the front row counting along, about the drummer
 * getting the last item. All things a rasika would say, none of them things a
 * brochure would.
 */
const BLURBS: Blurb[] = [
  { text: 'the long one. it is worth it', styles: ['alap', 'vilambit'], slot: 'open' },
  { text: 'nothing has happened yet, and that is the piece', styles: ['alap'], moods: ['shanta'] },
  { text: 'four notes so far, and no hurry about the fifth', styles: ['alap', 'alapana'] },
  { text: 'a pulse arrives, from nowhere in particular', styles: ['jor', 'tanam'] },
  { text: 'the tabla comes in, and the evening starts', styles: ['bandish', 'gat'], slot: 'open' },
  { text: 'seven beats, and the first one is empty', styles: ['gat', 'fusiongat'] },
  { text: 'as fast as anyone can play it, and then faster', styles: ['jhala'], moods: ['vira'] },
  { text: 'no words. the words would only slow it down', styles: ['tarana', 'tillana'] },
  { text: 'the oldest thing on the programme, and the plainest', styles: ['dhrupad'] },
  { text: 'somebody in this one is not coming back', styles: ['thumri'], moods: ['karuna'] },
  { text: 'a poem, set, and the poem wins', styles: ['ghazal'] },
  { text: 'everyone joins in whether or not they can', styles: ['bhajan'], moods: ['bhakti'] },
  { text: 'the back row claps and the front row gives in', styles: ['qawwali'], moods: ['utsav'] },
  { text: 'learned first and never finished with', styles: ['varnam'] },
  { text: 'the centrepiece, and the reason for the two before it', styles: ['kriti'] },
  { text: 'counting to five is harder than it looks', styles: ['svara', 'padam'] },
  { text: 'the film wanted three minutes. this is three minutes', styles: ['filmi', 'cabaret'] },
  { text: 'a courtesan’s room, built in a studio in bombay', styles: ['mujra'] },
  { text: 'two people who do not agree about anything, agreeing', styles: ['jugalbandi'] },
  { text: 'the tuning takes as long as it takes', slot: 'open' },
  { text: 'the light one at the end, once everyone has relaxed', styles: ['dhun'], slot: 'close' },
  { text: 'the front row is counting. join in or do not' },
  { text: 'played sitting down, which is the whole idea' },
];

/**
 * THE BILL — a recital sheet, and the leader is the point.
 *
 * `programme`, with the dotted leader running from the end of every title to
 * the duration at the right margin. Of the six layouts it is the only one that
 * says *sit down and listen to this* rather than *come to this*, which is the
 * correct thing for a repertoire whose audience is seated, attentive and often
 * counting. Roman numerals in the first two eras for the same reason.
 *
 * The word changes and that is deliberate: an evening of this music is not one
 * kind of event across the four. A **Mehfil** is a gathering in a room, a
 * **Kacheri** is a concert with a fixed order to it, and by the film and fusion
 * eras the sheet is a programme in the ordinary sense and says so.
 *
 * The papers are ivory, sandal, glossy and cold, which is the century in four
 * steps. The two older ones are aged because they are printed on uncoated stock
 * in halls that are not air-conditioned; the film sheet is not, because it came
 * off the same press as the poster outside.
 */
const BILL: Record<string, BillHouse> = {
  hindustani: {
    layout: 'programme', word: 'Mehfil', numeral: 'roman', aged: true,
    stock: '#f2ece0',
    grain: 'repeating-linear-gradient(0deg, rgba(120, 96, 56, .035) 0 1px, transparent 1px 4px)',
    ink: '#2a2118', inkDim: '#7f6f56', hair: '#c4b596', accent: '#7c3b1e',
    face: "'Iowan Old Style', Georgia, 'Times New Roman', serif",
    display: "'Iowan Old Style', Georgia, 'Times New Roman', serif",
    displayWeight: 600,
    venue: { size: '1.1em', track: '.24em', case: 'uppercase' },
    title: { size: '1.4em', track: '.02em', case: 'none' },
    head: { pad: '.8em', rule: '1px solid var(--hair)', align: 'center' },
  },
  carnatic: {
    layout: 'programme', word: 'Kacheri', numeral: 'roman', aged: true,
    stock: '#f4ecdc',
    grain: 'repeating-linear-gradient(90deg, rgba(130, 100, 50, .03) 0 1px, transparent 1px 3px)',
    ink: '#26201a', inkDim: '#82705c', hair: '#c9b899', accent: '#8a1f2e',
    face: "'Iowan Old Style', Georgia, serif",
    display: "Didot, 'Bodoni 72', 'Playfair Display', Georgia, serif",
    displayWeight: 600,
    venue: { size: '1.12em', track: '.3em', case: 'uppercase' },
    title: { size: '1.42em', track: '.03em', case: 'none' },
    head: { pad: '.75em', rule: '1px solid var(--hair)', shadow: '0 4px 0 -3px var(--hair)', align: 'center' },
  },
  filmi: {
    layout: 'programme', word: 'Programme', numeral: 'arabic',
    stock: '#f7f1e6',
    grain: 'linear-gradient(162deg, rgba(255, 250, 236, .95), rgba(232, 206, 160, .5))',
    ink: '#2a2015', inkDim: '#8a755a', hair: '#d6c3a4', accent: '#c2761a',
    face: "'Avenir Next', Avenir, ui-sans-serif, sans-serif",
    display: "'Century Gothic', Futura, 'Avenir Next', ui-sans-serif, sans-serif",
    displayWeight: 700,
    venue: { size: '1.08em', track: '.18em', case: 'uppercase' },
    title: { size: '1.46em', track: '.01em', case: 'uppercase' },
    head: { pad: '.7em', rule: '.3em solid var(--accent)' },
  },
  fusion: {
    layout: 'programme', word: 'Programme', numeral: 'arabic',
    stock: '#eef0ef',
    ink: '#1d2422', inkDim: '#77827e', hair: '#ccd4d1', accent: '#2e7a70',
    face: "ui-sans-serif, 'Helvetica Neue', Arial, sans-serif",
    display: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    displayWeight: 400,
    venue: { size: '1em', track: '.22em', case: 'lowercase' },
    title: { size: '1.4em', track: '0', case: 'none' },
    head: { pad: '.85em' },
  },
};

export const STAGING: Staging = {
  room: SABHA,
  wardrobe: WARDROBE,
  bill: BILL,
  /**
   * Hindustani, when handed an era this genre has no clothes for. The North
   * Indian recital is the picture the whole thing is of outside India, and it is
   * also the smallest ensemble here — four people, two drones — which makes it
   * the safest thing to dress an unknown decade as.
   */
  defaultEra: 'hindustani',
  blurbs: BLURBS,
  /**
   * A shade over half. Below synth, well above ambient, and a long way under
   * jazz.
   *
   * Nobody stands up, nobody dances, and the players are cross-legged on a
   * carpet — so the whole vocabulary of body that a dance band or a swing group
   * has is unavailable, and a number near the top would be a lie. It is not
   * near the bottom either, and the reason is specific: a khyāl singer traces
   * every phrase in the air with one hand and a tabla player's hands are the
   * fastest thing in the room, so there is more visible motion here than in any
   * genre where somebody is merely holding an instrument still. The half that
   * is missing is the half below the waist.
   */
  body: 0.55,
};
