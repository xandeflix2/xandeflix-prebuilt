import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {webcrypto,createHash,createPublicKey,verify} from 'node:crypto';
import ts from 'typescript';
let count=0;
const test=async(name,run)=>{await run();count++;console.log('PASS '+name);};
const map=new Map();
const storage={getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,String(value))};
const context=vm.createContext({crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,setTimeout,clearTimeout,console,localStorage:storage});
const cache=new Map();
function load(file) {
 file=path.resolve(file);if(cache.has(file))return cache.get(file);
 const exports={};cache.set(file,exports);
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInContext(`(function(require,exports){${source}\n})`,context)(id=>load(path.resolve(path.dirname(file),id)),exports);return exports;
}
const local=load('src/web-production/web-pin-recovery.crypto.ts');
const remote=load('supabase/functions/web-device-access/crypto.ts');
const disk=load('src/web-production/web-pin-recovery.storage.ts');
const {ParentalControlStore}=load('src/parental/parental-control.store.ts');
const puk='C156-SYNTHETIC-PUK-ONLY-DO-NOT-USE',nextPuk='C156-SECOND-SYNTHETIC-PUK-ONLY';
const device='c1560000-0000-4000-8000-000000000001',pin='682941';
const challenge=`xandeflix:c156:${device}:synthetic-challenge:random-nonce`;
let envelope,signature;
await test('PRIVATE_RECOVERY_KEY_IS_WRAPPED_WITH_RANDOM_SALT_AND_IV',async()=>{
 envelope=await local.createRecoveryEnvelope(device,puk);
 const second=await local.createRecoveryEnvelope(device,puk);
 assert.equal(envelope.publicKey.length,182);assert.notEqual(envelope.salt,second.salt);assert.notEqual(envelope.iv,second.iv);
 const serialized=JSON.stringify(envelope);assert.ok(!serialized.includes(puk));assert.ok(!serialized.includes(pin));assert.ok(!serialized.includes('privateKey'));
});
await test('PUK_SIGNATURE_ACCEPTED_BY_INDEPENDENT_NODE_IMPLEMENTATION',async()=>{
 signature=await local.signRecoveryChallenge(envelope,puk,challenge,pin);
 const digest=createHash('sha256').update(pin).digest('hex');
 const key=createPublicKey({key:Buffer.from(envelope.publicKey,'hex'),format:'der',type:'spki'});
 assert.equal(verify('sha256',Buffer.from(`${challenge}:${digest}`),{key,dsaEncoding:'ieee-p1363'},Buffer.from(signature,'hex')),true);
 assert.equal(await remote.verifyRecovery(envelope.publicKey,challenge,pin,signature),true);
});
await test('WRONG_PUK_CANNOT_DECRYPT_RECOVERY_KEY',async()=>{
 await assert.rejects(local.signRecoveryChallenge(envelope,nextPuk,challenge,pin));
});
await test('SIGNATURE_BINDS_CHALLENGE_NEW_PIN_AND_PUBLIC_KEY',async()=>{
 assert.equal(await remote.verifyRecovery(envelope.publicKey,challenge+'-other',pin,signature),false);
 assert.equal(await remote.verifyRecovery(envelope.publicKey,challenge,'111111',signature),false);
 const other=await local.createRecoveryEnvelope(device,puk);
 assert.equal(await remote.verifyRecovery(other.publicKey,challenge,pin,signature),false);
 assert.equal(await remote.verifyRecovery(envelope.publicKey,challenge,pin,'00'.repeat(64)),false);
});
await test('ENVELOPE_TAMPER_AND_DEVICE_REBIND_FAIL_CLOSED',async()=>{
 await assert.rejects(local.signRecoveryChallenge({...envelope,deviceId:'other-device'},puk,challenge,pin));
 const modified={...envelope,ciphertext:(envelope.ciphertext[0]==='a'?'b':'a')+envelope.ciphertext.slice(1)};
 await assert.rejects(local.signRecoveryChallenge(modified,puk,challenge,pin));
 assert.throws(()=>local.parseRecoveryEnvelope('{}'));
});
await test('PUK_CHANGE_REWRAPS_SAME_KEY_WITHOUT_REMOTE_PROVISIONING',async()=>{
 const changed=await local.rewrapRecoveryEnvelope(envelope,puk,nextPuk);
 assert.equal(changed.publicKey,envelope.publicKey);assert.notEqual(changed.ciphertext,envelope.ciphertext);
 await assert.rejects(local.signRecoveryChallenge(changed,puk,challenge,pin));
 assert.equal(await remote.verifyRecovery(changed.publicKey,challenge,pin,await local.signRecoveryChallenge(changed,nextPuk,challenge,pin)),true);
});
await test('CORRUPTED_LOCAL_STORAGE_IS_NOT_TREATED_AS_FIRST_SETUP',async()=>{
 map.set('xandeflix.web-pin-recovery.v1','broken');assert.throws(()=>disk.readRecoveryEnvelope());map.clear();
 disk.writeRecoveryEnvelope(envelope);assert.equal(disk.readRecoveryEnvelope().publicKey,envelope.publicKey);
});
await test('LOCAL_PUK_AUTHORIZATION_DOES_NOT_GRANT_PARENTAL_OR_ADULT_ACCESS',async()=>{
 let raw=null;
 const store=new ParentalControlStore({storage:{read:async()=>raw,write:async value=>{raw=value;}},crypto:()=>webcrypto,now:()=>1000});
 await store.configure('136824',puk,{maxAge:16,allowAdult:false});store.lock();
 await assert.rejects(store.authorizeWebPin(puk,'136824'),/WEB_PIN_MUST_DIFFER/);
 assert.equal(await store.authorizeWebPin(puk,pin),true);assert.equal(store.getSnapshot().admin,false);assert.equal(store.adultVisible(),false);
 assert.equal(await store.authorizeWebPin(nextPuk,pin),false);
 assert.equal(await store.authenticate('136824'),true);assert.equal(await store.authenticate(pin),false);store.lock();
});
await test('PARENTAL_PUK_SAVE_FAILURE_ROLLS_BACK_RECOVERY_ENVELOPE',async()=>{
 map.clear();disk.writeRecoveryEnvelope(envelope);
 let raw=null,fail=false,initialHash;
 const store=new ParentalControlStore({storage:{read:async()=>raw,write:async value=>{
  if(fail&&JSON.parse(value).puk.hash!==initialHash)throw Error('SYNTHETIC_IO_FAILURE');raw=value;
 }},crypto:()=>webcrypto,now:()=>1000,preparePukChange:disk.prepareRecoveryPukChange});
 await store.configure('136824',puk,{maxAge:16,allowAdult:false});initialHash=JSON.parse(raw).puk.hash;fail=true;
 await assert.rejects(store.changePuk(puk,nextPuk));
 const saved=disk.readRecoveryEnvelope();assert.equal(saved.ciphertext,envelope.ciphertext);
 assert.equal(await remote.verifyRecovery(saved.publicKey,challenge,pin,await local.signRecoveryChallenge(saved,puk,challenge,pin)),true);
});
await test('SUCCESSFUL_PARENTAL_PUK_CHANGE_PRESERVES_WEB_RECOVERY',async()=>{
 map.clear();disk.writeRecoveryEnvelope(envelope);let raw=null;
 const store=new ParentalControlStore({storage:{read:async()=>raw,write:async value=>{raw=value;}},crypto:()=>webcrypto,now:()=>1000,preparePukChange:disk.prepareRecoveryPukChange});
 await store.configure('136824',puk,{maxAge:16,allowAdult:false});assert.equal(await store.changePuk(puk,nextPuk),true);
 const saved=disk.readRecoveryEnvelope();assert.equal(saved.publicKey,envelope.publicKey);
 await assert.rejects(local.signRecoveryChallenge(saved,puk,challenge,pin));
 assert.equal(await remote.verifyRecovery(saved.publicKey,challenge,pin,await local.signRecoveryChallenge(saved,nextPuk,challenge,pin)),true);
 store.lock();
});
console.log(`C156_WEB_PIN_RECOVERY=${count}/${count}_PASS`);
