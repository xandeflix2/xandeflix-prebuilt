import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const keyBytes = new Uint8Array(32).fill(7), fixtureId = '11111111-1111-4111-8111-111111111111';
const env = { SOURCE_VAULT_KEY_V1: Buffer.from(keyBytes).toString('base64'), SUPABASE_URL: 'https://fixture.invalid', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-key', SUPABASE_ANON_KEY: 'synthetic-public-key' };
globalThis.Deno = { env: { get: name => env[name] } };
function compile(path, ports = {}) {
  const module = { exports: {} }, output = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', output)(name => { if (name.includes('edge-runtime')) return {}; if (name in ports) return ports[name]; throw Error('Missing port ' + name); }, module, module.exports);
  return module.exports;
}
const policy = compile('supabase/functions/_shared/signal-policy.ts');
let count = 0; async function test(name, run) { await run(); count++; console.log('PASS ' + name); }
const source = { playlistUrl: 'https://fixture.invalid/get.php?username=fixture&password=synthetic&type=m3u_plus&output=ts' };
await test('NORMALIZED_FORMATS_SAME_ACCOUNT_PRIVATE_HMAC', async () => {
  const a = await policy.signalFingerprint(source, 'M3U', keyBytes);
  const b = await policy.signalFingerprint({ playlistUrl: 'https://FIXTURE.invalid/get.php?output=m3u8&password=synthetic&username=fixture&type=m3u' }, 'M3U8', keyBytes);
  const c = await policy.signalFingerprint({ endpoint: 'https://fixture.invalid/', username: 'fixture', password: 'synthetic' }, 'XTREAM', keyBytes);
  assert.match(a, /^[a-f0-9]{64}$/); assert.equal(a, b); assert.equal(a, c);
  assert.equal(a, await policy.signalFingerprint({ ...source, username: 'ignored', password: 'ignored', epgUrl: 'https://fixture.invalid/epg', runtimeOptions: { buffer: 99 } }, 'M3U', keyBytes));
  assert.equal(a, await policy.signalFingerprint({ endpoint: 'https://fixture.invalid/player_api.php', username: ' fixture ', password: ' synthetic ' }, 'XTREAM', keyBytes));
  assert.equal(await policy.signalFingerprint({ ...source, token: ' account ' }, 'M3U', keyBytes), await policy.signalFingerprint({ ...source, token: 'account' }, 'M3U', keyBytes));
  assert.notEqual(a, await policy.signalFingerprint({ ...source, token: 'different-account-token' }, 'M3U', keyBytes));
  assert.notEqual(a, await policy.signalFingerprint(source, 'M3U', new Uint8Array(32).fill(8)));
});
async function envelope(config, sourceId, version, protocol) {
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']), nonce = new Uint8Array(12).fill(3);
  const encrypted = Buffer.from(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, additionalData: new TextEncoder().encode(`${sourceId}\0${version}\0${protocol}`) }, key, new TextEncoder().encode(JSON.stringify(config))));
  return { ciphertext: encrypted.subarray(0, -16).toString('hex'), authTag: encrypted.subarray(-16).toString('hex'), nonce: Buffer.from(nonce).toString('hex') };
}
async function decode(args, version = 1) {
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
  return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(args.p_nonce, 'hex'),
    additionalData: new TextEncoder().encode(`${args.p_source_id}\0${version}\0${args.p_source_type}`) }, key, Buffer.from(args.p_ciphertext + args.p_auth_tag, 'hex'))));
}
await test('EXISTING_VAULT_BACKFILL_NO_PLAINTEXT_OR_PUBLIC_HASH', async () => {
  const row = { kind: 'CUSTOMER', sourceId: 'csrc_fixture', version: 9, protocol: 'M3U', ...await envelope(source, 'csrc_fixture', 9, 'M3U') }, saved = [];
  let pending = true; const client = { async rpc(name, args) { if (name === 'rpc_signal_index_pending') { const data = pending ? [row] : []; pending = false; return { data }; } saved.push(args); return { data: { success: true } }; } };
  await policy.ensureSignalIndex(client, keyBytes); assert.equal(saved.length, 1); assert.equal(saved[0].p_version, 9);
  assert.equal(saved[0].p_fingerprint, await policy.signalFingerprint(source, 'M3U', keyBytes));
  assert.doesNotMatch(JSON.stringify(saved), /playlistUrl|synthetic|https:/);
  await assert.rejects(policy.ensureSignalIndex({ rpc: async () => ({ data: [{ ...row, ciphertext: '00' }] }) }, keyBytes), /SOURCE_POLICY_UNAVAILABLE/);
  const mixedSaved = [];
  await assert.rejects(policy.ensureSignalIndex({ async rpc(name, args) {
    if (name === 'rpc_signal_index_pending') return { data: [{ ...row, ciphertext: '00' }, row] };
    mixedSaved.push(args); return { data: { success: true } };
  } }, keyBytes), /SOURCE_POLICY_UNAVAILABLE/);
  assert.equal(mixedSaved.length, 1, 'Valid vault progress must survive another invalid envelope');
});
function publicHandler(client) { return compile('supabase/functions/device-public-activation/index.ts', { 'npm:@supabase/supabase-js@2.116.0': { createClient: () => client }, '../_shared/signal-policy.ts': policy }).handleDevicePublicActivation; }
const body = { operation: 'COMPLETE', displayCode: 'XF-TEST-TEST', sessionToken: 'a'.repeat(64), sourceName: 'Fixture', sourceType: 'M3U', sourceUrl: source.playlistUrl };
const request = data => new Request('https://fixture.invalid', { method: 'POST', headers: { Authorization: 'Bearer synthetic-user-token', 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
await test('DUPLICATE_SIGNAL_BLOCKS_BEFORE_CUSTOMER_CREATION', async () => {
  const client = { auth: { admin: { createUser() { assert.fail('Unapproved duplicate creates identity'); } } }, async rpc(name) {
    if (name === 'rpc_public_check_device_activation_session') return { data: { success: true } };
    if (name === 'rpc_signal_index_pending') return { data: [] };
    if (name === 'rpc_signal_public_check') return { error: { code: '42501', message: 'ADDITIONAL_DEVICE_REQUIRES_APPROVAL' } };
    assert.fail('Unexpected RPC');
  } };
  await assert.rejects(publicHandler(client)(request(body)), error => error.code === 'ADDITIONAL_DEVICE_REQUIRES_APPROVAL');
});
await test('APPROVED_DEVICE_REUSES_ACCOUNT_ENCRYPTS_REAL_OPAQUE_ID', async () => {
  let captured;
  const client = { auth: { admin: { createUser() { assert.fail('Approved device creates another identity'); } } }, async rpc(name, args) {
    if (name === 'rpc_public_check_device_activation_session') return { data: { success: true } };
    if (name === 'rpc_signal_index_pending') return { data: [] };
    if (name === 'rpc_signal_public_check') return { data: { success: true, customerId: fixtureId } };
    if (name === 'rpc_signal_public_complete_with_screens') { captured = args; return { data: { success: true, deviceAuthorizationState: 'AUTHORIZED', sourceId: args.p_source_id } }; }
    assert.fail('Unexpected RPC');
  } };
  const response = await publicHandler(client)(request(body)), json = await response.json();
  assert.equal(json.success, true); assert.equal(captured.p_customer_id, fixtureId); assert.match(captured.p_fingerprint, /^[a-f0-9]{64}$/);
  assert.equal(captured.p_initial_screens, 1);
  assert.equal((await decode(captured)).playlistUrl, source.playlistUrl);
  assert.doesNotMatch(JSON.stringify(json), /fingerprint|password|playlistUrl|ciphertext/);
});
await test('FINAL_POLICY_RACE_ROLLS_BACK_BOOTSTRAP_IDENTITY', async () => {
  let deleted = 0;
  const client = { auth: { admin: { createUser: async () => ({ data: { user: { id: fixtureId } } }), deleteUser: async id => { assert.equal(id, fixtureId); deleted++; } } }, async rpc(name) {
    if (name === 'rpc_public_check_device_activation_session') return { data: { success: true } };
    if (name === 'rpc_signal_index_pending') return { data: [] };
    if (name === 'rpc_signal_public_check') return { data: { success: true } };
    return { error: { code: '42501', message: 'ADDITIONAL_DEVICE_REQUIRES_APPROVAL' } };
  } };
  await assert.rejects(publicHandler(client)(request(body)), /ADDITIONAL_DEVICE_REQUIRES_APPROVAL/); assert.equal(deleted, 1);
});
await test('CHECK_POLICY_CAPABILITY_BEFORE_VAULT_WORK', async () => {
  let calls = 0; const handler = publicHandler({ rpc: async name => { calls++; assert.equal(name, 'rpc_public_check_device_activation_session'); return { data: { success: false } }; } });
  await assert.rejects(handler(request({ operation: 'CHECK_POLICY', displayCode: body.displayCode, sessionToken: body.sessionToken })), /ACTIVATION_SESSION_NOT_OPEN/); assert.equal(calls, 1);
});
await test('CUSTOMER_WRITE_IDENTITY_AND_AAD_COME_FROM_VERIFIED_SERVER', async () => {
  let captured;
  const client = { auth: { getUser: async () => ({ data: { user: { id: fixtureId } } }) }, async rpc(name, args) {
    if (name === 'rpc_signal_index_pending') return { data: [] };
    assert.equal(name, 'rpc_signal_customer_write'); captured = args; return { data: { success: true, sourceId: args.p_source_id } };
  } };
  const handler = compile('supabase/functions/customer-source-upsert/index.ts', { 'npm:@supabase/supabase-js@2.116.0': { createClient: () => client }, '../_shared/signal-policy.ts': policy }).handleCustomerSourceUpsert;
  const response = await handler(request({ operation: 'CREATE_CUSTOMER_SOURCE', licenseId: fixtureId, customerId: 'untrusted-id', sourceType: 'M3U', displayName: 'Fixture', sourceConfig: { playlistUrl: source.playlistUrl } }));
  assert.equal((await response.json()).success, true); assert.equal(captured.p_customer_id, fixtureId); assert.match(captured.p_source_id, /^csrc_[a-f0-9]+$/);
  assert.equal((await decode(captured)).playlistUrl, source.playlistUrl);
});
await test('OWNED_REPLACEMENT_CANNOT_SKIP_FOREIGN_UNVERIFIED_SOURCE', async () => {
  const owned = { kind: 'CUSTOMER', sourceId: 'csrc_owned', version: 3 };
  const bad = { ...owned, protocol: 'M3U', ciphertext: '00', nonce: '00', authTag: '00' };
  await policy.ensureSignalIndex({ rpc: async () => ({ data: [bad] }) }, keyBytes, owned);
  await assert.rejects(policy.ensureSignalIndex({ rpc: async () => ({ data: [bad, { ...bad, sourceId: 'csrc_foreign' }] }) }, keyBytes, owned), /SOURCE_POLICY_UNAVAILABLE/);
});
await test('PUBLIC_REPAIR_TARGET_FROM_VERIFIED_CAPABILITY_NOT_BODY', async () => {
  let captured;
  const target = { kind: 'CUSTOMER', sourceId: 'csrc_owned', version: 3 };
  const client = { auth: { admin: { createUser() { assert.fail('Owned repair creates a consumer'); } } }, async rpc(name, args) {
    if (name === 'rpc_public_check_device_activation_session') return { data: { success: true, customerId: fixtureId } };
    if (name === 'rpc_signal_public_owned_target') { assert.equal(args.p_display_code, body.displayCode); return { data: target }; }
    if (name === 'rpc_signal_index_pending') return { data: [{ ...target, ciphertext: '00' }] };
    if (name === 'rpc_signal_public_check') return { data: { success: true, customerId: fixtureId } };
    if (name === 'rpc_signal_public_complete_with_screens') { captured = args; return { data: { success: true, sourceId: args.p_source_id } }; }
    assert.fail('Unexpected RPC');
  } };
  const response = await publicHandler(client)(request({ ...body, replacing: { sourceId: 'csrc_foreign' }, customerId: 'foreign' }));
  assert.equal((await response.json()).success, true); assert.equal(captured.p_customer_id, fixtureId);
});
await test('AUTHENTICATED_REPAIR_OWNER_AND_VERSION_BEFORE_BACKFILL', async () => {
  let captured, rowOwner = fixtureId;
  const client = { auth: { getUser: async () => ({ data: { user: { id: fixtureId } } }) },
    from() { const q = { select() { return q; }, eq() { return q; }, async single() { return { data: { source_type: 'M3U', customer_id: rowOwner, version: 3 } }; } }; return q; },
    async rpc(name, args) {
      if (name === 'rpc_signal_index_pending') return { data: [{ kind: 'CUSTOMER', sourceId: 'csrc_owned', version: 3, ciphertext: '00' }] };
      assert.equal(name, 'rpc_signal_customer_write'); captured = args; return { data: { success: true } };
    } };
  const handler = compile('supabase/functions/customer-source-upsert/index.ts', { 'npm:@supabase/supabase-js@2.116.0': { createClient: () => client }, '../_shared/signal-policy.ts': policy }).handleCustomerSourceUpsert;
  const input = { operation: 'UPDATE_CUSTOMER_SOURCE', sourceId: 'csrc_owned', customerId: 'foreign', expectedVersion: 3, sourceType: 'M3U', sourceConfig: { playlistUrl: source.playlistUrl } };
  assert.equal((await (await handler(request(input))).json()).success, true);
  assert.equal(captured.p_customer_id, fixtureId); assert.equal((await decode(captured, 4)).playlistUrl, source.playlistUrl);
  rowOwner = 'foreign'; await assert.rejects(handler(request(input)), /INVALID_SOURCE_TYPE/);
});
console.log(`C11_SIGNAL_POLICY=${count}/${count}_PASS (synthetic keys and isolated vault runtime)`);
