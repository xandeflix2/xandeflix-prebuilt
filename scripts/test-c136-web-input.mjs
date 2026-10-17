import fs from 'node:fs'; import assert from 'node:assert/strict'; import ts from 'typescript'; import vm from 'node:vm';
function callback(file,name,wrapped=false) {
 const ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);let text;
 function visit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(ast)===name)text=(wrapped?node.initializer.arguments[0]:node.initializer).getText(ast);ts.forEachChild(node,visit)}visit(ast);assert.ok(text,name);
 return ts.transpileModule('exports.callback='+text,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
}
class Input{constructor(search=true){this.type='search';this.search=search;this.classList={contains:name=>name==='focusable-item'};this.clicks=0}matches(name){return this.search&&name==='.search-input'}closest(){return null}click(){this.clicks++}}
const document={activeElement:null},before={},after={};
vm.runInNewContext(callback('src/ui/hooks/useDpadNavigation.ts','handleKeyDown',true),{exports:before,enabled:true,document,HTMLInputElement:Input,onBack:()=>{throw Error('UNEXPECTED_BACK')}});
vm.runInNewContext(callback('src/web/web-runtime.ts','preserveSearchSpace'),{exports:after,HTMLInputElement:Input});
function event(key,target,extra={}){return{key,target,prevented:false,stopped:false,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true},...extra}}
const run=e=>{document.activeElement=e.target;after.callback(e);if(!e.stopped)before.callback(e)};
const input=new Input(),negative=event(' ',input);document.activeElement=input;before.callback(negative);assert.equal(negative.prevented,true);assert.equal(input.clicks,1);
console.log('PASS_NEGATIVE_EXISTING_DPAD_SWALLOWS_SEARCH_SPACE');
input.clicks=0;const space=event(' ',input);run(space);assert.equal(space.stopped,true);assert.equal(space.prevented,false);assert.equal(input.clicks,0);
console.log('PASS_WEB_SEARCH_SPACE_RETAINS_BROWSER_TEXT_INSERTION_DEFAULT');
const enter=event('Enter',input);run(enter);assert.equal(enter.stopped,false);assert.equal(input.clicks,1);assert.equal(enter.prevented,true);
const button=new Input(false),buttonSpace=event(' ',button);run(buttonSpace);assert.equal(buttonSpace.stopped,false);assert.equal(button.clicks,1);
const modifier=event(' ',input,{altKey:true});after.callback(modifier);assert.equal(modifier.stopped,false);
console.log('PASS_ENTER_BUTTON_ACTIVATION_AND_MODIFIERS_KEEP_EXISTING_BEHAVIOR');
fs.writeFileSync('tmp/c136-browser-web/input-tests.json',JSON.stringify({result:'PASS',tests:3,actualCallbacks:true,domAndEventsSynthetic:true,nativeHookUnchanged:true},null,2));
