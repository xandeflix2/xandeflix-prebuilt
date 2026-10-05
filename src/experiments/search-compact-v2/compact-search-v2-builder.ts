/**
 * Xandeflix Prebuilt — Compact Search Index V2 Builder (Experiment R3)
 *
 * Constrói o índice COMPACT_SEARCH_INDEX_V2 com:
 * 1. String Pooling para deduplicação de canonicalId, title e originalTitle
 * 2. Document Table em formato binário colunar
 * 3. Delta Encoding + Varint para Postings
 * 4. Exact Title Index com Delta Encoding
 * 5. Determinismo estrito em todas as etapas
 * 6. Suporte a construção incremental verdadeiramente bounded (Blocker A fix)
 */

import type { PrebuiltCatalog, Genre, Category } from '../../contracts/catalog.ts';
import {
  normalizeSearchText,
  extractUniqueTokens,
} from '../../search/search-normalization.ts';
import {
  COMPACT_SEARCH_INDEX_V2_VERSION,
  type CompactSearchIndexV2,
  type CompactSearchIndexV2Metadata,
} from './compact-search-v2.types.ts';
import { StringPoolBuilder, StringPool } from './string-pool.ts';
import { encodeDeltaPosting } from './codec.ts';
import { serializeCompactIndexV2 } from './compact-search-v2-serializer.ts';
import { hashBytesPure } from '../../security/artifact-hash.ts';

import type { LiveCatalog } from '../../catalog/live/live-tv.types.ts';

export interface BuildCompactSearchIndexV2Options {
  generator?: string;
  deterministicGeneratedAt?: string;
  liveCatalog?: LiveCatalog;
}

export interface IncrementalCompactSearchIndexOptions {
  generator?: string;
  deterministicGeneratedAt?: string;
  liveCatalog?: LiveCatalog;
  catalogHeader: PrebuiltCatalog;
}

export function calculateCompactIndexV2ContentHash(buffer: Buffer | Uint8Array): string {
  return hashBytesPure(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer));
}

type CompactDocItem = {
  canonicalId: string;
  kind: 'movie' | 'series' | 'live';
  title: string;
  originalTitle?: string;
  year?: number;
  readonly genreIds: readonly string[];
  readonly categoryIds: readonly string[];
};

export class IncrementalCompactSearchIndexV2Builder {
  private readonly catalogHeader: PrebuiltCatalog;
  private readonly options?: IncrementalCompactSearchIndexOptions;
  private readonly genreMap = new Map<string, Genre>();
  private readonly categoryMap = new Map<string, Category>();
  private readonly compactDocs: CompactDocItem[] = [];
  private readonly seenCanonicalIds = new Set<string>();
  private static readonly emptyIds: readonly string[] = [];

  constructor(options: IncrementalCompactSearchIndexOptions) {
    this.catalogHeader = options.catalogHeader;
    this.options = options;

    for (const g of options.catalogHeader.genres || []) {
      this.genreMap.set(g.id, g);
    }
    for (const c of options.catalogHeader.categories || []) {
      this.categoryMap.set(c.id, c);
    }
    if (options.liveCatalog?.groups) {
      for (const lg of options.liveCatalog.groups) {
        this.categoryMap.set(lg.id, {
          id: lg.id,
          name: lg.name,
          contentKinds: [],
        });
      }
    }
    if (options.liveCatalog?.channels) {
      for (const ch of options.liveCatalog.channels) {
        if (!this.seenCanonicalIds.has(ch.id)) {
          this.seenCanonicalIds.add(ch.id);
          this.compactDocs.push({
            canonicalId: ch.id,
            kind: 'live',
            title: ch.name,
            genreIds: IncrementalCompactSearchIndexV2Builder.emptyIds,
            categoryIds: ch.groupId ? [ch.groupId] : IncrementalCompactSearchIndexV2Builder.emptyIds,
          });
        }
      }
    }
  }

  ingestMovies(movies: Array<{ id: string; title: string; originalTitle?: string; year?: number; genreIds?: readonly string[]; categoryIds?: readonly string[] }>): void {
    for (let i = 0; i < movies.length; i++) {
      const m = movies[i];
      if (this.seenCanonicalIds.has(m.id)) continue;
      this.seenCanonicalIds.add(m.id);

      this.compactDocs.push({
        canonicalId: m.id,
        kind: 'movie',
        title: m.title,
        originalTitle: m.originalTitle && m.originalTitle.trim().length > 0 ? m.originalTitle.trim() : undefined,
        year: typeof m.year === 'number' && !isNaN(m.year) ? m.year : undefined,
        genreIds: m.genreIds || IncrementalCompactSearchIndexV2Builder.emptyIds,
        categoryIds: m.categoryIds || IncrementalCompactSearchIndexV2Builder.emptyIds,
      });
    }
  }

  ingestLive(channels: Array<{ id: string; name: string; groupId?: string }>): void {
    for (let i = 0; i < channels.length; i++) {
      const ch = channels[i];
      if (this.seenCanonicalIds.has(ch.id)) continue;
      this.seenCanonicalIds.add(ch.id);

      this.compactDocs.push({
        canonicalId: ch.id,
        kind: 'live',
        title: ch.name,
        genreIds: IncrementalCompactSearchIndexV2Builder.emptyIds,
        categoryIds: ch.groupId ? [ch.groupId] : IncrementalCompactSearchIndexV2Builder.emptyIds,
      });
    }
  }

  ingestSeries(series: Array<{ id: string; title: string; originalTitle?: string; year?: number; genreIds?: readonly string[]; categoryIds?: readonly string[] }>): void {
    for (let i = 0; i < series.length; i++) {
      const s = series[i];
      if (this.seenCanonicalIds.has(s.id)) continue;
      this.seenCanonicalIds.add(s.id);

      this.compactDocs.push({
        canonicalId: s.id,
        kind: 'series',
        title: s.title,
        originalTitle: s.originalTitle && s.originalTitle.trim().length > 0 ? s.originalTitle.trim() : undefined,
        year: typeof s.year === 'number' && !isNaN(s.year) ? s.year : undefined,
        genreIds: s.genreIds || IncrementalCompactSearchIndexV2Builder.emptyIds,
        categoryIds: s.categoryIds || IncrementalCompactSearchIndexV2Builder.emptyIds,
      });
    }
  }

  build(): CompactSearchIndexV2 {
    // 1. Ordenação determinística de documentos por canonicalId
    this.compactDocs.sort((a, b) => (a.canonicalId < b.canonicalId ? -1 : a.canonicalId > b.canonicalId ? 1 : 0));
    const docCount = this.compactDocs.length;

    // 2. Construção do String Pool e Document Table colunar
    const spBuilder = new StringPoolBuilder();

    const docKinds = new Uint8Array(docCount);
    const docYears = new Uint16Array(docCount);
    const docCanonicalIdIds = new Uint32Array(docCount);
    const docTitleIds = new Uint32Array(docCount);
    const docOriginalTitleIds = new Int32Array(docCount);

    for (let docId = 0; docId < docCount; docId++) {
      const r = this.compactDocs[docId];
      docKinds[docId] = r.kind === 'movie' ? 0 : r.kind === 'series' ? 1 : 2;
      docYears[docId] = r.year ?? 0;
      docCanonicalIdIds[docId] = spBuilder.add(r.canonicalId);
      docTitleIds[docId] = spBuilder.add(r.title);
      docOriginalTitleIds[docId] = r.originalTitle ? spBuilder.add(r.originalTitle) : -1;
    }

    const builtPool = spBuilder.build();
    const stringPool = new StringPool(builtPool.offsets, builtPool.data, builtPool.count, builtPool.strings);

    // 3. Construção do Índice Dedicado de Título Exato com Delta Encoding
    const exactMap = new Map<string, number[]>();

    for (let docId = 0; docId < docCount; docId++) {
      const r = this.compactDocs[docId];
      const normTitle = normalizeSearchText(r.title);
      if (normTitle) {
        let list = exactMap.get(normTitle);
        if (!list) {
          list = [];
          exactMap.set(normTitle, list);
        }
        list.push(docId);
      }

      if (r.originalTitle) {
        const normOriginal = normalizeSearchText(r.originalTitle);
        if (normOriginal && normOriginal !== normTitle) {
          let list = exactMap.get(normOriginal);
          if (!list) {
            list = [];
            exactMap.set(normOriginal, list);
          }
          list.push(docId);
        }
      }
    }

    const sortedExactTitles = Array.from(exactMap.keys()).sort();
    const exactTitleCount = sortedExactTitles.length;
    const exactOffsets = new Uint32Array(exactTitleCount + 1);
    const encodedExactDocIdBuffers: Uint8Array[] = new Array(exactTitleCount);

    let totalExactBytes = 0;
    for (let i = 0; i < exactTitleCount; i++) {
      const title = sortedExactTitles[i];
      const list = exactMap.get(title)!;
      const uniqueSorted = Array.from(new Set(list)).sort((a, b) => a - b);
      const encoded = encodeDeltaPosting(uniqueSorted);
      encodedExactDocIdBuffers[i] = encoded;
      exactOffsets[i] = totalExactBytes;
      totalExactBytes += encoded.length;
    }
    exactOffsets[exactTitleCount] = totalExactBytes;

    const exactDocIds = new Uint8Array(totalExactBytes);
    for (let i = 0; i < exactTitleCount; i++) {
      exactDocIds.set(encodedExactDocIdBuffers[i], exactOffsets[i]);
    }

    // 4. Construção do Índice Invertido (Tokens + Postings com Delta + Varint)
    const tokenToDocsMap = new Map<string, number[]>();

    for (let docId = 0; docId < docCount; docId++) {
      const r = this.compactDocs[docId];
      const textFields: string[] = [r.title];
      if (r.originalTitle) {
        textFields.push(r.originalTitle);
      }
      if (r.year) {
        textFields.push(String(r.year));
      }
      for (const gId of r.genreIds) {
        const genre = this.genreMap.get(gId);
        if (genre?.name) {
          textFields.push(genre.name);
        }
      }
      for (const cId of r.categoryIds) {
        const category = this.categoryMap.get(cId);
        if (category?.name) {
          textFields.push(category.name);
        }
      }

      const docTokens = extractUniqueTokens(...textFields);
      for (const token of docTokens) {
        let list = tokenToDocsMap.get(token);
        if (!list) {
          list = [];
          tokenToDocsMap.set(token, list);
        }
        list.push(docId);
      }
    }

    const sortedTokens = Array.from(tokenToDocsMap.keys()).sort();
    const tokenCount = sortedTokens.length;
    const postingsOffsets = new Uint32Array(tokenCount + 1);
    const encodedPostingsBuffers: Uint8Array[] = new Array(tokenCount);

    let totalRawPostingsCount = 0;
    let totalPostingsBytes = 0;

    for (let i = 0; i < tokenCount; i++) {
      const token = sortedTokens[i];
      const list = tokenToDocsMap.get(token)!;
      const uniqueSorted = Array.from(new Set(list)).sort((a, b) => a - b);
      totalRawPostingsCount += uniqueSorted.length;

      const encoded = encodeDeltaPosting(uniqueSorted);
      encodedPostingsBuffers[i] = encoded;
      postingsOffsets[i] = totalPostingsBytes;
      totalPostingsBytes += encoded.length;
    }
    postingsOffsets[tokenCount] = totalPostingsBytes;

    const postingsBytes = new Uint8Array(totalPostingsBytes);
    for (let i = 0; i < tokenCount; i++) {
      postingsBytes.set(encodedPostingsBuffers[i], postingsOffsets[i]);
    }

    const generatedAt = this.options?.deterministicGeneratedAt || new Date().toISOString();
    const generator = this.options?.generator || 'xandeflix-prebuilt-compact-search-builder-v2/1.0';

    const metadata: CompactSearchIndexV2Metadata = {
      format: 'COMPACT_SEARCH_INDEX_V2',
      version: COMPACT_SEARCH_INDEX_V2_VERSION,
      schemaVersion: 1,
      normalizationVersion: 1,
      generator,
      catalogSnapshotId: this.catalogHeader.metadata.snapshotId,
      catalogVersion: this.catalogHeader.metadata.catalogVersion,
      documentCount: docCount,
      tokenCount,
      exactTitleCount,
      stringPoolCount: builtPool.count,
      totalPostingsCount: totalRawPostingsCount,
      totalPostingsBytes,
      generatedAt,
      contentHash: '',
    };

    const interimIndex: CompactSearchIndexV2 = {
      metadata,
      stringPool,
      docKinds,
      docYears,
      docCanonicalIdIds,
      docTitleIds,
      docOriginalTitleIds,
      exactTitles: sortedExactTitles,
      exactOffsets,
      exactDocIds,
      tokens: sortedTokens,
      postingsOffsets,
      postingsBytes,
    };

    // Calcular hash sobre o binário canônico serializado
    const { buffer } = serializeCompactIndexV2(interimIndex);
    const contentHash = calculateCompactIndexV2ContentHash(buffer);
    interimIndex.metadata.contentHash = contentHash;

    return interimIndex;
  }
}

export class CompactSearchIndexV2Builder {
  build(
    catalog: PrebuiltCatalog,
    options?: BuildCompactSearchIndexV2Options
  ): CompactSearchIndexV2 {
    const incremental = new IncrementalCompactSearchIndexV2Builder({
      catalogHeader: catalog,
      generator: options?.generator,
      deterministicGeneratedAt: options?.deterministicGeneratedAt,
      liveCatalog: options?.liveCatalog,
    });
    if (catalog.movies) incremental.ingestMovies(catalog.movies);
    if (catalog.series) incremental.ingestSeries(catalog.series);
    return incremental.build();
  }
}
