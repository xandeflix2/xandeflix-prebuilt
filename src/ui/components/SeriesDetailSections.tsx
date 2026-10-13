import React,{useRef,useState} from 'react';
import type {CatalogReadModel} from '../../catalog/catalog-read-model.ts';
import type {CatalogItemViewModel} from '../../catalog/catalog-view-model.ts';
import {RelatedTitles} from './RelatedTitles.tsx';

interface Props {seriesId:string;readModel:CatalogReadModel;episodes:React.ReactNode;episodesFailed:boolean;onRetryEpisodes:()=>void;onSelectItem?:(item:CatalogItemViewModel)=>void}

export function SeriesDetailSections({seriesId,readModel,episodes,episodesFailed,onRetryEpisodes,onSelectItem}:Props):React.ReactElement {
  const [tab,setTab]=useState<'episodes'|'related'>('episodes');
  const episodeTab=useRef<HTMLButtonElement>(null),relatedTab=useRef<HTMLButtonElement>(null);
  const id=`series-detail-${seriesId.replace(/[^a-z0-9_-]/gi,'-')}`;
  const keyboard=(event:React.KeyboardEvent<HTMLButtonElement>)=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    // Let the page's D-pad handler leave the first tab for the side menu.
    if(event.key==='ArrowLeft'&&event.currentTarget===episodeTab.current&&event.currentTarget.closest('.app-shell--side-nav'))return;
    event.preventDefault();event.stopPropagation();
    const next=event.key==='ArrowRight'||event.key==='End'?'related':'episodes';
    setTab(next);(next==='related'?relatedTab:episodeTab).current?.focus({preventScroll:true});
  };
  return <div className="series-detail-sections">
    <div className="series-detail-tabs" role="tablist" aria-label="Conteúdo da série">
      <button ref={episodeTab} type="button" role="tab" id={`${id}-episodes`} aria-controls={`${id}-panel`} aria-selected={tab==='episodes'} tabIndex={tab==='episodes'?0:-1} className="focusable-item" onClick={()=>setTab('episodes')} onKeyDown={keyboard}>Episódios</button>
      <button ref={relatedTab} type="button" role="tab" id={`${id}-related`} aria-controls={`${id}-panel`} aria-selected={tab==='related'} tabIndex={tab==='related'?0:-1} className="focusable-item" onClick={()=>setTab('related')} onKeyDown={keyboard}>Títulos semelhantes</button>
    </div>
    <section id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${tab}`} tabIndex={0} className="series-detail-panel">
      {tab==='episodes'?episodesFailed?<div role="status"><p>Não foi possível carregar os episódios.</p><button type="button" className="focusable-item btn-secondary" onClick={onRetryEpisodes}>Tentar novamente</button></div>:episodes
        :onSelectItem?<RelatedTitles kind="series" itemId={seriesId} readModel={readModel} onSelectItem={onSelectItem}/>:<p>Títulos semelhantes indisponíveis.</p>}
    </section>
  </div>;
}
