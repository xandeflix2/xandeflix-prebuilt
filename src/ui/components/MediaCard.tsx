import React from 'react';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { Artwork } from './Artwork.tsx';
import { displayArtworkUri } from '../../artwork/artwork-uri.ts';
import { loadImage } from '../../artwork/image-load-queue.ts';
import { useContentBadge } from './NewContentProvider.tsx';

interface MediaCardProps {
  item: CatalogItemViewModel;
  onClick: (item: CatalogItemViewModel) => void;
  className?: string;
  onFocus?: () => void;
  prepareArtwork?: boolean;
  startupArtwork?: boolean;
}

export const MediaCard = React.memo<MediaCardProps>(function MediaCard({
  item,
  onClick,
  className = '',
  onFocus,
  prepareArtwork=true,
  startupArtwork=false,
}) {
  const badge = useContentBadge(item.kind, item.title);
  const posterUri =
    item.posterUri ||
    (item as any).posterUrl ||
    (item as any).logo ||
    (item as any).cover ||
    (item as any).poster ||
    (item as any).stream_icon ||
    '';

  return (
    <button
      type="button"
      className={`focusable-item media-card ${className}`}
      onClick={() => onClick(item)}
      onFocus={()=>{const uri=displayArtworkUri(posterUri,'poster');if(uri)void loadImage(uri,true);onFocus?.();}}
      aria-label={`${item.title}${item.yearFormatted ? ` (${item.yearFormatted})` : ''} - ${item.kind === 'movie' ? 'Filme' : 'Série'}${badge ? ` - ${badge}` : ''}`}
      data-startup-artwork={startupArtwork || undefined}
    >
      <div className="media-card-poster-wrapper">
        <Artwork uri={posterUri} title={item.title} kind="poster" className="media-card-poster"
          prepare={prepareArtwork}
          startup={startupArtwork}
          identity={{ kind: item.kind, title: item.title, year: item.yearFormatted, tmdbId: item.externalIds?.tmdbId }} />
        <div className="media-card-badge">{item.kind === 'movie' ? 'FILME' : 'SÉRIE'}</div>
        {item.yearFormatted && <div className={`media-card-year${badge ? ' media-card-year--with-new' : ''}`}>{item.yearFormatted}</div>}
        {badge && <span className="media-card-new-badge" aria-hidden="true">{badge}</span>}
      </div>
      <div className="media-card-info">
        <h3 className="media-card-title">{item.title}</h3>
        {item.genreLabels.length > 0 && (
          <p className="media-card-genres">{item.genreLabels.slice(0, 2).join(' • ')}</p>
        )}
      </div>
    </button>
  );
});
