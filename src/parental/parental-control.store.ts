import { remainingPinBlock, validParentalClock, type ParentalClock, type ParentalPinBlock } from './parental-clock.ts';
export const PARENTAL_KDF_ITERATIONS = 600000;
export const PARENTAL_PIN_MAX_FAILURES = 6;
export const PARENTAL_PIN_BLOCK_MS = 3 * 60 * 60 * 1000;
export const PARENTAL_AGES = [0, 10, 12, 14, 16, 18] as const;
export interface ParentalPolicy { maxAge: number; allowAdult: boolean }
export interface ParentalRule { key: string; minAge: number; alwaysPin: boolean; adult: boolean }
export interface ParentalStorage { read(): Promise<string | null>; write(value: string): Promise<void> }
interface Verifier { salt: string; hash: string }
interface RecordV1 { version: 1; iterations: number; pin: Verifier; puk: Verifier; policy: ParentalPolicy; failures: number; blockedUntil: number; pinBlock?: ParentalPinBlock; rules: ParentalRule[] }
export interface ParentalSnapshot {
  status: 'loading' | 'unconfigured' | 'ready' | 'error'; policy: ParentalPolicy;
  admin: boolean; adultSession: boolean; busy: boolean; revision: number;
  contentRevision: number;
  lockRevision: number;
  grantRevision: number;
  prompt: { id: number; reason: string } | null;
}
const hex = (v: ArrayBuffer | Uint8Array) => [...new Uint8Array(v)].map(n => n.toString(16).padStart(2, '0')).join('');
const bytes = (v: string) => new Uint8Array(v.match(/../g)!.map(n => parseInt(n, 16)));
const equal = (a: string, b: string) => { let diff = a.length ^ b.length; for (let n = 0; n < Math.max(a.length, b.length); n++) diff |= (a.charCodeAt(n) || 0) ^ (b.charCodeAt(n) || 0); return diff === 0; };
export function validateParentalPin(pin: string): boolean { return /^\d{6}$/.test(pin); }
export function validateParentalPuk(puk: string): boolean { return puk.length >= 16 && puk.length <= 64 && !/^(.)(\1)+$/.test(puk) && puk.trim() === puk; }
function validatePolicy(policy: ParentalPolicy): ParentalPolicy {
  if (!(PARENTAL_AGES as readonly number[]).includes(policy.maxAge) || typeof policy.allowAdult !== 'boolean') throw new Error('PARENTAL_INVALID_POLICY');
  return { maxAge: policy.maxAge, allowAdult: policy.allowAdult };
}
function parse(raw: string): RecordV1 {
  if (raw.length > 65536) throw new Error('PARENTAL_INVALID_RECORD');
  const v = JSON.parse(raw) as RecordV1;
  if (v.version !== 1 || v.iterations !== PARENTAL_KDF_ITERATIONS || ![v.pin, v.puk].every(s => s && /^[a-f\d]{32}$/.test(s.salt) && /^[a-f\d]{64}$/.test(s.hash))
    || !Number.isSafeInteger(v.failures) || v.failures < 0 || !Number.isSafeInteger(v.blockedUntil) || v.blockedUntil < 0) throw new Error('PARENTAL_INVALID_RECORD');
  if (!Array.isArray(v.rules) || v.rules.length > 256) throw new Error('PARENTAL_INVALID_RECORD');
  const block = v.pinBlock;
  if (block !== undefined && (!validParentalClock({ clockId: block.clockId, elapsedMs: block.elapsedAtMs })
    || !Number.isSafeInteger(block.remainingMs) || block.remainingMs <= 0 || block.remainingMs > PARENTAL_PIN_BLOCK_MS)) throw new Error('PARENTAL_INVALID_RECORD');
  const rules = v.rules.map(validateRule);
  return { version: 1, iterations: PARENTAL_KDF_ITERATIONS, pin: { salt: v.pin.salt, hash: v.pin.hash }, puk: { salt: v.puk.salt, hash: v.puk.hash }, policy: validatePolicy(v.policy), failures: v.failures, blockedUntil: v.blockedUntil, ...(block ? { pinBlock: { clockId: block.clockId, elapsedAtMs: block.elapsedAtMs, remainingMs: block.remainingMs } } : {}), rules };
}
function validateRule(v: ParentalRule): ParentalRule {
  if (!v || !/^(movie|series|live):[a-f0-9]{32}$/.test(v.key) || !(PARENTAL_AGES as readonly number[]).includes(v.minAge) || typeof v.alwaysPin !== 'boolean' || typeof v.adult !== 'boolean') throw new Error('PARENTAL_INVALID_RULE');
  return { key: v.key, minAge: v.minAge, alwaysPin: v.alwaysPin, adult: v.adult };
}

/** Device-local verifiers/preferences only; no source IDs, titles or remote APIs. */
export class ParentalControlStore {
  private readonly storage: ParentalStorage;
  private readonly crypto: () => Crypto;
  private readonly now: () => number;
  private readonly clock: () => Promise<ParentalClock>;
  private blockTimer?: ReturnType<typeof setTimeout>;
  private record?: RecordV1;
  private loaded?: Promise<void>;
  private listeners = new Set<() => void>();
  private adminUntil = 0;
  private adultUntil = 0;
  private grants = new Map<string, number>();
  private classifications = new Map<string, number>();
  private prompt?: { id: number; key: string; adult: boolean; unlockSession?: boolean; epoch?: number; finish: (allowed: boolean) => void };
  private expiry?: ReturnType<typeof setTimeout>;
  private lockEpoch = 0;
  private snapshot: ParentalSnapshot = { status: 'loading', policy: { maxAge: 18, allowAdult: false }, admin: false, adultSession: false, busy: false, revision: 0, contentRevision: 0, lockRevision: 0, grantRevision: 0, prompt: null };
  constructor(options: { storage: ParentalStorage; crypto?: () => Crypto; now?: () => number; clock?: () => Promise<ParentalClock> }) {
    this.storage = options.storage; this.crypto = options.crypto || (() => globalThis.crypto); this.now = options.now || Date.now;
    this.clock = options.clock || (options.now ? async () => ({ clockId: 'fixture', elapsedMs: this.now() })
      : async () => (await import('./parental-storage.ts')).readParentalClock());
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.snapshot;
  private emit() {
    this.snapshot = { ...this.snapshot, policy: this.record ? { ...this.record.policy } : this.snapshot.policy,
      admin: this.adminUntil > this.now(), adultSession: this.adultUntil > this.now(), revision: this.snapshot.revision + 1 };
    for (const listener of this.listeners) listener();
  }
  load(): Promise<void> {
    return this.loaded ||= (async () => {
      try { const raw = await this.storage.read(); if (raw !== null) this.record = parse(raw);
        this.snapshot.status = this.record ? 'ready' : 'unconfigured';
      } catch { this.snapshot.status = 'error'; }
      this.emit(); this.scheduleBlockCheckpoint();
    })();
  }
  private async save(record: RecordV1) {
    try {
      const raw = JSON.stringify(record); await this.storage.write(raw);
      if (await this.storage.read() !== raw) throw new Error('PARENTAL_WRITE_FAILED');
      if (JSON.stringify(this.record?.policy) !== JSON.stringify(record.policy) || JSON.stringify(this.record?.rules) !== JSON.stringify(record.rules)) this.snapshot.contentRevision++;
      this.record = record; this.snapshot.status = 'ready'; this.emit();
    } catch { this.snapshot.status = 'error'; this.lock(); throw new Error('PARENTAL_STORAGE_UNAVAILABLE'); }
  }
  private async run<T>(operation: () => Promise<T>): Promise<T> {
    await this.load();
    if (this.snapshot.busy) throw new Error('PARENTAL_BUSY');
    if (this.snapshot.status === 'error') throw new Error('PARENTAL_STORAGE_UNAVAILABLE');
    this.snapshot.busy = true; this.emit();
    try { return await operation(); } finally { this.snapshot.busy = false; this.emit(); }
  }
  private cryptoApi() { const api = this.crypto(); if (!api?.subtle || !api.getRandomValues) throw new Error('PARENTAL_CRYPTO_UNAVAILABLE'); return api; }
  generatePuk(): string { return hex(this.cryptoApi().getRandomValues(new Uint8Array(16))).toUpperCase(); }
  private async verifier(secret: string, salt = hex(this.cryptoApi().getRandomValues(new Uint8Array(16)))): Promise<Verifier> {
    const api = this.cryptoApi();
    const key = await api.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveBits']);
    return { salt, hash: hex(await api.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: bytes(salt), iterations: PARENTAL_KDF_ITERATIONS }, key, 256)) };
  }
  async configure(pin: string, puk: string, policy: ParentalPolicy) {
    return this.run(async () => {
      const epoch = this.lockEpoch;
      if (this.record) throw new Error('PARENTAL_ALREADY_CONFIGURED');
      if (!validateParentalPin(pin) || !validateParentalPuk(puk) || pin === puk) throw new Error('PARENTAL_INVALID_SECRET');
      const valid = validatePolicy(policy), pinVerifier = await this.verifier(pin), pukVerifier = await this.verifier(puk);
      await this.save({ version: 1, iterations: PARENTAL_KDF_ITERATIONS, pin: pinVerifier, puk: pukVerifier, policy: valid, failures: 0, blockedUntil: 0, rules: [] });
      if (epoch === this.lockEpoch) this.adminUntil = this.now() + 120000; this.emit(); this.scheduleExpiry();
    });
  }
  private async check(secret: string, kind: 'pin' | 'puk'): Promise<boolean> {
    if (await this.refreshPinBlock()) throw new Error('PARENTAL_COOLDOWN');
    const record = this.record;
    if (!record) throw new Error('PARENTAL_NOT_CONFIGURED');
    const valid = kind === 'pin' ? validateParentalPin(secret) : validateParentalPuk(secret);
    const allowed = valid && equal((await this.verifier(secret, record[kind].salt)).hash, record[kind].hash);
    const failures = allowed ? 0 : Math.min(PARENTAL_PIN_MAX_FAILURES, record.failures + 1);
    const blockedUntil = !allowed && failures >= PARENTAL_PIN_MAX_FAILURES ? this.now() + PARENTAL_PIN_BLOCK_MS : 0;
    let clock: ParentalClock | undefined;
    if (blockedUntil) { try { clock = await this.readClock(); } catch { /* Persist the block even if its clock is temporarily unavailable. */ } }
    await this.save({ ...record, failures, blockedUntil, pinBlock: clock ? { clockId: clock.clockId, elapsedAtMs: clock.elapsedMs, remainingMs: PARENTAL_PIN_BLOCK_MS } : undefined });
    this.scheduleBlockCheckpoint();
    if (blockedUntil) {
      this.lockEpoch++; this.adminUntil = 0; this.adultUntil = 0; this.grants.clear(); this.emit(); this.scheduleExpiry();
      throw new Error('PARENTAL_COOLDOWN');
    }
    return allowed;
  }
  private async readClock(): Promise<ParentalClock> {
    try { const clock = await this.clock(); if (validParentalClock(clock)) return clock; } catch { /* Fail closed. */ }
    throw new Error('PARENTAL_CLOCK_UNAVAILABLE');
  }
  private async refreshPinBlock(): Promise<boolean> {
    const record = this.record;
    if (!record || (!record.pinBlock && record.blockedUntil === 0)) return false;
    const clock = await this.readClock();
    const remainingMs = record.pinBlock ? remainingPinBlock(record.pinBlock, clock) : PARENTAL_PIN_BLOCK_MS;
    await this.save({ ...record, failures: remainingMs ? record.failures : 0, blockedUntil: remainingMs ? record.blockedUntil : 0,
      pinBlock: remainingMs ? { clockId: clock.clockId, elapsedAtMs: clock.elapsedMs, remainingMs } : undefined });
    return remainingMs > 0;
  }
  private scheduleBlockCheckpoint(): void {
    if (this.blockTimer) clearTimeout(this.blockTimer);
    if (!this.record?.pinBlock && !this.record?.blockedUntil) return;
    this.blockTimer = setTimeout(async () => {
      try { if (!this.snapshot.busy) await this.run(async () => { await this.refreshPinBlock(); }); }
      catch { /* The next access still verifies the block; clock errors never grant access. */ }
      finally { this.scheduleBlockCheckpoint(); }
    }, 30000);
    (this.blockTimer as unknown as { unref?: () => void }).unref?.();
  }
  async authenticate(pin: string): Promise<boolean> {
    return this.run(async () => { const epoch = this.lockEpoch, ok = await this.check(pin, 'pin'); if (ok && epoch === this.lockEpoch) { this.adminUntil = this.now() + 120000; this.emit(); this.scheduleExpiry(); return true; } return false; });
  }
  private requireAdmin() { if (this.adminUntil <= this.now()) throw new Error('PARENTAL_PIN_REQUIRED'); }
  async updatePolicy(policy: ParentalPolicy) {
    return this.run(async () => { this.requireAdmin(); const next = validatePolicy(policy); this.grants.clear(); this.adultUntil = 0; await this.save({ ...this.record!, policy: next }); });
  }
  async changePin(current: string, pin: string): Promise<boolean> {
    return this.run(async () => { this.requireAdmin(); if (!validateParentalPin(pin)) throw new Error('PARENTAL_INVALID_SECRET'); if (!await this.check(current, 'pin')) return false;
      await this.save({ ...this.record!, pin: await this.verifier(pin) }); this.lock(); return true; });
  }
  async recoverPin(puk: string, pin: string): Promise<boolean> {
    return this.run(async () => { if (!validateParentalPin(pin)) throw new Error('PARENTAL_INVALID_SECRET'); if (!await this.check(puk, 'puk')) return false;
      await this.save({ ...this.record!, pin: await this.verifier(pin) }); this.lock(); return true; });
  }
  async changePuk(current: string, next: string): Promise<boolean> {
    return this.run(async () => { this.requireAdmin(); if (!validateParentalPuk(next)) throw new Error('PARENTAL_INVALID_SECRET'); if (!await this.check(current, 'puk')) return false;
      await this.save({ ...this.record!, puk: await this.verifier(next) }); return true; });
  }
  async unlockAdult(pin: string): Promise<boolean> {
    return this.run(async () => { const epoch = this.lockEpoch; if (!this.record?.policy.allowAdult) throw new Error('PARENTAL_ADULT_DISABLED'); if (this.record.policy.maxAge < 18) throw new Error('PARENTAL_ADULT_AGE_LIMIT'); if (!await this.check(pin, 'pin') || epoch !== this.lockEpoch) return false;
      this.adultUntil = this.now() + 900000; this.emit(); this.scheduleExpiry(); return true; });
  }
  adultVisible(): boolean { return this.snapshot.status === 'ready' && this.record?.policy.allowAdult === true && this.record.policy.maxAge === 18 && this.adultUntil > this.now(); }
  isGranted(key: string): boolean { return this.snapshot.status !== 'error' && (this.grants.get(key) || 0) > this.now(); }
  lock() { this.lockEpoch++; this.snapshot.lockRevision++; this.adminUntil = 0; this.adultUntil = 0; this.grants.clear(); this.cancelPrompt(); if (this.expiry) clearTimeout(this.expiry); this.emit(); }
  closeAdministration() { this.adminUntil = 0; this.emit(); }
  private scheduleExpiry() {
    if (this.expiry) clearTimeout(this.expiry);
    const times = [this.adminUntil, this.adultUntil, ...this.grants.values()].filter(t => t > this.now());
    if (times.length) this.expiry = setTimeout(() => {
      const before = this.grants.size; for (const [key, time] of this.grants) if (time <= this.now()) this.grants.delete(key);
      if (this.grants.size !== before) this.snapshot.grantRevision++;
      if (this.prompt?.adult && !this.adultVisible()) this.cancelPrompt();
      this.emit(); this.scheduleExpiry();
    }, Math.min(...times) - this.now() + 5);
  }
  rule(key: string): ParentalRule | undefined { const value = this.record?.rules.find(r => r.key === key); return value ? { ...value } : undefined; }
  rules(): ParentalRule[] { return this.record?.rules.map(r => ({ ...r })) || []; }
  knownAge(key: string): number | undefined { return this.classifications.get(key); }
  presentationChanged = () => { if (this.snapshot.status === 'ready') this.emit(); };
  rememberAge(key: string, age: number | undefined) {
    if (!/^(movie|series):[a-f0-9]{32}$/.test(key) || age === undefined || !(PARENTAL_AGES as readonly number[]).includes(age)) return;
    const previous = this.classifications.get(key);
    if (previous !== undefined && previous >= age) return;
    this.classifications.delete(key); this.classifications.set(key, age);
    if (this.record && age > this.record.policy.maxAge) {
      for (const grant of this.grants.keys()) if (grant.endsWith(`:${key}`)) this.grants.delete(grant);
    }
    while (this.classifications.size > 512) this.classifications.delete(this.classifications.keys().next().value!);
    this.emit();
  }
  async setRule(value: ParentalRule) {
    return this.run(async () => { this.requireAdmin(); const rule = validateRule(value), rules = this.record!.rules.filter(r => r.key !== rule.key);
      if (rules.length >= 256) throw new Error('PARENTAL_RULE_LIMIT'); rules.push(rule); this.grants.clear(); await this.save({ ...this.record!, rules }); });
  }
  async removeRule(key: string) {
    return this.run(async () => { this.requireAdmin(); this.grants.clear(); await this.save({ ...this.record!, rules: this.record!.rules.filter(r => r.key !== key) }); });
  }
  async authorize(key: string, age: number | undefined, adult: boolean, alwaysPin = false, signal?: AbortSignal): Promise<boolean> {
    await this.load();
    if (signal?.aborted) return false;
    if (this.snapshot.status === 'error') throw new Error('PARENTAL_STORAGE_UNAVAILABLE');
    if (!this.record) { if (adult) throw new Error('PARENTAL_SETUP_REQUIRED'); return true; }
    if (adult && !this.adultVisible()) throw new Error('PARENTAL_ADULT_DISABLED');
    const effectiveAge = adult ? Math.max(age ?? 0, 18) : age;
    if (effectiveAge !== undefined && effectiveAge > this.record.policy.maxAge) return false;
    if (this.isGranted(key) || (!alwaysPin && !adult && age !== undefined && age <= this.record.policy.maxAge)) return true;
    if (!this.listeners.size) throw new Error('PARENTAL_PIN_REQUIRED');
    this.cancelPrompt();
    return new Promise<boolean>(resolve => { const id = this.snapshot.revision + 1;
      const abort = () => { if (this.prompt?.id === id) this.cancelPrompt(); };
      const finish = (allowed: boolean) => { signal?.removeEventListener('abort', abort); resolve(allowed); };
      this.prompt = { id, key, adult, finish }; signal?.addEventListener('abort', abort, { once: true });
      this.snapshot.prompt = { id, reason: adult ? 'Conteúdo adulto. Informe o PIN para continuar.' : alwaysPin ? 'Conteúdo protegido por uma regra manual. Informe o PIN para continuar.' : age === undefined ? 'Conteúdo sem classificação. Informe o PIN para continuar.' : 'Classificação acima do limite deste aparelho. Informe o PIN para continuar.' }; this.emit(); });
  }
  async requestAdultSession(signal?: AbortSignal): Promise<boolean> {
    await this.load();
    if (signal?.aborted) return false;
    if (this.snapshot.status === 'error') throw new Error('PARENTAL_STORAGE_UNAVAILABLE');
    if (!this.record) throw new Error('PARENTAL_SETUP_REQUIRED');
    if (!this.record.policy.allowAdult) throw new Error('PARENTAL_ADULT_DISABLED');
    if (this.record.policy.maxAge !== 18) throw new Error('PARENTAL_ADULT_AGE_LIMIT');
    if (this.adultVisible()) return true;
    if (!this.listeners.size) throw new Error('PARENTAL_PIN_REQUIRED');
    this.cancelPrompt();
    return new Promise<boolean>(resolve => {
      const id = this.snapshot.revision + 1, epoch = this.lockEpoch;
      const abort = () => { if (this.prompt?.id === id) this.cancelPrompt(); };
      const finish = (allowed: boolean) => { signal?.removeEventListener('abort', abort); resolve(allowed); };
      this.prompt = { id, key: 'adult-session', adult: false, unlockSession: true, epoch, finish };
      signal?.addEventListener('abort', abort, { once: true });
      this.snapshot.prompt = { id, reason: 'Acesso à área 18+. Informe o PIN do controle parental.' }; this.emit();
    });
  }
  async submitPrompt(id: number, pin: string): Promise<boolean> {
    return this.run(async () => { const prompt = this.prompt; if (!prompt || prompt.id !== id) return false;
      if (!await this.check(pin, 'pin')) return false;
      if (this.prompt !== prompt) return false;
      if (prompt.unlockSession) {
        if (prompt.epoch !== this.lockEpoch || !this.record?.policy.allowAdult || this.record.policy.maxAge !== 18) { this.cancelPrompt(); return false; }
        this.adultUntil = this.now() + 900000;
      } else {
        if (prompt.adult && !this.adultVisible()) { this.cancelPrompt(); return false; }
        this.grants.set(prompt.key, this.now() + 900000);
      }
      this.prompt = undefined; this.snapshot.prompt = null; this.emit(); this.scheduleExpiry(); prompt.finish(true); return true;
    });
  }
  cancelPrompt() { const current = this.prompt; this.prompt = undefined; this.snapshot.prompt = null; if (current) { current.finish(false); this.emit(); } }
}

export const parentalControl = new ParentalControlStore({ storage: {
  read: async () => (await import('./parental-storage.ts')).parentalStorage.read(),
  write: async value => (await import('./parental-storage.ts')).parentalStorage.write(value),
} });
