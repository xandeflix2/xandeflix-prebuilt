import { resolveManagerPublicConfig } from '../manager/public-config.ts';
import { requireSecureWebContext } from '../web/validation.ts';
import { requireWebLogin } from './login.ts';

declare const __XANDEFLIX_APP_PUBLIC_CONFIG__: { url: string; publishableKey: string };

async function startPublicApplication(): Promise<void> {
  try {
    requireSecureWebContext();
    const config = resolveManagerPublicConfig({
      VITE_SUPABASE_URL: __XANDEFLIX_APP_PUBLIC_CONFIG__.url,
      VITE_SUPABASE_PUBLISHABLE_KEY: __XANDEFLIX_APP_PUBLIC_CONFIG__.publishableKey,
    });
    const runtime = globalThis as typeof globalThis & {
      __XANDEFLIX_RUNTIME_CONFIG__?: { supabase: { url: string; publishableKey: string } };
    };
    runtime.__XANDEFLIX_RUNTIME_CONFIG__ = { supabase: { url: config.url, publishableKey: config.key } };
    // Never import native first-installation services before server authentication.
    await requireWebLogin();
    await import('../main.tsx');
  } catch {
    const root = document.getElementById('root');
    if (root) {
      root.setAttribute('role', 'alert');
      root.textContent = 'Não foi possível iniciar o aplicativo. Use uma conexão HTTPS e um navegador com armazenamento disponível. Se continuar, contate o suporte.';
    }
  }
}

void startPublicApplication();
