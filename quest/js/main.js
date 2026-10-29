// Heroic Shopping Quest: UI + game loop. Vanilla ES modules, no build step.
import { loadTrip, loadTheme, loadArt, sectionLabel, sectionFlavor } from './loader.js';
import { progress, settings, history, clientId } from './storage.js';
import { sfx, setMuted, unlock } from './audio.js';
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
const sectionsById = {};

function applyTheme(t) {
  const r = document.documentElement.style;
  Object.entries(t.colors || {}).forEach(([k, v]) => r.setProperty('--' + k, v));
  const img = t.backgroundImage && art['bg_' + t.id] ? `url(${art['bg_' + t.id]}),` : '';
  r.setProperty('--scene', img ? `linear-gradient(rgba(20,10,40,.55),rgba(20,10,40,.8)),${img.slice(0, -1)}` : t.background);
}
const sprite = (concept, fallback) => art[concept] || 'assets/sprites/' + fallback + '.png';
function show(name) {
  document.querySelectorAll('.screen').forEach(s => s.hidden = s.id !== 'screen-' + name);
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
  $('coins').textContent = '🪙 ' + P.coins;
  $('combo').textContent = combo > 1 ? `x${combo} COMBO` : '';
  $('bossbtn').classList.toggle('ready', n === N);
}
function thumb(item, sec) {
  return `<span class="thumb">${item.image ? `<img src="${esc(item.image)}" alt="" loading="lazy">` : esc(sec.icon || '🛒')}</span>`;
}
function renderList() {
  const html = trip.sections.map(sec => {
    const items = trip.items.filter(i => i.section === sec.id);
    if (!items.length) return '';
    const done = items.filter(i => P.checked[i.id]).length;
    return `<div class="section-head"><span class="ic">${esc(sec.icon || '🛒')}</span><b>${esc(sectionLabel(sec, theme))}<span class="flavor">${esc(sectionFlavor(sec, theme))}</span></b><span class="cnt" data-cnt="${esc(sec.id)}">${done}/${items.length}</span></div>` +
      items.map(it => `<button class="item ${P.checked[it.id] ? 'done' : ''}" data-id="${esc(it.id)}" aria-pressed="${!!P.checked[it.id]}">${thumb(it, sec)}<span class="txt"><span class="nm">${esc(it.name)}</span>${it.amount ? `<span class="amt">${esc(it.amount)}</span>` : ''}</span><span class="box"></span></button>`).join('');
  }).join('');
  $('sections').innerHTML = html;
  renderBadges($('badges'));
  renderHud();
}
function allBadges() {
  const list = trip.sections.filter(s => s.badge).map(s => ({ name: s.badge, section: s.id }));
  if (!list.some(b => b.name === 'Fabulous Forager')) list.push({ name: 'Fabulous Forager', section: null });
  return list;
}
function renderBadges(el) {
  el.innerHTML = allBadges().map(b => `<span class="badge ${P.badges.includes(b.name) ? '' : 'locked'}">🏅 ${esc(b.name)}</span>`).join('');
}
function quip(text) { $('quip').textContent = text; }
function checkBadges(x, y) {
  for (const b of allBadges()) {
    if (P.badges.includes(b.name)) continue;
    const items = b.section ? trip.items.filter(i => i.section === b.section) : trip.items;
    if (items.length && items.every(i => P.checked[i.id])) {
      P.badges.push(b.name); sfx.badge(); pop(x, y - 40, '🏅 ' + b.name, 'big'); confetti(b.section ? 50 : 160);
      quip(b.section ? `Badge unlocked: ${b.name}! So proud of you!` : 'Every item looted! Fabulous Forager! Now face the Receipt Dragon!');
    }
  }
}
function setItem(id, on, { local = true, x = innerWidth / 2, y = innerHeight / 2 } = {}) {
  if (!!P.checked[id] === on) return;
  const before = level();
  if (on) {
    P.checked[id] = Date.now();
    if (local) {
      const now = Date.now(); combo = now - lastCheck < COMBO_WINDOW ? combo + 1 : 1; lastCheck = now;
      P.bestCombo = Math.max(P.bestCombo, combo);
      const bonus = combo > 1 ? Math.min(combo, 5) * 2 : 0;
      P.xp += XP_PER_ITEM + bonus; P.coins += 1 + (combo > 2 ? 1 : 0);
      sfx.check(Math.min(combo, 6)); setTimeout(sfx.coin, 120);
      pop(x, y, `+${XP_PER_ITEM + bonus} EXP`); coinTrail(x, y, 6 + Math.min(combo, 6));
      if (combo > 2) { sfx.combo(); pop(x, y - 30, `x${combo} COMBO!`, 'big'); quip(COMBO_QUIPS[combo % COMBO_QUIPS.length]); }
      else quip(QUIPS[Math.floor(Math.random() * QUIPS.length)]);
    } else { P.xp += XP_PER_ITEM; P.coins += 1; }
  } else {
    delete P.checked[id]; P.xp = Math.max(0, P.xp - XP_PER_ITEM);
    if (local) { sfx.uncheck(); combo = 0; quip('Put it back? No worries, hero.'); }
  }
  if (level() > before) { sfx.level(); pop(innerWidth / 2, 140, `LEVEL UP! ${TITLES[Math.min(level() - 1, TITLES.length - 1)]}`, 'big'); }
  checkBadges(x, y);
  save(); renderList();
  if (local && party) party.send({ t: on ? 'check' : 'uncheck', id });
}
function onListClick(e) {
  const b = e.target.closest('.item'); if (!b) return;
  unlock(); const r = b.getBoundingClientRect();
  setItem(b.dataset.id, !P.checked[b.dataset.id], { x: r.left + r.width / 2, y: r.top + r.height / 2 });
}

// ---- party sync (optional) ----
function syncStatus(s) {
  const el = $('sync'); el.hidden = false;
  el.textContent = s === 'synced' ? '● Party synced' : s === 'offline' ? '○ Offline' : '◌ Syncing';
  el.classList.toggle('warn', s !== 'synced');
}
function startParty(topic) {
  if (party) party.stop();
  party = new Party(topic, trip.id, clientId, (ev, mine) => {
    if (mine) return;
    if (ev.t === 'check' && ev.id) setItem(ev.id, true, { local: false });
    else if (ev.t === 'uncheck' && ev.id) setItem(ev.id, false, { local: false });
    else if (ev.t === 'reset') { resetQuest(false); }
  }, syncStatus);
  party.start();
}
async function shareParty() {
  let topic = topicFromHash();
  if (!topic) { topic = newTopic(); window.history.replaceState(null, '', '#party=' + topic); startParty(topic); }
  const link = partyLink(topic), msg = $('screen-title').hidden ? null : $('sharemsg');
  try {
    if (navigator.share) await navigator.share({ title: 'Heroic Shopping Quest', text: 'Join my shopping party!', url: link });
    else { await navigator.clipboard.writeText(link); if (msg) msg.textContent = 'Party link copied!'; }
  } catch { if (msg) msg.textContent = link; }
  // After a share, also publish current state so the friend catches up.
  Object.keys(P.checked).forEach(id => party.send({ t: 'check', id }));
}

// ---- boss + rewards ----
function openBoss() { show('boss'); $('hp').style.width = '100%'; $('dragon').classList.remove('defeated'); sfx.roar(); quip('A wild Receipt Dragon appears!'); }
async function onReceipt(e) {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  shake(); sfx.hit(); $('hp').style.width = '40%';
  const blob = await downscale(f, 1200);
  const id = trip.id + '-' + Date.now();
  receipt = { id, tripId: trip.id, store: trip.store, date: new Date().toISOString(), count: checkedCount(), total: trip.items.length, blob };
  try { await saveReceipt(receipt); } catch {}
  setTimeout(() => { $('hp').style.width = '0%'; $('dragon').classList.add('defeated'); shake(); sfx.fanfare(); confetti(200); }, 450);
  setTimeout(showRewards, 1600);
  e.target.value = '';
}
function showRewards() {
  show('rewards');
  $('receiptimg').src = URL.createObjectURL(receipt.blob);
  const d = new Date(receipt.date);
  $('rewardinfo').textContent = `${trip.store} · ${d.toLocaleDateString()} · ${receipt.count}/${receipt.total} items looted`;
  renderBadges($('rewardbadges'));
  $('mail').href = `mailto:onew100110@gmail.com?subject=${encodeURIComponent(trip.store + ' receipt')}`;
  confetti(120);
}
const receiptName = () => `receipt-${(trip.store || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${receipt.date.slice(0, 10)}.jpg`;
async function sendJudas() {
  const r = await shareReceipt(receipt.blob, receiptName(), `${trip.store} receipt, ${receipt.date.slice(0, 10)}`);
  $('sendmsg').textContent = r === 'shared' ? 'Sent! Quest complete.' : r === 'cancelled' ? '' : 'Sharing is not available here. Use Download, then text or email it.';
}
function claim() {
  history.add({ id: receipt ? receipt.id : trip.id + '-' + Date.now(), tripId: trip.id, title: trip.title, store: trip.store, date: new Date().toISOString(), checked: checkedCount(), total: trip.items.length, xp: P.xp, level: level(), badges: [...P.badges], receiptId: receipt ? receipt.id : null });
  sfx.badge(); confetti(80); $('claim').textContent = 'Rewards claimed!'; $('claim').disabled = true;
}
async function showPast() {
  show('past');
  const h = history.list();
  if (!h.length) { $('pastlist').innerHTML = '<p class="center small">No past quests yet. Go loot something!</p>'; return; }
  $('pastlist').innerHTML = h.map(q => `<div class="past panel" data-r="${esc(q.receiptId || '')}"><img alt="" src="${sprite('art_scroll', 'scroll')}"><div><b>${esc(q.store)} · ${esc(new Date(q.date).toLocaleDateString())}</b><br><span class="small">${q.checked}/${q.total} items · LV ${q.level} · ${esc((q.badges || []).join(', ') || 'no badges')}</span></div></div>`).join('');
  for (const el of document.querySelectorAll('.past[data-r]')) {
    if (!el.dataset.r) continue;
    try { const rec = await getReceipt(el.dataset.r); if (rec && rec.blob) el.querySelector('img').src = URL.createObjectURL(rec.blob); } catch {}
  }
}
function resetQuest(local = true) {
  if (local && !confirm('Start a New Quest? This clears the checks for this trip on this phone.')) return;
  P = { checked: {}, xp: 0, coins: 0, bestCombo: 0, badges: [], started: true }; combo = 0; receipt = null;
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
  applyTheme(theme);
  if (art.title_banner) { $('banner').classList.add('art'); $('banner').innerHTML = `<img src="${art.title_banner}" alt="Heroic Shopping Quest - Level up your groceries">`; }
  $('party').innerHTML = [['portrait_cart', 'hero_cart', 'Gabe'], ['portrait_scroll', 'hero_scroll', 'Owen'], ['portrait_pug', 'hero_pug', 'Pug']]
    .map(([c, f, n]) => `<figure><img src="${sprite(c, f)}" alt="${n}"><figcaption>${n}</figcaption></figure>`).join('');
  $('pugimg').src = sprite('portrait_pug', 'hero_pug');
  $('dragon').src = 'assets/sprites/receipt_dragon.png';
  $('tripinfo').textContent = `${trip.store} · ${trip.title} · ${trip.items.length} items`;
  const m = settings.muted(); setMuted(m); $('mute').classList.toggle('off', m);
  renderList();

  $('start').onclick = () => { unlock(); sfx.start(); P.started = true; save(); show('list'); };
  $('titlebtn').onclick = () => show('title');
  $('sections').addEventListener('click', onListClick);
  $('mute').onclick = () => { const v = !settings.muted(); settings.setMuted(v); setMuted(v); $('mute').classList.toggle('off', v); };
  $('bossbtn').onclick = openBoss; $('bossback').onclick = () => show('list'); $('rewardsback').onclick = () => show('list');
  $('receiptin').addEventListener('change', onReceipt);
  $('sendjudas').onclick = sendJudas; $('dl').onclick = () => receipt && downloadBlob(receipt.blob, receiptName());
  $('claim').onclick = claim;
  $('pastbtn').onclick = $('pastbtn2').onclick = showPast; $('pastback').onclick = () => show(P.started ? 'list' : 'title');
  $('newquest').onclick = () => resetQuest(true);
  $('sharebtn').onclick = $('sharebtn2').onclick = shareParty;
  const topic = topicFromHash(); if (topic) startParty(topic);
  window.addEventListener('hashchange', () => { const t = topicFromHash(); if (t && (!party || party.topic !== t)) startParty(t); });
  show(P.started ? 'list' : 'title');
  window.__quest = { trip, theme, art };
}
boot();
