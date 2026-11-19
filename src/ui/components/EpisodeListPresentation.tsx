import React from 'react';
import type {CatalogReadModel} from '../../catalog/catalog-read-model.ts';
import type {SeasonViewModel} from '../../catalog/catalog-view-model.ts';
import type {EpisodePresentation} from '../../catalog/episode-presentation.ts';
import type {ArtworkIdentity} from '../../artwork/tmdb-metadata.service.ts';
import {useEpisodeMetadata} from '../hooks/useEpisodeMetadata.ts';
import './EpisodeMetadata.css';
interface Props{readModel:CatalogReadModel;seriesId:string;season:SeasonViewModel;identity:ArtworkIdentity|undefined;enabled:boolean;children:(episodes:readonly EpisodePresentation[])=>React.ReactNode}
/** No new focus target or row key: only the presentation values of the existing list change. */
export function EpisodeListPresentation({readModel,seriesId,season,identity,enabled,children}:Props){
  const presentation=useEpisodeMetadata(readModel,seriesId,season,identity,enabled);
  return <>{children(presentation.episodes)}</>;
}
