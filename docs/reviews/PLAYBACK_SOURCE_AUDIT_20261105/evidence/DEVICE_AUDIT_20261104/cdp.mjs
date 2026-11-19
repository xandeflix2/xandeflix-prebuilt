import { execFileSync, spawnSync } from 'node:child_process';
const adb='C:/Users/Alexandre/AppData/Local/Android/Sdk/platform-tools/adb.exe';
export function shell(serial,...args){return execFileSync(adb,['-s',serial,'shell',...args],{encoding:'utf8',timeout:20000}).trim();}
export async function open(serial){
 const pid=shell(serial,'pidof','com.xandeflix.prebuilt').split(/\s+/)[0];
 const socket=shell(serial,'cat','/proc/net/unix').split('\n').map(x=>x.trim().split(/\s+/).at(-1)).find(x=>x===`@webview_devtools_remote_${pid}`);
 if(!socket)throw Error('APP_WEBVIEW_NOT_FOUND');
 const port=execFileSync(adb,['-s',serial,'forward','tcp:0','localabstract:'+socket.slice(1)],{encoding:'utf8'}).trim();
 const targets=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 const target=targets.find(x=>x.type==='page'&&/^https?:\/\/localhost(?:[/:]|$)/.test(x.url));
 if(!target){spawnSync(adb,['-s',serial,'forward','--remove','tcp:'+port]);throw Error('LOCAL_APP_PAGE_NOT_FOUND');}
 const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
 let id=0;const pending=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});
 const command=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(Error('CDP_TIMEOUT '+method));},25000);pending.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params}));});
 return {command,async evaluate(expression){const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;},close(){ws.close();spawnSync(adb,['-s',serial,'forward','--remove','tcp:'+port]);}};
}
