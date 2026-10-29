// Receipt photo: downscale to ~1200px, keep ONLY on this device (IndexedDB). Never uploaded or synced.
const DB = 'hsq-receipts', ST = 'receipts';
function db() {
  return new Promise((ok, bad) => {
    if (!window.indexedDB) return bad(new Error('no idb'));
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ST, { keyPath: 'id' });
    r.onsuccess = () => ok(r.result); r.onerror = () => bad(r.error);
  });
}
async function tx(mode, fn) { const d = await db(); return new Promise((ok, bad) => { const t = d.transaction(ST, mode); const req = fn(t.objectStore(ST)); t.oncomplete = () => ok(req && req.result); t.onerror = () => bad(t.error); }); }
export const saveReceipt = rec => tx('readwrite', s => s.put(rec));
export const getReceipt = id => tx('readonly', s => s.get(id));
export async function downscale(file, max = 1200) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await new Promise(ok => c.toBlob(b => ok(b || file), 'image/jpeg', 0.82));
  } catch { return file; } finally { URL.revokeObjectURL(url); }
}
export async function shareReceipt(blob, name, text) {
  const file = new File([blob], name, { type: blob.type || 'image/jpeg' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Receipt', text }); return 'shared'; }
    catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  }
  return 'unsupported';
}
export function downloadBlob(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
