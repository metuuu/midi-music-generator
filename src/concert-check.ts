/**
 * Concert correctness checks.
 *
 *   npm run concert
 *
 * The Performance IR is data, so most of what "looks wrong" means can be
 * asserted without eyes — in the same spirit as `npm run genres` and
 * `npm run audit`, and for a stronger reason: nobody is going to watch three
 * hundred generated concerts, so if the hands are only checked by looking at
 * them, they are not checked.
 *
 * The interesting assertions are the physical ones. "No effector is in two
 * places at once" and "no hand exceeds human travel speed between consecutive
 * targets" are the two that decide whether a band looks like players or like
 * animatronics, and both are arithmetic.
 *
 * Wave 0 covers what exists: the archetype mapping, which must be total, and
 * the grid, which the choreographer has to share with the audio. Each system
 * adds its own section as it lands — see the plan, §12.
 */

import { quantise } from './core/grid.js';
import { isPlayedByHand, type DrumVoice } from './core/types.js';
import { generateSong } from './generate/song.js';
import { GENRE_IDS, getGenre } from './genre/index.js';
import { INSTRUMENTS, type InstrumentId } from './style/instruments.js';
import { armsKnotted, trackForPart } from './concert/choreograph.js';
import {
  ARCHETYPES, ARCHETYPE_OF, SYNTH_RIGS, archetypeForTrack, trackCanReach,
} from './concert/instruments.js';
import { buildConcert, soundingEffectors } from './concert/index.js';
import { routeOnDeck, stageBoxAt, type Obstacle } from './web/concert/cables.js';
import { riserFootprint } from './web/concert/stage-props.js';
import type { Gesture, SynthRigId } from './concert/types.js';

/**
 * A hi-hat pedal being held down or let up — the one gesture in the IR that is
 * a *position* rather than a stroke, and the one that must not be counted as a
 * note.
 *
 * The hats are shut because a foot is on the pedal, so the crossings between
 * shut and open are choreographed onto the left leg with no drum event behind
 * them. A chick is a different thing and still counts: it makes a sound, and
 * `drumPart` places it as a `strike`.
 */
const silentPedal = (g: Gesture): boolean =>
  g.kind === 'press' && g.target.kind === 'pedal' && g.target.which === 'hat';

/**
 * A hand on the panel — starting a sequencer, moving a filter while it runs.
 *
 * The second gesture in this IR that makes no sound of its own, and excluded
 * from the note count for the same reason the hi-hat pedal above is: it is a
 * *position*, not a stroke. There is no note behind it because the thing it
 * causes is a machine playing notes nobody's fingers are on, which is the whole
 * point of it existing — see `operatePart`.
 */
const panelTouch = (g: Gesture): boolean => g.target.kind === 'control';

const problems: string[] = [];
const check = (label: string, pass: boolean, detail: string) => {
  console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${label.padEnd(46)} ${detail}`);
  if (!pass) problems.push(label);
};

// --- The archetype table must be total -----------------------------------
//
// A sound with no object is a grey box on stage, and a grey box is the kind of
// thing that survives review because it looks deliberate. The mapping is a
// `Record<InstrumentId, Archetype>` so this is already a compile error — this
// asserts the runtime lookups derived from it stayed in agreement.
console.log('\nArchetypes');

const catalogue = Object.keys(INSTRUMENTS) as InstrumentId[];
const unmapped = catalogue.filter((id) => !ARCHETYPE_OF[id]);
check('every catalogue sound maps to an object', unmapped.length === 0,
  `${catalogue.length} sounds → ${new Set(Object.values(ARCHETYPE_OF)).size} archetypes`);

const unspecced = [...new Set(Object.values(ARCHETYPE_OF))].filter((a) => !ARCHETYPES[a]);
check('every archetype has a spec', unspecced.length === 0,
  unspecced.length ? unspecced.join(', ') : `${Object.keys(ARCHETYPES).length} specs`);

// A spec that claims a string archetype without tunings cannot be resolved
// against: `PlayPoint.string` indexes that array and there would be nothing to
// index. Cheap to state, and it is the sort of omission that only shows up as a
// hand hovering in mid-air.
const stringlessStrings = Object.values(ARCHETYPES)
  .filter((s) => s.points.includes('string') && !s.strings?.length)
  // A harp has a string per note rather than stopped courses, and is resolved
  // by pitch inside its own model.
  .filter((s) => s.id !== 'harp');
check('string archetypes declare their tuning', stringlessStrings.length === 0,
  stringlessStrings.map((s) => s.id).join(', ') || 'all tuned');

const badRange = Object.values(ARCHETYPES).filter((s) => s.range[0] >= s.range[1]);
check('every declared range is non-empty', badRange.length === 0,
  badRange.map((s) => s.id).join(', ') || 'ok');

// --- Every track of every song can be staged -----------------------------
//
// The mapping being total is not the same as it being *reachable*: what matters
// is that the instruments the generator actually chooses all resolve, through
// the fields the Song IR carries rather than through a catalogue key it does
// not.
console.log('\nStaging coverage');

let tracks = 0;
let staged = 0;
let notes = 0;
let outOfRange = 0;
const seenArchetypes = new Set<string>();
const missing = new Set<string>();
const strays = new Map<string, number>();

for (const gid of GENRE_IDS) {
  const genre = getGenre(gid);
  for (const eid of Object.keys(genre.eras)) {
    for (let i = 0; i < 12; i++) {
      const song = generateSong({ seed: `stage-${gid}-${eid}-${i}`, genre: gid, era: eid, vocals: i % 3 === 0 });
      for (const track of song.tracks) {
        if (track.voice) continue; // the singer is not drawn from the catalogue
        tracks++;
        const archetype = archetypeForTrack(track);
        if (!archetype) { missing.add(`${track.instrument} (gm ${track.gmProgram})`); continue; }
        staged++;
        seenArchetypes.add(archetype);
        for (const n of track.notes) {
          notes++;
          if (trackCanReach(track, n.midi)) continue;
          outOfRange++;
          const key = `${track.instrument} (${track.layer})`;
          strays.set(key, (strays.get(key) ?? 0) + 1);
        }
      }
    }
  }
}

check('every generated track resolves to an object', missing.size === 0,
  missing.size ? [...missing].join(', ') : `${tracks} tracks`);
check('the fallback is never reached', staged === tracks, `${staged}/${tracks} staged`);

/**
 * A rate, not zero, and the threshold is the argument.
 *
 * The generator writes for a register rather than for a player, so once in a
 * few hundred songs it puts a B1 on a cello whose bottom string is a C. Fixing
 * that by widening the cello would be a lie about the instrument; the
 * choreographer folds the note into the octave above, which is what a player
 * does. What must not happen is a *systematic* mismatch — a whole part written
 * where its instrument does not live — and at 0.05% that shows up immediately.
 */
const strayRate = outOfRange / Math.max(notes, 1);
const worst = [...strays].sort((a, b) => b[1] - a[1]).slice(0, 4)
  .map(([k, n]) => `${k} ×${n}`).join(', ');
check('notes outside their instrument\'s reach are rare', strayRate < 0.0005,
  `${(strayRate * 100).toFixed(4)}% of ${notes} notes${worst ? ` — ${worst}` : ''}`);
console.log(`        archetypes exercised: ${[...seenArchetypes].sort().join(', ')}`);

// --- The whole show, assembled -------------------------------------------
//
// Everything above tests a part. This tests that the parts compose: that
// `buildConcert` produces a show in which every gesture has a hand, every
// spotlight has a person, and the same seed gives the same evening twice.
console.log('\nShows');

const CHECKED_GENRES = ['iskelma', 'jazz', 'ambient', 'synth'];
let shows = 0;
let gestures = 0;
let soundingNotes = 0;
let soundingGestures = 0;
let offGrid = 0;
let overlaps = 0;
let ungraspable = 0;
let orphanSpots = 0;
let cuesAfterEnd = 0;
let ambientSpots = 0;
let visemeGaps = 0;
let soloWithoutPlayer = 0;

for (const gid of CHECKED_GENRES) {
  for (let i = 0; i < 4; i++) {
    const concert = buildConcert({ seed: `check-${gid}-${i}`, genre: gid, vocals: 'mixed' });
    shows++;

    for (const number of concert.numbers) {
      const { song, cast, choreography, lighting, solos } = number;
      const byId = new Map(cast.performers.map((p) => [p.id, p]));
      const lastNote = Math.max(
        0,
        ...song.tracks.flatMap((t) => t.notes.map((n) => n.beat + n.duration)),
        ...song.drums.events.map((e) => e.beat),
      );

      for (const performer of cast.performers) {
        const part = choreography.parts[performer.id];
        if (!part) continue;
        const sounding = new Set(soundingEffectors(performer.archetype));

        // Coverage: one note does NOT mean one gesture in general — a guitarist
        // frets and plucks, a trombonist moves a slide while the sound comes out
        // of their mouth. The *sounding* effector is what must line up 1:1.
        //
        // Every part this player is carrying, not just the one they were cast
        // for: a keyboard player covering the bass in their left hand owns two
        // tracks' worth of notes and must produce two tracks' worth of gestures.
        // See `Performer.doubles`. This is the assertion that a merged station
        // is really playing both lines rather than dropping one of them.
        const notes = performer.layer === 'drums'
          ? song.drums.events.length
          : [performer, ...(performer.doubles ?? [])]
            .reduce((n, ref) => n + (trackForPart(song, ref)?.notes.length ?? 0), 0);
        const sounded = part.gestures.filter(
          (g) => sounding.has(g.effector) && g.target.kind !== 'rest'
            && !silentPedal(g) && !panelTouch(g),
        ).length;
        soundingNotes += notes;
        soundingGestures += sounded;

        // Physical plausibility, per effector.
        const byEffector = new Map<string, typeof part.gestures[number][]>();
        for (const g of part.gestures) {
          gestures++;
          if (Math.abs(g.beat * 4 - Math.round(g.beat * 4)) > 1e-6) offGrid++;
          const arr = byEffector.get(g.effector) ?? [];
          arr.push(g);
          byEffector.set(g.effector, arr);
        }

        for (const [, list] of byEffector) {
          list.sort((a, b) => a.beat - b.beat);
          for (let k = 1; k < list.length; k++) {
            const prev = list[k - 1]!;
            const next = list[k]!;
            if (next.beat === prev.beat) {
              /**
               * Simultaneous gestures on one effector are legitimate — a chord
               * is one hand on several keys — but only if the hand can actually
               * span them. Asserting "never in two places at once" without this
               * refinement fails on every pianist in the catalogue.
               */
              const a = prev.target;
              const b = next.target;
              const span = a.kind === 'key' && b.kind === 'key'
                ? Math.abs(a.midi - b.midi)
                : 0;
              if (span > 12) ungraspable++;
              continue;
            }
            if (next.beat - next.prep < prev.beat + prev.release - 1e-6) overlaps++;
          }
        }
      }

      // Lighting: a spot must name someone who is on stage, and nothing may be
      // cued after the last note — there is nobody there to light.
      for (const cue of lighting.cues) {
        if (cue.followPerformerId && !byId.has(cue.followPerformerId)) orphanSpots++;
        if (cue.beat > lastNote + 1e-6) cuesAfterEnd++;
        if (gid === 'ambient' && cue.fixture === 'spot') ambientSpots++;
      }

      // Every solo resolves to somebody who exists.
      for (const spot of solos) if (!byId.has(spot.performerId)) soloWithoutPlayer++;

      // Visemes exist exactly when there is a voice.
      const hasVoice = song.tracks.some((t) => t.voice);
      if (hasVoice !== Boolean(number.visemes)) visemeGaps++;
    }
  }
}

check('every sounding note produces one gesture', soundingNotes === soundingGestures,
  `${soundingGestures}/${soundingNotes} across ${shows} shows`);
check('every gesture lands on the audio grid', offGrid === 0, `${gestures} gestures`);
check('no effector is scheduled over its own release', overlaps === 0,
  overlaps ? `${overlaps} overlaps` : 'none');
check('simultaneous gestures on one effector are graspable', ungraspable === 0,
  ungraspable ? `${ungraspable} beyond a hand span` : 'none');
check('every follow spot names someone on stage', orphanSpots === 0,
  orphanSpots ? `${orphanSpots} orphaned` : 'none');
check('no light cue after the last note', cuesAfterEnd === 0,
  cuesAfterEnd ? `${cuesAfterEnd} late cues` : 'none');
check('ambient never uses a follow spot', ambientSpots === 0,
  ambientSpots ? `${ambientSpots} spot cues` : 'the warm fixture instead');
check('every solo resolves to a performer', soloWithoutPlayer === 0,
  soloWithoutPlayer ? `${soloWithoutPlayer} unresolved` : 'none');

/**
 * Staging: two people cannot stand in the same place, and everyone is on the
 * stage.
 *
 * `concert/types.ts` has claimed since it was written that this file asserts
 * "no two players are standing in the same place". It did not. The `overlaps`
 * counter above is about a *hand* being scheduled over its own release, which
 * is a different thing entirely, and nothing here had ever looked at where
 * anybody was standing.
 *
 * That gap was survivable while staging was a fixed dance-band layout that
 * changed only when the roster did. It stopped being survivable when keyboard
 * players moved onto a computed arc: placement is now a function of how many
 * gear players there are, which venue it is and who took the centre, and the
 * failure mode of an arc one player too wide for a small stage is two bodies in
 * one spot — silently, in the data, on the seeds nobody dumped.
 *
 * ## Why this measures bodies and not footprints
 *
 * The obvious test is that no two `ArchetypeSpec.footprint` circles overlap,
 * and `footprint` describes itself as "staging keeps these from overlapping".
 * Written that way it fails everywhere: 21 pairs in iskelmä, 19 in ambient,
 * 4 in jazz, on layout routines nobody has touched in this work. It is not a
 * regression and it is not a bug — the stager separates *boxes* with their own
 * clearance pad, and a footprint is a generous radius for a player and their
 * gear rather than a hull anyone ever enforced. Requiring two metres between
 * two keyboard players is stricter than a real stage: they stand about 1.4 m
 * apart, which is what this generator already produces.
 *
 * So the assertion is the one that is actually meaningful — nobody
 * interpenetrates. Measured across 1995 pairs in four genres the closest any
 * two performers come is 1.21 m, so a metre is comfortably clear of normal
 * spacing while still catching the failure that matters: an arc that packs
 * players toward each other drives this number toward zero. The observed
 * minimum is printed even when it passes, so the margin is visible rather than
 * merely asserted.
 */
{
  const TOLERANCE = 0.01;
  /** Two standing bodies, near enough. Below this they are in each other. */
  const PERSONAL_SPACE = 1.0;
  let tooClose = 0;
  let offStage = 0;
  let placements = 0;
  let closest = Infinity;
  let closestAt = '';
  for (const gid of CHECKED_GENRES) {
    for (let i = 0; i < 4; i++) {
      const concert = buildConcert({ seed: `stage-${gid}-${i}`, genre: gid });
      const halfW = concert.venue.width / 2;
      const halfD = concert.venue.depth / 2;
      for (const number of concert.numbers) {
        const people = number.cast.performers;
        placements += people.length;
        for (const p of people) {
          const [x, , z] = p.station.position;
          if (Math.abs(x) > halfW + TOLERANCE || Math.abs(z) > halfD + TOLERANCE) offStage++;
        }
        for (let a = 0; a < people.length; a++) {
          for (let b = a + 1; b < people.length; b++) {
            const A = people[a]!;
            const B = people[b]!;
            const gap = Math.hypot(
              A.station.position[0] - B.station.position[0],
              A.station.position[2] - B.station.position[2],
            );
            if (gap < closest) {
              closest = gap;
              closestAt = `${gid}#${i} ${A.archetype}/${B.archetype}`;
            }
            if (gap < PERSONAL_SPACE) tooClose++;
          }
        }
      }
    }
  }
  check('no two performers share a spot', tooClose === 0,
    tooClose
      ? `${tooClose} inside ${PERSONAL_SPACE} m, closest ${closest.toFixed(2)} m at ${closestAt}`
      : `${placements} placements, closest ${closest.toFixed(2)} m (${closestAt})`);
  check('every performer is on the stage', offStage === 0,
    offStage ? `${offStage} off the boards` : `${placements} placements`);
}
check('visemes exist exactly when there is a voice', visemeGaps === 0,
  visemeGaps ? `${visemeGaps} mismatches` : 'none');

/**
 * Nobody mimes a machine, and no machine plays from nowhere.
 *
 * The failure this catches shipped for months and nothing complained, because
 * every individual system was behaving: the synth `modular` era drew a preset
 * rhythm box, the box wrote drum events like anything else, and casting stages a
 * drummer whenever there are drum events. Four correct steps and a man on a
 * riser playing a Korg Mini Pops.
 *
 * So both directions are asserted. A machine number has no drummer *and* has a
 * machine standing on the boards where the sound can be seen to come from —
 * the second half matters as much as the first, because percussion arriving
 * from an empty stage is a worse answer than the mime was.
 */
{
  /** Arm's reach. Past this it is furniture standing near somebody, not their gear. */
  const MACHINE_REACH = 1.1;
  /**
   * How far off the panel may be aimed, and how close two cases may stand.
   *
   * The aim is a constructed quantity, so the tolerance is only there to catch
   * a sign or a stale position rather than to allow a range — a panel more than
   * a few degrees off its player has been computed from something other than
   * where that player ended up. The spacing is a case width: two boxes nearer
   * than that are one object drawn twice, which is what a second machine at a
   * player who can only work one of them looks like.
   */
  const MACHINE_AIM = 5 * Math.PI / 180;
  const MACHINE_APART = 0.4;
  let mimed = 0;
  let untended = 0;
  let adrift = 0;
  let askew = 0;
  let worstAim = 0;
  let doubled = 0;
  let piled = 0;
  let overKeys = 0;
  let floating = 0;
  let onTheRight = 0;
  let onTheLeft = 0;
  let miscased = 0;
  let bays = 0;
  let mounted = 0;
  let unexplained = 0;
  let counted = 0;
  let offStage = 0;
  let machines = 0;
  let handPlayed = 0;
  const notes: string[] = [];
  for (const gid of CHECKED_GENRES) {
    for (let i = 0; i < 4; i++) {
      const concert = buildConcert({ seed: `machine-${gid}-${i}`, genre: gid });
      const halfW = concert.venue.width / 2;
      const halfD = concert.venue.depth / 2;
      for (const number of concert.numbers) {
        const source = number.song.drums.source ?? 'kit';
        const drummer = number.cast.performers.some((p) => p.layer === 'drums');
        const placed = number.cast.machines ?? [];
        if (isPlayedByHand(source)) {
          handPlayed++;
          continue;
        }
        if (!number.song.drums.events.length) continue;
        machines++;
        if (drummer) {
          mimed++;
          if (notes.length < 3) notes.push(`${gid}#${i} ${source} with a drummer`);
        }
        if (!placed.length) {
          unexplained++;
          if (notes.length < 3) notes.push(`${gid}#${i} ${source} with nothing on stage`);
        }
        /**
         * At somebody's right hand, on its own legs, and squarer to the house
         * than they are.
         *
         * Every clause is asserted because every one of them has been wrong at
         * some point. A machine standing *away* from a player reads as scenery
         * and explains nothing. A machine on top of their keyboard explains
         * itself and cannot be seen — it is inside the keyboard's silhouette
         * from every seat in the room. And a machine inheriting the player's
         * full yaw points its panel across the stage when that player is toed
         * into the gear arc, which is the only part of it worth seeing.
         */
        for (const m of placed) {
          const tender = number.cast.performers.find((p) => p.id === m.tendedBy);
          if (!tender) {
            if (number.cast.performers.length) untended++;
            continue;
          }
          const dx = m.position[0] - tender.station.position[0];
          const dz = m.position[2] - tender.station.position[2];
          const reach = Math.hypot(dx, dz);
          if (reach > MACHINE_REACH) {
            adrift++;
            if (notes.length < 3) notes.push(`${gid}#${i} ${reach.toFixed(2)} m from its tender`);
          }
          if (m.mount === 'stand') {
            /**
             * Beside them, not in front of them.
             *
             * `facing` 0 looks at the house, so the player's own right is
             * `(-cos, 0, sin)` and their forward is `(sin, 0, cos)` — the
             * conventions in `concert/types.ts`. A box more forward than
             * sideways is a box over the keys, which is the placement this
             * replaced, and it is the failure worth asserting. *Which* side is
             * reported rather than asserted: the right is the side to want, and
             * `placeMachines` gives up on it when a neighbour's gear is already
             * standing there.
             */
            const f = tender.station.facing;
            const right = -Math.cos(f) * dx + Math.sin(f) * dz;
            const fwd = Math.sin(f) * dx + Math.cos(f) * dz;
            if (Math.abs(right) < 0.3 || Math.abs(fwd) > Math.abs(right)) {
              overKeys++;
              if (notes.length < 3) {
                notes.push(`${gid}#${i} ${right.toFixed(2)} right, ${fwd.toFixed(2)} forward`);
              }
            }
            if (right > 0) onTheRight++; else onTheLeft++;
            /**
             * And its legs reach the deck the player is standing on.
             *
             * `stand` is the leg length and `position[1]` is where the top
             * surface ended up; a renderer builds one from the other, so a
             * disagreement is a table hanging in the air over a riser.
             */
            const deck = m.position[1] - (m.stand ?? 0);
            if (Math.abs(deck - tender.station.position[1]) > 1e-6) {
              floating++;
              if (notes.length < 3) notes.push(`${gid}#${i} stand foot at ${deck.toFixed(2)}`);
            }
          }
          /**
           * And its panel is pointed at the person who reads it.
           *
           * The box stands beside its player, not in front of them, so a yaw
           * copied or scaled from theirs leaves the buttons facing the back
           * wall and the player working a case edge-on. The panel is the `-z`
           * face — see `MACHINE_PANEL_Z` — and the angle between that face and
           * the line to the tender is the whole assertion. It lands near a
           * right angle to the house by consequence rather than by rule.
           */
          if (m.mount !== 'bay') {
            const to = Math.hypot(dx, dz);
            // `dx`/`dz` run box-to-player-*wards* the wrong way — they are the
            // box's offset *from* the player — so the dot with the panel's
            // `-z` comes out as the plain sines rather than their negatives.
            const aim = to < 1e-6 ? 0 : Math.acos(Math.max(-1, Math.min(1,
              (Math.sin(m.facing) * dx + Math.cos(m.facing) * dz) / to)));
            worstAim = Math.max(worstAim, aim);
            if (aim > MACHINE_AIM) {
              askew++;
              if (notes.length < 3) {
                notes.push(`${gid}#${i} panel ${(aim * 180 / Math.PI).toFixed(0)}° off its player`);
              }
            }
          }
          /**
           * A bay is drawn *by* the tender's instrument, so only a rig that has
           * one may be given it. Routed wrongly the machine would vanish: the
           * show skips building an object for a bay, and a rig with no bay for
           * it would ignore what it was handed.
           */
          if (m.mount === 'bay' && tender.rig !== 'modular') {
            miscased++;
            if (notes.length < 3) notes.push(`${gid}#${i} bay on ${tender.rig ?? tender.archetype}`);
          }
          if (m.mount === 'bay') bays++; else mounted++;
        }
        // A machine does not count anybody in; somebody presses start.
        if (number.song.meta.leadInBars) counted++;
        for (const m of placed) {
          const [x, , z] = m.position;
          if (Math.abs(x) > halfW + 0.01 || Math.abs(z) > halfD + 0.01) offStage++;
        }
        /**
         * One box per pair of hands, and no two of them in the same place.
         *
         * The claim a machine makes on the stage is that the person beside it
         * works it, and one person can only make that claim for one box: a
         * second at the same elbow is an object nobody is ever seen touching,
         * standing next to one they are. Distance catches the same fault where
         * it does not go through a tender — an untended stage used to give
         * every machine the same fallback point and draw two cases at one spot.
         */
        const perTender = new Map<string, number>();
        for (const m of placed) {
          if (!m.tendedBy) continue;
          const n = (perTender.get(m.tendedBy) ?? 0) + 1;
          perTender.set(m.tendedBy, n);
          if (n === 2) {
            doubled++;
            if (notes.length < 3) notes.push(`${gid}#${i} ${m.tendedBy} minds two`);
          }
        }
        const cases = placed.filter((m) => m.mount !== 'bay');
        for (let a = 0; a < cases.length; a++) {
          for (let b = a + 1; b < cases.length; b++) {
            const gap = Math.hypot(
              cases[a]!.position[0] - cases[b]!.position[0],
              cases[a]!.position[2] - cases[b]!.position[2],
            );
            if (gap < MACHINE_APART) {
              piled++;
              if (notes.length < 3) notes.push(`${gid}#${i} two cases ${gap.toFixed(2)} m apart`);
            }
          }
        }
      }
    }
  }
  check('a machine is never mimed by a drummer', mimed === 0,
    mimed ? `${mimed} of ${machines}: ${notes.join('; ')}` : `${machines} machine numbers, ${handPlayed} played by hand`);
  check('a machine is somewhere the audience can see it', unexplained === 0 && offStage === 0,
    unexplained || offStage
      ? `${unexplained} unplaced, ${offStage} off the boards: ${notes.join('; ')}`
      : `${machines} placed on the boards`);
  check('a machine does not count the band in', counted === 0,
    counted ? `${counted} of ${machines} have lead-in bars` : `${machines} start on bar one`);
  check('a machine is within reach of somebody', untended === 0 && adrift === 0,
    untended || adrift
      ? `${untended} untended, ${adrift} out of reach: ${notes.join('; ')}`
      : `${machines} within ${MACHINE_REACH} m of the player who works them`);
  check('a machine stands at the player\'s right hand', overKeys === 0 && floating === 0,
    overKeys || floating
      ? `${overKeys} over the keys, ${floating} off the deck: ${notes.join('; ')}`
      : `${onTheRight} at their right hand, ${onTheLeft} pushed to their left`);
  check('a machine bay only goes in a rig that has one', miscased === 0,
    miscased ? `${miscased} misrouted: ${notes.join('; ')}`
      : `${bays} in a modular, ${mounted} on a stand`);
  check('a machine\'s panel faces the player who works it', askew === 0,
    askew ? `${askew} pointed somewhere else: ${notes.join('; ')}`
      : `${mounted} panels, worst ${(worstAim * 180 / Math.PI).toFixed(1)}° off`);
  check('no two machines stand in one place', doubled === 0 && piled === 0,
    doubled || piled
      ? `${doubled} players minding two, ${piled} pairs within ${MACHINE_APART} m: ${notes.join('; ')}`
      : `${machines} machine numbers, one box per pair of hands`);
}

/**
 * No lead crosses anything a lead cannot cross.
 *
 * The one assertion in this file that reaches into the renderer, and it earns
 * the exception. Everything else here is a claim about the IR and needs no
 * eyes; whether a cable reads at concert distance is not a claim about the IR
 * and no assertion is going to settle it. But a lead *through the drum riser*
 * is not a matter of taste, and it is the specific way §8.4 of
 * `docs/backline-plan.md` fails: the old `cables` prop got away with random
 * spaghetti because it joined nothing to nothing, and the moment a lead starts
 * at a real socket it becomes something an eye will follow.
 *
 * `routeOnDeck` is pure geometry, so this costs nothing but the import.
 *
 * **Two holes in that routine are what this is actually watching**, and neither
 * is theoretical. It evicts obstacles in list order, so on overlapping
 * obstacles the last eviction can push a point back inside the one before it.
 * And it only ever tests its own sample points, so a corner can be cut between
 * two of them. This walks the segments rather than the vertices, which is the
 * only way to see either.
 *
 * The runs it checks are a **superset** of the real ones — every player and
 * every machine to the box, rather than only the electric gear that gets a
 * lead — because which archetypes own an outlet is a fact about the models and
 * this file has no business building twenty of them per number. A superset is
 * the right side to err on: it asserts the router copes with worse than it will
 * be given.
 */
{
  /**
   * How close a lead may come to a solid before it counts as through it.
   *
   * A lead's own half-thickness and a little, and deliberately **not** the
   * `MARGIN` the router aims for. Asserting the aim would be asserting the
   * router's own constant back at it: a run passing a foot at 9 cm has not
   * failed at anything, it has simply used some of the clearance it was given —
   * and the obstacle it is clearing is a 30 cm circle standing in for a pair of
   * shoes about 12 cm across. What is being claimed here is that no cable goes
   * *through* anything, which is the thing an audience would see.
   */
  const CLEAR = 0.02;
  /** Steps per metre when walking a segment. Finer than the router's own sampling. */
  const WALK = 40;
  /** How far outside `o` a point is. Negative inside — the same shape `cables.ts` uses. */
  const obstacleGap = (p: { x: number; z: number }, o: Obstacle): number => {
    if (o.kind === 'circle') return Math.hypot(p.x - o.x, p.z - o.z) - o.r;
    const dx = Math.abs(p.x - o.x) - o.halfX;
    const dz = Math.abs(p.z - o.z) - o.halfZ;
    return dx > 0 || dz > 0 ? Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) : Math.max(dx, dz);
  };
  let crossed = 0;
  let dropped = 0;
  let leads = 0;
  let indoors = 0;
  let worst = Infinity;
  const notes: string[] = [];
  for (const gid of CHECKED_GENRES) {
    for (let i = 0; i < 4; i++) {
      const concert = buildConcert({ seed: `cable-${gid}-${i}`, genre: gid });
      const metrics = { width: concert.venue.width, backZ: -concert.venue.depth / 2 };
      const riser = riserFootprint({ width: concert.venue.width, depth: concert.venue.depth });
      const box = stageBoxAt(metrics, riser);
      for (const number of concert.numbers) {
        /**
         * Tagged with whose feet they are, because a lead leaving somebody's
         * own gear passes their own feet by definition and that is not a
         * crossing. In the show the run starts at a socket on the gear, which
         * is a third of a metre from the body wearing it; here the start point
         * *is* the body, so its own circle has to come out or every player
         * fails against themselves.
         */
        const obstacles: (Obstacle & { owner?: string })[] = [];
        if (number.cast.performers.some((p) => p.station.riser > 0)) {
          obstacles.push({
            kind: 'box', x: 0, z: riser.z, halfX: riser.w / 2 + 0.05, halfZ: riser.d / 2 + 0.05,
          });
        }
        for (const p of number.cast.performers) {
          obstacles.push({
            kind: 'circle', x: p.station.position[0], z: p.station.position[2], r: 0.3,
            owner: p.id,
          });
        }
        /**
         * Behind each player rather than on them, which is where `show.ts`
         * starts the run for carried gear and roughly where a keyboard's own
         * socket is. A start point *on* a body is inside its own feet and
         * inside the riser it is standing on, and asking the router to leave a
         * solid it was pinned inside tests nothing but the pin.
         */
        const from: { what: string; owner?: string; x: number; z: number }[] = [
          ...number.cast.performers.map((p) => ({
            what: p.id,
            owner: p.id,
            x: p.station.position[0] - Math.sin(p.station.facing) * 0.38,
            z: p.station.position[2] - Math.cos(p.station.facing) * 0.38,
          })),
          ...(number.cast.machines ?? []).filter((mc) => mc.mount !== 'bay').map((mc) => ({
            what: mc.id, x: mc.position[0], z: mc.position[2],
          })),
        ];
        for (const start of from) {
          const against = obstacles.filter((o) => o.owner !== start.owner);
          /**
           * A start that is already inside something is a fact about where the
           * cast put the gear, not about the router. The drummer on a riser is
           * the honest example, and in the show they get no lead at all — an
           * acoustic kit has no socket.
           */
          if (against.some((o) => obstacleGap(start, o) < 0)) { indoors++; continue; }
          leads++;
          const path = routeOnDeck(start, { x: box.x, z: box.z }, against);
          if (!path) {
            dropped++;
            if (notes.length < 3) notes.push(`${gid}#${i} ${start.what} unroutable`);
            continue;
          }
          for (let s = 1; s < path.length; s++) {
            const a = path[s - 1]!;
            const b = path[s]!;
            const steps = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) * WALK));
            for (let k = 0; k <= steps; k++) {
              const t = k / steps;
              const p = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
              for (const o of against) {
                const gap = obstacleGap(p, o);
                if (gap < worst) worst = gap;
                if (gap < CLEAR) {
                  crossed++;
                  if (notes.length < 3) {
                    notes.push(`${gid}#${i} ${start.what} ${gap.toFixed(3)} m into ${o.kind}`);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  /**
   * Only crossings fail. A dropped run is the router doing what §8.4 tells it
   * to when there is no gap to thread, and the count is printed rather than
   * asserted so that a change which quietly stopped drawing most of the
   * cabling is visible here instead of silent.
   */
  check('no lead crosses anything solid', crossed === 0,
    crossed
      ? `${crossed} crossings: ${notes.join('; ')}`
      : `${leads - dropped} of ${leads} runs drawn, ${dropped} with no gap to thread, `
        + `${indoors} starting inside something; tightest clearance ${worst.toFixed(2)} m`);
}

/**
 * A band owns a plausible collection of synthesisers.
 *
 * The reported failure and the one this is here to keep fixed: a 1974 concert
 * put a five-cabinet Moog System 55 behind every keyboard on the stage, because
 * the renderer chose from the year, per performer, with no idea how many
 * keyboards there were. Three walls of patch cables and nothing to notice it.
 *
 * The cap is asserted per *number* rather than per concert, because that is
 * where it means something — the band re-stages between numbers, and a modular
 * being wheeled off and a different one wheeled on is a fact about the same two
 * pieces of gear.
 */
{
  let overCap = 0;
  let anachronistic = 0;
  let unrigged = 0;
  let keyboards = 0;
  const seen = new Map<string, number>();
  let worst = 0;
  const notes: string[] = [];
  for (const gid of CHECKED_GENRES) {
    for (let i = 0; i < 4; i++) {
      const concert = buildConcert({ seed: `rig-${gid}-${i}`, genre: gid });
      for (const number of concert.numbers) {
        const counts = new Map<SynthRigId, number>();
        for (const p of number.cast.performers) {
          if (p.archetype !== 'synth') continue;
          keyboards++;
          if (!p.rig) {
            unrigged++;
            continue;
          }
          counts.set(p.rig, (counts.get(p.rig) ?? 0) + 1);
          seen.set(p.rig, (seen.get(p.rig) ?? 0) + 1);
          const spec = SYNTH_RIGS[p.rig];
          if (concert.year < spec.from || concert.year > spec.to) {
            anachronistic++;
            if (notes.length < 3) notes.push(`${p.rig} in ${concert.year}`);
          }
        }
        for (const [id, n] of counts) {
          if (id === 'modular') worst = Math.max(worst, n);
          if (n > SYNTH_RIGS[id].max) {
            overCap++;
            if (notes.length < 3) notes.push(`${n}x ${id} in ${gid}#${i}`);
          }
        }
      }
    }
  }
  const spread = [...seen].map(([id, n]) => `${id} ${n}`).join(', ');
  check('no band owns more modulars than a band could', overCap === 0,
    overCap ? `${overCap} numbers over cap: ${notes.join('; ')}`
      : `${keyboards} keyboards — ${spread}; most modulars in one number: ${worst}`);
  check('every synthesiser existed in the year it is staged in', anachronistic === 0,
    anachronistic ? `${anachronistic}: ${notes.join('; ')}` : `${keyboards} keyboards`);
  check('every keyboard player is standing behind something', unrigged === 0,
    unrigged ? `${unrigged} of ${keyboards} have no rig` : `${keyboards} keyboards`);
}

/**
 * A sequenced part has no player, and a sequencer has somebody who could work it.
 *
 * Both halves, because both are ways of getting this wrong and they fail in
 * opposite directions. Staging a performer for a machine-played line is the
 * drummer-miming-a-Mini-Pops bug one layer up — somebody on the boards with a
 * part they are not playing. Leaving the machine with nobody near it is the
 * lone-table bug: a sound with no visible cause.
 *
 * The host check is the interesting one, because `held: false` was doing the
 * job on its own and let in exactly the wrong people. A drummer, a harpist, a
 * cellist and a mallet player all stand at their instruments and none of them
 * has a hand free between downbeats.
 *
 * Two more of the same family sit here, because they produce the same picture
 * from the other end:
 *
 *  - **Nobody is staged with nothing to play.** An empty track used to stage a
 *    whole person and rig, and what the audience got was a keyboard player whose
 *    only movement all number was a hand on the drum machine beside them — a
 *    sequenced part with a ghost player, except that the part was silent too.
 *  - **Every box on the stage is somebody's.** A machine nobody is ever seen
 *    touching is furniture, and it is worst where there are two of them and only
 *    one is worked: the eye reads the untouched one as scenery and then doubts
 *    the other. See the settling touch at the foot of `operatePart`.
 */
{
  let ghosts = 0;
  let silent = 0;
  let idle = 0;
  let hostless = 0;
  let busyHost = 0;
  let sequencers = 0;
  let bays = 0;
  /**
   * Machines whose figure begins after the first bar, and how many of those
   * nobody is seen starting.
   *
   * Deliberately *not* asserted over all machines, because 100% is not
   * reachable and pretending otherwise would mean faking a gesture. A figure
   * that begins on beat 0 has no earlier beat for a hand to reach, and its
   * tender is usually playing from that same downbeat — so the honest reading
   * is that the sequencer was already running when the lights came up, which is
   * exactly how those records begin. Measured: 33 of the 35 unworked machines
   * are that case.
   *
   * What *is* reachable, and therefore what is asserted, is that a machine
   * coming in later — where there was room for a hand — is never seen starting
   * itself.
   */
  let lateEntries = 0;
  let lateSilent = 0;
  let players = 0;
  let boxes = 0;
  const BUSY = ['drumkit', 'harp', 'mallets', 'cello', 'upright-bass'];
  const notes: string[] = [];
  for (const gid of CHECKED_GENRES) {
    for (let i = 0; i < 5; i++) {
      const concert = buildConcert({ seed: `seq-${gid}-${i}`, genre: gid });
      for (const number of concert.numbers) {
        const machined = new Set(
          number.song.tracks.filter((t) => t.machine).map((t) => t.layer),
        );
        for (const p of number.cast.performers) {
          players++;
          const own = p.layer === 'drums'
            ? number.song.drums.events.length
            : trackForPart(number.song, p)?.notes.length ?? 0;
          if (!own) {
            silent++;
            if (notes.length < 3) {
              notes.push(`${gid}#${i} ${p.id}/${p.archetype} is staged with an empty part`);
            }
          }
          if (!machined.has(p.layer)) continue;
          ghosts++;
          if (notes.length < 3) notes.push(`${gid}#${i} ${p.id} plays a sequenced ${p.layer}`);
        }
        for (const m of number.cast.machines ?? []) {
          /**
           * Worked at all, by the hands it belongs to.
           *
           * `PlayPoint.machine` indexes into the machines *this player* tends,
           * in cast order — the same reading `show.ts` does — so a player with
           * two boxes has one of them at index 1 and a check that ignored the
           * index would call both of them worked on the strength of one touch.
           *
           * A machine with no tender at all is somebody else's assertion: it is
           * only reachable on a stage with nobody eligible standing on it, which
           * is what `every sequencer has someone who could work it` is about.
           */
          if (m.tendedBy) {
            boxes++;
            const mine = (number.cast.machines ?? []).filter((x) => x.tendedBy === m.tendedBy);
            const at = mine.indexOf(m);
            const touched = (number.choreography.parts[m.tendedBy]?.gestures ?? [])
              .some((g) => g.target.kind === 'control' && g.target.machine === at);
            if (!touched) {
              idle++;
              if (notes.length < 3) {
                notes.push(`${gid}#${i} ${m.id} stands untouched beside ${m.tendedBy}`);
              }
            }
          }
          if (m.tendedBy) {
            const figure = m.layer
              ? number.song.tracks.find((t) => t.layer === m.layer)?.notes ?? []
              : number.song.drums.events;
            const first = figure[0]?.beat ?? 0;
            if (first >= number.song.meta.beatsPerBar) {
              lateEntries++;
              const worked = (number.choreography.parts[m.tendedBy]?.gestures ?? [])
                .some((g) => g.target.kind === 'control' && g.beat <= first + 1e-6);
              if (!worked) {
                lateSilent++;
                if (notes.length < 3) notes.push(`${gid}#${i} ${m.id} enters at ${first}`);
              }
            }
          }
          if (m.kind !== 'sequencer') continue;
          sequencers++;
          if (m.mount === 'bay') bays++;
          const host = number.cast.performers.find((p) => p.id === m.tendedBy);
          if (!host) {
            // Only forgivable on a stage with nobody eligible on it at all.
            if (number.cast.performers.some((p) => !BUSY.includes(p.archetype))) hostless++;
            continue;
          }
          if (BUSY.includes(host.archetype)) {
            busyHost++;
            if (notes.length < 3) notes.push(`${gid}#${i} ${host.archetype} hosting a sequencer`);
          }
        }
      }
    }
  }
  check('nobody is staged playing a part a machine is playing', ghosts === 0,
    ghosts ? `${ghosts}: ${notes.join('; ')}` : `${sequencers} sequencers, no ghost players`);
  check('nobody is staged with nothing to play', silent === 0,
    silent ? `${silent} of ${players}: ${notes.join('; ')}`
      : `${players} players, every one with notes of their own`);
  check('every machine somebody minds is worked by hand', idle === 0,
    idle ? `${idle} of ${boxes} never touched: ${notes.join('; ')}`
      : `${boxes} minded machines, every one with a hand on it`);
  check('a machine that enters mid-number is visibly started', lateSilent === 0,
    lateSilent
      ? `${lateSilent} of ${lateEntries} enter with nobody touching them: ${notes.join('; ')}`
      : `${lateEntries} entries, every one with a hand on the panel first`);
  check('every sequencer has someone who could work it',
    hostless === 0 && busyHost === 0,
    hostless || busyHost
      ? `${hostless} hostless, ${busyHost} on hands that are full: ${notes.join('; ')}`
      : `${sequencers} hosted, ${bays} of them as a module in a modular`);
}

/**
 * No hand crosses to another keyboard faster than it could have got there.
 *
 * The teleport test, and the reason the board layout has exactly one owner:
 * `boardsFor` is read by the model that puts the keys down and by the
 * choreographer that decides whether a hand has time to reach them. If those
 * two ever disagreed the symptom would be a hand arriving early on a board it
 * could not have reached, which looks like nothing at all in a still and like a
 * glitch in motion.
 *
 * What is asserted is the honest minimum: a gesture that lands on a different
 * board from that effector's previous one must have had at least its own `prep`
 * of clear time since that previous gesture. `prep` is beats of travel *before*
 * the note — the whole reason this IR is scheduled rather than reactive — so a
 * crossing with less room than that is a hand that did not travel.
 */
{
  let crossings = 0;
  let rushed = 0;
  let players = 0;
  let worst = Infinity;
  const notes: string[] = [];
  for (const gid of CHECKED_GENRES) {
    for (let i = 0; i < 5; i++) {
      const concert = buildConcert({ seed: `board-${gid}-${i}`, genre: gid });
      for (const number of concert.numbers) {
        for (const p of number.cast.performers) {
          if (!p.boards || p.boards < 2) continue;
          players++;
          const last = new Map<string, { beat: number; board: number }>();
          for (const g of number.choreography.parts[p.id]?.gestures ?? []) {
            if (g.target.kind !== 'key') continue;
            const board = g.target.board ?? 0;
            const prev = last.get(g.effector);
            if (prev && prev.board !== board) {
              crossings++;
              const gap = g.beat - prev.beat;
              worst = Math.min(worst, gap - g.prep);
              if (gap < g.prep - 1e-6) {
                rushed++;
                if (notes.length < 3) {
                  notes.push(`${gid}#${i} ${p.id} ${gap.toFixed(3)} < prep ${g.prep.toFixed(3)}`);
                }
              }
            }
            last.set(g.effector, { beat: g.beat, board });
          }
        }
      }
    }
  }
  check('no hand reaches a second keyboard faster than it could', rushed === 0,
    rushed ? `${rushed} of ${crossings}: ${notes.join('; ')}`
      : `${crossings} crossings by ${players} players, tightest with ${
        crossings ? worst.toFixed(3) : '—'} beats to spare`);
}

/**
 * Every keyboard somebody stands at gets played.
 *
 * The rule that makes gear honest, and the one thing nothing was asserting while
 * three players in ten stood behind a board their hands never reached. A second
 * keyboard is not scenery, a set dressing or a silhouette: if it is on the
 * stand, a hand lands on it during the number.
 *
 * It holds by construction now rather than by luck — `boardsWanted` in `cast.ts`
 * gives a player a second board only when there is a second part to put on it or
 * a part that has to split across two — so this check is the guard on that
 * derivation. A board with no gesture on it means something upstream started
 * drawing a number again.
 *
 * Stated per board rather than per player on purpose: "the player used more than
 * one keyboard" would pass a four-board rig that touched two of them.
 */
{
  let stations = 0;
  let idle = 0;
  const notes: string[] = [];
  for (const gid of CHECKED_GENRES) {
    for (let i = 0; i < 5; i++) {
      const concert = buildConcert({ seed: `idle-${gid}-${i}`, genre: gid });
      for (const number of concert.numbers) {
        for (const p of number.cast.performers) {
          const boards = p.boards ?? 1;
          if (boards < 2) continue;
          stations++;
          const played = new Set<number>();
          for (const g of number.choreography.parts[p.id]?.gestures ?? []) {
            if (g.target.kind === 'key') played.add(g.target.board ?? 0);
          }
          for (let b = 0; b < boards; b++) {
            if (played.has(b)) continue;
            idle++;
            if (notes.length < 3) {
              notes.push(`${gid}#${i} ${p.id} (${p.rig}, ${boards} boards) never touches ${b}`);
            }
          }
        }
      }
    }
  }
  check('every keyboard a player stands at is played', idle === 0,
    idle ? `${idle} untouched: ${notes.join('; ')}`
      : `${stations} multi-board stations, every board in use`);
}

/**
 * Where the walls of cabinets stand.
 *
 * Two rules, and they are one decision seen twice rather than two that have to
 * be kept in step. Back centre is the drum riser — 2.8 m wide, and the
 * drummer's box is `locked` so nothing will ever move it — so a modular may
 * only take the centre when the riser is empty, which is exactly when the
 * percussion source came back a machine. And two of them flank rather than
 * pile up, because two objects this size on one side of a stage means one of
 * them is behind the other.
 */
{
  const CENTRE = 0.9;
  let onTheDrummer = 0;
  let sameSide = 0;
  let centred = 0;
  let flanking = 0;
  let sidelined = 0;
  const notes: string[] = [];
  for (const gid of CHECKED_GENRES) {
    for (let i = 0; i < 6; i++) {
      const concert = buildConcert({ seed: `wall-${gid}-${i}`, genre: gid });
      for (const number of concert.numbers) {
        const walls = number.cast.performers.filter((p) => p.rig === 'modular');
        if (!walls.length) continue;
        const drummer = number.cast.performers.some((p) => p.layer === 'drums');
        const xs = walls.map((p) => p.station.position[0]);
        if (walls.length >= 2) {
          flanking++;
          if (xs.every((x) => x > 0) || xs.every((x) => x < 0)) {
            sameSide++;
            if (notes.length < 3) notes.push(`${gid}#${i} both at ${xs.map((x) => x.toFixed(1))}`);
          }
        } else if (Math.abs(xs[0]!) < CENTRE) {
          centred++;
          if (drummer) {
            onTheDrummer++;
            if (notes.length < 3) notes.push(`${gid}#${i} centred at ${xs[0]!.toFixed(2)} with a drummer`);
          }
        } else sidelined++;
      }
    }
  }
  check('a modular takes the centre only when the riser is empty', onTheDrummer === 0,
    onTheDrummer ? `${onTheDrummer} on top of a drummer: ${notes.join('; ')}`
      : `${centred} centred, ${sidelined} sidelined, ${flanking} pairs`);
  check('two modulars flank rather than pile up', sameSide === 0,
    sameSide ? `${sameSide} of ${flanking} pairs on one side: ${notes.join('; ')}`
      : `${flanking} pairs straddle the centre line`);
}

/**
 * Sticking: the drummer's arms are not knotted, and both of them play.
 *
 * The one part of this show whose failure mode is a *posture* rather than a
 * missing gesture, which is why it needs its own assertion. Every physical rule
 * above passes on a drummer whose left stick is out on the ride while the right
 * one is back on the hi-hat: nothing is in two places, nothing overlaps its own
 * release, every note has a hand. It is simply a person who could not exist, and
 * the only way to see it in the IR is to ask where the two hands are at once.
 *
 * Two questions, and the second is why the first is not enough. **Knotted** is
 * `armsKnotted` — crossed past a tom's width with neither forearm above the
 * other — and the hats-over-snare cross a drummer holds all evening is
 * deliberately not one, so this can be held near zero rather than at some
 * tolerated percentage. **Both of them play** catches the opposite failure and
 * the more tempting one: a planner can drive the knots to exactly zero by never
 * moving the left arm at all, and a drummer playing a fill one-handed with the
 * other stick hanging is no better than a drummer in a knot.
 *
 * What is counted is a knot that *persists* — knotted after this stroke and
 * still knotted after the next one — rather than every instant of one. Arms
 * cross in passing all the time and it is not a fault: `ht mt lt ht` alternated
 * puts the right hand back on the high tom while the left is still coming off
 * the floor tom, which is one eighth of daylight and is what the figure looks
 * like when a person plays it. Measured per instant this reads 1.4% and says
 * nothing; measured as a posture the drummer is left holding, it is the thing
 * the eye actually objects to.
 */
{
  let strokes = 0;
  let knotted = 0;
  let idleHand = 0;
  let states = 0;
  let worst = '';
  for (const gid of CHECKED_GENRES) {
    for (let i = 0; i < 4; i++) {
      const concert = buildConcert({ seed: `check-${gid}-${i}`, genre: gid, vocals: 'mixed' });
      for (const number of concert.numbers) {
        for (const performer of number.cast.performers) {
          if (performer.layer !== 'drums') continue;
          const part = number.choreography.parts[performer.id];
          if (!part) continue;
          const hits = part.gestures
            .filter((g): g is Gesture & { target: { kind: 'drum'; voice: DrumVoice } } =>
              g.target.kind === 'drum'
              && (g.effector === 'left-hand' || g.effector === 'right-hand'))
            .sort((a, b) => a.beat - b.beat);

          const at: Record<'left-hand' | 'right-hand', { voice: DrumVoice; beat: number }> = {
            'left-hand': { voice: 'sd', beat: -Infinity },
            'right-hand': { voice: 'hh', beat: -Infinity },
          };
          /** Consecutive strokes on one hand that each moved somewhere new. */
          let solo = 0;
          let wasKnotted = false;
          for (const g of hits) {
            const hand = g.effector as 'left-hand' | 'right-hand';
            const other = hand === 'left-hand' ? 'right-hand' : 'left-hand';
            solo = at[hand].beat > at[other].beat && at[hand].voice !== g.target.voice
              ? solo + 1 : 0;
            if (solo >= 3) { idleHand++; solo = 0; }
            at[hand] = { voice: g.target.voice, beat: g.beat };
            strokes++;
            // Both hands have to have played before there is a posture at all.
            if (at[other].beat === -Infinity) continue;
            states++;
            const now = armsKnotted(at['left-hand'].voice, at['right-hand'].voice);
            if (now && wasKnotted) {
              knotted++;
              if (!worst) worst = `${gid} b${g.beat} L:${at['left-hand'].voice} R:${at['right-hand'].voice}`;
            }
            wasKnotted = now;
          }
        }
      }
    }
  }
  const rate = knotted / Math.max(states, 1);
  check('the drummer\'s arms are never knotted', rate < 0.002,
    `${(rate * 100).toFixed(2)}% of ${states} postures held${worst ? ` — ${worst}` : ''}`);
  const idle = idleHand / Math.max(strokes, 1);
  check('the drummer plays figures with both hands', idle < 0.004,
    `${(idle * 100).toFixed(2)}% of ${strokes} strokes begin a one-armed figure`);
}

// Determinism — the property the whole repo is built on, at show scale.
const showA = JSON.stringify(buildConcert({ seed: 'twice', genre: 'jazz' }));
const showB = JSON.stringify(buildConcert({ seed: 'twice', genre: 'jazz' }));
check('the same seed builds the same show', showA === showB,
  `${(showA.length / 1024).toFixed(0)} kB of IR`);

// --- The grid the audio is on --------------------------------------------
//
// The choreographer must place gestures on the same sixteenth grid the Strudel
// renderer quantises to, or a hand arrives up to a 32nd away from the sample it
// is supposedly causing — worst on swung offbeats, which is where the ear is
// least forgiving. See `core/grid.ts`.
console.log('\nGrid');

const grid = [0, 0.5, 1 / 3, 0.7501, 2.075, 11.9, 63.26];
check('quantise is idempotent', grid.every((b) => quantise(quantise(b)) === quantise(b)),
  `${grid.length} probes`);
check('quantise lands on a slot boundary',
  grid.every((b) => Math.abs(quantise(b) * 4 - Math.round(quantise(b) * 4)) < 1e-9),
  'sixteenths');

// -------------------------------------------------------------------------
console.log(
  problems.length
    ? `\n${problems.length} problem(s): ${problems.join('; ')}\n`
    : '\nAll concert checks passed.\n',
);
process.exit(problems.length ? 1 : 0);
