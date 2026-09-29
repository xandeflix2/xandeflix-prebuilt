import fs from 'node:fs';

// 1. Patch capacitor-filesystem.storage.ts
{
  const p = 'src/bootstrap/storage/capacitor-filesystem.storage.ts';
  let code = fs.readFileSync(p, 'utf8');

  if (!code.includes('resolveSegmentRelativePath')) {
    code = code.replace(
      import type { RecoveryJournalData } from '../../recovery/recovery.types.ts';,
      import type { RecoveryJournalData } from '../../recovery/recovery.types.ts';\nimport { resolveSegmentRelativePath } from './segment-path-resolver.ts';
    );
  }

  code = code.replace(
    /async writeStagingSegment\(snapshotId: string, segmentPath: string, data: string\): Promise<void> \{[\s\S]*?await this\.writeLargeFile\(fullPath, data, 256 \* 1024\);\s*\}/,
    sync writeStagingSegment(snapshotId: string, segmentPath: string, data: string): Promise<void> {\n    const rel = resolveSegmentRelativePath(segmentPath);\n    const fullPath = \\/\/\\;\n    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));\n    await this.ensureDir(dir);\n    await this.writeLargeFile(fullPath, data, 256 * 1024);\n  }
  );

  code = code.replace(
    /async readStagingSegment\(snapshotId: string, segmentPath: string\): Promise<string \| null> \{[\s\S]*?return this\.readTextFileSafely\(\$\{STAGING_DIR\}\/\$\{snapshotId\}\/\$\{segmentPath\}\);\s*\}/,
    sync readStagingSegment(snapshotId: string, segmentPath: string): Promise<string | null> {\n    const rel = resolveSegmentRelativePath(segmentPath);\n    return this.readTextFileSafely(\\/\/\\);\n  }
  );

  code = code.replace(
    /async readActiveSegment\(segmentPath: string\): Promise<string \| null> \{[\s\S]*?return this\.readTextFileSafely\(\$\{SNAPSHOTS_DIR\}\/\$\{pointer\.snapshotId\}\/\$\{segmentPath\}\);\s*\}/,
    sync readActiveSegment(segmentPath: string): Promise<string | null> {\n    const pointer = await this.readActivePointer();\n    if (!pointer) return null;\n    const rel = resolveSegmentRelativePath(segmentPath);\n    return this.readTextFileSafely(\\/\/\\);\n  }
  );

  fs.writeFileSync(p, code, 'utf8');
  console.log('Patched', p);
}

// 2. Patch in-memory.storage.ts
{
  const p = 'src/bootstrap/storage/in-memory.storage.ts';
  let code = fs.readFileSync(p, 'utf8');

  if (!code.includes('resolveSegmentRelativePath')) {
    code = code.replace(
      import type { RecoveryJournalData } from '../../recovery/recovery.types.ts';,
      import type { RecoveryJournalData } from '../../recovery/recovery.types.ts';\nimport { resolveSegmentRelativePath } from './segment-path-resolver.ts';
    );
  }

  code = code.replace(
    /async writeStagingSegment\(snapshotId: string, segmentPath: string, data: string\): Promise<void> \{[\s\S]*?this\.stagingSegments\.set\(\$\{snapshotId\}\/\$\{segmentPath\}, data\);\s*\}/,
    sync writeStagingSegment(snapshotId: string, segmentPath: string, data: string): Promise<void> {\n    const rel = resolveSegmentRelativePath(segmentPath);\n    this.stagingSegments.set(\\/\\, data);\n  }
  );

  code = code.replace(
    /async readStagingSegment\(snapshotId: string, segmentPath: string\): Promise<string \| null> \{[\s\S]*?return this\.stagingSegments\.get\(\$\{snapshotId\}\/segments\/\$\{segmentPath\}\) \?\? null;\s*\}/,
    sync readStagingSegment(snapshotId: string, segmentPath: string): Promise<string | null> {\n    const rel = resolveSegmentRelativePath(segmentPath);\n    return this.stagingSegments.get(\\/\\) ?? null;\n  }
  );

  code = code.replace(
    /async readActiveSegment\(segmentPath: string\): Promise<string \| null> \{[\s\S]*?return this\.snapshotSegments\.get\(\$\{this\.activePointer\.snapshotId\}\/segments\/\$\{segmentPath\}\) \?\? null;\s*\}/,
    sync readActiveSegment(segmentPath: string): Promise<string | null> {\n    if (!this.activePointer) return null;\n    const rel = resolveSegmentRelativePath(segmentPath);\n    return this.snapshotSegments.get(\\/\\) ?? null;\n  }
  );

  fs.writeFileSync(p, code, 'utf8');
  console.log('Patched', p);
}
