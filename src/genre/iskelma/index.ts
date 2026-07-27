/**
 * Finnish iskelmä.
 *
 * Melody is key-relative: aeolian throughout, switching to harmonic minor the
 * moment a dominant-function chord arrives so the leading tone actually leads.
 * That single rule does more for the idiom than anything else here.
 */

import { makeScale } from '../../core/scale.js';
import type { Genre, FormStep } from '../types.js';
import { STYLES } from './styles.js';
import { ERAS } from './eras.js';
import { MOODS } from './moods.js';
import { VOCALS } from './vocals.js';
import { generateTitle } from './titles.js';

/** Verse/chorus song forms. The final chorus is where the key change lands. */
const FORMS: (readonly [FormStep[], number])[] = [
  [[
    { kind: 'intro', bars: 4 }, { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'solo', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'outro', bars: 4 },
  ], 5],
  [[
    { kind: 'intro', bars: 4 }, { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 }, { kind: 'bridge', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'outro', bars: 4 },
  ], 5],
  [[
    { kind: 'intro', bars: 4 }, { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'chorus', bars: 8 }, { kind: 'outro', bars: 4 },
  ], 3],
  [[
    { kind: 'intro', bars: 4 }, { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'solo', bars: 8 }, { kind: 'chorus', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 4],
];

export const iskelma: Genre = {
  id: 'iskelma',
  label: 'Iskelmä',
  description: 'Finnish dance-pavilion pop — tango, humppa, valssi, jenkka, foksi, beguine, 80s radio iskelmä.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,
  keys: {
    // Singable, and friendly to accordion and guitar.
    minor: [[9, 5], [4, 4], [2, 4], [7, 3], [11, 3], [0, 2], [5, 2], [6, 1]],
    major: [[0, 5], [7, 4], [5, 4], [2, 3], [10, 3], [9, 2], [3, 2]],
  },
  defaultStrictness: 'standard',
  // Verse/chorus pop: the chorus is supposed to be the same tune each time, and
  // for most of this repertoire that is the entire point of the chorus.
  defaultHook: 'standard',

  // This is dance music and the floor is full. A rhythm section that gets
  // clever behind the break is a rhythm section that has forgotten its job, so
  // the arrangement continues exactly as written.
  soloBacking: 'full',

  /**
   * The instrumental break — which is not improvisation, and pretending
   * otherwise would be wrong about the genre.
   *
   * The accordion, fiddle or saxophone takes the *tune* and ornaments it:
   * grace notes, mordents, a run into the phrase, a rising final figure into
   * the last chorus. That is what `paraphrase: 0.7` buys — the solo engine
   * lifts its cells from the head's own contour rather than inventing over the
   * changes, so the break is recognisably the song.
   *
   * One entry in the rotation, on purpose. The break belongs to the featured
   * instrument and stays with it for as long as it lasts; a break that changed
   * hands every eight bars would be a jam session at a tanssilava, which is not
   * a thing that happens. `planSolos` prefers a fresh soloist and falls back to
   * the incumbent when the pool has nobody else, which is exactly this case.
   *
   * **Never the drums.** A drum solo at a tanssilava clears the floor.
   */
  solo: {
    rotation: [['counter', 1]],
    tradeFours: 0,
    // The break should sound like the song it is in the middle of, and this
    // genre's whole proposition is that you already know the tune.
    quoteMotto: 0.6,
    backing: { counter: 'full' },
    vocabulary: {
      gait: 0.5,
      doubleTime: 0.08,
      // The accent belongs to the dance, not to the player.
      offbeatAccent: 0.1,
      enclosure: 0.12,
      chromatic: 0.1,
      // The whole content of the break. A jazz player's decoration is chromatic
      // approach; this one's is a crushed note before the beat.
      ornament: 0.4,
      develop: 0.72,
      displace: 0.2,
      space: 0.22,
      climb: 2,
      // A third, and not more, and the reason is measurable. A break made
      // *entirely* of literal bars of the tune has no figure of its own to turn
      // over: the tune's bars all differ from each other, so quoting them in
      // order is paraphrase without development, and motivic recurrence
      // measured 8% against jazz's 19%. At a third, two phrases in three
      // develop the bar that was just quoted — which is what an accordionist
      // taking a break actually does, and it reads as more of the tune rather
      // than less.
      paraphrase: 0.33,
      // The run up into the last chorus. This is the gesture the break exists
      // to deliver, and it is why the arc's reserved bars are not silence here.
      liftIntoReturn: 0.85,
    },
  },
  scaleForChord: (tonic, mode, chord) => {
    if (mode === 'minor' && chord.dominantFunction) return makeScale(tonic, 'harmonicMinor');
    return makeScale(tonic, mode === 'minor' ? 'minor' : 'major');
  },
  duration: [105, 185],
  /** The dance-band vocabulary: toms into the chorus, and know when not to. */
  fills: [
    ['tom-roll', 5], ['snare-toms', 3], ['snare-roll', 3], ['lead-in', 2], ['drop', 1],
  ],
};
