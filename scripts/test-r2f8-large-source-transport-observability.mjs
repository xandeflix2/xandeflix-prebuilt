import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LARGE_SOURCE_TRANSPORT_OBSERVABILITY_LOCK_ID,
  runLargeSourceTransportObservabilitySuite,
} from '../src/source/large-source-transport-observability.harness.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NATIVE_SOURCE = fs.readFileSync(path.join(ROOT, 'android/app/src/main/java/com/xandeflix/prebuilt/source/LargeSourceTransportPlugin.java'), 'utf8');
const BRIDGE_SOURCE = fs.readFileSync(path.join(ROOT, 'src/source/large-source-transport.bridge.ts'), 'utf8');
const FETCH_SOURCE = fs.readFileSync(path.join(ROOT, 'src/source/device-direct-fetch.ts'), 'utf8');
const IMPORTER_SOURCE = fs.readFileSync(path.join(ROOT, 'src/source/real-source-importer.service.ts'), 'utf8');
const ORCHESTRATOR_SOURCE = fs.readFileSync(path.join(ROOT, 'src/source/managed-source-staging.orchestrator.ts'), 'utf8');
const UI_SOURCE = fs.readFileSync(path.join(ROOT, 'src/ui/components/TransportObservabilityDiagnosticBlock.tsx'), 'utf8');

let total = 0;
let passed = 0;

async function test(name, fn) {
  total += 1;
  await fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

const expected = {
  T01_TIMEOUT: ['TIMEOUT', 'REQUEST_START'],
  T02_HTTP_4XX: ['HTTP_ERROR', 'HTTP_RESPONSE'],
  T03_HTTP_5XX: ['HTTP_ERROR', 'HTTP_RESPONSE'],
  T04_FILE_IO_FAILURE: ['FILE_IO_FAILURE', 'FILE_WRITE'],
  T05_CACHE_SPACE_INSUFFICIENT: ['CACHE_SPACE_INSUFFICIENT', 'FILE_CREATE'],
  T06_SOURCE_FILE_LIMIT: ['SOURCE_FILE_LIMIT_EXCEEDED', 'FILE_SIZE_GUARD'],
  T07_INVALID_NATIVE_RESPONSE: ['INVALID_NATIVE_RESPONSE', 'REQUEST_START'],
  T08_CANCELLED: ['DOWNLOAD_CANCELLED', 'FILE_WRITE'],
  T09_M3U_PARSE_FAILURE: ['UNKNOWN_SANITIZED_TRANSPORT_ERROR', 'M3U_PARSE'],
  T10_UNKNOWN_ERROR: ['UNKNOWN_SANITIZED_TRANSPORT_ERROR', 'REQUEST_START'],
};

const results = await runLargeSourceTransportObservabilitySuite();

await test('T01-T10 preservam code/stage até a superfície diagnóstica', () => {
  for (const [id, [code, stage]] of Object.entries(expected)) {
    const result = results.find((entry) => entry.id === id);
    assert.ok(result, id);
    for (const surface of [result.native, result.importer, result.orchestrator, result.diagnosticSurface]) {
      if (!(id === 'T09_M3U_PARSE_FAILURE' && surface === result.native)) {
        assert.equal(surface.code, code, id);
      }
      const expectedStage = id === 'T09_M3U_PARSE_FAILURE' && surface === result.native ? 'DOWNLOAD_COMPLETE' : stage;
      assert.equal(surface.stage, expectedStage, id);
      assert.equal(surface.transportType, 'NATIVE_FILE_BACKED', id);
    }
  }
});

await test('T02 HTTP 4XX e T03 HTTP 5XX preservam somente classe HTTP', () => {
  assert.equal(results.find((entry) => entry.id === 'T02_HTTP_4XX')?.diagnosticSurface.httpStatusClass, '4XX');
  assert.equal(results.find((entry) => entry.id === 'T03_HTTP_5XX')?.diagnosticSurface.httpStatusClass, '5XX');
});

await test('T09 falha de parse não reverte para erro genérico de transporte', () => {
  const result = results.find((entry) => entry.id === 'T09_M3U_PARSE_FAILURE');
  assert.equal(result?.diagnosticSurface.stage, 'M3U_PARSE');
  assert.equal(result?.diagnosticSurface.code, 'UNKNOWN_SANITIZED_TRANSPORT_ERROR');
});

await test('sucesso preserva DOWNLOAD_COMPLETE e limpeza sintética', () => {
  const result = results.find((entry) => entry.id === 'SUCCESS_DOWNLOAD_COMPLETE');
  assert.equal(result?.diagnosticSurface.success, true);
  assert.equal(result?.diagnosticSurface.stage, 'DOWNLOAD_COMPLETE');
  assert.equal(result?.diagnosticSurface.code, undefined);
});

await test('nenhum envelope retornado contém URL, credencial, body ou stack bruto', () => {
  const serialized = JSON.stringify(results);
  assert.doesNotMatch(serialized, /https?:\/\//i);
  assert.doesNotMatch(serialized, /Authorization|Bearer|username|password|playlist body|stack/i);
});

await test('call graph e superfície debug estão presentes', () => {
  assert.match(NATIVE_SOURCE, /stage/);
  assert.match(NATIVE_SOURCE, /retryable/);
  assert.match(BRIDGE_SOURCE, /LargeSourceTransportStage/);
  assert.match(FETCH_SOURCE, /transportErrorCode/);
  assert.match(IMPORTER_SOURCE, /M3U_PARSE/);
  assert.match(ORCHESTRATOR_SOURCE, /result\.transport/);
  assert.match(UI_SOURCE, /__XANDEFLIX_DEBUG_BUILD__/);
  assert.match(UI_SOURCE, /TRANSPORT_STAGE/);
  assert.match(UI_SOURCE, /TRANSPORT_ERROR_CODE/);
  assert.match(UI_SOURCE, /TRANSPORT_TYPE/);
});

await test('release não renderiza a superfície de diagnóstico', () => {
  assert.match(UI_SOURCE, /!__XANDEFLIX_DEBUG_BUILD__/);
  assert.doesNotMatch(UI_SOURCE, /sourceConfig|playlistUrl|Authorization|Bearer/);
});

const lockMaterial = [
  LARGE_SOURCE_TRANSPORT_OBSERVABILITY_LOCK_ID,
  NATIVE_SOURCE,
  BRIDGE_SOURCE,
  FETCH_SOURCE,
  IMPORTER_SOURCE,
  ORCHESTRATOR_SOURCE,
  UI_SOURCE,
].join('\n');

console.log(`LARGE_SOURCE_TRANSPORT_OBSERVABILITY_LOCK_ID=${LARGE_SOURCE_TRANSPORT_OBSERVABILITY_LOCK_ID}`);
console.log(`LARGE_SOURCE_TRANSPORT_OBSERVABILITY_LOCK_TEST=${passed === total ? 'PASS' : 'FAIL'}`);
console.log(`LARGE_SOURCE_TRANSPORT_OBSERVABILITY_LOCK_HASH=${crypto.createHash('sha256').update(lockMaterial).digest('hex').toUpperCase()}`);
console.log(`SYNTHETIC_ERROR_TEST_COUNT=10`);
console.log(`SYNTHETIC_ERROR_TEST_PASS_COUNT=${passed === total ? 10 : 0}`);
console.log(`SYNTHETIC_SUCCESS_OBSERVABILITY=${results.find((entry) => entry.id === 'SUCCESS_DOWNLOAD_COMPLETE')?.diagnosticSurface.success ? 'PASS' : 'FAIL'}`);
console.log(`LARGE_SOURCE_TRANSPORT_OBSERVABILITY_TEST_COUNT=${total}`);
console.log(`LARGE_SOURCE_TRANSPORT_OBSERVABILITY_TEST_PASS_COUNT=${passed}`);
if (passed !== total) process.exitCode = 1;
