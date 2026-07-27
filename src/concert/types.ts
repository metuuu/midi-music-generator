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

/** How the player is arranged around the instrument. */
export type Posture =
  | 'stand'   // guitar, horns, singer
  | 'sit'     // piano bench, cello chair
  | 'stool'   // upright bass, high stool
  | 'kit'     // behind a drum kit, both feet occupied
  | 'perch';  // leaning over a table of gear

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
  | { kind: 'key'; midi: Midi }
  /** A stopped string. `string` indexes `ArchetypeSpec.strings`, low to high. */
  | { kind: 'string'; string: number; fret: number }
  /** A drum or cymbal, by the voice the Song IR names. */
  | { kind: 'drum'; voice: DrumVoice }
  /** Valves or a slide, by the pitch being fingered. */
  | { kind: 'valve'; midi: Midi }
  /** Tone holes or keywork, by pitch. */
  | { kind: 'hole'; midi: Midi }
  /** A foot pedal. */
  | { kind: 'pedal'; which: 'hat' | 'kick' | 'sustain' }
  /** Bellows, which move continuously rather than being struck. */
  | { kind: 'bellows'; open: boolean }
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
}

export interface Cast {
  performers: Performer[];
  /** Who is the front person for this number — the tune, or the singer. */
  leadPerformerId?: string;
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
   * holding.
   */
  cues: LightCue[];
  /**
   * Haze density, 0..1. The beams are the effect: a spotlight with no haze in
   * front of it is a bright patch on the floor.
   */
  haze: number;
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
}
