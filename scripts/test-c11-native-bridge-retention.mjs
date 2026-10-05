import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const MiB = 1024 * 1024;
const script = fileURLToPath(import.meta.url);
const bridge = readFileSync(new URL('../node_modules/@capacitor/android/capacitor/src/main/assets/native-bridge.js', import.meta.url), 'utf8');
const mode = process.argv[2];

function checkConfig(source) {
  const exports = {};
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  vm.runInNewContext(outputText, { exports }, { timeout: 5000 });
  const config = exports.default;
  assert.equal(config.loggingBehavior, 'none', 'BRIDGE_PAYLOAD_LOGGING_MUST_BE_DISABLED');
  assert.equal(config.android?.loggingBehavior ?? config.loggingBehavior, 'none', 'ANDROID_LOGGING_OVERRIDE');
  assert.equal(config.server?.androidScheme, 'https');
  assert.equal(config.plugins?.CapacitorHttp?.enabled, true);
  assert.equal(config.appId, 'com.xandeflix.prebuilt');
}

async function exercise(logging) {
  assert.equal(typeof global.gc, 'function');
  // Explicit retention model, not an assertion about a browser's buffer limits.
  const loggedObjects = [];
  const appMessages = [];
  const calls = [];
  const fakeConsole = {
    groupCollapsed() {}, groupEnd() {}, dir(value) { loggedObjects.push(value); },
    log(...args) { appMessages.push(args); }, warn(...args) { appMessages.push(args); },
    error(...args) { appMessages.push(args); }, debug() {}, info() {}, trace() {},
  };
  class Document {}
  class XMLHttpRequest {
    abort() {} getAllResponseHeaders() {} getResponseHeader() {} open() {} send() {} setRequestHeader() {}
  }
  const sandbox = {
    Capacitor: { DEBUG: true, isLoggingEnabled: logging, Plugins: {} },
    console: fakeConsole, Document, HTMLDocument: Document, XMLHttpRequest,
    document: { addEventListener() {} }, navigator: {}, fetch() {},
    androidBridge: {
      postMessage(serialized) {
        const call = JSON.parse(serialized);
        // Keep metadata only; native transport does not retain JS payload here.
        calls.push({ pluginId: call.pluginId, methodName: call.methodName });
        let data;
        let error;
        if (call.methodName === 'writeFile') {
          assert.equal(call.options.data.length, MiB);
          assert.equal(call.options.data.slice(0, 8), 'ação🐉東x');
          assert.equal(call.options.data.at(-1), 'x');
          data = { uri: 'synthetic-only' };
        } else if (call.methodName === 'readChunk') {
          data = { dataText: 'ação🐉東x' + 'x'.repeat(MiB - 8), done: false, bytesRead: MiB };
        } else if (call.methodName === 'fail') {
          error = { message: 'SYNTHETIC_IO_FAILURE', code: 'ENOSPC' };
        } else throw new Error('UNEXPECTED_SYNTHETIC_PLUGIN_CALL');
        sandbox.Capacitor.fromNative({ callbackId: call.callbackId, pluginId: call.pluginId,
          methodName: call.methodName, success: !error, data, error });
      },
    },
  };
  sandbox.window = sandbox;
  vm.runInNewContext(bridge, sandbox, { timeout: 5000 });
  assert.equal(sandbox.Capacitor.getPlatform(), 'android');
  global.gc();
  const before = process.memoryUsage().heapUsed;
  for (let i = 0; i < 24; i++) {
    // Materialize distinct strings rather than sharing ropes between calls.
    const data = JSON.parse(JSON.stringify('ação🐉東x' + 'x'.repeat(MiB - 8)));
    const written = await sandbox.Capacitor.nativePromise('Filesystem', 'writeFile', { data });
    assert.equal(written.uri, 'synthetic-only');
    const read = await sandbox.Capacitor.nativePromise('LargeSourceTransport', 'readChunk', { maxBytes: MiB });
    assert.equal(read.dataText.length, MiB);
    assert.equal(read.dataText.slice(0, 8), 'ação🐉東x');
  }
  await assert.rejects(sandbox.Capacitor.nativePromise('Filesystem', 'fail', {}),
    { message: 'SYNTHETIC_IO_FAILURE', code: 'ENOSPC' });
  sandbox.console.log('[BOOT_TELEMETRY] SYNTHETIC_MILESTONE');
  sandbox.console.error('NATIVE_PLAYER_HTTP_ERROR_SANITIZED');
  assert.ok(appMessages.some(args => args[0] === '[BOOT_TELEMETRY] SYNTHETIC_MILESTONE'));
  assert.ok(appMessages.some(args => args[0] === 'NATIVE_PLAYER_HTTP_ERROR_SANITIZED'));
  assert.equal(calls.length, 49);
  global.gc();
  const retainedMiB = (process.memoryUsage().heapUsed - before) / MiB;
  const payloadObjects = loggedObjects.filter(value => value?.options?.data || value?.dataText);
  if (logging) {
    assert.equal(payloadObjects.length, 48);
    assert.ok(retainedMiB > 30, 'NEGATIVE_CONTROL_DID_NOT_RETAIN_PAYLOADS');
  } else {
    assert.equal(payloadObjects.length, 0);
    assert.equal(loggedObjects.length, 0);
    assert.ok(retainedMiB < 12, 'BRIDGE_PAYLOAD_RETAINED_WITH_LOGGING_OFF');
  }
  console.log(JSON.stringify({ logging, calls: calls.length, payloadObjects: payloadObjects.length,
    retainedMiB, syntheticOnly: true, browserBufferReproduced: false }));
  console.log(`PASS BRIDGE_${logging ? 'NEGATIVE_LOGGING_ON' : 'LOGGING_OFF'}_ROUNDTRIP_RETENTION`);
}

if (mode === 'logging-on' || mode === 'logging-off') {
  await exercise(mode === 'logging-on');
} else {
  const config = readFileSync(new URL('../capacitor.config.ts', import.meta.url), 'utf8');
  // Run mechanism controls even before the config patch, then assert config.
  for (const childMode of ['logging-on', 'logging-off']) {
    const child = spawnSync(process.execPath, ['--expose-gc', '--max-old-space-size=192', script, childMode],
      { encoding: 'utf8', timeout: 30000 });
    process.stdout.write(child.stdout || '');
    process.stderr.write(child.stderr || '');
    assert.equal(child.status, 0, `FAILED_${childMode}`);
  }
  checkConfig(config);
  for (const broken of [config.replace(/loggingBehavior:\s*['"]none['"],?/u, ''),
    config.replace(/loggingBehavior:\s*['"]none['"]/u, "loggingBehavior: 'debug'"),
    config.replace(/loggingBehavior:\s*['"]none['"]/u, "loggingBehavior: 'production'"),
    config.replace('android: {', "android: { loggingBehavior: 'production',")]) {
    assert.throws(() => checkConfig(broken));
  }
  console.log('C11_NATIVE_BRIDGE_RETENTION=PASS_CONFIG_AND_4_NEGATIVE_CONTROLS');
}
