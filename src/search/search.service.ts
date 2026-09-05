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

export type SearchStateListener = (status: SearchStatus, results: SearchResultItem[]) => void;

export class SearchService {
  private storage: LocalCatalogStorage;
  private engine = new SearchEngine();
  private validator = new SearchIndexValidator();
  private currentStatus: SearchStatus = 'SEARCH_NO_ACTIVE_CATALOG';
  private currentResults: SearchResultItem[] = [];
  private listeners = new Set<SearchStateListener>();
  private activeSnapshotId: string | null = null;

  constructor(storage: LocalCatalogStorage) {
    this.storage = storage;
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
    this.setStatus('SEARCH_INDEX_LOADING', []);

    // Lê o search-index.json persistido no snapshot ativo
    let searchIndex: PrebuiltSearchIndex | null = null;
    try {
      searchIndex = await this.storage.readActiveSearchIndex();
    } catch {
      this.setStatus('SEARCH_INDEX_INVALID', []);
      return this.currentStatus;
    }

    if (!searchIndex) {
      // Pacote v1 ou pacote sem busca: busca indisponível mas catálogo continua
      this.setStatus('SEARCH_INDEX_UNAVAILABLE', []);
      return this.currentStatus;
    }

    // Valida o índice carregado fail-closed
    const validation = this.validator.validate(searchIndex, {
      expectedSnapshotId: pointer.snapshotId,
      expectedCatalogVersion: pointer.catalogVersion,
    });

    if (!validation.valid) {
      // Índice corrompido ou com divergência de snapshot: busca indisponível
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
      this.currentStatus === 'SEARCH_INDEX_INVALID'
    ) {
      return [];
    }

    const trimmed = query.trim();
    if (!trimmed) {
      this.setStatus('SEARCH_QUERY_EMPTY', []);
      return [];
    }

    const results = this.engine.query(trimmed, filter);

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
