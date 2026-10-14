import type { CatalogItemViewModel } from '../catalog/catalog-view-model.ts';
import { artworkIdentityKey, chooseHeroPoster, tmdbMetadataService, tmdbPosterPath, type ArtworkMetadata } from './tmdb-metadata.service.ts';
import { loadImage, invalidateLoadedImage } from './image-load-queue.ts';

export type HeroImageProfile = 'horizontal' | 'vertical';
export function heroArtworkIdentity(item: CatalogItemViewModel) {
  return { kind: item.kind, title: item.title, year: item.yearFormatted, tmdbId: item.externalIds?.tmdbId, posterPath: tmdbPosterPath(item.posterUri), sourcePosterUri: item.posterUri };
}
export async function decodeHeroImage(uri: string, profile: HeroImageProfile = 'horizontal', priority: 'high' | 'normal' = 'high'): Promise<boolean> {
  const image=await loadImage(uri,priority === 'high');
  return image.ok && image.width>0 && image.height>0 && (profile==='horizontal'?image.width>image.height:image.height>image.width);
}
export class HeroArtworkService {
  private readonly cache = new Map<string, {uri?:string; expires:number}>();
  private readonly pending = new Map<string, Promise<string | undefined>>();
  private readonly queue: (() => void)[] = [];
  private active = 0;
  private readonly metadata: (item: CatalogItemViewModel, priority: 'high' | 'normal') => Promise<ArtworkMetadata | null>;
  private readonly decode: (uri:string,profile:HeroImageProfile,priority: 'high' | 'normal') => Promise<boolean>;
  constructor(metadata = (item: CatalogItemViewModel, priority: 'high' | 'normal') => tmdbMetadataService.resolve(heroArtworkIdentity(item), priority), decode = decodeHeroImage) { this.metadata = metadata; this.decode = decode; }
  private key(item:CatalogItemViewModel,profile:HeroImageProfile) { return `${profile}:${artworkIdentityKey(heroArtworkIdentity(item))}`; }
  peek(item:CatalogItemViewModel,profile:HeroImageProfile): string | undefined {
    const entry=this.cache.get(this.key(item,profile)); return entry && entry.expires>Date.now() ? entry.uri : undefined;
  }
  invalidate(item:CatalogItemViewModel,profile:HeroImageProfile): void { const key=this.key(item,profile),uri=this.cache.get(key)?.uri;if(uri)invalidateLoadedImage(uri);this.cache.set(key,{expires:Date.now()+60000}); }
  retryFailures(): void { for(const [key,value] of this.cache)if(!value.uri)this.cache.delete(key); }
  resolve(item:CatalogItemViewModel,profile:HeroImageProfile,priority: 'high' | 'normal' = 'high'): Promise<string | undefined> {
    const key=this.key(item,profile),entry=this.cache.get(key);
    if(entry && entry.expires>Date.now())return Promise.resolve(entry.uri);
    const pending=this.pending.get(key);if(pending)return pending;
    if(this.pending.size>=64)return Promise.resolve(undefined);
    let finish!:(value:string|undefined)=>void;
    const job=new Promise<string|undefined>(resolve=>{finish=resolve});this.pending.set(key,job);
    this.queue.push(()=>{this.active++;void(async()=>{
      let uri:string|undefined;
      try{const metadata=await this.metadata(item,priority);const candidate=profile==='horizontal'?metadata?.backdropUri:chooseHeroPoster(metadata,item.posterUri);
        if(candidate && /^https:\/\/image\.tmdb\.org\/t\/p\/(?:w342|w780|w1280)\/[A-Za-z0-9_.-]+$/.test(candidate) && await this.decode(candidate,profile,priority))uri=candidate;
      }catch{/* Optional presentation never blocks catalog. */}
      this.cache.delete(key);this.cache.set(key,{uri,expires:Date.now()+(uri?6*60*60*1000:60000)});
      while(this.cache.size>160)this.cache.delete(this.cache.keys().next().value!);
      this.pending.delete(key);this.active--;finish(uri);this.drain();
    })();});this.drain();return job;
  }
  private drain(){while(this.active<2 && this.queue.length)this.queue.shift()!();}
}
export const heroArtworkService = new HeroArtworkService();
