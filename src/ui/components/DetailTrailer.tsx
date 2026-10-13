import React, {useEffect,useRef,useState} from 'react';
import {artworkIdentityKey,type ArtworkIdentity} from '../../artwork/tmdb-metadata.service.ts';
import {resolveMoviePresentation,resolveSeriesPresentation,type MoviePresentation} from '../../artwork/series-presentation.service.ts';
import {SeriesTrailer} from './SeriesTrailer.tsx';

interface Props {title:string;identity:ArtworkIdentity;backdrop?:string;poster?:string}

export function DetailTrailer(props:Props):React.ReactElement {
  const [open,setOpen]=useState(false);
  return <>
    <button type="button" data-detail-focus className="focusable-item btn-secondary detail-trailer-button" onClick={()=>setOpen(true)}>▶ Assistir trailer</button>
    {open && <TrailerDialog key={artworkIdentityKey(props.identity)} {...props} onClose={()=>setOpen(false)}/>}
  </>;
}

export function TrailerDialog({title,identity,backdrop,poster,onClose}:Props & {onClose:()=>void}):React.ReactElement {
  const dialog=useRef<HTMLDialogElement>(null);
  const [state,setState]=useState<{key:string;data:MoviePresentation|null}>();
  const key=artworkIdentityKey(identity);
  const {kind,title:identityTitle,year,tmdbId,posterPath,sourcePosterUri}=identity;
  useEffect(()=>{
    let active=true;
    const input={kind,title:identityTitle,year,tmdbId,posterPath,sourcePosterUri};
    const result=kind==='series'?resolveSeriesPresentation(input):resolveMoviePresentation(input);
    void result.then(data=>{if(active)setState({key,data});},()=>{if(active)setState({key,data:null});});
    return()=>{active=false;};
  },[key,kind,identityTitle,year,tmdbId,posterPath,sourcePosterUri]);
  useEffect(()=>{
    const element=dialog.current;
    if(!element)return;
    const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
    element.showModal();
    element.querySelector<HTMLButtonElement>('.detail-trailer-close')?.focus({preventScroll:true});
    return()=>{element.close();if(previous?.isConnected)previous.focus({preventScroll:true});};
  },[]);
  const extra=state?.key===key?state.data:null;
  const loading=state?.key!==key;
  const close=()=>dialog.current?.close();
  const keyboard=(event:React.KeyboardEvent<HTMLDialogElement>)=>{
    if(event.key==='Escape'||event.key==='Backspace'){
      event.preventDefault();event.stopPropagation();close();return;
    }
    if(!['Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    const buttons=[...event.currentTarget.querySelectorAll<HTMLElement>('.focusable-item:not([disabled])')].filter(button=>button.getClientRects().length>0);
    if(!buttons.length)return;
    event.preventDefault();event.stopPropagation();
    const index=buttons.indexOf(document.activeElement as HTMLElement);
    const backwards=event.key==='ArrowLeft'||event.key==='ArrowUp'||event.key==='Tab'&&event.shiftKey;
    const next=index<0?(backwards?buttons.length-1:0):(index+(backwards?-1:1)+buttons.length)%buttons.length;
    buttons[next]?.focus({preventScroll:true});
  };
  return <dialog ref={dialog} data-detail-modal className="detail-trailer-dialog modal-content" aria-label={`Trailer de ${title}`} onClose={onClose} onCancel={event=>{event.preventDefault();close();}} onKeyDown={keyboard}>
    <div className="detail-trailer-header">
      <h2>Trailer — {title}</h2>
      <button type="button" className="focusable-item btn-secondary detail-trailer-close" onClick={close} aria-label="Fechar trailer">✕ Fechar</button>
    </div>
    <SeriesTrailer key={`${key}:${extra?.trailer?.key||''}`} title={title} identity={identity} backdrop={backdrop} poster={poster} trailer={extra?.trailer} loading={loading} presentation="modal" autoPlay/>
  </dialog>;
}
