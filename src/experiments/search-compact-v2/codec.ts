/**
 * Xandeflix Prebuilt — Delta Encoding & Varint (VByte) Codec (Experiment R3)
 *
 * Implementação pura, determinística e auditável de:
 * 1. Varint / VByte (inteiros sem sinal codificados em 7 bits por byte)
 * 2. Delta Encoding para sequências ordenadas de docIds
 *
 * Princípios:
 * - PURE_FUNCTIONS = SIM
 * - ZERO_EXTERNAL_DEPENDENCY = SIM
 * - DETERMINISTIC_ROUNDTRIP = SIM
 */

/**
 * Codifica um inteiro sem sinal de até 32 bits em bytes Varint/VByte.
 * Escreve no array/buffer de saída e retorna a quantidade de bytes escritos.
 */
export function encodeVarint(value: number, out: number[] | Uint8Array, offset = 0): number {
  let val = value >>> 0;
  let bytesWritten = 0;

  while (val >= 0x80) {
    const byte = (val & 0x7f) | 0x80;
    if (Array.isArray(out)) {
      out.push(byte);
    } else {
      out[offset + bytesWritten] = byte;
    }
    val >>>= 7;
    bytesWritten++;
  }

  if (Array.isArray(out)) {
    out.push(val);
  } else {
    out[offset + bytesWritten] = val;
  }
  bytesWritten++;

  return bytesWritten;
}

/**
 * Decodifica um inteiro sem sinal Varint/VByte a partir de bytes no offset especificado.
 * Retorna uma tupla [valor, bytesLidos].
 */
export function decodeVarint(bytes: Uint8Array, offset = 0): [number, number] {
  let val = 0;
  let shift = 0;
  let byteIdx = offset;

  while (true) {
    if (byteIdx >= bytes.length) {
      throw new Error(`Buffer overrun durante decodificação de Varint no offset ${offset}`);
    }
    const b = bytes[byteIdx++];
    val |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }

  return [val >>> 0, byteIdx - offset];
}

/**
 * Aplica Delta Encoding e Varint em uma lista ordenada de docIds.
 *
 * Exemplo do Contrato:
 * Input:  [10001, 10004, 10005, 10009]
 * Deltas: [10001, 3,     1,     4    ]
 * Output: Uint8Array codificado com Varint.
 */
export function encodeDeltaPosting(sortedDocIds: ArrayLike<number>): Uint8Array {
  if (!sortedDocIds || sortedDocIds.length === 0) {
    return new Uint8Array(0);
  }

  const out: number[] = [];
  let prev = 0;

  for (let i = 0; i < sortedDocIds.length; i++) {
    const docId = sortedDocIds[i];
    const delta = docId - prev;
    prev = docId;
    encodeVarint(delta, out);
  }

  return new Uint8Array(out);
}

/**
 * Decodifica bytes de Varint+Delta restaurando a lista ordenada original de docIds.
 */
export function decodeDeltaPosting(bytes: Uint8Array, expectedCount?: number): Uint32Array {
  if (!bytes || bytes.length === 0) {
    return new Uint32Array(0);
  }

  const out: Uint32Array | number[] = expectedCount !== undefined ? new Uint32Array(expectedCount) : [];
  let prev = 0;
  let offset = 0;
  let idx = 0;

  while (offset < bytes.length) {
    let val = 0;
    let shift = 0;
    while (true) {
      const b = bytes[offset++];
      val |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
    }
    prev = (prev + val) >>> 0;
    if (Array.isArray(out)) {
      out.push(prev);
    } else {
      out[idx++] = prev;
    }
  }

  return Array.isArray(out) ? new Uint32Array(out) : out;
}

/**
 * Decodifica deltas diretamente no bitset de candidatos, evitando alocação de array intermediário.
 */
export function decodeDeltaPostingIntoBitset(
  bytes: Uint8Array,
  bitset: Uint8Array,
  candidateList: number[]
): void {
  if (!bytes || bytes.length === 0) return;

  let prev = 0;
  let offset = 0;

  while (offset < bytes.length) {
    let val = 0;
    let shift = 0;
    while (true) {
      const b = bytes[offset++];
      val |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7;
    }
    prev = (prev + val) >>> 0;
    const docId = prev;
    const byteIdx = docId >>> 3;
    const bitMask = 1 << (docId & 7);
    if ((bitset[byteIdx] & bitMask) === 0) {
      bitset[byteIdx] |= bitMask;
      candidateList.push(docId);
    }
  }
}

/**
 * Validação rigorosa de roundtrip para testes unitários e benchmarks.
 */
export function verifyCodecRoundtrip(originalDocIds: number[]): boolean {
  const encoded = encodeDeltaPosting(originalDocIds);
  const decoded = decodeDeltaPosting(encoded, originalDocIds.length);

  if (decoded.length !== originalDocIds.length) return false;
  for (let i = 0; i < originalDocIds.length; i++) {
    if (decoded[i] !== originalDocIds[i]) return false;
  }
  return true;
}
