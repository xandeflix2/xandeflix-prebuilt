import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Prepared for review only. A later preflight found an unreconciled snapshot
// divergence; this audit did not execute the installer or read private files.
throw Error('INSTALLATION_SUSPENDED_NEW_PREFLIGHT_DIVERGENCE');

const dir = new URL('./', import.meta.url);
const adb = 'C:/Users/Alexandre/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const serial = 'G071CQ070344374G';
const pkg = 'com.xandeflix.prebuilt';
const expected = '0146a2fc05d3e45f5670f4c5aba0fa0d0ba1cd25bd0086f7ac00de4cb6ab8c29';
const previous = 'f1eb668de79aebd0384424c67a289eea9c5206fa8db901020789f52a8a079358';
const resultPath = new URL('FIRE_UPDATE.json', dir);
if (fs.existsSync(resultPath)) throw Error('UPDATE_RECORD_ALREADY_EXISTS');
const result = {startedAt:new Date().toISOString(),serial,package:pkg,productCodeModified:false};
const run = (...args) => execFileSync(adb,['-s',serial,...args],{encoding:'utf8',timeout:180000,maxBuffer:32*1024*1024,stdio:['ignore','pipe','pipe']}).trim();
const shell = (...args) => run('shell',...args);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function packageInfo() {
  const text = shell('dumpsys','package',pkg);
  return {firstInstallTime:text.match(/firstInstallTime=([^\r\n]+)/)?.[1].trim(),versionName:text.match(/versionName=([^\r\n]+)/)?.[1].trim(),versionCode:Number(text.match(/versionCode=(\d+)/)?.[1])};
}
function installedHash() {
  const paths = shell('pm','path',pkg).split(/\r?\n/);
  if(paths.length!==1 || !/^package:\/data\/app\/.+\/base\.apk$/.test(paths[0])) throw Error('UNEXPECTED_PACKAGE_LAYOUT');
  const path = paths[0].slice('package:'.length);
  if(!/^[a-zA-Z0-9_/=+~.\-]+$/.test(path)) throw Error('UNSAFE_PACKAGE_PATH');
  return shell('sha256sum',path).split(/\s+/)[0];
}
function privateSnapshot() {
  // Fixed read-only command. All private paths/digests stay in this process RAM.
  const command = `run-as ${pkg} sh -c 'for d in files shared_prefs databases no_backup app_webview; do if [ -d "$d" ]; then find "$d" -type l; find "$d" -type f -exec sha256sum {} \\;; fi; done'`;
  const lines = shell(command).split(/\r?\n/).filter(Boolean).sort();
  if(!lines.length || lines.some(x=>!/^\w{64}  /.test(x))) throw Error('PRIVATE_SNAPSHOT_UNSAFE_OR_INCOMPLETE');
  return lines;
}
try {
  const validation = JSON.parse(fs.readFileSync(new URL('validation-results.json',dir),'utf8'));
  for(const name of ['canonical','c11','typecheck','regression']) {
    const runs = validation.results.filter(x=>x.name===name);
    if(runs.length!==1 || runs[0].exitCode!==0) throw Error('VALIDATION_NOT_PASSED_'+name.toUpperCase());
  }
  const candidate = new URL('candidate-20261103.apk',dir);
  if(sha(fs.readFileSync(candidate))!==expected || sha(fs.readFileSync(new URL('fire-installed-before.apk',dir)))!==previous) throw Error('PUBLIC_APK_HASH_MISMATCH');
  result.before = packageInfo();
  result.before.apkSha256 = installedHash();
  if(result.before.apkSha256!==previous) throw Error('UNEXPECTED_INSTALLED_BINARY');
  if(result.before.versionCode!==52 || result.before.versionName!=='1.0.52') throw Error('UNEXPECTED_INSTALLED_VERSION');
  shell('am','force-stop',pkg);
  const beforePrivate = privateSnapshot();
  result.privateFilesBefore = beforePrivate.length;
  const install = run('install','-r',decodeURIComponent(candidate.pathname).replace(/^\/(\w:)/,'$1'));
  if(!/(?:^|\n)Success(?:\r?\n|$)/.test(install)) throw Error('INSTALL_DID_NOT_REPORT_SUCCESS');
  result.install = 'SUCCESS_IN_PLACE';
  const afterPrivate = privateSnapshot();
  result.privateFilesAfter = afterPrivate.length;
  result.privateFileBytesEqualBeforeLaunch = JSON.stringify(beforePrivate)===JSON.stringify(afterPrivate);
  result.after = packageInfo();
  result.after.apkSha256 = installedHash();
  result.firstInstallTimePreserved = result.before.firstInstallTime===result.after.firstInstallTime;
  result.binaryMatchesCandidate = result.after.apkSha256===expected;
  if(!result.privateFileBytesEqualBeforeLaunch || !result.firstInstallTimePreserved || !result.binaryMatchesCandidate) throw Error('POST_INSTALL_PRESERVATION_FAILED');
  shell('am','start','-n',pkg+'/.MainActivity');
  result.launched = true;
  result.status = 'UPDATED_BINARY_ALIGNED_DATA_PRESERVED';
} catch(error) {
  result.status = 'STOPPED';
  // Never persist raw adb stderr or snapshots, which can contain private paths.
  result.reason = /^([A-Z0-9_]+)$/.test(error.message) ? error.message : 'COMMAND_FAILED_PRIVATE_DETAILS_NOT_LOGGED';
  process.exitCode = 1;
} finally {
  result.finishedAt = new Date().toISOString();
  fs.writeFileSync(resultPath,JSON.stringify(result,null,2),{flag:'wx'});
  console.log(JSON.stringify(result));
}
