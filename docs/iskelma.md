# Iskelmä — the ruleset

*Reference, written 2026-07-25 and lightly revised 2026-08-03 — one of the two oldest pages here, from when the project had two genres. Its seven styles, two eras and nine moods were re-checked against `src/genre/iskelma/` on 2026-08-09 and match exactly. Trustworthy, and worth reading even for another genre: iskelmä is the genre the shared rule table was calibrated against, and it is still the only one of the nineteen that declares no `ruleOverrides` at all.*

Finnish dance-pavilion pop. What follows is what the generator actually encodes, and why.

Iskelmä is unusually *codifiable*. It is not one groove — it is the repertoire of the Finnish dance pavilion, organised by **dance**. A band rotates tango, humppa, valssi, jenkka, foksi and a latin number, each with its own tempo band, comping figure and harmonic habits. Modelling those as separate styles is what makes the output recognisable rather than generically "sad European pop".

## Dances (`src/genre/iskelma/styles.ts`)

| Style | Meter | BPM | Mode | Defining traits |
|---|---|---|---|---|
| **Tango** | 4/4 | 96–126 | 94% minor | Descending `i–VII–VI–V`, harmonic-minor dominants, long held phrase endings |
| **Humppa** | 4/4 | 132–164 | 88% major | Oom-pah on the quarter, circle-of-fifths turnaround `I–VI7–II7–V7` |
| **Valssi** | 3/4 | 150–190 | 58% minor | Bass on 1, chords on 2 and 3 |
| **Jenkka** | 4/4 | 140–170 | 86% major | Dotted-eighth/sixteenth schottische snap |
| **Foksi** | 4/4 | 100–128 | 70% major | Light swing, `ii7–V7`, secondary dominants, sixth chords |
| **Beguine** | 4/4 | 108–132 | 55% minor | 3–3–2 dotted bass, offbeat comping |
| **Iskelmäpop** | 4/4 | 100–126 | 68% minor | Aeolian loop `i–VII–VI–VII`, chorus `VI–III–VII–i` |

**Finnish tango is not Argentine tango**, and the generator enforces the differences: it is near-obligatorily minor (Argentine moves freely between major and minor), slower, and squarer — a marching bass rather than a syncopated one.

## Harmony

- Roman numerals are read **relative to the mode**, the way a dance-band arranger reads them. In A minor, `VII` is G major. No flats needed.
- **Harmonic minor at cadences.** Melody sits in natural minor, but the moment a dominant-function chord arrives the 7th is raised so the leading tone actually leads. This one rule does more for authenticity than anything else.
- **The relative-major lift.** A melancholy verse in `i` opening its chorus on `III` or `VI` is the genre's core emotional device; chorus progressions that do this are weighted up.
- Neapolitan `bII`, borrowed `iv` in major, and circle-of-fifths bridges are all in the tables as colour.

## Melody

Built from **motifs and their transformations**, not note-by-note random walks. A phrase states a two-bar idea, restates it as a diatonic sequence a step or third lower, and answers it with a cadence. A random walk that merely obeys the harmony sounds like an exercise; reusing a shape sounds like a song.

Also enforced: chord tones on strong beats; stepwise motion dominant; a leap answered by a step the other way; a phrase arc peaking around two-thirds through; antecedents ending open on 5̂ or 2̂, consequents closing on 1̂, usually held long — the *kaipuu* note.

## Form

`intro → verse → chorus → … → solo → chorus → chorus(+1 or +2) → outro`

Two structural clichés are deliberate:
- **The solo chorus** — the "voice" rests and the accordion or sax takes the tune (implemented by moving the lead to the counter instrument).
- **The final-chorus key change** up a semitone or tone. 45% likely in the 60s–70s profile, 70% in the 80s.

## Eras (`src/genre/iskelma/eras.ts`)

The era decides *production*, not notes. The same tango sounds like 1968 or 1985 almost entirely through these choices.

- **1960s–70s tanssilava** — Korg Minipops, Rhythm Ace, Roland CR-78 rhythm boxes; accordion, bandoneon (GM 24 "Tango Accordion"), tremolo guitar, string ensemble, muted brass.
- **1980s iskelmäpop** — LinnDrum, Oberheim DMX, TR-707; synth strings, electric piano, electric bass, synth brass.

## Moods (`src/genre/iskelma/moods.ts`)

A mood does not pick notes; it biases choices the generator was making anyway. Measured over 200 songs each (`npm run moods`):

```
kaihoisa      minor  98%  avg 114 BPM  | tango 56%, valssi 25%, iskelmapop 7%
dramaattinen  minor  90%  avg 125 BPM  | tango 40%, iskelmapop 22%, valssi 16%
haikea        minor  87%  avg 122 BPM  | tango 36%, valssi 28%, beguine 16%
nostalginen   minor  62%  avg 127 BPM  | tango 27%, beguine 19%, valssi 16%
neutraali     minor  54%  avg 130 BPM  | tango 25%, beguine 16%, valssi 14%
romanttinen   minor  52%  avg 127 BPM  | valssi 25%, tango 23%, foksi 18%
rento         minor  50%  avg 120 BPM  | beguine 22%, tango 21%, foksi 19%
tanssittava   minor  41%  avg 141 BPM  | humppa 23%, tango 14%, iskelmapop 14%
iloinen       minor   9%  avg 150 BPM  | humppa 30%, jenkka 17%, valssi 14%
```

`neutraali` is the fallback every song with no mood specified draws, so it is close to the genre's own centre of gravity by construction — and it has to be the *last* entry in the table, which `npm run genres` asserts of every genre. A genre that ships without one makes whichever mood happens to sit last into the default, and every symptom of that points at the style weights instead.
