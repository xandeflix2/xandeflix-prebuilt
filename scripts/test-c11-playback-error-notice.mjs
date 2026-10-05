import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { addNativePlayerResumeListener } from '../src/playback/native-android-player.bridge.ts';
import { getNativePlaybackErrorNotice, handleNativePlayerReturn } from '../src/playback/native-playback-error-notice.ts';

let passed = 0;
async function test(name, run) {
  await run();
  passed += 1;
  console.log(`PASS ${name}`);
}
const error = (errorCategory, httpStatus) => ({ positionMs: 3500, ended: false, errorCode: 'NATIVE_ERROR', errorCategory, httpStatus });
const leak = 'https://fixture.example.invalid/private?token=fixture-secret Authorization: Bearer fixture-secret';
const flush = () => new Promise((resolve) => setImmediate(resolve));

await test('HTTP_STATUS_MESSAGES_AND_LIMITS', () => {
  for (const status of [400, 401, 403, 404, 429, 500, 503, 599]) {
    assert.match(getNativePlaybackErrorNotice(error('HTTP_ERROR', status)), new RegExp(`HTTP ${status}`));
  }
  assert.match(getNativePlaybackErrorNotice(error('HTTP_ERROR', 404)), /não encontrou/);
  assert.match(getNativePlaybackErrorNotice(error('HTTP_ERROR', 403)), /fonte recusou/);
  assert.match(getNativePlaybackErrorNotice(error('HTTP_ERROR', 503)), /temporariamente indisponível/);
  for (const status of [null, undefined, '404', NaN, Infinity, 399, 600, 404.5, leak]) {
    assert.doesNotMatch(getNativePlaybackErrorNotice(error('HTTP_ERROR', status)), /HTTP|fixture-secret/);
  }
});
await test('CONTROLLED_CATEGORY_MESSAGES', () => {
  const cases = {
    NETWORK_TIMEOUT: /conexão ou tempo esgotado/,
    DECODER_ERROR: /decodificar/,
    SOURCE_UNAVAILABLE: /ler o vídeo/,
    MEDIA_PARSER_FAILURE: /formato do vídeo/,
    MEDIA_ERROR: /processar este vídeo/,
    UNKNOWN: /Não foi possível reproduzir/,
  };
  for (const [category, expected] of Object.entries(cases)) {
    assert.match(getNativePlaybackErrorNotice(error(category, 404)), expected);
    assert.doesNotMatch(getNativePlaybackErrorNotice(error(category, 404)), /HTTP/);
  }
});
await test('LEGACY_EVENT_AND_RAW_DATA_NEVER_RENDERED', () => {
  const generic = getNativePlaybackErrorNotice({ errorCode: 'NATIVE_ERROR' });
  assert.ok(generic);
  assert.equal(getNativePlaybackErrorNotice({ ...error(leak, leak), errorCode: leak, message: leak, stack: leak, headers: { Authorization: leak } }), generic);
  assert.doesNotMatch(generic, /fixture|https|Authorization|licença|ativação/i);
});
await test('BACK_AND_COMPLETION_HAVE_NO_FALSE_ALERT', async () => {
  for (const [event, reason] of [[{ ended: false }, 'USER_EXIT'], [{ ended: true }, 'COMPLETION']]) {
    const reasons = [], notices = [];
    await handleNativePlayerReturn({ ...event, errorCategory: 'HTTP_ERROR', httpStatus: 404 }, async (value) => { reasons.push(value); }, (value) => notices.push(value));
    assert.deepEqual(reasons, [reason]);
    assert.deepEqual(notices, [null]);
  }
  for (const errorCode of [undefined, null, '', ' ', 42]) {
    assert.equal(getNativePlaybackErrorNotice({ ...error('HTTP_ERROR', 404), errorCode }), null);
  }
});
await test('NOTICE_BEFORE_CLEANUP_AND_REASON_PRESERVED', async () => {
  const sequence = [];
  await handleNativePlayerReturn(error('HTTP_ERROR', 404), async (reason) => { sequence.push(reason); }, (notice) => sequence.push(notice));
  assert.match(sequence[0], /HTTP 404/);
  assert.equal(sequence[1], 'MEDIA_ERROR');
});
await test('PENDING_AND_REJECTED_CLEANUP_DO_NOT_HIDE_ERROR', async () => {
  let complete, notice;
  const pending = handleNativePlayerReturn(error('DECODER_ERROR'), () => new Promise((resolve) => { complete = resolve; }), (value) => { notice = value; });
  assert.match(notice, /decodificar/);
  complete();
  await pending;
  await assert.doesNotReject(handleNativePlayerReturn(error('HTTP_ERROR', 404), async () => { throw new Error(leak); }, (value) => { notice = value; }));
  assert.match(notice, /HTTP 404/);
  assert.doesNotMatch(notice, /fixture-secret/);
});

// Execute the actual App effect bodies, not a duplicate implementation. Only dependencies are fake.
const appText = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const appSource = ts.createSourceFile('App.tsx', appText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const effects = [];
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(appSource) === 'useEffect') effects.push(node.arguments[0]);
  ts.forEachChild(node, visit);
}
visit(appSource);
function appEffect(fragment, bindings) {
  const matches = effects.filter((effect) => effect.getText(appSource).includes(fragment));
  assert.equal(matches.length, 1, 'single effect for this contract');
  const output = ts.transpileModule(`module.exports = ${matches[0].getText(appSource)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = { ...bindings, module: { exports: {} } };
  vm.runInNewContext(output, context);
  return context.module.exports();
}
await test('REAL_APP_EFFECT_BRIDGE_ERROR_AND_MANUAL_RETURN', async () => {
  let callback, removals = 0;
  const notices = [], reasons = [];
  const plugin = { addListener: async (name, listener) => {
    assert.equal(name, 'resume'); callback = listener;
    return { remove: async () => { removals += 1; } };
  } };
  const cleanup = appEffect('addNativePlayerResumeListener', {
    Capacitor: { isNativePlatform: () => true },
    addNativePlayerResumeListener: (listener) => addNativePlayerResumeListener(listener, plugin),
    handleNativePlayerReturn,
    defaultPlaybackService: { stopPlayback: async (reason) => { reasons.push(reason); } },
    setNativePlaybackErrorNotice: (notice) => notices.push(notice),
  });
  await flush();
  callback(error('HTTP_ERROR', 404));
  await flush();
  assert.match(notices.at(-1), /HTTP 404/);
  assert.equal(reasons.at(-1), 'MEDIA_ERROR');
  callback({ ended: false, positionMs: 9000 });
  await flush();
  assert.equal(notices.at(-1), null);
  assert.equal(reasons.at(-1), 'USER_EXIT');
  cleanup();
  callback(error('DECODER_ERROR'));
  await flush();
  assert.equal(removals, 1);
  assert.equal(reasons.length, 2, 'disposed listener must not handle late events');
});
await test('REAL_APP_DELAYED_LISTENER_CLEANUP', async () => {
  let resolveHandle, removals = 0;
  const cleanup = appEffect('addNativePlayerResumeListener', {
    Capacitor: { isNativePlatform: () => true },
    addNativePlayerResumeListener: () => new Promise((resolve) => { resolveHandle = resolve; }),
    handleNativePlayerReturn,
    defaultPlaybackService: { stopPlayback: async () => {} },
    setNativePlaybackErrorNotice: () => { assert.fail('no event expected'); },
  });
  cleanup();
  resolveHandle({ remove: async () => { removals += 1; } });
  await flush();
  assert.equal(removals, 1);
});
await test('REAL_APP_CLEAR_ON_NEW_ATTEMPT_UNSUBSCRIBES', () => {
  let listener, removed = false;
  const notices = [];
  const cleanup = appEffect('defaultPlaybackService.subscribe', {
    defaultPlaybackService: { subscribe: (callback) => { listener = callback; return () => { removed = true; }; } },
    setNativePlaybackErrorNotice: (notice) => notices.push(notice),
  });
  for (const state of ['IDLE', 'READY', 'ERROR']) listener({ state });
  assert.deepEqual(notices, []);
  listener({ state: 'RESOLVING' });
  assert.deepEqual(notices, [null]);
  cleanup();
  assert.equal(removed, true);
});
await test('REAL_COMPONENT_ACCESSIBILITY_AND_NO_EMPTY_NOTICE', () => {
  const require = createRequire(import.meta.url);
  const source = readFileSync(new URL('../src/ui/components/PlaybackErrorNotice.tsx', import.meta.url), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, require });
  const Component = exports.PlaybackErrorNotice;
  const html = renderToStaticMarkup(React.createElement(Component, { message: getNativePlaybackErrorNotice(error('HTTP_ERROR', 404)), onDismiss: () => {} }));
  assert.match(html, /role="alert"/);
  assert.match(html, /aria-labelledby="playback-error-heading"/);
  assert.match(html, /HTTP 404/);
  assert.match(html, /type="button"/);
  assert.match(html, /Fechar aviso/);
  let dismissals = 0;
  const tree = Component({ message: 'Aviso controlado', onDismiss: () => { dismissals += 1; } });
  tree.props.children[1].props.onClick();
  assert.equal(dismissals, 1, 'real close button invokes the supplied dismissal');
  assert.equal(renderToStaticMarkup(React.createElement(Component, { message: null, onDismiss: () => {} })), '');
  assert.equal((appText.match(/<PlaybackErrorNotice /g) || []).length, 2, 'notice in normal and empty catalog shells');
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
  const noticeStyle = css.match(/\.playback-error-notice \{([^}]+)\}/)?.[1];
  assert.ok(noticeStyle?.includes('position: sticky;'), 'notice stays in the scrolled viewport');
  assert.ok(noticeStyle?.includes('top: var(--ui-header-height, 4rem);'), 'notice does not cover sticky navigation');
});
await test('NATIVE_TERMINAL_PATHS_CARRY_ONLY_ALLOWED_DETAILS', () => {
  const activity = readFileSync(new URL('../android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java', import.meta.url), 'utf8');
  const plugin = readFileSync(new URL('../android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java', import.meta.url), 'utf8');
  assert.equal((activity.match(/emitTerminalEvent\(false, "NATIVE_ERROR", category, statusCode\)/g) || []).length, 2);
  assert.ok(/if \(terminalEventEmitted\)\s*\{?\s*return;/.test(activity), 'terminal idempotence preserved');
  assert.ok(/notifyPlaybackTerminal\(positionMs, ended, errorCode, errorCategory, httpStatus\)/.test(activity), 'Activity forwards sanitized fields');
  assert.ok(/buildResumeData\(positionMs, ended, errorCode, errorCategory, httpStatus\)\.entrySet\(\)/.test(plugin), 'IPC uses tested allowlist builder');
  assert.ok(/notifyListeners\("resume", sanitizedPayload\)/.test(plugin), 'same native event channel');
});
console.log(`C11_PLAYBACK_ERROR_NOTICE_FIX=PASS tests=${passed}`);
