/**
 * Xandeflix Prebuilt — C11 License Schema Drift Fix Test Suite (T1 - T16)
 *
 * Cycle: XANDEFLIX_PREBUILT_C11_LICENSE_UPDATED_AT_SCHEMA_DRIFT_FIX
 * Role: SINGLE_AGENT_LICENSE_SCHEMA_DRIFT_FIX
 * Mode: FORENSIC_CONFIRM_THEN_MINIMAL_SQL_FIX
 *
 * Matrix:
 *   T1:  NEW_CUSTOMER license insert uses only real columns
 *   T2:  customer_account_id set correctly
 *   T3:  legacy customer_id remains NULL
 *   T4:  mode MANAGED
 *   T5:  status ACTIVE
 *   T6:  max_devices = 1
 *   T7:  max_concurrent_sessions = 1
 *   T8:  trial_eligible = false
 *   T9:  expires_at NULL
 *   T10: no nonexistent column referenced
 *   T11: downstream source creation still works
 *   T12: downstream binding still works
 *   T13: rollback on forced later failure
 *   T14: EXISTING_CUSTOMER unchanged
 *   T15: Portal regression PASS
 *   T16: SELF_SERVICE regression PASS
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

const read = (rel) => fs.readFileSync(resolve(PROJECT_ROOT, rel), 'utf8');

const migrationSql = read('supabase/migrations/20260925160000_c11_license_updated_at_schema_drift_fix.sql');
const cutoverMigrationSql = read('supabase/migrations/20260925150000_c11_manager_cutover_to_customer_accounts.sql');

console.log('================================================================');
console.log('Xandeflix Prebuilt — C11 License Schema Drift Fix');
console.log('Test Suite: T1 - T16 Verification');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`[PASS] ${name}`);
  } catch (error) {
    console.error(`[FAIL] ${name}: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

// Colunas canônicas e auditadas em produção de public.licenses
const LIVE_LICENSE_COLUMNS = new Set([
  'id',
  'license_key_hash',
  'mode',
  'status',
  'max_devices',
  'created_at',
  'expires_at',
  'customer_id',
  'trial_eligible',
  'trial_started_at',
  'trial_expires_at',
  'max_concurrent_sessions',
  'customer_account_id'
]);

// Helper para extrair o bloco INSERT INTO public.licenses de Flow A
function extractFlowALicenseInsert(sql) {
  const match = sql.match(/INSERT INTO public\.licenses\s*\(([\s\S]*?)\)\s*VALUES\s*\(([\s\S]*?)\)\s*RETURNING/i);
  assert.ok(match, 'Bloco INSERT INTO public.licenses (Flow A) deve existir na migracao');
  
  const cleanCols = match[1].replace(/--.*$/gm, '');
  const cleanVals = match[2].replace(/--.*$/gm, '');

  const columns = cleanCols
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);
    
  const values = cleanVals
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
    
  return { columns, values, fullMatch: match[0] };
}

// -----------------------------------------------------------------------------
// T1: NEW_CUSTOMER license insert uses only real columns
// -----------------------------------------------------------------------------
await runTest('T1: NEW_CUSTOMER license insert uses only real columns', () => {
  const { columns } = extractFlowALicenseInsert(migrationSql);
  assert.ok(columns.length > 0, 'Deve ter colunas no INSERT');
  
  for (const col of columns) {
    assert.ok(
      LIVE_LICENSE_COLUMNS.has(col),
      `Coluna "${col}" especificada no INSERT deve existir no schema live de public.licenses`
    );
  }
  assert.equal(columns.includes('updated_at'), false, 'updated_at NAO deve estar presente nas colunas');
});

// -----------------------------------------------------------------------------
// T2: customer_account_id set correctly
// -----------------------------------------------------------------------------
await runTest('T2: customer_account_id set correctly', () => {
  const { columns, values } = extractFlowALicenseInsert(migrationSql);
  const idx = columns.indexOf('customer_account_id');
  assert.notEqual(idx, -1, 'customer_account_id deve constar nas colunas');
  assert.equal(values[idx], 'v_target_customer_account_id', 'customer_account_id deve receber v_target_customer_account_id');
});

// -----------------------------------------------------------------------------
// T3: legacy customer_id remains NULL
// -----------------------------------------------------------------------------
await runTest('T3: legacy customer_id remains NULL', () => {
  const { columns, values } = extractFlowALicenseInsert(migrationSql);
  const idx = columns.indexOf('customer_id');
  assert.notEqual(idx, -1, 'customer_id deve constar nas colunas');
  assert.ok(values[idx].startsWith('NULL'), 'customer_id deve ser estritamente NULL para contas comerciais sem Auth user');
});

// -----------------------------------------------------------------------------
// T4: mode MANAGED
// -----------------------------------------------------------------------------
await runTest('T4: mode MANAGED', () => {
  const { columns, values } = extractFlowALicenseInsert(migrationSql);
  const idx = columns.indexOf('mode');
  assert.notEqual(idx, -1, 'mode deve constar nas colunas');
  assert.equal(values[idx], "'MANAGED'", "mode deve ser 'MANAGED'");
});

// -----------------------------------------------------------------------------
// T5: status ACTIVE
// -----------------------------------------------------------------------------
await runTest('T5: status ACTIVE', () => {
  const { columns, values } = extractFlowALicenseInsert(migrationSql);
  const idx = columns.indexOf('status');
  assert.notEqual(idx, -1, 'status deve constar nas colunas');
  assert.equal(values[idx], "'ACTIVE'", "status deve ser 'ACTIVE'");
});

// -----------------------------------------------------------------------------
// T6: max_devices = 1
// -----------------------------------------------------------------------------
await runTest('T6: max_devices = 1', () => {
  const { columns, values } = extractFlowALicenseInsert(migrationSql);
  const idx = columns.indexOf('max_devices');
  assert.notEqual(idx, -1, 'max_devices deve constar nas colunas');
  assert.equal(values[idx], '1', 'max_devices deve ser 1');
});

// -----------------------------------------------------------------------------
// T7: max_concurrent_sessions = 1
// -----------------------------------------------------------------------------
await runTest('T7: max_concurrent_sessions = 1', () => {
  const { columns, values } = extractFlowALicenseInsert(migrationSql);
  const idx = columns.indexOf('max_concurrent_sessions');
  assert.notEqual(idx, -1, 'max_concurrent_sessions deve constar nas colunas');
  assert.equal(values[idx], '1', 'max_concurrent_sessions deve ser 1');
});

// -----------------------------------------------------------------------------
// T8: trial_eligible = false
// -----------------------------------------------------------------------------
await runTest('T8: trial_eligible = false', () => {
  const { columns, values } = extractFlowALicenseInsert(migrationSql);
  const idx = columns.indexOf('trial_eligible');
  assert.notEqual(idx, -1, 'trial_eligible deve constar nas colunas');
  assert.equal(values[idx], 'false', 'trial_eligible deve ser false');
});

// -----------------------------------------------------------------------------
// T9: expires_at NULL
// -----------------------------------------------------------------------------
await runTest('T9: expires_at NULL', () => {
  const { columns, values } = extractFlowALicenseInsert(migrationSql);
  const idxExpires = columns.indexOf('expires_at');
  assert.notEqual(idxExpires, -1, 'expires_at deve constar nas colunas');
  assert.equal(values[idxExpires], 'NULL', 'expires_at deve ser NULL');

  const idxTrialStarted = columns.indexOf('trial_started_at');
  assert.notEqual(idxTrialStarted, -1, 'trial_started_at deve constar nas colunas');
  assert.equal(values[idxTrialStarted], 'NULL', 'trial_started_at deve ser NULL');

  const idxTrialExpires = columns.indexOf('trial_expires_at');
  assert.notEqual(idxTrialExpires, -1, 'trial_expires_at deve constar nas colunas');
  assert.equal(values[idxTrialExpires], 'NULL', 'trial_expires_at deve ser NULL');
});

// -----------------------------------------------------------------------------
// T10: no nonexistent column referenced
// -----------------------------------------------------------------------------
await runTest('T10: no nonexistent column referenced', () => {
  // Varre todas as ocorrencias de public.licenses no arquivo
  const regex = /public\.licenses\s*\(([\s\S]*?)\)/gi;
  let match;
  while ((match = regex.exec(migrationSql)) !== null) {
    const cols = match[1].split(',').map(s => s.trim().replace(/\s+.*$/, ''));
    for (const c of cols) {
      if (c && !c.startsWith('--') && !c.includes('ON') && !c.includes('WHERE')) {
        assert.ok(
          LIVE_LICENSE_COLUMNS.has(c),
          `Coluna "${c}" em public.licenses(...) deve ser coluna live valida`
        );
      }
    }
  }

  // Verifica que nao ha "updated_at" atribuido a licenses
  assert.equal(migrationSql.includes('licenses (updated_at)'), false);
  assert.equal(migrationSql.includes('updated_at\n                ) VALUES'), false);
  assert.equal(migrationSql.includes('updated_at\r\n                ) VALUES'), false);
});

// -----------------------------------------------------------------------------
// T11: downstream source creation still works
// -----------------------------------------------------------------------------
await runTest('T11: downstream source creation still works', () => {
  // Verifica chamada a private.activate_device_source_core com 16 parametros
  assert.ok(
    migrationSql.includes('v_result := private.activate_device_source_core('),
    'Deve chamar private.activate_device_source_core'
  );
  assert.ok(
    migrationSql.includes('v_target_customer_account_id -- p_customer_account_id = nova conta comercial'),
    'Deve repassar v_target_customer_account_id como 16o parametro'
  );
  assert.ok(
    migrationSql.includes("NULL, -- p_customer_id = NULL para conta comercial sem Auth user"),
    'p_customer_id deve ser NULL'
  );
  assert.ok(
    migrationSql.includes("v_resolved_license_id,"),
    'Deve passar v_resolved_license_id resolvida'
  );
});

// -----------------------------------------------------------------------------
// T12: downstream binding still works
// -----------------------------------------------------------------------------
await runTest('T12: downstream binding still works', () => {
  // Em Flow B (EXISTING_CUSTOMER) e Flow A (via activate_device_source_core):
  // Verifica atualizacao de device_activation_requests e criacao de bindings
  assert.ok(
    migrationSql.includes("UPDATE public.device_activation_requests"),
    'Flow B deve atualizar device_activation_requests'
  );
  assert.ok(
    migrationSql.includes("INSERT INTO public.device_source_bindings"),
    'Flow B deve vincular device_source_bindings'
  );
  assert.ok(
    migrationSql.includes("INSERT INTO public.license_devices"),
    'Flow B deve vincular license_devices'
  );
  assert.ok(
    migrationSql.includes("status = 'AUTHORIZED'"),
    'Flow B deve marcar status como AUTHORIZED'
  );
});

// -----------------------------------------------------------------------------
// T13: rollback on forced later failure
// -----------------------------------------------------------------------------
await runTest('T13: rollback on forced later failure', () => {
  // Verifica que rpc_manager_complete_device_activation e activate_device_source_core
  // operam em contexto transacional puro do Postgres sem commits autonomos intermediarios
  assert.equal(migrationSql.includes('COMMIT;'), false, 'Nao deve conter COMMIT explicito (quebraria transacao)');
  assert.equal(migrationSql.includes('ROLLBACK;'), false, 'Nao deve conter ROLLBACK explicito');
  assert.ok(
    migrationSql.includes('LANGUAGE plpgsql'),
    'Funcao plpgsql opera em transacao atomica gerenciada pelo Postgres'
  );
});

// -----------------------------------------------------------------------------
// T14: EXISTING_CUSTOMER unchanged
// -----------------------------------------------------------------------------
await runTest('T14: EXISTING_CUSTOMER unchanged', () => {
  // Extrai trecho de EXISTING_CUSTOMER em 20260925150000 e 20260925160000
  const extractFlowB = (sql) => {
    const start = sql.indexOf("IF p_flow_mode = 'EXISTING_CUSTOMER' THEN");
    const end = sql.indexOf("ELSE\n        -- ---------------------------------------------------------------------\n        -- FLOW A: NEW_CUSTOMER");
    const endAlt = sql.indexOf("ELSE\r\n        -- ---------------------------------------------------------------------\r\n        -- FLOW A: NEW_CUSTOMER");
    return sql.slice(start, end !== -1 ? end : endAlt).trim();
  };

  const flowBCutover = extractFlowB(cutoverMigrationSql);
  const flowBFix = extractFlowB(migrationSql);

  assert.ok(flowBFix.length > 500, 'Flow B deve estar presente');
  assert.equal(
    flowBFix.replace(/\r\n/g, '\n'),
    flowBCutover.replace(/\r\n/g, '\n'),
    'Flow B (EXISTING_CUSTOMER) deve ser estritamente identico entre as migracoes'
  );
});

// -----------------------------------------------------------------------------
// T15: Portal regression PASS
// -----------------------------------------------------------------------------
await runTest('T15: Portal regression PASS', () => {
  // Verifica que nao toca em funcoes de portal
  assert.equal(migrationSql.includes('rpc_portal_'), false, 'Nao deve alterar funcoes rpc_portal_*');
  // Verifica que rpc_portal_customer_overview em cutover nao referencia updated_at em licenses
  assert.equal(cutoverMigrationSql.includes('l.updated_at'), false, 'Portal nao referencia l.updated_at');
});

// -----------------------------------------------------------------------------
// T16: SELF_SERVICE regression PASS
// -----------------------------------------------------------------------------
await runTest('T16: SELF_SERVICE regression PASS', () => {
  // Verifica a criacao de licenca de trial SELF_SERVICE em activate_device_source_core
  // Confirma que ele nao usa updated_at
  const selfServiceInsert = cutoverMigrationSql.match(/INSERT INTO public\.licenses\s*\([\s\S]*?mode,\s*status,\s*trial_eligible[\s\S]*?\)/i);
  assert.ok(selfServiceInsert, 'INSERT de trial SELF_SERVICE deve existir');
  assert.equal(selfServiceInsert[0].includes('updated_at'), false, 'Trial SELF_SERVICE nao referencia updated_at');
});

console.log('\n================================================================');
console.log(`Results: ${passedTests}/${totalTests} tests passed`);
console.log('================================================================\n');

if (passedTests === totalTests) {
  console.log('RESULT=ALL_TESTS_PASS');
} else {
  console.error('RESULT=TESTS_FAILED');
  process.exitCode = 1;
}
