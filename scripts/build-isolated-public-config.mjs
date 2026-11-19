import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
/** Select only the three existing client configuration values; never forward arbitrary VITE_/Supabase variables. */
export function makePublicBuildEnv(values,inherited=process.env){
 const url=values.VITE_SUPABASE_URL?.trim(),publishable=values.VITE_SUPABASE_PUBLISHABLE_KEY?.trim(),tmdb=values.VITE_TMDB_API_KEY?.trim();
 if(url!=='https://cujbmyhitgomlgwfkaat.supabase.co')throw Error('PUBLIC_BUILD_CONFIG_PROJECT_INVALID');
 if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishable||''))throw Error('PUBLIC_BUILD_CONFIG_PUBLISHABLE_INVALID');
 if(!/^[a-f\d]{32}$/i.test(tmdb||''))throw Error('PUBLIC_BUILD_CONFIG_TMDB_MISSING_OR_INVALID');
 const env={...inherited};for(const name of Object.keys(env))if(/^(?:VITE_|SUPABASE_)/.test(name))delete env[name];
 return{...env,VITE_SUPABASE_URL:url,VITE_SUPABASE_PUBLISHABLE_KEY:publishable,VITE_TMDB_API_KEY:tmdb};
}
async function main(){
 if(process.argv.length!==3)throw Error('PUBLIC_BUILD_CONFIG_ROOT_ARGUMENT_REQUIRED');
 const {loadEnv}=await import('vite'),source=path.resolve(process.argv[2]),cwd=fileURLToPath(new URL('..',import.meta.url)),env=makePublicBuildEnv(loadEnv('production',source,'VITE_'));
 const r=process.platform==='win32'?spawnSync(process.env.ComSpec||'cmd.exe',['/d','/s','/c','npm run build'],{cwd,env,encoding:'utf8',windowsHide:true,maxBuffer:40e6}):spawnSync('npm',['run','build'],{cwd,env,encoding:'utf8',maxBuffer:40e6});
 const redact=text=>Object.entries(env).filter(([k])=>k==='VITE_TMDB_API_KEY'||k==='VITE_SUPABASE_PUBLISHABLE_KEY').reduce((s,[,v])=>s.split(v).join('<PUBLIC_CONFIG_REDACTED>'),String(text||''));
 process.stdout.write(redact(r.stdout));process.stderr.write(redact(r.stderr));if(r.error)throw Error('PUBLIC_BUILD_CONFIG_CHILD_FAILED');process.exitCode=r.status??1;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(/^PUBLIC_BUILD_CONFIG_[A-Z_]+$/.test(e.message)?e.message:'PUBLIC_BUILD_CONFIG_EXECUTOR_FAILED');process.exitCode=1;});
