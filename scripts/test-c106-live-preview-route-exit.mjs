import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const source = read('src/ui/pages/LiveTvPage.tsx');
const app = read('src/App.tsx');
function compile(code, ports) {
 const module = { exports: {} };
 const js = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
 new Function('module', ...Object.keys(ports), js)(module, ...Object.values(ports));
 return module.exports;
}
const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return { promise, resolve }; };
const tick = async () => { for (let i = 0; i < 24; i++) await Promise.resolve(); };
const effectSource = source.slice(source.indexOf('  // Troca apenas a midia;'), source.indexOf('  // Mantém a PlayerView'));
const prepareSource = source.slice(source.indexOf('  const prepareToLeave ='), source.indexOf('  useLayoutEffect', source.indexOf('  const prepareToLeave =')));
const commitSource = app.slice(app.indexOf('  const commitRoute ='), app.indexOf('  const handleNavigate ='));
let passed = 0;
async function test(name, run) { await run(); console.log('PASS ' + name); passed++; }
function fixture({ acquireGate, startGate, castGate, stopGate, denied = false, stopFailed = false } = {}) {
 const events = [], errors = [];
 let cleanup;
 const ports = {
  useCallback: fn => fn, useEffect: fn => { cleanup = fn(); },
  selectedChannel: { id: 'live:fixture', streamRef: { directStreamUrl: 'https://fixture.test/live/1.ts', containerExtension: 'ts' } },
  previewLifecycle: { current: Promise.resolve() }, previewIdRef: { current: null }, previewChannelId: { current: '' },
  previewMounted: { current: true }, previewLeaving: { current: false }, cancelPreviewOperation: { current: null },
  desiredPreviewChannel: { current: {} }, liveOperation: { current: { abort: () => events.push('abort') } },
  getPreviewBounds: () => ({ left: 0, top: 0, width: 200, height: 100 }), mapPreviewErrorCode: () => 'fixture',
  previewRetryNonce: 0, liveCatalog: {}, liveContextRef: { current: {} }, resumeFullscreen: { current: false }, switchingChannel: { current: false },
  bootTelemetry: { mark() {} }, lastLiveChannel: { remember() {} }, setIsPreviewFullscreen() {}, setControlsReady() {}, setStreamError: e => errors.push(e),
  addNativePreviewPlayingListener: async () => ({ remove: async () => {} }),
  getAuthorizedPlaybackSessionGuard: () => ({
   acquireSession: async () => { events.push('acquire'); if (acquireGate) await acquireGate.promise; return { allowed: !denied }; },
   releaseSession: async () => events.push('release'), onTermination: () => () => {},
  }),
  armCastAuthorization: async () => {},
  stopGoogleCast: async () => { events.push('cast-stop'); if (castGate) await castGate.promise; },
  startNativeAndroidPreview: async () => { events.push('start'); if (startGate) await startGate.promise; events.push('surface'); return { success: true, previewId: 'preview:fixture' }; },
  updateNativeAndroidPreview: async request => { events.push(request.suspendPlayback ? 'suspend' : 'update'); return { success: true, previewId: 'preview:fixture' }; },
  stopNativeAndroidPreview: async () => { events.push('stop'); if (stopGate) await stopGate.promise; if (stopFailed) return { success: false }; events.push('hidden'); return { success: true }; },
  enterNativeAndroidPreviewFullscreen: async () => ({ success: true }),
 };
 const { prepareToLeave } = compile(prepareSource + '\nmodule.exports={prepareToLeave};', ports);
 compile(effectSource, ports);
 let state = { current: { view: 'live' }, history: [{ view: 'home' }] };
 const routePorts = { useCallback: fn => fn, routeStateRef: { current: state }, beforeLiveLeaveRef: { current: prepareToLeave }, navigationIntentRef: { current: 0 },
  setRouteState: update => { state = update(state); routePorts.routeStateRef.current = state; events.push('route:' + state.current.view); } };
 const { commitRoute } = compile(commitSource + '\nmodule.exports={commitRoute};', routePorts);
 const navigate = view => commitRoute(previous => ({ ...previous, current: { view } }));
 return { events, ports, errors, cleanup: () => cleanup(), prepareToLeave, navigate, state: () => state, retryStop: () => { stopFailed = false; } };
}
await test('NATIVE_STOP_COMPLETES_BEFORE_HOME_AND_CAST_RELEASE', async () => {
 const gate = deferred(), f = fixture({ stopGate: gate }); await tick();
 f.navigate('home'); await tick(); assert.equal(f.state().current.view, 'live'); assert.ok(f.events.includes('stop')); assert.ok(!f.events.includes('cast-stop'));
 gate.resolve(); await tick(); assert.equal(f.state().current.view, 'home');
 assert.ok(f.events.indexOf('hidden') < f.events.indexOf('cast-stop')); assert.ok(f.events.indexOf('release') < f.events.indexOf('route:home'));
});
await test('LATE_START_IS_CANCELLED_AND_REMOVED_BEFORE_ROUTE_PAINT', async () => {
 const gate = deferred(), f = fixture({ startGate: gate }); await tick(); assert.ok(f.events.includes('start'));
 f.navigate('home'); await tick(); assert.equal(f.state().current.view, 'live');
 gate.resolve(); await tick(); assert.equal(f.state().current.view, 'home');
 assert.ok(f.events.indexOf('surface') < f.events.indexOf('hidden')); assert.ok(f.events.indexOf('hidden') < f.events.indexOf('route:home'));
 assert.equal(f.events.filter(e => e === 'start').length, 1);
});
await test('PENDING_AUTHORIZATION_NEVER_STARTS_AFTER_EXIT_OR_BYPASSES_C9', async () => {
 for (const denied of [false, true]) {
  const gate = deferred(), f = fixture({ acquireGate: gate, denied }); await tick(); f.navigate('home'); await tick(); assert.equal(f.state().current.view, 'live');
  gate.resolve(); await tick(); assert.equal(f.state().current.view, 'home'); assert.ok(!f.events.includes('start'));
  assert.equal(f.events.filter(e => e === 'release').length, denied ? 0 : 1);
 }
});
await test('DELAYED_CAST_CAN_NEVER_KEEP_VISIBLE_SURFACE_ON_HOME', async () => {
 const gate = deferred(), f = fixture({ castGate: gate }); await tick(); f.navigate('home'); await tick();
 assert.ok(f.events.includes('hidden')); assert.equal(f.state().current.view, 'live'); gate.resolve(); await tick(); assert.equal(f.state().current.view, 'home');
});
await test('CHANNEL_CHANGE_RETAINS_SUSPENDED_SURFACE_AND_RELEASES_ONCE', async () => {
 const f = fixture(); await tick(); f.cleanup(); await tick();
 assert.ok(f.events.includes('suspend')); assert.ok(!f.events.includes('hidden')); assert.equal(f.ports.previewIdRef.current, 'preview:fixture');
 assert.ok(f.events.indexOf('suspend') < f.events.indexOf('release'));
 f.ports.previewMounted.current = false; // ordinary unmount closes instead of retaining
 const g = fixture(); await tick(); g.ports.previewMounted.current = false; g.cleanup(); await tick(); assert.ok(g.events.includes('hidden'));
});
await test('REPEATED_EXIT_SHARES_TEARDOWN_AND_LATEST_DESTINATION_WINS', async () => {
 const gate = deferred(), f = fixture({ stopGate: gate }); await tick(); f.navigate('home'); f.navigate('movies'); await tick(); gate.resolve(); await tick();
 assert.equal(f.state().current.view, 'movies'); assert.equal(f.events.filter(e => e === 'stop').length, 1); assert.equal(f.events.filter(e => e === 'release').length, 1);
 assert.ok(!f.events.includes('route:home'));
});
await test('STOP_FAILURE_RETAINS_PAGE_ID_AND_C9_UNTIL_SUCCESSFUL_RETRY', async () => {
 const f = fixture({ stopFailed: true }); await tick(); f.navigate('home'); await tick(); assert.equal(f.state().current.view, 'live');
 assert.equal(f.ports.previewIdRef.current, 'preview:fixture'); assert.ok(!f.events.includes('release')); assert.ok(f.errors.includes('LIVE_PREVIEW_OPEN_FAILED'));
 f.retryStop(); f.navigate('home'); await tick(); assert.equal(f.state().current.view, 'home'); assert.equal(f.events.filter(e => e === 'release').length, 1);
});
await test('BACK_HOME_AND_SHELL_USE_BARRIER_AND_NATIVE_HIDE_PRECEDES_TEARDOWN', () => {
 assert.match(app, /commitRoute\(\(prev\) => navigateBack\(prev\)\)/); assert.match(app, /commitRoute\(\(prev\) => navigateTo\(prev, view, itemId\)\)/);
 assert.ok(app.includes('registerBeforeLeave={registerBeforeLiveLeave}'));
 const native = read('android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java');
 const stop = native.slice(native.indexOf('public void stopPreview('), native.indexOf('private void resolvePreviewStart'));
 assert.ok(stop.includes('result.put("accepted", true)')); assert.ok(stop.indexOf('!requestedPreviewId.equals(currentPreviewId)') < stop.indexOf('releasePreview();'));
 const release = native.slice(native.indexOf('private void releasePreview()'), native.indexOf('private android.app.Activity getPluginActivity()'));
 assert.ok(release.indexOf('setVisibility(View.GONE)') < release.indexOf('previewPlayer.release()')); assert.ok(!release.includes('previewHost.setVisibility'));
 const css = read('src/index.css'); assert.match(css, /\.hero-banner::after\s*\{[^}]*border: 1px solid rgba\(255, 255, 255, 0.28\)[^}]*pointer-events: none/s);
 assert.match(css, /app-shell--fire-stick[^}]*aspect-ratio: 16 \/ 8.46/s);
 assert.match(css, /app-shell--tablet[^}]*aspect-ratio: 16 \/ 9/s);
});
console.log('C106_LIVE_EXIT=' + passed + '/8_PASS; REAL_CALLBACKS_SYNTHETIC_PORTS; NO_BACKEND_OR_MEDIA');
