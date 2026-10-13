import { Share } from '@capacitor/share';
export function seriesSharePayload(title:string,tmdbId?:number,kind:'movie'|'series'='series'){
  const clean=title.replace(/https?:\/\/\S+|[\r\n]/gi,' ').trim().slice(0,200);
  const fallback=kind==='movie'?'Filme':'Série';
  return {title:clean||fallback,text:clean||fallback,...(Number.isSafeInteger(tmdbId)&&tmdbId!>0?{url:`https://www.themoviedb.org/${kind==='movie'?'movie':'tv'}/${tmdbId}`}:{ }),dialogTitle:kind==='movie'?'Compartilhar filme':'Compartilhar série'};
}
export async function shareSeries(title:string,tmdbId?:number,kind:'movie'|'series'='series'):Promise<'shared'|'copied'|'cancelled'> {
  const payload=seriesSharePayload(title,tmdbId,kind);
  if((await Share.canShare()).value){try{await Share.share(payload);return 'shared';}catch{return 'cancelled';}}
  if(typeof navigator!=='undefined' && navigator.clipboard?.writeText){await navigator.clipboard.writeText([payload.text,payload.url].filter(Boolean).join('\n'));return 'copied';}
  throw new Error('Compartilhamento indisponível neste aparelho.');
}
