import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../src/ui/navigation/square-live-layout.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const module = { exports: {} };
new Function('module', 'exports', code)(module, module.exports);
const classify = module.exports.shouldUseSquareLive;
const cases = [
  [700,777,true,false,true], [777,700,true,false,true],
  [600,600,true,false,true], [600,750,true,false,true], [750,600,true,false,true],
  [599,650,true,false,false], [600,751,true,false,false], [751,600,true,false,false],
  [412,915,true,false,false], [915,412,true,false,false],
  [800,1280,true,false,false], [1280,800,true,false,false],
  [700,777,false,false,false], [700,777,true,true,false], [1920,1080,false,true,false],
  [NaN,700,true,false,false], [700,Infinity,true,false,false], [0,0,true,false,false]
];
for (const [width,height,touch,television,expected] of cases) {
  assert.equal(classify({width,height,touch,television}), expected, `${width}x${height}, touch=${touch}, TV=${television}`);
}
console.log(`C93_SQUARE_CLASSIFIER=${cases.length}/${cases.length}_PASS`);
