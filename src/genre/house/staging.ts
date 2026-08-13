/**
 * What house stages: a room with nobody in the front of it.
 *
 * # The staging fact this genre has to confront
 *
 * Every other genre in this project stages a *performance*. Somebody walks on,
 * plays something, and the arrangement the generator wrote is the thing they are
 * doing with their hands. `cast.ts` is built on that and is right to be: it puts a
 * player behind every track, gives them an instrument, a station and a posture,
 * and where the track is a machine it stages **the machine with somebody minding
 * it** — which is exactly correct for a Berlin-school set, a live techno PA and a
 * 1981 vocoder band.
 *
 * It is not what this is. In this repertoire the record was made by one person
 * over three weeks in a bedroom and is being *played* by a second person who did
 * not make it, standing at a table at the side of a room, largely in the dark,
 * facing away from the thing everybody is looking at — **which is each other**.
 * The show is the floor. The performer is furniture.
 *
 * There is no way to say that. `Staging` can name a room, dress it per era, put
 * clothes on people and print a programme; it cannot say that the person is not
 * the subject, cannot put them at the side rather than the centre, and cannot say
 * the audience is lit. Ambient hit the neighbouring problem and solved it by
 * *removing* the foreground — its own file says "a genre that refuses to have a
 * foreground gets a room that refuses to have a focus", and the black box is
 * built out of fog and a projection so that there is nothing to look at. That is
 * a real solution to a different problem: ambient has nothing worth looking at,
 * and this has something worth looking at that is *behind the camera*.
 *
 * So the answer taken here is the honest partial one, and it is stated rather
 * than hidden. **The stage is dressed as a working deck and the room is dressed
 * as the event.** The audience is the densest in the project at 0.85 and it
 * stands; the fog is the second-heaviest after synth's; the stage carries a PA
 * stack, cable runs, flight cases and a riser and almost nothing else, because on
 * these nights the boards genuinely held a table, two turntables and a road case
 * with a lid up. What cannot be said is in `index.ts` and repeated in `body`
 * below, which is where the gap shows up as a number.
 *
 * # Why `shed` and not one of the other ten
 *
 * `shed` is described in `concert/types.ts` as a portal-framed industrial hall —
 * hard walls, a low deck, visible structure — and it is the only room in the
 * catalogue that is a *building somebody else built for another purpose*. That is
 * the genre in one sentence. Four of the eras below are a factory unit, a
 * hangar, a converted bus garage and a basement, and all four are the same
 * argument: this music was played in rooms that were cheap because nobody wanted
 * them for anything.
 *
 * The three near misses, and each was rejected for a reason about the music:
 *
 * **The black box** was tempting for the same reason it tempted synth, and it is
 * wrong for the opposite reason to synth's. Its own header says it refuses to have
 * a focus, which is right; but a black box is a *purpose-built* neutral room — an
 * arts venue, painted — and the whole point of a warehouse is that the paint is
 * whatever was there when the last tenant left. Neutral by design and neutral by
 * neglect look different at ten metres, and the second one is this.
 *
 * **The dancehall** is hip-hop's club and is a wide low timber hall with a
 * bandstand in it. A bandstand is a place for a band, which is the object this
 * genre does not have.
 *
 * **The circuit** — a big dark touring room with a high deck and steel overhead —
 * is very nearly right for the `rave` and `superclub` eras and completely wrong
 * for the other two. A high deck raises the performer above the crowd, which is
 * the one spatial claim this music spent twenty years refusing to make. `shed`'s
 * low deck is the whole reason it is the room.
 *
 * **No new room was written**, and if one were wanted it would not be any of
 * these: it would be a room with a **booth** — a boxed-in table at the side of the
 * floor, below head height, facing across rather than out. That is a different
 * building's geometry rather than different dressing, so it is a room file rather
 * than a prop, and it is named here so that the next person to read this knows
 * what was missing rather than inferring that the shed was a happy fit.
 */

import type { Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE WAREHOUSE — house.
 *
 * Wide, shallow and low. The dimensions are the argument: at 11 m across and 5 m
 * deep this is the widest and second-shallowest stage in the project, because
 * what is on it is a table, a PA and whoever is standing near them, and depth
 * would be depth of nothing. Every other room here is sized for a band standing
 * in rows.
 *
 * **The audience is the densest in the project at 0.85, and it stands.**
 * `web/concert/stage-audience.ts` builds a seated house at 1.26 m, which from the
 * camera's side of the boards is a field of low humps; that is wrong everywhere
 * and it would be perverse here, where the crowd is not the audience for the show,
 * it *is* the show. Ten rows at 0.85 is the closest this table gets to saying so.
 *
 * `riser` is in the genre-wide props and is not a taste decision. `synth/staging.ts`
 * records the mistake it nearly made and the reasoning transfers exactly: `cast.ts`
 * pins a hand-played drummer to a platform 0.4 m up whatever the props say, and
 * the stage builder only builds that platform if this list asks for it. Three of
 * the four eras here weight `electronic-kit`, which `isPlayedByHand` counts as a
 * drummer, so a night without a riser would have a person on pads floating in the
 * air. An empty platform on the many nights nobody is playing drums is the far
 * cheaper failure, and it is barely a failure: a deck set up for a live PA that
 * turns out to be one person with a bag of records is what most of these evenings
 * actually looked like.
 */
const WAREHOUSE: StageRoom = {
  id: 'warehouse',
  architecture: 'shed',
  names: [
    'The Warehouse', 'Unit 12', 'Hangar Three', 'The Loading Bay', 'The Depot',
    'Bay Six', 'The Cold Store', 'The Bus Garage',
  ],
  width: 11, depth: 5,
  audience: { rows: 10, density: 0.85, seated: false },
  /**
   * The stack and the riser, neither of which belongs to a decade of this music
   * rather than to all of it. There has been a wall of speaker boxes and a
   * platform nobody is standing on at every one of these nights since 1986.
   */
  props: ['pa-stack', 'riser'],
  eras: {
    /**
     * 1986–90. A factory unit with the last tenant's paint still on it, one
     * amber flood and a smoke machine somebody brought in a car. The palette is
     * the dirtiest in the project on purpose — there is no lighting designer,
     * there is a rig hired for the night with three colours in it, and the
     * dominant one is whatever gel was cheapest.
     *
     * `posters` is the one piece of dressing that is genuinely period: these
     * nights were advertised on flyposters and the walls of the room were
     * covered in the last six of them.
     */
    warehouse: {
      palette: {
        boards: '#3a352c',
        backdrop: '#1a1814',
        curtain: '#2a2018',
        proscenium: '#6b6355',
        ambient: '#e0913f',
      },
      props: ['flight-case', 'haze', 'drapes', 'posters'],
      maybe: [['rug', 0.4], ['wedges', 0.45], ['bar', 0.3]],
      fog: 0.6,
    },
    /**
     * 1991–95. A hangar. The rig arrives on a truck, the truss goes up, and the
     * fog is the heaviest in this genre — a beam is only visible if there is
     * something in the air for it to be visible *in*, and by 1993 the beams are
     * most of what the room looks like.
     *
     * Green and magenta, which is not a taste: those are the two colours a
     * 1990s rig had at full saturation, and every photograph of this five-year
     * window is one or the other.
     */
    rave: {
      palette: {
        boards: '#2e3038',
        backdrop: '#101a16',
        curtain: '#1c2a24',
        proscenium: '#5f6b66',
        ambient: '#3ff0a0',
      },
      props: ['truss', 'haze', 'projection', 'flight-case', 'wedges'],
      maybe: [['screen', 0.25], ['crowd-barrier', 0.4]],
      fog: 0.85,
      grow: [0.6, 0.3],
    },
    /**
     * 1996–2001. The room has a licence, a name over the door and somebody whose
     * job is the lighting. Blue and white, chrome, a barrier across the front,
     * and the mirror ball — which is here at real weight rather than as a joke,
     * because the superclub is where this music's disco ancestry got hung from
     * the ceiling on purpose.
     */
    superclub: {
      palette: {
        boards: '#33363d',
        backdrop: '#121826',
        curtain: '#1d2740',
        proscenium: '#8a919c',
        ambient: '#7fb6ff',
      },
      props: ['truss', 'screen', 'haze', 'wedges', 'crowd-barrier'],
      maybe: [['mirror-ball', 0.45], ['bar', 0.5], ['flight-case', 0.3]],
      fog: 0.72,
      grow: [0.8, 0.4],
    },
    /**
     * 2002–07. A basement with ninety people left in it at six in the morning.
     * Everything comes back down: the smallest room, the least fog of the four,
     * no truss, no screen, and a palette that has stopped having a colour.
     *
     * The one era here whose dressing is *subtractive*, and it is the room
     * matching what the era's own `density: 0.45` already says about the records.
     */
    afterhours: {
      palette: {
        boards: '#2b2c2e',
        backdrop: '#141618',
        curtain: '#1b1e20',
        proscenium: '#5a5f62',
        ambient: '#9fb0ae',
      },
      props: ['haze', 'drapes', 'flight-case'],
      maybe: [['bar', 0.55], ['rug', 0.35], ['posters', 0.3]],
      fog: 0.5,
      grow: [-0.5, -0.3],
    },
  },
  fallback: {
    palette: {
      boards: '#33363d', backdrop: '#121826', curtain: '#1d2740',
      proscenium: '#8a919c', ambient: '#7fb6ff',
    },
    props: ['truss', 'haze', 'wedges'],
    fog: 0.72,
  },
};

/**
 * The clothes, and the thing to get right about them is that nobody dressed.
 *
 * This is the least performed wardrobe in the project and every number says so.
 * `sequinChance` is 0 in all four eras, `uniform` never exceeds 0.15 — the lowest
 * anywhere, below even ambient's — and `spotlight` is under 0.3 throughout,
 * because the device it carries is *one person is allowed to be loud* and the
 * whole social claim of this music from 1986 to 2007 was that nobody was.
 *
 * The arc is real but it is small, and it is not the arc any other genre has. It
 * does not go from uniformed to relaxed, or from relaxed to deliberate. It goes
 * **sportswear → sportswear in brighter colours → black → sportswear again**, and
 * the only era with any interest in being looked at is the superclub one, which
 * is also the only era in which anybody was selling tickets on a name.
 *
 * ## The union has no t-shirt, and this is the genre where that shows
 *
 * `Garment` is eight silhouettes and the closest to what everybody in this file
 * is actually wearing is `shirtsleeves`, whose own comment says it is a shirt with
 * *two braces over it*. Braces say the wearer is working, which was exactly right
 * for `synth:modular`'s technician and is exactly wrong here — this is a room
 * full of people in loose cotton with nothing over it. `suit` is used for the
 * jacket-and-trousers half and `shirtsleeves` for the rest, and the braces are a
 * wrong detail on about a third of the cast. Named rather than worked around,
 * because the workaround — dressing everybody in a jacket — would be worse.
 */
const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1986–90. Jeans, a loose shirt, a cap, and no agreement of any kind.
   * `uniform: 0.05` is the lowest number in the project's wardrobes and it is
   * meant literally: there are two or three people in the room who could be said
   * to be with the event, and they arrived separately.
   *
   * `headphones` at 0.5 is the highest single accessory weight in this file and
   * it is the one object that identifies the job. `concert/types.ts` records that
   * the model is one rigid piece and rides up over tall hair; over the short cuts
   * and caps weighted here it mostly behaves.
   */
  warehouse: {
    jackets: ['#2c3550', '#3a3a3a', '#5a4632', '#25402f', '#6b2a2a'],
    shirts: ['#e8e4dc', '#d8cbb4', '#8f9aa8', '#c4553a', '#4a6b5c'],
    trousers: ['#2e3a52', '#3a3a3a', '#4a4238'],
    accents: ['#d8a13a', '#c4553a', '#3f8f7a'],
    loud: ['#d8a13a', '#e8e4dc'],
    hair: ['#141210', '#22160f', '#3a2416', '#5c4025', '#8d6a3f', '#a83e2b'],
    hairStyles: [['short', 6], ['curls', 3], ['afro', 3], ['braids', 2], ['bald', 2], ['long', 1]],
    accessories: [
      ['headphones', 0.5], ['ballcap', 0.3], ['chain', 0.22], ['moustache', 0.2],
      ['sunglasses', 0.18], ['earrings', 0.15], ['beard', 0.15],
    ],
    fabrics: [['denim', 5], ['knit', 4], ['nylon', 3], ['flannel', 2], ['leather', 2], ['corduroy', 1]],
    /**
     * Six to four, and the six is the compromise the header describes.
     *
     * `shirtsleeves` leads because nobody here is wearing a jacket, and it is the
     * only value in the union that says so. `suit` at 4 is the bomber and the
     * denim jacket — three colours of one silhouette, with the fabric table above
     * doing the work of telling them apart, which is the same device
     * `synth:digital` uses and for the same reason: the decade changed what a
     * jacket was made of rather than what shape it was.
     */
    garments: [['shirtsleeves', 6], ['suit', 4]],
    loudFabric: 'leather', sequinChance: 0,
    matched: 0.1, uniform: 0.05, spotlight: 0.2,
  },
  /**
   * 1991–95. The same clothes at four times the saturation. This is the one era
   * in the genre with a *colour scheme*, and it belongs to the flyer rather than
   * to anybody's taste: orange, lime, cyan and white were what a 1993 rig could
   * light without turning to mud, so that is what everybody wore.
   *
   * `nylon` at the head of the fabrics is the anorak and the shell suit, which is
   * a fair description of the whole five years. `wraparounds` — one dark band
   * across both eyes rather than two discs — is here because it is the single
   * accessory in the union that reads as this decade at ten metres.
   */
  rave: {
    jackets: ['#e8641e', '#1f9ad6', '#8fd42a', '#e8e4dc', '#2a2a2a'],
    shirts: ['#ffffff', '#f5f0e0', '#a8e8ff', '#ffe066'],
    trousers: ['#e8e4dc', '#2a2a2a', '#3a4a6b'],
    accents: ['#ff7a1e', '#2ae8c0', '#ffe066'],
    loud: ['#ff7a1e', '#8fd42a'],
    hair: ['#141210', '#22160f', '#3a2416', '#5c4025', '#c9a86a', '#a83e2b', '#cfcac2'],
    hairStyles: [['short', 5], ['curls', 3], ['long', 3], ['bald', 2], ['braids', 2], ['dreadlocks', 2], ['mohawk', 1]],
    accessories: [
      ['bandana', 0.3], ['headphones', 0.3], ['wraparounds', 0.28], ['beanie', 0.25],
      ['hoops', 0.2], ['towel', 0.18], ['chain', 0.15],
    ],
    fabrics: [['nylon', 6], ['knit', 3], ['denim', 2], ['flannel', 2], ['vinyl', 1]],
    garments: [['shirtsleeves', 7], ['suit', 3]],
    loudFabric: 'nylon', sequinChance: 0,
    matched: 0.15, uniform: 0.12, spotlight: 0.25,
  },
  /**
   * 1996–2001. Black, and the only era here where anybody dressed on purpose.
   *
   * The superclub is where this music acquired a door policy, a name over the
   * entrance and photographs in a magazine, and the wardrobe follows all three:
   * black on black, `vinyl` and `satin` in the fabric table where the neighbours
   * have denim, and `spotlight` at its genre high of 0.3, because for these five
   * years there genuinely was one person the night was named after.
   *
   * It is still 0.3 rather than a dance band's 0.6, and `sequinChance` is still 0.
   * The person the night is named after was standing behind a table in a black
   * t-shirt.
   */
  superclub: {
    jackets: ['#141416', '#1f1f24', '#2a2a30', '#3a2a3a', '#5a1e2a'],
    shirts: ['#141416', '#ffffff', '#2a2a30', '#c9c4bb'],
    trousers: ['#141416', '#1f1f24', '#2a2a30'],
    accents: ['#c8a24a', '#e8e4dc', '#8f2a4a'],
    loud: ['#c8a24a', '#e8e4dc'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#c9a86a', '#cfcac2'],
    hairStyles: [['short', 6], ['bald', 3], ['slick', 2], ['bob', 2], ['curls', 2], ['long', 2]],
    accessories: [
      ['headphones', 0.35], ['sunglasses', 0.28], ['chain', 0.22], ['hoops', 0.2],
      ['earrings', 0.18], ['beard', 0.15], ['tie', 0.05],
    ],
    fabrics: [['knit', 4], ['vinyl', 3], ['satin', 3], ['leather', 3], ['nylon', 2], ['denim', 2]],
    garments: [['shirtsleeves', 5], ['suit', 4], ['gown', 1]],
    loudFabric: 'vinyl', sequinChance: 0,
    matched: 0.35, uniform: 0.15, spotlight: 0.3,
  },
  /**
   * 2002–07. Grey, and it has stopped mattering.
   *
   * The narrowest colour range in the project after `classical:romantic`'s, and
   * the argument is the same one the era's `density: 0.45` makes about the
   * records: at six in the morning in front of ninety people there is nothing to
   * dress for. `knit` leads, `beanie` and `glasses` are the two commonest
   * accessories, and the loud fabric is `flannel`, which reflects nothing at all
   * and is the only entry in this file where the *loud* option is a joke at the
   * wearer's expense.
   */
  afterhours: {
    jackets: ['#2a2c2e', '#3a3d40', '#1f2224', '#4a4a44', '#33403a'],
    shirts: ['#d8d4cc', '#9aa0a2', '#2a2c2e', '#b4a892'],
    trousers: ['#2a2c2e', '#1f2224', '#3a3d40'],
    accents: ['#8fa89a', '#b4a892', '#5f7a8f'],
    loud: ['#b4a892', '#8fa89a'],
    hair: ['#141210', '#22160f', '#3a2416', '#5c4025', '#8d6a3f', '#cfcac2'],
    hairStyles: [['short', 6], ['bald', 3], ['curls', 2], ['long', 2], ['bob', 2], ['braids', 1]],
    accessories: [
      ['beanie', 0.35], ['glasses', 0.3], ['headphones', 0.28], ['beard', 0.25],
      ['scarf', 0.15], ['earrings', 0.12],
    ],
    fabrics: [['knit', 6], ['flannel', 4], ['denim', 3], ['corduroy', 2], ['nylon', 2]],
    garments: [['shirtsleeves', 6], ['suit', 4]],
    loudFabric: 'flannel', sequinChance: 0,
    matched: 0.2, uniform: 0.08, spotlight: 0.15,
  },
};

/**
 * House: a programme for a night that does not have one.
 *
 * The register is the house voice — dry, affectionate, never a critic's — and the
 * trap here is specific and worth naming, because two kinds of copy suggest
 * themselves and both are unreadable. One is the rave flyer, which is all capitals
 * and exclamation marks and is a period artefact rather than a sentence. The other
 * is the record-shop shelf-talker, which explains what a style is, and no line in
 * any of these tables is allowed to explain the music.
 *
 * So the lines below are about **the room and the hour** — who is in it, who is
 * not, what time it is, and how long this is going to go on for — which is the
 * only thing anybody at one of these nights has ever actually said about it.
 * Tagged against the styles and moods this genre has; `slot` used sparingly,
 * because "still going" is only true late and "nothing has started yet" is only
 * true first.
 */
const BLURBS: Blurb[] = [
  { text: 'nine minutes, and four of them are for the person mixing out', slot: 'open' },
  { text: 'the room was a cold store on tuesday', styles: ['chicago', 'jackin'] },
  { text: 'one machine, one room, no permission', styles: ['chicago'], moods: ['peak'] },
  { text: 'somebody found a knob and did not let go of it', styles: ['acid'] },
  { text: 'forty pounds for the box, and it turned out to do this', styles: ['acid'], moods: ['dark'] },
  { text: 'chords, for once, and somebody who meant them', styles: ['deep', 'garage'] },
  { text: 'the singer is not here and never was', styles: ['garage', 'piano'] },
  { text: 'a piano, at this volume, in this building', styles: ['piano'], moods: ['euphoria'] },
  { text: 'the kick is missing on purpose. keep up', styles: ['ukgarage'] },
  { text: 'a house record with a sound system underneath it', styles: ['speedgarage'] },
  { text: 'four hundred miles north and considerably sadder', styles: ['detroit'] },
  { text: 'strings, from somebody who could not afford strings', styles: ['detroit'], moods: ['dark'] },
  { text: 'the whole midrange has been left out. this is deliberate', styles: ['bleep'] },
  { text: 'one chord, going into an echo, not coming back', styles: ['dubtechno'], moods: ['warmup'] },
  { text: 'made to be played while two other records are running', styles: ['hardgroove'] },
  { text: 'everything stops. then it does not', styles: ['trance', 'progressive'], moods: ['euphoria'] },
  { text: 'eleven things arrive and seven of them leave', styles: ['progressive'] },
  { text: 'four sounds, and you are going to hear all of them', styles: ['minimal'] },
  { text: 'a hi-hat moves one sixteenth at bar ninety-six', styles: ['minimal', 'microhouse'], moods: ['dark'] },
  { text: 'a second room, with cushions, for the ones who have had enough', styles: ['ambienthouse'], moods: ['warmup'] },
  { text: 'belgian, heavy, and over by 1990', styles: ['newbeat'] },
  { text: 'nobody is looking at the stage and that is correct' },
  { text: 'somebody else decides when this ends', slot: 'close' },
];

export const STAGING: Staging = {
  room: WAREHOUSE,
  wardrobe: WARDROBE,
  /**
   * The superclub, when the era is one this genre has no clothes for.
   *
   * Not the warehouse, which is the tempting answer and the wrong one. An unknown
   * decade should get the era this music is *most itself* in as an event, and the
   * warehouse era is the one where the event was least itself — four hundred
   * people in a factory unit is where it started rather than where it settled.
   * 1999 is the year this genre had a room built for it, and a night from an
   * unknown year should look like that one.
   */
  defaultEra: 'superclub',
  blurbs: BLURBS,
  /**
   * 0.55 — and this is the one number in the file where the gap at the top of it
   * becomes arithmetic.
   *
   * `body` is a multiplier on the groove score, and the docstring's examples are a
   * tanssilava band playing to a full floor at 1.0, a jazz quintet at 0.85 and
   * half an ambient act behind a table at 0.4. **This genre is both ends of that
   * scale at once.** The floor is the fullest in the project — the whole record is
   * built to move four hundred people and the mood table's central axis is what
   * time of night it is — and the stage is the emptiest, because there is one
   * person on it and their hands are on a fader.
   *
   * The field can say one of those and it says the average, which is not a
   * satisfying answer and is the honest one. Synth reached 0.6 by the same
   * reasoning at lower stakes — "nobody on this stage is *making* that pulse" —
   * and this sits just under it, because there is even less to see: at least a
   * Prophet-5 has somebody's hands on it for the whole piece.
   *
   * If the field could be split, the two halves would be about 1.0 and about 0.2,
   * and the distance between them is this genre's staging in one line.
   */
  body: 0.55,
};
