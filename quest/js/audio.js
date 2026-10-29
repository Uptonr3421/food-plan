// Tiny WebAudio chiptune synth. No audio files.
let ctx = null, muted = false;
export const setMuted = v => { muted = v; };
function ac() { if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); } if (ctx.state === 'suspended') ctx.resume(); return ctx; }
function tone(freq, start, dur, type = 'square', vol = 0.08) {
  const a = ac(); if (!a || muted) return;
  const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = freq;
  const t = a.currentTime + start; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
const seq = (notes, step = 0.08, type) => notes.forEach((f, i) => f && tone(f, i * step, step * 1.1, type));
export const sfx = {
  check: combo => seq([660 + combo * 40, 990 + combo * 60]),
  uncheck: () => seq([440, 330], 0.07, 'triangle'),
  coin: () => seq([988, 1319], 0.06),
  combo: () => seq([523, 659, 784, 1047], 0.06),
  level: () => seq([523, 659, 784, 1047, 784, 1047, 1319], 0.09),
  badge: () => seq([784, 988, 1175, 1568], 0.1, 'triangle'),
  roar: () => { seq([110, 98, 87, 73], 0.12, 'sawtooth'); },
  hit: () => seq([200, 120], 0.05, 'sawtooth'),
  fanfare: () => seq([523, 523, 523, 659, 0, 587, 659, 0, 784, 784, 1047], 0.11),
  start: () => seq([392, 523, 659, 784], 0.08),
};
export const unlock = () => ac();
