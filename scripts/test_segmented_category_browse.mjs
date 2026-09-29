import { execSync } from 'child_process';
const adb = process.env.LOCALAPPDATA + '\\Android\\Sdk\\platform-tools\\adb.exe';

const mockStorage = {
  async readActiveManifest() {
    const raw = execSync(adb + ' -s G071CQ070344374G shell run-as com.xandeflix.prebuilt cat files/prebuilt/snapshots/snap-muje31lb/manifest.json').toString();
    return JSON.parse(raw);
  },
  async readActiveSegment(relPath) {
    const fileName = relPath.replace(/^segments\//, '');
    const raw = execSync(adb + ' -s G071CQ070344374G shell run-as com.xandeflix.prebuilt cat files/prebuilt/snapshots/snap-muje31lb/segments/' + fileName).toString();
    return raw;
  }
};

class TestSegmentedBrowseService {
  constructor(storage) {
    this.storage = storage;
    this.categoryCountCache = new Map();
  }

  async loadPage(kind, cursor = { segment: 0, offset: 0 }, pageSize = 48, categoryId) {
    const manifest = await this.storage.readActiveManifest();
    const segments = (manifest?.segments || []).filter((entry) => entry.kind === kind && entry.fileName);
    const totalAvailable = categoryId
      ? await this.countCategory(segments, categoryId)
      : Number(manifest?.counts?.[kind] || 0);
    const items = [];
    let segmentIndex = cursor.segment;
    let offset = cursor.offset;
    while (segmentIndex < segments.length && items.length < pageSize) {
      const raw = await this.storage.readActiveSegment(segments[segmentIndex].fileName);
      let records = [];
      try {
        const parsed = raw ? JSON.parse(raw) : [];
        records = Array.isArray(parsed) ? parsed : [];
      } catch { records = []; }
      let index = offset;
      while (index < records.length && items.length < pageSize) {
        const record = records[index++];
        if (!categoryId || record.categoryIds.includes(categoryId)) items.push(record);
      }
      if (items.length >= pageSize) {
        return {
          items, totalAvailable,
          nextCursor: index < records.length ? { segment: segmentIndex, offset: index } : { segment: segmentIndex + 1, offset: 0 },
        };
      }
      segmentIndex++;
      offset = 0;
    }
    return { items, totalAvailable, nextCursor: null };
  }

  async countCategory(segments, categoryId) {
    const cached = this.categoryCountCache.get(categoryId);
    if (cached !== undefined) return cached;
    let count = 0;
    for (const segment of segments) {
      const raw = await this.storage.readActiveSegment(segment.fileName);
      try {
        const records = raw ? JSON.parse(raw) : [];
        if (Array.isArray(records)) {
          count += records.filter((record) => record?.categoryIds?.includes(categoryId)).length;
        }
      } catch {}
    }
    this.categoryCountCache.set(categoryId, count);
    return count;
  }
}

const service = new TestSegmentedBrowseService(mockStorage);
console.log('Testing category: cat:m3u:filmes-acao');
const page1 = await service.loadPage('movies', { segment: 0, offset: 0 }, 48, 'cat:m3u:filmes-acao');
console.log('PAGE 1: items =', page1.items.length, 'totalAvailable =', page1.totalAvailable, 'nextCursor =', page1.nextCursor);
const page2 = await service.loadPage('movies', page1.nextCursor, 48, 'cat:m3u:filmes-acao');
console.log('PAGE 2: items =', page2.items.length, 'nextCursor =', page2.nextCursor);
console.log('Item from page 2:', page2.items[0].title);
