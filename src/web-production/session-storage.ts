let installedFor: string | undefined;
export function scopedStorage(storage: Storage, prefix: string): Storage {
  const keys = () => Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter((key): key is string => !!key?.startsWith(prefix));
  const methods: Record<string, unknown> = {
    getItem: (key: string) => storage.getItem(prefix + key),
    setItem: (key: string, value: string) => storage.setItem(prefix + key, value),
    removeItem: (key: string) => storage.removeItem(prefix + key),
    clear: () => keys().forEach(key => storage.removeItem(key)),
    key: (index: number) => keys()[index]?.slice(prefix.length) ?? null,
  };
  return new Proxy(storage, {
    get(_target, prop) {
      if (prop === 'length') return keys().length;
      if (typeof prop === 'string' && Object.hasOwn(methods, prop)) return methods[prop];
      if (typeof prop === 'string') return storage.getItem(prefix + prop) ?? undefined;
      return Reflect.get(storage, prop);
    },
    set(_target, prop, value) { if (typeof prop !== 'string') return false; storage.setItem(prefix + prop, String(value)); return true; },
    deleteProperty(_target, prop) { if (typeof prop !== 'string') return false; storage.removeItem(prefix + prop); return true; },
    ownKeys: () => keys().map(key => key.slice(prefix.length)),
    getOwnPropertyDescriptor: (_target, prop) => {
      if (typeof prop !== 'string') return undefined;
      const value = storage.getItem(prefix + prop);
      return value === null ? undefined : { configurable: true, enumerable: true, writable: true, value };
    },
  });
}
export function installWebStorageScope(deviceId: string): void {
  if (!/^[A-Za-z0-9-]{1,128}$/.test(deviceId)) throw new Error('WEB_STORAGE_UNAVAILABLE');
  if (installedFor) { if (installedFor !== deviceId) throw new Error('WEB_ACCOUNT_RELOAD_REQUIRED'); return; }
  const prefix = `xandeflix.consumer.${deviceId}.`;
  const factory = window.indexedDB;
  const db = new Proxy(factory, {
    get(target, prop) {
      if (prop === 'open') return (name: string, version?: number) => target.open(prefix + name, version);
      if (prop === 'deleteDatabase') return (name: string) => target.deleteDatabase(prefix + name);
      if (prop === 'databases' && typeof target.databases === 'function') return async () => (await target.databases())
        .filter(info => info.name?.startsWith(prefix)).map(info => ({ ...info, name: info.name!.slice(prefix.length) }));
      const value = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  const names = ['localStorage', 'sessionStorage', 'indexedDB'] as const;
  const before = names.map(name => Object.getOwnPropertyDescriptor(window, name));
  try {
    Object.defineProperty(window, 'localStorage', { value: scopedStorage(window.localStorage, prefix), configurable: true });
    Object.defineProperty(window, 'sessionStorage', { value: scopedStorage(window.sessionStorage, prefix), configurable: true });
    Object.defineProperty(window, 'indexedDB', { value: db, configurable: true });
    const probe = '__scope_probe__';
    window.sessionStorage.setItem(probe, 'ok');
    if (window.sessionStorage.getItem(probe) !== 'ok') throw new Error('WEB_STORAGE_UNAVAILABLE');
    window.sessionStorage.removeItem(probe);
    installedFor = deviceId;
  } catch {
    names.forEach((name, index) => { const descriptor = before[index]; if (descriptor) Object.defineProperty(window, name, descriptor); });
    throw new Error('WEB_STORAGE_UNAVAILABLE');
  }
}
