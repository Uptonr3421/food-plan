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
  constructor(topic, tripId, clientId, onEvent, onStatus) { Object.assign(this, { topic, tripId, clientId, onEvent, onStatus }); this.lastId = 'all'; this.seen = new Set(); }
  async start() {
    this.onStatus('connecting');
    try {
      const r = await fetch(`${HOST}/${this.topic}/json?poll=1&since=all`);
      const txt = await r.text();
      txt.split('\n').filter(Boolean).forEach(l => { try { this.handle(JSON.parse(l)); } catch {} });
    } catch { this.onStatus('offline'); }
    this.listen();
  }
  listen() {
    if (!window.EventSource) return;
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
    const body = JSON.stringify({ ...ev, trip: this.tripId, by: this.clientId, ts: Date.now() });
    try { await fetch(`${HOST}/${this.topic}`, { method: 'POST', body }); return true; } catch { this.onStatus('offline'); return false; }
  }
  stop() { this.es && this.es.close(); }
}
