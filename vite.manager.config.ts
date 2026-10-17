import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { resolveManagerPublicConfig } from './src/manager/public-config.ts';

export default defineConfig(({ mode }) => {
  const config = resolveManagerPublicConfig(loadEnv(mode, __dirname, 'VITE_SUPABASE_'));
  return {
    plugins: [react()],
    envPrefix: [],
    define: {
      __XANDEFLIX_DEBUG_BUILD__: 'false',
      __XANDEFLIX_WEB_VALIDATION__: 'false',
      __XANDEFLIX_MANAGER_PUBLIC_CONFIG__: JSON.stringify({ url: config.url, publishableKey: config.key }),
    },
    build: {
      outDir: 'tmp/c151-manager-production/site',
      sourcemap: false,
      rollupOptions: { input: path.resolve(__dirname, 'manager.html') },
    },
  };
});
