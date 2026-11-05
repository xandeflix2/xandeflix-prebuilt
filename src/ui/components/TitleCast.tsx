import React,{useEffect,useState} from 'react';
import {artworkIdentityKey,type ArtworkIdentity} from '../../artwork/tmdb-metadata.service.ts';
import {resolveMoviePresentation,resolveSeriesPresentation,type CastMember} from '../../artwork/series-presentation.service.ts';
export function TitleCast({identity,onSelectPerson}:{identity:ArtworkIdentity|undefined;onSelectPerson?:(person:CastMember)=>void}):React.ReactElement {
  const key=identity?artworkIdentityKey(identity):'';
  const [state,setState]=useState<{key:string;cast:CastMember[]}>();
  const [failedPhotos,setFailedPhotos]=useState<{key:string;photos:string[]}>();
  useEffect(()=>{if(!identity)return;let active=true;const resolve=identity.kind==='movie'?resolveMoviePresentation:resolveSeriesPresentation;void resolve(identity).then(value=>{if(active)setState({key,cast:value?.cast||[]});}).catch(()=>{if(active)setState({key,cast:[]});});return()=>{active=false;};},[key]);
  const photoKey=(person:CastMember)=>person.id+':'+person.profileUri;
  const cast=state?.key===key?state.cast.filter(person=>Boolean(person.profileUri)&&!(failedPhotos?.key===key&&failedPhotos.photos.includes(photoKey(person)))):[];
  const hideFailedPhoto=(event:React.SyntheticEvent<HTMLImageElement>,person:CastMember)=>{
    const card=event.currentTarget.closest<HTMLElement>('.detail-cast-person');
    if(card?.contains(document.activeElement)){
      const items=Array.from(card.parentElement?.querySelectorAll<HTMLElement>('.detail-cast-person')||[]),index=items.indexOf(card);
      const target=items[index+1]||items[index-1]||card.closest('main')?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      target?.focus();
    }
    setFailedPhotos(previous=>({key,photos:[...(previous?.key===key?previous.photos:[]),photoKey(person)]}));
  };
  if(identity&&state?.key!==key)return <p role="status">Carregando elenco…</p>;
  if(!cast.length)return <p role="status">Elenco indisponível para este título.</p>;
  const move=(event:React.KeyboardEvent<HTMLUListElement>)=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const items=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('.detail-cast-person')),current=(event.target as HTMLElement).closest<HTMLElement>('.detail-cast-person'),index=current?items.indexOf(current):-1;if(index<0)return;const next=event.key==='Home'?0:event.key==='End'?items.length-1:Math.max(0,Math.min(items.length-1,index+(event.key==='ArrowRight'?1:-1)));event.preventDefault();event.stopPropagation();items[next]?.focus();};
  return <section className="detail-cast" aria-label="Elenco" aria-roledescription="carrossel"><ul className="detail-cast-list" onKeyDown={move}>
    {cast.map(person=><li className="focusable-item detail-cast-person" tabIndex={0} role="button" aria-label={'Ver perfil de '+person.name} key={person.id} onClick={()=>onSelectPerson?.(person)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();onSelectPerson?.(person);}}} onFocus={event=>event.currentTarget.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'})}>
      <img key={person.profileUri} src={person.profileUri} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={event=>hideFailedPhoto(event,person)}/><span><strong>{person.name}</strong>{person.character?<small>{person.character}</small>:null}</span>
    </li>)}
  </ul></section>;
}
