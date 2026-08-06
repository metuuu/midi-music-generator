/**
 * What classical stages: a hall with seats in it, and everybody facing forward.
 *
 * Read `iskelma/staging.ts`, `jazz/staging.ts` and `ambient/staging.ts` before
 * touching this one — the instruction at the top of the first of those is the
 * real one, and it is right. These tables are not legible on their own: half of
 * what is decided below is decided *against* a neighbour, and the neighbour is
 * in another folder.
 *
 * The three things this room is defined against:
 *
 * **The pavilion's audience is dancing.** This one's is sitting down, in rows,
 * facing the band, and not moving. That is the whole difference between the two
 * evenings and it is why `body` is 0.45 — see the note on the field at the
 * bottom, which is the single most consequential number in the file.
 *
 * **The cellar has tables and candles.** A concert hall's audience is
 * *furniture*: `stalls` rather than `tables`, because what you see from the
 * boards is upholstery in rows and not people at their own small circles of
 * light. The prop list says so with one name.
 *
 * **The black box has no architecture on purpose.** This room is the opposite
 * claim and the only one in the project that is: the building is part of the
 * event. A gilt proscenium, a chandelier, a carpet and a fan of organ pipes on
 * the back wall — a hall that looked like a unit off an industrial estate would
 * be arguing against the music playing in it, which is exactly the sentence
 * `synth/staging.ts` makes about the black box in the other direction.
 */

import type { Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE CONCERT HALL — classical.
 *
 * Wide and shallow: 12 by 7.5, the largest floor in the project, and the reason
 * is arithmetic rather than grandeur. This genre stages a *section* rather than a
 * band — an era at `density: 0.8` can put eight players out at once, several of
 * them on chairs with instruments between their knees, and `cast.ts` has to fit
 * all of them in front of a back wall without anybody standing behind a
 * tormentor. The prop-vocabulary comment in `concert/venue.ts` warns that a
 * stage too small does not fail, it produces a solver that spreads the band to
 * the edges; 12 m is chosen to be well clear of that rather than to be
 * impressive.
 *
 * **No `riser`, and it is a decision rather than an omission.** The rule in
 * `venue.ts` is that any room a drummer can appear in carries one, because
 * `cast.ts` stands a hand-played drummer 0.4 m up whatever the props say and an
 * unbuilt platform leaves them in mid-air. No style in this genre lets the drum
 * layer exist — every one of the twenty-six carries `excludeLayers: ['drums']` —
 * so there is no drummer to strand, and a permanent empty platform in a room
 * whose percussion is a pair of timpani would be announcing a player who is
 * never coming.
 *
 * **No room modifier.** The four that change how the building is made —
 * `open-air`, `brick`, `black-box`, `haze` — are all wrong for this: naming none
 * gives the plain proscenium, which is what a hall is.
 */
const CONCERT_HALL: StageRoom = {
  id: 'concert-hall',
  architecture: 'concert-hall',
  names: [
    'The Athenaeum', 'Sala Filarmonica', 'The Assembly Rooms',
    'Redoutensaal', 'The Grand Hall', 'Salle Pleyel',
  ],
  width: 12,
  depth: 7.5,
  /**
   * Twelve rows, dense, and seated — the fullest and most orderly house in the
   * project. The pavilion is 0.82 and moving; the cellar is seated at its
   * tables; the black box and the synth hall both stand. This is the one room
   * where the audience being *still* is the point rather than a cost.
   */
  audience: { rows: 12, density: 0.85, seated: true },
  /**
   * Genre-wide dressing, appended after each era's own. All three are true of
   * the building in 1720 and in 1910 alike, which is the test for this list:
   * the stalls are the audience, the carpet is what a band that sits on chairs
   * sits on, and the drapes are the masking every proscenium has ever had.
   */
  props: ['stalls', 'carpet', 'drapes'],
  eras: {
    /**
     * 1720. Candlelight and gilt, and the room is smaller than the ones after
     * it because the band is: this is a palace room or a church, not a public
     * concert hall, which had not been invented. Warm everything — the ambient
     * colour is a wax candle, which is about 1900 K and is the most orange light
     * anywhere in this project.
     *
     * The organ pipes are near-certain here and drop away afterwards. A baroque
     * room with a keyboard in it is very likely a church, and the fan of front
     * pipes on the back wall is the one object that says so from the back row.
     */
    baroque: {
      palette: {
        boards: '#8a6a3c',
        backdrop: '#2a2216',
        curtain: '#6d3320',
        proscenium: '#d8c07a',
        ambient: '#ffcf8a',
      },
      props: ['chandelier'],
      maybe: [['organ-pipes', 0.7], ['flowers', 0.2]],
      fog: 0.08,
    },
    /**
     * 1785. The public concert hall arrives and the room gets bigger, plainer
     * and colder — pale plaster and a great deal of white rather than gilt over
     * dark wood. Still candlelit, but a lot more candles, which is why the
     * chandelier stays and the ambient colour comes up a few hundred kelvin.
     */
    classical: {
      palette: {
        boards: '#a07f4c',
        backdrop: '#2e2a20',
        curtain: '#7a3a2c',
        proscenium: '#e6dcc0',
        ambient: '#ffd9a8',
      },
      props: ['chandelier'],
      maybe: [['organ-pipes', 0.25], ['flowers', 0.3]],
      fog: 0.1,
      grow: [0.4, 0.2],
    },
    /**
     * 1870. Gas, then electricity, and a room built to hold two thousand people
     * and ninety players. Deep red and dark gold — the Musikverein palette, and
     * the one every subsequent hall was painted in imitation of.
     *
     * The largest `grow` in the file, and it is the era's own `density: 0.8`
     * expressed as square metres: this is the orchestra at its maximum size and
     * the boards have to hold it.
     */
    romantic: {
      palette: {
        boards: '#7a5836',
        backdrop: '#241a18',
        curtain: '#8a1f28',
        proscenium: '#c8a24a',
        ambient: '#ffdca6',
      },
      props: ['chandelier'],
      maybe: [['organ-pipes', 0.35], ['flowers', 0.25]],
      fog: 0.14,
      grow: [0.8, 0.4],
    },
    /**
     * 1910. Electric light, and the room stops being warm. Pale grey-green and
     * a cool wash — the first era in this genre lit by something that is not a
     * flame, and the difference between 2700 K and daylight is most of what
     * separates a photograph of 1910 from one of 1870.
     *
     * No chandelier, which is the one prop that changes across the four and the
     * reason the era tables are not one table: by this decade the fitting is a
     * ring of bulbs in the ceiling rather than an object hanging in front of the
     * proscenium, and a chandelier here would date the picture forty years
     * early.
     */
    impressionist: {
      palette: {
        boards: '#6f6350',
        backdrop: '#1e2222',
        curtain: '#3e5a56',
        proscenium: '#b9b8a4',
        ambient: '#d8e2dc',
      },
      props: [],
      maybe: [['organ-pipes', 0.2], ['flowers', 0.35]],
      fog: 0.16,
      grow: [0.6, 0.3],
    },
  },
  fallback: {
    palette: {
      boards: '#8a6a3c', backdrop: '#2a2216', curtain: '#7a2f2a',
      proscenium: '#d8c07a', ambient: '#ffd6a0',
    },
    props: ['chandelier'],
    fog: 0.12,
  },
};

/**
 * The clothes, and the one thing that makes this wardrobe different from every
 * other in the project.
 *
 * **This band is in uniform and there is no spotlight jacket.** `Wardrobe`'s own
 * docstring sets out the two devices that keep a band recognisable without being
 * a costume party — everybody dresses alike, and one person is allowed to be
 * loud — and this genre takes the first at the highest setting in the project and
 * refuses the second almost entirely. A concert platform is *black*, on purpose,
 * for exactly the reason the tanssilava is not: the point is that you cannot tell
 * the players apart, because the thing you are meant to be looking at is not any
 * one of them. `sequinChance` is 0 everywhere and `spotlight` never rises above
 * 0.2, and where it fires the "loud" garment is a white tie or an ivory waistcoat
 * rather than anything that catches a beam.
 *
 * `brocade` is the fabric that earns the earlier eras. It is the one entry in the
 * union that changes a player's *shape* — `dressTorso` gives it an accent placket
 * and a hem border — and that is precisely what a court coat is: a garment with
 * a visible woven border down the front and round the skirt. It is heavy in 1720,
 * halves in 1785, and is gone by 1870, which is very nearly the real history of
 * the object.
 */
const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1720. Court dress: a long coat in a strong colour over a contrasting
   * waistcoat, breeches, and a wig. The wig is `updo` — a mass of white pinned
   * and knotted behind, which is the outline of a full-bottomed peruke read from
   * row twenty and is the closest thing in the union to it. `hair` is
   * accordingly mostly white and grey, which is powder rather than age.
   *
   * The least uniform of the four, and that is period-correct rather than a
   * relaxation: a court band's coats matched because the household issued them,
   * but the colour was the household's and the cut was the tailor's, so the
   * effect is a group in the same palette rather than the same suit.
   */
  baroque: {
    jackets: ['#5a2f52', '#2f4a6b', '#6b4a2a', '#3f5a3a', '#7a3a3a', '#4a3f6b'],
    shirts: ['#f4ecd8', '#ffffff', '#efe4cc'],
    trousers: ['#3a3226', '#4a4033', '#2e2a22'],
    accents: ['#c8a24a', '#8a1f28', '#2a5a4a'],
    loud: ['#e8dcb0', '#c8a24a'],
    // Powder, mostly. The two dark entries are the players who did not wear one.
    hair: ['#efeae0', '#d9d4cc', '#cfc8bc', '#b8b0a4', '#3a2416', '#22160f'],
    hairStyles: [['updo', 7], ['long', 3], ['short', 1], ['bald', 1]],
    accessories: [['bowtie', 0.35], ['tie', 0.2], ['glasses', 0.1]],
    // The court coat, and the one fabric in the union with a shape of its own.
    fabrics: [['brocade', 5], ['velvet', 4], ['silk', 3], ['wool', 2], ['linen', 1]],
    /**
     * The court coat, at last as a coat.
     *
     * The wardrobe header above already describes this era as *a long coat in a
     * strong colour over a contrasting waistcoat*, and until there were garments
     * that sentence had to be carried entirely by `brocade` — a band down the
     * front of a lounge suit, standing in for a knee-length skirted coat with a
     * woven border round the hem. The border is still doing its half; now it has
     * the right object to sit on.
     *
     * `waistcoat` at 2 is the other half of the same sentence, and it is not a
     * different player — it is the same man with the coat off, which is what
     * half the harpsichord players in every engraving of this are doing. It is
     * also the earliest thing in the catalogue that garment serves: a folk
     * fiddler in 1850 and a court keyboard player in 1720 are wearing the same
     * shape, which is exactly the kind of overlap that keeps the union at eight.
     *
     * `suit` at 1, because a genre that produces no lounge suit at all in an era
     * before the lounge suit existed is being precious. One player in the plain
     * modern line is the concession this table makes to the fact that these are
     * cartoon figures on a bench and not a costume department.
     */
    garments: [['coat', 7], ['waistcoat', 2], ['suit', 1]],
    loudFabric: 'brocade', sequinChance: 0,
    matched: 0.55, uniform: 0.6, spotlight: 0.2,
  },
  /**
   * 1785. The coat gets shorter and the colours go out of it. Dark blue, bottle
   * green, black and buff, with a white cravat that is the only bright thing on
   * the stage — which is the beginning of the arrangement every orchestra has
   * used ever since. Hair is still powdered about half the time and increasingly
   * is not a wig.
   */
  classical: {
    jackets: ['#22314a', '#2a3a2e', '#3a2a2a', '#1f1f26', '#4a4034', '#2e3a46'],
    shirts: ['#ffffff', '#f6f0e2', '#efe8d8'],
    trousers: ['#d8cdb4', '#2a2a30', '#3a3628'],
    accents: ['#ffffff', '#a8332c', '#c8a24a'],
    loud: ['#f4ecd8', '#ffffff'],
    hair: ['#efeae0', '#cfc8bc', '#3a2416', '#5c4025', '#22160f', '#8d6a3f'],
    hairStyles: [['updo', 5], ['slick', 3], ['short', 3], ['long', 2], ['bald', 1]],
    accessories: [['bowtie', 0.5], ['tie', 0.25], ['glasses', 0.15]],
    fabrics: [['wool', 5], ['silk', 3], ['velvet', 2], ['brocade', 2], ['linen', 1]],
    /**
     * *The coat gets shorter*, says the comment above, and this is the decade
     * where the table can show it: the coat and the suit are within one weight
     * of each other.
     *
     * That is the whole of what happened between 1720 and 1785 in one line. Half
     * the platform is still in the old skirted line and half of it is in
     * something recognisably a modern jacket, and neither has won yet.
     *
     * **This note said the two were *level* and that this is the only era in the
     * file where two garments are equal.** Neither is true of the table two
     * lines down: it is 5 against 4, and no era in this file has two garments at
     * the same weight — `baroque` is 7/2/1, `romantic` 9/1, `impressionist` 8/2.
     * The 5:4 is the better number anyway and is why it survived the correction:
     * a dead heat would say the two coexisted in equal numbers, and what the
     * decade actually did was tip. Five in eleven against four in eleven is a
     * transition caught in the act, which is the right way for one to be
     * written — a decade is a mixture, not a switch.
     */
    garments: [['coat', 5], ['suit', 4], ['waistcoat', 2]],
    loudFabric: 'silk', sequinChance: 0,
    matched: 0.7, uniform: 0.78, spotlight: 0.15,
  },
  /**
   * 1870. Full evening dress, and the uniform arrives properly: black tailcoat,
   * white shirt, white tie, and every player identical. `uniform` at 0.9 is not
   * an exaggeration — this is the decade the orchestral dress code was fixed,
   * and it has not moved since.
   *
   * **It is not the highest number in the project, which this note claimed.**
   * pop's `stadium` writes 0.92 and arabic's `firqa` ties this at 0.9; rnb's
   * `neosoul` writes 0.88 under a comment claiming the record for itself, so
   * three files have now made this claim and at most one of them can be right.
   * The number stands on its own evidence and did not need the ranking.
   *
   * The palette is nearly monochrome, which puts all the colour in the room
   * rather than on the people. That is the same trade the black box makes and it
   * is being made here for the opposite reason: there, because nobody is trying
   * to be seen; here, because the building is.
   */
  romantic: {
    jackets: ['#141418', '#1b1b20', '#22222a'],
    shirts: ['#ffffff', '#f8f6f0'],
    trousers: ['#141418', '#1b1b20'],
    accents: ['#ffffff', '#8a1f28'],
    loud: ['#ffffff', '#f4ecd8'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#8d6a3f', '#cfcac2', '#d9d4cc'],
    hairStyles: [['slick', 5], ['updo', 4], ['short', 3], ['curls', 2], ['bald', 2], ['long', 1]],
    accessories: [['bowtie', 0.75], ['moustache', 0.4], ['beard', 0.3], ['glasses', 0.2]],
    fabrics: [['wool', 6], ['silk', 3], ['velvet', 2]],
    /**
     * *Black tailcoat, white shirt, white tie, and every player identical.*
     *
     * Nine to one is the tightest garment table in the project and it is the
     * same claim `uniform: 0.9` above makes, which is the point — the two
     * numbers should agree, and until now the second one had no shape to be
     * uniform *in*. This is also the only era in the catalogue where the picture
     * genuinely requires `tails`: the whole read of an orchestral platform is
     * forty people who are the same object, and a tailcoat is the object.
     *
     * The one in ten who draws `suit` is the deputy who was called that morning.
     * It is deliberate rather than tolerated — a section in which every single
     * player is identical reads as an instanced mesh, and one wrong jacket in a
     * row of twelve is what makes the other eleven look like people.
     */
    garments: [['tails', 9], ['suit', 1]],
    loudFabric: 'silk', sequinChance: 0,
    matched: 0.95, uniform: 0.9, spotlight: 0.12,
  },
  /**
   * 1910. The same evening dress, cut narrower, and with the first cracks in it:
   * a slightly softer collar, a wing collar instead of a stand, and the
   * occasional player who has decided not to wear the tie. Otherwise unchanged,
   * because it genuinely was — the interesting thing about orchestral dress
   * between 1870 and 1910 is that the music changed completely and the clothes
   * did not.
   */
  impressionist: {
    jackets: ['#141418', '#1b1b20', '#26262c', '#2a2e33'],
    shirts: ['#ffffff', '#f4f4f0', '#eef0ee'],
    trousers: ['#141418', '#1b1b20'],
    accents: ['#ffffff', '#3e5a56'],
    loud: ['#ffffff', '#c9c4bb'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#c9a86a', '#cfcac2'],
    hairStyles: [['slick', 5], ['updo', 4], ['short', 4], ['bob', 2], ['bald', 2], ['curls', 1]],
    accessories: [['bowtie', 0.6], ['glasses', 0.3], ['moustache', 0.3], ['tie', 0.2]],
    fabrics: [['wool', 6], ['silk', 3], ['linen', 1], ['velvet', 1]],
    /**
     * Unchanged, and being unchanged is the observation.
     *
     * Eight to two against 1870's nine to one is the entire visible difference
     * between the two eras, and the comment above says why that is correct
     * rather than lazy: the music changed completely between 1870 and 1910 and
     * the clothes did not. A garment table that had invented a difference here
     * would be making the wardrobe tell a story the era note explicitly denies.
     */
    garments: [['tails', 8], ['suit', 2]],
    loudFabric: 'silk', sequinChance: 0,
    matched: 0.9, uniform: 0.85, spotlight: 0.1,
  },
};

/**
 * Classical: a concert programme.
 *
 * The register is the house one — short, lowercase, affectionate and dry — and
 * the trap here is the most obvious in the project. Programme notes about this
 * repertoire are a *genre of writing*, and it is a reverent one full of the word
 * "sublime". A bill made of that is unreadable and, worse, is the one thing the
 * house voice is not: it takes the music's own view of itself at face value.
 *
 * So these are written from the audience's side of the boards rather than the
 * composer's. Nothing below explains a form, names a device or dates a piece.
 * They are about sitting in a chair for four minutes, about the fact that this
 * music expects a great deal of you and mostly gets it, and about the small
 * indignities of a concert — the coughing, the clapping in the wrong place, the
 * person who reads the whole programme during the slow movement.
 *
 * Style and mood tags are unchecked at runtime: a typo does not fail anything,
 * it multiplies the line's weight by 0.03 and the line quietly never appears.
 * Every id below is copied out of `styles.ts` and `moods.ts`.
 */
const BLURBS: Blurb[] = [
  { text: 'a tune, and then what happens to it', styles: ['sonata'] },
  { text: 'it leaves home in the middle and comes back', styles: ['sonata'], moods: ['agitato'] },
  { text: 'you will know when it is over. everyone does', styles: ['rondo', 'march'] },
  { text: 'the same eight bars, sixteen times, and better each time', styles: ['passacaglia', 'chaconne'] },
  { text: 'four voices, none of them accompanying', styles: ['fugue'] },
  { text: 'someone counts a bar in their head and then it starts', styles: ['fugue', 'chorale'], slot: 'open' },
  { text: 'three to a bar, and the weight is on the wrong one', styles: ['sarabande', 'mazurka'] },
  { text: 'a dance nobody has danced for three hundred years', styles: ['minuet', 'gavotte', 'pavane'] },
  { text: 'fast, and the joke is that it used to be a minuet', styles: ['scherzo'], moods: ['giocoso'] },
  { text: 'both hands, and neither of them resting', styles: ['toccata', 'etude'] },
  { text: 'written to be difficult. it is', styles: ['etude'], moods: ['brillante'] },
  { text: 'the loud one, to get everyone in their seats', styles: ['overture'], slot: 'open' },
  { text: 'this is the one your grandmother hums', styles: ['nocturne', 'waltz'] },
  { text: 'left hand does the rowing', styles: ['barcarolle'] },
  { text: 'quietly, please. it is about a baby', styles: ['berceuse'], moods: ['tranquillo'] },
  { text: 'in latin, and not about anything cheerful', styles: ['lacrimosa'], moods: ['mesto'] },
  { text: 'nothing resolves and nobody minds', styles: ['prelude'], moods: ['misterioso'] },
  { text: 'a picture of water, at some expense', styles: ['prelude', 'barcarolle'] },
  { text: 'slow, and worth the wait', styles: ['adagio'], moods: ['cantabile'] },
  { text: 'the tune is the whole argument', styles: ['aria', 'adagio'] },
  { text: 'do not clap yet', slot: 'close' },
  { text: 'four minutes, and the coughing waits until the end' },
  { text: 'the timpani have been counting since bar one' },
];

export const STAGING: Staging = {
  room: CONCERT_HALL,
  wardrobe: WARDROBE,
  /**
   * Classical, when the era is one this genre has no clothes for. 1785 is where
   * the word means what most people mean by it, and it is the middle of the four
   * in every sense that matters here — a band dressed for it is neither in wigs
   * nor in tails, which is the safest place to be wrong from.
   */
  defaultEra: 'classical',
  blurbs: BLURBS,
  /**
   * The second lowest in the project, and the number is this genre's whole
   * staging argument in one field.
   *
   * **This said *the lowest* and the paragraph below it always said otherwise**,
   * which is the useful thing about the mistake: the opening line and the
   * sentence four down — *this sits just above ambient* — were in the same
   * docstring disagreeing with each other, and the sentence with the evidence
   * attached was the correct one. Ambient is 0.4 and this is 0.45; nothing else
   * in the project is below 0.55.
   *
   * `body` multiplies the groove score — how much the room and the players move.
   * The yardstick is iskelmä at 1.0, which is a band watching a floor of people
   * dance; jazz is 0.85 at its tables, synth 0.6, and ambient 0.4 with half the
   * act behind a desk. This sits just above ambient and for a different reason:
   * ambient is low because there is no pulse to feel, and this is low because
   * **everybody is sitting on a chair on purpose**. An orchestral player moves —
   * a bow arm is a large gesture and a string section leans together — but they
   * move *within* an arrangement of chairs and stands that nobody leaves, and
   * the audience does not move at all.
   *
   * Not lower, and this is the half worth stating. A stage of people holding
   * perfectly still reads as a dropped frame rather than as stillness, which is
   * ambient's own note on the same field; and unlike ambient this music has a
   * conductor's beat in it that every player is visibly on. 0.45 keeps the shape
   * of the energy curve — a tutti is still bigger than a trio — while making the
   * room the second quietest in the project, behind the one that has no pulse.
   */
  body: 0.45,
};
