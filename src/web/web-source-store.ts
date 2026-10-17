import { WebPlugin } from '@capacitor/core';
import { validateLocalSecureSourceRecord, validateLocalSourceId, type LocalSecureSourceRecord } from '../security/local-secure-source-store.ts';
import { requireSecureWebContext } from './validation.ts';
type Envelope = { version: 1; iv: Uint8Array; ciphertext: ArrayBuffer };

/** Local validation only. Secrets are encrypted at rest; no export or remote storage. */
export class WebSourceStore extends WebPlugin {
  private database?: Promise<IDBDatabase>;
  constructor(private readonly options: { name?: string; idb?: IDBFactory; crypto?: Crypto; requireSecure?: () => void } = {}) { super(); }
  private api() { (this.options.requireSecure || requireSecureWebContext)(); return this.options.crypto || crypto; }
  private db(): Promise<IDBDatabase> {
    this.api();
    return this.database ||= new Promise((resolve, reject) => {
      const request = (this.options.idb || indexedDB).open(this.options.name || 'xandeflix.web-source-validation.v1', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('vault');
      request.onerror = () => { this.database = undefined; reject(new Error('LOCAL_SOURCE_CONFIG_UNAVAILABLE')); };
      request.onblocked = () => { this.database = undefined; reject(new Error('LOCAL_SOURCE_CONFIG_UNAVAILABLE')); };
      request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); this.database = undefined; }; resolve(db); };
    });
  }
  private async read<T>(id: string): Promise<T | undefined> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('vault', 'readonly'), request = transaction.objectStore('vault').get(id);
      transaction.oncomplete = () => resolve(request.result as T | undefined);
      transaction.onabort = transaction.onerror = () => reject(new Error('LOCAL_SOURCE_CONFIG_UNAVAILABLE'));
    });
  }
  private async key(create: boolean): Promise<CryptoKey | undefined> {
    const api = this.api(), generated = create ? await api.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']) : undefined;
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('vault', 'readwrite'), store = tx.objectStore('vault'); let key: CryptoKey | undefined;
      const request = store.get('key');
      request.onsuccess = () => {
        key = request.result;
        if (key) { if (key.type !== 'secret' || key.extractable || key.algorithm.name !== 'AES-GCM' || !key.usages.includes('decrypt') || !key.usages.includes('encrypt')) tx.abort(); }
        else { const count = store.count(); count.onsuccess = () => { if (count.result) tx.abort(); else if (generated) { key = generated; store.add(key, 'key'); } }; }
      };
      tx.oncomplete = () => resolve(key);
      tx.onabort = tx.onerror = () => reject(new Error('LOCAL_SOURCE_CONFIG_UNAVAILABLE'));
    });
  }
  private async write(id: string, value?: Envelope): Promise<void> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('vault', 'readwrite'), store = tx.objectStore('vault');
      if (value) store.put(value, id); else store.delete(id);
      tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(new Error('LOCAL_SOURCE_CONFIG_WRITE_FAILED'));
    });
  }
  async securePut({ record }: { record: LocalSecureSourceRecord }) {
    validateLocalSecureSourceRecord(record);
    const api = this.api(), key = await this.key(true); if (!key) throw new Error('LOCAL_SOURCE_CONFIG_WRITE_FAILED');
    const text = JSON.stringify(record); if (text.length > 65536) throw new Error('INVALID_SOURCE_RECORD');
    const iv = api.getRandomValues(new Uint8Array(12)), additionalData = new TextEncoder().encode(record.sourceId);
    const ciphertext = await api.subtle.encrypt({ name: 'AES-GCM', iv, additionalData }, key, new TextEncoder().encode(text));
    await this.write('source:' + record.sourceId, { version: 1, iv, ciphertext });
    const verified = await this.secureGet({ sourceId: record.sourceId });
    if (JSON.stringify(verified.record) !== text) throw new Error('LOCAL_SOURCE_CONFIG_WRITE_FAILED');
    return { success: true };
  }
  async secureGet({ sourceId }: { sourceId: string }): Promise<{ found: boolean; record?: LocalSecureSourceRecord }> {
    validateLocalSourceId(sourceId); const api = this.api(), envelope = await this.read<Envelope>('source:' + sourceId);
    if (!envelope) return { found: false };
    try {
      const key = await this.key(false);
      if (!key || envelope.version !== 1 || !(envelope.iv instanceof Uint8Array) || envelope.iv.length !== 12 || !(envelope.ciphertext instanceof ArrayBuffer)) throw new Error();
      const plain = await api.subtle.decrypt({ name: 'AES-GCM', iv: envelope.iv, additionalData: new TextEncoder().encode(sourceId) }, key, envelope.ciphertext);
      const record = JSON.parse(new TextDecoder().decode(plain)); validateLocalSecureSourceRecord(record);
      if (record.sourceId !== sourceId) throw new Error(); return { found: true, record };
    } catch { throw new Error('LOCAL_SOURCE_CONFIG_UNAVAILABLE'); }
  }
  async secureHas({ sourceId }: { sourceId: string }) { return { exists: (await this.secureGet({ sourceId })).found }; }
  async secureDelete({ sourceId }: { sourceId: string }) { validateLocalSourceId(sourceId); await this.write('source:' + sourceId); return { success: true }; }
  async secureCurrentHostFingerprint() { return { available: false }; }
  async secureReadDiagnosis({ sourceId }: { sourceId: string }) {
    const present = (await this.secureGet({ sourceId })).found;
    return { branch: 'WEB_VALIDATION_ENCRYPTED', recordPresent: present, ivPresent: present, ciphertextPresent: present,
      ciphertextLengthClass: present ? 'NORMAL' : 'ZERO', keyAliasPresent: present, keyAlgorithm: 'AES-GCM' };
  }
  async securePostReadFingerprintDiagnosis() { return { branch: 'WEB_VALIDATION_ENCRYPTED', objectPresent: false }; }
}
