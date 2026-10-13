import React,{useEffect,useRef,useState} from 'react';
import { Browser } from '@capacitor/browser';
import { Artwork } from './Artwork.tsx';
import type {ArtworkIdentity} from '../../artwork/tmdb-metadata.service.ts';
import {PublicTrailer,hasPublicTrailer,type TrailerBounds} from '../../playback/public-trailer.bridge.ts';
import type {SeriesPresentation} from '../../artwork/series-presentation.service.ts';

export function SeriesTrailer({title,identity,backdrop,poster,trailer,loading,presentation='inline',autoPlay=false}:{title:string;identity:ArtworkIdentity;backdrop?:string;poster?:string;trailer?:SeriesPresentation['trailer'];loading:boolean;presentation?:'inline'|'modal';autoPlay?:boolean}):React.ReactElement{
  const [requested,setRequested]=useState(autoPlay),[failed,setFailed]=useState(false),[ready,setReady]=useState(false),[visible,setVisible]=useState(true);
  const root=useRef<HTMLDivElement>(null),frame=useRef<HTMLIFrameElement>(null);
  const native=hasPublicTrailer();
  const [sessionId]=useState(()=>`trailer-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const videoId=trailer?.key;
  useEffect(()=>{
    if(!requested||failed||!videoId||!root.current)return;
    let active=true,raf:number|undefined,opened=false;
    let lastBounds:TrailerBounds|undefined;
    let removeListener:(()=>Promise<void>)|undefined;
    const bounds=():TrailerBounds=>{
      const rect=root.current!.getBoundingClientRect();
      const header=presentation==='inline'?document.querySelector('.app-header')?.getBoundingClientRect():undefined;
      const nav=presentation==='inline'?document.querySelector('.mobile-bottom-nav')?.getBoundingClientRect():undefined;
      const inView=rect.top>=Math.max(0,header?.bottom||0)-1 && rect.bottom<=Math.min(window.innerHeight,nav?.top||window.innerHeight)+1 && !document.hidden;
      setVisible(inView);
      return {x:rect.left,y:rect.top,width:rect.width,height:rect.height,viewportWidth:window.innerWidth,visible:inView};
    };
    const update=()=>{if(!active)return;if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{
      if(!active)return;const value=bounds();
      if(native && opened && (!lastBounds || value.visible!==lastBounds.visible || (['x','y','width','height','viewportWidth'] as const).some(key=>Math.abs(value[key]-lastBounds![key])>.5))){lastBounds=value;void PublicTrailer.bounds({...value,sessionId}).catch(()=>{});}
      if(!native && !value.visible)frame.current?.contentWindow?.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}),'https://www.youtube.com');
    });};
    if(native){
      void(async()=>{
        const listener=await PublicTrailer.addListener('trailerState',event=>{
          if(!active||event.sessionId!==sessionId)return;
          if(event.state==='ready')setReady(true);
          else if(event.state==='paused')setRequested(false);
          else if(event.state==='error')setFailed(true);
        });
        if(!active){await listener.remove();return;}removeListener=()=>listener.remove();
        const initialBounds=bounds();
        await PublicTrailer.open({...initialBounds,sessionId,videoId,presentation});
        lastBounds=initialBounds;
        opened=true;if(!active)await PublicTrailer.close({sessionId});else update();
      })().catch(()=>{if(active)setFailed(true);});
    }
    const observer=new ResizeObserver(update);observer.observe(root.current);
    window.addEventListener('scroll',update,{capture:true,passive:true});window.addEventListener('resize',update);document.addEventListener('visibilitychange',update);update();
    return()=>{active=false;if(raf)cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('scroll',update,true);window.removeEventListener('resize',update);document.removeEventListener('visibilitychange',update);void removeListener?.();if(native)void PublicTrailer.close({sessionId}).catch(()=>{});};
  },[requested,failed,native,sessionId,videoId,presentation]);
  const start=()=>{
    if(root.current && presentation==='inline'){root.current.style.scrollMarginTop=`${Math.max(0,document.querySelector('.app-header')?.getBoundingClientRect().bottom||0)}px`;root.current.scrollIntoView({behavior:'auto',block:'start'});}
    setFailed(false);setReady(false);setRequested(true);
  };
  const publicUrl=videoId?`https://www.youtube.com/watch?v=${videoId}`:undefined;
  const control=(command:'play'|'pause')=>{
    if(native)void PublicTrailer.control({sessionId,command}).catch(()=>setFailed(true));
    else frame.current?.contentWindow?.postMessage(JSON.stringify({event:'command',func:command==='play'?'playVideo':'pauseVideo',args:[]}),'https://www.youtube.com');
  };
  return <section className="series-trailer" aria-label={`Trailer de ${title}`}>
    <div ref={root} className="series-trailer-frame">
      {requested && !failed && videoId && !native ? <iframe ref={frame} title={`Trailer de ${title}`} src={`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&enablejsapi=1&rel=0&origin=${encodeURIComponent(location.origin)}`} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen onLoad={()=>setReady(true)}/>
        : <Artwork uri={backdrop} fallbackUri={poster} identity={identity} kind="backdrop" tmdbBackdropOnly priority="high" immersiveArtwork="backdrop" title={title} className="series-trailer-cover"/>}
      {!requested || failed || !videoId ? <div className="series-trailer-overlay">
        {videoId && !failed ? <button className="focusable-item series-trailer-play" type="button" onClick={start} aria-label={`Assistir trailer de ${title}`}><span aria-hidden="true">▶</span><span>Assistir trailer</span></button>
          : <p role="status">{failed?'Não foi possível reproduzir o trailer.':loading?'Buscando trailer…':identity.kind==='movie'?'Trailer indisponível para este filme.':'Trailer indisponível para esta série.'}</p>}
      </div> : !ready && visible ? <p className="series-trailer-loading" role="status">Carregando trailer…</p> : null}
    </div>
    {presentation==='modal' && requested && !failed && videoId && <div className="detail-trailer-controls">
      <button type="button" className="focusable-item btn-secondary" disabled={!ready} onClick={()=>control('play')}>▶ Reproduzir</button>
      <button type="button" className="focusable-item btn-secondary" disabled={!ready} onClick={()=>control('pause')}>Ⅱ Pausar</button>
    </div>}
    {publicUrl && presentation==='inline' && <button type="button" className="focusable-item series-trailer-external" onClick={()=>{setRequested(false);void Browser.open({url:publicUrl}).catch(()=>setFailed(true));}}>Abrir trailer no YouTube ↗</button>}
  </section>;
}
