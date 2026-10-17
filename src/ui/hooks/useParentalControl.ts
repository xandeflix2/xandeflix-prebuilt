import { useEffect, useSyncExternalStore } from 'react';
import { parentalControl } from '../../parental/parental-control.store.ts';
export function useParentalControl() {
  const snapshot = useSyncExternalStore(parentalControl.subscribe, parentalControl.getSnapshot, parentalControl.getSnapshot);
  useEffect(() => { void parentalControl.load(); }, []);
  return snapshot;
}
