export type DevicePresentation = 'PHONE' | 'TABLET' | 'TV';
export const DEVICE_PRESENTATION_KEY = 'xandeflix.device-presentation.v1';
export const DEVICE_PRESENTATION_OPEN = 'xandeflix:device-presentation-open';
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;

export function parseDevicePresentation(raw: string | null): DevicePresentation | null {
  try {
    const data = JSON.parse(raw || 'null');
    return data?.version === 1 && ['PHONE', 'TABLET', 'TV'].includes(data.type) ? data.type : null;
  } catch { return null; }
}

export class DevicePresentationStore {
  private choice: DevicePresentation | null;
  private listeners = new Set<() => void>();
  private storage?: StoragePort;
  constructor(storage?: StoragePort) {
    this.storage = storage;
    try { this.choice = parseDevicePresentation(storage?.getItem(DEVICE_PRESENTATION_KEY) || null); }
    catch { this.choice = null; }
  }
  read = (): DevicePresentation | null => this.choice;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  select(type: DevicePresentation): void {
    if (!['PHONE', 'TABLET', 'TV'].includes(type) || !this.storage) throw new Error('PRESENTATION_STORAGE_UNAVAILABLE');
    this.storage.setItem(DEVICE_PRESENTATION_KEY, JSON.stringify({ version: 1, type }));
    if (parseDevicePresentation(this.storage.getItem(DEVICE_PRESENTATION_KEY)) !== type) throw new Error('PRESENTATION_STORAGE_UNAVAILABLE');
    this.choice = type;
    this.listeners.forEach(listener => listener());
  }
}

function browserStorage(): StoragePort | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; } catch { return undefined; }
}
export const devicePresentationStore = new DevicePresentationStore(browserStorage());
export const getDevicePresentation = devicePresentationStore.read;

export function isTelevisionPresentation(userAgent: string, choice = getDevicePresentation()): boolean {
  return choice ? choice === 'TV' : /\b(?:aft\w*|firetv|googletv|crkey|hbbtv|tizen|web[0o]s|netcast|bravia|shield|stb)\b|smart[ -]?tv|android tv|fire tv|tv[ -]?box|mi[ -]?(?:box|stick)\w*/i.test(userAgent);
}

export function requiresDevicePresentation(native: boolean, platform: string, choice: DevicePresentation | null): boolean {
  return native && platform === 'android' && choice === null;
}

export function openDevicePresentation(): void {
  window.dispatchEvent(new Event(DEVICE_PRESENTATION_OPEN));
}
