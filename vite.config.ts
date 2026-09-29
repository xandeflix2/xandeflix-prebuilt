import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function controlPlaneApiPlugin(): Plugin {
  const stateFilePath = path.resolve(__dirname, 'tmp', 'control-plane-state.json');

  function readState() {
    if (fs.existsSync(stateFilePath)) {
      try {
        return JSON.parse(fs.readFileSync(stateFilePath, 'utf-8'));
      } catch {}
    }
    return { licenses: [], devices: [], licenseBindings: [], managedSources: [], sourceBindings: [] };
  }

  function writeState(state: any) {
    const dir = path.dirname(stateFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
  }

  return {
    name: 'control-plane-api',
    configureServer(server) {
      server.middlewares.use('/api/control-plane/state', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify(readState()));
      });

      server.middlewares.use('/api/control-plane/sync', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              writeState(data);
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ success: true }));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.statusCode = 204;
          res.end();
        } else {
          res.statusCode = 405;
          res.end();
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), controlPlaneApiPlugin()],
  define: {
    __XANDEFLIX_DEBUG_BUILD__: JSON.stringify(
      process.env.VITE_DEBUG_BUILD ? process.env.VITE_DEBUG_BUILD.trim() === 'true' : mode === 'development'
    ),
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}));
