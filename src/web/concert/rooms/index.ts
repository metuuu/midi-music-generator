/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The registry: architecture → the thing that builds one.
 *
 * `Record<RoomStyle, RoomBuilder>` rather than a lookup with a default, for the
 * same reason `BUILDERS` in `../instruments/index.ts` is a total record over
 * the archetypes and `BUILDERS` in `../stage-props.ts` is a total record over
 * `PROPS`: a style named upstream with no builder here should be a compile
 * error naming this file, not a room that quietly comes up a proscenium and
 * survives review because it looks deliberate.
 *
 * ## Why the union is upstream and the record is here
 *
 * `RoomStyle` lives in `concert/types.ts` beside `Venue`, and the direction was
 * the only one available. `concert/` is the IR and `web/concert/` renders it,
 * so the vocabulary may not depend on the thing that draws it — the same
 * argument `venue.ts` makes at length about `PropName`, and the same one
 * `genre/types.ts` makes about borrowing `HairStyle`, `Fabric` and `Accessory`
 * rather than restating them. A genre author picks a style from a union the
 * compiler understands; the compiler then requires a builder here for it.
 * Adding an architecture is a two-file change by construction and the compiler
 * names the second file.
 *
 * ## Why the *venue* carries it and not the room id
 *
 * A room could have been looked up by `Venue.id` — the ids are stable, unique
 * and already used as RNG tags, and it would have cost no new field anywhere.
 * It is the wrong key for the reason `ARCHETYPE_OF` exists: sixty catalogue
 * instruments collapse onto twenty-two models because a tenor and a baritone
 * saxophone are one object at two sizes, and fourteen rooms will collapse the
 * same way. A `ballroom`, a `dancehall` and a `salon` are one big room with a
 * floor in it; a `riihi` and a `shed` are one long roof. Keying on the room id
 * would mean writing that room three times or importing one room into another,
 * and the second is how a directory of parallel authors turns back into a file
 * they all have to edit.
 *
 * So `StageRoom.id` is the catalogue entry and `StageRoom.architecture` is the
 * archetype, exactly as `InstrumentId` is to `Archetype`.
 *
 * ## Adding one
 *
 * Four steps, and nobody else's file is touched by any of them:
 *
 *  1. add the name to `RoomStyle` in `concert/types.ts`;
 *  2. write `rooms/<name>.ts` exporting a `RoomBuilder` — `shape()` and
 *     `build()`, and read `./types.ts` in full first, especially the shadow
 *     policy and the RNG tag namespace;
 *  3. add the one line below;
 *  4. name it from the genre's `StageRoom.architecture`.
 *
 * Step 3 is the only line in this directory two authors could collide on, and
 * it is one line at the end of an object literal.
 */

import type { RoomStyle } from '../../../concert/types.js';

import { ballroom } from './ballroom.js';
import { circuit } from './circuit.js';
import { concertHall } from './concert-hall.js';
import { courtyard } from './courtyard.js';
import { dancehall } from './dancehall.js';
import { hall } from './hall.js';
import { lawn } from './lawn.js';
import { proscenium } from './proscenium.js';
import { riihi } from './riihi.js';
import { sabha } from './sabha.js';
import { salon } from './salon.js';
import { shed } from './shed.js';
import type { RoomBuilder } from './types.js';

export const ROOMS: Record<RoomStyle, RoomBuilder> = {
  proscenium,
  courtyard,
  'concert-hall': concertHall,
  riihi,
  circuit,
  sabha,
  dancehall,
  shed,
  lawn,
  salon,
  hall,
  ballroom,
};

/**
 * The room this venue is in, or the proscenium.
 *
 * `Venue.architecture` is `string | undefined` rather than `RoomStyle` — the IR
 * is `string[]` for props for the same reason and this file falls back the same
 * way `readProps` ignores a prop it has never heard of. A concert can arrive
 * from a file, and a room name this build does not have is a room it should
 * stage badly and obviously in rather than throw on halfway through a show.
 *
 * Absent means the proscenium, and that is the load-bearing half: it is what
 * makes thirteen rooms and every genre added in a hurry keep working without
 * anyone naming anything.
 */
export function roomFor(architecture: string | undefined): RoomBuilder {
  if (architecture && architecture in ROOMS) {
    return ROOMS[architecture as RoomStyle];
  }
  return proscenium;
}

export { prosceniumShape, skyDome } from './proscenium.js';
export { noCurtain } from './types.js';
export type {
  RoomBuilder, RoomContext, RoomDatum, RoomRig, RoomShape,
} from './types.js';
