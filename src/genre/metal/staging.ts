/**
 * What this music stages: a wall of amplifiers with a band standing in front of
 * it.
 *
 * The room, the clothes and the programme copy. `Staging` in `genre/types.ts`
 * argues why a genre carries its own rather than the renderer holding a registry
 * of them; the instruction at the top of `iskelma/staging.ts` is the one worth
 * repeating, because none of these comments is legible on its own. Read the
 * pavilion, the cellar, the black box and the lawn before this one — two of the
 * decisions below are made *against* them.
 *
 * The first is that this room is **indoors and has a roof it is fighting**. The
 * pavilion and the lawn are outdoors for opposite reasons and both of them get to
 * be pretty about it; this one is a shed with a low ceiling and too much sound in
 * it, and the fixtures across four decades are a record of the building slowly
 * losing that fight — drapes, then brick, then a lighting truss bolted to the
 * roof beams, then a haze machine because by 1995 the room is too big to see
 * across.
 *
 * The second is `backline`. Its own line in `venue.ts` calls it *the defining
 * object of a rock stage*, and it is in this room's genre-wide props rather than
 * in any era's, because there has never been a decade of this music where it was
 * absent. A backline faces the *band*: it is a wall of the group's own
 * amplifiers, pointed the wrong way from the audience's point of view, and it is
 * the single object that tells you at a glance which room in this project you are
 * looking at.
 *
 * That read *the eleven rooms*, and neither number the sentence could have meant
 * is eleven: there are **nineteen** rooms — one `staging.ts` per genre — standing
 * on **twelve** architectures, which is the count `RoomStyle`'s own docstring
 * gives. The figure is dropped rather than corrected because the claim is about
 * what one object does to a picture and the arithmetic was never load-bearing.
 */

import type { Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE SHED — metal.
 *
 * Twelve metres by seven, which is the joint-widest floor in the project and not
 * the largest, and the reason is the band rather than the audience.
 *
 * **This said *the largest* and it is not.** Classical is 12 by 7.5 — the same
 * width and half a metre deeper, 90 m² against 84 — and both files were written
 * in the same commit by different authors, which is how two rooms came to claim
 * one superlative. The width half survives: 12 is the widest number in the
 * catalogue and classical is the only other room at it, with funk's 11.5 and
 * latin's 11.4 behind. Depth is where the two part, and correctly so — an
 * orchestra is ranked and a metal band is a line. A late line-up here is two
 * guitarists, a bass, a singer, a kit on a riser and — in the symphonic and
 * gothic styles — a keyboard as well, and `chooseVenue` runs before the cast
 * exists, so the boards have to hold the biggest group the genre can produce
 * standing well apart from each other. They stand apart because they move: this
 * is the one repertoire in the project where a player is expected to occupy
 * several square metres by themselves.
 *
 * `audience: { rows: 10, density: 0.94, seated: false }` — the densest crowd
 * here, just past the lawn's nine rows at 0.9, and the difference is a real one
 * rather than a nudge. A sound-system dance is full of people dancing, which
 * needs a little room each; this is full of people facing the same direction and
 * pressed forward, which needs none. `seated` is false in every era including the
 * first, because nobody has ever sat down at one of these.
 *
 * `riser` sits in the room's own props rather than in any era's `maybe`, because
 * `cast.ts` stands the drummer 0.4 m up whatever the dressing says and a
 * probabilistic riser would leave them floating half the time. This genre wants a
 * conspicuously large one; the engine's is a fixed size, which is the one thing
 * about this room that is smaller than it should be.
 */
const SHED: StageRoom = {
  id: 'shed',
  architecture: 'shed',
  names: [
    'The Marquee', 'The Iron Works', 'Rondo Hall', 'The Old Bus Depot',
    'Vulcan Rooms', 'The Ironmonger',
  ],
  width: 12, depth: 7,
  audience: { rows: 10, density: 0.94, seated: false },
  /**
   * Two props belong to the genre rather than to any decade of it: the drum
   * platform, and the wall of the band's own amplifiers behind them. See the
   * header for why the second one is not an era's to decide.
   */
  props: ['riser', 'backline'],
  eras: {
    /**
     * 1972. A civic hall with a stage at one end, black drapes hung over
     * whatever the council put on the back wall, and one PA on poles. Tungsten
     * and dust: everything is warm and slightly brown, because the lighting is
     * two rows of par cans with orange gel in them and there is nothing else.
     *
     * `mirror-ball` in the `maybe` and nowhere else in this file, because this is
     * the only era where the building was a *dance hall* on the other six nights
     * of the week and the fittings had not been taken down.
     */
    heavy: {
      palette: {
        boards: '#6b4a2e',
        backdrop: '#1c1712',
        curtain: '#4a2118',
        proscenium: '#8a7050',
        ambient: '#ffb469',
      },
      props: ['drapes', 'pa-stack', 'wedges', 'rug', 'beams'],
      maybe: [['mirror-ball', 0.25], ['posters', 0.45], ['railing', 0.3]],
      fog: 0.24,
    },
    /**
     * 1982. The room has moved downstairs. Brick, a low ceiling, a bar along one
     * side and the posters of every band that played here since 1977 layered four
     * deep on the back of the door.
     *
     * `brick` is the room modifier and it is the only one this era gets — a
     * decision with a cost, because `haze` would also be true of this room and
     * the two cannot both be had. Brick wins because it is what the *photographs*
     * of this decade are of, and because the fog value below can say the air
     * without needing a fixture that a cellar would not have had anyway.
     *
     * The palette turns cold at the top and stays warm on the boards, which is
     * what a room lit by four par cans over a floor lit by nothing looks like.
     */
    nwobhm: {
      palette: {
        boards: '#5a4632',
        backdrop: '#161a20',
        curtain: '#5a1c2a',
        proscenium: '#7e7466',
        ambient: '#ffd08a',
      },
      props: [
        'brick', 'low-ceiling', 'pa-stack', 'wedges', 'posters', 'bar',
        'neon',
      ],
      maybe: [['railing', 0.4], ['flight-case', 0.35], ['rug', 0.3]],
      fog: 0.32,
      grow: [0.3, 0.2],
    },
    /**
     * 1988. The room is a hall again and this time it is the band's, not the
     * council's. A truss over the stage, cases still on the boards because
     * nobody had time, and enough haze in the air to make the lights into objects
     * — which is the point of haze and is why it is the modifier here.
     *
     * The palette goes hard and cold. This is the decade where the lighting
     * became blue and white by default and the warm gel went in the skip, and the
     * boards get darker every era from here.
     */
    thrash: {
      palette: {
        boards: '#3e3830',
        backdrop: '#0e1116',
        curtain: '#2a2f38',
        proscenium: '#6a7480',
        ambient: '#a8d4ff',
      },
      props: [
        'haze', 'truss', 'pa-stack', 'wedges', 'flight-case',
        'posters', 'crowd-barrier',
      ],
      maybe: [['neon', 0.3], ['railing', 0.4], ['bar', 0.5]],
      fog: 0.5,
      grow: [0.8, 0.4],
    },
    /**
     * 1995. A festival tent or a hall built for four thousand, with a screen
     * behind the band because the back of the room can no longer see them.
     *
     * `screen` rather than `projection`, and the distinction is the whole date:
     * a projection is film on a cloth and belongs to 1972; an LED wall is a
     * light source of its own and changes what colour the band is. The palette
     * says so — the ambient is the coldest in the file and the boards are nearly
     * black, because everything anybody sees on this stage is coming from behind
     * the players rather than from in front of them.
     */
    extreme: {
      palette: {
        boards: '#2b2926',
        backdrop: '#080a0d',
        curtain: '#1b2028',
        proscenium: '#565f6b',
        ambient: '#8fb6e8',
      },
      props: [
        'haze', 'truss', 'screen', 'crowd-barrier', 'pa-stack', 'wedges',
        'flight-case',
      ],
      maybe: [['posters', 0.25], ['railing', 0.45]],
      fog: 0.62,
      grow: [1.4, 0.8],
    },
  },
  fallback: {
    palette: {
      boards: '#4a4038', backdrop: '#12151a', curtain: '#3a2028',
      proscenium: '#75798a', ambient: '#d8c0ff',
    },
    props: ['pa-stack', 'wedges', 'posters'],
    fog: 0.4,
  },
};

const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1972. Denim, velvet and a great deal of hair, and nothing on stage matches
   * anything else on stage.
   *
   * `uniform: 0.08` is the lowest number in the project, under even the roots
   * band's 0.15, and it is accurate: these are five people who got dressed
   * separately in a house they were all living in. `velvet` is the era's one
   * indulgence and it is doing real work — it absorbs light almost completely, so
   * a velvet jacket under a par can reads as a *hole* in the picture, which is
   * exactly what those photographs look like.
   *
   * `moustache` at 0.5 and `beard` at 0.3, which is higher than anywhere else
   * here, and the follow-up is that they are almost never together on the same
   * player: `EXCLUSIVE` in `cast.ts` allows one facial hair per person.
   */
  heavy: {
    jackets: ['#3a2a1e', '#4a2a3e', '#2f3a2a', '#5a3a1e', '#28242e', '#6b4a2e'],
    shirts: ['#c9b48a', '#8a6a4a', '#d4c4a0', '#7a4a4a', '#b0a68e'],
    trousers: ['#33404f', '#3a3228', '#2b2b33', '#4a3a2a'],
    accents: ['#a8321f', '#7a3a8a', '#c8952b'],
    loud: ['#7a3a8a', '#a8321f'],
    hair: ['#2e1d10', '#4a3018', '#6b4423', '#0d0d0d', '#8a6b3a', '#1c1209'],
    hairStyles: [['long', 6], ['mane', 4], ['curls', 3], ['short', 2], ['afro', 1], ['bald', 1]],
    accessories: [['moustache', 0.5], ['beard', 0.3], ['sunglasses', 0.2], ['scarf', 0.2], ['hoops', 0.1]],
    fabrics: [['denim', 5], ['velvet', 4], ['corduroy', 3], ['satin', 2], ['leather', 1]],
    /**
     * The cut-off, and it is this genre's garment for the next twenty-three
     * years.
     *
     * `waistcoat` is a sleeveless body over a shirt, which is a sentence about a
     * folk fiddler in 1850 and a court keyboard player in 1720 and — without
     * changing a word — about a denim jacket with the sleeves taken off it. That
     * is the single largest thing the union turned out to be able to do, and it
     * was not designed for it: the member was put in for `country:stringband`
     * and `classical:baroque`, and it fits a battle jacket exactly, because the
     * thing that makes all four read is the *shoulder*. A jacketed shoulder is
     * padded and square and a shirt shoulder is not, and a cut-off is a garment
     * whose entire point is the arm coming out of it.
     *
     * Four to six against the suit in 1972, which is the right ratio for the
     * earliest era: `denim` heads the fabric table but the jacket still has
     * sleeves on it half the time, and `velvet` at 4 is a real tailored jacket
     * on somebody. The weight climbs in every era after this one, which is the
     * decade-by-decade shape of the genre said in one number.
     */
    garments: [['suit', 6], ['waistcoat', 4]],
    loudFabric: 'velvet', sequinChance: 0,
    matched: 0.2, uniform: 0.08, spotlight: 0.35,
  },
  /**
   * 1982. Leather over denim, and the one hairstyle this whole project needed a
   * new word for.
   *
   * **`mane` at the top of the table, and `long` beneath it, and they are not the
   * same thing.** The type's own comment draws the line: `long` is curtains to
   * the shoulder and `mane` is past the shoulder blades and forward over the
   * collarbones as well. That second silhouette is what a NWOBHM band looks like
   * from the back of a room — it changes the *outline of the torso*, not just the
   * head — and getting it with `long` would have staged four members of a
   * mid-seventies folk-rock group.
   *
   * Studded wristbands are not available and cannot be added. `Attachments`
   * exposes `head` and `torso` and nothing else, so there is no wrist to anchor
   * one to; the leather and the chain carry as much of that look as exists.
   *
   * `sequinChance: 0.12` is the only non-zero one in the file, and it is for the
   * two bands in the era who were honestly a glam act. One person in something
   * reflective in front of four in black leather is 1986; everybody in it is a
   * pantomime, which is what the field is for.
   */
  nwobhm: {
    jackets: ['#141416', '#2a2a2e', '#1e2a3e', '#3a1e28', '#4a3a24', '#5a5a5e'],
    shirts: ['#ffffff', '#1a1a1a', '#c8c4bc', '#8a1f2b'],
    trousers: ['#141416', '#26313f', '#2b2b2b'],
    accents: ['#c8352b', '#d4a72b', '#8f2fa8', '#2b6fd4'],
    loud: ['#d4a72b', '#c8352b'],
    hair: ['#0d0d0d', '#2e1d10', '#4a3018', '#6b4423', '#8a6b3a', '#b09060'],
    hairStyles: [['mane', 7], ['long', 4], ['curls', 3], ['mullet', 2], ['short', 2], ['bald', 1]],
    accessories: [['bandana', 0.35], ['chain', 0.3], ['wraparounds', 0.15], ['beard', 0.15], ['hoops', 0.12]],
    fabrics: [['leather', 5], ['denim', 5], ['vinyl', 2], ['satin', 2], ['wool', 1]],
    /**
     * The cut-off takes the table, and the fabric list beside it explains why.
     *
     * `leather` and `denim` are level at 5 up there, and the object this era is
     * actually about is both of them at once: a leather jacket with a denim
     * cut-off over it. The rig cannot layer two garments — there is one `shell`
     * and one set of sleeves — so the layering is expressed the only way it can
     * be, by weighting the sleeveless body over the jacket six to four and
     * letting the fabric draw decide which of the two bolts it came off.
     *
     * The other reason this is the right era for it is the hair. `mane` at 7
     * above is past the shoulder blades and forward over the collarbones, and
     * the note on it says that is what changes the outline of the *torso* rather
     * than the head. A bare shoulder under a mane is the NWOBHM silhouette; the
     * same hair over a suit jacket is a mid-seventies folk-rock group, which is
     * the failure the hair table's own comment was already worrying about.
     */
    garments: [['waistcoat', 6], ['suit', 4]],
    loudFabric: 'satin', sequinChance: 0.12,
    matched: 0.15, uniform: 0.12, spotlight: 0.45,
  },
  /**
   * 1988. The leather goes, and it goes deliberately.
   *
   * Thrash defined itself against the wardrobe above as much as against the
   * music: the uniform is a band shirt, cut-off denim, white high-tops and no
   * jacket at all, and the whole statement is that nobody has dressed for this.
   * `flannel` is in the table two years before anybody in Seattle made it famous,
   * which is correct — it is what people wore, and the type's comment on it is
   * why it earns a place: brushed until it has no grain, so it catches *nothing*
   * under a rim light, where corduroy's ribs would catch lines.
   *
   * `spotlight: 0.28` is the lowest here. There is a singer, but the idea that
   * they should be dressed better than the guitarist would have been a serious
   * accusation.
   */
  thrash: {
    jackets: ['#1a1a1c', '#243040', '#2e2a24', '#3a3a3e', '#14181c', '#4a4438'],
    shirts: ['#141414', '#ffffff', '#2b3a4a', '#6a2a2a', '#3a4a3a'],
    trousers: ['#26313f', '#1a1a1c', '#3a4250'],
    accents: ['#d43a2b', '#e8e4dc', '#2bb4d4'],
    loud: ['#e8e4dc', '#d43a2b'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018', '#6b4423'],
    hairStyles: [['mane', 6], ['long', 4], ['mullet', 2], ['short', 2], ['curls', 2], ['bald', 1]],
    accessories: [['bandana', 0.3], ['beard', 0.2], ['wraparounds', 0.15], ['beanie', 0.1], ['towel', 0.15]],
    fabrics: [['denim', 5], ['flannel', 3], ['leather', 2], ['nylon', 2], ['knit', 1]],
    /**
     * *No jacket at all*, says the era comment, and seven to three is as close
     * to that as the union goes.
     *
     * The highest `waistcoat` weight in the project, and it is not the same
     * garment the two eras above it are wearing even though it is the same word.
     * There it is worn *over* something and read as an extra layer; here the
     * band shirt underneath is the whole outfit and the cut-off is the only
     * thing on top of it, which is why the weight goes up at the same moment
     * `leather` falls from 5 to 2. Thrash defined itself against the wardrobe of
     * 1982, and the way it did that was by removing an item rather than adding
     * one.
     *
     * `suit` survives at 3 and it is the bass player's denim jacket with the
     * sleeves still attached. A table at ten to nought would be a costume
     * department's idea of a subculture; three in ten is what a photograph of
     * five of them looks like.
     */
    garments: [['waistcoat', 7], ['suit', 3]],
    loudFabric: 'denim', sequinChance: 0,
    matched: 0.1, uniform: 0.1, spotlight: 0.28,
  },
  /**
   * 1995. Black on black, and the one era of this genre that genuinely has a
   * uniform.
   *
   * `uniform: 0.4` is a large number for this file and it is the accurate one:
   * a black metal band dressed alike on purpose, to the point of it being a
   * costume, and a death metal band all wore the same black t-shirt without
   * having discussed it. The two arrive at the same picture from opposite ends of
   * how much thought went into it.
   *
   * `bald` at 3 is the other change and it is the decade rather than the genre —
   * the shaved head arrives here and never leaves. `mohawk` is present at 1, low,
   * because it belongs to the crossover and grindcore end and staging it on a
   * symphonic band would be a costume party.
   */
  extreme: {
    jackets: ['#0e0e10', '#16161a', '#1c1a22', '#242028', '#0a0c10', '#2e2a30'],
    shirts: ['#0e0e10', '#1a1a1a', '#2a2630', '#d8d4cc'],
    trousers: ['#0e0e10', '#16161a', '#221e26'],
    accents: ['#a8202b', '#5a2b8a', '#c8c4bc'],
    loud: ['#a8202b', '#c8c4bc'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018'],
    hairStyles: [['mane', 6], ['long', 4], ['bald', 3], ['short', 2], ['braids', 1], ['mohawk', 1]],
    accessories: [['beard', 0.4], ['chain', 0.25], ['wraparounds', 0.2], ['bandana', 0.15], ['earrings', 0.15]],
    fabrics: [['leather', 5], ['vinyl', 3], ['denim', 2], ['flannel', 2], ['knit', 1]],
    /**
     * The cassock, and it is the one entry in this file that is a costume on
     * purpose.
     *
     * `robe`'s own note in `concert/types.ts` lists what the member is for — *a
     * thobe, a kaftan, a galabeya, a cassock, a choir robe* — and says out loud
     * that a cassock and a thobe are one silhouette and that this is a judgement
     * rather than an oversight. This is the era that collects on it. A black
     * metal band in 1995 dressed alike on purpose, to the point of it being a
     * costume, and the costume was frequently a monk's habit; the same member
     * that puts a takht player in a galabeya puts this band in one, and the two
     * rows on the bench are unmistakably not each other because everything else
     * about them differs.
     *
     * One in ten rather than more, because `uniform: 0.4` is a claim about the
     * black t-shirts as much as about the theatrical half of the genre — the era
     * comment says the two arrive at the same picture from opposite ends of how
     * much thought went into it. `waistcoat` at 5 is the thoughtless end and
     * still leads.
     */
    garments: [['waistcoat', 5], ['suit', 4], ['robe', 1]],
    loudFabric: 'vinyl', sequinChance: 0,
    matched: 0.4, uniform: 0.4, spotlight: 0.25,
  },
};

/**
 * Metal: a flyer stapled to a lamp post.
 *
 * The register is the house one — affectionate, dry, and never a critic's — and
 * this genre needs one warning the others do not. **It is not a parody.** Metal
 * has been the butt of a well-loved joke since 1984 and every obvious line here
 * has already been written by that film, so anything below that reaches for the
 * volume knob, the number of amplifiers or the darkness of the subject matter is
 * borrowing somebody else's punchline. What is left is what the *evening* is
 * actually like: the equipment, the arithmetic of the metres, the hearing, the
 * merch table, and the fact that the band are having a much better time than they
 * look like they are.
 *
 * Nothing here explains anything. A line that told the audience where the seven
 * was would be a lecture, and they can count it or they cannot.
 */
const BLURBS: Blurb[] = [
  { text: 'the amplifiers arrived in their own van', slot: 'open' },
  { text: 'one guitar, and it turned out to be enough', styles: ['heavy'] },
  { text: 'three chords, and one of them is the interesting one', styles: ['heavy', 'stoner'] },
  { text: 'nobody is in a hurry. nobody has ever been in a hurry', styles: ['doom', 'sludge'], moods: ['crushing'] },
  { text: 'two guitars, a third apart, all evening', styles: ['nwobhm', 'melodeath', 'power'], moods: ['soaring'] },
  { text: 'somebody is going to hold a note for a very long time', styles: ['power', 'symphonic'], moods: ['epic'] },
  { text: 'the right arm does not stop for four minutes', styles: ['thrash'] },
  { text: 'faster than the last one, which was also the fastest', styles: ['speed', 'crossover'], moods: ['savage'] },
  { text: 'both feet, all night', styles: ['death', 'power', 'techdeath'] },
  { text: 'the bar is not four long. you will get used to it', styles: ['progressive', 'techdeath'], moods: ['technical'] },
  { text: 'it comes back round every seventh bar. that is on purpose', styles: ['djent'] },
  { text: 'it goes quiet, and then it very much does not', styles: ['postmetal', 'sludge'] },
  { text: 'a cold rehearsal room, and they are proud of that', styles: ['black'], moods: ['cold'] },
  { text: 'there is an orchestra tonight and it is losing', styles: ['symphonic', 'gothic'] },
  { text: 'somebody brought a fiddle and nobody stopped them', styles: ['folkmetal'] },
  { text: 'the drum machine has not asked for a break', styles: ['industrial'] },
  { text: 'everything stops, and then it stops harder', styles: ['metalcore', 'groove'] },
  { text: 'the solo has more notes in it than the song', styles: ['shred', 'techdeath'] },
  { text: 'hairspray, and a key change nobody asked for', styles: ['glam'] },
  { text: 'the merch table is doing better than the bar' },
  { text: 'your ears will be fine by thursday', slot: 'close' },
  { text: 'they will play the fast one last', slot: 'close' },
];

export const STAGING: Staging = {
  room: SHED,
  wardrobe: WARDROBE,
  /**
   * The new wave, when the era is one this genre has no clothes for. It is the
   * decade where the line-up settled into the shape it has kept ever since — two
   * guitars, bass, kit, singer — and the other three are legible as the approach
   * to it and the departures from it.
   */
  defaultEra: 'nwobhm',
  blurbs: BLURBS,
  /**
   * Just under the dance band, and above everything else here.
   *
   * `body` is a multiplier on the *players*, and this is the most physically
   * demonstrative group of people in the project by a distance: the audience's
   * name for what they are doing to their own necks is derived from the music, an
   * honour no other genre here can claim. It stays under 1.0 for one reason, and
   * it is a mechanical one — a guitarist playing sixteen downstrokes to the bar
   * at 190 has a right arm that is fully committed and cannot also be doing
   * anything expressive with it. The bass player and the singer make up most of
   * the difference and the drummer makes up none of it, because both of their
   * feet are busy too.
   */
  body: 0.95,
};
