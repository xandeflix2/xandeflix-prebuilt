export interface RecoveryEnvelope { version: 1; deviceId: string; publicKey: string; salt: string; iv: string; ciphertext: string }
const hex = (value: ArrayBuffer | Uint8Array) => [...new Uint8Array(value)].map(n => n.toString(16).padStart(2, '0')).join('');
export const recoveryBytes = (value: string): Uint8Array => {
  if (!/^(?:[a-f0-9]{2})+$/.test(value)) throw new Error('WEB_PIN_RECOVERY_INVALID');
  return new Uint8Array(value.match(/../g)!.map(pair => parseInt(pair, 16)));
};
export function parseRecoveryEnvelope(raw: string): RecoveryEnvelope {
  if (raw.length > 4096) throw new Error('WEB_PIN_RECOVERY_INVALID');
  const v = JSON.parse(raw) as RecoveryEnvelope;
  if (v.version !== 1 || !/^[A-Za-z0-9-]{1,128}$/.test(v.deviceId) || !/^[a-f0-9]{182}$/.test(v.publicKey)
    || !/^[a-f0-9]{32}$/.test(v.salt) || !/^[a-f0-9]{24}$/.test(v.iv) || !/^[a-f0-9]{100,2048}$/.test(v.ciphertext)) throw new Error('WEB_PIN_RECOVERY_INVALID');
  return { version: 1, deviceId: v.deviceId, publicKey: v.publicKey, salt: v.salt, iv: v.iv, ciphertext: v.ciphertext };
}
async function wrappingKey(puk: string, salt: string): Promise<CryptoKey> {
  if (puk.length < 16 || puk.length > 64 || puk.trim() !== puk) throw new Error('WEB_PIN_RECOVERY_DENIED');
  const input = await crypto.subtle.importKey('raw', new TextEncoder().encode(puk), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: recoveryBytes(salt), iterations: 600000 }, input, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
const aad = (v: Pick<RecoveryEnvelope, 'deviceId' | 'publicKey'>) => new TextEncoder().encode(`xandeflix:c156:${v.deviceId}:${v.publicKey}`);
async function seal(deviceId: string, publicKey: string, privateBytes: ArrayBuffer, puk: string): Promise<RecoveryEnvelope> {
  const salt = hex(crypto.getRandomValues(new Uint8Array(16))), iv = hex(crypto.getRandomValues(new Uint8Array(12)));
  const envelope = { version: 1 as const, deviceId, publicKey, salt, iv, ciphertext: '' };
  envelope.ciphertext = hex(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: recoveryBytes(iv), additionalData: aad(envelope) }, await wrappingKey(puk, salt), privateBytes));
  return parseRecoveryEnvelope(JSON.stringify(envelope));
}
async function unseal(envelope: RecoveryEnvelope, puk: string): Promise<ArrayBuffer> {
  const v = parseRecoveryEnvelope(JSON.stringify(envelope));
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: recoveryBytes(v.iv), additionalData: aad(v) }, await wrappingKey(puk, v.salt), recoveryBytes(v.ciphertext));
}
export async function createRecoveryEnvelope(deviceId: string, puk: string): Promise<RecoveryEnvelope> {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const privateBytes = await crypto.subtle.exportKey('pkcs8', pair.privateKey);
  try { return await seal(deviceId, hex(await crypto.subtle.exportKey('spki', pair.publicKey)), privateBytes, puk); }
  finally { new Uint8Array(privateBytes).fill(0); }
}
export async function rewrapRecoveryEnvelope(v: RecoveryEnvelope, currentPuk: string, nextPuk: string): Promise<RecoveryEnvelope> {
  const privateBytes = await unseal(v, currentPuk);
  try { return await seal(v.deviceId, v.publicKey, privateBytes, nextPuk); }
  finally { new Uint8Array(privateBytes).fill(0); }
}
export async function signRecoveryChallenge(v: RecoveryEnvelope, puk: string, challenge: string, newPin: string): Promise<string> {
  if (!/^\d{6}$/.test(newPin) || challenge.length > 1024 || !challenge.startsWith('xandeflix:c156:')) throw new Error('WEB_PIN_RECOVERY_DENIED');
  const privateBytes = await unseal(v, puk);
  try {
    const key = await crypto.subtle.importKey('pkcs8', privateBytes, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    const digest = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(newPin)));
    return hex(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(`${challenge}:${digest}`)));
  } finally { new Uint8Array(privateBytes).fill(0); }
}
