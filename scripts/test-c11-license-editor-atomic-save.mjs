import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { webcrypto } from 'node:crypto';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
function compile(path, ports = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code)(name => ports[name] ?? (() => { throw Error('Unexpected import ' + name); })(), module, module.exports);
  return module.exports;
}
const clientModule = compile('src/control-plane/client/manager-remote-control-plane-authority.ts');
const id = '11111111-1111-4111-8111-111111111111', snapshot = 'a'.repeat(64);
const changes = { licenseId: id, expectedSnapshot: snapshot, customer: { customerId: id, name: 'Novo cliente', expectedName: 'Anterior' }, devices: [], screens: { principalCode: 'XF-AB12-CD34', maxDevices: 5, maxSessions: 4, reason: 'Conferência manual', paidExtraScreens: 1, paymentReference: 'INDEFINIDO', paymentConfirmed: true } };
const calls = []; let logged = true, failure;
const authority = new clientModule.SupabaseManagerRemoteControlPlaneAuthority({ auth: { getSession: async () => ({ data: { session: logged ? { user: { id } } : null } }) },
  rpc: async (name, args) => { calls.push({ name, args }); return failure ? { error: { code: 'P0001', message: failure } } : { data: { success: true } }; },
  functions: { invoke: async (name, { body }) => { calls.push({ name, body }); return { data: { success: true } }; } } });
await authority.saveLicenseEdits(changes);
assert.equal(calls.length, 1); assert.equal(calls[0].name, 'rpc_manager_save_license_edits'); assert.deepEqual(calls[0].args.p_changes.screens, changes.screens);
const config = { playlistUrl: 'https://fixture.invalid/list.m3u?synthetic=1' };
await authority.saveLicenseEdits({ ...changes, source: { expectedSources: [], name: 'Nova fonte', protocol: 'M3U', sourceConfig: config } });
assert.equal(calls.length, 2); assert.equal(calls[1].body.operation, 'SAVE_LICENSE_EDITS'); assert(!('source' in calls[1].body.changes));
for (const input of [{ ...changes, expectedSnapshot: '' }, { ...changes, devices: [{ licenseId: 'wrong' }] }]) { const n = calls.length; await assert.rejects(authority.saveLicenseEdits(input)); assert.equal(calls.length, n); }
logged = false; const n = calls.length; await assert.rejects(authority.saveLicenseEdits(changes), /MANAGER_AUTH_REQUIRED/); assert.equal(calls.length, n); logged = true;
failure = 'LICENSE_EDITOR_CONFLICT'; await assert.rejects(authority.saveLicenseEdits(changes), /LICENSE_EDITOR_CONFLICT/);
const { managerActivationFailure } = compile('src/debug/manager/manager-activation-feedback.ts', { '../../control-plane/client/manager-remote-control-plane-authority.ts': clientModule });
assert(!managerActivationFailure(Object.assign(new Error(failure), { code: failure })).includes(failure));
console.log('C85_CLIENT_SINGLE_RPC_OR_EDGE_AUTH_NO_PARTIAL_FALLBACK_CONFLICT_PASS');

let handler, authenticated = true, denied = false, stale = false, mode = 'MANAGED';
const rpcCalls = [], syntheticKey = new Uint8Array(32).fill(7);
const edgeClient = { auth: { getUser: async () => ({ data: { user: authenticated ? { id } : null }, error: null }) }, rpc: async (name, args) => {
  rpcCalls.push({ name, args }); if (denied) return { error: { message: 'MANAGER_SCOPE_DENIED' } };
  return { data: name === 'rpc_manager_get_license_detail' ? { success: true, license: { mode }, editorSnapshot: stale ? 'b'.repeat(64) : snapshot } : { success: true } };
} };
const edgeCode = ts.transpileModule(fs.readFileSync('supabase/functions/managed-source-vault-admin/index.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
new Function('Deno', 'crypto', 'require', 'exports', edgeCode)({ env: { get: name => name === 'SOURCE_VAULT_KEY_V1' ? Buffer.from(syntheticKey).toString('base64') : 'fixture' }, serve: callback => { handler = callback; } }, webcrypto, name => name.startsWith('npm:') ? { createClient: () => edgeClient } : {}, {});
const body = { operation: 'SAVE_LICENSE_EDITS', licenseId: id, expectedSnapshot: snapshot, changes: { devices: [], screens: changes.screens }, source: { expectedSources: [], name: 'Nova fonte', protocol: 'M3U', sourceConfig: config } };
const request = value => new Request('https://fixture.invalid', { method: 'POST', headers: { Authorization: 'Bearer fixture', 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
for (mode of ['MANAGED', 'SELF_SERVICE']) {
  rpcCalls.length = 0;
  const response = await handler(request(body)); assert.equal(response.status, 200); assert.deepEqual(await response.json(), { success: true });
  assert.deepEqual(rpcCalls.map(c => c.name), ['rpc_manager_get_license_detail', 'rpc_manager_save_license_edits']);
  const params = rpcCalls[1].args, envelope = params.p_changes.source;
  assert(!JSON.stringify(params).includes('fixture.invalid')); assert(!JSON.stringify(params).includes('sourceConfig'));
  assert.match(envelope.sourceId, mode === 'MANAGED' ? /^src_/ : /^csrc_/);
  const key = await webcrypto.subtle.importKey('raw', syntheticKey, { name: 'AES-GCM' }, false, ['decrypt']);
  const clear = await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(envelope.nonce, 'hex'), additionalData: new TextEncoder().encode(`${envelope.sourceId}\0${1}\0M3U`), tagLength: 128 }, key, Buffer.concat([Buffer.from(envelope.ciphertext, 'hex'), Buffer.from(envelope.authTag, 'hex')]));
  assert.deepEqual(JSON.parse(new TextDecoder().decode(clear)), config);
}
for (const condition of ['auth', 'scope', 'stale', 'invalid-config']) {
  authenticated = condition !== 'auth'; denied = condition === 'scope'; stale = condition === 'stale'; rpcCalls.length = 0;
  const response = await handler(request(condition === 'invalid-config' ? { ...body, source: { ...body.source, sourceConfig: { playlistUrl: 'file:///fixture' } } } : body));
  assert(response.status >= 400); assert(!rpcCalls.some(c => c.name === 'rpc_manager_save_license_edits'));
  assert(!JSON.stringify(await response.json()).includes('fixture.invalid'));
}
console.log('C85_EDGE_SCOPE_SNAPSHOT_AES_BOTH_MODES_ONE_MUTATION_NO_PLAINTEXT_PASS');

const { Header } = compile('src/ui/components/Header.tsx', { react: React, './NavigationIcon.tsx': { NavigationIcon: () => null } });
let landscape = false, portrait = false;
const { AppShell } = compile('src/ui/components/AppShell.tsx', { react: React, './Header.tsx': { Header },
  '../hooks/useLandscapeNavigation.ts': { useLandscapeNavigation: () => landscape }, '../hooks/useLivePresentation.ts': { useLivePresentation: () => ({ tabletPortrait: portrait, stackedLive: false }) },
  './CastButton.tsx': { CastButton: () => null }, '../device-presentation.ts': { isTelevisionPresentation: () => false }, '../hooks/useDevicePresentation.ts': { useDevicePresentation: () => null } });
for (const presentation of [[false, false], [true, false], [true, true]]) {
  [landscape, portrait] = presentation;
  const props = { currentView: 'manager-panel', canGoBack: true, onBack: () => {}, onNavigate: () => {}, children: React.createElement('button', { onClick: () => {} }, '← Voltar') };
  const html = renderToStaticMarkup(React.createElement(AppShell, props)); assert.equal((html.match(/Voltar/g) || []).length, 1); assert(!html.includes('page-back-row'));
  const other = renderToStaticMarkup(React.createElement(AppShell, { ...props, currentView: 'settings', children: null })); assert(other.includes('Voltar para a tela anterior'));
}
console.log('C85_SINGLE_MANAGER_BACK_ALL_PRESENTATIONS_OTHER_ROUTES_PRESERVED_PASS');
