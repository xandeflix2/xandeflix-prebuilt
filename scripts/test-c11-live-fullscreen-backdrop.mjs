import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
assert.equal(path.resolve(process.cwd()), path.resolve(root), 'RUN_ONLY_IN_C11_WORKSPACE');
const source = readFileSync(new URL('../android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java', import.meta.url), 'utf8');

function body(text, signature) {
  const method = text.indexOf(signature);
  assert.ok(method >= 0, 'REQUIRED_NATIVE_METHOD_MISSING');
  const start = text.indexOf('{', method);
  let depth = 0;
  for (let end = start; end < text.length; end++) {
    if (text[end] === '{') depth++;
    if (text[end] === '}' && --depth === 0) return text.slice(start, end + 1);
  }
  assert.fail('NATIVE_METHOD_BODY_INCOMPLETE');
}

function verify(text) {
  const enter = body(text, 'public void enterPreviewFullscreen(PluginCall call)');
  const exit = body(text, 'private boolean exitPreviewFullscreenInternal()');
  const create = body(text, 'private PlayerView createPreviewView()');
  assert.match(enter, /if\s*\(!previewFullscreen\)\s*\{/);
  const black = enter.indexOf('previewView.setBackgroundColor(Color.BLACK);');
  const expand = enter.indexOf('previewView.setLayoutParams(fullscreenParams);');
  assert.ok(black >= 0 && black < expand, 'OPAQUE_BLACK_MUST_PRECEDE_FULLSCREEN_EXPANSION');
  assert.match(enter, /new FrameLayout\.LayoutParams\(\s*ViewGroup\.LayoutParams\.MATCH_PARENT,\s*ViewGroup\.LayoutParams\.MATCH_PARENT\s*\)/);
  assert.match(exit, /if\s*\(!previewFullscreen\)\s*\{\s*return false;/);
  assert.match(exit, /if\s*\(previewView != null\)\s*\{\s*previewView\.setBackgroundColor\(Color\.TRANSPARENT\);/);
  assert.ok(exit.indexOf('Color.TRANSPARENT') < exit.indexOf('previewView.setLayoutParams(previewInlineLayoutParams)'), 'INLINE_BACKGROUND_MUST_BE_RESTORED_BEFORE_LAYOUT');
  assert.match(create, /view\.setBackgroundColor\(Color\.TRANSPARENT\);/);
  assert.match(create, /view\.setResizeMode\(AspectRatioFrameLayout\.RESIZE_MODE_FIT\);/);
  for (const section of [enter, exit]) {
    assert.doesNotMatch(section, /new ExoPlayer|new MediaItem|setMediaItem|setMediaSource|playPreviewCandidate|acquireSession|startPreview\(|releasePreview\(|setResizeMode/, 'FULLSCREEN_MUST_REUSE_PLAYER_WITHOUT_RESIZING_VIDEO_OR_NEW_SOURCE');
  }
  assert.match(body(text, 'private void releasePreview()'), /exitPreviewFullscreenInternal\(\);/);
  assert.match(body(text, 'public boolean exitPreviewFullscreenFromActivity()'), /exitPreviewFullscreenInternal/);
}

if (process.argv.includes('--baseline-negative')) {
  assert.throws(() => verify(source), { message: 'OPAQUE_BLACK_MUST_PRECEDE_FULLSCREEN_EXPANSION' });
  console.log('C11_LIVE_FULLSCREEN_BACKDROP_BASELINE_TRANSPARENCY_REPRODUCED=PASS_STATIC_ONLY');
} else {
  verify(source);
  const cases = [
    ['transparent-fullscreen', source.replace('previewView.setBackgroundColor(Color.BLACK);', 'previewView.setBackgroundColor(Color.TRANSPARENT);')],
    ['missing-opaque-background', source.replace('previewView.setBackgroundColor(Color.BLACK);', '')],
    ['inline-background-not-restored', source.replace('previewView.setBackgroundColor(Color.TRANSPARENT);', '')],
    ['cropped-video', source.replace('AspectRatioFrameLayout.RESIZE_MODE_FIT', 'AspectRatioFrameLayout.RESIZE_MODE_ZOOM')],
    ['incomplete-fullscreen-coverage', source.replace('ViewGroup.LayoutParams.MATCH_PARENT,', 'ViewGroup.LayoutParams.WRAP_CONTENT,')],
  ];
  for (const [label, broken] of cases) {
    assert.notEqual(broken, source, 'NEGATIVE_MUTATION_NOT_APPLIED');
    assert.throws(() => verify(broken), label);
    console.log('PASS BACKDROP_NEGATIVE_' + label);
  }
  console.log('C11_LIVE_FULLSCREEN_BACKDROP=PASS_STATIC_CALL_SITES_AND_5_NEGATIVE_CONTROLS');
  console.log('PHYSICAL_OPACITY_NOT_PROVEN_BY_SOURCE_GUARD');
}
