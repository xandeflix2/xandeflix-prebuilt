import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface TrailerBounds { x:number; y:number; width:number; height:number; viewportWidth:number; visible:boolean }
interface PublicTrailerPlugin {
  open(options:TrailerBounds & {sessionId:string;videoId:string;presentation?:'inline'|'modal'}):Promise<void>;
  bounds(options:TrailerBounds & {sessionId:string}):Promise<void>;
  control(options:{sessionId:string;command:'play'|'pause'}):Promise<void>;
  close(options:{sessionId:string}):Promise<void>;
  addListener(event:'trailerState',callback:(state:{sessionId:string;state:'ready'|'error'|'paused'|'playing'|'player-paused'})=>void):Promise<PluginListenerHandle>;
}
export const PublicTrailer=registerPlugin<PublicTrailerPlugin>('PublicTrailer');
export const hasPublicTrailer=()=>Capacitor.getPlatform()==='android' && Capacitor.isPluginAvailable('PublicTrailer');
