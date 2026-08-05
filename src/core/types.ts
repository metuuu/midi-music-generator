/**
 * The Song IR — the hand-off point between "musical decisions" and "how it
 * gets heard".
 *
 * Nothing below this line knows about Strudel, MIDI, or WebAudio. That is the
 * whole point: the generator is MIT-licensed and portable, and Strudel is one
 * interchangeable renderer sitting behind it.
 */

import { flatTempo, secondsAt, tempoRange, type TempoMap } from './grid.js';
import type { Midi } from './pitch.js';
import type { Mode } from './scale.js';
import type { FeelSpan } from '../style/feel.js';
import type { DeliveryId } from '../style/delivery.js';
import type { VoiceSignatureId } from '../style/voices.js';
import type { Seam } from '../generate/transition.js';
import type { DropSpan } from '../generate/drop.js';

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

export type SectionKind = 'intro' | 'verse' | 'chorus' | 'bridge' | 'solo' | 'outro';

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
   * instead is the name a showbill would print — `'drum kit'`, or the drum the
   * chorus was actually written for where that is not a kit: `'darbuka'`,
   * `'congas'`, `'mridangam'`, and `'hand drum'` where nothing named which. A
   * bank name like "LinnDrum" would be wrong in every one of those cases; that
   * is a sample set, not an instrument.
   *
   * The distinction is not pedantry. A *tani āvartanam* is ten minutes of
   * mridangam alone on a stage with no kit anywhere on it, and this field said
   * `'drum kit'` through all of it — see `generateSong`, where the name is
   * resolved from the same read that decides what the chorus is written for.
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
  /** Local mode — choruses frequently lift into the relative major. */
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
 * Per-track effects.
 *
 * These are a *mix* decision rather than a musical one everywhere except
 * ambient, where they are the composition: a Boards of Canada track is a
 * filtered, saturated, reverberant object and the dry notes underneath are not
 * the piece. That is the same argument as "the pad is the piece", and it is why
 * this sits in the IR rather than in a renderer.
 *
 * Only what survives to a real delivery format is expressed here. Two fields
 * are audition-only and say so — a native engine is free to implement them, and
 * MIDI simply has nowhere to put them.
 */
export interface Effects {
  /** Send to the song's reverb, 0..1. MIDI CC91 — GM level 1, universal. */
  reverb?: number;
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
   * How many octaves *below* `lowpass` a note starts before opening up to it,
   * across the note and staying open. **Audition only**, and inert without a
   * `lowpass` to open toward.
   *
   * Written as a distance below rather than above so that the era's `lowpass`
   * stays what it has always been — the brightness this instrument arrives at
   * in this decade — and this field only says how far under it the note begins.
   * The other direction was tried first and is the wrong one: opening *upward*
   * from a cutoff already set at 8 kHz sweeps a range with almost nothing in
   * it, so the gesture is inaudible unless every era table is darkened to make
   * room for it.
   *
   * `NoteEvent.brightness` already says where a note sits in its instrument's
   * range, and the section-long `filter` ramp already says where the section
   * does. Both are decided *before* the note sounds and neither can change
   * anything while it is sounding — so a four-second held chord under a lead
   * is, timbrally, four seconds of nothing happening.
   *
   * This is the third one: the note gets brighter as it is held. On the
   * instrument that matters it was aftertouch — the CS-80 is the only
   * synthesiser of its decade with per-key pressure, and leaning into a held
   * note is why that lead sounds like someone playing rather than someone
   * holding a key down.
   */
  swell?: number;
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
 * The sources an era may actually draw from, weighted, after the year gate.
 *
 * Returns the list rather than the answer so the draw itself happens in
 * `generate/song.ts` alongside every other weighted choice — one `Rng` stream,
 * one place a seed can be traced through.
 *
 * An era that names no sources gets a kit, and so does one whose entire table
 * was gated away. Both fallbacks are deliberate: a kit is what every song in
 * this project staged before this field existed, so the quiet answer is also the
 * backwards-compatible one.
 */
export function eligibleDrumSources(
  year: number,
  weights: readonly (readonly [DrumSource, number])[] | undefined,
): (readonly [DrumSource, number])[] {
  const open = (weights ?? []).filter(
    ([source, weight]) => weight > 0 && year >= DRUM_SOURCE_FROM[source],
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
   * byte-for-byte to what it did before this field existed. That is every style
   * in the catalogue today.
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
   * Absent on any song whose style names no feel table, which is all but two of
   * them: absent means straight throughout and means no draw was made, so a
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
   * Absent on any song whose style names no transition palette, which is all of
   * them today — and absent is the same statement it is for `feels`: the
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
   * Absent on any song whose style names no drop palette, which is all of them
   * today, and absent is the same statement it is for `feels`: the question was
   * never asked, no draw was made, and the song is byte-for-byte what it was.
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
 */
export function melodicLine(track: Track): NoteEvent[] {
  const gap = track.twoHanded?.gap;
  if (gap === undefined) return track.notes;

  if (track.notes.some((n) => n.hand === 'left')) {
    return track.notes.filter((n) => n.hand !== 'left');
  }

  const groups = new Map<number, NoteEvent[]>();
  for (const n of track.notes) {
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

export function songDurationBeats(song: Song): number {
  return song.meta.totalBars * song.meta.beatsPerBar;
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
