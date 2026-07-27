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
 * genre decides which of three rooms it is, because a genre is a place before it
 * is a set of chords. The era decides what colour the paint is and what the
 * lights are made of, which is exactly the distinction the era tables already
 * draw everywhere else in this project — `EraProfile` decides the production,
 * never the notes.
 *
 * ## The prop vocabulary is a contract
 *
 * `Venue.props` is typed `string[]` in the frozen contract, which is right —
 * the IR should stay printable and a renderer should be able to ignore a prop
 * it has not modelled yet. But two systems have to agree on the spelling or the
 * agreement is silent and wrong: this file emits the names and
 * `web/concert/stage.ts` places them. The full vocabulary is therefore declared
 * here as a union and exported as `PROPS`, so the stage builder can switch
 * exhaustively over it and a prop invented in a hurry is a compile error rather
 * than a piece of scenery that never appears.
 *
 * **Two props are furniture a performer stands at, and are therefore owned
 * twice.** `riser` and `gear-table` are placed by the stage builder, while
 * `cast.ts` independently decides where the drummer sits and where the ambient
 * players perch. If the two disagree the kit floats and the synths are behind
 * nothing. `riser` is reconciled: its size, height and position are fixed
 * constants shared by both files, and `cast.ts` pins the drummer inside them.
 * `gear-table` is **not** reconciled — the stage places it wherever it places
 * it, and nothing tells it where the `perch` stations ended up. That is a real
 * seam and it is flagged here rather than papered over.
 *
 * Nothing else a player touches is a prop. No microphone stand, no music
 * stands, no instruments: those belong to the instrument models, which know
 * where the hands go.
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
 */

import { Rng } from '../core/rng.js';
import { GENRES } from '../genre/index.js';
import type { EraProfile } from '../style/types.js';
import type { Venue } from './types.js';

// ---------------------------------------------------------------------------
// The prop vocabulary
// ---------------------------------------------------------------------------

/**
 * Every piece of set dressing this file can ask for.
 *
 * **This list is not ours alone.** `web/concert/stage.ts` is the thing that
 * places these, and it recognises exactly these twenty-nine names (matched
 * case-, space- and plural-insensitively, so near-misses resolve). A name
 * outside the list is silently ignored — which is a safe failure and a useless
 * one, so the union below *is* the stage's vocabulary rather than a wish list
 * that happens to overlap with it. Declaring it as a type means a prop invented
 * in a hurry fails `npm run typecheck` instead of quietly never appearing.
 *
 * Four of them change how the room is *built* rather than adding an object, and
 * are emitted deliberately, one per room:
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
 * The club:
 *   `tables`          small round tables, right up to the stage
 *   `candles`         one per table, and the only warm light in a cellar
 *   `low-ceiling`     a lid a metre above the players' heads
 *   `bar`             bottles on shelves, lit from behind
 *   `posters`         past bills pasted on the wall
 *   `rug`             a worn rug under the gear or the front line
 *
 * The black box:
 *   `projection`      a lit rectangle upstage; ambient's only scenery
 *   `gear-table`      the trestle the electronics sit on
 *   `flight-case`     the boxes it all arrived in, still on stage
 *   `cables`          gaffered runs across the boards
 *   `drapes`          black masking where a wall would be
 *
 * Any stage:
 *   `pa-stack`        speakers, flown or on poles
 *   `wedges`          floor monitors facing the band
 *   `riser`           the drum platform. See `cast.ts` — its size and height
 *                     are fixed, and `Station.riser` has to agree with them.
 */
export type PropName =
  // Room modifiers
  | 'open-air' | 'brick' | 'black-box' | 'haze'
  // Pavilion
  | 'bunting' | 'fairy-lights' | 'paper-lanterns' | 'moths' | 'birch' | 'lake'
  | 'flowers' | 'railing' | 'dance-floor' | 'mirror-ball' | 'chandelier'
  // Club
  | 'tables' | 'candles' | 'low-ceiling' | 'bar' | 'posters' | 'rug'
  // Black box
  | 'projection' | 'gear-table' | 'flight-case' | 'cables' | 'drapes'
  // Any stage
  | 'pa-stack' | 'wedges' | 'riser';

/** The vocabulary as data, for an exhaustive switch on the renderer side. */
export const PROPS: readonly PropName[] = [
  'open-air', 'brick', 'black-box', 'haze',
  'bunting', 'fairy-lights', 'paper-lanterns', 'moths', 'birch', 'lake',
  'flowers', 'railing', 'dance-floor', 'mirror-ball', 'chandelier',
  'tables', 'candles', 'low-ceiling', 'bar', 'posters', 'rug',
  'projection', 'gear-table', 'flight-case', 'cables', 'drapes',
  'pa-stack', 'wedges', 'riser',
];

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

/**
 * What an era does to a room.
 *
 * One of these per genre-era pair, plus a fallback per room. Everything an era
 * touches is here so the differences between two decades of the same room can
 * be read side by side, which is the only way to tell whether they are actually
 * different.
 */
interface Dressing {
  palette: Venue['palette'];
  /** Always present. */
  props: PropName[];
  /** Present with the given probability. Where the room stops being a diagram. */
  maybe?: (readonly [PropName, number])[];
  fog: number;
  /** Added to the room's base size, in metres. Later eras built bigger stages. */
  grow?: readonly [number, number];
}

interface Room {
  id: string;
  /** Names the room can have. The label is where the era shows in words. */
  names: string[];
  width: number;
  depth: number;
  audience: Venue['audience'];
  eras: Record<string, Dressing>;
  fallback: Dressing;
}

/**
 * THE PAVILION — iskelmä.
 *
 * A Finnish tanssilava: a roofed wooden dance floor at the edge of a lake, open
 * on all sides, hot in July and full of insects. The audience is *dancing*,
 * which is the single most important fact about this room and the reason
 * `seated` is false — a tanssilava crowd facing the band in rows would be a
 * different kind of evening entirely.
 */
const PAVILION: Room = {
  id: 'pavilion',
  names: ['Koivulahti', 'Kesäranta', 'Kaislaranta', 'Peurasaari', 'Ilolahti', 'Sorsaniemi'],
  width: 10, depth: 6,
  audience: { rows: 10, density: 0.82, seated: false },
  eras: {
    // 1960s–70s. Painted cream timber, tungsten everything, and the beams full
    // of moths — which are not decoration. A warm lamp outdoors at midnight in
    // July has insects in it, and their absence is one of those things nobody
    // can name but everybody notices.
    tanssilava: {
      palette: {
        boards: '#c99b5c',
        backdrop: '#1b2a45',
        curtain: '#8f2f2c',
        proscenium: '#e8dfc8',
        ambient: '#ffd9a0',
      },
      props: [
        'open-air', 'birch', 'lake', 'railing', 'dance-floor',
        'fairy-lights', 'paper-lanterns', 'moths', 'riser',
      ],
      maybe: [['flowers', 0.6], ['chandelier', 0.2]],
      fog: 0.1,
    },
    // 1980s. The same building, re-varnished, with a mirror ball bolted to the
    // roof beams and a par can rig that arrived on a trailer. The era's own
    // tables say `keyChangeChance: 0.7` and `density: 0.78`; this is what that
    // sounds like as a room.
    eighties: {
      palette: {
        boards: '#a9793f',
        backdrop: '#141d33',
        curtain: '#a8246b',
        proscenium: '#d9d2c2',
        ambient: '#ffcf9a',
      },
      props: [
        'open-air', 'birch', 'lake', 'railing', 'dance-floor',
        'fairy-lights', 'mirror-ball', 'moths', 'riser', 'pa-stack', 'wedges',
      ],
      maybe: [['flowers', 0.3], ['haze', 0.4]],
      fog: 0.16,
      grow: [0.6, 0.3],
    },
  },
  fallback: {
    palette: {
      boards: '#c08a4e', backdrop: '#1b2a45', curtain: '#8f2f2c',
      proscenium: '#e0d6c0', ambient: '#ffd6a0',
    },
    props: ['open-air', 'birch', 'lake', 'dance-floor', 'fairy-lights', 'moths', 'riser'],
    fog: 0.12,
  },
};

/**
 * THE CELLAR — jazz.
 *
 * Low, brick, and smaller than the band deserves. Tables right up to the stage
 * and candles on them, which is the only warm light in the room and therefore
 * the thing the whole palette is built around. Smoke is `fog`, not a prop: it
 * is a volume the beams pass through, and the beams are what a jazz room is
 * for.
 */
const CELLAR: Room = {
  id: 'jazz-cellar',
  names: ['The Blue Alcove', 'Cellar Nine', 'Club Meridian', 'The Ivy Room', 'The Vault', 'Room Twelve'],
  width: 8.8, depth: 5.4,
  audience: { rows: 6, density: 0.86, seated: true },
  eras: {
    // 1930s–40s. Gilt, burgundy and tungsten; the one era here that still has
    // some money in the room.
    swingera: {
      palette: {
        boards: '#5b4632',
        backdrop: '#4a2b23',
        curtain: '#5c1a1f',
        proscenium: '#b08a3e',
        ambient: '#ffb46b',
      },
      props: [
        'low-ceiling', 'brick', 'tables', 'candles', 'bar', 'haze',
        'chandelier', 'riser',
      ],
      maybe: [['posters', 0.5], ['rug', 0.3]],
      fog: 0.32,
    },
    // 1950s–60s. Darker, smokier, and stripped of the gilt. Bop happened in
    // rooms nobody had decorated since the war.
    bop: {
      palette: {
        boards: '#4a3b2c',
        backdrop: '#3d2a26',
        curtain: '#4a1520',
        proscenium: '#8f7238',
        ambient: '#ffc07a',
      },
      props: [
        'low-ceiling', 'brick', 'tables', 'candles', 'bar', 'haze',
        'posters', 'riser',
      ],
      maybe: [['rug', 0.4], ['flight-case', 0.25]],
      fog: 0.42,
    },
    // 1960s–70s. Cooler and greyer, hard-edged par cans, and the smoke starts
    // to thin because the room is now a listening room rather than a bar.
    modern: {
      palette: {
        boards: '#3f3a33',
        backdrop: '#33302c',
        curtain: '#2e3a3a',
        proscenium: '#6f6a5e',
        ambient: '#ffd0a0',
      },
      props: [
        'low-ceiling', 'brick', 'tables', 'candles', 'bar', 'posters',
        'rug', 'riser', 'wedges',
      ],
      maybe: [['haze', 0.6], ['pa-stack', 0.4]],
      fog: 0.3,
      grow: [0.4, 0.2],
    },
  },
  fallback: {
    palette: {
      boards: '#4a3b2c', backdrop: '#3d2a26', curtain: '#4a1520',
      proscenium: '#8f7238', ambient: '#ffc07a',
    },
    props: ['low-ceiling', 'brick', 'tables', 'candles', 'bar', 'haze', 'riser'],
    fog: 0.35,
  },
};

/**
 * THE BLACK BOX — ambient.
 *
 * No architecture, no proscenium worth the name, and more fog than person. The
 * audience is seated on folding chairs and there is nothing to look at except a
 * projection and whatever the haze is doing, which is the point: a genre that
 * refuses to have a foreground gets a room that refuses to have a focus.
 *
 * The palette is nearly monochrome on purpose. Every other room here spends its
 * colour budget on the set; this one spends all of it on the light, because in
 * a black box the light *is* the set.
 */
const BLACK_BOX: Room = {
  id: 'black-box',
  names: ['Studio B', 'Hall Four', 'The Annexe', 'Unit 9', 'The Long Room', 'Room 000'],
  width: 9.6, depth: 6.4,
  audience: { rows: 8, density: 0.46, seated: true },
  eras: {
    // 1970s–80s tape. Warm even in the dark — sepia, tungsten, a domestic lamp
    // somebody brought from home. This is the one ambient era with a *colour*.
    tape: {
      palette: {
        boards: '#2a2724',
        backdrop: '#191b1e',
        curtain: '#241f1b',
        proscenium: '#2c2f33',
        ambient: '#c9a37a',
      },
      props: [
        'black-box', 'drapes', 'projection', 'gear-table', 'cables',
        'flight-case', 'rug',
      ],
      maybe: [['pa-stack', 0.5]],
      fog: 0.68,
    },
    // 1990s sampler. Cold cyan, hard beams, and the most fog of anywhere in the
    // project. This is the Fallout end of the genre — the era whose own effects
    // table filters the drum kit down to 1.4 kHz so the beat arrives through a
    // wall, and the room should agree with that.
    sampler: {
      palette: {
        boards: '#232528',
        backdrop: '#14171b',
        curtain: '#1a1f26',
        proscenium: '#2a2f36',
        ambient: '#7fa8c8',
      },
      props: [
        'black-box', 'projection', 'gear-table', 'cables', 'flight-case',
        'pa-stack', 'wedges', 'haze',
      ],
      maybe: [['drapes', 0.35]],
      fog: 0.85,
    },
    // 2000s hybrid. Grey, even, and clean — flat LED light on a room with
    // nothing in it. The era where the sources became real instruments again,
    // so the room stops pretending to be a machine.
    hybrid: {
      palette: {
        boards: '#26262a',
        backdrop: '#17181b',
        curtain: '#1e2024',
        proscenium: '#31333a',
        ambient: '#9aa6b2',
      },
      props: [
        'black-box', 'drapes', 'projection', 'gear-table', 'cables', 'rug',
      ],
      maybe: [['flight-case', 0.4], ['pa-stack', 0.3]],
      fog: 0.72,
      grow: [0.3, 0.2],
    },
  },
  fallback: {
    palette: {
      boards: '#26262a', backdrop: '#17181b', curtain: '#1e2024',
      proscenium: '#31333a', ambient: '#9aa6b2',
    },
    props: ['black-box', 'drapes', 'projection', 'gear-table', 'cables'],
    fog: 0.7,
  },
};

/**
 * THE HOUSE — anything else.
 *
 * A plain proscenium theatre for a genre this file has never heard of. It
 * exists so that adding a genre stages *badly* rather than crashing, and it is
 * deliberately dull: a fourth room that looked good would be a reason not to
 * write the third one properly.
 */
const HOUSE: Room = {
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

const ROOMS: Record<string, Room> = {
  iskelma: PAVILION,
  jazz: CELLAR,
  ambient: BLACK_BOX,
};

// ---------------------------------------------------------------------------

/**
 * Pick the room.
 *
 * Deterministic in `seed`: the same concert always plays the same venue with
 * the same optional dressing in it. The genre and era are folded into the
 * stream tag rather than into the seed itself so that one concert seed
 * auditioned across three genres gives three genuinely different rooms instead
 * of the same dice roll wearing different paint.
 *
 * `id` names the *room*, not the room-and-era: there are three buildings here
 * and nine dressings of them, and the stage builder should have three models to
 * write rather than nine. Everything the era changes arrives through `palette`,
 * `props`, `fog` and the size.
 */
export function chooseVenue(genre: string, era: string, seed: string): Venue {
  const rng = new Rng(`${seed}:venue:${genre}:${era}`);
  const room = ROOMS[genre] ?? HOUSE;
  const dressing = room.eras[era] ?? room.fallback;
  const eraProfile: EraProfile | undefined = GENRES[genre]?.eras[era];

  const props: PropName[] = [...dressing.props];
  // Bunting is the one prop that belongs to the *genre* rather than to either
  // era of it: a tanssilava has pennants strung across the front whether it is
  // 1968 or 1985, and the eighties table would otherwise have had to repeat it.
  if (room === PAVILION) props.push('bunting');
  for (const [prop, chance] of dressing.maybe ?? []) {
    if (rng.chance(chance)) props.push(prop);
  }

  const [growW, growD] = dressing.grow ?? [0, 0];

  return {
    id: room.id,
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
