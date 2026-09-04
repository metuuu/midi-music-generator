/**
 * The Song IR — the hand-off point between "musical decisions" and "how it
 * gets heard".
 *
 * Nothing below this line knows about Strudel, MIDI, or WebAudio. That is the
 * whole point: the generator is MIT-licensed and portable, and Strudel is one
 * interchangeable renderer sitting behind it.
 */

import { flatTempo, secondsAt, tempoAt, tempoRange, type TempoMap } from './grid.js';
import type { Midi } from './pitch.js';
import type { Mode } from './scale.js';
import type { FeelSpan } from '../style/feel.js';
import type { DeliveryId } from '../style/delivery.js';
import type { VoiceSignatureId } from '../style/voices.js';
import type { Seam } from '../generate/transition.js';
import type { DropSpan } from '../generate/drop.js';
import type { Technique } from '../generate/technique.js';
import type { ChaosLevel } from '../genre/chaos.js';

/**
 * Named layers. A game can duck, mute or crossfade these independently, which
 * is also the hook for the layered-ambient work later on.
 */
export type LayerId =
  | 'drums'
  | 'bass'
  | 'comp'      // accordion / guitar / e-piano chordal rhythm
  | 'pad'       // sustained strings or organ
  | 'melody'    // the "vocal" line, played by an instrument
  | 'counter'   // answering phrases in the melody's gaps
  | 'brass'     // section stabs and swells
  | 'vocal';    // sung line doubling the melody

export const LAYER_ORDER: LayerId[] = [
  'drums', 'bass', 'comp', 'pad', 'brass', 'counter', 'melody', 'vocal',
];

/**
 * The layers an instrument is drawn for.
 *
 * Drums are a kit rather than an entry in the catalogue, and the vocal is a
 * voice, so neither takes an `Instrument` and neither has a palette. Everything
 * that does is here.
 *
 * Lived in `generate/song.ts` until a second file needed to name the same set:
 * `Style.instruments` says which players a style brings with it, and the layers
 * it may speak about are exactly the layers that have a player to name.
 */
export type PlayedLayer = Exclude<LayerId, 'drums' | 'vocal'>;

export type SectionKind = 'intro' | 'verse' | 'chorus' | 'bridge' | 'solo' | 'outro';

/**
 * How the last bar of a piece lands.
 *
 * A generated form runs out of bars; that is not the same thing as ending, and
 * the difference is the most audible unfinished edge this generator had. The
 * final bar used to be an ordinary bar of the pattern, cut wherever the loop
 * point fell — a comp figure sliced mid-figure, a tune left on whatever note
 * the phrase happened to be passing through.
 *
 * So the last bar is not a bar of the arrangement any more. It is the ending,
 * and there are exactly two of them in this repertoire:
 *
 *   button  everybody lands the final chord together on the downbeat and holds
 *           it, with a cymbal under it. What a dance band does, what a jazz
 *           head does on the way out, and what an audience claps at.
 *   fade    the chord that is already sounding is simply held and let go, with
 *           nothing struck on top of it. Ambient does not finish, it stops
 *           being there, and a crash on the end of a drone is a joke.
 *
 * **It lives here, one level below both of the tables that name it.** `Genre`
 * has always carried it and `Style` carries it now, and `style/types.ts` cannot
 * reach `genre/types.ts` — the dependency runs the other way, because a genre is
 * a collection of styles. Two vocabularies in this file are here for exactly the
 * same reason and neither has anything else in common with this one: `LayerId`
 * is the alphabet the arrangement is written in, and `SectionKind` is the one
 * the form is. A word both halves of a seam have to say belongs under the seam.
 */
export type EndingStyle = 'button' | 'fade';

/**
 * What the rest of the band does underneath a solo.
 *
 * A band that drops out under every solo sounds like a demo, and in most of
 * this repertoire the rhythm section carrying on *is* the idiom — so this is
 * stated per section rather than left to whichever layers happened to be
 * active.
 *
 *   full     the arrangement continues exactly as written. Iskelmä: this is
 *            dance music, the floor is full, and a rhythm section that gets
 *            clever behind the break has forgotten its job.
 *   comping  the comp thins and syncopates, the drums move to the ride, the
 *            bass keeps walking. The band answers the soloist instead of
 *            running its pattern. Jazz.
 *   sparse   comp out, drums to brushes — the contrast a bass solo needs to be
 *            audible at all.
 *   trade    the section is shared, and `SoloAssignment.blocks` says how. The
 *            band stops dead for the drummer's bars and comes back in on the
 *            downbeat. This also covers the degenerate case of a full drum
 *            chorus, where the drummer has every bar and nothing alternates —
 *            read `blocks`, never the name, or a drum chorus reads as trading
 *            the spotlight between the drummer and the drummer.
 */
export type BackingPolicy = 'full' | 'comping' | 'sparse' | 'trade';

/**
 * Who is soloing, and over what.
 *
 * Before this existed, "solo" was inferred: the lead rested and the counter
 * instrument took the tune, and every consumer that cared re-derived that rule
 * for itself. Naming the soloist makes the section say what it means — which
 * matters most to the things outside the generator, since a stage cannot point
 * a follow spot at an inference.
 */
export interface SoloAssignment {
  /** Which layer takes the solo. `drums` is a drum solo. */
  layer: LayerId;
  /**
   * Human name of the instrument soloing, matching `Track.instrument`.
   *
   * One exception, and it is unavoidable: percussion is a `DrumTrack`, not a
   * `Track`, so it has no instrument name to match. What a drum solo carries
   * instead is the name a showbill would print, and it is answered in two
   * steps because a stage answers it in two steps.
   *
   * **Is anybody playing?** Where the source is a box or a programmed machine
   * nobody is: `roster` stages no percussionist at all and `placeMachine`
   * stands the machine on the boards instead. Then the machine *is* the object
   * and the field carries its whole bank string — `'RolandTR909'`,
   * `'RolandTR808+mridangam'` — which is exactly the label the staged machine
   * already wears, rack included, because a box loaded with a sampled darbuka
   * is a box and the rack is the only mention of something sounding and
   * invisible.
   *
   * **Then: which object would the hands need?** `'drum kit'`, or the drum the
   * chorus was actually written for where that is not a kit: `'darbuka'`,
   * `'congas'`, `'mridangam'`, and `'hand drum'` where nothing named which. A
   * bank name is wrong in every one of *those* cases — there it is a sample set
   * loaded into an instrument somebody is holding, not the instrument.
   *
   * The distinction is not pedantry, and both halves of it were learned the
   * same way. A *tani āvartanam* is ten minutes of mridangam alone on a stage
   * with no kit anywhere on it, and this field said `'drum kit'` through all of
   * it. Then it said `'mridangam'` through a chorus whose mridangam was a
   * sample inside an 808, in 22% of drum solos, because knowing which object a
   * pair of hands would need is not the same as knowing there are hands. See
   * `generateSong`, where the name is resolved from the same reads that decide
   * what the chorus is written for and who, if anyone, is playing it.
   */
  instrument: string;
  /** What the band plays underneath. */
  backing: BackingPolicy;
  /**
   * Who has which bars, when the section is shared.
   *
   * Only present on `trade`. Without it, "the spot alternates every four bars"
   * is an assumption each consumer has to hard-code — and two of them did,
   * independently, before this field existed. Trading is not always fours and
   * the blocks are not always even, so the section has to say.
   *
   * `soloBars` and `drumBars` are `[fromBar, toBar)` **relative to the section**
   * and together cover it. A full drum chorus — the band out for the whole
   * section rather than genuinely alternating — is the degenerate case where
   * `soloBars` is empty and `drumBars` is the entire section.
   */
  blocks?: { soloBars: [number, number][]; drumBars: [number, number][] };
}

export interface Section {
  kind: SectionKind;
  /** Bar index where this section starts (0-based, absolute in the song). */
  startBar: number;
  lengthBars: number;
  /** Semitone transposition applied to this section relative to the base key. */
  transpose: number;
  /**
   * Local mode — choruses frequently lift into the relative major.
   *
   * **Not the seam for a per-section scale change**, which is what it looks like
   * and what it has been mistaken for. `Mode` decides how the roman numerals are
   * read, so moving this moves the *chords*: it is the harmonic axis. A genre
   * that wants the melody's scale to move while the tonic and the chords stand
   * still — arabic's *sayr* — takes the fourth argument to `scaleForChord`
   * instead, and the argument for keeping the two apart is written out there.
   *
   * Written in two places, both from the song's own mode, and so far never
   * anything else; `relativeMajorChorus` gets its lift by biasing *progressions*
   * rather than by setting this. One reader, `concert/lighting.ts`, which cools
   * the wash on a minor section.
   */
  mode: Mode;
  /** Which layers sound in this section. Drives the arrangement dynamics. */
  activeLayers: LayerId[];
  /** Chord per bar, as roman numeral text (for display/debug). */
  chordLabels: string[];
  /**
   * Set on `solo` sections only. Absent everywhere else, and absent on a solo
   * section whose nominal soloist is not actually sounding.
   */
  solo?: SoloAssignment;
}

export interface NoteEvent {
  /** Absolute position from song start, in beats. */
  beat: number;
  /** Duration in beats. */
  duration: number;
  midi: Midi;
  /** 0..1. Renderers scale this into their own velocity/gain domain. */
  velocity: number;
  /**
   * Which vowel this note is sung on. Only the `vocal` layer sets it; every
   * other layer leaves it undefined and renderers that cannot sing ignore it.
   */
  vowel?: Vowel;
  /** How the syllable is started. Only the `vocal` layer sets it. */
  consonant?: Consonant;
  /**
   * How the syllable is *closed*, if it is. Only the `vocal` layer sets it.
   *
   * Optional and one-sided like `hand` and `doubling` above, and for the third
   * time for the same reason: an open syllable is the ordinary case and should
   * not have to declare itself. A renderer that cannot articulate a coda —
   * Strudel, which has one attack per event and no way to put a consonant at
   * the far end of one — ignores it, and what it then hears is the syllable's
   * length without its closing consonant, which is a real pronunciation rather
   * than a broken one.
   */
  coda?: Consonant;
  /**
   * This note continues the syllable before it: no onset, no fresh attack, the
   * same vowel carried onto a new pitch. The second half of a long vowel, or a
   * melisma.
   *
   * Every renderer can do *something* with it and only one can do it properly.
   * Strudel re-attacks — one independent sampler voice per event is the whole of
   * its scheduling model — so a tie arrives there as a repeat with no consonant
   * on it, which reads as one syllable held rather than two struck. The Web
   * Audio voice glides the pitch under a level that never drops, which is what a
   * held vowel actually is.
   */
  tie?: true;
  /**
   * Runs into the next note with no silence between them — the syllables of one
   * word, which a mouth does not separate.
   *
   * `duration` stays what it always was: the *written* sounding length, with the
   * gap after it that a re-attacking renderer needs. This says that gap is an
   * artefact of that renderer rather than a fact about the line, and a voice
   * that can join the two syllables should. The relationship is the one
   * `brightness` has to `Track.effects.lowpass`: the note says what the music
   * wants, the renderer says what it can do about it.
   */
  legatoToNext?: true;
  /**
   * How far open the filter is on this note, 0..1. Absent means "all the way",
   * which is what every note in the project was until this existed.
   *
   * The relationship to `Track.effects.lowpass` is exactly the one `velocity`
   * has to `Track.gain`:
   *
   *     velocity : Track.gain  ::  brightness : Track.effects.lowpass
   *
   * The track says where this instrument's tone sits in this decade; the note
   * says where in that range *this moment* sits. Keeping the absolute hertz on
   * the track and the movement on the note is what stops a filter sweep from
   * being a production setting — it is material, and it is generated, in
   * `generate/filter.ts`.
   *
   * It only ever closes. A sweep that could open past the era's own cutoff
   * would let a style out-bright its decade, and the MIDI render could not
   * carry it either: CC74 is defined relative to the patch's own filter, so
   * darkening is the only direction that means the same thing on every device.
   */
  brightness?: number;
  /**
   * This note's pitch is a function of time: it leaves the written pitch and
   * arrives somewhere else without being struck again. See `NoteBend`.
   *
   * The relationship to `Track.effects.glide` is the one `brightness` has to
   * `Track.effects.lowpass`, and the project now has three rows of it:
   *
   *     velocity   : Track.gain
   *     brightness : Track.effects.lowpass
   *     bend       : Track.effects.glide
   *
   * The track says this instrument has a glide switch and how far it is turned
   * up; the note says *this* note travels, and where to. Both halves of the pair
   * earn their place, because the two gestures are not the same one at two
   * scales. `effects.glide` is a scoop onto every note from a fixed distance
   * below — a knob in milliseconds, set once, that does not know what note is
   * coming — which is what a monophonic synthesiser lead is. This is one note
   * moving to a named destination over its own length, which is what a figure
   * is, and no setting of the knob produces it.
   *
   * **Optional and one-sided**, for the third time in this interface and for
   * the reason `hand` and `doubling` give: an ordinary note should not have to
   * declare that its pitch is constant, nothing else in the project has to start
   * saying anything about itself, and a `Song` written before this existed still
   * reads back.
   *
   * Layer-agnostic on purpose. Two authors write one — `BassHit.glide` on the
   * bass, and `ornament` in `generate/solo.ts` on a line played by an
   * instrument with `Instrument.bend` — and the field is on the note rather
   * than on anything bass-shaped, because the renderers read notes and both
   * gestures are the same mechanism. The one layer it must never be written on
   * is a **chordal** one, and that is not a taste: see `NoteBend` for what MIDI
   * does to a chord.
   */
  bend?: NoteBend;
  /**
   * This note is not struck once: it alternates with a neighbour for its whole
   * length. A trill, and on a short note a mordent. See `NoteTrill`.
   *
   * **Declared rather than written out**, which is the one design decision here
   * and it is `DrumEvent.roll`'s. The alternative is to emit the strokes as
   * ordinary notes and let the renderers work out that they belong together, and
   * that fails in both directions: the sixteenth grid rounds, so strokes meant for
   * one slot land in two and a stroke half a slot early reads as one half a slot
   * late, while the MIDI — which has no grid at all — would be carrying a figure
   * nothing downstream could recognise as a single gesture again. A count and a
   * neighbour is what the music means, and each renderer expands it the way its
   * own medium can.
   *
   * Optional and one-sided, like `bend` above it and for the same reason: an
   * ordinary note should not have to declare that it is struck once.
   *
   * Never on a chordal layer, and for a plainer reason than `bend`'s: a trill is
   * a thing a *finger* does, and there is only one of them per voice.
   */
  trill?: NoteTrill;
  /**
   * How long after the chord it belongs to this string is struck, in beats.
   * A strum sweeps the strings a few milliseconds apart, and the sweep is
   * declared here rather than written into `beat` so a chord still reads as one
   * event to everything that groups notes by onset. Absent means struck with the
   * chord. See `TechniqueProfile.rake`.
   */
  rake?: number;
  /**
   * A stroke on a damped string: an attack with no pitch worth hearing.
   *
   * The hand keeping its grid between the notes that sound — a slap bass's
   * sixteenths, a funk guitar's chank — and the reason it is a flag rather than
   * simply a very quiet short note is that **nothing downstream could tell
   * otherwise**, which is the same argument `Track.machine` and `hand` make. A
   * consumer that reads this list as music has to be able to skip it: an
   * interval to a dead stroke is not a melodic interval, a dead stroke on a
   * fingerboard is not a fingering, and a part's note count is not its stroke
   * count. `melodicLine` filters them, and so does every report that measures a
   * line.
   *
   * `midi` is still honest — it is the string the hand is over, and a renderer
   * has to send *something* — but it carries no harmonic intent, and a check
   * that reads it as a chord tone is reading a click.
   *
   * **Optional and one-sided**, like `bend` and `trill` above and for the same
   * reason: an ordinary note should not have to declare that it sounds.
   *
   * Written only by `applyTechnique`. See `generate/technique.ts`.
   */
  dead?: true;
  /**
   * Set on the notes a two-handed player's **left hand** played, and on nothing
   * else. See `Track.twoHanded` for what a track like that is.
   *
   * **Optional and one-sided**, and both halves of that are deliberate. The line
   * is what every consumer wants and the accompaniment is the exception, so it is
   * the exception that identifies itself: an unmarked note means what it has
   * always meant, nothing else in the project has to start declaring anything
   * about itself, and a `Song` serialised before this field existed still reads
   * back correctly. Marking the right hand instead would make an absent field
   * ambiguous — is this the tune, or is it a note written by something that
   * predates the mark — which is precisely the ambiguity being removed.
   *
   * It exists because the alternative was to *infer* it, and the inference is
   * wrong in both directions. `melodicLine` reads the note standing
   * `Track.twoHanded.gap` above the rest as the right hand, so a left hand voicing
   * a root and a seventh — eleven semitones on a track whose gap is ten — reads as
   * two hands and charges the tune with a note it never played; and a left hand
   * that sounds one note at a time reads as the tune outright.
   *
   * The first of those was live and measurable: reading jazz through the mark
   * instead of the gap moved its wide-leap figures by two to three points at every
   * strictness level, all of it a pianist's own left hand having been counted as
   * melody. The second has never fired, and only because it is defended at the
   * source — `isChord` in `generate/parts.ts` makes a hand with no room to voice
   * fall silent rather than sound one note, a guard whose entire justification is
   * how fragile this inference is. A synthesiser's left hand is a bass *line* by
   * design, see `HANDS.leadVoice`, so the day something writes it without that
   * guard the tune quietly acquires an accompaniment. Better for the part to say
   * what it is than for four separate places to keep the inference safe.
   */
  hand?: 'left';
  /**
   * Set on notes that are sounding the lead's own line *on purpose*, and on
   * nothing else.
   *
   * The same shape as `hand` above and for the same reason: the exception
   * identifies itself. Every other note in the project is written to stay off the
   * tune, `undoubleAgainst` moves any that ends up on it, and `npm run genres`
   * asserts the answer never doubles it at the unison or the octave. All of that
   * is right about an accident and wrong about a decision — two horns stating a
   * head in octaves is not a fault, it is the most recognisable sound in the
   * repertoire, and the only thing separating it from mud is that it is a whole
   * phrase rather than a note that happened to collide.
   *
   * So the mark is what the repair passes and the checks read to tell the two
   * apart. Without it there is no way to permit the gesture without also
   * permitting the fault, which is why the project had ruled the gesture out.
   */
  doubling?: 'lead';
  /**
   * Set on the notes of a second part written *against* the lead — a third above
   * it, a sixth below it, held for a span — and on nothing else.
   *
   * A separate mark from `doubling` above rather than a wider reading of it,
   * because the two make opposite claims and want opposite treatment.
   * `doubling` says *these two players are stating the same line*, so
   * `undoubleAgainst` leaves those notes exactly where they are. This says
   * *these are two lines*, so an octave in it is not the gesture — it is
   * precisely the fault the gesture is trying not to be, and it still wants the
   * repair. Reusing `doubling` would have switched that repair off, which is the
   * backstop keeping the unison-and-octave assertion green against the two
   * things the writing pass cannot see: a melody note held across a section seam,
   * and a recalled tune varied after the second part was placed.
   *
   * What it is for is the other half of the confound `doubling` already
   * documents. `npm run genres` measures how much of the answering line sounds
   * under the tune — 40% of unmarked notes over 760 songs — against a second
   * sequencer that ignores the tune entirely, and a harmony note sounds under a
   * melody note **100% of the time by construction**. Counting a deliberate
   * second part there charges the answer with overlap the arrangement was
   * written to produce, so this is what lets the pair exclude it the same way
   * they already exclude `doubling`.
   *
   * Written only where a style or genre declares a `HarmonyProfile` — see
   * `generate/song.ts` — in all three places a second part can be written, which
   * is the second thing it is for. `on: 'counter'` mixes these notes into the
   * answering line, where the mark is the only way to tell them from it.
   * `on: 'melody'` and `on: 'vocal'` put them on a **second `Track` of their
   * own**, every note marked and nothing else on it: there the mark is what stops
   * a consumer handed that track from reading it as the tune. The singers were
   * left out of an earlier draft of this note on the grounds that the track is
   * already the signal — true of `Track.voice`, which says the line is sung, and
   * false of *which of two sung lines is the line*, where two vocal tracks are
   * exactly as ambiguous as two melody ones. Which of two melody tracks *is* the tune is answered by order —
   * the lead is emitted first — and this is what makes the answer checkable
   * rather than merely conventional. See `melodicLine`.
   */
  harmony?: 'lead';
}

/**
 * A pitch that moves while the note sounds.
 *
 * `docs/engine-gaps.md` §3.16, and the most-reported open entry in that
 * document: **five independent reports across three genres**, every one of them
 * making the same substitution and every one of them writing it down.
 *
 *  - **hiphop's `drill`** — "a drill 808 does not restrike, it bends from one
 *    pitch to the next across half a beat, and `BassHit` has an `at`, a `dur`
 *    and a `tone`."
 *  - **hiphop's `gfunk`** — "what these lines actually do is *slide* between two
 *    notes a fifth or an octave apart … two struck notes where the record has
 *    one note that moves."
 *  - **house's `acid`** — the slide switch is one of the five controls on a 303,
 *    and "half of what makes the sound is a note bending into the next one."
 *  - **dnb's `techstep` and `jumpup`** — "the movement **is** the sound", under
 *    a table that calls its own Reese "that contour sampled at three points,
 *    which is the nearest thing `BassHit` can hold."
 *
 * One sentence five times over, which is the strongest evidence this project
 * collects. It is also not a near-miss to be filed under taste: a 303 slide and
 * two notes a tone apart are different sounds, and a Reese is *defined* by never
 * re-articulating. What every one of those authors wrote is a contour sampled at
 * two or three points, and what this holds is the contour.
 *
 * ## One gesture, and it is the one they all reported
 *
 * There are three things a pitch can do to a note and they are genuinely
 * different gestures — a **slide into** a note, a **glide across** it, and a
 * **drop off** the end of it. `generate/tempo.ts` shipped two shapes of three
 * and `generate/drop.ts` three of four, both on the reasoning that the refusal
 * is the more useful record, so it is worth saying which this is.
 *
 * This is the **glide across the note**, and it is not the shape that covers the
 * most ground — it is the shape all five reports asked for. Read them again:
 * *from one pitch to the next*, *between two notes a fifth apart*, *from the
 * tonic to the ♭2 and back*. In every case the destination is where the author's
 * second struck note was going to be, so adopting this is not writing something
 * new, it is **deleting the second hit and naming it as the first one's
 * destination**. The 808 drop falls out for nothing, as the same object with a
 * negative `semitones` — the same way `tempoRise` below 1 is a decelerando.
 *
 * What is left expressible and is not built is the slide *into* a note, and both
 * halves of the reason are below.
 *
 * ## Why the travel starts at the onset
 *
 * Because that is the only placement both renderers agree on, and the
 * disagreement is not one this project is willing to hide. superdough's pitch
 * envelope — `penv`/`pattack`, which is what the audition has and the only pitch
 * modulation a soundfont voice can be given — begins its attack at the note's
 * own start and has **no delay stage**: `getPitchEnvelope` in
 * `superdough/helpers.mjs` runs an ADSR whose attack ramps the full distance
 * from the first sample of the note. A MIDI file has no such constraint, since a
 * pitch bend is an event at a tick and can be put anywhere.
 *
 * So a bend placed at the far end of a note would be a second shipping-only
 * feature after the tempo ramp, and a much worse one. A ramping song auditions
 * flat, which is the right notes at one speed and announces itself; a late bend
 * auditioning early is the *wrong contour*, silently, and a listener has no way
 * to know. Between a shape both renderers play identically and a shape one of
 * them lies about, this takes the first.
 *
 * That is also what rules out the slide *into* a note as a second field for now.
 * It is the 303's accent-and-slide: the pitch arrives from the previous step
 * over a few tens of milliseconds, so the movement is at the *boundary*, which is
 * the far end of the note before it. It is one line in each renderer the day
 * somebody asks for it with a number attached — `panchor(1)` instead of
 * `panchor(0)` in the audition, and the same bend stream running the other way
 * in the .mid — and until then the note-level version cannot be placed where it
 * belongs, and `Track.effects.glide` already owns the gesture at the level a
 * glide switch actually lives at.
 *
 * ## What each renderer does with it, and the one thing MIDI cannot say
 *
 * Both carry it, which makes this the first thing in the IR since `velocity`
 * that neither renderer has to apologise for. That was not the expected answer
 * and it is worth recording how it was established, since guessing would have
 * got it wrong in both directions:
 *
 *  - **The audition can bend.** Strudel registers a `slide` control and it is
 *    dead — `@strudel/core/controls.mjs` has it under a literal `// TODO: slide
 *    param for certain synths`, with `portamento` commented out beside it, and
 *    nothing in superdough reads it outside the `zzfx` toy engine. What is live
 *    is the **pitch envelope**, and `@strudel/soundfonts/fontloader.mjs` hands
 *    its buffer source's `detune` straight to `getPitchEnvelope`, so a GM patch
 *    gets one on the same terms a synthesised voice does. See `render/strudel.ts`
 *    for the anchoring that turns an envelope into a glide.
 *  - **The .mid can bend, and it ships.** Pitch bend is 14-bit and is GM level 1,
 *    as is RPN 0, the per-channel bend range this needs in order to travel
 *    further than the ±2 semitones a device powers up with. See `render/midi.ts`.
 *
 * The one real divergence is that **a MIDI pitch bend addresses a channel, not a
 * note**. A track has a channel to itself, so on a monophonic part the two are
 * the same thing; on a part sounding two notes at once they are not, and the
 * .mid bends the whole chord — a whammy bar rather than a portamento. That is
 * why a bend is authored on the bass and on a soloing line and never on
 * `CompHit`, and `render/midi.ts` marks the file rather than emitting the
 * wrong sound quietly if it is ever handed one anyway.
 */
export interface NoteBend {
  /**
   * How far the pitch travels, in semitones from this note's own `midi`, signed.
   *
   * A destination rather than a depth, which is what makes an adoption a
   * deletion: the second of the two struck notes an author wrote becomes this
   * number, and the note that used to be struck at it is gone.
   *
   * Not clamped here. A fifth and an octave are both named in the reports and a
   * dub siren is larger than either; what a *device* will follow is a question
   * for the renderer that has to declare a bend range, and `render/midi.ts`
   * answers it in the place where the answer is a fact rather than a taste.
   */
  semitones: number;
  /**
   * How long the travel takes, in beats, measured from the note's onset. The
   * pitch holds at the destination for whatever is left of the note.
   *
   * In beats because everything else in a `NoteEvent` is, and because the
   * gesture is proportional to the music rather than to the clock — a Reese
   * across a half note and a Reese across a quarter are the same gesture, where
   * a portamento knob is a fixed number of milliseconds and is `effects.glide`.
   *
   * **Renderers clamp this to the note's own `duration` and must**, rather than
   * trusting it, because two later passes shorten notes after they are written:
   * `generate/transition.ts` truncates a part into a break and `generate/drop.ts`
   * cuts one at a drop's edge. A bend that outlived its note would be a pitch
   * still climbing through silence in one renderer and a channel left bent in the
   * other.
   */
  beats: number;
}

/**
 * A note struck over and over against a neighbour, for as long as it lasts.
 *
 * `NoteEvent.roll` would have been the honest name — this is `DrumEvent.roll`
 * with a pitch attached, and the two should be read together — but a roll on a
 * drum is one surface struck repeatedly and this is two notes alternating, which
 * is a different gesture with an older name.
 *
 * ## Why a count per sixteenth rather than a rate in hertz
 *
 * A real trill is measured in strokes per second and speeds up as it goes, and
 * neither renderer can say that: the audition's grid is sixteenths and the MIDI
 * would need the figure written out. A count per slot is what both of them *can*
 * hold — mini-notation nests a group inside a slot and divides it evenly, and the
 * MIDI writer expands the same arithmetic into struck notes — so the two agree by
 * construction rather than by a tolerance, which is the property `DrumEvent.roll`
 * was built on and `check-notation.ts` compares them for.
 *
 * The cost is that a trill is tempo-locked, and it is worth saying out loud what
 * that means musically: at 120 BPM `strokes: 2` is 8 a second, which is a fast
 * mordent, and `strokes: 4` is 16 a second, which is faster than most players
 * trill. The useful range is small and the table should stay inside it.
 */
export interface NoteTrill {
  /**
   * The other note, in semitones from this one's `midi`, signed. Almost always
   * `+1` or `+2` — a trill is to the note above in every idiom this project has —
   * but signed because a mordent proper goes *down* and the field should not have
   * an opinion the music does not.
   */
  semitones: number;
  /**
   * Strokes per sixteenth, counting both notes. Two is the alternation `a b`
   * filling a sixteenth; four is `a b a b`.
   *
   * A whole number, because the audition divides a mini-notation group evenly and
   * cannot place a fractional stroke. Renderers clamp rather than trust: a count
   * below 2 is not a trill and is played as the plain note.
   */
  strokes: number;
}

/**
 * Consonant classes, by how they are made rather than by letter.
 *
 * Manner **and place**, because manner alone turned out not to be enough. Four
 * manners is four sounds, two of which (nasal and liquid) have no noise in them
 * at all and differed only in how fast the vowel arrived — so a line came out
 * with one audible consonant and three shades of soft entry, which is exactly
 * how it was reported. Place is what separates /p/ from /t/ from /k/, and it is
 * as synthesisable as manner is: a burst has a centre frequency and a width, and
 * the tract has a resonance it is passing through on the way to the vowel.
 *
 * That second one — the **locus** — is the part worth naming. Delattre's finding
 * is that place is carried less by the burst than by where the formants are
 * *coming from* as the vowel begins: labials transition up out of a low F2,
 * alveolars down out of a high one, velars out of an F2 and F3 pinched together.
 * It costs nothing here because the tract is already a cascade being automated,
 * and without it a burst is a click with no address.
 *
 * The four original names are kept and now mean their commonest place, so every
 * table written against them still says what it said.
 *
 *   none          a vowel with no attack consonant — "ah"
 *   stop          t d — a sharp high click, then the vowel instantly
 *   stop-p        p b — a low, diffuse click; the quietest of the three
 *   stop-k        k g — a compact mid burst, and the velar pinch behind it
 *   fricative     s z — the long high rush of a sibilant
 *   fricative-sh  š — a sibilant an octave lower, and broader
 *   fricative-f   f v — weak and broadband; noise with no centre to it
 *   fricative-h   h — aspiration, barely filtered at all
 *   nasal         n — murmur with the anti-resonance high
 *   nasal-m       m — murmur with the anti-resonance low; the darker hum
 *   liquid        l — lateral, F3 held high
 *   liquid-r      r — the same but F3 dropped, which is the whole of /r/
 *   glide         j w — vowel-like, no noise, the fastest onset there is
 */
export type Consonant =
  | 'none'
  | 'stop' | 'stop-p' | 'stop-k'
  | 'fricative' | 'fricative-sh' | 'fricative-f' | 'fricative-h'
  | 'nasal' | 'nasal-m'
  | 'liquid' | 'liquid-r'
  | 'glide';

/**
 * The vowels a renderer is expected to be able to produce.
 *
 * Five cardinal vowels, six front-rounded and central ones, and four
 * nasalised — the set a five-band formant filter covers, and a reasonable
 * working alphabet for a native implementation too. Deliberately spelled in
 * ASCII: `oe` rather than `ö`, `ue` rather than `ü`, so the strings survive
 * every file format and notation this project passes them through.
 */
export type Vowel =
  | 'a' | 'e' | 'i' | 'o' | 'u'
  | 'ae' | 'aa' | 'oe' | 'ue' | 'y' | 'uh'
  | 'un' | 'en' | 'an' | 'on';

/**
 * How a sung line is articulated.
 *
 * These are synthesis parameters, not Strudel parameters — an envelope, a
 * vibrato and a pitch scoop are things any engine implements, so this stays on
 * the renderer-agnostic side of the line. The Strudel renderer maps them onto
 * its controls; a native engine reads the same numbers.
 */
export interface VoiceSettings {
  /**
   * Which vocal tract this is, and how it is being performed — ids into
   * `style/voices.ts` and `style/delivery.ts`.
   *
   * Only a renderer with a tract to configure reads them, which today means
   * `web/voice-synth.ts` alone: Strudel has a fixed filter bank and one
   * envelope, so there is nothing for a tract length or a legato setting to
   * mean there. They live on the track rather than being looked up from the
   * genre because the `Song` has to be self-describing — a renderer is given a
   * song and nothing else, and a voice it cannot reconstruct is a voice it
   * cannot sing.
   *
   * Optional so that a `Song` written before they existed, or by hand, still
   * reads back; the voice falls back to a neutral pair.
   */
  signature?: VoiceSignatureId;
  delivery?: DeliveryId;
  /**
   * How often the mouth re-opens, in beats. A note longer than this is
   * re-attacked for as long as it lasts instead of being held.
   *
   * This is the single most important number here. Without it a sung line is a
   * pad; with it the ear hears syllables, and syllables are what it recognises
   * as a person rather than an instrument.
   */
  syllableBeats: number;
  /**
   * How long one syllable sounds, in beats. Must be shorter than
   * `syllableBeats` — the gap is the mouth closing, and it is what stops the
   * re-attacks from smearing back into a drone.
   */
  blipBeats: number;
  /**
   * Level of the unfiltered source, relative to the formant bands.
   *
   * Small on purpose, and the small number was expensive to learn. A vowel is
   * not three peaks — it is a harmonic series *with* peaks on it — so some
   * unfiltered source has to be there or the voice is hollow. But this band is
   * the one part of the signal that is identical for every vowel, so any more
   * than a trace of it drowns out the differences the formants exist to create.
   * At 0.5 the spectral distance between /a/, /u/ and /i/ measured 3.5 dB and
   * every syllable sounded the same; at 0.15 it measures 6.4 dB.
   *
   * The tension is real and it is a consequence of building this out of
   * *parallel* filters. A vocal tract is a cascade — each resonance multiplies
   * the whole spectrum, so it can be bright and strongly coloured at once.
   * Parallel bands have to trade one against the other. A native engine should
   * chain resonators in series and will not need this compromise.
   */
  bodyGain: number;
  /** Lowpass on that body, in Hz — takes the fizz off a raw sawtooth. */
  bodyLpf: number;
  /**
   * Level of the consonant noise bursts relative to the voice, 0..1.
   *
   * These sit at 3–6 kHz, where hearing is most sensitive, so they carry a long
   * way — a burst mixed as loud as the voice reads as a snare, not a consonant.
   */
  burstGain: number;
  /** ADSR, seconds. `attack` is the default; a consonant overrides it per syllable. */
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  /**
   * Breath: broadband noise mixed into the source, 0..1.
   *
   * Only meaningful to an engine that synthesises its own source. Strudel's
   * sampler ignores it, and the preview uses a sampled voice — which has real
   * breath in it already.
   */
  noise: number;
  /** Vibrato rate in Hz. Around 5–6 is human; much faster reads as a synth LFO. */
  vibRate: number;
  /** Vibrato depth in semitones. */
  vibDepth: number;
  /**
   * How much the formants follow the sung pitch, 0..1. Defaults to 1.
   *
   * This is the difference between a singer and a vocoder, stated as the one
   * number it actually is.
   *
   * A human tract cannot hold a formant below the note being sung, and the
   * renderer already knows it: `effectiveF1` lifts the first formant to meet the
   * fundamental on high notes, with the observation that this is what singers
   * do — the jaw opens and a closed vowel migrates toward /a/ whether the singer
   * wants it or not. At 1 that compensation applies in full.
   *
   * A vocoder is a *fixed* bank of filters that a carrier is pushed through, and
   * the bank does not care what pitch arrives. At 0 the compensation is off, so
   * high notes lose their body — and that hollow, buzzing thinness at the top of
   * the range is not a defect to be corrected, it is the sound.
   */
  formantTrack?: number;
  /**
   * The scoop: how far below the note the voice starts, in semitones, and how
   * long it takes to arrive. The single strongest "this is a person" cue there
   * is — a voice reaches a pitch, an organ is simply already on it.
   */
  scoop: number;
  scoopTime: number;
}

export interface DrumEvent {
  beat: number;
  /** Generic drum voice name; renderers map this to samples or GM notes. */
  voice: DrumVoice;
  velocity: number;
  /**
   * This stroke, sounded as `roll` even strokes filling the sixteenth it stands
   * on. Absent means the ordinary single stroke, and so does 1.
   *
   * `docs/engine-gaps.md` §3.15, reported by two genres and by both of them as a
   * *technique* rather than an ornament. hiphop filed the arithmetic — **at 140
   * BPM a written sixteenth is 107 ms and the roll wants 36** — and dnb filed the
   * absence: no stutter, no retrigger, no 32nd roll. A trap or drill hi-hat
   * subdivides *inside* a stroke, and it is not decoration on the part, it is the
   * part.
   *
   * ## Why a mark on the stroke, when the IR could already hold the beats
   *
   * `beat` is a plain float and always has been, so three onsets 36 ms apart are
   * *expressible* here today and were expressible before this field existed. That
   * is exactly why it took a genre author with a stopwatch to notice that nothing
   * could **read** them. Every consumer of a drum part collapses a slot, and each
   * one does it on purpose:
   *
   *  - `render/strudel.ts` places each stroke with `slotOf`, which rounds to the
   *    nearest sixteenth, so three onsets inside one slot become three writes of
   *    the same string into the same cell — one stroke, silently.
   *  - `drumDynamics` in the same file says it out loud: *two strokes on one slot
   *    sound as one stroke, and it is the harder of them that was asked for*.
   *  - `concert/choreograph.ts` buckets on `quantise(beat)`, so the same three
   *    onsets arrive as up to three simultaneous strokes on one drum and get
   *    dealt to two sticks and a foot.
   *
   * None of that is a bug to be fixed. Two events a hair apart on one voice is a
   * *collision*, and absorbing collisions is a service those three passes exist
   * to provide. A roll is not a collision, and there is no float arrangement that
   * tells the two apart — so the difference has to be **stated**, by the one
   * object that knows which it is.
   *
   * That is `NoteBend`'s shape a layer down and for the same reason. A glide was
   * not built as a second note carrying a flag; it is a field on the note saying
   * *this note travels*, because the second note is exactly what the field
   * absorbs. This is a field on the stroke saying *this stroke is struck more
   * than once*, because the extra strokes are exactly what it absorbs.
   *
   * ## Why a count, and why the sixteenth is not a parameter
   *
   * The unit is the grid's own. `core/grid.ts` defines a slot and this divides
   * it — so `roll: 3` is a triplet inside a sixteenth, `roll: 2` a pair of 32nds,
   * `roll: 4` a run of 64ths, and a whole beat of 32nds is four rolled strokes in
   * a row rather than one long one. The alternatives were both worse in the same
   * direction:
   *
   *  - **A duration in beats** would let a roll outlive its slot and sound
   *    underneath the stroke after it, which is two events editing one moment and
   *    is how the double-swing bug happened. Fenced to the slot, a roll cannot
   *    collide with anything, because the slot is precisely the space this stroke
   *    already owned.
   *  - **A rate in hertz** — 28 strokes a second, which is what the report's 36 ms
   *    is — would make the gesture a property of the clock rather than of the
   *    music, so the same table would come out as a different figure at the top
   *    and the bottom of a style's tempo range. `NoteBend.glideTime` draws that
   *    line in the other direction and for the same reason: a Reese across a half
   *    note and a Reese across a quarter are the same gesture.
   *
   * ## Every stroke of a roll is the velocity of the stroke it subdivides
   *
   * No taper, no shape, no second number — and this is `DrumPattern.ghosts`'
   * argument arriving intact rather than a simplification. Level already has
   * three owners here, the metre through `accentOf`, the section through
   * `intensity` and the performance through `Feel.accent`, and a fourth written
   * anywhere near a figure would outrank all three in every song.
   *
   * It is also what the gesture *is*. `genre/hiphop/styles.ts` had already made
   * the observation, about the eleven styles in that catalogue that write no
   * ghost row: they are *"drawn into a machine a step at a time, and a step has
   * one velocity"*. A trap roll is one step retriggered, so an even roll is not a
   * compromise on the way to a shaped one — a shaped one would be a person
   * pretending to be a machine, which is the sentence that table already makes.
   *
   * The engineering falls out of the music, which is the good kind of luck: the
   * audition's velocity grid needed no change at all. `.gain()` takes its
   * structure from the sound pattern, so all of a roll's strokes read the single
   * number standing on their slot — verified against the installed `@strudel/core`
   * rather than assumed, and see `render/strudel.ts` for the query.
   *
   * ## Nobody's hand ever receives one, and that is a rule rather than a gap
   *
   * `DrumPattern.rolls` is read only where `DrumTrack.source` is `programmed` —
   * *a machine programmed a step at a time; no drummer, and it can play
   * anything*, which is this file's own description of that value and is a
   * description of a retrigger. A preset `box` is excluded on the grounds that
   * already cost it the fill, the drum solo and the ghosts, and a `kit` or an
   * `electronic-kit` is excluded because there are hands on it.
   *
   * The number that settles the hands was written for something else entirely,
   * two subsystems away, which is the strongest form this project's arguments
   * come in. `REPEAT_SECONDS.floor` in `concert/choreograph.ts` is **50 ms**: the
   * physical limit between two strokes of one hand, and it is that short only
   * because the second half of a double is the stick's own rebound. A roll of
   * three at 140 BPM asks for 36 ms of it, from one stick, on one surface,
   * indefinitely. `BURST_SECONDS` puts the *sustainable* rate at eight strokes a
   * second and this is twenty-eight.
   *
   * So the choreographer needed no change and was not merely left alone the way
   * the tempo ramp left it alone. A ramping song auditions flat and the stage
   * agrees with the audition by both being wrong; here the stage and the audition
   * agree because a rolled stroke is structurally unable to reach a staged pair
   * of hands. `npm run genres` asserts it from the other end, so the rule cannot
   * quietly stop holding.
   */
  roll?: number;
}

/**
 * Every sound the percussion can make, as a *role* rather than as an object.
 *
 * The first fourteen are a Western kit plus the handful of extras a drum machine
 * kept beside it, which is exactly what this project needed while it wrote dance
 * bands, jazz trios and synth records. The last four are what it needs to write
 * anything else, and both additions rest on the same argument: a voice missing
 * from here is a part that has to be written on a voice meaning something else,
 * and the ear hears that substitution long before anyone reads the table.
 *
 * The names stay abbreviations of a role — `sd` is the backbeat drum, not a
 * Ludwig Supraphonic — because a renderer is free to make that role out of
 * whatever it has. See `render/drum-banks.ts`, which is the whole of what
 * happens when it has less than the part asked for.
 */
export type DrumVoice =
  | 'bd' | 'sd' | 'rim' | 'hh' | 'oh' | 'cp'
  | 'lt' | 'mt' | 'ht' | 'cr' | 'rd' | 'perc' | 'cb'
  /** Shaker — stands in for brushes, which jazz kits need and drum machines lack. */
  | 'sh'
  /**
   * Tambourine. Jingles rather than a drum, and the one voice on this list that
   * half the repertoire wanted and could not have: the backbeat of soul and
   * gospel, the sixteenths under a funk chorus, the sleigh-bell shimmer over a
   * pop bridge, and the riq at the centre of an Arabic takht. It is General MIDI
   * 54 and it is in 25 of the sample pack's 71 banks, so the only thing it ever
   * lacked was a name. Written on `sh` — the nearest thing available before —
   * every one of those parts came out as a dry rush with no metal in it.
   */
  | 'tb'
  /**
   * The three strokes of a hand drum, low to high — and the reason they are not
   * called `doum`, `tek` and `ka`.
   *
   * Every hand-drum tradition plays *one* drum with *two* hands and gets three
   * distinct sounds out of it: the darbuka's doum, tek and ka; the tabla's ge on
   * the bayan against its na and its damped te; the conga's bass, open and slap;
   * the cajón's centre and corner; the surdo's open stroke and its muffled one.
   * Musically they are the same three strokes everywhere — a full low tone
   * struck in the middle of the head, a ringing tone struck at the edge, and a
   * pinched crack with the hand left lying on the skin — and a pattern that
   * cannot tell them apart is not a rhythm, it is a pulse. Collapsed onto
   * `perc`, which is where everything non-Western had to go until now, a maqsum
   * and a bolero and a keherwa all come out as the same click repeated at the
   * same pitch.
   *
   * **Named for the position, not the instrument**, and that is the whole of the
   * naming decision. A voice called `tabla` is a lie the first time a latin
   * style plays congas on it, and it needs a sibling invented for every further
   * drum — while the same three strokes, given away as low, mid and high, serve
   * darbuka, tabla, conga, bongo, cajón, surdo and the frame drum without one of
   * them being named. `lt`/`mt`/`ht` is the precedent and this is deliberately
   * the same shape one family over: three voices, one instrument, ordered by
   * where on it the hand lands.
   *
   * The ladder is brightness as much as pitch, and the two orderings agree —
   * doum under tek under ka, bass under open under slap — so a table written
   * against these reads in the direction a player counts them.
   *
   * They are emphatically **not toms**. A tom is one stick, one pitch, one drum,
   * and three of them standing in a row; this is one drum and two hands, where
   * the strokes interleave at sixteenth-note speed and the hand that plays the
   * low one plays the high one a moment later. Nor can the low stroke be `bd`:
   * a bass drum is a foot on a different object, and a doum is the pulse of the
   * bar played by the same hand as everything else in it.
   */
  | 'lp' | 'mp' | 'hp';

/**
 * Relative level of each drum voice within the kit, 0..1.
 *
 * A kit is not one instrument at one level. A closed hi-hat struck as hard as a
 * kick is roughly twice as loud to the ear, because hearing peaks exactly where
 * a hat lives and bottoms out where a kick does — so a kit mixed by velocity
 * alone is all cymbals. These numbers are the balance an engineer would set on
 * the faders, and a genre may override any of them.
 *
 * This used to live in the Strudel renderer, where MIDI could not see it, which
 * meant the audition and the shipping file disagreed about the drum balance.
 *
 * These numbers are a balance between the *voices* of a kit and say nothing
 * about the machines. The pack's kicks span 13 dB from bank to bank and its
 * snares 17, which is not a fader decision and is corrected before this one
 * applies — see `render/source-levels.ts`. Left as it was when that landed, on
 * purpose: it was settled by ear and a measurement of a different thing has no
 * standing to overwrite it.
 *
 * ## The ride
 *
 * `rd` was 0.5, which put the largest cymbal on the kit *above* the closed hat —
 * and the paragraph above is the argument for why that cannot be right. A ride
 * takes a stick tip the same way a hat does, is four times the metal, and then
 * rings for a second and a half afterwards. Measured over 120 songs it landed
 * 2.6 dB over the hat in iskelmä and 3.0 in jazz, where it is also the busiest
 * voice in the kit at 3.5 strokes a bar — and 1.9 dB over the string pad, so the
 * timekeeping cymbal was louder than the band's whole bed. Synth, the one genre
 * that wrote a full `drumMix` of its own rather than inheriting this one, had
 * already put its ride under its hat — 0.35 against 0.4. This is the default
 * arriving at the same conclusion.
 *
 * ## The hand drum, and the tambourine
 *
 * The four newest voices are set by the same curve and not by how hard the
 * instrument is hit, which is worth saying because for these the two disagree
 * loudly. A slap is the *hardest* stroke on a hand drum and it gets the
 * smallest fader on it, because a slap is a 4 kHz crack and a doum is a 90 Hz
 * thump, and the ear does the rest — the same trade already made between `bd`
 * at 1.0 and `hh` at 0.45.
 *
 * `lp` at 0.8 is a fifth under the kick and above the toms, because in the
 * music these exist for it is neither an accent nor a fill: it *is* the pulse,
 * the way a kick is, played on a smaller drum with no sub under it. `mp` lands
 * on `perc`'s own 0.6, since a bank with no hand drum resolves it there and the
 * balance should not move when it does. `hp` at 0.5 sits with the cowbell —
 * bright, dry, and heard whether or not it is loud.
 *
 * `tb` takes 0.45, the hi-hat's number, for the plainest possible reason: it
 * lives in the same octave, it keeps time the same way, and a tambourine mixed
 * as a feature is the sound of a demo. On the backbeat it will be heard at this
 * level; in sixteenths, at anything higher, it is all anyone hears.
 */
export const DEFAULT_DRUM_MIX: Record<DrumVoice, number> = {
  bd: 1.0, sd: 0.85, rim: 0.7, hh: 0.45, oh: 0.5, cp: 0.7,
  lt: 0.7, mt: 0.7, ht: 0.7, cr: 0.55, rd: 0.34, perc: 0.6, cb: 0.5, sh: 0.4,
  tb: 0.45, lp: 0.8, mp: 0.6, hp: 0.5,
};

/**
 * The filter envelope on every note: how far under the part's own cutoff the
 * note begins, and what the filter does from there.
 *
 * ## One field, because it is one node
 *
 * A subtractive synthesiser has *one* filter envelope, and so does the
 * audition: `createFilter` in `superdough/helpers.mjs` builds a single ADSR onto
 * a single filter's frequency parameter, and `lpenv`, `lpattack`, `lpdecay`,
 * `lpsustain` and `fanchor` are five knobs on that one envelope. Two of this
 * repertoire's gestures are that envelope with the knobs in different places —
 * a **swell** leans open across a held note and stays there, a **wah** quacks
 * open on the attack and shuts again behind it — and nothing about them is
 * independent. You cannot have both any more than a Minimoog can have two
 * contour generators on one filter.
 *
 * They were nearly built as two fields and that would have been a fault waiting
 * to be found. `render/strudel.ts` documents the mechanism: two calls of one
 * control on one pattern means **the second silently wins**, and `effectsFor` in
 * `generate/song.ts` merges genre under era under style under instrument **per
 * key** — so an era declaring a swell on the melody and a style declaring a wah
 * on it would have produced an object carrying both, one `.lpenv()` line for
 * each, and a lead that plays whichever the emitter happened to write last. One
 * key makes that unrepresentable rather than merely unlikely: the later table
 * replaces the earlier one whole, and exactly one gesture survives the merge.
 * That is the whole reason this is an object and not two numbers.
 *
 * ## Below rather than above, for both shapes
 *
 * `octaves` is a distance *under* `Effects.lowpass` so the era's cutoff stays
 * what it has always been — the brightness this instrument arrives at in this
 * decade — and this field only says how far under it the note begins. The other
 * direction was tried first and is the wrong one: opening *upward* from a cutoff
 * already set at 8 kHz sweeps a range with almost nothing in it, so the gesture
 * is inaudible unless every era table is darkened to make room for it. It is
 * also the rule `NoteEvent.brightness` states in its own words — a part may not
 * out-bright its decade — and a filter envelope is not the place to break it.
 *
 * `fanchor(1)` is what makes that true in the audition rather than merely
 * intended: it puts the envelope's *top* at the written cutoff and its bottom
 * `octaves` below, instead of overshooting into empty spectrum.
 *
 * ## Why the wah is an envelope and not a pedal, which was measured
 *
 * A rocked pedal is the other thing the word means, and the audition can very
 * nearly do it. superdough gives every filter a cycle-synced LFO beside the
 * ADSR — `lprate`, `lpsync`, `lpdepth`, `lpshape`, `lpskew`, all registered
 * controls in `@strudel/core` and all live — and it is genuinely a *pedal*
 * rather than a per-note retrigger: `lpsync` sets `rate = cps * sync`, the
 * worklet takes its phase from `time = cycle / cps`, so the movement is
 * continuous across the bar and every note in it reads the pedal wherever the
 * pedal happens to be. That is exactly the gesture funk's `wah-chank` figure is
 * currently writing in *velocities*.
 *
 * It is refused here for two reasons found by reading the worklet rather than
 * the documentation, and the second is the one that decides it:
 *
 *  - **It has no anchor.** `createFilter` reads `anchor` only inside its
 *    envelope branch, and the LFO is summed onto the cutoff symmetrically about
 *    it — with `lpdepth(1)` the sweep runs from half the cutoff to one and a
 *    half times it. Half of every rock would be brighter than the decade.
 *  - **It is linear in hertz and the ear is not.** `lfo-processor` computes
 *    `(waveshape + dcoffset) * depth` and adds it to a frequency parameter, with
 *    `curve` fixed at 1 by `createFilter`. A triangle is uniform in time, so
 *    across a wah pedal's own two and a half octaves it spends **70% of every
 *    rock in the upper half of the travel** measured in octaves, which is where
 *    the ear measures. The envelope path has no such problem: `createFilter`
 *    calls `getParamADSR` with `'exponential'`, which ramps linearly in log
 *    frequency and is the reason a filter envelope sounds even.
 *
 * So the shape that ships is the one both the ear and the invariant agree with,
 * and the pedal is left described rather than half-built. The device this *is*
 * is the envelope filter — a Mu-Tron III, 1972, and the sound of every funk bass
 * line after it — where the player's own attack opens the filter and it shuts
 * behind them. `Effects.duck` made the same move for the same reason: the
 * follower is a runtime device, and this generator already knows every onset.
 *
 * ## Audition only, and the .mid says nothing rather than something else
 *
 * MIDI's CC74 is GM2, is defined *relative* to the patch's own filter, and the
 * render therefore only ever uses it to darken. A per-note quack could be
 * approximated as a burst of CC74 around each onset, and it would be a
 * half-truth twice over: the resting point would have to sit below the era's own
 * cutoff, so every `.mid` carrying one would play darker than the same song does
 * today even between the quacks, and a GM1 device ignoring CC74 would drop the
 * gesture while keeping the darkening. `NoteBend`'s rule applies — *between a
 * shape both renderers play identically and a shape one of them lies about, take
 * the first* — and where neither is available, say which renderer carries it.
 * This one is the audition's, and it joins the six fields already marked so.
 */
export interface FilterEnvelope {
  /**
   * How many octaves below `Effects.lowpass` the note begins.
   *
   * Small numbers, and the right ones depend on where the part's cutoff already
   * is, which is the point of measuring it against a real table rather than
   * picking a feel. Funk's bass sits at 1600 Hz, so two octaves rests it at
   * 400 Hz and opens it to 1600 — both ends inside a Mu-Tron III's own sweep,
   * which is roughly 200 Hz to 2 kHz on a bass. The same two octaves
   * on a comp at 9000 Hz is a sweep from 2250 Hz upward, which is a bright
   * instrument getting brighter and is not the same gesture at all.
   */
  octaves: number;
  /**
   * What the filter does after the attack.
   *
   *   swell   opens slowly across the note and stays open. Aftertouch: the
   *           CS-80 is the only synthesiser of its decade with per-key
   *           pressure, and leaning into a held note is why that lead sounds
   *           like someone playing rather than someone holding a key down.
   *   wah     snaps open on the onset and shuts again behind it, back to where
   *           it started. An envelope filter, and it is per note by
   *           construction — every onset is an event.
   *
   * The times are not fields, for `GLIDE_SECONDS`' reason and `Effects.duck`'s:
   * both devices are knobs in seconds on a physical box that does not know how
   * long the bar is. See `SWELL_SECONDS`, `WAH_ATTACK_SECONDS` and
   * `WAH_DECAY_SECONDS` in `render/strudel.ts`, and note that the wah's two are
   * within a whisker of superdough's own filter defaults — the 150 ms
   * open-and-shut that the swell writes companions to *suppress* is precisely
   * the thing this shape wants.
   */
  shape: 'swell' | 'wah';
}

/**
 * Per-track effects.
 *
 * These are a *mix* decision rather than a musical one everywhere except
 * ambient, where they are the composition: a Boards of Canada track is a
 * filtered, saturated, reverberant object and the dry notes underneath are not
 * the piece. That is the same argument as "the pad is the piece", and it is why
 * this sits in the IR rather than in a renderer.
 *
 * Only what survives to a real delivery format is expressed here. **Eight
 * fields are audition-only and say so** — `delay`, `highpass`, `drive`,
 * `crush`, `phaser`, `glide`, `filterEnv` and `gate` — and a native engine is
 * free to implement them, because MIDI simply has nowhere to put them. The count said
 * two for a long time after it had stopped being two, which is worth one line:
 * a marker on the field is the thing that has to be right, and a total in a
 * header is a second copy of it that nothing updates.
 */
export interface Effects {
  /** Send to the song's reverb, 0..1. MIDI CC91 — GM level 1, universal. */
  reverb?: number;
  /**
   * Cut the reverb tail this many seconds after the hit. **Audition only.**
   *
   * The gated snare: a big reverb's dense first fraction of a second, stopped
   * dead. The sound is the flatness and the stop rather than the shortness, so
   * a short room is not it. Inert without `reverb`, and it takes a bus of its
   * own because an orbit has one reverb; see `gateBus` in `render/strudel.ts`.
   */
  gate?: number;
  /**
   * Send to the song's delay, 0..1. **Audition only**: MIDI has no standard
   * delay controller, and inventing one would mean a .mid that only plays back
   * correctly on the synth we happened to test.
   */
  delay?: number;
  /**
   * Lowpass cutoff in Hz. MIDI CC74, which is GM2/GS rather than GM1 and is
   * defined *relative* to the patch's own filter — so the MIDI render only ever
   * uses it to darken, never to brighten. FluidSynth honours it; a bare GM1
   * device ignores it and you get the unfiltered patch, which is wrong but not
   * broken.
   */
  lowpass?: number;
  /** Highpass cutoff in Hz. **Audition only** — GM has no highpass. */
  highpass?: number;
  /** Filter resonance, 0..1. MIDI CC71, same GM2 caveat as `lowpass`. */
  resonance?: number;
  /** Stereo position, -1 hard left … +1 hard right. MIDI CC10. */
  pan?: number;
  /**
   * Overdrive, 0..1. **Audition only** — GM has no controller for it.
   *
   * Here because of what an electric instrument actually is. General MIDI has
   * no electric violin and no electric vibraphone, and picking an approximate
   * patch for either would be the wrong fix: an electric violin is not a
   * different instrument, it is a violin with a pickup and an amplifier. That
   * is a statement about *processing*, and processing already has a home.
   * See `Instrument.effects`.
   */
  drive?: number;
  /**
   * Bit depth. 16 is clean, 8 is grit, below 6 is unusable on purpose.
   * **Audition only.**
   *
   * The sound of a sampler that could not afford the bits. Ambient's `sampler`
   * era already describes "audible aliasing" in its docstring and has never had
   * any way to produce it.
   */
  crush?: number;
  /**
   * Phaser sweep depth, 0..1. **Audition only.**
   *
   * Earns its place on period grounds rather than taste: a string machine
   * through a phaser is more characteristic of 1976 than any choice of patch
   * is, and it is the cheapest single thing that stops an analogue era sounding
   * like the digital one after it.
   */
  phaser?: number;
  /**
   * Portamento depth in semitones: how far below the written note this one
   * starts before sliding onto it. Negative slides down onto the note.
   * **Audition only** — MIDI's portamento controllers are GM2, and CC5 is a
   * *time* with no agreed relationship to an interval.
   *
   * Here for the same reason `phaser` is. The slide onto the note is not a
   * decoration on this repertoire's melodies, it is one of the two or three
   * things that identify the instrument playing them: a monophonic synthesiser
   * with the glide switched on, and after 1977 a CS-80 with a ribbon under the
   * keyboard. Every note in the catalogue arrived exactly in tune and started
   * exactly where it ended, which is the one thing a synthesiser lead of this
   * period reliably does not do.
   *
   * Small numbers. Two semitones is a lead player's slur; a fifth is a sound
   * effect. The time it takes is fixed — see `GLIDE_SECONDS` in
   * `render/strudel.ts`.
   */
  glide?: number;
  /**
   * The filter envelope: how many octaves *below* `lowpass` a note starts, and
   * what the filter does across the rest of it. **Audition only**, and inert
   * without a `lowpass` to open toward. See `FilterEnvelope`.
   *
   * `NoteEvent.brightness` already says where a note sits in its instrument's
   * range, and the section-long `filter` ramp already says where the section
   * does. Both are decided *before* the note sounds and neither can change
   * anything while it is sounding — so a four-second held chord under a lead
   * is, timbrally, four seconds of nothing happening.
   *
   * This is the one that moves while the note is sounding, and there are two
   * shapes of it because there are two devices. One field rather than two, for
   * a reason that is structural rather than tidy: see `FilterEnvelope`.
   */
  filterEnv?: FilterEnvelope;
  /**
   * How far under the kick this layer is pushed, in **decibels of gain
   * reduction**. The sidechain duck.
   *
   * This is the first field in this interface that is not about one part in
   * isolation, and that is the whole of what it adds. `docs/engine-gaps.md`
   * §3.17 states the gap in exactly those terms — *"nothing in `Effects`
   * relates two layers at all"* — and pop's fourth era is **named** `sidechain`
   * after the technique it could not say. A compressor keyed off the kick drum
   * pulls the rest of the record down on every beat and lets it back up across
   * it, so the pulse of a dance record is carried by a pad *breathing* rather
   * than by anything struck.
   *
   * ## It is not an envelope follower, and it did not need to be
   *
   * The gap asks for a follower, which is a runtime device: it listens to one
   * signal and derives a gain from it. Nothing here listens, because nothing
   * here has to — **this generator knows every kick onset at compose time**, so
   * the follower's whole job is already done before a renderer starts. What is
   * left is a declaration: *this layer ducks, this deep, recovering this fast*,
   * and the trigger is the kick because in this repertoire it is always the
   * kick. Named rather than searched, on `Style.breakCarrier`'s reasoning one
   * level down: *"whoever is loudest in the bar"* would hand the same style a
   * kick-keyed duck in one song and a clap-keyed one in the next.
   *
   * ## Decibels, because that is the unit the two renderers can agree in
   *
   * Neither renderer's own unit is shareable. superdough's `duckdepth` is a
   * number whose floor works out to `1 − √depth`, and MIDI's expression
   * controller is a 0–127 integer on a square-law curve; a field carrying
   * either one would be a field that means something in one output and has to
   * be converted *back* for the other. Decibels of gain reduction is what a
   * producer sets on the compressor and what both ends convert *to*, so the
   * arithmetic lives in `duckFloor` below and neither renderer owns it. That is
   * `sweptCutoff`'s argument and it is here for the same reason.
   *
   * Small numbers. **6 dB is the duck you feel and 12 dB is the duck you
   * hear**, and past about 15 the layer is gone rather than ducked — at 18 dB
   * the pad is at an eighth of its amplitude and what is left between kicks is
   * a swell rather than a chord. Nothing in the catalogue writes more than 11.
   *
   * Inert on the kit's own `effects`, and it has to be: a kick keyed off itself
   * is a compressor with its own output in the sidechain, which is not a pump
   * but an oscillation. Renderers ignore it there.
   */
  duck?: number;
  /**
   * How long the duck takes to come back, in **beats**. Inert without `duck`.
   *
   * In beats rather than milliseconds for `NoteBend.beats`' reason and
   * `Space.delayBeats`': the gesture is proportional to the music. A pump that
   * recovers over three quarters of a beat is the same gesture at 124 BPM and
   * at 174, where a compressor's release knob in milliseconds is a different
   * gesture at every tempo — and this catalogue's dance styles span 90 to 174.
   *
   * The number that matters is its ratio to the **kick spacing**, because a
   * duck that has not finished recovering when the next kick lands never
   * reaches full level and the pump flattens into a general quietening. On
   * four-on-the-floor the spacing is one beat, so `DUCK_BEATS` is 0.75 — the
   * gain is back at unity for the last quarter of every beat, which is the
   * sound of the record and also why a sidechained pad sounds *rhythmic*
   * rather than merely modulated. A style whose kick is sparser can afford
   * longer and one whose kick is busier must take less.
   *
   * The *fall* is not a field. It is `DUCK_ONSET_SECONDS` in both renderers,
   * for `GLIDE_SECONDS`' reason: a compressor's attack is a knob in
   * milliseconds on a physical box and does not know how long the bar is.
   */
  duckBeats?: number;
}

/**
 * The space every track sends into.
 *
 * Reverb size and delay time belong to the *room*, not to the instrument
 * standing in it — one hall, and each player further forward or further back in
 * it. That is how a mixer works and, not coincidentally, how MIDI works: CC91
 * is a send level to the synth's single global reverb, and there is no
 * per-channel reverb to give a size to.
 */
export interface Space {
  /** Reverb decay and size, 0..1. */
  reverbSize: number;
  /** Delay time in *beats*, so it stays musical across tempos. */
  delayBeats: number;
  /** Delay feedback, 0..1. */
  delayFeedback: number;
}

export const DEFAULT_SPACE: Space = {
  reverbSize: 0.5,
  delayBeats: 1,
  delayFeedback: 0.3,
};

/**
 * How one note rises and falls. Times in seconds; `sustain` is a level, 0..1.
 *
 * This is in the IR rather than in the Strudel renderer because it is a fact
 * about the *instrument*, not about the playback library — a struck bar decays
 * to nothing and a bowed string does not, and any engine that ever replaces
 * Strudel needs to know that too.
 *
 * It is here at all because a sampler plays whatever it is sent, and what it is
 * sent by default is a gate: superdough's envelope defaults are
 * `[0.001, 0.001, 1, 0.01]`, meaning full level for the note's entire written
 * length and off in ten milliseconds. That is the one shape a mallet never
 * makes. Worse, the soundfont loader turns on `src.loop` for any zone with loop
 * points, so a held note is a short slice of the sample cycling at constant
 * level — a vibraphone stops being a struck bar and becomes a small organ.
 *
 * `sustain: 0` is the whole point for anything struck or plucked: the note
 * decays over `decay` seconds from its own attack and pays no attention to how
 * long it was written for.
 */
export interface Envelope {
  /** Seconds from silence to full level. */
  attack: number;
  /** Seconds from full level down to `sustain`. */
  decay: number;
  /** Level held until the note ends, 0..1. Zero means struck: it rings out. */
  sustain: number;
  /**
   * Seconds to fade once the note ends.
   *
   * On a struck instrument this is not the tail — `decay` is. It is what
   * catches a note whose written length ran out mid-decay, so a short mallet
   * note tapers instead of stopping dead.
   */
  release: number;
}

export interface Track {
  layer: LayerId;
  /** Human name, e.g. "accordion". */
  instrument: string;
  /** General MIDI program number, 0-based. */
  gmProgram: number;
  /** Strudel soundfont name, e.g. "gm_accordion". */
  strudelSound: string;
  notes: NoteEvent[];
  /** Mix level 0..1, applied on top of per-note velocity. */
  gain: number;
  /**
   * Set on the `vocal` layer only. Its presence is what tells a renderer this
   * track is sung rather than played, and that the notes carry vowels.
   */
  voice?: VoiceSettings;
  /**
   * Set where one player performs this track with **both hands at once** — a
   * pianist fronting a trio, whose right hand has the tune and whose left hand
   * comps underneath it.
   *
   * Its presence is the declaration, exactly as `voice`'s is: every other
   * melodic track in this IR is a line, and code that walks one note to the next
   * measuring intervals, rests and overlaps is right about all of them and wrong
   * about this one. Five reporting tools were, and each of them silently: a
   * left-hand chord tone read as a leap down and back, and a chord sounding
   * under a held melody note read as an overlap bug.
   *
   * A renderer needs nothing from this — polyphony was always expressible and
   * the comp layer has always used it. It is here for the things that want *the
   * line* back out again, and `melodicLine` is how they get it.
   */
  twoHanded?: {
    /**
     * Semitones of separation the two hands were written with, and the exact
     * number needed to take them apart again. See `melodicLine`.
     */
    gap: number;
  };
  /**
   * How each note of this part rises and falls. See `Envelope`.
   *
   * Absent means "whatever the renderer does by default", which is a gate. The
   * MIDI renderer ignores it and is right to: a GM program number already
   * carries its own envelope, and there is no CC that would say this.
   */
  envelope?: Envelope;
  /** Filtering, reverb send and stereo position. Absent means dry and centred. */
  effects?: Effects;
  /**
   * Set where this part is played by a **sequencer** rather than by hands.
   *
   * The same declaration `voice` and `twoHanded` are, and it exists for the
   * same reason: from here on nothing can tell by looking. A sequenced bass and
   * a played bass are both a list of notes, and the difference — that nobody's
   * fingers are on it — is not recoverable from the notes.
   *
   * What it means downstream, in the order the pipeline meets it:
   *
   *  - The generator **constrains what may be written**. A sequencer holds one
   *    figure and repeats it at one level; it does not ride a fader up for a
   *    solo and it does not lean into a chorus, because there is nobody to
   *    lean. It is also never handed a solo — a machine taking a chorus is a
   *    loop with the band politely waiting.
   *  - Casting stages **no performer for it**. The part is hosted by a keyboard
   *    player who is already on stage: the sequencer is a module in their rig
   *    and they work it. So a number that would have needed a fourth keyboard
   *    player needs three, and all three are busier rather than idler.
   *  - The choreographer writes **operating** gestures instead of playing ones —
   *    starting it on the beat it first sounds, and reaching to the panel where
   *    the section's filter already moves.
   *
   * `cycle` is the figure's length in beats. The stage needs it to run a step
   * row that means a bar of this music rather than an arbitrary window.
   */
  machine?: { cycle: number };
  /**
   * What the player's right hand is doing. See `generate/technique.ts`.
   *
   * The fourth declaration in this interface and the same kind as the other
   * three: once the notes exist, nothing can tell by looking whether they were
   * slapped, picked or strummed, and three consumers need to know — the
   * renderers, which shape the note; `concert/choreograph.ts`, which moves the
   * hand; and the reports, which should not call a dead stroke a note.
   *
   * Absent on every part played with a bow, a reed, a keyboard or a mouth, which
   * is most of them. That is the field working rather than the field missing:
   * a technique here is a hand on a string, and an organist has no right-hand
   * technique in this sense however busy their right hand is.
   */
  technique?: Technique;
}

/**
 * Layers a sequencer may be given.
 *
 * Bass and counter, and nothing else, because those are the two the genre
 * actually sequenced: a bass figure and a second figure phasing against it is
 * the entire Berlin-school texture. The exclusions are the point of the list —
 * a sequenced *melody* is a tune nobody is playing, which is the one thing that
 * would make a stage look emptier rather than busier, and a sequenced comp is
 * an arranger's decision rather than a machine's.
 */
export type SequencedLayer = 'bass' | 'counter';

/**
 * The year a sequencer could be running on a stage.
 *
 * Gated hard and separately from any era weighting, exactly as
 * `DRUM_SOURCE_FROM` is, so no table written later can put one behind a dance
 * band. 1971 is Tangerine Dream and the Moog 960 in front of an audience; the
 * technology is older and was a studio object before that, which is the same
 * distinction `SYNTH_RIGS.modular.from` had to be corrected for.
 */
export const SEQUENCER_FROM = 1971;

/**
 * Whether a sequencer may take a part off a player at all. Off, for now.
 *
 * The same judgement `DRUM_MACHINES` records, reached about the same object.
 * The note there said a sequencer running a pitched figure was a different
 * thing with a different gate and left it alone; on a stage it is not different
 * enough. `web/concert/instruments/drum-machine.ts` builds all three kinds and
 * says so in its own header — they share a carcass and a stand because at stage
 * distance they *are* the same silhouette, a shoebox at somebody's elbow. So
 * turning the rhythm boxes off and leaving this on kept the box and only
 * changed what it was running.
 *
 * And this one costs a person as well. `castSong` stages no performer for a
 * machine-played track, so a sequenced bass is not a bassist plus a box — it is
 * the box *instead of* the bassist, which is the trade the wrong way round. A
 * player standing there is the better thing to look at, and that is the whole
 * argument.
 *
 * **Struck at the draw, not out of the catalogue**, exactly as `DRUM_MACHINES`
 * is. `Track.machine` keeps its meaning, every era table keeps its `sequenced`
 * chances as written, and `placeMachines` in `concert/cast.ts`, `operatePart`
 * in `concert/choreograph.ts` and the `sequencer` kind in `drum-machine.ts` are
 * all still here and all still correct. Flipping this to `true` puts the
 * sequencers back with no other edit, which is the point of gating one funnel
 * rather than pruning eleven genres' era tables.
 *
 * It changes the music and not only the stage, and that is intended rather than
 * a side effect. A sequenced part is written flat on purpose — one figure at one
 * level, never handed a solo, and the section's intensity divided back out of
 * its velocities — because there is nobody behind it to lean. Handing the line
 * back to a player hands back the dynamics with it.
 */
export const SEQUENCERS = false;

/**
 * The year a record could duck under its own kick. See `Effects.duck`.
 *
 * Gated hard and separately from any era weighting, exactly as `SEQUENCER_FROM`
 * and `DRUM_SOURCE_FROM` are, and for a reason that is a fact about the medium
 * rather than a taste: **you cannot sidechain on two-track.** A compressor keyed
 * off the kick needs the kick on a channel of its own, so the technique is not
 * merely unfashionable before multitrack — it is unavailable, in the same way a
 * sequencer is unavailable before there is one.
 *
 * 1993 rather than the year the first key input shipped, on the same
 * distinction `SEQUENCER_FROM` had to be corrected for: the gear is older and
 * the *sound* is not. Ducking as a compositional device — a record whose pulse
 * is a pad breathing rather than anything struck — is a nineties dance-music
 * idea, and pop's era table already dates it, naming its fourth era `sidechain`
 * and labelling it *1993–now*. This is that label made enforceable, so that a
 * style whose home is 2010 and which can also be drawn in 1963 does not arrive
 * in 1963 pumping.
 *
 * It separates pop's `gated` era from its `sidechain` one and nothing else in
 * the catalogue, which is the shape a gate written from one genre's evidence
 * should have.
 */
export const DUCK_FROM = 1993;

/**
 * What is producing the percussion — as an object in a room, not as a sound.
 *
 * `bank` is a sample library and cannot answer this. Jazz's 1938 era draws from
 * `AkaiMPC60` and `AlesisSR16`, which are sample sources standing in for a kit
 * nobody in 1938 could have recorded any other way; reading a drum machine off
 * the bank name would put an MPC on a swing bandstand. So the object gets its
 * own field, and the field is decided here — in the generator, before the notes
 * exist — rather than on the stage afterwards.
 *
 * That ordering is the whole point and it is worth being explicit about, because
 * the other one is the obvious design and it is wrong. A preset rhythm box
 * cannot play what `generate/fills.ts` writes: it has fourteen buttons on it
 * marked *Bossa Nova* and *Waltz*, and no button marked *descending tom roll
 * into the last chorus*. Choosing the box after the part was written would
 * stage a machine miming music it has no mechanism for. So the source is chosen
 * first and **constrains** what may then be written, and casting reads the
 * answer exactly as it reads `Track.voice`.
 *
 * ## A pair of hands on a hand drum is not a value here, and that was the answer
 *
 * `DrumVoice` carries `lp`/`mp`/`hp`, so a darbuka, a tabla and a set of congas
 * can be written, and for a while nothing produced them: the part was declared
 * a `kit`, and a kit has no hand drum on it. This note used to ask for a fifth
 * value of this type to fix that — a `hand-drum` source, with `DRUM_SOURCE_FROM`
 * of 0 and `canVary` of true.
 *
 * **It was the wrong shape, and the reason is worth keeping.** A value here
 * answers for the *whole part at once*, because that is what this field is for:
 * it is chosen before the notes exist and constrains what may then be written.
 * That is exactly right for a drum machine, which cannot play what a drummer
 * plays. It is wrong for a hand drum, because a third of the patterns that
 * write hand voices write kit voices in the same bar — funk's `congas`, latin's
 * `cumbia-kit`, reggae's `roots-rockers`. Those are not one player choosing
 * between two instruments. They are two players, and a source field cannot say
 * so at any value.
 *
 * So the split is on the *voice* rather than on the source, in `STATION_OF` and
 * `drumStations` in `concert/instruments.ts`, and casting drafts one player,
 * two, or a kit and a percussionist, from the voices actually present. This
 * field keeps its four values and its original job: whether a person or a
 * machine is making the sound.
 */
export type DrumSource =
  /** A drummer, an acoustic kit, a riser. */
  | 'kit'
  /** A drummer on pads. Same choreography, different object and different sound. */
  | 'electronic-kit'
  /** A machine programmed a step at a time. No drummer; it can play anything. */
  | 'programmed'
  /** A machine with presets and a start button. No drummer, and no fills. */
  | 'box';

/**
 * The year each source became a thing somebody could have owned.
 *
 * A hard gate, applied *before* any era weighting is consulted — see
 * `chooseDrumSource`. Era tables are authored by hand and will go on being
 * authored by hand; this is what stops a weight written later from putting a
 * Rhythm Ace on a 1938 bandstand, whatever that table says.
 *
 * `box` is the Rhythm Ace (1964) and the Mini Pops (1967). `programmed` is the
 * Roland CR-78 (1978), the first with a memory a player could write into, though
 * the decade that means it is the LinnDrum's. `electronic-kit` is the Simmons
 * SDS-V, which is 1981 and is the reason a 1974 stage cannot have one however
 * much it would suit the music.
 */
export const DRUM_SOURCE_FROM: Record<DrumSource, number> = {
  kit: 0,
  box: 1964,
  programmed: 1978,
  'electronic-kit': 1981,
};

/**
 * A drummer is behind these, and is not behind the others.
 *
 * The one question casting needs answered, given a name so that the two places
 * that ask it cannot drift apart.
 */
export function isPlayedByHand(source: DrumSource): boolean {
  return source === 'kit' || source === 'electronic-kit';
}

/**
 * Whether this source can play a fill, a drum solo, or a velocity that responds
 * to how hard the section is going.
 *
 * All three are the same capability — a part that varies bar to bar — and all
 * three are the thing a preset box does not have. Hands obviously do; a machine
 * somebody programmed does too, because they programmed each bar.
 */
export function canVary(source: DrumSource): boolean {
  return source !== 'box';
}

/**
 * Whether a machine may make the percussion at all. Off, for now.
 *
 * `box` and `programmed` are the two sources with nobody behind them, and a
 * stage carrying one is worse to look at than the same number with a drummer
 * playing it: the machine is a small case on a stand at the edge of somebody's
 * keyboard, and the whole apparatus that gives it an owner — the tender, the
 * stand, the reach across to the start switch — buys an explanation for an
 * object that was never worth explaining. A drummer is. So the two machine
 * sources are struck from the draw and every number gets hands on the kit.
 *
 * **Struck at the draw, not out of the catalogue.** `DrumSource` keeps all four
 * values; every era table keeps its `drumSources` weights exactly as written;
 * `canVary`, `placeMachines` in `concert/cast.ts` and the model in
 * `web/concert/instruments/drum-machine.ts` are all still here and all still
 * correct. Flipping this to `true` puts the machines back with no other edit,
 * which is the point of gating one funnel rather than pruning twenty tables.
 *
 * `electronic-kit` is unaffected and that is not an oversight: a Simmons is
 * pads a drummer hits, `isPlayedByHand` says so, and there is a person behind
 * them. This gate is about the empty stage, not the electronic sound.
 *
 * A sequencer running a *pitched* figure has its own gate, `SEQUENCERS`, and
 * this note used to say it was a different object and was left alone. It is now
 * off for the same reason and by the same mechanism — see there for why the
 * distinction did not survive contact with the stage.
 */
export const DRUM_MACHINES = false;

/**
 * The sources an era may actually draw from, weighted, after the year gate.
 *
 * Returns the list rather than the answer so the draw itself happens in
 * `generate/song.ts` alongside every other weighted choice — one `Rng` stream,
 * one place a seed can be traced through.
 *
 * An era that names no sources gets a kit, and so does one whose entire table
 * was gated away — by the year, or by `DRUM_MACHINES` being off, which is what
 * empties an all-machine table like ambient's sampler era. Both fallbacks are
 * deliberate: a kit is what every song in this project staged before this field
 * existed, so the quiet answer is also the backwards-compatible one.
 */
export function eligibleDrumSources(
  year: number,
  weights: readonly (readonly [DrumSource, number])[] | undefined,
): (readonly [DrumSource, number])[] {
  const open = (weights ?? []).filter(
    ([source, weight]) => weight > 0 && year >= DRUM_SOURCE_FROM[source]
      && (DRUM_MACHINES || isPlayedByHand(source)),
  );
  return open.length ? open : [['kit', 1] as const];
}

export interface DrumTrack {
  /** Strudel drum-machine bank, e.g. "LinnDrum". */
  bank: string;
  /**
   * What is making this sound, as an object on a stage. See `DrumSource`.
   *
   * Optional in the type and never optional in practice: every song this
   * generator writes sets it. It is optional so that a `Song` deserialised from
   * before this existed still type-checks, and consumers should read a missing
   * value as `'kit'`, which is what every such song staged as.
   */
  source?: DrumSource;
  events: DrumEvent[];
  gain: number;
  /** Relative level of each voice within the kit. See `DEFAULT_DRUM_MIX`. */
  voiceGains: Record<DrumVoice, number>;
  effects?: Effects;
  /**
   * Per-voice treatment, merged over `effects`.
   *
   * A kit is not treated as one object, and the case that forces this is a
   * single gesture: **gated reverb on the snare and nothing else** is the most
   * recognisable production sound of 1984, and applying it to the whole kit
   * puts a two-second tail on the hi-hats, which is a mess rather than a
   * period. The same argument `voiceGains` already makes — a kit is eighteen
   * sources sharing a stand — applied to the other half of the mix.
   */
  voiceEffects?: Partial<Record<DrumVoice, Effects>>;
}

export interface SongMeta {
  seed: string;
  title: string;
  /** Style id, e.g. "tango". */
  style: string;
  styleLabel: string;
  era: string;
  eraLabel: string;
  mood: string;
  /** Genre id, e.g. 'iskelma' or 'jazz'. */
  genre: string;
  genreLabel: string;
  /** Constraint strictness id, e.g. 'standard'. */
  strictness: string;
  strictnessLabel: string;
  /** Repetition level id, e.g. 'catchy'. */
  hook: string;
  hookLabel: string;
  tonic: number;
  mode: Mode;
  keyLabel: string;
  /**
   * How fast the piece is, in beats per minute — **and where it starts**, on
   * the few pieces that do not stay there.
   *
   * This field predates `tempo` below by the whole project, twelve files read
   * it, and most of them are labels and reports that legitimately want one
   * number. So it keeps the meaning it has always had for a piece at one tempo,
   * and takes the only honest reading available for a piece that ramps: **the
   * tempo the band counts off.**
   *
   * The alternative was the mean, and it was rejected on what a reader does with
   * the number. A `.mid` header, a showbill line and the audition's `setcpm` all
   * put this figure in front of somebody as *the tempo of this music*; the mean
   * of an accelerando is a speed the band plays for one bar in the middle and
   * nobody would recognise, whereas the count-off is the speed the piece is in
   * for its whole first phrase. It is also what makes `render/strudel.ts`'s
   * fallback defensible rather than arbitrary — see the note there.
   *
   * Anything that needs to be right about *when a beat happens* must go through
   * `songTempo` and `secondsAt` instead of dividing by this. `songDurationSeconds`
   * is the worked example.
   */
  bpm: number;
  /**
   * Where the piece changes speed, if it does. See `generate/tempo.ts`.
   *
   * The fourth sibling of `feels`, `transitions` and `drops`, carried for the
   * reason all three give — a plan is IR rather than a private detail of the
   * generator — and absent under the same rule: a style that names no tempo
   * palette was never asked the question, drew no random number, and serialises
   * byte-for-byte to what it did before this field existed. That **was** every
   * style in the catalogue, and the sentence is kept in the past tense rather
   * than deleted because the rule above is only legible beside a count of who
   * has not opted in. One style has: dnb's `breakcore`, at
   * `tempoRamp: [['none', 3], ['accelerando', 1]]`, which carries a map on
   * **44 of 200 songs**. The other 388 still take the early return and still
   * serialise byte-for-byte.
   *
   * It differs from the other three in one way that matters to every reader.
   * `feels`, `transitions` and `drops` are *descriptive* — a report can ignore
   * them and still be right about the notes. This one is **constitutive**: a
   * consumer that ignores it does not lose detail, it plays the piece at the
   * wrong speed. So the accessor is `songTempo`, which fabricates the one-entry
   * map when this is absent, and the discipline is that clocks call that rather
   * than reading either field directly.
   *
   * Absolute beats from the top of the file, including any count-in —
   * `withCountIn` shifts the map with everything else, and puts the counting bar
   * at the opening tempo, because a drummer counts a band in at the speed the
   * band is about to play.
   */
  tempo?: TempoMap;
  /** Quarter-note beats per bar. Fractional where the metre is written in eighths. */
  beatsPerBar: number;
  /** Which note value gets the beat (4 = quarter). */
  beatUnit: number;
  /**
   * How the bar groups, in sixteenths, where it does not group evenly — the
   * 2+2+3 of a 7/8, the 3+2 of a 5/4. See `Style.groups`.
   *
   * Carried on the song rather than left in the style table because by the time
   * anything is reading a `Song` the style is gone, and the grouping is not
   * recoverable from the notes: it is why the accents are where they are, so
   * anything counting the band in or lighting the downbeats has to be told.
   */
  groups?: number[];
  totalBars: number;
  /** Swing amount 0..0.33; 0 = straight. */
  swing: number;
  /**
   * How each stretch of the song is felt — where the band leans, and how long it
   * holds a note. See `style/feel.ts`.
   *
   * Absent on any song whose style names no feel table, which **was** all but
   * two of them and is now all but 87 of the 389 — measured, `feels` is present
   * on 153 of 760 songs sampled evenly across the nineteen genres. The original
   * count is kept rather than deleted because the rule it illustrates has not
   * moved: absent means straight throughout and means no draw was made, so a
   * catalogue that has not opted in is byte-for-byte what it was. Present, the
   * spans cover the song end to end and are half-open in bars, so anything
   * reading them can say what is happening at bar 12 the way it already can with
   * `chordLabels`.
   *
   * The import is type-only and stays that way. `core` is the layer everything
   * else is built on and does not depend on `style` at runtime; the alternative
   * — a second declaration of the span shape down here — is how two shapes drift
   * apart.
   */
  feels?: FeelSpan[];
  /**
   * What happens at each section join. See `generate/transition.ts`.
   *
   * The sibling of `feels` above and carried for the same reason: a seam plan is
   * IR rather than a private detail of the generator, so `score.ts` and the
   * showbill can say *what the band does at bar 32* the way they can already say
   * what chord is there. Indexed by the section being left, so an entry per join
   * and none after the last bar.
   *
   * Absent on any song whose style names no transition palette, which **was**
   * all of them when this landed and is now 38 of the 389 — 141 styles name one
   * outright and ten genres name one their styles inherit, so 351 reach a
   * palette and this field is present on **646 of 760** songs sampled evenly
   * across the nineteen genres. The original count is kept rather than deleted
   * because absent is the same statement it is for `feels`: the
   * question was never asked, no draw was made, and the song is byte-for-byte
   * what it was. It would have been easy to emit this unconditionally, since
   * every song has seams and every seam resolves to `fill`; that was rejected
   * because it would put an answer on three hundred songs that were not asked,
   * and because the wave that introduced it is the one whose entire deliverable
   * is that nothing changed, which a raw JSON compare can then prove.
   */
  transitions?: Seam[];
  /**
   * Where the band drops out mid-section and comes back. See `generate/drop.ts`.
   *
   * The third sibling of `feels` and `transitions` and carried for the reason
   * both of those give — a span is IR rather than a private detail of the
   * generator, so `score.ts` and the showbill can say *the bass is out from bar
   * 40 to bar 44* the way they can already say what chord is there and how that
   * stretch is felt.
   *
   * It carries more weight here than for either of those, because this is the
   * field the layered-ambient goal is waiting on. The README's answer to *how
   * does music thin out under speech* is **mute layers rather than lower a
   * master bus**, and the audition page's layer chips already do that at
   * playback. A mute lane a player can act on has to come from somewhere, and
   * nothing in the IR could previously say that a layer is meant to be absent
   * for a stretch shorter than a section. This says it.
   *
   * At most one entry today — a drop is drawn once per song, on the reasoning
   * `generate/chart.ts` gives about devices that arrive on schedule — and an
   * array rather than a single span because the shape of the statement is *these
   * bars, these layers*, and a second drop is a change to a draw rather than to
   * this type.
   *
   * Absent on any song whose style names no drop palette, which **was** all of
   * them when this landed. 29 styles name one now, in four genres — reggae,
   * funk, house and dnb, the two that reported the gap and the two that were
   * waiting on it — and the field is present on **22 of 760** songs sampled
   * evenly across the nineteen genres. The original count is kept rather than
   * deleted because absent is the same statement it is for `feels`: the question
   * was never asked, no draw was made, and the song is byte-for-byte what it was.
   */
  drops?: DropSpan[];
  /**
   * Bars of count-in at the very front of the song, before bar 1 of the music.
   *
   * Absent or 0 on anything that is a *record* — the radio plays songs, and a
   * record that counts itself in is a demo. It is set by `withCountIn`, which
   * the concert applies to every number it stages, because a band on a stage
   * does not start by telepathy: somebody clicks four and the band comes in.
   *
   * Those bars are ordinary music — real drum events in a real section — so
   * every renderer, the choreographer and the lighting score see them without
   * being told. What this field is *for* is the one thing they cannot derive:
   * that the piece proper starts at `leadInBars * beatsPerBar`, which is where
   * "has the number begun" and any progress bar have to measure from.
   */
  leadInBars?: number;
  /**
   * What this band was assembled out of, on a number that was assembled rather
   * than played. See `genre/chaos.ts`.
   *
   * Absent on every song the nineteen genres write by themselves, which is all
   * of them unless a caller asked for a chimera — the same absent-means-not-
   * asked rule `feels`, `transitions` and `drops` carry, and with the same
   * consequence: nothing in the catalogue moved when this field appeared.
   *
   * Present, it is **constitutive rather than descriptive**, and it is the only
   * field on this record that is. `genre`, `era` and `style` name the *host* —
   * a real genre, a real era and a real style, which is what keeps the venue,
   * the wardrobe and the year lookup working — so those three no longer suffice
   * to regenerate the piece, and a consumer that drops this one gets the host's
   * own song back rather than a slightly different chimera. `SongMeta` is meant
   * to be enough to reproduce the song it describes; this is the part of the
   * answer that says which nineteen-genre band turned up.
   */
  chaos?: ChaosRecipe;
}

/**
 * The recipe for a chimera: the kinds, the rate, the host and what moved.
 *
 * Plain strings and numbers, because it is IR — printable, serialisable through
 * a `.mid` header comment or a share link, and readable by a person who wants to
 * know why there is a sitar in the humppa. `borrowed` maps a property name to
 * the `genre:style` it came from; the names are `genre/chaos.ts`'s traits and
 * only the ones that actually moved appear.
 *
 * `levels` holds `ChaosLevel`s and is typed as such. The import is type-only and
 * stays that way — `core` is the layer everything else is built on and does not
 * depend on `genre` at runtime — which is the arrangement `feels` already has
 * with `style/feel.ts`, and for the same reason: a second declaration of the
 * vocabulary down here is how two vocabularies drift apart.
 */
export interface ChaosRecipe {
  /**
   * Which kinds of property were allowed to move, in `CHAOS_LEVELS` order rather
   * than the caller's, so two recipes that asked for the same thing compare
   * equal however they were typed.
   */
  levels: ChaosLevel[];
  /** The share of eligible properties offered a foreign donor, 0..1. */
  spread: number;
  /**
   * That share again for the kinds that were mixed at a rate of their own —
   * only the selected ones, and only where it differs from `spread`, so a
   * recipe with no advanced mixing in it does not carry the field at all.
   */
  mixing?: Partial<Record<ChaosLevel, number>>;
  /**
   * The seed the *band* was drawn from, when it was not the song's own.
   *
   * `SongMeta.seed` reproduces the piece and this reproduces who turned up to
   * play it. Absent on the ordinary case, where they are the same string and
   * the one above is the answer to both.
   */
  seed?: string;
  /** The genre, era and style the chimera is filed under, and stands on. */
  host: { genre: string; era: string; style: string };
  /** Property name → `genre:style` it came from. Only what moved. */
  borrowed: Record<string, string>;
}

export interface Song {
  meta: SongMeta;
  sections: Section[];
  tracks: Track[];
  drums: DrumTrack;
  /** The reverb and delay every track's send level refers to. */
  space: Space;
}

/**
 * The melodic line of a track, which on all but one kind of track is the track.
 *
 * Anything measuring melody — intervals, range, phrase recall, voice-leading
 * faults, whether a note overlaps the next one — needs a single line to walk,
 * and every melodic track in this IR is one. The exception is a `twoHanded`
 * keyboard, where the same person's accompaniment is interleaved with their
 * tune, and where walking the notes in order produces nonsense.
 *
 * **Where the part says which hand played it, that is the answer.** A left hand
 * written by `generateLeftHand` marks its notes `hand: 'left'`, and the line is
 * everything else — no reasoning, no register, nothing to get wrong. Every song
 * this generator writes takes that path.
 *
 * **Where nothing is marked, the separation is reconstructed** from the fact that
 * the part was *written* with one: the right hand is one note at a time and the
 * left hand is a voicing kept `gap` semitones underneath it. So in any group of
 * notes sharing an onset —
 *
 *  - one note is the right hand, playing alone;
 *  - a top note standing `gap` or more above the rest is the right hand landing
 *    on a left-hand chord, and the chord below it is not the line;
 *  - and anything else is the left hand comping by itself, in a hole the right
 *    hand left, which contributes no melody note at all.
 *
 * The fallback stays because it is what makes the mark safe to have introduced.
 * A two-handed track built by hand or by a probe in a check carries no marks and
 * is not wrong, merely older; it goes on measuring exactly as it did. What the
 * fallback cannot do is the reason the mark exists — see `NoteEvent.hand` — so
 * anything generated reaches for it first.
 *
 * A track with no `twoHanded` is returned untouched, so no existing measurement
 * moves — including the overlap check, which is a real bug report on a real line
 * and must not be quietly filtered away.
 *
 * ## The question this function does not answer
 *
 * It says *what is this player's line*, and since `HarmonyProfile`'s
 * `on: 'melody'` a layer may carry two players. Both tracks come back from here
 * as lines, correctly: the second lead **is** a line, monophonic, and everything
 * that walks one is right about it.
 *
 * *Which of them is the tune* is a different question and it has a different
 * answer, which is **order**. `generateSong` emits the lead first and the second
 * lead last, so the `song.tracks.find(t => t.layer === 'melody')` that six
 * reporting tools and the last `undoubleAgainst` all open with keeps landing on
 * the tune — the same convention the drum kit relies on to keep the plain `drums`
 * id and the vocal stack to keep `vocal`. A tool that wants the tune must ask
 * that way round and must not `filter`.
 *
 * And a consumer that has been *handed* a track and needs to know which it holds
 * asks the notes: every note of a second lead carries `NoteEvent.harmony` and no
 * note of a tune ever does. That is a property of the part rather than of its
 * position in an array, which is what makes it the one worth checking against.
 */
export function melodicLine(track: Track): NoteEvent[] {
  /**
   * A dead stroke is never part of the line, whoever is playing it.
   *
   * First, and above the two-handed question, because it is the more basic one:
   * the split below asks *which hand played this note*, and a damped string is
   * not a note at all. It carries a pitch only because a renderer has to be sent
   * one — see `NoteEvent.dead` — so a consumer measuring intervals, tessitura or
   * note counts against it is measuring a click. A singer doubling a line must
   * not sing one either, which is the path this actually reached first.
   */
  const sounding = track.notes.some((n) => n.dead)
    ? track.notes.filter((n) => !n.dead)
    : track.notes;

  const gap = track.twoHanded?.gap;
  if (gap === undefined) return sounding;

  if (sounding.some((n) => n.hand === 'left')) {
    return sounding.filter((n) => n.hand !== 'left');
  }

  const groups = new Map<number, NoteEvent[]>();
  for (const n of sounding) {
    const at = groups.get(n.beat);
    if (at) at.push(n);
    else groups.set(n.beat, [n]);
  }

  const out: NoteEvent[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) { out.push(group[0]!); continue; }
    const sorted = group.slice().sort((a, b) => a.midi - b.midi);
    const top = sorted[sorted.length - 1]!;
    const under = sorted[sorted.length - 2]!;
    if (top.midi - under.midi >= gap) out.push(top);
  }
  return out.sort((a, b) => a.beat - b.beat);
}

/**
 * The time signature as a notator would write it: `[7, 8]`, not `[3.5, 8]`.
 *
 * The engine counts in quarter-note beats, always, so a metre written in
 * eighths reaches `SongMeta` as a fraction — 7/8 is three and a half quarters,
 * which is exactly true and reads as an error in every place a human sees it.
 * The numerator is recovered by asking how many `beatUnit`s fit in that many
 * quarters, which turns 3.5 and 8 back into the 7 that was written and leaves
 * 4/4, 3/4 and 5/4 untouched.
 *
 * Here rather than in each caller because there are four of them — the MIDI
 * header, the CLI listing, the score dump and the web UI — and a metre printed
 * one way in the browser and another way in the file is the kind of discrepancy
 * that gets debugged twice.
 */
export function timeSignature(meta: SongMeta): [number, number] {
  return [Math.round((meta.beatsPerBar * meta.beatUnit) / 4), meta.beatUnit];
}

/** The same, as `7/8`. */
export function meterLabel(meta: SongMeta): string {
  const [n, d] = timeSignature(meta);
  return `${n}/${d}`;
}

/**
 * How far a fully closed filter travels, in octaves.
 *
 * Four is a real sweep and not more: closing further puts the cutoff under the
 * fundamental of anything but a bass part, at which point the note stops being
 * dark and starts being missing.
 */
const SWEEP_OCTAVES = 4;

/**
 * The cutoff a note is actually heard through, from the track's declared
 * lowpass and the note's `brightness`.
 *
 * Lives here rather than in either renderer because **both** of them need it and
 * neither may import the other — `render/strudel.ts` is the only file allowed to
 * know Strudel exists, so `render/midi.ts` cannot reach across for it. It was
 * briefly a `const SWEEP_OCTAVES = 4` in each, which is the arrangement where
 * one of them gets tuned and the audition and the shipped file quietly disagree
 * about what the filter did.
 *
 * Exponential because cutoff is heard logarithmically: halving the hertz is one
 * octave darker wherever you start from, so a linear scale would spend most of
 * its travel in the top octave and do nothing audible at the bottom.
 */
export function sweptCutoff(lowpass: number, brightness: number | undefined): number {
  return Math.round(lowpass * 2 ** (-SWEEP_OCTAVES * (1 - (brightness ?? 1))));
}

/**
 * How long the duck takes to fall, in seconds, and how long it recovers over by
 * default, in beats. See `Effects.duck`.
 *
 * **Ten milliseconds down.** Fixed rather than declared, exactly as
 * `GLIDE_SECONDS` and `PHASER_RATE` are, and for the same reason: a
 * compressor's attack is a knob on a box in milliseconds and knows nothing
 * about the tempo. It is also the smallest number that is not a fault —
 * superdough ramps the orbit's gain with `exponentialRampToValueAtTime`, and
 * Strudel's own `duckonset` documentation demonstrates the zero case as
 * *"clicks"* against 0.01 as *"no clicks"*, because an instantaneous jump in a
 * gain node is a step discontinuity in the waveform. The .mid has the same
 * problem from the other side, where a single expression message between two
 * ticks is as sharp as the file can be.
 *
 * It is short enough to be the gesture. A 909 kick's own transient is over
 * inside 15 ms, so at 10 ms the hole is open before the beater sound has
 * finished — which is what makes the two read as one event rather than as a
 * drum followed by a dip.
 *
 * `DUCK_BEATS` is argued in `Effects.duckBeats`. It is a default rather than a
 * constant because the right value is a ratio to the kick spacing, and that is
 * a property of the figure rather than of the technique.
 */
export const DUCK_ONSET_SECONDS = 0.01;
export const DUCK_BEATS = 0.75;

/**
 * The gain a ducked layer falls to, as an amplitude 0..1, from its depth in dB.
 *
 * Here rather than in either renderer for the reason `sweptCutoff` gives
 * directly above, and the case for it is stronger: the two consumers do not
 * merely need the same *number*, they need the same number expressed in two
 * units that are related by nothing obvious. superdough wants `1 − √depth` to
 * land on this value and MIDI wants `127·√` of it, and if the dB→amplitude step
 * were written twice, the audition and the shipping file would duck by
 * different amounts and nothing would report it.
 *
 * Floored at −40 dB rather than at zero, which is where MIDI's expression
 * controller runs out: the standard curve is `40·log₁₀(cc/127)`, so cc = 1 is
 * about −43 dB and cc = 0 is silence. A duck that asked for silence would be a
 * gate, and a gate is a different gesture with a different name. It is also
 * within a decibel of where superdough stops on its own, since `Orbit.duck`
 * clamps its floor to 0.01.
 *
 * The clamp is a separate exported function rather than an expression inside
 * this one, and that is not tidiness. `render/midi.ts` needs the *depth* and
 * `render/strudel.ts` needs the *floor*, so only one of them can call this —
 * and the renderer that could not would have to either write the bound again or
 * take the depth back out through a logarithm. Both were tried. The second
 * round-trips 9 dB into 8.999999999999998 and moves a handful of controller
 * values by one, which is inaudible and is still two renderers disagreeing
 * about a number they are supposed to share.
 */
export const DUCK_MAX_DB = 40;

export function duckDepthDb(depthDb: number): number {
  return Math.max(0, Math.min(DUCK_MAX_DB, depthDb));
}

export function duckFloor(depthDb: number): number {
  return 10 ** (-duckDepthDb(depthDb) / 20);
}

/**
 * The beats a duck fires on: every kick stroke in the song, in order.
 *
 * **The kick and nothing else.** A sidechain in this repertoire is keyed off
 * the bass drum — that is what the technique is, and it is why the hole in the
 * record lands exactly where the beat is. Reading "whatever is loudest in the
 * bar" was rejected on `Style.breakCarrier`'s finding one level up: a rule that
 * searches for its trigger hands the same style a kick-keyed duck in one song
 * and a clap-keyed one in the next, and the listener hears an inconsistent
 * record rather than a rule.
 *
 * **A roll counts as its strokes, and that is forced rather than chosen.** The
 * audition attaches its duck to the kick's own pattern, where a `DrumEvent.roll`
 * is a nested group and superdough fires the duck once per hap — so three
 * strokes inside a sixteenth trigger three ducks whatever this function thinks.
 * The .mid has no such constraint and would happily duck once, which is exactly
 * the shape of disagreement `sweptCutoff` exists to prevent. So the expansion
 * lives here and both renderers read it.
 *
 * **Velocity is not read**, and the omission is the interesting one, because a
 * real compressor absolutely does duck less on a softer kick. Neither renderer
 * can express that: superdough's `duckdepth` is a per-event constant on the
 * orbit's gain, and matching it in the .mid would mean the audition and the
 * file disagreeing about how deep every ghosted kick goes. It is also what
 * `DrumEvent.roll` decided about level from the other direction — *a step drawn
 * into a machine has one velocity* — and this music's kick is drawn into a
 * machine.
 */
export function kickOnsets(drums: DrumTrack): number[] {
  const out: number[] = [];
  for (const e of drums.events) {
    if (e.voice !== 'bd') continue;
    const strokes = Math.max(1, Math.round(e.roll ?? 1));
    // A sixteenth, in beats — the slot a roll subdivides. See `DrumEvent.roll`.
    for (let k = 0; k < strokes; k++) out.push(e.beat + (k * 0.25) / strokes);
  }
  return out.sort((a, b) => a - b);
}

export function songDurationBeats(song: Song): number {
  return song.meta.totalBars * song.meta.beatsPerBar;
}

/**
 * The same piece, beginning at `fromBar` — everything before it removed and
 * everything after it rebased so that bar becomes bar zero.
 *
 * ## Why this exists rather than a seek
 *
 * Nothing downstream of here can seek. Strudel's scheduler counts cycles from
 * zero at `start()` and the pattern is emitted as `<bar bar bar …>`, so the bar
 * that sounds is decided entirely by *how many cycles have elapsed* — there is
 * no cursor to move. Reaching bar 40 means either running the clock to 40, or
 * handing the scheduler a piece whose bar 40 is its first.
 *
 * The second is what this does, and it is the cheaper claim by a long way. The
 * alternative was writing into `Cyclist.lastEnd` and `num_ticks_since_cps_change`
 * to fake an origin, which works by reading Strudel's source rather than its
 * documented surface, and would have to be re-derived every time that package
 * moves. This needs nothing from Strudel at all: `render/strudel.ts` builds
 * every grid from `Track.notes` indexed by bar and reads only `totalBars`,
 * `beatsPerBar` and `bpm` out of the meta, so a rebased song renders correctly
 * with no renderer change whatsoever.
 *
 * ## Bars rather than beats
 *
 * The unit is deliberate and not a convenience. One cycle is one bar, so a cut
 * anywhere else would land the whole piece off the barline relative to the
 * clock — every subsequent bar a fraction early, which is not a jump but a
 * mistuned transport. It is also the only place anybody wants to jump to.
 *
 * ## What the caller still owes
 *
 * **The position this reports is not the position the piece is at.** A show
 * built round the uncut song — a lighting cue list, a camera plan, a gesture
 * timeline — is indexed by the *original* beat, and a scheduler running the
 * slice reports zero at the cut. Whoever slices has to add the offset back
 * before handing a beat to anything else. See `ConcertTransport.begin`.
 */
export function sliceSong(song: Song, fromBar: number): Song {
  const { beatsPerBar, totalBars } = song.meta;
  const bar = Math.max(0, Math.min(Math.floor(fromBar), totalBars - 1));
  if (bar === 0) return song;
  const from = bar * beatsPerBar;

  /**
   * A note straddling the cut is kept with a shortened head, not dropped.
   *
   * Dropping it is the obvious reading of "everything before this bar" and it
   * is wrong in the ear: the pad writes eight-beat chords, so a cut two beats
   * into one would open the piece with a bar of missing harmony under a melody
   * that expects it. What a listener dropped into bar 40 should hear is the
   * chord that is *sounding* at bar 40, which is this one, for however much of
   * itself is left.
   */
  const tracks = song.tracks.map((track) => ({
    ...track,
    notes: track.notes
      .filter((n) => n.beat + n.duration > from)
      .map((n) => (n.beat >= from
        ? { ...n, beat: n.beat - from }
        : { ...n, beat: 0, duration: n.duration - (from - n.beat) })),
  }));

  // Drums get no such treatment: a stroke is an onset, and an onset before the
  // cut has already happened. Sounding it at bar zero would be inventing a hit.
  const events = song.drums.events
    .filter((e) => e.beat >= from)
    .map((e) => ({ ...e, beat: e.beat - from }));

  const sections = song.sections
    .filter((s) => s.startBar + s.lengthBars > bar)
    .map((s) => (s.startBar >= bar
      ? { ...s, startBar: s.startBar - bar }
      : { ...s, startBar: 0, lengthBars: s.startBar + s.lengthBars - bar }));

  /**
   * The ramp is re-based rather than dropped, and the leading point is the
   * tempo *sounding* at the cut rather than the piece's opening one.
   *
   * Nothing in the audition path reads this — `render/strudel.ts` prints a
   * TEMPO RAMP warning and plays flat at `meta.bpm` — so it would survive being
   * left alone or thrown away. It is done properly because a `Song` is the
   * hand-off point to renderers that do not exist yet, and a slice carrying the
   * original map would tell the next one that a piece cut into its accelerando
   * begins at the tempo it was counted off at.
   */
  const tempo = song.meta.tempo && [
    { beat: 0, bpm: tempoAt(song.meta.tempo, from) },
    ...song.meta.tempo.filter((p) => p.beat > from).map((p) => ({ ...p, beat: p.beat - from })),
  ];

  return {
    ...song,
    meta: {
      ...song.meta,
      totalBars: totalBars - bar,
      ...(tempo ? { tempo } : {}),
      // The count is at the front of the piece or it is nothing. A slice that
      // kept it would have the drummer click four into the middle of a chorus.
      leadInBars: 0,
    },
    sections,
    tracks,
    drums: { ...song.drums, events },
  };
}

/**
 * The piece's tempo, always as a map.
 *
 * The one accessor, and the reason there is one: `meta.tempo` is optional and
 * `meta.bpm` is not, so every consumer that reads the pair itself writes the
 * same three-line fallback — and the third of them writes it slightly
 * differently. `sweptCutoff` a few lines up is here for exactly this reason and
 * says so: two copies of a conversion agree today and drift by the second bug
 * fixed in one of them.
 *
 * The map it fabricates is not stored. That is deliberate rather than lazy: the
 * absence of `meta.tempo` is a fact about the song — *nobody asked this style to
 * ramp* — and materialising a one-entry map onto every song in the catalogue
 * would put an answer on three hundred songs that were not asked, which is the
 * thing `feels`, `transitions` and `drops` each spend a paragraph refusing.
 */
export function songTempo(meta: SongMeta): TempoMap {
  return meta.tempo ?? flatTempo(meta.bpm);
}

/**
 * How long the piece lasts, as written.
 *
 * Through the tempo map rather than `beats / bpm × 60`, which is the same
 * arithmetic for every song that does not ramp and is wrong by up to the whole
 * ramp for one that does — a piece accelerating from 90 to 120 across its length
 * runs about an eighth shorter than its opening tempo claims.
 *
 * **As written** is load-bearing, and it is the one place a caller has to know
 * which renderer it is talking about. The `.mid` lasts this long. The Strudel
 * audition does not: it plays the piece at `meta.bpm` throughout, because
 * Strudel's tempo is one global number — see the note in `render/strudel.ts` —
 * so the audition's wall-clock length is `songDurationBeats / meta.bpm × 60` and
 * is longer. Every caller today wants the written length: `cli.ts` prints the
 * duration of the file it just wrote, and the showbill prints how long the band
 * will be on stage.
 */
export function songDurationSeconds(song: Song): number {
  return secondsAt(songTempo(song.meta), songDurationBeats(song));
}

/**
 * The tempo, for a human — `112`, or `112→148` where it moves.
 *
 * A label rather than a number, because the honest answer for a ramping piece is
 * two numbers and every caller that has one was already printing a string. It
 * keeps the exact current output for a song with no map, so nothing in the
 * catalogue's reports moves.
 *
 * Endpoints where they differ, because that is what an accelerando *is* and an
 * arrow says it in one glyph. Where they agree the piece may still have moved —
 * a drift wanders and comes home — so the extremes are shown in brackets beside
 * the count-off rather than silently averaged away. A label that reads `92` on a
 * piece that spent a minute at 104 is the sort of quiet wrongness this project
 * keeps finding in its own reports.
 */
export function tempoLabel(meta: SongMeta): string {
  const tempo = meta.tempo;
  if (!tempo) return String(meta.bpm);
  const first = tempo[0]!.bpm;
  const last = tempo.at(-1)!.bpm;
  if (first !== last) return `${first}→${last}`;
  const [low, high] = tempoRange(tempo);
  return low === high ? String(first) : `${first} (${low}–${high})`;
}
