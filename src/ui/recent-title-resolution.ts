import type { CatalogReadModel } from '../catalog/catalog-read-model.ts';
import type { Movie, Series } from '../contracts/catalog.ts';
import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';
import { resolveSegmentRelativePath } from '../bootstrap/storage/segment-path-resolver.ts';
import { watchFingerprint, type RecentWatch } from '../playback/watch-history.ts';
import { isAdultCatalogItem } from '../playback/content-adult-policy.ts';

export interface RecentTitleBinding { record: RecentWatch; item: Movie | Series }
const key = (record: RecentWatch) => `${record.kind}:${record.fingerprint}`;
const m3uItem = (record: RecentWatch) => new RegExp(`^${record.kind === 'movie' ? 'mov' : 'ser'}:m3u:\\d+$`).test(record.itemId);

function rebind(record: RecentWatch, item: Movie | Series): RecentWatch | undefined {
  if (!m3uItem(record) || !new RegExp(`^${record.kind === 'movie' ? 'mov' : 'ser'}:m3u:\\d+$`).test(item.id)) return;
  if (record.kind === 'movie') return { ...record, itemId: item.id };
  const suffix = record.episodeId?.slice(record.itemId.length);
  if (!record.episodeId?.startsWith(record.itemId) || !suffix || !/^:s\d+:e\d+$/.test(suffix)) return;
  return { ...record, itemId: item.id, episodeId: item.id + suffix };
}

/** Presentation binding only. Never writes history/catalog or handles a stream. */
export async function resolveRecentTitleBindings(records: readonly RecentWatch[], model: CatalogReadModel,
  storage: LocalCatalogStorage, signal: AbortSignal): Promise<RecentTitleBinding[]> {
  const wanted = records.slice(0, 60), resolved = new Map<RecentWatch, RecentTitleBinding>(), missing: RecentWatch[] = [];
  const snapshot = model.catalog.metadata.snapshotId;
  const check = () => { if (signal.aborted) throw new Error('RECENT_LOOKUP_CANCELLED'); };
  for (const record of wanted) {
    check();
    const item = record.kind === 'movie' ? await model.resolveMovieById(record.itemId) : await model.resolveSeriesById(record.itemId);
    check();
    if (item && record.fingerprint === watchFingerprint(record.kind, item)) resolved.set(record, { record, item });
    else if (m3uItem(record) && /^[0-9a-f]{16}$/.test(record.fingerprint || '')) missing.push(record);
  }
  if (missing.length && storage.readActiveSegment) {
    const manifest = await storage.readActiveManifest(); check();
    if (manifest?.snapshotId !== snapshot) throw new Error('RECENT_GENERATION_CHANGED');
    const targets = new Set(missing.map(key)), matches = new Map<string, { item: Movie | Series; count: number }>();
    const segments = (manifest as typeof manifest & { segments?: Array<{ kind: string; fileName: string }> }).segments;
    for (const segment of Array.isArray(segments) ? segments : []) {
      const kind = segment.kind === 'movies' ? 'movie' : segment.kind === 'series' ? 'series' : undefined;
      if (!kind || !missing.some(record => record.kind === kind)) continue;
      check();
      const raw = await storage.readActiveSegment(resolveSegmentRelativePath(segment.fileName)); check();
      if (!raw) continue;
      const items: (Movie | Series)[] = JSON.parse(raw);
      if (!Array.isArray(items)) continue;
      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        if (item && typeof item.title === 'string') {
          const identity = `${kind}:${watchFingerprint(kind, item)}`;
          if (targets.has(identity)) {
            const prior = matches.get(identity);
            matches.set(identity, { item: prior?.item || item, count: Math.min(2, (prior?.count || 0) + 1) });
          }
        }
        if (index % 200 === 199) { await new Promise<void>(resolve => setTimeout(resolve, 0)); check(); }
      }
    }
    if ((await storage.readActivePointer())?.snapshotId !== snapshot) throw new Error('RECENT_GENERATION_CHANGED');
    check();
    for (const record of missing) {
      const match = matches.get(key(record));
      if (match?.count !== 1) continue;
      const rebound = rebind(record, match.item);
      if (rebound) resolved.set(record, { record: rebound, item: match.item });
    }
  }
  const seen = new Set<string>();
  return wanted.flatMap(record => {
    const binding = resolved.get(record), identity = binding && `${record.kind}:${binding.item.id}`;
    if (!binding || !identity || seen.has(identity) || isAdultCatalogItem(binding.item, model)) return [];
    seen.add(identity); return [binding];
  });
}
