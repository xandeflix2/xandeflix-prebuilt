import assert from 'node:assert/strict';
import fs from 'node:fs';

import { LocalSourceProvisioningService } from '../src/security/local-source-provisioning.service.ts';

console.log('=== XANDEFLIX PREBUILT — D1 LOCAL SOURCE PROVISIONING ===\n');

let passCount = 0;
let totalTests = 0;

async function test(name, fn) {
  totalTests += 1;
  try {
    await fn();
    passCount += 1;
    console.log(`  ✓ [TESTE ${totalTests}] ${name} = PASS`);
  } catch (error) {
    console.error(`  ✗ [TESTE ${totalTests}] ${name} = FAIL`);
    console.error(`    ${error.message}`);
    process.exitCode = 1;
  }
}

function createStore({ failure } = {}) {
  const calls = [];
  return {
    calls,
    async put(record) {
      calls.push(record);
      if (failure) throw failure;
    },
  };
}

function m3uRequest(overrides = {}) {
  return {
    authorization: {
      status: 'SOURCE_READY',
      sourceId: 'src_uhwh5cio',
      sourceVersion: 4,
      protocol: 'M3U',
      sourceStatus: 'ACTIVE',
      ...overrides.authorization,
    },
    sourceConfig: {
      playlistUrl: 'https://m3u.synthetic.invalid/list.m3u?x=synthetic&y=value',
      ...overrides.sourceConfig,
    },
  };
}

function xtreamRequest(overrides = {}) {
  return {
    authorization: {
      status: 'SOURCE_READY',
      sourceId: 'src_uhwh5cio',
      sourceVersion: 4,
      protocol: 'XTREAM',
      sourceStatus: 'ACTIVE',
      ...overrides.authorization,
    },
    sourceConfig: {
      endpoint: 'https://xtream.synthetic.invalid:8443',
      username: 'synthetic-user',
      password: 'synthetic-password',
      ...overrides.sourceConfig,
    },
  };
}

function assertRejected(result, errorCode) {
  assert.equal(result.success, false);
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.errorCode, errorCode);
}

await test('T1 M3U válido grava uma vez no secure store', async () => {
  const store = createStore();
  const result = await new LocalSourceProvisioningService(store).provision(m3uRequest());

  assert.equal(result.success, true);
  assert.equal(result.status, 'STORED');
  assert.equal(store.calls.length, 1);
  assert.equal(store.calls[0].sourceId, 'src_uhwh5cio');
});

await test('T2 query string M3U é preservada no record local', async () => {
  const store = createStore();
  const inputUrl = 'https://m3u.synthetic.invalid/list.m3u?x=synthetic&y=value';
  await new LocalSourceProvisioningService(store).provision(m3uRequest({
    sourceConfig: { playlistUrl: inputUrl },
  }));

  assert.equal(store.calls[0].sourceConfig.playlistUrl, inputUrl);
});

await test('T3 M3U não sofre silent rewrite', async () => {
  const store = createStore();
  const inputUrl = 'https://m3u.synthetic.invalid/list.m3u?z=3&a=1#fragment';
  const result = await new LocalSourceProvisioningService(store).provision(m3uRequest({
    sourceConfig: { playlistUrl: inputUrl },
  }));

  assert.equal(result.success, true);
  assert.equal(store.calls[0].sourceConfig.playlistUrl, inputUrl);
});

await test('T4 XTREAM mantém endpoint e credenciais somente no record local', async () => {
  const store = createStore();
  const result = await new LocalSourceProvisioningService(store).provision(xtreamRequest());

  assert.equal(result.success, true);
  assert.equal(store.calls[0].sourceConfig.endpoint, 'https://xtream.synthetic.invalid:8443');
  assert.equal(store.calls[0].sourceConfig.username, 'synthetic-user');
  assert.equal(store.calls[0].sourceConfig.password, 'synthetic-password');
  assert.equal('sourceConfig' in result, false);
});

await test('T5 sourceId inválido rejeita sem write', async () => {
  const store = createStore();
  const result = await new LocalSourceProvisioningService(store).provision(m3uRequest({
    authorization: { sourceId: 'host-derived-id' },
  }));

  assertRejected(result, 'INVALID_SOURCE_ID');
  assert.equal(store.calls.length, 0);
});

await test('T6 sourceVersion inválida rejeita sem write', async () => {
  const store = createStore();
  const result = await new LocalSourceProvisioningService(store).provision(m3uRequest({
    authorization: { sourceVersion: 0 },
  }));

  assertRejected(result, 'INVALID_SOURCE_VERSION');
  assert.equal(store.calls.length, 0);
});

await test('T7 protocol inválido rejeita sem write', async () => {
  const store = createStore();
  const result = await new LocalSourceProvisioningService(store).provision(m3uRequest({
    authorization: { protocol: 'HLS' },
  }));

  assertRejected(result, 'INVALID_SOURCE_PROTOCOL');
  assert.equal(store.calls.length, 0);
});

await test('T8 metadata M3U com config XTREAM rejeita por mismatch', async () => {
  const store = createStore();
  const result = await new LocalSourceProvisioningService(store).provision(m3uRequest({
    sourceConfig: {
      endpoint: 'https://xtream.synthetic.invalid',
      username: 'synthetic-user',
      password: 'synthetic-password',
    },
  }));

  assertRejected(result, 'PROTOCOL_MISMATCH');
  assert.equal(store.calls.length, 0);
});

await test('T9 sourceStatus DISABLED não grava', async () => {
  const store = createStore();
  const result = await new LocalSourceProvisioningService(store).provision(m3uRequest({
    authorization: { sourceStatus: 'DISABLED' },
  }));

  assertRejected(result, 'SOURCE_STATUS_NOT_ACTIVE');
  assert.equal(store.calls.length, 0);
});

await test('T10 autorização não pronta não grava', async () => {
  const store = createStore();
  const result = await new LocalSourceProvisioningService(store).provision(m3uRequest({
    authorization: { status: 'DEVICE_NOT_AUTHORIZED' },
  }));

  assertRejected(result, 'SOURCE_AUTHORIZATION_INVALID');
  assert.equal(store.calls.length, 0);
});

await test('T11 falha do secure store retorna erro sanitizado', async () => {
  const store = createStore({ failure: new Error('synthetic-store-failure') });
  const result = await new LocalSourceProvisioningService(store).provision(m3uRequest());

  assertRejected(result, 'LOCAL_SOURCE_CONFIG_WRITE_FAILED');
  assert.equal('message' in result, false);
});

await test('T12 resultado não contém sourceConfig', async () => {
  const store = createStore();
  const result = await new LocalSourceProvisioningService(store).provision(m3uRequest());

  assert.equal('sourceConfig' in result, false);
});

await test('T13 resultado não contém playlistUrl', async () => {
  const store = createStore();
  const result = await new LocalSourceProvisioningService(store).provision(m3uRequest());

  assert.equal('playlistUrl' in result, false);
});

await test('T14 resultado não contém username/password/token', async () => {
  const store = createStore();
  const result = await new LocalSourceProvisioningService(store).provision(xtreamRequest({
    sourceConfig: { token: 'synthetic-token' },
  }));

  assert.equal('username' in result, false);
  assert.equal('password' in result, false);
  assert.equal('token' in result, false);
});

await test('T15 nenhum segredo é logado pelo serviço', async () => {
  const output = [];
  const original = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };
  console.log = (...args) => output.push(args.join(' '));
  console.warn = (...args) => output.push(args.join(' '));
  console.error = (...args) => output.push(args.join(' '));

  try {
    await new LocalSourceProvisioningService(createStore()).provision(xtreamRequest({
      sourceConfig: { token: 'synthetic-token' },
    }));
  } finally {
    console.log = original.log;
    console.warn = original.warn;
    console.error = original.error;
  }

  assert.deepEqual(output, []);
});

await test('T16 DebugSourceConfigService não é fallback', () => {
  const source = fs.readFileSync(new URL('../src/security/local-source-provisioning.service.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /DebugSourceConfigService|loadConfig|saveConfig/);
});

await test('T17 localStorage não é usado', () => {
  const source = fs.readFileSync(new URL('../src/security/local-source-provisioning.service.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/);
});

await test('T18 Filesystem plaintext não é usado', () => {
  const source = fs.readFileSync(new URL('../src/security/local-source-provisioning.service.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /Directory\.Data|Filesystem|writeFile|readFile/);
});

await test('T19 Supabase e network não são usados', () => {
  const source = fs.readFileSync(new URL('../src/security/local-source-provisioning.service.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /supabase|fetch\(|XMLHttpRequest|axios/);
});

await test('T20 serviço não retém form state sensível após sucesso', async () => {
  const service = new LocalSourceProvisioningService(createStore());
  await service.provision(m3uRequest());

  assert.equal(Object.keys(service).includes('sourceConfig'), false);
  assert.equal(Object.keys(service).includes('playlistUrl'), false);
});

await test('T21 sourceId/version/protocol são preservados sem derivação', async () => {
  const store = createStore();
  const result = await new LocalSourceProvisioningService(store).provision(m3uRequest({
    authorization: {
      sourceId: 'src_r2ed1synthetic',
      sourceVersion: 7,
    },
  }));

  assert.equal(result.success, true);
  assert.equal(result.sourceId, 'src_r2ed1synthetic');
  assert.equal(result.sourceVersion, 7);
  assert.equal(result.protocol, 'M3U');
  assert.equal(store.calls[0].sourceId, 'src_r2ed1synthetic');
  assert.equal(store.calls[0].sourceVersion, 7);
  assert.equal(store.calls[0].protocol, 'M3U');
});

await test('T22 envelope remoto proibido é rejeitado', async () => {
  const store = createStore();
  const result = await new LocalSourceProvisioningService(store).provision({
    ...m3uRequest(),
    protectedConfig: { synthetic: true },
  });

  assertRejected(result, 'SOURCE_AUTHORIZATION_INVALID');
  assert.equal(store.calls.length, 0);
});

console.log(`\nRESULTADO D1: ${passCount} de ${totalTests} testes PASS\n`);
if (passCount !== totalTests) process.exit(1);
