// Visual effects: floating pops, rainbow coin trails, confetti, screen shake.
export const RAINBOW = ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'];
const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
export function pop(x, y, text, cls = '') {
  const el = document.createElement('div'); el.className = 'pop ' + cls; el.textContent = text;
  el.style.left = x + 'px'; el.style.top = y + 'px'; document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
export function coinTrail(x, y, n = 6) {
  if (reduce()) return;
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div'); c.className = 'coin-fly';
    c.style.left = x + 'px'; c.style.top = y + 'px'; c.style.setProperty('--c', RAINBOW[i % 6]);
    c.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px'); c.style.setProperty('--dy', (-60 - Math.random() * 80) + 'px');
    c.style.animationDelay = (i * 30) + 'ms'; document.body.appendChild(c); setTimeout(() => c.remove(), 1100);
  }
}
let cv, cx, parts = [], raf = 0;
export function confetti(n = 120) {
  if (reduce()) return;
  if (!cv) { cv = document.createElement('canvas'); cv.className = 'confetti'; document.body.appendChild(cv); cx = cv.getContext('2d'); }
  cv.width = innerWidth; cv.height = innerHeight;
  for (let i = 0; i < n; i++) parts.push({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.5, vx: Math.random() * 2 - 1, vy: 2 + Math.random() * 3, s: 4 + (Math.random() * 4 | 0), c: RAINBOW[i % 6], life: 240 });
  if (!raf) tick();
}
function tick() {
  cx.clearRect(0, 0, cv.width, cv.height);
  parts = parts.filter(p => (p.life-- > 0 && p.y < cv.height + 20));
  for (const p of parts) { p.x += p.vx; p.y += p.vy; cx.fillStyle = p.c; cx.fillRect(p.x | 0, p.y | 0, p.s, p.s); }
  raf = parts.length ? requestAnimationFrame(tick) : (cx.clearRect(0, 0, cv.width, cv.height), 0);
}
export function shake(el = document.body) { if (reduce()) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 600); }
