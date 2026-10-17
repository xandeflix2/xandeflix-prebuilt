import React, { useEffect, useState } from 'react';
import type { Movie, Series } from '../../contracts/catalog.ts';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { loadRelatedTitles } from '../../catalog/related-titles.service.ts';
import { movieToViewModel, seriesToViewModel } from '../../catalog/catalog-selectors.ts';
import { getClientBootstrapService } from '../../bootstrap/client.ts';
import { tmdbMetadataService, tmdbPosterPath } from '../../artwork/tmdb-metadata.service.ts';
import { tmdbSimilarService, similarGenreLookup } from '../../artwork/tmdb-similar.service.ts';
import { meaningfulDetailGenres } from '../detail-genres.ts';
import { isAdultCatalogItem } from '../../playback/content-adult-policy.ts';
import { MediaRail } from './MediaRail.tsx';
import { CatalogGrid } from './CatalogGrid.tsx';

export function RelatedTitles({ kind, itemId, readModel, onSelectItem, layout = 'rail' }: {
  kind: 'movie' | 'series'; itemId: string; readModel: CatalogReadModel; onSelectItem: (item: CatalogItemViewModel) => void;
  layout?: 'rail' | 'grid';
}): React.ReactElement {
  const reference = kind === 'movie' ? readModel.moviesById.get(itemId) : readModel.seriesById.get(itemId);
  const selection = `${readModel.catalog.metadata.snapshotId}:${kind}:${itemId}`;
  const [attempt, retry] = useState(0);
  const [state, setState] = useState<{ selection: string; items: CatalogItemViewModel[]; failed: boolean }>();
  useEffect(() => {
    if (!reference) return;
    const controller = new AbortController();
    setState(undefined);
    const view = (row: Movie | Series) => kind === 'movie' ? movieToViewModel(readModel, row as Movie) : seriesToViewModel(readModel, row as Series);
    const identity = (item: CatalogItemViewModel) => ({ kind, title: item.title, year: item.yearFormatted,
      tmdbId: item.externalIds?.tmdbId, posterPath: tmdbPosterPath(item.posterUri), sourcePosterUri: item.posterUri });
    void (async () => {
      const item = view(reference), source = meaningfulDetailGenres(item.genreLabels);
      const metadata = tmdbMetadataService.peek(identity(item)) || await tmdbMetadataService.resolve(identity(item), 'high');
      if (controller.signal.aborted) return;
      const referenceGenres = source.length ? source : meaningfulDetailGenres(metadata?.genres || []);
      if (!referenceGenres.length) throw new Error('RELATED_GENRES_UNAVAILABLE');
      const similar = metadata ? await tmdbSimilarService.resolve(kind, metadata.tmdbId) : [];
      if (controller.signal.aborted) return;
      const lookup = similarGenreLookup(similar);
      const genresFor = (row: Movie | Series) => {
        if (isAdultCatalogItem(row, readModel)) return [];
        const candidate = view(row), local = meaningfulDetailGenres(candidate.genreLabels);
        if (local.length) return local;
        const cached = meaningfulDetailGenres(tmdbMetadataService.peek(identity(candidate))?.genres || []);
        return cached.length ? cached : meaningfulDetailGenres(lookup(identity(candidate)));
      };
      const rows = await loadRelatedTitles(readModel, kind, reference, getClientBootstrapService().getStorage(), controller.signal,
        { referenceGenres, genresFor });
      if (!controller.signal.aborted) setState({ selection, items: rows.map(row => ({ ...view(row), genreLabels: genresFor(row) })), failed: false });
    })().catch(() => { if (!controller.signal.aborted) setState({ selection, items: [], failed: true }); });
    return () => controller.abort();
  }, [readModel, kind, reference, selection, attempt]);
  if (state?.selection !== selection) return <p role="status">Carregando títulos semelhantes…</p>;
  if (state.failed) return <div role="status"><p>Não foi possível carregar os títulos semelhantes.</p>
    <button type="button" className="focusable-item btn-secondary" onClick={() => retry(v => v + 1)}>Tentar novamente</button></div>;
  return layout === 'grid' ? <div className="series-phone-related"><CatalogGrid items={state.items} onItemClick={onSelectItem} emptyMessage="Nenhum título semelhante disponível nesta fonte."/></div>
    : state.items.length ? <MediaRail id={`related-${kind}-${itemId}`} title="Títulos semelhantes" items={state.items} onItemClick={onSelectItem} />
      : <p>Nenhum título semelhante disponível nesta fonte.</p>;
}
