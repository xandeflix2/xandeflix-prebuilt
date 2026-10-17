import { normalizeArtworkUri } from './artwork-uri.ts';
import { isAdultClassification } from '../playback/content-adult-policy.ts';

export const STARTUP_PREVIEW_LIMIT = 6;
export interface StartupPoster {
  id: string; title: string; uri: string; backdropUri?: string; category: 'Lançamentos' | 'Cinema' | 'Filmes' | 'Em alta no TMDB';
}
export interface StartupPosterCandidate {
  id: string; title: string; posterUri?: string; category?: string;
}
type Entry = { poster: StartupPoster; priority: number };
const EMPTY: readonly StartupPoster[] = [];
let entries: Entry[] = [], snapshot = EMPTY;
const listeners = new Set<() => void>();

function priority(category = ''): number {
  const label = category.slice(0, 200).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return /\blancamentos?\b/.test(label) ? 2 : /\bcinema\b/.test(label) ? 1 : 0;
}
function add(items: Entry[], candidate: StartupPosterCandidate): boolean {
  if (isAdultClassification(candidate.category)) return false;
  const rank = priority(candidate.category);
  if (items.length >= STARTUP_PREVIEW_LIMIT && rank <= items[items.length - 1].priority) return false;
  const uri = normalizeArtworkUri(candidate.posterUri);
  const title = candidate.title.trim().slice(0, 180);
  if (!uri || !title || !candidate.id || items.some(item => item.poster.id === candidate.id || item.poster.uri === uri)) return false;
  items.push({ priority: rank, poster: { id: candidate.id, title, uri, category: rank === 2 ? 'Lançamentos' : rank === 1 ? 'Cinema' : 'Filmes' } });
  items.sort((a, b) => b.priority - a.priority);
  items.length = Math.min(items.length, STARTUP_PREVIEW_LIMIT);
  return true;
}
function publish(): void {
  snapshot = entries.length ? entries.map(item => item.poster) : EMPTY;
  for (const listener of listeners) { try { listener(); } catch { /* An optional UI observer cannot fail an import. */ } }
}
export function resetStartupCatalogPreview(): void {
  if (!entries.length) return;
  entries = []; publish();
}
/** Local RAM metadata only. No work/IO/notification when the startup UI is absent. */
export function offerStartupPoster(candidate: StartupPosterCandidate): void {
  if (listeners.size && add(entries, candidate)) publish();
}
export const getStartupCatalogPreview = (): readonly StartupPoster[] => snapshot;
export const getEmptyStartupCatalogPreview = (): readonly StartupPoster[] => EMPTY;
export const isStartupPreviewObserved = (): boolean => listeners.size > 0 && (entries.length < STARTUP_PREVIEW_LIMIT || entries[entries.length - 1].priority < 2);
export function subscribeStartupCatalogPreview(listener: () => void): () => void {
  listeners.add(listener); return () => { listeners.delete(listener); };
}
export function selectStartupPosters(candidates: readonly StartupPosterCandidate[]): readonly StartupPoster[] {
  const items: Entry[] = [];
  for (const item of candidates.slice(0, 100)) add(items, item);
  return items.map(item => item.poster);
}
