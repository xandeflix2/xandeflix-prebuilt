import fs from 'node:fs';

console.log('Starting C11 Targeted Root Cause Patch...');

// =========================================================================
// 1. Storage Interface: SegmentedCatalogManifest classificationProfileVersion
// =========================================================================
{
  const p = 'src/bootstrap/storage/storage.interface.ts';
  let code = fs.readFileSync(p, 'utf8');
  if (!code.includes('classificationProfileVersion?: number;')) {
    code = code.replace(
      'isSegmented: boolean;',
      'isSegmented: boolean;\n  classificationProfileVersion?: number;'
    );
    fs.writeFileSync(p, code, 'utf8');
    console.log('Updated storage.interface.ts');
  }
}

// =========================================================================
// 2. Storage Implementations: CapacitorFilesystemStorage & InMemoryCatalogStorage
// =========================================================================
{
  const p = 'src/bootstrap/storage/capacitor-filesystem.storage.ts';
  let code = fs.readFileSync(p, 'utf8');
  if (!code.includes('resolveSegmentRelativePath')) {
    code = code.replace(
      import type { RecoveryJournalData } from '../../recovery/recovery.types.ts';,
      import type { RecoveryJournalData } from '../../recovery/recovery.types.ts';\nimport { resolveSegmentRelativePath } from './segment-path-resolver.ts';
    );
  }
  // writeStagingSegment
  code = code.replace(
    /const fullPath = \$\{STAGING_DIR\}\/\$\{snapshotId\}\/\$\{segmentPath\};/g,
    'const rel = resolveSegmentRelativePath(segmentPath);\n    const fullPath = ${STAGING_DIR}//;'
  );
  // readStagingSegment
  code = code.replace(
    /return this\.readTextFileSafely\(\$\{STAGING_DIR\}\/\$\{snapshotId\}\/\$\{segmentPath\}\);/g,
    'const rel = resolveSegmentRelativePath(segmentPath);\n    return this.readTextFileSafely(${STAGING_DIR}//);'
  );
  // readActiveSegment
  code = code.replace(
    /return this\.readTextFileSafely\(\$\{SNAPSHOTS_DIR\}\/\$\{pointer\.snapshotId\}\/\$\{segmentPath\}\);/g,
    'const rel = resolveSegmentRelativePath(segmentPath);\n    return this.readTextFileSafely(${SNAPSHOTS_DIR}//);'
  );
  fs.writeFileSync(p, code, 'utf8');
  console.log('Updated capacitor-filesystem.storage.ts');
}

{
  const p = 'src/bootstrap/storage/in-memory.storage.ts';
  let code = fs.readFileSync(p, 'utf8');
  if (!code.includes('resolveSegmentRelativePath')) {
    code = code.replace(
      import type { RecoveryJournalData } from '../../recovery/recovery.types.ts';,
      import type { RecoveryJournalData } from '../../recovery/recovery.types.ts';\nimport { resolveSegmentRelativePath } from './segment-path-resolver.ts';
    );
  }
  code = code.replace(
    /this\.stagingSegments\.set\(\$\{snapshotId\}\/\$\{segmentPath\}, data\);/g,
    'const rel = resolveSegmentRelativePath(segmentPath);\n    this.stagingSegments.set(${snapshotId}/, data);'
  );
  code = code.replace(
    /return this\.stagingSegments\.get\(\$\{snapshotId\}\/segments\/\$\{segmentPath\}\) \?\? null;/g,
    'const rel = resolveSegmentRelativePath(segmentPath);\n    return this.stagingSegments.get(${snapshotId}/) ?? null;'
  );
  code = code.replace(
    /return this\.snapshotSegments\.get\(\$\{this\.activePointer\.snapshotId\}\/segments\/\$\{segmentPath\}\) \?\? null;/g,
    'const rel = resolveSegmentRelativePath(segmentPath);\n    return this.snapshotSegments.get(${this.activePointer.snapshotId}/) ?? null;'
  );
  fs.writeFileSync(p, code, 'utf8');
  console.log('Updated in-memory.storage.ts');
}

// =========================================================================
// 3. DeferredSearchIndexCoordinator: isBuilding tracking & canonical segment path
// =========================================================================
{
  const p = 'src/search/deferred-search-index-coordinator.ts';
  let code = fs.readFileSync(p, 'utf8');
  if (!code.includes('resolveSegmentRelativePath')) {
    code = code.replace(
      import { bootTelemetry, yieldToEventLoop } from '../diagnostics/boot-telemetry.ts';,
      import { bootTelemetry, yieldToEventLoop } from '../diagnostics/boot-telemetry.ts';\nimport { resolveSegmentRelativePath, SEGMENT_PATH_ROOT_CAUSE_FIXED, CANONICAL_SEGMENT_PATH_RESOLVER } from '../bootstrap/storage/segment-path-resolver.ts';
    );
  }
  if (!code.includes('private static readonly currentlyBuilding')) {
    code = code.replace(
      'export class DeferredSearchIndexCoordinator {',
      'export class DeferredSearchIndexCoordinator {\n  private static readonly currentlyBuilding = new Set<string>();\n\n  public static isBuilding(snapshotId?: string): boolean {\n    return snapshotId ? DeferredSearchIndexCoordinator.currentlyBuilding.has(snapshotId) : DeferredSearchIndexCoordinator.currentlyBuilding.size > 0;\n  }\n'
    );
  }
  // Track building in buildAndPersistIndex
  if (!code.includes('DeferredSearchIndexCoordinator.currentlyBuilding.add(snapshotId);')) {
    code = code.replace(
      'async buildAndPersistIndex(\n    snapshotId: string,',
      'async buildAndPersistIndex(\n    snapshotId: string,'
    );
    code = code.replace(
      'bootTelemetry.mark(\'SEARCH_BUILD_STARTED\');',
      'DeferredSearchIndexCoordinator.currentlyBuilding.add(snapshotId);\n    bootTelemetry.mark(\'SEARCH_BUILD_STARTED\');'
    );
    // finally remove
    code = code.replace(
      'return { success: true, indexSerialized, indexSha256, durationMs };',
      'DeferredSearchIndexCoordinator.currentlyBuilding.delete(snapshotId);\n      return { success: true, indexSerialized, indexSha256, durationMs };'
    );
    code = code.replace(
      '} catch (err: unknown) {',
      '} catch (err: unknown) {\n      DeferredSearchIndexCoordinator.currentlyBuilding.delete(snapshotId);'
    );
  }
  // Use resolveSegmentRelativePath for segment reading
  code = code.replace(
    'const data = await (storage.readActiveSegment as (path: string) => Promise<string | null>)(seg.fileName);',
    'const segPath = resolveSegmentRelativePath(seg.fileName);\n          const data = await (storage.readActiveSegment as (path: string) => Promise<string | null>)(segPath);'
  );
  fs.writeFileSync(p, code, 'utf8');
  console.log('Updated deferred-search-index-coordinator.ts');
}

// =========================================================================
// 4. Search Service: SEARCH_PREPARING while building & UI state
// =========================================================================
{
  const p = 'src/search/search.service.ts';
  let code = fs.readFileSync(p, 'utf8');
  if (!code.includes('DeferredSearchIndexCoordinator')) {
    code = code.replace(
      import { SearchIndexValidator } from './search-index-validator.ts';,
      import { SearchIndexValidator } from './search-index-validator.ts';\nimport { DeferredSearchIndexCoordinator } from './deferred-search-index-coordinator.ts';
    );
  }
  // In initialize(), check if build is active
  if (!code.includes('DeferredSearchIndexCoordinator.isBuilding(')) {
    code = code.replace(
      'this.setStatus(\'SEARCH_INDEX_LOADING\', []);',
      'if (DeferredSearchIndexCoordinator.isBuilding(pointer.snapshotId)) {\n      this.setStatus(\'SEARCH_PREPARING\', []);\n      return this.currentStatus;\n    }\n    this.setStatus(\'SEARCH_INDEX_LOADING\', []);'
    );
    code = code.replace(
      'this.setStatus(\'SEARCH_INDEX_UNAVAILABLE\', []);\n      return this.currentStatus;',
      'if (DeferredSearchIndexCoordinator.isBuilding(pointer.snapshotId)) {\n        this.setStatus(\'SEARCH_PREPARING\', []);\n        return this.currentStatus;\n      }\n      this.setStatus(\'SEARCH_INDEX_UNAVAILABLE\', []);\n      return this.currentStatus;'
    );
  }
  fs.writeFileSync(p, code, 'utf8');
  console.log('Updated search.service.ts');
}

// =========================================================================
// 5. SearchState Component: Preparando busca... & Busca temporariamente indisponível
// =========================================================================
{
  const p = 'src/ui/components/SearchState.tsx';
  let code = fs.readFileSync(p, 'utf8');
  code = code.replace(
    '<p className=search-state-title>Preparando busca local...</p>\n          <p className=search-state-subtitle>O catálogo continua disponível enquanto o índice é criado.</p>',
    '<p className=search-state-title>Preparando busca...</p>\n          <p className=search-state-subtitle>Indexando catálogo local...</p>'
  );
  fs.writeFileSync(p, code, 'utf8');
  console.log('Updated SearchState.tsx');
}

// =========================================================================
// 6. Content Kind Classifier & Classification Profile Versioning
// =========================================================================
{
  const p = 'src/source/content-kind-classifier.ts';
  let code = fs.readFileSync(p, 'utf8');
  // Re-write classifyCanonicalSourceContent to handle channel groups and radios deterministically
  const fnRegex = /export function classifyCanonicalSourceContent\(\{[\s\S]*?return 'unresolved';\s*\}/;
  const newFn = export function classifyCanonicalSourceContent({
  title = '',
  groupName = '',
  streamUrl = '',
}: CanonicalSourceContentInput): CanonicalSourceContentKind {
  const cleanTitle = title.trim();
  const normalizedUrl = streamUrl.trim().toLowerCase();
  const urlPath = normalizedUrl.split(/[?#]/, 1)[0];
  const normGroup = (groupName || '').trim().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase();
  const groupFamily = normGroup.split('|', 1)[0].trim();

  if (!cleanTitle || containsRawM3uAttributes(cleanTitle)) return 'unresolved';

  // 1. Evidência estrutural forte de Movie: path /movie/ ou extensão típica VOD
  const hasStrongMoviePath = urlPath.includes('/movie/');
  const hasMovieExtension = urlPath.endsWith('.mp4') || urlPath.endsWith('.mkv');

  // 2. Evidência estrutural forte de Series: path /series/ ou SxxExx no título
  const hasEpisodeIdentity = Boolean(parseM3uEpisodeIdentity(cleanTitle));
  const hasSeriesPath = urlPath.includes('/series/');

  // 3. Evidência de Live / Canal
  const hasLivePath = urlPath.includes('/live/') || urlPath.endsWith('.m3u8');
  const isChannelGroup =
    groupFamily === 'CANAIS' ||
    groupFamily === 'CANAL' ||
    groupFamily.startsWith('CANAIS') ||
    groupFamily.startsWith('CANAL') ||
    groupFamily === 'TV' ||
    groupFamily === 'AO VIVO' ||
    groupFamily === 'AOVIVO' ||
    groupFamily === 'CHANNELS' ||
    groupFamily === 'LIVE';

  const isRadioGroup =
    groupFamily === 'RADIO' ||
    groupFamily === 'RADIOS' ||
    groupFamily.startsWith('RADIO') ||
    normGroup.includes('RADIO');

  // Precedência determinística:
  // A. Radios NUNCA podem ser movies. Classificar como live.
  if (isRadioGroup) {
    return 'live';
  }

  // B. Grupo explicitamente de CANAIS:
  // Não pode ser classificado como movie na ausência de forte evidência de movie (/movie/)
  if (isChannelGroup) {
    if (hasSeriesPath || (hasEpisodeIdentity && !hasLivePath)) {
      return 'series';
    }
    if (hasStrongMoviePath) {
      return 'movie';
    }
    // Na ausência de movie/series estrutural, é LIVE
    return 'live';
  }

  // C. Path /live/ ou .m3u8 (e não é série/movie com evidência forte contrária)
  if (hasLivePath && !hasStrongMoviePath && !hasSeriesPath) {
    return 'live';
  }

  // D. Series com identidade episódica ou path /series/
  if (hasSeriesPath || hasEpisodeIdentity) {
    return 'series';
  }

  // E. Movies
  if (hasStrongMoviePath || hasMovieExtension) {
    return 'movie';
  }

  // F. Grupos explícitos
  if (groupFamily === 'FILMES' || groupFamily === 'FILME' || groupFamily === 'MOVIES') {
    return 'movie';
  }
  if (groupFamily === 'SERIES' || groupFamily === 'SERIE') {
    return 'series';
  }

  return 'unresolved';
};
  code = code.replace(fnRegex, newFn);
  fs.writeFileSync(p, code, 'utf8');
  console.log('Updated content-kind-classifier.ts');
}

{
  const p = 'src/source/source-classification-profile.ts';
  let code = fs.readFileSync(p, 'utf8');
  if (!code.includes('CURRENT_CLASSIFICATION_PROFILE_VERSION')) {
    code = code.replace(
      'export const MANAGED_SOURCE_CLASSIFICATION_PROFILE_V1',
      'export const CURRENT_CLASSIFICATION_PROFILE_VERSION = 2;\nexport const MANAGED_SOURCE_CLASSIFICATION_PROFILE_V1'
    );
  }
  fs.writeFileSync(p, code, 'utf8');
  console.log('Updated source-classification-profile.ts');
}

// =========================================================================
// 7. Real Source Importer & Writer: classificationProfileVersion & No Unresolved -> Movie
// =========================================================================
{
  const p = 'src/source/real-source-importer.service.ts';
  let code = fs.readFileSync(p, 'utf8');

  // Fix classificationProfileVersion import
  if (!code.includes('CURRENT_CLASSIFICATION_PROFILE_VERSION')) {
    code = code.replace(
      'getManagedSourceClassificationProfile,',
      'getManagedSourceClassificationProfile,\n  CURRENT_CLASSIFICATION_PROFILE_VERSION,'
    );
  }

  // Fix classification fallthrough to movie
  code = code.replace(
    } else {\n        rawMovieCount++;\n        const cat = getOrCreateCategory(groupTitle);,
    } else if (classification.canonicalKind === 'movie') {\n        rawMovieCount++;\n        const cat = getOrCreateCategory(groupTitle);
  );

  fs.writeFileSync(p, code, 'utf8');
  console.log('Updated real-source-importer.service.ts');
}

{
  const p = 'src/source/m3u-bounded-staging-writer.ts';
  let code = fs.readFileSync(p, 'utf8');
  if (!code.includes('CURRENT_CLASSIFICATION_PROFILE_VERSION')) {
    code = code.replace(
      import { calculateSha256 } from '../provisioning/integrity.ts';,
      import { calculateSha256 } from '../provisioning/integrity.ts';\nimport { CURRENT_CLASSIFICATION_PROFILE_VERSION } from './source-classification-profile.ts';\nimport { resolveSegmentRelativePath } from '../bootstrap/storage/segment-path-resolver.ts';
    );
  }
  // Add classificationProfileVersion to manifest in finalizeStaging
  if (!code.includes('classificationProfileVersion: CURRENT_CLASSIFICATION_PROFILE_VERSION')) {
    code = code.replace(
      'schemaVersion: 1,\n      snapshotId: this.snapshotId,',
      'schemaVersion: 1,\n      classificationProfileVersion: CURRENT_CLASSIFICATION_PROFILE_VERSION,\n      snapshotId: this.snapshotId,'
    );
  }
  fs.writeFileSync(p, code, 'utf8');
  console.log('Updated m3u-bounded-staging-writer.ts');
}

// =========================================================================
// 8. BootSyncCoordinator: Idempotency check checks classificationProfileVersion
// =========================================================================
{
  const p = 'src/bootstrap/boot-sync-coordinator.ts';
  let code = fs.readFileSync(p, 'utf8');
  if (!code.includes('CURRENT_CLASSIFICATION_PROFILE_VERSION')) {
    code = code.replace(
      import { DeferredSearchIndexCoordinator } from '../search/deferred-search-index-coordinator.ts';,
      import { DeferredSearchIndexCoordinator } from '../search/deferred-search-index-coordinator.ts';\nimport { CURRENT_CLASSIFICATION_PROFILE_VERSION } from '../source/source-classification-profile.ts';
    );
  }
  // Update idempotency check to verify classificationProfileVersion
  if (!code.includes('activeProfileVersion < CURRENT_CLASSIFICATION_PROFILE_VERSION')) {
    const targetCheck =     // 3. Checagem de Idempotência\n    if (\n      existingRealPointer?.kind === 'REAL' &&\n      existingRealPointer.sourceId === expectedSourceId &&\n      existingRealPointer.sourceVersion === expectedSourceVersion\n    ) {;
    const replacementCheck =     // 3. Checagem de Idempotência\n    const activeManifest = await this.storage.readActiveManifest();\n    const activeProfileVersion = (activeManifest as any)?.classificationProfileVersion ?? (activeManifest as any)?.metadata?.classificationProfileVersion ?? 0;\n    const needsProfileRebuild = activeProfileVersion < CURRENT_CLASSIFICATION_PROFILE_VERSION;\n\n    if (\n      existingRealPointer?.kind === 'REAL' &&\n      existingRealPointer.sourceId === expectedSourceId &&\n      existingRealPointer.sourceVersion === expectedSourceVersion &&\n      !needsProfileRebuild\n    ) {;
    code = code.replace(targetCheck, replacementCheck);
    fs.writeFileSync(p, code, 'utf8');
    console.log('Updated boot-sync-coordinator.ts');
  }
}

// =========================================================================
// 9. CatalogReadModel & useActiveCatalog: Lazy Segmented Episode Hydration
// =========================================================================
{
  const p = 'src/catalog/catalog-read-model.ts';
  let code = fs.readFileSync(p, 'utf8');
  if (!code.includes('episodeResolver?:')) {
    code = code.replace(
      '/** Resolve uma StreamRef ausente no first-fold lendo um segmento por vez. */\n  streamRefResolver?: (streamId: string) => Promise<StreamRef | undefined>;',
      '/** Resolve uma StreamRef ausente no first-fold lendo um segmento por vez. */\n  streamRefResolver?: (streamId: string) => Promise<StreamRef | undefined>;\n  /** Carrega episódios de uma série sob demanda dos segmentos (bounded). */\n  episodeResolver?: (seriesId: string) => Promise<Episode[]>;\n  /** Carrega temporadas de uma série sob demanda dos segmentos (bounded). */\n  seasonResolver?: (seriesId: string) => Promise<Season[]>;'
    );
  }
  if (!code.includes('private readonly episodesLoadedForSeries')) {
    code = code.replace(
      'private readonly streamRefResolver?: (streamId: string) => Promise<StreamRef | undefined>;',
      'private readonly streamRefResolver?: (streamId: string) => Promise<StreamRef | undefined>;\n  private readonly episodeResolver?: (seriesId: string) => Promise<Episode[]>;\n  private readonly seasonResolver?: (seriesId: string) => Promise<Season[]>;\n  private readonly episodesLoadedForSeries = new Set<string>();'
    );
    code = code.replace(
      'this.streamRefResolver = options.streamRefResolver;',
      'this.streamRefResolver = options.streamRefResolver;\n    this.episodeResolver = options.episodeResolver;\n    this.seasonResolver = options.seasonResolver;'
    );
  }
  if (!code.includes('async loadEpisodesForSeries')) {
    const loadMethod = 
  async loadEpisodesForSeries(seriesId: string): Promise<Episode[]> {
    if (this.episodesLoadedForSeries.has(seriesId)) {
      return this.getEpisodesForSeries(seriesId);
    }

    if (this.seasonResolver) {
      try {
        const seasons = await this.seasonResolver(seriesId);
        for (const s of seasons) {
          if (!this.seasonsById.has(s.id)) {
            this.seasonsById.set(s.id, s);
            let list = this.seasonsBySeriesId.get(s.seriesId);
            if (!list) {
              list = [];
              this.seasonsBySeriesId.set(s.seriesId, list);
            }
            if (!list.some(existing => existing.id === s.id)) {
              list.push(s);
            }
          }
        }
      } catch {}
    }

    if (this.episodeResolver) {
      try {
        const episodes = await this.episodeResolver(seriesId);
        for (const ep of episodes) {
          this.episodesById.set(ep.id, ep);
          let list = this.episodesBySeasonId.get(ep.seasonId);
          if (!list) {
            list = [];
            this.episodesBySeasonId.set(ep.seasonId, list);
          }
          if (!list.some(existing => existing.id === ep.id)) {
            list.push(ep);
          }
        }
        for (const list of this.episodesBySeasonId.values()) {
          list.sort((a, b) => a.episodeNumber - b.episodeNumber);
        }
      } catch {}
    }

    this.episodesLoadedForSeries.add(seriesId);
    return this.getEpisodesForSeries(seriesId);
  }

  getEpisodesForSeries(seriesId: string): Episode[] {
    const seasons = this.seasonsBySeriesId.get(seriesId) || [];
    const result: Episode[] = [];
    for (const s of seasons) {
      const eps = this.episodesBySeasonId.get(s.id) || [];
      result.push(...eps);
    }
    return result;
  }
;
    code = code.replace(
      'async getStreamRefAsync(id: string): Promise<StreamRef | undefined> {',
      loadMethod + '\n  async getStreamRefAsync(id: string): Promise<StreamRef | undefined> {'
    );
    fs.writeFileSync(p, code, 'utf8');
    console.log('Updated catalog-read-model.ts');
  }
}

// =========================================================================
// 10. useActiveCatalog: Resolvers for StreamRef and Episodes with Canonical Path
// =========================================================================
{
  const p = 'src/ui/hooks/useActiveCatalog.ts';
  let code = fs.readFileSync(p, 'utf8');
  if (!code.includes('resolveSegmentRelativePath')) {
    code = code.replace(
      import type { StreamRef } from '../../contracts/catalog.ts';,
      import type { StreamRef, Episode, Season } from '../../contracts/catalog.ts';\nimport { resolveSegmentRelativePath } from '../../bootstrap/storage/segment-path-resolver.ts';
    );
  }
  // In createSegmentedStreamResolver: use resolveSegmentRelativePath
  code = code.replace(
    'const raw = await readSegment.call(service.getStorage(), segmentPath);',
    'const raw = await readSegment.call(service.getStorage(), resolveSegmentRelativePath(segmentPath));'
  );

  // Add createSegmentedEpisodeResolver and createSegmentedSeasonResolver
  if (!code.includes('createSegmentedEpisodeResolver')) {
    const episodeResolvers = 
function createSegmentedEpisodeResolver(service: BootstrapService): (seriesId: string) => Promise<Episode[]> {
  return async (seriesId: string): Promise<Episode[]> => {
    const storage = service.getStorage();
    const readSegment = storage.readActiveSegment;
    if (!readSegment || !seriesId) return [];

    const manifest = await storage.readActiveManifest();
    const segments = (manifest as any)?.segments;
    if (!Array.isArray(segments)) return [];

    const episodeSegments = segments.filter((s) => s.kind === 'episodes');
    const matched: Episode[] = [];

    for (const seg of episodeSegments) {
      const segPath = resolveSegmentRelativePath(seg.fileName);
      const raw = await readSegment.call(storage, segPath);
      if (!raw) continue;
      try {
        const records = JSON.parse(raw) as Episode[];
        if (!Array.isArray(records)) continue;
        for (const ep of records) {
          if (ep && ep.seriesId === seriesId) {
            matched.push(ep);
          }
        }
      } catch {}
    }
    return matched;
  };
}

function createSegmentedSeasonResolver(service: BootstrapService): (seriesId: string) => Promise<Season[]> {
  return async (seriesId: string): Promise<Season[]> => {
    const storage = service.getStorage();
    const readSegment = storage.readActiveSegment;
    if (!readSegment || !seriesId) return [];

    const manifest = await storage.readActiveManifest();
    const segments = (manifest as any)?.segments;
    if (!Array.isArray(segments)) return [];

    const seasonSegments = segments.filter((s) => s.kind === 'seasons');
    const matched: Season[] = [];

    for (const seg of seasonSegments) {
      const segPath = resolveSegmentRelativePath(seg.fileName);
      const raw = await readSegment.call(storage, segPath);
      if (!raw) continue;
      try {
        const records = JSON.parse(raw) as Season[];
        if (!Array.isArray(records)) continue;
        for (const sea of records) {
          if (sea && sea.seriesId === seriesId) {
            matched.push(sea);
          }
        }
      } catch {}
    }
    return matched;
  };
}
;
    code = code.replace(
      'export interface UseActiveCatalogReturn {',
      episodeResolvers + '\nexport interface UseActiveCatalogReturn {'
    );
    code = code.replace(
      'const streamRefResolver = useMemo(() => createSegmentedStreamResolver(service), [service]);',
      'const streamRefResolver = useMemo(() => createSegmentedStreamResolver(service), [service]);\n  const episodeResolver = useMemo(() => createSegmentedEpisodeResolver(service), [service]);\n  const seasonResolver = useMemo(() => createSegmentedSeasonResolver(service), [service]);'
    );
    code = code.replace(
      'return new CatalogReadModel(activeCatalog, { streamRefResolver });',
      'return new CatalogReadModel(activeCatalog, { streamRefResolver, episodeResolver, seasonResolver });'
    );
    fs.writeFileSync(p, code, 'utf8');
    console.log('Updated useActiveCatalog.ts');
  }
}

// =========================================================================
// 11. SeriesDetailPage: Segment-Aware Episode Hydration
// =========================================================================
{
  const p = 'src/ui/pages/SeriesDetailPage.tsx';
  let code = fs.readFileSync(p, 'utf8');
  if (!code.includes('loadEpisodesForSeries')) {
    code = code.replace(
      import React, { useState, useCallback } from 'react';,
      import React, { useState, useCallback, useEffect } from 'react';
    );
    code = code.replace(
      'const [episodeStatusNotice, setEpisodeStatusNotice] = useState<string | null>(null);',
      const [episodeStatusNotice, setEpisodeStatusNotice] = useState<string | null>(null);
  const [episodesLoading, setEpisodesLoading] = useState<boolean>(false);
  const [, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    if (typeof (readModel as any).loadEpisodesForSeries === 'function') {
      setEpisodesLoading(true);
      (readModel as any).loadEpisodesForSeries(seriesId)
        .then(() => {
          if (isMounted) {
            setEpisodesLoading(false);
            setRefreshKey((k) => k + 1);
          }
        })
        .catch(() => {
          if (isMounted) setEpisodesLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [seriesId, readModel]);
    );

    code = code.replace(
      '{currentSeason.episodes.length === 0 ? (',
      {episodesLoading && currentSeason.episodes.length === 0 ? (
                <p className=loading-episodes>Carregando episódios da temporada...</p>
              ) : currentSeason.episodes.length === 0 ? (
    );
    fs.writeFileSync(p, code, 'utf8');
    console.log('Updated SeriesDetailPage.tsx');
  }
}

// =========================================================================
// 12. PlaybackService: Fallback hydration in playEpisode
// =========================================================================
{
  const p = 'src/playback/playback.service.ts';
  let code = fs.readFileSync(p, 'utf8');
  if (!code.includes('let episode = readModel.episodesById.get(episodeId);')) {
    code = code.replace(
      'const episode = readModel.episodesById.get(episodeId);\n\n      if (!episode) {',
      let episode = readModel.episodesById.get(episodeId);
      if (!episode && typeof (readModel as any).loadEpisodesForSeries === 'function') {
        await (readModel as any).loadEpisodesForSeries(seriesId);
        episode = readModel.episodesById.get(episodeId);
      }

      if (!episode) {
    );
    fs.writeFileSync(p, code, 'utf8');
    console.log('Updated playback.service.ts');
  }
}

console.log('All code patches applied successfully.');
