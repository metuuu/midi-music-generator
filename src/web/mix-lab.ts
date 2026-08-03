/**
 * The mix lab.
 *
 * A bench for the one question the level work keeps running into and no meter
 * can answer: **how loud should this be against that?**
 *
 * There are two kinds of number behind every gain in this project and they are
 * not the same kind of fact. `render/source-levels.ts` holds *measurements* —
 * what a soundfont or a drum sample actually outputs, taken off a K-weighted
 * meter, and the file is only worth having while every entry in it stays that
 * way. `DEFAULT_DRUM_MIX`, `Genre.mix` and `VOICE_MIX` hold *taste* — how loud a
 * ride sits against a kick, how far the brass is behind the tune — and those
 * were settled by ear with nothing to listen through but a whole song.
 *
 * This page is for the second kind, and it deliberately cannot reach the first.
 * A fader that wrote into a measurement table would destroy the only property
 * that makes it trustworthy, which is that you can tell what was measured from
 * what was guessed. So the knobs here are exactly the ~25 numbers somebody chose
 * and nobody verified.
 *
 * ## What it does that the song page cannot
 *
 * Solo and mute, which is how nearly every real judgement about level actually
 * gets made: a ride that sounds too loud in a full mix has to be heard against
 * the kick alone before you know whether the fader is wrong, the sample is
 * wrong, or the part is. Then a live fader, because the second half of that
 * judgement is moving it while it plays.
 *
 * Strudel re-evaluates a running pattern in place, so every change here is a
 * re-render and a hot swap on the next cycle rather than a restart. The clock
 * does not stop and the comparison stays honest.
 *
 * ## Where the numbers go
 *
 * Out as TypeScript, not into storage. The mix is read by the MIDI renderer and
 * will be read by whatever native engine comes after it, so a value that lived
 * only in this page's `localStorage` would be a fourth source of truth that only
 * the audition could see — the .mid would ship the old balance and nobody would
 * know why. The output of a session here is a diff, which is the same place
 * every other decision in this project ends up.
 */

import {
  initAudio, loadCode, pausePlayback, playCode, preloadSounds, startLoaded, stopPlayback,
} from './audio.js';
import { generateSong, type GenerateOptions } from '../generate/song.js';
import { renderStrudel } from '../render/strudel.js';
import { GENRE_IDS, getGenre } from '../genre/index.js';
import { DEFAULT_DRUM_MIX, type DrumVoice, type LayerId, type Song } from '../core/types.js';
import { INSTRUMENTS } from '../style/instruments.js';
import { resolveVoice } from '../render/drum-banks.js';
import { levelOfDrum, REGISTER_LEVEL, SOUNDFONT_LEVEL } from '../render/source-levels.js';

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el as T;
};

const els = {
  genre: $<HTMLSelectElement>('genre'),
  seed: $<HTMLInputElement>('seed'),
  regen: $<HTMLButtonElement>('regen'),
  play: $<HTMLButtonElement>('play'),
  stop: $<HTMLButtonElement>('stop'),
  reset: $<HTMLButtonElement>('reset'),
  copy: $<HTMLButtonElement>('copy'),
  status: $<HTMLDivElement>('status'),
  desc: $<HTMLDivElement>('desc'),
  layers: $<HTMLDivElement>('layers'),
  voices: $<HTMLDivElement>('voices'),
  out: $<HTMLPreElement>('out'),
};

/**
 * A trim rather than a level, and that is the whole ergonomics of the page.
 *
 * The strips move a multiplier over whatever the genre already says, so unity is
 * the centre of every fader and "I have changed nothing" is visible at a glance
 * across twenty-five of them. Reading absolute values into the sliders would
 * make the tables' own shape — a ride three times under a kick — look like
 * twenty-five arbitrary positions, and there would be no way to see what you had
 * touched.
 */
interface MixState {
  layer: Map<LayerId, number>;
  voice: Map<DrumVoice, number>;
  muted: Set<string>;
  solo: Set<string>;
  /**
   * Where a melodic strip's change is meant to land, per layer.
   *
   * The fader sounds the same either way — it is a trim on the track, and the
   * track is what you hear — so this changes nothing but the paste. It exists
   * because the two destinations are different claims and the page cannot tell
   * which one you made: pulling the melody down because *this song's accordion*
   * was hot is a statement about accordions, and writing it to `mix.melody`
   * moves the vibraphone and the trumpet the next time the genre deals them.
   *
   * Defaults to the instrument. When you solo a strip and react, what you are
   * reacting to is a sound, and a sound is an object rather than a role.
   */
  target: Map<LayerId, 'instrument' | 'layer'>;
}

const state: MixState = {
  layer: new Map(), voice: new Map(), muted: new Set(), solo: new Set(), target: new Map(),
};

let song: Song | undefined;

/**
 * Three states rather than a boolean, because paused is not stopped here.
 *
 * A stopped transport has no pattern on the scheduler and the next Play has to
 * load one; a paused transport still holds the bar it was in, so a fader moved
 * while paused has somewhere to go and Play resumes into the change rather than
 * starting the song again. Collapsing the two would make every comparison start
 * from the intro, which is the one thing a bench must not do.
 */
type Transport = 'stopped' | 'playing' | 'paused';
let transport: Transport = 'stopped';

const trimOf = (key: string): number =>
  (key.startsWith('d:')
    ? state.voice.get(key.slice(2) as DrumVoice)
    : state.layer.get(key.slice(2) as LayerId)) ?? 1;

/**
 * Solo wins over mute, and an empty solo set means everything plays.
 *
 * The precedence matters more than it looks: soloing the ride and then muting it
 * should leave you hearing nothing rather than hearing the band, because the
 * question you were asking was about the ride.
 */
function audibleAt(key: string): boolean {
  if (state.solo.size > 0) return state.solo.has(key);
  return !state.muted.has(key);
}

/**
 * The song as the current strips would have it — a copy, because the strips are
 * a view of a mix and not an edit to the arrangement. Regenerating with the same
 * seed has to give the same song back, and mutating the IR under the faders
 * would make the trims compound every time one moved.
 */
function mixed(base: Song): Song {
  const tracks = base.tracks
    .filter((t) => audibleAt(`l:${t.layer}`))
    .map((t) => ({ ...t, gain: t.gain * trimOf(`l:${t.layer}`) }));

  const voiceGains = { ...base.drums.voiceGains };
  for (const voice of Object.keys(voiceGains) as DrumVoice[]) {
    voiceGains[voice] = audibleAt(`d:${voice}`)
      ? voiceGains[voice] * trimOf(`d:${voice}`)
      : 0;
  }
  return { ...base, tracks, drums: { ...base.drums, voiceGains } };
}

const targetOf = (layer: LayerId): 'instrument' | 'layer' =>
  state.target.get(layer) ?? 'instrument';

/**
 * Catalogue key by human name, because the IR only carries the second.
 *
 * `Track.instrument` is `"electric piano"` and the thing you would edit is
 * `epiano1`, so a paste naming the human one is not TypeScript at all — the
 * names with spaces in them are not even syntactically keys. All 126 entries
 * have distinct names, so this direction is unambiguous.
 */
const KEY_OF_INSTRUMENT = new Map(
  Object.entries(INSTRUMENTS).map(([key, entry]) => [entry.name, key] as const),
);

/**
 * What the genre's own table said, with the instrument's trim divided back out.
 *
 * `Track.gain` is the product of the two since `Instrument.gain` exists, so a
 * layer-aimed paste has to undo it or it would fold one accordion's correction
 * into the level of every melody the genre ever writes — which is the exact
 * confusion this whole control was added to end.
 */
function layerGainOf(instrumentName: string, trackGain: number): number {
  const key = KEY_OF_INSTRUMENT.get(instrumentName);
  const own = (key ? INSTRUMENTS[key as keyof typeof INSTRUMENTS].gain : undefined) ?? 1;
  return trackGain / own;
}

/**
 * What is known about this font's level, in the strip's own words.
 *
 * The kit strips have said this since the page existed and the melodic ones did
 * not, which was the wrong way round: the fonts are where the 19.2 dB spread
 * lives. An `unmeasured` here is the difference between a fader recording a
 * judgement and a fader standing in for a measurement nobody took — see
 * `Instrument.gain`.
 */
function fontStatus(sound: string): string {
  const base = SOUNDFONT_LEVEL[sound];
  if (base === undefined) return 'unmeasured font';
  const ranged = REGISTER_LEVEL[sound] ? '' : ' · one pitch only';
  return `trim ×${base.toFixed(2)}${ranged}`;
}

const dbOf = (factor: number): string =>
  (factor <= 0 ? '−∞' : `${factor === 1 ? '' : 20 * Math.log10(factor) > 0 ? '+' : ''}${(20 * Math.log10(factor)).toFixed(1)}`);

function strip(
  key: string,
  name: string,
  gloss: string,
  base: number,
  /** Present on melodic strips only: what the paste can be aimed at. */
  aim?: { layer: LayerId; instrument: string },
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'strip';

  const label = document.createElement('div');
  label.className = 'strip-name';
  const title = document.createElement('b');
  title.textContent = name;
  label.append(title);

  const sub = document.createElement('span');
  sub.textContent = gloss;
  label.append(sub);

  let chip: HTMLButtonElement | undefined;
  if (aim) {
    // The destination is a claim about what you heard, so it is a control rather
    // than a caption — one click, and the paste changes without the sound doing.
    chip = document.createElement('button');
    chip.className = 'chip';
    chip.onclick = () => {
      state.target.set(aim.layer, targetOf(aim.layer) === 'instrument' ? 'layer' : 'instrument');
      repaint();
      emit();
    };
    label.append(chip);
  }

  const mute = document.createElement('button');
  mute.className = 'tog';
  mute.textContent = 'M';
  mute.title = 'mute';
  const solo = document.createElement('button');
  solo.className = 'tog';
  solo.textContent = 'S';
  solo.title = 'solo';

  const fader = document.createElement('input');
  fader.type = 'range';
  fader.min = '0';
  /**
   * Each strip stops where its own table does. Both `Genre.mix` and
   * `voiceGains` are documented 0..1, so a fader that could reach ×2 on a layer
   * already sitting at 0.95 would let you tune by ear to a number the tables
   * cannot hold — and you would not find out until the paste. Ending the travel
   * at the ceiling says it while you are still listening.
   */
  // Floored to the step rather than rounded: rounding the last hundredth *up*
  // puts the top of the travel a thousandth over the ceiling it exists to
  // enforce, which is a small number and the wrong side of the only line here.
  fader.max = String(Math.floor(100 / Math.max(base, 0.01)) / 100);
  fader.step = '0.01';
  fader.value = String(trimOf(key));

  const read = document.createElement('div');
  read.className = 'strip-read';

  const paint = () => {
    const trim = trimOf(key);
    if (aim && chip) {
      const toInstrument = targetOf(aim.layer) === 'instrument';
      chip.textContent = toInstrument ? `→ ${aim.instrument}` : `→ ${aim.layer} · ${els.genre.value}`;
      chip.title = toInstrument
        ? 'this instrument, in every genre — click to aim at the layer instead'
        : 'this layer in this genre, whatever plays it — click to aim at the instrument instead';
      chip.classList.toggle('global', toInstrument);
    }
    mute.classList.toggle('on', state.muted.has(key));
    solo.classList.toggle('on', state.solo.has(key));
    row.classList.toggle('silent', !audibleAt(key));
    row.classList.toggle('moved', Math.abs(trim - 1) > 0.005);
    // Both numbers, because they answer different questions: the dB is what the
    // ear just heard change, the absolute is what has to be typed into the table.
    read.innerHTML = `<b>${dbOf(trim)} dB</b><span>${(base * trim).toFixed(3)}</span>`;
  };

  const touch = () => { paint(); apply(); };
  mute.onclick = () => {
    if (!state.muted.delete(key)) state.muted.add(key);
    repaint(); apply();
  };
  solo.onclick = () => {
    if (!state.solo.delete(key)) state.solo.add(key);
    repaint(); apply();
  };
  fader.oninput = () => {
    const v = Number(fader.value);
    if (key.startsWith('d:')) state.voice.set(key.slice(2) as DrumVoice, v);
    else state.layer.set(key.slice(2) as LayerId, v);
    touch();
  };
  // A double-click is the fastest way back to "as written", which is the
  // comparison every judgement here is against.
  fader.ondblclick = () => { fader.value = '1'; fader.oninput!(new Event('input')); };

  row.append(label, mute, solo, fader, read);
  paint();
  painters.push(paint);
  return row;
}

const painters: (() => void)[] = [];
const repaint = () => { for (const p of painters) p(); };

function build(): void {
  if (!song) return;
  painters.length = 0;
  els.layers.replaceChildren();
  els.voices.replaceChildren();

  for (const track of song.tracks) {
    els.layers.append(strip(
      `l:${track.layer}`,
      `${track.layer} · ${track.instrument}`,
      fontStatus(track.strudelSound),
      track.gain,
      { layer: track.layer, instrument: track.instrument },
    ));
  }

  // Only the voices this kit actually plays, and named by what will sound rather
  // than by what was written — a bank with no ride answers a ride with a crash,
  // and a strip labelled `rd` while a crash comes out is the exact confusion
  // this page exists to clear up. See `render/drum-banks.ts`.
  const present = [...new Set(song.drums.events.map((e) => e.voice))]
    .sort((a, b) => (DEFAULT_DRUM_MIX[b] ?? 0) - (DEFAULT_DRUM_MIX[a] ?? 0));
  for (const voice of present) {
    const sound = resolveVoice(song.drums.bank, voice);
    if (!sound) continue;
    const trim = levelOfDrum(song.drums.bank, sound);
    const gloss = [
      sound === voice ? '' : `as ${sound}`,
      trim === 1 ? 'unmeasured' : `trim ×${trim.toFixed(2)}`,
    ].filter(Boolean).join(' · ');
    els.voices.append(strip(`d:${voice}`, voice, gloss, song.drums.voiceGains[voice] ?? 1));
  }
  emit();
}

/**
 * Re-render and hot-swap, so a fader moves the mix without stopping the clock.
 *
 * Paused takes the other call deliberately. `playCode` evaluates *and* starts,
 * which on a held clock would turn every fader nudge into an unpause; `loadCode`
 * swaps the pattern and leaves the transport alone, so a mix can be rebalanced
 * in the silence and heard all at once when Play comes back.
 */
function apply(): void {
  emit();
  if (transport === 'stopped' || !song) return;
  const code = renderStrudel(mixed(song));
  void (transport === 'playing' ? playCode(code) : loadCode(code));
}

/**
 * The session's output: the two tables, with only the rows that moved.
 *
 * Absolute values rather than the trims, because the trims are this page's
 * ergonomics and the tables are the project's. Only what moved, because a paste
 * that restates the twenty numbers you did not touch is a diff nobody can read.
 */
function emit(): void {
  if (!song) return;
  const lines: string[] = [];

  const moved = song.tracks.filter((t) => Math.abs(trimOf(`l:${t.layer}`) - 1) > 0.005);

  /**
   * The instrument-aimed rows carry the trim, not the resulting gain.
   *
   * `Instrument.gain` multiplies whatever the genre's fader already said, so the
   * number to write there is the factor you moved and not the level you ended
   * on — pasting the level would fold this genre's own balance into a global
   * table and make the accordion quiet everywhere iskelmä happens to be loud.
   */
  const global = moved.filter((t) => targetOf(t.layer) === 'instrument');
  if (global.length) {
    lines.push('// style/instruments.ts — global, every genre that deals this');
    for (const t of global) {
      const trim = trimOf(`l:${t.layer}`);
      const status = fontStatus(t.strudelSound);
      if (status.startsWith('unmeasured')) {
        // Said out loud rather than left in the number: this one is a guess in a
        // measurement's chair, and it will be wrong by whatever the measurement
        // would have said. See `Instrument.gain`.
        lines.push(`// ⚠ ${t.instrument}'s font is unmeasured — this is standing in for a`);
        lines.push('//   measurement, not recording a balance. Measure it instead if you can.');
      } else if (status.includes('one pitch')) {
        lines.push(`// ⚠ ${t.instrument}'s font was measured at one pitch only — if it is loud`);
        lines.push('//   in one octave and not another, this wants a REGISTER_LEVEL row.');
      }
      // `…` rather than the entry's own text, because the page does not have
      // it: `G` wraps whatever that key is already defined as — often an `L` or
      // an `E` wrap of its own — and printing `G(epiano1, …)` would emit a
      // self-reference that is not legal inside the object literal it goes in.
      const key = KEY_OF_INSTRUMENT.get(t.instrument) ?? t.instrument;
      lines.push(`${key}: G(…, ${trim.toFixed(2)}),  // ${t.instrument} — wrap its existing entry`);
    }
  }

  const layers = moved.filter((t) => targetOf(t.layer) === 'layer');
  if (layers.length) {
    if (lines.length) lines.push('');
    lines.push(`// ${els.genre.value} — Genre.mix, whatever instrument plays the layer`);
    lines.push('mix: {');
    for (const t of layers) {
      const level = layerGainOf(t.instrument, t.gain) * trimOf(`l:${t.layer}`);
      lines.push(`  ${t.layer}: ${level.toFixed(2)},  // heard on ${t.instrument}`);
    }
    lines.push('},');
  }

  const voices = ([...state.voice.entries()] as [DrumVoice, number][])
    .filter(([, v]) => Math.abs(v - 1) > 0.005);
  if (voices.length) {
    if (lines.length) lines.push('');
    lines.push('// Style.voiceGains — merged over DEFAULT_DRUM_MIX');
    lines.push('voiceGains: {');
    for (const [voice, trim] of voices) {
      lines.push(`  ${voice}: ${((song.drums.voiceGains[voice] ?? 1) * trim).toFixed(2)},`);
    }
    lines.push('},');
  }

  els.out.textContent = lines.length
    ? lines.join('\n')
    : '// nothing moved yet — the mix is as the tables have it';
}

function describe(s: Song): void {
  els.desc.textContent = `${s.meta.title} · ${s.meta.styleLabel} · ${s.meta.keyLabel}`
    + ` · ${s.meta.bpm} BPM · drums: ${s.drums.bank}`;
}

function regenerate(): void {
  const opts: GenerateOptions = {
    genre: els.genre.value,
    ...(els.seed.value ? { seed: els.seed.value } : {}),
  } as GenerateOptions;
  song = generateSong(opts);
  els.seed.value = song.meta.seed;
  describe(song);
  build();
  // A new song under a paused transport loads but does not start: the transport
  // is the listener's, and nothing here should decide to make noise for them.
  if (transport === 'playing') void start();
  else if (transport === 'paused') apply();
}

/** Load the band and start from the top. */
async function start(): Promise<void> {
  if (!song) return;
  setTransport('playing', 'loading the band…');
  const staged = mixed(song);
  await preloadSounds(staged);
  await playCode(renderStrudel(staged));
  setTransport('playing');
}

function setTransport(next: Transport, status?: string): void {
  transport = next;
  els.play.textContent = next === 'playing' ? 'Pause' : 'Play';
  els.play.classList.toggle('primary', next !== 'playing');
  els.stop.disabled = next === 'stopped';
  els.status.textContent = status ?? {
    playing: 'playing — solo, mute and ride the faders',
    paused: 'paused — the faders still move; Play picks up where it stopped',
    stopped: 'ready',
  }[next];
}

els.genre.replaceChildren(...GENRE_IDS.map((id) => {
  const opt = document.createElement('option');
  opt.value = id;
  opt.textContent = getGenre(id).label;
  return opt;
}));

els.regen.onclick = () => { els.seed.value = ''; regenerate(); };
els.play.onclick = () => {
  if (transport === 'playing') {
    void pausePlayback();
    setTransport('paused');
  } else if (transport === 'paused') {
    // Resume rather than reload: the scheduler kept its phase, and re-evaluating
    // here would only throw away the bar the comparison was standing on.
    void startLoaded();
    setTransport('playing');
  } else {
    void start();
  }
};
els.stop.onclick = () => {
  void stopPlayback();
  setTransport('stopped', 'stopped — Play starts again from the top');
};
els.reset.onclick = () => {
  state.layer.clear(); state.voice.clear();
  state.muted.clear(); state.solo.clear();
  repaint(); apply();
};
els.copy.onclick = () => {
  void navigator.clipboard.writeText(els.out.textContent ?? '');
  els.copy.textContent = 'copied';
  window.setTimeout(() => { els.copy.textContent = 'Copy'; }, 1200);
};

/**
 * Arm the audio stack now, not on Play.
 *
 * `initAudioOnFirstClick` registers its listener synchronously and resolves when
 * it fires, so calling it from the Play handler arms it *after* the click that
 * would have satisfied it — and the first press hangs waiting for a second one.
 * See the note on `initAudio`.
 */
void initAudio().catch((err) => {
  els.status.textContent = `the audio stack would not start: ${String(err)}`;
  console.error(err);
});

// The transport paints itself from one place, so the buttons cannot start out
// saying something the state does not.
setTransport('stopped');
regenerate();
