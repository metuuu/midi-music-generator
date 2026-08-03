/**
 * The rock catalogue, 1963–1997. Twenty-four styles across four eras.
 *
 * Organised by **what the guitar is doing**, because in this repertoire that is
 * the question every other difference is downstream of. A beat-group guitar
 * plays chords on the beat and gets out of the way of a two-minute song; a hard
 * rock guitar plays a riff that the singer then has to fit around; a jangle
 * guitar plays six strings ringing and never damps anything; an alt guitar plays
 * two things — one very quiet and one very loud — and the arrangement is the
 * distance between them. Sort this music by tempo and you get one long
 * accelerando with a valley in the middle. Sort it by the guitar and the
 * twenty-four below stay twenty-four.
 *
 * ## Three facts run through the whole file
 *
 *  - **The backbeat.** `sd` on slots 4 and 12 — beats two and four — in every
 *    single drum pattern here, and everything else in the kit is decoration on
 *    it. That is not a stylistic tendency, it is a hard property of the table:
 *    the one pattern in the file that moves the snare off two and four is
 *    `halftime`, and it moves it to slot 8, which is beat *three* of a bar being
 *    counted at half speed. It is still the backbeat. A rock drum part with the
 *    snare somewhere else is either a different genre or a mistake, and this is
 *    the thing a tidy-up would most obviously break.
 *  - **The riff is the composition.** Wherever a figure is a *shape* rather than
 *    an outline its notes are spelled as **numbers** — semitones from the chord
 *    root, taken literally. See `BassTone`: the named functions (`third`,
 *    `seventh`) ask the harmony what to play and get a different answer as the
 *    quality changes, which is what a walking line wants and the exact opposite
 *    of what a riff wants. "Smoke on the Water" is the same four intervals over
 *    every chord it meets and that is the entire reason anybody can hum it. A
 *    riff that renegotiates with each chord has stopped being a riff.
 *  - **Nothing swings after 1970.** `swing: 0` on every style from `glam`
 *    onward. The six styles that carry any are the ones descended from the
 *    twelve-bar — `beat`, `bluesrock`, `boogie`, `southern`, `surf` and
 *    `garage` — where the shuffle between the drummer's two hands is the
 *    subject, and even there it is light: 0.3 at the most, against jazz's
 *    tables, because a British group in 1964 was copying a shuffle off a record
 *    rather than playing one.
 *
 * ## What is uniform across the file, and why each is a decision
 *
 *  - **`relativeMajorChorus: 0` everywhere.** The lift from i to III is a
 *    dance-band arranger's gesture and there is no arranger here. A rock chorus
 *    does not go somewhere brighter, it goes somewhere *louder*, and the whole
 *    machinery for that — density, the drummer opening the hats, the second
 *    guitar arriving — is already in the arrangement rather than in the key.
 *  - **`vary` is small and never absent.** Between 0.05 and 0.15 on bass and
 *    comp. Reggae refuses the field outright and iskelmä does too, both for the
 *    same reason: the figure is what the floor is counting from. Rock is not
 *    that. A rhythm guitarist absolutely does play the last bar of the verse
 *    differently — that is where the fill is answered — and a bass player leans
 *    on the octave going into the chorus. What rock does not do is *develop*,
 *    so the number stays low: at 0.3 the band sounds like it is auditioning.
 *  - **No `shots` table anywhere, and that is the interesting absence.** Reggae
 *    writes one on all twenty-two of its styles because the derived default is
 *    the group heads — slots 0, 4, 8, 12 — which are the four beats that genre
 *    is organised around *not* playing. Here the derivation is simply right. The
 *    whole band hitting beat one together, and then the same figure with the
 *    last hit pulled an eighth early, is what a rock band does at a seam; it is
 *    the sound of the stop before the last chorus. Two genres, one derivation,
 *    opposite verdicts, and both are about where beat one is.
 *  - **`boxDrums` is not set on any style, and it would be noise if it were.**
 *    The field decides whether a preset rhythm box may play a style at all. No
 *    era in `eras.ts` names `box` in its `drumSources` — a machine with fourteen
 *    buttons on it marked *Bossa Nova* is not a thing any rock band has ever had
 *    on stage, and the eras say so once — so a style setting the flag would be
 *    forbidding something that cannot happen. Saying it twice is how the second
 *    statement rots.
 *
 * ## The power chord, which this file cannot spell
 *
 * The object every guitar below is actually playing is a root and a fifth with
 * **no third in it**, and there is no way to write that down here. `voices: 2`
 * on a `CompPattern` does not produce it: `chooseTones` drops the fifth first —
 * correctly, for an arranger, since the fifth is implied by the root and carries
 * no information — so two voices of a triad are the root and the *third*, which
 * is precisely the note a power chord exists to omit. `sus4` and `sus2` are the
 * only third-less qualities in `ChordQuality` and both add a note the chord does
 * not have.
 *
 * So every comp below is a three-voice triad, and the compensation is register
 * rather than spelling: `layerPlan.offsets` in `index.ts` puts the comp low and
 * the genre's `effects` roll the top off it, which is what a barre chord through
 * an overdriven amplifier sounds like — the third is in there, it is just an
 * octave below where a piano would put it and buried under the fifth. That is
 * the closest this engine gets, and it is close enough that the difference is
 * audible only on the two or three styles where the missing third is the point.
 * `stoner` and `riff` are those styles. See the report; it is the one thing in
 * this genre that wants a change nothing here could make.
 *
 * ## Eight styles override `scaleForChord`, and the count is the claim
 *
 * The genre follows the key — see `index.ts`, which argues it at length. Eight
 * styles here say something different about themselves: their tune is a *riff*
 * rather than a *song*, and a riff in this music is five notes. The override is
 * `pentatonicLead` below and the styles that take it are the blues-descended
 * ones: `bluesrock`, `boogie`, `hard`, `riff`, `southern`, `stoner`, `grunge`
 * and `garage`. Everything else — the beat groups, the jangle, the ballad, the
 * new wave, the prog — has a sung melody that follows the key, which is what a
 * song does.
 *
 * A third of the catalogue is a large fraction for a field whose own doc says it
 * should be rare, and the honest defence is that this is the genre where it is
 * *true* rather than the genre where the discipline slipped. Jazz has one blues
 * style and funk has one jazz-funk style because in those repertoires the
 * exception is one corner. In rock the exception is the guitar solo, the riff
 * and the entire British blues boom, and pretending it was one style would put a
 * diatonic melody over "Whole Lotta Love".
 */

import type { BassPattern, CompPattern, DrumPattern, Style } from '../../style/types.js';
import type { Chord } from '../../core/chord.js';
import type { Pc } from '../../core/pitch.js';
import { makeScale, type Mode, type Scale } from '../../core/scale.js';

// ---------------------------------------------------------------------------
// The blues overlay
// ---------------------------------------------------------------------------

/**
 * The tonic minor pentatonic, dragged across whatever the changes are doing, in
 * major keys and in minor keys alike.
 *
 * **This is the flat third over a major chord**, which is wrong by every rule in
 * `core/rules.ts` and is the sound of the entire genre. It is worth being exact
 * about what is being claimed, because the obvious reading of it is a bug:
 *
 *   C major song, the guitar solo is in C minor pentatonic — C E♭ F G B♭ — and
 *   the chord underneath it for most of the record is C E G.
 *
 * That E♭ against that E is a semitone, held, on a beat. `semitone-clash` is
 * about it, `unprepared-dissonance` is about how the line got there,
 * `non-chord-tone-on-strong-beat` is about where it landed, and `chromatic-tone`
 * is about it existing. Four rules, each correct, and between them they describe
 * a blues.
 *
 * The genre disables or softens all four (see `ruleOverrides` in `index.ts`),
 * and that alone is not the answer — turning rules off produces permission
 * rather than a language. What makes this a language is the *scale*, and there
 * are three things about it worth reading twice:
 *
 *  1. **It does not know what mode the song is in.** `mode` is a parameter this
 *     function ignores, and that is the whole point rather than laziness. The
 *     same five notes sit over a major I and a minor i, which is exactly why a
 *     ♭3 lands on a major chord: the blues scale was never a mode of the key, it
 *     is a fixed object the key is played *through*. A version of this that
 *     returned `majorPentatonic` in major would produce a country record.
 *  2. **It does not know what chord is underneath it either.** `chord` is
 *     likewise unread. This is the same claim jazz's `blues` style makes — the
 *     field's own doc names it — and it is the opposite of what the rest of this
 *     genre does. A line that re-orients onto each chord over a twelve-bar is a
 *     bebop line over blues changes, which is a real and different music that
 *     already lives in `jazz/`.
 *  3. **The engine takes the ♮3 away by itself**, which is the part that makes
 *     this work rather than merely permit it. `skeletonFor` intersects the
 *     chord's tones with the prevailing scale before choosing the structural
 *     notes of a phrase, with a floor of two distinct pitch classes. A C major
 *     triad against C minor pentatonic intersects to {C, G} — two, so the filter
 *     holds — and the tune's anchors become the root and the fifth, with the ♭3
 *     and the ♭7 arriving as the notes that connect them. That is a blues line
 *     described exactly, and it is not something this table could have produced
 *     on its own: `skeleton.ts` records that the jazz blues still had a ♮3 on
 *     17.2% of its melody notes over I7 before that filter existed, 82% of them
 *     on a beat, *because the major third is a chord tone*.
 *
 * `bluesrock` takes a different scale for a reason argued at that style. Nothing
 * else here does.
 */
const pentatonicLead = (tonic: Pc, _mode: Mode, _chord: Chord): Scale =>
  makeScale(tonic, 'minorPentatonic');

// ---------------------------------------------------------------------------
// The kit
// ---------------------------------------------------------------------------

/**
 * The backbeat: kick on one and the and-of-three, snare on two and four, hats in
 * eighths.
 *
 * Every rock drum pattern in this file is a variation on these three rows and
 * most of them are this one. The kick's second note is at slot 10 rather than 8,
 * and that one slot is most of what separates a rock beat from everything else
 * in this project: a kick on slot 8 states beat three, which is a second
 * downbeat, and a kick on slot 10 *pushes* into beat four. Ringo, Charlie Watts
 * and Bonham all put it there. A generator that put it on 8 would produce a
 * march.
 */
const backbeat = (weight: number): DrumPattern => ({
  name: 'backbeat', weight,
  voices: {
    bd: [0, 10],
    sd: [4, 12],
    hh: [0, 2, 4, 6, 8, 10, 12, 14],
  },
});

/**
 * The same with the hats open on the offbeats.
 *
 * A drummer letting the hi-hat breathe on the "and" is the loudest thing a rock
 * kit can do without changing what it is playing, and it is how a chorus arrives
 * on half the records in this file. Written as its own pattern rather than as a
 * variation because `planKitVariation` opens hats as a *gesture* at phrase ends;
 * this is a band that plays the whole song this way.
 */
const backbeatOpen = (weight: number): DrumPattern => ({
  name: 'backbeat-open', weight,
  voices: {
    bd: [0, 10],
    sd: [4, 12],
    hh: [0, 4, 8, 12],
    oh: [2, 6, 10, 14],
  },
});

/**
 * Sixteenths on the hat under the same backbeat.
 *
 * The arena drummer's default from about 1978, and it is a fact about
 * *microphones* rather than about taste: once the hi-hat has its own condenser a
 * sixteenth pattern reads as a shimmer rather than as clatter, and every record
 * of that decade has one. On a 1964 four-track bleeding through a room mic the
 * same part is mud, which is why `beat` and `garage` do not have it.
 */
const backbeatSixteens = (weight: number): DrumPattern => ({
  name: 'backbeat-16', weight,
  voices: {
    bd: [0, 10],
    sd: [4, 12],
    hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  },
});

/**
 * Four on the floor, with the backbeat still on top of it.
 *
 * Not a disco beat, and the difference is that the snare stays. Glam, and then
 * every stadium chorus after 1975: the kick on all four is what makes a room of
 * twenty thousand people clap in the right place, and the snare on two and four
 * is what stops it being a dance record.
 */
const fourOnFloor = (weight: number): DrumPattern => ({
  name: 'four-on-floor', weight,
  voices: {
    bd: [0, 4, 8, 12],
    sd: [4, 12],
    hh: [0, 2, 4, 6, 8, 10, 12, 14],
  },
});

/**
 * Half time: the snare on slot 8 and nowhere else.
 *
 * The one pattern here that appears to break the backbeat rule and does not. The
 * bar is being counted at half speed, so slot 8 is beat *two* of the bar the
 * drummer thinks they are in, and the effect is that everything above it doubles
 * in weight without anything having got faster. It is the grunge chorus, the
 * stoner verse, and the four bars before the last chorus of a power ballad.
 */
const halftime = (weight: number): DrumPattern => ({
  name: 'halftime', weight,
  voices: {
    bd: [0, 6, 11],
    sd: [8],
    hh: [0, 2, 4, 6, 8, 10, 12, 14],
  },
});

/**
 * The train: eighths on the snare and the kick underneath.
 *
 * Punk, and the two-minute end of the beat era. Nothing is decorated, nothing is
 * open, and the hi-hat is being hit as hard as the snare because the drummer's
 * right arm is not doing anything else. `cr` on the downbeat of the pattern
 * rather than as a fill, because that is genuinely how these records sound — the
 * crash is part of the beat and not an announcement.
 */
const trainBeat = (weight: number): DrumPattern => ({
  name: 'train', weight,
  voices: {
    bd: [0, 8],
    sd: [4, 12],
    hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    cr: [0],
  },
});

/**
 * The shuffle, written as a straight pattern and swung by `Style.swing`.
 *
 * Ride rather than hats, because a shuffle is played on a ride or on a
 * half-open hat and never on a closed one — the whole character is the ring
 * between the two strokes, and a closed hat has no ring to give.
 */
const shuffleKit = (weight: number): DrumPattern => ({
  name: 'shuffle', weight,
  voices: {
    bd: [0, 8],
    sd: [4, 12],
    rd: [0, 2, 4, 6, 8, 10, 12, 14],
  },
});

/**
 * The backbeat with a tambourine on it, which is the beat era's one signature.
 *
 * `tb` was not a voice this project had until recently and its absence was
 * loudest exactly here: a British single from 1964 has a tambourine doubling the
 * snare on two and four on roughly every other track, played by whoever was not
 * singing, and written on `sh` it came out as a dry rush with no metal in it.
 * The jingles are the reason those records sound bright on a transistor radio.
 */
const tambourineBeat = (weight: number): DrumPattern => ({
  name: 'tambourine-backbeat', weight,
  voices: {
    bd: [0, 10],
    sd: [4, 12],
    tb: [4, 12],
    hh: [0, 2, 4, 6, 8, 10, 12, 14],
  },
});

// ---------------------------------------------------------------------------
// The bass
// ---------------------------------------------------------------------------

/**
 * Eighth notes on the root, all the way through.
 *
 * The least interesting bass part in the project and one of the most important.
 * Punk, new wave, motorik and half of hard rock are a bass player refusing to do
 * anything at all for three minutes, and the refusal is the part: it is what
 * lets the guitar's riff be the only moving object in the bar. `tone: 0` rather
 * than `'root'` because the two are identical here and the number says what is
 * meant — this figure is not outlining anything.
 */
const rootEights = (weight: number): BassPattern => ({
  name: 'root-eights', weight,
  hits: [
    { at: 0, dur: 2, tone: 0, vel: 0.98 },
    { at: 2, dur: 2, tone: 0, vel: 0.8 },
    { at: 4, dur: 2, tone: 0, vel: 0.86 },
    { at: 6, dur: 2, tone: 0, vel: 0.8 },
    { at: 8, dur: 2, tone: 0, vel: 0.92 },
    { at: 10, dur: 2, tone: 0, vel: 0.8 },
    { at: 12, dur: 2, tone: 0, vel: 0.86 },
    { at: 14, dur: 2, tone: 0, vel: 0.8 },
  ],
});

/**
 * Root and octave, alternating — the oldest bass figure in popular music and
 * still the commonest one here.
 *
 * `12` rather than `'octave'`, and the difference shows up on the two or three
 * bars a song spends on a seventh chord: `octave` is the chord's own root an
 * octave up whatever the quality, which is the same note, so here the two agree
 * — but the figure sitting next to it in most of these styles is `[0, 7, 12]`,
 * and *that* one differs the moment a chord has an altered fifth. Spelling the
 * whole family in numbers keeps them one family.
 */
const rootOctave = (weight: number): BassPattern => ({
  name: 'root-octave', weight,
  hits: [
    { at: 0, dur: 4, tone: 0, vel: 0.98 },
    { at: 4, dur: 4, tone: 12, vel: 0.84 },
    { at: 8, dur: 4, tone: 0, vel: 0.92 },
    { at: 12, dur: 4, tone: 12, vel: 0.84 },
  ],
});

/**
 * The driving root with the octave pushed an eighth early into beats two and
 * four.
 *
 * What a bass player does when the drummer has gone to sixteenths and there is
 * no room left to be busy in: keep the root and put one note somewhere the kit
 * is not. Arena rock's default.
 */
const pushedRoot = (weight: number): BassPattern => ({
  name: 'pushed-root', weight,
  hits: [
    { at: 0, dur: 3, tone: 0, vel: 0.98 },
    { at: 3, dur: 1, tone: 12, vel: 0.72 },
    { at: 4, dur: 4, tone: 0, vel: 0.86 },
    { at: 8, dur: 3, tone: 0, vel: 0.94 },
    { at: 11, dur: 1, tone: 12, vel: 0.72 },
    { at: 12, dur: 4, tone: 0, vel: 0.86 },
  ],
});

/**
 * The boogie figure: root, fifth, sixth, fifth, in eighths.
 *
 * Chuck Berry's left hand, and then everybody's. Written in numbers because it
 * is a *shape* — a hand moving between two frets on one string — and the sixth
 * is a sixth whatever the chord under it is doing. Asked for as `'fifth'` and
 * `'seventh'` it would turn into a major sixth over one chord and a minor
 * seventh over another, and the hand would be moving different distances in
 * different bars, which is not what a hand does.
 */
const boogieShuffle = (weight: number): BassPattern => ({
  name: 'boogie', weight,
  hits: [
    { at: 0, dur: 2, tone: 0, vel: 0.98 },
    { at: 2, dur: 2, tone: 7, vel: 0.82 },
    { at: 4, dur: 2, tone: 9, vel: 0.88 },
    { at: 6, dur: 2, tone: 7, vel: 0.8 },
    { at: 8, dur: 2, tone: 0, vel: 0.94 },
    { at: 10, dur: 2, tone: 7, vel: 0.82 },
    { at: 12, dur: 2, tone: 9, vel: 0.88 },
    { at: 14, dur: 2, tone: 7, vel: 0.8 },
  ],
});

/**
 * The pentatonic riff, played by the bass and the guitar together.
 *
 * Root, ♭3, 4, root, ♭7 below — the four notes of a minor pentatonic in the one
 * order everybody plays them in, and the last one is *under* the root rather
 * than above it because that is where a hand goes on a fingerboard. Numbers
 * throughout: `-2` is a flat seventh below a major chord as readily as below a
 * minor one, which is what makes this a riff rather than an arpeggio.
 */
const pentatonicRiff = (weight: number): BassPattern => ({
  name: 'pentatonic-riff', weight,
  hits: [
    { at: 0, dur: 3, tone: 0, vel: 0.98 },
    { at: 3, dur: 1, tone: 3, vel: 0.76 },
    { at: 4, dur: 2, tone: 5, vel: 0.9 },
    { at: 8, dur: 2, tone: 0, vel: 0.94 },
    { at: 11, dur: 1, tone: -2, vel: 0.78 },
    { at: 12, dur: 4, tone: 0, vel: 0.88 },
  ],
});

/**
 * The heavy riff: two hits on the root, the ♭5 slid through, and the fifth.
 *
 * The tritone is the point and it is the one interval this genre gets to use
 * that the rule table forbids outright in a melody — `tritone-leap` vetoes it
 * from strictness 1 upward, and correctly, for a line. A bass *figure* is not
 * governed by those rules at all: `generateBass` reads the table literally. So
 * the flattened fifth arrives in the one part of the arrangement that can carry
 * it, which is exactly where Black Sabbath put it in February 1970.
 */
const tritoneRiff = (weight: number): BassPattern => ({
  name: 'tritone-riff', weight,
  hits: [
    { at: 0, dur: 4, tone: 0, vel: 0.98 },
    { at: 6, dur: 2, tone: 0, vel: 0.86 },
    { at: 8, dur: 4, tone: 6, vel: 0.9 },
    { at: 12, dur: 4, tone: 7, vel: 0.92 },
  ],
});

/**
 * Whole notes. The bass holds the root and does nothing else.
 *
 * Shoegaze, the quiet half of an alt verse, and the first sixteen bars of every
 * power ballad. `sustain: true` so that two bars of one chord are one note
 * rather than two — the same mechanism ambient's drone uses and wanted for the
 * same reason. Re-attacking on every downbeat is a pulse, and what this part is
 * for is having no pulse in it.
 */
const heldRoot = (weight: number): BassPattern => ({
  name: 'held-root', weight, sustain: true,
  hits: [
    { at: 0, dur: 16, tone: 0, vel: 0.9 },
  ],
});

/**
 * The melodic bass: root, fifth, ♭7, octave, walking up the shape rather than
 * through the chord.
 *
 * Post-punk, where the bass is the lead instrument and the guitar is a texture
 * on top of it — the one place in this genre where the arrangement is upside
 * down. Still numbers, because the figure is a shape: a post-punk bass line is
 * a riff played high on the neck with a plectrum, not a walking line.
 */
const melodicBass = (weight: number): BassPattern => ({
  name: 'melodic-bass', weight,
  hits: [
    { at: 0, dur: 2, tone: 0, vel: 0.98 },
    { at: 2, dur: 2, tone: 0, vel: 0.78 },
    { at: 4, dur: 2, tone: 7, vel: 0.9 },
    { at: 6, dur: 2, tone: 10, vel: 0.82 },
    { at: 8, dur: 2, tone: 12, vel: 0.92 },
    { at: 10, dur: 2, tone: 10, vel: 0.8 },
    { at: 12, dur: 4, tone: 7, vel: 0.86 },
  ],
});

// ---------------------------------------------------------------------------
// The guitar
// ---------------------------------------------------------------------------

/**
 * One chord per bar, struck on the downbeat and left to ring.
 *
 * Three voices, for the reason given at the top of the file: a power chord
 * cannot be written down here, and a three-note triad voiced low with the top
 * rolled off is the nearest thing. `dur: 16` so the amplifier is still sounding
 * when the next bar arrives, which is what an overdriven valve amp does and what
 * separates this from a piano playing the same chord.
 */
const ringingChord = (weight: number, voices = 3): CompPattern => ({
  name: 'ring', weight, voices,
  hits: [{ at: 0, dur: 16, vel: 0.94 }],
});

/**
 * Eighth-note downstrokes, all of them, at the same weight.
 *
 * The single most characteristic right hand in the genre and the one that is
 * hardest to believe written down: eight identical chords a bar for three
 * minutes. What makes it a part rather than a drone is that the *hand* is going
 * down every time — an up-stroke would be lighter and the pattern would breathe
 * — so the velocities are deliberately almost flat, at 0.9 and 0.86, rather than
 * shaped the way every other comp figure in this project is.
 */
const downstrokes = (weight: number, voices = 3): CompPattern => ({
  name: 'downstrokes', weight, voices,
  hits: [
    { at: 0, dur: 2, vel: 0.94 }, { at: 2, dur: 2, vel: 0.9 },
    { at: 4, dur: 2, vel: 0.9 }, { at: 6, dur: 2, vel: 0.86 },
    { at: 8, dur: 2, vel: 0.92 }, { at: 10, dur: 2, vel: 0.9 },
    { at: 12, dur: 2, vel: 0.9 }, { at: 14, dur: 2, vel: 0.86 },
  ],
});

/**
 * The chug: the chord struck on the beat and damped, with the palm still on the
 * strings between hits.
 *
 * `dur: 1` is the whole of the articulation — a sixteenth of chord and then the
 * heel of the hand — and it is the difference between a rhythm guitar and a
 * rhythm section. Muted eighths under a riff is what the second guitarist plays
 * when the first one is doing something interesting.
 */
const chug = (weight: number, voices = 3): CompPattern => ({
  name: 'chug', weight, voices,
  hits: [
    { at: 0, dur: 1, vel: 0.96 }, { at: 2, dur: 1, vel: 0.76 },
    { at: 4, dur: 1, vel: 0.88 }, { at: 6, dur: 1, vel: 0.76 },
    { at: 8, dur: 1, vel: 0.94 }, { at: 10, dur: 1, vel: 0.76 },
    { at: 12, dur: 1, vel: 0.88 }, { at: 14, dur: 1, vel: 0.76 },
  ],
});

/**
 * The stomp: two and four, hard, held.
 *
 * Glam, and the chorus of anything that wants a crowd in it. The guitar landing
 * with the snare rather than around it means there is nothing at all in the
 * offbeats, and a bar with a hole that size in it is one an audience fills by
 * clapping — which is exactly what those records were engineered to produce.
 */
const stomp = (weight: number, voices = 3): CompPattern => ({
  name: 'stomp', weight, voices,
  hits: [
    { at: 4, dur: 3, vel: 0.98 },
    { at: 12, dur: 3, vel: 0.96 },
  ],
});

/**
 * The jangle: a six-string chord picked as an arpeggio, running continuously.
 *
 * `arpeggio: true` with `updown`, which is the important half — a straight
 * upward walk through a voicing produces very nearly the same contour bar after
 * bar, because voicings are led to move as little as possible. Up and back makes
 * the ladder longer than the voicing, so a figure whose step count already
 * disagrees with the bar takes three times as long to come round. That drift is
 * what a twelve-string played with a plectrum actually sounds like and it is not
 * something a fixed shape produces.
 */
const jangleArp = (weight: number): CompPattern => ({
  name: 'jangle', weight, voices: 4,
  arpeggio: true, arpDirection: 'updown',
  hits: [
    { at: 0, dur: 2, vel: 0.9 }, { at: 2, dur: 2, vel: 0.72 },
    { at: 4, dur: 2, vel: 0.84 }, { at: 6, dur: 2, vel: 0.72 },
    { at: 8, dur: 2, vel: 0.88 }, { at: 10, dur: 2, vel: 0.72 },
    { at: 12, dur: 2, vel: 0.84 }, { at: 14, dur: 2, vel: 0.72 },
  ],
});

/**
 * Two chords a bar, on one and three, held for a half note each.
 *
 * The organ part, and the beat group's rhythm guitar before anybody thought of
 * anything better to do. Deliberately the plainest figure in the file.
 */
const halfNotes = (weight: number, voices = 3): CompPattern => ({
  name: 'half-notes', weight, voices,
  hits: [
    { at: 0, dur: 8, vel: 0.94 },
    { at: 8, dur: 8, vel: 0.88 },
  ],
});

/**
 * The swell: one chord, the whole bar, sustained across the barline where the
 * harmony has not moved.
 *
 * A wall of guitars is not a busy part. Six overdubbed tracks of a strummed
 * chord read as *one held object* and the individual strums vanish into it, so
 * the honest way to write shoegaze is a whole note that never re-attacks —
 * exactly as ambient's pad does, and for the identical reason.
 */
const wall = (weight: number, voices = 4): CompPattern => ({
  name: 'wall', weight, voices, sustain: true,
  hits: [{ at: 0, dur: 16, vel: 0.86 }],
});

// ---------------------------------------------------------------------------
// 1963–67: the beat group
// ---------------------------------------------------------------------------

/**
 * BEAT — the British invasion. Two guitars, a bass, a drummer and two minutes.
 *
 * The constraint that produced this music is worth stating because everything
 * else in the style follows from it: a single had to be under two minutes forty
 * to get played, and a beat group had four people and two amplifiers in a van.
 * There is no room for a solo section longer than eight bars, no room for a
 * second idea, and no room for anybody to sit out. So the arrangement is the
 * whole band playing the whole time, the interest is entirely in the tune, and
 * the record is over before the tune has been stated three times.
 *
 * The one place it spends anything is the harmony. `vi` and `iii` are in these
 * tables at real weight, which is not true of anything else in this file: a beat
 * group was a skiffle band that had heard the Brill Building, and the minor sixth
 * chord in the middle of a major verse is the single audible thing separating
 * these records from the American ones they were copying.
 *
 * `swing: 0.14` — light, and it is the shuffle they were copying rather than one
 * they had. It disappears entirely by 1967.
 */
const beat: Style = {
  id: 'beat',
  label: 'Beat',
  description:
    'Two guitars, a bass and a drummer, at two and a half minutes: chords on the beat, a tambourine on the backbeat, and the whole band playing all of it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [126, 152],
  swing: 0.14,
  modeWeights: { minor: 0.25, major: 0.75 },
  relativeMajorChorus: 0,
  vary: { bass: 0.08, comp: 0.12 },
  progressions: {
    verse: [
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'IV', 'V'], weight: 5, note: 'The four chords the whole decade is built on, and the vi is the British part — an American group in 1962 would have written ii' },
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 4 },
      { chords: ['I', 'iii', 'IV', 'V', 'I', 'iii', 'IV', 'IV'], weight: 3 },
      { chords: ['I', 'I', 'vi', 'vi', 'ii', 'ii', 'V', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'V', 'IV', 'I', 'IV', 'V', 'I'], weight: 4 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 3 },
    ],
    bridge: [
      { chords: ['IV', 'IV', 'ii', 'ii', 'V', 'V', 'V', 'V'], weight: 4 },
      { chords: ['vi', 'iii', 'IV', 'I', 'vi', 'iii', 'V', 'V'], weight: 3 },
    ],
    outro: [
      { chords: ['IV', 'V', 'I', 'I'], weight: 4 },
      { chords: ['I', 'IV', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'III', 'VII'], weight: 4, note: 'Round and round, and no dominant anywhere in it — the beat group learned this shape off a folk record rather than out of a harmony book' },
      { chords: ['i', 'i', 'iv', 'iv', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['III', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [6, 2, 8], weight: 2 },
    { cell: [-2, 2, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
    { cell: [-4, 12], weight: 2 },
  ],
  bass: [rootOctave(6), rootEights(3), boogieShuffle(2)],
  comp: [halfNotes(5), ringingChord(4), downstrokes(3)],
  drums: [tambourineBeat(6), backbeat(4), shuffleKit(2)],
  melody: { leap: 0.3, ornament: 0.22, span: 12, sequence: 0.55, syncopation: 0.3 },
};

/**
 * GARAGE — 1966, and the first music in this file that is trying to be worse.
 *
 * A hundred American groups with a Vox organ, a fuzz box and one idea, none of
 * whom could play what the beat groups were playing and most of whom sound
 * better for it. The harmony collapses to three chords or two; the fuzz box
 * means the guitar has no dynamic range at all, so the arrangement cannot get
 * quieter and does not try; and the organ is doing what the second guitarist
 * would have done if there had been one.
 *
 * This is the first style here to take `pentatonicLead`, and it is the earliest
 * point in the genre where the claim is true. A beat group's singer sings the
 * key. A garage singer shouts five notes, and the organ solo in the middle
 * eight is five notes with the fuzz box on.
 *
 * `excludeLayers: ['pad']` — there is nothing sustained in this music at all.
 * The organ is the comp instrument, being hit; a pad behind it would be a string
 * section on a record made in an afternoon for eighty dollars.
 */
const garage: Style = {
  id: 'garage',
  label: 'Garage',
  description:
    'Fuzz box, Vox organ, three chords and a shout. Nothing sustains, nothing gets quieter, and the solo is five notes.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [138, 166],
  swing: 0.1,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  vary: { bass: 0.06, comp: 0.08 },
  excludeLayers: ['pad'],
  scaleForChord: pentatonicLead,
  progressions: {
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'V', 'V', 'IV', 'IV'], weight: 5, note: 'Up and back down, and it never gets home — the "Louie Louie" shape, which is a loop rather than a cadence' },
      { chords: ['I', 'bVII', 'IV', 'I', 'I', 'bVII', 'IV', 'I'], weight: 4 },
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'IV', 'V', 'V'], weight: 5 },
      { chords: ['bVII', 'bVII', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    outro: [
      { chords: ['I', 'bVII', 'IV', 'I'], weight: 4 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['i', 'VII', 'i', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 3 },
    { cell: [-8, 8], weight: 2 },
  ],
  bass: [rootEights(6), rootOctave(3), pentatonicRiff(2)],
  comp: [downstrokes(6), ringingChord(3), chug(2)],
  drums: [backbeat(6), tambourineBeat(3), trainBeat(2)],
  melody: { leap: 0.28, ornament: 0.14, span: 10, sequence: 0.6, syncopation: 0.3 },
};

/**
 * SURF — instrumental, reverberant, and in a minor key, which is the odd fact
 * about it.
 *
 * Nothing else in California in 1963 was in a minor key. Surf is, more often
 * than not, and the reason is that Dick Dale's family was Lebanese and what he
 * was playing on that Stratocaster was a *taqsim* — fast repeated picking on one
 * note, a scale with a flat second in it, and a melody that goes up rather than
 * a chord sequence that goes round. The rest of the genre heard the reverb and
 * the tremolo picking and copied those instead.
 *
 * `excludeLayers: ['vocal']` is the definition rather than an omission. A surf
 * record with a singer on it is a Beach Boys record, which is a different and
 * much better documented thing; this style is the one where the guitar has the
 * tune because there is nobody else to have it.
 *
 * The melody `span` is the widest in the file at 19 semitones and `ornament` the
 * highest at 0.45, both because the part is a *guitar line* rather than a sung
 * one — it runs down a whole neck, and the tremolo picking is what `ornament`
 * produces at that setting.
 */
const surf: Style = {
  id: 'surf',
  label: 'Surf',
  description:
    'Instrumental, drenched in spring reverb, tremolo-picked and usually in minor: the guitar has the tune because there is nobody else to have it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [152, 182],
  swing: 0.08,
  modeWeights: { minor: 0.7, major: 0.3 },
  relativeMajorChorus: 0,
  vary: { bass: 0.08, comp: 0.1 },
  excludeLayers: ['vocal'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['i', 'bII', 'i', 'bII', 'i', 'bII', 'VII', 'VII'], weight: 4, note: 'The flat second, which arrived here from Beirut rather than from Bakersfield and is the one chord that makes this style sound like itself' },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['bII', 'bII', 'i', 'i'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 5 },
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'IV', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'I'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 8], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [1, 1, 2, 4, 8], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [4, 4, 8], weight: 2 },
  ],
  bass: [rootEights(6), rootOctave(4), boogieShuffle(2)],
  comp: [downstrokes(5), chug(4), halfNotes(2)],
  drums: [backbeat(5), trainBeat(4), tambourineBeat(2)],
  melody: { leap: 0.36, ornament: 0.45, span: 19, sequence: 0.5, syncopation: 0.25 },
};

/**
 * JANGLE — a twelve-string with a plectrum, and nothing damped.
 *
 * The one style here that belongs to two eras thirty years apart and is the same
 * style in both. A Rickenbacker 360/12 through a compressor in 1965 and the same
 * guitar through the same compressor in 1985 produce an identical object: six
 * pairs of strings, the upper one of each pair tuned an octave above, all of them
 * ringing at once, and a right hand that never stops. The intervening two decades
 * happened to other people.
 *
 * `jangleArp` is the whole style and it is the only place in this genre where a
 * comp is an arpeggio rather than a chord. That is a real claim about the
 * instrument rather than a texture preference: a twelve-string strummed sounds
 * like a chord, and a twelve-string *picked* sounds like eight separate notes
 * arriving at slightly different times, which is what the doubled strings are
 * for. `arpOctaves` stays at 1 — the octave jump is a sequencer's signature and
 * this is a hand.
 *
 * `ii` and `vi` at weight in the tables, because this is the one corner of the
 * genre that never stopped being pop.
 */
const jangle: Style = {
  id: 'jangle',
  label: 'Jangle',
  description:
    'A twelve-string picked rather than strummed, nothing damped, and a chord sequence that goes somewhere: the one part of this genre that stayed pop.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [116, 146],
  swing: 0,
  modeWeights: { minor: 0.3, major: 0.7 },
  relativeMajorChorus: 0,
  vary: { bass: 0.1, comp: 0.15 },
  progressions: {
    verse: [
      { chords: ['I', 'I', 'ii', 'ii', 'IV', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'IV'], weight: 4 },
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V'], weight: 4, note: 'Starting on the relative minor and never resolving to it. Half of American college radio between 1983 and 1990 is this eight bars' },
      { chords: ['I', 'bVII', 'IV', 'I', 'I', 'bVII', 'IV', 'IV'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'I', 'vi', 'IV', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'vi', 'V', 'I', 'IV', 'V', 'V'], weight: 4 },
      { chords: ['ii', 'IV', 'I', 'I', 'ii', 'IV', 'V', 'V'], weight: 3 },
    ],
    bridge: [
      { chords: ['vi', 'vi', 'iii', 'iii', 'IV', 'IV', 'V', 'V'], weight: 4 },
    ],
    outro: [
      { chords: ['IV', 'I', 'IV', 'I'], weight: 4 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VI'], weight: 5 },
      { chords: ['i', 'i', 'III', 'III', 'VII', 'VII', 'iv', 'iv'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'III', 'VII', 'i', 'VI', 'III', 'VII', 'VII'], weight: 4 },
      { chords: ['iv', 'VI', 'i', 'i', 'iv', 'VI', 'VII', 'VII'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [-2, 2, 4, 8], weight: 3 },
    { cell: [8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [rootOctave(6), rootEights(4), melodicBass(2)],
  comp: [jangleArp(6), ringingChord(3), halfNotes(2)],
  drums: [backbeat(6), tambourineBeat(4), backbeatOpen(2)],
  melody: { leap: 0.3, ornament: 0.25, span: 13, sequence: 0.5, syncopation: 0.35 },
};

// ---------------------------------------------------------------------------
// The blues, arriving in England: 1966–75
// ---------------------------------------------------------------------------

/**
 * BLUES ROCK — the twelve-bar, played loud by people who learned it off records.
 *
 * `chorusBars: 12`, which rewrites every section of every form to twelve bars
 * and folds any bridge back into the verse. That is the correct violence: a
 * twelve-bar has no bridge, every chorus is the same twelve bars, and a
 * verse/chorus template imposed on it would produce a song that changes shape
 * halfway through a form nobody has ever played that way.
 *
 * **The scale here is `blues` and everywhere else it is `minorPentatonic`**, and
 * the difference is one note. `core/scale.ts` argues at those two rows that the
 * ♭5 is a note you slide *through* on the way somewhere, and that once it is in
 * the table the engine will put it on a downbeat and hold it for a beat and a
 * half. That is a real cost and it is exactly what this style wants: a British
 * blues guitarist in 1967 holds the flat five, bends it, and sits on it while
 * the band waits. Nobody else in this file does — a hard rock riff that landed
 * on the ♭5 and stayed there would sound like it had gone wrong — so this is the
 * one style that takes the six-note scale and the other seven take the five.
 *
 * `swing: 0.28` and a ride cymbal. The shuffle is the subject here in a way it
 * is nowhere else after 1970, and this is the last style in the file that
 * carries a real one.
 */
const bluesrock: Style = {
  id: 'bluesrock',
  label: 'Blues rock',
  description:
    'The twelve-bar at volume: shuffled, dominant sevenths throughout, and a guitar holding the flat five while the band waits for it.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [96, 148],
  swing: 0.28,
  chorusBars: 12,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0,
  vary: { bass: 0.1, comp: 0.12 },
  hook: 'standard',
  /**
   * Six notes rather than five, and it is the only place in the genre that asks
   * for them. See the paragraph above; `pentatonicLead` is what everything else
   * with a riff for a tune takes.
   */
  scaleForChord: (tonic) => makeScale(tonic, 'blues'),
  progressions: {
    verse: [
      {
        chords: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'I7'],
        weight: 5, note: 'The plain twelve-bar, and the one the English groups actually copied — no ii–V, no diminished, because the records they were learning from had none',
      },
      {
        chords: ['I7', 'IV7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'],
        weight: 4, note: 'With the quick change in bar two',
      },
      {
        chords: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'bVI', 'bVII', 'I7', 'I7'],
        weight: 3, note: 'The rock turnaround: ♭VI–♭VII instead of V–IV, which is the point at which this stops being a blues and starts being the thing that came out of one',
      },
    ],
    chorus: [
      {
        chords: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'I7'],
        weight: 5,
      },
      {
        chords: ['IV7', 'IV7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'I7'],
        weight: 3,
      },
    ],
    outro: [
      { chords: ['V7', 'IV7', 'I7', 'I7'], weight: 4 },
      { chords: ['bVII', 'IV7', 'I7', 'I7'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      {
        chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'VI', 'VII', 'i7', 'i7'],
        weight: 5, note: 'A minor blues with ♭VI–♭VII where the jazz one puts a half-diminished and an altered dominant. There is no leading tone anywhere in it and there was not meant to be',
      },
      {
        chords: ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'v7', 'iv7', 'i7', 'i7'],
        weight: 3, note: 'A *minor* five, which is what this music writes where a dance band writes V' },
    ],
    chorus: [
      {
        chords: ['iv7', 'iv7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'VI', 'VII', 'i7', 'i7'],
        weight: 4,
      },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [-8, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [-8, 8], weight: 2 },
  ],
  /**
   * The boogie figure and the octave, and **no pentatonic riff** — which is the
   * one place this style's table differs from `boogie`'s and `southern`'s next
   * door.
   *
   * `pentatonicRiff` is written in straight sixteenths: its third note lands on
   * slot 3, which is the last sixteenth of beat one. Under `swing: 0.28` that
   * slot is being displaced toward a triplet position by `applySwing`, and a
   * figure whose whole shape depends on a sixteenth landing where the ear
   * expects it comes back as a smear. The two figures below are eighth-note
   * shapes and shuffle cleanly, which is the actual reason this repertoire's
   * bass players played them.
   */
  bass: [boogieShuffle(6), rootOctave(4)],
  comp: [ringingChord(5), chug(4), downstrokes(3)],
  drums: [shuffleKit(6), backbeat(4), backbeatOpen(2)],
  melody: { leap: 0.34, ornament: 0.4, span: 15, sequence: 0.45, syncopation: 0.4 },
};

/**
 * BOOGIE — the twelve-bar with the twelve bars taken out.
 *
 * Status Quo, ZZ Top, early Canned Heat: a shuffle that has stopped modulating
 * to the fourth and simply carries on. The whole style is one figure —
 * `boogieShuffle`, the root and fifth and sixth under a hand rocking between two
 * frets — repeated until the band has finished, and the chord changes when it
 * changes rather than because the form said so.
 *
 * So the progressions here are deliberately *shorter* on distinct chords than
 * `bluesrock`'s and much longer on bars per chord. Four bars of I is not an
 * absence of harmony, it is the harmony: everything happening in that time is
 * the bass figure and the drummer, and a chord arriving in bar three would be an
 * interruption.
 *
 * `hook: 'earworm'` — the only style in the file that asks for it. This music's
 * whole proposition is that nothing changes; `pickProgression` weights the
 * plainest table almost to certainty at that setting, which is what a boogie is.
 */
const boogie: Style = {
  id: 'boogie',
  label: 'Boogie',
  description:
    'A shuffle that never gets to the fourth: one bass figure, four bars to a chord, and the band playing it until they stop.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [130, 162],
  swing: 0.3,
  modeWeights: { minor: 0.2, major: 0.8 },
  relativeMajorChorus: 0,
  vary: { bass: 0.05, comp: 0.08 },
  hook: 'earworm',
  scaleForChord: pentatonicLead,
  progressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 5, note: 'One chord for eight bars, which is what the record is' },
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'I', 'I', 'bVII', 'bVII'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'IV', 'IV', 'V', 'V', 'I', 'I'], weight: 4 },
      { chords: ['bVII', 'bVII', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
    outro: [
      { chords: ['V', 'IV', 'I', 'I'], weight: 4 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [-8, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 3 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [boogieShuffle(7), rootOctave(3), rootEights(2)],
  comp: [chug(6), downstrokes(4), ringingChord(2)],
  drums: [shuffleKit(6), backbeat(4), backbeatOpen(2)],
  melody: { leap: 0.3, ornament: 0.3, span: 13, sequence: 0.6, syncopation: 0.35 },
};

/**
 * HARD ROCK — 1971, and the point at which the riff stops being an
 * accompaniment.
 *
 * Everything before this in the file has a chord sequence with a guitar part on
 * top of it. Here the guitar figure *is* the harmony: the band plays four notes
 * together, the chord is whatever those notes add up to, and the singer arrives
 * in the gaps. That is why `pentatonicRiff` leads the bass table rather than
 * sitting third in it, and why the progressions are two chords wide — a riff
 * that had to accommodate a ii–V would be a different riff every four bars.
 *
 * The tempo band, 116–140, is the narrowest in the file and it is the one every
 * hard rock record actually sits in. Faster is punk and slower is doom, and both
 * of those are separate styles here because they are separate music rather than
 * settings of this.
 *
 * `pentatonicLead`: the tune is the riff, moved up an octave and sung.
 */
const hard: Style = {
  id: 'hard',
  label: 'Hard rock',
  description:
    'The riff is the harmony: bass and guitar on the same four notes, two chords to a verse, and the singer working in the gaps.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [116, 142],
  swing: 0,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  vary: { bass: 0.08, comp: 0.1 },
  scaleForChord: pentatonicLead,
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 5, note: 'Two chords, and the second one is a whole tone below the first. Where a dance band writes V this writes ♭VII, and everything about the sound of the decade follows from it' },
      { chords: ['i', 'i', 'III', 'III', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5, note: 'Up a fourth and home: the ♭VI–♭VII–i cadence, which does the job a perfect cadence does and has no leading tone in it at all' },
      { chords: ['III', 'VII', 'i', 'i', 'III', 'VII', 'VI', 'VII'], weight: 4 },
      { chords: ['iv', 'III', 'VII', 'i', 'iv', 'III', 'VII', 'VII'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'VII', 'VII'], weight: 4 },
    ],
    outro: [
      { chords: ['VI', 'VII', 'i', 'i'], weight: 5 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 5, note: 'The mixolydian verse — I, ♭VII, IV — which is a major key with the leading tone taken out of it and is most of what "rock major" means' },
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 3 },
      { chords: ['I', 'bIII', 'IV', 'I', 'I', 'bIII', 'IV', 'IV'], weight: 3 },
    ],
    chorus: [
      { chords: ['bVI', 'bVII', 'I', 'I', 'bVI', 'bVII', 'I', 'I'], weight: 5 },
      { chords: ['IV', 'IV', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [-2, 2, 4, 8], weight: 3 },
    { cell: [3, 3, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
  ],
  bass: [pentatonicRiff(6), rootEights(4), rootOctave(3)],
  comp: [chug(5), ringingChord(4), downstrokes(4)],
  drums: [backbeat(6), backbeatOpen(4), fourOnFloor(2)],
  melody: { leap: 0.35, ornament: 0.3, span: 15, sequence: 0.55, syncopation: 0.4 },
};

/**
 * RIFF — slow, minor, and built on the interval the rule table forbids.
 *
 * Black Sabbath, February 1970, and the reason it needs its own style rather
 * than being a slow `hard` is the tritone. `tritoneRiff` puts a ♭5 in the bass
 * figure, and that is possible only because `generateBass` reads the table
 * literally: `tritone-leap` vetoes the same interval in a melody from strictness
 * 1 upward and is right to, because a *line* that leaps a tritone has lost its
 * footing. A figure hammered by two instruments in unison has not lost anything.
 * It is the one place in this project where the same interval is a fault in one
 * layer and the subject in another, and the tables can say so.
 *
 * Everything else about the style is subtraction. The tempo drops to 76–104, the
 * comp goes to whole notes because there is no room for eighths at that speed,
 * and the harmony is one chord with a ♭II or a ♭V leaning on it. `hook:
 * 'earworm'` is not available to it — the riff is already the hook and doubling
 * the repetition would produce a loop rather than a song — so it takes
 * `standard` and leaves the recurrence to the figure.
 */
const riff: Style = {
  id: 'riff',
  label: 'Riff rock',
  description:
    'Slow, minor, and a flattened fifth in the bass figure: two instruments in unison on four notes, and the chord is whatever they add up to.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [76, 106],
  swing: 0,
  modeWeights: { minor: 0.88, major: 0.12 },
  relativeMajorChorus: 0,
  vary: { bass: 0.05, comp: 0.08 },
  hook: 'standard',
  scaleForChord: pentatonicLead,
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5, note: 'One chord. The riff carries every event in the bar and a second chord would be somewhere for the ear to go instead' },
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 4, note: 'The flat second leaning on the tonic — the tritone from the riff, rewritten as a chord' },
      { chords: ['i', 'i', 'VI', 'VI', 'i', 'i', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 3 },
      { chords: ['III', 'III', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['bII', 'bII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'bIII', 'bIII', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'bVI', 'bVI', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['bVI', 'bVI', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [16], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [-8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [tritoneRiff(6), pentatonicRiff(5), rootOctave(2)],
  comp: [ringingChord(6), chug(4), wall(2)],
  drums: [backbeat(5), halftime(4), backbeatOpen(3)],
  melody: { leap: 0.3, ornament: 0.25, span: 12, sequence: 0.6, syncopation: 0.3 },
};

/**
 * GLAM — 1973, and the only style here designed around what an audience does.
 *
 * A glam record is a stomp, a handclap and a chorus that is four words long,
 * and every one of those is a decision about a room rather than about music.
 * `stomp` puts the guitar on two and four with the snare and leaves the offbeats
 * completely empty, which is a hole an audience fills by clapping; `fourOnFloor`
 * under it means every foot in the building is already moving; and `cp` in the
 * drum table is not a drummer, it is the band and the crowd.
 *
 * The harmony is the simplest in the file and deliberately so — I, IV and ♭VII,
 * mostly two bars each. Glam is the moment the British charts worked out that a
 * song does not need a bridge, and taking that out is what left room for the
 * eight bars of shouting.
 */
const glam: Style = {
  id: 'glam',
  label: 'Glam',
  description:
    'A stomp on two and four, handclaps, a chorus four words long, and nothing at all in the offbeats for the audience to have to compete with.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [120, 142],
  swing: 0,
  modeWeights: { minor: 0.15, major: 0.85 },
  relativeMajorChorus: 0,
  vary: { bass: 0.06, comp: 0.1 },
  hook: 'earworm',
  progressions: {
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 5 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'IV', 'IV'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'IV', 'V', 'V'], weight: 5 },
      { chords: ['bVII', 'bVII', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 4, note: 'The ♭VII–IV–I cadence, which by 1973 has replaced the perfect cadence in this music entirely and is the sound of a football crowd' },
      { chords: ['I', 'IV', 'V', 'IV', 'I', 'IV', 'V', 'V'], weight: 3 },
    ],
    outro: [
      { chords: ['bVII', 'IV', 'I', 'I'], weight: 5 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [rootEights(6), rootOctave(4), pushedRoot(2)],
  comp: [stomp(6), ringingChord(4), downstrokes(3)],
  drums: [
    { name: 'glam-stomp', weight: 6, voices: {
      bd: [0, 4, 8, 12],
      sd: [4, 12],
      cp: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    } },
    fourOnFloor(4),
    backbeatOpen(2),
  ],
  melody: { leap: 0.28, ornament: 0.2, span: 12, sequence: 0.7, syncopation: 0.25 },
};

/**
 * PSYCH — 1967. A drone, a modal scale, and the harmony refusing to move.
 *
 * The one style in the beat era that is not about a song. What psychedelia
 * actually did to rock harmony is take the cadence out: a raga has no dominant
 * and no modulation, and a group that had spent an afternoon with a sitar came
 * back and wrote eight bars of one chord with a flat second leaning on it. So
 * the tables here are the least *functional* in the file — `bII` and `bVII` and
 * nothing that resolves — and the melody is where all the movement is.
 *
 * `ornament: 0.5` is the highest in the genre by some distance. That is the
 * gamak and the pitch-bend and the tambura-adjacent vocal, all of which reach
 * the generator as grace notes, and it is the one dial that makes this style
 * sound like 1967 rather than like a slow `hard`.
 *
 * `counterSpacing` is left at its default, but the pad is *required*: a
 * psychedelic arrangement has something droning under it at all times, and the
 * default arrangement rules treat the pad as decoration to be added when there
 * is room. Here there is always room, because that is what the record is.
 */
const psych: Style = {
  id: 'psych',
  label: 'Psychedelia',
  description:
    'A drone, a modal scale and no cadence anywhere: one chord for eight bars with a flat second leaning on it, and every ornament the singer knows.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [98, 128],
  swing: 0,
  modeWeights: { minor: 0.72, major: 0.28 },
  relativeMajorChorus: 0,
  vary: { bass: 0.06, comp: 0.1 },
  requireLayers: ['pad'],
  /**
   * A quarter note between the answering line's notes, where every other style
   * here takes the default eighth.
   *
   * The field exists because ambient's gaps are bars rather than beats and a
   * burst of eighths into one reads as a different piece of music breaking in.
   * The same argument holds at a smaller scale over a drone: this style's verse
   * is one chord for eight bars and its melody is deliberately slow, so the holes
   * the answer is filling are two and three beats wide. An answer moving at the
   * default rate fills them completely and stops being an answer — it becomes a
   * second melody, in the same register, arriving at the same time as the first.
   */
  counterSpacing: 1,
  /**
   * The one ramp in the genre, and it is a foot rather than a mix move.
   *
   * A wah pedal rocked slowly open across a whole section is a 1967 gesture and
   * there is no other way to write it down here — `CompHit.vel` carries an
   * amplitude shape and this is unmistakably a filter. `depth: 0.45` is a pedal
   * that opens from about half to fully, which is as far as a foot travels;
   * `ramp` rather than `step` because the movement is the point and a section
   * that merely arrived brighter would be a different effect entirely. See the
   * genre's `filter` profile for which layers move.
   */
  filter: { depth: 0.45, shape: 'ramp' },
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 5, note: 'Phrygian, and no cadence in it. The flat second is a colour leaning on a drone rather than a chord going anywhere' },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'IV', 'IV', 'i', 'i', 'IV', 'IV'], weight: 3, note: 'A major fourth under a minor tonic — dorian, and the brightest note this style has' },
    ],
    chorus: [
      { chords: ['VII', 'VII', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['III', 'III', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 3 },
      { chords: ['bII', 'bII', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['i', 'i', 'i', 'i'], weight: 5 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'II', 'II', 'I', 'I', 'II', 'II'], weight: 3, note: 'A major second over a major tonic: lydian-adjacent, and the sound of a mellotron in a small room' },
    ],
    chorus: [
      { chords: ['bVII', 'bVII', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [1, 1, 2, 4, 8], weight: 3 },
    { cell: [16], weight: 3 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [-4, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 3 },
    { cell: [-8, 8], weight: 2 },
  ],
  bass: [heldRoot(5), rootEights(4), rootOctave(3)],
  comp: [ringingChord(5), jangleArp(4), halfNotes(3)],
  drums: [backbeat(5), tambourineBeat(4), backbeatOpen(3)],
  melody: { leap: 0.32, ornament: 0.5, span: 14, sequence: 0.45, syncopation: 0.35 },
};

/**
 * SOUTHERN — two guitars playing the same line a third apart.
 *
 * The style exists in this file for one arrangement device and it is the one
 * `Genre.arrangement` weights hardest: `harmony`, where the answering line stops
 * answering and joins the tune. Twin lead guitars in parallel thirds is what
 * separates the Allman Brothers from every other band playing a shuffle in
 * A major, and it is not a texture the generator would ever have reached for on
 * its own — the default arrangement odds treat harmony as one of six devices,
 * and this genre pushes it to the top of the table specifically here.
 *
 * The harmony is a boogie's with more chords in it and a real IV–V, because
 * unlike the British groups these people had actually played the music they were
 * descended from and knew where the changes went. `pentatonicLead` all the same:
 * the tune is a guitar line.
 */
const southern: Style = {
  id: 'southern',
  label: 'Southern rock',
  description:
    'Two guitars on the same line a third apart, over a shuffle that knows where the changes go.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [112, 146],
  swing: 0.2,
  modeWeights: { minor: 0.25, major: 0.75 },
  relativeMajorChorus: 0,
  vary: { bass: 0.1, comp: 0.12 },
  scaleForChord: pentatonicLead,
  progressions: {
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V', 'IV', 'IV', 'I', 'V', 'IV', 'IV'], weight: 4, note: 'Three chords in a loop that never lands on the tonic at the end of a phrase — "Sweet Home Alabama" is this and so is half the repertoire' },
      { chords: ['I', 'I', 'IV', 'IV', 'V', 'V', 'IV', 'IV'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['bVII', 'IV', 'I', 'I', 'bVII', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['I', 'bVII', 'IV', 'I', 'I', 'bVII', 'IV', 'V'], weight: 3 },
    ],
    outro: [
      { chords: ['bVII', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['V', 'IV', 'I', 'I'], weight: 3 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'iv', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [12, 4], weight: 3 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [boogieShuffle(6), rootOctave(4), pentatonicRiff(3)],
  comp: [ringingChord(5), downstrokes(4), chug(3)],
  drums: [shuffleKit(5), backbeat(5), backbeatOpen(2)],
  melody: { leap: 0.36, ornament: 0.35, span: 16, sequence: 0.5, syncopation: 0.4 },
};

/**
 * PROG — 7/8, and the metre is the composition.
 *
 * `beatsPerBar: 3.5` with `beatUnit: 8` is how a bar of seven eighths is spelled
 * here: the engine's beat is always a quarter, so seven eighths genuinely is
 * three and a half of them, and every slot index below stays an honest
 * sixteenth. `groups: [4, 4, 6]` is the 2+2+3, and it has to be declared because
 * it cannot be derived — `metricStrength` divides by four and lands a half-bar
 * accent in the middle of the third group, which is confidently wrong and
 * produces a phrase that sounds like the swing has a bug in it.
 *
 * 2+2+3 rather than 3+2+2, and that is a compositional choice rather than a
 * notation: the long group at the *end* of the bar is what makes a 7/8 feel like
 * a 4/4 with something stolen from it, which is how this music is played. The
 * other grouping feels like a limp.
 *
 * The organ is the point of the style as much as the metre. `prog` is where a
 * Hammond and a Mellotron are doing what a horn section does elsewhere, which is
 * why the pad is required here and excluded from `punk` next door — an
 * arrangement with no sustained layer in it is not a prog arrangement, it is
 * three people in a hurry.
 */
const prog: Style = {
  id: 'prog',
  label: 'Progressive',
  description:
    'Seven eighths grouped 2+2+3, an organ where a horn section would be, and a form long enough to need one.',
  beatsPerBar: 3.5,
  beatUnit: 8,
  groups: [4, 4, 6],
  bpm: [104, 136],
  swing: 0,
  modeWeights: { minor: 0.62, major: 0.38 },
  relativeMajorChorus: 0,
  vary: { bass: 0.12, comp: 0.15 },
  requireLayers: ['pad'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'VII', 'VI', 'v', 'i', 'VII', 'VI', 'VI'], weight: 3, note: 'The descending tetrachord, and the one place in this genre where a *minor* v sits at the bottom of it doing a dominant\'s job without a dominant\'s leading tone' },
      { chords: ['i', 'i', 'iv', 'iv', 'III', 'III', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'III', 'VII', 'iv', 'i', 'III', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'III', 'VII', 'i', 'VI', 'III', 'VII', 'VII'], weight: 5 },
      { chords: ['iv', 'VII', 'III', 'VI', 'iv', 'VII', 'i', 'i'], weight: 4 },
    ],
    bridge: [
      { chords: ['bII', 'bII', 'VII', 'VII', 'VI', 'VI', 'i', 'i'], weight: 4 },
    ],
    outro: [
      { chords: ['VI', 'VII', 'i', 'i'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['I', 'iii', 'IV', 'bVII', 'I', 'iii', 'IV', 'IV'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'bVII', 'I', 'I', 'IV', 'bVII', 'I', 'I'], weight: 4 },
      { chords: ['bVI', 'bVII', 'I', 'I', 'bVI', 'bVII', 'I', 'I'], weight: 3 },
    ],
  },
  // Fourteen sixteenths to the bar, and every cell adds up to exactly that. The
  // ones that group 4+4+6 are the ones that sound like the metre; the ones that
  // do not are what a soloist plays *across* it, which is the other half of why
  // anybody writes in seven.
  melodyCells: [
    { cell: [4, 4, 6], weight: 5 },
    { cell: [4, 4, 4, 2], weight: 4 },
    { cell: [2, 2, 4, 6], weight: 4 },
    { cell: [14], weight: 3 },
    { cell: [-4, 4, 6], weight: 3 },
    { cell: [6, 4, 4], weight: 3 },
    { cell: [2, 2, 2, 2, 6], weight: 2 },
    { cell: [8, 6], weight: 2 },
  ],
  cadenceCells: [
    { cell: [14], weight: 5 },
    { cell: [8, 6], weight: 3 },
    { cell: [-4, 10], weight: 3 },
    { cell: [4, 4, 6], weight: 2 },
  ],
  bass: [
    { name: 'seven-riff', weight: 6, hits: [
      { at: 0, dur: 2, tone: 0, vel: 0.98 },
      { at: 2, dur: 2, tone: 0, vel: 0.78 },
      { at: 4, dur: 2, tone: 7, vel: 0.9 },
      { at: 6, dur: 2, tone: 0, vel: 0.8 },
      { at: 8, dur: 3, tone: 10, vel: 0.9 },
      { at: 11, dur: 3, tone: 12, vel: 0.86 },
    ] },
    { name: 'seven-root', weight: 4, hits: [
      { at: 0, dur: 4, tone: 0, vel: 0.98 },
      { at: 4, dur: 4, tone: 0, vel: 0.86 },
      { at: 8, dur: 6, tone: 7, vel: 0.9 },
    ] },
    /**
     * And one that does not fit the bar at all.
     *
     * `cycle: 12` is a three-beat figure against a three-and-a-half-beat bar, so
     * it arrives two sixteenths earlier every bar and takes six bars to come back
     * round. That drift is the entire reason a band writes in seven, and it is
     * the one thing a bar-shaped table cannot express — see `Cycle` in
     * `style/types.ts`, which exists because of exactly this figure.
     */
    { name: 'three-against-seven', weight: 3, cycle: 12, hits: [
      { at: 0, dur: 2, tone: 0, vel: 0.96 },
      { at: 4, dur: 2, tone: 7, vel: 0.84 },
      { at: 8, dur: 4, tone: 10, vel: 0.88 },
    ] },
  ],
  comp: [
    { name: 'seven-chords', weight: 6, voices: 4, hits: [
      { at: 0, dur: 4, vel: 0.94 },
      { at: 4, dur: 4, vel: 0.86 },
      { at: 8, dur: 6, vel: 0.9 },
    ] },
    { name: 'seven-arp', weight: 4, voices: 4, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 0, dur: 2, vel: 0.9 }, { at: 2, dur: 2, vel: 0.72 },
      { at: 4, dur: 2, vel: 0.84 }, { at: 6, dur: 2, vel: 0.72 },
      { at: 8, dur: 2, vel: 0.88 }, { at: 10, dur: 2, vel: 0.72 },
      { at: 12, dur: 2, vel: 0.8 },
    ] },
    { name: 'seven-ring', weight: 2, voices: 4, hits: [{ at: 0, dur: 14, vel: 0.9 }] },
  ],
  drums: [
    { name: 'seven-kit', weight: 6, voices: {
      bd: [0, 8],
      sd: [4, 11],
      hh: [0, 2, 4, 6, 8, 10, 12],
    } },
    { name: 'seven-kit-open', weight: 3, voices: {
      bd: [0, 6, 8],
      sd: [4, 11],
      hh: [0, 4, 8],
      oh: [2, 6, 10, 12],
    } },
    { name: 'seven-toms', weight: 2, voices: {
      bd: [0, 8],
      sd: [4, 11],
      lt: [0, 8], mt: [4], ht: [11],
      hh: [2, 6, 10, 12],
    } },
  ],
  melody: { leap: 0.4, ornament: 0.3, span: 17, sequence: 0.45, syncopation: 0.5 },
};

/**
 * MATH — five beats grouped 3+2, and a band that counts out loud.
 *
 * The other odd metre in the file, and it is a different proposition from
 * `prog`'s. A seven-eight prog bar is a four-four bar with an eighth missing and
 * the ear hears the theft; a five-four bar grouped 3+2 is genuinely two unequal
 * bars stuck together, and what a band does with it is *lock*. So where `prog`
 * puts an organ and a long form over its metre, this puts nothing over it at
 * all: clean guitars, no pad, and a drum part whose whole job is to make the
 * grouping audible.
 *
 * `groups: [12, 8]` — twelve sixteenths then eight, summing to twenty, which is
 * `beatsPerBar * 4` and is asserted. Every drum pattern below hits slots 0 and
 * 12, which are the two group heads, because a bar of five that does not tell
 * you where the join is is a bar of five nobody can follow.
 *
 * `melody.sequence` is the highest in the file at 0.75. The device that makes
 * this music legible is a figure stated and then stated again on the next group,
 * which is exactly what an exact melodic sequence is, and in an asymmetric metre
 * it is also the only way a listener works out where the bar is.
 */
const math: Style = {
  id: 'math',
  label: 'Math rock',
  description:
    'Five beats grouped three and two, clean guitars, no pad, and a figure repeated until the grouping is audible.',
  beatsPerBar: 5,
  beatUnit: 4,
  groups: [12, 8],
  bpm: [124, 156],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  /**
   * **No `vary`, and it is the only style in the file without one.**
   *
   * Every other band here decorates the last bar of a phrase, because that is
   * what a rhythm section does when it can hear the fill coming. This one does
   * not, and the reason is the metre: in a bar of five the figure *is* the count.
   * A listener four bars into one of these pieces is still working out where the
   * bar turns over, and a bass player who moved a note at the phrase end would be
   * taking away the only thing they had to count from. The discipline is the
   * style — these bands rehearse until nobody moves — and the field's absence is
   * how that gets said.
   */
  excludeLayers: ['pad', 'brass'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 4 },
      { chords: ['i', 'III', 'VII', 'VI', 'i', 'III', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'VII', 'i', 'i', 'iv', 'VII', 'III', 'III'], weight: 3 },
    ],
    outro: [
      { chords: ['i', 'VII', 'i', 'i'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['I', 'vi', 'IV', 'IV', 'I', 'vi', 'ii', 'ii'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'bVII', 'I', 'I', 'IV', 'bVII', 'I', 'I'], weight: 4 },
    ],
  },
  // Twenty sixteenths. The 12+8 cells state the grouping; the [4,4,4,4,4] runs
  // straight through it, which is the thing a guitarist plays over the top when
  // the drummer has the metre covered.
  melodyCells: [
    { cell: [12, 8], weight: 5 },
    { cell: [4, 4, 4, 8], weight: 4 },
    { cell: [4, 4, 4, 4, 4], weight: 4 },
    { cell: [6, 6, 8], weight: 3 },
    { cell: [-4, 8, 8], weight: 3 },
    { cell: [2, 2, 4, 4, 8], weight: 3 },
    { cell: [20], weight: 2 },
  ],
  cadenceCells: [
    { cell: [20], weight: 5 },
    { cell: [12, 8], weight: 4 },
    { cell: [-4, 16], weight: 2 },
  ],
  bass: [
    { name: 'five-riff', weight: 6, hits: [
      { at: 0, dur: 2, tone: 0, vel: 0.98 },
      { at: 2, dur: 2, tone: 0, vel: 0.78 },
      { at: 4, dur: 2, tone: 3, vel: 0.86 },
      { at: 6, dur: 2, tone: 5, vel: 0.84 },
      { at: 8, dur: 4, tone: 7, vel: 0.9 },
      { at: 12, dur: 4, tone: 0, vel: 0.94 },
      { at: 16, dur: 4, tone: -2, vel: 0.84 },
    ] },
    { name: 'five-root', weight: 4, hits: [
      { at: 0, dur: 4, tone: 0, vel: 0.98 },
      { at: 4, dur: 4, tone: 0, vel: 0.82 },
      { at: 8, dur: 4, tone: 12, vel: 0.86 },
      { at: 12, dur: 4, tone: 0, vel: 0.94 },
      { at: 16, dur: 4, tone: 7, vel: 0.84 },
    ] },
  ],
  comp: [
    { name: 'five-chords', weight: 6, voices: 4, hits: [
      { at: 0, dur: 6, vel: 0.94 },
      { at: 6, dur: 6, vel: 0.84 },
      { at: 12, dur: 8, vel: 0.9 },
    ] },
    { name: 'five-arp', weight: 4, voices: 4, arpeggio: true, arpDirection: 'updown', hits: [
      { at: 0, dur: 2, vel: 0.92 }, { at: 2, dur: 2, vel: 0.72 },
      { at: 4, dur: 2, vel: 0.82 }, { at: 6, dur: 2, vel: 0.72 },
      { at: 8, dur: 2, vel: 0.82 }, { at: 10, dur: 2, vel: 0.72 },
      { at: 12, dur: 2, vel: 0.9 }, { at: 14, dur: 2, vel: 0.72 },
      { at: 16, dur: 2, vel: 0.82 }, { at: 18, dur: 2, vel: 0.72 },
    ] },
  ],
  drums: [
    { name: 'five-kit', weight: 6, voices: {
      bd: [0, 6, 12],
      sd: [4, 16],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18],
    } },
    { name: 'five-kit-heads', weight: 4, voices: {
      bd: [0, 12],
      sd: [8, 16],
      hh: [0, 4, 8, 12, 16],
      oh: [2, 6, 10, 14, 18],
    } },
  ],
  melody: { leap: 0.38, ornament: 0.2, span: 15, sequence: 0.75, syncopation: 0.45 },
};

/**
 * MOTORIK — one chord, one tempo, and nobody stopping.
 *
 * Neu!, Can, Harmonia. The kit plays a straight sixteenth pattern with the kick
 * on every beat and the snare answering slightly off it, and the whole point is
 * that nothing develops: the record gets somewhere by *staying* somewhere for
 * long enough. So this is the only style here whose verse tables are a single
 * chord in every entry, and the only one with a bass figure that does not fit
 * the bar.
 *
 * `cycle: 12` on the second bass pattern is that figure. Three beats against a
 * four-beat bar arrives on a different beat every bar and comes back round every
 * three, which is exactly the phasing a krautrock band gets out of two people
 * playing simple parts at slightly different lengths. It is the one device this
 * genre borrows from `ambient/` and `synth/`, and it belongs here because the
 * musicians involved genuinely were listening to the same records.
 *
 * `feels` is declared, and it is one of three styles in the file that declares
 * one at all — see the note at `grunge`. `driving` against `straight` is the
 * difference between the eighth bar of one of these pieces and the eightieth,
 * which is the only thing that happens in it.
 */
const motorik: Style = {
  id: 'motorik',
  label: 'Motorik',
  description:
    'One chord, one tempo and nobody stopping: a straight kit, a bass figure three beats long against a four-beat bar, and no development of any kind.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [128, 152],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  vary: { bass: 0.05, comp: 0.05 },
  hook: 'earworm',
  feels: [['straight', 6], ['driving', 4]],
  requireLayers: ['pad'],
  progressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 6, note: 'One chord for eight bars, and then for eight more. The harmony is not withholding anything — there is nothing being withheld' },
      { chords: ['I', 'I', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['bVII', 'bVII', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    outro: [
      { chords: ['I', 'I', 'I', 'I'], weight: 5 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6 },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VII', 'VII', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 5 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [16], weight: 3 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
    { cell: [-4, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [
    rootEights(6),
    /**
     * And the one that does not fit. See the header — a three-beat figure over a
     * four-beat bar, which is the whole texture rather than a decoration on it.
     */
    { name: 'three-beat-drift', weight: 4, cycle: 12, hits: [
      { at: 0, dur: 2, tone: 0, vel: 0.96 },
      { at: 2, dur: 2, tone: 0, vel: 0.78 },
      { at: 4, dur: 2, tone: 7, vel: 0.88 },
      { at: 6, dur: 2, tone: 0, vel: 0.78 },
      { at: 8, dur: 4, tone: 10, vel: 0.86 },
    ] },
    heldRoot(2),
  ],
  comp: [chug(5), downstrokes(4), wall(3)],
  drums: [
    /**
     * The motorik beat itself: kick on all four, snare on two and four *and* on
     * the offbeat between them, hats in sixteenths.
     *
     * The snare on slot 6 is the whole thing. It is not a fill and it is not a
     * ghost note — it is struck as hard as the backbeat and it is what turns a
     * four-on-the-floor into a wheel rather than a march. Klaus Dinger played
     * this for eight minutes at a time without varying it once.
     */
    { name: 'motorik', weight: 6, voices: {
      bd: [0, 4, 8, 12],
      sd: [4, 6, 12, 14],
      hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    } },
    fourOnFloor(4),
    backbeatSixteens(2),
  ],
  melody: { leap: 0.25, ornament: 0.2, span: 11, sequence: 0.7, syncopation: 0.3 },
};

/**
 * STONER — the riff, slowed until the amplifier is the instrument.
 *
 * Down a whole tone or more, half the tempo of `hard`, and every note held long
 * enough that what is audible is not the attack but the *sustain* — a fuzz box
 * into a cranked valve amplifier feeding back gently, which takes about a second
 * to establish and is why nothing here goes faster than 92.
 *
 * The harmony is `riff`'s with the ♭II promoted from a leaning chord to a
 * structural one, which is phrygian, and phrygian at this tempo is the sound of
 * the whole subgenre. `wall` leads the comp table rather than `ringingChord`,
 * and the difference is `sustain: true` — where the chord has not changed, the
 * guitar does not re-strike it, because a chord restruck every bar at 70 BPM is
 * a pulse and what this music wants is a slab.
 *
 * This is one of the two styles where the missing power chord costs something
 * audible. See the file header: a three-voice triad at this register and this
 * much distortion produces intermodulation between the third and the fifth that
 * a real power chord does not have, and there is no way to say so here.
 */
const stoner: Style = {
  id: 'stoner',
  label: 'Stoner',
  description:
    'The riff at half speed and down a tone: chords held rather than restruck, a flat second doing structural work, and the amplifier sustaining between them.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [64, 94],
  swing: 0,
  modeWeights: { minor: 0.85, major: 0.15 },
  relativeMajorChorus: 0,
  vary: { bass: 0.05, comp: 0.06 },
  scaleForChord: pentatonicLead,
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'bII', 'bII', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['bII', 'bII', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4, note: 'Down a semitone and then a whole tone onto the tonic. The phrygian cadence, and no dance band has ever played one' },
      { chords: ['iv', 'iv', 'III', 'III', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['bII', 'bII', 'i', 'i'], weight: 5 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'bII', 'bII', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'bIII', 'bIII', 'bVII', 'bVII', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['bVI', 'bVI', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-8, 8], weight: 3 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-8, 8], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [tritoneRiff(5), heldRoot(4), pentatonicRiff(4)],
  comp: [wall(6), ringingChord(4), chug(2)],
  drums: [halftime(6), backbeat(4), backbeatOpen(2)],
  melody: { leap: 0.26, ornament: 0.25, span: 11, sequence: 0.6, syncopation: 0.25 },
};

// ---------------------------------------------------------------------------
// 1977–87: the room gets bigger and then stops being a room
// ---------------------------------------------------------------------------

/**
 * PUNK — two and a half minutes, three chords, and every stroke a downstroke.
 *
 * The tempo band starts at 168 and every form built at that speed gets its
 * sections doubled by `buildForm`, which is correct rather than a workaround: a
 * bar lasts under one and a half seconds, an eight-bar verse is gone in eleven,
 * and a punk record really is sixteen-bar sections at that tempo rather than
 * eight-bar ones. The generator works this out from the metre without being
 * told, and it is one of the few places where a rule written for a fast waltz
 * turns out to have been right about something else entirely.
 *
 * `excludeLayers` takes the pad *and* the brass. There is nothing sustained on
 * these records and there is nobody available to play a horn line; a wash behind
 * a punk arrangement would be the single most obviously wrong thing this genre
 * could produce, and it costs one field to make it unreachable.
 *
 * `vary` is the lowest in the file at 0.03. A punk rhythm section that decorated
 * the last bar of a phrase would be showing off, and this is the one style here
 * where showing off is against the rules of the music rather than merely out of
 * character.
 */
const punk: Style = {
  id: 'punk',
  label: 'Punk',
  description:
    'Under three minutes, three chords, eighth-note downstrokes throughout, and nothing sustained anywhere in the arrangement.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [168, 204],
  swing: 0,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0,
  vary: { bass: 0.03, comp: 0.03 },
  excludeLayers: ['pad', 'brass'],
  hook: 'earworm',
  progressions: {
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'V', 'V', 'IV', 'IV'], weight: 5 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['I', 'IV', 'V', 'IV', 'I', 'IV', 'V', 'V'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'V', 'V', 'I', 'I'], weight: 5 },
      { chords: ['bVI', 'bVII', 'I', 'I', 'bVI', 'bVII', 'I', 'I'], weight: 4 },
      { chords: ['I', 'V', 'IV', 'IV', 'I', 'V', 'IV', 'IV'], weight: 3 },
    ],
    outro: [
      { chords: ['IV', 'V', 'I', 'I'], weight: 4 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'VII', 'i', 'i', 'iv', 'VII', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [8, 8], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [12, 4], weight: 2 },
  ],
  bass: [rootEights(7), rootOctave(3), pushedRoot(2)],
  comp: [downstrokes(7), chug(3), ringingChord(2)],
  drums: [trainBeat(6), backbeat(4), fourOnFloor(2)],
  melody: { leap: 0.24, ornament: 0.1, span: 10, sequence: 0.7, syncopation: 0.2 },
};

/**
 * NEW WAVE — punk with the distortion turned off and a keyboard in the corner.
 *
 * The guitar sound is the fact to build around: a clean or barely-broken tone,
 * played in short damped stabs rather than held chords, which leaves the middle
 * of the frequency range empty for the first time since 1969 — and what walks
 * into that space is a cheap polysynth and a bass player who has started
 * playing eighth notes very high up. `chug` leads the comp table here for that
 * reason, where `hard` uses it as a second voice under something louder.
 *
 * The harmony is the beat era's, which is not a coincidence and is the thing
 * everybody involved would have denied at the time: `I–vi–IV–V` is back, `ii` is
 * back, and the minor sixth chord that separated a British single in 1964 from
 * an American one is doing exactly the same job in 1979.
 */
const newwave: Style = {
  id: 'newwave',
  label: 'New wave',
  description:
    'A clean guitar in short stabs, a cheap polysynth in the space that leaves, and the beat era\'s chord sequences at twice the tempo.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [138, 170],
  swing: 0,
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0,
  vary: { bass: 0.08, comp: 0.12 },
  progressions: {
    verse: [
      { chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'IV', 'V'], weight: 5 },
      { chords: ['I', 'I', 'ii', 'ii', 'IV', 'IV', 'V', 'V'], weight: 4 },
      { chords: ['I', 'bVII', 'IV', 'IV', 'I', 'bVII', 'IV', 'IV'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'I', 'vi', 'IV', 'V', 'I', 'I'], weight: 5 },
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V'], weight: 4 },
      { chords: ['I', 'IV', 'V', 'V', 'I', 'IV', 'V', 'V'], weight: 3 },
    ],
    bridge: [
      { chords: ['ii', 'ii', 'IV', 'IV', 'V', 'V', 'V', 'V'], weight: 4 },
    ],
    outro: [
      { chords: ['IV', 'V', 'I', 'I'], weight: 4 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'III', 'III', 'VII', 'VII', 'VI', 'VI'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'III', 'VII', 'i', 'VI', 'III', 'VII', 'VII'], weight: 4 },
      { chords: ['iv', 'VI', 'VII', 'i', 'iv', 'VI', 'VII', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [2, 2, 2, 2, 8], weight: 3 },
    { cell: [-2, 2, 4, 8], weight: 3 },
    { cell: [6, 2, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 3 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [rootEights(6), melodicBass(4), pushedRoot(3)],
  comp: [chug(6), downstrokes(4), stomp(2)],
  drums: [backbeat(6), fourOnFloor(3), backbeatSixteens(3)],
  melody: { leap: 0.32, ornament: 0.2, span: 13, sequence: 0.6, syncopation: 0.4 },
};

/**
 * POST-PUNK — the arrangement upside down.
 *
 * The one style in this genre where the bass is the lead instrument and the
 * guitar is a texture on top of it, which is why `melodicBass` heads the bass
 * table and `wall` and `jangleArp` are what sits above it: a flanged,
 * chorused, deliberately thin guitar playing something that is not a chord
 * sequence. Joy Division, Magazine, early Cure, Wire after the first record.
 *
 * That inversion is also the reason this style is minor almost throughout. A
 * bass line played high on the neck with a plectrum is audible as a *melody*, and
 * a melodic bass in a major key reads as funk or as motown; the minor key is
 * what makes it read as this. It is the same figure and the same register, and
 * the mode is doing all the work.
 *
 * `melody.span` is the narrowest in the file at 9 semitones. The singer here is
 * not reaching for anything, and half these vocals sit inside a fifth.
 */
const postpunk: Style = {
  id: 'postpunk',
  label: 'Post-punk',
  description:
    'The bass has the tune and the guitar is a texture over it: minor, high, flanged, and a singer working inside a fifth.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [136, 166],
  swing: 0,
  modeWeights: { minor: 0.8, major: 0.2 },
  relativeMajorChorus: 0,
  vary: { bass: 0.08, comp: 0.1 },
  feels: [['straight', 6], ['driving', 3]],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'iv', 'i', 'iv', 'i', 'iv', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['III', 'VII', 'iv', 'i', 'III', 'VII', 'iv', 'iv'], weight: 4 },
      { chords: ['bII', 'bII', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 2 },
    ],
    outro: [
      { chords: ['i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['VI', 'VII', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'I', 'I', 'bVII', 'bVII'], weight: 5 },
      { chords: ['I', 'vi', 'IV', 'IV', 'I', 'vi', 'IV', 'IV'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'bVII', 'I', 'I', 'IV', 'bVII', 'I', 'I'], weight: 4 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [16], weight: 3 },
    { cell: [2, 2, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [melodicBass(7), rootEights(4), pentatonicRiff(2)],
  comp: [jangleArp(5), wall(4), chug(3)],
  drums: [backbeat(5), backbeatSixteens(4), fourOnFloor(3)],
  melody: { leap: 0.22, ornament: 0.15, span: 9, sequence: 0.65, syncopation: 0.3 },
};

/**
 * ARENA — the room is the arrangement.
 *
 * Everything characteristic about this style is a production decision rather
 * than a musical one, which is unusual enough in this project to be worth
 * saying: the chords are `hard`'s, the tempo is `hard`'s, and what makes it a
 * different style is that the snare has a second and a half of reverb on it, the
 * hats are in sixteenths because they finally have their own microphone, and the
 * chorus has four voices on it because there is a desk with enough channels.
 *
 * **The gated snare is this era's signature and this genre cannot express it.**
 * `DrumTrack.voiceEffects` is the field that exists for exactly this — its own
 * doc names gated reverb on the snare and nothing else as the most recognisable
 * production sound of 1984 — and nothing in `generate/` populates it. A genre
 * can state `effects.drums` and that lands on the whole kit, hats included,
 * which its doc correctly calls a mess rather than a period. See the report; the
 * era table asks for as much of it as it can.
 *
 * `pushedRoot` in the bass, because at this tempo with a drummer playing
 * sixteenths there is nowhere left to be busy. The one note off the grid is the
 * octave pushed an eighth ahead of beats two and four, which is what every bass
 * player on these records does and roughly all they do.
 */
const arena: Style = {
  id: 'arena',
  label: 'Arena',
  description:
    'The chords of hard rock in a building with a lighting rig: sixteenths on the hat, a snare with a second of reverb on it, and four voices on the chorus.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [114, 142],
  swing: 0,
  modeWeights: { minor: 0.4, major: 0.6 },
  relativeMajorChorus: 0,
  vary: { bass: 0.08, comp: 0.1 },
  progressions: {
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'IV'], weight: 4 },
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'V', 'vi', 'vi', 'IV', 'V'], weight: 5 },
      { chords: ['bVI', 'bVII', 'I', 'I', 'bVI', 'bVII', 'I', 'I'], weight: 5, note: 'The stadium cadence. Two chords a whole tone apart walking up onto the tonic, and twenty thousand people know where it lands before it gets there' },
      { chords: ['I', 'V', 'IV', 'IV', 'I', 'V', 'IV', 'V'], weight: 3 },
    ],
    bridge: [
      { chords: ['vi', 'vi', 'IV', 'IV', 'bVII', 'bVII', 'V', 'V'], weight: 4 },
    ],
    outro: [
      { chords: ['bVI', 'bVII', 'I', 'I'], weight: 5 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'III', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'VI', 'VII', 'i', 'iv', 'VI', 'VII', 'VII'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [-2, 2, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [12, 4], weight: 3 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [pushedRoot(6), rootEights(4), rootOctave(3)],
  comp: [ringingChord(5), chug(4), downstrokes(3)],
  drums: [backbeatSixteens(6), backbeatOpen(4), fourOnFloor(3)],
  melody: { leap: 0.34, ornament: 0.25, span: 15, sequence: 0.6, syncopation: 0.35 },
};

/**
 * BALLAD — the power ballad, which is a rock song with the first verse taken
 * away and given back later.
 *
 * The form is the whole style and it is entirely a matter of *arrangement
 * density* rather than of notes: a clean arpeggiated guitar and a voice for
 * sixteen bars, the band arriving at the second chorus, and the last chorus with
 * everything on it. `restraint` in the moods and `density` in the eras are what
 * actually produce that, so what this style has to do is stay out of their way —
 * which is why the tempo is slow enough for the difference to be audible and why
 * `jangleArp` and `wall` sit at opposite ends of the same comp table.
 *
 * `halftime` in the drums is the other half. The gesture everybody knows is the
 * bar where the drummer goes to half time and the whole thing doubles in weight
 * without getting faster; the pattern is here so the draw can land on it, and
 * the styles either side of it in the file are where it does not belong.
 */
const ballad: Style = {
  id: 'ballad',
  label: 'Power ballad',
  description:
    'A clean arpeggio and a voice, then the band, then everything: slow enough that the difference between those three is the composition.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [62, 84],
  swing: 0,
  modeWeights: { minor: 0.42, major: 0.58 },
  relativeMajorChorus: 0,
  vary: { bass: 0.1, comp: 0.14 },
  requireLayers: ['pad'],
  progressions: {
    verse: [
      { chords: ['I', 'I', 'vi', 'vi', 'IV', 'IV', 'V', 'V'], weight: 5 },
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['I', 'iii', 'IV', 'IV', 'I', 'iii', 'IV', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'I', 'vi', 'IV', 'V', 'I', 'I'], weight: 5 },
      { chords: ['IV', 'IV', 'I', 'I', 'bVI', 'bVII', 'I', 'I'], weight: 4 },
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'V', 'V'], weight: 3 },
    ],
    bridge: [
      { chords: ['IV', 'IV', 'vi', 'vi', 'IV', 'IV', 'V', 'V'], weight: 4 },
    ],
    outro: [
      { chords: ['IV', 'V', 'I', 'I'], weight: 5 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VI'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'III', 'VII', 'i', 'VI', 'III', 'VII', 'VII'], weight: 5 },
      { chords: ['iv', 'VI', 'VII', 'i', 'iv', 'VI', 'VII', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [-2, 2, 4, 8], weight: 3 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 3 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [heldRoot(5), rootOctave(4), pushedRoot(3)],
  comp: [jangleArp(5), ringingChord(4), wall(3)],
  drums: [backbeat(5), halftime(4), backbeatSixteens(3)],
  melody: { leap: 0.3, ornament: 0.35, span: 16, sequence: 0.55, syncopation: 0.3 },
};

// ---------------------------------------------------------------------------
// 1988–97: loud, quiet, loud
// ---------------------------------------------------------------------------

/**
 * GRUNGE — the dynamic is the form.
 *
 * A verse played at conversational volume on one clean guitar, a chorus with
 * four tracks of distortion on it, and no transition between them worth the
 * name. Everything else about the style is a consequence: the tempo is
 * mid-range because the two halves have to be the *same* tempo for the jump to
 * land, the harmony is `hard`'s with the ♭II borrowed from `stoner`, and the
 * drums are the loudest thing in the mix because that is what a room mic sounds
 * like when the engineer has stopped apologising for it.
 *
 * `feels: [['straight', 5], ['halftime', 3]]` is the declaration this style
 * needs and the field's own doc warns is expensive. It is worth it here for a
 * reason no other style in the file can claim: the *feel change* is the
 * arrangement. A verse felt in half time under a chorus felt straight is the
 * gesture, drawn per section, and there is no other way to say it — a style that
 * wrote out two drum patterns would get one of them for the whole song, since
 * the pattern is the band's identity and is fixed by `song.ts` on purpose.
 *
 * `pentatonicLead`: the tune is a riff sung, which is more literally true here
 * than anywhere else in the file — a great many of these vocal lines are the
 * guitar figure with words on it.
 */
const grunge: Style = {
  id: 'grunge',
  label: 'Grunge',
  description:
    'A clean verse and four tracks of distortion on the chorus at the same tempo, with the drums the loudest thing in the room.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [88, 126],
  swing: 0,
  modeWeights: { minor: 0.62, major: 0.38 },
  relativeMajorChorus: 0,
  vary: { bass: 0.06, comp: 0.08 },
  feels: [['straight', 5], ['halftime', 3]],
  scaleForChord: pentatonicLead,
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'III', 'III', 'VI', 'VI'], weight: 5 },
      { chords: ['i', 'i', 'bII', 'bII', 'i', 'i', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'VI', 'i', 'VII', 'VI', 'VI'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'III', 'III', 'VI', 'VI', 'i', 'i'], weight: 4 },
      { chords: ['bII', 'bII', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    outro: [
      { chords: ['VI', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i'], weight: 3 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'bIII', 'bIII', 'bVI', 'bVI', 'IV', 'IV'], weight: 5, note: 'Three borrowed chords in eight bars, and the tonic is still major. The whole decade\'s harmony is in this line — a major key played out of the parallel minor' },
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['bVI', 'bVII', 'I', 'I', 'bVI', 'bVII', 'I', 'I'], weight: 5 },
      { chords: ['IV', 'IV', 'bIII', 'bIII', 'I', 'I', 'I', 'I'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 8], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [16], weight: 3 },
    { cell: [-8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [-4, 12], weight: 3 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [rootEights(6), pentatonicRiff(4), heldRoot(3)],
  comp: [ringingChord(5), chug(4), wall(4)],
  drums: [backbeat(5), halftime(4), backbeatOpen(4)],
  melody: { leap: 0.28, ornament: 0.2, span: 12, sequence: 0.6, syncopation: 0.3 },
};

/**
 * ALT — the middle of the nineties, and the one style here defined by what it is
 * not doing.
 *
 * No riff, no solo worth the name, no shuffle, no organ, and a guitar sound that
 * is overdriven rather than distorted. What is left is a *song* played by a rock
 * band, which sounds like a description of nothing until you notice that no
 * other style in this file is that: everything before 1988 here is organised
 * around either a riff or a production, and this is organised around eight bars
 * of verse.
 *
 * So the tables are the most harmonically ordinary in the genre after `beat`'s,
 * and the interest is in the mode weights — a dead heat, which nothing else here
 * comes close to. An alternative record is as likely to be in one as the other
 * and frequently cannot decide, which is what the borrowed ♭III and ♭VI in the
 * major tables are doing.
 */
const alt: Style = {
  id: 'alt',
  label: 'Alternative',
  description:
    'No riff, no solo and no shuffle: eight bars of verse played by a rock band with the guitars overdriven rather than distorted.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [104, 140],
  swing: 0,
  modeWeights: { minor: 0.5, major: 0.5 },
  relativeMajorChorus: 0,
  vary: { bass: 0.1, comp: 0.12 },
  progressions: {
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'vi', 'vi', 'IV', 'IV'], weight: 5 },
      { chords: ['I', 'bIII', 'IV', 'IV', 'I', 'bIII', 'IV', 'IV'], weight: 4 },
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'I'], weight: 4 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'bVI', 'bVII', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'IV'], weight: 4 },
      { chords: ['IV', 'V', 'vi', 'vi', 'IV', 'V', 'I', 'I'], weight: 3 },
    ],
    bridge: [
      { chords: ['vi', 'vi', 'bIII', 'bIII', 'IV', 'IV', 'IV', 'IV'], weight: 4 },
    ],
    outro: [
      { chords: ['IV', 'I', 'IV', 'I'], weight: 4 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VI'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'VI', 'VI', 'VII', 'VII'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'III', 'III'], weight: 5 },
      { chords: ['III', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [8, 4, 4], weight: 3 },
    { cell: [-2, 2, 4, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  /**
   * The octave leads, and the relentless eighths sit second — which is the one
   * table decision that separates this style from `punk` and `newwave`.
   *
   * Eight identical roots a bar is a *tempo* device: it works at 180 and it is
   * how a punk bass player keeps a song upright. At 120 it stops being urgent
   * and becomes a drone with a pick on it, and what an alternative bass player
   * does with that space instead is the oldest figure there is — the root and
   * the octave, alternating, which leaves the guitar the whole of the offbeat.
   */
  bass: [rootOctave(5), rootEights(4), pushedRoot(4)],
  comp: [ringingChord(5), downstrokes(4), chug(3)],
  drums: [backbeat(6), backbeatOpen(4), backbeatSixteens(3)],
  melody: { leap: 0.3, ornament: 0.22, span: 13, sequence: 0.55, syncopation: 0.35 },
};

/**
 * INDIE — quieter, and on purpose.
 *
 * The same decade as `alt` and a different room: a band that has decided not to
 * be loud, playing clean guitars in a studio that cost four hundred pounds a
 * day. What separates it from `jangle`, which it obviously descends from, is the
 * *harmony* — indie kept the twelve-string and lost the resolution, so `ii` and
 * `vi` and `IV` go round without ever arriving, and a fair number of these
 * verses do not contain the tonic chord at all.
 *
 * `excludeLayers: ['brass']`. Not a horn section in sight for a decade, and it
 * is the one negative claim this style makes with any confidence.
 */
const indie: Style = {
  id: 'indie',
  label: 'Indie',
  description:
    'Clean guitars, no horns and no resolution: chord sequences that go round without arriving, and a band that has decided not to be loud.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [118, 152],
  swing: 0,
  modeWeights: { minor: 0.38, major: 0.62 },
  relativeMajorChorus: 0,
  vary: { bass: 0.12, comp: 0.15 },
  excludeLayers: ['brass'],
  progressions: {
    verse: [
      { chords: ['vi', 'vi', 'IV', 'IV', 'ii', 'ii', 'V', 'V'], weight: 5, note: 'Eight bars with no tonic chord in them. The key is unambiguous and the band simply never lands on it, which is the whole harmonic manner of the style' },
      { chords: ['I', 'ii', 'IV', 'IV', 'I', 'ii', 'IV', 'IV'], weight: 4 },
      { chords: ['IV', 'IV', 'I', 'I', 'vi', 'vi', 'V', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'V', 'vi', 'vi', 'IV', 'V', 'I', 'I'], weight: 5 },
      { chords: ['I', 'IV', 'vi', 'V', 'I', 'IV', 'V', 'V'], weight: 4 },
      { chords: ['ii', 'IV', 'I', 'V', 'ii', 'IV', 'V', 'V'], weight: 3 },
    ],
    bridge: [
      { chords: ['vi', 'iii', 'IV', 'IV', 'vi', 'iii', 'V', 'V'], weight: 4 },
    ],
    outro: [
      { chords: ['IV', 'V', 'vi', 'vi'], weight: 4, note: 'Ending on the relative minor, which is not the tonic and is not meant to be' },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['III', 'III', 'VII', 'VII', 'iv', 'iv', 'VI', 'VI'], weight: 5 },
      { chords: ['i', 'VII', 'III', 'VI', 'i', 'VII', 'III', 'III'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'III', 'VII', 'i', 'VI', 'III', 'VII', 'VII'], weight: 4 },
      { chords: ['iv', 'VI', 'III', 'VII', 'iv', 'VI', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [6, 2, 8], weight: 3 },
    { cell: [-2, 2, 4, 8], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [rootOctave(5), melodicBass(4), rootEights(4)],
  comp: [jangleArp(6), ringingChord(4), chug(2)],
  drums: [backbeat(6), tambourineBeat(3), backbeatOpen(3)],
  melody: { leap: 0.32, ornament: 0.25, span: 14, sequence: 0.5, syncopation: 0.4 },
};

/**
 * SHOEGAZE — the guitar as a sustained object, and the tune underneath it.
 *
 * The one style in this genre that is arranged like ambient, and the fields say
 * so rather than the prose: `requireLayers: ['pad']`, `wall` at the head of the
 * comp table with `sustain: true`, `heldRoot` in the bass, and `melody.span` at
 * 8 semitones, which is the narrowest in the file by a distance.
 *
 * That last number is the style's actual claim. A shoegaze vocal is *not
 * quiet* — it is mixed at the same level as everything else and it is buried
 * because everything else is enormous — and what it does about that is stop
 * moving: five or six notes, held, with no attempt to project. A line that
 * leapt about would be a singer trying to get out from under the guitars, which
 * is the one thing nobody on these records ever does.
 *
 * `sustain` on the comp is the mechanism that makes six overdubbed guitars read
 * as one held object rather than as six strummed ones. It is the same field
 * ambient's pad uses and wanted for the same reason: a chord restruck every bar
 * is a pulse, and this music has one pulse in it and it belongs to the drummer.
 */
const shoegaze: Style = {
  id: 'shoegaze',
  label: 'Shoegaze',
  description:
    'Guitars held rather than struck, a pad under all of it, and a vocal that stays inside a sixth because it has no intention of getting out from under them.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [96, 128],
  swing: 0,
  modeWeights: { minor: 0.45, major: 0.55 },
  relativeMajorChorus: 0,
  vary: { bass: 0.05, comp: 0.05 },
  requireLayers: ['pad'],
  /**
   * A step rather than a ramp: the pedal is on for the chorus and off for the
   * verse, held at one value each way.
   *
   * `shape: 'step'` is the honest reading of what a phaser or a chorus pedal
   * does in this music — it is switched, not swept, and the switch happens at a
   * section boundary. `depth: 0.35` is shallow because the effect here is a
   * *thickening* rather than a filter opening; the whole guitar sound is already
   * dark, and a deep sweep would sound like somebody turning the record down.
   */
  filter: { depth: 0.35, shape: 'step' },
  progressions: {
    verse: [
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'IV', 'IV'], weight: 5 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'I', 'I', 'bVII', 'bVII'], weight: 4 },
      { chords: ['I', 'I', 'ii', 'ii', 'IV', 'IV', 'IV', 'IV'], weight: 3 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'IV', 'IV', 'bVII', 'bVII'], weight: 5 },
      { chords: ['vi', 'vi', 'IV', 'IV', 'I', 'I', 'I', 'I'], weight: 4 },
    ],
    outro: [
      { chords: ['I', 'I', 'I', 'I'], weight: 5 },
    ],
  },
  minorProgressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VI', 'VI'], weight: 5 },
      { chords: ['i', 'i', 'III', 'III', 'i', 'i', 'III', 'III'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'III', 'III', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
  },
  melodyCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 5 },
    { cell: [-8, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 3 },
    { cell: [-4, 4, 8], weight: 3 },
    { cell: [4, 4, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-8, 8], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  bass: [heldRoot(6), rootEights(4), rootOctave(2)],
  comp: [wall(7), jangleArp(3), ringingChord(2)],
  drums: [backbeat(5), backbeatSixteens(4), halftime(3)],
  melody: { leap: 0.18, ornament: 0.2, span: 8, sequence: 0.7, syncopation: 0.25 },
};

// ---------------------------------------------------------------------------

const styles: Style[] = [
  beat, garage, surf, jangle,
  bluesrock, boogie, hard, riff, glam, psych, southern, prog, math, motorik, stoner,
  punk, newwave, postpunk, arena, ballad,
  grunge, alt, indie, shoegaze,
];

export const STYLES: Record<string, Style> = Object.fromEntries(styles.map((s) => [s.id, s]));
