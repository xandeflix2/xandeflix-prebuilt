import React,{useEffect,useMemo,useSyncExternalStore} from 'react';
import type {CatalogReadModel} from '../../catalog/catalog-read-model.ts';
import type {CatalogItemViewModel} from '../../catalog/catalog-view-model.ts';
import type {Movie,Series} from '../../contracts/catalog.ts';
import type {BrowseKind,SegmentedBrowseService} from '../../catalog/segmented-browse.service.ts';
import {movieToViewModel,seriesToViewModel} from '../../catalog/catalog-selectors.ts';
import {isReleaseCategory} from '../../catalog/category-presentation.ts';
import {canShowParentalItem} from '../../parental/parental-content.ts';
import {useParentalControl} from '../hooks/useParentalControl.ts';
import {RailPagination} from '../rail-pagination.ts';
import type {RailLoadQueue} from './AsyncCategoryRail.tsx';
import {MediaRail} from './MediaRail.tsx';

interface Props {expansionContext?:'home'|'movies'|'series';id:string;title:string;kind:BrowseKind;categoryId:string;initialItems:CatalogItemViewModel[];readModel:CatalogReadModel;browseService:SegmentedBrowseService;queue?:RailLoadQueue;onItemClick:(item:CatalogItemViewModel)=>void;onViewAll?:()=>void;onViewAllFocus?:()=>void;startupArtworkCount?:number}
export function ProgressiveCategoryRail(props:Props):React.ReactElement{
  const {kind,categoryId,readModel,browseService,queue}=props,parental=useParentalControl();
  const pager=useMemo(()=>new RailPagination(props.initialItems,async(cursor,size,signal)=>{
    const fetcher=()=>browseService.loadPage<Movie|Series>(kind,cursor,size,categoryId,{count:false,signal,order:kind==='movies'&&isReleaseCategory(props.title)?'source-desc':'source'});
    const page=await(queue?queue.add(fetcher,true):fetcher());
    return {...page,items:page.items.map(record=>kind==='movies'?movieToViewModel(readModel,record as Movie):seriesToViewModel(readModel,record as Series))};
  },canShowParentalItem),[browseService,categoryId,kind,readModel,queue,parental.revision]);
  useEffect(()=>()=>pager.dispose(),[pager]);
  const state=useSyncExternalStore(pager.subscribe,pager.snapshot,pager.snapshot);
  return <>
    <MediaRail {...props} items={state.items as CatalogItemViewModel[]} virtualized onApproachEnd={index=>pager.approach(index)} onRequestNext={()=>pager.load()} moreAvailable={!state.done}/>
    {state.error&&<div className="rail-retry" role="status"><span>Não foi possível carregar mais títulos.</span><button className="focusable-item btn-secondary" onClick={()=>void pager.load(true)}>Tentar novamente</button></div>}
  </>;
}
