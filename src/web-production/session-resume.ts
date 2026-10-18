const ENTRY = 'xandeflix.web.resume.v1';
const DATABASE = 'xandeflix.web-auth.v1';
const TOKEN = /^xw1_[0-9a-f]{64}$/;
const MAX_AGE = 900_000;
// Capture before the authenticated customer installs its storage namespace.
const original = (() => {
  try { return { storage: window.sessionStorage, database: window.indexedDB }; }
  catch { return undefined; }
})();
let generation = 0;

function validKey(value: CryptoKey | undefined): value is CryptoKey {
  return !!value && value.type === 'secret' && value.extractable === false && value.algorithm?.name === 'AES-GCM'
    && Array.isArray(value.usages) && value.usages.includes('encrypt') && value.usages.includes('decrypt');
}
async function encryptionKey(create: boolean): Promise<CryptoKey> {
  if (!original?.database || !crypto?.subtle) throw new Error('WEB_RESUME_UNAVAILABLE');
  const candidate = create ? await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']) : undefined;
  return new Promise((resolve, reject) => {
    let done = false, db: IDBDatabase | undefined;
    const finish = (key?: CryptoKey) => {
      if (done) return; done = true; clearTimeout(timer); db?.close();
      if (validKey(key)) resolve(key); else reject(new Error('WEB_RESUME_UNAVAILABLE'));
    };
    const timer = setTimeout(() => finish(), 1500);
    let request: IDBOpenDBRequest;
    try { request = original.database.open(DATABASE, 1); } catch { finish(); return; }
    request.onerror = () => finish(); request.onblocked = () => finish();
    request.onupgradeneeded = () => {
      if (done) { request.transaction?.abort(); return; }
      if (!request.result.objectStoreNames.contains('keys')) request.result.createObjectStore('keys');
    };
    request.onsuccess = () => {
      db = request.result;
      if (done) { db.close(); return; }
      try {
        const transaction = db.transaction('keys', create ? 'readwrite' : 'readonly'), store = transaction.objectStore('keys');
        let selected: CryptoKey | undefined;
        transaction.onerror = () => finish(); transaction.onabort = () => finish(); transaction.oncomplete = () => finish(selected);
        const read = store.get('key');
        read.onsuccess = () => {
          selected = read.result;
          if (!selected && candidate) { selected = candidate; store.add(candidate, 'key'); }
        };
      } catch { finish(); }
    };
  });
}
const encode = (value: Uint8Array) => btoa(String.fromCharCode(...value));
function decode(value: unknown, bytes: number): Uint8Array {
  if (typeof value !== 'string' || value.length !== Math.ceil(bytes / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new Error('WEB_RESUME_INVALID');
  const result = Uint8Array.from(atob(value), ch => ch.charCodeAt(0));
  if (result.byteLength !== bytes) throw new Error('WEB_RESUME_INVALID');
  return result;
}
const aad = (expires: number) => new TextEncoder().encode(ENTRY + ':' + expires);

export function clearWebSessionResume(): void {
  generation++;
  try { original?.storage.removeItem(ENTRY); } catch { /* Never fall back to another store. */ }
}

/** Store only an encrypted short-lived delegated proof, never login factors or context. */
export async function rememberWebSession(token: string, ttlSeconds: number, absoluteTtlSeconds: number): Promise<boolean> {
  const attempt = generation;
  try {
    if (!original?.storage || !TOKEN.test(token) || !Number.isFinite(ttlSeconds) || !Number.isFinite(absoluteTtlSeconds)
        || ttlSeconds <= 0 || absoluteTtlSeconds <= 0) return false;
    const expires = Date.now() + Math.min(MAX_AGE, ttlSeconds * 1000, absoluteTtlSeconds * 1000);
    const key = await encryptionKey(true), iv = crypto.getRandomValues(new Uint8Array(12));
    const body = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(expires) }, key, new TextEncoder().encode(token));
    if (attempt !== generation) return false;
    const encoded = JSON.stringify({ version: 1, expires, iv: encode(iv), body: encode(new Uint8Array(body)) });
    original.storage.setItem(ENTRY, encoded);
    if (original.storage.getItem(ENTRY) !== encoded) throw new Error('WEB_RESUME_UNAVAILABLE');
    return true;
  } catch { if (attempt === generation) clearWebSessionResume(); return false; }
}

/** Decryption is not authorization: the caller must revalidate with the server. */
export async function takeWebSessionForReload(): Promise<string | undefined> {
  const attempt = generation;
  try {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type !== 'reload') { clearWebSessionResume(); return; }
    const text = original?.storage.getItem(ENTRY);
    if (!text) return;
    if (text.length > 400) throw new Error('WEB_RESUME_INVALID');
    const record = JSON.parse(text);
    if (!record || Object.keys(record).sort().join(',') !== 'body,expires,iv,version' || record.version !== 1
      || !Number.isSafeInteger(record.expires) || record.expires <= Date.now() || record.expires > Date.now() + MAX_AGE) throw new Error('WEB_RESUME_INVALID');
    const iv = decode(record.iv, 12), body = decode(record.body, 84), key = await encryptionKey(false);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: aad(record.expires) }, key, body);
    const token = new TextDecoder('utf-8', { fatal: true }).decode(plain);
    if (!TOKEN.test(token)) throw new Error('WEB_RESUME_INVALID');
    return attempt === generation ? token : undefined;
  } catch { if (attempt === generation) clearWebSessionResume(); return undefined; }
}
