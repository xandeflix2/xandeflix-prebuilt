import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const root = fileURLToPath(new URL('..', import.meta.url));
const LOCK_ID = 'C11_NEW_DEVICE_ACTIVATION_AND_CATALOG_LOCK_V1';
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

function assertBuildHook(pkg) {
  assert.equal(pkg.scripts?.prebuild, 'npm run c11:new-device:lock', 'Required prebuild lock missing/changed');
  assert.equal(pkg.scripts?.['c11:new-device:lock'], 'node scripts/test-c11-new-device-activation-lock.mjs');
}

function assertNoNodeCrypto(source) {
  const ast = ts.createSourceFile('device-identity.service.ts', source, ts.ScriptTarget.Latest, true);
  const nodeCrypto = (value) => /^(node:)?crypto(?:\/|$)/.test(value);
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) assert.ok(!nodeCrypto(node.moduleSpecifier.text), 'Node crypto import forbidden');
    }
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
      assert.ok(!(node.arguments[0] && ts.isStringLiteral(node.arguments[0]) && nodeCrypto(node.arguments[0].text)), 'Dynamic Node crypto forbidden');
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) assert.notEqual(node.name.text, 'crypto', 'Do not shadow global crypto');
    ts.forEachChild(node, visit);
  }
  visit(ast);
}

function assertCapacitor(source) {
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports }, { timeout: 1000 });
  const config = module.exports.default;
  assert.equal(config.appId, 'com.xandeflix.prebuilt');
  assert.equal(config.server?.androidScheme, 'https', 'Android secure context scheme regressed');
  assert.equal(config.server?.url, undefined, 'Standalone APK cannot depend on dev server');
}

function assertBackupRules(xml) {
  const content = xml.replace(/<!--[\s\S]*?-->/g, '');
  for (const file of ['device_identity.json', 'app_installation.json', 'device_activation_key.json', 'device_activation.json', 'pending_device_token.json']) {
    assert.ok(content.includes(`<exclude domain="file" path="${file}"`), `Backup exclusion missing: ${file}`);
  }
  assert.ok(content.includes('<exclude domain="root" path="app_webview"'), 'WebView identity copies could migrate');
}

function assertSuiteResult(result, marker) {
  assert.ifError(result.error);
  assert.equal(result.signal, null, 'Suite terminated or timed out');
  assert.equal(result.status, 0, 'Required suite failed/missing');
  assert.ok(result.stdout.includes(marker), 'Complete suite PASS marker missing');
}

const pkg = JSON.parse(read('package.json'));
const identity = read('src/device/device-identity.service.ts');
const capacitor = read('capacitor.config.ts');
assertBuildHook(pkg);
assertNoNodeCrypto(identity);
assertCapacitor(capacitor);
assert.ok(read('docs/architecture/C11_NEW_DEVICE_ACTIVATION_LOCK.md').includes(`LOCK_ID=${LOCK_ID}`));
assert.ok(read('AGENTS.md').includes(LOCK_ID));
assert.ok(read('docs/architecture/XANDEFLIX_PREBUILT_EXECUTION_CONTRACT.md').includes(LOCK_ID));
const manifest = read('android/app/src/main/AndroidManifest.xml');
assert.ok(manifest.includes('android:fullBackupContent="@xml/backup_rules"'));
assert.ok(manifest.includes('android:dataExtractionRules="@xml/data_extraction_rules"'));
assertBackupRules(read('android/app/src/main/res/xml/backup_rules.xml'));
const extraction = read('android/app/src/main/res/xml/data_extraction_rules.xml');
for (const section of ['cloud-backup', 'device-transfer']) {
  const match = extraction.match(new RegExp(`<${section}[^>]*>([\\s\\S]*?)</${section}>`));
  assert.ok(match, `Missing extraction section ${section}`);
  assertBackupRules(match[1]);
}
console.log(`PASS ${LOCK_ID}_STATIC_INVARIANTS`);

// Expected failures are mandatory: the guard must not silently accept a broken
// hook, config, crypto import, backup exclusion or incomplete/failed test suite.
let negatives = 0;
for (const run of [
  () => assertBuildHook({ scripts: { ...pkg.scripts, prebuild: undefined } }),
  () => assertCapacitor("export default { appId: 'com.xandeflix.prebuilt', server: { androidScheme: 'http' } };"),
  () => assertNoNodeCrypto("import crypto from 'crypto';"),
  () => assertNoNodeCrypto("async function bad() { await import('node:crypto'); }"),
  () => assertNoNodeCrypto('const crypto = {};'),
  () => assertBackupRules('<full-backup-content />'),
  () => assertSuiteResult({ status: 1, signal: null, stdout: 'PASS' }, 'PASS'),
  () => assertSuiteResult({ status: 0, signal: null, stdout: '' }, 'PASS'),
  () => assertSuiteResult({ status: 0, signal: 'SIGTERM', stdout: 'PASS' }, 'PASS'),
]) { assert.throws(run); negatives++; }
console.log(`PASS LOCK_NEGATIVE_CONTROLS=${negatives}`);

for (const [script, marker] of [
  ['scripts/test-c11-new-device-activation.mjs', 'RESULT=22_TESTS_PASSED'],
  ['scripts/test-c11-catalog-promotion-directories.mjs', 'C11_CATALOG_PROMOTION_DIRECTORY_TESTS=27/27_PASS'],
]) {
  assert.ok(fs.existsSync(path.join(root, script)), `Required suite missing: ${script}`);
  const result = spawnSync(process.execPath, [path.join(root, script)], { cwd: root, encoding: 'utf8', timeout: 90000, maxBuffer: 2 * 1024 * 1024 });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  assertSuiteResult(result, marker);
}
console.log(`${LOCK_ID}=PASS`);
