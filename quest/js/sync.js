// Optional party sync over ntfy.sh. Topic lives in the URL hash (#party=<topic>).
// Only item check/uncheck/reset events are sent. Receipts and photos are NEVER sent.
const HOST = 'https://ntfy.sh';
export function newTopic() {
  const a = new Uint8Array(12); crypto.getRandomValues(a);
  return 'hsq-' + Array.from(a, b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
}
export function topicFromHash() { const m = /party=([A-Za-z0-9_-]{8,64})/.exec(location.hash); return m ? m[1] : null; }
export function partyLink(topic) { return location.origin + location.pathname + location.search + '#party=' + topic; }
export class Party {
  constructor(topic, tripId, clientId, onEvent, onStatus) { Object.assign(this, { topic, tripId, clientId, onEvent, onStatus }); this.lastId = 'all'; this.seen = new Set(); this.stopped = false; }
  async start() {
    this.onStatus('connecting');
    try {
      const r = await fetch(`${HOST}/${this.topic}/json?poll=1&since=all`);
      if (!r.ok) throw new Error('Party history unavailable');
      const txt = await r.text();
      txt.split('\n').filter(Boolean).forEach(l => { try { this.handle(JSON.parse(l)); } catch {} });
    } catch { this.onStatus('offline'); }
    if (!this.stopped) this.listen();
  }
  listen() {
    if (this.stopped) return;
    if (!window.EventSource) { this.onStatus('offline'); return; }
    this.es && this.es.close();
    this.es = new EventSource(`${HOST}/${this.topic}/sse?since=${encodeURIComponent(this.lastId)}`);
    this.es.onopen = () => this.onStatus('synced');
    this.es.onmessage = e => { try { this.handle(JSON.parse(e.data)); } catch {} };
    this.es.onerror = () => this.onStatus('reconnecting');
  }
  handle(msg) {
    if (!msg || msg.event !== 'message' || this.seen.has(msg.id)) return;
    this.seen.add(msg.id); this.lastId = msg.id;
    let ev; try { ev = JSON.parse(msg.message); } catch { return; }
    if (!ev || ev.trip !== this.tripId) return;
    this.onEvent(ev, ev.by === this.clientId);
  }
  async send(ev) {
    if (this.stopped || !['check', 'uncheck', 'reset'].includes(ev?.t)) return false;
    if (ev.t !== 'reset' && (typeof ev.id !== 'string' || !ev.id || ev.id.length > 200)) return false;
    const message = { t: ev.t, trip: this.tripId, by: this.clientId, ts: Date.now() };
    if (ev.t !== 'reset') message.id = ev.id;
    if (ev.t === 'check' && Number.isInteger(ev.award?.xp) && ev.award.xp >= 10 && ev.award.xp <= 20 && [1, 2].includes(ev.award.coins)) message.award = { xp: ev.award.xp, coins: ev.award.coins };
    try { const r = await fetch(`${HOST}/${this.topic}`, { method: 'POST', body: JSON.stringify(message) }); if (!r.ok) throw new Error('Party event rejected'); return true; } catch { if (!this.stopped) this.onStatus('offline'); return false; }
  }
  stop() { this.stopped = true; this.es && this.es.close(); }
}
