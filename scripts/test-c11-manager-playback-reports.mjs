import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createPlaybackSupportDiagnostic, parsePlaybackDiagnostic, formatPlaybackDiagnostic } from '../src/playback/playback-support-diagnostic.ts';
import { navigateErrorControls } from '../src/ui/dpad-error-controls.ts';
import { canUsePlaybackWhatsapp } from '../src/ui/playback-support-profile.ts';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
let tests = 0;
async function test(name, run) { await run(); tests++; console.log('PASS ' + name); }
const report = createPlaybackSupportDiagnostic({ errorCode: 'NATIVE_ERROR', errorCategory: 'MEDIA_PARSER_FAILURE', media3ErrorCode: 3001, checkpoint: 'PLAYER_READY' },
  { page: 'series-detail', observedAtMs: 1791507600000, bundle: 'index-ABC123xy.js', userAgent: 'Android 16; Chrome/154.0.8037.106 Mobile' });
const id = '12345678-1234-4321-8234-123456789abc', id2 = '12345678-1234-4321-8234-123456789abd';
const leak = 'https://fixture.invalid/private?token=fixture-secret';

await test('WHATSAPP_PHONE_TABLET_ALLOWED_TV_PLATFORMS_EXCLUDED_WITHOUT_VIEWPORT_IDENTITY', () => {
  for (const ua of ['Android 16; SM-S926B Mobile', 'Android 16; SM-X610', 'iPad; CPU OS', 'Macintosh; Intel Mac OS']) assert.equal(canUsePlaybackWhatsapp(ua, 5), true);
  for (const ua of ['Android 9; AFTSSS Mobile', 'Linux; Tizen 8.0; Mobile', 'Web0S; Linux/SmartTV', 'webOS.TV',
    'Android TV; Mobile', 'Android; TV Box', 'Android; MiBOX3', 'Android 10; Generic Chrome']) assert.equal(canUsePlaybackWhatsapp(ua, ua.includes('Generic') ? 0 : 5), false);
  assert.equal(canUsePlaybackWhatsapp('Android 16; SM-X610', 0), false);
});

function compile(path, ports) {
  const module = { exports: {} };
  new Function('require', 'module', 'exports', ts.transpileModule(read(path), { compilerOptions: { target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText)(name => ports[name] || (() => { throw Error('Missing port: ' + name); })(), module, module.exports);
  return module.exports;
}
const { PlaybackErrorReportService } = compile('src/control-plane/client/playback-error-report.service.ts', {
  '../../integrations/supabase/client.ts': { getSupabaseBrowserClient: () => undefined },
  '../../device/device-identity.service.ts': { DeviceIdentityService: {} },
  '../../playback/playback-support-diagnostic.ts': { parsePlaybackDiagnostic, formatPlaybackDiagnostic },
});

await test('CLOSED_PROJECTION_ROUNDTRIP_AND_REMOTE_TEXT_REJECTED', () => {
  const parsed = parsePlaybackDiagnostic(report);
  assert.ok(parsed); assert.equal(Object.keys(parsed).length, 12); assert.equal(formatPlaybackDiagnostic(parsed), report);
  for (const invalid of [report + '\nURL=' + leak, report.replace('ERROR_CODE=NATIVE_ERROR', 'ERROR_CODE=' + leak),
    report.replace('MEDIA3_ERROR_CODE=3001', 'MEDIA3_ERROR_CODE=2147483648'), report.replace('UTC=', 'UTC=\nUTC='),
    report.replace(/UTC=[^\n]+/, 'UTC=2026-02-30T01:00:00.000Z'), report.replace('ANDROID=16', 'ANDROID=16\r')]) assert.equal(parsePlaybackDiagnostic(invalid), null);
  assert.equal(formatPlaybackDiagnostic({ ...parsed, URL: leak }), null);
});
await test('EXISTING_DEVICE_PROOF_ONLY_AND_TRUTHFUL_ACK', async () => {
  const calls = [], proof = { deviceId: 'fixture-device', deviceAuthToken: 'fixture-proof-only', status: 'AUTHORIZED' };
  const service = new PlaybackErrorReportService({ rpc: async (name, params) => { calls.push({ name, params }); return { data: { success: true, reportId: id } }; } }, async () => proof);
  assert.equal(await service.send(report, id), id);
  assert.equal(calls[0].name, 'rpc_device_report_playback_error'); assert.equal(calls[0].params.p_device_token, proof.deviceAuthToken);
  assert.deepEqual(Object.keys(calls[0].params).sort(), ['p_device_id', 'p_device_token', 'p_request_id', 'p_diagnostic'].sort());
  assert.deepEqual(calls[0].params.p_diagnostic, parsePlaybackDiagnostic(report));
  for (const state of [null, { ...proof, status: 'PENDING' }, { ...proof, deviceAuthToken: undefined }]) {
    await assert.rejects(new PlaybackErrorReportService({ rpc() { assert.fail('must not send'); } }, async () => state).send(report, id), /REPORT_UNAVAILABLE/);
  }
  await assert.rejects(service.send(leak, id), /REPORT_UNAVAILABLE/); assert.equal(calls.length, 1);
});
await test('TIMEOUT_ABORT_RETRY_ID_AND_RAW_REMOTE_ERROR_SANITIZED', async () => {
  let abortSignal, calls = 0;
  const rpc = { rpc(name, params) {
    assert.equal(params.p_request_id, id); calls++;
    if (calls === 1) { const hanging = new Promise(() => {}); hanging.abortSignal = signal => { abortSignal = signal; return hanging; }; return hanging; }
    return Promise.resolve({ data: { success: true, reportId: id } });
  } };
  const service = new PlaybackErrorReportService(rpc, async () => ({ deviceId: 'fixture', deviceAuthToken: 'fixture-proof', status: 'AUTHORIZED' }), 5);
  await assert.rejects(service.send(report, id), /REPORT_UNAVAILABLE/); assert.equal(abortSignal.aborted, true);
  assert.equal(await service.send(report, id), id); assert.equal(calls, 2);
  for (const data of [{ success: false, code: 'REPORT_RATE_LIMIT' }, { success: false, message: leak }, { success: true, reportId: leak }]) {
    await assert.rejects(new PlaybackErrorReportService({ rpc: async () => ({ data }) }, async () => ({ deviceId: 'fixture', deviceAuthToken: 'fixture-proof', status: 'AUTHORIZED' })).send(report, id),
      error => !error.message.includes('fixture') && ['REPORT_RATE_LIMIT', 'REPORT_UNAVAILABLE'].includes(error.message));
  }
});
const row = (reportId = id) => ({ id: reportId, receivedAt: '2026-10-09T02:00:00Z', displayCode: 'C57-FIXTURE', deviceLabel: 'Fixture TV', deviceType: 'TV',
  customerName: 'Fixture', diagnostic: parsePlaybackDiagnostic(report), read: false });
await test('MANAGER_SERVICE_PAGINATION_AND_MALICIOUS_PAYLOAD_REJECTED', async () => {
  const calls = [];
  const service = new PlaybackErrorReportService({ rpc: async (name, params) => { calls.push({ name, params }); return { data: { success: true, unreadCount: 2, reports: [row()], hasMore: true } }; } });
  const inbox = await service.inbox(id2); assert.equal(inbox.reports[0].diagnostic, report); assert.equal(inbox.unreadCount, 2);
  assert.equal(calls[0].params.p_before_id, id2); await service.markRead(id); assert.equal(calls.at(-1).params.p_report_id, id);
  for (const data of [{ success: true, reports: Array(51).fill(row()), unreadCount: 51, hasMore: true },
    { success: true, reports: [{ ...row(), diagnostic: { ...parsePlaybackDiagnostic(report), URL: leak } }], unreadCount: 1, hasMore: false },
    { success: true, reports: [row()], unreadCount: -1, hasMore: false }]) {
    await assert.rejects(new PlaybackErrorReportService({ rpc: async () => ({ data }) }).inbox(), /REPORT_UNAVAILABLE/);
  }
  const controller = new AbortController(); controller.abort();
  await assert.rejects(service.inbox(undefined, controller.signal), /REPORT_UNAVAILABLE/); assert.equal(calls.length, 2);
});

function harness(path, ports) {
  let cursor = 0, updates = 0;
  const states = [], refs = [], memos = [], effects = new Map(), pending = [];
  const memo = (callback, deps) => { const index = cursor++, old = memos[index];
    if (!old || deps.some((value, i) => !Object.is(value, old.deps[i]))) memos[index] = { deps, value: callback() };
    return memos[index].value; };
  const hooks = { ...React, useState(initial) { const index = cursor++; if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
    return [states[index], next => { updates++; states[index] = typeof next === 'function' ? next(states[index]) : next; }]; },
  useRef(initial) { return refs[cursor++] ||= { current: initial }; }, useMemo: memo, useCallback: (callback, deps) => memo(() => callback, deps),
  useEffect(callback, deps) { const index = cursor++, old = effects.get(index);
    if (old && deps.every((value, i) => Object.is(value, old.deps[i]))) return;
    pending.push(() => { old?.cleanup?.(); effects.set(index, { deps, cleanup: callback() }); }); } };
  const component = compile(path, { ...ports, react: { default: hooks, ...hooks } });
  return { render(name, props) { cursor = 0; return component[name](props); }, effects() { while (pending.length) pending.shift()(); },
    cleanup() { for (const effect of effects.values()) effect.cleanup?.(); effects.clear(); }, get updates() { return updates; } };
}
const nodes = tree => { const list = []; const walk = node => { if (!React.isValidElement(node)) return; list.push(node); React.Children.forEach(node.props.children, walk); }; walk(tree); return list; };
const button = (tree, label) => nodes(tree).find(node => node.type === 'button' && node.props.children === label);
const saved = Object.fromEntries(['window', 'document', 'HTMLElement', 'requestAnimationFrame', 'cancelAnimationFrame', 'navigator'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
const listeners = new Map(), timers = new Map(), polls = new Map(), frames = new Map();
let timerId = 0, copies = [];
globalThis.HTMLElement = class { isConnected = true; focus() { document.activeElement = this; } scrollIntoView() {} };
globalThis.document = { activeElement: null, visibilityState: 'visible' };
globalThis.window = { addEventListener(name, fn) { listeners.set(name, fn); }, removeEventListener(name, fn) { if (listeners.get(name) === fn) listeners.delete(name); },
  setTimeout(fn, ms) { assert.equal(ms, 10000); const id = ++timerId; timers.set(id, fn); return id; }, clearTimeout(id) { timers.delete(id); },
  setInterval(fn, ms) { assert.equal(ms, 30000); const id = ++timerId; polls.set(id, fn); return id; }, clearInterval(id) { polls.delete(id); } };
globalThis.requestAnimationFrame = fn => { const id = ++timerId; frames.set(id, fn); return id; };
globalThis.cancelAnimationFrame = id => frames.delete(id);
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { async writeText(value) { copies.push(value); } } } });

const noticePorts = {
  '@capacitor/browser': { Browser: { open() { assert.fail('TV/tablet cannot use WhatsApp'); } } },
  '../../control-plane/client/multi-device-contact.service.ts': { getMultiDeviceContactService() { assert.fail('TV/tablet does not fetch WhatsApp'); } },
  '../../playback/playback-support-diagnostic.ts': { whatsappPlaybackSupportUrl: () => '' },
  '../hooks/usePhoneLayout.ts': { usePhoneLayout: () => false }, '../dpad-error-controls.ts': { navigateErrorControls },
  '../playback-support-profile.ts': { canUsePlaybackWhatsapp: () => false },
  '../../playback/google-cast.ts': { hasGoogleCast: () => false, GoogleCast: {} },
};
try {
  await test('REAL_TABLET_WHATSAPP_VISIBLE_CONTACT_READ_AND_NATIVE_TV_VETO_WITH_LATE_CLEANUP', async () => {
    for (const native of [false, true, 'tv', 'late', 'reject']) {
      let contactReads = 0, statusReads = 0, resolveStatus;
      const ui = harness('src/ui/components/PlaybackErrorNotice.tsx', { ...noticePorts,
        '../playback-support-profile.ts': { canUsePlaybackWhatsapp: () => true },
        '../../control-plane/client/multi-device-contact.service.ts': { getMultiDeviceContactService: () => ({ readPublic: async () => { contactReads++; return { whatsapp: '' }; } }) },
        '../../playback/google-cast.ts': { hasGoogleCast: () => !!native, GoogleCast: { status() { statusReads++;
          if (native === 'late') return new Promise(resolve => { resolveStatus = resolve; });
          if (native === 'reject') return Promise.reject(Error('Native status unavailable'));
          return Promise.resolve({ mobile: native !== 'tv' }); } } },
        '../../control-plane/client/playback-error-report.service.ts': { createPlaybackReportRequestId: () => id, getPlaybackErrorReportService: () => ({}) },
      });
      const props = { message: 'Falha controlada', diagnostic: report, onDismiss() {} };
      let tree = ui.render('PlaybackErrorNotice', props); ui.effects();
      if (native === 'late') { ui.cleanup(); resolveStatus({ mobile: true }); await flush(); assert.equal(contactReads, 0); continue; }
      await flush(); tree = ui.render('PlaybackErrorNotice', props); ui.effects();
      assert.equal(!!button(tree, 'WhatsApp'), native !== 'tv');
      assert.equal(contactReads, native === 'tv' ? 0 : 1); assert.equal(statusReads, native ? 1 : 0);
      ui.cleanup();
    }
    frames.clear();
  });
  await test('REAL_NOTICE_TV_NO_WHATSAPP_SEND_DEDUP_ACK_AND_BACK_FOCUS', async () => {
    let attempts = [], resolveSend, generated = 0, dismissals = 0;
    const previous = new HTMLElement(); previous.focus();
    const ui = harness('src/ui/components/PlaybackErrorNotice.tsx', { ...noticePorts,
      '../../control-plane/client/playback-error-report.service.ts': { createPlaybackReportRequestId() { generated++; return id; },
        getPlaybackErrorReportService: () => ({ send(text, requestId, signal) { attempts.push({ text, requestId, signal }); return new Promise(resolve => { resolveSend = resolve; }); } }) } });
    const props = { message: 'Falha técnica controlada.', diagnostic: report, onDismiss() { dismissals++; } };
    let tree = ui.render('PlaybackErrorNotice', props);
    const send = new HTMLElement(); tree.ref.current = { contains: () => false, querySelector: () => send };
    ui.effects(); [...frames.values()].forEach(fn => fn()); frames.clear(); assert.equal(document.activeElement, send);
    assert.doesNotMatch(renderToStaticMarkup(tree), /WhatsApp/); assert.match(renderToStaticMarkup(tree), /Enviar ao gestor/);
    tree.props.onFocus(); tree = ui.render('PlaybackErrorNotice', props); ui.effects(); assert.equal(timers.size, 0);
    const action = button(tree, 'Enviar ao gestor'); action.props.onClick(); action.props.onClick(); await flush();
    assert.equal(attempts.length, 1); assert.equal(attempts[0].text, report); assert.equal(generated, 1);
    tree = ui.render('PlaybackErrorNotice', props); ui.effects(); assert.doesNotMatch(renderToStaticMarkup(tree), /Erro enviado ao gestor/);
    resolveSend(id); await flush(); tree = ui.render('PlaybackErrorNotice', props); ui.effects();
    assert.match(renderToStaticMarkup(tree), /Erro enviado ao gestor/); assert.equal(button(tree, 'Enviado ao gestor').props.disabled, true);
    listeners.get('xandeflix:playback-error-back')({ preventDefault() {} });
    assert.equal(dismissals, 1); assert.equal(document.activeElement, previous); ui.cleanup(); assert.equal(attempts[0].signal.aborted, true);
  });
  await test('REAL_NOTICE_FAILURE_REUSES_ID_AND_LATE_SUCCESS_IGNORED', async () => {
    const requests = []; let resolveSend, rejectSend, generated = 0;
    const ui = harness('src/ui/components/PlaybackErrorNotice.tsx', { ...noticePorts,
      '../../control-plane/client/playback-error-report.service.ts': { createPlaybackReportRequestId() { generated++; return id; },
        getPlaybackErrorReportService: () => ({ send(text, requestId) { requests.push(requestId); return new Promise((resolve, reject) => { resolveSend = resolve; rejectSend = reject; }); } }) } });
    const props = { message: 'Falha', diagnostic: report, onDismiss() {} };
    let tree = ui.render('PlaybackErrorNotice', props); ui.effects();
    button(tree, 'Enviar ao gestor').props.onClick(); await flush(); rejectSend(Error(leak)); await flush();
    tree = ui.render('PlaybackErrorNotice', props); ui.effects(); assert.match(renderToStaticMarkup(tree), /Não foi possível enviar ao gestor/); assert.doesNotMatch(renderToStaticMarkup(tree), /fixture-secret/);
    button(tree, 'Enviar ao gestor').props.onClick(); await flush(); assert.deepEqual(requests, [id, id]); assert.equal(generated, 1);
    ui.cleanup(); const before = ui.updates; resolveSend(id); await flush(); assert.equal(ui.updates, before);
  });
  await test('REAL_NOTICE_CLIPBOARD_FALLBACK_DISABLED_BUTTON_FOCUS_RESTORED_AFTER_COMMIT', async () => {
    const copy = Object.assign(new HTMLElement(), { disabled: false, focus() { if (!this.disabled) document.activeElement = this; } });
    const close = new HTMLElement(), body = { appendChild() {} }, field = { style: {}, select() { document.activeElement = field; }, remove() { document.activeElement = body; } };
    document.body = body; document.createElement = () => field; document.execCommand = () => true;
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { async writeText() { throw Error('Denied in WebView'); } } } });
    const ui = harness('src/ui/components/PlaybackErrorNotice.tsx', { ...noticePorts,
      '../../control-plane/client/playback-error-report.service.ts': { createPlaybackReportRequestId: () => id, getPlaybackErrorReportService: () => ({}) } });
    const props = { message: 'Falha', diagnostic: report, onDismiss() {} };
    let tree = ui.render('PlaybackErrorNotice', props);
    tree.ref.current = { contains: target => target === copy || target === close, querySelector: () => close };
    ui.effects(); [...frames.values()].forEach(fn => fn()); frames.clear(); copy.focus();
    button(tree, 'Copiar diagnóstico').props.onClick();
    tree = ui.render('PlaybackErrorNotice', props); copy.disabled = button(tree, 'Copiar diagnóstico').props.disabled; ui.effects();
    assert.equal(copy.disabled, true); await flush();
    assert.equal(document.activeElement, body, 'disabled button cannot receive fallback focus');
    [...frames.values()].forEach(fn => fn()); frames.clear();
    assert.equal(document.activeElement, body, 'an animation frame before the React commit must not restore a disabled control');
    tree = ui.render('PlaybackErrorNotice', props); copy.disabled = button(tree, 'Copiar diagnóstico').props.disabled;
    assert.equal(copy.disabled, false); ui.effects(); assert.equal(document.activeElement, copy, 'restore after controls are enabled');
    assert.match(renderToStaticMarkup(tree), /Diagnóstico copiado/); ui.cleanup();
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { async writeText(value) { copies.push(value); } } } });
  });
  await test('ORDERED_DPAD_DISABLED_SKIP_CENTER_ONCE_AND_BACK', () => {
    let clicked = 0, closed = 0, prevented = 0, stopped = 0;
    const controls = Array.from({ length: 3 }, () => Object.assign(new HTMLElement(), { click() { clicked++; } }));
    const event = key => ({ key, currentTarget: { querySelectorAll: () => controls }, preventDefault() { prevented++; }, stopPropagation() { stopped++; } });
    controls[0].focus(); navigateErrorControls(event('ArrowRight'), () => closed++); assert.equal(document.activeElement, controls[1]);
    navigateErrorControls(event('ArrowDown'), () => closed++); assert.equal(document.activeElement, controls[2]);
    navigateErrorControls(event('ArrowDown'), () => closed++); assert.equal(document.activeElement, controls[2]);
    navigateErrorControls(event('ArrowUp'), () => closed++); assert.equal(document.activeElement, controls[1]);
    navigateErrorControls(event('Enter'), () => closed++); navigateErrorControls({ ...event('Enter'), repeat: true }, () => closed++); assert.equal(clicked, 1);
    navigateErrorControls(event('Escape'), () => closed++); assert.equal(closed, 1); assert.equal(prevented, stopped);
    controls[0].focus(); const filtered = { ...event('ArrowRight'), currentTarget: { querySelectorAll(selector) { assert.match(selector, /not\(\[disabled\]\)/); return [controls[0], controls[2]]; } } };
    navigateErrorControls(filtered, () => {}); assert.equal(document.activeElement, controls[2]);
  });
  await test('REAL_MANAGER_BELL_READ_COPY_PAGING_POLL_AND_LOGOUT', async () => {
    let listCalls = [], readCalls = [], resolveRead;
    const service = { async inbox(beforeId, signal) { listCalls.push({ beforeId, signal }); return { unreadCount: 2, reports: [{ ...row(beforeId ? id2 : id), diagnostic: report }], hasMore: !beforeId }; },
      markRead(reportId) { readCalls.push(reportId); return new Promise(resolve => { resolveRead = resolve; }); } };
    const ui = harness('src/debug/manager/ManagerPlaybackErrors.tsx', {
      '../../control-plane/client/playback-error-report.service.ts': { getPlaybackErrorReportService: () => service },
      '../../ui/components/PlaybackErrorNotice.tsx': { copyDiagnostic: async value => copies.push(value) },
      '../../ui/dpad-error-controls.ts': { navigateErrorControls },
    });
    const props = { userId: id }; let tree = ui.render('ManagerPlaybackErrors', props); ui.effects(); await flush(); tree = ui.render('ManagerPlaybackErrors', props); ui.effects();
    assert.match(renderToStaticMarkup(tree), /Relatos de erro: 2 não lidos/); assert.equal(listCalls.length, 1);
    const bell = nodes(tree).find(node => node.props['aria-haspopup'] === 'dialog');
    const modal = nodes(tree).find(node => node.type === 'dialog'); let opened = 0; bell.ref.current = new HTMLElement();
    modal.ref.current = { showModal() { opened++; }, close() {}, querySelector: () => new HTMLElement() };
    bell.props.onClick(); await flush(); tree = ui.render('ManagerPlaybackErrors', props); ui.effects(); assert.equal(opened, 1);
    const count = listCalls.length; [...polls.values()].forEach(fn => fn()); await flush(); assert.equal(listCalls.length, count, 'reading pauses background replacement');
    nodes(tree).find(node => node.props.className?.includes('manager-error-report--unread')).props.onClick(); await flush();
    tree = ui.render('ManagerPlaybackErrors', props); ui.effects(); assert.match(renderToStaticMarkup(tree), /2 não lidos/);
    resolveRead(); await flush(); tree = ui.render('ManagerPlaybackErrors', props); ui.effects(); assert.match(renderToStaticMarkup(tree), /1 não lidos/); assert.deepEqual(readCalls, [id]);
    button(tree, 'Copiar diagnóstico').props.onClick(); await flush(); assert.equal(copies.at(-1), report);
    button(tree, 'Carregar mais relatos').props.onClick(); await flush(); tree = ui.render('ManagerPlaybackErrors', props); ui.effects(); assert.equal(listCalls.at(-1).beforeId, id);
    assert.equal(nodes(tree).filter(node => node.props.className?.startsWith('focusable-item manager-error-report')).length, 2);
    button(tree, 'Fechar').props.onClick(); tree = ui.render('ManagerPlaybackErrors', props); ui.effects();
    document.visibilityState = 'hidden'; const calls = listCalls.length; [...polls.values()].forEach(fn => fn()); await flush(); assert.equal(listCalls.length, calls);
    document.visibilityState = 'visible'; [...polls.values()].forEach(fn => fn()); await flush(); assert.equal(listCalls.length, calls + 1);
    assert.equal(ui.render('ManagerPlaybackErrors', {}), null); ui.effects(); assert.equal(listCalls[0].signal.aborted, true); ui.cleanup(); assert.equal(polls.size, 0);
  });
  await test('REAL_MANAGER_REMOTE_FAILURE_AND_STALE_RESPONSE_AFTER_LOGOUT', async () => {
    let resolveList, signal;
    const ui = harness('src/debug/manager/ManagerPlaybackErrors.tsx', {
      '../../control-plane/client/playback-error-report.service.ts': { getPlaybackErrorReportService: () => ({ inbox(_id, nextSignal) { signal = nextSignal; return new Promise(resolve => { resolveList = resolve; }); } }) },
      '../../ui/components/PlaybackErrorNotice.tsx': { copyDiagnostic: async () => {} }, '../../ui/dpad-error-controls.ts': { navigateErrorControls },
    });
    ui.render('ManagerPlaybackErrors', { userId: id }); ui.effects(); ui.render('ManagerPlaybackErrors', {}); ui.effects();
    const updates = ui.updates; resolveList({ unreadCount: 1, reports: [{ ...row(), diagnostic: report }], hasMore: false }); await flush();
    assert.equal(ui.updates, updates); assert.equal(signal.aborted, true); assert.equal(ui.render('ManagerPlaybackErrors', {}), null); ui.cleanup();
  });
  await test('REAL_MANAGER_FAILED_QUERY_IS_VISIBLE_AND_RECOVERS', async () => {
    let attempts = 0;
    const ui = harness('src/debug/manager/ManagerPlaybackErrors.tsx', {
      '../../control-plane/client/playback-error-report.service.ts': { getPlaybackErrorReportService: () => ({ async inbox() {
        attempts++; if (attempts === 1) throw Error(leak); return { unreadCount: 1, reports: [{ ...row(), diagnostic: report }], hasMore: false };
      } }) }, '../../ui/components/PlaybackErrorNotice.tsx': { copyDiagnostic: async () => {} }, '../../ui/dpad-error-controls.ts': { navigateErrorControls },
    });
    const props = { userId: id }; ui.render('ManagerPlaybackErrors', props); ui.effects(); await flush();
    let tree = ui.render('ManagerPlaybackErrors', props); ui.effects();
    assert.match(renderToStaticMarkup(tree), /Não foi possível consultar os relatos/);
    assert.doesNotMatch(renderToStaticMarkup(tree), /fixture-secret|Nenhum erro reportado/);
    button(tree, 'Atualizar relatos').props.onClick(); await flush(); tree = ui.render('ManagerPlaybackErrors', props); ui.effects();
    assert.match(renderToStaticMarkup(tree), /1 não lidos/); assert.doesNotMatch(renderToStaticMarkup(tree), /Não foi possível consultar/); ui.cleanup();
  });
  await test('REAL_APP_NATIVE_BACK_CLOSES_NOTICE_AT_HOME_BEFORE_EXIT_AND_DIALOG', async () => {
    const source = ts.createSourceFile('App.tsx', read('src/App.tsx'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let backNode, effectNode;
    const visit = node => {
      if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'handleBack') backNode = node.initializer.arguments[0];
      if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect' && node.arguments[0]?.getText(source).includes('void addNativeAndroidBackButtonListener')) effectNode = node.arguments[0];
      ts.forEachChild(node, visit);
    }; visit(source); assert.ok(backNode && effectNode);
    let notice = true, openedDialog = false, listener, exit = 0, routes = 0, closed = 0;
    const doc = { querySelector(selector) { if (selector.includes('.playback-error-notice')) return notice || openedDialog ? {} : null;
      return openedDialog ? { close() { openedDialog = false; closed++; } } : null; } };
    const bindings = { window: { dispatchEvent() { if (notice) { notice = false; return false; } return true; } }, document: doc,
      setRouteState() { routes++; }, navigateBack: () => {}, Event };
    const load = (node, ports) => new Function(...Object.keys(ports),
      ts.transpileModule('return (' + node.getText(source) + ');', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText)(...Object.values(ports));
    const handleBack = load(backNode, bindings);
    const effect = load(effectNode, { ...bindings, handleBack, routeStateRef: { current: { current: { view: 'home' }, history: [] } },
      Capacitor: { isNativePlatform: () => true }, addNativeAndroidBackButtonListener: async callback => { listener = callback; return { remove: async () => {} }; }, finishNativeAndroidApp: async () => { exit++; } });
    const cleanup = effect(); await flush(); listener(); assert.equal(notice, false); assert.equal(exit, 0); assert.equal(routes, 0);
    openedDialog = true; listener(); assert.equal(closed, 1); assert.equal(exit, 0); listener(); assert.equal(exit, 1); cleanup();
  });
} finally {
  for (const key of Object.keys(saved)) { if (saved[key]) Object.defineProperty(globalThis, key, saved[key]); else delete globalThis[key]; }
}
console.log(`C11_MANAGER_PLAYBACK_REPORTS=PASS tests=${tests} (no live messages)`);
