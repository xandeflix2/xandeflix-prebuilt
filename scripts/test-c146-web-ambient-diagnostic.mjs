import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = fs.readFileSync('src/web/web-runtime.ts', 'utf8');
const ast = ts.createSourceFile('web-runtime.ts', source, ts.ScriptTarget.Latest, true);
let safe;
function visit(node) { if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'safe') safe = node.initializer.getText(ast); ts.forEachChild(node, visit); }
visit(ast); assert.ok(safe);
const start = source.indexOf('    const ambientRoot = '), end = source.indexOf('    const copy = ', start);
assert.ok(start > 0 && end > start);
const code = ts.transpileModule(`exports.read=()=>{const diagnostic={textContent:''};const safe=${safe};${source.slice(start, end)}return diagnostic.textContent;}`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function fixture({ present = true, ready = true, malicious = false, header = true } = {}) {
  const gradient = malicious ? 'url("https://fixture.invalid/private?token=fixture")' : 'linear-gradient(rgb(75, 12, 10), rgb(8, 12, 20))';
  const page = { style: { getPropertyValue: () => malicious ? 'url(https://fixture.invalid/secret)' : 'rgb(75, 12, 10)' }, classList: { contains: () => !malicious }, computed: { backgroundImage: gradient } };
  const nav = { computed: { backgroundColor: 'rgba(0, 0, 0, 0)' } };
  const shell = { style: page.style, querySelector: () => header ? nav : null, computed: { backgroundImage: gradient } };
  const image = { complete: ready, naturalWidth: ready ? 1280 : 0, src: 'https://fixture.invalid/private?password=fixture', alt: 'Private fixture title',
    dataset: { immersiveArtwork: 'backdrop', webAmbientState: malicious ? 'https://fixture.invalid/secret' : 'APPLIED' } };
  const root = { closest: selector => selector === '.page-container' ? page : shell, querySelectorAll: () => [image] };
  const exports = {};
  vm.runInNewContext(code, { exports, document: { querySelector: () => present ? root : null }, isWebValidation: () => true, getComputedStyle: element => element.computed });
  return exports.read();
}
const ready = fixture();
assert.match(ready, /AMBIENT_IMAGE_READY=SIM/); assert.match(ready, /AMBIENT_PROBE_STATE=APPLIED/);
assert.match(ready, /AMBIENT_PAGE_COLOR=rgb\(75, 12, 10\)/); assert.match(ready, /AMBIENT_SHELL_GRADIENT_START=rgb\(75, 12, 10\)/);
assert.match(ready, /AMBIENT_HEADER_COLOR=rgba\(0, 0, 0, 0\)/);
console.log('PASS_READY_PALETTE_CSS_LAYER_AND_TRANSPARENCY_DIAGNOSTIC');
const malicious = fixture({ malicious: true });
assert.match(malicious, /AMBIENT_PROBE_STATE=NAO_INFORMADO/); assert.match(malicious, /AMBIENT_PAGE_COLOR=NONE/);
assert.match(malicious, /AMBIENT_SHELL_COLOR=NONE/); assert.match(malicious, /AMBIENT_SHELL_GRADIENT=NAO/);
for (const output of [ready, malicious]) assert.doesNotMatch(output, /https?:|fixture|password|Private|token/);
console.log('PASS_URL_TITLE_CREDENTIAL_SHAPED_VALUES_NEVER_APPEAR');
for (const options of [{ present: false }, { ready: false }, { header: false }]) {
  const output = fixture(options); assert.ok(output.trim().split('\n').every(line => line.startsWith('AMBIENT_')));
  if (options.present === false || options.ready === false) assert.match(output, /AMBIENT_IMAGE_READY=NAO/);
  if (options.header === false) assert.match(output, /AMBIENT_HEADER_COLOR=NONE/);
}
console.log(JSON.stringify({ result: 'PASS', tests: 3, actualDiagnosticBlock: true, realBrowser: false }));
