import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {open} from './cdp.mjs';
const adb='C:/Users/Alexandre/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const pkg='com.xandeflix.prebuilt';
const expected='0146a2fc05d3e45f5670f4c5aba0fa0d0ba1cd25bd0086f7ac00de4cb6ab8c29';
const devices=[];
for(const [label,serial] of [['fire','G071CQ070344374G'],['tablet','RX2X301Q3KY'],['phone','RXGYB03FL4W']]) {
  const shell=(...args)=>execFileSync(adb,['-s',serial,'shell',...args],{encoding:'utf8',timeout:20000}).trim();
  const info=shell('dumpsys','package',pkg);
  const apk=shell('pm','path',pkg).replace(/^package:/,'');
  if(!/^\/data\/app\/[a-zA-Z0-9_/=+~.\-]+\/base\.apk$/.test(apk))throw Error('UNEXPECTED_PACKAGE_PATH');
  const hash=shell('sha256sum',apk).split(/\s+/)[0];
  const device={label,serial,versionCode:Number(info.match(/versionCode=(\d+)/)?.[1]),versionName:info.match(/versionName=([^\r\n]+)/)?.[1].trim(),apkSha256:hash,sameAsCandidate:hash===expected};
  let c;
  try { c=await open(serial);device.updatePrompt=await c.evaluate(`(()=>{const d=document.querySelector('dialog.app-update-prompt');return d?{open:d.open,visible:d.getBoundingClientRect().height>0,releaseText:d.querySelector('p')?.textContent.trim()}:null})()`); }
  catch {device.updatePrompt='NOT_OBSERVED';}
  finally {c?.close();}
  devices.push(device);
}
const result={observedUTC:new Date().toISOString(),reference:'latest local existing candidate, not a certified production release',devices};
fs.writeFileSync(new URL('DEVICES_FINAL.json',import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
