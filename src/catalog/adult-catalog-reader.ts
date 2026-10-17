import type { Movie, Series } from '../contracts/catalog.ts';
import type { CatalogReadModel } from './catalog-read-model.ts';
import type { CatalogItemViewModel } from './catalog-view-model.ts';
import { movieToViewModel, seriesToViewModel } from './catalog-selectors.ts';
import { SegmentedBrowseService, type BrowseCursor, type BrowseKind } from './segmented-browse.service.ts';
import type { LocalCatalogStorage } from '../bootstrap/storage/storage.interface.ts';
import { parentalControl } from '../parental/parental-control.store.ts';
import { parentalCatalogMetadata } from '../parental/parental-content.ts';

/** Cursor-only scan: no artwork request or materialization of the entire catalog. */
export class AdultCatalogReader {
  private readonly browse: SegmentedBrowseService;
  private readonly streams = { movies: { cursor: undefined as BrowseCursor | undefined, done: false, pending: [] as (Movie | Series)[] },
    series: { cursor: undefined as BrowseCursor | undefined, done: false, pending: [] as (Movie | Series)[] } };
  constructor(private readonly model: CatalogReadModel, private readonly storage: LocalCatalogStorage) {
    this.browse = new SegmentedBrowseService(storage, model.catalog.metadata.snapshotId);
  }
  dispose(): void { this.browse.dispose(); }
  async loadNext(signal: AbortSignal): Promise<{ items: CatalogItemViewModel[]; hasMore: boolean }> {
    const check = () => { if (signal.aborted || !parentalControl.adultVisible()) throw new Error('ADULT_BROWSE_BLOCKED'); };
    check();
    const manifest = await this.storage.readActiveManifest(); check();
    if (manifest?.snapshotId !== this.model.catalog.metadata.snapshotId) throw new Error('ADULT_GENERATION_CHANGED');
    const previous = { movies: { ...this.streams.movies, pending: [...this.streams.movies.pending] },
      series: { ...this.streams.series, pending: [...this.streams.series.pending] } };
    try {
    const items: CatalogItemViewModel[] = [];
    for (const kind of ['movies', 'series'] as const) {
      const adult = (row: Movie | Series) => { const metadata = parentalCatalogMetadata(row, this.model, kind === 'movies' ? 'movie' : 'series');
        return metadata.adult || parentalControl.rule(metadata.key)?.adult === true; };
      const stream = this.streams[kind]; let added = 0;
      while (added < 24 && (!stream.done || stream.pending.length)) {
        check();
        if (!stream.pending.length && !stream.done) {
          if (manifest && 'segments' in manifest) {
            const page = await this.browse.loadPage(kind as BrowseKind, stream.cursor, 96, undefined, { count: false, signal });
            check(); stream.pending = page.items.filter(adult);
            stream.cursor = page.nextCursor || undefined; stream.done = !page.nextCursor;
          } else {
            stream.pending = this.model.catalog[kind].filter(adult); stream.done = true;
          }
        }
        const batch = stream.pending.splice(0, 24 - added); added += batch.length;
        items.push(...batch.map(row => kind === 'movies' ? movieToViewModel(this.model, row as Movie) : seriesToViewModel(this.model, row as Series)));
        if (!stream.done && !stream.pending.length) await new Promise<void>(resolve => setTimeout(resolve, 0));
      }
    }
    check();
    return { items, hasMore: Object.values(this.streams).some(s => !s.done || s.pending.length > 0) };
    } catch (error) {
      Object.assign(this.streams, previous);
      throw error;
    }
  }
}
