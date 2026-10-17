import type { CatalogReadModel } from '../catalog/catalog-read-model.ts';
import type { Movie, Series } from '../contracts/catalog.ts';
import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';
import { resolveSegmentRelativePath } from '../bootstrap/storage/segment-path-resolver.ts';
import { watchFingerprint } from '../playback/watch-history.ts';
import { isAdultCatalogItem } from '../playback/content-adult-policy.ts';
import type { PersonalFavorite } from './series-personal.store.ts';

export interface FavoriteTitleBinding { kind:'movie'|'series'; item:Movie|Series; fingerprint:string }

/** Only preferences and current local catalog entities. Never a stream or remote request. */
export function residentFavoriteTitles(records:readonly PersonalFavorite[], model:CatalogReadModel):FavoriteTitleBinding[] {
  if(!records.length)return [];
  const wanted=new Set(records.map(record=>record.fingerprint)), found=new Map<string,FavoriteTitleBinding>();
  for(const kind of ['movie','series'] as const) {
    const items:Iterable<Movie|Series>=kind==='movie'?model.moviesById.values():model.seriesById.values();
    for(const item of items) {
      const fingerprint=watchFingerprint(kind,item);
      if(wanted.has(fingerprint) && !found.has(fingerprint) && !isAdultCatalogItem(item,model))found.set(fingerprint,{kind,item,fingerprint});
    }
  }
  return records.flatMap(record=>found.has(record.fingerprint)?[found.get(record.fingerprint)!]:[]);
}

export async function resolveFavoriteTitles(records:readonly PersonalFavorite[], model:CatalogReadModel,
  storage:LocalCatalogStorage, signal:AbortSignal):Promise<FavoriteTitleBinding[]> {
  const wanted=records.slice(0,256), found=new Map(residentFavoriteTitles(wanted,model).map(binding=>[binding.fingerprint,binding]));
  const snapshot=model.catalog.metadata.snapshotId;
  const check=()=>{if(signal.aborted)throw Error('FAVORITES_LOOKUP_CANCELLED');};
  const accept=(kind:'movie'|'series',item:Movie|Series|undefined,fingerprint:string)=>{
    if(item && watchFingerprint(kind,item)===fingerprint && !isAdultCatalogItem(item,model))found.set(fingerprint,{kind,item,fingerprint});
  };
  check();
  if(found.size<wanted.length) {
    const manifest=await storage.readActiveManifest();check();
    if(manifest?.snapshotId!==snapshot)throw Error('FAVORITES_GENERATION_CHANGED');
    for(const record of wanted) {
      if(found.has(record.fingerprint)||!record.target)continue;
      const {kind,itemId}=record.target;
      const item=kind==='movie'?await model.resolveMovieById(itemId):await model.resolveSeriesById(itemId);
      check();accept(kind,item,record.fingerprint);
    }
    // Legacy entries only held a fingerprint. A single bounded scan also rebinds reordered M3U IDs.
    const missing=new Set(wanted.filter(record=>!found.has(record.fingerprint)).map(record=>record.fingerprint));
    const segments=(manifest as typeof manifest & {segments?:Array<{kind:string;fileName:string}>}).segments;
    if(missing.size && storage.readActiveSegment)for(const segment of Array.isArray(segments)?segments:[]) {
      const kind=segment.kind==='movies'?'movie':segment.kind==='series'?'series':undefined;
      if(!kind)continue;check();
      const raw=await storage.readActiveSegment(resolveSegmentRelativePath(segment.fileName));check();
      if(!raw)throw Error('FAVORITES_SEGMENT_UNAVAILABLE');
      const items:unknown=JSON.parse(raw);
      if(!Array.isArray(items))throw Error('FAVORITES_SEGMENT_INVALID');
      for(let index=0;index<items.length;index++) {
        const item=items[index] as Movie|Series;
        if(item && typeof item.id==='string' && typeof item.title==='string') {
          const fingerprint=watchFingerprint(kind,item);
          if(missing.has(fingerprint)){accept(kind,item,fingerprint);if(found.has(fingerprint))missing.delete(fingerprint);}
        }
        if(index%200===199){await new Promise<void>(resolve=>setTimeout(resolve,0));check();}
      }
      if(!missing.size)break;
    }
    if((await storage.readActivePointer())?.snapshotId!==snapshot)throw Error('FAVORITES_GENERATION_CHANGED');
  }
  check();return wanted.flatMap(record=>found.has(record.fingerprint)?[found.get(record.fingerprint)!]:[]);
}
