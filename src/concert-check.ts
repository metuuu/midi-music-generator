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
import { generateSong } from './generate/song.js';
import { GENRE_IDS, getGenre } from './genre/index.js';
import { INSTRUMENTS, type InstrumentId } from './style/instruments.js';
import {
  ARCHETYPES, ARCHETYPE_OF, archetypeForTrack, trackCanReach,
} from './concert/instruments.js';
import { buildConcert, soundingEffectors } from './concert/index.js';

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

const CHECKED_GENRES = ['iskelma', 'jazz', 'ambient'];
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
          (g) => sounding.has(g.effector) && g.target.kind !== 'rest',
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
check('visemes exist exactly when there is a voice', visemeGaps === 0,
  visemeGaps ? `${visemeGaps} mismatches` : 'none');

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
