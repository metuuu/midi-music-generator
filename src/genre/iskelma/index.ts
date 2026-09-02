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
import { STAGING } from './staging.js';

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
  walkup: 0.3,
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
  // A dance band finishes together and the floor claps. Both of these are the
  // same fact from either end: somebody counts it in, and it lands on a button.
  ending: 'button',
  countIn: true,

  /**
   * The band leans into the chorus, and it is not a jazz import.
   *
   * The tango's drag into the downbeat and the humppa's tutti stop are this
   * genre's own gestures — it is the repertoire most built on them. `break` is
   * the one kind left out: a pavilion band stopping dead empties the floor,
   * which is the same reason `soloBacking` is `full` and `tutti` is weighted
   * down in `arrangement` below.
   *
   * Genre-level rather than per style because it is true of the whole
   * repertoire; a style that disagrees overrides it, which is what
   * `transitionTable` in `song.ts` resolves.
   */
  transitions: [['fill', 6], ['shot', 2], ['elide', 2]],

  defaultStrictness: 'standard',
  // Verse/chorus pop: the chorus is supposed to be the same tune each time, and
  // for most of this repertoire that is the entire point of the chorus.
  defaultHook: 'standard',

  // This is dance music and the floor is full. A rhythm section that gets
  // clever behind the break is a rhythm section that has forgotten its job, so
  // the arrangement continues exactly as written.
  soloBacking: 'full',

  /**
   * A written horn figure and a sax answering the singer are what this music is
   * arranged out of; a shout chorus is not.
   *
   * `riff` and `harmony` up, because both are audible on almost every record in the
   * repertoire — the brass stab that comes round every second bar, and the thirds
   * behind the second half of the chorus. `tutti` down for the reason `soloBacking`
   * is `full` two lines above: the band stopping to hit a figure together empties
   * the floor, and this band does not empty the floor.
   *
   * **`harmony: 5` is this genre's answer for the band, and two styles now
   * declare a sung `HarmonyProfile` beside it.** The two statements do not
   * compete, and the reason they do not is the layer.
   *
   * The case against a declaration was written here first and most of it stands.
   * A declaration lands on `counter` unless it says otherwise, and the counter
   * here is the *answering* voice — `solo.rotation` below hands it the entire
   * break, and the `voice` block argues `long-note` up on the grounds that if the
   * sax answers the singer then the tune is the call and leaves the holes. A
   * standing part in thirds occupies those holes for the length of the statement,
   * which is the one thing the answer is for. So no style here declares
   * `on: 'counter'`, and `harmony: 5` remains the whole of what the band does:
   * one phrase, in the second half of a chorus, which is where `Device.harmony`
   * places itself and where this repertoire actually puts it.
   *
   * `on: 'vocal'` is a different claim about a different performer. It writes
   * over the singer's own syllables, asks no instrumentalist for anything, and no
   * longer suppresses the device — `song.ts` gates that on a profile competing
   * for the same players, which a sung one does not. So the sax goes on answering
   * and the horns go on harmonising exactly as they did, and the second voice in
   * the chorus is a second voice rather than a redistribution of the first.
   *
   * The remaining objection was practical and is now measured rather than
   * guessed. There is one baritone in `vocals.ts`, `centre: 57`, working to G4,
   * and `generateVocalStack` writes both parts with it — so the stack goes
   * *under* the tune here where country puts it over. A third above sat 23.7% of
   * its notes past the top of the range; the same draw underneath reads 4.8%,
   * inside what the lead already spends there. See `chorusThirds` in
   * `styles.ts`, which carries the numbers, the two amounts, and the reasoning
   * for the five styles that declare nothing — `tango` because it is a solo
   * singer's number and always was, `humppa` because its tune is the lowest in
   * the genre and measures worse than its own lead in either direction.
   */
  arrangement: { riff: 6, harmony: 5, tutti: 2 },

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
  /**
   * What the tunes are made of — for the five styles that have no voice of their own.
   *
   * `tango` and `iskelmapop` are authored in `tune/voice.ts` and return from
   * `voiceForStyle` before this is read, which is the right split: they are the two
   * ends of the repertoire and each already argues its own case. What is left is
   * humppa, valssi, jenkka, foksi and beguine, and what those five share is not a
   * tempo or a metre. It is a hall full of people dancing to a tune they are
   * expected to recognise the second time it comes round.
   *
   * Three keys only, and four archetypes inside the first. The six scalars stay
   * derived, because they already differ where the styles genuinely differ — the
   * five spread 2.9 to 5.6 onsets a bar off their own cells — and so do two of the
   * six archetypes, for the reason given under each. What is stated has to leave
   * these five *between* tango and iskelmäpop rather than outside them, which is
   * the test the opening paragraph sets and the one thing a genre-level number is
   * most likely to fail.
   *
   * **`arch-hook` at 4 — both authored ends' figure, and the weight derivation
   * cannot guess at:** `archetypesFor` hands every style in the catalogue a flat 3.
   * `FORMS` above says otherwise, and it is the evidence here that is about the
   * tune rather than the break: all four forms state the chorus three times, and
   * three of them — weights 5, 3 and 4 of 17 — end chorus, chorus, outro. A tune
   * that has to survive being the last thing heard twice running is a tune with one
   * high point and a figure that comes back. `defaultHook: 'standard'` is *not* the
   * evidence: it is level 2 of 0–4, humppa overrides it upward, and `repetitionFor`
   * reads it directly already, so weighting an archetype on it counts it twice.
   *
   * **`long-note` is up from 0.4–0.57, on evidence `derivedVoice` never opens.** The
   * `long-note` reading is a function of `melodyCells` alone, and `cadenceCells` is
   * referenced nowhere outside the genre tables, so nothing sees that valssi's first
   * cadence cell is `[12]` at weight 5 — the whole 3/4 bar held — or that foksi's and
   * beguine's is `[16]`. The cadence cells run 1.5 to 2.1 onsets a bar against 2.9 to
   * 5.6 for the melody cells: every style ends two to three times sparser than it
   * moves, and only the bodies of the phrases are busy.
   *
   * **`wide-interval` at 2, which is what this genre's own two authored voices call
   * a leap of 0.22 and 0.24** (`tune/voice.ts:177`, `:216`). These five sit at 0.20
   * to 0.30 and bracket both, and `0.5 + leap × 5` spreads them 1.5 to 2.0 — so this
   * is a push on valssi and beguine, nothing on humppa, and *not* a claim that a
   * pavilion tune leaps wider than a tango. The argument for saying it at all is the
   * archetype's gloss, *a singer's tune*, against `keys` above chosen to be singable:
   * a whole-repertoire fact that a per-style note-to-note appetite cannot state.
   *
   * **`chant` at 2 splits humppa's 2.5 and valssi's 0.9.** Humppa's own note says
   * the dance depends on the tune coming round again "without asking anyone to
   * follow a development", and jenkka's bounce is in the dotted cell rather than in
   * the metre — *the hook is the rhythm*, which is the archetype word for word. A
   * valssi is not a chant, so this does not go higher.
   *
   * **`descending-sequence` and `riff-response` are left derived, and that is a
   * decision rather than an omission.** The Andalusian descent is real — valssi's
   * verse, beguine's twice through — and absent from the three major-key styles, so
   * any flat number hands humppa and jenkka the property the sentence just denied
   * them; the derived band is 2.05 to 2.5 and each style keeps its place in it. And
   * `arrangement.riff: 6` two blocks up is an *accompaniment* weight — a brass stab
   * every second bar, a sax answering the singer — where `riff-response` is a form
   * for the tune itself. If the sax answers the singer then the tune is the call and
   * leaves the holes, which argues for `long-note` above and not for this. The
   * derivation's reading — busy cells, no ornament — spreads the five 1.1 to 4.2,
   * and no melodic table here contradicts it.
   *
   * **Subsets, and the rule they are weighted for is a minor-mode rule.** The header
   * of this file states it: aeolian, harmonic minor the moment a dominant arrives,
   * so the leading tone leads. By `modeWeights` these five are minor 12, 58, 14, 30
   * and 55 per cent of the time — about a third of what this voice writes, and the
   * weights below are set knowing that. The rule is inaudible in a tune with no
   * seventh degree in it, so the three sets carrying one take three quarters of the
   * weight (8.5 of 11.5) and `[0, 1, 2, 4, 5]`, which drops it, is held level with
   * the second rather than leading.
   *
   * **Ops.** `sequence` to the top of the derived band (1.2–1.5) and `transpose`
   * just above it (1.12–1.3): the circle-of-fifths turnaround is named as the
   * definitive figure of humppa's chorus (VI7–II7–V7 at weight 5), runs the whole of
   * foksi's bridge and closes valssi's major verse, and harmony walking in fifths
   * wants a figure walking with it. Nothing here is about the key change —
   * `relativeMajorChorus` is the key route's job, and `Op`'s own doc says plainly
   * that is not what `transpose` is.
   *
   * **`ornament` up because the genre has already said it once**, in the break
   * above: the accordion or fiddle takes the tune and ornaments it,
   * `vocabulary.ornament` is 0.4 against `chromatic: 0.1`, and the comment there
   * calls it the whole content of the break.
   *
   * **Three down, and they are one statement.** `displace` shifts a whole figure
   * off the beat, which is the thing a dance band must not do. 0.5 is not a guess:
   * it is where the two least syncopated of the five already derive — humppa 0.48,
   * valssi 0.57 — and the entry puts jenkka's 0.75, foksi's 0.98 and beguine's 1.20
   * down there with them. `melody.syncopation` is not spent twice: it drives pace
   * and the duration menu, the weak-onset promotion in `accentuate` and the pickup
   * chance, and reaches `accentTemplate` only for a voice with no accent table,
   * which none of these is — `cellAccents` builds theirs from the cells. Beguine is
   * not the counter-example it looks like either: its 3-3-2 is written into the
   * cell, `[6, 6, 4]`, rather than applied to one. `diminish` because
   * `doubleTime: 0.08` two blocks up already says it. `invert` because a tune turned
   * upside down is a tune nobody recognises the second time, which is the one thing
   * this repertoire cannot afford.
   */
  voice: {
    archetypes: [
      ['arch-hook', 4],
      ['wide-interval', 2],
      ['chant', 2],
      ['long-note', 1.2],
    ],
    subsets: [
      [[0, 1, 2, 3, 4, 5, 6], 4],  // the lot — V7 in every progression of all five
      [[0, 2, 3, 4, 6], 3],        // 1 3 4 5 7 in the major styles, pentatonic in the minor
      [[0, 1, 2, 4, 5], 3],        // 1 2 3 5 6 bright and folk under humppa and jenkka; under
                                   // valssi and beguine it reads 1 2 ♭3 5 ♭6 — the flat sixth
                                   // with no seventh, the one colour where the header rule goes quiet
      [[0, 1, 2, 3, 4, 6], 1.5],   // no sixth: ♭6 to ♮7 is an augmented second, and these keys are sung
    ],
    ops: {
      sequence: 1.5, transpose: 1.4, ornament: 1.3,
      displace: 0.5, diminish: 0.4, invert: 0.4,
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

  /**
   * The pavilion, the summer suits and the tanssilava bill. See `staging.ts`,
   * and `Staging` in `../types.ts` for why a genre carries its own.
   */
  staging: STAGING,
};
