/**
 * Jazz.
 *
 * The important difference from iskelmä is not the chords, it is where the
 * melody gets its notes. Iskelmä melody is *key*-relative — one scale for the
 * whole song. Jazz melody is *chord*-relative: each chord quality implies its
 * own scale and the line re-orients bar by bar. That is chord-scale theory, and
 * it is the reason a jazz line played over the same progression as an iskelmä
 * line sounds like a different music rather than the same music with sevenths.
 */

import { isAlteredDominant } from '../../core/chord.js';
import { pc } from '../../core/pitch.js';
import { makeScale } from '../../core/scale.js';
import { RULE_DISABLED } from '../../core/rules.js';
import type { Genre, FormStep } from '../types.js';
import { STYLES } from './styles.js';
import { ERAS } from './eras.js';
import { MOODS } from './moods.js';
import { VOCALS } from './vocals.js';
import { generateTitle } from './titles.js';
import { STAGING } from './staging.js';

/**
 * Head–solos–head. `verse` is the A section and `bridge` is the B, so an AABA
 * chorus is four sections. Styles with a fixed chorus length (the blues, at
 * twelve bars) have these eight-bar units rewritten by the form builder.
 */
const FORMS: (readonly [FormStep[], number])[] = [
  // Full AABA: head, a chorus of solos, head again.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 }, { kind: 'bridge', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'solo', bars: 8 }, { kind: 'solo', bars: 8 }, { kind: 'solo', bars: 8 }, { kind: 'solo', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 }, { kind: 'bridge', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 4],
  // Half-chorus of solos — shorter, better for a radio rotation.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'verse', bars: 8 }, { kind: 'bridge', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'solo', bars: 8 }, { kind: 'solo', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'bridge', bars: 8 }, { kind: 'verse', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 5],
  // Simple AB head with two solo choruses — the natural fit for the blues.
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 },
    { kind: 'solo', bars: 8 }, { kind: 'solo', bars: 8 },
    { kind: 'verse', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 5],
  [[
    { kind: 'intro', bars: 4 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'solo', bars: 8 }, { kind: 'solo', bars: 8 },
    { kind: 'verse', bars: 8 }, { kind: 'chorus', bars: 8 },
    { kind: 'outro', bars: 4 },
  ], 3],
];

export const jazz: Genre = {
  id: 'jazz',
  label: 'Jazz',
  description: 'Swing, bebop, ballads, bossa nova, blues, modal and gypsy jazz.',
  styles: STYLES,
  eras: ERAS,
  moods: MOODS,
  vocals: VOCALS,
  title: generateTitle,
  forms: FORMS,
  keys: {
    // Horn keys, not guitar keys — jazz lives in flats because the trumpet and
    // tenor are transposing instruments and Bb/Eb sit best under the fingers.
    major: [[10, 5], [5, 5], [3, 4], [0, 4], [8, 3], [7, 3], [1, 2]],
    minor: [[0, 4], [2, 4], [7, 4], [5, 4], [10, 3], [9, 3], [4, 2]],
  },
  // The rules exist to stop a line wandering; jazz wanders on purpose. Only the
  // genuinely unplayable intervals are worth blocking here, and bebop turns
  // even that off via its own style override.
  // The head goes out on a held chord, and the count-in is so much a part of
  // the idiom that it survives onto the records — a stick count is the first
  // thing on more jazz sides than anybody bothers to notice.
  ending: 'button',
  countIn: true,

  defaultStrictness: 'light',

  // The head should come back recognisably — that is what makes it a head — but
  // jazz keeps its repetition in the form rather than in the phrase, and the
  // solos are exempt from recall at every level. `loose` gives the harmony that
  // consistency without locking rhythms or narrowing the vocabulary.
  defaultHook: 'loose',

  /**
   * No `harmony`, and no `arrangement` either — **jazz is the one genre of the
   * nineteen that overrides neither**, so its second voice arrives from the
   * shared pool at `harmony: 4` and from nowhere else. Against rnb and metal at
   * 8, country and pop at 7, indian at 0, this genre has never had an opinion
   * about the device in either direction, and 4 out of a pool of six is the
   * colour the device was built to be: a harmony phrase in a repeat chorus,
   * 0.73% of melody bars. A standing property says something much stronger —
   * *this music is two voices for the length of the statement* — and jazz says
   * the opposite wherever it has said anything at all.
   *
   * **Where it writes a second voice it writes the octave.** The three styles
   * with one to write are the `twoHanded` ones, and all three rank `unison`:
   * `fusion` first at 6 of 15, because "a fusion head *is* the two hands playing
   * the same line an octave apart", `trio` and `odd` at 2 of 11 and 2 of 12,
   * where the entry calls it a departure and says every section would be a
   * mannerism. An octave inside a harmony line is the fault the pass exists to
   * repair, so the most two-voiced writing in the catalogue is the writing a
   * declaration here would contradict.
   *
   * **And the harmonised line it does hold is already written, elsewhere.**
   * `block` — locked hands, the chord struck *with* the tune — is a
   * `LeftHandMode` drawn once per section on all three, which is the same scope
   * a declaration would claim, on the player whose hands it actually is. `trio`
   * then puts `counter` in `excludeLayers`, so `on: 'counter'` is unsayable on
   * the style that harmonises most.
   *
   * The other seven decline on their own terms. `bebop` runs 7.07 onsets a bar
   * at 196–280 and calls a recalled phrase the one thing the idiom refuses; a
   * second horn tracking that in parallel thirds is a Supersax arrangement, not
   * a quintet. `modal` hands eight bars of one chord to a line that "has to
   * carry everything" and `ballad` builds one "as much from silence as from
   * notes" — both thin on purpose, and a parallel part thickens. The swing era's
   * written harmony is already declared and is not a melody: four sections on
   * the `pad` holding a median 3.95 beats a note under somebody's solo, which is
   * how 1938 scored it. `on: 'vocal'` fails on the profile — one scat singer,
   * `signature: 'male'`, a syllable every half beat, "a member of the band" —
   * and the close-harmony quartet is refused two files along as a group that
   * took *a chorus* and sat down, which is an event and so is the device draw.
   *
   * What would change this is a hard-bop entry: a two-horn Blue Note head
   * harmonised end to end through the statement, which is a genuine standing
   * property and has no style among the ten. That is a `styles.ts` decision
   * before it is a field here, and it would be declared on that style rather
   * than on the genre.
   */

  // The rhythm section reacts to a soloist rather than running its pattern at
  // them. This is what "comping" means and it is not optional in the idiom —
  // a jazz band that plays the head arrangement under a blowing chorus is a
  // jazz band playing a backing track.
  soloBacking: 'comping',

  /**
   * …and the same word applied to the note level, where it was missing.
   *
   * `soloBacking: 'comping'` says the rhythm section changes what it plays when
   * a soloist stands up. It says nothing about the bar-to-bar behaviour that
   * gives the word its meaning, and measured against the finished tracks that
   * behaviour was absent: in a twelve-bar blues, where the chorus repeats a
   * chord in consecutive bars, the piano played a **note-for-note identical bar
   * 79% of the time**. The band reacted to the *section* and looped inside it.
   *
   * `rest` is the largest of the three and the one that matters most. A comper's
   * holes are not economy, they are the thing that makes the chords land, and
   * roughly one bar in five is what it takes to hear it. `anticipate` is the
   * gesture the idiom is named for after comping itself — the chord arriving
   * ahead of the barline — and it is flatly unreachable from a figure on a grid.
   * `displace` is the smallest and does the least on its own; what it buys is
   * that two bars of the same figure stop being the same bar twice.
   */
  comping: { rest: 0.18, anticipate: 0.3, displace: 0.25 },

  /**
   * Improvisation, and the reason the solo engine is worth building.
   *
   * The rotation is the bandstand's: the front-line horn first, then whoever
   * is comping, then the second horn, and — rarely, because they are rare —
   * the bass and the kit. `planSolos` refuses to give anyone two choruses in a
   * row and refuses to open the blowing on the drums, so this table only has
   * to say who is *available* and how often.
   *
   * The vocabulary numbers are where the idiom actually lives:
   *
   *  - `offbeatAccent` at 0.9. Swung eighths with the weight on the *and* is
   *    most of what separates a jazz line from the same pitches played
   *    correctly. Nothing else in this generator accents off the beat.
   *  - `enclosure` at 0.55. Approaching a guide tone from above and below is
   *    the single most characteristic bebop gesture, and it is chromatic by
   *    construction — which is why `chromatic-tone` is disabled in the rule
   *    overrides above rather than why the solo engine ignores the rules.
   *  - `develop` at 0.72. High, because the difference between a solo and a
   *    string of licks is whether the second phrase is *about* the first.
   *  - `space` at 0.22, which comes out as a quarter of the chorus's beats
   *    having nothing start in them once the phrase gaps and the two bars the
   *    arc hands back are counted. Lower and the line never stops; higher and
   *    it stops being a chorus and starts being a series of remarks.
   *  - `paraphrase` at 0. Jazz states the head and then leaves it. A solo that
   *    ornaments the tune is a different genre's break.
   */
  solo: {
    rotation: [['melody', 6], ['comp', 4], ['counter', 3], ['bass', 1.5], ['drums', 1]],
    // Better than half the time, and never every time. See `tradeFours`.
    tradeFours: 0.6,
    // Not every chorus, and never more than one quote in a chorus: the point of
    // hearing the tune's figure in the solo is that it is unexpected.
    quoteMotto: 0.4,
    backing: {
      melody: 'comping', counter: 'comping', comp: 'comping',
      // A bass solo thins the backing to almost nothing — comp out, drums to
      // brushes. That contrast *is* the bass solo, and a bass solo staged badly
      // is worse than not having one, because the audience cannot hear it.
      bass: 'sparse',
      drums: 'trade',
    },
    vocabulary: {
      gait: 0.5,
      doubleTime: 0.22,
      offbeatAccent: 0.9,
      enclosure: 0.55,
      chromatic: 0.5,
      // Zero, and not an oversight. A bebop player's decoration is the
      // chromatic approach note; a crushed grace before the beat is a
      // dance-band gesture and belongs to the genre that owns it.
      ornament: 0,
      develop: 0.72,
      displace: 0.5,
      space: 0.22,
      climb: 3,
      paraphrase: 0,
      // The head comes back with a tune of its own; a soloist still climbing
      // into it is playing over it.
      liftIntoReturn: 0.12,
    },
  },

  /**
   * Where jazz disagrees with the shared rule table.
   *
   * The table was written from classical voice-leading and general arranging
   * practice. Most of it transfers — a minor ninth against a held chord tone is
   * sour in any idiom — but several rules encode conventions jazz simply does
   * not hold, and enforcing those produces music that is correct and wrong.
   */
  ruleOverrides: {
    // A jazz line is under no obligation to resolve its leading tone upward.
    // Bebop routinely descends from the 7th, and the "resolution" of a ii–V is
    // carried by the guide tones in the comp, not by the melody.
    'unresolved-leading-tone': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    // Chromaticism is the vocabulary, not a defect: approach notes, enclosures
    // and blue notes are all chromatic by definition.
    'chromatic-tone': { minLevel: RULE_DISABLED, vetoLevel: RULE_DISABLED },

    // Leaping into a non-chord tone is how a bebop line gets anywhere. Keep it
    // as a gentle preference at the top two levels only.
    'unprepared-dissonance': { minLevel: 3, vetoLevel: 4, penalty: 0.5 },

    // A ♭9 over a dominant is a colour jazz reaches for deliberately — it is
    // the sound of the minor ii–V. Only police it at the smoothest setting.
    'flat-nine': { minLevel: 4, vetoLevel: 4 },

    // Parallel fifths and octaves are a choral prohibition. Quartal planing and
    // block-chord writing move in parallel on purpose.
    'parallel-perfects': { minLevel: 4, vetoLevel: RULE_DISABLED, penalty: 0.6 },

    // Still awkward, but less taboo than in a singable idiom — the altered and
    // diminished scales contain them by construction.
    'augmented-second': { vetoLevel: 2, penalty: 0.3 },

    // The natural 11 over a major seventh is a genuine avoid note in jazz, more
    // so than in iskelmä. Tighten rather than relax.
    'avoid-fourth': { minLevel: 2, vetoLevel: 3 },
  },

  duration: [125, 215],

  /**
   * What a jazz tune is made of.
   *
   * Three tables, and the six scalars `voiceForStyle` derives are left exactly
   * where they were. Density is the reason: it comes from each style's own cells
   * and spreads **2.42 onsets a bar on `ballad` to 7.07 on `bebop`** inside this
   * one genre, which is the widest distinction the tables here make, and a
   * genre-wide figure would flatten it.
   *
   * ## The degrees are *chord* degrees, which is the whole subset argument
   *
   * `scaleForChord` below roots the scale on the chord, so a subset index is a
   * chord degree: 6 is whatever is sounding's seventh, 3 is its eleventh. Every
   * chord in `styles.ts` is a seventh chord — "Plain triads barely appear" — so
   * the seventh is a guide tone and stays in all three entries.
   *
   * The eleventh is the one the table has to argue about, and it divides by
   * chord quality rather than by genre. `avoid-fourth` clears three guards before
   * it fires (`core/rules.ts:309-313`): the chord is not `sus4`, it *has* a major
   * third, and the note is held a beat on a strong one. Over `Imaj9` that is a
   * real avoid note and the override above is right to tighten it. But the
   * eleventh *is* the chord in `i11`/`iv11`, which is the entire harmonic content
   * of the `trio`, `odd` and `fusion` vamps, and in the trio's signature `V7sus4`
   * — "the V that never quite resolves" — which is why `scaleForChord` hands sus
   * chords mixolydian for "the fourth the chord is built on". `snapToSubset` has
   * none of the rule's three guards, and it runs on the *non-anchor* notes
   * (`surface.ts:230,240`) — the passing ones the rule's own description calls
   * "fine as a passing suspension". So the no-eleventh entry is a colour with a
   * chord quality attached, not a discipline the genre holds: level with the
   * whole chord-scale, not above it. (The overrides are not clean evidence for it
   * either. Six of seven loosen, and the seventh, `augmented-second`, raises its
   * veto *level* while raising its penalty from 0.02 to 0.3.)
   *
   * The whole chord-scale ties it, because `chromatic-tone` is disabled
   * genre-wide — approach notes and enclosures *are* the vocabulary — and a bebop
   * line running eighths through the changes has no business being snapped
   * anywhere. Third is 1 3 4 5 7, the minor pentatonic over the min7 and min11
   * vamps of `modal`, `trio`, `odd` and `fusion`, and it is at 1 because it is
   * wrong off them: over a major-quality chord it is the eleventh back in with
   * the major third a semitone under it, and on `blues`, which overrides
   * `scaleForChord` to the six-note blues scale, `snapToSubset` keeps root, 4, ♭5
   * and 5 — three adjacent semitones, no third and no seventh.
   *
   * `blues` bends the other two as well, because dropping degrees a shorter scale
   * has not got is what `snapToSubset` does with them. The first entry lands as
   * that scale minus its ♭5, one note thinner than a scale whose own comment says
   * "six notes ... is thin, and a head built purely from it reads as pentatonic
   * noodling"; the second snaps nothing at all against six notes. Three and three
   * is what stops the thinning being the majority outcome there.
   *
   * ## The archetypes fix a derivation that reads density and means recall
   *
   * `archetypesFor` hands `bebop` the genre's highest `riff-response` (5.97) and
   * its highest `chant` (3.42) purely because it is the busiest style here, and
   * bebop's own entry says a recalled phrase is "the one thing the idiom actively
   * refuses to do". So `chant` goes to the floor: it is `hook: 'through'` on five
   * of the ten styles, and `defaultHook: 'loose'` above says why — jazz keeps its
   * repetition in the form rather than in the phrase.
   *
   * `riff-response` at 2.5 cuts bebop's 5.97 and lifts every other style, ballad
   * from 0.68 — a rise on nine of ten, and the reason it is not higher. Two
   * tables argue for it: a blues head "is a riff, and a riff is stated again",
   * and the trio's left hand draws `answer` 6 of 11 "because that is what this
   * idiom is". Two argue against — `fusion` ranks `answer` last of four, "a
   * fusion head *is* the two hands playing the same line an octave apart", and
   * `odd` puts `ostinato` first. The archetype's `judge` is `figure: 1.8,
   * economy: 1.5`, which is recall coming back by another door, so the tie goes
   * to the middle of the table rather than the top of it.
   *
   * `descending-sequence` is the lift, from a derived 1.75–2.35 that never once
   * outranks the flat 3 every style gets for `arch-hook`. Most of this genre is
   * ii–V chains walking down in fifths — the rhythm-changes bridge is "four
   * dominants round the circle of fifths" — and the archetype puts its high point
   * at 0.08–0.25 of the section, a line entering on a guide tone and falling away
   * through the changes. Three rather than four because the exceptions are named
   * ones: trio's and bebop's thirds motion, "instead of round the circle", and
   * the one-chord vamps of `odd` and `fusion`. It reads the same
   * `melody.sequence` as `ops.sequence` and does not mean the same thing by it —
   * the op asks how often a *figure* gets walked down, a per-style habit the
   * tables have right; the archetype asks whether a *section* is shaped as a
   * fall, which is a fact about the changes that `melody.sequence` never
   * measured. That is why the op below is left alone and this is not.
   *
   * `arch-hook` comes down a little for the mirror reason: `FORMS` spends four
   * sections on one AABA chorus, so this genre's arch is 32 bars long and its
   * high point is not an eight-bar event. `wide-interval` goes up on the declared
   * spans — 15 to 24 semitones, median 18 against the catalogue's 14 — and on the
   * override that explains them, "leaping into a non-chord tone is how a bebop
   * line gets anywhere".
   *
   * `long-note` is left off, and it took a weight to see why. Nine of ten styles
   * put a whole-bar note at the top or joint top of their `cadenceCells` and
   * `ending: 'button'` takes the head out on one — but cadence cells are drawn
   * independently of the archetype, so the phrase ends long either way and none
   * of that is evidence about the section. What a weight there actually buys is
   * `density: 0.45` and `judge: { density: 0.3 }` across the whole of one, which
   * on bebop is 3.2 onsets a bar against prose reading "continuous eighth-note
   * lines ... at tempos where a singer would simply give up". `long-note` is a
   * density archetype and density is the one thing derivation measures directly,
   * so it is right already: ballad 1.21, bebop 0.4.
   *
   * ## What keeps this from being classical
   *
   * Measured over every style at three seeds, jazz and classical are **0.104**
   * apart on a fingerprint of duration classes, interval classes, density and
   * turn rate, where the average of all 171 genre pairs is 0.382. Both run
   * eighth-note lines over functional harmony at similar spans, so the separation
   * has to come from the tables, and it is the archetypes that carry it: against
   * classical's `arch-hook` 5 / `long-note` 3 / `riff-response` 0.8, this genre
   * tops out on `descending-sequence` and `wide-interval`, holds `long-note` at
   * its derived floor for the busy styles, and triples `riff-response`. The
   * subsets differ in kind rather than in shape — classical's no-fourth entry is
   * about what a natural horn can place in the *key*, this one is about the
   * eleventh of whatever chord is sounding.
   *
   * The op table does less of that work than it looks: `displace: 1.5` with
   * `diminish: 1.4` is hiphop's exact pair and `displace: 1.5` with
   * `ornament: 0.35` is house's. Only `ornament` separates jazz from classical,
   * and it separates hard, because classical declares none and keeps a derived
   * 0.76–1.72.
   *
   *  - **`ornament` to about a third.** The operator splits a held note into a
   *    *diatonic* neighbour, and this genre has already written down that it does
   *    not want one: `solo.vocabulary.ornament` is 0, "not an oversight — a
   *    crushed grace before the beat is a dance-band gesture and belongs to the
   *    genre that owns it." Jazz decoration is the chromatic approach, and the
   *    operator algebra moves through the scale by construction, so it cannot
   *    express one at all. Derivation reads `melody.ornament` and gets this
   *    backwards — eight of ten styles at or above 1, `bebop` highest of all at
   *    1.6. Only the appetite moves; `Voice.ornament` stays each style's own, so
   *    an ornament that is drawn is still the size that style asked for.
   *  - **`diminish` up.** Every style here derives it *below* 1, 0.58 to 0.95,
   *    and `opsFor`'s own note says that is how the engine ended up with no fast
   *    passages anywhere. `doubleTime` is 0.22 in the vocabulary above and
   *    `fusion` calls itself "the one style here whose melodies are genuinely
   *    faster than its beat". Double-time goes from about two draws in five of a
   *    development to about half.
   *  - **`displace` up**, on `offbeatAccent: 0.9` — "Nothing else in this
   *    generator accents off the beat" — and on `comping.anticipate: 0.3`, the
   *    chord arriving ahead of the barline. Displacing a figure two sixteenths
   *    under `swing: 0.33` is it landing on the swung and.
   *  - **`reharmonise` doubled**, and it moves nothing today. `Op.reharmonise`
   *    sets `Motif.resnap` (`motif.ts:854`), and `resnap` is declared at
   *    `types.ts:103` and read by no consumer in the tree, so this weight is a
   *    claim held against the day the skeleton reads it rather than a change to
   *    the notes. It is the claim this file exists to make — the header is one
   *    sentence about it, and `bII7` standing in for `V7` and the trio's harmony
   *    walking down in major thirds are both the same figure over changes it was
   *    not written for — and derivation cannot reach the op at all, so 1 in its
   *    single `close` slot was nobody's decision.
   *
   * `sequence` and `transpose` are left alone deliberately. Derivation reads
   * `melody.sequence`, which these styles already write from 0.25 on bebop to
   * 0.45 on blues and fusion, and a genre value would flatten a distinction the
   * tables are making correctly.
   */
  voice: {
    archetypes: [
      ['descending-sequence', 3],
      ['wide-interval', 3],
      ['arch-hook', 2.5],
      ['riff-response', 2.5],
      ['chant', 0.4],
    ],
    subsets: [
      [[0, 1, 2, 4, 5, 6], 3],       // the chord's 1 3 5 7 with its 9 and 13, and no 11
      [[0, 1, 2, 3, 4, 5, 6], 3],    // the whole chord-scale — a bop line runs it
      [[0, 2, 3, 4, 6], 1],          // 1 3 4 5 7 — the minor pentatonic over a min7 vamp
    ],
    ops: { reharmonise: 2, displace: 1.5, diminish: 1.4, ornament: 0.35 },
  },

  /**
   * Chord-scale mapping. Each chord quality gets the scale that jazz practice
   * associates with it, rooted on the *chord*, not the key.
   */
  scaleForChord: (tonic, mode, chord) => {
    const root = chord.root;
    switch (chord.quality) {
      case 'maj7': case 'maj9': case 'maj6': case 'maj':
        return makeScale(root, 'major');
      case 'min7': case 'min9': case 'min11': case 'min6': case 'min':
        return makeScale(root, 'dorian');
      case 'dom7': case 'dom9': case 'dom13':
        return makeScale(root, 'mixolydian');
      case 'halfdim7':
        return makeScale(root, 'locrian');
      case 'dim7': case 'dim':
        return makeScale(root, 'diminished');
      case 'minmaj7':
        return makeScale(root, 'melodicMinor');
      // Suspended, with or without the seventh: mixolydian, which contains the
      // fourth the chord is built on and the third it is avoiding.
      case 'sus4': case 'sus2': case 'dom7sus4':
        return makeScale(root, 'mixolydian');
      default:
        // Altered dominants take the altered scale, which is melodic minor a
        // semitone above the chord root — the standard shortcut for it.
        if (isAlteredDominant(chord.quality)) return makeScale(pc(root + 1), 'melodicMinor');
        return makeScale(tonic, mode === 'minor' ? 'minor' : 'major');
    }
  },
  /**
   * A jazz drummer does not play a tom roll into the head. The fill is the
   * cymbal, a couple of kicks under it, and a snare on the way in.
   */
  fills: [
    ['cymbal', 6], ['snare-roll', 3], ['lead-in', 3], ['drop', 2], ['snare-toms', 1],
  ],

  /** The cellar, the dark suits and the club card. See `staging.ts`. */
  staging: STAGING,
};
