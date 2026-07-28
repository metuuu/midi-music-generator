/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The registry: archetype → the thing that builds one.
 *
 * `Record<Archetype, InstrumentBuilder>` rather than a lookup with a default,
 * for the same reason `ARCHETYPE_OF` is a total record over the catalogue: a
 * missing model should be a compile error, not a grey box that survives review
 * because it looks deliberate.
 */

import { Rng } from '../../../core/rng.js';
import { ARCHETYPE_OF } from '../../../concert/instruments.js';
import type { Archetype, Effector, PlayPoint, Performer } from '../../../concert/types.js';
import type { InstrumentId } from '../../../style/instruments.js';

import type { Contact, InstrumentBuilder, InstrumentModel } from './types.js';

import { buildAccordion } from './accordion.js';
import { buildAcousticGuitar } from './acoustic-guitar.js';
import { buildCello } from './cello.js';
import { buildClarinet } from './clarinet.js';
import { buildDrumkit } from './drumkit.js';
import { buildElectricBass } from './electric-bass.js';
import { buildElectricGuitar } from './electric-guitar.js';
import { buildElectricPiano } from './electric-piano.js';
import { buildFlute } from './flute.js';
import { buildGrandPiano } from './grand-piano.js';
import { buildHarmonica } from './harmonica.js';
import { buildHarp } from './harp.js';
import { buildMallets } from './mallets.js';
import { buildOrgan } from './organ.js';
import { buildSaxophone } from './saxophone.js';
import { buildSinger } from './singer.js';
import { buildSitar } from './sitar.js';
import { buildSynth } from './synth.js';
import { buildTrombone } from './trombone.js';
import { buildTrumpet } from './trumpet.js';
import { buildUprightBass } from './upright-bass.js';
import { buildViolin } from './violin.js';

export const BUILDERS: Record<Archetype, InstrumentBuilder> = {
  'drumkit': buildDrumkit,
  'grand-piano': buildGrandPiano,
  'electric-piano': buildElectricPiano,
  'organ': buildOrgan,
  'synth': buildSynth,
  'mallets': buildMallets,
  'accordion': buildAccordion,
  'harmonica': buildHarmonica,
  'acoustic-guitar': buildAcousticGuitar,
  'electric-guitar': buildElectricGuitar,
  'upright-bass': buildUprightBass,
  'electric-bass': buildElectricBass,
  'violin': buildViolin,
  'cello': buildCello,
  'harp': buildHarp,
  'sitar': buildSitar,
  'trumpet': buildTrumpet,
  'trombone': buildTrombone,
  'saxophone': buildSaxophone,
  'clarinet': buildClarinet,
  'flute': buildFlute,
  'singer': buildSinger,
};

/**
 * Where a catalogue entry sits within its archetype's size range, 0..1.
 *
 * Only families whose members are genuinely different sizes of one object need
 * an entry — which, in this catalogue, is the saxophones and the two double
 * basses. Everything else is one size and takes the 0.5 default.
 *
 * This is the other half of the decision `ARCHETYPE_OF` makes. Collapsing four
 * saxophones onto one model is only honest if the model can be four sizes;
 * otherwise a baritone part gets played on an alto and the picture is wrong
 * about an instrument the audience can identify by silhouette.
 */
const SCALE_OF: Partial<Record<InstrumentId, number>> = {
  sopranoSax: 0.0,
  altoSax: 0.35,
  tenorSax: 0.6,
  baritoneSax: 1.0,
  // A contrabass is the big one; the jazz upright is the standard size.
  acousticBass: 0.45,
  contrabass: 1.0,
  // Bells and a music box are small; a marimba is the large end of the family.
  glockenspiel: 0.15,
  musicBox: 0.0,
  celesta: 0.2,
  marimba: 0.9,
  tubularBells: 0.8,
};

/**
 * Build the instrument this performer plays.
 *
 * The seed is derived from the performer id rather than passed in, so two
 * guitarists on one stage get different finishes and the same guitarist gets
 * the same guitar every time the show is replayed. Nothing `resolve()` reads
 * may vary with it — that is the models' contract, and the reason the
 * choreography can be computed without ever seeing the geometry.
 */
export function buildInstrumentFor(
  performer: Performer, instrumentId?: InstrumentId, finish?: string, year?: number,
): InstrumentModel {
  const build = BUILDERS[performer.archetype];
  const rng = new Rng(`instrument:${performer.id}`);
  return withSoundingContact(build({
    seed: rng.int(0, 0xffff),
    scale: (instrumentId ? SCALE_OF[instrumentId] : undefined) ?? 0.5,
    // A horn is held to a face, and this performer's face is where it is.
    height: performer.look.height,
    ...(finish ? { finish } : {}),
    ...(year !== undefined ? { year } : {}),
  }));
}

/** Effectors that *sound* a note rather than stopping it. */
const SOUNDING: ReadonlySet<Effector> = new Set<Effector>(['right-hand', 'bow']);

/**
 * A model that answers separately for the stopping hand and the sounding hand.
 *
 * The string models grew this the moment they were built, and they were right
 * to: one `PlayPoint` describes a note, and a note on a string instrument
 * happens in two places at once. A guitarist frets at the ninth fret and picks
 * over the soundhole; a violinist stops on the fingerboard and bows at the
 * bridge. `InstrumentModel.resolve` originally had nowhere to put that, so the
 * eight of them exposed `soundingContact()` alongside the interface instead.
 *
 * Adapting here rather than in each model is the cheaper half of the fix: the
 * interface now carries `effector`, and the fourteen models that have only one
 * answer — a drum is struck where it is struck — go on ignoring it.
 */
interface HasSoundingContact {
  soundingContact(point: PlayPoint): Contact | undefined;
}

function withSoundingContact(model: InstrumentModel): InstrumentModel {
  const sounding = (model as Partial<HasSoundingContact>).soundingContact;
  if (typeof sounding !== 'function') return model;

  const stopping = model.resolve.bind(model);
  const soundingBound = sounding.bind(model);
  model.resolve = (point, effector) => (
    effector && SOUNDING.has(effector)
      ? soundingBound(point) ?? stopping(point)
      : stopping(point)
  );
  return model;
}

/** Every archetype some catalogue entry actually maps to. */
export function reachableArchetypes(): Set<Archetype> {
  return new Set(Object.values(ARCHETYPE_OF));
}
