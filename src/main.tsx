import React from 'react';
import ReactDOM from 'react-dom/client';
import { installWebViewBufferCompatibility } from './debug/webview-buffer-compatibility.ts';
import { bootTelemetry } from './diagnostics/boot-telemetry.ts';

installWebViewBufferCompatibility();
bootTelemetry.mark('T1_WEBVIEW_READY');

import App from './App';
import './index.css';
import {
  getSupabaseBrowserClient,
  createSupabaseManagerAuthClient,
  createSupabaseRemoteRpcClient,
  createSupabaseManagedVaultDeliveryTransport,
  createSupabaseDeviceSourceResolverClient,
  getConfiguredSourceConfigSealer,
} from './integrations/supabase/client.ts';
import { SupabaseRemoteControlPlaneAuthority } from './control-plane/client/remote-control-plane-authority.ts';
import {
  SupabaseManagerRemoteControlPlaneAuthority,
  configureManagerRemoteControlPlaneAuthority,
} from './control-plane/client/manager-remote-control-plane-authority.ts';
import { configureRemoteControlPlaneAuthority } from './control-plane/client/control-plane-client.ts';
import {
  configureManagedVaultDeviceDeliveryService,
  ManagedVaultDeviceDeliveryService,
} from './security/managed-vault-device-delivery.service.ts';
import { DeviceSelfServiceSourceResolverService } from './security/device-self-service-source-resolver.service.ts';
import {
  configureDeviceSourceDeliveryDispatcher,
  DeviceSourceDeliveryDispatcher,
} from './security/device-source-delivery-dispatcher.ts';

const supabaseClient = getSupabaseBrowserClient();
if (supabaseClient) {
  configureRemoteControlPlaneAuthority(
    new SupabaseRemoteControlPlaneAuthority(createSupabaseRemoteRpcClient(supabaseClient))
  );
  configureManagerRemoteControlPlaneAuthority(
    new SupabaseManagerRemoteControlPlaneAuthority(
      createSupabaseManagerAuthClient(supabaseClient),
      getConfiguredSourceConfigSealer()
    )
  );
  const managedDelivery = new ManagedVaultDeviceDeliveryService(
    createSupabaseManagedVaultDeliveryTransport(supabaseClient),
  );
  configureManagedVaultDeviceDeliveryService(managedDelivery);
  configureDeviceSourceDeliveryDispatcher(
    new DeviceSourceDeliveryDispatcher({
      managed: managedDelivery,
      selfService: new DeviceSelfServiceSourceResolverService(
        createSupabaseDeviceSourceResolverClient(supabaseClient),
      ),
    }),
  );
} else {
  // Mantem o estado de autoridade explicitamente indisponivel; o Manager
  // exibira o motivo sanitizado em vez de aparentar um formulario utilizavel.
  configureRemoteControlPlaneAuthority(undefined);
  configureManagerRemoteControlPlaneAuthority(undefined);
  configureManagedVaultDeviceDeliveryService(undefined);
  configureDeviceSourceDeliveryDispatcher(undefined);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
