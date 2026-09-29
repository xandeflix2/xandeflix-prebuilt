/**
 * Xandeflix Prebuilt — Debug Physical Provisioning Entrypoint (Gate G11A)
 *
 * Ponto de entrada exclusivo para testes físicos em builds de depuração.
 *
 * Princípios:
 * - Invoca obrigatoriamente SecureArtifactImportService com validação criptográfica estrita.
 * - Elimina qualquer bypass de assinatura (unsigned ou alterado é rejeitado fail-closed).
 * - Utiliza a âncora de confiança de teste DEBUG_TEST_PUBLIC_KEY.
 * - Registrado exclusivamente em modo de depuração.
 */

import { SecureArtifactImportService } from '../security/secure-artifact-import.service.ts';
import { ArtifactVerifier } from '../security/artifact-verifier.ts';
import { TrustedPublicKeyStore } from '../security/trusted-public-key-store.ts';
import { getClientBootstrapService } from '../bootstrap/client.ts';
import { DEBUG_TEST_PUBLIC_KEY } from './debug-keys.ts';
import type { ArtifactSecurityEnvelope } from '../security/security.types.ts';
import { installWebViewBufferCompatibility } from './webview-buffer-compatibility.ts';
import { ManagedSourceStagingOrchestrator } from '../source/managed-source-staging.orchestrator.ts';
import { CompactSearchIndexV2Builder } from '../experiments/search-compact-v2/compact-search-v2-builder.ts';
import { serializeCompactIndexV2 } from '../experiments/search-compact-v2/compact-search-v2-serializer.ts';

installWebViewBufferCompatibility();

declare global {
  interface Window {
    __XANDEFLIX_DEBUG_IMPORT__?: (
      artifactBase64: string,
      envelopeRaw: string | ArtifactSecurityEnvelope
    ) => Promise<string>;
    __XANDEFLIX_DEBUG_MANAGED_STAGE__?: () => Promise<unknown>;
    __XANDEFLIX_DEBUG_SERIALIZER_FIXTURE__?: () => Promise<unknown>;
  }
}

export function initDebugImport(): void {
  if (typeof window === 'undefined') return;

  console.log('[DEBUG_IMPORT_INIT] Registrando window.__XANDEFLIX_DEBUG_IMPORT__...');

  window.__XANDEFLIX_DEBUG_IMPORT__ = async (
    artifactBase64: string,
    envelopeRaw: string | ArtifactSecurityEnvelope
  ): Promise<string> => {
    try {
      console.log('[DEBUG_IMPORT_START] Recebendo artefato para importação segura...');

      // 1. Converter Base64 para Uint8Array
      const binaryStr = atob(artifactBase64);
      const artifactBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        artifactBytes[i] = binaryStr.charCodeAt(i);
      }
      console.log('[DEBUG_IMPORT_BYTES] Tamanho do pacote:', artifactBytes.length);

      // 2. Resolver envelope
      let envelope: ArtifactSecurityEnvelope;
      if (typeof envelopeRaw === 'string') {
        envelope = JSON.parse(envelopeRaw) as ArtifactSecurityEnvelope;
      } else {
        envelope = envelopeRaw;
      }
      console.log('[DEBUG_IMPORT_ENVELOPE] keyId:', envelope.keyId, 'algorithm:', envelope.algorithm);

      // 3. Inicializar serviços de segurança com a âncora de teste
      const keyStore = new TrustedPublicKeyStore([DEBUG_TEST_PUBLIC_KEY]);
      const verifier = new ArtifactVerifier(keyStore);
      const bootstrapService = getClientBootstrapService();
      const secureImporter = new SecureArtifactImportService(
        bootstrapService.getStorage(),
        verifier
      );

      // 4. Executar importação criptográfica fail-closed
      const result = await secureImporter.importPackage(artifactBytes, envelope);
      console.log('[DEBUG_IMPORT_RESULT]', JSON.stringify(result));

      // 5. Se aceito, sincronizar o estado ativo no bootstrap service para atualização da UI
      if (result.success) {
        console.log('[DEBUG_IMPORT_SUCCESS] Sincronizando bootstrap service...');
        await bootstrapService.initialize();
      }

      return JSON.stringify(result);
    } catch (err) {
      const msg = (err as Error).stack || (err as Error).message;
      console.error('[DEBUG_IMPORT_EXCEPTION]', msg);
      return JSON.stringify({
        success: false,
        status: 'REJECTED',
        errorCode: 'DEBUG_IMPORT_EXCEPTION',
        errorMessage: (err as Error).message,
      });
    }
  };

  window.__XANDEFLIX_DEBUG_MANAGED_STAGE__ = async (): Promise<unknown> => {
    const result = await new ManagedSourceStagingOrchestrator().stageManagedSource();
    return {
      success: result.success,
      status: result.status,
      errorCode: result.errorCode,
      errorStage: result.errorStage,
      sanitizedErrorClass: result.sanitizedErrorClass,
      sourceVersion: result.sourceVersion,
      rawItemCount: result.rawItemCount,
      movieCount: result.movieCount,
      seriesCount: result.seriesCount,
      liveCount: result.liveCount,
      unresolvedCount: result.unresolvedCount,
      sourcePayloadSizeBytes: result.sourcePayloadSizeBytes,
      snapshotId: result.snapshotId,
      previousSnapshotId: result.previousSnapshotId,
      transport: result.transport,
    };
  };

  window.__XANDEFLIX_DEBUG_SERIALIZER_FIXTURE__ = async (): Promise<unknown> => {
    const catalog = {
      metadata: {
        schemaVersion: 1 as const,
        catalogVersion: 'r2f8u-physical-fixture',
        snapshotId: 'r2f8u-physical-fixture',
        generatedAt: '2026-09-14T00:00:00.000Z',
        counts: { movies: 1, series: 0, seasons: 0, episodes: 0, categories: 1, genres: 1, streams: 1, artworks: 0 },
      },
      categories: [{ id: 'cat:movies', name: 'Filmes', contentKinds: ['movie' as const] }],
      genres: [{ id: 'genre:1', name: 'Geral' }],
      movies: [{ id: 'movie:1', title: 'Filme Fixture', genreIds: ['genre:1'], categoryIds: ['cat:movies'], artworkIds: [], streamIds: ['stream:1'] }],
      series: [], seasons: [], episodes: [],
      streams: [{ id: 'stream:1', sourceItemId: 'movie:1', contentKind: 'movie' as const, containerExtension: 'mp4' }],
      artworks: [],
    };
    const index = new CompactSearchIndexV2Builder().build(catalog, {
      deterministicGeneratedAt: '2026-09-14T00:00:00.000Z',
    });
    const serialized = serializeCompactIndexV2(index);
    return { success: serialized.buffer.length > 64, serializedBytes: serialized.buffer.length };
  };
}
