/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The costume bench — every hair style, hat, fabric and wardrobe, side by side.
 *
 * `web/concert/gallery.ts` exists because twenty-two instrument models were
 * built, asserted against and shipped with no way to *look* at any of them, and
 * a trumpet whose bell pointed at the ceiling survived that for as long as no
 * show happened to feature a trumpet in a close shot. The same thing has now
 * happened one layer in: `HairStyle` went from eight values to seventeen,
 * `Accessory` from eleven to twenty and `Fabric` from nine to fifteen, all in
 * one pass, all verified against "no NaN transform, no empty branch", and not
 * one of them ever looked at. A cowboy hat whose turned brim is two rotated
 * boxes stuck on the sides of a disc passes every check that exists.
 *
 * The model bench cannot show any of it. `gallery.ts` hardcodes a single `Look`
 * with `hairStyle: 'short'` and no accessories, because its subject is the
 * *instrument* and the player is there to hold it — which is the right decision
 * for that page and the reason this is a different one.
 *
 * ## What the failures here look like, and what the layout owes them
 *
 * Costume faults are **comparative** in a way instrument faults are not. A bell
 * pointing at the ceiling is wrong on its own; a beehive is only wrong next to
 * a bob, a hat only wrong over the hair it is supposed to sit on, and a fabric
 * only wrong beside the fabric it is meant to look nothing like. So the unit of
 * this page is not one exhibit on a turntable — it is a *row*, and the two
 * things a row has to guarantee are that every figure in it is drawn at the same
 * size and lit by the same light.
 *
 * Both of those are why the camera is **orthographic** and the rows are stacked
 * in `y` rather than laid out on a floor in `z`. A perspective grid puts the
 * back row further away and lights it from a different angle, so the two
 * questions this page asks — is this silhouette different from that one, is this
 * sheen different from that one — both get answered by the layout instead of by
 * the model. A flat elevation cannot lie about either: parallel rays mean the
 * key light strikes the figure in the top-left corner at exactly the angle it
 * strikes the one in the bottom-right, and an ortho projection means a hat six
 * rows down is the same number of pixels across as the one at the top.
 *
 * What that costs is the ability to walk round anything, and the answer is that
 * the *figures* turn rather than the camera. Front, three-quarter, side and back
 * are one number applied to every group at once, so a comparison survives being
 * turned — which matters, because half the head furniture in the union is only
 * wrong from one angle. A ball cap is peaked backwards by decision and a mullet
 * is short from the front by definition; neither can be judged from the stalls.
 *
 * ## Nothing here dresses anybody
 *
 * The page goes through `buildPerformer`, which is the entry point `show.ts`
 * uses — not `buildHair` and `buildAccessories` behind it — so what appears is
 * a whole person assembled the way the stage assembles one, down to the
 * proportions the hair is scaled against and the shoulders it hangs onto.
 *
 * The wardrobe view goes further and is the reason the page opens on it. Its
 * figures are not `Look`s written here: each row runs `generateSong` for one
 * `genre:era`, `chooseVenue` for the room, and `castSong` over both, and then
 * draws whoever that produced. So the answer to "why does arabic look like
 * country" is a real answer about the tables rather than about a mock-up — and
 * where a genre has no wardrobe for an era at all, the row says which era it
 * fell back to, because that is the commonest way for two decades to end up
 * wearing the same clothes.
 *
 * ## The garments, which had nowhere to be looked at
 *
 * `Garment` is eight silhouettes and it is the one union on this page that no
 * view showed. The wardrobe view draws garments, but only the ones the genre
 * currently on screen happens to weight — so "is a `drape` a `drape`" was a
 * question you answered by cycling nineteen genres and hoping, and four of the
 * eight are rare enough that a genre in which to see one has to be looked up in
 * the tables first. That is the same failure this whole page exists about, one
 * union further along: a branch nobody ever looks at.
 *
 * `garmentView` is the fix and it is four rows rather than one, because a
 * garment is checked from four directions and only one of them is "does it draw".
 * The first row is the eight as cut, on the control body. The second is the
 * **ten-metre test the union's own docstring claims each member passes** — one
 * flat colour on skin, hair and every piece of cloth, and the matte end of the
 * fabric table so nothing has a highlight, which leaves the outline and nothing
 * else. Two garments that are the same figure in that row are one garment with
 * two names, and that is the exact claim `Garment` makes about itself. The third
 * is `brocade`, which is the only fabric that reaches the renderer as *geometry*
 * rather than as a number, so it is the one cloth that can land wrongly on a
 * shape — the same class of intersection the hats grid exists for. The fourth
 * sits everybody down, because `dressGarment` builds no skirt for a player off
 * their feet and hands the cloth to `performer-legs.ts` as a `LapCloth` instead;
 * that swap is a whole branch of the wardrobe with no other way in.
 *
 * The other synthetic views hold everything constant except the one axis they
 * are about. One body, one skin, one hair colour and one outfit across all
 * seventeen hair styles; one hair style and one outfit across all twenty
 * accessories; one
 * *colour* across all fifteen fabrics, which is the only way a reflectance table
 * can be read at all — **`clothSurface` turns `Fabric` into a roughness and a
 * metalness and nothing else**, so two fabrics under two colours are not being
 * compared. It turns it into five things now: a roughness, a metalness, a weave
 * normal map, a sheen, and a `tone`/`chroma` pair that moves the *colour it was
 * handed*. That makes holding one colour more necessary rather than less — a
 * fabric that dyes its own input is exactly the thing two swatches under two
 * colours cannot separate — and it is why the second row exists.
 *
 * ## Determinism
 *
 * Every figure's id is its seed. `buildPerformer` forks `Rng` streams off
 * `Performer.id` for the things `Look` does not decide — the length of each
 * dreadlock, where eight curls land, the seven lumps on an afro's silhouette —
 * so a figure labelled `hair:afro` is the same afro on every reload, and the
 * label prints the id so a defect can be reproduced. The wardrobe rows seed
 * their song, their venue and their cast off the same string for the same
 * reason.
 */

import {
  AgXToneMapping, AmbientLight, BufferAttribute, BufferGeometry, Color,
  DirectionalLight, Group, LineBasicMaterial, LineSegments, OrthographicCamera,
  Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from 'three';

import { castSong, wardrobeFor } from '../concert/cast.js';
import type {
  Accessory, Fabric, Garment, HairStyle, Look, Performer, Posture,
} from '../concert/types.js';
import { chooseVenue } from '../concert/venue.js';
import { generateSong } from '../generate/song.js';
import { GENRES } from '../genre/index.js';
import type { Wardrobe } from '../genre/types.js';

import { lightTheRoom } from './concert/performer-assets.js';
import { cutOf } from './concert/performer-garments.js';
import { buildPerformer, type PerformerRig } from './concert/performer.js';

const canvas = document.getElementById('bench') as HTMLCanvasElement;
const overlay = document.getElementById('labels')!;
const busy = document.getElementById('busy')!;
const viewsBox = document.getElementById('views')!;
const blurbLine = document.getElementById('blurb')!;
const genreBox = document.getElementById('genreBox')!;
const genrePick = document.getElementById('genre') as HTMLSelectElement;
const genreNote = document.getElementById('genreNote')!;
const paletteBox = document.getElementById('paletteBox')!;
const palettePick = document.getElementById('palette') as HTMLSelectElement;
const paletteNote = document.getElementById('paletteNote')!;
const palGrid = document.getElementById('palGrid')!;
const filterBox = document.getElementById('filter') as HTMLInputElement;
const countLine = document.getElementById('count')!;
const turnNote = document.getElementById('turnNote')!;
const inspectBox = document.getElementById('inspect')!;
const inspectFields = document.getElementById('inspectFields')!;
const swatchBox = document.getElementById('swatches')!;
const motion = document.getElementById('motion') as HTMLInputElement;
const showTags = document.getElementById('tags') as HTMLInputElement;

// ---------------------------------------------------------------------------
// The unions, in an order this page chose and the compiler checks
// ---------------------------------------------------------------------------

/**
 * Every value of a union, once, in a written order.
 *
 * `Object.keys` over a `Record<T, null>` rather than a hand-written array,
 * because the array is the thing this whole page exists to stop being trusted:
 * a value added to `HairStyle` and forgotten here would be a silhouette the
 * bench silently does not draw, which is the same failure — a branch nobody
 * ever looks at — one layer further out. A missing key fails the build and so
 * does a key that is not in the union. The order is insertion order, which for
 * string keys is a guarantee rather than an implementation detail.
 */
function allOf<T extends string>(order: Record<T, null>): readonly T[] {
  return Object.keys(order) as T[];
}

/** Grouped the way `concert/types.ts` groups them: close, shaped, hanging, cloth. */
const HAIR = allOf<HairStyle>({
  short: null, slick: null, bald: null, updo: null, braids: null, mohawk: null,
  beehive: null, bob: null, curls: null, afro: null,
  long: null, mane: null, mullet: null, dreadlocks: null, emo: null,
  hood: null, wrap: null,
});

/** Eyes, head, neck, face, and the rest — `Accessory`'s own grouping. */
const ACCESSORIES = allOf<Accessory>({
  glasses: null, sunglasses: null, wraparounds: null,
  porkpie: null, flatcap: null, ballcap: null, beanie: null, cowboyhat: null,
  bandana: null, turban: null,
  tie: null, bowtie: null, scarf: null, towel: null, chain: null,
  beard: null, moustache: null,
  earrings: null, hoops: null, headphones: null,
});

const FABRICS = allOf<Fabric>({
  wool: null, sequin: null, satin: null, velvet: null, corduroy: null,
  denim: null, leather: null, knit: null, nylon: null, silk: null,
  linen: null, brocade: null, lame: null, vinyl: null, flannel: null,
});

/**
 * The eight silhouettes, in the order `Garment` declares them.
 *
 * Which is also roughly the order they cover the body in — `suit` and `tails`
 * are the hip-length pair, `coat` reaches the knee, and `robe`, `gown` and
 * `drape` reach the floor — so the row reads as a hem falling, and the two that
 * take cloth *away* (`waistcoat`, `shirtsleeves`) are together at the end.
 */
const GARMENTS = allOf<Garment>({
  suit: null, tails: null, coat: null, robe: null, gown: null, drape: null,
  waistcoat: null, shirtsleeves: null,
});

/**
 * What goes on a head, as opposed to on a face or round a neck.
 *
 * The seven in `cast.ts`'s first `EXCLUSIVE` group — one hat at most — plus
 * `headphones`, which is deliberately *not* in that group so that a tender at a
 * rig can wear a beanie and cans at once. That exemption is exactly why cans
 * belong in this grid: they are the one piece of head furniture the wardrobe is
 * allowed to put on top of something else, and the only page that could ever
 * have caught it doing so is this one.
 */
const HATS: readonly Accessory[] = [
  'porkpie', 'flatcap', 'ballcap', 'beanie', 'cowboyhat', 'bandana', 'turban',
];

const HEAD_WORN: readonly Accessory[] = [...HATS, 'headphones'];

/**
 * `Accessory` by the place on the body it is worn, which is `EXCLUSIVE`.
 *
 * The same five groups `cast.ts` casts against, in the same order the union
 * declares them, and that is the load-bearing part: these are **places, not
 * lists of lookalikes**, so each row is the claim "a player may have one of
 * these" and the row is where you check it. What was here instead was a
 * `slice(i, i + 7)`, which headed its rows `glasses …`, `cowboyhat …` and
 * `chain …` — whichever value happened to land at index 0, 7 and 14 — and cut
 * three times through the middle of a group. A row of eyewear and hats together
 * is a row that cannot be wrong about anything.
 *
 * Not exhaustive, deliberately. `accessoryView` puts whatever is missing in a
 * last row of its own rather than dropping it, so an accessory added to the
 * union and to no group still gets drawn — and the row it lands in is the true
 * statement about it, which is that nothing stops it being worn with anything.
 * `headphones` is that today and is meant to be: it is the one piece of head
 * furniture the wardrobe may put on top of something else.
 */
const WORN_ON: readonly (readonly [string, string, readonly Accessory[]])[] = [
  ['on the eyes', 'one at most', ['glasses', 'sunglasses', 'wraparounds']],
  ['on the head', 'one at most, and none of them under a hood or a wrap', HATS],
  ['round the neck', 'one at most', ['tie', 'bowtie', 'scarf', 'towel', 'chain']],
  ['on the face', 'one at most', ['beard', 'moustache']],
  ['in the ears', 'one at most — they are the same ears', ['earrings', 'hoops']],
];

/**
 * The hair a hat has to sit on top of.
 *
 * `short` and `bald` are the controls — a hat that is wrong over those is wrong
 * full stop — and the other eight are every style with mass above or around the
 * skull, which is where the brim goes. **`hood` and `wrap` are in it because
 * they are the two cloth styles** — only `hood` is, and the list below has
 * never carried `wrap`. The argument is right and the row is one figure short of
 * making it: a hat over a hood is a garment over a garment, and
 * nothing has ever checked that the wardrobe cannot ask for one.
 */
const VOLUMINOUS: readonly HairStyle[] = [
  'short', 'bald', 'beehive', 'bob', 'curls', 'afro', 'dreadlocks', 'braids',
  'mane', 'hood',
];

// ---------------------------------------------------------------------------
// The one outfit everything synthetic is drawn in
// ---------------------------------------------------------------------------

/**
 * The control look: mid everything, and every value chosen to be *legible*
 * rather than plausible.
 *
 * The hair is a mid brown rather than the near-black most wardrobes draw,
 * because a black mass on a dark background has no silhouette to judge. The
 * jacket is a mid grey for the same reason and because it is what the **two**
 * hats
 * that shade *from* it — `porkpie`, `flatcap`, `beanie`, `cowboyhat` — are
 * derived from, so a hat that comes out invisible against the coat comes out
 * invisible here too. The list caught up with the count and the count did not:
 * it is four. The accent is warm and loud because **five** accessories take
 * their whole colour from it — nine, counted in `performer-accessories.ts`:
 * `ballcap`, `bandana`, `turban`, `tie`, `bowtie`, `scarf`, `chain`, `earrings`
 * and `hoops`, with the porkpie's and the cowboy hat's bands taking it for a
 * part.
 */
const BASE_LOOK: Look = {
  skin: '#c58b62',
  hair: '#5c4025',
  hairStyle: 'short',
  height: 1.75,
  build: 0.5,
  outfit: {
    jacket: '#7c828c', shirt: '#e8e4de', trousers: '#43474d',
    // The neutral reference figure the hair, accessory and fabric views are
    // drawn on: a plain wool suit, so the one variable a view is about is the
    // only thing changing across its row.
    accent: '#c9a23f', fabric: 'wool', garment: 'suit',
  },
  accessories: [],
};

/**
 * The one colour the silhouette row paints everything with.
 *
 * Mid, so that both the lit and the shaded side of a figure stay off the two
 * ends of the transfer curve — a silhouette test run in black is a test whose
 * answer is "they are all black", and one run in white is the same test with the
 * clipping at the other end.
 */
const SILHOUETTE = '#6b7076';

/**
 * One colour's hue and saturation, at a lightness you name.
 *
 * `performer-assets.ts` exports `shade`, which *adds* to the lightness, and that
 * is the right tool for what it does — a lapel a notch darker than the coat it
 * is cut from. It is the wrong one for anchoring a row to an end of the scale,
 * because an addition is anchored to its input: see `fabricView`.
 *
 * In sRGB explicitly rather than in the renderer's working space. `Color` holds
 * linear values once colour management is on, so an unqualified `getHSL` returns
 * a linear lightness — on which 0.18 is not a dark coat, it is a mid one. The
 * numbers here are meant to be read as the colour picker reads them.
 */
const TONE = new Color();
const TONE_HSL = { h: 0, s: 0, l: 0 };
function atLightness(hex: string, l: number): string {
  TONE.set(hex);
  TONE.getHSL(TONE_HSL, SRGBColorSpace);
  TONE.setHSL(TONE_HSL.h, TONE_HSL.s, l, SRGBColorSpace);
  return `#${TONE.getHexString(SRGBColorSpace)}`;
}

/**
 * The five colours every synthetic figure is dyed with, all at once.
 *
 * A whole set rather than one figure at a time, which is the only version of
 * this control that is worth having: the page compares a row against itself, so
 * a colour changed under one figure has broken the row rather than tested it.
 * What a colour *does* change is legibility — a beehive is a silhouette against
 * a pale coat and a smudge against a dark one, and the control look is one
 * particular answer to that which nothing could previously question.
 *
 * The candidates are not invented here. They are the genuine `Wardrobe` lists,
 * read through `wardrobeFor` — the same call `castSong` makes — so every hex the
 * board offers is a hex some band actually wears, and the board doubles as the
 * answer to "what colours are supported". An arbitrary picker would have made
 * this a paint program and told you nothing about the wardrobe.
 */
interface Palette {
  jacket: string;
  shirt: string;
  trousers: string;
  accent: string;
  hair: string;
}

/** The page's own control colours, which are `BASE_LOOK`'s. */
const BENCH_PALETTE: Palette = {
  jacket: BASE_LOOK.outfit.jacket,
  shirt: BASE_LOOK.outfit.shirt,
  trousers: BASE_LOOK.outfit.trousers,
  accent: BASE_LOOK.outfit.accent,
  hair: BASE_LOOK.hair,
};

/** `genre:era` the board is reading, or `''` for the bench's own control. */
let palSource = '';
let palette: Palette = { ...BENCH_PALETTE };

function dressed(over: Partial<Look>, outfit: Partial<Look['outfit']> = {}): Look {
  /*
   * The palette sits between the base look and the caller, so a view that names
   * a colour outright still wins: the fabric rows hold their own coat, and the
   * garment view's silhouette row holds all five. Both of those are the point of
   * their row and neither may be repainted from the panel.
   */
  const p = specOf(view).dressable ? palette : BENCH_PALETTE;
  return {
    ...BASE_LOOK, hair: p.hair, ...over,
    outfit: {
      ...BASE_LOOK.outfit,
      jacket: p.jacket, shirt: p.shirt, trousers: p.trousers, accent: p.accent,
      ...outfit,
    },
    accessories: over.accessories ?? [],
  };
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/** Metres between the centres of two figures, and between two rows' floors. */
const COL_PITCH = 1.25;
const ROW_PITCH = 2.60;

/**
 * One figure on the bench.
 *
 * `id` is the seed as well as the name — see the header — so two figures that
 * differ only in the value being exhibited still get different draws for the
 * things `Look` leaves open, which is what stops seventeen heads of curls being
 * one head of curls drawn seventeen times.
 */
interface Cell {
  id: string;
  /** The heading on the label. The value this figure is here to show. */
  name: string;
  performer: Performer;
  /** The rest of the label: what was drawn, in words. */
  note: string;
  /** Colours worth naming, as `[what, hex]`. Drawn as swatches. */
  swatches: readonly (readonly [string, string])[];
}

interface Row {
  label: string;
  /** Under the heading, dimmer. Where a fallback or a caveat is written. */
  note?: string;
  /** Whether that note is a complaint rather than an aside. */
  warn?: boolean;
  cells: Cell[];
}

interface Figure {
  cell: Cell;
  /** The heading of the row it was built in, for the inspector. */
  row: string;
  rig: PerformerRig;
  group: Group;
  /** Where the feet are, for the label and the ground line. */
  base: Vector3;
  tag: HTMLDivElement;
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

const renderer = new WebGLRenderer({ canvas, antialias: true });
/**
 * The same curve the concert renders through, for the same reason the room
 * intensity is shared: a bench whose transfer function differs from the stage's
 * is a bench measuring a swatch nobody will ever see. See `main.ts` for what
 * AgX does and why it is AgX. The fabric table's whole job is to be trusted.
 */
renderer.toneMapping = AgXToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new Scene();
scene.background = new Color('#15171a');

/**
 * A parallel projection, and the reason is in the header: every figure the same
 * size, so a silhouette is a silhouette rather than a distance.
 */
const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
camera.position.z = 80;

/**
 * Three lights, all directional, and that is the load-bearing word.
 *
 * `clothSurface` turns a `Fabric` into a roughness and a metalness — and, since
 * the table grew columns, a weave and a sheen as well, which are statements
 * about a highlight too. All of
 * those are statements about a *highlight*. A point light would give the figure
 * at the top of the grid a different one from the figure at the bottom, purely
 * because the two are five metres apart, and the fabric view would be measuring
 * the layout. Parallel rays cost nothing and mean every row is under the same
 * follow spot.
 *
 * The key sits between the camera and the figures rather than off to one side,
 * because a specular lobe is only visible where the half-vector between light
 * and eye is near the surface normal — a light at 45° puts sequin's highlight on
 * the figure's flank, where the ortho camera cannot see it, and the fabric view
 * shows fifteen identical grey coats. The rim is the opposite of that on
 * purpose: it is what draws an edge round a mass of dark hair.
 *
 * Nothing casts a shadow. Half these exhibits are a hat over hair and the
 * question is whether the two intersect; a shadow across the join is the one
 * thing that would make that harder to see rather than easier.
 */
/**
 * The fourth light, which is not a light.
 *
 * Half of `Fabric` is a metalness, and a metal has no diffuse response — it is
 * nothing but a reflection of its surroundings. Three directional lights give it
 * a specular dot and black everywhere else, so before this the fabric view drew
 * `lame` and `sequin`, the two cloths the wardrobe reserves for whoever is
 * fronting the number, as the darkest swatches on the page. `lightTheRoom` is
 * the same call the concert makes at the same intensity — a bench that lit its
 * exhibits better than the stage does would be a bench you cannot trust.
 */
const room = lightTheRoom(renderer, scene);
// The page lives as long as the tab; the handle is held so that the render
// target has an owner rather than being a resource nobody can name.
void room;

/**
 * The fill floor, and it is deliberately low.
 *
 * An `AmbientLight` adds the same irradiance to every normal in the scene, so
 * every unit of it is a unit that cannot describe a shape. It was at 1.0, which
 * against a 2.1 key put the shaded side of a coat within a third of a stop of
 * the lit side — a swatch with no fold in it. At 0.55 against a 2.4 key the
 * bench shows the same lit-to-shaded ratio the stage now does, which is the
 * only condition under which a fabric judged here means anything there.
 */
scene.add(new AmbientLight('#8899bb', 0.55));
const key = new DirectionalLight('#fff3e0', 2.4);
key.position.set(0.5, 0.75, 1.0);
scene.add(key);
const fill = new DirectionalLight('#9fb4d8', 0.55);
fill.position.set(-1.0, 0.2, 0.7);
scene.add(fill);
const rim = new DirectionalLight('#88aaff', 0.9);
rim.position.set(-0.7, 0.5, -1.0);
scene.add(rim);

/** Everything the current view built. Cleared wholesale on every switch. */
const stand = new Group();
scene.add(stand);

let live: Figure[] = [];
let rows: Row[] = [];
const rowTags: HTMLDivElement[] = [];

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

type ViewId = 'wardrobe' | 'garments' | 'hair' | 'accessories' | 'hats' | 'fabric';

let view: ViewId = 'wardrobe';
let genre = 'iskelma';
/** How far every figure is turned about its own axis. See the header. */
let facing = 0;
let selected: string | undefined;

/**
 * A performer for a synthetic figure.
 *
 * `singer` because it is **the one archetype with no hands** to occupy and
 * nothing
 * to hold — see `ARCHETYPES`, where `vocal-group` now declares `hands: 0` too
 * and says it is for the singer's reason. Either would do and this one is kept
 * because a bench figure should be one person. So the body stands there and the
 * costume is the
 * only thing in the frame. The posture is `stand` for the same reason: a bench
 * comparing hair against shoulders wants the shoulders in the place the styles
 * were written against.
 */
/** What a synthetic figure is holding, which is nothing. See `inspectOne`. */
const BENCH_INSTRUMENT = 'costume bench';

function figure(id: string, look: Look, posture: Posture = 'stand'): Performer {
  return {
    id,
    layer: 'vocal',
    archetype: 'singer',
    instrument: BENCH_INSTRUMENT,
    look,
    station: { position: [0, 0, 0], facing: 0, posture, riser: 0 },
  };
}

/** The colours a synthetic figure is worth naming. */
function baseSwatches(look: Look): readonly (readonly [string, string])[] {
  return [['hair', look.hair], ['jacket', look.outfit.jacket], ['accent', look.outfit.accent]];
}

/**
 * Seventeen styles on one head.
 *
 * Two rows rather than four of four, because the comparison that matters most is
 * between neighbours and `HairStyle`'s own grouping — held close to the skull,
 * shaped, hanging, cloth — puts the styles that could be confused for each other
 * next to each other. `long` beside `mane` is the pair the union itself argues
 * about.
 *
 * The break is at that grouping's own boundary rather than at the halfway mark,
 * which is what the two labels have always claimed and what a `length / 2` was
 * only accidentally doing. It stopped being true the moment the union stopped
 * being even: at seventeen, halving puts `afro` — a mass with no length at all —
 * in the row headed *hanging*.
 */
function hairView(): Row[] {
  const split = HAIR.indexOf('long');
  return [0, 1].map((r) => ({
    label: r === 0 ? 'close & shaped' : 'hanging & cloth',
    cells: (r === 0 ? HAIR.slice(0, split) : HAIR.slice(split)).map((style) => {
      const look = dressed({ hairStyle: style });
      return {
        id: `hair:${style}`,
        name: style,
        performer: figure(`hair:${style}`, look),
        note: 'no accessories',
        swatches: baseSwatches(look),
      };
    }),
  }));
}

/**
 * Twenty accessories, each on the same head of hair, one row per place worn.
 *
 * On `short` rather than on `bald`, because `short` is what most of the
 * catalogue is wearing and a hat that clears a bare skull is not evidence of
 * anything. The hats get their own view against everything else — see
 * `hatsView` — so this one is about whether the object is the object at all.
 *
 * The rows are `WORN_ON`, which argues them. The short version is that a row
 * heading on this page is supposed to be the table entry a wrong figure is
 * traceable to, and `glasses …` was not one.
 */
function accessoryView(): Row[] {
  const row = (label: string, note: string, of: readonly Accessory[]): Row => ({
    label,
    note,
    cells: of.map((acc) => {
      const look = dressed({ accessories: [acc] });
      return {
        id: `acc:${acc}`,
        name: acc,
        performer: figure(`acc:${acc}`, look),
        note: 'over short hair',
        swatches: baseSwatches(look),
      };
    }),
  });

  const out = WORN_ON.map(([label, note, of]) => row(label, note, of));

  // Whatever `WORN_ON` does not place. Derived rather than listed, so a value
  // added to `Accessory` and to no group is drawn here instead of vanishing —
  // which is the failure this whole page exists about.
  const placed = new Set(WORN_ON.flatMap(([, , of]) => of));
  const loose = ACCESSORIES.filter((a) => !placed.has(a));
  if (loose.length > 0) {
    out.push(row('in no group', 'worn with anything — cans go over a beanie', loose));
  }
  return out;
}

/**
 * The grid the bugs were in: everything worn on a head, against every head.
 *
 * When this view was written, a hat was positioned in multiples of `headR` off
 * the head's own origin and the hair was built against the same skull
 * independently, and **neither knew the other existed** — so a brim at 0.66 R
 * and an afro whose halo reaches 1.5 R were two correct numbers that could not
 * both be true. Every hat in the union disappeared inside an afro; a beehive's
 * finial came out through the crown of a beanie.
 *
 * That is fixed, and this grid is why: it is the only place the failure was
 * visible, and it stayed invisible for as long as there was nowhere to look.
 * `buildHair` now returns a `HairProfile` — measured off the built group rather
 * than tabulated, so restyling a hairstyle cannot leave a stale number behind —
 * and head furniture reads it and either presses the hair down or rides on top.
 *
 * So the view has changed job rather than become redundant. It is now the
 * regression test for the arbitration: eight head-worn accessories against ten
 * heads is eighty chances for a new hat, a restyled mane or a changed profile
 * to put cloth back through hair, and the grid shows all eighty at once.
 */
function hatsView(): Row[] {
  return HEAD_WORN.map((acc) => ({
    label: acc,
    cells: VOLUMINOUS.map((style) => {
      const look = dressed({ hairStyle: style, accessories: [acc] });
      return {
        id: `hat:${acc}:${style}`,
        name: style,
        performer: figure(`hat:${acc}:${style}`, look),
        note: `${acc} over ${style}`,
        swatches: baseSwatches(look),
      };
    }),
  }));
}

/**
 * Fifteen fabrics in one colour.
 *
 * The colour is held because **`Fabric` is a reflectance and nothing else: the
 * table in `performer-assets.ts` is fifteen `[roughness, metalness]` pairs** —
 * which it was, and it is five columns now, `tone` and `chroma` moving the
 * colour the caller handed in and `weave` and `sheen` adding a surface. Holding
 * the colour is the same decision for a stronger reason: a fabric that dyes its
 * own input is precisely what
 * two of them under two colours cannot separate, and two of them under one
 * colour either differ or are the same fabric with two names. The second row is
 * the same fifteen against a dark coat, which is where the two ends of the table
 * separate — `flannel` at roughness 1.0 and `vinyl` at 0.08 are almost the same
 * object in a pale grey and nothing like each other in near-black.
 *
 * ## Which colour, and why the board is allowed to say
 *
 * The premise is "one colour across the row", and it was read for a while as
 * "this particular grey" — the two coats were literals here and the colour board
 * did not reach them, so a view whose entire subject is colour was the one view
 * on the page you could not recolour. That is a misreading of its own argument.
 * Holding the colour is what makes fifteen reflectances comparable; *which* held
 * colour is free, and it is a real question — a lamé in iskelmä's stage red is
 * not the same evidence as a lamé in grey.
 *
 * So the hue comes from the board and each row puts it at its own end of the
 * scale. What is preserved is the thing that matters: one colour down each row,
 * and the two rows a light and a dark of the same hue rather than two hues,
 * because lightness is the axis the second row exists to vary.
 *
 * **Set, not shifted**, which is the whole of `atLightness` existing next to a
 * perfectly good `shade`. A relative shift is anchored to whatever it was handed
 * and half the wardrobe hands it something already at an end: iskelmä's first
 * jacket is a near-white cream, so shifting it down by a third of the scale
 * produced a *tan* and a bench whose dark row was not dark. That is not a row
 * that got the wrong colour — it is the row's argument gone, because what
 * separates `flannel` at roughness 1.0 from `vinyl` at 0.08 is being near black.
 */
function fabricView(): Row[] {
  const rowsOut: Row[] = [];
  for (const [tone, level] of [['pale', 0.70], ['dark', 0.18]] as const) {
    // One colour per row: the board's hue, put at that row's end of the scale.
    const jacket = atLightness(palette.jacket, level);
    const trousers = atLightness(jacket, level * 0.78);
    rowsOut.push({
      label: `${tone} coat`,
      // The hex, because the row is now a function of the board and a reader
      // who changed the colour should be able to see which one they got.
      note: `${jacket} · fifteen reflectances`,
      cells: FABRICS.map((fabric) => {
        const look = dressed({}, { fabric, jacket, trousers });
        return {
          id: `fabric:${tone}:${fabric}`,
          name: fabric,
          performer: figure(`fabric:${tone}:${fabric}`, look),
          note: 'wool = the reference row',
          swatches: [['coat', jacket], ['accent', look.outfit.accent]],
        };
      }),
    });
  }
  return rowsOut;
}

/**
 * The eight silhouettes, four times over. The header argues why four.
 *
 * Every row is the same eight in the same order, which is the only reason the
 * rows can be read against each other at all: a `drape` that is asymmetric when
 * it stands and symmetric when it sits is a fault you find by looking down a
 * column, and a column only exists if all four rows agree on what column three
 * is.
 *
 * The per-figure note is `GarmentCut` read back out of `performer-garments.ts`
 * rather than written here, because the whole point of a label on this page is
 * that a wrong silhouette is traceable to the table entry that caused it. A note
 * typed by hand is a second table, and the first thing a second table does is
 * disagree with the first.
 */
function garmentView(): Row[] {
  const cut = (g: Garment): string => {
    const c = cutOf(g);
    return `${c.sleeve} sleeve · legs ${c.under} · hem ${c.hem}`;
  };

  const row = (
    label: string,
    note: string,
    tag: string,
    make: (g: Garment) => [Look, string],
    posture: Posture = 'stand',
  ): Row => ({
    label,
    note,
    cells: GARMENTS.map((garment) => {
      const [look, said] = make(garment);
      const id = `garment:${tag}:${garment}`;
      // Three chips of the same colour say nothing, which is the silhouette
      // row by construction — so it gets none rather than a row of identical
      // squares under every figure.
      const sw = baseSwatches(look);
      const flat = sw.every(([, hex]) => hex === sw[0]?.[1]);
      return {
        id,
        name: garment,
        performer: figure(id, look, posture),
        note: said,
        swatches: flat ? [] : sw,
      };
    }),
  });

  return [
    row('as cut', 'the control body, in wool', 'cut', (g) => [
      dressed({}, { garment: g }), cut(g),
    ]),
    /*
     * Skin and hair are painted too, and that is not overreach: `Garment` claims
     * each member changes the *outline*, and a face left in flesh tones is a
     * landmark the eye uses to tell two outlines apart when the cloth alone
     * cannot. `flannel` is the matte end of the fabric table — brushed until it
     * has no grain — so nothing in the row carries a highlight either.
     */
    row('silhouette', 'one colour, no sheen — the ten-metre test', 'flat', (g) => [
      dressed(
        { skin: SILHOUETTE, hair: SILHOUETTE },
        {
          jacket: SILHOUETTE, shirt: SILHOUETTE, trousers: SILHOUETTE,
          accent: SILHOUETTE, fabric: 'flannel', garment: g,
        },
      ),
      'outline only',
    ]),
    row('brocade', 'the one fabric that is geometry, on all eight', 'weave', (g) => [
      dressed({}, { fabric: 'brocade', garment: g }), 'pattern over the cut',
    ]),
    /*
     * `dressGarment` builds no skirt for anybody off their feet — one rigid mesh
     * with no bones hangs from the hips straight through the boards while the
     * thighs go out the front of it — and hands `performer-legs.ts` a `LapCloth`
     * instead. Four of the eight have one and four have `hem: 'none'`; this row
     * is the only place either half is visible.
     */
    row('seated', 'no skirt off the feet — a lap cloth instead', 'sit', (g) => {
      const hem = cutOf(g).hem;
      return [
        dressed({}, { garment: g }),
        hem === 'none' ? 'nothing to gather' : `lap to the ${hem}`,
      ];
    }, 'sit'),
  ];
}

/**
 * One genre's wardrobe, era by era, exactly as the concert casts it.
 *
 * Nothing here is assembled by hand. Each row generates a number in that
 * `genre:era`, chooses the room the way a show would, casts it, and draws
 * whoever came out — the same three calls `buildConcert` makes, in the same
 * order, so a `Look` on this page is a `Look` that would have walked on stage.
 *
 * `vocals: true` because a singer is the one player `Wardrobe.spotlight` can
 * reach: the loud jacket and the sequins are drawn only for whoever is fronting
 * the number, and a wardrobe view that never shows them is missing the half of
 * each table that is supposed to be the recognisable half.
 *
 * The note under each row is the answer to the question this view is for. A
 * genre with no wardrobe for the era it was asked for silently falls back to its
 * own default era — see `wardrobeFor` — and two decades that resolve to one
 * table are not two decades. That is a fact about the tables, so the row says
 * it rather than leaving it to be inferred from the clothes being identical.
 */
function wardrobeView(id: string): Row[] {
  const g = GENRES[id];
  if (!g) return [];
  const table = g.staging?.wardrobe;
  const fallback = g.staging?.defaultEra;

  return Object.keys(g.eras).map((era) => {
    const seed = `looks:${id}:${era}`;
    const song = generateSong({ seed, genre: id, era, vocals: true });
    const venue = chooseVenue(id, era, seed);
    const cast = castSong(song, venue, seed);

    const own = Boolean(table?.[era]);
    const note = !table
      ? 'no wardrobe declared — the house PLAIN dress'
      : own
        ? `${g.eras[era]?.year ?? '?'} · ${venue.label}`
        : `no wardrobe for this era — wearing ${fallback ?? 'PLAIN'}`;

    return {
      label: `${id}:${era}`,
      note,
      warn: !own,
      cells: cast.performers.map((p) => ({
        // The cast's own ids are only unique within a number — every era has a
        // `drums` — and this page has all of them on screen at once, so the row
        // is part of the name here. It is also the seed the row was cast from,
        // which is what makes a figure reproducible from its own label.
        id: `${seed}#${p.id}`,
        name: p.layer,
        performer: p,
        // The garment leads, because it is now the first thing that differs
        // between two rows and the hardest to name from the picture: a hair
        // style is legible from the figure and a silhouette is exactly the
        // thing this row is here to be checked against its own label.
        note: `${p.look.outfit.garment} · ${p.look.hairStyle} · ${p.look.outfit.fabric} · ${p.look.accessories.join(' ') || 'nothing'}`,
        swatches: [
          ['jacket', p.look.outfit.jacket], ['shirt', p.look.outfit.shirt],
          ['trousers', p.look.outfit.trousers], ['accent', p.look.outfit.accent],
          ['hair', p.look.hair],
        ],
      })),
    };
  });
}

/**
 * The six views, as data.
 *
 * A table rather than a `switch` plus a `Record` plus a hand-written list of
 * button ids in the HTML, which is what this was: three places that had to agree
 * on what the views are, and the page had already spent a release with `hats ×
 * hair` reachable by keyboard and `fabric` not, because the array and the markup
 * disagreed about the order. The buttons are built from this, the keys are its
 * indices, and the blurb is its own field — so a view added here is a view that
 * is switchable, keyable and described, or it is a type error.
 *
 * `size` is the thing the old chip row could not say and the reason it is on the
 * button: `hats × hair` builds eighty rigs and `fabric` thirty, and how long a
 * click is about to take is a fact worth having before the click.
 */
interface ViewSpec {
  id: ViewId;
  label: string;
  /** How big the grid is, in the view's own units. */
  size: string;
  /** One line under the switcher, saying what the view is for. */
  blurb: string;
  /**
   * Whether the colour board dresses this view.
   *
   * False for `wardrobe` alone, which draws whatever `castSong` dealt each
   * player and cannot be repainted without ceasing to be the thing it is for.
   * The board is **hidden** there rather than left on screen as a reference,
   * which is what it was: a control that silently does nothing is worse than an
   * absent one, and the same argument already hides the genre picker on the five
   * views that have no genre.
   *
   * `fabric` was false too and should not have been. See `fabricView`.
   */
  dressable: boolean;
  rows: () => Row[];
}

const VIEWS: readonly ViewSpec[] = [
  {
    id: 'wardrobe',
    label: 'wardrobe',
    size: `${Object.keys(GENRES).length} genres`,
    blurb: 'every genre’s wardrobe as <b>castSong</b> actually draws it — one number per era, vocals on so the lead can get the loud jacket',
    dressable: false,
    rows: () => wardrobeView(genre),
  },
  {
    id: 'garments',
    label: 'garments',
    size: `${GARMENTS.length} cuts × 4`,
    blurb: 'all eight <b>Garment</b> silhouettes — as cut, as an outline, in the one fabric that is geometry, and sitting down',
    dressable: true,
    rows: garmentView,
  },
  {
    id: 'hair',
    label: 'hair',
    size: `${HAIR.length} styles`,
    blurb: 'all seventeen <b>HairStyle</b> values on one body, one skin, one hair colour',
    dressable: true,
    rows: hairView,
  },
  {
    id: 'accessories',
    label: 'accessories',
    size: `${ACCESSORIES.length} worn`,
    blurb: 'all twenty <b>Accessory</b> values, one at a time, over short hair',
    dressable: true,
    rows: accessoryView,
  },
  {
    id: 'hats',
    label: 'hats × hair',
    size: `${HEAD_WORN.length} × ${VOLUMINOUS.length}`,
    blurb: 'everything worn on a head × every head — the grid the intersections are in',
    dressable: true,
    rows: hatsView,
  },
  {
    id: 'fabric',
    label: 'fabric',
    size: `${FABRICS.length} × 2`,
    blurb: 'all fifteen <b>Fabric</b> values in one colour, under one directional key',
    dressable: true,
    rows: fabricView,
  },
];

function specOf(v: ViewId): ViewSpec {
  return VIEWS.find((s) => s.id === v)!;
}

// ---------------------------------------------------------------------------
// Building
// ---------------------------------------------------------------------------

/**
 * A short line on the boards under each figure.
 *
 * The one thing a flat elevation loses is the floor, and the floor is what says
 * a hat is floating: `gallery.ts` gets that from a `GridHelper` and cannot here,
 * because a grid drawn in perspective under stacked rows is meaningless. A
 * segment at each figure's own zero is the same information with none of the
 * geometry — a foot below it or a hem above it is immediately visible.
 */
const groundMat = new LineBasicMaterial({ color: 0x3a3e45 });
let ground: LineSegments | undefined;

function clear(): void {
  for (const f of live) {
    f.rig.dispose();
    stand.remove(f.group);
    f.tag.remove();
  }
  live = [];
  for (const t of rowTags) t.remove();
  rowTags.length = 0;
  if (ground) {
    stand.remove(ground);
    ground.geometry.dispose();
    ground = undefined;
  }
}

/** How long a new grid is stepped before it is allowed to stand still. */
const SETTLE_FRAMES = 24;
let settle = 0;

/** How many figures the view holds before the filter takes any away. */
let total = 0;

/**
 * The last grid's rows and cell ids, joined. See the end of `build`.
 *
 * The identity of the *layout*, deliberately, and not of the figures: what it
 * has to answer is "is the thing on screen in the same place it was", and the
 * colours a figure is wearing are not part of that.
 */
let layout = '';

/**
 * Keep the figures whose label mentions every word of the query, and the rows
 * that still have one.
 *
 * A filter rather than a highlight, and the difference is the point: the two
 * biggest views are eighty and thirty figures, and at that pitch the labels are
 * suppressed entirely (see `placeTags`) — so "which of these is the cowboy hat"
 * has no answer you can read. Removing the rest re-frames what is left at a
 * size the labels come back at, which is the same move as clicking one figure,
 * generalised to a handful.
 *
 * The row heading is part of what is matched, so `hats` keeps a whole row and
 * `afro` keeps one column of it. Terms are ANDed — `beanie afro` is one figure.
 */
function narrow(all: Row[], query: string): Row[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return all;
  return all
    .map((row) => ({
      ...row,
      cells: row.cells.filter((cell) => {
        const hay = `${row.label} ${row.note ?? ''} ${cell.name} ${cell.note} ${cell.id}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      }),
    }))
    .filter((row) => row.cells.length > 0);
}

/**
 * Build on a later frame, with a note on screen saying so.
 *
 * `hats × hair` is eighty calls to `buildPerformer` and the filter box rebuilds
 * on every keystroke, both of which block the main thread for long enough to
 * read as a hang. The work is synchronous and staying that way — a half-built
 * grid is worse than a wait — so what this buys is the *paint* before it: two
 * frames is one to show the note and one to be sure it landed. The counter
 * collapses a burst of keystrokes into the last one.
 */
let queued = 0;
function rebuild(): void {
  busy.hidden = false;
  const mine = ++queued;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (mine !== queued) return;
    build();
    busy.hidden = true;
  }));
}

function build(): void {
  clear();
  const all = specOf(view).rows();
  total = all.reduce((n, row) => n + row.cells.length, 0);
  rows = narrow(all, filterBox.value.trim());

  const lines: number[] = [];

  rows.forEach((row, r) => {
    const y = -r * ROW_PITCH;
    row.cells.forEach((cell, c) => {
      const x = (c - (row.cells.length - 1) / 2) * COL_PITCH;
      const group = new Group();
      group.position.set(x, y, 0);
      stand.add(group);

      // The stage's own entry point, not `buildHair` and `buildAccessories`
      // behind it: what makes a hat sit where it sits is `proportions`, and
      // `proportions` is reached by building a whole person.
      const rig = buildPerformer(cell.performer);
      rig.setPlaying(false);
      group.add(rig.root);

      lines.push(x - 0.42, y, 0, x + 0.42, y, 0);

      const tag = document.createElement('div');
      tag.className = 'tag';
      // The seed is appended rather than joined, and `.seed` is its own block
      // when shown: it is hidden until the figure is hovered or picked, and a
      // `<br>` in front of a hidden span is a blank line under every label.
      tag.innerHTML = [
        `<b>${cell.name}</b>`,
        `<span class="v">${cell.note}</span>`,
        cell.swatches
          .map(([, hex]) => `<i class="sw" style="background:${hex}" title="${hex}"></i>`)
          .join(''),
      ].filter(Boolean).join('<br>') + `<span class="seed">${cell.id}</span>`;
      // A drag that ends over a label is a pan, not a pick. See `TAP`.
      tag.onclick = () => { if (travelled <= TAP) select(cell.id); };
      overlay.append(tag);

      live.push({ cell, row: row.label, rig, group, base: new Vector3(x, y, 0), tag });
    });

    const heading = document.createElement('div');
    heading.className = 'row';
    heading.innerHTML = row.note
      ? `${row.label}<span class="${row.warn ? 'warn' : ''}">${row.note}</span>`
      : row.label;
    overlay.append(heading);
    rowTags.push(heading);
  });

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(lines), 3));
  ground = new LineSegments(geo, groundMat);
  stand.add(ground);

  settle = SETTLE_FRAMES;
  applyFacing();

  /*
   * A rebuild that did not move anything leaves the camera alone.
   *
   * `build` refits unconditionally, which is right when the grid changed shape
   * and wrong every other time — and the colour board rebuilds on every swatch,
   * so picking a jacket threw away whatever you had zoomed in on. Comparing the
   * layout rather than trusting the caller to say so is what makes that hold for
   * all of them at once: a palette change produces the same rows and the same
   * ids and keeps the frame, while a filter, a genre or a view produces
   * different ones and refits. Nobody has to remember which is which.
   */
  const shape = rows.map((r) => `${r.label} ${r.cells.map((c) => c.id).join(',')}`).join('');
  if (shape === layout) {
    for (const f of live) f.tag.classList.toggle('sel', f.cell.id === selected);
    resize();
  } else {
    layout = shape;
    selected = undefined;
    fit();
  }
  describe();
}

function applyFacing(): void {
  for (const f of live) f.group.rotation.y = facing;
}

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

/** The visible height of the frame, in metres, and where its centre is. */
let span = 8;
let centre = new Vector3();

/**
 * Frame the whole grid.
 *
 * Sized off the layout rather than off a `Box3` of the figures, deliberately:
 * the bounding box of a row of hats is a different height from the bounding box
 * of a row of bare heads, so framing on the geometry would resize the page every
 * time the view changed and make two screenshots incomparable. The grid is the
 * subject; a beehive that pokes out of the top of the frame is information.
 */
function fit(): void {
  const cols = Math.max(1, ...rows.map((r) => r.cells.length));
  const width = cols * COL_PITCH + 0.9;
  const height = rows.length * ROW_PITCH + 1.4;
  const aspect = Math.max(0.2, canvas.clientWidth / Math.max(1, canvas.clientHeight));
  span = Math.max(height, width / (aspect * (1 - GUTTER)));
  // The rows run downward from zero and a figure stands *up* from its own base,
  // so the occupied band is roughly `+1.9` to `-(rows-1) × pitch`.
  //
  // The grid is pushed right by half the gutter rather than centred, because the
  // row headings live outboard of the leftmost figure and need somewhere to be.
  // As a *fraction* of the frame and not a fixed number of metres: the hats grid
  // is eight rows tall and framed on its height, so a fixed 0.6 m gutter that
  // looked right on a two-row view left the headings a hundredth of the screen.
  centre = new Vector3(
    // Negative: moving the *camera* left is what moves the *grid* right.
    -(GUTTER / 2) * span * aspect,
    (1.9 - (rows.length - 1) * ROW_PITCH) / 2,
    0,
  );
  resize();
}

/** How much of the frame is kept clear at the left for the row headings. */
const GUTTER = 0.22;

function resize(): void {
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  if (w <= 0 || h <= 0) return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  const halfH = span / 2;
  const halfW = halfH * (w / h);
  camera.left = -halfW;
  camera.right = halfW;
  camera.top = halfH;
  camera.bottom = -halfH;
  camera.position.set(centre.x, centre.y, 80);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);

/**
 * Zoom about the middle of the frame, in steps.
 *
 * The wheel does the same thing continuously and this exists beside it because
 * the wheel is the one control on the page a screenshot cannot be driven by:
 * every defect on this bench has to be *reproducible from a key sequence*, or
 * the next person to look at it is back to dragging by hand. Same reason the
 * turn is four buttons rather than a slider.
 */
function zoom(by: number): void {
  span = Math.max(0.9, Math.min(60, span * by));
  resize();
}

/** Put one figure in the middle of the frame, at a size worth looking at. */
function select(id: string | undefined): void {
  selected = selected === id ? undefined : id;
  const found = live.find((f) => f.cell.id === selected);
  if (found) {
    span = 2.9;
    centre = new Vector3(found.base.x, found.base.y + 1.15, 0);
    resize();
  } else {
    fit();
  }
  for (const f of live) f.tag.classList.toggle('sel', f.cell.id === selected);
  describe();
  // The panel is taller than most windows, so on a short screen the inspector
  // is below the fold — and a reply that has to be scrolled to is a reply that
  // did not arrive. Only on the way in: scrolling on deselect would move the
  // panel under a pointer that is about to click the next figure.
  if (found) inspectBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const P = new Vector3();

function placeTags(): void {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const on = showTags.checked;
  overlay.style.display = on ? '' : 'none';
  if (!on) return;

  /**
   * A label narrower than its own column, or none.
   *
   * The hats grid is eighty figures and, framed whole, a column is about sixty
   * pixels across — at which point every label overlaps its neighbours and the
   * page is a wall of grey text over the thing it is annotating. Dropping them
   * below a legible pitch is not a compromise: the labels are for reading one
   * figure, and a grid too small to read one figure in is a grid you are looking
   * at for its shape.
   */
  const pitch = Math.abs(
    P.set(COL_PITCH, 0, 0).project(camera).x - P.set(0, 0, 0).project(camera).x,
  ) * 0.5 * w;
  /*
   * A label can only collide with the label beside it, so a grid one figure
   * wide is always legible however small the pitch is. That is not a corner
   * case since the filter: narrowing eighty figures to the four that mention
   * `robe` leaves four rows of one, framed on their *height* — and the whole
   * point of having narrowed them is to read what they say.
   */
  const legible = pitch > 88 || rows.every((r) => r.cells.length <= 1);

  for (const f of live) {
    f.tag.style.display = legible ? '' : 'none';
    if (!legible) continue;
    // Under the feet, so a label never crosses the figure it belongs to.
    P.copy(f.base).setY(f.base.y - 0.12).project(camera);
    f.tag.style.left = `${(P.x * 0.5 + 0.5) * w}px`;
    f.tag.style.top = `${(-P.y * 0.5 + 0.5) * h}px`;
  }
  rows.forEach((row, r) => {
    const tag = rowTags[r];
    if (!tag) return;
    const left = -((Math.max(1, row.cells.length) - 1) / 2) * COL_PITCH - 0.74;
    P.set(left, -r * ROW_PITCH + 1.05, 0).project(camera);
    // Anchored by its *right* edge rather than given a width, because a heading
    // longer than the space left of the grid has to run off the side of the
    // page rather than over the first figure in the row — which is what a
    // fixed width and `nowrap` do, in the one direction that matters.
    tag.style.right = `${w - (P.x * 0.5 + 0.5) * w}px`;
    tag.style.top = `${(-P.y * 0.5 + 0.5) * h}px`;
  });
}

// ---------------------------------------------------------------------------
// The readout
// ---------------------------------------------------------------------------

/**
 * What one figure is wearing, field by field.
 *
 * Read off `Look` rather than off `Cell.swatches`, which is deliberately the
 * other way round from the tag under the figure. A tag says the one thing its
 * row is about and has to fit in a column; the inspector is the answer to
 * "everything about this one", and on the wardrobe view — where the figure was
 * dealt by `castSong` rather than written here — that is the only place the
 * whole `Look` can be read at all.
 */
const INSPECT_SWATCHES: readonly (readonly [string, (l: Look) => string])[] = [
  ['skin', (l) => l.skin], ['hair', (l) => l.hair],
  ['jacket', (l) => l.outfit.jacket], ['shirt', (l) => l.outfit.shirt],
  ['trousers', (l) => l.outfit.trousers], ['accent', (l) => l.outfit.accent],
];

function inspectOne(chosen: Figure): void {
  const { look } = chosen.cell.performer;
  const rows_: (readonly [string, string])[] = [
    ['figure', chosen.cell.name],
    ['in row', chosen.row],
    ['garment', look.outfit.garment],
    ['fabric', look.outfit.fabric],
    ['hair', look.hairStyle],
    ['worn', look.accessories.join(', ') || '<span class="none">nothing</span>'],
    ['body', `${look.height.toFixed(2)} m · build ${look.build.toFixed(2)}`],
    ['drawn', `${chosen.rig.measure().objects} objects · head r ${chosen.rig.proportions.headR.toFixed(3)} m`],
  ];
  // Only the wardrobe view casts real players; everything else is a bench
  // figure holding nothing, and a row saying so is a row of noise.
  if (chosen.cell.performer.instrument !== BENCH_INSTRUMENT) {
    rows_.splice(2, 0, ['plays', chosen.cell.performer.instrument]);
  }
  rows_.push(['seed', `<span class="seed">${chosen.cell.id}</span>`]);

  inspectFields.innerHTML = rows_
    .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  swatchBox.innerHTML = INSPECT_SWATCHES
    .map(([what, of]) => {
      const hex = of(look);
      return `<span><i class="sw" style="background:${hex}"></i>${what} ${hex}</span>`;
    }).join('');
}

function describe(): void {
  const spec = specOf(view);
  blurbLine.innerHTML = spec.blurb;

  paletteNote.innerHTML = spec.id === 'fabric'
    ? 'the coat colour — each row shades it to one end of the scale and holds it across the fifteen'
    : 'worn by every figure here — click a swatch to redress the whole grid';

  const filtered = filterBox.value.trim().length > 0;
  const plural = rows.length === 1 ? '' : 's';
  countLine.innerHTML = !filtered
    ? `<b>${live.length}</b> figures in ${rows.length} row${plural}`
    : live.length === 0
      ? '<span class="warn">nothing matches</span> — clear the filter'
      : `<b>${live.length}</b> of ${total} figures · ${rows.length} row${plural}`;

  // Normalised, because `q` and `e` step without a stop and a bench that reports
  // −405° is a bench reporting how many times you pressed a key.
  const deg = ((facing * 180 / Math.PI) % 360 + 360) % 360;
  turnNote.textContent = `${deg.toFixed(0)}° — the figures turn, not the camera`;

  const chosen = live.find((f) => f.cell.id === selected);
  inspectBox.hidden = !chosen;
  if (chosen) inspectOne(chosen);
}

function noteGenre(): void {
  const g = GENRES[genre];
  if (!g) return;
  const eras = Object.keys(g.eras).length;
  genreNote.innerHTML = `<b>${g.label}</b> — ${eras} era${eras === 1 ? '' : 's'}, one row each`;
}

// ---------------------------------------------------------------------------
// The colour board
// ---------------------------------------------------------------------------

interface Swatches {
  /** What the row is called on the board. */
  role: string;
  /** Which of the five colours a chip in this row sets. */
  slot: keyof Palette;
  hexes: readonly string[];
}

/**
 * The six rows of the board, and where each one's candidates live.
 *
 * Six rows for five slots: `loud` is the spotlight jacket, a *different list*
 * for the same garment — what a wardrobe reserves for whoever is fronting the
 * number and never puts on the band. It has its own row because seeing it is
 * half the point of a colour reference: `sequin`, `lame` and the one bright coat
 * per genre only ever reach a stage through that list, so a board that folded it
 * into `jackets` would be a board claiming the band wears them.
 */
const ROLES: readonly (readonly [string, keyof Palette, (w: Wardrobe) => string[]])[] = [
  ['jacket', 'jacket', (w) => w.jackets],
  ['shirt', 'shirt', (w) => w.shirts],
  ['trousers', 'trousers', (w) => w.trousers],
  ['accent', 'accent', (w) => w.accents],
  ['hair', 'hair', (w) => w.hair],
  ['loud', 'jacket', (w) => w.loud],
];

/** Every colour the chosen source can deal, by role. */
function board(): Swatches[] {
  if (!palSource) {
    // The bench's own control look, which is one colour per slot and has no
    // spotlight jacket — nobody on a bench is fronting anything.
    return ROLES
      .filter(([role]) => role !== 'loud')
      .map(([role, slot]) => ({ role, slot, hexes: [BENCH_PALETTE[slot]] }));
  }
  const [g, era] = palSource.split(':');
  const w = wardrobeFor(g!, era!);
  return ROLES.map(([role, slot, of]) => ({ role, slot, hexes: of(w) }));
}

function drawPalette(): void {
  palGrid.replaceChildren();
  for (const { role, slot, hexes } of board()) {
    const name = document.createElement('div');
    name.className = 'role';
    name.textContent = role;

    const chips = document.createElement('div');
    chips.className = 'chips';
    for (const hex of hexes) {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.style.background = hex;
      chip.title = `${role} ${hex}`;
      if (palette[slot] === hex) chip.classList.add('on');
      chip.addEventListener('click', () => {
        palette = { ...palette };
        palette[slot] = hex;
        drawPalette();
        rebuild();
      });
      chips.append(chip);
    }
    palGrid.append(name, chips);
  }
}

/**
 * Every `genre:era` that declares a wardrobe, grouped by genre.
 *
 * Built from the tables rather than from `Genre.eras`, so an era with no
 * wardrobe of its own is not offered: `wardrobeFor` would answer it with the
 * genre's fallback, and a board offering two era names that resolve to one set
 * of colours is a board lying about how many there are.
 */
function fillPalettePicker(): void {
  palettePick.append(new Option('bench — the neutral control', ''));
  for (const [id, g] of Object.entries(GENRES)) {
    const table = g.staging?.wardrobe;
    if (!table) continue;
    const group = document.createElement('optgroup');
    group.label = id;
    for (const era of Object.keys(table)) {
      group.append(new Option(`${id}:${era}`, `${id}:${era}`));
    }
    palettePick.append(group);
  }
}

palettePick.onchange = () => {
  palSource = palettePick.value;
  // Dress in the head of each list, which is the wardrobe's own first answer.
  // `loud` is skipped: it shares the jacket slot and would otherwise put the
  // spotlight coat on every figure, which is the one thing it never is.
  const next = { ...BENCH_PALETTE };
  for (const { role, slot, hexes } of board()) {
    if (role === 'loud') continue;
    if (hexes[0]) next[slot] = hexes[0];
  }
  palette = next;
  drawPalette();
  rebuild();
};

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------

/**
 * One button per view, built from `VIEWS` rather than written in the markup.
 *
 * Which is the fix for a class of bug this page had rather than a preference:
 * the switcher, the keyboard map and the blurb table were three lists that had
 * to be kept in the same order by hand, and adding a sixth view to two of them
 * is how a view ends up unreachable.
 */
const viewButtons = VIEWS.map((spec) => {
  const b = document.createElement('button');
  b.dataset.view = spec.id;
  b.innerHTML = `<span>${spec.label}</span><i>${spec.size}</i>`;
  b.title = spec.blurb.replace(/<\/?b>/g, '');
  b.addEventListener('click', () => setView(spec.id));
  viewsBox.append(b);
  return b;
});

function setView(next: ViewId): void {
  view = next;
  for (const b of viewButtons) b.classList.toggle('on', b.dataset.view === next);
  // Hidden rather than disabled. A greyed-out control is a question — *why* is
  // this off — and the answer here is only ever "this view has no genre", which
  // is said better by the box not being there.
  genreBox.hidden = next !== 'wardrobe';
  paletteBox.hidden = !specOf(next).dressable;
  rebuild();
}

for (const id of Object.keys(GENRES)) genrePick.append(new Option(id, id));
genrePick.value = genre;
genrePick.onchange = () => { genre = genrePick.value; noteGenre(); rebuild(); };

function stepGenre(by: number): void {
  const ids = Object.keys(GENRES);
  const i = (ids.indexOf(genre) + by + ids.length) % ids.length;
  genre = ids[i]!;
  genrePick.value = genre;
  noteGenre();
  if (view !== 'wardrobe') setView('wardrobe');
  else rebuild();
}
document.getElementById('prev')!.onclick = () => stepGenre(-1);
document.getElementById('next')!.onclick = () => stepGenre(1);

/**
 * Rebuild on a pause in the typing, not on a keystroke.
 *
 * `rebuild` already collapses a burst into one build, but it does that a frame
 * later — so a fast typist still pays for a build of `h`, `ha`, `hai`. A short
 * idle is the honest signal that a query is finished.
 */
let typing: ReturnType<typeof setTimeout> | undefined;
filterBox.addEventListener('input', () => {
  clearTimeout(typing);
  typing = setTimeout(rebuild, 170);
});

const TURNS: readonly (readonly [string, number])[] = [
  ['face-front', 0], ['face-three', Math.PI * 0.28], ['face-side', Math.PI / 2],
  ['face-back', Math.PI],
];
function setFacing(a: number): void {
  facing = a;
  for (const [id, angle] of TURNS) {
    document.getElementById(id)!.classList.toggle('on', Math.abs(angle - a) < 1e-6);
  }
  applyFacing();
  describe();
}
for (const [id, angle] of TURNS) {
  document.getElementById(id)!.addEventListener('click', () => setFacing(angle));
}

document.getElementById('fit')!.onclick = () => { selected = undefined; select(undefined); };
document.getElementById('clearSel')!.onclick = () => { selected = undefined; select(undefined); };
document.getElementById('zoomIn')!.onclick = () => zoom(1 / 1.35);
document.getElementById('zoomOut')!.onclick = () => zoom(1.35);
showTags.onchange = () => placeTags();

/**
 * Fold the panel away, and give the grid the width it was occupying.
 *
 * The canvas is inset by the panel rather than covered by it, so folding it is
 * a *resize* and the framing has to be redone — `fit` reads `clientWidth`, which
 * forces the layout the class change just invalidated, so the number it gets is
 * the new one. A figure being examined keeps its zoom; only the whole-grid
 * framing is a function of the frame's shape.
 */
const panelToggle = document.getElementById('panelToggle')!;
function togglePanel(): void {
  const slim = document.body.classList.toggle('slim');
  panelToggle.textContent = slim ? '‹' : '›';
  panelToggle.title = slim ? 'show the panel (\\)' : 'hide the panel (\\)';
  if (selected) resize();
  else fit();
}
panelToggle.onclick = togglePanel;

/**
 * The pan, which begins anywhere over the grid — labels included.
 *
 * On the canvas alone it did not: the labels lie over the figures they name, and
 * a drag that started on one hit the label instead, so the camera stayed put
 * while a text selection swept across the page. Listening on the window and
 * excluding the panel is the same rule stated the way it was always meant —
 * *anything that is not a control is the grid* — and it costs the pointer
 * capture, which the window listeners replace: a drag that leaves the frame
 * keeps panning either way.
 */
let dragging = false;
/** Pixels travelled since the button went down. See `TAP`. */
let travelled = 0;
/** Under this, a press was a click on a label; over it, it was a drag. */
const TAP = 4;

function onChrome(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('#panel, #panelToggle'));
}

window.addEventListener('pointerdown', (e) => {
  if (onChrome(e.target)) return;
  dragging = true;
  travelled = 0;
});
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  travelled += Math.abs(e.movementX) + Math.abs(e.movementY);
  // Pan in metres, not pixels: the same drag moves the same distance across the
  // grid whatever the zoom is.
  const perPixel = span / Math.max(1, canvas.clientHeight);
  centre.x -= e.movementX * perPixel;
  centre.y += e.movementY * perPixel;
  resize();
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoom(Math.exp(e.deltaY * 0.0012));
}, { passive: false });

window.addEventListener('keydown', (e) => {
  /*
   * The page has a text box now, and every shortcut below is a bare letter — so
   * without this, filtering for `wraparounds` pans the camera four times, turns
   * the figures twice and rebuilds the grid on the `a`. The box gets `esc` back
   * out of it and nothing else.
   */
  if (e.target instanceof HTMLInputElement && e.target.type === 'search') {
    if (e.key === 'Escape') filterBox.blur();
    return;
  }
  // A focused `<select>` handles the arrows itself; stepping the genre twice per
  // press is the same key doing the same job in two places.
  if (e.target instanceof HTMLSelectElement) return;
  if (e.key === '/') { e.preventDefault(); filterBox.focus(); filterBox.select(); return; }
  if (e.key === '\\') { togglePanel(); return; }

  const n = Number(e.key);
  if (n >= 1 && n <= VIEWS.length) { setView(VIEWS[n - 1]!.id); return; }
  if (e.key === 'ArrowLeft') stepGenre(-1);
  if (e.key === 'ArrowRight') stepGenre(1);
  if (e.key === 'q') setFacing(facing - Math.PI / 8);
  if (e.key === 'e') setFacing(facing + Math.PI / 8);
  if (e.key === '+' || e.key === '=') zoom(1 / 1.35);
  if (e.key === '-' || e.key === '_') zoom(1.35);
  if (e.key === 'w') { centre.y += span * 0.18; resize(); }
  if (e.key === 's') { centre.y -= span * 0.18; resize(); }
  if (e.key === 'a') { centre.x -= span * 0.18; resize(); }
  if (e.key === 'd') { centre.x += span * 0.18; resize(); }
  if (e.key === 'Escape') { selected = undefined; select(undefined); }
});

// ---------------------------------------------------------------------------
// The frame
// ---------------------------------------------------------------------------

/**
 * Eighty rigs is not eighty rigs a frame.
 *
 * `PerformerRig.update` re-fits four limbs, re-solves a face and steps two
 * hands, and the hats grid puts eighty of those on one page — which at sixty
 * frames a second is a slideshow, and a slideshow is a worse bench than a still
 * picture. So a new grid is stepped for `SETTLE_FRAMES` and then left alone,
 * which is also the honest answer for what this page is: a costume does not
 * move, and the comparison is easier when nothing is breathing.
 *
 * `groove` turns the stepping back on for good, and it is not decoration. Hair
 * that hangs — a mane, a curtain, dreadlocks — is parented to a head that rides
 * a swaying torso, and whether it passes through a shoulder on the way is a
 * question only a moving figure can answer.
 */
let last = performance.now();
function frame(now: number): void {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;

  const moving = motion.checked;
  if (moving || settle > 0) {
    if (settle > 0) settle--;
    const t = now / 1000;
    for (const f of live) {
      if (moving) {
        f.rig.setSway(0.7, t * 1.6);
        f.rig.setHeadNod(0.4);
      } else {
        f.rig.setSway(0, 0);
        f.rig.setHeadNod(0);
      }
      f.rig.update(t, dt);
    }
  }

  placeTags();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

setFacing(0);
noteGenre();
fillPalettePicker();
drawPalette();
setView('wardrobe');
requestAnimationFrame(frame);
