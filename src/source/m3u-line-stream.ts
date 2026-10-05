const MAX_M3U_LINE_CHARS = 8 * 1024 * 1024;

function detachLine(line: string): string {
  if (line.length > MAX_M3U_LINE_CHARS) {
    throw new Error('M3U_LINE_TOO_LARGE');
  }
  // V8 slices can retain the entire decoded native chunk (2 MB) through a
  // short title saved in the series accumulator. Materialize only this line,
  // preserving UTF-16 exactly, before handing it to long-lived consumers.
  // slice/substring/trim alone do not detach their backing store.
  return JSON.parse(JSON.stringify(line)) as string;
}

/**
 * Converte chunks UTF-8 em linhas sem concatenar o payload inteiro.
 * A normalização CRLF/LF replica o contrato de split(/\r?\n/).
 */
export async function* iterateUtf8Lines(
  chunks: AsyncIterable<Uint8Array | string>,
): AsyncIterable<string> {
  const decoder = new TextDecoder('utf-8');
  let pending = '';

  for await (const chunk of chunks) {
    if (typeof chunk === 'string') {
      pending += chunk;
    } else {
      pending += decoder.decode(chunk, { stream: true });
    }
    let lineStart = 0;
    let newlineIndex = pending.indexOf('\n', lineStart);
    while (newlineIndex !== -1) {
      const line = pending.slice(lineStart, newlineIndex);
      yield detachLine(line.endsWith('\r') ? line.slice(0, -1) : line);
      lineStart = newlineIndex + 1;
      newlineIndex = pending.indexOf('\n', lineStart);
    }
    if (lineStart > 0) {
      pending = pending.slice(lineStart);
    }
    if (pending.length > MAX_M3U_LINE_CHARS) {
      throw new Error('M3U_LINE_TOO_LARGE');
    }
  }

  pending += decoder.decode();
  if (pending.length > MAX_M3U_LINE_CHARS) {
    throw new Error('M3U_LINE_TOO_LARGE');
  }
  if (pending.length > 0) yield detachLine(pending);
}
