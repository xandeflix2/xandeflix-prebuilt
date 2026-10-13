import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const code = ts.transpileModule(fs.readFileSync(new URL('../src/ui/components/HomeHero.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }
}).outputText;
const module = { exports: {} };
new Function('require', 'module', 'exports', code)(name => {
  if (name === 'react' || name === 'react/jsx-runtime') return require(name);
  return {};
}, module, module.exports);
const swipe = module.exports.heroSwipeDirection;
assert.equal(swipe(-70, 8, 220, 412), 'next');
assert.equal(swipe(130, -12, 350, 1280), 'previous');
assert.equal(swipe(-41.2, 0, 1500, 412), 'next');
for (const args of [[-40,0,220,412],[-70,60,220,412],[5,130,220,412],[-100,0,1501,412],[-100,0,-1,412],[-100,0,20,0],[NaN,0,20,412],[-100,Infinity,20,412]]) {
  assert.equal(swipe(...args), undefined, `Ignore invalid/vertical/short/slow gesture ${args}`);
}
console.log('PASS_C92_SWIPE_DIRECTIONS_THRESHOLDS_VERTICAL_DURATION_INVALID');
