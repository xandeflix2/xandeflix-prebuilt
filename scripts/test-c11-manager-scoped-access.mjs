import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const read = path => fs.readFileSync(path, 'utf8');
let tests = 0;
async function test(name, run) { await run(); tests++; console.log('PASS ' + name); }
function compile(path, ports = {}) {
  const module = { exports: {} };
  const source = ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText;
  new Function('require', 'module', 'exports', source)(name => {
    if (name.endsWith('.css')) return {};
    if (name in ports) return ports[name];
    throw Error('Missing port ' + name);
  }, module, module.exports);
  return module.exports;
}
const { SupabaseManagerRemoteControlPlaneAuthority } = compile('src/control-plane/client/manager-remote-control-plane-authority.ts');
const { managerSections } = compile('src/debug/manager/manager-access.ts');
const userId = '11111111-1111-4111-8111-111111111111';
await test('REAL_AUTHORITY_ROLE_COMES_FROM_SERVER_NOT_USER_METADATA', async () => {
  const calls = [], client = { auth: { getSession: async () => ({ data: { session: { user: { id: userId, user_metadata: { role: 'MASTER' } } } } }) },
    rpc: async (name, args) => { calls.push({ name, args }); return { data: { userId, role: 'ADMIN' } }; } };
  const authority = new SupabaseManagerRemoteControlPlaneAuthority(client);
  assert.deepEqual(await authority.getAccessProfile(), { userId, role: 'ADMIN' });
  assert.deepEqual(calls, [{ name: 'rpc_manager_access_profile', args: {} }]);
  client.rpc = async () => ({ data: { userId, role: 'USER' } });
  await assert.rejects(authority.getAccessProfile(), /MANAGER_NOT_AUTHORIZED/);
  client.rpc = async () => ({ error: { message: 'MANAGER_NOT_AUTHORIZED' } });
  await assert.rejects(authority.getAccessProfile());
});
await test('NO_SESSION_NO_PRIVILEGED_RPC', async () => {
  const authority = new SupabaseManagerRemoteControlPlaneAuthority({ auth: { getSession: async () => ({ data: { session: null } }) }, rpc() { assert.fail('RPC reached without session'); } });
  await assert.rejects(authority.getAccessProfile(), /MANAGER_AUTH_REQUIRED/);
  await assert.rejects(authority.deleteDevicePermanently('fixture', 'XF-TEST-TEST'), /MANAGER_AUTH_REQUIRED/);
});
await test('DELETE_EXACT_TARGET_CONFIRMATION_AND_TRUTHFUL_ACK', async () => {
  const calls = [], client = { auth: { getSession: async () => ({ data: { session: { user: { id: userId } } } }) },
    rpc: async (name, args) => { calls.push({ name, args }); return { data: { success: true } }; } };
  const authority = new SupabaseManagerRemoteControlPlaneAuthority(client);
  await authority.deleteDevicePermanently('fixture-device', 'XF-TEST-TEST');
  assert.deepEqual(calls, [{ name: 'rpc_manager_delete_device_permanently', args: { p_device_id: 'fixture-device', p_confirmation_code: 'XF-TEST-TEST' } }]);
  client.rpc = async () => ({ data: { success: false } });
  await assert.rejects(authority.deleteDevicePermanently('fixture-device', 'XF-TEST-TEST'));
});
await test('ROLE_SECTIONS_FAIL_CLOSED', () => {
  assert.equal(managerSections(null).length, 0);
  assert.equal(managerSections({ userId, role: 'USER' }).length, 0);
  assert.deepEqual(managerSections({ userId, role: 'MASTER' }).map(section => section.id),
    ['ATIVACAO', 'USUARIOS', 'GESTORES', 'CLIENTES', 'LICENCAS', 'INSTALACOES', 'DISPOSITIVOS', 'FONTES', 'AUDITORIA', 'ATUALIZACOES', 'SISTEMA']);
  assert.deepEqual(managerSections({ userId, role: 'ADMIN' }).map(section => section.id),
    ['ATIVACAO', 'USUARIOS', 'CLIENTES', 'LICENCAS', 'INSTALACOES', 'DISPOSITIVOS', 'FONTES', 'AUDITORIA']);
});

// Exercise actual component handlers/rendering with isolated hooks and ports.
function harness(path, ports, overrides = {}) {
  const labels = [...read(path).matchAll(/const\s+\[([A-Za-z]\w*)[^=]*=\s*useState/g)].map(match => match[1]);
  const values = new Map(Object.entries(overrides)); let cursor = 0;
  const fakeReact = { ...React, useState(initial) {
    const label = labels[cursor++];
    assert.ok(label, 'Unknown hook');
    if (!values.has(label)) values.set(label, typeof initial === 'function' ? initial() : initial);
    return [values.get(label), next => values.set(label, typeof next === 'function' ? next(values.get(label)) : next)];
  }, useEffect() {}, useCallback(fn) { return fn; }, useRef(value) { return { current: value }; } };
  const compiled = compile(path, { ...ports, react: { ...fakeReact, default: fakeReact } });
  const Component = Object.values(compiled).find(value => typeof value === 'function');
  const render = () => { cursor = 0; return Component({ onBack() {} }); };
  return { values, render, markup: () => renderToStaticMarkup(render()) };
}
function find(element, predicate) {
  if (!element || typeof element !== 'object') return undefined;
  if (predicate(element)) return element;
  for (const child of React.Children.toArray(element.props?.children)) { const match = find(child, predicate); if (match) return match; }
}
const child = () => null;
const managerPorts = {
  './ManagerAppUpdates.tsx': { ManagerAppUpdates: child },
  './ManagerDeviceLinkView.tsx': { ManagerDeviceLinkView: child },
  './ManagerDeviceRegistrationFields.tsx': { ManagerDeviceRegistrationFields: child },
  './manager-activation-feedback.ts': { managerActivationFailure: () => 'Denied' },
  './ManagerActivationRequests.tsx': { ManagerActivationRequests: child },
  '../../ui/components/DeviceCodeInput.tsx': { DeviceCodeInput: child },
  '../../control-plane/client/activation-handoff.service.ts': { tvPlatformLabels: {} },
  './ManagerUsersView.tsx': { ManagerUsersView: child },
  './manager-access.ts': { managerSections }, './ManagerDeviceDeletion.tsx': { ManagerDeviceDeletion: child },
  './ManagerMultiDeviceContact.tsx': { ManagerMultiDeviceContact: child }, './ManagerPlaybackErrors.tsx': { ManagerPlaybackErrors: child },
  '../../control-plane/engine/control-plane-engine.ts': { getControlPlaneEngine: () => ({}) },
  '../../control-plane/client/manager-remote-control-plane-authority.ts': { getManagerRemoteControlPlaneAuthority: () => ({ auth: {} }), sanitizeManagerErrorMessage: () => 'Denied' },
  '../../integrations/supabase/runtime-config.ts': { getSupabaseRuntimeConfigStatus: () => ({ status: 'READY' }) },
  '../../control-plane/client/public-device-activation.service.ts': { getPublicDeviceActivationService: () => ({}) },
};
for (const name of ['AdminCustomersView', 'AdminLicensesView', 'AdminInstallationsView', 'AdminAuditView', 'AdminCustomerSourcesView']) managerPorts['./' + name + '.tsx'] = { [name]: child };
await test('REAL_MANAGER_RENDER_LOCKED_WITHOUT_SERVER_PROFILE', () => {
  for (const overrides of [{}, { managerSession: { userId } }]) {
    const html = harness('src/debug/manager/ManagerPanelPage.tsx', managerPorts, overrides).markup();
    assert.doesNotMatch(html, /manager-navigation|ATIVAR FONTE PARA DISPOSITIVO|Solicitações de reativação/);
    assert.match(html, /type="password"/);
  }
});
await test('REAL_MANAGER_SIDEBAR_ROLES_AND_SOURCE_PAIR_GATE', () => {
  for (const role of ['MASTER', 'ADMIN']) {
    const h = harness('src/debug/manager/ManagerPanelPage.tsx', managerPorts, { managerSession: { userId }, managerProfile: { userId, role }, activeTab: 'ATIVACAO' });
    const html = h.markup(); assert.match(html, /manager-navigation/); assert.match(html, /Ativar dispositivo/);
    assert.doesNotMatch(html, /ATIVAR FONTE PARA DISPOSITIVO/);
    if (role === 'ADMIN') assert.doesNotMatch(html, />Sistema<|>Atualizações<|>Gestores</);
    else { assert.match(html, />Sistema</); assert.match(html, />Atualizações</); assert.match(html, />Gestores</); }
    h.values.set('deviceActivationSession', { displayCode: 'XF-TEST-TEST', sessionToken: 'synthetic-capability' });
    assert.match(h.markup(), /ATIVAR FONTE PARA DISPOSITIVO/);
  }
});
const publicService = { async start() { return { success: false, message: 'Código inválido' }; }, async complete() { return { success: false, message: 'Falha de ativação' }; } };
const publicPorts = { '@capacitor/core': { Capacitor: { isNativePlatform: () => false } },
  '../components/DeviceCodeInput.tsx': { DeviceCodeInput: child },
  '../../control-plane/client/public-device-activation.service.ts': { getPublicDeviceActivationService: () => publicService } };
await test('REAL_PUBLIC_INVALID_PAIR_CANNOT_REVEAL_SOURCE_FORM', async () => {
  const h = harness('src/ui/pages/PublicDeviceActivationPage.tsx', publicPorts, { displayCode: 'XF-TEST-TEST', activationKey: '123456' });
  assert.doesNotMatch(h.markup(), /URL da playlist/);
  await find(h.render(), element => element.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.match(h.markup(), /Código inválido/); assert.doesNotMatch(h.markup(), /URL da playlist/);
});
await test('REAL_PUBLIC_PAIR_SOURCE_SYNC_AND_SECRET_CLEARING', async () => {
  publicService.start = async () => ({ sessionId: 'synthetic', displayCode: 'XF-TEST-TEST', sessionToken: 'synthetic-capability', expiresAt: new Date(Date.now() + 60000).toISOString() });
  const h = harness('src/ui/pages/PublicDeviceActivationPage.tsx', publicPorts, { displayCode: 'XF-TEST-TEST', activationKey: '123456' });
  await find(h.render(), element => element.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.match(h.markup(), /URL da playlist/); assert.equal(h.values.get('activationKey'), '');
  h.values.set('sourceUrl', 'https://fixture.invalid/list.m3u'); h.values.set('sourcePassword', 'synthetic-secret');
  await find(h.render(), element => element.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.match(h.markup(), /Falha de ativação/); assert.equal(h.values.get('completedCode'), null);
  publicService.complete = async () => ({ success: true, deviceAuthorizationState: 'AUTHORIZED' });
  await find(h.render(), element => element.type === 'form').props.onSubmit({ preventDefault() {} });
  const html = h.markup(); assert.match(html, /Dispositivo pronto para sincronizar/); assert.match(html, /XF-TEST-TEST/);
  assert.doesNotMatch(html, /URL da playlist|synthetic-secret|synthetic-capability/);
  assert.equal(h.values.get('sourceUrl'), ''); assert.equal(h.values.get('sourcePassword'), ''); assert.equal(h.values.get('session'), null);
});
console.log('C11_MANAGER_SCOPED_ACCESS=' + tests + '/'+ tests + '_PASS (isolated client/component tests; SQL suite separate)');
