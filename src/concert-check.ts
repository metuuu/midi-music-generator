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
import { isPlayedByHand } from './core/types.js';
import { generateSong } from './generate/song.js';
import { GENRE_IDS, getGenre } from './genre/index.js';
import { INSTRUMENTS, type InstrumentId } from './style/instruments.js';
import {
  ARCHETYPES, ARCHETYPE_OF, SYNTH_RIGS, archetypeForTrack, trackCanReach,
} from './concert/instruments.js';
import { buildConcert, soundingEffectors } from './concert/index.js';
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
        const track = song.tracks.find((t) => t.layer === performer.layer);
        const notes = performer.layer === 'drums'
          ? song.drums.events.length
          : track?.notes.length ?? 0;
        const sounded = part.gestures.filter(
          (g) => sounding.has(g.effector) && g.target.kind !== 'rest' && !silentPedal(g),
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
  let mimed = 0;
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
        // A machine does not count anybody in; somebody presses start.
        if (number.song.meta.leadInBars) counted++;
        for (const m of placed) {
          const [x, , z] = m.position;
          if (Math.abs(x) > halfW + 0.01 || Math.abs(z) > halfD + 0.01) offStage++;
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
