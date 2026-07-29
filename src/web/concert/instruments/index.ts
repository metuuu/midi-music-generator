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

import { Vector3 } from 'three';

import { Rng } from '../../../core/rng.js';
import { ARCHETYPE_OF } from '../../../concert/instruments.js';
import type { Archetype, Effector, PlayPoint, Performer } from '../../../concert/types.js';
import type { DrumSource } from '../../../core/types.js';
import type { InstrumentId } from '../../../style/instruments.js';

import type {
  Contact, InstrumentBuilder, InstrumentBuildOptions, InstrumentModel,
} from './types.js';

import { buildAccordion } from './accordion.js';
import { buildAcousticGuitar } from './acoustic-guitar.js';
import { buildCello } from './cello.js';
import { buildClarinet } from './clarinet.js';
import { buildDrumkit } from './drumkit.js';
import { MACHINE_PANEL_W, MACHINE_PANEL_Y, MACHINE_PANEL_Z } from './drum-machine.js';
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
  /**
   * What is producing the percussion, where this performer is the drummer.
   *
   * Only two of the four values reach here at all — the other two have no
   * drummer, so there is no performer to build an instrument for. See
   * `InstrumentBuildOptions.electronic`.
   */
  drums?: DrumSource,
  /** A machine mounted inside this instrument. See `StageMachine.mount`. */
  machine?: InstrumentBuildOptions['machine'],
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
    ...(drums === 'electronic-kit' ? { electronic: true } : {}),
    ...(performer.rig ? { rig: performer.rig } : {}),
    ...(performer.boards ? { boards: performer.boards } : {}),
    ...(machine ? { machine } : {}),
  }));
}

/**
 * Where a machine this player works is standing, in their instrument's frame.
 *
 * Four numbers rather than a matrix because that is all a yaw on a flat stage
 * is, and because the thing consuming it is a contact — a position and two
 * directions — not a transform.
 */
export interface MachinePanel {
  /** The top of the machine's stand, in the model's own local metres. */
  x: number;
  y: number;
  z: number;
  /** The machine's yaw *relative to the model's*, in radians. */
  yaw: number;
}

/**
 * Send this player's panel touches to the machine standing beside them.
 *
 * `resolve` answers in the model's own frame and the models are, correctly,
 * ignorant of everything that is not them — so a synthesiser asked where a
 * `control` point is answers with its own knob row, which is exactly right when
 * the player is sweeping their own filter and exactly wrong when they are
 * starting a drum machine. It used to be neither: the box was bolted to the
 * back of the same rig, so the panel row was a few centimetres from the machine
 * and the hand arriving there read as close enough. On a stand at the player's
 * right hand it is most of a metre away, and a hand pressing start on the wrong
 * object is worse than no hand at all — it is the stage asserting a cause that
 * plainly is not one.
 *
 * So the show, which is the only thing that knows where both objects ended up,
 * hands over the machines' positions in this model's frame and the `control`
 * points that name one are answered here. Everything else — including a bay,
 * which genuinely *is* on the player's own rig — falls through untouched.
 *
 * Wrapping rather than a build option, for the same reason `withSoundingContact`
 * wraps: the answer depends on where the model was finally stood, which is not
 * known when it is built. `resolve`'s contract survives — this is pure, cheap,
 * and constant for the life of the number.
 */
export function aimMachineControls(
  model: InstrumentModel, panels: readonly (MachinePanel | undefined)[],
): InstrumentModel {
  if (!panels.some(Boolean)) return model;
  const inner = model.resolve.bind(model);
  model.resolve = (point, effector) => {
    if (point.kind !== 'control' || point.machine === undefined) {
      return inner(point, effector);
    }
    const panel = panels[point.machine];
    if (!panel) return inner(point, effector);
    /**
     * The box's own axes, turned into the model's frame, and the row's own
     * offset along them.
     *
     * `at` runs the way it does on a keyboard's panel — 0 at one end of the row
     * — and `MACHINE_PANEL_Z` puts the hand on the *front* row rather than in
     * the middle of the case, which is 7 cm and the difference between a finger
     * on a button and a palm on a lid.
     */
    const cos = Math.cos(panel.yaw);
    const sin = Math.sin(panel.yaw);
    const along = new Vector3(cos, 0, -sin);
    const fwd = new Vector3(sin, 0, cos);
    const off = (0.5 - Math.max(0, Math.min(1, point.at))) * MACHINE_PANEL_W;
    return {
      position: new Vector3(
        panel.x + along.x * off + fwd.x * MACHINE_PANEL_Z,
        panel.y + MACHINE_PANEL_Y,
        panel.z + along.z * off + fwd.z * MACHINE_PANEL_Z,
      ),
      normal: new Vector3(0, 1, 0),
      along,
    };
  };
  return model;
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
