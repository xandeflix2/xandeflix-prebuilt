import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const read = path => fs.readFileSync(path, 'utf8');
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
const helper = compile('src/debug/manager/manager-password-recovery.ts');
const { requestManagerPasswordRecovery, saveManagerRecoveryPassword, managerRecoveryUrl, isManagerRecoveryLocation } = helper;
let passed = 0;
async function test(name, run) { await run(); console.log('PASS ' + name); passed++; }
function auth(override = {}) {
  const calls = [];
  return { calls, getUser: async () => ({ data: { user: { id: 'owner', email: 'owner@example.test' } } }),
    resetPasswordForEmail: async (...args) => { calls.push(['reset', ...args]); return { error: null }; },
    updateUser: async (...args) => { calls.push(['update', ...args]); return { data: { user: { id: 'owner' } }, error: null }; },
    signOut: async (...args) => { calls.push(['logout', ...args]); return { error: null }; }, ...override };
}
await test('FIXED_CALLBACK_SAFE_ORIGIN_AND_NO_SECRET_QUERY', () => {
  assert.equal(managerRecoveryUrl('http://localhost:3000/foo?token=private'), 'http://localhost:3000/manager-reset-password');
  assert.equal(managerRecoveryUrl('https://example.test'), 'https://example.test/manager-reset-password');
  for (const origin of ['file:///tmp', 'http://example.test', 'javascript:alert(1)', 'capacitor://localhost']) assert.throws(() => managerRecoveryUrl(origin));
});
await test('DEFAULT_ROOT_RECOVERY_CALLBACK_AND_EXPIRED_LINK_ROUTE', () => {
  for (const location of [{ pathname: '/manager-reset-password', hash: '' }, { pathname: '/', hash: '#type=recovery&access_token=fixture' }, { pathname: '/', hash: '#error_code=otp_expired' }]) assert.equal(isManagerRecoveryLocation(location), true);
  assert.equal(isManagerRecoveryLocation({ pathname: '/', hash: '#type=signup' }), false);
});
await test('REQUEST_PRESERVES_AUTH_ACCOUNT_AND_GENERIC_RESULT', async () => {
  const a = auth(); await requestManagerPasswordRecovery(a, ' owner@example.test ', 'http://localhost:3000');
  assert.deepEqual(a.calls, [['reset', 'owner@example.test', { redirectTo: 'http://localhost:3000/manager-reset-password' }]]);
});
await test('INVALID_EMAIL_OR_PROVIDER_FAILURE_NO_SUCCESS', async () => {
  const a = auth(); await assert.rejects(requestManagerPasswordRecovery(a, 'bad', 'http://localhost:3000'), /RECOVERY_EMAIL_INVALID/);
  assert.equal(a.calls.length, 0);
  await assert.rejects(requestManagerPasswordRecovery(auth({ resetPasswordForEmail: async () => ({ error: { message: 'private failure details' } }) }), 'owner@example.test', 'http://localhost:3000'), /^Error: RECOVERY_EMAIL_FAILED$/);
});
await test('EXPIRED_OR_CHANGED_IDENTITY_CANNOT_CHANGE_PASSWORD', async () => {
  for (const response of [{ data: { user: null }, error: null }, { data: { user: { id: 'other' } } }, { data: { user: { id: 'owner' } }, error: {} }]) {
    const a = auth({ getUser: async () => response });
    await assert.rejects(saveManagerRecoveryPassword(a, 'owner', 'long-fixture-password', 'long-fixture-password'), /RECOVERY_SESSION_INVALID/);
    assert.equal(a.calls.length, 0);
  }
});
await test('PASSWORD_CONFIRMATION_CHECKED_BEFORE_REMOTE_MUTATION', async () => {
  const a = auth();
  await assert.rejects(saveManagerRecoveryPassword(a, 'owner', 'short', 'short'), /RECOVERY_PASSWORD_TOO_SHORT/);
  await assert.rejects(saveManagerRecoveryPassword(a, 'owner', 'long-fixture-password', 'different-fixture-password'), /RECOVERY_PASSWORD_MISMATCH/);
  assert.equal(a.calls.length, 0);
});
await test('PASSWORD_REJECTED_BY_PROVIDER_OR_DIFFERENT_ACK_NO_LOGOUT', async () => {
  for (const result of [{ data: { user: null }, error: {} }, { data: { user: { id: 'other' } }, error: null }]) {
    const a = auth({ updateUser: async () => result });
    await assert.rejects(saveManagerRecoveryPassword(a, 'owner', 'long-fixture-password', 'long-fixture-password'), /RECOVERY_PASSWORD_FAILED/);
    assert.equal(a.calls.length, 0);
  }
});
await test('SUCCESS_UPDATES_ONLY_PASSWORD_AND_SIGNS_OUT_GLOBAL', async () => {
  const a = auth(); await saveManagerRecoveryPassword(a, 'owner', 'long-fixture-password', 'long-fixture-password');
  assert.deepEqual(a.calls, [['update', { password: 'long-fixture-password' }], ['logout', { scope: 'global' }]]);
});
await test('LOGOUT_FAILURE_DISTINGUISHED_FROM_PASSWORD_FAILURE', async () => {
  for (const signOut of [async () => ({ error: {} }), async () => { throw Error('network'); }]) {
    await assert.rejects(saveManagerRecoveryPassword(auth({ signOut }), 'owner', 'long-fixture-password', 'long-fixture-password'), /RECOVERY_PASSWORD_SAVED_SIGNOUT_FAILED/);
  }
});

global.window = { location: { hash: '', search: '', origin: 'http://localhost:3000' } };
function harness(client, intent = { recoveryLink: true, linkError: false }) {
  const values = [], effects = []; let cursor = 0;
  const react = { ...React, useState(initial) { const index = cursor++; if (!(index in values)) values[index] = initial;
    return [values[index], value => { values[index] = typeof value === 'function' ? value(values[index]) : value; }]; },
    useRef: () => ({ current: false }), useEffect: fn => { effects.push(fn); } };
  const { ManagerPasswordRecovery } = compile('src/debug/manager/ManagerPasswordRecovery.tsx', { react: { ...react, default: react }, './manager-password-recovery.ts': helper });
  const render = () => { cursor = 0; return ManagerPasswordRecovery({ client, ...intent }); };
  return { values, effects, render, html: () => renderToStaticMarkup(render()) };
}
await test('REAL_PAGE_NEVER_OFFERS_NEW_PASSWORD_WITHOUT_SERVER_USER', async () => {
  const h = harness({ auth: auth({ getUser: async () => ({ data: { user: null }, error: {} }) }) });
  h.render(); h.effects.forEach(run => run()); await new Promise(resolve => setImmediate(resolve));
  const html = h.html(); assert.match(html, /Enviar link de recuperação/); assert.doesNotMatch(html, /id="recovery-password"/);
});
await test('REAL_PAGE_SHOWS_VERIFIED_EMAIL_AND_NO_DEVICE_ACTIVATION', async () => {
  const h = harness({ auth: auth() }); h.render(); h.effects.forEach(run => run()); await new Promise(resolve => setImmediate(resolve));
  assert.match(h.html(), /owner@example.test/); assert.match(h.html(), /autoComplete="new-password"|autocomplete="new-password"/);
  assert.doesNotMatch(h.html(), /Código ID|Chave de 6|Ativar dispositivo/);
});
await test('EXPIRED_LINK_WITH_EXISTING_OTHER_SESSION_CANNOT_OPEN_PASSWORD_FORM', async () => {
  window.location.hash = '#error=access_denied&error_code=otp_expired';
  const h = harness({ auth: auth() }, { recoveryLink: true, linkError: true }); h.render(); h.effects.forEach(run => run()); await new Promise(resolve => setImmediate(resolve));
  assert.doesNotMatch(h.html(), /id="recovery-password"/); assert.match(h.html(), /link expirou/); window.location.hash = '';
});
await test('REQUEST_LINK_DOES_NOT_CHANGE_EXISTING_ADMIN_SESSION_PASSWORD', async () => {
  const h = harness({ auth: auth({ getUser: async () => { assert.fail('Request-only page checked old session'); } }) }, { recoveryLink: false, linkError: false });
  h.render(); h.effects.forEach(run => run());
  assert.match(h.html(), /Enviar link de recuperação/); assert.doesNotMatch(h.html(), /id="recovery-password"/);
});
function find(element, predicate) {
  if (!element || typeof element !== 'object') return undefined;
  if (predicate(element)) return element;
  for (const child of React.Children.toArray(element.props?.children)) { const value = find(child, predicate); if (value) return value; }
}
await test('ACCEPTED_EMAIL_REQUEST_BLOCKS_RESEND_AND_EXPLAINS_LATEST_MESSAGE', async () => {
  const a = auth(), h = harness({ auth: a }, { recoveryLink: false, linkError: false });
  h.render(); h.effects.forEach(run => run());
  find(h.render(), e => e.props?.id === 'recovery-email').props.onChange({ target: { value: 'owner@example.test' } });
  find(h.render(), e => e.type === 'form').props.onSubmit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.match(h.html(), /Reenviar em 60s/); assert.match(h.html(), /somente o email mais recente/);
  assert.equal(find(h.render(), e => e.type === 'button').props.disabled, true);
  find(h.render(), e => e.type === 'form').props.onSubmit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(a.calls.filter(c => c[0] === 'reset').length, 1);
});
await test('VERIFIED_RECOVERY_PAGE_SAVES_ACK_SIGNS_OUT_AND_CLEARS_PASSWORD_FIELDS', async () => {
  const a = auth(), h = harness({ auth: a });
  h.render(); h.effects.forEach(run => run()); await new Promise(resolve => setImmediate(resolve));
  assert.match(h.html(), /Definir nova senha/);
  for (const id of ['recovery-password', 'recovery-confirmation']) find(h.render(), e => e.props?.id === id).props.onChange({ target: { value: 'long-fixture-password' } });
  find(h.render(), e => e.type === 'form').props.onSubmit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.match(h.html(), /Senha atualizada/); assert.doesNotMatch(h.html(), /type="password"|long-fixture-password/);
  assert.deepEqual(a.calls, [['update', { password: 'long-fixture-password' }], ['logout', { scope: 'global' }]]);
});
console.log('C71_MANAGER_PASSWORD_RECOVERY=' + passed + '/'+ passed + '_PASS (isolated Auth; no real password changes)');
