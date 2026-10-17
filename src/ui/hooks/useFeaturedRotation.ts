import {useEffect,useState} from 'react';
import type {CatalogReadModel} from '../../catalog/catalog-read-model.ts';
import type {CatalogItemViewModel} from '../../catalog/catalog-view-model.ts';
import type {LocalCatalogStorage} from '../../bootstrap/storage/storage.interface.ts';
import type {Movie,Series} from '../../contracts/catalog.ts';
import type {BrowseKind,SegmentedBrowseService} from '../../catalog/segmented-browse.service.ts';
import {movieToViewModel,seriesToViewModel} from '../../catalog/catalog-selectors.ts';

const REFRESH='xandeflix:featured-refresh';
interface Batch {revision:number;items:CatalogItemViewModel[];recent:string[];ready:boolean;cursor:number}
export function selectFeatured<T extends {id:string}>(pool:readonly T[],recent:readonly string[],random:()=>number=Math.random):T[]{
  const result:T[]=[],seen=new Set<string>(),old=new Set(recent);if(!pool.length)return result;
  const start=Math.floor(random()*pool.length)%pool.length;
  // Walk a distributed, bounded set before reusing recently shown items.
  for(const avoid of [true,false])for(let index=0;index<Math.min(pool.length,120)&&result.length<20;index++){
    const row=pool[(start+index)%pool.length];if(seen.has(row.id)||(avoid&&old.has(row.id)))continue;
    seen.add(row.id);result.push(row);
  }
  return result;
}
export class FeaturedRotationMemory {
  snapshot='';revision=0;private batches=new Map<BrowseKind,Batch>();
  refresh(){this.revision++;}
  batch(snapshot:string,kind:BrowseKind,initial:()=>CatalogItemViewModel[]):Batch{
    if(this.snapshot!==snapshot){this.snapshot=snapshot;this.batches.clear();this.revision++;}
    const previous=this.batches.get(kind);if(previous?.revision===this.revision)return previous;
    const recent=[...(previous?.recent||[]),...(previous?.items.map(i=>i.id)||[])].slice(-40);
    const batch={revision:this.revision,items:selectFeatured(initial(),recent),recent,ready:false,cursor:(previous?.cursor??Math.floor(Math.random()*100000))+1};
    this.batches.set(kind,batch);return batch;
  }
  commit(snapshot:string,kind:BrowseKind,batch:Batch,pool:CatalogItemViewModel[],safe:boolean):boolean {
    if(this.snapshot!==snapshot||this.batches.get(kind)!==batch||this.revision!==batch.revision)return false;
    batch.ready=true;if(!safe||!pool.length)return false;
    batch.items=selectFeatured([...pool,...batch.items],batch.recent);return true;
  }
}
const memory=new FeaturedRotationMemory();
export function requestFeaturedRotation(){memory.refresh();window.dispatchEvent(new Event(REFRESH));}

export async function sampleFeaturedSegments(kind:BrowseKind,storage:LocalCatalogStorage,browse:SegmentedBrowseService,cursor:number,snapshot:string,signal:AbortSignal):Promise<Array<Movie|Series>>{
  const manifest=await storage.readActiveManifest() as {snapshotId?:string;segments?:Array<{kind?:string;fileName?:string;recordCount?:number}>}|null;
  if(signal.aborted||manifest?.snapshotId!==snapshot)return [];
  const segments=manifest.segments?.filter(s=>s.kind===kind&&s.fileName)||[],count=segments.length;if(!count)return [];
  const result:Array<Movie|Series>=[];
  for(let i=0;i<Math.min(2,count);i++){
    if(signal.aborted)return [];
    const segment=(cursor+i*Math.ceil(count/2))%count;
    const size=count===1?20:10,records=segments[segment].recordCount;
    const offset=Number.isSafeInteger(records)&&records!>size?(cursor*size)%(records!-size+1):0;
    const page=await browse.loadPage<Movie|Series>(kind,{segment,offset},size,undefined,{count:false,signal});
    if(signal.aborted)return [];result.push(...page.items);
  }
  return result.slice(0,20);
}
export function useFeaturedRotation(readModel:CatalogReadModel,storage:LocalCatalogStorage,browse:SegmentedBrowseService){
  const[,redraw]=useState(0),snapshot=readModel.catalog.metadata.snapshotId;
  const movies=memory.batch(snapshot,'movies',()=>selectFeatured(readModel.catalog.movies,[]).map(m=>movieToViewModel(readModel,m)));
  const series=memory.batch(snapshot,'series',()=>selectFeatured(readModel.catalog.series,[]).map(s=>seriesToViewModel(readModel,s)));
  useEffect(()=>{const refresh=()=>redraw(n=>n+1);window.addEventListener(REFRESH,refresh);return()=>window.removeEventListener(REFRESH,refresh);},[]);
  useEffect(()=>{
    const controller=new AbortController();
    const timer=setTimeout(()=>{void(async()=>{
      for(const[kind,batch]of [['movies',movies],['series',series]] as const){
        if(controller.signal.aborted)return;if(batch.ready)continue;
        try{const rows=await sampleFeaturedSegments(kind,storage,browse,batch.cursor,snapshot,controller.signal);
          if(controller.signal.aborted)return;
          const pool=rows.map(row=>kind==='movies'?movieToViewModel(readModel,row as Movie):seriesToViewModel(readModel,row as Series));
          const hero=document.querySelector('.home-page .hero-banner')?.getBoundingClientRect();
          const safe=!!hero&&hero.bottom>0&&hero.top<window.innerHeight&&!document.activeElement?.closest('[aria-labelledby="rail-title-rail-movies"], [aria-labelledby="rail-title-rail-series"]');
          if(memory.commit(snapshot,kind,batch,pool,safe))redraw(n=>n+1);
        }catch{/* Optional local suggestions retain the immediately ready batch. */}
      }
    })();},1500);
    return()=>{controller.abort();clearTimeout(timer);};
  },[readModel,storage,browse,snapshot,movies,series]);
  return{movies:movies.items,series:series.items};
}
