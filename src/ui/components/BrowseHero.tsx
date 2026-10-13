import React from 'react';
import type { LocalCatalogStorage } from '../../bootstrap/storage/storage.interface.ts';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { useHomeHero } from '../hooks/useHomeHero.ts';
import { HomeHero } from './HomeHero.tsx';

import { useHeroPlayback } from '../hooks/useHeroPlayback.ts';
export function BrowseHero({ readModel, storage, contentKind, onSelect }: {
  readModel: CatalogReadModel;
  storage: LocalCatalogStorage;
  contentKind: 'movie' | 'series';
  onSelect: (item: CatalogItemViewModel) => void;
}): React.ReactElement {
  const hero = useHomeHero(readModel, storage, contentKind);
  const playback = useHeroPlayback(readModel);
  return <HomeHero options={hero.candidates} nextBatch={hero.nextBatch} displayed={hero.displayed}
    contentKind={contentKind} headingLevel={2} onSelect={onSelect} {...playback}/>;
}
