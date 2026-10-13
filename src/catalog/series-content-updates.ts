import type { CatalogReadModel } from './catalog-read-model.ts';
import type { CatalogItemViewModel } from './catalog-view-model.ts';
import type { Series } from '../contracts/catalog.ts';
import type { LocalCatalogStorage, SegmentedCatalogManifest } from '../bootstrap/storage/storage.interface.ts';
import { resolveSegmentRelativePath } from '../bootstrap/storage/segment-path-resolver.ts';
import { newContentKey, newContentScope, seriesActivityAt, type NewContentInventory } from './new-content-badge.ts';
import { seriesToViewModel } from './catalog-selectors.ts';

/** Recent series can live outside the first fold; keep at most 100 view models. */
export async function loadRecentSeries(
  model: CatalogReadModel, storage: LocalCatalogStorage, inventory: NewContentInventory, signal: AbortSignal,
  now = Date.now(), cooperate = () => new Promise<void>(resolve => setTimeout(resolve, 0)),
): Promise<CatalogItemViewModel[]> {
  const snapshot = model.catalog.metadata.snapshotId;
  const check = () => { if (signal.aborted) throw Error('SERIES_ACTIVITY_CANCELLED'); };
  if (inventory.snapshotId !== snapshot) throw Error('SERIES_ACTIVITY_GENERATION_CHANGED');
  const generation = async () => {
    check(); const pointer = await storage.readActivePointer(); check();
    if (pointer?.snapshotId !== snapshot) throw Error('SERIES_ACTIVITY_GENERATION_CHANGED');
  };
  await generation();
  const manifest = await storage.readActiveManifest() as SegmentedCatalogManifest | null; check();
  if (manifest?.snapshotId && manifest.snapshotId !== snapshot) throw Error('SERIES_ACTIVITY_GENERATION_CHANGED');
  if (inventory.scope !== newContentScope(manifest?.metadata?.sourceId || 'local-catalog')) throw Error('SERIES_ACTIVITY_SOURCE_CHANGED');
  const chosen = new Map<string, { item: CatalogItemViewModel; date: number }>();
  const process = async (rows: unknown[]) => {
    for (let i = 0; i < rows.length; i += 200) {
      check();
      for (const value of rows.slice(i, i + 200)) {
        const row = value as Series;
        if (!row || typeof row.id !== 'string' || typeof row.title !== 'string' || !Array.isArray(row.categoryIds) || !Array.isArray(row.genreIds)) throw Error('SERIES_ACTIVITY_RECORD_INVALID');
        const key = newContentKey('series', row.title), date = seriesActivityAt(inventory, key, now);
        if (!date || chosen.has(key)) continue;
        chosen.set(key, { item: seriesToViewModel(model, row), date });
        if (chosen.size > 100) {
          const last = [...chosen.entries()].sort(compare).pop()!;
          chosen.delete(last[0]);
        }
      }
      await cooperate();
    }
  };
  const compare = (a: [string, { date: number }], b: [string, { date: number }]) => b[1].date - a[1].date || a[0].localeCompare(b[0]);
  const entries = manifest?.segments?.filter(entry => entry.kind === 'series') || [];
  if (entries.length) {
    if (entries.reduce((n, entry) => n + entry.recordCount, 0) !== manifest?.counts?.series) throw Error('SERIES_ACTIVITY_INCOMPLETE');
    for (const entry of entries) {
      await generation();
      const raw = await storage.readActiveSegment?.(resolveSegmentRelativePath(entry.fileName)); check();
      if (!raw) throw Error('SERIES_ACTIVITY_SEGMENT_UNAVAILABLE');
      const rows: unknown = JSON.parse(raw);
      if (!Array.isArray(rows) || rows.length !== entry.recordCount) throw Error('SERIES_ACTIVITY_INCOMPLETE');
      await process(rows);
    }
  } else {
    if (manifest?.counts?.series !== undefined && manifest.counts.series !== model.catalog.series.length) throw Error('SERIES_ACTIVITY_INCOMPLETE');
    await process(model.catalog.series);
  }
  await generation();
  return [...chosen.entries()].sort(compare).map(([, value]) => value.item);
}

export function prioritizeSeries(
  recent: readonly CatalogItemViewModel[], fallback: readonly CatalogItemViewModel[], limit: number, categoryLabel?: string,
): CatalogItemViewModel[] {
  const result: CatalogItemViewModel[] = [], seen = new Set<string>();
  for (const item of [...recent, ...fallback]) {
    if (item.kind !== 'series' || (categoryLabel !== undefined && !item.categoryLabels.includes(categoryLabel))) continue;
    const key = newContentKey('series', item.title);
    if (seen.has(key)) continue;
    seen.add(key); result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}
