import { useSyncExternalStore } from 'react';
import { devicePresentationStore } from '../device-presentation.ts';

export function useDevicePresentation() {
  const selection = useSyncExternalStore(devicePresentationStore.subscribe, devicePresentationStore.readSelection, () => null);
  return selection?.type ?? null;
}
