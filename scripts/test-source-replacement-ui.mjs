import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { canUseSourceCatalog, finishSourceRestart, SourceReplacementLifecycle } from '../src/bootstrap/source-replacement.ts';

const pointer = { kind: 'REAL', sourceId: 'source_A', sourceVersion: 1, snapshotId: 'snapshot_A' };
let cases = 0;
const check = (name, run) => { run(); cases++; console.log('PASS ' + name); };
check('only exact authorized ready snapshot is eligible for UI exposure', () => {
  for (const state of ['CHECKING','REPLACING','BLOCKED']) assert.equal(canUseSourceCatalog({ state, ...pointer }, pointer), false);
  for (const state of ['READY','LOCAL_UNCONFIRMED']) {
    assert.equal(canUseSourceCatalog({ state, ...pointer }, pointer), true);
    for (const change of [{ snapshotId:'old_snapshot' }, { sourceId:'source_B' }, { sourceVersion:2 }, { kind:'PREBUILT_FIXTURE' }])
      assert.equal(canUseSourceCatalog({ state, ...pointer }, { ...pointer, ...change }), false);
    assert.equal(canUseSourceCatalog({ state, ...pointer }, null), false);
  }
});
check('App wires actual readiness before pages and novelty; reset closes normal playback then reloads', () => {
  const app = fs.readFileSync('src/App.tsx','utf8');
  assert.ok(app.includes('setSourceReadiness(coordinator.getSourceReadiness())'));
  assert.ok(app.indexOf("if (!isExistingRealCatalog && ['home'") < app.indexOf('const renderCurrentView'));
  for (const route of ['movie-detail','series-detail','adult']) assert.ok(app.slice(app.indexOf("if (!isExistingRealCatalog && ['home'"), app.indexOf('const renderCurrentView')).includes(`'${route}'`));
  assert.ok(app.includes('canUseSourceCatalog(sourceReadiness, summary?.activePointer)'));
  assert.equal((app.match(/<NewContentProvider model={authorizationGate === 'AUTHORIZED' && isExistingRealCatalog \? readModel : null}>/g)||[]).length,2);
  assert.ok(app.indexOf("stopPlayback('SOURCE_CHANGED')") < app.indexOf('finishSourceRestart(window.localStorage'));
  assert.ok(app.includes('await NativeAndroidPlayer.stopPlayback()'));
  assert.ok(app.includes('sourceRestartRef.current = true'));
  assert.ok(!app.includes('localStorage.clear('));
});
check('failed final cleanup never calls runtime reload', () => {
  const rows = new Map(), storage = { getItem:k=>rows.get(k)??null, setItem:(k,v)=>rows.set(k,v), removeItem:k=>rows.delete(k) };
  new SourceReplacementLifecycle(storage).prepare({ sourceId:'source_A',sourceVersion:1,protocol:'M3U' }, pointer);
  storage.removeItem = () => { throw Error('fixture storage denied'); };
  let reloads=0; assert.throws(()=>finishSourceRestart(storage,()=>reloads++),/storage denied/); assert.equal(reloads,0);
});
const classes = fs.mkdtempSync(path.join(os.tmpdir(),'xf-artwork-scope-classes-'));
try {
  execFileSync('javac',['-encoding','UTF-8','-d',classes,
    'android/app/src/main/java/com/xandeflix/prebuilt/artwork/ArtworkDiskCache.java',
    'android/app/src/test/java/com/xandeflix/prebuilt/artwork/ArtworkScopeIsolationTest.java'],{stdio:'pipe'});
  const result=execFileSync('java',['-cp',classes,'com.xandeflix.prebuilt.artwork.ArtworkScopeIsolationTest'],{encoding:'utf8'});
  assert.ok(result.includes('ARTWORK_SCOPE_ISOLATION=PASS')); cases++; console.log(result.trim());
} finally {
  const resolved=fs.realpathSync(classes), parent=fs.realpathSync(os.tmpdir());
  assert.equal(path.dirname(resolved),parent); assert.ok(path.basename(resolved).startsWith('xf-artwork-scope-classes-'));
  fs.rmSync(resolved,{recursive:true,force:true});
}
console.log(`SOURCE_REPLACEMENT_UI=PASS ${cases} (readiness execution, static App wiring, real Java disk cache; physical UI pending)`);
