import React, { useState } from 'react';
import type { ArtworkIdentity } from '../../artwork/tmdb-metadata.service.ts';
import { artworkIdentityKey } from '../../artwork/tmdb-metadata.service.ts';
import { Artwork } from './Artwork.tsx';

interface Props { title: string; identity?: ArtworkIdentity; backdrop?: string; poster?: string; className?: string }

function DetailBackdropSurface({ title, identity, backdrop, poster, className = '' }: Props): React.ReactElement {
  const [horizontalReady, setHorizontalReady] = useState(false);
  return <div className="detail-artwork-surface" data-detail-backdrop={horizontalReady ? 'horizontal' : 'poster-composition'} aria-hidden="true">
    {!horizontalReady && <Artwork uri={poster} identity={identity} priority="high" title={title} kind="poster"
      immersiveArtwork="poster" className={`${className} detail-artwork-poster`}/>}
    <Artwork uri={backdrop} fallbackUri={poster} identity={identity} priority="high" title={title} kind="backdrop"
      tmdbBackdropOnly detailBackdrop hideEmpty immersiveArtwork="backdrop"
      className={`${className} detail-artwork-horizontal`} onReadyChange={setHorizontalReady}/>
  </div>;
}

/** Reset only on title/image identity changes, never on unrelated page renders. */
export function DetailBackdrop(props: Props): React.ReactElement {
  const key = `${props.identity ? artworkIdentityKey(props.identity) : props.title}:${props.backdrop || ''}:${props.poster || ''}`;
  return <DetailBackdropSurface key={key} {...props}/>;
}
