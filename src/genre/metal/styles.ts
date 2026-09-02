/**
 * The metal catalogue, 1970–2000.
 *
 * Organised by **what the right hand is doing**, because in this repertoire that
 * is the question every other difference is downstream of. A Sabbath bar is one
 * guitar hitting a chord and letting it ring; a NWOBHM bar is a gallop, an eighth
 * and two sixteenths repeated until it becomes a horse; a thrash bar is sixteen
 * downstrokes with the palm on the bridge; a black metal bar is sixteen
 * *alternate* strokes with the palm off it and the chord left open. Those four
 * right hands produce four different musics out of nearly the same notes, and the
 * notes are not where the difference is.
 *
 * Twenty-four styles across four eras. Sort them by tempo and you get one long
 * acceleration from 55 to 260 with a single dip in the middle where groove metal
 * slowed everything back down on purpose. Sort them by right hand and the four
 * families stay four families.
 *
 * ## Three figures are the genre, so they are declared once
 *
 * The same argument reggae's table makes about the skank and the one drop. Three
 * things run through this whole catalogue unchanged, and writing them out
 * twenty-four times would say the opposite of what is true — that the gallop is
 * something `nwobhm` happens to do, rather than the thing half the genre is.
 *
 *  - **The downpick.** Sixteen sixteenths, every one of them a downstroke. Slots
 *    0 through 15, a sixteenth long each, velocities almost but not quite flat.
 *    The "almost" is the whole articulation: a wrist doing four strokes a beat at
 *    190 BPM cannot make them identical, and a figure written dead flat reads as a
 *    sequencer rather than as somebody's forearm. `downpick` below leans the
 *    beat heads by about 12% and lets everything else sit.
 *  - **The gallop.** One eighth and two sixteenths, per beat, forever: slots 0,
 *    2 and 3 of every group of four. Written out for a 4/4 bar that is
 *    `[0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15]`, and the reverse gallop — two
 *    sixteenths and an eighth — is `[0, 1, 2, 4, 5, 6, …]`. They are not the same
 *    figure backwards; the first pushes and the second drags, and every band that
 *    uses one uses it exclusively.
 *  - **The power chord.** Two voices, root and fifth, and no third, argued at
 *    `POWER` below. That comment used to be the longest in this file because it
 *    was the one place the engine and the genre disagreed; `core/voicing.ts` has
 *    a `'power'` style now and it is still the longest, because what the
 *    disagreement cost is worth keeping written down.
 *
 * ## What is uniform across the file, and why each is a decision
 *
 *  - **`boxDrums: false` on twenty-three of twenty-four.** Metal is a drummer.
 *    The field's own doc makes the distinction this needs: a low weight still
 *    fires sometimes, and a preset box playing a blast beat is not a quieter
 *    version of the style, it is the style with its subject removed. `industrial`
 *    is the exception and it is the exception on purpose — there the machine is
 *    the point, and the two eras that name `box` at all only ever reach it there.
 *  - **`comp` is required everywhere**, and three styles require a second layer
 *    beside it. This bullet used to read *`requireLayers: ['comp']` everywhere*
 *    and the literal array is not what is everywhere: `shred` writes
 *    `['comp', 'melody']` and `symphonic` and `gothic` both write
 *    `['comp', 'pad']`. The claim the paragraph is actually making survives all
 *    three — every one of the twenty-four requires the rhythm guitar, and the
 *    three exceptions add to it rather than substituting for it, which is why
 *    `breakCarrier: 'comp'` in the next bullet is still safe on all of them. The
 *    comp layer is the rhythm
 *    guitar, and the arranger's default treats a chordal part as something added
 *    when there is room. That is right for a dance band and exactly backwards
 *    here: an arrangement of this music that thins out by dropping the rhythm
 *    guitar has removed the instrument the song is made of. Ambient needed
 *    `requireLayers` for the pad and this genre needs it for the same reason,
 *    one layer to the left.
 *  - **`breakCarrier: 'comp'` everywhere**, and it is the bullet above that makes
 *    it safe. A break is the band stopping and one voice left in the open, and in
 *    this music that voice is the guitars — a breakdown played by the bass is a
 *    different gesture from a different genre. The engine's default is `bass` and
 *    it is the right default: it cannot tell a drone from a walking line, and a
 *    carrier that is not sounding at the seam leaves a silent bar. What makes the
 *    guitars nameable here is that `requireLayers` puts them in every section of
 *    every song, so naming them loses no seams at all — measured with every
 *    style's palette forced to `break`, sixty seeds each, **2101 breaks ran under
 *    `comp` and 2101 under `bass`**, the same seams to the last one.
 *
 *    The cost is two bars in those 2101, both in `heavy`, and they are worth
 *    knowing about because of *why*. Regenerate either of them at `hook:
 *    'through'` and the comp plays the bar; at all four levels that quote a
 *    figure it does not, because the quote rewrites the phrase end and a
 *    `sustain: true` comp spends the last two bars' chord inside the
 *    second-to-last bar, leaving the last one to the rest of the band — which the
 *    break then takes away. Hook-dependent, and harmless to the guarantee that
 *    made the carrier a table entry in the first place: *whether* a break happens
 *    and whether the kit is emptied are settled from the plan and the style,
 *    neither of which the tune can move. It is one bar in a thousand coming out
 *    quiet, rather than a drum part that changes with `--hook`.
 *  - **No `vary`.** The rhythm section does not play its figure differently at
 *    the end of a phrase. This is stronger than reggae's version of the same
 *    refusal: sixteen bars of identical downpicked sixteenths is not a
 *    limitation a thrash band is working around, it is the thing being
 *    demonstrated, and a guitarist who decorated bar eight would be admitting
 *    they could not do bar sixteen.
 *  - **`relativeMajorChorus: 0` almost everywhere.** The lift from i to III is a
 *    dance band's gesture. The two styles that carry any of it at all are `glam`
 *    and `power`, which are the two that are honestly writing pop songs.
 *  - **`swing: 0` everywhere but two.** `stoner` and `heavy` carry a little,
 *    because the first generation of this music was still a blues band with the
 *    volume up — Sabbath's "N.I.B." and half of Zeppelin swing audibly — and
 *    both set `boxDrums: false` for it anyway.
 */

import type {
  BassPattern, CompPattern, DrumPattern, HarmonyProfile, Style,
} from '../../style/types.js';

// ---------------------------------------------------------------------------
// The power chord
// ---------------------------------------------------------------------------

/**
 * Two voices, root and fifth, and no third at any number of them.
 *
 * ## What a power chord is
 *
 * Root and fifth, doubled at the octave, and **nothing else**. It is not a triad
 * with a note missing; it is a deliberately incomplete object, and the
 * incompleteness is the sound. A distorted amplifier is a non-linear device: feed
 * it two notes and it produces sum and difference tones for every pair of
 * partials, so a major third at high gain generates a thicket of intermodulation
 * that a fifth — whose partials line up at 3:2 — does not. That is a physical
 * fact about the instrument rather than a taste, and it is why the same voicing
 * that sounds thin on a clean guitar sounds enormous on a dirty one.
 *
 * The consequence that matters harmonically is that **the chord has no quality**.
 * `i` and `I` are the same two notes on the fretboard. So a metal progression
 * does not assert major or minor at all; the mode lives entirely in the melody
 * and in whatever the bass is doing, which is exactly why `scaleForChord` in
 * `index.ts` follows the key and why this genre can move between aeolian,
 * phrygian and phrygian dominant inside one riff without anything underneath
 * having to agree.
 *
 * That paragraph is about the *chord* and is untouched by how the chord is
 * spelled. `voicing` is one instrument's way of playing what the chart says: the
 * chart still says `i`, the bass still spells it, the tune still argues the mode
 * on its own, and nothing downstream of this line learns anything new about the
 * harmony. Which is why this is a `VoicingStyle` and not a `ChordQuality`.
 *
 * ## What this used to say, and what the workaround cost
 *
 * `chooseTones` in `core/voicing.ts` will not drop the third, and it is right not
 * to: *the third and the seventh are what the chord is*, and the measurement
 * behind that sentence — 16% of iskelmä voicings with no quality at all,
 * dominants with no leading tone — is real. For as long as that was the only
 * routine in the file, the sole escape from it was `voicing: 'quartal'` at
 * `voices: 2`, which stacks *scale* degrees rather than chord tones and therefore
 * never asks for a third at all. Three scale steps is a perfect fourth in a
 * seven-note mode, and a fourth is a fifth inverted — the same two pitch classes
 * in the other order, which is a power chord played in the wrong place on the
 * neck. This table took that trade and wrote down what it cost.
 *
 * `'power'` now exists and is argued at `powerTones`: root and fifth built from
 * the chord, through the ordinary inversion, ceiling and voice-leading machinery
 * that `voiceQuartal` bypasses. Re-measured across this catalogue — twenty-four
 * styles, eight songs each, about 274,000 comp onsets on each side:
 *
 *                             quartal   power
 *     a perfect fifth            1.5%   90.1%   — the chord as a guitarist plays it
 *     a perfect fourth          68.5%    7.4%   — the same two notes, inverted
 *     a tritone                 25.7%    0.1%
 *     a third or a sixth         4.3%    2.3%   — the four styles that voice triads
 *     a register-limit fault    16.6%    0.6%
 *
 * **The tritones were arithmetic rather than taste**, which is why they came out
 * at a quarter of the catalogue rather than at a trickle: three scale steps up
 * from a mode's ♭2 or its ♭6 is six semitones and not seven, and `bII` and `VI`
 * are two of the four chords this genre plays most. Every one of the 70,000 of
 * them landed on an ordinary major chord — `VI`, `bII`, `IV`, `bVII` — where the
 * fifth is perfect and six semitones is simply not the interval that was asked
 * for. So the genre spent a quarter of its comping on the interval it is most
 * often accused of being about, in the bars where it had not asked for it.
 *
 * **The fourth row is the one nothing in the old table measured.** `voiceQuartal`
 * is the one routine in `core/voicing.ts` that never consults `minInterval`: it
 * steps the scale and slides the finished stack into the window, so it does not
 * merely voice the wrong interval, it voices it anywhere — mostly a fourth
 * sitting below C3, where the low-interval limit is a fifth and the ear hears a
 * beating rumble rather than a chord. That is a sixth of every comp onset in the
 * genre, and going through the ordinary placement machinery is what removes it.
 *
 * ## What it still costs
 *
 * Three things, and none of them is a residue of the fault above.
 *
 *  - **Single-note onsets rise, 0.8% to 3.6%.** Where the comp's window is low
 *    and its top is not clear of the nearest root by the interval that register
 *    demands, the shape has nowhere to go and the voicer hands back the root
 *    alone. Those are the same onsets `quartal` was filling with a fault, and one
 *    note is a rhythm guitarist playing one string — a fourth at A1 is not a
 *    thinner power chord, it is a rumble. `minInterval` is not the place to argue
 *    about a drop-tuned guitar living at C2–G2: all fourteen genres are voiced
 *    through that table.
 *  - **The 0.1% of tritones that survive are `techdeath` and are correct.** Every
 *    one of them is that style's `iio`, whose fifth *is* a tritone; its own
 *    description says diminished arpeggios and its verse writes the chord on
 *    purpose. The honest voicing of an altered fifth is the altered fifth —
 *    `chooseTones` says the same thing two functions up, where a ♭5 is the one
 *    fifth it refuses to drop — and putting a perfect fifth there instead would
 *    be a wrong note under a bass and a tune that are both spelling the real
 *    chord.
 *  - **The comp collides with the tune more often**, 17.7% to 24.9% of onsets
 *    sounding an octave from a melody note. The mechanism is not subtle: the
 *    root and the fifth are the two notes a tune in the key spends most of its
 *    time on. `resolveCollisions` and the arranger's ceiling are the levers, and
 *    both are already pulled.
 *
 * ## Two voices, because the octave is the bass's
 *
 * `powerTones` will double outward as far as it is asked to — three voices adds
 * the octave, four the octave fifth — and this table asks for two. A third voice
 * would be the guitar stating a note the arrangement already has: `followRiff`,
 * `poundBass` and `fifths` next door put the bass on the same root an octave
 * down, note for note, because in this music the bass plays the guitar part
 * rather than outlining the harmony.
 *
 * **The third voice is not refused because it collides**, and that is worth
 * saying because it is the obvious guess and it is wrong. Measured over the
 * catalogue at both settings, comp onsets sounding an octave from a melody note
 * are 25.2% either way, to the tenth of a point — an octave root is a pitch class
 * the chord already had, so it can collide with nothing the first two voices were
 * not colliding with already. What it actually costs is 26% more notes for the
 * same music, 394k against 496k across the catalogue, all of them a doubling of
 * a doubling. `rock/styles.ts` takes three for the opposite reason and says so:
 * there the bass is playing a line rather than the guitar part, so the octave in
 * the shape is the only one in the band.
 *
 * A handful of styles deliberately do not use this — `glam`, `power`, `gothic`
 * and `symphonic` voice real triads, because those four have a singer on top of a
 * chord that is meant to be major or minor and the ambiguity would cost them the
 * tune. Each says so at its own table.
 */
const POWER = { voices: 2, voicing: 'power' } as const;

/**
 * Sixteen downstrokes.
 *
 * The defining physical act of thrash guitar and the reason the style has a
 * tempo ceiling: alternate picking has no ceiling worth speaking of, and a wrist
 * doing sixteen *downs* to the bar runs out somewhere around 220 BPM. Every
 * argument about how fast thrash could go was an argument about that limit.
 *
 * The velocities lean the four beat heads and leave the rest alone, which is a
 * 12% spread. Flatter than that is a sequencer; wider than that is somebody
 * accenting, and the whole discipline of this figure is that nobody is accenting
 * — the accent comes from the drummer and the guitar is a wall.
 */
const downpick = (weight: number): CompPattern => ({
  name: 'downpick', weight, ...POWER,
  hits: [
    { at: 0, dur: 1, vel: 0.98 }, { at: 1, dur: 1, vel: 0.86 },
    { at: 2, dur: 1, vel: 0.88 }, { at: 3, dur: 1, vel: 0.86 },
    { at: 4, dur: 1, vel: 0.96 }, { at: 5, dur: 1, vel: 0.86 },
    { at: 6, dur: 1, vel: 0.88 }, { at: 7, dur: 1, vel: 0.86 },
    { at: 8, dur: 1, vel: 0.97 }, { at: 9, dur: 1, vel: 0.86 },
    { at: 10, dur: 1, vel: 0.88 }, { at: 11, dur: 1, vel: 0.86 },
    { at: 12, dur: 1, vel: 0.96 }, { at: 13, dur: 1, vel: 0.86 },
    { at: 14, dur: 1, vel: 0.88 }, { at: 15, dur: 1, vel: 0.86 },
  ],
});

/**
 * The same sixteen strokes with the palm off the bridge and the chord left
 * ringing — tremolo picking, which is the other half of extreme metal and is a
 * genuinely different part rather than a louder downpick.
 *
 * A downpicked note is 60 ms of attack and then nothing; a tremolo-picked one is
 * held, so the chords overlap into a continuous band of sound with a rhythm
 * scraped across the front of it. `dur: 2` against a spacing of 1 is what says
 * that here — every stroke lasts twice as long as the gap before the next, so the
 * part sustains through itself. Flat velocities, because alternate picking is
 * symmetrical and there is nothing in the hand to make one stroke heavier.
 */
const tremolo = (weight: number): CompPattern => ({
  name: 'tremolo', weight, ...POWER,
  hits: Array.from({ length: 16 }, (_, i) => ({ at: i, dur: 2, vel: 0.9 })),
});

/**
 * The gallop: an eighth and two sixteenths, four times a bar.
 *
 * Slots 0, 2 and 3 of every beat. It is the most recognisable rhythmic figure in
 * the genre and it belongs to the *picking hand rather than to any one part* —
 * "Run to the Hills" is the kick drum playing it, "The Trooper" is the guitar,
 * and most records that have it have it on both at once, which is why it appears
 * below as a comp factory and again as a kit factory with the identical slots.
 */
const gallopChop = (weight: number): CompPattern => ({
  name: 'gallop', weight, ...POWER,
  hits: [
    { at: 0, dur: 2, vel: 0.98 }, { at: 2, dur: 1, vel: 0.82 }, { at: 3, dur: 1, vel: 0.84 },
    { at: 4, dur: 2, vel: 0.94 }, { at: 6, dur: 1, vel: 0.8 }, { at: 7, dur: 1, vel: 0.82 },
    { at: 8, dur: 2, vel: 0.96 }, { at: 10, dur: 1, vel: 0.82 }, { at: 11, dur: 1, vel: 0.84 },
    { at: 12, dur: 2, vel: 0.94 }, { at: 14, dur: 1, vel: 0.8 }, { at: 15, dur: 1, vel: 0.82 },
  ],
});

/** Straight eighths, palm-muted. The default rhythm guitar of the whole genre. */
const chug = (weight: number): CompPattern => ({
  name: 'chug', weight, ...POWER,
  hits: [
    { at: 0, dur: 2, vel: 0.98 }, { at: 2, dur: 2, vel: 0.84 },
    { at: 4, dur: 2, vel: 0.94 }, { at: 6, dur: 2, vel: 0.84 },
    { at: 8, dur: 2, vel: 0.96 }, { at: 10, dur: 2, vel: 0.84 },
    { at: 12, dur: 2, vel: 0.94 }, { at: 14, dur: 2, vel: 0.86 },
  ],
});

/**
 * One chord, struck on the downbeat, left to ring for the whole bar.
 *
 * `sustain: true` is what makes this a doom part rather than a slow chug: with
 * it, four bars of the same chord are one enormous event instead of four
 * separate ones, and four separate ones at 55 BPM is a band counting. Exactly
 * the mechanism ambient's drone uses and for exactly the same reason, which is
 * worth saying out loud — a doom riff and a drone are closer relatives than
 * either is to anything else in this project.
 */
const hold = (weight: number): CompPattern => ({
  name: 'hold', weight, ...POWER, sustain: true,
  hits: [{ at: 0, dur: 16, vel: 1 }],
});

/**
 * Two chords a bar with a hole between them, the second one anticipated.
 *
 * The groove-metal figure: everything is on the beat except the thing that is
 * not, and the syncopation only reads because the bar around it is empty. Slot 7
 * is an eighth ahead of beat three, which is where Pantera put nearly everything.
 */
const stabs = (weight: number): CompPattern => ({
  name: 'stabs', weight, ...POWER,
  hits: [
    { at: 0, dur: 3, vel: 1 },
    { at: 7, dur: 3, vel: 0.92 },
    { at: 12, dur: 2, vel: 0.86 }, { at: 14, dur: 2, vel: 0.8 },
  ],
});

/**
 * Triads, three voices, tertian — the four styles that need the chord to have a
 * quality.
 *
 * Not a relaxation of `POWER` but a different instrument's part. A power chord is
 * a rhythm-guitar object; this is what happens when the arrangement is being
 * carried by an organ, a string section or a keyboard, and those cannot state
 * "the chord is minor" by omission the way a guitar can. `gothic`, `symphonic`,
 * `power` and `glam` use it, and each of the four has a singer whose line would
 * be sitting over an unresolved question otherwise.
 *
 * It stays tertian, and now that is a choice between two spellings rather than
 * the only one on offer. Nothing about these four was a workaround: they were
 * written asking for the third and they still are, and the 2.3% of comp onsets
 * in the catalogue that sound one are almost exactly these tables. The `chug`
 * and `gallopChop` figures sitting beside them in the same `comp` arrays are
 * `POWER`, which is what a rhythm guitarist plays under a string section.
 */
const triads = (weight: number, hits: CompPattern['hits']): CompPattern => ({
  name: 'triads', weight, voices: 3, hits,
});

// ---------------------------------------------------------------------------
// The bass
// ---------------------------------------------------------------------------

/**
 * The bass doubles the riff, and the tones are **numbers**.
 *
 * `BassTone`'s own doc makes the distinction this genre lives on: a named
 * function like `'fifth'` renegotiates with each chord, which is what a walking
 * line wants; a literal semitone count is a *shape*, re-rooted and otherwise left
 * alone. A metal bass line is not outlining harmony, it is playing the guitar
 * part an octave down, and the guitar part is a shape. `0` and `7` below are the
 * root and the fifth taken literally, which is the same object `POWER` above now
 * puts in the guitar's hands — and the reason that one asks for two voices rather
 * than three. The octave doubling of a power chord is *this line*, and a band has
 * one of it.
 *
 * Six roots and then the fifth and the flat seventh as one lift into the next
 * bar. Root, fifth, root, fifth on beats three and four was a see-saw at the end
 * of every bar in twenty styles.
 *
 * `doubles`: wherever the guitar has a rhythm the bass takes it note for note,
 * which is what the first sentence says this line is. The eighths below play
 * under a held chord, where there is nothing to double.
 */
const followRiff = (weight: number): BassPattern => ({
  name: 'follow', weight, doubles: true,
  hits: [
    { at: 0, dur: 2, tone: 0, vel: 1 }, { at: 2, dur: 2, tone: 0, vel: 0.84 },
    { at: 4, dur: 2, tone: 0, vel: 0.94 }, { at: 6, dur: 2, tone: 0, vel: 0.84 },
    { at: 8, dur: 2, tone: 0, vel: 0.96 }, { at: 10, dur: 2, tone: 0, vel: 0.84 },
    { at: 12, dur: 2, tone: 7, vel: 0.9 }, { at: 14, dur: 2, tone: 10, vel: 0.86 },
  ],
});

/** Sixteenths on the root: the bass under a downpicked guitar, note for note. */
const poundBass = (weight: number): BassPattern => ({
  name: 'pound', weight,
  hits: Array.from({ length: 16 }, (_, i) => ({
    at: i, dur: 1, tone: 0 as const, vel: i % 4 === 0 ? 0.98 : 0.84,
  })),
});

/** The gallop, an octave down. */
const gallopBass = (weight: number): BassPattern => ({
  name: 'gallop-bass', weight,
  hits: [
    { at: 0, dur: 2, tone: 0, vel: 1 }, { at: 2, dur: 1, tone: 0, vel: 0.82 }, { at: 3, dur: 1, tone: 0, vel: 0.84 },
    { at: 4, dur: 2, tone: 0, vel: 0.94 }, { at: 6, dur: 1, tone: 0, vel: 0.8 }, { at: 7, dur: 1, tone: 0, vel: 0.82 },
    { at: 8, dur: 2, tone: 0, vel: 0.96 }, { at: 10, dur: 1, tone: 7, vel: 0.82 }, { at: 11, dur: 1, tone: 7, vel: 0.84 },
    { at: 12, dur: 2, tone: 0, vel: 0.94 }, { at: 14, dur: 1, tone: -5, vel: 0.8 }, { at: 15, dur: 1, tone: -5, vel: 0.82 },
  ],
});

/**
 * Root, the fifth below, the fifth above and the octave — the power chord
 * played as a line, and the one bass figure in this project that is a *chord*
 * rather than a melody.
 *
 * `-5` is the fifth below rather than a fourth above, and the sign is the whole
 * point: the open A string under an E is where a bass player goes for this, and
 * the same interval taken upward would put the figure in the guitar's register
 * and turn a foundation into a countermelody.
 *
 * **The octave on the last slot is the note this figure was written without,**
 * and the span is seventeen semitones with it. It was cut to twelve for a wall
 * that is not there. An earlier version reached past the octave —
 * nineteen semitones end to end — and `clampToRange` at the top of the bass's
 * range folded two of the shape's notes onto one pitch, every pitch class
 * preserved and the figure destroyed. `a riff is the same shape over every chord
 * quality` caught it at 8 bars flattened per style, on eleven styles, with
 * nothing else reporting anything wrong, and the response was to narrow the
 * figure until it stopped.
 *
 * The clamp was the fault and the cut was a workaround for it. `placeRoot`
 * scores every octave of the root against the whole span now, and the reach it
 * scores against is 35 semitones, so **every span up to 24 stands at all twelve
 * roots** — see `unplaceableRoots`, which is where that number is derived and
 * which `npm run genres` asserts over the whole catalogue. Seventeen is inside
 * it with room to spare, and so was the nineteenth. Root, fifth below, fifth
 * above, octave above is the power chord with all three of its voices, which is
 * what a figure named `fifths` was for; ending the bar on the octave also drops
 * a full octave into the downbeat that restates the root, which is the gesture
 * the guitars are making over the top of it.
 */
const fifths = (weight: number): BassPattern => ({
  name: 'fifths', weight,
  hits: [
    { at: 0, dur: 4, tone: 0, vel: 1 },
    { at: 4, dur: 2, tone: -5, vel: 0.86 },
    { at: 6, dur: 2, tone: 0, vel: 0.88 },
    { at: 8, dur: 4, tone: 0, vel: 0.96 },
    { at: 12, dur: 2, tone: 7, vel: 0.84 },
    { at: 14, dur: 2, tone: 12, vel: 0.88 },
  ],
});

/** One note, held, merged across the barline. The doom bass. */
const holdBass = (weight: number): BassPattern => ({
  name: 'hold-bass', weight, sustain: true,
  hits: [{ at: 0, dur: 16, tone: 0, vel: 1 }],
});

/** Eight roots, the semitone above for four and the root for four: one finger moving one fret. */
const semitoneRiff = (weight: number): BassPattern => ({
  name: 'semitone-riff', weight,
  hits: Array.from({ length: 16 }, (_, i) => ({
    at: i, dur: 1, tone: i >= 8 && i < 12 ? 1 : 0, vel: i % 4 === 0 ? 0.98 : 0.84,
  })),
});

/** Root, root, tritone, fifth in pairs of eighths: the Sabbath stomp an octave down. */
const tritoneStomp = (weight: number): BassPattern => ({
  name: 'tritone-stomp', weight,
  hits: [
    { at: 0, dur: 2, tone: 0, vel: 1 }, { at: 2, dur: 2, tone: 0, vel: 0.84 },
    { at: 4, dur: 2, tone: 0, vel: 0.94 }, { at: 6, dur: 2, tone: 0, vel: 0.84 },
    { at: 8, dur: 2, tone: 6, vel: 0.96 }, { at: 10, dur: 2, tone: 6, vel: 0.86 },
    { at: 12, dur: 2, tone: 7, vel: 0.94 }, { at: 14, dur: 2, tone: 7, vel: 0.86 },
  ],
});

/** Six roots and a fall through the minor third and the semitone back onto the root. */
const dropRun = (weight: number): BassPattern => ({
  name: 'drop-run', weight,
  hits: [
    { at: 0, dur: 2, tone: 0, vel: 1 }, { at: 2, dur: 2, tone: 0, vel: 0.84 },
    { at: 4, dur: 2, tone: 0, vel: 0.94 }, { at: 6, dur: 2, tone: 0, vel: 0.84 },
    { at: 8, dur: 2, tone: 0, vel: 0.96 }, { at: 10, dur: 2, tone: 0, vel: 0.84 },
    { at: 12, dur: 2, tone: 3, vel: 0.92 }, { at: 14, dur: 2, tone: 1, vel: 0.88 },
  ],
});

/** Four roots, the flat sixth twice and the fifth twice: the fall every neoclassical riff makes. */
const sixthFall = (weight: number): BassPattern => ({
  name: 'sixth-fall', weight,
  hits: [
    { at: 0, dur: 2, tone: 0, vel: 1 }, { at: 2, dur: 2, tone: 0, vel: 0.84 },
    { at: 4, dur: 2, tone: 0, vel: 0.94 }, { at: 6, dur: 2, tone: 0, vel: 0.84 },
    { at: 8, dur: 2, tone: 8, vel: 0.96 }, { at: 10, dur: 2, tone: 8, vel: 0.86 },
    { at: 12, dur: 2, tone: 7, vel: 0.94 }, { at: 14, dur: 2, tone: 7, vel: 0.86 },
  ],
});

/** A half-bar root and then the minor third and the fourth as quarters: the slow riff. */
const slowRiff = (weight: number): BassPattern => ({
  name: 'slow-riff', weight,
  hits: [
    { at: 0, dur: 8, tone: 0, vel: 1 },
    { at: 8, dur: 4, tone: 3, vel: 0.92 },
    { at: 12, dur: 4, tone: 5, vel: 0.9 },
  ],
});

// ---------------------------------------------------------------------------
// The kit — this genre's clock
// ---------------------------------------------------------------------------

/**
 * The rock backbeat, and the only pattern here that any other genre would
 * recognise. Kick on one and the "and" of three, snare on two and four, eighths
 * on the hats.
 */
const backbeat = (weight: number): DrumPattern => ({
  name: 'backbeat', weight,
  voices: {
    bd: [0, 10],
    sd: [4, 12],
    hh: [0, 2, 4, 6, 8, 10, 12, 14],
  },
});

/** The same, ridden rather than hatted — what a drummer does once it is loud. */
const rideBeat = (weight: number): DrumPattern => ({
  name: 'ride-beat', weight,
  voices: {
    bd: [0, 6, 10],
    sd: [4, 12],
    rd: [0, 2, 4, 6, 8, 10, 12, 14],
  },
});

/**
 * **Double kick: sixteen kick drum strokes to the bar, continuously.**
 *
 * Not a fill and not an accent — a texture, and the one that separates this
 * genre's clock from everybody else's. Every other repertoire in this project
 * uses the kick to *state* something: the downbeat, the two and four, the four on
 * the floor. Here it is a continuous surface at the sixteenth, and what states
 * anything is the snare and the crash on top of it.
 *
 * Physically it is two pedals and two feet alternating, which is why the
 * velocities alternate too: the weaker foot is audibly weaker, and every drummer
 * who has ever recorded this has had an engineer trying to hide it. 0.95 against
 * 0.8 is roughly what survives onto a record.
 */
const doubleKick = (weight: number): DrumPattern => ({
  name: 'double-kick', weight,
  voices: {
    bd: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    sd: [4, 12],
    rd: [0, 2, 4, 6, 8, 10, 12, 14],
  },
});

/**
 * **The blast beat**, in its oldest form: kick and snare alternating at the
 * sixteenth, with a hand on the hats in unison with the feet.
 *
 * `bd` on the even slots, `sd` on the odd ones. Read as two limbs it is two
 * streams of eighths a sixteenth apart; read as one sound it is a continuous
 * sixteenth-note roll with the timbre flipping on every stroke, which is what a
 * listener actually hears and is the reason the beat exists at all — it is a
 * *texture* that happens to be made of hits, and past about 200 BPM it stops
 * being possible to count.
 *
 * The hats double the kick rather than running their own stream, because the
 * limb doing them is the only one left: two feet on the kicks, one hand on the
 * snare, one hand on the hats.
 */
const blast = (weight: number): DrumPattern => ({
  name: 'blast', weight,
  voices: {
    bd: [0, 2, 4, 6, 8, 10, 12, 14],
    sd: [1, 3, 5, 7, 9, 11, 13, 15],
    hh: [0, 2, 4, 6, 8, 10, 12, 14],
  },
});

/**
 * The hammer blast: the same limbs, struck *together* on the eighths instead of
 * alternating between them.
 *
 * Half the events of the blast above and twice the weight of each, which is the
 * whole difference — one is a wash and this is a machine gun. Both are called a
 * blast beat by everybody, which is why they need two rows and not one.
 */
const hammerBlast = (weight: number): DrumPattern => ({
  name: 'hammer-blast', weight,
  voices: {
    bd: [0, 2, 4, 6, 8, 10, 12, 14],
    sd: [0, 2, 4, 6, 8, 10, 12, 14],
    hh: [0, 2, 4, 6, 8, 10, 12, 14],
  },
});

/**
 * The bomb blast: sixteenths in the feet under eighths in the hands. The later,
 * heavier one, and the one that needs the double pedal the other two do not.
 */
const bombBlast = (weight: number): DrumPattern => ({
  name: 'bomb-blast', weight,
  voices: {
    bd: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    sd: [0, 2, 4, 6, 8, 10, 12, 14],
    cr: [0, 4, 8, 12],
  },
});

/**
 * **The gallop in the feet**, on the identical slots the guitar figure uses.
 *
 * The two are one gesture on two instruments, and the fact that the same twelve
 * numbers appear in a `CompPattern` and a `DrumPattern` in this file is the
 * clearest statement available that this is a genre where the drummer and the
 * guitarist are playing the same part.
 */
const gallopKit = (weight: number): DrumPattern => ({
  name: 'gallop-kit', weight,
  voices: {
    bd: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15],
    sd: [4, 12],
    rd: [0, 2, 4, 6, 8, 10, 12, 14],
  },
});

/**
 * Half time: one snare, on beat three, and everything else arranged around the
 * space that leaves.
 *
 * The breakdown, the groove-metal verse, the doom bar. At 100 BPM a snare on
 * three feels like a snare on the four of a bar at 50, which is the trick — the
 * band has not slowed down and the *beat* has, so the riff can stay busy while
 * the pulse halves underneath it.
 */
const halfTime = (weight: number): DrumPattern => ({
  name: 'half-time', weight,
  voices: {
    bd: [0, 3, 6, 10, 11],
    sd: [8],
    hh: [0, 4, 8, 12],
  },
});

/**
 * The d-beat: kick, kick-and, snare, and the whole thing again. Discharge's, and
 * the reason crossover exists — it is a punk pattern that thrash borrowed
 * wholesale and never gave back.
 */
const dbeat = (weight: number): DrumPattern => ({
  name: 'd-beat', weight,
  voices: {
    bd: [0, 6, 8, 14],
    sd: [4, 12],
    hh: [0, 2, 4, 6, 8, 10, 12, 14],
  },
});

/**
 * The crawl: two kicks, one snare on three, a ride keeping quarters, and a crash
 * on every downbeat.
 *
 * The crash is not decoration and it is not a fill either. At 58 BPM a bar lasts
 * four and a half seconds, which is longer than a 20" crash takes to die away —
 * so a cymbal struck on every downbeat produces a *continuous* wash with a fresh
 * attack in it every bar, and that wash is half of what a doom record sounds
 * like. Written into the loop rather than left to `generate/fills.ts`, because a
 * fill is a thing that happens at a seam and this happens all the time.
 */
const crawl = (weight: number): DrumPattern => ({
  name: 'crawl', weight,
  voices: {
    bd: [0, 6],
    sd: [8],
    rd: [0, 4, 8, 12],
    cr: [0],
  },
});

// ---------------------------------------------------------------------------
// Shared cell tables
// ---------------------------------------------------------------------------

/**
 * Sixteen sixteenths of melodic rhythm, for the styles whose tune is a riff.
 *
 * Short cells, and a great many of them starting with a rest. A metal vocal
 * line and a metal lead both enter *after* the riff has stated itself — the
 * guitar owns the downbeat, and a tune that also arrived there would be
 * competing with the thing it is sitting on.
 */
const RIFF_CELLS = [
  { cell: [-4, 4, 4, 4], weight: 5 },
  { cell: [4, 4, 8], weight: 5 },
  { cell: [-2, 2, 4, 8], weight: 4 },
  { cell: [2, 2, 4, 8], weight: 4 },
  { cell: [-4, 2, 2, 8], weight: 4 },
  { cell: [8, 8], weight: 3 },
  { cell: [-8, 4, 4], weight: 3 },
  { cell: [2, 2, 2, 2, 8], weight: 3 },
  { cell: [16], weight: 2 },
];

/** Longer, and settled: the end of a phrase, where the singer holds one. */
const RIFF_CADENCES = [
  { cell: [16], weight: 6 },
  { cell: [-4, 12], weight: 5 },
  { cell: [4, 12], weight: 4 },
  { cell: [-8, 8], weight: 3 },
];

/** The offbeat figures the whole band hits together. See `Style.shots`. */
const METAL_SHOTS: (readonly [number[], number])[] = [
  [[0, 6, 8], 4],
  [[0, 4, 8, 12], 4],
  [[0, 3, 6, 10], 3],
  [[0, 7, 10], 3],
  [[0, 2, 3, 8], 2],
];

/**
 * The other guitarist, playing the tune with the first one rather than around it.
 *
 * `arrangement.harmony: 8` in `index.ts` is the highest weight any genre gives any
 * device in this project, and the sentence under it is the reason five styles say
 * it again here in a different field: *it is not an arranger's touch — it is the
 * line-up*. A device pool can only say a harmonised phrase turns up in a repeat
 * chorus; `nwobhm`'s header says two people playing harmonised lines is the event
 * of 1980. Those are not one claim at two strengths, and `Device.harmony` keeps
 * making the first one — the genre weight stands, unchanged, and is still the draw
 * for the other nineteen styles, where a harmony line arriving once in a chorus is
 * exactly right.
 *
 * ## `on: 'counter'` is the right layer here rather than the reachable one
 *
 * `solo.rotation` already reads `melody` and `counter` as *"literally the two
 * guitarists in the band"*, and the palettes back it: the counter layer's top
 * entry from 1979 on is `distortionGuitar`, at 7, 9 and 7 across the three later
 * eras. So the second part is already cast on the instrument that plays it, and
 * `on: 'melody'` — a second `Track` on the lead layer, which is not built — would
 * be drafting a third guitarist to do what the second one is standing there for.
 *
 * What the declaration changes is what that player is *for*. An answering line
 * waits for a hole in the tune, and `solo.vocabulary.space: 0.1` is the lowest
 * figure in the project: this music does not leave any. A second guitarist with
 * nothing to answer into plays the line.
 *
 * ## Thirds, under, with a fifth in reserve
 *
 * `parallel-perfects` is demoted in `index.ts` to protect two figures and this is
 * the second of them, described on the way past — *"thirds mostly, but a fifth
 * wherever the mode puts one"* — which is this table in its own order. `power`'s
 * description says *twin guitars in thirds* and no style here says anything else.
 *
 * The sixth at 2 is the third inverted and is the wide version of the same pair:
 * the interval a single `harmonyBelow` reached by coin flip for the whole
 * catalogue at once, 0.65 thirds to 0.35 sixths, narrowed here toward the third
 * because these tables name the third. The fifth at 1 is one section in eleven in
 * bare parallel fifths — the harmonised power chord, and a gesture this genre
 * disabled a rule to keep: *a NWOBHM harmony line that broke off to avoid a
 * parallel fifth would be a NWOBHM harmony line with a hole in it*.
 *
 * **Signed negative, which is a decision about where the second guitarist is
 * standing rather than a default.** The descant is the other reading of this
 * figure and is what the sign was added for, and on this layer it would arrive
 * with its top gone: `RegisterPlan.counter` is `[leadLow - 4, leadTop - 3]`, sized
 * in its own words for *"a third under the tune at the top"*, and `writeLine`
 * drops a note outside that window rather than folding it by an octave — which is
 * correct, since a descant folded down is not a descant. Under the tune the same
 * window fits the third at both ends by construction. It is also what this
 * genre's lead leaves room for: `span` runs to 24 and `solo.vocabulary.climb: 6`
 * is the steepest in the project, so the first guitarist is already going up the
 * neck and the second one is not above them.
 *
 * ## No `kinds`, and no `on: 'vocal'` anywhere in this file
 *
 * The pair is a line-up rather than a section device — both of them are on stage
 * all night — so there is no kind to name, and which sections it lands in is
 * decided by where the chart put the second guitar.
 *
 * **That narrowing was most of the difference between `amount` and what is heard,
 * and it is why every style using this helper also requires the layer.**
 * `layersFor` draws the counter at `density * 0.7` in a chorus and `density * 0.45`
 * in a verse, and this genre's four eras run 0.60 to 0.72 — so the second
 * guitarist was absent from roughly half the sections the harmony was declared
 * over, and `amount` was being multiplied by a coin nobody wrote down. Measured
 * over 40 songs a style, the five realised 0.335, 0.259, 0.243, 0.160 and 0.152
 * against declarations of 0.6, 0.6, 0.5, 0.3 and 0.3; counting only the sections
 * the layer was actually in, the same songs realised 0.614, 0.576, 0.533, 0.286
 * and 0.304, which is what the tables say. `requireLayers: ['counter']` on each of
 * the five is that second column made true of the first: the line-up this
 * paragraph opens by claiming, stated where the chart reads it, leaving `amount`
 * to decide what the two guitarists play rather than whether there are two.
 *
 * Singing it is refused for the genre, by the genre: `vocals.ts` picks GM 85
 * rather than a choir patch and says why — *"there is one person on the microphone
 * here"*. Metal harmonises with amplifiers.
 */
const twinGuitars = (amount: number): HarmonyProfile => ({
  amount,
  intervals: [[-2, 8], [-5, 2], [-4, 1]],
  on: 'counter',
});

// ---------------------------------------------------------------------------
// 1970–75: the first generation
// ---------------------------------------------------------------------------

/**
 * HEAVY — Birmingham, 1970, and a band who could not afford to be a blues band
 * any more.
 *
 * Everything in this genre is downstream of four records made between February
 * 1970 and 1973 by people who were still, structurally, playing twelve-bar blues
 * with the tempo halved and the amplifier broken. The tables below say that
 * plainly: the progressions are three chords, the melody cells are long, the
 * swing is not quite zero, and the pentatonic is never more than one step away.
 *
 * What is *new* in 1970 and is the reason this is a genre rather than a loud
 * blues is the tritone. "Black Sabbath" opens on the root, the octave and the ♭5,
 * held, three times — an interval European music had spent five centuries
 * legislating against, played by a man who had lost two fingertips and could not
 * comfortably fret anything else. `tritone-leap` is disabled at the genre level
 * for this bar of music specifically, and the argument is at `index.ts`.
 */
const heavy: Style = {
  id: 'heavy',
  label: 'Heavy',
  description:
    'One guitar, three chords and a tritone: the blues at half speed through a broken amplifier, 1970. Where all of it starts.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [92, 126],
  /**
   * A shade of shuffle, and it is the last of the blues leaving the building.
   * By 1976 nothing in this genre swings at all; in 1970 the drummer had learned
   * to play behind Cream.
   */
  swing: 0.12,
  boxDrums: false,
  modeWeights: { minor: 0.82, major: 0.18 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  shots: METAL_SHOTS,
  breakCarrier: 'comp',
  requireLayers: ['comp'],
  excludeLayers: ['brass'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'bV', 'bV', 'i', 'i'], weight: 5, note: 'The tritone as a chord rather than as a passing note — the whole idea, stated once, in the first four bars of the first record' },
      { chords: ['i', 'i', 'III', 'III', 'i', 'i', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 4, note: 'Twelve-bar shape with the changes slowed to four bars each, which is most of what "heavy" meant in 1970' },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['III', 'VII', 'iv', 'i', 'III', 'VII', 'V', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VII', 'VII', 'III', 'III', 'V', 'V'], weight: 3 },
    ],
    solo: [
      { chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VII'], weight: 4 },
    ],
    outro: [
      { chords: ['VI', 'VII', 'i', 'i'], weight: 4 },
    ],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'I', 'I', 'bVII', 'bVII', 'I', 'I'], weight: 4 },
      { chords: ['I', 'bVII', 'IV', 'I', 'I', 'bVII', 'IV', 'I'], weight: 3 },
    ],
    outro: [{ chords: ['bVII', 'IV', 'I', 'I'], weight: 3 }],
  },
  melodyCells: [
    { cell: [8, 8], weight: 5 },
    { cell: [-4, 4, 8], weight: 5 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [-4, 4, 4, 4], weight: 3 },
    { cell: [-8, 8], weight: 3 },
    { cell: [6, 2, 8], weight: 3 },
  ],
  cadenceCells: RIFF_CADENCES,
  bass: [tritoneStomp(4), followRiff(6), fifths(4), poundBass(2)],
  comp: [chug(6), hold(4), stabs(3)],
  drums: [backbeat(6), rideBeat(4), halfTime(3)],
  melody: { leap: 0.3, ornament: 0.35, span: 14, sequence: 0.5, syncopation: 0.35 },
};

/**
 * DOOM — the slowest music in this project by a distance, and the argument for
 * `hold` and `crawl` above.
 *
 * 55 BPM is not "a slow version of heavy". It is a different relationship
 * between a chord and a listener: a bar is four and a half seconds, so a
 * four-chord phrase takes eighteen, and by the time the band gets back to the
 * first chord the listener has stopped tracking it as a progression and started
 * hearing it as weather. That is the whole effect, and the two things that
 * produce it are `sustain: true` on the comp and the crash written into the kit
 * loop.
 *
 * `hook: 'earworm'` looks wrong beside all that and is the correct setting.
 * Repetition level is not about tempo — it is about whether the same material
 * comes back, and this is a music where a single riff can be the entire song. A
 * doom band that developed would be a progressive band playing slowly.
 */
const doom: Style = {
  id: 'doom',
  label: 'Doom',
  description:
    'Fifty-five to seventy, chords held until they stop being chords, a crash on every downbeat and a riff that is the whole song.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [52, 74],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.94, major: 0.06 },
  relativeMajorChorus: 0,
  hook: 'earworm',
  shots: [[[0, 8], 5], [[0, 6, 12], 3]],
  breakCarrier: 'comp',
  requireLayers: ['comp'],
  excludeLayers: ['brass'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 5, note: 'Two chords in eighteen seconds. The ♭II is the only event in the phrase and it does not need help' },
      { chords: ['i', 'i', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 4, note: 'One chord. Doom is the only style here where a table of one numeral is a real entry rather than a stub' },
      { chords: ['i', 'i', 'iv', 'iv', 'bII', 'bII', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 4 },
    ],
    bridge: [
      { chords: ['bII', 'bII', 'i', 'i', 'VI', 'VI', 'V', 'V'], weight: 3 },
    ],
    solo: [
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
    ],
    outro: [{ chords: ['bII', 'bII', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 5 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-4, 12], weight: 4 },
    { cell: [12, 4], weight: 3 },
    { cell: [-8, 4, 4], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 8 },
    { cell: [-8, 8], weight: 4 },
  ],
  bass: [slowRiff(5), holdBass(6), followRiff(3), fifths(2)],
  comp: [hold(7), chug(3)],
  drums: [crawl(7), halfTime(4), backbeat(2)],
  melody: { leap: 0.2, ornament: 0.25, span: 11, sequence: 0.7, syncopation: 0.2 },
  /**
   * The one place this style and its genre disagree about what a tune is, and
   * `index.ts` names it before this line existed.
   *
   * The header says *a riff that is the whole song* and *chords held until they
   * stop being chords*; the cells say the same thing in numbers — `[16]` at 6 and
   * `[8, 8]` at 5, deriving 1.42 onsets a bar, the lowest in the genre, and
   * `long-note` at 2.62 of 11.3, near a quarter of the table. The genre voice
   * overrides that to 1 and lifts `riff-response` from 0.60 to 5, so the likeliest
   * kind of tune here becomes *a short figure and the thing that answers it*:
   * 31.3% of the draw against 5.3% derived, while the held note falls from 23.1%
   * to 6.3%. `index.ts` works both figures out under `long-note` and says the
   * delta has to be a pair, because the 5 is doing most of the damage and moving
   * the long note back alone would not return the style.
   *
   * Measured it is the widest gap in the genre: **2.98 realised onsets a bar
   * against 1.42 declared, 2.10× where the metal median is 1.18×**, with 53% of
   * the notes sixteenths at 52–74 BPM. A bar is four and a half seconds here and
   * the tune is filling it. What this table can reach of that is the archetype's
   * own `density: 0.45` and `stride: 3` against `riff-response`'s 1.15 and 1 —
   * the rest of the inflation is genre-wide (metal is the only genre in the
   * project realising *more* than it declares) and is not doom's to state.
   *
   * `riff-response` at 1 rather than back at its derived 0.60: two of these six
   * cells start with a rest against four of nine in `RIFF_CELLS`, so the guitar
   * does own the downbeat some of the time — just not five times as often as the
   * note that is held through the bar.
   */
  voice: {
    archetypes: [['long-note', 2.6], ['riff-response', 1]],
  },
};

/**
 * STONER — the same three chords with the fuzz up and the misery taken out.
 *
 * The distinction from `heavy` is one number and it is `swing`. Kyuss and Sleep
 * are playing a *shuffle*, audibly, at 100 BPM through a bass amp; the ancestor
 * is the same 1970 blues but the branch that kept the groove instead of keeping
 * the dread. `boxDrums: false` for the reason reggae's shuffle sets it: a beat
 * whose character is the gap between the two hands cannot be expressed as a low
 * weight on a preset.
 *
 * Major shows up here more than anywhere else in the first half of this file,
 * which is also the blues: a fuzzed I–♭III–IV is a major-key riff with a minor
 * third in it, and the pentatonic fallback in `scaleForChord` is exactly what
 * plays over it.
 */
const stoner: Style = {
  id: 'stoner',
  label: 'Stoner',
  description:
    'Fuzz, a shuffle at a hundred, and the desert end of the blues: the 1970 riff with the dread swapped for a groove.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [88, 118],
  swing: 0.2,
  boxDrums: false,
  modeWeights: { minor: 0.6, major: 0.4 },
  relativeMajorChorus: 0,
  hook: 'catchy',
  shots: METAL_SHOTS,
  breakCarrier: 'comp',
  requireLayers: ['comp'],
  excludeLayers: ['brass'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'III', 'III', 'iv', 'iv', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'VII', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['i', 'III', 'iv', 'i', 'i', 'III', 'VII', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'III', 'III', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['III', 'VII', 'i', 'i'], weight: 3 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'bVII', 'bVII'], weight: 5 },
      { chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 4 },
    ],
    chorus: [
      { chords: ['IV', 'IV', 'bVII', 'bVII', 'I', 'I', 'I', 'I'], weight: 4 },
      { chords: ['I', 'IV', 'I', 'bVII', 'I', 'IV', 'I', 'I'], weight: 3 },
    ],
    solo: [{ chords: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I'], weight: 5 }],
    outro: [{ chords: ['bVII', 'IV', 'I', 'I'], weight: 3 }],
  },
  melodyCells: RIFF_CELLS,
  cadenceCells: RIFF_CADENCES,
  bass: [tritoneStomp(4), slowRiff(3), followRiff(6), fifths(4), poundBass(2)],
  comp: [chug(6), stabs(4), hold(2)],
  drums: [backbeat(6), rideBeat(4), halfTime(2)],
  melody: { leap: 0.35, ornament: 0.45, span: 14, sequence: 0.45, syncopation: 0.4 },
};

/**
 * SLUDGE — doom's tempo with hardcore's manners.
 *
 * New Orleans, 1991: a band who had been playing Black Flag covers slowed down to
 * Sabbath speed and kept the shouting. What that produces mechanically is a style
 * whose kit spends its time in `halfTime` and whose *comp* is `downpick` — a busy
 * right hand under a beat that has stopped, which is the exact inverse of every
 * other slow style here, where the guitar holds and the drums fill.
 *
 * `strictness` is left at the genre's `light`, which is worth noting because the
 * neighbours on either side are set: this is a style with a shouted vocal and no
 * melodic pretension at all, and the rules have very little to remove from it.
 */
const sludge: Style = {
  id: 'sludge',
  label: 'Sludge',
  description:
    'Doom tempo, hardcore manners: a busy right hand over a beat that has stopped, and nothing pretty anywhere.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [62, 92],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.9, major: 0.1 },
  relativeMajorChorus: 0,
  hook: 'loose',
  shots: [[[0, 6, 8], 4], [[0, 3, 6, 10], 3], [[0, 8], 3]],
  breakCarrier: 'comp',
  requireLayers: ['comp'],
  excludeLayers: ['brass', 'pad'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'bV', 'bV', 'i', 'i', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['iv', 'iv', 'bII', 'bII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VI', 'i', 'i', 'VI', 'VI', 'VII', 'VII'], weight: 3 },
    ],
    bridge: [{ chords: ['bII', 'bII', 'bII', 'bII', 'i', 'i', 'i', 'i'], weight: 3 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 4 }],
    outro: [{ chords: ['bII', 'i', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-4, 4, 8], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-8, 8], weight: 4 },
    { cell: [16], weight: 4 },
    { cell: [-2, 2, 4, 8], weight: 3 },
  ],
  cadenceCells: RIFF_CADENCES,
  bass: [slowRiff(4), poundBass(5), holdBass(4), followRiff(3)],
  comp: [downpick(5), hold(4), chug(3)],
  drums: [halfTime(6), crawl(4), backbeat(3)],
  melody: { leap: 0.28, ornament: 0.2, span: 12, sequence: 0.5, syncopation: 0.4 },
};

// ---------------------------------------------------------------------------
// 1979–86: the new wave, and what it accelerated into
// ---------------------------------------------------------------------------

/**
 * NWOBHM — 1980, and the year the genre stopped being blues.
 *
 * Two guitars, and that is the whole event. The first generation had one
 * guitarist overdubbing; a hundred bands who had watched punk happen worked out
 * that two people playing *harmonised* lines could do something an overdub could
 * not, which is play it live. `arrangement.harmony` is weighted highest in the
 * project at the genre level for this reason and this is the style it is for.
 *
 * The other event is the gallop, which arrives fully formed and never leaves.
 * `gallopChop` and `gallopKit` are both at the head of their tables here, and the
 * fact that they carry the identical twelve slot numbers is the point rather than
 * a saving.
 *
 * `V` appears in the minor tables, which nothing before it in this file does. A
 * NWOBHM band was writing *songs* with cadences in them, and `scaleForChord`
 * answers a major V in a minor key with harmonic minor — see `index.ts`, where
 * the difference between this genre's claim and reggae's is argued at length.
 */
const nwobhm: Style = {
  id: 'nwobhm',
  label: 'New wave',
  description:
    'Two guitars in harmony, the gallop in the feet and the hands together, and a real cadence at the end of the chorus. 1980.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [138, 172],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.7, major: 0.3 },
  relativeMajorChorus: 0.15,
  hook: 'catchy',
  shots: METAL_SHOTS,
  breakCarrier: 'comp',
  requireLayers: ['comp', 'counter'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5, note: 'i–♭VII–♭VI–♭VII: the aeolian shuttle, and the single most-played eight bars in the genre' },
      { chords: ['i', 'i', 'iv', 'iv', 'VI', 'VI', 'V', 'V'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'V', 'i', 'VII', 'VI', 'V'], weight: 4, note: 'The descending tetrachord, which this genre inherited from the baroque by way of nobody admitting it' },
      { chords: ['i', 'i', 'III', 'III', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['III', 'VII', 'iv', 'i', 'VI', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'VII', 'III', 'VI', 'iv', 'V', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'III', 'III', 'V', 'V'], weight: 3 },
    ],
    solo: [
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'V'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'VI', 'VII', 'i', 'i'], weight: 3 },
    ],
    outro: [{ chords: ['VI', 'VII', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'IV'], weight: 4 },
    ],
    chorus: [
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'I'], weight: 5 },
      { chords: ['IV', 'V', 'I', 'I', 'IV', 'V', 'vi', 'V'], weight: 3 },
    ],
    solo: [{ chords: ['I', 'bVII', 'IV', 'I', 'I', 'bVII', 'IV', 'V'], weight: 4 }],
    outro: [{ chords: ['IV', 'V', 'I', 'I'], weight: 4 }],
  },
  melodyCells: RIFF_CELLS,
  cadenceCells: RIFF_CADENCES,
  bass: [dropRun(4), gallopBass(6), followRiff(5), fifths(3)],
  comp: [gallopChop(6), chug(5), downpick(3)],
  drums: [gallopKit(6), rideBeat(5), backbeat(4)],
  melody: { leap: 0.42, ornament: 0.4, span: 17, sequence: 0.55, syncopation: 0.45 },
  // The highest in the file, with `melodeath`. The header calls the pair *the
  // whole event* and the description leads on it; a majority of the sections the
  // singer is in is what that sentence means when it is written as a number.
  harmony: twinGuitars(0.6),
};

/**
 * SPEED — the new wave with the brakes off, and the missing link to thrash.
 *
 * Motörhead and early Priest: the same songs at 200, played with *alternate*
 * picking rather than downstrokes, which is what lets it be that fast and is
 * also why it sounds lighter than thrash does at the same tempo. The tables are
 * nearly `nwobhm`'s; the differences are the tempo band, `tremolo` at the head of
 * the comp table instead of the gallop, a kit that has stopped using the ride
 * because there is no time to get to it, and half the `harmony` amount — the two
 * bands in the first sentence disagree about the second guitarist, because one of
 * them has one and the other is a power trio.
 */
const speed: Style = {
  id: 'speed',
  label: 'Speed',
  description:
    'The new wave at two hundred, picked rather than downstroked, with the hats keeping eighths because nothing else fits.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [176, 214],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.75, major: 0.25 },
  relativeMajorChorus: 0.1,
  hook: 'catchy',
  shots: METAL_SHOTS,
  breakCarrier: 'comp',
  requireLayers: ['comp', 'counter'],
  excludeLayers: ['brass'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'VI', 'VII', 'i', 'i', 'VI', 'VII', 'V'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'V', 'V', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'V', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 4 },
    ],
    solo: [{ chords: ['i', 'VII', 'VI', 'V', 'i', 'VII', 'VI', 'V'], weight: 5 }],
    outro: [{ chords: ['VII', 'VI', 'V', 'i'], weight: 4 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'I', 'I', 'IV', 'V'], weight: 5 },
      { chords: ['I', 'V', 'IV', 'I', 'I', 'V', 'IV', 'V'], weight: 3 },
    ],
    chorus: [{ chords: ['IV', 'V', 'I', 'I', 'IV', 'V', 'vi', 'V'], weight: 5 }],
    solo: [{ chords: ['I', 'bVII', 'IV', 'I', 'I', 'bVII', 'IV', 'V'], weight: 4 }],
    outro: [{ chords: ['bVII', 'IV', 'V', 'I'], weight: 3 }],
  },
  melodyCells: RIFF_CELLS,
  cadenceCells: RIFF_CADENCES,
  bass: [semitoneRiff(4), poundBass(6), gallopBass(4), followRiff(3)],
  comp: [tremolo(6), gallopChop(4), downpick(3)],
  drums: [backbeat(6), gallopKit(4), doubleKick(3)],
  melody: { leap: 0.45, ornament: 0.35, span: 18, sequence: 0.5, syncopation: 0.45 },
  // Half of `nwobhm`'s, for the reason in the header: Priest harmonised
  // everything and Motörhead had one guitarist. The tempo band argues the same
  // way — at 214 the pair is a passage somebody wrote out, not the texture.
  harmony: twinGuitars(0.3),
};

/**
 * POWER — the one style here that is unambiguously writing tunes, and one of the
 * four that voices real triads.
 *
 * Hamburg and Helsinki rather than Birmingham: a genre that took NWOBHM's twin
 * guitars and double kick and pointed them at a chorus a football crowd could
 * sing. `strictness: 'standard'` is set here and it is a decision rather than a
 * default — this is the one place in the metal catalogue where an unresolved
 * leading tone or an unprepared dissonance is a *mistake* rather than a colour,
 * because the tune is meant to be singable by people who cannot sing.
 *
 * `relativeMajorChorus: 0.35` is the highest in the file and is the same gesture
 * iskelmä is built on — melancholy verse in i, chorus that opens into III. Power
 * metal does this constantly and shamelessly, and the fact that it is a
 * tanssilava move performed at 170 BPM with two kick drums is the whole joke and
 * also the whole appeal.
 */
const power: Style = {
  id: 'power',
  label: 'Power',
  description:
    'Double kick under a chorus a football crowd could sing, twin guitars in thirds, and a verse in the minor that opens into the relative major.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [148, 186],
  swing: 0,
  boxDrums: false,
  strictness: 'standard',
  modeWeights: { minor: 0.55, major: 0.45 },
  relativeMajorChorus: 0.35,
  hook: 'earworm',
  shots: METAL_SHOTS,
  breakCarrier: 'comp',
  requireLayers: ['comp', 'counter'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'III', 'V'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'V', 'V', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'III', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['III', 'VII', 'VI', 'III', 'iv', 'V', 'i', 'i'], weight: 4 },
      { chords: ['VI', 'III', 'VII', 'iv', 'VI', 'V', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'VI', 'VI', 'III', 'III', 'V', 'V'], weight: 4 },
    ],
    solo: [
      { chords: ['i', 'VII', 'VI', 'V', 'i', 'VII', 'VI', 'V'], weight: 5 },
      { chords: ['VI', 'VII', 'i', 'III', 'VI', 'VII', 'V', 'V'], weight: 3 },
    ],
    outro: [{ chords: ['VI', 'VII', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'IV'], weight: 5 },
      { chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'V', 'V'], weight: 4 },
    ],
    chorus: [
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'V', 'V'], weight: 5 },
      { chords: ['IV', 'V', 'vi', 'iii', 'IV', 'V', 'I', 'I'], weight: 4 },
    ],
    bridge: [{ chords: ['ii', 'V', 'I', 'vi', 'IV', 'IV', 'V', 'V'], weight: 3 }],
    solo: [{ chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'V'], weight: 5 }],
    outro: [{ chords: ['IV', 'V', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-4, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-2, 6, 8], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 3 },
    { cell: [-4, 2, 2, 8], weight: 3 },
    { cell: [16], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [4, 12], weight: 5 },
    { cell: [-4, 12], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  /**
   * Sixteenths, because anything sparser is audibly behind the pedals. A bass
   * player under a continuous double kick has no gaps to place a note in and no
   * reason to want any — the two parts are one object.
   */
  bass: [sixthFall(4), poundBass(6), gallopBass(5), followRiff(4)],
  comp: [
    chug(6), gallopChop(5),
    triads(4, [
      { at: 0, dur: 2, vel: 0.95 }, { at: 4, dur: 2, vel: 0.88 },
      { at: 8, dur: 2, vel: 0.92 }, { at: 12, dur: 2, vel: 0.88 },
    ]),
  ],
  drums: [doubleKick(7), gallopKit(4), backbeat(3)],
  melody: { leap: 0.4, ornament: 0.45, span: 19, sequence: 0.6, syncopation: 0.4 },
  // *Twin guitars in thirds* is the description's second clause and this table is
  // that clause. A notch under `nwobhm` because the first clause outranks it:
  // what this style is organised around is a chorus a crowd sings in unison, and
  // `hook: 'earworm'` with the file's highest `relativeMajorChorus` says so twice.
  harmony: twinGuitars(0.5),
};

/**
 * GLAM — Sunset Strip, 1986, and the style everybody in the rest of this file
 * defined themselves against.
 *
 * It belongs here anyway, and the reason is in the tables: it is the same
 * instruments, the same tempo band as `nwobhm`, and the same twin-guitar
 * arrangement, pointed at a major key and a radio. `modeWeights` is the only
 * majority-major entry in the file. `triads` at the head of the comp table
 * because a chorus that is meant to be *happy* cannot be voiced without a third
 * — the power chord's ambiguity, which is the whole genre's virtue everywhere
 * else, is precisely the thing this style cannot afford.
 *
 * `strictness: 'standard'` for the same reason `power` has it: these are pop
 * songs, and the rules are describing pop songs.
 */
const glam: Style = {
  id: 'glam',
  label: 'Glam',
  description:
    'Major keys, real triads, a chorus with a hook in it and a solo that lasts eight bars — the radio end of 1986.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [116, 152],
  swing: 0,
  boxDrums: false,
  strictness: 'standard',
  modeWeights: { minor: 0.35, major: 0.65 },
  relativeMajorChorus: 0.2,
  hook: 'earworm',
  shots: [[[0, 6, 8], 4], [[0, 4, 8, 12], 4], [[0, 7, 12], 3]],
  breakCarrier: 'comp',
  requireLayers: ['comp', 'counter'],
  progressions: {
    verse: [
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'V'], weight: 4 },
      { chords: ['i', 'i', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'III', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'V', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 3 },
    ],
    solo: [{ chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'V'], weight: 4 }],
    outro: [{ chords: ['VI', 'VII', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'IV'], weight: 5 },
      { chords: ['I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'V'], weight: 4 },
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'I', 'V'], weight: 4 },
    ],
    chorus: [
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'V'], weight: 5 },
      { chords: ['IV', 'I', 'V', 'vi', 'IV', 'I', 'V', 'V'], weight: 4 },
      { chords: ['I', 'bVII', 'IV', 'I', 'IV', 'V', 'I', 'I'], weight: 3 },
    ],
    bridge: [{ chords: ['vi', 'vi', 'IV', 'IV', 'ii', 'ii', 'V', 'V'], weight: 3 }],
    solo: [{ chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'IV', 'V'], weight: 5 }],
    outro: [{ chords: ['IV', 'V', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-4, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [-2, 6, 8], weight: 4 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 2, 2, 8], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [4, 12], weight: 5 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [dropRun(3), followRiff(6), fifths(4), poundBass(2)],
  comp: [
    triads(6, [
      { at: 0, dur: 2, vel: 0.95 }, { at: 2, dur: 2, vel: 0.82 },
      { at: 4, dur: 2, vel: 0.9 }, { at: 6, dur: 2, vel: 0.82 },
      { at: 8, dur: 2, vel: 0.92 }, { at: 10, dur: 2, vel: 0.82 },
      { at: 12, dur: 2, vel: 0.9 }, { at: 14, dur: 2, vel: 0.84 },
    ]),
    chug(5),
    triads(3, [
      { at: 0, dur: 4, vel: 0.92 }, { at: 4, dur: 4, vel: 0.86 },
      { at: 8, dur: 4, vel: 0.9 }, { at: 12, dur: 4, vel: 0.86 },
    ]),
  ],
  drums: [backbeat(7), rideBeat(4), gallopKit(2)],
  melody: { leap: 0.4, ornament: 0.5, span: 18, sequence: 0.6, syncopation: 0.4 },
  // *The same twin-guitar arrangement*, says the header, *pointed at a major key
  // and a radio* — and the second half of that sentence is what halves the
  // number. On a record whose subject is the hook, the harmonised lead is a spot
  // in the arrangement rather than the thing the arrangement is made of.
  harmony: twinGuitars(0.3),
};

/**
 * SHRED — the instrumental one, and the style the `phrygianDominant` scale was
 * added to `core/scale.ts` for.
 *
 * 1984: a Swedish guitarist works out that Paganini's caprices and a Marshall
 * stack want the same scale, and an entire instrumental sub-genre follows. What
 * it needs from this file is a minor table full of *functional* harmony — real
 * dominants, real cadences, secondary dominants — because the whole appeal is a
 * line moving fast through changes that are actually going somewhere. Everything
 * else in the catalogue is modal by construction and this is the one style that
 * is not.
 *
 * The `I` in the minor tables is not a typo. A major tonic triad in a minor key
 * is unplayable in aeolian, unplayable in phrygian and unplayable in harmonic
 * minor; `scaleForChord`'s ladder answers it with **phrygian dominant**, which is
 * exactly the mode this style exists to play and is reached without any style
 * needing to override the genre's mapping. See `index.ts`.
 */
const shred: Style = {
  id: 'shred',
  label: 'Shred',
  description:
    'Instrumental neoclassical: harmonic minor, real cadences, a major tonic that turns the whole bar phrygian dominant, and far too many notes.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [136, 188],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.9, major: 0.1 },
  relativeMajorChorus: 0,
  hook: 'loose',
  shots: METAL_SHOTS,
  breakCarrier: 'comp',
  requireLayers: ['comp', 'melody'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'V', 'V', 'i', 'i', 'V', 'V'], weight: 5, note: 'i–V with a real leading tone. The one thing that separates this style from everything else here, and the reason harmonic minor is in the ladder' },
      { chords: ['i', 'VI', 'III', 'VII', 'iv', 'V', 'i', 'i'], weight: 5, note: 'The circle, minor: every root a fourth above the last, which is what a fast line wants to run through' },
      { chords: ['i', 'i', 'bII', 'bII', 'I', 'I', 'i', 'i'], weight: 3, note: 'The major tonic is the phrygian-dominant switch — see the header. ♭II either side of it is the flamenco cadence, which is the same object' },
    ],
    chorus: [
      { chords: ['iv', 'V', 'i', 'i', 'iv', 'V', 'i', 'i'], weight: 5 },
      { chords: ['VI', 'VII', 'i', 'V', 'VI', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['bII', 'bII', 'I', 'I', 'bII', 'bII', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['iv', 'iv', 'V/iv', 'V/iv', 'iv', 'V', 'i', 'i'], weight: 3 },
    ],
    solo: [
      { chords: ['i', 'VI', 'III', 'VII', 'iv', 'V', 'i', 'i'], weight: 5 },
      { chords: ['i', 'i', 'V', 'V', 'i', 'i', 'V', 'V'], weight: 4 },
    ],
    outro: [{ chords: ['iv', 'V', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'vi', 'ii', 'V', 'I', 'vi', 'ii', 'V'], weight: 4 },
      { chords: ['I', 'I', 'IV', 'V', 'I', 'I', 'IV', 'V'], weight: 3 },
    ],
    chorus: [{ chords: ['IV', 'V', 'I', 'vi', 'IV', 'V', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'vi', 'ii', 'V', 'I', 'vi', 'ii', 'V'], weight: 4 }],
    outro: [{ chords: ['IV', 'V', 'I', 'I'], weight: 3 }],
  },
  melodyCells: [
    { cell: [1, 1, 2, 2, 2, 2, 2, 2, 2], weight: 5 },
    { cell: [2, 2, 2, 2, 2, 2, 2, 2], weight: 5 },
    { cell: [-2, 2, 2, 2, 2, 2, 2, 2], weight: 4 },
    { cell: [2, 2, 4, 4, 4], weight: 4 },
    { cell: [4, 2, 2, 2, 2, 4], weight: 3 },
    { cell: [-4, 2, 2, 4, 4], weight: 3 },
    { cell: [8, 8], weight: 2 },
  ],
  cadenceCells: [
    { cell: [16], weight: 6 },
    { cell: [2, 2, 12], weight: 4 },
    { cell: [4, 12], weight: 3 },
  ],
  bass: [sixthFall(4), poundBass(6), followRiff(4), fifths(3)],
  comp: [chug(6), downpick(4), gallopChop(3)],
  drums: [doubleKick(5), gallopKit(5), backbeat(4)],
  melody: { leap: 0.5, ornament: 0.6, span: 24, sequence: 0.65, syncopation: 0.35 },
};

// ---------------------------------------------------------------------------
// 1983–92: thrash and its consequences
// ---------------------------------------------------------------------------

/**
 * THRASH — Bay Area, 1983, and the one style in this project whose identity is a
 * *stamina*.
 *
 * The riff is downpicked sixteenths, and downpicking is a physical constraint
 * rather than a stylistic preference: alternate picking gets the same notes with
 * half the effort and it does not sound the same, because a downstroke hits the
 * string with the pick at a consistent angle and an alternating one does not, so
 * sixteen downs produce a wall and sixteen alternates produce a shimmer. That
 * distinction is why `downpick` and `tremolo` are two factories in this file
 * carrying the same sixteen slot indices.
 *
 * `hook: 'through'` is the other half of the style and it is the setting jazz's
 * bebop uses, arrived at from the opposite direction. Bebop refuses to repeat
 * because the value is invention; thrash refuses because these songs are
 * *through-composed* — six or seven riffs in sequence with no chorus coming back,
 * which is closer to a rondo than to a pop song and is why the third form in
 * `index.ts` exists.
 */
const thrash: Style = {
  id: 'thrash',
  label: 'Thrash',
  description:
    'Sixteen downstrokes to the bar for four minutes, riffs in sequence rather than in a chorus, and a right arm that does not stop.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [172, 216],
  swing: 0,
  boxDrums: false,
  hook: 'through',
  modeWeights: { minor: 0.9, major: 0.1 },
  relativeMajorChorus: 0,
  shots: METAL_SHOTS,
  breakCarrier: 'comp',
  requireLayers: ['comp'],
  excludeLayers: ['brass', 'pad'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'bII', 'i', 'bII', 'i'], weight: 5, note: 'A pedal on the open string with the ♭II landing on top of it. The riff is one note and one interval and it is most of the genre' },
      { chords: ['i', 'i', 'VI', 'VI', 'i', 'i', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'bII', 'i', 'bV', 'i', 'bII', 'i', 'VII'], weight: 4, note: 'Root, flat second, root, flat fifth: a chromatic riff written as chords, which is what a thrash riff actually is' },
      { chords: ['i', 'i', 'iv', 'iv', 'VI', 'VI', 'V', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['bII', 'bII', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 4 },
      { chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    bridge: [
      { chords: ['i', 'i', 'bV', 'bV', 'i', 'i', 'bII', 'bII'], weight: 4 },
      { chords: ['iv', 'iv', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 3 },
    ],
    solo: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 4 },
    ],
    outro: [{ chords: ['bII', 'bII', 'i', 'i'], weight: 4 }],
  },
  melodyCells: RIFF_CELLS,
  cadenceCells: RIFF_CADENCES,
  bass: [semitoneRiff(5), poundBass(7), followRiff(4), gallopBass(3)],
  comp: [downpick(8), gallopChop(3), chug(3)],
  drums: [doubleKick(6), backbeat(5), gallopKit(4)],
  melody: { leap: 0.35, ornament: 0.2, span: 15, sequence: 0.45, syncopation: 0.5 },
};

/**
 * CROSSOVER — thrash and hardcore, which turned out to be the same band.
 *
 * Two scenes an hour's drive apart discovered in about 1985 that they had the
 * same tempo, the same haircut and the same two-minute song. What that gives the
 * tables is `dbeat` at the head of the kit, a tempo band that starts where
 * thrash's ends, and progressions with two chords in them — a hardcore song does
 * not have time for a third.
 */
const crossover: Style = {
  id: 'crossover',
  label: 'Crossover',
  description:
    'Thrash meeting hardcore at two hundred and forty: the d-beat, two chords, and everything over in ninety seconds.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [200, 250],
  swing: 0,
  boxDrums: false,
  hook: 'catchy',
  modeWeights: { minor: 0.85, major: 0.15 },
  relativeMajorChorus: 0,
  shots: [[[0, 4, 8, 12], 5], [[0, 6, 8], 3]],
  breakCarrier: 'comp',
  requireLayers: ['comp'],
  excludeLayers: ['brass', 'pad'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VI', 'VI'], weight: 4 },
      { chords: ['i', 'VII', 'i', 'VII', 'i', 'VII', 'VI', 'VI'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'i', 'i', 'iv', 'iv', 'i', 'i'], weight: 3 },
    ],
    solo: [{ chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VI', 'VII'], weight: 4 }],
    outro: [{ chords: ['VII', 'VI', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'bVII', 'bVII', 'I', 'I', 'IV', 'IV'], weight: 5 }],
    chorus: [{ chords: ['IV', 'bVII', 'I', 'I', 'IV', 'bVII', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'bVII', 'bVII', 'I', 'I', 'IV', 'IV'], weight: 4 }],
    outro: [{ chords: ['bVII', 'IV', 'I', 'I'], weight: 3 }],
  },
  melodyCells: [
    { cell: [4, 4, 8], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [-8, 4, 4], weight: 3 },
  ],
  cadenceCells: RIFF_CADENCES,
  bass: [semitoneRiff(4), poundBass(7), followRiff(4)],
  comp: [downpick(6), chug(5), tremolo(3)],
  drums: [dbeat(7), backbeat(4), doubleKick(3)],
  melody: { leap: 0.3, ornament: 0.15, span: 13, sequence: 0.4, syncopation: 0.45 },
};

/**
 * GROOVE — 1992, and the moment the genre stopped accelerating.
 *
 * Ten years of everybody going faster ends with a Texas band playing at 105 and
 * being heavier than anything at 220. The mechanism is entirely `halfTime`: the
 * *riff* is still sixteenths, so the guitar has lost nothing, and the snare has
 * moved from every second beat to every fourth, which doubles the amount of air
 * around every hit. `stabs` at the head of the comp table is the other half —
 * everything on the beat except one thing, and the one thing an eighth early.
 *
 * `hook: 'earworm'` because this style's proposition is that four bars are worth
 * hearing forty times, which is the opposite of the claim thrash makes two
 * entries above and is why they read as different music at the same volume.
 */
const groove: Style = {
  id: 'groove',
  label: 'Groove',
  description:
    'The riff stays in sixteenths and the beat halves: a snare every fourth beat, everything syncopated around it, and heavier at a hundred than thrash is at two.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [92, 126],
  swing: 0,
  boxDrums: false,
  hook: 'earworm',
  modeWeights: { minor: 0.88, major: 0.12 },
  relativeMajorChorus: 0,
  shots: [[[0, 7, 10], 5], [[0, 3, 6, 10], 4], [[0, 6, 8], 3]],
  breakCarrier: 'comp',
  requireLayers: ['comp'],
  excludeLayers: ['brass'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'bII', 'bII'], weight: 5 },
      { chords: ['i', 'i', 'VI', 'VI', 'i', 'i', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'bII', 'bII', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['i', 'i', 'i', 'i', 'bV', 'bV', 'i', 'i'], weight: 3 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VII', 'VII'], weight: 4 }],
    outro: [{ chords: ['bII', 'i', 'i', 'i'], weight: 4 }],
  },
  melodyCells: RIFF_CELLS,
  cadenceCells: RIFF_CADENCES,
  bass: [dropRun(4), followRiff(6), poundBass(5), fifths(3)],
  comp: [stabs(6), downpick(5), chug(4)],
  drums: [halfTime(7), backbeat(4), rideBeat(3)],
  melody: { leap: 0.3, ornament: 0.25, span: 13, sequence: 0.6, syncopation: 0.6 },
};

/**
 * METALCORE — the breakdown, which is a structural device rather than a rhythm.
 *
 * Everything about this style is the *contrast* between two tempos that are the
 * same tempo: a fast melodic passage in `gallopKit` and then eight bars of
 * `halfTime` with the guitar on the low string. `transitions` is declared here
 * rather than inherited because that contrast happens at a *seam*, and the seam
 * this style wants is `break` — the whole band stopping for a bar, which is how a
 * breakdown is announced and which the genre-level palette weights lower.
 */
const metalcore: Style = {
  id: 'metalcore',
  label: 'Metalcore',
  description:
    'Fast melodic passages that fall off a cliff into eight bars of half time, announced by everybody stopping at once.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [148, 192],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.86, major: 0.14 },
  relativeMajorChorus: 0,
  transitions: [['break', 5], ['fill', 4], ['shot', 3], ['elide', 1]],
  shots: [[[0, 6, 8], 5], [[0, 3, 6, 10], 4], [[0, 4, 8, 12], 3]],
  breakCarrier: 'comp',
  requireLayers: ['comp'],
  excludeLayers: ['brass'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'iv', 'iv'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'III', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'VI', 'VII', 'i', 'iv', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    bridge: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'bII', 'bII'], weight: 5, note: 'The breakdown: one chord for eight bars, and the arrangement is the whole content' }],
    solo: [{ chords: ['VI', 'VII', 'i', 'III', 'VI', 'VII', 'i', 'i'], weight: 4 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 4 }],
  },
  melodyCells: RIFF_CELLS,
  cadenceCells: RIFF_CADENCES,
  bass: [dropRun(4), poundBass(6), followRiff(5), fifths(2)],
  comp: [downpick(6), stabs(5), gallopChop(3)],
  drums: [halfTime(6), gallopKit(5), doubleKick(4)],
  melody: { leap: 0.38, ornament: 0.3, span: 16, sequence: 0.55, syncopation: 0.5 },
};

/**
 * INDUSTRIAL — the one style in the file a machine may play, and the only reason
 * `boxDrums` appears in this catalogue at all.
 *
 * Every other entry sets `boxDrums: false`, which reads as a formality until you
 * see the one that does not. Here the object producing the percussion *is* the
 * subject: a Godflesh record is a drum machine and two people, and the whole
 * effect is that the pattern is inhumanly even underneath a guitar that is not.
 * The two later eras name `box` and `programmed` at a small weight for this one
 * style's sake, and they are unreachable from any other.
 *
 * `filter` is declared, one of two styles that do. A step per section rather than
 * a ramp: this music opens the filter at the chorus and shuts it again, which is
 * a mixing-desk gesture rather than a composed one, and `step` is the shape that
 * says so.
 */
const industrial: Style = {
  id: 'industrial',
  label: 'Industrial',
  description:
    'A drum machine, a guitar tuned to a single note and a filter that opens at the chorus. The one style here a box is allowed to play.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [112, 148],
  swing: 0,
  hook: 'earworm',
  filter: { depth: 0.45, shape: 'step' },
  modeWeights: { minor: 0.9, major: 0.1 },
  relativeMajorChorus: 0,
  shots: [[[0, 4, 8, 12], 5], [[0, 6, 8], 3]],
  breakCarrier: 'comp',
  requireLayers: ['comp'],
  excludeLayers: ['brass'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 5, note: 'One chord for eight bars. The riddim argument, arrived at independently by people who had never heard a riddim' },
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'VI', 'VI', 'i', 'i', 'VI', 'VI'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'i', 'i', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['bII', 'bII', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 4 },
    ],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 4 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [16], weight: 3 },
  ],
  cadenceCells: RIFF_CADENCES,
  bass: [semitoneRiff(3), poundBass(6), followRiff(4), holdBass(2)],
  comp: [downpick(6), chug(5), stabs(3)],
  drums: [backbeat(6), halfTime(4), doubleKick(3)],
  melody: { leap: 0.25, ornament: 0.2, span: 12, sequence: 0.7, syncopation: 0.4 },
};

/**
 * PROGRESSIVE — seven eighths, and a rhythm section that drifts against it.
 *
 * `groups: [4, 4, 6]` is 2+2+3, which is the grouping that makes a 7/8 feel like
 * a bar with a limp rather than like a bar with a beat missing. `metricStrength`
 * cannot derive that from the number 14 and would put a half-bar accent on slot 7
 * — in the middle of the second group — so the grouping has to be declared, and
 * the `shots` table below is written to it rather than left to the default.
 *
 * The `cycle: 12` on one bass figure is the other half. Three beats against a
 * three-and-a-half-beat bar comes back round every six bars, and the drift is the
 * composition: the same six notes arrive on a different part of the bar every
 * time until they do not. See `Cycle` in `style/types.ts`, which exists for
 * exactly this.
 */
const progressive: Style = {
  id: 'progressive',
  label: 'Progressive',
  description:
    'Seven eighths grouped two-two-three, with a three-beat bass figure running against it that takes six bars to come home.',
  beatsPerBar: 3.5,
  beatUnit: 8,
  groups: [4, 4, 6],
  bpm: [126, 164],
  swing: 0,
  boxDrums: false,
  hook: 'through',
  modeWeights: { minor: 0.82, major: 0.18 },
  relativeMajorChorus: 0,
  shots: [[[0, 4, 8], 5], [[0, 4, 8, 12], 3], [[0, 6, 8], 2]],
  breakCarrier: 'comp',
  requireLayers: ['comp'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'iv', 'VII', 'III', 'VI', 'iv', 'V', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'III', 'III'], weight: 5 },
      { chords: ['iv', 'iv', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['bII', 'bII', 'VI', 'VI', 'iv', 'iv', 'V', 'V'], weight: 3 }],
    solo: [{ chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'VII', 'VII'], weight: 5 }],
    outro: [{ chords: ['VI', 'VII', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 5 }],
    chorus: [{ chords: ['IV', 'V', 'I', 'I', 'IV', 'bVII', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'bVII', 'bVII', 'IV', 'IV', 'I', 'I'], weight: 4 }],
    outro: [{ chords: ['bVII', 'IV', 'I', 'I'], weight: 3 }],
  },
  /**
   * Fourteen sixteenths, and every cell says two-two-three somewhere.
   *
   * The ones that break at slot 8 are the grouping; the ones that run through it
   * are the syncopation, which only means anything against a grouping the
   * listener has already been taught. Padding a 4/4 cell to length would fill the
   * bar and state nothing.
   */
  melodyCells: [
    { cell: [4, 4, 6], weight: 5 },
    { cell: [-4, 4, 6], weight: 5 },
    { cell: [2, 2, 4, 6], weight: 4 },
    { cell: [4, 4, 2, 4], weight: 4 },
    { cell: [6, 4, 4], weight: 3 },
    { cell: [-2, 2, 4, 6], weight: 3 },
    { cell: [14], weight: 3 },
    { cell: [2, 2, 2, 2, 6], weight: 2 },
  ],
  cadenceCells: [
    { cell: [14], weight: 6 },
    { cell: [-4, 10], weight: 4 },
    { cell: [4, 10], weight: 3 },
    { cell: [8, 6], weight: 3 },
  ],
  bass: [
    { name: 'follow-seven', weight: 6, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 }, { at: 2, dur: 2, tone: 0, vel: 0.84 },
      { at: 4, dur: 2, tone: 0, vel: 0.94 }, { at: 6, dur: 2, tone: 0, vel: 0.84 },
      { at: 8, dur: 3, tone: 0, vel: 0.96 }, { at: 11, dur: 3, tone: 7, vel: 0.86 },
    ] },
    /**
     * Three beats against a bar of three and a half. Twelve sixteenths and
     * fourteen have a lowest common multiple of eighty-four, so the figure lands
     * on the downbeat once every six bars and nowhere else in between.
     */
    { name: 'twelve-against-fourteen', weight: 4, cycle: 12, hits: [
      { at: 0, dur: 2, tone: 0, vel: 1 },
      { at: 2, dur: 2, tone: 0, vel: 0.82 },
      { at: 4, dur: 2, tone: -5, vel: 0.9 },
      { at: 6, dur: 2, tone: 0, vel: 0.84 },
      { at: 8, dur: 4, tone: 7, vel: 0.88 },
    ] },
    { name: 'pound-seven', weight: 3, hits: Array.from({ length: 14 }, (_, i) => ({
      at: i, dur: 1, tone: 0 as const, vel: i === 0 || i === 4 || i === 8 ? 0.98 : 0.82,
    })) },
  ],
  comp: [
    { name: 'downpick-seven', weight: 6, ...POWER,
      hits: Array.from({ length: 14 }, (_, i) => ({
        at: i, dur: 1, vel: i === 0 || i === 4 || i === 8 ? 0.98 : 0.86,
      })) },
    { name: 'group-heads', weight: 5, ...POWER, hits: [
      { at: 0, dur: 4, vel: 1 }, { at: 4, dur: 4, vel: 0.9 }, { at: 8, dur: 6, vel: 0.94 },
    ] },
    { name: 'chug-seven', weight: 3, ...POWER, hits: [
      { at: 0, dur: 2, vel: 0.98 }, { at: 2, dur: 2, vel: 0.84 },
      { at: 4, dur: 2, vel: 0.94 }, { at: 6, dur: 2, vel: 0.84 },
      { at: 8, dur: 2, vel: 0.96 }, { at: 10, dur: 2, vel: 0.84 }, { at: 12, dur: 2, vel: 0.86 },
    ] },
  ],
  drums: [
    { name: 'seven-kit', weight: 6, voices: {
      bd: [0, 4, 8, 11],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12],
    } },
    { name: 'seven-double-kick', weight: 4, voices: {
      bd: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      sd: [4, 12],
      rd: [0, 2, 4, 6, 8, 10, 12],
    } },
    { name: 'seven-open', weight: 3, voices: {
      bd: [0, 6, 8],
      sd: [8],
      rd: [0, 4, 8, 12],
      cr: [0],
    } },
  ],
  melody: { leap: 0.45, ornament: 0.4, span: 19, sequence: 0.5, syncopation: 0.55 },
};

/**
 * DJENT — a 4/4 bar with a seven-sixteenth riff running through it.
 *
 * The trick this style is named for is not an odd metre. It is **two clocks at
 * once**: the drummer's hands keep an ordinary 4/4 backbeat while the guitar,
 * the bass and the kick run a figure whose length is seven sixteenths, so the
 * riff and the barline agree only every seven bars — 112 sixteenths, which is the
 * lowest common multiple of 7 and 16. Everything the listener finds
 * disorientating is that arithmetic and nothing else.
 *
 * **`groups: [7, 7, 2]`** states the accent inside the bar and sums to sixteen,
 * which the metre check asserts. **`cycle: 7`** on the comp and the bass is what
 * makes the figure actually drift rather than merely be written down as if it
 * did.
 *
 * ## The kit does both halves now — `docs/engine-gaps.md` §3.6
 *
 * This header used to end with what could not be expressed, and it was right:
 * `DrumPattern.cycle` was one number for the whole pattern, so a drummer with
 * hands on the bar and feet on the seven — which is precisely what these records
 * have — needed the kick to carry a cycle of 7 while the snare carried 16, *and
 * that is two patterns*. The kit stayed bar-shaped and stated the grouping, and
 * the seven was carried by the guitar and the bass alone.
 *
 * `DrumPattern.cycles` is a length per **voice**, and `seven-foot` below is one
 * pattern with two clocks in it: `bd: [0, 3]` on `cycles: { bd: 7 }`, under a
 * backbeat on 4 and 12 and eighths on the hat that are still in 4/4.
 *
 * **The row this replaces was the drift written out for one bar.** It was
 * `bd: [0, 3, 7, 10, 14]`, which is `[0, 3]` stepped by seven — 0, 3, 7, 10, 14
 * — and then stopped at the barline and started again. So the first bar of every
 * section is unchanged, note for note, and what the field bought is bars two
 * onwards: the foot goes to 1, 5, 8, 12, 15, then 3, 6, 10, 13, and comes home
 * at bar seven, which is the same 112 sixteenths the guitar takes. **Over seven
 * bars the kick uses all sixteen slots of the bar, against five before.**
 *
 * **And the foot and the guitar agree rather than fight**, which was the thing
 * worth measuring before writing it. Both cycles are phased from the top of the
 * section and both step by seven, so 0 and 3 are the same 0 and 3 the chug plays
 * every time: **37 of 37 kick onsets land on a guitar onset over eight bars,
 * against 35 of 40 for the bar-shaped row.** The five that used to miss were the
 * barline reset, which is the whole of what was wrong with it.
 *
 * One consequence, named because it is audible and is not a fault: `accentOf` is
 * bar-shaped and stays that way, so a drifting kick takes the weight of wherever
 * in the bar it lands rather than carrying its own downbeat around. The mean
 * kick velocity falls from 0.803 to 0.726 across those eight bars — the foot
 * spends less of its time on a group head, because it is no longer pinned to
 * one. That is a drummer's foot running against a metre the hands are still
 * stating, which is the sound this style is named for.
 *
 * `half-time` and `double-kick`, the other two rows in the table, are shared
 * with the rest of the genre and stay bar-shaped. The two clocks are what
 * `seven-foot` is for, and it is the heaviest weight of the three.
 */
const djent: Style = {
  id: 'djent',
  label: 'Djent',
  description:
    'A seven-sixteenth riff running through a four-four bar: guitar and bass on a cycle of seven, the drummer holding the barline, and the two agreeing every seventh bar.',
  beatsPerBar: 4,
  beatUnit: 4,
  groups: [7, 7, 2],
  bpm: [100, 138],
  swing: 0,
  boxDrums: false,
  hook: 'earworm',
  modeWeights: { minor: 0.9, major: 0.1 },
  relativeMajorChorus: 0,
  shots: [[[0, 7, 14], 5], [[0, 4, 8, 12], 3]],
  breakCarrier: 'comp',
  requireLayers: ['comp'],
  excludeLayers: ['brass'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 6, note: 'One chord for eight bars, because the event is the cycle and a chord change would give the ear something easier to hold on to' },
      { chords: ['i', 'i', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'i', 'i', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['bII', 'bII', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 3 }],
    solo: [{ chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VII', 'VII'], weight: 4 }],
    outro: [{ chords: ['i', 'i', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [7, 7, 2], weight: 5 },
    { cell: [-7, 7, 2], weight: 4 },
    { cell: [4, 4, 4, 4], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [16], weight: 3 },
    { cell: [-4, 4, 4, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [-2, 14], weight: 4 },
    { cell: [7, 9], weight: 3 },
  ],
  bass: [
    { name: 'seven-cycle', weight: 7, cycle: 7, hits: [
      { at: 0, dur: 1, tone: 0, vel: 1 }, { at: 1, dur: 1, tone: 0, vel: 0.82 },
      { at: 2, dur: 1, tone: 0, vel: 0.84 }, { at: 3, dur: 1, tone: 1, vel: 0.9 },
      { at: 4, dur: 1, tone: 0, vel: 0.84 }, { at: 6, dur: 1, tone: 0, vel: 0.88 },
    ] },
    { name: 'five-cycle', weight: 3, cycle: 5, hits: [
      { at: 0, dur: 1, tone: 0, vel: 1 }, { at: 1, dur: 1, tone: 0, vel: 0.84 },
      { at: 3, dur: 2, tone: 7, vel: 0.9 },
    ] },
    poundBass(2),
  ],
  comp: [
    { name: 'seven-chug', weight: 7, cycle: 7, ...POWER, hits: [
      { at: 0, dur: 1, vel: 1 }, { at: 1, dur: 1, vel: 0.84 }, { at: 2, dur: 1, vel: 0.86 },
      { at: 3, dur: 1, vel: 0.94 }, { at: 4, dur: 1, vel: 0.84 }, { at: 6, dur: 1, vel: 0.9 },
    ] },
    { name: 'five-chug', weight: 3, cycle: 5, ...POWER, hits: [
      { at: 0, dur: 1, vel: 1 }, { at: 1, dur: 1, vel: 0.86 }, { at: 3, dur: 2, vel: 0.92 },
    ] },
    downpick(2),
  ],
  drums: [
    // Hands on the bar, foot on the seven. The kick is the riff's own two
    // accents inside a cycle of seven and keeps running when the bar turns
    // over; the snare and the hat are in 4/4 and stay there. See the header,
    // and `DrumPattern.cycles`.
    { name: 'seven-foot', weight: 6, voices: {
      bd: [0, 3],
      sd: [4, 12],
      hh: [0, 2, 4, 6, 8, 10, 12, 14],
    }, cycles: { bd: 7 } },
    halfTime(4),
    doubleKick(3),
  ],
  melody: { leap: 0.3, ornament: 0.25, span: 14, sequence: 0.7, syncopation: 0.6 },
};

/**
 * TECHNICAL DEATH — five four, at two hundred, with everything the rules would
 * have removed.
 *
 * `strictness: 'free'`, which is bebop's setting and is here for bebop's reason:
 * the chromaticism, the unprepared leaps and the diminished arpeggios that the
 * rule table exists to suppress are what this idiom is made of, and a version of
 * it with the faults filtered out is a version with the content filtered out.
 * The genre already disables the two rules that matter most; this style turns off
 * the remaining four as well, and it is one of three styles in the catalogue that
 * do. `death` and `black` also sit at `strictness: 'free'`, which `index.ts` says
 * in a list this line contradicted by claiming to be alone; the three are the
 * genre's whole extreme wing and the setting is the thing they have in common
 * rather than a distinction between them.
 *
 * `groups: [8, 12]` — two and then three, which is the shorter-first grouping and
 * the one that lurches. Jazz's `odd` uses `[12, 8]` and says the long group first
 * is how it swings; this is the same bar read the other way round, and it does
 * not swing at all.
 */
const techdeath: Style = {
  id: 'techdeath',
  label: 'Technical death',
  description:
    'Five four grouped two-then-three at two hundred, diminished arpeggios, and every melodic rule switched off because they were describing something else.',
  beatsPerBar: 5,
  beatUnit: 4,
  groups: [8, 12],
  bpm: [176, 224],
  swing: 0,
  boxDrums: false,
  strictness: 'free',
  hook: 'through',
  modeWeights: { minor: 0.94, major: 0.06 },
  relativeMajorChorus: 0,
  shots: [[[0, 8, 12], 5], [[0, 4, 8, 14], 3]],
  breakCarrier: 'comp',
  requireLayers: ['comp'],
  excludeLayers: ['brass', 'pad'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'bII', 'bII', 'i', 'i', 'bV', 'bV'], weight: 5 },
      { chords: ['i', 'bII', 'i', 'VII', 'i', 'bII', 'i', 'bV'], weight: 4 },
      { chords: ['i', 'i', 'iio', 'iio', 'i', 'i', 'VI', 'VI'], weight: 3 },
    ],
    chorus: [
      { chords: ['bII', 'bII', 'i', 'i', 'VI', 'VI', 'i', 'i'], weight: 4 },
      { chords: ['i', 'VI', 'bII', 'i', 'i', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    bridge: [{ chords: ['bV', 'bV', 'bII', 'bII', 'i', 'i', 'i', 'i'], weight: 3 }],
    solo: [{ chords: ['i', 'i', 'bII', 'bII', 'i', 'i', 'VII', 'VII'], weight: 4 }],
    outro: [{ chords: ['bII', 'i', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 4, 4, 4], weight: 5 },
    { cell: [-4, 4, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 6, 6], weight: 4 },
    { cell: [8, 4, 8], weight: 3 },
    { cell: [-8, 4, 8], weight: 3 },
    { cell: [20], weight: 2 },
  ],
  cadenceCells: [
    { cell: [20], weight: 6 },
    { cell: [-4, 16], weight: 4 },
    { cell: [8, 12], weight: 3 },
  ],
  bass: [
    { name: 'pound-five', weight: 6, hits: Array.from({ length: 20 }, (_, i) => ({
      at: i, dur: 1, tone: 0 as const, vel: i === 0 || i === 8 ? 0.98 : 0.82,
    })) },
    { name: 'grouping-five', weight: 4, hits: [
      { at: 0, dur: 4, tone: 0, vel: 1 }, { at: 4, dur: 4, tone: 0, vel: 0.86 },
      { at: 8, dur: 4, tone: -5, vel: 0.94 }, { at: 12, dur: 4, tone: 0, vel: 0.86 },
      { at: 16, dur: 4, tone: 'fifth', vel: 0.88 },
    ] },
  ],
  comp: [
    { name: 'downpick-five', weight: 6, ...POWER,
      hits: Array.from({ length: 20 }, (_, i) => ({
        at: i, dur: 1, vel: i === 0 || i === 8 ? 0.98 : 0.86,
      })) },
    { name: 'tremolo-five', weight: 5, ...POWER,
      hits: Array.from({ length: 20 }, (_, i) => ({ at: i, dur: 2, vel: 0.9 })) },
    { name: 'group-five', weight: 3, ...POWER, hits: [
      { at: 0, dur: 8, vel: 1 }, { at: 8, dur: 12, vel: 0.92 },
    ] },
  ],
  drums: [
    { name: 'blast-five', weight: 6, voices: {
      bd: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18],
      sd: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18],
    } },
    { name: 'double-kick-five', weight: 5, voices: {
      bd: Array.from({ length: 20 }, (_, i) => i),
      sd: [4, 12, 16],
      rd: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18],
    } },
    { name: 'grouping-five-kit', weight: 3, voices: {
      bd: [0, 3, 8, 11, 14],
      sd: [4, 16],
      hh: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18],
    } },
  ],
  melody: { leap: 0.55, ornament: 0.3, span: 22, sequence: 0.3, syncopation: 0.6 },
};

// ---------------------------------------------------------------------------
// 1990–2000: extremity, and the two ways out of it
// ---------------------------------------------------------------------------

/**
 * DEATH — the blast beat, tremolo picking, and a register that goes as low as
 * the catalogue allows.
 *
 * The tempo is not the interesting number. What separates this from thrash is
 * that the *guitar has stopped being percussive*: tremolo picking with the palm
 * off the strings produces a continuous band of sound rather than a series of
 * hits, so the rhythmic information moves entirely into the kit, which is why
 * `blast` and `bombBlast` are at the head of the drum table and why the comp is
 * `tremolo` rather than `downpick`.
 *
 * `strictness: 'free'` here as well: this is the style whose melodic material is
 * chromatic by construction, and the four rules the genre leaves on are all
 * describing lines that are trying to be singable.
 */
const death: Style = {
  id: 'death',
  label: 'Death',
  description:
    'Tremolo picking over a blast beat: the guitar becomes a continuous band of sound and every rhythmic event moves into the kit.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [168, 232],
  swing: 0,
  boxDrums: false,
  strictness: 'free',
  hook: 'through',
  modeWeights: { minor: 0.95, major: 0.05 },
  relativeMajorChorus: 0,
  shots: [[[0, 6, 8], 4], [[0, 4, 8, 12], 4], [[0, 2, 3, 8], 3]],
  breakCarrier: 'comp',
  requireLayers: ['comp'],
  excludeLayers: ['brass', 'pad'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'bII', 'bII', 'i', 'i', 'bII', 'bII'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'bV', 'bV', 'i', 'i'], weight: 4 },
      { chords: ['i', 'VI', 'bII', 'i', 'i', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'bII', 'bII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'bII', 'bII', 'VII', 'VII', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['bV', 'bV', 'i', 'i', 'bII', 'bII', 'i', 'i'], weight: 3 }],
    solo: [{ chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'bII', 'bII'], weight: 4 }],
    outro: [{ chords: ['bII', 'bII', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 4, 4], weight: 5 },
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [-4, 4, 4, 4], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 4 },
    { cell: [8, 8], weight: 3 },
    { cell: [16], weight: 2 },
  ],
  cadenceCells: RIFF_CADENCES,
  bass: [semitoneRiff(4), dropRun(3), poundBass(7), followRiff(4), fifths(2)],
  comp: [tremolo(7), downpick(5), chug(2)],
  drums: [blast(6), bombBlast(5), doubleKick(5), backbeat(2)],
  melody: { leap: 0.45, ornament: 0.2, span: 18, sequence: 0.4, syncopation: 0.55 },
};

/**
 * BLACK — the thinnest arrangement in the file, and the argument for `excludeLayers`.
 *
 * Norway, 1993. Everything about the production of this music is subtractive: no
 * bass to speak of, no low end on the guitar, no reverb on the drums, a mix that
 * sounds like it was made through a wall on purpose. What that means for the
 * tables is `excludeLayers: ['brass', 'pad']` — the two layers that would fill in
 * the middle — and a `bass` table of one figure that does nothing but follow.
 *
 * The mode is the other half. This is where `phrygian` is the *first* answer
 * rather than the second: an open-string tremolo riff with the ♭2 in it is the
 * sound, and the ladder in `index.ts` reaches it the moment any table writes a
 * `bII`, which these do more than any other style here.
 *
 * `strictness: 'free'`, and the `blast` at the head of the kit. At 240 BPM the
 * alternating blast is 32 events a second between two limbs, which is past the
 * point where anybody is hearing individual strokes.
 */
const black: Style = {
  id: 'black',
  label: 'Black',
  description:
    'Tremolo riffs on the flat second over a blast beat at two hundred and forty, with the middle of the arrangement deliberately empty.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [190, 258],
  swing: 0,
  boxDrums: false,
  strictness: 'free',
  hook: 'loose',
  modeWeights: { minor: 0.97, major: 0.03 },
  relativeMajorChorus: 0,
  shots: [[[0, 4, 8, 12], 5], [[0, 6, 8], 3]],
  breakCarrier: 'comp',
  requireLayers: ['comp'],
  excludeLayers: ['brass', 'pad'],
  progressions: {
    verse: [
      { chords: ['i', 'bII', 'i', 'bII', 'i', 'bII', 'VII', 'VII'], weight: 5, note: 'Alternating root and flat second, a bar each: the whole harmonic content of a great many of these records, and the reason the melody is phrygian by the second bar' },
      { chords: ['i', 'i', 'VI', 'VI', 'bII', 'bII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'bII', 'bII', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'bII', 'bII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['bII', 'bII', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'bII', 'bII', 'i', 'i', 'i', 'i'], weight: 3 }],
    solo: [{ chords: ['i', 'bII', 'i', 'VII', 'i', 'bII', 'VI', 'VI'], weight: 4 }],
    outro: [{ chords: ['bII', 'bII', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [4, 4, 4, 4], weight: 5 },
    { cell: [8, 8], weight: 5 },
    { cell: [16], weight: 4 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [semitoneRiff(3), poundBass(7), followRiff(3)],
  comp: [tremolo(8), downpick(3), hold(2)],
  drums: [blast(7), hammerBlast(5), bombBlast(4), backbeat(2)],
  melody: { leap: 0.3, ornament: 0.15, span: 15, sequence: 0.7, syncopation: 0.35 },
};

/**
 * MELODIC DEATH — Gothenburg, 1995, and the reunion of the two things that split
 * up in 1983.
 *
 * A Swedish band takes the NWOBHM twin-guitar harmony — which death metal had
 * abandoned as soft — and plays it over a blast beat. That is the entire
 * invention, and it is why this style's tables read as `nwobhm`'s harmony under
 * `death`'s rhythm section: a minor table with real cadences in it, `gallopChop`
 * and `tremolo` sharing the comp, and `doubleKick` under both.
 *
 * `strictness: 'standard'` and `arrangement.harmony` doing the work at the genre
 * level. This is the one extreme style whose lead line is meant to be *hummable*,
 * and the rules that describe a singable line are describing this one correctly.
 */
const melodeath: Style = {
  id: 'melodeath',
  label: 'Melodic death',
  description:
    'Twin guitars in harmony over a blast beat: the new wave of British heavy metal played by Swedes who had been listening to death metal.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [156, 204],
  swing: 0,
  boxDrums: false,
  strictness: 'standard',
  modeWeights: { minor: 0.93, major: 0.07 },
  relativeMajorChorus: 0.1,
  shots: METAL_SHOTS,
  breakCarrier: 'comp',
  requireLayers: ['comp', 'counter'],
  excludeLayers: ['brass'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'V'], weight: 4 },
      { chords: ['i', 'i', 'iv', 'iv', 'VI', 'VI', 'VII', 'VII'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'III', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'VI', 'VII', 'i', 'iv', 'VI', 'V', 'V'], weight: 4 },
      { chords: ['III', 'VII', 'iv', 'i', 'VI', 'VII', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'bII', 'bII', 'VI', 'VI', 'V', 'V'], weight: 3 }],
    solo: [
      { chords: ['i', 'VII', 'VI', 'V', 'i', 'VII', 'VI', 'V'], weight: 5 },
      { chords: ['VI', 'VII', 'i', 'III', 'VI', 'VII', 'i', 'i'], weight: 3 },
    ],
    outro: [{ chords: ['VI', 'VII', 'i', 'i'], weight: 4 }],
  },
  melodyCells: RIFF_CELLS,
  cadenceCells: RIFF_CADENCES,
  bass: [sixthFall(4), dropRun(3), poundBass(6), gallopBass(4), followRiff(4)],
  comp: [tremolo(6), gallopChop(5), downpick(4)],
  drums: [doubleKick(6), blast(4), gallopKit(4), backbeat(2)],
  melody: { leap: 0.42, ornament: 0.4, span: 19, sequence: 0.6, syncopation: 0.45 },
  // `nwobhm`'s number, because the header says this style *is* `nwobhm`'s harmony
  // under `death`'s rhythm section and the harmony is the half being borrowed —
  // *that is the entire invention*. It is also the one place in the file where the
  // pair carries the tune outright: the voice is a scream, and the extreme era's
  // melody palette heads with `distortionGuitar` at 8 for exactly that reason —
  // if the guitars are not stating the line, nobody is.
  harmony: twinGuitars(0.6),
};

/**
 * SYMPHONIC — the orchestra, and the only style here where the `brass` layer
 * means something.
 *
 * Everything else in this catalogue excludes it, because a horn section in metal
 * is a category error. Here the layer is carrying strings, horns and timpani —
 * the palette in `eras.ts` puts them there for the extreme era — and the
 * arrangement genuinely has two bands in it playing the same music, which is what
 * the style is.
 *
 * `triads` in the comp table, because an orchestra states quality by
 * construction: a string section playing a power chord is a string section
 * playing an open fifth, which is a real orchestral sound and is not what anybody
 * writing this music wants under a soprano.
 *
 * `strictness: 'standard'` — the one style here whose model is nineteenth-century
 * part-writing, and the rules were derived from nineteenth-century part-writing.
 */
const symphonic: Style = {
  id: 'symphonic',
  label: 'Symphonic',
  description:
    'Strings, timpani and a choir over the band, real triads rather than power chords, and two ensembles playing the same music at once.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [128, 172],
  swing: 0,
  boxDrums: false,
  strictness: 'standard',
  modeWeights: { minor: 0.78, major: 0.22 },
  relativeMajorChorus: 0.25,
  shots: METAL_SHOTS,
  breakCarrier: 'comp',
  requireLayers: ['comp', 'pad'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'VI', 'VI', 'iv', 'iv', 'V', 'V'], weight: 5 },
      { chords: ['i', 'VII', 'VI', 'V', 'i', 'VII', 'VI', 'V'], weight: 4 },
      { chords: ['i', 'i', 'III', 'III', 'VI', 'VI', 'V', 'V'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'III', 'VI', 'iv', 'V', 'i'], weight: 5 },
      { chords: ['iv', 'V', 'III', 'VI', 'iv', 'V', 'i', 'i'], weight: 4 },
      { chords: ['bII', 'bII', 'V', 'V', 'i', 'i', 'i', 'i'], weight: 3, note: 'The Neapolitan and the dominant, in that order, which is a nineteenth-century cadence being played at 160 with two kick drums under it' },
    ],
    bridge: [{ chords: ['iv', 'iv', 'bII', 'bII', 'V/iv', 'V/iv', 'V', 'V'], weight: 3 }],
    solo: [{ chords: ['i', 'VI', 'III', 'VII', 'iv', 'V', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['iv', 'V', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'], weight: 5 },
      { chords: ['I', 'I', 'IV', 'IV', 'ii', 'ii', 'V', 'V'], weight: 3 },
    ],
    chorus: [
      { chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'V', 'I'], weight: 5 },
      { chords: ['IV', 'V', 'iii', 'vi', 'IV', 'V', 'I', 'I'], weight: 3 },
    ],
    solo: [{ chords: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'], weight: 4 }],
    outro: [{ chords: ['IV', 'V', 'I', 'I'], weight: 4 }],
  },
  melodyCells: [
    { cell: [-4, 4, 4, 4], weight: 5 },
    { cell: [4, 4, 8], weight: 5 },
    { cell: [8, 8], weight: 4 },
    { cell: [-2, 6, 8], weight: 4 },
    { cell: [2, 2, 4, 8], weight: 3 },
    { cell: [16], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 7 },
    { cell: [4, 12], weight: 4 },
    { cell: [-4, 12], weight: 3 },
  ],
  bass: [sixthFall(4), poundBass(5), followRiff(5), fifths(3)],
  comp: [
    triads(6, [
      { at: 0, dur: 2, vel: 0.95 }, { at: 2, dur: 2, vel: 0.82 },
      { at: 4, dur: 2, vel: 0.9 }, { at: 6, dur: 2, vel: 0.82 },
      { at: 8, dur: 2, vel: 0.92 }, { at: 10, dur: 2, vel: 0.82 },
      { at: 12, dur: 2, vel: 0.9 }, { at: 14, dur: 2, vel: 0.84 },
    ]),
    chug(5),
    gallopChop(3),
  ],
  drums: [doubleKick(6), gallopKit(4), backbeat(3), blast(2)],
  melody: { leap: 0.4, ornament: 0.5, span: 21, sequence: 0.6, syncopation: 0.35 },
};

/**
 * GOTHIC — slow, organ-led, and the one style here whose ancestor is not metal
 * at all.
 *
 * The lineage runs through post-punk rather than through Birmingham: a church
 * organ, a mid-tempo six-eight lean, a female vocal against a male one, and the
 * guitars playing whole notes underneath rather than a riff. `triads` and a comp
 * of long held chords say that in the table — this is the only style in the file
 * whose rhythm guitar is not doing anything rhythmic.
 *
 * `strictness: 'standard'` and the highest `ornament` figure here. The melodic
 * model is a chant, not a riff.
 */
const gothic: Style = {
  id: 'gothic',
  label: 'Gothic',
  description:
    'A church organ, chords held for whole bars, and a sung line with no riff underneath it. The one style here descended from post-punk rather than from Birmingham.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [70, 104],
  swing: 0,
  boxDrums: false,
  strictness: 'standard',
  modeWeights: { minor: 0.88, major: 0.12 },
  relativeMajorChorus: 0.15,
  shots: [[[0, 8], 5], [[0, 6, 12], 3]],
  breakCarrier: 'comp',
  requireLayers: ['comp', 'pad'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'VI', 'VI', 'III', 'III', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'i', 'iv', 'iv', 'VI', 'VI', 'V', 'V'], weight: 4 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'VI', 'VI'], weight: 4 },
    ],
    chorus: [
      { chords: ['VI', 'III', 'VII', 'iv', 'VI', 'III', 'V', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'VI', 'VI', 'V', 'V', 'i', 'i'], weight: 4 },
    ],
    bridge: [{ chords: ['bII', 'bII', 'iv', 'iv', 'VI', 'VI', 'V', 'V'], weight: 3 }],
    solo: [{ chords: ['i', 'VI', 'III', 'VII', 'iv', 'V', 'i', 'i'], weight: 4 }],
    outro: [{ chords: ['iv', 'V', 'i', 'i'], weight: 4 }],
  },
  majorProgressions: {
    verse: [{ chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'ii', 'V'], weight: 5 }],
    chorus: [{ chords: ['vi', 'IV', 'I', 'V', 'vi', 'IV', 'V', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'vi', 'IV', 'V', 'I', 'vi', 'ii', 'V'], weight: 4 }],
    outro: [{ chords: ['IV', 'V', 'I', 'I'], weight: 3 }],
  },
  melodyCells: [
    { cell: [16], weight: 5 },
    { cell: [8, 8], weight: 5 },
    { cell: [-4, 4, 8], weight: 4 },
    { cell: [4, 4, 8], weight: 4 },
    { cell: [-2, 6, 8], weight: 3 },
    { cell: [12, 4], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 8 },
    { cell: [-4, 12], weight: 4 },
    { cell: [8, 8], weight: 3 },
  ],
  bass: [slowRiff(4), holdBass(5), followRiff(4), fifths(4)],
  comp: [
    triads(6, [
      { at: 0, dur: 8, vel: 0.9 }, { at: 8, dur: 8, vel: 0.86 },
    ]),
    triads(4, [
      { at: 0, dur: 4, vel: 0.9 }, { at: 4, dur: 4, vel: 0.82 },
      { at: 8, dur: 4, vel: 0.88 }, { at: 12, dur: 4, vel: 0.82 },
    ]),
    hold(3),
  ],
  drums: [crawl(5), backbeat(5), halfTime(4)],
  melody: { leap: 0.3, ornament: 0.6, span: 17, sequence: 0.55, syncopation: 0.3 },
  /**
   * *The melodic model is a chant, not a riff* — the header's own sentence,
   * against a resolved table whose likeliest draw is the riff.
   *
   * Derivation reads `chant` off density and hands this style the 0.50 floor, so
   * `index.ts` lifts it to 3.5 and cites this header by name for it. But it lifts
   * `riff-response` to 5 in the same table, and the two together resolve to
   * riff-response 30.3% of the draw against chant 21.2% — the sentence above
   * losing to the thing it says this style is not. Swapping the pair is the whole
   * delta.
   *
   * The numbers side with the header rather than with the table: **80% of
   * adjacent intervals a step and 7% wide, second only to `postmetal` in this
   * file for stepwise motion**, which is `chant`'s own `leap: 0.5` and
   * `judge.motion: 0.6` and is nothing `riff-response` — *a short figure and the
   * thing that answers it* — describes.
   *
   * `long-note` is left where the genre put it, on the genre's own argument
   * against raising it here: the whole notes in the header are the *guitars*
   * under the singer, not the sung line.
   */
  voice: {
    archetypes: [['chant', 5], ['riff-response', 1]],
  },
};

/**
 * FOLK METAL — six eight, and the one style here that reaches for the hand drums.
 *
 * `beatsPerBar: 3` with `groups: [6, 6]` is compound duple: twelve sixteenths in
 * two groups of six, which is a jig, and a jig at 160 with distortion on it is
 * most of what this style is. It has to be declared for the same reason 7/8 does
 * — slot arithmetic in fours would accent slots 0, 4 and 8, which puts a
 * half-bar accent in the middle of the first group and turns a jig into a fast
 * three.
 *
 * `lp`, `mp` and `hp` in the kit tables are the new hand-drum voices, and this is
 * the one place in the genre they belong: a bodhrán or a frame drum under the
 * kit, which is what every band in this style actually puts there. `tb` is the
 * tambourine, and the reason it needed a name of its own — written on `sh`, as it
 * had to be before, it came out as a dry rush with no metal in it.
 */
const folkmetal: Style = {
  id: 'folkmetal',
  label: 'Folk',
  description:
    'A jig at a hundred and sixty with distortion on it: six eight in two groups of six, a frame drum under the kit and a fiddle answering the guitar.',
  beatsPerBar: 3,
  beatUnit: 8,
  groups: [6, 6],
  bpm: [132, 176],
  swing: 0,
  boxDrums: false,
  modeWeights: { minor: 0.75, major: 0.25 },
  relativeMajorChorus: 0.2,
  shots: [[[0, 6], 5], [[0, 3, 6, 9], 3], [[0, 4, 6, 10], 2]],
  breakCarrier: 'comp',
  requireLayers: ['comp'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'VII', 'VII', 'i', 'i', 'VII', 'VII'], weight: 5 },
      { chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'IV', 'IV', 'i', 'i', 'VII', 'VII'], weight: 4, note: 'i–IV in a minor key. The major fourth carries the natural sixth, which aeolian has not got, so the ladder in index.ts bends to dorian to hold it — the mode every fiddle tune in this repertoire is actually in, reached without this table asking for it' },
    ],
    chorus: [
      { chords: ['VI', 'VII', 'i', 'i', 'VI', 'VII', 'i', 'i'], weight: 5 },
      { chords: ['III', 'VII', 'i', 'i', 'III', 'VII', 'VI', 'VII'], weight: 4 },
    ],
    bridge: [{ chords: ['iv', 'iv', 'VII', 'VII', 'III', 'III', 'VII', 'VII'], weight: 3 }],
    solo: [{ chords: ['i', 'VII', 'VI', 'VII', 'i', 'VII', 'i', 'i'], weight: 5 }],
    outro: [{ chords: ['VII', 'VI', 'VII', 'i'], weight: 4 }],
  },
  majorProgressions: {
    verse: [
      { chords: ['I', 'I', 'bVII', 'bVII', 'I', 'I', 'IV', 'IV'], weight: 5 },
      { chords: ['I', 'V', 'vi', 'IV', 'I', 'V', 'I', 'I'], weight: 3 },
    ],
    chorus: [{ chords: ['IV', 'bVII', 'I', 'I', 'IV', 'V', 'I', 'I'], weight: 4 }],
    solo: [{ chords: ['I', 'I', 'bVII', 'bVII', 'I', 'I', 'IV', 'V'], weight: 4 }],
    outro: [{ chords: ['bVII', 'IV', 'I', 'I'], weight: 3 }],
  },
  melodyCells: [
    { cell: [2, 2, 2, 2, 2, 2], weight: 5 },
    { cell: [4, 2, 4, 2], weight: 5 },
    { cell: [-2, 2, 2, 6], weight: 4 },
    { cell: [6, 6], weight: 4 },
    { cell: [2, 2, 2, 6], weight: 4 },
    { cell: [12], weight: 3 },
    { cell: [-4, 2, 6], weight: 3 },
  ],
  cadenceCells: [
    { cell: [12], weight: 6 },
    { cell: [-2, 10], weight: 4 },
    { cell: [6, 6], weight: 3 },
  ],
  bass: [
    { name: 'jig-bass', weight: 6, hits: [
      { at: 0, dur: 3, tone: 0, vel: 1 }, { at: 3, dur: 3, tone: 7, vel: 0.84 },
      { at: 6, dur: 3, tone: 0, vel: 0.94 }, { at: 9, dur: 3, tone: -5, vel: 0.84 },
    ] },
    { name: 'jig-drive', weight: 4, hits: Array.from({ length: 12 }, (_, i) => ({
      at: i, dur: 1, tone: 0 as const, vel: i === 0 || i === 6 ? 0.98 : 0.82,
    })) },
  ],
  comp: [
    { name: 'jig-chop', weight: 6, ...POWER, hits: [
      { at: 0, dur: 2, vel: 0.98 }, { at: 2, dur: 1, vel: 0.8 }, { at: 3, dur: 1, vel: 0.86 },
      { at: 4, dur: 2, vel: 0.84 },
      { at: 6, dur: 2, vel: 0.96 }, { at: 8, dur: 1, vel: 0.8 }, { at: 9, dur: 1, vel: 0.86 },
      { at: 10, dur: 2, vel: 0.84 },
    ] },
    { name: 'jig-drone', weight: 4, ...POWER, hits: [
      { at: 0, dur: 6, vel: 0.95 }, { at: 6, dur: 6, vel: 0.9 },
    ] },
    { name: 'jig-eighths', weight: 3, ...POWER,
      hits: Array.from({ length: 6 }, (_, i) => ({ at: i * 2, dur: 2, vel: i % 3 === 0 ? 0.96 : 0.84 })) },
  ],
  drums: [
    { name: 'jig-kit', weight: 6, voices: {
      bd: [0, 4, 6, 10],
      sd: [3, 9],
      hh: [0, 2, 4, 6, 8, 10],
      tb: [0, 3, 6, 9],
    } },
    { name: 'jig-frame-drum', weight: 5, voices: {
      bd: [0, 6],
      sd: [3, 9],
      lp: [0, 4, 6, 10],
      mp: [2, 8],
      hp: [3, 5, 9, 11],
      tb: [0, 2, 4, 6, 8, 10],
    } },
    { name: 'jig-drive-kit', weight: 3, voices: {
      bd: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      sd: [3, 9],
      rd: [0, 2, 4, 6, 8, 10],
    } },
  ],
  melody: { leap: 0.4, ornament: 0.55, span: 17, sequence: 0.65, syncopation: 0.3 },
};

/**
 * POST-METAL — the build, and the second style that declares a `filter`.
 *
 * `shape: 'ramp'` rather than `step`, because here the opening genuinely is the
 * composition: sixteen bars that start almost inaudible and arrive, which is not
 * a gesture any amount of level work reproduces and is the one thing this style
 * does that nothing else in the file does. Ambient's `berlin` filter ramp is the
 * same mechanism used for the opposite feeling.
 *
 * `hook: 'through'` and the longest cadence cells here. A post-metal section does
 * not return; it becomes the next one.
 */
const postmetal: Style = {
  id: 'postmetal',
  label: 'Post-metal',
  description:
    'Sixteen-bar builds with the filter opening across them, sections that become the next one rather than returning, and nothing announced.',
  beatsPerBar: 4,
  beatUnit: 4,
  bpm: [66, 108],
  swing: 0,
  boxDrums: false,
  hook: 'through',
  filter: { depth: 0.7, shape: 'ramp' },
  modeWeights: { minor: 0.9, major: 0.1 },
  relativeMajorChorus: 0,
  shots: [[[0, 8], 4], [[0, 6, 12], 3]],
  breakCarrier: 'comp',
  requireLayers: ['comp'],
  progressions: {
    verse: [
      { chords: ['i', 'i', 'i', 'i', 'VI', 'VI', 'VI', 'VI'], weight: 5 },
      { chords: ['i', 'i', 'i', 'i', 'i', 'i', 'i', 'i'], weight: 4 },
      { chords: ['i', 'i', 'VII', 'VII', 'VI', 'VI', 'iv', 'iv'], weight: 3 },
    ],
    chorus: [
      { chords: ['VI', 'VI', 'VII', 'VII', 'i', 'i', 'i', 'i'], weight: 5 },
      { chords: ['iv', 'iv', 'VI', 'VI', 'i', 'i', 'i', 'i'], weight: 3 },
    ],
    bridge: [{ chords: ['bII', 'bII', 'bII', 'bII', 'i', 'i', 'i', 'i'], weight: 3 }],
    solo: [{ chords: ['i', 'i', 'VI', 'VI', 'VII', 'VII', 'i', 'i'], weight: 4 }],
    outro: [{ chords: ['VI', 'VI', 'i', 'i'], weight: 4 }],
  },
  melodyCells: [
    { cell: [16], weight: 6 },
    { cell: [8, 8], weight: 5 },
    { cell: [-8, 8], weight: 4 },
    { cell: [-4, 12], weight: 3 },
    { cell: [4, 4, 8], weight: 3 },
  ],
  cadenceCells: [
    { cell: [16], weight: 8 },
    { cell: [-8, 8], weight: 4 },
  ],
  bass: [slowRiff(4), holdBass(6), followRiff(4), poundBass(3)],
  comp: [hold(6), tremolo(4), downpick(3), chug(3)],
  drums: [crawl(5), halfTime(5), backbeat(4), doubleKick(2)],
  melody: { leap: 0.25, ornament: 0.3, span: 15, sequence: 0.6, syncopation: 0.3 },
  /**
   * `doom`'s pair, for the style `index.ts` names beside it.
   *
   * *A post-metal section does not return; it becomes the next one* — sixteen-bar
   * builds with *nothing announced*, `[16]` at weight 6 in the cells and 8 in the
   * cadences, which is *the longest cadence cells here* by the header's own count.
   * That derives 1.52 onsets a bar and `long-note` at 2.47 of 11.1; the genre
   * voice puts the archetype at 1 and `riff-response` at 5, which is a call and
   * an answer announced every two bars in the one style whose header says nothing
   * is announced.
   *
   * Measured, it is the second-widest gap in the genre — **2.77 realised onsets a
   * bar against 1.52 declared, 1.82× against a metal median of 1.18×** — and the
   * interval mix says which archetype is wrong rather than merely that one is:
   * **84% steps and 4% wide intervals, the most stepwise line in the genre**. A
   * build is a line that walks; the figure-and-answer is the thing it is not.
   */
  voice: {
    archetypes: [['long-note', 2.5], ['riff-response', 1]],
  },
};

export const STYLES: Record<string, Style> = {
  heavy, doom, stoner, sludge,
  nwobhm, speed, power, glam, shred,
  thrash, crossover, groove, metalcore, industrial, progressive, djent, techdeath,
  death, black, melodeath, symphonic, gothic, folkmetal, postmetal,
};
