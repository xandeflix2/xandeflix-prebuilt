/**
 * =============================================================================
 * TEST: C11 DEVICE BINDING FK ORDER FIX
 * =============================================================================
 * Validates that the migration correctly reorders DML statements so that
 * INSERT INTO public.devices precedes any INSERT into device_source_bindings
 * or license_devices in both affected functions.
 *
 * Test Categories:
 *   T1-T4:   Structural validation of activate_device_source_core (16 params)
 *   T5-T8:   Structural validation of rpc_manager_complete_device_activation
 *   T9-T12:  Signature and permission preservation
 *   T13-T16: Regression guards
 * =============================================================================
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const MIGRATION_PATH = resolve(
  process.cwd(),
  'supabase/migrations/20260925170000_c11_device_binding_fk_order_fix.sql'
);

let migrationContent;
try {
  migrationContent = readFileSync(MIGRATION_PATH, 'utf-8');
} catch (err) {
  console.error(`FATAL: Cannot read migration file: ${MIGRATION_PATH}`);
  process.exit(1);
}

let passed = 0;
let failed = 0;
const results = [];

function test(id, description, fn) {
  try {
    const result = fn();
    if (result === true) {
      passed++;
      results.push({ id, description, status: 'PASS' });
    } else {
      failed++;
      results.push({ id, description, status: 'FAIL', detail: result });
    }
  } catch (err) {
    failed++;
    results.push({ id, description, status: 'ERROR', detail: err.message });
  }
}

// Helper: Find the function body between CREATE OR REPLACE FUNCTION ... and the matching $$;
function extractFunctionBody(content, functionName) {
  // Use a simpler, more robust approach: find the function by name, then extract body between $$ markers
  const lines = content.split('\n');
  const bodies = [];
  let inFunction = false;
  let bodyLines = [];
  let dollarCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!inFunction && line.includes('CREATE OR REPLACE FUNCTION') && line.includes(functionName)) {
      inFunction = true;
      dollarCount = 0;
      bodyLines = [];
      continue;
    }
    
    if (inFunction) {
      // Count $$ markers
      const dollarMatches = line.match(/\$\$/g);
      if (dollarMatches) {
        for (const _ of dollarMatches) {
          dollarCount++;
          if (dollarCount === 1) {
            // Start of body - don't include this line's content before $$
            continue;
          }
          if (dollarCount === 2) {
            // End of body
            inFunction = false;
            bodies.push(bodyLines.join('\n'));
            break;
          }
        }
      }
      
      if (inFunction && dollarCount >= 1) {
        bodyLines.push(line);
      }
    }
  }
  
  return bodies;
}

// Helper: Get line positions of INSERT statements within a block
function findInsertPositions(body) {
  const lines = body.split('\n');
  const positions = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('INSERT INTO public.devices')) {
      positions.push({ table: 'devices', line: i, text: line });
    } else if (line.startsWith('INSERT INTO public.device_source_bindings')) {
      positions.push({ table: 'device_source_bindings', line: i, text: line });
    } else if (line.startsWith('INSERT INTO public.license_devices')) {
      positions.push({ table: 'license_devices', line: i, text: line });
    }
  }
  return positions;
}

// ===========================================================================
// T1-T4: activate_device_source_core (16 params)
// ===========================================================================

const coreBodies = extractFunctionBody(migrationContent, 'private.activate_device_source_core');

test('T1', 'activate_device_source_core (16 params) exists in migration', () => {
  // The 16-param version should be the first match (longer body)
  return coreBodies.length >= 1 || 'Function not found in migration';
});

test('T2', 'devices INSERT precedes device_source_bindings INSERT in core', () => {
  if (coreBodies.length === 0) return 'No function body found';
  // Use the first (16-param) body
  const body = coreBodies[0];
  const positions = findInsertPositions(body);
  
  const devicesPos = positions.find(p => p.table === 'devices');
  const bindingsPos = positions.find(p => p.table === 'device_source_bindings');
  
  if (!devicesPos) return 'INSERT INTO devices not found';
  if (!bindingsPos) return 'INSERT INTO device_source_bindings not found (may be OK if SELF_SERVICE only)';
  
  return devicesPos.line < bindingsPos.line || 
    `devices at line ${devicesPos.line}, bindings at line ${bindingsPos.line}`;
});

test('T3', 'devices INSERT precedes license_devices INSERT in core', () => {
  if (coreBodies.length === 0) return 'No function body found';
  const body = coreBodies[0];
  const positions = findInsertPositions(body);
  
  const devicesPos = positions.find(p => p.table === 'devices');
  const licenseDevicesPos = positions.find(p => p.table === 'license_devices');
  
  if (!devicesPos) return 'INSERT INTO devices not found';
  if (!licenseDevicesPos) return 'INSERT INTO license_devices not found';
  
  return devicesPos.line < licenseDevicesPos.line || 
    `devices at line ${devicesPos.line}, license_devices at line ${licenseDevicesPos.line}`;
});

test('T4', 'FK ORDER FIX comment present in core function', () => {
  if (coreBodies.length === 0) return 'No function body found';
  return coreBodies[0].includes('FK ORDER FIX') || 'FK ORDER FIX comment not found';
});

// ===========================================================================
// T5-T8: rpc_manager_complete_device_activation
// ===========================================================================

const rpcBodies = extractFunctionBody(migrationContent, 'public.rpc_manager_complete_device_activation');

test('T5', 'rpc_manager_complete_device_activation exists in migration', () => {
  return rpcBodies.length >= 1 || 'Function not found in migration';
});

test('T6', 'devices INSERT precedes license_devices INSERT in RPC EXISTING_CUSTOMER path', () => {
  if (rpcBodies.length === 0) return 'No function body found';
  const body = rpcBodies[0];
  const positions = findInsertPositions(body);
  
  const devicesPos = positions.find(p => p.table === 'devices');
  const licenseDevicesPos = positions.find(p => p.table === 'license_devices');
  
  if (!devicesPos) return 'INSERT INTO devices not found';
  if (!licenseDevicesPos) return 'INSERT INTO license_devices not found';
  
  return devicesPos.line < licenseDevicesPos.line || 
    `devices at line ${devicesPos.line}, license_devices at line ${licenseDevicesPos.line}`;
});

test('T7', 'devices INSERT precedes device_source_bindings INSERT in RPC EXISTING_CUSTOMER path', () => {
  if (rpcBodies.length === 0) return 'No function body found';
  const body = rpcBodies[0];
  const positions = findInsertPositions(body);
  
  const devicesPos = positions.find(p => p.table === 'devices');
  const bindingsPos = positions.find(p => p.table === 'device_source_bindings');
  
  if (!devicesPos) return 'INSERT INTO devices not found';
  if (!bindingsPos) return 'INSERT INTO device_source_bindings not found';
  
  return devicesPos.line < bindingsPos.line || 
    `devices at line ${devicesPos.line}, bindings at line ${bindingsPos.line}`;
});

test('T8', 'FK ORDER FIX comment present in RPC function', () => {
  if (rpcBodies.length === 0) return 'No function body found';
  return rpcBodies[0].includes('FK ORDER FIX') || 'FK ORDER FIX comment not found';
});

// ===========================================================================
// T9-T12: Signature and permission preservation
// ===========================================================================

test('T9', 'activate_device_source_core has SECURITY DEFINER', () => {
  return migrationContent.includes('SECURITY DEFINER') || 'SECURITY DEFINER not found';
});

test('T10', 'REVOKE on activate_device_source_core preserves security', () => {
  return migrationContent.includes(
    'REVOKE ALL ON FUNCTION private.activate_device_source_core(UUID, TEXT, TEXT, UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated'
  ) || 'REVOKE statement not found or incorrect';
});

test('T11', 'REVOKE on rpc_manager_complete_device_activation preserves security', () => {
  return migrationContent.includes(
    'REVOKE ALL ON FUNCTION public.rpc_manager_complete_device_activation(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon'
  ) || 'REVOKE statement not found';
});

test('T12', 'GRANT EXECUTE to authenticated on rpc_manager_complete_device_activation', () => {
  return migrationContent.includes(
    'GRANT EXECUTE ON FUNCTION public.rpc_manager_complete_device_activation(TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) TO authenticated'
  ) || 'GRANT statement not found';
});

// ===========================================================================
// T13-T16: Regression guards
// ===========================================================================

test('T13', 'No DROP TABLE, DROP FUNCTION, or TRUNCATE statements', () => {
  const forbidden = ['DROP TABLE', 'DROP FUNCTION', 'TRUNCATE'];
  for (const keyword of forbidden) {
    if (migrationContent.includes(keyword)) {
      return `Found forbidden statement: ${keyword}`;
    }
  }
  return true;
});

test('T14', 'No ALTER TABLE statements (patch minimo)', () => {
  return !migrationContent.includes('ALTER TABLE') || 'Found ALTER TABLE — this should be a patch minimo migration';
});

test('T15', 'No references to updated_at in licenses INSERT', () => {
  // Regression guard: previous drift fix removed updated_at from licenses INSERT
  const licensesInsertRegex = /INSERT INTO public\.licenses\s*\([^)]*updated_at[^)]*\)/gi;
  const matches = [...migrationContent.matchAll(licensesInsertRegex)];
  // The SELF_SERVICE path uses updated_at legitimately — but it's not in the licenses table
  // We specifically check for licenses INSERT containing updated_at
  return matches.length === 0 || `Found ${matches.length} licenses INSERT with updated_at`;
});

test('T16', 'FLOW A (NEW_CUSTOMER) delegates to activate_device_source_core', () => {
  if (rpcBodies.length === 0) return 'No RPC body found';
  return rpcBodies[0].includes('private.activate_device_source_core(') || 
    'FLOW A does not delegate to core function';
});

// ===========================================================================
// REPORT
// ===========================================================================

console.log('\n' + '='.repeat(72));
console.log('C11 DEVICE BINDING FK ORDER FIX — TEST REPORT');
console.log('='.repeat(72));

for (const r of results) {
  const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${r.id}: ${r.description} — ${r.status}`);
  if (r.detail) {
    console.log(`   Detail: ${r.detail}`);
  }
}

console.log('-'.repeat(72));
console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log(failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
console.log('='.repeat(72));

process.exit(failed > 0 ? 1 : 0);
