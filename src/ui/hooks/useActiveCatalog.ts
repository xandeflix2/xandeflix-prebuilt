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
    return new CatalogReadModel(activeCatalog);
  }, [activeCatalog]);

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
