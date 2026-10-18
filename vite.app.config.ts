import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { resolveManagerPublicConfig } from './src/manager/public-config.ts';

export default defineConfig(({ mode }) => {
  const config = resolveManagerPublicConfig(loadEnv(mode, __dirname, 'VITE_SUPABASE_'));
  // C11 artwork contract: this application read key is intentionally public.
  // Never expose read-access JWTs or unrelated environment variables.
  const tmdb = (loadEnv(mode, __dirname, 'VITE_TMDB_API_KEY').VITE_TMDB_API_KEY || '').trim();
  if (tmdb && !/^[a-fA-F0-9]{32}$/.test(tmdb)) throw new Error('WEB_TMDB_READ_KEY_INVALID');
  return {
    base: '/app/',
    plugins: [react()],
    envPrefix: [],
    define: {
      __XANDEFLIX_DEBUG_BUILD__: 'false',
      __XANDEFLIX_WEB_VALIDATION__: 'true',
      __XANDEFLIX_WEB_PUBLIC__: 'true',
      __XANDEFLIX_WEB_TMDB_CONFIGURED__: String(Boolean(tmdb)),
      'import.meta.env.VITE_TMDB_API_KEY': JSON.stringify(tmdb),
      __XANDEFLIX_APP_PUBLIC_CONFIG__: JSON.stringify({ url: config.url, publishableKey: config.key }),
    },
    build: {
      outDir: 'tmp/c154-web-production/app',
      sourcemap: false,
      rollupOptions: { input: path.resolve(__dirname, 'app.html') },
    },
  };
});
