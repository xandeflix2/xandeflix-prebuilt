import { Buffer as BrowserBuffer } from 'buffer';

export const WEBVIEW_BUFFER_RUNTIME_API = [
  'Buffer.from',
  'Buffer.isBuffer',
  'Buffer.alloc',
  'Buffer.byteLength',
  'Buffer.prototype.copy',
  'Buffer.prototype.writeUInt32LE',
] as const;

function hasRequiredBufferApi(
  candidate: typeof BrowserBuffer | undefined,
): candidate is typeof BrowserBuffer {
  return Boolean(
    candidate &&
      typeof candidate.from === 'function' &&
      typeof candidate.isBuffer === 'function' &&
      typeof candidate.alloc === 'function' &&
      typeof candidate.byteLength === 'function' &&
      candidate.prototype &&
      typeof candidate.prototype.copy === 'function' &&
      typeof candidate.prototype.writeUInt32LE === 'function',
  );
}

/** Instala somente a implementação browser-compatible quando necessário. */
export function installWebViewBufferCompatibility(): void {
  const runtime = globalThis as typeof globalThis & {
    Buffer?: typeof BrowserBuffer;
    _xandeflixBufferPatched?: boolean;
  };

  // Algumas WebViews expõem um objeto Buffer parcial. Apenas verificar se o
  // objeto existe deixa o serializer quebrar mais tarde em Buffer.alloc/copy.
  if (!hasRequiredBufferApi(runtime.Buffer)) {
    runtime.Buffer = BrowserBuffer;
  }

  if (!runtime._xandeflixBufferPatched && runtime.Buffer) {
    const originalFrom = runtime.Buffer.from as unknown as (...args: unknown[]) => BrowserBuffer;
    const textEncoder = new TextEncoder();
    runtime.Buffer.from = function (value: unknown, encodingOrOffset?: unknown, _length?: unknown) {
      if (typeof value === 'string') {
        const enc = typeof encodingOrOffset === 'string' ? encodingOrOffset.toLowerCase() : 'utf8';
        if (!enc || enc === 'utf8' || enc === 'utf-8') {
          const u8 = textEncoder.encode(value);
          return originalFrom.call(runtime.Buffer, u8.buffer, u8.byteOffset, u8.byteLength);
        }
      }
      return originalFrom.apply(runtime.Buffer, [value, encodingOrOffset, _length]);
    } as unknown as typeof BrowserBuffer.from;
    runtime._xandeflixBufferPatched = true;
  }
}
