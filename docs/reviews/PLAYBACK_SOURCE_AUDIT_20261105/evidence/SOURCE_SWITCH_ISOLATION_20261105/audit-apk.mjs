import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync}from'node:child_process';import JSZip from './workspace/node_modules/jszip/lib/index.js';
const folder='C:/Xandeflix/Audits/SOURCE_SWITCH_ISOLATION_20261105',root=folder+'/workspace',sdk='C:/Users/Alexandre/AppData/Local/Android/Sdk/build-tools/35.0.0',apk=root+'/android/app/build/outputs/apk/debug/app-debug.apk',reference='C:/Users/Alexandre/Downloads/app-debug.apk';
const build=JSON.parse(fs.readFileSync(folder+'/BUILD_RESULTS.json'));if(build.length!==6||build.some(r=>r.exitCode!==0))throw Error('BUILD_GATES_INCOMPLETE');
const badging=execFileSync(sdk+'/aapt.exe',['dump','badging',apk],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
const version=badging.match(/package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'/);if(!version||version[1]!=='com.xandeflix.prebuilt'||version[2]!=='53'||version[3]!=='1.0.53')throw Error('APK_IDENTITY_MISMATCH');
const cert=execFileSync(process.env.ComSpec||'cmd.exe',['/d','/s','/c',sdk+'/apksigner.bat verify --print-certs '+apk],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
const certificate=cert.match(/certificate SHA-256 digest: ([a-f0-9]+)/i)?.[1]?.toLowerCase();if(certificate!=='b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d')throw Error('APK_SIGNER_MISMATCH');
const zip=await JSZip.loadAsync(fs.readFileSync(apk));const assets=[];
async function checkDist(directory,relative=''){for(const d of fs.readdirSync(directory,{withFileTypes:true})){const rel=relative?relative+'/'+d.name:d.name,full=directory+'/'+d.name;if(d.isDirectory())await checkDist(full,rel);else{
 const entry=zip.file('assets/public/'+rel);if(!entry)throw Error('APK_DIST_FILE_MISSING');const inside=await entry.async('nodebuffer'),outside=fs.readFileSync(full);if(!inside.equals(outside))throw Error('APK_DIST_BYTES_DIFFER');assets.push({path:rel,bytes:outside.length,sha256:crypto.createHash('sha256').update(outside).digest('hex')});
 if(/\.(?:js|html|json|css)$/.test(rel)&&/sb_secret_[A-Za-z0-9_-]{8,}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/.test(outside.toString('utf8')))throw Error('PRIVILEGED_SECRET_PATTERN_IN_PUBLIC_ASSET');
}}}
await checkDist(root+'/dist');
const forbidden=Object.keys(zip.files).filter(p=>/(^|\/)(?:\.env(?:\.|$)|device_identity\.json|device_activation\.json|device_activation_key\.json|pending_device_token\.json)|\.(?:jks|keystore|p12|pfx)$/.test(p));if(forbidden.length)throw Error('PRIVATE_FILE_IN_APK');
const permissions=p=>execFileSync(sdk+'/aapt.exe',['dump','permissions',p],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).split('\n').filter(s=>s.startsWith('uses-permission')).sort();
if(JSON.stringify(permissions(apk))!==JSON.stringify(permissions(reference)))throw Error('APK_PERMISSIONS_CHANGED');
let tests=0,failures=0,errors=0,skips=0,suites=0;const reports=root+'/android/app/build/test-results/testDebugUnitTest';
for(const f of fs.readdirSync(reports).filter(x=>x.endsWith('.xml'))){const s=fs.readFileSync(reports+'/'+f,'utf8').match(/<testsuite\b[^>]+>/)?.[0];if(!s)throw Error('UNIT_REPORT_INVALID');const n=k=>Number(s.match(new RegExp('\\b'+k+'="(\\d+)"'))?.[1]||0);tests+=n('tests');failures+=n('failures');errors+=n('errors');skips+=n('skipped');suites++;}
if(!tests||failures||errors||skips)throw Error('NATIVE_TESTS_NOT_FULL_PASS');
const destination=folder+'/Xandeflix-v1.0.53-Source-Isolation-20261105.apk';fs.copyFileSync(apk,destination,fs.constants.COPYFILE_EXCL);
const bytes=fs.readFileSync(destination),result={observedUTC:new Date().toISOString(),result:'PASS',packageId:version[1],versionCode:53,versionName:'1.0.53',certificateSha256:certificate,apkSha256:crypto.createHash('sha256').update(bytes).digest('hex'),apkBytes:bytes.length,artifact:destination,assets,nativeUnitTests:{tests,suites,failures,errors,skips},standaloneSourceArtworkTest:'PASS_FROM_REVIEW_11_TARGET_UI',permissionsUnchanged:true,privateFileNamesFound:0,privilegedSecretPatternFound:0,physicalPlayback:'PENDING',releaseHomologation:false};fs.writeFileSync(folder+'/APK_AUDIT.json',JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify(result));
