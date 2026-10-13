import React,{useRef,useState} from 'react';
import {seriesPersonalStore,type SeriesRating} from '../series-personal.store.ts';
import {shareSeries} from '../share-series.ts';

const labels:Record<SeriesRating,string>={dislike:'Não gostei',like:'Gostei',love:'Adorei'};
export function SeriesPersonalActions({fingerprint,title,tmdbId,kind='series'}:{fingerprint:string;title:string;tmdbId?:number;kind?:'movie'|'series'}):React.ReactElement{
  const noun=kind==='movie'?'filme':'série';
  const [value,setValue]=useState(()=>seriesPersonalStore.get(fingerprint)),[status,setStatus]=useState(''),[sharing,setSharing]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null);
  const rate=(rating?:SeriesRating)=>{setValue(seriesPersonalStore.set(fingerprint,{...value,rating}));setStatus(rating?`Avaliação: ${labels[rating]}.`:'Avaliação removida.');dialog.current?.close();};
  return <section className="series-personal-actions" aria-label={`Suas opções para ${kind==='movie'?'o filme':'a série'}`}>
    <div className="series-personal-buttons">
      <button type="button" className="focusable-item series-personal-button" aria-label={value.rating?`Avaliar ${noun}: ${labels[value.rating]}`:`Avaliar ${noun}`} onClick={()=>dialog.current?.showModal()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v11H3V10h4Zm0 0 6-8c2 0 2 2 1 6h5c2 0 2 2 1 4l-2 7c-.3 1-1 2-2 2H7"/></svg><span>{value.rating?labels[value.rating]:'Avaliar'}</span></button>
      <button type="button" className="focusable-item series-personal-button" aria-pressed={value.favorite} aria-label={value.favorite?'Remover dos favoritos':'Adicionar aos favoritos'} onClick={()=>{const next=seriesPersonalStore.set(fingerprint,{...value,favorite:!value.favorite});setValue(next);setStatus(next.favorite?'Adicionado aos favoritos.':'Removido dos favoritos.');}}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={value.favorite?'m4 12 5 5L20 6':'M12 3v18M3 12h18'}/></svg><span>Favoritos</span></button>
      <button type="button" className="focusable-item series-personal-button" disabled={sharing} onClick={()=>{setSharing(true);void shareSeries(title,tmdbId,kind).then(result=>setStatus(result==='copied'?'Título e link público copiados.':''),()=>setStatus('Não foi possível compartilhar neste aparelho.')).finally(()=>setSharing(false));}}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="4" r="3"/><circle cx="5" cy="12" r="3"/><circle cx="18" cy="20" r="3"/><path d="m8 10 7-4M8 14l7 4"/></svg><span>Compartilhar</span></button>
    </div>
    {status && <p role="status" aria-live="polite" className="series-personal-status">{status}</p>}
    <dialog ref={dialog} data-detail-modal className="series-rating-dialog modal-content" aria-label={`Avaliar ${noun}`}>
      <h2>{kind==='movie'?'O que achou deste filme?':'O que achou desta série?'}</h2>
      {(['dislike','like','love'] as const).map(rating=><button key={rating} type="button" className="focusable-item btn-secondary" aria-pressed={value.rating===rating} onClick={()=>rate(rating)}>{labels[rating]}</button>)}
      {value.rating && <button type="button" className="focusable-item btn-secondary" onClick={()=>rate()}>Remover avaliação</button>}
      <button type="button" className="focusable-item btn-secondary" onClick={()=>dialog.current?.close()}>Cancelar</button>
    </dialog>
  </section>;
}
