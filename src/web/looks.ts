/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The costume bench — every hair style, hat, fabric and wardrobe, side by side.
 *
 * `web/concert/gallery.ts` exists because twenty-two instrument models were
 * built, asserted against and shipped with no way to *look* at any of them, and
 * a trumpet whose bell pointed at the ceiling survived that for as long as no
 * show happened to feature a trumpet in a close shot. The same thing has now
 * happened one layer in: `HairStyle` went from eight values to sixteen,
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
 * The synthetic views hold everything constant except the one axis they are
 * about. One body, one skin, one hair colour and one outfit across all sixteen
 * hair styles; one hair style and one outfit across all twenty accessories; one
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
  Scene, Vector3, WebGLRenderer,
} from 'three';

import { castSong } from '../concert/cast.js';
import type {
  Accessory, Fabric, HairStyle, Look, Performer, Posture,
} from '../concert/types.js';
import { chooseVenue } from '../concert/venue.js';
import { generateSong } from '../generate/song.js';
import { GENRES } from '../genre/index.js';

import { lightTheRoom } from './concert/performer-assets.js';
import { buildPerformer, type PerformerRig } from './concert/performer.js';

const canvas = document.getElementById('bench') as HTMLCanvasElement;
const overlay = document.getElementById('labels')!;
const facts = document.getElementById('facts')!;
const genrePick = document.getElementById('genre') as HTMLSelectElement;
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
  long: null, mane: null, mullet: null, dreadlocks: null,
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
 * What goes on a head, as opposed to on a face or round a neck.
 *
 * The seven in `cast.ts`'s first `EXCLUSIVE` group — one hat at most — plus
 * `headphones`, which is deliberately *not* in that group so that a tender at a
 * rig can wear a beanie and cans at once. That exemption is exactly why cans
 * belong in this grid: they are the one piece of head furniture the wardrobe is
 * allowed to put on top of something else, and the only page that could ever
 * have caught it doing so is this one.
 */
const HEAD_WORN: readonly Accessory[] = [
  'porkpie', 'flatcap', 'ballcap', 'beanie', 'cowboyhat', 'bandana', 'turban',
  'headphones',
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

function dressed(over: Partial<Look>, outfit: Partial<Look['outfit']> = {}): Look {
  return {
    ...BASE_LOOK, ...over,
    outfit: { ...BASE_LOOK.outfit, ...outfit },
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
 * things `Look` leaves open, which is what stops sixteen heads of curls being
 * one head of curls drawn sixteen times.
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

type ViewId = 'wardrobe' | 'hair' | 'accessories' | 'hats' | 'fabric';

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
function figure(id: string, look: Look, posture: Posture = 'stand'): Performer {
  return {
    id,
    layer: 'vocal',
    archetype: 'singer',
    instrument: 'costume bench',
    look,
    station: { position: [0, 0, 0], facing: 0, posture, riser: 0 },
  };
}

/** The colours a synthetic figure is worth naming. */
function baseSwatches(look: Look): readonly (readonly [string, string])[] {
  return [['hair', look.hair], ['jacket', look.outfit.jacket], ['accent', look.outfit.accent]];
}

/**
 * Sixteen styles on one head.
 *
 * Two rows of eight rather than four of four, because the comparison that
 * matters most is between neighbours and `HairStyle`'s own grouping — held close
 * to the skull, shaped, hanging, cloth — puts the styles that could be confused
 * for each other next to each other. `long` beside `mane` is the pair the union
 * itself argues about.
 */
function hairView(): Row[] {
  const half = Math.ceil(HAIR.length / 2);
  return [0, 1].map((r) => ({
    label: r === 0 ? 'close & shaped' : 'hanging & cloth',
    cells: HAIR.slice(r * half, (r + 1) * half).map((style) => {
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
 * Twenty accessories, each on the same head of hair.
 *
 * On `short` rather than on `bald`, because `short` is what most of the
 * catalogue is wearing and a hat that clears a bare skull is not evidence of
 * anything. The hats get their own view against everything else — see
 * `hatsView` — so this one is about whether the object is the object at all.
 */
function accessoryView(): Row[] {
  const per = 7;
  const out: Row[] = [];
  for (let i = 0; i < ACCESSORIES.length; i += per) {
    const slice = ACCESSORIES.slice(i, i + per);
    out.push({
      label: `${slice[0]!} …`,
      cells: slice.map((acc) => {
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
 */
function fabricView(): Row[] {
  const rowsOut: Row[] = [];
  for (const [tone, jacket, trousers] of [
    ['pale', '#b9b3a8', '#8d8880'], ['dark', '#2b2f36', '#22252a'],
  ] as const) {
    rowsOut.push({
      label: `${tone} coat`,
      note: 'one colour, fifteen reflectances',
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

/** What the facts line says the view is for. */
const BLURB: Record<ViewId, string> = {
  wardrobe: 'every genre’s wardrobe as <b>castSong</b> actually draws it — one number per era, vocals on so the lead can get the loud jacket',
  hair: 'all sixteen <b>HairStyle</b> values on one body, one skin, one hair colour',
  accessories: 'all twenty <b>Accessory</b> values, one at a time, over short hair',
  hats: 'everything worn on a head × every head — the grid the intersections are in',
  fabric: 'all fifteen <b>Fabric</b> values in one colour, under one directional key',
};

function rowsFor(v: ViewId): Row[] {
  switch (v) {
    case 'hair': return hairView();
    case 'accessories': return accessoryView();
    case 'hats': return hatsView();
    case 'fabric': return fabricView();
    case 'wardrobe': return wardrobeView(genre);
  }
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

function build(): void {
  clear();
  rows = rowsFor(view);

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
      tag.innerHTML = [
        `<b>${cell.name}</b>`,
        `<span class="v">${cell.note}</span>`,
        cell.swatches
          .map(([, hex]) => `<i class="sw" style="background:${hex}" title="${hex}"></i>`)
          .join(''),
        `<span class="seed">${cell.id}</span>`,
      ].join('<br>');
      tag.onclick = () => select(cell.id);
      overlay.append(tag);

      live.push({ cell, rig, group, base: new Vector3(x, y, 0), tag });
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
  selected = undefined;
  applyFacing();
  fit();
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
  const legible = pitch > 88;

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
// The facts line
// ---------------------------------------------------------------------------

function describe(): void {
  const chosen = live.find((f) => f.cell.id === selected);
  const head = chosen
    ? [
      `<b>${chosen.cell.name}</b> — ${chosen.cell.note}`,
      chosen.cell.swatches.map(([what, hex]) => `${what} <i class="sw" style="background:${hex}"></i>${hex}`).join(' · '),
      `seed <b>${chosen.cell.id}</b> · height ${chosen.rig.proportions.height.toFixed(2)} m · head r ${chosen.rig.proportions.headR.toFixed(3)} m · ${chosen.rig.measure().objects} objects`,
    ]
    : [
      BLURB[view],
      `${live.length} figures in ${rows.length} rows · ${(facing * 180 / Math.PI).toFixed(0)}° turn`,
      '<span class="key">1–5 views · ←/→ genre · q/e turn · +/− zoom · wasd pan · click a label to zoom · esc back</span>',
    ];
  facts.innerHTML = head.join('<br>');
}

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------

const VIEWS: readonly ViewId[] = ['wardrobe', 'hair', 'accessories', 'hats', 'fabric'];

function setView(next: ViewId): void {
  view = next;
  for (const v of VIEWS) {
    document.getElementById(`v-${v}`)!.classList.toggle('on', v === next);
  }
  genrePick.disabled = next !== 'wardrobe';
  build();
}
for (const v of VIEWS) {
  document.getElementById(`v-${v}`)!.addEventListener('click', () => setView(v));
}

for (const id of Object.keys(GENRES)) genrePick.append(new Option(id, id));
genrePick.value = genre;
genrePick.onchange = () => { genre = genrePick.value; build(); };

function stepGenre(by: number): void {
  const ids = Object.keys(GENRES);
  const i = (ids.indexOf(genre) + by + ids.length) % ids.length;
  genre = ids[i]!;
  genrePick.value = genre;
  if (view !== 'wardrobe') setView('wardrobe');
  else build();
}
document.getElementById('prev')!.onclick = () => stepGenre(-1);
document.getElementById('next')!.onclick = () => stepGenre(1);

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
showTags.onchange = () => placeTags();

let dragging = false;
canvas.addEventListener('pointerdown', (e) => {
  dragging = true;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
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
  const n = Number(e.key);
  if (n >= 1 && n <= VIEWS.length) { setView(VIEWS[n - 1]!); return; }
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
setView('wardrobe');
requestAnimationFrame(frame);
