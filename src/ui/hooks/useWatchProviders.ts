import {useEffect,useState} from 'react';
import {artworkIdentityKey,type ArtworkIdentity} from '../../artwork/tmdb-metadata.service.ts';
import {tmdbWatchProvidersService,type WatchAvailability} from '../../artwork/tmdb-watch-providers.service.ts';

export function useWatchProviders(identity:ArtworkIdentity|undefined):WatchAvailability|null {
  const key=identity?artworkIdentityKey(identity):'',{kind,title,year,tmdbId,posterPath,sourcePosterUri,originCountry,network,hasEpisodes}=identity||{};
  const[state,setState]=useState<{key:string;value:WatchAvailability|null}>();
  useEffect(()=>{if(!kind||!title)return;let active=true;
    const timer=setTimeout(()=>{void tmdbWatchProvidersService.resolve({kind,title,year,tmdbId,posterPath,sourcePosterUri,originCountry,network,hasEpisodes}).then(value=>{if(active)setState({key,value});},()=>{});},250);
    return()=>{active=false;clearTimeout(timer);};
  },[key,kind,title,year,tmdbId,posterPath,sourcePosterUri,originCountry,network,hasEpisodes]);
  return state?.key===key?state.value:tmdbWatchProvidersService.peek(identity);
}
export function usePlatformLogo(label:string):{uri:string|undefined;failed:()=>void} {
  const[state,setState]=useState<{label:string;uri?:string}>();
  useEffect(()=>{let active=true;
    void tmdbWatchProvidersService.logo(label).then(uri=>{if(active)setState({label,uri});},()=>{});
    return()=>{active=false;};
  },[label]);
  return{uri:state?.label===label?state.uri:tmdbWatchProvidersService.peekLogo(label),failed:()=>setState({label})};
}

const readyPlatformImages=new Map<string,HTMLImageElement>();
const pendingPlatformImages=new Map<string,Promise<void>>();

/** Optional small public logos: overlap artwork preparation, never hold hero readiness. */
export async function warmPlatformLogos(labels:readonly string[]):Promise<void> {
  if(typeof Image==='undefined')return;
  const selected=[...new Set(labels.slice(0,64).map(label=>label.trim().replace(/^(?:s[eé]ries|filmes)\s*\|\s*/i,'').trim().slice(0,100)).filter(Boolean))].slice(0,8);
  await Promise.allSettled(selected.map(async label=>{
    const uri=await tmdbWatchProvidersService.logo(label);
    if(!uri||!/^https:\/\/image\.tmdb\.org\/t\/p\/w45\/[A-Za-z0-9_.-]+$/.test(uri)||readyPlatformImages.has(uri))return;
    const pending=pendingPlatformImages.get(uri);if(pending)return pending;
    if(pendingPlatformImages.size>=8)return;
    const image=new Image();let resolve!:()=>void;
    const completion=new Promise<void>(done=>{resolve=done;});pendingPlatformImages.set(uri,completion);
    let finished=false;
    const finish=(loaded:boolean)=>{
      if(finished)return;finished=true;clearTimeout(timer);image.onload=null;image.onerror=null;pendingPlatformImages.delete(uri);
      if(loaded){readyPlatformImages.set(uri,image);while(readyPlatformImages.size>16)readyPlatformImages.delete(readyPlatformImages.keys().next().value!);}
      else image.removeAttribute('src');
      resolve();
    };
    const timer=setTimeout(()=>finish(false),8000);
    image.onload=()=>finish(image.naturalWidth>0);image.onerror=()=>finish(false);
    image.decoding='async';image.referrerPolicy='no-referrer';
    Object.assign(image,{fetchPriority:'low'});
    try{image.src=uri;}catch{finish(false);}
    return completion;
  }));
}
