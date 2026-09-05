/**
 * Xandeflix Prebuilt — Search Engine (Gate G7)
 *
 * Motor de busca local em memória que opera exclusivamente sobre o
 * índice de busca pré-construído transportado (PrebuiltSearchIndex).
 *
 * Princípios:
 * - SEARCH_QUERY_NETWORK = NONE
 * - FULL_TEXT_REINDEX = NAO (deserializa apenas postings em Map para busca rápida)
 * - DETERMINISTIC_RANKING = SIM (score decrescente, desempate por title e id)
 * - NO_DIRECT_CATALOG_FILTER = SIM (consulta via postings)
 */

import {
  type PrebuiltSearchIndex,
  type SearchDocument,
  type SearchFilter,
  type SearchResultItem,
  type SearchMatchClass,
} from './search-index.types.ts';
import {
  normalizeSearchText,
  tokenize,
  MIN_PREFIX_LENGTH,
} from './search-normalization.ts';

export class SearchEngine {
  private index: PrebuiltSearchIndex | null = null;
  private documents: SearchDocument[] = [];
  private postingsMap = new Map<string, number[]>();
  private sortedTokens: string[] = [];

  /**
   * Carrega o índice de busca pré-construído na memória.
   * Materializa apenas estruturas efêmeras de consulta (Map e arrays).
   * NÃO faz reindexação de catálogo.
   */
  load(searchIndex: PrebuiltSearchIndex): void {
    this.index = searchIndex;
    this.documents = searchIndex.documents;
    this.postingsMap.clear();

    for (const [token, docIndices] of Object.entries(searchIndex.postings)) {
      this.postingsMap.set(token, docIndices);
    }

    this.sortedTokens = Array.from(this.postingsMap.keys()).sort();
  }

  /**
   * Indica se há um índice de busca carregado e pronto para consultas.
   */
  isReady(): boolean {
    return this.index !== null && this.documents.length > 0;
  }

  /**
   * Retorna os metadados do índice ativo.
   */
  getIndexMetadata(): {
    catalogSnapshotId: string;
    catalogVersion: string;
    documentCount: number;
    tokenCount: number;
  } | null {
    if (!this.index) return null;
    return {
      catalogSnapshotId: this.index.catalogSnapshotId,
      catalogVersion: this.index.catalogVersion,
      documentCount: this.index.documentCount,
      tokenCount: this.index.tokenCount,
    };
  }

  /**
   * Executa uma consulta local sobre o índice.
   */
  query(rawQuery: string, filter?: SearchFilter): SearchResultItem[] {
    if (!this.isReady()) return [];

    const normalizedQuery = normalizeSearchText(rawQuery);
    if (!normalizedQuery) return [];

    const queryTokens = tokenize(rawQuery);
    if (queryTokens.length === 0) return [];

    // 1. Coleta de candidatos via índice invertido (postings)
    const candidateDocIndices = new Set<number>();

    for (const qToken of queryTokens) {
      // 1.1 Match exato do token
      const exactList = this.postingsMap.get(qToken);
      if (exactList) {
        for (const idx of exactList) {
          candidateDocIndices.add(idx);
        }
      }

      // 1.2 Match por prefixo (se tamanho do token >= MIN_PREFIX_LENGTH)
      if (qToken.length >= MIN_PREFIX_LENGTH) {
        for (const dictToken of this.sortedTokens) {
          if (dictToken.startsWith(qToken) && dictToken !== qToken) {
            const prefixList = this.postingsMap.get(dictToken);
            if (prefixList) {
              for (const idx of prefixList) {
                candidateDocIndices.add(idx);
              }
            }
          }
        }
      }
    }

    if (candidateDocIndices.size === 0) {
      return [];
    }

    // 2. Pontuação e filtragem determinística dos candidatos
    const results: SearchResultItem[] = [];

    for (const docIdx of candidateDocIndices) {
      const doc = this.documents[docIdx];
      if (!doc) continue;

      // 2.1 Aplicar filtros
      if (filter?.kind && filter.kind !== 'all' && doc.kind !== filter.kind) {
        continue;
      }
      if (filter?.genreId && !doc.genreIds.includes(filter.genreId)) {
        continue;
      }
      if (typeof filter?.year === 'number' && doc.year !== filter.year) {
        continue;
      }

      // 2.2 Cálculo de relevância determinística (SEARCH_RANKING = DETERMINISTIC_WEIGHTED_TEXT_V1)
      const normTitle = normalizeSearchText(doc.title);
      const normOriginal = doc.originalTitle ? normalizeSearchText(doc.originalTitle) : '';
      const titleTokens = tokenize(doc.title);
      const titleTokenSet = new Set(titleTokens);

      let score = 0;
      let matchClass: SearchMatchClass = 'AUXILIARY';

      // Regra 1: Título exato normalizado (maior prioridade)
      if (normTitle === normalizedQuery) {
        score += 1000;
        matchClass = 'EXACT_TITLE';
      } else if (normTitle.startsWith(normalizedQuery)) {
        // Regra 2: Título inicia com a query completa
        score += 500;
        matchClass = 'TITLE_PREFIX';
      }

      // Regra 3: Todos os tokens da query presentes no título
      const matchedAllTokens =
        queryTokens.length > 0 &&
        queryTokens.every(
          (qt) => titleTokenSet.has(qt) || titleTokens.some((tt) => tt.startsWith(qt))
        );

      if (matchedAllTokens) {
        score += 250;
        if (matchClass !== 'EXACT_TITLE' && matchClass !== 'TITLE_PREFIX') {
          matchClass = 'ALL_TOKENS';
        }
      }

      // Regra 4: Casamentos parciais de tokens no título
      let tokenMatchScore = 0;
      for (const qt of queryTokens) {
        if (titleTokenSet.has(qt)) {
          tokenMatchScore += 100;
        } else if (titleTokens.some((tt) => tt.startsWith(qt))) {
          tokenMatchScore += 70;
        }
      }
      if (tokenMatchScore > 0) {
        score += tokenMatchScore;
        if (matchClass === 'AUXILIARY') {
          matchClass = 'PARTIAL';
        }
      }

      // Regra 5: Casamento em título original
      if (normOriginal) {
        if (normOriginal === normalizedQuery) {
          score += 120;
        } else if (normOriginal.startsWith(normalizedQuery)) {
          score += 60;
        } else if (queryTokens.some((qt) => normOriginal.includes(qt))) {
          score += 40;
        }
      }

      // Regra 6: Correspondência auxiliar em ano/metadados
      if (doc.year && queryTokens.includes(String(doc.year))) {
        score += 30;
      }

      if (score === 0) {
        score = 10;
        matchClass = 'AUXILIARY';
      }

      results.push({
        id: doc.id,
        kind: doc.kind,
        title: doc.title,
        originalTitle: doc.originalTitle,
        year: doc.year,
        score,
        matchClass,
      });
    }

    // 3. Ordenação determinística estrita:
    // 1º score desc, 2º title asc, 3º id asc
    results.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const titleCompare = a.title.localeCompare(b.title);
      if (titleCompare !== 0) {
        return titleCompare;
      }
      return a.id.localeCompare(b.id);
    });

    return results;
  }
}
