import {useEffect,useState} from 'react';
import type {ArtworkIdentity} from '../../artwork/tmdb-metadata.service.ts';
import {tmdbSeasonEpisodesService,type TmdbSeasonMetadata} from '../../artwork/tmdb-season-episodes.service.ts';
import {confirmEpisodeSeries,projectEpisodeSeason} from '../../catalog/episode-presentation.ts';
import type {CatalogReadModel} from '../../catalog/catalog-read-model.ts';
import type {SeasonViewModel} from '../../catalog/catalog-view-model.ts';
import {useArtworkMetadata} from './useArtworkMetadata.ts';
/** Mounted only inside the authorized, visible episode panel. Availability never waits for TMDB. */
export function useEpisodeMetadata(model:CatalogReadModel,seriesId:string,season:SeasonViewModel,identity:ArtworkIdentity|undefined,enabled:boolean){
  const metadata=useArtworkMetadata(identity,enabled&&season.episodes.length>0,'high');
  const confirmedId=confirmEpisodeSeries(identity,metadata);
  const snapshot=model.catalog.metadata;
  const key=`${snapshot.snapshotId}:${snapshot.catalogVersion}:${seriesId}:${season.id}:${season.seasonNumber}:${confirmedId??''}`;
  const [state,setState]=useState<{key:string;value:TmdbSeasonMetadata|null}>();
  const seasonNumber=season.seasonNumber;
  const hasEpisodes=season.episodes.length>0;
  useEffect(()=>{
    if(!enabled||!hasEpisodes||!confirmedId)return;
    let active=true;
    void tmdbSeasonEpisodesService.resolve(confirmedId,seasonNumber).then(value=>{if(active)setState({key,value});},()=>{if(active)setState({key,value:null});});
    return()=>{active=false;};
  },[model,key,enabled,hasEpisodes,confirmedId,seasonNumber]);
  const settled=enabled&&state?.key===key;
  const presentation=projectEpisodeSeason(model,season,settled?state.value:null,confirmedId,confirmedId?metadata?.backdropUri:undefined,confirmedId&&identity&&metadata?{identity,metadata}:undefined);
  // Source stills can belong to another work. Do not display them without parent proof.
  return confirmedId?presentation:{...presentation,episodes:presentation.episodes.map(episode=>({...episode,sceneUri:undefined,sceneSource:undefined}))};
}
