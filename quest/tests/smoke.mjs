// Bounded browser checks: node quest/tests/smoke.mjs [questURL]
// Playwright is a test-only dependency. There is no app framework or build step.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
let pw;
for (const name of ['playwright', process.env.HSQ_PLAYWRIGHT_PATH,
  resolve(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean)) {
  try { pw = require(name); break; } catch {}
}
if (!pw) throw Error('Install Playwright for tests or set HSQ_PLAYWRIGHT_PATH.');
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json',
  '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2' };
let server, browser;
const deadline = setTimeout(() => { console.error('FAIL smoke exceeded 120 seconds'); process.exit(1); }, 120000);
deadline.unref();
const pass = s => console.log('PASS ' + s);
try {
  let base = process.argv[2];
  if (!base) {
    server = createServer(async (req, res) => {
      try {
        let file = resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
        if (file !== ROOT && !file.startsWith(ROOT + sep)) { res.writeHead(403).end(); return; }
        if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
        res.writeHead(200, { 'Content-Type':MIME[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-cache' });
        res.end(await readFile(file));
      } catch { console.error('HTTP 404 ' + req.url); res.writeHead(404).end('Not found'); }
    });
    await new Promise(ok => server.listen(0, '127.0.0.1', ok));
    base = 'http://127.0.0.1:' + server.address().port + '/quest/';
  }
  const chrome = [process.env.HSQ_CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => p && existsSync(p));
  browser = await pw.chromium.launch({ headless:true, ...(chrome ? {executablePath:chrome} : {}), timeout:15000 });
  const sandbox = { window:{} };
  vm.runInNewContext(await readFile(resolve(ROOT, 'data.js'), 'utf8'), sandbox, {timeout:1000});
  const expected = JSON.parse(JSON.stringify(sandbox.window.FOOD.groups.flatMap(g => g.items.map(it => {
    const split = it.n.indexOf(', ');
    return { name:split < 0 ? it.n : it.n.slice(0, split), amount:split < 0 ? '' : it.n.slice(split + 2) };
  }))));
  const errors = [];
  const context = await browser.newContext({viewport:{width:412, height:915}, reducedMotion:'reduce'});
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
  for (const query of ['', '?trip=aldi-week-of-oct-29.json', '?trip=template.json']) {
    await page.goto(base + query, {waitUntil:'networkidle', timeout:20000});
    await page.waitForFunction(() => !!window.__quest);
    const actual = await page.evaluate(() => window.__quest.trip.items.map(({name,amount}) => ({name, amount:amount || ''})));
    assert(actual.length > 0);
    assert.equal(await page.locator('.item').count(), actual.length);
    if (!query) assert.deepEqual(actual, expected, 'Preserve every food entry, amount, duplicate and order');
    if (!query && actual.some(item => item.name === 'Large eggs')) {
      const egg = page.locator('.item').filter({has: page.locator('.nm', {hasText: 'Large eggs'})});
      assert.match(await egg.locator('.thumb img').getAttribute('src'), /food_eggs\.png$/);
    }
    assert(!/\$|\b(?:medication|health|prescription)\b/i.test(await page.locator('body').innerText()));
    // The named trip may share its ID with the adapter, so its saved run can resume.
    if (!await page.locator('#start').isVisible()) await page.locator('#titlebtn').click();
    await page.locator('#start').click();
    if (!query && actual.some(item => item.name === 'Large eggs')) {
      const image = page.locator('.item').filter({has: page.locator('.nm', {hasText: 'Large eggs'})}).locator('.thumb img');
      await image.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => { const image = [...document.querySelectorAll('.item')].find(row => row.querySelector('.nm')?.textContent === 'Large eggs')?.querySelector('img'); return image?.complete && image.naturalWidth === 64; });
      pass('current food names use matching available item art');
    }
    if (await page.locator('.item').first().getAttribute('aria-pressed') === 'true') await page.locator('.item').first().click();
    await page.locator('.item').first().click();
    await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(() => !!window.__quest);
    assert.equal(await page.locator('.item').first().getAttribute('aria-pressed'), 'true');
    assert(await page.locator('#screen-list').isVisible());
    pass((query || 'data.js') + ': items, tap and saved progress');
    if (!query) {
      await page.evaluate(() => {
        Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } });
        window.EventSource = class { close() {} };
        const original = window.fetch;
        window.fetch = (url, options) => String(url).startsWith('https://ntfy.sh/')
          ? Promise.resolve(new Response('', { status: 200 })) : original(url, options);
      });
      await page.locator('#sharebtn2').click();
      assert.match(await page.locator('#sharemsg2').innerText(), /^Copy this party link: .*#party=hsq-/);
      pass('party link remains visible when clipboard access fails');
      await page.locator('.item').nth(1).click();
      await page.locator('.item').nth(2).click();
      assert.match(await page.locator('#combo').innerText(), /COMBO/);
      const count = await page.locator('.item').count();
      for (let i=0; i<count; i++) {
        const row = page.locator('.item').nth(i);
        if (await row.getAttribute('aria-pressed') !== 'true') await row.click();
      }
      for (const name of ['Protein Paladin','Produce Ranger','Fabulous Forager']) {
        assert.equal(await page.locator('#badges .badge').filter({hasText:name}).evaluate(el => el.classList.contains('locked')), false);
      }
      // Reload split this run into two chains; the full-trip combo must remain locked.
      assert(await page.locator('#badges .badge').filter({hasText:'Perfect Combo'}).evaluate(el => el.classList.contains('locked')));
      assert.notEqual(await page.locator('#lvl').innerText(), 'LV 1');
      pass('combo, level and badges');
      if (!await page.locator('#screen-boss').isVisible()) await page.locator('#bossbtn').click();
      await page.locator('#receiptin').setInputFiles({name:'synthetic-receipt.png',mimeType:'image/png',
        buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZ1kAAAAASUVORK5CYII=','base64')});
      await page.locator('#screen-rewards').waitFor({state:'visible'});
      assert(await page.locator('#receiptimg').evaluate(i => i.complete && i.naturalWidth > 0));
      await page.locator('#claim').click();
      await page.locator('#rewardsback').click();
      await page.locator('#pastbtn2').click();
      assert.equal(await page.locator('.past').count(), 1);
      await page.evaluate(async () => {
        const id = JSON.parse(localStorage.getItem('hsq:history'))[0].receiptId;
        const db = await new Promise((ok, bad) => { const r = indexedDB.open('hsq-receipts', 1); r.onsuccess = () => ok(r.result); r.onerror = () => bad(r.error); });
        await new Promise((ok, bad) => {
          const tx = db.transaction('receipts', 'readwrite'), store = tx.objectStore('receipts'), request = store.get(id);
          request.onsuccess = () => store.put({ ...request.result, store: 'Test Market' });
          tx.oncomplete = ok; tx.onerror = () => bad(tx.error);
        });
        db.close();
      });
      // Reload the log so it reads the updated synthetic receipt from IndexedDB.
      await page.locator('#pastback').click(); await page.locator('#pastbtn2').click();
      await page.locator('.past[role="button"]').click();
      await page.evaluate(() => {
        Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
        Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { window.__sharedReceipt = data; } });
      });
      await page.locator('#sendjudas').click();
      assert.match(await page.evaluate(() => window.__sharedReceipt.text), /^Test Market receipt,/);
      pass('reopened receipt shares its original store');
      pass('boss, synthetic receipt, rewards and history');
    }
  }
  for (const width of [320,768,1280]) {
    await page.setViewportSize({width,height:900});
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No overflow at ' + width);
  }
  pass('320, 768 and 1280px layouts');
  // Simulate a completed theme asset without changing the real asset manifest.
  await page.route('**/assets/ASSET-MANIFEST.json', async route => {
    const response = await route.fetch(), manifest = await response.json();
    const aldi = manifest.assets.find(asset => asset.id === 'bg_store_aldi');
    aldi.status = 'in_review'; aldi.file = 'assets/final/characters/portrait_pug.png';
    await route.fulfill({ response, json: manifest });
  });
  await page.goto(base + '?trip=aldi-week-of-oct-29.json', { waitUntil:'networkidle' });
  await page.waitForFunction(() => !!window.__quest);
  assert.match(await page.evaluate(() => getComputedStyle(document.body).backgroundImage), /portrait_pug\.png/);
  await page.unroute('**/assets/ASSET-MANIFEST.json');
  pass('store theme uses its manifest background when available');
  await page.goto(new URL('../',base).href,{waitUntil:'networkidle'});
  assert.equal(await page.locator('#list .item').count(),expected.length);
  pass('root food page');
  assert.deepEqual(errors,[],'Browser errors');
  pass('no console errors');
} finally {
  clearTimeout(deadline);
  await browser?.close();
  if(server) await new Promise(ok => server.close(ok));
}

// Exercise the optional transport without a real receipt or network service.
const { Party } = await import('../js/sync.js');
const savedFetch = globalThis.fetch;
try {
  let sent, status;
  globalThis.fetch = async (_url, options) => { sent = JSON.parse(options.body); return { ok: true }; };
  const party = new Party('test-topic', 'trip', 'client', () => {}, s => { status = s; });
  assert.equal(await party.send({ t: 'check', id: 'item', award: { xp: 14, coins: 1 }, receipt: 'private', blob: 'private' }), true);
  assert.deepEqual(Object.keys(sent).sort(), ['award', 'by', 'id', 't', 'trip', 'ts']);
  globalThis.fetch = async () => ({ ok: false, status: 429 });
  assert.equal(await party.send({ t: 'uncheck', id: 'item' }), false);
  assert.equal(status, 'offline');
  party.stop();
  assert.equal(await party.send({ t: 'reset' }), false);
  pass('party transport rejects server errors and excludes receipt fields');
} finally { globalThis.fetch = savedFetch; }
