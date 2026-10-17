import {useEffect,useState} from 'react';
import {artworkIdentityKey,type ArtworkIdentity} from '../../artwork/tmdb-metadata.service.ts';
import {tmdbWatchProvidersService,type WatchAvailability} from '../../artwork/tmdb-watch-providers.service.ts';

export function useWatchProviders(identity:ArtworkIdentity|undefined):WatchAvailability|null {
  const key=identity?artworkIdentityKey(identity):'',{kind,title,year,tmdbId,posterPath,sourcePosterUri}=identity||{};
  const[state,setState]=useState<{key:string;value:WatchAvailability|null}>();
  useEffect(()=>{if(!kind||!title)return;let active=true;
    const timer=setTimeout(()=>{void tmdbWatchProvidersService.resolve({kind,title,year,tmdbId,posterPath,sourcePosterUri}).then(value=>{if(active)setState({key,value});},()=>{});},250);
    return()=>{active=false;clearTimeout(timer);};
  },[key,kind,title,year,tmdbId,posterPath,sourcePosterUri]);
  return state?.key===key?state.value:tmdbWatchProvidersService.peek(identity);
}
export function usePlatformLogo(label:string):{uri:string|undefined;failed:()=>void} {
  const[state,setState]=useState<{label:string;uri?:string}>();
  useEffect(()=>{let active=true;const timer=setTimeout(()=>{void tmdbWatchProvidersService.logo(label).then(uri=>{if(active)setState({label,uri});},()=>{});},2000);
    return()=>{active=false;clearTimeout(timer);};
  },[label]);
  return{uri:state?.label===label?state.uri:undefined,failed:()=>setState({label})};
}
