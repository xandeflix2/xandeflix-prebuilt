import type { LiveCatalog, LiveChannel } from '../catalog/live/live-tv.types.ts';
import { liveChannelFingerprint } from './last-live-channel.ts';
import { watchFingerprint } from './watch-history.ts';

const KEY = 'xandeflix.live-favorites.v1';
type Port = Pick<Storage, 'getItem' | 'setItem'>;
type Rows = Record<string, string[]>;
const digest = /^[0-9a-f]{16}$/;
export function liveFavoriteScope(sourceId: string): string {
  return watchFingerprint('movie', { title: `live-source:${sourceId}` });
}
/** Presentation preference only: no catalog, source credentials or URLs. */
export class LiveFavorites {
  private readonly port: () => Port | undefined;
  constructor(port: () => Port | undefined = () => typeof window === 'undefined' ? undefined : window.localStorage) { this.port = port; }
  private read(): Rows {
    const raw = this.port()?.getItem(KEY);
    if (!raw) return {};
    if (raw.length > 40000) throw Error('LIVE_FAVORITES_INVALID');
    const data = JSON.parse(raw);
    if (data.version !== 1 || !data.sources || typeof data.sources !== 'object' || Array.isArray(data.sources)) throw Error('LIVE_FAVORITES_INVALID');
    const entries = Object.entries(data.sources);
    if (entries.length > 10) throw Error('LIVE_FAVORITES_LIMIT');
    for (const [scope, values] of entries) if (!digest.test(scope) || !Array.isArray(values) || values.length > 200 || values.some(v => typeof v !== 'string' || !digest.test(v))) throw Error('LIVE_FAVORITES_INVALID');
    return data.sources;
  }
  keys(scope: string): Set<string> { if (!digest.test(scope)) throw Error('LIVE_FAVORITES_INVALID'); return new Set(this.read()[scope] || []); }
  toggle(scope: string, channel: LiveChannel, catalog: LiveCatalog): Set<string> {
    if (!digest.test(scope)) throw Error('LIVE_FAVORITES_INVALID');
    const rows = this.read(), values = new Set(rows[scope] || []), key = liveChannelFingerprint(channel, catalog);
    if (values.has(key)) values.delete(key); else values.add(key);
    if (values.size > 200 || (!(scope in rows) && Object.keys(rows).length >= 10)) throw Error('LIVE_FAVORITES_LIMIT');
    rows[scope] = [...values];
    const raw = JSON.stringify({ version: 1, sources: rows }), port = this.port();
    if (!port) throw Error('LIVE_FAVORITES_UNAVAILABLE');
    port.setItem(KEY, raw);
    if (port.getItem(KEY) !== raw) throw Error('LIVE_FAVORITES_UNAVAILABLE');
    return values;
  }
}
export const liveFavorites = new LiveFavorites();
