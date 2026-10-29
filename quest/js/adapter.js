// Adapter: window.FOOD (root ../data.js) -> store-neutral trip object.
// Only reads groups/items, store and week. Never reads the note or other root-page fields.
export const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
function isoFromWeek(week, now = new Date()) {
  const m = /([A-Za-z]{3})[a-z]*\s+(\d{1,2})/.exec(week || '');
  if (!m) return now.toISOString().slice(0, 10);
  const mi = MONTHS.indexOf(m[1].toLowerCase()); if (mi < 0) return now.toISOString().slice(0, 10);
  const d = new Date(Date.UTC(now.getUTCFullYear(), mi, +m[2]));
  return d.toISOString().slice(0, 10);
}
function kindOf(name) {
  const n = name.toLowerCase();
  if (/produce|fruit|veg|green/.test(n)) return 'produce';
  if (/frozen/.test(n)) return 'frozen';
  if (/drink|beverage/.test(n)) return 'drinks';
  if (/gabe|protein|meat/.test(n)) return 'protein';
  return 'staples';
}
const BADGE = { produce: 'Produce Ranger', protein: 'Protein Paladin' };
export function splitName(n) {
  const i = n.indexOf(', ');
  return i < 0 ? { name: n, amount: '' } : { name: n.slice(0, i), amount: n.slice(i + 2) };
}
export function tripFromFood(F) {
  const store = F.store || 'Store';
  const sections = [], items = [];
  (F.groups || []).forEach(g => {
    const id = slug(g.name), kind = kindOf(g.name);
    sections.push({ id, name: g.name, icon: g.icon || '🛒', kind, badge: BADGE[kind] || null });
    (g.items || []).forEach((it, i) => {
      const { name, amount } = splitName(it.n);
      const item = { id: `${id}-${i + 1}`, name, amount, section: id };
      if (it.image) item.image = it.image;
      items.push(item);
    });
  });
  const date = isoFromWeek(F.week);
  return { id: `${slug(store)}-${date}`, title: F.week || 'This week', store, theme: slug(store), date, source: 'data.js', sections, items };
}
