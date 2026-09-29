/**
 * Xandeflix Prebuilt — Compact Search Index V2 Serializer (Experiment R3)
 *
 * Serializa e desserializa o artefato COMPACT_SEARCH_INDEX_V2 em um único
 * container binário auditável (compact-search-index-v2.bin), fornecendo
 * medição precisa de cada componente.
 *
 * Princípios:
 * - AUDITABLE_SECTIONS = SIM
 * - ZERO_EXTERNAL_DEPENDENCY = SIM
 * - COMPONENT_BREAKDOWN = SIM
 */

import {
  COMPACT_SEARCH_INDEX_V2_MAGIC,
  COMPACT_SEARCH_INDEX_V2_VERSION,
  type CompactSearchIndexV2,
  type CompactSearchIndexV2Metadata,
  type ComponentByteBreakdown,
} from './compact-search-v2.types.ts';
import { StringPool } from './string-pool.ts';

export function serializeCompactIndexV2(index: CompactSearchIndexV2): {
  buffer: Buffer;
  breakdown: ComponentByteBreakdown;
} {
  // 1. Metadata JSON
  const metaStr = JSON.stringify(index.metadata);
  const metaBytes = Buffer.from(metaStr, 'utf8');
  const metaPaddedLen = Math.ceil(metaBytes.length / 4) * 4;

  // 2. String Pool
  const spOffsetsBytes = Buffer.from(
    index.stringPool.offsets.buffer,
    index.stringPool.offsets.byteOffset,
    index.stringPool.offsets.byteLength
  );
  const spDataBytes = Buffer.from(
    index.stringPool.data.buffer,
    index.stringPool.data.byteOffset,
    index.stringPool.data.byteLength
  );
  const spDataPaddedLen = Math.ceil(spDataBytes.length / 4) * 4;
  const stringPoolTotalLen = spOffsetsBytes.length + spDataPaddedLen;

  // 3. Document Table
  const docCount = index.metadata.documentCount;
  const kindsBytes = Buffer.from(index.docKinds.buffer, index.docKinds.byteOffset, docCount);
  const kindsPaddedLen = Math.ceil(kindsBytes.length / 4) * 4;

  const yearsBytes = Buffer.from(index.docYears.buffer, index.docYears.byteOffset, docCount * 2);
  const yearsPaddedLen = Math.ceil(yearsBytes.length / 4) * 4;

  const canonIdsBytes = Buffer.from(index.docCanonicalIdIds.buffer, index.docCanonicalIdIds.byteOffset, docCount * 4);
  const titleIdsBytes = Buffer.from(index.docTitleIds.buffer, index.docTitleIds.byteOffset, docCount * 4);
  const origTitleIdsBytes = Buffer.from(index.docOriginalTitleIds.buffer, index.docOriginalTitleIds.byteOffset, docCount * 4);

  const docTableTotalLen =
    kindsPaddedLen + yearsPaddedLen + canonIdsBytes.length + titleIdsBytes.length + origTitleIdsBytes.length;

  // 4. Token Dictionary
  const tokenCount = index.metadata.tokenCount;
  const tokenOffsets = new Uint32Array(tokenCount + 1);
  const tokenEncoder = new TextEncoder();
  const tokenBuffers: Uint8Array[] = new Array(tokenCount);
  let totalTokenBytes = 0;
  for (let i = 0; i < tokenCount; i++) {
    const bytes = tokenEncoder.encode(index.tokens[i]);
    tokenBuffers[i] = bytes;
    tokenOffsets[i] = totalTokenBytes;
    totalTokenBytes += bytes.length;
  }
  tokenOffsets[tokenCount] = totalTokenBytes;

  const tokenData = new Uint8Array(totalTokenBytes);
  for (let i = 0; i < tokenCount; i++) {
    tokenData.set(tokenBuffers[i], tokenOffsets[i]);
  }
  const tokenOffsetsBytes = Buffer.from(tokenOffsets.buffer, tokenOffsets.byteOffset, tokenOffsets.byteLength);
  const tokenDataPaddedLen = Math.ceil(totalTokenBytes / 4) * 4;
  const tokenDictTotalLen = tokenOffsetsBytes.length + tokenDataPaddedLen;

  // 5. Exact Index
  const exactTitleCount = index.metadata.exactTitleCount;
  const exactTitlesOffsets = new Uint32Array(exactTitleCount + 1);
  const exactTitlesBuffers: Uint8Array[] = new Array(exactTitleCount);
  let totalExactTitlesBytes = 0;
  for (let i = 0; i < exactTitleCount; i++) {
    const bytes = tokenEncoder.encode(index.exactTitles[i]);
    exactTitlesBuffers[i] = bytes;
    exactTitlesOffsets[i] = totalExactTitlesBytes;
    totalExactTitlesBytes += bytes.length;
  }
  exactTitlesOffsets[exactTitleCount] = totalExactTitlesBytes;

  const exactTitlesData = new Uint8Array(totalExactTitlesBytes);
  for (let i = 0; i < exactTitleCount; i++) {
    exactTitlesData.set(exactTitlesBuffers[i], exactTitlesOffsets[i]);
  }
  const exactTitlesOffsetsBytes = Buffer.from(exactTitlesOffsets.buffer, exactTitlesOffsets.byteOffset, exactTitlesOffsets.byteLength);
  const exactTitlesDataPaddedLen = Math.ceil(totalExactTitlesBytes / 4) * 4;

  const exactOffsetsBytes = Buffer.from(index.exactOffsets.buffer, index.exactOffsets.byteOffset, index.exactOffsets.byteLength);
  const exactDocIdsBytes = Buffer.from(index.exactDocIds.buffer, index.exactDocIds.byteOffset, index.exactDocIds.byteLength);
  const exactDocIdsPaddedLen = Math.ceil(exactDocIdsBytes.length / 4) * 4;

  const exactIndexTotalLen =
    exactTitlesOffsetsBytes.length +
    exactTitlesDataPaddedLen +
    exactOffsetsBytes.length +
    exactDocIdsPaddedLen;

  // 6. Postings (Delta + Varint)
  const postingsOffsetsBytes = Buffer.from(
    index.postingsOffsets.buffer,
    index.postingsOffsets.byteOffset,
    index.postingsOffsets.byteLength
  );
  const postingsBytes = Buffer.from(
    index.postingsBytes.buffer,
    index.postingsBytes.byteOffset,
    index.postingsBytes.byteLength
  );
  const postingsBytesPaddedLen = Math.ceil(postingsBytes.length / 4) * 4;
  const postingsTotalLen = postingsOffsetsBytes.length + postingsBytesPaddedLen;

  // 7. Alocação do Buffer Total
  const headerSize = 64;
  const totalBufferSize =
    headerSize +
    metaPaddedLen +
    stringPoolTotalLen +
    docTableTotalLen +
    tokenDictTotalLen +
    exactIndexTotalLen +
    postingsTotalLen;

  const buffer = Buffer.alloc(totalBufferSize);

  // Escrever Header (16 x uint32)
  buffer.writeUInt32LE(COMPACT_SEARCH_INDEX_V2_MAGIC, 0);
  buffer.writeUInt32LE(COMPACT_SEARCH_INDEX_V2_VERSION, 4);
  buffer.writeUInt32LE(docCount, 8);
  buffer.writeUInt32LE(tokenCount, 12);
  buffer.writeUInt32LE(exactTitleCount, 16);
  buffer.writeUInt32LE(index.metadata.stringPoolCount, 20);
  buffer.writeUInt32LE(metaBytes.length, 24);
  buffer.writeUInt32LE(metaPaddedLen, 28);
  buffer.writeUInt32LE(stringPoolTotalLen, 32);
  buffer.writeUInt32LE(docTableTotalLen, 36);
  buffer.writeUInt32LE(tokenDictTotalLen, 40);
  buffer.writeUInt32LE(exactIndexTotalLen, 44);
  buffer.writeUInt32LE(postingsTotalLen, 48);
  buffer.writeUInt32LE(index.metadata.totalPostingsCount, 52);
  buffer.writeUInt32LE(index.metadata.totalPostingsBytes, 56);
  buffer.writeUInt32LE(0, 60);

  let currentOffset = headerSize;

  // Escrever Section 1: Metadata
  metaBytes.copy(buffer, currentOffset);
  currentOffset += metaPaddedLen;

  // Escrever Section 2: String Pool
  spOffsetsBytes.copy(buffer, currentOffset);
  currentOffset += spOffsetsBytes.length;
  spDataBytes.copy(buffer, currentOffset);
  currentOffset += spDataPaddedLen;

  // Escrever Section 3: Document Table
  kindsBytes.copy(buffer, currentOffset);
  currentOffset += kindsPaddedLen;
  yearsBytes.copy(buffer, currentOffset);
  currentOffset += yearsPaddedLen;
  canonIdsBytes.copy(buffer, currentOffset);
  currentOffset += canonIdsBytes.length;
  titleIdsBytes.copy(buffer, currentOffset);
  currentOffset += titleIdsBytes.length;
  origTitleIdsBytes.copy(buffer, currentOffset);
  currentOffset += origTitleIdsBytes.length;

  // Escrever Section 4: Token Dictionary
  tokenOffsetsBytes.copy(buffer, currentOffset);
  currentOffset += tokenOffsetsBytes.length;
  Buffer.from(tokenData).copy(buffer, currentOffset);
  currentOffset += tokenDataPaddedLen;

  // Escrever Section 5: Exact Index
  exactTitlesOffsetsBytes.copy(buffer, currentOffset);
  currentOffset += exactTitlesOffsetsBytes.length;
  Buffer.from(exactTitlesData).copy(buffer, currentOffset);
  currentOffset += exactTitlesDataPaddedLen;
  exactOffsetsBytes.copy(buffer, currentOffset);
  currentOffset += exactOffsetsBytes.length;
  exactDocIdsBytes.copy(buffer, currentOffset);
  currentOffset += exactDocIdsPaddedLen;

  // Escrever Section 6: Postings
  postingsOffsetsBytes.copy(buffer, currentOffset);
  currentOffset += postingsOffsetsBytes.length;
  postingsBytes.copy(buffer, currentOffset);

  const breakdown: ComponentByteBreakdown = {
    metadataBytes: headerSize + metaPaddedLen,
    stringPoolBytes: stringPoolTotalLen,
    documentTableBytes: docTableTotalLen,
    tokenDictionaryBytes: tokenDictTotalLen,
    exactIndexBytes: exactIndexTotalLen,
    postingsBytes: postingsTotalLen,
    totalBytes: buffer.length,
  };

  return { buffer, breakdown };
}

export function deserializeCompactIndexV2(rawBuffer: Buffer | Uint8Array): CompactSearchIndexV2 {
  const buffer = rawBuffer instanceof Uint8Array ? rawBuffer : new Uint8Array(rawBuffer);

  if (buffer.length < 64) {
    throw new Error('Buffer muito curto para cabeçalho do CompactSearchIndex V2');
  }

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  const magic = view.getUint32(0, true);
  if (magic !== COMPACT_SEARCH_INDEX_V2_MAGIC) {
    throw new Error(`Magic inválido no CompactSearchIndex V2: 0x${magic.toString(16)}`);
  }

  const version = view.getUint32(4, true);
  if (version !== COMPACT_SEARCH_INDEX_V2_VERSION) {
    throw new Error(`Versão não suportada no CompactSearchIndex V2: ${version}`);
  }

  const docCount = view.getUint32(8, true);
  const tokenCount = view.getUint32(12, true);
  const exactTitleCount = view.getUint32(16, true);
  const stringPoolCount = view.getUint32(20, true);
  const metaActualLen = view.getUint32(24, true);
  const metaPaddedLen = view.getUint32(28, true);

  const headerSize = 64;
  let currentOffset = headerSize;

  // 1. Metadata
  const metaDecoder = new TextDecoder('utf-8');
  const metaStr = metaDecoder.decode(buffer.subarray(currentOffset, currentOffset + metaActualLen));
  const metadata = JSON.parse(metaStr) as CompactSearchIndexV2Metadata;
  currentOffset += metaPaddedLen;

  // 2. String Pool
  const spOffsetsLen = (stringPoolCount + 1) * 4;
  const spOffsetsBuf = buffer.subarray(currentOffset, currentOffset + spOffsetsLen);
  const spOffsets = new Uint32Array(
    spOffsetsBuf.buffer,
    spOffsetsBuf.byteOffset,
    stringPoolCount + 1
  );
  currentOffset += spOffsetsLen;

  const spDataLen = spOffsets[stringPoolCount];
  const spDataPaddedLen = Math.ceil(spDataLen / 4) * 4;
  const spData = buffer.subarray(currentOffset, currentOffset + spDataLen);
  currentOffset += spDataPaddedLen;

  const stringPool = new StringPool(spOffsets, spData, stringPoolCount);

  // 3. Document Table
  const kindsPaddedLen = Math.ceil(docCount / 4) * 4;
  const docKinds = new Uint8Array(buffer.buffer, buffer.byteOffset + currentOffset, docCount);
  currentOffset += kindsPaddedLen;

  const yearsPaddedLen = Math.ceil((docCount * 2) / 4) * 4;
  const docYears = new Uint16Array(buffer.buffer, buffer.byteOffset + currentOffset, docCount);
  currentOffset += yearsPaddedLen;

  const docCanonicalIdIds = new Uint32Array(buffer.buffer, buffer.byteOffset + currentOffset, docCount);
  currentOffset += docCount * 4;

  const docTitleIds = new Uint32Array(buffer.buffer, buffer.byteOffset + currentOffset, docCount);
  currentOffset += docCount * 4;

  const docOriginalTitleIds = new Int32Array(buffer.buffer, buffer.byteOffset + currentOffset, docCount);
  currentOffset += docCount * 4;

  // 4. Token Dictionary
  const tokenOffsetsLen = (tokenCount + 1) * 4;
  const tokenOffsetsBuf = buffer.subarray(currentOffset, currentOffset + tokenOffsetsLen);
  const tokenOffsets = new Uint32Array(
    tokenOffsetsBuf.buffer,
    tokenOffsetsBuf.byteOffset,
    tokenCount + 1
  );
  currentOffset += tokenOffsetsLen;

  const tokenDataLen = tokenOffsets[tokenCount];
  const tokenDataPaddedLen = Math.ceil(tokenDataLen / 4) * 4;
  const tokenData = buffer.subarray(currentOffset, currentOffset + tokenDataLen);
  currentOffset += tokenDataPaddedLen;

  const tokenDecoder = new TextDecoder('utf-8');
  const tokens = new Array<string>(tokenCount);
  for (let i = 0; i < tokenCount; i++) {
    tokens[i] = tokenDecoder.decode(tokenData.subarray(tokenOffsets[i], tokenOffsets[i + 1]));
  }

  // 5. Exact Index
  const exactTitlesOffsetsLen = (exactTitleCount + 1) * 4;
  const exactTitlesOffsetsBuf = buffer.subarray(currentOffset, currentOffset + exactTitlesOffsetsLen);
  const exactTitlesOffsets = new Uint32Array(
    exactTitlesOffsetsBuf.buffer,
    exactTitlesOffsetsBuf.byteOffset,
    exactTitleCount + 1
  );
  currentOffset += exactTitlesOffsetsLen;

  const exactTitlesDataLen = exactTitlesOffsets[exactTitleCount];
  const exactTitlesDataPaddedLen = Math.ceil(exactTitlesDataLen / 4) * 4;
  const exactTitlesData = buffer.subarray(currentOffset, currentOffset + exactTitlesDataLen);
  currentOffset += exactTitlesDataPaddedLen;

  const exactTitles = new Array<string>(exactTitleCount);
  for (let i = 0; i < exactTitleCount; i++) {
    exactTitles[i] = tokenDecoder.decode(
      exactTitlesData.subarray(exactTitlesOffsets[i], exactTitlesOffsets[i + 1])
    );
  }

  const exactOffsetsLen = (exactTitleCount + 1) * 4;
  const exactOffsetsBuf = buffer.subarray(currentOffset, currentOffset + exactOffsetsLen);
  const exactOffsets = new Uint32Array(
    exactOffsetsBuf.buffer,
    exactOffsetsBuf.byteOffset,
    exactTitleCount + 1
  );
  currentOffset += exactOffsetsLen;

  const exactDocIdsLen = exactOffsets[exactTitleCount];
  const exactDocIdsPaddedLen = Math.ceil(exactDocIdsLen / 4) * 4;
  const exactDocIds = buffer.subarray(currentOffset, currentOffset + exactDocIdsLen);
  currentOffset += exactDocIdsPaddedLen;

  // 6. Postings
  const postingsOffsetsLen = (tokenCount + 1) * 4;
  const postingsOffsetsBuf = buffer.subarray(currentOffset, currentOffset + postingsOffsetsLen);
  const postingsOffsets = new Uint32Array(
    postingsOffsetsBuf.buffer,
    postingsOffsetsBuf.byteOffset,
    tokenCount + 1
  );
  currentOffset += postingsOffsetsLen;

  const totalPostingsBytes = postingsOffsets[tokenCount];
  const postingsBytes = buffer.subarray(currentOffset, currentOffset + totalPostingsBytes);

  return {
    metadata,
    stringPool,
    docKinds,
    docYears,
    docCanonicalIdIds,
    docTitleIds,
    docOriginalTitleIds,
    exactTitles,
    exactOffsets,
    exactDocIds,
    tokens,
    postingsOffsets,
    postingsBytes,
  };
}
