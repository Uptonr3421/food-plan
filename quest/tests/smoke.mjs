// Headless smoke test via Chrome DevTools Protocol (no npm deps; Node 22+ and google-chrome).
// Usage: (cd food-list && python3 -m http.server 8765 &) ; node quest/tests/smoke.mjs [baseUrl]
import { spawn } from 'node:child_process'; import fs from 'node:fs';
const BASE = process.argv[2] || 'http://localhost:8765/quest/';
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=9333', '--window-size=412,915', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, n = 0; const pending = {}, errors = [];
for (let i = 0; i < 40 && !ws; i++) { try { const t = await (await fetch('http://127.0.0.1:9333/json/list')).json(); const pg = t.find(x => x.type === 'page'); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); } catch {} await sleep(250); }
await new Promise(r => ws.onopen = r);
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending[m.id]) { pending[m.id](m.result); delete pending[m.id]; }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value || a.description).join(' ')); };
const send = (method, params = {}) => new Promise(r => { const id = ++n; pending[id] = r; ws.send(JSON.stringify({ id, method, params })); });
const ev = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
const shot = async f => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(f, Buffer.from(r.data, 'base64')); };
await send('Runtime.enable'); await send('Page.enable');
let fail = 0; const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) fail++; };
for (const q of ['', '?trip=aldi-week-of-oct-29.json', '?trip=template.json']) {
  await send('Page.navigate', { url: BASE + q }); await sleep(2500);
  await ev('localStorage.clear()'); await send('Page.reload'); await sleep(2500);
  const items = await ev('document.querySelectorAll(".item").length');
  ok(items > 0, `${q || 'data.js'}: ${items} items render`);
  if (q === '') {
    ok(items === 43, 'data.js trip has all 43 items');
    await shot('/tmp/hsq-title.png');
    await ev('document.getElementById("start").click()'); await sleep(300);
    await ev('[...document.querySelectorAll(".item")].slice(0,10).forEach(b=>b.click())'); await sleep(500);
    ok(await ev('document.querySelectorAll(".item.done").length') === 10, 'tap checks items');
    ok(/Quest 10\/43/.test(await ev('document.getElementById("questcount").textContent')), 'Quest x/N counter');
    ok((await ev('document.getElementById("badges").textContent')).includes('Protein Paladin'), 'badges shown');
    ok(await ev('!document.querySelector(".badge.locked")?.textContent.includes("Protein Paladin")'), 'Protein Paladin unlocked after Gabe section');
    await shot('/tmp/hsq-list.png');
    await send('Page.reload'); await sleep(2500);
    ok(await ev('document.querySelectorAll(".item.done").length') === 10, 'progress persists after reload');
    await ev('document.getElementById("bossbtn").click()'); await sleep(300); await shot('/tmp/hsq-boss.png');
    ok(await ev('!document.getElementById("screen-boss").hidden'), 'boss screen opens');
  }
}
const html = await ev('document.documentElement.outerHTML');
fs.writeFileSync('/tmp/hsq-rendered.html', html);
ok(errors.length === 0, 'no JS errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
ws.close(); chrome.kill(); process.exit(fail ? 1 : 0);
