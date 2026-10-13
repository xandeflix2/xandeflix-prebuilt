import { Capacitor,registerPlugin,type PluginListenerHandle } from '@capacitor/core';
import { getPlaybackSessionService } from '../control-plane/client/playback-session.service.ts';
import { NativeAndroidPlayer } from './native-android-player.bridge.ts';
export const GoogleCast=registerPlugin<{
  status():Promise<{mobile:boolean;connected:boolean;active:boolean}>;
  picker():Promise<void>;renew():Promise<void>;stop(options?:{returnLocal?:boolean}):Promise<void>;
  addListener(event:'state',listener:(state:{active:boolean;connected:boolean})=>void):Promise<PluginListenerHandle>;
}>('GoogleCast');
export function hasGoogleCast():boolean{return Capacitor.getPlatform()==='android' && Capacitor.isPluginAvailable('GoogleCast');}
let timer:ReturnType<typeof setTimeout>|undefined,listener:PluginListenerHandle|undefined,epoch=0;
export async function stopGoogleCast():Promise<void>{
  epoch++;if(timer)clearTimeout(timer);timer=undefined;
  if(listener){void listener.remove();listener=undefined;}
  if(hasGoogleCast())await GoogleCast.stop().catch(()=>{});
}
/** Renew output only after existing C9 authority succeeds; no additional session. */
export async function armCastAuthorization():Promise<void>{
  if(!hasGoogleCast())return;
  const ticket=++epoch;if(timer)clearTimeout(timer);if(listener)void listener.remove();
  const renew=async()=>{
    if(ticket!==epoch)return;
    const service=getPlaybackSessionService(),session=service.getActiveSession();
    if(!session){await stopGoogleCast();void NativeAndroidPlayer.stopPlayback().catch(()=>{});return;}
    try {
      const result=await service.sendHeartbeat({sessionId:session.sessionId,deviceId:session.deviceId,sessionToken:session.sessionToken});
      if(ticket!==epoch)return;
      if(!result.success || (result.status ?? result.sessionStatus ?? 'ACTIVE')!=='ACTIVE'){
        await stopGoogleCast();void NativeAndroidPlayer.stopPlayback().catch(()=>{});await service.closeSession('CAST_AUTHORIZATION_LOST');return;
      }
      await GoogleCast.renew();timer=setTimeout(()=>void renew(),45000);
    }catch{if(ticket===epoch){await stopGoogleCast();void NativeAndroidPlayer.stopPlayback().catch(()=>{});await service.closeSession('CAST_AUTHORIZATION_LOST');}}
  };
  const handle=await GoogleCast.addListener('state',state=>{
    if(ticket!==epoch)return;if(timer)clearTimeout(timer);timer=undefined;
    if(state.active)void renew();
  }).catch(()=>undefined);
  if(ticket===epoch)listener=handle;else if(handle)void handle.remove();
}
