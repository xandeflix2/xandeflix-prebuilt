/**
 * Xandeflix Prebuilt — Search Service (Gate G7)
 *
 * Ponto de entrada de alto nível para busca no aplicativo cliente.
 *
 * Princípios:
 * - SEARCH_INDEX_DEVICE_STARTUP_REBUILD = PROHIBITED
 * - FAIL_CLOSED_WITHOUT_BREAKING_CATALOG: Se o índice for inválido ou ausente, o catálogo
 *   permanece ativo e utilizável (SEARCH_INDEX_UNAVAILABLE / SEARCH_INDEX_INVALID).
 * - ZERO NETWORK: Todas as operações são estritamente locais.
 */

import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';
import type {
  PrebuiltSearchIndex,
  SearchFilter,
  SearchResultItem,
  SearchStatus,
} from './search-index.types.ts';
import { SearchEngine } from './search-engine.ts';
import { SearchIndexValidator } from './search-index-validator.ts';
import { DeferredSearchIndexCoordinator } from './deferred-search-index-coordinator.ts';
import { CompactSearchEngineV2Pruned } from '../experiments/search-compact-v2-pruned/compact-search-v2-pruned-engine.ts';
import { Filesystem, Directory } from '@capacitor/filesystem';

export type SearchStateListener = (status: SearchStatus, results: SearchResultItem[]) => void;

export class SearchService {
  private storage: LocalCatalogStorage;
  private engine = new SearchEngine();
  private prunedEngine: CompactSearchEngineV2Pruned | null = null;
  private validator = new SearchIndexValidator();
  private currentStatus: SearchStatus = 'SEARCH_NO_ACTIVE_CATALOG';
  private currentResults: SearchResultItem[] = [];
  private listeners = new Set<SearchStateListener>();
  private activeSnapshotId: string | null = null;

  private readonly onSearchBuildStarted = (): void => {
    this.setStatus('SEARCH_PREPARING', []);
  };

  private readonly onSearchBuildCompleted = (): void => {
    void this.initialize();
  };

  private readonly onSearchBuildFailed = (): void => {
    this.setStatus('SEARCH_FAILED', []);
  };

  constructor(storage: LocalCatalogStorage) {
    this.storage = storage;
    if (typeof window !== 'undefined') {
      window.addEventListener('xandeflix:search-index-building', this.onSearchBuildStarted);
      window.addEventListener('xandeflix:search-index-updated', this.onSearchBuildCompleted);
      window.addEventListener('xandeflix:search-index-failed', this.onSearchBuildFailed);
    }
  }

  getActiveSnapshotId(): string | null {
    return this.activeSnapshotId;
  }

  /**
   * Inicializa o serviço de busca lendo o índice persistido no snapshot ativo.
   * Não efetua NENHUMA reindexação de catálogo.
   */
  async initialize(): Promise<SearchStatus> {
    const pointer = await this.storage.readActivePointer();
    if (!pointer) {
      this.setStatus('SEARCH_NO_ACTIVE_CATALOG', []);
      return this.currentStatus;
    }

    this.activeSnapshotId = pointer.snapshotId;
    if (DeferredSearchIndexCoordinator.isBuilding(pointer.snapshotId)) {
      this.setStatus('SEARCH_PREPARING', []);
      return this.currentStatus;
    }
    this.setStatus('SEARCH_INDEX_LOADING', []);

    // 1. Tenta carregar CompactSearchIndexV2 binário de alta performance
    if (typeof window !== 'undefined' && (window as any).Capacitor?.convertFileSrc) {
      try {
        let binStat = await Filesystem.getUri({
          path: `prebuilt/snapshots/${pointer.snapshotId}/compact-search-index-v2.bin`,
          directory: Directory.Data,
        }).catch(() => null);

        if (!binStat?.uri) {
          binStat = await Filesystem.getUri({
            path: 'compact-search-index-v2.bin',
            directory: Directory.Data,
          }).catch(() => null);
        }

        if (binStat?.uri) {
          const webUrl = (window as any).Capacitor.convertFileSrc(binStat.uri);
          const res = await fetch(webUrl);
          if (res.ok) {
            const buf = await res.arrayBuffer();
            this.prunedEngine = new CompactSearchEngineV2Pruned();
            this.prunedEngine.load(new Uint8Array(buf));
            this.setStatus('SEARCH_READY', []);
            return this.currentStatus;
          }
        }
      } catch {
        // Continua para fallback
      }
    }

    // 2. Fallback: Lê o search-index.json persistido no snapshot ativo
    let searchIndex: PrebuiltSearchIndex | null = null;
    try {
      searchIndex = await this.storage.readActiveSearchIndex();
    } catch {
      this.setStatus('SEARCH_INDEX_INVALID', []);
      return this.currentStatus;
    }

    if (!searchIndex) {
      if (DeferredSearchIndexCoordinator.isBuilding(pointer.snapshotId)) {
        this.setStatus('SEARCH_PREPARING', []);
        return this.currentStatus;
      }
      this.setStatus('SEARCH_INDEX_UNAVAILABLE', []);
      return this.currentStatus;
    }

    // Valida o índice carregado fail-closed
    const validation = this.validator.validate(searchIndex, {
      expectedSnapshotId: pointer.snapshotId,
      expectedCatalogVersion: pointer.catalogVersion,
    });

    if (!validation.valid) {
      this.setStatus('SEARCH_INDEX_INVALID', []);
      return this.currentStatus;
    }

    // Carrega estruturas em memória no SearchEngine
    this.engine.load(searchIndex);
    this.setStatus('SEARCH_READY', []);
    return this.currentStatus;
  }

  /**
   * Executa busca sobre o índice carregado.
   */
  search(query: string, filter?: SearchFilter): SearchResultItem[] {
    if (this.currentStatus === 'SEARCH_NO_ACTIVE_CATALOG') {
      return [];
    }
    if (
      this.currentStatus === 'SEARCH_INDEX_UNAVAILABLE' ||
      this.currentStatus === 'SEARCH_INDEX_INVALID' ||
      this.currentStatus === 'SEARCH_PREPARING' ||
      this.currentStatus === 'SEARCH_FAILED'
    ) {
      return [];
    }

    const trimmed = query.trim();
    if (!trimmed) {
      this.setStatus('SEARCH_QUERY_EMPTY', []);
      return [];
    }

    let results: SearchResultItem[] = [];
    if (this.prunedEngine && this.prunedEngine.isReady()) {
      const prunedRes = this.prunedEngine.query(trimmed, { topK: 50, filter });
      results = prunedRes.items;
    } else {
      results = this.engine.query(trimmed, filter);
    }

    if (results.length === 0) {
      this.setStatus('SEARCH_NO_RESULTS', []);
    } else {
      this.setStatus('SEARCH_RESULTS', results);
    }

    return results;
  }

  getStatus(): SearchStatus {
    return this.currentStatus;
  }

  getResults(): SearchResultItem[] {
    return this.currentResults;
  }

  isSearchReady(): boolean {
    return this.currentStatus === 'SEARCH_READY' ||
      this.currentStatus === 'SEARCH_QUERY_EMPTY' ||
      this.currentStatus === 'SEARCH_RESULTS' ||
      this.currentStatus === 'SEARCH_NO_RESULTS';
  }

  subscribe(listener: SearchStateListener): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus, this.currentResults);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setStatus(status: SearchStatus, results: SearchResultItem[]): void {
    this.currentStatus = status;
    this.currentResults = results;
    for (const listener of this.listeners) {
      try {
        listener(status, results);
      } catch {
        // Ignora erros de listeners
      }
    }
  }
}
