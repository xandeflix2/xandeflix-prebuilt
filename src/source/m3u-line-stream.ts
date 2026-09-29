const MAX_M3U_LINE_CHARS = 8 * 1024 * 1024;

/**
 * Converte chunks UTF-8 em linhas sem concatenar o payload inteiro.
 * A normalização CRLF/LF replica o contrato de split(/\r?\n/).
 */
export async function* iterateUtf8Lines(
  chunks: AsyncIterable<Uint8Array>,
): AsyncIterable<string> {
  const decoder = new TextDecoder('utf-8');
  let pending = '';

  for await (const chunk of chunks) {
    pending += decoder.decode(chunk, { stream: true });
    let lineStart = 0;
    for (let index = 0; index < pending.length; index += 1) {
      if (pending.charCodeAt(index) !== 10) continue;
      const line = pending.slice(lineStart, index);
      yield line.endsWith('\r') ? line.slice(0, -1) : line;
      lineStart = index + 1;
    }
    pending = pending.slice(lineStart);
    if (pending.length > MAX_M3U_LINE_CHARS) {
      throw new Error('M3U_LINE_TOO_LARGE');
    }
  }

  pending += decoder.decode();
  if (pending.length > MAX_M3U_LINE_CHARS) {
    throw new Error('M3U_LINE_TOO_LARGE');
  }
  if (pending.length > 0) yield pending;
}
