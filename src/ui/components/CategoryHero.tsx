import React from 'react';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { useHeroArtwork } from '../hooks/useHeroArtwork.ts';
import { Hero } from './Hero.tsx';
import { useHeroLayout } from '../hooks/useHeroLayout.ts';

export function HeroPreparing({pending,vertical=false}:{pending:boolean;vertical?:boolean}): React.ReactElement {
  return <section className={`${pending?'hero-banner hero-preparing':'hero-unavailable'}${pending&&vertical?' hero-banner--vertical':''}`} aria-label="Destaques" aria-busy={pending}>
    <p role="status">{pending?'Preparando destaque com imagem…':'Nenhum destaque com imagem TMDB disponível nesta seleção.'}</p>
  </section>;
}
export function CategoryHero({items,onSelect,onPlay,playbackBusy,playbackMessage}:{items:CatalogItemViewModel[];onSelect:(item:CatalogItemViewModel)=>void;onPlay?:(item:CatalogItemViewModel)=>void;playbackBusy?:boolean;playbackMessage?:string|null}): React.ReactElement {
  const phone=useHeroLayout();
  const candidates=items.slice(0,48);
  const artwork=useHeroArtwork(candidates,phone?'vertical':'horizontal',1);
  // Only after the horizontal scan, try an official portrait of the same candidates.
  const poster=useHeroArtwork(!phone&&!artwork.pending&&!artwork.eligible.length?candidates:[],'vertical',1);
  const composition=!artwork.eligible.length?poster.eligible[0]:undefined;
  const selected=artwork.eligible[0]||composition;
  return selected?<div className={composition?'hero-official-composition':undefined}><Hero item={selected.item} artworkUri={selected.uri} onArtworkError={()=>composition?poster.reject(selected.item):artwork.reject(selected.item)} onSelect={onSelect} onPlay={onPlay} playbackBusy={playbackBusy} playbackMessage={playbackMessage} headingLevel={2} mobilePoster={phone}/></div>
    :<HeroPreparing pending={artwork.pending||(!phone&&poster.pending)} vertical={phone}/>;
}
