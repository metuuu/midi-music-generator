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
import { LAYER_ORDER, isPlayedByHand } from '../core/types.js';
import { GENRES } from '../genre/index.js';
import type { EraProfile } from '../style/types.js';
import {
  DRUM_ARCHETYPE, SYNTH_RIGS, VOCAL_ARCHETYPE, archetypeForTrack, rigPoolFor,
  specFor,
} from './instruments.js';
import type {
  Accessory, Archetype, ArchetypeSpec, Cast, HairStyle, Look, Performer,
  Posture, StageMachine, Station, SynthRigId, Venue,
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
 * How far upstage of the lip the front of the stage is already occupied.
 *
 * `MARGIN_DOWN` keeps a *body* off the lip and nothing more, and the front edge
 * is not empty: `web/concert/stage-props.ts` stands a railing 0.12 m inboard of
 * it on every open-air stage, `lights.ts` sets a footlight trough into the deck
 * to 0.29 m, and the house tabs hang at 0.45 m. A singer at 0.7 m clears all
 * three; the horn in their hands does not, and a trombone in seventh position
 * is playing through the rail from a metre away.
 *
 * So the front line is held off the lip by this *plus the player's own
 * footprint*, which is the number the instrument models were sized to fit
 * inside — see the trombone, whose 0.9 m was chosen to contain a slide at full
 * stretch. The extra 0.35 m is the rail's upstage face and the hand's breadth
 * of air that keeps a bell out of it. Small instruments are unaffected, because
 * `MARGIN_DOWN` is still the floor; it is the wide ones that step back, which
 * is what a player holding something long does anyway.
 */
const LIP_FURNITURE = 0.35;

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
 * And what the lens holds, either side of centre, as a fraction of the width.
 *
 * A third line inside the other two, and the only one that decides whether a
 * player is *in the show* rather than merely on the stage. `web/concert/
 * camera.ts` frames its wide shot on 0.72 of the width at the plane the nearest
 * players stand on, so 0.36 either side of centre is the edge of frame.
 *
 * The band layouts never needed the number because they are built outward from
 * centre and land inside it by construction. Ambient's scatter is built the
 * other way round — it looks for empty ground, and the emptiest ground on any
 * stage is out at the sides — so it is the one routine that has to be told
 * where the picture ends.
 */
const IN_FRAME = 0.36;

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
  /** Which synthesiser, where this is one. See `assignRigs`. */
  rig?: SynthRigId;
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
    case 'sit': case 'straddle': return height * 0.76;
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
function roster(
  song: Song, seed: string, wardrobe: Wardrobe, density: number, year: number,
  genre: string,
): Slot[] {
  const drafts: { layer: LayerId; archetype: Archetype; instrument: string }[] = [];

  for (const layer of LAYER_ORDER) {
    if (layer === 'drums') {
      /**
       * …and only when a person is playing them.
       *
       * `DrumTrack.source` is the generator's statement about what is making
       * this sound, and half its values are machines. A box was already being
       * staged as a drummer before the field existed — the synth `modular` era
       * has described itself as "a preset rhythm box for a drummer" all along,
       * and got a man on a riser miming one. The machine is staged by
       * `placeMachine` instead, which is not a casting decision because a
       * machine has no face, no clothes and no limbs to choreograph.
       */
      if (song.drums.events.length && isPlayedByHand(song.drums.source ?? 'kit')) {
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
  assignRigs(slots, year, genre, seed);
  return slots;
}

/**
 * Hand each keyboard player a synthesiser, and make sure the band owns a
 * plausible collection of them.
 *
 * The decision this file exists to be able to make. Drawn per performer from
 * the year — which is what the renderer did — a 1974 concert stages a Moog
 * System 55 behind every keyboard on the boards, because the year says modular
 * and nothing counts. Here the whole band is in one array, so the cap can
 * actually be applied.
 *
 * Three rules, in the order they matter.
 *
 * **The cap is real.** `SynthRigSpec.max` is the number of these one band may
 * own; a modular is 2, everything else is effectively unlimited. Once it is
 * spent that rig leaves the pool for the rest of the band.
 *
 * **Nobody stands behind the same thing as their neighbour if they do not have
 * to.** Draw is without replacement while the pool lasts and with replacement
 * afterwards, which is the same concession `layoutFrontLine` and `layoutGearArc`
 * both make about spacing — keep the variety if it fits, and give it up rather
 * than fail. This is the measured complaint from `synth-rig.ts` restated: five
 * identical people behind five identical tables was never one bad model, it was
 * one model chosen five times.
 *
 * **The wall goes to the back of the queue.** A modular is furniture 1.7 m tall
 * and belongs upstage, so it goes to the *least* prominent keyboard players and
 * never to whoever is fronting the number — which is both the staging answer and
 * the historical one, since the person behind the wall of cabinets was the one
 * making textures rather than the one playing the tune.
 */
function assignRigs(slots: Slot[], year: number, genre: string, seed: string): void {
  const keys = slots.filter((s) => s.archetype === 'synth');
  if (!keys.length) return;

  const rng = new Rng(`${seed}:cast:rigs`);
  const pool = rigPoolFor(year, genre);
  /** Least prominent first, so the furniture is handed out from the back. */
  const queue = [...keys].sort((a, b) => PROMINENCE[b.layer] - PROMINENCE[a.layer]);

  const spent: Partial<Record<SynthRigId, number>> = {};
  const drawn = new Set<SynthRigId>();

  for (const s of queue) {
    /**
     * What is still available: inside its cap, and — while anything is left —
     * not already on this stage.
     */
    const uncapped = pool.filter(([id]) => (spent[id] ?? 0) < SYNTH_RIGS[id].max);
    const fresh = uncapped.filter(([id]) => !drawn.has(id));
    const choices = fresh.length ? fresh : uncapped;
    if (!choices.length) continue;

    const rig = rng.weighted(choices);
    spent[rig] = (spent[rig] ?? 0) + 1;
    drawn.add(rig);
    s.rig = rig;
    /**
     * The rig's own size, replacing the archetype's one-size-fits-all figure.
     *
     * `ARCHETYPES.synth.footprint` is 1.0 for everything from a wall of
     * cabinets to a slab on an X-stand, which is why the separator and the
     * sightline pass could not be trusted anywhere near a modular. `head` is
     * the taller of the player and the gear for the same reason: what hides a
     * player is normally another player's shoulders, and a 1.72 m cabinet is
     * the first thing on this stage that is not a person and hides one anyway.
     */
    const spec = SYNTH_RIGS[rig];
    s.r = spec.footprint;
    s.head = Math.max(s.head, spec.height);
  }
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
 *
 * ## Except that a band of keyboards is not that band
 *
 * The layout above hands out one position per *role*, and that is the right unit
 * for a dance band, where the roles are played by different objects. It is the
 * wrong unit for the `synth` genre, where they are not: across ten synth
 * concerts the stage carries twelve distinct instrument models and 49% of them
 * are the same one, and 90% of numbers put three or more keyboards on the
 * boards. Placed by role those three go to three unrelated corners of the stage
 * — one beside the kit playing bass, one out at the side comping, one downstage
 * on the tune — and read as three people who each happen to own a synthesiser.
 *
 * Keyboard players do not stand like that. They stand inside an arc of their own
 * gear, and where there are several of them the arc is shared: it curves back
 * and out around whoever is fronting the number, each board toed in toward the
 * middle. So the keyboards are lifted out of the role layout and given
 * `layoutGearArc`, which runs first and takes whoever it claims out of the front
 * line as well.
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
   *
   * Unless there is a grand piano in the band, where the draw is not between
   * two mirror images but between one good picture and one bad one. The piano
   * takes the audience's left and takes it with two and a half metres of case
   * — see `PIANO_SIDE` — so half the seeds were sending the bass into the one
   * corner of the stage that was already full and leaving the other half of it
   * bare boards. A piano trio came out as everybody on the left and nobody on
   * the right. So the bass takes the side the piano did not.
   */
  const furniture = slots.some((s) => BULKY.includes(s.archetype));
  const side = furniture ? -PIANO_SIDE : rng.chance(0.5) ? 1 : -1;

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
      case 'comp': {
        /**
         * The side the rhythm section did not take — with two exceptions, and
         * both of them are the grand piano.
         *
         * A comp that *is* a grand takes the audience's left whatever the coin
         * said. A comp standing beside somebody else's grand takes the other
         * side instead of the pad's, because the pad is upstage of the piano
         * and a comp is level with it: an organ sent to the piano's side landed
         * against the tail, and since it starts at the masking line and the
         * piano does not, the separator settled the argument by walking the
         * piano back toward the middle of the stage — undoing the placement
         * `PIANO_OFF_CENTRE` exists to make.
         */
        const compSide = BULKY.includes(s.archetype) ? PIANO_SIDE : furniture ? side : -side;
        s.x = compSide * Math.max(1.6, xLimit - s.r - 0.1);
        s.z = zMid;
        s.anchor = 2.6;
        s.box = { x0: -xLimit, x1: xLimit, z0: zUp + 0.4, z1: zMid + 0.6 };
        break;
      }
      case 'front':
        s.anchor = 1;
        // The tighter limit goes in the *box*, not only into the initial
        // layout: the separator is perfectly capable of shoving a horn out
        // past a limit that was only ever applied once, and did. The downstage
        // edge is the player's own, for the reason `LIP_FURNITURE` gives.
        s.box = { x0: -xFront, x1: xFront, z0: zMid + 0.25, z1: zLipLimit(D, s.r) };
        break;
    }
  }

  /**
   * The keyboards first, because the arc takes players out of the front line.
   *
   * It never takes the one in the middle — `frontCentre` is what both routines
   * ask — but a synth on the counter line and a Rhodes on the brass line are
   * both fair game, and `layoutFrontLine` has to be handed the list it is
   * actually laying out or it spaces the line around players who are no longer
   * standing in it.
   */
  /**
   * The walls first of all, because they are furniture and take their players
   * out of both of the layouts below.
   *
   * Order matters here the same way it does between the arc and the front line:
   * each routine has to be handed the list it is actually laying out, or it
   * spaces itself around players who are no longer standing there.
   */
  const walls = layoutModulars(slots, { xLimit, zUp, riserZ, hasKit: !!kit });
  const standing = slots.filter((s) => !walls.has(s));
  const arc = layoutGearArc(standing, { zMid, depth: D, side });
  layoutFrontLine(standing.filter((s) => !arc.has(s)), { xLimit: xFront, zMid, zDown, side });

  // Everyone faces the audience, give or take. The exceptions are the players
  // whose instrument is played sideways — a pianist sits along the keyboard,
  // not behind it — and the small deterministic jitter on everybody else,
  // which costs two lines and is the difference between a band and a row of
  // fence posts.
  for (const s of slots) {
    const jitter = new Rng(`${seed}:cast:facing:${s.id}`).float(-0.07, 0.07);
    // A player on the arc has already been turned by where they stand on it,
    // which is a better answer than the flat one below and knows about the
    // same instruments. They still get the jitter: it is a statement about
    // people, not about keyboards.
    if (arc.has(s) || walls.has(s)) {
      s.facing += jitter;
      continue;
    }
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
     * A recital angle: turned across the stage, but not square to it.
     *
     * The keyboard sits between the pianist and the body of the instrument, so
     * a piano square-on to the house shows the audience a large closed lid with
     * the keys and the hands hidden behind it — which is the one thing a
     * pianist is worth watching for. Turning the player is the fix, and how far
     * is the whole question.
     *
     * A right angle is the concert-hall answer and it is a photograph of a
     * silhouette: the audience gets a pure profile, one shoulder, and a
     * keyboard receding straight away from them. So the number lives between
     * that and square-on, and it lives closer to the right angle than it looks
     * like it should, because two things move with it and both want more turn.
     *
     * The **lid** is one. It is hinged on the spine and opens across the case,
     * so the direction the instrument speaks in is the turn less a right angle:
     * at sixty-six degrees the open lid was still aimed a quarter-turn off the
     * house, throwing the piano at the wing it stands in. Seventy-six brings it
     * inside fifteen degrees of the audience, which is what a lid propped for a
     * room is doing.
     *
     * The **player** is the other, and this is the part that reads as backwards
     * until you stand where the camera is. The case is downstage-right of the
     * bench at a shallow turn — between the pianist and a centred house — and
     * squarer to the house it goes, the more of it the audience looks past to
     * find the player. Turning further slides the whole instrument sideways out
     * of that line, and the house gets the pianist beside their piano rather
     * than behind it. Paired with `PIANO_SIDE` and `PIANO_OFF_CENTRE` it is the
     * arrangement a photograph of a pianist is taken from; short of the profile
     * a right angle would give, the house still sees more of a face than of a
     * cheekbone, and both hands foreshortened rather than edge-on.
     */
    case 'grand-piano': return 1.32;
    case 'organ': case 'electric-piano': case 'synth': return 0.45;
    case 'mallets': case 'harp': return 0.3;
    case 'upright-bass': return 0.2;
    default: return 0;
  }
}

/**
 * The furthest downstage this player may stand, in the venue's own metres.
 *
 * Per player rather than per stage, because what has to clear the rail is not a
 * body — it is whatever the body is holding. See `LIP_FURNITURE`.
 */
function zLipLimit(depth: number, r: number): number {
  return depth / 2 - Math.max(MARGIN_DOWN, LIP_FURNITURE + r);
}

/**
 * Who takes the middle of the front line, which is not always who has the tune.
 *
 * A grand piano and a harp are furniture: they are floor-standing, they are
 * played sideways, and putting one dead centre downstage walls the band off from
 * the audience. So a bulky instrument yields the middle to the next player along
 * and takes an outer slot, even when it is the one carrying the melody.
 * `leadPerformerId` still names the pianist — they *are* the lead — and the
 * follow spot will find them where they are.
 *
 * Lifted out of `layoutFrontLine` because `layoutGearArc` has to ask the same
 * question before the front line is laid out, and the two answers have to be the
 * same answer. If the arc were to guess differently, either two players would
 * claim the middle of the stage or nobody would.
 */
function frontCentre(slots: Slot[]): Slot | undefined {
  const front = slots.filter((s) => s.role === 'front')
    .sort((a, b) => PROMINENCE[a.layer] - PROMINENCE[b.layer]);
  return front.find((s) => !BULKY.includes(s.archetype)) ?? front[0];
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

  const centre = frontCentre(slots) ?? front[0]!;
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

  /**
   * Furniture takes the end of the line `PIANO_SIDE` names, whatever its
   * prominence says.
   *
   * The alternating slots hand out sides by how prominent a player is, which is
   * the right rule for people and the wrong one for a grand piano: prominence
   * has no opinion about which way a lid opens, and half the seeds were putting
   * the piano on the side where it hides its own keyboard. Exchanging two
   * players keeps the line's spacing and its order-of-prominence spirit — the
   * pianist and whoever was on that end swap places, and nothing else moves.
   */
  const bulkyAt = ordered.findIndex((o) => o.s !== centre && BULKY.includes(o.s.archetype));
  const endAt = PIANO_SIDE < 0 ? 0 : ordered.length - 1;
  if (bulkyAt >= 0 && bulkyAt !== endAt) {
    const end = ordered[endAt]!;
    const bulky = ordered[bulkyAt]!;
    [end.s, bulky.s] = [bulky.s, end.s];
  }

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
     * and wall the band off. That one slides to the audience's left, for the
     * reason `PIANO_SIDE` gives.
     *
     * How far it slides depends on which piece of furniture it is, and the two
     * are not close. A harp is a metre of floor with the player behind it, so
     * the old 1.6 places the whole instrument. A grand is a bench with two and
     * a half metres of piano hanging off the side of it, and placing the bench
     * is not placing the piano — see `PIANO_OFF_CENTRE`.
     */
    const centreX = BULKY.includes(centre.archetype)
      ? PIANO_SIDE * (centre.archetype === 'grand-piano' ? PIANO_OFF_CENTRE : BULKY_OFF_CENTRE)
      : 0;
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
      // `s.box.z1` is this player's own downstage limit, not the line's: a
      // singer stands on the front line and the trombone beside them stands
      // half a metre upstage of it, because that is where their slide ends.
      s.z = Math.min(
        (s === centre ? anchorZ : restZ) - (BULKY.includes(s.archetype) ? bulkySetBack : 0),
        s.box.z1,
      );
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
// Staging — the keyboard arc
// ---------------------------------------------------------------------------

/**
 * Stand the walls of cabinets at the back, and take their players off the arc.
 *
 * A modular is not gear on a stand, it is a piece of furniture with somebody in
 * front of it — 1.7 m tall and a metre and a quarter of floor. The arc exists to
 * make several keyboards read as one instrument that people are standing inside,
 * which is right for boards and wrong for a wall: you do not curve a Moog System
 * 55 around anybody, you put it at the back and stand in front of it.
 *
 * Two placements, and the choice between them is the same decision the
 * percussion already made rather than a second one:
 *
 * ```
 *   with a drummer            without one
 *   MODULAR  KIT  MODULAR       .    MODULAR   .
 *      \      |      /                  |
 *          the band                 the band
 * ```
 *
 * **Two of them flank the riser**, as far out as they fit, which is the only
 * place two objects this size can both go without one of them being in front of
 * the other.
 *
 * **One of them takes the centre — but only if the riser is empty.** Back centre
 * is the drum riser: 2.8 m wide, and the drummer's box is `locked` so the solver
 * will never move it. So the centre is available exactly when there is no
 * drummer, which is exactly when the percussion source came back a machine. One
 * player, a wall of cabinets dead centre, and a rhythm box running: that is the
 * Jarre photograph, and it falls out of a decision that was already made rather
 * than being a rule that has to be kept in step with one.
 *
 * Where there is a drummer and only one wall, it takes a side. Half a stage
 * picture is better than a modular growing out of a drum riser.
 */
function layoutModulars(
  slots: Slot[],
  geom: { xLimit: number; zUp: number; riserZ: number; hasKit: boolean },
): Set<Slot> {
  const walls = slots.filter((s) => s.rig === 'modular');
  const claimed = new Set<Slot>();
  if (!walls.length) return claimed;

  /**
   * Upstage, and level with the riser rather than in front of it.
   *
   * A wall placed at `zUp` alone would stand level with the *bass player*,
   * which puts 1.7 m of cabinet in the middle of the band. It belongs on the
   * back line with the kit, where the only thing behind it is the masking.
   */
  const z = Math.max(geom.zUp, geom.riserZ);

  walls.forEach((s, i) => {
    claimed.add(s);
    /**
     * Heavier than anything else that is not bolted down. A modular does not
     * get shuffled aside to make room for a horn player; the horn player walks
     * round it. Below the kit's 6, which is on a physical platform.
     */
    s.anchor = 4.5;

    const alone = walls.length === 1;
    // The centre only where nothing is already standing on it. See above.
    const side = alone && !geom.hasKit ? 0 : i % 2 === 0 ? 1 : -1;
    const x = side === 0 ? 0 : side * Math.max(1.6, geom.xLimit - s.r);
    s.x = x;
    s.z = z;
    /**
     * Boxed to its own end of the back line so the separator can slide it along
     * the wall but never bring it downstage into the band. Wide enough in `x`
     * to give the solver somewhere to go, and nearly flat in `z` because there
     * is nothing behind it to move into.
     */
    s.box = {
      x0: side === 0 ? -0.8 : side > 0 ? 0.6 : -geom.xLimit,
      x1: side === 0 ? 0.8 : side > 0 ? geom.xLimit : -0.6,
      z0: z - 0.15,
      z1: z + 0.6,
    };
    // Square to the house: a wall is placed, not turned. `stageBand` still adds
    // its jitter, which is a statement about the person rather than the gear.
    s.facing = 0;
  });

  return claimed;
}

/**
 * The radius the rig curves on, in metres.
 *
 * Two facts pin it, and they pull opposite ways.
 *
 * It is the rig's own width limit. A player standing `t` metres along the arc
 * from its apex is at `R·sin(t/R)`, so *nobody* on the arc is ever further than
 * `R` from the centre line however many keyboards arrive — the number is a
 * bound, not a preference. 3.4 m is inside the masking on the narrowest stage
 * this file stages a band on, the 8.8 m cellar, where the solver's own side
 * limit works out at 3.58 m. So the clamp never gets to decide where a keyboard
 * stands, which is the failure `stageAmbient` records against its own table: a
 * line laid out at its preferred size and then clamped is a line whose ends were
 * placed by the clamp.
 *
 * And it is the depth the curve spends buying that width. The widest rig this
 * generator produces is five keyboards, whose outer end is 4.0 m along the arc;
 * at 3.4 m that player stands 3.14 m to the side and 2.09 m upstage of the
 * middle, which is a rig that has visibly wrapped on a stage six metres deep.
 * Open the radius to 6 m and the same player gains 0.57 m of width, gives up
 * 0.81 m of that depth, and lands at 3.71 m — outside the cellar's 3.58 m and
 * back in the hands of the clamp. Which is the whole trade in one line: a
 * flatter arc is wider than the stage and reads, from a camera eleven metres
 * out, as a straight line with a wobble in it.
 */
const GEAR_ARC_R = 3.4;

/**
 * How far round the arc the outermost keyboard may swing, in radians.
 *
 * `R·sin θ` peaks at a quarter turn, so past about 70° another keyboard buys
 * almost no width and nothing but depth: two players on nearly the same bearing
 * from the house with a metre and a half between them, which is a stack rather
 * than a rig and is precisely what `fixSightlines` then has to pull apart. 1.2
 * rad is 69°, which on this radius is 4.08 m of arc, and the only casts that
 * reach it are the ones putting five keyboards on the arc — where closing the
 * gaps from 0.35 m to 0.2 m brings the far end back from 4.38 m to 4.0 m, which
 * is the cheaper concession.
 */
const GEAR_ARC_SWING = 1.2;

/**
 * How far off the arc the solver may push a keyboard.
 *
 * A box is a rectangle and the arc is a curve, so the box cannot say "on the
 * arc"; what it can say is "near where the arc put you". Half a metre sideways
 * is deliberately more than the 0.3 m step `fixSightlines` takes, so a keyboard
 * that has to move to be seen slides along the rig rather than being ejected
 * from it. The depth slack is `Z_BIAS` of that — 0.2 m — for the same reason
 * every push in the solver is flattened toward the horizontal: a crowded rig
 * should widen, not deepen.
 */
const GEAR_SLACK = 0.5;

/**
 * Stand the keyboard players inside one arc of gear instead of scattering them
 * by role.
 *
 * ```
 *   upstage                  KIT(riser)
 *                 synth                        synth    <- further back, and out
 *   downstage            e-piano      synth
 *                            LEAD                       <- the front line's own
 *   ---------------------------- audience ----------------------------
 * ```
 *
 * The shape is a circle bulging toward the house, its downstage point on the
 * centre line: every further keyboard is both further to the side *and* further
 * upstage, so a fourth and a fifth nest behind the first two rather than
 * extending a row. A row is the thing being avoided, and it is worth being
 * precise about why it fails — four identical rigs abreast are four identical
 * silhouettes at four evenly spaced bearings, which is the visual signature of a
 * trade stand, not of a band. Stagger them in depth and the same four read as
 * one instrument that several people are standing inside.
 *
 * Three rules decide who is where.
 *
 *  - **Prominence orders the rig**, on the same ordering the front line uses, so
 *    the player carrying the tune is the one nearest the centre and the pad is
 *    out at the end. This overrides the role layout for the bass and the pad,
 *    deliberately: "the bass stands beside the kit" is a fact about a bass
 *    *player*, someone holding an instrument and watching a hi-hat, and a
 *    keyboard bass is a patch on a board that belongs with the other boards.
 *  - **The front line keeps its own middle, and nobody stands on the centre
 *    line.** Whoever `frontCentre` names is left exactly where the front line
 *    would have put them, keyboard or not — the alternative was tried and it
 *    quietly demoted the lead: on a pavilion stage carrying a synth on the tune
 *    and a guitar on the counter, the rig swallowed the synth and handed
 *    downstage centre to the guitarist, which is a follow spot pointed at the
 *    wrong person. So the rig curves back *around* whoever is fronting the
 *    number, and its two innermost players straddle the centre line half a gap
 *    either side. That is worth having for its own sake: a keyboard directly
 *    behind a singer is a keyboard the camera cannot see and the sightline pass
 *    has to rescue, and straddling leaves the singer — and, as it happens, the
 *    drummer on the riser behind them — in the gap.
 *  - **Only when two or more are left after that.** One keyboard on a dance-band
 *    stage is a keyboard player, and an arc through one point is a point; it
 *    keeps its role position and the flat turn `sidewaysTurn` gives it. The
 *    threshold is where it is because that is the measured shape of the problem:
 *    90% of synth numbers carry three or more keyboards, against 41% of iskelmä
 *    and 30% of jazz numbers carrying as many as two.
 *
 * Where it meets the rest of the file it gives way, because the rest of the file
 * was right first. `BULKY` is untouched: a grand piano is not gear, it is never
 * on the arc, and `PIANO_SIDE` still owns the side it stands on — the two rules
 * cannot argue because `frontCentre` is the only thing either of them asks, and
 * it skips a piano before the arc ever sees the answer. The drummer is untouched
 * too: the ends of a full arc do run upstage past the front of the riser, but
 * they do it 3.1 m off the centre line against a platform 1.4 m half-wide, so
 * they pass beside it rather than onto it — and the kit's box is `locked`, so
 * wherever the two do crowd each other the solver moves the keyboard and never
 * the kit. And the sightline pass keeps its veto — see `GEAR_SLACK`, which is
 * sized so that a keyboard it has to move slides along the rig instead of out
 * of it.
 *
 * Returns the players it claimed, because the caller has to keep them out of the
 * front line and out of the flat facing rule.
 */
function layoutGearArc(
  slots: Slot[],
  geom: { zMid: number; depth: number; side: number },
): Set<Slot> {
  const arc = new Set<Slot>();
  const keeper = frontCentre(slots);
  const ordered = slots
    .filter((s) => GEAR.includes(s.archetype) && s !== keeper)
    .sort((a, b) => PROMINENCE[a.layer] - PROMINENCE[b.layer]);
  if (ordered.length < 2) return arc;

  for (const s of ordered) {
    /**
     * A player at the rig is as wide as their board, not as wide as their
     * `footprint`.
     *
     * The same correction `TABLE_R` makes for ambient's table, and for the same
     * reason: three synthesisers at their free-standing footprint are six and a
     * half metres of arc before a single gap, which on this radius swings the
     * ends past a quarter turn and into the wings. Written onto the slot rather
     * than used only here, because the solver separates on `r` and would
     * otherwise spend every pass prising the rig back apart to arm's length.
     */
    s.r = Math.min(s.r, TABLE_R);
    /**
     * Heavier than a horn, lighter than the kit. A keyboard on a stand with a
     * player behind it does not shuffle sideways to make room — but it is not
     * bolted to a platform either, and the pair of numbers is what decides
     * whether a crowded stage bends the rig or bends the person walking into
     * it. 2.4 puts it just above the comp it usually replaces.
     */
    s.anchor = 2.4;
    arc.add(s);
  }

  /**
   * Where the downstage point of the arc sits.
   *
   * `zMid + 0.6`, which is not a new number: it is the downstage edge of the
   * comp's own box, and it means the same thing here as it does there — as far
   * toward the house as an accompanying player may come without joining the
   * front line. The rig is exactly that, several times over, so it stands on
   * that line and curves upstage from it.
   */
  const zApex = geom.zMid + 0.6;

  /**
   * Which way the rig grows first — away from the side the rhythm section took.
   *
   * `side` is already the coin that decides whether the bass sits stage-left or
   * stage-right of the kit, and reusing it rather than drawing again keeps the
   * whole stage picture mirroring as one thing: on the seeds where the bass goes
   * right, the rig leans left, and the boards do not all pile up on the same
   * side as the amps.
   */
  const dir0 = -geom.side;

  // Widest gap whose ends stay inside the swing limit, tried in steps — the
  // same concession `layoutFrontLine` makes, and in the same order: keep the air
  // between players if it fits, and give it up rather than give up the shape.
  let offsets: number[] = [];
  for (const gap of [GEAR_GAP, 0.2, 0.08]) {
    offsets = arcOffsets(ordered, gap, dir0);
    const widest = offsets.reduce((m, t) => Math.max(m, Math.abs(t)), 0);
    if (widest <= GEAR_ARC_SWING * GEAR_ARC_R) break;
  }

  const place = (s: Slot, t: number): void => {
    const theta = t / GEAR_ARC_R;
    const x = GEAR_ARC_R * Math.sin(theta);
    const z = zApex - GEAR_ARC_R * (1 - Math.cos(theta));
    s.x = x;
    s.z = z;
    /**
     * Toed in by as much as the arc has already swung them, and no further than
     * this instrument's own `sidewaysTurn`.
     *
     * The grading is the point. A flat turn is what the file did before — every
     * keyboard 26° off the house whatever it was standing next to, decided by
     * the sign of an `x` that may be 4 cm from centre — and a flat turn applied
     * to a row is still a row, just a slanted one. Turning each player by their
     * own arc angle makes the rig converge on the middle instead: the inner pair
     * is barely off square, at 13° or so, and every player beyond them is at the
     * cap. The cap is the number `sidewaysTurn` already believes about a
     * keyboard rather than a new one, so the outer boards sit at the 26° a
     * keyboard is played at and nobody ends up in profile at the end of a long
     * arc.
     */
    s.facing = -Math.sign(x || 1) * Math.min(sidewaysTurn(s.archetype), Math.abs(theta));
    const zSlack = GEAR_SLACK * Z_BIAS;
    s.box = {
      x0: x - GEAR_SLACK,
      x1: x + GEAR_SLACK,
      z0: z - zSlack,
      z1: Math.min(z + zSlack, zLipLimit(geom.depth, s.r)),
    };
  };

  ordered.forEach((s, i) => place(s, offsets[i]!));
  return arc;
}

/**
 * Arc length from the centre line to each player of the rig, signed.
 *
 * Bodies are laid end to end outward from the middle, alternating sides, so the
 * spacing is measured *along the curve* rather than across the stage. That is
 * the whole difference between an arc and a row with a bend in it: laid out in
 * `x` and then sagged, five keyboards still need 7.8 m of stage, and the ends of
 * that are in the masking on every room in `venue.ts`. Laid out in arc length the
 * same 7.8 m of bodies occupies 5.34 m across and 2.09 m of depth.
 *
 * Both cursors start half a gap out from the centre line, which is what leaves
 * it clear for whoever is fronting the number.
 */
function arcOffsets(ordered: Slot[], gap: number, dir0: number): number[] {
  let right = gap / 2;
  let left = right;
  const out: number[] = [];
  for (let i = 0; i < ordered.length; i++) {
    const s = ordered[i]!;
    if ((i % 2 === 0 ? dir0 : -dir0) > 0) {
      out.push(right + s.r);
      right += 2 * s.r + gap;
    } else {
      out.push(-(left + s.r));
      left += 2 * s.r + gap;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Staging — ambient
// ---------------------------------------------------------------------------

/**
 * Archetypes that stand behind gear on a stand rather than holding anything.
 *
 * Read by both staging routines and meaning slightly different things to each,
 * which is worth naming rather than discovering: ambient puts them on `perch`
 * posture at a shared table, and the band layout lifts them out of their roles
 * onto `layoutGearArc`. What the two agree about is the only thing this list
 * asserts — that the player is parked behind a board on legs, so their width is
 * the board's and not their arm's reach.
 *
 * The organ is deliberately absent from both. It is a keyboard, but it is a
 * console with a bench, its spec sits the player down, and an organist wheeled
 * into an arc of stands would be the one member of the rig at the wrong height
 * facing the wrong way.
 */
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
 * Which side of the stage a grand piano goes, and it is not a coin toss.
 *
 * Everything else in this file may be mirrored — the bass takes whichever side
 * of the kit the seed says — but a grand is asymmetric and only one of the two
 * mirror images is worth looking at. The case runs away from the player, the
 * lid is hinged on the bass spine, and the pianist is turned so that the
 * keyboard runs downstage. Put that on the audience's *left* (`-x`, see the
 * space convention in `types.ts`) and the spine sits upstage, the lid opens
 * toward the house, and the audience looks along the keys at the player's right
 * side: the picture every photograph of a pianist is.
 *
 * Mirror it and the same geometry gives the house a closed lid to look at with
 * the hands behind it — the one thing a pianist is worth watching for, hidden
 * by their own instrument. So the piano gets the left, and the coin decides the
 * things that are genuinely symmetrical.
 */
const PIANO_SIDE = -1;

/**
 * How far off centre a piece of furniture sits when it is the whole front line.
 *
 * The harp's number, and the grand piano's until it turned out to be measuring
 * the bench. Anything played from behind is more or less where its player is,
 * so 1.6 is a metre and a half of daylight between it and the middle of the
 * stage and there is nothing more to say about it.
 */
const BULKY_OFF_CENTRE = 1.6;

/**
 * How far off centre the *pianist* sits when the piano is the whole front line.
 *
 * The one number in this file that is not measuring the thing it places. Every
 * other station is a person with their instrument more or less on top of them;
 * a pianist sits at the keyboard end of two and a half metres of case that runs
 * out to their right, so the bench is at one end of the picture and the tail
 * and the raised lid are 2.3 m further across the stage. At the old 1.6 that
 * put the lid over the centre line, in front of the drummer — who is sitting
 * down behind a wall of drums and is already the easiest player on any stage to
 * lose. Nothing caught it: `fixSightlines` measures people against people, and
 * a piano is furniture.
 *
 * 2.7 is where the bench has to be for the tail to land short of the kit's
 * bearing from the house, and it costs nothing — the front line here is one
 * player wide and the other half of the stage is bass and drums. It also
 * uncrosses the pianist's own sightline: at 1.6 the camera looked at them
 * across the corner of their own lid.
 */
const PIANO_OFF_CENTRE = 2.7;

/**
 * How far an instrument must turn its player before that turn stops being a
 * preference and starts being where they have to face.
 *
 * Only the grand piano is over the line today. A pianist turned less than this
 * cannot reach the keys, so the number outranks every other rule about facing —
 * including ambient's, which otherwise splays everybody outward.
 */
const TURN_IS_STRUCTURAL = 1;

/**
 * How much of the outward splay is given back by the time a player is at the
 * lip.
 *
 * 0.6 leaves a downstage player between 6° and 22° off the house, against the
 * 14°–54° the back of the stage keeps. The lower end is small enough to read as
 * a person standing naturally rather than as a rule being obeyed, and the upper
 * end is still short of the angle at which a face becomes a cheekbone — which
 * is the whole quantity being bought here.
 *
 * Not 1. Squaring the front row to the house would build the front line this
 * staging exists to refuse; the fan has to survive at the lip, just quietly.
 */
const SPLAY_DECAY = 0.6;

/**
 * How much of the *framed* half-width the ambient scatter treats as free
 * ground.
 *
 * Measured against `IN_FRAME` rather than against the boards, and that is the
 * correction rather than the number. Against the boards the ramp reached full
 * cost at 4.3 m — a place the camera cannot see — so a player out at 3.3 m,
 * already half out of frame, was paying about a quarter of the penalty and
 * taking the corner anyway. Against the frame the cost lands where the picture
 * actually ends, and a player who crosses the line keeps paying past it.
 *
 * Half of the black box's 3.4 m of frame still leaves a three-and-a-half-metre
 * middle to scatter four or five players across, which is more room than they
 * need and nothing like a huddle.
 */
const SCATTER_SHOULDER = 0.5;

/**
 * What standing on the edge of frame costs, in the same units as `room`.
 *
 * Sized against what it competes with. `room` is metres of clearance to the
 * nearest player, and on a stage this size the difference between a comfortable
 * spot and the emptiest one available is a metre or two — so a penalty of 4 at
 * the frame edge outbids the pull toward the corners without being absolute. A
 * player who genuinely has nowhere else to go can still take the wing, which is
 * the one thing a hard clamp on the draw range cannot express: clamping moves
 * the pile-up to the new edge instead of dispersing it, because the selection
 * is what does the pushing.
 */
const WING_PENALTY = 4;

/**
 * Metres of daylight between two pieces of gear, when it fits — on ambient's
 * table, and along the band's arc, where it is measured round the curve.
 */
const GEAR_GAP = 0.35;

/**
 * How wide a player at a shared table is, as a radius.
 *
 * `footprint` is the stage a free-standing player claims — arm's length, room
 * to turn, room for somebody to walk behind them — and it is the wrong quantity
 * for somebody parked behind a keyboard on a stand. A synthesiser
 * claims 1.0 there and an electric piano 0.9, so three of them came out as a
 * six-and-a-half-metre line: not a bank of keyboards, a row of people who own
 * synthesisers, with the two ends of it out past the edge of frame. A stage
 * keyboard is about 1.4 m wide and its player stands behind it, which is the
 * measurement this is.
 *
 * It is written onto the slot rather than used only for the layout, because the
 * solver separates on `r` and would otherwise spend its passes pushing the
 * table back apart to arm's length.
 *
 * `layoutGearArc` borrows it for the band stages, where the measurement is the
 * same measurement: a keyboard is 1.4 m wide in a black box and 1.4 m wide in a
 * pavilion, and the arc has less room to waste on the difference than the table
 * does.
 */
const TABLE_R = 0.7;

/**
 * How much of the framed width a full gear table may take up.
 *
 * Not a taste: at `TABLE_R` four players are 5.6 m of bodies before a single
 * gap, against about 6.9 m of frame in the black box. At a fixed gap the line
 * came out wider than the picture, and the clamp then jammed its far end into
 * the side margin while leaving two metres of empty boards at the other end — a
 * table shoved off the side of the stage rather than a table.
 */
const TABLE_SHARE = 0.86;

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
 *    read as *one rig* rather than as three people who happen to be standing in
 *    a row. There is no trestle under it: each keyboard carries its own stand,
 *    and the prop that used to sit here was placed by the stage builder at a
 *    fixed spot with no idea where these stations ended up, so it stood inside
 *    a player about as often as not. See `venue.ts` for why it went rather than
 *    got reconciled.
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
  /**
   * Two limits, and keeping them apart is most of what this routine got wrong.
   *
   * `xLimit` is where the boards stop being usable — the side margin or the
   * masking, whichever binds. `xFrame` is where the *picture* stops. The old
   * code had only the first, so the scatter spread happily across ground that
   * is real, unobstructed, lit, and outside every shot the camera takes: five
   * players on stage, three of them in frame.
   *
   * So the boxes are built from `xLimit`, because that is what is physically
   * true, and everything that *chooses* a position is sized to `xFrame`.
   */
  const xLimit = Math.min(W / 2 - MARGIN_SIDE, W * OPENING);
  /** Half the framed width. Never zero, because the scatter divides by it. */
  const xFrame = Math.max(W * IN_FRAME, 0.5);
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
    if (GEAR.includes(s.archetype)) {
      s.posture = 'perch';
      s.r = Math.min(s.r, TABLE_R);
    }
    /**
     * A box bounds a player's *centre*, so the side limit owes them their own
     * footprint back.
     *
     * Without it the limit is a promise about a point rather than about a
     * person: a drummer whose centre is 0.5 m off the edge of the boards has
     * most of a kit in the wing flat, and the flats are 0.25 m inboard of the
     * opening besides. Every other constraint reports success and the render
     * shows a cymbal coming through the wall.
     */
    const half = Math.max(0.5, xLimit - s.r);
    // And the downstage limit owes them the same, against the rail rather than
    // against the wing flats. See `LIP_FURNITURE`.
    s.box = { x0: -half, x1: half, z0, z1: Math.min(z1, zLipLimit(D, s.r)) };
    s.avoidFrontCentre = true;
    s.head = headAbove(s.posture, s.look.height);
  }

  const gear = slots.filter((s) => s.posture === 'perch');
  const loose = slots.filter((s) => s.posture !== 'perch');

  // The table: a line, upstage, offset to one side, and very slightly askew.
  // Square-on furniture reads as a diagram; two degrees off reads as furniture.
  if (gear.length) {
    const angle = rng.float(-0.2, 0.2);
    const tableZ = z0 + rng.float(0.3, 1.1);
    const offset = rng.float(0.5, 1.8);
    let bodies = 0;
    for (const s of gear) bodies += s.r * 2;
    /**
     * The gaps close before anybody is pushed out of frame, and the offset
     * gives way before the ends do.
     *
     * Both are the same failure seen twice: the line was laid out at its
     * preferred size and preferred offset and then clamped, so on a full table
     * the clamp — not the layout — decided where the outermost player stood,
     * and it always decided "against the limit". Sizing the line to the frame
     * first and spending whatever room is left on the offset keeps the ends
     * inside the picture without giving up either the crowding or the lean to
     * one side that make it read as furniture. Because the offset yields last,
     * the worst case is an end player at `xFrame` minus their own width — in
     * frame by construction, whatever the table is carrying.
     */
    const gaps = Math.max(gear.length - 1, 1);
    const gap = Math.min(GEAR_GAP, Math.max(0.05, (2 * xFrame * TABLE_SHARE - bodies) / gaps));
    const span = bodies + gap * (gear.length - 1);
    const centre = side * Math.min(offset, Math.max(0, xFrame - span / 2));
    let t = -span / 2;
    for (const s of gear) {
      t += s.r;
      s.x = clamp(centre + t * Math.cos(angle), s.box.x0, s.box.x1);
      s.z = clamp(tableZ + t * Math.sin(angle), z0, z1);
      t += s.r + gap;
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
    const zHigh = Math.min(downstage >= 2 ? zFrontLimit : z1, s.box.z1);
    /**
     * A grand piano is drawn from one half of the stage only.
     *
     * The scatter has no opinion about which way an instrument faces and it
     * should not grow one, so the asymmetry is expressed where it belongs: in
     * where the piano is allowed to land. `PIANO_SIDE` has the argument. Half a
     * stage is still plenty of ground for one draw, and it is the only slot in
     * this routine that gets told anything at all.
     */
    const bulky = BULKY.includes(s.archetype);
    const drawLo = bulky && PIANO_SIDE > 0 ? 0 : s.box.x0;
    const drawHi = bulky && PIANO_SIDE < 0 ? 0 : s.box.x1;
    let best: { x: number; z: number; score: number } | undefined;
    for (let k = 0; k < 28; k++) {
      const cx = rng.float(drawLo, drawHi);
      const cz = z0 + (zHigh - z0) * Math.pow(rng.next(), 1.7);
      if (inFrontCentre(cx, cz, z1)) continue;
      let room = 6;
      for (const p of placed) {
        room = Math.min(room, Math.hypot(cx - p.x, cz - p.z) - p.r - s.r);
      }
      /**
       * Elbow room, minus a penalty for being downstage and another for being
       * out in the wings.
       *
       * Sampling `z` with an upstage bias is not enough on its own, and the
       * reason is worth recording: best-candidate sampling picks whichever
       * draw is *furthest from everybody else*, and once the gear table is
       * upstage the emptiest part of the room is the front. The bias gets
       * silently inverted and the scatter grows a front line — which is the
       * one thing this staging is not allowed to have. The penalty is what
       * makes the preference survive the selection.
       *
       * The same inversion happens sideways, and it is worse because nothing
       * was resisting it at all: the emptiest ground on a stage is always its
       * two far corners, so "furthest from everybody" walked player after
       * player out to the side margins and left them standing in the wings with
       * the middle of the stage empty. Narrowing the draw would only have
       * moved the pile-up to whatever the new edge was, because the selection
       * is what is doing the pushing. So the sides cost something instead:
       * nothing at all through the middle half of the *frame*, then a squared
       * ramp that reaches `WING_PENALTY` where the picture ends and keeps
       * climbing past it. Squared rather than linear because the cost has to
       * stay negligible where the scatter is meant to be irregular and become
       * decisive only where it is not — a linear ramp shaves the whole
       * distribution toward centre and starts producing the tidy cluster this
       * routine exists to avoid.
       *
       * Measuring the ramp against the frame rather than against the boards is
       * the difference between a rule and a gesture: the two lines are a metre
       * apart, and that metre is exactly the band where a player is on the
       * stage and out of the shot.
       */
      const downstageness = (cz - z0) / Math.max(0.001, z1 - z0);
      const wing = Math.max(0, Math.abs(cx) / xFrame - SCATTER_SHOULDER) / (1 - SCATTER_SHOULDER);
      const score = room - 1.2 * downstageness - WING_PENALTY * wing * wing;
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
    const turn = sidewaysTurn(s.archetype);
    /**
     * How much of the splay a player at this depth is allowed.
     *
     * The splay used to be the same everywhere, because it is a statement about
     * the band rather than about a position — and that is exactly why it read
     * wrong at the front. Upstage, 30° off the house is a player absorbed in
     * their own gear; downstage, on the two people the camera is closest to, it
     * is a pair of profiles turned into the wings, looking at the masking. The
     * genre asks for nobody performing *at* the audience, which is not the same
     * request as nobody showing them a face.
     *
     * So the splay is spent where it costs nothing. Full value along the back
     * wall, `1 - SPLAY_DECAY` of it at the lip, linear between: the arrangement
     * still fans outward, the players who read as a picture stay near square to
     * the house, and no rule about eye contact has been relaxed — `avertGazes`
     * runs afterwards either way.
     */
    const depth = (s.z - z0) / Math.max(0.001, z1 - z0);
    const splay = 1 - SPLAY_DECAY * Math.min(1, Math.max(0, depth));
    /**
     * Unless the instrument decides it.
     *
     * The splay is a statement about how this band behaves, and a grand piano
     * is not in a position to make statements: the keyboard is between the
     * player and the case, so a pianist splayed 30° off the house is a pianist
     * with a closed lid where their hands should be. Ambient loses nothing by
     * conceding it — the player still faces across the stage rather than at
     * anybody, which is the whole point of the splay in the first place.
     */
    if (turn >= TURN_IS_STRUCTURAL) {
      s.facing = -away * turn + own.float(-0.1, 0.1);
      continue;
    }
    s.facing = (away * own.float(0.25, 0.95) - (turn * away * 0.4)) * splay;
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
 * the later of the two turns further away until they do not — unless the later
 * one is the player whose instrument is pointing them (`TURN_IS_STRUCTURAL`),
 * in which case the other gives way. A pianist cannot turn 25° to be polite.
 */
function avertGazes(slots: Slot[]): void {
  const CONE = 0.4;
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i]!;
      const b = slots[j]!;
      const yields = sidewaysTurn(b.archetype) >= TURN_IS_STRUCTURAL ? a : b;
      const other = yields === b ? a : b;
      for (let tries = 0; tries < 8; tries++) {
        const d = Math.hypot(b.x - a.x, b.z - a.z);
        if (d > 4.5) break;
        if (!looksAt(a, b, CONE) || !looksAt(b, a, CONE)) break;
        /**
         * Turn away from them, rather than turning one fixed direction.
         *
         * This used to be `+= 0.45` unconditionally, which is a rotation of the
         * whole stage toward the audience's right and only accidentally an
         * aversion. Whether it helped depended on which side of the centre line
         * the yielding player was standing: a player splayed to `-0.5` was
         * rotated back toward the house, and a player splayed to `+0.95` was
         * pushed on out to `+1.4`, past profile and into the wing — the one
         * outcome `SPLAY_DECAY` above exists to prevent, reintroduced by the
         * pass that runs after it.
         *
         * The bearing to the other player says which way is away: the yielding
         * player is already leaning to one side of them by `delta`, and leaning
         * further that way is both the shorter correction and a monotone one,
         * so the cone is cleared in a step or two instead of by sweeping
         * through most of a circle.
         */
        const bearing = Math.atan2(other.x - yields.x, other.z - yields.z);
        let delta = (yields.facing - bearing) % (2 * Math.PI);
        if (delta > Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;
        yields.facing += delta >= 0 ? 0.45 : -0.45;
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
  /**
   * The masking line, less the width of the person standing on it.
   *
   * Every limit in this file bounds a *centre*, and the solver is where that
   * stops being a technicality: shoving is what puts players against their
   * limits, so the players who reach this one are the same ones the audience is
   * furthest off to the side of. Half a trumpeter behind the tormentor is the
   * failure `OPENING` exists to prevent and was still allowing, because the
   * layout was measured to a point and the tormentor is not.
   *
   * `SILHOUETTE_R` rather than `footprint`, for the reason it was defined:
   * what the masking cuts into is shoulders, not floor space.
   */
  const half = Math.min(venue.width / 2 - MARGIN_SIDE, venue.width * OPENING) - SILHOUETTE_R;
  const stage: Box = {
    x0: -half,
    x1: half,
    z0: -venue.depth / 2 + MARGIN_UP,
    z1: venue.depth / 2 - MARGIN_DOWN,
  };
  /**
   * Clamped once here, not only when somebody is pushed.
   *
   * `clampInto` runs inside `separate`, which means a player who never
   * collides with anybody is never checked against the stage at all — and the
   * players who never collide are exactly the ones standing on their own out
   * at the end of the front line. A layout that reached its own limit kept
   * whatever the limit was when it was laid out, including the ones that do
   * not know about the masking.
   */
  for (const s of slots) {
    s.box = intersect(s.box, stage);
    clampInto(s);
  }

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
  const slots = roster(song, seed, wardrobe, era?.density ?? 0.6, era?.year ?? 1980, genre);

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
      ...(s.rig ? { rig: s.rig } : {}),
    };
  });

  const machines = placeMachine(song, slots, venue);

  return {
    performers,
    ...(lead ? { leadPerformerId: lead.id } : {}),
    ...(machines.length ? { machines } : {}),
  };
}

/**
 * How far to the side of a player their rhythm box stands, in metres.
 *
 * Inside arm's reach and outside the space their own instrument occupies, which
 * is what `footprint` measures — so it is added rather than assumed. A box any
 * closer is inside the keyboard; any further and the hand that starts it has to
 * take a step, which is a different gesture and a worse one.
 */
const MACHINE_REACH = 0.42;

/** Table height. A rhythm box sits on a stand, not on the boards. */
const MACHINE_HEIGHT = 0.92;

/**
 * Stand the drum machine somewhere, if there is one.
 *
 * Two placements, and the choice between them is the whole of the logic.
 *
 * **Beside somebody, where there is somebody.** The machine goes next to the
 * player most likely to have switched it on — a keyboard player by preference,
 * since on every stage this genre describes the box lived on the end of the
 * keyboard rig and the person behind it was the one who started it. It stands
 * on the side away from the middle of the stage, so it never comes between that
 * player and the audience.
 *
 * **On the riser, where there is not.** A number with no keyboard and no
 * drummer — an ambient piece of tape and voices — has an empty platform at the
 * back of the stage that the kit would have been on, and that is exactly where
 * the pulse should appear to be coming from. It gets no tender, and the type
 * says so: a renderer must not assume a hand is ever near it.
 */
function placeMachine(song: Song, slots: Slot[], venue: Venue): StageMachine[] {
  const source = song.drums.source ?? 'kit';
  if (!song.drums.events.length || isPlayedByHand(source)) return [];
  const kind = source === 'box' ? 'box' : 'programmed';

  /**
   * Whoever is nearest to having started it: a keyboard player, then anybody.
   *
   * `GEAR` is the list of archetypes that stand behind a board on a stand
   * rather than holding something, which is the same question asked for a
   * different reason — a player with both hands full of trombone is not
   * reaching over to a rhythm box either.
   */
  const tender = slots.find((s) => GEAR.includes(s.archetype))
    ?? slots.find((s) => !specFor(s.archetype).held)
    ?? slots[0];

  if (!tender) {
    return [{
      id: 'machine',
      kind,
      bank: song.drums.bank,
      position: [0, round(RISER_HEIGHT + MACHINE_HEIGHT), round(-venue.depth / 2 + RISER_FROM_BACK)],
      facing: 0,
    }];
  }

  // Outboard of the tender: `-sign(x)` would walk it toward the centre line and
  // put it between them and the house. A player on the centre line has no
  // outboard side, so they get their right.
  const out = tender.x >= 0 ? 1 : -1;
  return [{
    id: 'machine',
    kind,
    bank: song.drums.bank,
    position: [
      round(tender.x + out * (tender.r + MACHINE_REACH)),
      round(tender.riser + MACHINE_HEIGHT),
      round(tender.z),
    ],
    facing: round(tender.facing),
    tendedBy: tender.id,
  }];
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
