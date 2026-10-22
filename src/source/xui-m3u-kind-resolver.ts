/** Ephemeral provider metadata only. Never retain names, credentials or media URLs. */
type Kind = 'live' | 'movie';
type Loader = (action?: string, params?: Record<string, string>) => Promise<unknown>;
const MAX_CATEGORIES = 512;
const MAX_GROUPS = 256;
const MAX_CACHED_IDS = 200_000;
const MAX_CATEGORY_ROWS = 100_000;
const ID = /^[1-9]\d{0,15}$/;

export class XuiM3uResolutionError extends Error {
  constructor() { super('XUI_M3U_KIND_UNCONFIRMED'); }
}
function reject(): never { throw new XuiM3uResolutionError(); }
function numericId(value: unknown): string {
  const text = typeof value === 'number' || typeof value === 'string' ? String(value) : '';
  if (!ID.test(text) || !Number.isSafeInteger(Number(text))) return reject();
  return text;
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return reject();
  return value as Record<string, unknown>;
}

/** A suffix identifies a transport only, never the item's content kind. */
export function opaqueXuiTransport(streamUrl: string): 'ts' | 'm3u8' | 'opaque' | undefined {
  try {
    const url = new URL(streamUrl);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return undefined;
    const parts = url.pathname.split('/');
    if (parts[0] !== '' || parts[1] !== 'play' || !parts[2] || !/^[A-Za-z0-9_=-]+$/.test(parts[2])) return undefined;
    if (parts.length === 3) return 'opaque';
    if (parts.length !== 4) return undefined;
    if (parts[3] === 'ts' || parts[3] === 'mpegts') return 'ts';
    if (parts[3] === 'hls' || parts[3] === 'm3u8') return 'm3u8';
  } catch { /* No endpoint or credentials are inferred from a media URL. */ }
  return undefined;
}

export class XuiM3uKindResolver {
  private categories?: Promise<Map<string, { id: string; kind: Kind }[]>>;
  private groups = new Map<string, Promise<Map<string, Kind | null>>>();
  private cachedIds = 0;
  private readonly load?: Loader;
  constructor(load?: Loader) { this.load = load; }

  private async read(action?: string, params?: Record<string, string>): Promise<unknown> {
    try { return this.load ? await this.load(action, params) : reject(); }
    catch { return reject(); }
  }

  private async loadCategories(): Promise<Map<string, { id: string; kind: Kind }[]>> {
    const auth = record(record(await this.read()).user_info);
    if (String(auth.auth) !== '1' || (auth.status !== undefined && String(auth.status).toLowerCase() !== 'active')) return reject();
    const byName = new Map<string, { id: string; kind: Kind }[]>();
    for (const kind of ['live', 'movie'] as const) {
      const categories = await this.read(kind === 'live' ? 'get_live_categories' : 'get_vod_categories');
      if (!Array.isArray(categories) || categories.length > MAX_CATEGORIES) return reject();
      const seen = new Set<string>();
      for (const value of categories) {
        const row = record(value), id = numericId(row.category_id);
        if (seen.has(id) || typeof row.category_name !== 'string' || !row.category_name.trim()) return reject();
        seen.add(id);
        const name = row.category_name.trim();
        const entries = byName.get(name) || [];
        entries.push({ id, kind }); byName.set(name, entries);
      }
    }
    return byName;
  }

  private async loadGroup(group: string): Promise<Map<string, Kind | null>> {
    this.categories ??= this.loadCategories();
    const matches = (await this.categories).get(group);
    if (!matches?.length) return new Map();
    const mapped = new Map<string, Kind | null>();
    for (const { id, kind } of matches) {
      const rows = await this.read(kind === 'live' ? 'get_live_streams' : 'get_vod_streams', { category_id: id });
      if (!Array.isArray(rows) || rows.length > MAX_CATEGORY_ROWS) return reject();
      const seen = new Set<string>();
      for (const value of rows) {
        const row = record(value), streamId = numericId(row.stream_id);
        if (numericId(row.category_id) !== id || seen.has(streamId)) return reject();
        seen.add(streamId);
        if (!mapped.has(streamId)) {
          if (++this.cachedIds > MAX_CACHED_IDS) return reject();
          mapped.set(streamId, kind);
        } else if (mapped.get(streamId) !== kind) mapped.set(streamId, null);
      }
    }
    return mapped;
  }

  /** Called only after structural classification returned unresolved. */
  async resolve(xuiId: unknown, groupName: string): Promise<Kind | undefined> {
    const id = numericId(xuiId), group = groupName.trim();
    if (!group) return reject();
    let pending = this.groups.get(group);
    if (!pending) {
      if (this.groups.size >= MAX_GROUPS) return reject();
      pending = this.loadGroup(group); this.groups.set(group, pending);
    }
    const kind = (await pending).get(id);
    if (kind === null) return reject();
    return kind;
  }
}
