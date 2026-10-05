import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
assert.equal(path.resolve(process.cwd()), path.resolve(root), 'RUN_ONLY_IN_C11_WORKSPACE');
const main = readFileSync('android/app/src/main/java/com/xandeflix/prebuilt/MainActivity.java', 'utf8');
const player = readFileSync('android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java', 'utf8');
const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
const vod = readFileSync('android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java', 'utf8');
function body(source, signature) {
  const index = source.indexOf(signature);
  assert.ok(index >= 0, 'METHOD_MISSING');
  const start = source.indexOf('{', index);
  let depth = 1, end = start + 1;
  for (; end < source.length && depth; end++) {
    if (source[end] === '{') depth++;
    if (source[end] === '}') depth--;
  }
  assert.equal(depth, 0);
  return source.slice(start + 1, end - 1);
}
function verify(m, p, xml) {
  const policy = body(m, 'public static int phoneUiOrientation(');
  assert.match(policy, /smallestScreenWidthDp <= 0 \|\| smallestScreenWidthDp >= 600\b/);
  assert.match(policy, /uiMode & Configuration.UI_MODE_TYPE_MASK\) == Configuration.UI_MODE_TYPE_TELEVISION/);
  assert.match(policy, /return ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED/);
  assert.match(policy, /return fullscreen \? ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE\s*: ActivityInfo.SCREEN_ORIENTATION_PORTRAIT/);
  const apply = body(m, 'public static void applyPhoneUiOrientation(');
  assert.match(apply, /if \(activity == null\) return/);
  assert.match(apply, /orientation != ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED\s*&& activity.getRequestedOrientation\(\) != orientation/);
  assert.equal((apply.match(/activity.setRequestedOrientation\(orientation\)/g) || []).length, 1);
  assert.doesNotMatch(apply, /Settings\.|SharedPreferences|Files|http|token|license/);
  const create = body(m, 'public void onCreate(');
  assert.ok(create.indexOf('applyPhoneUiOrientation(this, false)') >= 0);
  assert.ok(create.indexOf('applyPhoneUiOrientation(this, false)') < create.indexOf('super.onCreate('));
  const enter = body(p, 'public void enterPreviewFullscreen(');
  assert.equal((enter.match(/MainActivity.applyPhoneUiOrientation\(activity, true\)/g) || []).length, 1);
  assert.ok(enter.indexOf('MainActivity.applyPhoneUiOrientation(activity, true)') > enter.indexOf('this.previewFullscreen = true'));
  assert.ok(enter.indexOf('this.previewFullscreen = true') > enter.indexOf('requestedPreviewId'));
  const exit = body(p, 'private boolean exitPreviewFullscreenInternal(');
  assert.match(exit, /if \(!previewFullscreen\)\s*\{\s*return false/);
  assert.ok(exit.indexOf('MainActivity.applyPhoneUiOrientation(getPluginActivity(), false)') > exit.indexOf('previewFullscreen = false'));
  assert.match(body(p, 'private void releasePreview('), /exitPreviewFullscreenInternal\(\)/);
  assert.match(body(m, 'public void onBackPressed('), /exitPreviewFullscreenFromActivity\(\)/);
  for (const method of [enter, exit]) assert.doesNotMatch(method, /new ExoPlayer|new MediaItem|startActivity|acquireSession/);
  const mainTag = xml.match(/<activity\s[^>]*android:name="\.MainActivity"[^>]*>/s)?.[0];
  assert.ok(mainTag);assert.doesNotMatch(mainTag, /screenOrientation/);
  assert.match(mainTag, /configChanges="[^"]*orientation[^"]*screenSize/);
  assert.match(xml, /android:name="\.player.NativePlayerActivity"\s+android:exported="false"\s+android:screenOrientation="sensorLandscape"/);
  assert.match(vod, /setRequestedOrientation\(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE\)/);
}
verify(main, player, manifest);
const negatives = [
  ['tablet-lock', main.replace('smallestScreenWidthDp >= 600', 'smallestScreenWidthDp >= 6000'), player, manifest],
  ['ui-landscape', main.replace('applyPhoneUiOrientation(this, false)', 'applyPhoneUiOrientation(this, true)'), player, manifest],
  ['restore-lost', main, player.replace('MainActivity.applyPhoneUiOrientation(getPluginActivity(), false);', ''), manifest],
  ['restore-landscape', main, player.replace('MainActivity.applyPhoneUiOrientation(getPluginActivity(), false)', 'MainActivity.applyPhoneUiOrientation(getPluginActivity(), true)'), manifest],
  ['global-manifest-lock', main, player, manifest.replace('android:name=".MainActivity"', 'android:name=".MainActivity" android:screenOrientation="portrait"')],
];
for (const [label, m, p, xml] of negatives) {
  assert.throws(() => verify(m, p, xml), undefined, 'NEGATIVE_CONTROL_NOT_REJECTED_' + label);
  console.log('PASS PHONE_ORIENTATION_NEGATIVE_' + label);
}
console.log('C11_PHONE_UI_ORIENTATION=PASS_STATIC_CALL_SITES_AND_5_NEGATIVES');
console.log('PHYSICAL_ROTATION_NOT_PROVEN_BY_SOURCE_GUARD');
