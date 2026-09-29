import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationPath = path.join(
  root,
  'supabase',
  'migrations',
  '20260923073834_c11_remote_source_metadata_license_contract_fix.sql',
);

const [migration, types, authority, resolver] = await Promise.all([
  readFile(migrationPath, 'utf8'),
  readFile(path.join(root, 'src', 'control-plane', 'control-plane.types.ts'), 'utf8'),
  readFile(path.join(root, 'src', 'control-plane', 'client', 'remote-control-plane-authority.ts'), 'utf8'),
  readFile(path.join(root, 'src', 'control-plane', 'client', 'authorized-source-resolver.ts'), 'utf8'),
]);

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('migration replaces only the authorized-source metadata RPC', () => {
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.rpc_resolve_authorized_source_metadata\s*\(/i);
  assert.doesNotMatch(migration, /\b(?:CREATE|ALTER|DROP)\s+TABLE\b/i);
  assert.doesNotMatch(migration, /\b(?:INSERT|UPDATE|DELETE|TRUNCATE)\b/i);
});

test('the active license authority must be unique and is not selected by recency', () => {
  assert.match(migration, /SELECT count\(\*\)[\s\S]*?INTO v_active_license_count/i);
  assert.match(migration, /IF v_active_license_count <> 1 THEN[\s\S]*?'LICENSE_INVALID'/i);
  assert.doesNotMatch(migration, /ORDER BY\s+ld\.bound_at/i);
});

test('license validity is server-time based for ACTIVE and TRIAL', () => {
  assert.match(migration, /l\.status = 'ACTIVE'[\s\S]*?l\.expires_at > NOW\(\)/i);
  assert.match(migration, /l\.status = 'TRIAL'[\s\S]*?l\.trial_started_at IS NOT NULL[\s\S]*?NOW\(\) < l\.trial_expires_at/i);
});

test('MANAGED and SELF_SERVICE remain separate resolution paths', () => {
  assert.match(migration, /IF v_license\.mode = 'SELF_SERVICE' THEN/i);
  assert.match(migration, /FROM public\.customer_sources/i);
  assert.match(migration, /FROM public\.device_source_bindings/i);
  assert.match(migration, /FROM public\.managed_sources/i);
});

test('both SOURCE_READY responses carry the authoritative license identity', () => {
  assert.ok((migration.match(/'licenseId',\s*v_license\.id/gi) ?? []).length === 2);
  assert.ok((migration.match(/'licenseStatus',\s*v_license\.status/gi) ?? []).length === 2);
  assert.ok((migration.match(/'status',\s*'SOURCE_READY'/gi) ?? []).length === 2);
});

test('managed source binding is unique and fail-closed', () => {
  assert.match(migration, /SELECT count\(\*\)[\s\S]*?INTO v_source_binding_count/i);
  assert.match(migration, /IF v_source_binding_count <> 1 THEN[\s\S]*?'SOURCE_NOT_BOUND'/i);
  assert.match(migration, /IF v_source\.status <> 'ACTIVE' THEN[\s\S]*?'SOURCE_NOT_BOUND'/i);
});

test('RPC keeps the hardened execution boundary and explicit grants', () => {
  assert.match(migration, /SECURITY DEFINER/i);
  assert.match(migration, /SET search_path = pg_catalog, public, private/i);
  assert.match(migration, /REVOKE ALL ON FUNCTION[\s\S]*FROM PUBLIC/i);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION[\s\S]*TO anon, authenticated/i);
});

test('metadata response does not expose source configuration or credentials', () => {
  const returnBlocks = migration.match(/RETURN jsonb_build_object\([\s\S]*?\);/gi) ?? [];
  const responseSurface = returnBlocks.join('\n');
  assert.doesNotMatch(
    responseSurface,
    /playlistUrl|endpoint|username|password|ciphertext|nonce|authTag|deviceToken|tokenHash|vaultPayload/i,
  );
});

test('TypeScript transport contract already accepts licenseId and licenseStatus', () => {
  assert.match(types, /interface RemoteSourceAuthorizationMetadata[\s\S]*?licenseId\?: string;[\s\S]*?licenseStatus\?: LicenseStatus;/i);
  assert.match(authority, /licenseId:/i);
  assert.match(authority, /licenseStatus:/i);
  assert.match(resolver, /licenseId:/i);
  assert.match(resolver, /licenseStatus:/i);
});

let passed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    passed += 1;
    console.log(`PASS ${passed}/${tests.length} - ${name}`);
  } catch (error) {
    console.error(`FAIL - ${name}`);
    throw error;
  }
}

console.log(`C11_REMOTE_SOURCE_METADATA_LICENSE_CONTRACT=${passed}/${tests.length}_PASS`);
