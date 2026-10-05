import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
assert.equal(path.resolve(process.cwd()), path.resolve(root), 'C11_WORKSPACE_ONLY');
// Pre-open a fresh CLI session from the terminal on Windows: a daemon launched
// under spawnSync may retain its pipe after emitting a successful JSON result.
const session = process.env.C11_EXCLUSIVE_BROWSER_SESSION || 'c11-exclusive-ui';
const url = 'http://127.0.0.1:3015/scripts/exclusive-device-source-fixture.html';
const managerOnly = process.argv.includes('--manager-only');
const quote = text => `'${String(text).replaceAll("'", "''")}'`;
function browser(...args) {
  const command = `Set-Location -LiteralPath ${quote(root)}\nnpx --no-install agent-browser --session ${session} --json ${args.map(quote).join(' ')}`;
  const stdout = execFileSync('powershell.exe', ['-NoProfile', '-Command', command], { cwd: root, encoding: 'utf8', timeout: 45000, maxBuffer: 2 * 1024 * 1024 });
  const result = JSON.parse(stdout.trim()); assert.equal(result.success, true, result.error ?? 'BROWSER_COMMAND_FAILED');
  return result.data;
}
const evaluate = code => browser('eval', `eval(atob('${Buffer.from(code).toString('base64')}'))`).result;
const click = name => browser('find', 'role', 'button', 'click', '--name', name);
const checkPage = () => {
  assert.deepEqual(evaluate('window.__EXCLUSIVE_FIXTURE__.evidence().errors'), []);
  assert.equal(evaluate("!!document.querySelector('vite-error-overlay')"), false);
};
const geometry = () => evaluate(`(() => {
  const box = selector => { const e = document.querySelector(selector); if (!e || !e.getClientRects().length) return null; const r=e.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,width:r.width,height:r.height}; };
  return { key:box('.header-activation-button'), brand:box('.brand-container'), header:box('.app-header'),
    footer:Array.from(document.querySelectorAll('.mobile-bottom-nav button')).map(e=>e.getAttribute('aria-label')),
    back:box('.app-header .btn-back'), home:box('.header-home-button'), overflow:document.documentElement.scrollWidth>innerWidth };
})()`);
let checks = 0;
try {
  if (!managerOnly) {
  browser('open', url); browser('wait', '--load', 'networkidle'); browser('snapshot', '-i');
  for (const width of [390, 320]) {
    browser('set', 'viewport', String(width), '844');
    const g = geometry();
    assert.equal(g.header.height, 64); assert.equal(g.key.width, 44); assert.equal(g.key.height, 44);
    assert.ok(g.key.right <= width && g.brand.right < g.key.left); assert.equal(g.overflow, false);
    assert.equal(g.back, null); assert.equal(g.home, null);
    assert.deepEqual(g.footer, ['Ir para Filmes', 'Ir para Séries', 'Ir para Canais ao Vivo', 'Ir para Busca']);
    checks += 8; checkPage();
  }
  browser('set', 'viewport', '390', '844'); browser('screenshot', 'tmp/c11-exclusive-ui-phone.png');
  click('Abrir Ativação do dispositivo'); browser('snapshot', '-i');
  assert.equal(evaluate("document.querySelector('[data-testid=route]').textContent"), 'activation');
  let g = geometry(); assert.equal(g.key, null); assert.equal(g.header.height, 64); assert.ok(g.back.left > g.brand.right && g.home); checks += 4;
  click('Ir para Início'); browser('snapshot', '-i');
  for (const name of ['Ir para Filmes', 'Ir para Séries', 'Ir para Busca']) {
    click(name); browser('snapshot', '-i');
    g = geometry(); assert.equal(g.key, null); assert.equal(g.header.height, 64); assert.ok(g.back.left > g.brand.right); checks += 3;
  }
  click('Ir para Início'); click('Detalhes sintéticos'); browser('snapshot', '-i');
  g = geometry(); assert.equal(g.key, null); assert.equal(g.home, null); assert.equal(g.header.height, 64); checks += 3;
  click('Voltar para a tela anterior'); browser('snapshot', '-i');
  for (const size of [[1024, 768], [960, 540], [1440, 900], [800, 1280]]) {
    browser('set', 'viewport', ...size.map(String));
    g = geometry(); assert.equal(g.key, null); assert.equal(g.back, null); assert.equal(g.overflow, false); checks += 3;
  }
  checkPage(); console.log(`PASS HEADER_RESPONSIVE_CHECKS=${checks}`);
  }
  browser('open', `${url}?manager`); browser('set', 'viewport', '1200', '900'); browser('snapshot', '-i');
  console.log('PASS MANAGER_PAGE_LOADS_WITHOUT_REAL_BACKEND');
  click('Inspecionar'); browser('snapshot', '-i'); click('Trocar fonte exclusiva'); browser('snapshot', '-i');
  console.log('PASS MANAGER_FORM_VISIBLE');
  assert.equal(evaluate("document.querySelector('input[type=url]').value"), '');
  assert.equal(evaluate("document.querySelector('button[type=submit]').disabled"), true);
  browser('find', 'label', 'URL da fonte M3U/M3U8', 'fill', 'https://source.synthetic.invalid/new.m3u');
  browser('find', 'role', 'checkbox', 'check');
  evaluate('window.__EXCLUSIVE_FIXTURE__.failSwitch(true)');
  click('Aplicar somente neste dispositivo');
  browser('wait', 'button[type=submit]:not([disabled])'); browser('snapshot', '-i');
  assert.equal(evaluate("document.querySelector('input[type=url]') === null"), true);
  assert.match(evaluate("document.querySelector('form [role=status]').textContent"), /vínculo não confirmado/);
  let evidence = evaluate('window.__EXCLUSIVE_FIXTURE__.evidence()');
  assert.equal(evidence.creates, 1); assert.equal(evidence.applied, 0); assert.equal(evidence.bindings[0].sourceId, 'src_shared');
  evaluate('window.__EXCLUSIVE_FIXTURE__.failSwitch(false)');
  click('Verificar / concluir vínculo'); browser('wait', 'form button[type=button]:not([disabled])'); browser('snapshot', '-i');
  evidence = evaluate('window.__EXCLUSIVE_FIXTURE__.evidence()');
  assert.equal(evidence.creates, 1); assert.equal(evidence.switches, 2); assert.equal(evidence.applied, 1);
  assert.equal(evidence.bindings[0].sourceId, 'src_exclusive'); assert.equal(evidence.bindings[1].sourceId, 'src_shared');
  assert.equal(evidence.original.sourceId, 'src_shared'); assert.equal(evidence.original.version, 1);
  assert.match(evaluate("document.querySelector('form [role=status]').textContent"), /vinculada somente a este dispositivo/);
  assert.equal(evaluate("document.querySelector('form button[type=submit]') === null"), true);
  browser('screenshot', 'tmp/c11-exclusive-ui-manager.png'); checkPage();
  console.log('PASS MANAGER_BROWSER_FORM_CREATE_SWITCH_FAILURE_RETRY_VERIFY_AND_ISOLATION');
  console.log('C11_EXCLUSIVE_UI_BROWSER=PASS; synthetic local UI/API fixtures only; physical devices and live writes NOT tested');
} catch (error) {
  console.error(`BROWSER_PRIMARY_FAILURE=${error instanceof Error ? error.message : 'UNKNOWN'}`);
  try { browser('screenshot', 'tmp/c11-exclusive-ui-error.png'); } catch { console.error('BROWSER_ERROR_CAPTURE_UNAVAILABLE'); }
  throw error;
} finally {
  try { browser('close'); } catch { console.error('BROWSER_CLEANUP_FAILED'); process.exitCode = 1; }
}
