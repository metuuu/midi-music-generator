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
 * Nothing on this page is part of the concert. It imports the same builders the
 * stage does and nothing else, so what you see is what the show gets.
 */

import {
  AmbientLight, AxesHelper, Box3, Color, DirectionalLight, Group, GridHelper, Mesh,
  MeshBasicMaterial, PerspectiveCamera, Scene, SphereGeometry, Vector3,
  WebGLRenderer,
} from 'three';

import { ARCHETYPES, specFor } from '../../concert/instruments.js';
import type { Archetype, Look, Performer, PlayPoint } from '../../concert/types.js';
import { BUILDERS } from './instruments/index.js';
import type { InstrumentModel } from './instruments/types.js';
import { buildPerformer, type PerformerRig } from './performer.js';

const canvas = document.getElementById('bench') as HTMLCanvasElement;
const facts = document.getElementById('facts')!;
const pick = document.getElementById('pick') as HTMLSelectElement;
const showPlayer = document.getElementById('player') as HTMLInputElement;
const showContacts = document.getElementById('contacts') as HTMLInputElement;
const spinning = document.getElementById('spin') as HTMLInputElement;

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

let live: { model: InstrumentModel; rig?: PerformerRig; group: Group }[] = [];
let mode: 'one' | 'grid' = 'one';
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

    const model = BUILDERS[archetype]({ seed: 7, scale: 0.5 });
    let rig: PerformerRig | undefined;

    if (showPlayer.checked) {
      rig = buildPerformer(performerFor(archetype, `bench-${archetype}`));
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
    live.push({ model, rig, group });
  });

  frameAll(which.length);
  describe(which);
}

/** Put the camera where the whole of what is on the bench fits. */
function frameAll(count: number): void {
  const span = count > 1 ? Math.ceil(Math.sqrt(count)) * 3.2 : 2.6;
  const d = span * 1.15;
  camera.position.set(0, count > 1 ? d * 0.8 : 1.5, d);
  camera.lookAt(0, count > 1 ? 0 : 1.0, 0);
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
  camera.position.y = Math.max(0.3, (mode === 'grid' ? 8 : 1.5) + pitch * 2);
  camera.lookAt(0, mode === 'grid' ? 0 : 1.0, 0);
  // Models settle against the one clock in the show; here, wall time will do.
  for (const item of live) item.model.update(now / 1000);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

showOne();
requestAnimationFrame(frame);
