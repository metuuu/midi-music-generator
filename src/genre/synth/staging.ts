/**
 * What synth stages: a hall, a screen, and a great deal of equipment.
 *
 * The other three genres' staging files are a migration — the same rooms and
 * wardrobes that lived in `concert/`, moved into the folders that own them. This
 * one is not. Nothing here existed, which is why this genre has been staging in
 * the generic house, in the plain concert dress whose own comment says it is
 * dull on purpose, under a programme line reading "a new one, and nobody has
 * decided about it yet". Three fallbacks doing exactly their job, and a genre
 * nobody had finished. See `Staging` in `genre/types.ts`, where that is the
 * evidence for the whole change.
 *
 * ## Why a fourth room rather than one of the three
 *
 * The three that exist were all rejected for a reason that is about this music
 * rather than about square metres.
 *
 * **The black box was the tempting one and it is the wrong one.** Its own header
 * says what it is for: "a genre that refuses to have a foreground gets a room
 * that refuses to have a focus". This genre is the opposite claim — it has a
 * tune on top, a lead break at the climax, and a final statement lifted a tone
 * with everything piled on it. A room built to have no focus would be arguing
 * against the music playing in it. The two are neighbours and it matters that
 * they look different: `ambient/kosmische` is the sequencer record that belongs
 * over there, and if the stages matched, nothing on screen would say why the
 * genres do not.
 *
 * **The cellar is too small and the pavilion is the wrong evening.** A wall of
 * patch cables is 1.7 m of furniture and a Berlin-school set is an hour long;
 * neither fits between the tables. And a tanssilava is a floor of people
 * dancing to a band — the one thing this repertoire is *not*, even where it is
 * danceable, because what they are dancing to is a machine.
 *
 * So: a hall. Not a specific building, which is the point of the name list — a
 * planetarium, a Kunsthalle, a cathedral with a PA flown in it, a municipal
 * auditorium with a screen. The common denominator across 1972–1990 is a big
 * civic room, a rectangle of light upstage, and more cable than band. The
 * architecture is `hall` — see `web/concert/rooms/hall.ts`. It was a plain
 * proscenium when this file was written, on the reasoning that the room itself
 * is not the attraction: everything the audience came to look at was carried in
 * on a trolley. That reasoning survived and the conclusion did not, because a
 * room can be unremarkable in two different ways. A proscenium is a *theatre*
 * being modest; what this genre wanted was a big flat civic box that was never
 * a theatre at all — no rake, no gallery, no moulding, wider than it is tall,
 * with one bowed cyclorama filling the upstage end.
 *
 * The deciding argument turned out to be the fog. This genre carries the
 * heaviest in the project, rising to 0.75 by 1987, and haze needs two things a
 * proscenium does not supply: a surface close enough to still read through it,
 * and a large plain plane for the cyc glow to be light *on* rather than light
 * in front of. Those are the same requirement stated twice, and they are why
 * `backdropHeight` is the number that room argues about hardest.
 */

import type { BillHouse, Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE HALL — synth.
 *
 * Deep, plain, and lit almost entirely by things that were plugged in. The
 * projection is the scenery and the cable runs are the set dressing, which is
 * why they are declared once for the genre rather than in all three eras.
 *
 * **The audience stands**, for the reason the black box's does and one of its
 * own. `web/concert/stage-audience.ts` builds a seated house at 1.26 m, which
 * from the camera's side of the boards is a field of low humps rather than a
 * room with people in it — and beyond that, the crowd this music actually drew
 * was standing in a square in front of a building. A cathedral audience sat on
 * the floor; nobody in this repertoire's audience was ever in rows of chairs
 * facing a man behind a Prophet-5.
 *
 * As wide as the pavilion and deeper than anything else here, which is not
 * grandeur. This genre stages the largest objects in the project — see
 * `SYNTH_RIGS`, where a modular is 1.7 m tall and claims floor accordingly — and
 * the boards have to hold two of those plus whoever else is playing, upstage of
 * a front line that is also mostly keyboards. See `cast.ts`, which is what has
 * to fit inside these numbers.
 */
const HALL: StageRoom = {
  id: 'hall',
  architecture: 'hall',
  names: ['The Planetarium', 'Kuppelsaal', 'The Rotunda', 'Halle 7', 'Salle Ovale', 'The Auditorium'],
  width: 10, depth: 6.6,
  audience: { rows: 9, density: 0.7, seated: false },
  /**
   * The screen and the drum platform, neither of which belongs to a decade of
   * this music rather than to all of it. There has been a lit rectangle upstage
   * at every one of these concerts since 1974, and all three era tables would
   * otherwise have had to repeat it.
   *
   * **`riser` is not a taste decision, and drawing for it was the one real
   * mistake in this file's first draft.** Putting it in the digital era's `maybe`
   * looks reasonable — by 1987 the drums come out of the same box as everything
   * else, and a permanent empty platform announces a player who is not coming —
   * and it is the wrong lever. `cast.ts` pins a hand-played drummer to a platform
   * 0.4 m up whatever the props say, and the stage builder only builds that
   * platform if this list asks for it, so half the digital numbers with a kit
   * would have had one floating in the air. Any room a drummer can appear in
   * carries a riser. The black box is the only exception in the project and it
   * earns it by zeroing the drummer's height by hand.
   *
   * An empty platform on a night when the drums came out of a box is the
   * cheaper failure by a distance, and it is not really a failure: a stage set
   * for a band that turns out to be three people and a sequencer is what most of
   * these evenings actually looked like.
   */
  props: ['projection', 'riser'],
  eras: {
    /**
     * 1972–77. A university hall or a cathedral, hired for the night, with two
     * floods and a dry-ice machine. The green wash is the period's one reliable
     * colour — a rig of that decade had gels and no console, so a concert was
     * lit in two or three flat washes that stayed on for twenty minutes at a
     * time, which is also roughly how long the pieces were.
     *
     * This is the era with a drummer in it — `drumSources` puts a kit at 4
     * against the box's 6, and 1974 is every prog band who owned a Minimoog as
     * much as it is Tangerine Dream — so the flight cases and the pa are the
     * dressing of a band's stage rather than of an installation.
     */
    modular: {
      palette: {
        boards: '#4a4238',
        backdrop: '#171b21',
        curtain: '#3a2c46',
        proscenium: '#7b7466',
        ambient: '#9fc9a6',
      },
      props: [
        'drapes', 'flight-case', 'pa-stack', 'haze',
      ],
      maybe: [['rug', 0.5], ['wedges', 0.35]],
      fog: 0.55,
    },
    /**
     * 1978–83. The decade the concerts got big. The palette goes cold and
     * saturated — deep blue, white light, one hard beam — because this is the
     * era of the outdoor spectacle and the arena, and both are lit by things
     * pointed at the band rather than by anything in the room.
     *
     * The mirror ball is a low-probability joke with a straight face behind it:
     * `cosmic` is four-on-the-floor disco played on a Jupiter, and one night in
     * five the hall really was a discotheque with better equipment in it.
     */
    polysynth: {
      palette: {
        boards: '#3b3b40',
        backdrop: '#121729',
        curtain: '#20305e',
        proscenium: '#8a8fa0',
        ambient: '#8fb8ff',
      },
      props: [
        'pa-stack', 'wedges', 'flight-case', 'haze', 'drapes',
      ],
      maybe: [['mirror-ball', 0.2]],
      fog: 0.62,
      grow: [0.3, 0.2],
    },
    /**
     * 1984–90. Cyan and magenta, the most fog of the three, and a stage that has
     * stopped pretending to be a room at all. The era's own effects table sends
     * the drums to a reverb at 0.7 and cuts the top off it — the gated snare —
     * and this is what that sounds like as a building.
     *
     * The flight cases go to `maybe` and the rug is gone. By 1987 the gear
     * arrives in a truck and lives in a rack, and what is on the boards is the
     * keyboards, the monitors and a great deal of smoke.
     */
    digital: {
      palette: {
        boards: '#2e3038',
        backdrop: '#0f1420',
        curtain: '#2a1140',
        proscenium: '#6a7080',
        ambient: '#7fe4d8',
      },
      props: [
        'pa-stack', 'wedges', 'drapes', 'haze',
      ],
      maybe: [['flight-case', 0.4], ['mirror-ball', 0.15]],
      fog: 0.75,
      grow: [0.6, 0.3],
    },
    /**
     * 2005 onward. Magenta and cyan on black, the heaviest fog in the project,
     * and the first stage in this genre lit *by the backdrop* rather than by
     * anything pointed at the band.
     *
     * The palette is the sleeve art, and that is a fact about the music rather
     * than a joke at its expense: this is a repertoire whose visual identity was
     * fixed before most of its records were made, by a generation who agreed in
     * advance that it looks like a sunset over a grid. Two colours, both
     * saturated, meeting in the middle — and the boards go nearly black because
     * everything else is doing so much.
     *
     * `crowd-barrier` is the one object here that appears in no other era of
     * this genre, and it is the whole staging idea in one prop: the older eras
     * hired a civic room and sat or stood an audience in front of a man behind
     * a Prophet, and these acts play a festival tent with a pit in it. A barrier
     * says *this crowd is close and moving* without changing the room.
     *
     * **`neon` and `truss` were both tried and neither stands up in this room,
     * which is `npm run stage` doing its job.** A neon sign is a club object
     * with no wall to fix to on a stage this deep — it came back as a free
     * cluster, and 100% of it hidden behind the projection besides — and a truss
     * flies at 5.466 m in a hall whose lid is 5.886, so it hung from nothing with
     * a fifth of a metre of air above it. Both were the right instinct about the
     * venue and the wrong instinct about the geometry; the barrier is the half of
     * the idea that touches the floor.
     *
     * The mirror ball is not offered, unlike in the two eras above. It is a
     * quotation of 1979, and 1979 is the one decade these records are not
     * quoting. The flight cases stay at a low weight rather than going entirely:
     * what arrives in a van in 2013 is two laptops and a controller, but
     * somebody still has to carry the keyboards.
     */
    retrowave: {
      palette: {
        boards: '#1a1620',
        backdrop: '#120a1e',
        curtain: '#2b0c3d',
        proscenium: '#5a4a6e',
        ambient: '#ff3fa4',
      },
      props: [
        'pa-stack', 'wedges', 'haze', 'drapes', 'crowd-barrier',
      ],
      maybe: [['flight-case', 0.3]],
      fog: 0.8,
      grow: [0.6, 0.3],
    },
  },
  fallback: {
    palette: {
      boards: '#3b3b40', backdrop: '#121729', curtain: '#20305e',
      proscenium: '#8a8fa0', ambient: '#8fb8ff',
    },
    props: ['pa-stack', 'wedges', 'flight-case', 'haze'],
    fog: 0.62,
  },
};

/**
 * The clothes, and the one thing to get right about them.
 *
 * Nobody in this repertoire is dressed *for the stage* in the way a dance band
 * or a swing section is, and it took until the middle era for anyone to dress
 * deliberately at all. So `sequinChance` is 0 in all three and `loudFabric` is
 * never a spangle: the loud jacket here is white, or oxblood velvet, or black
 * leather, and the person wearing it is standing behind a keyboard. A sequinned
 * jacket on a man operating a sequencer is a different genre's photograph.
 *
 * The arc across the three is the interesting part, and it is the reverse of
 * every other genre here. Iskelmä and jazz both start uniformed and come apart;
 * this one starts as five people who came to move equipment, becomes the most
 * deliberately dressed band in the project for five years, and then comes apart
 * again into session players in whatever 1987 was selling.
 */
const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1972–77. Denim, corduroy, an enormous amount of hair, and no agreement of
   * any kind. These are people who arrived in a van with the cabinets, and the
   * one flourish available is a velvet jacket on whoever is fronting it — which
   * is the prog end of this era rather than the Berlin end, and is why it is a
   * jacket rather than anything shinier.
   */
  modular: {
    jackets: ['#4a4034', '#3f4a3d', '#5a4a3a', '#2f3a4a', '#6b5b45'],
    shirts: ['#c9b48a', '#8a9a86', '#b5a68c', '#7d8a99'],
    trousers: ['#3a4152', '#4a4238', '#2e3138'],
    accents: ['#a8482c', '#7a6a2b', '#3f6a5a'],
    loud: ['#a8482c', '#7d6aa8'],
    hair: ['#22160f', '#3a2416', '#5c4025', '#8d6a3f', '#a83e2b', '#cfcac2'],
    hairStyles: [['long', 6], ['curls', 3], ['short', 2], ['slick', 1], ['bald', 1]],
    accessories: [['beard', 0.45], ['moustache', 0.3], ['glasses', 0.3], ['headphones', 0.15], ['scarf', 0.12]],
    fabrics: [['denim', 5], ['corduroy', 4], ['knit', 3], ['velvet', 2], ['wool', 1]],
    /**
     * Four entries, none of them agreeing, which is what `uniform: 0.1` means.
     *
     * The flattest garment table in the project after `indian:filmi`, and it is
     * flat for the reason the era comment gives rather than out of indecision:
     * these are people who arrived in a van with the cabinets and got dressed
     * separately. A table that named one shape would be claiming somebody had a
     * say in it.
     *
     * `waistcoat` at 3 is the honest middle of the era — the shell and the
     * sleeves go to the shirt colour, so it draws a man in a knitted thing with
     * a sleeveless thing over it, standing behind a wall of patch cables, which
     * is every photograph taken in a British studio in 1974.
     *
     * `robe` at 2 is the cape, and it is here rather than in `polysynth` because
     * this is the prog end of the era and the other is not. A floor-length
     * column with wide sleeves is what somebody was wearing behind the Mellotron
     * on at least one night, and the union has no cape and is not getting one:
     * a cape is a robe with the front open, which is four pixels at the distance
     * `Garment` judges from. Two in ten puts one in a five-piece.
     *
     * `shirtsleeves` at 1 is the technician. Its braces are the only object in
     * the union that says the wearer is working rather than performing, and half
     * of what happened on these stages was somebody repatching a module between
     * pieces with the house lights up.
     */
    garments: [['suit', 4], ['waistcoat', 3], ['robe', 2], ['shirtsleeves', 1]],
    loudFabric: 'velvet', sequinChance: 0,
    matched: 0.25, uniform: 0.1, spotlight: 0.2,
  },
  /**
   * 1978–83. The uniform arrives, and it is the only one in this project that is
   * an *idea* rather than a habit. A swing section wore matching suits because
   * that is what a section did; this band wears a red shirt and a black tie
   * because looking like four identical operators is the argument the music is
   * making. Hence the second-highest `uniform` in the catalogue and a
   * `spotlight` that is only moderate — half this repertoire has a man in a
   * white jacket out in front of it and half of it deliberately has nobody.
   */
  polysynth: {
    jackets: ['#1b1b20', '#e8e6e1', '#8f2027', '#2b3550', '#3f4247'],
    shirts: ['#ffffff', '#a3232b', '#1b1b20', '#dfe3e8'],
    trousers: ['#1b1b20', '#2b3550', '#3f4247'],
    accents: ['#c62222', '#e8e6e1', '#1b1b20'],
    loud: ['#e8e6e1', '#c62222'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#c9a86a', '#cfcac2'],
    hairStyles: [['slick', 5], ['short', 5], ['long', 2], ['curls', 2], ['bob', 1]],
    accessories: [['tie', 0.55], ['glasses', 0.3], ['moustache', 0.2], ['headphones', 0.2]],
    // Nothing that catches a follow spot except the one white jacket. A vocoder
    // band in satin would be a showband, which is the failure this whole era's
    // table is steering around.
    fabrics: [['wool', 5], ['nylon', 3], ['leather', 2], ['satin', 2], ['knit', 1]],
    /**
     * Eight to two, and the two is the same uniform with the jacket off.
     *
     * This is the one era in the project whose uniform is an *argument* — the
     * era comment says so above — and an argument is not served by variety. Four
     * identical operators is the claim the music is making, so the table is the
     * second-tightest in the file after `classical:romantic`'s, and everything
     * interesting happens in the colours: a red shirt, a black tie, and the same
     * narrow suit on everybody.
     *
     * `waistcoat` rather than `shirtsleeves` for the two, and the choice matters
     * more here than anywhere else it has been made. Both are the shirt with no
     * jacket over it; the difference is that one has braces on it and the other
     * has a fitted body. Braces would have said *this man has been working*,
     * which is the exact opposite of what a band standing perfectly still behind
     * four keyboards is saying. The waistcoat keeps the shirt and the tie
     * showing and adds a second dark shape, so the two players who draw it are
     * still visibly in the uniform rather than out of it.
     */
    garments: [['suit', 8], ['waistcoat', 2]],
    loudFabric: 'satin', sequinChance: 0,
    matched: 0.7, uniform: 0.65, spotlight: 0.4,
  },
  /**
   * 1984–90. Pastel and grey, a leather jacket, sunglasses indoors, and the hair
   * that dates a photograph faster than any other object in it. The uniform is
   * gone because the band is not a band any more — a late-eighties electronic
   * record is a composer and whoever the studio sent — and the loud jacket is
   * black leather, which in this decade is what "the one out front" looked like.
   */
  digital: {
    jackets: ['#2a2d33', '#1f5f8a', '#7a2f5e', '#c9c4bb', '#3a3a3a', '#4a6f6a'],
    shirts: ['#ffffff', '#e8f0f5', '#f4d6e4', '#cfd8dd'],
    trousers: ['#1f2126', '#33363b', '#c9c4bb'],
    accents: ['#ff4fa3', '#2fd8d0', '#f2c14e'],
    loud: ['#ff4fa3', '#c9c4bb', '#2fd8d0'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#c9a86a', '#a83e2b', '#cfcac2'],
    hairStyles: [['mullet', 5], ['curls', 3], ['long', 3], ['short', 3], ['slick', 2], ['bald', 1]],
    accessories: [['sunglasses', 0.4], ['earrings', 0.25], ['glasses', 0.2], ['moustache', 0.2], ['headphones', 0.2]],
    fabrics: [['leather', 4], ['satin', 3], ['nylon', 3], ['denim', 2], ['wool', 2], ['knit', 1]],
    /**
     * The band is not a band, so the wardrobe is a composer and whoever the
     * studio sent.
     *
     * `suit` at 7 is the leather jacket, the boxy pastel one and the grey one,
     * which are three colours of one silhouette and the fabric table above is
     * where they differ. That is the correct answer rather than a gap — the
     * eighties did not change the *shape* of a jacket, it changed what the
     * jacket was made of, and `leather` at the head of the fabrics says that
     * better than a ninth member of the union could.
     *
     * `gown` at 3 is who the studio sent. A late-eighties electronic record has
     * a hired vocalist on it who was booked for the afternoon and dressed for
     * the sleeve photograph, and she is the only person in the room who is not
     * in a jacket. It is the same device `iskelma:eighties` uses two genres over
     * and for the same decade, which is a small piece of evidence that the
     * device is about 1985 rather than about Finland.
     *
     * Three rather than two, and the reason is the bench rather than the
     * argument. At 2 this era's five-piece drew nought of them and the row was
     * five jackets — which is a perfectly possible evening and a useless page,
     * because a wardrobe nobody can tell from an undressed one has not been
     * checked, it has only been written. Three is the smallest weight that puts
     * the person the whole `spotlight: 0.5` is about into a band this size.
     */
    garments: [['suit', 6], ['gown', 3], ['waistcoat', 1]],
    loudFabric: 'leather', sequinChance: 0,
    matched: 0.3, uniform: 0.3, spotlight: 0.5,
  },
  /**
   * 2005 onward. Black, and one thing that is not.
   *
   * The arc this file's header describes — five people who came to move
   * equipment, then the most deliberately dressed band in the project, then
   * session players in whatever 1987 was selling — ends here, and it ends by
   * going all the way back. These acts dress like the *audience*, which no
   * other era in this genre does: a black t-shirt, a leather jacket, and the
   * single loud object on the whole stage is whatever is printed on the shirt.
   *
   * So `matched` and `uniform` are the lowest in the file and `spotlight` is
   * the highest. That combination is unusual and it is the correct description:
   * nobody is dressed as a group, and one person is unmistakably the act,
   * because half of these projects *are* one person and the other half are one
   * person with friends helping.
   *
   * **`sunglasses` at 0.5 is the highest accessory weight in the genre and it
   * is not a joke.** The mask, the helmet and the shades are this repertoire's
   * one costume idea, inherited whole from the vocoder bands of `polysynth` and
   * meant the same way: the performer declines to have a face. The union has no
   * mask, and dark glasses indoors under a magenta wash is as close as the
   * wardrobe gets to the gesture.
   *
   * `denim` and `leather` at the top with `nylon` behind them — a tour jacket,
   * which is the one garment on this stage that belongs to the decade it is
   * being worn in rather than to the decade being remembered.
   */
  retrowave: {
    jackets: ['#111114', '#1c1c22', '#2a1a2e', '#20242c', '#3a1f34'],
    shirts: ['#111114', '#1a1a20', '#e8e6ef', '#241a2c'],
    trousers: ['#14141a', '#1f2229', '#2b2b33'],
    accents: ['#ff3fa4', '#2fd8d0', '#f0a63c'],
    loud: ['#ff3fa4', '#2fd8d0'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#a83e2b', '#cfcac2'],
    hairStyles: [['short', 5], ['long', 4], ['slick', 3], ['bald', 3], ['curls', 2], ['mullet', 1]],
    accessories: [['sunglasses', 0.5], ['beard', 0.35], ['headphones', 0.25], ['chain', 0.15], ['earrings', 0.15]],
    fabrics: [['leather', 5], ['denim', 4], ['nylon', 3], ['knit', 2], ['wool', 1]],
    /**
     * `shirtsleeves` at the head of the table, which happens nowhere else in
     * this project.
     *
     * Its own gloss is *no jacket at all*, and that is what this looks like:
     * the t-shirt is the outfit. `suit` at 4 is the leather jacket over it —
     * the same silhouette `digital` uses, worn by somebody who bought it for a
     * different reason — and `waistcoat` is absent, because there is no version
     * of this stage where anybody is wearing a fitted body over a shirt.
     */
    garments: [['shirtsleeves', 6], ['suit', 4]],
    loudFabric: 'leather', sequinChance: 0,
    matched: 0.15, uniform: 0.1, spotlight: 0.6,
  },
};

/**
 * Synth: a hall programme, printed on the good paper.
 *
 * The register is the house one — dry, affectionate, never a critic's — and the
 * trap is specific to this genre. Writing about electronic music invites two
 * kinds of copy, the technical spec and the cosmic reverie, and both are
 * unreadable on a bill: nobody wants to be told the oscillator count, and
 * nobody wants to be told about the infinite. So the lines below are about
 * *equipment behaving like a person* and *people behaving like equipment*, which
 * is the joke this music has always made about itself and the only one it needs.
 *
 * Tagged against the nine styles and five moods this genre actually has, and
 * `slot` is used sparingly. "Started before the lights went up" is only true of
 * the first number and is a small lie anywhere else.
 *
 * The revival lines carry one extra constraint the older ones do not. This
 * music is *about* an era it did not live in, so a bill line that plays the
 * nostalgia straight reads as the programme note being in on a joke — and the
 * house register above is affectionate rather than knowing. So they describe
 * what the number does, in the same dry voice as the rest, and let the
 * quotation marks stay off.
 */
const BLURBS: Blurb[] = [
  { text: 'sixteen steps, and the rest of the evening', styles: ['berlin'] },
  { text: 'the filter opens. that is the event', styles: ['berlin'], moods: ['cosmos'] },
  { text: 'two sequencers, disagreeing politely', styles: ['berlin', 'stalker'] },
  { text: 'already running when the lights came up', styles: ['berlin'], slot: 'open' },
  { text: 'the theme, and later the theme with everything on it', styles: ['cinematic'] },
  { text: 'raining somewhere, on a considerable budget', styles: ['cinematic'], moods: ['neon'] },
  { text: 'up a tone for the last one, and meant sincerely', styles: ['cinematic'], slot: 'close' },
  { text: 'the tune is in the bass, where it belongs', styles: ['machine'] },
  { text: 'four men, no expressions, one very good idea', styles: ['machine'] },
  { text: 'programmed, and with some affection', styles: ['machine', 'optical'] },
  { text: 'for dancing to, if you can catch it', styles: ['cosmic'], moods: ['neon'] },
  { text: 'a kick drum and a sequence that will not agree with it', styles: ['cosmic'] },
  { text: 'euphoric, and slightly out of breath', styles: ['cosmic'], moods: ['motorway'] },
  { text: 'five beats to the bar, none of them friendly', styles: ['stalker'] },
  { text: 'the same eight bars until you believe them', styles: ['stalker'], moods: ['dread'] },
  { text: 'somebody is behind you in this one', styles: ['stalker'], moods: ['dread'] },
  { text: 'the same group, brighter, and in a better mood', styles: ['optical'] },
  { text: 'an arpeggio with somewhere to be', styles: ['optical'], moods: ['motorway'] },
  { text: 'one bass line, and nowhere in particular to be', styles: ['outrun'] },
  { text: 'four chords, and none of them going anywhere', styles: ['outrun'], moods: ['motorway'] },
  { text: 'the pad breathes because the kick tells it to', styles: ['outrun', 'boulevard'] },
  { text: 'somebody brought a guitar to the sequencer', styles: ['darksynth'] },
  { text: 'a hundred and forty, and all of it uphill', styles: ['darksynth'], moods: ['dread'] },
  { text: 'the horror cue, with a band behind it', styles: ['darksynth'] },
  { text: 'the theme from a series nobody commissioned', styles: ['boulevard'] },
  { text: 'a slap bass, sincerely and without apology', styles: ['boulevard'], moods: ['neon'] },
  { text: 'headlights, and nothing to overtake', moods: ['motorway'] },
  { text: 'a long way out, and no plans to come back', moods: ['cosmos'] },
  { text: 'lit entirely from underneath', moods: ['neon'] },
  { text: 'played on equipment worth more than the hall', },
  { text: 'it does not stop. somebody turns it down', slot: 'close' },
];

/**
 * THE BILL — a Konzert, in a building with a dome on it.
 *
 * `handout`, shared with ambient and argued for the same way — this music has
 * no foreground and a bill with a headline on it would be promising something
 * else — and then everything printed on the layout disagrees with ambient's,
 * which is what a layout is for. The word is **Konzert** in all three decades
 * because the audience for the first one was German, the venues were
 * planetariums and cathedrals, and every later act in this genre is answering
 * that concert whether it means to or not.
 *
 * The papers are the three machines. 1974 is a technical document: grey board,
 * a faint plotting grid, roman numerals and a geometric face, printed by people
 * who thought of themselves as engineers. 1980 is the moment the machine became
 * an instrument you could afford — warmer stock, a chrome wash across it, and
 * violet, which is the colour that decade put on everything with a keyboard.
 * 1987 is digital and says so: cold white, cyan, and type set with no warmth in
 * it at all.
 */
const BILL: Record<string, BillHouse> = {
  modular: {
    layout: 'handout', word: 'Konzert', numeral: 'roman',
    stock: '#dcdcd6',
    grain: 'repeating-linear-gradient(0deg, rgba(40, 60, 70, .045) 0 1px, transparent 1px 9px), repeating-linear-gradient(90deg, rgba(40, 60, 70, .045) 0 1px, transparent 1px 9px)',
    ink: '#22262a', inkDim: '#767c80', hair: '#b2b6b0', accent: '#3d6478',
    face: "'Avenir Next', Avenir, ui-sans-serif, sans-serif",
    display: "'Century Gothic', Futura, 'Avenir Next', ui-sans-serif, sans-serif",
    displayWeight: 400,
    venue: { size: '.86em', track: '.26em', case: 'uppercase' },
    title: { size: '1.24em', track: '.1em', case: 'lowercase' },
  },
  polysynth: {
    layout: 'handout', word: 'Konzert', numeral: 'arabic',
    stock: '#e7e4ea',
    grain: 'linear-gradient(168deg, rgba(255, 255, 255, .95), rgba(196, 190, 214, .5) 58%, rgba(255, 255, 255, .8))',
    ink: '#221f2a', inkDim: '#77728a', hair: '#cbc4d6', accent: '#6b4ea8',
    face: "'Avenir Next', Avenir, 'Trebuchet MS', ui-sans-serif, sans-serif",
    display: "'Avenir Next', Avenir, 'Century Gothic', ui-sans-serif, sans-serif",
    displayWeight: 600,
    venue: { size: '.86em', track: '.2em', case: 'uppercase' },
    title: { size: '1.3em', track: '.02em', case: 'uppercase' },
  },
  digital: {
    layout: 'handout', word: 'Konzert', numeral: 'arabic',
    stock: '#f0f3f4',
    ink: '#151a1e', inkDim: '#6f7c84', hair: '#ccd6da', accent: '#1a8fa8',
    face: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    display: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    displayWeight: 700,
    venue: { size: '.84em', track: '.3em', case: 'uppercase' },
    title: { size: '1.22em', track: '.05em', case: 'uppercase' },
  },
  /**
   * The one bill in the file that is a *quotation* rather than a period, which
   * is the only honest way to print this era: its own header says the palette
   * overlaps the first three almost completely and that the overlap is the
   * point. So the sunset gradient and the magenta are 1984's, and everything
   * underneath them — a flat coated stock with no grain in it, hairlines, type
   * set at a weight no photosetter offered — is the laptop it was made on.
   * Nothing here is aged, because nothing here is old.
   */
  retrowave: {
    layout: 'handout', word: 'Konzert', numeral: 'arabic',
    stock: '#f1eff6',
    grain: 'linear-gradient(178deg, rgba(255, 255, 255, .96) 34%, rgba(226, 150, 196, .42) 62%, rgba(120, 96, 180, .3))',
    ink: '#1b1a26', inkDim: '#726f8c', hair: '#cfc9de', accent: '#c02a8e',
    face: "ui-sans-serif, 'Helvetica Neue', Arial, sans-serif",
    display: "'Avenir Next', Avenir, 'Century Gothic', ui-sans-serif, sans-serif",
    displayWeight: 300,
    venue: { size: '.82em', track: '.38em', case: 'uppercase' },
    title: { size: '1.26em', track: '.16em', case: 'uppercase' },
  },
};

export const STAGING: Staging = {
  room: HALL,
  wardrobe: WARDROBE,
  bill: BILL,
  /**
   * Polysynth, when the era is one this genre has no clothes for. 1978–83 is
   * where this repertoire is most itself — the era with the heaviest style
   * weights, the highest `keyChangeChance`, the vocoder and the film scores —
   * and a band from an unknown decade should turn up looking like that one.
   */
  defaultEra: 'polysynth',
  blurbs: BLURBS,
  /**
   * Between the jazz quintet and the ambient act, and nearer the quiet end.
   *
   * Two facts pulling opposite ways, which is why it is not simply low. There is
   * a pulse and it is unmissable — a four-on-the-floor under a sixteenth
   * sequence is the most physical thing in this project after a humppa — so the
   * bodies cannot be still. But nobody on this stage is *making* that pulse: it
   * is coming out of a box that will not speed up, slow down or look at anyone,
   * and a band nodding hard at a machine looks like a band pretending. The lead
   * player leans into the solo, everyone else keeps time with a machine that
   * does not need them to.
   */
  body: 0.6,
};
