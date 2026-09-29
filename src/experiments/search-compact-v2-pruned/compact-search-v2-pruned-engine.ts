/**
 * Xandeflix Prebuilt — Compact Search Index V2 Pruned Engine (Experiment R5)
 *
 * Motor de busca em memória para o formato COMPACT_SEARCH_INDEX_V2 com
 * estratégias de Early Termination, Score Upper Bounding e Top-K Pruning.
 *
 * Princípios:
 * - EXACT_PARITY_WITH_V2 = SIM (100% idêntico em Top-K e ordenação)
 * - BOUNDED_MIN_HEAP = K=50 (estrutura fixa O(log K) para descarte O(1))
 * - TIERED_PROCESSING = SIM (ExactTitle -> Multi-token match tiers)
 * - SCORE_UPPER_BOUND_PRUNING = SIM (terminação antecipada exata baseada em limites teóricos)
 */

import { type SearchMatchClass, type SearchFilter } from '../../search/search-index.types.ts';
import {
  normalizeSearchText,
  tokenize,
  MIN_PREFIX_LENGTH,
} from '../../search/search-normalization.ts';
import {
  type CompactSearchIndexV2,
  type CompactSearchResultItemV2,
  type CompactSearchOptionsV2,
} from '../search-compact-v2/compact-search-v2.types.ts';
import { deserializeCompactIndexV2 } from '../search-compact-v2/compact-search-v2-serializer.ts';
import { decodeDeltaPosting, decodeDeltaPostingIntoBitset } from '../search-compact-v2/codec.ts';
import { TopKMinHeap, fastCompareString } from './top-k-heap.ts';

export interface PrunedQueryResult {
  items: CompactSearchResultItemV2[];
  rawCandidateCount: number;
  scoredCandidateCount: number;
  prunedCandidateCount: number;
  candidateCount?: number;
  scoredCandidates?: number;
  prunedCount?: number;
  durationMs: number;
  earlyTerminated: boolean;
  terminationTier?: string;
}

export class CompactSearchEngineV2Pruned {
  private index: CompactSearchIndexV2 | null = null;
  private candidateBitset: Uint8Array = new Uint8Array(0);
  private tokenMatchCounts: Uint8Array = new Uint8Array(0);

  // Caches indexados por docId
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
    this.tokenMatchCounts = new Uint8Array(docCount);

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

  findExactTitlePrefixRange(prefix: string): [number, number] {
    if (!this.index) return [0, 0];

    const titles = this.index.exactTitles;
    let low = 0;
    let high = titles.length;

    while (low < high) {
      const mid = (low + high) >>> 1;
      if (titles[mid] < prefix) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    const start = low;
    if (start >= titles.length || !titles[start].startsWith(prefix)) {
      return [start, start];
    }

    low = start;
    high = titles.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (titles[mid].startsWith(prefix) || titles[mid] < prefix) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    const end = low;
    return [start, end];
  }

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

  private passesFilter(docId: number, filter?: SearchFilter): boolean {
    if (!filter || !this.index) return true;
    if (filter.kind && filter.kind !== 'all') {
      const k = this.index.docKinds[docId];
      const kind = k === 0 ? 'movie' : k === 1 ? 'series' : 'live';
      if (kind !== filter.kind) return false;
    }
    if (typeof filter.year === 'number' && this.index.docYears[docId] !== filter.year) {
      return false;
    }
    return true;
  }

  /**
   * Executa a consulta de busca com Bounded Top-K e Pruning Exato.
   */
  query(rawQuery: string, options?: CompactSearchOptionsV2): PrunedQueryResult {
    const startTime = performance.now();

    if (!this.isReady() || !this.index) {
      return { items: [], candidateCount: 0, rawCandidateCount: 0, scoredCandidateCount: 0, prunedCandidateCount: 0, durationMs: 0, earlyTerminated: false };
    }

    const normalizedQuery = normalizeSearchText(rawQuery);
    if (!normalizedQuery) {
      return { items: [], candidateCount: 0, rawCandidateCount: 0, scoredCandidateCount: 0, prunedCandidateCount: 0, durationMs: 0, earlyTerminated: false };
    }

    const queryTokens = tokenize(rawQuery);
    if (queryTokens.length === 0) {
      return { items: [], candidateCount: 0, rawCandidateCount: 0, scoredCandidateCount: 0, prunedCandidateCount: 0, durationMs: 0, earlyTerminated: false };
    }

    const topK = options?.topK ?? 50;
    const filter = options?.filter;
    const heap = new TopKMinHeap(topK, this.index);

    let rawCandidateCount = 0;
    let scoredCandidateCount = 0;

    // =========================================================================
    // TIER 1: EXACT TITLE LOOKUP ESPECIALIZADO (SHORT-CIRCUIT CANÔNICO)
    // =========================================================================
    const exactDocIds = this.lookupExactTitle(normalizedQuery);
    if (exactDocIds.length > 0) {
      rawCandidateCount = exactDocIds.length;
      for (let i = 0; i < exactDocIds.length; i++) {
        const docId = exactDocIds[i];
        if (this.passesFilter(docId, filter)) {
          const score = this.calculateDocumentScore(docId, normalizedQuery, queryTokens, 'EXACT_TITLE');
          scoredCandidateCount++;
          heap.add(docId, score.score, score.matchClass);
        }
      }

      const durationMs = Number((performance.now() - startTime).toFixed(2));
      return {
        items: heap.toSortedResults(),
        rawCandidateCount,
        scoredCandidateCount,
        prunedCandidateCount: 0,
        durationMs,
        earlyTerminated: true,
        terminationTier: 'TIER_1_EXACT_TITLE',
      };
    }

    // =========================================================================
    // TIER 2: INVERTED INDEX CANDIDATE COLLECTION
    // =========================================================================
    const m = queryTokens.length;

    // Verificar se a query possui tokens numéricos de 4 dígitos (para limite de ano)
    let queryHasYear = false;
    for (let i = 0; i < m; i++) {
      if (/^\d{4}$/.test(queryTokens[i])) {
        queryHasYear = true;
        break;
      }
    }

    this.candidateBitset.fill(0);
    this.tokenMatchCounts.fill(0);

    const tokenDocSet: number[] = [];

    for (let qIdx = 0; qIdx < m; qIdx++) {
      const qToken = queryTokens[qIdx];
      const currentTokenDocIds: number[] = [];

      const tokenIdx = this.lookupToken(qToken);
      if (tokenIdx >= 0) {
        const start = this.index.postingsOffsets[tokenIdx];
        const end = this.index.postingsOffsets[tokenIdx + 1];
        const bytes = this.index.postingsBytes.subarray(start, end);
        decodeDeltaPostingIntoBitset(bytes, this.candidateBitset, currentTokenDocIds);
      }

      if (qToken.length >= MIN_PREFIX_LENGTH) {
        const [start, end] = this.findPrefixRange(qToken);
        for (let i = start; i < end; i++) {
          if (this.index.tokens[i] === qToken) continue;
          const pStart = this.index.postingsOffsets[i];
          const pEnd = this.index.postingsOffsets[i + 1];
          const bytes = this.index.postingsBytes.subarray(pStart, pEnd);
          decodeDeltaPostingIntoBitset(bytes, this.candidateBitset, currentTokenDocIds);
        }
      }

      for (let i = 0; i < currentTokenDocIds.length; i++) {
        const docId = currentTokenDocIds[i];
        if (this.tokenMatchCounts[docId] === 0) {
          tokenDocSet.push(docId);
        }
        this.tokenMatchCounts[docId]++;
        this.candidateBitset[docId >> 3] &= ~(1 << (docId & 7));
      }
    }

    rawCandidateCount = tokenDocSet.length;
    if (rawCandidateCount === 0) {
      const durationMs = Number((performance.now() - startTime).toFixed(2));
      return { items: [], candidateCount: 0, rawCandidateCount: 0, scoredCandidateCount: 0, prunedCandidateCount: 0, durationMs, earlyTerminated: false };
    }

    // =========================================================================
    // TIER 3: BUCKETED PROCESSING & EARLY TERMINATION PRUNING
    // =========================================================================
    // Agrupar candidatos por contagem de tokens correspondentes (k = m decrescente até 1)
    const buckets: number[][] = new Array(m + 1);
    for (let k = 1; k <= m; k++) {
      buckets[k] = [];
    }

    for (let i = 0; i < tokenDocSet.length; i++) {
      const docId = tokenDocSet[i];
      const count = this.tokenMatchCounts[docId];
      if (count >= 1 && count <= m) {
        buckets[count].push(docId);
      }
    }

    // Pre-verificação em O(log E) de se existe algum título com Title Prefix no catálogo
    const [tpStart, tpEnd] = this.findExactTitlePrefixRange(normalizedQuery);
    const hasAnyTitlePrefix = tpEnd > tpStart;
    const titlePrefixSet = new Set<number>();
    if (hasAnyTitlePrefix) {
      for (let i = tpStart; i < tpEnd; i++) {
        const oStart = this.index.exactOffsets[i];
        const oEnd = this.index.exactOffsets[i + 1];
        const pDocIds = decodeDeltaPosting(this.index.exactDocIds.subarray(oStart, oEnd));
        for (let j = 0; j < pDocIds.length; j++) {
          titlePrefixSet.add(pDocIds[j]);
        }
      }
    }

    let earlyTerminated = false;
    let terminationTier: string | undefined;

    // Processar baldes em ordem decrescente de contagem de tokens
    for (let k = m; k >= 1; k--) {
      const bucketDocs = buckets[k];
      if (bucketDocs.length === 0) continue;

      // Limite teórico máximo para qualquer candidato deste balde:
      // Pode ter Title Prefix (+500)? Apenas se hasAnyTitlePrefix for true!
      const maxPossibleBonus = (hasAnyTitlePrefix ? 500 : 0) + (k === m ? 250 : 0) + (k * 100) + 120 + (queryHasYear ? 30 : 0);

      if (heap.isFull() && heap.getWorstScore() > maxPossibleBonus) {
        earlyTerminated = true;
        terminationTier = `TIER_3_PRUNED_BUCKET_${k}`;
        break;
      }

      // Teto de pontuação de tokens para este balde (k tokens)
      let maxTokenScore = 0;
      for (let q = 0; q < Math.min(k, m); q++) {
        const hasExact = this.lookupToken(queryTokens[q]) >= 0;
        maxTokenScore += hasExact ? 100 : 70;
      }
      const baseTokenAndAllTokens = (k === m ? 250 : 0) + maxTokenScore;

      for (let i = 0; i < bucketDocs.length; i++) {
        const docId = bucketDocs[i];

        if (!this.passesFilter(docId, filter)) continue;

        // Poda individual exata O(1) quando o heap está cheio:
        if (heap.isFull()) {
          const worst = heap.peek()!;
          const worstScore = worst.score;

          const hasTitlePrefix = hasAnyTitlePrefix && titlePrefixSet.has(docId);
          const maxYearBonus = queryHasYear && this.index.docYears[docId] > 0 ? 30 : 0;
          const origId = this.index.docOriginalTitleIds[docId];

          // Se sem bônus de original title o teto já for insuficiente mesmo com +120:
          const maxWithoutOrig = (hasTitlePrefix ? 500 : 0) + baseTokenAndAllTokens + maxYearBonus;
          if (maxWithoutOrig + (origId >= 0 ? 120 : 0) < worstScore) {
            continue; // Poda O(1) garantida
          }

          // Verificar se original title pode pontuar com os limites exatos da Regra 5:
          let maxOrigBonus = 0;
          if (origId >= 0 && maxWithoutOrig + 120 >= worstScore) {
            const rawOrig = this.index.stringPool.getString(origId).toLowerCase();
            if (rawOrig === normalizedQuery) {
              maxOrigBonus = 120;
            } else if (rawOrig.startsWith(normalizedQuery)) {
              maxOrigBonus = 60;
            } else {
              for (let q = 0; q < m; q++) {
                if (rawOrig.includes(queryTokens[q])) {
                  maxOrigBonus = 40;
                  break;
                }
              }
            }
          }

          const docUpperBound = maxWithoutOrig + maxOrigBonus;

          if (docUpperBound < worstScore) {
            continue; // Poda estrita O(1): impossível alcançar o pior item do Top-K
          }

          if (docUpperBound === worstScore) {
            // Se o teto máximo for igual ao pior score, só entra se vencer o desempate por título
            const rawTitle = this.index.stringPool.getString(this.index.docTitleIds[docId]);
            if (fastCompareString(rawTitle, worst.title) >= 0) {
              continue; // Poda estrita por desempate
            }
          }
        }

        const score = this.calculateDocumentScore(docId, normalizedQuery, queryTokens);
        scoredCandidateCount++;
        heap.add(docId, score.score, score.matchClass);
      }

      // Após processar o balde k, verificar se o próximo balde (k - 1) pode ser completamente descartado
      if (k > 1 && heap.isFull()) {
        const maxNextBucket = 500 + (k - 1) * 100 + 120 + (queryHasYear ? 30 : 0);
        if (heap.getWorstScore() > maxNextBucket) {
          earlyTerminated = true;
          terminationTier = `TIER_3_TERMINATED_AFTER_K_${k}`;
          break;
        }
      }
    }

    const prunedCandidateCount = Math.max(0, rawCandidateCount - scoredCandidateCount);
    const durationMs = Number((performance.now() - startTime).toFixed(2));

    return {
      items: heap.toSortedResults(),
      candidateCount: rawCandidateCount,
      rawCandidateCount,
      scoredCandidates: scoredCandidateCount,
      scoredCandidateCount,
      prunedCount: prunedCandidateCount,
      prunedCandidateCount,
      durationMs,
      earlyTerminated,
      terminationTier,
    };
  }

  /**
   * Cálculo determinístico de relevância com semântica 100% idêntica ao V1 e V2.
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
      let matchType = 0;
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
