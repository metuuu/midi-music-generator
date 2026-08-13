/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * The model bench — every instrument, on its own, where you can see it.
 *
 * This page exists because of a gap that only became obvious once the concert
 * ran: twenty-two instrument models were built, verified against geometric
 * assertions, and shipped — and the only way to *look* at any of them was to
 * start a concert, wait for a band that happened to include one, and hope the
 * camera cut to it. A trumpet whose bell pointed at the ceiling survived that
 * process for as long as no show happened to feature a trumpet in a close shot.
 *
 * Assertions catch what you thought to assert. A bench catches the rest, and it
 * takes about a minute to check every exhibit here against a minute *each* in a
 * running show, with no guarantee of ever seeing some of them.
 *
 * Nothing on this page is part of the concert. It goes through
 * `buildInstrumentFor` — the same entry point `show.ts` uses, not the raw
 * builder behind it — so what you see is what the show gets, down to the
 * sounding-hand wrapper and the horn sized to this player's face.
 *
 * ## An archetype is not an object
 *
 * The list used to be `Object.keys(ARCHETYPES)`, which reads as "everything"
 * and is not: several archetypes build genuinely different objects depending on
 * what was decided *before* the renderer was called, and enumerating archetypes
 * shows one of each and hides the rest. A synthesiser is a modular wall, a
 * polysynth or a digital slab depending on `Performer.rig`; a kit is drums or
 * pads depending on the number's `DrumSource`; a hand drum is a goblet drum, a
 * set of congas or a mridangam depending on `DrumTrack.bank`, at either of two
 * heights depending on whether the tradition sits on the floor; a saxophone is
 * one of four horns depending on which catalogue entry was cast.
 *
 * The machines are missing for a blunter reason: they have no performer, so
 * `buildInstrumentFor` is not the way in and no amount of archetype
 * enumeration would ever have reached them. They are built here the way
 * `show.ts` builds them, from their own entry point.
 *
 * So the unit of this page is an *exhibit* — one buildable object — and the
 * archetype is only one of the things that decides which.
 *
 * The same argument reaches past the rig id, which is why the synthesiser now
 * takes several rows on the grid rather than three. A digital slab with a
 * second board over it is not the same object as a slab: the upper case, its
 * stand and the arm that carries it are geometry that exists only when
 * `Performer.boards` is 2, and the bench could not be made to draw any of it. A
 * modular is the same story three times over — a tier and two toed-in wings —
 * and a modular with the band's rhythm machine *in* it has a faceplate no other
 * exhibit here has. Every one of those is built by a branch that shipped
 * unseen, which is the exact gap this page was made for.
 *
 * Where a variant is reachable on a real stage and where it is only buildable
 * is worth keeping straight, and the bench deliberately does not: it shows what
 * the models can be asked for. A player is capped at two lines today, so
 * `cast.ts` never asks for a third or fourth board — while `SYNTH_RIGS.modular`
 * says four, because four is what a frame holds. The wings are drawn either
 * way, and a wing nobody has ever looked at is worse than a wing nobody stages.
 *
 * ## Why this keeps going stale, and what is done about it
 *
 * It has now gone wrong three times in the same shape. A model grows a branch on
 * a build option — `rig`, then `boards`, then `rack` and `posture` — the branch
 * is argued for at length in the model's own header, and nothing brings it here,
 * because `entries()` is a list and a list does not fail. The last round shipped
 * a mridangam whose shell was inside-out and whose two ends were swapped, a
 * fault visible in the first second of looking at it, on an object no exhibit
 * could be made to draw.
 *
 * So the axes below are **read out of the tables that define them** rather than
 * transcribed: `SHAPE_OF` in `hand-drum.ts` for which drums exist,
 * `SIZED_FAMILIES` in `instruments/index.ts` for which families stretch,
 * `SYNTH_RIGS[rig].maxBoards` for how many keyboards a frame holds. A fourth
 * rack, or a fifth saxophone, is an exhibit the day it is one.
 *
 * What no table knows is *which option a model reads at all*, so that part is
 * still hand-written and the rule for the next person is the short one: **a
 * model that learns to branch on an `InstrumentBuildOptions` field owes this
 * page a way to enumerate it.** `SIZED_FAMILIES` is that debt paid for `scale`,
 * and it is deliberately next to `SCALE_OF` rather than here.
 *
 * The player can be put in either of the two poses that matter: waiting at the
 * instrument, and playing it. Both come from the model's own `resolve`, so a
 * hand that lands in the wrong place here lands in the wrong place on stage.
 */

import {
  AgXToneMapping, AmbientLight, AxesHelper, Box3, Color, CylinderGeometry,
  DirectionalLight, Euler, Group, GridHelper, Matrix4, Mesh, MeshBasicMaterial,
  Object3D, PCFSoftShadowMap, PerspectiveCamera, Quaternion, Raycaster, Scene,
  SphereGeometry, Vector2, Vector3, WebGLRenderer,
} from 'three';

import { ARCHETYPES, SYNTH_RIGS, specFor } from '../../concert/instruments.js';
import type {
  Archetype, ArchetypeSpec, Effector, Look, Performer, PlayPoint, Posture, SynthRigId,
} from '../../concert/types.js';
import type { DrumEvent } from '../../core/types.js';
import { INSTRUMENTS, type InstrumentId } from '../../style/instruments.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

import {
  AT_EASE, COINCIDENT, IDLE_HOVER, NOMINAL_HEIGHT, REST_TRIM, ZONE_PULL, escapeFrom,
  keepOutParts, letGo, lowerAtEase, type AtEasePose, type CarriesBow, type HandTrim,
  type RestTrim,
} from './at-ease.js';
import {
  AT_EASE_FILE, SAVE_ROUTE, easeEntrySource, keyOf, trimEntrySource, type Tuning,
} from './at-ease-edit.js';
import {
  buildDrumMachine, type DrumMachine, type DrumMachineOptions,
} from './instruments/drum-machine.js';
import { SHAPE_OF } from './instruments/hand-drum.js';
import { SIZED_FAMILIES, buildInstrumentFor } from './instruments/index.js';
import type { Contact, InstrumentModel } from './instruments/types.js';
import { lightTheRoom } from './performer-assets.js';
import { buildPerformer, type PerformerRig } from './performer.js';

const canvas = document.getElementById('bench') as HTMLCanvasElement;
const facts = document.getElementById('facts')!;
const pick = document.getElementById('pick') as HTMLSelectElement;
const showPlayer = document.getElementById('player') as HTMLInputElement;
const showContacts = document.getElementById('contacts') as HTMLInputElement;
const spinning = document.getElementById('spin') as HTMLInputElement;
const idleButton = document.getElementById('idle') as HTMLButtonElement;
const playButton = document.getElementById('play') as HTMLButtonElement;
const stoodSlider = document.getElementById('stood') as HTMLInputElement;
const stoodValue = document.getElementById('stoodv')!;
const tuneButton = document.getElementById('tune') as HTMLButtonElement;
const tuner = document.getElementById('tuner') as HTMLDivElement;
const tunerHead = document.getElementById('tunerHead')!;
const tunerRows = document.getElementById('tunerRows')!;
const tunerOut = document.getElementById('tunerOut') as HTMLPreElement;
const moveButton = document.getElementById('gizmoMove') as HTMLButtonElement;
const turnButton = document.getElementById('gizmoTurn') as HTMLButtonElement;

/**
 * One buildable object. See the note at the top of the file.
 *
 * `id` is the bench's own name for it, and — by way of the performer built
 * around it — what seeds the build, so an exhibit looks the same every time you
 * come back to it and two variants of one archetype get different finishes
 * rather than being the same object twice over. A machine has no performer and
 * takes its variation from its kind instead.
 */
interface Entry {
  id: string;
  label: string;
  /** What to build, or absent where this is a machine and there is no player. */
  archetype?: Archetype;
  /** Which synthesiser, where the archetype is `synth`. From `Performer.rig`. */
  rig?: SynthRigId;
  /**
   * How many keyboards this station stands at. Absent means one.
   *
   * From `Performer.boards`, and it is the rig's geometry that changes: the
   * boards themselves are `synth.ts`'s and are laid out by `boardsFor` either
   * way, but the shelf, the posts and the arm holding each of them up are built
   * by whichever rig was asked to carry them.
   */
  boards?: number;
  /** A drummer on pads rather than an acoustic kit. From the number's `DrumSource`. */
  electronic?: boolean;
  /**
   * Which drum a hand percussionist is playing, where the archetype is
   * `handdrum`. From the rack half of `DrumTrack.bank`; see `SHAPE_OF`.
   */
  rack?: string;
  /**
   * How the player at this object is arranged. Absent means the archetype's own.
   *
   * From `Station.posture`, and only the hand drum's geometry moves with it —
   * see `InstrumentBuildOptions.posture`, which is the list of models that read
   * it and has one entry.
   */
  posture?: Posture;
  /**
   * Which member of a sized family this is. Absent means the archetype's default.
   *
   * A catalogue id rather than a number, because `SCALE_OF` is the table that
   * turns one into the other and this page has no business holding a second
   * opinion about how big an alto is. See `SIZED_FAMILIES`.
   */
  instrument?: InstrumentId;
  /**
   * The band's machine as a *module in this rig*, rather than as its own
   * object. See `StageMachine.mount`, and `machine` for the standalone one.
   */
  bay?: DrumMachineOptions['kind'];
  machine?: DrumMachineOptions['kind'];
}

/**
 * What the three rigs are called on the bench.
 *
 * The ids are the cast's vocabulary and say what the object *is* only if you
 * already know; these say what you are looking for when you pick one, which is
 * a silhouette. See `synth-rig.ts` for the three decades behind them.
 */
const RIG_LABEL: Record<SynthRigId, string> = {
  modular: 'modular wall',
  polysynth: 'polysynth',
  digital: 'digital slab',
};

/**
 * The rig that has somewhere to put a machine, and what each module looks like.
 *
 * Only the modular has a bay, and that is `cast.ts`'s rule rather than this
 * page's: a machine is mounted `'bay'` where its tender stands at a modular and
 * `'stand'` everywhere else, because a cabinet of modules is the one object a
 * rhythm machine can honestly be *inside*. The two kinds build different
 * faceplates — a step row with three voice lamps, or the same row under a knob
 * per step — so both are exhibits. `box` is not: a preset box and a programmed
 * one reach the same percussion module, and the cream-and-wood case that tells
 * those two apart on a stand is the half of the object a bay does not have.
 */
const BAY_MODULES: readonly (readonly [DrumMachineOptions['kind'], string])[] = [
  ['programmed', 'rhythm module'],
  ['sequencer', 'step sequencer'],
];

/**
 * The two ways a hand percussionist is arranged, and therefore two objects.
 *
 * `postureFor` in `cast.ts` gives this archetype its own `straddle` everywhere
 * except the two floor-seated traditions, where it gives `floor` — and the model
 * is not the same drum moved down. `Seat` in `hand-drum.ts` puts the head at
 * 0.72 m or 0.32, and the shell runs from the head to the boards either way, so
 * the whole object shortens and the trap table beside it grows its own shorter
 * legs. Two builds, and the bench had only ever run the first.
 *
 * Read off the spec rather than written as `['straddle', 'floor']`, so that an
 * archetype that changes its mind about where its player sits cannot leave a row
 * here describing a posture nothing takes.
 */
const HAND_POSTURES: readonly Posture[] = [ARCHETYPES.handdrum.posture, 'floor'];

function entries(): Entry[] {
  const out: Entry[] = [];
  for (const id of Object.keys(ARCHETYPES) as Archetype[]) {
    const { label } = ARCHETYPES[id];
    if (id === 'synth') {
      for (const rig of Object.keys(RIG_LABEL) as SynthRigId[]) {
        const name = `${label}, ${RIG_LABEL[rig]}`;
        /**
         * One exhibit per board count the object can hold.
         *
         * `SYNTH_RIGS[rig].maxBoards` and not `Performer.boards`, because this
         * is a page about objects: the ceiling is what the rig could carry, and
         * how many a player actually stands at is a fact about their music that
         * no bench has. A polysynth's is 1 and this loop runs once for it,
         * which is the answer — a Prophet with a second keyboard on it is not a
         * variant of a Prophet, it is two stations.
         */
        for (let boards = 1; boards <= SYNTH_RIGS[rig].maxBoards; boards++) {
          out.push({
            id: boards === 1 ? `synth:${rig}` : `synth:${rig}:${boards}`,
            label: boards === 1 ? name : `${name}, ${boards} keyboards`,
            archetype: id,
            rig,
            ...(boards > 1 ? { boards } : {}),
          });
        }
        if (rig === 'modular') {
          for (const [kind, module] of BAY_MODULES) {
            out.push({
              id: `synth:${rig}:${kind}`,
              label: `${name}, ${module}`,
              archetype: id,
              rig,
              bay: kind,
            });
          }
        }
      }
    } else if (id === 'drumkit') {
      out.push({ id, label, archetype: id });
      out.push({ id: 'drumkit:pads', label: `${label}, pads`, archetype: id, electronic: true });
    } else if (id === 'handdrum') {
      /**
       * Every drum in the family, at both of the heights it is played at.
       *
       * Six exhibits where there was one, and the one was the goblet drum on a
       * chair — so the congas, the mridangam and every floor-seated build of any
       * of them had shipped without a screen ever showing them. The mridangam is
       * what that cost: it went out with its shell inside-out and its two ends
       * swapped, which is the plainest thing a look would have caught.
       *
       * The product rather than the four combinations `cast.ts` actually
       * reaches, for the reason the header gives about the modular's wings: the
       * bench shows what the models can be asked for, and a build nobody stages
       * is still a build nobody has looked at.
       */
      for (const rack of Object.keys(SHAPE_OF)) {
        for (const posture of HAND_POSTURES) {
          const floor = posture === 'floor';
          out.push({
            id: floor ? `handdrum:${rack}:floor` : `handdrum:${rack}`,
            label: `${rack}${floor ? ', on the floor' : ''}`,
            archetype: id,
            rack,
            ...(floor ? { posture } : {}),
          });
        }
      }
    } else if (id === 'dulcimer') {
      /**
       * Both heights, for the reason the hand drum has both: `ARCHETYPES.dulcimer`
       * carries `lap`, so `postureFor` puts this player on a carpet in the two
       * floor-seated traditions, and the model is not the same box moved down —
       * it loses its trestle entirely and the courses come to 0.34 m. That is a
       * branch a real stage reaches in arabic and indian, and it would otherwise
       * ship without a screen ever showing it.
       */
      out.push({ id, label, archetype: id });
      out.push({
        id: 'dulcimer:floor', label: `${label}, on the floor`,
        archetype: id, posture: 'floor',
      });
    } else if (id === 'mallets') {
      /**
       * Two objects, and deliberately not four.
       *
       * `BARS_OF` gives the marimba, the xylophone and the balafon the same
       * answer, and this model reads only that answer — so three wooden rows
       * would be one exhibit drawn three times and would say the bench had
       * looked at three things it had not. That is the argument `SIZED_FAMILIES`
       * makes about the viola, made here about the other axis. The day the model
       * learns to stretch as well, the xylophone earns its own row and the note
       * above it changes.
       */
      for (const instrument of ['vibraphone', 'marimba'] as const) {
        out.push({
          id: `${id}:${instrument}`,
          label: INSTRUMENTS[instrument].name,
          archetype: id,
          instrument,
        });
      }
    } else if (SIZED_FAMILIES[id]) {
      // One exhibit per size the model actually builds. See `SIZED_FAMILIES`,
      // and note that the default member is a row here like any other — this
      // page has no default, only objects.
      for (const instrument of SIZED_FAMILIES[id]!) {
        out.push({
          id: `${id}:${instrument}`,
          label: INSTRUMENTS[instrument].name,
          archetype: id,
          instrument,
        });
      }
    } else {
      out.push({ id, label, archetype: id });
    }
  }
  // No player, so these come last rather than sorting in among the archetypes.
  out.push(
    { id: 'machine:box', label: 'rhythm box, preset', machine: 'box' },
    { id: 'machine:programmed', label: 'drum machine, programmed', machine: 'programmed' },
  );
  return out;
}

const NAMES = entries();
for (const e of NAMES) pick.append(new Option(`${e.label} — ${e.id}`, e.id));

const renderer = new WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
/** The stage's curve, so an exhibit here is the object the show draws. */
renderer.toneMapping = AgXToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new Scene();
scene.background = new Color('#15171a');
const camera = new PerspectiveCamera(38, 1, 0.05, 200);

/**
 * The room the chrome reflects.
 *
 * Half the catalogue on this bench is metal — a trumpet bell, cymbals, a snare
 * hoop, hardware — and a `MeshStandardMaterial` at high metalness has no diffuse
 * term at all, so with no `scene.environment` it renders as a specular dot on
 * black. The same call and the same intensity as the concert and the costume
 * bench, so an exhibit here is the object the show draws.
 */
const room = lightTheRoom(renderer, scene);
// Held for the life of the page, which is the life of its renderer.
void room;

/** Low, for the reason spelled out on the costume bench: ambient describes no
 * shape, and an exhibit is nothing but shape. */
scene.add(new AmbientLight('#8899bb', 0.6));
const key = new DirectionalLight('#fff3e0', 1.9);
key.position.set(2.5, 4, 3);
key.castShadow = true;
scene.add(key);
const rim = new DirectionalLight('#88aaff', 0.6);
rim.position.set(-3, 2, -3);
scene.add(rim);

/** A plain grid, so a model floating off the floor is obvious immediately. */
const floor = new GridHelper(20, 40, 0x3a3e45, 0x24272c);
scene.add(floor);

const stand = new Group();
scene.add(stand);

/**
 * A performer to hold it.
 *
 * Half the faults worth catching are *relational* — an accordion that is fine
 * on its own but ends up behind the player's back, a trumpet whose mouthpiece
 * is nowhere near a mouth. A model shown alone cannot show those.
 */
const LOOK: Look = {
  skin: '#c58b62', hair: '#3a2418', hairStyle: 'short', height: 1.75, build: 0.5,
  outfit: {
    jacket: '#8a8f98', shirt: '#e8e4de', trousers: '#43474d',
    // Wool and a plain suit, because this page is about the *instrument*: an
    // exhibit here is judged on where the bell points and whether the hands
    // reach, and a robe or a gown would put cloth in front of both.
    accent: '#c4623a', fabric: 'wool', garment: 'suit',
  },
  accessories: [],
};

/**
 * One thing on the bench, with both of the poses it can be put in already
 * worked out. See `stanceFor`.
 *
 * Exactly one of `model` and `machine` is present: a machine is not an
 * `InstrumentModel` and deliberately does not pretend to be one — it has no
 * `resolve`, no station and no player, which is the whole point of it. So the
 * poses, the contact dots and the facts panel all sit behind `model`, and what
 * a machine shares with the rest is only a group, a clock and a `dispose`.
 */
interface Exhibit {
  entry: Entry;
  model?: InstrumentModel;
  machine?: DrumMachine;
  rig?: PerformerRig;
  group: Group;
  playing: Stance;
  waiting: Stance;
  /**
   * Where a carried model was staged, and scratch for the grip it turns about.
   *
   * Read once, before anything has moved it, exactly as `Player` reads it at
   * bind time — the pose is a rigid motion *from* the staged transform, so it
   * has to be the staged transform every frame and not wherever the last frame
   * left the model. The pivot is scratch rather than a captured value because
   * the tuner can move it: it is `resolve({kind:'rest'})`, and a left-hand trim
   * is a change to exactly that. See `applyPose`.
   */
  carry?: { pos: Vector3; quat: Quaternion; pivot: Vector3 };
  /** Parts of a floor instrument an at-ease hand could end up inside. */
  keepOut?: readonly Box3[];
  /**
   * The at-ease pose itself, as an object the gizmo can be attached to.
   *
   * Carried by the torso, like the instrument, so it is in the frame
   * `AtEasePose`'s angles are stated in — and standing at **the grip**, which
   * is the point the pose turns about. A gizmo attached to the model root would
   * turn it about the model's own origin, which for a carried instrument is
   * down by the player's feet: swinging a trumpet round that is not a pose, it
   * is a throw. Attached here, the handles sit where the hand is and the horn
   * turns under it.
   *
   * Its transform and the seven numbers are the same thing said twice, and
   * `syncEase`/`readEase` are the two directions of that. Absent unless this
   * exhibit is a carried instrument with a player.
   */
  easeNode?: Object3D;
  /**
   * Where each hand plays, in the model's own frame — left, then right.
   *
   * The stand-in for the running mean `animate.ts` keeps over a whole number,
   * and the only part of the stage's idle this page approximates rather than
   * shares. It is used for the same thing and in the same place: where a model
   * answers one rest contact for both hands, each hand is pulled toward the
   * part of the instrument it actually plays. A bench has no bar to average, so
   * the one representative moment in `playStance` stands for it — which for a
   * kit is the snare and the hats, and is what the mean converges to anyway.
   */
  zones: readonly (Contact | undefined)[];
  /** Whether the right hand holds a bow. `spec.family`, since there is no part. */
  usesBow: boolean;
}

let live: Exhibit[] = [];
let mode: 'one' | 'grid' = 'one';
let pose: 'idle' | 'play' = 'play';
/**
 * How far into the stand-down an idle player is, 0..1.
 *
 * The bench used to have two states and the stage has three, which is why the
 * poses on this page could look right and be wrong. `1 - engage` in
 * `animate.ts`: at 0 the player is **waiting at the instrument** with their
 * hands on its own rest contacts, and at 1 they are **at ease** — the
 * instrument lowered by `AT_EASE`, the hands blended to the hips, backed out of
 * whatever they were standing inside. Everything between is a real frame of a
 * real show, and half of what looks wrong looks wrong on the way rather than at
 * either end, so it is a slider and not a third button.
 */
let stood = 1;
let spin = 0;

function performerFor(entry: Entry, archetype: Archetype): Performer {
  return {
    id: `bench-${entry.id}`,
    /**
     * The layer this exhibit would be cast on, which only three archetypes
     * disagree about. It seeds nothing and is read by nothing here, but it is
     * what `Performer` means, and a vocal group on the `vocal` layer would be
     * the one confusion this archetype exists to prevent: it is an *instrument*
     * the arranger scored, and it plays the pad.
     */
    layer: archetype === 'drumkit' ? 'drums'
      : archetype === 'singer' ? 'vocal'
        : archetype === 'vocal-group' ? 'pad' : 'melody',
    archetype,
    instrument: ARCHETYPES[archetype].label,
    look: LOOK,
    station: {
      position: [0, 0, 0],
      facing: 0,
      /**
       * The exhibit's own posture where it has one, and it is not decoration:
       * `buildInstrumentFor` reads it off the station, and `buildPerformer`
       * reads the same field to decide whether this player is on a chair or
       * cross-legged on the boards. Both ends of a floor-seated hand drummer
       * come from this one line.
       */
      posture: entry.posture ?? ARCHETYPES[archetype].posture,
      riser: 0,
    },
    ...(entry.rig ? { rig: entry.rig } : {}),
    ...(entry.boards ? { boards: entry.boards } : {}),
  };
}

/**
 * How high its own stand holds it.
 *
 * The machine brings its legs with it — it stands at the player's right hand on
 * a stand built for it, and on this bench that is the whole object rather than
 * half of one. The number is a keyboard player's work height less the depth of
 * the case, which is what `cast.ts` computes for a real stage; here it is
 * written out, because there is no player on the bench to ask.
 */
const MACHINE_HEIGHT = 0.87;

/**
 * A bar for the machines to be playing.
 *
 * A rhythm box with a dead lamp row is a shoebox, and the lamp is the half of
 * that model worth looking at — it is what says the thing is running rather
 * than sitting there. So the bench hands it a pattern, the same way `show.ts`
 * hands it the number's own: kick, snare and a straight eighth-note hat, which
 * is the least interesting bar either machine could be playing and lights every
 * lamp on the front.
 */
const MACHINE_BEATS_PER_BAR = 4;
const MACHINE_PATTERN: DrumEvent[] = [];
for (let i = 0; i < MACHINE_BEATS_PER_BAR * 2; i++) {
  const beat = i / 2;
  MACHINE_PATTERN.push({ beat, voice: 'hh', velocity: 0.6 });
  if (i % 4 === 0) MACHINE_PATTERN.push({ beat, voice: 'bd', velocity: 1 });
  if (i % 4 === 2) MACHINE_PATTERN.push({ beat, voice: 'sd', velocity: 0.9 });
}

/** Bars of it a bay gets. An hour of them at the bench's beat-a-second clock. */
const BAY_BARS = 900;

/**
 * The same bar, written out for as long as anybody looks at one exhibit.
 *
 * A machine in a cabinet cannot have the trick the standalone ones get. Those
 * are handed a clock wrapped to the bar — a machine on a stand is the only
 * thing on its own exhibit, so rewinding it every four beats costs nothing and
 * is a path the object already has. A bay is half of a rig that is animating
 * off the *same* number, and a clock jumping backwards every four seconds is a
 * wall of lamps that stutters and an LFO that never gets anywhere.
 *
 * So the clock stays monotonic and the pattern is what repeats. The runner
 * stops a bar after its last event — see `createMachineRunner` — and it starts
 * at its first, which is why the figure is laid down from the bar the page is
 * *already* in rather than from zero: an exhibit picked twenty minutes in has
 * to be running when it appears, and on the same grid the step row walks.
 */
function bayPattern(): DrumEvent[] {
  const bar0 = Math.floor(performance.now() / 1000 / MACHINE_BEATS_PER_BAR);
  const out: DrumEvent[] = [];
  for (let bar = bar0; bar < bar0 + BAY_BARS; bar++) {
    for (const e of MACHINE_PATTERN) {
      out.push({ ...e, beat: bar * MACHINE_BEATS_PER_BAR + e.beat });
    }
  }
  return out;
}

// --- poses ---------------------------------------------------------------
//
// The bench had one pose and it was the absence of one: nothing ever commanded
// an effector, so every player on this page stood with their hands by their
// hips whatever they were holding. Which is a real pose — it is what a band
// does between numbers — and it is not the one you want when the question is
// "does this model's left hand land on the fretboard".
//
// Both poses here are the *models'* own answers, not this file's: `resolve`
// with a representative point for playing, `resolve({kind:'rest'})` for idle.
// Nothing is dialled in by eye, so a model that places a hand wrongly places it
// wrongly here too, which is the whole reason the page exists.
//
// ## And then the idle pose was still not the stage's
//
// That paragraph was written about a page with two states, and the stage has
// three. `resolve({kind:'rest'})` is where a hand goes while its player is
// **waiting at the instrument** — between phrases, still engaged. It is not
// where anything ends up when the player actually stands down, which on a stage
// is five further things: the carried instrument swings about its grip and
// drops (`AT_EASE`), each hand blends from that rest contact toward the body's
// own hip rest by however much of the instrument it has let go of (`letGo`),
// the blended point backs out of whatever it is inside (`escapeFrom`), the
// wrist turns toward the body's resting attitude, and a bow is handed to the
// hand holding it (`CarriesBow`).
//
// So a pose could look right here and be wrong in the show, which is exactly
// the gap this page exists to close and is why the idle poses went untuned for
// as long as they did. Everything below now drives the same functions the
// runtime does, out of the same table — see `at-ease.ts`. Only one thing is a
// stand-in rather than shared, and it is named where it is used: `Exhibit.zones`.

/** Where each limb goes, as points the model has to be able to resolve. */
type Stance = readonly (readonly [Effector, PlayPoint])[];

const REST: PlayPoint = { kind: 'rest' };

/**
 * One representative moment of playing, derived from the archetype's own spec
 * rather than tabulated per instrument.
 *
 * The choices that are not arbitrary are the ones that match what
 * `choreograph.ts` would have decided: hands low and high on a keyboard, the
 * kick under the right foot and the hat pedal under the left, the bow rather
 * than the right hand on anything bowed. The rest — which fret, which drum —
 * is only ever "somewhere a hand plausibly is", because the point is to see
 * the limb arrive at the geometry, not to stage a particular bar.
 */
function playStance(spec: ArchetypeSpec): Stance {
  const [lo, hi] = spec.range;
  const at = (f: number): number => Math.round(lo + (hi - lo) * f);
  const out: (readonly [Effector, PlayPoint])[] = [];
  const kit = spec.points.includes('drum');

  for (const kind of spec.points) {
    switch (kind) {
      case 'key':
        // A fifth of the way up and three fifths, which is roughly where
        // `keyboardPart` starts its two hands — and low enough on the left that
        // an accordion's bass buttons, which end at E3, get the hand that plays
        // them rather than a second hand on the treble keyboard.
        out.push(['left-hand', { kind: 'key', midi: at(0.2) }]);
        out.push(['right-hand', { kind: 'key', midi: at(0.6) }]);
        break;
      case 'valve':
      case 'hole': {
        // Both hands off one fingering: a blown instrument's only sounding
        // gesture is on the mouth, so this is the sole path its hands have.
        const midi = at(0.45);
        out.push(['left-hand', { kind, midi }], ['right-hand', { kind, midi }]);
        break;
      }
      case 'string': {
        // A harp carries neither `strings` nor `frets` — it resolves a pitch to
        // a whole course, numbered from the bottom of its range.
        const point: PlayPoint = spec.strings
          ? {
            kind: 'string',
            string: Math.floor(spec.strings.length / 2),
            fret: Math.min(5, spec.frets ?? 3),
          }
          : { kind: 'string', string: at(0.45) - lo, fret: 0 };
        out.push(['left-hand', point]);
        out.push([spec.family === 'bowed' ? 'bow' : 'right-hand', point]);
        break;
      }
      case 'drum':
        out.push(['left-hand', { kind: 'drum', voice: 'sd' }]);
        out.push(['right-hand', { kind: 'drum', voice: 'hh' }]);
        break;
      case 'pedal':
        // The kick is the right foot always, and the hat pedal the left; a
        // keyboard's one pedal is a sustain under the right.
        out.push(['right-foot', { kind: 'pedal', which: kit ? 'kick' : 'sustain' }]);
        if (kit) out.push(['left-foot', { kind: 'pedal', which: 'hat', shut: true }]);
        break;
      case 'viseme':
        out.push(['mouth', { kind: 'viseme', vowel: 'a', consonant: 'none' }]);
        break;
      default:
        // `rest` is the other stance, and a bellows moves the box rather than
        // placing anything.
        break;
    }
  }
  return out;
}

/**
 * Waiting at the instrument: the model's `rest`, which every model must answer.
 *
 * A singer's hands are free and the microphone would happily hand both of them
 * the capsule, so the one effector a singer rests is the mouth — ten
 * centimetres off the grille, which is where the model puts a breath.
 */
function restStance(spec: ArchetypeSpec): Stance {
  if (spec.hands === 0) return [['mouth', REST]];
  return [['left-hand', REST], ['right-hand', REST]];
}

const P = new Vector3();
const N = new Vector3();
const A = new Vector3();
const HIP = new Vector3();
const AXIS = new Vector3();
const MID = new Vector3();
const QUAT = new Quaternion();
const QUAT_INV = new Quaternion();
const RIG_QUAT = new Quaternion();
const MODEL_INV = new Matrix4();

/**
 * One hand's idle answer, held while the other is asked.
 *
 * Both have to be resolved before either is committed, because the first thing
 * done with them is a comparison: two hands sent to the same point are a model
 * that declined to choose, and what happens next depends on that. Two objects
 * for the life of the page rather than per exhibit — the exhibits are posed one
 * after another and nothing survives the call.
 */
interface HandGoal {
  effector: Effector;
  ok: boolean;
  position: Vector3;
  normal: Vector3;
  along: Vector3;
  hasAlong: boolean;
}
const GOALS: readonly HandGoal[] = [0, 1].map(() => ({
  effector: 'left-hand' as Effector,
  ok: false,
  position: new Vector3(),
  normal: new Vector3(),
  along: new Vector3(),
  hasAlong: false,
}));

/**
 * Put one exhibit's rig where the pose says, in world space.
 *
 * `Contact` is in the model's own local frame and `setEffector` wants world, so
 * everything goes through the model's world matrix — which for a carried
 * instrument is the player's torso and moves with them, exactly as in `show.ts`.
 */
function applyPose(item: Exhibit): void {
  const { model, rig } = item;
  if (!rig || !model) return;
  const playing = pose === 'play';
  const down = playing ? 0 : stood;
  const spec = specFor(model.archetype);
  const ease = AT_EASE[model.archetype];

  rig.setPlaying(playing);
  if (!playing) rig.setMouth(0, 0, 0);
  // The voice family is tested before `blown`, and the order is the bug this
  // line prevents rather than a preference. Both singers declare `blown`,
  // because singers breathe, so a family test written second would put a
  // trumpeter's embouchure on every face that sings. `animate.ts` makes the
  // same choice in `face` and for the same reason.
  else if (spec.family === 'voice') rig.setMouth(0.5, 0.15, 0.2);
  else if (spec.blown) rig.setMouth(0.08, 0.65, 0.06);
  else rig.setMouth(0, 0, 0);
  // The cheeks, on the same test and for the same reason. A mouth held open in
  // the `play` pose with no air behind it is a face with something missing, and
  // the tuner is where anyone looks at a face from 30 cm.
  rig.setBlow(!playing ? 0 : spec.family === 'voice' ? 0.7 : spec.blown ? 1 : 0);

  // The instrument before the hands, because the hands are placed against where
  // it ended up.
  //
  // The pivot is re-read here rather than captured with the transform beside
  // it, which is the one place this page deliberately does more work than
  // `animate.ts`: the runtime resolves the grip once at bind time because
  // nothing can move it inside a number, and the whole point of the tuner is
  // that a left-hand trim moves it. Once per exhibit per frame, on a page
  // showing one.
  if (item.carry && ease) {
    // Held where a hand gizmo is being dragged, which is the one case that
    // would otherwise chase itself: the grip *is* the left hand's rest contact,
    // so trimming that hand moves the pivot, which moves the instrument, which
    // moves the contact the drag is being measured against. Frozen for the
    // length of the drag, the drag is a straight line; it catches up on release.
    if (!(gizmoDragging && selected?.kind === 'hand')) {
      const grip = model.resolve(REST, 'left-hand');
      if (grip) {
        item.carry.pivot.copy(grip.position)
          .applyQuaternion(item.carry.quat).add(item.carry.pos);
      } else item.carry.pivot.copy(item.carry.pos);
    }
    lowerAtEase(
      model.root, ease, down, rig.proportions.height,
      item.carry.pos, item.carry.quat, item.carry.pivot,
    );
  }

  rig.root.updateWorldMatrix(true, false);
  model.root.updateWorldMatrix(true, false);
  model.root.getWorldQuaternion(QUAT);
  QUAT_INV.copy(QUAT).invert();
  MODEL_INV.copy(model.root.matrixWorld).invert();
  rig.root.getWorldQuaternion(RIG_QUAT);

  // A singer's hands are free, so the one effector they rest is the mouth, and
  // there is nothing below for it. Everything else goes through the hands.
  if (playing || spec.hands === 0) {
    commandStance(item, playing ? item.playing : item.waiting);
    return;
  }
  restPose(item, ease, down);
}

/** Command a whole stance as it stands: the play pose, and a singer's rest. */
function commandStance(item: Exhibit, stance: Stance): void {
  const { model, rig } = item;
  if (!model || !rig) return;
  for (const [effector, point] of stance) {
    const contact = model.resolve(point, effector);
    if (!contact) continue;
    P.copy(contact.position).applyMatrix4(model.root.matrixWorld);
    rig.setEffector(
      effector,
      P,
      N.copy(contact.normal).applyQuaternion(QUAT),
      contact.along ? A.copy(contact.along).applyQuaternion(QUAT) : undefined,
    );
  }
}

/**
 * Both hands of a player who is not playing, `down` of the way to at ease.
 *
 * The same four steps `Runtime.idleGoals` and `Runtime.hands` take, in the same
 * order and out of the same table. Read them together: anything that is true
 * there and not here is a way this page can lie about a pose, which is the
 * fault it was rebuilt to stop telling.
 */
function restPose(item: Exhibit, ease: AtEasePose | undefined, down: number): void {
  const { model, rig } = item;
  if (!model || !rig) return;

  for (let k = 0; k < 2; k++) {
    const goal = GOALS[k]!;
    // A bowed player's right hand idles where the bow lives, not where a
    // pizzicato finger would. Asked once per hand, which is what `resolve`'s
    // `effector` parameter is for: every wind and brass model answers the two
    // differently, one supporting the instrument and the other fingering it.
    goal.effector = k === 0 ? 'left-hand' : item.usesBow ? 'bow' : 'right-hand';
    const contact = model.resolve(REST, goal.effector);
    goal.ok = contact !== undefined;
    if (!contact) continue;
    goal.position.copy(contact.position).applyMatrix4(model.root.matrixWorld);
    goal.normal.copy(contact.normal).applyQuaternion(QUAT);
    goal.hasAlong = contact.along !== undefined;
    if (contact.along) goal.along.copy(contact.along).applyQuaternion(QUAT);
  }

  const left = GOALS[0]!;
  const right = GOALS[1]!;
  // **A model that answered the two hands differently has already decided, and
  // nothing in this block runs.** Separating a pair along the performer's
  // lateral axis assumes nobody had a better idea, and on a flute somebody did.
  if (left.ok && right.ok && left.position.distanceTo(right.position) < COINCIDENT) {
    for (let k = 0; k < 2; k++) {
      const zone = item.zones[k];
      const goal = GOALS[k]!;
      if (!zone) continue;
      P.copy(zone.position).applyMatrix4(model.root.matrixWorld);
      N.copy(zone.normal).applyQuaternion(QUAT);
      // A hand at a drum head's contact point is half inside the drum, so it
      // hovers off the surface it plays rather than resting on it.
      if (N.lengthSq() > 1e-6) {
        N.normalize();
        P.addScaledVector(N, IDLE_HOVER);
        goal.normal.copy(N);
      }
      goal.position.lerp(P, ZONE_PULL);
    }
    // Whatever the zones did or did not manage, two hands may not occupy one
    // point — and how far apart "not one point" is depends on how big this
    // performer's hands are, which is the rig's business and not this file's.
    MID.addVectors(left.position, right.position).multiplyScalar(0.5);
    rig.separateRest('left-hand', MID, P);
    rig.separateRest(right.effector, MID, A);
    if (left.position.distanceTo(right.position) < P.distanceTo(A)) {
      left.position.copy(P);
      right.position.copy(A);
    }
  }

  for (let k = 0; k < 2; k++) {
    const goal = GOALS[k]!;
    if (!goal.ok) continue;
    // Per hand, because a hand still holding the instrument has not stood down
    // at all — it has come down *with* it, and the model's own rest contact has
    // already moved to where the instrument now is.
    const go = letGo(ease, down, k);
    if (go > 0.001) {
      escapeFrom(
        item.keepOut, rig.restPosition(goal.effector, HIP), 1,
        RIG_QUAT, QUAT_INV, MODEL_INV,
      );
      goal.position.lerp(HIP, go);
      // And the blended point, not just its destination: a cellist's right hand
      // is fine at both ends and goes through the front of the cello between.
      escapeFrom(item.keepOut, goal.position, go, RIG_QUAT, QUAT_INV, MODEL_INV);
      // A hand released from a key bed that keeps the key bed's normal arrives
      // at the hip palm-down and rigid.
      goal.normal.lerp(AXIS.set(0, 1, 0).applyQuaternion(RIG_QUAT), go).normalize();
      if (goal.hasAlong) {
        goal.along.lerp(AXIS.set(1, 0, 0).applyQuaternion(RIG_QUAT), go).normalize();
      }
    }
    rig.setEffector(
      goal.effector, goal.position, goal.normal, goal.hasAlong ? goal.along : undefined,
    );
  }

  // The bow is the one thing on this stage that belongs to the player rather
  // than to the instrument, and the scene graph says the opposite — so a
  // violinist standing down takes it with the violin unless the runtime hands
  // it over. Anything with no bow to carry costs one property lookup.
  const bowed = model as Partial<CarriesBow>;
  if (typeof bowed.carryBow === 'function') {
    bowed.carryBow(
      letGo(ease, down, 1),
      right.ok ? right.position : rig.restPosition('right-hand', HIP),
    );
  }
}

function clear(): void {
  // Before the objects go: the gizmo holds a reference to whatever it is
  // attached to, and an exhibit is rebuilt on every switch of the picker.
  gizmo.detach();
  gizmo.getHelper().visible = false;
  selected = undefined;
  gizmoDragging = false;
  focused = false;
  for (const handle of handles) handle.visible = false;
  for (const item of live) {
    item.model?.dispose();
    item.machine?.dispose();
    item.rig?.dispose();
    stand.remove(item.group);
  }
  live = [];
}

/** Little spheres wherever `resolve` says a hand goes. */
function markContacts(model: InstrumentModel, into: Group): void {
  const spec = specFor(model.archetype);
  const probes: PlayPoint[] = [{ kind: 'rest' }];
  const [lo, hi] = spec.range;
  for (const kind of spec.points) {
    if (kind === 'key' || kind === 'valve' || kind === 'hole') {
      for (let m = lo; m <= hi; m += Math.max(1, Math.round((hi - lo) / 14))) {
        probes.push({ kind, midi: m } as PlayPoint);
      }
    } else if (kind === 'string' && spec.strings) {
      for (let s = 0; s < spec.strings.length; s++) {
        for (const fret of [0, 3, 7, 12]) probes.push({ kind: 'string', string: s, fret });
      }
    } else if (kind === 'drum') {
      for (const v of ['bd', 'sd', 'hh', 'oh', 'lt', 'mt', 'ht', 'cr', 'rd'] as const) {
        probes.push({ kind: 'drum', voice: v });
      }
    } else if (kind === 'pedal') {
      for (const w of ['hat', 'kick', 'sustain'] as const) probes.push({ kind: 'pedal', which: w });
    }
  }
  const geo = new SphereGeometry(0.016, 8, 6);
  const mat = new MeshBasicMaterial({ color: '#e0a24a' });
  const soundMat = new MeshBasicMaterial({ color: '#4ad0e0' });
  for (const p of probes) {
    for (const [effector, material] of [
      ['left-hand', mat], ['right-hand', soundMat],
    ] as const) {
      const c = model.resolve(p, effector);
      if (!c) continue;
      const dot = new Mesh(geo, material);
      dot.position.copy(c.position);
      into.add(dot);
    }
  }
}

/**
 * Everything an exhibit needs to be able to stand down, read once at build.
 *
 * The same three things `Player`'s constructor reads and for the same reasons:
 * where a carried model was staged before anything moved it, which parts of a
 * floor model a hand could end up inside, and where each hand plays. All three
 * are settled by the time the model is on the bench and none of them changes
 * while it is standing there.
 *
 * A model shown without its player has nowhere for any of it to go, and neither
 * does a machine — both come back empty rather than absent, which is what keeps
 * `Exhibit` a total shape.
 */
function standDownState(
  model: InstrumentModel, rig: PerformerRig | undefined, spec: ArchetypeSpec,
  playing: Stance,
): Pick<Exhibit, 'carry' | 'keepOut' | 'zones' | 'easeNode'> {
  if (!rig) return { zones: [] };
  const zones = [0, 1].map((k) => {
    // The effector this hand plays with, which for a bowed part is the bow. The
    // stage takes a running mean of these; see `Exhibit.zones`.
    const want: readonly Effector[] = k === 0
      ? ['left-hand'] : spec.family === 'bowed' ? ['bow', 'right-hand'] : ['right-hand'];
    for (const [effector, point] of playing) {
      if (!want.includes(effector)) continue;
      const contact = model.resolve(point, effector);
      if (contact) return contact;
    }
    return undefined;
  });
  if (spec.held) {
    const easeNode = new Object3D();
    rig.carry(easeNode);
    return {
      carry: {
        pos: model.root.position.clone(),
        quat: model.root.quaternion.clone(),
        // Filled every frame, because the tuner can move it. See `applyPose`.
        pivot: new Vector3(),
      },
      easeNode,
      zones,
    };
  }
  // A held instrument has no keep-out: it is on the player and moves with them,
  // so there is nothing standing still for a hand to reverse out of.
  return {
    ...(spec.hands > 0 ? { keepOut: keepOutParts(model, rig) ?? undefined } : {}),
    zones,
  };
}

/** How much air the grid leaves between one exhibit and the next. */
const GRID_GAP = 0.6;

/**
 * Lay the exhibits out in a square, and answer the pitch it took.
 *
 * **Measured, because 45 exhibits do not fit the spacing 22 were given.** The
 * pitch was 3.2 m written in the line above the loop, and by the time this page
 * showed a four-board modular wall (2.80 m across) beside a grand piano the
 * closest pair had 13.5 cm between them. It held — and it held the way the trap
 * table in `hand-drum.ts` held, which is to say until the next wide object, with
 * nothing anywhere that would say so.
 *
 * Two passes, and the first has to be a real build: an exhibit's size is what
 * its model and its player come out as, and there is no declaring it in advance.
 * `ArchetypeSpec.footprint` is not that number — it is a staging radius for a
 * player and their clearance, and a grand piano's is 1.5 against the 2.3 m of
 * actual piano this measures.
 *
 * **Each exhibit is centred on its own cell**, which is the half that makes the
 * pitch honest. A box is not centred on the origin it was built around — a
 * pianist sits at one end of their instrument, so the piano reaches 2.18 m from
 * the point the grid was placing — and a pitch derived from widths while the
 * contents sat off-centre would still collide. Centred, the guarantee is
 * arithmetic: no exhibit reaches more than half the widest one from its cell, so
 * neighbours cannot be closer than `GRID_GAP`.
 *
 * The axes helper stays at the model's own origin rather than moving to the
 * middle of the cell, because where an exhibit's origin *is* — under the feet,
 * or off at the end of a piano — is one of the things this grid is for.
 */
function layOutGrid(groups: readonly Group[]): number {
  const cols = Math.ceil(Math.sqrt(groups.length));
  const rows = Math.ceil(groups.length / cols);
  const boxes = groups.map((g) => {
    g.updateWorldMatrix(true, true);
    return new Box3().setFromObject(g);
  });
  let widest = 0;
  for (const b of boxes) {
    widest = Math.max(widest, b.max.x - b.min.x, b.max.z - b.min.z);
  }
  const pitch = widest + GRID_GAP;
  groups.forEach((g, i) => {
    const mid = boxes[i]!.getCenter(new Vector3());
    g.position.set(
      ((i % cols) - (cols - 1) / 2) * pitch - mid.x,
      0,
      (Math.floor(i / cols) - (rows - 1) / 2) * pitch - mid.z,
    );
    // Added after the measurement rather than during the build, so a 0.3 m
    // marker is not part of what the smallest exhibits are measured as.
    g.add(new AxesHelper(0.3));
  });
  return pitch;
}

function build(which: Entry[]): void {
  clear();
  /**
   * Built detached and parented once it is measured — `layOutGrid` reads a world
   * box, and `stand` is the node the turntable spins, so a group already hanging
   * off it would be measured in whatever direction the page happened to be
   * pointing. Nothing in the build below reads a world position: `keepOutParts`
   * works in the model's own frame by inverting `root.matrixWorld`, and the
   * stances come from `resolve`.
   */
  const groups: Group[] = [];

  which.forEach((entry) => {
    const group = new Group();
    groups.push(group);

    if (entry.machine) {
      const machine = buildDrumMachine({
        kind: entry.machine,
        seed: 0x51a1,
        events: MACHINE_PATTERN,
        beatsPerBar: MACHINE_BEATS_PER_BAR,
        stand: MACHINE_HEIGHT,
        // Running from the first frame: there is no player on this bench to
        // start it, and a dark panel is the one thing this exhibit cannot show.
        startedAt: 0,
      });
      machine.root.position.y = MACHINE_HEIGHT;
      group.add(machine.root);
      live.push({
        entry, machine, group, playing: [], waiting: [], zones: [], usesBow: false,
      });
      return;
    }

    const archetype = entry.archetype!;
    // The stage's own entry point, not the raw builder: it is what sizes a horn
    // to this player's face and what wraps the string models so the *sounding*
    // hand gets the sounding contact. Building around it left the picking hand
    // on the fretboard, which is the one pose a guitarist never takes.
    const performer = performerFor(entry, archetype);
    const model = buildInstrumentFor(
      // The catalogue entry, where this exhibit is one size of a family — it is
      // what `SCALE_OF` is keyed on, and the only way to ask for an alto rather
      // than for 0.35. See `SIZED_FAMILIES`.
      performer, entry.instrument, undefined, undefined,
      entry.electronic ? 'electronic-kit' : undefined,
      // The same bar the standalone machines run, for the same reason: a bay
      // whose step row never lights is a rack panel, and the row is the half of
      // that module worth coming here to see. See `bayPattern` for why it is
      // written out rather than looped.
      entry.bay
        ? { kind: entry.bay, events: bayPattern(), beatsPerBar: MACHINE_BEATS_PER_BAR }
        : undefined,
      // The whole rack, as ever: an instrument shown as an instrument rather
      // than as one number's subset of it.
      undefined,
      entry.rack,
    );
    let rig: PerformerRig | undefined;

    if (showPlayer.checked) {
      rig = buildPerformer(performer);
      group.add(rig.root);
      if (specFor(archetype).held) {
        rig.carry(model.root);
        model.root.position.copy(model.station.offset).negate()
          .setY(-model.station.offset.y - rig.proportions.hipY);
        model.root.rotation.y = -model.station.facing;
      } else {
        model.root.position.copy(model.station.offset).negate();
        group.add(model.root);
      }
    } else {
      group.add(model.root);
    }

    if (showContacts.checked) markContacts(model, model.root);
    const spec = specFor(archetype);
    const playing = playStance(spec);
    live.push({
      entry, model, rig, group, playing, waiting: restStance(spec),
      usesBow: spec.family === 'bowed',
      ...standDownState(model, rig, spec, playing),
    });
  });

  const pitch = which.length > 1 ? layOutGrid(groups) : 0;
  // Parented once they have been measured, never before. See `layOutGrid`.
  for (const g of groups) stand.add(g);

  frameAll(which, pitch);
  describe(which);
  drawTuner();
}

/**
 * How far back the camera sits, before the wheel.
 *
 * The single-model figure is framed on the *performer*, not on the instrument.
 * At the old 2.99 m a 38° frame is 2.06 m tall, so a mean-height player filled
 * 85 % of it and a tall one on a riser lost their feet; 4.2 gives 2.90 m, which
 * is a whole person with room to see what their hands are doing.
 */
let dist = 4.2;
/** The wheel, as a multiplier on that. Kept across model switches on purpose. */
let zoom = 1;

/**
 * Put the camera where the whole of what is on the bench fits.
 *
 * A machine gets its own distance because it is the one exhibit with no player
 * to frame on: a shoebox at a whole person's remove is a dark smudge with a
 * lamp row too small to read, which is the only part of it worth coming here
 * for. 1.3 m used to be that, and it was measured on a machine with no legs —
 * the object now brings its own stand and is most of a metre tall, so at 1.3 the
 * feet were outside the frame. 2.1 holds the whole stand and still shows the row
 * at twice the size the default distance would.
 */
function frameAll(which: Entry[], pitch: number): void {
  if (which.length > 1) {
    // The pitch the grid actually took, not the one it used to be written as.
    dist = Math.ceil(Math.sqrt(which.length)) * pitch * 1.15;
    return;
  }
  dist = which[0]?.machine ? 2.1 : 4.2;
}

function describe(which: Entry[]): void {
  if (which.length !== 1) {
    facts.textContent = `${which.length} exhibits · drag to orbit`;
    return;
  }
  const entry = which[0]!;
  const item = live[0]!;
  const root = (item.model ?? item.machine!).root;
  root.updateWorldMatrix(true, true);

  /**
   * `Box3.setFromObject`, not a hand-rolled traversal.
   *
   * The first version of this walked the tree and transformed each mesh's own
   * `geometry.boundingBox` — which is right for a `Mesh` and quietly wrong for
   * an `InstancedMesh`, where that box describes the *prototype* and says
   * nothing about where the instances went. Half these models instance their
   * hardware (a kit's chrome tubes, a piano's lugs, an accordion's buttons), so
   * the bench reported a drum kit reaching half a metre below the boards and I
   * nearly went looking for it in the model. `Box3` knows about instancing.
   */
  const bounds = new Box3().setFromObject(root);
  const lo = bounds.min;
  const hi = bounds.max;
  const box = new Vector3().subVectors(hi, lo);
  const sits = lo.y < -0.02 ? ' <span class="warn">below the floor</span>' : '';
  const size = [
    `size  ${box.x.toFixed(2)} × ${box.y.toFixed(2)} × ${box.z.toFixed(2)} m`,
    `floor ${lo.y.toFixed(3)} m${sits}  ·  top ${hi.y.toFixed(2)} m`,
  ];

  // A machine has no spec to report and never will: every line of one is about
  // a player, and this is the object that has none.
  if (!item.model) {
    facts.innerHTML = [
      `<b>${entry.label}</b>  (${entry.id})`,
      'no player · self-playing · on its own stand at a player’s right hand',
      ...size,
    ].join('<br>');
    return;
  }

  const spec = specFor(item.model.archetype);
  /**
   * This exhibit's posture, not the archetype's — they are the same line for
   * every exhibit but the floor-seated hand drums, and on those the spec's
   * `straddle` was printed under a player sitting cross-legged on the boards.
   * The one page whose job is to say what was actually built may not report the
   * default it was overridden with.
   */
  const posture = entry.posture ?? spec.posture;
  facts.innerHTML = [
    `<b>${entry.label}</b>  (${entry.id})`,
    `family ${spec.family} · ${spec.hands} hands · ${posture}${spec.held ? ' · carried' : ' · stands'}`,
    `range ${spec.range[0]}–${spec.range[1]} · footprint ${spec.footprint} m · work height ${spec.workHeight} m`,
    ...size,
  ].join('<br>');
}

// --- interaction ---------------------------------------------------------

let index = 0;
const showOne = (): void => {
  pick.value = NAMES[index]!.id; mode = 'one'; build([NAMES[index]!]);
};

pick.onchange = () => { index = NAMES.findIndex((e) => e.id === pick.value); showOne(); };
document.getElementById('prev')!.onclick = () => {
  index = (index - 1 + NAMES.length) % NAMES.length; showOne();
};
document.getElementById('next')!.onclick = () => {
  index = (index + 1) % NAMES.length; showOne();
};
document.getElementById('all')!.onclick = () => { mode = 'grid'; build(NAMES); };
showPlayer.onchange = () => (mode === 'grid' ? build(NAMES) : showOne());
showContacts.onchange = showPlayer.onchange;

const setPose = (next: 'idle' | 'play'): void => {
  pose = next;
  idleButton.classList.toggle('on', next === 'idle');
  playButton.classList.toggle('on', next === 'play');
};
idleButton.onclick = () => setPose('idle');
playButton.onclick = () => setPose('play');
setPose(pose);

const setStood = (next: number): void => {
  stood = Math.max(0, Math.min(1, next));
  stoodSlider.value = String(stood);
  stoodValue.textContent = stood.toFixed(2);
};
stoodSlider.oninput = () => {
  setStood(Number(stoodSlider.value));
  // Moving it is a statement about the idle pose, so it says which pose it is
  // about rather than leaving a slider that is visibly doing nothing.
  setPose('idle');
};
setStood(stood);

// --- the gizmo -----------------------------------------------------------
//
// Handles in the viewport, over the same two tables the sliders write. Which
// one you reach for is a question about what you are judging: a slider is how
// you say "two centimetres further back", and a gizmo is how you find out that
// two centimetres further back is what you wanted.
//
// Both edit the tables directly and neither owns them, so a number dragged here
// moves the slider and a slider moves the handle.

const gizmo = new TransformControls(camera, canvas);
gizmo.setSize(0.72);
scene.add(gizmo.getHelper());
gizmo.getHelper().visible = false;

/**
 * Handles that point the way they mean, and nothing else.
 *
 * `TransformControls` draws each translate axis twice — an arrow at `+0.5` and
 * a mirrored one at `−0.5` — plus three plane squares and a centre octahedron.
 * That is eleven handles to say "three axes", and on an object the size of a
 * trumpet they meet in the middle of the thing being looked at. The mirrored
 * half carries no information a single arrow does not: the axis is a line and
 * dragging back along it is what negative is.
 *
 * **Removed rather than hidden**, because `TransformControlsGizmo` sets
 * `visible = true` on every handle at the top of each `updateMatrixWorld` and
 * then decides for itself which to hide — so anything switched off here would
 * come back on the next frame. The pickers go with them, or the arrows would be
 * gone and still draggable, which is worse than the clutter.
 *
 * By name for the compound handles, and **by where each part's geometry
 * actually is** for the mirrored arms — both halves of an axis carry that
 * axis's name, so the name cannot tell them apart. Not by `position` either:
 * `setupGizmo` bakes each handle's offset into its vertices and resets the
 * object to the origin, so every one of them reports `(0, 0, 0)` and a test on
 * that matches nothing at all. The bounding box is where the thing is.
 *
 * The axis shafts survive on the same test, and correctly: `lineGeometry2` runs
 * from the centre to `+0.5` and has no negative half to lose.
 *
 * If a three upgrade renames or re-centres them this finds nothing and the
 * gizmo is merely busy again.
 */
const GIZMO_CLUTTER = new Set(['XY', 'YZ', 'XZ', 'XYZ', 'E', 'XYZE']);
const spare: Object3D[] = [];
const middle = new Vector3();
// Collected first and removed after, because detaching mid-traversal skips the
// sibling that shuffles into the freed slot.
gizmo.getHelper().traverse((o) => {
  if (GIZMO_CLUTTER.has(o.name)) { spare.push(o); return; }
  const geometry = (o as Partial<Mesh>).geometry;
  if (!geometry) return;
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  geometry.boundingBox?.getCenter(middle);
  if (middle.x < -0.2 || middle.y < -0.2 || middle.z < -0.2) spare.push(o);
});
for (const o of spare) o.removeFromParent();

/**
 * A marker on each hand's rest contact — **the contact, not where the hand ends
 * up**, and the difference is the whole reason it is drawn.
 *
 * What a trim moves is the model's answer to `resolve({kind:'rest'})`. Where
 * the hand actually is at any moment is that answer blended some way toward the
 * player's hip, so a handle drawn on the *hand* would be a handle that stops
 * responding as you stand the player down, and would sit on their thigh at
 * full ease with a gizmo that still edited the instrument. This one is always
 * the thing being edited.
 *
 * ## It is a frame and not a ball
 *
 * A contact is a position, a normal and a knuckle axis, and the trim can turn
 * the last two. A sphere cannot show a rotation — spin one and nothing happens
 * — so the marker carries the two directions it is about to let you drag: a
 * stick out of the palm along the **normal**, and a shorter one across it along
 * **`along`**, the line the fingers lie on. Turning the handle turns those, and
 * you can see which way the palm ends up facing.
 *
 * The ball is the only pickable part. The sticks are what it is saying.
 *
 * `depthTest: false` throughout, because half of these sit inside the
 * instrument — which is frequently the fault being looked at.
 */
const HANDLE_BALL = new SphereGeometry(0.022, 14, 10);
/** Out of the palm, and across the knuckles. Long enough to read, short enough
 *  not to become the thing you are looking at. */
const NORMAL_LENGTH = 0.11;
const ALONG_LENGTH = 0.07;
const NORMAL_GEO = new CylinderGeometry(0.005, 0.001, NORMAL_LENGTH, 8);
const ALONG_GEO = new CylinderGeometry(0.004, 0.004, ALONG_LENGTH, 6);

function buildHandle(color: string): Mesh {
  const flat = (c: string): MeshBasicMaterial => new MeshBasicMaterial({
    color: c, depthTest: false, transparent: true, opacity: 0.9,
  });
  const ball = new Mesh(HANDLE_BALL, flat(color));
  ball.renderOrder = 999;
  ball.visible = false;
  // The marker's own axes are the contact's: **+y is the normal, +x is
  // `along`**. Every read and write of a hand's attitude goes through that one
  // sentence — `syncHandles` builds the quaternion from it and `readTurn`
  // takes it apart again — so the sticks are drawn along those axes rather than
  // placed by eye.
  const out = new Mesh(NORMAL_GEO, flat(color));
  out.position.y = NORMAL_LENGTH / 2;
  out.renderOrder = 999;
  ball.add(out);
  const across = new Mesh(ALONG_GEO, flat('#e8e4de'));
  across.rotation.z = Math.PI / 2;
  across.renderOrder = 999;
  ball.add(across);
  return ball;
}
const handles = ['#e0a24a', '#4ad0e0'].map(buildHandle);
for (const h of handles) scene.add(h);

type Selection = { kind: 'hand'; index: 0 | 1 } | { kind: 'instrument' };
let selected: Selection | undefined;
let gizmoMode: 'translate' | 'rotate' = 'translate';
let gizmoDragging = false;
let focused = false;

/** The drag's own frame: where it started, and the model's rotation then. */
const DRAG_FROM = new Vector3();
const DRAG_TURN = new Quaternion();
const DRAG_QUAT = new Quaternion();
const DRAG_QUAT_INV = new Quaternion();
let dragMove: readonly [number, number, number] = [0, 0, 0];
/** The trim's `turn` when the drag started, as a rotation to compose onto. */
const DRAG_TRIM_TURN = new Quaternion();

const EASE_EULER = new Euler();
const TURN_EULER = new Euler();
const SPIN = new Quaternion();
const SPARE_QUAT = new Quaternion();
const UP = new Vector3();
const SIDE = new Vector3();
const FWD = new Vector3();
const BASIS = new Matrix4();
const FOCUS = new Vector3();
const ray = new Raycaster();
const ndc = new Vector2();

/** The one exhibit the tuner works on. The grid is for looking, not editing. */
function tunedItem(): Exhibit | undefined {
  const item = live.length === 1 ? live[0] : undefined;
  return item?.model && item.rig ? item : undefined;
}

/** Where the seven numbers put the grip, into `easeNode`. */
function syncEase(item: Exhibit, down: number): void {
  const { model, rig, carry, easeNode } = item;
  if (!easeNode || !carry || !rig || !model) return;
  const e = AT_EASE[model.archetype];
  easeNode.position.copy(carry.pivot);
  if (!e) { easeNode.quaternion.identity(); return; }
  const size = down * rig.proportions.height / NOMINAL_HEIGHT;
  easeNode.quaternion.setFromEuler(EASE_EULER.set(
    e.pitch * down, (e.turn ?? 0) * down, e.roll * down, 'ZYX',
  ));
  easeNode.position.y -= e.drop * size;
  easeNode.position.z -= e.back * size;
  if (e.across) easeNode.position.x += e.across * size;
}

/**
 * And back: `easeNode` read as the seven numbers.
 *
 * The exact inverse of `syncEase`, which is what makes the gizmo trustworthy
 * rather than approximately right — drag it, and the pose the table produces on
 * the next frame is the pose the handles are already showing. Only ever read at
 * full stand-down: the table says where an instrument goes when it is *down*,
 * and solving it from a half-lowered one divides by the fraction and turns the
 * last centimetre of a drag into a large number.
 */
function readEase(item: Exhibit): void {
  const { model, rig, carry, easeNode } = item;
  if (!easeNode || !carry || !rig || !model) return;
  const e = easeEntry(model.archetype);
  const size = rig.proportions.height / NOMINAL_HEIGHT;
  EASE_EULER.setFromQuaternion(easeNode.quaternion, 'ZYX');
  e.pitch = EASE_EULER.x;
  e.turn = EASE_EULER.y;
  e.roll = EASE_EULER.z;
  e.across = (easeNode.position.x - carry.pivot.x) / size;
  e.drop = (carry.pivot.y - easeNode.position.y) / size;
  e.back = (carry.pivot.z - easeNode.position.z) / size;
}

/**
 * Both markers onto the contacts they stand for, and out of the way otherwise.
 *
 * The attitude is built from the contact's own two directions, in the frame the
 * marker declares: `+y` the normal, `+x` `along`. A model that answers no
 * `along` — a drum, where a fist round a stick looks the same at any roll — has
 * no opinion about the third axis, so any perpendicular will do and the one
 * chosen is stable frame to frame rather than drawn fresh, or the knuckle stick
 * would spin on its own.
 */
function syncHandles(item: Exhibit | undefined): void {
  const shown = !tuner.hidden && pose === 'idle' && item?.model !== undefined;
  for (let k = 0; k < 2; k++) {
    const handle = handles[k]!;
    // Never while the gizmo has it: this is the drag, and re-reading the
    // contact under it would fight the pointer.
    if (gizmoDragging && selected?.kind === 'hand' && selected.index === k) continue;
    const model = item?.model;
    const contact = shown && model
      ? model.resolve(REST, handOf(item, k as 0 | 1))
      : undefined;
    handle.visible = contact !== undefined;
    if (!contact || !model) continue;
    handle.position.copy(contact.position).applyMatrix4(model.root.matrixWorld);
    model.root.getWorldQuaternion(QUAT);
    UP.copy(contact.normal).applyQuaternion(QUAT).normalize();
    if (contact.along) SIDE.copy(contact.along).applyQuaternion(QUAT);
    else SIDE.set(1, 0, 0).applyQuaternion(QUAT);
    // Orthogonalised against the normal, exactly as `Contact.along` promises it
    // will be — the model is allowed to hand over an axis that is only roughly
    // perpendicular.
    SIDE.addScaledVector(UP, -SIDE.dot(UP));
    if (SIDE.lengthSq() < 1e-8) SIDE.set(0, 0, 1).applyQuaternion(QUAT).addScaledVector(UP, 0);
    SIDE.normalize();
    FWD.crossVectors(SIDE, UP);
    BASIS.makeBasis(SIDE, UP, FWD);
    handle.quaternion.setFromRotationMatrix(BASIS);
  }
}

function select(next: Selection | undefined): void {
  const item = tunedItem();
  selected = item ? next : undefined;
  gizmo.detach();
  gizmo.getHelper().visible = false;
  if (!selected || !item) { focused = false; paintGizmoButtons(); drawTuner(); return; }

  // Everything the gizmo edits is about a player who is not playing.
  setPose('idle');
  if (selected.kind === 'instrument') {
    if (!item.easeNode || !item.model) { selected = undefined; drawTuner(); return; }
    // At full stand-down, because that is the pose the table states. See `readEase`.
    setStood(1);
    easeEntry(item.model.archetype);
    syncEase(item, 1);
    gizmo.attach(item.easeNode);
    gizmo.setMode(gizmoMode);
  } else {
    syncHandles(item);
    gizmo.attach(handles[selected.index]!);
    gizmo.setMode(gizmoMode);
  }
  gizmo.getHelper().visible = true;
  paintGizmoButtons();
  drawTuner();
}

gizmo.addEventListener('dragging-changed', (e) => {
  gizmoDragging = e.value === true;
  // One drag, one undo step — the same rule the sliders keep. Taken before the
  // `item` test, so a drag on an exhibit that has gone away still closes its
  // step rather than leaving one open across the next edit.
  if (gizmoDragging) beginEdit();
  const item = tunedItem();
  if (!item?.model) return;
  if (gizmoDragging && selected?.kind === 'hand') {
    // Everything a hand drag is measured against, frozen at the first frame of
    // it: where the marker was, how it was turned, and how the model was —
    // because both of the first two move as the trim being written takes
    // effect, and a ruler that moves with the thing it is measuring reads zero.
    const handle = handles[selected.index]!;
    DRAG_FROM.copy(handle.position);
    DRAG_TURN.copy(handle.quaternion);
    item.model.root.getWorldQuaternion(DRAG_QUAT);
    DRAG_QUAT_INV.copy(DRAG_QUAT).invert();
    const was = handTrim(item, selected.index);
    dragMove = was.move ?? [0, 0, 0];
    DRAG_TRIM_TURN.setFromEuler(
      TURN_EULER.set(was.turn?.[0] ?? 0, was.turn?.[1] ?? 0, was.turn?.[2] ?? 0, 'XYZ'),
    );
  }
  if (!gizmoDragging) { commitEdit(); drawTuner(); }
});

/** Which effector a hand index names on this exhibit. See `restPose`. */
function handOf(item: Exhibit, index: 0 | 1): 'left-hand' | 'right-hand' | 'bow' {
  return index === 0 ? 'left-hand' : item.usesBow ? 'bow' : 'right-hand';
}

/** This hand's entry, made if the table has none. */
function handTrim(item: Exhibit, index: 0 | 1): HandTrim {
  const a = item.model!.archetype;
  const trim: RestTrim = REST_TRIM[a] ?? (REST_TRIM[a] = {});
  const hand = handOf(item, index);
  return trim[hand] ?? (trim[hand] = {});
}

gizmo.addEventListener('objectChange', () => {
  const item = tunedItem();
  if (!item?.model || !selected) return;
  if (selected.kind === 'instrument') { readEase(item); repaintRows(); return; }

  const handle = handles[selected.index]!;
  const trim = handTrim(item, selected.index);
  if (gizmoMode === 'rotate') {
    // The turn the drag has put on the marker, carried from world into the
    // model's frame — `q_model⁻¹ · Δ · q_model` — and composed onto whatever
    // the trim already said. Left-composed, because `trimRest` applies the
    // stored rotation *to* the model's normal, so a new turn happens after it.
    SPIN.copy(handle.quaternion).multiply(SPARE_QUAT.copy(DRAG_TURN).invert());
    SPIN.premultiply(DRAG_QUAT_INV).multiply(DRAG_QUAT).multiply(DRAG_TRIM_TURN);
    TURN_EULER.setFromQuaternion(SPIN, 'XYZ');
    trim.turn = [TURN_EULER.x, TURN_EULER.y, TURN_EULER.z];
  } else {
    // The world delta, turned into the model's own frame — the frame a trim is
    // written in, and taken from the rotation the drag started with so that an
    // instrument moving under the hand cannot bend the line being dragged.
    const local = P.copy(handle.position).sub(DRAG_FROM).applyQuaternion(DRAG_QUAT_INV);
    trim.move = [dragMove[0] + local.x, dragMove[1] + local.y, dragMove[2] + local.z];
  }
  repaintRows();
});

function pickAt(ev: PointerEvent): void {
  const item = tunedItem();
  if (tuner.hidden || !item?.model) return;
  const box = canvas.getBoundingClientRect();
  ndc.set(
    ((ev.clientX - box.left) / box.width) * 2 - 1,
    -((ev.clientY - box.top) / box.height) * 2 + 1,
  );
  ray.setFromCamera(ndc, camera);
  const onHandle = ray.intersectObjects(handles.filter((h) => h.visible), false)[0];
  const index = onHandle ? handles.findIndex((h) => h === onHandle.object) : -1;
  if (index >= 0) {
    select({ kind: 'hand', index: index as 0 | 1 });
    return;
  }
  // Anywhere on the instrument selects the instrument, which is the only other
  // thing on this page with a pose.
  if (item.easeNode && ray.intersectObject(item.model.root, true).length) {
    select({ kind: 'instrument' });
    return;
  }
  select(undefined);
}

/** The mode buttons, showing what the gizmo is actually doing. */
function paintGizmoButtons(): void {
  turnButton.disabled = selected === undefined;
  moveButton.disabled = selected === undefined;
  moveButton.classList.toggle('on', selected !== undefined && gizmoMode === 'translate');
  turnButton.classList.toggle('on', selected !== undefined && gizmoMode === 'rotate');
}

function setGizmoMode(next: 'translate' | 'rotate'): void {
  gizmoMode = next;
  if (selected) gizmo.setMode(next);
  paintGizmoButtons();
}
moveButton.onclick = () => setGizmoMode('translate');
turnButton.onclick = () => setGizmoMode('rotate');

// --- the idle tuner ------------------------------------------------------
//
// Sliders over the two tables in `at-ease.ts`, and a button that prints what
// you moved as source to paste back.
//
// It writes into the imported tables directly rather than keeping a shadow copy
// beside them, which is the whole reason a pose dialled in here is a pose the
// show takes: there is one set of numbers, the runtime reads it live, and there
// is no second version to fall out of agreement. What that costs is that the
// page is now *lying* about the source until you paste — so the head says how
// many archetypes are edited, and `reset` puts any of them back.
//
// It does not write files. A dev server that patched TypeScript from a browser
// would be a considerably larger thing than this page, and the numbers are two
// table entries: the print is a paste, not a workaround for a missing feature.

type EaseKey = 'pitch' | 'roll' | 'turn' | 'drop' | 'back' | 'across' | 'hands0' | 'hands1';
type TrimHand = 'left-hand' | 'right-hand' | 'bow';

type Knob =
  | { kind: 'ease'; key: EaseKey; label: string; min: number; max: number; step: number }
  | { kind: 'trim'; hand: TrimHand; field: 'move' | 'turn'; axis: 0 | 1 | 2; label: string };

const EASE_KNOBS: readonly Knob[] = [
  // Angles first, in the order `AtEasePose` declares them, and over the whole
  // half-turn each: `violin` uses 2.83 rad, so a range that stopped at π/2
  // would be a slider that could not reach the one pose already in the table.
  { kind: 'ease', key: 'pitch', label: 'pitch', min: -3.2, max: 3.2, step: 0.01 },
  { kind: 'ease', key: 'roll', label: 'roll', min: -3.2, max: 3.2, step: 0.01 },
  { kind: 'ease', key: 'turn', label: 'turn', min: -3.2, max: 3.2, step: 0.01 },
  // Then the lengths, in metres against a 1.75 m body. A metre of drop is a
  // bell on the boards, which is past anything and short of absurd.
  { kind: 'ease', key: 'drop', label: 'drop', min: -0.3, max: 1, step: 0.005 },
  { kind: 'ease', key: 'back', label: 'back', min: -0.4, max: 0.6, step: 0.005 },
  { kind: 'ease', key: 'across', label: 'across', min: -0.5, max: 0.5, step: 0.005 },
  { kind: 'ease', key: 'hands0', label: 'let go L', min: 0, max: 1, step: 0.01 },
  { kind: 'ease', key: 'hands1', label: 'let go R', min: 0, max: 1, step: 0.01 },
];

/** How far a trim slider reaches, either way. A hand's whole span, and a wrist's. */
const TRIM_REACH = 0.35;
const TRIM_STEP = 0.002;
const TURN_REACH = Math.PI;
const TURN_STEP = 0.01;

function trimKnobs(hand: TrimHand, field: 'move' | 'turn'): Knob[] {
  return ([0, 1, 2] as const).map((axis) => ({
    kind: 'trim' as const, hand, field, axis, label: 'xyz'[axis]!,
  }));
}

/**
 * `AT_EASE` as the file has it, snapshotted before anything can edit it.
 *
 * Taken at module load and above `restoreTuning`, which is load-bearing rather
 * than tidy: it is what `reset` puts back and what "edited" is measured
 * against, and a snapshot taken after the stored overrides had been applied
 * would call an edited table pristine and have nothing to restore it to.
 * `REST_TRIM` needs no equivalent — empty is its source state and its reset.
 */
const SOURCE_AT_EASE = JSON.parse(JSON.stringify(AT_EASE)) as Partial<Record<Archetype, AtEasePose>>;

/** What a missing entry answers, per knob. See `easeEntry`. */
function easeValue(e: AtEasePose | undefined, key: EaseKey): number {
  if (!e) return key === 'hands0' || key === 'hands1' ? 1 : 0;
  switch (key) {
    case 'pitch': return e.pitch;
    case 'roll': return e.roll;
    case 'turn': return e.turn ?? 0;
    case 'drop': return e.drop;
    case 'back': return e.back;
    case 'across': return e.across ?? 0;
    case 'hands0': return e.hands[0];
    case 'hands1': return e.hands[1];
  }
}

/**
 * This archetype's at-ease entry, made if it has none.
 *
 * A fresh one is a no-op by construction — no rotation, no movement, and both
 * hands letting go completely — which is exactly what an archetype with no
 * entry already does. So creating one on the first touch of a slider changes
 * nothing until a slider is actually moved, and the half of the catalogue that
 * hangs where its strap left it can be given a pose without the table having to
 * be edited by hand first.
 */
function easeEntry(a: Archetype): AtEasePose {
  const cur = AT_EASE[a];
  if (cur) return cur;
  const fresh: AtEasePose = { pitch: 0, roll: 0, drop: 0, back: 0, hands: [1, 1] };
  AT_EASE[a] = fresh;
  return fresh;
}

function readKnob(a: Archetype, knob: Knob): number {
  if (knob.kind === 'ease') return easeValue(AT_EASE[a], knob.key);
  return REST_TRIM[a]?.[knob.hand]?.[knob.field]?.[knob.axis] ?? 0;
}

function writeKnob(a: Archetype, knob: Knob, v: number): void {
  if (knob.kind === 'trim') {
    const trim: RestTrim = REST_TRIM[a] ?? (REST_TRIM[a] = {});
    const hand: HandTrim = trim[knob.hand] ?? (trim[knob.hand] = {});
    const cur = hand[knob.field] ?? [0, 0, 0];
    const next: [number, number, number] = [cur[0]!, cur[1]!, cur[2]!];
    next[knob.axis] = v;
    hand[knob.field] = next;
    return;
  }
  const e = easeEntry(a);
  switch (knob.key) {
    case 'pitch': e.pitch = v; break;
    case 'roll': e.roll = v; break;
    case 'turn': e.turn = v; break;
    case 'drop': e.drop = v; break;
    case 'back': e.back = v; break;
    case 'across': e.across = v; break;
    case 'hands0': e.hands = [v, e.hands[1]]; break;
    case 'hands1': e.hands = [e.hands[0], v]; break;
  }
}

/** Knob by knob rather than by structural comparison: key order differs. */
function easeEdited(a: Archetype): boolean {
  const cur = AT_EASE[a];
  const src = SOURCE_AT_EASE[a];
  if (!cur && !src) return false;
  return EASE_KNOBS.some((k) => k.kind === 'ease'
    && Math.abs(easeValue(cur, k.key) - easeValue(src, k.key)) > 1e-9);
}

function trimEdited(a: Archetype): boolean {
  const trim = REST_TRIM[a];
  if (!trim) return false;
  return (['left-hand', 'right-hand', 'bow'] as const).some((h) => {
    const hand = trim[h];
    return hand !== undefined && (['move', 'turn'] as const)
      .some((f) => (hand[f] ?? []).some((v) => Math.abs(v) > 1e-9));
  });
}

function tuned(): Archetype[] {
  const seen = new Set<Archetype>([
    ...Object.keys(AT_EASE), ...Object.keys(SOURCE_AT_EASE), ...Object.keys(REST_TRIM),
  ] as Archetype[]);
  return [...seen].filter((a) => easeEdited(a) || trimEdited(a)).sort();
}

/**
 * What a save would write, as the file would have it.
 *
 * The same functions the dev server uses — see `at-ease-edit.ts` — so the box
 * under the buttons is not a preview of the save, it is the save's own output.
 * There is nowhere for the two to disagree.
 */
function tunerSource(): string {
  const list = tuned();
  if (!list.length) return 'Nothing edited.';
  const ease = list.flatMap((a) => {
    const e = AT_EASE[a];
    return e ? [`  ${keyOf(a)}: ${easeEntrySource(e)},`] : [];
  });
  const trim = list.flatMap((a) => {
    const t = REST_TRIM[a];
    const text = t ? trimEntrySource(t) : '';
    return text ? [`  ${keyOf(a)}: ${text},`] : [];
  });
  const out: string[] = [];
  if (ease.length) out.push(`// AT_EASE — ${AT_EASE_FILE}`, ...ease);
  if (trim.length) {
    if (out.length) out.push('');
    out.push(
      `// REST_TRIM — ${AT_EASE_FILE}`,
      '// Better applied at source, in each model\'s own rest contact.',
      ...trim,
    );
  }
  return out.join('\n');
}

/** Everything edited, as the save route wants it. See `at-ease-edit.ts`. */
function tuningBody(): Tuning {
  const body: Tuning = { atEase: {}, restTrim: {} };
  for (const a of tuned()) {
    const e = AT_EASE[a];
    if (e && easeEdited(a)) body.atEase[a] = e;
    const t = REST_TRIM[a];
    if (t && trimEdited(a)) body.restTrim[a] = t;
  }
  return body;
}

/**
 * Write the tables, through the dev server.
 *
 * On success the page reloads rather than carrying on, and the stored overrides
 * go with it: the numbers are in the file now, so a page still holding them as
 * *overrides* would show the same pose and lie about where it came from — the
 * head would say `edited, not in source` about a table that is exactly the
 * source. A reload is also the only honest confirmation available, since what
 * comes back up is read from the file that was just written.
 */
async function saveTables(): Promise<void> {
  const list = tuned();
  if (!list.length) {
    tunerOut.textContent = 'Nothing edited.';
    tunerOut.hidden = false;
    return;
  }
  tunerOut.textContent = `saving ${list.length}…`;
  tunerOut.hidden = false;
  try {
    const res = await fetch(SAVE_ROUTE, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(tuningBody()),
    });
    const answer = await res.json() as { ok?: boolean; error?: string };
    if (!res.ok || !answer.ok) throw new Error(answer.error ?? `HTTP ${res.status}`);
    localStorage.removeItem(STORE_KEY);
    location.reload();
  } catch (e) {
    tunerOut.textContent = [
      `Could not save: ${String(e)}`,
      '',
      'The route is the dev server\'s and exists only under `npm run dev`.',
      'Paste this instead:',
      '',
      tunerSource(),
    ].join('\n');
  }
}

const STORE_KEY = 'models.idle-tuning';

function saveTuning(): void {
  const state = {
    atEase: {} as Record<string, AtEasePose>,
    restTrim: {} as Record<string, RestTrim>,
  };
  for (const a of tuned()) {
    const e = AT_EASE[a];
    if (e && easeEdited(a)) state.atEase[a] = e;
    const t = REST_TRIM[a];
    if (t && trimEdited(a)) state.restTrim[a] = t;
  }
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch { /* a page that cannot write its scratch pad still tunes. */ }
}

function restoreTuning(): void {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw) as {
      atEase?: Record<string, AtEasePose>; restTrim?: Record<string, RestTrim>;
    };
    Object.assign(AT_EASE, state.atEase ?? {});
    Object.assign(REST_TRIM, state.restTrim ?? {});
  } catch { /* and one that cannot read it starts clean rather than not at all. */ }
}

function resetTuning(only?: Archetype): void {
  beginEdit();
  for (const a of only ? [only] : tuned()) {
    const src = SOURCE_AT_EASE[a];
    if (src) AT_EASE[a] = JSON.parse(JSON.stringify(src)) as AtEasePose;
    else delete AT_EASE[a];
    delete REST_TRIM[a];
  }
  commitEdit();
  drawTuner();
}

// --- undo ------------------------------------------------------------------
//
// Whole-state snapshots rather than a log of what changed, because the state is
// two small objects of numbers and the alternative is an inverse operation per
// kind of edit — one for a slider, one for each gizmo mode, one for each reset
// — every one of which is a second description of the edit that can disagree
// with the first. Copying the tables costs a few microseconds on a page where
// the only thing that writes them is a person.
//
// **What an undo step is, is a gesture and not a value.** A slider dragged
// across its range fires `input` on every pixel and a gizmo fires
// `objectChange` on every frame of a drag; pushing each one would make Ctrl+Z
// replay the drag backwards a hundredth at a time. So the snapshot is taken
// when a gesture starts and pushed when it ends, and `beginEdit` is idempotent
// so the hundred `input` events in the middle are one step.

interface Snapshot {
  atEase: Partial<Record<Archetype, AtEasePose>>;
  restTrim: Partial<Record<Archetype, RestTrim>>;
}

/** Deep enough, and the reason it can be this blunt: it is all numbers. */
function snapshot(): Snapshot {
  return JSON.parse(JSON.stringify({ atEase: AT_EASE, restTrim: REST_TRIM })) as Snapshot;
}

function restore(state: Snapshot): void {
  // Emptied in place rather than reassigned: `at-ease.ts` exports the tables and
  // every reader — the show included — holds the object, not a reference this
  // file could swap.
  for (const k of Object.keys(AT_EASE)) delete AT_EASE[k as Archetype];
  for (const k of Object.keys(REST_TRIM)) delete REST_TRIM[k as Archetype];
  Object.assign(AT_EASE, state.atEase);
  Object.assign(REST_TRIM, state.restTrim);
}

/** Far past anything a session does by hand, and short of holding a session. */
const UNDO_DEPTH = 200;
const past: Snapshot[] = [];
const future: Snapshot[] = [];
let pending: Snapshot | undefined;

/** The state before this gesture. Idempotent — see the note above. */
function beginEdit(): void {
  pending ??= snapshot();
}

function commitEdit(): void {
  if (!pending) return;
  // A gesture that changed nothing is not a step. `reset all` with nothing
  // edited, or a slider dragged out and back — both end where they began, and
  // an undo that visibly does nothing is worse than no undo, because it eats a
  // press somebody meant for the edit before it.
  if (JSON.stringify(pending) === JSON.stringify(snapshot())) { pending = undefined; return; }
  past.push(pending);
  if (past.length > UNDO_DEPTH) past.shift();
  pending = undefined;
  // A new edit is a new branch: whatever was undone past this point is gone,
  // which is what every editor does and what stops redo replaying a history
  // that no longer leads anywhere.
  future.length = 0;
  saveTuning();
  // The hint carries the depth, and a step just landed on it. Not the whole
  // panel: a `change` fires the moment a slider is released and rebuilding the
  // rows under the pointer would take the next drag with it.
  drawHint();
}

function undo(): void {
  const step = past.pop();
  if (!step) return;
  future.push(snapshot());
  restore(step);
  pending = undefined;
  saveTuning();
  drawTuner();
}

function redo(): void {
  const step = future.pop();
  if (!step) return;
  past.push(snapshot());
  restore(step);
  pending = undefined;
  saveTuning();
  drawTuner();
}

/**
 * The head alone.
 *
 * Its own function because a slider must be able to refresh the edited count
 * without rebuilding the panel underneath the pointer that is dragging it.
 */
function drawHead(subject: string): void {
  const count = tuned().length;
  tunerHead.innerHTML = count
    ? `${subject} · <span class="edited">${count} archetype${count === 1 ? '' : 's'} edited, not in source</span>`
    : subject;
}

/**
 * Every slider's own repaint, for when something *else* moved its number.
 *
 * Which is the gizmo, and it is the reason these are kept rather than the rows
 * being rebuilt: a panel replaced under a pointer that is mid-drag loses the
 * drag. So dragging a handle repaints the numbers in place and the rows stay.
 */
let rowPainters: (() => void)[] = [];
function repaintRows(): void {
  for (const paint of rowPainters) paint();
}

/**
 * What the gizmo can be put on, as buttons.
 *
 * Clicking the thing itself works and is the better gesture, and it is not
 * enough on its own: a trumpet is four millimetres of tube on screen and the
 * balls on its contacts are smaller than that. A list also answers the question
 * a viewport cannot, which is *what is there to edit here* — a drum kit has two
 * hands and no instrument pose, and nothing about the picture says so.
 */
function drawPicker(item: Exhibit | undefined): void {
  const picker = document.getElementById('tunerPick')!;
  picker.replaceChildren();
  if (!item?.model) return;
  const options: [string, Selection | undefined][] = [];
  if (item.easeNode) options.push(['instrument', { kind: 'instrument' }]);
  if (specFor(item.model.archetype).hands > 0) {
    options.push(['left hand', { kind: 'hand', index: 0 }]);
    options.push([item.usesBow ? 'bow hand' : 'right hand', { kind: 'hand', index: 1 }]);
  }
  options.push(['none', undefined]);
  for (const [label, target] of options) {
    const button = document.createElement('button');
    button.textContent = label;
    const on = target === undefined
      ? selected === undefined
      : target.kind === 'instrument'
        ? selected?.kind === 'instrument'
        : selected?.kind === 'hand' && selected.index === target.index;
    button.classList.toggle('on', on);
    button.onclick = () => select(target);
    picker.append(button);
  }
}

/** What the keys do, once there is something for them to do it to. */
function drawHint(): void {
  const hint = document.getElementById('tunerHint')!;
  const undoable = past.length
    ? ` · ⌘Z undoes ${past.length}${future.length ? `, ⇧⌘Z redoes ${future.length}` : ''}`
    : '';
  hint.textContent = (selected
    ? 'drag the handles · F frames it · G moves, R turns · Esc clears'
    : 'pick one above, or click it on the model') + undoable;
}

function drawTuner(): void {
  if (tuner.hidden) return;
  tunerRows.replaceChildren();
  rowPainters = [];
  const item = tunedItem();
  drawPicker(item);
  drawHint();
  const model = item?.model;

  if (!model || !item?.rig) {
    drawHead(live.length === 1 ? 'no performer — turn one on' : 'pick one exhibit');
    return;
  }
  const a = model.archetype;
  const spec = specFor(a);
  drawHead(`<b>${a}</b> — keyed by archetype, so every exhibit of one shares these`);

  const section = (title: string): void => {
    const h = document.createElement('h4');
    h.textContent = title;
    tunerRows.append(h);
  };
  const add = (knob: Knob): void => {
    const turning = knob.kind === 'trim' && knob.field === 'turn';
    const reach = turning ? TURN_REACH : TRIM_REACH;
    const min = knob.kind === 'ease' ? knob.min : -reach;
    const max = knob.kind === 'ease' ? knob.max : reach;
    const step = knob.kind === 'ease' ? knob.step : turning ? TURN_STEP : TRIM_STEP;
    const row = document.createElement('label');
    row.className = 'row';
    const name = document.createElement('span');
    name.textContent = knob.label;
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    const shown = document.createElement('b');
    const digits = step < 0.005 ? 3 : 2;
    const paint = (): void => {
      const v = readKnob(a, knob);
      slider.value = String(v);
      shown.textContent = v.toFixed(digits);
      row.classList.toggle('moved', Math.abs(v) > 1e-9);
    };
    slider.oninput = () => {
      // One drag, one undo step. `input` fires per pixel and per arrow key;
      // `change` fires once at the end of either, which is where it is pushed.
      beginEdit();
      writeKnob(a, knob, Number(slider.value));
      paint();
      // The head carries the edited count, and this may be the edit that
      // changed it. The model itself redraws on the next frame by itself.
      drawHead(`<b>${a}</b> — keyed by archetype, so every exhibit of one shares these`);
    };
    slider.onchange = commitEdit;
    paint();
    rowPainters.push(paint);
    row.append(name, slider, shown);
    tunerRows.append(row);
  };

  if (spec.held) {
    section('at ease — where the instrument goes');
    EASE_KNOBS.forEach(add);
  } else {
    section('at ease');
    const note = document.createElement('div');
    note.className = 'note';
    note.textContent = 'Stands on the floor — nothing to lower. '
      + 'The hands still stand down, to the hips and out of the case.';
    tunerRows.append(note);
  }

  if (spec.hands > 0) {
    for (const hand of ['left-hand', item.usesBow ? 'bow' : 'right-hand'] as const) {
      // A model that answers nothing for this hand has nothing to trim, and a
      // slider that moves a number nobody reads is worse than no slider.
      const contact = model.resolve(REST, hand);
      if (!contact) continue;
      section(`${hand} — where it sits`);
      trimKnobs(hand, 'move').forEach(add);
      section(`${hand} — which way it faces`);
      trimKnobs(hand, 'turn').forEach(add);
      // A model with no knuckle axis has no opinion about roll, and the third
      // slider is turning something the hand rig is free to ignore.
      if (!contact.along) {
        const note = document.createElement('div');
        note.className = 'note';
        note.textContent = 'This model gives no knuckle axis, so roll is the rig’s to pick.';
        tunerRows.append(note);
      }
    }
  }
}

tuneButton.onclick = () => {
  tuner.hidden = !tuner.hidden;
  tuneButton.classList.toggle('on', !tuner.hidden);
  tunerOut.hidden = true;
  if (tuner.hidden) select(undefined);
  drawTuner();
};
document.getElementById('tunerSave')!.onclick = () => void saveTables();
document.getElementById('tunerCopy')!.onclick = () => {
  const text = tunerSource();
  tunerOut.textContent = text;
  tunerOut.hidden = false;
  void navigator.clipboard?.writeText(text).catch(() => {});
};
document.getElementById('tunerReset')!.onclick = () => {
  const a = tunedItem()?.model?.archetype;
  if (a) resetTuning(a);
};
document.getElementById('tunerClear')!.onclick = () => resetTuning();
setGizmoMode(gizmoMode);

let dragging = false;
let yaw = 0;
let pitch = 0.15;
/** How far the pointer travelled while down, so a click is not a small orbit. */
let travelled = 0;
/** A click has to be a click. Below this, it selects; above, it turned the view. */
const CLICK_SLOP = 4;

canvas.addEventListener('pointerdown', (e) => {
  // `gizmo.axis` is set while the pointer is over one of its handles, which is
  // the cheapest honest test for "the gizmo is about to take this".
  if (gizmo.axis) return;
  travelled = 0;
  dragging = true;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointerup', (e) => {
  const wasDragging = dragging;
  dragging = false;
  if (wasDragging && travelled <= CLICK_SLOP) pickAt(e);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  travelled += Math.abs(e.movementX) + Math.abs(e.movementY);
  if (travelled <= CLICK_SLOP) return;
  yaw -= e.movementX * 0.006;
  pitch = Math.max(-0.4, Math.min(1.2, pitch + e.movementY * 0.004));
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoom = Math.max(0.3, Math.min(3, zoom * Math.exp(e.deltaY * 0.0012)));
}, { passive: false });
window.addEventListener('keydown', (e) => {
  /**
   * Undo first, and above the slider guard rather than below it.
   *
   * A slider owns the arrow keys while it has the focus — taking those would
   * switch exhibits out from under somebody nudging a number by a hundredth —
   * and it owns nothing else. `Ctrl+Z` in a focused range input does nothing at
   * all natively, so the guard that protects the arrows would swallow the undo
   * of the very edit that focused it.
   *
   * `metaKey` as well as `ctrl`, because this is a Mac and `⌘Z` is the muscle
   * memory. Both spellings of redo: `⇧⌘Z` and `Ctrl+Y`.
   */
  const accel = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();
  if (accel && (key === 'z' || key === 'y')) {
    e.preventDefault();
    if (key === 'y' || e.shiftKey) redo(); else undo();
    return;
  }
  if (accel) return;
  // A slider has the arrow keys while it has the focus, and taking them would
  // switch exhibits out from under somebody nudging a number by a hundredth.
  if (e.target instanceof HTMLInputElement) return;
  if (e.key === 'ArrowRight') (document.getElementById('next') as HTMLButtonElement).click();
  if (e.key === 'ArrowLeft') (document.getElementById('prev') as HTMLButtonElement).click();
  if (e.key === 'f' || e.key === 'F') {
    // Frames what is selected, and only what is selected: there is nothing to
    // focus on otherwise, and resetting the camera would be a different key.
    if (!selected) return;
    focused = true;
    zoom = 0.45;
  }
  if (e.key === 'g' || e.key === 'G') setGizmoMode('translate');
  if (e.key === 'r' || e.key === 'R') setGizmoMode('rotate');
  if (e.key === 'Escape') { focused = false; zoom = 1; select(undefined); }
});

function resize(): void {
  const w = canvas.clientWidth || canvas.width || window.innerWidth;
  const h = canvas.clientHeight || canvas.height || window.innerHeight;
  if (w <= 0 || h <= 0) return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);
resize();

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  // The turntable stops for a selection. A gizmo is a handle in a fixed place
  // and the thing it is attached to walking out from under it is not editing.
  if (spinning.checked && !dragging && !selected) spin += dt * 0.35;
  stand.rotation.y = spin + yaw;
  // Models settle against the one clock in the show; here, wall time will do.
  // The rig wants the same clock in seconds, and it wants it *after* the
  // frame's `setEffector` calls — the arrangement `animate.ts` keeps.
  for (const item of live) {
    applyPose(item);
    item.model?.update(now / 1000);
    /**
     * The machine gets the same clock, wrapped to its one bar.
     *
     * It holds a whole number's pattern in the show and walks a cursor through
     * it once; the bench has a bar and runs forever, so the clock is what
     * repeats. Going backwards is the path the machine already has for a number
     * restarting — it rewinds the cursor and clears the lamps — which is
     * exactly what a loop point is.
     */
    item.machine?.update((now / 1000) % MACHINE_BEATS_PER_BAR);
    item.rig?.update(now / 1000, dt);
  }

  // After the poses, because both of these stand on where a pose put something.
  // The gizmo's own node is left alone while it is being dragged — that is the
  // one direction the table and the transform disagree, and `readEase` has
  // already taken the transform's side.
  const editable = tunedItem();
  syncHandles(editable);
  if (editable && !(gizmoDragging && selected?.kind === 'instrument')) {
    syncEase(editable, pose === 'play' ? 0 : stood);
  }

  // Framed on the selection, recomputed rather than remembered: the turntable
  // moves the whole exhibit, so a focus point frozen at the keypress would slide
  // off the thing it was pointed at the moment anything turned.
  const target = focusPoint(FOCUS) ?? FOCUS.set(0, mode === 'grid' ? 0 : 1.0, 0);
  camera.position.set(
    target.x,
    Math.max(0.3, target.y + (mode === 'grid' ? 8 : 0.5) + pitch * 2),
    target.z + dist * zoom,
  );
  camera.lookAt(target);

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

/** What `F` framed, in world space, or nothing where the camera is at rest. */
function focusPoint(out: Vector3): Vector3 | undefined {
  if (!focused || !selected) return undefined;
  if (selected.kind === 'hand') return out.copy(handles[selected.index]!.position);
  const node = tunedItem()?.easeNode;
  return node ? node.getWorldPosition(out) : undefined;
}

// Before the first build, so the exhibit that comes up already has whatever was
// being dialled in when the page was last closed. See `restoreTuning`.
restoreTuning();
showOne();
requestAnimationFrame(frame);
