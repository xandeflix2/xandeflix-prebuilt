import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fs.realpathSync(fileURLToPath(new URL('..', import.meta.url)));
const parent = path.resolve(root, 'tmp/c154-web-production');
fs.mkdirSync(parent, { recursive: true });
assert.equal(fs.realpathSync(parent), parent, 'Generated output must not traverse a symlink');
const site = path.resolve(parent, 'site');
assert.equal(path.dirname(site), parent);
if (fs.existsSync(site)) {
  assert.ok(!fs.lstatSync(site).isSymbolicLink());
  assert.equal(fs.realpathSync(site), site);
  fs.rmSync(site, { recursive: true, force: true });
}
fs.mkdirSync(site);

function copyPublicFiles(from, to) {
  assert.ok(!fs.lstatSync(from).isSymbolicLink(), 'Symlink in build output');
  if (fs.statSync(from).isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    for (const name of fs.readdirSync(from)) copyPublicFiles(path.join(from, name), path.join(to, name));
  } else {
    assert.match(path.basename(from), /^[\w.-]+\.(html|js|css|png|webp|jpe?g|svg|woff2?|ico)$/i, 'Unexpected public artifact');
    fs.copyFileSync(from, to);
  }
}
const manager = path.resolve(root, 'tmp/c151-manager-production/site');
const application = path.resolve(parent, 'app');
assert.ok(fs.existsSync(path.join(manager, 'manager.html')));
assert.ok(fs.existsSync(path.join(application, 'app.html')));
copyPublicFiles(manager, site);
copyPublicFiles(application, path.join(site, 'app'));
console.log('C154_PUBLIC_SITE_ASSEMBLED=PASS');
