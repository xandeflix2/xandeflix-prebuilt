/** The wrapper has its own origin and no app bridge. YouTube script never runs in the app document. */
export const CARD_TRAILER_ORIGIN='https://trailer.xandeflix.prebuilt';
export interface CardTrailerFrame {src:string;origin:string}
const states=new Set(['ready','playing','error','ended','paused','player-paused']);
export function mountCardTrailer(element:HTMLElement,sessionId:string,frame:CardTrailerFrame,onState:(state:string)=>void):{show():void;remove():void}{
  if(!/^[A-Za-z0-9_-]{1,96}$/.test(sessionId)||frame.origin!==CARD_TRAILER_ORIGIN||frame.src!==`${CARD_TRAILER_ORIGIN}/card/${sessionId}`)throw Error('Invalid card frame');
  const layer=document.createElement('div'),iframe=document.createElement('iframe');
  layer.className='card-preview-player';layer.style.opacity='0';
  iframe.setAttribute('sandbox','allow-scripts allow-same-origin');iframe.setAttribute('allow','autoplay; encrypted-media');
  iframe.setAttribute('aria-hidden','true');iframe.tabIndex=-1;iframe.referrerPolicy='strict-origin-when-cross-origin';
  iframe.style.pointerEvents='none';iframe.src=frame.src;
  let removed=false;
  const message=(event:MessageEvent)=>{
    if(removed||event.source!==iframe.contentWindow||event.origin!==CARD_TRAILER_ORIGIN)return;
    const data=event.data;
    if(!data||data.type!=='xandeflix-card-trailer'||data.sessionId!==sessionId||typeof data.state!=='string'||!states.has(data.state))return;
    onState(data.state);
  };
  window.addEventListener('message',message);layer.append(iframe);element.append(layer);
  return{show:()=>{if(!removed)layer.style.opacity='1';},remove:()=>{if(removed)return;removed=true;window.removeEventListener('message',message);layer.remove();}};
}
