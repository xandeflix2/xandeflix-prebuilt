import React from 'react';
import { ManagerPanelPage } from '../debug/manager/ManagerPanelPage.tsx';
import { ManagerPasswordRecovery } from '../debug/manager/ManagerPasswordRecovery.tsx';
import { isManagerRecoveryLocation } from '../debug/manager/manager-password-recovery.ts';
import { getSupabaseBrowserClient, createSupabaseManagerAuthClient } from '../integrations/supabase/client.ts';
import { getSupabaseRuntimeConfig } from '../integrations/supabase/runtime-config.ts';
import { SupabaseManagerRemoteControlPlaneAuthority, configureManagerRemoteControlPlaneAuthority } from '../control-plane/client/manager-remote-control-plane-authority.ts';
import { resolveManagerPublicConfig } from './public-config.ts';

/** Capture recovery intent before the Auth SDK consumes its URL fragment. */
export function createManagerApplication(location: Pick<Location, 'pathname' | 'hash' | 'search'>): React.ReactElement {
  const recovery = isManagerRecoveryLocation(location);
  const hash = new URLSearchParams(location.hash.slice(1));
  const recoveryLink = hash.get('type') === 'recovery';
  const linkError = hash.has('error') || new URLSearchParams(location.search).has('error');
  try {
    const config = getSupabaseRuntimeConfig();
    resolveManagerPublicConfig({ VITE_SUPABASE_URL: config?.url, VITE_SUPABASE_PUBLISHABLE_KEY: config?.key });
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error('MANAGER_AUTH_UNAVAILABLE');
    configureManagerRemoteControlPlaneAuthority(new SupabaseManagerRemoteControlPlaneAuthority(createSupabaseManagerAuthClient(client)));
    return recovery
      ? <ManagerPasswordRecovery client={client} recoveryLink={recoveryLink} linkError={linkError}/>
      : <ManagerPanelPage onBack={() => window.location.assign('/')}/>;
  } catch {
    configureManagerRemoteControlPlaneAuthority(undefined);
    return <main style={{ padding: '2rem' }}>
      <h1>Painel administrativo Xandeflix</h1>
      <p role="alert">O serviço de acesso está indisponível. Confira a configuração de publicação do painel.</p>
    </main>;
  }
}
