/**
 * Era profiles — four orchestras, two hundred years apart at the ends.
 *
 * The era decides the production, and in this genre "production" means
 * *instrumentation*, which is a stronger claim than it is anywhere else here.
 * Iskelmä's two eras are the same band with a drum machine bought in between;
 * ambient's three are three generations of studio equipment. These four are four
 * different rooms full of different objects. A 1720 ensemble has no clarinet, no
 * piano and no conductor; an 1870 one has ninety players, a tuba and a cor
 * anglais. The same minuet scored for either is not the same minuet.
 *
 * ## The percussion, which is the field this genre had to work around
 *
 * `drumSources` is a choice between a kit, a preset box, a programmed machine
 * and a set of electronic pads. The last three are gated by year and are
 * therefore unreachable before 1964, which is convenient and not the point; the
 * point is that the first one is a **trap kit**, an object invented around 1918
 * so that one person could play a bass drum, a snare and a cymbal at once in a
 * theatre pit. No era below has one, because none of these orchestras had one.
 *
 * So every style in `styles.ts` carries `excludeLayers: ['drums']` and the
 * percussion of this genre lives where it belongs: **`timpani` is in the `brass`
 * palette**, because it is a pitched instrument that plays the tonic and the
 * dominant underneath a tutti, which is exactly what the `brass` layer does with
 * stabs and swells. Two pedal drums tuned a fourth apart and struck on the
 * strong beats of a cadence is a real orchestral part, and it is reachable with
 * the fields that exist. A hi-hat on every eighth of a sarabande is not, and it
 * is the single most out-of-place sound this generator can make.
 *
 * The consequence is that `drumBanks` below is a required field naming a machine
 * that is never switched on. It is the same value in all four eras, and the
 * choice is the least meaningless one available: a sampler is the one entry in
 * the table that is not a *sound* — it plays whatever was loaded into it, and
 * here nothing was.
 *
 * ## Reading a palette
 *
 * Every entry has been checked against `centre`, `lead`, `agility` and `idiom`
 * in `style/instruments.ts` rather than picked by name, and three of those did
 * real work:
 *
 *  - **`agility`** keeps the tune off instruments that cannot take it. The
 *    french horn is 0.45 and the tuba is 0.35 — the two lowest in the catalogue —
 *    so neither appears on `melody` anywhere, which is why a horn solo in these
 *    eras is a counter-line rather than the tune.
 *  - **`lead` versus `centre`** is why the bassoon is on `counter` and `bass` and
 *    never on `melody`: its section job is at 50 and its solo register is at 66,
 *    and a bassoon written at its section centre with the tune on it disappears
 *    under the cellos it is doubling.
 *  - **`idiom`** is why the harp and the celesta are on `comp` and `counter`
 *    rather than on `pad`. Both are `mallet`, which arpeggiates and does not
 *    sustain, and a pad is by definition a thing that sustains.
 */

import type { EraProfile } from '../../style/types.js';

/**
 * The bank nothing plays.
 *
 * Shared by all four eras. `npm run genres` asserts that every bank an era names
 * has been measured, so it has to be a real entry in `BANK_VOICES`; it does not
 * have to be one anybody hears, and this one is not, because no style in this
 * genre lets the drum layer exist. Declared once rather than four times so that
 * the joke is only made once.
 */
const SILENT_BANK: (readonly [string, number])[] = [['AkaiMPC60', 1]];

/**
 * BAROQUE — a small band round a keyboard, about 1720.
 *
 * Eight to twenty players and a continuo group at the centre of them: a
 * harpsichord or an organ realising figures over a cello and a violone, with
 * strings above and a pair of oboes doubling them. That texture is the era, and
 * it is why the `comp` palette here is the narrowest of the four — there is
 * exactly one job (realise the figured bass) and three instruments that do it.
 *
 * The natural trumpet and the natural horn are in the brass palette and both are
 * period-correct, with the caveat that neither could play a chromatic note; that
 * is not expressible here, and it costs almost nothing because the brass layer
 * plays chord tones. The timpani sit under the trumpets, tuned to the tonic and
 * the dominant, and were very nearly never written without them.
 *
 * `density` is the lowest of the four at 0.55. A trio sonata is three players
 * and a keyboard, and an era that filled every bar with six layers would be
 * writing 1890 with 1720's instruments.
 */
const baroque: EraProfile = {
  id: 'baroque',
  year: 1720,
  label: 'Baroque, c. 1720',
  description:
    'A small band round a continuo keyboard. Harpsichord and chamber organ, strings, oboes and bassoon, natural trumpets and timpani.',
  drumBanks: SILENT_BANK,
  palette: {
    melody: [
      ['violin', 5], ['oboe', 4], ['recorder', 3], ['flute', 3],
      ['harpsichord', 3], ['trumpet', 2], ['strings1', 2], ['cello', 1],
    ],
    counter: [
      ['violin', 4], ['viola', 3], ['oboe', 3], ['recorder', 3],
      ['cello', 2], ['bassoon', 2], ['flute', 2], ['harpsichord', 1],
    ],
    /**
     * The continuo, and the whole reason `HANDS.harpsichord` voices `tertian`
     * with a bass side where every other keyboard here voices a rootless shell.
     * A figured bass is an instruction for realising a chord *above a root the
     * same player is already playing*, so a guide voicing would produce the one
     * thing continuo cannot be.
     *
     * The nylon guitar is standing in for the theorbo, which General MIDI does
     * not have and which was the second continuo instrument of the period —
     * a long-necked plucked bass that doubled the line and filled the chords.
     * A classical guitar is the nearest object in the catalogue and it is close
     * enough on idiom, register and decay to be worth one weight in five.
     */
    comp: [
      ['harpsichord', 6], ['pipeOrganQuiet', 3], ['churchOrgan', 2], ['nylonGuitar', 1],
    ],
    pad: [
      ['strings1', 5], ['strings2', 3], ['pipeOrganQuiet', 2], ['churchOrgan', 2],
    ],
    // The basso continuo: a cello and a violone on the line, a bassoon
    // reinforcing it. No plucked bass of any kind — a pizzicato bass is a
    // nineteenth-century effect and an electric one is a hundred years further on.
    bass: [['contrabass', 5], ['cello', 4], ['bassoon', 3]],
    brass: [['trumpet', 4], ['timpani', 3], ['frenchHorn', 2], ['trombone', 1]],
  },
  styleWeights: {
    minuet: 5, gavotte: 5, sarabande: 6, gigue: 6, passacaglia: 5, chaconne: 4,
    fugue: 6, chorale: 5, toccata: 5, overture: 5, aria: 5, pavane: 3,
    sonata: 0, rondo: 1, adagio: 2, scherzo: 0, march: 1,
    nocturne: 0, waltz: 0, mazurka: 0, polonaise: 1, barcarolle: 0, berceuse: 0,
    etude: 0, lacrimosa: 1, prelude: 0,
  },
  tempoScale: 1,
  /**
   * Low, and the whole genre's is low for a reason set out in `index.ts`: the
   * key plan's vocabulary is "the last chorus, a notch brighter", which is a
   * twentieth-century pop device. What this era wants from the field is the
   * *other* draw it makes — a middle section in the dominant with an applied
   * dominant in front of it — and that fires at half this number.
   */
  keyChangeChance: 0.2,
  density: 0.55,
};

/**
 * CLASSICAL — the orchestra becomes standard, about 1785.
 *
 * The continuo has gone and taken the harpsichord with it, which is the single
 * largest change in the file: the `comp` palette is now a fortepiano and the
 * strings themselves, because the chords are written into the parts rather than
 * improvised over a figured line. The harpsichord keeps a small weight because
 * the change took thirty years and this era stands in the middle of it.
 *
 * The clarinet arrives, which is the other one. Mozart wrote for it from 1778
 * and it changed what a wind section sounds like more than any other single
 * addition; it is weighted highest of the winds on `melody` for that reason.
 *
 * `density` at 0.62 and `tempoScale` at 1.02: this is the crispest of the four
 * eras, and a classical allegro really is played a shade faster than the same
 * marking would have meant sixty years earlier.
 */
const classical: EraProfile = {
  id: 'classical',
  year: 1785,
  label: 'Classical, c. 1785',
  description:
    'The standard orchestra. Fortepiano, strings in four parts, pairs of flutes, oboes, clarinets, bassoons and horns, trumpets and timpani.',
  drumBanks: SILENT_BANK,
  palette: {
    melody: [
      ['violin', 5], ['clarinet', 4], ['flute', 3], ['oboe', 3],
      ['piano', 3], ['strings1', 3], ['cello', 2], ['trumpet', 1],
    ],
    counter: [
      ['viola', 4], ['clarinet', 3], ['oboe', 3], ['cello', 3],
      ['bassoon', 3], ['frenchHorn', 2], ['flute', 2], ['violin', 2],
    ],
    comp: [
      ['piano', 5], ['strings2', 3], ['pizzStrings', 2], ['harpsichord', 2],
    ],
    pad: [
      ['strings1', 5], ['strings2', 4], ['tremoloStrings', 2],
    ],
    bass: [['contrabass', 5], ['cello', 4], ['bassoon', 2]],
    brass: [['frenchHorn', 4], ['timpani', 3], ['trumpet', 3], ['trombone', 1]],
  },
  styleWeights: {
    minuet: 6, gavotte: 3, sarabande: 1, gigue: 2, passacaglia: 1, chaconne: 1,
    fugue: 2, chorale: 2, toccata: 2, overture: 3, aria: 4, pavane: 1,
    sonata: 6, rondo: 6, adagio: 5, scherzo: 3, march: 4,
    nocturne: 1, waltz: 1, mazurka: 0, polonaise: 2, barcarolle: 0, berceuse: 1,
    etude: 1, lacrimosa: 2, prelude: 0,
  },
  tempoScale: 1.02,
  keyChangeChance: 0.25,
  density: 0.62,
};

/**
 * ROMANTIC — ninety players and a piano that can fill a hall, about 1870.
 *
 * The era where the orchestra stops being a band and becomes an institution.
 * Three additions do most of the work here and each is a real object rather than
 * a shade: the **cor anglais**, which is an oboe a fifth lower and is the
 * instrument a slow movement's long solo is written for; the **tuba**, which
 * gives the brass a floor it did not previously have; and the **concert grand**,
 * which is `steinway` rather than `piano` and is a sampled instrument in a hall
 * rather than a General MIDI programme.
 *
 * The harp arrives on `comp` and `counter` and is the era's one genuinely new
 * *texture* — a chord that is spread rather than struck. It is `mallet` idiom, so
 * it arpeggiates by default, which is what a harp does.
 *
 * `density` 0.8, the highest of the four, and `tempoScale` 0.96 — this music is
 * both fuller and slower than the classical era's, and both numbers are the same
 * fact about a hall that got bigger.
 */
const romantic: EraProfile = {
  id: 'romantic',
  year: 1870,
  label: 'Romantic, c. 1870',
  description:
    'The full nineteenth-century orchestra and the concert grand. Cor anglais, tuba, harp, divided strings and a brass section with a floor.',
  drumBanks: SILENT_BANK,
  palette: {
    melody: [
      ['violin', 5], ['steinway', 4], ['cello', 4], ['englishHorn', 3],
      ['clarinet', 3], ['oboe', 3], ['flute', 3], ['strings1', 3], ['frenchHorn', 1],
    ],
    counter: [
      ['viola', 4], ['cello', 4], ['englishHorn', 3], ['frenchHorn', 3],
      ['clarinet', 3], ['harp', 2], ['bassoon', 2], ['flute', 2],
    ],
    comp: [
      ['steinway', 5], ['harp', 4], ['pizzStrings', 3], ['strings2', 2], ['churchOrgan', 1],
    ],
    pad: [
      ['strings1', 5], ['strings2', 4], ['tremoloStrings', 3], ['churchOrgan', 2],
    ],
    bass: [['contrabass', 5], ['cello', 4], ['tuba', 2], ['bassoon', 2]],
    brass: [
      ['frenchHorn', 5], ['trombone', 3], ['trumpet', 3], ['timpani', 3],
      ['brassSection', 2], ['tuba', 2],
    ],
  },
  styleWeights: {
    minuet: 1, gavotte: 1, sarabande: 1, gigue: 1, passacaglia: 2, chaconne: 2,
    fugue: 1, chorale: 2, toccata: 2, overture: 2, aria: 2, pavane: 2,
    sonata: 4, rondo: 2, adagio: 4, scherzo: 6, march: 4,
    nocturne: 6, waltz: 6, mazurka: 5, polonaise: 5, barcarolle: 5, berceuse: 4,
    etude: 5, lacrimosa: 4, prelude: 2,
  },
  tempoScale: 0.96,
  /**
   * The highest of the four, and still modest. This is the era where a modulation
   * to the flat submediant for the last statement of the tune is a real gesture
   * rather than a gear change, so the field earns more than it does in 1720 —
   * but the mechanism it drives only offers a semitone or a tone, and a tone up
   * for the final chorus is still a pop record's move whatever era asks for it.
   */
  keyChangeChance: 0.3,
  density: 0.8,
};

/**
 * IMPRESSIONIST — the orchestra used as a box of colours, about 1910.
 *
 * The same players as 1870 and an entirely different set of priorities. What
 * changes is which instruments get the *tune*: the flute and the cor anglais
 * move to the front, the violins move back, and the harp and celesta stop being
 * decoration and become structural. That is not a mixing preference, it is what
 * the scores do — the opening of *Prélude à l'après-midi d'un faune* is a solo
 * flute in its lowest octave, which is the register everybody before 1890 avoided
 * because it does not project.
 *
 * The pad palette drops the church organ and keeps the tremolo strings, and the
 * comp palette leads with the concert grand and the harp. `piccolo`,
 * `glockenspiel` and `tubularBells` appear on `counter` and nowhere else: they
 * are points of light over a texture rather than lines, and `counterSpacing`
 * would be the field to slow them down if this genre ever needs it.
 *
 * `tempoScale` 0.9 — the lowest — and `density` 0.7. Fewer things at once than
 * 1870 and all of them further apart, which is the sound.
 */
const impressionist: EraProfile = {
  id: 'impressionist',
  year: 1910,
  label: 'Impressionist, c. 1910',
  description:
    'The orchestra as a box of colours. Flute and cor anglais in front, harp and celesta structural, muted strings and no weight on the bar.',
  drumBanks: SILENT_BANK,
  palette: {
    melody: [
      ['flute', 5], ['steinway', 4], ['oboe', 3], ['englishHorn', 3],
      ['clarinet', 3], ['violin', 3], ['celesta', 2], ['cello', 2], ['viola', 1],
    ],
    counter: [
      ['harp', 4], ['celesta', 3], ['clarinet', 3], ['viola', 3],
      ['flute', 2], ['glockenspiel', 2], ['englishHorn', 2], ['piccolo', 1],
      ['tubularBells', 1],
    ],
    comp: [
      ['steinway', 5], ['harp', 5], ['celesta', 3], ['pizzStrings', 2], ['strings2', 2],
    ],
    pad: [
      ['strings1', 5], ['tremoloStrings', 4], ['strings2', 3],
    ],
    bass: [['contrabass', 5], ['cello', 3], ['bassoon', 2], ['tuba', 1]],
    brass: [
      ['frenchHorn', 5], ['trumpet', 3], ['timpani', 3], ['trombone', 2], ['tuba', 1],
    ],
  },
  styleWeights: {
    minuet: 1, gavotte: 1, sarabande: 1, gigue: 0, passacaglia: 1, chaconne: 1,
    fugue: 1, chorale: 1, toccata: 1, overture: 0, aria: 1, pavane: 4,
    sonata: 1, rondo: 1, adagio: 2, scherzo: 1, march: 1,
    nocturne: 2, waltz: 2, mazurka: 1, polonaise: 0, barcarolle: 4, berceuse: 3,
    etude: 2, lacrimosa: 1, prelude: 7,
  },
  tempoScale: 0.9,
  /**
   * The lowest, and it is a statement about the music rather than a taste. This
   * is the corner of the repertoire that has stopped modulating altogether:
   * chords are chosen for colour, planed in parallel, and there is frequently no
   * key to change *from*. A prepared key change here would be the one gesture
   * the whole aesthetic is defined against.
   */
  keyChangeChance: 0.12,
  density: 0.7,
};

export const ERAS: Record<string, EraProfile> = {
  baroque, classical, romantic, impressionist,
};
