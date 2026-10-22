import React,{useEffect,useState} from 'react';
import type {CatalogReadModel} from '../../catalog/catalog-read-model.ts';
import type {SeriesDetailViewModel,CatalogItemViewModel} from '../../catalog/catalog-view-model.ts';
import type {ArtworkIdentity} from '../../artwork/tmdb-metadata.service.ts';
import {artworkIdentityKey} from '../../artwork/tmdb-metadata.service.ts';
import {resolveSeriesPresentation,type SeriesPresentation} from '../../artwork/series-presentation.service.ts';
import {watchFingerprint} from '../../playback/watch-history.ts';
import {SeriesTrailer} from './SeriesTrailer.tsx';
import {SeriesPersonalActions} from './SeriesPersonalActions.tsx';
import {CastButton} from './CastButton.tsx';
import {RelatedTitles} from './RelatedTitles.tsx';
import {WatchProviders} from './WatchProviders.tsx';

interface Props {detail:SeriesDetailViewModel;identity:ArtworkIdentity;readModel:CatalogReadModel;episodes:React.ReactNode;episodesLoading:boolean;episodesFailed:boolean;selectedSeasonIndex:number;resolving:boolean;onPlay:(id:string)=>void;onRetryEpisodes:()=>void;onBack:()=>void;onSelectItem?:(item:CatalogItemViewModel)=>void}
export function PhoneSeriesDetail({detail,identity,readModel,episodes,episodesLoading,episodesFailed,selectedSeasonIndex,resolving,onPlay,onRetryEpisodes,onBack,onSelectItem}:Props){
  const [tab,setTab]=useState<'episodes'|'related'>('episodes');
  const [state,setState]=useState<{key:string;data:SeriesPresentation|null}>();
  const key=artworkIdentityKey(identity);
  const {title,year,tmdbId,posterPath,sourcePosterUri,originCountry,network,hasEpisodes}=identity;
  useEffect(()=>{
    let active=true;
    void resolveSeriesPresentation({kind:'series',title,year,tmdbId,posterPath,sourcePosterUri,originCountry,network,hasEpisodes}).then(data=>{if(active)setState({key,data});},()=>{if(active)setState({key,data:null});});
    return()=>{active=false;};
  },[key,title,year,tmdbId,posterPath,sourcePosterUri,originCountry,network,hasEpisodes]);
  const extra=state?.key===key?state.data:null;
  const loading=state?.key!==key;
  const source=readModel.seriesById.get(detail.id)!;
  const fingerprint=watchFingerprint('series',source);
  const available=detail.seasons.reduce((count,season)=>count+season.episodes.length,0);
  const selected=detail.seasons[selectedSeasonIndex]||detail.seasons[0];
  const first=selected?.episodes[0];
  const localDuration=first?.durationFormatted;
  const duration=localDuration|| (extra?.runtimeMinutes?`${extra.runtimeMinutes}min`:undefined);
  const count=episodesLoading?extra?.episodeCount?`${extra.episodeCount} episódios (TMDB)`:'Carregando episódios…':episodesFailed?'Quantidade indisponível':`${available} ${available===1?'episódio disponível':'episódios disponíveis'}`;
  const genres=detail.genreLabels;
  const tabId=`series-${detail.id.replace(/[^a-z0-9_-]/gi,'-')}`;
  return <>
    <div data-detail-hero tabIndex={-1} className="focusable-item series-phone-hero">
      <SeriesTrailer key={`${detail.id}:${extra?.trailer?.key||''}`} title={detail.title} identity={identity} backdrop={detail.backdropUri} poster={detail.posterUri} trailer={extra?.trailer} loading={loading}/>
    </div>
    <div className="series-phone-content">
      <h1 className="series-phone-title">{detail.title}</h1>
      <div className="series-phone-metadata" aria-label="Informações da série">
        <div className="series-phone-metadata-line">
        {detail.yearFormatted && <span>{detail.yearFormatted}</span>}
        {extra?.ageRating && <span className="series-age-rating series-age-rating--known" aria-label={`Classificação indicativa: ${extra.ageRating==='L'?'Livre':extra.ageRating+' anos'}`}>{extra.ageRating==='L'?'L':extra.ageRating+'+'}</span>}
        {duration && <span>{duration} por episódio</span>}
        <WatchProviders identity={identity} inline/>
        </div>
        <span>{count}</span>
        {!extra?.ageRating && <span className="series-age-rating" aria-label="Classificação indicativa: não informada">Classificação não informada</span>}
        {!!genres.length && <span className="series-phone-genres">{genres.slice(0,4).join(' • ')}</span>}
      </div>
      <p className="series-phone-synopsis">{detail.overview||'Sinopse indisponível para esta série.'}</p>
      <div className="series-phone-actions">
        <button type="button" className="focusable-item series-phone-watch" disabled={!first||resolving} onClick={()=>{if(first)onPlay(first.id);}} aria-label={first?`Assistir ${selected.title}, episódio ${first.episodeNumber}`:'Assistir série'}>{resolving?'Preparando…':episodesLoading&&!first?'Carregando episódios…':'▶ Assistir'}</button>
        <button type="button" className="focusable-item btn-secondary" onClick={onBack}>← Voltar</button>
        <CastButton/>
      </div>
      <SeriesPersonalActions key={fingerprint} itemId={detail.id} fingerprint={fingerprint} title={detail.title} tmdbId={extra?.tmdbId}/>
      <div className="series-phone-tabs" role="tablist" aria-label="Conteúdo da série">
        <button type="button" role="tab" id={`${tabId}-episodes`} aria-controls={`${tabId}-panel`} aria-selected={tab==='episodes'} tabIndex={tab==='episodes'?0:-1} className="focusable-item" onClick={()=>setTab('episodes')} onKeyDown={event=>{if(event.key==='ArrowRight'){setTab('related');document.getElementById(`${tabId}-related`)?.focus();}}}>Episódios</button>
        <button type="button" role="tab" id={`${tabId}-related`} aria-controls={`${tabId}-panel`} aria-selected={tab==='related'} tabIndex={tab==='related'?0:-1} className="focusable-item" onClick={()=>setTab('related')} onKeyDown={event=>{if(event.key==='ArrowLeft'){setTab('episodes');document.getElementById(`${tabId}-episodes`)?.focus();}}}>Títulos semelhantes</button>
      </div>
      <section id={`${tabId}-panel`} role="tabpanel" aria-labelledby={`${tabId}-${tab}`} tabIndex={0} className="series-phone-panel">
        {tab==='episodes'?episodesFailed?<div role="status"><p>Não foi possível carregar os episódios.</p><button type="button" className="focusable-item btn-secondary" onClick={onRetryEpisodes}>Tentar novamente</button></div>:episodes:onSelectItem?<RelatedTitles kind="series" itemId={detail.id} readModel={readModel} onSelectItem={onSelectItem} layout="grid"/>:<p>Títulos semelhantes indisponíveis.</p>}
      </section>
    </div>
  </>;
}
