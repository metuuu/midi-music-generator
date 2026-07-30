/**
 * The Performance IR — the hand-off point between "what is played" and "what
 * you see".
 *
 * This is the same move the project already made once. `core/types.ts` is the
 * Song IR, and nothing below it knows about Strudel, MIDI or Web Audio; two
 * renderers consume it and neither can influence what the generator wrote.
 * The stage is the third renderer, and it earns the same wall.
 *
 * Nothing in this directory may import three.js, Strudel or the DOM. That is
 * not tidiness — it is three specific properties:
 *
 *  1. **The visuals cannot cheat.** A choreographer that can only see
 *     `NoteEvent[]` has no path by which a nice-looking animation quietly
 *     changes what is heard. "Generated from the MIDI, not the other way
 *     around" becomes structural rather than a promise.
 *  2. **It ports.** A native engine consuming the Song IR gets the staging for
 *     free: same data, different renderer. A concert is the most demanding
 *     test there is of whether the IR carries enough to drive something other
 *     than audio — if a drummer's left hand cannot be placed from it, the IR is
 *     missing something and we want to find that out here.
 *  3. **It is testable without eyes.** Everything below is data, so
 *     `npm run concert` can assert that no hand teleports, that every note has
 *     a gesture, and that no two players are standing in the same place.
 *
 * ## Conventions, fixed here and nowhere else
 *
 * **Space.** Metres. Origin at stage centre on the boards. `+x` is the
 * *audience's* right, `+y` is up, `+z` is downstage — toward the audience.
 * Upstage is therefore `-z`. Stage-left/stage-right are avoided throughout
 * because they are relative to a performer facing the other way, and half the
 * bugs in a staging system are that sentence.
 *
 * **Rotation.** Radians about `+y`. A performer's forward vector is
 * `(sin(facing), 0, cos(facing))`, so `facing: 0` looks straight at the
 * audience and `+π/2` looks toward the audience's right.
 *
 * **Handedness follows from that, and is worth stating once rather than being
 * re-derived.** With `+z` forward and `+y` up, `right = forward × up` puts a
 * performer's *right* side at local `-x` — the audience's left, which is what
 * "stage right" has always meant and why the term is avoided here. So a
 * right-handed drum kit has its hi-hat at `+x` and its ride at `-x`, and a
 * keyboard's bass end is at `+x`. Two independently built systems derived this
 * and agreed; the third should not have to.
 *
 * **Time.** Beats from the start of the number, fractional, matching
 * `NoteEvent.beat`. Never seconds and never frames — a beat survives a tempo
 * the renderer has not been told about, and every consumer already has the BPM.
 * Anything that must line up with a note quantises through `core/grid.ts`.
 *
 * **Levels.** 0..1 throughout, like `velocity` and `gain` in the Song IR.
 *
 * **Colours.** `#rrggbb` strings. A renderer converts; the IR stays printable.
 */

import type { Midi } from '../core/pitch.js';
import type {
  BackingPolicy, Consonant, DrumVoice, LayerId, Song, Vowel,
} from '../core/types.js';
import type { GenerateOptions } from '../generate/song.js';

// ---------------------------------------------------------------------------
// Instruments as physical objects
// ---------------------------------------------------------------------------

/**
 * A thing a person stands behind and operates, as opposed to a patch.
 *
 * The catalogue in `style/instruments.ts` has 77 entries because it is a list
 * of *sounds*. A stage needs a list of *objects*, and there are far fewer of
 * those: a tenor and a baritone sax are one model at two sizes, and eight synth
 * pads are one keyboard. See `concert/instruments.ts` for the mapping, which is
 * exhaustive by construction — adding a sound to the catalogue without saying
 * what it looks like is a compile error rather than a box on stage.
 */
export type Archetype =
  | 'drumkit'
  | 'grand-piano'
  | 'electric-piano'
  | 'organ'
  | 'accordion'
  | 'harmonica'
  | 'acoustic-guitar'
  | 'electric-guitar'
  | 'upright-bass'
  | 'electric-bass'
  | 'violin'
  | 'cello'
  | 'harp'
  | 'mallets'
  | 'trumpet'
  | 'trombone'
  | 'saxophone'
  | 'clarinet'
  | 'flute'
  | 'synth'
  | 'sitar'
  | 'singer';

export type InstrumentFamily =
  | 'percussion' | 'keys' | 'bowed' | 'plucked'
  | 'wind' | 'brass' | 'free-reed' | 'electronic' | 'voice';

/**
 * How the player is arranged around the instrument.
 *
 * `straddle` is a chair like `sit` is, and it is a separate posture because of
 * what is between the knees. A pianist's legs go forward under a keyboard and
 * may sit as close together as they like; a cellist's have a body the width of
 * their own shoulders between them, and knees at a pianist's spacing put a
 * thigh straight through it. The difference is a stance, not a seat height, so
 * it belongs here rather than in any one model.
 */
export type Posture =
  | 'stand'    // guitar, horns, singer
  | 'sit'      // piano bench, harp stool
  | 'straddle' // a chair, knees turned out round the instrument: cello
  | 'stool'    // upright bass, high stool
  | 'kit'      // behind a drum kit, both feet occupied
  | 'perch';   // leaning over a table of gear

/**
 * Geometry-free facts about an archetype.
 *
 * Everything the choreographer, the stager and the verifier need in order to
 * work before a single model exists. The models (`web/concert/instruments/*`)
 * are the only things that know where anything physically *is*.
 */
export interface ArchetypeSpec {
  id: Archetype;
  label: string;
  family: InstrumentFamily;
  /** How many hands the instrument occupies. A singer uses none. */
  hands: 0 | 1 | 2;
  posture: Posture;
  /** Which `PlayPoint` kinds a model of this archetype must resolve. */
  points: PlayPoint['kind'][];
  /** Playable range. `npm run concert` asserts no gesture falls outside it. */
  range: [Midi, Midi];
  /** Open-string pitches, low to high. Fretted and bowed archetypes only. */
  strings?: Midi[];
  /** Highest fret the model provides. Absent means unfretted. */
  frets?: number;
  /**
   * The player has to breathe, visibly, and cannot play through a rest.
   * `IDIOMS[...].breath` in `style/instruments.ts` already says how badly; this
   * says whether it applies at all.
   */
  blown?: boolean;
  /**
   * Whether the player carries the instrument or stands at it.
   *
   * The distinction is not decoration: a carried instrument moves with the
   * body, so when a saxophonist sways into a phrase the saxophone goes too. A
   * standing one does not, and the player moves against it — a pianist leans
   * over a keyboard that stays exactly where it was.
   *
   * Getting this wrong is immediately visible and was: with every instrument
   * treated as furniture, the front-line wind player swayed straight through
   * their own horn.
   */
  held: boolean;
  /**
   * Radius in metres the instrument and its player occupy. Staging keeps these
   * from overlapping; a drum kit needs considerably more room than a flute.
   */
  footprint: number;
  /**
   * Height above the boards of the surface being played, in metres. The camera
   * frames on this rather than on the head — a shot of a pianist should contain
   * the keyboard.
   */
  workHeight: number;
}

// ---------------------------------------------------------------------------
// Gestures
// ---------------------------------------------------------------------------

/**
 * *Where* on an instrument something happens, said musically.
 *
 * This is the seam that makes parallel work possible, and it is the most
 * important type in this file. The choreographer emits
 * `{ kind: 'drum', voice: 'ht' }` — it knows the high tom is being hit and has
 * no idea where the high tom is. The drum-kit model answers "there, at that
 * angle" and has no idea what a bar is. Neither has to exist for the other to
 * be written, or tested.
 *
 * Every model implements exactly one method against this — `resolve(point)` —
 * and the animation runtime is the only thing that ever calls it.
 */
export type PlayPoint =
  /** A key on a keyboard, by pitch. */
  | {
    kind: 'key'; midi: Midi;
    /**
     * How far open the bellows are when this key is struck, 0 shut .. 1 out.
     *
     * Free reeds only, and the accordion is the only one here. It is on the
     * *note* because the box's whole motion is a fact about the music and
     * nothing else: a bellows is a tank of air, every sounding note spends
     * some, and the direction turns when it runs out — which is a decision only
     * something that can see the phrase ahead can make. The model is handed the
     * answer and runs the box under the note, so the bellows follows the part
     * instead of twitching once a phrase.
     *
     * It does *not* place the left hand. That hand is carried by the bass side
     * through `InstrumentModel.shift`, off the box's live position, because a
     * value sampled on the beat is right for one frame and stale for every
     * frame of the note after it.
     *
     * Absent on every other keyboard, and on an accordion whose part was
     * choreographed before this existed.
     */
    bellows?: number;
    /**
     * Which keyboard, where the player is standing at more than one.
     *
     * `0` — and absent — is the board under the hands: the one a player with a
     * single keyboard is at, and the one anything written before this existed
     * meant. Higher indices are the extra boards a station carries, laid out by
     * `boardsFor` in `concert/instruments.ts`.
     *
     * On the `PlayPoint` rather than inferred from pitch, and that is the whole
     * design. A model asked to pick a board from the note would send the same
     * phrase to a different keyboard whenever it crossed a register line, and
     * the hands would flit between boards mid-figure. *Which* board is a
     * decision about the music — this line is the lead and it wants the board
     * with the lead sound on it — so it belongs to the thing that can see the
     * phrase, exactly as `bellows` above does for the same reason.
     *
     * A board the model does not have resolves to `undefined` rather than
     * falling back to board 0. A hand that visibly does not know where to go is
     * a bug worth seeing.
     */
    board?: number;
  }
  /**
   * A control on the panel — a knob, a slider, a start switch.
   *
   * The one point in this union that is not a note. It exists because a player
   * standing at a rig with a machine running in it is doing something, and what
   * they are doing is not playing keys: they start the sequencer, they stop it,
   * and they move the filter while it runs.
   *
   * `at` is 0..1 across the instrument's control surface, bass end to treble
   * end, and it is deliberately that vague. The choreographer has no business
   * knowing which knob is the cutoff — it knows *that a hand goes to the panel*,
   * which is the same altitude at which it knows a high tom is being hit
   * without knowing where one is. A model answers with a real point.
   */
  | {
    kind: 'control'; at: number;
    /**
     * Which of this player's machines the hand is on, indexed into the
     * `StageMachine`s whose `tendedBy` is them, in cast order.
     *
     * Absent means the player's own panel — the filter they are sweeping is on
     * the synthesiser under their hands. Present means a *separate object*
     * standing beside them, and the difference is a metre of stage: a machine
     * now has a stand of its own (`StageMachine.mount`), so a hand sent to the
     * keyboard's panel to start it would press a knob with nothing under it
     * while the box across the way lit up by itself.
     *
     * On the point rather than inferred, for the reason `key.board` is: which
     * object a hand is going to is a decision, and the thing that made it is
     * the only thing that can say.
     */
    machine?: number;
  }
  /** A stopped string. `string` indexes `ArchetypeSpec.strings`, low to high. */
  | { kind: 'string'; string: number; fret: number }
  /** A drum or cymbal, by the voice the Song IR names. */
  | { kind: 'drum'; voice: DrumVoice }
  /** Valves or a slide, by the pitch being fingered. */
  | { kind: 'valve'; midi: Midi }
  /** Tone holes or keywork, by pitch. */
  | { kind: 'hole'; midi: Midi }
  /** A foot pedal. */
  | {
    kind: 'pedal'; which: 'hat' | 'kick' | 'sustain';
    /**
     * Whether the foot is holding this pedal *down*. Hi-hat only, and the
     * default is down.
     *
     * A hi-hat pedal is the one pedal here that is not a trigger: it has two
     * resting places, and which of them the foot is at is what decides whether
     * the cymbals are shut or parted. So the point has to carry it, for the
     * same reason `key.bellows` does — the state is a fact about the *music*,
     * known only to something that can see whether the next hat is `hh` or
     * `oh`, and the model is handed the answer rather than guessing it from
     * what it last heard.
     *
     * It also keeps `resolve` pure while still giving the foot two places to
     * be: the board is at one angle with the hats shut and another with them
     * open, and both are constants of the geometry, not of the moment.
     */
    shut?: boolean;
  }
  /**
   * Bellows, which move continuously rather than being struck.
   *
   * `open` is the direction the arm is now travelling; `at` is how far open the
   * box is as it sets off, 0 shut .. 1 out — the same measurement, at the same
   * instant, that a `key` point's `bellows` carries, so the arm and the notes
   * can never disagree about where the box has got to. The direction alone was
   * the whole point for a while and it was not enough to be *natural* with: an
   * accordionist does not run to the end of the bellows and back on every
   * phrase, they spend the air they have and turn round when it runs out, so
   * where a squeeze *stops* is as much of the gesture as which way it goes.
   */
  | { kind: 'bellows'; open: boolean; at?: number }
  /** A mouth shape. See `Viseme` — this is how a sung note reaches the face. */
  | { kind: 'viseme'; vowel: Vowel; consonant: Consonant }
  /** Nowhere in particular: a rest, a breath, an idle position. */
  | { kind: 'rest' };

/**
 * The limb or feature a gesture moves.
 *
 * Deliberately not "bone". There is no skeleton — see the Rayman-hands note in
 * the plan. An effector is a thing that gets *placed*, and having no elbow
 * between it and the body is what makes this feature tractable at all.
 */
export type Effector =
  | 'left-hand' | 'right-hand'
  | 'left-foot' | 'right-foot'
  | 'mouth' | 'bow' | 'body' | 'head' | 'eyes';

/**
 * What the four non-limb effectors mean, since "place it there" only obviously
 * describes a hand.
 *
 *   bow    the right hand, holding a bow. See `GestureKind.bow` for how stroke
 *          direction is expressed.
 *   head   the head's *centre*, clamped near its rest position — a head is
 *          attached. Attitude (gaze, nod) is a separate channel and must not be
 *          driven through here, or the two fight and gaze quietly drifts.
 *   mouth  moves the head so the *mouth* reaches the point, which is what a
 *          singer at a microphone is doing. Same clamp.
 *   body   leans the torso toward the point, clamped hard. This is
 *          `GrooveKind.lean`.
 *   eyes   gaze only. Exists so that "eyes closed while the head still nods"
 *          is sayable — `eyes-shut` and `watch` used to have to claim `head`,
 *          which `head-nod` also uses, and the three could not coexist.
 */

/** What the effector is doing when it arrives. Drives the easing and the pose. */
export type GestureKind =
  | 'strike'   // stick, mallet, hand — ballistic, and it bounces
  | 'pluck'    // finger or plectrum, small and quick
  | 'press'    // a key, weight rather than speed
  /**
   * A bow stroke, and specifically a *change of direction*.
   *
   * There is no up-bow/down-bow field, and this is how the absence is covered:
   * `bow` means "reverse the stroke", `hold` on the same effector means
   * "continue under the stroke already running" — which is what a slur is. The
   * renderer alternates on each `bow` and tracks its own stroke state. A
   * `direction` field would be more explicit, but the renderer has to carry
   * that state either way, so it would be a second source of truth.
   */
  | 'bow'
  | 'blow'     // no travel at all; the fingers move and the air does the rest
  | 'squeeze'  // bellows
  | 'hold'     // stay where you are, sustaining
  | 'breathe'  // the visible inhale before a phrase
  | 'sway';    // no note; see `GrooveScore`, which is where most of these live

export interface Gesture {
  /**
   * When the sound happens, in beats from the start of the number.
   *
   * **Quantised through `core/grid.ts`.** The audio is on a sixteenth grid and
   * a gesture that is not lands up to a 32nd away from the sample it is
   * supposedly causing — worst on swung offbeats, which is exactly where the
   * ear is least forgiving. `npm run concert` asserts this of every gesture.
   */
  beat: number;
  /**
   * Beats of travel *before* `beat`. The stick rising.
   *
   * The single most important field here, and the reason this is a scheduled
   * IR rather than a stream of events. Animation driven by "a note just
   * happened" is always late, because a limb that starts moving on the beat
   * arrives after it. The runtime reads ahead into this window and the hand is
   * at the target exactly on `beat`.
   *
   * Computed, never constant: a crash needs a bigger windup than a ghost note,
   * and a stick crossing from the floor tom to the ride needs longer than one
   * bouncing on the snare.
   */
  prep: number;
  /** Beats of follow-through after. A limb that stops dead reads as a puppet. */
  release: number;
  effector: Effector;
  target: PlayPoint;
  /** 0..1, from note velocity. Drives travel distance and body follow-through. */
  force: number;
  kind: GestureKind;
}

/** One performer's gestures, sorted by beat. */
export interface PerformerPart {
  performerId: string;
  gestures: Gesture[];
}

export interface Choreography {
  /** Keyed by `Performer.id`. */
  parts: Record<string, PerformerPart>;
}

// ---------------------------------------------------------------------------
// Groove — feeling the beat, as distinct from playing it
// ---------------------------------------------------------------------------

/**
 * What a body does while the music happens, whether or not it is playing.
 *
 * Separate from `Choreography` on purpose. Playing an instrument and feeling a
 * pulse are different behaviours with different sources: one comes from this
 * player's notes, the other from what the *band* is doing. Merging them would
 * mean a player with eight bars' rest has nothing to do, and a band standing
 * still between entries is the difference between a concert and a display of
 * animatronics.
 */
export interface GrooveScore {
  /**
   * The pulse the band feels, in beats — 1 is every beat, 2 is half notes.
   *
   * **Read off the drum pattern, not off the metre.** Where the kick lands is
   * the pulse and where the snare lands is the backbeat; deriving it from
   * `beatsPerBar` would give a humppa and a jazz ballad the same nod, which is
   * wrong about both. A style with no kit falls back to the bar.
   */
  pulseBeats: number;
  /** Backbeat positions within the bar, in beats. Empty where there is none. */
  backbeats: number[];
  /** Keyed by `Performer.id`. */
  parts: Record<string, GroovePart>;
}

export interface GroovePart {
  performerId: string;
  /**
   * Phase offset in beats, and how loosely this player keeps time.
   *
   * Both deterministic from the performer id, both small, and both essential:
   * a band nodding in perfect unison is the single most robotic thing this
   * system could produce.
   */
  phase: number;
  looseness: number;
  behaviours: GrooveBehaviour[];
}

export type GrooveKind =
  | 'head-nod' | 'foot-tap' | 'body-sway' | 'lean' | 'eyes-shut' | 'watch';

export interface GrooveBehaviour {
  kind: GrooveKind;
  effector: Effector;
  /** Period in beats. A nod is on the pulse; a sway is on the bar or slower. */
  periodBeats: number;
  /**
   * Amplitude over the song, as spans rather than a curve — the section energy
   * from `generate/dynamics.ts` is already piecewise, and a chorus is simply
   * bigger than an intro.
   */
  amplitude: Span[];
  /** For `watch`: whom this player is looking at. Usually the soloist. */
  targetPerformerId?: string;
}

/** A value holding over a beat range. */
export interface Span {
  fromBeat: number;
  toBeat: number;
  value: number;
}

// ---------------------------------------------------------------------------
// The singing face
// ---------------------------------------------------------------------------

/**
 * A mouth shape, from the vowel the synthesiser is already singing.
 *
 * The clearest case in this whole feature of the Song IR having been built
 * right: `NoteEvent.vowel`, `NoteEvent.consonant` and `VoiceSettings`
 * (`syllableBeats`, `blipBeats`) already say what is sung, how it is started
 * and how often the mouth re-opens. **The face reads the same numbers the voice
 * does**, so the lips cannot drift out of agreement with the sound — they are
 * not two systems that have to be kept in sync, they are one number used twice.
 *
 * Three continuous parameters rather than fifteen discrete shapes, mirroring
 * how the voice itself is modelled: the vowels map onto a triangle — /a/ open
 * and neutral, /u/ closed and round, /i/ closed and spread — and blending three
 * numbers looks better than snapping between poses.
 */
export interface Viseme {
  /** Quantised, like every other beat that has to agree with audio. */
  beat: number;
  /** How long the mouth stays open. From `VoiceSettings.blipBeats`. */
  holdBeats: number;
  /** Jaw opening, 0..1. */
  open: number;
  /** Lip rounding, 0..1. */
  round: number;
  /** Lip spreading, 0..1. */
  spread: number;
  /** How the syllable starts. A stop pops the lips; a nasal closes them. */
  onset: Consonant;
  /**
   * Seconds the mouth takes to reach the shape, straight from
   * `CONSONANTS[onset].attack` in `style/vocals.ts`. Seconds rather than beats
   * because articulation is a physical constant and does not scale with tempo.
   */
  onsetSeconds: number;
}

export interface VisemeTrack {
  performerId: string;
  visemes: Viseme[];
  /** Visible inhales, in the rests. A singer who never breathes is a machine. */
  breaths: Span[];
}

// ---------------------------------------------------------------------------
// Who is on stage, and where
// ---------------------------------------------------------------------------

/** Where a performer is and how they are arranged. */
export interface Station {
  /**
   * Where the performer's feet are, in stage coordinates.
   *
   * **`position[1]` already includes `riser`.** They are not added: `y` is
   * where the feet actually are, and `riser` explains *why* they are there so a
   * renderer can put a platform under them. Summing the two stands the drummer
   * in mid-air, which is exactly the bug this sentence exists to prevent.
   */
  position: [number, number, number];
  /** Radians. 0 faces the audience. */
  facing: number;
  posture: Posture;
  /** Height of the riser they stand on, in metres. 0 is the boards. */
  riser: number;
}

export type HairStyle =
  | 'short' | 'slick' | 'beehive' | 'bob' | 'long' | 'curls' | 'bald' | 'hood';

/**
 * What a garment is made of. Drives sheen, and reads as era as much as genre.
 */
export type Fabric =
  | 'wool'      // a suit. The default, and most of what a band wears.
  | 'sequin'    // tanssilava, and the one that has to look expensive
  | 'satin'     // a shirt with a sheen; showband, later eras
  | 'velvet'    // deep and light-absorbing
  | 'corduroy'  // texture without shine
  | 'denim'
  | 'leather'
  | 'knit'      // ambient: jumpers, and nothing reflects
  | 'nylon';    // an anorak. Slight sheen, and the wrong kind of sheen.

export type Accessory =
  | 'glasses' | 'sunglasses' | 'porkpie' | 'flatcap' | 'tie' | 'bowtie'
  | 'scarf' | 'beard' | 'moustache' | 'earrings' | 'headphones';

/**
 * How a performer looks. Deterministic from the concert seed.
 *
 * Genre and era are the axis of variation, and they should read at a glance
 * without becoming a costume party: a tanssilava band in sequins and a jazz
 * quintet in dark suits and skinny ties are recognisable silhouettes, not
 * fancy dress. `EraProfile` is the input — the eras already carry a decade's
 * worth of meaning and nobody has used them for anything visual yet.
 */
export interface Look {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  /** Body height in metres, and build 0 (slight) .. 1 (broad). */
  height: number;
  build: number;
  outfit: {
    jacket: string;
    shirt: string;
    trousers: string;
    /** The one loud colour. Sequins, a tie, a scarf. */
    accent: string;
    /**
     * What the cloth *is*.
     *
     * Colour cannot express this and the renderer should not have to guess it
     * from saturation. A sequinned tanssilava jacket and a wool suit in the
     * same red are different objects under a follow spot, and which one a band
     * is wearing is a wardrobe decision — so it belongs here, where the
     * wardrobe is chosen, rather than in a shader.
     */
    fabric: Fabric;
    /**
     * Cut, 0..1 each. Optional: absent means an unremarkable contemporary line.
     *
     * This is where a decade actually lives. Colour and fabric drift slowly and
     * ambiguously across eras; lapels get wider and then narrower, and trousers
     * flare and then stop, on a schedule everyone can read at a glance without
     * being able to date it. A renderer that ignores this loses era legibility
     * and nothing else, which is why it is optional.
     */
    cut?: { lapel: number; shoulder: number; flare: number };
  };
  accessories: Accessory[];
}

/**
 * Which object a keyboard player is standing behind.
 *
 * One archetype, three objects, and they share almost no geometry — the
 * argument is set out at length in `web/concert/instruments/synth-rig.ts`. What
 * that file could not do is *count*: it chose per performer, from the year, in
 * the renderer, so a 1974 concert put a five-cabinet Moog System 55 behind
 * every keyboard on the stage. Three walls of patch cables, because nothing was
 * in a position to know there were three.
 *
 * The type is here and the table of what each one *is* — how much floor, how
 * tall, how many a band may own — is `SYNTH_RIGS` in `concert/instruments.ts`,
 * which is the same split `Archetype` and `ARCHETYPES` already use.
 */
export type SynthRigId = 'modular' | 'polysynth' | 'digital';

export interface Performer {
  /** Stable within a number. Choreography, groove and lighting all key on it. */
  id: string;
  /** The layer this player is responsible for. */
  layer: LayerId;
  archetype: Archetype;
  /** The catalogue name, e.g. "tenor sax". Shown nowhere; used for debugging. */
  instrument: string;
  look: Look;
  station: Station;
  /**
   * Which synthesiser this is, where the archetype is `synth`. See `SynthRigId`.
   *
   * Absent on every other archetype, and absent is not a default — a trumpeter
   * has no rig, rather than having the plain one.
   *
   * It is on the performer rather than looked up by the renderer because it is
   * a decision about the *band*: one modular is a centrepiece and three are a
   * trade stand, and only something holding the whole cast can tell those
   * apart. The renderer chose per player from the year and could not. It also
   * has to be settled before staging rather than merely before rendering, since
   * a wall of cabinets and a slab on a stand occupy different amounts of floor
   * and block different amounts of sightline.
   */
  rig?: SynthRigId;
  /**
   * How many keyboards this player is standing at. Absent means one.
   *
   * A modular frame or a digital stack — see `SynthRigSpec.maxBoards`. It is in
   * the IR rather than drawn in the renderer for the reason `rig` is: the
   * choreographer decides which board a phrase is played on and cannot see
   * geometry, so it has to be told how many there are and how far apart.
   *
   * **It is derived from the music and never drawn.** See `boardsWanted` in
   * `cast.ts`: a second keyboard exists because there is a second part to put on
   * it, or because this one part needs both hands often enough to send one of
   * them up. It used to be a weighted draw, which is how three of these ended up
   * with a wing of keys nobody's hands ever reached.
   */
  boards?: number;
  /**
   * The other parts this player is covering, beyond the one on `layer`.
   *
   * One person, several lines — the keyboard bass in the left hand and the tune
   * in the right, which is Manzarek and Emerson and half the synth bands of the
   * period. Absent on almost everybody.
   *
   * This is the only place in the IR where a performer is not one part, and it
   * exists for two reasons that turn out to be the same one. A stage of five
   * keyboard players each minding a single line is not what a band looked like:
   * one player covering two of those lines is both commoner and more legible.
   * And a rig with several keyboards on it needs a reason for the second one to
   * be there — `boards` is derived from this, so a part and a keyboard arrive
   * together or neither does.
   *
   * A reference rather than a copy of the track: `{layer, instrument}` is what
   * `trackFor` already resolves against, so a double is looked up the same way
   * the primary part is and there is one description of "which track is this
   * person playing" rather than two that can disagree.
   *
   * What is deliberately *not* here: which hand, and which keyboard. Those are
   * the choreographer's, exactly as `PlayPoint.board` is — casting says who is
   * playing what, and the thing that can see the phrase decides how.
   */
  doubles?: readonly PartRef[];
}

/**
 * A part, named the way `trackFor` looks one up: the layer it is on, and the
 * instrument that distinguishes it where a layer carries more than one track.
 */
export interface PartRef {
  layer: LayerId;
  instrument: string;
}

export interface Cast {
  performers: Performer[];
  /** Who is the front person for this number — the tune, or the singer. */
  leadPerformerId?: string;
  /**
   * Gear that is playing but is not a person. Empty on most numbers.
   *
   * A `Performer` is somebody with a `look` and a `layer` and limbs to
   * choreograph, and a rhythm box is none of those — but it is making a sound
   * the audience can hear, so it has to be somewhere they can see it. Without
   * this the percussion of a synth-modular number comes from nowhere at all,
   * which is a worse answer than the drummer who used to mime it.
   */
  machines?: StageMachine[];
}

/**
 * A machine on the stage, making a sound nobody's hands are on.
 *
 * Only the percussion sources use it today. The shape is deliberately the one a
 * sequencer will also need — an object, a place, and the performer whose reach
 * it is inside — because the rule that keeps a self-playing part watchable is
 * that somebody starts it and the machine shows what it is doing, and both
 * halves of that need to know which person is next to which box.
 */
export interface StageMachine {
  /** Stable within a number, like `Performer.id`. */
  id: string;
  /**
   * What kind of object it is. `box` has presets and a start button;
   * `programmed` was written into a step at a time — see `DrumSource`. A
   * `sequencer` is running a pitched figure rather than a drum pattern, which
   * is a different panel and, on a modular, a different bay.
   */
  kind: 'box' | 'programmed' | 'sequencer';
  /**
   * What it is playing, for a renderer that wants to label it: a drum bank for
   * the two percussion kinds, the instrument name for a sequencer.
   */
  bank: string;
  /**
   * The layer this machine is playing, where it is playing a pitched part.
   *
   * Absent on a drum machine, whose part is `song.drums` and has no layer. It
   * is here so the renderer can find the notes to run the step lamps off
   * without re-deriving which track belongs to which box.
   */
  layer?: LayerId;
  /** Where it stands, in stage coordinates. `y` includes any riser. */
  position: [number, number, number];
  /** Radians. 0 faces the audience. */
  facing: number;
  /**
   * Whether the machine is drawn by the renderer as its own object, or is a
   * module inside the rig its tender is standing at.
   *
   * `'bay'` means the tender's instrument draws it and `position`/`facing` are
   * not used — a modular is a frame with modules in it, and where the person
   * working the machine is the person at that frame, the honest object is a
   * percussion module in the cabinet rather than a second box balanced on the
   * end of the stand.
   *
   * `'stand'` is everything else: a stand of its own, built for this box and
   * nothing else, standing at the player's right hand. That is most of them and
   * has to be — 97 of 97 machine numbers in ambient's sampler era have no
   * modular on stage at all. See §8.0 of `docs/backline-plan.md` for why it is a
   * stand beside the player rather than a plate on top of their keyboard.
   */
  mount: 'stand' | 'bay';
  /**
   * How far the stand's top surface is above the deck the tender stands on, in
   * metres. Absent on a bay, which has no stand.
   *
   * `position[1]` already carries the same height in world terms, and this is
   * the other half of it: a renderer building legs has to know where the floor
   * is, and subtracting a riser it would have to be told about separately is
   * two chances to build a table hanging in the air.
   */
  stand?: number;
  /**
   * Whoever is standing close enough to work it, if anybody is.
   *
   * Absent on a stage with nobody near it — an ambient number of pure drone and
   * tape where the box is simply running. That is a real arrangement and the
   * renderer must not assume a tender exists.
   */
  tendedBy?: string;
}

// ---------------------------------------------------------------------------
// Lighting
// ---------------------------------------------------------------------------

export type FixtureId =
  | 'wash'       // the general cover everyone is lit by
  | 'key'        // the front-of-house key light
  | 'back'       // rim from upstage; what separates a player from the backdrop
  | 'spot'       // the follow spot. The reason this system exists.
  /**
   * A fixture that favours a player without isolating them.
   *
   * Ambient has no soloist and refuses to have a foreground, so it cannot use a
   * follow spot — but it still wants to warm slowly on whoever is moving. That
   * needs a performer-addressable fixture that is explicitly *not* a spot, or
   * the two become indistinguishable in the data and "ambient never uses a
   * follow spot" stops being checkable.
   */
  | 'warm'
  | 'footlights'
  | 'cyc';       // the backdrop wash

export interface LightCue {
  /**
   * When the cue is *taken*. Console semantics: the fade starts here and
   * completes at `beat + fadeBeats`, so a cue's stated beat is the moment the
   * light begins to move rather than the moment it arrives.
   */
  beat: number;
  /** Beats to fade. 0 is a snap, which should be rare and deliberate. */
  fadeBeats: number;
  fixture: FixtureId;
  intensity: number;
  colour?: string;
  /**
   * For `spot` only: whom to follow.
   *
   * The follow spot is the highest-value visual in the feature, and it exists
   * because `Section.solo` names a soloist. The rig should follow *late and
   * imperfectly* — an operator, not a servo.
   */
  followPerformerId?: string;
}

export interface LightingScore {
  /**
   * Sorted by beat. **Every fixture starts black**, so the first cue naming a
   * fixture is its fade up from nothing and there are no no-op cues at beat 0.
   * Only changes are emitted: a cue never restates a level a fixture is already
   * holding. The one exception to "starts black" is the opening state — see
   * `preset`.
   */
  cues: LightCue[];
  /**
   * Haze density, 0..1. The beams are the effect: a spotlight with no haze in
   * front of it is a bright patch on the floor.
   */
  haze: number;
  /**
   * The preset: how much of the opening look is **already up when the tabs
   * open**, 0..1 of it.
   *
   * A cue list is indexed by beat and there is no beat before the music, so
   * every fixture's opening cue is taken at 0 and the rig sitting at beat 0 is
   * sitting at the *front* of that fade — which is black. The whole reveal
   * therefore happened on an unlit stage, and the band came up only once the
   * transport did, several seconds after the audience had already seen them as
   * silhouettes. A room does not do that: the tabs open on a preset the board
   * has been holding since before the house went out, and the first cue settles
   * it rather than creating it.
   *
   * So this is not a dimmer level, it is the fraction of each fixture's opening
   * level that the fade starts *from*. 1 would be a stage that snaps to its
   * final state with nothing left for the cue to do; 0 is the old fade-up from
   * black, which is still the right answer for a black box.
   */
  preset: number;
}

// ---------------------------------------------------------------------------
// The venue
// ---------------------------------------------------------------------------

export interface Venue {
  id: string;
  label: string;
  /** Stage dimensions in metres. Staging must fit the cast inside them. */
  width: number;
  depth: number;
  palette: {
    boards: string;
    backdrop: string;
    curtain: string;
    proscenium: string;
    /** The wash's resting colour. */
    ambient: string;
  };
  audience: {
    rows: number;
    /** 0..1 how full the room is. */
    density: number;
    seated: boolean;
  };
  /** Set dressing the stage builder should place. Free-form, genre-specific. */
  props: string[];
  /** Atmospheric fog independent of the lighting haze, 0..1. */
  fog: number;
}

// ---------------------------------------------------------------------------
// The show
// ---------------------------------------------------------------------------

/** One line of the programme. */
export interface BillEntry {
  /** 1-based, as printed. */
  number: number;
  title: string;
  seconds: number;
  styleLabel: string;
  eraLabel: string;
  /** One line of copy. The enjoyable part; see the plan. */
  blurb: string;
  sung: boolean;
}

export interface ConcertNumber {
  song: Song;
  cast: Cast;
  choreography: Choreography;
  groove: GrooveScore;
  /** Present only when the number is sung. */
  visemes?: VisemeTrack;
  lighting: LightingScore;
  /** Which solo sections this number contains, resolved to performers. */
  solos: SoloSpot[];
}

/** A solo section, with the inference already done for the stage. */
export interface SoloSpot {
  sectionIndex: number;
  fromBeat: number;
  toBeat: number;
  performerId: string;
  layer: LayerId;
  backing: BackingPolicy;
}

export interface Concert {
  seed: string;
  genre: string;
  /**
   * One era for the whole show. A band is one band on one night, and the venue,
   * the wardrobe and the programme's typography all need the same answer —
   * without this each was re-deriving it, one of them by matching era *labels*,
   * which holds only while no two genres share a label.
   */
  era: string;
  /**
   * The year that era stands in. Resolved once alongside `era`, and carried
   * because the era id cannot answer for it: ids are genre-local, so a model
   * branching on one would have to know every genre's vocabulary. What an
   * instrument looks like is a fact about a decade, not about a genre.
   */
  year: number;
  venue: Venue;
  bill: BillEntry[];
  numbers: ConcertNumber[];
}

/** How the concert is sung. See the plan — instrumental is a first-class mode. */
export type VocalPolicy = 'instrumental' | 'mixed' | 'sung';

export interface ConcertOptions {
  seed?: string;
  /** Genre id. A concert is one genre — a band does not change idiom mid-set. */
  genre?: string;
  era?: string;
  /** How many numbers. 3–5 is a set; 1 is a soundcheck. */
  numbers?: number;
  vocals?: VocalPolicy;
  /**
   * Stage this exact piece of music, and nothing else.
   *
   * The setlist normally *decides* what gets played — style, mood, key, length
   * and smoothness per slot, programmed for contrast across an evening. This
   * replaces that decision wholesale with one the caller has already made, and
   * it exists because the radio can hand the stage a song you are already
   * listening to. Watching the band play something else would be a different
   * feature.
   *
   * Two consequences worth stating, both of which follow from "exactly this":
   * there is no arc, because there is no second number for one to run through;
   * and `MIN_CONCERT_STRICTNESS` does not apply, because it is the setlist's
   * floor for numbers the setlist chose. `numbers` and `vocals` are ignored —
   * the song says how many (one) and whether it is sung.
   */
  song?: GenerateOptions;
}
