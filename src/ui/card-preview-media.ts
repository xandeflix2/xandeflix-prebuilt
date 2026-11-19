import {PublicTrailer,hasPublicTrailer,type TrailerBounds} from '../playback/public-trailer.bridge.ts';
import type {PreviewHandle} from './card-preview-session.ts';
import {mountCardTrailer} from './dom-card-trailer.ts';

interface YouTubePlayer {unMute():void;setVolume(volume:number):void;playVideo():void;destroy():void;getIframe():HTMLIFrameElement}
interface YouTubeApi {Player:new(element:HTMLElement,options:Record<string,unknown>)=>YouTubePlayer}
type YouTubeWindow=Window & {YT?:YouTubeApi;onYouTubeIframeAPIReady?:()=>void};
let apiReady:Promise<YouTubeApi>|undefined;
function youtube():Promise<YouTubeApi>{
  const host=window as YouTubeWindow;if(host.YT?.Player)return Promise.resolve(host.YT);
  if(apiReady)return apiReady;
  apiReady=new Promise((resolve,reject)=>{
    const prior=host.onYouTubeIframeAPIReady,script=document.createElement('script');let done=false;
    const fail=()=>{if(done)return;done=true;clearTimeout(timer);apiReady=undefined;script.remove();host.onYouTubeIframeAPIReady=prior;reject(Error('PUBLIC_PREVIEW_UNAVAILABLE'));};
    const timer=setTimeout(fail,25000);
    host.onYouTubeIframeAPIReady=()=>{prior?.();if(done)return;if(host.YT?.Player){done=true;clearTimeout(timer);host.onYouTubeIframeAPIReady=prior;resolve(host.YT);}else fail();};
    script.src='https://www.youtube.com/iframe_api';script.async=true;script.referrerPolicy='strict-origin-when-cross-origin';script.onerror=fail;document.head.append(script);
  });return apiReady;
}

/** Public official embed only. No full movie/episode/source URL can enter this adapter. */
export function openCardPreview(element:HTMLElement,videoId:string,signal:AbortSignal,onPlaying:(playing:boolean)=>void):Promise<PreviewHandle|null>{
  if(signal.aborted||!element.isConnected||!/^[-\w]{11}$/.test(videoId)||navigator.onLine===false)return Promise.resolve(null);
  const native=hasPublicTrailer(),sessionId=`card-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return new Promise(resolve=>{
    let stopped=false,settled=false,issued=false,ready=false,raf=0;
    let player:YouTubePlayer|undefined,layer:HTMLDivElement|undefined,listener:{remove():Promise<void>}|undefined,closing:Promise<void>|undefined;
    let frame:ReturnType<typeof mountCardTrailer>|undefined;
    const bounds=():TrailerBounds=>{const r=element.getBoundingClientRect();return{x:r.left,y:r.top,width:r.width,height:r.height,viewportWidth:innerWidth,visible:!document.hidden&&r.width>=200&&r.height>=200&&r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1};};
    const settle=(value:PreviewHandle|null)=>{if(!settled){settled=true;resolve(value);}};
    const stop=():Promise<void>=>{
      if(stopped)return closing||Promise.resolve();stopped=true;clearTimeout(timeout);if(raf)cancelAnimationFrame(raf);observer.disconnect();
      signal.removeEventListener('abort',abort);window.removeEventListener('scroll',update,true);window.removeEventListener('resize',update);document.removeEventListener('visibilitychange',visibility);
      try{player?.destroy();}catch{/* Optional embed disposal. */}frame?.remove();layer?.remove();if(ready)onPlaying(false);settle(null);
      closing=Promise.allSettled([listener?.remove(),native&&issued?PublicTrailer.close({sessionId}):undefined]).then(()=>{});return closing;
    };
    const abort=()=>{void stop();};
    const playing=()=>{if(stopped||signal.aborted)return;if(!ready){ready=true;clearTimeout(timeout);frame?.show();if(layer)layer.style.opacity='1';onPlaying(true);settle({stop});}};
    const update=()=>{if(stopped||raf)return;raf=requestAnimationFrame(()=>{raf=0;if(stopped)return;if(!element.isConnected||!bounds().visible)void stop();});};
    const visibility=()=>{if(document.hidden)void stop();};
    const observer=new ResizeObserver(update),timeout=setTimeout(abort,25000);
    signal.addEventListener('abort',abort,{once:true});observer.observe(element);window.addEventListener('scroll',update,{capture:true,passive:true});window.addEventListener('resize',update);document.addEventListener('visibilitychange',visibility);
    if(!bounds().visible){void stop();return;}
    if(native){
      void(async()=>{
        const handle=await PublicTrailer.addListener('trailerState',event=>{
          if(stopped||event.sessionId!==sessionId)return;
          if(['error','ended','paused'].includes(event.state))void stop();
        });
        if(stopped){await handle.remove();return;}listener=handle;
        const initial=bounds();if(!initial.visible){await stop();return;}issued=true;
        const prepared=await PublicTrailer.prepareCardFrame({...initial,sessionId,videoId});
        if(stopped||signal.aborted||!element.isConnected||!bounds().visible){await stop();await PublicTrailer.close({sessionId});return;}
        frame=mountCardTrailer(element,sessionId,prepared,state=>{
          if(state==='playing')playing();
          else if(['error','ended','paused'].includes(state)||(state==='player-paused'&&ready))void stop();
        });
      })().catch(abort);
    }else{
      void youtube().then(api=>{
        if(stopped||signal.aborted||!element.isConnected)return;
        layer=document.createElement('div');layer.className='card-preview-player';layer.style.opacity='0';
        const holder=document.createElement('div');layer.append(holder);element.append(layer);
        player=new api.Player(holder,{width:'100%',height:'100%',videoId,playerVars:{autoplay:1,playsinline:1,controls:0,disablekb:1,fs:0,rel:0,origin:location.origin},events:{
          onReady:(event:{target:YouTubePlayer})=>{if(stopped){event.target.destroy();return;}event.target.getIframe().tabIndex=-1;event.target.unMute();event.target.setVolume(100);event.target.playVideo();},
          onStateChange:(event:{data:number})=>{if(event.data===1)playing();else if(event.data===0||(event.data===2&&ready))void stop();},onError:abort,onAutoplayBlocked:abort,
        }});
        if(stopped)player.destroy();
      },abort).catch(abort);
    }
  });
}
