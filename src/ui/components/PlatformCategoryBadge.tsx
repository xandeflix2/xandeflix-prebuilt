import React,{useState} from 'react';
import {usePlatformLogo} from '../hooks/useWatchProviders.ts';
export function PlatformCategoryLogo({label}:{label:string}):React.ReactElement|null{
  const logo=usePlatformLogo(label);
  const[loadedUri,setLoadedUri]=useState<string>();
  return logo.uri?<img className="hero-platform-logo" src={logo.uri} alt={label} decoding="async"
    style={{visibility:loadedUri===logo.uri?'visible':'hidden'}}
    onLoad={event=>setLoadedUri(event.currentTarget.currentSrc||event.currentTarget.src)} onError={logo.failed}/>:null;
}
