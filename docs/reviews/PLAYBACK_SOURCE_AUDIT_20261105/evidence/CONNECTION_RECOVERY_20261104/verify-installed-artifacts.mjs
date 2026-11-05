import fs from'node:fs';import crypto from'node:crypto';import{execFileSync}from'node:child_process';
const adb='C:/Users/Alexandre/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const reference='C:/Users/Alexandre/Downloads/app-debug.apk';
const buf=fs.readFileSync(reference),sha=crypto.createHash('sha256').update(buf).digest('hex');
const devices=[];
const connected=execFileSync(adb,['devices'],{encoding:'utf8'});
for(const [label,serial]of [['TABLET','RX2X301Q3KY'],['PHONE','RXGYB03FL4W'],['FIRE_USB','G071CQ070344374G']]){
 if(!connected.split(/\r?\n/).some(x=>x.startsWith(serial+'\tdevice'))){devices.push({label,status:'NOT_CONNECTED_AT_OBSERVATION'});continue;}
 const shell=(...args)=>execFileSync(adb,['-s',serial,'shell',...args],{encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:20000});
 const paths=shell('pm','path','com.xandeflix.prebuilt').trim().split(/\r?\n/).filter(x=>x.startsWith('package:')).map(x=>x.slice(8));
 if(paths.length!==1||!/^\/data\/app\/[A-Za-z0-9_./=+~-]+\/base[.]apk$/.test(paths[0])||paths[0].includes('..'))throw Error('UNEXPECTED_INSTALLED_APK_LAYOUT');
 const hash=shell('sha256sum',paths[0]).match(/^[a-f0-9]{64}/i)?.[0].toLowerCase();if(!hash)throw Error('DEVICE_HASH_UNAVAILABLE');
 const pkg=shell('dumpsys','package','com.xandeflix.prebuilt');
 devices.push({label,serial,model:shell('getprop','ro.product.model').trim(),status:'INSPECTED',versionCode:Number(pkg.match(/versionCode=([0-9]+)/)?.[1]),versionName:pkg.match(/versionName=([^\s]+)/)?.[1],firstInstallTime:pkg.match(/firstInstallTime=([^\r\n]+)/)?.[1]?.trim(),lastUpdateTime:pkg.match(/lastUpdateTime=([^\r\n]+)/)?.[1]?.trim(),sha256:hash,matchesProvidedApk:hash===sha,splitApks:paths.length-1});
}
const out={observedUTC:new Date().toISOString(),providedApk:{path:reference,bytes:buf.length,sha256:sha},devices,allInspectedIdentical:devices.filter(x=>x.status==='INSPECTED').every(x=>x.matchesProvidedApk),allTargetsCurrentlyInspected:devices.every(x=>x.status==='INSPECTED'),scope:'Byte identity of the provided APK and base APK files on reachable devices; disconnected targets explicitly not certified by this observation. No installation performed.'};
fs.writeFileSync(new URL('LATEST_APK_VS_INSTALLED.json',import.meta.url),JSON.stringify(out,null,2));console.log(JSON.stringify(out));
