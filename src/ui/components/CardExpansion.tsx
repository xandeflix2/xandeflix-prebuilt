import React,{useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {installExpandedCards,eligibleExpansionRail,type CardSelection} from '../expanded-card-controller.ts';
import {cardPreviewSession} from '../card-preview-session.ts';
import {openCardPreview} from '../card-preview-media.ts';
import {heroArtworkIdentity} from '../../artwork/hero-artwork.service.ts';
import {tmdbMetadataService} from '../../artwork/tmdb-metadata.service.ts';
import {resolveMoviePresentation,resolveSeriesPresentation,selectPreviewTrailer} from '../../artwork/series-presentation.service.ts';
import {DetailBackdrop} from './DetailBackdrop.tsx';
import './CardExpansion.css';

export function CardExpansionHost({view}:{view:string}):React.ReactElement|null{
  const [selection,setSelection]=useState<CardSelection|null>(null);
  useEffect(()=>installExpandedCards(['home','movies','series'].includes(view),setSelection),[view]);
  // Keep the portal container and component identity while moving to another card.
  const [surface]=useState(()=>{const node=document.createElement('div');node.className='card-expansion-host';return node;});
  useLayoutEffect(()=>{const parent=selection?.element.querySelector('.media-card-poster-wrapper');if(parent)parent.append(surface);else surface.remove();return()=>surface.remove();},[selection,surface]);
  return selection?createPortal(<ExpandedCard selection={selection}/>,surface):null;
}

function ExpandedCard({selection}:{selection:CardSelection}):React.ReactElement{
  const {item,element}=selection,root=useRef<HTMLDivElement>(null);
  const [playing,setPlaying]=useState(false);
  const identity=useMemo(()=>heroArtworkIdentity(item),[item]);
  useEffect(()=>{
    setPlaying(false);
    if(!root.current)return;
    const current=()=>Boolean(element.isConnected&&eligibleExpansionRail(element))&&document.activeElement===element&&element.dataset.cardPreviewIdentity===selection.identity;
    const stop=cardPreviewSession.schedule(async signal=>{
      if(signal.aborted||!current()||navigator.onLine===false)return null;
      const matched=await tmdbMetadataService.resolve(identity,'high');
      if(!matched||signal.aborted||!current())return null;
      const presentation=await (identity.kind==='movie'?resolveMoviePresentation(identity):resolveSeriesPresentation(identity));
      if(signal.aborted||!current()||presentation?.tmdbId!==matched.tmdbId)return null;
      return selectPreviewTrailer(presentation)?.key||null;
    },async(videoId,signal)=>{
      if(!root.current||!current()||signal.aborted)return null;
      return openCardPreview(root.current,videoId,signal,setPlaying);
    },{startupMs:25000,delayMs:Math.max(0,1000-(performance.now()-(selection.focusedAt??performance.now())))});
    return stop;
  },[identity,element,selection.identity]);
  return <div ref={root} className="card-expansion" aria-hidden="true" data-card-preview-playing={playing||undefined}>
    <DetailBackdrop title={item.title} identity={identity} backdrop={item.backdropUri} poster={item.posterUri} className="card-expansion-image" preview/>
    {!playing&&<div className="card-expansion-copy"><strong>{item.title}</strong>
      <span>{[item.yearFormatted,...item.genreLabels.filter(value=>!/^geral$/i.test(value.trim())).slice(0,2)].filter(Boolean).join(' · ')}</span>
      {item.overviewSnippet&&<p>{item.overviewSnippet}</p>}
    </div>}
  </div>;
}
