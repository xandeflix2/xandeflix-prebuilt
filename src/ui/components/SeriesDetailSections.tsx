import React,{useRef,useState} from 'react';
import type {CatalogReadModel} from '../../catalog/catalog-read-model.ts';
import type {CatalogItemViewModel} from '../../catalog/catalog-view-model.ts';
import type {ArtworkIdentity} from '../../artwork/tmdb-metadata.service.ts';
import {RelatedTitles} from './RelatedTitles.tsx';
import {ActorDetailPage} from './ActorDetailPage.tsx';
import type {CastMember} from '../../artwork/series-presentation.service.ts';
import {TitleCast} from './TitleCast.tsx';
interface Props {seriesId:string;kind?:'movie'|'series';identity?:ArtworkIdentity;layout?:'grid'|'rail';readModel:CatalogReadModel;episodes?:React.ReactNode;episodesFailed?:boolean;onRetryEpisodes?:()=>void;onSelectItem?:(item:CatalogItemViewModel)=>void}
export function SeriesDetailSections({seriesId,kind='series',identity,layout='rail',readModel,episodes,episodesFailed,onRetryEpisodes,onSelectItem}:Props):React.ReactElement {
  const [person,setPerson]=useState<CastMember|null>(null);
  const [tab,setTab]=useState<'episodes'|'related'|'cast'>(kind==='movie'?'related':'episodes');
  const episodeTab=useRef<HTMLButtonElement>(null),relatedTab=useRef<HTMLButtonElement>(null),castTab=useRef<HTMLButtonElement>(null);
  const tabs=kind==='movie'?['related','cast'] as const:['episodes','related','cast'] as const;
  const refs={episodes:episodeTab,related:relatedTab,cast:castTab},labels={episodes:'Episódios',related:'Títulos semelhantes',cast:'Elenco'};
  const id=String(kind==='movie'?'movie-detail-':'series-detail-')+seriesId.replace(/[^a-z0-9_-]/gi,'-');
  const keyboard=(event:React.KeyboardEvent<HTMLButtonElement>)=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const index=tabs.findIndex(t=>refs[t].current===event.currentTarget);if(event.key==='ArrowLeft'&&index===0&&event.currentTarget.closest('.app-shell--side-nav'))return;event.preventDefault();event.stopPropagation();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:Math.max(0,Math.min(tabs.length-1,index+(event.key==='ArrowRight'?1:-1)));setTab(tabs[next]);refs[tabs[next]].current?.focus({preventScroll:true});};
  return <div className="series-detail-sections">
    <div className={layout==='grid'?'series-phone-tabs':'series-detail-tabs'} role="tablist" aria-label={kind==='movie'?'Conteúdo do filme':'Conteúdo da série'}>
      {tabs.map(t=><button key={t} ref={refs[t]} type="button" role="tab" id={id+'-'+t} aria-controls={id+'-panel'} aria-selected={tab===t} tabIndex={tab===t?0:-1} className="focusable-item" onClick={()=>setTab(t)} onKeyDown={keyboard}>{labels[t]}</button>)}
    </div>
    <section id={id+'-panel'} role="tabpanel" aria-labelledby={id+'-'+tab} tabIndex={0} className={layout==='grid'?'series-phone-panel':'series-detail-panel'}>
      {tab==='episodes'?episodesFailed?<div role="status"><p>Não foi possível carregar os episódios.</p><button type="button" className="focusable-item btn-secondary" onClick={onRetryEpisodes}>Tentar novamente</button></div>:episodes
        :tab==='cast'?<TitleCast key={seriesId} identity={identity} onSelectPerson={setPerson}/>:onSelectItem?<RelatedTitles kind={kind} itemId={seriesId} readModel={readModel} onSelectItem={onSelectItem} layout={layout}/>:<p>Títulos semelhantes indisponíveis.</p>}
    </section>
    {person?<ActorDetailPage key={person.id} person={person} readModel={readModel} onClose={()=>setPerson(null)} onSelectItem={onSelectItem}/>:null}
  </div>;
}
