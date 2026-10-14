import { useEffect, useState } from 'react';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { artworkIdentityKey } from '../../artwork/tmdb-metadata.service.ts';
import { heroArtworkIdentity, heroArtworkService, type HeroImageProfile } from '../../artwork/hero-artwork.service.ts';
import { reserveHeroImageSlot } from '../../artwork/image-load-queue.ts';

export function useHeroArtwork(items: readonly CatalogItemViewModel[], profile: HeroImageProfile, limit = 20, maxPerKind = 0) {
  const [revision, update] = useState(0);
  const [pendingState, setPendingState] = useState({selection:'',pending:true});
  const [retryEpoch,setRetryEpoch]=useState(0);
  const signature=items.map(item=>`${item.kind}:${item.id}:${artworkIdentityKey(heroArtworkIdentity(item))}`).join('|');
  const selection=profile+':'+signature;
  const target=Math.min(limit,maxPerKind
    ? Math.min(maxPerKind,items.filter(item=>item.kind==='movie').length)+Math.min(maxPerKind,items.filter(item=>item.kind==='series').length)
    : items.length);
  const pending=pendingState.selection===selection?pendingState.pending:true;
  useEffect(()=>{
    const releaseHero=reserveHeroImageSlot();
    let active=true,retries=0,timer:ReturnType<typeof setTimeout>|undefined;
    const scan=async()=>{
      setPendingState({selection,pending:true});let index=0,found=0;const counts={movie:0,series:0};
      const worker=async()=>{while(active && index<items.length && found<limit){const item=items[index++];if(maxPerKind && counts[item.kind]>=maxPerKind)continue;
        // Once an actual hero is ready, visible covers outrank the remaining
        // carousel candidates. Background images still flow through the bounded queue.
        const uri=await heroArtworkService.resolve(item,profile,found===0?'high':'normal');if(!active)return;if(uri){found++;counts[item.kind]++;releaseHero();}update(v=>v+1);}};
      await Promise.all([worker(),worker()]);releaseHero();if(!active)return;setPendingState({selection,pending:false});
      if(found<target && retries++<2)timer=setTimeout(()=>{heroArtworkService.retryFailures();void scan();},30000);
    };
    const online=()=>{if(timer)clearTimeout(timer);heroArtworkService.retryFailures();void scan();};
    void scan();window.addEventListener('online',online);
    return()=>{active=false;releaseHero();if(timer)clearTimeout(timer);window.removeEventListener('online',online);};
  },[selection,profile,limit,maxPerKind,target,retryEpoch]);
  const eligible=items.flatMap(item=>{const uri=heroArtworkService.peek(item,profile);return uri?[{item,uri}]:[];}).slice(0,limit);
  return {eligible,pending,revision,reject:(item:CatalogItemViewModel)=>{heroArtworkService.invalidate(item,profile);update(v=>v+1);setRetryEpoch(v=>v+1);}};
}
