import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ManagedSourceStagingOrchestrator } from '../src/source/managed-source-staging.orchestrator.ts';

const appSource = readFileSync(fileURLToPath(new URL('../src/App.tsx', import.meta.url)), 'utf8');
const orchestratorSource = readFileSync(
  fileURLToPath(new URL('../src/source/managed-source-staging.orchestrator.ts', import.meta.url)),
  'utf8',
);
const bootEffectStart = appSource.indexOf('// Sincronização e promoção automática do catálogo comercial real no boot (P5B1)');
const bootEffectEnd = appSource.indexOf('// Registra pontes globais para navegação e testes de automação', bootEffectStart);

assert.notEqual(bootEffectStart, -1, 'O efeito de boot P5B1 precisa existir');
assert.notEqual(bootEffectEnd, -1, 'O efeito de boot P5B1 precisa ter limite reconhecível');

const bootEffect = appSource.slice(bootEffectStart, bootEffectEnd);
assert.doesNotMatch(appSource, /TEMPORARY_DIAGNOSTIC_SUPPRESS_AUTO_SYNC_BOOT|AUTO_SYNC_SUPPRESSED_DIAGNOSTIC/);
assert.match(bootEffect, /if \(authorizationGate !== 'AUTHORIZED'\) return;/);
assert.match(bootEffect, /coordinator\.startNonBlockingSync\(\);/);
assert.equal((appSource.match(/startNonBlockingSync\s*\(/g) ?? []).length, 2);

const manualRetryStart = appSource.indexOf('onRetry={() => {');
assert.notEqual(manualRetryStart, -1, 'O caminho manual de retry precisa continuar presente');
assert.match(
  appSource.slice(manualRetryStart, manualRetryStart + 240),
  /getBootSyncCoordinator\(\)\.startNonBlockingSync\(\);/,
);

assert.match(orchestratorSource, /const TEMPORARY_SUPPRESS_CATALOG_IMPORT_AT_PRE_IMPORT_BOUNDARY = true;/);
assert.match(
  orchestratorSource,
  /TEMPORARY_SUPPRESS_CATALOG_IMPORT_AT_PRE_IMPORT_BOUNDARY\s*&&\s*this\.allowSelfServiceBoundSource\s*&&\s*!this\.preImportDiagnosticSuppressionConsumed/,
);
const readyCheckIndex = orchestratorSource.indexOf(
  'if (!isManagedAuthorityReady(authority, this.allowSelfServiceBoundSource))',
);
const localReadIndex = orchestratorSource.indexOf('record = await this.secureSourceStore.get(authority.sourceId!)');
const configValidationIndex = orchestratorSource.indexOf('const runtimeConfig = toRuntimeConfig(record);');
const boundaryIndex = orchestratorSource.indexOf("console.info('PRE_IMPORT_BOUNDARY_REACHED_DIAGNOSTIC');");
const suppressionIndex = orchestratorSource.indexOf("console.info('CATALOG_IMPORT_SUPPRESSED_DIAGNOSTIC');");
const importerCallIndex = orchestratorSource.indexOf('this.importer.importM3u(');
assert.ok(readyCheckIndex < localReadIndex);
assert.ok(localReadIndex < configValidationIndex);
assert.ok(configValidationIndex < boundaryIndex);
assert.ok(boundaryIndex < suppressionIndex);
assert.ok(suppressionIndex < importerCallIndex);
assert.match(orchestratorSource, /await this\.resolveAuthorization\(\)/);
assert.match(orchestratorSource, /SOURCE_READY_REACHED_DIAGNOSTIC/);

const markers = [];
let authorityCalls = 0;
let sourceReads = 0;
let importerCalls = 0;
let packageBuildCalls = 0;
let stagingCalls = 0;
const sourceId = 'diagnostic-source-id';
const orchestrator = new ManagedSourceStagingOrchestrator({
  allowSelfServiceBoundSource: true,
  resolveAuthorization: async () => {
    authorityCalls += 1;
    return {
      status: 'SOURCE_READY',
      remoteResultCode: 'SOURCE_READY',
      remoteAuthorityAvailable: true,
      mode: 'MANAGED',
      sourceId,
      sourceVersion: 1,
      protocol: 'M3U',
      sourceStatus: 'ACTIVE',
    };
  },
  secureSourceStore: {
    async get(requestedSourceId) {
      sourceReads += 1;
      assert.equal(requestedSourceId, sourceId);
      return {
        sourceId,
        sourceVersion: 1,
        protocol: 'M3U',
        sourceConfig: { playlistUrl: 'https://example.invalid/diagnostic.m3u' },
      };
    },
  },
  importer: {
    async importM3u() {
      importerCalls += 1;
      return { success: false };
    },
    async importXtream() {
      importerCalls += 1;
      return { success: false };
    },
  },
  packageBuilder: {
    async build() {
      packageBuildCalls += 1;
      throw new Error('Package builder must remain unreachable in this diagnostic');
    },
  },
  bootstrapService: {
    async stagePackage() {
      stagingCalls += 1;
      throw new Error('Staging must remain unreachable in this diagnostic');
    },
  },
});

const originalInfo = console.info;
console.info = (marker) => markers.push(String(marker));
let result;
try {
  result = await orchestrator.stageManagedSource();
} finally {
  console.info = originalInfo;
}

assert.equal(authorityCalls, 1, 'A autoridade precisa ser consultada antes da fronteira');
assert.equal(sourceReads, 1, 'A configuração local segura precisa ser validada antes da fronteira');
assert.ok(markers.includes('REMOTE_AUTHORITY_STARTED_DIAGNOSTIC'));
assert.ok(markers.includes('REMOTE_AUTHORITY_COMPLETED_DIAGNOSTIC'));
assert.ok(markers.includes('SOURCE_RESOLUTION_STARTED_DIAGNOSTIC'));
assert.ok(markers.includes('SOURCE_READY_REACHED_DIAGNOSTIC'));
assert.ok(markers.includes('PRE_IMPORT_BOUNDARY_REACHED_DIAGNOSTIC'));
assert.ok(markers.includes('CATALOG_IMPORT_SUPPRESSED_DIAGNOSTIC'));
assert.equal(result.success, false, 'A supressão não pode simular importação bem-sucedida');
assert.equal(result.status, 'REJECTED');
assert.equal(result.errorCode, 'CATALOG_IMPORT_SUPPRESSED_DIAGNOSTIC');
assert.equal(importerCalls, 0, 'Nenhuma entrada do importer pode ser chamada');
assert.equal(packageBuildCalls, 0);
assert.equal(stagingCalls, 0);

console.log('PASS AUTO_SYNC_STARTS_NORMALLY: chamada automática autorizada restaurada; retry manual intacto');
console.log('PASS AUTHORITY_PATH_NOT_BYPASSED: resolução, SOURCE_READY e fonte local segura precedem o guard');
console.log('PASS PRE_IMPORT_BOUNDARY_REACHED: ambos os marcadores de fronteira foram emitidos');
console.log('PASS IMPORT_ENTRY_NOT_CALLED: importer, builder e staging permaneceram sem chamadas');

markers.length = 0;
let retryResult;
console.info = (marker) => markers.push(String(marker));
try {
  retryResult = await orchestrator.stageManagedSource();
} finally {
  console.info = originalInfo;
}
assert.equal(authorityCalls, 2);
assert.equal(sourceReads, 2);
assert.equal(importerCalls, 1, 'Uma tentativa posterior no mesmo coordenador mantém o caminho normal');
assert.equal(retryResult.errorCode, 'REAL_SOURCE_FETCH_FAILED');
assert.equal(markers.includes('CATALOG_IMPORT_SUPPRESSED_DIAGNOSTIC'), false);
console.log('PASS MANUAL_RETRY_UNCHANGED: guard de boot é one-shot e não retém a tentativa posterior');
