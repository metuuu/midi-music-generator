/**
 * What this music stages: a fenced yard with a wall of speakers in it.
 *
 * The room, the clothes and the programme copy. `Staging` in `genre/types.ts`
 * argues why a genre carries its own rather than the renderer holding a registry
 * of them; the instruction at the top of `iskelma/staging.ts` is the one worth
 * repeating, because these comments are not legible on their own. Read the
 * pavilion, the cellar and the black box before this one — several of the
 * decisions below are made *against* them, and the most important of them is the
 * first: this room is outdoors, like the pavilion and unlike the other two, and
 * for the opposite reason. A tanssilava is outdoors because Finland has six weeks
 * of summer. A lawn is outdoors because a sound system is a lorry-load of speaker
 * boxes and there is no building in the neighbourhood that would hold it.
 */

import type { Blurb, StageRoom, Staging, Wardrobe } from '../types.js';

/**
 * THE LAWN — reggae.
 *
 * A fenced open yard with a bar along one side, strings of bulbs overhead, and a
 * stack of speaker boxes taller than anybody in the band. It is a **dance**, so
 * `seated` is false and the density is the highest in the project: nine rows at
 * 0.9 is a crowd with no gaps in it, which is what these rooms were and is the
 * single fact the picture has to get right.
 *
 * Eleven metres wide, which is the widest room here, and the reason is the band
 * rather than the audience. A roots line-up is drums, bass, two guitars, an organ,
 * three horns and a singer, and `chooseVenue` runs before the cast exists so the
 * boards have to hold the largest one the genre can produce. Nothing below 8.5 has
 * been tried and this needs more than that.
 *
 * `pa-stack` is in every era's props and `backline` joins it from 1967, and the
 * distinction is the whole look of the room: a backline faces the band and a PA
 * stack faces the audience, so a sound-system dance is a *wall* of the second kind
 * with the first kind behind it. `crowd-barrier` rather than `railing` for the
 * same reason — the rail in this room is in the house, holding the front row off
 * the boards, not on the stage keeping the band on it.
 *
 * `riser` sits in the room's own props rather than in any era's `maybe`, because
 * `cast.ts` stands the drummer 0.4 m up whatever the dressing says, and a
 * probabilistic riser would leave them floating half the time.
 */
const LAWN: StageRoom = {
  id: 'lawn',
  names: ['Pioneer Lawn', 'The Success Club', 'Jubilee Gardens', 'Maxfield Lawn', 'The Tiles', 'Sunset Yard'],
  width: 11, depth: 6.5,
  audience: { rows: 9, density: 0.9, seated: false },
  // Two props belong to the genre rather than to any decade of it: the drum
  // platform, and the bar that is the reason half the room came.
  props: ['riser', 'bar'],
  eras: {
    /**
     * 1963. A dance under bunting and bare bulbs, with one small PA and a band
     * in matching suits standing in front of it. Tungsten everything, and the
     * moths that a warm lamp outdoors at midnight always has in it — the same
     * argument the pavilion makes about a Finnish July, and true of Kingston for
     * rather more of the year.
     */
    ska: {
      palette: {
        boards: '#c2925a',
        backdrop: '#16281f',
        curtain: '#8a2f2c',
        proscenium: '#e6dcc0',
        ambient: '#ffd9a0',
      },
      props: [
        'open-air', 'fairy-lights', 'bunting', 'dance-floor', 'pa-stack', 'moths',
      ],
      maybe: [['paper-lanterns', 0.45], ['posters', 0.5]],
      fog: 0.14,
    },
    /**
     * 1967. The same yard, one amplifier louder, and the suits get sharper as the
     * music gets slower. Deeper colours than the era before it — this is the
     * point where the dance stops being an evening out and starts being a
     * territory, and the palette should be a shade less friendly.
     */
    rocksteady: {
      palette: {
        boards: '#a87c4a',
        backdrop: '#12231d',
        curtain: '#6d2440',
        proscenium: '#d8ceb2',
        ambient: '#ffcf95',
      },
      props: [
        'open-air', 'fairy-lights', 'dance-floor', 'pa-stack', 'backline',
        'posters', 'moths',
      ],
      maybe: [['neon', 0.4], ['paper-lanterns', 0.3]],
      fog: 0.2,
      grow: [0.2, 0],
    },
    /**
     * 1975. The sound system has eaten the room: a wall of boxes down one side, a
     * barrier across the front, and a rig on the boards that arrived in a van.
     * Green, gold and a burnt red, kept muted on purpose — the tricolour is
     * genuinely what the posters of this decade looked like, and a saturated
     * version of it would be a costume rather than a room.
     *
     * `fog` is up to 0.35 without a `haze` prop, and that is deliberate rather
     * than an oversight. At most one room modifier is allowed and `open-air` has
     * it; what is in the air out here is not a smoke machine, it is a warm night
     * and several hundred people, and `fog` says that as a volume without asking
     * for a fixture that does not exist in a yard.
     */
    roots: {
      palette: {
        boards: '#8f6b3e',
        backdrop: '#0f2418',
        curtain: '#7a2320',
        proscenium: '#b9903c',
        ambient: '#ffc27a',
      },
      props: [
        'open-air', 'pa-stack', 'dance-floor', 'crowd-barrier', 'backline',
        'neon', 'posters', 'wedges', 'moths',
      ],
      maybe: [['fairy-lights', 0.5], ['flight-case', 0.3]],
      fog: 0.35,
      grow: [0.4, 0.2],
    },
    /**
     * 1985. Neon and a lighting truss, and a stage that is mostly equipment —
     * because by now the band is a keyboard and a drum machine, and the thing the
     * audience is looking at is the rig rather than the players. The palette goes
     * cold at the top and stays warm on the boards, which is what a yard lit by
     * tubes over a floor lit by nothing actually looks like.
     */
    digital: {
      palette: {
        boards: '#6b5a45',
        backdrop: '#101822',
        curtain: '#8f1f5c',
        proscenium: '#7f8fa0',
        ambient: '#8fd8ff',
      },
      props: [
        'open-air', 'pa-stack', 'neon', 'dance-floor', 'crowd-barrier',
        'backline', 'wedges', 'truss', 'posters',
      ],
      maybe: [['flight-case', 0.45], ['mirror-ball', 0.25]],
      fog: 0.3,
      grow: [0.6, 0.3],
    },
  },
  fallback: {
    palette: {
      boards: '#a87c4a', backdrop: '#12231d', curtain: '#7a2320',
      proscenium: '#c9a05c', ambient: '#ffc98a',
    },
    props: ['open-air', 'pa-stack', 'dance-floor', 'fairy-lights', 'moths'],
    fog: 0.25,
  },
};

const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1963. Matching suits, and they matched harder than any band in this project
   * except the swing group in the cellar. The men who played ska had been through
   * a music school and dressed like it; `uniform: 0.8` is the same number jazz's
   * swing era carries and it is true here for the same reason — this is a
   * *section*, dressed as one.
   *
   * The porkpie is the one loose thread, and it is the rude boy arriving at the
   * edge of the picture two years early.
   */
  ska: {
    jackets: ['#20242e', '#3a3f4c', '#e9e4d6', '#5a4a35', '#2f4038', '#7a6a52'],
    shirts: ['#ffffff', '#fdf9ee', '#eef3f6'],
    trousers: ['#20242e', '#2b2b2b', '#3a3f4c'],
    accents: ['#8a1f2b', '#1b6d4d', '#c08a2b', '#2f4a8a'],
    loud: ['#e9e4d6', '#c08a2b'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018', '#6b4423'],
    hairStyles: [['short', 6], ['slick', 4], ['curls', 2], ['bald', 1]],
    accessories: [['tie', 0.7], ['sunglasses', 0.3], ['porkpie', 0.25], ['moustache', 0.2]],
    fabrics: [['wool', 7], ['satin', 2], ['linen', 2]],
    loudFabric: 'satin', sequinChance: 0,
    matched: 0.8, uniform: 0.8, spotlight: 0.35,
  },
  /**
   * 1967. The rude boy suit: narrower, sharper, and worn with dark glasses
   * indoors and out. The band stops matching quite so hard — `uniform` drops from
   * 0.8 to 0.6 — which is the visible half of a change that is also happening in
   * the music, where a big band with a horn section out front is becoming a
   * rhythm section with three horns behind a singer.
   */
  rocksteady: {
    jackets: ['#1c1f27', '#33383f', '#d9d3c2', '#4a3a52', '#3d4a3d', '#6e5a3c'],
    shirts: ['#ffffff', '#f4efe2', '#d6e2ea'],
    trousers: ['#1c1f27', '#2b2b2b', '#3d3a33'],
    accents: ['#a8241f', '#0f6b52', '#d4a02b', '#3a4f9e'],
    loud: ['#d9d3c2', '#d4a02b'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018'],
    hairStyles: [['short', 5], ['afro', 3], ['slick', 3], ['curls', 2], ['bald', 1]],
    accessories: [['sunglasses', 0.45], ['tie', 0.5], ['porkpie', 0.3], ['moustache', 0.2]],
    fabrics: [['wool', 5], ['satin', 3], ['linen', 3]],
    loudFabric: 'satin', sequinChance: 0,
    matched: 0.65, uniform: 0.6, spotlight: 0.4,
  },
  /**
   * 1975. Where the suit goes.
   *
   * `dreadlocks` at the top of the hair table, and the type's own comment says why
   * it is a hairstyle worth having rather than a texture: it is built as ten
   * separate ropes, so backlight passes between them and the silhouette reads as a
   * comb rather than as a slab. That distinction is the whole reason a band of six
   * people in this era is legible from the back of the yard.
   *
   * The tam over them is `turban` — wound bulk above the skull, which is what the
   * object is — and it is the only hat weighted here. `EXCLUSIVE` in `cast.ts`
   * allows one hat per player, so weighting a beanie and a flatcap beside it would
   * buy nothing and waste two draws.
   *
   * `uniform: 0.15` is the lowest number in the file and the most accurate. Nobody
   * in a roots band is wearing what anybody else in it is wearing; denim, khaki
   * and knitwear, and none of it reflects anything.
   */
  roots: {
    jackets: ['#3f4a35', '#5a4a35', '#2f3a42', '#6b5b3f', '#4a3a2c', '#7a6a4a'],
    shirts: ['#c9bfa0', '#8a9a7a', '#b8a884', '#6f7d6a', '#d4c8a8'],
    trousers: ['#3a3a2e', '#4b4438', '#2f3540', '#55503f'],
    accents: ['#b8452b', '#1f7a4a', '#d4a72b'],
    loud: ['#d4a72b', '#b8452b'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018', '#6b4423'],
    hairStyles: [['dreadlocks', 7], ['afro', 4], ['braids', 2], ['short', 2], ['bald', 1], ['long', 1]],
    accessories: [['beard', 0.5], ['turban', 0.45], ['sunglasses', 0.25], ['chain', 0.15]],
    fabrics: [['denim', 4], ['knit', 4], ['linen', 3], ['corduroy', 2], ['wool', 1]],
    loudFabric: 'knit', sequinChance: 0,
    matched: 0.25, uniform: 0.15, spotlight: 0.3,
  },
  /**
   * 1985. Leather, satin and a chain, and the one person out front is dressed
   * considerably better than the machine behind them.
   *
   * `spotlight: 0.5` is the highest here by a distance, and it is the decade's own
   * argument: the record is a preset that anybody could buy, so what distinguishes
   * one release from another is entirely the person on the microphone, and the
   * clothes agree with that. `sequinChance` stays small — this is a yard, not a
   * variety show, and a fully sequinned lead in a dancehall reads as somebody who
   * has come to the wrong booking.
   */
  digital: {
    jackets: ['#1a1a1e', '#2b2f4a', '#7a1f4a', '#3f4a2b', '#5a2b1f', '#c9c2b4'],
    shirts: ['#ffffff', '#ffe9a0', '#d6f0ff', '#2b2b2b'],
    trousers: ['#1a1a1e', '#2b2f3a', '#3f3a2b'],
    accents: ['#ffd23c', '#ff2d7a', '#2be0c8', '#7a4aff'],
    loud: ['#ffd23c', '#ff2d7a'],
    hair: ['#0d0d0d', '#1c1209', '#2e1d10', '#4a3018'],
    hairStyles: [['short', 4], ['dreadlocks', 4], ['braids', 3], ['afro', 2], ['bald', 2], ['curls', 1]],
    accessories: [['chain', 0.5], ['wraparounds', 0.35], ['beanie', 0.3], ['beard', 0.25], ['hoops', 0.2]],
    fabrics: [['leather', 4], ['satin', 3], ['denim', 3], ['nylon', 2], ['knit', 1]],
    loudFabric: 'leather', sequinChance: 0.1,
    matched: 0.3, uniform: 0.2, spotlight: 0.5,
  },
};

/**
 * Reggae: a handbill for a dance.
 *
 * The register is the house one — affectionate, dry, and never a critic's — and
 * there is one extra rule this genre needs that the others do not. **No patois.**
 * A bill written in an accent the writer does not have is an impression, and an
 * impression is the one thing that would make this table read as somebody else's
 * joke about the music rather than as the music's own. So the lines are in the
 * same plain English as the rest of the project, and what makes them belong here
 * is what they are *about*: the bass player, the missing downbeat, the size of the
 * speakers, and how long a version can go on for.
 *
 * Nothing here explains anything. A line that told the audience where beat three
 * is would be a lecture, and they can hear it.
 */
const BLURBS: Blurb[] = [
  { text: 'the horns have been up since six', styles: ['ska', 'horns'] },
  { text: 'quick, and dressed better than you', styles: ['ska', 'shuffle'], moods: ['jump'] },
  { text: 'a banjo, and a man sitting on the bass', styles: ['mento'] },
  { text: 'the year the band slowed down and never sped up again', styles: ['rocksteady'] },
  { text: 'somebody is being sung at, and it is not going well', styles: ['rocksteady', 'lovers'] },
  { text: 'the bass player is the featured artist and nobody announced it', styles: ['onedrop', 'rocksteady', 'rubadub'] },
  { text: 'there is no beat one. do not go looking for it', styles: ['onedrop', 'dub'] },
  { text: 'the kick is on all four and it means it', styles: ['steppers'], moods: ['heavy'] },
  { text: 'militant, and still militant in eight minutes', styles: ['steppers', 'rockers'], moods: ['heavy', 'conscious'] },
  { text: 'the hi-hat has been listening to philadelphia', styles: ['flyers'] },
  { text: 'three drums, and nobody in any hurry to stop', styles: ['nyabinghi'] },
  { text: 'for the ones who came to think about it', styles: ['roots', 'dubpoetry'], moods: ['conscious'] },
  { text: 'the singer has left the building. the echo has not', styles: ['dub'], moods: ['echo'] },
  { text: 'half the band is here at any given moment', styles: ['dub'], moods: ['echo'] },
  { text: 'somebody at the back is talking over it on purpose', styles: ['dubpoetry'] },
  { text: 'the organ player has both hands busy and no chords to show for it', styles: ['bubble', 'skinhead'] },
  { text: 'slow, major, and entirely unashamed', styles: ['lovers'], moods: ['sweet'] },
  { text: 'made in coventry, which is further from kingston than it sounds', styles: ['twotone'] },
  { text: 'one preset, and an entire industry', styles: ['slengteng'] },
  { text: 'one chord. that is the whole harmonic argument', styles: ['ragga', 'dancehall'], moods: ['rough'] },
  { text: 'the speakers are stacked higher than the band', slot: 'open' },
  { text: 'wind it back and play it again, which they will', slot: 'close' },
  { text: 'nobody has left the bar and nobody is going to' },
];

export const STAGING: Staging = {
  room: LAWN,
  wardrobe: WARDROBE,
  /**
   * Roots, when the era is one this genre has no clothes for. It is the decade
   * the word means to anybody who is not being careful, and the other three are
   * legible as the approach to it and the departure from it.
   */
  defaultEra: 'roots',
  blurbs: BLURBS,
  /**
   * Just under the dance band, and above everything else here.
   *
   * The floor is as full as a tanssilava's and it is moving more, which argues for
   * 1.0 — but `body` is a multiplier on the *players*, and a reggae rhythm section
   * is the most economical group of people in this project. The whole discipline
   * of the style is that nobody adds anything: the drummer plays two strokes a
   * bar, the guitarist plays four, and neither of them is selling it. 0.9 is a
   * band absolutely locked in and not showing you that it is.
   */
  body: 0.9,
};
