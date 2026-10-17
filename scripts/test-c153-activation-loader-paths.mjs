import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

// Exercise the real resolver, including its second import with an absolute base.
// Node's Windows option lets this regression cover both OSes on either host.
const source = fs.readFileSync(new URL('./test-c11-new-device-activation.mjs', import.meta.url), 'utf8');
const ast = ts.createSourceFile('activation-loader.mjs', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
let resolver;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'require' && ts.isArrowFunction(node.initializer)) {
    assert.equal(resolver, undefined, 'Expected one synthetic require');
    const statements = node.initializer.body.statements;
    assert.ok(statements && statements.length >= 2, 'Loader resolver missing');
    resolver = statements.slice(-2).map((statement) => statement.getText(ast)).join('\n');
  }
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(resolver, 'Synthetic require missing');
const resolveImport = new Function('file', 'specifier', 'path', 'pathToFileURL', 'fileURLToPath', 'load', 'process', resolver);

let passed = 0;
for (const { name, cwd, windows, entry = 'src/control-plane/client/device-activation-sync.service.ts' } of [
  { name: 'Vercel POSIX root survives chained imports', cwd: '/vercel/path0', windows: false },
  { name: 'POSIX spaces, Unicode, hash and literal percent', cwd: '/srv/build/Aplicação #1 100%', windows: false },
  { name: 'POSIX relative dot segments', cwd: '/home/runner/work/app', windows: false, entry: './src/control-plane/client/../client/device-activation-sync.service.ts' },
  { name: 'Windows C drive', cwd: 'C:\\Xandeflix\\xandeflix-prebuilt-c11-main', windows: true },
  { name: 'Windows D drive with special characters', cwd: 'D:\\Builds\\Aplicação #1 100%', windows: true },
  { name: 'Windows UNC share', cwd: '\\\\build-host\\share\\Repo', windows: true },
]) {
  const flavor = windows ? path.win32 : path.posix;
  const resolve = (file, specifier) => resolveImport(
    file, specifier,
    { resolve: (...parts) => flavor.resolve(cwd, ...parts) },
    (filePath) => pathToFileURL(filePath, { windows }),
    (url) => fileURLToPath(url, { windows }),
    (filePath) => filePath,
    { cwd: () => cwd },
  );
  const identity = resolve(entry, '../../device/device-identity.service.ts');
  const presentation = resolve(identity, '../ui/device-presentation.ts');
  assert.equal(presentation, flavor.resolve(cwd, 'src/ui/device-presentation.ts'), name);
  assert.equal(identity, flavor.resolve(cwd, 'src/device/device-identity.service.ts'), name);
  console.log(`PASS ${name}`);
  passed++;
}
assert.equal(passed, 6);
console.log(`C153_ACTIVATION_LOADER_PATHS=${passed}/6_PASS`);
