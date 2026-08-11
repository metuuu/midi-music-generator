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
 * mechanical reason rather than a scenic one: `cast.ts` stands a *kit* drummer
 * 0.4 m up whether or not the room has a platform, so a `riser` drawn from
 * `maybe` would leave one floating in every number that drafted a kit and lost
 * the coin toss. That argument is about the *draw* being independent of the
 * cast, and nothing has happened to it.
 *
 * **What used to be written underneath it has gone, and it was the half doing
 * the arguing.** This note said the platform was up in every number because
 * every number staged a kit: that `index.ts` declares a genre-wide transition
 * palette, and `applyShot` wrote its figure as `bd`, `sd` and a `cr` on the
 * landing, so `drumStations` found kit voices in a taqsim as readily as in a
 * shaabi number. That was true when it was written. It is not true now — the
 * function is **`playShot`**, renamed by the wave that fixed it and findable
 * under no other name, and it and the whole fill vocabulary read a
 * `SeamOrchestration` off the events through the same `drumStations` split
 * casting uses, six of the seven fill shapes generalise, and the seventh,
 * `cymbal`, is re-aimed onto `lead-in` rather than mimed on a skin, because a
 * skin does not ring. The old name is kept one line up because that sentence is
 * about what the code *did*, and `generate/transition.ts` quotes it under the
 * same name for the same reason. See `docs/engine-gaps.md` §2.1 and §6.
 *
 * So the frequency claim is now false by a wide margin, and the measurement is
 * worth keeping because it is a better description of this band than the
 * sentence it replaces. **Two of the twenty-one styles own a kit voice at all**,
 * and in both it is a single `bd`: `saidi`'s tabl and `zaffa`'s, which that
 * table is at pains to say is a shoulder-slung drum beaten with a stick by a
 * different person walking. Over 1260 songs — every style at sixty seeds — 119
 * come out with a kit in them and **every one of the 119 is a saidi or a
 * zaffa**; the eighteen hand tables in between wrote 0 kit strokes and 0 stray
 * `oh` between them, and `taqsim` writes no drums at all. Cast, and asked who is
 * standing 0.4 m up: **52 numbers out of 840**, 26 of 40 in each of those two
 * styles, the fourteen missing from each being the ones whose drums are a
 * machine.
 *
 * The platform therefore stays on the room and stands empty in fifteen numbers
 * out of sixteen, which is not a waste but the thing `showRiser` exists to do —
 * it raises the dais when somebody is on it and takes it away when nobody is,
 * per number, so the cost of declaring it always is one prop that is usually
 * hidden and never one that is usually wrong.
 *
 * **The darbuka player is not on it**, and this note used to imply otherwise by
 * calling them "the percussion". `handdrum` declares `lap`, this genre is in
 * `FLOOR_SEATED`, and `postureFor` seats them on the carpet at riser 0, off to
 * one side. What used to follow — *nearly every number here has both* — went
 * with the paragraph above it. The ordinary number in this genre is a pair of
 * hands on a carpet and nobody on the platform at all; a kit beside them is
 * `saidi` and `zaffa` and nothing else. That is a better picture of a takht than
 * the one this file used to draw, and it arrived by the engine being fixed
 * rather than by anybody restaging the room.
 *
 * The old note sent the reader to `transitions` in `indian/index.ts` for the
 * question of whether a trap kit belongs in a takht at all, and that
 * cross-reference has stopped carrying weight from both ends. This genre does
 * not refuse the genre-wide draw and has not since the hook bug was fixed —
 * `index.ts` declares `[['fill', 7], ['shot', 3], ['break', 2]]` — and the
 * refusal it pointed at was made on the grounds that the delivery would name
 * three instruments the music does not have, which is precisely what §2.1
 * closed. The question the sentence was really asking is answered in this folder
 * now: five styles in `styles.ts` state their own seam vocabulary, and the two
 * that refuse every gesture refuse it for reasons about the *form* rather than
 * about which drum would be delivering it.
 *
 * 11 by 7 metres, which is generous for a takht and necessary for a firqa. The
 * boards have to hold the largest band the genre can produce rather than the
 * characteristic one; see `concert/venue.ts`, which also records that nothing
 * below 8.5 m wide has been tried.
 */
const COURTYARD: StageRoom = {
  id: 'courtyard',
  /**
   * Not a theatre, and now the type can say so.
   *
   * Everything above was written when a room could describe itself in two
   * dimensions, five colours and a list of props, and the walled court it
   * describes was being put up as a proscenium arch with a velvet curtain in
   * front of it — the `arches` prop standing behind a band who were framed by a
   * gilt opening, under a fly tower, in a room with a boarded floor. Three of
   * the four eras below name `open-air`, which took the side walls away and put
   * a sky behind, and left the arch and the fly tower standing in the night.
   *
   * `courtyard` is the building: flags underfoot, an arcade on three walls, a
   * low dais instead of a stage, a lamp wire instead of a fly bar, no cloth. The
   * four era dressings are unchanged and none of them had to move — `open-air`
   * still means the sky is open, and the era that omits it still gets the roof
   * its own comment says the 1960s put on. See `web/concert/rooms/courtyard.ts`.
   */
  architecture: 'courtyard',
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
      maybe: [['mirror-ball', 0.45], ['flowers', 0.3]],
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
    /**
     * The dark suit, and the man beside him in a kaftan.
     *
     * The complaint that produced `Garment` was about this genre and it was
     * about this era first: a takht was five men on a carpet and every one of
     * them was a lounge suit in a different grey, because a lounge suit was the
     * only shape the renderer could make. The truth is a *mixture* and the
     * mixture is the interesting part — Cairo in the thirties is a European suit
     * and a tarboosh on the same man, sitting next to somebody in a galabeya who
     * did not go in for any of that. So `suit` still leads, because the
     * photograph really is mostly suits and the comment above is not being
     * overruled; `robe` is close enough behind that a five-piece will usually
     * have one or two, which is the whole point.
     *
     * `coat` at 1 is the qanun player's stiff high-collared coat, and it is
     * there for a second reason: `brocade` is in the fabric table above, and its
     * placket and hem border are drawn *on* whatever shape is underneath. A
     * band down the front of a knee-length coat is a different object from the
     * same band down a jacket, and this is the era that had both.
     */
    garments: [['suit', 6], ['robe', 4], ['coat', 1]],
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
    /**
     * Tails, because the comment above says *black tie for forty people* and
     * now the wardrobe can say it too rather than approximating it in charcoal.
     *
     * A broadcast firqa in 1968 is the one band in this project that is dressed
     * exactly like the one in `classical:romantic`, from a completely different
     * direction: an orchestra copying an orchestra. `tails` at 6 against `suit`
     * at 3 is that, with the third of the room who never got issued one.
     *
     * `gown` at 2 rather than 1 is a decision worth defending, because the era
     * comment says *one* beaded gown. There is no way to say "the lead wears
     * this" — `Wardrobe.garments` refuses to grow a second spotlight mechanism
     * beside `loudFabric`, and the note on the field argues why — so the choice
     * is between a table that never produces a gown at all and one that
     * occasionally produces two. In a forty-piece firqa with women in the string
     * section, two is not the error; nought is.
     */
    garments: [['tails', 6], ['suit', 3], ['gown', 2]],
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
    /**
     * Nobody dressed this band, so nothing here agrees with anything.
     *
     * `uniform: 0.3` above says the colours do not match; this says the *shapes*
     * do not either, which is the harder and better version of the same claim. A
     * shaabi group at a wedding in 1988 is a keyboard player in a shirt with the
     * sleeves rolled, a percussionist in a galabeya because he came from
     * somewhere else that evening, and a singer in a satin jacket — three
     * silhouettes in a four-piece, and the reason a photograph of one is
     * instantly not a photograph of the orchestra above it.
     *
     * `shirtsleeves` is the era arriving. It is the only wardrobe in this genre
     * that draws it, and its braces are the one object in the set that says the
     * player is *working* rather than performing, which is the same job `towel`
     * does in the accessory table two genres over.
     */
    garments: [['suit', 5], ['shirtsleeves', 4], ['robe', 3]],
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
    /**
     * Television, so mostly the international suit — and one thobe, because a
     * satellite broadcast from the Gulf is not a broadcast from Cairo.
     *
     * `suit` dominates for the same reason the palette above is near-black: the
     * band is dressed down so the camera has one place to go. The two that are
     * not a suit are the two the camera goes to. `robe` here is a *pressed* one
     * rather than the takht's working galabeya — same silhouette, and the eras
     * either side of it in this file are what tell them apart, which is exactly
     * the load a silhouette is meant to carry and no more.
     */
    garments: [['suit', 6], ['robe', 2], ['gown', 2]],
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
  blurbs: BLURBS,
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
