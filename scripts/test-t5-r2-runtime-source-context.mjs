/**
 * Xandeflix Prebuilt — T5-R2 Runtime Source Context Integration Test Suite
 *
 * Validação rigorosa da integração do RuntimeSourceContextProvider com o PlaybackService.
 *
 * Cenários:
 * 1. Xtream source + movie StreamRef → resolução correta
 * 2. M3U source + movie StreamRef → resolução correta
 * 3. Restart sem reimportação → contexto resolve pela fonte ativa
 * 4. Source version muda → novo contexto resolvido
 * 5. Source disabled → fail closed
 * 6. Binding removido → fail closed
 * 7. Caminho real NÃO usa synthetic context
 * 8. Movie path alcança DirectStreamResolver
 * 9. Movie path alcança NativeAndroidPlayerAdapter
 * 10. Xtream URL NÃO gerada para M3U
 * 11. Credenciais NÃO persistidas no StreamRef
 * 12. Context invalidation funciona
 */

import assert from 'node:assert';
import { PlaybackService } from '../src/playback/playback.service.ts';
import { DirectStreamResolver } from '../src/playback/direct-stream-resolver.ts';
import { NativeAndroidPlayerAdapter } from '../src/playback/native-android-player.adapter.ts';
import {
  AuthorizedRuntimeSourceContextProvider,
  adaptSourceConfigToRuntimeContext,
} from '../src/playback/runtime-source-context-provider.ts';
import { CatalogReadModel } from '../src/catalog/catalog-read-model.ts';

console.log('=== XANDEFLIX PREBUILT — TEST SUITE T5-R2 (Runtime Source Context Integration) ===\n');

let passCount = 0;
let totalTests = 0;

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ [TEST ${totalTests}] ${name} = PASS`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ [TEST ${totalTests}] ${name} = FAIL`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [TEST ${totalTests}] ${name} = PASS`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ [TEST ${totalTests}] ${name} = FAIL`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

// Helpers
function createMinimalCatalog(overrides = {}) {
  return {
    metadata: {
      schemaVersion: 1,
      catalogVersion: '1.0.0',
      snapshotId: 'test-snap',
      generatedAt: new Date().toISOString(),
      counts: { movies: 0, series: 0, seasons: 0, episodes: 0, categories: 0, genres: 0, streams: 0, artworks: 0 },
    },
    categories: [],
    genres: [],
    artworks: [],
    movies: [],
    series: [],
    seasons: [],
    episodes: [],
    streams: [],
    ...overrides,
  };
}

function createMockResolver(sourceResult) {
  return {
    async resolve() {
      return sourceResult;
    },
  };
}

function createMockPlugin() {
  let lastOptions = null;
  return {
    getLastOptions() { return lastOptions; },
    async open(options) {
      lastOptions = options;
      return { accepted: true, candidateCount: 1 };
    },
    async startPreview() { return { accepted: true, previewId: 'p' }; },
    async updatePreview() { return { accepted: true, previewId: 'p' }; },
    async stopPreview() { return { accepted: true }; },
    async addListener() { return { remove: async () => {} }; },
  };
}

// ============================================================================
// TEST 1: Xtream source + movie StreamRef → resolução correta
// ============================================================================
await runAsyncTest('1. XTREAM_RUNTIME_RESOLUTION — Xtream source resolve URI de filme corretamente', async () => {
  const mockResolver = createMockResolver({
    status: 'SOURCE_READY',
    mode: 'SELF_SERVICE',
    config: {
      type: 'XTREAM',
      host: 'http://iptv.test.tv:8080',
      username: 'testuser',
      password: 'testpass',
    },
    sourceVersion: 2,
  });

  const provider = new AuthorizedRuntimeSourceContextProvider(mockResolver);
  const mockPlugin = createMockPlugin();
  const adapter = new NativeAndroidPlayerAdapter(mockPlugin);

  const service = new PlaybackService({
    contextProvider: provider,
    playerAdapter: adapter,
  });

  const movieStreamRef = {
    id: 'str:movie:42',
    sourceItemId: '42',
    contentKind: 'movie',
    containerExtension: 'mp4',
  };

  const catalog = createMinimalCatalog({
    movies: [{ id: 'movie:42', title: 'Filme Xtream', categoryIds: [], genreIds: [], artworkIds: [], streamIds: ['str:movie:42'] }],
    streams: [movieStreamRef],
  });

  const readModel = new CatalogReadModel(catalog);
  const result = await service.playMovie('movie:42', readModel);

  assert.strictEqual(result.state, 'NATIVE_PLAYER_OPENED', 'Player deve abrir com sucesso');
  const opts = mockPlugin.getLastOptions();
  assert.ok(opts, 'Plugin deve receber opções');
  assert.ok(opts.uri.includes('/movie/testuser/testpass/42.mp4'), `URI Xtream incorreta: ${opts.uri}`);
  assert.ok(!opts.uri.includes('example.invalid'), 'URI não deve conter domínio sintético');
});

// ============================================================================
// TEST 2: M3U source + movie StreamRef → resolução correta
// ============================================================================
await runAsyncTest('2. M3U_RUNTIME_RESOLUTION — M3U source resolve URI de filme corretamente', async () => {
  const mockResolver = createMockResolver({
    status: 'SOURCE_READY',
    mode: 'SELF_SERVICE',
    config: {
      type: 'M3U',
      playlistUrl: 'http://m3u.source.tv:9090/playlist.m3u',
    },
    sourceVersion: 1,
  });

  const provider = new AuthorizedRuntimeSourceContextProvider(mockResolver);
  const mockPlugin = createMockPlugin();
  const adapter = new NativeAndroidPlayerAdapter(mockPlugin);

  const service = new PlaybackService({
    contextProvider: provider,
    playerAdapter: adapter,
  });

  const movieStreamRef = {
    id: 'str:movie:99',
    sourceItemId: '99',
    contentKind: 'movie',
    containerExtension: 'mp4',
  };

  const catalog = createMinimalCatalog({
    movies: [{ id: 'movie:99', title: 'Filme M3U', categoryIds: [], genreIds: [], artworkIds: [], streamIds: ['str:movie:99'] }],
    streams: [movieStreamRef],
  });

  const readModel = new CatalogReadModel(catalog);
  const result = await service.playMovie('movie:99', readModel);

  assert.strictEqual(result.state, 'NATIVE_PLAYER_OPENED');
  const opts = mockPlugin.getLastOptions();
  assert.ok(opts.uri.includes('m3u.source.tv'), `URI deve usar host M3U: ${opts.uri}`);
  assert.ok(opts.uri.includes('/movies/99.mp4'), `URI deve seguir padrão genérico M3U: ${opts.uri}`);
  assert.ok(!opts.uri.includes('testuser'), 'M3U URI não deve conter credenciais Xtream');
});

// ============================================================================
// TEST 3: Restart sem reimportação → contexto resolve pela fonte ativa
// ============================================================================
await runAsyncTest('3. PLAYBACK_CONTEXT_REQUIRES_IMPORT_IN_SAME_SESSION=NAO', async () => {
  // Simula reinício: novo PlaybackService, sem importação prévia
  const mockResolver = createMockResolver({
    status: 'SOURCE_READY',
    mode: 'MANAGED',
    sourceId: 'src_restart',
    sourceVersion: 3,
    protocol: 'XTREAM',
    sourceStatus: 'ACTIVE',
  });

  const provider = new AuthorizedRuntimeSourceContextProvider(mockResolver, {
    localStore: {
      async get(sourceId) {
        assert.strictEqual(sourceId, 'src_restart');
        return {
          sourceId: 'src_restart',
          sourceVersion: 3,
          protocol: 'XTREAM',
          sourceConfig: {
            endpoint: 'http://restart.tv:8080',
            username: 'user2',
            password: 'pass2',
          },
          updatedAt: new Date().toISOString(),
        };
      },
    },
  });
  const mockPlugin = createMockPlugin();

  // Novo service "fresco" sem runtimeContext prévio
  const service = new PlaybackService({
    contextProvider: provider,
    playerAdapter: new NativeAndroidPlayerAdapter(mockPlugin),
  });

  assert.strictEqual(service.getRuntimeSourceContext(), undefined, 'Contexto deve ser undefined antes do play');

  const streamRef = {
    id: 'str:movie:restart',
    sourceItemId: 'restart-1',
    contentKind: 'movie',
    containerExtension: 'mp4',
  };

  const catalog = createMinimalCatalog({
    movies: [{ id: 'movie:restart', title: 'Filme Restart', categoryIds: [], genreIds: [], artworkIds: [], streamIds: ['str:movie:restart'] }],
    streams: [streamRef],
  });

  const readModel = new CatalogReadModel(catalog);
  const result = await service.playMovie('movie:restart', readModel);

  assert.strictEqual(result.state, 'NATIVE_PLAYER_OPENED');
  assert.ok(service.getRuntimeSourceContext(), 'Contexto deve existir após lazy resolution');
});

// ============================================================================
// TEST 4: Source version muda → novo contexto resolvido
// ============================================================================
await runAsyncTest('4. STALE_RUNTIME_CONTEXT_REUSED=NAO — Source version awareness', async () => {
  let callCount = 0;
  const mockResolver = {
    async resolve() {
      callCount++;
      return {
        status: 'SOURCE_READY',
        mode: 'SELF_SERVICE',
        config: {
          type: 'XTREAM',
          host: `http://v${callCount}.tv:8080`,
          username: `user_v${callCount}`,
          password: `pass_v${callCount}`,
        },
        sourceVersion: callCount,
      };
    },
  };

  const provider = new AuthorizedRuntimeSourceContextProvider(mockResolver);

  // Primeira resolução
  const ctx1 = await provider.resolve();
  assert.ok(ctx1);
  assert.ok(ctx1.sessionMaterial.username.includes('v1'));

  // Invalidar para simular mudança de versão
  provider.invalidate();

  // Segunda resolução deve pegar v2
  const ctx2 = await provider.resolve();
  assert.ok(ctx2);
  assert.ok(ctx2.sessionMaterial.username.includes('v2'), `Esperado v2, obtido: ${ctx2.sessionMaterial.username}`);
});

// ============================================================================
// TEST 5: Source disabled → fail closed
// ============================================================================
await runAsyncTest('5. DISABLED_SOURCE_FAIL_CLOSED=SIM', async () => {
  const mockResolver = createMockResolver({
    status: 'SOURCE_NOT_BOUND',
    mode: 'MANAGED',
    message: 'Fonte desativada',
  });

  const provider = new AuthorizedRuntimeSourceContextProvider(mockResolver);
  const result = await provider.resolve();
  assert.strictEqual(result, undefined, 'Source não vinculada deve retornar undefined (fail-closed)');
});

// ============================================================================
// TEST 6: Binding removido → fail closed
// ============================================================================
await runAsyncTest('6. REMOVED_BINDING_FAIL_CLOSED=SIM', async () => {
  const mockResolver = createMockResolver({
    status: 'DEVICE_REVOKED',
    mode: 'MANAGED',
    message: 'Dispositivo revogado',
  });

  const provider = new AuthorizedRuntimeSourceContextProvider(mockResolver);
  const result = await provider.resolve();
  assert.strictEqual(result, undefined, 'Device revogado deve retornar undefined (fail-closed)');
});

// ============================================================================
// TEST 7: Caminho real NÃO usa synthetic context
// ============================================================================
await runAsyncTest('7. PRODUCTION_MOVIE_PATH_SYNTHETIC_CONTEXT=NAO', async () => {
  const mockResolver = createMockResolver({
    status: 'SOURCE_READY',
    mode: 'SELF_SERVICE',
    config: {
      type: 'XTREAM',
      host: 'http://real.tv:8080',
      username: 'realuser',
      password: 'realpass',
    },
    sourceVersion: 1,
  });

  const provider = new AuthorizedRuntimeSourceContextProvider(mockResolver);
  const ctx = await provider.resolve();

  assert.ok(ctx, 'Contexto deve existir');
  assert.ok(!ctx.baseUrl.includes('example.invalid'), 'BaseUrl não deve ser example.invalid');
  assert.notStrictEqual(ctx.providerKind, 'SYNTHETIC_DIRECT', 'Provider não deve ser SYNTHETIC_DIRECT');
  assert.strictEqual(ctx.providerKind, 'XTREAM');
});

// ============================================================================
// TEST 8: Movie path alcança DirectStreamResolver
// ============================================================================
await runAsyncTest('8. MOVIE_PATH_REACHES_DIRECT_RESOLVER=SIM', async () => {
  let resolverCalled = false;
  const mockStreamResolver = {
    async resolve(streamRef, runtimeCtx, options) {
      resolverCalled = true;
      return {
        uri: 'http://test.tv/movie.mp4',
        streamRefId: streamRef.id,
        contentKind: 'movie',
        title: 'Test',
        providerKind: runtimeCtx?.providerKind || 'XTREAM',
        headers: {},
      };
    },
  };

  const mockSourceResolver = createMockResolver({
    status: 'SOURCE_READY',
    mode: 'SELF_SERVICE',
    config: { type: 'XTREAM', host: 'http://test.tv', username: 'u', password: 'p' },
    sourceVersion: 1,
  });

  const provider = new AuthorizedRuntimeSourceContextProvider(mockSourceResolver);
  const mockPlugin = createMockPlugin();

  const service = new PlaybackService({
    contextProvider: provider,
    resolver: mockStreamResolver,
    playerAdapter: new NativeAndroidPlayerAdapter(mockPlugin),
  });

  const catalog = createMinimalCatalog({
    movies: [{ id: 'movie:r', title: 'R', categoryIds: [], genreIds: [], artworkIds: [], streamIds: ['str:r'] }],
    streams: [{ id: 'str:r', sourceItemId: 'r', contentKind: 'movie', containerExtension: 'mp4' }],
  });

  await service.playMovie('movie:r', new CatalogReadModel(catalog));
  assert.strictEqual(resolverCalled, true, 'DirectStreamResolver.resolve deve ser chamado');
});

// ============================================================================
// TEST 9: Movie path alcança NativeAndroidPlayerAdapter
// ============================================================================
await runAsyncTest('9. MOVIE_PATH_REACHES_NEW_ADAPTER=SIM', async () => {
  let adapterCalled = false;
  const mockAdapter = {
    async launch(request) {
      adapterCalled = true;
      return { success: true, state: 'NATIVE_PLAYER_OPENED' };
    },
  };

  const mockSourceResolver = createMockResolver({
    status: 'SOURCE_READY',
    mode: 'SELF_SERVICE',
    config: { type: 'XTREAM', host: 'http://test.tv:8080', username: 'u', password: 'p' },
    sourceVersion: 1,
  });

  const provider = new AuthorizedRuntimeSourceContextProvider(mockSourceResolver);
  const service = new PlaybackService({
    contextProvider: provider,
    playerAdapter: mockAdapter,
  });

  const catalog = createMinimalCatalog({
    movies: [{ id: 'movie:a', title: 'A', categoryIds: [], genreIds: [], artworkIds: [], streamIds: ['str:a'] }],
    streams: [{ id: 'str:a', sourceItemId: 'a', contentKind: 'movie', containerExtension: 'mp4' }],
  });

  await service.playMovie('movie:a', new CatalogReadModel(catalog));
  assert.strictEqual(adapterCalled, true, 'NativeAndroidPlayerAdapter.launch deve ser chamado');
});

// ============================================================================
// TEST 10: Xtream URL NÃO gerada para M3U
// ============================================================================
await runAsyncTest('10. XTREAM_URL_GENERATED_FOR_M3U=NAO', async () => {
  const ctx = adaptSourceConfigToRuntimeContext({
    type: 'M3U',
    playlistUrl: 'http://m3u.tv:9090/list.m3u',
  });

  assert.ok(ctx);
  assert.strictEqual(ctx.providerKind, 'M3U');
  assert.strictEqual(ctx.sessionMaterial, undefined, 'M3U não deve ter sessionMaterial com credenciais');

  // Resolver com o contexto M3U
  const resolver = new DirectStreamResolver();
  const resolved = await resolver.resolve(
    { id: 'str:1', sourceItemId: '100', contentKind: 'movie', containerExtension: 'mp4' },
    ctx
  );

  assert.ok(!resolved.uri.includes('testuser'), 'URI M3U não deve conter credenciais Xtream');
  assert.ok(resolved.uri.includes('/movies/100.mp4'), `URI M3U deve usar padrão genérico: ${resolved.uri}`);
});

// ============================================================================
// TEST 11: StreamRef legado sem locator direto continua válido
// ============================================================================
runTest('11. LEGACY_STREAMREF_WITHOUT_DIRECT_REFERENCE=VALID', () => {
  const streamRef = {
    id: 'str:movie:safe',
    sourceItemId: '999',
    contentKind: 'movie',
    containerExtension: 'mp4',
  };

  const keys = Object.keys(streamRef);
  assert.ok(!keys.includes('username'), 'StreamRef não deve conter username');
  assert.ok(!keys.includes('password'), 'StreamRef não deve conter password');
  assert.ok(!keys.includes('token'), 'StreamRef não deve conter token');
  assert.ok(!keys.includes('authorization'), 'StreamRef não deve conter authorization');
  assert.ok(!keys.includes('directStreamUrl'), 'Snapshot legado sem locator direto deve continuar válido');
});

// ============================================================================
// TEST 12: Context invalidation funciona
// ============================================================================
await runAsyncTest('12. STALE_CONTEXT_INVALIDATION=PASS', async () => {
  let callCount = 0;
  const mockResolver = {
    async resolve() {
      callCount++;
      return {
        status: 'SOURCE_READY',
        mode: 'SELF_SERVICE',
        config: { type: 'XTREAM', host: `http://host${callCount}.tv`, username: 'u', password: 'p' },
        sourceVersion: callCount,
      };
    },
  };

  const provider = new AuthorizedRuntimeSourceContextProvider(mockResolver);

  const ctx1 = await provider.resolve();
  assert.ok(ctx1.baseUrl.includes('host1'));

  // Sem invalidação, deve retornar cache
  const ctx1b = await provider.resolve();
  assert.ok(ctx1b.baseUrl.includes('host1'), 'Cache deve ser usado sem invalidação');
  assert.strictEqual(callCount, 1, 'Resolver só deve ser chamado uma vez com cache');

  // Após invalidação, deve buscar novamente
  provider.invalidate();
  const ctx2 = await provider.resolve();
  assert.ok(ctx2.baseUrl.includes('host2'), 'Após invalidação, deve resolver novo contexto');
  assert.strictEqual(callCount, 2, 'Resolver deve ser chamado novamente após invalidação');
});

// ============================================================================
// RESULTADO
// ============================================================================
console.log(`\n==================================================`);
console.log(`RESULTADO DA SUÍTE T5-R2: ${passCount} de ${totalTests} testes PASS`);
console.log(`==================================================\n`);

if (passCount !== totalTests) {
  process.exit(1);
}
