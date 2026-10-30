// WebAudio: plays the verified audio pack (assets/audio, ogg or mp3) from decoded buffers,
// falling back to the small synth below when a file is missing or not decoded yet.
// All sound starts after a user gesture; music is opt-in.
let ctx, master, sfxBus, musicBus, muted = false, music = false, scene = 'title', timer, beat = 0;
const BASE = new URL('../assets/audio/', import.meta.url).href;
const buffers = {}, loading = {}, failed = {}, played = {};
const QUIET = new Set(['tap', 'back', 'screen', 'toggle_on', 'toggle_off', 'coin_small', 'exp', 'combo_end', 'streak_tick', 'confetti', 'paper', 'party_check', 'text_blip_1', 'text_blip_2', 'text_blip_3']);
const SFX = ['start', 'tap', 'back', 'screen', 'toggle_on', 'toggle_off', 'check_1', 'check_2', 'check_3', 'check_4', 'check_5', 'check_6', 'uncheck', 'coin', 'coin_small',
  'combo_3', 'combo_5', 'level', 'badge', 'claim', 'pug_1', 'pug_2', 'roar', 'hit_1', 'hit_2', 'hit_3', 'photo', 'boss_defeat', 'fanfare', 'party_join', 'error'].map(n => 'sfx_' + n);
let ext = null;
const pickExt = () => ext || (ext = document.createElement('audio').canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3');
export function setMuted(value) {
  muted = !!value;
  if (master) master.gain.setValueAtTime(muted ? 0 : 0.65, ctx.currentTime);
  updateLoop();
}
function ac() {
  if (!ctx) {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    try {
      ctx = new Audio();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.65;
      master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.45; musicBus.connect(master);
    } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
function load(name) {
  if (buffers[name] || failed[name] || !ac()) return Promise.resolve(buffers[name]);
  return loading[name] || (loading[name] = fetch(BASE + name + '.' + pickExt())
    .then(r => { if (!r.ok) throw new Error(name + ' ' + r.status); return r.arrayBuffer(); })
    .then(data => new Promise((ok, bad) => ctx.decodeAudioData(data, ok, bad)))
    .then(buffer => (buffers[name] = buffer))
    .catch(() => { failed[name] = true; }));
}
// Play a decoded file, else run the synth fallback. QUIET effects are as loud as the others
// in the pack (see VERIFY.md), so they play 6 dB down.
function play(name, fallback) {
  if (!ctx || muted) return; // nothing before the first user gesture (unlock)
  const audio = ac();
  const buffer = buffers['sfx_' + name];
  if (!buffer) { load('sfx_' + name); if (fallback) fallback(); return; }
  played[name] = (played[name] || 0) + 1;
  const src = audio.createBufferSource(), gain = audio.createGain();
  src.buffer = buffer; gain.gain.value = QUIET.has(name) ? 0.5 : 1;
  src.connect(gain).connect(sfxBus); src.start();
  src.onended = () => { src.disconnect(); gain.disconnect(); };
}
const pick = list => list[Math.floor(Math.random() * list.length)];
function tone(freq, delay = 0, duration = 0.09, type = 'square', volume = 0.07) {
  const audio = ac();
  if (!audio || muted) return;
  const osc = audio.createOscillator(), gain = audio.createGain();
  const time = audio.currentTime + delay;
  osc.type = type; osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  osc.connect(gain).connect(sfxBus);
  osc.start(time); osc.stop(time + duration + 0.02);
  osc.onended = () => { osc.disconnect(); gain.disconnect(); };
}
const seq = (notes, step = 0.08, type = 'square', volume = 0.07) =>
  notes.forEach((freq, i) => freq && tone(freq, i * step, step * 0.9, type, volume));
const SONGS = {
  store: [523,659,784,659,587,698,880,698,659,784,1047,784,587,698,784,0],
  boss: [220,0,220,330,233,0,233,349,196,0,196,294,208,311,233,0],
};
// Music: one sample-accurate looping buffer per scene on a quieter bus. Stops while muted,
// switched off or hidden. Falls back to the synth loop if a track cannot be loaded.
const TRACKS = { title: 'title', list: 'store', store: 'store', boss: 'boss', rewards: 'victory' };
let loop = null;
function stopLoop() {
  if (!loop) return;
  const { src, gain } = loop, t = ctx.currentTime; loop = null;
  gain.gain.setTargetAtTime(0, t, 0.08);
  src.onended = () => { src.disconnect(); gain.disconnect(); };
  try { src.stop(t + 0.4); } catch {}
}
function synthLoop() {
  const notes = SONGS[scene === 'boss' ? 'boss' : 'store'];
  const tick = () => {
    if (muted || ctx.state !== 'running') return;
    const index = beat++ % notes.length;
    if (notes[index]) tone(notes[index], 0, 0.13, 'triangle', 0.035);
    if (index % 4 === 0) tone(scene === 'boss' ? 110 : 131, 0, 0.18, 'triangle', 0.025);
  };
  timer = setInterval(tick, scene === 'boss' ? 155 : 220);
  tick();
}
function updateLoop() {
  clearInterval(timer); timer = null;
  const want = music && !muted && ctx && !document.hidden ? 'bgm_' + scene : null;
  if (loop && loop.name !== want) stopLoop();
  if (!want || loop) return;
  if (failed[want]) { synthLoop(); return; }
  if (!buffers[want]) { load(want).then(updateLoop); return; }
  const src = ctx.createBufferSource(), gain = ctx.createGain(), t = ctx.currentTime;
  src.buffer = buffers[want]; src.loop = true;
  gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(1, t + 0.3);
  src.connect(gain).connect(musicBus); src.start(t);
  loop = { name: want, src, gain };
}
export function setMusic(value) { music = !!value; updateLoop(); }
export function setScene(value) {
  const next = TRACKS[value];
  if (next && next !== scene) { scene = next; beat = 0; updateLoop(); }
}
document.addEventListener('visibilitychange', updateLoop);
let preloaded = false;
export const unlock = () => {
  if (ac() && !preloaded) { preloaded = true; SFX.forEach(load); }
  updateLoop();
};
const synth = {
  start: () => seq([392,523,659,784,1047], 0.08),
  check: (combo = 1) => seq([660 + combo * 35, 990 + combo * 45], 0.055),
  uncheck: () => seq([440,330,220], 0.06, 'triangle'),
  coin: () => seq([988,1319], 0.06),
  combo: (tier = 3) => seq(tier >= 5 ? [523,659,784,1047,1319] : [523,659,784,1047], 0.055),
  level: () => seq([523,659,784,1047,784,1047,1319], 0.09),
  badge: () => seq([784,988,1175,1568], 0.1, 'triangle'),
  roar: () => seq([110,98,87,73], 0.12, 'sawtooth', 0.035),
  hit: () => seq([200,120,80], 0.04, 'sawtooth', 0.04),
  fanfare: () => seq([523,523,523,659,0,587,659,0,784,784,1047], 0.11),
  pug_bark: () => { tone(170,0,0.07,'triangle',0.06); tone(120,0.08,0.09,'triangle',0.04); },
};
export const sfx = {
  start: () => play('start', synth.start),
  check: (combo = 1) => play('check_' + Math.max(1, Math.min(combo, 6)), () => synth.check(combo)),
  uncheck: () => play('uncheck', synth.uncheck),
  coin: () => play('coin', synth.coin),
  combo: (tier = 3) => play(tier >= 5 ? 'combo_5' : 'combo_3', () => synth.combo(tier)),
  level: () => play('level', synth.level),
  badge: () => play('badge', synth.badge),
  roar: () => play('roar', synth.roar),
  hit: () => play(pick(['hit_1', 'hit_2', 'hit_3']), synth.hit),
  fanfare: () => play('fanfare', synth.fanfare),
  pug_bark: () => play(pick(['pug_1', 'pug_2']), synth.pug_bark),
  // File-only cues (silent until loaded): small UI and event sounds.
  tap: () => play('tap'), back: () => play('back'), screen: () => play('screen'),
  toggle: on => play(on ? 'toggle_on' : 'toggle_off'), coin_small: () => play('coin_small'),
  claim: () => play('claim', synth.badge), photo: () => play('photo'), boss_defeat: () => play('boss_defeat'),
  party_join: () => play('party_join'), error: () => play('error'),
  bgm_store: () => { setScene('store'); setMusic(true); },
  bgm_boss: () => { setScene('boss'); setMusic(true); },
};
window.__audio = { decoded: () => Object.keys(buffers), failed: () => Object.keys(failed), ext: () => ext, state: () => ctx?.state, played: () => ({ ...played }), music: () => loop?.name || (timer ? 'synth' : null) };
