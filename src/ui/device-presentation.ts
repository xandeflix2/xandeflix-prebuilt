export type DevicePresentation = 'PHONE' | 'TABLET' | 'TV';
export const devicePresentationModels = {
  PHONE: { type: 'PHONE', title: 'Celular', description: 'Celular com tela convencional e navegação por toque.' },
  FOLDABLE: { type: 'PHONE', title: 'Celular dobrável', description: 'Galaxy Z Fold e outros dobráveis. A tela se adapta ao abrir e fechar.' },
  TABLET: { type: 'TABLET', title: 'Tablet', description: 'Tela ampla com navegação por toque.' },
  FIRE_TV: { type: 'TV', title: 'Fire TV / Fire Stick', description: 'Amazon Fire TV e Fire Stick.' },
  ANDROID_TV: { type: 'TV', title: 'Android TV / Google TV', description: 'TVs e dispositivos com Android TV ou Google TV.' },
  ANDROID_BOX: { type: 'TV', title: 'TV Box com Android', description: 'TV Box com Android convencional.' },
  TIZEN: { type: 'TV', title: 'Samsung Tizen', description: 'Smart TV Samsung com sistema Tizen.' },
  WEBOS: { type: 'TV', title: 'LG webOS', description: 'Smart TV LG com sistema webOS.' },
} as const;
export type DevicePresentationModel = keyof typeof devicePresentationModels;
type PresentationSelection = Readonly<{ type: DevicePresentation; model?: DevicePresentationModel }>;
export const DEVICE_PRESENTATION_KEY = 'xandeflix.device-presentation.v1';
export const DEVICE_PRESENTATION_OPEN = 'xandeflix:device-presentation-open';
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;

function parseSelection(raw: string | null): PresentationSelection | null {
  try {
    const data = JSON.parse(raw || 'null');
    if (data?.version !== 1 || !['PHONE', 'TABLET', 'TV'].includes(data.type)) return null;
    const model = typeof data.model === 'string' && Object.hasOwn(devicePresentationModels, data.model)
      && devicePresentationModels[data.model as DevicePresentationModel].type === data.type ? data.model as DevicePresentationModel : undefined;
    return { type: data.type, ...(model ? { model } : {}) };
  } catch { return null; }
}

export function parseDevicePresentation(raw: string | null): DevicePresentation | null {
  return parseSelection(raw)?.type ?? null;
}

export class DevicePresentationStore {
  private selection: PresentationSelection | null;
  private listeners = new Set<() => void>();
  private storage?: StoragePort;
  constructor(storage?: StoragePort) {
    this.storage = storage;
    try { this.selection = parseSelection(storage?.getItem(DEVICE_PRESENTATION_KEY) || null); }
    catch { this.selection = null; }
  }
  read = (): DevicePresentation | null => this.selection?.type ?? null;
  readModel = (): DevicePresentationModel | null => this.selection?.model ?? null;
  readSelection = (): PresentationSelection | null => this.selection;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  select(type: DevicePresentation, model?: DevicePresentationModel): void {
    if (!['PHONE', 'TABLET', 'TV'].includes(type) || !this.storage
      || (model !== undefined && (!Object.hasOwn(devicePresentationModels, model) || devicePresentationModels[model].type !== type))) {
      throw new Error('PRESENTATION_STORAGE_UNAVAILABLE');
    }
    const selection = { type, ...(model ? { model } : {}) };
    this.storage.setItem(DEVICE_PRESENTATION_KEY, JSON.stringify({ version: 1, ...selection }));
    const stored = parseSelection(this.storage.getItem(DEVICE_PRESENTATION_KEY));
    if (stored?.type !== type || stored.model !== model) throw new Error('PRESENTATION_STORAGE_UNAVAILABLE');
    this.selection = selection;
    this.listeners.forEach(listener => listener());
  }
  selectModel(model: DevicePresentationModel): void {
    if (!Object.hasOwn(devicePresentationModels, model)) throw new Error('PRESENTATION_STORAGE_UNAVAILABLE');
    this.select(devicePresentationModels[model].type, model);
  }
}

function browserStorage(): StoragePort | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; } catch { return undefined; }
}
export const devicePresentationStore = new DevicePresentationStore(browserStorage());
export const getDevicePresentation = devicePresentationStore.read;
export const getDevicePresentationModel = devicePresentationStore.readModel;

export function isTelevisionPresentation(userAgent: string, choice = getDevicePresentation()): boolean {
  return choice ? choice === 'TV' : /\b(?:aft\w*|firetv|googletv|crkey|hbbtv|tizen|web[0o]s|netcast|bravia|shield|stb)\b|smart[ -]?tv|android tv|fire tv|tv[ -]?box|mi[ -]?(?:box|stick)\w*/i.test(userAgent);
}

export function isFireTvPresentation(userAgent: string, choice = getDevicePresentation(), model = getDevicePresentationModel()): boolean {
  if (!isTelevisionPresentation(userAgent, choice)) return false;
  return model ? model === 'FIRE_TV' : /\bAFT\w*/i.test(userAgent);
}

export function requiresDevicePresentation(native: boolean, platform: string, choice: DevicePresentation | null): boolean {
  return native && platform === 'android' && choice === null;
}

export function openDevicePresentation(): void {
  window.dispatchEvent(new Event(DEVICE_PRESENTATION_OPEN));
}
