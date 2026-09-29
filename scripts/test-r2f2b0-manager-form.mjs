import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SupabaseManagerRemoteControlPlaneAuthority } from '../src/control-plane/client/manager-remote-control-plane-authority.ts';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const managerPage = read('src/debug/manager/ManagerPanelPage.tsx');
const managerAuthority = read('src/control-plane/client/manager-remote-control-plane-authority.ts');
const browserClient = read('src/integrations/supabase/client.ts');
const vaultMigration = read('supabase/migrations/20260911165106_r2f2_manager_vault_atomic_write.sql');
const edgeFunction = read('supabase/functions/managed-source-vault-admin/index.ts');
const syntheticUrl = 'https://manager-form.synthetic.invalid/list.m3u?test=R2F2B0';

let passCount = 0;
let totalTests = 0;
const calls = [];
let authenticated = false;
let edgeError = null;
let sanitizedResult;

function createClient() {
  return {
    auth: {
      async getSession() {
        return { data: { session: authenticated ? { user: { id: 'synthetic-manager' } } : null }, error: null };
      },
      async signInWithPassword() {
        authenticated = true;
        return { data: { session: { user: { id: 'synthetic-manager' } } }, error: null };
      },
      async signOut() {
        authenticated = false;
        return { error: null };
      },
    },
    async rpc() {
      return { data: null, error: { message: 'UNEXPECTED_RPC' } };
    },
    functions: {
      async invoke(functionName, options) {
        calls.push({ functionName, body: options.body });
        if (edgeError) return { data: null, error: { message: edgeError } };
        return {
          data: {
            success: true,
            sourceId: 'src_r2f2b0synthetic',
            sourceVersion: 2,
            name: 'Synthetic form source',
            protocol: 'M3U',
            sourceStatus: 'ACTIVE',
            vaultStatus: 'CONFIGURED',
          },
          error: null,
        };
      },
    },
  };
}

async function test(name, fn) {
  totalTests += 1;
  try {
    await fn();
    passCount += 1;
    console.log(`  [${totalTests}] ${name}=PASS`);
  } catch (error) {
    console.error(`  [${totalTests}] ${name}=FAIL`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

console.log('=== XANDEFLIX PREBUILT — R2F2B0 MANAGER FORM ===');

const authority = new SupabaseManagerRemoteControlPlaneAuthority(createClient());

await test('T1_save_sem_sessao_retorna_AUTH_REQUIRED', async () => {
  authenticated = false;
  calls.length = 0;
  await assert.rejects(
    authority.updateManagedSourceConfig({
      sourceId: 'src_r2f2b0synthetic',
      expectedVersion: 1,
      name: 'Synthetic form source',
      protocol: 'M3U',
      sourceConfig: { playlistUrl: syntheticUrl },
    }),
    /MANAGER_AUTH_REQUIRED/
  );
  assert.equal(calls.length, 0);
});

await test('T2_manager_autenticado_permite_save', async () => {
  await authority.auth.signInWithPassword('manager@example.invalid', 'synthetic-password');
  sanitizedResult = await authority.updateManagedSourceConfig({
    sourceId: 'src_r2f2b0synthetic',
    expectedVersion: 1,
    name: 'Synthetic form source',
    protocol: 'M3U',
    sourceConfig: { playlistUrl: syntheticUrl },
  });
  assert.equal(sanitizedResult.success, true);
  assert.equal(sanitizedResult.sourceVersion, 2);
});

await test('T3_save_chama_managed_source_vault_admin', () => {
  assert.equal(calls.at(-1).functionName, 'managed-source-vault-admin');
  assert.equal(calls.at(-1).body.operation, 'UPDATE_MANAGED_SOURCE_CONFIG');
});

await test('T4_resposta_sanitizada', () => {
  const response = JSON.stringify(sanitizedResult);
  assert.doesNotMatch(response, /syntheticUrl|password|username|ciphertext|nonce|authTag|keyVersion/i);
  assert.doesNotMatch(JSON.stringify({ result: 'CONFIGURED' }), /secret|token/i);
});

await test('T5_form_secret_e_limpo_apos_sucesso', () => {
  const saveHandler = managerPage.match(/const handleSaveSourceEdit[\s\S]*?const handleToggleSourceStatus/)?.[0] ?? '';
  assert.match(saveHandler, /clearEditSecretFields\(\)/);
  assert.match(managerPage, /const clearEditSecretFields/);
  assert.match(managerPage, /setEditPass\(''\)/);
  assert.match(managerPage, /setEditPlaylistUrl\(''\)/);
  assert.match(managerPage, /setEditToken\(''\)/);
});

await test('T6_vault_status_e_por_source', () => {
  assert.match(vaultMigration, /'vaultStatus', CASE WHEN EXISTS/);
  assert.match(vaultMigration, /private\.managed_source_secret_vault/);
  assert.match(managerAuthority, /vaultStatus: data\.vaultStatus === 'CONFIGURED' \? 'CONFIGURED' : 'NOT_CONFIGURED'/);
});

await test('T7_feedback_de_erro_e_indexado_por_sourceId', () => {
  assert.match(managerPage, /Record<string, SourceFeedback>/);
  assert.match(managerPage, /sourceFeedback\[src\.sourceId\]/);
  assert.match(managerPage, /showSourceFeedback\(sourceId, sanitizeManagerErrorMessage/);
});

await test('T8_loading_de_source_e_indexado_por_sourceId', () => {
  assert.match(managerPage, /Record<string, boolean>/);
  assert.match(managerPage, /sourceSaveLoading\[sourceId\]/);
  assert.match(managerPage, /isSavingThis = Boolean\(sourceSaveLoading\[src\.sourceId\]\)/);
});

await test('T9_version_increment_e_exatamente_uma_vez', () => {
  const saveHandler = managerPage.match(/const handleSaveSourceEdit[\s\S]*?const handleToggleSourceStatus/)?.[0] ?? '';
  assert.equal((saveHandler.match(/updateManagedSourceConfig\(/g) ?? []).length, 1);
  assert.match(saveHandler, /expectedVersion: currentSource\.version/);
});

await test('T10_stale_version_denied', async () => {
  edgeError = 'VERSION_CONFLICT';
  await assert.rejects(
    authority.updateManagedSourceConfig({
      sourceId: 'src_r2f2b0synthetic',
      expectedVersion: 1,
      name: 'Stale synthetic source',
      protocol: 'M3U',
      sourceConfig: { playlistUrl: syntheticUrl },
    }),
    /VERSION_CONFLICT/
  );
  edgeError = null;
});

await test('T11_nenhuma_url_em_logs', () => {
  assert.doesNotMatch(managerPage, /console\.(log|error|warn)/);
  assert.doesNotMatch(managerAuthority, /console\.(log|error|warn)/);
  assert.doesNotMatch(edgeFunction, /console\.(log|error|warn)/);
});

await test('T12_nenhuma_url_em_storage_do_browser', () => {
  assert.doesNotMatch(managerPage, /localStorage|sessionStorage|indexedDB/i);
  assert.doesNotMatch(browserClient, /localStorage|sessionStorage|indexedDB/i);
});

await test('T13_browser_nao_possui_vault_key', () => {
  assert.doesNotMatch(`${managerPage}\n${managerAuthority}\n${browserClient}`, /SOURCE_VAULT_KEY_|SUPABASE_SERVICE_ROLE|sb_secret_/i);
});

await test('T14_browser_nao_escreve_private_table', () => {
  assert.doesNotMatch(`${managerPage}\n${managerAuthority}\n${browserClient}`, /managed_source_secret_vault|schema\(['"]private|\.from\(['"]private/i);
});

await test('T15_teste_remoto_de_source_nao_faz_fetch', () => {
  assert.doesNotMatch(managerPage, /managerTestConnection|fetch\(/);
  assert.match(managerPage, /Teste disponivel no dispositivo/);
});

console.log(`R2F2B0_TEST_COUNT=${totalTests}`);
console.log(`R2F2B0_TEST_PASS_COUNT=${passCount}`);
if (passCount !== totalTests) process.exit(1);
