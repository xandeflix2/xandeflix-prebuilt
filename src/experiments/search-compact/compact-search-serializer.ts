/**
 * Xandeflix Prebuilt — Compact Search Index Serializer (Experiment R2)
 *
 * Serializa e desserializa o índice COMPACT_SEARCH_INDEX_V1 em um único
 * artefato binário contínuo e auditável (compact-search-index.bin).
 *
 * Layout do Container Binário:
 * [Header: 48 bytes uint32 Little-Endian]
 *   0: Magic (0x58465349 - 'XFSI')
 *   1: Version (1)
 *   2: Document Count
 *   3: Token Count
 *   4: Exact Title Count
 *   5: Total Postings Count
 *   6: Total Exact DocIds Count
 *   7: JSON String Actual Byte Length
 *   8: JSON String Padded Byte Length (4-byte aligned)
 *   9: Postings Offsets Byte Length
 *  10: Postings DocIds Byte Length
 *  11: Exact Offsets Byte Length
 *
 * [Seção 1: JSON payload UTF-8 com alinhamento a 4 bytes]
 *   - metadata
 *   - documents (tuplas compactas [id, kindIdx, title, originalTitle, year])
 *   - exactTitles (strings ordenadas)
 *   - tokens (strings ordenadas)
 *
 * [Seção 2: Postings Offsets (Uint32Array)]
 * [Seção 3: Postings DocIds (Uint32Array)]
 * [Seção 4: Exact Offsets (Uint32Array)]
 * [Seção 5: Exact DocIds (Uint32Array)]
 */

import {
  COMPACT_SEARCH_INDEX_MAGIC,
  COMPACT_SEARCH_INDEX_VERSION,
  type CompactSearchIndex,
  type CompactSearchIndexMetadata,
  type CompactSearchDocument,
} from './compact-search.types.ts';

type CompactDocTuple = [string, number, string, string | null, number | null];

interface SerializedJsonPayload {
  metadata: CompactSearchIndexMetadata;
  docs: CompactDocTuple[];
  exactTitles: string[];
  tokens: string[];
}

export function serializeCompactIndex(index: CompactSearchIndex): Buffer {
  const docTuples: CompactDocTuple[] = index.documents.map((d) => [
    d.canonicalId,
    d.kind === 'movie' ? 0 : 1,
    d.title,
    d.originalTitle ?? null,
    d.year ?? null,
  ]);

  const jsonPayload: SerializedJsonPayload = {
    metadata: index.metadata,
    docs: docTuples,
    exactTitles: index.exactTitles,
    tokens: index.tokens,
  };

  const jsonStr = JSON.stringify(jsonPayload);
  const jsonBytes = Buffer.from(jsonStr, 'utf8');
  const jsonActualLen = jsonBytes.length;
  const jsonPaddedLen = Math.ceil(jsonActualLen / 4) * 4;

  const postingsOffsetsBytes = Buffer.from(
    index.postingsOffsets.buffer,
    index.postingsOffsets.byteOffset,
    index.postingsOffsets.byteLength
  );
  const postingsDocIdsBytes = Buffer.from(
    index.postingsDocIds.buffer,
    index.postingsDocIds.byteOffset,
    index.postingsDocIds.byteLength
  );
  const exactOffsetsBytes = Buffer.from(
    index.exactOffsets.buffer,
    index.exactOffsets.byteOffset,
    index.exactOffsets.byteLength
  );
  const exactDocIdsBytes = Buffer.from(
    index.exactDocIds.buffer,
    index.exactDocIds.byteOffset,
    index.exactDocIds.byteLength
  );

  const headerSize = 48;
  const totalSize =
    headerSize +
    jsonPaddedLen +
    postingsOffsetsBytes.length +
    postingsDocIdsBytes.length +
    exactOffsetsBytes.length +
    exactDocIdsBytes.length;

  const buffer = Buffer.alloc(totalSize);

  // 1. Escrever Header (12 x uint32)
  buffer.writeUInt32LE(COMPACT_SEARCH_INDEX_MAGIC, 0);
  buffer.writeUInt32LE(COMPACT_SEARCH_INDEX_VERSION, 4);
  buffer.writeUInt32LE(index.metadata.documentCount, 8);
  buffer.writeUInt32LE(index.metadata.tokenCount, 12);
  buffer.writeUInt32LE(index.metadata.exactTitleCount, 16);
  buffer.writeUInt32LE(index.metadata.totalPostingsCount, 20);
  buffer.writeUInt32LE(index.metadata.totalExactDocIdsCount, 24);
  buffer.writeUInt32LE(jsonActualLen, 28);
  buffer.writeUInt32LE(jsonPaddedLen, 32);
  buffer.writeUInt32LE(postingsOffsetsBytes.length, 36);
  buffer.writeUInt32LE(postingsDocIdsBytes.length, 40);
  buffer.writeUInt32LE(exactOffsetsBytes.length, 44);

  // 2. Escrever JSON payload
  let currentOffset = headerSize;
  jsonBytes.copy(buffer, currentOffset);
  currentOffset += jsonPaddedLen;

  // 3. Escrever Postings Offsets
  postingsOffsetsBytes.copy(buffer, currentOffset);
  currentOffset += postingsOffsetsBytes.length;

  // 4. Escrever Postings DocIds
  postingsDocIdsBytes.copy(buffer, currentOffset);
  currentOffset += postingsDocIdsBytes.length;

  // 5. Escrever Exact Offsets
  exactOffsetsBytes.copy(buffer, currentOffset);
  currentOffset += exactOffsetsBytes.length;

  // 6. Escrever Exact DocIds
  exactDocIdsBytes.copy(buffer, currentOffset);

  return buffer;
}

export function deserializeCompactIndex(rawBuffer: Buffer | Uint8Array): CompactSearchIndex {
  const buffer = Buffer.isBuffer(rawBuffer) ? rawBuffer : Buffer.from(rawBuffer);

  if (buffer.length < 48) {
    throw new Error('Buffer muito curto para cabeçalho do CompactSearchIndex');
  }

  const magic = buffer.readUInt32LE(0);
  if (magic !== COMPACT_SEARCH_INDEX_MAGIC) {
    throw new Error(`Magic inválido no CompactSearchIndex: 0x${magic.toString(16)}`);
  }

  const version = buffer.readUInt32LE(4);
  if (version !== COMPACT_SEARCH_INDEX_VERSION) {
    throw new Error(`Versão não suportada no CompactSearchIndex: ${version}`);
  }

  const docCount = buffer.readUInt32LE(8);
  const tokenCount = buffer.readUInt32LE(12);
  const exactTitleCount = buffer.readUInt32LE(16);
  const totalPostingsCount = buffer.readUInt32LE(20);
  const totalExactDocIdsCount = buffer.readUInt32LE(24);
  const jsonActualLen = buffer.readUInt32LE(28);
  const jsonPaddedLen = buffer.readUInt32LE(32);
  const poLen = buffer.readUInt32LE(36);
  const pdLen = buffer.readUInt32LE(40);
  const eoLen = buffer.readUInt32LE(44);

  const headerSize = 48;
  let currentOffset = headerSize;

  // 1. Ler JSON payload
  const jsonStr = buffer.toString('utf8', currentOffset, currentOffset + jsonActualLen);
  const jsonPayload = JSON.parse(jsonStr) as SerializedJsonPayload;
  currentOffset += jsonPaddedLen;

  // 2. Ler TypedArrays usando subarrays alinhados
  // Nota: criamos cópias ou views diretas garantindo alinhamento de 4 bytes
  const poBuffer = buffer.subarray(currentOffset, currentOffset + poLen);
  const postingsOffsets = new Uint32Array(
    poBuffer.buffer,
    poBuffer.byteOffset,
    tokenCount + 1
  );
  currentOffset += poLen;

  const pdBuffer = buffer.subarray(currentOffset, currentOffset + pdLen);
  const postingsDocIds = new Uint32Array(
    pdBuffer.buffer,
    pdBuffer.byteOffset,
    totalPostingsCount
  );
  currentOffset += pdLen;

  const eoBuffer = buffer.subarray(currentOffset, currentOffset + eoLen);
  const exactOffsets = new Uint32Array(
    eoBuffer.buffer,
    eoBuffer.byteOffset,
    exactTitleCount + 1
  );
  currentOffset += eoLen;

  const edLen = totalExactDocIdsCount * 4;
  const edBuffer = buffer.subarray(currentOffset, currentOffset + edLen);
  const exactDocIds = new Uint32Array(
    edBuffer.buffer,
    edBuffer.byteOffset,
    totalExactDocIdsCount
  );

  // 3. Reconstruir documentos
  const documents: CompactSearchDocument[] = jsonPayload.docs.map((tuple, i) => ({
    docId: i,
    canonicalId: tuple[0],
    kind: tuple[1] === 0 ? 'movie' : 'series',
    title: tuple[2],
    originalTitle: tuple[3] ?? undefined,
    year: tuple[4] ?? undefined,
  }));

  if (documents.length !== docCount) {
    throw new Error(`Contagem de documentos divergente: esperado ${docCount}, obtido ${documents.length}`);
  }

  return {
    metadata: jsonPayload.metadata,
    documents,
    exactTitles: jsonPayload.exactTitles,
    exactOffsets,
    exactDocIds,
    tokens: jsonPayload.tokens,
    postingsOffsets,
    postingsDocIds,
  };
}
