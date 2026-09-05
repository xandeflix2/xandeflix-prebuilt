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
 */

import type { PrebuiltCatalog } from '../../contracts/catalog.ts';
import type { ProvisioningManifest } from '../../provisioning/types.ts';
import type { PrebuiltSearchIndex } from '../../search/search-index.types.ts';
import type { ActivePointer } from '../types.ts';

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
    catalog: PrebuiltCatalog,
    searchIndex?: PrebuiltSearchIndex | null
  ): Promise<void>;

  /**
   * Lê o manifest, catálogo e índice opcional armazenados na área de staging para readback validation.
   */
  readStaging(
    snapshotId: string
  ): Promise<{
    manifest: ProvisioningManifest;
    catalog: PrebuiltCatalog;
    searchIndex?: PrebuiltSearchIndex | null;
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
}
