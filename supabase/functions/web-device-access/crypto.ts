const encoder = new TextEncoder();
export const PIN_ITERATIONS = 600000;
export const randomHex = (size: number): string => hex(crypto.getRandomValues(new Uint8Array(size)));
const hex = (bytes: Uint8Array): string => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
export async function sha256(value: string): Promise<string> {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}
export async function protect(value: string, serverSecret: string, domain: string): Promise<string> {
  if (serverSecret.length < 32) throw new Error('UNAVAILABLE');
  const root = await crypto.subtle.importKey('raw', encoder.encode(serverSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const derived = await crypto.subtle.sign('HMAC', root, encoder.encode('xandeflix:c155:' + domain + ':v1'));
  const key = await crypto.subtle.importKey('raw', derived, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))));
}
export async function pinVerifier(pin: string, salt: string, serverSecret: string): Promise<string> {
  if (!/^\d{6}$/.test(pin) || !/^[0-9a-f]{32}$/.test(salt)) throw new Error('DENIED');
  const key = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const saltBytes = Uint8Array.from(salt.match(/../g)!, byte => parseInt(byte, 16));
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: PIN_ITERATIONS }, key, 256);
  return protect(salt + ':' + hex(new Uint8Array(bits)), serverSecret, 'pin');
}
export function equalVerifier(left: string, right: string): boolean {
  let diff = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i++) diff |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  return diff === 0;
}
export async function verifyRecovery(publicKey: string, challenge: string, pin: string, signature: string): Promise<boolean> {
  try {
    if (!/^[0-9a-f]{182}$/.test(publicKey) || !/^[0-9a-f]{128}$/.test(signature) || !/^\d{6}$/.test(pin) || challenge.length > 1024) return false;
    const bytes = (v: string) => Uint8Array.from(v.match(/../g)!, b => parseInt(b, 16));
    const key = await crypto.subtle.importKey('spki', bytes(publicKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, bytes(signature), encoder.encode(`${challenge}:${await sha256(pin)}`));
  } catch { return false; }
}
