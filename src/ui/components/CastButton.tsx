import React,{ useEffect,useState } from 'react';
import { GoogleCast,hasGoogleCast } from '../../playback/google-cast.ts';
export function CastButton({iconOnly=false}:{iconOnly?:boolean}={}):React.ReactElement|null{
  const [state,setState]=useState<{mobile:boolean;connected:boolean;active:boolean}>();
  const [error,setError]=useState(false);
  useEffect(()=>{
    if(!hasGoogleCast())return;let current=true;
    const read=()=>void GoogleCast.status().then(value=>{if(current)setState(value);},()=>{});
    let timer:ReturnType<typeof setInterval>|undefined;
    void GoogleCast.status().then(value=>{if(current){setState(value);if(value.mobile)timer=setInterval(read,2000);}},()=>{});
    return()=>{current=false;if(timer)clearInterval(timer);};
  },[]);
  if(!state?.mobile)return null;
  return <span className={`cast-control${iconOnly?' cast-control--icon-only':''}`}>
    <button type="button" className={`focusable-item btn-secondary cast-button${state.connected?' cast-button--connected':''}`}
      aria-label={state.active?'Controlar transmissão na TV':'Transmitir pelo Google Cast'} title={state.connected?'TV conectada — use Assistir para transmitir':'Selecionar TV ou Chromecast'}
      onClick={()=>{setError(false);void GoogleCast.picker().catch(()=>setError(true));}}>
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M1 18v3h3a3 3 0 0 0-3-3m0-4v2a5 5 0 0 1 5 5h2a7 7 0 0 0-7-7m0-4v2a9 9 0 0 1 9 9h2A11 11 0 0 0 1 10M21 3H3a2 2 0 0 0-2 2v3h2V5h18v14h-7v2h7a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2"/></svg>
      {!iconOnly && <span>{state.active?'Transmitindo':state.connected?'TV conectada':'Transmitir'}</span>}
    </button>
    {state.connected && <button type="button" className="focusable-item btn-secondary" aria-label="Reproduzir neste aparelho" title="Neste aparelho" onClick={()=>{void GoogleCast.stop({returnLocal:true}).catch(()=>setError(true));}}>{iconOnly?<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/></svg>:'Neste aparelho'}</button>}
    {error && <span className="cast-error" role="status">Google Cast indisponível neste aparelho.</span>}
  </span>;
}
