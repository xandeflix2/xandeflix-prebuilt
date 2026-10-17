import type { CatalogReadModel } from '../catalog/catalog-read-model.ts';
import type { Movie, Series } from '../contracts/catalog.ts';
import type { LiveChannel, LiveCatalog } from '../catalog/live/live-tv.types.ts';

const normalize = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const adultLabel = /(?:^|[^a-z0-9])(?:adultos?|adults?|xxx|porno(?:grafia|graphic|graphy)?|porn|erotic[oa]s?|hentai|playboy|sexy\s*hot|sex\s*hot|brazzers)(?:$|[^a-z0-9])/;

/** Source classification, not a film title or an ordinary age rating of 18. */
export function isAdultClassification(value: string | undefined): boolean {
  return typeof value === 'string' && adultLabel.test(normalize(value).replace(/\badult\s+swim\b/g, ''));
}

export function isAdultCatalogItem(item: Movie | Series, model: CatalogReadModel): boolean {
  const raw = item as unknown as Record<string, unknown>, metadata = raw.metadata && typeof raw.metadata === 'object' ? raw.metadata as Record<string, unknown> : {};
  const flags = [raw.adult, raw.is_adult, metadata.adult, metadata.is_adult];
  return flags.some(value => value === true || value === 1 || value === '1') || item.categoryIds?.some(id => isAdultClassification(model.categoryById.get(id)?.name)) === true
    || item.genreIds?.some(id => isAdultClassification(model.genreById.get(id)?.name)) === true;
}

export function isAdultLiveChannel(channel: LiveChannel, catalog: LiveCatalog): boolean {
  return [channel.metadata?.adult, channel.metadata?.isAdult, channel.metadata?.is_adult].some(value => value === true || value === 1 || value === '1')
    || isAdultClassification(channel.groupName)
    || isAdultClassification(catalog.groups.find(group => group.id === channel.groupId)?.name)
    || isAdultClassification(channel.name);
}
