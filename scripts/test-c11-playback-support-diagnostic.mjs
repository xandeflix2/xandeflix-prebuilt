import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createPlaybackSupportDiagnostic, whatsappPlaybackSupportUrl } from '../src/playback/playback-support-diagnostic.ts';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
let tests = 0;
async function test(name, run) { await run(); console.log('PASS ' + name); tests++; }
const event = { errorCode: 'NATIVE_ERROR', errorCategory: 'HTTP_ERROR', httpStatus: 401 };
const context = { page: 'movie-detail', observedAtMs: 1791486000000, bundle: 'index-ABC123xy.js', userAgent: 'Mozilla/5.0 (Linux; Android 16; fixture) Chrome/140.0.7339.207 Mobile Safari/537.36' };
const report = createPlaybackSupportDiagnostic(event, context);
await test('REAL_HTTP_REPORT_VERSION_BUNDLE_TIME_NO_INVENTED_MEDIA3_CODE', () => {
  assert.match(report, /ERROR_CODE=NATIVE_ERROR\nERROR_CATEGORY=HTTP_ERROR\nHTTP_STATUS=401/);
  assert.match(report, /ANDROID=16\nWEBVIEW_CHROME=140.0.7339.207/);
  assert.match(report, /BUNDLE=index-ABC123xy.js/);
  assert.match(report, /PAGE=movie-detail/);
  assert.equal(report, createPlaybackSupportDiagnostic(event, context));
  assert.ok(report.length < 1400);
  assert.ok(!report.includes('2004'));
  for (const errorCode of [undefined, '', ' ', null, 12]) assert.equal(createPlaybackSupportDiagnostic({ ...event, errorCode }, context), null);
});
await test('MALICIOUS_UNKNOWN_VALUES_NEVER_LEAK', () => {
  const raw = 'https://fixture.invalid/private?token=fixture-secret\nAuthorization: Bearer fixture-secret';
  const result = createPlaybackSupportDiagnostic({ ...event, errorCode: raw, errorCategory: raw, httpStatus: raw, headers: { Authorization: raw }, uri: raw, title: raw, sourceId: raw, stack: raw }, { page: raw, bundle: raw, userAgent: raw, observedAtMs: NaN });
  assert.doesNotMatch(result, /fixture|Authorization|https|token|private|sourceId|stack/);
  assert.match(result, /ERROR_CODE=UNKNOWN\nERROR_CATEGORY=UNKNOWN\nHTTP_STATUS=UNAVAILABLE/);
  for (const status of ['401', 399, 600, 401.5, NaN, Infinity, null]) assert.match(createPlaybackSupportDiagnostic({ ...event, httpStatus: status }, context), /HTTP_STATUS=UNAVAILABLE/);
  assert.match(createPlaybackSupportDiagnostic({ ...event, errorCategory: 'DECODER_ERROR' }, context), /HTTP_STATUS=UNAVAILABLE/);
});
await test('EXACT_NATIVE_MEDIA3_CODE_OPTIONAL_LEGACY_AND_CHECKPOINT_ALLOWLIST', () => {
  const actual = createPlaybackSupportDiagnostic({ ...event, media3ErrorCode: 2004, checkpoint: 'DATASOURCE_OPEN' }, context);
  assert.match(actual, /HTTP_STATUS=401\nMEDIA3_ERROR_CODE=2004\nCHECKPOINT=DATASOURCE_OPEN/);
  assert.match(report, /MEDIA3_ERROR_CODE=UNAVAILABLE\nCHECKPOINT=UNKNOWN/);
  for (const media3ErrorCode of ['2004', 999, -1, NaN, Infinity, 2004.5, 2147483648]) {
    const result = createPlaybackSupportDiagnostic({ ...event, media3ErrorCode, checkpoint: 'https://fixture.invalid/?token=fixture-secret' }, context);
    assert.match(result, /MEDIA3_ERROR_CODE=UNAVAILABLE\nCHECKPOINT=UNKNOWN/); assert.doesNotMatch(result, /fixture|token|https/);
  }
});
await test('WHATSAPP_PUBLIC_HOST_VALID_NUMBER_UTF8_RECIPIENT_FALLBACK', () => {
  for (const phone of [undefined, '', 'javascript:fixture-secret', '123\n456', '012345678']) {
    const url = new URL(whatsappPlaybackSupportUrl(report, phone));
    assert.equal(url.origin, 'https://wa.me'); assert.equal(url.pathname, '/');
    assert.equal(url.searchParams.get('text'), 'Olá! Preciso de ajuda com um erro de reprodução no Xandeflix.\n\n' + report);
  }
  assert.equal(new URL(whatsappPlaybackSupportUrl(report, '5511999999999')).pathname, '/5511999999999');
  assert.ok(!decodeURIComponent(whatsappPlaybackSupportUrl('fixture-secret')).includes('fixture-secret'));
});

function harness(bindings) {
  let cursor = 0, updates = 0;
  const values = [], refs = [], effects = new Map(), pending = [];
  const hooks = { ...React,
    useState(initial) { const index = cursor++; if (!(index in values)) values[index] = typeof initial === 'function' ? initial() : initial;
      return [values[index], next => { updates++; values[index] = typeof next === 'function' ? next(values[index]) : next; }]; },
    useRef(initial) { return refs[cursor++] ||= { current: initial }; },
    useEffect(callback, deps) { const index = cursor++, old = effects.get(index);
      if (old && deps.every((value, i) => Object.is(value, old.deps[i]))) return;
      pending.push(() => { old?.cleanup?.(); effects.set(index, { deps, cleanup: callback() }); }); },
  };
  const module = { exports: {} };
  const require = name => name === 'react' ? { default: hooks, ...hooks } : bindings[name] || (() => { throw Error('Missing controlled dependency ' + name); })();
  new Function('require', 'module', 'exports', ts.transpileModule(read('src/ui/components/PlaybackErrorNotice.tsx'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText)(require, module, module.exports);
  return { render(props) { cursor = 0; return module.exports.PlaybackErrorNotice(props); }, effects() { while (pending.length) pending.shift()(); }, cleanup() { for (const effect of effects.values()) effect.cleanup?.(); }, get updates() { return updates; } };
}
const nodes = tree => { const result = []; const walk = node => { if (!React.isValidElement(node)) return; result.push(node); React.Children.forEach(node.props.children, walk); }; walk(tree); return result; };
const button = (tree, label) => nodes(tree).find(node => node.type === 'button' && node.props.children === label);
const saved = Object.fromEntries(['navigator', 'window', 'document', 'HTMLElement'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
let reads = 0, resolveContact, signal, opened = [], copied = [], timeoutId = 0;
const timers = new Map();
globalThis.window = { addEventListener() {}, removeEventListener() {}, setTimeout(callback, milliseconds) { assert.equal(milliseconds, 10000); const id = ++timeoutId; timers.set(id, callback); return id; }, clearTimeout(id) { timers.delete(id); } };
globalThis.document = { activeElement: null };
globalThis.HTMLElement = class {};
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { async writeText(text) { copied.push(text); } } } });
const ports = {
  '@capacitor/browser': { Browser: { async open(options) { opened.push(options); } } },
  '../../control-plane/client/multi-device-contact.service.ts': { getMultiDeviceContactService: () => ({ readPublic(abortSignal) { reads++; signal = abortSignal; return new Promise(resolve => { resolveContact = resolve; }); } }) },
  '../../playback/playback-support-diagnostic.ts': { whatsappPlaybackSupportUrl },
  '../../control-plane/client/playback-error-report.service.ts': { createPlaybackReportRequestId: () => 'fixture', getPlaybackErrorReportService: () => ({}) },
    '../hooks/usePhoneLayout.ts': { usePhoneLayout: () => true },
    '../playback-support-profile.ts': { canUsePlaybackWhatsapp: () => true },
    '../../playback/google-cast.ts': { hasGoogleCast: () => false, GoogleCast: {} },
  '../dpad-error-controls.ts': { navigateErrorControls: () => {} },
};
try {
  await test('REAL_NOTICE_NO_MESSAGE_NO_REMOTE_READ_AND_CONTACT_ABORT_LATE_IGNORED', async () => {
    const ui = harness(ports); let tree = ui.render({ message: null, diagnostic: report, onDismiss() {} }); ui.effects();
    assert.equal(tree, null); assert.equal(reads, 0); assert.equal(timers.size, 0);
    tree = ui.render({ message: 'HTTP 401', diagnostic: report, onDismiss() {} }); ui.effects();
    assert.equal(reads, 1); assert.equal(timers.size, 1);
    assert.match(renderToStaticMarkup(tree), /WhatsApp/); assert.match(renderToStaticMarkup(tree), /Copiar diagnóstico/);
    ui.cleanup(); assert.equal(signal.aborted, true); assert.equal(timers.size, 0);
    const updates = ui.updates; resolveContact({ whatsapp: '5511999999999' }); await flush(); assert.equal(ui.updates, updates);
  });
  await test('REAL_NOTICE_COPY_WHATSAPP_CONTACT_AND_TIMER_PAUSE_WHILE_FOCUSED', async () => {
    const ui = harness(ports), props = { message: 'HTTP 401', diagnostic: report, onDismiss() {} };
    let tree = ui.render(props); ui.effects(); resolveContact({ whatsapp: '5511999999999' }); await flush(); tree = ui.render(props); ui.effects();
    tree.props.onFocus(); tree = ui.render(props); ui.effects(); assert.equal(timers.size, 0);
    button(tree, 'Copiar diagnóstico').props.onClick(); await flush(); tree = ui.render(props); ui.effects();
    assert.equal(copied.at(-1), report); assert.match(renderToStaticMarkup(tree), /Diagnóstico copiado/);
    button(tree, 'WhatsApp').props.onClick(); await flush(); tree = ui.render(props); ui.effects();
    assert.equal(opened.length, 1); assert.equal(new URL(opened[0].url).pathname, '/5511999999999'); assert.ok(new URL(opened[0].url).searchParams.get('text').includes(report));
    tree.props.onBlur({ currentTarget: { contains: () => false }, relatedTarget: null }); tree = ui.render(props); ui.effects(); assert.equal(timers.size, 1);
    ui.cleanup();
  });
  await test('REAL_NOTICE_DEFAULT_DISMISS_LATEST_CALLBACK_AND_CONTROLLED_FALLBACK', async () => {
    let old = 0, latest = 0, fallbackCopies = 0, removals = 0, restored = 0;
    const ui = harness(ports), props = { message: 'HTTP 401', diagnostic: report, onDismiss() { old++; } };
    ui.render(props); ui.effects(); ui.render({ ...props, onDismiss() { latest++; } }); ui.effects();
    [...timers.values()][0](); assert.equal(old, 0); assert.equal(latest, 1);
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { writeText: async () => { throw Error('Permission denied'); } } } });
    globalThis.HTMLElement = class {}; const previous = new globalThis.HTMLElement(); previous.isConnected = true; previous.focus = () => { restored++; };
    const field = { value: '', style: {}, select() { assert.equal(this.value, report); }, remove() { removals++; } };
    globalThis.document = { activeElement: previous, createElement(tag) { assert.equal(tag, 'textarea'); return field; }, body: { appendChild(node) { assert.equal(node, field); } }, execCommand(command) { assert.equal(command, 'copy'); fallbackCopies++; return true; } };
    button(ui.render(props), 'Copiar diagnóstico').props.onClick(); await flush();
    assert.equal(fallbackCopies, 1); assert.equal(removals, 1); assert.equal(restored, 1); ui.cleanup();
  });
  await test('REAL_NOTICE_CONTACT_FAILURE_AND_ACTION_FAILURE_DO_NOT_EXPOSE_RAW_ERROR', async () => {
    const ui = harness({ ...ports, '@capacitor/browser': { Browser: { open: async () => { throw Error('https://fixture.invalid/private?token=fixture-secret'); } } },
      '../../control-plane/client/multi-device-contact.service.ts': { getMultiDeviceContactService: () => ({ readPublic: async () => { throw Error('fixture-secret'); } }) } });
    const props = { message: 'HTTP 401', diagnostic: report, onDismiss() {} }; let tree = ui.render(props); ui.effects(); await flush();
    button(tree, 'WhatsApp').props.onClick(); await flush(); tree = ui.render(props); ui.effects();
    const html = renderToStaticMarkup(tree); assert.match(html, /Não foi possível abrir o WhatsApp/); assert.doesNotMatch(html, /fixture-secret|https/); ui.cleanup();
  });
} finally { for (const key of Object.keys(saved)) { if (saved[key]) Object.defineProperty(globalThis, key, saved[key]); else delete globalThis[key]; } }
console.log(`C11_PLAYBACK_SUPPORT_DIAGNOSTIC=PASS tests=${tests}`);
