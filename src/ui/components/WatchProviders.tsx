import React,{useState} from 'react';
import type {ArtworkIdentity} from '../../artwork/tmdb-metadata.service.ts';
import type {WatchProvider} from '../../artwork/tmdb-watch-providers.service.ts';
import {useWatchProviders} from '../hooks/useWatchProviders.ts';
function providerBrand(name:string):{key:string;rank:number}{
  const key=name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
  // Commercial variants have distinct TMDB IDs and artwork. Group only known
  // aliases; an unrelated service sold through Amazon remains its own brand.
  if(/^(?:amazon)?primevideo(?:withads|comanuncios)?$/.test(key))return{key:'primevideo',rank:/withads|comanuncios/.test(key)?1:0};
  if(key==='amazonvideo')return{key:'primevideo',rank:2};
  const base=key.replace(/(?:withads|comanuncios|amazonchannel)$/,'');
  const brands:Record<string,string>={netflix:'netflix',disneyplus:'disneyplus',disney:'disneyplus',hbo:'hbomax',hbomax:'hbomax',max:'hbomax',globoplay:'globoplay'};
  return brands[base]?{key:brands[base],rank:base===key?0:1}:{key,rank:0};
}
export function uniqueWatchProviders(rows:WatchProvider[]):WatchProvider[]{
  const brands=new Map<string,{provider:WatchProvider;rank:number}>();
  for(const provider of rows){
    if(!provider.logo)continue;
    const {key,rank}=providerBrand(provider.name),previous=brands.get(key);
    if(!previous||rank<previous.rank)brands.set(key,{provider,rank});
  }
  const ids=new Set<number>(),logos=new Set<string>();
  return [...brands.values()].map(row=>row.provider).filter(provider=>{
    if(ids.has(provider.id)||logos.has(provider.logo!))return false;
    ids.add(provider.id);logos.add(provider.logo!);return true;
  }).slice(0,16);
}
function Provider({provider}:{provider:WatchProvider}):React.ReactElement|null{
  const[failed,setFailed]=useState(false);
  if(!provider.logo||failed)return null;
  return <span className="watch-provider" title={provider.name}><img src={provider.logo} alt={provider.name} loading="lazy" decoding="async" onError={()=>setFailed(true)}/></span>;
}
export function WatchProviders({identity,inline=false}:{identity:ArtworkIdentity|undefined;inline?:boolean}):React.ReactElement|null{
  const availability=useWatchProviders(identity);
  if(!availability?.groups.length)return null;
  const providers=uniqueWatchProviders(availability.groups.flatMap(group=>group.providers));
  if(!providers.length)return null;
  const logos=providers.map(provider=><Provider key={provider.id} provider={provider}/>);
  return inline?<span className="watch-providers watch-providers--inline" role="group" tabIndex={0} aria-label="Plataformas deste conteúdo">{logos}</span>
    :<section className="watch-providers" aria-label="Plataformas deste conteúdo">{logos}</section>;
}
