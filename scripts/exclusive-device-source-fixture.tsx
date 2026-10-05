import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from '../src/ui/components/AppShell.tsx';
import { AdminCustomersView } from '../src/debug/manager/AdminCustomersView.tsx';
import type { ExclusiveSourceAuthority } from '../src/debug/manager/exclusive-device-source.ts';
import type { AppView } from '../src/ui/navigation/route-state.ts';
import type { ManagerControlPlaneSnapshot } from '../src/control-plane/client/manager-remote-control-plane-authority.ts';
import type { ManagerCustomerDetail } from '../src/control-plane/control-plane.types.ts';
import '../src/index.css';

// Type-only authority imports: no App/Supabase client/identity or real data is loaded.
const errors: string[] = [];
window.addEventListener('error', event => errors.push(event.message));
window.addEventListener('unhandledrejection', () => errors.push('UNHANDLED_REJECTION'));
const fetchLocal = window.fetch.bind(window);
window.fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : String(input), location.href);
  if (url.origin !== location.origin) { errors.push('EXTERNAL_REQUEST_BLOCKED'); return Promise.reject(new Error('EXTERNAL_REQUEST_BLOCKED')); }
  return fetchLocal(input, init);
};
const now = '2026-01-01T00:00:00Z';
const detail: ManagerCustomerDetail = {
  success: true, customer: { customerId: 'synthetic-customer', nickname: 'Cliente sintético', status: 'ACTIVE', trialUsedAt: null, createdAt: now, updatedAt: now },
  licenses: [{ licenseId: 'synthetic-license-a', mode: 'MANAGED', status: 'ACTIVE', trialEligible: false, trialStartedAt: null, trialExpiresAt: null, maxDevices: 1, maxConcurrentSessions: 1, activeDevicesCount: 1, createdAt: now, expiresAt: null }],
  devices: [{ deviceId: 'synthetic-a', displayCode: 'XF-TEST-0001', deviceType: 'PHONE', deviceLabel: 'Aparelho sintético', status: 'AUTHORIZED', licenseId: 'synthetic-license-a', boundAt: now }], sources: [],
};
let snapshot: ManagerControlPlaneSnapshot;
let creates = 0, switches = 0, applied = 0, failSwitch = false;
function reset() {
  snapshot = {
    licenses: [{ id: 'synthetic-license-a', mode: 'MANAGED', status: 'ACTIVE', licenseKeyHash: 'synthetic-not-real', maxDevices: 1, createdAtIso: now }], devices: [{ id: 'synthetic-a', deviceId: 'synthetic-a', displayCode: 'XF-TEST-0001', deviceType: 'PHONE', deviceLabel: 'Aparelho sintético', status: 'AUTHORIZED', createdAtIso: now }],
    licenseBindings: [{ id: 'binding-a', deviceId: 'synthetic-a', licenseId: 'synthetic-license-a', status: 'ACTIVE', boundAtIso: now }],
    managedSources: [{ id: 'src_shared', sourceId: 'src_shared', name: 'Fonte compartilhada sintética', sourceType: 'M3U', version: 1, status: 'ACTIVE', vaultStatus: 'CONFIGURED', createdAtIso: now, updatedAtIso: now }],
    sourceBindings: [{ id: 'source-binding-a', deviceId: 'synthetic-a', licenseId: 'synthetic-license-a', sourceId: 'src_shared', createdAtIso: now }, { id: 'source-binding-b', deviceId: 'synthetic-b', licenseId: 'synthetic-license-b', sourceId: 'src_shared', createdAtIso: now }],
  };
  // The existing remote DTO casts JSON null into an optional TS expiry property.
  Object.assign(snapshot.licenses[0], { expiresAtIso: null });
  creates = switches = applied = 0; failSwitch = false;
}
reset();
const authority: ExclusiveSourceAuthority = {
  auth: { getSession: async () => ({ userId: 'synthetic-manager' }), signInWithPassword: async () => { throw new Error('DISABLED'); }, signOut: async () => {} },
  getCustomerDetail: async () => structuredClone(detail),
  readControlPlane: async () => structuredClone(snapshot),
  createManagedSourceWithConfig: async () => {
    creates++;
    await new Promise(resolve => setTimeout(resolve, 150));
    snapshot.managedSources.push({ ...snapshot.managedSources[0], id: 'src_exclusive', sourceId: 'src_exclusive', name: 'Fonte exclusiva sintética' });
    return { success: true, sourceId: 'src_exclusive' };
  },
  switchDeviceSource: async (id, sourceId) => {
    switches++;
    if (failSwitch) throw new Error('SYNTHETIC_NETWORK_FAILURE');
    snapshot.sourceBindings.find(binding => binding.deviceId === id)!.sourceId = sourceId;
    return { success: true, newSourceId: sourceId };
  },
};
(window as any).__EXCLUSIVE_FIXTURE__ = {
  reset, failSwitch: (value: boolean) => { failSwitch = value; },
  evidence: () => ({ creates, switches, applied, bindings: snapshot.sourceBindings, original: snapshot.managedSources[0], errors }),
};
function Fixture() {
  const [view, setView] = useState<AppView>('home');
  const manager = new URLSearchParams(location.search).has('manager');
  return <AppShell currentView={view} onNavigate={setView} onBack={() => setView('home')} canGoBack={view !== 'home'} catalogVersion="Sincronizando...">
    <main style={{ padding: 16 }}>
      {manager ? <AdminCustomersView customers={[{ ...detail.customer, licensesCount: 1 }]} onInspectCustomer={authority.getCustomerDetail!} onUpdateCustomerStatus={async () => false} sourceAuthority={authority} onDeviceSourceApplied={() => { applied++; }} /> : <>
        <h1 data-testid="route">{view}</h1><p>Fixture UI isolada, sem ativação ou rede externa.</p>
        <button className="focusable-item" onClick={() => setView('movie-detail')}>Detalhes sintéticos</button>
      </>}
    </main>
  </AppShell>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
