// Small WebAudio synth. All loops are opt-in and start after a user gesture.
let ctx, master, muted = false, music = false, scene = 'store', timer, beat = 0;
export function setMuted(value) {
  muted = !!value;
  if (master) master.gain.setValueAtTime(muted ? 0 : 0.65, ctx.currentTime);
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
    } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
function tone(freq, delay = 0, duration = 0.09, type = 'square', volume = 0.07) {
  const audio = ac();
  if (!audio || muted) return;
  const osc = audio.createOscillator(), gain = audio.createGain();
  const time = audio.currentTime + delay;
  osc.type = type; osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  osc.connect(gain).connect(master);
  osc.start(time); osc.stop(time + duration + 0.02);
  osc.onended = () => { osc.disconnect(); gain.disconnect(); };
}
const seq = (notes, step = 0.08, type = 'square', volume = 0.07) =>
  notes.forEach((freq, i) => freq && tone(freq, i * step, step * 0.9, type, volume));
const SONGS = {
  store: [523,659,784,659,587,698,880,698,659,784,1047,784,587,698,784,0],
  boss: [220,0,220,330,233,0,233,349,196,0,196,294,208,311,233,0],
};
function updateLoop() {
  clearInterval(timer); timer = null;
  if (!music || !ctx || document.hidden) return;
  const tick = () => {
    if (muted || ctx.state !== 'running') return;
    const notes = SONGS[scene], index = beat++ % notes.length;
    if (notes[index]) tone(notes[index], 0, 0.13, 'triangle', 0.035);
    if (index % 4 === 0) tone(scene === 'boss' ? 110 : 131, 0, 0.18, 'triangle', 0.025);
  };
  timer = setInterval(tick, scene === 'boss' ? 155 : 220);
  tick();
}
export function setMusic(value) { music = !!value; updateLoop(); }
export function setScene(value) {
  const next = value === 'boss' ? 'boss' : 'store';
  if (next !== scene) { scene = next; beat = 0; updateLoop(); }
}
document.addEventListener('visibilitychange', updateLoop);
export const unlock = () => { ac(); updateLoop(); };
export const sfx = {
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
  bgm_store: () => { setScene('store'); setMusic(true); },
  bgm_boss: () => { setScene('boss'); setMusic(true); },
};
