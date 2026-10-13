import React from 'react';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { useHeroArtwork } from '../hooks/useHeroArtwork.ts';
import { Hero } from './Hero.tsx';
import { useHeroLayout } from '../hooks/useHeroLayout.ts';

export function HeroPreparing({pending,vertical=false}:{pending:boolean;vertical?:boolean}): React.ReactElement {
  return <section className={`hero-banner hero-preparing${vertical?' hero-banner--vertical':''}`} aria-label="Destaques" aria-busy={pending}>
    <p role="status">{pending?'Preparando destaque com imagem…':'Nenhum destaque com imagem TMDB disponível nesta seleção.'}</p>
  </section>;
}
export function CategoryHero({items,onSelect,onPlay,playbackBusy,playbackMessage}:{items:CatalogItemViewModel[];onSelect:(item:CatalogItemViewModel)=>void;onPlay?:(item:CatalogItemViewModel)=>void;playbackBusy?:boolean;playbackMessage?:string|null}): React.ReactElement {
  const phone=useHeroLayout();
  const artwork=useHeroArtwork(items.slice(0,48),phone?'vertical':'horizontal',1),selected=artwork.eligible[0];
  return selected?<Hero item={selected.item} artworkUri={selected.uri} onArtworkError={()=>artwork.reject(selected.item)} onSelect={onSelect} onPlay={onPlay} playbackBusy={playbackBusy} playbackMessage={playbackMessage} headingLevel={2} mobilePoster={phone}/>
    :<HeroPreparing pending={artwork.pending} vertical={phone}/>;
}
