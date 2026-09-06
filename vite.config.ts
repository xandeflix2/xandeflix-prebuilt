import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    __XANDEFLIX_DEBUG_BUILD__: JSON.stringify(process.env.VITE_DEBUG_BUILD === 'true'),
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
