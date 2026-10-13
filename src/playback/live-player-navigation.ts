import type { LiveCatalog, LiveChannel } from '../catalog/live/live-tv.types.ts';
import type { LiveChannelPage } from '../catalog/live/live-catalog.service.ts';
import { liveChannelFingerprint } from './last-live-channel.ts';

export interface LiveNavigationPort {
  loadPage(groupId: string, offset: number, size: number): Promise<LiveChannelPage>;
  activeSnapshot(): Promise<string | undefined>;
}
async function check(catalog: LiveCatalog, port: LiveNavigationPort, signal: AbortSignal): Promise<void> {
  if (signal.aborted || await port.activeSnapshot() !== catalog.snapshotId || signal.aborted) throw Error('LIVE_NAVIGATION_CHANGED');
}
/** Reads at most one 48-channel page at a time, preserving source order. */
export async function adjacentLiveChannel(catalog: LiveCatalog, channel: LiveChannel, direction: -1 | 1, port: LiveNavigationPort, signal: AbortSignal): Promise<LiveChannel | undefined> {
  let offset = 0, previous: LiveChannel | undefined, found = false;
  const fingerprint = liveChannelFingerprint(channel, catalog);
  for (let count = 0; count < 1000; count++) {
    await check(catalog, port, signal);
    const page = await port.loadPage(channel.groupId, offset, 48);
    await check(catalog, port, signal);
    for (const candidate of page.channels) {
      if (candidate.groupId !== channel.groupId) throw Error('LIVE_NAVIGATION_INVALID');
      if (found) return candidate;
      if (liveChannelFingerprint(candidate, catalog) === fingerprint && candidate.id === channel.id) {
        if (direction === -1) return previous;
        found = true;
      }
      previous = candidate;
    }
    if (page.nextOffset === null) { if (!found) throw Error('LIVE_CHANNEL_CHANGED'); return undefined; }
    if (page.nextOffset <= offset) throw Error('LIVE_NAVIGATION_INVALID');
    offset = page.nextOffset;
  }
  throw Error('LIVE_NAVIGATION_LIMIT');
}
export interface FavoriteCursor { group: number; offset: number }
export async function favoriteLivePage(catalog: LiveCatalog, keys: ReadonlySet<string>, port: LiveNavigationPort, signal: AbortSignal, cursor: FavoriteCursor = { group: 0, offset: 0 }): Promise<{ channels: LiveChannel[]; next: FavoriteCursor | null }> {
  const channels: LiveChannel[] = [];
  if (!keys.size) return { channels, next: null };
  let group = cursor.group, offset = cursor.offset;
  for (let count = 0; count < 1000 && group < catalog.groups.length; count++) {
    await check(catalog, port, signal);
    const groupId = catalog.groups[group].id, page = await port.loadPage(groupId, offset, 48);
    await check(catalog, port, signal);
    // Stop at a page boundary; do not discard matches or hold full catalog objects.
    const matches = page.channels.filter(c => c.groupId === groupId && keys.has(liveChannelFingerprint(c, catalog)));
    if (channels.length && channels.length + matches.length > 48) return { channels, next: { group, offset } };
    channels.push(...matches);
    if (page.nextOffset === null) { group++; offset = 0; }
    else { if (page.nextOffset <= offset) throw Error('LIVE_NAVIGATION_INVALID'); offset = page.nextOffset; }
    if (channels.length === 48) return { channels, next: group < catalog.groups.length ? { group, offset } : null };
  }
  if (group < catalog.groups.length) throw Error('LIVE_NAVIGATION_LIMIT');
  return { channels, next: null };
}
