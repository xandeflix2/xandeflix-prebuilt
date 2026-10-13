// Authorization proof only: never expose this value, plaintext, or envelopes to clients.
type SourceConfig = Record<string, unknown>;
type RpcClient = { rpc(name: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }> };
function hex(bytes: Uint8Array) { return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(''); }
function bytes(value: string) { if (!/^(?:[0-9a-f]{2})+$/i.test(value)) throw Error('SOURCE_POLICY_UNAVAILABLE'); return Uint8Array.from(value.match(/../g)!, byte => parseInt(byte, 16)); }
export function signalConnection(config: SourceConfig, protocol: string): string {
  const url = protocol === 'XTREAM'
    ? new URL(String(config.endpoint).trim().replace(/\/+$/, '').replace(/\/(?:player_api|get)\.php.*$/i, '') + '/get.php')
    : new URL(String(config.playlistUrl));
  url.hash = '';
  if (protocol === 'XTREAM') { url.searchParams.set('username', String(config.username).trim()); url.searchParams.set('password', String(config.password).trim()); }
  if (url.pathname.endsWith('/get.php') && url.searchParams.has('username') && url.searchParams.has('password')) {
    // Format variants of the same Xtream account cannot create extra devices.
    url.searchParams.delete('type'); url.searchParams.delete('output');
  }
  url.searchParams.sort();
  // The M3U import uses the URL and bearer token, not optional separate credentials.
  return JSON.stringify(['XANDEFLIX_SIGNAL_AUTH_V1', url.toString(), String(config.token || '').trim()]);
}
export async function signalFingerprint(config: SourceConfig, protocol: string, keyBytes: Uint8Array): Promise<string> {
  const base = await crypto.subtle.importKey('raw', new Uint8Array(keyBytes).buffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const derived = await crypto.subtle.sign('HMAC', base, new TextEncoder().encode('XANDEFLIX_PRIVATE_SIGNAL_AUTH_KEY_V1'));
  const key = await crypto.subtle.importKey('raw', derived, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signalConnection(config, protocol)))));
}
export function signalVaultKey(): Uint8Array {
  const raw = Deno.env.get('SOURCE_VAULT_KEY_V1');
  if (!raw) { console.error('SIGNAL_POLICY_BACKFILL_FAILURE', { stage: 'KEY_MISSING' }); throw Error('SOURCE_POLICY_UNAVAILABLE'); }
  const key = Uint8Array.from(atob(raw), character => character.charCodeAt(0));
  if (key.length !== 32) { console.error('SIGNAL_POLICY_BACKFILL_FAILURE', { stage: 'KEY_INVALID' }); throw Error('SOURCE_POLICY_UNAVAILABLE'); }
  return key;
}
export async function ensureSignalIndex(client: RpcClient, keyBytes: Uint8Array, replacing?: { kind: string; sourceId: string; version: number }): Promise<void> {
  const key = await crypto.subtle.importKey('raw', new Uint8Array(keyBytes).buffer, { name: 'AES-GCM' }, false, ['decrypt']);
  for (let batch = 0; batch < 20; batch++) {
    const { data, error } = await client.rpc('rpc_signal_index_pending');
    if (error || !Array.isArray(data)) { console.error('SIGNAL_POLICY_BACKFILL_FAILURE', { stage: 'READ' }); throw Error('SOURCE_POLICY_UNAVAILABLE'); }
    if (!data.length) return;
    const pending = data.filter(row => !replacing || row.kind !== replacing.kind || row.sourceId !== replacing.sourceId || row.version !== replacing.version);
    if (!pending.length) return;
    let failed = false;
    for (const row of pending) {
      // Service role receives only existing encrypted envelopes. Plaintext stays in this scope.
      let stage = 'DECRYPT';
      try {
        const encrypted = new Uint8Array([...bytes(row.ciphertext), ...bytes(row.authTag)]);
        const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(row.nonce),
          additionalData: new TextEncoder().encode(`${row.sourceId}\u0000${row.version}\u0000${row.protocol}`), tagLength: 128 }, key, encrypted);
        stage = 'CONFIG';
        const config = JSON.parse(new TextDecoder().decode(plaintext));
        const fingerprint = await signalFingerprint(config, row.protocol, keyBytes);
        stage = 'WRITE';
        const saved = await client.rpc('rpc_signal_index_record', { p_kind: row.kind, p_source_id: row.sourceId, p_version: row.version, p_fingerprint: fingerprint });
        if (saved.error) throw Error('SOURCE_POLICY_UNAVAILABLE');
      } catch { console.error('SIGNAL_POLICY_BACKFILL_FAILURE', { stage, kind: row.kind, version: row.version }); failed = true; }
    }
    if (failed) throw Error('SOURCE_POLICY_UNAVAILABLE');
  }
  throw Error('SOURCE_POLICY_PREPARING');
}
