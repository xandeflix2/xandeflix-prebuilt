/**
 * Xandeflix Prebuilt — Compact Search Engine V2 (Experiment R3)
 *
 * Motor de busca em memória para o formato COMPACT_SEARCH_INDEX_V2.
 *
 * Princípios:
 * - SPECIALIZED_EXACT_TITLE = SIM (lookup O(log E) com Delta docIds)
 * - PREFIX_BINARY_RANGE = SIM (lookup O(log T + matches) sem varredura linear)
 * - DELTA_VARINT_POSTINGS = SIM (decodificação streaming direta no bitset)
 * - STRING_POOL_RESOLVER = SIM (decodificação sob demanda com cache indexado)
 * - BOUNDED_TOP_K = 50
 * - SEMANTIC_PARITY_B_TO_C = SIM (mesma pontuação e desempate determinístico)
 */

import {
  type SearchDocumentKind,
  type SearchMatchClass,
} from '../../search/search-index.types.ts';
import {
  normalizeSearchText,
  tokenize,
  MIN_PREFIX_LENGTH,
} from '../../search/search-normalization.ts';
import {
  type CompactSearchIndexV2,
  type CompactQueryResultV2,
  type CompactSearchResultItemV2,
  type CompactSearchOptionsV2,
} from './compact-search-v2.types.ts';
import { deserializeCompactIndexV2 } from './compact-search-v2-serializer.ts';
import { decodeDeltaPosting, decodeDeltaPostingIntoBitset } from './codec.ts';

export interface ScoredCandidateV2 {
  docId: number;
  score: number;
  matchClass: SearchMatchClass;
  title: string;
  canonicalId: string;
}

export class TopKCollectorV2 {
  private capacity: number;
  public items: ScoredCandidateV2[] = [];
  private index: CompactSearchIndexV2;

  constructor(capacity: number, index: CompactSearchIndexV2) {
    this.capacity = capacity;
    this.index = index;
  }

  add(docId: number, score: number, matchClass: SearchMatchClass): void {
    if (this.items.length < this.capacity) {
      const title = this.index.stringPool.getString(this.index.docTitleIds[docId]);
      const canonicalId = this.index.stringPool.getString(this.index.docCanonicalIdIds[docId]);
      this.items.push({ docId, score, matchClass, title, canonicalId });
      this.items.sort((a, b) => this.compare(a, b));
      return;
    }

    const worst = this.items[this.items.length - 1];
    if (score < worst.score) {
      return;
    }

    if (score === worst.score) {
      const title = this.index.stringPool.getString(this.index.docTitleIds[docId]);
      const titleComp = title.localeCompare(worst.title);
      if (titleComp > 0) {
        return;
      }
      const canonicalId = this.index.stringPool.getString(this.index.docCanonicalIdIds[docId]);
      if (titleComp === 0 && canonicalId.localeCompare(worst.canonicalId) >= 0) {
        return;
      }

      this.items[this.items.length - 1] = { docId, score, matchClass, title, canonicalId };
      this.items.sort((a, b) => this.compare(a, b));
      return;
    }

    // score > worst.score
    const title = this.index.stringPool.getString(this.index.docTitleIds[docId]);
    const canonicalId = this.index.stringPool.getString(this.index.docCanonicalIdIds[docId]);
    this.items[this.items.length - 1] = { docId, score, matchClass, title, canonicalId };
    this.items.sort((a, b) => this.compare(a, b));
  }

  private compare(a: ScoredCandidateV2, b: ScoredCandidateV2): number {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const titleComp = a.title.localeCompare(b.title);
    if (titleComp !== 0) {
      return titleComp;
    }
    return a.canonicalId.localeCompare(b.canonicalId);
  }

  toResultItems(): CompactSearchResultItemV2[] {
    return this.items.map((item) => {
      const docId = item.docId;
      const title = item.title;
      const canonicalId = item.canonicalId;
      const origId = this.index.docOriginalTitleIds[docId];
      const originalTitle = origId >= 0 ? this.index.stringPool.getString(origId) : undefined;
      const year = this.index.docYears[docId] || undefined;
      const k = this.index.docKinds[docId];
      const kind: SearchDocumentKind = k === 0 ? 'movie' : k === 1 ? 'series' : 'live';

      return {
        id: canonicalId,
        kind,
        title,
        originalTitle,
        year,
        score: item.score,
        matchClass: item.matchClass,
      };
    });
  }
}

export class CompactSearchEngineV2 {
  private index: CompactSearchIndexV2 | null = null;
  private candidateBitset: Uint8Array = new Uint8Array(0);

  // Caches indexados por docId para alta velocidade e zero alocações
  private cachedNormTitles: (string | undefined)[] = [];
  private cachedNormOriginals: (string | undefined)[] = [];
  private cachedTokens: (string[] | undefined)[] = [];

  load(source: CompactSearchIndexV2 | Buffer | Uint8Array): void {
    if (source instanceof Uint8Array || (typeof Buffer !== 'undefined' && Buffer.isBuffer(source))) {
      this.index = deserializeCompactIndexV2(source);
    } else {
      this.index = source as CompactSearchIndexV2;
    }

    const docCount = this.index.metadata.documentCount;
    const bitsetSize = Math.ceil(docCount / 8);
    this.candidateBitset = new Uint8Array(bitsetSize);

    this.cachedNormTitles = new Array(docCount);
    this.cachedNormOriginals = new Array(docCount);
    this.cachedTokens = new Array(docCount);
  }

  isReady(): boolean {
    return this.index !== null && this.index.metadata.documentCount > 0;
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
      stringPoolCount: this.index.metadata.stringPoolCount,
      totalPostingsCount: this.index.metadata.totalPostingsCount,
      totalPostingsBytes: this.index.metadata.totalPostingsBytes,
    };
  }

  /**
   * Busca exata no índice de títulos normalizados via Binary Search O(log E).
   * Decodifica os docIds com Delta Encoding.
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
        const bytes = this.index.exactDocIds.subarray(start, end);
        return decodeDeltaPosting(bytes);
      } else if (val < normalizedTitle) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return new Uint32Array(0);
  }

  /**
   * Busca um token no dicionário ordenado via Binary Search O(log T).
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
   * Localiza o intervalo de tokens por prefixo via lower_bound / upper_bound O(log T).
   */
  findPrefixRange(prefix: string): [number, number] {
    if (!this.index) return [0, 0];

    const tokens = this.index.tokens;
    let low = 0;
    let high = tokens.length;

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
   * Executa a consulta de busca com bounded Top-K.
   */
  query(rawQuery: string, options?: CompactSearchOptionsV2): CompactQueryResultV2 {
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

    // 1. Exact Title Lookup Especializado
    const exactDocIds = this.lookupExactTitle(normalizedQuery);
    if (exactDocIds.length > 0) {
      const collector = new TopKCollectorV2(topK, this.index);

      for (let i = 0; i < exactDocIds.length; i++) {
        const docId = exactDocIds[i];
        if (filter?.kind && filter.kind !== 'all') {
          const kind = this.index.docKinds[docId] === 0 ? 'movie' : 'series';
          if (kind !== filter.kind) continue;
        }
        if (typeof filter?.year === 'number' && this.index.docYears[docId] !== filter.year) {
          continue;
        }

        const score = this.calculateDocumentScore(docId, normalizedQuery, queryTokens, 'EXACT_TITLE');
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

    // 2. Coleta de Candidatos com Bitset + Delta Varint Streaming
    this.candidateBitset.fill(0);
    const candidateDocIds: number[] = [];

    for (const qToken of queryTokens) {
      const tokenIdx = this.lookupToken(qToken);
      if (tokenIdx >= 0) {
        const start = this.index.postingsOffsets[tokenIdx];
        const end = this.index.postingsOffsets[tokenIdx + 1];
        const bytes = this.index.postingsBytes.subarray(start, end);
        decodeDeltaPostingIntoBitset(bytes, this.candidateBitset, candidateDocIds);
      }

      if (qToken.length >= MIN_PREFIX_LENGTH) {
        const [start, end] = this.findPrefixRange(qToken);
        for (let i = start; i < end; i++) {
          if (this.index.tokens[i] === qToken) continue;

          const pStart = this.index.postingsOffsets[i];
          const pEnd = this.index.postingsOffsets[i + 1];
          const bytes = this.index.postingsBytes.subarray(pStart, pEnd);
          decodeDeltaPostingIntoBitset(bytes, this.candidateBitset, candidateDocIds);
        }
      }
    }

    const candidateCount = candidateDocIds.length;
    if (candidateCount === 0) {
      const durationMs = Number((performance.now() - startTime).toFixed(2));
      return { items: [], candidateCount: 0, durationMs };
    }

    // 3. Pontuação Determinística e Bounded Top-K
    const collector = new TopKCollectorV2(topK, this.index);

    for (let i = 0; i < candidateDocIds.length; i++) {
      const docId = candidateDocIds[i];

      if (filter?.kind && filter.kind !== 'all') {
        const kind = this.index.docKinds[docId] === 0 ? 'movie' : 'series';
        if (kind !== filter.kind) continue;
      }
      if (typeof filter?.year === 'number' && this.index.docYears[docId] !== filter.year) {
        continue;
      }

      const score = this.calculateDocumentScore(docId, normalizedQuery, queryTokens);
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
   * Cálculo determinístico de relevância com semântica idêntica ao V1 e G7.
   */
  private calculateDocumentScore(
    docId: number,
    normalizedQuery: string,
    queryTokens: string[],
    presetMatchClass?: SearchMatchClass
  ): { score: number; matchClass: SearchMatchClass } {
    if (!this.index) return { score: 10, matchClass: 'AUXILIARY' };

    let normTitle = this.cachedNormTitles[docId];
    let titleTokens = this.cachedTokens[docId];

    if (normTitle === undefined || titleTokens === undefined) {
      const rawTitle = this.index.stringPool.getString(this.index.docTitleIds[docId]);
      normTitle = normalizeSearchText(rawTitle);
      titleTokens = normTitle ? normTitle.split(' ').filter((t) => t.length >= 2 || /^\d$/.test(t)) : [];
      this.cachedNormTitles[docId] = normTitle;
      this.cachedTokens[docId] = titleTokens;
    }

    let normOriginal = this.cachedNormOriginals[docId];
    if (normOriginal === undefined) {
      const origId = this.index.docOriginalTitleIds[docId];
      if (origId >= 0) {
        const rawOrig = this.index.stringPool.getString(origId);
        normOriginal = normalizeSearchText(rawOrig);
      } else {
        normOriginal = '';
      }
      this.cachedNormOriginals[docId] = normOriginal;
    }

    let score = 0;
    let matchClass: SearchMatchClass = presetMatchClass || 'AUXILIARY';

    // Regra 1: Título exato normalizado
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
    const year = this.index.docYears[docId];
    if (year && queryTokens.includes(String(year))) {
      score += 30;
    }

    if (score === 0) {
      score = 10;
      matchClass = 'AUXILIARY';
    }

    return { score, matchClass };
  }
}
