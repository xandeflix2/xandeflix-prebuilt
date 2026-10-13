import React, { useEffect, useMemo, useState } from 'react';
import type { Movie, Series } from '../../contracts/catalog.ts';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { selectRelatedTitles, loadRelatedTitles } from '../../catalog/related-titles.service.ts';
import { movieToViewModel, seriesToViewModel } from '../../catalog/catalog-selectors.ts';
import { getClientBootstrapService } from '../../bootstrap/client.ts';
import { MediaRail } from './MediaRail.tsx';
import { CatalogGrid } from './CatalogGrid.tsx';

export function RelatedTitles({ kind, itemId, readModel, onSelectItem, layout = 'rail' }: {
  kind: 'movie' | 'series'; itemId: string; readModel: CatalogReadModel; onSelectItem: (item: CatalogItemViewModel) => void;
  layout?: 'rail' | 'grid';
}): React.ReactElement {
  const reference = kind === 'movie' ? readModel.moviesById.get(itemId) : readModel.seriesById.get(itemId);
  const initial = useMemo(() => reference ? selectRelatedTitles(reference,
    [...(kind === 'movie' ? readModel.moviesById.values() : readModel.seriesById.values())]) : [], [reference, readModel, kind]);
  const selection = `${readModel.catalog.metadata.snapshotId}:${kind}:${itemId}`;
  const [state,setState] = useState<{selection:string;rows:(Movie|Series)[]}>();
  useEffect(() => {
    if (!reference) return;
    const controller = new AbortController();
    void loadRelatedTitles(readModel,kind,reference,getClientBootstrapService().getStorage(),controller.signal)
      .then(rows => { if (!controller.signal.aborted) setState({selection,rows}); }).catch(() => {});
    return () => controller.abort();
  }, [readModel, kind, reference, selection]);
  const rows = state?.selection === selection ? state.rows : initial;
  const items = useMemo(() => rows.map(row => kind === 'movie' ? movieToViewModel(readModel,row as Movie) : seriesToViewModel(readModel,row as Series)), [rows, kind, readModel]);
  return layout === 'grid' ? <div className="series-phone-related"><CatalogGrid items={items} onItemClick={onSelectItem} emptyMessage="Nenhum título semelhante disponível nesta fonte."/></div>
    : <MediaRail id={`related-${kind}-${itemId}`} title="Títulos semelhantes" items={items} onItemClick={onSelectItem} />;
}
