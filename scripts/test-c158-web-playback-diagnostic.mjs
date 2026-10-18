import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

let tests = 0;
const test = async (name, run) => { await run(); tests++; console.log('PASS ' + name); };
const tick = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
function harness(web = true) {
  const logs = [], events = [], libraries = [], calls = [], timers = new Set();
  let playNext, maxActive = 0, active = 0;
  class Element extends EventTarget {
    constructor(tag) { super(); this.tagName = tag; this.children = []; this.style = {}; this.className = ''; this.hidden = false;
      this.classList = { add: n => this.classList.toggle(n, true), remove: n => this.classList.toggle(n, false), contains: n => this.className.split(' ').includes(n), toggle: (n, on) => { const s = new Set(this.className.split(' ')); if (on ?? !s.has(n)) s.add(n); else s.delete(n); this.className = [...s].join(' '); } }; }
    append(...rows) { for (const row of rows) { this.children.push(row); row.parentElement = this; } }
    replaceChildren(...rows) { for (const row of this.children) row.parentElement = null; this.children = []; this.append(...rows); }
    remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(row => row !== this); this.parentElement = null; }
    setAttribute() {} removeAttribute(name) { if (name === 'src') this.src = ''; }
    matches(s) { return s.split(',').some(n => n.startsWith('.') ? this.classList.contains(n.slice(1)) : n === this.tagName); }
    querySelectorAll(s) { return this.children.flatMap(row => [...(row.matches(s) ? [row] : []), ...row.querySelectorAll(s)]); }
    querySelector(s) { return this.querySelectorAll(s)[0] || null; }
    focus() { document.activeElement = this; } click() { this.onclick?.(); this.dispatchEvent(new Event('click')); }
    contains(e) { return this === e || this.children.some(row => row.contains(e)); }
  }
  class Video extends Element {
    constructor() { super('video'); this.paused = true; this.currentTime = 0; this.duration = 120; this.volume = 1; this.playbackRate = 1; this.textTracks = []; }
    pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
    async play() { if (playNext) { const next = playNext; playNext = undefined; return next(); } this.paused = false; this.dispatchEvent(new Event('play')); this.dispatchEvent(new Event('playing')); }
    load() { this.error = null; } canPlayType() { return ''; }
  }
  class Library {
    constructor() { this.handlers = {}; this.released = false; libraries.push(this); }
    on(name, f) { this.handlers[name] = f; }
    attachMedia(video) { this.video = video; active++; maxActive = Math.max(maxActive, active); }
    loadSource(uri) { calls.push(uri); }
    destroy() { if (!this.released) { this.released = true; active--; } }
  }
  class Hls extends Library { static Events = { ERROR: 'hls-error' }; static isSupported = () => true; audioTracks = []; subtitleTracks = []; }
  const mpegts = { LoggingControl: {}, Events: { ERROR: 'ts-error' }, isSupported: () => true, createPlayer: (data, options) => {
    const lib = new Library(); calls.push({ data, options }); lib.attachMediaElement = video => lib.attachMedia(video);
    lib.load = () => {}; lib.unload = () => {}; lib.detachMediaElement = () => {}; return lib;
  } };
  const document = { body: new Element('body'), activeElement: null, createElement: tag => tag === 'video' ? new Video() : new Element(tag), querySelector: s => s === '.parental-dialog[open]' ? null : document.body.querySelector(s) };
  const window = new EventTarget();
  const context = vm.createContext({ URL, AbortController, Event, HTMLElement: Element, HTMLInputElement: Element,
    document, window, location: new URL('https://web.fixture.invalid/app'), console: { info: (...args) => logs.push(args.join(' ')) },
    setTimeout: f => { timers.add(f); return f; }, clearTimeout: f => timers.delete(f) });
  const cache = new Map();
  function load(file) {
    file = path.resolve(file); if (cache.has(file)) return cache.get(file);
    const exports = {}; cache.set(file, exports);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.React } }).outputText;
    const require = id => {
      if (id === '@capacitor/core') return { WebPlugin: class { notifyListeners(name, event) { events.push({ name, event }); } } };
      if (id.endsWith('validation.ts')) return { isWebValidation: () => web };
      if (id === 'hls.js') return { __esModule: true, default: Hls };
      if (id === 'mpegts.js') return { __esModule: true, default: mpegts };
      return load(path.resolve(path.dirname(file), id));
    };
    vm.runInContext(`(function(require,exports){${source}\n})`, context)(require, exports); return exports;
  }
  const diagnostic = load('src/web/web-playback-diagnostic.ts'), media = load('src/web/web-media.ts'), { WebPlayer } = load('src/web/web-player.ts');
  const player = new WebPlayer();
  return { diagnostic, media, player, document, events, logs, libraries, calls, timers, get active() { return active; }, get maxActive() { return maxActive; }, setPlay: next => { playNext = next; },
    lines: () => diagnostic.webPlaybackDiagnosticLines().join('\n'), video: () => document.body.querySelector('video'),
    button: label => document.body.querySelectorAll('button').find(row => row.textContent === label) };
}
const uri = 'https://source.fixture.invalid/movie/synthetic-private-value/2.mp4?token=synthetic-private-value';

await test('HTML_MEDIA_ERROR_REMAINS_AFTER_VOD_CLOSE_AND_RESUME_RELEASE_EVENT', async () => {
  const h = harness(); await h.player.open({ uri, kind: 'movie', playbackId: 'private-fixture-id' }); await tick();
  h.video().error = { code: 4, message: 'synthetic-private-value' }; h.video().dispatchEvent(new Event('error'));
  assert.equal(h.video(), null); assert.equal(h.events.at(-1).name, 'resume'); assert.equal(h.events.at(-1).event.errorCode, 'SOURCE_UNAVAILABLE');
  assert.match(h.lines(), /WEB_MOVIE_FAILURE_STAGE=HTML_MEDIA/); assert.match(h.lines(), /WEB_MOVIE_FAILURE_CODE=UNSUPPORTED/); assert.match(h.lines(), /WEB_MOVIE_MEDIA_ERROR=4/);
  assert.doesNotMatch(h.logs.join(''), /fixture|token|https:|synthetic-private-value|private-fixture-id/);
});
await test('HLS_FATAL_NETWORK_HTTP_STATUS_HAS_LIVE_STAGE_AND_NO_SENSITIVE_DETAIL', async () => {
  const h = harness(), live = 'https://source.fixture.invalid/live/fixture/1.m3u8';
  await h.player.startPreview({ uri: live, kind: 'live' }); await tick();
  h.libraries[0].handlers['hls-error']('hls-error', { fatal: false, type: 'networkError', details: 'fragLoadError' });
  assert.match(h.lines(), /WEB_LIVE_PLAYBACK_STATE=PLAYING/);
  h.libraries[0].handlers['hls-error']('hls-error', { fatal: true, type: 'networkError', details: 'fragLoadError', response: { code: 403, url: uri, text: 'synthetic-private-value' } });
  assert.match(h.lines(), /WEB_LIVE_FAILURE_CODE=HTTP_ERROR/); assert.match(h.lines(), /WEB_LIVE_HTTP_STATUS=403/);
  assert.equal(h.active, 0); assert.equal(h.events.at(-1).event.errorCode, 'LIVE_PREVIEW_PLAYBACK_FAILED');
  assert.equal(h.calls[0], live); assert.doesNotMatch(h.logs.join(''), /fixture|synthetic-private-value/); await h.player.stopPreview();
});
await test('MPEGTS_CODEC_AND_NETWORK_ERRORS_REMAIN_DISTINCT_WITHOUT_CORS_GUESS', async () => {
  const h = harness(), live = 'https://source.fixture.invalid/live/1.ts';
  await h.player.startPreview({ uri: live, kind: 'live' }); await tick();
  h.libraries[0].handlers['ts-error']('MediaError', 'CodecUnsupported', { msg: uri });
  assert.match(h.lines(), /WEB_LIVE_FAILURE_CODE=CODEC_UNSUPPORTED/); assert.equal(h.active, 0);
  await h.player.stopPreview(); await h.player.startPreview({ uri: live, kind: 'live' }); await tick();
  h.libraries[1].handlers['ts-error']('NetworkError', 'Exception', { code: -1, msg: 'synthetic-private-value' });
  assert.match(h.lines(), /WEB_LIVE_FAILURE_CODE=NETWORK/); assert.match(h.lines(), /WEB_LIVE_HTTP_STATUS=0/); assert.doesNotMatch(h.lines(), /CORS/);
  assert.equal(h.calls[0].data.url, live); assert.equal(h.calls[0].data.cors, true); assert.equal(h.maxActive, 1); await h.player.stopPreview();
});
await test('VALIDATION_HTTP_AND_HEADERS_REJECT_ORIGINAL_REQUEST_WITH_SAFE_OBSERVATION', async () => {
  const h = harness(); await assert.rejects(h.player.open({ uri: 'http://source.fixture.invalid/movie/1.mp4', kind: 'movie' }), /WEB_MEDIA_HTTPS_REQUIRED/);
  assert.match(h.lines(), /WEB_MOVIE_PROTOCOL=HTTP/); assert.match(h.lines(), /WEB_MOVIE_FAILURE_CODE=HTTPS_REQUIRED/);
  await assert.rejects(h.player.open({ uri, kind: 'movie', headers: { Authorization: 'synthetic-private-value' } }), /WEB_MEDIA_HEADERS_UNSUPPORTED/);
  assert.match(h.lines(), /WEB_MOVIE_FAILURE_CODE=HEADERS_UNSUPPORTED/); assert.equal(h.video(), null); assert.equal(h.calls.length, 0);
});
await test('AUTOPLAY_DENIAL_IS_NON_FATAL_AND_MANUAL_PLAY_STILL_WORKS', async () => {
  const h = harness(); h.setPlay(() => Promise.reject({ name: 'NotAllowedError', message: uri }));
  await h.player.open({ uri, kind: 'movie' }); await tick(); assert.ok(h.video()); assert.equal(h.events.length, 0);
  assert.match(h.lines(), /WEB_MOVIE_PLAYBACK_STATE=AUTOPLAY_BLOCKED/); assert.equal(h.logs.length, 0);
  h.button('▶').click(); await tick(); assert.match(h.lines(), /WEB_MOVIE_PLAYBACK_STATE=PLAYING/); await h.player.stopPlayback();
});
await test('OLD_MANUAL_PLAY_REJECTION_CANNOT_FAIL_UPDATED_PREVIEW', async () => {
  const h = harness(); const p = await h.player.startPreview({ uri: 'https://source.fixture.invalid/a.ts', kind: 'live' }); await tick();
  h.video().pause(); let reject; h.setPlay(() => new Promise((_, fail) => { reject = fail; })); h.video().click();
  await h.player.updatePreview({ previewId: p.previewId, uri: 'https://source.fixture.invalid/b.ts' }); await tick();
  reject({ name: 'NotSupportedError', message: 'synthetic-private-value' }); await tick();
  assert.equal(h.active, 1); assert.match(h.lines(), /WEB_LIVE_PLAYBACK_STATE=PLAYING/); assert.ok(!h.events.some(row => row.name === 'nativePreviewError'));
  h.libraries[0].handlers['ts-error']('MediaError', 'CodecUnsupported', {});
  assert.equal(h.active, 1); await h.player.stopPreview(); assert.equal(h.active, 0); assert.equal(h.timers.size, 0);
});
await test('MANUAL_CURRENT_PLAY_REJECTION_STILL_FAILS_AND_CLEANS_UP', async () => {
  const h = harness(); await h.player.open({ uri, kind: 'movie' }); await tick(); h.video().pause();
  h.setPlay(() => Promise.reject({ name: 'NotSupportedError', message: uri })); h.button('▶').click(); await tick();
  assert.equal(h.video(), null); assert.match(h.lines(), /WEB_MOVIE_FAILURE_STAGE=PLAY/); assert.match(h.lines(), /WEB_MOVIE_FAILURE_CODE=UNSUPPORTED/);
});
await test('SEPARATE_BOUNDED_MOVIE_SERIES_LIVE_HISTORY_AND_STALE_ATTEMPT_IGNORED', () => {
  const h = harness(), d = h.diagnostic;
  const old = d.beginWebPlayback({ uri, kind: 'movie' });
  for (let i = 0; i < 300; i++) d.beginWebPlayback({ uri, kind: 'movie' });
  d.markWebPlayback(old, 'FAILED', { stage: 'PLAY', code: 'UNKNOWN' });
  const series = d.beginWebPlayback({ uri, kind: 'series' }); d.markWebPlayback(series, 'PLAYING');
  const live = d.beginWebPlayback({ uri: 'https://source.fixture.invalid/1.ts', kind: 'live' }); d.markWebPlayback(live, 'FAILED', { stage: 'MPEGTS', code: 'NETWORK' });
  assert.match(h.lines(), /WEB_MOVIE_PLAYBACK_STATE=STARTING/); assert.match(h.lines(), /WEB_SERIES_PLAYBACK_STATE=PLAYING/); assert.match(h.lines(), /WEB_LIVE_PLAYBACK_STATE=FAILED/);
  assert.equal(h.diagnostic.webPlaybackDiagnosticLines().length, 23);
});
await test('UNTRUSTED_FIELDS_ARE_ALLOWLISTED_NEVER_LEAK_HOST_HEADERS_OR_ERROR', () => {
  const h = harness(), d = h.diagnostic, attempt = d.beginWebPlayback({ uri: 'https://source.fixture.invalid/private.constructor', kind: 'movie' });
  d.markWebPlayback(attempt, 'FAILED', { stage: uri, code: uri, mediaCode: 999, httpStatus: '403', message: uri });
  assert.match(h.lines(), /WEB_MOVIE_FORMAT=OTHER/); assert.match(h.lines(), /WEB_MOVIE_FAILURE_STAGE=LOAD/); assert.match(h.lines(), /WEB_MOVIE_FAILURE_CODE=UNKNOWN/);
  assert.match(h.lines(), /HTTP_STATUS=0/); assert.match(h.lines(), /MEDIA_ERROR=0/); assert.doesNotMatch(h.lines() + h.logs.join(''), /fixture|private|http:|https:|constructor/);
  d.markWebPlayback(attempt, 'PLAYING'); assert.match(h.lines(), /WEB_MOVIE_PLAYBACK_STATE=FAILED/);
});
await test('HTML_AND_LIBRARY_CLASSIFIERS_DISTINGUISH_SUPPORTED_FAILURES', () => {
  const d = harness().diagnostic;
  assert.equal(d.htmlMediaFailure(2).code, 'NETWORK'); assert.equal(d.htmlMediaFailure(3).code, 'DECODE'); assert.equal(d.htmlMediaFailure(0).code, 'UNKNOWN');
  assert.equal(d.hlsMediaFailure('networkError', 'fragLoadTimeOut').code, 'TIMEOUT');
  assert.equal(d.hlsMediaFailure('mediaError', 'manifestIncompatibleCodecsError').code, 'CODEC_UNSUPPORTED');
  assert.equal(d.mpegtsMediaFailure('NetworkError', 'ConnectingTimeout').code, 'TIMEOUT');
  assert.equal(d.mpegtsMediaFailure('MediaError', 'FormatUnsupported').code, 'FORMAT');
});
await test('NATIVE_DISABLED_HAS_NO_OBSERVATIONS_OR_LOGS', () => {
  const h = harness(false), d = h.diagnostic; assert.equal(d.beginWebPlayback({ uri, kind: 'movie' }), 0);
  d.markWebPlayback(1, 'FAILED', { stage: 'PLAY', code: 'UNKNOWN' }); assert.equal(h.lines(), ''); assert.equal(h.logs.length, 0);
});
await test('EPISODE_QUERY_VALUE_ERROR_AND_RETRY_REMAIN_UNCHANGED_NO_FALSE_EMPTY', async () => {
  const h = harness(), d = h.diagnostic, error = new Error('DIRECTORY_SERIES_DETAILS_INVALID');
  await assert.rejects(d.observeWebSeriesDetails(() => Promise.reject(error)), value => value === error);
  assert.match(h.lines(), /WEB_SERIES_DETAILS_CODE=DIRECTORY_SERIES_DETAILS_INVALID/);
  const result = [{ id: 'synthetic-private-value' }];
  assert.equal(await d.observeWebSeriesDetails(() => Promise.resolve(result)), result);
  assert.match(h.lines(), /WEB_SERIES_DETAILS_STATE=READY/); assert.doesNotMatch(h.logs.join(''), /synthetic-private-value/);
  await assert.rejects(d.observeWebSeriesDetails(() => { throw new Error(uri); }));
  assert.match(h.lines(), /WEB_SERIES_DETAILS_CODE=UNKNOWN/); assert.doesNotMatch(h.lines() + h.logs.join(''), /source.fixture|https:/);
});
await test('STALE_EPISODE_QUERY_CANNOT_OVERWRITE_NEWER_DIAGNOSTIC_NATIVE_PROMISE_IDENTICAL', async () => {
  const h = harness(); let reject;
  const old = h.diagnostic.observeWebSeriesDetails(() => new Promise((_, fail) => { reject = fail; }));
  const failure = assert.rejects(old);
  await h.diagnostic.observeWebSeriesDetails(() => Promise.resolve([])); reject(new Error('DIRECTORY_JSON_FETCH_FAILED')); await failure;
  assert.match(h.lines(), /WEB_SERIES_DETAILS_STATE=READY/); assert.equal(h.logs.length, 0);
  const native = harness(false), promise = Promise.resolve([]);
  assert.equal(native.diagnostic.observeWebSeriesDetails(() => promise), promise); assert.equal(native.lines(), '');
});
await test('SUPPORT_UI_INCLUDES_THE_REAL_STORE_AND_NO_BACKEND_OR_STORAGE_ADDED', () => {
  const ui = fs.readFileSync('src/web-production/WebAccessStatus.tsx', 'utf8'), store = fs.readFileSync('src/web/web-playback-diagnostic.ts', 'utf8');
  assert.match(ui, /lines\.push\(\.\.\.webPlaybackDiagnosticLines\(\)\)/);
  assert.doesNotMatch(store, /fetch\(|localStorage|indexedDB|supabase|\.message\s*[,}]|JSON\.stringify/);
});
console.log(`C158_WEB_PLAYBACK_DIAGNOSTIC_TESTS=${tests}/${tests}_PASS`);
