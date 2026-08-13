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
import type { DrumSource, DrumVoice } from '../../../core/types.js';
import type { InstrumentId } from '../../../style/instruments.js';

import { trimRest } from '../at-ease.js';

import type {
  Contact, InstrumentBuilder, InstrumentBuildOptions, InstrumentModel,
} from './types.js';

import { buildAccordion } from './accordion.js';
import { buildAcousticGuitar } from './acoustic-guitar.js';
import { buildCello } from './cello.js';
import { buildClarinet } from './clarinet.js';
import { buildDrumkit } from './drumkit.js';
import { buildDulcimer } from './dulcimer.js';
import { machinePanel, type MachineKind } from './drum-machine.js';
import { buildElectricBass } from './electric-bass.js';
import { buildElectricGuitar } from './electric-guitar.js';
import { buildElectricPiano } from './electric-piano.js';
import { buildFlute } from './flute.js';
import { buildGrandPiano } from './grand-piano.js';
import { buildHandDrum } from './hand-drum.js';
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
import { buildVocalGroup } from './vocal-group.js';

export const BUILDERS: Record<Archetype, InstrumentBuilder> = {
  'drumkit': buildDrumkit,
  'handdrum': buildHandDrum,
  'grand-piano': buildGrandPiano,
  'electric-piano': buildElectricPiano,
  'organ': buildOrgan,
  'synth': buildSynth,
  'mallets': buildMallets,
  'dulcimer': buildDulcimer,
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
  // One member's stand, not the group's row: the group is several performers and
  // casting places them. See the note at the top of `vocal-group.ts`.
  'vocal-group': buildVocalGroup,
};

/**
 * Where a catalogue entry sits within its archetype's size range, 0..1.
 *
 * Only families whose members are genuinely different sizes of one object need
 * an entry; everything else is one size and takes the 0.5 default. That was the
 * saxophones and the two double basses, then the mallet row, and it is now the
 * bowed and straight-tube wind families as well — thirty-six catalogue entries
 * arrived at once, and seven of them are the right family at conspicuously the
 * wrong size.
 *
 * This is the other half of the decision `ARCHETYPE_OF` makes. Collapsing four
 * saxophones onto one model is only honest if the model can be four sizes;
 * otherwise a baritone part gets played on an alto and the picture is wrong
 * about an instrument the audience can identify by silhouette.
 *
 * ## What 0 and 1 mean, now that three more families span something
 *
 * The default is 0.5 and it cannot move, which is what fixes both ends: the
 * standard member of each family — the violin, the concert flute, the Bb
 * clarinet — is the one with no entry here and never needs one, so 0.5 *is*
 * that instrument and the ends are the same step below and above it. Every
 * number below is read off the real instruments' lengths rather than chosen by
 * feel, which is what makes the ends nameable:
 *
 *  - **violin** — 0.5 is a full violin, 35.5 cm in the body. 1 is a 16-inch
 *    viola at 40.5 cm, the largest thing this archetype will ever stage; 0 is
 *    the same 15 % the other way, a half-size fiddle nothing casts.
 *  - **flute** — 0 is the piccolo, which is almost exactly half a concert
 *    flute's 67 cm and so lands *on* the end rather than near it. 1 is half
 *    again, the alto and bass flutes the catalogue does not name.
 *  - **clarinet** — both ends are named instruments: 0 is the shehnai at 45 cm
 *    and 1 the english horn at 90 cm, an oboe a fifth lower and so half again
 *    its tube. The Bb clarinet's 66 cm falls within a centimetre of the
 *    midpoint it already had by default, which is the check that the axis is
 *    the right one rather than a scale bent to fit.
 *  - **saxophone** — unchanged. The bassoon does not widen it, and that is the
 *    point of putting it here.
 *
 * Three of those models take `scale` and ignore it today — only `saxophone`,
 * `upright-bass` and `electric-piano` read it, and a viola is still drawn as a
 * violin. Writing the sizes down anyway is deliberate: which member of a family
 * a catalogue entry *is* belongs beside `ARCHETYPE_OF`'s answer to which family
 * it joined, not inside whichever geometry file eventually learns to stretch.
 */
const SCALE_OF: Partial<Record<InstrumentId, number>> = {
  sopranoSax: 0.0,
  altoSax: 0.35,
  tenorSax: 0.6,
  baritoneSax: 1.0,
  // A bassoon is not a saxophone and is staged as one because it is carried
  // like one; at 1.34 m it is a shade taller than a baritone, which is the
  // member `memberFor` snaps this to and the silhouette the borrow was made
  // for. Left at the default it snapped to a tenor instead: 12 cm less body
  // tube, hanging 11 cm higher, which is the wrong end of the family for the
  // one thing about a bassoon that reads from the back of the room.
  bassoon: 1.0,
  // A contrabass is the big one; the jazz upright is the standard size.
  acousticBass: 0.45,
  contrabass: 1.0,
  // Bells and a music box are small; a marimba is the large end of the family.
  glockenspiel: 0.15,
  musicBox: 0.0,
  celesta: 0.2,
  marimba: 0.9,
  tubularBells: 0.8,
  // One size up from the violin every other bowed entry takes by default. A
  // viola is 15 % longer in the body and that is very nearly the whole of what
  // separates the two of them at this distance — which is also why staging a
  // violist on a violin was called the smaller error, and why it is still an
  // error.
  viola: 1.0,
  // The flutes, by speaking length against the concert flute's 67 cm: a piccolo
  // is half of it, and a recorder — the alto in F the catalogue means, held
  // vertically in life and across the face here — about seven tenths.
  piccolo: 0.0,
  recorder: 0.2,
  // The straight-tube reeds, likewise against the Bb clarinet's 66 cm. The
  // shehnai is two thirds of it and the oboe a few centimetres short of it,
  // which is a difference nobody would notice if the three were not standing in
  // the same wind section; the english horn is the one that is unmistakably a
  // different object, and it is the only one of them that changes a silhouette.
  shanai: 0.0,
  oboe: 0.4,
  englishHorn: 1.0,
};

/**
 * Which catalogue entries are rows of *wood*. See `InstrumentBuildOptions.bars`.
 *
 * `SCALE_OF`'s sibling and the same kind of table: which member of a family a
 * catalogue entry is, said beside `ARCHETYPE_OF`'s answer to which family it
 * joined, rather than inside the geometry that eventually reads it. The
 * difference is that `mallets` reads this one today.
 *
 * Partial, and the absent answer is metal — which is the majority and the
 * archetype's own label. The four rows below are the ones where the bar is the
 * instrument:
 *
 *  - **marimba**, **xylophone**, **balafon** — rosewood over tuned tubes, and a
 *    balafon's are gourds. Between them these three are cast by pop, latin,
 *    ambient, house, synth, hiphop, indian, dnb and funk, which is why this is
 *    the cheap half of the mallet problem and the half worth doing first.
 *  - **woodblock** — not a row of bars at all, and staged here because
 *    `ARCHETYPE_OF` had nowhere better; a row of temple blocks is a borrowed
 *    object either way, and borrowing a wooden one is a smaller error than
 *    borrowing an aluminium one.
 *
 * Everything else that lands on `mallets` really is metal — vibraphone bars,
 * glockenspiel bars, tubular bells, a music box comb, kalimba tines, steel
 * pans, timpani heads over copper — or is a drum, and a melodic tom borrows a
 * bar row whatever it is made of.
 */
const BARS_OF: Partial<Record<InstrumentId, 'wood'>> = {
  marimba: 'wood',
  xylophone: 'wood',
  balafon: 'wood',
  woodblock: 'wood',
};

/**
 * The archetypes whose *geometry* moves with `SCALE_OF`, and one catalogue entry
 * per size they actually build.
 *
 * The other half of the paragraph above — "three of those models take `scale`
 * and ignore it today" — written down where something can read it. That sentence
 * was true, correct and inert: it named the three models that stretch, and the
 * model bench, whose whole job is to show every object a model can be asked for,
 * had no way to find them out and so drew every family at its default. A tenor
 * saxophone was the only saxophone anyone had looked at; a soprano is a straight
 * horn 30 cm shorter hanging 28 cm higher, and it had never been on a screen.
 *
 * Names an `InstrumentId` per size rather than a bare number, so a row here goes
 * through `buildInstrumentFor` exactly as the show's does and cannot disagree
 * with `SCALE_OF` about what an alto is. The default member is listed with the
 * rest — an exhibit list is not a diff against a default.
 *
 * **Only where the difference is an object.** `mallets`, `violin`, `flute` and
 * `clarinet` all have several `SCALE_OF` entries and no model that reads one, so
 * a row for the viola would be the violin drawn a second time and would say the
 * bench had looked at something it had not. The day one of them learns to
 * stretch it gains a line here, and the sentence above is the reminder.
 */
export const SIZED_FAMILIES: Partial<Record<Archetype, readonly InstrumentId[]>> = {
  // Four horns across a 0.36–0.66 m body, and the one family where the size is
  // the silhouette: `memberFor` snaps to a named member and the model calls
  // itself after it.
  saxophone: ['sopranoSax', 'altoSax', 'tenorSax', 'baritoneSax'],
  // A uniform ±6 % on the whole instrument, which is the true size difference
  // between a jazz upright and an orchestral contrabass and is deliberately
  // undramatic. It is a branch that has shipped unlooked-at either way.
  'upright-bass': ['acousticBass', 'contrabass'],
  // A light Wurlitzer against a suitcase Rhodes: 3 cm of case, and the keybed —
  // the only thing `resolve` reads — identical between them.
  'electric-piano': ['celesta', 'epiano1'],
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
  /**
   * The auxiliary pieces this number's percussion part calls for.
   *
   * Passed straight through; see `InstrumentBuildOptions.aux` for what it is
   * and why a model is allowed to know it. Omitted means the whole rack, which
   * is what the gallery asks for and what every caller got before this existed.
   */
  aux?: readonly DrumVoice[],
  /**
   * Which drum a hand percussionist is playing, from the rack half of
   * `DrumTrack.bank`.
   *
   * Passed straight through; see `InstrumentBuildOptions.rack`. Omitted means
   * the goblet drum this archetype was built as, which is what the gallery
   * wants and what every caller got before racks existed.
   */
  rack?: string,
): InstrumentModel {
  const build = BUILDERS[performer.archetype];
  const rng = new Rng(`instrument:${performer.id}`);
  // `trimRest` outside `withSoundingContact`, so the bow and the right hand are
  // already routed to whichever contact is theirs before either is corrected —
  // otherwise a guitarist's picking-hand trim would land on the fretting hand's
  // answer. See `REST_TRIM`, and `gallery.ts`, which is where the numbers in it
  // are found.
  return trimRest(withSoundingContact(build({
    seed: rng.int(0, 0xffff),
    scale: (instrumentId ? SCALE_OF[instrumentId] : undefined) ?? 0.5,
    // Metal unless the catalogue entry says otherwise; see `BARS_OF`. Spread
    // rather than passed as a default so a model that has never heard of bars
    // sees the field absent, which is what every other optional here does.
    ...(instrumentId && BARS_OF[instrumentId] ? { bars: BARS_OF[instrumentId] } : {}),
    // A horn is held to a face, and this performer's face is where it is.
    height: performer.look.height,
    // And a drum is played from wherever this performer is sitting. The cast
    // decides that — a hand drum is between the knees of somebody on a chair in
    // a funk band and on the carpet in front of a cross-legged one in a sabhā —
    // so the model is told rather than assuming its archetype's default.
    posture: performer.station.posture,
    ...(finish ? { finish } : {}),
    ...(year !== undefined ? { year } : {}),
    ...(drums === 'electronic-kit' ? { electronic: true } : {}),
    ...(aux ? { aux } : {}),
    ...(rack ? { rack } : {}),
    ...(performer.rig ? { rig: performer.rig } : {}),
    ...(performer.boards ? { boards: performer.boards } : {}),
    ...(machine ? { machine } : {}),
  })));
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
  /**
   * Which object it is, because the two sizes have their panels in different
   * places.
   *
   * A preset box is 34 cm wide and 21 deep; a programmable one is 50 by 30. The
   * row therefore sits 4.5 cm further from the player on the larger case and is
   * 16 cm longer, and a hand aimed with the wrong one lands off the end of the
   * row or on the lid behind it.
   */
  kind: MachineKind;
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
     * — and the panel's own `z` puts the hand on the *front* row rather than in
     * the middle of the case, which is 7 cm and the difference between a finger
     * on a button and a palm on a lid.
     */
    const cos = Math.cos(panel.yaw);
    const sin = Math.sin(panel.yaw);
    const along = new Vector3(cos, 0, -sin);
    const fwd = new Vector3(sin, 0, cos);
    const box = machinePanel(panel.kind);
    const off = (0.5 - Math.max(0, Math.min(1, point.at))) * box.w;
    return {
      position: new Vector3(
        panel.x + along.x * off + fwd.x * box.z,
        panel.y + box.y,
        panel.z + along.z * off + fwd.z * box.z,
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
 * interface now carries `effector`, and **the fourteen models that have only
 * one answer** — a drum is struck where it is struck — go on ignoring it.
 *
 * That count is nine. It is not the twenty-four less these eight, because the
 * wind and brass models went and grew a second answer of their own: accordion,
 * harmonica, trumpet, trombone, saxophone, clarinet and flute all take
 * `effector` in `resolve` directly, one hand supporting the instrument and the
 * other fingering it. Probed by calling every model's `resolve` over every point
 * its archetype declares, under each effector, the nine that answer the same
 * thing to all of them are drumkit, handdrum, grand-piano, electric-piano,
 * organ, synth, mallets, singer and vocal-group.
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
