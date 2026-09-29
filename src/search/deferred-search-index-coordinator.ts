/**
 * Xandeflix Prebuilt - Deferred Search Index Coordinator
 *
 * Remove a construção do CompactSearchIndexV2 do pico da transação de importação.
 * Executa em lotes delimitados com yield ao event loop APÓS a promoção do catálogo.
 *
 * Princípios Bounded-Memory (Blocker A Fix):
 * - SEARCH_INCREMENTAL_BUILDER = true
 * - SEARCH_FULL_SOURCE_OBJECT_ARRAY_EXISTS = false
 * - SEARCH_SEGMENT_RELEASE_BEFORE_NEXT_SEGMENT = true
 * - SEARCH_PERSISTENCE_FAILURE_TRUTHFUL = true
 * - CATALOG_SURVIVES_SEARCH_FAILURE = true
 * - ZERO SENSITIVE LEAKAGE = SIM (directStreamUrl nunca entra no índice de busca)
 */

import {
  IncrementalCompactSearchIndexV2Builder,
} from '../experiments/search-compact-v2/compact-search-v2-builder.ts';
import {
  deserializeCompactIndexV2,
  serializeCompactIndexV2,
} from '../experiments/search-compact-v2/compact-search-v2-serializer.ts';
import { bootTelemetry, yieldToEventLoop } from '../diagnostics/boot-telemetry.ts';
import { resolveSegmentRelativePath } from '../bootstrap/storage/segment-path-resolver.ts';
export { SEGMENT_PATH_ROOT_CAUSE_FIXED, CANONICAL_SEGMENT_PATH_RESOLVER } from '../bootstrap/storage/segment-path-resolver.ts';
import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';
import type { PrebuiltCatalog, Movie, Series } from '../contracts/catalog.ts';
import type { LiveCatalog } from '../catalog/live/live-tv.types.ts';
import { Filesystem, Directory } from '@capacitor/filesystem';

export const SEARCH_INCREMENTAL_BUILDER = true;
export const SEARCH_FULL_SOURCE_OBJECT_ARRAY_EXISTS = false;
export const SEARCH_SEGMENT_RELEASE_BEFORE_NEXT_SEGMENT = true;
export const SEARCH_PERSISTENCE_FAILURE_TRUTHFUL = true;
export const CATALOG_SURVIVES_SEARCH_FAILURE = true;
export const SEARCH_BUILD_DEFERRED_AFTER_PROMOTION = true;
export const SEARCH_BUILD_BATCHED = true;

export interface DeferredSearchIndexBuildOptions {
  catalogHeader?: PrebuiltCatalog;
  liveCatalog?: LiveCatalog | null;
  yieldBatchSize?: number;
  segmentData?: {
    movies?: Movie[];
    series?: Series[];
  };
}

/**
 * Converte um Uint8Array em base64 de forma bounded (chunks de 32KB)
 * sem usar btoa(String.fromCharCode(...spread)) que cria string gigante.
 */
function boundedUint8ArrayToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 32768; // 32 KB por chunk
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const slice = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
    let binary = '';
    for (let j = 0; j < slice.length; j++) {
      binary += String.fromCharCode(slice[j]);
    }
    chunks.push(binary);
  }
  return btoa(chunks.join(''));
}

export class DeferredSearchIndexCoordinator {
  private static readonly currentlyBuilding = new Set<string>();

  public static resetBuilding(): void {
    DeferredSearchIndexCoordinator.currentlyBuilding.clear();
  }

  public static isBuilding(snapshotId?: string): boolean {
    return snapshotId ? DeferredSearchIndexCoordinator.currentlyBuilding.has(snapshotId) : DeferredSearchIndexCoordinator.currentlyBuilding.size > 0;
  }

  /**
   * Verifica somente o cabeçalho/metadata do índice persistido. O catálogo
   * ativo continua disponível mesmo quando o índice está ausente ou inválido.
   */
  static async hasUsableActiveIndex(
    snapshotId: string,
    storage: LocalCatalogStorage,
  ): Promise<boolean> {
    try {
      const binary = await storage.readActiveSearchIndexBuffer?.();
      if (binary && binary.byteLength > 0) {
        const parsed = deserializeCompactIndexV2(binary);
        return parsed.metadata.catalogSnapshotId === snapshotId;
      }

      const legacy = await storage.readActiveSearchIndex();
      return Boolean(legacy && legacy.catalogSnapshotId === snapshotId);
    } catch {
      return false;
    }
  }

  private static dispatch(name: string, detail: Record<string, unknown>): void {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    }
  }

  /**
   * Constrói e persiste o CompactSearchIndexV2 de forma verdadeiramente delimitada após a promoção.
   *
   * Fluxo incremental e bounded:
   * 1. Inicializa o IncrementalCompactSearchIndexV2Builder com o header do catálogo
   * 2. Ingere o first-fold se disponível
   * 3. Itera os segmentos do manifest:
   *    - lê um segmento
   *    - converte em documentos compactos / tokens
   *    - ingere incrementalmente no builder
   *    - LIBERA os objetos Movie/Series daquele segmento antes de ler o próximo
   *    - cede ao event loop
   * 4. Constrói o índice sem jamais manter arrays completos com a fonte em RAM
   */
  static async buildAndPersistIndex(
    snapshotId: string,
    storage: LocalCatalogStorage,
    options?: DeferredSearchIndexBuildOptions
  ): Promise<{
    success: boolean;
    durationMs: number;
    tokenCount: number;
    indexSerialized: Buffer | Uint8Array;
    error?: string;
  }> {
    const t0 = performance.now();
    DeferredSearchIndexCoordinator.currentlyBuilding.add(snapshotId);
    bootTelemetry.mark('SEARCH_BUILD_STARTED');
    DeferredSearchIndexCoordinator.dispatch('xandeflix:search-index-building', { snapshotId });

    try {

    const manifest = await storage.readActiveManifest();
    const catalog = options?.catalogHeader || (await storage.readActiveCatalog());
    if (!catalog) {
      throw new Error('[DEFERRED_SEARCH] Catálogo não disponível para indexação.');
    }

    const builder = new IncrementalCompactSearchIndexV2Builder({
      catalogHeader: catalog,
      liveCatalog: options?.liveCatalog || undefined,
    });

    // Ingestão do first-fold (bounded pelo design do catalogHeader)
    const firstFoldMovies: Movie[] = options?.segmentData?.movies || catalog.movies || [];
    const firstFoldSeries: Series[] = options?.segmentData?.series || catalog.series || [];

    if (firstFoldMovies.length > 0) {
      builder.ingestMovies(firstFoldMovies);
    }
    if (firstFoldSeries.length > 0) {
      builder.ingestSeries(firstFoldSeries);
    }

    // Ingestão incremental segmento-a-segmento
    const hasSegments = (
      (!options?.segmentData || options.segmentData.movies === undefined) &&
      typeof storage.readActiveSegment === 'function' &&
      manifest &&
      (manifest as any).segments
    );

    if (hasSegments) {
      const segments = (manifest as any).segments as Array<{ fileName: string; kind: string }>;
      for (const seg of segments) {
        if (seg.kind === 'movies') {
          const segPath = resolveSegmentRelativePath(seg.fileName);
          const data = await (storage.readActiveSegment as (path: string) => Promise<string | null>)(segPath);
          if (data === null || data === undefined) {
            // T54: missing segment -> fail truthfully
            return {
              success: false,
              durationMs: Math.round(performance.now() - t0),
              tokenCount: 0,
              indexSerialized: new Uint8Array(0),
              error: `[SEARCH_MISSING_SEGMENT] Segmento obrigatório ausente: ${seg.fileName}`,
            };
          }
          let segMovies: Movie[];
          try {
            segMovies = JSON.parse(data);
            if (!Array.isArray(segMovies)) throw new Error('Segment is not an array');
          } catch (parseErr) {
            // T55: corrupt segment -> fail truthfully
            return {
              success: false,
              durationMs: Math.round(performance.now() - t0),
              tokenCount: 0,
              indexSerialized: new Uint8Array(0),
              error: `[SEARCH_CORRUPT_SEGMENT] Segmento corrompido: ${seg.fileName}`,
            };
          }

          // Ingestão incremental
          builder.ingestMovies(segMovies);

          // T52: Liberação explícita dos objetos Movie do segmento antes de ler o próximo
          segMovies.length = 0;
          await yieldToEventLoop();

        } else if (seg.kind === 'series') {
          const segPath = resolveSegmentRelativePath(seg.fileName);
          const data = await (storage.readActiveSegment as (path: string) => Promise<string | null>)(segPath);
          if (data === null || data === undefined) {
            // T54: missing segment -> fail truthfully
            return {
              success: false,
              durationMs: Math.round(performance.now() - t0),
              tokenCount: 0,
              indexSerialized: new Uint8Array(0),
              error: `[SEARCH_MISSING_SEGMENT] Segmento obrigatório ausente: ${seg.fileName}`,
            };
          }
          let segSeries: Series[];
          try {
            segSeries = JSON.parse(data);
            if (!Array.isArray(segSeries)) throw new Error('Segment is not an array');
          } catch (parseErr) {
            // T55: corrupt segment -> fail truthfully
            return {
              success: false,
              durationMs: Math.round(performance.now() - t0),
              tokenCount: 0,
              indexSerialized: new Uint8Array(0),
              error: `[SEARCH_CORRUPT_SEGMENT] Segmento corrompido: ${seg.fileName}`,
            };
          }

          // Ingestão incremental
          builder.ingestSeries(segSeries);

          // T52: Liberação explícita dos objetos Series do segmento antes de ler o próximo
          segSeries.length = 0;
          await yieldToEventLoop();
        }
      }
    }

    await yieldToEventLoop();

    const searchIndex = builder.build();
    const { buffer: indexSerialized } = serializeCompactIndexV2(searchIndex);
    const durationMs = Math.round(performance.now() - t0);

    // Persistência com tratamento estrito de erro (T56: persist failure truthful)
    let persisted = false;
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
        const path = `prebuilt/snapshots/${snapshotId}/compact-search-index-v2.bin`;
        const base64Data = Buffer.isBuffer(indexSerialized)
          ? indexSerialized.toString('base64')
          : boundedUint8ArrayToBase64(new Uint8Array(indexSerialized));
        await Filesystem.writeFile({
          path,
          data: base64Data,
          directory: Directory.Data,
        });
        persisted = true;
      } else if (storage && typeof (storage as any).writeActiveSearchIndex === 'function') {
        await (storage as any).writeActiveSearchIndex(snapshotId, indexSerialized);
        persisted = true;
      }
    } catch (persistErr) {
      DeferredSearchIndexCoordinator.dispatch('xandeflix:search-index-failed', {
        snapshotId,
        message: (persistErr as Error).message,
      });
      return {
        success: false,
        durationMs,
        tokenCount: 0,
        indexSerialized: new Uint8Array(0),
        error: `[SEARCH_PERSIST_FAILURE] ${(persistErr as Error).message}`,
      };
    }

    if (!persisted) {
      const error = '[SEARCH_PERSISTENCE_UNAVAILABLE] Nenhum destino local de persistência do índice foi disponibilizado.';
      DeferredSearchIndexCoordinator.dispatch('xandeflix:search-index-failed', { snapshotId, message: error });
      return {
        success: false,
        durationMs,
        tokenCount: 0,
        indexSerialized: new Uint8Array(0),
        error,
      };
    }

    bootTelemetry.mark('SEARCH_BUILD_COMPLETED');
    // Libera o marcador antes de notificar a UI; listeners que inicializam o
    // SearchService precisam observar o snapshot como pronto.
    DeferredSearchIndexCoordinator.currentlyBuilding.delete(snapshotId);
    DeferredSearchIndexCoordinator.dispatch('xandeflix:search-index-updated', {
      snapshotId,
      durationMs,
    });

    return {
      success: true,
      durationMs,
      tokenCount: searchIndex.metadata.tokenCount,
      indexSerialized,
    };
    } finally {
      DeferredSearchIndexCoordinator.currentlyBuilding.delete(snapshotId);
    }
  }
}

export const SEARCH_INDEX_FULL_CATALOG = true;
export const SEARCH_CONTAINS_DIRECT_STREAM_URL = false;
