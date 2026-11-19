import type { CatalogReadModel } from '../catalog/catalog-read-model.ts';
import type { Episode, StreamRef } from '../contracts/catalog.ts';
import { validatePlaybackUri } from './playback-redaction.ts';

/** Caller-supplied, scoped observations. These are not durable playback grants. */
export interface NextEpisodeContext {
  sourceId: string;
  catalogGeneration: string;
  snapshotId: string;
  currentSourceId: string;
  currentCatalogGeneration: string;
  license: 'ALLOWED' | 'DENIED' | 'UNKNOWN';
  parental: 'ALLOWED' | 'DENIED' | 'UNKNOWN';
  sourceAuthorization: 'ALLOWED' | 'DENIED' | 'UNKNOWN';
  /** Last regular episode number per season, only when independently established. */
  completeSeasonLastEpisode: Readonly<Record<string, number>>;
  /** Final regular season, only when independently established. */
  finalSeasonNumber?: number;
  /** An indirect source reference still needs a runtime source context at playback. */
  indirectReferenceReady: boolean;
}

export type NextEpisodeResolution =
  | { status: 'AVAILABLE'; episodeId: string; seasonNumber: number; episodeNumber: number;
      sourceId: string; catalogGeneration: string; snapshotId: string }
  | { status: 'UNAVAILABLE'; reason: string }
  | { status: 'AMBIGUOUS'; reason: string }
  | { status: 'END_OF_SERIES'; sourceId: string; catalogGeneration: string; snapshotId: string };

const unavailable = (reason: string): NextEpisodeResolution => ({ status: 'UNAVAILABLE', reason });
const ambiguous = (reason: string): NextEpisodeResolution => ({ status: 'AMBIGUOUS', reason });
const nonempty = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;
const numberOk = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;

function usableReference(ref: StreamRef | undefined, expectedId: string, indirectReady: boolean): boolean {
  if (!ref || ref.id !== expectedId || ref.contentKind !== 'episode' || !nonempty(ref.sourceItemId)) return false;
  if (ref.directStreamUrl !== undefined) {
    if (!nonempty(ref.directStreamUrl)) return false;
    try { validatePlaybackUri(ref.directStreamUrl); return true; } catch { return false; }
  }
  return indirectReady && !/[\s/\\?#]/.test(ref.sourceItemId);
}

/** Pure local selection; playback must revalidate source, license, parental access and session. */
export function resolveNextEpisode(
  model: CatalogReadModel, seriesId: string, currentEpisodeId: string, context: NextEpisodeContext,
): NextEpisodeResolution {
  if (!model || !context || !nonempty(seriesId) || !nonempty(currentEpisodeId)
    || !nonempty(context.sourceId) || !nonempty(context.catalogGeneration) || !nonempty(context.snapshotId)
    || !nonempty(context.currentSourceId) || !nonempty(context.currentCatalogGeneration)
    || !context.completeSeasonLastEpisode || typeof context.completeSeasonLastEpisode !== 'object') return unavailable('MISSING_CONTEXT');
  if (context.sourceId !== context.currentSourceId) return unavailable('SOURCE_CHANGED');
  if (context.catalogGeneration !== context.currentCatalogGeneration || context.snapshotId !== model.catalog.metadata.snapshotId) return unavailable('CATALOG_CHANGED');
  if (context.sourceAuthorization !== 'ALLOWED') return unavailable('SOURCE_AUTHORIZATION_REQUIRED');
  if (context.license !== 'ALLOWED') return unavailable('LICENSE_AUTHORIZATION_REQUIRED');
  if (context.parental !== 'ALLOWED') return unavailable('PARENTAL_AUTHORIZATION_REQUIRED');
  if (!model.seriesById.has(seriesId)) return unavailable('SERIES_NOT_FOUND');
  const seasons = model.seasonsBySeriesId.get(seriesId) ?? [];
  const bySeasonNumber = new Map<number, string>();
  const bySeasonId = new Map<string, number>();
  const episodesById = new Map<string, Episode>();
  const positions = new Map<string, Episode>();
  for (const season of seasons) {
    if (!nonempty(season.id) || season.seriesId !== seriesId || !numberOk(season.seasonNumber)) return unavailable('INVALID_SEASON');
    if (bySeasonId.has(season.id) || bySeasonNumber.has(season.seasonNumber)) return ambiguous('DUPLICATE_SEASON');
    bySeasonId.set(season.id, season.seasonNumber); bySeasonNumber.set(season.seasonNumber, season.id);
    for (const episode of model.episodesBySeasonId.get(season.id) ?? []) {
      if (!nonempty(episode.id) || episode.seriesId !== seriesId || episode.seasonId !== season.id || !numberOk(episode.episodeNumber)) return unavailable('INVALID_EPISODE');
      const priorId = episodesById.get(episode.id);
      if (priorId) {
        if (JSON.stringify(priorId) !== JSON.stringify(episode)) return ambiguous('CONFLICTING_EPISODE_ID');
        continue;
      }
      const position = `${season.seasonNumber}:${episode.episodeNumber}`;
      if (positions.has(position)) return ambiguous('DUPLICATE_EPISODE_NUMBER');
      episodesById.set(episode.id, episode); positions.set(position, episode);
    }
  }
  const current = episodesById.get(currentEpisodeId);
  if (!current) return unavailable('CURRENT_EPISODE_NOT_FOUND');
  const seasonNumber = bySeasonId.get(current.seasonId);
  if (seasonNumber === undefined) return unavailable('INCONSISTENT_SEASON');
  if (seasonNumber === 0 || current.episodeNumber === 0) return unavailable('SPECIAL_EPISODE');
  if (context.finalSeasonNumber !== undefined && (!numberOk(context.finalSeasonNumber) || context.finalSeasonNumber < seasonNumber)) return unavailable('INVALID_COMPLETENESS_EVIDENCE');
  const last = context.completeSeasonLastEpisode[current.seasonId];
  if (last !== undefined && (!numberOk(last) || last < 1 || current.episodeNumber > last)) return unavailable('INVALID_COMPLETENESS_EVIDENCE');
  let selected = positions.get(`${seasonNumber}:${current.episodeNumber + 1}`);
  let selectedSeason = seasonNumber;
  if (selected && last !== undefined && selected.episodeNumber > last) return unavailable('CONFLICTING_COMPLETENESS_EVIDENCE');
  if (!selected) {
    if (last === undefined || current.episodeNumber < last) return unavailable('EPISODE_GAP_OR_INCOMPLETE');
    selectedSeason = seasonNumber + 1;
    const nextSeasonId = bySeasonNumber.get(selectedSeason);
    if (nextSeasonId) {
      selected = positions.get(`${selectedSeason}:1`);
      if (!selected) return unavailable('NEXT_SEASON_INCOMPLETE');
      if (context.finalSeasonNumber !== undefined && selectedSeason > context.finalSeasonNumber) return unavailable('CONFLICTING_COMPLETENESS_EVIDENCE');
    } else {
      if (Array.from(bySeasonNumber.keys()).some(n => n > selectedSeason)) return unavailable('SEASON_GAP');
      if (context.finalSeasonNumber === seasonNumber) return { status: 'END_OF_SERIES', sourceId: context.sourceId, catalogGeneration: context.catalogGeneration, snapshotId: context.snapshotId };
      return unavailable('SERIES_INCOMPLETE');
    }
  }
  if (!selected.streamIds?.length) return unavailable('MEDIA_REFERENCE_MISSING');
  if (!selected.streamIds.some(id => nonempty(id) && usableReference(model.streamsById.get(id), id, context.indirectReferenceReady))) return unavailable('MEDIA_REFERENCE_INVALID');
  return { status: 'AVAILABLE', episodeId: selected.id, seasonNumber: selectedSeason, episodeNumber: selected.episodeNumber,
    sourceId: context.sourceId, catalogGeneration: context.catalogGeneration, snapshotId: context.snapshotId };
}
