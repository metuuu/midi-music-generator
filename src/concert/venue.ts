/**
 * The room, chosen from the music.
 *
 * A stage is not neutral. The same quintet reads as a different band depending
 * on whether it is standing under bunting on a lakeside pavilion or in a brick
 * cellar with candles on the tables, and getting that wrong costs more than any
 * amount of work on the players themselves — an audience decides what it is
 * watching in the first second, from the room.
 *
 * So: **genre dresses the room, era shifts the palette and the fixtures.** The
 * genre decides which room it is, because a genre is a place before it is a set
 * of chords. The era decides what colour the paint is and what the lights are
 * made of, which is exactly the distinction the era tables already draw
 * everywhere else in this project — `EraProfile` decides the production, never
 * the notes.
 *
 * ## The rooms live in the genres now — a change of owner, not of rule
 *
 * The sentence above is unchanged. What changed is *who writes it down*: the
 * pavilion, the cellar and the black box used to be declared in this file, in a
 * `Record` keyed by genre id, and they now live in the genres that stage in them
 * — `Genre.staging.room`, see `genre/types.ts` for the argument at length.
 *
 * It is worth being exact about why that was right to invert, because the old
 * shape was not a mistake. Three rooms in one file are *comparable*, and every
 * per-entry comment in them was written for a reader looking at all three at
 * once. Sixteen would not be: a table every genre author has to edit is a
 * registry rather than a table, and this file would have become the place where
 * sixteen parallel authors met. The symptom is that it had already started —
 * `synth` was added and staged in `HOUSE`, because nobody adding a genre thinks
 * to come here.
 *
 * What stays is everything that is genuinely the *stage's*: the prop vocabulary
 * below, the sizing argument, the RNG discipline, and `HOUSE` — the room for a
 * genre that has declared nothing.
 *
 * ## The prop vocabulary is a contract
 *
 * `Venue.props` is typed `string[]` in the frozen contract, which is right —
 * the IR should stay printable, and *some* renderer, one day, should be able to
 * ignore a prop it has not modelled. But two systems have to agree on the
 * spelling or the agreement is silent and wrong: the rooms name the props and
 * `web/concert/stage.ts` places them. The full vocabulary is therefore declared
 * here, so a prop invented in a hurry is a compile error rather than a piece of
 * scenery that never appears. That is now doing more work than it was: the
 * rooms have moved out to the genres, so `PropName` is what a genre author
 * picks from, and it is the reason a new room is a new *dressing* rather than a
 * request for new scenery.
 *
 * **One list, and the renderer reads it.** `web/concert/stage-props.ts` used to
 * declare the same names over again as `SUPPORTED_PROPS` and derive its own
 * `PropName` from them; nothing imported the list below, so the two agreed by
 * inspection rather than by the compiler, and the claim below that this list
 * *is* the stage's vocabulary was an aspiration rather than a fact. The
 * renderer imports this one now and re-exports it under the old name, so its
 * own callers never noticed.
 *
 * The direction was the only one available. `concert/` is the IR and
 * `web/concert/` renders it — the vocabulary may not depend on the thing that
 * draws it, or the IR stops being printable without a WebGL context. What the
 * inversion buys is not tidiness but a compile error: `BUILDERS` over there is
 * a total `Record<PropName, …>`, so a name added here with no geometry added
 * there fails `npm run typecheck` rather than becoming scenery that never
 * appears. Adding a prop is a two-file change by construction, and the compiler
 * names the second file.
 *
 * **One prop is furniture a performer stands at, and is therefore owned
 * twice.** `riser` is placed by the stage builder, while `cast.ts`
 * independently decides where the drummer sits. If the two disagree the kit
 * floats — so it is reconciled: its size, height and position are fixed
 * constants shared by both files, and `cast.ts` pins the drummer inside them.
 *
 * There used to be a second one. `gear-table` put a trestle upstage for the
 * ambient electronics to sit on, and it was never reconciled with anything:
 * the stage placed it at a fixed spot and nothing told it where the `perch`
 * stations had ended up, so it spent most seeds standing inside a player.
 * Reconciling it would have meant a second shared-constants seam for a prop
 * that earns nothing — the synth and the electric piano both carry their own
 * stands (see `web/concert/instruments/`), so the gear has legs without it.
 * Deleted rather than fixed.
 *
 * Nothing else a player touches is a prop. No microphone stand, no music
 * stands, no instruments: those belong to the instrument models, which know
 * where the hands go.
 *
 * **An orchestra does not change that, and it is the case worth writing down**
 * because it is the one that looks as though it should. A hundred music stands
 * are not furniture a player happens to touch, they are the classical
 * silhouette — you can read *orchestra* off the stands alone, at a distance
 * where no instrument is legible. The argument for making them a prop is far
 * better than the argument for a microphone stand, and it still fails, on the
 * same sentence `gear-table` failed on: the stage builder cannot see the cast.
 * A stand's position is a function of where a player is standing and of nothing
 * else, so thirty of them placed blind is the gear-table bug thirty times over;
 * and the rule that keeps the renderer's floor props honest — in the wings,
 * upstage of the backline, or downstage of the lip — is exactly the rule a
 * music stand has to break in order to be a music stand. A stand nobody could
 * read from is a lectern. They belong wherever the hands are, which is
 * `cast.ts` and the instrument models, and if an orchestra ever wants them that
 * is where the work is.
 *
 * A conductor's podium is the same mistake with one person on it. `riser` is
 * what it costs to put a platform under somebody honestly — fixed constants in
 * two files, a switch so it is struck when nobody is standing on it — and one
 * of those is enough.
 *
 * ## Sizes
 *
 * Stage dimensions are worst-case rather than characteristic. `chooseVenue`
 * runs before the cast exists, so the boards have to hold the largest band the
 * genre can produce — eight players, one of them behind a kit that wants a
 * 3.2 m circle to itself. A real cellar stage is half this size and takes a
 * trio; ours takes an octet, and the intimacy is carried by the room around the
 * stage (rows, tables, ceiling) rather than by cramping the band. See
 * `cast.ts`, which is what has to fit inside these numbers.
 *
 * That paragraph is now advice to somebody writing a room in a genre folder
 * rather than a description of a table in this file, and it is the one rule a
 * new room can get wrong invisibly: a stage too small does not fail, it produces
 * a solver that spreads the band to the edges and a picture with somebody
 * standing behind a tormentor. Nothing below 8.5 m wide has been tried.
 */

import { Rng } from '../core/rng.js';
import { GENRES } from '../genre/index.js';
import type { StageRoom } from '../genre/types.js';
import type { EraProfile } from '../style/types.js';
import type { Venue } from './types.js';

// ---------------------------------------------------------------------------
// The prop vocabulary
// ---------------------------------------------------------------------------

/**
 * Every piece of set dressing a room can ask for.
 *
 * **This list is not ours alone, and it is no longer copied.**
 * `web/concert/stage-props.ts` imports it and carries one builder per name, so
 * the union below *is* the stage's vocabulary rather than a wish list that
 * happens to overlap with it — a name here with no geometry there fails
 * `npm run typecheck`, and a room asking for a name that is not here fails it
 * too. The IR stays as printable as it ever was, because `Venue.props` is still
 * `string[]`; what has gone is any way for something inside this repo to ask
 * for scenery that quietly never appears.
 *
 * **Thirty-nine names, and the count is the point rather than an apology.**
 * Sixteen genres stage in rooms this generator has never built — a hall, an
 * arena, a warehouse, a dancehall, a honky-tonk, a barn, a courtyard, a
 * carpeted recital floor — and what separates two of them is rarely the
 * dimensions. It is one or two objects. A backline and a PA stack are both
 * walls of speaker boxes and only one of them makes a rock stage; a barn and a
 * warehouse are the same roof over different floors, and the floor is the
 * whole difference. Each addition below has to be *the* object somebody would
 * name if asked what room they were looking at. Nothing here is atmosphere.
 *
 * Four of them change how the room is *built* rather than adding an object, and
 * are emitted deliberately, at most one per room — a room that names none of
 * them gets the plain proscenium, which is what the house and the synth hall
 * both are:
 *   `open-air`     no walls; a pavilion is a roof on posts, open to the night
 *   `brick`        a low brick room close around the band
 *   `black-box`    matte black on every surface, no architecture at all
 *   `haze`         smoke in the air as a property of the room
 *
 * The pavilion:
 *   `bunting`         triangular pennants strung across the opening
 *   `fairy-lights`    a strung line of bare bulbs
 *   `paper-lanterns`  coloured paper globes
 *   `moths`           insects orbiting the beams. A summer night, outdoors.
 *   `birch`           the trees a Finnish lakeside pavilion stands among
 *   `lake`            water and a far shore, past the open sides
 *   `flowers`         on the rail and the front of the stage
 *   `railing`         the low fence around an open dance floor
 *   `dance-floor`     sprung boards downstage, for dancing on
 *   `mirror-ball`     above the dance floor
 *   `chandelier`      the one piece of grandeur a gilt room has
 *
 * The club, and with it the honky-tonk and the dancehall — one room with a bar
 * in it, three ways:
 *   `tables`          small round tables, right up to the stage
 *   `candles`         one per table, and the only warm light in a cellar
 *   `low-ceiling`     a lid a metre above the players' heads
 *   `bar`             bottles on shelves, lit from behind
 *   `posters`         past bills pasted on the wall
 *   `rug`             a worn rug under the gear or the front line
 *   `neon`            tube signage on the back wall and in the wings. The one
 *                     thing that says *bar* from across a dark room.
 *
 * The black box, and the synth hall, which is dressed out of the same four:
 *   `projection`      a lit rectangle upstage; ambient's only scenery
 *   `flight-case`     the boxes it all arrived in, still on stage
 *   `cables`          gaffered runs across the boards
 *   `drapes`          black masking where a wall would be
 *
 * The concert hall:
 *   `stalls`          raked rows of seats in the house — a hall's audience is
 *                     furniture, where a club's is people at tables
 *   `organ-pipes`     a fan of front pipes on the back wall, above the band
 *   `carpet`          the floor covered wall to wall, for a band that sits on
 *                     it. Not `rug`, which is a worn thing under the gear.
 *
 * The barn and the warehouse, which are one roof over two floors:
 *   `beams`           exposed roof timbers across the room, well overhead
 *   `hay`             bales, out in the house, where people sit on them
 *
 * The courtyard:
 *   `arches`          an arcade across the back wall. A riad, a cloister, a
 *                     hall with Moorish arcading.
 *
 * The arena:
 *   `truss`           flown lighting lattice over the stage
 *   `screen`          an LED wall behind the band. Not `projection`, which is
 *                     film on a cloth and belongs to a different decade.
 *   `crowd-barrier`   the steel rail across the pit, and the gap in front of
 *                     it. Not `railing`, which stands on the stage.
 *
 * Any stage:
 *   `pa-stack`        speakers, flown or on poles, facing the house
 *   `backline`        the band's own amplifiers, in a wall along the back wall
 *                     facing the other way. The defining object of a rock stage.
 *   `wedges`          floor monitors facing the band
 *   `riser`           the drum platform. See `cast.ts` — its size and height
 *                     are fixed, and `Station.riser` has to agree with them.
 */
export const PROPS = [
  // Room modifiers
  'open-air', 'brick', 'black-box', 'haze',
  // Pavilion
  'bunting', 'fairy-lights', 'paper-lanterns', 'moths', 'birch', 'lake',
  'flowers', 'railing', 'dance-floor', 'mirror-ball', 'chandelier',
  // Club, honky-tonk, dancehall
  'tables', 'candles', 'low-ceiling', 'bar', 'posters', 'rug', 'neon',
  // Black box
  'projection', 'flight-case', 'cables', 'drapes',
  // Concert hall
  'stalls', 'organ-pipes', 'carpet',
  // Barn and warehouse
  'beams', 'hay',
  // Courtyard
  'arches',
  // Arena
  'truss', 'screen', 'crowd-barrier',
  // Any stage
  'pa-stack', 'backline', 'wedges', 'riser',
] as const;

/**
 * The same list as a type.
 *
 * Derived rather than written out, which is the smallest version of the whole
 * argument above: two declarations of one vocabulary drift, and they drift
 * silently, because agreeing today is what they are best at.
 */
export type PropName = (typeof PROPS)[number];

// ---------------------------------------------------------------------------
// The house room
// ---------------------------------------------------------------------------

/**
 * THE HOUSE — anything else.
 *
 * A plain proscenium theatre for a genre that has declared no room of its own.
 * It exists so that adding a genre stages *badly* rather than crashing, and it
 * is deliberately dull: a house room that looked good would be a reason never to
 * write the real one.
 *
 * The one room left in this file, and it is here rather than in a genre folder
 * because it belongs to no genre — it is the floor under all of them. Its
 * dullness is the same argument `cast.ts` makes for `PLAIN`, and it should stay
 * legible as a stub: three names, no eras, one dressing, and a stage nobody
 * chose.
 */
const HOUSE: StageRoom = {
  id: 'house',
  names: ['The Playhouse', 'The Grand', 'The Empire'],
  width: 9.4, depth: 6,
  audience: { rows: 8, density: 0.6, seated: true },
  eras: {},
  fallback: {
    palette: {
      boards: '#7a5c3a', backdrop: '#232733', curtain: '#6d2430',
      proscenium: '#c7b489', ambient: '#ffd8b0',
    },
    props: ['drapes', 'riser', 'wedges'],
    fog: 0.2,
  },
};

// ---------------------------------------------------------------------------

/**
 * Pick the room.
 *
 * Deterministic in `seed`: the same concert always plays the same venue with
 * the same optional dressing in it. The genre and era are folded into the
 * stream tag rather than into the seed itself so that one concert seed
 * auditioned across several genres gives that many genuinely different rooms
 * instead of the same dice roll wearing different paint.
 *
 * `id` names the *room*, not the room-and-era: nineteen rooms and seventy-one
 * dressings of them, and the stage builder should have twelve models to write
 * rather than seventy-one. Everything the era changes arrives through `palette`,
 * `props`, `fog` and the size.
 *
 * **That read *four buildings and twelve dressings*, and *four models rather
 * than twelve*, which is now wrong by a factor of five in the direction that
 * matters.** Measured over the registry: nineteen distinct `StageRoom.id`s, 71
 * era dressings between them, and twelve `RoomStyle` members with a builder
 * each — so the saving this sentence describes is no longer twelve-into-four
 * but seventy-one-into-twelve. The numbers are corrected rather than dropped
 * because the sentence is a *ratio* argument and the ratio is the thing that
 * has been vindicated: a `web/concert/rooms/` that had grown one file per
 * dressing would be seventy-one files today.
 *
 * The room comes from the genre and the fallback stays: `GENRES[genre]` is
 * `undefined` for a genre id that does not exist, and a genre that exists and
 * has declared no `staging.room` is the same case as far as this is concerned.
 * Both get the house, which is what "stages badly and obviously" means in
 * practice.
 */
export function chooseVenue(genre: string, era: string, seed: string): Venue {
  const rng = new Rng(`${seed}:venue:${genre}:${era}`);
  const room = GENRES[genre]?.staging?.room ?? HOUSE;
  const dressing = room.eras[era] ?? room.fallback;
  const eraProfile: EraProfile | undefined = GENRES[genre]?.eras[era];

  // The era's props, then the ones that belong to the genre whatever the decade
  // — a tanssilava has bunting strung across the front whether it is 1968 or
  // 1985, and every era table would otherwise have had to repeat it. Before the
  // optional draws, so the certain scenery is always at the front of the list.
  const props: PropName[] = [...dressing.props, ...(room.props ?? [])];
  for (const [prop, chance] of dressing.maybe ?? []) {
    if (rng.chance(chance)) props.push(prop);
  }

  const [growW, growD] = dressing.grow ?? [0, 0];

  return {
    id: room.id,
    /**
     * Which building to put it up as, if the room said. Emitted only when it
     * did — an absent field and the string `'proscenium'` mean the same thing to
     * the renderer, and an IR that spelled out the default would be saying it
     * three times to no reader.
     *
     * *That number was fourteen*, from the days when this file held the room
     * table, and it is worth correcting rather than dropping because it has gone
     * down while the catalogue went up. Measured: nineteen rooms, and only three
     * of them — `pavilion`, `jazz-cellar`, `black-box` — decline to name a
     * building. The elision this line performs used to cover almost every room
     * in the project and now covers three, so what it saves is no longer worth
     * an argument; what it still buys is that `architecture` in a printed IR
     * always means *somebody chose this*, which is the property `roomFor` on the
     * other side is written against.
     */
    ...(room.architecture ? { architecture: room.architecture } : {}),
    label: `${rng.pick(room.names)} · ${eraProfile?.label ?? era}`,
    // Rounded, because the era deltas are decimal fractions and float addition
    // turns 9.6 + 0.3 into 9.900000000000002 — which is harmless arithmetic and
    // an eyesore in a printable IR that people are going to read.
    width: Math.round((room.width + growW) * 100) / 100,
    depth: Math.round((room.depth + growD) * 100) / 100,
    palette: dressing.palette,
    audience: { ...room.audience },
    props: dedupe(props),
    fog: dressing.fog,
  };
}

function dedupe(props: PropName[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of props) {
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}
