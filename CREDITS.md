# Credits

Every recording this app plays, who made it, and what their licence asks of us.

Not linked from any page yet. Doing that is the last step of moving the audio
onto our own origin — see the bottom of this file.

## Sample libraries

### Versilian Community Sample Library (VCSL)

Real instruments, recorded rather than synthesised. Supplies the auxiliary
percussion — darbuka, congas, bongo, cabasa, cowbell, tambourine, framedrum —
and seven melodic instruments the soundfonts approximate badly: the Steinway,
both pipe organs, the psaltery, the đàn tranh, the strumstick and the balafon.

- Versilian Studios LLC — <https://github.com/sgossner/VCSL>
- **CC0 1.0** (public domain dedication)

No conditions at all. The credit is courtesy, not obligation.

### Mridangam

Thirteen Carnatic strokes, recorded stroke by stroke. Three of them — `thom`,
`na` and `ta` — are the `mridangam` rack.

- Samples © Arthur Carabott, 2022
- Performer: Harishankar V Menon
- <https://www.arthurcarabott.com/konnakkol/> — <https://github.com/yaxu/mrid>
- **Creative Commons Attribution ShareAlike**

Attribution is required, and this file is where it is discharged. The credit
must survive into anything that ships these recordings.

**Open question, and it is a real one.** ShareAlike binds adaptations. Whether a
generated piece that plays these strokes counts as an adaptation is not settled
here. It does not matter for a browser toy; it would matter for a game
soundtrack meant to carry its own licence. Decide it before shipping one.

### Tidal drum machines

The 55 drum machines every kit is built from.

- <https://github.com/geikha/tidal-drum-machines> (formerly `ritchse/`)
- **No licence declared**

**Unresolved.** No licence means all rights reserved, so nothing here grants
redistribution — and the recordings are of commercial vintage hardware, whose
own provenance the pack does not state. Self-hosting them makes us the
distributor of material we have no stated right to distribute.

Three ways out: ask the maintainer for a licence, swap in a CC0 pack, or
synthesise the voices instead. An 808 kick is a sine with a pitch envelope and a
hat is filtered noise, so the third is smaller work than it sounds and is where
the native engine is going anyway.

## Soundfonts

Every melodic instrument with a General MIDI equivalent — 125 of them.

- WebAudioFont data, © Srgy Surkv, 2017 — **MIT**
- <https://github.com/surikov/webaudiofontdata>, via
  <https://github.com/felixroos/webaudiofontdata>

The sounds inside come from two freely redistributable soundfonts:

- **GeneralUser GS** by S. Christian Collins —
  <http://www.schristiancollins.com/generaluser.php>
- **FluidR3** — <https://github.com/musescore/MuseScore/blob/master/share/sound/FluidR3Mono_License.md>

## Code

This project is MIT. One exception, and it is deliberate: the Strudel playback
layer is **AGPL-3.0-or-later**, and using it makes the deployed page subject to
that licence. `web/audio.ts` and `render/strudel.ts` are the whole of that
surface — see the header of `web/audio.ts`. Everything else (theory, styles,
generator, MIDI renderer) is independent and MIT.

- Strudel — <https://codeberg.org/uzu/strudel> — AGPL-3.0-or-later

## Before this file goes live

1. Resolve the drum machine question above. It is the only item that is not
   already settled.
2. Link this page from the app.
