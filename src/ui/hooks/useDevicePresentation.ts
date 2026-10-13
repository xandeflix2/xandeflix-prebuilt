import { useSyncExternalStore } from 'react';
import { devicePresentationStore } from '../device-presentation.ts';

export function useDevicePresentation() {
  return useSyncExternalStore(devicePresentationStore.subscribe, devicePresentationStore.read, () => null);
}
