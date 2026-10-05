/**
 * Xandeflix Prebuilt — Artifact Hash (Gate G10)
 *
 * Cálculo determinístico de hash SHA-256 e tamanho exato para artefatos brutos.
 * Implementação puramente streaming para compatibilidade com browser/WebView sem estourar memória.
 */

export interface ArtifactDigest {
  sha256: string;
  sizeBytes: number;
}

export function getUtf8ByteLength(str: string): number {
  let byteLen = 0;
  const len = str.length;
  for (let i = 0; i < len; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x7f) {
      byteLen += 1;
    } else if (code <= 0x7ff) {
      byteLen += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      byteLen += 4;
      i++;
    } else {
      byteLen += 3;
    }
  }
  return byteLen;
}

function rightRotate(value: number, amount: number) {
  return (value >>> amount) | (value << (32 - amount));
}

export function createSha256Stream() {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i: number;
  const hash = new Uint32Array(8);
  const k = new Uint32Array(64);
  let primeCounter = 0;
  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      }
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  const w = new Uint32Array(64);
  const blockBuf = new Uint8Array(64);
  const blockView = new DataView(blockBuf.buffer);
  let blockLen = 0;
  let totalBytes = 0;

  function processBlock(view: DataView, offset: number) {
    for (let m = 0; m < 16; m++) {
      w[m] = view.getUint32(offset + (m << 2), false);
    }
    for (let m = 16; m < 64; m++) {
      const w15 = w[m - 15];
      const w2 = w[m - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[m] = (w[m - 16] + s0 + w[m - 7] + s1) | 0;
    }
    let a = hash[0],
      b = hash[1],
      c = hash[2],
      d = hash[3];
    let e = hash[4],
      f = hash[5],
      g = hash[6],
      h = hash[7];

    for (let m = 0; m < 64; m++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[m] + w[m]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  function update(bytes: Uint8Array) {
    let offset = 0;
    let len = bytes.length;
    totalBytes += len;

    if (blockLen > 0) {
      const copyLen = Math.min(64 - blockLen, len);
      blockBuf.set(bytes.subarray(0, copyLen), blockLen);
      blockLen += copyLen;
      offset += copyLen;
      len -= copyLen;
      if (blockLen === 64) {
        processBlock(blockView, 0);
        blockLen = 0;
      }
    }

    const fullBlocks = (len >> 6) << 6;
    if (fullBlocks > 0) {
      const inView = new DataView(bytes.buffer, bytes.byteOffset + offset, fullBlocks);
      for (let j = 0; j < fullBlocks; j += 64) {
        processBlock(inView, j);
      }
      offset += fullBlocks;
      len -= fullBlocks;
    }

    if (len > 0) {
      blockBuf.set(bytes.subarray(offset, offset + len), 0);
      blockLen = len;
    }
  }

  function digest(): string {
    const bitLength = totalBytes * 8;
    blockBuf[blockLen] = 0x80;
    blockLen++;

    if (blockLen > 56) {
      blockBuf.fill(0, blockLen);
      processBlock(blockView, 0);
      blockLen = 0;
    }

    blockBuf.fill(0, blockLen, 56);
    blockView.setUint32(60, bitLength >>> 0, false);
    blockView.setUint32(56, Math.floor(bitLength / maxWord), false);
    processBlock(blockView, 0);

    let res = '';
    for (let m = 0; m < 8; m++) {
      for (let n = 3; n >= 0; n--) {
        const byte = (hash[m] >>> (n * 8)) & 255;
        res += (byte < 16 ? '0' : '') + byte.toString(16);
      }
    }
    return res;
  }

  return { update, digest };
}

export function hashStringPure(str: string): string {
  const hasher = createSha256Stream();
  const encoder = new TextEncoder();
  const chunkLen = 65536;
  const chunkBuf = new Uint8Array(chunkLen * 3);
  for (let i = 0; i < str.length; i += chunkLen) {
    const slice = str.slice(i, i + chunkLen);
    const { written } = encoder.encodeInto(slice, chunkBuf);
    hasher.update(chunkBuf.subarray(0, written));
  }
  return hasher.digest();
}

export function hashBytesPure(bytes: Uint8Array): string {
  const hasher = createSha256Stream();
  hasher.update(bytes);
  return hasher.digest();
}

export function calculateArtifactDigest(buffer: Buffer | Uint8Array | string): ArtifactDigest {
  if (typeof buffer === 'string') {
    const hash = hashStringPure(buffer);
    const sizeBytes = getUtf8ByteLength(buffer);
    return { sha256: hash.toLowerCase(), sizeBytes };
  }

  const hash = hashBytesPure(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer));
  return {
    sha256: hash.toLowerCase(),
    sizeBytes: buffer.length,
  };
}
