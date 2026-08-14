/**
 * What ambient stages: a black box with more fog than person in it.
 *
 * The room, the clothes and the programme copy for this genre, moved out of
 * `concert/venue.ts`, `concert/cast.ts` and `concert/showbill.ts` with every
 * value unchanged. `Staging` in `genre/types.ts` argues the ownership; this file
 * is the strongest evidence for it. Every one of these tables is the *negative*
 * of the other genres' — no architecture, no uniform, no foreground, and a
 * programme that refuses to be reverent about any of it — and a negative is
 * exactly what a genre has to be able to state for itself. Kept in a shared
 * registry, "nobody in this band is trying to be seen" reads as a gap in the
 * table rather than as the point.
 */

import type { BillHouse, Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE BLACK BOX — ambient.
 *
 * No architecture, no proscenium worth the name, and more fog than person.
 * There is nothing to look at except a projection and whatever the haze is
 * doing, which is the point: a genre that refuses to have a foreground gets a
 * room that refuses to have a focus.
 *
 * **The audience stands.** It sat on folding chairs for a while, and the chairs
 * were the wrong idea twice over. An ambient bill in a unit off an industrial
 * estate is a warehouse night, not a recital — the seated version of this room
 * is a concert hall that has been painted black. And a seated house is 1.26 m
 * tall: from the camera's side of the boards, where the crowd is the whole
 * near foreground, that is a field of low humps in the dark rather than a room
 * with people in it. Standing costs nothing — `web/concert/stage-audience.ts`
 * builds either kind from this one flag, and derives the row spacing, the rake
 * and the depth of the house from it — and it puts person-shaped silhouettes
 * between the lens and the band, which is what says the room is full.
 *
 * The cellar keeps its chairs, and that is not an inconsistency: it has tables
 * and candles on them, and a jazz club where nobody is sitting at the tables is
 * a jazz club with the furniture in the way.
 *
 * The palette is nearly monochrome on purpose. Every other room here spends its
 * colour budget on the set; this one spends all of it on the light, because in
 * a black box the light *is* the set.
 */
const BLACK_BOX: StageRoom = {
  id: 'black-box',
  names: ['Studio B', 'Hall Four', 'The Annexe', 'Unit 9', 'The Long Room', 'Room 000'],
  width: 9.6, depth: 6.4,
  audience: { rows: 8, density: 0.46, seated: false },
  eras: {
    // 1970s–80s tape. Warm even in the dark — sepia, tungsten, a domestic lamp
    // somebody brought from home. This is the one ambient era with a *colour*.
    tape: {
      palette: {
        boards: '#2a2724',
        backdrop: '#191b1e',
        curtain: '#241f1b',
        proscenium: '#2c2f33',
        ambient: '#c9a37a',
      },
      props: [
        'black-box', 'drapes', 'projection',
        'flight-case', 'rug',
      ],
      maybe: [['pa-stack', 0.5]],
      fog: 0.68,
    },
    // 1990s sampler. Cold cyan, hard beams, and the most fog of anywhere in the
    // project. This is the Fallout end of the genre — the era whose own effects
    // table filters the drum kit down to 1.4 kHz so the beat arrives through a
    // wall, and the room should agree with that.
    sampler: {
      palette: {
        boards: '#232528',
        backdrop: '#14171b',
        curtain: '#1a1f26',
        proscenium: '#2a2f36',
        ambient: '#7fa8c8',
      },
      props: [
        'black-box', 'projection', 'flight-case',
        'pa-stack', 'wedges', 'haze',
      ],
      maybe: [['drapes', 0.35]],
      fog: 0.85,
    },
    // 2000s hybrid. Grey, even, and clean — flat LED light on a room with
    // nothing in it. The era where the sources became real instruments again,
    // so the room stops pretending to be a machine.
    hybrid: {
      palette: {
        boards: '#26262a',
        backdrop: '#17181b',
        curtain: '#1e2024',
        proscenium: '#31333a',
        ambient: '#9aa6b2',
      },
      props: [
        'black-box', 'drapes', 'projection', 'rug',
      ],
      maybe: [['flight-case', 0.4], ['pa-stack', 0.3]],
      fog: 0.72,
      grow: [0.3, 0.2],
    },
  },
  fallback: {
    palette: {
      boards: '#26262a', backdrop: '#17181b', curtain: '#1e2024',
      proscenium: '#31333a', ambient: '#9aa6b2',
    },
    props: ['black-box', 'drapes', 'projection'],
    fog: 0.7,
  },
};

const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1970s–80s tape. Corduroy, knitwear and an anorak, in the colours of a
   * decade that had not invented saturation. Hoods up, nobody matching, and the
   * one place in this project where the *absence* of stage clothes is the
   * costume: these are people who came to operate equipment.
   */
  tape: {
    jackets: ['#5a4a35', '#4a5240', '#6b5b4a', '#3d4450', '#7a6a58'],
    shirts: ['#8a7a63', '#6f7d6a', '#9a8f7a', '#a89b84'],
    trousers: ['#3a3a3a', '#4b4438', '#55503f'],
    accents: ['#b4653a', '#5f7d8c', '#8a7a2b'],
    loud: ['#b4653a'],
    hair: ['#22160f', '#3a2416', '#5c4025', '#8d6a3f', '#a83e2b', '#cfcac2'],
    hairStyles: [['hood', 4], ['long', 4], ['short', 3], ['curls', 2], ['bald', 1]],
    accessories: [['beard', 0.4], ['glasses', 0.35], ['scarf', 0.3], ['headphones', 0.3]],
    // Nothing that catches light, in any ambient era. Half the point of that
    // room is that nobody in it is trying to be seen.
    fabrics: [['knit', 5], ['corduroy', 4], ['nylon', 3], ['denim', 2], ['wool', 1]],
    /**
     * The anorak, and it turns out the union already had one.
     *
     * `coat` was put in `Garment` for a sherwani and a 1720 court coat, and its
     * own note describes it as *a skirted column to the knee over trousers,
     * closing at the centre with a standing collar instead of lapels*. Read that
     * sentence with a cagoule in mind instead of a court and it does not change
     * a word. The stand collar is the half that carries it: the one thing an
     * anorak categorically does not have is a lapel, and every figure in this
     * genre has been wearing two of them since the renderer was written.
     *
     * `waistcoat` is the quilted body warmer over a jumper, which is the same
     * observation from the other end — the shell and the sleeves go to the
     * *shirt* colour, so what the eye gets is knitwear with a sleeveless thing
     * over it rather than a jacket over a shirt. That is the single most
     * accurate sentence anybody has written about how these people dressed.
     *
     * `suit` stays at 3 because somebody in every one of these rooms is a
     * session player who was booked and turned up in a jacket, and because a
     * table with no lounge suit in it would be making a claim about the tape era
     * that the era comment above is careful not to make. Nobody here is *trying*
     * to look like nobody; they are people who came to operate equipment, and
     * one of them owns a blazer.
     */
    garments: [['coat', 4], ['waistcoat', 3], ['suit', 3]],
    loudFabric: 'knit', sequinChance: 0,
    matched: 0.2, uniform: 0.08, spotlight: 0.05,
  },
  /**
   * 1990s sampler. Black and grey cagoules, hoods, headphones. The era whose
   * own effects table filters the drum kit to 1.4 kHz so the beat arrives
   * through a wall; the people should be about as visible as the beat is.
   */
  sampler: {
    jackets: ['#1f2124', '#2b2f33', '#3a3f45', '#26302b', '#2e2a33'],
    shirts: ['#3a3f45', '#4a4f55', '#2b2f33'],
    trousers: ['#1a1c1f', '#2b2f33', '#33383d'],
    accents: ['#4a9ec9', '#7a8f3c', '#b0562b'],
    loud: ['#4a9ec9'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#cfcac2'],
    hairStyles: [['hood', 6], ['short', 4], ['long', 2], ['bald', 2]],
    accessories: [['headphones', 0.45], ['glasses', 0.3], ['beard', 0.3], ['scarf', 0.15]],
    fabrics: [['nylon', 6], ['knit', 4], ['denim', 2], ['wool', 1]],
    /**
     * *Black and grey cagoules*, says the era comment, and this is that.
     *
     * Six to two to two. The steepest weighting in the genre, because this is
     * the era where the cagoule is not one thing somebody happens to be wearing
     * but the whole dress code — the hair table already agrees, with `hood` at 6
     * and nothing else above 4, and a hood and a knee-length nylon column are
     * one garment that the rig happens to draw in two files.
     *
     * The row this produces on the bench is the point: five figures the same
     * shape and nearly the same value, which is a wardrobe with `uniform: 0.12`
     * in it looking, from twenty metres, more uniform than the swing band. That
     * is not a contradiction — `uniform` is about whether the *colours* were
     * agreed, and nobody agreed anything here. They all just bought the same
     * coat.
     */
    garments: [['coat', 6], ['waistcoat', 2], ['suit', 2]],
    loudFabric: 'nylon', sequinChance: 0,
    matched: 0.35, uniform: 0.12, spotlight: 0.05,
  },
  /**
   * 2000s hybrid. Greys, knitwear and a scarf — the era where the sources went
   * back to being real strings and real voices, so the people look like players
   * again rather than like operators.
   */
  hybrid: {
    jackets: ['#2c2e33', '#3d4046', '#4a4a4a', '#3a4440', '#55545a'],
    shirts: ['#6a6e74', '#8a8d92', '#4a4d52', '#b3b0a8'],
    trousers: ['#232529', '#33363b', '#42454a'],
    accents: ['#8a6b4a', '#4a7a8a', '#7a5a8a'],
    loud: ['#8a6b4a'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#8d6a3f', '#cfcac2'],
    hairStyles: [['short', 5], ['hood', 3], ['long', 3], ['bald', 2], ['curls', 2]],
    accessories: [['scarf', 0.35], ['glasses', 0.35], ['beard', 0.3], ['headphones', 0.2]],
    fabrics: [['knit', 5], ['wool', 3], ['nylon', 3], ['denim', 1]],
    /**
     * The coat comes off, because the players came back.
     *
     * `suit` retakes the top of the table for the first and only time in this
     * genre, and it is the era comment's own sentence said in shapes: the
     * sources went back to being real strings and real voices, so the room has
     * people in it who were booked to *play* rather than to operate, and a
     * booked player owns a jacket. `coat` falls from 6 to 3 and `waistcoat`
     * holds at 3, which between them are the half of the room that is still the
     * 1993 wardrobe with the hood down.
     *
     * Three entries within one of each other, and that flatness is the accurate
     * shape for the era rather than an absence of opinion. A 2006 hybrid session
     * is a cellist in a jacket, a laptop operator in a cagoule and a producer in
     * a body warmer, all on the same afternoon, and none of them is the odd one
     * out.
     */
    garments: [['suit', 4], ['coat', 3], ['waistcoat', 3]],
    loudFabric: 'knit', sequinChance: 0,
    matched: 0.4, uniform: 0.15, spotlight: 0.08,
  },
};

/**
 * Ambient: a gallery handout.
 *
 * The trap here is reverence — this music attracts writing that is entirely
 * adjectives, and a bill made of adjectives is unreadable. So the lines are
 * flat, slightly deadpan, and factual about things that are not quite facts.
 * The genre is funnier than its press, and a handout is allowed to know that.
 */
const BLURBS: Blurb[] = [
  { text: 'half-remembered, and not by anyone here', styles: ['hauntology'] },
  { text: 'taped off the television in about 1979', styles: ['hauntology'], moods: ['warm'] },
  { text: 'nothing lives here and it is quite beautiful', styles: ['wasteland'] },
  { text: 'cold, and in no hurry to warm up', styles: ['wasteland'], moods: ['bleak'] },
  { text: 'the tape kept running after everyone had left', styles: ['wasteland', 'hauntology'] },
  { text: 'one chord, held until it means something', styles: ['drone'] },
  { text: 'nothing changes, and then it has', styles: ['drone', 'choral'] },
  { text: 'it does not begin so much as become audible', styles: ['drone'], moods: ['weightless'], slot: 'open' },
  { text: 'a sequencer, and a long way to go', styles: ['kosmische'] },
  { text: 'something is running underneath and it will not stop', styles: ['kosmische'], moods: ['pulse'] },
  { text: 'voices, and a room that is much too large', styles: ['choral'] },
  { text: 'for a building that was never built', styles: ['choral'], moods: ['sacred'] },
  { text: 'heard from underneath', styles: ['aquatic'] },
  { text: 'everything arrives slightly late and slightly bent', styles: ['aquatic'], moods: ['submerged'] },
  { text: 'no pulse, and no plans to acquire one', moods: ['weightless'] },
  { text: 'the room is being tuned rather than the band', slot: 'open' },
  { text: 'the long one. sit down', slot: 'close' },
  { text: 'best heard from the back, or from the corridor' },
];

/**
 * THE BILL — a sheet of A5 with the type in the corner of it.
 *
 * All three eras take `handout`, which is the layout that refuses to have a
 * headline: no rules, no capitals, generous space, the duration small and set
 * right. A genre that refuses to have a foreground gets a bill that refuses to
 * have one, and the word is lowercase **programme** because saying it any
 * louder would be the first assertive thing in the room.
 *
 * The papers are the three ways this music has been sold. 1979 is a photocopy
 * of a typewritten sheet on whatever was in the tray, which is why the face is
 * a monospace and why it is the only aged stock of the three — cheap bond foxes
 * and coated paper does not. 1994 is bright, cold and coated, with tiny type in
 * the corner of a large sheet, because by then this was being handed out in
 * galleries. 2004 is almost not there: hairlines, the type as small as it can
 * be and remain a document, and **no numbers at all** — `numeral: 'none'` is
 * the sharpest thing any of these tables says, and it is a statement about the
 * music. A piece that is found already happening does not have a position in a
 * running order.
 */
const BILL: Record<string, BillHouse> = {
  tape: {
    layout: 'handout', word: 'programme', numeral: 'arabic', aged: true,
    stock: '#ded5bf',
    grain: 'repeating-linear-gradient(0deg, rgba(70, 60, 40, .03) 0 2px, transparent 2px 5px)',
    ink: '#3b362c', inkDim: '#857d6c', hair: '#b8ae97', accent: '#6b5f45',
    face: "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace",
    display: "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace",
    displayWeight: 400,
    venue: { size: '.82em', track: '.22em', case: 'uppercase' },
    title: { size: '1.15em', track: '.08em', case: 'uppercase' },
  },
  sampler: {
    layout: 'handout', word: 'programme', numeral: 'arabic',
    stock: '#edf0f1',
    ink: '#1e2329', inkDim: '#79828b', hair: '#ccd3d7', accent: '#4f7d95',
    face: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    display: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    displayWeight: 400,
    venue: { size: '.8em', track: '.16em', case: 'lowercase' },
    title: { size: '1.2em', track: '.01em', case: 'lowercase' },
  },
  hybrid: {
    layout: 'handout', word: 'programme', numeral: 'none',
    stock: '#eceef0',
    grain: 'linear-gradient(180deg, #f2f4f5, #e5e8ea)',
    ink: '#262a2e', inkDim: '#8a9199', hair: '#d6dade', accent: '#7d8b96',
    face: "ui-sans-serif, 'Helvetica Neue', Arial, sans-serif",
    display: "ui-sans-serif, 'Helvetica Neue', Arial, sans-serif",
    displayWeight: 300,
    venue: { size: '.76em', track: '.3em', case: 'lowercase' },
    title: { size: '1.1em', track: '.06em', case: 'lowercase' },
  },
};

export const STAGING: Staging = {
  room: BLACK_BOX,
  wardrobe: WARDROBE,
  bill: BILL,
  /**
   * Tape. The warm, tungsten, domestic end of the genre is the one it is
   * remembered as; the sampler era is where it went, not where it lives.
   */
  defaultEra: 'tape',
  blurbs: BLURBS,
  /**
   * Less than half a dance band, and the number is the whole staging argument
   * of the genre in one field. Half this act is behind a table not making eye
   * contact, and a body swaying to a piece with no pulse is a lie about the
   * music. It is not zero: the curve still has to *shape*, and a stage of people
   * holding perfectly still reads as a dropped frame rather than as stillness.
   */
  body: 0.4,
};
