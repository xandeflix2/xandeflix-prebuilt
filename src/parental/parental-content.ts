import { parentalControl } from './parental-control.store.ts';
import { isAdultClassification, isAdultCatalogItem, isAdultLiveChannel } from '../playback/content-adult-policy.ts';
import type { CatalogItemViewModel } from '../catalog/catalog-view-model.ts';
import type { CatalogReadModel } from '../catalog/catalog-read-model.ts';
import type { Movie, Series } from '../contracts/catalog.ts';
import type { LiveCatalog, LiveChannel } from '../catalog/live/live-tv.types.ts';
import { tmdbMetadataService, tmdbPosterPath } from '../artwork/tmdb-metadata.service.ts';
import { moviePresentationService, seriesPresentationService, subscribePresentationAges } from '../artwork/series-presentation.service.ts';

// One stable application-level listener; public ages only, no source/user data.
subscribePresentationAges(parentalControl.presentationChanged);

/** Local lookup label, not a credential, stream identity or server identifier. */
export function parentalContentKey(kind: 'movie' | 'series' | 'live', title: string, year?: number | string, tmdbId?: string | number): string {
  const text = JSON.stringify(tmdbId ? [kind, String(tmdbId)] : [kind, title.normalize('NFKC').trim().toLowerCase(), String(year || '')]);
  const seeds = [2166136261, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];
  const digest = seeds.map(seed => { let value = seed; for (let n = 0; n < text.length; n++) value = Math.imul(value ^ text.charCodeAt(n), 16777619); return (value >>> 0).toString(16).padStart(8, '0'); }).join('');
  return `${kind}:${digest}`;
}
export function parentalViewKey(item: CatalogItemViewModel): string { return item.parental?.key || parentalContentKey(item.kind, item.title, item.yearFormatted, item.externalIds?.tmdbId); }
export function parentalLiveKey(channel: LiveChannel): string { return parentalContentKey('live', `${channel.groupName || ''}\n${channel.name}`); }

export function parseParentalAge(value: unknown): number | undefined {
  if (typeof value === 'number' && [0, 10, 12, 14, 16, 18].includes(value)) return value;
  if (typeof value !== 'string') return;
  const clean = value.trim();
  if (/^(?:L|Livre|AL|G|TV-G|TV-Y)$/i.test(clean)) return 0;
  const match = clean.match(/^(?:Classifica[çc][aã]o\s*[:\-]?\s*)?(10|12|14|16|18)(?:\+|\s*anos)?$/i);
  return match ? Number(match[1]) : undefined;
}
export function sourceParentalAge(row: unknown): number | undefined {
  const v = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const metadata = v.metadata && typeof v.metadata === 'object' ? v.metadata as Record<string, unknown> : {};
  for (const field of ['ageRating', 'age_rating', 'certification', 'parental_rating']) {
    const age = parseParentalAge(v[field] ?? metadata[field]); if (age !== undefined) return age;
  }
  return undefined;
}
export function parentalCatalogMetadata(row: Movie | Series, model: CatalogReadModel, kind: 'movie' | 'series') {
  return { key: parentalContentKey(kind, row.title, row.year, row.externalIds?.tmdbId), adult: isAdultCatalogItem(row, model), age: sourceParentalAge(row) };
}
export function isAdultView(item: CatalogItemViewModel): boolean {
  return parentalControl.rule(parentalViewKey(item))?.adult === true || item.parental?.adult === true || [...item.categoryLabels, ...item.genreLabels].some(isAdultClassification);
}
export function canShowParentalItem(item: CatalogItemViewModel): boolean {
  const state = parentalControl.getSnapshot();
  if (state.status === 'error') return false;
  if (isAdultView(item) && !parentalControl.adultVisible()) return false;
  const age = parentalItemAge(item);
  return state.status !== 'ready' || age === undefined || age <= state.policy.maxAge;
}
export function parentalItemAge(item: CatalogItemViewModel): number | undefined {
  const key = parentalViewKey(item);
  const identity = { kind: item.kind, title: item.title, year: item.yearFormatted, tmdbId: item.externalIds?.tmdbId,
    posterPath: tmdbPosterPath(item.posterUri), sourcePosterUri: item.posterUri };
  const id = Number(item.externalIds?.tmdbId || tmdbMetadataService.peek(identity)?.tmdbId);
  const cached = parseParentalAge((item.kind === 'movie' ? moviePresentationService : seriesPresentationService).peek(id)?.ageRating);
  const ages = [item.parental?.age, parentalControl.rule(key)?.minAge, parentalControl.knownAge(key), cached, isAdultView(item) ? 18 : undefined]
    .filter((age): age is number => age !== undefined);
  return ages.length ? Math.max(...ages) : undefined;
}
export function canShowParentalGroup(name: string): boolean { return !isAdultClassification(name) || parentalControl.adultVisible(); }
export function canShowParentalLive(channel: LiveChannel, catalog: LiveCatalog): boolean {
  const state = parentalControl.getSnapshot(), rule = parentalControl.rule(parentalLiveKey(channel));
  if (state.status === 'error') return false;
  if ((isAdultLiveChannel(channel, catalog) || rule?.adult) && !parentalControl.adultVisible()) return false;
  const age = parentalLiveAge(channel, catalog);
  return state.status !== 'ready' || age === undefined || age <= state.policy.maxAge;
}
export function parentalLiveAge(channel: LiveChannel, catalog: LiveCatalog): number | undefined {
  const rule = parentalControl.rule(parentalLiveKey(channel));
  const ages = [sourceParentalAge(channel), rule?.minAge, isAdultLiveChannel(channel, catalog) || rule?.adult ? 18 : undefined]
    .filter((age): age is number => age !== undefined);
  return ages.length ? Math.max(...ages) : undefined;
}
/** Raw snapshot is never modified; only an ephemeral visible projection is returned. */
export function parentalLiveCatalog(catalog: LiveCatalog): LiveCatalog {
  const groups = catalog.groups.filter(g => canShowParentalGroup(g.name)), ids = new Set(groups.map(g => g.id));
  const allowed = (c: LiveChannel) => ids.has(c.groupId) && canShowParentalLive(c, catalog);
  return { ...catalog, groups, channels: catalog.channels.filter(allowed),
    channelsByGroup: Object.fromEntries(groups.map(g => [g.id, (catalog.channelsByGroup[g.id] || []).filter(allowed)])) };
}
