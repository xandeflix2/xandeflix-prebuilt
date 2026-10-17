import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
/** Web getUri points into IndexedDB, not an HTTP route. Never fetch these paths from the server. */
export async function readWebCatalogFile(url: URL, method = 'GET', signal?: AbortSignal): Promise<Response | undefined> {
  if (url.origin !== location.origin || !url.pathname.startsWith('/DATA/prebuilt/')) return;
  if (!['GET','HEAD'].includes(method.toUpperCase())) return new Response(null, { status: 405 });
  let path: string;
  try { path = decodeURIComponent(url.pathname.slice('/DATA/'.length)); } catch { return new Response(null, { status: 400 }); }
  if (/[\\\u0000-\u001f]/.test(path) || path.split('/').some(p => !p || p === '.' || p === '..' || p.includes(':'))) return new Response(null, { status: 403 });
  if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
  try {
    const binary = path.endsWith('.bin'), result = await Filesystem.readFile({ path, directory: Directory.Data, ...(binary ? {} : { encoding: Encoding.UTF8 }) });
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (typeof result.data !== 'string') return new Response(null, { status: 404 });
    const body = binary ? Uint8Array.from(atob(result.data), c => c.charCodeAt(0)) : result.data;
    return new Response(method === 'HEAD' ? null : body, { headers: { 'Content-Type': binary ? 'application/octet-stream' : 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
  } catch (error) { if (signal?.aborted) throw error; return new Response(null, { status: 404 }); }
}
