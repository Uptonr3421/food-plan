// Device-only persistence: progress, settings and past quests in localStorage.
const K = 'hsq:';
const get = (k, d) => { try { const v = localStorage.getItem(K + k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const set = (k, v) => { try { localStorage.setItem(K + k, JSON.stringify(v)); } catch {} };
export const progress = {
  load: tripId => get('progress:' + tripId, { checked: {}, xp: 0, coins: 0, bestCombo: 0, badges: [], started: false }),
  save: (tripId, p) => set('progress:' + tripId, p),
  clear: tripId => { try { localStorage.removeItem(K + 'progress:' + tripId); } catch {} },
};
export const settings = {
  muted: () => get('muted', false), setMuted: v => set('muted', !!v),
  music: () => get('music', true), setMusic: v => set('music', !!v),
};
export const history = {
  list: () => get('history', []),
  add: entry => { const h = get('history', []).filter(q => q.id !== entry.id); h.unshift(entry); set('history', h.slice(0, 50)); },
};
export const clientId = (() => { let id = get('client', null); if (!id) { id = Math.random().toString(36).slice(2, 10); set('client', id); } return id; })();
