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
 * takes about a minute to check all twenty-two here against a minute *each* in
 * a running show, with no guarantee of ever seeing some of them.
 *
 * Nothing on this page is part of the concert. It goes through
 * `buildInstrumentFor` — the same entry point `show.ts` uses, not the raw
 * builder behind it — so what you see is what the show gets, down to the
 * sounding-hand wrapper and the horn sized to this player's face.
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

import { ARCHETYPES, specFor } from '../../concert/instruments.js';
import type {
  Archetype, ArchetypeSpec, Effector, Look, Performer, PlayPoint,
} from '../../concert/types.js';
import { buildInstrumentFor } from './instruments/index.js';
import type { InstrumentModel } from './instruments/types.js';
import { buildPerformer, type PerformerRig } from './performer.js';

const canvas = document.getElementById('bench') as HTMLCanvasElement;
const facts = document.getElementById('facts')!;
const pick = document.getElementById('pick') as HTMLSelectElement;
const showPlayer = document.getElementById('player') as HTMLInputElement;
const showContacts = document.getElementById('contacts') as HTMLInputElement;
const spinning = document.getElementById('spin') as HTMLInputElement;
const idleButton = document.getElementById('idle') as HTMLButtonElement;
const playButton = document.getElementById('play') as HTMLButtonElement;

const NAMES = Object.keys(ARCHETYPES) as Archetype[];
for (const id of NAMES) pick.append(new Option(`${ARCHETYPES[id].label} — ${id}`, id));

const renderer = new WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
const scene = new Scene();
scene.background = new Color('#15171a');
const camera = new PerspectiveCamera(38, 1, 0.05, 200);

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
    accent: '#c4623a', fabric: 'wool',
  },
  accessories: [],
};

/**
 * One thing on the bench, with both of the poses it can be put in already
 * worked out. See `stanceFor`.
 */
interface Exhibit {
  model: InstrumentModel;
  rig?: PerformerRig;
  group: Group;
  playing: Stance;
  waiting: Stance;
}

let live: Exhibit[] = [];
let mode: 'one' | 'grid' = 'one';
let pose: 'idle' | 'play' = 'play';
let spin = 0;

function performerFor(archetype: Archetype, id: string): Performer {
  return {
    id,
    layer: archetype === 'drumkit' ? 'drums' : archetype === 'singer' ? 'vocal' : 'melody',
    archetype,
    instrument: ARCHETYPES[archetype].label,
    look: LOOK,
    station: {
      position: [0, 0, 0], facing: 0, posture: ARCHETYPES[archetype].posture, riser: 0,
    },
  };
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
  if (!rig) return;
  const playing = pose === 'play';
  const spec = specFor(model.archetype);

  rig.setPlaying(playing);
  if (!playing) rig.setMouth(0, 0, 0);
  else if (spec.blown) rig.setMouth(0.08, 0.65, 0.06);
  else if (model.archetype === 'singer') rig.setMouth(0.5, 0.15, 0.2);
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
    item.model.dispose();
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

function build(which: Archetype[]): void {
  clear();
  const cols = Math.ceil(Math.sqrt(which.length));
  const pitch = 3.2;

  which.forEach((archetype, i) => {
    const group = new Group();
    if (which.length > 1) {
      group.position.set(
        ((i % cols) - (cols - 1) / 2) * pitch,
        0,
        (Math.floor(i / cols) - (Math.ceil(which.length / cols) - 1) / 2) * pitch,
      );
    }
    stand.add(group);

    // The stage's own entry point, not the raw builder: it is what sizes a horn
    // to this player's face and what wraps the string models so the *sounding*
    // hand gets the sounding contact. Building around it left the picking hand
    // on the fretboard, which is the one pose a guitarist never takes.
    const performer = performerFor(archetype, `bench-${archetype}`);
    const model = buildInstrumentFor(performer);
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
      model, rig, group, playing: playStance(spec), waiting: restStance(spec),
    });
  });

  frameAll(which.length);
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

/** Put the camera where the whole of what is on the bench fits. */
function frameAll(count: number): void {
  dist = count > 1 ? Math.ceil(Math.sqrt(count)) * 3.2 * 1.15 : 4.2;
}

function describe(which: Archetype[]): void {
  if (which.length !== 1) {
    facts.textContent = `${which.length} archetypes · drag to orbit`;
    return;
  }
  const spec = specFor(which[0]!);
  const model = live[0]!.model;
  model.root.updateWorldMatrix(true, true);

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
  const bounds = new Box3().setFromObject(model.root);
  const lo = bounds.min;
  const hi = bounds.max;
  const box = new Vector3().subVectors(hi, lo);
  const sits = lo.y < -0.02 ? ' <span class="warn">below the floor</span>' : '';
  facts.innerHTML = [
    `<b>${spec.label}</b>  (${spec.id})`,
    `family ${spec.family} · ${spec.hands} hands · ${spec.posture}${spec.held ? ' · carried' : ' · stands'}`,
    `range ${spec.range[0]}–${spec.range[1]} · footprint ${spec.footprint} m · work height ${spec.workHeight} m`,
    `size  ${box.x.toFixed(2)} × ${box.y.toFixed(2)} × ${box.z.toFixed(2)} m`,
    `floor ${lo.y.toFixed(3)} m${sits}  ·  top ${hi.y.toFixed(2)} m`,
  ].join('<br>');
}

// --- interaction ---------------------------------------------------------

let index = 0;
const showOne = (): void => { pick.value = NAMES[index]!; mode = 'one'; build([NAMES[index]!]); };

pick.onchange = () => { index = NAMES.indexOf(pick.value as Archetype); showOne(); };
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
    item.model.update(now / 1000);
    item.rig?.update(now / 1000, dt);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

showOne();
requestAnimationFrame(frame);
