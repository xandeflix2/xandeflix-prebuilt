import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LocalSecureSourceStore, LocalSecureSourceStoreError } from '../src/security/local-secure-source-store.ts';

const syntheticRecord = {
  sourceId: 'src_syntheticts',
  sourceVersion: 3,
  protocol: 'M3U',
  sourceConfig: {
    endpoint: 'synthetic-endpoint',
    username: 'synthetic-user',
    password: 'synthetic-password',
  },
};

class FakeNativeStore {
  records = new Map();

  async securePut({ record }) {
    this.records.set(record.sourceId, JSON.parse(JSON.stringify(record)));
    return { success: true };
  }

  async secureGet({ sourceId }) {
    const record = this.records.get(sourceId);
    return record ? { found: true, record: JSON.parse(JSON.stringify(record)) } : { found: false };
  }

  async secureHas({ sourceId }) {
    return { exists: this.records.has(sourceId) };
  }

  async secureDelete({ sourceId }) {
    this.records.delete(sourceId);
    return { success: true };
  }
}

let passed = 0;

async function test(name, callback) {
  await callback();
  passed += 1;
  void name;
}

await test('wrapper delegates the four minimal operations', async () => {
  const native = new FakeNativeStore();
  const store = new LocalSecureSourceStore(native);
  await store.put(syntheticRecord);
  assert.deepEqual(await store.get(syntheticRecord.sourceId), syntheticRecord);
  assert.equal(await store.has(syntheticRecord.sourceId), true);
  await store.delete(syntheticRecord.sourceId);
  assert.equal(await store.get(syntheticRecord.sourceId), undefined);
});

await test('web has no persistent secret fallback', async () => {
  let writes = 0;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { setItem: () => { writes += 1; } },
  });
  await assert.rejects(
    () => new LocalSecureSourceStore().put(syntheticRecord),
    (error) => error instanceof LocalSecureSourceStoreError && error.code === 'UNSUPPORTED_SECURE_STORE',
  );
  assert.equal(writes, 0);
  delete globalThis.localStorage;
});

await test('record validation rejects invalid identity, version and protocol', async () => {
  const store = new LocalSecureSourceStore(new FakeNativeStore());
  await assert.rejects(() => store.get('https://synthetic.invalid'), /Identificador lógico/);
  await assert.rejects(
    () => store.put({ ...syntheticRecord, sourceVersion: 0 }),
    /Versão lógica/,
  );
  await assert.rejects(
    () => store.put({ ...syntheticRecord, protocol: 'UNKNOWN' }),
    /Protocolo local/,
  );
});

await test('TS boundary exposes no key material or browser persistence primitive', async () => {
  const source = readFileSync(new URL('../src/security/local-secure-source-store.ts', import.meta.url), 'utf8');
  assert.equal(source.includes('localStorage'), false);
  assert.equal(source.includes('sessionStorage'), false);
  assert.equal(source.includes('indexedDB'), false);
  assert.equal(source.includes('CryptoKey'), false);
  assert.equal(source.includes('encryptionKey'), false);
  assert.equal(source.toLowerCase().includes('keystore'), false);
});

await test('synthetic source material is never printed by this test', async () => {
  const source = readFileSync(new URL('../src/security/local-secure-source-store.ts', import.meta.url), 'utf8');
  assert.equal(source.includes('synthetic-password'), false);
});

console.log(`LOCAL_SECURE_SOURCE_STORE_TS_TESTS_PASS=${passed}`);
