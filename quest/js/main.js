// Heroic Shopping Quest: UI + game loop. Vanilla ES modules, no build step.
import { loadTrip, loadTheme, loadArt, sectionLabel, sectionFlavor } from './loader.js';
import { progress, settings, history, clientId } from './storage.js';
import { sfx, setMuted, setMusic, setScene, unlock } from './audio.js';
import { pop, coinTrail, confetti, shake } from './fx.js';
import { Party, newTopic, topicFromHash, partyLink } from './sync.js';
import { saveReceipt, getReceipt, downscale, shareReceipt, downloadBlob } from './receipt.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const XP_PER_ITEM = 10, XP_PER_LEVEL = 60;
const TITLES = ['Cart Squire', 'Aisle Scout', 'Shelf Knight', 'Basket Baron', 'Grocery Hero', 'Loot Legend', 'Fabulous Monarch of the List'];
const QUIPS = ['Woof! Nice grab!', 'Snort snort, loot acquired!', 'That one goes in the bag of holding!', 'You two are a power couple of shopping!', 'Bork! Critical hit on that shelf!', 'My tail is wagging at max speed!', 'Treasure! Do I smell snacks?', 'Slay, hero. Slay.', 'Party morale: fabulous.'];
const COMBO_QUIPS = ['COMBO! You are on fire!', 'Unstoppable! Rainbow streak!', 'Combo chain! The aisle trembles!'];
const COMBO_WINDOW = 12000;

let trip, theme, art, P, party = null, lastCheck = 0, combo = 0, receipt = null;
let receiptUrl = null, receiptBusy = false, comboClock = null;
const pastUrls = [];
const sectionsById = {};

function applyTheme(t) {
  const r = document.documentElement.style;
  Object.entries(t.colors || {}).forEach(([k, v]) => r.setProperty('--' + k, v));
  const img = art['bg_store_' + t.id] || art.bg_store_generic;
  r.setProperty('--scene', img ? `linear-gradient(rgba(20,10,40,.55),rgba(20,10,40,.8)),url("${new URL(img, document.baseURI).href}")` : t.background);
}
const sprite = name => art[name] || art.loot_bag || '';
function show(name) {
  setScene(name); sfx.screen();
  document.querySelectorAll('.screen').forEach(s => s.hidden = s.id !== 'screen-' + name);
  if (name === 'title' && P) $('start').textContent = P.started ? 'Continue Quest' : 'Start Dungeon Run';
  $('hud').hidden = !(name === 'list' || name === 'boss');
  window.scrollTo(0, 0);
}
function save() { progress.save(trip.id, P); }
const checkedCount = () => trip.items.filter(i => P.checked[i.id]).length;
const level = () => Math.floor(P.xp / XP_PER_LEVEL) + 1;

function renderHud() {
  const n = checkedCount(), N = trip.items.length, lv = level();
  $('lvl').textContent = 'LV ' + lv;
  $('lvltitle').textContent = TITLES[Math.min(lv - 1, TITLES.length - 1)];
  const pct = N ? Math.round(n / N * 100) : 0;
  $('xpfill').style.width = pct + '%';
  $('xpfill').style.setProperty('--full', pct ? (10000 / pct) + '%' : '100%');
  $('questcount').textContent = `Quest ${n}/${N}`;
  if (art.coin) $('coins').innerHTML = `<i class="coin-ic" aria-hidden="true"></i> ${P.coins}`;
  else $('coins').textContent = '🪙 ' + P.coins;
  $('combo').textContent = combo > 1 ? `x${combo} COMBO` : '';
  $('bossbtn').classList.toggle('ready', n === N);
}
function renderCombo() {
  const remaining = Math.max(0, COMBO_WINDOW - (Date.now() - lastCheck));
  if (!remaining) { combo = 0; clearInterval(comboClock); comboClock = null; }
  $('combo').textContent = combo > 1 ? `x${combo} COMBO` : '';
  $('combometer').hidden = !combo;
  $('comboring').style.setProperty('--remaining', (remaining / COMBO_WINDOW * 360) + 'deg');
  $('streakfill').style.width = (remaining / COMBO_WINDOW * 100) + '%';
}
function thumb(item, sec) {
  const name = item.name.toLowerCase();
  const aliases = [
    [/^(large |medium |extra.large |organic |brown )?eggs$/, 'food_eggs'], [/\bground turkey\b/, 'food_93__lean_ground_turkey'],
    [/\bbacon\b/, 'food_bacon'], [/\bhummus\b/, 'food_classic_hummus'],
    [/^(whole |2% |1% )?milk$/, 'food_milk'], [/\bpeanut butter\b/, 'food_extra_peanut_butter_jar'],
    [/\benergy drinks?\b/, 'food_summit_energy_drinks'], [/\bmicrowave rice cups\b/, 'food_microwave_rice_cups'],
  ];
  const food = art['food_' + name.replace(/[^a-z0-9]/g, '_')] || art[aliases.find(([pattern]) => pattern.test(name))?.[1]];
  const image = item.image || food;
  return `<span class="thumb" data-fallback="${esc(food || '')}" data-icon="${esc(sec.icon || '🛒')}">${image ? `<img src="${esc(image)}" alt="" loading="lazy" width="64" height="64">` : esc(sec.icon || '🛒')}</span>`;
}
function renderList() {
  const focused = document.activeElement?.dataset.id;
  const html = trip.sections.map(sec => {
    const items = trip.items.filter(i => i.section === sec.id);
    if (!items.length) return '';
    const done = items.filter(i => P.checked[i.id]).length;
    return `<div class="section-head"><span class="ic">${esc(sec.icon || '🛒')}</span><b>${esc(sectionLabel(sec, theme))}<span class="flavor">${esc(sectionFlavor(sec, theme))}</span></b><span class="cnt" data-cnt="${esc(sec.id)}">${done}/${items.length}</span></div>` +
      items.map(it => `<button class="item ${P.checked[it.id] ? 'done' : ''}" data-id="${esc(it.id)}" aria-pressed="${!!P.checked[it.id]}">${thumb(it, sec)}<span class="txt"><span class="nm">${esc(it.name)}</span>${it.amount ? `<span class="amt">${esc(it.amount)}</span>` : ''}</span><span class="box"></span></button>`).join('');
  }).join('');
  $('sections').innerHTML = html;
  $('sections').querySelectorAll('.thumb img').forEach(img => {
    img.onerror = () => {
      const holder = img.parentElement;
      if (holder.dataset.fallback && !img.dataset.retried) { img.dataset.retried = 'true'; img.src = holder.dataset.fallback; }
      else holder.textContent = holder.dataset.icon;
    };
  });
  if (focused) [...$('sections').querySelectorAll('.item')].find(b => b.dataset.id === focused)?.focus({ preventScroll: true });
  renderBadges($('badges'));
  renderHud();
}
function allBadges() {
  const list = trip.sections.filter(s => s.badge).map(s => ({ name: s.badge, section: s.id }));
  if (!list.some(b => b.name === 'Fabulous Forager')) list.push({ name: 'Fabulous Forager', section: null });
  list.push({ name: 'Speed Runner', rule: 'speed' }, { name: 'Steady Hands', rule: 'no-uncheck' }, { name: 'Perfect Combo', rule: 'combo' });
  return list;
}
function badgeIcon(name) {
  const img = art['badge_' + String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_')];
  return img ? `<img src="${esc(img)}" alt="" width="32" height="32">` : '🏅';
}
function renderBadges(el) {
  el.innerHTML = allBadges().map(b => `<span class="badge ${P.badges.includes(b.name) ? '' : 'locked'}">${badgeIcon(b.name)} ${esc(b.name)}</span>`).join('');
}
function quip(text) {
  $('quip').textContent = text;
  $('pugimg').classList.remove('wag');
  void $('pugimg').offsetWidth;
  $('pugimg').classList.add('wag');
  sfx.pug_bark();
}
function checkBadges(x, y) {
  for (const b of allBadges()) {
    if (P.badges.includes(b.name)) continue;
    const items = b.section ? trip.items.filter(i => i.section === b.section) : trip.items;
    const finished = checkedCount() === trip.items.length;
    const extra = !b.rule || (finished && (b.rule === 'speed' ? Date.now() - P.startedAt <= 20 * 60 * 1000 : b.rule === 'no-uncheck' ? P.unchecks === 0 : P.bestCombo >= trip.items.length));
    if (extra && items.length && items.every(i => P.checked[i.id])) {
      P.badges.push(b.name); sfx.badge(); pop(x, y - 40, '🏅 ' + b.name, 'big'); confetti(b.section ? 50 : 160);
      quip(b.name === 'Fabulous Forager' ? 'Every item looted! Fabulous Forager! Now face the Receipt Dragon!' : `Badge unlocked: ${b.name}! So proud of you!`);
    }
  }
}
function setItem(id, on, { local = true, award = null, x = innerWidth / 2, y = innerHeight / 2 } = {}) {
  if (!trip.items.some(i => i.id === id)) return;
  if (!!P.checked[id] === on) return;
  const before = level();
  if (on) {
    P.checked[id] = Date.now();
    if (local) {
      const now = Date.now(); combo = now - lastCheck < COMBO_WINDOW ? combo + 1 : 1; lastCheck = now;
      P.bestCombo = Math.max(P.bestCombo, combo);
      const bonus = combo > 1 ? Math.min(combo, 5) * 2 : 0;
      P.xp += XP_PER_ITEM + bonus; P.coins += 1 + (combo > 2 ? 1 : 0);
      P.awards[id] = { xp: XP_PER_ITEM + bonus, coins: 1 + (combo > 2 ? 1 : 0) };
      if (!comboClock) comboClock = setInterval(renderCombo, 100);
      renderCombo();
      sfx.check(Math.min(combo, 6)); setTimeout(sfx.coin, 120);
      pop(x, y, `+${XP_PER_ITEM + bonus} EXP`); coinTrail(x, y, 6 + Math.min(combo, 6));
      if (combo > 2) { sfx.combo(combo); pop(x, y - 30, `x${combo} COMBO!`, 'big'); quip(COMBO_QUIPS[combo % COMBO_QUIPS.length]); }
      else quip(QUIPS[Math.floor(Math.random() * QUIPS.length)]);
    } else {
      const reward = { xp: Number.isInteger(award?.xp) && award.xp >= 10 && award.xp <= 20 ? award.xp : 10, coins: award?.coins === 2 ? 2 : 1 };
      P.awards[id] = reward; P.xp += reward.xp; P.coins += reward.coins;
    }
  } else {
    const reward = P.awards[id] || { xp: XP_PER_ITEM, coins: 1 };
    delete P.checked[id]; delete P.awards[id];
    P.xp = Math.max(0, P.xp - reward.xp); P.coins = Math.max(0, P.coins - reward.coins); P.unchecks++;
    if (local) { sfx.uncheck(); combo = 0; quip('Put it back? No worries, hero.'); }
    renderCombo();
  }
  if (level() > before) { sfx.level(); pop(innerWidth / 2, 140, `LEVEL UP! ${TITLES[Math.min(level() - 1, TITLES.length - 1)]}`, 'big'); }
  checkBadges(x, y);
  save(); renderList();
  if (local && party) party.send({ t: on ? 'check' : 'uncheck', id, ...(on ? { award: P.awards[id] } : {}) });
  if (local && on && checkedCount() === trip.items.length) openBoss();
}
function onListClick(e) {
  const b = e.target.closest('.item'); if (!b) return;
  unlock(); const r = b.getBoundingClientRect();
  setItem(b.dataset.id, !P.checked[b.dataset.id], { x: r.left + r.width / 2, y: r.top + r.height / 2 });
}

// ---- party sync (optional) ----
function syncStatus(s) {
  const el = $('sync'); el.hidden = false;
  el.textContent = s === 'synced' ? '● Party connected' : s === 'offline' ? '○ Party unavailable' : '◌ Connecting';
  el.classList.toggle('warn', s !== 'synced');
}
const peers = new Set();
function startParty(topic) {
  if (party) party.stop();
  party = new Party(topic, trip.id, clientId, (ev, mine) => {
    if (mine) return;
    if (ev.by && !peers.has(ev.by)) { peers.add(ev.by); sfx.party_join(); }
    if (ev.t === 'check' && ev.id) setItem(ev.id, true, { local: false, award: ev.award });
    else if (ev.t === 'uncheck' && ev.id) setItem(ev.id, false, { local: false });
    else if (ev.t === 'reset') { resetQuest(false); }
  }, syncStatus);
  party.start();
}
async function shareParty() {
  let topic = topicFromHash();
  if (!topic) { topic = newTopic(); window.history.replaceState(null, '', '#party=' + topic); startParty(topic); }
  const link = partyLink(topic), msg = $('screen-title').hidden ? $('sharemsg2') : $('sharemsg');
  try {
    if (navigator.share) await navigator.share({ title: 'Heroic Shopping Quest', text: 'Join my shopping party!', url: link });
    else { await navigator.clipboard.writeText(link); msg.textContent = 'Party link copied!'; }
  } catch (err) { msg.textContent = err?.name === 'AbortError' ? '' : `Copy this party link: ${link}`; }
  // After a share, also publish current state so the friend catches up.
  Object.keys(P.checked).forEach(id => party.send({ t: 'check', id, award: P.awards[id] }));
}

// ---- boss + rewards ----
const pause = ms => new Promise(ok => setTimeout(ok, ms));
const DRAGON_QUIPS = { 75: 'Rawr! My receipt is longer than your list!', 50: 'You forgot the coupons, heroes!', 25: 'No... not the self-checkout!' };
const ATTACKS = [['bosscart', 'dash'], ['bossscroll', 'zap'], ['bosspug', 'pounce']];
let bossHp = 100, bossDown = null, bossTurn = 0, lastHit = 0, dragonQuipTimer = 0;
const bossQuipped = new Set();
// Restart a one-shot CSS class so repeated taps replay the animation.
function flick(el, cls, ms) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); clearTimeout(el['_' + cls]); el['_' + cls] = setTimeout(() => el.classList.remove(cls), ms); }
function dragonSay(text) {
  const q = $('dragonquip'); q.textContent = text; q.hidden = false;
  clearTimeout(dragonQuipTimer); dragonQuipTimer = setTimeout(() => { q.hidden = true; }, 2000);
}
function setHp(hp) { bossHp = Math.max(0, Math.round(hp)); $('hp').style.width = bossHp + '%'; $('hplag').style.width = bossHp + '%'; }
function openBoss() {
  show('boss'); bossDown = null; bossTurn = 0; bossQuipped.clear(); setHp(100);
  $('dragon').classList.remove('defeated', 'hit', 'dying');
  $('receiptlabel').classList.remove('ready'); $('receiptmsg').textContent = '';
  $('bosshint').textContent = 'Tap the dragon to attack!';
  sfx.roar(); quip('A wild Receipt Dragon appears!'); dragonSay('ROAR! Who dares check out?');
}
// One hit: flash, shake, damage number, HP chunk, quips at 75/50/25%. Returns the defeat promise on the final blow.
function hitDragon(dmg, x, y, crit = false) {
  const before = bossHp;
  sfx.hit(); flick($('dragon'), 'hit', 180); shake(crit ? document.body : document.querySelector('.arena'));
  pop(x + Math.random() * 40 - 20, y, crit ? `CRIT ${dmg}!` : String(dmg), crit ? 'dmg crit' : 'dmg');
  setHp(bossHp - dmg);
  for (const t of [75, 50, 25]) if (before > t && bossHp <= t && bossHp > 0 && !bossQuipped.has(t)) { bossQuipped.add(t); dragonSay(DRAGON_QUIPS[t]); if (t === 50) setTimeout(sfx.roar, 200); }
  return bossHp ? null : defeatDragon();
}
function attack(e) {
  if (bossDown || receiptBusy) return;
  const now = Date.now(); if (now - lastHit < 140) return; lastHit = now;
  unlock();
  const [id, move] = ATTACKS[bossTurn++ % ATTACKS.length];
  if (!$(id).hidden) flick($(id), move, 500);
  const r = $('dragon').getBoundingClientRect(), crit = Math.random() < 0.18;
  const x = e && e.clientX ? e.clientX : r.left + r.width / 2, y = e && e.clientY ? e.clientY : r.top + r.height / 3;
  hitDragon((crit ? 2 : 1) * (10 + Math.floor(Math.random() * 5)), x, y, crit);
}
function defeatDragon() {
  if (bossDown) return bossDown;
  return (bossDown = (async () => {
    const d = $('dragon'); d.classList.remove('hit'); d.classList.add('dying');
    dragonSay('Nooo... my coupons...!'); sfx.boss_defeat(); shake(document.body);
    await pause(700);
    d.classList.remove('dying'); d.classList.add('defeated'); $('dragonquip').hidden = true;
    const r = d.getBoundingClientRect();
    setScene('rewards'); setTimeout(sfx.fanfare, 400);
    confetti(160); coinTrail(r.left + r.width / 2, r.top + r.height / 2, 18); pop(innerWidth / 2, r.top + 40, 'VICTORY!', 'big');
    ['bosscart', 'bossscroll', 'bosspug'].forEach(id => flick($(id), 'cheer', 1800));
    quip('We did it! Snap the receipt to claim the loot!');
    $('bosshint').textContent = 'Victory! Snap the receipt to claim your loot!';
    $('receiptlabel').classList.add('ready');
  })());
}
async function onReceipt(e) {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  if (receiptBusy) return;
  receiptBusy = true; e.target.disabled = true; $('bossback').disabled = true;
  $('receiptmsg').textContent = 'Preparing your receipt...';
  sfx.photo();
  try {
    const blob = await downscale(f, 1200);
    const id = trip.id + '-' + Date.now();
    receipt = { id, tripId: trip.id, title: trip.title, store: trip.store, date: new Date().toISOString(), count: checkedCount(), total: trip.items.length, xp: P.xp, level: level(), badges: [...P.badges], blob };
    try { await saveReceipt(receipt); receipt.stored = true; }
    catch { receipt.stored = false; }
    $('receiptmsg').textContent = '';
    if (!bossDown) {
      // The receipt is a finishing move: a quick three-hit combo from wherever the HP is.
      const r = $('dragon').getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 3;
      for (let i = 0; i < 3 && bossHp > 0; i++) {
        flick($(ATTACKS[i][0]), ATTACKS[i][1], 500);
        const down = hitDragon(i === 2 ? bossHp : Math.ceil(bossHp / 2), x, y, i === 2);
        await (down || pause(260));
      }
      await pause(900);
    } else { await bossDown; await pause(300); }
    showRewards();
  } catch {
    sfx.error(); $('receiptmsg').textContent = 'That image could not be opened. Try another photo.';
  } finally {
    receiptBusy = false; e.target.disabled = false; $('bossback').disabled = false; e.target.value = '';
  }
}
function showRewards() {
  show('rewards');
  if (receiptUrl) URL.revokeObjectURL(receiptUrl);
  receiptUrl = URL.createObjectURL(receipt.blob); $('receiptimg').src = receiptUrl;
  const d = new Date(receipt.date);
  $('rewardinfo').textContent = `${receipt.store} · ${d.toLocaleDateString()} · ${receipt.count}/${receipt.total} items looted · ${receipt.xp || 0} XP · LV ${receipt.level || 1}`;
  $('rewardbadges').innerHTML = (receipt.badges || []).map(name => `<span class="badge">${badgeIcon(name)} ${esc(name)}</span>`).join('');
  $('mail').href = `mailto:onew100110@gmail.com?subject=${encodeURIComponent(receipt.store + ' receipt')}`;
  $('sendmsg').textContent = receipt.stored === false ? 'This photo could not be saved here. Download it before leaving this screen.' : '';
  const claimed = history.list().some(q => q.id === receipt.id);
  $('claim').disabled = claimed; $('claim').textContent = claimed ? 'Rewards claimed!' : 'Claim Rewards';
  confetti(120);
}
const receiptName = () => `receipt-${(receipt.store || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${receipt.date.slice(0, 10)}.${receipt.blob.type === 'image/png' ? 'png' : 'jpg'}`;
async function sendJudas() {
  const r = await shareReceipt(receipt.blob, receiptName(), `${receipt.store} receipt, ${receipt.date.slice(0, 10)}`);
  $('sendmsg').textContent = r === 'shared' ? 'Share sheet completed. Check your chosen app to finish sending.' : r === 'cancelled' ? '' : 'Use Download, then attach the photo to your text or email.';
}
function claim() {
  if (!receipt) return;
  history.add({ id: receipt.id, tripId: receipt.tripId, title: receipt.title, store: receipt.store, date: receipt.date, checked: receipt.count, total: receipt.total, xp: receipt.xp, level: receipt.level, badges: receipt.badges, receiptId: receipt.stored === false ? null : receipt.id });
  sfx.claim(); confetti(80); $('claim').textContent = 'Rewards claimed!'; $('claim').disabled = true;
}
async function showPast() {
  show('past');
  pastUrls.splice(0).forEach(url => URL.revokeObjectURL(url));
  const h = history.list();
  if (!h.length) { $('pastlist').innerHTML = '<p class="center small">No past quests yet. Go loot something!</p>'; return; }
  $('pastlist').innerHTML = h.map(q => `<div class="past panel" data-r="${esc(q.receiptId || '')}"><img alt=""${sprite('loot_bag') ? ` src="${esc(sprite('loot_bag'))}"` : ''} hidden><div><b>${esc(q.store)} · ${esc(new Date(q.date).toLocaleDateString())}</b><br><span class="small">${q.checked}/${q.total} items · LV ${q.level} · ${esc((q.badges || []).join(', ') || 'no badges')}</span></div></div>`).join('');
  for (const el of document.querySelectorAll('.past[data-r]')) {
    if (!el.dataset.r) continue;
    try {
      const rec = await getReceipt(el.dataset.r);
      if (rec && rec.blob) {
        const url = URL.createObjectURL(rec.blob); pastUrls.push(url); el.querySelector('img').src = url; el.querySelector('img').hidden = false;
        el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-label', `Open ${rec.store} receipt`);
        el.onclick = () => { receipt = { ...rec, stored: true }; showRewards(); };
        el.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); el.click(); } };
      }
    } catch {}
  }
}
function resetQuest(local = true) {
  if (local && !confirm('Start a New Quest? This clears the checks for this trip on this phone.')) return;
  P = { checked: {}, awards: {}, xp: 0, coins: 0, bestCombo: 0, badges: [], unchecks: 0, startedAt: Date.now(), started: true }; combo = 0; lastCheck = 0; receipt = null;
  renderCombo(); if (receiptUrl) URL.revokeObjectURL(receiptUrl); receiptUrl = null;
  $('claim').disabled = false; $('claim').textContent = 'Claim Rewards';
  save(); renderList(); quip('Fresh quest! Let\'s go, heroes!');
  if (local && party) party.send({ t: 'reset' });
}

// ---- boot ----
async function boot() {
  try { trip = await loadTrip(); }
  catch (err) { document.getElementById('tripinfo').textContent = 'Could not load the trip: ' + err.message; return; }
  [theme, art] = await Promise.all([loadTheme(trip.theme), loadArt()]);
  trip.sections.forEach(s => sectionsById[s.id] = s);
  P = progress.load(trip.id);
  P.awards = P.awards || {}; P.unchecks = P.unchecks || 0; P.startedAt = P.startedAt || Date.now();
  applyTheme(theme);
  // Keep the sticky pug and quip below the sticky HUD, whose height changes with the combo meter.
  if (window.ResizeObserver) new ResizeObserver(([e]) => { if (e.target.offsetHeight) document.documentElement.style.setProperty('--hudh', (e.target.offsetHeight + 8) + 'px'); }).observe($('hud'));
  [['checkbox', 'art-checkbox'], ['coin', 'art-coin']].forEach(([key, cls]) => {
    if (!art[key]) return;
    document.documentElement.style.setProperty('--' + key, `url("${new URL(art[key], document.baseURI).href}")`);
    document.body.classList.add(cls);
  });
  if (art.pride_banner) document.querySelector('#screen-rewards .pride')?.insertAdjacentHTML('beforebegin', `<img class="pride-art" src="${esc(art.pride_banner)}" alt="" width="128">`);
  if (art.title_banner) { $('banner').classList.add('art'); $('banner').innerHTML = `<img src="${art.title_banner}" alt="Heroic Shopping Quest - Level up your groceries">`; }
  $('party').innerHTML = [['portrait_cart', 'hero_cart', 'Gabe'], ['portrait_scroll', 'hero_scroll', 'Owen'], ['portrait_pug', 'hero_pug', 'Pug']]
    .map(([c, f, n]) => `<figure><img src="${sprite(c, f)}" alt="${n}"><figcaption>${n}</figcaption></figure>`).join('');
  $('pugimg').src = sprite('portrait_pug');
  if (art.receipt_dragon) $('dragon').style.backgroundImage = `url("${art.receipt_dragon}")`;
  else $('dragon').classList.add('noart');
  [['cartbody','hero_cart_full'],['scrollbody','hero_scroll_full'],['pugbody','pug_full'],['bosscart','hero_cart_full'],['bossscroll','hero_scroll_full'],['bosspug','pug_full']].forEach(([id,key]) => {
    if (art[key]) $(id).style.backgroundImage = `url("${art[key]}")`;
    else $(id).hidden = true;
  });
  $('tripinfo').textContent = `${trip.store} · ${trip.title} · ${trip.items.length} items`;
  const m = settings.muted(); setMuted(m); $('mute').classList.toggle('off', m);
  $('mute').setAttribute('aria-pressed', String(m));
  const music = settings.music(); setMusic(music); $('music').setAttribute('aria-pressed', String(music));
  renderList();

  $('start').onclick = () => { unlock(); sfx.start(); if (!P.started) P.startedAt = Date.now(); P.started = true; save(); show('list'); };
  $('titlebtn').onclick = () => show('title');
  $('sections').addEventListener('click', onListClick);
  // Button sounds: any tap unlocks audio; back buttons tick down, others tick (items, start,
  // toggles and claim have their own sounds).
  document.addEventListener('click', e => {
    const b = e.target.closest('button, .btn'); if (!b) return;
    unlock();
    if (b.matches('.item, #start, #music, #mute, #claim, #dragon')) return;
    if (['bossback', 'rewardsback', 'pastback', 'titlebtn'].includes(b.id)) sfx.back(); else sfx.tap();
  }, true);
  $('mute').onclick = () => { const v = !settings.muted(); if (v) sfx.toggle(false); settings.setMuted(v); setMuted(v); if (!v) sfx.toggle(true); $('mute').classList.toggle('off', v); $('mute').setAttribute('aria-pressed', String(v)); $('mute').setAttribute('aria-label', v ? 'Unmute sound' : 'Mute sound'); };
  $('music').onclick = () => { const v = !settings.music(); settings.setMusic(v); unlock(); setMusic(v); sfx.toggle(v); $('music').setAttribute('aria-pressed', String(v)); $('music').setAttribute('aria-label', v ? 'Disable background music' : 'Enable background music'); };
  $('bossbtn').onclick = openBoss; $('dragon').onclick = attack; $('bossback').onclick = () => show('list'); $('rewardsback').onclick = () => show('list');
  $('receiptin').addEventListener('change', onReceipt);
  $('sendjudas').onclick = sendJudas; $('dl').onclick = () => receipt && downloadBlob(receipt.blob, receiptName());
  $('claim').onclick = claim;
  $('pastbtn').onclick = $('pastbtn2').onclick = showPast; $('pastback').onclick = () => show(P.started ? 'list' : 'title');
  $('newquest').onclick = () => resetQuest(true);
  $('sharebtn').onclick = $('sharebtn2').onclick = shareParty;
  const topic = topicFromHash(); if (topic) startParty(topic);
  window.addEventListener('hashchange', () => { const t = topicFromHash(); if (t && (!party || party.topic !== t)) startParty(t); });
  // Always open on the title screen; it stays until the player taps Start or Continue.
  show('title');
  startTitleMoves();
  window.__quest = { trip, theme, art, boss: () => ({ hp: bossHp, down: !!bossDown }) };
}
// Title screen: every few seconds a random adventurer does a move: cheer, Gabe's cart dash,
// Owen's point or spin, Max's flip or zoomies (CSS under 'random title moves').
const TITLE_MOVES = { cartbody: ['cheer', 'dash', 'dash'], scrollbody: ['cheer', 'point', 'spin'], pugbody: ['cheer', 'flip', 'zoom'] };
function startTitleMoves() {
  const actors = ['cartbody', 'scrollbody', 'pugbody'].map($).filter(a => a && !a.hidden);
  if (!actors.length) return;
  let last = null;
  const tick = () => {
    if (!$('screen-title').hidden && !document.hidden) {
      const pool = actors.length > 1 ? actors.filter(a => a !== last) : actors;
      const a = pool[Math.floor(Math.random() * pool.length)]; last = a;
      const kinds = TITLE_MOVES[a.id] || ['cheer'], kind = kinds[Math.floor(Math.random() * kinds.length)];
      a.classList.add('move', kind);
      setTimeout(() => a.classList.remove('move', kind), 1300);
    }
    setTimeout(tick, 2200 + Math.random() * 1800);
  };
  setTimeout(tick, 1200);
}
boot();
