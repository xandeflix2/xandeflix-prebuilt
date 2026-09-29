/**
 * Xandeflix Prebuilt — useActiveCatalog Hook (Gate G6)
 *
 * Hook de conexão entre a camada de apresentação e o BootstrapService.
 *
 * Princípios:
 * - NO FALSE EMPTY: Distinção estrita entre NO_ACTIVE_CATALOG e VALID_EMPTY_CATALOG.
 * - FAIL-CLOSED PRESERVATION: Se a importação falhar mas houver ativo anterior,
 *   a UI preserva e renderiza o catálogo ativo anterior (last-known-good).
 * - ZERO NETWORK: Somente lê dados locais do storage privado.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { PrebuiltCatalog } from '../../contracts/catalog.ts';
import type { BootstrapStatus, BootstrapSummary } from '../../bootstrap/types.ts';
import { BootstrapService } from '../../bootstrap/bootstrap.service.ts';
import { getClientBootstrapService } from '../../bootstrap/client.ts';
import { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { StreamRef, Episode, Season } from '../../contracts/catalog.ts';
import { resolveSegmentRelativePath } from '../../bootstrap/storage/segment-path-resolver.ts';
import { CanonicalItemResolver } from '../../catalog/canonical-item-resolver.ts';

function createSegmentedStreamResolver(service: BootstrapService): (streamId: string) => Promise<StreamRef | undefined> {
  let streamSegmentsPromise: Promise<string[]> | null = null;

  const getStreamSegments = async (): Promise<string[]> => {
    if (!streamSegmentsPromise) {
      streamSegmentsPromise = (async () => {
        const storage = service.getStorage();
        const manifest = await storage.readActiveManifest();
        const segments = (manifest as (typeof manifest & {
          segments?: Array<{ kind: string; fileName: string }>;
        }) | null)?.segments;
        return Array.isArray(segments)
          ? segments
            .filter((segment) => segment.kind === 'streams')
            .map((segment) => segment.fileName)
          : [];
      })();
    }
    return streamSegmentsPromise;
  };

  return async (streamId: string): Promise<StreamRef | undefined> => {
    const readSegment = service.getStorage().readActiveSegment;
    if (!readSegment || !streamId) return undefined;

    for (const segmentPath of await getStreamSegments()) {
      const raw = await readSegment.call(service.getStorage(), resolveSegmentRelativePath(segmentPath));
      if (!raw) continue;
      try {
        const records = JSON.parse(raw) as StreamRef[];
        if (!Array.isArray(records)) continue;
        const match = records.find((record) => record?.id === streamId);
        if (match) return match;
      } catch {
        // Um segmento inválido não deve impedir a leitura dos demais.
      }
    }
    return undefined;
  };
}


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

export interface UseActiveCatalogReturn {
  status: BootstrapStatus;
  summary: BootstrapSummary | null;
  activeCatalog: PrebuiltCatalog | null;
  readModel: CatalogReadModel | null;
  isLoading: boolean;
  isNoActiveCatalog: boolean;
  isValidEmptyCatalog: boolean;
  importWarning: string | null;
  refresh: () => Promise<void>;
}

export function useActiveCatalog(serviceOverride?: BootstrapService): UseActiveCatalogReturn {
  const service = useMemo(() => serviceOverride || getClientBootstrapService(), [serviceOverride]);

  const [summary, setSummary] = useState<BootstrapSummary | null>(null);
  const [activeCatalog, setActiveCatalog] = useState<PrebuiltCatalog | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const streamRefResolver = useMemo(() => createSegmentedStreamResolver(service), [service]);
  const episodeResolver = useMemo(() => createSegmentedEpisodeResolver(service), [service]);
  const seasonResolver = useMemo(() => createSegmentedSeasonResolver(service), [service]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentSummary = await service.initialize();
      setSummary(currentSummary);

      if (currentSummary.hasActiveCatalog) {
        const catalog = await service.getActiveCatalog();
        setActiveCatalog(catalog);
      } else {
        setActiveCatalog(null);
      }
    } catch {
      setActiveCatalog(null);
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  useEffect(() => {
    loadData();

    const unsubscribe = service.subscribe((newSummary) => {
      setSummary(newSummary);
      if (newSummary.hasActiveCatalog) {
        service.getActiveCatalog().then((cat) => setActiveCatalog(cat));
      } else {
        setActiveCatalog(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [service, loadData]);

  const status: BootstrapStatus = summary?.status || 'NO_ACTIVE_CATALOG';

  const readModel = useMemo(() => {
    if (!activeCatalog) return null;
    const itemResolver = new CanonicalItemResolver(service.getStorage(), activeCatalog.metadata.snapshotId);
    return new CatalogReadModel(activeCatalog, {
      streamRefResolver,
      episodeResolver,
      seasonResolver,
      movieResolver: (id) => itemResolver.resolveMovieById(id),
      seriesResolver: (id) => itemResolver.resolveSeriesById(id),
    });
  }, [activeCatalog, episodeResolver, seasonResolver, service, streamRefResolver]);

  const isNoActiveCatalog = status === 'NO_ACTIVE_CATALOG';

  // Catálogo validamente vazio exige catálogo ativo carregado com 0 filmes e 0 séries
  const isValidEmptyCatalog = Boolean(
    activeCatalog &&
    activeCatalog.movies.length === 0 &&
    activeCatalog.series.length === 0 &&
    status !== 'NO_ACTIVE_CATALOG'
  );

  const importWarning =
    status === 'IMPORT_FAILED_ACTIVE_PRESERVED'
      ? 'A última tentativa de atualização do catálogo falhou. O catálogo anterior está preservado e ativo.'
      : null;

  return {
    status,
    summary,
    activeCatalog,
    readModel,
    isLoading,
    isNoActiveCatalog,
    isValidEmptyCatalog,
    importWarning,
    refresh: loadData,
  };
}
