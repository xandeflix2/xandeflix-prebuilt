import React,{useEffect,useState,useRef} from 'react';
import type {CatalogReadModel} from '../../catalog/catalog-read-model.ts';
import type {CatalogItemViewModel} from '../../catalog/catalog-view-model.ts';
import {movieToViewModel,seriesToViewModel} from '../../catalog/catalog-selectors.ts';
import {watchHistory,resumeRecentWatch,watchFingerprint,type RecentWatch} from '../../playback/watch-history.ts';
import {defaultPlaybackService} from '../../playback/playback.service.ts';
import {MediaRail} from './MediaRail.tsx';
import {CatalogGrid} from './CatalogGrid.tsx';
import {getClientBootstrapService} from '../../bootstrap/client.ts';
import {resolveRecentTitleBindings} from '../recent-title-resolution.ts';
import {isAdultCatalogItem} from '../../playback/content-adult-policy.ts';

export function RecentTitles({readModel,presentation='rail',onViewAll}:{readModel:CatalogReadModel;presentation?:'rail'|'collection';onViewAll?:()=>void}):React.ReactElement|null{
  const [records,setRecords]=useState(()=>watchHistory.list());
  const [resolved,setResolved]=useState<CatalogItemViewModel[]>([]);
  const [status,setStatus]=useState('');const [busy,setBusy]=useState(false);
  const [resolving,setResolving]=useState(records.length>0);
  const limit=presentation==='collection'?60:20;
  const resumeEntries=useRef(new Map<string,RecentWatch>());
  useEffect(()=>watchHistory.subscribe(()=>setRecords(watchHistory.list())),[]);
  useEffect(()=>{void watchHistory.syncNativeProgress();},[]);
  useEffect(()=>{
    let active=true;const controller=new AbortController();
    const view=(r:RecentWatch)=>{
      if(r.kind==='movie'){const movie=readModel.moviesById.get(r.itemId);return movie && !isAdultCatalogItem(movie,readModel) && r.fingerprint===watchFingerprint('movie',movie)?movieToViewModel(readModel,movie):undefined;}
      const series=readModel.seriesById.get(r.itemId);return series && !isAdultCatalogItem(series,readModel) && r.fingerprint===watchFingerprint('series',series)?seriesToViewModel(readModel,series):undefined;
    };
    setResolving(true);
    resumeEntries.current=new Map(records.slice(0,limit).filter(r=>view(r)).map(r=>[`${r.kind}:${r.itemId}`,r]));
    setResolved(records.slice(0,limit).map(view).filter((v):v is CatalogItemViewModel=>!!v));
    void resolveRecentTitleBindings(records.slice(0,limit),readModel,getClientBootstrapService().getStorage(),controller.signal)
      .then(bindings=>{if(!active)return;resumeEntries.current=new Map(bindings.map(binding=>[`${binding.record.kind}:${binding.item.id}`,binding.record]));
        setResolved(bindings.map(binding=>binding.record.kind==='movie'?movieToViewModel(readModel,binding.item as Parameters<typeof movieToViewModel>[1]):seriesToViewModel(readModel,binding.item as Parameters<typeof seriesToViewModel>[1])));
      }).catch(()=>{}).finally(()=>{if(active)setResolving(false);});
    return()=>{active=false;controller.abort();};
  },[readModel,records,limit]);
  const resume=async(item:CatalogItemViewModel)=>{
    if(busy)return;const entry=resumeEntries.current.get(`${item.kind}:${item.id}`);if(!entry)return;
    setBusy(true);setStatus('Retomando reprodução…');
    try{
      const result=await resumeRecentWatch(entry,readModel,defaultPlaybackService);
      setStatus(result.success?'':result.errorMessage||'Não foi possível retomar este conteúdo.');
    }catch{setStatus('Não foi possível retomar este conteúdo na fonte atual.');}finally{setBusy(false);}
  };
  if(!resolved.length && presentation==='rail')return null;
  return <section className="recent-titles" aria-label="Recentes" aria-busy={busy}>
    {presentation==='collection'
      ? <CatalogGrid items={resolved} onItemClick={item=>{void resume(item);}} autoLoadMore
          getItemKey={item=>`${item.kind}:${item.id}`}
          emptyMessage={resolving?'Carregando títulos recentes…':'Nenhum título recente disponível no catálogo atual.'}/>
      : <MediaRail id="rail-recent-watched" title="Recentes" items={resolved} preserveOrder onItemClick={item=>{void resume(item);}} onViewAll={onViewAll}/>}
    {status && <p role="status" aria-live="polite">{status}</p>}
  </section>;
}
