import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { getClientBootstrapService } from '../../bootstrap/client.ts';
import type { LocalCatalogStorage } from '../../bootstrap/storage/storage.interface.ts';
import { resolveSegmentRelativePath } from '../../bootstrap/storage/segment-path-resolver.ts';
import { parentalControl } from '../../parental/parental-control.store.ts';

type Counts = { movies: number | null; series: number | null; live: number | null };
type Sample = { state: 'READABLE' | 'MISSING' | 'INVALID' | 'OVERSIZED' | 'NOT_DECLARED'; records: number | null };
export interface CatalogReadDiagnostic {
  schema: 'XANDEFLIX_LOCAL_CATALOG_READ_V1';
  state: 'READABLE' | 'PARTIAL' | 'ABSENT' | 'UNAVAILABLE' | 'GENERATION_CHANGED';
  totals: Counts;
  firstFold: Counts;
  categories: number | null;
  liveGroups: number | null;
  samples: { movies: Sample; series: Sample; live: Sample };
  parental: 'loading' | 'unconfigured' | 'ready' | 'error' | 'unknown';
}
interface Dependencies {
  storage: Pick<LocalCatalogStorage, 'readActivePointer' | 'readActiveManifest' | 'readActiveCatalog' | 'readActiveSegment'>;
  readLiveHeader: (snapshotId: string) => Promise<unknown>;
  parentalStatus: () => string;
}
const MAX_JSON_CHARS = 4 * 1024 * 1024;
const count = (value: unknown): number | null => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const length = (value: unknown) => Array.isArray(value) ? value.length : null;
const unknownCounts = (): Counts => ({ movies: null, series: null, live: null });
const absentSample = (): Sample => ({ state: 'NOT_DECLARED', records: null });
const safeRead = async (read: () => Promise<unknown>) => { try { return await read(); } catch { return null; } };
function parseHeader(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string') return object(value);
  if (value.length > MAX_JSON_CHARS) return {};
  try { return object(JSON.parse(value)); } catch { return {}; }
}

/** Counts/codes only. Never returns records, identity, locators or raw exceptions. */
export async function readCatalogReadDiagnostic(deps: Dependencies = {
  storage: getClientBootstrapService().getStorage(),
  readLiveHeader: async snapshotId => (await Filesystem.readFile({
    path: `prebuilt/snapshots/${snapshotId}/live_catalog.json`, directory: Directory.Data, encoding: Encoding.UTF8,
  })).data,
  parentalStatus: () => parentalControl.getSnapshot().status,
}): Promise<CatalogReadDiagnostic> {
  const report: CatalogReadDiagnostic = { schema: 'XANDEFLIX_LOCAL_CATALOG_READ_V1', state: 'UNAVAILABLE',
    totals: unknownCounts(), firstFold: unknownCounts(), categories: null, liveGroups: null,
    samples: { movies: absentSample(), series: absentSample(), live: absentSample() }, parental: 'unknown' };
  try {
    const state = deps.parentalStatus();
    if (['loading', 'unconfigured', 'ready', 'error'].includes(state)) report.parental = state as CatalogReadDiagnostic['parental'];
  } catch { /* A status failure never grants or changes access. */ }
  let pointer: unknown;
  try { pointer = await deps.storage.readActivePointer(); } catch { return report; }
  if (pointer === null) return { ...report, state: 'ABSENT' };
  const first = object(pointer);
  const snapshotId = first.snapshotId;
  if (typeof snapshotId !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,160}$/.test(snapshotId)) return report;
  const [manifestValue, catalogValue, liveValue] = await Promise.all([
    safeRead(() => deps.storage.readActiveManifest()), safeRead(() => deps.storage.readActiveCatalog()),
    safeRead(() => deps.readLiveHeader(snapshotId)),
  ]);
  const manifest = object(manifestValue), catalog = object(catalogValue), live = parseHeader(liveValue);
  const catalogSnapshot = object(catalog.metadata).snapshotId;
  const headerMismatch = [manifest.snapshotId, catalogSnapshot, live.snapshotId].some(id => id !== undefined && id !== snapshotId);
  const totals = object(manifest.counts);
  report.totals = { movies: count(totals.movies), series: count(totals.series), live: count(totals.live) };
  report.firstFold = { movies: length(catalog.movies), series: length(catalog.series), live: length(live.channels) };
  report.categories = length(catalog.categories); report.liveGroups = length(live.groups);
  const segments = Array.isArray(manifest.segments) ? manifest.segments.map(object) : [];
  for (const kind of ['movies', 'series', 'live'] as const) {
    const entry = segments.find(segment => segment.kind === kind);
    if (!entry) continue;
    let path: string;
    try { path = resolveSegmentRelativePath(entry.fileName as string); }
    catch { report.samples[kind] = { state: 'INVALID', records: null }; continue; }
    const raw = await safeRead(async () => await deps.storage.readActiveSegment?.(path));
    if (typeof raw !== 'string' || !raw) { report.samples[kind] = { state: 'MISSING', records: null }; continue; }
    if (raw.length > MAX_JSON_CHARS) { report.samples[kind] = { state: 'OVERSIZED', records: null }; continue; }
    try {
      const rows: unknown = JSON.parse(raw);
      report.samples[kind] = Array.isArray(rows) ? { state: 'READABLE', records: rows.length } : { state: 'INVALID', records: null };
    } catch { report.samples[kind] = { state: 'INVALID', records: null }; }
  }
  const last = object(await safeRead(() => deps.storage.readActivePointer()));
  if (headerMismatch || last.snapshotId !== snapshotId) {
    return { ...report, state: 'GENERATION_CHANGED', totals: unknownCounts(), firstFold: unknownCounts(), categories: null, liveGroups: null,
      samples: { movies: absentSample(), series: absentSample(), live: absentSample() } };
  }
  report.state = manifest.snapshotId === snapshotId && catalogSnapshot === snapshotId
    && report.firstFold.movies !== null && report.firstFold.series !== null
    && (report.totals.live === 0 || live.snapshotId === snapshotId)
    && Object.values(report.samples).every(sample => ['READABLE', 'NOT_DECLARED'].includes(sample.state))
    ? 'READABLE' : 'PARTIAL';
  return report;
}
