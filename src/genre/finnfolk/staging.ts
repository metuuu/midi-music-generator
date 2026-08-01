/**
 * What this music stages: a barn with the doors shut, because it is October.
 *
 * The room, the clothes and the programme copy. `Staging` in `genre/types.ts`
 * argues why a genre carries its own rather than the renderer holding a registry
 * of them, and the instruction at the top of `iskelma/staging.ts` is the one
 * worth repeating: these comments are not legible on their own, and several of
 * the decisions below are made *against* a neighbour.
 *
 * The neighbour here is two folders away and is the whole problem. **Iskelmä
 * already owns the Finnish room.** The pavilion is `open-air`, `birch`, `lake`,
 * `bunting`, `paper-lanterns`, `moths`, `railing`, `dance-floor` — a roofed
 * wooden floor at the edge of a lake with a dance on it — and any second Finnish
 * genre that reached for that vocabulary would be staging the same building with
 * a different band in it.
 *
 * So this room is the same country and the opposite half of the year. A
 * tanssilava is outdoors because Finland has six weeks of summer; a *riihi* — a
 * threshing barn, emptied after harvest and swept — is indoors because the other
 * forty-six weeks also happen, and it is where a village danced when it could
 * not dance outside. Reggae's lawn makes the same comparison from Kingston and
 * lands on the opposite answer for its own reason. Three rooms, three arguments,
 * and only one of them has walls.
 *
 * **No room modifier in any era, which is a deliberate absence.** `open-air`
 * belongs to the pavilion and the lawn, `brick` is a cellar, `black-box` is a
 * gallery, and a log barn is none of those. What makes this room legible is
 * `beams` — exposed roof timbers, well overhead — and `hay`, which is the one
 * prop in the whole vocabulary that says *this building was for something else
 * yesterday*. The single exception is `haze` in the contemporary era's `maybe`,
 * and it is allowed because it is the only era where somebody brought a machine.
 */

import type { Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE RIIHI — Finnish folk.
 *
 * A log threshing barn with the floor swept and the doors shut. Nine rows at
 * 0.74 and `seated: false`, because for three of the four eras below the
 * audience *is* the dance — there is no distinction between the people watching
 * and the people doing it, which is the fact this room has to get right.
 *
 * The revival era is the exception and it is outvoted, exactly as reggae's
 * `countIn` is outvoted by three eras out of four: from 1968 the audience sits
 * down in rows and watches, and a room that changed its seating per era would be
 * a second building. What the later dressings do instead is take the hay out and
 * put a PA in, which is the same change said in props.
 *
 * 9.6 metres, and the constraint is the revival rather than the tradition. A
 * pelimanni band is four people and a runo singer is one; a Kaustinen soittokunta
 * is ten, `chooseVenue` runs before the cast exists, and the boards have to hold
 * the largest band the genre can produce. Nothing below 8.5 has been tried and
 * this needs more than that.
 *
 * `riser` sits in the room's own props rather than in any era's `maybe`, and it
 * is the one prop here that is not about the room at all: `cast.ts` stands a
 * drummer 0.4 m up whatever the dressing says, six styles have a kit, and a
 * probabilistic riser would leave them floating on the seeds that did not draw
 * it. In a barn it is a plank across two trestles, which is what the stage was
 * anyway.
 */
const RIIHI: StageRoom = {
  id: 'riihi',
  names: ['Ojalan riihi', 'Isontalon tupa', 'Näppärilä', 'Rekilän lato', 'Kaustisen seuratalo', 'Purpurin pirtti'],
  width: 9.6, depth: 6.2,
  audience: { rows: 9, density: 0.74, seated: false },
  /**
   * Two props belong to the building rather than to any century of it: the roof
   * it is holding up, and the platform somebody is standing on. See above for
   * why the second one is not optional.
   */
  props: ['beams', 'riser'],
  eras: {
    /**
     * The archaic layer. One candle per surface and no other light at all, wood
     * that has never been painted, and the hay still in the room because nobody
     * has cleared it for a dance — this era is a room somebody is singing in
     * rather than a room anybody is performing in.
     *
     * `rug` rather than `carpet`, and the distinction is the one `PropName`
     * draws: a carpet is a floor covered wall to wall for a band that sits on
     * it, and a rug is a worn thing put down where the players are.
     */
    runo: {
      palette: {
        boards: '#8a6a44',
        backdrop: '#241d16',
        curtain: '#4a3a2a',
        proscenium: '#b39a76',
        ambient: '#ffcf8a',
      },
      props: ['hay', 'candles', 'rug'],
      maybe: [['flowers', 0.25], ['low-ceiling', 0.3]],
      fog: 0.12,
    },
    /**
     * The wedding. The hay is pushed to the walls, the floor is swept for
     * dancing, and somebody has strung pennants across the front — which is
     * `bunting`, and yes, the pavilion has it too. Sharing one prop with iskelmä
     * is not the collision the header is worried about: pennants across an
     * opening are what a Finnish celebration looks like in any building, and the
     * pavilion's own comment says exactly that about itself.
     */
    pelimanni: {
      palette: {
        boards: '#a07b4c',
        backdrop: '#2a2118',
        curtain: '#6b3a2c',
        proscenium: '#cbb187',
        ambient: '#ffd79a',
      },
      props: ['hay', 'candles', 'dance-floor', 'bunting', 'rug'],
      maybe: [['flowers', 0.5], ['fairy-lights', 0.3]],
      fog: 0.14,
      grow: [0.2, 0],
    },
    /**
     * 1975. The hay is gone, there are bulbs strung across the beams, and there
     * is a small PA — which is the whole event of this era in one prop. A folk
     * ensemble with a microphone in front of it is an ensemble whose audience
     * has stopped moving, and everything else about the revival follows from
     * that.
     *
     * Flowers in the always-props rather than the maybes, which no other
     * dressing in the project does. A Kaustinen stage is banked with them; it is
     * a festival in a village in July and the decoration is the village saying
     * so.
     */
    revival: {
      palette: {
        boards: '#b08a55',
        backdrop: '#1e2a20',
        curtain: '#7a3a3a',
        proscenium: '#ddc79a',
        ambient: '#ffdca8',
      },
      props: ['dance-floor', 'fairy-lights', 'bunting', 'flowers', 'pa-stack', 'wedges'],
      maybe: [['posters', 0.4], ['hay', 0.3], ['rug', 0.35]],
      fog: 0.16,
      grow: [0.5, 0.25],
    },
    /**
     * 2005. A barn with a lighting truss in it, which is a real thing that
     * happens at Kaustinen every summer and looks exactly as odd as it sounds.
     * The palette goes cold overhead and stays warm on the boards, because a
     * wooden floor lit by tungsten under a rig lit by LEDs is what the room
     * genuinely is.
     *
     * `haze` in the `maybe` is the one room modifier this genre uses anywhere,
     * and it is here because it is the one era where somebody arrived with a
     * machine that makes it. On the seeds that do not draw it, `fog` at 0.24
     * still carries a barn full of people in August.
     */
    contemporary: {
      palette: {
        boards: '#96754a',
        backdrop: '#151b22',
        curtain: '#3f4a5a',
        proscenium: '#9aa6b4',
        ambient: '#cfe4ff',
      },
      props: ['dance-floor', 'pa-stack', 'wedges', 'backline', 'truss', 'cables'],
      maybe: [['haze', 0.35], ['flight-case', 0.4], ['fairy-lights', 0.3]],
      fog: 0.24,
      grow: [0.8, 0.4],
    },
  },
  fallback: {
    palette: {
      boards: '#9c7748', backdrop: '#26201a', curtain: '#6b3a2c',
      proscenium: '#c6ac82', ambient: '#ffd49a',
    },
    props: ['hay', 'dance-floor', 'candles', 'rug'],
    fog: 0.14,
  },
};

const WARDROBE: Record<string, Wardrobe> = {
  /**
   * The archaic layer. Undyed linen and homespun wool, and that is the entire
   * palette — every colour below is something a plant or a lichen produces,
   * because nothing else was available and the wardrobe should say so.
   *
   * `uniform: 0.05` is the lowest number in the project by a distance, and it is
   * not the ambient argument. Ambient's absent uniform *is* the uniform: five
   * people who have all separately decided to look like nobody. Here there is no
   * band to be uniformed — there is a person singing and a person accompanying
   * them, and they are wearing what they were wearing anyway.
   *
   * `wrap` and `braids` at the head of the hair table. A married woman covers
   * her hair and an unmarried one wears it plaited, and those are the two
   * silhouettes this era actually had.
   */
  runo: {
    jackets: ['#c9bda4', '#a89878', '#8a7a5c', '#b5a68a', '#7a6b52', '#9c8f74'],
    shirts: ['#e8e0cc', '#d9d0ba', '#efe8d6'],
    trousers: ['#5a4c38', '#6b5c44', '#463b2c'],
    accents: ['#8a2f24', '#3f5a3a', '#7a5c1f'],
    loud: ['#8a2f24', '#7a5c1f'],
    hair: ['#3b2a18', '#5a4326', '#7a5c34', '#a8875a', '#c9ac72', '#8a3c24', '#cfc7b8'],
    hairStyles: [['wrap', 5], ['braids', 5], ['long', 3], ['short', 2], ['updo', 2]],
    accessories: [['beard', 0.45], ['scarf', 0.35], ['moustache', 0.15]],
    fabrics: [['linen', 6], ['wool', 5], ['flannel', 1]],
    loudFabric: 'linen', sequinChance: 0,
    matched: 0.25, uniform: 0.05, spotlight: 0.15,
  },
  /**
   * The pelimanni wedding, and where `brocade` arrives.
   *
   * It is the only fabric in the union that changes a player's *shape* — it adds
   * an accent placket and a hem border — which is a startlingly exact
   * description of an embroidered folk waistcoat, and it is the reason that
   * fabric exists. It is on the `loud` slot rather than in the general table
   * because that is what the object is: one person, usually the fiddler being
   * paid, in the good waistcoat, in front of four people in wool.
   *
   * `flatcap` at 0.4 and no other hat. `EXCLUSIVE` in `cast.ts` allows one hat
   * per player, so weighting a second would buy nothing and waste a draw.
   */
  pelimanni: {
    jackets: ['#3a3226', '#5a4a34', '#2e3a33', '#6b5a3f', '#4a3428', '#7a6a4e'],
    shirts: ['#ffffff', '#f2ead6', '#e4dcc4'],
    trousers: ['#2e2a22', '#463b2c', '#3a3a30'],
    accents: ['#a8241f', '#1f5a3a', '#c9a02b', '#2f4a7a'],
    loud: ['#a8241f', '#c9a02b', '#ffffff'],
    hair: ['#2b1b12', '#4a2f1b', '#6b4423', '#8d6a3f', '#c9a86a', '#a83e2b', '#cfc7b8'],
    hairStyles: [['braids', 4], ['short', 4], ['long', 3], ['updo', 3], ['slick', 2], ['wrap', 2]],
    accessories: [['beard', 0.4], ['flatcap', 0.4], ['scarf', 0.3], ['moustache', 0.3]],
    fabrics: [['wool', 6], ['linen', 4], ['brocade', 2], ['flannel', 1]],
    loudFabric: 'brocade', sequinChance: 0,
    matched: 0.5, uniform: 0.25, spotlight: 0.45,
  },
  /**
   * 1975, and the one era in this genre where the clothes are a uniform.
   *
   * `uniform: 0.8` is the highest number in the file and it is the same figure
   * jazz's swing era and reggae's ska era carry — for a completely different
   * reason, and that is worth saying plainly. Those two bands matched because
   * they were a *section*, dressed as one, by a bandleader. A Kaustinen ensemble
   * matches because every player is wearing a **kansallispuku**, the parish
   * national costume, which is a garment with a documented pattern that is the
   * same for everybody from that parish. It is not a stage uniform that happens
   * to look traditional; it is a traditional garment that happens to work as a
   * stage uniform, and the revival is precisely the moment somebody noticed.
   *
   * So `brocade` moves out of the `loud` slot and into the general table at real
   * weight: here the embroidered placket is on all ten of them.
   */
  revival: {
    jackets: ['#e8e0cc', '#1f4a7a', '#a8241f', '#2f5a3a', '#f2ead6', '#5a3a6b'],
    shirts: ['#ffffff', '#fdf6e3', '#f2ead6'],
    trousers: ['#1f2a3a', '#2e2a22', '#e8e0cc'],
    accents: ['#c9241f', '#1f6b9c', '#e8c22b', '#1f7a4a'],
    loud: ['#c9241f', '#e8c22b'],
    hair: ['#2b1b12', '#4a2f1b', '#6b4423', '#8d6a3f', '#c9a86a', '#a83e2b', '#d9d4cc'],
    hairStyles: [['braids', 5], ['updo', 4], ['short', 3], ['long', 3], ['bob', 2], ['slick', 2]],
    accessories: [['scarf', 0.4], ['beard', 0.35], ['glasses', 0.3], ['earrings', 0.25]],
    fabrics: [['wool', 5], ['linen', 4], ['brocade', 4], ['velvet', 1]],
    loudFabric: 'brocade', sequinChance: 0,
    matched: 0.75, uniform: 0.8, spotlight: 0.35,
  },
  /**
   * 2005. Black, and deliberately so.
   *
   * The costume comes straight off again — a folk department graduate spent
   * their childhood in a kansallispuku at festivals and has views about it — and
   * what replaces it is what everybody in a conservatoire wears, which is
   * nothing in particular in dark colours. `uniform: 0.15` is nearly the runo
   * era's number arrived at from the opposite direction: there nobody had a band
   * to dress, here nobody will admit to being in one.
   *
   * `brocade` survives at weight 1 and it is the only interesting thing in this
   * table. Somebody in this band is wearing one embroidered thing, on purpose,
   * as a quotation.
   */
  contemporary: {
    jackets: ['#1a1a1e', '#2b2b30', '#3a3a42', '#1f2a2a', '#4a3f38', '#26303a'],
    shirts: ['#ffffff', '#e4e0d8', '#1a1a1e', '#c9c2b4'],
    trousers: ['#1a1a1e', '#2b2b30', '#3a3a42'],
    accents: ['#c9241f', '#1f9c8a', '#e8c22b', '#7a4aff'],
    loud: ['#c9241f', '#e8c22b'],
    hair: ['#101010', '#2b1b12', '#4a2f1b', '#6b4423', '#c9a86a', '#a83e2b', '#d9d4cc'],
    hairStyles: [['long', 4], ['short', 4], ['updo', 3], ['braids', 3], ['bob', 2], ['bald', 1]],
    accessories: [['glasses', 0.4], ['beard', 0.35], ['scarf', 0.25], ['earrings', 0.25]],
    fabrics: [['wool', 4], ['knit', 4], ['denim', 3], ['linen', 3], ['brocade', 1]],
    loudFabric: 'wool', sequinChance: 0,
    matched: 0.4, uniform: 0.15, spotlight: 0.3,
  },
};

/**
 * Finnfolk: a programme for a barn.
 *
 * The register is the house one — affectionate, dry, never a critic's — and this
 * table has one rule of its own that iskelmä's does not need. **It must not
 * sound like iskelmä's.** That bill is built on magnificent self-pity: three
 * minutes of it, nobody has forgiven anybody, the long way home in a minor key.
 * The joke works because Finnish popular song is a music *about* feeling
 * something, and it knows it.
 *
 * This music is not about anything. It is for a wedding, a funeral, a pasture
 * and a floor, and the people playing it are doing a job — so the lines below
 * are about the *job*: how long it goes on, who is expected to know the tune,
 * where the second beat is, and the fact that the fiddler has played this at
 * every wedding in the parish since 1974. Nothing here explains the music, and
 * nothing here is touristic about it either, which is the other failure mode:
 * a bill that admired the tradition from outside would be a museum label.
 *
 * Finnish words are fine and iskelmä's tables use them; what is avoided is any
 * word a reader would have to look up to get the joke.
 */
const BLURBS: Blurb[] = [
  { text: 'the second beat is short. it is supposed to be', styles: ['polska', 'soittokunta'] },
  { text: 'one of about four hundred, and not one of the famous ones', styles: ['polska'], moods: ['pyoriva'] },
  { text: 'five to the bar, and nobody in the room is counting', styles: ['runolaulu', 'karjalanlaulu'] },
  { text: 'the words go on a great deal longer than the tune does', styles: ['runolaulu'], moods: ['arkainen'] },
  { text: 'she is not performing, and you are not really an audience', styles: ['itkuvirsi'], moods: ['murheinen'] },
  { text: 'nothing is damped, so nothing goes away', styles: ['soitto', 'konserttikantele'] },
  { text: 'two open strings and a considerable amount of patience', styles: ['soitto'], moods: ['harras'] },
  { text: 'this was shouted across a field before anybody called it music', styles: ['karjanhuuto'] },
  { text: 'the printed version is about a third as long', styles: ['virsi'], moods: ['harras'] },
  { text: 'no instruments in this one. there were none', styles: ['piirileikki'] },
  { text: 'the even three, played first so you notice the next one', styles: ['menuetti'] },
  { text: 'quick, and from bohemia, and nobody has ever minded', styles: ['polkka'], moods: ['vauhdikas'] },
  { text: 'the weight is on two. do not fight it', styles: ['masurkka'] },
  { text: 'somebody will call the figures. do what they say', styles: ['katrilli'] },
  { text: 'the one everybody has been waiting for since four o clock', styles: ['haavalssi'], moods: ['juhlava'] },
  { text: 'fourteen dances without stopping, and he knows every join', styles: ['purpuri'] },
  { text: 'at walking pace, because of the aunt at the front', styles: ['marssi'] },
  { text: 'four lines: two of scenery and two of grievance', styles: ['rekilaulu'] },
  { text: 'the same dance with the limp taken out, which was somebody idea of progress', styles: ['hambo'] },
  { text: 'ten fiddles, one line, and a harmonium holding the middle', styles: ['soittokunta', 'hidasvalssi'] },
  { text: 'written in 1971 about something that stopped in 1890', styles: ['hidasvalssi'], moods: ['murheinen'] },
  { text: 'nobody is dancing to this, and that is the new part', styles: ['tanhu'], moods: ['juhlava'] },
  { text: 'seven beats, and they are not going to slow down for you', styles: ['poljento'], moods: ['jykeva'] },
  { text: 'older than the country it is named after', moods: ['arkainen'], slot: 'open' },
  { text: 'somebody stamps four times, and that is the count-in', slot: 'open' },
  { text: 'the tune comes round again. it will keep doing that', slot: 'close' },
  { text: 'played at this wedding and at the one before it' },
];

export const STAGING: Staging = {
  room: RIIHI,
  wardrobe: WARDROBE,
  /**
   * Pelimanni, when the era is one this genre has no clothes for.
   *
   * Not the revival, which is the era most people have actually seen — the
   * costumes, the festival, the ten fiddles — and that is exactly why it is
   * wrong here. The revival is a *presentation* of this music, and a genre
   * handed an era it does not recognise should turn up as the thing itself: a
   * fiddler at a wedding in a barn, which is what the other three eras are
   * either the ancestor of or the argument with.
   */
  defaultEra: 'pelimanni',
  blurbs: BLURBS,
  /**
   * Just under jazz, and a long way under the pavilion.
   *
   * The floor is as full as a tanssilava's and the dance is harder work, which
   * argues for iskelmä's 1.0 — but `body` is a multiplier on the *players*, and
   * this band is sitting down. A fiddler plays with one arm and a fixed torso;
   * the whole of a pelimanni performance above the waist is a bow, and the boot
   * doing the rest is under the chair. Add to that the six styles where nobody
   * is dancing at all — a lament, a hymn, a kantele piece — and 0.8 is a band
   * working hard and visibly not moving.
   */
  body: 0.8,
};
