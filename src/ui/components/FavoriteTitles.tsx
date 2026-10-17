import React,{useEffect,useState} from 'react';
import type {CatalogReadModel} from '../../catalog/catalog-read-model.ts';
import type {CatalogItemViewModel} from '../../catalog/catalog-view-model.ts';
import {movieToViewModel,seriesToViewModel} from '../../catalog/catalog-selectors.ts';
import {getClientBootstrapService} from '../../bootstrap/client.ts';
import {seriesPersonalStore} from '../series-personal.store.ts';
import {residentFavoriteTitles,resolveFavoriteTitles,type FavoriteTitleBinding} from '../favorite-title-resolution.ts';
import {MediaRail} from './MediaRail.tsx';
import {CatalogGrid} from './CatalogGrid.tsx';
const itemKey=(item:CatalogItemViewModel)=>`${item.kind}:${item.id}`;

export function FavoriteTitles({readModel,onSelectItem,presentation='rail',onViewAll}:{
  readModel:CatalogReadModel;onSelectItem:(item:CatalogItemViewModel)=>void;
  presentation?:'rail'|'collection';onViewAll?:()=>void;
}):React.ReactElement|null {
  const [records,setRecords]=useState(()=>seriesPersonalStore.favorites());
  const [bindings,setBindings]=useState<FavoriteTitleBinding[]>(()=>residentFavoriteTitles(records,readModel));
  const [loading,setLoading]=useState(()=>records.length>0),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
  useEffect(()=>seriesPersonalStore.subscribe(()=>setRecords(seriesPersonalStore.favorites())),[]);
  useEffect(()=>{
    const controller=new AbortController();
    setBindings(residentFavoriteTitles(records,readModel));setFailed(false);setLoading(records.length>0);
    if(!records.length)return()=>controller.abort();
    const timer=setTimeout(()=>{void resolveFavoriteTitles(records,readModel,getClientBootstrapService().getStorage(),controller.signal)
      .then(value=>{if(!controller.signal.aborted)setBindings(value);})
      .catch(()=>{if(!controller.signal.aborted)setFailed(true);})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});},0);
    return()=>{clearTimeout(timer);controller.abort();};
  },[readModel,records,retry]);
  const items=bindings.slice(0,presentation==='rail'?20:256).map(binding=>binding.kind==='movie'
    ?movieToViewModel(readModel,binding.item as Parameters<typeof movieToViewModel>[1])
    :seriesToViewModel(readModel,binding.item as Parameters<typeof seriesToViewModel>[1]));
  if(presentation==='rail'&&!records.length)return null;
  return <div className="favorite-titles" aria-busy={loading}>
    {presentation==='rail'?<MediaRail id="rail-favorites" title="Favoritos" items={items} preserveOrder getItemKey={itemKey} onItemClick={onSelectItem} onViewAll={onViewAll}/>
      :items.length?<CatalogGrid items={items} getItemKey={itemKey} onItemClick={onSelectItem} autoLoadMore/>:null}
    {failed?<p role="alert">Não foi possível consultar todos os favoritos. <button type="button" className="focusable-item btn-secondary" onClick={()=>setRetry(value=>value+1)}>Tentar novamente</button></p>
      :loading&&!items.length?<p role="status">Carregando favoritos…</p>
      :presentation==='collection'&&!items.length?<p>Nenhum favorito disponível no catálogo atual. Marque filmes ou séries com Favoritos.</p>:null}
  </div>;
}
