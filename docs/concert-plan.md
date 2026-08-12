# The Concert — plan

*Plan, written 2026-07-27 and last annotated 2026-08-03. It describes what was **intended**, not what is. **Built** — the result is described by [concert.md](concert.md), which is the page to trust. This plan predates the two largest changes to the renderer since: the staging tables moved out of `concert/` into each genre's own `staging.ts`, and rooms became one `RoomBuilder` per architecture rather than one parameterised box. Read it for the reasoning and the contracts, not as a reference.*

A third page. The generator writes a set of numbers, a band walks out on a 3D stage,
and plays them — visibly. Hands hit the drums the drums are actually being hit on.
Then you throw tomatoes at them.

This document is the build plan. It settles the contracts first so that the systems
underneath can be built independently and in parallel, and it says what each of them
owns.

**It is built.** [`concert.md`](concert.md) describes what exists; this file is kept for
the reasoning behind it — the alternatives that were rejected, and why each contract is
shaped the way it is. Where the two disagree, `concert.md` is the one that was checked
against the code.

---

## 1. The one architectural claim

**The visuals are a second renderer of the Song IR, not a feature of the audio player.**

The project already has two renderers — `render/midi.ts` ships, `render/strudel.ts`
auditions — sitting behind a neutral IR that knows nothing about either. The concert
is the third: `render/` gains a sibling that turns a `Song` into a **Performance IR**,
and a three.js runtime that plays *that*.

This is not architectural neatness for its own sake. Three consequences follow, and
all three are the point:

- **It is the honest version of "generated from the MIDI, not the other way around".**
  If the choreographer can only see `NoteEvent[]`, it cannot cheat. There is no path
  by which a nice-looking animation quietly changes what is played.
- **It ports.** A native game engine consuming the Song IR gets the staging for free —
  the same JSON, a different renderer. That is the stated long-term goal of this
  project, and a concert is the most demanding possible test of whether the IR
  actually carries enough information to drive something other than audio. If a
  drummer's left hand cannot be placed from the IR, the IR is missing something and
  we want to find that out here.
- **It is testable without eyes.** A Performance IR is data, so `npm run concert` can
  assert that no hand teleports, that every note has a gesture, and that no two
  players are standing in the same place. See §11.

The licence boundary follows the same line as everywhere else in this repo:

```
src/concert/     Song -> Performance IR.       MIT. No three.js, no Strudel, no DOM.
src/web/concert/ Performance IR -> pixels.     App side. three.js + the Strudel clock.
```

`src/concert/` must remain importable from Node with no browser present. That is what
`npm run concert` depends on, and it is what a native port would lift.

---

## 2. Decisions settled

| Question | Decision |
|---|---|
| Where does it live? | A third page, `concert.html`, alongside `index.html` and `voice.html`. Registered in `vite.config.ts` (which exists precisely because `vite build` only sees `index.html` otherwise). Cross-linked from both existing pages. |
| Showbill contents | **A setlist.** A concert is 3–5 generated numbers; the bill lists each one's title and duration, plus a hint at style and era. Implies applause between numbers, a bow at the end, and re-staging when the instrumentation changes. |
| Showbill mid-show | **Always reachable.** A programme button, the `P` key, or clicking the bill hanging in the wings. The music does not stop; the bill overlays, marks the number playing, and is where the show's options and share link live (§7.3). |
| Tomato hit | **Just that player** — they drop out for a couple of bars and come back with a freshly generated part. Until the band runs out of patience: enough hits in one number and the whole band walks it off and moves to the next piece (§8.9). |
| Vocals | **Mixed by default, with an instrumental-only switch.** Some numbers are sung, some are not, and the singer leaves the stage for the instrumentals. See §5. |
| Smoothness | **The top half of the scale, never the bottom.** A concert is a performance, not an experiment. See §6. |
| 3D library | **three.js** (MIT). Hand-rolled WebGL is a month of work to reach parity on shadows, and the dependency sits on the app side of the licence line where Strudel already is. Pinned, imported as ES modules, no CDN — the soundfont CDN is already one runtime dependency too many. |
| Art style | **Rayman hands.** Hands and feet are *placed*, never solved for; the arms and legs between them are fitted to wherever the placement left them. See §8.4 — this is a technical decision disguised as an aesthetic one. |
| Determinism | The concert seed derives every random choice: which players, their faces, their clothes, where they stand, what the lights do. Same seed → same band, exactly. Non-negotiable; it is the property the whole repo is built on. |

### Assumption worth flagging

A concert of 3–5 numbers at 2–4 minutes each is a 10-minute experience, and the
generator produces songs one at a time with no notion of a set. The setlist gets its
own small system (§8.6) that picks numbers with *contrast* — not five foxtrots in a
row — by drawing the evening's styles without replacement, and then shuffles them.
That is programming, not generation, and it is cheap.

It used to order them the way a band would — strong opener, ballad third, biggest
number last — and that was measurably a mistake. Each position had a target speed,
each genre has exactly one style at each end of its speed range, so the target named
the style instead of choosing it: over 250 concerts the iskelmä closer was a valssi
93% of the time. A programmed arc and a varied catalogue turn out to be the same
knob, and the catalogue is the one worth having.

---

## 3. Where the existing engine has to move

Most of this is additive. Four things touch shared code and therefore land before the
parallel work starts. The solo is large enough to get its own section (§4).

### 3.1 A regeneration seam for the tomato hit

A hit player has to come back with a *different part in the same song*. The generator
already makes this nearly free: RNG streams are namespaced per concern and per section
(`${seed}:melody:${s}`, `${seed}:counter:${s}`, `${seed}:band:${s}` — `song.ts:241`,
`339`, `370`). Adding an optional salt to `GenerateOptions`:

```ts
/** Per-layer variation. Perturbs only that layer's RNG streams. */
variation?: Partial<Record<LayerId, number>>;
```

…means `generateSong({ ...opts, seed, variation: { melody: 1 } })` returns a song
identical in form, key, tempo, instrumentation and every other part, with a different
melody. Splice that layer's notes into the playing song, re-render, re-evaluate. Strudel
swaps patterns at the cycle boundary — which is one bar (§7) — so the change lands
musically instead of cutting.

The radio page's layer chips already prove this mechanism works live.

### 3.2 The 16th-note grid

Swing is baked into `NoteEvent.beat` before rendering (`song.ts:468`), so visuals taken
from the IR are automatically swung — good, and one entire class of sync bug avoided.

But `render/strudel.ts` quantises to a 16th grid on the way out
(`Math.round(n.beat * 4)`). At `swing: 0.15` an offbeat eighth moves 0.075 beats — a
third of a slot — and rounds *back to where it started*. The audio is on the grid; the
IR is not. A drummer animated from raw IR beats would be up to a 32nd early or late on
exactly the notes the ear is most sensitive to.

**The choreographer must quantise through the same function the Strudel renderer uses.**
That function gets extracted from `render/strudel.ts` into somewhere both can import,
and the audition grid becomes a documented property of the renderer rather than an
implementation detail. `npm run concert` asserts every gesture lands on a slot boundary.

### 3.3 `Section` gains a named soloist

`Section.solo?: { layer: LayerId; instrument: string; backing: BackingPolicy }`. Every
consumer that currently infers "solo means counter" reads this instead
(`hook-report.ts:145`, `genre-check.ts:285`, `genre-check.ts:490`). See §4.

### 3.4 Nothing needed for vocals

`GenerateOptions.vocals` already exists and already draws from its own RNG stream, so
the same seed yields the identical arrangement sung or not. The concert only has to
decide *when* to set it (§5). This is the cheapest of the seven additions and it is
cheap because the vocal layer was built correctly the first time.

---

## 4. The solo engine

The largest piece of musical work in this plan, and the one to start first. It is worth
doing on its own merits — the radio station gets better solos too — and the concert is
what makes it unavoidable: **a spotlight on a player who is not doing anything
interesting is worse than no spotlight.**

### 4.1 What is wrong now

`SectionKind` already has `'solo'`, and jazz forms already spend four choruses in it.
What happens musically is thin: the lead rests and the counter instrument plays the
same kind of line the melody would have played (`generate/song.ts:280`). Nobody is
soloing, nothing is developed, and there is no drum solo anywhere in the codebase.

### 4.2 What a solo actually is

Five properties, none of which the melody engine has, and all of which are testable:

1. **It is played *over* the form, not *as* the form.** The changes keep coming; the
   soloist plays across the barline and across the section join. The melody engine
   writes phrases that fit into bars, which is correct for a tune and wrong for a solo.
2. **Motivic development.** State an idea; repeat it displaced by a beat; sequence it up
   a step; fragment it; expand it. This is the difference between a solo and a scale
   exercise, and it is mechanical enough to generate — `generate/motto.ts` already has
   the notion of a short recurring cell, and the solo engine is that idea applied
   *within* a section instead of across the song.
3. **Target notes on the changes.** A line that lands on the third or seventh of the new
   chord on its downbeat sounds like it knows where it is. One that lands on the root
   sounds like an exercise; one that lands anywhere sounds like an accident. Guide-tone
   targeting is the single highest-value rule here.
4. **An arc.** Solos build. Density, register and velocity rise across the chorus and
   peak near the end — and then the last two bars get out of the way for the head. This
   is the same shape `generate/dynamics.ts` already applies between sections, applied
   within one.
5. **Space.** A solo with no rests in it is not exciting, it is exhausting. Rest
   placement is a first-class decision, not what is left over.

### 4.3 Genre profiles

Genre owns who solos, over what, and in what language. A `SoloProfile` per genre,
alongside the tables that already exist:

**Jazz — improvisation.** The real thing, and the reason this system is worth building.

- *Language*: swung eighth-note lines with the accent on the offbeat; chromatic
  enclosures approaching a target from above and below; occasional double-time bursts;
  a quote of the head's motto at the top of a chorus so the solo is heard as belonging
  to *this* tune.
- *Soloists rotate across choruses*: the front-line horn, then the comp instrument
  (piano or guitar), then — where the style supports it — the bass, then the drums.
  Rotation is deterministic from the seed and never gives the same player two
  consecutive choruses.
- *Trading fours* on the last solo chorus: four bars soloist, four bars drums, twice.
  This is the most recognisable jazz gesture there is and it costs one loop.
- *Bass solos* thin the backing to almost nothing — comp drops out, drums move to
  brushes or hats. That contrast is the whole point of a bass solo and it staged badly
  is worse than not having one.

**Iskelmä — the instrumental break.** Not improvisation, and pretending otherwise
would be wrong about the genre.

- The accordion, fiddle or saxophone takes the tune and *ornaments* it: grace notes,
  mordents, a run into the phrase, thirds above the melody, a rising final phrase into
  the last chorus.
- The band does not change. This is dance music and the floor is full; a rhythm section
  that gets clever behind the break is a rhythm section that has forgotten its job.
- **Never the drums.** A drum solo at a tanssilava clears the floor.

**Ambient — no solos, and it stays that way.** `genre/ambient/index.ts:55` says so
explicitly and it is correct. The concert honours it by lighting ambient differently:
no follow spot, no soloist, just a fixture warming on whichever player's gear is
currently moving (§8.8). A genre that refuses to have a foreground is a genre whose
staging has to mean something else.

### 4.4 Backing — what the band does behind a solo

The rhythm section keeps playing behind a solo. That is normal and in most of this
repertoire it is mandatory; a band that drops out under every solo sounds like a demo.
So backing is an explicit policy on `Section.solo` rather than an accident of which
layers happened to be active:

| Policy | Layers | Behaviour |
|---|---|---|
| `full` | unchanged | Iskelmä. The pattern continues exactly as written. |
| `comping` | comp thins, drums move to ride, bass keeps walking | Jazz. The comp gets sparser and more syncopated — it answers the soloist rather than running its pattern. |
| `sparse` | comp out, drums to brushes | Behind a bass solo. |
| `trade` | full, alternating four-bar blocks | Trading fours: the band stops dead for the drummer's four and comes back in on the downbeat. |

The comp thinning under `comping` is a small change to how a comp pattern is realised
(drop hits, displace others) and it is the one that most makes a solo sound like a solo
rather than like a different melody over the same accompaniment.

### 4.5 Drum solos

Their own generator, sharing vocabulary with `generate/fills.ts` but not its scale.

- Phrases in two- and four-bar units, because the form is still running underneath even
  when nothing is stating it.
- Orchestration around the kit: an idea stated on the snare, answered on the toms,
  punctuated on the crash. A drum solo that stays on one drum is a drum roll.
- A build: density and velocity rise across the section.
- An ending that *lands* — a crash on the downbeat as the band comes back in. The
  hand-off is the part the audience hears; get it wrong and the solo sounds like it was
  interrupted.

### 4.6 Verification

`npm run genres` already asserts that a solo is never recalled at any hook level
(`genre-check.ts:341`). The solo engine adds its own assertions to the same script:
guide-tone landing rate above a threshold on chord changes, motivic recurrence within a
chorus above a threshold, rest fraction inside a band, density rising across the
section, and — the one that catches the worst failure — no solo chorus identical to
another solo chorus in the same song.

---

## 5. Vocals in the concert

The station is instrumental by default and the voice is opt-in. A concert may be mixed
the way a set is — instrumentals, a sung number, the singer walking off between them —
but mostly it is not: singing is drawn per number rather than programmed, at a rate low
enough that instrumental evenings outnumber sung ones in every genre.

- `ConcertOptions.vocals: 'instrumental' | 'mixed' | 'sung'`, default `mixed`.
- **`instrumental` is a first-class mode**, not a degraded one — it is what most of this
  repertoire actually is, and the showbill, the staging and the lighting all have to
  work with no singer present. Under `mixed`, each number takes its own chance of being
  sung — a rate the genre sets, from pop's 0.40 down to ambient's 0.10 (`SUNG_CHANCE` in
  `setlist.ts`) — so the count is not dealt and the slot is not consulted. The opener is
  as likely to be sung as the closer, no genre reaches a coin-flip, and a whole
  instrumental evening is a normal outcome rather than a special case. The rates are
  deliberately far below life: in this engine the voice is one more instrument, and a set
  that always has a singer is a set that is never about the band.
- The voice is **wordless** and stays that way — vowels and manner-of-articulation
  consonants, no language. That is the project's design, it is the sound that works, and
  the concert must not drift toward mouthing words it is not singing.
- Staging: when a number is sung there is a singer at a microphone, front and centre,
  and the lead instrument moves back a step. When it is not, the front of the stage
  belongs to whoever has the tune. The singer walks off during instrumentals rather than
  standing there holding a mic, because a performer with nothing to do is the most
  visible thing on a stage.

The mouth is animated from the vowels the IR already carries — see §8.5.

---

## 6. Smoothness

Concert numbers draw from the **top half** of the smoothness scale — `standard`,
`strict` or `polished`, weighted toward `strict` — and never from `free` or `light`.

The reasoning: smoothness is a filter on melodic and vertical roughness
(`core/rules.ts`), and the low end exists so the axis means something at both
ends. But a concert is a performance in front of an audience, watched as well as heard,
and a rough line is exactly the wrong thing to put under a spotlight. A polished band
is what a stage implies.

This overrides the genre default where the default is lower — jazz defaults to `light`,
and the concert lifts it. That is a real tension and it is resolved deliberately: **a
solo gets its interest from the solo engine's own vocabulary (§4), not from loosening
the constraint level.** Chromatic enclosures and displacement are things the solo
generator does on purpose; they are not the same as the constraint filter letting an
ugly leap through by accident. If the jazz solos sound tame at `strict`, the fix is in
`generate/solo.ts`, not in dropping the level back to `light`.

---

## 7. The clock

Everything else in this document depends on knowing what beat it is, to within a few
milliseconds, on every frame.

`render/strudel.ts` emits the whole song as one pattern using `<bar bar bar …>`, which
steps one bar per cycle, and sets `setcpm(bpm / beatsPerBar)`. So:

```
cycle == bar.   beat = cycle * beatsPerBar.   cps = bpm / 60 / beatsPerBar.
```

The transport is a thin module over `audio.ts`:

```ts
interface Transport {
  /** Song position in beats, fractional, read fresh every frame. */
  beat(): number;
  /** Seconds of audible latency to compensate. Calibrated once. */
  readonly lag: number;
  state(): 'stopped' | 'playing';
}
```

Rules, all of which exist because getting this wrong is the single most likely way for
the whole thing to look cheap:

- **One clock, and it is the audio clock.** Position derives from
  `AudioContext.currentTime`, never from accumulated `requestAnimationFrame` deltas.
  Frame time is for interpolation only.
- **Never sample the clock twice in a frame.** The frame gets one `beat()` at the top
  and every system is passed that number.
- Prefer Strudel's own `scheduler` position if it exposes one cleanly; fall back to
  `(ctx.currentTime - t0) * cps * beatsPerBar`. Behind the interface either works, and
  the fallback is trivially correct because the tempo never changes mid-song.
- **Anticipation is a lookahead, not a latency hack.** A stick has to be *up* before
  the hit, which means the animation system reads the future, not the past. That is
  what `Gesture.prep` is for (§8.2) — the renderer asks for gestures in
  `[beat - 4, beat + 4]` and interpolates.

---

## 8. The systems

Thirteen, plus verification. Each owns a file or a directory, each has a contract, and
the contracts are frozen before any of them starts.

### 8.1 The contract — `src/concert/types.ts`

Written first, by hand, before anything else. Sketch:

```ts
export interface Concert {
  seed: string;
  venue: Venue;
  bill: BillEntry[];
  numbers: ConcertNumber[];
}

export interface ConcertNumber {
  song: Song;
  cast: Cast;
  choreography: Choreography;
  groove: GrooveScore;      // §8.3
  lighting: LightingScore;
}

export interface Performer {
  id: string;
  /** The layer this player is responsible for. */
  layer: LayerId | 'drums';
  instrument: Archetype;
  look: Look;
  station: Station;
}

export interface Station {
  /** Stage coordinates in metres. +x stage right, +y up, -z upstage. */
  position: [number, number, number];
  /** Radians; 0 faces the audience. */
  facing: number;
  posture: 'stand' | 'sit' | 'stool' | 'kit' | 'perch';
  riser: number;
}
```

The **gesture** is the load-bearing type. It is deliberately semantic — the
choreographer knows music and knows nothing about geometry:

```ts
export interface Gesture {
  /** When the sound happens, in beats from song start. Quantised (§3.2). */
  beat: number;
  /** Beats of travel before `beat`. The stick rising. */
  prep: number;
  /** Beats of follow-through after. */
  release: number;
  effector: 'left-hand' | 'right-hand' | 'left-foot' | 'right-foot'
          | 'mouth' | 'bow' | 'body' | 'head';
  target: PlayPoint;
  /** 0..1 from velocity. Drives travel distance and body follow-through. */
  force: number;
  kind: 'strike' | 'pluck' | 'press' | 'bow' | 'blow' | 'squeeze' | 'hold' | 'sway';
}

export type PlayPoint =
  | { kind: 'key'; midi: Midi }
  | { kind: 'string'; string: number; fret: number }
  | { kind: 'drum'; voice: DrumVoice }
  | { kind: 'valve'; midi: Midi }
  | { kind: 'hole'; midi: Midi }
  | { kind: 'pedal'; which: 'hat' | 'kick' | 'sustain' }
  | { kind: 'bellows'; open: boolean }
  | { kind: 'viseme'; vowel: Vowel; consonant: Consonant }   // §8.5
  | { kind: 'rest' };
```

**`PlayPoint` is the seam that makes parallel work possible.** The choreographer emits
`{ kind: 'drum', voice: 'ht' }`; the drum-kit model answers "the high tom is *there*,
at that angle". Neither needs the other to exist to be written or tested. Every
instrument model implements one method — `resolve(point): { position, normal }` — and
the animation runtime is the only thing that ever calls it.

Alongside it, `src/concert/instruments.ts`: the geometry-free instrument facts the
choreographer needs — which of the ~80 entries in `style/instruments.ts` maps to which
of ~20 physical archetypes, how many hands each takes, string tunings, playable ranges,
whether it is blown (and therefore whether the player needs to breathe).

### 8.2 Choreographer — `src/concert/choreograph.ts`

`Song + Cast → Choreography`. The heart of the whole thing, and pure data in and data
out, so it is the most testable system here.

Per performer, per note: decide which effector plays it, where, how hard, and when the
limb must start moving. The rules that matter:

- **Hand assignment is a scheduling problem.** A drummer with a hat pattern in the
  right hand and a backbeat in the left has to swap when a fill crosses over; a pianist
  splits a voicing by register. Assign by proximity to where the hand already is, with a
  hard "cannot be in two places at once" check — which becomes an assertion in §11.
  Greedy is enough everywhere except the kit, where it is not: which hand starts a fill
  is decided by where the fill *ends*, and a per-stroke choice cannot see that. So a
  drummer's two sticks and their hat foot are solved as a path over the whole part —
  cheapest way through, scored on what an arm can do (a hand bursts and cannot sustain),
  what two arms can do at once (crossed is normal, knotted is not), and what a
  right-handed drummer does out of habit. See `planSticking`.
- **Prep scales with distance and force.** A hard crash needs a bigger windup than a
  ghost note on the snare, and a stick travelling from the floor tom to the ride needs
  longer than one bouncing on the snare. Prep is computed, not constant.
- **Sustaining instruments do not strike.** A bowed line gets `kind: 'bow'` with
  direction changes at phrase boundaries; a wind line gets `blow` plus breath gestures
  in the rests — the `breath` field in `IDIOMS` is already the right number and nobody
  has used it for anything visual yet.
- **Idle is choreographed, not frozen.** A player with no notes for eight bars gets
  filler: shifting weight, looking at the soloist, counting themselves in. The groove
  score (§8.3) does most of this work.

### 8.3 Groove — `src/concert/groove.ts`

A separate track from the note gestures, and separate on purpose: **playing an
instrument and feeling the beat are different behaviours, and every performer does the
second one whether or not they are doing the first.** This is what stops the band
looking like animatronics between their notes.

`Song + Cast → GrooveScore`: per performer, a continuous set of rhythmic body
behaviours with amplitudes that vary over the song.

- **Where the pulse is comes from the drums, not from the metre.** The snare positions
  in the drum pattern are the backbeat; the kick positions are the pulse. A humppa is
  felt in fast two, a jazz ballad in slow half-notes, an aquatic ambient piece in
  four-on-the-floor. Reading it off the actual pattern means a style that syncopates
  gets a band that nods where the music actually leans — deriving it from `beatsPerBar`
  would give every 4/4 song the same nod.
- **Head nod** on that pulse, amplitude from the section energy curve
  (`generate/dynamics.ts`) — bigger in the chorus, small in the intro, biggest at the
  end of a solo.
- **Foot tap** on the beat, for standing players whose feet are free. The drummer's
  feet are not free: their hi-hat and kick pedals *are* their foot rhythm and are
  already choreographed as gestures. A drummer with a third tapping foot is a bug.
- **Body sway** at the bar or two-bar level, slower than the nod, so the two read as
  separate layers of feel rather than as one bounce.
- **Nobody is in phase with anybody.** Each performer gets a small deterministic phase
  offset and looseness from their id. A band nodding in perfect unison is the single
  most robotic thing this system could produce, and the fix is two lines.
- **Role changes the behaviour.** The soloist stops nodding and starts leaning into the
  phrase; the bassist has their eyes shut; the drummer's head follows their own hands.
- **Groove yields to play.** It is an additive layer, blended *under* the note gestures
  in the animation runtime. When a hand is needed on the snare it goes to the snare and
  the sway gives way. This priority rule is part of the runtime contract (§8.11), not a
  per-system decision.

### 8.4 Casting and staging — `src/concert/cast.ts`

`Song → Cast`. Maps each track to a performer, each performer to an archetype, and
places them.

Placement is a real layout problem and worth doing properly rather than with a fixed
table: drums centre-back on a riser, bass beside the kit, comp instrument stage left,
soloist front and centre, singer at a microphone downstage when there is one, horns in
a line. Constraints — nobody occupies the same metre, nobody blocks the drummer, the
front line is downstage, sightlines to the audience. Ambient breaks all of it: no kit,
no front line, a table of gear and a lot of fog, and the staging system must not assume
a rhythm section exists.

Appearance generation lives here too — deterministic from the seed, with genre and era
stereotypes as the axis of variation:

| Genre | Era-flavoured stereotype |
|---|---|
| **iskelmä** | Tanssilava: sequinned jacket and a beehive, or a pale suit with a wide tie; accordion mandatory; a lot of hair. Later eras get lapels that get wider and then narrower. |
| **jazz** | Dark suits, skinny ties, a porkpie hat, glasses; sleeves rolled by the third number; the bassist has their eyes shut. |
| **ambient** | Anoraks, knitwear, hoods up; half the band is behind a table; nobody makes eye contact; more fog than person. |

Era should read at a glance without being a costume party. The clothing generator takes
`EraProfile` as an input — the eras are already defined per genre and already carry a
decade's worth of meaning.

### 8.5 The singer's mouth — `src/concert/visemes.ts`

The vocal layer already carries everything needed, and this is the clearest case in the
whole plan of the IR having been built right: `NoteEvent.vowel` and `NoteEvent.consonant`
are on every sung note, and `VoiceSettings.syllableBeats` / `blipBeats` say exactly how
often the mouth re-opens and how long it stays open. **The mouth animation is a
re-reading of the same numbers the synthesiser uses**, which means the lips cannot drift
out of agreement with the voice — they are driven by the same data.

- **Three continuous parameters, not fifteen shapes**: jaw openness, lip rounding, lip
  spread. The fifteen vowels map onto that triangle the same way the formant table does
  — `/a/` open and neutral, `/u/` closed and round, `/i/` closed and spread. Blending
  three numbers looks better than snapping between fifteen poses, and it matches how the
  voice is actually synthesised.
- **Consonants are a pre-note articulation**, one per manner: a stop closes the mouth
  and pops it open, a fricative narrows it, a nasal closes the lips with the jaw still
  moving, a liquid barely shows. `CONSONANTS` in `style/vocals.ts` already gives the
  attack time for each, and that is the animation timing.
- **Between syllables the mouth closes**, because `syllableBeats` says it does. That gap
  is what makes the voice read as a person rather than a drone, and it is what makes the
  face read as singing rather than as a hinge.
- **Breath in the rests.** A visible inhale before a phrase, from the same `breath`
  number the wind players use.
- No number is sung → no singer on stage → this system does nothing. It must degrade to
  silence cleanly, since most numbers are instrumental (§5).

### 8.6 Setlist and showbill — `src/concert/setlist.ts`, `src/concert/showbill.ts`

Picks 3–5 numbers with contrast (style, mood, key), applies the smoothness policy
(§6) and the vocals policy (§5), shuffles them into a playing order, and writes the bill.

The bill is where the show tells you what it is before a note is played, and it should
be *fun* rather than a table of metadata. A letterpress programme — the title in a big
face, a rule, the duration; house style shifting by genre and era. The hints are the
enjoyable part:

> **KAKSI VARJOA** · 3:14 · *tango* — "for the last dance of the evening"
> **ILTA JÄÄ** · 2:47 · *humppa* — "quick, and not gentle about it"

The era shows in the *typography and the paper*, not in a caption saying 1974. The
genre shows in the layout. Style and mood provide the copy. This is one small string
table per genre and a lot of restraint.

**The bill is also the show's menu.** Reachable at any time (§2, §8.12) without stopping
the music, it marks the number playing and how far through it is, and carries the seed,
the share link and the two switches worth exposing — instrumental-only, and quality.
Putting the options here rather than in a HUD keeps the stage clean, and a programme you
can open mid-show is a thing real theatres have.

### 8.7 Venue and stage — `src/web/concert/stage.ts`

Proscenium arch, boards, backdrop, wings, a curtain that actually gathers as it opens
(a vertex shader on a plane beats a cloth sim and looks better than a sliding
rectangle), fly bar, and an audience.

Genre dresses the venue: iskelmä gets a lakeside dance pavilion with bunting and moths
in the lights; jazz gets a low brick room, small tables, candles, smoke; ambient gets a
black box and a projection. Era shifts the palette and the fixtures.

**The audience is worth building.** A concert with no crowd is a rehearsal. Silhouetted
heads in the near foreground, instanced, gently moving; they applaud between numbers,
react to a solo, and — critically — react to a tomato.

### 8.8 Lighting score — `src/concert/lighting.ts` and `src/web/concert/lights.ts`

Split across the line: the *score* is IR (cues in beats, portable), the *rig* is
three.js.

Cues come from the form, which is already in the IR and already knows what it is doing:
intro is dim and blue, the chorus opens up, the key change on the last chorus gets a
push, the outro fades. A hit on a downbeat after a fill gets a bump. Nothing here is
random.

**The spotlight is the reason this system exists.** `Section.solo` (§3.3) names the
soloist; the lighting score turns that into a follow spot, drops the wash on everyone
else, and gives the spot a slightly late, slightly imperfect follow — an operator, not
a servo. Trading fours (§4.4) means the spot alternates between the soloist and the kit
every four bars, which is the most fun cue in the show. A drum solo drops the wash to
almost nothing and lights the kit alone. Ambient gets no follow spot at all, by design
(§4.3). This is the single highest-value visual in the whole feature and it should be
tuned like a musical decision.

Practical budget: one shadow-casting spot, a couple of shadowless key/fill lights, a
haze volume that makes beams visible (the beams *are* the effect — a spotlight without
visible haze is just a bright patch on the floor), and emissive fixtures on the fly bar.

### 8.9 Tomatoes — `src/web/concert/tomatoes.ts`

Click-drag to aim, release to throw; a real arc; collision against performers, kit and
scenery; a splat decal that persists for the rest of the number and drips.

**One hit — the player.**

1. Their layer mutes, they double over or wipe their face, and two bars later they come
   back with a freshly generated part (§3.1). The band never stops.
2. The audience reacts — a gasp, then either a laugh or a boo.
3. A hit soloist loses the spotlight, which snaps to whoever picks the solo up.
4. The stage keeps its scars for the rest of the number and is struck clean between
   numbers.

**Enough hits — the band.** Patience is a budget: a small number of hits within one
number (start at 5, tune by feel) and the band has had enough. They stop at the end of
the current bar — properly, together, not by cutting the audio — the audience erupts,
the curtain comes in, and the show advances to the next piece.

The rule has to be *legible* or it reads as a bug. So the band tells you it is coming:
after the first hit the bandleader glares, after the second the drummer stops the
groove nod, after the third someone is visibly considering leaving. **The tell is the
feature** — a threshold you can see approaching is a game mechanic, and one you cannot
is a random punishment. A counter on the HUD would be the cheap version of this and is
explicitly not what we want.

A throw cooldown, so you cannot exhaust the band in four seconds and never see the show.

### 8.10 Instrument models — `src/web/concert/instruments/*.ts`

One file per archetype, ~20 of them. Each exports a builder producing:

```ts
interface InstrumentModel {
  root: Object3D;
  resolve(point: PlayPoint): { position: Vector3; normal: Vector3 };
  /** Visual response to being played — a head that shakes, a string that vibrates. */
  react(point: PlayPoint, force: number, now: number): void;
  /** Where the player stands or sits relative to the instrument. */
  station: { offset: Vector3; facing: number; posture: Station['posture'] };
}
```

"Simple but good quality fun" means: chunky proportions, generous bevels, no textures
worth the name, flat colours with a rim light doing the work, and a couple of moving
parts that sell it — a kick head that dishes on impact, hi-hat cymbals that separate on
the pedal, a bell that flares, bellows that actually open.

An archetype that is not modelled yet falls back to a generic box-with-a-shape so an
unmapped instrument stages badly rather than crashing. §11 asserts the fallback is never
reached in practice.

### 8.11 Performers and animation — `src/web/concert/performer.ts`, `animate.ts`

Rayman hands are the reason this project is achievable at this scale.

A conventional rig means skeletons, skinned meshes, and inverse kinematics with elbow
pole targets — and IK on a drummer is genuinely hard, because the solution that puts
the hand on the snare frequently puts the elbow through the ribs. **A placed hand has
no elbow to solve.** The hand is simply *placed*, along an arc, at the position the
instrument model returned. The hardest technical problem in the feature is deleted by
the art direction, and the result reads as deliberate rather than as a shortcut because
Wii Music and Rayman got there first.

So a performer is: a head, a torso, two hands, two feet, all unparented, plus a
procedural face (eyes, brow, mouth) that can look at things, react, and sing (§8.5).
Clothing is material and simple geometry on the torso — no cloth simulation. Hands still
need character: a fist around a stick, a flat palm on a key bed, fingers spread on a
fretboard. A handful of hand poses per archetype, blended.

Arms and legs came later and do not walk any of that back, because they are **downstream
of the placement**: `performer-legs.ts` and `performer-arms.ts` re-fit two links and an
invented joint between the torso and wherever the effector ended up, every frame, with
no opinion of their own. A knee bends forward and an elbow falls away from the hand —
down, back and a little out — which is anatomy standing in for the pole target IK would
have needed. The one thing that overrides a falling elbow is technique: a hand pose can
declare that its wrist must stay straight, which a bow arm demands, and the elbow goes
wherever that puts it for as long as the hand is actually playing.

The runtime consumes everything above. For each performer, find the gestures whose
`[beat - prep, beat + release]` window contains now, resolve their `PlayPoint` through
the instrument model, and place the effector along an eased arc that is at the target
exactly on the beat.

- **Ease out into the strike, ease in out of it.** A limb accelerating into a hit and
  decelerating away is what makes it read as force rather than as a lerp.
- **Overlapping gestures blend by weight** — the last frame of a release crossfades into
  the next prep, or the hands stutter between fast notes.
- **Three layers, in priority order: play, groove, idle.** A note gesture wins over a
  groove behaviour, which wins over idle filler. Everything blends rather than snapping.
- **Everything reads the one clock.** No system keeps its own time.

### 8.12 Camera director — `src/web/concert/camera.ts`

Not in the original spec, and the feature is half as good without it. A locked wide
shot on a stage this detailed wastes everything built for it.

An automatic director cutting on musical boundaries: wide for the head, push in on the
soloist for a solo chorus, a low shot on the kit for a drum fill or a traded four, back
to wide for the last chorus. Cuts land on section boundaries and downbeats, never
mid-phrase. Held shots, not constant motion. A manual override — drag to orbit — that the
director takes back on its next cut, not on a timer: the viewer keeps the angle they
chose until the picture was going to change anyway.

The rule that keeps it from being nauseating: **cut, don't fly.** Two or three fixed
camera positions per stage plus a slow push is more convincing than any amount of
swooping.

### 8.13 Show runner — `src/web/concert/show.ts`

The state machine, and the owner of the transitions the spec asks for by name:

```
BILL ──click──▸ CURTAIN ──▸ COUNT-IN ──▸ PLAYING ──▸ APPLAUSE ──▸ (next number | BOW)
                                             ▲  │
                                    programme │  │ P / button        (music continues)
                                             └──▾ PROGRAMME
```

- **BILL** — house lights low, curtain closed, the showbill hanging front and centre.
  The click that drops it is the same click that unlocks Web Audio, which is convenient:
  `initAudioOnFirstClick` is already armed on page load (`audio.ts:38`), and this is the
  gesture it is waiting for.
- **CURTAIN** — the bill drops out of frame, the curtain opens, the band is discovered
  already at their stations. (Discovered, not walking on. Half the visual payoff of a
  curtain is that the tableau behind it is already complete.)
- **COUNT-IN** — genre-specific. Jazz gets stick clicks; iskelmä gets an accordion
  breath and a nod; ambient gets no count at all, just a fade up.
- **PLAYING** — transport running, choreography and groove driving, director cutting.
- **PROGRAMME** — the bill comes back over the show, marking the number playing (§8.6).
  **The music does not stop.** Dismissing it returns to exactly where you were. This is
  an overlay state, not a pause.
- **APPLAUSE** — house up a little, the band acknowledges, the stage is struck, the next
  number's cast is re-staged behind a brief curtain close if the instrumentation changed
  or the singer is joining or leaving.
- **BOW** — after the last number. Curtain in.

Input modes, which must be unambiguous or the tomatoes will feel broken: in BILL a click
advances; in PLAYING a click throws; a drag orbits the camera in any state; `P` opens the
programme anywhere.

---

## 9. Also worth building, and cheap

Small things that are easy here and disproportionately raise how finished it feels:

- **Reduced motion and a no-WebGL fallback.** `prefers-reduced-motion` calms the camera
  and the strobe. No WebGL context → the showbill alone, with audio, which is a
  perfectly good degraded experience.
- **A performance budget with visible knobs.** Target 60fps on integrated graphics:
  instanced audience, one shadow map, shared materials, no post-processing beyond a
  cheap bloom on the fixtures. A quality selector that turns off haze and shadows.
- **Deep-link a concert** — `concert.html?seed=…&genre=jazz&vocals=instrumental`
  reproduces a show exactly. Trivial given determinism, and it is how a good moment gets
  shared. Lives on the programme (§8.6).
- **The bandleader's count.** It is what makes the first downbeat land rather than merely
  start.
- **Mobile.** Tap to advance, tap to throw, no drag-to-orbit. The stage is a fixed camera
  show anyway.

Explicitly **out of scope**, so nobody builds it by accident: cloth simulation, facial
capture, walk cycles and entrances, per-string physical vibration, real-time reverb
matched to the venue, lyrics or any form of language in the voice, and any form of
persistence or scoring.

---

## 10. File layout

```
concert.html                            new page, registered in vite.config.ts

src/concert/                            MIT · Song -> Performance IR · no browser
  types.ts                              the contract (§8.1)
  instruments.ts                        catalogue entry -> archetype; tunings, ranges
  setlist.ts                            pick and order the numbers; smoothness + vocals policy
  showbill.ts                           the bill and its copy
  cast.ts                               casting, appearance, staging
  choreograph.ts                        MIDI -> gestures
  groove.ts                             pulse -> nods, taps, sway (§8.3)
  visemes.ts                            vowels -> mouth shapes (§8.5)
  lighting.ts                           form -> light cues
  venue.ts                              genre + era -> venue description
  index.ts                              buildConcert(opts): Concert

src/web/concert/                        app side · three.js + Strudel
  main.ts                               boot, page wiring
  show.ts                               state machine (§8.13)
  transport.ts                          the clock (§7)
  stage.ts                              venue, curtain, audience
  performer.ts                          rig, look, hand poses, face
  instruments/                          one file per archetype
    drumkit.ts  piano.ts  accordion.ts  guitar.ts  upright-bass.ts
    trumpet.ts  saxophone.ts  violin.ts  vibraphone.ts  organ.ts  synth.ts  mic.ts  …
  animate.ts                            gestures + groove -> limbs (§8.11)
  lights.ts                             cues -> fixtures
  camera.ts                             the director
  tomatoes.ts                           throw, collide, splat, consequence, patience
  showbill.ts                           the bill, rendered; also the programme overlay

src/generate/solo.ts                    real solos (§4)
src/concert-check.ts                    headless verification (§11)
```

---

## 11. Work breakdown

Contracts first, then three waves. Systems within a wave are independent and get an
agent each; the interfaces they share are frozen before the wave starts, which is the
only reason parallel work is safe here.

### Wave 0 — contracts *(sequential, single owner)*

1. `src/concert/types.ts` and `src/concert/instruments.ts` — the Performance IR, the
   archetype table, the stage coordinate convention, units (metres, beats, radians).
2. `Section.solo` with its backing policy, and the `variation` option on
   `GenerateOptions` (§3.1, §3.3) — both touch shared code and both would collide if
   done later.
3. Extract the 16th-grid quantiser from `render/strudel.ts` (§3.2).
4. `concert.html`, `vite.config.ts`, three.js dependency, an empty scene that renders.

Nothing else starts until this lands.

### Wave 1 — parallel, no dependencies beyond the contract

| # | System | Owner reads | Owner writes |
|---|---|---|---|
| A | **Solo engine** (§4) | `generate/melody.ts`, `constraints.ts`, `fills.ts`, `motto.ts`, genre forms | `generate/solo.ts`, drum-solo vocabulary, per-genre `SoloProfile`, backing policy |
| B | **Choreographer** (§8.2) | Song IR, `concert/instruments.ts` | `concert/choreograph.ts` |
| C | **Groove & visemes** (§8.3, §8.5) | drum patterns, `dynamics.ts`, `style/vocals.ts` | `concert/groove.ts`, `concert/visemes.ts` |
| D | **Casting & staging** (§8.4) | Song IR, `style/instruments.ts`, era profiles | `concert/cast.ts`, `concert/venue.ts` |
| E | **Setlist & showbill** (§8.6) | genre tables, titles, eras, strictness, vocals | `concert/setlist.ts`, `concert/showbill.ts`, `web/concert/showbill.ts` |
| F | **Lighting score** (§8.8) | sections, dynamics, `Section.solo` | `concert/lighting.ts` |
| G | **Stage & venue geometry** (§8.7) | `concert/types.ts` | `web/concert/stage.ts` |
| H | **Instrument models** (§8.10) | `PlayPoint`, archetype table | `web/concert/instruments/*` |
| I | **Performer rig & look** (§8.11) | `Look`, `Station`, viseme parameters | `web/concert/performer.ts` |

H is the largest by volume and splits cleanly into three agents by family — percussion
and keys; strings and plucked; winds, brass and gear — since the archetypes share
nothing but the interface.

A is the largest by difficulty and is the one to start first, because it is musical work
and needs listening time. It is also the only Wave 1 item that ships value on its own:
the radio page gets better solos whether or not the stage ever gets built.

### Wave 2 — integration, needs Wave 1

| # | System | Depends on |
|---|---|---|
| J | **Animation runtime** (§8.11) | B, C, H, I |
| K | **Lighting rig** (§8.8) | F, G |
| L | **Camera director** (§8.12) | G, and the form |
| M | **Show runner & transport** (§7, §8.13) | everything; owns the wiring and the programme overlay |
| N | **Tomatoes** (§8.9) | I, G, M, and the `variation` seam |

### Wave 3 — the pass that decides whether it is good

Timing feel, prep curves, groove phase and amplitude, spotlight lag, camera cut points,
curtain weight, count-in, audience reaction, the band's patience threshold, quality
tiers, mobile. This is not polish in the dismissible sense — a technically correct
concert with badly timed hands looks worse than a simpler one with well-timed hands, and
this is where that gets fixed.

---

## 12. Verification — `npm run concert`

The Performance IR is data, so most of what "looks wrong" means can be asserted
headlessly, in the same spirit as `npm run genres` and `npm run audit`. Over a few
hundred generated concerts across every genre, era and style:

**Coverage**
- Every sounding note in every track produces exactly one gesture. No silent players,
  no phantom hits.
- Every instrument in `style/instruments.ts` maps to a modelled archetype. The generic
  fallback is never reached.
- Every `PlayPoint` lies within its archetype's declared range.
- Every sung note produces a viseme; no viseme without a note.

**Physical plausibility** — the checks that make hands look real
- No effector is scheduled in two places at once.
- No effector exceeds a human travel speed between consecutive targets. This is *the*
  quality metric; a threshold in metres per second, and violations get reported with
  the song seed so they can be looked at.
- Every gesture's prep window starts after the previous gesture on that effector has
  released.
- Every gesture lands on the 16th grid the audio is quantised to (§3.2).
- No performer taps a foot that is on a pedal.

**Music**
- Solo assertions per §4.6, run inside `npm run genres`.
- Every number's smoothness is `standard` or higher (§6).
- Under `vocals: 'instrumental'`, no track carries a voice.

**Staging**
- Every performer has a station; no two stations within 0.8 m; nobody upstage of the
  backdrop or in the orchestra pit.
- Sightlines: no performer entirely occluded from the default camera.
- A singer exists on exactly the numbers that are sung.

**Show**
- Bill durations sum to the concert duration, within a second.
- Every spotlight cue names a performer who exists and is playing at that moment.
- No cue after the last note.

**Determinism**
- The same seed produces a byte-identical `Concert`, twice, in the same process and
  across a fresh one.

Added to `npm run verify` alongside the existing checks.

---

## 13. Risks

| Risk | Mitigation |
|---|---|
| **Clock drift** — visuals slowly separating from audio | Single audio-derived clock, sampled once per frame, never accumulated (§7). Caught by watching a kick over a two-minute number. |
| **Instrument count** — 80 catalogue entries | ~20 archetypes plus a fallback, with §12 asserting the fallback is unused. Adding an instrument to the catalogue later fails the check loudly rather than silently staging a box. |
| **Ambient has no band, and no solo** | Staging must not assume a rhythm section, and the lighting must not assume a foreground. Ambient is a table, a lot of fog, and two people not looking at each other — designed for explicitly, not degraded into. |
| **The solo is the biggest piece of work and it is musical** | Started first, verified by ear as well as by the report scripts, and worth shipping to the radio page on its own merits even if the stage slips. |
| **High smoothness makes jazz solos tame** | The solo engine carries its own vocabulary rather than relying on a loose constraint level (§6). If it still sounds tame, the fix is in `generate/solo.ts` — measured by the §4.6 assertions, not by taste alone. |
| **The band's patience reads as a bug** | The escalating tells (§8.9) are part of the feature, not decoration. If a playtester is surprised when the band walks off, the tells are not working and that is a Wave 3 fix. |
| **Groove looks robotic** | Per-performer phase offset and looseness, pulse read from the drum pattern rather than the metre, and a hard priority rule that play beats groove (§8.3). |
| **Performance** | Budget set in Wave 0, measured in Wave 1, quality tiers in Wave 3. Instanced audience, one shadow map, no heavy post. |
| **Parallel agents drifting** | Contracts frozen in Wave 0; `npm run concert` is the shared definition of correct; `npm run typecheck` is the shared definition of connected. |
| **Scope** | The waves are ordered so that stopping after Wave 2 still yields a working concert. Wave 3 is what makes it good, not what makes it run. |

---

## 14. What "done" looks like

You open the concert tab. A programme hangs in front of a closed curtain, four numbers
listed with their durations and a line about each; the third one is marked as sung. You
click. The bill drops, the curtain gathers open on a lakeside dance pavilion, five
players already at their stations under a warm wash, moths in the beams. The
accordionist nods, and the band comes in together.

You watch the drummer's left hand actually go to the snare on two and four, and to the
tom for the fill going into the chorus. The bass player's head is moving on the pulse
and the guitarist's foot is going, slightly out of phase, the way a real band is. On the
solo chorus the wash drops and a follow spot finds the fiddle player a beat late, the
way an operator would, while the band keeps comping behind them.

You press `P` mid-number and the programme comes up over the show without the music
missing a beat.

Then you hit the fiddle player with a tomato, the audience gasps, and after two bars
they come back playing something else entirely. You do it three more times, the
bandleader has been glaring for a while now, and on the fifth the whole band stops
together at the end of the bar, the crowd goes up, and the curtain comes in on number
two.
