import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ManagedSourceVaultAdminService } from '../src/control-plane/server/managed-source-vault-admin.ts';
import {
  decryptManagedSourceConfig,
  encryptManagedSourceConfig,
} from '../src/control-plane/server/managed-source-vault.ts';

const managerPage = fs.readFileSync(new URL('../src/debug/manager/ManagerPanelPage.tsx', import.meta.url), 'utf8');
const managerAuthority = fs.readFileSync(new URL('../src/control-plane/client/manager-remote-control-plane-authority.ts', import.meta.url), 'utf8');
const browserClient = fs.readFileSync(new URL('../src/integrations/supabase/client.ts', import.meta.url), 'utf8');
const types = fs.readFileSync(new URL('../src/control-plane/control-plane.types.ts', import.meta.url), 'utf8');
const edgeFunction = fs.readFileSync(new URL('../supabase/functions/managed-source-vault-admin/index.ts', import.meta.url), 'utf8');
const r2f2Migration = fs.readFileSync(new URL('../supabase/migrations/20260911165106_r2f2_manager_vault_atomic_write.sql', import.meta.url), 'utf8');
const metadataMigration = fs.readFileSync(new URL('../supabase/migrations/20260911040039_r2e_b2_metadata_only_remote_contract.sql', import.meta.url), 'utf8');

const SYNTHETIC_M3U_URL = 'https://manager-vault.synthetic.invalid/list.m3u?sentinel=R2F2_SYNTHETIC';
const SYNTHETIC_PASSWORD = 'R2F2_SYNTHETIC_PASSWORD_SENTINEL';
const key = new Uint8Array(32).fill(7);
const keyProvider = { getKey: () => key };

const sources = new Map();
const vaultRows = new Map();
let managerAuthState = 'AUTHORIZED';

const repository = {
  async createManagedSourceWithSecret(input) {
    if (sources.has(input.sourceId)) throw new Error('SOURCE_ALREADY_EXISTS');
    sources.set(input.sourceId, {
      id: input.sourceId,
      sourceId: input.sourceId,
      name: input.name,
      sourceType: input.protocol,
      version: 1,
      status: 'ACTIVE',
    });
    vaultRows.set(`${input.sourceId}:1`, { ...input.envelope, sourceId: input.sourceId, sourceVersion: 1 });
    return { success: true, sourceId: input.sourceId, sourceVersion: 1, protocol: input.protocol, sourceStatus: 'ACTIVE', vaultStatus: 'CONFIGURED' };
  },
  async updateManagedSourceWithSecret(input) {
    const source = sources.get(input.sourceId);
    if (!source) throw new Error('SOURCE_NOT_FOUND');
    if (source.version !== input.expectedSourceVersion) throw new Error('VERSION_CONFLICT');
    const nextVersion = source.version + 1;
    source.name = input.name ?? source.name;
    source.sourceType = input.protocol;
    source.version = nextVersion;
    vaultRows.set(`${input.sourceId}:${nextVersion}`, { ...input.envelope, sourceId: input.sourceId, sourceVersion: nextVersion });
    return { success: true, sourceId: input.sourceId, sourceVersion: nextVersion, protocol: input.protocol, sourceStatus: source.status, vaultStatus: 'CONFIGURED' };
  },
};

const verifier = {
  async requireActiveManager() {
    if (managerAuthState === 'NO_SESSION') throw new Error('MANAGER_AUTH_REQUIRED');
    if (managerAuthState !== 'AUTHORIZED') throw new Error('MANAGER_NOT_AUTHORIZED');
  },
};

const admin = new ManagedSourceVaultAdminService({
  keyProvider,
  repository,
  managerVerifier: verifier,
});

let passCount = 0;
let totalTests = 0;

async function runTest(name, fn) {
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

console.log('=== XANDEFLIX PREBUILT — TESTE R2F2 MANAGER → VAULT ===');

let m3uResult;
await runTest('T1_manager_autorizado_cria_source_sintetica', async () => {
  managerAuthState = 'AUTHORIZED';
  m3uResult = await admin.createManagedSourceWithConfig({
    name: 'R2F2 Synthetic M3U',
    protocol: 'M3U',
    sourceConfig: { playlistUrl: SYNTHETIC_M3U_URL },
  });
  assert.equal(m3uResult.success, true);
  assert.match(m3uResult.sourceId, /^src_[a-z0-9]+$/);
  assert.equal(m3uResult.sourceVersion, 1);
});

await runTest('T2_vault_tem_ciphertext_sem_plaintext', () => {
  const row = vaultRows.get(`${m3uResult.sourceId}:1`);
  assert.ok(row);
  assert.doesNotMatch(JSON.stringify(row), /R2F2_SYNTHETIC|manager-vault\.synthetic/i);
  assert.match(row.ciphertext, /^[0-9a-f]+$/i);
});

await runTest('T3_create_response_nao_contem_secret', () => {
  assert.doesNotMatch(JSON.stringify(m3uResult), /R2F2_SYNTHETIC|playlistUrl|ciphertext|nonce|authTag|keyVersion/i);
});

await runTest('T4_manager_list_retorna_somente_metadata', () => {
  const source = sources.get(m3uResult.sourceId);
  const list = [{ ...source, vaultStatus: 'CONFIGURED' }];
  assert.deepEqual(Object.keys(list[0]).sort(), ['id', 'name', 'sourceId', 'sourceType', 'status', 'vaultStatus', 'version'].sort());
  assert.doesNotMatch(JSON.stringify(list), /R2F2_SYNTHETIC|playlistUrl|password|username|endpoint/i);
});

await runTest('T5_manager_nao_autorizado_recebe_denied', async () => {
  managerAuthState = 'UNAUTHORIZED';
  await assert.rejects(
    admin.createManagedSourceWithConfig({ name: 'Denied', protocol: 'M3U', sourceConfig: { playlistUrl: SYNTHETIC_M3U_URL } }),
    /MANAGER_NOT_AUTHORIZED/
  );
  managerAuthState = 'AUTHORIZED';
});

await runTest('T6_sem_auth_recebe_denied', async () => {
  managerAuthState = 'NO_SESSION';
  await assert.rejects(
    admin.createManagedSourceWithConfig({ name: 'No session', protocol: 'M3U', sourceConfig: { playlistUrl: SYNTHETIC_M3U_URL } }),
    /MANAGER_AUTH_REQUIRED/
  );
  managerAuthState = 'AUTHORIZED';
});

await runTest('T7_query_M3U_preservada_no_encrypt_decrypt', () => {
  const row = vaultRows.get(`${m3uResult.sourceId}:1`);
  const decrypted = decryptManagedSourceConfig(
    { sourceId: m3uResult.sourceId, sourceVersion: 1, protocol: 'M3U' },
    row,
    keyProvider,
  );
  assert.equal(decrypted.playlistUrl, SYNTHETIC_M3U_URL);
});

let xtreamResult;
await runTest('T8_campos_XTREAM_separados', async () => {
  xtreamResult = await admin.createManagedSourceWithConfig({
    name: 'R2F2 Synthetic XTREAM',
    protocol: 'XTREAM',
    sourceConfig: { endpoint: 'https://xtream.synthetic.invalid:8443', username: 'synthetic-manager-user', password: SYNTHETIC_PASSWORD },
  });
  const row = vaultRows.get(`${xtreamResult.sourceId}:1`);
  const decrypted = decryptManagedSourceConfig(
    { sourceId: xtreamResult.sourceId, sourceVersion: 1, protocol: 'XTREAM' },
    row,
    keyProvider,
  );
  assert.deepEqual(Object.keys(decrypted).sort(), ['endpoint', 'password', 'username'].sort());
  assert.equal(decrypted.endpoint, 'https://xtream.synthetic.invalid:8443');
});

await runTest('T9_update_incrementa_versao_exatamente_uma_vez', async () => {
  const beforeRows = vaultRows.size;
  const result = await admin.updateManagedSourceConfig({
    sourceId: m3uResult.sourceId,
    expectedSourceVersion: 1,
    name: 'R2F2 Synthetic M3U v2',
    protocol: 'M3U',
    sourceConfig: { playlistUrl: `${SYNTHETIC_M3U_URL}&version=2` },
  });
  assert.equal(result.sourceVersion, 2);
  assert.equal(sources.get(m3uResult.sourceId).version, 2);
  assert.equal(vaultRows.size, beforeRows + 1);
});

await runTest('T10_stale_manager_write_rejeitado', async () => {
  const beforeRows = vaultRows.size;
  await assert.rejects(
    admin.updateManagedSourceConfig({
      sourceId: m3uResult.sourceId,
      expectedSourceVersion: 1,
      name: 'Stale',
      protocol: 'M3U',
      sourceConfig: { playlistUrl: SYNTHETIC_M3U_URL },
    }),
    /VERSION_CONFLICT/
  );
  assert.equal(vaultRows.size, beforeRows);
  assert.equal(sources.get(m3uResult.sourceId).version, 2);
});

await runTest('T11_status_only_nao_toca_vault', () => {
  assert.doesNotMatch(metadataMigration.match(/CREATE OR REPLACE FUNCTION public\.rpc_manager_set_managed_source_status_metadata[\s\S]*?\n\$\$/)?.[0] ?? '', /managed_source_secret_vault/i);
});

await runTest('T12_status_only_nao_incrementa_versao', () => {
  const statusFunction = metadataMigration.match(/CREATE OR REPLACE FUNCTION public\.rpc_manager_set_managed_source_status_metadata[\s\S]*?\n\$\$/)?.[0] ?? '';
  assert.doesNotMatch(statusFunction, /version\s*=/i);
});

await runTest('T13_formulario_nao_persiste_secret', () => {
  assert.doesNotMatch(managerPage, /localStorage|sessionStorage|indexedDB|indexedDB|telemetry|analytics/i);
  assert.match(managerPage, /useState\('\'\)/);
});

await runTest('T14_formulario_limpa_secret_apos_sucesso', () => {
  assert.match(managerPage, /setSourcePass\('\'\);[\s\S]{0,160}setSourcePlaylistUrl\('\'\);[\s\S]{0,80}setSourceToken\('\'\)/);
  assert.match(managerPage, /setEditPass\('\'\);[\s\S]{0,180}setEditPlaylistUrl\('\'\);[\s\S]{0,100}setEditToken\('\'\)/);
});

await runTest('T15_formulario_nao_carrega_secret_existente', () => {
  const startEdit = managerPage.match(/const handleStartEditSource[\s\S]*?const handleCancelEdit/)?.[0] ?? '';
  assert.match(startEdit, /setEditUser\('\'\)/);
  assert.match(startEdit, /setEditPass\('\'\)/);
  assert.match(startEdit, /setEditPlaylistUrl\('\'\)/);
  assert.doesNotMatch(startEdit, /sourceConfig|password|username|playlistUrl.*src/i);
});

await runTest('T16_logs_nao_contem_sentinel', () => {
  assert.doesNotMatch(edgeFunction, /console\.(log|error|warn)|R2F2_SYNTHETIC_PASSWORD_SENTINEL/i);
  assert.doesNotMatch(managerAuthority, /console\.(log|error|warn)/i);
});

await runTest('T17_auditoria_nao_contem_secret', () => {
  assert.doesNotMatch(r2f2Migration, /audit|sourceConfig|password|username|playlistUrl/i);
  assert.doesNotMatch(edgeFunction, /audit|telemetry|analytics/i);
});

await runTest('T18_browser_bundle_nao_contem_vault_key', () => {
  const browserFiles = `${managerPage}\n${managerAuthority}\n${browserClient}\n${types}`;
  assert.doesNotMatch(browserFiles, /SOURCE_VAULT_KEY_|node:crypto|SUPABASE_SERVICE_ROLE|sb_secret_/i);
});

await runTest('T19_browser_nao_acessa_tabela_vault_diretamente', () => {
  const browserFiles = `${managerPage}\n${managerAuthority}\n${browserClient}`;
  assert.doesNotMatch(browserFiles, /managed_source_secret_vault|schema\(['"]private|\.from\(['"]private/i);
});

await runTest('T20_browser_nao_chama_SQL_privilegiado', () => {
  assert.doesNotMatch(`${managerPage}\n${managerAuthority}\n${browserClient}`, /SUPABASE_SERVICE_ROLE_KEY|execute_sql|SECURITY DEFINER|rpc\(['"]store_managed_source_secret/i);
});

await runTest('T21_self_service_nao_usa_vault', () => {
  assert.match(browserClient, /getConfiguredSourceConfigSealer\(\): undefined/);
  assert.doesNotMatch(managerPage, /SELF_SERVICE[\s\S]{0,240}createManagedSourceWithConfig/);
});

await runTest('T22_resolver_publico_continua_metadata_only', () => {
  assert.match(metadataMigration, /rpc_resolve_authorized_source_metadata/);
  const metadataFunction = r2f2Migration.match(/CREATE OR REPLACE FUNCTION private\.manager_source_metadata[\s\S]*?\n\$\$/)?.[0] ?? '';
  assert.doesNotMatch(metadataFunction, /\b(encrypted_payload|iv|auth_tag|protectedConfig)\b/i);
});

await runTest('T23_teste_remoto_de_source_permanece_bloqueado', () => {
  assert.match(managerPage, /Teste disponivel no dispositivo/);
  assert.doesNotMatch(managerPage, /managerTestConnection/);
});

await runTest('T24_tamper_e_missing_key_fail_closed', () => {
  const envelope = encryptManagedSourceConfig(
    { sourceId: 'src_r2f2synthetic', sourceVersion: 1, protocol: 'M3U' },
    { playlistUrl: SYNTHETIC_M3U_URL },
    keyProvider,
  );
  const tampered = { ...envelope, authTag: `${envelope.authTag.slice(0, -2)}00` };
  assert.throws(
    () => decryptManagedSourceConfig({ sourceId: 'src_r2f2synthetic', sourceVersion: 1, protocol: 'M3U' }, tampered, keyProvider),
    /VAULT_DECRYPT_FAILED/
  );
  assert.throws(
    () => encryptManagedSourceConfig({ sourceId: 'src_r2f2synthetic', sourceVersion: 1, protocol: 'M3U' }, { playlistUrl: SYNTHETIC_M3U_URL }, { getKey: () => { throw new Error('missing'); } }),
    /VAULT_KEY_UNAVAILABLE/
  );
});

console.log(`R2F2_TEST_COUNT=${totalTests}`);
console.log(`R2F2_TEST_PASS_COUNT=${passCount}`);
if (passCount !== totalTests) process.exit(1);
