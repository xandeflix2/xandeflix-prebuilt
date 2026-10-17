import { parentalControl } from './parental-control.store.ts';
import { isAdultView, parentalItemAge, parentalLiveAge, parentalLiveKey, parentalViewKey, parseParentalAge } from './parental-content.ts';
import { isAdultLiveChannel } from '../playback/content-adult-policy.ts';
import type { CatalogItemViewModel } from '../catalog/catalog-view-model.ts';
import type { LiveCatalog, LiveChannel } from '../catalog/live/live-tv.types.ts';
import { tmdbPosterPath } from '../artwork/tmdb-metadata.service.ts';
import { resolveMoviePresentation, resolveSeriesPresentation } from '../artwork/series-presentation.service.ts';

export async function authorizeParentalItem(item: CatalogItemViewModel, snapshotId: string, signal?: AbortSignal): Promise<boolean> {
  await parentalControl.load();
  if (signal?.aborted) return false;
  const localKey = parentalViewKey(item), key = `${snapshotId}:${localKey}`, rule = parentalControl.rule(localKey), adult = isAdultView(item);
  if (parentalControl.getSnapshot().status === 'unconfigured') return parentalControl.authorize(key, undefined, adult, rule?.alwaysPin, signal);
  if (adult && !parentalControl.adultVisible()) return parentalControl.authorize(key, undefined, true);
  let age = parentalItemAge(item);
  const identity = { kind: item.kind, title: item.title, year: item.yearFormatted, tmdbId: item.externalIds?.tmdbId,
    posterPath: tmdbPosterPath(item.posterUri), sourcePosterUri: item.posterUri };
  if (age === undefined) {
    const metadata = await (item.kind === 'movie' ? resolveMoviePresentation(identity) : resolveSeriesPresentation(identity));
    if (signal?.aborted) return false;
    parentalControl.rememberAge(localKey, parseParentalAge(metadata?.ageRating));
    age = parentalItemAge(item);
  }
  if (signal?.aborted) return false;
  parentalControl.rememberAge(localKey, age);
  return parentalControl.authorize(key, age, isAdultView(item), parentalControl.rule(localKey)?.alwaysPin, signal);
}
export async function authorizeParentalLive(channel: LiveChannel, catalog: LiveCatalog): Promise<boolean> {
  const localKey = parentalLiveKey(channel), rule = parentalControl.rule(localKey);
  return parentalControl.authorize(`${catalog.snapshotId}:${localKey}`, parentalLiveAge(channel, catalog),
    isAdultLiveChannel(channel, catalog) || rule?.adult === true, rule?.alwaysPin);
}
export function parentalLiveNeedsPin(channel: LiveChannel, catalog: LiveCatalog): boolean {
  const state = parentalControl.getSnapshot(), localKey = parentalLiveKey(channel), rule = parentalControl.rule(localKey), age = parentalLiveAge(channel, catalog);
  return state.status === 'ready' && !parentalControl.isGranted(`${catalog.snapshotId}:${localKey}`)
    && (isAdultLiveChannel(channel, catalog) || rule?.adult === true || rule?.alwaysPin === true || age === undefined || age > state.policy.maxAge);
}
export function parentalErrorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : '';
  if (code === 'PARENTAL_COOLDOWN') return 'Limite de tentativas atingido. O acesso ao PIN fica bloqueado por 3 horas após a sexta tentativa incorreta.';
  if (code === 'PARENTAL_ADULT_AGE_LIMIT') return 'Para liberar conteúdo adulto, ajuste primeiro a classificação máxima para 18 anos.';
  if (code === 'PARENTAL_ADULT_DISABLED' || code === 'PARENTAL_SETUP_REQUIRED') return 'Conteúdo adulto bloqueado. Configure e desbloqueie o controle parental em Configurações.';
  if (code === 'PARENTAL_PIN_REQUIRED') return 'Informe o PIN para acessar o controle parental.';
  if (code === 'PARENTAL_RULE_LIMIT') return 'O limite de 256 regras foi atingido. Remova uma regra antes de criar outra.';
  if (code === 'PARENTAL_CRYPTO_UNAVAILABLE' || code === 'PARENTAL_STORAGE_UNAVAILABLE' || code === 'PARENTAL_CLOCK_UNAVAILABLE') return 'A proteção local está indisponível. O acesso restrito permanece bloqueado.';
  return 'Não foi possível concluir. Confira os dados e tente novamente.';
}
