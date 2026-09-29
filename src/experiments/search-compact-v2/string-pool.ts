/**
 * Xandeflix Prebuilt — String Pool (Experiment R3)
 *
 * Pool de strings deduplicadas para serialização e indexação compacta.
 *
 * Princípios:
 * - DEDUPLICATION = SIM
 * - CONTIGUOUS_UTF8_BUFFER = SIM
 * - ZERO_COPY_OFFSETS = SIM
 * - LAZY_DECODING = SIM (decodifica apenas sob demanda e armazena em cache)
 */

export class StringPoolBuilder {
  private map = new Map<string, number>();
  private strings: string[] = [];

  /**
   * Adiciona uma string ao pool e retorna o ID ordinal único atribuído.
   * Se a string já existir, retorna o ID existente sem duplicar.
   */
  add(str: string): number {
    let id = this.map.get(str);
    if (id !== undefined) {
      return id;
    }
    id = this.strings.length;
    this.strings.push(str);
    this.map.set(str, id);
    return id;
  }

  /**
   * Constrói o buffer contíguo UTF-8 e o array de offsets.
   */
  build(): {
    offsets: Uint32Array;
    data: Uint8Array;
    count: number;
    strings: string[];
  } {
    const count = this.strings.length;
    const offsets = new Uint32Array(count + 1);
    const encoder = new TextEncoder();
    const encodedBuffers: Uint8Array[] = new Array(count);

    let totalBytes = 0;
    for (let i = 0; i < count; i++) {
      const bytes = encoder.encode(this.strings[i]);
      encodedBuffers[i] = bytes;
      offsets[i] = totalBytes;
      totalBytes += bytes.length;
    }
    offsets[count] = totalBytes;

    const data = new Uint8Array(totalBytes);
    for (let i = 0; i < count; i++) {
      data.set(encodedBuffers[i], offsets[i]);
    }

    return {
      offsets,
      data,
      count,
      strings: this.strings,
    };
  }
}

export class StringPool {
  readonly count: number;
  readonly offsets: Uint32Array;
  readonly data: Uint8Array;
  private cache: (string | undefined)[];
  private decoder = new TextDecoder('utf-8');

  constructor(offsets: Uint32Array, data: Uint8Array, count?: number, initialStrings?: string[]) {
    this.offsets = offsets;
    this.data = data;
    this.count = count ?? offsets.length - 1;
    this.cache = new Array(this.count);

    if (initialStrings) {
      for (let i = 0; i < initialStrings.length; i++) {
        this.cache[i] = initialStrings[i];
      }
    }
  }

  getString(id: number): string {
    if (id < 0 || id >= this.count) {
      throw new Error(`String ID fora dos limites do pool: ${id} (total: ${this.count})`);
    }

    const cached = this.cache[id];
    if (cached !== undefined) {
      return cached;
    }

    const start = this.offsets[id];
    const end = this.offsets[id + 1];
    const bytes = this.data.subarray(start, end);
    const str = this.decoder.decode(bytes);
    this.cache[id] = str;
    return str;
  }

  get byteLength(): number {
    return this.offsets.byteLength + this.data.byteLength;
  }
}
