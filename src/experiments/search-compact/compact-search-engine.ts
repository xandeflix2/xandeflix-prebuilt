/**
 * Xandeflix Prebuilt — Compact Search Engine (Experiment R2)
 *
 * Motor de busca em memória para o formato experimental COMPACT_SEARCH_INDEX_V1.
 *
 * Princípios:
 * - SPECIALIZED_EXACT_TITLE = SIM (lookup O(log E) via binary search)
 * - PREFIX_BINARY_RANGE = SIM (lookup O(log T + matches) sem varredura completa)
 * - BITSET_CANDIDATE_TRACKING = SIM (Uint8Array reutilizável de 30 KB)
 * - BOUNDED_TOP_K = SIM (TopKCollector para K=50)
 * - SEMANTIC_PARITY = SIM (mesma pontuação determinística e classes de casamento)
 */

import {
  type SearchMatchClass,
} from '../../search/search-index.types.ts';
import {
  normalizeSearchText,
  tokenize,
  MIN_PREFIX_LENGTH,
} from '../../search/search-normalization.ts';
import {
  type CompactSearchIndex,
  type CompactSearchDocument,
  type CompactQueryResult,
  type CompactSearchResultItem,
  type CompactSearchOptions,
} from './compact-search.types.ts';
import { deserializeCompactIndex } from './compact-search-serializer.ts';

export interface ScoredCandidate {
  docId: number;
  score: number;
  matchClass: SearchMatchClass;
}

export class TopKCollector {
  private capacity: number;
  public items: ScoredCandidate[] = [];
  private documents: CompactSearchDocument[];

  constructor(capacity: number, documents: CompactSearchDocument[]) {
    this.capacity = capacity;
    this.documents = documents;
  }

  add(docId: number, score: number, matchClass: SearchMatchClass): void {
    if (this.items.length < this.capacity) {
      this.items.push({ docId, score, matchClass });
      this.items.sort((a, b) => this.compare(a, b));
      return;
    }

    const worst = this.items[this.items.length - 1];
    // Otimização rápida: se score for menor que o pior do top-K, descarta imediatamente
    if (score < worst.score) {
      return;
    }

    const candidate: ScoredCandidate = { docId, score, matchClass };
    if (this.compare(candidate, worst) < 0) {
      this.items[this.items.length - 1] = candidate;
      this.items.sort((a, b) => this.compare(a, b));
    }
  }

  private compare(a: ScoredCandidate, b: ScoredCandidate): number {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const docA = this.documents[a.docId];
    const docB = this.documents[b.docId];
    const titleComp = docA.title.localeCompare(docB.title);
    if (titleComp !== 0) {
      return titleComp;
    }
    return docA.canonicalId.localeCompare(docB.canonicalId);
  }

  toResultItems(): CompactSearchResultItem[] {
    return this.items.map((item) => {
      const doc = this.documents[item.docId];
      return {
        id: doc.canonicalId,
        kind: doc.kind,
        title: doc.title,
        originalTitle: doc.originalTitle,
        year: doc.year,
        score: item.score,
        matchClass: item.matchClass,
      };
    });
  }
}

interface InternalDoc extends CompactSearchDocument {
  _normTitle?: string;
  _normOriginal?: string;
  _tokens?: string[];
  _tokenSet?: Set<string>;
}

export class CompactSearchEngine {
  private index: CompactSearchIndex | null = null;
  private candidateBitset: Uint8Array = new Uint8Array(0);

  load(source: CompactSearchIndex | Buffer | Uint8Array): void {
    if (Buffer.isBuffer(source) || source instanceof Uint8Array) {
      this.index = deserializeCompactIndex(source);
    } else {
      this.index = source;
    }

    const bitsetSize = Math.ceil(this.index.metadata.documentCount / 8);
    this.candidateBitset = new Uint8Array(bitsetSize);
  }

  isReady(): boolean {
    return this.index !== null && this.index.documents.length > 0;
  }

  getIndexMetadata() {
    if (!this.index) return null;
    return {
      format: this.index.metadata.format,
      version: this.index.metadata.version,
      catalogSnapshotId: this.index.metadata.catalogSnapshotId,
      catalogVersion: this.index.metadata.catalogVersion,
      documentCount: this.index.metadata.documentCount,
      tokenCount: this.index.metadata.tokenCount,
      exactTitleCount: this.index.metadata.exactTitleCount,
      totalPostingsCount: this.index.metadata.totalPostingsCount,
    };
  }

  /**
   * Busca exata no índice de títulos normalizados via Binary Search O(log E).
   * Retorna os docIds correspondentes.
   */
  lookupExactTitle(normalizedTitle: string): Uint32Array {
    if (!this.index) return new Uint32Array(0);

    const titles = this.index.exactTitles;
    let low = 0;
    let high = titles.length - 1;

    while (low <= high) {
      const mid = (low + high) >>> 1;
      const val = titles[mid];
      if (val === normalizedTitle) {
        const start = this.index.exactOffsets[mid];
        const end = this.index.exactOffsets[mid + 1];
        return this.index.exactDocIds.subarray(start, end);
      } else if (val < normalizedTitle) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return new Uint32Array(0);
  }

  /**
   * Busca um token exato no dicionário ordenado via Binary Search O(log T).
   * Retorna o índice do token ou -1 se não encontrado.
   */
  lookupToken(token: string): number {
    if (!this.index) return -1;

    const tokens = this.index.tokens;
    let low = 0;
    let high = tokens.length - 1;

    while (low <= high) {
      const mid = (low + high) >>> 1;
      const val = tokens[mid];
      if (val === token) {
        return mid;
      } else if (val < token) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return -1;
  }

  /**
   * Localiza o intervalo contíguo [start, end) de tokens que começam com o prefixo dado
   * utilizando binary search: lower_bound e upper_bound.
   * Complexidade: O(log T + matches), PROIBIDO varredura linear completa O(T).
   */
  findPrefixRange(prefix: string): [number, number] {
    if (!this.index) return [0, 0];

    const tokens = this.index.tokens;
    let low = 0;
    let high = tokens.length;

    // 1. Lower bound: primeiro token >= prefix
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (tokens[mid] < prefix) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    const start = low;
    if (start >= tokens.length || !tokens[start].startsWith(prefix)) {
      return [start, start];
    }

    // 2. Upper bound: primeiro token que NÃO inicia com prefix
    low = start;
    high = tokens.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (tokens[mid].startsWith(prefix) || tokens[mid] < prefix) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    const end = low;
    return [start, end];
  }

  /**
   * Obtém a lista de postings (docIds) para um índice de token.
   */
  getPostings(tokenIdx: number): Uint32Array {
    if (!this.index || tokenIdx < 0 || tokenIdx >= this.index.tokens.length) {
      return new Uint32Array(0);
    }
    const start = this.index.postingsOffsets[tokenIdx];
    const end = this.index.postingsOffsets[tokenIdx + 1];
    return this.index.postingsDocIds.subarray(start, end);
  }

  /**
   * Executa consulta de busca otimizada com bounded Top-K.
   */
  query(rawQuery: string, options?: CompactSearchOptions): CompactQueryResult {
    const startTime = performance.now();

    if (!this.isReady() || !this.index) {
      return { items: [], candidateCount: 0, durationMs: 0 };
    }

    const normalizedQuery = normalizeSearchText(rawQuery);
    if (!normalizedQuery) {
      return { items: [], candidateCount: 0, durationMs: 0 };
    }

    const queryTokens = tokenize(rawQuery);
    if (queryTokens.length === 0) {
      return { items: [], candidateCount: 0, durationMs: 0 };
    }

    const topK = options?.topK ?? 50;
    const filter = options?.filter;

    // =========================================================================
    // 1. EXACT TITLE LOOKUP ESPECIALIZADO
    // =========================================================================
    // Se a query inteira bater exatamente com um título normalizado no índice dedicado,
    // evitamos completamente a materialização de centenas de milhares de candidatos
    // vindos de tokens comuns ("movie", "alpha", etc.).
    const exactDocIds = this.lookupExactTitle(normalizedQuery);
    if (exactDocIds.length > 0) {
      const collector = new TopKCollector(topK, this.index.documents);

      for (let i = 0; i < exactDocIds.length; i++) {
        const docId = exactDocIds[i];
        const doc = this.index.documents[docId];
        if (!doc) continue;

        if (filter?.kind && filter.kind !== 'all' && doc.kind !== filter.kind) {
          continue;
        }
        if (typeof filter?.year === 'number' && doc.year !== filter.year) {
          continue;
        }

        const score = this.calculateDocumentScore(
          doc,
          normalizedQuery,
          queryTokens,
          'EXACT_TITLE'
        );
        collector.add(docId, score.score, score.matchClass);
      }

      const items = collector.toResultItems();
      const durationMs = Number((performance.now() - startTime).toFixed(2));
      return {
        items,
        candidateCount: exactDocIds.length,
        durationMs,
      };
    }

    // =========================================================================
    // 2. COLETOR DE CANDIDATOS COM BITSET (Postings + Prefixo Binário)
    // =========================================================================
    this.candidateBitset.fill(0);
    const candidateDocIds: number[] = [];

    for (const qToken of queryTokens) {
      // 2.1 Match exato do token
      const tokenIdx = this.lookupToken(qToken);
      if (tokenIdx >= 0) {
        const postings = this.getPostings(tokenIdx);
        for (let i = 0; i < postings.length; i++) {
          const docId = postings[i];
          const byteIdx = docId >>> 3;
          const bitMask = 1 << (docId & 7);
          if ((this.candidateBitset[byteIdx] & bitMask) === 0) {
            this.candidateBitset[byteIdx] |= bitMask;
            candidateDocIds.push(docId);
          }
        }
      }

      // 2.2 Match por prefixo via busca binária
      if (qToken.length >= MIN_PREFIX_LENGTH) {
        const [start, end] = this.findPrefixRange(qToken);
        for (let i = start; i < end; i++) {
          // Não duplicar o token se ele for idêntico ao qToken (já processado acima)
          if (this.index.tokens[i] === qToken) continue;

          const prefixPostings = this.getPostings(i);
          for (let j = 0; j < prefixPostings.length; j++) {
            const docId = prefixPostings[j];
            const byteIdx = docId >>> 3;
            const bitMask = 1 << (docId & 7);
            if ((this.candidateBitset[byteIdx] & bitMask) === 0) {
              this.candidateBitset[byteIdx] |= bitMask;
              candidateDocIds.push(docId);
            }
          }
        }
      }
    }

    const candidateCount = candidateDocIds.length;
    if (candidateCount === 0) {
      const durationMs = Number((performance.now() - startTime).toFixed(2));
      return { items: [], candidateCount: 0, durationMs };
    }

    // =========================================================================
    // 3. PONTUAÇÃO DETERMINÍSTICA E BOUNDED TOP-K
    // =========================================================================
    const collector = new TopKCollector(topK, this.index.documents);

    for (let i = 0; i < candidateDocIds.length; i++) {
      const docId = candidateDocIds[i];
      const doc = this.index.documents[docId];
      if (!doc) continue;

      if (filter?.kind && filter.kind !== 'all' && doc.kind !== filter.kind) {
        continue;
      }
      if (typeof filter?.year === 'number' && doc.year !== filter.year) {
        continue;
      }

      const score = this.calculateDocumentScore(doc, normalizedQuery, queryTokens);
      collector.add(docId, score.score, score.matchClass);
    }

    const items = collector.toResultItems();
    const durationMs = Number((performance.now() - startTime).toFixed(2));

    return {
      items,
      candidateCount,
      durationMs,
    };
  }

  /**
   * Cálculo determinístico de relevância com semântica idêntica ao SearchEngine G7 canônico.
   */
  private calculateDocumentScore(
    doc: CompactSearchDocument,
    normalizedQuery: string,
    queryTokens: string[],
    presetMatchClass?: SearchMatchClass
  ): { score: number; matchClass: SearchMatchClass } {
    const internalDoc = doc as InternalDoc;
    let normTitle = internalDoc._normTitle;
    let titleTokens = internalDoc._tokens;

    if (normTitle === undefined || titleTokens === undefined) {
      normTitle = normalizeSearchText(doc.title);
      titleTokens = normTitle ? normTitle.split(' ').filter((t) => t.length >= 2 || /^\d$/.test(t)) : [];
      internalDoc._normTitle = normTitle;
      internalDoc._tokens = titleTokens;
    }

    let normOriginal = internalDoc._normOriginal;
    if (normOriginal === undefined) {
      normOriginal = doc.originalTitle ? normalizeSearchText(doc.originalTitle) : '';
      internalDoc._normOriginal = normOriginal;
    }

    let score = 0;
    let matchClass: SearchMatchClass = presetMatchClass || 'AUXILIARY';

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
    let matchedAllTokens = queryTokens.length > 0;
    for (let i = 0; i < queryTokens.length; i++) {
      const qt = queryTokens[i];
      let found = false;
      for (let j = 0; j < titleTokens.length; j++) {
        if (titleTokens[j] === qt || titleTokens[j].startsWith(qt)) {
          found = true;
          break;
        }
      }
      if (!found) {
        matchedAllTokens = false;
        break;
      }
    }

    if (matchedAllTokens) {
      score += 250;
      if (matchClass !== 'EXACT_TITLE' && matchClass !== 'TITLE_PREFIX') {
        matchClass = 'ALL_TOKENS';
      }
    }

    // Regra 4: Casamentos parciais de tokens no título
    let tokenMatchScore = 0;
    for (let i = 0; i < queryTokens.length; i++) {
      const qt = queryTokens[i];
      let matchType = 0; // 0 = none, 1 = prefix (+70), 2 = exact (+100)
      for (let j = 0; j < titleTokens.length; j++) {
        if (titleTokens[j] === qt) {
          matchType = 2;
          break;
        } else if (matchType < 1 && titleTokens[j].startsWith(qt)) {
          matchType = 1;
        }
      }
      if (matchType === 2) {
        tokenMatchScore += 100;
      } else if (matchType === 1) {
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
      } else {
        for (let i = 0; i < queryTokens.length; i++) {
          if (normOriginal.includes(queryTokens[i])) {
            score += 40;
            break;
          }
        }
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

    return { score, matchClass };
  }
}
