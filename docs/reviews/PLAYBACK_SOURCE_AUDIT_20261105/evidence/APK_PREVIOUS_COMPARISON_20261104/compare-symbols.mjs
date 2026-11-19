import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const root='C:/Xandeflix/Audits/APK_PREVIOUS_COMPARISON_20261104';
const require=createRequire('C:/Xandeflix/xandeflix-prebuilt-c11-main/package.json');
const ts=require('typescript');
const {matches}=JSON.parse(fs.readFileSync(path.join(root,'JS_STRUCTURAL_MATCHES.json'),'utf8'));
const versions={};
for(const v of ['v137','v152']){
 const file=path.join(root,`${v}-main.formatted.js`);
 const program=ts.createProgram([file],{allowJs:true,noResolve:true,noLib:true});
 const sf=program.getSourceFile(file);const checker=program.getTypeChecker();const stmts=new Map();
 for(const s of sf.statements)stmts.set(sf.getLineAndCharacterOfPosition(s.getStart(sf)).line+1,s);
 versions[v]={sf,checker,stmts};
}
const globalMap=new Map(), conflicts=[];
function bindings(n){if(ts.isFunctionDeclaration(n)||ts.isClassDeclaration(n))return n.name?[n.name]:[];if(ts.isVariableStatement(n))return n.declarationList.declarations.filter(d=>ts.isIdentifier(d.name)).map(d=>d.name);return[];}
for(const m of matches){const a=bindings(versions.v137.stmts.get(m.left.line)),b=bindings(versions.v152.stmts.get(m.right.line));if(a.length!==b.length)throw Error('shape binding mismatch');for(let i=0;i<a.length;i++){const sa=versions.v137.checker.getSymbolAtLocation(a[i]),sb=versions.v152.checker.getSymbolAtLocation(b[i]);if(sa&&sb){if(globalMap.has(sa)&&globalMap.get(sa)!==sb)conflicts.push(a[i].text);globalMap.set(sa,sb);}}}
function isProperty(n){const p=n.parent;return(ts.isPropertyAccessExpression(p)&&p.name===n)||((ts.isPropertyAssignment(p)||ts.isMethodDeclaration(p)||ts.isPropertyDeclaration(p))&&p.name===n);}
function isTop(s){return s?.declarations?.some(d=>((ts.isFunctionDeclaration(d)||ts.isClassDeclaration(d))&&ts.isSourceFile(d.parent))||(ts.isVariableDeclaration(d)&&ts.isVariableDeclarationList(d.parent)&&ts.isVariableStatement(d.parent.parent)&&ts.isSourceFile(d.parent.parent.parent))||ts.isImportSpecifier(d));}
function ids(n){const out=[];function walk(x){if(ts.isIdentifier(x))out.push(x);x.forEachChild(walk);}walk(n);return out;}
const results=[];
for(const m of matches){
 if(m.left.line<14746||m.left.line>19400)continue;
 const aa=ids(versions.v137.stmts.get(m.left.line)),bb=ids(versions.v152.stmts.get(m.right.line));
 const localMap=new Map(),reverse=new Map(),issues=[],unknowns=[];
 for(let i=0;i<aa.length;i++){
  const a=aa[i],b=bb[i];if(isProperty(a))continue;
  const sa=versions.v137.checker.getSymbolAtLocation(a),sb=versions.v152.checker.getSymbolAtLocation(b);
  if(sa&&globalMap.has(sa)){if(globalMap.get(sa)!==sb)issues.push({old:a.text,new:b.text,type:'GLOBAL_REFERENCE_MISMATCH'});}
  else if(sa&&isTop(sa)){unknowns.push({old:a.text,new:b.text,type:'UNPAIRED_GLOBAL_REFERENCE'});}
  else if(sa&&sb){if(localMap.has(sa)&&localMap.get(sa)!==sb||reverse.has(sb)&&reverse.get(sb)!==sa)issues.push({old:a.text,new:b.text,type:'LOCAL_BINDING_MISMATCH'});localMap.set(sa,sb);reverse.set(sb,sa);}
  else if(!sa&&!sb){if(a.text!==b.text)unknowns.push({old:a.text,new:b.text,type:'UNRESOLVED_EXTERNAL_RENAME'});}
  else unknowns.push({old:a.text,new:b.text,type:'ONE_SIDED_SYMBOL'});
 }
 const dedup=a=>[...new Map(a.map(x=>[JSON.stringify(x),x])).values()];
 results.push({old:m.left.name,oldLine:m.left.line,oldEnd:m.left.end,new:m.right.name,newLine:m.right.line,newEnd:m.right.end,issues:dedup(issues),unknowns:dedup(unknowns)});
}
fs.writeFileSync(path.join(root,'JS_SYMBOL_COMPARISON.json'),JSON.stringify({method:'Candidate AST pairs checked using TypeScript symbols. Paired top-level references must resolve to corresponding declarations, local symbols bijective. Unpaired and dynamic references remain unknown. Static comparison does not establish runtime behavior.',globalBindingPairs:globalMap.size,conflicts,results},null,2));
for(const r of results)if([14900,15211,15233,15238,15279,15352,15390,15445,16671,16809,17113,17568,17937,17999,18226,18231,18375,18466,18610].includes(r.oldLine))console.log(JSON.stringify(r));
