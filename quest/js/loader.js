// Loads the trip (?trip=<file> from trips/, or today's ../data.js), its theme, and the asset manifest.
import { tripFromFood, slug } from './adapter.js';
const SAFE = /^[a-z0-9][a-z0-9._-]*\.json$/i;
async function getJSON(url) { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); }
function loadScript(src) {
  return new Promise((ok, bad) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => bad(new Error('load ' + src)); document.head.appendChild(s); });
}
export async function loadTrip(params = new URLSearchParams(location.search)) {
  const file = params.get('trip');
  if (file) {
    if (!SAFE.test(file)) throw new Error('Bad trip file name');
    const t = await getJSON('trips/' + file);
    t.id = t.id || slug(file.replace(/\.json$/, '')); t.source = 'trips/' + file;
    (t.sections || []).forEach(s => { s.kind = s.kind || s.id; });
    return t;
  }
  if (!window.FOOD) await loadScript('../data.js');
  return tripFromFood(window.FOOD);
}
export async function loadTheme(id) {
  const base = await getJSON('themes/default.json');
  if (!id || id === 'default') return base;
  try { const t = await getJSON('themes/' + slug(id) + '.json'); return { ...base, ...t, colors: { ...base.colors, ...t.colors }, sectionDefaults: { ...base.sectionDefaults, ...t.sectionDefaults } }; }
  catch { return base; }
}
export async function loadArt() {
  const map = {};
  const manifest = await getJSON('assets/ASSET-MANIFEST.json');
  manifest.assets.forEach(s => {
    if (['done', 'in_review'].includes(s.status)) map[s.id] = s.file;
  });
  map.portrait_cart = map.portrait_cart_hero;
  map.portrait_scroll = map.portrait_scroll_hero;
  return map;
}
export function sectionLabel(sec, theme) {
  return (theme.sectionNames && theme.sectionNames[sec.id]) || sec.name;
}
export function sectionFlavor(sec, theme) {
  return (theme.sectionDefaults && theme.sectionDefaults[sec.kind]) || '';
}
