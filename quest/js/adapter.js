// Adapter: window.FOOD (root ../data.js) -> store-neutral trip object.
// Only reads groups/items, store and week. Never reads the note or other root-page fields.
export const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
// Without a readable "Mon D" in the week text, use the local Sunday of this week so the
// trip ID stays stable for the whole week instead of changing at UTC midnight.
function thisWeek(now) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0, 10);
}
export function isoFromWeek(week, now = new Date()) {
  const m = /([A-Za-z]{3})[a-z]*\s+(\d{1,2})/.exec(week || '');
  const mi = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
  if (mi < 0) return thisWeek(now);
  // Pick the year that puts the date closest to today (Dec list opened in Jan, and vice versa).
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const d = [-1, 0, 1].map(y => Date.UTC(now.getFullYear() + y, mi, +m[2]))
    .sort((a, b) => Math.abs(a - today) - Math.abs(b - today))[0];
  return new Date(d).toISOString().slice(0, 10);
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
