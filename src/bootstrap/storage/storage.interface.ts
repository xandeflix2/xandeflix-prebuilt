/**
 * Xandeflix Prebuilt — Local Catalog Storage Interface
 *
 * Contrato abstrato de persistência local para o catálogo e ponteiro ativo.
 * Isola a lógica de negócio de implementações de baixo nível (Filesystem, In-Memory).
 *
 * Princípios:
 * - ACTIVE_GENERATION_SAFETY = REQUIRED
 * - APP_PRIVATE_STORAGE = SIM
 * - STAGING_GENERATION = REQUIRED
 * - SEGMENTED_CATALOG_STORAGE = SUPPORTED
 */

import type { PrebuiltCatalog } from '../../contracts/catalog.ts';
import type { ProvisioningManifest } from '../../provisioning/types.ts';
import type { PrebuiltSearchIndex } from '../../search/search-index.types.ts';
import type { LiveCatalog } from '../../catalog/live/live-tv.types.ts';
import type { ActivePointer } from '../types.ts';

export interface CatalogSegmentEntry {
  fileName: string;
  kind: 'movies' | 'series' | 'seasons' | 'episodes' | 'streams' | 'artworks' | 'live';
  recordCount: number;
  byteSize: number;
  sha256?: string;
}

export interface SegmentedCatalogProvenance {
  kind: 'REAL';
  sourceId: string;
  sourceVersion: number;
}

export interface SegmentedCatalogManifest {
  snapshotId: string;
  classificationProfileVersion: number;
  generatedAt: string;
  totalRecords: number;
  catalogSizeBytes: number;
  catalogSha256: string;
  /**
   * Para a materialização segmentada sem compressão, o conteúdo lógico do
   * pacote é exatamente o catálogo delimitado representado por catalogSha256.
   */
  packageContentHash: string;
  metadata?: SegmentedCatalogProvenance;
  counts: {
    movies: number;
    series: number;
    seasons: number;
    episodes: number;
    live: number;
    streams: number;
    artworks: number;
    categories: number;
    genres: number;
  };
  segments: CatalogSegmentEntry[];
}

export interface LocalCatalogStorage {
  /**
   * Lê o ponteiro do catálogo atualmente ativo. Retorna null se não houver catálogo promovido.
   */
  readActivePointer(): Promise<ActivePointer | null>;

  /**
   * Grava atomicamente o ponteiro do catálogo ativo.
   */
  writeActivePointer(pointer: ActivePointer): Promise<void>;

  /**
   * Escreve um pacote validado na área isolada de staging.
   */
  writeStaging(
    snapshotId: string,
    manifest: ProvisioningManifest,
    catalog: PrebuiltCatalog | string,
    searchIndex?: PrebuiltSearchIndex | Buffer | Uint8Array | null,
    liveCatalog?: LiveCatalog | null
  ): Promise<void>;

  /**
   * Lê o manifest, catálogo e índice opcional armazenados na área de staging para readback validation.
   */
  readStaging(
    snapshotId: string
  ): Promise<{
    manifest: ProvisioningManifest;
    catalog: PrebuiltCatalog;
    rawCatalogJson?: string;
    searchIndex?: PrebuiltSearchIndex | null;
    searchIndexBuffer?: Buffer | Uint8Array | null;
    liveCatalog?: LiveCatalog | null;
  } | null>;

  /**
   * Promove o snapshot de staging para a área permanente de snapshots.
   */
  promoteStaging(snapshotId: string): Promise<void>;

  /**
   * Lê o catálogo completo referenciado pelo ponteiro ativo.
   */
  readActiveCatalog(): Promise<PrebuiltCatalog | null>;

  /**
   * Lê o manifest referenciado pelo ponteiro ativo.
   */
  readActiveManifest(): Promise<ProvisioningManifest | null>;

  /**
   * Lê o índice de busca pré-construído referenciado pelo ponteiro ativo (se existir).
   */
  readActiveSearchIndex(): Promise<PrebuiltSearchIndex | null>;

  /**
   * Lê o índice compacto binário ativo quando presente. O método é opcional
   * para manter compatibilidade com stores de laboratório que só persistem o
   * índice JSON legado.
   */
  readActiveSearchIndexBuffer?(): Promise<Buffer | Uint8Array | null>;

  /** Persiste o índice compacto gerado após a promoção do snapshot ativo. */
  writeActiveSearchIndex?(snapshotId: string, index: Buffer | Uint8Array): Promise<void>;

  /**
   * Limpa artefatos temporários da área de staging.
   */
  cleanupStaging(snapshotId?: string): Promise<void>;

  /**
   * Verifica se há um catálogo ativo e íntegro presente.
   */
  hasActiveCatalog(): Promise<boolean>;

  /**
   * Calcula o espaço físico em bytes ocupado pelo snapshot atualmente ativo.
   */
  calculateActiveStorageSize(): Promise<number>;

  /**
   * Escreve um segmento delimitado de catálogo na área de staging.
   */
  writeStagingSegment?(snapshotId: string, segmentPath: string, data: string): Promise<void>;

  /**
   * Lê um segmento delimitado da área de staging.
   */
  readStagingSegment?(snapshotId: string, segmentPath: string): Promise<string | null>;

  /**
   * Lê um segmento delimitado do snapshot ativo.
   */
  readActiveSegment?(segmentPath: string): Promise<string | null>;

  /**
   * Lista os segmentos do snapshot ativo.
   */
  listActiveSegments?(): Promise<string[]>;

  /**
   * Lê o RecoveryJournal persistido (ou null se inexistente).
   */
  readRecoveryJournal?(): Promise<import('../../recovery/recovery.types.ts').RecoveryJournalData | null>;

  /**
   * Grava atomicamente o RecoveryJournal.
   */
  writeRecoveryJournal?(journal: import('../../recovery/recovery.types.ts').RecoveryJournalData): Promise<void>;

  /**
   * Lê o snapshot específico armazenado na área permanente de snapshots.
   */
  readSnapshot?(snapshotId: string): Promise<{
    manifest: ProvisioningManifest;
    catalog: PrebuiltCatalog;
    searchIndex?: PrebuiltSearchIndex | null;
    searchIndexBuffer?: Buffer | Uint8Array | null;
    liveCatalog?: LiveCatalog | null;
  } | null>;
}
