import type { Movie, Series } from '../contracts/catalog.ts';
import type { CatalogReadModel } from './catalog-read-model.ts';
import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';
import { resolveSegmentRelativePath } from '../bootstrap/storage/segment-path-resolver.ts';

type Title = Movie | Series;
export interface RelatedGenreContext {
  referenceGenres: readonly string[];
  genresFor: (candidate: Title) => readonly string[];
}
export const RELATED_TITLE_LIMIT = 20;
export function relatedTitleScore(reference: Title, candidate: Title, context?: RelatedGenreContext): number {
  if (reference.id === candidate.id) return 0;
  if (context) {
    const key = (s: string) => s.trim().toLocaleLowerCase('pt-BR');
    const wanted = new Set(context.referenceGenres.map(key).filter(g => g && g !== 'geral'));
    return new Set(context.genresFor(candidate).map(key).filter(g => wanted.has(g))).size * 100;
  }
  const genres = new Set(reference.genreIds || []), categories = new Set(reference.categoryIds || []);
  return (candidate.genreIds || []).filter(id => genres.has(id)).length * 100
    + (candidate.categoryIds || []).filter(id => categories.has(id)).length;
}
export function selectRelatedTitles(reference: Title, candidates: readonly Title[], context?: RelatedGenreContext): Title[] {
  const unique = new Map<string, Title>();
  const scores = new Map<string, number>();
  for (const row of candidates) {
    const score = relatedTitleScore(reference, row, context);
    if (score > 0) { unique.set(row.id, row); scores.set(row.id, score); }
  }
  return [...unique.values()].sort((a,b) => scores.get(b.id)! - scores.get(a.id)!).slice(0, RELATED_TITLE_LIMIT);
}
export async function loadRelatedTitles(model: CatalogReadModel, kind: 'movie' | 'series', reference: Title,
  storage: LocalCatalogStorage, signal: AbortSignal, context?: RelatedGenreContext): Promise<Title[]> {
  const snapshot = model.catalog.metadata.snapshotId;
  const check = () => { if (signal.aborted) throw new Error('RELATED_CANCELLED'); };
  check();
  const manifest = await storage.readActiveManifest() as null | { snapshotId?: string; segments?: Array<{kind?:string;fileName?:string}> };
  check();
  if (manifest?.snapshotId && manifest.snapshotId !== snapshot) throw new Error('RELATED_SNAPSHOT_CHANGED');
  let chosen = selectRelatedTitles(reference, [...(kind === 'movie' ? model.moviesById.values() : model.seriesById.values())], context);
  const files = (manifest?.segments || []).filter(s => s.kind === (kind === 'movie' ? 'movies' : 'series') && s.fileName);
  for (const file of files) {
    check();
    const raw = await storage.readActiveSegment?.(resolveSegmentRelativePath(file.fileName!));
    check();
    const rows: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(rows)) chosen = selectRelatedTitles(reference, [...chosen, ...rows], context);
    // A full genre-matched rail needs no further scanning. Category-only rails
    // keep looking for stronger genre matches, without retaining other rows.
    if (chosen.length === RELATED_TITLE_LIMIT && chosen.every(row => relatedTitleScore(reference,row,context) >= 100)) break;
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
  check();
  const active = await storage.readActivePointer();
  check();
  if (active && active.snapshotId !== snapshot) throw new Error('RELATED_SNAPSHOT_CHANGED');
  return chosen;
}
