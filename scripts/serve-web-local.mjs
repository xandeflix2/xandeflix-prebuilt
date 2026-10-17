import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import https from 'node:https';import os from 'node:os';import {fileURLToPath,pathToFileURL} from 'node:url';
const workspace=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function localAddress(value='') {
  const ip=value.replace(/^::ffff:/,'');
  return ip==='::1'||ip.startsWith('127.')||ip.startsWith('10.')||ip.startsWith('192.168.')||/^172\.(1[6-9]|2\d|3[01])\./.test(ip)||/^(fd|fc|fe80:)/i.test(ip);
}
export const lanAddresses=()=>Object.values(os.networkInterfaces()).flat().filter(a=>a&&a.family==='IPv4'&&!a.internal&&localAddress(a.address)).map(a=>a.address);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ico':'image/x-icon','.woff2':'font/woff2'};
export function createWebServer({root=path.join(workspace,'tmp/c136-browser-web/site'),host='127.0.0.1',port=3001,tls}={}) {
  if(!['127.0.0.1','localhost','::1'].includes(host)&&!tls)throw Error('LAN_REQUIRES_HTTPS');
  const resolvedRoot=fs.realpathSync(root),allowedHosts=new Set(['localhost','127.0.0.1','::1',...lanAddresses()]);
  const handler=(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Security-Policy',"frame-ancestors 'none'; object-src 'none'; base-uri 'none'");
    res.setHeader('X-Frame-Options','DENY');
    const deny=(code=403)=>{res.statusCode=code;res.end('Acesso indisponível.');};
    if(!localAddress(req.socket.remoteAddress))return deny();
    let authority;try{authority=new URL('http://'+req.headers.host);if(!allowedHosts.has(authority.hostname.replace(/^\[|\]$/g,''))||(authority.port&&Number(authority.port)!==Number(res.socket.localPort)))return deny();}catch{return deny();}
    if(req.method!=='GET'&&req.method!=='HEAD')return deny(405);
    let pathname;try{pathname=decodeURIComponent((req.url||'/').split('?')[0]);}catch{return deny(400);}
    if(!pathname.startsWith('/')||/[\\\u0000-\u001f]/.test(pathname)||pathname.split('/').some(p=>p.startsWith('.')||p.includes(':')))return deny();
    const file=path.resolve(resolvedRoot,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(resolvedRoot+path.sep))return deny();
    const type=types[path.extname(file).toLowerCase()];if(!type)return deny(404);
    let real,stat;try{real=fs.realpathSync(file);stat=fs.statSync(real);}catch{return deny(404);}
    if(!real.startsWith(resolvedRoot+path.sep)||!stat.isFile())return deny();
    res.setHeader('Content-Type',type);res.setHeader('Content-Length',stat.size);
    if(req.method==='HEAD'){res.end();return;}
    const stream=fs.createReadStream(real);stream.on('error',()=>res.destroy());stream.pipe(res);
  };
  const server=tls?https.createServer(tls,handler):http.createServer(handler);return {server,host,port};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const args=process.argv.slice(2),option=(name,fallback)=>{const at=args.indexOf(name);return at<0?fallback:args[at+1];};
  const host=option('--host','127.0.0.1'),port=Number(option('--port','3001')),pfx=option('--pfx'),cert=option('--cert'),key=option('--key');
  if(!Number.isInteger(port)||port<1024||port>65535)throw Error('INVALID_PORT');
  const tls=pfx?{pfx:fs.readFileSync(pfx),passphrase:process.env.XANDEFLIX_WEB_PFX_PASSWORD}:cert&&key?{cert:fs.readFileSync(cert),key:fs.readFileSync(key)}:undefined;
  delete process.env.XANDEFLIX_WEB_PFX_PASSWORD;
  const {server}=createWebServer({host,port,tls});server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Porta ocupada. Escolha outra porta.':'Não foi possível iniciar o servidor web.');process.exitCode=1;});
  server.listen(port,host,()=>{const scheme=tls?'https':'http';console.log('Xandeflix web: '+scheme+'://localhost:'+port);if(host==='0.0.0.0')for(const ip of lanAddresses())console.log('Rede local: '+scheme+'://'+ip+':'+port);});
}
