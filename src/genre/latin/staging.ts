/**
 * What this music stages: a hall with an arcade down the back and the floor
 * already full.
 *
 * The room, the clothes and the programme copy. `Staging` in `genre/types.ts`
 * argues why a genre carries its own rather than the renderer holding a registry
 * of them; the instruction at the top of `iskelma/staging.ts` is the one worth
 * repeating, because none of these comments is legible alone. Read the pavilion,
 * the cellar, the black box and the lawn before this one — several decisions
 * below are made *against* them, and the first is the one that looks like an
 * omission.
 *
 * **This room has no modifier**, where three of the four rooms before it do. A
 * tanssilava is `open-air` because Finland has six weeks of summer; a sound
 * system's lawn is `open-air` because no building would hold the speakers. Both
 * of those are facts about a *building*, and the rule `StageRoom.id` states is
 * that the stage builder gets one model per building and everything a decade
 * changes arrives through the dressing. This genre's building is a hall — a
 * sociedad in 1938, a ballroom in 1953, a club in 1975, a room with a truss over
 * it in 1997 — and it has a roof in all four. Putting `open-air` on the earliest
 * dressing and taking it away later would be changing the architecture per
 * decade, which is exactly what a room is not allowed to do. The courtyard feel
 * of the first era is carried by lanterns, candles and flowers instead, which is
 * what dressing is for.
 */

import type { Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE SALÓN — latin.
 *
 * An arcaded hall with a sprung floor in the middle of it, tables round three
 * sides and a bar along the fourth. `seated: false`, because everybody who is
 * not at a table is dancing and the ones at the tables are waiting their turn —
 * the same fact the pavilion and the lawn both assert, arrived at by a third
 * route.
 *
 * **11.4 metres wide, which is the fourth-widest room in the project**, and the
 * reason is entirely the band.
 *
 * That read *the widest*, and it was wrong on the day it was written rather than
 * later: classical and metal are both 12 and funk is 11.5, and all four rooms
 * landed in the same commit, ten genres in parallel with one author each and no
 * author able to see the other nine. The number is corrected instead of the
 * sentence being deleted because what it is doing is justifying 11.4 against a
 * default, and it still does — 11.4 is the fourth of nineteen, and the three
 * above it hold an orchestra, a metal line-up and a nine-piece funk band. `chooseVenue` runs before the cast exists, so the boards
 * have to hold the largest ensemble the genre can produce — and this genre's
 * middle era is a Palladium orchestra: a full horn section, a piano, a bass, a
 * singer and a percussion bench with three people on it. `cast.ts` puts the
 * drummer 0.4 m up inside a circle over three metres across before anybody else
 * is placed. Nothing below 8.5 has been tried and this needs considerably more
 * than that; the depth is up as well, because a horn line and a percussion bench
 * are two ranks rather than one.
 *
 * `arches` is the genre's own prop rather than any era's. An arcade across the
 * back wall is the single object that says *this room* rather than *a room with a
 * band in it* — a Havana sociedad, a Cartagena casona, a Veracruz portal and a
 * San Juan casino all have one, and it is there whether the year is 1938 or
 * 1997. `dance-floor` and `riser` join it for the two reasons the neighbouring
 * files give: the floor is the reason everyone came, and a probabilistic riser
 * would leave the drummer floating half the time.
 */
const SALON: StageRoom = {
  id: 'salon',
  architecture: 'salon',
  names: [
    'Salón Tropical', 'El Patio', 'La Terraza', 'Club Casino',
    'Salón Colonial', 'La Caseta',
  ],
  width: 11.4, depth: 7,
  audience: { rows: 9, density: 0.88, seated: false },
  props: ['arches', 'dance-floor', 'riser'],
  eras: {
    /**
     * 1938. A sociedad with the shutters open: whitewash, terracotta, tungsten,
     * and paper lanterns strung between the arches. Warm on every surface,
     * because the only light in the room is a filament and a candle on each
     * table, and the fog is almost nothing — this is a well-aired hall rather
     * than a cellar.
     */
    conjunto: {
      palette: {
        boards: '#c9a06a',
        backdrop: '#2a2018',
        curtain: '#8a3020',
        proscenium: '#efe4cc',
        ambient: '#ffd9a0',
      },
      props: ['paper-lanterns', 'tables', 'candles', 'flowers', 'bar'],
      maybe: [['fairy-lights', 0.45], ['railing', 0.4]],
      fog: 0.1,
    },
    /**
     * 1953. The ballroom proper, and the one era here with any grandeur in it.
     * A chandelier, a mirror ball under it, a rail round the floor and a bar
     * doing serious business. The palette goes cooler at the top and keeps the
     * boards warm, which is what a room lit by a crystal fixture over a wooden
     * floor actually looks like, and the stage grows because the band did.
     */
    orquesta: {
      palette: {
        boards: '#b98a52',
        backdrop: '#1b2436',
        curtain: '#7a1f3a',
        proscenium: '#e6d8b4',
        ambient: '#ffe0b0',
      },
      props: ['chandelier', 'mirror-ball', 'tables', 'bar', 'railing', 'wedges'],
      maybe: [['bunting', 0.3], ['flowers', 0.35]],
      fog: 0.16,
      grow: [0.5, 0.3],
    },
    /**
     * 1975. The club: neon over the bar, past bills pasted up the wall, a PA
     * facing the house and the band's own amplifiers behind them. Darker than
     * either era above it and the first with any real smoke in the air —
     * `fog: 0.34` without a `haze` prop, for the reason the lawn gives about its
     * own: what is in the air is several hundred people and a Tuesday, not a
     * machine.
     */
    salsa: {
      palette: {
        boards: '#8f6a42',
        backdrop: '#141a24',
        curtain: '#6b1f2e',
        proscenium: '#b09468',
        ambient: '#ffc890',
      },
      props: ['neon', 'tables', 'bar', 'posters', 'pa-stack', 'backline', 'wedges'],
      maybe: [['mirror-ball', 0.4], ['railing', 0.35], ['flight-case', 0.3]],
      fog: 0.34,
      grow: [0.3, 0.2],
    },
    /**
     * 1997. A truss over the boards, a screen behind them and the arcade still
     * there underneath it all, which is the point — this is the same hall with a
     * production company in it. Cold at the top, warm on the floor, and the
     * largest stage in the project once the growth is applied.
     */
    moderno: {
      palette: {
        boards: '#7a6248',
        backdrop: '#0f1520',
        curtain: '#5a1f4a',
        proscenium: '#8f9aa8',
        ambient: '#a8d8ff',
      },
      props: ['truss', 'pa-stack', 'neon', 'tables', 'bar', 'backline', 'wedges', 'screen'],
      maybe: [['mirror-ball', 0.3], ['flight-case', 0.45], ['crowd-barrier', 0.4]],
      fog: 0.3,
      grow: [0.7, 0.4],
    },
  },
  fallback: {
    palette: {
      boards: '#b98a52', backdrop: '#1b2436', curtain: '#7a1f3a',
      proscenium: '#d8c49c', ambient: '#ffd29a',
    },
    props: ['tables', 'bar', 'mirror-ball', 'paper-lanterns'],
    fog: 0.2,
  },
};

const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1938. Linen, and the whole wardrobe is about the heat.
   *
   * `linen` at the head of the fabric table is the one decision here that is not
   * a taste — it is matte, pale and crisp, it throws light back rather than
   * eating it, and it is what people wore in a hall with no air conditioning in
   * it. A wool suit is present because the bandleader is wearing one and is
   * suffering.
   *
   * `uniform: 0.7` — a conjunto matched, but not with a big band's discipline:
   * everybody in white or cream, and the cut is whoever's tailor. The straw hat
   * is the one loose thread and it is the only hat weighted anywhere in this
   * file, because `EXCLUSIVE` in `cast.ts` allows one per player and a second
   * would buy nothing.
   */
  conjunto: {
    jackets: ['#f2ece0', '#e6ddc8', '#d8cfb4', '#c9bfa4', '#2b2b30', '#7a6a52'],
    shirts: ['#ffffff', '#fdf8ec', '#f0e8d8'],
    trousers: ['#f2ece0', '#e6ddc8', '#2b2b30', '#4a4238'],
    accents: ['#a8241f', '#1f6b52', '#c08a2b', '#2f4a8a'],
    loud: ['#ffffff', '#c08a2b'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018'],
    hairStyles: [['slick', 6], ['short', 5], ['curls', 3], ['updo', 2], ['bald', 1]],
    accessories: [['tie', 0.6], ['flatcap', 0.25], ['moustache', 0.3], ['bowtie', 0.2]],
    fabrics: [['linen', 7], ['wool', 3], ['silk', 2]],
    /**
     * The heat, said a second time and in a different vocabulary.
     *
     * `linen` at 7 above is the wardrobe's first answer to a hall with no air
     * conditioning in it, and its note says so: matte, pale, crisp, and what
     * people actually wore. `shirtsleeves` at 3 is the same fact expressed as a
     * *shape* rather than as a bolt of cloth, and it is the strongest case for
     * that member anywhere in the project. Braces over a white shirt is not a
     * stylisation of a 1938 conjunto; it is the standard photograph of one, and
     * the man in it has hung his jacket on the back of a chair because it is
     * thirty-four degrees.
     *
     * `suit` still leads at 6 because `uniform: 0.7` says everybody is in white
     * or cream and the bandleader is wearing a wool one and suffering — the era
     * comment's own joke, now with somebody in it to be the joke about.
     *
     * `waistcoat` at 1 is the *bajo sexto* player, who has kept the waistcoat
     * and lost the jacket, which is the halfway house between the other two and
     * appears about that often.
     */
    garments: [['suit', 6], ['shirtsleeves', 3], ['waistcoat', 1]],
    loudFabric: 'silk', sequinChance: 0,
    matched: 0.75, uniform: 0.7, spotlight: 0.3,
  },
  /**
   * 1953. The band jacket, and it is the tightest uniform in the project.
   *
   * `uniform: 0.85` and `matched: 0.85` — higher than jazz's swing era and than
   * reggae's ska, because a Palladium orchestra is eighteen people reading parts
   * off stands in matching shawl-collar jackets and the picture only works if it
   * reads as a *block*. Everything interesting is happening in one place, which
   * is why `spotlight` is high too: the singer in front of that block is the one
   * person allowed to be a different colour.
   *
   * `lame` reachable through `loudFabric`, and this is the era for it. One
   * continuous sheet of metal on one person in front of a wall of raw silk is a
   * mambo bandleader in 1953; the whole band in it would be a pantomime, which
   * is the rule the field exists to keep.
   */
  orquesta: {
    jackets: ['#1e2430', '#8a1f2b', '#e8dcc0', '#2f4a3a', '#3a2f52', '#a8842b'],
    shirts: ['#ffffff', '#fdf9ee', '#f4e8d0'],
    trousers: ['#1e2430', '#2b2b2b', '#3a3f4c'],
    accents: ['#d4a72b', '#a8241f', '#1f6b8a', '#e8dcc0'],
    loud: ['#e8c04a', '#c9243c', '#f0e6d0'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018', '#6b4423'],
    hairStyles: [['slick', 7], ['short', 4], ['updo', 3], ['curls', 2], ['bald', 1]],
    accessories: [['bowtie', 0.5], ['tie', 0.4], ['moustache', 0.25], ['earrings', 0.2]],
    fabrics: [['silk', 5], ['wool', 4], ['satin', 3], ['brocade', 2], ['linen', 2]],
    /**
     * The block, and the one person allowed to stand in front of it.
     *
     * Nine to one, and it is the third table in the project at those two numbers
     * — `classical:romantic`, `jazz:swingera`, `reggae:ska`, and now this. Four
     * completely unrelated rooms arriving at the same pair of weights is not a
     * copy-paste; it is what happens every time a wardrobe is issued rather than
     * chosen, and this is the tightest of the four. `uniform: 0.85` and
     * `matched: 0.85` above are the highest in the file for the reason the era
     * comment gives: eighteen people reading parts off stands in matching
     * shawl-collar jackets, and the picture only works if it reads as a block.
     *
     * `gown` at 1 rather than a second suit, because the singer in front of that
     * block is the whole of what `spotlight: 0.5` is for, and a shape says it
     * where a colour cannot — a `lame` jacket on a man in the seventh chair is
     * a bandleader, and the same fabric on a floor-length dress is the person
     * the poster is about.
     */
    garments: [['suit', 9], ['gown', 1]],
    loudFabric: 'lame', sequinChance: 0.3,
    matched: 0.85, uniform: 0.85, spotlight: 0.5,
  },
  /**
   * 1975. Where the band jacket goes.
   *
   * `uniform` falls from 0.85 to 0.3 in twenty years, which is the largest drop
   * in the file and is the visible half of a change that is also in the music:
   * an eighteen-piece reading parts becomes a nine-piece who all know each
   * other, and nobody who has just walked in from the street is wearing what
   * anybody else is wearing. Wide collars, denim, leather, and a chain over an
   * open shirt.
   *
   * The hair is where the decade actually shows. `afro` at the top of the table
   * is the honest number for a Fania band photographed in 1975, and it is a
   * *volume* rather than a texture — half again the width of the head — which is
   * what makes six people legible from the back of a dark room.
   */
  salsa: {
    jackets: ['#2b2f3a', '#7a2b1f', '#c9a05c', '#3f4a2b', '#5a2b52', '#d8d0bc'],
    shirts: ['#f4efe2', '#e8c04a', '#c9243c', '#7ac0d8', '#ffffff'],
    trousers: ['#2b2f3a', '#3a3020', '#4a4438', '#2f3540'],
    accents: ['#e8c04a', '#c9243c', '#1f9a7a', '#e07a2b'],
    loud: ['#e8c04a', '#c9243c'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018', '#6b4423'],
    hairStyles: [['afro', 6], ['long', 4], ['short', 3], ['curls', 3], ['slick', 2], ['bald', 1]],
    accessories: [['chain', 0.5], ['moustache', 0.45], ['sunglasses', 0.3], ['hoops', 0.3], ['beard', 0.2]],
    fabrics: [['satin', 4], ['denim', 3], ['leather', 3], ['linen', 3], ['silk', 2], ['corduroy', 1]],
    /**
     * *Where the band jacket goes*, and the shapes fall apart before the colours
     * do.
     *
     * `uniform` drops 0.85 to 0.3 in twenty years, the largest fall in the file,
     * and the era comment calls that the visible half of an eighteen-piece
     * becoming a nine-piece who all know each other. The garment table is where
     * it stops being a claim about swatches: the suit goes from 9 to 5, which is
     * half the stand no longer in one, and it is the same move `rock:hard` makes
     * in the same three years for the same reason in a different country.
     *
     * `waistcoat` at 3 is *the chain over an open shirt* from the comment above,
     * drawn honestly — the sleeves and the shoulders go to the shirt colour, so
     * the chain has a shirt to lie on rather than a lapel.
     *
     * `shirtsleeves` at 2 is the percussion, and it earns its place on the same
     * argument `conjunto` makes thirty-seven years earlier: three congas in a
     * hot room is work, and this genre is the one place in the catalogue where
     * that member gets to mean the same thing twice.
     */
    garments: [['suit', 5], ['waistcoat', 3], ['shirtsleeves', 2]],
    loudFabric: 'satin', sequinChance: 0.15,
    matched: 0.35, uniform: 0.3, spotlight: 0.45,
  },
  /**
   * 1997. Two bands in one wardrobe, and the numbers are the average of them.
   *
   * A timba band is fourteen people in whatever they own; a salsa romántica act
   * is one person in a very good suit and a rhythm section standing behind them
   * in black. `uniform: 0.35` is not a description of either — it is what you
   * get when both are in the draw, and `spotlight: 0.55`, the highest here, is
   * where the second one shows up. The lead is dressed considerably better than
   * the band, which is the decade's whole proposition.
   */
  moderno: {
    jackets: ['#16161a', '#2b2f4a', '#7a1f4a', '#c9c2b4', '#3a4a3a', '#5a3a1f'],
    shirts: ['#ffffff', '#16161a', '#e8dcc0', '#7ac0d8', '#c9243c'],
    trousers: ['#16161a', '#2b2f3a', '#3f3a2b'],
    accents: ['#e8c04a', '#c9243c', '#2be0c8', '#ff7ab0'],
    loud: ['#f0e6d0', '#e8c04a'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018', '#8a6a3a'],
    hairStyles: [['short', 5], ['slick', 4], ['curls', 3], ['braids', 3], ['bald', 2], ['long', 2], ['updo', 2]],
    accessories: [['chain', 0.4], ['sunglasses', 0.3], ['hoops', 0.3], ['beard', 0.3], ['earrings', 0.2]],
    fabrics: [['silk', 4], ['satin', 3], ['linen', 3], ['leather', 2], ['knit', 2], ['denim', 2]],
    /**
     * Two bands in one wardrobe, and the garment table is the average of them
     * exactly as every other number here is.
     *
     * `suit` at 6 is the salsa romántica act — one person in a very good jacket
     * and a rhythm section behind them in black, which the era comment says is
     * the decade's whole proposition and which `spotlight: 0.55` is already
     * carrying. `gown` at 2 is the other half of that front.
     *
     * `waistcoat` at 2 is the timba band, who are fourteen people in whatever
     * they own, and it is deliberately *not* `shirtsleeves` even though the
     * previous era weights that at 2. The braces are a nineteenth-century object
     * with a specific century attached, and a 1997 Havana horn section is not
     * wearing them; a sleeveless thing over a shirt is what fourteen people in
     * whatever they own actually look like. That distinction is the one this
     * whole vocabulary lives or dies by — two members that both mean *no jacket*
     * and are not interchangeable.
     */
    garments: [['suit', 6], ['gown', 2], ['waistcoat', 2]],
    loudFabric: 'satin', sequinChance: 0.2,
    matched: 0.4, uniform: 0.35, spotlight: 0.55,
  },
};

/**
 * Latin: a card on the table.
 *
 * The house register — affectionate, dry, never a critic's — with the same extra
 * rule reggae's table needed and for the same reason. **No pastiche.** A bill
 * written in an accent the writer does not have is an impression, and an
 * impression would make the whole table read as somebody's joke about the music.
 * The lines are in plain English; what makes them belong is what they are
 * *about* — the empty downbeat, the bell, the length of the montuno, and how
 * long the percussionists have been at it. Spanish words for the music itself
 * are fine, because those are the names of the things.
 *
 * Nothing here explains anything. A line telling the audience where the clave is
 * would be a lecture, and half the room is already stepping it.
 */
const BLURBS: Blurb[] = [
  { text: 'there is no beat one. the bass will explain later', styles: ['son', 'salsadura', 'mambo'] },
  { text: 'two bars, and the band has agreed which way round', styles: ['son', 'guaracha', 'salsadura'] },
  { text: 'the piano player has not looked up since the second chorus', styles: ['son', 'timba', 'salsadura'], moods: ['sabroso'] },
  { text: 'fast, funny, and over before you have parsed it', styles: ['guaracha'], moods: ['carnaval'] },
  { text: 'a song about a hill, sung by somebody who misses it', styles: ['guajira', 'ranchera'], moods: ['campo'] },
  { text: 'somebody is being sung at and it is going quite well', styles: ['bolero', 'bachata'], moods: ['romantico'] },
  { text: 'the last one before the lights, and they know it', styles: ['bolero'], moods: ['romantico'], slot: 'close' },
  { text: 'polite for six minutes, then it stops being polite', styles: ['danzon'] },
  { text: 'the tune is on the beat. that was the entire innovation', styles: ['chachacha'] },
  { text: 'the bell is not optional and it is not quiet', styles: ['mambo', 'salsadura'], moods: ['bravo'] },
  { text: 'three drums, and the smallest one is arguing', styles: ['guaguanco', 'columbia'], moods: ['rumbero'] },
  { text: 'one man at a time, and the drummer is watching his feet', styles: ['columbia'] },
  { text: 'a drum kit and four hands, at once, which took somebody years', styles: ['songo'] },
  { text: 'trombones, and they have not come to be tasteful', styles: ['salsadura'], moods: ['bravo'] },
  { text: 'everybody in this band went to the conservatory. it did not calm them', styles: ['timba'] },
  { text: 'the scraper has not stopped and will not', styles: ['merengue', 'vallenato'] },
  { text: 'three people, an accordion, and a true story', styles: ['vallenato', 'norteno'], moods: ['campo'] },
  { text: 'two chords, and nobody has ever complained', styles: ['cumbia', 'bomba'] },
  { text: 'the big drum is on two. do not fight it', styles: ['samba', 'partidoalto'] },
  { text: 'a wind band at a dead sprint, with umbrellas', styles: ['frevo'], moods: ['carnaval'] },
  { text: 'a tuba where the bass ought to be, and it is winning', styles: ['banda'] },
  { text: 'the floor was full before the band came on', slot: 'open' },
  { text: 'the percussionists will still be here at two', slot: 'close' },
];

export const STAGING: Staging = {
  room: SALON,
  wardrobe: WARDROBE,
  /**
   * The orquesta, when the era is one this genre has no clothes for. It is the
   * decade the word conjures for anybody who is not being careful, and the other
   * three read as the approach to it and the two departures from it.
   */
  defaultEra: 'orquesta',
  blurbs: BLURBS,
  /**
   * The top of the scale, and this genre is where it belongs.
   *
   * Iskelmä's 1.0 is a full dance floor and this is the same claim with more
   * people on the stage making it: `body` multiplies the groove score against the
   * *players*, and there are four of them in the percussion section alone,
   * every one of whom is moving their whole arm on every stroke. A conga player
   * is doing more physical work than anyone else in this project, and a bell
   * player at 200 BPM is doing it for six minutes without stopping.
   */
  body: 1,
};
