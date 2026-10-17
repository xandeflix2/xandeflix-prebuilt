import type { LiveChannel } from '../catalog/live/live-tv.types.ts';

export const LIVE_FAVORITE_HOLD_MS = 2000;
type Timer = ReturnType<typeof setTimeout>;
interface Clock { now:()=>number; delay:(run:()=>void,ms:number)=>Timer; clear:(timer:Timer)=>void }
interface Press { channel:LiveChannel; input:'key'|'pointer'; held:boolean; x:number; y:number; pointer?:number; timer?:Timer }
const clock:Clock={now:()=>Date.now(),delay:(run,ms)=>setTimeout(run,ms),clear:timer=>clearTimeout(timer)};

/** One metadata action per physical hold; never changes playback on a long press. */
export class LiveChannelPress {
  private active?:Press;
  private blocked?:{id:string;until:number};
  private select:(channel:LiveChannel)=>void;
  private favorite:(channel:LiveChannel)=>void;
  private time:Clock;
  constructor(select:(channel:LiveChannel)=>void,favorite:(channel:LiveChannel)=>void,time:Clock=clock){this.select=select;this.favorite=favorite;this.time=time;}
  private start(channel:LiveChannel,input:Press['input'],x=0,y=0,pointer?:number){
    if(this.active?.channel.id===channel.id&&this.active.input===input)return;
    this.cancel();this.blocked=undefined;
    const press:Press={channel,input,held:false,x,y,pointer};this.active=press;
    press.timer=this.time.delay(()=>{
      if(this.active!==press)return;
      press.timer=undefined;press.held=true;
      this.blocked={id:channel.id,until:Infinity};this.favorite(channel);
    },LIVE_FAVORITE_HOLD_MS);
  }
  keyDown(channel:LiveChannel,repeat=false){if(!repeat)this.start(channel,'key');}
  keyUp(id:string){
    const press=this.active;if(!press||press.input!=='key'||press.channel.id!==id)return;
    if(press.timer!==undefined)this.time.clear(press.timer);this.active=undefined;
    this.blocked={id,until:this.time.now()+500};
    if(!press.held)this.select(press.channel);
  }
  pointerDown(channel:LiveChannel,pointer:number,x:number,y:number){this.start(channel,'pointer',x,y,pointer);}
  pointerMove(pointer:number,x:number,y:number){
    const press=this.active;if(press?.input!=='pointer'||press.pointer!==pointer)return;
    if(Math.hypot(x-press.x,y-press.y)>10)this.cancel();
  }
  pointerUp(pointer:number){
    const press=this.active;if(press?.input!=='pointer'||press.pointer!==pointer)return;
    if(press.timer!==undefined)this.time.clear(press.timer);this.active=undefined;
    if(press.held)this.blocked={id:press.channel.id,until:this.time.now()+500};
  }
  cancel(id?:string){
    const press=this.active;if(!press||(id!==undefined&&press.channel.id!==id))return;
    if(press.timer!==undefined)this.time.clear(press.timer);this.active=undefined;
    this.blocked={id:press.channel.id,until:this.time.now()+500};
  }
  click(channel:LiveChannel){
    if(this.active?.channel.id===channel.id)return;
    if(this.blocked?.id===channel.id&&this.time.now()<=this.blocked.until)return;
    this.select(channel);
  }
}

export function isLiveConfirmKey(event:{key:string;code?:string;keyCode?:number}):boolean {
  return event.key==='Enter'||event.key===' '||event.code==='NumpadEnter'||event.keyCode===23||event.keyCode===13;
}
