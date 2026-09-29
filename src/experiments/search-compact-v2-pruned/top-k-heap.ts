/**
 * Xandeflix Prebuilt — Bounded Min-Heap for Top-K Early Pruning (Experiment R5)
 *
 * Estrutura de dados com capacidade fixa K=50.
 * A raiz (índice 0) é sempre o PIOR candidato presente no top-K.
 * O desempate segue rigorosamente a mesma semântica determinística do V1 e V2:
 * 1. Score decrescente (maior score é melhor)
 * 2. Title crescente (localeCompare menor é melhor)
 * 3. CanonicalId crescente (localeCompare menor é melhor)
 */

import { type SearchMatchClass } from '../../search/search-index.types.ts';
import { type CompactSearchResultItemV2, type CompactSearchIndexV2 } from '../search-compact-v2/compact-search-v2.types.ts';

export function fastCompareString(a: string, b: string): number {
  if (a === b) return 0;
  const minLen = Math.min(a.length, b.length);
  let i = 0;
  while (i < minLen && a.charCodeAt(i) === b.charCodeAt(i)) {
    i++;
  }
  if (i < minLen) {
    const codeA = a.charCodeAt(i);
    const codeB = b.charCodeAt(i);
    const isAlnumA = (codeA >= 48 && codeA <= 57) || (codeA >= 65 && codeA <= 90) || (codeA >= 97 && codeA <= 122);
    const isAlnumB = (codeB >= 48 && codeB <= 57) || (codeB >= 65 && codeB <= 90) || (codeB >= 97 && codeB <= 122);
    if (isAlnumA && isAlnumB && ((codeA <= 57 && codeB <= 57) || (codeA >= 65 && codeB >= 65))) {
      return codeA - codeB;
    }
  }
  return a.localeCompare(b);
}

export interface HeapCandidate {
  docId: number;
  score: number;
  matchClass: SearchMatchClass;
  title: string;
  canonicalId: string;
}

export class TopKMinHeap {
  private capacity: number;
  private heap: HeapCandidate[] = [];
  private index: CompactSearchIndexV2;

  constructor(capacity: number, index: CompactSearchIndexV2) {
    this.capacity = capacity;
    this.index = index;
  }

  get size(): number {
    return this.heap.length;
  }

  isFull(): boolean {
    return this.heap.length >= this.capacity;
  }

  peek(): HeapCandidate | undefined {
    return this.heap[0];
  }

  getWorstScore(): number {
    return this.heap.length > 0 ? this.heap[0].score : -Infinity;
  }

  /**
   * Retorna true se 'a' é PIOR que 'b' (ou seja, 'a' deve ficar mais perto da raiz do min-heap).
   */
  private isWorse(a: HeapCandidate, b: HeapCandidate): boolean {
    if (a.score !== b.score) {
      return a.score < b.score;
    }
    const titleComp = fastCompareString(a.title, b.title);
    if (titleComp !== 0) {
      return titleComp > 0;
    }
    return fastCompareString(a.canonicalId, b.canonicalId) > 0;
  }

  /**
   * Retorna true se 'a' é MELHOR que 'b'.
   */
  private isBetter(a: HeapCandidate, b: HeapCandidate): boolean {
    if (a.score !== b.score) {
      return a.score > b.score;
    }
    const titleComp = fastCompareString(a.title, b.title);
    if (titleComp !== 0) {
      return titleComp < 0;
    }
    return fastCompareString(a.canonicalId, b.canonicalId) < 0;
  }

  /**
   * Tenta adicionar um candidato ao heap.
   * Se o heap estiver cheio e o candidato não superar o pior elemento, rejeita em O(1).
   */
  add(docId: number, score: number, matchClass: SearchMatchClass): boolean {
    if (this.heap.length < this.capacity) {
      const title = this.index.stringPool.getString(this.index.docTitleIds[docId]);
      const canonicalId = this.index.stringPool.getString(this.index.docCanonicalIdIds[docId]);
      const item: HeapCandidate = { docId, score, matchClass, title, canonicalId };
      this.heap.push(item);
      this.siftUp(this.heap.length - 1);
      return true;
    }

    const root = this.heap[0];
    if (score < root.score) {
      return false; // Rejeição O(1)
    }

    const title = this.index.stringPool.getString(this.index.docTitleIds[docId]);
    const canonicalId = this.index.stringPool.getString(this.index.docCanonicalIdIds[docId]);
    const item: HeapCandidate = { docId, score, matchClass, title, canonicalId };

    if (!this.isBetter(item, root)) {
      return false;
    }

    this.heap[0] = item;
    this.siftDown(0);
    return true;
  }

  private siftUp(index: number): void {
    let current = index;
    while (current > 0) {
      const parent = (current - 1) >>> 1;
      // No min-heap, se o pai for "melhor" que o filho atual, o filho atual (que é pior) sobe
      if (this.isWorse(this.heap[current], this.heap[parent])) {
        const tmp = this.heap[current];
        this.heap[current] = this.heap[parent];
        this.heap[parent] = tmp;
        current = parent;
      } else {
        break;
      }
    }
  }

  private siftDown(index: number): void {
    let current = index;
    const length = this.heap.length;

    while (true) {
      let worst = current;
      const left = (current << 1) + 1;
      const right = left + 1;

      if (left < length && this.isWorse(this.heap[left], this.heap[worst])) {
        worst = left;
      }
      if (right < length && this.isWorse(this.heap[right], this.heap[worst])) {
        worst = right;
      }

      if (worst !== current) {
        const tmp = this.heap[current];
        this.heap[current] = this.heap[worst];
        this.heap[worst] = tmp;
        current = worst;
      } else {
        break;
      }
    }
  }

  toSortedResults(): CompactSearchResultItemV2[] {
    // Ordena os elementos do melhor para o pior
    const sorted = [...this.heap].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const titleComp = fastCompareString(a.title, b.title);
      if (titleComp !== 0) {
        return titleComp;
      }
      return fastCompareString(a.canonicalId, b.canonicalId);
    });

    return sorted.map((item) => {
      const docId = item.docId;
      const origId = this.index.docOriginalTitleIds[docId];
      const originalTitle = origId >= 0 ? this.index.stringPool.getString(origId) : undefined;
      const year = this.index.docYears[docId] || undefined;
      const k = this.index.docKinds[docId];
      const kind = k === 0 ? 'movie' : k === 1 ? 'series' : 'live';

      return {
        id: item.canonicalId,
        kind,
        title: item.title,
        originalTitle,
        year,
        score: item.score,
        matchClass: item.matchClass,
      };
    });
  }
}
