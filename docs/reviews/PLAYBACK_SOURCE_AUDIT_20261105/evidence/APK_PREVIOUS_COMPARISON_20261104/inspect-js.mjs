import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const root='C:/Xandeflix/Audits/APK_PREVIOUS_COMPARISON_20261104';
const require=createRequire('C:/Xandeflix/xandeflix-prebuilt-c11-main/package.json');
const ts=require('typescript');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function load(v){const code=fs.readFileSync(path.join(root,`${v}-main.formatted.js`),'utf8');const sf=ts.createSourceFile(v+'.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);return{code,sf};}
function shape(node,sf){
 const names=new Map();
 function walk(n){
  if(ts.isIdentifier(n)){
   const p=n.parent;
   // Preserve literal property names; normalize binding/reference spellings by first appearance.
   const prop=(ts.isPropertyAccessExpression(p)&&p.name===n)||((ts.isPropertyAssignment(p)||ts.isMethodDeclaration(p)||ts.isPropertyDeclaration(p))&&p.name===n);
   if(prop)return ['property',n.text];
   if(!names.has(n.text))names.set(n.text,names.size);
   return ['id',names.get(n.text)];
  }
  const kids=[];n.forEachChild(c=>{kids.push(walk(c));});
  return kids.length?[n.kind,...kids]:[n.kind,n.getText(sf)];
 }
 return JSON.stringify(walk(node));
}
const data={};
for(const v of ['v137','v152']){
 const {code,sf}=load(v); const records=[];
 for(const s of sf.statements){
  const line=sf.getLineAndCharacterOfPosition(s.getStart(sf)).line+1;
  const end=sf.getLineAndCharacterOfPosition(s.end).line+1;
  const text=s.getText(sf);
  records.push({line,end,name:s.name?.text??(ts.isVariableStatement(s)?s.declarationList.declarations.map(d=>d.name.getText(sf)).join(','):null),kind:ts.SyntaxKind[s.kind],sha256:hash(text),shape:hash(shape(s,sf)),strings:[...text.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"/g)].map(x=>x[1])});
 }
 data[v]=records;
}
const matches=[];
for(const a of data.v137){const aa=data.v137.filter(x=>x.shape===a.shape),bs=data.v152.filter(x=>x.shape===a.shape);if(aa.length===1&&bs.length===1)matches.push({left:a,right:bs[0]});}
fs.writeFileSync(path.join(root,'JS_STRUCTURAL_MATCHES.json'),JSON.stringify({method:'AST structure + literal properties/values; identifiers consistently renamed by first occurrence within each top-level statement. Candidate correspondence only; this does not establish global symbol identity or runtime equivalence.',matches},null,2));
for(const m of matches)if(m.left.line>=14800&&m.left.line<19400) console.log(JSON.stringify({old:m.left.name,oldLine:m.left.line,new:m.right.name,newLine:m.right.line,lines:m.left.end-m.left.line+1}));
for(const v of ['v137','v152']){console.log(v+' unmatched relevant');for(const s of data[v])if(s.line>=14800&&s.line<19400&&!matches.some(m=>(v==='v137'?m.left:m.right)===s))console.log(JSON.stringify({name:s.name,line:s.line,end:s.end,strings:s.strings.filter(x=>/^[A-Z_0-9:.-]+$/.test(x)).slice(0,15)}));}
