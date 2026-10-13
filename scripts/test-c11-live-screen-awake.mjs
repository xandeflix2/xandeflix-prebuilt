import assert from 'node:assert/strict';
import fs from 'node:fs';

const pluginPath = new URL('../android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java', import.meta.url);
const activityPath = new URL('../android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java', import.meta.url);
const source = fs.readFileSync(pluginPath, 'utf8');

function method(code, name) {
  const pattern = new RegExp(`(?:public|private|protected)\\s+(?:static\\s+)?[\\w.<>]+\\s+${name}\\s*\\([^)]*\\)\\s*\\{`);
  const match = pattern.exec(code);
  assert.ok(match, `Missing method ${name}`);
  const start = match.index + match[0].length;
  let depth = 1;
  for (let cursor = start; cursor < code.length; cursor++) {
    if (code[cursor] === '{') depth++;
    if (code[cursor] === '}' && --depth === 0) return code.slice(start, cursor);
  }
  assert.fail(`Unclosed method ${name}`);
}

function verify(code) {
  const update = method(code, 'updatePreviewKeepScreenOn');
  for (const value of ['shouldKeepPreviewScreenOn', 'previewForeground', 'getPlayWhenReady()',
    'getPlaybackState()', 'getPlayerError()', 'getPlaybackSuppressionReason()']) {
    assert.ok(update.includes(value), `Missing actual player state ${value}`);
  }
  assert.match(update, /previewView\.setKeepScreenOn\(keepScreenOn\)/);
  assert.match(method(code, 'onEvents'), /updatePreviewKeepScreenOn\(\)/);
  const release = method(code, 'releasePreview');
  assert.ok(release.indexOf('isPreviewActive = false') >= 0);
  assert.ok(release.indexOf('updatePreviewKeepScreenOn()') > release.indexOf('isPreviewActive = false'));
  assert.ok(release.indexOf('updatePreviewKeepScreenOn()') < release.indexOf('previewPlayer.stop()'));
  const pause = method(code, 'handleOnPause');
  assert.ok(pause.indexOf('previewForeground = false') >= 0);
  assert.ok(pause.indexOf('updatePreviewKeepScreenOn()') > pause.indexOf('previewForeground = false'));
  const resume = method(code, 'handleOnResume');
  assert.ok(resume.indexOf('previewForeground = true') >= 0);
  assert.match(resume, /updatePreviewKeepScreenOn\(\)/);
  assert.match(method(code, 'handleOnDestroy'), /releasePreview\(\)/);
  assert.match(method(code, 'onPlayerError'), /previewView\.setKeepScreenOn\(false\)/);
  assert.match(method(code, 'stopPreview'), /releasePreview\(\)/);
  for (const name of ['createPreviewView', 'enterPreviewFullscreen', 'exitPreviewFullscreenInternal']) {
    assert.doesNotMatch(method(code, name), /setKeepScreenOn\(true\)|setKeepScreenOn\(false\)|new ExoPlayer|setMediaSource/);
  }
  assert.doesNotMatch(code, /WakeLock|WAKE_LOCK|Settings\.(?:System|Secure|Global)|FLAG_KEEP_SCREEN_ON/);
}

verify(source);
console.log('PASS LIVE_SCREEN_AWAKE_LIFECYCLE_WIRING');
assert.match(fs.readFileSync(activityPath, 'utf8'), /addFlags\(WindowManager\.LayoutParams\.FLAG_KEEP_SCREEN_ON\)/);
console.log('PASS EXISTING_VOD_SCREEN_FLAG_PRESERVED');

const mutations = [
  code => code.replace('previewView.setKeepScreenOn(keepScreenOn)', 'previewView.setKeepScreenOn(true)'),
  code => code.replace(/onEvents\([^)]*\)\s*\{\s*updatePreviewKeepScreenOn\(\);/, 'onEvents(Player player, Player.Events events) {'),
  code => code.replace(/(private void releasePreview\(\)\s*\{[\s\S]*?)isPreviewActive = false;/, '$1/* preview activity flag not released */'),
  code => code.replace('previewForeground = false;', 'previewForeground = true;'),
  code => code.replace('previewPlayer.getPlayerError() != null', 'false'),
  code => code.replace('previewPlayer.getPlaybackSuppressionReason() != Player.PLAYBACK_SUPPRESSION_REASON_NONE', 'false'),
  code => code.replace('previewView.setKeepScreenOn(false);', '// screen flag not released'),
  code => code.replace('view.setClickable(false);', 'view.setKeepScreenOn(true); view.setClickable(false);'),
];
for (const mutate of mutations) {
  const broken = mutate(source);
  assert.notEqual(broken, source, 'Negative control must modify the source');
  assert.throws(() => verify(broken), 'Known screen-awake regression must fail');
}
console.log(`PASS LIVE_SCREEN_AWAKE_NEGATIVE_CONTROLS=${mutations.length}`);
console.log('C11_LIVE_SCREEN_AWAKE_WIRING=PASS (static wiring; JVM policy and physical window checks separate)');
