import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import { LiveAutoRecovery, recoverNextLiveChannel } from '../src/playback/live-auto-recovery.ts';
import { isAdultLocation } from '../src/ui/navigation/route-state.ts';

let count = 0;
async function test(name, fn) { await fn(); console.log('PASS ' + name); count++; }
function harness() {
  let now = 0, id = 0;
  const timers = new Map(), reasons = [];
  const clock = { now: () => now, schedule(fn, delay) { const key = ++id; timers.set(key, { fn, at: now + delay }); return key; }, cancel(key) { timers.delete(key); } };
  const policy = new LiveAutoRecovery('attempt-a', reason => reasons.push(reason), clock);
  const event = { previewId: 'view-a', requestId: 'attempt-a', state: 'BUFFERING', playWhenReady: true, foreground: true, suppressed: false, obscured: false };
  const state = change => policy.state({ ...event, ...change });
  const advance = ms => { now += ms; for (const [key, t] of [...timers]) if (t.at <= now) { timers.delete(key); t.fn(); } };
  return { policy, reasons, state, advance, timers, event };
}
await test('BUFFER_STRICTLY_GREATER_THAN_FIVE_SECONDS', () => {
  const h = harness(); h.state(); h.advance(4999); assert.deepEqual(h.reasons, []);
  h.advance(1); assert.deepEqual(h.reasons, []); h.advance(1); assert.deepEqual(h.reasons, ['BUFFER_TIMEOUT']);
});
await test('REPEATED_BUFFER_EVENTS_DO_NOT_RESTART_CLOCK', () => {
  const h = harness(); h.state(); h.advance(3000); h.state(); h.advance(2001); assert.equal(h.reasons.length, 1);
});
await test('SHORT_BUFFERS_DO_NOT_ACCUMULATE', () => {
  const h = harness(); for (let i = 0; i < 5; i++) { h.state(); h.advance(4900); h.state({ state: 'READY' }); h.advance(100); }
  assert.deepEqual(h.reasons, []); assert.equal(h.timers.size, 0);
});
for (const [name, change] of Object.entries({ PAUSE: { playWhenReady: false }, BACKGROUND: { foreground: false }, SUPPRESSION: { suppressed: true }, OBSCURED: { obscured: true } })) {
  await test(name + '_CANCELS_BUFFER_AND_PREVENTS_ERROR_RECOVERY', () => {
    const h = harness(); h.state(); h.advance(4500); h.state(change); h.advance(10000);
    h.policy.error({ ...h.event, errorCode: 'LIVE_PREVIEW_PLAYBACK_FAILED' }); assert.deepEqual(h.reasons, []);
    h.state(); h.advance(5000); assert.deepEqual(h.reasons, []); h.advance(1); assert.equal(h.reasons.length, 1);
  });
}
await test('READY_AND_IDLE_CANCEL_TIMER', () => {
  for (const state of ['READY', 'IDLE']) { const h = harness(); h.state(); h.state({ state }); h.advance(10000); assert.equal(h.reasons.length, 0); }
});
await test('OLD_REQUEST_SAME_VIEW_NEVER_RECOVERS_NEW_CHANNEL', () => {
  const h = harness(); h.policy.bind('view-a'); h.state({ requestId: 'attempt-old' }); h.advance(10000);
  h.policy.error({ ...h.event, requestId: 'attempt-old', errorCode: 'LIVE_PREVIEW_PLAYBACK_FAILED' }); assert.equal(h.reasons.length, 0);
});
await test('OTHER_VIEW_SAME_REQUEST_IS_IGNORED', () => {
  const h = harness(); h.policy.bind('view-a'); h.state({ previewId: 'view-old' }); h.advance(10000); assert.equal(h.reasons.length, 0);
});
await test('EARLY_NATIVE_EVENT_BEFORE_IPC_RESOLVE_IS_RETAINED', () => {
  const h = harness(); h.state(); h.policy.bind('view-a'); h.advance(5001); assert.equal(h.reasons.length, 1);
});
await test('CONFLICTING_IPC_VIEW_FAILS_CLOSED', () => {
  const h = harness(); h.state(); h.policy.bind('view-b'); h.advance(5001); assert.equal(h.reasons.length, 0);
});
await test('ERROR_TIMER_AND_ENDED_RACE_SELECTS_ONCE', () => {
  const h = harness(); h.state(); h.policy.error({ ...h.event, errorCode: 'LIVE_PREVIEW_PLAYBACK_FAILED' });
  h.advance(9000); h.state({ state: 'ENDED' }); h.policy.error({ ...h.event, errorCode: 'LIVE_PREVIEW_PLAYBACK_FAILED' });
  assert.deepEqual(h.reasons, ['MEDIA_ERROR']); assert.equal(h.timers.size, 0);
});
await test('LIVE_ENDED_WITH_PLAY_INTENT_RECOVERS', () => { const h = harness(); h.state({ state: 'ENDED' }); assert.deepEqual(h.reasons, ['STREAM_ENDED']); });
await test('LEGACY_OR_UNKNOWN_ERROR_CANNOT_AUTO_ADVANCE', () => {
  const h = harness(); h.state({ state: 'READY' });
  for (const event of [{ previewId: 'view-a', errorCode: 'LIVE_PREVIEW_PLAYBACK_FAILED' }, { ...h.event, errorCode: 'SESSION_LIMIT_REACHED' }, { ...h.event, errorCode: 'LIVE_PREVIEW_SURFACE_FAILED' }]) assert.equal(h.policy.error(event), false);
  assert.deepEqual(h.reasons, []);
});
await test('MANUAL_SOURCE_OR_UNMOUNT_CANCEL_REMOVES_ALL_TIMERS', () => {
  const h = harness(); h.state(); h.policy.cancel(); h.advance(9000); h.state({ state: 'ENDED' }); assert.deepEqual(h.reasons, []); assert.equal(h.timers.size, 0);
});

function handoff(overrides = {}) {
  const calls = [];
  const port = { current: () => true, cleanup: async () => { calls.push('suspend-and-release'); }, next: async () => { calls.push('next'); return 'next-channel'; }, permitted: async () => { calls.push('authorize'); return true; }, select: id => calls.push('select:' + id), ...overrides };
  return { calls, port };
}
await test('CLEANUP_AUTHORIZATION_AND_SELECTION_ORDER', async () => {
  const h = handoff(); assert.equal(await recoverNextLiveChannel(h.port), 'SELECTED'); assert.deepEqual(h.calls, ['suspend-and-release', 'next', 'authorize', 'select:next-channel']);
});
await test('PENDING_CLEANUP_NEVER_OPENS_ANOTHER_CHANNEL', async () => {
  let release; const h = handoff({ cleanup: () => new Promise(r => { release = r; }) }); const pending = recoverNextLiveChannel(h.port);
  await Promise.resolve(); assert.deepEqual(h.calls, []); release(); await pending; assert.deepEqual(h.calls, ['next', 'authorize', 'select:next-channel']);
});
await test('FAILED_CLEANUP_IS_BLOCKING', async () => {
  const h = handoff({ cleanup: async () => { throw Error('cleanup-failed'); } }); await assert.rejects(recoverNextLiveChannel(h.port), /cleanup-failed/); assert.deepEqual(h.calls, []);
});
await test('END_OF_CATEGORY_HAS_NO_WRAP_OR_SYNTHETIC_CHANNEL', async () => {
  const h = handoff({ next: async () => undefined }); assert.equal(await recoverNextLiveChannel(h.port), 'END'); assert.deepEqual(h.calls, ['suspend-and-release']);
});
await test('PARENTAL_OR_AUTHORIZATION_DENIAL_NEVER_SELECTS', async () => {
  const h = handoff({ permitted: async () => false }); assert.equal(await recoverNextLiveChannel(h.port), 'BLOCKED'); assert.deepEqual(h.calls, ['suspend-and-release', 'next']);
});
for (const at of ['before', 'cleanup', 'lookup', 'authorization']) await test('CANCEL_DURING_' + at.toUpperCase() + '_CANNOT_SELECT', async () => {
  let current = at !== 'before';
  const h = handoff({ current: () => current, cleanup: async () => { if (at === 'cleanup') current = false; }, next: async () => { if (at === 'lookup') current = false; return 'next'; }, permitted: async () => { if (at === 'authorization') current = false; return true; } });
  assert.equal(await recoverNextLiveChannel(h.port), 'CANCELLED'); assert.equal(h.calls.length, 0);
});

// Execute the real paged navigator; only its fingerprint dependency is controlled.
const navigation = fs.readFileSync('src/playback/live-player-navigation.ts', 'utf8').replace(/import \{ liveChannelFingerprint \}[^;]+;/, 'const liveChannelFingerprint = channel => channel.id;');
const js = ts.transpileModule(navigation, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { adjacentLiveChannel } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const rows = Array.from({ length: 50 }, (_, i) => ({ id: 'channel-' + i, groupId: 'group-a' }));
const catalog = { snapshotId: 'snapshot-a' }, signal = new AbortController().signal;
let snapshot = catalog.snapshotId;
const port = { activeSnapshot: async () => snapshot, loadPage: async (group, offset, size) => { assert.equal(group, 'group-a'); return { channels: rows.slice(offset, offset + size), nextOffset: offset + size < rows.length ? offset + size : null }; } };
await test('NEXT_CHANNEL_CROSSES_LOCAL_PAGE_WITHOUT_CHANGING_CATEGORY', async () => { assert.equal((await adjacentLiveChannel(catalog, rows[47], 1, port, signal)).id, rows[48].id); });
await test('LAST_CHANNEL_NAVIGATOR_RETURNS_UNDEFINED', async () => { assert.equal(await adjacentLiveChannel(catalog, rows[49], 1, port, signal), undefined); });
await test('SOURCE_SNAPSHOT_CHANGE_BLOCKS_LOCAL_NEXT', async () => { snapshot = 'snapshot-b'; await assert.rejects(adjacentLiveChannel(catalog, rows[0], 1, port, signal), /LIVE_NAVIGATION_CHANGED/); });

// Execute the exact production Java payload method in a small JVM harness.
const native = fs.readFileSync('android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java', 'utf8');
function method(name) {
  const match = new RegExp('public static [^\\n]+\\b' + name + '\\(').exec(native); assert.ok(match, name);
  let cursor = native.indexOf('{', match.index), depth = 1, end = cursor + 1;
  for (; depth && end < native.length; end++) { if (native[end] === '{') depth++; if (native[end] === '}') depth--; }
  return native.slice(match.index, end);
}
await test('NATIVE_PAYLOAD_JVM_SANITIZATION_AND_STATE_FLAGS', () => {
  const out = 'tmp/live-auto-recovery-' + Date.now(); fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(out + '/PreviewStateHarness.java', `import java.util.*; public class PreviewStateHarness {
    static class Player {static final int STATE_BUFFERING=2,STATE_READY=3,STATE_ENDED=4;}
    ${method('validPlaybackId')} ${method('buildPreviewStateData')}
    static void check(boolean value){if(!value)throw new AssertionError();}
    public static void main(String[] args){
      String[] names={"IDLE","BUFFERING","READY","ENDED"};
      for(int state=1;state<=4;state++)for(int flags=0;flags<16;flags++){
        Map<String,Object>d=buildPreviewStateData("view-a","attempt-a",state,(flags&1)!=0,(flags&2)!=0,(flags&4)!=0,(flags&8)!=0);
        check(d.size()==7);check(d.get("state").equals(names[state-1]));
        check(d.get("playWhenReady").equals((flags&1)!=0));check(d.get("foreground").equals((flags&2)!=0));
        check(d.get("suppressed").equals((flags&4)!=0));check(d.get("obscured").equals((flags&8)!=0));
      }
      for(String value:new String[]{null,"","https://fixture.invalid/private","header:value"}){
        check(buildPreviewStateData(value,"attempt",2,true,true,false,false).isEmpty());
        check(buildPreviewStateData("view",value,2,true,true,false,false).isEmpty());
      }
      System.out.println("NATIVE_PREVIEW_STATE_64_COMBINATIONS_AND_INVALID_IDS=PASS");
    }}\n`);
  execFileSync('javac', ['-encoding', 'UTF-8', '-d', path.resolve(out), out + '/PreviewStateHarness.java'], { encoding: 'utf8', windowsHide: true });
  assert.match(execFileSync('java', ['-cp', path.resolve(out), 'PreviewStateHarness'], { encoding: 'utf8', windowsHide: true }), /COMBINATIONS_AND_INVALID_IDS=PASS/);
});

// Preserve the seven real native/C9 exit assertions from the legacy fixture.
// Its eighth assertion requires an obsolete hero CSS border even on HEAD;
// that unrelated full test is recorded separately and is not claimed to pass.
let fixtureSource = fs.readFileSync('scripts/test-c106-live-preview-route-exit.mjs', 'utf8');
fixtureSource = fixtureSource.slice(0, fixtureSource.indexOf("await test('BACK_HOME_AND_SHELL"))
  .replace(/^import .*;\r?\n/gm, '')
  .replace(/^const read = .*;\r?\n/m, 'const read = sourceRead;\n')
  .replace(' const ports = {', ` const recoveryEvents = { state: new Set(), error: new Set() };
 const ports = {
  LiveAutoRecovery, recoverNextLiveChannel, recoveryEvents,
  parentalSelectionIntent: { current: 0 }, previewAttemptId: { current: '' },
  recoverySnapshot: { current: undefined }, cancelAutoRecovery: { current: null }, fullscreenStateRef: { current: false },
  addNativePreviewStateListener: async listener => { recoveryEvents.state.add(listener); return {remove:async()=>recoveryEvents.state.delete(listener)}; },
  addNativePreviewErrorListener: async listener => { recoveryEvents.error.add(listener); return {remove:async()=>recoveryEvents.error.delete(listener)}; },
  adjacentLiveChannel: async()=>({id:'next-live',groupId:'fixture-group'}),
  canShowParentalLive:()=>true, parentalLiveNeedsPin:()=>false,
  setSelectedChannel:channel=>events.push('auto-select:'+channel.id), setLiveMessage:()=>{},`)
  .replace('desiredPreviewChannel: { current: {} }', "desiredPreviewChannel: { current: {id:'live:fixture'} }");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const args = ['fs', 'assert', 'ts', 'isAdultLocation', 'LiveAutoRecovery', 'recoverNextLiveChannel', 'sourceRead'];
const values = [fs, assert, ts, isAdultLocation, LiveAutoRecovery, recoverNextLiveChannel, file => fs.readFileSync(file, 'utf8')];
await test('REAL_EFFECT_PRESERVES_SEVEN_NATIVE_C9_EXIT_ASSERTIONS', () => new AsyncFunction(...args, fixtureSource)(...values));
const setup = fixtureSource.slice(0, fixtureSource.indexOf("await test('NATIVE_STOP"));
const { fixture, tick } = await new AsyncFunction(...args, setup + '\nreturn {fixture,tick};')(...values);
const emit = (f, type, extra = {}) => {
  const event = { previewId: 'preview:fixture', requestId: f.ports.previewAttemptId.current, state: 'READY', playWhenReady: true, foreground: true, suppressed: false, obscured: false, ...extra };
  for (const listener of [...f.ports.recoveryEvents[type]]) listener(event);
};
await test('REAL_EFFECT_ERROR_RELEASES_C9_BEFORE_ONE_AUTO_SELECTION', async () => {
  const f = fixture(); await tick(); emit(f, 'state'); emit(f, 'error', { errorCode: 'LIVE_PREVIEW_PLAYBACK_FAILED' }); emit(f, 'error', { errorCode: 'LIVE_PREVIEW_PLAYBACK_FAILED' }); await tick();
  assert.equal(f.events.filter(e => e === 'auto-select:next-live').length, 1);
  assert.ok(f.events.indexOf('suspend') < f.events.indexOf('release'));
  assert.ok(f.events.indexOf('release') < f.events.indexOf('auto-select:next-live'));
  f.cleanup(); await tick(); assert.equal(f.events.filter(e => e === 'release').length, 1);
});
await test('REAL_EFFECT_MANUAL_CANCEL_OR_OLD_REQUEST_CANNOT_SELECT', async () => {
  for (const cancel of [false, true]) {
    const f = fixture(); await tick(); emit(f, 'state');
    if (cancel) f.ports.cancelAutoRecovery.current();
    emit(f, 'error', { errorCode: 'LIVE_PREVIEW_PLAYBACK_FAILED', ...(cancel ? {} : { requestId: 'old-request' }) }); await tick();
    assert.ok(!f.events.some(e => e.startsWith('auto-select:'))); f.cleanup(); await tick();
  }
});
await test('REAL_EFFECT_C9_DENIAL_NEVER_OPENS_OR_RECOVERS', async () => {
  const f = fixture({ denied: true }); await tick(); emit(f, 'state'); emit(f, 'error', { errorCode: 'LIVE_PREVIEW_PLAYBACK_FAILED' }); await tick();
  assert.ok(!f.events.includes('start')); assert.ok(!f.events.some(e => e.startsWith('auto-select:'))); f.cleanup(); await tick();
});
console.log('LIVE_AUTO_RECOVERY_TESTS=' + count + '_PASS');
