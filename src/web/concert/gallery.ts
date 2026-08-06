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
 * and is not: **three** archetypes build genuinely different objects depending
 * on
 * what was decided *before* the renderer was called — two, and `entries()`
 * below special-cases exactly the two the next sentence names — and enumerating
 * archetypes shows one of each and hides the rest. A synthesiser is a modular
 * wall, a polysynth or a digital slab depending on `Performer.rig`; a kit is
 * drums or pads depending on the number's `DrumSource`. Five objects reached
 * the stage that this page could not be made to draw — including, at the time
 * of writing, the two rigs someone was actively editing.
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
 * The player can be put in either of the two poses that matter: waiting at the
 * instrument, and playing it. Both come from the model's own `resolve`, so a
 * hand that lands in the wrong place here lands in the wrong place on stage.
 */

import {
  AmbientLight, AxesHelper, Box3, Color, DirectionalLight, Group, GridHelper, Mesh,
  MeshBasicMaterial, PerspectiveCamera, Quaternion, Scene, SphereGeometry, Vector3,
  WebGLRenderer,
} from 'three';

import { ARCHETYPES, SYNTH_RIGS, specFor } from '../../concert/instruments.js';
import type {
  Archetype, ArchetypeSpec, Effector, Look, Performer, PlayPoint, SynthRigId,
} from '../../concert/types.js';
import type { DrumEvent } from '../../core/types.js';
import {
  buildDrumMachine, type DrumMachine, type DrumMachineOptions,
} from './instruments/drum-machine.js';
import { buildInstrumentFor } from './instruments/index.js';
import type { InstrumentModel } from './instruments/types.js';
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

scene.add(new AmbientLight('#8899bb', 1.1));
const key = new DirectionalLight('#fff3e0', 1.5);
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
}

let live: Exhibit[] = [];
let mode: 'one' | 'grid' = 'one';
let pose: 'idle' | 'play' = 'play';
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
      position: [0, 0, 0], facing: 0, posture: ARCHETYPES[archetype].posture, riser: 0,
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
const QUAT = new Quaternion();
/** Effectors a model may answer for both hands at once. See `separateRest`. */
const HANDS: ReadonlySet<Effector> = new Set<Effector>(['left-hand', 'right-hand', 'bow']);

/**
 * Put one exhibit's rig where the stance says, in world space.
 *
 * `Contact` is in the model's own local frame and `setEffector` wants world, so
 * everything goes through the model's world matrix — which for a carried
 * instrument is the player's torso and moves with them, exactly as in `show.ts`.
 */
function applyPose(item: Exhibit): void {
  const { model, rig } = item;
  if (!rig || !model) return;
  const playing = pose === 'play';
  const spec = specFor(model.archetype);

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

  rig.root.updateWorldMatrix(true, false);
  model.root.updateWorldMatrix(true, false);
  model.root.getWorldQuaternion(QUAT);

  for (const [effector, point] of playing ? item.playing : item.waiting) {
    const contact = model.resolve(point, effector);
    if (!contact) continue;
    P.copy(contact.position).applyMatrix4(model.root.matrixWorld);
    // A rest is often one point for both hands — a kit's, a horn's, a
    // microphone's — and sending both there puts one inside the other.
    if (!playing && HANDS.has(effector)) rig.separateRest(effector, P, P);
    rig.setEffector(
      effector,
      P,
      N.copy(contact.normal).applyQuaternion(QUAT),
      contact.along ? A.copy(contact.along).applyQuaternion(QUAT) : undefined,
    );
  }
}

function clear(): void {
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

function build(which: Entry[]): void {
  clear();
  const cols = Math.ceil(Math.sqrt(which.length));
  const pitch = 3.2;

  which.forEach((entry, i) => {
    const group = new Group();
    if (which.length > 1) {
      group.position.set(
        ((i % cols) - (cols - 1) / 2) * pitch,
        0,
        (Math.floor(i / cols) - (Math.ceil(which.length / cols) - 1) / 2) * pitch,
      );
    }
    stand.add(group);

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
      if (which.length > 1) group.add(new AxesHelper(0.3));
      live.push({ entry, machine, group, playing: [], waiting: [] });
      return;
    }

    const archetype = entry.archetype!;
    // The stage's own entry point, not the raw builder: it is what sizes a horn
    // to this player's face and what wraps the string models so the *sounding*
    // hand gets the sounding contact. Building around it left the picking hand
    // on the fretboard, which is the one pose a guitarist never takes.
    const performer = performerFor(entry, archetype);
    const model = buildInstrumentFor(
      performer, undefined, undefined, undefined,
      entry.electronic ? 'electronic-kit' : undefined,
      // The same bar the standalone machines run, for the same reason: a bay
      // whose step row never lights is a rack panel, and the row is the half of
      // that module worth coming here to see. See `bayPattern` for why it is
      // written out rather than looped.
      entry.bay
        ? { kind: entry.bay, events: bayPattern(), beatsPerBar: MACHINE_BEATS_PER_BAR }
        : undefined,
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
    if (which.length > 1) group.add(new AxesHelper(0.3));
    const spec = specFor(archetype);
    live.push({
      entry, model, rig, group, playing: playStance(spec), waiting: restStance(spec),
    });
  });

  frameAll(which);
  describe(which);
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
function frameAll(which: Entry[]): void {
  if (which.length > 1) {
    dist = Math.ceil(Math.sqrt(which.length)) * 3.2 * 1.15;
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
  facts.innerHTML = [
    `<b>${entry.label}</b>  (${entry.id})`,
    `family ${spec.family} · ${spec.hands} hands · ${spec.posture}${spec.held ? ' · carried' : ' · stands'}`,
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

let dragging = false;
let yaw = 0;
let pitch = 0.15;
canvas.addEventListener('pointerdown', (e) => { dragging = true; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  yaw -= e.movementX * 0.006;
  pitch = Math.max(-0.4, Math.min(1.2, pitch + e.movementY * 0.004));
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoom = Math.max(0.3, Math.min(3, zoom * Math.exp(e.deltaY * 0.0012)));
}, { passive: false });
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') (document.getElementById('next') as HTMLButtonElement).click();
  if (e.key === 'ArrowLeft') (document.getElementById('prev') as HTMLButtonElement).click();
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
  if (spinning.checked && !dragging) spin += dt * 0.35;
  stand.rotation.y = spin + yaw;
  camera.position.set(
    0,
    Math.max(0.3, (mode === 'grid' ? 8 : 1.5) + pitch * 2),
    dist * zoom,
  );
  camera.lookAt(0, mode === 'grid' ? 0 : 1.0, 0);
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
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

showOne();
requestAnimationFrame(frame);
