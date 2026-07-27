/**
 * Who is on stage, what they look like, and where they are standing.
 *
 * Three jobs that look separate and are not. A drummer is centre-back because
 * the kit is the loudest and least portable thing on the stage; the singer is
 * downstage because that is where a microphone goes; and both of those facts
 * are also why the drummer is the one on a riser and the singer is the one in
 * the loud jacket. Casting, appearance and staging are one decision made three
 * times, so they live in one file.
 *
 * ## Placement is a layout problem, not a lookup table
 *
 * The obvious implementation is a table of positions per instrumentation, and
 * it fails on contact with the generator: the arrangement decides which layers
 * sound, section by section and song by song, so the band is anywhere from two
 * players to eight and the same layer arrives on a flute one night and a
 * vibraphone the next. A table would need an entry per subset.
 *
 * What is written here instead is **anchors plus relaxation**. Each role gets
 * the position a bandleader would put it in, and a solver then pushes everyone
 * apart until four hard constraints hold:
 *
 *  1. **Nobody overlaps.** Distance between any two stations is at least the
 *     sum of their `footprint`s. That is a real number from a real table — a
 *     drum kit claims 1.6 m and a flute 0.7 — so a kit and a grand piano end up
 *     3.1 m apart, which is what they are on any stage you have ever seen.
 *  2. **Everybody is on the boards**, inside `venue.width × venue.depth` with a
 *     margin, and not standing on the downstage lip.
 *  3. **The structure survives the solver.** Each role carries a *band* of
 *     allowed depth rather than a point, so pushing two horns apart spreads
 *     them sideways along the front line instead of squeezing one of them
 *     upstage into the kit. Separation is deliberately biased into `x` for the
 *     same reason: a band spreads across a stage, not into the audience.
 *  4. **Everyone can be seen.** From a fixed centred camera, no player's
 *     silhouette may be swallowed by the player in front of them — and "seen"
 *     means inside the proscenium opening, which is narrower than the boards.
 *     A player standing behind a tormentor satisfies every other constraint in
 *     this file and is invisible, which makes it the worst failure available.
 *
 * ## Ambient is designed for, not degraded into
 *
 * Every sentence above assumes a rhythm section, a front line and a band facing
 * the same way, and ambient has none of those. It gets its own placement
 * routine — a table of gear off to one side, the rest scattered in the fog,
 * nobody downstage centre and nobody looking at anybody. Sharing the band
 * layout and disabling parts of it would have produced a dance band with the
 * drummer deleted, which is exactly the failure the plan names as a risk.
 *
 * ## Determinism
 *
 * Everything is drawn from `seed` through namespaced `Rng` streams, never
 * `Math.random()`. Appearance keys on the *concert* seed and the performer id
 * alone — deliberately not on the song — because it is one band playing a set:
 * the accordionist has to have the same face in the fourth number as in the
 * first. Placement keys on the seed and re-runs per number, because the cast
 * changes when the instrumentation does.
 */

import { Rng } from '../core/rng.js';
import type { LayerId, Song } from '../core/types.js';
import { LAYER_ORDER } from '../core/types.js';
import { GENRES } from '../genre/index.js';
import type { EraProfile } from '../style/types.js';
import {
  DRUM_ARCHETYPE, VOCAL_ARCHETYPE, archetypeForTrack, specFor,
} from './instruments.js';
import type {
  Accessory, Archetype, ArchetypeSpec, Cast, HairStyle, Look, Performer,
  Posture, Station, Venue,
} from './types.js';

/**
 * Where the house camera sits, in the stage's own metres.
 *
 * The director (`web/concert/camera.ts`) cuts between several shots, but the
 * sightline constraint has to be checked against *something* fixed or it means
 * nothing, and this is the shot every stage picture is composed for: centred,
 * a little above head height, out in the room. Exported so the verifier can
 * assert against the same camera this file staged for.
 */
export const DEFAULT_CAMERA: readonly [number, number, number] = [0, 2.4, 11];

// ---------------------------------------------------------------------------
// Constants that decide what the stage picture looks like
// ---------------------------------------------------------------------------

/** Metres of boards kept clear at the sides and upstage. */
const MARGIN_SIDE = 0.5;
const MARGIN_UP = 0.5;
/** More downstage: nobody stands on the lip, and the front row needs air. */
const MARGIN_DOWN = 0.7;

/**
 * The fraction of `venue.width` that is actually *visible* stage.
 *
 * `venue.width` is the boards. The proscenium opening is narrower than the
 * boards — `web/concert/stage.ts` builds it at 94% and masks the rest behind
 * tormentors — so the outer 6% is a place a performer can stand and not be
 * seen. That is the worst possible failure mode for a staging system, because
 * every other constraint would report success.
 *
 * So the usable half-width is the *tighter* of the margin and the opening.
 * Today the margin wins at every venue size in the file; the opening is here so
 * that a wider stage, or a smaller margin, cannot quietly push somebody behind
 * the arch.
 */
const OPENING = 0.47;

/**
 * And the front line stays further in still.
 *
 * A player at the edge of the opening is visible from the centred camera and
 * clipped from every seat off to that side. Upstage players can take that risk
 * — they are further away and the angle is shallower — but the front line is
 * the part of the picture the show is composed around.
 */
const FRONT_OPENING = 0.44;

/**
 * The house drum riser: 2.8 m × 2.0 m, top at 0.4 m, centred 1.45 m downstage
 * of the back edge of the boards.
 *
 * These numbers are not a choice made here. `web/concert/stage.ts` builds a
 * physical riser at exactly this size and place, and `Station.riser` is
 * therefore double-owned: emit anything other than 0.4 for a player standing on
 * it and the kit floats above the platform or sinks into it. So there is
 * exactly one riser on this stage, the drummer is pinned to its footprint, and
 * everybody else is on the boards at 0.
 *
 * The cost is real and worth naming: the sightline pass used to fix a hidden
 * drummer by raising the riser, which is what a stage manager would do and is
 * no longer available. It moves whoever is in front instead.
 */
const RISER_HEIGHT = 0.4;
const RISER_HALF_WIDTH = 1.4;
const RISER_FROM_BACK = 1.45;
const RISER_HALF_DEPTH = 1.0;

/**
 * The radius of a *person*, as opposed to their instrument.
 *
 * `footprint` is what the player and the instrument occupy on the floor and is
 * the right number for keeping them out of each other's way. It is the wrong
 * number for sightlines: a grand piano is 1.5 m of footprint and hides nobody,
 * because it is knee-high. What hides a player is another player's shoulders.
 */
const SILHOUETTE_R = 0.32;

/**
 * How much of a player's silhouette a nearer player may cover before the two
 * count as stacked. Below this they are simply beside each other on screen.
 */
const COVER_LIMIT = 0.6;

/**
 * How far a stacked player's head must clear the head in front, in radians at
 * the camera. 0.012 rad is about 13 cm of apparent separation at this distance
 * — enough to read as "behind" rather than as "gone".
 *
 * The drummer gets more, because a drummer is sitting down behind a wall of
 * drums and is the single easiest player on a stage to lose.
 */
const HEAD_CLEARANCE = 0.012;
const DRUMMER_CLEARANCE = 0.02;

/** Separation pushes are flattened in `z` so a crowded band spreads sideways. */
const Z_BIAS = 0.4;

/**
 * Five millimetres of slack on top of every footprint sum.
 *
 * Not a fudge factor — it pays for the rounding at the end of this file.
 * Stations are emitted to the millimetre, and a solver that converges to
 * *exactly* the constraint leaves a pair 1.4 mm inside it once both positions
 * have been rounded. A verifier asserting `d >= r1 + r2` would then report a
 * violation that does not exist. Solving for a hair more than is needed makes
 * the property survive serialisation.
 */
const CLEARANCE_PAD = 0.005;

const EPS = 1e-4;

// ---------------------------------------------------------------------------
// The roster
// ---------------------------------------------------------------------------

/**
 * What a player is for the purposes of standing somewhere.
 *
 * Deliberately coarser than `LayerId`: melody, counter, brass and voice all
 * want the front of the stage and differ only in who gets the middle of it.
 */
type Role = 'kit' | 'bass' | 'comp' | 'pad' | 'front';

interface Box { x0: number; x1: number; z0: number; z1: number }

/** A performer under construction, carrying the scratch state placement needs. */
interface Slot {
  id: string;
  layer: LayerId;
  archetype: Archetype;
  instrument: string;
  spec: ArchetypeSpec;
  role: Role;
  look: Look;
  x: number;
  z: number;
  /** `spec.footprint`, hoisted because the solver reads it in its inner loop. */
  r: number;
  /** Resistance to being pushed. The kit is heavy; a flute player is not. */
  anchor: number;
  facing: number;
  posture: Posture;
  riser: number;
  /**
   * Whether this player's box survives the solver's relaxation passes.
   *
   * Only the drummer sets it, and only because they are standing on a physical
   * platform whose position the stage builder owns. Everybody else can be given
   * more room when the layout is over-constrained; the drummer cannot, because
   * the extra room is off the edge of the riser.
   */
  locked: boolean;
  /** How high this player's head is above their feet, from posture and height. */
  head: number;
  /** Allowed region. Starts as the role's band and widens if the solver stalls. */
  box: Box;
  /** Ambient only: stay out of the downstage-centre spot nobody occupies. */
  avoidFrontCentre: boolean;
}

const ROLE_OF: Record<LayerId, Role> = {
  drums: 'kit',
  bass: 'bass',
  comp: 'comp',
  pad: 'pad',
  melody: 'front',
  counter: 'front',
  brass: 'front',
  vocal: 'front',
};

/** Who takes the middle of the front line. Lower wins. */
const PROMINENCE: Record<LayerId, number> = {
  vocal: 0, melody: 1, counter: 2, brass: 3,
  comp: 4, bass: 5, pad: 6, drums: 7,
};

/**
 * A head is not on top of a standing body when the body is sitting on a drum
 * throne. These are the numbers the sightline test uses, and they are why the
 * drummer needs a riser at all: a seated player loses close to 40 cm.
 */
function headAbove(posture: Posture, height: number): number {
  switch (posture) {
    case 'sit': return height * 0.76;
    case 'kit': return height * 0.78;
    case 'stool': return height * 0.86;
    case 'perch': return height * 0.94;
    default: return height;
  }
}

// ---------------------------------------------------------------------------
// Appearance
// ---------------------------------------------------------------------------

/**
 * One skin palette for everybody, picked uniformly.
 *
 * The variation this system is *for* is genre and era, and those live in the
 * clothes and the hair. Weighting skin tone by genre would be inventing a
 * demographic claim the music does not make, and the alternative — a single
 * tone — would be a different claim again. A spread, drawn evenly, keeps the
 * axis of variation where the plan puts it.
 */
const SKIN = [
  '#f4d9c0', '#e9c19b', '#d9a877', '#c08c5e', '#a06b42', '#7a4b2a',
  '#5a3520', '#f7e2cd',
];

/**
 * What the cloth is, as distinct from what colour it is.
 *
 * Colour alone cannot say "sequins", and a renderer asked to infer sheen from
 * saturation ends up deciding that any loud colour is shiny — which makes a
 * bright red wool jacket glitter and a silver knit jumper look like a mirror.
 * Fabric is a wardrobe decision and it belongs on this side of the line with
 * the rest of them.
 *
 * Declared locally only until the same union lands in `concert/types.ts`; the
 * string values are the ones the rig expects, verbatim, so the import is a
 * one-line swap.
 */
type Fabric =
  | 'wool' | 'sequin' | 'satin' | 'velvet' | 'corduroy'
  | 'denim' | 'leather' | 'knit' | 'nylon';

/**
 * A genre-and-era's clothes.
 *
 * The rule the plan sets is the hard part: recognisable at a glance, and not a
 * costume party. Two devices do most of that work here.
 *
 * **A band dresses alike.** `uniform` is the chance a given player wears the
 * band's jacket and trousers rather than their own. High for a dance band and a
 * swing group, because they genuinely wore matching suits; near zero for
 * ambient, where the absence of a uniform *is* the uniform.
 *
 * **One person is allowed to be loud.** `spotlight` is the chance the lead gets
 * the sequinned jacket. Everybody in sequins is a pantomime; one person in
 * sequins in front of five in cream is a Finnish dance band.
 */
interface Wardrobe {
  jackets: string[];
  shirts: string[];
  trousers: string[];
  /** The one loud colour: a tie, a scarf, a lining, sequins. */
  accents: string[];
  /** Worn by the lead when they get the spotlight jacket. */
  loud: string[];
  hair: string[];
  hairStyles: (readonly [HairStyle, number])[];
  /** Probability each accessory appears, before the era's density scales it. */
  accessories: (readonly [Accessory, number])[];
  /**
   * What the band's clothes are made of, weighted.
   *
   * `sequin` never appears here and that is the point: it is reachable only
   * through `loudFabric`, and only by the one person fronting the number. A
   * band in sequins is a pantomime; one person in sequins in front of five in
   * wool is a Finnish dance band.
   */
  fabrics: (readonly [Fabric, number])[];
  /** What the lead's loud jacket is made of, when they get one. */
  loudFabric: Fabric;
  /** …and how often that loud jacket is actually the sequinned one. */
  sequinChance: number;
  /** Chance trousers match the jacket rather than being drawn separately. */
  matched: number;
  uniform: number;
  spotlight: number;
}

const WARDROBE: Record<string, Wardrobe> = {
  /**
   * 1960s–70s tanssilava. Pale summer suits, an enormous amount of hair, and
   * one person in sequins. The era's own table is full of accordions and
   * tremolo guitar; this is that in cloth.
   */
  'iskelma:tanssilava': {
    jackets: ['#efe6d2', '#bcd0e0', '#cfe0c8', '#d8d2c4', '#e6cfae', '#c8b9d6'],
    shirts: ['#ffffff', '#fdf6e3', '#f6ead6'],
    trousers: ['#2f3345', '#4a4436', '#6a6357'],
    accents: ['#c62828', '#ffb300', '#00897b', '#8e24aa', '#e91e63'],
    loud: ['#c0c0c0', '#d4af37', '#e8a0c0'],
    hair: ['#2b1b12', '#4a2f1b', '#6b4423', '#8d6a3f', '#c9a86a', '#a83e2b', '#d9d4cc'],
    hairStyles: [['beehive', 4], ['bob', 3], ['long', 3], ['slick', 4], ['curls', 3], ['short', 2]],
    accessories: [['tie', 0.7], ['moustache', 0.3], ['earrings', 0.25], ['glasses', 0.15], ['bowtie', 0.12]],
    fabrics: [['wool', 7], ['satin', 2], ['velvet', 1]],
    loudFabric: 'sequin', sequinChance: 0.35,
    matched: 0.7, uniform: 0.75, spotlight: 0.8,
  },
  /**
   * 1980s iskelmäpop. The same pavilion, lit by par cans, and the palette goes
   * saturated: white, electric blue, magenta. Bigger hair than the sixties,
   * which takes some doing.
   */
  'iskelma:eighties': {
    jackets: ['#e8e6e1', '#1f6fb2', '#c2185b', '#00838f', '#f4a3c1', '#3c3f58'],
    shirts: ['#ffffff', '#ffe9f2', '#dff3ff'],
    trousers: ['#1c1c22', '#e8e6e1', '#3c3f58'],
    accents: ['#00e5ff', '#ff2d95', '#ffe000', '#7cff5a'],
    loud: ['#c0c0c0', '#ff2d95', '#ffe000'],
    hair: ['#101010', '#2b1b12', '#6b4423', '#c9a86a', '#e8dcae', '#a83e2b', '#d9d4cc'],
    hairStyles: [['long', 5], ['curls', 5], ['bob', 3], ['slick', 2], ['short', 2], ['beehive', 1]],
    accessories: [['earrings', 0.45], ['sunglasses', 0.3], ['tie', 0.3], ['moustache', 0.2]],
    // The decade of the shiny shirt. Satin overtakes wool, and the jacket is
    // as likely to be leather as to be tailored.
    fabrics: [['satin', 5], ['wool', 3], ['velvet', 2], ['leather', 1]],
    loudFabric: 'sequin', sequinChance: 0.45,
    matched: 0.35, uniform: 0.5, spotlight: 0.85,
  },

  /**
   * 1930s–40s swing. Dark suits and a tie on everybody, hair oiled flat. The
   * most uniform band in the project, because that is what a swing group in a
   * gilt room was — a *section*, dressed as one.
   */
  'jazz:swingera': {
    jackets: ['#20242e', '#2b2b2b', '#3b3226', '#4a4f5c', '#e9e6dd'],
    shirts: ['#ffffff', '#fdf9ee'],
    trousers: ['#20242e', '#2b2b2b', '#3b3226'],
    accents: ['#7b1e2b', '#1b4d3e', '#8a6d3b', '#2f3e7a'],
    loud: ['#e9e6dd', '#8a6d3b'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#cfcac2'],
    hairStyles: [['slick', 6], ['short', 4], ['curls', 1], ['bald', 1]],
    accessories: [['tie', 0.85], ['moustache', 0.25], ['glasses', 0.2], ['bowtie', 0.2], ['porkpie', 0.15]],
    // Wool, and very nearly only wool. That is the genre, in three eras.
    fabrics: [['wool', 9], ['satin', 1]],
    loudFabric: 'satin', sequinChance: 0,
    matched: 0.85, uniform: 0.85, spotlight: 0.3,
  },
  /**
   * 1950s–60s bop. The suits stay dark and the ties get narrow; glasses and a
   * porkpie appear, and so does the first facial hair in the genre. A quintet
   * in a room nobody had redecorated since the war.
   */
  'jazz:bop': {
    jackets: ['#1c1f27', '#262626', '#333a33', '#3a3340', '#454b57'],
    shirts: ['#ffffff', '#f2f2ee', '#d8dbe0'],
    trousers: ['#1c1f27', '#262626', '#2e2e2e'],
    accents: ['#8e2b2b', '#1f5c4a', '#b08a3e', '#2f3e7a', '#5a3d7a'],
    loud: ['#b08a3e', '#d8dbe0'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#cfcac2'],
    hairStyles: [['short', 5], ['slick', 4], ['bald', 2], ['curls', 2]],
    accessories: [['tie', 0.8], ['glasses', 0.35], ['porkpie', 0.3], ['beard', 0.3], ['sunglasses', 0.12]],
    fabrics: [['wool', 9], ['satin', 1]],
    loudFabric: 'wool', sequinChance: 0,
    matched: 0.8, uniform: 0.72, spotlight: 0.25,
  },
  /**
   * 1960s–70s modern. Where the suit comes off: polo necks, earth colours, a
   * flat cap, and the band stops matching. The era's palette is Rhodes and
   * flute rather than trumpet and clarinet, and this is the same loosening.
   */
  'jazz:modern': {
    jackets: ['#2f3a33', '#3a3630', '#232323', '#4a3f52', '#5c4a34'],
    shirts: ['#1c1c1c', '#5c5347', '#7a6f5e', '#c9bfa8'],
    trousers: ['#2b2b2b', '#3c3a33', '#4a4438'],
    accents: ['#c56a2b', '#3f7a6a', '#8a5a9e', '#b8a13c'],
    loud: ['#c56a2b', '#b8a13c'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#8d6a3f', '#cfcac2'],
    hairStyles: [['curls', 4], ['short', 4], ['long', 3], ['bald', 2], ['slick', 1]],
    accessories: [['sunglasses', 0.35], ['beard', 0.35], ['tie', 0.25], ['flatcap', 0.2], ['scarf', 0.15]],
    // The suit comes apart here along with everything else: corduroy, knit and
    // the occasional velvet jacket, and wool stops being the whole answer.
    fabrics: [['wool', 5], ['corduroy', 3], ['knit', 2], ['velvet', 1], ['denim', 1]],
    loudFabric: 'velvet', sequinChance: 0,
    matched: 0.45, uniform: 0.4, spotlight: 0.2,
  },

  /**
   * 1970s–80s tape. Corduroy, knitwear and an anorak, in the colours of a
   * decade that had not invented saturation. Hoods up, nobody matching, and the
   * one place in this project where the *absence* of stage clothes is the
   * costume: these are people who came to operate equipment.
   */
  'ambient:tape': {
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
    loudFabric: 'knit', sequinChance: 0,
    matched: 0.2, uniform: 0.08, spotlight: 0.05,
  },
  /**
   * 1990s sampler. Black and grey cagoules, hoods, headphones. The era whose
   * own effects table filters the drum kit to 1.4 kHz so the beat arrives
   * through a wall; the people should be about as visible as the beat is.
   */
  'ambient:sampler': {
    jackets: ['#1f2124', '#2b2f33', '#3a3f45', '#26302b', '#2e2a33'],
    shirts: ['#3a3f45', '#4a4f55', '#2b2f33'],
    trousers: ['#1a1c1f', '#2b2f33', '#33383d'],
    accents: ['#4a9ec9', '#7a8f3c', '#b0562b'],
    loud: ['#4a9ec9'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#cfcac2'],
    hairStyles: [['hood', 6], ['short', 4], ['long', 2], ['bald', 2]],
    accessories: [['headphones', 0.45], ['glasses', 0.3], ['beard', 0.3], ['scarf', 0.15]],
    fabrics: [['nylon', 6], ['knit', 4], ['denim', 2], ['wool', 1]],
    loudFabric: 'nylon', sequinChance: 0,
    matched: 0.35, uniform: 0.12, spotlight: 0.05,
  },
  /**
   * 2000s hybrid. Greys, knitwear and a scarf — the era where the sources went
   * back to being real strings and real voices, so the people look like players
   * again rather than like operators.
   */
  'ambient:hybrid': {
    jackets: ['#2c2e33', '#3d4046', '#4a4a4a', '#3a4440', '#55545a'],
    shirts: ['#6a6e74', '#8a8d92', '#4a4d52', '#b3b0a8'],
    trousers: ['#232529', '#33363b', '#42454a'],
    accents: ['#8a6b4a', '#4a7a8a', '#7a5a8a'],
    loud: ['#8a6b4a'],
    hair: ['#101010', '#22160f', '#3a2416', '#5c4025', '#8d6a3f', '#cfcac2'],
    hairStyles: [['short', 5], ['hood', 3], ['long', 3], ['bald', 2], ['curls', 2]],
    accessories: [['scarf', 0.35], ['glasses', 0.35], ['beard', 0.3], ['headphones', 0.2]],
    fabrics: [['knit', 5], ['wool', 3], ['nylon', 3], ['denim', 1]],
    loudFabric: 'knit', sequinChance: 0,
    matched: 0.4, uniform: 0.15, spotlight: 0.08,
  },
};

/**
 * A plain concert dress for a genre or era this file has never met.
 *
 * Dull on purpose, for the same reason `venue.ts` keeps a fourth room: an
 * unknown genre should stage badly and obviously, not adequately.
 */
const PLAIN: Wardrobe = {
  jackets: ['#2b2f36', '#3a3f47', '#4a4438'],
  shirts: ['#ffffff', '#f0ece4'],
  trousers: ['#2b2f36', '#33363b'],
  accents: ['#8a3b3b', '#3b5a8a'],
  loud: ['#b08a3e'],
  hair: ['#22160f', '#3a2416', '#5c4025', '#cfcac2'],
  hairStyles: [['short', 5], ['slick', 3], ['long', 2], ['bald', 1]],
  accessories: [['tie', 0.4], ['glasses', 0.2]],
  fabrics: [['wool', 6], ['knit', 2], ['denim', 1]],
  loudFabric: 'satin', sequinChance: 0,
  matched: 0.6, uniform: 0.5, spotlight: 0.3,
};

/**
 * Accessories that cannot be worn together.
 *
 * One hat, one thing on the eyes, one thing round the neck, one arrangement of
 * facial hair. Without this the probabilities compound and a fifth of the band
 * ends up in a porkpie *and* a flat cap *and* a bow tie *and* a scarf, which is
 * the exact costume-party failure the plan warns about.
 */
const EXCLUSIVE: Accessory[][] = [
  ['porkpie', 'flatcap'],
  ['glasses', 'sunglasses'],
  ['tie', 'bowtie', 'scarf'],
  ['beard', 'moustache'],
];

/** Three is a look. Five is a fancy-dress shop. */
const MAX_ACCESSORIES = 3;

/**
 * The era a genre falls back to when it is handed one it does not have.
 *
 * Better than dropping straight to `PLAIN`: an iskelmä band in an unknown era
 * should still be an iskelmä band. The default in each case is the era the
 * genre is most itself in.
 */
const DEFAULT_ERA: Record<string, string> = {
  iskelma: 'tanssilava',
  jazz: 'bop',
  ambient: 'tape',
};

function wardrobeFor(genre: string, era: string): Wardrobe {
  return WARDROBE[`${genre}:${era}`]
    ?? WARDROBE[`${genre}:${DEFAULT_ERA[genre] ?? ''}`]
    ?? PLAIN;
}

/**
 * Dress one player.
 *
 * The stream is keyed on the performer id and the *concert* seed, so the band
 * is the same band from number to number, and adding a player to a later number
 * cannot re-roll the faces of the ones who were already there.
 */
function makeLook(args: {
  id: string;
  seed: string;
  wardrobe: Wardrobe;
  uniform: { jacket: string; trousers: string };
  isLead: boolean;
  /** From `EraProfile.density`. A busier production puts more on people. */
  density: number;
}): Look {
  const { id, seed, wardrobe: w, uniform, isLead, density } = args;
  const rng = new Rng(`${seed}:cast:look:${id}`);

  // Two draws averaged rather than one, so the band clusters around average
  // height instead of spreading evenly between the extremes. A uniform draw
  // reliably produces one 1.60 m player standing next to one 1.92 m player,
  // which reads as a rendering bug.
  const bell = () => (rng.next() + rng.next()) / 2;
  const height = 1.58 + bell() * 0.34;
  const build = 0.12 + bell() * 0.76;

  const wearsUniform = rng.chance(w.uniform);
  let jacket = wearsUniform ? uniform.jacket : rng.pick(w.jackets);
  let trousers = wearsUniform
    ? uniform.trousers
    : (rng.chance(w.matched) ? jacket : rng.pick(w.trousers));
  const shirt = rng.pick(w.shirts);
  let accent = rng.pick(w.accents);
  let fabric = rng.weighted(w.fabrics);

  /**
   * The one person allowed to be loud.
   *
   * Two separate draws, and keeping them separate is the point. The *colour*
   * goes loud often — that is the device that gives a band a front person at a
   * glance. The *sequins* are much rarer, and unreachable for anybody who is
   * not fronting the number, because a whole band in sequins is fancy dress and
   * one person in sequins in front of five in wool is a photograph of a
   * tanssilava.
   */
  if (isLead && rng.chance(w.spotlight)) {
    jacket = rng.pick(w.loud);
    accent = jacket;
    if (rng.chance(0.5)) trousers = jacket;
    if (w.loudFabric !== 'sequin' || rng.chance(w.sequinChance)) fabric = w.loudFabric;
  }

  // `EraProfile.density` is how full the arrangement gets, and a decade that
  // over-arranges its records also over-dresses its bands. The multiplier is
  // small — this nudges an accessory count, it does not decide the look.
  const boost = 0.78 + density * 0.55;
  const wanted: Accessory[] = [];
  for (const [acc, p] of w.accessories) {
    if (rng.chance(Math.min(1, p * boost))) wanted.push(acc);
  }

  const accessories: Accessory[] = [];
  for (const acc of wanted) {
    if (accessories.length >= MAX_ACCESSORIES) break;
    const group = EXCLUSIVE.find((g) => g.includes(acc));
    if (group && accessories.some((a) => group.includes(a))) continue;
    accessories.push(acc);
  }

  const hairStyle = rng.weighted(w.hairStyles);
  // Built as a variable rather than inline so the pending `fabric` field can be
  // emitted before `Look.outfit` in the frozen contract declares it. Remove
  // this note when the type lands.
  const outfit = { jacket, shirt, trousers, accent, fabric };
  return {
    skin: rng.pick(SKIN),
    // A shaved head still has a colour, and a hood has hair under it; the
    // renderer decides whether either is visible.
    hair: rng.pick(w.hair),
    hairStyle,
    height,
    build,
    outfit,
    accessories,
  };
}

// ---------------------------------------------------------------------------
// Casting
// ---------------------------------------------------------------------------

/**
 * Turn the song's tracks into players.
 *
 * Iterated in `LAYER_ORDER` rather than in track order so the roster is stable
 * whatever order the generator happened to push its tracks in — the ids are
 * what choreography, groove and lighting all key on, and they must not depend
 * on an ordering nobody promised.
 *
 * The kit is the one player with no `Track`: percussion lives on `song.drums`,
 * and an empty event list means there is genuinely no drummer. Ambient's
 * `drone` and `choral` styles exclude the kit outright, and a drummer sitting
 * behind a silent kit for four minutes is the most conspicuous thing a stage
 * can contain.
 */
function roster(song: Song, seed: string, wardrobe: Wardrobe, density: number): Slot[] {
  const drafts: { layer: LayerId; archetype: Archetype; instrument: string }[] = [];

  for (const layer of LAYER_ORDER) {
    if (layer === 'drums') {
      if (song.drums.events.length) {
        drafts.push({ layer, archetype: DRUM_ARCHETYPE, instrument: `${song.drums.bank} kit` });
      }
      continue;
    }
    for (const track of song.tracks) {
      if (track.layer !== layer) continue;
      /**
       * The voice is not drawn from the instrument catalogue — it has no GM
       * program that means "a person" — so `archetypeForTrack` would look up a
       * choir patch and stage a keyboard player. `Track.voice` is the field
       * whose presence says this track is sung, and it is what decides.
       *
       * Everything else resolves through the archetype table, which
       * `npm run concert` asserts is total over what the generator emits. The
       * `synth` fallback is therefore unreachable in practice; it is here so an
       * instrument added to the catalogue and forgotten here stages as a
       * keyboard rather than throwing in the middle of a show.
       */
      const archetype = track.voice
        ? VOCAL_ARCHETYPE
        : (archetypeForTrack(track) ?? 'synth');
      drafts.push({ layer, archetype, instrument: track.instrument });
    }
  }

  const uniformRng = new Rng(`${seed}:cast:uniform`);
  const uniform = {
    jacket: uniformRng.pick(wardrobe.jackets),
    trousers: uniformRng.chance(wardrobe.matched)
      ? '' : uniformRng.pick(wardrobe.trousers),
  };
  if (!uniform.trousers) uniform.trousers = uniform.jacket;

  const leadLayer = leadLayerOf(drafts.map((d) => d.layer));
  const used = new Set<string>();
  const slots: Slot[] = [];

  for (const d of drafts) {
    // One track per layer is what the generator emits, so the layer name is a
    // legible and stable id. The suffix is insurance against a future
    // arrangement that doubles a layer, not a case that occurs today.
    let id: string = d.layer;
    for (let n = 2; used.has(id); n++) id = `${d.layer}-${n}`;
    used.add(id);

    const spec = specFor(d.archetype);
    const look = makeLook({
      id, seed, wardrobe, uniform, density,
      isLead: d.layer === leadLayer,
    });
    slots.push({
      id,
      layer: d.layer,
      archetype: d.archetype,
      instrument: d.instrument,
      spec,
      role: ROLE_OF[d.layer],
      look,
      x: 0,
      z: 0,
      r: spec.footprint,
      anchor: 1,
      facing: 0,
      posture: spec.posture,
      riser: 0,
      locked: false,
      head: headAbove(spec.posture, look.height),
      box: { x0: 0, x1: 0, z0: 0, z1: 0 },
      avoidFrontCentre: false,
    });
  }
  return slots;
}

/**
 * Who fronts the number.
 *
 * The singer if the number is sung, and otherwise whoever has the tune. Falling
 * through to the comp and then the bass matters more than it looks: an ambient
 * piece that is all pad and bass still has a *most foreground* player, and the
 * camera and the bill both want to know who it is.
 */
function leadLayerOf(layers: LayerId[]): LayerId | undefined {
  const order: LayerId[] = ['vocal', 'melody', 'counter', 'comp', 'brass', 'bass', 'pad', 'drums'];
  return order.find((l) => layers.includes(l));
}

// ---------------------------------------------------------------------------
// Staging — a band
// ---------------------------------------------------------------------------

/**
 * Put a rhythm section and a front line on a stage.
 *
 * The picture this builds, before the solver touches it:
 *
 * ```
 *   upstage      pad ---- KIT(riser) ---- bass
 *                comp                          (overflow horns)
 *   downstage        counter -- LEAD -- melody
 *   ---------------------------- audience ----------------------------
 * ```
 *
 * Every one of those placements is a reason rather than a taste. The kit is
 * centre-back because it is the loudest thing and the only one that cannot be
 * moved once the show starts. The bass is beside the kit because a bass player
 * plays with the drummer and needs to see the hi-hat. The comp goes out to one
 * side at mid depth because a chord instrument is wide, is played sideways, and
 * is the one player the audience does not need to see the face of. And the tune
 * is downstage because that is what downstage is for.
 */
function stageBand(slots: Slot[], venue: Venue, seed: string): void {
  const rng = new Rng(`${seed}:cast:stage`);
  const W = venue.width;
  const D = venue.depth;
  const xLimit = Math.min(W / 2 - MARGIN_SIDE, W * OPENING);
  /** The front line lives inside the tighter limit, and is held there. */
  const xFront = Math.min(xLimit, W * FRONT_OPENING);
  const zUp = -D / 2 + MARGIN_UP + 0.35;
  const zDown = D / 2 - MARGIN_DOWN;
  const zMid = zUp + (zDown - zUp) * 0.45;

  /**
   * Which side of the kit the bass takes.
   *
   * A real answer would be "the drummer's right", and a real answer is not
   * available: it depends on the kit model's handedness, which lives on the far
   * side of the licence line. Drawing it from the seed at least means the same
   * concert always looks the same, and that two consecutive numbers are not
   * mirror images of each other for no reason.
   */
  const side = rng.chance(0.5) ? 1 : -1;

  const kit = slots.find((s) => s.role === 'kit');
  const kitR = kit?.r ?? 0;

  /**
   * Where the riser is, in this venue's coordinates.
   *
   * Derived from the back edge of the boards rather than from `zUp`, because
   * that is how the stage builder derives it too — the two have to agree to the
   * centimetre or the kit does not sit on the platform.
   */
  const riserZ = -D / 2 + RISER_FROM_BACK;

  for (const s of slots) {
    switch (s.role) {
      case 'kit':
        s.x = 0;
        // Slightly upstage of the riser's centre: a kit is played from its
        // downstage edge, and the drummer is the thing being placed.
        s.z = clamp(zUp, riserZ - RISER_HALF_DEPTH + 0.4, riserZ + RISER_HALF_DEPTH - 0.4);
        s.riser = RISER_HEIGHT;
        s.anchor = 6;
        /**
         * Pinned to the platform, and `locked` so the solver's relaxation
         * cannot widen its way off it. A drummer half on a riser is worse than
         * a drummer standing in somebody's way.
         */
        s.box = {
          x0: -RISER_HALF_WIDTH + 0.4, x1: RISER_HALF_WIDTH - 0.4,
          z0: riserZ - RISER_HALF_DEPTH + 0.4, z1: riserZ + RISER_HALF_DEPTH - 0.4,
        };
        s.locked = true;
        break;
      case 'bass':
        s.x = side * (kitR + s.r + 0.25);
        s.z = zUp + 0.5;
        s.anchor = 2.2;
        s.box = { x0: side > 0 ? 0.4 : -xLimit, x1: side > 0 ? xLimit : -0.4, z0: zUp - 0.1, z1: zMid };
        break;
      case 'pad':
        // Pads sustain and nobody watches them play; they belong at the back,
        // flanking the kit on the side the bass did not take.
        s.x = -side * (kitR + s.r + 0.35);
        s.z = zUp + 0.2;
        s.anchor = 1.6;
        s.box = { x0: -side > 0 ? 0.4 : -xLimit, x1: -side > 0 ? xLimit : -0.4, z0: zUp - 0.1, z1: zMid };
        break;
      case 'comp':
        s.x = -side * Math.max(1.6, xLimit - s.r - 0.1);
        s.z = zMid;
        s.anchor = 2.6;
        s.box = { x0: -xLimit, x1: xLimit, z0: zUp + 0.4, z1: zMid + 0.6 };
        break;
      case 'front':
        s.anchor = 1;
        // The tighter limit goes in the *box*, not only into the initial
        // layout: the separator is perfectly capable of shoving a horn out
        // past a limit that was only ever applied once, and did.
        s.box = { x0: -xFront, x1: xFront, z0: zMid + 0.25, z1: zDown };
        break;
    }
  }

  layoutFrontLine(slots, { xLimit: xFront, zMid, zDown, side });

  // Everyone faces the audience, give or take. The exceptions are the players
  // whose instrument is played sideways — a pianist sits along the keyboard,
  // not behind it — and the small deterministic jitter on everybody else,
  // which costs two lines and is the difference between a band and a row of
  // fence posts.
  for (const s of slots) {
    const jitter = new Rng(`${seed}:cast:facing:${s.id}`).float(-0.07, 0.07);
    const turn = sidewaysTurn(s.archetype);
    s.facing = jitter + (turn ? -Math.sign(s.x || 1) * turn : 0);
  }
}

/**
 * How far this instrument turns its player away from the audience.
 *
 * A grand piano is the extreme case: the keyboard runs across the body, so a
 * pianist facing the audience is a pianist who cannot reach the keys. Turning
 * them toward centre stage is both correct and useful — it points them at the
 * band, which is where a comping player is looking anyway.
 */
function sidewaysTurn(archetype: Archetype): number {
  switch (archetype) {
    /**
     * Near profile, and it has to be.
     *
     * The keyboard sits between the pianist and the body of the instrument, so
     * a piano square-on to the house shows the audience a large closed lid with
     * the keys and the hands hidden behind it — which is the one thing a
     * pianist is worth watching for. Turned to roughly eighty degrees the
     * audience looks *along* the keyboard and sees the player in three-quarter
     * profile, which is how a grand is set on a real stage and for the same
     * reason.
     */
    case 'grand-piano': return 1.4;
    case 'organ': case 'electric-piano': case 'synth': return 0.45;
    case 'mallets': case 'harp': return 0.3;
    case 'upright-bass': return 0.2;
    default: return 0;
  }
}

/**
 * Lay the front line out, and decide who stands in the middle of it.
 *
 * The rule from the plan (§5) is the interesting part: when the number is sung
 * there is a singer at a microphone front and centre, **and the lead instrument
 * moves back a step**. Not sideways — back. Two people abreast at the front of
 * a stage both look like the lead; one of them half a metre upstage of the
 * other does not, and it costs nothing.
 *
 * Horns end up in a line without being asked to, because the ordering puts
 * brass last and the tune first, so a sax on the tune and a trumpet on the
 * brass layer are adjacent by construction.
 */
function layoutFrontLine(
  slots: Slot[],
  geom: { xLimit: number; zMid: number; zDown: number; side: number },
): void {
  const front = slots.filter((s) => s.role === 'front')
    .sort((a, b) => PROMINENCE[a.layer] - PROMINENCE[b.layer]);
  if (!front.length) return;

  /**
   * Who takes the middle, which is not always who has the tune.
   *
   * A grand piano and a harp are furniture: they are floor-standing, they are
   * played sideways, and putting one dead centre downstage walls the band off
   * from the audience. So a bulky instrument yields the middle to the next
   * player along and takes an outer slot, even when it is the one carrying the
   * melody. `leadPerformerId` still names the pianist — they *are* the lead —
   * and the follow spot will find them where they are.
   */
  const centre = front.find((s) => !BULKY.includes(s.archetype)) ?? front[0]!;
  const sung = centre.layer === 'vocal';
  // The centre of the line, at the very front. Everyone else steps back when
  // there is a singer to step back from.
  const anchorZ = geom.zDown;
  const restZ = sung ? geom.zDown - 0.7 : geom.zDown;

  // Slot offsets 0, +1, -1, +2, -2 … so the player taking the middle gets it
  // and the rest alternate outward, in order of prominence.
  const byPlacement = [centre, ...front.filter((s) => s !== centre)];
  const ordered = byPlacement
    .map((s, i) => ({ s, slot: i === 0 ? 0 : (i % 2 === 1 ? Math.ceil(i / 2) : -i / 2) }))
    .sort((a, b) => a.slot - b.slot);

  // Widest gap that fits. A front line squeezed to nothing is worse than one
  // that spills a horn into the mid row, so try roomy first and give up in
  // steps.
  for (const gap of [0.5, 0.3, 0.15]) {
    let width = 0;
    for (let i = 0; i < ordered.length; i++) {
      width += ordered[i]!.s.r * 2;
      if (i) width += gap;
    }
    if (width > geom.xLimit * 2 && ordered.length > 2) continue;

    let cursor = -width / 2;
    const xs: number[] = [];
    for (let i = 0; i < ordered.length; i++) {
      const s = ordered[i]!.s;
      cursor += s.r;
      xs.push(cursor);
      cursor += s.r + gap;
    }
    // Re-centre so the anchor — the singer, or whoever has the tune — is at
    // x = 0 rather than the *line* being centred. The middle of the stage
    // belongs to a person, not to an average.
    /**
     * Where the middle of the line actually is.
     *
     * Normally x = 0: the centre of the stage belongs to a person rather than
     * to the average of several. The exception is a front line with nothing but
     * furniture in it — a number whose only front-line player is the pianist —
     * where centring would park a grand piano across the middle of the stage
     * and wall the band off. That one slides to the side the comp did not take.
     */
    const centreX = BULKY.includes(centre.archetype) ? geom.side * 1.6 : 0;
    /**
     * A grand piano does not stand on the front edge.
     *
     * Downstage-centre is for whoever the audience came to look at, and an
     * instrument two and a half metres long placed there fills a third of every
     * wide shot and most of a close one. Real bands put the piano back and to
     * the side; so does this.
     */
    const bulkySetBack = BULKY.includes(centre.archetype) ? 0.9 : 0;
    const anchorIndex = ordered.findIndex((o) => o.s === centre);
    const shift = (anchorIndex >= 0 ? xs[anchorIndex]! : 0) - centreX;
    for (let i = 0; i < ordered.length; i++) {
      const s = ordered[i]!.s;
      s.x = clamp(xs[i]! - shift, -geom.xLimit, geom.xLimit);
      s.z = (s === centre ? anchorZ : restZ)
        - (BULKY.includes(s.archetype) ? bulkySetBack : 0);
    }
    // Whoever has the middle keeps it when the solver starts shoving.
    centre.anchor = 1.8;
    return;
  }

  // Too many horns for one line. Push the least prominent upstage to the mid
  // row, on the side the comp did not take, and lay out what is left.
  const overflow = ordered.splice(-1, 1)[0];
  if (overflow) {
    overflow.s.z = geom.zMid + 0.3;
    overflow.s.x = geom.side * Math.max(1.4, geom.xLimit - overflow.s.r - 0.3);
    overflow.s.box.z0 = geom.zMid;
  }
  layoutFrontLine(
    slots.filter((s) => s !== overflow?.s),
    geom,
  );
}

// ---------------------------------------------------------------------------
// Staging — ambient
// ---------------------------------------------------------------------------

/** Archetypes that stand behind a trestle table rather than holding anything. */
const GEAR: Archetype[] = ['synth', 'electric-piano'];

/**
 * Instruments too big to stand in the middle of a front line.
 *
 * Not a size threshold on `footprint`, because footprint does not distinguish a
 * drum kit from a trombonist's slide: the question is whether the thing sits on
 * the floor and cannot be turned to face the audience. A vibraphone is
 * deliberately absent — a vibes player at the front of a jazz stage is a
 * photograph, not a problem.
 */
const BULKY: Archetype[] = ['grand-piano', 'harp'];

/**
 * Stage an ambient set, which is not a band on a stage.
 *
 * Everything the band layout is built on is wrong here. There is no front line
 * because there is no foreground — the genre's own rules say so, and the
 * lighting honours it by having no follow spot at all. There is frequently no
 * kit. The pad is the piece, so the player furthest from the audience is
 * playing the most important part. And nobody is performing *at* anybody: half
 * the band is behind a table looking down at it.
 *
 * So this routine builds a different picture on purpose:
 *
 *  - **A table.** Whoever is on a keyboard or a synth is on `perch` posture in
 *    one line, off to one side and upstage. Clustering them is what makes it
 *    read as *a table* rather than as three people who happen to be standing in
 *    a row, and it gives the stage builder a coherent region without this file
 *    having to emit a prop for furniture it cannot position (see `venue.ts`).
 *  - **A scatter.** Everyone else is placed by best-candidate sampling, biased
 *    upstage, which produces an irregular arrangement that still keeps its
 *    distance. A grid would read as a band that had been told where to stand.
 *  - **An empty spot.** Downstage centre is excluded. It is the one position on
 *    a stage that means "look at me", and this music does not have one.
 *  - **No eye contact.** Facings are splayed outward and then checked pairwise:
 *    if two players end up looking at each other, one of them turns away.
 */
function stageAmbient(slots: Slot[], venue: Venue, seed: string): void {
  const rng = new Rng(`${seed}:cast:ambient`);
  const W = venue.width;
  const D = venue.depth;
  const x0 = -W / 2 + MARGIN_SIDE;
  const x1 = W / 2 - MARGIN_SIDE;
  const z0 = -D / 2 + MARGIN_UP;
  const z1 = D / 2 - MARGIN_DOWN;
  const side = rng.chance(0.5) ? 1 : -1;

  for (const s of slots) {
    s.anchor = s.role === 'kit' ? 3 : 1;
    /**
     * No riser anywhere in ambient, including under a kit that happens to
     * exist. A drum riser is a piece of rock-show staging and this room's whole
     * argument is that nothing is elevated and nothing is foregrounded — and
     * the stage builder only places one riser, at the back of a band stage,
     * which is not where this kit is going to be.
     */
    s.riser = 0;
    s.box = { x0, x1, z0, z1 };
    s.avoidFrontCentre = true;
    if (GEAR.includes(s.archetype)) s.posture = 'perch';
    s.head = headAbove(s.posture, s.look.height);
  }

  const gear = slots.filter((s) => s.posture === 'perch');
  const loose = slots.filter((s) => s.posture !== 'perch');

  // The table: a line, upstage, offset to one side, and very slightly askew.
  // Square-on furniture reads as a diagram; two degrees off reads as furniture.
  if (gear.length) {
    const angle = rng.float(-0.2, 0.2);
    const tableZ = z0 + rng.float(0.3, 1.1);
    const centre = side * rng.float(0.5, 1.8);
    let span = 0;
    for (let i = 0; i < gear.length; i++) span += gear[i]!.r * 2 + (i ? 0.35 : 0);
    let t = -span / 2;
    for (const s of gear) {
      t += s.r;
      s.x = clamp(centre + t * Math.cos(angle), x0, x1);
      s.z = clamp(tableZ + t * Math.sin(angle), z0, z1);
      t += s.r + 0.35;
    }
  }

  // Everyone else, by best-candidate sampling: draw a handful of positions and
  // keep the one furthest from everybody already placed. Cheap, deterministic,
  // and it produces the irregular spacing a scatter needs — uniform random
  // alone clumps, and a grid does not clump at all, which is worse.
  const placed = gear.slice();
  /**
   * How far downstage counts as "at the front", and how many may be there.
   *
   * A hard cap rather than a preference, because the preference kept losing.
   * Two players out at the front of a black box is a couple of figures in the
   * fog; three is a line, and a line facing an audience is the one thing this
   * genre's staging exists to not be. Capping at two rather than at one leaves
   * the scatter somewhere to breathe — squeezing everybody upstage would
   * produce a row along the back wall instead, which is the same failure
   * reflected.
   */
  const zFrontLimit = z0 + (z1 - z0) * 0.62;
  let downstage = 0;

  for (const s of [...loose].sort((a, b) => b.r - a.r)) {
    const zHigh = downstage >= 2 ? zFrontLimit : z1;
    let best: { x: number; z: number; score: number } | undefined;
    for (let k = 0; k < 28; k++) {
      const cx = rng.float(x0, x1);
      const cz = z0 + (zHigh - z0) * Math.pow(rng.next(), 1.7);
      if (inFrontCentre(cx, cz, z1)) continue;
      let room = 6;
      for (const p of placed) {
        room = Math.min(room, Math.hypot(cx - p.x, cz - p.z) - p.r - s.r);
      }
      /**
       * Elbow room, minus a penalty for being downstage.
       *
       * Sampling `z` with an upstage bias is not enough on its own, and the
       * reason is worth recording: best-candidate sampling picks whichever
       * draw is *furthest from everybody else*, and once the gear table is
       * upstage the emptiest part of the room is the front. The bias gets
       * silently inverted and the scatter grows a front line — which is the
       * one thing this staging is not allowed to have. The penalty is what
       * makes the preference survive the selection.
       */
      const score = room - 1.2 * ((cz - z0) / Math.max(0.001, z1 - z0));
      if (!best || score > best.score) best = { x: cx, z: cz, score };
    }
    s.x = best?.x ?? 0;
    s.z = best?.z ?? z0;
    if (s.z > zFrontLimit) downstage++;
    placed.push(s);
  }

  // Facings: away from the centre line, and never at each other.
  for (const s of slots) {
    const own = new Rng(`${seed}:cast:facing:${s.id}`);
    const away = s.x >= 0 ? 1 : -1;
    s.facing = away * own.float(0.25, 0.95) - (sidewaysTurn(s.archetype) * away * 0.4);
  }
  avertGazes(slots);
}

function inFrontCentre(x: number, z: number, z1: number): boolean {
  return Math.abs(x) < 1.3 && z > z1 - 1.0;
}

/**
 * Make sure no two players are looking at each other.
 *
 * "Nobody makes eye contact" is one line in the plan and it is the whole
 * character of the genre's staging, so it gets enforced rather than hoped for.
 * A pair counts as looking at each other when both forward vectors point within
 * a narrow cone of the other player and they are close enough for it to read;
 * the later of the two turns further away until they do not.
 */
function avertGazes(slots: Slot[]): void {
  const CONE = 0.4;
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i]!;
      const b = slots[j]!;
      for (let tries = 0; tries < 8; tries++) {
        const d = Math.hypot(b.x - a.x, b.z - a.z);
        if (d > 4.5) break;
        if (!looksAt(a, b, CONE) || !looksAt(b, a, CONE)) break;
        b.facing += 0.45;
      }
    }
  }
}

function looksAt(from: Slot, to: Slot, cone: number): boolean {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const d = Math.hypot(dx, dz);
  if (d < 1e-6) return true;
  const dot = (Math.sin(from.facing) * dx + Math.cos(from.facing) * dz) / d;
  return dot > Math.cos(cone);
}

// ---------------------------------------------------------------------------
// The solver
// ---------------------------------------------------------------------------

/**
 * Push everybody apart until the constraints hold.
 *
 * Relaxation rather than a packing algorithm, for a reason worth stating: the
 * anchors are already nearly right, and a packer would throw them away. What is
 * wanted is the *nearest* arrangement to the one a bandleader chose that is
 * also physically possible, which is exactly what iterated pairwise separation
 * converges to.
 *
 * Three things keep it from wandering:
 *
 *  - **Weights.** Every push is split between the pair in inverse proportion to
 *    how anchored they are, so a trumpet moves around the kit rather than the
 *    kit moving around the trumpet.
 *  - **Boxes.** Each player is clamped to their role's depth band, so the front
 *    line stays downstage no matter how hard it is shoved.
 *  - **A sideways bias.** The `z` component of every push is scaled down, so a
 *    crowded band widens instead of deepening.
 *
 * If it stalls — which means the boxes are over-constrained rather than the
 * stage being too small — the bands widen in steps and it tries again. The last
 * attempt runs against the bare stage, so separation is guaranteed as long as
 * the players physically fit.
 */
function solve(slots: Slot[], venue: Venue): void {
  const half = Math.min(venue.width / 2 - MARGIN_SIDE, venue.width * OPENING);
  const stage: Box = {
    x0: -half,
    x1: half,
    z0: -venue.depth / 2 + MARGIN_UP,
    z1: venue.depth / 2 - MARGIN_DOWN,
  };
  for (const s of slots) s.box = intersect(s.box, stage);

  for (let relax = 0; relax <= 3; relax++) {
    for (let pass = 0; pass < 6; pass++) {
      separate(slots, 140);
      if (!fixSightlines(slots)) break;
    }
    if (!overlapping(slots)) break;
    // Widen sideways first: spreading across the stage is what a band does
    // when it is crowded. Only the last attempt gives up the depth bands, and
    // only because a guaranteed-separated stage picture beats a tidy one with
    // two players standing in the same place.
    for (const s of slots) {
      if (s.locked) continue;
      s.box = relax < 2
        ? intersect({ x0: stage.x0, x1: stage.x1, z0: s.box.z0 - 0.35, z1: s.box.z1 + 0.35 }, stage)
        : { ...stage };
    }
  }
  separate(slots, 240);
}

function separate(slots: Slot[], iterations: number): void {
  for (let iter = 0; iter < iterations; iter++) {
    let moved = false;
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const a = slots[i]!;
        const b = slots[j]!;
        const need = a.r + b.r + CLEARANCE_PAD;
        let dx = b.x - a.x;
        let dz = b.z - a.z;
        let d = Math.hypot(dx, dz);
        if (d >= need - EPS) continue;
        if (d < 1e-6) {
          // Exactly coincident. Any direction will do; it only has to be the
          // same direction every run.
          dx = (i + j) % 2 === 0 ? 1 : -1;
          dz = 0;
          d = 1;
        }
        // Flatten the push toward the horizontal, then renormalise.
        let ux = dx / d;
        let uz = (dz / d) * Z_BIAS;
        const un = Math.hypot(ux, uz) || 1;
        ux /= un;
        uz /= un;

        const push = (need - d) * 0.55;
        const wa = 1 / a.anchor;
        const wb = 1 / b.anchor;
        const total = wa + wb;
        a.x -= ux * push * (wa / total);
        a.z -= uz * push * (wa / total);
        b.x += ux * push * (wb / total);
        b.z += uz * push * (wb / total);
        clampInto(a);
        clampInto(b);
        moved = true;
      }
    }
    if (!moved) return;
  }
}

function overlapping(slots: Slot[]): boolean {
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i]!;
      const b = slots[j]!;
      if (Math.hypot(b.x - a.x, b.z - a.z) < a.r + b.r + CLEARANCE_PAD - 1e-3) return true;
    }
  }
  return false;
}

function clampInto(s: Slot): void {
  s.x = clamp(s.x, s.box.x0, s.box.x1);
  s.z = clamp(s.z, s.box.z0, s.box.z1);
  // The one non-rectangular constraint in the file, and it is worth the special
  // case: ambient's empty downstage-centre spot is the whole statement its
  // staging makes, and a solver that quietly filled it would erase it.
  if (s.avoidFrontCentre && inFrontCentre(s.x, s.z, s.box.z1)) {
    const push = s.x >= 0 ? 1.3 : -1.3;
    s.x = clamp(push, s.box.x0, s.box.x1);
  }
}

// ---------------------------------------------------------------------------
// Sightlines
// ---------------------------------------------------------------------------

interface View {
  dist: number;
  /** Horizontal angle from the camera's axis. */
  theta: number;
  /** Half the angular width of the player's silhouette. */
  half: number;
  /** Angle to the top of the head. */
  top: number;
}

function viewOf(s: Slot): View {
  const dx = s.x - DEFAULT_CAMERA[0];
  const dz = s.z - DEFAULT_CAMERA[2];
  const dist = Math.max(0.5, Math.hypot(dx, dz));
  return {
    dist,
    theta: Math.atan2(dx, -dz),
    half: Math.atan2(SILHOUETTE_R, dist),
    top: Math.atan2(s.riser + s.head - DEFAULT_CAMERA[1], dist),
  };
}

/**
 * Move anybody who has disappeared behind somebody else.
 *
 * The camera sits above head height, so a player further from it always has
 * their head *higher* on screen than one in front — which means literal total
 * occlusion is close to impossible and asserting only that would be asserting
 * nothing. What actually goes wrong is subtler and very visible: two players on
 * nearly the same bearing, at nearly the same height, with a metre between
 * them. The one behind is not gone, but they are a hat.
 *
 * So the test is "covered *and* not clearing the head in front", and the fix is
 * ordered the way a stage manager would order it:
 *
 *  1. **Raise the riser**, if the hidden player is the drummer. That is what a
 *     riser is for, and it is the only fix that does not disturb anybody else.
 *  2. **Slide sideways**, the hidden player away from the one in front, and the
 *     one in front a little the other way — because moving only the back player
 *     tends to walk them into the wings over successive passes.
 *
 * Returns whether anything moved, so the caller knows to re-run separation:
 * a sightline fix can easily create an overlap, and the two have to be settled
 * against each other rather than in sequence.
 */
function fixSightlines(slots: Slot[]): boolean {
  let moved = false;
  for (let i = 0; i < slots.length; i++) {
    for (let j = 0; j < slots.length; j++) {
      if (i === j) continue;
      const near = slots[i]!;
      const far = slots[j]!;
      const vn = viewOf(near);
      const vf = viewOf(far);
      if (vn.dist >= vf.dist - 0.05) continue;

      const lo = Math.max(vf.theta - vf.half, vn.theta - vn.half);
      const hi = Math.min(vf.theta + vf.half, vn.theta + vn.half);
      const cover = Math.max(0, hi - lo) / (2 * vf.half);
      if (cover < COVER_LIMIT) continue;

      const wanted = far.role === 'kit' ? DRUMMER_CLEARANCE : HEAD_CLEARANCE;
      if (vf.top - vn.top >= wanted) continue;

      /**
       * Slide sideways — and which of the two moves depends on who is stuck.
       *
       * Normally the hidden player steps out from behind the one in front, with
       * a smaller counter-shift on the near player so that repeated passes do
       * not walk the back row into the wings. A drummer cannot do that: they
       * are pinned to a 2.8 m platform whose position is not ours. So when the
       * kit is the one being hidden, the player in front is the one who gives
       * way — which is also the honest answer, since a singer 40 cm off centre
       * still reads as front and centre and a drummer behind a singer does not
       * read at all.
       */
      const dir = far.x >= near.x ? 1 : -1;
      const kitPinned = far.role === 'kit';
      far.x += dir * (kitPinned ? 0.12 : 0.3);
      near.x -= dir * (kitPinned ? 0.34 : 0.12);
      clampInto(far);
      clampInto(near);
      moved = true;
    }
  }
  return moved;
}

// ---------------------------------------------------------------------------

/**
 * Cast, dress and stage one number.
 *
 * `venue` rather than a genre string, because staging is a fact about the room:
 * the same quintet stands differently on a ten-metre pavilion and in a cellar,
 * and the room is the only thing that knows which.
 */
export function castSong(song: Song, venue: Venue, seed: string): Cast {
  const genre = song.meta.genre;
  const era: EraProfile | undefined = GENRES[genre]?.eras[song.meta.era];
  const wardrobe = wardrobeFor(genre, song.meta.era);
  const slots = roster(song, seed, wardrobe, era?.density ?? 0.6);

  if (genre === 'ambient') stageAmbient(slots, venue, seed);
  else stageBand(slots, venue, seed);
  solve(slots, venue);

  const leadLayer = leadLayerOf(slots.map((s) => s.layer));
  const lead = slots.find((s) => s.layer === leadLayer);

  const performers: Performer[] = slots.map((s) => {
    const station: Station = {
      /**
       * The feet, in world metres — so `y` is the riser height rather than
       * zero. `riser` is kept alongside it so the stage builder knows *why*
       * the player is off the boards and can put a box under them; a renderer
       * that adds the two together would stand the drummer in mid-air.
       */
      position: [round(s.x), round(s.riser), round(s.z)],
      facing: round(s.facing),
      posture: s.posture,
      riser: round(s.riser),
    };
    return {
      id: s.id,
      layer: s.layer,
      archetype: s.archetype,
      instrument: s.instrument,
      look: s.look,
      station,
    };
  });

  return lead
    ? { performers, leadPerformerId: lead.id }
    : { performers };
}

// ---------------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function intersect(a: Box, b: Box): Box {
  const box = {
    x0: Math.max(a.x0, b.x0),
    x1: Math.min(a.x1, b.x1),
    z0: Math.max(a.z0, b.z0),
    z1: Math.min(a.z1, b.z1),
  };
  // An empty band means the role's preference and the stage disagree — a front
  // line on a stage two metres deep. The stage wins; it is the one that is
  // real.
  if (box.x1 < box.x0) box.x0 = box.x1 = (box.x0 + box.x1) / 2;
  if (box.z1 < box.z0) box.z0 = box.z1 = (box.z0 + box.z1) / 2;
  return box;
}

/**
 * Three decimals — a millimetre.
 *
 * Not cosmetic. The determinism check compares serialised casts, and a value
 * that arrives through a different order of floating-point additions can differ
 * in the last bit while describing the same position. Rounding to a millimetre
 * is far below anything anyone can see and puts the comparison on solid ground.
 */
function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}
