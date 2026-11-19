import type {Movie,Series} from '../contracts/catalog.ts';
import type {CatalogReadModel} from './catalog-read-model.ts';
import type {CatalogItemViewModel} from './catalog-view-model.ts';
import type {LocalCatalogStorage} from '../bootstrap/storage/storage.interface.ts';
import type {PersonCredit} from '../artwork/tmdb-person.service.ts';
import {movieToViewModel,seriesToViewModel} from './catalog-selectors.ts';
import {normalizeArtworkIdentity,tmdbPosterPath,tmdbMetadataService} from '../artwork/tmdb-metadata.service.ts';
import {isAdultCatalogItem} from '../playback/content-adult-policy.ts';
import {resolveSegmentRelativePath} from '../bootstrap/storage/segment-path-resolver.ts';
const key=(value:string)=>value.toLowerCase().replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
/** Explicit identity or exact public poster plus full title. A name alone never grants a match. */
export function actorCreditMatches(item:CatalogItemViewModel,credit:PersonCredit):boolean {
  if(item.kind!==credit.kind)return false;
  const identity=normalizeArtworkIdentity({kind:item.kind,title:item.title,year:item.yearFormatted,tmdbId:item.externalIds?.tmdbId});
  if(identity.year&&credit.year&&Number(identity.year)!==credit.year)return false;
  const names=[key(identity.title),key(item.originalTitle||'')].filter(Boolean),wanted=[key(credit.title),key(credit.originalTitle||'')].filter(Boolean);
  if(!names.some(n=>wanted.includes(n)))return false;
  if(identity.tmdbId)return Number(identity.tmdbId)===credit.id;
  const cached=tmdbMetadataService.peek({...identity,posterPath:tmdbPosterPath(item.posterUri),sourcePosterUri:item.posterUri});
  if(cached)return cached.tmdbId===credit.id;
  return Boolean(credit.posterPath&&tmdbPosterPath(item.posterUri)===credit.posterPath);
}
/** Sequential local segments only; remote credits are never materialized as catalog entries. */
export async function loadActorTitles(model:CatalogReadModel,credits:readonly PersonCredit[],storage:LocalCatalogStorage,signal:AbortSignal):Promise<CatalogItemViewModel[]> {
  const snapshot=model.catalog.metadata.snapshotId,chosen=new Map<string,CatalogItemViewModel>(),byName=new Map<string,PersonCredit[]>();
  for(const c of credits)for(const name of new Set([key(c.title),key(c.originalTitle||'')].filter(Boolean))){const k=c.kind+':'+name;const list=byName.get(k)||[];list.push(c);byName.set(k,list);}
  const check=()=>{if(signal.aborted)throw Error('ACTOR_CANCELLED');};
  const add=(row:Movie|Series,kind:'movie'|'series')=>{if(!row||typeof row.title!=='string'||!row.id||byName.size===0||isAdultCatalogItem(row,model))return;
    const rawKey=kind+':'+key(row.title),origKey=(row as {originalTitle?:string}).originalTitle?kind+':'+key((row as {originalTitle?:string}).originalTitle!):'';
    const normTitle=normalizeArtworkIdentity({kind,title:row.title,year:row.year}).title,normKey=kind+':'+key(normTitle);
    if(!byName.has(rawKey)&&(!origKey||!byName.has(origKey))&&!byName.has(normKey))return;
    const item=kind==='movie'?movieToViewModel(model,row as Movie):seriesToViewModel(model,row as Series);
    const title=normalizeArtworkIdentity({kind,title:item.title,year:item.yearFormatted}).title;
    const candidates=[...(byName.get(kind+':'+key(title))||[]),...(byName.get(kind+':'+key(item.originalTitle||''))||[])];
    const credit=candidates.find(c=>actorCreditMatches(item,c));if(credit&&!chosen.has(kind+':'+credit.id))chosen.set(kind+':'+credit.id,item);
  };
  check();const manifest=await storage.readActiveManifest() as {snapshotId?:string;segments?:Array<{kind?:string;fileName?:string}>}|null;check();if(manifest?.snapshotId&&manifest.snapshotId!==snapshot)throw Error('ACTOR_SNAPSHOT_CHANGED');
  for(const row of model.moviesById.values())add(row,'movie');for(const row of model.seriesById.values())add(row,'series');
  for(const file of manifest?.segments||[]){if((file.kind!=='movies'&&file.kind!=='series')||!file.fileName)continue;check();const raw=await storage.readActiveSegment?.(resolveSegmentRelativePath(file.fileName));check();if(!raw)throw Error('ACTOR_SEGMENT_UNAVAILABLE');const rows:unknown=JSON.parse(raw);if(!Array.isArray(rows))throw Error('ACTOR_SEGMENT_INVALID');for(const row of rows)add(row,file.kind==='movies'?'movie':'series');await new Promise<void>(resolve=>setTimeout(resolve,0));}
  const pointer=await storage.readActivePointer();check();if(pointer&&pointer.snapshotId!==snapshot)throw Error('ACTOR_SNAPSHOT_CHANGED');return[...chosen.values()];
}
