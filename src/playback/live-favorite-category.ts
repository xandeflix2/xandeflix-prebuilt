import type {LiveCatalog,LiveChannel} from '../catalog/live/live-tv.types.ts';
import type {LiveChannelPage} from '../catalog/live/live-catalog.service.ts';
import {favoriteLivePage,type FavoriteCursor,type LiveNavigationPort} from './live-player-navigation.ts';
import {liveChannelFingerprint} from './last-live-channel.ts';

export const LIVE_FAVORITES_GROUP_ID='__xandeflix_favorites__';
/** Read only local channel metadata, never create a second playback connection. */
export async function resolveLiveFavoriteCategory(catalog:LiveCatalog,keys:ReadonlySet<string>,port:LiveNavigationPort,signal:AbortSignal):Promise<LiveChannel[]> {
  if(keys.size>200)throw Error('LIVE_FAVORITES_LIMIT');
  const found=new Map<string,LiveChannel>();let cursor:FavoriteCursor|null={group:0,offset:0};
  while(cursor) {
    if(signal.aborted)throw Error('LIVE_NAVIGATION_CHANGED');
    const page=await favoriteLivePage(catalog,keys,port,signal,cursor);
    for(const channel of page.channels){const key=liveChannelFingerprint(channel,catalog);if(!found.has(key))found.set(key,channel);}
    if(page.next && page.next.group===cursor.group && page.next.offset===cursor.offset)throw Error('LIVE_NAVIGATION_INVALID');
    cursor=page.next;
  }
  return [...found.values()];
}
export function favoriteChannelPage(channels:readonly LiveChannel[],offset:number,filter=''):LiveChannelPage {
  if(!Number.isInteger(offset)||offset<0)throw Error('LIVE_FAVORITES_PAGE_INVALID');
  const query=filter.trim().toLocaleLowerCase();
  const rows=query?channels.filter(channel=>channel.name.toLocaleLowerCase().includes(query)):channels;
  return {channels:rows.slice(offset,offset+48),offset,totalAvailable:rows.length,nextOffset:offset+48<rows.length?offset+48:null};
}
