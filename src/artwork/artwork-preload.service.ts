import type { CatalogItemViewModel } from '../catalog/catalog-view-model.ts';
import { displayArtworkUri } from './artwork-uri.ts';
import { heroArtworkService } from './hero-artwork.service.ts';
import { loadImage } from './image-load-queue.ts';
import { canShowParentalItem } from '../parental/parental-content.ts';

/** Warm the selected page of source posters and the first eligible horizontal TMDB hero. */
export function prefetchCatalogArtwork(items: CatalogItemViewModel[], signal?: AbortSignal): void {
  items = items.filter(canShowParentalItem);
  if (signal?.aborted) return;
  for (const item of items.slice(0, 48)) { const uri=displayArtworkUri(item.posterUri,'poster');if(uri)void loadImage(uri,false,signal); }
  void (async()=>{for(const item of items.slice(0,8)){if(signal?.aborted)return;if(await heroArtworkService.resolve(item,'horizontal'))return;}})().catch(()=>{});
}
